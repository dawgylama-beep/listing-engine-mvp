import {
  cleanObjectText,
  stableInternalId
} from "../object-intelligence/stable.js";

export const GOVERNOR_EXECUTION_LEDGER_SCHEMA_VERSION = "1.0";

function nextSequence(records = []) {
  return records.length + 1;
}

function evaluationIdentityFor(evaluationId = "") {
  return stableInternalId("governed-evaluation", cleanObjectText(evaluationId, 120), 20);
}

function recordUnauthorizedAttempt(governor, {
  requestedActionType = "",
  suppliedActionType = "",
  suppliedActionSignature = "",
  operationPhase = "",
  reasonCode = "AUTHORIZATION_MISSING"
} = {}) {
  const ledger = governor?.executionLedger;
  if (!ledger) return null;
  const record = {
    sequence: nextSequence(ledger.unauthorizedExecutionAttempts),
    requestedActionType: cleanObjectText(requestedActionType, 80),
    suppliedActionType: cleanObjectText(suppliedActionType, 80),
    suppliedActionSignature: cleanObjectText(suppliedActionSignature, 100),
    operationPhase: cleanObjectText(operationPhase, 100),
    reasonCode: cleanObjectText(reasonCode, 100)
  };
  ledger.unauthorizedExecutionAttempts.push(record);
  return record;
}

export function createGovernorExecutionLedger({ evaluationId = "" } = {}) {
  return {
    schemaVersion: GOVERNOR_EXECUTION_LEDGER_SCHEMA_VERSION,
    evaluationIdentity: evaluationIdentityFor(evaluationId),
    governorConstructionEvents: [],
    authoritativeCognitiveStateEvents: [],
    cognitiveStateSnapshotCount: 0,
    decisionInvocations: [],
    controlledExecutionEvents: [],
    unauthorizedExecutionAttempts: [],
    providerRequestOwnership: []
  };
}

export function recordGovernorConstruction(ledger, { evaluationId = "" } = {}) {
  if (!ledger || ledger.evaluationIdentity !== evaluationIdentityFor(evaluationId)) {
    throw new Error("Governor execution ledger does not match the evaluation.");
  }
  const sequence = nextSequence(ledger.governorConstructionEvents);
  const event = {
    sequence,
    governorIdentity: stableInternalId("governor", [ledger.evaluationIdentity, sequence], 18)
  };
  ledger.governorConstructionEvents.push(event);
  return event;
}

export function registerAuthoritativeCognitiveState(governor, state = {}) {
  const ledger = governor.executionLedger;
  ledger.cognitiveStateSnapshotCount += 1;
  const existing = ledger.authoritativeCognitiveStateEvents[0];
  if (existing) {
    if (
      existing.evaluationIdentity !== state.evaluationIdentity
      || existing.objectMindStateId !== cleanObjectText(state.objectMindStateId, 120)
    ) {
      recordUnauthorizedAttempt(governor, {
        operationPhase: "AUTHORITATIVE_COGNITIVE_STATE",
        reasonCode: "SECOND_AUTHORITATIVE_STATE_REJECTED"
      });
      throw new Error("A second authoritative Cognitive State was rejected.");
    }
    return existing;
  }
  const event = {
    sequence: 1,
    evaluationIdentity: cleanObjectText(state.evaluationIdentity, 100),
    objectMindStateId: cleanObjectText(state.objectMindStateId, 120),
    initialKnowledgeStateHash: cleanObjectText(state.knowledgeStateHash, 80)
  };
  ledger.authoritativeCognitiveStateEvents.push(event);
  return event;
}

export function recordGovernorDecisionInvocation(governor, decision = {}) {
  const ledger = governor.executionLedger;
  const state = decision.inputState || {};
  const sequence = nextSequence(ledger.decisionInvocations);
  const record = {
    sequence,
    evaluationIdentity: ledger.evaluationIdentity,
    actionType: cleanObjectText(decision.actionType, 80),
    actionSignature: cleanObjectText(decision.actionSignature, 100),
    targetIdentity: cleanObjectText(decision.targetIdentity, 100),
    reasonCodes: [...new Set(decision.reasonCodes || [])].sort(),
    executionPermitted: decision.executionPermitted !== false,
    selectedButNonexecutedTerminal: decision.executionPermitted === false && String(decision.actionType || "").startsWith("STOP_"),
    inputCognitiveStateHash: cleanObjectText(state.cognitiveStateHash, 80),
    inputKnowledgeStateHash: cleanObjectText(state.knowledgeStateHash, 80),
    outputCognitiveStateHash: "",
    outputKnowledgeStateHash: "",
    outcomeCode: "NOT_EXECUTED",
    materialKnowledgeChanged: false
  };
  ledger.decisionInvocations.push(record);
  decision.decisionInvocationSequence = sequence;
  decision.evaluationIdentity = ledger.evaluationIdentity;
  return record;
}

