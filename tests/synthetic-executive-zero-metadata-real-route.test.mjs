import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmod, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { runZeroMetadataRealRouteCalibration } from "../qualification/synthetic-executive/calibration/scripts/run-zero-metadata-real-route-calibration.mjs";
import {
  buildZeroMetadataRealRouteAuthority, loadPriorSealedMetadataEvidence,
  sealExternalZeroMetadataAuthority, validateZeroMetadataRealRouteAuthority
} from "../qualification/synthetic-executive/calibration/scripts/zero-metadata-real-route-authority.mjs";
import {
  COGNITIVE_SUBJECT, STARTING_TOOLING_COMMIT, STARTING_TOOLING_TREE,
  STRUCTURED_OUTPUT_COMMIT_PATHS, inspectSealedStructuredOutputCompatibilityRelease,
  loadStructuredOutputCompatibilityRelease, validateStructuredOutputCompatibilityRelease
} from "../qualification/synthetic-executive/calibration/scripts/structured-output-compatibility-release.mjs";
import {
  assertOpenAIStructuredOutputsSubset, buildCalibrationInferenceRequestEnvelope,
  calibrationArtifactBindings, observedStateHash, repositoryRoot
} from "../qualification/synthetic-executive/calibration/scripts/real-route-profile.mjs";
import { passCalibrationActionThroughRealBroker } from "../qualification/synthetic-executive/calibration/scripts/real-route-broker.mjs";
import {
  PROVIDER_ERROR_MESSAGE_LIMIT_BYTES, assertNoSecretMaterial, sanitizeProviderErrorMessage
} from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";
import { seal, sha256Bytes, sha256Json } from "../qualification/synthetic-executive/scripts/protocol.mjs";

const RUNTIME_COMMIT = "a".repeat(40);
const RUNTIME_TREE = "b".repeat(40);
const RELEASE_HASH = "c".repeat(64);
const RECEIPT_HASH = "d".repeat(64);
// This legacy authority has a real 24-hour expiry; keep the fixture fresh without
// weakening production expiry validation or mutating either consumed authority.
const TEST_CREATED_AT = new Date(Date.now() - 1_000).toISOString();

function validActionCore(calibrationCase) {
  return {
    schemaVersion: "1.0", actionType: "RECONSTRUCT_EPISODE", actionId: "KE-CAL-001-ACTION-001",
    episodeId: "KE-CAL-001", executiveState: "INIT", observedStateHash: observedStateHash(calibrationCase),
    evidenceReferences: ["KE-CAL-001:EVIDENCE-001"], memoryReferences: [],
    factualFindings: ["The object is a blue ceramic mug.", "One handle is visible."],
    uncertainties: ["Maker, model, age, price, provenance, safety condition, and ownership are not supplied."],
    confidence: 0.92, boundedRationaleSummary: "Restates only the supplied synthetic calibration evidence.",
    requestedSuccessorState: "EPISODE_RECONSTRUCTED", authorityClass: "NO_NEW_AUTHORITY",
    prohibitedOperations: ["PRODUCTION_EXECUTION", "BENCHMARK_EXECUTION", "SHELL", "GIT", "SOURCE_EDIT", "DEPLOYMENT", "PROVIDER_TOOL", "ENGINEERING_WORKER"],
    details: {}
  };
}

function routeReleaseFixture(artifacts) {
  return {
    parentCommit: STARTING_TOOLING_COMMIT,
    parentTree: STARTING_TOOLING_TREE,
    runtimeCommit: RUNTIME_COMMIT,
    runtimeTree: RUNTIME_TREE,
    releaseRecordHash: RELEASE_HASH,
    release: {
      transmittedSchemaExactHash: artifacts.transmittedSchemaExactHash,
      transmittedSchemaStableHash: artifacts.transmittedSchemaStableHash,
      completeSerializedRequestHash: artifacts.completeSerializedRequestHash,
      safeProviderDiagnosticsContractHash: artifacts.safeProviderDiagnosticsContractHash
    }
  };
}

