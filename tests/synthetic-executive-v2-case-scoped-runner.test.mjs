import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ACTION_REGISTRY } from "../qualification/synthetic-executive/scripts/executive-action-registry.mjs";
import { ACTION_SCHEMA_VERSION } from "../qualification/synthetic-executive/scripts/action-broker.mjs";
import { seal, sha256Bytes, sha256Json, writeExclusiveJson } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import { createQualificationActionTransportSchema, buildQualificationInferenceRequestEnvelope, buildQualificationPrompt, loadQualificationProviderProfile } from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs";
import { SafeProviderFailure, unavailableProviderDiagnostics } from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";
import { materializeV2ProviderVisibleCase } from "../qualification/synthetic-executive/v2-held-out-corpus/scripts/v2-visible-assembler.mjs";
import {
  AppendOnlyLedger, LIMITS, SCOREABLE_CASE_STATUSES, STARTING, SUCCESSOR_CASES,
  activateSuccessorAuthority, aggregateSealedResults, buildIncludedCaseInventory, consumeAuthoritySlot,
  createSuccessorAuthority, executeV2CaseUnit, executeWholeRunWithCaseUnit, observedStateHash,
  terminalizeSuccessorAuthority, validateSingleCaseSelection
} from "../qualification/synthetic-executive/qualification-real-route/scripts/v2-case-scoped-runner.mjs";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");
const fixedTime = "2026-08-12T20:00:00.000Z";

function sample(schema, label = "fixture") {
  if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties).map(([key, child]) => [key, sample(child, key)]));
  if (schema.type === "array") return Array.from({ length: schema.minItems || 0 }, () => sample(schema.items, label));
  if (schema.enum) return schema.enum[0];
  if (schema.type === "number" || schema.type === "integer") return schema.minimum || 0;
  if (schema.type === "boolean") return true;
  return `${label}-value`;
}

function details(actionType, turn, evidence) {
  if (actionType === "RETRIEVE_RELEVANT_MEMORY") return { queryText: "bounded structural failure", queryFacets: { cohort: [turn.cohort], pattern: ["structural failure"], failureClass: [] } };
  if (actionType === "DECLARE_NOVEL_FAILURE") return { failureClass: "PURPOSE_NEUTRAL_STRUCTURAL_FAILURE" };
  if (actionType === "PROPOSE_BOUNDED_ENGINEERING_TASK") return { exactFailureClass: "PURPOSE_NEUTRAL_STRUCTURAL_FAILURE", affectedComponents: ["bounded component"], proposedChangeSurface: ["bounded contract"], explicitlyExcludedComponents: ["product", "production", "benchmark"], generalizedInvariant: "Keep one bounded contract aligned.", minimumRequiredRegressionSet: ["unit", "path", "negative", "recovery"], exactPathOrStateProofRequirement: "Prove the bounded path.", rollbackRequirement: "Revert only the bounded change.", stopCondition: "Stop on contradiction.", costAndToolEstimate: { toolSteps: 1, costUsd: 0 }, requestedAuthority: "BOUNDED_ENGINEERING" };
  if (actionType === "SPECIFY_REGRESSION_PROOF") return { helperUnitProof: "required", exactProductionPathProof: "required", historicalStateProof: "required", negativeProof: "required", restartOrRecoveryProof: "required", forbiddenActivityProof: "required" };
  if (actionType === "EVALUATE_RETURNED_ENGINEERING_EVIDENCE") return { classification: "VALID_PASS", requiredClaims: [{ claimId: "purpose-neutral", status: "PROVEN", evidenceReferences: [evidence] }] };
  if (actionType === "WRITE_GENERALIZED_LESSON_CANDIDATE") return { memoryRecord: { schemaVersion: "1.0", memoryType: "GENERALIZED_LESSON_CANDIDATE", memoryId: `memory-${turn.episodeId.toLowerCase()}`, sourceEpisodeIds: [turn.episodeId], evidenceReferences: [evidence], evidenceAggregateHash: sha256Json([evidence]), observedFailurePattern: "A bounded contract diverged.", generalizedRule: "Keep bounded contracts aligned.", triggeringConditions: ["verified divergence"], applicabilityBoundaries: ["same contract boundary"], explicitNonApplicabilityConditions: ["contradictory evidence"], recurrenceSignature: "PURPOSE_NEUTRAL_STRUCTURAL_FAILURE", recommendedActionPattern: "REQUEST_BOUNDED_ENGINEERING_AUTHORITY", prohibitedActions: ["production execution"], requiredProofBeforeAdvancement: ["bounded path proof"], authorityNormallyRequired: "BOUNDED_ENGINEERING", confidence: 0.7, unresolvedUncertainty: [], status: "CANDIDATE", predecessorMemoryIds: [] } };
  if (actionType === "SELECT_NEXT_LEGAL_ACTION") return { selection: "REQUEST_BOUNDED_ENGINEERING_AUTHORITY" };
  if (actionType === "STOP_SAFELY") return { stopReason: "Purpose-neutral lifecycle complete." };
  const definition = ACTION_REGISTRY.find((item) => item.actionType === actionType); return sample(definition.detailsSchema);
}

