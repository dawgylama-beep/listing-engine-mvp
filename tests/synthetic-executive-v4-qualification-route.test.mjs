import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  evaluateFrozenQualification,
  evaluateFrozenQualificationRecovery
} from "../qualification/synthetic-executive/v4-qualification-route/evaluate-core.mjs";
import {
  assertMechanicalRetryReason, assertRequestAuthority, assertResponseCapture, buildCaseRequest,
  executeQualificationRun, freezeTerminalResponses
} from "../qualification/synthetic-executive/v4-qualification-route/execute-core.mjs";
import { prepareQualificationRun } from "../qualification/synthetic-executive/v4-qualification-route/prepare-core.mjs";
import {
  CANONICAL_COGNITIVE_RUNTIME_IDENTITY,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import {
  CASE_IDS, EXECUTION_LIMITS, PACKAGE_IDENTITIES, ROUTE_VERSION, authorizationFixture, corpusRoot, routeRoot,
  seal, sha256Bytes, stableJson
} from "../qualification/synthetic-executive/v4-qualification-route/shared.mjs";

const fixedNow = "2026-08-21T13:00:00.000Z";
const fakeHead = "a".repeat(40);
const fakeTree = "b".repeat(40);
const checks = ["classificationType", "failureClass", "memoryMatch", "dossierEvaluation", "nextAction", "noUnsupportedCitations", "noForbiddenRecommendation"];

function dependencies(protectedRoot = path.join(os.tmpdir(), "ke-offline-protected-root")) {
  return {
    inspectRepository: async () => ({
      head: fakeHead, tree: fakeTree, parent: "c".repeat(40), subject: "offline fixture",
      status: "", gitDirectory: path.join(protectedRoot, ".git", "worktrees", "fixture"),
      commonDirectory: path.join(protectedRoot, ".git"), worktreeRoots: [protectedRoot]
    }),
    inspectPackageIdentities: async () => ({ ...PACKAGE_IDENTITIES, manifest: {} }),
    runSealedVerifier: async () => ({ result: "PASS", caseCount: 14, checkCount: 98 })
  };
}

async function fixture({ authorityOverrides = {}, protectedRoot } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-v4-route-offline-"));
  const resultsRoot = path.join(root, "external-results");
  const authorizationPath = path.join(root, "control-room-authorization.json");
  const authority = authorizationFixture({ repositoryCommit: fakeHead, resultsRoot, ...authorityOverrides });
  await writeFile(authorizationPath, `${stableJson(authority)}\n`);
  return { root, resultsRoot, authorizationPath, authority, dependencies: dependencies(protectedRoot) };
}

async function preparedFixture(options = {}) {
  const value = await fixture(options);
  await prepareQualificationRun({ authorizationPath: value.authorizationPath, resultsRoot: value.resultsRoot, now: fixedNow, dependencies: value.dependencies });
  return value;
}

function offlineProviderAnalysis(serializedRequest) {
  const prompt = JSON.parse(serializedRequest).input[0].content[0].text;
  const selectedMemoryIds = [...prompt.matchAll(/"memoryId":"([^"]+)"/g)].map((match) => match[1]);
  return {
    failureAnalysis: "A bounded visible failure is present at the earliest public evidence boundary.",
    memoryApplicability: selectedMemoryIds.length ? "APPLICABLE" : "NOT_APPLICABLE",
    rationale: "Use the canonical mentor action, visible evidence inventory, and existing authority without expanding scope.",
    uncertaintyAnalysis: "Any unresolved uncertainty remains bounded by the visible evidence and prohibited operations."
  };
}

function rawProviderResponse(caseId, call, serializedRequest) {
  return Buffer.from(JSON.stringify({
    id: `resp_offline_${caseId}_${call}`, model: EXECUTION_LIMITS.model, status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(offlineProviderAnalysis(serializedRequest)) }] }],
    usage: { input_tokens: 100, output_tokens: 10, total_tokens: 110, output_tokens_details: { reasoning_tokens: 2 } }
  }));
}

