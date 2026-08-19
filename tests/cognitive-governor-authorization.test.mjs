import assert from "node:assert/strict";
import test from "node:test";
import { sha256Object } from "../lib/object-intelligence/stable.js";
import {
  COGNITIVE_ACTION,
  COGNITIVE_BOUNDARY,
  GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
  bindGovernorProviderRequest,
  calculateCanonicalDecisionIdentity,
  calculateGovernorExecutionEventIdentity,
  calculateLogicalProviderRequestIdentity,
  createCognitiveGovernor,
  createCustomerMissionContext,
  createGovernorExecutionLedger,
  decideCognitiveAction,
  executeGovernorAuthorizedAction,
  executeGovernorAuthorizedChildOperation,
  recordGovernorConstruction,
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

function completedInitialParent(evaluationId) {
  const { governor, decision } = initialDecision(evaluationId);
  let authorization;
  executeGovernorAuthorizedAction(governor, decision, decision.actionType, {
    operation: (context) => { authorization = context; }
  });
  return {
    governor,
    decision,
    authorization,
    event: governor.executionLedger.controlledExecutionEvents[0]
  };
}

function publicParentLookalike(governor, decision, {
  operationPhase = "INITIAL_PROVIDER_ACQUISITION",
  status = "COMPLETED"
} = {}) {
  const event = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    sequence: 1,
    evaluationIdentity: governor.executionLedger.evaluationIdentity,
    eventRole: "PARENT",
    operationKind: "PARENT_ACTION",
    operationPhase,
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    controlledOperationType: operationPhase,
    parentGovernorActionType: decision.actionType,
    parentGovernorActionSignature: decision.actionSignature,
    decisionInvocationSequence: decision.decisionInvocationSequence,
    decisionIdentity: decision.decisionIdentity,
    canonicalDecisionIdentity: decision.canonicalDecisionIdentity,
    canonicalDecisionHash: decision.canonicalDecisionHash,
    parentExecutionEventIdentity: "",
    childPhase: "",
    executionEventIdentity: "",
    status,
    errorCode: ""
  };
  event.executionEventIdentity = calculateGovernorExecutionEventIdentity(event);
  return event;
}

function copiedAuthorizationForEvent(governor, decision, event) {
  return {
    evaluationIdentity: governor.executionLedger.evaluationIdentity,
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    decisionInvocationSequence: decision.decisionInvocationSequence,
    decisionIdentity: decision.decisionIdentity,
    canonicalDecisionIdentity: decision.canonicalDecisionIdentity,
    canonicalDecisionHash: decision.canonicalDecisionHash,
    executionEventIdentity: event.executionEventIdentity,
    operationPhase: event.operationPhase
  };
}

function corruptActivePublicProjection(governor, mode) {
  const ledger = governor.executionLedger;
  const originalArray = ledger.controlledExecutionEvents;
  const originalEvents = [...originalArray];
  const eventIndex = originalArray.length - 1;
  const originalEvent = originalArray[eventIndex];
  const equivalentEvent = JSON.parse(JSON.stringify(originalEvent));
  const originalStatus = originalEvent.status;
  const originalOperationPhase = originalEvent.operationPhase;
  const originalChildPhase = originalEvent.childPhase;
  const originalExecutionEventIdentity = originalEvent.executionEventIdentity;
  const originalHadPublicRecordHash = Object.prototype.hasOwnProperty.call(originalEvent, "publicRecordHash");
  const originalPublicRecordHash = originalEvent.publicRecordHash;

  if (mode === "LIFECYCLE_MUTATION") {
    originalEvent.status = "COMPLETED";
  } else if (mode === "SPREAD_REPLACEMENT") {
    originalArray[eventIndex] = { ...originalEvent };
  } else if (mode === "ARRAY_REPLACEMENT") {
    ledger.controlledExecutionEvents = [...originalArray];
  } else if (mode === "LOOKALIKE_INSERTION") {
    ledger.controlledExecutionEvents = [...originalArray, { ...originalEvent }];
  } else if (mode === "EVENT_REMOVAL") {
    ledger.controlledExecutionEvents = originalArray.slice(0, eventIndex);
  } else if (mode === "ARRAY_REORDERING") {
    originalArray.reverse();
  } else if (mode === "STRUCTURED_CLONE_REPLACEMENT") {
    originalArray[eventIndex] = structuredClone(originalEvent);
  } else if (mode === "JSON_COPY_REPLACEMENT") {
    originalArray[eventIndex] = JSON.parse(JSON.stringify(originalEvent));
  } else if (mode === "PHASE_AND_PUBLIC_IDENTITY_RECOMPUTATION") {
    originalEvent.operationPhase = originalEvent.operationPhase === "PROVIDER_FALLBACK"
      ? "LIMITED_RESULT_RECOVERY"
      : "PROVIDER_FALLBACK";
    if (originalEvent.eventRole === "CHILD") originalEvent.childPhase = originalEvent.operationPhase;
    originalEvent.executionEventIdentity = calculateGovernorExecutionEventIdentity(originalEvent);
    originalEvent.publicRecordHash = sha256Object(originalEvent);
  } else {
    throw new Error(`Unknown public projection corruption mode: ${mode}`);
  }

  return {
    originalArray,
    originalEvent,
    restoreExact() {
      originalEvent.status = originalStatus;
      originalEvent.operationPhase = originalOperationPhase;
      originalEvent.childPhase = originalChildPhase;
      originalEvent.executionEventIdentity = originalExecutionEventIdentity;
      if (originalHadPublicRecordHash) originalEvent.publicRecordHash = originalPublicRecordHash;
      else delete originalEvent.publicRecordHash;
      originalArray.length = 0;
      Array.prototype.push.apply(originalArray, originalEvents);
      ledger.controlledExecutionEvents = originalArray;
    },
    restoreEquivalentCopy() {
      originalArray.length = 0;
      Array.prototype.push.apply(originalArray, originalEvents);
      originalArray[eventIndex] = equivalentEvent;
      ledger.controlledExecutionEvents = originalArray;
    }
  };
}

