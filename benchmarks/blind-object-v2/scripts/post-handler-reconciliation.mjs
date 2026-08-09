import assert from "node:assert/strict";
import { lstat, readFile, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  RECONCILED_POST_HANDLER_STATE,
  createReconciledFailureManifest,
  createReconciledFailureValidation,
  createReservationClosureReceipt,
  createTerminalFailureReceipt,
  validateReconciledFailureManifest,
  validateReconciledFailureValidation,
  validateReservationClosureReceipt,
  validateTerminalFailureReceipt
} from "./post-handler-reconciliation-protocol.mjs";
import { validateCostLedger, validateExecutionJournal } from "./execution-protocol.mjs";
import { sha256Json } from "./protocol.mjs";
import {
  benchmarkRoot,
  computeResultTreeAggregate,
  defaultResultHistoryRoot,
  readJsonStrictFile,
  writeResultFile
} from "./execution-store.mjs";

export const FIXED_POST_HANDLER_AUTHORITY_PATH = path.join(benchmarkRoot, "post-handler-failure-authority.json");
export const FIXED_POST_HANDLER_AUTHORITY_HASH = "915089ed141f32dd38530df9ee1bd89288aa7bb4a2e5b2abe8cf4f96a24202b7";
export const FIXED_POST_HANDLER_APPEND_PATHS = Object.freeze([
  "post-handler-reconciliation-receipt.json",
  "reservation-closure-receipt.json",
  "terminal-failure-manifest.json",
  "terminal-failure-validation-report.json"
]);

async function exists(target) {
  try { await lstat(target); return true; } catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

function verifySeal(record, field, label) {
  const core = structuredClone(record); delete core[field];
  assert.equal(sha256Json(core), record[field], `${label} ${field} mismatch`);
}

export function validateFixedPostHandlerAuthority(authority) {
  assert.equal(authority.schemaVersion, "1.0");
  assert.equal(authority.authorityType, "FIXED_VERSION_1_12_21_POST_HANDLER_FAILURE_RECONCILIATION");
  assert.equal(authority.sourceExecutionReleaseRecordHash, "ed569a1af04bb87e1de1ae4c32eb02719f84bd1b1e861cb55611b28e43ad7013");
  assert.equal(authority.sourceExecutorVersion, "1.12.21");
  assert.equal(authority.sourceResultRootName, "result-root-f65ebb9d361c4977ac76755f8c7059375ae6d8d3fb4b0464");
  assert.equal(authority.sourcePartialArtifactAggregate, "9a837c740e2d47d6d0febd721dc16237e2934bc697f0a840223449862ce2ec7b");
  assert.equal(authority.sourceJournalHash, "37779ddf0e14b526db1b47959663916235d0ce3078e0b48b86c09590ee5bda1c");
  assert.equal(authority.sourceLedgerHash, "344bb67499b060e157f7454af1a4101ba4babbbc96d6155aa4b88daf0016399c");
  assert.equal(authority.sourceRequestId, "V2-RUN-001");
  assert.equal(authority.handlerOutcome, "NORMAL_SUCCESS");
  assert.equal(authority.handlerInvocationCount, 1);
  assert.equal(authority.providerAttemptCount, 9);
  assert.equal(authority.physicalProviderAttemptCount, 9);
  assert.equal(authority.providerReportedUsageRecordCount, 0);
  assert.equal(authority.actualBilledCostStatus, "UNKNOWN");
  assert.equal(authority.conservativeAccountedCost, 1.50682355);
  assert.equal(authority.sanitizerRejectedPath, "$.experienceRecord.sourcesAccepted[0].evidenceId");
  assert.equal(authority.handlerResultBytesStatus, "NOT_DURABLY_CAPTURED");
  assert.equal(authority.publicResponseArtifactStatus, "ABSENT");
  assert.equal(authority.successfulManifestStatus, "ABSENT");
  assert.equal(authority.successorExecutorVersion, "1.12.22");
  assert.equal(authority.originalArtifactRecords.length, 8);
  verifySeal(authority, "recordHash", "fixed post-handler authority");
  assert.equal(authority.recordHash, FIXED_POST_HANDLER_AUTHORITY_HASH);
  return Object.freeze({ valid: true, recordHash: authority.recordHash });
}

export async function loadFixedPostHandlerAuthority() {
  const authority = JSON.parse(await readFile(FIXED_POST_HANDLER_AUTHORITY_PATH, "utf8"));
  validateFixedPostHandlerAuthority(authority);
  return Object.freeze(authority);
}

function validateLegacyConsent(consent, authority) {
  assert.equal(consent.schemaVersion, "4.0");
  assert.equal(consent.executorVersion, authority.sourceExecutorVersion);
  assert.equal(consent.consentId, authority.sourceConsentId);
  assert.equal(consent.consentHash, authority.sourceConsentHash);
  assert.equal(consent.receiptHash, authority.sourceConsentReceiptHash);
  assert.equal(consent.invocationId, authority.sourceInvocationId);
  assert.equal(consent.reservationId, authority.sourceReservationId);
  assert.equal(consent.resultId, authority.sourceResultId);
  assert.equal(consent.resultRootName, authority.sourceResultRootName);
  assert.equal(consent.status, "CONSUMED");
  assert.equal(consent.statusJournalHash, sha256Json(consent.statusTransitions));
  const immutable = structuredClone(consent);
  for (const field of ["status", "statusTransitions", "statusJournalHash", "consentHash", "receiptHash"]) delete immutable[field];
  assert.equal(sha256Json(immutable), consent.consentHash);
  verifySeal(consent, "receiptHash", "legacy consent");
}

function validateLegacyReservation(reservation, authority) {
  assert.equal(reservation.schemaVersion, "1.1");
  assert.equal(reservation.executorVersion, authority.sourceExecutorVersion);
  assert.equal(reservation.invocationId, authority.sourceInvocationId);
  assert.equal(reservation.reservationId, authority.sourceReservationId);
  assert.equal(reservation.reservationHash, authority.sourceReservationHash);
  assert.equal(reservation.recordHash, authority.sourceReservationRecordHash);
  assert.equal(reservation.state, "STARTED");
  assert.equal(reservation.transitionJournalHash, sha256Json(reservation.transitions));
  verifySeal(reservation, "recordHash", "legacy reservation");
}

function resolveResultHistoryRootForReconciliation(testOnlyResultHistoryRoot) {
  if (testOnlyResultHistoryRoot === null) return defaultResultHistoryRoot;
  const root = path.resolve(testOnlyResultHistoryRoot);
  const temporaryRoot = path.resolve(os.tmpdir());
  const relative = path.relative(temporaryRoot, root);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "test-only reconciliation root must remain under the operating-system temporary directory");
  return root;
}

