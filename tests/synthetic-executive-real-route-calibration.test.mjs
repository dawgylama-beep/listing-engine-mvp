import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { validateRealRouteReleaseRecord } from "../benchmarks/blind-object-v2/scripts/real-route-release-qualification.mjs";
import { assertQualifiedReleaseState } from "../benchmarks/blind-object-v2/scripts/release-qualification.mjs";
import { passCalibrationActionThroughRealBroker } from "../qualification/synthetic-executive/calibration/scripts/real-route-broker.mjs";
import { CredentialHandle, resolveApprovedCredential } from "../qualification/synthetic-executive/calibration/scripts/real-route-credential.mjs";
import { ExternalCalibrationGovernor } from "../qualification/synthetic-executive/calibration/scripts/real-route-governor.mjs";
import { validateRealRouteAuthority } from "../qualification/synthetic-executive/calibration/scripts/real-route-authority.mjs";
import { calibrationArtifactBindings, conservativeMaximumCostUsd, createCalibrationActionCoreSchema, observedStateHash, repositoryRoot } from "../qualification/synthetic-executive/calibration/scripts/real-route-profile.mjs";
import { OpenAIRealRouteClient } from "../qualification/synthetic-executive/calibration/scripts/real-route-provider.mjs";
import { NOT_RECEIVED, PROVIDER_RESPONSE_BODY_LIMIT_BYTES, REDACTED, assertNoSecretMaterial } from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";
import { runRealRouteCalibration } from "../qualification/synthetic-executive/calibration/scripts/run-real-route-calibration.mjs";
import { seal, sha256Json } from "../qualification/synthetic-executive/scripts/protocol.mjs";

const H40 = "a".repeat(40);
const H64 = "b".repeat(64);
const EMPTY_RECEIPT = Object.freeze({ receiptHash: "c".repeat(64) });
const UNCHANGED_CANONICAL_REQUEST_HASH = "73fa81d6d3fce8add2d8911682330b954b2653edfb43de4aa37ee02eea6d079e";

function validActionCore(calibrationCase, overrides = {}) {
  return {
    schemaVersion: "1.0", actionType: "RECONSTRUCT_EPISODE", actionId: "KE-CAL-001-ACTION-001",
    episodeId: "KE-CAL-001", executiveState: "INIT", observedStateHash: observedStateHash(calibrationCase),
    evidenceReferences: ["KE-CAL-001:EVIDENCE-001"], memoryReferences: [],
    factualFindings: ["The object is a blue ceramic mug.", "One handle is visible."],
    uncertainties: ["Maker, model, age, price, provenance, safety condition, and ownership are not supplied."],
    confidence: 0.92, boundedRationaleSummary: "Restates only the supplied synthetic calibration evidence.",
    requestedSuccessorState: "EPISODE_RECONSTRUCTED", authorityClass: "NO_NEW_AUTHORITY",
    prohibitedOperations: ["PRODUCTION_EXECUTION", "BENCHMARK_EXECUTION", "SHELL", "GIT", "SOURCE_EDIT", "DEPLOYMENT", "PROVIDER_TOOL", "ENGINEERING_WORKER"],
    details: {}, ...overrides
  };
}

function response(status, payload, requestId, { contentType = "application/json", rawBody = null, extraHeaders = {} } = {}) {
  const headers = { ...extraHeaders, "content-type": contentType };
  if (requestId !== undefined && requestId !== null) headers["x-request-id"] = requestId;
  return new Response(rawBody === null ? JSON.stringify(payload) : rawBody, { status, headers });
}

function fakeFetchSequence(artifacts, { metadataStatus = 200, metadataId = "gpt-5.6-sol", actionCore = validActionCore(artifacts.calibrationCase), usage = { input_tokens: 340, input_tokens_details: { cached_tokens: 0 }, output_tokens: 120, output_tokens_details: { reasoning_tokens: 70 }, total_tokens: 460 }, responseStatus = "completed" } = {}) {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), method: options.method, body: options.body || null, hasAuthorization: typeof options.headers?.authorization === "string" });
    if (calls.length === 1) return response(metadataStatus, metadataStatus === 200 ? { id: metadataId, object: "model", owned_by: "openai" } : { error: { type: "safe-test" } }, "req_meta_test");
    return response(200, { id: "resp_calibration_test", object: "response", model: "gpt-5.6-sol", status: responseStatus, output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(actionCore) }] }], ...(usage === undefined ? {} : { usage }) }, "req_infer_test");
  };
  return { calls, fetchImpl };
}

