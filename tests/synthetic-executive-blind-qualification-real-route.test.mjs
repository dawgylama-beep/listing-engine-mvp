import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildQualificationAuthority, createNewQualificationAuthority, validateQualificationAuthority } from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-authority.mjs";
import { ImmutableQualificationActionLedger } from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-execution-ledger.mjs";
import {
  releasePath as generalContinuationReleasePath, validateGeneralContinuationContractRelease
} from "../qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-contract-release.mjs";
import {
  GENERAL_CONTINUATION_POLICY, classifyStageScopedEvidence
} from "../qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-policy.mjs";
import {
  QUALIFICATION_LIMITS, QUALIFICATION_ROUTE, QualificationResponsesClient, SEALED_BINDINGS,
  assertQualificationStructuredOutputsSubset, buildQualificationInferenceRequestEnvelope, buildQualificationPrompt,
  classifyQualificationRequestBudget, createQualificationActionTransportSchema, loadQualificationProviderProfile, qualificationRouteBindings
} from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs";
import {
  ACTION_SCHEMA_VERSION, ExecutiveActionContractError, createBrokerRejection, normalizeAndValidateProviderActionCore
} from "../qualification/synthetic-executive/scripts/action-broker.mjs";
import {
  ACTION_REGISTRY, ACTION_TYPES, canonicalExecutiveActionSchema, canonicalTransition, legalActionsForState, registryActionFixtures
} from "../qualification/synthetic-executive/scripts/executive-action-registry.mjs";
import { EngineeringWorkerAdapter } from "../qualification/synthetic-executive/scripts/engineering-worker-adapter.mjs";
import { EpisodeEvidenceSandbox } from "../qualification/synthetic-executive/scripts/episode-sandbox.mjs";
import { ExecutiveMemoryStore } from "../qualification/synthetic-executive/scripts/memory-store.mjs";
import { runCase } from "../qualification/synthetic-executive/scripts/run-qualification.mjs";
import { readJson, sha256Bytes, sha256Json, stableJson } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import { SafeProviderFailure } from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");
const qualificationRoot = path.join(repositoryRoot, "qualification", "synthetic-executive");
const fixedTime = "2026-08-10T12:00:00.000Z";

async function fixtures() {
  const [publicManifest, readinessManifest, budgetProfile, accessDenialProof, routeBindings] = await Promise.all([
    readJson(path.join(qualificationRoot, "episodes", "public-manifest.json")), readJson(path.join(qualificationRoot, "readiness-manifest.json")),
    readJson(path.join(qualificationRoot, "qualification-budget-profile.json")), readJson(path.join(qualificationRoot, "proofs", "evaluator-control-access-denial-proof.json")),
    qualificationRouteBindings()
  ]);
  return { publicManifest, readinessManifest, budgetProfile, accessDenialProof, routeBindings };
}

function authorityFor({ publicManifest, routeBindings, runRoot, authorityId = "offline-qualification-authority" }) {
  return buildQualificationAuthority({ authorityId, createdAt: fixedTime, toolingCommit: "a".repeat(40), toolingTree: "b".repeat(40), toolingReleaseHash: "c".repeat(64), publicManifest, routeBindings, runRoot });
}

function sampleForSchema(schema, label = "fixture") {
  if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties).map(([key, child]) => [key, sampleForSchema(child, key)]));
  if (schema.type === "array") return Array.from({ length: schema.minItems || 0 }, () => sampleForSchema(schema.items, label));
  if (schema.enum) return schema.enum[0];
  if (schema.type === "integer" || schema.type === "number") return schema.minimum || 0;
  if (schema.type === "boolean") return true;
  if (schema.type === "null") return null;
  return `${label}-value`;
}

function providerCoreFor({ episode, state, actionType, actionId = "fixture-action", memoryIds = [], details = null }) {
  const definition = ACTION_REGISTRY.find((item) => item.actionType === actionType);
  assert.ok(definition);
  return {
    schemaVersion: ACTION_SCHEMA_VERSION,
    actionId,
    episodeId: episode.episodeId,
    executiveState: state,
    observedStateHash: "0".repeat(64),
    factualFindings: ["Bounded finding from visible evidence."],
    uncertainties: ["Later-stage proof remains pending."],
    confidence: 0.7,
    boundedRationaleSummary: "Proceed only through the next registry-authorized bounded stage.",
    prohibitedOperations: ["provider tools", "source mutation", "production execution", "evaluator access"],
    decision: {
      actionType,
      details: details ?? sampleForSchema(definition.detailsSchema),
      evidenceReferences: [episode.visibleArtifactInventory[0].artifactId],
      memoryReferences: definition.minimumMemoryReferences ? [memoryIds[0]] : [],
      authorityClass: definition.authorityClasses[0]
    }
  };
}

