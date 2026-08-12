import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ACTION_SCHEMA_VERSION, normalizeAndValidateProviderActionCore } from "../qualification/synthetic-executive/scripts/action-broker.mjs";
import { seal, sha256Bytes, writeExclusiveJson } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import { materializeV2ProviderVisibleCase } from "../qualification/synthetic-executive/v2-held-out-corpus/scripts/v2-visible-assembler.mjs";
import {
  PROVIDER_RESPONSE_BODY_LIMIT_BYTES,
  PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES,
  SafeProviderFailure
} from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";
import {
  QualificationResponsesClient,
  loadQualificationProviderProfile
} from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs";

const serializedRequest = JSON.stringify({ model: "gpt-5.6-sol", input: "offline response-boundary fixture" });
const requestHash = sha256Bytes(Buffer.from(serializedRequest, "utf8"));
const providerAttemptIdentity = "response-boundary-provider-attempt-01";

function validAction({ episodeId = "KE-V2-C14", observedStateHash = "0".repeat(64), actionId = "action-ke-v2-c14-01", evidenceId = "evidence-01" } = {}) {
  return {
    schemaVersion: ACTION_SCHEMA_VERSION,
    actionId,
    episodeId,
    executiveState: "CASE_OPEN",
    observedStateHash,
    factualFindings: ["Purpose-neutral visible finding."],
    uncertainties: ["Evaluator material remains hidden."],
    confidence: 0.7,
    boundedRationaleSummary: "Proceed through the sealed reconstruction transition.",
    prohibitedOperations: ["provider tools", "source mutation", "production execution", "evaluator access"],
    decision: {
      actionType: "RECONSTRUCT_EPISODE",
      details: {},
      evidenceReferences: [evidenceId],
      memoryReferences: [],
      authorityClass: "NO_NEW_AUTHORITY"
    }
  };
}

function responseObject({ actionCore = validAction(), status = "completed", incompleteReason = null, model = "gpt-5.6-sol", providerStatus = null, error = null } = {}) {
  const output = status === "completed" ? [{ type: "message", status: "completed", content: [{ type: "output_text", text: JSON.stringify(actionCore) }] }]
    : [{ type: "message", status: "incomplete", content: [{ type: "output_text", text: JSON.stringify(actionCore) }] }];
  return {
    id: "resp_response_boundary_fixture",
    model,
    status: providerStatus || status,
    created_at: 1_786_471_200,
    completed_at: status === "completed" ? 1_786_471_201 : null,
    incomplete_details: incompleteReason ? { reason: incompleteReason } : null,
    output,
    usage: { input_tokens: 101, input_tokens_details: { cached_tokens: 0 }, output_tokens: status === "completed" ? 23 : 2000, output_tokens_details: { reasoning_tokens: 7 }, total_tokens: status === "completed" ? 124 : 2101 },
    error
  };
}

function exactlySizedJson(targetBytes, options = {}) {
  const payload = { ...responseObject(options), fixture_padding: "" };
  const empty = Buffer.byteLength(JSON.stringify(payload), "utf8");
  assert.ok(empty <= targetBytes, `fixture base exceeds target ${targetBytes}`);
  payload.fixture_padding = "x".repeat(targetBytes - empty);
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  assert.equal(bytes.length, targetBytes);
  return bytes;
}

function exactlySizedMultibyteJson(targetBytes) {
  const payload = { ...responseObject(), fixture_padding: "" };
  const empty = Buffer.byteLength(JSON.stringify(payload), "utf8");
  const remaining = targetBytes - empty;
  assert.ok(remaining > 2);
  payload.fixture_padding = "é".repeat(Math.floor(remaining / 2)) + (remaining % 2 ? "x" : "");
  const bytes = Buffer.from(JSON.stringify(payload), "utf8");
  assert.equal(bytes.length, targetBytes);
  assert.ok(payload.fixture_padding.length < Buffer.byteLength(payload.fixture_padding, "utf8"));
  return bytes;
}

function streamedResponse(bytes, { status = 200, contentLength, chunkBytes = 4093, contentType = "application/json" } = {}) {
  let offset = 0;
  const body = new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) { controller.close(); return; }
      const end = Math.min(bytes.length, offset + chunkBytes);
      controller.enqueue(bytes.subarray(offset, end));
      offset = end;
    }
  });
  const headers = { "content-type": contentType, "x-request-id": "req_response_boundary_fixture" };
  if (contentLength !== undefined) headers["content-length"] = String(contentLength);
  return new Response(body, { status, headers });
}

