import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";

export const RECONCILED_POST_HANDLER_STATE = "ABORTED_POST_HANDLER_SANITIZATION_RESPONSE_NOT_PERSISTED";
export const TERMINAL_FAILURE_RECEIPT_TYPE = "VERSION_1_12_21_TERMINAL_FAILURE_RECEIPT";
export const RESERVATION_CLOSURE_RECEIPT_TYPE = "CONSERVATIVE_COST_RESERVATION_CLOSURE_RECEIPT";
export const RECONCILED_FAILURE_MANIFEST_TYPE = "RECONCILED_POST_HANDLER_TERMINAL_FAILURE_MANIFEST";
export const RECONCILED_FAILURE_VALIDATION_TYPE = "RECONCILED_POST_HANDLER_TERMINAL_FAILURE_VALIDATION";

const HASH = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,95}$/;

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function iso(value, label) {
  assert.equal(new Date(value).toISOString(), value, `${label} must be canonical ISO UTC`);
}

function sealed(typeField, type, input, hashField) {
  const core = { schemaVersion: "1.0", [typeField]: type, ...structuredClone(input) };
  return Object.freeze({ ...core, [hashField]: sha256Json(core) });
}

const FAILURE_RECEIPT_INPUT = Object.freeze([
  "failureAuthorityHash", "sourceExecutionReleaseRecordHash", "sourceExecutorVersion", "sourceResultRootName",
  "sourcePartialArtifactAggregate", "sourceJournalHash", "sourceLedgerHash", "sourceConsentId", "sourceConsentHash",
  "sourceInvocationId", "sourceReservationId", "sourceReservationHash", "sourceResultId", "sourceRequestId",
  "sourceSubmissionIdentity", "handlerOutcome", "handlerInvocationCount", "providerAttemptCount",
  "physicalProviderAttemptCount", "providerReportedUsageRecordCount", "actualBilledCostStatus",
  "conservativeAccountedCost", "handlerResultBytesStatus", "publicResponseArtifactStatus",
  "successfulManifestStatus", "terminalState", "replayPermitted", "effectiveConsentStatus",
  "effectiveInvocationStatus", "effectiveReservationStatus", "successorExecutionReleaseRecordHash",
  "successorExecutorRuntimeHead", "successorQualificationHead", "successorExecutorVersion", "createdAt"
]);

export function createTerminalFailureReceipt(input) {
  exactKeys(input, FAILURE_RECEIPT_INPUT, "terminal failure receipt input");
  const identityHash = sha256Json({
    receiptType: TERMINAL_FAILURE_RECEIPT_TYPE,
    failureAuthorityHash: input.failureAuthorityHash,
    sourceInvocationId: input.sourceInvocationId,
    sourceRequestId: input.sourceRequestId,
    successorExecutionReleaseRecordHash: input.successorExecutionReleaseRecordHash
  });
  const receipt = sealed("receiptType", TERMINAL_FAILURE_RECEIPT_TYPE, {
    receiptId: `terminal-failure-${identityHash.slice(0, 48)}`,
    ...input
  }, "receiptHash");
  validateTerminalFailureReceipt(receipt);
  return receipt;
}

