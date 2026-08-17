import assert from "node:assert/strict";
import { createHash } from "node:crypto";

export const FUTURE_QUALIFICATION_EXECUTION_LIMITS = Object.freeze({
  maximumOutputTokensPerCase: 4000,
  maximumSerializedRequestBytes: 64000,
  completeRawEnvelopeCaptureBytes: 1048576,
  deterministicOverflowBoundaryBytes: 1048577
});

export const PROVIDER_TERMINAL_STATUS = Object.freeze({
  COMPLETED: "completed",
  INCOMPLETE: "incomplete"
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function byteBuffer(value, code) {
  assert.ok(Buffer.isBuffer(value) || value instanceof Uint8Array, code);
  return Buffer.from(value);
}

function uniqueStrings(value, code) {
  assert.ok(Array.isArray(value) && value.length > 0, code);
  assert.equal(value.every((item) => typeof item === "string" && item.length > 0), true, code);
  assert.equal(new Set(value).size, value.length, `${code}_DUPLICATE`);
  return value;
}

export function assertSerializedRequestWithinLimit(request) {
  const serialized = Buffer.from(JSON.stringify(request), "utf8");
  assert.ok(
    serialized.length <= FUTURE_QUALIFICATION_EXECUTION_LIMITS.maximumSerializedRequestBytes,
    "FUTURE_QUALIFICATION_REQUEST_BYTES_EXCEEDED"
  );
  return Object.freeze({
    bytes: serialized.length,
    sha256: sha256(serialized),
    maximumBytes: FUTURE_QUALIFICATION_EXECUTION_LIMITS.maximumSerializedRequestBytes
  });
}

export function captureRawEnvelope(rawEnvelopeBytes) {
  const source = byteBuffer(rawEnvelopeBytes, "FUTURE_QUALIFICATION_RAW_ENVELOPE_BYTES_REQUIRED");
  const receivedSha256 = sha256(source);
  if (source.length > FUTURE_QUALIFICATION_EXECUTION_LIMITS.completeRawEnvelopeCaptureBytes) {
    return Object.freeze({
      accepted: false,
      terminalStatus: "OVERFLOW_REJECTED",
      receivedBytes: source.length,
      receivedSha256,
      captureLimitBytes: FUTURE_QUALIFICATION_EXECUTION_LIMITS.completeRawEnvelopeCaptureBytes,
      overflowBoundaryBytes: FUTURE_QUALIFICATION_EXECUTION_LIMITS.deterministicOverflowBoundaryBytes,
      completeRawEnvelope: false,
      capturedBytes: null,
      capturedSha256: null,
      truncatedBytes: 0,
      silentDrop: false,
      presentedAsComplete: false
    });
  }
  const capturedBytes = Buffer.from(source);
  return Object.freeze({
    accepted: true,
    terminalStatus: "CAPTURED_COMPLETE",
    receivedBytes: source.length,
    receivedSha256,
    captureLimitBytes: FUTURE_QUALIFICATION_EXECUTION_LIMITS.completeRawEnvelopeCaptureBytes,
    overflowBoundaryBytes: FUTURE_QUALIFICATION_EXECUTION_LIMITS.deterministicOverflowBoundaryBytes,
    completeRawEnvelope: true,
    capturedBytes,
    capturedSha256: sha256(capturedBytes),
    truncatedBytes: 0,
    silentDrop: false,
    presentedAsComplete: true
  });
}

export function createQualificationExecutionLedger(slotIds) {
  const ids = uniqueStrings(slotIds, "FUTURE_QUALIFICATION_SLOT_IDS_REQUIRED");
  return Object.freeze({
    schemaVersion: "1.0",
    slotOrder: Object.freeze([...ids]),
    slots: Object.freeze(Object.fromEntries(ids.map((slotId) => [slotId, Object.freeze({
      slotId,
      consumed: false,
      terminal: false,
      terminalStatus: null,
      envelopeReceipt: null
    })]))),
    executionClosed: false,
    evaluatorLocked: true
  });
}

function replaceSlot(ledger, slotId, replacement, extra = {}) {
  return Object.freeze({
    ...ledger,
    ...extra,
    slots: Object.freeze({ ...ledger.slots, [slotId]: Object.freeze(replacement) })
  });
}

export function consumeQualificationSlot(ledger, slotId) {
  assert.ok(ledger?.slots && Object.hasOwn(ledger.slots, slotId), "FUTURE_QUALIFICATION_SLOT_UNKNOWN");
  const slot = ledger.slots[slotId];
  assert.equal(slot.consumed, false, "FUTURE_QUALIFICATION_SLOT_ALREADY_CONSUMED");
  assert.equal(ledger.executionClosed, false, "FUTURE_QUALIFICATION_EXECUTION_ALREADY_CLOSED");
  return replaceSlot(ledger, slotId, { ...slot, consumed: true });
}

function usageReceipt(usage) {
  if (usage === null || usage === undefined) return null;
  assert.ok(usage && typeof usage === "object" && !Array.isArray(usage),
    "FUTURE_QUALIFICATION_USAGE_INVALID");
  const keys = ["inputTokens", "outputTokens", "reasoningTokens", "totalTokens"];
  for (const key of keys) {
    if (Object.hasOwn(usage, key)) assert.ok(Number.isInteger(usage[key]) && usage[key] >= 0,
      "FUTURE_QUALIFICATION_USAGE_INVALID");
  }
  return Object.freeze(Object.fromEntries(keys.filter((key) => Object.hasOwn(usage, key)).map((key) => [key, usage[key]])));
}

function costReceipt(cost) {
  if (cost === null || cost === undefined) return null;
  assert.ok(cost && typeof cost === "object" && !Array.isArray(cost), "FUTURE_QUALIFICATION_COST_INVALID");
  assert.ok(Number.isFinite(cost.amount) && cost.amount >= 0, "FUTURE_QUALIFICATION_COST_INVALID");
  assert.equal(typeof cost.currency, "string", "FUTURE_QUALIFICATION_COST_INVALID");
  return Object.freeze({ amount: cost.amount, currency: cost.currency });
}

export function recordQualificationEnvelope(ledger, slotId, {
  providerStatus,
  incompleteReason = null,
  structuredOutputPresent,
  usage = null,
  cost = null,
  rawEnvelopeBytes
}) {
  assert.ok(ledger?.slots && Object.hasOwn(ledger.slots, slotId), "FUTURE_QUALIFICATION_SLOT_UNKNOWN");
  const slot = ledger.slots[slotId];
  assert.equal(slot.consumed, true, "FUTURE_QUALIFICATION_SLOT_NOT_CONSUMED");
  assert.equal(slot.terminal, false, "FUTURE_QUALIFICATION_SLOT_ALREADY_TERMINAL");
  assert.ok(Object.values(PROVIDER_TERMINAL_STATUS).includes(providerStatus),
    "FUTURE_QUALIFICATION_PROVIDER_STATUS_INVALID");
  assert.equal(typeof structuredOutputPresent, "boolean", "FUTURE_QUALIFICATION_OUTPUT_PRESENCE_REQUIRED");
  if (providerStatus === PROVIDER_TERMINAL_STATUS.INCOMPLETE) {
    assert.equal(typeof incompleteReason, "string", "FUTURE_QUALIFICATION_INCOMPLETE_REASON_REQUIRED");
    assert.ok(incompleteReason.length > 0, "FUTURE_QUALIFICATION_INCOMPLETE_REASON_REQUIRED");
  } else {
    assert.equal(incompleteReason, null, "FUTURE_QUALIFICATION_COMPLETED_REASON_MUST_BE_NULL");
  }
  const capture = captureRawEnvelope(rawEnvelopeBytes);
  const terminalStatus = !capture.accepted
    ? "RAW_ENVELOPE_OVERFLOW"
    : providerStatus === PROVIDER_TERMINAL_STATUS.INCOMPLETE
      ? "PROVIDER_INCOMPLETE"
      : structuredOutputPresent
        ? "COMPLETED_WITH_OUTPUT"
        : "TERMINAL_MISSING_OUTPUT";
  const receipt = Object.freeze({
    slotId,
    providerStatus,
    incompleteReason,
    structuredOutputPresent,
    usage: usageReceipt(usage),
    cost: costReceipt(cost),
    terminalStatus,
    completeRawEnvelope: capture.completeRawEnvelope,
    rawEnvelopeBytes: capture.accepted ? capture.receivedBytes : null,
    rawEnvelopeSha256: capture.accepted ? capture.capturedSha256 : null,
    overflowReceipt: capture.accepted ? null : Object.freeze({
      receivedBytes: capture.receivedBytes,
      receivedSha256: capture.receivedSha256,
      limitBytes: capture.captureLimitBytes,
      overflowBoundaryBytes: capture.overflowBoundaryBytes,
      truncatedBytes: capture.truncatedBytes,
      silentDrop: capture.silentDrop,
      presentedAsComplete: capture.presentedAsComplete
    })
  });
  return replaceSlot(ledger, slotId, {
    ...slot,
    terminal: true,
    terminalStatus,
    envelopeReceipt: receipt
  });
}

export function closeQualificationExecution(ledger) {
  assert.equal(ledger.executionClosed, false, "FUTURE_QUALIFICATION_EXECUTION_ALREADY_CLOSED");
  assert.equal(ledger.slotOrder.every((slotId) => ledger.slots[slotId].consumed), true,
    "FUTURE_QUALIFICATION_UNCONSUMED_SLOT");
  assert.equal(ledger.slotOrder.every((slotId) => ledger.slots[slotId].terminal), true,
    "FUTURE_QUALIFICATION_UNTERMINAL_SLOT");
  return Object.freeze({ ...ledger, executionClosed: true, evaluatorLocked: true });
}

export function openQualificationEvaluator(ledger) {
  assert.equal(ledger.executionClosed, true, "FUTURE_QUALIFICATION_EVALUATOR_LOCKED_UNTIL_EXECUTION_CLOSURE");
  assert.equal(ledger.slotOrder.every((slotId) => ledger.slots[slotId].terminal), true,
    "FUTURE_QUALIFICATION_EVALUATOR_LOCKED_UNTIL_TERMINAL_OUTPUTS");
  return Object.freeze({ ...ledger, evaluatorLocked: false });
}
