import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import test from "node:test";
import {
  GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
  buildGovernorExecutionProof,
  calculateGovernorDecisionIdentity,
  calculateGovernorExecutionEventIdentity,
  calculateGovernorLifecycleEventIdentity,
  calculateLogicalProviderRequestIdentity
} from "../lib/cognitive-governor/index.js";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";
import { validateGovernorProof } from "../benchmarks/blind-object-v1-execution-v1/scripts/governor-proof-validator.mjs";

const EVALUATION = "governed-evaluation-a";
const GOVERNOR = "governor-a";

function withHash(value, field) {
  const unhashed = { ...value, [field]: "" };
  return { ...unhashed, [field]: sha256Object(unhashed) };
}

function rehashProof(proof) {
  proof.proofHash = "";
  proof.proofHash = sha256Object(proof);
  return proof;
}

function lifecycleEvent(eventType, sequence, overrides = {}) {
  const event = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    evaluationIdentity: EVALUATION,
    sequence,
    eventType,
    governorIdentity: GOVERNOR,
    cognitiveStateIdentity: eventType === "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED" ? "cognitive-state-a" : "",
    objectMindStateId: eventType === "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED" ? "object-state-a" : "",
    initialKnowledgeStateHash: eventType === "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED" ? "a".repeat(64) : "",
    lifecycleEventIdentity: "",
    ...overrides
  };
  event.lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(event);
  return event;
}

function decision(sequence, actionType, actionSignature, overrides = {}) {
  const record = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    evaluationIdentity: EVALUATION,
    sequence,
    actionType,
    actionSignature,
    targetIdentity: `target-${sequence}`,
    reasonCodes: [sequence === 1 ? "INITIAL_PLAN_READY" : "EVALUATION_COMPLETE"],
    executionPermitted: true,
    selectedButNonexecutedTerminal: false,
    inputCognitiveStateHash: String(sequence).repeat(64),
    inputKnowledgeStateHash: sequence === 1 ? "a".repeat(64) : "b".repeat(64),
    outputCognitiveStateHash: String(sequence + 1).repeat(64),
    outputKnowledgeStateHash: "b".repeat(64),
    outcomeCode: sequence === 1 ? "INITIAL_ACQUISITION_COMPLETED" : "EVALUATION_COMPLETE",
    materialKnowledgeChanged: sequence === 1,
    decisionIdentity: "",
    ...overrides
  };
  record.decisionIdentity = calculateGovernorDecisionIdentity(record);
  return record;
}

function execution(sequence, decisionRecord, operationPhase, overrides = {}) {
  const event = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    evaluationIdentity: EVALUATION,
    sequence,
    eventRole: "PARENT",
    operationKind: "PARENT_ACTION",
    operationPhase,
    actionType: decisionRecord.actionType,
    actionSignature: decisionRecord.actionSignature,
    controlledOperationType: operationPhase,
    parentGovernorActionType: decisionRecord.actionType,
    parentGovernorActionSignature: decisionRecord.actionSignature,
    decisionInvocationSequence: decisionRecord.sequence,
    parentExecutionEventIdentity: "",
    childPhase: "",
    executionEventIdentity: "",
    status: "COMPLETED",
    errorCode: "",
    ...overrides
  };
  event.executionEventIdentity = calculateGovernorExecutionEventIdentity(event);
  return event;
}

function childExecution(sequence, parent, childPhase, overrides = {}) {
  const event = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    evaluationIdentity: EVALUATION,
    sequence,
    eventRole: "CHILD",
    operationKind: "CHILD_OPERATION",
    operationPhase: childPhase,
    actionType: parent.actionType,
    actionSignature: parent.actionSignature,
    controlledOperationType: "CHILD_OPERATION",
    parentGovernorActionType: parent.parentGovernorActionType,
    parentGovernorActionSignature: parent.parentGovernorActionSignature,
    decisionInvocationSequence: parent.decisionInvocationSequence,
    parentExecutionEventIdentity: parent.executionEventIdentity,
    childPhase,
    executionEventIdentity: "",
    status: "COMPLETED",
    errorCode: "",
    ...overrides
  };
  event.executionEventIdentity = calculateGovernorExecutionEventIdentity(event);
  return event;
}

