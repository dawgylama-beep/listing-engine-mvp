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
  COGNITIVE_SUBJECT, PRIOR_ARTIFACT_HASHES, ZERO_METADATA_ROUTE_COMMIT_PATHS,
  inspectSealedZeroMetadataRouteRelease, loadZeroMetadataRouteRelease,
  validateZeroMetadataRouteReleaseRecord
} from "../qualification/synthetic-executive/calibration/scripts/zero-metadata-route-release.mjs";
import { calibrationArtifactBindings, observedStateHash, repositoryRoot } from "../qualification/synthetic-executive/calibration/scripts/real-route-profile.mjs";
import { assertNoSecretMaterial } from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";
import { seal, sha256Json } from "../qualification/synthetic-executive/scripts/protocol.mjs";

const RUNTIME_COMMIT = "a".repeat(40);
const RUNTIME_TREE = "b".repeat(40);
const RELEASE_HASH = "c".repeat(64);
const RECEIPT_HASH = "d".repeat(64);
const TEST_CREATED_AT = "2026-08-10T20:00:00.000Z";

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

function routeReleaseFixture() {
  return {
    parentCommit: COGNITIVE_SUBJECT.commit, parentTree: COGNITIVE_SUBJECT.tree,
    runtimeCommit: RUNTIME_COMMIT, runtimeTree: RUNTIME_TREE, releaseRecordHash: RELEASE_HASH
  };
}

async function fixtureAuthority(suffix) {
  return buildZeroMetadataRealRouteAuthority({
    createdAt: TEST_CREATED_AT,
    singleUseIdentity: `zero-metadata-calibration-use-${suffix.padEnd(48, "0")}`,
    releaseInspector: routeReleaseFixture
  });
}

function resealAuthority(authority, mutate) {
  const core = structuredClone(authority); delete core.authorityHash; mutate(core);
  return seal(core, "authorityHash");
}

function providerResponse(artifacts, { status = 200, payload = null, requestId = "req_zero_meta_test", extraHeaders = {} } = {}) {
  const body = payload || {
    id: "resp_zero_metadata_test", object: "response", model: "gpt-5.6-sol", status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(validActionCore(artifacts.calibrationCase)) }] }],
    usage: { input_tokens: 340, input_tokens_details: { cached_tokens: 0 }, output_tokens: 120, output_tokens_details: { reasoning_tokens: 70 }, total_tokens: 460 }
  };
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "x-request-id": requestId, ...extraHeaders } });
}

async function runFixture({ suffix, responseFactory, twice = false }) {
  const artifacts = await calibrationArtifactBindings();
  const authority = await fixtureAuthority(suffix);
  const externalRoot = await mkdtemp(path.join(os.tmpdir(), "ke-zero-metadata-authority-"));
  const authorityPath = path.join(externalRoot, "authority.json");
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url: String(url), method: options.method, body: options.body, hasAuthorization: typeof options.headers?.authorization === "string" });
    return responseFactory ? responseFactory(artifacts) : providerResponse(artifacts);
  };
  let tick = Date.parse(TEST_CREATED_AT);
  const options = {
    authorityPath, fetchImpl,
    environment: { OPENAI_API_KEY: "unit-test-credential-without-provider-key-shape" },
    dotenvPath: path.join(externalRoot, "missing.env"),
    now: () => new Date(tick += 1).toISOString(), nowMs: () => tick,
    authorityLoader: async () => ({ authority, authorityFileHash: "e".repeat(64), receipt: { receiptHash: RECEIPT_HASH } }),
    runtimeInspector: () => ({ trackedSourceClean: true })
  };
  const resultRoot = path.join(repositoryRoot, authority.resultRootRelativePath);
  try {
    const completed = await runZeroMetadataRealRouteCalibration(options);
    if (twice) await assert.rejects(runZeroMetadataRealRouteCalibration(options), /EEXIST|exist/i);
    const artifactText = await readFile(completed.resultPath, "utf8");
    return { completed, artifactText, calls };
  } finally {
    await rm(resultRoot, { recursive: true, force: true });
    await rm(externalRoot, { recursive: true, force: true });
  }
}