export function validateTerminalFailureReceipt(receipt, bindings = {}) {
  exactKeys(receipt, ["schemaVersion", "receiptType", "receiptId", ...FAILURE_RECEIPT_INPUT, "receiptHash"], "terminal failure receipt");
  assert.equal(receipt.schemaVersion, "1.0");
  assert.equal(receipt.receiptType, TERMINAL_FAILURE_RECEIPT_TYPE);
  assert.match(receipt.receiptId || "", /^terminal-failure-[a-f0-9]{48}$/);
  for (const field of ["failureAuthorityHash", "sourceExecutionReleaseRecordHash", "sourcePartialArtifactAggregate", "sourceJournalHash", "sourceLedgerHash", "sourceConsentHash", "sourceReservationHash", "successorExecutionReleaseRecordHash", "receiptHash"]) assert.match(receipt[field] || "", HASH);
  for (const field of ["sourceResultRootName", "sourceConsentId", "sourceInvocationId", "sourceReservationId", "sourceResultId"]) assert.match(receipt[field] || "", SAFE_ID);
  assert.equal(receipt.sourceExecutorVersion, "1.12.21");
  assert.equal(receipt.successorExecutorVersion, "1.12.22");
  assert.equal(receipt.sourceRequestId, "V2-RUN-001");
  assert.match(receipt.sourceSubmissionIdentity || "", /^submission-[a-f0-9]{32}$/);
  assert.equal(receipt.handlerOutcome, "NORMAL_SUCCESS");
  assert.equal(receipt.handlerInvocationCount, 1);
  assert.equal(receipt.providerAttemptCount, 9);
  assert.equal(receipt.physicalProviderAttemptCount, 9);
  assert.equal(receipt.providerReportedUsageRecordCount, 0);
  assert.equal(receipt.actualBilledCostStatus, "UNKNOWN");
  assert.equal(receipt.conservativeAccountedCost, 1.50682355);
  assert.equal(receipt.handlerResultBytesStatus, "NOT_DURABLY_CAPTURED");
  assert.equal(receipt.publicResponseArtifactStatus, "ABSENT");
  assert.equal(receipt.successfulManifestStatus, "ABSENT");
  assert.equal(receipt.terminalState, RECONCILED_POST_HANDLER_STATE);
  assert.equal(receipt.replayPermitted, false);
  assert.equal(receipt.effectiveConsentStatus, "CONSUMED");
  assert.equal(receipt.effectiveInvocationStatus, "TERMINAL_FAILED");
  assert.equal(receipt.effectiveReservationStatus, "CLOSED_CONSERVATIVE_COST_ACCOUNTED");
  iso(receipt.createdAt, "terminal failure receipt time");
  const core = structuredClone(receipt); delete core.receiptHash;
  assert.equal(sha256Json(core), receipt.receiptHash);
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(receipt[field], value, `terminal failure receipt ${field} mismatch`);
  return Object.freeze({ valid: true, receiptId: receipt.receiptId, receiptHash: receipt.receiptHash });
}

const CLOSURE_INPUT = Object.freeze([
  "terminalFailureReceiptId", "terminalFailureReceiptHash", "sourceInvocationId", "sourceReservationId",
  "sourceReservationHash", "sourceReservationRecordHash", "fromState", "effectiveState",
  "conservativeAccountedCost", "actualBilledCostStatus", "physicalProviderAttemptCount", "closedAt"
]);

export function createReservationClosureReceipt(input) {
  exactKeys(input, CLOSURE_INPUT, "reservation closure input");
  const identityInput = structuredClone(input);
  delete identityInput.closedAt;
  const identityHash = sha256Json({ receiptType: RESERVATION_CLOSURE_RECEIPT_TYPE, ...identityInput });
  const receipt = sealed("receiptType", RESERVATION_CLOSURE_RECEIPT_TYPE, { closureId: `reservation-closure-${identityHash.slice(0, 48)}`, ...input }, "closureHash");
  validateReservationClosureReceipt(receipt);
  return receipt;
}

