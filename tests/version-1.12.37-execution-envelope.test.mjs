import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";

import {
  FUTURE_QUALIFICATION_EXECUTION_LIMITS,
  assertSerializedRequestWithinLimit,
  captureRawEnvelope,
  closeQualificationExecution,
  consumeQualificationSlot,
  createQualificationExecutionLedger,
  openQualificationEvaluator,
  recordQualificationEnvelope
} from "../qualification/synthetic-executive/future-independent-qualification-contract/execution-envelope.mjs";

function deterministicBytes(length) {
  const bytes = Buffer.alloc(length);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = index % 251;
  return bytes;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("future execution limits are exact and the request ceiling fails closed", () => {
  assert.deepEqual(FUTURE_QUALIFICATION_EXECUTION_LIMITS, {
    maximumOutputTokensPerCase: 4000,
    maximumSerializedRequestBytes: 64000,
    completeRawEnvelopeCaptureBytes: 1048576,
    deterministicOverflowBoundaryBytes: 1048577
  });
  const within = assertSerializedRequestWithinLimit({ payload: "x".repeat(63000) });
  assert.ok(within.bytes <= 64000);
  assert.throws(
    () => assertSerializedRequestWithinLimit({ payload: "x".repeat(64000) }),
    /FUTURE_QUALIFICATION_REQUEST_BYTES_EXCEEDED/
  );
});

test("exactly 1,048,576 raw bytes are retained byte-identically", () => {
  const source = deterministicBytes(1048576);
  const capture = captureRawEnvelope(source);
  assert.equal(capture.accepted, true);
  assert.equal(capture.completeRawEnvelope, true);
  assert.equal(capture.receivedBytes, 1048576);
  assert.equal(capture.truncatedBytes, 0);
  assert.equal(capture.silentDrop, false);
  assert.equal(capture.presentedAsComplete, true);
  assert.equal(Buffer.compare(capture.capturedBytes, source), 0);
  assert.equal(capture.receivedSha256, sha256(source));
  assert.equal(capture.capturedSha256, sha256(source));
  source[0] ^= 0xff;
  assert.notEqual(capture.capturedBytes[0], source[0], "capture must not alias caller bytes");
});

test("exactly 1,048,577 raw bytes are rejected without truncation or false completion", () => {
  const source = deterministicBytes(1048577);
  const capture = captureRawEnvelope(source);
  assert.equal(capture.accepted, false);
  assert.equal(capture.terminalStatus, "OVERFLOW_REJECTED");
  assert.equal(capture.receivedBytes, 1048577);
  assert.equal(capture.receivedSha256, sha256(source));
  assert.equal(capture.completeRawEnvelope, false);
  assert.equal(capture.capturedBytes, null);
  assert.equal(capture.capturedSha256, null);
  assert.equal(capture.truncatedBytes, 0);
  assert.equal(capture.silentDrop, false);
  assert.equal(capture.presentedAsComplete, false);
});

test("slots are consumed once and the evaluator remains locked until terminal closure", () => {
  const raw = Buffer.from("offline-envelope", "utf8");
  let ledger = createQualificationExecutionLedger(["SLOT-A", "SLOT-B"]);
  assert.throws(() => openQualificationEvaluator(ledger), /EVALUATOR_LOCKED/);
  ledger = consumeQualificationSlot(ledger, "SLOT-A");
  assert.throws(() => consumeQualificationSlot(ledger, "SLOT-A"), /ALREADY_CONSUMED/);
  ledger = recordQualificationEnvelope(ledger, "SLOT-A", {
    providerStatus: "completed",
    incompleteReason: null,
    structuredOutputPresent: false,
    usage: { inputTokens: 10, outputTokens: 0, reasoningTokens: 0, totalTokens: 10 },
    cost: { amount: 0, currency: "USD" },
    rawEnvelopeBytes: raw
  });
  assert.equal(ledger.slots["SLOT-A"].terminalStatus, "TERMINAL_MISSING_OUTPUT");
  ledger = consumeQualificationSlot(ledger, "SLOT-B");
  ledger = recordQualificationEnvelope(ledger, "SLOT-B", {
    providerStatus: "incomplete",
    incompleteReason: "output_limit",
    structuredOutputPresent: false,
    usage: null,
    cost: null,
    rawEnvelopeBytes: raw
  });
  assert.equal(ledger.slots["SLOT-B"].terminalStatus, "PROVIDER_INCOMPLETE");
  assert.throws(() => openQualificationEvaluator(ledger), /EVALUATOR_LOCKED/);
  ledger = closeQualificationExecution(ledger);
  ledger = openQualificationEvaluator(ledger);
  assert.equal(ledger.evaluatorLocked, false);
});

test("an overflow receipt never overwrites a prior complete capture", () => {
  const complete = captureRawEnvelope(deterministicBytes(1048576));
  const completeHash = complete.capturedSha256;
  const overflow = captureRawEnvelope(deterministicBytes(1048577));
  assert.equal(overflow.accepted, false);
  assert.equal(complete.accepted, true);
  assert.equal(complete.capturedSha256, completeHash);
  assert.equal(overflow.capturedSha256, null);
});