test("zero-metadata authority accepts only the exact cognitive subject, runner release, hashes, and ceilings", async () => {
  const authority = await fixtureAuthority("0000000000000001");
  assert.equal(validateZeroMetadataRealRouteAuthority(authority, { now: Date.parse("2026-08-10T21:00:00.000Z") }).authorityHash, authority.authorityHash);
  assert.equal(authority.maximumMetadataAccessRequests, 0);
  assert.equal(authority.maximumInferenceRequests, 1);
  assert.equal(authority.maximumGovernedReasoningSteps, 1);
  assert.equal(authority.maximumProviderCostUsd, 0.25);
  assert.equal(authority.cognitiveSubjectIdentity.commit, COGNITIVE_SUBJECT.commit);
  assert.equal(authority.runnerReleaseIdentity.runtimeCommit, RUNTIME_COMMIT);
  const wrongVersion = resealAuthority(authority, (core) => { core.cognitiveSubjectIdentity.version = "1.12.28"; });
  assert.throws(() => validateZeroMetadataRealRouteAuthority(wrongVersion, { now: Date.parse("2026-08-10T21:00:00.000Z") }));
  const wrongRelease = resealAuthority(authority, (core) => { core.cognitiveSubjectIdentity.observabilityReleaseHash = "f".repeat(64); });
  assert.throws(() => validateZeroMetadataRealRouteAuthority(wrongRelease, { now: Date.parse("2026-08-10T21:00:00.000Z") }));
  const wrongRequest = resealAuthority(authority, (core) => { core.canonicalRequestHash = "f".repeat(64); });
  assert.throws(() => validateZeroMetadataRealRouteAuthority(wrongRequest, { now: Date.parse("2026-08-10T21:00:00.000Z") }));
  const metadataEnabled = resealAuthority(authority, (core) => { core.maximumMetadataAccessRequests = 1; });
  assert.throws(() => validateZeroMetadataRealRouteAuthority(metadataEnabled, { now: Date.parse("2026-08-10T21:00:00.000Z") }));
});

test("sealed route release preserves Version 1.12.27 as subject and rejects release drift", () => {
  const release = loadZeroMetadataRouteRelease();
  assert.equal(validateZeroMetadataRouteReleaseRecord(release).valid, true);
  assert.deepEqual(release.cognitiveSubject, COGNITIVE_SUBJECT);
  const core = structuredClone(release); delete core.recordHash;
  core.cognitiveSubject.version = "1.12.28";
  assert.throws(() => validateZeroMetadataRouteReleaseRecord(seal(core, "recordHash"), { validateCurrentArtifacts: false }));
  const fakeGit = (args) => {
    const key = args.join(" ");
    if (key === "rev-parse HEAD") return RUNTIME_COMMIT;
    if (key === "rev-parse HEAD^{tree}") return RUNTIME_TREE;
    if (key === `rev-list --parents -n 1 ${RUNTIME_COMMIT}`) return `${RUNTIME_COMMIT} ${COGNITIVE_SUBJECT.commit}`;
    if (key === `rev-parse ${COGNITIVE_SUBJECT.commit}^{tree}`) return COGNITIVE_SUBJECT.tree;
    if (key === `show ${COGNITIVE_SUBJECT.commit}:package.json`) return JSON.stringify({ version: "1.12.27" });
    if (key === "branch --show-current") return "refactor/beta-evidence-pipeline";
    if (key === "status --porcelain=v1 --untracked-files=no") return "";
    if (key === `diff --name-only ${COGNITIVE_SUBJECT.commit} ${RUNTIME_COMMIT}`) return ZERO_METADATA_ROUTE_COMMIT_PATHS.join("\n");
    throw new Error(`unexpected git fixture: ${key}`);
  };
  const inspected = inspectSealedZeroMetadataRouteRelease({ gitImpl: fakeGit });
  assert.equal(inspected.runtimeCommit, RUNTIME_COMMIT);
  assert.equal(inspected.parentCommit, COGNITIVE_SUBJECT.commit);
});