function assertTransportValue(value, schema, pathLabel = "$") {
  if (schema.anyOf) {
    const accepted = schema.anyOf.filter((branch) => {
      try { assertTransportValue(value, branch, pathLabel); return true; } catch { return false; }
    });
    assert.equal(accepted.length, 1, `${pathLabel} must match exactly one action/details branch`); return;
  }
  if (schema.type === "object") {
    assert.ok(value && typeof value === "object" && !Array.isArray(value));
    assert.deepEqual(Object.keys(value).sort(), Object.keys(schema.properties).sort());
    for (const [key, child] of Object.entries(schema.properties)) assertTransportValue(value[key], child, `${pathLabel}.${key}`);
    return;
  }
  if (schema.type === "array") {
    assert.ok(Array.isArray(value));
    if (Number.isInteger(schema.minItems)) assert.ok(value.length >= schema.minItems);
    if (Number.isInteger(schema.maxItems)) assert.ok(value.length <= schema.maxItems);
    for (const item of value) assertTransportValue(item, schema.items, `${pathLabel}[]`);
    return;
  }
  if (schema.type === "string") assert.equal(typeof value, "string");
  if (schema.type === "number") assert.equal(Number.isFinite(value), true);
  if (schema.type === "integer") assert.equal(Number.isInteger(value), true);
  if (schema.enum) assert.ok(schema.enum.includes(value));
  if (Number.isFinite(schema.minimum)) assert.ok(value >= schema.minimum);
  if (Number.isFinite(schema.maximum)) assert.ok(value <= schema.maximum);
}

test("one registry exhaustively generates every legal schema branch, broker rule, successor, and terminal disposition", async () => {
  const input = await fixtures();
  const episode = input.publicManifest.episodes[6];
  const memoryIds = ["fixture-memory"];
  const pairs = registryActionFixtures();
  assert.equal(new Set(pairs.map((item) => `${item.currentState}:${item.actionType}`)).size, pairs.length);
  for (const pair of pairs) {
    const availableMemoryIds = pair.minimumMemoryReferences ? memoryIds : [];
    const schema = createQualificationActionTransportSchema({
      episodeId: episode.episodeId, executiveState: pair.currentState, observedStateHash: "0".repeat(64), actionId: "fixture-action",
      availableEvidenceIds: episode.visibleArtifactInventory.map((item) => item.artifactId), availableMemoryIds
    });
    assertQualificationStructuredOutputsSubset(schema);
    const core = providerCoreFor({ episode, state: pair.currentState, actionType: pair.actionType, memoryIds: availableMemoryIds });
    assertTransportValue(core, schema);
    const action = normalizeAndValidateProviderActionCore(core, { episode, currentState: pair.currentState, memoryIds: availableMemoryIds, allowedAuthorityClasses: pair.authorityClasses });
    const transition = canonicalTransition(pair.currentState, pair.actionType);
    assert.equal(action.requestedSuccessorState, pair.successorState);
    assert.equal(transition.successorState, pair.successorState);
    assert.equal(transition.terminal, pair.terminal);
    assert.equal(Object.hasOwn(core, "requestedSuccessorState"), false);
    assert.equal(Object.hasOwn(core.decision, "requestedSuccessorState"), false);
  }
  assert.equal(pairs.length, 27);
  assert.deepEqual(ACTION_TYPES, ACTION_REGISTRY.map((item) => item.actionType));
});

test("cross-branch, A02-shaped, unexpected-field, successor, and property-generated invalid combinations fail closed", async () => {
  const input = await fixtures(); const episode = input.publicManifest.episodes[7];
  const context = { episode, currentState: "MEMORY_RETRIEVED", memoryIds: [], allowedAuthorityClasses: ["NO_NEW_AUTHORITY"] };
  const a02 = providerCoreFor({ episode, state: "MEMORY_RETRIEVED", actionType: "DECLARE_NOVEL_FAILURE", details: { failureClass: "COMPLETE_PATH_AUTHORITY", memoryMatchClass: "CROSS_BRANCH_FIELD" } });
  const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: "MEMORY_RETRIEVED", observedStateHash: "0".repeat(64), actionId: "fixture-action", availableEvidenceIds: episode.visibleArtifactInventory.map((item) => item.artifactId), availableMemoryIds: [] });
  assert.throws(() => assertTransportValue(a02, schema));
  assert.throws(() => normalizeAndValidateProviderActionCore(a02, context), (error) => error instanceof ExecutiveActionContractError && error.code === "ACTION_DETAILS_FIELDS_DIFFER" && error.fieldPath === "$.decision.details");

  const providerSuccessor = providerCoreFor({ episode, state: "MEMORY_RETRIEVED", actionType: "DECLARE_NOVEL_FAILURE" });
  providerSuccessor.requestedSuccessorState = "STOPPED";
  assert.throws(() => normalizeAndValidateProviderActionCore(providerSuccessor, context), /ACTION_CORE_FIELDS_DIFFER/);

  const states = ["CASE_OPEN", "EPISODE_RECONSTRUCTED", "MEMORY_RETRIEVED", "FAILURE_CLASSIFIED", "TASK_PROPOSED", "PROOF_SPECIFIED", "AUTHORITY_SPECIFIED", "WORKER_DOSSIER_RECEIVED", "EVIDENCE_EVALUATED", "LESSON_RECORDED", "NEXT_ACTION_SELECTED"];
  let seed = 0x5eed1234;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed; };
  for (let index = 0; index < 256; index += 1) {
    const state = states[random() % states.length];
    const illegal = ACTION_TYPES.filter((actionType) => !legalActionsForState(state, { memoryIds: [] }).includes(actionType));
    if (illegal.length === 0) continue;
    const actionType = illegal[random() % illegal.length];
    const core = providerCoreFor({ episode, state, actionType });
    assert.throws(() => normalizeAndValidateProviderActionCore(core, { episode, currentState: state, memoryIds: [], allowedAuthorityClasses: ["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"] }), /ACTION_STATE_PAIR_UNREGISTERED/);
  }
});