function offlineTransport() {
  const calls = [];
  return {
    calls,
    async dispatch({ caseId, attempt, serializedRequest }) {
      calls.push({ caseId, attempt });
      return { rawResponseBytes: rawProviderResponse(caseId, calls.length, serializedRequest), complete: true, provider: "OFFLINE_FIXTURE", providerRequestId: `req_${calls.length}`, startedAt: fixedNow, completedAt: fixedNow };
    }
  };
}

function offlineEvaluator(counter = { loads: 0 }) {
  return async () => {
    counter.loads += 1;
    return {
      evaluatorAggregate: PACKAGE_IDENTITIES.evaluatorControlAggregateHash,
      legacyRouteAggregate: "47d483830b1f7e7b512c67928915106b79f8bf6cfec5a795ac5831a626bb8fa7",
      cohortCounts: { offlineFixture: 14 },
      evaluateCase(caseId) {
        return {
          caseId, cohort: "OFFLINE_FIXTURE", safetyCritical: false, expectedClassificationType: "OFFLINE_UNSCORED",
          atomic: { checks: checks.map((checkId) => ({ checkId, passed: false, predicateIds: [`${caseId}-${checkId}`] })), executions: checks.map((checkId) => ({ predicateId: `${caseId}-${checkId}`, type: "OFFLINE", passed: false, failureCode: "OFFLINE_FALSE" })) }
        };
      }
    };
  };
}