async function inspectOriginalEvidence(authority, resultHistoryRoot = defaultResultHistoryRoot) {
  const resultRoot = path.join(resultHistoryRoot, authority.sourceResultRootName);
  const selectedBenchmarkRoot = resultHistoryRoot === defaultResultHistoryRoot
    ? benchmarkRoot
    : path.join(path.dirname(resultHistoryRoot), "blind-object-v2");
  const originalPaths = authority.originalArtifactRecords.map((record) => record.relativePath);
  const tree = await computeResultTreeAggregate(resultRoot, originalPaths);
  assert.equal(tree.aggregate, authority.sourcePartialArtifactAggregate, "Version 1.12.21 partial aggregate differs");
  assert.deepEqual(tree.records, authority.originalArtifactRecords, "Version 1.12.21 original artifact bytes differ");
  const [launchScope, resultConsent, canonicalConsent, reservation, externalReservation, journal, ledger] = await Promise.all([
    readJsonStrictFile(path.join(resultRoot, "launch-scope.json")),
    readJsonStrictFile(path.join(resultRoot, "execution-consent.json")),
    readJsonStrictFile(path.join(selectedBenchmarkRoot, "consent", `${authority.sourceConsentId}.json`)),
    readJsonStrictFile(path.join(resultRoot, "invocation-reservation.json")),
    readJsonStrictFile(path.join(resultHistoryRoot, ".reservations", `${authority.sourceInvocationId}.json`)),
    readJsonStrictFile(path.join(resultRoot, "execution-journal.json")),
    readJsonStrictFile(path.join(resultRoot, "cost-ledger.json"))
  ]);
  assert.equal(launchScope.executionReleaseRecordHash, authority.sourceExecutionReleaseRecordHash);
  assert.equal(launchScope.executorVersion, authority.sourceExecutorVersion);
  validateLegacyConsent(resultConsent, authority);
  validateLegacyConsent(canonicalConsent, authority);
  assert.deepEqual(canonicalConsent, resultConsent);
  validateLegacyReservation(reservation, authority);
  validateLegacyReservation(externalReservation, authority);
  assert.deepEqual(externalReservation, reservation);
  validateExecutionJournal(journal);
  assert.equal(journal.journalHash, authority.sourceJournalHash);
  const first = journal.entries[0];
  assert.equal(first.analysisId, authority.sourceRequestId);
  assert.equal(first.state, "TERMINAL");
  assert.equal(first.physicalSubmissionIdentity, authority.sourceSubmissionIdentity);
  assert.equal(first.transitions.at(-1).reason, authority.handlerOutcome);
  assert.equal(journal.entries.slice(1).every((entry) => entry.state === "NOT_SUBMITTED" && entry.physicalSubmissionIdentity === null), true);
  validateCostLedger(ledger);
  assert.equal(ledger.ledgerHash, authority.sourceLedgerHash);
  assert.equal(ledger.actualCalculatedCost, authority.conservativeAccountedCost);
  assert.equal(ledger.accruedEstimatedCost, authority.conservativeAccountedCost);
  assert.equal(ledger.actualProviderReportedUsage.length, 0);
  assert.equal(ledger.perAttemptCostRecords.length, 9);
  assert.equal(ledger.perRequestCostRecords[0].attemptCount, 9);
  assert.deepEqual(await readdir(path.join(resultRoot, "responses")), []);
  assert.equal(await exists(path.join(resultRoot, "unscored-result-manifest.json")), false);
  return Object.freeze({ resultRoot, originalPaths, tree, launchScope, resultConsent, reservation, journal, ledger });
}

