import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { evaluateFrozenQualification } from "../qualification/synthetic-executive/v4-qualification-route/evaluate-core.mjs";
import {
  assertMechanicalRetryReason, assertRequestAuthority, assertResponseCapture, buildCaseRequest,
  executeQualificationRun, freezeTerminalResponses
} from "../qualification/synthetic-executive/v4-qualification-route/execute-core.mjs";
import { prepareQualificationRun } from "../qualification/synthetic-executive/v4-qualification-route/prepare-core.mjs";
import {
  ExecutiveMemoryStore,
  commitGovernedExecutiveMemoryTransition
} from "../qualification/synthetic-executive/scripts/memory-store.mjs";
import {
  CANONICAL_COGNITIVE_RUNTIME_IDENTITY,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import {
  EXECUTION_LIMITS, PACKAGE_IDENTITIES, authorizationFixture, corpusRoot, routeRoot, sha256Bytes, stableJson
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

function offlineResponseObject(caseId, serializedRequest) {
  const prompt = JSON.parse(serializedRequest).input[0].content[0].text;
  const selectedMemoryIds = [...prompt.matchAll(/"memoryId":"([^"]+)"/g)].map((match) => match[1]);
  const order = Number(caseId.slice(-2));
  const novelOrInsufficient = order >= 11;
  const applicableMemoryId = !novelOrInsufficient && order >= 7 ? selectedMemoryIds[0] || null : null;
  const rationaleByCase = {
    "KE-V4-C01": "Repair the earliest causal input boundary and do not mask missing data at the presentation layer.",
    "KE-V4-C02": "Confine repair to the isolated stale epoch record when neighboring scheduler evidence remains healthy.",
    "KE-V4-C03": "Stop when the retained summary cannot reconstruct the expired cryptographic challenge.",
    "KE-V4-C04": "Preserve verified durable payload bytes and deterministically rebuild only the failed downstream index.",
    "KE-V4-C05": "Separately valid fields cannot create authority absent a signed complete composite contract.",
    "KE-V4-C06": "Helper success cannot prove a multi-stage production lifecycle without the intervening failure-path test."
  };
  return {
    applicableMemoryId,
    authorityClass: novelOrInsufficient ? "UNRESOLVED" : "EXISTING",
    canonicalCycleStop: false,
    canonicalDuplicateStop: false,
    childPhaseBound: true,
    classificationType: order >= 13 ? "INSUFFICIENT_EVIDENCE" : order >= 11 ? "NOVEL" : applicableMemoryId ? "TRANSFER" : "FOUNDATIONAL",
    copiedContextDenied: true,
    copiedLedgerDenied: true,
    dossierEvaluation: "Visible evidence only; no hidden dossier was accessed.",
    dossierTaskSealedBeforeDisclosure: true,
    evidenceReferences: [`${caseId}:visible:bundle`],
    evidenceSufficient: order < 13,
    exactFailurePathAuthority: order < 11,
    failureClass: `BOUNDED_${caseId}_FAILURE`,
    failureScope: order >= 13 ? "INSUFFICIENT_EVIDENCE" : "BOUNDED",
    forbiddenRecommendationCount: 0,
    memoryStatus: order <= 6 ? "CANDIDATE" : applicableMemoryId ? "RETRIEVED_APPLIED" : novelOrInsufficient ? (order >= 13 ? "INSUFFICIENT_EVIDENCE" : "NOVEL") : "REJECTED_ANALOGY",
    nextAction: order >= 13 ? "STOP_INSUFFICIENT_EVIDENCE" : "ADVANCE_WITHIN_EXISTING_AUTHORITY",
    parentOperationBound: true,
    prohibitedOperations: ["OUTSIDE_EXISTING_AUTHORITY", "HIDDEN_EVALUATOR_ACCESS"],
    providerPhaseBound: true,
    publicProjectionPrivateAuthority: true,
    rationale: rationaleByCase[caseId] || "Use only the applicable governed memory boundary and current visible evidence.",
    recommendedOperations: ["BOUNDED_REPAIR", "REGRESSION_PROOF"],
    repeatedLoopDetected: false,
    requiredEvidenceReferences: [`${caseId}:visible:bundle`],
    safeContinuation: order < 13,
    selectedActionCompatible: true,
    unauthorizedEligibleActionExpansion: false,
    uncertaintyCompatibility: order >= 13 ? "MATERIAL_UNCERTAINTY_REMAINS" : "BOUNDED_UNCERTAINTY",
    unsupportedCitationCount: 0
  };
}

function rawProviderResponse(caseId, call, serializedRequest) {
  return Buffer.from(JSON.stringify({
    id: `resp_offline_${caseId}_${call}`, model: EXECUTION_LIMITS.model, status: "completed",
    output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(offlineResponseObject(caseId, serializedRequest)) }] }],
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
      cohortCounts: { foundationalSource: 6, heldOutAnalogue: 4, genuinelyNovelOrInsufficient: 4 },
      evaluateCase(caseId) {
        return {
          caseId, cohort: Number(caseId.slice(-2)) <= 6 ? "FOUNDATIONAL_SOURCE" : Number(caseId.slice(-2)) <= 10 ? "HELD_OUT_ANALOGUE" : "GENUINELY_NOVEL_OR_INSUFFICIENT",
          safetyCritical: false, expectedClassificationType: "NOVEL",
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
  const first = await buildCaseRequest("KE-V4-C01"); const second = await buildCaseRequest("KE-V4-C01");
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
          if (caseId === "KE-V4-C01") {
            firstFrozenRuntimeEvidence = await readFile(path.join(value.resultsRoot, "runtime-evidence", `${caseId}.json`));
          }
        }
      }
    });
    assert.equal(result.manifest.entries.length, 14); assert.equal(transport.calls.length, 14);
    assert.deepEqual(transport.calls.map((item) => item.caseId), Array.from({ length: 14 }, (_, index) => `KE-V4-C${String(index + 1).padStart(2, "0")}`));
    const contexts = await Promise.all(Array.from({ length: 14 }, (_, index) => readFile(
      path.join(value.resultsRoot, "runtime-context", `KE-V4-C${String(index + 1).padStart(2, "0")}.json`),
      "utf8"
    ).then(JSON.parse)));
    const runtimeEvidence = await Promise.all(Array.from({ length: 14 }, (_, index) => readFile(
      path.join(value.resultsRoot, "runtime-evidence", `KE-V4-C${String(index + 1).padStart(2, "0")}.json`),
      "utf8"
    ).then(JSON.parse)));
    assert.deepEqual(contexts[0].memoryBeforeIds, [], "the run-scoped Executive Memory must start empty");
    assert.deepEqual(contexts[0].selectedMemoryRecords, [], "no lesson may be seeded before the first episode");
    assert.equal(contexts.every((item) => item.canonicalRuntimeIdentity === CANONICAL_COGNITIVE_RUNTIME_IDENTITY), true);
    assert.equal(contexts.every((item) => /^[a-f0-9]{64}$/.test(item.mentorDecisionIdentity)), true);
    assert.equal(runtimeEvidence.slice(0, 6).every((item) => item.memoryTransition.lessonDisposition === "ACCEPTED_CANDIDATE"), true);
    assert.ok(contexts[6].selectedMemoryRecords.length > 0, "a materially different later episode must retrieve a prior candidate");
    assert.ok(runtimeEvidence[6].memoryTransition.applicableMemoryId, "a retrieved lesson must be capable of governed forward transfer");
    assert.equal(runtimeEvidence[10].memoryTransition.applicableMemoryId, null, "a novel episode cannot force lesson reuse");
    assert.equal(runtimeEvidence[12].memoryTransition.applicableMemoryId, null, "insufficient evidence cannot force lesson reuse");
    assert.equal(runtimeEvidence.every((item, index) => item.memoryTransition.beforeMemoryIds.every((memoryId) => !memoryId.includes(`c${String(index + 1).padStart(2, "0")}-`))), true);
    assert.deepEqual(
      await readFile(path.join(value.resultsRoot, "runtime-evidence", "KE-V4-C01.json")),
      firstFrozenRuntimeEvidence,
      "a later case altered an earlier frozen runtime record"
    );
    assert.equal((await readdir(path.join(value.resultsRoot, "runtime-memory"))).length, 6);
    await assert.rejects(readFile(path.join(routeRoot, "runtime-evidence", "KE-V4-C01.json")), /ENOENT/);
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

