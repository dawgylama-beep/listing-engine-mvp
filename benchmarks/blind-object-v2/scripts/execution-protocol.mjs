import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";

export const EXECUTION_SCHEMA_VERSION = "1.0";
export const CONSENT_SCHEMA_VERSION = "3.0";
export const PRODUCT_SOURCE_HEAD = "7056eb0601dc69c5985703fea6fe665e82c6bed8";
export const PRODUCT_SOURCE_VERSION = "1.12.13";
export const EXECUTOR_VERSION = "1.12.14";
export const BENCHMARK_ID = "blind-object-v2";
export const EXECUTION_PROFILE_TYPE = "BENCHMARK_EXECUTION_PROFILE";
export const CONSENT_RECEIPT_TYPE = "BENCHMARK_EXECUTION_CONSENT";
export const RESERVATION_TYPE = "BENCHMARK_INVOCATION_RESERVATION";
export const RESULT_RECORD_TYPE = "BENCHMARK_TERMINAL_RESULT";

export const CONSENT_STATUS = Object.freeze({
  AUTHORIZED_NOT_CONSUMED: "AUTHORIZED_NOT_CONSUMED",
  CONSUMED: "CONSUMED",
  REVOKED: "REVOKED",
  INVALID: "INVALID"
});

export const RESERVATION_STATE = Object.freeze({
  RESERVED_NOT_STARTED: "RESERVED_NOT_STARTED",
  STARTED: "STARTED",
  INDETERMINATE: "INDETERMINATE",
  CONSUMED: "CONSUMED",
  FAILED_BEFORE_START: "FAILED_BEFORE_START",
  INVALID: "INVALID"
});

export const REQUEST_STATE = Object.freeze({
  NOT_SUBMITTED: "NOT_SUBMITTED",
  SUBMISSION_INTENT_RECORDED: "SUBMISSION_INTENT_RECORDED",
  SUBMISSION_STARTED: "SUBMISSION_STARTED",
  TERMINAL: "TERMINAL",
  UNKNOWN_AFTER_SUBMISSION: "UNKNOWN_AFTER_SUBMISSION",
  BLOCKED_BEFORE_SUBMISSION: "BLOCKED_BEFORE_SUBMISSION"
});

export const RESULT_STATE = Object.freeze({
  EXECUTED_SEALED_AWAITING_SCORING: "EXECUTED_SEALED_AWAITING_SCORING",
  PARTIAL_EXECUTION_INTEGRITY_STOP: "PARTIAL_EXECUTION_INTEGRITY_STOP",
  FAILED_BEFORE_ANY_SUBMISSION: "FAILED_BEFORE_ANY_SUBMISSION",
  INVALID: "INVALID"
});

export const EXECUTION_MODE = Object.freeze({
  SYNTHETIC_TEST_ONLY: "SYNTHETIC_TEST_ONLY",
  AUTHORIZED_REAL_EXECUTION: "AUTHORIZED_REAL_EXECUTION"
});

export const FIXED_ENVIRONMENT_ALLOWLIST = Object.freeze([
  "OPENAI_API_KEY",
  "OPEN_API_KEY",
  "OPENAI_MODEL",
  "SERPER_API_KEY"
]);

