import {
  cleanObjectText,
  normalizeObjectText,
  sha256Object,
  stableInternalId
} from "../object-intelligence/stable.js";
import {
  COGNITIVE_ACTION,
  COGNITIVE_BOUNDARY,
  COGNITIVE_GOVERNOR_SCHEMA_VERSION,
  COGNITIVE_REASON,
  CUSTOMER_INPUT_STATUS,
  MAX_COGNITIVE_ACTIONS
} from "./constants.js";
import {
  classifyCustomerFactRequest,
  createCognitiveState,
  requestedFieldsForType,
  withCognitiveDecision
} from "./state.js";
import {
  createGovernorExecutionLedger,
  recordGovernorConstruction,
  recordGovernorDecisionInvocation,
  registerAuthoritativeCognitiveState,
  updateGovernorDecisionOutcome
} from "./authorization.js";

export function buildCustomerInputRequest(state = {}) {
  if (![CUSTOMER_INPUT_STATUS.REQUIRED_NOT_REQUESTED].includes(state.customerInputState?.status)) return null;
  const missingDiscriminator = state.unresolvedIdentityDiscriminators?.[0] || "";
  const safetyFields = state.safetyState?.resolutionCustomerFactUseful
    ? state.safetyState.requestedFields || []
    : [];
  const requestType = safetyFields.length
    ? "CONDITION_DETAIL"
    : state.customerInputState?.requestType || classifyCustomerFactRequest(missingDiscriminator);
  if (!requestType) return null;
  const templates = {
    MAKER_MARK: ["A maker's mark can distinguish the active identity hypotheses.", "Provide a clear close photograph of the maker's mark, stamp, logo, or signature."],
    MODEL_OR_CATALOG_NUMBER: ["A model or catalog number can distinguish the active identity hypotheses.", "Provide the exact visible model, catalog, style, item, or SKU number."],
    BARCODE: ["A barcode can establish a precise retail identity when its digits are readable.", "Provide a close photograph of the barcode or type the complete digit sequence."],
    DIMENSIONS: ["Dimensions can distinguish otherwise similar sizes or variants.", "Provide the relevant height, width, length, or diameter measurement."],
    PACKAGE_CONFIGURATION: ["Quantity and package configuration can distinguish materially different variants.", "Provide the piece count, package quantity, or configuration shown on the object."],
    MATERIAL_OR_COMPONENT: ["Material or component construction can distinguish the active identity hypotheses.", "Provide a close photograph or factual description of the material or component detail."],
    CONDITION_DETAIL: ["A condition or completeness view can resolve whether the candidate evidence applies safely.", "Provide a clear photograph of the damage, wear, missing part, or condition detail."],
    CLEARER_PHOTOGRAPH: ["The identified missing discriminator requires clearer visible object evidence.", "Provide a closer, well-lit photograph of the specific unresolved feature."]
  };
  const [defaultWhy, defaultDetail] = templates[requestType];
  const whyItMatters = safetyFields.length
    ? "A specific safety detail is required to determine whether ordinary use or commercial advice is responsible."
    : defaultWhy;
  const requestedDetail = safetyFields.length
    ? `Provide a clear close photograph or factual detail for: ${safetyFields.join(", ").replaceAll("_", " ")}.`
    : defaultDetail;
  const requestedFields = safetyFields.length ? safetyFields : requestedFieldsForType(requestType);
  return {
    requestType,
    requestedFields,
    missingDiscriminatorIdentity: stableInternalId("discriminator", [
      normalizeObjectText(missingDiscriminator),
      requestedFields
    ], 16),
    whyItMatters,
    requestedDetail,
    whyProviderActionNotUseful: "No unused legal provider action currently targets this missing discriminator more directly."
  };
}

function actionCandidate(actionType, targetIdentity, reasonCodes, expectedInformationTarget, parameters = {}) {
  return {
    actionType,
    targetIdentity: cleanObjectText(targetIdentity, 100),
    reasonCodes,
    expectedInformationTarget,
    normalizedParameters: parameters
  };
}

