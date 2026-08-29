import {
  createHash,
  createPublicKey,
  verify as verifySignature
} from "node:crypto";
import { readFileSync } from "node:fs";

export const PINNED_INDEPENDENT_EVALUATOR_AUTHORITY = Object.freeze({
  archiveByteCount: 18268,
  archiveSha256: "5170747f96ec27e5f7f61f1c4679c749ea1098591db48d3f14c31c512be053a0",
  publicPackageManifestSha256: "5f5a679f65e2e025b6a7b5589471f504e0f4a796355e018f90b7cd2180f76385",
  authorityManifestFileSha256: "0bcd544082d8aa1487fc76f9396bf63fb31e48557c7eabac4617cd86cc7e2a88",
  authorityManifestSignatureSha256: "eeb7e06b2b783e8bedb63b065731d10b009be344911a0799fc76430b6b4b30ae",
  publicKeyFileSha256: "5f7b05db0eafc0db660d8e116e2431c306525baf2a796d32a12b257dbb3b6f18",
  manifestId: "KE-INDEPENDENT-CUSTOMER-PHOTO-EVALUATOR-AUTHORITY-E7839920EA546777",
  manifestSha256: "c8fe2074062c0d9c4d60f5f3520a4446c02dafccd0dffb1460d39a4249a99386",
  evaluatorId: "KATHERINE_INDEPENDENT_CUSTOMER_PHOTO_EVALUATOR_V1",
  evaluatorVersion: "1.0.0",
  evaluatorExecutableSha256: "14e7c73ae93f8bd79cc0a9a49446879b3a14ee5d4fe17ffa62fa2cf80ac5c21b",
  rubricId: "KATHERINE_INDEPENDENT_CUSTOMER_PHOTO_EVALUATOR_RUBRIC_V1",
  rubricSha256: "52753055891fdd06bc4fd555bb3c81936e55cb1424598b5b582c6b0cf4edeb1f",
  publicKeyId: "KE-ICEA-ED25519-E7839920EA5467778980",
  publicKeySpkiSha256: "e7839920ea5467778980c795688acc10f584f935b2fd1fc839b468ad35e14c4e",
  schemaVersion: "1.0",
  passThreshold: 0.7,
  dimensions: Object.freeze([
    "identityAccuracy",
    "purposeAccuracy",
    "conditionAccuracy",
    "evidenceTraceability",
    "uncertaintyCalibration",
    "decisionUsefulness",
    "schemaCoverage",
    "regressionSafety"
  ]),
  productBinding: Object.freeze({
    product: "Katherine's Eye",
    version: "1.12.52",
    commit: "0b13ffb64eca5d48a921413efa2bd3ffe6f4e5df",
    tree: "cf36d83355ed6cbab80e86bc388e5ecdf84674a6"
  })
});

const HASH = /^[a-f0-9]{64}$/;
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const PUBLIC_ROOT = new URL("./public/", import.meta.url);
const AUTHORITY_MANIFEST_URL = new URL("authority-manifest.json", PUBLIC_ROOT);
const AUTHORITY_SIGNATURE_URL = new URL("authority-manifest.sig", PUBLIC_ROOT);
const PUBLIC_KEY_URL = new URL("public-key.pem", PUBLIC_ROOT);
const PUBLIC_PACKAGE_MANIFEST_URL = new URL("public-package-manifest.json", PUBLIC_ROOT);

export class IndependentEvaluatorAuthorityError extends Error {
  constructor(code, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "IndependentEvaluatorAuthorityError";
    this.code = code;
  }
}

function reject(code, detail = "") {
  throw new IndependentEvaluatorAuthorityError(code, detail);
}

export function canonicalEvaluatorJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalEvaluatorJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => (
      `${JSON.stringify(key)}:${canonicalEvaluatorJson(value[key])}`
    )).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function exactObject(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) reject(code);
  const actual = Object.keys(value).sort();
  const expected = [...fields].sort();
  if (canonicalEvaluatorJson(actual) !== canonicalEvaluatorJson(expected)) reject(code);
}