export const FIXED_PROVIDER_ENDPOINT_CLASSES = Object.freeze([
  "OPENAI_RESPONSES_API",
  "OPENAI_WEB_SEARCH",
  "SERPER_SEARCH",
  "SERPER_SHOPPING",
  "PRODUCT_BOUNDED_DIRECT_PAGE"
]);

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,95}$/;
const ANALYSIS_ID = /^V2-RUN-(?:00[1-9]|01[0-9]|02[0-6])$/;
const ALLOWED_CURRENCY = "USD";
const CREDENTIAL_ENVIRONMENT_NAMES = Object.freeze(new Set([
  "OPENAI_API_KEY",
  "OPEN_API_KEY",
  "SERPER_API_KEY"
]));
const PUBLIC_IDENTITY = /^(?=.{1,80}$)[A-Za-z0-9](?:[A-Za-z0-9._:-]*[A-Za-z0-9])?$/;
const PUBLIC_IDENTITY_PATHS = Object.freeze({
  [EXECUTION_PROFILE_TYPE]: Object.freeze(new Set([
    "$.modelProvider",
    "$.exactModelLiteral",
    "$.acquisitionProviderMode",
    "$.directPageMode",
    "$.fixedProviderEndpointClasses[*]"
  ])),
  [RESULT_RECORD_TYPE]: Object.freeze(new Set([
    "$.providerIdentities[*]",
    "$.modelIdentity"
  ]))
});
const EXECUTION_PROFILE_FIELDS = Object.freeze([
  "schemaVersion", "profileType", "productSourceHead", "productSourceVersion", "productRuntimeManifestHash",
  "productRuntimeIdentityType", "executorSourceHead", "executorVersion", "handlerContract", "modelProvider",
  "exactModelLiteral", "acquisitionProviderMode", "directPageMode", "fixedProviderEndpointClasses",
  "fixedEnvironmentVariableNameAllowlist", "credentialPresenceDeclarations", "refinementCeilingPerAnalysis",
  "logicalAcquisitionCeilings", "directPagePhysicalCeilingPerAnalysis", "physicalRetryCeilingPerLogicalSearch",
  "completeAggregatePhysicalAttemptCeiling", "completeAttemptCeilingHash", "networkScope", "resolvedAt", "profileHash"
]);
const TERMINAL_RESULT_FIELDS = Object.freeze([
  "schemaVersion", "resultRecordType", "requestId", "requestHash", "invocationId", "consentHash", "reservationHash",
  "productSourceHead", "productSourceVersion", "executorSourceHead", "executorVersion", "executionProfileHash",
  "pricingProfileHash", "physicalSubmissionIdentity", "submissionState", "terminalState", "startedAt", "completedAt",
  "elapsedDurationMs", "handlerStatus", "sanitizedTerminalResponseEnvelope", "responseDiagnostics",
  "providerAttemptTelemetry", "providerIdentities", "modelIdentity", "callCeilingTelemetry", "costEntry", "governorProof",
  "cognitiveStateIdentity", "experienceRecord", "experienceRecordHash", "terminalEvidence", "errorStage", "errorCategory",
  "canonicalResponseHash", "recordHash"
]);
const UNSCORED_MANIFEST_FIELDS = Object.freeze([
  "schemaVersion", "manifestType", "resultId", "invocationId", "consentHash", "reservationHash", "productSourceHead",
  "productSourceVersion", "executorSourceHead", "executorVersion", "completeFrozenAggregateHash", "requestAggregateHash",
  "executionProfileHash", "pricingProfileHash", "maximumCost", "costLedgerHash", "requestedCount", "submittedCount",
  "terminalCount", "normalSuccessCount", "productTerminalFailureCount", "executionIntegrityFailureCount", "notSubmittedCount",
  "orderedResponseHashInventory", "responseAggregate", "journalAggregate", "resultTreeAggregate", "resultTreeRecords",
  "privateControlsLoaded", "scoringAuthorized", "reflectionAuthorized", "repairAuthorized", "state", "manifestHash"
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function finiteNonnegative(value, label) {
  assert.equal(Number.isFinite(value), true, `${label} must be finite`);
  assert.ok(value >= 0, `${label} must be nonnegative`);
  return value;
}

function finitePositive(value, label) {
  finiteNonnegative(value, label);
  assert.ok(value > 0, `${label} must be positive`);
  return value;
}

function iso(value, label) {
  assert.equal(typeof value, "string", `${label} must be an ISO timestamp`);
  assert.equal(new Date(value).toISOString(), value, `${label} must be canonical ISO UTC`);
  return value;
}

function sealed(core, hashField) {
  return Object.freeze({ ...structuredClone(core), [hashField]: sha256Json(core) });
}

function validateSeal(record, hashField, label) {
  assert.match(record[hashField] || "", HASH, `${label} ${hashField} is invalid`);
  const core = structuredClone(record);
  delete core[hashField];
  assert.equal(sha256Json(core), record[hashField], `${label} hash mismatch`);
}

function immutableConsentCore(consent) {
  const core = structuredClone(consent);
  delete core.status;
  delete core.statusTransitions;
  delete core.statusJournalHash;
  delete core.consentHash;
  delete core.receiptHash;
  return core;
}

function immutableReservationCore(reservation) {
  const core = structuredClone(reservation);
  delete core.state;
  delete core.transitions;
  delete core.transitionJournalHash;
  delete core.reservationHash;
  delete core.recordHash;
  return core;
}

export function calculateCompleteAttemptCeiling(requests = []) {
  assert.equal(Array.isArray(requests), true, "requests must be an array");
  assert.equal(requests.length, 26, "complete attempt ceiling requires exactly 26 requests");
  const seen = new Set();
  const perRequest = requests.map((request, index) => {
    assert.match(request?.analysisId || "", ANALYSIS_ID, `request ${index + 1} analysis ID is invalid`);
    assert.equal(seen.has(request.analysisId), false, `duplicate analysis ID ${request.analysisId}`);
    seen.add(request.analysisId);
    assert.ok(["PHOTO_ONLY", "PHOTO_PLUS_VISIBLE_MARKINGS", "BARCODE_OR_MODEL"].includes(request.lane), `${request.analysisId} lane is invalid`);
    assert.ok(["PERSONAL_BUY", "RESALE", "WHATS_IT_WORTH", "MARKETPLACE_LISTING"].includes(request.customerPurpose), `${request.analysisId} purpose is invalid`);
    return Object.freeze({
      analysisId: request.analysisId,
      lane: request.lane,
      purpose: request.customerPurpose,
      objectIdentityModelAttempts: 1,
      finalPurposeModelAttempts: 1,
      sharedAcquisitionPhysicalAttempts: 28,
      directPagePhysicalAttempts: 2,
      totalPhysicalAttempts: 32,
      routingReason: "RETAIL_ROUTE_IS_DETERMINED_BY_FROZEN_PRODUCT_IDENTITY_OUTPUT_SO_THE_28_ATTEMPT_MAXIMUM_IS_RESERVED_FAIL_CLOSED"
    });
  });
  const categories = Object.freeze({
    objectIdentityModel: 26,
    finalPurposeModel: 26,
    sharedAcquisitionPhysicalPool: 728,
    directPagePhysicalPool: 52,
    totalPhysicalAttempts: 832
  });
  const includedBoundaries = Object.freeze({
    standardAcquisition: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    currentRetailAcquisition: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    serperSearch: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    serperShopping: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    openAiWebSearch: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    providerFallback: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    onePhysicalRetryPerLogicalSearch: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    oneBoundedRefinementPhase: "INCLUDED_IN_SHARED_ACQUISITION_PHYSICAL_POOL",
    directPageRedirects: "INCLUDED_IN_DIRECT_PAGE_PHYSICAL_POOL",
    topLevelModelRetry: "NOT_COMMITTED_BY_FROZEN_PRODUCT_SOURCE"
  });
  assert.equal(perRequest.reduce((total, record) => total + record.totalPhysicalAttempts, 0), categories.totalPhysicalAttempts);
  const core = { schemaVersion: EXECUTION_SCHEMA_VERSION, requestCount: 26, categories, includedBoundaries, perRequest };
  return sealed(core, "ceilingHash");
}

export function validateAttemptCeiling(ceiling, requests) {
  const expected = calculateCompleteAttemptCeiling(requests);
  assert.deepEqual(ceiling, expected, "complete provider-attempt ceiling differs from frozen source authority");
  return Object.freeze({ valid: true, totalPhysicalAttempts: ceiling.categories.totalPhysicalAttempts, ceilingHash: ceiling.ceilingHash });
}

export function createExecutionProfile({
  productRuntimeManifestHash,
  executorSourceHead,
  model,
  acquisitionProviderMode,
  credentialPresence,
  attemptCeiling,
  resolvedAt
}) {
  assert.match(productRuntimeManifestHash || "", HASH);
  assert.match(executorSourceHead || "", COMMIT);
  assert.match(model || "", PUBLIC_IDENTITY);
  assert.ok(["OPENAI_WEB_SEARCH_ONLY", "SERPER_WITH_OPENAI_WEB_SEARCH_FALLBACK"].includes(acquisitionProviderMode));
  exactKeys(credentialPresence, ["OPENAI_API_KEY", "OPEN_API_KEY", "SERPER_API_KEY"], "credential presence declarations");
  Object.values(credentialPresence).forEach((value) => assert.equal(typeof value, "boolean"));
  assert.match(attemptCeiling?.ceilingHash || "", HASH);
  const core = {
    schemaVersion: EXECUTION_SCHEMA_VERSION,
    profileType: EXECUTION_PROFILE_TYPE,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    productRuntimeManifestHash,
    productRuntimeIdentityType: "CLEAN_DETACHED_GIT_WORKTREE_FULL_TRACKED_TREE",
    executorSourceHead,
    executorVersion: EXECUTOR_VERSION,
    handlerContract: {
      export: "api/generate-listing.js#createGenerateListingHandler",
      bridge: "scripts/local-generate-listing-bridge.mjs",
      method: "POST",
      path: "/api/generate-listing"
    },
    modelProvider: "OPENAI",
    exactModelLiteral: model,
    acquisitionProviderMode,
    directPageMode: "PRODUCT_BOUNDED_ONLY",
    fixedProviderEndpointClasses: [...FIXED_PROVIDER_ENDPOINT_CLASSES],
    fixedEnvironmentVariableNameAllowlist: [...FIXED_ENVIRONMENT_ALLOWLIST],
    credentialPresenceDeclarations: { ...credentialPresence },
    refinementCeilingPerAnalysis: 1,
    logicalAcquisitionCeilings: { standard: 12, currentRetail: 28 },
    directPagePhysicalCeilingPerAnalysis: 2,
    physicalRetryCeilingPerLogicalSearch: 1,
    completeAggregatePhysicalAttemptCeiling: attemptCeiling.categories.totalPhysicalAttempts,
    completeAttemptCeilingHash: attemptCeiling.ceilingHash,
    networkScope: {
      openAiResponsesApi: true,
      benchmarkConfiguredWebSearch: true,
      serperWhenCredentialPresent: acquisitionProviderMode === "SERPER_WITH_OPENAI_WEB_SEARCH_FALLBACK",
      productBoundedDirectPages: true,
      arbitraryEndpoints: false
    },
    resolvedAt: iso(resolvedAt, "execution profile resolvedAt")
  };
  return sealed(core, "profileHash");
}

export function validateExecutionProfile(profile, { attemptCeiling, executorSourceHead, productRuntimeManifestHash }) {
  exactKeys(profile, EXECUTION_PROFILE_FIELDS, "execution profile");
  assert.equal(profile.schemaVersion, EXECUTION_SCHEMA_VERSION);
  assert.equal(profile.profileType, EXECUTION_PROFILE_TYPE);
  assert.equal(profile.productSourceHead, PRODUCT_SOURCE_HEAD);
  assert.equal(profile.productSourceVersion, PRODUCT_SOURCE_VERSION);
  assert.equal(profile.executorVersion, EXECUTOR_VERSION);
  assert.equal(profile.executorSourceHead, executorSourceHead);
  assert.equal(profile.productRuntimeManifestHash, productRuntimeManifestHash, "product runtime manifest hash mismatch");
  assert.equal(profile.completeAttemptCeilingHash, attemptCeiling.ceilingHash);
  assert.equal(profile.completeAggregatePhysicalAttemptCeiling, 832);
  assert.deepEqual(profile.fixedEnvironmentVariableNameAllowlist, FIXED_ENVIRONMENT_ALLOWLIST);
  assert.deepEqual(profile.fixedProviderEndpointClasses, FIXED_PROVIDER_ENDPOINT_CLASSES);
  assert.match(profile.exactModelLiteral || "", PUBLIC_IDENTITY, "execution profile model identity is invalid");
  profile.fixedProviderEndpointClasses.forEach((value) => assert.match(value, PUBLIC_IDENTITY, "execution profile endpoint class is invalid"));
  assert.equal(profile.networkScope.arbitraryEndpoints, false);
  validateSeal(profile, "profileHash", "execution profile");
  return Object.freeze({ valid: true, profileHash: profile.profileHash });
}

export function createPricingProfile({
  pricingProfileId,
  provider,
  exactModel,
  effectiveDate,
  pricingSourceDescription,
  inputTokenRatePerMillion,
  cachedInputTokenRatePerMillion,
  outputTokenRatePerMillion,
  webSearchCallRate,
  serperSearchCallRate,
  directPageCostAssumption,
  conservativeUncertaintyMargin,
  createdAt
}) {
  assert.match(pricingProfileId || "", SAFE_ID);
  assert.equal(provider, "OPENAI");
  assert.match(exactModel || "", PUBLIC_IDENTITY);
  assert.match(effectiveDate || "", /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(String(pricingSourceDescription || "").length >= 8 && String(pricingSourceDescription).length <= 500);
  for (const [label, value] of Object.entries({ inputTokenRatePerMillion, cachedInputTokenRatePerMillion, outputTokenRatePerMillion, webSearchCallRate, serperSearchCallRate, directPageCostAssumption, conservativeUncertaintyMargin })) {
    finiteNonnegative(value, label);
  }
  const core = {
    schemaVersion: EXECUTION_SCHEMA_VERSION,
    pricingProfileId,
    provider,
    exactModel,
    effectiveDate,
    pricingSourceDescription,
    inputTokenPricing: { unit: "USD_PER_MILLION_TOKENS", rate: inputTokenRatePerMillion },
    cachedInputTokenPricing: { unit: "USD_PER_MILLION_TOKENS", rate: cachedInputTokenRatePerMillion },
    outputTokenPricing: { unit: "USD_PER_MILLION_TOKENS", rate: outputTokenRatePerMillion },
    webSearchToolPricing: { unit: "USD_PER_CALL", rate: webSearchCallRate },
    serperSearchPricing: { unit: "USD_PER_CALL", rate: serperSearchCallRate },
    directPageCostAssumption: { unit: "USD_PER_FETCH", rate: directPageCostAssumption },
    currency: ALLOWED_CURRENCY,
    conservativeUncertaintyMargin,
    createdAt: iso(createdAt, "pricing profile createdAt")
  };
  return sealed(core, "pricingProfileHash");
}

export function validatePricingProfile(profile, executionProfile) {
  assert.equal(profile.schemaVersion, EXECUTION_SCHEMA_VERSION);
  assert.equal(profile.provider, executionProfile.modelProvider, "pricing provider mismatch");
  assert.equal(profile.exactModel, executionProfile.exactModelLiteral, "pricing model mismatch");
  assert.equal(profile.currency, ALLOWED_CURRENCY);
  const units = [
    [profile.inputTokenPricing, "USD_PER_MILLION_TOKENS"],
    [profile.cachedInputTokenPricing, "USD_PER_MILLION_TOKENS"],
    [profile.outputTokenPricing, "USD_PER_MILLION_TOKENS"],
    [profile.webSearchToolPricing, "USD_PER_CALL"],
    [profile.serperSearchPricing, "USD_PER_CALL"],
    [profile.directPageCostAssumption, "USD_PER_FETCH"]
  ];
  for (const [record, unit] of units) {
    assert.equal(record?.unit, unit, `pricing unit must be ${unit}`);
    finiteNonnegative(record.rate, `${unit} rate`);
  }
  finiteNonnegative(profile.conservativeUncertaintyMargin, "pricing uncertainty margin");
  validateSeal(profile, "pricingProfileHash", "pricing profile");
  return Object.freeze({ valid: true, pricingProfileHash: profile.pricingProfileHash });
}

export function conservativeAttemptCost(attempt, pricingProfile) {
  const margin = 1 + pricingProfile.conservativeUncertaintyMargin;
  if (["OBJECT_IDENTITY_MODEL", "FINAL_PURPOSE_MODEL"].includes(attempt.category)) {
    const input = finiteNonnegative(attempt.inputTokens ?? 360000, "input tokens") / 1_000_000 * pricingProfile.inputTokenPricing.rate;
    const output = finiteNonnegative(attempt.outputTokens ?? 6000, "output tokens") / 1_000_000 * pricingProfile.outputTokenPricing.rate;
    return (input + output) * margin;
  }
  if (attempt.category === "OPENAI_WEB_SEARCH") {
    const model = conservativeAttemptCost({ category: "FINAL_PURPOSE_MODEL", inputTokens: attempt.inputTokens, outputTokens: attempt.outputTokens }, pricingProfile);
    return model + pricingProfile.webSearchToolPricing.rate * margin;
  }
  if (attempt.category === "SERPER_SEARCH") return pricingProfile.serperSearchPricing.rate * margin;
  if (attempt.category === "DIRECT_PAGE") return pricingProfile.directPageCostAssumption.rate * margin;
  assert.fail(`unsupported attempt cost category ${attempt.category}`);
}

export function conservativeMaximumCost(attemptCeiling, pricingProfile, acquisitionMode = "OPENAI_WEB_SEARCH_ONLY") {
  const modelCost = conservativeAttemptCost({ category: "OBJECT_IDENTITY_MODEL" }, pricingProfile) * 26
    + conservativeAttemptCost({ category: "FINAL_PURPOSE_MODEL" }, pricingProfile) * 26;
  const acquisitionCategory = acquisitionMode === "SERPER_WITH_OPENAI_WEB_SEARCH_FALLBACK" ? "OPENAI_WEB_SEARCH" : "OPENAI_WEB_SEARCH";
  const acquisitionCost = conservativeAttemptCost({ category: acquisitionCategory }, pricingProfile) * attemptCeiling.categories.sharedAcquisitionPhysicalPool;
  const directCost = conservativeAttemptCost({ category: "DIRECT_PAGE" }, pricingProfile) * attemptCeiling.categories.directPagePhysicalPool;
  return Number((modelCost + acquisitionCost + directCost).toFixed(8));
}

export function createExecutionConsent(scope, nowIso) {
  assert.match(scope.consentId || "", SAFE_ID);
  assert.match(scope.invocationId || "", SAFE_ID);
  assert.match(scope.resultId || "", SAFE_ID);
  assert.equal(scope.benchmarkId, BENCHMARK_ID);
  assert.equal(scope.productSourceHead, PRODUCT_SOURCE_HEAD);
  assert.equal(scope.productSourceVersion, PRODUCT_SOURCE_VERSION);
  assert.equal(scope.executorVersion, EXECUTOR_VERSION);
  assert.equal(scope.orderedRequestHashInventory?.length, 26);
  assert.equal(new Set(scope.orderedRequestHashInventory).size, 26);
  scope.orderedRequestHashInventory.forEach((hash) => assert.match(hash, HASH));
  assert.equal(scope.authorizedRequestCount, 26);
  assert.equal(scope.completePhysicalAttemptCeiling, 832);
  finitePositive(scope.maximumAuthorizedCost, "maximum authorized cost");
  finiteNonnegative(scope.conservativeMaximumCost, "conservative maximum cost");
  assert.ok(scope.conservativeMaximumCost <= scope.maximumAuthorizedCost, "conservative maximum exceeds authorized cost");
  assert.equal(scope.fixedResultRoot, `benchmarks/blind-object-v2-results/${scope.resultId}`);
  for (const field of ["privateControlsAuthorized", "scoringAuthorized", "reflectionAuthorized", "repairAuthorized", "deploymentAuthorized"]) assert.equal(scope[field], false);
  const immutable = {
    schemaVersion: CONSENT_SCHEMA_VERSION,
    receiptType: CONSENT_RECEIPT_TYPE,
    ...structuredClone(scope)
  };
  const consentHash = sha256Json(immutable);
  const transition = sealed({ sequence: 1, from: null, to: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED, at: iso(nowIso, "consent transition time"), reason: "EXACT_SCOPE_AUTHORIZED" }, "transitionHash");
  const record = {
    ...immutable,
    status: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED,
    statusTransitions: [transition],
    statusJournalHash: sha256Json([transition]),
    consentHash
  };
  return sealed(record, "receiptHash");
}

export function validateExecutionConsent(consent, scope = {}) {
  assert.equal(consent.schemaVersion, CONSENT_SCHEMA_VERSION, "consent schemaVersion is invalid");
  assert.equal(consent.receiptType, CONSENT_RECEIPT_TYPE, "consent receiptType is invalid");
  assert.match(consent.consentHash || "", HASH);
  assert.equal(sha256Json(immutableConsentCore(consent)), consent.consentHash, "consent immutable hash mismatch");
  assert.equal(consent.statusJournalHash, sha256Json(consent.statusTransitions), "consent status journal mismatch");
  assert.ok(Object.values(CONSENT_STATUS).includes(consent.status));
  if (scope.requiredStatus) assert.equal(consent.status, scope.requiredStatus);
  for (const [field, value] of Object.entries(scope.bindings || {})) assert.deepEqual(consent[field], value, `consent ${field} mismatch`);
  for (const field of ["privateControlsAuthorized", "scoringAuthorized", "reflectionAuthorized", "repairAuthorized", "deploymentAuthorized"]) assert.equal(consent[field], false);
  validateSeal(consent, "receiptHash", "execution consent");
  return Object.freeze({ valid: true, consentHash: consent.consentHash, status: consent.status });
}

export function transitionConsent(consent, to, at, reason) {
  validateExecutionConsent(consent);
  const allowed = {
    [CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED]: [CONSENT_STATUS.CONSUMED, CONSENT_STATUS.REVOKED, CONSENT_STATUS.INVALID],
    [CONSENT_STATUS.CONSUMED]: [],
    [CONSENT_STATUS.REVOKED]: [],
    [CONSENT_STATUS.INVALID]: []
  };
  assert.ok(allowed[consent.status].includes(to), `consent transition ${consent.status} -> ${to} is forbidden`);
  const transition = sealed({ sequence: consent.statusTransitions.length + 1, from: consent.status, to, at: iso(at, "consent transition time"), reason: String(reason || "").slice(0, 160) }, "transitionHash");
  const record = { ...structuredClone(consent), status: to, statusTransitions: [...consent.statusTransitions, transition] };
  record.statusJournalHash = sha256Json(record.statusTransitions);
  delete record.receiptHash;
  return sealed(record, "receiptHash");
}

export function createInvocationReservation(scope, nowIso) {
  assert.match(scope.invocationId || "", SAFE_ID);
  assert.match(scope.resultId || "", SAFE_ID);
  assert.match(scope.consentHash || "", HASH);
  assert.equal(scope.productSourceHead, PRODUCT_SOURCE_HEAD);
  assert.equal(scope.productSourceVersion, PRODUCT_SOURCE_VERSION);
  assert.equal(scope.executorVersion, EXECUTOR_VERSION);
  assert.equal(scope.resultRoot, `benchmarks/blind-object-v2-results/${scope.resultId}`);
  const immutable = { schemaVersion: EXECUTION_SCHEMA_VERSION, reservationType: RESERVATION_TYPE, ...structuredClone(scope) };
  const reservationHash = sha256Json(immutable);
  const transition = sealed({ sequence: 1, from: null, to: RESERVATION_STATE.RESERVED_NOT_STARTED, at: iso(nowIso, "reservation transition time"), reason: "EXCLUSIVE_RESERVATION_CREATED" }, "transitionHash");
  const record = {
    ...immutable,
    state: RESERVATION_STATE.RESERVED_NOT_STARTED,
    transitions: [transition],
    transitionJournalHash: sha256Json([transition]),
    reservationHash
  };
  return sealed(record, "recordHash");
}

export function validateInvocationReservation(reservation, bindings = {}) {
  assert.equal(reservation.schemaVersion, EXECUTION_SCHEMA_VERSION);
  assert.equal(reservation.reservationType, RESERVATION_TYPE);
  assert.match(reservation.reservationHash || "", HASH);
  assert.equal(sha256Json(immutableReservationCore(reservation)), reservation.reservationHash, "reservation immutable hash mismatch");
  assert.equal(reservation.transitionJournalHash, sha256Json(reservation.transitions), "reservation transition journal mismatch");
  assert.ok(Object.values(RESERVATION_STATE).includes(reservation.state));
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(reservation[field], value, `reservation ${field} mismatch`);
  validateSeal(reservation, "recordHash", "invocation reservation");
  return Object.freeze({ valid: true, reservationHash: reservation.reservationHash, state: reservation.state });
}

export function transitionReservation(reservation, to, at, reason) {
  validateInvocationReservation(reservation);
  const allowed = {
    [RESERVATION_STATE.RESERVED_NOT_STARTED]: [RESERVATION_STATE.STARTED, RESERVATION_STATE.FAILED_BEFORE_START, RESERVATION_STATE.INVALID],
    [RESERVATION_STATE.STARTED]: [RESERVATION_STATE.INDETERMINATE, RESERVATION_STATE.CONSUMED, RESERVATION_STATE.INVALID],
    [RESERVATION_STATE.INDETERMINATE]: [RESERVATION_STATE.CONSUMED, RESERVATION_STATE.INVALID],
    [RESERVATION_STATE.FAILED_BEFORE_START]: [],
    [RESERVATION_STATE.CONSUMED]: [],
    [RESERVATION_STATE.INVALID]: []
  };
  assert.ok(allowed[reservation.state].includes(to), `reservation transition ${reservation.state} -> ${to} is forbidden`);
  const transition = sealed({ sequence: reservation.transitions.length + 1, from: reservation.state, to, at: iso(at, "reservation transition time"), reason: String(reason || "").slice(0, 160) }, "transitionHash");
  const record = { ...structuredClone(reservation), state: to, transitions: [...reservation.transitions, transition] };
  record.transitionJournalHash = sha256Json(record.transitions);
  delete record.recordHash;
  return sealed(record, "recordHash");
}

function sealJournalEntry(entry) {
  const core = structuredClone(entry);
  delete core.entryHash;
  return sealed(core, "entryHash");
}

export function createExecutionJournal({ invocationId, consentHash, requests, nowIso }) {
  assert.match(invocationId || "", SAFE_ID);
  assert.match(consentHash || "", HASH);
  assert.equal(requests.length, 26);
  const entries = requests.map((request, index) => sealJournalEntry({
    order: index + 1,
    analysisId: request.analysisId,
    requestHash: request.requestContractHash,
    physicalSubmissionIdentity: null,
    state: REQUEST_STATE.NOT_SUBMITTED,
    transitions: [sealed({ sequence: 1, from: null, to: REQUEST_STATE.NOT_SUBMITTED, at: iso(nowIso, "journal creation time"), reason: "CANONICAL_REQUEST_REGISTERED" }, "transitionHash")]
  }));
  const core = { schemaVersion: EXECUTION_SCHEMA_VERSION, invocationId, consentHash, entries };
  return sealed(core, "journalHash");
}

export function validateExecutionJournal(journal, requests = null) {
  assert.equal(journal.schemaVersion, EXECUTION_SCHEMA_VERSION);
  assert.match(journal.invocationId || "", SAFE_ID);
  assert.match(journal.consentHash || "", HASH);
  assert.equal(journal.entries.length, 26);
  const physicalIds = new Set();
  for (const [index, entry] of journal.entries.entries()) {
    assert.equal(entry.order, index + 1);
    assert.match(entry.analysisId || "", ANALYSIS_ID);
    assert.match(entry.requestHash || "", HASH);
    assert.ok(Object.values(REQUEST_STATE).includes(entry.state));
    const entryCore = structuredClone(entry);
    delete entryCore.entryHash;
    assert.equal(sha256Json(entryCore), entry.entryHash, `${entry.analysisId} journal entry hash mismatch`);
    const last = entry.transitions.at(-1);
    assert.equal(last.to, entry.state, `${entry.analysisId} journal state differs from final transition`);
    for (const transition of entry.transitions) validateSeal(transition, "transitionHash", `${entry.analysisId} journal transition`);
    if (entry.physicalSubmissionIdentity) {
      assert.match(entry.physicalSubmissionIdentity, /^submission-[a-f0-9]{32}$/);
      assert.equal(physicalIds.has(entry.physicalSubmissionIdentity), false, "duplicate physical submission identity");
      physicalIds.add(entry.physicalSubmissionIdentity);
    }
    if (requests) {
      assert.equal(entry.analysisId, requests[index].analysisId);
      assert.equal(entry.requestHash, requests[index].requestContractHash);
    }
  }
  validateSeal(journal, "journalHash", "execution journal");
  return Object.freeze({ valid: true, journalHash: journal.journalHash, physicalSubmissionCount: physicalIds.size });
}

export function transitionRequest(journal, analysisId, to, { at, reason, physicalSubmissionIdentity = null } = {}) {
  validateExecutionJournal(journal);
  const index = journal.entries.findIndex((entry) => entry.analysisId === analysisId);
  assert.ok(index >= 0, `journal request ${analysisId} is absent`);
  const entry = journal.entries[index];
  const allowed = {
    [REQUEST_STATE.NOT_SUBMITTED]: [REQUEST_STATE.SUBMISSION_INTENT_RECORDED, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION],
    [REQUEST_STATE.SUBMISSION_INTENT_RECORDED]: [REQUEST_STATE.SUBMISSION_STARTED, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION],
    [REQUEST_STATE.SUBMISSION_STARTED]: [REQUEST_STATE.TERMINAL, REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION],
    [REQUEST_STATE.TERMINAL]: [],
    [REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION]: [],
    [REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION]: []
  };
  assert.ok(allowed[entry.state].includes(to), `request transition ${entry.state} -> ${to} is forbidden`);
  let submissionIdentity = entry.physicalSubmissionIdentity;
  if (to === REQUEST_STATE.SUBMISSION_INTENT_RECORDED) {
    assert.match(physicalSubmissionIdentity || "", /^submission-[a-f0-9]{32}$/);
    assert.equal(journal.entries.some((candidate) => candidate.physicalSubmissionIdentity === physicalSubmissionIdentity), false, "physical submission identity is already present");
    submissionIdentity = physicalSubmissionIdentity;
  } else if (entry.state === REQUEST_STATE.SUBMISSION_INTENT_RECORDED && to === REQUEST_STATE.SUBMISSION_STARTED) {
    assert.match(submissionIdentity || "", /^submission-[a-f0-9]{32}$/);
  }
  const transition = sealed({ sequence: entry.transitions.length + 1, from: entry.state, to, at: iso(at, "request transition time"), reason: String(reason || "").slice(0, 160) }, "transitionHash");
  const nextEntry = sealJournalEntry({ ...structuredClone(entry), state: to, physicalSubmissionIdentity: submissionIdentity, transitions: [...entry.transitions, transition] });
  const next = { ...structuredClone(journal), entries: journal.entries.map((candidate, candidateIndex) => candidateIndex === index ? nextEntry : candidate) };
  delete next.journalHash;
  return sealed(next, "journalHash");
}

export function requestReplayDisposition(entry) {
  const eligible = [REQUEST_STATE.NOT_SUBMITTED, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION].includes(entry.state)
    && entry.physicalSubmissionIdentity === null;
  return Object.freeze({
    analysisId: entry.analysisId,
    state: entry.state,
    eligible,
    resubmissionPermanentlyBlocked: [REQUEST_STATE.SUBMISSION_STARTED, REQUEST_STATE.TERMINAL, REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION].includes(entry.state),
    reason: eligible ? "NO_SUBMISSION_COULD_HAVE_OCCURRED" : "SUBMITTED_OR_POSSIBLY_SUBMITTED_REQUEST_CANNOT_BE_REPLAYED"
  });
}

export function createCostLedger({ invocationId, consentHash, pricingProfileHash, maximumAuthorizedCost, conservativePreRunMaximum, requests, nowIso }) {
  assert.match(invocationId || "", SAFE_ID);
  assert.match(consentHash || "", HASH);
  assert.match(pricingProfileHash || "", HASH);
  finitePositive(maximumAuthorizedCost, "maximum authorized cost");
  finiteNonnegative(conservativePreRunMaximum, "conservative pre-run maximum");
  assert.equal(requests.length, 26);
  const core = {
    schemaVersion: EXECUTION_SCHEMA_VERSION,
    invocationId,
    consentHash,
    pricingProfileHash,
    currency: ALLOWED_CURRENCY,
    maximumAuthorizedCost,
    conservativePreRunMaximum,
    accruedEstimatedCost: 0,
    actualProviderReportedUsage: [],
    actualCalculatedCost: 0,
    reservedWorstCaseRemainingCost: conservativePreRunMaximum,
    perRequestCostRecords: requests.map((request) => ({ analysisId: request.analysisId, estimatedCost: 0, actualCost: null, attemptCount: 0 })),
    perAttemptCostRecords: [],
    stopBeforeNextRequestDecision: conservativePreRunMaximum > maximumAuthorizedCost,
    updatedAt: iso(nowIso, "cost ledger time")
  };
  return sealed(core, "ledgerHash");
}

export function validateCostLedger(ledger) {
  assert.equal(ledger.schemaVersion, EXECUTION_SCHEMA_VERSION);
  assert.equal(ledger.currency, ALLOWED_CURRENCY);
  for (const field of ["maximumAuthorizedCost", "conservativePreRunMaximum", "accruedEstimatedCost", "actualCalculatedCost", "reservedWorstCaseRemainingCost"]) finiteNonnegative(ledger[field], `ledger ${field}`);
  assert.equal(ledger.perRequestCostRecords.length, 26);
  assert.equal(typeof ledger.stopBeforeNextRequestDecision, "boolean");
  validateSeal(ledger, "ledgerHash", "cost ledger");
  return Object.freeze({ valid: true, ledgerHash: ledger.ledgerHash });
}

export function recordRequestCost(ledger, { analysisId, attempts, estimatedCost, actualCost = null, providerUsage = [], reservedWorstCaseRemainingCost, at }) {
  validateCostLedger(ledger);
  finiteNonnegative(estimatedCost, "estimated request cost");
  if (actualCost !== null) finiteNonnegative(actualCost, "actual request cost");
  finiteNonnegative(reservedWorstCaseRemainingCost, "reserved remaining cost");
  const requestIndex = ledger.perRequestCostRecords.findIndex((record) => record.analysisId === analysisId);
  assert.ok(requestIndex >= 0, `cost ledger request ${analysisId} is absent`);
  assert.equal(ledger.perRequestCostRecords[requestIndex].attemptCount, 0, `${analysisId} already has cost`);
  const attemptRecords = attempts.map((attempt, index) => sealed({ analysisId, sequence: ledger.perAttemptCostRecords.length + index + 1, ...structuredClone(attempt) }, "attemptCostHash"));
  const perRequest = ledger.perRequestCostRecords.map((record, index) => index === requestIndex ? { analysisId, estimatedCost, actualCost, attemptCount: attempts.length } : record);
  const accrued = ledger.accruedEstimatedCost + estimatedCost;
  const actualCalculated = ledger.actualCalculatedCost + (actualCost ?? estimatedCost);
  const next = {
    ...structuredClone(ledger),
    accruedEstimatedCost: Number(accrued.toFixed(8)),
    actualProviderReportedUsage: [...ledger.actualProviderReportedUsage, ...structuredClone(providerUsage)],
    actualCalculatedCost: Number(actualCalculated.toFixed(8)),
    reservedWorstCaseRemainingCost,
    perRequestCostRecords: perRequest,
    perAttemptCostRecords: [...ledger.perAttemptCostRecords, ...attemptRecords],
    stopBeforeNextRequestDecision: accrued + reservedWorstCaseRemainingCost > ledger.maximumAuthorizedCost,
    updatedAt: iso(at, "cost ledger update time")
  };
  delete next.ledgerHash;
  return sealed(next, "ledgerHash");
}

export function createTerminalResult(input) {
  assert.equal(input.schemaVersion, undefined, "terminal input cannot choose schemaVersion");
  assert.match(input.requestId || "", ANALYSIS_ID);
  assert.match(input.requestHash || "", HASH);
  assert.match(input.invocationId || "", SAFE_ID);
  assert.match(input.consentHash || "", HASH);
  assert.match(input.reservationHash || "", HASH);
  assert.match(input.physicalSubmissionIdentity || "", /^submission-[a-f0-9]{32}$/);
  assert.ok([REQUEST_STATE.TERMINAL, REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION].includes(input.submissionState));
  finiteNonnegative(input.elapsedDurationMs, "terminal elapsed duration");
  const responseHash = sha256Json(input.sanitizedTerminalResponseEnvelope);
  const core = {
    schemaVersion: EXECUTION_SCHEMA_VERSION,
    resultRecordType: RESULT_RECORD_TYPE,
    ...structuredClone(input),
    canonicalResponseHash: responseHash
  };
  return sealed(core, "recordHash");
}

export function validateTerminalResult(record, bindings = {}) {
  exactKeys(record, TERMINAL_RESULT_FIELDS, "terminal result");
  assert.equal(record.schemaVersion, EXECUTION_SCHEMA_VERSION);
  assert.equal(record.resultRecordType, RESULT_RECORD_TYPE);
  assert.equal(record.productSourceHead, PRODUCT_SOURCE_HEAD);
  assert.equal(record.productSourceVersion, PRODUCT_SOURCE_VERSION);
  assert.equal(record.executorVersion, EXECUTOR_VERSION);
  assert.match(record.modelIdentity || "", PUBLIC_IDENTITY, "terminal result model identity is invalid");
  assert.ok(Array.isArray(record.providerIdentities), "terminal result provider identities must be an array");
  record.providerIdentities.forEach((value) => assert.match(value, PUBLIC_IDENTITY, "terminal result provider identity is invalid"));
  assert.equal(record.canonicalResponseHash, sha256Json(record.sanitizedTerminalResponseEnvelope));
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(record[field], value, `terminal result ${field} mismatch`);
  validateSeal(record, "recordHash", "terminal result");
  return Object.freeze({ valid: true, recordHash: record.recordHash });
}

export function createUnscoredResultManifest(input) {
  assert.ok(Object.values(RESULT_STATE).includes(input.state));
  assert.equal(input.privateControlsLoaded, false);
  for (const field of ["scoringAuthorized", "reflectionAuthorized", "repairAuthorized"]) assert.equal(input[field], false);
  for (const field of ["requestedCount", "submittedCount", "terminalCount", "normalSuccessCount", "productTerminalFailureCount", "executionIntegrityFailureCount", "notSubmittedCount"]) {
    assert.ok(Number.isInteger(input[field]) && input[field] >= 0, `${field} must be a nonnegative integer`);
  }
  assert.equal(input.requestedCount, 26);
  assert.equal(input.submittedCount + input.notSubmittedCount, input.requestedCount);
  if (input.state === RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING) {
    assert.equal(input.submittedCount, 26);
    assert.equal(input.terminalCount, 26);
    assert.equal(input.executionIntegrityFailureCount, 0);
  }
  return sealed({ schemaVersion: EXECUTION_SCHEMA_VERSION, manifestType: "BENCHMARK_UNSCORED_RESULT_MANIFEST", ...structuredClone(input) }, "manifestHash");
}

export function validateUnscoredResultManifest(manifest) {
  exactKeys(manifest, UNSCORED_MANIFEST_FIELDS, "unscored result manifest");
  assert.equal(manifest.schemaVersion, EXECUTION_SCHEMA_VERSION);
  assert.equal(manifest.manifestType, "BENCHMARK_UNSCORED_RESULT_MANIFEST");
  assert.ok(Object.values(RESULT_STATE).includes(manifest.state));
  assert.equal(manifest.privateControlsLoaded, false);
  assert.equal(manifest.scoringAuthorized, false);
  assert.equal(manifest.reflectionAuthorized, false);
  assert.equal(manifest.repairAuthorized, false);
  validateSeal(manifest, "manifestHash", "unscored result manifest");
  return Object.freeze({ valid: true, state: manifest.state, manifestHash: manifest.manifestHash });
}

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

function assertSafeString(value, location, knownSecretValues) {
  assert.doesNotMatch(value, /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{8,}\b/i, `record exposes an API key at ${location}`);
  assert.doesNotMatch(value, /\bBearer\s+[A-Za-z0-9._~+/=-]{8,}/i, `record exposes bearer authorization at ${location}`);
  assert.doesNotMatch(value, /\bBasic\s+[A-Za-z0-9+/]{8,}={0,2}/i, `record exposes Basic authorization at ${location}`);
  assert.doesNotMatch(value, /\b(?:session(?:id)?|cookie|auth(?:orization)?|token|api[_-]?key)\s*=\s*[^;\s]{8,}/i, `record exposes cookie, session, or credential material at ${location}`);
  assert.doesNotMatch(value, /\b(?:OPENAI_API_KEY|OPEN_API_KEY|SERPER_API_KEY)\s*=\s*\S+/i, `record exposes an environment dump at ${location}`);
  for (const urlText of value.match(/https?:\/\/[^\s"'<>]+/gi) || []) {
    const parsed = new URL(urlText);
    assert.equal(Boolean(parsed.username || parsed.password), false, `record exposes URL credentials at ${location}`);
    for (const name of parsed.searchParams.keys()) {
      assert.doesNotMatch(name, /^(?:api[-_]?key|access[-_]?token|auth(?:orization)?|credential|password|secret|session|sig(?:nature)?|x-amz-signature)$/i, `record exposes a signed or credential-bearing URL at ${location}`);
    }
  }
  assert.equal(highEntropyCredentialLike(value), false, `record exposes high-entropy credential-like material at ${location}`);
  for (const secret of knownSecretValues) assert.equal(value.includes(secret), false, `record contains a known secret value at ${location}`);
}

export function assertNoSecretMaterial(value, options = {}) {
  const normalizedOptions = Array.isArray(options) ? { knownSecretValues: options } : options;
  assert.ok(normalizedOptions && typeof normalizedOptions === "object", "secret scan options must be an object");
  const knownEnvironment = normalizedOptions.knownEnvironment || {};
  assert.ok(knownEnvironment && typeof knownEnvironment === "object" && !Array.isArray(knownEnvironment), "known environment must be an object");
  assert.equal(Object.keys(knownEnvironment).every((name) => FIXED_ENVIRONMENT_ALLOWLIST.includes(name)), true, "known environment contains an unapproved name");
  assert.equal(Object.values(knownEnvironment).every((candidate) => typeof candidate === "string"), true, "known environment values must be strings");
  const knownSecretValues = [
    ...(normalizedOptions.knownSecretValues || []),
    ...Object.entries(knownEnvironment)
      .filter(([name]) => CREDENTIAL_ENVIRONMENT_NAMES.has(name))
      .map(([, candidate]) => candidate)
  ].filter((candidate) => typeof candidate === "string" && candidate.length >= 8);
  const recordType = value?.resultRecordType || value?.profileType || null;
  const publicPaths = PUBLIC_IDENTITY_PATHS[recordType] || null;
  if (publicPaths) assert.equal(normalizedOptions.schemaValidatedRecordType, recordType, `${recordType} public identity scan requires prior strict schema validation`);

  function visit(node, location) {
    if (typeof node === "string") {
      const normalizedPath = location.replace(/\[\d+\]/g, "[*]");
      if (publicPaths?.has(normalizedPath)) assert.match(node, PUBLIC_IDENTITY, `public identity at ${location} is invalid`);
      assertSafeString(node, location, knownSecretValues);
      return;
    }
    if (node === null || typeof node === "boolean" || typeof node === "number") return;
    if (Array.isArray(node)) {
      node.forEach((entry, index) => visit(entry, `${location}[${index}]`));
      return;
    }
    assert.ok(node && typeof node === "object", `secret scan rejects unsupported value at ${location}`);
    for (const key of Object.keys(node).sort()) {
      const schemaControlledCredentialPresence = recordType === EXECUTION_PROFILE_TYPE
        && location === "$.credentialPresenceDeclarations"
        && CREDENTIAL_ENVIRONMENT_NAMES.has(key)
        && typeof node[key] === "boolean";
      if (!schemaControlledCredentialPresence) {
        assert.equal(prohibitedSecretField(key, location), false, `record exposes prohibited secret-bearing field ${key} at ${location}`);
      }
      visit(node[key], `${location}.${key}`);
    }
  }

  visit(value, "$");
  return true;
}
