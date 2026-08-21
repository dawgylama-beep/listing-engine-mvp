import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  COGNITIVE_ACTION,
  createCognitiveGovernor,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import {
  assembleV4CognitiveResponse,
  assertV4ProviderAnalysisObject
} from "../qualification/synthetic-executive/v4-qualification-route/execute-core.mjs";
import {
  ExecutiveMemoryStore,
  commitGovernedExecutiveMemoryTransition
} from "../qualification/synthetic-executive/scripts/memory-store.mjs";

const fixedNow = "2026-08-21T14:00:00.000Z";

function evidenceRecord(identity) {
  return {
    evidenceId: identity,
    sourceRecordId: identity,
    exactnessClassification: "COMPATIBLE",
    verificationState: "VERIFIED",
    sourceEvidenceText: `Visible evidence for ${identity}`
  };
}

function objectMind(evidenceIds = []) {
  return {
    objectStateId: "purpose-neutral-synthetic-state",
    identityStateHash: "f".repeat(64),
    requestIdentity: { inputImageIds: [], inputDescriptionProvenance: { sha256: "e".repeat(64) } },
    observedFacts: [{
      observationId: "visible-observation",
      factType: "purpose_neutral_visible_evidence",
      value: "A bounded failure is visible.",
      normalizedValue: "a bounded failure is visible",
      certaintyBand: "HIGH",
      origin: "DIRECTLY_VISIBLE"
    }],
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: "purpose-neutral-candidate",
      exactCandidateLabel: "Visible executive episode",
      broaderFamilyIdentity: "purpose-neutral executive evidence",
      exactnessLevel: "EXACT",
      confidenceBand: "HIGH",
      supportingObservationIds: ["visible-observation"],
      contradictingObservations: [],
      unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: "purpose-neutral-candidate",
      stableIdentityKey: "purpose-neutral-evidence",
      exactnessClassification: "EXACT_IDENTITY",
      bestSupportedCustomerIdentity: "Visible executive episode",
      broaderFallbackIdentity: "purpose-neutral executive evidence",
      limitations: [],
      additionalEvidenceNeeded: []
    },
    searchPlan: [],
    candidateEvidence: evidenceIds.map(evidenceRecord)
  };
}

function executiveState(overrides = {}) {
  const visibleEvidenceIds = overrides.visibleEvidenceIds || ["visible-artifact-alpha", "visible-artifact-beta"];
  return {
    missionObjective: "Diagnose the visible failure and select one governed next action.",
    finishLine: "A bounded disposition is tied to visible evidence and existing authority.",
    earliestCausalBoundary: "VISIBLE_INGRESS_BOUNDARY",
    visibleEvidenceIds,
    requiredEvidenceIds: overrides.requiredEvidenceIds || [...visibleEvidenceIds],
    evidenceCondition: "SUPPORTED",
    failureCondition: "Visible ingress failure",
    failureScope: "BOUNDED",
    uncertaintyClass: "NONE",
    authorityClass: "EXISTING",
    permittedOperations: ["READ_VISIBLE_ARTIFACT", "RETURNED_EVIDENCE_EVALUATION", "SUBMIT_TYPED_ACTION"],
    prohibitedOperations: ["FABRICATE_EVIDENCE", "OUTSIDE_EXISTING_AUTHORITY", "USE_PRIVATE_EVALUATOR_MATERIAL"],
    safeContinuation: true,
    newMechanismRequired: false,
    contradictionPresent: false,
    cycleDetected: false,
    duplicateDetected: false,
    dossierStage: "RETURNED",
    stoppingState: "ACTIVE",
    ...overrides
  };
}

function snapshot(executive, overrides = {}) {
  const evidenceIds = executive.visibleEvidenceIds || [];
  const mind = objectMind(evidenceIds);
  return {
    evaluationId: overrides.evaluationId || "purpose-neutral-evaluation",
    objectMindState: mind,
    evidenceRecords: mind.candidateEvidence,
    providerRequests: overrides.providerRequests || [],
    initialPlan: overrides.initialPlan || [],
    refinementPlan: overrides.refinementPlan || [],
    directPageCandidates: [],
    providerBudget: overrides.providerBudget || { maximum: 0, consumed: 0 },
    directPageBudget: { maximum: 0, consumed: 0 },
    executiveState: executive
  };
}

function memoryContext(overrides = {}) {
  return {
    runIdentity: overrides.runIdentity || "synthetic-run",
    currentEpisodeId: overrides.currentEpisodeId || "episode-current",
    records: overrides.records || [],
    selectedMemoryIds: overrides.selectedMemoryIds || [],
    retrievalReceiptHash: overrides.retrievalReceiptHash || "",
    startsEmpty: true,
    forwardOnly: true
  };
}

