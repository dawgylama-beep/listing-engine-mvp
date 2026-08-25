import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildProductGovernedLearningProjection,
  createGenerateListingHandler,
  classifyGovernedProductFailure
} from "../api/generate-listing.js";
import {
  COGNITIVE_ACTION,
  createCognitiveGovernor,
  executeGovernorAuthorizedAction,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import {
  GOVERNED_RESEARCH_APPLICABILITY,
  GovernedLearningAdapter,
  GovernedLearningError,
  classifyGovernedResearchApplicability,
  sealGovernedTrialCausalAttribution
} from "../lib/cognitive-learning/adapter.js";
import { sha256Object } from "../lib/object-intelligence/index.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const fixedTime = "2026-08-23T14:00:00.000Z";
const digest = (value) => sha256Object(value);
const zeroRisk = Object.freeze({
  canonicalIdentityUnresolvedCount: 0,
  unsupportedQueryTermCount: 0,
  exactComparableCount: 0,
  closeComparableCount: 0,
  categoryComparableCount: 0,
  weakPriceProvenanceCount: 0,
  valueJudgmentExceedsEvidenceCount: 0
});
const risk = Object.freeze({
  none: zeroRisk,
  unsupportedQuery: Object.freeze({ ...zeroRisk, canonicalIdentityUnresolvedCount: 1, unsupportedQueryTermCount: 1, exactComparableCount: 1 }),
  sparseLadder: Object.freeze({ ...zeroRisk, canonicalIdentityUnresolvedCount: 2, exactComparableCount: 2 }),
  categoryOnly: Object.freeze({ ...zeroRisk, categoryComparableCount: 2 }),
  clear: Object.freeze({ ...zeroRisk, exactComparableCount: 1, closeComparableCount: 1, categoryComparableCount: 1 })
});

function snapshot(id, { insufficient = false, novel = false } = {}) {
  const evidenceId = `evidence-${id}`;
  const objectMindState = {
    objectStateId: `object-${id}`,
    identityStateHash: digest({ id, identity: true }),
    requestIdentity: {
      inputImageIds: [`image-${id}`],
      inputDescriptionProvenance: { sha256: digest({ id, description: true }) }
    },
    observedFacts: [{
      observationId: evidenceId,
      factType: "research_evidence_risk",
      value: "A neutral comparable-research condition is present.",
      normalizedValue: "a neutral comparable-research condition is present",
      certaintyBand: "HIGH",
      origin: "DIRECTLY_VISIBLE"
    }],
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: `hypothesis-${id}`,
      exactCandidateLabel: "Neutral research object",
      broaderFamilyIdentity: "research object",
      exactnessLevel: "BROADER_FAMILY",
      confidenceBand: "MEDIUM",
      supportingObservationIds: [evidenceId],
      contradictingObservations: [],
      unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: `hypothesis-${id}`,
      stableIdentityKey: `neutral-${id}`,
      exactnessClassification: "BROADER_FAMILY",
      bestSupportedCustomerIdentity: "Neutral research object",
      broaderFallbackIdentity: "research object",
      limitations: [],
      additionalEvidenceNeeded: []
    },
    searchPlan: [],
    candidateEvidence: [{
      evidenceId,
      sourceRecordId: evidenceId,
      exactnessClassification: "COMPATIBLE",
      verificationState: "VERIFIED",
      sourceEvidenceText: "Neutral visible evidence."
    }]
  };
  return {
    evaluationId: id,
    objectMindState,
    evidenceRecords: objectMindState.candidateEvidence,
    providerRequests: [],
    initialPlan: [],
    refinementPlan: [],
    directPageCandidates: [],
    providerBudget: { maximum: 1, consumed: 0 },
    directPageBudget: { maximum: 0, consumed: 0 },
    executiveState: {
      missionObjective: "Resolve one bounded evidence condition.",
      finishLine: "Preserve unknowns unless governed evidence resolves them.",
      earliestCausalBoundary: "GOVERNED_RESEARCH_STRATEGY",
      visibleEvidenceIds: [evidenceId],
      requiredEvidenceIds: [evidenceId],
      evidenceCondition: insufficient ? "INSUFFICIENT" : "SUPPORTED",
      failureCondition: insufficient ? "Comparable evidence is absent" : "Comparable ladder is incomplete",
      failureScope: insufficient ? "INSUFFICIENT_EVIDENCE" : "BOUNDED",
      uncertaintyClass: insufficient ? "INSUFFICIENT_EVIDENCE" : "NONE",
      authorityClass: "EXISTING",
      permittedOperations: ["GOVERNED_RESEARCH_STRATEGY_APPLICATION", "RETURNED_EVIDENCE_EVALUATION"],
      prohibitedOperations: ["PROVIDER_LIFECYCLE_TRANSITION", "MEMORY_PROMOTION"],
      safeContinuation: !insufficient,
      newMechanismRequired: false,
      contradictionPresent: false,
      cycleDetected: false,
      duplicateDetected: false,
      memoryReuseBoundary: novel ? "NOVEL" : "ANALOGUE",
      dossierStage: insufficient ? "NOT_APPLICABLE" : "CAPABLE",
      stoppingState: insufficient ? "INSUFFICIENT_EVIDENCE" : "ACTIVE"
    }
  };
}