export function updateGovernorDecisionOutcome(governor, decision = {}, {
  outputState = {},
  outcomeCode = "COMPLETED"
} = {}) {
  const record = governor.executionLedger.decisionInvocations.find((entry) => (
    entry.sequence === decision.decisionInvocationSequence
  ));
  if (!record) throw new Error("Governor decision outcome has no selected-decision record.");
  record.outputCognitiveStateHash = cleanObjectText(outputState.cognitiveStateHash, 80);
  record.outputKnowledgeStateHash = cleanObjectText(outputState.knowledgeStateHash, 80);
  record.outcomeCode = cleanObjectText(outcomeCode, 80);
  record.materialKnowledgeChanged = record.inputKnowledgeStateHash !== record.outputKnowledgeStateHash;
  return record;
}

function validateSelectedDecision(governor, decision, expectedActionType, operationPhase) {
  const ledger = governor?.executionLedger;
  if (!ledger || !decision) return "AUTHORIZATION_MISSING";
  if (decision.evaluationIdentity !== ledger.evaluationIdentity) return "WRONG_EVALUATION";
  const selected = ledger.decisionInvocations.find((record) => record.sequence === decision.decisionInvocationSequence);
  if (!selected) return "UNKNOWN_DECISION";
  if (!decision.actionSignature || selected.actionSignature !== decision.actionSignature) return "SIGNATURE_MISMATCH";
  if (selected.actionType !== expectedActionType || decision.actionType !== expectedActionType) return "ACTION_TYPE_MISMATCH";
  if (decision.executionPermitted === false || selected.executionPermitted === false) return "EXECUTION_NOT_PERMITTED";
  const reused = ledger.controlledExecutionEvents.some((record) => (
    record.operationKind === "PARENT_ACTION"
    && record.decisionInvocationSequence === selected.sequence
  ));
  if (reused) return "ILLEGAL_SIGNATURE_REUSE";
  return "";
}

function completeExecutionEvent(event, status, errorCode = "") {
  event.status = status;
  event.errorCode = cleanObjectText(errorCode, 100);
}

function invokeOperation(operation, context, event) {
  try {
    const result = operation(context);
    if (result && typeof result.then === "function") {
      return result.then((value) => {
        completeExecutionEvent(event, "COMPLETED");
        return value;
      }, (error) => {
        completeExecutionEvent(event, "FAILED", error?.code || error?.name || "OPERATION_FAILED");
        throw error;
      });
    }
    completeExecutionEvent(event, "COMPLETED");
    return result;
  } catch (error) {
    completeExecutionEvent(event, "FAILED", error?.code || error?.name || "OPERATION_FAILED");
    throw error;
  }
}

export function executeGovernorAuthorizedAction(governor, decision, expectedActionType, {
  operationPhase = expectedActionType,
  operation
} = {}) {
  if (typeof operation !== "function") throw new Error("Governor-authorized operation is required.");
  const failure = validateSelectedDecision(governor, decision, expectedActionType, operationPhase);
  if (failure) {
    recordUnauthorizedAttempt(governor, {
      requestedActionType: expectedActionType,
      suppliedActionType: decision?.actionType,
      suppliedActionSignature: decision?.actionSignature,
      operationPhase,
      reasonCode: failure
    });
    throw new Error(`Governor authorization rejected: ${failure}.`);
  }
  const ledger = governor.executionLedger;
  const sequence = nextSequence(ledger.controlledExecutionEvents);
  const event = {
    sequence,
    executionEventIdentity: stableInternalId("governed-execution", [ledger.evaluationIdentity, sequence, decision.actionSignature, operationPhase], 20),
    operationKind: "PARENT_ACTION",
    operationPhase: cleanObjectText(operationPhase, 100),
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    decisionInvocationSequence: decision.decisionInvocationSequence,
    parentExecutionEventIdentity: "",
    status: "STARTED",
    errorCode: ""
  };
  ledger.controlledExecutionEvents.push(event);
  const context = Object.freeze({
    evaluationIdentity: ledger.evaluationIdentity,
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    decisionInvocationSequence: decision.decisionInvocationSequence,
    executionEventIdentity: event.executionEventIdentity,
    operationPhase: event.operationPhase
  });
  return invokeOperation(operation, context, event);
}

