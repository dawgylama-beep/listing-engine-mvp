import assert from "node:assert/strict";
import test from "node:test";
import {
  COGNITIVE_ACTION,
  COGNITIVE_BOUNDARY,
  bindGovernorProviderRequest,
  createCognitiveGovernor,
  createCustomerMissionContext,
  decideCognitiveAction,
  executeGovernorAuthorizedAction,
  executeGovernorAuthorizedChildOperation,
  recordCognitiveActionOutcome
} from "../lib/cognitive-governor/index.js";

function objectMind() {
  return {
    objectStateId: "object-state-authorization",
    identityStateHash: "a".repeat(64),
    requestIdentity: { analysisId: "evaluation-authorization", inputImageIds: ["image-a"] },
    observedFacts: [{ factType: "shape", normalizedValue: "round", certaintyBand: "HIGH", origin: "DIRECTLY_VISIBLE" }],
    observationConflicts: [],
    identityHypotheses: [{ candidateId: "candidate-a", broaderFamilyIdentity: "round object", unresolvedDiscriminators: ["maker mark"] }],
    resolvedIdentity: {
      selectedCandidateId: "candidate-a",
      stableIdentityKey: "identity-a",
      exactnessClassification: "BROADER_IDENTITY",
      bestSupportedCustomerIdentity: "round object",
      limitations: ["maker mark"],
      additionalEvidenceNeeded: ["maker mark"]
    },
    searchPlan: [{ queryId: "query-a", owningHypothesisId: "candidate-a", query: "round object maker mark", discriminatorTested: "maker mark", phase: "INITIAL" }],
    candidateEvidence: [],
    refinementCount: 0
  };
}

function snapshot(overrides = {}) {
  const state = overrides.objectMindState || objectMind();
  return {
    evaluationId: overrides.evaluationId || "evaluation-authorization",
    customerMission: createCustomerMissionContext({ purchase_intent: "personal_use" }),
    objectMindState: state,
    evidenceRecords: overrides.evidenceRecords || [],
    providerRequests: overrides.providerRequests || [],
    initialPlan: overrides.initialPlan || state.searchPlan,
    refinementPlan: overrides.refinementPlan || [],
    directPageCandidates: overrides.directPageCandidates || [],
    providerBudget: overrides.providerBudget || { maximum: 12, consumed: 0 },
    directPageBudget: overrides.directPageBudget || { maximum: 2, consumed: 0 },
    canonicalEvidenceFinalized: Boolean(overrides.canonicalEvidenceFinalized),
    purposeJudgmentCompleted: Boolean(overrides.purposeJudgmentCompleted),
    customerInputAvailable: overrides.customerInputAvailable !== false
  };
}