function providerRecord(sequence, parent, providerOperationPhase = parent.operationPhase, overrides = {}) {
  const record = {
    proofSchemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    evaluationIdentity: EVALUATION,
    providerRequestSequence: sequence,
    governorScopeClassification: "GOVERNOR_CONTROLLED",
    parentGovernorActionType: parent.parentGovernorActionType,
    parentGovernorActionSignature: parent.parentGovernorActionSignature,
    controlledExecutionEventIdentity: parent.executionEventIdentity,
    providerOperationPhase,
    logicalProviderRequestIdentity: "",
    logicalQueryAttempted: true,
    physicalAttemptCount: 1,
    physicalRetryAttemptCount: 0,
    physicalAttempts: [{ attempt: 1, retry: false, provider: "synthetic", outcome: "succeeded" }],
    ...overrides
  };
  record.logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity(record);
  return record;
}

function proofFixture({ withLesson = true, withProvider = true } = {}) {
  const experienceRecord = withHash({ schemaVersion: "1.0", objectStateId: "object-a", experienceRecordHash: "" }, "experienceRecordHash");
  const cognitiveEpisode = withHash({
    schemaVersion: "1.0",
    terminalStatus: "COMPLETE",
    linkedExperienceRecordHash: experienceRecord.experienceRecordHash,
    blockedDuplicateActions: [],
    cycleDetections: [],
    cognitiveEpisodeHash: ""
  }, "cognitiveEpisodeHash");
  const lessonCandidate = withLesson ? withHash({
    schemaVersion: "1.0",
    status: "UNVALIDATED",
    promotionAuthorized: false,
    cognitiveEpisodeHash: cognitiveEpisode.cognitiveEpisodeHash,
    lessonCandidateHash: ""
  }, "lessonCandidateHash") : null;
  const decisions = [
    decision(1, "ACQUIRE_INITIAL_EVIDENCE", "cognitive-action-acquire"),
    decision(2, "STOP_COMPLETE", "cognitive-action-stop")
  ];
  const executions = [
    execution(1, decisions[0], "INITIAL_PROVIDER_ACQUISITION"),
    execution(2, decisions[1], "TERMINAL_STOP_TRANSITION")
  ];
  const providerRequests = withProvider ? [providerRecord(1, executions[0], "INITIAL_PROVIDER_ACQUISITION", {
    physicalAttemptCount: 2,
    physicalRetryAttemptCount: 1,
    physicalAttempts: [
      { attempt: 1, retry: false, provider: "synthetic", outcome: "failed" },
      { attempt: 2, retry: true, provider: "synthetic", outcome: "succeeded" }
    ]
  })] : [];
  const governor = { executionLedger: {
    evaluationIdentity: EVALUATION,
    lifecycleEvents: [
      lifecycleEvent("GOVERNOR_CONSTRUCTED", 1),
      lifecycleEvent("AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED", 2)
    ],
    cognitiveStateSnapshotCount: 2,
    decisionInvocations: decisions,
    controlledExecutionEvents: executions,
    unauthorizedExecutionAttempts: [],
    providerRequestOwnership: []
  } };
  const proof = buildGovernorExecutionProof({
    governor,
    cognitiveEpisode,
    lessonCandidate,
    experienceRecord,
    providerRequests,
    providerCapacity: { maximum: 12, consumed: withProvider ? 2 : 0 },
    directPageCapacity: { maximum: 2, consumed: 0 }
  });
  return { proof, cognitiveEpisode, lessonCandidate, experienceRecord };
}

function validation(fixture) {
  return validateGovernorProof(fixture);
}

function failure(fixture, code) {
  return validation(fixture).failures.some((entry) => entry.code === code);
}