export function executeGovernorAuthorizedChildOperation(governor, parentAuthorization, {
  operationPhase,
  eligibleParentActionTypes = [],
  operation
} = {}) {
  const ledger = governor?.executionLedger;
  const parentEvent = ledger?.controlledExecutionEvents.find((record) => (
    record.executionEventIdentity === parentAuthorization?.executionEventIdentity
    && record.actionSignature === parentAuthorization?.actionSignature
  ));
  let failure = "";
  if (!ledger || !parentAuthorization || !parentEvent) failure = "CHILD_PARENT_AUTHORIZATION_MISSING";
  else if (parentAuthorization.evaluationIdentity !== ledger.evaluationIdentity) failure = "WRONG_EVALUATION";
  else if (parentEvent.status !== "COMPLETED") failure = "CHILD_PARENT_EXECUTION_INCOMPLETE";
  else if (!eligibleParentActionTypes.includes(parentAuthorization.actionType)) failure = "INELIGIBLE_PARENT_ACTION";
  else if (ledger.controlledExecutionEvents.some((record) => (
    record.operationKind === "CHILD_OPERATION"
    && record.parentExecutionEventIdentity === parentEvent.executionEventIdentity
    && record.operationPhase === cleanObjectText(operationPhase, 100)
  ))) failure = "ILLEGAL_CHILD_AUTHORIZATION_REUSE";
  if (failure) {
    recordUnauthorizedAttempt(governor, {
      requestedActionType: eligibleParentActionTypes.join("|"),
      suppliedActionType: parentAuthorization?.actionType,
      suppliedActionSignature: parentAuthorization?.actionSignature,
      operationPhase,
      reasonCode: failure
    });
    throw new Error(`Governor child authorization rejected: ${failure}.`);
  }
  if (typeof operation !== "function") throw new Error("Governor-authorized child operation is required.");
  const sequence = nextSequence(ledger.controlledExecutionEvents);
  const event = {
    sequence,
    executionEventIdentity: stableInternalId("governed-execution", [ledger.evaluationIdentity, sequence, parentAuthorization.actionSignature, operationPhase], 20),
    operationKind: "CHILD_OPERATION",
    operationPhase: cleanObjectText(operationPhase, 100),
    actionType: parentAuthorization.actionType,
    actionSignature: parentAuthorization.actionSignature,
    decisionInvocationSequence: parentAuthorization.decisionInvocationSequence,
    parentExecutionEventIdentity: parentEvent.executionEventIdentity,
    status: "STARTED",
    errorCode: ""
  };
  ledger.controlledExecutionEvents.push(event);
  const context = Object.freeze({
    evaluationIdentity: ledger.evaluationIdentity,
    actionType: parentAuthorization.actionType,
    actionSignature: parentAuthorization.actionSignature,
    decisionInvocationSequence: parentAuthorization.decisionInvocationSequence,
    executionEventIdentity: event.executionEventIdentity,
    parentExecutionEventIdentity: parentEvent.executionEventIdentity,
    operationPhase: event.operationPhase
  });
  return invokeOperation(operation, context, event);
}

export function bindGovernorProviderRequest(governor, authorization, requestRecord = {}, {
  providerPhase = authorization?.operationPhase || "PROVIDER_REQUEST"
} = {}) {
  const ledger = governor?.executionLedger;
  const execution = ledger?.controlledExecutionEvents.find((record) => (
    record.executionEventIdentity === authorization?.executionEventIdentity
    && record.actionSignature === authorization?.actionSignature
  ));
  if (
    !ledger
    || !authorization
    || !execution
    || execution.status !== "STARTED"
    || authorization.evaluationIdentity !== ledger.evaluationIdentity
  ) {
    recordUnauthorizedAttempt(governor, {
      suppliedActionType: authorization?.actionType,
      suppliedActionSignature: authorization?.actionSignature,
      operationPhase: providerPhase,
      reasonCode: "PROVIDER_REQUEST_AUTHORIZATION_MISSING"
    });
    throw new Error("Provider request has no current Governor authorization.");
  }
  if (requestRecord.parentGovernorActionSignature) {
    recordUnauthorizedAttempt(governor, {
      suppliedActionType: authorization.actionType,
      suppliedActionSignature: authorization.actionSignature,
      operationPhase: providerPhase,
      reasonCode: "PROVIDER_REQUEST_OWNERSHIP_REUSE"
    });
    throw new Error("Provider request Governor ownership cannot be reassigned.");
  }
  const sequence = nextSequence(ledger.providerRequestOwnership);
  const logicalProviderRequestIdentity = stableInternalId("governed-provider-request", [
    ledger.evaluationIdentity,
    authorization.actionSignature,
    sequence,
    requestRecord.query,
    requestRecord.providerEndpoint,
    providerPhase
  ], 20);
  requestRecord.governorScopeClassification = "GOVERNOR_CONTROLLED";
  requestRecord.parentGovernorActionType = authorization.actionType;
  requestRecord.parentGovernorActionSignature = authorization.actionSignature;
  requestRecord.controlledExecutionEventIdentity = authorization.executionEventIdentity;
  requestRecord.providerOperationPhase = cleanObjectText(providerPhase, 100);
  requestRecord.logicalProviderRequestIdentity = logicalProviderRequestIdentity;
  const ownership = {
    sequence,
    logicalProviderRequestIdentity,
    parentGovernorActionType: authorization.actionType,
    parentGovernorActionSignature: authorization.actionSignature,
    controlledExecutionEventIdentity: authorization.executionEventIdentity,
    providerOperationPhase: requestRecord.providerOperationPhase
  };
  Object.defineProperty(ownership, "requestRecord", { value: requestRecord, enumerable: false });
  ledger.providerRequestOwnership.push(ownership);
  return requestRecord;
}

export function assertGovernorProviderRequestOwnership(requestRecord = {}) {
  if (
    requestRecord.governorScopeClassification !== "GOVERNOR_CONTROLLED"
    || !requestRecord.parentGovernorActionType
    || !requestRecord.parentGovernorActionSignature
    || !requestRecord.controlledExecutionEventIdentity
    || !requestRecord.logicalProviderRequestIdentity
  ) {
    throw new Error("Governor-controlled provider request is missing durable ownership.");
  }
  return true;
}
