import assert from "node:assert/strict";
import test from "node:test";
import {
  QualificationResponsesClient,
  QUALIFICATION_RESPONSE_ABSENT,
  assertQualificationSafeResponseEvidence,
  loadQualificationProviderProfile
} from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs";
import { sha256Bytes } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import { SafeProviderFailure } from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";

const request = JSON.stringify({ model: "gpt-5.6-sol", input: "offline fixture" });
const requestHash = sha256Bytes(Buffer.from(request, "utf8"));
const attemptIdentity = "response-evidence-fixture-attempt-01";

function responseBody(overrides = {}) {
  return {
    id: "resp_fixture_01",
    model: "gpt-5.6-sol",
    status: "completed",
    created_at: 1_786_471_200,
    completed_at: 1_786_471_201,
    output: [{
      id: "msg_fixture_01",
      type: "message",
      status: "completed",
      role: "assistant",
      content: [{ type: "output_text", text: JSON.stringify({ action: "fixture" }) }]
    }],
    usage: {
      input_tokens: 101,
      input_tokens_details: { cached_tokens: 11 },
      output_tokens: 23,
      output_tokens_details: { reasoning_tokens: 7 },
      total_tokens: 124
    },
    ...overrides
  };
}

async function clientFor(fetchImpl) {
  const profile = await loadQualificationProviderProfile();
  return new QualificationResponsesClient({
    profile,
    credentialHandle: { withCredential: async (callback) => callback("offline-mock-credential") },
    fetchImpl
  });
}

function mockJson(payload, { status = 200, headers = {} } = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "x-request-id": "req_fixture_01", ...headers }
  });
}

async function captureFailure(payload, options = {}) {
  const client = await clientFor(async () => mockJson(payload, options));
  let captured;
  await assert.rejects(
    client.decisionTurn({ serializedRequest: request, requestHash, providerAttemptIdentity: attemptIdentity, signal: new AbortController().signal }),
    (error) => { captured = error; return error instanceof SafeProviderFailure; }
  );
  assert.deepEqual(client.counts, { metadataRequests: 0, inferenceRequests: 1, retries: 0 });
  return captured;
}

test("completed Responses evidence is additive and preserves structured-action behavior", async () => {
  const body = responseBody();
  const serialized = JSON.stringify(body);
  const client = await clientFor(async () => mockJson(body));
  const result = await client.decisionTurn({ serializedRequest: request, requestHash, providerAttemptIdentity: attemptIdentity, signal: new AbortController().signal });
  assert.deepEqual(result.actionCore, { action: "fixture" });
  assert.equal(result.responseStatus, "completed");
  assert.deepEqual(result.usage, { complete: true, inputTokens: 101, cachedInputTokens: 11, outputTokens: 23, reasoningTokens: 7, totalTokens: 124 });
  assert.deepEqual(client.counts, { metadataRequests: 0, inferenceRequests: 1, retries: 0 });
  const evidence = result.safeResponseEvidence;
  assertQualificationSafeResponseEvidence(evidence, { requestHash, providerAttemptIdentity: attemptIdentity });
  assert.equal(evidence.httpStatus, 200);
  assert.equal(evidence.responseContentType, "application/json");
  assert.equal(evidence.rawResponseByteLength, Buffer.byteLength(serialized));
  assert.equal(evidence.rawResponseSha256, sha256Bytes(Buffer.from(serialized)));
  assert.equal(evidence.observedResponseByteLength, Buffer.byteLength(serialized));
  assert.equal(evidence.responseBodySha256Classification, "COMPLETE");
  assert.equal(evidence.localResponseHardLimitClassification, "WITHIN_LIMIT");
  assert.equal(evidence.safeProviderRequestId, "req_fixture_01");
  assert.equal(evidence.providerResponseId, "resp_fixture_01");
  assert.equal(evidence.returnedModel, "gpt-5.6-sol");
  assert.equal(evidence.responseStatus, "completed");
  assert.equal(evidence.incompleteReason, QUALIFICATION_RESPONSE_ABSENT);
  assert.deepEqual(evidence.outputItemTypes, ["message"]);
  assert.deepEqual(evidence.outputItemStatuses, ["completed"]);
  assert.equal(evidence.partialOutput.present, true);
  assert.ok(evidence.partialOutput.byteLength > 0);
});

test("max-output incomplete responses are terminal, scoreable evidence with or without visible partial output", async () => {
  const withOutput = await captureFailure(responseBody({
    status: "incomplete",
    completed_at: null,
    incomplete_details: { reason: "max_output_tokens" },
    output: [{ type: "message", status: "incomplete", content: [{ type: "output_text", text: "bounded partial output" }] }]
  }));
  assert.equal(withOutput.code, "PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS");
  assert.equal(withOutput.safeResponseEvidence.responseStatus, "incomplete");
  assert.equal(withOutput.safeResponseEvidence.incompleteReason, "max_output_tokens");
  assert.equal(withOutput.safeResponseEvidence.partialOutput.present, true);
  assert.equal(withOutput.safeResponseEvidence.partialOutput.byteLength, Buffer.byteLength("bounded partial output"));

  const withoutOutput = await captureFailure(responseBody({
    status: "incomplete",
    completed_at: null,
    incomplete_details: { reason: "max_output_tokens" },
    output: [{ type: "reasoning", status: "incomplete", encrypted_content: "must-not-survive" }]
  }));
  assert.equal(withoutOutput.code, "PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS");
  assert.deepEqual(withoutOutput.safeResponseEvidence.outputItemTypes, ["reasoning"]);
  assert.equal(withoutOutput.safeResponseEvidence.partialOutput.present, false);
  assert.equal(withoutOutput.safeResponseEvidence.partialOutput.byteLength, 0);
  assert.equal(withoutOutput.safeResponseEvidence.partialOutput.sha256, QUALIFICATION_RESPONSE_ABSENT);
  assert.doesNotMatch(JSON.stringify(withoutOutput.safeResponseEvidence), /must-not-survive/);
});