function assertProviderAuthorityDenied(governor, authorization) {
  assert.throws(() => bindGovernorProviderRequest(governor, { ...authorization }, {}, {
    providerPhase: authorization.operationPhase
  }), /no current Governor authorization/);
}

function runSynchronousParentTerminalityAttack({ evaluationId, mode, fail = false }) {
  const { governor, decision } = initialDecision(evaluationId);
  let authorization;
  let corruption;
  const execute = () => executeGovernorAuthorizedAction(governor, decision, decision.actionType, {
    operation: (context) => {
      authorization = context;
      corruption = corruptActivePublicProjection(governor, mode);
      if (fail) throw new Error(`${evaluationId}-executor-failure`);
      return `${evaluationId}-executor-success`;
    }
  });
  if (fail) assert.throws(execute, new RegExp(`${evaluationId}-executor-failure`));
  else assert.throws(execute);
  corruption.restoreExact();
  assertProviderAuthorityDenied(governor, authorization);
  assert.equal(governor.executionLedger.providerRequestOwnership.length, 0);
}

async function runAsynchronousParentTerminalityAttack({ evaluationId, mode, fail = false }) {
  const { governor, decision } = initialDecision(evaluationId);
  let authorization;
  let corruption;
  const execution = executeGovernorAuthorizedAction(governor, decision, decision.actionType, {
    operation: async (context) => {
      authorization = context;
      corruption = corruptActivePublicProjection(governor, mode);
      await Promise.resolve();
      if (fail) throw new Error(`${evaluationId}-executor-failure`);
      return `${evaluationId}-executor-success`;
    }
  });
  if (fail) await assert.rejects(execution, new RegExp(`${evaluationId}-executor-failure`));
  else await assert.rejects(execution);
  corruption.restoreExact();
  assertProviderAuthorityDenied(governor, authorization);
  assert.equal(governor.executionLedger.providerRequestOwnership.length, 0);
}

function completedParentForChild(evaluationId) {
  const parent = completedInitialParent(evaluationId);
  return {
    ...parent,
    executeChild(operation) {
      return executeGovernorAuthorizedChildOperation(parent.governor, parent.authorization, {
        operationPhase: "PROVIDER_FALLBACK",
        eligibleParentActionTypes: [parent.decision.actionType],
        operation
      });
    }
  };
}

function runSynchronousChildTerminalityAttack({ evaluationId, mode, fail = false, equivalentRestore = false }) {
  const scenario = completedParentForChild(evaluationId);
  let authorization;
  let corruption;
  const execute = () => scenario.executeChild((context) => {
    authorization = context;
    corruption = corruptActivePublicProjection(scenario.governor, mode);
    if (fail) throw new Error(`${evaluationId}-executor-failure`);
    return `${evaluationId}-executor-success`;
  });
  if (fail) assert.throws(execute, new RegExp(`${evaluationId}-executor-failure`));
  else assert.throws(execute);
  if (equivalentRestore) {
    corruption.restoreEquivalentCopy();
    assertProviderAuthorityDenied(scenario.governor, authorization);
    corruption.restoreExact();
  } else {
    corruption.restoreExact();
  }
  assertProviderAuthorityDenied(scenario.governor, authorization);
  assert.equal(scenario.governor.executionLedger.providerRequestOwnership.length, 0);
}

async function runAsynchronousChildTerminalityAttack({ evaluationId, mode, fail = false }) {
  const scenario = completedParentForChild(evaluationId);
  let authorization;
  let corruption;
  const execution = scenario.executeChild(async (context) => {
    authorization = context;
    corruption = corruptActivePublicProjection(scenario.governor, mode);
    await Promise.resolve();
    if (fail) throw new Error(`${evaluationId}-executor-failure`);
    return `${evaluationId}-executor-success`;
  });
  if (fail) await assert.rejects(execution, new RegExp(`${evaluationId}-executor-failure`));
  else await assert.rejects(execution);
  corruption.restoreExact();
  assertProviderAuthorityDenied(scenario.governor, authorization);
  assert.equal(scenario.governor.executionLedger.providerRequestOwnership.length, 0);
}