function runtimeFor(executive, overrides = {}) {
  const governor = createCognitiveGovernor({ evaluationId: overrides.evaluationId || "purpose-neutral-evaluation" });
  return runCanonicalCognitiveRuntime({
    governor,
    snapshot: snapshot(executive, overrides),
    executiveMemoryContext: memoryContext(overrides.memory || {})
  });
}

function runtimeContext(runtime, { visibleEvidenceIds, retrievalReceipt, selectedMemoryRecords = [], episodeSequence = 1 }) {
  return {
    episodeSequence,
    visibleEvidenceIds,
    retrievalReceipt,
    selectedMemoryRecords,
    mentorDecisionIdentity: runtime.mentorDecisionIdentity,
    mentorDecision: runtime.mentorDecision,
    executiveState: runtime.decision.inputState.executiveState,
    cognitiveBoundary: runtime.decision.cognitiveBoundary,
    cognitiveAction: runtime.decision.actionType
  };
}

function providerAnalysis(memoryApplicability = "NOT_APPLICABLE") {
  return {
    failureAnalysis: "Bounded visible ingress failure",
    memoryApplicability,
    rationale: "Evaluate the returned visible evidence without expanding authority or fabricating support.",
    uncertaintyAnalysis: "The bounded disposition remains tied to the visible artifacts."
  };
}

test("materially different public executive states derive different canonical boundaries and mentor decisions", () => {
  const initial = runtimeFor(executiveState({
    visibleEvidenceIds: [], requiredEvidenceIds: [], evidenceCondition: "INITIAL",
    dossierStage: "NOT_APPLICABLE"
  }), {
    initialPlan: [{ query: "initial visible evidence", phase: "INITIAL" }],
    providerBudget: { maximum: 1, consumed: 0 }
  });
  const insufficient = runtimeFor(executiveState({
    evidenceCondition: "INSUFFICIENT", dossierStage: "NOT_APPLICABLE",
    uncertaintyClass: "INSUFFICIENT_EVIDENCE"
  }), {
    providerRequests: [{ attempted: true, physicalAttemptCount: 1, objectMindPhase: "INITIAL" }],
    refinementPlan: [{ query: "bounded missing discriminator", phase: "REFINEMENT" }],
    providerBudget: { maximum: 2, consumed: 1 }
  });
  const dossier = runtimeFor(executiveState());
  const authority = runtimeFor(executiveState({
    authorityClass: "NEW_REQUIRED", newMechanismRequired: true,
    stoppingState: "AUTHORITY_REQUIRED", dossierStage: "CAPABLE", safeContinuation: false
  }));

  assert.equal(initial.decision.actionType, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE);
  assert.equal(initial.decision.cognitiveBoundary, "INITIAL_ACQUISITION");
  assert.equal(insufficient.decision.actionType, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);
  assert.equal(insufficient.decision.cognitiveBoundary, "REFINEMENT");
  assert.equal(dossier.decision.actionType, COGNITIVE_ACTION.EVALUATE_RETURNED_EVIDENCE);
  assert.equal(dossier.decision.cognitiveBoundary, "DOSSIER_EVALUATION");
  assert.equal(authority.decision.actionType, COGNITIVE_ACTION.REQUEST_NEW_AUTHORITY);
  assert.equal(authority.mentorDecision.nextActionClass, "REQUEST_NEW_AUTHORITY");
  assert.equal(new Set([
    initial.mentorDecisionIdentity, insufficient.mentorDecisionIdentity,
    dossier.mentorDecisionIdentity, authority.mentorDecisionIdentity
  ]).size, 4);
});

test("initial acquisition is genuine-only while duplicate, cycle, and unsafe authority states stop or request safely", () => {
  const visibleInitialClaim = executiveState({ dossierStage: "NOT_APPLICABLE" });
  const notInitial = runtimeFor(visibleInitialClaim, {
    initialPlan: [{ query: "must not be treated as initial", phase: "INITIAL" }],
    providerBudget: { maximum: 1, consumed: 0 }
  });
  assert.notEqual(notInitial.decision.actionType, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE);

  const duplicate = runtimeFor(executiveState({ duplicateDetected: true }));
  const cycle = runtimeFor(executiveState({ cycleDetected: true }));
  const noSafeAction = runtimeFor(executiveState({
    safeContinuation: false, dossierStage: "EVALUATED", stoppingState: "NO_SAFE_ACTION"
  }));
  assert.equal(duplicate.mentorDecision.nextActionClass, "STOP_REPEATED_LOOP");
  assert.equal(duplicate.mentorDecision.duplicateActionDetected, true);
  assert.equal(cycle.mentorDecision.nextActionClass, "STOP_REPEATED_LOOP");
  assert.equal(cycle.mentorDecision.repeatedLoopDetected, true);
  assert.equal(noSafeAction.decision.actionType, COGNITIVE_ACTION.STOP_NO_SAFE_ADVANCING_ACTION);
  assert.equal(noSafeAction.mentorDecision.safeIndependentContinuation, false);
});