function addChild(fixture, childPhase, { parentIndex = 0, provider = false, requestSpecific = false } = {}) {
  const parent = fixture.proof.controlledExecutionEvents[parentIndex];
  let providerEntry = null;
  let child;
  if (requestSpecific) {
    providerEntry = providerRecord(fixture.proof.providerRequestOwnership.length + 1, parent, childPhase);
    child = childExecution(fixture.proof.controlledExecutionEvents.length + 1, parent, childPhase, {
      logicalProviderRequestIdentity: providerEntry.logicalProviderRequestIdentity
    });
    providerEntry.controlledExecutionEventIdentity = child.executionEventIdentity;
  } else {
    child = childExecution(fixture.proof.controlledExecutionEvents.length + 1, parent, childPhase);
    if (provider) providerEntry = providerRecord(fixture.proof.providerRequestOwnership.length + 1, child, childPhase);
  }
  fixture.proof.controlledExecutionEvents.push(child);
  if (providerEntry) fixture.proof.providerRequestOwnership.push(providerEntry);
  rehashProof(fixture.proof);
  return { child, provider: providerEntry };
}

test("valid current proof independently validates lifecycle, Episode, Experience, Lesson, attempts, and ceilings", () => {
  const fixture = proofFixture();
  const result = validation(fixture);
  assert.equal(result.passed, true, JSON.stringify(result.failures));
  assert.deepEqual(result.recalculated, {
    governorInvocationCount: 1,
    authoritativeCognitiveStateCount: 1,
    unauthorizedActionCount: 0
  });
  assert(Object.values(result.integrity).every(Boolean));
});

test("missing Governor lifecycle event fails even when the stored count remains one", () => {
  const fixture = proofFixture();
  fixture.proof.lifecycleEvents.shift();
  fixture.proof.lifecycleEvents[0].sequence = 1;
  fixture.proof.lifecycleEvents[0].lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(fixture.proof.lifecycleEvents[0]);
  rehashProof(fixture.proof);
  assert(failure(fixture, "GOVERNOR_COUNT_MISMATCH"));
  assert(failure(fixture, "GOVERNOR_INVOCATION_COUNT_INVALID"));
});

test("duplicate Governor lifecycle events and a forged stored count fail", () => {
  const fixture = proofFixture();
  const authority = fixture.proof.lifecycleEvents[1];
  const duplicate = lifecycleEvent("GOVERNOR_CONSTRUCTED", 2);
  authority.sequence = 3;
  authority.lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(authority);
  fixture.proof.lifecycleEvents.splice(1, 0, duplicate);
  rehashProof(fixture.proof);
  assert(failure(fixture, "GOVERNOR_COUNT_MISMATCH"));
  assert(failure(fixture, "GOVERNOR_INVOCATION_COUNT_INVALID"));
});

test("zero Governor lifecycle events cannot be concealed by a stored count of one", () => {
  const fixture = proofFixture();
  fixture.proof.lifecycleEvents = fixture.proof.lifecycleEvents.filter((event) => event.eventType !== "GOVERNOR_CONSTRUCTED");
  fixture.proof.lifecycleEvents[0].sequence = 1;
  fixture.proof.lifecycleEvents[0].lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(fixture.proof.lifecycleEvents[0]);
  rehashProof(fixture.proof);
  assert(failure(fixture, "GOVERNOR_COUNT_MISMATCH"));
});

test("one authoritative-state lifecycle event passes", () => {
  assert.equal(validation(proofFixture()).recalculated.authoritativeCognitiveStateCount, 1);
});

test("missing authoritative-state lifecycle event fails", () => {
  const fixture = proofFixture();
  fixture.proof.lifecycleEvents.pop();
  rehashProof(fixture.proof);
  assert(failure(fixture, "AUTHORITATIVE_STATE_COUNT_MISMATCH"));
  assert(failure(fixture, "AUTHORITATIVE_STATE_COUNT_INVALID"));
});

test("duplicate authoritative-state lifecycle events fail", () => {
  const fixture = proofFixture();
  fixture.proof.lifecycleEvents.push(lifecycleEvent("AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED", 3, { cognitiveStateIdentity: "state-b" }));
  rehashProof(fixture.proof);
  assert(failure(fixture, "AUTHORITATIVE_STATE_COUNT_MISMATCH"));
  assert(failure(fixture, "AUTHORITATIVE_STATE_COUNT_INVALID"));
});

test("forged authoritative-state scalar count fails", () => {
  const fixture = proofFixture();
  fixture.proof.authoritativeCognitiveStateCount = 2;
  rehashProof(fixture.proof);
  assert(failure(fixture, "AUTHORITATIVE_STATE_COUNT_MISMATCH"));
});