async function fixtureAuthority(artifacts, suffix, now = "2026-08-10T18:00:00.000Z") {
  const core = {
    schemaVersion: "1.0", authorityType: "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_ONLY", status: "AUTHORIZED",
    releaseIdentity: { version: "1.12.26", runtimeCommit: H40, runtimeTree: H40, sealCommit: H40, sealTree: H40, releaseRecordHash: H64 },
    readinessManifestHash: "d".repeat(64), priorCalibrationFailureResultHash: "e".repeat(64),
    providerProfileHash: artifacts.profile.profileHash, billingAttestationHash: artifacts.attestation.statementHash,
    exactModelId: "gpt-5.6-sol", endpointClass: "RESPONSES_API", calibrationCaseId: "KE-CAL-001",
    calibrationCaseHash: artifacts.calibrationCase.caseHash, calibrationPromptHash: artifacts.prompt.promptHash,
    promptByteCount: artifacts.prompt.byteCount, executiveActionSchemaHash: artifacts.executiveActionSchemaHash,
    inputTokenCeiling: 8000, outputTokenCeiling: 2000, maximumProviderCostUsd: 0.25,
    maximumMetadataAccessRequests: 1, maximumInferenceRequests: 1, maximumInferenceRetries: 0,
    maximumAgentToolCalls: 0, maximumEngineeringWorkerDispatches: 0, maximumWallClockDurationMs: 300000,
    resultRootRelativePath: `qualification-results/real-route-calibration-${suffix}`,
    singleUseIdentity: `calibration-use-${suffix.padEnd(48, "0")}`, createdAt: now,
    expiresAt: "2026-08-11T18:00:00.000Z",
    prohibitedActivities: ["TWELVE_CASE_QUALIFICATION", "PHASE_7_BENCHMARK_EXECUTION", "BENCHMARK_CONSENT_OR_RESERVATION", "PRODUCT_HANDLER_INVOCATION", "HISTORICAL_EPISODE_ACCESS", "ANALOGOUS_EPISODE_ACCESS", "NOVEL_EPISODE_ACCESS", "EVALUATOR_CONTROL_ACCESS", "EXECUTIVE_LESSON_CREATION_OR_PROMOTION", "ENGINEERING_WORKER_DISPATCH", "PRODUCTION_EXECUTION", "PRODUCT_MUTATION", "MERGE", "PREVIEW_DEPLOYMENT", "PRODUCTION_DEPLOYMENT", "ADDITIONAL_PROVIDER_REQUEST"],
    authoritySchemaHash: artifacts.authoritySchemaHash
  };
  return seal(core, "authorityHash");
}

async function runFixture({ suffix, fetchOptions, environment = { OPENAI_API_KEY: "unit-test-credential-without-provider-key-shape" }, fetchImpl, twice = false }) {
  const artifacts = await calibrationArtifactBindings();
  const externalRoot = await mkdtemp(path.join(os.tmpdir(), "ke-calibration-authority-"));
  const authorityPath = path.join(externalRoot, "authority.json");
  const authority = await fixtureAuthority(artifacts, suffix);
  const fake = fetchImpl ? { fetchImpl, calls: [] } : fakeFetchSequence(artifacts, fetchOptions);
  let tick = Date.parse("2026-08-10T18:00:00.000Z");
  const options = {
    authorityPath, fetchImpl: fake.fetchImpl, environment, dotenvPath: path.join(externalRoot, "missing.env"),
    now: () => new Date(tick += 1).toISOString(), nowMs: () => tick,
    authorityLoader: async () => ({ authority, authorityFileHash: "f".repeat(64), receipt: EMPTY_RECEIPT }),
    runtimeInspector: () => ({ trackedSourceClean: true })
  };
  const resultRoot = path.join(repositoryRoot, authority.resultRootRelativePath);
  try {
    const completed = await runRealRouteCalibration(options);
    if (twice) await assert.rejects(runRealRouteCalibration(options), /EEXIST|exist/i);
    const artifactText = await readFile(completed.resultPath, "utf8");
    return { completed, calls: fake.calls, artifactText };
  } finally {
    await rm(resultRoot, { recursive: true, force: true });
    await rm(externalRoot, { recursive: true, force: true });
  }
}

