import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";
import {
  CONSENT_STATUS,
  EXECUTION_MODE,
  EXECUTOR_VERSION,
  PRODUCT_SOURCE_HEAD,
  PRODUCT_SOURCE_VERSION,
  REQUEST_STATE,
  RESERVATION_STATE,
  RESULT_STATE,
  assertNoSecretMaterial,
  calculateCompleteAttemptCeiling,
  conservativeMaximumCost,
  createCostLedger,
  createExecutionConsent,
  createExecutionJournal,
  createExecutionProfile,
  createInvocationReservation,
  createPricingProfile,
  createTerminalResult,
  createUnscoredResultManifest,
  recordRequestCost,
  requestReplayDisposition,
  transitionConsent,
  transitionRequest,
  transitionReservation,
  validateCostLedger,
  validateExecutionConsent,
  validateExecutionJournal,
  validateExecutionProfile,
  validateInvocationReservation,
  validatePricingProfile,
  validateTerminalResult,
  validateUnscoredResultManifest
} from "../benchmarks/blind-object-v2/scripts/execution-protocol.mjs";
import {
  RESULT_ROOT_ARTIFACT_ROLES,
  classifyResultArtifactInventory,
  classifyResultArtifactPath,
  createExclusiveReservation,
  createExclusiveResultRoot,
  deriveResultRoot,
  expectedResultArtifactPaths,
  listResultFiles,
  readJsonStrictFile,
  replaceReservation,
  resolveResultHistoryRoot,
  writeResultFile
} from "../benchmarks/blind-object-v2/scripts/execution-store.mjs";
import {
  auditFrozenProductProviderSurface,
  readAllowedEnvironment,
  resolveExecutionProfile,
  verifyDetachedProductRuntime
} from "../benchmarks/blind-object-v2/scripts/execution-profile.mjs";
import { sha256Json } from "../benchmarks/blind-object-v2/scripts/protocol.mjs";
import { createLaunchScope } from "../benchmarks/blind-object-v2/scripts/launch-identity.mjs";
import { createProductCostSourceManifest } from "../benchmarks/blind-object-v2/scripts/product-cost-source.mjs";
import { underlyingOfferKey } from "../lib/evidence/dedupe.js";
import {
  DECLARED_PUBLIC_EVIDENCE_REFERENCE_FIELDS,
  DECLARED_PUBLIC_SOURCE_COLLECTIONS,
  DECLARED_TYPED_TERMINAL_ROOTS
} from "../benchmarks/blind-object-v2/scripts/typed-public-identifier.mjs";

const EXECUTOR_HEAD = "b".repeat(40);
const RELEASE_IDENTITY = Object.freeze({
  executorRuntimeHead: EXECUTOR_HEAD,
  qualificationHead: "c".repeat(40),
  executorRuntimeTreeHash: "d".repeat(40),
  executionReleaseRecordHash: "e".repeat(64),
  qualificationPolicyVersion: "1.0"
});
const RUNTIME_HASH = "a".repeat(64);
const AT = "2026-08-07T12:00:00.000Z";
const COST_SOURCE_MANIFEST_HASH = createProductCostSourceManifest().manifestHash;

function fakeRequests() {
  const purposes = ["PERSONAL_BUY", "RESALE", "WHATS_IT_WORTH", "MARKETPLACE_LISTING"];
  const lanes = ["PHOTO_ONLY", "PHOTO_PLUS_VISIBLE_MARKINGS", "BARCODE_OR_MODEL"];
  return Array.from({ length: 26 }, (_, index) => {
    const analysisId = `V2-RUN-${String(index + 1).padStart(3, "0")}`;
    return {
      analysisId,
      lane: lanes[index % lanes.length],
      customerPurpose: purposes[index % purposes.length],
      requestContractHash: sha256Json({ analysisId, index })
    };
  });
}

function profileAndCeiling(requests = fakeRequests(), overrides = {}) {
  const attemptCeiling = calculateCompleteAttemptCeiling(requests);
  const profile = createExecutionProfile({
    productRuntimeManifestHash: RUNTIME_HASH,
    ...RELEASE_IDENTITY,
    model: "gpt-4.1-mini",
    acquisitionProviderMode: "OPENAI_WEB_SEARCH_ONLY",
    credentialPresence: { OPENAI_API_KEY: true, OPEN_API_KEY: false, SERPER_API_KEY: false },
    attemptCeiling,
    resolvedAt: AT,
    ...overrides
  });
  return { profile, attemptCeiling };
}

function pricing(exactModel = "gpt-4.1-mini", overrides = {}) {
  return createPricingProfile({
    provider: "OPENAI",
    exactModel,
    effectiveDate: "2026-08-08",
    pricingSourceDescription: "Synthetic deterministic rates used only by offline tests.",
    inputTokenRatePerMillion: 0.4,
    cachedInputTokenRatePerMillion: 0.1,
    outputTokenRatePerMillion: 1.6,
    webSearchCallRate: 0.01,
    serperSearchCallRate: null,
    directPageCostAssumption: 0,
    conservativeUncertaintyMargin: 0.2,
    createdAt: AT,
    ...overrides
  });
}