test("foreign lifecycle evaluation identity fails after its event identity is recomputed", () => {
  const fixture = proofFixture();
  fixture.proof.lifecycleEvents[0].evaluationIdentity = "foreign-evaluation";
  fixture.proof.lifecycleEvents[0].lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(fixture.proof.lifecycleEvents[0]);
  rehashProof(fixture.proof);
  assert(failure(fixture, "LIFECYCLE_EVALUATION_MISMATCH"));
});

test("duplicate or noncontiguous lifecycle sequences fail", () => {
  for (const sequence of [1, 4]) {
    const fixture = proofFixture();
    fixture.proof.lifecycleEvents[1].sequence = sequence;
    fixture.proof.lifecycleEvents[1].lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(fixture.proof.lifecycleEvents[1]);
    rehashProof(fixture.proof);
    assert(failure(fixture, sequence === 1 ? "LIFECYCLE_SEQUENCE_DUPLICATE" : "LIFECYCLE_SEQUENCE_INVALID"));
  }
});

test("valid execution-event identities recalculate", () => {
  const fixture = proofFixture();
  assert.equal(validation(fixture).integrity.executionEventIdentity, true);
});

test("execution-event field mutation invalidates its stored identity", () => {
  const fixture = proofFixture({ withProvider: false });
  fixture.proof.controlledExecutionEvents[0].controlledOperationType = "MUTATED";
  rehashProof(fixture.proof);
  assert(failure(fixture, "EXECUTION_IDENTITY_INVALID"));
});

test("duplicate executionEventIdentity values fail", () => {
  const fixture = proofFixture({ withProvider: false });
  fixture.proof.controlledExecutionEvents[1].executionEventIdentity = fixture.proof.controlledExecutionEvents[0].executionEventIdentity;
  rehashProof(fixture.proof);
  assert(failure(fixture, "EXECUTION_IDENTITY_DUPLICATE"));
});

test("duplicate and noncontiguous execution sequences fail", () => {
  for (const sequence of [1, 4]) {
    const fixture = proofFixture({ withProvider: false });
    fixture.proof.controlledExecutionEvents[1].sequence = sequence;
    fixture.proof.controlledExecutionEvents[1].executionEventIdentity = calculateGovernorExecutionEventIdentity(fixture.proof.controlledExecutionEvents[1]);
    rehashProof(fixture.proof);
    assert(failure(fixture, sequence === 1 ? "EXECUTION_SEQUENCE_DUPLICATE" : "EXECUTION_SEQUENCE_INVALID"));
  }
});

test("foreign parent execution evaluation identity fails", () => {
  const fixture = proofFixture({ withProvider: false });
  fixture.proof.controlledExecutionEvents[0].evaluationIdentity = "foreign-evaluation";
  fixture.proof.controlledExecutionEvents[0].executionEventIdentity = calculateGovernorExecutionEventIdentity(fixture.proof.controlledExecutionEvents[0]);
  rehashProof(fixture.proof);
  assert(failure(fixture, "EXECUTION_EVALUATION_MISMATCH"));
});

test("foreign child execution evaluation identity fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const { child } = addChild(fixture, "LIMITED_RESULT_RECOVERY");
  child.evaluationIdentity = "foreign-evaluation";
  child.executionEventIdentity = calculateGovernorExecutionEventIdentity(child);
  rehashProof(fixture.proof);
  assert(failure(fixture, "EXECUTION_EVALUATION_MISMATCH"));
  assert(failure(fixture, "CHILD_EXECUTION_PARENT_INVALID"));
});

test("unknown child parent identity fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const { child } = addChild(fixture, "LIMITED_RESULT_RECOVERY");
  child.parentExecutionEventIdentity = "unknown-parent";
  child.executionEventIdentity = calculateGovernorExecutionEventIdentity(child);
  rehashProof(fixture.proof);
  assert(failure(fixture, "CHILD_EXECUTION_PARENT_INVALID"));
});