function inferenceFailureFetch(inferenceOutcome) {
  let calls = 0;
  return async () => {
    calls += 1;
    if (calls === 1) return response(200, { id: "gpt-5.6-sol", object: "model", owned_by: "openai" }, "req_meta_diagnostic");
    return typeof inferenceOutcome === "function" ? inferenceOutcome() : inferenceOutcome;
  };
}

function assertRejectedInferenceInvariant(completed, artifactText) {
  const result = completed.result;
  assert.equal(result.status, "REAL_ROUTE_CALIBRATION_PROVIDER_REJECTED");
  assert.equal(result.requestCounts.metadataAccessRequests, 1);
  assert.equal(result.requestCounts.inferenceRequests, 1);
  assert.equal(result.requestCounts.retries, 0);
  assert.equal(result.requestCounts.automaticModelRetries, 0);
  assert.equal(result.ledger.reservationCount, 1);
  assert.equal(result.ledger.completionCount, 1);
  assert.equal(result.ledger.reservationFinalizationAgree, true);
  assert.equal(result.cost.conservativeCostChargedUsd, 0.25);
  assert.equal(result.cost.missingUsageChargedAtFullReservation, true);
  assert.equal(completed.terminalReceipt.inferenceAuthorityConsumed, true);
  assert.equal(completed.terminalReceipt.reusable, false);
  assert.deepEqual(JSON.parse(artifactText).providerDiagnostics, result.providerDiagnostics);
  assertNoSecretMaterial(artifactText);
}

test("calibration profile and pending release pin the exact bounded route", async () => {
  const artifacts = await calibrationArtifactBindings();
  assert.equal(artifacts.profile.exactModelId, "gpt-5.6-sol");
  assert.equal(artifacts.profile.inferenceEndpoint, "v1/responses");
  assert.deepEqual(artifacts.profile.enabledTools, []);
  assert.equal(artifacts.prompt.byteCount <= 8000, true);
  assert.equal(conservativeMaximumCostUsd(artifacts.prompt.byteCount, artifacts.profile) <= 0.25, true);
  const release = JSON.parse(await readFile(path.join(repositoryRoot, "benchmarks/blind-object-v2/execution-release.json"), "utf8"));
  assert.equal(validateRealRouteReleaseRecord(release, { validateCurrentArtifacts: false }).valid, true);
  assert.equal(release.realRouteCalibrationAuthorized, true);
  assert.equal(release.blindQualificationAuthorized, false);
  for (const mode of ["PREFLIGHT", "CREATE_CONSENT", "EXECUTE", "READBACK", "QUALIFY_OFFLINE"]) assert.throws(() => assertQualifiedReleaseState(release, mode), /prohibited/);
});

test("one fake response maps to one governed reasoning step, one dispatch, no retries, and accepted real broker action", async () => {
  const { completed, calls, artifactText } = await runFixture({ suffix: "0000000000000001", twice: true });
  const result = completed.result;
  assert.equal(result.status, "KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATED");
  assert.equal(calls.length, 2);
  assert.equal(result.requestCounts.metadataAccessRequests, 1);
  assert.equal(result.requestCounts.inferenceRequests, 1);
  assert.equal(result.requestCounts.externallyObservableReasoningSteps, 1);
  assert.equal(result.requestCounts.automaticModelRetries, 0);
  assert.equal(result.actionBroker.accepted, true);
  assert.equal(result.ledger.reservationFinalizationAgree, true);
  assert.equal(result.memory.unchanged, true);
  assert.equal(result.memory.disposableRootDestroyed, true);
  assertNoSecretMaterial(artifactText);
  const body = JSON.parse(calls[1].body);
  assert.equal(body.model, "gpt-5.6-sol"); assert.deepEqual(body.reasoning, { effort: "medium" });
  assert.equal(body.store, false); assert.equal(body.background, false); assert.equal(body.stream, false);
  assert.deepEqual(body.tools, []); assert.equal(body.max_output_tokens, 2000);
  assert.equal(body.text.format.type, "json_schema"); assert.equal(body.text.format.strict, true);
  assert.equal(sha256Json(body), UNCHANGED_CANONICAL_REQUEST_HASH, "observability must not change the inference request");
  assert.deepEqual(result.providerDiagnostics.metadata, result.metadataAccess.providerDiagnostics);
  assert.equal(result.providerDiagnostics.metadata.httpStatus, 200);
  assert.equal(result.providerDiagnostics.inference.httpStatus, 200);
});