test("stage-scoped sufficiency preserves bounded continuation and requires a complete terminal declaration", async () => {
  const laterStage = classifyStageScopedEvidence({
    blockedCognitiveCapability: "BOUNDED_FAILURE_CLASSIFICATION",
    requiredFacts: ["visible failure boundary"], unavailableFacts: ["exact repair", "final proof"],
    unavailableFactClasses: ["EXACT_REPAIR", "FINAL_RECOVERY_PROOF"], boundedProgressActions: ["CLASSIFY_FAILURE", "PROPOSE_BOUNDED_ENGINEERING_TASK"]
  });
  assert.equal(laterStage.classification, "BOUNDED_CONTINUATION_REQUIRED"); assert.equal(laterStage.laterStageAbsenceOnly, true);
  const trueGap = classifyStageScopedEvidence({
    blockedCognitiveCapability: "BOUNDED_EPISODE_RECONSTRUCTION",
    requiredFacts: ["which operation failed"], unavailableFacts: ["which operation failed"], unavailableFactClasses: ["CURRENT_STAGE_FACT"], boundedProgressActions: []
  });
  assert.equal(trueGap.classification, "TERMINAL_STAGE_INSUFFICIENCY");
  assert.deepEqual(GENERAL_CONTINUATION_POLICY.terminalInsufficiencyRequiredFields, ["blockedCognitiveCapability", "requiredFacts", "unavailableFacts", "whyReconstructionOrClassificationCannotProceedWithoutFabrication"]);

  const input = await fixtures(); const episode = input.publicManifest.episodes[0];
  const incomplete = providerCoreFor({ episode, state: "CASE_OPEN", actionType: "DECLARE_INSUFFICIENT_EVIDENCE", details: {} });
  assert.throws(() => normalizeAndValidateProviderActionCore(incomplete, { episode, currentState: "CASE_OPEN", memoryIds: [], allowedAuthorityClasses: ["NO_NEW_AUTHORITY"] }), /ACTION_DETAILS_FIELDS_DIFFER/);
});

test("all twelve exposed fixtures materialize every body in canonical order and enforce the sealed request envelope before dispatch", async () => {
  const input = await fixtures(); const profile = await loadQualificationProviderProfile();
  const oversized = []; const within = [];
  for (const episode of input.publicManifest.episodes) {
    const sandbox = new EpisodeEvidenceSandbox({ episodeRoot: path.join(qualificationRoot, "episodes", "visible", episode.episodeId), episodeManifest: episode });
    const materialization = await sandbox.materializeAllVisibleArtifacts();
    assert.equal(materialization.artifactCount, episode.visibleArtifactInventory.length);
    assert.deepEqual(materialization.canonicalArtifactOrder, episode.visibleArtifactInventory.map((item) => item.artifactId));
    assert.deepEqual(materialization.individualArtifactHashes, episode.visibleArtifactInventory.map((item) => ({ artifactId: item.artifactId, sha256: item.sha256, byteLength: item.bytes })));
    const state = "CASE_OPEN"; const observedStateHash = "0".repeat(64); const actionId = `materialization-${episode.episodeId.toLowerCase()}`;
    const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: state, observedStateHash, actionId, availableEvidenceIds: materialization.canonicalArtifactOrder, availableMemoryIds: [] });
    const prompt = buildQualificationPrompt({ episodeId: episode.episodeId, executiveState: state, observedStateHash, materializedVisibleArtifacts: materialization.artifacts });
    const serializedRequest = JSON.stringify(buildQualificationInferenceRequestEnvelope({ prompt: prompt.text, structuredSchema: schema }));
    const accounting = classifyQualificationRequestBudget({ serializedRequest, materialization: { ...materialization, promptByteCount: prompt.byteCount }, pricing: profile.pricing });
    assert.equal(accounting.exactSerializedRequestByteCount, Buffer.byteLength(serializedRequest, "utf8"));
    assert.equal(accounting.conservativeInputTokenReservation, accounting.exactSerializedRequestByteCount);
    assert.equal(accounting.exactPreDispatchTokenCountAvailable, false);
    (accounting.withinRequestByteCeiling ? within : oversized).push(episode.episodeId);
  }
  assert.deepEqual(oversized, ["KE-P7-H01", "KE-P7-H02", "KE-P7-H03", "KE-P7-H04", "KE-P7-H05", "KE-P7-H06"]);
  assert.deepEqual(within, ["KE-P7-A01", "KE-P7-A02", "KE-P7-A03", "KE-P7-N01", "KE-P7-N02", "KE-P7-N03"]);
  for (const episodeId of ["KE-P7-H01", "KE-P7-H02", "KE-P7-H03", "KE-P7-H04", "KE-P7-H05", "KE-P7-H06", "KE-P7-N01", "KE-P7-N02", "KE-P7-N03"])
    assert.ok(legalActionsForState("CASE_OPEN", { memoryIds: [] }).includes("RECONSTRUCT_EPISODE"), `${episodeId} lost its bounded reconstruction path`);
});

