import {
  cleanObjectText,
  sha256Object,
  stableInternalId
} from "../object-intelligence/stable.js";
import {
  COGNITIVE_ACTION,
  GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION
} from "./constants.js";

export const GOVERNOR_EXECUTION_LEDGER_SCHEMA_VERSION = "1.1";

const canonicalDecisionLedgerAuthority = new WeakMap();
const executionEventLedgerAuthority = new WeakMap();
const executionEventHandleAuthority = new WeakMap();
const executionEventPublicProjectionAuthority = new WeakMap();

export const GOVERNOR_LIFECYCLE_EVENT = Object.freeze({
  GOVERNOR_CONSTRUCTED: "GOVERNOR_CONSTRUCTED",
  AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED: "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED"
});

function frozenPhaseContract(selectedOperation, {
  permittedChildOperations = [],
  permittedProviderPhases = []
} = {}) {
  return Object.freeze({
    permittedOperations: Object.freeze([selectedOperation]),
    selectedOperations: Object.freeze([selectedOperation]),
    permittedChildOperations: Object.freeze([...permittedChildOperations]),
    permittedProviderPhases: Object.freeze([...permittedProviderPhases])
  });
}

export const COGNITIVE_ACTION_PHASE_CONTRACT = Object.freeze({
  [COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE]: frozenPhaseContract("INITIAL_PROVIDER_ACQUISITION", {
    permittedChildOperations: ["PROVIDER_FALLBACK", "LIMITED_RESULT_RECOVERY"],
    permittedProviderPhases: ["INITIAL_PROVIDER_ACQUISITION", "PROVIDER_FALLBACK", "LIMITED_RESULT_RECOVERY"]
  }),
  [COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH]: frozenPhaseContract("REFINEMENT_PROVIDER_SEARCH", {
    permittedChildOperations: ["LIMITED_RESULT_RECOVERY"],
    permittedProviderPhases: ["REFINEMENT_PROVIDER_SEARCH", "LIMITED_RESULT_RECOVERY"]
  }),
  [COGNITIVE_ACTION.VERIFY_DIRECT_PAGE]: frozenPhaseContract("DIRECT_PAGE_VERIFICATION", {
    permittedProviderPhases: ["DIRECT_PAGE_VERIFICATION"]
  }),
  [COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT]: frozenPhaseContract("CUSTOMER_INPUT_TRANSITION"),
  [COGNITIVE_ACTION.FINALIZE_EVIDENCE]: frozenPhaseContract("CANONICAL_EVIDENCE_FINALIZATION"),
  [COGNITIVE_ACTION.PROCEED_TO_PURPOSE_JUDGMENT]: frozenPhaseContract("PURPOSE_JUDGMENT"),
  [COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE]: frozenPhaseContract("TERMINAL_STOP_TRANSITION"),
  [COGNITIVE_ACTION.STOP_COMPLETE]: frozenPhaseContract("TERMINAL_STOP_TRANSITION")
});

export function phaseContractForCognitiveAction(actionType = "") {
  return COGNITIVE_ACTION_PHASE_CONTRACT[actionType] || null;
}

function samePhaseSet(actual, expected) {
  return Array.isArray(actual)
    && actual.length === expected.length
    && actual.every((phase, index) => phase === expected[index]);
}

function canonicalBindingMatchesPhaseContract(actionType, canonicalDecision) {
  const expected = phaseContractForCognitiveAction(actionType);
  const binding = canonicalDecision?.actionEvidenceBinding;
  return Boolean(expected && binding)
    && binding.actionId === actionType
    && samePhaseSet(binding.permittedOperations, expected.permittedOperations)
    && samePhaseSet(binding.selectedOperations, expected.selectedOperations)
    && samePhaseSet(binding.permittedChildOperations, expected.permittedChildOperations)
    && samePhaseSet(binding.permittedProviderPhases, expected.permittedProviderPhases);
}

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