test("missing credential and metadata failures terminate before inference", async () => {
  const missing = await runFixture({ suffix: "0000000000000002", environment: {} });
  assert.equal(missing.completed.result.status, "REAL_ROUTE_CALIBRATION_PRECHECK_FAILED");
  assert.equal(missing.completed.result.requestCounts.metadataAccessRequests, 0);
  assert.equal(missing.completed.result.requestCounts.inferenceRequests, 0);
  const rejected = await runFixture({ suffix: "0000000000000003", fetchOptions: { metadataStatus: 401 } });
  assert.equal(rejected.completed.result.status, "REAL_ROUTE_CALIBRATION_MODEL_ACCESS_FAILED");
  assert.equal(rejected.calls.length, 1);
  assert.equal(rejected.completed.result.requestCounts.inferenceRequests, 0);
  assert.equal(rejected.completed.result.providerDiagnostics.metadata.httpStatus, 401);
  assert.deepEqual(rejected.completed.result.providerDiagnostics.metadata, rejected.completed.result.metadataAccess.providerDiagnostics);
  const wrong = await runFixture({ suffix: "0000000000000004", fetchOptions: { metadataId: "gpt-5.6-terra" } });
  assert.equal(wrong.completed.result.status, "REAL_ROUTE_CALIBRATION_MODEL_ACCESS_FAILED");
  assert.equal(wrong.calls.length, 1);
});

test("missing usage permanently consumes the request and charges the full reservation", async () => {
  const { completed } = await runFixture({ suffix: "0000000000000005", fetchOptions: { usage: null } });
  assert.equal(completed.result.status, "REAL_ROUTE_CALIBRATION_USAGE_UNAVAILABLE");
  assert.equal(completed.result.cost.conservativeCostChargedUsd, 0.25);
  assert.equal(completed.result.cost.missingUsageChargedAtFullReservation, true);
  assert.equal(completed.terminalReceipt.inferenceAuthorityConsumed, true);
  assert.equal(completed.terminalReceipt.reusable, false);
});

test("malformed, unsupported-citation, and production-authority actions fail without retry", async () => {
  const artifacts = await calibrationArtifactBindings();
  const malformedFetch = fakeFetchSequence(artifacts).fetchImpl;
  let call = 0;
  const malformed = await runFixture({ suffix: "0000000000000006", fetchImpl: async (url, options) => {
    call += 1; if (call === 1) return malformedFetch(url, options);
    return response(200, { id: "resp_bad", model: "gpt-5.6-sol", status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "{" }] }], usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } }, "req_bad");
  } });
  assert.equal(malformed.completed.result.status, "REAL_ROUTE_CALIBRATION_ACTION_REJECTED");
  assert.equal(malformed.completed.result.requestCounts.inferenceInvocations, 1);
  assert.equal(malformed.completed.result.requestCounts.retries, 0);
  const citation = passCalibrationActionThroughRealBroker(validActionCore(artifacts.calibrationCase, { evidenceReferences: ["KE-P7-H01:PRIVATE"] }), artifacts.calibrationCase);
  assert.equal(citation.accepted, false);
  const production = passCalibrationActionThroughRealBroker(validActionCore(artifacts.calibrationCase, { authorityClass: "PRODUCTION" }), artifacts.calibrationCase);
  assert.equal(production.accepted, false);
});

