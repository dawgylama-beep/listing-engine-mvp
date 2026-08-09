import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { sha256Bytes, sha256Json, stableJson } from "./protocol.mjs";
import { inspectPublicIdentifierAtLocation, publicIdentifierContractForActualPath, typedPublicIdentifierPaths } from "./typed-public-identifier.mjs";
import { PUBLIC_IDENTIFIER_CONTRACT_MANIFEST, validatePublicIdentifierContractManifest } from "./public-identifier-contract-manifest.mjs";

export const SANITIZER_DECISION_SCHEMA_VERSION = "1.0";
const HASH = /^[a-f0-9]{64}$/;

function normalizedSecretFieldName(value) {
  return String(value).replace(/[^A-Za-z0-9]/g, "").toLowerCase();
}

function prohibitedSecretField(key, parentPath) {
  const normalized = normalizedSecretFieldName(key);
  if (new Set([
    "apikey", "openaiapikey", "serperapikey", "secret", "secretvalue", "clientsecret", "password", "passphrase",
    "token", "accesstoken", "refreshtoken", "authorization", "cookie", "setcookie", "session", "sessionid",
    "credential", "credentials", "credentialvalue", "privatekey", "accesskey", "keyvalue", "environment", "env",
    "processenv", "requestheaders", "providerheaders", "providerrequestheaders", "outboundheaders"
  ]).has(normalized)) return true;
  return normalized === "headers" && /(?:providerAttemptTelemetry|providerRequests)/.test(parentPath);
}

function highEntropyCredentialLike(value) {
  if (value.length < 32 || value.length > 512 || /\s/.test(value)) return false;
  if (/^[a-f0-9]{32,64}$/i.test(value)) return false;
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value) || !/[^A-Za-z0-9]/.test(value)) return false;
  const frequencies = new Map();
  for (const character of value) frequencies.set(character, (frequencies.get(character) || 0) + 1);
  const entropy = [...frequencies.values()].reduce((total, count) => {
    const probability = count / value.length;
    return total - probability * Math.log2(probability);
  }, 0);
  return entropy >= 4;
}

function stringClassifiers(value, knownSecretValues) {
  const ruleIds = [];
  const credential = [];
  const add = (rule, classification) => { ruleIds.push(rule); credential.push(classification); };
  if (/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{8,}\b/i.test(value)) add("CREDENTIAL_API_KEY_OPENAI", "API_KEY");
  if (/\b(?:AIza[0-9A-Za-z_-]{20,}|(?:gh[oprsu]|github_pat)_[0-9A-Za-z_]{20,}|xox[baprs]-[0-9A-Za-z-]{10,})\b/.test(value)) add("CREDENTIAL_API_KEY_GENERIC", "API_KEY");
  if (/\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i.test(value)) add("CREDENTIAL_BEARER_TOKEN", "BEARER_TOKEN");
  if (/\bBasic\s+[A-Za-z0-9+/]{8,}={0,2}/i.test(value)) add("CREDENTIAL_BASIC_AUTH", "BASIC_AUTH");
  if (/\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\b/.test(value)) add("CREDENTIAL_JWT", "JWT");
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(value)) add("CREDENTIAL_PRIVATE_KEY", "PRIVATE_KEY");
  if (/\b(?:session(?:id)?|cookie|auth(?:orization)?|token|api[_-]?key)\s*=\s*[^;\s]{8,}/i.test(value)) add("CREDENTIAL_COOKIE_SESSION", "COOKIE_OR_SESSION");
  if (/\b(?:OPENAI_API_KEY|OPEN_API_KEY|SERPER_API_KEY)\s*=\s*\S+/i.test(value)) add("CREDENTIAL_ENVIRONMENT_DUMP", "ENVIRONMENT_SECRET");
  for (const urlText of value.match(/https?:\/\/[^\s"'<>]+/gi) || []) {
    try {
      const parsed = new URL(urlText);
      if (parsed.username || parsed.password) add("CREDENTIAL_URL_USERINFO", "URL_CREDENTIAL");
      for (const name of parsed.searchParams.keys()) if (/^(?:api[-_]?key|access[-_]?token|auth(?:orization)?|credential|password|secret|session|sig(?:nature)?|x-amz-signature)$/i.test(name)) add("CREDENTIAL_SIGNED_URL", "SIGNED_URL");
    } catch { /* malformed URLs are handled by schema and do not expose parser diagnostics */ }
  }
  if (knownSecretValues.some((secret) => value.includes(secret))) add("KNOWN_ENVIRONMENT_SECRET_VALUE", "KNOWN_SECRET");
  return { ruleIds: [...new Set(ruleIds)].sort(), credentialShapeClassification: [...new Set(credential)].sort().join("+") || "NONE" };
}

function valueType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  if (Buffer.isBuffer(value)) return "bytes";
  return typeof value;
}

