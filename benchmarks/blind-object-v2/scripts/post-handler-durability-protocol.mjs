import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";

export const HANDLER_RETURNED_RECEIPT_TYPE = "HANDLER_RETURNED_DURABILITY_RECEIPT";
export const POST_HANDLER_FAILURE_MANIFEST_TYPE = "POST_HANDLER_TERMINAL_FAILURE_MANIFEST";
export const POST_HANDLER_FAILURE_VALIDATION_TYPE = "POST_HANDLER_TERMINAL_FAILURE_VALIDATION";
export const POST_HANDLER_SANITIZATION_STATE = "ABORTED_POST_HANDLER_SANITIZATION_RESPONSE_NOT_PERSISTED";

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,95}$/;
const ANALYSIS_ID = /^V2-RUN-(?:00[1-9]|01[0-9]|02[0-6])$/;

const HANDLER_RECEIPT_INPUT_FIELDS = Object.freeze([
  "executionReleaseRecordHash", "executorRuntimeHead", "qualificationHead", "executorVersion",
  "launchScopeHash", "continuationScopeHash", "consentId", "consentHash", "invocationId",
  "reservationId", "reservationHash", "resultId", "resultRootName", "requestId", "requestHash",
  "physicalSubmissionIdentity", "handlerOutcome", "handlerStatus", "handlerInvocationCount",
  "providerAttemptCount", "physicalProviderAttemptCount", "cumulativeConservativeCost",
  "canonicalHandlerResultHash", "returnedAt", "transactionState", "publicResponseArtifactCommitted",
  "replayPermitted"
]);
const HANDLER_RECEIPT_FIELDS = Object.freeze([
  "schemaVersion", "receiptType", "receiptId", ...HANDLER_RECEIPT_INPUT_FIELDS, "receiptHash"
]);
const FAILURE_INPUT_FIELDS = Object.freeze([
  "launchScopeHash", "continuationScopeHash", "resultId", "resultRootName", "invocationId",
  "consentHash", "reservationHash", "executionReleaseRecordHash", "executorVersion",
  "completeFrozenAggregateHash", "requestId", "handlerReturnedReceiptId", "handlerReturnedReceiptHash",
  "canonicalHandlerResultHash", "handlerOutcome", "handlerInvocationCount", "providerAttemptCount",
  "physicalProviderAttemptCount", "conservativeConsumedCost", "actualBilledCostStatus",
  "publicResponseArtifactCommitted", "replayPermitted", "failureStage", "failureCategory",
  "failureEvidenceAggregate", "effectiveConsentStatus", "effectiveInvocationStatus",
  "effectiveReservationStatus", "journalEffectiveState", "privateControlsLoaded", "scoringAuthorized",
  "reflectionAuthorized", "repairAuthorized", "state"
]);
const FAILURE_FIELDS = Object.freeze(["schemaVersion", "manifestType", ...FAILURE_INPUT_FIELDS, "manifestHash"]);
const VALIDATION_INPUT_FIELDS = Object.freeze([
  "resultId", "manifestHash", "state", "validatedAt", "handlerReturnedReceiptHash",
  "publicResponseArtifactCommitted", "replayPermitted", "effectiveConsentStatus",
  "effectiveReservationStatus", "handlerInvocationCount", "providerAttemptCount",
  "physicalProviderAttemptCount", "conservativeConsumedCost", "actualBilledCostStatus",
  "privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "repairPerformed"
]);
const VALIDATION_FIELDS = Object.freeze(["schemaVersion", "validationType", ...VALIDATION_INPUT_FIELDS, "validationHash"]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function iso(value, label) {
  assert.equal(new Date(value).toISOString(), value, `${label} must be canonical ISO UTC`);
}

function nonnegative(value, label) {
  assert.equal(Number.isFinite(value), true, `${label} must be finite`);
  assert.ok(value >= 0, `${label} must be nonnegative`);
}

export function createHandlerReturnedReceipt(input) {
  exactKeys(input, HANDLER_RECEIPT_INPUT_FIELDS, "handler-returned receipt input");
  const identityHash = sha256Json({
    receiptType: HANDLER_RETURNED_RECEIPT_TYPE,
    launchScopeHash: input.launchScopeHash,
    invocationId: input.invocationId,
    requestId: input.requestId,
    physicalSubmissionIdentity: input.physicalSubmissionIdentity,
    canonicalHandlerResultHash: input.canonicalHandlerResultHash
  });
  const core = {
    schemaVersion: "1.0",
    receiptType: HANDLER_RETURNED_RECEIPT_TYPE,
    receiptId: `handler-returned-${identityHash.slice(0, 48)}`,
    ...structuredClone(input)
  };
  const receipt = { ...core, receiptHash: sha256Json(core) };
  validateHandlerReturnedReceipt(receipt);
  return Object.freeze(receipt);
}

export function validateHandlerReturnedReceipt(receipt, bindings = {}) {
  exactKeys(receipt, HANDLER_RECEIPT_FIELDS, "handler-returned receipt");
  assert.equal(receipt.schemaVersion, "1.0");
  assert.equal(receipt.receiptType, HANDLER_RETURNED_RECEIPT_TYPE);
  assert.match(receipt.receiptId || "", /^handler-returned-[a-f0-9]{48}$/);
  for (const field of ["executionReleaseRecordHash", "launchScopeHash", "consentHash", "reservationHash", "requestHash", "canonicalHandlerResultHash", "receiptHash"]) assert.match(receipt[field] || "", HASH, `${field} is invalid`);
  if (receipt.continuationScopeHash !== null) assert.match(receipt.continuationScopeHash || "", HASH);
  for (const field of ["executorRuntimeHead", "qualificationHead"]) assert.match(receipt[field] || "", COMMIT);
  for (const field of ["consentId", "invocationId", "reservationId", "resultId", "resultRootName"]) assert.match(receipt[field] || "", SAFE_ID);
  assert.match(receipt.requestId || "", ANALYSIS_ID);
  assert.match(receipt.physicalSubmissionIdentity || "", /^submission-[a-f0-9]{32}$/);
  assert.ok(["NORMAL_SUCCESS", "PRODUCT_TERMINAL_FAILURE"].includes(receipt.handlerOutcome));
  assert.ok(Number.isInteger(receipt.handlerStatus));
  for (const field of ["handlerInvocationCount", "providerAttemptCount", "physicalProviderAttemptCount"]) assert.ok(Number.isInteger(receipt[field]) && receipt[field] >= 0);
  assert.equal(receipt.handlerInvocationCount, 1);
  nonnegative(receipt.cumulativeConservativeCost, "cumulative conservative cost");
  iso(receipt.returnedAt, "handler return time");
  assert.equal(receipt.transactionState, "HANDLER_RETURNED_RESPONSE_NOT_PERSISTED");
  assert.equal(receipt.publicResponseArtifactCommitted, false);
  assert.equal(receipt.replayPermitted, false);
  const core = structuredClone(receipt);
  delete core.receiptHash;
  assert.equal(sha256Json(core), receipt.receiptHash, "handler-returned receipt hash mismatch");
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(receipt[field], value, `handler-returned receipt ${field} mismatch`);
  return Object.freeze({ valid: true, receiptId: receipt.receiptId, receiptHash: receipt.receiptHash });
}

export function createPostHandlerFailureManifest(input) {
  exactKeys(input, FAILURE_INPUT_FIELDS, "post-handler failure manifest input");
  const core = { schemaVersion: "1.0", manifestType: POST_HANDLER_FAILURE_MANIFEST_TYPE, ...structuredClone(input) };
  const manifest = { ...core, manifestHash: sha256Json(core) };
  validatePostHandlerFailureManifest(manifest);
  return Object.freeze(manifest);
}

export function validatePostHandlerFailureManifest(manifest) {
  exactKeys(manifest, FAILURE_FIELDS, "post-handler failure manifest");
  assert.equal(manifest.schemaVersion, "1.0");
  assert.equal(manifest.manifestType, POST_HANDLER_FAILURE_MANIFEST_TYPE);
  for (const field of ["resultId", "resultRootName", "invocationId"]) assert.match(manifest[field] || "", SAFE_ID, `${field} is invalid`);
  for (const field of ["launchScopeHash", "consentHash", "reservationHash", "executionReleaseRecordHash", "completeFrozenAggregateHash", "handlerReturnedReceiptHash", "canonicalHandlerResultHash", "failureEvidenceAggregate", "manifestHash"]) assert.match(manifest[field] || "", HASH, `${field} is invalid`);
  if (manifest.continuationScopeHash !== null) assert.match(manifest.continuationScopeHash || "", HASH);
  assert.match(manifest.requestId || "", ANALYSIS_ID);
  assert.match(manifest.handlerReturnedReceiptId || "", /^handler-returned-[a-f0-9]{48}$/);
  assert.ok(["NORMAL_SUCCESS", "PRODUCT_TERMINAL_FAILURE"].includes(manifest.handlerOutcome));
  assert.equal(manifest.handlerInvocationCount, 1);
  for (const field of ["providerAttemptCount", "physicalProviderAttemptCount"]) assert.ok(Number.isInteger(manifest[field]) && manifest[field] >= 0);
  nonnegative(manifest.conservativeConsumedCost, "failure conservative consumed cost");
  assert.equal(manifest.actualBilledCostStatus, "UNKNOWN");
  assert.equal(manifest.publicResponseArtifactCommitted, false);
  assert.equal(manifest.replayPermitted, false);
  assert.equal(manifest.failureStage, "POST_HANDLER_TERMINAL_RECORD_SANITIZATION");
  assert.equal(manifest.failureCategory, "SECRET_SANITIZER_REJECTED_TERMINAL_RECORD");
  assert.equal(manifest.effectiveConsentStatus, "CONSUMED");
  assert.equal(manifest.effectiveInvocationStatus, "TERMINAL_FAILED");
  assert.equal(manifest.effectiveReservationStatus, "CLOSED_CONSERVATIVE_COST_ACCOUNTED");
  assert.equal(manifest.journalEffectiveState, "POST_HANDLER_SANITIZATION_FAILED");
  for (const field of ["privateControlsLoaded", "scoringAuthorized", "reflectionAuthorized", "repairAuthorized"]) assert.equal(manifest[field], false);
  assert.equal(manifest.state, POST_HANDLER_SANITIZATION_STATE);
  const core = structuredClone(manifest);
  delete core.manifestHash;
  assert.equal(sha256Json(core), manifest.manifestHash, "post-handler failure manifest hash mismatch");
  return Object.freeze({ valid: true, manifestHash: manifest.manifestHash, state: manifest.state });
}

export function createPostHandlerFailureValidation(input) {
  exactKeys(input, VALIDATION_INPUT_FIELDS, "post-handler failure validation input");
  const core = { schemaVersion: "1.0", validationType: POST_HANDLER_FAILURE_VALIDATION_TYPE, ...structuredClone(input) };
  const report = { ...core, validationHash: sha256Json(core) };
  validatePostHandlerFailureValidation(report);
  return Object.freeze(report);
}

export function validatePostHandlerFailureValidation(report, manifest = null) {
  exactKeys(report, VALIDATION_FIELDS, "post-handler failure validation");
  assert.equal(report.schemaVersion, "1.0");
  assert.equal(report.validationType, POST_HANDLER_FAILURE_VALIDATION_TYPE);
  assert.match(report.resultId || "", SAFE_ID);
  for (const field of ["manifestHash", "handlerReturnedReceiptHash", "validationHash"]) assert.match(report[field] || "", HASH);
  assert.equal(report.state, POST_HANDLER_SANITIZATION_STATE);
  iso(report.validatedAt, "post-handler validation time");
  assert.equal(report.publicResponseArtifactCommitted, false);
  assert.equal(report.replayPermitted, false);
  assert.equal(report.effectiveConsentStatus, "CONSUMED");
  assert.equal(report.effectiveReservationStatus, "CLOSED_CONSERVATIVE_COST_ACCOUNTED");
  assert.equal(report.handlerInvocationCount, 1);
  for (const field of ["providerAttemptCount", "physicalProviderAttemptCount"]) assert.ok(Number.isInteger(report[field]) && report[field] >= 0);
  nonnegative(report.conservativeConsumedCost, "validation conservative consumed cost");
  assert.equal(report.actualBilledCostStatus, "UNKNOWN");
  for (const field of ["privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "repairPerformed"]) assert.equal(report[field], false);
  const core = structuredClone(report);
  delete core.validationHash;
  assert.equal(sha256Json(core), report.validationHash, "post-handler validation hash mismatch");
  if (manifest) {
    validatePostHandlerFailureManifest(manifest);
    assert.equal(report.resultId, manifest.resultId);
    assert.equal(report.manifestHash, manifest.manifestHash);
    assert.equal(report.handlerReturnedReceiptHash, manifest.handlerReturnedReceiptHash);
  }
  return Object.freeze({ valid: true, validationHash: report.validationHash });
}