test("authority tampering, expiration, secret shapes, direct provider access, and ceilings fail closed", async () => {
  const artifacts = await calibrationArtifactBindings();
  const authority = await fixtureAuthority(artifacts, "0000000000000007");
  assert.equal(validateRealRouteAuthority(authority, { now: Date.parse("2026-08-10T19:00:00.000Z") }).authorityHash, authority.authorityHash);
  assert.throws(() => validateRealRouteAuthority({ ...authority, exactModelId: "gpt-5.6-terra" }, { now: Date.parse("2026-08-10T19:00:00.000Z") }));
  assert.throws(() => validateRealRouteAuthority(authority, { now: Date.parse("2026-08-12T19:00:00.000Z") }), /expired/);
  const shapedSecret = [`Authoriz${"ation"}`, `Bear${"er"}`, `${"s"}${"k"}-test-shaped-secret-123456789`].join(": ");
  assert.throws(() => assertNoSecretMaterial(shapedSecret));
  const credential = new CredentialHandle("PROCESS_ENVIRONMENT", "unit-test-credential-without-provider-key-shape");
  const client = new OpenAIRealRouteClient({ profile: artifacts.profile, credentialHandle: credential, fetchImpl: async () => { throw new Error("must not dispatch"); } });
  await assert.rejects(client.inferStructuredAction({ permit: {}, prompt: artifacts.prompt.text, structuredSchema: await createCalibrationActionCoreSchema(artifacts.calibrationCase) }), /outside the calibration governor/);
  const temp = await mkdtemp(path.join(os.tmpdir(), "ke-cal-governor-"));
  try {
    const governor = await new ExternalCalibrationGovernor({ root: temp, providerProfile: artifacts.profile, authority, clock: () => "2026-08-10T19:00:00.000Z" }).initialize();
    await assert.rejects(governor.reserveInference({ requestIdentity: H64, promptByteCount: 8001 }), /ceiling/);
    const costlyProfile = structuredClone(artifacts.profile);
    costlyProfile.pricing.inputUsdPerMillionTokens = 50;
    costlyProfile.pricing.outputIncludingReasoningUsdPerMillionTokens = 300;
    const costlyGovernor = await new ExternalCalibrationGovernor({ root: path.join(temp, "cost"), providerProfile: costlyProfile, authority, clock: () => "2026-08-10T19:00:00.000Z" }).initialize();
    await assert.rejects(costlyGovernor.reserveInference({ requestIdentity: H64, promptByteCount: 8000 }), /conservative maximum exceeds authority/);
  } finally { await rm(temp, { recursive: true, force: true }); }
  const absent = await resolveApprovedCredential({ environment: {}, dotenvPath: path.join(os.tmpdir(), "definitely-missing-ke-env") });
  assert.deepEqual(absent.toJSON(), { routeType: "DOTENV_FILE", present: false });
  assert.equal(JSON.stringify(absent).includes("credential"), false);
});

test("a timeout after reservation consumes the full amount without retry", async () => {
  const artifacts = await calibrationArtifactBindings();
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) return response(200, { id: "gpt-5.6-sol", object: "model", owned_by: "openai" }, "req_meta_timeout");
    const error = new Error("synthetic timeout"); error.name = "AbortError"; throw error;
  };
  const { completed, artifactText } = await runFixture({ suffix: "0000000000000008", fetchImpl });
  assert.equal(completed.result.status, "REAL_ROUTE_CALIBRATION_PROVIDER_REJECTED");
  assert.equal(completed.result.cost.conservativeCostChargedUsd, 0.25);
  assert.equal(completed.result.requestCounts.inferenceRequests, 1);
  assert.equal(completed.result.requestCounts.retries, 0);
  assert.equal(completed.terminalReceipt.inferenceAuthorityConsumed, true);
  assert.equal(completed.result.providerDiagnostics.inference.httpStatus, NOT_RECEIVED);
  assert.equal(completed.result.providerDiagnostics.inference.timeoutClassification, "TIMEOUT");
  assert.equal(completed.result.providerDiagnostics.inference.networkConnectionClassification, NOT_RECEIVED);
  assert.deepEqual(JSON.parse(artifactText).providerDiagnostics, completed.result.providerDiagnostics);
});