function consentScope(requests, profile, pricingProfile, ceiling, overrides = {}) {
  const costEnvelopeHash = overrides.costEnvelopeHash || "e".repeat(64);
  const launchScope = createLaunchScope({
    benchmarkId: "blind-object-v2",
    candidateSetId: "SYNTHETIC-HOLDOUT",
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    productRuntimeManifestHash: RUNTIME_HASH,
    productCostSourceManifestHash: COST_SOURCE_MANIFEST_HASH,
    ...RELEASE_IDENTITY,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: "1".repeat(64),
    freezeManifestHash: "2".repeat(64),
    freezeReceiptHash: "3".repeat(64),
    requestAggregateHash: "4".repeat(64),
    orderedRequestHashInventory: requests.map((request) => request.requestContractHash),
    handlerContract: profile.handlerContract,
    modelProvider: profile.modelProvider,
    exactModelLiteral: profile.exactModelLiteral,
    acquisitionProviderMode: profile.acquisitionProviderMode,
    directPageMode: profile.directPageMode,
    endpointClassAllowlistHash: sha256Json(profile.fixedProviderEndpointClasses),
    environmentNameAllowlistHash: sha256Json(profile.fixedEnvironmentVariableNameAllowlist),
    completePhysicalAttemptCeiling: 832,
    completeAttemptCeilingHash: ceiling.ceilingHash,
    executionProfileIdentityHash: profile.executionProfileIdentityHash,
    pricingProfileIdentityHash: pricingProfile.pricingProfileIdentityHash,
    costEnvelopeHash,
    zeroExternalSupersessionReceiptId: `supersession-${"8".repeat(48)}`,
    zeroExternalSupersessionReceiptHash: "8".repeat(64),
    continuationScopeHash: null,
    continuationRequestAggregateHash: null,
    continuationOrderedRequestHashInventory: [],
    terminalFailureReceiptId: null,
    terminalFailureReceiptHash: null,
    priorPhysicalAttemptCount: 0,
    priorConservativeCost: 0,
    remainingPhysicalAttemptAuthority: 832,
    remainingConservativeCostAuthority: 40,
    continuationPhysicalAttemptCeiling: 832,
    continuationConservativeMaximumCost: null,
    cumulativeConservativeMaximumCost: null,
    authorizedRequestCount: 26,
    maximumAuthorizedCostMinorUnits: 4000,
    networkPolicyHash: sha256Json(profile.networkScope),
    privateControlsAuthorized: overrides.privateControlsAuthorized ?? false,
    scoringAuthorized: overrides.scoringAuthorized ?? false,
    reflectionAuthorized: overrides.reflectionAuthorized ?? false,
    repairAuthorized: overrides.repairAuthorized ?? false,
    deploymentAuthorized: overrides.deploymentAuthorized ?? false
  });
  const costEnvelope = {
    costEnvelopeHash,
    costState: "COMPLETE_RUN_WITHIN_AUTHORIZED_COST",
    authorizedMaximumMinorUnits: 4000,
    conservativeMaximumCostMinorUnits: 100,
    conservativeMaximumCost: 1
  };
  return { launchScope, costEnvelope };
}

function reservationScope(requests, consent, profile, pricingProfile, suppliedLaunchScope = null) {
  const launchScope = suppliedLaunchScope || consentScope(requests, profile, pricingProfile, calculateCompleteAttemptCeiling(requests)).launchScope;
  return {
    launchScope,
    consent,
    executionProfileHash: profile.profileHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    createdIdentity: "executor-synthetic"
  };
}