function validateSuccessorRelease(authority, releaseIdentity) {
  assert.equal(releaseIdentity?.executorVersion, "1.12.22");
  assert.equal(releaseIdentity?.release?.postHandlerFailureAuthorityHash, authority.recordHash);
  assert.equal(releaseIdentity.release.authorityDeclarations.postHandlerReconciliationEnabled, true);
}

function validateReadbackRelease(authority, releaseIdentity) {
  if (!releaseIdentity) return;
  assert.equal(releaseIdentity.release?.postHandlerFailureAuthorityHash, authority.recordHash);
  if (releaseIdentity.executorVersion === "1.12.22") return validateSuccessorRelease(authority, releaseIdentity);
  assert.ok(["1.12.23", "1.12.24"].includes(releaseIdentity.executorVersion));
  assert.equal(releaseIdentity.release.predecessorExecutionReleaseRecordHash, releaseIdentity.executorVersion === "1.12.23"
    ? "a80e7e763bb15ff399392be4c3a9cebbd4fb9a7b85622a9c14e4653742473294"
    : "f1074a67e5898493a2c5b4022ae2157635f653fdafe093be64cd4593a7867558");
}

export async function reconcileFixedV11221Failure({ releaseIdentity, nowIso = new Date().toISOString(), testOnlyResultHistoryRoot = null }) {
  const authority = await loadFixedPostHandlerAuthority();
  validateSuccessorRelease(authority, releaseIdentity);
  const resultHistoryRoot = resolveResultHistoryRootForReconciliation(testOnlyResultHistoryRoot);
  const evidence = await inspectOriginalEvidence(authority, resultHistoryRoot);
  for (const relativePath of FIXED_POST_HANDLER_APPEND_PATHS) {
    assert.equal(await exists(path.join(evidence.resultRoot, relativePath)), false, `Version 1.12.21 reconciliation already exists: ${relativePath}`);
  }
  const receipt = createTerminalFailureReceipt({
    failureAuthorityHash: authority.recordHash,
    sourceExecutionReleaseRecordHash: authority.sourceExecutionReleaseRecordHash,
    sourceExecutorVersion: authority.sourceExecutorVersion,
    sourceResultRootName: authority.sourceResultRootName,
    sourcePartialArtifactAggregate: authority.sourcePartialArtifactAggregate,
    sourceJournalHash: authority.sourceJournalHash,
    sourceLedgerHash: authority.sourceLedgerHash,
    sourceConsentId: authority.sourceConsentId,
    sourceConsentHash: authority.sourceConsentHash,
    sourceInvocationId: authority.sourceInvocationId,
    sourceReservationId: authority.sourceReservationId,
    sourceReservationHash: authority.sourceReservationHash,
    sourceResultId: authority.sourceResultId,
    sourceRequestId: authority.sourceRequestId,
    sourceSubmissionIdentity: authority.sourceSubmissionIdentity,
    handlerOutcome: authority.handlerOutcome,
    handlerInvocationCount: authority.handlerInvocationCount,
    providerAttemptCount: authority.providerAttemptCount,
    physicalProviderAttemptCount: authority.physicalProviderAttemptCount,
    providerReportedUsageRecordCount: authority.providerReportedUsageRecordCount,
    actualBilledCostStatus: authority.actualBilledCostStatus,
    conservativeAccountedCost: authority.conservativeAccountedCost,
    handlerResultBytesStatus: authority.handlerResultBytesStatus,
    publicResponseArtifactStatus: authority.publicResponseArtifactStatus,
    successfulManifestStatus: authority.successfulManifestStatus,
    terminalState: RECONCILED_POST_HANDLER_STATE,
    replayPermitted: false,
    effectiveConsentStatus: "CONSUMED",
    effectiveInvocationStatus: "TERMINAL_FAILED",
    effectiveReservationStatus: "CLOSED_CONSERVATIVE_COST_ACCOUNTED",
    successorExecutionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash,
    successorExecutorRuntimeHead: releaseIdentity.executorRuntimeHead,
    successorQualificationHead: releaseIdentity.qualificationHead,
    successorExecutorVersion: releaseIdentity.executorVersion,
    createdAt: nowIso
  });
  await writeResultFile(evidence.resultRoot, FIXED_POST_HANDLER_APPEND_PATHS[0], receipt);
  const closure = createReservationClosureReceipt({
    terminalFailureReceiptId: receipt.receiptId,
    terminalFailureReceiptHash: receipt.receiptHash,
    sourceInvocationId: authority.sourceInvocationId,
    sourceReservationId: authority.sourceReservationId,
    sourceReservationHash: authority.sourceReservationHash,
    sourceReservationRecordHash: authority.sourceReservationRecordHash,
    fromState: "STARTED",
    effectiveState: "CLOSED_CONSERVATIVE_COST_ACCOUNTED",
    conservativeAccountedCost: authority.conservativeAccountedCost,
    actualBilledCostStatus: "UNKNOWN",
    physicalProviderAttemptCount: 9,
    closedAt: nowIso
  });
  await writeResultFile(evidence.resultRoot, FIXED_POST_HANDLER_APPEND_PATHS[1], closure);
  const failureTree = await computeResultTreeAggregate(evidence.resultRoot, [...evidence.originalPaths, ...FIXED_POST_HANDLER_APPEND_PATHS.slice(0, 2)]);
  const manifest = createReconciledFailureManifest({
    terminalFailureReceiptId: receipt.receiptId,
    terminalFailureReceiptHash: receipt.receiptHash,
    reservationClosureId: closure.closureId,
    reservationClosureHash: closure.closureHash,
    sourceExecutionReleaseRecordHash: authority.sourceExecutionReleaseRecordHash,
    sourceExecutorVersion: authority.sourceExecutorVersion,
    sourceResultRootName: authority.sourceResultRootName,
    sourcePartialArtifactAggregate: authority.sourcePartialArtifactAggregate,
    sourceJournalHash: authority.sourceJournalHash,
    sourceLedgerHash: authority.sourceLedgerHash,
    sourceConsentHash: authority.sourceConsentHash,
    sourceInvocationId: authority.sourceInvocationId,
    sourceReservationHash: authority.sourceReservationHash,
    sourceResultId: authority.sourceResultId,
    sourceRequestId: authority.sourceRequestId,
    handlerOutcome: authority.handlerOutcome,
    handlerInvocationCount: 1,
    providerAttemptCount: 9,
    physicalProviderAttemptCount: 9,
    providerReportedUsageRecordCount: 0,
    conservativeAccountedCost: authority.conservativeAccountedCost,
    actualBilledCostStatus: "UNKNOWN",
    publicResponseArtifactCommitted: false,
    successfulManifestPresent: false,
    replayPermitted: false,
    failureEvidenceAggregate: failureTree.aggregate,
    originalArtifactsByteIdentical: true,
    effectiveConsentStatus: "CONSUMED",
    effectiveInvocationStatus: "TERMINAL_FAILED",
    effectiveReservationStatus: "CLOSED_CONSERVATIVE_COST_ACCOUNTED",
    privateControlsLoaded: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    state: RECONCILED_POST_HANDLER_STATE
  });
  await writeResultFile(evidence.resultRoot, FIXED_POST_HANDLER_APPEND_PATHS[2], manifest);
  const validation = createReconciledFailureValidation({
    terminalFailureReceiptHash: receipt.receiptHash,
    reservationClosureHash: closure.closureHash,
    manifestHash: manifest.manifestHash,
    state: manifest.state,
    validatedAt: nowIso,
    originalArtifactsByteIdentical: true,
    effectiveConsentStatus: "CONSUMED",
    effectiveInvocationStatus: "TERMINAL_FAILED",
    effectiveReservationStatus: "CLOSED_CONSERVATIVE_COST_ACCOUNTED",
    handlerInvocationCount: 1,
    providerAttemptCount: 9,
    physicalProviderAttemptCount: 9,
    providerReportedUsageRecordCount: 0,
    conservativeAccountedCost: authority.conservativeAccountedCost,
    actualBilledCostStatus: "UNKNOWN",
    publicResponseArtifactCommitted: false,
    successfulManifestPresent: false,
    replayPermitted: false,
    privateControlsLoaded: false,
    scoringPerformed: false,
    reflectionPerformed: false,
    repairPerformed: false
  });
  await writeResultFile(evidence.resultRoot, FIXED_POST_HANDLER_APPEND_PATHS[3], validation);
  return verifyFixedV11221Reconciliation({ releaseIdentity, testOnlyResultHistoryRoot });
}

