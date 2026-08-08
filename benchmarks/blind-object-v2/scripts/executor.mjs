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
  conservativeMaximumCost,
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
    invocationId,
    consentHash: consent.consentHash,
    reservationHash: reservation.reservationHash,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    executorSourceHead: executionProfile.executorSourceHead,
    executorVersion: EXECUTOR_VERSION,
    executionProfileHash: executionProfile.profileHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
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
  terminalRecords,
  resultState,
  integrityFailureCount,
  clock
}) {
  const authorityPaths = [
    "execution-profile.json",
    "pricing-profile.json",
    "execution-consent.json",
    "invocation-reservation.json",
    "execution-journal.json",
    "cost-ledger.json",
    ...terminalRecords.map((record) => `responses/${record.requestId}.json`)
  ];
  const tree = await computeResultTreeAggregate(resultRoot, authorityPaths);
  const orderedResponseHashInventory = terminalRecords.map((record) => ({
    analysisId: record.requestId,
    canonicalResponseHash: record.canonicalResponseHash,
    recordHash: record.recordHash
  }));
  const submittedCount = journal.entries.filter((entry) => entry.physicalSubmissionIdentity !== null && ![REQUEST_STATE.NOT_SUBMITTED, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION].includes(entry.state)).length;
  const normalSuccessCount = terminalRecords.filter((record) => record.terminalState === "NORMAL_SUCCESS").length;
  const productTerminalFailureCount = terminalRecords.filter((record) => record.terminalState === "PRODUCT_TERMINAL_FAILURE").length;
  const manifest = createUnscoredResultManifest({
    resultId: consent.resultId,
    invocationId: consent.invocationId,
    consentHash: consent.consentHash,
    reservationHash: reservation.reservationHash,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    executorSourceHead: executionProfile.executorSourceHead,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    requestAggregateHash: frozen.manifest.requestAggregateHash,
    executionProfileHash: executionProfile.profileHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    maximumCost: consent.maximumAuthorizedCost,
    costLedgerHash: ledger.ledgerHash,
    requestedCount: 26,
    submittedCount,
    terminalCount: terminalRecords.length,
    normalSuccessCount,
    productTerminalFailureCount,
    executionIntegrityFailureCount: integrityFailureCount,
    notSubmittedCount: 26 - submittedCount,
    orderedResponseHashInventory,
    responseAggregate: sha256Json(orderedResponseHashInventory),
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

export async function executeBenchmarkV2({
  mode,
  freezeRoot,
  resultHistoryRootOverride = null,
  reservationStoreRootOverride = null,
  executionProfile,
  attemptCeiling,
  pricingProfile,
  consent,
  productRuntimeRoot = null,
  allowedEnvironment = null,
  syntheticHandler = null,
  faultPlan = null,
  onFreezeRead = () => {},
  clock = defaultClock
}) {
  assert.ok(Object.values(EXECUTION_MODE).includes(mode));
  assert.equal(mode === EXECUTION_MODE.SYNTHETIC_TEST_ONLY, typeof syntheticHandler === "function", "synthetic mode requires exactly one fixed mock handler function");
  if (mode === EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION) {
    assert.equal(syntheticHandler, null, "real execution cannot accept a mock or arbitrary handler");
    assert.equal(faultPlan, null, "real execution cannot accept synthetic fault injection");
    assert.ok(productRuntimeRoot, "real execution requires the pinned product runtime");
    const runtime = verifyDetachedProductRuntime(productRuntimeRoot);
    assert.equal(runtime.productRuntimeManifestHash, executionProfile.productRuntimeManifestHash);
  }
  const frozen = await loadPublicFreeze(freezeRoot, { onRead: onFreezeRead });
  validateExecutionProfile(executionProfile, {
    attemptCeiling,
    executorSourceHead: executionProfile.executorSourceHead,
    productRuntimeManifestHash: executionProfile.productRuntimeManifestHash
  });
  assertNoSecretMaterial(executionProfile, {
    knownEnvironment: allowedEnvironment?.secretValues || {},
    schemaValidatedRecordType: executionProfile.profileType
  });
  validatePricingProfile(pricingProfile, executionProfile);
  validateExecutionConsent(consent, {
    requiredStatus: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED,
    bindings: {
      benchmarkId: frozen.manifest.benchmarkId,
      candidateSetId: frozen.manifest.candidateSetId,
      productSourceHead: PRODUCT_SOURCE_HEAD,
      productSourceVersion: PRODUCT_SOURCE_VERSION,
      completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
      freezeManifestHash: frozen.manifest.freezeManifestHash,
      freezeReceiptHash: frozen.receipt.receiptHash,
      requestAggregateHash: frozen.manifest.requestAggregateHash,
      orderedRequestHashInventory: frozen.manifest.requestContractHashes,
      executionProfileHash: executionProfile.profileHash,
      pricingProfileHash: pricingProfile.pricingProfileHash,
      completePhysicalAttemptCeiling: attemptCeiling.categories.totalPhysicalAttempts,
      authorizedRequestCount: 26
    }
  });
  assert.equal(consent.executorSourceHead, executionProfile.executorSourceHead);
  assert.equal(consent.executorVersion, EXECUTOR_VERSION);
  const conservativePreRunMaximum = conservativeMaximumCost(attemptCeiling, pricingProfile, executionProfile.acquisitionProviderMode);
  assert.equal(consent.conservativeMaximumCost, conservativePreRunMaximum, "consent conservative cost differs from sealed pricing and attempt ceiling");

  const resultHistoryRoot = resolveResultHistoryRoot(mode, resultHistoryRootOverride);
  const resultRoot = deriveResultRoot(resultHistoryRoot, consent.resultId);
  assert.equal(consent.fixedResultRoot, `benchmarks/blind-object-v2-results/${consent.resultId}`);
  const reservationStoreRoot = reservationStoreRootOverride || path.join(resultHistoryRoot, ".reservations");
  if (mode === EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION) assert.equal(reservationStoreRoot, path.join(resultHistoryRoot, ".reservations"));
  const reservationScope = {
    invocationId: consent.invocationId,
    resultId: consent.resultId,
    consentHash: consent.consentHash,
    executionProfileHash: executionProfile.profileHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    requestAggregateHash: frozen.manifest.requestAggregateHash,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    executorSourceHead: executionProfile.executorSourceHead,
    executorVersion: EXECUTOR_VERSION,
    resultRoot: consent.fixedResultRoot,
    createdIdentity: `executor-${executionProfile.executorSourceHead.slice(0, 16)}`
  };
  let reservation = createInvocationReservation(reservationScope, clock());
  const createdReservation = await createExclusiveReservation(reservationStoreRoot, reservation);
  assert.equal(createdReservation.status, "CREATED", "execution requires a newly exclusive reservation; readback cannot start execution");
  const reservationFile = createdReservation.filePath;
  await createExclusiveResultRoot(resultHistoryRoot, consent.resultId);
  await writeResultFile(resultRoot, "execution-profile.json", executionProfile);
  await writeResultFile(resultRoot, "pricing-profile.json", pricingProfile);
  await writeResultFile(resultRoot, "execution-consent.json", consent);
  await writeResultFile(resultRoot, "invocation-reservation.json", reservation);
  let journal = createExecutionJournal({ invocationId: consent.invocationId, consentHash: consent.consentHash, requests: frozen.requests, nowIso: clock() });
  let ledger = createCostLedger({
    invocationId: consent.invocationId,
    consentHash: consent.consentHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    maximumAuthorizedCost: consent.maximumAuthorizedCost,
    conservativePreRunMaximum,
    requests: frozen.requests,
    nowIso: clock()
  });
  await writeResultFile(resultRoot, "execution-journal.json", journal);
  await writeResultFile(resultRoot, "cost-ledger.json", ledger);

  reservation = transitionReservation(reservation, RESERVATION_STATE.STARTED, clock(), "EXECUTION_SPINE_STARTED");
  await replaceReservation(reservationFile, reservation);
  consent = transitionConsent(consent, CONSENT_STATUS.CONSUMED, clock(), "INVOCATION_RESERVATION_STARTED");
  await persistMutableAuthorities(resultRoot, { consent, reservation, journal, ledger });

  const terminalRecords = [];
  let stopReason = "";
  let integrityFailureCount = 0;
  const perRequestWorstCase = conservativePreRunMaximum / 26;
  for (const [index, request] of frozen.requests.entries()) {
    assert.equal(request.analysisId, frozen.analysisPlan.analyses[index].analysisId, "execution order differs from canonical analysis plan");
    if (ledger.accruedEstimatedCost + ledger.reservedWorstCaseRemainingCost > ledger.maximumAuthorizedCost) {
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION, { at: clock(), reason: "COST_CEILING_STOP_BEFORE_SUBMISSION" });
      await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
      stopReason = "COST_CEILING_STOP_BEFORE_NEXT_UNSENT_REQUEST";
      integrityFailureCount += 1;
      break;
    }
    const submissionId = submissionIdentity(consent.invocationId, request);
    journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.SUBMISSION_INTENT_RECORDED, { at: clock(), reason: "DURABLE_SUBMISSION_INTENT", physicalSubmissionIdentity: submissionId });
    await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
    if (faultPlan?.beforeSubmissionStarted === request.analysisId) {
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION, { at: clock(), reason: "SYNTHETIC_INTERRUPTION_BEFORE_SUBMISSION_STARTED" });
      await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
      stopReason = "INTERRUPTED_BEFORE_SUBMISSION_STARTED";
      integrityFailureCount += 1;
      break;
    }
    journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.SUBMISSION_STARTED, { at: clock(), reason: "IMMEDIATELY_BEFORE_HANDLER_INVOCATION" });
    await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
    const startedAt = clock();
    const startedMs = Date.parse(startedAt);
    let handlerResult;
    let terminalState;
    let submissionState;
    let errorStage = "";
    let errorCategory = "";
    try {
      if (faultPlan?.afterSubmissionStarted === request.analysisId) throw Object.assign(new Error("synthetic ambiguous interruption"), { code: "synthetic_unknown_after_submission" });
      const preparedPhotos = mode === EXECUTION_MODE.SYNTHETIC_TEST_ONLY
        ? rawPreparedPhotos(request, frozen.assetCache)
        : await transformPhotosForProduct(request, frozen.assetCache);
      const body = handlerRequestBody(request, preparedPhotos);
      handlerResult = mode === EXECUTION_MODE.SYNTHETIC_TEST_ONLY
        ? await syntheticHandler(Object.freeze({ request, body, preparedPhotos, invocationId: consent.invocationId, submissionId }))
        : await invokePinnedProductHandler({
            runtimeRoot: productRuntimeRoot,
            requestBody: body,
            allowedEnvironment,
            correlationId: `ke-local-${sha256Json({ submissionId }).slice(0, 32)}`
          });
      assert.ok(handlerResult && Number.isInteger(handlerResult.statusCode), "handler terminal result is malformed");
      submissionState = REQUEST_STATE.TERMINAL;
      terminalState = handlerResult.statusCode >= 200 && handlerResult.statusCode < 400 ? "NORMAL_SUCCESS" : "PRODUCT_TERMINAL_FAILURE";
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.TERMINAL, { at: clock(), reason: terminalState });
    } catch (error) {
      submissionState = REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION;
      terminalState = "EXECUTION_INTEGRITY_UNKNOWN_AFTER_SUBMISSION";
      errorStage = "HANDLER_INVOCATION_AFTER_SUBMISSION_STARTED";
      errorCategory = String(error?.code || "unknown_after_submission").slice(0, 120);
      handlerResult = { statusCode: null, headers: {}, body: { error: "Submission may have reached the handler; replay is permanently prohibited.", code: errorCategory } };
      journal = transitionRequest(journal, request.analysisId, REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION, { at: clock(), reason: "AMBIGUOUS_AFTER_SUBMISSION_STARTED_NO_RETRY" });
      stopReason = "UNKNOWN_AFTER_SUBMISSION";
      integrityFailureCount += 1;
    }
    await writeResultFile(resultRoot, "execution-journal.json", journal, { replace: true });
    const telemetryAttempts = costAttemptsFromResponse(handlerResult.body);
    const costEntry = {
      estimationBasis: "CONSERVATIVE_PER_REQUEST_MAXIMUM_WHEN_PROVIDER_USAGE_IS_MISSING",
      estimatedCost: Number(perRequestWorstCase.toFixed(8)),
      providerTelemetryAttemptCount: telemetryAttempts.length
    };
    const remaining = Number(Math.max(0, conservativePreRunMaximum - perRequestWorstCase * (index + 1)).toFixed(8));
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
    const completedAt = clock();
    const terminal = createTerminalResult(terminalRecordInput({
      request,
      invocationId: consent.invocationId,
      consent,
      reservation,
      executionProfile,
      pricingProfile,
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
    terminalRecords.push(terminal);
    if (stopReason) break;
  }

  const submitted = journal.entries.filter((entry) => entry.physicalSubmissionIdentity && ![REQUEST_STATE.NOT_SUBMITTED, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION].includes(entry.state)).length;
  let resultState;
  if (submitted === 26 && terminalRecords.length === 26 && integrityFailureCount === 0) {
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
  const finalized = await finalizeResult({
    resultRoot,
    frozen,
    consent,
    reservation,
    journal,
    ledger,
    executionProfile,
    pricingProfile,
    terminalRecords,
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
    ...finalized,
    stopReason
  });
}

export async function verifyResultReadback({ resultRoot, freezeRoot, onFreezeRead = () => {} }) {
  const root = path.resolve(resultRoot);
  const filesBefore = await listResultFiles(root);
  const artifactInventory = classifyResultArtifactInventory(filesBefore);
  const [executionProfile, pricingProfile, consent, reservation, journal, ledger, manifest, validationReport] = await Promise.all([
    readJsonStrictFile(path.join(root, "execution-profile.json")),
    readJsonStrictFile(path.join(root, "pricing-profile.json")),
    readJsonStrictFile(path.join(root, "execution-consent.json")),
    readJsonStrictFile(path.join(root, "invocation-reservation.json")),
    readJsonStrictFile(path.join(root, "execution-journal.json")),
    readJsonStrictFile(path.join(root, "cost-ledger.json")),
    readJsonStrictFile(path.join(root, "unscored-result-manifest.json")),
    readJsonStrictFile(path.join(root, "validation-report.json"))
  ]);
  const frozen = await loadPublicFreeze(freezeRoot, { onRead: onFreezeRead });
  const attemptCeiling = calculateCompleteAttemptCeiling(frozen.requests);
  validateExecutionProfile(executionProfile, {
    attemptCeiling,
    executorSourceHead: executionProfile.executorSourceHead,
    productRuntimeManifestHash: executionProfile.productRuntimeManifestHash
  });
  validatePricingProfile(pricingProfile, executionProfile);
  validateUnscoredResultManifest(manifest);
  validateExecutionConsent(consent, {
    requiredStatus: CONSENT_STATUS.CONSUMED,
    bindings: {
      resultId: manifest.resultId,
      invocationId: manifest.invocationId,
      productSourceHead: manifest.productSourceHead,
      productSourceVersion: manifest.productSourceVersion,
      executorSourceHead: manifest.executorSourceHead,
      executorVersion: manifest.executorVersion,
      completeFrozenAggregateHash: manifest.completeFrozenAggregateHash,
      requestAggregateHash: manifest.requestAggregateHash,
      executionProfileHash: manifest.executionProfileHash,
      pricingProfileHash: manifest.pricingProfileHash
    }
  });
  validateInvocationReservation(reservation);
  validateExecutionJournal(journal, frozen.requests);
  validateCostLedger(ledger);
  validateUnscoredValidationReport(validationReport, { manifest });
  assert.equal(manifest.consentHash, consent.consentHash);
  assert.equal(manifest.reservationHash, reservation.reservationHash);
  assert.equal(manifest.invocationId, reservation.invocationId);
  assert.equal(manifest.resultId, reservation.resultId);
  assert.equal(manifest.productSourceHead, PRODUCT_SOURCE_HEAD);
  assert.equal(manifest.productSourceVersion, PRODUCT_SOURCE_VERSION);
  assert.equal(manifest.executorSourceHead, executionProfile.executorSourceHead);
  assert.equal(manifest.executorVersion, EXECUTOR_VERSION);
  assert.equal(manifest.executionProfileHash, executionProfile.profileHash);
  assert.equal(manifest.pricingProfileHash, pricingProfile.pricingProfileHash);
  assert.equal(manifest.costLedgerHash, ledger.ledgerHash);
  assert.equal(manifest.journalAggregate, journal.journalHash);
  assert.equal(manifest.completeFrozenAggregateHash, frozen.manifest.completeFrozenAggregateHash);
  assert.equal(manifest.requestAggregateHash, frozen.manifest.requestAggregateHash);
  const expectedArtifacts = expectedResultArtifactPaths(manifest.orderedResponseHashInventory.map((record) => record.analysisId));
  assert.deepEqual(artifactInventory.relativePaths, expectedArtifacts, "result tree differs from the repository-owned unscored layout");
  const terminalRecords = [];
  const terminalIds = new Set();
  for (const item of manifest.orderedResponseHashInventory) {
    assert.equal(terminalIds.has(item.analysisId), false, `duplicate terminal record ${item.analysisId}`);
    terminalIds.add(item.analysisId);
    const record = await readJsonStrictFile(path.join(root, "responses", `${item.analysisId}.json`));
    const request = frozen.requests.find((candidate) => candidate.analysisId === item.analysisId);
    assert.ok(request, `terminal response ${item.analysisId} does not bind a frozen request`);
    validateTerminalResult(record, { requestHash: request.requestContractHash, invocationId: manifest.invocationId, consentHash: manifest.consentHash, reservationHash: manifest.reservationHash });
    assert.equal(record.canonicalResponseHash, item.canonicalResponseHash);
    assert.equal(record.recordHash, item.recordHash);
    terminalRecords.push(record);
  }
  assert.equal(sha256Json(manifest.orderedResponseHashInventory), manifest.responseAggregate);
  const authorityPaths = [
    "execution-profile.json",
    "pricing-profile.json",
    "execution-consent.json",
    "invocation-reservation.json",
    "execution-journal.json",
    "cost-ledger.json",
    ...manifest.orderedResponseHashInventory.map((record) => `responses/${record.analysisId}.json`)
  ];
  const tree = await computeResultTreeAggregate(root, authorityPaths);
  assert.equal(tree.aggregate, manifest.resultTreeAggregate, "result tree aggregate mismatch");
  assert.deepEqual(tree.records, manifest.resultTreeRecords, "result tree record inventory mismatch");
  const replay = journal.entries.map(requestReplayDisposition);
  for (const disposition of replay.filter((entry) => entry.state === REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION || entry.state === REQUEST_STATE.TERMINAL)) assert.equal(disposition.resubmissionPermanentlyBlocked, true);
  const filesAfter = await listResultFiles(root);
  assert.deepEqual(filesAfter, filesBefore, "strict readback wrote or removed result files");
  return Object.freeze({
    valid: true,
    state: manifest.state,
    manifestHash: manifest.manifestHash,
    responseCount: terminalRecords.length,
    handlerInvocationCount: 0,
    providerAttemptCount: 0,
    fileWriteCount: 0,
    replayPlan: Object.freeze(replay)
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
    assert.deepEqual(preparedPhotos.map((photo) => photo.sourceSha256), request.inputAssets.map((asset) => asset.sha256));
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
