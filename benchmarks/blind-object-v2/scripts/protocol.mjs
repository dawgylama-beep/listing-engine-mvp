import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const BENCHMARK_ID = "blind-object-v2";
export const SCHEMA_VERSION = "2.0";
export const REQUEST_SCHEMA_VERSION = "3.0";
export const FREEZE_SCHEMA_VERSION = "3.0";
export const FREEZE_RECEIPT_SCHEMA_VERSION = "1.0";
export const FREEZE_PROTOCOL_VERSION = "PHASE_7B_R_V1";
export const PREPARATION_STATE = Object.freeze({
  DRAFT_INTAKE: "DRAFT_INTAKE",
  AWAITING_NEW_HOLDOUT_INPUTS: "AWAITING_NEW_HOLDOUT_INPUTS",
  INTAKE_COMPLETE: "INTAKE_COMPLETE",
  VALIDATED: "VALIDATED",
  FROZEN_AWAITING_CONSENT: "FROZEN_AWAITING_CONSENT",
  CONSENTED_NOT_EXECUTED: "CONSENTED_NOT_EXECUTED",
  CONSUMED: "CONSUMED",
  INVALID: "INVALID"
});
export const FREEZE_CONSTRUCTION_STATE = Object.freeze({
  DRY_RUN_VALIDATED: "DRY_RUN_VALIDATED",
  WRITE_PENDING: "WRITE_PENDING",
  WRITE_FAILED: "WRITE_FAILED",
  FROZEN_AWAITING_CONSENT: "FROZEN_AWAITING_CONSENT",
  EXISTING_IDENTICAL_FREEZE_READBACK: "EXISTING_IDENTICAL_FREEZE_READBACK",
  INVALID: "INVALID"
});

export const PURPOSES = Object.freeze([
  "PERSONAL_BUY",
  "RESALE",
  "WHATS_IT_WORTH",
  "MARKETPLACE_LISTING"
]);
export const LANES = Object.freeze(["PHOTO_ONLY", "PHOTO_PLUS_VISIBLE_MARKINGS", "BARCODE_OR_MODEL"]);
export const OBJECT_CLASSES = Object.freeze([
  "CURRENT_RETAIL",
  "VINTAGE_COLLECTIBLE",
  "HOUSEHOLD_TOOL",
  "APPAREL_ACCESSORY",
  "OTHER_REAL_WORLD_OBJECT"
]);
export const COVERAGE_FLAGS = Object.freeze([
  "ordinaryCurrentRetail",
  "vintageOrCollectible",
  "householdEquipmentOrTool",
  "apparelOrPersonalAccessory",
  "packagingDependentIdentity",
  "modelOrIdentifierDependentIdentity",
  "visuallyAmbiguous",
  "additionalCustomerInformationNecessary",
  "safetyRelevantWithoutHazardousInstructions"
]);
export const REQUIRED_STOP_CONDITIONS = Object.freeze([
  "STOP_ON_ANY_BINDING_MISMATCH",
  "STOP_ON_EXISTING_INVOCATION",
  "STOP_ON_INDETERMINATE_ATTEMPT",
  "STOP_ON_PROVIDER_OR_NETWORK_POLICY_VIOLATION",
  "STOP_WITHOUT_RETRY_ON_INCOMPLETE_EXECUTION"
]);
export const PROVIDER_CALL_CEILINGS = Object.freeze({
  totalAnalysisRequests: 26,
  currentRetailPerAnalysis: 28,
  nonRetailPerAnalysis: 12,
  directPagePerAnalysis: 2
});

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(benchmarkRoot, "..", "..");
const defaultV1Root = path.join(repositoryRoot, "benchmarks", "blind-object-v1");
const defaultResultHistoryRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results");
const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const OBJECT_ID = /^V2-OBJ-(?:00[1-9]|01[0-4])$/;
const ANALYSIS_ID = /^V2-RUN-(?:00[1-9]|01[0-9]|02[0-6])$/;
const CANDIDATE_SET_ID = /^[A-Z0-9][A-Z0-9_-]{7,79}$/;
const SAFE_RELATIVE_FILE = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*:)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;
const FORBIDDEN_CONTROL_KEY = /^(?:command|commands|executable|executablePath|module|modulePath|dynamicImport|importPath|environment|environmentName|env|endpoint|providerEndpoint|shell|script|scriptPath|workingDirectory|cwd|arguments|argv)$/i;

export function canonical(value, location = "$") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number") {
    assert.equal(Number.isFinite(value), true, `canonical JSON rejects non-finite number at ${location}`);
    return value;
  }
  if (Array.isArray(value)) {
    assert.equal(Object.keys(value).length, value.length, `canonical JSON rejects sparse or decorated array at ${location}`);
    return value.map((entry, index) => canonical(entry, `${location}[${index}]`));
  }
  if (value && typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    assert.ok(prototype === Object.prototype || prototype === null, `canonical JSON rejects unsupported object at ${location}`);
    const keys = Object.keys(value);
    return Object.fromEntries(keys.sort().map((key) => {
      assert.equal(typeof value[key] === "undefined" || typeof value[key] === "function" || typeof value[key] === "symbol", false, `canonical JSON rejects unsupported value at ${location}.${key}`);
      return [key, canonical(value[key], `${location}.${key}`)];
    }));
  }
  assert.fail(`canonical JSON rejects unsupported value at ${location}`);
}

export const stableJson = (value) => JSON.stringify(canonical(value));
export const sha256Bytes = (value) => createHash("sha256").update(value).digest("hex");
export const sha256Json = (value) => sha256Bytes(Buffer.from(stableJson(value), "utf8"));

export function parseJsonStrict(text, label = "JSON document") {
  assert.equal(typeof text, "string", `${label} must be text`);
  let index = 0;
  const fail = (message) => assert.fail(`${label} ${message} at character ${index}`);
  const whitespace = () => {
    while (/\s/.test(text[index] || "")) index += 1;
  };
  const stringToken = () => {
    if (text[index] !== '"') fail("requires a string");
    const start = index;
    index += 1;
    while (index < text.length) {
      if (text[index] === '"') {
        index += 1;
        return JSON.parse(text.slice(start, index));
      }
      if (text[index] === "\\") index += 1;
      index += 1;
    }
    fail("contains an unterminated string");
  };
  const literal = (value) => {
    if (!text.startsWith(value, index)) fail(`contains an invalid ${value} literal`);
    index += value.length;
  };
  const value = () => {
    whitespace();
    if (text[index] === "{") return object();
    if (text[index] === "[") return array();
    if (text[index] === '"') { stringToken(); return; }
    if (text.startsWith("true", index)) return literal("true");
    if (text.startsWith("false", index)) return literal("false");
    if (text.startsWith("null", index)) return literal("null");
    const number = text.slice(index).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (!number) fail("contains an invalid value");
    index += number[0].length;
  };
  const object = () => {
    index += 1;
    whitespace();
    const keys = new Set();
    if (text[index] === "}") { index += 1; return; }
    while (index < text.length) {
      whitespace();
      const key = stringToken();
      assert.equal(keys.has(key), false, `${label} contains duplicate object key ${JSON.stringify(key)}`);
      keys.add(key);
      whitespace();
      if (text[index] !== ":") fail("requires ':' after an object key");
      index += 1;
      value();
      whitespace();
      if (text[index] === "}") { index += 1; return; }
      if (text[index] !== ",") fail("requires ',' between object members");
      index += 1;
    }
    fail("contains an unterminated object");
  };
  const array = () => {
    index += 1;
    whitespace();
    if (text[index] === "]") { index += 1; return; }
    while (index < text.length) {
      value();
      whitespace();
      if (text[index] === "]") { index += 1; return; }
      if (text[index] !== ",") fail("requires ',' between array items");
      index += 1;
    }
    fail("contains an unterminated array");
  };
  value();
  whitespace();
  if (index !== text.length) fail("contains trailing content");
  return JSON.parse(text);
}

export function hashWithoutField(record, field) {
  const copy = structuredClone(record);
  delete copy[field];
  return sha256Json(copy);
}

export function sealRecord(record, hashField) {
  assert.equal(Object.hasOwn(record, hashField), false, `${hashField} must be omitted from its canonical preimage`);
  return Object.freeze({ ...record, [hashField]: sha256Json(record) });
}

export function validateSealedRecord(record, hashField, label) {
  assert.match(record?.[hashField] || "", HASH, `${label} ${hashField} must be a SHA-256 hash`);
  assert.equal(hashWithoutField(record, hashField), record[hashField], `${label} ${hashField} mismatch`);
  return true;
}

export function normalizeFingerprintText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export const exactTextHash = (value) => sha256Bytes(Buffer.from(String(value ?? ""), "utf8"));
export const normalizedTextHash = (value) => sha256Bytes(Buffer.from(normalizeFingerprintText(value), "utf8"));
export const identityFingerprint = normalizedTextHash;

function exactKeys(record, expected, label) {
  assert.ok(record && typeof record === "object" && !Array.isArray(record), `${label} must be an object`);
  assert.deepEqual(Object.keys(record).sort(), [...expected].sort(), `${label} contains missing or unexpected fields`);
}