test("child-parent signature mismatch fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const { child } = addChild(fixture, "LIMITED_RESULT_RECOVERY");
  child.parentGovernorActionSignature = "foreign-signature";
  child.actionSignature = "foreign-signature";
  child.executionEventIdentity = calculateGovernorExecutionEventIdentity(child);
  rehashProof(fixture.proof);
  assert(failure(fixture, "CHILD_EXECUTION_PARENT_INVALID"));
});

test("duplicate selected decision signatures fail before map construction", () => {
  const fixture = proofFixture({ withProvider: false });
  fixture.proof.selectedDecisions[0].actionSignature = fixture.proof.selectedDecisions[1].actionSignature;
  fixture.proof.selectedDecisions[0].decisionIdentity = calculateGovernorDecisionIdentity(fixture.proof.selectedDecisions[0]);
  rehashProof(fixture.proof);
  assert(failure(fixture, "DECISION_SIGNATURE_DUPLICATE"));
});

test("duplicate and noncontiguous selected-decision sequences fail", () => {
  for (const sequence of [1, 4]) {
    const fixture = proofFixture({ withProvider: false });
    fixture.proof.selectedDecisions[1].sequence = sequence;
    fixture.proof.selectedDecisions[1].decisionIdentity = calculateGovernorDecisionIdentity(fixture.proof.selectedDecisions[1]);
    rehashProof(fixture.proof);
    assert(failure(fixture, sequence === 1 ? "DECISION_SEQUENCE_DUPLICATE" : "DECISION_SEQUENCE_INVALID"));
  }
});

test("foreign decision ownership and canonical decision-field mutation fail", () => {
  const foreign = proofFixture({ withProvider: false });
  foreign.proof.selectedDecisions[0].evaluationIdentity = "foreign-evaluation";
  foreign.proof.selectedDecisions[0].decisionIdentity = calculateGovernorDecisionIdentity(foreign.proof.selectedDecisions[0]);
  rehashProof(foreign.proof);
  assert(failure(foreign, "DECISION_EVALUATION_MISMATCH"));

  const mutated = proofFixture({ withProvider: false });
  mutated.proof.selectedDecisions[0].targetIdentity = "mutated-target";
  rehashProof(mutated.proof);
  assert(failure(mutated, "DECISION_IDENTITY_INVALID"));
});

test("one action signature used by one parent execution passes", () => {
  assert.equal(validation(proofFixture()).passed, true);
});

test("selected terminal work remains valid without a provider request", () => {
  const fixture = proofFixture();
  const terminal = fixture.proof.terminalDecision;
  assert.equal(terminal.actionType, "STOP_COMPLETE");
  assert.equal(
    fixture.proof.providerRequestOwnership.some((provider) => provider.parentGovernorActionSignature === terminal.actionSignature),
    false
  );
  assert.equal(validation(fixture).passed, true);
});

test("one action signature used by two parent executions fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const duplicate = execution(3, fixture.proof.selectedDecisions[0], "SECOND_ACQUISITION");
  fixture.proof.controlledExecutionEvents.push(duplicate);
  rehashProof(fixture.proof);
  assert(failure(fixture, "PARENT_SIGNATURE_REUSED"));
});

test("changing sequence and identity cannot conceal parent signature reuse", () => {
  const fixture = proofFixture({ withProvider: false });
  const duplicate = execution(3, fixture.proof.selectedDecisions[0], "DIFFERENT_PHASE", { errorCode: "different" });
  fixture.proof.controlledExecutionEvents.push(duplicate);
  rehashProof(fixture.proof);
  assert.notEqual(duplicate.executionEventIdentity, fixture.proof.controlledExecutionEvents[0].executionEventIdentity);
  assert(failure(fixture, "PARENT_SIGNATURE_REUSED"));
});

test("unknown parent signature fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const parent = fixture.proof.controlledExecutionEvents[0];
  parent.actionSignature = "unknown-signature";
  parent.parentGovernorActionSignature = "unknown-signature";
  parent.executionEventIdentity = calculateGovernorExecutionEventIdentity(parent);
  rehashProof(fixture.proof);
  assert(failure(fixture, "EXECUTION_AUTHORIZATION_INVALID"));
});

