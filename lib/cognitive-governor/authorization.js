import {
  cleanObjectText,
  sha256Object,
  stableInternalId
} from "../object-intelligence/stable.js";
import { GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION } from "./constants.js";

export const GOVERNOR_EXECUTION_LEDGER_SCHEMA_VERSION = "1.1";

export const GOVERNOR_LIFECYCLE_EVENT = Object.freeze({
  GOVERNOR_CONSTRUCTED: "GOVERNOR_CONSTRUCTED",
  AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED: "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED"
});

function nextSequence(records = []) {
  return records.length + 1;
}

function evaluationIdentityFor(evaluationId = "") {
  return stableInternalId("governed-evaluation", cleanObjectText(evaluationId, 120), 20);
}

function lifecycleIdentityProjection(event = {}) {
  return {
    proofSchemaVersion: cleanObjectText(event.proofSchemaVersion, 20),
    evaluationIdentity: cleanObjectText(event.evaluationIdentity, 100),
    sequence: Number(event.sequence || 0),
    eventType: cleanObjectText(event.eventType, 100),
    governorIdentity: cleanObjectText(event.governorIdentity, 100),
    cognitiveStateIdentity: cleanObjectText(event.cognitiveStateIdentity, 100),
    objectMindStateId: cleanObjectText(event.objectMindStateId, 120),
    initialKnowledgeStateHash: cleanObjectText(event.initialKnowledgeStateHash, 80)
  };
}

export function calculateGovernorLifecycleEventIdentity(event = {}) {
  return sha256Object(lifecycleIdentityProjection(event));
}

function decisionIdentityProjection(record = {}) {
  return {
    proofSchemaVersion: cleanObjectText(record.proofSchemaVersion, 20),
    evaluationIdentity: cleanObjectText(record.evaluationIdentity, 100),
    sequence: Number(record.sequence || 0),
    actionType: cleanObjectText(record.actionType, 80),
    actionSignature: cleanObjectText(record.actionSignature, 100),
    targetIdentity: cleanObjectText(record.targetIdentity, 100),
    executionPermitted: record.executionPermitted !== false,
    selectedButNonexecutedTerminal: Boolean(record.selectedButNonexecutedTerminal),
    inputCognitiveStateHash: cleanObjectText(record.inputCognitiveStateHash, 80),
    inputKnowledgeStateHash: cleanObjectText(record.inputKnowledgeStateHash, 80)
  };
}

export function calculateGovernorDecisionIdentity(record = {}) {
  return sha256Object(decisionIdentityProjection(record));
}

function executionIdentityProjection(event = {}) {
  return {
    proofSchemaVersion: cleanObjectText(event.proofSchemaVersion, 20),
    evaluationIdentity: cleanObjectText(event.evaluationIdentity, 100),
    sequence: Number(event.sequence || 0),
    eventRole: cleanObjectText(event.eventRole, 20),
    controlledOperationType: cleanObjectText(event.controlledOperationType, 100),
    parentGovernorActionType: cleanObjectText(event.parentGovernorActionType, 80),
    parentGovernorActionSignature: cleanObjectText(event.parentGovernorActionSignature, 100),
    parentExecutionEventIdentity: cleanObjectText(event.parentExecutionEventIdentity, 80),
    childPhase: cleanObjectText(event.childPhase, 100),
    logicalProviderRequestIdentity: cleanObjectText(event.logicalProviderRequestIdentity, 80)
  };
}

export function calculateGovernorExecutionEventIdentity(event = {}) {
  return sha256Object(executionIdentityProjection(event));
}

function providerRequestIdentityProjection(record = {}) {
  return {
    proofSchemaVersion: cleanObjectText(record.proofSchemaVersion, 20),
    evaluationIdentity: cleanObjectText(record.evaluationIdentity, 100),
    providerRequestSequence: Number(record.providerRequestSequence || 0),
    parentGovernorActionType: cleanObjectText(record.parentGovernorActionType, 80),
    parentGovernorActionSignature: cleanObjectText(record.parentGovernorActionSignature, 100),
    providerOperationPhase: cleanObjectText(record.providerOperationPhase, 100)
  };
}

export function calculateLogicalProviderRequestIdentity(record = {}) {
  return sha256Object(providerRequestIdentityProjection(record));
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
    lifecycleEvents: [],
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
  if (ledger.lifecycleEvents.some((event) => event.eventType === GOVERNOR_LIFECYCLE_EVENT.GOVERNOR_CONSTRUCTED)) {
    throw new Error("A Governor construction is already recorded for this evaluation.");
  }
  const sequence = nextSequence(ledger.lifecycleEvents);
  const event = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    sequence,
    evaluationIdentity: ledger.evaluationIdentity,
    eventType: GOVERNOR_LIFECYCLE_EVENT.GOVERNOR_CONSTRUCTED,
    governorIdentity: stableInternalId("governor", [ledger.evaluationIdentity, sequence], 18),
    cognitiveStateIdentity: "",
    objectMindStateId: "",
    initialKnowledgeStateHash: "",
    lifecycleEventIdentity: ""
  };
  event.lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(event);
  ledger.lifecycleEvents.push(event);
  return event;
}