class MockLifecycleClient {
  constructor({ terminalFailure = null } = {}) { this.calls = 0; this.requests = []; this.terminalFailure = terminalFailure; }
  async decisionTurn({ serializedRequest, requestHash }) {
    assert.equal(sha256Bytes(Buffer.from(serializedRequest)), requestHash); this.calls += 1; this.requests.push(serializedRequest);
    if (this.terminalFailure) throw this.terminalFailure;
    const request = JSON.parse(serializedRequest); const prompt = request.input[0].content[0].text; const turn = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
    const actionByState = { CASE_OPEN: "RECONSTRUCT_EPISODE", EPISODE_RECONSTRUCTED: "RETRIEVE_RELEVANT_MEMORY", MEMORY_RETRIEVED: "DECLARE_NOVEL_FAILURE", FAILURE_CLASSIFIED: "PROPOSE_BOUNDED_ENGINEERING_TASK", TASK_PROPOSED: "SPECIFY_REGRESSION_PROOF", PROOF_SPECIFIED: "SPECIFY_REQUIRED_AUTHORITY", WORKER_DOSSIER_RECEIVED: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", EVIDENCE_EVALUATED: "WRITE_GENERALIZED_LESSON_CANDIDATE", LESSON_RECORDED: "SELECT_NEXT_LEGAL_ACTION", NEXT_ACTION_SELECTED: "STOP_SAFELY" };
    const actionType = actionByState[turn.executiveState]; const evidence = turn.materializationBinding.canonicalArtifactOrder[0];
    const actionCore = { schemaVersion: ACTION_SCHEMA_VERSION, actionId: request.text.format.schema.properties.actionId.enum[0], episodeId: turn.episodeId, executiveState: turn.executiveState, observedStateHash: turn.observedStateHash, factualFindings: ["Purpose-neutral mocked finding."], uncertainties: ["No qualification claim."], confidence: 0.7, boundedRationaleSummary: "Exercise only the sealed action lifecycle.", prohibitedOperations: ["provider tools", "source mutation", "production execution", "evaluator access"], decision: { actionType, details: details(actionType, turn, evidence), evidenceReferences: [evidence], memoryReferences: [], authorityClass: actionType === "SPECIFY_REQUIRED_AUTHORITY" ? "BOUNDED_ENGINEERING" : "NO_NEW_AUTHORITY" } };
    const usage = { complete: true, inputTokens: 100, cachedInputTokens: 0, outputTokens: 50, reasoningTokens: 20, totalTokens: 150 };
    const safe = { providerResponseId: `resp_mock_${this.calls}`, providerRequestId: `req_mock_${this.calls}`, modelId: "gpt-5.6-sol", responseStatus: "completed", usage, actionCoreHash: sha256Json(actionCore), providerDiagnostics: { httpStatus: 200 }, safeResponseEvidence: { responseStatus: "completed", returnedModel: "gpt-5.6-sol", usage } };
    return Object.freeze({ ...safe, safeResponseHash: sha256Json(safe), actionCore });
  }
}

async function sourceSealIn(temporary) {
  const relativePath = "qualification/synthetic-executive/qualification-real-route/scripts/v2-case-scoped-runner.mjs";
  const executableFiles = [{ relativePath, sha256: sha256Bytes(await readFile(path.join(repositoryRoot, relativePath))) }];
  const core = { schemaVersion: "1.0", sealType: "V2_CASE_SCOPED_UNCOMMITTED_SOURCE_DIFF_SEAL", startingIdentity: { version: STARTING.version, branch: STARTING.branch, commit: STARTING.commit, tree: STARTING.tree }, priorExecutableAggregateHash: STARTING.executableAggregateHash, uncommittedDiffHash: "d".repeat(64), executableFiles, changedFileHashes: executableFiles, correctedExecutableAggregateHash: sha256Json({ priorExecutableAggregateHash: STARTING.executableAggregateHash, executableFiles }) };
  const value = { ...core, sourceSealHash: sha256Json(core) }; const filePath = path.join(temporary, "source-seal.json"); await writeExclusiveJson(filePath, value); return filePath;
}

test("case-scoped selector accepts exactly one C08-C14 case and rejects multiple, unknown, completed or unavailable cases", () => {
  assert.equal(validateSingleCaseSelection(["KE-V2-C08"]), "KE-V2-C08"); assert.equal(validateSingleCaseSelection(["KE-V2-C14"]), "KE-V2-C14");
  assert.throws(() => validateSingleCaseSelection([]), /EXACTLY_ONE_CASE/); assert.throws(() => validateSingleCaseSelection(["KE-V2-C08", "KE-V2-C09"]), /EXACTLY_ONE_CASE/);
  assert.throws(() => validateSingleCaseSelection(["KE-V2-C07"]), /NOT_AUTHORIZED/); assert.throws(() => validateSingleCaseSelection(["UNKNOWN"]), /NOT_AUTHORIZED/);
});

test("whole-run compatibility invokes the same extracted unit in exact order", async () => {
  const calls = []; const slots = SUCCESSOR_CASES.map((caseId) => ({ caseId }));
  const result = await executeWholeRunWithCaseUnit({ slots, executeCase: async ({ slot }) => { calls.push(slot.caseId); return slot.caseId; }, contextForSlot: async (slot) => ({ slot }) });
  assert.deepEqual(calls, SUCCESSOR_CASES); assert.deepEqual(result, SUCCESSOR_CASES);
});

test("authority is create-only with exactly seven immutable slots, activates once, and rejects duplicate or out-of-order use", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-case-authority-"));
  try {
    const resultRoot = path.join(temporary, "result"); const sourceSealPath = await sourceSealIn(temporary); const { authority } = await createSuccessorAuthority({ resultRoot, sourceSealPath, createdAt: fixedTime });
    assert.equal(authority.caseSlots.length, 7); assert.deepEqual(authority.caseSlots.map((slot) => slot.caseId), SUCCESSOR_CASES); assert.deepEqual(authority.caseSlots.map((slot) => slot.limits), Array(7).fill(LIMITS.perCase));
    await assert.rejects(createSuccessorAuthority({ resultRoot, sourceSealPath, createdAt: fixedTime }));
    const activation = await activateSuccessorAuthority({ resultRoot, activatedAt: fixedTime }); assert.equal(activation.state, "ACTIVE_CASE_SLOTS"); assert.equal(activation.globallyConsumed, false);
    await assert.rejects(activateSuccessorAuthority({ resultRoot, activatedAt: fixedTime }), /ACTIVATION_REQUIRES_ISSUED/);
    const c08Root = path.join(resultRoot, "cases", "KE-V2-C08"); await mkdir(c08Root);
    await assert.rejects(consumeAuthoritySlot({ resultRoot, authority, caseId: "KE-V2-C09", caseRoot: c08Root, requestHash: "a".repeat(64) }), /OUT_OF_ORDER/);
    const receipt = await consumeAuthoritySlot({ resultRoot, authority, caseId: "KE-V2-C08", caseRoot: c08Root, requestHash: "a".repeat(64) }); assert.equal(receipt.status, "PERMANENTLY_CONSUMED");
    await assert.rejects(consumeAuthoritySlot({ resultRoot, authority, caseId: "KE-V2-C08", caseRoot: c08Root, requestHash: "a".repeat(64) }), /OUT_OF_ORDER|ALREADY_CONSUMED/);
    const c09Root = path.join(resultRoot, "cases", "KE-V2-C09"); await mkdir(c09Root);
    await assert.rejects(consumeAuthoritySlot({ resultRoot, authority, caseId: "KE-V2-C09", caseRoot: c09Root, requestHash: "b".repeat(64) }), /ENOENT|no such file/i);
    const ledger = await new AppendOnlyLedger({ root: path.join(resultRoot, "authority-ledger"), authorityHash: authority.authorityHash, ledgerType: "IMMUTABLE_V2_CASE_SCOPED_AUTHORITY_EVENT" }).initialize();
    assert.equal(ledger.summary().activations, 1); assert.equal(ledger.summary().caseSlotConsumptions, 1);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

async function mockExecution({ temporary, terminalFailure = null, viaWholeRun = false, aggregateBefore = null }) {
  const resultRoot = path.join(temporary, "result"); await mkdir(path.join(resultRoot, "cases"), { recursive: true });
  const { episode } = await materializeV2ProviderVisibleCase("KE-V2-C08");
  const authorityCore = { schemaVersion: "1.0", authorityType: "TEST", authorityId: "test-authority", authorityHash: "a".repeat(64) };
  const slot = { caseId: "KE-V2-C08", episodeHash: episode.episodeHash, caseManifestHash: "b".repeat(64), sequencePosition: 1, originalSequencePosition: 8, caseSlotHash: "c".repeat(64) };
  const client = new MockLifecycleClient({ terminalFailure }); let slotCalls = 0;
  const context = { authority: authorityCore, slot, resultRoot, profile: await loadQualificationProviderProfile(), aggregateBefore: aggregateBefore ?? { counts: { reasoningSteps: 0, toolActions: 0, fakeDossierActions: 0, retryAttempts: 0 }, conservativeCostUsd: 0, exactCostUsd: 0, durationMs: 0, outputs: [] }, clientFactory: async () => client, consumeSlot: async () => { slotCalls += 1; return { actionIdentity: "slot-test", receiptHash: "d".repeat(64) }; }, clock: () => fixedTime, nowMs: (() => { let value = 1_000; return () => value += 10; })(), processIdentity: "mock-process" };
  const result = viaWholeRun ? (await executeWholeRunWithCaseUnit({ slots: [slot], executeCase: executeV2CaseUnit, contextForSlot: async () => context }))[0] : await executeV2CaseUnit(context);
  return { resultRoot, result, client, slotCalls };
}

test("extracted unit preserves provider-visible bytes and completes the purpose-neutral mocked lifecycle with one sealed append-only ledger", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-case-unit-"));
  try {
    const { resultRoot, result, client, slotCalls } = await mockExecution({ temporary });
    assert.equal(result.output.caseStatus, "CASE_SEALED"); assert.equal(result.output.terminalState, "CASE_SEALED"); assert.equal(client.calls, 10); assert.equal(slotCalls, 1);
    assert.equal(result.output.counts.reasoningSteps, 10); assert.equal(result.output.counts.physicalProviderAttempts, 10); assert.equal(result.output.counts.memoryQueries, 1); assert.equal(result.output.counts.fakeDossierActions, 1); assert.equal(result.output.counts.retryAttempts, 0);
    assert.equal(result.output.actions.length, 10); assert.equal(result.output.modelIdentityReadbacks.every((model) => model === "gpt-5.6-sol"), true);
    const first = JSON.parse(client.requests[0]); const { episode, materialization } = await materializeV2ProviderVisibleCase("KE-V2-C08"); const state = "CASE_OPEN"; const observed = observedStateHash(state, []);
    const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: state, observedStateHash: observed, actionId: "action-ke-v2-c08-01", availableEvidenceIds: materialization.canonicalArtifactOrder, availableMemoryIds: [] });
    const prompt = buildQualificationPrompt((await import("../qualification/synthetic-executive/scripts/request-envelope-contract.mjs")).buildBoundedQualificationTurnInput({ episode, readinessManifest: { budgetProfileHash: "95f125883586a42724a44341efc30bb81e0cd39a10dc21f6cb1528d462ee4db8" }, materialization, state, observedStateHash: observed, actionOrdinal: 1, actions: [], retrievalReceipt: null, memoryRecords: [], workerDossier: null }));
    const expected = buildQualificationInferenceRequestEnvelope({ prompt: prompt.text, structuredSchema: schema }); assert.deepEqual(first, expected);
    const ledgerRoot = path.join(resultRoot, "cases", "KE-V2-C08", "case-ledger"); const names = await readdir(ledgerRoot); assert.equal(names.length, 24);
    const ledger = await new AppendOnlyLedger({ root: ledgerRoot, authorityHash: "a".repeat(64), ledgerType: "IMMUTABLE_V2_CASE_SCOPED_EVENT" }).initialize();
    assert.equal(ledger.sealed, true); await assert.rejects(ledger.append("FORBIDDEN_APPEND"), /ALREADY_TERMINALLY_SEALED/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("whole-run wrapper and direct extracted unit produce byte-equivalent frozen-fixture transcripts", async () => {
  const directRoot = await mkdtemp(path.join(os.tmpdir(), "ke-v2-direct-")); const wholeRoot = await mkdtemp(path.join(os.tmpdir(), "ke-v2-whole-"));
  try {
    const direct = await mockExecution({ temporary: directRoot }); const whole = await mockExecution({ temporary: wholeRoot, viaWholeRun: true });
    const normalize = (value) => { const copy = structuredClone(value); delete copy.caseLedgerPreSealHash; delete copy.caseOutputHash; return copy; };
    assert.deepEqual(normalize(whole.result.output), normalize(direct.result.output)); assert.equal(JSON.stringify(normalize(whole.result.output)), JSON.stringify(normalize(direct.result.output)));
  } finally { await rm(directRoot, { recursive: true, force: true }); await rm(wholeRoot, { recursive: true, force: true }); }
});

test("HTTP 200 incomplete max-output and other incomplete statuses are scoreable terminal outcomes with no retry", async () => {
  for (const [code, status] of [["PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS", "incomplete"], ["PROVIDER_RESPONSE_INCOMPLETE_OTHER", "incomplete"]]) {
    const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-case-incomplete-"));
    try {
      const diagnostics = unavailableProviderDiagnostics({ timeoutClassification: "NOT_TIMEOUT", networkConnectionClassification: "HTTP_RESPONSE_RECEIVED" });
      const failure = new SafeProviderFailure(code, 200, diagnostics); failure.safeResponseEvidence = { responseStatus: status, returnedModel: "gpt-5.6-sol", providerResponseId: "resp_mock_incomplete", incompleteReason: code.endsWith("MAX_OUTPUT_TOKENS") ? "max_output_tokens" : "content_filter", usage: { complete: true, inputTokens: 100, cachedInputTokens: 0, outputTokens: 2000, reasoningTokens: 1900, totalTokens: 2100 } };
      const { result, client } = await mockExecution({ temporary, terminalFailure: failure }); assert.equal(result.output.caseStatus, "SCOREABLE_MODEL_OUTPUT_FAILURE"); assert.equal(result.output.terminalReason.code, code); assert.equal(result.integrityFailure, null); assert.equal(client.calls, 1); assert.equal(result.output.counts.retryAttempts, 0);
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
});

test("model schema violation is scoreable while malformed transport and model identity failures remain integrity-invalid", async () => {
  assert.ok(SCOREABLE_CASE_STATUSES.includes("SCOREABLE_MODEL_BROKER_REJECTION")); assert.equal(SCOREABLE_CASE_STATUSES.includes("INTEGRITY_INVALID"), false);
  for (const code of ["PROVIDER_RESPONSE_MALFORMED", "PROVIDER_MODEL_ID_MISMATCH"]) {
    const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-case-integrity-"));
    try { const { result, client } = await mockExecution({ temporary, terminalFailure: new SafeProviderFailure(code) }); assert.equal(result.output.caseStatus, "INTEGRITY_INVALID"); assert.match(result.integrityFailure, /INTEGRITY_INVALID|IDENTITY_MISMATCH/); assert.equal(client.calls, 1); }
    finally { await rm(temporary, { recursive: true, force: true }); }
  }
});

test("aggregate reasoning and cost ceilings stop before credential factory, slot consumption or mock dispatch", async () => {
  for (const aggregateBefore of [
    { counts: { reasoningSteps: LIMITS.aggregate.maximumReasoningSteps, toolActions: 0, fakeDossierActions: 0, retryAttempts: 0 }, conservativeCostUsd: 0, exactCostUsd: 0, durationMs: 0, outputs: [] },
    { counts: { reasoningSteps: 0, toolActions: 0, fakeDossierActions: 0, retryAttempts: 0 }, conservativeCostUsd: LIMITS.aggregate.maximumProviderCostUsd, exactCostUsd: 0, durationMs: 0, outputs: [] }
  ]) {
    const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-aggregate-boundary-"));
    try {
      const { result, client, slotCalls } = await mockExecution({ temporary, aggregateBefore }); assert.equal(result.output.caseStatus, "INTEGRITY_INVALID"); assert.match(result.integrityFailure, /BUDGET_INTEGRITY_INVALID/); assert.equal(client.calls, 0); assert.equal(slotCalls, 0);
    } finally { await rm(temporary, { recursive: true, force: true }); }
  }
});

test("retryable transport failure consumes exactly two retry slots inside one live case process and never reuses the slot", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-retry-"));
  try {
    const failure = new SafeProviderFailure("PROVIDER_TIMEOUT", null, unavailableProviderDiagnostics({ timeoutClassification: "TIMEOUT", networkConnectionClassification: "NOT_RECEIVED" }));
    const { result, client, slotCalls } = await mockExecution({ temporary, terminalFailure: failure }); assert.equal(result.output.caseStatus, "INTEGRITY_INVALID"); assert.equal(client.calls, 3); assert.equal(slotCalls, 1); assert.equal(result.output.counts.retryAttempts, 2); assert.equal(result.output.counts.physicalProviderAttempts, 3);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("included inventory is deterministic, preserves but excludes original C06, includes replacement C06 once, and excludes the historical empty C08 stub", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-case-aggregate-"));
  try {
    for (const [index, caseId] of SUCCESSOR_CASES.entries()) {
      const root = path.join(temporary, "cases", caseId); await mkdir(root, { recursive: true });
      const template = JSON.parse(await readFile(path.join(repositoryRoot, "qualification-results", "v2-controlled-completion-5aae8e6-20260812t163651z", "cases", "KE-V2-C07", "case-transcript.json"), "utf8"));
      delete template.caseOutputHash; template.caseId = caseId; template.sequencePosition = index + 8; template.successorSequencePosition = index + 1;
      await writeExclusiveJson(path.join(root, "case-transcript.json"), seal(template, "caseOutputHash"));
    }
    const first = await buildIncludedCaseInventory(temporary); const second = await buildIncludedCaseInventory(temporary); assert.deepEqual(first, second);
    assert.equal(first.cases.length, 14); assert.deepEqual(first.exactCaseOrder, Array.from({ length: 14 }, (_, index) => `KE-V2-C${String(index + 1).padStart(2, "0")}`));
    assert.equal(first.cases.filter((item) => item.caseId === "KE-V2-C06").length, 1); assert.equal(first.cases.find((item) => item.caseId === "KE-V2-C06").caseOutputHash, STARTING.replacementC06CaseOutputHash);
    assert.equal(first.originalC06.excluded, true); assert.equal(first.originalC06.caseOutputHash, STARTING.originalC06CaseOutputHash); assert.equal(first.historicalEmptyC08Stub.excluded, true); assert.equal(first.historicalEmptyC08Stub.fileCount, 0);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