async function runtime(adapter, {
  id,
  sequence,
  evidenceRisk = risk.clear,
  preHash = digest({ id, state: "pre" }),
  mode = "PRODUCT",
  trialRequest = null,
  insufficient = false,
  novel = false
}) {
  const governor = createCognitiveGovernor({ evaluationId: id });
  const memoryContext = await adapter.prepareEpisode({
    governor,
    episodeId: id,
    episodeSequence: sequence,
    queryFacets: {
      purpose: ["NEUTRAL_REVIEW"],
      researchEvidenceRisk: evidenceRisk,
      frozenPreInterventionStateHash: preHash,
      requiredApplicabilitySignals: ["FORGED_CALLER_SIGNAL"]
    },
    queryText: `materially different neutral object ${id}`,
    learningMode: mode,
    trialRequest,
    createdAt: fixedTime
  });
  if (mode === "GOVERNED_TRIAL") {
    assert.deepEqual({
      mode: memoryContext.learningMode,
      governor: memoryContext.trialAuthorization?.governorIdentity === governor.governorIdentity,
      type: memoryContext.trialAuthorization?.authorityType === "GOVERNOR_QUALIFICATION_TRIAL",
      ids: Array.isArray(memoryContext.trialAuthorization?.candidateMemoryIds),
      hash: /^[a-f0-9]{64}$/i.test(memoryContext.trialAuthorization?.trialAuthorizationId || ""),
      authorization: memoryContext.retrievalDecision.trialAuthorizationId === memoryContext.trialAuthorization.trialAuthorizationId,
      applicability: memoryContext.retrievalDecision.researchApplicabilityDecisionHash === memoryContext.trialAuthorization.applicabilityDecisionHash
    }, {
      mode: "GOVERNED_TRIAL",
      governor: true,
      type: true,
      ids: true,
      hash: true,
      authorization: true,
      applicability: true
    });
  }
  const governedRuntime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: snapshot(id, { insufficient, novel }),
    executiveMemoryContext: memoryContext
  });
  return { governor, memoryContext, runtime: governedRuntime, preHash, evidenceRisk };
}

async function outcome(adapter, authority, {
  responseHash = digest({ id: authority.runtime.memory.currentEpisodeId, response: true }),
  planHash = digest({ id: authority.runtime.memory.currentEpisodeId, researchPlan: true }),
  attribution = null
} = {}) {
  const id = authority.runtime.memory.currentEpisodeId;
  const recorded = await adapter.recordProductOutcome({
    governor: authority.governor,
    runtime: authority.runtime,
    episodeId: id,
    episodeSequence: authority.memoryContext.episodeSequence,
    responseHash,
    originalEvidenceIdentity: digest({ id, evidence: true }),
    cognitiveEpisodeHash: digest({ id, episode: true }),
    submittedObjectFingerprint: `object-${id}`,
    memoryTransitionHash: authority.runtime.authoritativeMemoryTransition.memoryTransitionHash,
    causalAttribution: attribution,
    frozenPreInterventionStateHash: authority.preHash,
    researchPlanStateHash: planHash,
    researchApplicabilityDecisionHash: authority.memoryContext.researchApplicabilityDecision.applicabilityDecisionHash,
    createdAt: fixedTime
  });
  return { ...recorded, responseHash, planHash, authority };
}

function responseCapture() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

async function candidateFromFeedback(adapter, training) {
  const envelope = await adapter.authorizeProductOutcomeFeedback({
    episodeId: training.episode_id,
    responseHash: training.responseHash,
    originalEvidenceIdentity: training.original_evidence_identity,
    failedClaim: {
      claimPath: "analysis.searchDiagnostics.queriesActuallySent",
      claimClass: "COMPARABLE_RESEARCH_STRATEGY",
      assertedValue: "Exact-only queries exhausted the bounded search budget.",
      failureKind: "FAILED_TO_BROADEN_COMPARABLE_RESEARCH"
    },
    correction: {
      correctedState: "BALANCE_EXACT_CLOSE_AND_CATEGORY_COMPARABLES",
      evidenceProvenance: {
        authorityClass: "OWNER_VERIFIED_PRODUCT_OUTCOME",
        sourceType: "DIRECT_REVIEW_OF_PRODUCT_RESPONSE_AND_SOURCE_EVIDENCE",
        sourceIdentity: digest("owner-review"),
        providerAuthored: false
      }
    },
    issuedAt: fixedTime
  });
  const handler = createGenerateListingHandler({
    getGovernedLearningAdapter: () => adapter,
    nowIso: () => fixedTime,
    createAnalysisId: () => "feedback-diagnosis"
  });
  const response = responseCapture();
  await handler({ method: "POST", body: {
    analysisId: "feedback-diagnosis",
    action: "submit_product_outcome_feedback",
    feedbackEnvelope: envelope
  } }, response);
  assert.equal(response.statusCode, 200, JSON.stringify(response.payload));
  return response.payload.feedback;
}

