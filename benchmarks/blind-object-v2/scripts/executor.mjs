import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
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
  createCostLedger,
  createExecutionJournal,
  createInvocationReservation,
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
} from "./execution-protocol.mjs";
import { validateCostEnvelope } from "./cost-envelope.mjs";
import { validateLaunchScope } from "./launch-identity.mjs";
import {
  classifyResultArtifactInventory,
  computeResultTreeAggregate,
  createExclusiveReservation,
  createExclusiveResultRoot,
  deriveResultRoot,
  expectedResultArtifactPaths,
  listResultFiles,
  loadPublicFreeze,
  readJsonStrictFile,
  replaceReservation,
  resolveResultHistoryRoot,
  writeResultFile
} from "./execution-store.mjs";
import {
  handlerRequestBody,
  invokePinnedProductHandler,
  transformPhotosForProduct,
  verifyDetachedProductRuntime
} from "./execution-profile.mjs";
import { sha256Bytes, sha256Json } from "./protocol.mjs";
import { deriveContinuationRequests, validateContinuationScope } from "./continuation-scope.mjs";
import { COMPOSITE_RELATIVE_PATH, validateCompositeEvidenceManifest } from "./composite-evidence.mjs";
import {
  PRE_EXTERNAL_TERMINAL_STATE,
  createTerminalFailureManifest,
  createTerminalFailureValidationReport,
  validateTerminalFailureManifest,
  validateTerminalFailureValidationReport
} from "./pre-external-recovery-protocol.mjs";
import { validateContinuationReleaseChain } from "./consent-revocation.mjs";
import {
  POST_HANDLER_FAILURE_MANIFEST_TYPE,
  POST_HANDLER_SANITIZATION_STATE,
  createHandlerReturnedReceipt,
  createPostHandlerFailureManifest,
  createPostHandlerFailureValidation,
  validateHandlerReturnedReceipt,
  validatePostHandlerFailureManifest,
  validatePostHandlerFailureValidation
} from "./post-handler-durability-protocol.mjs";

const HASH = /^[a-f0-9]{64}$/;
const VALIDATION_REPORT_FIELDS = Object.freeze([
  "schemaVersion", "validationType", "resultId", "manifestHash", "state", "validatedAt", "privateControlsLoaded",
  "scoringPerformed", "reflectionPerformed", "repairPerformed", "handlerInvocationCount", "providerCallsCreatedByVerifier",
  "validationHash"
]);

function defaultClock() {
  return new Date().toISOString();
}

function validateUnscoredValidationReport(report, { manifest }) {
  assert.deepEqual(Object.keys(report).sort(), [...VALIDATION_REPORT_FIELDS].sort(), "unscored validation report fields differ");
  assert.equal(report.schemaVersion, "1.0");
  assert.equal(report.validationType, "UNSCORED_RESULT_SEAL_VALIDATION");
  assert.equal(report.resultId, manifest.resultId);
  assert.equal(report.manifestHash, manifest.manifestHash);
  assert.equal(report.state, manifest.state);
  assert.equal(new Date(report.validatedAt).toISOString(), report.validatedAt);
  assert.equal(report.privateControlsLoaded, false);
  assert.equal(report.scoringPerformed, false);
  assert.equal(report.reflectionPerformed, false);
  assert.equal(report.repairPerformed, false);
  assert.equal(report.handlerInvocationCount, manifest.submittedCount);
  assert.equal(report.providerCallsCreatedByVerifier, 0);
  const core = { ...report };
  delete core.validationHash;
  assert.equal(report.validationHash, sha256Json(core), "unscored validation report hash mismatch");
  return Object.freeze({ valid: true, validationHash: report.validationHash });
}