test("one fake inference dispatches once with zero metadata, no retry or successor, and the unchanged request", async () => {
  const { completed, artifactText, calls } = await runFixture({ suffix: "0000000000000002", twice: true });
  const result = completed.result;
  assert.equal(result.status, "KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATED");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "POST");
  assert.match(calls[0].url, /\/v1\/responses$/);
  assert.equal(result.requestCounts.metadataAccessInvocations, 0);
  assert.equal(result.requestCounts.metadataAccessRequests, 0);
  assert.equal(result.requestCounts.inferenceInvocations, 1);
  assert.equal(result.requestCounts.inferenceRequests, 1);
  assert.equal(result.requestCounts.retries, 0);
  assert.equal(result.requestCounts.automaticModelRetries, 0);
  assert.equal(result.requestCounts.successors, 0);
  assert.equal(result.ledger.reasoningStepCount, 1);
  assert.equal(result.actionBroker.accepted, true);
  assert.equal(result.metadataAccess.providerRequestPerformed, false);
  assert.equal(result.providerDiagnostics.metadata.httpStatus, "NOT_RECEIVED");
  const body = JSON.parse(calls[0].body);
  assert.equal(body.model, "gpt-5.6-sol");
  assert.deepEqual(body.reasoning, { effort: "medium" });
  assert.equal(body.store, false); assert.deepEqual(body.tools, []);
  assert.equal(sha256Json(body), COGNITIVE_SUBJECT.canonicalRequestHash);
  assert.equal(completed.terminalReceipt.inferenceAuthorityConsumed, true);
  assert.equal(completed.terminalReceipt.reusable, false);
  assertNoSecretMaterial(artifactText);
});

test("metadata dispatch is structurally absent from the zero-metadata runner", async () => {
  const source = await readFile(path.join(repositoryRoot, "qualification/synthetic-executive/calibration/scripts/run-zero-metadata-real-route-calibration.mjs"), "utf8");
  assert.doesNotMatch(source, /checkExactModelAccess/);
  assert.doesNotMatch(source, /metadataEndpoint/);
  assert.doesNotMatch(source, /authorizedFetch\(["']METADATA/);
  assert.match(source, /maximumMetadataAccessRequests, 0/);
});

test("authority sealing is create-new-only and does not alter prior consumed artifacts", async () => {
  const before = await loadPriorSealedMetadataEvidence();
  assert.equal(before.receiptFileHash, PRIOR_ARTIFACT_HASHES.metadataAccessReceipt);
  const authority = await fixtureAuthority("0000000000000003");
  const temp = await mkdtemp(path.join(os.tmpdir(), "ke-zero-metadata-seal-"));
  const authorityPath = path.join(temp, "new-authority.json");
  try {
    const options = { authorityPath, synchronizationInspector: () => RUNTIME_COMMIT, authorityBuilder: async () => authority };
    const sealed = await sealExternalZeroMetadataAuthority(options);
    assert.equal(sealed.authority.authorityHash, authority.authorityHash);
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
  const after = await loadPriorSealedMetadataEvidence();
  assert.deepEqual(after, before);
});

test("a rejected inference preserves bounded diagnostics, consumes authority, and performs no retry", async () => {
  const secret = `${"s"}${"k"}-unit-test-secret-shaped-value-1234567890`;
  const { completed, artifactText, calls } = await runFixture({
    suffix: "0000000000000004",
    responseFactory: () => providerResponse(null, {
      status: 401,
      requestId: secret,
      payload: { error: { type: "authentication_error", code: "invalid_api_key", param: null, message: `Bearer ${secret}` } },
      extraHeaders: { "set-cookie": `session=${secret}`, "x-organization": "org-secretvalue" }
    })
  });
  const result = completed.result;
  assert.equal(calls.length, 1);
  assert.equal(result.status, "REAL_ROUTE_CALIBRATION_PROVIDER_REJECTED");
  assert.equal(result.requestCounts.metadataAccessRequests, 0);
  assert.equal(result.requestCounts.inferenceRequests, 1);
  assert.equal(result.requestCounts.retries, 0);
  assert.equal(result.cost.conservativeCostChargedUsd, 0.25);
  assert.equal(result.providerDiagnostics.inference.httpStatus, 401);
  assert.equal(result.providerDiagnostics.inference.messageClassification, "REDACTED_SECRET_MATERIAL");
  assert.equal(result.providerDiagnostics.inference.safeProviderRequestId, "NOT_RECEIVED");
  assert.equal(completed.terminalReceipt.inferenceAuthorityConsumed, true);
  assert.equal(completed.terminalReceipt.reusable, false);
  assert.equal(artifactText.includes(secret), false);
  assertNoSecretMaterial(artifactText);
});
