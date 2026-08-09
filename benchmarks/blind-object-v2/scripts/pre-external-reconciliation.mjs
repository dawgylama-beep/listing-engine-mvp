import assert from "node:assert/strict";
import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  PRE_EXTERNAL_TERMINAL_STATE,
  createTerminalFailureManifest,
  createTerminalFailureValidationReport,
  createZeroExternalSupersessionReceipt,
  validateTerminalFailureManifest,
  validateTerminalFailureValidationReport,
  validateZeroExternalSupersessionReceipt
} from "./pre-external-recovery-protocol.mjs";
import { sha256Json } from "./protocol.mjs";
import {
  benchmarkRoot,
  computeResultTreeAggregate,
  defaultResultHistoryRoot,
  readJsonStrictFile,
  writeResultFile
} from "./execution-store.mjs";

export const FIXED_FAILURE_AUTHORITY_PATH = path.join(benchmarkRoot, "pre-external-failure-authority.json");
export const FIXED_FAILURE_AUTHORITY_HASH = "084cea4676da753ce48a177472c36043f216802c9c97b9cc3a188b8abc17885d";
export const FIXED_FAILURE_APPEND_PATHS = Object.freeze([
  "zero-external-supersession-receipt.json",
  "terminal-failure-manifest.json",
  "terminal-failure-validation-report.json"
]);