async function clientFor(fetchImpl) {
  const profile = await loadQualificationProviderProfile();
  return new QualificationResponsesClient({
    profile,
    credentialHandle: { withCredential: async (callback) => callback("offline-mock-credential") },
    fetchImpl
  });
}

async function runBytes(bytes, responseOptions = {}) {
  const client = await clientFor(async () => streamedResponse(bytes, responseOptions));
  try {
    const result = await client.decisionTurn({ serializedRequest, requestHash, providerAttemptIdentity });
    return { result, error: null, counts: client.counts };
  } catch (error) {
    return { result: null, error, counts: client.counts };
  }
}

async function sealSafeReadback(value, label) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-response-boundary-"));
  try {
    const record = seal({ schemaVersion: "1.0", receiptType: "SAFE_RESPONSE_BOUNDARY_TEST_RECEIPT", label, providerDiagnostics: value.providerDiagnostics, safeResponseEvidence: value.safeResponseEvidence }, "receiptHash");
    const target = path.join(temporary, "sealed.json");
    await writeExclusiveJson(target, record);
    return JSON.parse(await readFile(target, "utf8"));
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

test("in-limit response boundaries use actual streamed bytes and complete hashes", async () => {
  for (const target of [65_535, 65_536, 65_537, 87_077, PROVIDER_RESPONSE_BODY_LIMIT_BYTES]) {
    const bytes = exactlySizedJson(target);
    const { result, error, counts } = await runBytes(bytes);
    assert.equal(error, null, `unexpected response failure at ${target}`);
    assert.deepEqual(counts, { metadataRequests: 0, inferenceRequests: 1, retries: 0 });
    assert.equal(result.safeResponseEvidence.observedResponseByteLength, target);
    assert.equal(result.safeResponseEvidence.rawResponseByteLength, target);
    assert.equal(result.safeResponseEvidence.rawResponseSha256, sha256Bytes(bytes));
    assert.equal(result.safeResponseEvidence.responseBodySha256Classification, "COMPLETE");
    assert.equal(result.safeResponseEvidence.localResponseHardLimitClassification, "WITHIN_LIMIT");
    assert.equal(result.providerDiagnostics.responseByteLength, target);
    assert.equal(result.providerDiagnostics.responseByteLengthClassification, "EXACT");
  }
});

test("both exact 87,077-byte outcomes survive adapter through durable safe-evidence readback", async () => {
  const completedBytes = exactlySizedJson(87_077);
  const completed = await runBytes(completedBytes, { contentLength: 64 });
  assert.equal(completed.error, null);
  const completedReceipt = await sealSafeReadback(completed.result, "COMPLETED_87077");
  assert.equal(completedReceipt.safeResponseEvidence.observedResponseByteLength, 87_077);
  assert.equal(completedReceipt.safeResponseEvidence.responseStatus, "completed");
  assert.equal(completedReceipt.safeResponseEvidence.rawResponseSha256, sha256Bytes(completedBytes));

  const incompleteBytes = exactlySizedJson(87_077, { status: "incomplete", incompleteReason: "max_output_tokens" });
  const incomplete = await runBytes(incompleteBytes, { contentLength: 2_000_000 });
  assert.ok(incomplete.error instanceof SafeProviderFailure);
  assert.equal(incomplete.error.code, "PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS");
  const incompleteReceipt = await sealSafeReadback(incomplete.error, "INCOMPLETE_87077");
  assert.equal(incompleteReceipt.safeResponseEvidence.observedResponseByteLength, 87_077);
  assert.equal(incompleteReceipt.safeResponseEvidence.responseStatus, "incomplete");
  assert.equal(incompleteReceipt.safeResponseEvidence.incompleteReason, "max_output_tokens");
  assert.equal(incompleteReceipt.safeResponseEvidence.rawResponseSha256, sha256Bytes(incompleteBytes));
  assert.doesNotMatch(JSON.stringify([completedReceipt, incompleteReceipt]), /fixture_padding|output_text|boundedRationaleSummary/);
});

test("the one-byte overflow probe is partial, explicit, and never parses or persists a body prefix", async () => {
  const bytes = exactlySizedJson(PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES);
  const { error, counts } = await runBytes(bytes, { contentLength: 1 });
  assert.ok(error instanceof SafeProviderFailure);
  assert.equal(error.code, "PROVIDER_RESPONSE_LOCAL_HARD_LIMIT_EXCEEDED");
  assert.deepEqual(counts, { metadataRequests: 0, inferenceRequests: 1, retries: 0 });
  assert.equal(error.safeResponseEvidence.observedResponseByteLength, PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES);
  assert.equal(error.safeResponseEvidence.rawResponseByteLength, PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES);
  assert.equal(error.safeResponseEvidence.rawResponseSha256, sha256Bytes(bytes.subarray(0, PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES)));
  assert.equal(error.safeResponseEvidence.responseBodySha256Classification, "PARTIAL");
  assert.equal(error.safeResponseEvidence.localResponseHardLimitClassification, "EXCEEDED");
  assert.equal(error.safeResponseEvidence.responseStatus, "ABSENT");
  assert.equal(error.providerDiagnostics.responseByteLengthClassification, "LOWER_BOUND");
  const receipt = await sealSafeReadback(error, "LOCAL_HARD_LIMIT");
  assert.doesNotMatch(JSON.stringify(receipt), /fixture_padding|output_text|Bearer|authorization/i);
});

test("multibyte, absent, inaccurate and chunked Content-Length paths remain byte-accurate", async () => {
  const target = 87_077;
  const bytes = exactlySizedMultibyteJson(target);
  for (const options of [
    { chunkBytes: 127 },
    { contentLength: 1, chunkBytes: 509 },
    { contentLength: 9_999_999, chunkBytes: 1021 }
  ]) {
    const { result, error } = await runBytes(bytes, options);
    assert.equal(error, null);
    assert.equal(result.safeResponseEvidence.observedResponseByteLength, target);
    assert.equal(result.safeResponseEvidence.rawResponseSha256, sha256Bytes(bytes));
  }
});

test("malformed, model-mismatch, failed, other-incomplete, valid-action and schema-invalid outcomes retain semantics", async () => {
  const malformed = await runBytes(Buffer.from('{"broken":', "utf8"));
  assert.equal(malformed.error.code, "PROVIDER_JSON_INVALID");
  assert.equal(malformed.error.safeResponseEvidence.responseBodySha256Classification, "COMPLETE");

  const wrongModel = await runBytes(Buffer.from(JSON.stringify(responseObject({ model: "gpt-wrong" })), "utf8"));
  assert.equal(wrongModel.error.code, "MODEL_ID_MISMATCH");

  const failed = await runBytes(Buffer.from(JSON.stringify(responseObject({ providerStatus: "failed", error: { type: "server_error", code: "failed", param: null, message: "bounded failure" } })), "utf8"));
  assert.equal(failed.error.code, "PROVIDER_RESPONSE_FAILED");

  const otherIncomplete = await runBytes(Buffer.from(JSON.stringify(responseObject({ status: "incomplete", incompleteReason: "content_filter" })), "utf8"));
  assert.equal(otherIncomplete.error.code, "PROVIDER_RESPONSE_INCOMPLETE_OTHER");

  const { episode, materialization } = await materializeV2ProviderVisibleCase("KE-V2-C14");
  const observedStateHash = "0".repeat(64);
  const actionId = "action-ke-v2-c14-01";
  const evidenceId = materialization.canonicalArtifactOrder[0];
  const valid = validAction({ episodeId: episode.episodeId, observedStateHash, actionId, evidenceId });
  const accepted = await runBytes(Buffer.from(JSON.stringify(responseObject({ actionCore: valid })), "utf8"));
  assert.equal(accepted.error, null);
  assert.equal(normalizeAndValidateProviderActionCore(accepted.result.actionCore, { episode, memoryIds: [], currentState: "CASE_OPEN", allowedAuthorityClasses: ["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"], actionId, observedStateHash }).actionType, "RECONSTRUCT_EPISODE");

  const invalid = await runBytes(Buffer.from(JSON.stringify(responseObject({ actionCore: { not: "an executive action" } })), "utf8"));
  assert.equal(invalid.error, null);
  assert.throws(() => normalizeAndValidateProviderActionCore(invalid.result.actionCore, { episode, memoryIds: [], currentState: "CASE_OPEN", allowedAuthorityClasses: ["NO_NEW_AUTHORITY"], actionId, observedStateHash }));
});