test("HTTP provider rejections preserve only the closed safe diagnostic contract through readback", async (t) => {
  const cases = [
    { status: 400, type: "invalid_request_error", code: "invalid_json_schema", param: "text.format.schema", message: "Structured output JSON schema is invalid.", classification: "STRUCTURED_OUTPUT_REJECTION" },
    { status: 401, type: "authentication_error", code: "invalid_api_key", param: null, message: "Authentication rejected.", classification: "AUTHENTICATION_REJECTION" },
    { status: 403, type: "permission_error", code: "model_access_denied", param: "model", message: "Model access forbidden.", classification: "ACCESS_REJECTION" },
    { status: 404, type: "invalid_request_error", code: "model_not_found", param: "model", message: "Model route not found.", classification: "MODEL_OR_ROUTE_REJECTION" },
    { status: 429, type: "rate_limit_error", code: "rate_limit_exceeded", param: null, message: "Rate limit exceeded.", classification: "RATE_OR_QUOTA_REJECTION" },
    { status: 500, type: "server_error", code: "provider_internal_error", param: null, message: "Provider internal failure.", classification: "PROVIDER_FAILURE" }
  ];
  for (const [index, fixture] of cases.entries()) {
    await t.test(String(fixture.status), async () => {
      const fetchImpl = inferenceFailureFetch(response(fixture.status, { error: { type: fixture.type, code: fixture.code, param: fixture.param, message: fixture.message } }, `req_http_${fixture.status}`));
      const suffix = (0x100 + index).toString(16).padStart(16, "0");
      const { completed, artifactText } = await runFixture({ suffix, fetchImpl });
      assertRejectedInferenceInvariant(completed, artifactText);
      const diagnostic = completed.result.providerDiagnostics.inference;
      assert.equal(diagnostic.httpStatus, fixture.status);
      assert.equal(diagnostic.errorType, fixture.type);
      assert.equal(diagnostic.errorCode, fixture.code);
      assert.equal(diagnostic.errorParam, fixture.param === null ? NOT_RECEIVED : fixture.param);
      assert.equal(diagnostic.messageClassification, fixture.classification);
      assert.equal(diagnostic.safeProviderRequestId, `req_http_${fixture.status}`);
      assert.equal(diagnostic.responseContentType, "application/json");
      assert.equal(diagnostic.responseByteLengthClassification, "EXACT");
      assert.equal(diagnostic.responseBodyTruncated, false);
      assert.equal(diagnostic.timeoutClassification, "NOT_TIMEOUT");
      assert.equal(diagnostic.networkConnectionClassification, "HTTP_RESPONSE_RECEIVED");
    });
  }
});