test("other incomplete and nonterminal provider statuses remain distinctly classified without retry", async () => {
  const fixtures = [
    ["incomplete", "content_filter", "PROVIDER_RESPONSE_INCOMPLETE_OTHER"],
    ["failed", null, "PROVIDER_RESPONSE_FAILED"],
    ["cancelled", null, "PROVIDER_RESPONSE_CANCELLED"],
    ["queued", null, "PROVIDER_RESPONSE_QUEUED"],
    ["in_progress", null, "PROVIDER_RESPONSE_IN_PROGRESS"]
  ];
  for (const [status, reason, expectedCode] of fixtures) {
    const failure = await captureFailure(responseBody({
      status,
      completed_at: null,
      incomplete_details: reason ? { reason } : null,
      output: []
    }));
    assert.equal(failure.code, expectedCode);
    assert.equal(failure.safeResponseEvidence.responseStatus, status);
  }
});

test("malformed JSON, wrong model, and absent optional fields retain bounded response evidence", async () => {
  const malformedBytes = Buffer.from('{"id":"resp_broken"', "utf8");
  const malformedClient = await clientFor(async () => new Response(malformedBytes, { status: 200, headers: { "content-type": "application/json", "x-request-id": "req_malformed" } }));
  let malformed;
  await assert.rejects(
    malformedClient.decisionTurn({ serializedRequest: request, requestHash, providerAttemptIdentity: attemptIdentity }),
    (error) => { malformed = error; return error.code === "PROVIDER_JSON_INVALID"; }
  );
  assert.equal(malformed.safeResponseEvidence.rawResponseByteLength, malformedBytes.length);
  assert.equal(malformed.safeResponseEvidence.rawResponseSha256, sha256Bytes(malformedBytes));
  assert.equal(malformed.safeResponseEvidence.responseBodySha256Classification, "COMPLETE");
  assert.equal(malformed.safeResponseEvidence.providerResponseId, QUALIFICATION_RESPONSE_ABSENT);

  const wrongModel = await captureFailure(responseBody({ model: "gpt-fixture-wrong" }));
  assert.equal(wrongModel.code, "MODEL_ID_MISMATCH");
  assert.equal(wrongModel.safeResponseEvidence.returnedModel, "gpt-fixture-wrong");

  const absent = await captureFailure({ model: "gpt-5.6-sol", status: "completed" }, { headers: { "x-request-id": "" } });
  assert.equal(absent.code, "PROVIDER_STRUCTURED_OUTPUT_MISSING");
  assert.equal(absent.safeResponseEvidence.safeProviderRequestId, QUALIFICATION_RESPONSE_ABSENT);
  assert.equal(absent.safeResponseEvidence.providerResponseId, QUALIFICATION_RESPONSE_ABSENT);
  assert.equal(absent.safeResponseEvidence.createdAtEpochSeconds, QUALIFICATION_RESPONSE_ABSENT);
  assert.equal(absent.safeResponseEvidence.usage.complete, false);
});

test("request and provider-attempt bindings reject mismatch before evidence can be accepted", async () => {
  let dispatches = 0;
  const client = await clientFor(async () => { dispatches += 1; return mockJson(responseBody()); });
  await assert.rejects(
    client.decisionTurn({ serializedRequest: request, requestHash: "0".repeat(64), providerAttemptIdentity: attemptIdentity }),
    /serialized request hash differs/
  );
  await assert.rejects(
    client.decisionTurn({ serializedRequest: request, requestHash, providerAttemptIdentity: "Bearer sk-fixture-secret-123456789" }),
    /provider attempt identity is unsafe/
  );
  assert.equal(dispatches, 0);

  const accepted = await (await clientFor(async () => mockJson(responseBody()))).decisionTurn({ serializedRequest: request, requestHash, providerAttemptIdentity: attemptIdentity });
  assert.throws(() => assertQualificationSafeResponseEvidence(accepted.safeResponseEvidence, { requestHash: "f".repeat(64), providerAttemptIdentity: attemptIdentity }), /request identity differs/);
  assert.throws(() => assertQualificationSafeResponseEvidence(accepted.safeResponseEvidence, { requestHash, providerAttemptIdentity: "different-attempt" }), /attempt identity differs/);
});

test("safe errors redact secret-shaped response messages and never retain prohibited headers or raw output", async () => {
  const secret = "sk-fixture-supersecretvalue123456789";
  const body = responseBody({
    status: "failed",
    output: [{ type: "reasoning", status: "failed", encrypted_content: "raw-reasoning-must-not-survive" }],
    error: {
      type: "server_error",
      code: "provider_failure",
      param: "response",
      message: `failed with Bearer ${secret} for project-secret999 and customer@example.test`
    }
  });
  const failure = await captureFailure(body, {
    headers: {
      authorization: `Bearer ${secret}`,
      cookie: "session=forbidden",
      "openai-organization": "org-secret999"
    }
  });
  const serializedEvidence = JSON.stringify(failure.safeResponseEvidence);
  assert.equal(failure.code, "PROVIDER_RESPONSE_FAILED");
  assert.equal(failure.safeResponseEvidence.safeError.type, "server_error");
  assert.match(failure.safeResponseEvidence.safeError.message, /REDACTED/);
  assert.doesNotMatch(serializedEvidence, /supersecret|raw-reasoning|session=|org-secret|customer@example|authorization|cookie/i);
  assert.ok(Buffer.byteLength(serializedEvidence, "utf8") < 4096);
});
