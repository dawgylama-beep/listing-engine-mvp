import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

export const BENCHMARK_ID = "blind-object-v2";
export const SCHEMA_VERSION = "2.0";
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
const FORBIDDEN_CONTROL_KEY = /^(?:command|commands|executable|executablePath|module|modulePath|dynamicImport|importPath|environment|environmentName|env|endpoint|providerEndpoint|shell|script|scriptPath|workingDirectory|cwd|arguments|argv)$/i;

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export const stableJson = (value) => JSON.stringify(canonical(value));
export const sha256Bytes = (value) => createHash("sha256").update(value).digest("hex");
export const sha256Json = (value) => sha256Bytes(Buffer.from(stableJson(value), "utf8"));
export function hashWithoutField(record, field) {
  const copy = structuredClone(record);
  delete copy[field];
  return sha256Json(copy);
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
  return JSON.parse(await readFile(filePath, "utf8"));
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

export function buildFrozenRequestContracts({ intakeManifest, legacyIndex }) {
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
      schemaVersion: SCHEMA_VERSION,
      benchmarkId: BENCHMARK_ID,
      analysisId: analysis.analysisId,
      objectId: analysis.objectId,
      runType: analysis.runType,
      purpose: analysis.purpose,
      lane: object.lane,
      description: object.description,
      photos: object.photos.map((photo) => ({ assetId: photo.assetId, path: photo.path, mediaType: photo.mediaType, bytes: photo.bytes, sha256: photo.sha256 })),
      handlerContract: purposeRequestContract(analysis.purpose),
      inputFingerprintHash,
      privateControlMaterialIncluded: false,
      executionAuthorized: false
    };
    const request = { ...core, requestContractHash: sha256Json(core) };
    assert.equal(requestHashes.has(request.requestContractHash), false, `${analysis.analysisId} request contract duplicates another request`);
    requestHashes.add(request.requestContractHash);
    return Object.freeze(request);
  });
}

export function freezeBenchmark({
  intakeManifest,
  privateControls,
  coverageContract,
  scoringContract,
  assetBytesByPath,
  legacyIndex,
  sourceCommit,
  version
}) {
  assert.match(sourceCommit || "", COMMIT, "freeze requires a full source commit");
  assert.match(version || "", /^1\.12\.\d+$/, "freeze requires a Katherine's Eye Version");
  const intake = validateIntakeManifest({ manifest: intakeManifest, coverageContract, assetBytesByPath, legacyIndex });
  const controls = validatePrivateControls({ controls: privateControls, intakeManifest, legacyIndex });
  const coverage = validateCoverageContract(coverageContract);
  const scoring = validateScoringContract(scoringContract);
  const requestContracts = buildFrozenRequestContracts({ intakeManifest, legacyIndex });
  assert.equal(requestContracts.length, 26);
  const requestContractHashes = requestContracts.map((entry) => entry.requestContractHash);
  const frozenInputAggregateHash = sha256Json({
    intakeManifest,
    verifiedAssets: intakeManifest.objects.flatMap((object) => object.photos.map((photo) => ({ path: photo.path, bytes: photo.bytes, sha256: photo.sha256 }))),
    requestContractHashes
  });
  const core = {
    schemaVersion: SCHEMA_VERSION,
    benchmarkId: BENCHMARK_ID,
    state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
    sourceCommit,
    version,
    inputManifestHash: intake.manifestHash,
    coverageContractHash: coverage.hash,
    scoringContractHash: scoring.hash,
    privateControlAggregateHash: controls.privateControlAggregateHash,
    frozenInputAggregateHash,
    requestCount: requestContracts.length,
    requestContractHashes,
    executionAuthorized: false,
    consentReceiptHash: null,
    networkRequestCount: 0,
    providerCallCount: 0,
    frozenRequestExecutionCount: 0
  };
  const freezeManifest = { ...core, freezeAggregateHash: sha256Json(core) };
  return Object.freeze({
    state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
    freezeManifest: Object.freeze(freezeManifest),
    requestContracts: Object.freeze(requestContracts),
    privateControlsIncludedInRequests: false,
    executionAuthorized: false
  });
}

export function verifyFrozenBenchmark(frozen, inputs) {
  assert.equal(frozen?.state, PREPARATION_STATE.FROZEN_AWAITING_CONSENT);
  const rebuilt = freezeBenchmark(inputs);
  assert.deepEqual(frozen.freezeManifest, rebuilt.freezeManifest, "frozen benchmark aggregate or bound material changed");
  assert.deepEqual(frozen.requestContracts, rebuilt.requestContracts, "frozen request contract changed");
  return Object.freeze({ valid: true, state: frozen.state, freezeAggregateHash: frozen.freezeManifest.freezeAggregateHash });
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