function initialDecision(evaluationId = "evaluation-authorization") {
  const governor = createCognitiveGovernor({ evaluationId });
  const decision = decideCognitiveAction(governor, snapshot({ evaluationId }), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  return { governor, decision };
}

test("canonical ledger counts one Governor, one authoritative state, and every decision invocation", () => {
  const { governor, decision } = initialDecision();
  assert.equal(governor.executionLedger.governorConstructionEvents.length, 1);
  assert.equal(governor.executionLedger.authoritativeCognitiveStateEvents.length, 1);
  assert.equal(governor.executionLedger.decisionInvocations.length, 1);
  recordCognitiveActionOutcome(governor, decision, snapshot({ providerRequests: [{ physicalAttemptCount: 1 }] }));
  const stopped = decideCognitiveAction(governor, snapshot({ providerRequests: [{ physicalAttemptCount: 1 }], providerBudget: { maximum: 1, consumed: 1 }, customerInputAvailable: false }), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(stopped.executionPermitted, false);
  assert.ok(stopped.actionType.startsWith("STOP_"));
  assert.equal(governor.executionLedger.decisionInvocations.length, 2);
  assert.equal(governor.executionLedger.decisionInvocations[1].selectedButNonexecutedTerminal, true);
});

test("missing and mismatched authorization blocks every controlled action class", () => {
  const { governor, decision } = initialDecision();
  const controlled = [
    COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE,
    COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH,
    COGNITIVE_ACTION.VERIFY_DIRECT_PAGE,
    COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT,
    COGNITIVE_ACTION.FINALIZE_EVIDENCE,
    COGNITIVE_ACTION.PROCEED_TO_PURPOSE_JUDGMENT,
    COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE,
    COGNITIVE_ACTION.STOP_COMPLETE
  ];
  for (const actionType of controlled) {
    assert.throws(() => executeGovernorAuthorizedAction(governor, null, actionType, { operation: () => assert.fail("operation executed") }), /authorization rejected/);
  }
  for (const actionType of controlled.filter((value) => value !== decision.actionType)) {
    assert.throws(() => executeGovernorAuthorizedAction(governor, decision, actionType, { operation: () => assert.fail("operation executed") }), /ACTION_TYPE_MISMATCH/);
  }
  assert.equal(governor.executionLedger.unauthorizedExecutionAttempts.length, 15);
});

test("foreign signatures and illegal signature reuse are rejected before execution", () => {
  const first = initialDecision("evaluation-authorization");
  const second = initialDecision("evaluation-foreign");
  assert.throws(() => executeGovernorAuthorizedAction(first.governor, second.decision, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, { operation: () => assert.fail("foreign operation executed") }), /WRONG_EVALUATION/);
  let executions = 0;
  executeGovernorAuthorizedAction(first.governor, first.decision, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, { operation: () => { executions += 1; } });
  assert.throws(() => executeGovernorAuthorizedAction(first.governor, first.decision, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, { operation: () => { executions += 1; } }), /ILLEGAL_SIGNATURE_REUSE/);
  assert.equal(executions, 1);
});

test("limited recovery fails closed without an eligible parent and inherits an acquisition or refinement signature", () => {
  const { governor, decision } = initialDecision();
  assert.throws(() => executeGovernorAuthorizedChildOperation(governor, null, {
    operationPhase: "LIMITED_RESULT_RECOVERY",
    eligibleParentActionTypes: [COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH],
    operation: () => assert.fail("recovery executed")
  }), /CHILD_PARENT_AUTHORIZATION_MISSING/);
  let parentAuthorization;
  executeGovernorAuthorizedAction(governor, decision, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, {
    operation: (authorization) => { parentAuthorization = authorization; }
  });
  let childAuthorization;
  executeGovernorAuthorizedChildOperation(governor, parentAuthorization, {
    operationPhase: "LIMITED_RESULT_RECOVERY",
    eligibleParentActionTypes: [COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH],
    operation: (authorization) => { childAuthorization = authorization; }
  });
  assert.equal(childAuthorization.actionSignature, decision.actionSignature);
  assert.equal(childAuthorization.parentExecutionEventIdentity, parentAuthorization.executionEventIdentity);

  const refinementGovernor = createCognitiveGovernor({ evaluationId: "evaluation-refinement-parent" });
  const refinementBase = snapshot({ evaluationId: "evaluation-refinement-parent" });
  const acquisition = decideCognitiveAction(refinementGovernor, refinementBase, { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  executeGovernorAuthorizedAction(refinementGovernor, acquisition, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, { operation: () => null });
  const attemptedRequest = { query: "initial", objectMindPhase: "INITIAL", attempted: true, physicalAttemptCount: 1 };
  recordCognitiveActionOutcome(refinementGovernor, acquisition, snapshot({
    evaluationId: "evaluation-refinement-parent",
    providerRequests: [attemptedRequest],
    providerBudget: { maximum: 12, consumed: 1 }
  }));
  const refinementSnapshot = snapshot({
    evaluationId: "evaluation-refinement-parent",
    providerRequests: [attemptedRequest],
    providerBudget: { maximum: 12, consumed: 1 },
    refinementPlan: [{ queryId: "refine-a", query: "round object exact maker mark", discriminatorTested: "maker mark" }]
  });
  const refinement = decideCognitiveAction(refinementGovernor, refinementSnapshot, { boundary: COGNITIVE_BOUNDARY.REFINEMENT });
  assert.equal(refinement.actionType, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);
  let refinementAuthorization;
  executeGovernorAuthorizedAction(refinementGovernor, refinement, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH, {
    operation: (authorization) => { refinementAuthorization = authorization; }
  });
  let refinementChild;
  executeGovernorAuthorizedChildOperation(refinementGovernor, refinementAuthorization, {
    operationPhase: "LIMITED_RESULT_RECOVERY",
    eligibleParentActionTypes: [COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH],
    operation: (authorization) => { refinementChild = authorization; }
  });
  assert.equal(refinementChild.actionSignature, refinement.actionSignature);
});

test("multiple provider requests and retries remain children of one cognitive action", () => {
  const { governor, decision } = initialDecision();
  executeGovernorAuthorizedAction(governor, decision, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, {
    operation: (authorization) => {
      const first = { query: "one", providerEndpoint: "serper", physicalAttemptCount: 2, physicalRetryAttemptCount: 1, physicalAttempts: [{ attempt: 1, retry: false }, { attempt: 2, retry: true }] };
      const second = { query: "two", providerEndpoint: "serper", physicalAttemptCount: 1, physicalRetryAttemptCount: 0, physicalAttempts: [{ attempt: 1, retry: false }] };
      bindGovernorProviderRequest(governor, authorization, first);
      bindGovernorProviderRequest(governor, authorization, second);
      assert.equal(first.parentGovernorActionSignature, decision.actionSignature);
      assert.equal(second.parentGovernorActionSignature, decision.actionSignature);
    }
  });
  assert.equal(governor.executionLedger.decisionInvocations.length, 1);
  assert.equal(governor.executionLedger.controlledExecutionEvents.length, 1);
  assert.equal(governor.executionLedger.providerRequestOwnership.length, 2);
  assert.equal(governor.executionLedger.unauthorizedExecutionAttempts.length, 0);
});