function legalCandidates(state = {}) {
  const legal = [];
  if (!state.initialAcquisitionExecuted && state.providerCapacity.remaining > 0 && state.actionTargets.initialPlanIdentity) {
    legal.push(actionCandidate(
      COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE,
      state.actionTargets.initialPlanIdentity,
      [COGNITIVE_REASON.INITIAL_PLAN_READY],
      "INITIAL_IDENTITY_EVIDENCE"
    ));
  }
  if (state.actionTargets.directPageCandidates.length && state.directPageCapacity.remaining > 0) {
    const candidate = state.actionTargets.directPageCandidates[0];
    legal.push(actionCandidate(
      COGNITIVE_ACTION.VERIFY_DIRECT_PAGE,
      candidate.targetIdentity,
      [COGNITIVE_REASON.QUALIFIED_DIRECT_PAGE_CAN_RESOLVE_FACTS],
      "CANDIDATE_PAGE_IDENTITY_FACTS",
      { candidateIdentity: candidate.targetIdentity }
    ));
  }
  if (
    state.initialAcquisitionExecuted
    && !state.refinementExecuted
    && state.evidenceStateSummary.verifiedExactEvidence === 0
    && state.providerCapacity.remaining > 0
    && state.actionTargets.refinementPlan.length
  ) {
    const target = state.actionTargets.refinementPlan[0];
    legal.push(actionCandidate(
      COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH,
      target.targetIdentity,
      [COGNITIVE_REASON.MATERIAL_REFINEMENT_AVAILABLE],
      "MISSING_IDENTITY_DISCRIMINATOR",
      { queryIdentity: target.queryIdentity, discriminatorIdentity: target.discriminatorIdentity }
    ));
  }
  const customerRequest = buildCustomerInputRequest(state);
  if (
    state.initialAcquisitionExecuted
    && state.customerInputState?.status === CUSTOMER_INPUT_STATUS.REQUIRED_NOT_REQUESTED
    && !state.customerInputAlreadyRequested
    && customerRequest
  ) {
    legal.push(actionCandidate(
      COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT,
      customerRequest.missingDiscriminatorIdentity,
      [COGNITIVE_REASON.SPECIFIC_CUSTOMER_FACT_MORE_USEFUL],
      customerRequest.requestType,
      customerRequest
    ));
  }
  if (!state.canonicalEvidenceFinalized && state.executiveReadiness?.finalizationEligible) {
    legal.push(actionCandidate(
      COGNITIVE_ACTION.FINALIZE_EVIDENCE,
      state.actionTargets.finalEvidenceIdentity,
      state.evidenceStateSummary.verifiedExactEvidence > 0
        ? [COGNITIVE_REASON.VERIFIED_EXACT_EVIDENCE_SUFFICIENT]
        : [COGNITIVE_REASON.NO_POSITIVE_EVIDENCE_ACTION_REMAINS],
      "CANONICAL_EVIDENCE_RESULT"
    ));
  }
  if (state.canonicalEvidenceFinalized && !state.purposeJudgmentCompleted && state.executiveReadiness?.purposeJudgmentAllowed) {
    legal.push(actionCandidate(
      COGNITIVE_ACTION.PROCEED_TO_PURPOSE_JUDGMENT,
      stableInternalId("mission", state.customerMission, 18),
      [COGNITIVE_REASON.CANONICAL_EVIDENCE_READY, COGNITIVE_REASON.PURPOSE_JUDGMENT_READY],
      "DOWNSTREAM_CUSTOMER_JUDGMENT",
      { missionPurpose: state.customerMission.purpose }
    ));
  }
  if (state.executiveReadiness?.stopCompleteEligible) {
    legal.push(actionCandidate(
      COGNITIVE_ACTION.STOP_COMPLETE,
      state.actionTargets.finalEvidenceIdentity,
      state.executiveReadiness.stopCompleteReasonCodes,
      state.executiveReadiness.stopCompleteMode === "SAFETY_ONLY" ? "TERMINAL_SAFETY_ONLY_COMPLETE" : "TERMINAL_COMPLETE"
    ));
  }
  if (state.executiveReadiness?.stopInsufficientEvidenceEligible) {
    legal.push(actionCandidate(
      COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE,
      state.actionTargets.finalEvidenceIdentity,
      state.executiveReadiness.stopInsufficientReasonCodes,
      "TERMINAL_INSUFFICIENT_EVIDENCE"
    ));
  }
  return legal;
}