function sanitizeValue(value, depth = 0) {
  if (depth > 16) return "[DEPTH_LIMIT]";
  if (value === null || typeof value === "boolean" || typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") return value.length <= 100000 ? value : `${value.slice(0, 100000)}[TRUNCATED]`;
  if (Array.isArray(value)) return value.slice(0, 1000).map((entry) => sanitizeValue(entry, depth + 1));
  if (!value || typeof value !== "object") return null;
  const output = {};
  for (const key of Object.keys(value).slice(0, 1000).sort()) {
    if (/^(?:authorization|cookie|set-cookie|api[-_]?key|token|credential|secret)$/i.test(key)) continue;
    output[key] = sanitizeValue(value[key], depth + 1);
  }
  return output;
}

function hashCanonicalHandlerResult(value) {
  const ancestors = new WeakMap();
  function canonicalize(node, location = "$") {
    if (node === null || typeof node === "string" || typeof node === "boolean") return node;
    if (typeof node === "number") return Number.isFinite(node) ? node : { $nonfiniteNumber: String(node) };
    if (typeof node === "bigint") return { $bigint: node.toString() };
    if (typeof node === "undefined") return { $undefined: true };
    if (typeof node === "symbol") return { $symbol: String(node.description || "") };
    if (typeof node === "function") return { $function: String(node.name || "anonymous") };
    if (Buffer.isBuffer(node) || ArrayBuffer.isView(node)) {
      return { $bytes: Buffer.from(node.buffer, node.byteOffset, node.byteLength).toString("base64") };
    }
    if (node instanceof Date) return { $date: Number.isNaN(node.valueOf()) ? "INVALID" : node.toISOString() };
    if (ancestors.has(node)) return { $cycleReference: ancestors.get(node) };
    ancestors.set(node, location);
    if (Array.isArray(node)) return node.map((entry, index) => canonicalize(entry, `${location}[${index}]`));
    const output = {};
    for (const key of Object.keys(node).sort()) {
      try {
        output[key] = canonicalize(node[key], `${location}.${key}`);
      } catch (error) {
        output[key] = { $unreadable: String(error?.name || "Error") };
      }
    }
    return output;
  }
  return sha256Json(canonicalize(value));
}

function responseReport(body) {
  return body?.valuation || body?.listing || body || {};
}

function providerTelemetry(body) {
  const report = responseReport(body);
  const candidates = [
    report?.searchDiagnostics?.providerRequestRecords,
    report?.searchDiagnostics?.cognitiveGovernor?.cognitiveEpisode?.providerRequests,
    body?.diagnostics?.terminalFailure?.providerRecords
  ];
  return sanitizeValue(candidates.find(Array.isArray) || []);
}

function categoryFromProvider(record = {}) {
  const key = String(record.providerKey || record.provider || record.providerEndpoint || "").toLowerCase();
  if (key.includes("direct_product_page")) return "DIRECT_PAGE";
  if (key.includes("serper")) return "SERPER_SEARCH";
  if (key.includes("web_search")) return "OPENAI_WEB_SEARCH";
  if (key.includes("openai_model")) return "FINAL_PURPOSE_MODEL";
  return "OPENAI_WEB_SEARCH";
}

function costAttemptsFromResponse(body) {
  const records = providerTelemetry(body);
  const attempts = [];
  for (const record of records) {
    const count = Math.max(0, Number(record.physicalAttemptCount || (record.attempted ? 1 : 0)));
    for (let index = 0; index < count; index += 1) {
      attempts.push({
        category: categoryFromProvider(record),
        provider: String(record.providerKey || record.provider || "UNKNOWN").slice(0, 100),
        providerReportedUsage: null,
        calculatedCost: null,
        estimationBasis: "PROVIDER_USAGE_ABSENT_CONSERVATIVE_REQUEST_MAXIMUM_APPLIED"
      });
    }
  }
  return attempts;
}

function extractProductEvidence(body) {
  const report = responseReport(body);
  return {
    governorProof: sanitizeValue(report?.searchDiagnostics?.cognitiveGovernor?.executionProof || null),
    cognitiveStateIdentity: String(report?.searchDiagnostics?.cognitiveGovernor?.cognitiveStateHash || ""),
    experienceRecord: sanitizeValue(report?.searchDiagnostics?.objectIntelligence?.experienceRecord || null),
    experienceRecordHash: String(report?.searchDiagnostics?.objectIntelligence?.experienceRecord?.experienceHash || ""),
    terminalEvidence: sanitizeValue(body?.diagnostics?.terminalFailure || report?.searchDiagnostics?.terminalEvidence || null),
    callCeilingTelemetry: sanitizeValue({
      providerCapacity: report?.searchDiagnostics?.cognitiveGovernor?.providerCapacity || null,
      directPageCapacity: report?.searchDiagnostics?.cognitiveGovernor?.directPageCapacity || null,
      governorCeilings: report?.searchDiagnostics?.cognitiveGovernor?.executionProof?.ceilingCompliance || null
    })
  };
}

function rawPreparedPhotos(request, assetCache) {
  return request.inputAssets.map((asset) => {
    const bytes = assetCache.get(asset.frozenRelativePath);
    assert.ok(bytes, `missing public asset ${asset.frozenRelativePath}`);
    assert.equal(sha256Bytes(bytes), asset.sha256);
    return {
      photoId: asset.photoId,
      sourceSha256: asset.sha256,
      processedBytes: bytes.length,
      dataUrl: `data:image/jpeg;base64,${bytes.toString("base64")}`
    };
  });
}

function submissionIdentity(invocationId, request) {
  return `submission-${sha256Json({ invocationId, analysisId: request.analysisId, requestHash: request.requestContractHash }).slice(0, 32)}`;
}

function terminalRecordInput({
  request,
  invocationId,
  consent,
  reservation,
  executionProfile,
  pricingProfile,
  costEnvelope,
  submissionId,
  submissionState,
  terminalState,
  startedAt,
  completedAt,
  elapsedMs,
  handlerResult,
  errorStage,
  errorCategory,
  costEntry
}) {
  const body = sanitizeValue(handlerResult?.body || {});
  const evidence = extractProductEvidence(body);
  return {
    requestId: request.analysisId,
    requestHash: request.requestContractHash,
    launchScopeHash: consent.launchScopeHash,
    resultId: consent.resultId,
    resultRootName: consent.resultRootName,
    invocationId,
    consentHash: consent.consentHash,
    reservationHash: reservation.reservationHash,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    executorRuntimeHead: executionProfile.executorRuntimeHead,
    qualificationHead: executionProfile.qualificationHead,
    executorRuntimeTreeHash: executionProfile.executorRuntimeTreeHash,
    executionReleaseRecordHash: executionProfile.executionReleaseRecordHash,
    qualificationPolicyVersion: executionProfile.qualificationPolicyVersion,
    executorVersion: EXECUTOR_VERSION,
    executionProfileHash: executionProfile.profileHash,
    executionProfileIdentityHash: executionProfile.executionProfileIdentityHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    pricingProfileIdentityHash: pricingProfile.pricingProfileIdentityHash,
    costEnvelopeHash: costEnvelope.costEnvelopeHash,
    physicalSubmissionIdentity: submissionId,
    submissionState,
    terminalState,
    startedAt,
    completedAt,
    elapsedDurationMs: elapsedMs,
    handlerStatus: Number(handlerResult?.statusCode || 0) || null,
    sanitizedTerminalResponseEnvelope: {
      statusCode: Number(handlerResult?.statusCode || 0) || null,
      headers: sanitizeValue(handlerResult?.headers || {}),
      body
    },
    responseDiagnostics: sanitizeValue(body?.diagnostics || responseReport(body)?.searchDiagnostics || {}),
    providerAttemptTelemetry: providerTelemetry(body),
    providerIdentities: [...new Set(providerTelemetry(body).map((record) => String(record.providerKey || record.provider || "")).filter(Boolean))].sort(),
    modelIdentity: executionProfile.exactModelLiteral,
    callCeilingTelemetry: evidence.callCeilingTelemetry,
    costEntry: sanitizeValue(costEntry),
    governorProof: evidence.governorProof,
    cognitiveStateIdentity: evidence.cognitiveStateIdentity,
    experienceRecord: evidence.experienceRecord,
    experienceRecordHash: evidence.experienceRecordHash,
    terminalEvidence: evidence.terminalEvidence,
    errorStage: String(errorStage || ""),
    errorCategory: String(errorCategory || "")
  };
}

async function persistMutableAuthorities(resultRoot, { consent, reservation, journal, ledger }) {
  await writeResultFile(resultRoot, "execution-consent.json", consent, { replace: true });
  await writeResultFile(resultRoot, "invocation-reservation.json", reservation, { replace: true });
  await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
  await writeResultFile(resultRoot, "cost-ledger.json", ledger, { replace: true });
}

async function finalizeResult({
  resultRoot,
  frozen,
  consent,
  reservation,
  journal,
  ledger,
  executionProfile,
  pricingProfile,
  costEnvelope,
  terminalRecords,
  handlerReturnedReceipts,
  continuationScope,
  requestedCount,
  resultState,
  integrityFailureCount,
  clock
}) {
  const authorityPaths = [
    "launch-scope.json",
    ...(continuationScope ? ["continuation-scope.json"] : []),
    "execution-profile.json",
    "pricing-profile.json",
    "cost-envelope.json",
    "execution-consent.json",
    "invocation-reservation.json",
    "execution-journal.json",
    "cost-ledger.json",
    ...terminalRecords.map((record) => `responses/${record.requestId}.json`),
    ...handlerReturnedReceipts.map((record) => `handler-returned/${record.requestId}.json`)
  ];
  const tree = await computeResultTreeAggregate(resultRoot, authorityPaths);
  const orderedResponseHashInventory = terminalRecords.map((record) => ({
    analysisId: record.requestId,
    canonicalResponseHash: record.canonicalResponseHash,
    recordHash: record.recordHash
  }));
  const orderedHandlerReturnedReceiptInventory = handlerReturnedReceipts.map((record) => ({
    analysisId: record.requestId,
    receiptId: record.receiptId,
    canonicalHandlerResultHash: record.canonicalHandlerResultHash,
    receiptHash: record.receiptHash
  }));
  const submittedCount = journal.entries.filter((entry) => entry.physicalSubmissionIdentity !== null && ![REQUEST_STATE.NOT_SUBMITTED, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION].includes(entry.state)).length;
  const normalSuccessCount = terminalRecords.filter((record) => record.terminalState === "NORMAL_SUCCESS").length;
  const productTerminalFailureCount = terminalRecords.filter((record) => record.terminalState === "PRODUCT_TERMINAL_FAILURE").length;
  const manifest = createUnscoredResultManifest({
    launchScopeHash: consent.launchScopeHash,
    resultId: consent.resultId,
    resultRootName: consent.resultRootName,
    invocationId: consent.invocationId,
    consentHash: consent.consentHash,
    reservationHash: reservation.reservationHash,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    executorRuntimeHead: executionProfile.executorRuntimeHead,
    qualificationHead: executionProfile.qualificationHead,
    executorRuntimeTreeHash: executionProfile.executorRuntimeTreeHash,
    executionReleaseRecordHash: executionProfile.executionReleaseRecordHash,
    qualificationPolicyVersion: executionProfile.qualificationPolicyVersion,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    requestAggregateHash: consent.requestAggregateHash,
    executionProfileHash: executionProfile.profileHash,
    executionProfileIdentityHash: executionProfile.executionProfileIdentityHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    pricingProfileIdentityHash: pricingProfile.pricingProfileIdentityHash,
    costEnvelopeHash: costEnvelope.costEnvelopeHash,
    maximumCost: consent.maximumAuthorizedCost,
    costLedgerHash: ledger.ledgerHash,
    requestedCount,
    submittedCount,
    terminalCount: terminalRecords.length,
    normalSuccessCount,
    productTerminalFailureCount,
    executionIntegrityFailureCount: integrityFailureCount,
    notSubmittedCount: requestedCount - submittedCount,
    orderedResponseHashInventory,
    responseAggregate: sha256Json(orderedResponseHashInventory),
    orderedHandlerReturnedReceiptInventory,
    handlerReturnedAggregate: sha256Json(orderedHandlerReturnedReceiptInventory),
    journalAggregate: journal.journalHash,
    resultTreeAggregate: tree.aggregate,
    resultTreeRecords: tree.records,
    privateControlsLoaded: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    state: resultState
  });
  await writeResultFile(resultRoot, "unscored-result-manifest.json", manifest);
  const report = {
    schemaVersion: "1.0",
    validationType: "UNSCORED_RESULT_SEAL_VALIDATION",
    resultId: consent.resultId,
    manifestHash: manifest.manifestHash,
    state: manifest.state,
    validatedAt: clock(),
    privateControlsLoaded: false,
    scoringPerformed: false,
    reflectionPerformed: false,
    repairPerformed: false,
    handlerInvocationCount: submittedCount,
    providerCallsCreatedByVerifier: 0,
    validationHash: ""
  };
  const reportCore = { ...report };
  delete reportCore.validationHash;
  report.validationHash = sha256Json(reportCore);
  await writeResultFile(resultRoot, "validation-report.json", report);
  return { manifest, validationReport: report };
}

async function finalizePostHandlerSanitizationFailure({
  resultRoot,
  frozen,
  consent,
  reservation,
  journal,
  ledger,
  executionProfile,
  launchScope,
  continuationScope = null,
  terminalRecords,
  handlerReturnedReceipts,
  receipt,
  clock
}) {
  const basePaths = [
    "launch-scope.json", ...(continuationScope ? ["continuation-scope.json"] : []),
    "execution-profile.json", "pricing-profile.json", "cost-envelope.json",
    "execution-consent.json", "invocation-reservation.json", "execution-journal.json", "cost-ledger.json",
    ...handlerReturnedReceipts.map((record) => `handler-returned/${record.requestId}.json`),
    ...terminalRecords.map((record) => `responses/${record.requestId}.json`)
  ];
  const tree = await computeResultTreeAggregate(resultRoot, basePaths);
  const manifest = createPostHandlerFailureManifest({
    launchScopeHash: consent.launchScopeHash,
    continuationScopeHash: launchScope.continuationScopeHash || null,
    resultId: consent.resultId,
    resultRootName: consent.resultRootName,
    invocationId: consent.invocationId,
    consentHash: consent.consentHash,
    reservationHash: reservation.reservationHash,
    executionReleaseRecordHash: executionProfile.executionReleaseRecordHash,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    requestId: receipt.requestId,
    handlerReturnedReceiptId: receipt.receiptId,
    handlerReturnedReceiptHash: receipt.receiptHash,
    canonicalHandlerResultHash: receipt.canonicalHandlerResultHash,
    handlerOutcome: receipt.handlerOutcome,
    handlerInvocationCount: 1,
    providerAttemptCount: receipt.providerAttemptCount,
    physicalProviderAttemptCount: receipt.physicalProviderAttemptCount,
    conservativeConsumedCost: receipt.cumulativeConservativeCost,
    actualBilledCostStatus: "UNKNOWN",
    publicResponseArtifactCommitted: false,
    replayPermitted: false,
    failureStage: "POST_HANDLER_TERMINAL_RECORD_SANITIZATION",
    failureCategory: "SECRET_SANITIZER_REJECTED_TERMINAL_RECORD",
    failureEvidenceAggregate: tree.aggregate,
    effectiveConsentStatus: CONSENT_STATUS.CONSUMED,
    effectiveInvocationStatus: "TERMINAL_FAILED",
    effectiveReservationStatus: RESERVATION_STATE.CLOSED_CONSERVATIVE_COST_ACCOUNTED,
    journalEffectiveState: REQUEST_STATE.POST_HANDLER_SANITIZATION_FAILED,
    privateControlsLoaded: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    state: POST_HANDLER_SANITIZATION_STATE
  });
  await writeResultFile(resultRoot, "terminal-failure-manifest.json", manifest);
  const validation = createPostHandlerFailureValidation({
    resultId: consent.resultId,
    manifestHash: manifest.manifestHash,
    state: manifest.state,
    validatedAt: clock(),
    handlerReturnedReceiptHash: receipt.receiptHash,
    publicResponseArtifactCommitted: false,
    replayPermitted: false,
    effectiveConsentStatus: CONSENT_STATUS.CONSUMED,
    effectiveReservationStatus: RESERVATION_STATE.CLOSED_CONSERVATIVE_COST_ACCOUNTED,
    handlerInvocationCount: 1,
    providerAttemptCount: receipt.providerAttemptCount,
    physicalProviderAttemptCount: receipt.physicalProviderAttemptCount,
    conservativeConsumedCost: receipt.cumulativeConservativeCost,
    actualBilledCostStatus: "UNKNOWN",
    privateControlsLoaded: false,
    scoringPerformed: false,
    reflectionPerformed: false,
    repairPerformed: false
  });
  await writeResultFile(resultRoot, "terminal-failure-validation-report.json", validation);
  validatePostHandlerFailureManifest(manifest);
  validatePostHandlerFailureValidation(validation, manifest);
  return Object.freeze({ terminalFailureManifest: manifest, terminalFailureValidationReport: validation });
}

async function finalizePreExternalAbort({ resultRoot, frozen, consent, reservation, journal, ledger, executionProfile, continuationScope = null, requestId, requestedCount, clock }) {
  const basePaths = [
    "launch-scope.json", ...(continuationScope ? ["continuation-scope.json"] : []),
    "execution-profile.json", "pricing-profile.json", "cost-envelope.json",
    "execution-consent.json", "invocation-reservation.json", "execution-journal.json", "cost-ledger.json"
  ];
  const baseTree = await computeResultTreeAggregate(resultRoot, basePaths);
  assert.equal(ledger.actualCalculatedCost, 0);
  assert.equal(ledger.accruedEstimatedCost, 0);
  assert.deepEqual(ledger.actualProviderReportedUsage, []);
  assert.deepEqual(ledger.perAttemptCostRecords, []);
  const manifest = createTerminalFailureManifest({
    failureClassification: PRE_EXTERNAL_TERMINAL_STATE,
    launchScopeHash: consent.launchScopeHash,
    resultId: consent.resultId,
    resultRootName: consent.resultRootName,
    invocationId: consent.invocationId,
    consentHash: consent.consentHash,
    reservationHash: reservation.reservationHash,
    executionReleaseRecordHash: executionProfile.executionReleaseRecordHash,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    requestId,
    originalPartialArtifactAggregate: baseTree.aggregate,
    failureEvidenceAggregate: baseTree.aggregate,
    zeroExternalSupersessionReceiptId: consent.zeroExternalSupersessionReceiptId,
    zeroExternalSupersessionReceiptHash: consent.zeroExternalSupersessionReceiptHash,
    handlerAttemptCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    requestedCount,
    preExternalAbortCount: 1,
    notExternallySubmittedCount: requestedCount,
    effectiveConsentStatus: CONSENT_STATUS.CONSUMED,
    resultRootConsentStatus: CONSENT_STATUS.CONSUMED,
    effectiveReservationStatus: RESERVATION_STATE.CLOSED_PRE_EXTERNAL_ABORT,
    journalEffectiveState: REQUEST_STATE.PRE_EXTERNAL_ABORT,
    originalArtifactsByteIdentical: true,
    privateControlsLoaded: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    state: PRE_EXTERNAL_TERMINAL_STATE
  });
  await writeResultFile(resultRoot, "terminal-failure-manifest.json", manifest);
  const report = createTerminalFailureValidationReport({
    resultId: consent.resultId,
    manifestHash: manifest.manifestHash,
    state: manifest.state,
    validatedAt: clock(),
    originalArtifactsByteIdentical: true,
    effectiveCanonicalConsentStatus: CONSENT_STATUS.CONSUMED,
    resultRootConsentStatus: CONSENT_STATUS.CONSUMED,
    effectiveReservationStatus: RESERVATION_STATE.CLOSED_PRE_EXTERNAL_ABORT,
    journalEffectiveState: REQUEST_STATE.PRE_EXTERNAL_ABORT,
    handlerAttemptCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    privateControlsLoaded: false,
    scoringPerformed: false,
    reflectionPerformed: false,
    repairPerformed: false
  });
  await writeResultFile(resultRoot, "terminal-failure-validation-report.json", report);
  validateTerminalFailureManifest(manifest);
  validateTerminalFailureValidationReport(report, manifest);
  return Object.freeze({ terminalFailureManifest: manifest, terminalFailureValidationReport: report });
}

export async function executeBenchmarkV2({
  mode,
  freezeRoot,
  resultHistoryRootOverride = null,
  reservationStoreRootOverride = null,
  executionProfile,
  attemptCeiling,
  pricingProfile,
  costEnvelope,
  launchScope,
  continuationScope = null,
  consent,
  productRuntimeRoot = null,
  allowedEnvironment = null,
  zeroExternalSupersessionReceipt = null,
  terminalFailureReceipt = null,
  unusedConsentRevocationReceipt = null,
  releaseIdentity = null,
  syntheticHandler = null,
  photoTransformer = null,
  faultPlan = null,
  onConsentTransition = async () => {},
  onFreezeRead = () => {},
  clock = defaultClock
}) {
  assert.ok(Object.values(EXECUTION_MODE).includes(mode));
  assert.equal(mode === EXECUTION_MODE.SYNTHETIC_TEST_ONLY, typeof syntheticHandler === "function", "synthetic mode requires exactly one fixed mock handler function");
  assert.ok(photoTransformer === null || typeof photoTransformer === "function", "photo transformer must be a function or null");
  assert.equal(typeof onConsentTransition, "function", "consent transition persistence callback is required");
  if (mode === EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION) {
    assert.equal(syntheticHandler, null, "real execution cannot accept a mock or arbitrary handler");
    assert.equal(photoTransformer, null, "real execution cannot accept a caller-selected photo transformer");
    assert.equal(faultPlan, null, "real execution cannot accept synthetic fault injection");
    assert.ok(productRuntimeRoot, "real execution requires the pinned product runtime");
    const runtime = verifyDetachedProductRuntime(productRuntimeRoot);
    assert.equal(runtime.productRuntimeManifestHash, executionProfile.productRuntimeManifestHash);
  }
  const frozen = await loadPublicFreeze(freezeRoot, { onRead: onFreezeRead });
  validateLaunchScope(launchScope);
  const executionRequests = continuationScope
    ? deriveContinuationRequests(frozen, continuationScope)
    : frozen.requests;
  if (continuationScope) {
    validateContinuationScope(continuationScope, frozen);
    assert.equal(launchScope.continuationScopeHash, continuationScope.continuationScopeHash);
    assert.equal(launchScope.authorizedRequestCount, 25);
    assert.equal(continuationScope.terminalFailureReceiptHash, terminalFailureReceipt?.receiptHash, "continuation terminal failure receipt differs");
    assert.equal(continuationScope.unusedConsentRevocationReceiptHash, unusedConsentRevocationReceipt?.receiptHash, "continuation unused consent revocation receipt differs");
  } else {
    assert.equal(launchScope.authorizedRequestCount, 26, "full execution is limited to synthetic qualification");
    assert.equal(mode, EXECUTION_MODE.SYNTHETIC_TEST_ONLY, "real execution requires the fixed continuation scope");
  }
  if (zeroExternalSupersessionReceipt || terminalFailureReceipt || unusedConsentRevocationReceipt) {
    const releaseChain = validateContinuationReleaseChain({ releaseIdentity, zeroExternalSupersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt });
    assert.equal(launchScope.releaseChainHash, releaseChain.releaseChainHash);
    assert.equal(launchScope.historicalExecutionReleaseRecordHash, releaseChain.version1121ExecutionReleaseRecordHash);
    assert.equal(launchScope.predecessorExecutionReleaseRecordHash, releaseChain.version1122ExecutionReleaseRecordHash);
  }
  if (mode === EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION) {
    assert.ok(zeroExternalSupersessionReceipt, "real execution requires the historical zero-external supersession receipt");
    assert.ok(terminalFailureReceipt, "real execution requires the fixed Version 1.12.21 terminal-failure receipt");
    assert.ok(unusedConsentRevocationReceipt, "real execution requires the unused Version 1.12.22 consent revocation receipt");
    assert.ok(releaseIdentity, "real execution requires the qualified Version 1.12.23 release identity");
  }
  validateExecutionProfile(executionProfile, {
    attemptCeiling,
    releaseIdentity: executionProfile,
    productRuntimeManifestHash: executionProfile.productRuntimeManifestHash
  });
  assertNoSecretMaterial(executionProfile, {
    knownEnvironment: allowedEnvironment?.secretValues || {},
    schemaValidatedRecordType: executionProfile.profileType
  });
  validatePricingProfile(pricingProfile, executionProfile);
  validateCostEnvelope(costEnvelope, { attemptCeiling, executionProfile, pricingProfile, authorizedMaximumMinorUnits: launchScope.maximumAuthorizedCostMinorUnits });
  validateExecutionConsent(consent, {
    launchScope,
    requiredStatus: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED,
    bindings: {
      benchmarkId: frozen.manifest.benchmarkId,
      candidateSetId: frozen.manifest.candidateSetId,
      productSourceHead: PRODUCT_SOURCE_HEAD,
      productSourceVersion: PRODUCT_SOURCE_VERSION,
      completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
      freezeManifestHash: frozen.manifest.freezeManifestHash,
      freezeReceiptHash: frozen.receipt.receiptHash,
      requestAggregateHash: continuationScope
        ? continuationScope.continuationRequestAggregateHash
        : frozen.manifest.requestAggregateHash,
      orderedRequestHashInventory: executionRequests.map((request) => request.requestContractHash),
      executionProfileIdentityHash: executionProfile.executionProfileIdentityHash,
      pricingProfileIdentityHash: pricingProfile.pricingProfileIdentityHash,
      costEnvelopeHash: costEnvelope.costEnvelopeHash,
      completePhysicalAttemptCeiling: attemptCeiling.categories.totalPhysicalAttempts,
      authorizedRequestCount: executionRequests.length
    }
  });
  for (const field of ["executorRuntimeHead", "qualificationHead", "executorRuntimeTreeHash", "executionReleaseRecordHash", "qualificationPolicyVersion"]) {
    assert.equal(consent[field], executionProfile[field], `consent ${field} differs from execution profile`);
  }
  assert.equal(consent.executorVersion, EXECUTOR_VERSION);
  const conservativePreRunMaximum = consent.conservativeMaximumCost;
  assert.equal(consent.conservativeMaximumCost, conservativePreRunMaximum, "consent conservative cost differs from sealed pricing and attempt ceiling");

  const resultHistoryRoot = resolveResultHistoryRoot(mode, resultHistoryRootOverride);
  const resultRoot = deriveResultRoot(resultHistoryRoot, consent.resultRootName);
  assert.equal(consent.fixedResultRoot, `benchmarks/blind-object-v2-results/${consent.resultRootName}`);
  const reservationStoreRoot = reservationStoreRootOverride || path.join(resultHistoryRoot, ".reservations");
  if (mode === EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION) assert.equal(reservationStoreRoot, path.join(resultHistoryRoot, ".reservations"));
  const reservationInput = {
    launchScope,
    consent,
    executionProfileHash: executionProfile.profileHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    createdIdentity: `executor-${executionProfile.executorRuntimeHead.slice(0, 16)}`
  };
  let reservation = createInvocationReservation(reservationInput, clock());
  const createdReservation = await createExclusiveReservation(reservationStoreRoot, reservation, { zeroExternalSupersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, releaseIdentity });
  assert.equal(createdReservation.status, "CREATED", "execution requires a newly exclusive reservation; readback cannot start execution");
  const reservationFile = createdReservation.filePath;
  await createExclusiveResultRoot(resultHistoryRoot, consent.resultRootName);
  await writeResultFile(resultRoot, "launch-scope.json", launchScope);
  if (continuationScope) await writeResultFile(resultRoot, "continuation-scope.json", continuationScope);
  await writeResultFile(resultRoot, "execution-profile.json", executionProfile);
  await writeResultFile(resultRoot, "pricing-profile.json", pricingProfile);
  await writeResultFile(resultRoot, "cost-envelope.json", costEnvelope);
  await writeResultFile(resultRoot, "execution-consent.json", consent);
  await writeResultFile(resultRoot, "invocation-reservation.json", reservation);
  let journal = createExecutionJournal({ invocationId: consent.invocationId, consentHash: consent.consentHash, requests: executionRequests, nowIso: clock() });
  let ledger = createCostLedger({
    invocationId: consent.invocationId,
    consentHash: consent.consentHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    maximumAuthorizedCost: continuationScope ? continuationScope.remainingConservativeCostAuthority : consent.maximumAuthorizedCost,
    conservativePreRunMaximum,
    requests: executionRequests,
    nowIso: clock()
  });
  await writeResultFile(resultRoot, "execution-journal.json", journal);
  await writeResultFile(resultRoot, "cost-ledger.json", ledger);

  reservation = transitionReservation(reservation, RESERVATION_STATE.STARTED, clock(), "EXECUTION_SPINE_STARTED");
  await replaceReservation(reservationFile, reservation);
  consent = transitionConsent(consent, CONSENT_STATUS.CONSUMED, clock(), "INVOCATION_RESERVATION_STARTED");
  await persistMutableAuthorities(resultRoot, { consent, reservation, journal, ledger });
  await onConsentTransition(consent);

  const terminalRecords = [];
  const handlerReturnedReceipts = [];
  let stopReason = "";
  let integrityFailureCount = 0;
  let preExternalAbortRequestId = "";
  const perRequestWorstCase = conservativePreRunMaximum / executionRequests.length;
  for (const [index, request] of executionRequests.entries()) {
    const expectedPlanIndex = continuationScope ? index + 1 : index;
    assert.equal(request.analysisId, frozen.analysisPlan.analyses[expectedPlanIndex].analysisId, "execution order differs from canonical analysis plan");
    if (ledger.accruedEstimatedCost + ledger.reservedWorstCaseRemainingCost > ledger.maximumAuthorizedCost) {
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION, { at: clock(), reason: "COST_CEILING_STOP_BEFORE_SUBMISSION" });
      await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
      stopReason = "COST_CEILING_STOP_BEFORE_NEXT_UNSENT_REQUEST";
      integrityFailureCount += 1;
      break;
    }
    journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.LOCAL_PREPARATION_STARTED, { at: clock(), reason: "LOCAL_PHOTO_PREPARATION_STARTED" });
    await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
    let submissionId = null;
    let externalAttemptCommitted = false;
    let startedAt = "";
    let startedMs = 0;
    let handlerResult;
    let terminalState;
    let submissionState;
    let errorStage = "";
    let errorCategory = "";
    let handlerReturned = false;
    let handlerReturnedAt = "";
    let canonicalHandlerResultHash = "";
    try {
      if (faultPlan?.duringLocalPreparation === request.analysisId) throw Object.assign(new Error("synthetic local preparation failure"), { code: "synthetic_pre_external_abort" });
      const invokeAtHandlerBoundary = async (preparedPhotos, lifecycle = null) => {
        if (lifecycle) assert.deepEqual(lifecycle, { pageOpen: true, contextOwnsPage: true, browserConnected: true }, "browser lifecycle is invalid at the handler boundary");
        journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.LOCAL_PREPARATION_COMPLETED, { at: clock(), reason: "LOCAL_PHOTO_PREPARATION_COMPLETED" });
        await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
        submissionId = submissionIdentity(consent.invocationId, request);
        journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.EXTERNAL_ATTEMPT_COMMITTED, { at: clock(), reason: "IMMEDIATELY_BEFORE_HANDLER_INVOCATION", physicalSubmissionIdentity: submissionId });
        await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
        externalAttemptCommitted = true;
        startedAt = clock();
        startedMs = Date.parse(startedAt);
        if (faultPlan?.afterExternalAttemptCommitted === request.analysisId || faultPlan?.afterSubmissionStarted === request.analysisId) {
          throw Object.assign(new Error("synthetic ambiguous interruption"), { code: "synthetic_unknown_after_submission" });
        }
        const body = handlerRequestBody(request, preparedPhotos);
        return mode === EXECUTION_MODE.SYNTHETIC_TEST_ONLY
          ? syntheticHandler(Object.freeze({ request, body, preparedPhotos, invocationId: consent.invocationId, submissionId }))
          : invokePinnedProductHandler({
              runtimeRoot: productRuntimeRoot,
              requestBody: body,
              allowedEnvironment,
              correlationId: `ke-local-${sha256Json({ submissionId }).slice(0, 32)}`
            });
      };
      if (mode === EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION) handlerResult = await transformPhotosForProduct(request, frozen.assetCache, invokeAtHandlerBoundary);
      else if (photoTransformer) handlerResult = await photoTransformer(request, frozen.assetCache, invokeAtHandlerBoundary);
      else handlerResult = await invokeAtHandlerBoundary(rawPreparedPhotos(request, frozen.assetCache));
      assert.ok(handlerResult && Number.isInteger(handlerResult.statusCode), "handler terminal result is malformed");
      handlerReturned = true;
      handlerReturnedAt = clock();
      canonicalHandlerResultHash = hashCanonicalHandlerResult(handlerResult);
      submissionState = REQUEST_STATE.TERMINAL;
      terminalState = handlerResult.statusCode >= 200 && handlerResult.statusCode < 400 ? "NORMAL_SUCCESS" : "PRODUCT_TERMINAL_FAILURE";
    } catch (error) {
      if (!externalAttemptCommitted) {
        journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.PRE_EXTERNAL_ABORT, { at: clock(), reason: "PROVEN_LOCAL_PREPARATION_FAILURE_ZERO_EXTERNAL_ACTIVITY" });
        await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
        stopReason = "PRE_EXTERNAL_ABORT_ZERO_EXTERNAL_ACTIVITY";
        preExternalAbortRequestId = request.analysisId;
        integrityFailureCount += 1;
        break;
      }
      submissionState = REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION;
      terminalState = "EXECUTION_INTEGRITY_UNKNOWN_AFTER_SUBMISSION";
      errorStage = "HANDLER_INVOCATION_AFTER_EXTERNAL_ATTEMPT_COMMITTED";
      errorCategory = String(error?.code || "unknown_after_submission").slice(0, 120);
      handlerResult = { statusCode: null, headers: {}, body: { error: "Submission may have reached the handler; replay is permanently prohibited.", code: errorCategory } };
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION, { at: clock(), reason: "AMBIGUOUS_AFTER_EXTERNAL_ATTEMPT_NO_RETRY" });
      stopReason = "UNKNOWN_AFTER_SUBMISSION";
      integrityFailureCount += 1;
    }
    await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
    const telemetryAttempts = costAttemptsFromResponse(handlerResult.body);
    const estimatedRequestCost = index === executionRequests.length - 1
      ? Number((conservativePreRunMaximum - ledger.accruedEstimatedCost).toFixed(8))
      : Number(perRequestWorstCase.toFixed(8));
    const costEntry = {
      estimationBasis: "CONSERVATIVE_PER_REQUEST_MAXIMUM_WHEN_PROVIDER_USAGE_IS_MISSING",
      estimatedCost: estimatedRequestCost,
      providerTelemetryAttemptCount: telemetryAttempts.length
    };
    const remaining = Number(Math.max(0, conservativePreRunMaximum - ledger.accruedEstimatedCost - estimatedRequestCost).toFixed(8));
    ledger = recordRequestCost(ledger, {
      analysisId: request.analysisId,
      attempts: telemetryAttempts.length ? telemetryAttempts : [{ category: "CONSERVATIVE_REQUEST_RESERVATION", provider: "UNREPORTED", providerReportedUsage: null, calculatedCost: null, estimationBasis: costEntry.estimationBasis }],
      estimatedCost: costEntry.estimatedCost,
      actualCost: null,
      providerUsage: [],
      reservedWorstCaseRemainingCost: remaining,
      at: clock()
    });
    await writeResultFile(resultRoot, "cost-ledger.json", ledger, { replace: true });
    let handlerReturnedReceipt = null;
    if (handlerReturned) {
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.HANDLER_RETURNED, { at: handlerReturnedAt, reason: terminalState });
      await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
      handlerReturnedReceipt = createHandlerReturnedReceipt({
        executionReleaseRecordHash: executionProfile.executionReleaseRecordHash,
        executorRuntimeHead: executionProfile.executorRuntimeHead,
        qualificationHead: executionProfile.qualificationHead,
        executorVersion: EXECUTOR_VERSION,
        launchScopeHash: consent.launchScopeHash,
        continuationScopeHash: launchScope.continuationScopeHash || null,
        consentId: consent.consentId,
        consentHash: consent.consentHash,
        invocationId: consent.invocationId,
        reservationId: consent.reservationId,
        reservationHash: reservation.reservationHash,
        resultId: consent.resultId,
        resultRootName: consent.resultRootName,
        requestId: request.analysisId,
        requestHash: request.requestContractHash,
        physicalSubmissionIdentity: submissionId,
        handlerOutcome: terminalState,
        handlerStatus: handlerResult.statusCode,
        handlerInvocationCount: 1,
        providerAttemptCount: telemetryAttempts.length,
        physicalProviderAttemptCount: telemetryAttempts.length,
        cumulativeConservativeCost: Number(((continuationScope?.priorConservativeCost || 0) + ledger.actualCalculatedCost).toFixed(8)),
        canonicalHandlerResultHash,
        returnedAt: handlerReturnedAt,
        transactionState: "HANDLER_RETURNED_RESPONSE_NOT_PERSISTED",
        publicResponseArtifactCommitted: false,
        replayPermitted: false
      });
      validateHandlerReturnedReceipt(handlerReturnedReceipt);
      await writeResultFile(resultRoot, `handler-returned/${request.analysisId}.json`, handlerReturnedReceipt);
      handlerReturnedReceipts.push(handlerReturnedReceipt);
    }
    const completedAt = clock();
    let terminal;
    try {
      terminal = createTerminalResult(terminalRecordInput({
        request,
        invocationId: consent.invocationId,
        consent,
        reservation,
        executionProfile,
        pricingProfile,
        costEnvelope,
        submissionId,
        submissionState,
        terminalState,
        startedAt,
        completedAt,
        elapsedMs: Math.max(0, Date.parse(completedAt) - startedMs),
        handlerResult,
        errorStage,
        errorCategory,
        costEntry
      }));
      validateTerminalResult(terminal);
      assertNoSecretMaterial(terminal, {
        knownEnvironment: allowedEnvironment?.secretValues || {},
        schemaValidatedRecordType: terminal.resultRecordType
      });
      await writeResultFile(resultRoot, `responses/${request.analysisId}.json`, terminal);
    } catch (error) {
      if (!handlerReturned || !handlerReturnedReceipt) throw error;
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.POST_HANDLER_SANITIZATION_FAILED, { at: clock(), reason: "TERMINAL_RECORD_SANITIZATION_FAILED_RESPONSE_NOT_PERSISTED" });
      await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
      reservation = transitionReservation(reservation, RESERVATION_STATE.CLOSED_CONSERVATIVE_COST_ACCOUNTED, clock(), "POST_HANDLER_SANITIZATION_FAILED_CONSERVATIVE_COST_ACCOUNTED");
      await replaceReservation(reservationFile, reservation);
      await persistMutableAuthorities(resultRoot, { consent, reservation, journal, ledger });
      await onConsentTransition(consent);
      const failure = await finalizePostHandlerSanitizationFailure({
        resultRoot, frozen, consent, reservation, journal, ledger, executionProfile, launchScope,
        continuationScope, receipt: handlerReturnedReceipt, terminalRecords, handlerReturnedReceipts, clock
      });
      return Object.freeze({
        disposition: POST_HANDLER_SANITIZATION_STATE,
        resultRoot,
        reservationFile,
        consent,
        reservation,
        journal,
        ledger,
        terminalRecords: Object.freeze(terminalRecords),
        handlerReturnedReceipts: Object.freeze(handlerReturnedReceipts),
        ...failure,
        stopReason: "POST_HANDLER_SANITIZATION_FAILURE"
      });
    }
    if (handlerReturned) {
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.TERMINAL, { at: clock(), reason: terminalState });
      await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
    }
    terminalRecords.push(terminal);
    if (stopReason) break;
  }

  const submitted = journal.entries.filter((entry) => entry.physicalSubmissionIdentity && ![REQUEST_STATE.NOT_SUBMITTED, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION].includes(entry.state)).length;
  let resultState;
  if (preExternalAbortRequestId) {
    assert.equal(submitted, 0, "pre-external abort cannot contain an external submission identity");
    assert.equal(terminalRecords.length, 0, "pre-external abort cannot contain a terminal product response");
    resultState = RESULT_STATE.ABORTED_PRE_HANDLER_ZERO_EXTERNAL_ACTIVITY;
    reservation = transitionReservation(reservation, RESERVATION_STATE.CLOSED_PRE_EXTERNAL_ABORT, clock(), "PROVEN_PRE_EXTERNAL_ABORT_ZERO_SPEND");
  } else if (submitted === executionRequests.length && terminalRecords.length === executionRequests.length && integrityFailureCount === 0) {
    resultState = RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING;
    reservation = transitionReservation(reservation, RESERVATION_STATE.CONSUMED, clock(), "ALL_REQUESTS_TERMINAL_AND_SEALED");
  } else if (submitted === 0) {
    resultState = RESULT_STATE.FAILED_BEFORE_ANY_SUBMISSION;
    reservation = transitionReservation(reservation, RESERVATION_STATE.INDETERMINATE, clock(), stopReason || "FAILED_BEFORE_ANY_SUBMISSION_AFTER_RESERVATION_START");
  } else {
    resultState = RESULT_STATE.PARTIAL_EXECUTION_INTEGRITY_STOP;
    reservation = transitionReservation(reservation, RESERVATION_STATE.INDETERMINATE, clock(), stopReason || "PARTIAL_EXECUTION_STOP");
  }
  await replaceReservation(reservationFile, reservation);
  await persistMutableAuthorities(resultRoot, { consent, reservation, journal, ledger });
  await onConsentTransition(consent);
  if (preExternalAbortRequestId) {
    const failure = await finalizePreExternalAbort({
      resultRoot,
      frozen,
      consent,
      reservation,
      journal,
      ledger,
      executionProfile,
      continuationScope,
      requestId: preExternalAbortRequestId,
      requestedCount: executionRequests.length,
      clock
    });
    return Object.freeze({
      disposition: PRE_EXTERNAL_TERMINAL_STATE,
      resultRoot,
      reservationFile,
      consent,
      reservation,
      journal,
      ledger,
      terminalRecords: Object.freeze([]),
      handlerReturnedReceipts: Object.freeze(handlerReturnedReceipts),
      ...failure,
      stopReason
    });
  }
  const finalized = await finalizeResult({
    resultRoot,
    frozen,
    consent,
    reservation,
    journal,
    ledger,
    executionProfile,
    pricingProfile,
    costEnvelope,
    terminalRecords,
    handlerReturnedReceipts,
    continuationScope,
    requestedCount: executionRequests.length,
    resultState,
    integrityFailureCount,
    clock
  });
  return Object.freeze({
    disposition: mode === EXECUTION_MODE.SYNTHETIC_TEST_ONLY && resultState === RESULT_STATE.EXECUTED_SEALED_AWAITING_SCORING
      ? "DRY_RUN_EXECUTION_SPINE_READY_NOT_AUTHORIZED"
      : resultState,
    resultRoot,
    reservationFile,
    consent,
    reservation,
    journal,
    ledger,
    terminalRecords: Object.freeze(terminalRecords),
    handlerReturnedReceipts: Object.freeze(handlerReturnedReceipts),
    ...finalized,
    stopReason
  });
}