const AUTHORITY_FIELDS = Object.freeze([
  "schemaVersion", "authorityType", "sourceExecutionReleaseRecordHash", "sourceExecutorVersion", "sourceResultRootName",
  "sourcePartialArtifactAggregate", "sourceJournalHash", "sourceLedgerHash", "sourceConsentId", "sourceConsentHash",
  "sourceInvocationId", "sourceReservationId", "sourceReservationHash", "sourceResultId", "sourceRequestId",
  "sourceSubmissionIdentity", "terminalState", "handlerAttemptCount", "providerAttemptCount",
  "physicalProviderAttemptCount", "actualProviderCost", "rootCause", "lifecycleEventOrder", "successorExecutorVersion",
  "originalArtifactRecords", "recordHash"
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function verifySeal(record, field, label) {
  const core = structuredClone(record);
  delete core[field];
  assert.equal(sha256Json(core), record[field], `${label} ${field} mismatch`);
}

async function exists(target) {
  try {
    await lstat(target);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export function validateFixedFailureAuthority(authority) {
  exactKeys(authority, AUTHORITY_FIELDS, "fixed pre-external failure authority");
  assert.equal(authority.schemaVersion, "1.0");
  assert.equal(authority.authorityType, "FIXED_VERSION_1_12_20_PRE_EXTERNAL_FAILURE_RECONCILIATION");
  assert.equal(authority.sourceExecutionReleaseRecordHash, "22392eabae6e305ecd043ead4edae52bf88a4328b940215023835ab23e68abaf");
  assert.equal(authority.sourceExecutorVersion, "1.12.20");
  assert.equal(authority.sourceResultRootName, "result-root-b912b16dae9e822f1076257815bd2e1a7d8cece05afe18e9");
  assert.equal(authority.sourcePartialArtifactAggregate, "788b7bf4117ff2b33eae85de3b1a3288878a26c41752af12f0f10c82e3117ddf");
  assert.equal(authority.sourceJournalHash, "28c51aaa5a2b27d52c347710cbe4cf859f284518e1a6c2a9947ec89e135b0b98");
  assert.equal(authority.sourceLedgerHash, "f562f8e97b8591bac11efd40127243d15697192ef363840cb86c95918b8dce0f");
  assert.equal(authority.sourceRequestId, "V2-RUN-001");
  assert.equal(authority.terminalState, PRE_EXTERNAL_TERMINAL_STATE);
  assert.equal(authority.successorExecutorVersion, "1.12.21");
  for (const field of ["handlerAttemptCount", "providerAttemptCount", "physicalProviderAttemptCount", "actualProviderCost"]) assert.equal(authority[field], 0);
  assert.deepEqual(authority.lifecycleEventOrder, [
    "PAGE_EVALUATE_PROMISE_CREATED", "FINALLY_ENTERED", "BROWSER_CLOSE_CALLED", "PAGE_CLOSED",
    "PAGE_EVALUATE_REJECTED", "CONTEXT_CLOSED", "BROWSER_DISCONNECTED", "BROWSER_CLOSE_RESOLVED"
  ]);
  assert.equal(authority.originalArtifactRecords.length, 8);
  verifySeal(authority, "recordHash", "fixed failure authority");
  assert.equal(authority.recordHash, FIXED_FAILURE_AUTHORITY_HASH);
  return Object.freeze({ valid: true, recordHash: authority.recordHash });
}

export async function loadFixedFailureAuthority() {
  const authority = JSON.parse(await readFile(FIXED_FAILURE_AUTHORITY_PATH, "utf8"));
  validateFixedFailureAuthority(authority);
  return Object.freeze(authority);
}

function validateLegacyConsent(consent, authority) {
  assert.equal(consent.schemaVersion, "4.0");
  assert.equal(consent.executorVersion, "1.12.20");
  assert.equal(consent.consentId, authority.sourceConsentId);
  assert.equal(consent.consentHash, authority.sourceConsentHash);
  assert.equal(consent.invocationId, authority.sourceInvocationId);
  assert.equal(consent.reservationId, authority.sourceReservationId);
  assert.equal(consent.resultId, authority.sourceResultId);
  assert.equal(consent.resultRootName, authority.sourceResultRootName);
  assert.equal(consent.statusJournalHash, sha256Json(consent.statusTransitions));
  const immutable = structuredClone(consent);
  for (const field of ["status", "statusTransitions", "statusJournalHash", "consentHash", "receiptHash"]) delete immutable[field];
  assert.equal(sha256Json(immutable), consent.consentHash, "legacy consent immutable hash mismatch");
  verifySeal(consent, "receiptHash", "legacy consent");
}

function validateLegacyReservation(reservation, authority) {
  assert.equal(reservation.schemaVersion, "1.0");
  assert.equal(reservation.executorVersion, "1.12.20");
  assert.equal(reservation.invocationId, authority.sourceInvocationId);
  assert.equal(reservation.reservationId, authority.sourceReservationId);
  assert.equal(reservation.reservationHash, authority.sourceReservationHash);
  assert.equal(reservation.state, "STARTED");
  assert.equal(reservation.transitionJournalHash, sha256Json(reservation.transitions));
  const immutable = structuredClone(reservation);
  for (const field of ["state", "transitions", "transitionJournalHash", "reservationHash", "recordHash"]) delete immutable[field];
  assert.equal(sha256Json(immutable), reservation.reservationHash, "legacy reservation immutable hash mismatch");
  verifySeal(reservation, "recordHash", "legacy reservation");
}

async function inspectOriginalEvidence(authority) {
  const resultRoot = path.join(defaultResultHistoryRoot, authority.sourceResultRootName);
  const originalPaths = authority.originalArtifactRecords.map((record) => record.relativePath);
  const tree = await computeResultTreeAggregate(resultRoot, originalPaths);
  assert.equal(tree.aggregate, authority.sourcePartialArtifactAggregate, "failed-root original partial aggregate differs");
  assert.deepEqual(tree.records, authority.originalArtifactRecords, "failed-root original artifact bytes differ");
  const [launchScope, resultConsent, canonicalConsent, reservation, externalReservation, journal, ledger] = await Promise.all([
    readJsonStrictFile(path.join(resultRoot, "launch-scope.json")),
    readJsonStrictFile(path.join(resultRoot, "execution-consent.json")),
    readJsonStrictFile(path.join(benchmarkRoot, "consent", `${authority.sourceConsentId}.json`)),
    readJsonStrictFile(path.join(resultRoot, "invocation-reservation.json")),
    readJsonStrictFile(path.join(defaultResultHistoryRoot, ".reservations", `${authority.sourceInvocationId}.json`)),
    readJsonStrictFile(path.join(resultRoot, "execution-journal.json")),
    readJsonStrictFile(path.join(resultRoot, "cost-ledger.json"))
  ]);
  assert.equal(launchScope.executionReleaseRecordHash, authority.sourceExecutionReleaseRecordHash);
  assert.equal(launchScope.executorVersion, authority.sourceExecutorVersion);
  validateLegacyConsent(resultConsent, authority);
  validateLegacyConsent(canonicalConsent, authority);
  assert.equal(resultConsent.status, "CONSUMED");
  assert.equal(canonicalConsent.status, "AUTHORIZED_NOT_CONSUMED");
  validateLegacyReservation(reservation, authority);
  validateLegacyReservation(externalReservation, authority);
  assert.deepEqual(externalReservation, reservation, "legacy reservation store and result-root copies differ");
  assert.equal(journal.journalHash, authority.sourceJournalHash);
  verifySeal(journal, "journalHash", "legacy execution journal");
  const first = journal.entries[0];
  assert.equal(first.analysisId, authority.sourceRequestId);
  assert.equal(first.state, "SUBMISSION_STARTED");
  assert.equal(first.physicalSubmissionIdentity, authority.sourceSubmissionIdentity);
  assert.equal(first.transitions.at(-1).reason, "IMMEDIATELY_BEFORE_HANDLER_INVOCATION");
  assert.equal(journal.entries.slice(1).every((entry) => entry.state === "NOT_SUBMITTED" && entry.physicalSubmissionIdentity === null), true);
  assert.equal(ledger.ledgerHash, authority.sourceLedgerHash);
  verifySeal(ledger, "ledgerHash", "legacy cost ledger");
  assert.equal(ledger.actualCalculatedCost, 0);
  assert.equal(ledger.accruedEstimatedCost, 0);
  assert.deepEqual(ledger.actualProviderReportedUsage, []);
  assert.deepEqual(ledger.perAttemptCostRecords, []);
  assert.equal(ledger.perRequestCostRecords.every((record) => record.attemptCount === 0), true);
  const responses = await readdir(path.join(resultRoot, "responses"));
  assert.deepEqual(responses, [], "legacy failed root contains an unexpected response");
  return Object.freeze({ resultRoot, originalPaths, tree, launchScope, resultConsent, canonicalConsent, reservation, journal, ledger });
}

function validateSuccessorRelease(authority, releaseIdentity) {
  assert.equal(releaseIdentity?.executorVersion, "1.12.21");
  assert.equal(releaseIdentity?.release?.preExternalFailureAuthorityHash, authority.recordHash, "qualified release does not bind the fixed failure authority");
  assert.equal(releaseIdentity.release.authorityDeclarations.preExternalReconciliationEnabled, true);
  assert.equal(releaseIdentity.release.authorityDeclarations.zeroExternalSupersessionEnabled, true);
}

export async function reconcileFixedV11220Failure({ releaseIdentity, nowIso = new Date().toISOString() }) {
  const authority = await loadFixedFailureAuthority();
  validateSuccessorRelease(authority, releaseIdentity);
  const evidence = await inspectOriginalEvidence(authority);
  for (const relativePath of FIXED_FAILURE_APPEND_PATHS) {
    assert.equal(await exists(path.join(evidence.resultRoot, relativePath)), false, `fixed failure reconciliation already exists: ${relativePath}`);
  }
  const receipt = createZeroExternalSupersessionReceipt({
    failureAuthorityHash: authority.recordHash,
    sourceExecutionReleaseRecordHash: authority.sourceExecutionReleaseRecordHash,
    sourceExecutorVersion: authority.sourceExecutorVersion,
    sourceResultRootName: authority.sourceResultRootName,
    sourcePartialArtifactAggregate: authority.sourcePartialArtifactAggregate,
    sourceJournalHash: authority.sourceJournalHash,
    sourceLedgerHash: authority.sourceLedgerHash,
    sourceConsentHash: authority.sourceConsentHash,
    sourceReservationHash: authority.sourceReservationHash,
    supersededConsentId: authority.sourceConsentId,
    supersededInvocationId: authority.sourceInvocationId,
    supersededReservationId: authority.sourceReservationId,
    supersededResultId: authority.sourceResultId,
    supersededRequestId: authority.sourceRequestId,
    sourceSubmissionIdentity: authority.sourceSubmissionIdentity,
    successorExecutionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash,
    successorExecutorRuntimeHead: releaseIdentity.executorRuntimeHead,
    successorQualificationHead: releaseIdentity.qualificationHead,
    successorExecutorVersion: releaseIdentity.executorVersion,
    handlerAttemptCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    terminalState: PRE_EXTERNAL_TERMINAL_STATE,
    effectiveConsentStatus: "CONSUMED",
    effectiveInvocationStatus: "CLOSED_PRE_HANDLER_ZERO_SPEND",
    effectiveReservationStatus: "CLOSED_ZERO_SPEND",
    sourceSubmissionIdentityStatus: "TERMINAL_NON_REUSABLE_SUPERSEDED_ONCE",
    originalArtifactRecords: authority.originalArtifactRecords,
    createdAt: nowIso
  });
  await writeResultFile(evidence.resultRoot, FIXED_FAILURE_APPEND_PATHS[0], receipt);
  const failureTree = await computeResultTreeAggregate(evidence.resultRoot, [...evidence.originalPaths, FIXED_FAILURE_APPEND_PATHS[0]]);
  const manifest = createTerminalFailureManifest({
    failureClassification: PRE_EXTERNAL_TERMINAL_STATE,
    launchScopeHash: evidence.launchScope.launchScopeHash,
    resultId: authority.sourceResultId,
    resultRootName: authority.sourceResultRootName,
    invocationId: authority.sourceInvocationId,
    consentHash: authority.sourceConsentHash,
    reservationHash: authority.sourceReservationHash,
    executionReleaseRecordHash: authority.sourceExecutionReleaseRecordHash,
    executorVersion: authority.sourceExecutorVersion,
    completeFrozenAggregateHash: evidence.launchScope.completeFrozenAggregateHash,
    requestId: authority.sourceRequestId,
    originalPartialArtifactAggregate: authority.sourcePartialArtifactAggregate,
    failureEvidenceAggregate: failureTree.aggregate,
    zeroExternalSupersessionReceiptId: receipt.receiptId,
    zeroExternalSupersessionReceiptHash: receipt.receiptHash,
    handlerAttemptCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    requestedCount: 26,
    preExternalAbortCount: 1,
    notExternallySubmittedCount: 26,
    effectiveConsentStatus: "CONSUMED",
    resultRootConsentStatus: "CONSUMED",
    effectiveReservationStatus: "CLOSED_ZERO_SPEND",
    journalEffectiveState: "LEGACY_SUBMISSION_STARTED_SUPERSEDED_ZERO_EXTERNAL_ACTIVITY",
    originalArtifactsByteIdentical: true,
    privateControlsLoaded: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    state: PRE_EXTERNAL_TERMINAL_STATE
  });
  await writeResultFile(evidence.resultRoot, FIXED_FAILURE_APPEND_PATHS[1], manifest);
  const validation = createTerminalFailureValidationReport({
    resultId: authority.sourceResultId,
    manifestHash: manifest.manifestHash,
    state: manifest.state,
    validatedAt: nowIso,
    originalArtifactsByteIdentical: true,
    effectiveCanonicalConsentStatus: "CONSUMED",
    resultRootConsentStatus: "CONSUMED",
    effectiveReservationStatus: "CLOSED_ZERO_SPEND",
    journalEffectiveState: "LEGACY_SUBMISSION_STARTED_SUPERSEDED_ZERO_EXTERNAL_ACTIVITY",
    handlerAttemptCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    privateControlsLoaded: false,
    scoringPerformed: false,
    reflectionPerformed: false,
    repairPerformed: false
  });
  await writeResultFile(evidence.resultRoot, FIXED_FAILURE_APPEND_PATHS[2], validation);
  return verifyFixedFailureReconciliation({ releaseIdentity });
}

export async function verifyFixedFailureReconciliation({ releaseIdentity }) {
  const authority = await loadFixedFailureAuthority();
  validateSuccessorRelease(authority, releaseIdentity);
  const evidence = await inspectOriginalEvidence(authority);
  const [receipt, manifest, validation] = await Promise.all(FIXED_FAILURE_APPEND_PATHS.map((relativePath) => readJsonStrictFile(path.join(evidence.resultRoot, relativePath))));
  validateZeroExternalSupersessionReceipt(receipt, {
    failureAuthorityHash: authority.recordHash,
    successorExecutionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash,
    successorExecutorRuntimeHead: releaseIdentity.executorRuntimeHead,
    successorQualificationHead: releaseIdentity.qualificationHead,
    successorExecutorVersion: releaseIdentity.executorVersion
  });
  const failureTree = await computeResultTreeAggregate(evidence.resultRoot, [...evidence.originalPaths, FIXED_FAILURE_APPEND_PATHS[0]]);
  validateTerminalFailureManifest(manifest);
  assert.equal(manifest.failureEvidenceAggregate, failureTree.aggregate);
  assert.equal(manifest.zeroExternalSupersessionReceiptHash, receipt.receiptHash);
  validateTerminalFailureValidationReport(validation, manifest);
  const fullTree = await computeResultTreeAggregate(evidence.resultRoot, [...evidence.originalPaths, ...FIXED_FAILURE_APPEND_PATHS]);
  return Object.freeze({
    disposition: "VERSION_1_12_20_FAILURE_RECONCILED_SEALED",
    terminalState: manifest.state,
    failedResultRoot: `benchmarks/blind-object-v2-results/${authority.sourceResultRootName}`,
    originalPartialArtifactAggregate: evidence.tree.aggregate,
    failureEvidenceAggregate: failureTree.aggregate,
    terminalFailureTreeAggregate: fullTree.aggregate,
    originalArtifactsByteIdentical: true,
    effectiveConsentStatus: manifest.effectiveConsentStatus,
    effectiveReservationStatus: manifest.effectiveReservationStatus,
    supersessionReceiptId: receipt.receiptId,
    supersessionReceiptHash: receipt.receiptHash,
    terminalFailureManifestHash: manifest.manifestHash,
    terminalFailureValidationHash: validation.validationHash,
    handlerAttemptCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    receipt
  });
}

export async function loadFixedZeroExternalSupersessionReceipt(releaseIdentity) {
  const readback = await verifyFixedFailureReconciliation({ releaseIdentity });
  return readback.receipt;
}