export function calculateCanonicalDecisionIdentity(record = {}) {
  return sha256Object({
    decisionIdentity: cleanObjectText(record.decisionIdentity, 80),
    canonicalDecisionHash: cleanObjectText(record.canonicalDecisionHash, 80),
    evaluationIdentity: cleanObjectText(record.evaluationIdentity, 100),
    sequence: Number(record.sequence || 0),
    actionType: cleanObjectText(record.actionType, 80),
    actionSignature: cleanObjectText(record.actionSignature, 100)
  });
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

function executionEventAuthorizationSnapshot(event = {}, lifecycleStatus = event.status) {
  return Object.freeze({
    publicRecordHash: sha256Object(event),
    executionEventIdentity: cleanObjectText(event.executionEventIdentity, 80),
    proofSchemaVersion: cleanObjectText(event.proofSchemaVersion, 20),
    sequence: Number(event.sequence || 0),
    evaluationIdentity: cleanObjectText(event.evaluationIdentity, 100),
    eventRole: cleanObjectText(event.eventRole, 20),
    operationKind: cleanObjectText(event.operationKind, 40),
    operationPhase: cleanObjectText(event.operationPhase, 100),
    actionType: cleanObjectText(event.actionType, 80),
    actionSignature: cleanObjectText(event.actionSignature, 100),
    controlledOperationType: cleanObjectText(event.controlledOperationType, 100),
    parentGovernorActionType: cleanObjectText(event.parentGovernorActionType, 80),
    parentGovernorActionSignature: cleanObjectText(event.parentGovernorActionSignature, 100),
    decisionInvocationSequence: Number(event.decisionInvocationSequence || 0),
    decisionIdentity: cleanObjectText(event.decisionIdentity, 80),
    canonicalDecisionIdentity: cleanObjectText(event.canonicalDecisionIdentity, 80),
    canonicalDecisionHash: cleanObjectText(event.canonicalDecisionHash, 80),
    parentExecutionEventIdentity: cleanObjectText(event.parentExecutionEventIdentity, 80),
    childPhase: cleanObjectText(event.childPhase, 100),
    logicalProviderRequestIdentity: cleanObjectText(event.logicalProviderRequestIdentity, 80),
    lifecycleStatus: cleanObjectText(lifecycleStatus, 30),
    errorCode: cleanObjectText(event.errorCode, 100)
  });
}

function frozenPublicExecutionEvent(event = {}) {
  return Object.freeze(Object.fromEntries(
    Object.keys(event).map((field) => [field, event[field]])
  ));
}

function storePrivateExecutionRegistration(registration) {
  executionEventLedgerAuthority
    .get(registration.ledger)
    .set(registration.snapshot.executionEventIdentity, registration);
  executionEventHandleAuthority.set(registration.handle, registration);
  return registration;
}

function privateExecutionRegistration({
  handle,
  ledger,
  publicRecord,
  expectedPublicRecord,
  snapshot,
  projectionCompromised = false
}) {
  return Object.freeze({
    handle,
    ledger,
    publicRecord,
    expectedPublicRecord,
    snapshot,
    projectionCompromised: Boolean(projectionCompromised)
  });
}

function publicExecutionEventMatchesSnapshot(event, snapshot) {
  if (!event || !snapshot) return false;
  try {
    const projected = executionEventAuthorizationSnapshot(event, event.status);
    return Object.keys(snapshot).every((field) => projected[field] === snapshot[field]);
  } catch {
    return false;
  }
}

function publicExecutionLedgerMatchesRegistry(ledger, registrationOverride = null) {
  const registry = executionEventLedgerAuthority.get(ledger);
  const authoritativePublicEvents = executionEventPublicProjectionAuthority.get(ledger);
  try {
    const publicEvents = ledger?.controlledExecutionEvents;
    if (
      !registry
      || !Array.isArray(publicEvents)
      || publicEvents !== authoritativePublicEvents
      || publicEvents.length !== registry.size
    ) return false;
    for (const [eventIdentity, storedRegistration] of registry.entries()) {
      const registration = registrationOverride?.snapshot?.executionEventIdentity === eventIdentity
        ? registrationOverride
        : storedRegistration;
      const matches = publicEvents.filter((event) => event?.executionEventIdentity === eventIdentity);
      if (
        registration.projectionCompromised
        || matches.length !== 1
        || matches[0] !== registration.publicRecord
        || !publicExecutionEventMatchesSnapshot(registration.publicRecord, registration.snapshot)
      ) return false;
    }
    return publicEvents.every((event, index) => {
      const eventIdentity = event?.executionEventIdentity;
      const storedRegistration = registry.get(eventIdentity);
      const registration = registrationOverride?.snapshot?.executionEventIdentity === eventIdentity
        ? registrationOverride
        : storedRegistration;
      return registration?.publicRecord === event
        && registration.snapshot.sequence === index + 1;
    });
  } catch {
    return false;
  }
}

function invalidatePublicExecutionProjection(ledger) {
  const registry = executionEventLedgerAuthority.get(ledger);
  if (!registry) return;
  for (const registration of [...registry.values()]) {
    if (registration.projectionCompromised) continue;
    storePrivateExecutionRegistration(privateExecutionRegistration({
      ...registration,
      projectionCompromised: true
    }));
  }
}

function registerExecutionEventAuthority(ledger, event) {
  const registry = executionEventLedgerAuthority.get(ledger);
  if (!registry) throw new Error("Governor private execution-event authority is missing.");
  if (!publicExecutionLedgerMatchesRegistry(ledger)) {
    invalidatePublicExecutionProjection(ledger);
    throw new Error("Governor public execution-event ledger does not match private authority.");
  }
  const expectedPublicRecord = frozenPublicExecutionEvent(event);
  const snapshot = executionEventAuthorizationSnapshot(expectedPublicRecord, "STARTED");
  if (!snapshot.executionEventIdentity || registry.has(snapshot.executionEventIdentity)) {
    throw new Error("Governor execution-event identity is missing or already registered.");
  }
  const handle = Object.freeze(Object.create(null));
  Array.prototype.push.call(ledger.controlledExecutionEvents, event);
  storePrivateExecutionRegistration(privateExecutionRegistration({
    handle,
    ledger,
    publicRecord: event,
    expectedPublicRecord,
    snapshot
  }));
  if (!publicExecutionLedgerMatchesRegistry(ledger)) {
    transitionPrivateExecutionEventAuthority(handle, "FAILED", "PUBLIC_PROJECTION_REGISTRATION_FAILED");
    invalidatePublicExecutionProjection(ledger);
    throw new Error("Governor public execution-event registration projection is invalid.");
  }
  return handle;
}

function resolveRegisteredExecutionEvent(ledger, eventIdentity) {
  const normalizedIdentity = cleanObjectText(eventIdentity, 80);
  const registry = executionEventLedgerAuthority.get(ledger);
  if (!registry || !normalizedIdentity) return { failure: "EXECUTION_EVENT_PROVENANCE_MISSING" };
  const registration = registry.get(normalizedIdentity);
  if (registration?.projectionCompromised) {
    return { failure: "EXECUTION_EVENT_PUBLIC_PROJECTION_COMPROMISED" };
  }
  if (!publicExecutionLedgerMatchesRegistry(ledger)) {
    invalidatePublicExecutionProjection(ledger);
    if (!registration) return { failure: "EXECUTION_EVENT_NOT_REGISTERED" };
    return { failure: "EXECUTION_EVENT_PUBLIC_LEDGER_MISMATCH" };
  }
  if (!registration) return { failure: "EXECUTION_EVENT_NOT_REGISTERED" };
  if (!publicExecutionEventMatchesSnapshot(registration.publicRecord, registration.snapshot)) {
    invalidatePublicExecutionProjection(ledger);
    return { failure: "EXECUTION_EVENT_SNAPSHOT_MISMATCH" };
  }
  return {
    failure: "",
    publicRecord: registration.publicRecord,
    snapshot: registration.snapshot
  };
}

function transitionPrivateExecutionEventAuthority(handle, lifecycleStatus, errorCode = "") {
  const registration = executionEventHandleAuthority.get(handle);
  if (!registration) throw new Error("Governor private execution-event handle is missing.");
  if (registration.snapshot.lifecycleStatus !== "STARTED" || !["COMPLETED", "FAILED"].includes(lifecycleStatus)) {
    throw new Error("Governor execution-event lifecycle transition is invalid.");
  }
  const expectedPublicRecord = frozenPublicExecutionEvent({
    ...registration.expectedPublicRecord,
    status: lifecycleStatus,
    errorCode: cleanObjectText(errorCode, 100)
  });
  const snapshot = executionEventAuthorizationSnapshot(expectedPublicRecord, lifecycleStatus);
  const terminalRegistration = storePrivateExecutionRegistration(privateExecutionRegistration({
    ...registration,
    expectedPublicRecord,
    snapshot
  }));
  return Object.freeze({
    previousRegistration: registration,
    terminalRegistration
  });
}

function synchronizePublicExecutionProjection(transition) {
  const { previousRegistration, terminalRegistration } = transition;
  const currentRegistration = executionEventHandleAuthority.get(terminalRegistration.handle);
  if (currentRegistration !== terminalRegistration) {
    throw new Error("Governor private execution-event terminal registration changed unexpectedly.");
  }
  if (
    terminalRegistration.projectionCompromised
    || !publicExecutionLedgerMatchesRegistry(terminalRegistration.ledger, previousRegistration)
  ) {
    invalidatePublicExecutionProjection(terminalRegistration.ledger);
    return false;
  }
  try {
    terminalRegistration.publicRecord.status = terminalRegistration.snapshot.lifecycleStatus;
    terminalRegistration.publicRecord.errorCode = terminalRegistration.snapshot.errorCode;
  } catch {
    invalidatePublicExecutionProjection(terminalRegistration.ledger);
    return false;
  }
  if (!publicExecutionLedgerMatchesRegistry(terminalRegistration.ledger)) {
    invalidatePublicExecutionProjection(terminalRegistration.ledger);
    return false;
  }
  return true;
}

function registeredExecutionSnapshots(ledger) {
  const registry = executionEventLedgerAuthority.get(ledger);
  return registry ? [...registry.values()].map((registration) => registration.snapshot) : [];
}

function authorizationMatchesExecutionSnapshot(authorization, snapshot) {
  if (!authorization || !snapshot) return false;
  return (
    cleanObjectText(authorization.evaluationIdentity, 100) === snapshot.evaluationIdentity
    && cleanObjectText(authorization.actionType, 80) === snapshot.actionType
    && cleanObjectText(authorization.actionSignature, 100) === snapshot.actionSignature
    && Number(authorization.decisionInvocationSequence || 0) === snapshot.decisionInvocationSequence
    && cleanObjectText(authorization.decisionIdentity, 80) === snapshot.decisionIdentity
    && cleanObjectText(authorization.canonicalDecisionIdentity, 80) === snapshot.canonicalDecisionIdentity
    && cleanObjectText(authorization.canonicalDecisionHash, 80) === snapshot.canonicalDecisionHash
    && cleanObjectText(authorization.executionEventIdentity, 80) === snapshot.executionEventIdentity
    && cleanObjectText(authorization.parentExecutionEventIdentity, 80) === snapshot.parentExecutionEventIdentity
    && cleanObjectText(authorization.operationPhase, 100) === snapshot.operationPhase
  );
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
  const ledger = {
    schemaVersion: GOVERNOR_EXECUTION_LEDGER_SCHEMA_VERSION,
    evaluationIdentity: evaluationIdentityFor(evaluationId),
    lifecycleEvents: [],
    cognitiveStateSnapshotCount: 0,
    decisionInvocations: [],
    controlledExecutionEvents: [],
    unauthorizedExecutionAttempts: [],
    providerRequestOwnership: []
  };
  canonicalDecisionLedgerAuthority.set(ledger, new Map());
  executionEventLedgerAuthority.set(ledger, new Map());
  executionEventPublicProjectionAuthority.set(ledger, ledger.controlledExecutionEvents);
  return ledger;
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
  const canonicalDecision = decision.canonicalDecision;
  if (!canonicalDecision || canonicalDecision.valid !== true || !Object.isFrozen(canonicalDecision)) {
    throw new Error("Governor decision is missing a finalized canonical decision.");
  }
  if (!canonicalBindingMatchesPhaseContract(decision.actionType, canonicalDecision)) {
    throw new Error("Governor decision canonical phases do not match the repository action contract.");
  }
  const canonicalDecisionHash = sha256Object(canonicalDecision);
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
    canonicalDecision,
    canonicalDecisionHash,
    inputCognitiveStateHash: cleanObjectText(state.cognitiveStateHash, 80),
    inputKnowledgeStateHash: cleanObjectText(state.knowledgeStateHash, 80),
    outputCognitiveStateHash: "",
    outputKnowledgeStateHash: "",
    outcomeCode: "NOT_EXECUTED",
    materialKnowledgeChanged: false,
    decisionIdentity: ""
  };
  Object.defineProperty(record, "canonicalDecision", {
    value: canonicalDecision,
    enumerable: true,
    writable: false,
    configurable: false
  });
  Object.defineProperty(record, "canonicalDecisionHash", {
    value: canonicalDecisionHash,
    enumerable: true,
    writable: false,
    configurable: false
  });
  record.decisionIdentity = calculateGovernorDecisionIdentity(record);
  record.canonicalDecisionIdentity = calculateCanonicalDecisionIdentity(record);
  Object.defineProperty(record, "canonicalDecisionIdentity", {
    value: record.canonicalDecisionIdentity,
    enumerable: true,
    writable: false,
    configurable: false
  });
  const authority = canonicalDecisionLedgerAuthority.get(ledger);
  if (!authority) throw new Error("Governor canonical ledger authority is missing.");
  ledger.decisionInvocations.push(record);
  authority.set(record.canonicalDecisionIdentity, record);
  decision.decisionInvocationSequence = sequence;
  decision.evaluationIdentity = ledger.evaluationIdentity;
  decision.decisionIdentity = record.decisionIdentity;
  decision.canonicalDecisionIdentity = record.canonicalDecisionIdentity;
  decision.canonicalDecisionHash = canonicalDecisionHash;
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

function resolveLedgerDecision(governor, decision) {
  const ledger = governor?.executionLedger;
  if (!ledger || !decision) return { failure: "AUTHORIZATION_MISSING" };
  if (decision.evaluationIdentity !== ledger.evaluationIdentity) return { failure: "WRONG_EVALUATION" };
  if (!decision.canonicalDecisionIdentity) return { failure: "CANONICAL_DECISION_IDENTITY_MISSING" };
  const selected = ledger.decisionInvocations.find((record) => (
    record.canonicalDecisionIdentity === decision.canonicalDecisionIdentity
  ));
  if (!selected) return { failure: "UNKNOWN_DECISION" };
  const authoritativeRecord = canonicalDecisionLedgerAuthority
    .get(ledger)
    ?.get(decision.canonicalDecisionIdentity);
  if (!authoritativeRecord || authoritativeRecord !== selected) {
    return { failure: "LEDGER_CANONICAL_DECISION_RECORD_MISMATCH" };
  }
  if (selected.decisionIdentity !== decision.decisionIdentity) return { failure: "DECISION_IDENTITY_MISMATCH" };
  if (selected.sequence !== decision.decisionInvocationSequence) return { failure: "DECISION_SEQUENCE_MISMATCH" };
  if (!decision.actionSignature || selected.actionSignature !== decision.actionSignature) return { failure: "SIGNATURE_MISMATCH" };
  if (selected.decisionIdentity !== calculateGovernorDecisionIdentity(selected)) {
    return { failure: "LEDGER_DECISION_IDENTITY_MISMATCH" };
  }
  if (selected.canonicalDecisionIdentity !== calculateCanonicalDecisionIdentity(selected)) {
    return { failure: "LEDGER_CANONICAL_DECISION_IDENTITY_MISMATCH" };
  }
  if (!selected.canonicalDecision || selected.canonicalDecision.valid !== true) {
    return { failure: "LEDGER_CANONICAL_DECISION_MISSING" };
  }
  if (!canonicalBindingMatchesPhaseContract(selected.actionType, selected.canonicalDecision)) {
    return { failure: "LEDGER_CANONICAL_PHASE_CONTRACT_MISMATCH" };
  }
  if (selected.canonicalDecisionHash !== sha256Object(selected.canonicalDecision)) {
    return { failure: "LEDGER_CANONICAL_DECISION_HASH_MISMATCH" };
  }
  let suppliedCanonicalHash = "";
  try {
    suppliedCanonicalHash = sha256Object(decision.canonicalDecision);
  } catch {
    return { failure: "CANONICAL_DECISION_MALFORMED" };
  }
  if (
    decision.canonicalDecisionHash !== selected.canonicalDecisionHash
    || suppliedCanonicalHash !== selected.canonicalDecisionHash
  ) return { failure: "CANONICAL_DECISION_HASH_MISMATCH" };
  return {
    failure: "",
    ledger,
    selected,
    canonicalDecision: selected.canonicalDecision,
    actionEvidenceBinding: selected.canonicalDecision.actionEvidenceBinding
  };
}

function validateSelectedDecision(governor, decision, expectedActionType, operationPhase) {
  const resolved = resolveLedgerDecision(governor, decision);
  if (resolved.failure) return resolved;
  const { selected, actionEvidenceBinding } = resolved;
  if (selected.actionType !== expectedActionType || decision.actionType !== expectedActionType) {
    return { failure: "ACTION_TYPE_MISMATCH" };
  }
  if (!actionEvidenceBinding) return { failure: "ACTION_EVIDENCE_BINDING_MISSING" };
  if (actionEvidenceBinding.actionId !== expectedActionType) return { failure: "ACTION_CONTRACT_MISMATCH" };
  if (!actionEvidenceBinding.selectedOperations.includes(cleanObjectText(operationPhase, 100))) {
    return { failure: "OPERATION_NOT_PERMITTED" };
  }
  if (!actionEvidenceBinding.requiredEvidenceIds.every((evidenceId) => (
    actionEvidenceBinding.evidenceReferences.includes(evidenceId)
  ))) return { failure: "EVIDENCE_BINDING_MISMATCH" };
  if (decision.executionPermitted === false || selected.executionPermitted === false) {
    return { failure: "EXECUTION_NOT_PERMITTED" };
  }
  const reused = registeredExecutionSnapshots(resolved.ledger).some((record) => (
    record.operationKind === "PARENT_ACTION"
    && record.decisionInvocationSequence === selected.sequence
  ));
  if (reused) return { failure: "ILLEGAL_SIGNATURE_REUSE" };
  return resolved;
}

function lockExecutionCanonicalBinding(event, selected) {
  for (const [field, value] of [
    ["decisionIdentity", selected.decisionIdentity],
    ["canonicalDecisionIdentity", selected.canonicalDecisionIdentity],
    ["canonicalDecisionHash", selected.canonicalDecisionHash]
  ]) {
    Object.defineProperty(event, field, {
      value,
      enumerable: true,
      writable: false,
      configurable: false
    });
  }
  return event;
}

function publicProjectionIntegrityError() {
  const error = new Error("Governor public execution-event projection integrity failed.");
  error.code = "EXECUTION_EVENT_PUBLIC_PROJECTION_COMPROMISED";
  return error;
}

function executionFailureCode(error) {
  try {
    return cleanObjectText(error?.code || error?.name || "OPERATION_FAILED", 100) || "OPERATION_FAILED";
  } catch {
    return "OPERATION_FAILED";
  }
}

function finalizePrivateExecution(handle, lifecycleStatus, errorCode = "") {
  const transition = transitionPrivateExecutionEventAuthority(handle, lifecycleStatus, errorCode);
  return synchronizePublicExecutionProjection(transition);
}

function invokeOperation(operation, context, handle) {
  let result;
  let isThenable;
  try {
    result = operation(context);
    isThenable = Boolean(result && typeof result.then === "function");
  } catch (error) {
    finalizePrivateExecution(handle, "FAILED", executionFailureCode(error));
    throw error;
  }
  if (isThenable) {
    return Promise.resolve(result).then((value) => {
      const projectionValid = finalizePrivateExecution(handle, "COMPLETED");
      if (!projectionValid) throw publicProjectionIntegrityError();
      return value;
    }, (error) => {
      finalizePrivateExecution(handle, "FAILED", executionFailureCode(error));
      throw error;
    });
  }
  const projectionValid = finalizePrivateExecution(handle, "COMPLETED");
  if (!projectionValid) throw publicProjectionIntegrityError();
  return result;
}

export function executeGovernorAuthorizedAction(governor, decision, expectedActionType, {
  operationPhase = "",
  operation
} = {}) {
  if (typeof operation !== "function") throw new Error("Governor-authorized operation is required.");
  const preliminary = resolveLedgerDecision(governor, decision);
  const authoritativePhase = preliminary.actionEvidenceBinding?.selectedOperations?.[0] || "";
  const requestedOperationPhase = cleanObjectText(operationPhase || authoritativePhase, 100);
  const resolved = validateSelectedDecision(governor, decision, expectedActionType, requestedOperationPhase);
  if (resolved.failure) {
    recordUnauthorizedAttempt(governor, {
      requestedActionType: expectedActionType,
      suppliedActionType: decision?.actionType,
      suppliedActionSignature: decision?.actionSignature,
      operationPhase: requestedOperationPhase,
      reasonCode: resolved.failure
    });
    throw new Error(`Governor authorization rejected: ${resolved.failure}.`);
  }
  const ledger = governor.executionLedger;
  const sequence = registeredExecutionSnapshots(ledger).length + 1;
  const event = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    sequence,
    evaluationIdentity: ledger.evaluationIdentity,
    eventRole: "PARENT",
    operationKind: "PARENT_ACTION",
    operationPhase: requestedOperationPhase,
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    controlledOperationType: requestedOperationPhase,
    parentGovernorActionType: decision.actionType,
    parentGovernorActionSignature: decision.actionSignature,
    decisionInvocationSequence: decision.decisionInvocationSequence,
    decisionIdentity: resolved.selected.decisionIdentity,
    canonicalDecisionIdentity: resolved.selected.canonicalDecisionIdentity,
    canonicalDecisionHash: resolved.selected.canonicalDecisionHash,
    parentExecutionEventIdentity: "",
    childPhase: "",
    executionEventIdentity: "",
    status: "STARTED",
    errorCode: ""
  };
  lockExecutionCanonicalBinding(event, resolved.selected);
  event.executionEventIdentity = calculateGovernorExecutionEventIdentity(event);
  const privateExecutionHandle = registerExecutionEventAuthority(ledger, event);
  const context = Object.freeze({
    evaluationIdentity: ledger.evaluationIdentity,
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    decisionInvocationSequence: decision.decisionInvocationSequence,
    decisionIdentity: resolved.selected.decisionIdentity,
    canonicalDecisionIdentity: resolved.selected.canonicalDecisionIdentity,
    canonicalDecisionHash: resolved.selected.canonicalDecisionHash,
    executionEventIdentity: event.executionEventIdentity,
    operationPhase: event.operationPhase
  });
  return invokeOperation(operation, context, privateExecutionHandle);
}