function safeValueBytes(value) {
  try { return Buffer.from(typeof value === "string" ? value : stableJson(value), "utf8"); }
  catch { return Buffer.from(`[UNSERIALIZABLE:${valueType(value)}]`, "utf8"); }
}

export function inspectTerminalSanitizer(record, { knownEnvironment = {} } = {}) {
  validatePublicIdentifierContractManifest();
  const knownSecretValues = Object.entries(knownEnvironment)
    .filter(([name, candidate]) => /(?:API_KEY|TOKEN|SECRET|CREDENTIAL)/.test(name) && typeof candidate === "string" && candidate.length >= 8)
    .map(([, candidate]) => candidate);
  let typedPaths = new Set();
  try { typedPaths = new Set(typedPublicIdentifierPaths(record)); } catch { typedPaths = new Set(); }
  const rejected = [];
  let examinedValueCount = 0;
  function reject(path, value, parent, ruleIds, credentialShapeClassification = "NONE", entropyClassification = "NOT_HIGH_ENTROPY") {
    const inspection = inspectPublicIdentifierAtLocation({ record, path, value, parent });
    const bytes = safeValueBytes(value);
    const uniqueRules = [...new Set(ruleIds)].sort();
    rejected.push(Object.freeze({
      path,
      normalizedSchemaPath: inspection.normalizedSchemaPath,
      terminalSchemaNode: inspection.terminalSchemaNode,
      registryContractId: inspection.registryContractId,
      valueType: valueType(value),
      byteLength: bytes.length,
      valueDigest: sha256Bytes(bytes),
      ruleIds: uniqueRules,
      credentialShapeClassification,
      entropyClassification,
      publicPreimageAvailable: inspection.publicPreimageAvailable,
      publicPreimageRecomputationResult: inspection.publicPreimageRecomputationResult,
      sellerPartitionVerificationResult: inspection.sellerPartitionVerificationResult,
      rejectionDisposition: credentialShapeClassification !== "NONE"
        ? "ACTUAL_OR_SHAPED_CREDENTIAL_REJECTED"
        : inspection.registryContractId === "NO_CONTRACT_MATCH"
          ? "UNDECLARED_IDENTIFIER_OR_SECRET_LOCATION_REJECTED"
          : uniqueRules.includes("PUBLIC_IDENTIFIER_CONTRACT_MISMATCH") || uniqueRules.includes("PUBLIC_IDENTIFIER_VALUE_TYPE_MISMATCH")
            ? "PUBLIC_IDENTIFIER_CONTRACT_OR_SCHEMA_MISMATCH_REJECTED"
            : "UNEXPLAINED_HIGH_ENTROPY_VALUE_REJECTED"
    }));
  }
  function visit(node, path, parent = null, key = null) {
    examinedValueCount += 1;
    const contract = publicIdentifierContractForActualPath(path);
    if (contract && node !== null && node !== undefined && typeof node !== contract.requiredValueType) {
      reject(path, node, parent, ["PUBLIC_IDENTIFIER_VALUE_TYPE_MISMATCH"]);
    }
    if (typeof node === "string") {
      const classifiers = stringClassifiers(node, knownSecretValues);
      const entropy = highEntropyCredentialLike(node);
      const inspection = inspectPublicIdentifierAtLocation({ record, path, value: node, parent });
      const publicMismatch = Boolean(contract) && !inspection.typedPublicIdentifierAccepted;
      const rules = [...classifiers.ruleIds];
      if (publicMismatch) rules.push("PUBLIC_IDENTIFIER_CONTRACT_MISMATCH");
      if (entropy && !typedPaths.has(path)) rules.push("UNEXPLAINED_HIGH_ENTROPY");
      if (rules.length) reject(path, node, parent, rules, classifiers.credentialShapeClassification, entropy ? "HIGH_ENTROPY" : "NOT_HIGH_ENTROPY");
      return;
    }
    if (node === null || typeof node === "boolean" || typeof node === "number") return;
    if (Array.isArray(node)) { node.forEach((entry, index) => visit(entry, `${path}[${index}]`, node, index)); return; }
    if (!node || typeof node !== "object") { reject(path, node, parent, ["UNSUPPORTED_VALUE_TYPE"]); return; }
    for (const childKey of Object.keys(node).sort()) {
      const schemaControlledCredentialPresence = record?.profileType === "BENCHMARK_EXECUTION_PROFILE"
        && path === "$.credentialPresenceDeclarations"
        && typeof node[childKey] === "boolean";
      if (!schemaControlledCredentialPresence && prohibitedSecretField(childKey, path)) reject(`${path}.${childKey}`, node[childKey], node, ["PROHIBITED_SECRET_BEARING_FIELD"], "SECRET_BEARING_FIELD");
      visit(node[childKey], `${path}.${childKey}`, node, childKey);
    }
  }
  visit(record, "$");
  const merged = new Map();
  for (const item of rejected) {
    const key = `${item.path}\0${item.valueDigest}`;
    const prior = merged.get(key);
    if (!prior) { merged.set(key, structuredClone(item)); continue; }
    prior.ruleIds = [...new Set([...prior.ruleIds, ...item.ruleIds])].sort();
    const credentials = [...new Set(`${prior.credentialShapeClassification}+${item.credentialShapeClassification}`.split("+").filter((entry) => entry !== "NONE"))].sort();
    prior.credentialShapeClassification = credentials.join("+") || "NONE";
    prior.entropyClassification = prior.entropyClassification === "HIGH_ENTROPY" || item.entropyClassification === "HIGH_ENTROPY" ? "HIGH_ENTROPY" : "NOT_HIGH_ENTROPY";
    prior.rejectionDisposition = prior.credentialShapeClassification !== "NONE"
      ? "ACTUAL_OR_SHAPED_CREDENTIAL_REJECTED"
      : prior.rejectionDisposition;
  }
  rejected.length = 0;
  rejected.push(...merged.values());
  rejected.sort((left, right) => left.path.localeCompare(right.path) || left.valueDigest.localeCompare(right.valueDigest));
  return Object.freeze({
    contractManifestHash: PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.manifestHash,
    examinedValueCount,
    rejectedLocations: Object.freeze(rejected),
    decision: rejected.length ? "REJECTED" : "ACCEPTED"
  });
}

