import assert from "node:assert/strict";
import test from "node:test";
import {
  COGNITIVE_ACTION,
  COGNITIVE_BOUNDARY,
  COGNITIVE_REASON,
  MAX_COGNITIVE_EPISODE_BYTES,
  MAX_LESSON_CANDIDATE_BYTES,
  buildCognitiveEpisode,
  buildCustomerInputRequest,
  buildLessonCandidate,
  continueCognitiveActionOutcome,
  cognitiveEpisodeByteLength,
  createActionSignature,
  createCognitiveGovernor,
  createCognitiveState,
  createCustomerMissionContext,
  decideCognitiveAction,
  lessonCandidateByteLength,
  normalizeQueryIdentity,
  recordCognitiveActionOutcome,
  selectNextCognitiveAction
} from "../lib/cognitive-governor/index.js";

function objectMindFixture({
  imageIds = ["image-alpha"],
  exactness = "BROADER_IDENTITY",
  discriminator = "clear maker mark photograph"
} = {}) {
  return {
    schemaVersion: "1.0",
    objectStateId: "object-state-synthetic-alpha",
    identityStateHash: "a".repeat(64),
    requestIdentity: {
      analysisId: "volatile-request-id",
      purpose: "PERSONAL_BUY",
      inputImageIds: imageIds,
      inputDescriptionProvenance: { sha256: "b".repeat(64) }
    },
    observedFacts: [
      { factType: "material", value: "brushed steel", normalizedValue: "brushed steel", certaintyBand: "HIGH", origin: "DIRECTLY_VISIBLE" },
      { factType: "shape", value: "round dial", normalizedValue: "round dial", certaintyBand: "MEDIUM", origin: "DIRECTLY_VISIBLE" }
    ],
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: "candidate-alpha",
      exactCandidateLabel: "",
      broaderFamilyIdentity: "mechanical humidity gauge",
      brandOrMaker: "",
      model: "",
      variantPackageEditionDesign: "wall mount",
      exactnessLevel: "BROADER_FAMILY",
      confidenceBand: "MEDIUM",
      supportingObservationIds: ["observation-material", "observation-shape"],
      contradictingObservations: [],
      unresolvedDiscriminators: [discriminator]
    }],
    resolvedIdentity: {
      selectedCandidateId: "candidate-alpha",
      stableIdentityKey: "identity-alpha",
      exactnessClassification: exactness,
      bestSupportedCustomerIdentity: "mechanical humidity gauge",
      broaderFallbackIdentity: "humidity gauge",
      brandOrMaker: "",
      model: "",
      validatedBarcode: "",
      remainingAlternativeCandidateIds: [],
      limitations: [discriminator],
      additionalEvidenceNeeded: [discriminator]
    },
    searchPlan: [{
      queryId: "query-alpha",
      owningHypothesisId: "candidate-alpha",
      queryType: "HYPOTHESIS_DISAMBIGUATION",
      query: '"mechanical humidity gauge" "round dial"',
      discriminatorTested: discriminator,
      phase: "INITIAL"
    }],
    candidateEvidence: [],
    refinementCount: 0
  };
}

function initialRequest(overrides = {}) {
  return {
    query: '"mechanical humidity gauge" "round dial"',
    objectMindPhase: "INITIAL",
    providerEndpoint: "serper_search",
    attempted: true,
    physicalAttemptCount: 1,
    physicalRetryAttemptCount: 0,
    ...overrides
  };
}

function evidenceFixture({
  sourceId = "source-alpha",
  classification = "INSUFFICIENT_EVIDENCE",
  verification = "UNRESOLVED",
  directPageEligible = false,
  directPageVerified = false,
  sourceEvidenceText = ""
} = {}) {
  return {
    sourceRecordId: sourceId,
    objectMindSourceId: sourceId,
    objectMindHypothesisId: "candidate-alpha",
    objectMindClassification: classification,
    objectMindVerificationState: verification,
    objectMindDirectPageEligible: directPageEligible,
    objectMindDirectPageVerified: directPageVerified,
    sourceEvidenceText,
    objectMindSupportingAttributes: [{ attribute: "shape", status: "SUPPORTED" }],
    objectMindConflictingAttributes: []
  };
}