function installControlledExecutionEventsHostileGetter(governor, behavior, getterFailure) {
  const ledger = governor.executionLedger;
  const originalDescriptor = Object.getOwnPropertyDescriptor(ledger, "controlledExecutionEvents");
  const originalArray = ledger.controlledExecutionEvents;
  const originalEvents = [...originalArray];
  const fieldSnapshots = originalEvents.map((event) => ({
    event,
    fields: new Map(Object.keys(event).map((field) => [field, event[field]]))
  }));
  const activeEvent = originalEvents.at(-1);
  let readCount = 0;

  Object.defineProperty(ledger, "controlledExecutionEvents", {
    configurable: true,
    enumerable: true,
    get() {
      readCount += 1;
      if (behavior === "THROW_ON_READ") throw getterFailure;
      if (behavior === "MALFORMED_NON_ARRAY") return { callerControlled: true };
      if (behavior === "CHANGES_BETWEEN_READS") {
        return readCount === 1 ? originalArray : { callerControlled: "changed" };
      }
      if (behavior === "REENTRANT_MUTATION_THEN_THROW") {
        activeEvent.status = "REENTRANT_FORGED_STATUS";
        activeEvent.operationKind = "REENTRANT_FORGED_KIND";
        throw getterFailure;
      }
      throw new Error(`Unknown controlledExecutionEvents getter behavior: ${behavior}`);
    }
  });

  return {
    restoreExact() {
      Object.defineProperty(ledger, "controlledExecutionEvents", originalDescriptor);
      for (const { event, fields } of fieldSnapshots) {
        for (const field of Object.keys(event)) {
          if (!fields.has(field)) {
            const descriptor = Object.getOwnPropertyDescriptor(event, field);
            if (descriptor?.configurable !== false) delete event[field];
          }
        }
        for (const [field, value] of fields) {
          const descriptor = Object.getOwnPropertyDescriptor(event, field);
          if (!descriptor || descriptor.writable !== false) event[field] = value;
        }
      }
      originalArray.length = 0;
      Array.prototype.push.apply(originalArray, originalEvents);
      ledger.controlledExecutionEvents = originalArray;
    }
  };
}

function assertCopiedLedgerProviderAuthorityDenied(governor, authorization) {
  const copiedLedger = JSON.parse(JSON.stringify(governor.executionLedger));
  assert.throws(() => bindGovernorProviderRequest(
    { executionLedger: copiedLedger },
    { ...authorization },
    {},
    { providerPhase: authorization.operationPhase }
  ), /no current Governor authorization/);
}

async function runControlledExecutionEventsHostileGetterCase({
  caseName,
  role,
  timing,
  bodyOutcome,
  getterBehavior
}) {
  const scenario = role === "CHILD"
    ? completedParentForChild(`controlled-getter-${caseName}`)
    : initialDecision(`controlled-getter-${caseName}`);
  const bodyFailure = new Error(`${caseName}-body-failure`);
  const getterFailure = new Error(`${caseName}-getter-failure`);
  let authorization;
  let getterControl;
  let ordinarySuccessObserved = false;
  let observedError;

  const operation = timing === "ASYNC"
    ? async (context) => {
        authorization = context;
        getterControl = installControlledExecutionEventsHostileGetter(
          scenario.governor,
          getterBehavior,
          getterFailure
        );
        await Promise.resolve();
        if (bodyOutcome === "FAILURE") throw bodyFailure;
        return `${caseName}-ordinary-success`;
      }
    : (context) => {
        authorization = context;
        getterControl = installControlledExecutionEventsHostileGetter(
          scenario.governor,
          getterBehavior,
          getterFailure
        );
        if (bodyOutcome === "FAILURE") throw bodyFailure;
        return `${caseName}-ordinary-success`;
      };

  try {
    const result = role === "CHILD"
      ? timing === "ASYNC"
        ? await scenario.executeChild(operation)
        : scenario.executeChild(operation)
      : timing === "ASYNC"
        ? await executeGovernorAuthorizedAction(
            scenario.governor,
            scenario.decision,
            scenario.decision.actionType,
            { operation }
          )
        : executeGovernorAuthorizedAction(
            scenario.governor,
            scenario.decision,
            scenario.decision.actionType,
            { operation }
          );
    ordinarySuccessObserved = result === `${caseName}-ordinary-success`;
  } catch (error) {
    observedError = error;
  }

  getterControl.restoreExact();

  assert.equal(ordinarySuccessObserved, false);
  if (bodyOutcome === "SUCCESS") {
    assert.notStrictEqual(observedError, getterFailure);
    assert.equal(observedError?.code, "EXECUTION_EVENT_PUBLIC_PROJECTION_COMPROMISED");
  } else {
    assert.notStrictEqual(observedError, getterFailure);
    assert.strictEqual(observedError, bodyFailure);
  }

  assert.throws(() => bindGovernorProviderRequest(
    scenario.governor,
    authorization,
    {},
    { providerPhase: authorization.operationPhase }
  ), /no current Governor authorization/);
  assertProviderAuthorityDenied(scenario.governor, authorization);
  assertCopiedLedgerProviderAuthorityDenied(scenario.governor, authorization);

  if (role === "PARENT") {
    assert.throws(() => executeGovernorAuthorizedChildOperation(
      scenario.governor,
      authorization,
      {
        operationPhase: "PROVIDER_FALLBACK",
        eligibleParentActionTypes: [scenario.decision.actionType],
        operation: () => assert.fail("restored parent authorized child execution")
      }
    ));
  }
}

const controlledExecutionEventsHostileGetterExecutionForms = [
  ["parent synchronous success", "PARENT", "SYNC", "SUCCESS"],
  ["parent synchronous failure", "PARENT", "SYNC", "FAILURE"],
  ["parent asynchronous success", "PARENT", "ASYNC", "SUCCESS"],
  ["parent asynchronous failure", "PARENT", "ASYNC", "FAILURE"],
  ["child synchronous success", "CHILD", "SYNC", "SUCCESS"],
  ["child synchronous failure", "CHILD", "SYNC", "FAILURE"],
  ["child asynchronous success", "CHILD", "ASYNC", "SUCCESS"],
  ["child asynchronous failure", "CHILD", "ASYNC", "FAILURE"]
];

