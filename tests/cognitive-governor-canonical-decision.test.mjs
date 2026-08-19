import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateMentorDecisionContract,
  finalizeMentorDecisionResponse
} from "../lib/cognitive-governor/index.js";

const evidenceId = "evidence-synthetic-alpha";
const acceptedEvidenceIds = Object.freeze([evidenceId]);

function consistentInput() {
  return {
    actualMission: "Advance one bounded synthetic workflow.",
    finishLine: "Produce one verified synthetic outcome.",
    earliestSharedCausalBoundary: "synthetic-boundary-alpha",
    retainedEvidence: {
      requiredEvidenceIds: [...acceptedEvidenceIds],
      retainedEvidenceIds: [...acceptedEvidenceIds],
      acceptedEvidenceIds: [...acceptedEvidenceIds],
      supportsDecision: true,
      contradictionPresent: false
    },
    authority: {
      allowedActionIds: ["ADVANCE_SYNTHETIC_WORKFLOW"],
      prohibitedActionIds: []
    },
    failure: { newMechanismRequired: false },
    missionComplete: false,
    actions: [{
      actionId: "ADVANCE_SYNTHETIC_WORKFLOW",
      ordinal: 0,
      safe: true,
      materiallyAdvancesMission: true,
      requiresNewAuthority: false,
      requiredEvidenceIds: [...acceptedEvidenceIds],
      evidenceReferences: [...acceptedEvidenceIds],
      permittedOperations: ["ADVANCE_SYNTHETIC_OPERATION"],
      selectedOperations: ["ADVANCE_SYNTHETIC_OPERATION"],
      permittedChildOperations: ["VERIFY_SYNTHETIC_CHILD"],
      permittedProviderPhases: ["SYNTHETIC_PROVIDER_PHASE"],
      signature: "advance-synthetic-workflow-alpha"
    }],
    previousActionSignatures: [],
    rationaleCodes: ["SYNTHETIC_EVIDENCE_SUFFICIENT"],
    prohibitedOperations: ["EXPAND_SYNTHETIC_SCOPE"],
    uncertainties: []
  };
}

function bindingFor(vector) {
  if (vector.nextActionClass === "REQUEST_NEW_AUTHORITY" || vector.nextActionClass === "STOP_NO_SAFE_ADVANCING_ACTION") {
    return null;
  }
  const actionId = vector.selectedActionId
    || (vector.nextActionClass === "STOP_REPEATED_LOOP" ? "STOP_INSUFFICIENT_EVIDENCE" : vector.nextActionClass);
  const operation = vector.selectedActionId ? "ADVANCE_SYNTHETIC_OPERATION" : "TERMINAL_STOP_TRANSITION";
  return {
    actionId,
    permittedOperations: [operation],
    selectedOperations: [operation],
    permittedChildOperations: vector.selectedActionId ? ["VERIFY_SYNTHETIC_CHILD"] : [],
    permittedProviderPhases: vector.selectedActionId ? ["SYNTHETIC_PROVIDER_PHASE"] : [],
    requiredEvidenceIds: vector.retainedEvidenceSufficient ? [...acceptedEvidenceIds] : [],
    evidenceReferences: vector.retainedEvidenceSufficient ? [...acceptedEvidenceIds] : []
  };
}

function finalizeVector(vector, overrides = {}) {
  return finalizeMentorDecisionResponse({
    actualMission: "Advance one bounded synthetic workflow.",
    finishLine: "Produce one verified synthetic outcome.",
    earliestSharedCausalBoundary: "synthetic-boundary-alpha",
    decisionVector: vector,
    response: vector,
    actionEvidenceBinding: bindingFor(vector),
    authoritativeRetainedEvidenceIds: [...acceptedEvidenceIds],
    acceptedEvidenceIds: [...acceptedEvidenceIds],
    rationaleCodes: ["SYNTHETIC_DECISION_RATIONALE"],
    prohibitedOperations: ["EXPAND_SYNTHETIC_SCOPE"],
    uncertainties: [],
    ...overrides
  });
}

function refinalize(result, overrides = {}) {
  return finalizeMentorDecisionResponse({
    actualMission: result.actualMission,
    finishLine: result.finishLine,
    earliestSharedCausalBoundary: result.earliestSharedCausalBoundary,
    decisionVector: result.decisionVector,
    response: result.decisionVector,
    actionEvidenceBinding: result.actionEvidenceBinding,
    authoritativeRetainedEvidenceIds: result.authoritativeRetainedEvidenceIds,
    acceptedEvidenceIds: result.acceptedEvidenceIds,
    rationaleCodes: result.rationaleCodes,
    rationaleClass: result.rationaleClass,
    prohibitedOperations: result.prohibitedOperations,
    uncertainties: result.uncertainties,
    uncertaintyClass: result.uncertaintyClass,
    ...overrides
  });
}