test("non-JSON, malformed, missing-ID, oversized, secret-shaped, and connection failures remain bounded and fail closed", async (t) => {
  await t.test("non-JSON error", async () => {
    const fetchImpl = inferenceFailureFetch(response(400, null, "req_non_json", { contentType: "text/plain; charset=utf-8", rawBody: "synthetic provider rejection" }));
    const { completed, artifactText } = await runFixture({ suffix: "0000000000000200", fetchImpl });
    assertRejectedInferenceInvariant(completed, artifactText);
    const diagnostic = completed.result.providerDiagnostics.inference;
    assert.equal(diagnostic.messageClassification, "NON_JSON_ERROR_RESPONSE");
    assert.equal(diagnostic.responseContentType, "text/plain");
    assert.equal(diagnostic.errorType, NOT_RECEIVED);
  });

  await t.test("malformed JSON error", async () => {
    const fetchImpl = inferenceFailureFetch(response(400, null, "req_malformed_json", { rawBody: '{"error":' }));
    const { completed, artifactText } = await runFixture({ suffix: "0000000000000201", fetchImpl });
    assertRejectedInferenceInvariant(completed, artifactText);
    assert.equal(completed.result.providerDiagnostics.inference.messageClassification, "MALFORMED_JSON_ERROR_RESPONSE");
  });

  await t.test("missing request ID", async () => {
    const fetchImpl = inferenceFailureFetch(response(400, { error: { type: "invalid_request_error", code: "invalid_request", param: null, message: "Invalid request." } }, null));
    const { completed, artifactText } = await runFixture({ suffix: "0000000000000202", fetchImpl });
    assertRejectedInferenceInvariant(completed, artifactText);
    assert.equal(completed.result.providerDiagnostics.inference.safeProviderRequestId, NOT_RECEIVED);
  });

  await t.test("oversized error body", async () => {
    const oversized = JSON.stringify({ error: { type: "invalid_request_error", code: "oversized", param: null, message: "x".repeat(PROVIDER_RESPONSE_BODY_LIMIT_BYTES * 2) } });
    const fetchImpl = inferenceFailureFetch(response(400, null, "req_oversized", { rawBody: oversized }));
    const { completed, artifactText } = await runFixture({ suffix: "0000000000000203", fetchImpl });
    assertRejectedInferenceInvariant(completed, artifactText);
    const diagnostic = completed.result.providerDiagnostics.inference;
    assert.equal(diagnostic.messageClassification, "OVERSIZED_ERROR_RESPONSE");
    assert.equal(diagnostic.responseByteLength, PROVIDER_RESPONSE_BODY_LIMIT_BYTES);
    assert.equal(diagnostic.responseByteLengthClassification, "LOWER_BOUND");
    assert.equal(diagnostic.responseBodyTruncated, true);
    assert.equal(diagnostic.errorType, NOT_RECEIVED);
  });

  await t.test("secret-shaped values", async () => {
    const shapedSecret = [`${"s"}${"k"}`, "synthetic-provider-secret-material-123456789"].join("-");
    const accountIdentifier = ["org", "syntheticaccount123"].join("-");
    const cookieValue = `session=${shapedSecret}`;
    const fetchImpl = inferenceFailureFetch(response(400, { error: { type: shapedSecret, code: shapedSecret, param: accountIdentifier, message: `Rejected ${shapedSecret}` } }, shapedSecret, {
      contentType: `application/json; boundary=${shapedSecret}`,
      extraHeaders: { "set-cookie": cookieValue, "x-organization-id": accountIdentifier }
    }));
    const { completed, artifactText } = await runFixture({ suffix: "0000000000000204", fetchImpl });
    assertRejectedInferenceInvariant(completed, artifactText);
    const diagnostic = completed.result.providerDiagnostics.inference;
    assert.equal(diagnostic.errorType, REDACTED);
    assert.equal(diagnostic.errorCode, REDACTED);
    assert.equal(diagnostic.errorParam, REDACTED);
    assert.equal(diagnostic.messageClassification, "REDACTED_SECRET_MATERIAL");
    assert.equal(diagnostic.safeProviderRequestId, NOT_RECEIVED);
    assert.equal(diagnostic.responseContentType, "application/json");
    assert.equal(artifactText.includes(shapedSecret), false);
    assert.equal(artifactText.includes(accountIdentifier), false);
    assert.equal(artifactText.includes(cookieValue), false);
  });

  await t.test("connection failure", async () => {
    const fetchImpl = inferenceFailureFetch(() => { throw new TypeError("synthetic connection failure"); });
    const { completed, artifactText } = await runFixture({ suffix: "0000000000000205", fetchImpl });
    assertRejectedInferenceInvariant(completed, artifactText);
    const diagnostic = completed.result.providerDiagnostics.inference;
    assert.equal(diagnostic.httpStatus, NOT_RECEIVED);
    assert.equal(diagnostic.timeoutClassification, "NOT_TIMEOUT");
    assert.equal(diagnostic.networkConnectionClassification, "CONNECTION_FAILURE");
  });
});

test("the calibration runner imports no episode corpus, evaluator, benchmark executor, handler, worker, or lesson module", async () => {
  const runnerPath = path.join(repositoryRoot, "qualification/synthetic-executive/calibration/scripts/run-real-route-calibration.mjs");
  const source = await readFile(runnerPath, "utf8");
  for (const forbidden of ["episodes/public-manifest", "evaluator-control", "blind-qualification-evaluator", "executor.mjs", "generate-listing", "engineering-worker", "lesson-promotion", "run-qualification.mjs"]) assert.equal(source.includes(forbidden), false, forbidden);
  assert.equal(pathToFileURL(runnerPath).protocol, "file:");
});