function exactArray(value, expected, code) {
  if (!Array.isArray(value) || canonicalEvaluatorJson(value) !== canonicalEvaluatorJson(expected)) {
    reject(code);
  }
}

function parseJsonBytes(bytes, code) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 1 || bytes.length > 1024 * 1024) reject(code);
  try {
    const value = JSON.parse(bytes.toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) reject(code);
    return value;
  } catch (error) {
    if (error instanceof IndependentEvaluatorAuthorityError) throw error;
    reject(code);
  }
}

function readPinnedPublicArtifacts() {
  const authorityManifestBytes = readFileSync(AUTHORITY_MANIFEST_URL);
  const authoritySignature = readFileSync(AUTHORITY_SIGNATURE_URL);
  const publicKeyBytes = readFileSync(PUBLIC_KEY_URL);
  const packageManifestBytes = readFileSync(PUBLIC_PACKAGE_MANIFEST_URL);
  const expected = PINNED_INDEPENDENT_EVALUATOR_AUTHORITY;
  if (sha256(authorityManifestBytes) !== expected.authorityManifestFileSha256) {
    reject("INDEPENDENT_AUTHORITY_MANIFEST_FILE_TAMPERED");
  }
  if (sha256(authoritySignature) !== expected.authorityManifestSignatureSha256) {
    reject("INDEPENDENT_AUTHORITY_SIGNATURE_FILE_TAMPERED");
  }
  if (sha256(publicKeyBytes) !== expected.publicKeyFileSha256) {
    reject("INDEPENDENT_AUTHORITY_PUBLIC_KEY_FILE_TAMPERED");
  }
  if (sha256(packageManifestBytes) !== expected.publicPackageManifestSha256) {
    reject("INDEPENDENT_AUTHORITY_PACKAGE_MANIFEST_TAMPERED");
  }
  return {
    authorityManifestBytes,
    authoritySignature,
    publicKeyBytes,
    packageManifestBytes
  };
}