function causalRefs(value) {
  return [...new Set([
    value.applicabilityDecisionHash,
    value.trialAuthorizationId,
    value.memoryTransitionHash,
    value.mentorDecisionIdentity,
    value.governorDecisionIdentity,
    value.governorExecutionEventIdentity,
    value.providerRequestIdentity,
    value.newEvidenceIdentity,
    value.frozenPreInterventionStateHash,
    value.beforeStateHash,
    value.afterStateHash,
    value.researchPlanBeforeHash,
    value.researchPlanAfterHash,
    value.causalAttributionHash
  ].filter(Boolean))].sort();
}

async function strategyOutcome(adapter, authority, {
  candidateId = "",
  planBefore,
  planAfter,
  afterState,
  complete = true
}) {
  assert.equal(
    authority.runtime.decision.actionType,
    COGNITIVE_ACTION.APPLY_GOVERNED_RESEARCH_STRATEGY,
    JSON.stringify({
      memoryContext: authority.memoryContext,
      governorIdentity: authority.governor.governorIdentity,
      governedLearning: authority.runtime.governedLearning,
      executiveState: authority.runtime.decision.inputState.executiveState,
      providerCapacity: authority.runtime.decision.inputState.providerCapacity
    })
  );
  executeGovernorAuthorizedAction(authority.governor, authority.runtime.decision, COGNITIVE_ACTION.APPLY_GOVERNED_RESEARCH_STRATEGY, {
    operationPhase: "GOVERNED_RESEARCH_STRATEGY_APPLICATION",
    operation: () => planAfter
  });
  const execution = authority.governor.executionLedger.controlledExecutionEvents.at(-1);
  const provider = {
    providerRequestIdentity: digest({ id: authority.runtime.memory.currentEpisodeId, providerRequest: true }),
    responseHash: digest({ id: authority.runtime.memory.currentEpisodeId, newEvidence: true }),
    controlledExecutionEventIdentity: execution.executionEventIdentity,
    providerLifecycleAuthority: false
  };
  const transition = authority.runtime.authoritativeMemoryTransition;
  const trialMemoryId = transition.trialAppliedCandidateIds[0] || "";
  const lessonId = transition.appliedLessonIds[0] || "";
  const attribution = sealGovernedTrialCausalAttribution({
    trialRole: trialMemoryId ? "APPLICABLE_INTERVENTION" : "AUTHORIZED_LESSON_TRANSFER",
    candidateId: trialMemoryId ? candidateId : "",
    candidateMemoryId: trialMemoryId || lessonId,
    applicabilityDecisionHash: authority.memoryContext.researchApplicabilityDecision.applicabilityDecisionHash,
    applicabilityClassification: authority.memoryContext.researchApplicabilityDecision.classification,
    trialAuthorizationId: trialMemoryId ? authority.memoryContext.trialAuthorization.trialAuthorizationId : "",
    trialSelectedCandidateIds: transition.trialSelectedCandidateIds,
    trialAppliedCandidateIds: transition.trialAppliedCandidateIds,
    memoryTransitionHash: transition.memoryTransitionHash,
    mentorActionId: authority.runtime.decision.actionType,
    mentorDecisionIdentity: authority.runtime.mentorDecisionIdentity,
    governorDecisionIdentity: authority.runtime.decision.decisionIdentity,
    governorExecutionEventIdentity: execution.executionEventIdentity,
    governorAuthorized: complete,
    strategyApplied: true,
    providerRequestIdentity: provider.providerRequestIdentity || provider.logicalProviderRequestIdentity,
    newEvidenceIdentity: provider.responseHash,
    frozenPreInterventionStateHash: authority.preHash,
    beforeStateHash: authority.preHash,
    afterStateHash: afterState,
    researchPlanBeforeHash: planBefore,
    researchPlanAfterHash: planAfter,
    researchPlanChanged: planBefore !== planAfter,
    interventionOnlyDifference: true,
    providerLifecycleAuthority: false
  });
  const recorded = await outcome(adapter, authority, { planHash: planAfter, attribution });
  return { recorded, attribution, provider };
}