const controlledExecutionEventsHostileGetterBehaviors = [
  "THROW_ON_READ",
  "MALFORMED_NON_ARRAY",
  "CHANGES_BETWEEN_READS",
  "REENTRANT_MUTATION_THEN_THROW"
];

for (const [executionForm, role, timing, bodyOutcome] of controlledExecutionEventsHostileGetterExecutionForms) {
  for (const getterBehavior of controlledExecutionEventsHostileGetterBehaviors) {
    const caseName = `${executionForm} ${getterBehavior}`;
    test(`controlledExecutionEvents hostile getter ${caseName}`, async () => {
      await runControlledExecutionEventsHostileGetterCase({
        caseName,
        role,
        timing,
        bodyOutcome,
        getterBehavior
      });
    });
  }
}

test("canonical ledger counts one Governor, one authoritative state, and every decision invocation", () => {
  const { governor, decision } = initialDecision();
  assert.equal(governor.executionLedger.lifecycleEvents.filter((event) => event.eventType === "GOVERNOR_CONSTRUCTED").length, 1);
  assert.equal(governor.executionLedger.lifecycleEvents.filter((event) => event.eventType === "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED").length, 1);
  assert(governor.executionLedger.lifecycleEvents.every((event) => event.evaluationIdentity === governor.executionLedger.evaluationIdentity));
  assert.equal(governor.executionLedger.decisionInvocations.length, 1);
  recordCognitiveActionOutcome(governor, decision, snapshot({ providerRequests: [{ physicalAttemptCount: 1 }] }));
  const stopped = decideCognitiveAction(governor, snapshot({ providerRequests: [{ physicalAttemptCount: 1 }], providerBudget: { maximum: 1, consumed: 1 }, customerInputAvailable: false }), { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(stopped.executionPermitted, false);
  assert.ok(stopped.actionType.startsWith("STOP_"));
  assert.equal(governor.executionLedger.decisionInvocations.length, 2);
  assert.equal(governor.executionLedger.decisionInvocations[1].selectedButNonexecutedTerminal, true);
});

test("the canonical ledger rejects a second Governor construction", () => {
  const ledger = createGovernorExecutionLedger({ evaluationId: "one-governor" });
  recordGovernorConstruction(ledger, { evaluationId: "one-governor" });
  assert.throws(
    () => recordGovernorConstruction(ledger, { evaluationId: "one-governor" }),
    /already recorded/
  );
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

test("a selected action rejects an operation outside its canonical operation lock", () => {
  const { governor, decision } = initialDecision("evaluation-operation-lock");
  assert.equal(decision.canonicalDecision.actionEvidenceBinding.actionId, decision.actionType);
  assert.equal(Object.getOwnPropertyDescriptor(decision, "canonicalDecision").writable, false);
  assert.throws(() => {
    decision.canonicalDecision = { actionEvidenceBinding: null };
  }, TypeError);
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    decision,
    COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE,
    {
      operationPhase: "UNPERMITTED_SYNTHETIC_OPERATION",
      operation: () => assert.fail("unpermitted operation executed")
    }
  ), /OPERATION_NOT_PERMITTED/);
});

test("ledger-bound authorization rejects spread, deep, and reconstructed canonical substitutions", () => {
  const { governor, decision } = initialDecision("evaluation-canonical-copy-attack");
  assert.equal(Object.isFrozen(decision.canonicalDecision), true);
  assert.equal(Object.isFrozen(decision.canonicalDecision.actionEvidenceBinding.selectedOperations), true);
  assert.throws(() => {
    decision.canonicalDecision.actionEvidenceBinding.selectedOperations[0] = "FORGED_OPERATION";
  }, TypeError);

  const forgedCanonicalDecision = {
    ...decision.canonicalDecision,
    actionEvidenceBinding: {
      ...decision.canonicalDecision.actionEvidenceBinding,
      permittedOperations: ["FORGED_OPERATION"],
      selectedOperations: ["FORGED_OPERATION"]
    }
  };
  const spreadCopy = { ...decision, canonicalDecision: forgedCanonicalDecision };
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    spreadCopy,
    decision.actionType,
    { operationPhase: "FORGED_OPERATION", operation: () => assert.fail("spread copy executed") }
  ), /CANONICAL_DECISION_HASH_MISMATCH/);

  const deepCopy = structuredClone(decision);
  deepCopy.canonicalDecision.actionEvidenceBinding.selectedOperations = ["FORGED_OPERATION"];
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    deepCopy,
    decision.actionType,
    { operationPhase: "FORGED_OPERATION", operation: () => assert.fail("deep copy executed") }
  ), /CANONICAL_DECISION_HASH_MISMATCH/);

  const reconstructed = JSON.parse(JSON.stringify(decision));
  reconstructed.canonicalDecision.actionEvidenceBinding.selectedOperations = ["FORGED_OPERATION"];
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    reconstructed,
    decision.actionType,
    { operationPhase: "FORGED_OPERATION", operation: () => assert.fail("reconstructed copy executed") }
  ), /CANONICAL_DECISION_HASH_MISMATCH/);

  const falseVisibleHash = { ...decision, canonicalDecisionHash: "f".repeat(64) };
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    falseVisibleHash,
    decision.actionType,
    { operation: () => assert.fail("false visible hash executed") }
  ), /CANONICAL_DECISION_HASH_MISMATCH/);

  const missingCanonical = { ...decision };
  delete missingCanonical.canonicalDecision;
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    missingCanonical,
    decision.actionType,
    { operation: () => assert.fail("missing canonical decision executed") }
  ), /CANONICAL_DECISION_HASH_MISMATCH|CANONICAL_DECISION_MALFORMED/);

  const malformedCanonical = { ...decision, canonicalDecision: "not-a-canonical-record" };
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    malformedCanonical,
    decision.actionType,
    { operation: () => assert.fail("malformed canonical decision executed") }
  ), /CANONICAL_DECISION_HASH_MISMATCH|CANONICAL_DECISION_MALFORMED/);

  let executions = 0;
  executeGovernorAuthorizedAction(governor, decision, decision.actionType, {
    operation: () => { executions += 1; }
  });
  assert.equal(executions, 1);
  const ledgerDecision = governor.executionLedger.decisionInvocations[0];
  assert.equal(decision.canonicalDecision, ledgerDecision.canonicalDecision);
  assert.equal(decision.canonicalDecisionHash, ledgerDecision.canonicalDecisionHash);
  assert.equal(decision.canonicalDecisionIdentity, calculateCanonicalDecisionIdentity(ledgerDecision));
});