export function verifyPinnedIndependentEvaluatorAuthority({ verificationTime = new Date() } = {}) {
  const pinned = PINNED_INDEPENDENT_EVALUATOR_AUTHORITY;
  const artifacts = readPinnedPublicArtifacts();
  const manifest = parseJsonBytes(artifacts.authorityManifestBytes, "INDEPENDENT_AUTHORITY_MANIFEST_JSON_INVALID");
  const packageManifest = parseJsonBytes(
    artifacts.packageManifestBytes,
    "INDEPENDENT_AUTHORITY_PACKAGE_MANIFEST_JSON_INVALID"
  );
  exactObject(manifest, [
    "schemaVersion", "recordType", "manifestId", "evaluator", "productBinding",
    "authorityScope", "rubric", "executable", "publicKey", "signedBindings",
    "validity", "integrity"
  ], "INDEPENDENT_AUTHORITY_MANIFEST_SCHEMA_INVALID");
  if (
    manifest.schemaVersion !== pinned.schemaVersion
    || manifest.recordType !== "INDEPENDENT_EVALUATOR_AUTHORITY_MANIFEST"
    || manifest.manifestId !== pinned.manifestId
    || manifest.evaluator?.id !== pinned.evaluatorId
    || manifest.evaluator?.version !== pinned.evaluatorVersion
    || canonicalEvaluatorJson(manifest.productBinding) !== canonicalEvaluatorJson(pinned.productBinding)
    || manifest.rubric?.id !== pinned.rubricId
    || manifest.rubric?.schemaVersion !== pinned.schemaVersion
    || manifest.rubric?.sha256 !== pinned.rubricSha256
    || manifest.rubric?.passThreshold !== pinned.passThreshold
    || canonicalEvaluatorJson(manifest.rubric?.dimensions) !== canonicalEvaluatorJson(pinned.dimensions)
    || manifest.executable?.sha256 !== pinned.evaluatorExecutableSha256
    || manifest.publicKey?.algorithm !== "Ed25519"
    || manifest.publicKey?.keyId !== pinned.publicKeyId
    || manifest.publicKey?.spkiSha256 !== pinned.publicKeySpkiSha256
    || manifest.integrity?.manifestSha256 !== pinned.manifestSha256
    || manifest.integrity?.detachedSignaturePath !== "authority-manifest.sig"
  ) reject("INDEPENDENT_AUTHORITY_PIN_MISMATCH");
  const normalized = structuredClone(manifest);
  normalized.integrity.manifestSha256 = "";
  if (sha256(Buffer.from(canonicalEvaluatorJson(normalized), "utf8")) !== manifest.integrity.manifestSha256) {
    reject("INDEPENDENT_AUTHORITY_MANIFEST_HASH_MISMATCH");
  }
  const publicKey = createPublicKey(artifacts.publicKeyBytes);
  const spki = publicKey.export({ type: "spki", format: "der" });
  if (sha256(spki) !== pinned.publicKeySpkiSha256) reject("INDEPENDENT_AUTHORITY_PUBLIC_KEY_MISMATCH");
  if (!verifySignature(
    null,
    Buffer.from(canonicalEvaluatorJson(manifest), "utf8"),
    publicKey,
    artifacts.authoritySignature
  )) reject("INDEPENDENT_AUTHORITY_MANIFEST_SIGNATURE_INVALID");
  const listed = new Map((packageManifest.artifacts || []).map((artifact) => [artifact.path, artifact]));
  for (const [artifactPath, byteCount, artifactHash] of [
    ["authority-manifest.json", artifacts.authorityManifestBytes.length, pinned.authorityManifestFileSha256],
    ["authority-manifest.sig", artifacts.authoritySignature.length, pinned.authorityManifestSignatureSha256],
    ["public-key.pem", artifacts.publicKeyBytes.length, pinned.publicKeyFileSha256]
  ]) {
    const row = listed.get(artifactPath);
    if (row?.byteCount !== byteCount || row?.sha256 !== artifactHash) {
      reject("INDEPENDENT_AUTHORITY_PACKAGE_PROVENANCE_MISMATCH", artifactPath);
    }
  }
  const now = verificationTime instanceof Date ? verificationTime : new Date(verificationTime);
  const notBefore = new Date(manifest.validity?.notBefore);
  const notAfter = new Date(manifest.validity?.notAfter);
  if (![now, notBefore, notAfter].every((value) => Number.isFinite(value.getTime()))) {
    reject("INDEPENDENT_AUTHORITY_VALIDITY_INVALID");
  }
  if (now < notBefore) reject("INDEPENDENT_AUTHORITY_NOT_YET_VALID");
  if (now > notAfter) reject("INDEPENDENT_AUTHORITY_EXPIRED");
  return Object.freeze({ manifest, publicKey, packageManifest });
}