async function fixtureAuthority(suffix, artifacts = null) {
  artifacts ||= await calibrationArtifactBindings();
  return buildZeroMetadataRealRouteAuthority({
    createdAt: TEST_CREATED_AT,
    singleUseIdentity: `structured-output-calibration-use-${suffix.padEnd(48, "0")}`,
    releaseInspector: () => routeReleaseFixture(artifacts),
    artifactLoader: async () => artifacts
  });
}

function resealAuthority(authority, mutate) {
  const core = structuredClone(authority); delete core.authorityHash; mutate(core);
  return seal(core, "authorityHash");
}

function providerResponse(artifacts, { status = 200, payload = null, requestId = "req_structured_output_test" } = {}) {
  const body = payload || {
    id: "resp_structured_output_test", object: "response", model: "gpt-5.6-sol", status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(validActionCore(artifacts.calibrationCase)) }] }],
    usage: { input_tokens: 340, input_tokens_details: { cached_tokens: 0 }, output_tokens: 120, output_tokens_details: { reasoning_tokens: 70 }, total_tokens: 460 }
  };
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": requestId } });
}

async function runFixture({ suffix, responseFactory }) {
  const artifacts = await calibrationArtifactBindings();
  const authority = await fixtureAuthority(suffix, artifacts);
  const externalRoot = await mkdtemp(path.join(os.tmpdir(), "ke-structured-output-authority-"));
  const authorityPath = path.join(externalRoot, "authority.json");
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), method: options.method, body: options.body, headers: Object.keys(options.headers || {}) });
    return responseFactory ? responseFactory(artifacts) : providerResponse(artifacts);
  };
  let tick = Date.parse(TEST_CREATED_AT);
  const options = {
    authorityPath, fetchImpl,
    environment: { OPENAI_API_KEY: "unit-test-credential-without-provider-key-shape" },
    dotenvPath: path.join(externalRoot, "missing.env"),
    now: () => new Date(tick += 1).toISOString(), nowMs: () => tick,
    authorityLoader: async () => ({ authority, authorityFileHash: "e".repeat(64), receipt: { receiptHash: RECEIPT_HASH } }),
    runtimeInspector: () => ({ trackedSourceClean: true }),
    artifactLoader: async () => artifacts
  };
  const resultRoot = path.join(repositoryRoot, authority.resultRootRelativePath);
  try {
    const completed = await runZeroMetadataRealRouteCalibration(options);
    const artifactText = await readFile(completed.resultPath, "utf8");
    return { completed, artifactText, calls, artifacts, authority };
  } finally {
    await rm(resultRoot, { recursive: true, force: true });
    await rm(externalRoot, { recursive: true, force: true });
  }
}

test("transmitted schema recursively satisfies the documented non-fine-tuned Structured Outputs subset", async () => {
  const artifacts = await calibrationArtifactBindings();
  const schema = artifacts.structuredSchema;
  assert.deepEqual(assertOpenAIStructuredOutputsSubset(schema), {
    propertyCount: 16, maximumObjectDepth: 2, schemaStringCharacters: 388, enumValueCount: 8
  });
  assert.equal(schema.type, "object");
  assert.equal(schema.additionalProperties, false);
  assert.equal(Object.hasOwn(schema, "anyOf"), false);
  assert.deepEqual([...schema.required].sort(), Object.keys(schema.properties).sort());
  for (const [name, property] of Object.entries(schema.properties)) {
    assert.equal(typeof property.type, "string", `${name} must declare an explicit type`);
    if (property.type === "array") assert.deepEqual(property.items, { type: "string" });
  }
  for (const name of ["schemaVersion", "actionType", "actionId", "episodeId", "executiveState", "observedStateHash", "requestedSuccessorState", "authorityClass"]) {
    assert.equal(schema.properties[name].type, "string");
    assert.equal(schema.properties[name].enum.length, 1);
    assert.equal(Object.hasOwn(schema.properties[name], "const"), false);
  }
  assert.deepEqual(schema.properties.boundedRationaleSummary, { type: "string" });
  assert.deepEqual(schema.properties.confidence, { type: "number", minimum: 0, maximum: 1 });
  for (const name of ["evidenceReferences", "memoryReferences", "factualFindings", "uncertainties", "prohibitedOperations"]) {
    assert.deepEqual(schema.properties[name], { type: "array", items: { type: "string" } });
  }
});