test("ledger-bound authorization rejects missing or tampered canonical ledger records", () => {
  const { governor, decision } = initialDecision("evaluation-ledger-record-tamper");
  const ledger = governor.executionLedger;
  const originalRecord = ledger.decisionInvocations[0];

  ledger.decisionInvocations[0] = {
    ...originalRecord,
    canonicalDecisionHash: "f".repeat(64)
  };
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    decision,
    decision.actionType,
    { operation: () => assert.fail("tampered ledger record executed") }
  ), /LEDGER_CANONICAL_DECISION_RECORD_MISMATCH/);

  ledger.decisionInvocations[0] = {
    ...originalRecord,
    canonicalDecision: null
  };
  assert.throws(() => executeGovernorAuthorizedAction(
    governor,
    decision,
    decision.actionType,
    { operation: () => assert.fail("missing ledger canonical decision executed") }
  ), /LEDGER_CANONICAL_DECISION_RECORD_MISMATCH/);

  ledger.decisionInvocations[0] = originalRecord;
  let executions = 0;
  executeGovernorAuthorizedAction(governor, decision, decision.actionType, {
    operation: () => { executions += 1; }
  });
  assert.equal(executions, 1);
});

test("ledger-bound child and provider phases cannot be expanded by caller arguments", () => {
  const { governor, decision } = initialDecision("evaluation-downstream-phase-lock");
  let parentAuthorization;
  let providerExecuted = 0;
  executeGovernorAuthorizedAction(governor, decision, decision.actionType, {
    operation: (authorization) => {
      parentAuthorization = authorization;
      assert.throws(() => bindGovernorProviderRequest(governor, authorization, {}, {
        providerPhase: "UNSELECTED_PROVIDER_PHASE"
      }), /phase is not permitted/);
      assert.throws(() => bindGovernorProviderRequest(governor, authorization, {}, {
        providerPhase: "PROVIDER_FALLBACK"
      }), /does not match its selected Governor execution phase/);
      bindGovernorProviderRequest(governor, authorization, {}, {
        providerPhase: "INITIAL_PROVIDER_ACQUISITION"
      });
      providerExecuted += 1;
    }
  });
  assert.equal(providerExecuted, 1);

  assert.throws(() => executeGovernorAuthorizedChildOperation(governor, parentAuthorization, {
    operationPhase: "UNSELECTED_CHILD_PHASE",
    eligibleParentActionTypes: [decision.actionType, "ANY_CALLER_SUPPLIED_ACTION"],
    operation: () => assert.fail("unselected child executed")
  }), /CHILD_OPERATION_NOT_PERMITTED/);
  assert.throws(() => executeGovernorAuthorizedChildOperation(governor, parentAuthorization, {
    operationPhase: "PROVIDER_FALLBACK",
    eligibleParentActionTypes: ["ANY_CALLER_SUPPLIED_ACTION"],
    operation: () => assert.fail("caller-expanded parent type executed")
  }), /INELIGIBLE_PARENT_ACTION/);
  assert.throws(() => executeGovernorAuthorizedChildOperation(governor, {
    ...parentAuthorization,
    canonicalDecisionIdentity: "f".repeat(64)
  }, {
    operationPhase: "PROVIDER_FALLBACK",
    eligibleParentActionTypes: [decision.actionType],
    operation: () => assert.fail("copied parent authorization executed")
  }), /CHILD_PARENT_CONTEXT_MISMATCH/);
  assert.throws(() => executeGovernorAuthorizedChildOperation(governor, {
    ...parentAuthorization,
    actionType: COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH
  }, {
    operationPhase: "PROVIDER_FALLBACK",
    eligibleParentActionTypes: [COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH],
    operation: () => assert.fail("copied parent action type executed")
  }), /CHILD_PARENT_CONTEXT_MISMATCH/);

  let childExecuted = 0;
  executeGovernorAuthorizedChildOperation(governor, parentAuthorization, {
    operationPhase: "PROVIDER_FALLBACK",
    eligibleParentActionTypes: [decision.actionType],
    operation: (authorization) => {
      bindGovernorProviderRequest(governor, authorization, {}, { providerPhase: "PROVIDER_FALLBACK" });
      childExecuted += 1;
    }
  });
  assert.equal(childExecuted, 1);
});