test("parent action-type mismatch fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const parent = fixture.proof.controlledExecutionEvents[0];
  parent.actionType = "REFINE_EVIDENCE_SEARCH";
  parent.parentGovernorActionType = "REFINE_EVIDENCE_SEARCH";
  parent.executionEventIdentity = calculateGovernorExecutionEventIdentity(parent);
  rehashProof(fixture.proof);
  assert(failure(fixture, "EXECUTION_AUTHORIZATION_INVALID"));
});

test("a signature attached to a foreign-evaluation parent fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const parent = fixture.proof.controlledExecutionEvents[0];
  parent.evaluationIdentity = "foreign-evaluation";
  parent.executionEventIdentity = calculateGovernorExecutionEventIdentity(parent);
  rehashProof(fixture.proof);
  assert(failure(fixture, "EXECUTION_AUTHORIZATION_INVALID"));
});

test("multiple logical provider requests under one valid parent pass", () => {
  const fixture = proofFixture({ withProvider: false });
  const parent = fixture.proof.controlledExecutionEvents[0];
  fixture.proof.providerRequestOwnership.push(providerRecord(1, parent), providerRecord(2, parent));
  rehashProof(fixture.proof);
  assert.equal(validation(fixture).passed, true, JSON.stringify(validation(fixture).failures));
});

test("multiple physical attempts and one nested retry under one logical request pass without extra decisions or parents", () => {
  const fixture = proofFixture();
  assert.equal(validation(fixture).passed, true);
  assert.equal(fixture.proof.selectedDecisions.length, 2);
  assert.equal(fixture.proof.controlledExecutionEvents.filter((event) => event.eventRole === "PARENT").length, 2);
  assert.equal(fixture.proof.providerRequestOwnership[0].physicalAttempts.length, 2);
});

test("provider fallback beneath an eligible acquisition parent passes", () => {
  const fixture = proofFixture({ withProvider: false });
  const { child } = addChild(fixture, "PROVIDER_FALLBACK", { provider: true });
  fixture.proof.providerRequestOwnership.push(providerRecord(2, child, "PROVIDER_FALLBACK"));
  rehashProof(fixture.proof);
  assert.equal(validation(fixture).passed, true, JSON.stringify(validation(fixture).failures));
});

test("limited recovery beneath acquisition passes", () => {
  const fixture = proofFixture({ withProvider: false });
  addChild(fixture, "LIMITED_RESULT_RECOVERY", { provider: true });
  assert.equal(validation(fixture).passed, true, JSON.stringify(validation(fixture).failures));
});

test("limited recovery beneath refinement passes", () => {
  const fixture = proofFixture({ withProvider: false });
  const refinementDecision = fixture.proof.selectedDecisions[0];
  refinementDecision.actionType = "REFINE_EVIDENCE_SEARCH";
  refinementDecision.actionSignature = "cognitive-action-refine";
  refinementDecision.decisionIdentity = calculateGovernorDecisionIdentity(refinementDecision);
  const refinementParent = fixture.proof.controlledExecutionEvents[0];
  Object.assign(refinementParent, {
    actionType: refinementDecision.actionType,
    actionSignature: refinementDecision.actionSignature,
    parentGovernorActionType: refinementDecision.actionType,
    parentGovernorActionSignature: refinementDecision.actionSignature,
    operationPhase: "REFINEMENT_PROVIDER_SEARCH",
    controlledOperationType: "REFINEMENT_PROVIDER_SEARCH"
  });
  refinementParent.executionEventIdentity = calculateGovernorExecutionEventIdentity(refinementParent);
  rehashProof(fixture.proof);
  addChild(fixture, "LIMITED_RESULT_RECOVERY", { provider: true });
  assert.equal(validation(fixture).passed, true, JSON.stringify(validation(fixture).failures));
});

test("limited recovery without an eligible parent fails", () => {
  const fixture = proofFixture({ withProvider: false });
  addChild(fixture, "LIMITED_RESULT_RECOVERY", { parentIndex: 1, provider: true });
  assert(failure(fixture, "LIMITED_RECOVERY_PARENT_INVALID"));
});

test("governed provider record without a valid parent execution fails", () => {
  const fixture = proofFixture();
  fixture.proof.providerRequestOwnership[0].controlledExecutionEventIdentity = "unknown-execution";
  rehashProof(fixture.proof);
  assert(failure(fixture, "PROVIDER_PARENT_EXECUTION_UNKNOWN"));
  assert(failure(fixture, "PROVIDER_OWNERSHIP_INVALID"));
});