test("provider analysis cannot overwrite closed cognitive fields and public evidence cannot contain runtime authority hashes", () => {
  assert.throws(() => assertV4ProviderAnalysisObject({
    ...providerAnalysis(),
    authorityClass: "EXCEPTIONAL_HUMAN"
  }), /V4_PROVIDER_ANALYSIS_FIELDS_DIFFER/);

  assert.throws(() => runtimeFor(executiveState({
    visibleEvidenceIds: ["a".repeat(64)], requiredEvidenceIds: ["a".repeat(64)]
  })), /Runtime hashes cannot be represented as public evidence identities/);

  const runtime = runtimeFor(executiveState());
  const retrievalReceipt = {
    selectedMemoryIds: [],
    receiptHash: "b".repeat(64),
    currentEpisodeId: "episode-assembly"
  };
  const context = runtimeContext(runtime, {
    visibleEvidenceIds: executiveState().visibleEvidenceIds,
    retrievalReceipt
  });
  const assembled = assembleV4CognitiveResponse({ providerAnalysis: providerAnalysis(), runtimeContext: context });
  assert.equal(assembled.responseObject.authorityClass, "NO_NEW_AUTHORITY");
  assert.equal(assembled.responseObject.nextAction, "ADVANCE_WITHIN_EXISTING_AUTHORITY");
  assert.deepEqual(assembled.responseObject.prohibitedOperations, [
    "FABRICATE_EVIDENCE", "OUTSIDE_EXISTING_AUTHORITY", "USE_PRIVATE_EVALUATOR_MATERIAL"
  ]);
  assert.equal(assembled.responseObject.evidenceReferences.every((identity) => context.visibleEvidenceIds.includes(identity)), true);
});