test("private event provenance rejects a replaced completed parent with a recomputed public identity", () => {
  const { governor, decision, authorization, event } = completedInitialParent("evaluation-replaced-parent-event");
  const replacement = {
    ...event,
    errorCode: "RECONSTRUCTED_PUBLIC_EVENT"
  };
  replacement.executionEventIdentity = calculateGovernorExecutionEventIdentity(replacement);
  assert.equal(replacement.executionEventIdentity, event.executionEventIdentity);
  governor.executionLedger.controlledExecutionEvents[0] = replacement;

  assert.throws(() => executeGovernorAuthorizedChildOperation(governor, { ...authorization }, {
    operationPhase: "PROVIDER_FALLBACK",
    eligibleParentActionTypes: [decision.actionType],
    operation: () => assert.fail("replacement parent authorized a child")
  }), /EXECUTION_EVENT_PUBLIC_LEDGER_MISMATCH/);
  assert.equal(governor.executionLedger.controlledExecutionEvents.length, 1);
});

test("unregistered lookalike events and copied contexts cannot create child or provider authority", () => {
  const { governor, decision } = initialDecision("evaluation-unregistered-event");
  const completedLookalike = publicParentLookalike(governor, decision);
  governor.executionLedger.controlledExecutionEvents.push(completedLookalike);
  const completedContext = copiedAuthorizationForEvent(governor, decision, completedLookalike);

  assert.throws(() => executeGovernorAuthorizedChildOperation(governor, completedContext, {
    operationPhase: "PROVIDER_FALLBACK",
    eligibleParentActionTypes: [decision.actionType],
    operation: () => assert.fail("unregistered parent authorized a child")
  }), /EXECUTION_EVENT_NOT_REGISTERED/);

  const startedLookalike = publicParentLookalike(governor, decision, { status: "STARTED" });
  governor.executionLedger.controlledExecutionEvents[0] = startedLookalike;
  const startedContext = copiedAuthorizationForEvent(governor, decision, startedLookalike);
  assert.throws(() => bindGovernorProviderRequest(governor, startedContext, {}, {
    providerPhase: "INITIAL_PROVIDER_ACQUISITION"
  }), /no current Governor authorization/);
  assert.equal(governor.executionLedger.providerRequestOwnership.length, 0);
});

test("public event phase and lifecycle mutation or replacement cannot transition provider authority", () => {
  const statusCase = completedInitialParent("evaluation-mutated-event-status");
  statusCase.event.status = "STARTED";
  assert.throws(() => bindGovernorProviderRequest(statusCase.governor, statusCase.authorization, {}, {
    providerPhase: "INITIAL_PROVIDER_ACQUISITION"
  }), /no current Governor authorization/);
  assert.equal(statusCase.governor.executionLedger.providerRequestOwnership.length, 0);

  const phaseCase = completedInitialParent("evaluation-mutated-event-phase");
  phaseCase.event.operationPhase = "PROVIDER_FALLBACK";
  phaseCase.event.executionEventIdentity = calculateGovernorExecutionEventIdentity(phaseCase.event);
  assert.throws(() => executeGovernorAuthorizedChildOperation(phaseCase.governor, {
    ...phaseCase.authorization,
    operationPhase: "PROVIDER_FALLBACK"
  }, {
    operationPhase: "PROVIDER_FALLBACK",
    eligibleParentActionTypes: [phaseCase.decision.actionType],
    operation: () => assert.fail("mutated phase authorized a child")
  }), /EXECUTION_EVENT_PUBLIC_LEDGER_MISMATCH/);

  const replacementCase = completedInitialParent("evaluation-replaced-event-status");
  const replacement = {
    ...replacementCase.event,
    status: "STARTED"
  };
  replacement.executionEventIdentity = calculateGovernorExecutionEventIdentity(replacement);
  replacementCase.governor.executionLedger.controlledExecutionEvents[0] = replacement;
  assert.throws(() => bindGovernorProviderRequest(replacementCase.governor, {
    ...replacementCase.authorization,
    executionEventIdentity: replacement.executionEventIdentity
  }, {}, {
    providerPhase: "INITIAL_PROVIDER_ACQUISITION"
  }), /no current Governor authorization/);
  assert.equal(replacementCase.governor.executionLedger.providerRequestOwnership.length, 0);
});

test("parent synchronous success terminality survives lifecycle mutation and exact restoration", () => {
  runSynchronousParentTerminalityAttack({
    evaluationId: "evaluation-parent-sync-success-terminality",
    mode: "LIFECYCLE_MUTATION"
  });
});

test("parent synchronous failure terminality survives spread replacement and exact restoration", () => {
  runSynchronousParentTerminalityAttack({
    evaluationId: "evaluation-parent-sync-failure-terminality",
    mode: "SPREAD_REPLACEMENT",
    fail: true
  });
});

test("parent asynchronous success terminality survives public array replacement and restoration", async () => {
  await runAsynchronousParentTerminalityAttack({
    evaluationId: "evaluation-parent-async-success-terminality",
    mode: "ARRAY_REPLACEMENT"
  });
});