export async function verifyResultReadback({ resultRoot, freezeRoot, onFreezeRead = () => {} }) {
  const root = path.resolve(resultRoot);
  try {
    const failureManifest = await readJsonStrictFile(path.join(root, "terminal-failure-manifest.json"));
    return failureManifest.manifestType === POST_HANDLER_FAILURE_MANIFEST_TYPE
      ? verifyPostHandlerFailureReadback({ resultRoot: root, freezeRoot, onFreezeRead })
      : verifyPreExternalFailureReadback({ resultRoot: root, freezeRoot, onFreezeRead });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const filesBefore = await listResultFiles(root);
  const artifactInventory = classifyResultArtifactInventory(filesBefore);
  const [launchScope, executionProfile, pricingProfile, costEnvelope, consent, reservation, journal, ledger, manifest, validationReport] = await Promise.all([
    readJsonStrictFile(path.join(root, "launch-scope.json")),
    readJsonStrictFile(path.join(root, "execution-profile.json")),
    readJsonStrictFile(path.join(root, "pricing-profile.json")),
    readJsonStrictFile(path.join(root, "cost-envelope.json")),
    readJsonStrictFile(path.join(root, "execution-consent.json")),
    readJsonStrictFile(path.join(root, "invocation-reservation.json")),
    readJsonStrictFile(path.join(root, "execution-journal.json")),
    readJsonStrictFile(path.join(root, "cost-ledger.json")),
    readJsonStrictFile(path.join(root, "unscored-result-manifest.json")),
    readJsonStrictFile(path.join(root, "validation-report.json"))
  ]);
  const frozen = await loadPublicFreeze(freezeRoot, { onRead: onFreezeRead });
  const { continuationScope, executionRequests } = await loadReadbackExecutionScope(root, launchScope, frozen);
  const attemptCeiling = calculateCompleteAttemptCeiling(frozen.requests);
  validateLaunchScope(launchScope);
  validateExecutionProfile(executionProfile, {
    attemptCeiling,
    releaseIdentity: executionProfile,
    productRuntimeManifestHash: executionProfile.productRuntimeManifestHash
  });
  validatePricingProfile(pricingProfile, executionProfile);
  validateCostEnvelope(costEnvelope, { attemptCeiling, executionProfile, pricingProfile, authorizedMaximumMinorUnits: launchScope.maximumAuthorizedCostMinorUnits });
  validateUnscoredResultManifest(manifest);
  validateExecutionConsent(consent, {
    launchScope,
    requiredStatus: CONSENT_STATUS.CONSUMED,
    bindings: {
      resultId: manifest.resultId,
      invocationId: manifest.invocationId,
      productSourceHead: manifest.productSourceHead,
      productSourceVersion: manifest.productSourceVersion,
      executorRuntimeHead: manifest.executorRuntimeHead,
      qualificationHead: manifest.qualificationHead,
      executorRuntimeTreeHash: manifest.executorRuntimeTreeHash,
      executionReleaseRecordHash: manifest.executionReleaseRecordHash,
      qualificationPolicyVersion: manifest.qualificationPolicyVersion,
      executorVersion: manifest.executorVersion,
      completeFrozenAggregateHash: manifest.completeFrozenAggregateHash,
      requestAggregateHash: manifest.requestAggregateHash,
      orderedRequestHashInventory: executionRequests.map((request) => request.requestContractHash),
      authorizedRequestCount: executionRequests.length,
      executionProfileIdentityHash: manifest.executionProfileIdentityHash,
      pricingProfileIdentityHash: manifest.pricingProfileIdentityHash,
      costEnvelopeHash: manifest.costEnvelopeHash
    }
  });
  validateInvocationReservation(reservation, { launchScope });
  validateExecutionJournal(journal, executionRequests);
  validateCostLedger(ledger);
  validateUnscoredValidationReport(validationReport, { manifest });
  assert.equal(manifest.consentHash, consent.consentHash);
  assert.equal(manifest.reservationHash, reservation.reservationHash);
  assert.equal(manifest.invocationId, reservation.invocationId);
  assert.equal(manifest.resultId, reservation.resultId);
  assert.equal(manifest.resultRootName, reservation.resultRootName);
  assert.equal(manifest.launchScopeHash, launchScope.launchScopeHash);
  assert.equal(manifest.productSourceHead, PRODUCT_SOURCE_HEAD);
  assert.equal(manifest.productSourceVersion, PRODUCT_SOURCE_VERSION);
  for (const field of ["executorRuntimeHead", "qualificationHead", "executorRuntimeTreeHash", "executionReleaseRecordHash", "qualificationPolicyVersion"]) {
    assert.equal(manifest[field], executionProfile[field], `manifest ${field} differs from execution profile`);
  }
  assert.equal(manifest.executorVersion, EXECUTOR_VERSION);
  assert.equal(manifest.executionProfileHash, executionProfile.profileHash);
  assert.equal(manifest.executionProfileIdentityHash, executionProfile.executionProfileIdentityHash);
  assert.equal(manifest.pricingProfileHash, pricingProfile.pricingProfileHash);
  assert.equal(manifest.pricingProfileIdentityHash, pricingProfile.pricingProfileIdentityHash);
  assert.equal(manifest.costEnvelopeHash, costEnvelope.costEnvelopeHash);
  assert.equal(manifest.costLedgerHash, ledger.ledgerHash);
  assert.equal(manifest.journalAggregate, journal.journalHash);
  assert.equal(manifest.completeFrozenAggregateHash, frozen.manifest.completeFrozenAggregateHash);
  assert.equal(manifest.requestAggregateHash, consent.requestAggregateHash);
  const expectedArtifacts = expectedResultArtifactPaths(
    manifest.orderedResponseHashInventory.map((record) => record.analysisId),
    {
      handlerReturnedAnalysisIds: manifest.orderedHandlerReturnedReceiptInventory.map((record) => record.analysisId),
      includeContinuationScope: Boolean(continuationScope),
      includeCompositeEvidence: artifactInventory.relativePaths.includes(COMPOSITE_RELATIVE_PATH)
    }
  );
  assert.deepEqual(artifactInventory.relativePaths, expectedArtifacts, "result tree differs from the repository-owned unscored layout");
  const terminalRecords = [];
  const terminalIds = new Set();
  for (const item of manifest.orderedResponseHashInventory) {
    assert.equal(terminalIds.has(item.analysisId), false, `duplicate terminal record ${item.analysisId}`);
    terminalIds.add(item.analysisId);
    const record = await readJsonStrictFile(path.join(root, "responses", `${item.analysisId}.json`));
    const request = frozen.requests.find((candidate) => candidate.analysisId === item.analysisId);
    assert.ok(request, `terminal response ${item.analysisId} does not bind a frozen request`);
    validateTerminalResult(record, { requestHash: request.requestContractHash, launchScopeHash: manifest.launchScopeHash, resultId: manifest.resultId, resultRootName: manifest.resultRootName, invocationId: manifest.invocationId, consentHash: manifest.consentHash, reservationHash: manifest.reservationHash });
    assert.equal(record.canonicalResponseHash, item.canonicalResponseHash);
    assert.equal(record.recordHash, item.recordHash);
    terminalRecords.push(record);
  }
  assert.equal(sha256Json(manifest.orderedResponseHashInventory), manifest.responseAggregate);
  const handlerReturnedReceipts = [];
  for (const item of manifest.orderedHandlerReturnedReceiptInventory) {
    const receipt = await readJsonStrictFile(path.join(root, "handler-returned", `${item.analysisId}.json`));
    validateHandlerReturnedReceipt(receipt, {
      requestId: item.analysisId,
      receiptId: item.receiptId,
      canonicalHandlerResultHash: item.canonicalHandlerResultHash,
      receiptHash: item.receiptHash,
      launchScopeHash: manifest.launchScopeHash,
      invocationId: manifest.invocationId,
      resultId: manifest.resultId,
      resultRootName: manifest.resultRootName,
      continuationScopeHash: launchScope.continuationScopeHash
    });
    handlerReturnedReceipts.push(receipt);
  }
  assert.equal(sha256Json(manifest.orderedHandlerReturnedReceiptInventory), manifest.handlerReturnedAggregate);
  const authorityPaths = [
    "launch-scope.json",
    ...(continuationScope ? ["continuation-scope.json"] : []),
    "execution-profile.json",
    "pricing-profile.json",
    "cost-envelope.json",
    "execution-consent.json",
    "invocation-reservation.json",
    "execution-journal.json",
    "cost-ledger.json",
    ...manifest.orderedHandlerReturnedReceiptInventory.map((record) => `handler-returned/${record.analysisId}.json`),
    ...manifest.orderedResponseHashInventory.map((record) => `responses/${record.analysisId}.json`)
  ];
  const tree = await computeResultTreeAggregate(root, authorityPaths);
  assert.equal(tree.aggregate, manifest.resultTreeAggregate, "result tree aggregate mismatch");
  assert.deepEqual(tree.records, manifest.resultTreeRecords, "result tree record inventory mismatch");
  let compositeManifest = null;
  if (artifactInventory.relativePaths.includes(COMPOSITE_RELATIVE_PATH)) {
    compositeManifest = await readJsonStrictFile(path.join(root, COMPOSITE_RELATIVE_PATH));
    validateCompositeEvidenceManifest(compositeManifest, {
      completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
      freezeRequestAggregateHash: frozen.manifest.requestAggregateHash,
      version1122ExecutionReleaseRecordHash: manifest.executionReleaseRecordHash,
      version1122LaunchScopeHash: launchScope.launchScopeHash,
      version1122ContinuationScopeHash: continuationScope?.continuationScopeHash,
      version1122ConsentHash: consent.consentHash,
      version1122InvocationId: consent.invocationId,
      version1122ResultId: consent.resultId,
      version1122ResultRootName: consent.resultRootName,
      version1122ManifestHash: manifest.manifestHash,
      version1122ResultTreeAggregate: manifest.resultTreeAggregate
    });
    assert.deepEqual(
      compositeManifest.orderedRequestDispositions.slice(1).map((item) => ({
        analysisId: item.analysisId,
        canonicalResponseHash: item.terminalEvidenceHash,
        recordHash: item.terminalResultRecordHash
      })),
      manifest.orderedResponseHashInventory
    );
  }
  const replay = journal.entries.map(requestReplayDisposition);
  for (const disposition of replay.filter((entry) => entry.state === REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION || entry.state === REQUEST_STATE.TERMINAL)) assert.equal(disposition.resubmissionPermanentlyBlocked, true);
  const filesAfter = await listResultFiles(root);
  assert.deepEqual(filesAfter, filesBefore, "strict readback wrote or removed result files");
  return Object.freeze({
    valid: true,
    state: manifest.state,
    manifestHash: manifest.manifestHash,
    compositeManifestHash: compositeManifest?.manifestHash || null,
    compositeState: compositeManifest?.state || null,
    responseCount: terminalRecords.length,
    handlerInvocationCount: 0,
    providerAttemptCount: 0,
    fileWriteCount: 0,
    replayPlan: Object.freeze(replay)
  });
}

async function loadReadbackExecutionScope(root, launchScope, frozen) {
  if (launchScope.authorizedRequestCount === 26) {
    return Object.freeze({ continuationScope: null, executionRequests: frozen.requests });
  }
  assert.equal(launchScope.authorizedRequestCount, 25, "readback launch request count is invalid");
  const continuationScope = await readJsonStrictFile(path.join(root, "continuation-scope.json"));
  validateContinuationScope(continuationScope, frozen);
  const bindings = {
    continuationScopeHash: continuationScope.continuationScopeHash,
    continuationRequestAggregateHash: continuationScope.continuationRequestAggregateHash,
    terminalFailureReceiptId: continuationScope.terminalFailureReceiptId,
    terminalFailureReceiptHash: continuationScope.terminalFailureReceiptHash,
    priorPhysicalAttemptCount: continuationScope.priorPhysicalAttemptCount,
    priorConservativeCost: continuationScope.priorConservativeCost,
    remainingPhysicalAttemptAuthority: continuationScope.remainingPhysicalAttemptAuthority,
    remainingConservativeCostAuthority: continuationScope.remainingConservativeCostAuthority,
    continuationPhysicalAttemptCeiling: continuationScope.continuationPhysicalAttemptCeiling,
    continuationConservativeMaximumCost: continuationScope.continuationConservativeMaximumCost,
    cumulativeConservativeMaximumCost: continuationScope.cumulativeConservativeMaximumCost,
    authorizedRequestCount: continuationScope.authorizedRequestCount
  };
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(launchScope[field], value, `launch ${field} differs from continuation scope`);
  assert.deepEqual(launchScope.continuationOrderedRequestHashInventory, continuationScope.orderedRequestHashInventory);
  return Object.freeze({ continuationScope, executionRequests: deriveContinuationRequests(frozen, continuationScope) });
}

async function verifyPostHandlerFailureReadback({ resultRoot, freezeRoot, onFreezeRead }) {
  const root = path.resolve(resultRoot);
  const filesBefore = await listResultFiles(root, { terminalKind: "FAILURE" });
  const inventory = classifyResultArtifactInventory(filesBefore, { terminalKind: "FAILURE" });
  const [launchScope, executionProfile, pricingProfile, costEnvelope, consent, reservation, journal, ledger, manifest, validation, frozen] = await Promise.all([
    readJsonStrictFile(path.join(root, "launch-scope.json")),
    readJsonStrictFile(path.join(root, "execution-profile.json")),
    readJsonStrictFile(path.join(root, "pricing-profile.json")),
    readJsonStrictFile(path.join(root, "cost-envelope.json")),
    readJsonStrictFile(path.join(root, "execution-consent.json")),
    readJsonStrictFile(path.join(root, "invocation-reservation.json")),
    readJsonStrictFile(path.join(root, "execution-journal.json")),
    readJsonStrictFile(path.join(root, "cost-ledger.json")),
    readJsonStrictFile(path.join(root, "terminal-failure-manifest.json")),
    readJsonStrictFile(path.join(root, "terminal-failure-validation-report.json")),
    loadPublicFreeze(freezeRoot, { onRead: onFreezeRead })
  ]);
  validateLaunchScope(launchScope);
  const { continuationScope, executionRequests } = await loadReadbackExecutionScope(root, launchScope, frozen);
  const attemptCeiling = calculateCompleteAttemptCeiling(frozen.requests);
  validateExecutionProfile(executionProfile, { attemptCeiling, releaseIdentity: executionProfile, productRuntimeManifestHash: executionProfile.productRuntimeManifestHash });
  validatePricingProfile(pricingProfile, executionProfile);
  validateCostEnvelope(costEnvelope, { attemptCeiling, executionProfile, pricingProfile, authorizedMaximumMinorUnits: launchScope.maximumAuthorizedCostMinorUnits });
  validateExecutionConsent(consent, {
    launchScope,
    requiredStatus: CONSENT_STATUS.CONSUMED,
    bindings: {
      requestAggregateHash: continuationScope?.continuationRequestAggregateHash || frozen.manifest.requestAggregateHash,
      orderedRequestHashInventory: executionRequests.map((request) => request.requestContractHash),
      authorizedRequestCount: executionRequests.length
    }
  });
  validateInvocationReservation(reservation, { launchScope });
  validateExecutionJournal(journal, executionRequests);
  validateCostLedger(ledger);
  validatePostHandlerFailureManifest(manifest);
  validatePostHandlerFailureValidation(validation, manifest);
  assert.equal(reservation.state, RESERVATION_STATE.CLOSED_CONSERVATIVE_COST_ACCOUNTED);
  const failed = journal.entries.filter((entry) => entry.state === REQUEST_STATE.POST_HANDLER_SANITIZATION_FAILED);
  assert.deepEqual(failed.map((entry) => entry.analysisId), [manifest.requestId]);
  const receipt = await readJsonStrictFile(path.join(root, "handler-returned", `${manifest.requestId}.json`));
  validateHandlerReturnedReceipt(receipt, {
    receiptId: manifest.handlerReturnedReceiptId,
    receiptHash: manifest.handlerReturnedReceiptHash,
    canonicalHandlerResultHash: manifest.canonicalHandlerResultHash,
    requestId: manifest.requestId,
    launchScopeHash: manifest.launchScopeHash,
    invocationId: manifest.invocationId,
    resultId: manifest.resultId,
    resultRootName: manifest.resultRootName,
    continuationScopeHash: launchScope.continuationScopeHash
  });
  const basePaths = [
    "launch-scope.json", ...(continuationScope ? ["continuation-scope.json"] : []),
    "execution-profile.json", "pricing-profile.json", "cost-envelope.json",
    "execution-consent.json", "invocation-reservation.json", "execution-journal.json", "cost-ledger.json",
    ...journal.entries
      .filter((entry) => [REQUEST_STATE.TERMINAL, REQUEST_STATE.POST_HANDLER_SANITIZATION_FAILED].includes(entry.state))
      .map((entry) => `handler-returned/${entry.analysisId}.json`),
    ...inventory.responseAnalysisIds.map((analysisId) => `responses/${analysisId}.json`)
  ];
  const tree = await computeResultTreeAggregate(root, basePaths);
  assert.equal(tree.aggregate, manifest.failureEvidenceAggregate);
  assert.equal(inventory.responseAnalysisIds.includes(manifest.requestId), false, "failed request unexpectedly has a public response artifact");
  const durableEntries = journal.entries.filter((entry) => [REQUEST_STATE.TERMINAL, REQUEST_STATE.POST_HANDLER_SANITIZATION_FAILED].includes(entry.state));
  const receipts = [];
  for (const entry of durableEntries) {
    const durableReceipt = await readJsonStrictFile(path.join(root, "handler-returned", `${entry.analysisId}.json`));
    validateHandlerReturnedReceipt(durableReceipt, {
      requestId: entry.analysisId,
      launchScopeHash: manifest.launchScopeHash,
      continuationScopeHash: launchScope.continuationScopeHash,
      invocationId: manifest.invocationId,
      resultId: manifest.resultId,
      resultRootName: manifest.resultRootName
    });
    receipts.push(durableReceipt);
  }
  assert.equal(receipt.providerAttemptCount, manifest.providerAttemptCount);
  assert.equal(receipt.physicalProviderAttemptCount, manifest.physicalProviderAttemptCount);
  assert.equal(receipt.cumulativeConservativeCost, manifest.conservativeConsumedCost);
  for (const analysisId of inventory.responseAnalysisIds) {
    const record = await readJsonStrictFile(path.join(root, "responses", `${analysisId}.json`));
    const request = executionRequests.find((candidate) => candidate.analysisId === analysisId);
    assert.ok(request, `post-handler failure response ${analysisId} does not bind the execution scope`);
    validateTerminalResult(record, {
      requestHash: request.requestContractHash,
      launchScopeHash: manifest.launchScopeHash,
      resultId: manifest.resultId,
      resultRootName: manifest.resultRootName,
      invocationId: manifest.invocationId,
      consentHash: manifest.consentHash,
      reservationHash: manifest.reservationHash
    });
  }
  const filesAfter = await listResultFiles(root, { terminalKind: "FAILURE" });
  assert.deepEqual(filesAfter, filesBefore, "post-handler failure readback wrote or removed files");
  return Object.freeze({
    valid: true,
    state: manifest.state,
    manifestHash: manifest.manifestHash,
    responseCount: inventory.responseAnalysisIds.length,
    handlerInvocationCount: 0,
    providerAttemptCount: manifest.providerAttemptCount,
    physicalProviderAttemptCount: manifest.physicalProviderAttemptCount,
    conservativeConsumedCost: manifest.conservativeConsumedCost,
    actualBilledCostStatus: manifest.actualBilledCostStatus,
    fileWriteCount: 0,
    replayPlan: Object.freeze(journal.entries.map(requestReplayDisposition))
  });
}

async function verifyPreExternalFailureReadback({ resultRoot, freezeRoot, onFreezeRead }) {
  const root = path.resolve(resultRoot);
  const filesBefore = await listResultFiles(root, { terminalKind: "FAILURE" });
  const inventory = classifyResultArtifactInventory(filesBefore, { terminalKind: "FAILURE" });
  const [launchScope, executionProfile, pricingProfile, costEnvelope, consent, reservation, journal, ledger, manifest, validationReport, frozen] = await Promise.all([
    readJsonStrictFile(path.join(root, "launch-scope.json")),
    readJsonStrictFile(path.join(root, "execution-profile.json")),
    readJsonStrictFile(path.join(root, "pricing-profile.json")),
    readJsonStrictFile(path.join(root, "cost-envelope.json")),
    readJsonStrictFile(path.join(root, "execution-consent.json")),
    readJsonStrictFile(path.join(root, "invocation-reservation.json")),
    readJsonStrictFile(path.join(root, "execution-journal.json")),
    readJsonStrictFile(path.join(root, "cost-ledger.json")),
    readJsonStrictFile(path.join(root, "terminal-failure-manifest.json")),
    readJsonStrictFile(path.join(root, "terminal-failure-validation-report.json")),
    loadPublicFreeze(freezeRoot, { onRead: onFreezeRead })
  ]);
  validateLaunchScope(launchScope);
  const { continuationScope, executionRequests } = await loadReadbackExecutionScope(root, launchScope, frozen);
  const attemptCeiling = calculateCompleteAttemptCeiling(frozen.requests);
  validateExecutionProfile(executionProfile, { attemptCeiling, releaseIdentity: executionProfile, productRuntimeManifestHash: executionProfile.productRuntimeManifestHash });
  validatePricingProfile(pricingProfile, executionProfile);
  validateCostEnvelope(costEnvelope, { attemptCeiling, executionProfile, pricingProfile, authorizedMaximumMinorUnits: launchScope.maximumAuthorizedCostMinorUnits });
  validateExecutionConsent(consent, {
    launchScope,
    requiredStatus: CONSENT_STATUS.CONSUMED,
    bindings: {
      requestAggregateHash: continuationScope?.continuationRequestAggregateHash || frozen.manifest.requestAggregateHash,
      orderedRequestHashInventory: executionRequests.map((request) => request.requestContractHash),
      authorizedRequestCount: executionRequests.length
    }
  });
  validateInvocationReservation(reservation, { launchScope });
  validateExecutionJournal(journal, executionRequests);
  validateCostLedger(ledger);
  validateTerminalFailureManifest(manifest);
  validateTerminalFailureValidationReport(validationReport, manifest);
  assert.equal(manifest.executionReleaseRecordHash, executionProfile.executionReleaseRecordHash);
  assert.equal(manifest.executorVersion, EXECUTOR_VERSION);
  assert.equal(manifest.resultId, consent.resultId);
  assert.equal(manifest.invocationId, consent.invocationId);
  assert.equal(manifest.consentHash, consent.consentHash);
  assert.equal(manifest.reservationHash, reservation.reservationHash);
  assert.equal(manifest.completeFrozenAggregateHash, frozen.manifest.completeFrozenAggregateHash);
  assert.equal(manifest.requestedCount, executionRequests.length);
  assert.equal(manifest.notExternallySubmittedCount, executionRequests.length);
  assert.equal(reservation.state, RESERVATION_STATE.CLOSED_PRE_EXTERNAL_ABORT);
  const aborted = journal.entries.filter((entry) => entry.state === REQUEST_STATE.PRE_EXTERNAL_ABORT);
  assert.deepEqual(aborted.map((entry) => entry.analysisId), [manifest.requestId]);
  assert.equal(journal.entries.every((entry) => entry.physicalSubmissionIdentity === null), true);
  assert.equal(ledger.actualCalculatedCost, 0);
  assert.equal(ledger.accruedEstimatedCost, 0);
  assert.deepEqual(ledger.perAttemptCostRecords, []);
  const basePaths = [
    "launch-scope.json", ...(continuationScope ? ["continuation-scope.json"] : []),
    "execution-profile.json", "pricing-profile.json", "cost-envelope.json",
    "execution-consent.json", "invocation-reservation.json", "execution-journal.json", "cost-ledger.json"
  ];
  const tree = await computeResultTreeAggregate(root, basePaths);
  assert.equal(tree.aggregate, manifest.originalPartialArtifactAggregate);
  assert.equal(tree.aggregate, manifest.failureEvidenceAggregate);
  assert.equal(inventory.responseAnalysisIds.length, 0);
  const filesAfter = await listResultFiles(root, { terminalKind: "FAILURE" });
  assert.deepEqual(filesAfter, filesBefore, "terminal failure readback wrote or removed files");
  return Object.freeze({
    valid: true,
    state: manifest.state,
    manifestHash: manifest.manifestHash,
    responseCount: 0,
    handlerInvocationCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    fileWriteCount: 0,
    replayPlan: Object.freeze(journal.entries.map(requestReplayDisposition))
  });
}

export function createSyntheticMockHandler() {
  let invocationCount = 0;
  const invocations = [];
  const handler = async ({ request, body, preparedPhotos, submissionId }) => {
    invocationCount += 1;
    assert.equal(body.analysisId, request.analysisId);
    assert.equal(preparedPhotos.length, 2);
    assert.deepEqual(preparedPhotos.map((photo) => photo.photoId), request.inputAssets.map((asset) => asset.photoId));
    assert.equal(preparedPhotos.every((photo) => /^data:image\/jpeg;base64,/.test(photo.dataUrl || "")), true);
    if (preparedPhotos.every((photo) => photo.sourceSha256)) assert.deepEqual(preparedPhotos.map((photo) => photo.sourceSha256), request.inputAssets.map((asset) => asset.sha256));
    invocations.push({ analysisId: request.analysisId, submissionId, photoIds: preparedPhotos.map((photo) => photo.photoId) });
    const outcomes = {
      "V2-RUN-002": { statusCode: 200, body: { valuation: { disposition: "STOP_INSUFFICIENT_EVIDENCE" } } },
      "V2-RUN-003": { statusCode: 200, body: { valuation: { disposition: "AWAITING_CUSTOMER_INPUT" } } },
      "V2-RUN-004": { statusCode: 502, body: { error: "Provider failure preserved.", code: "provider_failure" } },
      "V2-RUN-005": { statusCode: 200, body: { valuation: { disposition: "SAFETY_ONLY" } } },
      "V2-RUN-006": { statusCode: 502, body: { error: "Malformed product response preserved.", code: "malformed_product_response" } }
    };
    return outcomes[request.analysisId] || { statusCode: 200, headers: { "content-type": "application/json" }, body: request.customerPurpose === "MARKETPLACE_LISTING" ? { listing: { disposition: "COMPLETE" } } : { valuation: { disposition: "COMPLETE" } } };
  };
  return Object.freeze({ handler, invocations, get invocationCount() { return invocationCount; } });
}