test("production assembly governs forward lesson storage, retrieval, non-reuse, immutability, and run isolation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-cognitive-flow-memory-"));
  const store = new ExecutiveMemoryStore(path.join(root, "run-one-memory"));
  const isolatedStore = new ExecutiveMemoryStore(path.join(root, "run-two-memory"));
  const runIdentity = "purpose-neutral-run-one";
  try {
    await store.initializeEmpty();
    await isolatedStore.initializeEmpty();
    const visibleEvidenceIds = executiveState().visibleEvidenceIds;
    const firstReceipt = await store.retrieve({
      episodeId: "episode-foundation",
      queryFacets: { pattern: ["bounded visible ingress failure"], failureClass: [], cohort: [] },
      queryText: "bounded visible ingress failure",
      createdAt: fixedNow
    });
    const firstRuntime = runtimeFor(executiveState(), {
      evaluationId: "foundation-evaluation",
      memory: { runIdentity, currentEpisodeId: "episode-foundation", retrievalReceiptHash: firstReceipt.receiptHash }
    });
    const firstContext = runtimeContext(firstRuntime, { visibleEvidenceIds, retrievalReceipt: firstReceipt, episodeSequence: 1 });
    const firstAssembly = assembleV4CognitiveResponse({ providerAnalysis: providerAnalysis(), runtimeContext: firstContext });
    assert.equal(firstAssembly.responseObject.memoryStatus, "CANDIDATE");
    const firstTransition = await commitGovernedExecutiveMemoryTransition({
      store, runIdentity, episodeId: "episode-foundation", episodeSequence: 1,
      authoritativeResponse: firstAssembly.responseObject, responseAssembly: firstAssembly.responseAssembly,
      retrievalReceipt: firstReceipt, visibleEvidenceIds,
      mentorDecisionIdentity: firstRuntime.mentorDecisionIdentity,
      expectedBeforeMemoryIds: [], createdAt: fixedNow
    });
    assert.equal(firstTransition.lessonDisposition, "ACCEPTED_CANDIDATE");
    const firstRecordPath = path.join(store.root, `${firstTransition.acceptedMemoryId}.json`);
    const firstRecordBytes = await readFile(firstRecordPath);
    const records = await store.list();

    const recurrenceReceipt = await store.retrieve({
      episodeId: "episode-recurrence",
      queryFacets: { pattern: ["bounded visible ingress failure"], failureClass: [], cohort: [] },
      queryText: "bounded visible ingress failure",
      createdAt: fixedNow
    });
    assert.deepEqual(recurrenceReceipt.selectedMemoryIds, [records[0].memoryId]);
    const recurrenceRuntime = runtimeFor(executiveState(), {
      evaluationId: "recurrence-evaluation",
      memory: {
        runIdentity, currentEpisodeId: "episode-recurrence", records,
        selectedMemoryIds: recurrenceReceipt.selectedMemoryIds,
        retrievalReceiptHash: recurrenceReceipt.receiptHash
      }
    });
    const recurrenceContext = runtimeContext(recurrenceRuntime, {
      visibleEvidenceIds, retrievalReceipt: recurrenceReceipt, selectedMemoryRecords: records, episodeSequence: 2
    });
    const recurrenceAssembly = assembleV4CognitiveResponse({
      providerAnalysis: providerAnalysis("APPLICABLE"), runtimeContext: recurrenceContext
    });
    assert.equal(recurrenceAssembly.responseObject.memoryStatus, "RETRIEVED_APPLIED");
    assert.equal(recurrenceAssembly.responseObject.applicableMemoryId, records[0].memoryId);
    const recurrenceTransition = await commitGovernedExecutiveMemoryTransition({
      store, runIdentity, episodeId: "episode-recurrence", episodeSequence: 2,
      authoritativeResponse: recurrenceAssembly.responseObject, responseAssembly: recurrenceAssembly.responseAssembly,
      retrievalReceipt: recurrenceReceipt, visibleEvidenceIds,
      mentorDecisionIdentity: recurrenceRuntime.mentorDecisionIdentity,
      expectedBeforeMemoryIds: [records[0].memoryId], createdAt: fixedNow
    });
    assert.equal(recurrenceTransition.lessonFormation, "NOT_REQUESTED");

    const novelAssembly = assembleV4CognitiveResponse({
      providerAnalysis: providerAnalysis("NOT_APPLICABLE"), runtimeContext: recurrenceContext
    });
    assert.equal(novelAssembly.responseObject.applicableMemoryId, null);
    assert.equal(novelAssembly.responseObject.classificationType, "DECLARE_NOVEL_FAILURE");

    const insufficientRuntime = runtimeFor(executiveState({
      evidenceCondition: "INSUFFICIENT", dossierStage: "NOT_APPLICABLE",
      uncertaintyClass: "INSUFFICIENT_EVIDENCE", stoppingState: "INSUFFICIENT_EVIDENCE",
      safeContinuation: false
    }), {
      evaluationId: "insufficient-evaluation",
      memory: {
        runIdentity, currentEpisodeId: "episode-insufficient", records,
        selectedMemoryIds: recurrenceReceipt.selectedMemoryIds,
        retrievalReceiptHash: recurrenceReceipt.receiptHash
      }
    });
    const insufficientContext = runtimeContext(insufficientRuntime, {
      visibleEvidenceIds, retrievalReceipt: { ...recurrenceReceipt, currentEpisodeId: "episode-insufficient" },
      selectedMemoryRecords: records, episodeSequence: 3
    });
    const insufficientAssembly = assembleV4CognitiveResponse({
      providerAnalysis: providerAnalysis("APPLICABLE"), runtimeContext: insufficientContext
    });
    assert.equal(insufficientAssembly.responseObject.applicableMemoryId, null);
    assert.equal(insufficientAssembly.responseObject.memoryStatus, "INSUFFICIENT_EVIDENCE");
    assert.deepEqual(await readFile(firstRecordPath), firstRecordBytes);
    assert.deepEqual(await isolatedStore.list(), []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("product and qualification route call the same state-derived canonical runtime", async () => {
  const [productSource, routeSource, policySource] = await Promise.all([
    readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8"),
    readFile(new URL("../qualification/synthetic-executive/v4-qualification-route/execute-core.mjs", import.meta.url), "utf8"),
    readFile(new URL("../lib/cognitive-governor/policy.js", import.meta.url), "utf8")
  ]);
  assert.match(productSource, /runCanonicalCognitiveRuntime\s*\(/);
  assert.match(routeSource, /runCanonicalCognitiveRuntime\s*\(/);
  assert.doesNotMatch(productSource, /COGNITIVE_BOUNDARY/);
  assert.doesNotMatch(routeSource, /options:\s*\{\s*boundary/);
  assert.match(policySource, /deriveCognitiveBoundary\s*\(/);
  assert.match(policySource, /boundary:\s*COGNITIVE_BOUNDARY\.AUTO/);
});