function interventionTrial(id, before, after, beforeScore, afterScore, beforeViolations, afterViolations) {
  return {
    caseId: id,
    beforeEpisodeId: before.episode_id,
    afterEpisodeId: after.recorded.episode_id,
    beforeResponseHash: before.responseHash,
    afterResponseHash: after.recorded.responseHash,
    beforeScore,
    afterScore,
    beforeViolations,
    afterViolations,
    evidenceRefs: causalRefs(after.attribution),
    causalAttribution: after.attribution
  };
}

function controlAttribution(before, after) {
  const authority = after.authority;
  return sealGovernedTrialCausalAttribution({
    trialRole: "NON_APPLICABLE_CONTROL",
    candidateId: "",
    candidateMemoryId: "",
    applicabilityDecisionHash: authority.memoryContext.researchApplicabilityDecision.applicabilityDecisionHash,
    applicabilityClassification: authority.memoryContext.researchApplicabilityDecision.classification,
    trialAuthorizationId: "",
    trialSelectedCandidateIds: [],
    trialAppliedCandidateIds: [],
    memoryTransitionHash: authority.runtime.authoritativeMemoryTransition.memoryTransitionHash,
    mentorActionId: authority.runtime.decision.actionType,
    mentorDecisionIdentity: authority.runtime.mentorDecisionIdentity,
    governorDecisionIdentity: authority.runtime.decision.decisionIdentity,
    governorExecutionEventIdentity: "",
    governorAuthorized: false,
    strategyApplied: false,
    providerRequestIdentity: "",
    newEvidenceIdentity: "",
    frozenPreInterventionStateHash: authority.preHash,
    beforeStateHash: authority.preHash,
    afterStateHash: authority.preHash,
    researchPlanBeforeHash: before.planHash,
    researchPlanAfterHash: before.planHash,
    researchPlanChanged: false,
    interventionOnlyDifference: true,
    providerLifecycleAuthority: false
  });
}

async function fixture(root, { incomplete = false } = {}) {
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "neutral-learning-scope" });
  const training = await outcome(adapter, await runtime(adapter, {
    id: "training",
    sequence: 1,
    evidenceRisk: risk.unsupportedQuery,
    preHash: digest("training-pre")
  }));
  const candidate = await candidateFromFeedback(adapter, training);
  const pair = async (name, sequence, evidenceRisk, complete) => {
    const preHash = digest(`${name}-pre`);
    const planBefore = digest(`${name}-plan-before`);
    const before = await outcome(adapter, await runtime(adapter, {
      id: `${name}-before`, sequence, evidenceRisk, preHash
    }), { planHash: planBefore });
    const afterAuthority = await runtime(adapter, {
      id: `${name}-after`,
      sequence: sequence + 1,
      evidenceRisk,
      preHash,
      mode: "GOVERNED_TRIAL",
      trialRequest: {
        candidateId: candidate.candidateId,
        beforeArmEpisodeId: `${name}-before`,
        afterArmEpisodeId: `${name}-after`,
        frozenPreInterventionStateHash: preHash,
        purpose: "ISOLATED_CAUSAL_QUALIFICATION"
      }
    });
    const after = await strategyOutcome(adapter, afterAuthority, {
      candidateId: candidate.candidateId,
      planBefore,
      planAfter: digest(`${name}-plan-after`),
      afterState: digest(`${name}-after-state`),
      complete
    });
    return { before, after };
  };
  const marking = await pair("marking", 3, risk.unsupportedQuery, true);
  const configuration = await pair("configuration", 5, risk.sparseLadder, !incomplete);
  const clearPre = digest("clear-pre");
  const clearClaim = digest("clear-plan");
  const clearBefore = await outcome(adapter, await runtime(adapter, {
    id: "clear-before", sequence: 7, evidenceRisk: risk.clear, preHash: clearPre
  }), { planHash: clearClaim });
  const clearAfter = await outcome(adapter, await runtime(adapter, {
    id: "clear-after", sequence: 8, evidenceRisk: risk.clear, preHash: clearPre
  }), { planHash: clearClaim });
  const clearCausal = controlAttribution(clearBefore, clearAfter);
  const trials = [
    interventionTrial("neutral-marking", marking.before, marking.after, 0.3, 0.8, 2, 0),
    interventionTrial("neutral-configuration", configuration.before, configuration.after, 0.4, 0.8, 1, 0),
    {
      caseId: "neutral-clear-control",
      beforeEpisodeId: clearBefore.episode_id,
      afterEpisodeId: clearAfter.episode_id,
      beforeResponseHash: clearBefore.responseHash,
      afterResponseHash: clearAfter.responseHash,
      beforeScore: 0.8,
      afterScore: 0.95,
      beforeViolations: 0,
      afterViolations: 0,
      evidenceRefs: causalRefs(clearCausal),
      causalAttribution: clearCausal
    }
  ];
  const authority = await runtime(adapter, { id: "qualification", sequence: 9, evidenceRisk: risk.clear });
  const qualification = await adapter.qualifyCandidate({
    governor: authority.governor,
    runtime: authority.runtime,
    candidateId: candidate.candidateId,
    trials,
    minimumMeanImprovement: 0.1,
    minimumApplicationImprovement: 0.1,
    visibleEvidenceIds: trials.flatMap((trial) => trial.evidenceRefs),
    episodeSequence: 9,
    createdAt: fixedTime
  });
  return { adapter, candidate, qualification, trials, marking, configuration, clearBefore, clearAfter };
}