export function validateReservationClosureReceipt(receipt, bindings = {}) {
  exactKeys(receipt, ["schemaVersion", "receiptType", "closureId", ...CLOSURE_INPUT, "closureHash"], "reservation closure receipt");
  assert.equal(receipt.schemaVersion, "1.0");
  assert.equal(receipt.receiptType, RESERVATION_CLOSURE_RECEIPT_TYPE);
  assert.match(receipt.closureId || "", /^reservation-closure-[a-f0-9]{48}$/);
  for (const field of ["terminalFailureReceiptHash", "sourceReservationHash", "sourceReservationRecordHash", "closureHash"]) assert.match(receipt[field] || "", HASH);
  assert.match(receipt.terminalFailureReceiptId || "", /^terminal-failure-[a-f0-9]{48}$/);
  assert.equal(receipt.fromState, "STARTED");
  assert.equal(receipt.effectiveState, "CLOSED_CONSERVATIVE_COST_ACCOUNTED");
  assert.equal(receipt.conservativeAccountedCost, 1.50682355);
  assert.equal(receipt.actualBilledCostStatus, "UNKNOWN");
  assert.equal(receipt.physicalProviderAttemptCount, 9);
  iso(receipt.closedAt, "reservation closure time");
  const core = structuredClone(receipt); delete core.closureHash;
  assert.equal(sha256Json(core), receipt.closureHash);
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(receipt[field], value, `reservation closure ${field} mismatch`);
  return Object.freeze({ valid: true, closureId: receipt.closureId, closureHash: receipt.closureHash });
}

const MANIFEST_INPUT = Object.freeze([
  "terminalFailureReceiptId", "terminalFailureReceiptHash", "reservationClosureId", "reservationClosureHash",
  "sourceExecutionReleaseRecordHash", "sourceExecutorVersion", "sourceResultRootName", "sourcePartialArtifactAggregate",
  "sourceJournalHash", "sourceLedgerHash", "sourceConsentHash", "sourceInvocationId", "sourceReservationHash",
  "sourceResultId", "sourceRequestId", "handlerOutcome", "handlerInvocationCount", "providerAttemptCount",
  "physicalProviderAttemptCount", "providerReportedUsageRecordCount", "conservativeAccountedCost",
  "actualBilledCostStatus", "publicResponseArtifactCommitted", "successfulManifestPresent", "replayPermitted",
  "failureEvidenceAggregate", "originalArtifactsByteIdentical", "effectiveConsentStatus", "effectiveInvocationStatus",
  "effectiveReservationStatus", "privateControlsLoaded", "scoringAuthorized", "reflectionAuthorized",
  "repairAuthorized", "state"
]);

export function createReconciledFailureManifest(input) {
  exactKeys(input, MANIFEST_INPUT, "reconciled failure manifest input");
  const manifest = sealed("manifestType", RECONCILED_FAILURE_MANIFEST_TYPE, input, "manifestHash");
  validateReconciledFailureManifest(manifest);
  return manifest;
}

export function validateReconciledFailureManifest(manifest) {
  exactKeys(manifest, ["schemaVersion", "manifestType", ...MANIFEST_INPUT, "manifestHash"], "reconciled failure manifest");
  assert.equal(manifest.schemaVersion, "1.0");
  assert.equal(manifest.manifestType, RECONCILED_FAILURE_MANIFEST_TYPE);
  assert.equal(manifest.sourceExecutorVersion, "1.12.21");
  assert.equal(manifest.sourceRequestId, "V2-RUN-001");
  assert.equal(manifest.handlerOutcome, "NORMAL_SUCCESS");
  assert.equal(manifest.handlerInvocationCount, 1);
  assert.equal(manifest.providerAttemptCount, 9);
  assert.equal(manifest.physicalProviderAttemptCount, 9);
  assert.equal(manifest.providerReportedUsageRecordCount, 0);
  assert.equal(manifest.conservativeAccountedCost, 1.50682355);
  assert.equal(manifest.actualBilledCostStatus, "UNKNOWN");
  assert.equal(manifest.publicResponseArtifactCommitted, false);
  assert.equal(manifest.successfulManifestPresent, false);
  assert.equal(manifest.replayPermitted, false);
  assert.equal(manifest.originalArtifactsByteIdentical, true);
  assert.equal(manifest.effectiveConsentStatus, "CONSUMED");
  assert.equal(manifest.effectiveInvocationStatus, "TERMINAL_FAILED");
  assert.equal(manifest.effectiveReservationStatus, "CLOSED_CONSERVATIVE_COST_ACCOUNTED");
  for (const field of ["privateControlsLoaded", "scoringAuthorized", "reflectionAuthorized", "repairAuthorized"]) assert.equal(manifest[field], false);
  assert.equal(manifest.state, RECONCILED_POST_HANDLER_STATE);
  for (const field of ["terminalFailureReceiptHash", "reservationClosureHash", "sourceExecutionReleaseRecordHash", "sourcePartialArtifactAggregate", "sourceJournalHash", "sourceLedgerHash", "sourceConsentHash", "sourceReservationHash", "failureEvidenceAggregate", "manifestHash"]) assert.match(manifest[field] || "", HASH);
  const core = structuredClone(manifest); delete core.manifestHash;
  assert.equal(sha256Json(core), manifest.manifestHash);
  return Object.freeze({ valid: true, manifestHash: manifest.manifestHash, state: manifest.state });
}