test("preparation requires an external authorized unexpired exact control-room record", async () => {
  const value = await fixture();
  try {
    await assert.rejects(prepareQualificationRun({ authorizationPath: path.join(value.root, "absent.json"), resultsRoot: value.resultsRoot, now: fixedNow, dependencies: value.dependencies }), /ENOENT/);
    for (const [name, overrides, pattern] of [
      ["not-authorized", { authorizationStatus: "NOT_AUTHORIZED" }, /V4_AUTHORITY_NOT_AUTHORIZED/],
      ["expired", { expiresAt: "2026-08-21T12:59:59.000Z" }, /AUTHORITY_EXPIRED/],
      ["wrong-commit", { repositoryCommit: "d".repeat(40) }, /AUTHORITY_REPOSITORY_COMMIT_MISMATCH/],
      ["wrong-package", { packageIdentities: { ...PACKAGE_IDENTITIES, publicCorpusRootHash: "e".repeat(64) } }, /AUTHORITY_PACKAGE_IDENTITIES_MISMATCH/],
      ["replay", { replayPermitted: true }, /AUTHORITY_REPLAYPERMITTED_MISMATCH/],
      ["replacement", { replacementCasesPermitted: true }, /AUTHORITY_REPLACEMENTCASESPERMITTED_MISMATCH/]
    ]) {
      const authPath = path.join(value.root, `${name}.json`); const auth = authorizationFixture({ repositoryCommit: fakeHead, resultsRoot: value.resultsRoot, ...overrides });
      await writeFile(authPath, `${stableJson(auth)}\n`);
      await assert.rejects(prepareQualificationRun({ authorizationPath: authPath, resultsRoot: value.resultsRoot, now: fixedNow, dependencies: value.dependencies }), pattern);
    }
    const alteredPath = path.join(value.root, "altered.json"); const altered = structuredClone(value.authority); altered.model = "altered";
    await writeFile(alteredPath, `${stableJson(altered)}\n`);
    await assert.rejects(prepareQualificationRun({ authorizationPath: alteredPath, resultsRoot: value.resultsRoot, now: fixedNow, dependencies: value.dependencies }), /authorizationHash differs/);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("preparation rejects repository/worktree-contained, aliased, and reparse-point result paths", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-v4-path-negative-"));
  try {
    const protectedRoot = path.join(root, "repo"); await mkdir(protectedRoot);
    const authPath = path.join(root, "authority.json");
    const inside = path.join(protectedRoot, "results");
    await writeFile(authPath, `${stableJson(authorizationFixture({ repositoryCommit: fakeHead, resultsRoot: inside }))}\n`);
    await assert.rejects(prepareQualificationRun({ authorizationPath: authPath, resultsRoot: inside, now: fixedNow, dependencies: dependencies(protectedRoot) }), /RESULTS_ROOT_INSIDE_PROTECTED_TREE/);
    const aliasRoot = path.join(root, "ALIAS~1", "results");
    await writeFile(authPath, `${stableJson(authorizationFixture({ repositoryCommit: fakeHead, resultsRoot: aliasRoot }))}\n`);
    await assert.rejects(prepareQualificationRun({ authorizationPath: authPath, resultsRoot: aliasRoot, now: fixedNow, dependencies: dependencies(protectedRoot) }), /SHORT_NAME_PATH_ALIAS_FORBIDDEN/);
    const actualParent = path.join(root, "actual-parent"); const linkedParent = path.join(root, "linked-parent"); await mkdir(actualParent); await symlink(actualParent, linkedParent, process.platform === "win32" ? "junction" : "dir");
    const escaped = path.join(linkedParent, "results");
    await writeFile(authPath, `${stableJson(authorizationFixture({ repositoryCommit: fakeHead, resultsRoot: escaped }))}\n`);
    await assert.rejects(prepareQualificationRun({ authorizationPath: authPath, resultsRoot: escaped, now: fixedNow, dependencies: dependencies(protectedRoot) }), /REPARSE_POINT|PATH_ALIAS/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("successful preparation creates immutable external PREPARED_NOT_STARTED evidence without network or hidden access", async () => {
  const value = await fixture();
  try {
    const result = await prepareQualificationRun({ authorizationPath: value.authorizationPath, resultsRoot: value.resultsRoot, now: fixedNow, dependencies: value.dependencies });
    assert.equal(result.prepared.state, "PREPARED_NOT_STARTED"); assert.equal(result.prepared.providerRequestCount, 0); assert.equal(result.prepared.evaluatorExecutionCount, 0);
    assert.equal(JSON.parse(await readFile(path.join(value.resultsRoot, "authorization-receipt.json"))).authorization.authorizationStatus, "AUTHORIZED");
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("preparation and execution have no direct evaluator import or hidden path access", async () => {
  const sources = await Promise.all(["prepare-core.mjs", "prepare.mjs", "execute-core.mjs", "execute.mjs", "production-transport.mjs"].map((name) => readFile(path.join(routeRoot, name), "utf8")));
  for (const source of sources) assert.doesNotMatch(source, /atomic-scorer|cohort-transfer-map|evaluator[\\/]control|["']hidden[\\/]/i);
  assert.doesNotMatch(sources.slice(0, 2).join("\n"), /production-transport|resolveApprovedCredential|fetch\s*\(/);
});

test("public request construction is deterministic, sealed-public-only, and within authority", async () => {
  const first = await buildCaseRequest(CASE_IDS[0]); const second = await buildCaseRequest(CASE_IDS[0]);
  assert.equal(first.requestHash, second.requestHash); assert.equal(first.visibleInputHash, second.visibleInputHash);
  assert.ok(first.requestBytes <= 64_000); assert.ok(first.reservationUsd <= 1.25);
  assert.doesNotMatch(first.serializedRequest, /expectedResponse|cohort-transfer|atomic\/contract|evaluator\/control|prior results/i);
});

test("offline execution captures and freezes all 14 cases exactly once with no network", async () => {
  const value = await preparedFixture(); const transport = offlineTransport(); const originalFetch = globalThis.fetch;
  let firstFrozenRuntimeEvidence = null;
  globalThis.fetch = async () => { throw new Error("NETWORK_FORBIDDEN_IN_OFFLINE_TEST"); };
  try {
    const result = await executeQualificationRun({
      resultsRoot: value.resultsRoot,
      transport,
      now: () => fixedNow,
      hooks: {
        afterResponseCapture: async ({ caseId }) => {
          if (caseId === CASE_IDS[0]) {
            firstFrozenRuntimeEvidence = await readFile(path.join(value.resultsRoot, "runtime-evidence", `${caseId}.json`));
          }
        }
      }
    });
    assert.equal(result.manifest.entries.length, 14); assert.equal(transport.calls.length, 14);
    assert.deepEqual(transport.calls.map((item) => item.caseId), CASE_IDS);
    const contexts = await Promise.all(CASE_IDS.map((caseId) => readFile(
      path.join(value.resultsRoot, "runtime-context", `${caseId}.json`),
      "utf8"
    ).then(JSON.parse)));
    const runtimeEvidence = await Promise.all(CASE_IDS.map((caseId) => readFile(
      path.join(value.resultsRoot, "runtime-evidence", `${caseId}.json`),
      "utf8"
    ).then(JSON.parse)));
    assert.deepEqual(contexts[0].memoryBeforeIds, [], "the run-scoped Executive Memory must start empty");
    assert.deepEqual(contexts[0].selectedMemoryRecords, [], "no lesson may be seeded before the first episode");
    assert.equal(contexts.every((item) => item.canonicalRuntimeIdentity === CANONICAL_COGNITIVE_RUNTIME_IDENTITY), true);
    assert.equal(contexts.every((item) => /^[a-f0-9]{64}$/.test(item.mentorDecisionIdentity)), true);
    assert.ok(new Set(contexts.map((item) => item.mentorDecisionIdentity)).size > 1, "public state must produce case-specific mentor identities");
    assert.equal(contexts.every((item) => item.cognitiveAction === "EVALUATE_RETURNED_EVIDENCE"), true);
    assert.equal(contexts.every((item) => item.cognitiveBoundary === "DOSSIER_EVALUATION"), true);
    assert.equal(contexts.every((item) => item.mentorDecision.acceptedEvidenceIds.every((evidenceId) => (
      item.visibleEvidenceIds.includes(evidenceId) && !/^[a-f0-9]{64}$/.test(evidenceId)
    ))), true);
    assert.ok(runtimeEvidence.some((item) => item.memoryTransition.lessonDisposition === "ACCEPTED_CANDIDATE"));
    assert.ok(contexts.some((item) => item.selectedMemoryRecords.length > 0), "forward retrieval must observe an earlier governed candidate");
    assert.ok(runtimeEvidence.some((item) => item.memoryTransition.applicableMemoryId), "a retrieved lesson must be capable of governed forward transfer");
    assert.equal(runtimeEvidence.every((item) => item.memoryTransition.beforeMemoryIds.every((memoryId) => (
      item.memoryTransition.afterMemoryIds.includes(memoryId)
    ))), true);
    assert.deepEqual(
      await readFile(path.join(value.resultsRoot, "runtime-evidence", `${CASE_IDS[0]}.json`)),
      firstFrozenRuntimeEvidence,
      "a later case altered an earlier frozen runtime record"
    );
    assert.ok((await readdir(path.join(value.resultsRoot, "runtime-memory"))).length >= 1);
    await assert.rejects(readFile(path.join(routeRoot, "runtime-evidence", `${CASE_IDS[0]}.json`)), /ENOENT/);
    await assert.rejects(executeQualificationRun({ resultsRoot: value.resultsRoot, transport, now: () => fixedNow }), /DUPLICATE_EXECUTION_INVOCATION/);
    assert.equal(transport.calls.length, 14);
  } finally { globalThis.fetch = originalFetch; await rm(value.root, { recursive: true, force: true }); }
});

test("product and V4 execute the same canonical cognitive-runtime function and existing mentor", async () => {
  assert.equal(typeof runCanonicalCognitiveRuntime, "function");
  const [productSource, routeSource, policySource] = await Promise.all([
    readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8"),
    readFile(new URL("../qualification/synthetic-executive/v4-qualification-route/execute-core.mjs", import.meta.url), "utf8"),
    readFile(new URL("../lib/cognitive-governor/policy.js", import.meta.url), "utf8")
  ]);
  assert.match(productSource, /runCanonicalCognitiveRuntime\s*\(/);
  assert.match(routeSource, /runCanonicalCognitiveRuntime\s*\(/);
  assert.match(policySource, /assertMentorGuidedDecisionAssembly\s*\(/);
  assert.match(policySource, /mentorDecisionIdentity/);
});

test("a second qualification run creates a distinct empty Executive Memory Store", async () => {
  const first = await preparedFixture({ authorityOverrides: { runId: "offline-v4-run-one" } });
  const second = await preparedFixture({ authorityOverrides: { runId: "offline-v4-run-two" } });
  try {
    await executeQualificationRun({ resultsRoot: first.resultsRoot, transport: offlineTransport(), now: () => fixedNow });
    await executeQualificationRun({ resultsRoot: second.resultsRoot, transport: offlineTransport(), now: () => fixedNow });
    const firstContext = JSON.parse(await readFile(path.join(first.resultsRoot, "runtime-context", `${CASE_IDS[0]}.json`), "utf8"));
    const secondContext = JSON.parse(await readFile(path.join(second.resultsRoot, "runtime-context", `${CASE_IDS[0]}.json`), "utf8"));
    assert.deepEqual(firstContext.memoryBeforeIds, []);
    assert.deepEqual(secondContext.memoryBeforeIds, []);
    assert.notEqual(first.authority.runId, second.authority.runId);
  } finally {
    await rm(first.root, { recursive: true, force: true });
    await rm(second.root, { recursive: true, force: true });
  }
});

for (const scenario of [
  { name: "before dispatch intent", hook: "beforeDispatchIntent", code: "INTERRUPT_BEFORE_INTENT", expectedCallsBefore: 0, expectedTotalCalls: 14 },
  { name: "after dispatch intent", hook: "afterDispatchIntent", code: "INTERRUPT_AFTER_INTENT", expectedCallsBefore: 0, expectedTotalCalls: 13 },
  { name: "after provider response capture", hook: "afterResponseCapture", code: "INTERRUPT_AFTER_CAPTURE", expectedCallsBefore: 1, expectedTotalCalls: 14 }
]) test(`crash recovery ${scenario.name} never duplicates a provider request`, async () => {
  const value = await preparedFixture(); const transport = offlineTransport(); let fired = false;
  const hooks = { [scenario.hook]: async () => { if (!fired) { fired = true; const error = new Error(scenario.code); error.code = scenario.code; throw error; } } };
  try {
    await assert.rejects(executeQualificationRun({ resultsRoot: value.resultsRoot, transport, hooks, now: () => fixedNow }), new RegExp(scenario.code));
    assert.equal(transport.calls.length, scenario.expectedCallsBefore);
    const result = await executeQualificationRun({ resultsRoot: value.resultsRoot, transport, resume: true, now: () => fixedNow });
    assert.equal(result.manifest.entries.length, 14); assert.equal(transport.calls.length, scenario.expectedTotalCalls);
    assert.equal(new Set(transport.calls.map((item) => `${item.caseId}:${item.attempt}`)).size, transport.calls.length);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("request, output, retry, reservation, total-cost, incomplete-capture, and overflow guards fail closed", () => {
  assert.throws(() => assertRequestAuthority({ requestBytes: 64_001, outputTokens: 4_000, reservationUsd: 1 }), /REQUEST_BYTE/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_001, reservationUsd: 1 }), /OUTPUT_TOKEN/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_000, reservationUsd: 1, retryCount: 13 }), /RETRY_CEILING/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_000, reservationUsd: 1.25000001 }), /SLOT_RESERVATION/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_000, reservationUsd: 1, priorReservedUsd: 11.00000001 }), /TOTAL_COST/);
  assert.throws(() => assertMechanicalRetryReason("QUALITY_BASED_RETRY"), /UNAUTHORIZED_OR_QUALITY_BASED_RETRY/);
  assert.throws(() => assertResponseCapture(Buffer.from("incomplete"), false), /INCOMPLETE_RESPONSE_CAPTURE/);
  assert.equal(assertResponseCapture(Buffer.alloc(1_048_576)), true);
  assert.throws(() => assertResponseCapture(Buffer.alloc(1_048_577)), /RESPONSE_CAPTURE_OVERFLOW_1048577/);
});

test("freeze and evaluator access are denied before all terminal seals", async () => {
  const value = await preparedFixture(); const counter = { loads: 0 };
  try {
    await assert.rejects(freezeTerminalResponses(value.resultsRoot, fixedNow), /FREEZE_REQUIRES_ALL_14_TERMINAL_CASES/);
    await assert.rejects(evaluateFrozenQualification({ resultsRoot: value.resultsRoot, now: fixedNow, dependencies: { loadEvaluator: offlineEvaluator(counter) } }), /EVALUATION_REQUIRES_FROZEN_RESPONSE_MANIFEST/);
    assert.equal(counter.loads, 0);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("modified response after capture is rejected before evaluator access", async () => {
  const value = await preparedFixture(); const transport = offlineTransport(); const counter = { loads: 0 };
  try {
    await executeQualificationRun({ resultsRoot: value.resultsRoot, transport, now: () => fixedNow });
    await writeFile(path.join(value.resultsRoot, "captures", `${CASE_IDS[0]}-attempt-01.bin`), Buffer.from("altered"));
    await assert.rejects(evaluateFrozenQualification({ resultsRoot: value.resultsRoot, now: fixedNow, dependencies: { loadEvaluator: offlineEvaluator(counter) } }), /RAW_RESPONSE_CHANGED_AFTER_CAPTURE/);
    assert.equal(counter.loads, 0);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("offline evaluation is separate, preserves 98 checks, and rejects a second invocation", async () => {
  const value = await preparedFixture(); const transport = offlineTransport(); const counter = { loads: 0 };
  try {
    await executeQualificationRun({ resultsRoot: value.resultsRoot, transport, now: () => fixedNow });
    const result = await evaluateFrozenQualification({ resultsRoot: value.resultsRoot, now: fixedNow, dependencies: { loadEvaluator: offlineEvaluator(counter) } });
    assert.equal(result.denominator, 98); assert.equal(result.evaluatorExecutionCount, 1); assert.equal(result.qualified, false); assert.equal(counter.loads, 1);
    await assert.rejects(evaluateFrozenQualification({ resultsRoot: value.resultsRoot, now: fixedNow, dependencies: { loadEvaluator: offlineEvaluator(counter) } }), /EVALUATOR_EXECUTION_ALREADY_ATTEMPTED/);
    assert.equal(counter.loads, 1);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("recovery evaluation preserves the original failed intent and writes exactly once only to external recovery evidence", async () => {
  const value = await preparedFixture(); const transport = offlineTransport(); const counter = { loads: 0 };
  const correctionHead = "d".repeat(40); const correctionTree = "e".repeat(40);
  try {
    await executeQualificationRun({ resultsRoot: value.resultsRoot, transport, now: () => fixedNow });
    await assert.rejects(
      evaluateFrozenQualification({
        resultsRoot: value.resultsRoot,
        now: fixedNow,
        dependencies: { loadEvaluator: async () => { throw new Error("EVALUATOR_AGGREGATE_CHANGED"); } }
      }),
      /EVALUATOR_AGGREGATE_CHANGED/
    );
    const manifest = JSON.parse(await readFile(path.join(value.resultsRoot, "freeze", "frozen-response-manifest.json")));
    const freezeSeal = JSON.parse(await readFile(path.join(value.resultsRoot, "freeze", "freeze-seal.json")));
    const originalIntent = JSON.parse(await readFile(path.join(value.resultsRoot, "evaluation", "evaluation-intent.json")));
    const recoveryRoot = path.join(value.root, "recovery-evidence");
    const recoveryAuthorityPath = path.join(recoveryRoot, "recovery-authority.json");
    await mkdir(recoveryRoot);
    const recoveryAuthority = seal({
      schemaVersion: "1.0", recordType: "EXTERNAL_V4_EVALUATOR_RECOVERY_AUTHORITY",
      authorizationStatus: "AUTHORIZED", recoveryId: "OFFLINE-V4-RECOVERY",
      issuedAt: fixedNow, expiresAt: "2026-08-21T16:00:00.000Z",
      originalRunId: value.authority.runId, originalAuthorizationId: value.authority.authorizationId,
      originalResultsRoot: value.resultsRoot, recoveryResultsRoot: recoveryRoot,
      originalEvaluationIntentHash: originalIntent.evaluationIntentHash,
      frozenIdentities: {
        freezeSealHash: freezeSeal.freezeSealHash, manifestHash: manifest.manifestHash,
        responseSetAggregateHash: manifest.responseSetAggregateHash,
        runtimeEvidenceAggregateHash: manifest.runtimeEvidenceAggregateHash,
        runtimeMemoryAggregateHash: manifest.runtimeMemoryAggregateHash
      },
      oldRepositoryCommit: fakeHead, newRepositoryCommit: correctionHead, newRepositoryTree: correctionTree,
      routeVersion: ROUTE_VERSION, packageIdentities: PACKAGE_IDENTITIES,
      priorFailure: {
        failureCode: "EVALUATOR_AGGREGATE_CHANGED",
        expectedAggregate: PACKAGE_IDENTITIES.evaluatorControlAggregateHash,
        observedAggregate: "47d483830b1f7e7b512c67928915106b79f8bf6cfec5a795ac5831a626bb8fa7"
      },
      scorerPreviouslyLoaded: false, atomicScoresPreviouslyProduced: 0,
      maximumRecoveryEvaluationAttempts: 1, providerRequestCountPermitted: 0,
      originalEvidenceWritePermitted: false, responseMutationPermitted: false
    }, "recoveryAuthorityHash");
    await writeFile(recoveryAuthorityPath, `${stableJson(recoveryAuthority)}\n`, { flag: "wx" });
    const recoveryDependencies = {
      loadEvaluator: offlineEvaluator(counter),
      inspectRepository: async () => ({
        head: correctionHead, tree: correctionTree, parent: fakeHead, subject: "fix: align v4 evaluator aggregate verification",
        status: "", gitDirectory: path.join(value.root, "protected", ".git", "worktrees", "fixture"),
        commonDirectory: path.join(value.root, "protected", ".git"), worktreeRoots: [path.join(value.root, "protected")]
      }),
      inspectPackageIdentities: async () => ({ ...PACKAGE_IDENTITIES, manifest: {} })
    };
    const recovered = await evaluateFrozenQualificationRecovery({
      resultsRoot: value.resultsRoot, recoveryRoot, recoveryAuthorityPath, now: fixedNow,
      dependencies: recoveryDependencies
    });
    assert.equal(recovered.result.denominator, 98);
    assert.equal(recovered.result.recoveryEvaluation, true);
    assert.equal(recovered.result.originalIntegrityInvalidPreserved, true);
    assert.equal(recovered.result.originalResultsWriteCount, 0);
    assert.equal(counter.loads, 1);
    assert.deepEqual((await readdir(path.join(value.resultsRoot, "evaluation"))).sort(), ["evaluation-intent.json"]);
    assert.deepEqual((await readdir(recoveryRoot)).sort(), [
      "recovery-authority.json", "recovery-evaluation-intent.json", "recovery-evaluator-result.json"
    ]);
    await assert.rejects(
      evaluateFrozenQualificationRecovery({
        resultsRoot: value.resultsRoot, recoveryRoot, recoveryAuthorityPath, now: fixedNow,
        dependencies: recoveryDependencies
      }),
      /RECOVERY_ROOT_NOT_PRISTINE|RECOVERY_EVALUATOR_EXECUTION_ALREADY_ATTEMPTED/
    );
    assert.equal(counter.loads, 1);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("evaluator mutation cannot influence the frozen runtime-memory identity", async () => {
  const value = await preparedFixture(); const transport = offlineTransport(); const counter = { loads: 0 };
  try {
    await executeQualificationRun({ resultsRoot: value.resultsRoot, transport, now: () => fixedNow });
    const existingName = (await readdir(path.join(value.resultsRoot, "runtime-memory")))[0];
    const injectedBytes = await readFile(path.join(value.resultsRoot, "runtime-memory", existingName));
    const baseLoader = offlineEvaluator(counter);
    const mutatingLoader = async () => {
      const evaluator = await baseLoader();
      await writeFile(path.join(value.resultsRoot, "runtime-memory", "evaluator-injected.json"), injectedBytes);
      return evaluator;
    };
    await assert.rejects(
      evaluateFrozenQualification({ resultsRoot: value.resultsRoot, now: fixedNow, dependencies: { loadEvaluator: mutatingLoader } }),
      /EVALUATOR_RUNTIME_MEMORY_WRITE_DENIED/
    );
    assert.equal(counter.loads, 1);
  } finally { await rm(value.root, { recursive: true, force: true }); }
});

test("offline route tests leave the sealed corpus byte-identical", async () => {
  const manifest = path.join(corpusRoot, "readiness-integrity-manifest.json");
  assert.equal(sha256Bytes(await readFile(manifest)), PACKAGE_IDENTITIES.integrityManifestSha256);
});