test("purpose-neutral applicability matcher separates all four research states", async (t) => {
  await t.test("no canonical research plan", () => {
    const result = classifyGovernedResearchApplicability(risk.none);
    assert.equal(result.classification, GOVERNED_RESEARCH_APPLICABILITY.NO_RESEARCH_PLAN);
    assert.equal(result.applicable, false);
  });
  await t.test("unsupported query contamination", () => {
    const result = classifyGovernedResearchApplicability(risk.unsupportedQuery);
    assert.equal(result.classification, GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE);
    assert.equal(result.applicable, true);
  });
  await t.test("category-only evidence is sparse but not a strategy intervention", () => {
    const result = classifyGovernedResearchApplicability(risk.categoryOnly);
    assert.equal(result.classification, GOVERNED_RESEARCH_APPLICABILITY.SPARSE_EVIDENCE);
    assert.equal(result.applicable, false);
  });
  await t.test("complete grounded ladder", () => {
    const result = classifyGovernedResearchApplicability(risk.clear);
    assert.equal(result.classification, GOVERNED_RESEARCH_APPLICABILITY.CLEAR);
    assert.equal(result.applicable, false);
  });
});

test("deterministic failure taxonomy excludes operational failures", async (t) => {
  await t.test("transport remains operational even with semantic provider words", () => {
    const result = classifyGovernedProductFailure({
      internalCode: "PRODUCT_SEMANTIC_PROVIDER_WORDS",
      errorCategory: "PROVIDER_FAILURE",
      httpStatus: 502,
      physicalProviderAttemptBegan: true,
      governorReached: true,
      authoritativeStateReached: true,
      partialGovernorLedgerPresent: true
    });
    assert.equal(result.failureClass, "PROVIDER_TRANSPORT_FAILURE");
    assert.equal(result.cognitiveEntryAuthorized, false);
    assert.equal(result.providerTextConsidered, false);
  });
  await t.test("rate limit remains operational", () => {
    const result = classifyGovernedProductFailure({ internalCode: "RATE_LIMIT", errorCategory: "PROVIDER_FAILURE", httpStatus: 429 });
    assert.equal(result.failureClass, "AUTHENTICATION_OR_RATE_LIMIT_FAILURE");
    assert.equal(result.cognitiveEntryAuthorized, false);
  });
  await t.test("evidence-bound semantic quality may enter", () => {
    const result = classifyGovernedProductFailure({
      internalCode: "EVIDENCE_QUALITY_CANONICAL_CONFLICT",
      errorCategory: "INTERNAL_EVALUATION_ERROR",
      governorReached: true,
      authoritativeStateReached: true,
      partialGovernorLedgerPresent: true
    });
    assert.equal(result.failureClass, "EVIDENCE_QUALITY_FAILURE");
    assert.equal(result.cognitiveEntryAuthorized, true);
  });
});