test("governed provider record with missing evaluation ownership fails", () => {
  const fixture = proofFixture();
  const provider = fixture.proof.providerRequestOwnership[0];
  provider.evaluationIdentity = "";
  provider.logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity(provider);
  rehashProof(fixture.proof);
  assert(failure(fixture, "PROVIDER_EVALUATION_MISSING"));
  assert(failure(fixture, "PROVIDER_OWNERSHIP_INVALID"));
});

test("governed provider parent-signature mismatch fails", () => {
  const fixture = proofFixture();
  const provider = fixture.proof.providerRequestOwnership[0];
  provider.parentGovernorActionSignature = "foreign-signature";
  provider.logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity(provider);
  rehashProof(fixture.proof);
  assert(failure(fixture, "PROVIDER_OWNERSHIP_INVALID"));
});

test("logical provider-request identity mismatch fails", () => {
  const fixture = proofFixture();
  fixture.proof.providerRequestOwnership[0].logicalProviderRequestIdentity = "forged-logical-request";
  rehashProof(fixture.proof);
  assert(failure(fixture, "PROVIDER_OWNERSHIP_INVALID"));
});

test("foreign governed-provider evaluation fails after logical identity recomputation", () => {
  const fixture = proofFixture();
  const provider = fixture.proof.providerRequestOwnership[0];
  provider.evaluationIdentity = "foreign-evaluation";
  provider.logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity(provider);
  rehashProof(fixture.proof);
  const result = validation(fixture);
  assert(result.failures.some((entry) => entry.code === "PROVIDER_EVALUATION_MISMATCH"));
  assert.equal(result.integrity.evaluationIdentity, false);
});

test("request-specific child identity binds exactly one logical provider request", () => {
  const fixture = proofFixture({ withProvider: false });
  addChild(fixture, "LIMITED_RESULT_RECOVERY", { requestSpecific: true });
  assert.equal(validation(fixture).passed, true, JSON.stringify(validation(fixture).failures));
});

test("request-specific child logical identity mismatch fails", () => {
  const fixture = proofFixture({ withProvider: false });
  const { child } = addChild(fixture, "LIMITED_RESULT_RECOVERY", { requestSpecific: true });
  child.logicalProviderRequestIdentity = "different-logical-request";
  child.executionEventIdentity = calculateGovernorExecutionEventIdentity(child);
  fixture.proof.providerRequestOwnership[0].controlledExecutionEventIdentity = child.executionEventIdentity;
  rehashProof(fixture.proof);
  const result = validation(fixture);
  assert(result.failures.some((entry) => entry.code === "EXECUTION_PROVIDER_BINDING_INVALID"));
  assert(result.failures.some((entry) => entry.code === "PROVIDER_OWNERSHIP_INVALID"));
  assert.equal(result.integrity.providerOwnership, false);
});

test("scalar count mutation cannot conceal lifecycle truth", () => {
  const fixture = proofFixture();
  fixture.proof.governorInvocationCount = 7;
  rehashProof(fixture.proof);
  assert(failure(fixture, "GOVERNOR_COUNT_MISMATCH"));
});

test("proof hash includes lifecycle, decision, execution, and provider ownership fields", () => {
  for (const mutate of [
    (proof) => { proof.lifecycleEvents[0].governorIdentity = "mutated"; proof.lifecycleEvents[0].lifecycleEventIdentity = calculateGovernorLifecycleEventIdentity(proof.lifecycleEvents[0]); },
    (proof) => { proof.selectedDecisions[0].targetIdentity = "mutated"; proof.selectedDecisions[0].decisionIdentity = calculateGovernorDecisionIdentity(proof.selectedDecisions[0]); },
    (proof) => { proof.controlledExecutionEvents[0].controlledOperationType = "mutated"; proof.controlledExecutionEvents[0].executionEventIdentity = calculateGovernorExecutionEventIdentity(proof.controlledExecutionEvents[0]); },
    (proof) => { proof.providerRequestOwnership[0].providerOperationPhase = "mutated"; proof.providerRequestOwnership[0].logicalProviderRequestIdentity = calculateLogicalProviderRequestIdentity(proof.providerRequestOwnership[0]); }
  ]) {
    const fixture = proofFixture();
    mutate(fixture.proof);
    assert(failure(fixture, "PROOF_HASH_INVALID"));
  }
});