export function createSanitizerDecisionReceipt({ inspection, bindings, quarantineReceiptHash, terminalCandidateHash, decidedAt, recoveryAttempt = 0 }) {
  assert.ok(["ACCEPTED", "REJECTED"].includes(inspection.decision));
  assert.match(quarantineReceiptHash || "", HASH);
  assert.match(terminalCandidateHash || "", HASH);
  assert.equal(new Date(decidedAt).toISOString(), decidedAt);
  const core = {
    schemaVersion: SANITIZER_DECISION_SCHEMA_VERSION,
    receiptType: "TERMINAL_SANITIZER_DECISION_RECEIPT",
    contractManifestHash: PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.manifestHash,
    releaseRecordHash: bindings.releaseRecordHash,
    consentId: bindings.consentId,
    invocationId: bindings.invocationId,
    reservationId: bindings.reservationId,
    resultId: bindings.resultId,
    resultRootName: bindings.resultRootName,
    requestId: bindings.requestId,
    requestHash: bindings.requestHash,
    quarantineReceiptHash,
    terminalCandidateHash,
    recoveryAttempt,
    decision: inspection.decision,
    examinedValueCount: inspection.examinedValueCount,
    rejectedLocationCount: inspection.rejectedLocations.length,
    rejectedLocations: structuredClone(inspection.rejectedLocations),
    rawRejectedValuesIncluded: false,
    decidedAt
  };
  const receiptId = `sanitizer-decision-${sha256Json(core).slice(0, 48)}`;
  const receipt = Object.freeze({ ...core, receiptId, receiptHash: sha256Json({ ...core, receiptId }) });
  validateSanitizerDecisionReceipt(receipt);
  return receipt;
}

export function validateSanitizerDecisionReceipt(receipt) {
  assert.equal(receipt.schemaVersion, SANITIZER_DECISION_SCHEMA_VERSION);
  assert.equal(receipt.receiptType, "TERMINAL_SANITIZER_DECISION_RECEIPT");
  assert.equal(receipt.contractManifestHash, PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.manifestHash);
  assert.match(receipt.receiptId || "", /^sanitizer-decision-[a-f0-9]{48}$/);
  assert.match(receipt.receiptHash || "", HASH);
  assert.equal(receipt.rejectedLocationCount, receipt.rejectedLocations.length);
  assert.equal(receipt.rawRejectedValuesIncluded, false);
  const core = structuredClone(receipt); delete core.receiptHash;
  assert.equal(sha256Json(core), receipt.receiptHash);
  const withoutId = structuredClone(core); delete withoutId.receiptId;
  assert.equal(receipt.receiptId, `sanitizer-decision-${sha256Json(withoutId).slice(0, 48)}`);
  for (const item of receipt.rejectedLocations) {
    assert.match(item.valueDigest || "", HASH);
    assert.equal(Object.hasOwn(item, "value"), false);
    assert.ok(item.registryContractId === "NO_CONTRACT_MATCH" || item.registryContractId.startsWith("typed-public-identifier:"));
    assert.ok(item.ruleIds.length >= 1);
  }
  return true;
}