test("complete causal lifecycle qualifies, transfers, rolls back, and refuses reuse", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-causal-lifecycle-"));
  const networkGuard = installHardNetworkDenial();
  try {
    const f = await fixture(root);
    await t.test("candidate is inert in ordinary before arms", () => {
      assert.deepEqual(f.marking.before.authority.memoryContext.selectedMemoryIds, []);
      assert.deepEqual(f.configuration.before.authority.memoryContext.selectedMemoryIds, []);
    });
    await t.test("marking trial is explicitly selected and applied", () => {
      assert.deepEqual(f.marking.after.attribution.trialSelectedCandidateIds, [f.candidate.memoryId]);
      assert.deepEqual(f.marking.after.attribution.trialAppliedCandidateIds, [f.candidate.memoryId]);
    });
    await t.test("materially different configuration shares process applicability", () => {
      assert.equal(f.configuration.after.attribution.applicabilityClassification, GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE);
      assert.equal(f.configuration.after.attribution.candidateMemoryId, f.candidate.memoryId);
    });
    await t.test("clear control selects and applies nothing", () => {
      assert.deepEqual(f.clearAfter.authority.runtime.authoritativeMemoryTransition.selectedMemoryIds, []);
      assert.deepEqual(f.clearAfter.authority.runtime.authoritativeMemoryTransition.trialAppliedCandidateIds, []);
    });
    await t.test("ordinary control variation receives zero causal credit", () => {
      const control = f.qualification.causal_trial_results.find((item) => item.trialRole === "NON_APPLICABLE_CONTROL");
      assert.equal(control.rawImprovement, 0.15);
      assert.equal(control.attributableImprovement, 0);
      assert.equal(control.controlIntegrity, true);
    });
    await t.test("complete chains qualify", () => {
      assert.equal(f.qualification.verdict, "PASS");
      assert.equal(f.qualification.reasons.length, 0);
    });

    const promotionAuthority = await runtime(f.adapter, { id: "promotion", sequence: 10, evidenceRisk: risk.clear });
    const promotion = await f.adapter.promoteQualifiedLesson({
      governor: promotionAuthority.governor,
      runtime: promotionAuthority.runtime,
      qualificationId: f.qualification.qualificationId,
      episodeId: "promotion",
      episodeSequence: 10,
      createdAt: fixedTime
    });
    await t.test("qualification promotes one lesson", async () => {
      assert.equal(promotion.result, "LESSON_PROMOTED");
      assert.equal((await f.adapter.status()).promotedLessons, 1);
    });
    await t.test("the same qualification cannot promote twice", async () => {
      const duplicateAuthority = await runtime(f.adapter, { id: "duplicate-promotion", sequence: 11, evidenceRisk: risk.clear });
      await assert.rejects(f.adapter.promoteQualifiedLesson({
        governor: duplicateAuthority.governor,
        runtime: duplicateAuthority.runtime,
        qualificationId: f.qualification.qualificationId,
        episodeId: "duplicate-promotion",
        episodeSequence: 11,
        createdAt: fixedTime
      }), (error) => error.code === "QUALIFICATION_ALREADY_PROMOTED");
    });

    const novel = await runtime(f.adapter, { id: "novel-process", sequence: 11, evidenceRisk: risk.unsupportedQuery, novel: true });
    await t.test("novel object identity does not suppress applicable process transfer", () => {
      assert.deepEqual(novel.runtime.authoritativeMemoryTransition.appliedLessonIds, [promotion.lessonId]);
    });
    await t.test("product status is derived only from the authoritative transition", () => {
      const providerClaims = ["APPLICABLE", "NOT_APPLICABLE", "ROLLED_BACK"];
      const statuses = providerClaims.map(() => buildProductGovernedLearningProjection(novel.runtime).memoryStatus);
      assert.deepEqual(statuses, ["RETRIEVED_APPLIED", "RETRIEVED_APPLIED", "RETRIEVED_APPLIED"]);
      assert.equal(statuses[0], novel.runtime.authoritativeMemoryTransition.memoryStatus);
    });
    const insufficient = await runtime(f.adapter, { id: "insufficient", sequence: 11, evidenceRisk: risk.categoryOnly, insufficient: true });
    await t.test("sparse comparable evidence applies zero lessons", () => {
      assert.deepEqual(insufficient.runtime.authoritativeMemoryTransition.appliedLessonIds, []);
      assert.equal(insufficient.runtime.authoritativeMemoryTransition.nonReuseDecision, GOVERNED_RESEARCH_APPLICABILITY.SPARSE_EVIDENCE);
    });
    const clear = await runtime(f.adapter, { id: "later-clear", sequence: 11, evidenceRisk: risk.clear });
    await t.test("clear boundary defeats similarity and forged caller signals", () => {
      assert.deepEqual(clear.memoryContext.selectedMemoryIds, []);
    });
    await t.test("replayed retrieval authority fails under another Governor", () => {
      assert.throws(() => runCanonicalCognitiveRuntime({
        governor: createCognitiveGovernor({ evaluationId: "replay" }),
        snapshot: snapshot("replay"),
        executiveMemoryContext: novel.memoryContext
      }), (error) => error instanceof GovernedLearningError
        && error.code === "AUTHORITATIVE_MEMORY_RETRIEVAL_DECISION_UNREGISTERED");
    });

    const transferAuthority = await runtime(f.adapter, {
      id: "transfer-after",
      sequence: 11,
      evidenceRisk: risk.sparseLadder,
      preHash: f.configuration.before.authority.preHash
    });
    const transfer = await strategyOutcome(f.adapter, transferAuthority, {
      planBefore: f.configuration.before.planHash,
      planAfter: digest("heldout-corrected"),
      afterState: digest("heldout-after")
    });
    const transferRefs = causalRefs(transfer.attribution);
    const retained = await f.adapter.recordApplication({
      governor: transferAuthority.governor,
      runtime: transferAuthority.runtime,
      lessonId: promotion.lessonId,
      caseId: "causal-heldout",
      episodeId: transfer.recorded.episode_id,
      beforeEpisodeId: f.configuration.before.episode_id,
      afterEpisodeId: transfer.recorded.episode_id,
      beforeResponseHash: f.configuration.before.responseHash,
      afterResponseHash: transfer.recorded.responseHash,
      causalAttribution: transfer.attribution,
      episodeSequence: 12,
      beforeScore: 0.4,
      afterScore: 0.8,
      beforeViolations: 1,
      afterViolations: 0,
      evidenceRefs: transferRefs,
      visibleEvidenceIds: transferRefs,
      createdAt: fixedTime
    });
    await t.test("authorized held-out transfer is retained", () => {
      assert.equal(retained.result, "LESSON_RETAINED");
      assert.equal(retained.improvement, 0.4);
    });

    const harmfulAuthority = await runtime(f.adapter, {
      id: "harmful-after",
      sequence: 13,
      evidenceRisk: risk.unsupportedQuery,
      preHash: f.marking.before.authority.preHash
    });
    const harmful = await strategyOutcome(f.adapter, harmfulAuthority, {
      planBefore: f.marking.before.planHash,
      planAfter: digest("harmful-changed"),
      afterState: digest("harmful-after")
    });
    const harmfulRefs = causalRefs(harmful.attribution);
    const rollback = await f.adapter.recordApplication({
      governor: harmfulAuthority.governor,
      runtime: harmfulAuthority.runtime,
      lessonId: promotion.lessonId,
      caseId: "causal-harmful",
      episodeId: harmful.recorded.episode_id,
      beforeEpisodeId: f.marking.before.episode_id,
      afterEpisodeId: harmful.recorded.episode_id,
      beforeResponseHash: f.marking.before.responseHash,
      afterResponseHash: harmful.recorded.responseHash,
      causalAttribution: harmful.attribution,
      episodeSequence: 14,
      beforeScore: 0.8,
      afterScore: 0.5,
      beforeViolations: 0,
      afterViolations: 1,
      evidenceRefs: harmfulRefs,
      visibleEvidenceIds: harmfulRefs,
      createdAt: fixedTime
    });
    await t.test("harmful application rolls back", () => {
      assert.equal(rollback.result, "LESSON_ROLLED_BACK");
    });

    const refusalGovernor = createCognitiveGovernor({ evaluationId: "refusal-one" });
    const refusal = await f.adapter.prepareEpisode({
      governor: refusalGovernor,
      episodeId: "refusal-one",
      episodeSequence: 15,
      queryFacets: { researchEvidenceRisk: risk.unsupportedQuery, frozenPreInterventionStateHash: digest("refusal-one") },
      queryText: "attempted later reuse",
      createdAt: fixedTime
    });
    await t.test("rollback yields ledger-bound refusal", () => {
      assert.deepEqual(refusal.selectedMemoryIds, []);
      assert.equal(refusal.retrievalDecision.rollbackRefusals.length, 1);
    });
    const restarted = new GovernedLearningAdapter({ root, learningScopeIdentity: "neutral-learning-scope" });
    const restartGovernor = createCognitiveGovernor({ evaluationId: "refusal-two" });
    const restartRefusal = await restarted.prepareEpisode({
      governor: restartGovernor,
      episodeId: "refusal-two",
      episodeSequence: 16,
      queryFacets: { researchEvidenceRisk: risk.sparseLadder, frozenPreInterventionStateHash: digest("refusal-two") },
      queryText: "another attempted reuse",
      createdAt: fixedTime
    });
    await t.test("rollback refusal survives restart", async () => {
      assert.equal(restartRefusal.retrievalDecision.rollbackRefusals.length, 1);
      assert.equal((await restarted.status()).rollbackRefusals, 2);
      assert.equal((await restarted.verify()).result, "VALID");
    });
    await t.test("hard network denial recorded zero calls", () => assert.deepEqual(networkGuard.attempts, []));
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("failed qualification durably rejects candidate and zeroes noncausal movement", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-failed-causal-"));
  try {
    const f = await fixture(root, { incomplete: true });
    await t.test("missing link gets zero attributable credit", () => {
      const failed = f.qualification.causal_trial_results.find((item) => item.caseId === "neutral-configuration");
      assert.equal(failed.rawImprovement, 0.4);
      assert.equal(failed.attributableImprovement, 0);
      assert.equal(f.qualification.verdict, "FAIL");
      assert(f.qualification.reasons.includes("CAUSAL_CHAIN_INCOMPLETE"));
    });
    await t.test("FAIL creates REVOKED predecessor supersession", async () => {
      const records = await f.adapter.memoryStore.list();
      const rejected = records.find((record) => record.memoryId === f.qualification.rejectedCandidateMemoryId);
      assert.equal(rejected.status, "REVOKED");
      assert.deepEqual(rejected.predecessorMemoryIds, [f.candidate.memoryId]);
    });
    await t.test("retrial nomination is refused", async () => {
      const preHash = digest("retrial-pre");
      await assert.rejects(runtime(f.adapter, {
        id: "retrial",
        sequence: 10,
        evidenceRisk: risk.unsupportedQuery,
        preHash,
        mode: "GOVERNED_TRIAL",
        trialRequest: {
          candidateId: f.candidate.candidateId,
          beforeArmEpisodeId: "retrial-before",
          afterArmEpisodeId: "retrial",
          frozenPreInterventionStateHash: preHash,
          purpose: "ISOLATED_CAUSAL_QUALIFICATION"
        }
      }), (error) => error.code === "QUALIFICATION_TRIAL_NOMINATION_INVALID");
    });
    await t.test("rejection survives restart and ordinary retrieval", async () => {
      const restarted = new GovernedLearningAdapter({ root, learningScopeIdentity: "neutral-learning-scope" });
      const later = await runtime(restarted, { id: "after-restart", sequence: 10, evidenceRisk: risk.unsupportedQuery });
      assert.deepEqual(later.memoryContext.selectedMemoryIds, []);
      assert.equal((await restarted.status()).rejectedCandidates, 1);
      assert.equal((await restarted.verify()).result, "VALID");
    });
    await t.test("rejected candidate cannot be requalified or promoted", async () => {
      const authority = await runtime(f.adapter, { id: "rejected-lifecycle", sequence: 10, evidenceRisk: risk.clear });
      await assert.rejects(f.adapter.qualifyCandidate({
        governor: authority.governor,
        runtime: authority.runtime,
        candidateId: f.candidate.candidateId,
        trials: f.trials,
        minimumMeanImprovement: 0.1,
        minimumApplicationImprovement: 0.1,
        visibleEvidenceIds: f.trials.flatMap((trial) => trial.evidenceRefs),
        episodeSequence: 10,
        createdAt: fixedTime
      }), (error) => error.code === "CANDIDATE_NOT_FOUND");
      await assert.rejects(f.adapter.promoteQualifiedLesson({
        governor: authority.governor,
        runtime: authority.runtime,
        qualificationId: f.qualification.qualificationId,
        episodeId: "rejected-lifecycle",
        episodeSequence: 10,
        createdAt: fixedTime
      }), (error) => error.code === "QUALIFICATION_NOT_PASSING");
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("operational failures cannot be smuggled through the adapter", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-operational-"));
  try {
    const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "operational-scope" });
    const authority = await runtime(adapter, { id: "operational", sequence: 1, evidenceRisk: risk.unsupportedQuery });
    await assert.rejects(adapter.captureProductFailure({
      governor: authority.governor,
      runtime: authority.runtime,
      episodeId: "operational",
      episodeSequence: 1,
      cognitiveEpisode: { cognitiveEpisodeHash: digest("episode"), linkedExperienceRecordHash: digest("experience") },
      lessonCandidate: {
        generalizedFailureCategory: "PROVIDER_TRANSPORT_FAILURE",
        lessonCandidateHash: digest("candidate"),
        generalizedPreconditions: ["transport"],
        actionSequenceSummary: [],
        subsystem: "PROVIDER"
      },
      visibleEvidenceIds: [digest("episode"), digest("experience"), digest("candidate")],
      createdAt: fixedTime,
      captureAuthority: "EVIDENCE_BOUND_PRODUCT_FAILURE",
      failureTaxonomy: { failureClass: "PROVIDER_TRANSPORT_FAILURE", cognitiveEntryAuthorized: false }
    }), (error) => error.code === "PRODUCT_FAILURE_COGNITIVE_ENTRY_PROHIBITED");
    assert.equal((await adapter.status()).candidates, 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("forged, replayed, and reordered ledgers fail closed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-ledger-failclosed-"));
  try {
    const f = await fixture(root, { incomplete: true });
    const source = await readFile(f.adapter.paths.ledger, "utf8");
    const lines = source.trimEnd().split("\n");
    const forged = lines.map((line) => JSON.parse(line));
    forged[0].payload.episode_id = "forged";
    await writeFile(f.adapter.paths.ledger, `${forged.map(JSON.stringify).join("\n")}\n`, "utf8");
    await assert.rejects(f.adapter.verify(), (error) => error.code === "LEARNING_LEDGER_TAMPERED");
    await writeFile(f.adapter.paths.ledger, `${source}${lines.at(-1)}\n`, "utf8");
    await assert.rejects(f.adapter.verify(), (error) => error.code === "LEARNING_LEDGER_ORDER");
    const reordered = [...lines];
    [reordered[0], reordered[1]] = [reordered[1], reordered[0]];
    await writeFile(f.adapter.paths.ledger, `${reordered.join("\n")}\n`, "utf8");
    await assert.rejects(f.adapter.verify(), (error) => ["LEARNING_LEDGER_ORDER", "PRODUCT_FEEDBACK_BINDING"].includes(error.code));
    await writeFile(f.adapter.paths.ledger, source, "utf8");
    assert.equal((await f.adapter.verify()).result, "VALID");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