function preferredOrder(boundary) {
  const map = {
    [COGNITIVE_BOUNDARY.INITIAL_ACQUISITION]: [COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE],
    [COGNITIVE_BOUNDARY.REFINEMENT]: [COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH],
    [COGNITIVE_BOUNDARY.DIRECT_PAGE]: [COGNITIVE_ACTION.VERIFY_DIRECT_PAGE],
    [COGNITIVE_BOUNDARY.CUSTOMER_INPUT]: [COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT],
    [COGNITIVE_BOUNDARY.FINALIZATION]: [COGNITIVE_ACTION.FINALIZE_EVIDENCE],
    [COGNITIVE_BOUNDARY.PURPOSE_JUDGMENT]: [COGNITIVE_ACTION.PROCEED_TO_PURPOSE_JUDGMENT],
    [COGNITIVE_BOUNDARY.TERMINAL]: [COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE, COGNITIVE_ACTION.STOP_COMPLETE]
  };
  return map[boundary] || [
    COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE,
    COGNITIVE_ACTION.FINALIZE_EVIDENCE,
    COGNITIVE_ACTION.VERIFY_DIRECT_PAGE,
    COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH,
    COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT,
    COGNITIVE_ACTION.PROCEED_TO_PURPOSE_JUDGMENT,
    COGNITIVE_ACTION.STOP_COMPLETE,
    COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE
  ];
}

function fallbackStop(state = {}, reasonCodes = []) {
  const complete = state.executiveReadiness?.stopCompleteEligible === true;
  const readinessReasons = complete
    ? state.executiveReadiness.stopCompleteReasonCodes
    : state.executiveReadiness?.stopInsufficientReasonCodes;
  return actionCandidate(
    complete ? COGNITIVE_ACTION.STOP_COMPLETE : COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE,
    state.actionTargets.finalEvidenceIdentity,
    [...new Set([
      ...(reasonCodes.length ? reasonCodes : readinessReasons || []),
      ...(complete ? [] : [COGNITIVE_REASON.NO_USEFUL_KNOWLEDGE_ACTION_REMAINS])
    ])],
    complete ? "TERMINAL_COMPLETE" : "TERMINAL_INSUFFICIENT_EVIDENCE"
  );
}

export function createActionSignature(state = {}, action = {}) {
  return stableInternalId("cognitive-action", {
    actionType: action.actionType,
    knowledgeStateHash: state.knowledgeStateHash,
    targetIdentity: action.targetIdentity,
    normalizedParameters: action.normalizedParameters || {}
  }, 24);
}

export function selectNextCognitiveAction(state = {}, { boundary = COGNITIVE_BOUNDARY.AUTO } = {}) {
  const candidates = legalCandidates(state);
  const order = boundary === COGNITIVE_BOUNDARY.AUTO && state.evidenceStateSummary?.verifiedExactEvidence === 0
    ? [
        COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE,
        COGNITIVE_ACTION.VERIFY_DIRECT_PAGE,
        COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH,
        COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT,
        COGNITIVE_ACTION.FINALIZE_EVIDENCE,
        COGNITIVE_ACTION.PROCEED_TO_PURPOSE_JUDGMENT,
        COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE,
        COGNITIVE_ACTION.STOP_COMPLETE
      ]
    : preferredOrder(boundary);
  const boundaryCandidates = boundary === COGNITIVE_BOUNDARY.AUTO
    ? candidates
    : candidates.filter((record) => order.includes(record.actionType));
  const selected = order.map((actionType) => boundaryCandidates.find((record) => record.actionType === actionType)).find(Boolean)
    || fallbackStop(state, [
      state.providerCapacity.remaining <= 0 ? COGNITIVE_REASON.PROVIDER_CAPACITY_EXHAUSTED : "",
      state.directPageCapacity.remaining <= 0 ? COGNITIVE_REASON.DIRECT_PAGE_CAPACITY_EXHAUSTED : "",
      COGNITIVE_REASON.NO_POSITIVE_EVIDENCE_ACTION_REMAINS
    ].filter(Boolean));
  const legalActionSet = [...new Set(boundaryCandidates.map((record) => record.actionType))].sort();
  const actionSignature = createActionSignature(state, selected);
  const decidedState = withCognitiveDecision(state, {
    legalActionSet,
    selectedNextAction: {
      actionType: selected.actionType,
      actionSignature,
      targetIdentity: selected.targetIdentity
    },
    reasonCodes: selected.reasonCodes,
    expectedInformationTarget: selected.expectedInformationTarget,
    terminalStatus: selected.actionType.startsWith("STOP_") ? "TERMINAL" : "NONTERMINAL",
    stoppingReason: selected.actionType.startsWith("STOP_") ? selected.reasonCodes[0] : ""
  });
  return {
    ...selected,
    actionSignature,
    inputState: decidedState,
    customerInputRequest: selected.actionType === COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT
      ? selected.normalizedParameters
      : null,
    executionPermitted: !selected.actionType.startsWith("STOP_") || boundary === COGNITIVE_BOUNDARY.TERMINAL
  };
}