test("oversized complete materialization seals accounting and stops before mock dispatch", async () => {
  const input = await fixtures();
  const episode = input.publicManifest.episodes.find((item) => item.episodeId === "KE-P7-H01");
  const runRoot = await mkdtemp(path.join(os.tmpdir(), "ke-materialization-budget-"));
  let dispatches = 0;
  try {
    const result = await runCase({
      episode,
      ledger: { summary: async () => ({ ledgerHash: "d".repeat(64), providerAttempts: 0, reservedCostUsd: 0 }) },
      memoryStore: { list: async () => [] },
      dossierAdapter: null,
      client: { decisionTurn: async () => { dispatches += 1; throw new Error("mock dispatch must remain unreachable"); } },
      runRoot,
      authority: { authorityHash: "a".repeat(64) },
      readinessManifest: input.readinessManifest,
      profile: await loadQualificationProviderProfile(),
      clock: () => fixedTime
    });
    assert.equal(result.caseStatus, "IMMUTABLE_MATERIALIZATION_BUDGET_FAILURE");
    assert.equal(result.failureEvidence.providerDispatchOccurred, false);
    assert.equal(dispatches, 0);
    const receipts = await readdir(path.join(runRoot, "pre-dispatch-accounting"));
    assert.equal(receipts.length, 1);
    const receipt = await readJson(path.join(runRoot, "pre-dispatch-accounting", receipts[0]));
    assert.equal(receipt.classification, "QUALIFICATION_VISIBLE_ARTIFACT_ADMISSION_REJECTED");
    assert.equal(receipt.providerDispatchOccurred, false);
  } finally {
    await rm(runRoot, { recursive: true, force: true });
  }
});