test("text.format, transmitted schema hashes, and complete serialized request hash are exact", async () => {
  const artifacts = await calibrationArtifactBindings();
  const body = buildCalibrationInferenceRequestEnvelope({ profile: artifacts.profile, prompt: artifacts.prompt.text, structuredSchema: artifacts.structuredSchema });
  assert.deepEqual(Object.keys(body.text.format), ["type", "name", "strict", "schema"]);
  assert.equal(body.text.format.type, "json_schema");
  assert.equal(body.text.format.name, "katherine_executive_action_core_v1");
  assert.equal(body.text.format.strict, true);
  assert.deepEqual(body.text.format.schema, artifacts.structuredSchema);
  assert.equal(sha256Bytes(Buffer.from(JSON.stringify(body.text.format.schema), "utf8")), artifacts.transmittedSchemaExactHash);
  assert.equal(sha256Json(body.text.format.schema), artifacts.transmittedSchemaStableHash);
  assert.equal(sha256Bytes(Buffer.from(JSON.stringify(body), "utf8")), artifacts.completeSerializedRequestHash);
  assert.equal(artifacts.executiveActionSchemaHash, "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba");
  assert.equal(artifacts.prompt.promptHash, "73dc7a21fa2db16c432b9630f3934ea87d78cd89b174b1739563b207a5a57e93");
  assert.equal(artifacts.profile.exactModelId, "gpt-5.6-sol");
  assert.equal(artifacts.profile.reasoning.effort, "medium");
});

test("successor authority binds every subject, transport, request, diagnostics, and one-shot ceiling", async () => {
  const artifacts = await calibrationArtifactBindings();
  const authority = await fixtureAuthority("0000000000000001", artifacts);
  assert.equal(validateZeroMetadataRealRouteAuthority(authority, { now: Date.parse("2026-08-10T23:00:00.000Z") }).authorityHash, authority.authorityHash);
  assert.equal(authority.cognitiveSubjectIdentity.commit, COGNITIVE_SUBJECT.commit);
  assert.equal(authority.executiveActionSchemaHash, artifacts.executiveActionSchemaHash);
  assert.equal(authority.transmittedSchemaExactHash, artifacts.transmittedSchemaExactHash);
  assert.equal(authority.transmittedSchemaStableHash, artifacts.transmittedSchemaStableHash);
  assert.equal(authority.completeSerializedRequestHash, artifacts.completeSerializedRequestHash);
  assert.equal(authority.safeProviderDiagnosticsContractHash, artifacts.safeProviderDiagnosticsContractHash);
  assert.equal(authority.maximumMetadataAccessRequests, 0);
  assert.equal(authority.maximumInferenceRequests, 1);
  assert.equal(authority.maximumInferenceRetries, 0);
  assert.equal(authority.maximumSuccessors, 0);
  for (const field of ["transmittedSchemaExactHash", "transmittedSchemaStableHash", "completeSerializedRequestHash", "safeProviderDiagnosticsContractHash"]) {
    assert.throws(() => validateZeroMetadataRealRouteAuthority(resealAuthority(authority, (core) => { core[field] = "f".repeat(64); }), { now: Date.parse("2026-08-10T23:00:00.000Z") }));
  }
});