function cycleKeyForDecision(decision = {}) {
  const state = decision.inputState || {};
  const legalTargets = [
    state.actionTargets?.initialPlanIdentity,
    ...(state.actionTargets?.refinementPlan || []).map((record) => record.targetIdentity),
    ...(state.actionTargets?.directPageCandidates || []).map((record) => record.targetIdentity),
    state.actionTargets?.finalEvidenceIdentity
  ].filter(Boolean).sort();
  return sha256Object({
    knowledgeStateHash: state.knowledgeStateHash,
    legalActionSet: state.currentLegalActionSet,
    legalTargets,
    unresolvedDiscriminators: state.unresolvedIdentityDiscriminators
  });
}

export function createCognitiveGovernor({
  evaluationId = "",
  customerMission = {},
  executionLedger = null
} = {}) {
  const ledger = executionLedger || createGovernorExecutionLedger({ evaluationId });
  const construction = recordGovernorConstruction(ledger, { evaluationId });
  return {
    schemaVersion: COGNITIVE_GOVERNOR_SCHEMA_VERSION,
    evaluationId: cleanObjectText(evaluationId, 120),
    governorIdentity: construction.governorIdentity,
    executionLedger: ledger,
    customerMission,
    actionLedger: [],
    blockedActions: [],
    cycleDetections: [],
    seenCycleKeys: [],
    knowledgeStateHashes: [],
    requestedCustomerInput: null,
    stopDecision: null,
    lastState: null
  };
}

export function decideCognitiveAction(governor, snapshot = {}, options = {}) {
  const state = createCognitiveState({
    ...snapshot,
    evaluationId: snapshot.evaluationId || governor.evaluationId,
    customerMission: snapshot.customerMission || governor.customerMission,
    requestedCustomerInput: governor.requestedCustomerInput,
    actionLedger: governor.actionLedger,
    blockedActionSignatures: governor.blockedActions.map((record) => record.actionSignature)
  });
  registerAuthoritativeCognitiveState(governor, state);
  const decision = selectNextCognitiveAction(state, options);
  const duplicate = governor.actionLedger.some((record) => record.actionSignature === decision.actionSignature);
  const cycleKey = cycleKeyForDecision(decision);
  const cycle = governor.seenCycleKeys.includes(cycleKey);
  if (duplicate || cycle) {
    const reasonCodes = [
      duplicate ? COGNITIVE_REASON.DUPLICATE_ACTION_BLOCKED : COGNITIVE_REASON.CYCLE_DETECTED,
      COGNITIVE_REASON.NO_MATERIAL_STATE_CHANGE
    ];
    const blocked = {
      sequence: governor.blockedActions.length + 1,
      actionType: decision.actionType,
      actionSignature: decision.actionSignature,
      targetIdentity: decision.targetIdentity,
      knowledgeStateHash: decision.inputState.knowledgeStateHash,
      reasonCodes
    };
    governor.blockedActions.push(blocked);
    if (cycle) governor.cycleDetections.push({ cycleKey, knowledgeStateHash: decision.inputState.knowledgeStateHash });
    const stoppedState = withCognitiveDecision(decision.inputState, {
      legalActionSet: decision.inputState.currentLegalActionSet,
      selectedNextAction: {
        actionType: COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE,
        actionSignature: stableInternalId("cognitive-action", [cycleKey, "STOP"], 24),
        targetIdentity: decision.targetIdentity
      },
      reasonCodes,
      expectedInformationTarget: "TERMINAL_NO_MATERIAL_STATE_CHANGE",
      terminalStatus: "TERMINAL",
      stoppingReason: duplicate ? COGNITIVE_REASON.DUPLICATE_ACTION_BLOCKED : COGNITIVE_REASON.NO_MATERIAL_STATE_CHANGE
    });
    governor.stopDecision = stoppedState.selectedNextAction;
    governor.lastState = stoppedState;
    const stoppedDecision = {
      actionType: COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE,
      actionSignature: stoppedState.selectedNextAction.actionSignature,
      targetIdentity: decision.targetIdentity,
      reasonCodes,
      expectedInformationTarget: "TERMINAL_NO_MATERIAL_STATE_CHANGE",
      inputState: stoppedState,
      executionPermitted: false,
      blockedActionSignature: decision.actionSignature,
      customerInputRequest: null
    };
    recordGovernorDecisionInvocation(governor, stoppedDecision);
    return stoppedDecision;
  }
  governor.seenCycleKeys = [...governor.seenCycleKeys, cycleKey].slice(-MAX_COGNITIVE_ACTIONS);
  governor.lastState = decision.inputState;
  recordGovernorDecisionInvocation(governor, decision);
  return decision;
}

