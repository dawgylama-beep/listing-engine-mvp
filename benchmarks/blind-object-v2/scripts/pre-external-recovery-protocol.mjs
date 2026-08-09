import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";

export const ZERO_EXTERNAL_SUPERSESSION_RECEIPT_TYPE = "ZERO_EXTERNAL_ACTIVITY_SUPERSESSION_RECEIPT";
export const TERMINAL_FAILURE_MANIFEST_TYPE = "PRE_EXTERNAL_TERMINAL_FAILURE_MANIFEST";
export const TERMINAL_FAILURE_VALIDATION_TYPE = "PRE_EXTERNAL_TERMINAL_FAILURE_VALIDATION";
export const PRE_EXTERNAL_TERMINAL_STATE = "ABORTED_PRE_HANDLER_ZERO_EXTERNAL_ACTIVITY";

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,95}$/;
const ANALYSIS_ID = /^V2-RUN-(?:00[1-9]|01[0-9]|02[0-6])$/;
const RECEIPT_ID = /^supersession-[a-f0-9]{48}$/;

const RECEIPT_INPUT_FIELDS = Object.freeze([
  "failureAuthorityHash", "sourceExecutionReleaseRecordHash", "sourceExecutorVersion", "sourceResultRootName",
  "sourcePartialArtifactAggregate", "sourceJournalHash", "sourceLedgerHash", "sourceConsentHash", "sourceReservationHash", "supersededConsentId",
  "supersededInvocationId", "supersededReservationId", "supersededResultId", "supersededRequestId",
  "sourceSubmissionIdentity", "successorExecutionReleaseRecordHash", "successorExecutorRuntimeHead",
  "successorQualificationHead", "successorExecutorVersion", "handlerAttemptCount", "providerAttemptCount",
  "physicalProviderAttemptCount", "actualProviderCost", "terminalState", "effectiveConsentStatus",
  "effectiveInvocationStatus", "effectiveReservationStatus", "sourceSubmissionIdentityStatus",
  "originalArtifactRecords", "createdAt"
]);
const RECEIPT_FIELDS = Object.freeze([
  "schemaVersion", "receiptType", "supersessionIdentityHash", "receiptId", ...RECEIPT_INPUT_FIELDS, "receiptHash"
]);
const TERMINAL_MANIFEST_INPUT_FIELDS = Object.freeze([
  "failureClassification", "launchScopeHash", "resultId", "resultRootName", "invocationId", "consentHash",
  "reservationHash", "executionReleaseRecordHash", "executorVersion", "completeFrozenAggregateHash", "requestId",
  "originalPartialArtifactAggregate", "failureEvidenceAggregate", "zeroExternalSupersessionReceiptId",
  "zeroExternalSupersessionReceiptHash", "handlerAttemptCount", "providerAttemptCount",
  "physicalProviderAttemptCount", "actualProviderCost", "requestedCount", "preExternalAbortCount",
  "notExternallySubmittedCount", "effectiveConsentStatus", "resultRootConsentStatus",
  "effectiveReservationStatus", "journalEffectiveState", "originalArtifactsByteIdentical",
  "privateControlsLoaded", "scoringAuthorized", "reflectionAuthorized", "repairAuthorized", "state"
]);
const TERMINAL_MANIFEST_FIELDS = Object.freeze([
  "schemaVersion", "manifestType", ...TERMINAL_MANIFEST_INPUT_FIELDS, "manifestHash"
]);
const VALIDATION_INPUT_FIELDS = Object.freeze([
  "resultId", "manifestHash", "state", "validatedAt", "originalArtifactsByteIdentical",
  "effectiveCanonicalConsentStatus", "resultRootConsentStatus", "effectiveReservationStatus",
  "journalEffectiveState", "handlerAttemptCount", "providerAttemptCount", "physicalProviderAttemptCount",
  "actualProviderCost", "privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "repairPerformed"
]);
const VALIDATION_FIELDS = Object.freeze([
  "schemaVersion", "validationType", ...VALIDATION_INPUT_FIELDS, "validationHash"
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function iso(value, label) {
  assert.equal(new Date(value).toISOString(), value, `${label} must be canonical ISO UTC`);
  return value;
}

function validateZeroCounts(record) {
  for (const field of ["handlerAttemptCount", "providerAttemptCount", "physicalProviderAttemptCount", "actualProviderCost"]) {
    assert.equal(record[field], 0, `${field} must prove zero external activity`);
  }
}

function validateArtifactRecords(records) {
  assert.equal(Array.isArray(records), true, "original artifact records must be an array");
  assert.equal(records.length, 8, "exactly eight original partial artifacts are required");
  const paths = new Set();
  for (const record of records) {
    exactKeys(record, ["relativePath", "bytes", "sha256"], "original artifact record");
    assert.match(record.relativePath || "", /^[a-z0-9][a-z0-9-]*\.json$/);
    assert.equal(paths.has(record.relativePath), false, "duplicate original artifact path");
    paths.add(record.relativePath);
    assert.ok(Number.isInteger(record.bytes) && record.bytes > 0, "original artifact bytes must be positive");
    assert.match(record.sha256 || "", HASH);
  }
}

export function createZeroExternalSupersessionReceipt(input) {
  exactKeys(input, RECEIPT_INPUT_FIELDS, "zero-external supersession input");
  const identityInput = structuredClone(input);
  delete identityInput.createdAt;
  const supersessionIdentityHash = sha256Json({
    schemaVersion: "1.0",
    receiptType: ZERO_EXTERNAL_SUPERSESSION_RECEIPT_TYPE,
    ...identityInput
  });
  const core = {
    schemaVersion: "1.0",
    receiptType: ZERO_EXTERNAL_SUPERSESSION_RECEIPT_TYPE,
    supersessionIdentityHash,
    receiptId: `supersession-${supersessionIdentityHash.slice(0, 48)}`,
    ...structuredClone(input)
  };
  const record = { ...core, receiptHash: sha256Json(core) };
  validateZeroExternalSupersessionReceipt(record);
  return Object.freeze(record);
}

export function validateZeroExternalSupersessionReceipt(receipt, bindings = {}) {
  exactKeys(receipt, RECEIPT_FIELDS, "zero-external supersession receipt");
  assert.equal(receipt.schemaVersion, "1.0");
  assert.equal(receipt.receiptType, ZERO_EXTERNAL_SUPERSESSION_RECEIPT_TYPE);
  for (const field of ["failureAuthorityHash", "sourceExecutionReleaseRecordHash", "sourcePartialArtifactAggregate", "sourceJournalHash", "sourceLedgerHash", "sourceConsentHash", "sourceReservationHash", "successorExecutionReleaseRecordHash", "supersessionIdentityHash", "receiptHash"]) assert.match(receipt[field] || "", HASH, `${field} is invalid`);
  for (const field of ["successorExecutorRuntimeHead", "successorQualificationHead"]) assert.match(receipt[field] || "", COMMIT, `${field} is invalid`);
  for (const field of ["sourceResultRootName", "supersededConsentId", "supersededInvocationId", "supersededReservationId", "supersededResultId"]) assert.match(receipt[field] || "", SAFE_ID, `${field} is invalid`);
  assert.match(receipt.supersededRequestId || "", ANALYSIS_ID);
  assert.match(receipt.sourceSubmissionIdentity || "", /^submission-[a-f0-9]{32}$/);
  assert.match(receipt.receiptId || "", RECEIPT_ID);
  assert.equal(receipt.sourceExecutorVersion, "1.12.20");
  assert.equal(receipt.successorExecutorVersion, "1.12.21");
  assert.equal(receipt.terminalState, PRE_EXTERNAL_TERMINAL_STATE);
  assert.equal(receipt.effectiveConsentStatus, "CONSUMED");
  assert.equal(receipt.effectiveInvocationStatus, "CLOSED_PRE_HANDLER_ZERO_SPEND");
  assert.equal(receipt.effectiveReservationStatus, "CLOSED_ZERO_SPEND");
  assert.equal(receipt.sourceSubmissionIdentityStatus, "TERMINAL_NON_REUSABLE_SUPERSEDED_ONCE");
  validateZeroCounts(receipt);
  validateArtifactRecords(receipt.originalArtifactRecords);
  iso(receipt.createdAt, "supersession receipt createdAt");
  const identityInput = Object.fromEntries(RECEIPT_INPUT_FIELDS.filter((field) => field !== "createdAt").map((field) => [field, structuredClone(receipt[field])]));
  assert.equal(sha256Json({ schemaVersion: "1.0", receiptType: ZERO_EXTERNAL_SUPERSESSION_RECEIPT_TYPE, ...identityInput }), receipt.supersessionIdentityHash, "supersession identity hash mismatch");
  assert.equal(receipt.receiptId, `supersession-${receipt.supersessionIdentityHash.slice(0, 48)}`);
  const core = structuredClone(receipt);
  delete core.receiptHash;
  assert.equal(sha256Json(core), receipt.receiptHash, "supersession receipt hash mismatch");
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(receipt[field], value, `supersession receipt ${field} mismatch`);
  return Object.freeze({ valid: true, receiptId: receipt.receiptId, receiptHash: receipt.receiptHash });
}

export function createTerminalFailureManifest(input) {
  exactKeys(input, TERMINAL_MANIFEST_INPUT_FIELDS, "terminal failure manifest input");
  const core = { schemaVersion: "1.0", manifestType: TERMINAL_FAILURE_MANIFEST_TYPE, ...structuredClone(input) };
  const manifest = { ...core, manifestHash: sha256Json(core) };
  validateTerminalFailureManifest(manifest);
  return Object.freeze(manifest);
}

export function validateTerminalFailureManifest(manifest) {
  exactKeys(manifest, TERMINAL_MANIFEST_FIELDS, "terminal failure manifest");
  assert.equal(manifest.schemaVersion, "1.0");
  assert.equal(manifest.manifestType, TERMINAL_FAILURE_MANIFEST_TYPE);
  assert.equal(manifest.failureClassification, PRE_EXTERNAL_TERMINAL_STATE);
  assert.equal(manifest.state, PRE_EXTERNAL_TERMINAL_STATE);
  for (const field of ["launchScopeHash", "consentHash", "reservationHash", "executionReleaseRecordHash", "completeFrozenAggregateHash", "originalPartialArtifactAggregate", "failureEvidenceAggregate", "manifestHash"]) assert.match(manifest[field] || "", HASH, `${field} is invalid`);
  for (const field of ["resultId", "resultRootName", "invocationId"]) assert.match(manifest[field] || "", SAFE_ID, `${field} is invalid`);
  assert.match(manifest.requestId || "", ANALYSIS_ID);
  if (manifest.zeroExternalSupersessionReceiptId === null || manifest.zeroExternalSupersessionReceiptHash === null) {
    assert.equal(manifest.zeroExternalSupersessionReceiptId, null);
    assert.equal(manifest.zeroExternalSupersessionReceiptHash, null);
  } else {
    assert.match(manifest.zeroExternalSupersessionReceiptId, RECEIPT_ID);
    assert.match(manifest.zeroExternalSupersessionReceiptHash, HASH);
  }
  validateZeroCounts(manifest);
  assert.equal(manifest.requestedCount, 26);
  assert.equal(manifest.preExternalAbortCount, 1);
  assert.equal(manifest.notExternallySubmittedCount, 26);
  assert.equal(manifest.effectiveConsentStatus, "CONSUMED");
  assert.equal(manifest.resultRootConsentStatus, "CONSUMED");
  assert.ok(["CLOSED_ZERO_SPEND", "CLOSED_PRE_EXTERNAL_ABORT"].includes(manifest.effectiveReservationStatus));
  assert.ok(["PRE_EXTERNAL_ABORT", "LEGACY_SUBMISSION_STARTED_SUPERSEDED_ZERO_EXTERNAL_ACTIVITY"].includes(manifest.journalEffectiveState));
  assert.equal(manifest.originalArtifactsByteIdentical, true);
  for (const field of ["privateControlsLoaded", "scoringAuthorized", "reflectionAuthorized", "repairAuthorized"]) assert.equal(manifest[field], false);
  const core = structuredClone(manifest);
  delete core.manifestHash;
  assert.equal(sha256Json(core), manifest.manifestHash, "terminal failure manifest hash mismatch");
  return Object.freeze({ valid: true, manifestHash: manifest.manifestHash, state: manifest.state });
}

export function createTerminalFailureValidationReport(input) {
  exactKeys(input, VALIDATION_INPUT_FIELDS, "terminal failure validation input");
  const core = { schemaVersion: "1.0", validationType: TERMINAL_FAILURE_VALIDATION_TYPE, ...structuredClone(input) };
  const report = { ...core, validationHash: sha256Json(core) };
  validateTerminalFailureValidationReport(report);
  return Object.freeze(report);
}

export function validateTerminalFailureValidationReport(report, manifest = null) {
  exactKeys(report, VALIDATION_FIELDS, "terminal failure validation report");
  assert.equal(report.schemaVersion, "1.0");
  assert.equal(report.validationType, TERMINAL_FAILURE_VALIDATION_TYPE);
  assert.equal(report.state, PRE_EXTERNAL_TERMINAL_STATE);
  assert.match(report.resultId || "", SAFE_ID);
  assert.match(report.manifestHash || "", HASH);
  iso(report.validatedAt, "terminal failure validation time");
  assert.equal(report.originalArtifactsByteIdentical, true);
  assert.equal(report.effectiveCanonicalConsentStatus, "CONSUMED");
  assert.equal(report.resultRootConsentStatus, "CONSUMED");
  assert.ok(["CLOSED_ZERO_SPEND", "CLOSED_PRE_EXTERNAL_ABORT"].includes(report.effectiveReservationStatus));
  assert.ok(["PRE_EXTERNAL_ABORT", "LEGACY_SUBMISSION_STARTED_SUPERSEDED_ZERO_EXTERNAL_ACTIVITY"].includes(report.journalEffectiveState));
  validateZeroCounts(report);
  for (const field of ["privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "repairPerformed"]) assert.equal(report[field], false);
  const core = structuredClone(report);
  delete core.validationHash;
  assert.equal(sha256Json(core), report.validationHash, "terminal failure validation hash mismatch");
  if (manifest) {
    validateTerminalFailureManifest(manifest);
    assert.equal(report.resultId, manifest.resultId);
    assert.equal(report.manifestHash, manifest.manifestHash);
    assert.equal(report.state, manifest.state);
  }
  return Object.freeze({ valid: true, validationHash: report.validationHash });
}