test("one mocked inference is accepted with zero metadata, retries, successors, tools, workers, or request drift", async () => {
  const { completed, artifactText, calls, artifacts } = await runFixture({ suffix: "0000000000000002" });
  const result = completed.result;
  assert.equal(result.status, "KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /\/v1\/responses$/);
  assert.equal(sha256Bytes(Buffer.from(calls[0].body, "utf8")), artifacts.completeSerializedRequestHash);
  assert.deepEqual(result.requestCounts, {
    metadataAccessInvocations: 0, inferenceInvocations: 1, metadataAccessRequests: 0,
    inferenceRequests: 1, retries: 0, externallyObservableReasoningSteps: 1,
    automaticModelRetries: 0, successors: 0
  });
  assert.equal(result.routeIsolation.schemaProbeRequestCount, 0);
  assert.equal(result.routeIsolation.workerDispatchCount, 0);
  assert.equal(result.routeIsolation.agentToolCallCount, 0);
  assert.equal(result.actionBroker.accepted, true);
  assert.equal(completed.terminalReceipt.inferenceAuthorityConsumed, true);
  assert.equal(completed.terminalReceipt.reusable, false);
  assertNoSecretMaterial(artifactText);
});

test("deterministic broker rejects every altered case constant, array, empty rationale, and confidence violation", async () => {
  const artifacts = await calibrationArtifactBindings();
  const valid = validActionCore(artifacts.calibrationCase);
  assert.equal(passCalibrationActionThroughRealBroker(valid, artifacts.calibrationCase).accepted, true);
  const mutations = [
    (value) => { value.schemaVersion = "2.0"; },
    (value) => { value.actionType = "STOP_SAFELY"; },
    (value) => { value.actionId = "OTHER"; },
    (value) => { value.episodeId = "OTHER"; },
    (value) => { value.executiveState = "OTHER"; },
    (value) => { value.observedStateHash = "0".repeat(64); },
    (value) => { value.evidenceReferences = []; },
    (value) => { value.memoryReferences = ["unknown"]; },
    (value) => { value.requestedSuccessorState = "OTHER"; },
    (value) => { value.authorityClass = "OTHER"; },
    (value) => { value.prohibitedOperations = [...value.prohibitedOperations].reverse(); },
    (value) => { value.details = { providerRequest: true }; },
    (value) => { value.boundedRationaleSummary = ""; },
    (value) => { value.confidence = -0.01; },
    (value) => { value.confidence = 1.01; }
  ];
  for (const mutate of mutations) {
    const candidate = structuredClone(valid); mutate(candidate);
    assert.equal(passCalibrationActionThroughRealBroker(candidate, artifacts.calibrationCase).accepted, false);
  }
});

test("unsupported schema fixtures fail before a mock dispatch", async () => {
  const artifacts = await calibrationArtifactBindings();
  const fixtures = [
    (schema) => { schema.anyOf = []; },
    (schema) => { schema.properties.boundedRationaleSummary.minLength = 1; },
    (schema) => { schema.properties.actionId.const = "KE-CAL-001-ACTION-001"; },
    (schema) => { delete schema.properties.actionId.type; },
    (schema) => { delete schema.properties.factualFindings.items; },
    (schema) => { schema.properties.details.additionalProperties = true; },
    (schema) => { schema.required = schema.required.filter((name) => name !== "confidence"); },
    (schema) => { schema.allOf = []; }
  ];
  let mockedDispatches = 0;
  for (const mutate of fixtures) {
    const schema = structuredClone(artifacts.structuredSchema); mutate(schema);
    assert.throws(() => {
      assertOpenAIStructuredOutputsSubset(schema);
      mockedDispatches += 1;
    });
  }
  assert.equal(mockedDispatches, 0);
});

test("sanitized provider messages survive transport to terminal readback without secrets or overflow", async () => {
  const safeMessage = "Invalid schema: at path=('properties','confidence'), numeric bounds are invalid.";
  const { completed, artifactText, calls } = await runFixture({
    suffix: "0000000000000003",
    responseFactory: () => providerResponse(null, {
      status: 400,
      payload: { error: { type: "invalid_request_error", code: "invalid_json_schema", param: "text.format.schema", message: safeMessage } }
    })
  });
  assert.equal(calls.length, 1);
  assert.equal(completed.result.status, "REAL_ROUTE_CALIBRATION_PROVIDER_REJECTED");
  assert.equal(completed.result.providerDiagnostics.inference.sanitizedErrorMessage, safeMessage);
  assert.equal(completed.result.requestCounts.retries, 0);
  assert.equal(completed.terminalReceipt.inferenceAuthorityConsumed, true);
  const secret = `${"s"}${"k"}-unit-test-secret-shaped-value-1234567890`;
  const sanitized = sanitizeProviderErrorMessage(`Bearer ${secret} org_private123 account_private123 ${"x".repeat(1000)}`);
  assert.equal(sanitized.includes(secret), false);
  assert.ok(Buffer.byteLength(sanitized, "utf8") <= PROVIDER_ERROR_MESSAGE_LIMIT_BYTES);
  assert.equal(artifactText.includes(secret), false);
  assertNoSecretMaterial(artifactText);
});

test("authority creation is create-new-only and both consumed authority families remain immutable", async () => {
  const before = await loadPriorSealedMetadataEvidence();
  const artifacts = await calibrationArtifactBindings();
  const authority = await fixtureAuthority("0000000000000004", artifacts);
  const temp = await mkdtemp(path.join(os.tmpdir(), "ke-structured-output-seal-"));
  const authorityPath = path.join(temp, "new-authority.json");
  try {
    const options = { authorityPath, synchronizationInspector: () => RUNTIME_COMMIT, authorityBuilder: async () => authority };
    const sealed = await sealExternalZeroMetadataAuthority(options);
    assert.equal(sealed.authority.authorityHash, authority.authorityHash);
    assert.equal(sealed.receipt.completeSerializedRequestHash, artifacts.completeSerializedRequestHash);
    await assert.rejects(sealExternalZeroMetadataAuthority(options), /already exists|EEXIST/i);
  } finally {
    for (const target of [authorityPath, `${authorityPath}.sealing-receipt.json`]) {
      try {
        if (process.platform === "win32") execFileSync("attrib.exe", ["-R", target], { windowsHide: true });
        await chmod(target, 0o600);
      } catch {}
    }
    await rm(temp, { recursive: true, force: true });
  }
  assert.deepEqual(await loadPriorSealedMetadataEvidence(), before);
});

test("release record preserves the immutable subject and rejects successor-Version reuse", () => {
  const release = loadStructuredOutputCompatibilityRelease({ validateCurrentArtifacts: false });
  assert.equal(validateStructuredOutputCompatibilityRelease(release, { validateCurrentArtifacts: false }).valid, true);
  assert.deepEqual(release.cognitiveSubject, COGNITIVE_SUBJECT);
  const fakeGit = (args) => {
    const key = args.join(" ");
    if (key === "rev-parse HEAD") return RUNTIME_COMMIT;
    if (key === "rev-parse HEAD^{tree}") return RUNTIME_TREE;
    if (key === `rev-list --parents -n 1 ${RUNTIME_COMMIT}`) return `${RUNTIME_COMMIT} ${STARTING_TOOLING_COMMIT}`;
    if (key === `rev-parse ${STARTING_TOOLING_COMMIT}^{tree}`) return STARTING_TOOLING_TREE;
    if (key === `rev-parse ${COGNITIVE_SUBJECT.commit}^{tree}`) return COGNITIVE_SUBJECT.tree;
    if (key === `show ${COGNITIVE_SUBJECT.commit}:package.json`) return JSON.stringify({ version: "1.12.27" });
    if (key === "branch --show-current") return "refactor/beta-evidence-pipeline";
    if (key === "status --porcelain=v1 --untracked-files=no") return "";
    if (key === `diff --name-only ${STARTING_TOOLING_COMMIT} ${RUNTIME_COMMIT}`) return STRUCTURED_OUTPUT_COMMIT_PATHS.join("\n");
    throw new Error(`unexpected git fixture: ${key}`);
  };
  assert.throws(
    () => inspectSealedStructuredOutputCompatibilityRelease({ gitImpl: fakeGit, validateCurrentArtifacts: false }),
    /product Version must remain the cognitive subject Version/
  );
  const core = structuredClone(release); delete core.recordHash; core.documentedStructuredOutputsSubset.maximumObjectProperties = 4_999;
  assert.throws(() => validateStructuredOutputCompatibilityRelease(seal(core, "recordHash"), { validateCurrentArtifacts: false }));
});

test("metadata and schema-probe dispatch remain structurally absent", async () => {
  const source = await readFile(path.join(repositoryRoot, "qualification/synthetic-executive/calibration/scripts/run-zero-metadata-real-route-calibration.mjs"), "utf8");
  assert.doesNotMatch(source, /checkExactModelAccess/);
  assert.doesNotMatch(source, /metadataEndpoint/);
  assert.doesNotMatch(source, /authorizedFetch\(["']METADATA/);
  assert.match(source, /maximumMetadataAccessRequests, 0/);
  assert.match(source, /schemaProbeRequestCount: 0/);
});