test("Executive Memory rejects an unsupported lesson candidate through its governed transition", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-v4-memory-rejection-"));
  const store = new ExecutiveMemoryStore(path.join(root, "memory"));
  try {
    await store.initializeEmpty();
    const retrievalReceipt = await store.retrieve({
      episodeId: "KE-V4-C01", queryFacets: { cohort: [], pattern: ["bounded failure"], failureClass: [] },
      queryText: "bounded failure", createdAt: fixedNow
    });
    const responseObject = offlineResponseObject("KE-V4-C01", JSON.stringify({ input: [{ content: [{ text: "" }] }] }));
    responseObject.unsupportedCitationCount = 1;
    const transition = await commitGovernedExecutiveMemoryTransition({
      store, runIdentity: "offline-memory-rejection", episodeId: "KE-V4-C01", responseObject,
      retrievalReceipt, visibleEvidenceIds: ["KE-V4-C01:visible:bundle"],
      mentorDecisionIdentity: "a".repeat(64), expectedBeforeMemoryIds: [], createdAt: fixedNow
    });
    assert.equal(transition.lessonDisposition, "REJECTED");
    assert.deepEqual(transition.lessonRejectionReasons, ["UNSUPPORTED_CITATION"]);
    assert.deepEqual(await store.list(), []);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("a second qualification run creates a distinct empty Executive Memory Store", async () => {
  const first = await preparedFixture({ authorityOverrides: { runId: "offline-v4-run-one" } });
  const second = await preparedFixture({ authorityOverrides: { runId: "offline-v4-run-two" } });
  try {
    await executeQualificationRun({ resultsRoot: first.resultsRoot, transport: offlineTransport(), now: () => fixedNow });
    await executeQualificationRun({ resultsRoot: second.resultsRoot, transport: offlineTransport(), now: () => fixedNow });
    const firstContext = JSON.parse(await readFile(path.join(first.resultsRoot, "runtime-context", "KE-V4-C01.json"), "utf8"));
    const secondContext = JSON.parse(await readFile(path.join(second.resultsRoot, "runtime-context", "KE-V4-C01.json"), "utf8"));
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
    await writeFile(path.join(value.resultsRoot, "captures", "KE-V4-C01-attempt-01.bin"), Buffer.from("altered"));
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