test("parent asynchronous failure terminality survives lookalike insertion and array restoration", async () => {
  await runAsynchronousParentTerminalityAttack({
    evaluationId: "evaluation-parent-async-failure-terminality",
    mode: "LOOKALIKE_INSERTION",
    fail: true
  });
});

test("child synchronous success terminality survives structured-clone replacement and restoration", () => {
  runSynchronousChildTerminalityAttack({
    evaluationId: "evaluation-child-sync-success-terminality",
    mode: "STRUCTURED_CLONE_REPLACEMENT"
  });
});

test("child synchronous failure terminality survives JSON replacement and byte-equivalent restoration", () => {
  runSynchronousChildTerminalityAttack({
    evaluationId: "evaluation-child-sync-failure-terminality",
    mode: "JSON_COPY_REPLACEMENT",
    fail: true,
    equivalentRestore: true
  });
});

test("child asynchronous success terminality survives phase forgery and public identity recomputation", async () => {
  await runAsynchronousChildTerminalityAttack({
    evaluationId: "evaluation-child-async-success-terminality",
    mode: "PHASE_AND_PUBLIC_IDENTITY_RECOMPUTATION"
  });
});

test("child asynchronous failure terminality survives lifecycle forgery and restoration", async () => {
  await runAsynchronousChildTerminalityAttack({
    evaluationId: "evaluation-child-async-failure-terminality",
    mode: "LIFECYCLE_MUTATION",
    fail: true
  });
});

test("parent terminality survives public event removal and exact restoration", () => {
  runSynchronousParentTerminalityAttack({
    evaluationId: "evaluation-parent-event-removal-terminality",
    mode: "EVENT_REMOVAL"
  });
});

test("child terminality survives in-place public event reordering and exact restoration", () => {
  runSynchronousChildTerminalityAttack({
    evaluationId: "evaluation-child-array-reordering-terminality",
    mode: "ARRAY_REORDERING"
  });
});

test("untampered parent and child terminal states remain monotonic while active provider binding stays valid", () => {
  const successful = initialDecision("evaluation-positive-parent-completion");
  let successfulAuthorization;
  executeGovernorAuthorizedAction(successful.governor, successful.decision, successful.decision.actionType, {
    operation: (authorization) => {
      successfulAuthorization = authorization;
      bindGovernorProviderRequest(successful.governor, authorization, {}, {
        providerPhase: "INITIAL_PROVIDER_ACQUISITION"
      });
    }
  });
  assert.equal(successful.governor.executionLedger.controlledExecutionEvents[0].status, "COMPLETED");
  for (const publicValue of [
    successfulAuthorization,
    successful.governor.executionLedger.controlledExecutionEvents[0]
  ]) {
    assert.equal(Reflect.ownKeys(publicValue).some((field) => typeof field !== "string"), false);
    assert.equal(Object.keys(publicValue).some((field) => /handle|private|registration/i.test(field)), false);
    assert.equal(Object.values(publicValue).some((value) => value && typeof value === "object"), false);
  }
  assertProviderAuthorityDenied(successful.governor, successfulAuthorization);
  assertProviderAuthorityDenied(successful.governor, successfulAuthorization);

  const failed = initialDecision("evaluation-positive-parent-failure");
  let failedAuthorization;
  assert.throws(() => executeGovernorAuthorizedAction(failed.governor, failed.decision, failed.decision.actionType, {
    operation: (authorization) => {
      failedAuthorization = authorization;
      throw new Error("ordinary-parent-failure");
    }
  }), /ordinary-parent-failure/);
  assert.equal(failed.governor.executionLedger.controlledExecutionEvents[0].status, "FAILED");
  assertProviderAuthorityDenied(failed.governor, failedAuthorization);

  const childSuccess = completedParentForChild("evaluation-positive-child-completion");
  let childSuccessAuthorization;
  childSuccess.executeChild((authorization) => {
    childSuccessAuthorization = authorization;
    bindGovernorProviderRequest(childSuccess.governor, authorization, {}, {
      providerPhase: "PROVIDER_FALLBACK"
    });
  });
  assert.equal(childSuccess.governor.executionLedger.controlledExecutionEvents.at(-1).status, "COMPLETED");
  assertProviderAuthorityDenied(childSuccess.governor, childSuccessAuthorization);

  const childFailure = completedParentForChild("evaluation-positive-child-failure");
  let childFailureAuthorization;
  assert.throws(() => childFailure.executeChild((authorization) => {
    childFailureAuthorization = authorization;
    throw new Error("ordinary-child-failure");
  }), /ordinary-child-failure/);
  assert.equal(childFailure.governor.executionLedger.controlledExecutionEvents.at(-1).status, "FAILED");
  assertProviderAuthorityDenied(childFailure.governor, childFailureAuthorization);
});

test("executor failure metadata cannot suppress private terminality", () => {
  const { governor, decision } = initialDecision("evaluation-hostile-failure-metadata");
  const failure = new Error("hostile-failure-metadata");
  Object.defineProperty(failure, "code", {
    get() {
      throw new Error("failure-code-getter-must-not-control-terminality");
    }
  });
  let authorization;
  assert.throws(() => executeGovernorAuthorizedAction(governor, decision, decision.actionType, {
    operation: (context) => {
      authorization = context;
      throw failure;
    }
  }), (error) => error === failure);
  assert.equal(governor.executionLedger.controlledExecutionEvents[0].status, "FAILED");
  assert.equal(governor.executionLedger.controlledExecutionEvents[0].errorCode, "OPERATION_FAILED");
  assertProviderAuthorityDenied(governor, authorization);
});