export async function verifyFixedV11221Reconciliation({ releaseIdentity, testOnlyResultHistoryRoot = null }) {
  const authority = await loadFixedPostHandlerAuthority();
  validateReadbackRelease(authority, releaseIdentity);
  const resultHistoryRoot = resolveResultHistoryRootForReconciliation(testOnlyResultHistoryRoot);
  const evidence = await inspectOriginalEvidence(authority, resultHistoryRoot);
  const [receipt, closure, manifest, validation] = await Promise.all(FIXED_POST_HANDLER_APPEND_PATHS.map((relativePath) => readJsonStrictFile(path.join(evidence.resultRoot, relativePath))));
  const fixedSuccessor = releaseIdentity?.executorVersion === "1.12.22" ? releaseIdentity : {
    executionReleaseRecordHash: "a80e7e763bb15ff399392be4c3a9cebbd4fb9a7b85622a9c14e4653742473294",
    executorRuntimeHead: "5ac7b85ee8f3888ccda1d4725c0eebfa5d8b1f62",
    qualificationHead: "acf1b356bb851f41aac4f2ee40ee3e55ec9de2d1"
  };
  validateTerminalFailureReceipt(receipt, {
    failureAuthorityHash: authority.recordHash,
    successorExecutionReleaseRecordHash: fixedSuccessor.executionReleaseRecordHash,
    successorExecutorRuntimeHead: fixedSuccessor.executorRuntimeHead,
    successorQualificationHead: fixedSuccessor.qualificationHead,
    successorExecutorVersion: "1.12.22"
  });
  validateReservationClosureReceipt(closure, { terminalFailureReceiptId: receipt.receiptId, terminalFailureReceiptHash: receipt.receiptHash });
  const failureTree = await computeResultTreeAggregate(evidence.resultRoot, [...evidence.originalPaths, ...FIXED_POST_HANDLER_APPEND_PATHS.slice(0, 2)]);
  validateReconciledFailureManifest(manifest);
  assert.equal(manifest.failureEvidenceAggregate, failureTree.aggregate);
  validateReconciledFailureValidation(validation, manifest);
  const fullTree = await computeResultTreeAggregate(evidence.resultRoot, [...evidence.originalPaths, ...FIXED_POST_HANDLER_APPEND_PATHS]);
  return Object.freeze({
    disposition: "VERSION_1_12_21_POST_HANDLER_FAILURE_RECONCILED_SEALED",
    terminalState: manifest.state,
    failedResultRoot: `benchmarks/blind-object-v2-results/${authority.sourceResultRootName}`,
    originalPartialArtifactAggregate: evidence.tree.aggregate,
    failureEvidenceAggregate: failureTree.aggregate,
    terminalFailureTreeAggregate: fullTree.aggregate,
    originalArtifactsByteIdentical: true,
    effectiveConsentStatus: manifest.effectiveConsentStatus,
    effectiveInvocationStatus: manifest.effectiveInvocationStatus,
    effectiveReservationStatus: manifest.effectiveReservationStatus,
    terminalFailureReceiptId: receipt.receiptId,
    terminalFailureReceiptHash: receipt.receiptHash,
    reservationClosureId: closure.closureId,
    reservationClosureHash: closure.closureHash,
    terminalFailureManifestHash: manifest.manifestHash,
    terminalFailureValidationHash: validation.validationHash,
    handlerInvocationCount: 1,
    providerAttemptCount: 9,
    physicalProviderAttemptCount: 9,
    providerReportedUsageRecordCount: 0,
    conservativeAccountedCost: authority.conservativeAccountedCost,
    actualBilledCostStatus: "UNKNOWN",
    receipt
  });
}

export async function loadFixedV11221TerminalFailureReceipt(releaseIdentity) {
  const readback = await verifyFixedV11221Reconciliation({ releaseIdentity });
  return readback.receipt;
}