export function verifyPinnedIndependentEvaluationRecord(value, {
  allowConformanceFixtures = false,
  verificationTime = new Date()
} = {}) {
  const { manifest, publicKey } = verifyPinnedIndependentEvaluatorAuthority({ verificationTime });
  exactObject(value, [
    "schemaVersion", "recordType", "evaluationClass", "evaluator", "authorityManifest",
    "productBinding", "rubric", "bindings", "scores", "disposition",
    "evidenceReferences", "fatalFailures", "nonce", "sequence", "evaluatedAt", "integrity"
  ], "INDEPENDENT_EVALUATION_SCHEMA_INVALID");
  exactObject(value.integrity, [
    "canonicalization", "payloadSha256", "signatureAlgorithm", "keyId", "signatureBase64"
  ], "INDEPENDENT_EVALUATION_INTEGRITY_INVALID");
  const payload = structuredClone(value);
  delete payload.integrity;
  const payloadBytes = Buffer.from(canonicalEvaluatorJson(payload), "utf8");
  if (!HASH.test(value.integrity.payloadSha256) || sha256(payloadBytes) !== value.integrity.payloadSha256) {
    reject("INDEPENDENT_EVALUATION_PAYLOAD_HASH_MISMATCH");
  }
  if (
    value.integrity.signatureAlgorithm !== manifest.publicKey.algorithm
    || value.integrity.keyId !== manifest.publicKey.keyId
    || typeof value.integrity.signatureBase64 !== "string"
    || !/^[A-Za-z0-9+/]+={0,2}$/.test(value.integrity.signatureBase64)
  ) reject("INDEPENDENT_EVALUATION_KEY_UNTRUSTED");
  const signature = Buffer.from(value.integrity.signatureBase64, "base64");
  if (signature.length !== 64 || !verifySignature(null, payloadBytes, publicKey, signature)) {
    reject("INDEPENDENT_EVALUATION_SIGNATURE_INVALID");
  }
  if (value.evaluationClass === "CONFORMANCE_FIXTURE" && !allowConformanceFixtures) {
    reject("INDEPENDENT_EVALUATION_CONFORMANCE_FIXTURE_PROHIBITED");
  }
  if (![
    "CUSTOMER_PHOTO",
    ...(allowConformanceFixtures ? ["CONFORMANCE_FIXTURE"] : [])
  ].includes(value.evaluationClass)) reject("INDEPENDENT_EVALUATION_CLASS_INVALID");
  if (
    value.schemaVersion !== manifest.schemaVersion
    || value.recordType !== "INDEPENDENT_CUSTOMER_PHOTO_EVALUATION"
    || value.evaluator?.id !== manifest.evaluator.id
    || value.evaluator?.version !== manifest.evaluator.version
    || value.authorityManifest?.id !== manifest.manifestId
    || value.authorityManifest?.sha256 !== manifest.integrity.manifestSha256
    || canonicalEvaluatorJson(value.productBinding) !== canonicalEvaluatorJson(manifest.productBinding)
    || value.rubric?.id !== manifest.rubric.id
    || value.rubric?.sha256 !== manifest.rubric.sha256
    || value.rubric?.passThreshold !== manifest.rubric.passThreshold
  ) reject("INDEPENDENT_EVALUATION_AUTHORITY_SUBSTITUTION");
  exactObject(value.bindings, [
    "image", "requestSha256", "rawResponseSha256", "canonicalResponseHash"
  ], "INDEPENDENT_EVALUATION_BINDINGS_INVALID");
  exactObject(value.bindings.image, ["sha256", "byteCount"], "INDEPENDENT_EVALUATION_IMAGE_BINDING_INVALID");
  if (
    !HASH.test(value.bindings.image.sha256)
    || !Number.isSafeInteger(value.bindings.image.byteCount)
    || value.bindings.image.byteCount < 1
  ) reject("INDEPENDENT_EVALUATION_IMAGE_BINDING_INVALID");
  for (const field of ["requestSha256", "rawResponseSha256", "canonicalResponseHash"]) {
    if (!HASH.test(value.bindings[field])) reject("INDEPENDENT_EVALUATION_RESPONSE_BINDING_INVALID", field);
  }
  exactObject(value.scores, manifest.rubric.dimensions, "INDEPENDENT_EVALUATION_SCORE_DIMENSIONS_INVALID");
  for (const dimension of manifest.rubric.dimensions) {
    if (![0, 0.25, 0.5, 0.75, 1].includes(value.scores[dimension])) {
      reject("INDEPENDENT_EVALUATION_SCORE_INVALID", dimension);
    }
  }
  if (
    !Array.isArray(value.fatalFailures)
    || value.fatalFailures.length > 32
    || value.fatalFailures.some((item) => typeof item !== "string" || !item || item.length > 160)
    || new Set(value.fatalFailures).size !== value.fatalFailures.length
  ) reject("INDEPENDENT_EVALUATION_FATAL_FAILURES_INVALID");
  if (
    !Array.isArray(value.evidenceReferences)
    || value.evidenceReferences.length < 1
    || value.evidenceReferences.length > 256
    || value.evidenceReferences.some((item) => typeof item !== "string" || !item || item.length > 240)
    || new Set(value.evidenceReferences).size !== value.evidenceReferences.length
  ) reject("INDEPENDENT_EVALUATION_EVIDENCE_REFERENCES_INVALID");
  const expectedDisposition = manifest.rubric.dimensions.every((dimension) => (
    value.scores[dimension] >= manifest.rubric.passThreshold
  )) && value.fatalFailures.length === 0 ? "PASS" : "FAIL";
  if (value.disposition !== expectedDisposition) reject("INDEPENDENT_EVALUATION_DISPOSITION_INVALID");
  if (!UUID.test(value.nonce)) reject("INDEPENDENT_EVALUATION_NONCE_INVALID");
  if (!Number.isSafeInteger(value.sequence) || value.sequence < 1) {
    reject("INDEPENDENT_EVALUATION_SEQUENCE_INVALID");
  }
  const evaluatedAt = new Date(value.evaluatedAt);
  if (
    !Number.isFinite(evaluatedAt.getTime())
    || evaluatedAt < new Date(manifest.validity.notBefore)
    || evaluatedAt > new Date(manifest.validity.notAfter)
  ) reject("INDEPENDENT_EVALUATION_TIME_OUTSIDE_AUTHORITY");
  return Object.freeze({
    value: JSON.parse(canonicalEvaluatorJson(value)),
    evaluationClass: value.evaluationClass,
    evaluatorIdentity: sha256(Buffer.from(canonicalEvaluatorJson(value.evaluator), "utf8")),
    evaluationAuthorityIdentity: manifest.integrity.manifestSha256,
    authorityManifestId: manifest.manifestId,
    authorityManifestSha256: manifest.integrity.manifestSha256,
    criteriaVersion: manifest.rubric.schemaVersion,
    rubricSha256: manifest.rubric.sha256,
    result: value.disposition,
    dimensions: Object.freeze({ ...value.scores }),
    fatalRegressionCount: value.fatalFailures.length,
    responseBindings: Object.freeze({
      rawResponseSha256: value.bindings.rawResponseSha256,
      canonicalResponseHash: value.bindings.canonicalResponseHash
    }),
    requestSha256: value.bindings.requestSha256,
    imageBinding: Object.freeze({ ...value.bindings.image }),
    evaluatedAt: value.evaluatedAt,
    evaluationReportHash: value.integrity.payloadSha256,
    nonce: value.nonce,
    sequence: value.sequence,
    keyId: value.integrity.keyId
  });
}

export function verifyPinnedIndependentEvaluationBytes(bytes, options = {}) {
  const value = parseJsonBytes(bytes, "INDEPENDENT_EVALUATION_JSON_INVALID");
  return verifyPinnedIndependentEvaluationRecord(value, options);
}

export function assertIndependentEvaluationReplaySafety({
  evaluation,
  seenNonces = new Set(),
  highestSequence = 0
} = {}) {
  if (!evaluation || !UUID.test(evaluation.nonce) || !Number.isSafeInteger(evaluation.sequence)) {
    reject("INDEPENDENT_EVALUATION_REPLAY_STATE_INVALID");
  }
  const nonces = seenNonces instanceof Set ? seenNonces : new Set(seenNonces);
  if (nonces.has(evaluation.nonce)) reject("INDEPENDENT_EVALUATION_REPLAY");
  if (!Number.isSafeInteger(highestSequence) || highestSequence < 0) {
    reject("INDEPENDENT_EVALUATION_REPLAY_STATE_INVALID");
  }
  if (evaluation.sequence <= highestSequence) reject("INDEPENDENT_EVALUATION_DUPLICATE_SEQUENCE");
  return true;
}