function snapshot(overrides = {}) {
  const objectMindState = overrides.objectMindState || objectMindFixture();
  return {
    evaluationId: "evaluation-synthetic-alpha",
    objectMindState,
    evidenceRecords: overrides.evidenceRecords || objectMindState.candidateEvidence || [],
    providerRequests: overrides.providerRequests || [],
    initialPlan: overrides.initialPlan || objectMindState.searchPlan,
    refinementPlan: overrides.refinementPlan || [],
    directPageCandidates: overrides.directPageCandidates || overrides.evidenceRecords || [],
    providerBudget: overrides.providerBudget || { maximum: 12, consumed: 0 },
    directPageBudget: overrides.directPageBudget || { maximum: 2, consumed: 0 },
    customerMission: overrides.customerMission || createCustomerMissionContext({ purchase_intent: "personal_use" }),
    canonicalEvidenceFinalized: Boolean(overrides.canonicalEvidenceFinalized),
    purposeJudgmentCompleted: Boolean(overrides.purposeJudgmentCompleted),
    customerInputAvailable: overrides.customerInputAvailable !== false
  };
}

test("the same Cognitive State selects the same action, reason, signature, and hash", () => {
  const first = createCognitiveState(snapshot());
  const second = createCognitiveState(snapshot());
  const firstDecision = selectNextCognitiveAction(first);
  const secondDecision = selectNextCognitiveAction(second);
  assert.deepEqual(second, first);
  assert.deepEqual(secondDecision, firstDecision);
  assert.equal(firstDecision.actionType, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE);
  assert.deepEqual(firstDecision.reasonCodes, [COGNITIVE_REASON.INITIAL_PLAN_READY]);
});