function nonEmptyString(value, label, maximum = 4000) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must not be empty`);
  assert.ok(value.length <= maximum, `${label} exceeds its maximum length`);
  return value;
}

function isoDate(value, label) {
  nonEmptyString(value, label, 64);
  assert.equal(Number.isNaN(Date.parse(value)), false, `${label} must be an ISO date-time`);
}

function stringList(value, label) {
  assert.ok(Array.isArray(value) && value.length > 0, `${label} must contain at least one item`);
  value.forEach((entry, index) => nonEmptyString(entry, `${label}[${index}]`, 1000));
}

function assertNoExecutableControlFields(value, label = "candidate content", pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoExecutableControlFields(entry, label, [...pathParts, String(index)]));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, entry] of Object.entries(value)) {
    assert.equal(FORBIDDEN_CONTROL_KEY.test(key), false, `${label} cannot control executable behavior at ${[...pathParts, key].join(".")}`);
    assertNoExecutableControlFields(entry, label, [...pathParts, key]);
  }
}

function countBy(items, selector) {
  const counts = {};
  for (const item of items) {
    const key = selector(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)));
}

function sortedUnique(values, label) {
  assert.equal(new Set(values).size, values.length, `${label} must be unique`);
  return [...values].sort();
}

function asHashSet(values = []) {
  return new Set([...values].filter((value) => HASH.test(String(value || ""))));
}

async function readJson(filePath) {
  return parseJsonStrict(await readFile(filePath, "utf8"), filePath);
}

async function collectHistoricalRequestRecords(resultHistoryRoot) {
  const records = [];
  if (!await stat(resultHistoryRoot, { throwIfNoEntry: false })) return records;
  for (const entry of await readdir(resultHistoryRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const requestRoot = path.join(resultHistoryRoot, entry.name, "requests");
    if (!await stat(requestRoot, { throwIfNoEntry: false })) continue;
    for (const requestFile of (await readdir(requestRoot)).filter((name) => name.endsWith(".json")).sort()) {
      try {
        records.push(await readJson(path.join(requestRoot, requestFile)));
      } catch {
        // An unreadable historical request contributes no reusable material and never weakens other hash checks.
      }
    }
  }
  return records;
}

export function objectRecordFingerprint({ lane, description, photoHashes }) {
  return sha256Json({
    lane,
    descriptionNormalizedHash: normalizeFingerprintText(description) ? normalizedTextHash(description) : null,
    photoHashes: [...photoHashes].sort()
  });
}

export function requestInputFingerprint({ purpose, lane, description, photoHashes }) {
  return sha256Json({
    purpose,
    lane,
    descriptionNormalizedHash: normalizeFingerprintText(description) ? normalizedTextHash(description) : null,
    photoHashes: [...photoHashes].sort()
  });
}

export async function buildLegacyV1RejectionIndex({
  v1Root = defaultV1Root,
  resultHistoryRoot = defaultResultHistoryRoot
} = {}) {
  const [manifest, input, truth, plan, historicalRequests] = await Promise.all([
    readJson(path.join(v1Root, "manifest.json")),
    readJson(path.join(v1Root, "input-cases.json")),
    readJson(path.join(v1Root, "ground-truth.json")),
    readJson(path.join(v1Root, "execution-plan.json")),
    collectHistoricalRequestRecords(resultHistoryRoot)
  ]);
  assert.equal(manifest.benchmarkId, "blind-object-v1");
  assert.equal(input.benchmarkId, "blind-object-v1");
  assert.equal(truth.benchmarkId, "blind-object-v1");
  assert.equal(plan.benchmarkId, "blind-object-v1");

  const assetsByPath = new Map(manifest.assets.map((entry) => [entry.path, entry]));
  const casesById = new Map(input.cases.map((entry) => [entry.caseId, entry]));
  const photoHashes = asHashSet(manifest.assets.map((entry) => entry.sha256));
  const descriptionExactHashes = new Set();
  const descriptionNormalizedHashes = new Set();
  const objectRecordHashes = new Set();
  for (const entry of input.cases) {
    if (String(entry.description || "").trim()) {
      descriptionExactHashes.add(exactTextHash(entry.description));
      descriptionNormalizedHashes.add(normalizedTextHash(entry.description));
    }
    objectRecordHashes.add(objectRecordFingerprint({
      lane: entry.lane,
      description: entry.description,
      photoHashes: entry.images.map((assetPath) => assetsByPath.get(assetPath)?.sha256).filter(Boolean)
    }));
  }

  const identityFingerprints = new Set();
  for (const entry of truth.cases) {
    const candidates = [
      entry.identityKey,
      entry.bestSupportedIdentity,
      entry.broaderIdentity,
      entry.exactIdentity,
      ...(entry.acceptedAliases || []),
      ...(entry.rejectedFalseExactIdentities || [])
    ];
    for (const candidate of candidates) {
      if (normalizeFingerprintText(candidate)) identityFingerprints.add(identityFingerprint(candidate));
    }
  }

  const requestInputHashes = new Set();
  for (const run of plan.runs) {
    const entry = casesById.get(run.caseId);
    requestInputHashes.add(requestInputFingerprint({
      purpose: run.purpose,
      lane: entry.lane,
      description: entry.description,
      photoHashes: entry.images.map((assetPath) => assetsByPath.get(assetPath)?.sha256).filter(Boolean)
    }));
  }

  const historicalRequestHashes = new Set();
  const historicalRequestBodyHashes = new Set();
  for (const record of historicalRequests) {
    if (HASH.test(record.requestSha256 || "")) historicalRequestHashes.add(record.requestSha256);
    if (record.handlerRequest?.body) historicalRequestBodyHashes.add(sha256Json(record.handlerRequest.body));
    if (record.purpose && record.lane && Array.isArray(record.images)) {
      requestInputHashes.add(requestInputFingerprint({
        purpose: record.purpose,
        lane: record.lane,
        description: record.description,
        photoHashes: record.images.map((image) => image.sha256).filter((hash) => HASH.test(hash || ""))
      }));
    }
  }

  return Object.freeze({
    sourceBenchmarkId: "blind-object-v1",
    photoHashes,
    descriptionExactHashes,
    descriptionNormalizedHashes,
    objectRecordHashes,
    identityFingerprints,
    requestInputHashes,
    historicalRequestHashes,
    historicalRequestBodyHashes,
    sourceCounts: Object.freeze({
      photos: photoHashes.size,
      visibleDescriptions: descriptionExactHashes.size,
      objectRecords: objectRecordHashes.size,
      identityFingerprints: identityFingerprints.size,
      requestInputFingerprints: requestInputHashes.size,
      historicalRequestHashes: historicalRequestHashes.size,
      historicalRequestBodyHashes: historicalRequestBodyHashes.size
    })
  });
}

export function assertNotLegacyHash(kind, hash, legacyIndex) {
  assert.match(hash || "", HASH, `${kind} must be a SHA-256 hash`);
  const map = {
    photo: legacyIndex.photoHashes,
    descriptionExact: legacyIndex.descriptionExactHashes,
    descriptionNormalized: legacyIndex.descriptionNormalizedHashes,
    objectRecord: legacyIndex.objectRecordHashes,
    identity: legacyIndex.identityFingerprints,
    requestInput: legacyIndex.requestInputHashes,
    historicalRequest: legacyIndex.historicalRequestHashes,
    historicalRequestBody: legacyIndex.historicalRequestBodyHashes
  };
  assert.ok(map[kind], `unsupported legacy-hash kind: ${kind}`);
  assert.equal(map[kind].has(hash), false, `V2 rejects a Phase 6A/V1 ${kind} hash`);
  return true;
}

export function validateCoverageContract(contract) {
  exactKeys(contract, [
    "schemaVersion", "benchmarkId", "objectCount", "analysisCount", "photosPerObject", "laneObjectCounts",
    "primaryPurposeObjectCounts", "analysisPurposeCounts", "purposeInvarianceAnchors", "requiredObjectClassMinimums", "requiredCoverageFlags"
  ], "coverage contract");
  assert.equal(contract.schemaVersion, SCHEMA_VERSION);
  assert.equal(contract.benchmarkId, BENCHMARK_ID);
  assert.equal(contract.objectCount, 14);
  assert.equal(contract.analysisCount, 26);
  assert.deepEqual(contract.photosPerObject, { minimum: 2, maximum: 4 });
  assert.deepEqual(contract.laneObjectCounts, { PHOTO_ONLY: 8, PHOTO_PLUS_VISIBLE_MARKINGS: 4, BARCODE_OR_MODEL: 2 });
  assert.deepEqual(contract.primaryPurposeObjectCounts, { PERSONAL_BUY: 4, RESALE: 4, "WHATS_IT_WORTH": 3, MARKETPLACE_LISTING: 3 });
  assert.deepEqual(contract.analysisPurposeCounts, { PERSONAL_BUY: 7, RESALE: 7, "WHATS_IT_WORTH": 6, MARKETPLACE_LISTING: 6 });
  assert.equal(contract.purposeInvarianceAnchors.count, 4);
  assert.equal(contract.purposeInvarianceAnchors.onePrimaryAnchorPerPurpose, true);
  assert.deepEqual([...contract.purposeInvarianceAnchors.requiredPurposesPerAnchor].sort(), [...PURPOSES].sort());
  assert.deepEqual(contract.requiredObjectClassMinimums, { CURRENT_RETAIL: 1, VINTAGE_COLLECTIBLE: 1, HOUSEHOLD_TOOL: 1, APPAREL_ACCESSORY: 1 });
  assert.deepEqual(contract.requiredCoverageFlags, Object.fromEntries(COVERAGE_FLAGS.map((flag) => [flag, 1])));
  return Object.freeze({ valid: true, hash: sha256Json(contract) });
}

export function validateScoringContract(contract) {
  exactKeys(contract, ["schemaVersion", "benchmarkId", "frozenBeforeExecution", "totalWeight", "capabilities", "denominatorPolicy", "passPolicy", "immutabilityRule"], "scoring contract");
  assert.equal(contract.schemaVersion, SCHEMA_VERSION);
  assert.equal(contract.benchmarkId, BENCHMARK_ID);
  assert.equal(contract.frozenBeforeExecution, true);
  assert.equal(contract.totalWeight, 100);
  assert.ok(Array.isArray(contract.capabilities) && contract.capabilities.length === 16, "scoring contract requires 16 capabilities");
  const capabilityIds = sortedUnique(contract.capabilities.map((entry) => entry.id), "scoring capability IDs");
  const expectedIds = [
    "OBJECT_IDENTITY_ACCURACY", "IDENTITY_SPECIFICITY_AND_UNCERTAINTY_HONESTY", "EXACT_EVIDENCE_RECOVERY",
    "SIMILAR_COMPATIBLE_DISTRACTOR_REJECTION", "EVIDENCE_TO_OBJECT_ASSOCIATION", "CUSTOMER_VISIBLE_SOURCE_QUALITY",
    "PRICE_AND_MARKET_EVIDENCE_USEFULNESS", "PURPOSE_ACTION_PLAN_COMPLETENESS", "CONFIDENCE_CALIBRATION",
    "CUSTOMER_INPUT_REQUEST_PRECISION", "HONEST_INSUFFICIENT_EVIDENCE_STOPPING", "STOP_COMPLETE_ELIGIBILITY",
    "SAFETY_DISPOSITION", "PROVIDER_FAILURE_TRUTHFULNESS", "EXPERIENCE_AND_GOVERNOR_PROOF_INTEGRITY",
    "CUSTOMER_USEFULNESS_AND_LIMITATIONS"
  ].sort();
  assert.deepEqual(capabilityIds, expectedIds);
  assert.equal(contract.capabilities.reduce((sum, entry) => sum + entry.weight, 0), 100);
  contract.capabilities.forEach((entry) => {
    exactKeys(entry, ["id", "weight", "applicability"], `scoring capability ${entry.id}`);
    assert.ok(Number.isInteger(entry.weight) && entry.weight > 0);
    nonEmptyString(entry.applicability, `${entry.id} applicability`, 80);
  });
  assert.deepEqual(contract.denominatorPolicy, {
    zeroApplicableCasesDisposition: "NOT_APPLICABLE",
    zeroApplicableCasesCountAsSuccess: false,
    normalization: "RENORMALIZE_OVER_APPLICABLE_CAPABILITY_WEIGHT",
    minimumApplicableCaseRequiredForMetricPass: 1
  });
  assert.equal(contract.passPolicy.overallMinimumPercent, 80);
  assert.equal(contract.passPolicy.unsupportedConfidentExactMaximum, 0);
  assert.equal(contract.passPolicy.inventedSourceOrTransactionFactMaximum, 0);
  assert.equal(contract.passPolicy.privateControlLeakMaximum, 0);
  assert.equal(contract.passPolicy.governorOrExperienceIntegrityFailureMaximum, 0);
  stringList(contract.passPolicy.criticalCapabilitiesRequiringNoIntegrityFailure, "critical scoring capabilities");
  nonEmptyString(contract.immutabilityRule, "scoring immutability rule", 1000);
  return Object.freeze({ valid: true, hash: sha256Json(contract) });
}

function validateHumanAttestation(attestation, objectId) {
  exactKeys(attestation, [
    "attestationId", "attestedAt", "realWorldObjectIsNew", "photographsAreNew", "notPreviouslyBenchmarked",
    "notUsedToDesignProductionRepair", "perceptualUniquenessReviewedByHuman", "preparationUseAuthorized",
    "providerTransmissionAuthorized", "benchmarkExecutionAuthorized"
  ], `${objectId} human attestation`);
  assert.match(attestation.attestationId || "", /^ATTEST-V2-[A-Z0-9-]{8,64}$/);
  isoDate(attestation.attestedAt, `${objectId} attestedAt`);
  for (const key of [
    "realWorldObjectIsNew", "photographsAreNew", "notPreviouslyBenchmarked", "notUsedToDesignProductionRepair",
    "perceptualUniquenessReviewedByHuman", "preparationUseAuthorized"
  ]) assert.equal(attestation[key], true, `${objectId} requires ${key}`);
  assert.equal(attestation.providerTransmissionAuthorized, false, `${objectId} intake cannot authorize provider transmission`);
  assert.equal(attestation.benchmarkExecutionAuthorized, false, `${objectId} intake cannot authorize benchmark execution`);
}

function validatePhoto(photo, objectId, assetBytesByPath, legacyIndex, seen) {
  exactKeys(photo, ["assetId", "path", "mediaType", "bytes", "sha256"], `${objectId} photo`);
  assert.match(photo.assetId || "", /^V2-OBJ-(?:00[1-9]|01[0-4])-[A-D]$/);
  assert.ok(photo.assetId.startsWith(`${objectId}-`), `${objectId} photo asset ID mismatch`);
  assert.match(photo.path || "", /^assets\/v2-obj-(?:00[1-9]|01[0-4])-[a-d]\.(?:jpg|jpeg|png|webp)$/);
  assert.ok(photo.path.startsWith(`assets/${objectId.toLowerCase()}-`), `${objectId} photo path mismatch`);
  assert.ok(["image/jpeg", "image/png", "image/webp"].includes(photo.mediaType), `${objectId} photo media type unsupported`);
  assert.ok(Number.isInteger(photo.bytes) && photo.bytes > 0, `${objectId} photo byte count invalid`);
  assert.match(photo.sha256 || "", HASH);
  assert.equal(seen.paths.has(photo.path), false, `duplicate V2 photo path: ${photo.path}`);
  assert.equal(seen.assetIds.has(photo.assetId), false, `duplicate V2 photo ID: ${photo.assetId}`);
  assert.equal(seen.hashes.has(photo.sha256), false, `duplicate V2 photograph hash: ${photo.sha256}`);
  assertNotLegacyHash("photo", photo.sha256, legacyIndex);
  const suppliedBytes = assetBytesByPath.get(photo.path);
  assert.ok(suppliedBytes, `${photo.path} bytes are missing`);
  const bytes = Buffer.isBuffer(suppliedBytes) ? suppliedBytes : Buffer.from(suppliedBytes);
  assert.equal(bytes.length, photo.bytes, `${photo.path} byte count mismatch`);
  assert.equal(sha256Bytes(bytes), photo.sha256, `${photo.path} SHA-256 mismatch`);
  seen.paths.add(photo.path);
  seen.assetIds.add(photo.assetId);
  seen.hashes.add(photo.sha256);
}

export function validateIntakeManifest({ manifest, coverageContract, assetBytesByPath, legacyIndex }) {
  validateCoverageContract(coverageContract);
  assertNoExecutableControlFields(manifest, "input intake manifest");
  exactKeys(manifest, ["schemaVersion", "benchmarkId", "state", "createdAt", "purposeInvarianceAnchorObjectIds", "objects", "analyses"], "input intake manifest");
  assert.equal(manifest.schemaVersion, SCHEMA_VERSION);
  assert.equal(manifest.benchmarkId, BENCHMARK_ID);
  assert.equal(manifest.state, PREPARATION_STATE.INTAKE_COMPLETE);
  isoDate(manifest.createdAt, "intake createdAt");
  assert.ok(assetBytesByPath instanceof Map, "asset bytes must be supplied by fixed path");
  assert.ok(legacyIndex?.sourceBenchmarkId === "blind-object-v1", "V1 rejection index is required");
  assert.equal(manifest.objects.length, coverageContract.objectCount);
  assert.equal(manifest.analyses.length, coverageContract.analysisCount);

  const expectedObjectIds = Array.from({ length: 14 }, (_, index) => `V2-OBJ-${String(index + 1).padStart(3, "0")}`);
  const expectedAnalysisIds = Array.from({ length: 26 }, (_, index) => `V2-RUN-${String(index + 1).padStart(3, "0")}`);
  assert.deepEqual(manifest.objects.map((entry) => entry.objectId), expectedObjectIds, "V2 objects must be ordered and complete");
  assert.deepEqual(manifest.analyses.map((entry) => entry.analysisId), expectedAnalysisIds, "V2 analyses must be ordered and complete");
  const anchors = sortedUnique(manifest.purposeInvarianceAnchorObjectIds, "purpose-invariance anchor IDs");
  assert.equal(anchors.length, coverageContract.purposeInvarianceAnchors.count);
  anchors.forEach((objectId) => assert.match(objectId, OBJECT_ID));

  const seenPhotos = { paths: new Set(), assetIds: new Set(), hashes: new Set() };
  const seenDescriptionsExact = new Set();
  const seenDescriptionsNormalized = new Set();
  const seenObjectRecords = new Set();
  const objectById = new Map();
  for (const object of manifest.objects) {
    exactKeys(object, ["objectId", "lane", "primaryPurpose", "objectClass", "description", "descriptionSha256", "photos", "coverage", "humanAttestation"], `${object.objectId} intake object`);
    assert.match(object.objectId || "", OBJECT_ID);
    assert.ok(LANES.includes(object.lane), `${object.objectId} lane invalid`);
    assert.ok(PURPOSES.includes(object.primaryPurpose), `${object.objectId} primary purpose invalid`);
    assert.ok(OBJECT_CLASSES.includes(object.objectClass), `${object.objectId} class invalid`);
    assert.equal(typeof object.description, "string", `${object.objectId} description must be a string`);
    assert.ok(object.description.length <= 1000, `${object.objectId} description is too long`);
    assert.equal(exactTextHash(object.description), object.descriptionSha256, `${object.objectId} description hash mismatch`);
    if (object.lane === "PHOTO_ONLY") assert.equal(object.description, "", `${object.objectId} PHOTO_ONLY description must be empty`);
    else nonEmptyString(object.description, `${object.objectId} visible description`, 1000);
    if (object.description) {
      const exact = exactTextHash(object.description);
      const normalized = normalizedTextHash(object.description);
      assert.equal(seenDescriptionsExact.has(exact), false, `${object.objectId} duplicates a V2 description`);
      assert.equal(seenDescriptionsNormalized.has(normalized), false, `${object.objectId} trivially duplicates a V2 description`);
      assertNotLegacyHash("descriptionExact", exact, legacyIndex);
      assertNotLegacyHash("descriptionNormalized", normalized, legacyIndex);
      seenDescriptionsExact.add(exact);
      seenDescriptionsNormalized.add(normalized);
    }
    assert.ok(Array.isArray(object.photos));
    assert.ok(object.photos.length >= coverageContract.photosPerObject.minimum && object.photos.length <= coverageContract.photosPerObject.maximum, `${object.objectId} photo count invalid`);
    object.photos.forEach((photo) => validatePhoto(photo, object.objectId, assetBytesByPath, legacyIndex, seenPhotos));
    exactKeys(object.coverage, COVERAGE_FLAGS, `${object.objectId} coverage`);
    COVERAGE_FLAGS.forEach((flag) => assert.equal(typeof object.coverage[flag], "boolean", `${object.objectId} coverage ${flag} must be boolean`));
    validateHumanAttestation(object.humanAttestation, object.objectId);
    const recordHash = objectRecordFingerprint({
      lane: object.lane,
      description: object.description,
      photoHashes: object.photos.map((photo) => photo.sha256)
    });
    assert.equal(seenObjectRecords.has(recordHash), false, `${object.objectId} duplicates a V2 object record`);
    assertNotLegacyHash("objectRecord", recordHash, legacyIndex);
    seenObjectRecords.add(recordHash);
    objectById.set(object.objectId, object);
  }

  assert.deepEqual(countBy(manifest.objects, (entry) => entry.lane), canonical(coverageContract.laneObjectCounts));
  assert.deepEqual(countBy(manifest.objects, (entry) => entry.primaryPurpose), canonical(coverageContract.primaryPurposeObjectCounts));
  const classCounts = countBy(manifest.objects, (entry) => entry.objectClass);
  for (const [objectClass, minimum] of Object.entries(coverageContract.requiredObjectClassMinimums)) {
    assert.ok((classCounts[objectClass] || 0) >= minimum, `coverage requires ${objectClass}`);
  }
  for (const [flag, minimum] of Object.entries(coverageContract.requiredCoverageFlags)) {
    assert.ok(manifest.objects.filter((entry) => entry.coverage[flag]).length >= minimum, `coverage requires ${flag}`);
  }

  const seenRequestInputs = new Set();
  const analysesByObject = new Map(expectedObjectIds.map((objectId) => [objectId, []]));
  for (const analysis of manifest.analyses) {
    exactKeys(analysis, ["analysisId", "objectId", "purpose", "runType"], `${analysis.analysisId} analysis`);
    assert.match(analysis.analysisId || "", ANALYSIS_ID);
    assert.ok(objectById.has(analysis.objectId), `${analysis.analysisId} references an unknown object`);
    assert.ok(PURPOSES.includes(analysis.purpose), `${analysis.analysisId} purpose invalid`);
    assert.ok(["PRINCIPAL", "ANCHOR_PURPOSE"].includes(analysis.runType), `${analysis.analysisId} run type invalid`);
    analysesByObject.get(analysis.objectId).push(analysis);
    const object = objectById.get(analysis.objectId);
    const fingerprint = requestInputFingerprint({
      purpose: analysis.purpose,
      lane: object.lane,
      description: object.description,
      photoHashes: object.photos.map((photo) => photo.sha256)
    });
    assert.equal(seenRequestInputs.has(fingerprint), false, `${analysis.analysisId} duplicates a V2 request input`);
    assertNotLegacyHash("requestInput", fingerprint, legacyIndex);
    seenRequestInputs.add(fingerprint);
  }
  assert.deepEqual(countBy(manifest.analyses, (entry) => entry.purpose), canonical(coverageContract.analysisPurposeCounts));
  const anchorPrimaryPurposes = [];
  for (const [objectId, analyses] of analysesByObject) {
    const object = objectById.get(objectId);
    const principal = analyses.filter((entry) => entry.runType === "PRINCIPAL");
    assert.equal(principal.length, 1, `${objectId} requires exactly one principal analysis`);
    assert.equal(principal[0].purpose, object.primaryPurpose, `${objectId} principal purpose mismatch`);
    if (anchors.includes(objectId)) {
      assert.equal(analyses.length, 4, `${objectId} anchor requires four analyses`);
      assert.deepEqual([...analyses.map((entry) => entry.purpose)].sort(), [...PURPOSES].sort(), `${objectId} anchor purpose coverage mismatch`);
      assert.equal(analyses.filter((entry) => entry.runType === "ANCHOR_PURPOSE").length, 3, `${objectId} requires three anchor-purpose analyses`);
      anchorPrimaryPurposes.push(object.primaryPurpose);
    } else {
      assert.equal(analyses.length, 1, `${objectId} non-anchor requires one analysis`);
    }
  }
  assert.deepEqual(anchorPrimaryPurposes.sort(), [...PURPOSES].sort(), "anchors require one primary object per purpose");

  return Object.freeze({
    valid: true,
    state: PREPARATION_STATE.VALIDATED,
    manifestHash: sha256Json(manifest),
    objectCount: manifest.objects.length,
    analysisCount: manifest.analyses.length,
    photoCount: seenPhotos.hashes.size,
    objectRecordHashes: Object.freeze([...seenObjectRecords].sort()),
    requestInputHashes: Object.freeze([...seenRequestInputs].sort())
  });
}

export function validatePrivateControls({ controls, intakeManifest, legacyIndex }) {
  assertNoExecutableControlFields(controls, "private controls");
  exactKeys(controls, ["schemaVersion", "benchmarkId", "visibility", "objects", "analyses"], "private controls");
  assert.equal(controls.schemaVersion, SCHEMA_VERSION);
  assert.equal(controls.benchmarkId, BENCHMARK_ID);
  assert.equal(controls.visibility, "PRIVATE_EVALUATOR_ONLY");
  assert.equal(controls.objects.length, 14);
  assert.equal(controls.analyses.length, 26);
  const expectedObjects = intakeManifest.objects.map((entry) => entry.objectId);
  const expectedAnalyses = intakeManifest.analyses.map((entry) => entry.analysisId);
  assert.deepEqual(controls.objects.map((entry) => entry.objectId), expectedObjects);
  assert.deepEqual(controls.analyses.map((entry) => entry.analysisId), expectedAnalyses);
  const identityHashes = new Set();
  for (const control of controls.objects) {
    exactKeys(control, [
      "objectId", "authoritativeIdentity", "identityFingerprintSha256", "acceptedIdentityBoundaries", "rejectedDistractors",
      "exactEvidenceExpectations", "customerInputRequirement", "safetyExpectation", "permittedCautiousOutcomes", "prohibitedUnsupportedClaims"
    ], `${control.objectId} private control`);
    nonEmptyString(control.authoritativeIdentity, `${control.objectId} authoritative identity`, 1000);
    assert.equal(identityFingerprint(control.authoritativeIdentity), control.identityFingerprintSha256, `${control.objectId} identity fingerprint mismatch`);
    assert.equal(identityHashes.has(control.identityFingerprintSha256), false, `${control.objectId} duplicates a V2 identity`);
    assertNotLegacyHash("identity", control.identityFingerprintSha256, legacyIndex);
    identityHashes.add(control.identityFingerprintSha256);
    stringList(control.acceptedIdentityBoundaries, `${control.objectId} accepted identity boundaries`);
    stringList(control.rejectedDistractors, `${control.objectId} rejected distractors`);
    stringList(control.exactEvidenceExpectations, `${control.objectId} exact evidence expectations`);
    nonEmptyString(control.customerInputRequirement, `${control.objectId} customer input requirement`, 1000);
    nonEmptyString(control.safetyExpectation, `${control.objectId} safety expectation`, 1000);
    stringList(control.permittedCautiousOutcomes, `${control.objectId} permitted cautious outcomes`);
    stringList(control.prohibitedUnsupportedClaims, `${control.objectId} prohibited unsupported claims`);
  }
  for (const control of controls.analyses) {
    exactKeys(control, ["analysisId", "purposeObligations", "permittedTerminalStates", "requiredLimitations"], `${control.analysisId} analysis control`);
    stringList(control.purposeObligations, `${control.analysisId} purpose obligations`);
    assert.ok(Array.isArray(control.permittedTerminalStates) && control.permittedTerminalStates.length > 0);
    control.permittedTerminalStates.forEach((state) => assert.ok(["STOP_COMPLETE", "STOP_INSUFFICIENT_EVIDENCE"].includes(state)));
    stringList(control.requiredLimitations, `${control.analysisId} required limitations`);
  }
  return Object.freeze({ valid: true, privateControlAggregateHash: sha256Json(controls), identityFingerprints: Object.freeze([...identityHashes].sort()) });
}

function purposeRequestContract(purpose) {
  if (purpose === "MARKETPLACE_LISTING") {
    return Object.freeze({ method: "POST", path: "/api/generate-listing", reportType: "listing", intakeField: "sellerIntake.purchase_intent", intakeValue: "seller_listing" });
  }
  const intakeValue = { PERSONAL_BUY: "personal_use", RESALE: "resale", "WHATS_IT_WORTH": "owner_value" }[purpose];
  assert.ok(intakeValue, `unsupported purpose ${purpose}`);
  return Object.freeze({ method: "POST", path: "/api/generate-listing", reportType: "marketValue", intakeField: "buyerIntake.purchase_intent", intakeValue });
}

function validatePackageBoundary(packageBoundary) {
  exactKeys(packageBoundary, ["candidateSetId", "sourcePackageSha256", "sourcePackageBytes", "packageManifestFileHash", "checksumFileHash"], "source package boundary");
  assert.match(packageBoundary.candidateSetId || "", CANDIDATE_SET_ID, "candidate-set ID is invalid");
  for (const key of ["sourcePackageSha256", "packageManifestFileHash", "checksumFileHash"]) assert.match(packageBoundary[key] || "", HASH, `${key} must be a SHA-256 hash`);
  assert.ok(Number.isInteger(packageBoundary.sourcePackageBytes) && packageBoundary.sourcePackageBytes > 0, "source package byte count is invalid");
  return Object.freeze({ ...packageBoundary });
}

function validateAnalysisPlan(analysisPlan, intakeManifest, candidateSetId) {
  assertNoExecutableControlFields(analysisPlan, "analysis plan");
  assert.ok(analysisPlan && typeof analysisPlan === "object" && !Array.isArray(analysisPlan), "analysis plan must be an object");
  assert.ok(Array.isArray(analysisPlan.analyses), "analysis plan requires analyses");
  if (Object.hasOwn(analysisPlan, "benchmarkId")) assert.equal(analysisPlan.benchmarkId, BENCHMARK_ID);
  if (Object.hasOwn(analysisPlan, "candidateSetId")) assert.equal(analysisPlan.candidateSetId, candidateSetId);
  assert.deepEqual(analysisPlan.analyses.map(({ analysisId, objectId, purpose, runType }) => ({ analysisId, objectId, purpose, runType })), intakeManifest.analyses, "analysis plan mapping differs from intake manifest");
  return true;
}

function canonicalSourceOriginalInventory({ sourceOriginalInventory, sourceOriginalBytesByPath, intakeManifest }) {
  assert.ok(Array.isArray(sourceOriginalInventory), "source-original inventory must be an array");
  assert.ok(sourceOriginalBytesByPath instanceof Map, "source-original bytes must be supplied by fixed path");
  const expectedPhotoIds = new Set(intakeManifest.objects.flatMap((object) => object.photos.map((photo) => photo.assetId)));
  const seenPhotoIds = new Set();
  const seenPaths = new Set();
  const seenHashes = new Set();
  const records = sourceOriginalInventory.map((record) => {
    exactKeys(record, ["canonicalObjectId", "photoId", "evaluatorOnlyRelativePath", "bytes", "sha256"], "source-original inventory record");
    assert.match(record.canonicalObjectId || "", OBJECT_ID);
    assert.match(record.photoId || "", /^V2-OBJ-(?:00[1-9]|01[0-4])-[A-D]$/);
    assert.ok(record.photoId.startsWith(`${record.canonicalObjectId}-`), "source-original photo ID does not match its object");
    assert.ok(expectedPhotoIds.has(record.photoId), "source-original photo is not an accepted intake photo");
    assert.match(record.evaluatorOnlyRelativePath || "", SAFE_RELATIVE_FILE, "source-original path is unsafe");
    assert.match(path.extname(record.evaluatorOnlyRelativePath).toLowerCase(), /^\.(?:jpg|jpeg|png|webp)$/);
    assert.ok(Number.isInteger(record.bytes) && record.bytes > 0);
    assert.match(record.sha256 || "", HASH);
    assert.equal(seenPhotoIds.has(record.photoId), false, "duplicate source-original photo ID");
    assert.equal(seenPaths.has(record.evaluatorOnlyRelativePath), false, "duplicate source-original path");
    assert.equal(seenHashes.has(record.sha256), false, "duplicate source-original hash");
    const supplied = sourceOriginalBytesByPath.get(record.evaluatorOnlyRelativePath);
    assert.ok(supplied, `${record.evaluatorOnlyRelativePath} source-original bytes are missing`);
    const bytes = Buffer.isBuffer(supplied) ? supplied : Buffer.from(supplied);
    assert.equal(bytes.length, record.bytes, `${record.evaluatorOnlyRelativePath} source-original byte count mismatch`);
    assert.equal(sha256Bytes(bytes), record.sha256, `${record.evaluatorOnlyRelativePath} source-original hash mismatch`);
    seenPhotoIds.add(record.photoId);
    seenPaths.add(record.evaluatorOnlyRelativePath);
    seenHashes.add(record.sha256);
    return { ...record };
  }).sort((left, right) => left.canonicalObjectId.localeCompare(right.canonicalObjectId) || left.photoId.localeCompare(right.photoId));
  assert.equal(records.length, expectedPhotoIds.size, "source-original inventory must bind every sanitized photo exactly once");
  assert.deepEqual([...seenPhotoIds].sort(), [...expectedPhotoIds].sort(), "source-original inventory photo coverage mismatch");
  return Object.freeze(records.map(Object.freeze));
}

function canonicalProvenanceRecords(provenanceRecords, sourceOriginalInventory) {
  assert.ok(Array.isArray(provenanceRecords), "provenance records must be an array");
  const expected = new Set(sourceOriginalInventory.map((entry) => `${entry.canonicalObjectId}|${entry.photoId}`));
  const seen = new Set();
  const records = provenanceRecords.map((record) => {
    assertNoExecutableControlFields(record, "provenance record");
    assert.ok(record && typeof record === "object" && !Array.isArray(record));
    const canonicalObjectId = record.canonicalObjectId ?? record.objectId;
    const photoId = record.photoId;
    assert.match(canonicalObjectId || "", OBJECT_ID, "provenance object ID is invalid");
    assert.match(photoId || "", /^V2-OBJ-(?:00[1-9]|01[0-4])-[A-D]$/, "provenance photo ID is invalid");
    const key = `${canonicalObjectId}|${photoId}`;
    assert.ok(expected.has(key), "provenance record does not bind an accepted source original");
    assert.equal(seen.has(key), false, "duplicate provenance record");
    seen.add(key);
    return structuredClone(record);
  }).sort((left, right) => String(left.canonicalObjectId ?? left.objectId).localeCompare(String(right.canonicalObjectId ?? right.objectId)) || String(left.photoId).localeCompare(String(right.photoId)));
  assert.deepEqual([...seen].sort(), [...expected].sort(), "provenance coverage mismatch");
  return Object.freeze(records.map((entry) => Object.freeze(entry)));
}

function frozenAssetExtension(mediaType) {
  const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[mediaType];
  assert.ok(extension, `unsupported frozen asset media type ${mediaType}`);
  return extension;
}

export function validateFrozenRequestContract(request) {
  assertNoExecutableControlFields(request, "frozen request contract");
  exactKeys(request, [
    "schemaVersion", "benchmarkId", "candidateSetId", "canonicalObjectId", "analysisId", "runType", "lane", "customerPurpose",
    "inputAssets", "publicCustomerDescription", "permittedVisibleMarkings", "handlerContract", "inputFingerprintHash",
    "sourceRepositoryHead", "sourceVersion", "sourcePackageSha256", "specificationHash", "coverageHash", "scoringHash",
    "privateControlMaterialIncluded", "executionAuthorized", "requestContractHash"
  ], "frozen request contract");
  assert.equal(request.schemaVersion, REQUEST_SCHEMA_VERSION);
  assert.equal(request.benchmarkId, BENCHMARK_ID);
  assert.match(request.candidateSetId || "", CANDIDATE_SET_ID);
  assert.match(request.canonicalObjectId || "", OBJECT_ID);
  assert.match(request.analysisId || "", ANALYSIS_ID);
  assert.ok(["PRINCIPAL", "ANCHOR_PURPOSE"].includes(request.runType));
  assert.ok(LANES.includes(request.lane));
  assert.ok(PURPOSES.includes(request.customerPurpose));
  assert.ok(Array.isArray(request.inputAssets) && request.inputAssets.length >= 2 && request.inputAssets.length <= 4);
  const photoIds = new Set();
  const paths = new Set();
  const hashes = new Set();
  for (const asset of request.inputAssets) {
    exactKeys(asset, ["photoId", "frozenRelativePath", "bytes", "sha256", "mediaType"], "frozen request input asset");
    assert.match(asset.photoId || "", /^V2-OBJ-(?:00[1-9]|01[0-4])-[A-D]$/);
    assert.ok(asset.photoId.startsWith(`${request.canonicalObjectId}-`), "request photo belongs to a different object");
    assert.match(asset.frozenRelativePath || "", SAFE_RELATIVE_FILE, "request frozen asset path is unsafe");
    assert.ok(asset.frozenRelativePath.startsWith(`assets/${request.canonicalObjectId}/${asset.photoId}.`), "request frozen asset path is not repository-derived");
    assert.ok(Number.isInteger(asset.bytes) && asset.bytes > 0);
    assert.match(asset.sha256 || "", HASH);
    assert.ok(["image/jpeg", "image/png", "image/webp"].includes(asset.mediaType));
    assert.equal(photoIds.has(asset.photoId) || paths.has(asset.frozenRelativePath) || hashes.has(asset.sha256), false, "request contains a duplicate photo binding");
    photoIds.add(asset.photoId); paths.add(asset.frozenRelativePath); hashes.add(asset.sha256);
  }
  assert.equal(typeof request.publicCustomerDescription, "string");
  assert.ok(Array.isArray(request.permittedVisibleMarkings));
  request.permittedVisibleMarkings.forEach((entry, index) => nonEmptyString(entry, `permittedVisibleMarkings[${index}]`, 1000));
  exactKeys(request.handlerContract, ["method", "path", "reportType", "intakeField", "intakeValue"], "request handler contract");
  assert.equal(request.handlerContract.method, "POST");
  assert.equal(request.handlerContract.path, "/api/generate-listing");
  assert.deepEqual(request.handlerContract, purposeRequestContract(request.customerPurpose), "request handler contract does not match its customer purpose");
  for (const key of ["inputFingerprintHash", "sourcePackageSha256", "specificationHash", "coverageHash", "scoringHash", "requestContractHash"]) assert.match(request[key] || "", HASH, `${key} is invalid`);
  assert.match(request.sourceRepositoryHead || "", COMMIT);
  assert.match(request.sourceVersion || "", /^1\.12\.\d+$/);
  assert.equal(request.privateControlMaterialIncluded, false);
  assert.equal(request.executionAuthorized, false);
  validateSealedRecord(request, "requestContractHash", "frozen request contract");
  return Object.freeze({ valid: true, requestContractHash: request.requestContractHash });
}

export function buildFrozenRequestContracts({
  intakeManifest,
  legacyIndex,
  packageBoundary,
  sourceRepositoryHead,
  sourceVersion,
  specificationHash,
  coverageHash,
  scoringHash
}) {
  const boundary = validatePackageBoundary(packageBoundary);
  assert.match(sourceRepositoryHead || "", COMMIT, "request release binding requires repository HEAD");
  assert.match(sourceVersion || "", /^1\.12\.\d+$/, "request release binding requires Version");
  for (const [label, hash] of Object.entries({ specificationHash, coverageHash, scoringHash })) assert.match(hash || "", HASH, `${label} is invalid`);
  const objectById = new Map(intakeManifest.objects.map((entry) => [entry.objectId, entry]));
  const requestHashes = new Set();
  return intakeManifest.analyses.map((analysis) => {
    const object = objectById.get(analysis.objectId);
    const inputFingerprintHash = requestInputFingerprint({
      purpose: analysis.purpose,
      lane: object.lane,
      description: object.description,
      photoHashes: object.photos.map((photo) => photo.sha256)
    });
    assertNotLegacyHash("requestInput", inputFingerprintHash, legacyIndex);
    const core = {
      schemaVersion: REQUEST_SCHEMA_VERSION,
      benchmarkId: BENCHMARK_ID,
      candidateSetId: boundary.candidateSetId,
      analysisId: analysis.analysisId,
      canonicalObjectId: analysis.objectId,
      runType: analysis.runType,
      lane: object.lane,
      customerPurpose: analysis.purpose,
      inputAssets: object.photos.map((photo) => ({
        photoId: photo.assetId,
        frozenRelativePath: `assets/${object.objectId}/${photo.assetId}.${frozenAssetExtension(photo.mediaType)}`,
        bytes: photo.bytes,
        sha256: photo.sha256,
        mediaType: photo.mediaType
      })),
      publicCustomerDescription: object.description,
      permittedVisibleMarkings: object.lane === "PHOTO_ONLY" ? [] : [object.description],
      handlerContract: purposeRequestContract(analysis.purpose),
      inputFingerprintHash,
      sourceRepositoryHead,
      sourceVersion,
      sourcePackageSha256: boundary.sourcePackageSha256,
      specificationHash,
      coverageHash,
      scoringHash,
      privateControlMaterialIncluded: false,
      executionAuthorized: false
    };
    const request = sealRecord(core, "requestContractHash");
    validateFrozenRequestContract(request);
    assert.equal(requestHashes.has(request.requestContractHash), false, `${analysis.analysisId} request contract duplicates another request`);
    requestHashes.add(request.requestContractHash);
    return request;
  });
}

export function freezeBenchmark({
  intakeManifest,
  privateControls,
  benchmarkSpec,
  coverageContract,
  scoringContract,
  assetBytesByPath,
  sourceOriginalInventory,
  sourceOriginalBytesByPath,
  provenanceRecords,
  analysisPlan,
  packageBoundary,
  legacyIndex,
  sourceRepositoryHead,
  sourceVersion
}) {
  assert.match(sourceRepositoryHead || "", COMMIT, "freeze requires a full source repository HEAD");
  assert.match(sourceVersion || "", /^1\.12\.\d+$/, "freeze requires a Katherine's Eye Version");
  assert.equal(benchmarkSpec?.benchmarkId, BENCHMARK_ID);
  assert.equal(benchmarkSpec?.preparationOnly, true);
  assert.equal(benchmarkSpec?.preparationSafety?.benchmarkExecutionAuthorized, false);
  const boundary = validatePackageBoundary(packageBoundary);
  const intake = validateIntakeManifest({ manifest: intakeManifest, coverageContract, assetBytesByPath, legacyIndex });
  const controls = validatePrivateControls({ controls: privateControls, intakeManifest, legacyIndex });
  const coverage = validateCoverageContract(coverageContract);
  const scoring = validateScoringContract(scoringContract);
  const specificationHash = sha256Json(benchmarkSpec);
  validateAnalysisPlan(analysisPlan, intakeManifest, boundary.candidateSetId);
  const originals = canonicalSourceOriginalInventory({ sourceOriginalInventory, sourceOriginalBytesByPath, intakeManifest });
  const provenance = canonicalProvenanceRecords(provenanceRecords, originals);
  const requestContracts = buildFrozenRequestContracts({
    intakeManifest,
    legacyIndex,
    packageBoundary: boundary,
    sourceRepositoryHead,
    sourceVersion,
    specificationHash,
    coverageHash: coverage.hash,
    scoringHash: scoring.hash
  });
  assert.equal(requestContracts.length, 26);
  const requestContractHashes = requestContracts.map((entry) => entry.requestContractHash);
  assert.equal(new Set(requestContractHashes).size, 26, "freeze requires 26 unique request hashes");
  const sanitizedInputInventory = intakeManifest.objects.flatMap((object) => object.photos.map((photo) => ({
    canonicalObjectId: object.objectId,
    photoId: photo.assetId,
    frozenRelativePath: `assets/${object.objectId}/${photo.assetId}.${frozenAssetExtension(photo.mediaType)}`,
    bytes: photo.bytes,
    sha256: photo.sha256,
    mediaType: photo.mediaType
  })));
  const sanitizedInputAggregateHash = sha256Json(sanitizedInputInventory);
  const sourceOriginalAggregateHash = sha256Json(originals);
  const publicIntakeManifestHash = intake.manifestHash;
  const provenanceAggregateHash = sha256Json(provenance);
  const analysisPlanHash = sha256Json(analysisPlan);
  const requestAggregateHash = sha256Json(requestContracts.map((request) => ({ analysisId: request.analysisId, requestContractHash: request.requestContractHash })));
  const laneCounts = countBy(intakeManifest.objects, (entry) => entry.lane);
  const primaryPurposeCounts = countBy(intakeManifest.objects, (entry) => entry.primaryPurpose);
  const analysisPurposeCounts = countBy(intakeManifest.analyses, (entry) => entry.purpose);
  const canonicalObjectIdNamespace = "V2-OBJ-001_THROUGH_V2-OBJ-014";
  const completeCore = {
    freezeSchemaVersion: FREEZE_SCHEMA_VERSION,
    benchmarkId: BENCHMARK_ID,
    candidateSetId: boundary.candidateSetId,
    canonicalObjectIdNamespace,
    sourceRepositoryHead,
    sourceVersion,
    sourcePackageSha256: boundary.sourcePackageSha256,
    sourcePackageBytes: boundary.sourcePackageBytes,
    packageManifestFileHash: boundary.packageManifestFileHash,
    checksumFileHash: boundary.checksumFileHash,
    sanitizedInputAggregateHash,
    sourceOriginalAggregateHash,
    publicIntakeManifestHash,
    privateControlAggregateHash: controls.privateControlAggregateHash,
    provenanceAggregateHash,
    analysisPlanHash,
    requestAggregateHash,
    specificationHash,
    coverageHash: coverage.hash,
    scoringHash: scoring.hash,
    objectCount: intake.objectCount,
    sanitizedPhotoCount: intake.photoCount,
    sourceOriginalCount: originals.length,
    requestCount: requestContracts.length,
    anchorObjectCount: intakeManifest.purposeInvarianceAnchorObjectIds.length,
    laneCounts,
    primaryPurposeCounts,
    analysisPurposeCounts
  };
  const completeFrozenAggregateHash = sha256Json(completeCore);
  const frozenArtifactRoot = `benchmarks/blind-object-v2/prepared/freezes/${completeFrozenAggregateHash}`;
  const frozenInputAggregateHash = sha256Json({ publicIntakeManifestHash, sanitizedInputAggregateHash, requestAggregateHash });
  const absentAuthority = Object.freeze({
    executionConsent: false,
    invocationReservation: false,
    providerSelection: false,
    modelSelection: false,
    costAuthorization: false,
    networkAuthorization: false,
    executionJournal: false,
    benchmarkResponses: false,
    scores: false,
    productRepairAuthorization: false,
    deploymentAuthorization: false
  });
  const core = {
    schemaVersion: FREEZE_SCHEMA_VERSION,
    benchmarkId: BENCHMARK_ID,
    state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
    candidateSetId: boundary.candidateSetId,
    canonicalObjectIdNamespace,
    sourceRepositoryHead,
    sourceVersion,
    sourcePackageSha256: boundary.sourcePackageSha256,
    sourcePackageBytes: boundary.sourcePackageBytes,
    packageManifestFileHash: boundary.packageManifestFileHash,
    checksumFileHash: boundary.checksumFileHash,
    sanitizedInputAggregateHash,
    sourceOriginalAggregateHash,
    publicIntakeManifestHash,
    privateControlAggregateHash: controls.privateControlAggregateHash,
    provenanceAggregateHash,
    analysisPlanHash,
    requestAggregateHash,
    specificationHash,
    coverageHash: coverage.hash,
    scoringHash: scoring.hash,
    objectCount: intake.objectCount,
    sanitizedPhotoCount: intake.photoCount,
    sourceOriginalCount: originals.length,
    requestCount: requestContracts.length,
    anchorObjectCount: intakeManifest.purposeInvarianceAnchorObjectIds.length,
    laneCounts,
    primaryPurposeCounts,
    analysisPurposeCounts,
    frozenArtifactRoot,
    completeFrozenAggregateHash,
    absentAuthority,
    requestContractHashes,
    sourceCommit: sourceRepositoryHead,
    version: sourceVersion,
    inputManifestHash: publicIntakeManifestHash,
    coverageContractHash: coverage.hash,
    scoringContractHash: scoring.hash,
    frozenInputAggregateHash,
    freezeAggregateHash: completeFrozenAggregateHash,
    executionAuthorized: false,
    consentReceiptHash: null,
    networkRequestCount: 0,
    providerCallCount: 0,
    frozenRequestExecutionCount: 0
  };
  const freezeManifest = sealRecord(core, "freezeManifestHash");
  validateFreezeManifest(freezeManifest);
  const receiptCore = {
    schemaVersion: FREEZE_RECEIPT_SCHEMA_VERSION,
    receiptType: "BENCHMARK_FREEZE_RECEIPT",
    benchmarkId: BENCHMARK_ID,
    candidateSetId: boundary.candidateSetId,
    sourceRepositoryHead,
    sourceVersion,
    sourcePackageSha256: boundary.sourcePackageSha256,
    freezeManifestHash: freezeManifest.freezeManifestHash,
    completeFrozenAggregateHash,
    frozenArtifactRoot,
    state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
    createdByProtocolVersion: FREEZE_PROTOCOL_VERSION,
    executionConsentAuthorized: false,
    invocationReservationAuthorized: false,
    providerAccessAuthorized: false,
    networkAccessAuthorized: false,
    scoringAuthorized: false,
    deploymentAuthorized: false
  };
  const freezeReceipt = sealRecord(receiptCore, "receiptHash");
  validateFreezeReceipt(freezeReceipt, freezeManifest);
  return Object.freeze({
    constructionState: FREEZE_CONSTRUCTION_STATE.DRY_RUN_VALIDATED,
    state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
    freezeManifest,
    freezeReceipt,
    requestContracts: Object.freeze(requestContracts),
    sanitizedInputInventory: Object.freeze(sanitizedInputInventory.map(Object.freeze)),
    sourceOriginalInventory: originals,
    provenanceRecords: provenance,
    analysisPlan: Object.freeze(structuredClone(analysisPlan)),
    packageBoundary: boundary,
    completeFrozenAggregatePreimage: Object.freeze(completeCore),
    privateControlsIncludedInRequests: false,
    executionAuthorized: false
  });
}

export function validateFreezeManifest(manifest) {
  exactKeys(manifest, [
    "schemaVersion", "benchmarkId", "state", "candidateSetId", "canonicalObjectIdNamespace", "sourceRepositoryHead", "sourceVersion",
    "sourcePackageSha256", "sourcePackageBytes", "packageManifestFileHash", "checksumFileHash", "sanitizedInputAggregateHash",
    "sourceOriginalAggregateHash", "publicIntakeManifestHash", "privateControlAggregateHash", "provenanceAggregateHash", "analysisPlanHash",
    "requestAggregateHash", "specificationHash", "coverageHash", "scoringHash", "objectCount", "sanitizedPhotoCount", "sourceOriginalCount",
    "requestCount", "anchorObjectCount", "laneCounts", "primaryPurposeCounts", "analysisPurposeCounts", "frozenArtifactRoot",
    "completeFrozenAggregateHash", "absentAuthority", "requestContractHashes", "sourceCommit", "version", "inputManifestHash",
    "coverageContractHash", "scoringContractHash", "frozenInputAggregateHash", "freezeAggregateHash", "executionAuthorized",
    "consentReceiptHash", "networkRequestCount", "providerCallCount", "frozenRequestExecutionCount", "freezeManifestHash"
  ], "freeze manifest");
  assert.equal(manifest.schemaVersion, FREEZE_SCHEMA_VERSION);
  assert.equal(manifest.benchmarkId, BENCHMARK_ID);
  assert.equal(manifest.state, PREPARATION_STATE.FROZEN_AWAITING_CONSENT);
  assert.match(manifest.candidateSetId || "", CANDIDATE_SET_ID);
  assert.equal(manifest.canonicalObjectIdNamespace, "V2-OBJ-001_THROUGH_V2-OBJ-014");
  assert.match(manifest.sourceRepositoryHead || "", COMMIT);
  assert.match(manifest.sourceVersion || "", /^1\.12\.\d+$/);
  for (const key of [
    "sourcePackageSha256", "packageManifestFileHash", "checksumFileHash", "sanitizedInputAggregateHash", "sourceOriginalAggregateHash",
    "publicIntakeManifestHash", "privateControlAggregateHash", "provenanceAggregateHash", "analysisPlanHash", "requestAggregateHash",
    "specificationHash", "coverageHash", "scoringHash", "completeFrozenAggregateHash", "inputManifestHash", "coverageContractHash",
    "scoringContractHash", "frozenInputAggregateHash", "freezeAggregateHash", "freezeManifestHash"
  ]) assert.match(manifest[key] || "", HASH, `${key} is invalid`);
  assert.equal(manifest.sourceCommit, manifest.sourceRepositoryHead);
  assert.equal(manifest.version, manifest.sourceVersion);
  assert.equal(manifest.inputManifestHash, manifest.publicIntakeManifestHash);
  assert.equal(manifest.coverageContractHash, manifest.coverageHash);
  assert.equal(manifest.scoringContractHash, manifest.scoringHash);
  assert.equal(manifest.freezeAggregateHash, manifest.completeFrozenAggregateHash);
  assert.equal(manifest.frozenArtifactRoot, `benchmarks/blind-object-v2/prepared/freezes/${manifest.completeFrozenAggregateHash}`);
  assert.equal(manifest.objectCount, 14);
  assert.ok(manifest.sanitizedPhotoCount >= 28 && manifest.sanitizedPhotoCount <= 56);
  assert.equal(manifest.sourceOriginalCount, manifest.sanitizedPhotoCount);
  assert.equal(manifest.requestCount, 26);
  assert.equal(manifest.anchorObjectCount, 4);
  assert.equal(new Set(manifest.requestContractHashes).size, 26);
  exactKeys(manifest.absentAuthority, ["executionConsent", "invocationReservation", "providerSelection", "modelSelection", "costAuthorization", "networkAuthorization", "executionJournal", "benchmarkResponses", "scores", "productRepairAuthorization", "deploymentAuthorization"], "freeze absent authority");
  Object.values(manifest.absentAuthority).forEach((value) => assert.equal(value, false));
  assert.equal(manifest.executionAuthorized, false); assert.equal(manifest.consentReceiptHash, null); assert.equal(manifest.networkRequestCount, 0); assert.equal(manifest.providerCallCount, 0); assert.equal(manifest.frozenRequestExecutionCount, 0);
  validateSealedRecord(manifest, "freezeManifestHash", "freeze manifest");
  return Object.freeze({ valid: true, freezeManifestHash: manifest.freezeManifestHash });
}

export function validateFreezeReceipt(receipt, freezeManifest) {
  exactKeys(receipt, [
    "schemaVersion", "receiptType", "benchmarkId", "candidateSetId", "sourceRepositoryHead", "sourceVersion", "sourcePackageSha256",
    "freezeManifestHash", "completeFrozenAggregateHash", "frozenArtifactRoot", "state", "createdByProtocolVersion",
    "executionConsentAuthorized", "invocationReservationAuthorized", "providerAccessAuthorized", "networkAccessAuthorized",
    "scoringAuthorized", "deploymentAuthorized", "receiptHash"
  ], "freeze receipt");
  assert.equal(receipt.schemaVersion, FREEZE_RECEIPT_SCHEMA_VERSION);
  assert.equal(receipt.receiptType, "BENCHMARK_FREEZE_RECEIPT");
  assert.equal(receipt.benchmarkId, BENCHMARK_ID);
  assert.equal(receipt.state, PREPARATION_STATE.FROZEN_AWAITING_CONSENT);
  assert.equal(receipt.createdByProtocolVersion, FREEZE_PROTOCOL_VERSION);
  for (const key of ["executionConsentAuthorized", "invocationReservationAuthorized", "providerAccessAuthorized", "networkAccessAuthorized", "scoringAuthorized", "deploymentAuthorized"]) assert.equal(receipt[key], false);
  assert.equal(receipt.candidateSetId, freezeManifest.candidateSetId);
  assert.equal(receipt.sourceRepositoryHead, freezeManifest.sourceRepositoryHead);
  assert.equal(receipt.sourceVersion, freezeManifest.sourceVersion);
  assert.equal(receipt.sourcePackageSha256, freezeManifest.sourcePackageSha256);
  assert.equal(receipt.freezeManifestHash, freezeManifest.freezeManifestHash);
  assert.equal(receipt.completeFrozenAggregateHash, freezeManifest.completeFrozenAggregateHash);
  assert.equal(receipt.frozenArtifactRoot, freezeManifest.frozenArtifactRoot);
  validateSealedRecord(receipt, "receiptHash", "freeze receipt");
  return Object.freeze({ valid: true, executionAuthorized: false, receiptHash: receipt.receiptHash });
}

export function verifyFrozenBenchmark(frozen, inputs) {
  assert.equal(frozen?.state, PREPARATION_STATE.FROZEN_AWAITING_CONSENT);
  const rebuilt = freezeBenchmark(inputs);
  assert.deepEqual(frozen.freezeManifest, rebuilt.freezeManifest, "frozen benchmark aggregate or bound material changed");
  assert.deepEqual(frozen.requestContracts, rebuilt.requestContracts, "frozen request contract changed");
  assert.deepEqual(frozen.freezeReceipt, rebuilt.freezeReceipt, "freeze receipt changed");
  return Object.freeze({ valid: true, state: frozen.state, completeFrozenAggregateHash: frozen.freezeManifest.completeFrozenAggregateHash, freezeManifestHash: frozen.freezeManifest.freezeManifestHash, receiptHash: frozen.freezeReceipt.receiptHash });
}

export function createAwaitingPreparationReceipt({ benchmarkSpec, coverageContract, scoringContract, sourceCommit, version }) {
  assert.equal(benchmarkSpec.benchmarkId, BENCHMARK_ID);
  assert.equal(benchmarkSpec.maximumPhase7BState, PREPARATION_STATE.FROZEN_AWAITING_CONSENT);
  assert.match(sourceCommit || "", COMMIT);
  assert.match(version || "", /^1\.12\.\d+$/);
  const coverage = validateCoverageContract(coverageContract);
  const scoring = validateScoringContract(scoringContract);
  const core = {
    schemaVersion: SCHEMA_VERSION,
    recordType: "BENCHMARK_V2_PREPARATION_RECEIPT",
    benchmarkId: BENCHMARK_ID,
    state: PREPARATION_STATE.AWAITING_NEW_HOLDOUT_INPUTS,
    sourceCommit,
    version,
    benchmarkSpecHash: sha256Json(benchmarkSpec),
    coverageContractHash: coverage.hash,
    scoringContractHash: scoring.hash,
    newAuthorizedObjectCount: 0,
    frozenRequestCount: 0,
    consentReceiptCreated: false,
    invocationReservationCreated: false,
    executionAuthorized: false,
    benchmarkExecutionCount: 0,
    providerCallCount: 0,
    networkRequestCount: 0
  };
  return Object.freeze({ ...core, receiptHash: sha256Json(core) });
}

export function validateConsentReceipt(receipt, freezeManifest) {
  exactKeys(receipt, [
    "schemaVersion", "recordType", "decision", "benchmarkId", "frozenInputAggregateHash", "privateControlAggregateHash",
    "scoringContractHash", "freezeAggregateHash", "repositoryCommit", "version", "requestCount", "operatorApprovalId", "approvedAt", "receiptHash"
  ], "pre-execution consent receipt");
  assert.equal(receipt.schemaVersion, SCHEMA_VERSION);
  assert.equal(receipt.recordType, "PRE_EXECUTION_CONSENT_RECEIPT");
  assert.equal(receipt.decision, "CONSENT_TO_SEPARATELY_AUTHORIZED_EXACTLY_ONCE_EXECUTION");
  assert.equal(receipt.benchmarkId, freezeManifest.benchmarkId);
  for (const field of ["frozenInputAggregateHash", "privateControlAggregateHash", "scoringContractHash", "freezeAggregateHash"]) {
    assert.equal(receipt[field], freezeManifest[field], `consent ${field} mismatch`);
  }
  assert.equal(receipt.repositoryCommit, freezeManifest.sourceCommit);
  assert.equal(receipt.version, freezeManifest.version);
  assert.equal(receipt.requestCount, freezeManifest.requestCount);
  assert.match(receipt.operatorApprovalId || "", /^CONSENT-V2-[A-Z0-9-]{8,64}$/);
  isoDate(receipt.approvedAt, "consent approvedAt");
  assert.equal(hashWithoutField(receipt, "receiptHash"), receipt.receiptHash, "consent receipt hash mismatch");
  return Object.freeze({ valid: true, receiptContractVerified: true, executionAuthorized: false, receiptHash: receipt.receiptHash });
}

export function validateExecutionAuthorization({ authorization, consentReceipt, freezeManifest, benchmarkSpec, invocationRegistry = [], expectedScope }) {
  exactKeys(authorization, [
    "schemaVersion", "recordType", "decision", "benchmarkId", "frozenInputAggregateHash", "privateControlAggregateHash",
    "scoringContractHash", "freezeAggregateHash", "repositoryCommit", "version", "requestCount", "provider", "model",
    "providerCallCeilings", "maximumAuthorizedCostUsd", "consentReceiptHash", "invocationId", "outputRoot", "networkPolicy",
    "stopConditions", "authorizedAt", "authorizationHash"
  ], "execution authorization");
  exactKeys(expectedScope, ["repositoryCommit", "version", "provider", "model", "maximumAuthorizedCostUsd", "outputRoot"], "expected execution scope");
  const consent = validateConsentReceipt(consentReceipt, freezeManifest);
  assert.equal(authorization.schemaVersion, SCHEMA_VERSION);
  assert.equal(authorization.recordType, "EXACTLY_ONCE_EXECUTION_AUTHORIZATION");
  assert.equal(authorization.decision, "AUTHORIZE_EXACTLY_ONCE_EXECUTION");
  assert.equal(authorization.benchmarkId, BENCHMARK_ID);
  for (const field of ["frozenInputAggregateHash", "privateControlAggregateHash", "scoringContractHash", "freezeAggregateHash"]) {
    assert.equal(authorization[field], freezeManifest[field], `execution ${field} mismatch`);
  }
  assert.equal(authorization.repositoryCommit, expectedScope.repositoryCommit);
  assert.equal(authorization.version, expectedScope.version);
  assert.equal(authorization.provider, expectedScope.provider);
  assert.equal(authorization.model, expectedScope.model);
  assert.equal(authorization.maximumAuthorizedCostUsd, expectedScope.maximumAuthorizedCostUsd);
  assert.equal(authorization.outputRoot, expectedScope.outputRoot);
  assert.match(authorization.repositoryCommit || "", COMMIT);
  assert.match(authorization.version || "", /^1\.12\.\d+$/);
  assert.ok(benchmarkSpec.executionBoundary.allowedPrimaryProviderIdentifiers.includes(authorization.provider));
  assert.match(authorization.model || "", /^[A-Za-z0-9._-]{1,80}$/);
  assert.equal(authorization.requestCount, freezeManifest.requestCount);
  assert.deepEqual(authorization.providerCallCeilings, PROVIDER_CALL_CEILINGS);
  assert.ok(Number.isFinite(authorization.maximumAuthorizedCostUsd) && authorization.maximumAuthorizedCostUsd > 0);
  assert.equal(authorization.consentReceiptHash, consent.receiptHash);
  assert.match(authorization.invocationId || "", /^V2-INV-[a-z0-9][a-z0-9-]{7,63}$/);
  assert.match(authorization.outputRoot || "", /^benchmarks\/blind-object-v2-results\/v2-[a-z0-9][a-z0-9-]{1,63}$/);
  assert.deepEqual(authorization.networkPolicy, {
    externalNetworkAuthorized: true,
    allowedProvider: "OPENAI",
    webSearchPolicy: "BENCHMARK_CONFIGURED_ONLY",
    directPagePolicy: "PRODUCT_BOUNDED_ONLY"
  });
  assert.deepEqual([...authorization.stopConditions].sort(), [...REQUIRED_STOP_CONDITIONS].sort());
  isoDate(authorization.authorizedAt, "execution authorizedAt");
  assert.equal(hashWithoutField(authorization, "authorizationHash"), authorization.authorizationHash, "execution authorization hash mismatch");
  assert.ok(Array.isArray(invocationRegistry), "invocation registry must be an array");
  assert.equal(invocationRegistry.some((entry) => entry.invocationId === authorization.invocationId), false, "single-use invocation ID has already been reserved or consumed");
  assert.equal(invocationRegistry.some((entry) => entry.freezeAggregateHash === authorization.freezeAggregateHash && ["STARTED", "INDETERMINATE", "CONSUMED"].includes(entry.status)), false, "frozen benchmark already has an invocation reservation or consumption record");
  return Object.freeze({ valid: true, exactScopeBound: true, replayResistant: true, executionPerformed: false, invocationId: authorization.invocationId });
}

export function impliedAuthorityDisposition(value) {
  if (!value || typeof value !== "object") return Object.freeze({ executionAuthorized: false, reason: "STRUCTURED_AUTHORIZATION_REQUIRED" });
  if (value.recordType !== "EXACTLY_ONCE_EXECUTION_AUTHORIZATION" || value.decision !== "AUTHORIZE_EXACTLY_ONCE_EXECUTION") {
    return Object.freeze({ executionAuthorized: false, reason: "PREPARATION_FREEZE_CONSENT_OR_TEXT_IS_NOT_EXECUTION_AUTHORITY" });
  }
  return Object.freeze({ executionAuthorized: false, reason: "UNVALIDATED_AUTHORIZATION_HAS_NO_AUTHORITY" });
}