const VALIDATION_INPUT = Object.freeze([
  "terminalFailureReceiptHash", "reservationClosureHash", "manifestHash", "state", "validatedAt",
  "originalArtifactsByteIdentical", "effectiveConsentStatus", "effectiveInvocationStatus",
  "effectiveReservationStatus", "handlerInvocationCount", "providerAttemptCount", "physicalProviderAttemptCount",
  "providerReportedUsageRecordCount", "conservativeAccountedCost", "actualBilledCostStatus",
  "publicResponseArtifactCommitted", "successfulManifestPresent", "replayPermitted", "privateControlsLoaded",
  "scoringPerformed", "reflectionPerformed", "repairPerformed"
]);

export function createReconciledFailureValidation(input) {
  exactKeys(input, VALIDATION_INPUT, "reconciled failure validation input");
  const report = sealed("validationType", RECONCILED_FAILURE_VALIDATION_TYPE, input, "validationHash");
  validateReconciledFailureValidation(report);
  return report;
}

export function validateReconciledFailureValidation(report, manifest = null) {
  exactKeys(report, ["schemaVersion", "validationType", ...VALIDATION_INPUT, "validationHash"], "reconciled failure validation");
  assert.equal(report.schemaVersion, "1.0");
  assert.equal(report.validationType, RECONCILED_FAILURE_VALIDATION_TYPE);
  assert.equal(report.state, RECONCILED_POST_HANDLER_STATE);
  iso(report.validatedAt, "reconciled failure validation time");
  assert.equal(report.originalArtifactsByteIdentical, true);
  assert.equal(report.effectiveConsentStatus, "CONSUMED");
  assert.equal(report.effectiveInvocationStatus, "TERMINAL_FAILED");
  assert.equal(report.effectiveReservationStatus, "CLOSED_CONSERVATIVE_COST_ACCOUNTED");
  assert.equal(report.handlerInvocationCount, 1);
  assert.equal(report.providerAttemptCount, 9);
  assert.equal(report.physicalProviderAttemptCount, 9);
  assert.equal(report.providerReportedUsageRecordCount, 0);
  assert.equal(report.conservativeAccountedCost, 1.50682355);
  assert.equal(report.actualBilledCostStatus, "UNKNOWN");
  assert.equal(report.publicResponseArtifactCommitted, false);
  assert.equal(report.successfulManifestPresent, false);
  assert.equal(report.replayPermitted, false);
  for (const field of ["privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "repairPerformed"]) assert.equal(report[field], false);
  for (const field of ["terminalFailureReceiptHash", "reservationClosureHash", "manifestHash", "validationHash"]) assert.match(report[field] || "", HASH);
  const core = structuredClone(report); delete core.validationHash;
  assert.equal(sha256Json(core), report.validationHash);
  if (manifest) {
    validateReconciledFailureManifest(manifest);
    assert.equal(report.manifestHash, manifest.manifestHash);
    assert.equal(report.terminalFailureReceiptHash, manifest.terminalFailureReceiptHash);
    assert.equal(report.reservationClosureHash, manifest.reservationClosureHash);
  }
  return Object.freeze({ valid: true, validationHash: report.validationHash });
}