const legalVectors = Object.freeze([
  {
    retainedEvidenceSufficient: true,
    authorityClass: "EXISTING",
    failureScope: "BOUNDED",
    safeIndependentContinuation: true,
    nextActionClass: "ADVANCE_WITHIN_EXISTING_AUTHORITY",
    selectedActionId: "ADVANCE_SYNTHETIC_WORKFLOW",
    repeatedLoopDetected: false,
    duplicateActionDetected: false
  },
  ...["EXISTING", "NEW_REQUIRED"].map((authorityClass) => ({
    retainedEvidenceSufficient: true,
    authorityClass,
    failureScope: "ARCHITECTURAL",
    safeIndependentContinuation: false,
    nextActionClass: "REQUEST_NEW_AUTHORITY",
    selectedActionId: null,
    repeatedLoopDetected: false,
    duplicateActionDetected: false
  })),
  {
    retainedEvidenceSufficient: true,
    authorityClass: "NO_ACTION_REQUIRED",
    failureScope: "BOUNDED",
    safeIndependentContinuation: false,
    nextActionClass: "STOP_COMPLETE",
    selectedActionId: null,
    repeatedLoopDetected: false,
    duplicateActionDetected: false
  },
  ...["EXISTING", "NEW_REQUIRED", "UNRESOLVED"].map((authorityClass) => ({
    retainedEvidenceSufficient: false,
    authorityClass,
    failureScope: "INSUFFICIENT_EVIDENCE",
    safeIndependentContinuation: false,
    nextActionClass: "STOP_INSUFFICIENT_EVIDENCE",
    selectedActionId: null,
    repeatedLoopDetected: false,
    duplicateActionDetected: false
  })),
  ...["EXISTING", "UNRESOLVED"].map((authorityClass) => ({
    retainedEvidenceSufficient: true,
    authorityClass,
    failureScope: "BOUNDED",
    safeIndependentContinuation: false,
    nextActionClass: "STOP_NO_SAFE_ADVANCING_ACTION",
    selectedActionId: null,
    repeatedLoopDetected: false,
    duplicateActionDetected: false
  })),
  ...["EXISTING", "UNRESOLVED"].flatMap((authorityClass) => [
    { repeatedLoopDetected: true, duplicateActionDetected: false },
    { repeatedLoopDetected: false, duplicateActionDetected: true },
    { repeatedLoopDetected: true, duplicateActionDetected: true }
  ].map((cause) => ({
    retainedEvidenceSufficient: true,
    authorityClass,
    failureScope: "BOUNDED",
    safeIndependentContinuation: false,
    nextActionClass: "STOP_REPEATED_LOOP",
    selectedActionId: null,
    ...cause
  })))
]);

test("COG-01 returns one frozen canonical decision vector and immutable authorization binding", () => {
  const result = evaluateMentorDecisionContract(consistentInput());
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.decisionVector), true);
  assert.equal(Object.isFrozen(result.actionEvidenceBinding), true);
  assert.equal(Object.isFrozen(result.actionEvidenceBinding.selectedOperations), true);
  assert.deepEqual(result.decisionVector, legalVectors[0]);
  for (const [field, value] of Object.entries(result.decisionVector)) assert.deepEqual(result[field], value, field);
  assert.throws(() => result.actionEvidenceBinding.selectedOperations.push("FORGED_OPERATION"), TypeError);
});

test("COG-03 accepts every explicitly legal closed decision-vector state", () => {
  for (const vector of legalVectors) {
    const result = finalizeVector(vector);
    assert.equal(result.compatibilityAudit.passed, true, vector.nextActionClass);
  }
});

test("COG-03 rejects every constrained-field mutation away from each legal state", () => {
  for (const vector of legalVectors) {
    const mutations = [
      { retainedEvidenceSufficient: !vector.retainedEvidenceSufficient },
      { authorityClass: vector.authorityClass === "NO_ACTION_REQUIRED" ? "EXISTING" : "NO_ACTION_REQUIRED" },
      { failureScope: vector.failureScope === "BOUNDED" ? "ARCHITECTURAL" : "BOUNDED" },
      { safeIndependentContinuation: !vector.safeIndependentContinuation },
      { nextActionClass: vector.nextActionClass === "STOP_COMPLETE" ? "ADVANCE_WITHIN_EXISTING_AUTHORITY" : "STOP_COMPLETE" },
      { selectedActionId: vector.selectedActionId === null ? "UNEXPECTED_ACTION" : null }
    ];
    if (vector.nextActionClass === "STOP_REPEATED_LOOP") {
      mutations.push({ repeatedLoopDetected: false, duplicateActionDetected: false });
    } else {
      mutations.push({ repeatedLoopDetected: true });
      mutations.push({ duplicateActionDetected: true });
    }
    for (const mutation of mutations) {
      const candidate = { ...vector, ...mutation };
      assert.throws(() => finalizeVector(candidate), /MENTOR_DECISION_CROSS_FIELD_CONTRADICTION/,
        `${vector.nextActionClass}:${JSON.stringify(mutation)}`);
    }
  }
});