export function executeGovernorAuthorizedChildOperation(governor, parentAuthorization, {
  operationPhase,
  eligibleParentActionTypes = [],
  logicalProviderRequestIdentity = "",
  operation
} = {}) {
  const ledger = governor?.executionLedger;
  const parentResolution = resolveRegisteredExecutionEvent(ledger, parentAuthorization?.executionEventIdentity);
  const parentEvent = parentResolution.publicRecord;
  const parentSnapshot = parentResolution.snapshot;
  const selected = ledger?.decisionInvocations.find((record) => (
    record.canonicalDecisionIdentity === parentSnapshot?.canonicalDecisionIdentity
  ));
  const authoritativeRecord = ledger && parentSnapshot
    ? canonicalDecisionLedgerAuthority.get(ledger)?.get(parentSnapshot.canonicalDecisionIdentity)
    : null;
  const binding = selected?.canonicalDecision?.actionEvidenceBinding;
  const normalizedPhase = cleanObjectText(operationPhase, 100);
  let failure = "";
  if (!ledger || !parentAuthorization) failure = "CHILD_PARENT_AUTHORIZATION_MISSING";
  else if (parentResolution.failure) failure = parentResolution.failure;
  else if (!authorizationMatchesExecutionSnapshot(parentAuthorization, parentSnapshot)) failure = "CHILD_PARENT_CONTEXT_MISMATCH";
  else if (
    parentSnapshot.eventRole !== "PARENT"
    || parentSnapshot.operationKind !== "PARENT_ACTION"
    || parentSnapshot.controlledOperationType !== parentSnapshot.operationPhase
    || parentSnapshot.parentExecutionEventIdentity
    || parentSnapshot.childPhase
  ) failure = "CHILD_PARENT_ROLE_MISMATCH";
  else if (parentSnapshot.evaluationIdentity !== ledger.evaluationIdentity) failure = "WRONG_EVALUATION";
  else if (
    !selected
    || authoritativeRecord !== selected
    || selected.decisionIdentity !== calculateGovernorDecisionIdentity(selected)
  ) failure = "CHILD_LEDGER_DECISION_MISSING";
  else if (
    parentSnapshot.canonicalDecisionIdentity !== selected.canonicalDecisionIdentity
    || selected.canonicalDecisionIdentity !== calculateCanonicalDecisionIdentity(selected)
    || parentSnapshot.canonicalDecisionHash !== selected.canonicalDecisionHash
    || selected.canonicalDecisionHash !== sha256Object(selected.canonicalDecision)
  ) failure = "CHILD_CANONICAL_DECISION_MISMATCH";
  else if (
    parentSnapshot.decisionIdentity !== selected.decisionIdentity
    || parentSnapshot.decisionInvocationSequence !== selected.sequence
    || parentSnapshot.actionType !== selected.actionType
    || parentSnapshot.actionSignature !== selected.actionSignature
  ) failure = "CHILD_PARENT_DECISION_MISMATCH";
  else if (parentSnapshot.lifecycleStatus !== "COMPLETED") failure = "CHILD_PARENT_EXECUTION_INCOMPLETE";
  else if (!binding?.permittedChildOperations?.includes(normalizedPhase)) failure = "CHILD_OPERATION_NOT_PERMITTED";
  else if (selected.canonicalDecision.prohibitedOperations.includes(normalizedPhase)) failure = "CHILD_OPERATION_PROHIBITED";
  else if (eligibleParentActionTypes.length && !eligibleParentActionTypes.includes(parentAuthorization.actionType)) failure = "INELIGIBLE_PARENT_ACTION";
  else if (registeredExecutionSnapshots(ledger).some((snapshot) => (
    snapshot.operationKind === "CHILD_OPERATION"
    && snapshot.parentExecutionEventIdentity === parentSnapshot.executionEventIdentity
    && snapshot.operationPhase === normalizedPhase
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
  const sequence = registeredExecutionSnapshots(ledger).length + 1;
  const event = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    sequence,
    evaluationIdentity: ledger.evaluationIdentity,
    eventRole: "CHILD",
    operationKind: "CHILD_OPERATION",
    operationPhase: normalizedPhase,
    actionType: parentSnapshot.actionType,
    actionSignature: parentSnapshot.actionSignature,
    controlledOperationType: "CHILD_OPERATION",
    parentGovernorActionType: parentSnapshot.actionType,
    parentGovernorActionSignature: parentSnapshot.actionSignature,
    decisionInvocationSequence: parentSnapshot.decisionInvocationSequence,
    decisionIdentity: selected.decisionIdentity,
    canonicalDecisionIdentity: selected.canonicalDecisionIdentity,
    canonicalDecisionHash: selected.canonicalDecisionHash,
    parentExecutionEventIdentity: parentSnapshot.executionEventIdentity,
    childPhase: normalizedPhase,
    executionEventIdentity: "",
    status: "STARTED",
    errorCode: ""
  };
  const requestIdentity = cleanObjectText(logicalProviderRequestIdentity, 80);
  if (requestIdentity) event.logicalProviderRequestIdentity = requestIdentity;
  lockExecutionCanonicalBinding(event, selected);
  event.executionEventIdentity = calculateGovernorExecutionEventIdentity(event);
  const privateExecutionHandle = registerExecutionEventAuthority(ledger, event);
  const context = Object.freeze({
    evaluationIdentity: ledger.evaluationIdentity,
    actionType: parentSnapshot.actionType,
    actionSignature: parentSnapshot.actionSignature,
    decisionInvocationSequence: parentSnapshot.decisionInvocationSequence,
    decisionIdentity: selected.decisionIdentity,
    canonicalDecisionIdentity: selected.canonicalDecisionIdentity,
    canonicalDecisionHash: selected.canonicalDecisionHash,
    executionEventIdentity: event.executionEventIdentity,
    parentExecutionEventIdentity: parentSnapshot.executionEventIdentity,
    operationPhase: event.operationPhase
  });
  return invokeOperation(operation, context, privateExecutionHandle);
}

export function bindGovernorProviderRequest(governor, authorization, requestRecord = {}, {
  providerPhase = authorization?.operationPhase || "PROVIDER_REQUEST"
} = {}) {
  const ledger = governor?.executionLedger;
  const executionResolution = resolveRegisteredExecutionEvent(ledger, authorization?.executionEventIdentity);
  const execution = executionResolution.publicRecord;
  const executionSnapshot = executionResolution.snapshot;
  const selected = ledger?.decisionInvocations.find((record) => (
    record.canonicalDecisionIdentity === executionSnapshot?.canonicalDecisionIdentity
  ));
  const authoritativeRecord = ledger && executionSnapshot
    ? canonicalDecisionLedgerAuthority.get(ledger)?.get(executionSnapshot.canonicalDecisionIdentity)
    : null;
  const normalizedProviderPhase = cleanObjectText(providerPhase, 100);
  const parentResolution = executionSnapshot?.eventRole === "CHILD"
    ? resolveRegisteredExecutionEvent(ledger, executionSnapshot.parentExecutionEventIdentity)
    : null;
  const parentSnapshot = parentResolution?.snapshot;
  const executionRoleValid = Boolean(executionSnapshot) && (
    (
      executionSnapshot.eventRole === "PARENT"
      && executionSnapshot.operationKind === "PARENT_ACTION"
      && executionSnapshot.controlledOperationType === executionSnapshot.operationPhase
      && !executionSnapshot.parentExecutionEventIdentity
      && !executionSnapshot.childPhase
    )
    || (
      executionSnapshot.eventRole === "CHILD"
      && executionSnapshot.operationKind === "CHILD_OPERATION"
      && executionSnapshot.controlledOperationType === "CHILD_OPERATION"
      && executionSnapshot.childPhase === executionSnapshot.operationPhase
      && Boolean(parentSnapshot)
      && !parentResolution.failure
      && parentSnapshot.eventRole === "PARENT"
      && parentSnapshot.operationKind === "PARENT_ACTION"
      && parentSnapshot.lifecycleStatus === "COMPLETED"
      && parentSnapshot.actionType === executionSnapshot.actionType
      && parentSnapshot.actionSignature === executionSnapshot.actionSignature
      && parentSnapshot.evaluationIdentity === executionSnapshot.evaluationIdentity
      && parentSnapshot.decisionInvocationSequence === executionSnapshot.decisionInvocationSequence
      && parentSnapshot.decisionIdentity === executionSnapshot.decisionIdentity
      && parentSnapshot.canonicalDecisionIdentity === executionSnapshot.canonicalDecisionIdentity
      && parentSnapshot.canonicalDecisionHash === executionSnapshot.canonicalDecisionHash
    )
  );
  if (
    !ledger
    || !authorization
    || executionResolution.failure
    || !execution
    || !authorizationMatchesExecutionSnapshot(authorization, executionSnapshot)
    || !executionRoleValid
    || executionSnapshot.lifecycleStatus !== "STARTED"
    || executionSnapshot.evaluationIdentity !== ledger.evaluationIdentity
    || !selected
    || authoritativeRecord !== selected
    || selected.decisionIdentity !== calculateGovernorDecisionIdentity(selected)
    || executionSnapshot.canonicalDecisionIdentity !== selected.canonicalDecisionIdentity
    || selected.canonicalDecisionIdentity !== calculateCanonicalDecisionIdentity(selected)
    || executionSnapshot.canonicalDecisionHash !== selected.canonicalDecisionHash
    || selected.canonicalDecisionHash !== sha256Object(selected.canonicalDecision)
    || executionSnapshot.decisionIdentity !== selected.decisionIdentity
    || executionSnapshot.decisionInvocationSequence !== selected.sequence
    || executionSnapshot.actionType !== selected.actionType
    || executionSnapshot.actionSignature !== selected.actionSignature
  ) {
    recordUnauthorizedAttempt(governor, {
      suppliedActionType: authorization?.actionType,
      suppliedActionSignature: authorization?.actionSignature,
      operationPhase: providerPhase,
      reasonCode: "PROVIDER_REQUEST_AUTHORIZATION_MISSING"
    });
    throw new Error("Provider request has no current Governor authorization.");
  }
  if (!selected.canonicalDecision.actionEvidenceBinding?.permittedProviderPhases?.includes(normalizedProviderPhase)) {
    recordUnauthorizedAttempt(governor, {
      suppliedActionType: authorization.actionType,
      suppliedActionSignature: authorization.actionSignature,
      operationPhase: normalizedProviderPhase,
      reasonCode: "PROVIDER_PHASE_NOT_PERMITTED"
    });
    throw new Error("Provider request phase is not permitted by the canonical Governor decision.");
  }
  if (normalizedProviderPhase !== executionSnapshot.operationPhase) {
    recordUnauthorizedAttempt(governor, {
      suppliedActionType: authorization.actionType,
      suppliedActionSignature: authorization.actionSignature,
      operationPhase: normalizedProviderPhase,
      reasonCode: "PROVIDER_PHASE_EXECUTION_MISMATCH"
    });
    throw new Error("Provider request phase does not match its selected Governor execution phase.");
  }
  if (selected.canonicalDecision.prohibitedOperations.includes(normalizedProviderPhase)) {
    recordUnauthorizedAttempt(governor, {
      suppliedActionType: authorization.actionType,
      suppliedActionSignature: authorization.actionSignature,
      operationPhase: normalizedProviderPhase,
      reasonCode: "PROVIDER_PHASE_PROHIBITED"
    });
    throw new Error("Provider request phase is prohibited by the canonical Governor decision.");
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
  requestRecord.parentGovernorActionType = executionSnapshot.actionType;
  requestRecord.parentGovernorActionSignature = executionSnapshot.actionSignature;
  requestRecord.controlledExecutionEventIdentity = executionSnapshot.executionEventIdentity;
  requestRecord.providerOperationPhase = normalizedProviderPhase;
  requestRecord.logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity(requestRecord);
  if (
    executionSnapshot.logicalProviderRequestIdentity
    && executionSnapshot.logicalProviderRequestIdentity !== requestRecord.logicalProviderRequestIdentity
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
    parentGovernorActionType: executionSnapshot.actionType,
    parentGovernorActionSignature: executionSnapshot.actionSignature,
    controlledExecutionEventIdentity: executionSnapshot.executionEventIdentity,
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