test("semantically invalid proof still fails after its hash is recomputed", () => {
  const fixture = proofFixture({ withProvider: false });
  fixture.proof.selectedDecisions[0].actionSignature = fixture.proof.selectedDecisions[1].actionSignature;
  fixture.proof.selectedDecisions[0].decisionIdentity = calculateGovernorDecisionIdentity(fixture.proof.selectedDecisions[0]);
  rehashProof(fixture.proof);
  const result = validation(fixture);
  assert.equal(result.failures.some((entry) => entry.code === "PROOF_HASH_INVALID"), false);
  assert.equal(result.passed, false);
  assert(result.failures.some((entry) => entry.code === "DECISION_SIGNATURE_DUPLICATE"));
});

test("prior-schema artifacts are explicit and never silently pass current validation", () => {
  const fixture = proofFixture();
  fixture.proof.schemaVersion = "1.0";
  rehashProof(fixture.proof);
  const result = validation(fixture);
  assert.equal(result.passed, false);
  assert(result.failures.some((entry) => entry.code === "PROOF_SCHEMA_PRIOR_ARTIFACT"));
});

test("Episode mutation and Experience link mismatch fail integrity validation", () => {
  const episodeMutation = proofFixture();
  episodeMutation.cognitiveEpisode.terminalStatus = "INSUFFICIENT_EVIDENCE";
  assert(failure(episodeMutation, "COGNITIVE_EPISODE_HASH_INVALID"));
  const linkMutation = proofFixture();
  linkMutation.cognitiveEpisode.linkedExperienceRecordHash = "f".repeat(64);
  assert(failure(linkMutation, "EXPERIENCE_LINK_INVALID"));
});

test("Lesson mutation, validation status, and promotion are rejected", () => {
  const hashMutation = proofFixture();
  hashMutation.lessonCandidate.status = "MUTATED";
  assert(failure(hashMutation, "LESSON_HASH_INVALID"));
  assert(failure(hashMutation, "LESSON_STATUS_INVALID"));
  const promotionMutation = proofFixture();
  promotionMutation.lessonCandidate = withHash({ ...promotionMutation.lessonCandidate, promotionAuthorized: true }, "lessonCandidateHash");
  assert(failure(promotionMutation, "LESSON_PROMOTION_INVALID"));
});

test("unauthorized records cannot be concealed by scalar mutation", () => {
  const fixture = proofFixture();
  fixture.proof.unauthorizedExecutionAttempts.push({ reasonCode: "AUTHORIZATION_MISSING" });
  fixture.proof.unauthorizedExecutionAttemptCount = 0;
  fixture.proof.unauthorizedActionCount = 0;
  rehashProof(fixture.proof);
  assert(failure(fixture, "UNAUTHORIZED_ATTEMPT_COUNT_MISMATCH"));
  assert(failure(fixture, "UNAUTHORIZED_ACTION_COUNT_MISMATCH"));
});

test("provider, refinement, direct-page, retry, Experience, Episode, and Lesson ceilings fail honestly", () => {
  for (const name of ["provider", "refinement", "directPage", "retry", "experienceRecord", "cognitiveEpisode", "lessonCandidate"]) {
    const fixture = proofFixture();
    fixture.proof.ceilings[name].compliant = false;
    rehashProof(fixture.proof);
    assert(failure(fixture, `${name.toUpperCase()}_CEILING_EXCEEDED`), name);
  }
});

test("proof hashing is deterministic", () => {
  assert.equal(stableObjectJson(proofFixture().proof), stableObjectJson(proofFixture().proof));
});

test("focused proof tests do not create a real benchmark result or invocation registry", async () => {
  const names = await readdir(new URL("../benchmarks/blind-object-v1-results/", import.meta.url));
  assert.equal(names.some((name) => name.startsWith("phase6a-") || name.endsWith(".invocation-manifest.json")), false);
});