test("initial acquisition executes as one cognitive action and cannot repeat unchanged", () => {
  const governor = createCognitiveGovernor({ evaluationId: "evaluation-once" });
  const decision = decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(decision.actionType, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE);
  recordCognitiveActionOutcome(governor, decision, snapshot({
    providerRequests: [initialRequest({ physicalAttemptCount: 2, physicalRetryAttemptCount: 1 })],
    providerBudget: { maximum: 12, consumed: 2 }
  }), { outcomeCode: "INITIAL_ACQUISITION_COMPLETED" });
  assert.equal(governor.actionLedger.length, 1, "provider retry became a second cognitive action");
  const repeated = decideCognitiveAction(governor, snapshot({
    providerRequests: [initialRequest({ physicalAttemptCount: 2, physicalRetryAttemptCount: 1 })],
    providerBudget: { maximum: 12, consumed: 2 }
  }), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.notEqual(repeated.actionType, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE);
  assert.equal(repeated.executionPermitted, false);
});

test("provider fallback continuation updates the initial outcome without a second cognitive action", () => {
  const governor = createCognitiveGovernor({ evaluationId: "evaluation-fallback" });
  const decision = decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  recordCognitiveActionOutcome(governor, decision, snapshot({
    providerRequests: [initialRequest({ succeeded: false })]
  }), { outcomeCode: "INITIAL_ACQUISITION_NO_RESULT" });
  continueCognitiveActionOutcome(
    governor,
    COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE,
    snapshot({
      providerRequests: [
        initialRequest({ succeeded: false }),
        initialRequest({ query: "fallback query", succeeded: true })
      ],
      evidenceRecords: [evidenceFixture({ classification: "EXACT_ITEM", verification: "VERIFIED" })]
    }),
    { outcomeCode: "FALLBACK_ACQUISITION_COMPLETED" }
  );

  assert.equal(governor.actionLedger.length, 1);
  assert.equal(governor.actionLedger[0].outcomeCode, "FALLBACK_ACQUISITION_COMPLETED");
  assert.equal(governor.actionLedger[0].materialKnowledgeChanged, true);
  assert.equal(governor.actionLedger[0].outputKnowledgeStateHash, governor.lastState.knowledgeStateHash);
});

test("refinement requires a new discriminator query, remaining shared capacity, and no verified exact", () => {
  const refinementPlan = [{
    query: '"mechanical humidity gauge" "maker stamp"',
    owningHypothesisId: "candidate-alpha",
    discriminatorTested: "maker stamp",
    phase: "REFINEMENT"
  }];
  const base = snapshot({
    providerRequests: [initialRequest()],
    refinementPlan,
    providerBudget: { maximum: 12, consumed: 4 }
  });
  const decision = selectNextCognitiveAction(createCognitiveState(base), { boundary: COGNITIVE_BOUNDARY.REFINEMENT });
  assert.equal(decision.actionType, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);

  const exhausted = selectNextCognitiveAction(createCognitiveState({
    ...base,
    providerBudget: { maximum: 12, consumed: 12 }
  }), { boundary: COGNITIVE_BOUNDARY.REFINEMENT });
  assert.notEqual(exhausted.actionType, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);

  const exact = evidenceFixture({ classification: "EXACT_ITEM", verification: "VERIFIED" });
  const sufficient = selectNextCognitiveAction(createCognitiveState({ ...base, evidenceRecords: [exact] }), {
    boundary: COGNITIVE_BOUNDARY.REFINEMENT
  });
  assert.notEqual(sufficient.actionType, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);
});

test("refinement cannot execute twice and semantic query duplicates are blocked", () => {
  assert.equal(
    normalizeQueryIdentity('Find results for "round dial" mechanical humidity gauge'),
    normalizeQueryIdentity('mechanical humidity gauge round dial search')
  );
  const semanticallyAttempted = initialRequest({
    query: "maker stamp mechanical humidity gauge",
    objectMindPhase: "INITIAL"
  });
  const state = createCognitiveState(snapshot({
    providerRequests: [initialRequest(), semanticallyAttempted],
    refinementPlan: [{ query: "humidity gauge mechanical maker stamp", phase: "REFINEMENT" }]
  }));
  assert.equal(state.actionTargets.refinementPlan.length, 0);
  const decision = selectNextCognitiveAction(state, { boundary: COGNITIVE_BOUNDARY.REFINEMENT });
  assert.notEqual(decision.actionType, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);

  const governor = createCognitiveGovernor({ evaluationId: "evaluation-refine-once" });
  const refinementSnapshot = snapshot({
    providerRequests: [initialRequest()],
    refinementPlan: [{ query: "mechanical humidity gauge maker stamp", phase: "REFINEMENT" }]
  });
  const first = decideCognitiveAction(governor, refinementSnapshot, { boundary: COGNITIVE_BOUNDARY.REFINEMENT });
  recordCognitiveActionOutcome(governor, first, refinementSnapshot, { outcomeCode: "REFINEMENT_COMPLETED" });
  const second = decideCognitiveAction(governor, refinementSnapshot, { boundary: COGNITIVE_BOUNDARY.REFINEMENT });
  assert.notEqual(second.actionType, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);
});

test("qualified information-poor direct pages are selected once and remain capped at two", () => {
  const candidate = evidenceFixture({ directPageEligible: true });
  const directSnapshot = snapshot({
    evidenceRecords: [candidate],
    directPageCandidates: [candidate],
    providerRequests: [initialRequest()],
    directPageBudget: { maximum: 2, consumed: 0 }
  });
  const state = createCognitiveState(directSnapshot);
  const decision = selectNextCognitiveAction(state, { boundary: COGNITIVE_BOUNDARY.DIRECT_PAGE });
  assert.equal(decision.actionType, COGNITIVE_ACTION.VERIFY_DIRECT_PAGE);
  assert.equal(state.directPageCapacity.maximum, 2);

  const governor = createCognitiveGovernor({ evaluationId: "evaluation-direct-once" });
  const first = decideCognitiveAction(governor, directSnapshot, { boundary: COGNITIVE_BOUNDARY.DIRECT_PAGE });
  recordCognitiveActionOutcome(governor, first, directSnapshot, { outcomeCode: "DIRECT_PAGE_NO_NEW_FACT" });
  const second = decideCognitiveAction(governor, directSnapshot, { boundary: COGNITIVE_BOUNDARY.DIRECT_PAGE });
  assert.notEqual(second.actionType, COGNITIVE_ACTION.VERIFY_DIRECT_PAGE);

  const exhausted = selectNextCognitiveAction(createCognitiveState({
    ...directSnapshot,
    directPageBudget: { maximum: 2, consumed: 2 }
  }), { boundary: COGNITIVE_BOUNDARY.DIRECT_PAGE });
  assert.notEqual(exhausted.actionType, COGNITIVE_ACTION.VERIFY_DIRECT_PAGE);
});

test("a specific missing discriminator creates a structured, non-vague customer request", () => {
  const state = createCognitiveState(snapshot({ providerRequests: [initialRequest()] }));
  const request = buildCustomerInputRequest(state);
  assert.equal(request.requestType, "MAKER_MARK");
  assert.match(request.whyItMatters, /distinguish/i);
  assert.match(request.requestedDetail, /photograph/i);
  assert.match(request.whyProviderActionNotUseful, /no unused legal provider action/i);
  assert.doesNotMatch(JSON.stringify(request), /send more information/i);
  const decision = selectNextCognitiveAction(state, { boundary: COGNITIVE_BOUNDARY.CUSTOMER_INPUT });
  assert.equal(decision.actionType, COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT);
});

test("verified evidence finalizes before consuming every request and purpose follows finalization", () => {
  const exact = evidenceFixture({ classification: "EXACT_ITEM", verification: "VERIFIED" });
  const state = createCognitiveState(snapshot({
    evidenceRecords: [exact],
    providerRequests: [initialRequest()],
    providerBudget: { maximum: 12, consumed: 1 }
  }));
  assert.equal(selectNextCognitiveAction(state).actionType, COGNITIVE_ACTION.FINALIZE_EVIDENCE);

  const finalized = createCognitiveState(snapshot({
    evidenceRecords: [exact],
    providerRequests: [initialRequest()],
    canonicalEvidenceFinalized: true
  }));
  assert.equal(
    selectNextCognitiveAction(finalized, { boundary: COGNITIVE_BOUNDARY.PURPOSE_JUDGMENT }).actionType,
    COGNITIVE_ACTION.PROCEED_TO_PURPOSE_JUDGMENT
  );
});

test("no useful remaining action stops insufficiently and completed purpose stops complete", () => {
  const insufficient = createCognitiveState(snapshot({
    providerRequests: [initialRequest()],
    canonicalEvidenceFinalized: true,
    customerInputAvailable: false,
    providerBudget: { maximum: 12, consumed: 12 },
    directPageBudget: { maximum: 2, consumed: 2 }
  }));
  assert.equal(
    selectNextCognitiveAction(insufficient, { boundary: COGNITIVE_BOUNDARY.TERMINAL }).actionType,
    COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE
  );
  const complete = createCognitiveState(snapshot({
    providerRequests: [initialRequest()],
    canonicalEvidenceFinalized: true,
    purposeJudgmentCompleted: true
  }));
  assert.equal(
    selectNextCognitiveAction(complete, { boundary: COGNITIVE_BOUNDARY.TERMINAL }).actionType,
    COGNITIVE_ACTION.STOP_COMPLETE
  );
});

test("a repeated knowledge/legal-state combination triggers bounded cycle prevention", () => {
  const governor = createCognitiveGovernor({ evaluationId: "evaluation-cycle" });
  const first = decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(first.executionPermitted, true);
  const repeated = decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(repeated.executionPermitted, false);
  assert.equal(repeated.actionType, COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE);
  assert(repeated.reasonCodes.includes(COGNITIVE_REASON.CYCLE_DETECTED));
  assert.equal(governor.cycleDetections.length, 1);
});

test("volatile execution fields, budgets, and equivalent ordering do not create material knowledge", () => {
  const original = objectMindFixture();
  const reordered = {
    ...structuredClone(original),
    requestIdentity: { ...original.requestIdentity, analysisId: "different-request-id", purpose: "RESALE" },
    observedFacts: [...original.observedFacts].reverse(),
    identityHypotheses: [...original.identityHypotheses].reverse()
  };
  const evidence = [
    evidenceFixture({ sourceId: "source-one" }),
    evidenceFixture({ sourceId: "source-two", classification: "COMPATIBLE_ALTERNATIVE", verification: "COMPATIBLE" })
  ];
  const first = createCognitiveState(snapshot({
    objectMindState: original,
    evidenceRecords: evidence,
    providerBudget: { maximum: 12, consumed: 1 }
  }));
  const second = createCognitiveState(snapshot({
    objectMindState: reordered,
    evidenceRecords: [...evidence].reverse(),
    providerBudget: { maximum: 12, consumed: 9 }
  }));
  assert.equal(first.knowledgeStateHash, second.knowledgeStateHash);
  assert.notEqual(first.cognitiveStateHash, second.cognitiveStateHash, "execution budget should remain visible in Cognitive State");
});

test("new object facts change knowledge while customer purpose cannot change identity/evidence action selection", () => {
  const personal = createCognitiveState(snapshot({ customerMission: createCustomerMissionContext({ purpose: "PERSONAL_BUY" }) }));
  const resale = createCognitiveState(snapshot({ customerMission: createCustomerMissionContext({ purpose: "RESALE" }) }));
  assert.equal(personal.knowledgeStateHash, resale.knowledgeStateHash);
  const personalDecision = selectNextCognitiveAction(personal, { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  const resaleDecision = selectNextCognitiveAction(resale, { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(personalDecision.actionType, resaleDecision.actionType);
  assert.equal(personalDecision.actionSignature, resaleDecision.actionSignature);

  const newPhoto = createCognitiveState(snapshot({ objectMindState: objectMindFixture({ imageIds: ["image-alpha", "image-new"] }) }));
  assert.notEqual(personal.knowledgeStateHash, newPhoto.knowledgeStateHash);
  assert.notEqual(createActionSignature(personal, personalDecision), createActionSignature(newPhoto, personalDecision));
});

test("the Governor references Object Mind and evidence but owns neither exactness nor canonical selection", () => {
  const state = createCognitiveState(snapshot());
  assert.equal(state.objectMindStateId, "object-state-synthetic-alpha");
  assert.equal(state.objectMindSemanticHash, "a".repeat(64));
  assert.equal("canonicalCustomerEvidence" in state, false);
  assert.equal("exactnessClassification" in state, false);
  assert.equal("customerEligible" in state, false);
  assert(Object.values(COGNITIVE_ACTION).includes(selectNextCognitiveAction(state).actionType));
});

test("Cognitive Episodes are deterministic, bounded, linked, and preserve action lineage", () => {
  const buildGovernor = () => {
    const governor = createCognitiveGovernor({ evaluationId: "evaluation-episode" });
    const decision = decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
    recordCognitiveActionOutcome(governor, decision, snapshot({ providerRequests: [initialRequest()] }), {
      outcomeCode: "INITIAL_ACQUISITION_COMPLETED"
    });
    return governor;
  };
  const first = buildCognitiveEpisode(buildGovernor(), { experienceRecordHash: "e".repeat(64) });
  const second = buildCognitiveEpisode(buildGovernor(), { experienceRecordHash: "e".repeat(64) });
  assert.deepEqual(second, first);
  assert.equal(first.linkedExperienceRecordHash, "e".repeat(64));
  assert.equal(first.actionDecisions.length, 1);
  assert.match(first.cognitiveEpisodeHash, /^[a-f0-9]{64}$/);
  assert(cognitiveEpisodeByteLength(first) <= MAX_COGNITIVE_EPISODE_BYTES);
});

test("terminal limitation emits at most one inert UNVALIDATED Lesson Candidate", () => {
  const governor = createCognitiveGovernor({ evaluationId: "evaluation-lesson" });
  decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  const episode = buildCognitiveEpisode(governor);
  const lesson = buildLessonCandidate(episode);
  assert(lesson);
  assert.equal(lesson.status, "UNVALIDATED");
  assert.equal(lesson.supportingEpisodeCount, 1);
  assert.equal(lesson.generalizationRequired, true);
  assert.equal(lesson.promotionAuthorized, false);
  assert.equal("policyChange" in lesson, false);
  assert.equal("promptChange" in lesson, false);
  assert.equal("sourceRankingChange" in lesson, false);
  assert.equal("exactnessChange" in lesson, false);
  assert.match(lesson.lessonCandidateHash, /^[a-f0-9]{64}$/);
  assert(lessonCandidateByteLength(lesson) <= MAX_LESSON_CANDIDATE_BYTES);
  assert.equal(Array.isArray(lesson) ? lesson.length : 1, 1);
});

test("Lesson Candidate identity excludes customer names, object answers, URLs, and mutable policy", () => {
  const governor = createCognitiveGovernor({
    evaluationId: "evaluation-private",
    customerMission: createCustomerMissionContext({
      purpose: "RESALE",
      intendedRecipient: "Private Customer Name",
      preferredChannel: "https://private.example/item"
    })
  });
  decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  decideCognitiveAction(governor, snapshot(), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  const lesson = buildLessonCandidate(buildCognitiveEpisode(governor));
  const serialized = JSON.stringify(lesson);
  assert.doesNotMatch(serialized, /Private Customer Name|private\.example|mechanical humidity gauge/i);
  assert.doesNotMatch(serialized, /promotionAuthorized":true|ACTIVE|PROMOTED/i);
});