async function withTemp(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-v2-execution-test-"));
  try {
    return await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

function legacyAssertNoSecretMaterial(value, knownSecrets = []) {
  const text = JSON.stringify(value);
  for (const secret of knownSecrets.filter((candidate) => typeof candidate === "string" && candidate.length >= 8)) {
    assert.equal(text.includes(secret), false, "record contains a known secret value");
  }
  return true;
}

function terminalFixture(overrides = {}) {
  const requests = fakeRequests();
  const { profile, attemptCeiling } = profileAndCeiling(requests);
  const rates = pricing();
  const consent = createExecutionConsent(consentScope(requests, profile, rates, attemptCeiling), AT);
  const reservation = createInvocationReservation(reservationScope(requests, consent, profile, rates), AT);
  const terminal = createTerminalResult({
    requestId: "V2-RUN-001",
    requestHash: requests[0].requestContractHash,
    launchScopeHash: consent.launchScopeHash,
    resultId: consent.resultId,
    resultRootName: consent.resultRootName,
    invocationId: consent.invocationId,
    consentHash: consent.consentHash,
    reservationHash: reservation.reservationHash,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    ...RELEASE_IDENTITY,
    executorVersion: EXECUTOR_VERSION,
    executionProfileHash: profile.profileHash,
    executionProfileIdentityHash: profile.executionProfileIdentityHash,
    pricingProfileHash: rates.pricingProfileHash,
    pricingProfileIdentityHash: rates.pricingProfileIdentityHash,
    costEnvelopeHash: consent.costEnvelopeHash,
    physicalSubmissionIdentity: "submission-44444444444444444444444444444444",
    submissionState: REQUEST_STATE.TERMINAL,
    terminalState: "NORMAL_SUCCESS",
    startedAt: AT,
    completedAt: "2026-08-07T12:00:00.001Z",
    elapsedDurationMs: 1,
    handlerStatus: 200,
    sanitizedTerminalResponseEnvelope: { statusCode: 200, headers: { "content-type": "application/json" }, body: { disposition: "COMPLETE" } },
    responseDiagnostics: {},
    providerAttemptTelemetry: [],
    providerIdentities: ["OPENAI"],
    modelIdentity: profile.exactModelLiteral,
    callCeilingTelemetry: {},
    costEntry: {},
    governorProof: null,
    cognitiveStateIdentity: "",
    experienceRecord: null,
    experienceRecordHash: "",
    terminalEvidence: null,
    errorStage: "",
    errorCategory: "",
    ...overrides
  });
  return { terminal, profile, attemptCeiling };
}

function unscoredManifestFixture(overrides = {}) {
  return createUnscoredResultManifest({
    launchScopeHash: "0".repeat(64),
    resultId: "synthetic-result-structural",
    resultRootName: "result-root-" + "0".repeat(48),
    invocationId: "synthetic-invocation-structural",
    consentHash: "1".repeat(64),
    reservationHash: "2".repeat(64),
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    ...RELEASE_IDENTITY,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: "3".repeat(64),
    requestAggregateHash: "4".repeat(64),
    executionProfileHash: "5".repeat(64),
    executionProfileIdentityHash: "b".repeat(64),
    pricingProfileHash: "6".repeat(64),
    pricingProfileIdentityHash: "c".repeat(64),
    costEnvelopeHash: "d".repeat(64),
    maximumCost: 40,
    costLedgerHash: "7".repeat(64),
    requestedCount: 26,
    submittedCount: 26,
    terminalCount: 26,
    normalSuccessCount: 24,
    productTerminalFailureCount: 2,
    executionIntegrityFailureCount: 0,
    notSubmittedCount: 0,
    orderedResponseHashInventory: [],
    responseAggregate: "8".repeat(64),
    orderedHandlerReturnedReceiptInventory: [],
    handlerReturnedAggregate: sha256Json([]),
    journalAggregate: "9".repeat(64),
    resultTreeAggregate: "a".repeat(64),
    resultTreeRecords: [],
    privateControlsLoaded: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    state: RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING,
    ...overrides
  });
}

const SCAN_ENVIRONMENT = Object.freeze({
  OPENAI_API_KEY: "secret-primary-123",
  OPEN_API_KEY: "",
  OPENAI_MODEL: "gpt-4.1-mini",
  SERPER_API_KEY: ""
});

function scanValidatedTerminal(terminal, knownEnvironment = SCAN_ENVIRONMENT) {
  validateTerminalResult(terminal);
  return assertNoSecretMaterial(terminal, {
    knownEnvironment,
    schemaValidatedRecordType: terminal.resultRecordType
  });
}

test("A-C: frozen product release and executor release stay distinct and runtime drift fails closed", async () => {
  assert.equal(PRODUCT_SOURCE_HEAD, "7056eb0601dc69c5985703fea6fe665e82c6bed8");
  assert.equal(PRODUCT_SOURCE_VERSION, "1.12.13");
  assert.equal(EXECUTOR_VERSION, "1.12.22");
  const { profile, attemptCeiling } = profileAndCeiling();
  assert.notEqual(profile.productSourceVersion, profile.executorVersion);
  assert.throws(() => validateExecutionProfile({ ...profile, productRuntimeManifestHash: "c".repeat(64) }, { attemptCeiling, releaseIdentity: RELEASE_IDENTITY, productRuntimeManifestHash: RUNTIME_HASH }), /runtime|hash|mismatch/i);
  assert.throws(() => verifyDetachedProductRuntime(process.cwd()), /detached|clean|frozen product release/i);
});

test("D-F: execution profile is deterministic, environment-allowlisted, and secret-free", async () => {
  const requests = fakeRequests();
  const sourceText = await readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8");
  const first = await resolveExecutionProfile({
    freezeRequests: requests,
    environment: { OPENAI_API_KEY: "secret-primary-123", OPENAI_MODEL: "gpt-4.1-mini", UNAPPROVED: "evil" },
    productRuntimeManifestHash: RUNTIME_HASH,
    releaseIdentity: RELEASE_IDENTITY,
    resolvedAt: AT,
    productSourceText: sourceText
  });
  const second = await resolveExecutionProfile({
    freezeRequests: requests,
    environment: { OPENAI_API_KEY: "different-secret-456", OPENAI_MODEL: "gpt-4.1-mini", KATHERINES_EYE_HANDLER_ADAPTER_MODULE: "C:/evil.mjs" },
    productRuntimeManifestHash: RUNTIME_HASH,
    releaseIdentity: RELEASE_IDENTITY,
    resolvedAt: AT,
    productSourceText: sourceText
  });
  assert.equal(first.profile.profileHash, second.profile.profileHash);
  assert.equal(validateExecutionProfile(first.profile, { attemptCeiling: first.attemptCeiling, releaseIdentity: RELEASE_IDENTITY, productRuntimeManifestHash: RUNTIME_HASH }).valid, true);
  assertNoSecretMaterial(first.profile, {
    knownEnvironment: first.allowedEnvironment.secretValues,
    schemaValidatedRecordType: first.profile.profileType
  });
  assert.deepEqual(first.profile.fixedEnvironmentVariableNameAllowlist, ["OPENAI_API_KEY", "OPEN_API_KEY", "OPENAI_MODEL", "SERPER_API_KEY"]);
  assert.equal(first.profile.exactModelLiteral, "gpt-4.1-mini");
  assert.equal(first.profile.acquisitionProviderMode, "OPENAI_WEB_SEARCH_ONLY");
  assert.equal(readAllowedEnvironment({ OPEN_API_KEY: "alias-secret" }).model, "gpt-4.1-mini");
  assert.throws(() => readAllowedEnvironment({}), /credential presence/);
});

test("scanner A: the pre-repair known-value rule reproduces the public-model false positive", () => {
  const { terminal } = terminalFixture();
  assert.equal(terminal.modelIdentity, "gpt-4.1-mini");
  assert.throws(
    () => legacyAssertNoSecretMaterial(terminal, Object.values(SCAN_ENVIRONMENT)),
    /known secret value/
  );
});

test("scanner A2: the rejected public-offer identifier class passes only through recomputed typed provenance", () => {
  const publicSource = {
    canonicalUrl: "https://example.com/public/listing/12345?color=blue",
    marketplaceItemId: "12345",
    seller: "Public Seller"
  };
  publicSource.evidenceId = underlyingOfferKey(publicSource);
  publicSource.underlyingOfferId = publicSource.evidenceId;
  assert.match(publicSource.evidenceId, /%/);

  const collectionSurface = Object.fromEntries(
    DECLARED_PUBLIC_SOURCE_COLLECTIONS.map((field) => [field, [structuredClone(publicSource)]])
  );
  const referenceSurface = Object.fromEntries(
    DECLARED_PUBLIC_EVIDENCE_REFERENCE_FIELDS.map((field) => [field, field === "observedEvidenceId" || field === "selectedEvidenceId" ? publicSource.evidenceId : [publicSource.evidenceId]])
  );
  const rootSurface = Object.fromEntries(DECLARED_TYPED_TERMINAL_ROOTS.map((root) => [root, {
    ...structuredClone(collectionSurface),
    ...structuredClone(referenceSurface)
  }]));
  rootSurface.sanitizedTerminalResponseEnvelope = {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: { ...structuredClone(collectionSurface), ...structuredClone(referenceSurface) }
  };
  const { terminal } = terminalFixture(rootSurface);
  assert.equal(scanValidatedTerminal(terminal), true);
  assert.ok(terminal.typedPublicIdentifierProvenance.length >= DECLARED_TYPED_TERMINAL_ROOTS.length * DECLARED_PUBLIC_SOURCE_COLLECTIONS.length);
  assert.equal(terminal.typedPublicIdentifierProvenance.every((entry) => entry.identifierType === "CANONICAL_PUBLIC_OFFER_IDENTITY_V1"), true);
  assert.equal(terminal.typedPublicIdentifierProvenance.every((entry) => entry.identityAlgorithm === "lib/evidence/dedupe.js#underlyingOfferKey"), true);
  assert.equal(terminal.typedPublicIdentifierProvenance.every((entry) => entry.publicPreimagePath.includes("canonicalUrl")), true);
});

test("scanner A3: wrong paths, caller declarations, and credential shapes remain fail-closed in evidenceId", () => {
  const publicSource = { canonicalUrl: "https://example.com/public/listing/98765", marketplaceItemId: "98765", seller: "Public Seller" };
  publicSource.evidenceId = underlyingOfferKey(publicSource);
  const wrongPath = terminalFixture({ experienceRecord: { callerSelectedPublicRecords: [publicSource] } }).terminal;
  validateTerminalResult(wrongPath);
  assert.throws(() => scanValidatedTerminal(wrongPath), /high-entropy credential-like material/);
  assert.throws(() => terminalFixture({ typedPublicIdentifierProvenance: [{ callerDeclaredPublic: true }] }), /cannot declare public identifier provenance/);

  const credentialShapes = [
    "sk-proj-A1b2C3d4E5f6G7h8I9j0K1l2",
    "Bearer AbCdEf0123456789+/=",
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.AbCdEfGhIjKlMnOpQrStUv",
    "sessionid=AbCdEf0123456789+/=",
    "-----BEGIN PRIVATE KEY-----\nAbCdEf0123456789\n-----END PRIVATE KEY-----"
  ];
  for (const evidenceId of credentialShapes) {
    const terminal = terminalFixture({ experienceRecord: { sourcesAccepted: [{ ...publicSource, evidenceId }] } }).terminal;
    validateTerminalResult(terminal);
    assert.equal(terminal.typedPublicIdentifierProvenance.some((entry) => entry.path.endsWith(".evidenceId")), false);
    assert.throws(() => scanValidatedTerminal(terminal), /API key|bearer|JWT|cookie|session|private key/i);
  }
});

test("scanner B and I: exact schema-controlled public identities pass and remain sealed", () => {
  const publicModels = ["gpt-4.1-mini", "gpt-120.45-mini", "claude-3.7-sonnet"];
  for (const modelIdentity of publicModels) {
    const { terminal } = terminalFixture({ modelIdentity, providerIdentities: ["OPENAI", "UNRELATED_PROVIDER"] });
    assert.equal(scanValidatedTerminal(terminal), true);
    assert.equal(terminal.modelIdentity, modelIdentity);
    assert.equal(terminal.providerIdentities.includes("OPENAI"), true);
    assert.match(terminal.recordHash, /^[a-f0-9]{64}$/);
  }
  const { profile, attemptCeiling } = profileAndCeiling(fakeRequests(), { model: "model-2048.multi" });
  validateExecutionProfile(profile, { attemptCeiling, releaseIdentity: RELEASE_IDENTITY, productRuntimeManifestHash: RUNTIME_HASH });
  assert.equal(assertNoSecretMaterial(profile, {
    knownEnvironment: { ...SCAN_ENVIRONMENT, OPENAI_MODEL: profile.exactModelLiteral },
    schemaValidatedRecordType: profile.profileType
  }), true);
  assert.equal(profile.modelProvider, "OPENAI");
  assert.deepEqual(profile.fixedProviderEndpointClasses, ["OPENAI_RESPONSES_API", "OPENAI_WEB_SEARCH", "SERPER_SEARCH", "SERPER_SHOPPING", "PRODUCT_BOUNDED_DIRECT_PAGE"]);
});

test("scanner C: unknown and prohibited fields cannot borrow public-identity status", () => {
  const { terminal } = terminalFixture({ unknownIdentity: "gpt-4.1-mini" });
  assert.throws(() => validateTerminalResult(terminal), /fields differ/);
  assert.throws(() => assertNoSecretMaterial({ modelIdentity: "gpt-4.1-mini", token: "gpt-4.1-mini" }), /prohibited secret-bearing field token/);
});

test("scanner D: API keys remain rejected, including in modelIdentity", () => {
  const key = "sk-proj-A1b2C3d4E5f6G7h8I9j0";
  const { terminal } = terminalFixture({ modelIdentity: key });
  assert.equal(validateTerminalResult(terminal).valid, true);
  assert.throws(() => assertNoSecretMaterial(terminal, {
    knownEnvironment: SCAN_ENVIRONMENT,
    schemaValidatedRecordType: terminal.resultRecordType
  }), /public identity|API key/);
});

test("scanner E: a valid public identity never hides nested secrets in result surfaces", () => {
  const cases = [
    { responseDiagnostics: { governor: { secret: "nested-secret-value" } } },
    { providerAttemptTelemetry: [{ provider: "OPENAI", token: "nested-secret-value" }] },
    { sanitizedTerminalResponseEnvelope: { statusCode: 200, headers: {}, body: { authorization: "Bearer AbCdEf0123456789" } } },
    { governorProof: { credential: "nested-secret-value" } },
    { experienceRecord: { password: "nested-secret-value" } },
    { terminalEvidence: { session: "nested-secret-value" } },
    { errorCategory: "Bearer AbCdEf0123456789" }
  ];
  for (const overrides of cases) {
    const { terminal } = terminalFixture(overrides);
    validateTerminalResult(terminal);
    assert.throws(() => assertNoSecretMaterial(terminal, {
      knownEnvironment: SCAN_ENVIRONMENT,
      schemaValidatedRecordType: terminal.resultRecordType
    }), /secret|credential|authorization|session|bearer/i);
  }
});

test("scanner F: authorization, cookie, session, and provider headers remain rejected", () => {
  const unsafeValues = [
    { detail: "Bearer AbCdEf0123456789" },
    { detail: "Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==" },
    { detail: "sessionid=AbCdEf0123456789" },
    { detail: "cookie=AbCdEf0123456789" },
    { providerRequestHeaders: { "x-api-key": "public-looking" } }
  ];
  for (const responseDiagnostics of unsafeValues) {
    const { terminal } = terminalFixture({ responseDiagnostics });
    validateTerminalResult(terminal);
    assert.throws(() => assertNoSecretMaterial(terminal, {
      knownEnvironment: SCAN_ENVIRONMENT,
      schemaValidatedRecordType: terminal.resultRecordType
    }), /authorization|cookie|session|header|secret-bearing/i);
  }
});

test("scanner G: environment dumps, private values, signed URLs, and high-entropy credentials fail", () => {
  const unsafeValues = [
    { environment: { OPENAI_API_KEY: "secret-primary-123", OPENAI_MODEL: "gpt-4.1-mini" } },
    { detail: "OPENAI_API_KEY=secret-primary-123" },
    { detail: "secret-primary-123" },
    { detail: "https://user:password@example.com/private" },
    { detail: "https://example.com/object?X-Amz-Signature=AbCdEf0123456789" },
    { detail: "A7sK9pQ2vN4xR8mT6zW1cD5fG3hJ0lB+Y" }
  ];
  for (const responseDiagnostics of unsafeValues) {
    const { terminal } = terminalFixture({ responseDiagnostics });
    validateTerminalResult(terminal);
    assert.throws(() => assertNoSecretMaterial(terminal, {
      knownEnvironment: SCAN_ENVIRONMENT,
      schemaValidatedRecordType: terminal.resultRecordType
    }), /environment|known secret|URL|signed|credential|high-entropy|secret-bearing/i);
  }
});

test("scanner H: scan results and canonical hashes are key-order deterministic", () => {
  const first = terminalFixture({ responseDiagnostics: { alpha: { one: 1, two: 2 }, beta: true } }).terminal;
  const second = terminalFixture({ responseDiagnostics: { beta: true, alpha: { two: 2, one: 1 } } }).terminal;
  assert.equal(scanValidatedTerminal(first), scanValidatedTerminal(second));
  assert.equal(first.recordHash, second.recordHash);
  assert.equal(sha256Json(first), sha256Json(second));
});

test("scanner J: product identity and frozen benchmark authority remain isolated", () => {
  const { terminal } = terminalFixture();
  assert.equal(terminal.productSourceHead, "7056eb0601dc69c5985703fea6fe665e82c6bed8");
  assert.equal(terminal.productSourceVersion, "1.12.13");
  assert.equal(terminal.executorVersion, "1.12.22");
  assert.equal(scanValidatedTerminal(terminal), true);
});

test("artifact A-B: broad score reproduction fails while the exact unscored artifact and manifest pass", () => {
  const legacyPredicate = /(?:^|\/)evaluator-only(?:\/|$)|score|grading|reflection|lesson|repair/i;
  assert.equal(legacyPredicate.test("unscored-result-manifest.json"), true);
  assert.deepEqual(classifyResultArtifactPath("unscored-result-manifest.json"), {
    relativePath: "unscored-result-manifest.json",
    kind: "file",
    role: "UNSCORED_RESULT_MANIFEST",
    analysisId: null
  });
  const manifest = unscoredManifestFixture();
  assert.equal(validateUnscoredResultManifest(manifest).state, RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING);
  assert.equal(manifest.privateControlsLoaded, false);
  assert.equal(manifest.scoringAuthorized, false);
  assert.equal(manifest.reflectionAuthorized, false);
  assert.equal(manifest.repairAuthorized, false);
});

test("artifact C-D, G, J, and L: forbidden artifact roles and directories fail closed", () => {
  const forbiddenFiles = [
    "score.json", "scores.json", "scoring-report.json", "grading-report.json", "evaluator-score.json",
    "private-controls.json", "reflection.json", "lesson.json", "lesson-candidate.json", "lesson-proof.json",
    "lesson-approval.json", "repair.json", "patch.json", "deployment.json", "provider-credentials.json", "secrets.json",
    "scores/result.json", "scoring/report.json", "grader/report.json", "grading/report.json", "evaluator-only/result.json",
    "private/result.json", "reflections/result.json", "lessons/result.json", "repairs/result.json"
  ];
  for (const relativePath of forbiddenFiles) assert.throws(() => classifyResultArtifactPath(relativePath), /unknown result-tree artifact|evaluator-only/);
  for (const relativePath of ["scores", "scoring", "grader", "grading", "evaluator-only", "private", "reflections", "lessons", "repairs"]) {
    assert.throws(() => classifyResultArtifactPath(relativePath, { kind: "directory" }), /unknown result-tree directory/);
  }
});

test("artifact E-F, H-I, K, and M: false authority is valid and true authority is rejected", () => {
  const valid = unscoredManifestFixture();
  assert.equal(validateUnscoredResultManifest(valid).valid, true);
  for (const field of ["scoringAuthorized", "privateControlsLoaded", "reflectionAuthorized", "repairAuthorized"]) {
    assert.throws(() => unscoredManifestFixture({ [field]: true }), /true !== false/);
  }
  const requests = fakeRequests();
  const { profile, attemptCeiling } = profileAndCeiling(requests);
  const rates = pricing();
  assert.throws(
    () => createExecutionConsent(consentScope(requests, profile, rates, attemptCeiling, { deploymentAuthorized: true }), AT),
    /true !== false/
  );
});

test("artifact N-P: exact layout, unknown paths, normalization variants, and response grammar are enforced", () => {
  assert.deepEqual(Object.keys(RESULT_ROOT_ARTIFACT_ROLES).sort(), [
    "cost-envelope.json", "cost-ledger.json", "execution-consent.json", "execution-journal.json", "execution-profile.json",
    "invocation-reservation.json", "launch-scope.json", "pricing-profile.json", "unscored-result-manifest.json", "validation-report.json"
  ]);
  const valid = expectedResultArtifactPaths(["V2-RUN-001", "V2-RUN-026"]);
  assert.deepEqual(classifyResultArtifactInventory(valid).relativePaths, valid);
  assert.throws(() => classifyResultArtifactPath("notes.json"), /unknown result-tree artifact/);
  for (const relativePath of [
    "../score.json", "/score.json", "C:/score.json", "responses\\V2-RUN-001.json", "responses/../score.json",
    "responses/V2-RUN-001.json:secret", "responses/con.json", "responses/v2-run-001.json", "responses/V2-RUN-027.json",
    "responses/V2-RUN-001.txt", "responses/nested/V2-RUN-001.json"
  ]) assert.throws(() => classifyResultArtifactPath(relativePath), /unsafe|repository separators|reserved device|unknown|extension/);
  assert.throws(() => classifyResultArtifactInventory([...valid, valid[0]]), /duplicate normalized/);
  assert.throws(() => classifyResultArtifactInventory([...valid, "Validation-report.json"]), /case-colliding/);
});

test("artifact O: unknown directories, symlinks, and reparse points fail before readback", async () => withTemp(async (temporary) => {
  const unknownRoot = path.join(temporary, "unknown-tree");
  await mkdir(path.join(unknownRoot, "responses"), { recursive: true });
  await mkdir(path.join(unknownRoot, "unexpected"));
  await assert.rejects(listResultFiles(unknownRoot), /unknown result-tree directory/);

  const linkedRoot = path.join(temporary, "linked-tree");
  await mkdir(path.join(linkedRoot, "responses"), { recursive: true });
  await symlink(path.join(linkedRoot, "responses"), path.join(linkedRoot, "scores"), "junction");
  await assert.rejects(listResultFiles(linkedRoot), /symlink or reparse point/);
}));

test("artifact Q-R: external text cannot extend the allowlist and classification is deterministic", () => {
  const valid = expectedResultArtifactPaths(["V2-RUN-001", "V2-RUN-002"]);
  const first = classifyResultArtifactInventory(valid);
  const second = classifyResultArtifactInventory([...valid].reverse());
  assert.deepEqual(first.relativePaths, second.relativePaths);
  assert.equal(first.inventoryHash, second.inventoryHash);
  for (const candidateControlled of [
    "candidate-approved.json", "environment-selected.json", "consent-extra.json", "responses/customer-description.json"
  ]) assert.throws(() => classifyResultArtifactInventory([...valid, candidateControlled]), /unknown result-tree artifact/);
});

test("artifact S-T: readback remains non-executing and product/freeze identities stay pinned", async () => {
  const executorSource = await readFile(new URL("../benchmarks/blind-object-v2/scripts/executor.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(executorSource, /\|score\|grading\|reflection\|lesson\|repair/);
  assert.match(executorSource, /assert\.deepEqual\(filesAfter, filesBefore, "strict readback wrote or removed result files"\)/);
  assert.match(executorSource, /handlerInvocationCount:\s*0/);
  assert.match(executorSource, /providerAttemptCount:\s*0/);
  assert.match(executorSource, /fileWriteCount:\s*0/);
  assert.equal(PRODUCT_SOURCE_HEAD, "7056eb0601dc69c5985703fea6fe665e82c6bed8");
  assert.equal(PRODUCT_SOURCE_VERSION, "1.12.13");
  assert.equal(EXECUTOR_VERSION, "1.12.22");
});

test("G: complete attempt accounting names every boundary and totals 832", async () => {
  const requests = fakeRequests();
  const ceiling = calculateCompleteAttemptCeiling(requests);
  assert.deepEqual(ceiling.categories, { objectIdentityModel: 26, finalPurposeModel: 26, sharedAcquisitionPhysicalPool: 728, directPagePhysicalPool: 52, totalPhysicalAttempts: 832 });
  assert.equal(ceiling.perRequest.every((record) => record.totalPhysicalAttempts === 32), true);
  const source = await readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8");
  assert.equal(auditFrozenProductProviderSurface(source).valid, true);
  assert.throws(() => auditFrozenProductProviderSurface(`${source}\nfetch("https://unclassified.invalid");`), /unclassified call site|drift/);
});

test("H-I: pricing binds provider/model/units and the ledger stops before unaffordable work", () => {
  const requests = fakeRequests();
  const { profile, attemptCeiling } = profileAndCeiling(requests);
  const rates = pricing();
  assert.equal(validatePricingProfile(rates, profile).valid, true);
  assert.throws(() => validatePricingProfile(pricing("different-model"), profile), /model mismatch/);
  assert.throws(() => pricing("gpt-4.1-mini", { inputTokenRatePerMillion: -1 }), /nonnegative/);
  const conservative = conservativeMaximumCost(attemptCeiling, rates, profile.acquisitionProviderMode);
  assert.ok(conservative > 0);
  const ledger = createCostLedger({ invocationId: "synthetic-invocation-cost", consentHash: "1".repeat(64), pricingProfileHash: rates.pricingProfileHash, maximumAuthorizedCost: 1, conservativePreRunMaximum: 2, requests, nowIso: AT });
  assert.equal(ledger.stopBeforeNextRequestDecision, true);
});

test("J-K: exact consent rejects mutation, mismatch, replay, and implied authority", () => {
  const requests = fakeRequests();
  const { profile, attemptCeiling } = profileAndCeiling(requests);
  const rates = pricing();
  const consent = createExecutionConsent(consentScope(requests, profile, rates, attemptCeiling), AT);
  assert.equal(validateExecutionConsent(consent, { requiredStatus: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED }).valid, true);
  assert.throws(() => validateExecutionConsent({ ...consent, maximumAuthorizedCost: consent.maximumAuthorizedCost + 1 }), /hash mismatch/);
  assert.throws(() => createExecutionConsent(consentScope(requests, profile, rates, attemptCeiling, { scoringAuthorized: true }), AT), /true !== false/);
  const consumed = transitionConsent(consent, CONSENT_STATUS.CONSUMED, "2026-08-07T12:00:00.001Z", "synthetic consumption");
  assert.equal(validateExecutionConsent(consumed, { requiredStatus: CONSENT_STATUS.CONSUMED }).status, CONSENT_STATUS.CONSUMED);
  assert.throws(() => transitionConsent(consumed, CONSENT_STATUS.CONSUMED, "2026-08-07T12:00:00.002Z", "replay"), /forbidden/);
  for (const implied of [{}, { filename: "consent.json" }, { freeFormApproval: true }, { freezeExists: true }]) assert.throws(() => validateExecutionConsent(implied), /schemaVersion|receiptType/);
});

test("L-M: reservation creation is exclusive, idempotent readback is non-mutating, and replay conflicts fail", async () => withTemp(async (root) => {
  const requests = fakeRequests();
  const { profile, attemptCeiling } = profileAndCeiling(requests);
  const rates = pricing();
  const consent = createExecutionConsent(consentScope(requests, profile, rates, attemptCeiling), AT);
  const reservation = createInvocationReservation(reservationScope(requests, consent, profile, rates), AT);
  const created = await createExclusiveReservation(root, reservation);
  assert.equal(created.status, "CREATED");
  const readback = await createExclusiveReservation(root, reservation);
  assert.equal(readback.status, "EXISTING_IDENTICAL_READBACK");
  const conflictInput = consentScope(requests, profile, rates, attemptCeiling, { costEnvelopeHash: "f".repeat(64) });
  const conflictConsent = createExecutionConsent(conflictInput, AT);
  const mismatched = createInvocationReservation(reservationScope(requests, conflictConsent, profile, rates, conflictInput.launchScope), AT);
  await assert.rejects(createExclusiveReservation(root, mismatched), /conflicting reservation/);
}));

test("N-Q: journal transitions are sealed and started, unknown, and terminal requests cannot replay", () => {
  const requests = fakeRequests();
  let journal = createExecutionJournal({ invocationId: "synthetic-invocation-journal", consentHash: "1".repeat(64), requests, nowIso: AT });
  journal = transitionRequest(journal, "V2-RUN-001", REQUEST_STATE.SUBMISSION_INTENT_RECORDED, { at: "2026-08-07T12:00:00.001Z", reason: "intent", physicalSubmissionIdentity: "submission-11111111111111111111111111111111" });
  journal = transitionRequest(journal, "V2-RUN-001", REQUEST_STATE.SUBMISSION_STARTED, { at: "2026-08-07T12:00:00.002Z", reason: "start" });
  journal = transitionRequest(journal, "V2-RUN-001", REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION, { at: "2026-08-07T12:00:00.003Z", reason: "ambiguous" });
  assert.equal(validateExecutionJournal(journal, requests).valid, true);
  assert.equal(requestReplayDisposition(journal.entries[0]).resubmissionPermanentlyBlocked, true);
  assert.throws(() => transitionRequest(journal, "V2-RUN-001", REQUEST_STATE.SUBMISSION_STARTED, { at: "2026-08-07T12:00:00.004Z", reason: "retry" }), /forbidden/);

  let terminal = createExecutionJournal({ invocationId: "synthetic-invocation-terminal", consentHash: "2".repeat(64), requests, nowIso: AT });
  terminal = transitionRequest(terminal, "V2-RUN-001", REQUEST_STATE.SUBMISSION_INTENT_RECORDED, { at: "2026-08-07T12:00:00.001Z", reason: "intent", physicalSubmissionIdentity: "submission-22222222222222222222222222222222" });
  terminal = transitionRequest(terminal, "V2-RUN-001", REQUEST_STATE.SUBMISSION_STARTED, { at: "2026-08-07T12:00:00.002Z", reason: "start" });
  terminal = transitionRequest(terminal, "V2-RUN-001", REQUEST_STATE.TERMINAL, { at: "2026-08-07T12:00:00.003Z", reason: "terminal" });
  assert.throws(() => transitionRequest(terminal, "V2-RUN-001", REQUEST_STATE.TERMINAL, { at: "2026-08-07T12:00:00.004Z", reason: "duplicate" }), /forbidden/);
});

test("O: interruption proven before SUBMISSION_STARTED remains non-submitted", () => {
  const requests = fakeRequests();
  let journal = createExecutionJournal({ invocationId: "synthetic-invocation-prestart", consentHash: "3".repeat(64), requests, nowIso: AT });
  journal = transitionRequest(journal, "V2-RUN-001", REQUEST_STATE.SUBMISSION_INTENT_RECORDED, { at: "2026-08-07T12:00:00.001Z", reason: "intent", physicalSubmissionIdentity: "submission-33333333333333333333333333333333" });
  journal = transitionRequest(journal, "V2-RUN-001", REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION, { at: "2026-08-07T12:00:00.002Z", reason: "before start" });
  assert.equal(journal.entries[0].state, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION);
  assert.equal(requestReplayDisposition(journal.entries[0]).resubmissionPermanentlyBlocked, false);
});

test("R-S: canonical ordering and two-photo binding cannot be changed by candidate content", () => {
  const requests = fakeRequests();
  const journal = createExecutionJournal({ invocationId: "synthetic-invocation-order", consentHash: "4".repeat(64), requests, nowIso: AT });
  assert.deepEqual(journal.entries.map((entry) => entry.analysisId), requests.map((request) => request.analysisId));
  const malformed = fakeRequests();
  [malformed[0], malformed[1]] = [malformed[1], malformed[0]];
  assert.throws(() => validateExecutionJournal(journal, malformed), /does not match|Expected values/);
});

test("T-Y: product failures seal, atomic writes reject overwrite/corruption, and complete state remains unscored", async () => withTemp(async (root) => {
  const requests = fakeRequests();
  const { profile, attemptCeiling } = profileAndCeiling(requests);
  const rates = pricing();
  const consent = createExecutionConsent(consentScope(requests, profile, rates, attemptCeiling), AT);
  const reservation = createInvocationReservation(reservationScope(requests, consent, profile, rates), AT);
  const terminal = createTerminalResult({
    requestId: "V2-RUN-001", requestHash: requests[0].requestContractHash, launchScopeHash: consent.launchScopeHash, resultId: consent.resultId, resultRootName: consent.resultRootName, invocationId: consent.invocationId, consentHash: consent.consentHash, reservationHash: reservation.reservationHash,
    productSourceHead: PRODUCT_SOURCE_HEAD, productSourceVersion: PRODUCT_SOURCE_VERSION, ...RELEASE_IDENTITY, executorVersion: EXECUTOR_VERSION,
    executionProfileHash: profile.profileHash, executionProfileIdentityHash: profile.executionProfileIdentityHash, pricingProfileHash: rates.pricingProfileHash, pricingProfileIdentityHash: rates.pricingProfileIdentityHash, costEnvelopeHash: consent.costEnvelopeHash, physicalSubmissionIdentity: "submission-44444444444444444444444444444444",
    submissionState: REQUEST_STATE.TERMINAL, terminalState: "PRODUCT_TERMINAL_FAILURE", startedAt: AT, completedAt: "2026-08-07T12:00:00.001Z", elapsedDurationMs: 1,
    handlerStatus: 502, sanitizedTerminalResponseEnvelope: { statusCode: 502, body: { code: "provider_failure" } }, responseDiagnostics: {}, providerAttemptTelemetry: [], providerIdentities: [], modelIdentity: profile.exactModelLiteral,
    callCeilingTelemetry: {}, costEntry: {}, governorProof: null, cognitiveStateIdentity: "", experienceRecord: null, experienceRecordHash: "", terminalEvidence: null, errorStage: "PRODUCT", errorCategory: "provider_failure"
  });
  assert.equal(validateTerminalResult(terminal).valid, true);
  const manifest = createUnscoredResultManifest({ launchScopeHash: consent.launchScopeHash, resultId: consent.resultId, resultRootName: consent.resultRootName, invocationId: consent.invocationId, consentHash: consent.consentHash, reservationHash: reservation.reservationHash, productSourceHead: PRODUCT_SOURCE_HEAD, productSourceVersion: PRODUCT_SOURCE_VERSION, ...RELEASE_IDENTITY, executorVersion: EXECUTOR_VERSION, completeFrozenAggregateHash: consent.completeFrozenAggregateHash, requestAggregateHash: consent.requestAggregateHash, executionProfileHash: profile.profileHash, executionProfileIdentityHash: profile.executionProfileIdentityHash, pricingProfileHash: rates.pricingProfileHash, pricingProfileIdentityHash: rates.pricingProfileIdentityHash, costEnvelopeHash: consent.costEnvelopeHash, maximumCost: consent.maximumAuthorizedCost, costLedgerHash: "5".repeat(64), requestedCount: 26, submittedCount: 26, terminalCount: 26, normalSuccessCount: 25, productTerminalFailureCount: 1, executionIntegrityFailureCount: 0, notSubmittedCount: 0, orderedResponseHashInventory: [], responseAggregate: "6".repeat(64), journalAggregate: "7".repeat(64), resultTreeAggregate: "8".repeat(64), resultTreeRecords: [], privateControlsLoaded: false, scoringAuthorized: false, reflectionAuthorized: false, repairAuthorized: false, state: RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING });
  assert.equal(validateUnscoredResultManifest(manifest).state, RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING);
  const history = resolveResultHistoryRoot(EXECUTION_MODE.SYNTHETIC_TEST_ONLY, path.join(root, "history"));
  const resultRoot = await createExclusiveResultRoot(history, "synthetic-result-atomic");
  await writeResultFile(resultRoot, "responses/V2-RUN-001.json", terminal);
  await assert.rejects(writeResultFile(resultRoot, "responses/V2-RUN-001.json", { altered: true }), /EEXIST/);
  assert.deepEqual(await readJsonStrictFile(path.join(resultRoot, "responses", "V2-RUN-001.json")), terminal);
}));

test("U-V and AB: executor imports and paths exclude private controls, scoring, reflection, repair, dynamic modules, and commands", async () => {
  const source = await readFile(new URL("../benchmarks/blind-object-v2/scripts/executor.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /private-controls\.json|evaluator-only\/provenance|source-originals|scoring-contract|score-results|experience-reflection|lesson-gate|child_process|dynamic\s+import|KATHERINES_EYE_HANDLER_ADAPTER_MODULE/);
  assert.doesNotMatch(source, /exec(?:File|Sync)?\(|spawn\(|shell|command|modulePath|endpoint\s*=/);
  assert.throws(() => deriveResultRoot("C:/trusted", "../escape"), /safe repository-owned identity/);
  assert.throws(() => deriveResultRoot("C:/trusted", "C:device"), /safe repository-owned identity/);
});

test("W-X: reservation transition is durable and altered authority is rejected", async () => withTemp(async (root) => {
  const requests = fakeRequests();
  const { profile, attemptCeiling } = profileAndCeiling(requests);
  const rates = pricing();
  const consent = createExecutionConsent(consentScope(requests, profile, rates, attemptCeiling), AT);
  let reservation = createInvocationReservation(reservationScope(requests, consent, profile, rates), AT);
  const created = await createExclusiveReservation(root, reservation);
  reservation = transitionReservation(reservation, RESERVATION_STATE.STARTED, "2026-08-07T12:00:00.001Z", "start");
  await replaceReservation(created.filePath, reservation);
  assert.equal(validateInvocationReservation(await readJsonStrictFile(created.filePath)).state, RESERVATION_STATE.STARTED);
  const altered = { ...reservation, consentHash: "9".repeat(64) };
  await writeFile(created.filePath, JSON.stringify(altered), "utf8");
  const alteredReadback = await readJsonStrictFile(created.filePath);
  assert.throws(() => validateInvocationReservation(alteredReadback), /hash mismatch/);
}));

test("Z and AC-AD: strict operations remain network-denied and no real-run authority is implied", async () => {
  const guard = installHardNetworkDenial();
  try {
    const requests = fakeRequests();
    const { profile, attemptCeiling } = profileAndCeiling(requests);
    const rates = pricing();
    const ledger = createCostLedger({ invocationId: "synthetic-invocation-network", consentHash: "a".repeat(64), pricingProfileHash: rates.pricingProfileHash, maximumAuthorizedCost: 40, conservativePreRunMaximum: 20, requests, nowIso: AT });
    const updated = recordRequestCost(ledger, { analysisId: "V2-RUN-001", attempts: [{ category: "CONSERVATIVE_REQUEST_RESERVATION" }], estimatedCost: 1, reservedWorstCaseRemainingCost: 18, at: "2026-08-07T12:00:00.001Z" });
    assert.equal(validateCostLedger(updated).valid, true);
    assert.equal(guard.attempts.length, 0);
    assert.equal(profile.networkScope.arbitraryEndpoints, false);
    assert.equal(attemptCeiling.categories.totalPhysicalAttempts, 832);
  } finally {
    guard.restore();
  }
});

test("AA: partial manifests cannot masquerade as complete", () => {
  const partial = createUnscoredResultManifest({ launchScopeHash: "0".repeat(64), resultId: "synthetic-result-partial", resultRootName: `result-root-${"0".repeat(48)}`, invocationId: "synthetic-invocation-partial", consentHash: "1".repeat(64), reservationHash: "2".repeat(64), productSourceHead: PRODUCT_SOURCE_HEAD, productSourceVersion: PRODUCT_SOURCE_VERSION, ...RELEASE_IDENTITY, executorVersion: EXECUTOR_VERSION, completeFrozenAggregateHash: "3".repeat(64), requestAggregateHash: "4".repeat(64), executionProfileHash: "5".repeat(64), executionProfileIdentityHash: "b".repeat(64), pricingProfileHash: "6".repeat(64), pricingProfileIdentityHash: "c".repeat(64), costEnvelopeHash: "d".repeat(64), maximumCost: 40, costLedgerHash: "7".repeat(64), requestedCount: 26, submittedCount: 1, terminalCount: 1, normalSuccessCount: 0, productTerminalFailureCount: 0, executionIntegrityFailureCount: 1, notSubmittedCount: 25, orderedResponseHashInventory: [], responseAggregate: "8".repeat(64), journalAggregate: "9".repeat(64), resultTreeAggregate: "a".repeat(64), resultTreeRecords: [], privateControlsLoaded: false, scoringAuthorized: false, reflectionAuthorized: false, repairAuthorized: false, state: RESULT_STATE.PARTIAL_EXECUTION_INTEGRITY_STOP });
  assert.equal(validateUnscoredResultManifest(partial).state, RESULT_STATE.PARTIAL_EXECUTION_INTEGRITY_STOP);
  assert.throws(() => createUnscoredResultManifest({ ...partial, state: RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING }), /submittedCount|26/);
});

test("all new execution JSON schemas parse strictly and remain top-level closed", async () => {
  const names = ["launch-scope", "cost-envelope", "product-cost-source-manifest", "execution-profile", "pricing-profile", "consent-receipt", "invocation-registry", "request-execution-journal", "cost-ledger", "terminal-result", "unscored-result-manifest", "pre-external-failure-authority", "zero-external-supersession-receipt", "terminal-failure-manifest", "terminal-failure-validation-report"];
  for (const name of names) {
    const document = JSON.parse(await readFile(new URL(`../benchmarks/blind-object-v2/schemas/${name}.schema.json`, import.meta.url), "utf8"));
    assert.equal(document.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(document.additionalProperties, false);
  }
});