export function registerAuthoritativeCognitiveState(governor, state = {}) {
  const ledger = governor.executionLedger;
  ledger.cognitiveStateSnapshotCount += 1;
  const existing = ledger.lifecycleEvents.find((event) => (
    event.eventType === GOVERNOR_LIFECYCLE_EVENT.AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED
  ));
  if (existing) {
    if (
      existing.cognitiveStateIdentity !== cleanObjectText(state.evaluationIdentity, 100)
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
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    sequence: nextSequence(ledger.lifecycleEvents),
    evaluationIdentity: ledger.evaluationIdentity,
    eventType: GOVERNOR_LIFECYCLE_EVENT.AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED,
    governorIdentity: cleanObjectText(governor.governorIdentity, 100),
    cognitiveStateIdentity: cleanObjectText(state.evaluationIdentity, 100),
    objectMindStateId: cleanObjectText(state.objectMindStateId, 120),
    initialKnowledgeStateHash: cleanObjectText(state.knowledgeStateHash, 80),
    lifecycleEventIdentity: ""
  };
  event.lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(event);
  ledger.lifecycleEvents.push(event);
  return event;
}

export function recordGovernorDecisionInvocation(governor, decision = {}) {
  const ledger = governor.executionLedger;
  const state = decision.inputState || {};
  const sequence = nextSequence(ledger.decisionInvocations);
  const record = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
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
    materialKnowledgeChanged: false,
    decisionIdentity: ""
  };
  record.decisionIdentity = calculateGovernorDecisionIdentity(record);
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
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    sequence,
    evaluationIdentity: ledger.evaluationIdentity,
    eventRole: "PARENT",
    operationKind: "PARENT_ACTION",
    operationPhase: cleanObjectText(operationPhase, 100),
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    controlledOperationType: cleanObjectText(operationPhase, 100),
    parentGovernorActionType: decision.actionType,
    parentGovernorActionSignature: decision.actionSignature,
    decisionInvocationSequence: decision.decisionInvocationSequence,
    parentExecutionEventIdentity: "",
    childPhase: "",
    executionEventIdentity: "",
    status: "STARTED",
    errorCode: ""
  };
  event.executionEventIdentity = calculateGovernorExecutionEventIdentity(event);
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
  logicalProviderRequestIdentity = "",
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
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    sequence,
    evaluationIdentity: ledger.evaluationIdentity,
    eventRole: "CHILD",
    operationKind: "CHILD_OPERATION",
    operationPhase: cleanObjectText(operationPhase, 100),
    actionType: parentAuthorization.actionType,
    actionSignature: parentAuthorization.actionSignature,
    controlledOperationType: "CHILD_OPERATION",
    parentGovernorActionType: parentAuthorization.actionType,
    parentGovernorActionSignature: parentAuthorization.actionSignature,
    decisionInvocationSequence: parentAuthorization.decisionInvocationSequence,
    parentExecutionEventIdentity: parentEvent.executionEventIdentity,
    childPhase: cleanObjectText(operationPhase, 100),
    executionEventIdentity: "",
    status: "STARTED",
    errorCode: ""
  };
  const requestIdentity = cleanObjectText(logicalProviderRequestIdentity, 80);
  if (requestIdentity) event.logicalProviderRequestIdentity = requestIdentity;
  event.executionEventIdentity = calculateGovernorExecutionEventIdentity(event);
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
  requestRecord.proofSchemaVersion = GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION;
  requestRecord.evaluationIdentity = ledger.evaluationIdentity;
  requestRecord.providerRequestSequence = sequence;
  requestRecord.governorScopeClassification = "GOVERNOR_CONTROLLED";
  requestRecord.parentGovernorActionType = authorization.actionType;
  requestRecord.parentGovernorActionSignature = authorization.actionSignature;
  requestRecord.controlledExecutionEventIdentity = authorization.executionEventIdentity;
  requestRecord.providerOperationPhase = cleanObjectText(providerPhase, 100);
  requestRecord.logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity(requestRecord);
  if (
    execution.logicalProviderRequestIdentity
    && execution.logicalProviderRequestIdentity !== requestRecord.logicalProviderRequestIdentity
  ) {
    recordUnauthorizedAttempt(governor, {
      suppliedActionType: authorization.actionType,
      suppliedActionSignature: authorization.actionSignature,
      operationPhase: providerPhase,
      reasonCode: "PROVIDER_REQUEST_IDENTITY_MISMATCH"
    });
    throw new Error("Provider request does not match its request-specific child execution.");
  }
  const ownership = {
    proofSchemaVersion: requestRecord.proofSchemaVersion,
    sequence,
    evaluationIdentity: requestRecord.evaluationIdentity,
    logicalProviderRequestIdentity: requestRecord.logicalProviderRequestIdentity,
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
    || !requestRecord.evaluationIdentity
    || !Number.isInteger(requestRecord.providerRequestSequence)
    || !requestRecord.parentGovernorActionType
    || !requestRecord.parentGovernorActionSignature
    || !requestRecord.controlledExecutionEventIdentity
    || !requestRecord.logicalProviderRequestIdentity
    || requestRecord.logicalProviderRequestIdentity !== calculateLogicalProviderRequestIdentity(requestRecord)
  ) {
    throw new Error("Governor-controlled provider request is missing durable ownership.");
  }
  return true;
}