export function recordCognitiveActionOutcome(governor, decision, snapshot = {}, {
  outcomeCode = "COMPLETED",
  terminalStatus = ""
} = {}) {
  if (!decision || !decision.actionSignature || decision.executionPermitted === false) return governor.lastState;
  const provisional = {
    sequence: governor.actionLedger.length + 1,
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    inputCognitiveStateHash: decision.inputState.cognitiveStateHash,
    inputKnowledgeStateHash: decision.inputState.knowledgeStateHash,
    targetIdentity: decision.targetIdentity,
    reasonCodes: [...new Set(decision.reasonCodes || [])].sort(),
    expectedInformationTarget: cleanObjectText(decision.expectedInformationTarget, 120),
    outcomeCode: cleanObjectText(outcomeCode, 80),
    decisionInvocationSequence: decision.decisionInvocationSequence,
    outputCognitiveStateHash: "",
    outputKnowledgeStateHash: "",
    materialKnowledgeChanged: false
  };
  governor.actionLedger.push(provisional);
  if (decision.customerInputRequest) governor.requestedCustomerInput = decision.customerInputRequest;
  const outputState = createCognitiveState({
    ...snapshot,
    evaluationId: snapshot.evaluationId || governor.evaluationId,
    customerMission: snapshot.customerMission || governor.customerMission,
    requestedCustomerInput: governor.requestedCustomerInput,
    actionLedger: governor.actionLedger,
    blockedActionSignatures: governor.blockedActions.map((record) => record.actionSignature),
    terminalStatus
  });
  provisional.outputCognitiveStateHash = outputState.cognitiveStateHash;
  provisional.outputKnowledgeStateHash = outputState.knowledgeStateHash;
  provisional.materialKnowledgeChanged = provisional.inputKnowledgeStateHash !== provisional.outputKnowledgeStateHash;
  governor.knowledgeStateHashes = [...new Set([
    ...governor.knowledgeStateHashes,
    provisional.inputKnowledgeStateHash,
    provisional.outputKnowledgeStateHash
  ])].slice(-MAX_COGNITIVE_ACTIONS - 1);
  if (decision.actionType.startsWith("STOP_")) {
    governor.stopDecision = {
      actionType: decision.actionType,
      reasonCodes: provisional.reasonCodes,
      outcomeCode: provisional.outcomeCode
    };
  }
  updateGovernorDecisionOutcome(governor, decision, { outputState, outcomeCode });
  governor.lastState = outputState;
  return outputState;
}

export function continueCognitiveActionOutcome(governor, actionType, snapshot = {}, {
  outcomeCode = "CONTINUATION_COMPLETED",
  terminalStatus = ""
} = {}) {
  const record = [...governor.actionLedger].reverse().find((entry) => entry.actionType === actionType);
  if (!record) return governor.lastState;
  const outputState = createCognitiveState({
    ...snapshot,
    evaluationId: snapshot.evaluationId || governor.evaluationId,
    customerMission: snapshot.customerMission || governor.customerMission,
    requestedCustomerInput: governor.requestedCustomerInput,
    actionLedger: governor.actionLedger,
    blockedActionSignatures: governor.blockedActions.map((entry) => entry.actionSignature),
    terminalStatus
  });
  record.outcomeCode = cleanObjectText(outcomeCode, 80);
  record.outputCognitiveStateHash = outputState.cognitiveStateHash;
  record.outputKnowledgeStateHash = outputState.knowledgeStateHash;
  record.materialKnowledgeChanged = record.inputKnowledgeStateHash !== record.outputKnowledgeStateHash;
  if (record.decisionInvocationSequence) {
    updateGovernorDecisionOutcome(governor, {
      decisionInvocationSequence: record.decisionInvocationSequence
    }, { outputState, outcomeCode });
  }
  governor.knowledgeStateHashes = [...new Set([
    ...governor.knowledgeStateHashes,
    record.inputKnowledgeStateHash,
    record.outputKnowledgeStateHash
  ])].slice(-MAX_COGNITIVE_ACTIONS - 1);
  governor.lastState = outputState;
  return outputState;
}