test("cycle and duplicate stops are canonically finalized and ledger-bound without stale continuation authority", () => {
  const cycleGovernor = createCognitiveGovernor({ evaluationId: "evaluation-canonical-cycle" });
  const cycleSnapshot = snapshot({ evaluationId: "evaluation-canonical-cycle" });
  const first = decideCognitiveAction(cycleGovernor, cycleSnapshot, { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  const cycleStop = decideCognitiveAction(cycleGovernor, cycleSnapshot, { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(first.canonicalDecision.nextActionClass, "ADVANCE_WITHIN_EXISTING_AUTHORITY");
  assert.equal(cycleStop.canonicalDecision.nextActionClass, "STOP_REPEATED_LOOP");
  assert.equal(cycleStop.canonicalDecision.repeatedLoopDetected, true);
  assert.equal(cycleStop.canonicalDecision.selectedActionId, null);
  assert.equal(cycleStop.canonicalDecision.actionEvidenceBinding.actionId, COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE);
  const cycleLedger = cycleGovernor.executionLedger.decisionInvocations.at(-1);
  assert.equal(cycleLedger.canonicalDecision, cycleStop.canonicalDecision);
  assert.equal(cycleLedger.canonicalDecisionHash, cycleStop.canonicalDecisionHash);
  assert.notEqual(cycleLedger.canonicalDecisionHash, first.canonicalDecisionHash);

  const probeGovernor = createCognitiveGovernor({ evaluationId: "evaluation-canonical-duplicate" });
  const duplicateSnapshot = snapshot({ evaluationId: "evaluation-canonical-duplicate" });
  const probe = decideCognitiveAction(probeGovernor, duplicateSnapshot, { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  const duplicateGovernor = createCognitiveGovernor({ evaluationId: "evaluation-canonical-duplicate" });
  duplicateGovernor.actionLedger.push({
    actionType: "SYNTHETIC_NONMATCHING_HISTORY",
    actionSignature: probe.actionSignature,
    targetIdentity: "synthetic-history"
  });
  const duplicateStop = decideCognitiveAction(duplicateGovernor, duplicateSnapshot, { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION });
  assert.equal(duplicateStop.canonicalDecision.nextActionClass, "STOP_REPEATED_LOOP");
  assert.equal(duplicateStop.canonicalDecision.duplicateActionDetected, true);
  assert.equal(duplicateStop.canonicalDecision.selectedActionId, null);
  const duplicateLedger = duplicateGovernor.executionLedger.decisionInvocations.at(-1);
  assert.equal(duplicateLedger.canonicalDecisionHash, duplicateStop.canonicalDecisionHash);
  assert.equal(duplicateLedger.canonicalDecisionIdentity, duplicateStop.canonicalDecisionIdentity);
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
      assert.equal(first.logicalProviderRequestIdentity, calculateLogicalProviderRequestIdentity(first));
      assert.equal(second.logicalProviderRequestIdentity, calculateLogicalProviderRequestIdentity(second));
      assert.notEqual(first.logicalProviderRequestIdentity, second.logicalProviderRequestIdentity);
    }
  });
  assert.equal(governor.executionLedger.decisionInvocations.length, 1);
  assert.equal(governor.executionLedger.controlledExecutionEvents.length, 1);
  assert.equal(governor.executionLedger.providerRequestOwnership.length, 2);
  assert.equal(governor.executionLedger.unauthorizedExecutionAttempts.length, 0);
  assert.equal("logicalProviderRequestIdentity" in governor.executionLedger.controlledExecutionEvents[0], false);
});

test("a request-specific child binds its logical provider identity without a circular execution hash", () => {
  const { governor, decision } = initialDecision("evaluation-request-child");
  let parentAuthorization;
  executeGovernorAuthorizedAction(governor, decision, COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE, {
    operation: (authorization) => { parentAuthorization = authorization; }
  });
  const logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity({
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    evaluationIdentity: governor.executionLedger.evaluationIdentity,
    providerRequestSequence: 1,
    parentGovernorActionType: decision.actionType,
    parentGovernorActionSignature: decision.actionSignature,
    providerOperationPhase: "LIMITED_RESULT_RECOVERY"
  });
  const requestRecord = {
    query: "request-specific child",
    physicalAttemptCount: 1,
    physicalRetryAttemptCount: 0,
    physicalAttempts: [{ attempt: 1, retry: false }]
  };
  executeGovernorAuthorizedChildOperation(governor, parentAuthorization, {
    operationPhase: "LIMITED_RESULT_RECOVERY",
    eligibleParentActionTypes: [COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE],
    logicalProviderRequestIdentity,
    operation: (authorization) => bindGovernorProviderRequest(governor, authorization, requestRecord, {
      providerPhase: "LIMITED_RESULT_RECOVERY"
    })
  });
  const child = governor.executionLedger.controlledExecutionEvents.at(-1);
  assert.equal(child.logicalProviderRequestIdentity, logicalProviderRequestIdentity);
  assert.equal(child.executionEventIdentity, calculateGovernorExecutionEventIdentity(child));
  assert.equal(requestRecord.logicalProviderRequestIdentity, logicalProviderRequestIdentity);
  assert.equal(requestRecord.controlledExecutionEventIdentity, child.executionEventIdentity);
});
