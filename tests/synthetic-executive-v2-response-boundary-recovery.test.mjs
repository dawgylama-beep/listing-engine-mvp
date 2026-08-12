import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ACTION_REGISTRY } from "../qualification/synthetic-executive/scripts/executive-action-registry.mjs";
import { ACTION_SCHEMA_VERSION } from "../qualification/synthetic-executive/scripts/action-broker.mjs";
import { seal, sha256Bytes, sha256Json, writeExclusiveJson } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import {
  RECOVERY_CASES, RECOVERY_LIMITS, RECOVERY_STARTING, activateRecoveryAuthority, aggregateRecoveryResults,
  buildRecoveryIncludedCaseInventory, consumeRecoverySlot, createRecoveryAuthority, evaluateRecoveryResults,
  runRecoveryCase
} from "../qualification/synthetic-executive/qualification-real-route/scripts/v2-response-boundary-recovery-runner.mjs";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");
const fixedTime = "2026-08-12T22:00:00.000Z";

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
  return sample(ACTION_REGISTRY.find((item) => item.actionType === actionType).detailsSchema);
}

class MockLifecycleClient {
  constructor() { this.calls = 0; }
  async decisionTurn({ serializedRequest, requestHash }) {
    assert.equal(sha256Bytes(Buffer.from(serializedRequest)), requestHash); this.calls += 1;
    const request = JSON.parse(serializedRequest); const prompt = request.input[0].content[0].text; const turn = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
    const byState = { CASE_OPEN: "RECONSTRUCT_EPISODE", EPISODE_RECONSTRUCTED: "RETRIEVE_RELEVANT_MEMORY", MEMORY_RETRIEVED: "DECLARE_NOVEL_FAILURE", FAILURE_CLASSIFIED: "PROPOSE_BOUNDED_ENGINEERING_TASK", TASK_PROPOSED: "SPECIFY_REGRESSION_PROOF", PROOF_SPECIFIED: "SPECIFY_REQUIRED_AUTHORITY", WORKER_DOSSIER_RECEIVED: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", EVIDENCE_EVALUATED: "WRITE_GENERALIZED_LESSON_CANDIDATE", LESSON_RECORDED: "SELECT_NEXT_LEGAL_ACTION", NEXT_ACTION_SELECTED: "STOP_SAFELY" };
    const actionType = byState[turn.executiveState]; const evidence = turn.materializationBinding.canonicalArtifactOrder[0];
    const actionCore = { schemaVersion: ACTION_SCHEMA_VERSION, actionId: request.text.format.schema.properties.actionId.enum[0], episodeId: turn.episodeId, executiveState: turn.executiveState, observedStateHash: turn.observedStateHash, factualFindings: ["Purpose-neutral mocked finding."], uncertainties: ["No qualification claim."], confidence: 0.7, boundedRationaleSummary: "Exercise only the sealed action lifecycle.", prohibitedOperations: ["provider tools", "source mutation", "production execution", "evaluator access"], decision: { actionType, details: details(actionType, turn, evidence), evidenceReferences: [evidence], memoryReferences: [], authorityClass: actionType === "SPECIFY_REQUIRED_AUTHORITY" ? "BOUNDED_ENGINEERING" : "NO_NEW_AUTHORITY" } };
    const usage = { complete: true, inputTokens: 100, cachedInputTokens: 0, outputTokens: 50, reasoningTokens: 20, totalTokens: 150 };
    const safeResponseEvidence = { schemaVersion: "1.1", requestHash, providerAttemptIdentity: "mock-attempt", httpStatus: 200, responseContentType: "application/json", rawResponseByteLength: 1000, rawResponseSha256: "a".repeat(64), observedResponseByteLength: 1000, responseBodySha256Classification: "COMPLETE", localResponseHardLimitClassification: "WITHIN_LIMIT", safeProviderRequestId: `req_mock_${this.calls}`, providerResponseId: `resp_mock_${this.calls}`, returnedModel: "gpt-5.6-sol", responseStatus: "completed", incompleteReason: "ABSENT", safeError: null, usage, createdAtEpochSeconds: "ABSENT", completedAtEpochSeconds: "ABSENT", outputItemCount: 1, outputItemTypes: ["message"], outputItemStatuses: ["completed"], partialOutput: { present: false, utf8ByteLength: 0, sha256: "ABSENT" } };
    const safe = { providerResponseId: `resp_mock_${this.calls}`, providerRequestId: `req_mock_${this.calls}`, modelId: "gpt-5.6-sol", responseStatus: "completed", usage, actionCoreHash: sha256Json(actionCore), providerDiagnostics: { httpStatus: 200 }, safeResponseEvidence };
    return Object.freeze({ ...safe, safeResponseHash: sha256Json(safe), actionCore });
  }
}

async function sourceSealIn(temporary) {
  const relativePath = "qualification/synthetic-executive/qualification-real-route/scripts/v2-response-boundary-recovery-runner.mjs";
  const executableFiles = [{ relativePath, sha256: sha256Bytes(await readFile(path.join(repositoryRoot, relativePath))) }];
  const core = { schemaVersion: "1.0", sealType: "VERSION_1_12_34_RESPONSE_BOUNDARY_RECOVERY_UNCOMMITTED_SOURCE_SEAL", startingIdentity: { version: RECOVERY_STARTING.version, branch: RECOVERY_STARTING.branch, commit: RECOVERY_STARTING.commit, tree: RECOVERY_STARTING.tree }, priorExecutableAggregateHash: RECOVERY_STARTING.executableAggregateHash, uncommittedDiffHash: "d".repeat(64), executableFiles, changedFileHashes: executableFiles, correctedExecutableAggregateHash: sha256Json({ priorExecutableAggregateHash: RECOVERY_STARTING.executableAggregateHash, executableFiles }) };
  const value = seal(core, "sourceSealHash"); const filePath = path.join(temporary, "source-seal.json"); await writeExclusiveJson(filePath, value); return filePath;
}

test("recovery authority is create-only, binds two ordered slots, activates once, and blocks C14 before sealed C13", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-recovery-authority-"));
  try {
    const resultRoot = path.join(temporary, "result"); const sourceSealFile = await sourceSealIn(temporary);
    const { authority } = await createRecoveryAuthority({ resultRoot, sourceSealFile, createdAt: fixedTime });
    assert.deepEqual(authority.caseSlots.map((item) => item.caseId), RECOVERY_CASES); assert.deepEqual(authority.limits, RECOVERY_LIMITS);
    await assert.rejects(createRecoveryAuthority({ resultRoot, sourceSealFile, createdAt: fixedTime }));
    const active = await activateRecoveryAuthority({ resultRoot, activatedAt: fixedTime }); assert.equal(active.state, "ACTIVE_CASE_SLOTS");
    await assert.rejects(activateRecoveryAuthority({ resultRoot, activatedAt: fixedTime }), /ACTIVATION_REQUIRES_ISSUED/);
    const c14 = path.join(resultRoot, "cases", "KE-V2-C14"); await mkdir(c14);
    await assert.rejects(consumeRecoverySlot({ resultRoot, authority, caseId: "KE-V2-C14", targetCaseRoot: c14, requestHash: "a".repeat(64) }), /OUT_OF_ORDER/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("mocked C13 then C14 lifecycle consumes each slot once, seals aggregation, and opens the evaluator exactly once", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-recovery-run-"));
  try {
    const resultRoot = path.join(temporary, "result"); const sourceSealFile = await sourceSealIn(temporary);
    await createRecoveryAuthority({ resultRoot, sourceSealFile, createdAt: fixedTime }); await activateRecoveryAuthority({ resultRoot, activatedAt: fixedTime });
    const clients = [];
    for (const caseId of RECOVERY_CASES) {
      const client = new MockLifecycleClient(); clients.push(client);
      const value = await runRecoveryCase({ resultRoot, caseIds: [caseId], clientFactory: async () => client });
      assert.equal(value.output.caseStatus, "CASE_SEALED"); assert.equal(value.output.slotConsumed, true); assert.equal(client.calls, 10);
    }
    const aggregate = await aggregateRecoveryResults({ resultRoot, aggregatedAt: fixedTime }); assert.equal(aggregate.summary.counts.caseSlotConsumptions, 2); assert.equal(aggregate.inventory.cases.length, 14);
    const evaluated = await evaluateRecoveryResults({ resultRoot, evaluatedAt: fixedTime }); assert.equal(evaluated.evaluatorAudit.evaluatorInvocationCount, 1); assert.equal(evaluated.evaluation.totalChecks, 98);
    await assert.rejects(evaluateRecoveryResults({ resultRoot, evaluatedAt: fixedTime }));
    assert.equal((await readdir(path.join(resultRoot, "evaluation"))).length, 14);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("included inventory excludes original C06 and C13 while preserving their exact hashes", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-recovery-inventory-"));
  try {
    await mkdir(path.join(temporary, "cases"), { recursive: true });
    for (const caseId of RECOVERY_CASES) {
      const source = JSON.parse(await readFile(path.join(repositoryRoot, "qualification/synthetic-executive/qualification-real-route/case-scoped-completion/v2-c08-c14-5aae8e6-20260812t1832z/cases/KE-V2-C12/case-transcript.json"), "utf8"));
      delete source.caseOutputHash; source.caseId = caseId; source.caseStatus = "CASE_SEALED"; source.terminalState = "CASE_SEALED";
      await writeExclusiveJson(path.join(temporary, "cases", caseId, "case-transcript.json"), seal(source, "caseOutputHash"));
    }
    const inventory = await buildRecoveryIncludedCaseInventory(temporary); assert.equal(inventory.cases.length, 14); assert.deepEqual(inventory.exactCaseOrder, Array.from({ length: 14 }, (_, index) => `KE-V2-C${String(index + 1).padStart(2, "0")}`));
    assert.equal(inventory.excluded.originalC13.caseOutputHash, RECOVERY_STARTING.originalC13CaseOutputHash); assert.equal(inventory.contentMutationOccurred, false);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