test("COG-03 rejects both independently cited vector contradictions", () => {
  assert.throws(() => finalizeVector({
    ...legalVectors[0],
    safeIndependentContinuation: false,
    selectedActionId: null,
    nextActionClass: "STOP_INSUFFICIENT_EVIDENCE"
  }), /MENTOR_DECISION_CROSS_FIELD_CONTRADICTION/);
  const repeated = legalVectors.find((vector) => vector.nextActionClass === "STOP_REPEATED_LOOP");
  assert.throws(() => finalizeVector({
    ...repeated,
    repeatedLoopDetected: false,
    duplicateActionDetected: false
  }), /MENTOR_DECISION_CROSS_FIELD_CONTRADICTION/);
});

test("COG-01 fails closed for every missing or malformed decision-vector atom", () => {
  for (const field of Object.keys(legalVectors[0])) {
    const missing = { ...legalVectors[0] };
    delete missing[field];
    assert.throws(() => finalizeVector(missing), /MENTOR_DECISION_VECTOR|MENTOR_DECISION_CROSS_FIELD/,
      `missing:${field}`);
  }
  assert.throws(() => finalizeVector({ ...legalVectors[0], retainedEvidenceSufficient: "true" }),
    /MENTOR_DECISION_VECTOR_EVIDENCE_BOOLEAN_REQUIRED/);
  assert.throws(() => finalizeVector({ ...legalVectors[0], authorityClass: "UNKNOWN" }),
    /MENTOR_DECISION_VECTOR_AUTHORITY_INVALID/);
});

test("COG-02 rejects action, operation, and accepted-evidence substitution", () => {
  const result = evaluateMentorDecisionContract(consistentInput());
  assert.throws(() => refinalize(result, {
    actionEvidenceBinding: { ...result.actionEvidenceBinding, actionId: "CONTRADICTORY_SYNTHETIC_ACTION" }
  }), /MENTOR_DECISION_ACTION_CONTRADICTION/);
  assert.throws(() => refinalize(result, {
    actionEvidenceBinding: { ...result.actionEvidenceBinding, selectedOperations: ["UNPERMITTED_SYNTHETIC_OPERATION"] }
  }), /MENTOR_DECISION_OPERATION_NOT_PERMITTED/);
  assert.throws(() => refinalize(result, {
    acceptedEvidenceIds: ["unretained-synthetic-evidence"]
  }), /MENTOR_DECISION_ACCEPTED_EVIDENCE_NOT_AUTHORITATIVE/);
});

test("COG-02 rejects selected, child, and provider phases that collide with prohibited operations", () => {
  const result = evaluateMentorDecisionContract(consistentInput());
  for (const prohibited of [
    result.actionEvidenceBinding.selectedOperations[0],
    result.actionEvidenceBinding.permittedChildOperations[0],
    result.actionEvidenceBinding.permittedProviderPhases[0]
  ]) {
    assert.throws(() => refinalize(result, {
      prohibitedOperations: [...result.prohibitedOperations, prohibited]
    }), /MENTOR_DECISION_PROHIBITED_OPERATION_CONTRADICTION/, prohibited);
  }
});

test("COG-03 rejects structured rationale and uncertainty incompatible with the final vector", () => {
  const result = evaluateMentorDecisionContract(consistentInput());
  assert.throws(() => refinalize(result, { rationaleClass: "RATIONALE_STOP_COMPLETE" }),
    /MENTOR_DECISION_RATIONALE_CONTRADICTION/);
  assert.throws(() => refinalize(result, { uncertaintyClass: "INSUFFICIENT_EVIDENCE" }),
    /MENTOR_DECISION_UNCERTAINTY_CONTRADICTION/);
});

test("COG-03 derives every successful compatibility audit field from an enforced relationship", () => {
  const result = evaluateMentorDecisionContract(consistentInput());
  assert.deepEqual(result.compatibilityAudit, {
    passed: true,
    authorityActionCompatible: true,
    failureScopeActionCompatible: true,
    evidenceConclusionCompatible: true,
    continuationCompatible: true,
    rationaleCompatible: true,
    uncertaintyCompatible: true,
    prohibitedOperationsCompatible: true,
    actionOperationsCompatible: true,
    actionEvidenceCompatible: true,
    downstreamAuthorizationCompatible: true
  });
  assert.deepEqual(refinalize(result), result);
});