test("valid empty memory is explicit, forbids recurrence, and preserves novel classification", async () => {
  const input = await fixtures(); const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-empty-memory-"));
  try {
    const store = new ExecutiveMemoryStore(temporary); await store.initializeEmpty();
    const receipt = await store.retrieve({ episodeId: "KE-P7-N01", queryFacets: { cohort: ["NOVEL_HELD_OUT"], pattern: ["accounting"], failureClass: [] }, queryText: "accounting mismatch", createdAt: fixedTime });
    assert.equal(receipt.resultClassification, "VALID_EMPTY"); assert.equal(receipt.recurrencePermitted, false);
    assert.equal(receipt.novelFailureClassificationPermitted, true); assert.equal(receipt.boundedTaskConstructionPermitted, true); assert.equal(receipt.fabricatedSimilarityProhibited, true);
    const episode = input.publicManifest.episodes[9];
    const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: "MEMORY_RETRIEVED", observedStateHash: "0".repeat(64), actionId: "empty-memory", availableEvidenceIds: episode.visibleArtifactInventory.map((item) => item.artifactId), availableMemoryIds: [] });
    const schemaText = JSON.stringify(schema); assert.equal(schemaText.includes("DECLARE_RECURRENCE"), false); assert.match(schemaText, /DECLARE_NOVEL_FAILURE/);
    const novel = providerCoreFor({ episode, state: "MEMORY_RETRIEVED", actionType: "DECLARE_NOVEL_FAILURE", actionId: "empty-memory" });
    assert.equal(normalizeAndValidateProviderActionCore(novel, { episode, currentState: "MEMORY_RETRIEVED", memoryIds: [], allowedAuthorityClasses: ["NO_NEW_AUTHORITY"] }).requestedSuccessorState, "FAILURE_CLASSIFIED");
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

class OfflineLedger {
  constructor() { this.items = []; }
  async consume(item) { this.items.push(item); return item; }
  async summary(caseId = null) {
    const selected = caseId ? this.items.filter((item) => item.caseId === caseId) : this.items;
    return {
      reasoningSteps: selected.filter((item) => item.actionKind === "PROVIDER_ATTEMPT").length,
      toolActions: selected.filter((item) => ["MEMORY_QUERY", "PRESEALED_DOSSIER"].includes(item.actionKind)).length,
      dossierActions: selected.filter((item) => item.actionKind === "PRESEALED_DOSSIER").length,
      retrySlots: selected.filter((item) => item.actionKind === "RETRY_SLOT").length,
      reservedCostUsd: Number(selected.reduce((sum, item) => sum + (item.reservationUsd || 0), 0).toFixed(8)),
      providerAttempts: selected.filter((item) => item.actionKind === "PROVIDER_ATTEMPT").length,
      actionCount: selected.length,
      immutableEntryCount: selected.length,
      ledgerHash: sha256Json(selected)
    };
  }
}

function purposeNeutralDetails(actionType, turn, evidence) {
  if (actionType === "RETRIEVE_RELEVANT_MEMORY") return { queryText: "bounded structural failure", queryFacets: { cohort: [turn.cohort], pattern: ["structural failure"], failureClass: [] } };
  if (actionType === "DECLARE_NOVEL_FAILURE") return { failureClass: "PURPOSE_NEUTRAL_STRUCTURAL_FAILURE" };
  if (actionType === "PROPOSE_BOUNDED_ENGINEERING_TASK") return {
    exactFailureClass: "PURPOSE_NEUTRAL_STRUCTURAL_FAILURE", affectedComponents: ["bounded component"], proposedChangeSurface: ["bounded contract"],
    explicitlyExcludedComponents: ["product", "production", "benchmark"], generalizedInvariant: "Keep one contract aligned across the bounded path.",
    minimumRequiredRegressionSet: ["unit", "path", "negative", "recovery"], exactPathOrStateProofRequirement: "Prove the bounded path.",
    rollbackRequirement: "Revert only the bounded change.", stopCondition: "Stop on contradiction.", costAndToolEstimate: { toolSteps: 1, costUsd: 0 }, requestedAuthority: "BOUNDED_ENGINEERING"
  };
  if (actionType === "SPECIFY_REGRESSION_PROOF") return { helperUnitProof: "required", exactProductionPathProof: "required", historicalStateProof: "required", negativeProof: "required", restartOrRecoveryProof: "required", forbiddenActivityProof: "required" };
  if (actionType === "EVALUATE_RETURNED_ENGINEERING_EVIDENCE") return { classification: "VALID_PASS", requiredClaims: [{ claimId: "purpose-neutral-proof", status: "PROVEN", evidenceReferences: [evidence] }] };
  if (actionType === "WRITE_GENERALIZED_LESSON_CANDIDATE") return { memoryRecord: {
    schemaVersion: "1.0", memoryType: "GENERALIZED_LESSON_CANDIDATE", memoryId: "memory-purpose-neutral", sourceEpisodeIds: [turn.episodeId], evidenceReferences: [evidence], evidenceAggregateHash: sha256Json([evidence]),
    observedFailurePattern: "A bounded contract diverged.", generalizedRule: "Keep bounded contracts aligned.", triggeringConditions: ["verified divergence"], applicabilityBoundaries: ["same contract boundary"], explicitNonApplicabilityConditions: ["contradictory evidence"],
    recurrenceSignature: "PURPOSE_NEUTRAL_STRUCTURAL_FAILURE", recommendedActionPattern: "REQUEST_BOUNDED_ENGINEERING_AUTHORITY", prohibitedActions: ["production execution"], requiredProofBeforeAdvancement: ["bounded path proof"], authorityNormallyRequired: "BOUNDED_ENGINEERING", confidence: 0.7, unresolvedUncertainty: [], status: "CANDIDATE", predecessorMemoryIds: []
  } };
  if (actionType === "SELECT_NEXT_LEGAL_ACTION") return { selection: "REQUEST_BOUNDED_ENGINEERING_AUTHORITY" };
  if (actionType === "STOP_SAFELY") return { stopReason: "Purpose-neutral lifecycle reachability is complete." };
  return {};
}

class PurposeNeutralClient {
  constructor() { this.calls = 0; this.counts = { metadataRequests: 0, inferenceRequests: 0, retries: 0 }; }
  async decisionTurn({ serializedRequest, requestHash }) {
    assert.equal(sha256Bytes(Buffer.from(serializedRequest)), requestHash);
    this.calls += 1; this.counts.inferenceRequests += 1;
    const request = JSON.parse(serializedRequest); const prompt = request.input[0].content[0].text; const turn = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
    const actionByState = {
      CASE_OPEN: "RECONSTRUCT_EPISODE", EPISODE_RECONSTRUCTED: "RETRIEVE_RELEVANT_MEMORY", MEMORY_RETRIEVED: "DECLARE_NOVEL_FAILURE",
      FAILURE_CLASSIFIED: "PROPOSE_BOUNDED_ENGINEERING_TASK", TASK_PROPOSED: "SPECIFY_REGRESSION_PROOF", PROOF_SPECIFIED: "SPECIFY_REQUIRED_AUTHORITY",
      WORKER_DOSSIER_RECEIVED: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", EVIDENCE_EVALUATED: "WRITE_GENERALIZED_LESSON_CANDIDATE",
      LESSON_RECORDED: "SELECT_NEXT_LEGAL_ACTION", NEXT_ACTION_SELECTED: "STOP_SAFELY"
    };
    const actionType = actionByState[turn.executiveState]; assert.ok(actionType);
    const evidence = turn.materializationBinding.canonicalArtifactOrder[0];
    const actionCore = {
      schemaVersion: ACTION_SCHEMA_VERSION,
      actionId: request.text.format.schema.properties.actionId.enum[0], episodeId: turn.episodeId, executiveState: turn.executiveState, observedStateHash: turn.observedStateHash,
      factualFindings: ["Purpose-neutral fixture finding."], uncertainties: ["No qualification claim is made."], confidence: 0.7,
      boundedRationaleSummary: "Exercise the registry-defined lifecycle without case-specific expected answers.", prohibitedOperations: ["provider tools", "source mutation", "production execution", "evaluator access"],
      decision: { actionType, details: purposeNeutralDetails(actionType, turn, evidence), evidenceReferences: [evidence], memoryReferences: [], authorityClass: actionType === "SPECIFY_REQUIRED_AUTHORITY" ? "BOUNDED_ENGINEERING" : "NO_NEW_AUTHORITY" }
    };
    assertTransportValue(actionCore, request.text.format.schema);
    const usage = this.calls === 1
      ? { complete: false, inputTokens: null, cachedInputTokens: null, outputTokens: null, reasoningTokens: null, totalTokens: null }
      : { complete: true, inputTokens: 101, cachedInputTokens: 0, outputTokens: 51, reasoningTokens: 20, totalTokens: 152 };
    const safe = { providerResponseId: `resp_mock_${this.calls}`, providerRequestId: `req_mock_${this.calls}`, modelId: "gpt-5.6-sol", responseStatus: "completed", usage, actionCoreHash: sha256Json(actionCore), providerDiagnostics: { httpStatus: 200 } };
    return Object.freeze({ ...safe, safeResponseHash: sha256Json(safe), actionCore });
  }
}

test("purpose-neutral mocked lifecycle reaches memory, task, proof, dossier, evaluation, lesson, and next-action with distinct accounting", async () => {
  const input = await fixtures(); const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-purpose-neutral-"));
  try {
    const episode = input.publicManifest.episodes[6]; const runRoot = path.join(temporary, "run");
    await (await import("node:fs/promises")).mkdir(path.join(runRoot, "cases"), { recursive: true });
    const memoryStore = new ExecutiveMemoryStore(path.join(runRoot, "isolated-qualification-memory")); await memoryStore.initializeEmpty();
    const dossierAdapter = await new EngineeringWorkerAdapter({ dossierIndexPath: path.join(qualificationRoot, "evaluator-controls", "engineering-dossiers.json") }).initialize();
    const ledger = new OfflineLedger(); const client = new PurposeNeutralClient(); const profile = await loadQualificationProviderProfile();
    const result = await runCase({ episode, ledger, memoryStore, dossierAdapter, client, runRoot, authority: { authorityHash: "a".repeat(64) }, readinessManifest: input.readinessManifest, profile, clock: () => fixedTime });
    assert.equal(result.caseStatus, "CASE_SEALED"); assert.equal(result.terminalState, "CASE_SEALED");
    assert.deepEqual(result.actions.map((item) => item.actionType), ["RECONSTRUCT_EPISODE", "RETRIEVE_RELEVANT_MEMORY", "DECLARE_NOVEL_FAILURE", "PROPOSE_BOUNDED_ENGINEERING_TASK", "SPECIFY_REGRESSION_PROOF", "SPECIFY_REQUIRED_AUTHORITY", "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", "WRITE_GENERALIZED_LESSON_CANDIDATE", "SELECT_NEXT_LEGAL_ACTION", "STOP_SAFELY"]);
    assert.equal(result.actions.every((item) => item.requestedSuccessorState === canonicalTransition(item.executiveState, item.actionType).successorState), true);
    assert.equal(result.returnedProviderUsage.completeReceiptCount, 9); assert.equal(result.returnedProviderUsage.incompleteOrUnavailableReceiptCount, 1);
    assert.deepEqual(result.returnedProviderUsage, { completeReceiptCount: 9, incompleteOrUnavailableReceiptCount: 1, actualInputTokens: 909, actualOutputTokens: 459, actualTotalTokens: 1368 });
    assert.equal((await readdir(path.join(runRoot, "pre-dispatch-accounting"))).length, 10); assert.equal((await readdir(path.join(runRoot, "provider-usage"))).length, 10);
    const firstAccounting = await readJson(path.join(runRoot, "pre-dispatch-accounting", (await readdir(path.join(runRoot, "pre-dispatch-accounting"))).sort()[0]));
    assert.equal(firstAccounting.exactPreDispatchTokenCountAvailable, false); assert.equal(firstAccounting.conservativeInputTokenReservation, firstAccounting.exactSerializedRequestByteCount);
    const usageReceipts = await Promise.all((await readdir(path.join(runRoot, "provider-usage"))).map((name) => readJson(path.join(runRoot, "provider-usage", name))));
    assert.ok(usageReceipts.some((item) => item.usageClassification === "UNAVAILABLE" && item.reconciliation === "CONSERVATIVE_RESERVATION_REMAINS_CONSUMED"));
    assert.ok(usageReceipts.some((item) => item.usageClassification === "COMPLETE" && item.actualUsage.totalTokens === 152));
    assert.equal((await memoryStore.list()).length, 1); assert.equal(client.counts.metadataRequests, 0); assert.equal(client.counts.inferenceRequests, 10);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("safe broker rejection receipt persists rule/path without raw action content", async () => {
  const input = await fixtures(); const episode = input.publicManifest.episodes[7];
  const core = providerCoreFor({ episode, state: "MEMORY_RETRIEVED", actionType: "DECLARE_NOVEL_FAILURE", details: { failureClass: "SAFE", secret: "sk-never-persist-this-value" } });
  let failure;
  try { normalizeAndValidateProviderActionCore(core, { episode, currentState: "MEMORY_RETRIEVED", memoryIds: [], allowedAuthorityClasses: ["NO_NEW_AUTHORITY"] }); } catch (error) { failure = error; }
  const receipt = createBrokerRejection(core, failure, { currentState: "MEMORY_RETRIEVED", memoryIds: [] });
  assert.equal(receipt.submittedActionType, "DECLARE_NOVEL_FAILURE"); assert.equal(receipt.rejectionCode, "ACTION_DETAILS_FIELDS_DIFFER");
  assert.equal(receipt.validationRule, "EXACT_OBJECT_FIELDS"); assert.equal(receipt.fieldPath, "$.decision.details"); assert.equal(receipt.terminalDisposition, "IMMUTABLE_BROKER_REJECTION");
  assert.match(receipt.actionCoreHash, /^[a-f0-9]{64}$/); assert.doesNotMatch(JSON.stringify(receipt), /never-persist|sk-/i);
});

test("qualification route is exact, strict, zero-metadata, and has no provider-controlled successor", async () => {
  const schema = createQualificationActionTransportSchema({ episodeId: "KE-P7-H01", executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), actionId: "action-ke-p7-h01-01", availableEvidenceIds: ["visible-artifact"], availableMemoryIds: [] });
  const audit = assertQualificationStructuredOutputsSubset(schema); assert.ok(audit.properties > 0); assert.equal(Object.hasOwn(schema, "anyOf"), false);
  const envelope = buildQualificationInferenceRequestEnvelope({ prompt: "offline", structuredSchema: schema });
  assert.equal(envelope.model, "gpt-5.6-sol"); assert.deepEqual(envelope.reasoning, { effort: "medium" }); assert.equal(envelope.store, false); assert.deepEqual(envelope.tools, []);
  assert.equal(envelope.text.format.type, "json_schema"); assert.equal(envelope.text.format.strict, true); assert.equal(QUALIFICATION_ROUTE.maximumMetadataRequests, 0);
  assert.equal(JSON.stringify(schema).includes("requestedSuccessorState"), false);
  const [routeSource, providerSchemaSource, brokerSource, controllerSource] = await Promise.all([
    readFile(path.join(qualificationRoot, "qualification-real-route", "scripts", "qualification-route.mjs"), "utf8"),
    readFile(path.join(qualificationRoot, "scripts", "provider-action-schema.mjs"), "utf8"),
    readFile(path.join(qualificationRoot, "scripts", "action-broker.mjs"), "utf8"),
    readFile(path.join(qualificationRoot, "scripts", "lifecycle-integrity-controller.mjs"), "utf8")
  ]);
  assert.doesNotMatch(routeSource, /const\s+(STATE_ACTIONS|detailsSchemas)\b/); assert.doesNotMatch(controllerSource, /CASE_OPEN:\s*Object\.freeze\(\{/);
  assert.match(providerSchemaSource, /legalActionsForState/); assert.match(providerSchemaSource, /actionDefinition/); assert.match(brokerSource, /canonicalTransition/); assert.match(controllerSource, /derivedTransitionRegistry/);
});

test("canonical accepted-action schema and general policy JSON match their generated sources", async () => {
  const [schemaFile, policyFile] = await Promise.all([
    readJson(path.join(qualificationRoot, "schemas", "executive-action-v1.2.schema.json")),
    readJson(path.join(qualificationRoot, "qualification-real-route", "general-continuation-policy.json"))
  ]);
  assert.equal(stableJson(schemaFile), stableJson(canonicalExecutiveActionSchema()));
  assert.equal(stableJson(policyFile), stableJson(GENERAL_CONTINUATION_POLICY));
});

test("create-only authority binds the registry and general policy, while immutable ledger ceilings remain exact", async () => {
  const input = await fixtures(); const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-contract-authority-"));
  try {
    const authorityPath = path.join(temporary, "authority.json");
    const authority = await createNewQualificationAuthority({ authorityPath, authorityId: "offline-create-only", createdAt: fixedTime, toolingCommit: "a".repeat(40), toolingTree: "b".repeat(40), toolingReleaseHash: "c".repeat(64), publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot: path.join(temporary, "run") });
    validateQualificationAuthority(authority, { publicManifest: input.publicManifest, routeBindings: input.routeBindings });
    assert.equal(authority.caseSlots.length, 12); assert.equal(authority.bindings.actionRegistryHash, input.routeBindings.actionRegistryHash); assert.equal(authority.bindings.generalContinuationPolicyHash, input.routeBindings.generalContinuationPolicyHash);
    await assert.rejects(createNewQualificationAuthority({ authorityPath, authorityId: "offline-create-only", createdAt: fixedTime, toolingCommit: "a".repeat(40), toolingTree: "b".repeat(40), toolingReleaseHash: "c".repeat(64), publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot: path.join(temporary, "run") }), /QUALIFICATION_AUTHORITY_PATH_OCCUPIED/);
    const ledger = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "ledger"), authority, clock: () => fixedTime }).initialize();
    const episode = input.publicManifest.episodes[0].episodeId; const requestHash = sha256Json("request");
    await ledger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "provider-first", operationHash: requestHash, reservationUsd: 0.1 });
    await assert.rejects(ledger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "provider-silent-retry", operationHash: requestHash, reservationUsd: 0.1 }), /explicit retry slot/);
    await ledger.consume({ caseId: episode, actionKind: "RETRY_SLOT", actionIdentity: "retry-one", operationHash: requestHash, retryOfActionIdentity: "provider-first", retryReason: "PROVIDER_TIMEOUT" });
    await ledger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "provider-second", operationHash: requestHash, reservationUsd: 0.1, retryOfActionIdentity: "retry-one" });
    await assert.rejects(ledger.consume({ caseId: episode, actionKind: "SOURCE_OPERATION", actionIdentity: "source-op", operationHash: sha256Json("source") }), /UNAUTHORIZED_QUALIFICATION_ACTION_KIND/);
    const costLedger = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "cost-ledger"), authority, clock: () => fixedTime }).initialize();
    await assert.rejects(costLedger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "cost-over", operationHash: sha256Json("cost-over"), reservationUsd: QUALIFICATION_LIMITS.perCase.maximumCostUsd + 0.00000001 }), /PER_CASE_COST/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("safe provider diagnostics retain bounded error evidence without secrets", async () => {
  const profile = await loadQualificationProviderProfile(); const schema = createQualificationActionTransportSchema({ episodeId: "KE-P7-H01", executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), actionId: "action-ke-p7-h01-01", availableEvidenceIds: ["visible"], availableMemoryIds: [] });
  const request = JSON.stringify(buildQualificationInferenceRequestEnvelope({ prompt: "offline", structuredSchema: schema }));
  const client = new QualificationResponsesClient({ profile, credentialHandle: { withCredential: async (callback) => callback("offline-value") }, fetchImpl: async () => new Response(JSON.stringify({ error: { type: "invalid_request_error", code: "bad_schema", param: "text.format.schema", message: "invalid schema Authorization: Bearer sk-supersecretvalue123456789" } }), { status: 400, headers: { "content-type": "application/json", "x-request-id": "req_safe_400", authorization: "Bearer forbidden" } }) });
  await assert.rejects(client.decisionTurn({ serializedRequest: request, requestHash: sha256Bytes(Buffer.from(request)), signal: new AbortController().signal }), (error) => {
    assert.ok(error instanceof SafeProviderFailure); assert.equal(error.providerDiagnostics.httpStatus, 400); assert.equal(error.providerDiagnostics.errorType, "invalid_request_error");
    assert.equal(error.providerDiagnostics.errorParam, "text.format.schema"); assert.equal(error.providerDiagnostics.safeProviderRequestId, "req_safe_400");
    assert.doesNotMatch(JSON.stringify(error.providerDiagnostics), /supersecret|authorization.*bearer|forbidden/i); return true;
  });
  assert.deepEqual(client.counts, { metadataRequests: 0, inferenceRequests: 1, retries: 0 });
});

test("Version 1.12.28 general-continuation release record remains immutable and excludes Phase 6A", async () => {
  const committed = await readJson(generalContinuationReleasePath);
  validateGeneralContinuationContractRelease(committed);
  assert.equal(committed.version, "1.12.28"); assert.equal(committed.preservedReleaseIdentity.failedQualificationClassification, "NOT_QUALIFIED");
  assert.equal(committed.artifactHashes.some((item) => item.relativePath.startsWith("benchmarks/blind-object-v1-results/")), false);
  assert.deepEqual(committed.activityAssertions, {
    benchmarkExecutions: 0, credentialAccessCount: 0, durableMemoryPromotions: 0, failedQualificationReplays: 0,
    merges: 0, metadataRequestCount: 0, modelCallCount: 0, previewDeployments: 0, productHandlerInvocations: 0,
    productionDeployments: 0, providerRequestCount: 0, qualificationAuthoritiesCreated: 0, qualificationCasesExecuted: 0
  });
});
