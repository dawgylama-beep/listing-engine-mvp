import assert from "node:assert/strict";

export const MENTOR_GUIDED_REASONING_CYCLE = Object.freeze([
  "ACTUAL_MISSION",
  "FINISH_LINE",
  "EARLIEST_SHARED_CAUSAL_BOUNDARY",
  "RETAINED_EVIDENCE_SUFFICIENCY",
  "AUTHORITY_SCOPE",
  "FAILURE_SCOPE",
  "SMALLEST_SAFE_ADVANCING_ACTION",
  "PROHIBITED_OPERATIONS",
  "UNCERTAINTY_AND_STOP_CONDITIONS"
]);

export const MENTOR_AUTHORITY_CLASS = Object.freeze({
  EXISTING: "EXISTING",
  NEW_REQUIRED: "NEW_REQUIRED",
  NO_ACTION_REQUIRED: "NO_ACTION_REQUIRED",
  UNRESOLVED: "UNRESOLVED"
});

export const MENTOR_FAILURE_SCOPE = Object.freeze({
  BOUNDED: "BOUNDED",
  ARCHITECTURAL: "ARCHITECTURAL",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE"
});

export const MENTOR_NEXT_ACTION_CLASS = Object.freeze({
  ADVANCE_WITHIN_EXISTING_AUTHORITY: "ADVANCE_WITHIN_EXISTING_AUTHORITY",
  REQUEST_NEW_AUTHORITY: "REQUEST_NEW_AUTHORITY",
  STOP_COMPLETE: "STOP_COMPLETE",
  STOP_INSUFFICIENT_EVIDENCE: "STOP_INSUFFICIENT_EVIDENCE",
  STOP_NO_SAFE_ADVANCING_ACTION: "STOP_NO_SAFE_ADVANCING_ACTION",
  STOP_REPEATED_LOOP: "STOP_REPEATED_LOOP"
});

export const MENTOR_RATIONALE_CLASS = Object.freeze({
  ADVANCE_WITHIN_EXISTING_AUTHORITY: "RATIONALE_ADVANCE_WITHIN_EXISTING_AUTHORITY",
  REQUEST_NEW_AUTHORITY: "RATIONALE_REQUEST_NEW_AUTHORITY",
  STOP_COMPLETE: "RATIONALE_STOP_COMPLETE",
  STOP_INSUFFICIENT_EVIDENCE: "RATIONALE_STOP_INSUFFICIENT_EVIDENCE",
  STOP_NO_SAFE_ADVANCING_ACTION: "RATIONALE_STOP_NO_SAFE_ADVANCING_ACTION",
  STOP_REPEATED_LOOP: "RATIONALE_STOP_REPEATED_LOOP"
});

export const MENTOR_UNCERTAINTY_CLASS = Object.freeze({
  NONE: "NONE",
  NEW_AUTHORITY_REQUIRED: "NEW_AUTHORITY_REQUIRED",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  NO_SAFE_ADVANCING_ACTION: "NO_SAFE_ADVANCING_ACTION",
  REPEATED_LOOP_OR_DUPLICATE: "REPEATED_LOOP_OR_DUPLICATE"
});

export const MENTOR_REASONING_DOMAIN = Object.freeze({
  PROJECT_EXECUTION: "PROJECT_EXECUTION",
  PRODUCT_BEHAVIOR: "PRODUCT_BEHAVIOR",
  PROVIDER_TRANSPORT: "PROVIDER_TRANSPORT",
  QUALIFICATION_EVALUATION: "QUALIFICATION_EVALUATION"
});

export const MENTOR_STOP_CAUSE = Object.freeze({
  IDENTITY: "IDENTITY",
  SAFETY: "SAFETY",
  AUTHORITY: "AUTHORITY",
  DEPENDENCY: "DEPENDENCY"
});

const PROHIBITED_CLAIM_TYPES = new Set([
  "COGNITIVE_IMPROVEMENT",
  "DEPLOYMENT",
  "LEARNING",
  "MEMORY_IMPROVEMENT",
  "QUALIFICATION"
]);

function record(value, code) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), code);
  return value;
}

function text(value, code, maximum = 500) {
  assert.equal(typeof value, "string", code);
  const normalized = value.normalize("NFKC").trim();
  assert.ok(normalized.length > 0 && normalized.length <= maximum, code);
  return normalized;
}

function array(value, code) {
  assert.ok(Array.isArray(value), code);
  return value;
}

function stringArray(value, code, { allowEmpty = false } = {}) {
  const values = array(value, code).map((item) => text(item, code, 180));
  if (!allowEmpty) assert.ok(values.length > 0, code);
  assert.equal(new Set(values).size, values.length, `${code}_DUPLICATE`);
  return values;
}

function integer(value, code) {
  assert.ok(Number.isInteger(value) && value >= 0, code);
  return value;
}

function boolean(value, code) {
  assert.equal(typeof value, "boolean", code);
  return value;
}

const MENTOR_DECISION_VECTOR_FIELDS = Object.freeze([
  "retainedEvidenceSufficient",
  "authorityClass",
  "failureScope",
  "safeIndependentContinuation",
  "nextActionClass",
  "selectedActionId",
  "repeatedLoopDetected",
  "duplicateActionDetected"
]);

function optionalStringArray(value, fallback, code, { allowEmpty = false } = {}) {
  if (value === undefined) return [...fallback];
  return stringArray(value, code, { allowEmpty });
}

function canonicalDecisionVector(value) {
  const vector = record(value, "MENTOR_DECISION_VECTOR_REQUIRED");
  const selectedActionId = vector.selectedActionId === null
    ? null
    : text(vector.selectedActionId, "MENTOR_DECISION_VECTOR_ACTION_INVALID", 120);
  const normalized = {
    retainedEvidenceSufficient: boolean(
      vector.retainedEvidenceSufficient,
      "MENTOR_DECISION_VECTOR_EVIDENCE_BOOLEAN_REQUIRED"
    ),
    authorityClass: text(vector.authorityClass, "MENTOR_DECISION_VECTOR_AUTHORITY_REQUIRED", 80),
    failureScope: text(vector.failureScope, "MENTOR_DECISION_VECTOR_FAILURE_SCOPE_REQUIRED", 80),
    safeIndependentContinuation: boolean(
      vector.safeIndependentContinuation,
      "MENTOR_DECISION_VECTOR_CONTINUATION_BOOLEAN_REQUIRED"
    ),
    nextActionClass: text(vector.nextActionClass, "MENTOR_DECISION_VECTOR_NEXT_ACTION_REQUIRED", 100),
    selectedActionId,
    repeatedLoopDetected: boolean(
      vector.repeatedLoopDetected,
      "MENTOR_DECISION_VECTOR_LOOP_BOOLEAN_REQUIRED"
    ),
    duplicateActionDetected: boolean(
      vector.duplicateActionDetected,
      "MENTOR_DECISION_VECTOR_DUPLICATE_BOOLEAN_REQUIRED"
    )
  };
  assert.ok(Object.values(MENTOR_AUTHORITY_CLASS).includes(normalized.authorityClass),
    "MENTOR_DECISION_VECTOR_AUTHORITY_INVALID");
  assert.ok(Object.values(MENTOR_FAILURE_SCOPE).includes(normalized.failureScope),
    "MENTOR_DECISION_VECTOR_FAILURE_SCOPE_INVALID");
  assert.ok(Object.values(MENTOR_NEXT_ACTION_CLASS).includes(normalized.nextActionClass),
    "MENTOR_DECISION_VECTOR_NEXT_ACTION_INVALID");
  return Object.freeze(normalized);
}

function assertDecisionVectorCompatibility(vector) {
  const noStopCause = !vector.repeatedLoopDetected && !vector.duplicateActionDetected;
  const noSelectedAction = vector.selectedActionId === null;
  const legal = {
    [MENTOR_NEXT_ACTION_CLASS.ADVANCE_WITHIN_EXISTING_AUTHORITY]: (
      vector.retainedEvidenceSufficient
      && vector.authorityClass === MENTOR_AUTHORITY_CLASS.EXISTING
      && vector.failureScope === MENTOR_FAILURE_SCOPE.BOUNDED
      && vector.safeIndependentContinuation
      && Boolean(vector.selectedActionId)
      && noStopCause
    ),
    [MENTOR_NEXT_ACTION_CLASS.REQUEST_NEW_AUTHORITY]: (
      vector.retainedEvidenceSufficient
      && [MENTOR_AUTHORITY_CLASS.EXISTING, MENTOR_AUTHORITY_CLASS.NEW_REQUIRED].includes(vector.authorityClass)
      && vector.failureScope === MENTOR_FAILURE_SCOPE.ARCHITECTURAL
      && !vector.safeIndependentContinuation
      && noSelectedAction
      && noStopCause
    ),
    [MENTOR_NEXT_ACTION_CLASS.STOP_COMPLETE]: (
      vector.retainedEvidenceSufficient
      && vector.authorityClass === MENTOR_AUTHORITY_CLASS.NO_ACTION_REQUIRED
      && vector.failureScope === MENTOR_FAILURE_SCOPE.BOUNDED
      && !vector.safeIndependentContinuation
      && noSelectedAction
      && noStopCause
    ),
    [MENTOR_NEXT_ACTION_CLASS.STOP_INSUFFICIENT_EVIDENCE]: (
      !vector.retainedEvidenceSufficient
      && vector.authorityClass !== MENTOR_AUTHORITY_CLASS.NO_ACTION_REQUIRED
      && vector.failureScope === MENTOR_FAILURE_SCOPE.INSUFFICIENT_EVIDENCE
      && !vector.safeIndependentContinuation
      && noSelectedAction
      && noStopCause
    ),
    [MENTOR_NEXT_ACTION_CLASS.STOP_NO_SAFE_ADVANCING_ACTION]: (
      vector.retainedEvidenceSufficient
      && [MENTOR_AUTHORITY_CLASS.EXISTING, MENTOR_AUTHORITY_CLASS.UNRESOLVED].includes(vector.authorityClass)
      && vector.failureScope === MENTOR_FAILURE_SCOPE.BOUNDED
      && !vector.safeIndependentContinuation
      && noSelectedAction
      && noStopCause
    ),
    [MENTOR_NEXT_ACTION_CLASS.STOP_REPEATED_LOOP]: (
      vector.retainedEvidenceSufficient
      && [MENTOR_AUTHORITY_CLASS.EXISTING, MENTOR_AUTHORITY_CLASS.UNRESOLVED].includes(vector.authorityClass)
      && vector.failureScope === MENTOR_FAILURE_SCOPE.BOUNDED
      && !vector.safeIndependentContinuation
      && noSelectedAction
      && (vector.repeatedLoopDetected || vector.duplicateActionDetected)
    )
  };
  assert.equal(legal[vector.nextActionClass], true, "MENTOR_DECISION_CROSS_FIELD_CONTRADICTION");
  return Object.freeze({
    legalStateRecognized: legal[vector.nextActionClass] === true,
    authorityActionCompatible: legal[vector.nextActionClass] === true,
    failureScopeActionCompatible: legal[vector.nextActionClass] === true,
    continuationCompatible: legal[vector.nextActionClass] === true
  });
}

function normalizeActionEvidenceBinding(value, acceptedEvidenceIds) {
  if (value === null || value === undefined) return null;
  const binding = record(value, "MENTOR_DECISION_ACTION_BINDING_REQUIRED");
  const actionId = text(binding.actionId, "MENTOR_DECISION_ACTION_BINDING_ID_REQUIRED", 120);
  const permittedOperations = stringArray(
    binding.permittedOperations,
    "MENTOR_DECISION_PERMITTED_OPERATIONS_REQUIRED"
  );
  const selectedOperations = stringArray(
    binding.selectedOperations,
    "MENTOR_DECISION_SELECTED_OPERATIONS_REQUIRED"
  );
  const permittedChildOperations = optionalStringArray(
    binding.permittedChildOperations,
    [],
    "MENTOR_DECISION_PERMITTED_CHILD_OPERATIONS_REQUIRED",
    { allowEmpty: true }
  );
  const permittedProviderPhases = optionalStringArray(
    binding.permittedProviderPhases,
    [],
    "MENTOR_DECISION_PERMITTED_PROVIDER_PHASES_REQUIRED",
    { allowEmpty: true }
  );
  const requiredEvidenceIds = stringArray(
    binding.requiredEvidenceIds,
    "MENTOR_DECISION_BOUND_REQUIRED_EVIDENCE_REQUIRED",
    { allowEmpty: true }
  );
  const evidenceReferences = stringArray(
    binding.evidenceReferences,
    "MENTOR_DECISION_EVIDENCE_REFERENCES_REQUIRED",
    { allowEmpty: true }
  );
  const permitted = new Set(permittedOperations);
  const accepted = new Set(acceptedEvidenceIds);
  const referenced = new Set(evidenceReferences);
  assert.equal(selectedOperations.every((operation) => permitted.has(operation)), true,
    "MENTOR_DECISION_OPERATION_NOT_PERMITTED");
  assert.equal(requiredEvidenceIds.every((evidenceId) => accepted.has(evidenceId)), true,
    "MENTOR_DECISION_REQUIRED_EVIDENCE_NOT_ACCEPTED");
  assert.equal(evidenceReferences.every((evidenceId) => accepted.has(evidenceId)), true,
    "MENTOR_DECISION_EVIDENCE_NOT_ACCEPTED");
  assert.equal(requiredEvidenceIds.every((evidenceId) => referenced.has(evidenceId)), true,
    "MENTOR_DECISION_REQUIRED_EVIDENCE_UNREFERENCED");
  return Object.freeze({
    actionId,
    permittedOperations: Object.freeze(permittedOperations),
    selectedOperations: Object.freeze(selectedOperations),
    permittedChildOperations: Object.freeze(permittedChildOperations),
    permittedProviderPhases: Object.freeze(permittedProviderPhases),
    requiredEvidenceIds: Object.freeze(requiredEvidenceIds),
    evidenceReferences: Object.freeze(evidenceReferences)
  });
}

export function finalizeMentorDecisionResponse({
  actualMission,
  finishLine,
  earliestSharedCausalBoundary,
  decisionVector,
  response,
  actionEvidenceBinding = null,
  authoritativeRetainedEvidenceIds = [],
  acceptedEvidenceIds = [],
  rationaleCodes,
  rationaleClass,
  prohibitedOperations = [],
  uncertainties = [],
  uncertaintyClass
} = {}) {
  const vector = canonicalDecisionVector(decisionVector);
  const declared = record(response, "MENTOR_DECISION_RESPONSE_REQUIRED");
  for (const field of MENTOR_DECISION_VECTOR_FIELDS) {
    assert.deepEqual(declared[field], vector[field], `MENTOR_DECISION_VECTOR_RESPONSE_MISMATCH:${field}`);
  }
  const vectorAudit = assertDecisionVectorCompatibility(vector);
  const authoritativeRetained = stringArray(
    authoritativeRetainedEvidenceIds,
    "MENTOR_DECISION_AUTHORITATIVE_RETAINED_EVIDENCE_REQUIRED",
    { allowEmpty: true }
  );
  const accepted = stringArray(
    acceptedEvidenceIds,
    "MENTOR_DECISION_ACCEPTED_EVIDENCE_REQUIRED",
    { allowEmpty: true }
  );
  const authoritativeRetainedSet = new Set(authoritativeRetained);
  const acceptedEvidenceAuthoritative = accepted.every((evidenceId) => authoritativeRetainedSet.has(evidenceId));
  assert.equal(acceptedEvidenceAuthoritative, true, "MENTOR_DECISION_ACCEPTED_EVIDENCE_NOT_AUTHORITATIVE");
  const binding = normalizeActionEvidenceBinding(actionEvidenceBinding, accepted);
  if (vector.selectedActionId) {
    assert.ok(binding, "MENTOR_DECISION_SELECTED_ACTION_BINDING_REQUIRED");
    assert.equal(binding.actionId, vector.selectedActionId, "MENTOR_DECISION_ACTION_CONTRADICTION");
  } else if (binding) {
    const permittedStopBindingIds = vector.nextActionClass === MENTOR_NEXT_ACTION_CLASS.STOP_REPEATED_LOOP
      ? [MENTOR_NEXT_ACTION_CLASS.STOP_REPEATED_LOOP, MENTOR_NEXT_ACTION_CLASS.STOP_INSUFFICIENT_EVIDENCE]
      : [vector.nextActionClass];
    assert.equal(permittedStopBindingIds.includes(binding.actionId), true, "MENTOR_DECISION_ACTION_CONTRADICTION");
  }
  const normalizedProhibitedOperations = stringArray(
    prohibitedOperations,
    "MENTOR_DECISION_PROHIBITED_OPERATIONS_REQUIRED",
    { allowEmpty: true }
  );
  const normalizedUncertainties = stringArray(
    uncertainties,
    "MENTOR_DECISION_UNCERTAINTIES_REQUIRED",
    { allowEmpty: true }
  );
  const normalizedRationaleCodes = rationaleCodes === undefined
    ? []
    : stringArray(rationaleCodes, "MENTOR_DECISION_CAUSAL_REASON_REQUIRED");
  if (normalizedRationaleCodes.length) {
    text(normalizedRationaleCodes.join("|"), "MENTOR_DECISION_GENERAL_RULE_REQUIRED", 500);
  }
  const expectedRationaleClass = MENTOR_RATIONALE_CLASS[vector.nextActionClass];
  const normalizedRationaleClass = rationaleClass === undefined
    ? expectedRationaleClass
    : text(rationaleClass, "MENTOR_DECISION_RATIONALE_CLASS_REQUIRED", 120);
  const rationaleCompatible = normalizedRationaleClass === expectedRationaleClass;
  assert.equal(rationaleCompatible, true, "MENTOR_DECISION_RATIONALE_CONTRADICTION");
  const uncertaintyByAction = {
    [MENTOR_NEXT_ACTION_CLASS.ADVANCE_WITHIN_EXISTING_AUTHORITY]: MENTOR_UNCERTAINTY_CLASS.NONE,
    [MENTOR_NEXT_ACTION_CLASS.REQUEST_NEW_AUTHORITY]: MENTOR_UNCERTAINTY_CLASS.NEW_AUTHORITY_REQUIRED,
    [MENTOR_NEXT_ACTION_CLASS.STOP_COMPLETE]: MENTOR_UNCERTAINTY_CLASS.NONE,
    [MENTOR_NEXT_ACTION_CLASS.STOP_INSUFFICIENT_EVIDENCE]: MENTOR_UNCERTAINTY_CLASS.INSUFFICIENT_EVIDENCE,
    [MENTOR_NEXT_ACTION_CLASS.STOP_NO_SAFE_ADVANCING_ACTION]: MENTOR_UNCERTAINTY_CLASS.NO_SAFE_ADVANCING_ACTION,
    [MENTOR_NEXT_ACTION_CLASS.STOP_REPEATED_LOOP]: MENTOR_UNCERTAINTY_CLASS.REPEATED_LOOP_OR_DUPLICATE
  };
  const expectedUncertaintyClass = uncertaintyByAction[vector.nextActionClass];
  const normalizedUncertaintyClass = uncertaintyClass === undefined
    ? expectedUncertaintyClass
    : text(uncertaintyClass, "MENTOR_DECISION_UNCERTAINTY_CLASS_REQUIRED", 120);
  const uncertaintyCompatible = normalizedUncertaintyClass === expectedUncertaintyClass;
  assert.equal(uncertaintyCompatible, true, "MENTOR_DECISION_UNCERTAINTY_CONTRADICTION");
  const selectedAndDownstreamOperations = binding
    ? [
        ...binding.selectedOperations,
        ...binding.permittedChildOperations,
        ...binding.permittedProviderPhases
      ]
    : [];
  const prohibited = new Set(normalizedProhibitedOperations);
  const prohibitedOperationsCompatible = selectedAndDownstreamOperations.every((operation) => !prohibited.has(operation));
  assert.equal(prohibitedOperationsCompatible, true, "MENTOR_DECISION_PROHIBITED_OPERATION_CONTRADICTION");
  const actionOperationsCompatible = !binding || (
    binding.selectedOperations.length > 0
    && binding.selectedOperations.every((operation) => binding.permittedOperations.includes(operation))
  );
  const actionEvidenceCompatible = !binding || (
    binding.requiredEvidenceIds.every((evidenceId) => binding.evidenceReferences.includes(evidenceId))
    && binding.evidenceReferences.every((evidenceId) => accepted.includes(evidenceId))
  );
  const evidenceConclusionCompatible = acceptedEvidenceAuthoritative
    && (!vector.retainedEvidenceSufficient || accepted.length > 0)
    && actionEvidenceCompatible;
  assert.equal(actionOperationsCompatible, true, "MENTOR_DECISION_OPERATION_NOT_PERMITTED");
  assert.equal(actionEvidenceCompatible, true, "MENTOR_DECISION_ACTION_EVIDENCE_CONTRADICTION");
  assert.equal(evidenceConclusionCompatible, true, "MENTOR_DECISION_EVIDENCE_CONCLUSION_CONTRADICTION");
  const downstreamAuthorizationCompatible = !binding || (
    binding.permittedChildOperations.every((operation) => !prohibited.has(operation))
    && binding.permittedProviderPhases.every((operation) => !prohibited.has(operation))
  );
  const compatibilityAudit = Object.freeze({
    passed: Object.values({
      ...vectorAudit,
      evidenceConclusionCompatible,
      rationaleCompatible,
      uncertaintyCompatible,
      prohibitedOperationsCompatible,
      actionOperationsCompatible,
      actionEvidenceCompatible,
      downstreamAuthorizationCompatible
    }).every(Boolean),
    authorityActionCompatible: vectorAudit.authorityActionCompatible,
    failureScopeActionCompatible: vectorAudit.failureScopeActionCompatible,
    evidenceConclusionCompatible,
    continuationCompatible: vectorAudit.continuationCompatible,
    rationaleCompatible,
    uncertaintyCompatible,
    prohibitedOperationsCompatible,
    actionOperationsCompatible,
    actionEvidenceCompatible,
    downstreamAuthorizationCompatible
  });
  assert.equal(compatibilityAudit.passed, true, "MENTOR_DECISION_COMPATIBILITY_AUDIT_FAILED");
  return Object.freeze({
    valid: true,
    decisionOrder: MENTOR_GUIDED_REASONING_CYCLE,
    actualMission: text(actualMission, "MENTOR_DECISION_ACTUAL_MISSION_REQUIRED", 600),
    finishLine: text(finishLine, "MENTOR_DECISION_FINISH_LINE_REQUIRED", 600),
    earliestSharedCausalBoundary: text(
      earliestSharedCausalBoundary,
      "MENTOR_DECISION_CAUSAL_BOUNDARY_REQUIRED",
      300
    ),
    decisionVector: vector,
    ...vector,
    actionEvidenceBinding: binding,
    authoritativeRetainedEvidenceIds: Object.freeze(authoritativeRetained),
    acceptedEvidenceIds: Object.freeze(accepted),
    rationaleCodes: Object.freeze(normalizedRationaleCodes),
    rationaleClass: normalizedRationaleClass,
    prohibitedOperations: Object.freeze(normalizedProhibitedOperations),
    uncertainties: Object.freeze(normalizedUncertainties),
    uncertaintyClass: normalizedUncertaintyClass,
    compatibilityAudit
  });
}

function mentorDecisionActions(input, acceptedEvidenceIds) {
  const authority = record(input.authority, "MENTOR_DECISION_AUTHORITY_REQUIRED");
  const allowedActionIds = new Set(stringArray(
    authority.allowedActionIds,
    "MENTOR_DECISION_ALLOWED_ACTIONS_REQUIRED",
    { allowEmpty: true }
  ));
  const prohibitedActionIds = new Set(stringArray(
    authority.prohibitedActionIds,
    "MENTOR_DECISION_PROHIBITED_ACTIONS_REQUIRED",
    { allowEmpty: true }
  ));
  const actions = array(input.actions, "MENTOR_DECISION_ACTIONS_REQUIRED").map((action) => {
    record(action, "MENTOR_DECISION_ACTION_RECORD_REQUIRED");
    const actionId = text(action.actionId, "MENTOR_DECISION_ACTION_ID_REQUIRED", 120);
    const ordinal = integer(action.ordinal, "MENTOR_DECISION_ACTION_ORDINAL_REQUIRED");
    const requiredEvidenceIds = stringArray(
      action.requiredEvidenceIds,
      "MENTOR_DECISION_ACTION_EVIDENCE_REQUIRED",
      { allowEmpty: true }
    );
    const permittedOperations = optionalStringArray(
      action.permittedOperations,
      [actionId],
      "MENTOR_DECISION_ACTION_PERMITTED_OPERATIONS_REQUIRED"
    );
    const selectedOperations = optionalStringArray(
      action.selectedOperations,
      [permittedOperations[0]],
      "MENTOR_DECISION_ACTION_SELECTED_OPERATIONS_REQUIRED"
    );
    const permittedChildOperations = optionalStringArray(
      action.permittedChildOperations,
      [],
      "MENTOR_DECISION_ACTION_PERMITTED_CHILD_OPERATIONS_REQUIRED",
      { allowEmpty: true }
    );
    const permittedProviderPhases = optionalStringArray(
      action.permittedProviderPhases,
      [],
      "MENTOR_DECISION_ACTION_PERMITTED_PROVIDER_PHASES_REQUIRED",
      { allowEmpty: true }
    );
    const evidenceReferences = optionalStringArray(
      action.evidenceReferences,
      requiredEvidenceIds,
      "MENTOR_DECISION_ACTION_EVIDENCE_REFERENCES_REQUIRED",
      { allowEmpty: true }
    );
    return {
      actionId,
      ordinal,
      safe: boolean(action.safe, "MENTOR_DECISION_ACTION_SAFE_BOOLEAN_REQUIRED"),
      materiallyAdvancesMission: boolean(
        action.materiallyAdvancesMission,
        "MENTOR_DECISION_ACTION_ADVANCEMENT_BOOLEAN_REQUIRED"
      ),
      requiresNewAuthority: boolean(
        action.requiresNewAuthority,
        "MENTOR_DECISION_ACTION_AUTHORITY_BOOLEAN_REQUIRED"
      ),
      requiredEvidenceIds,
      permittedOperations,
      selectedOperations,
      permittedChildOperations,
      permittedProviderPhases,
      evidenceReferences,
      evidenceReady: requiredEvidenceIds.every((evidenceId) => acceptedEvidenceIds.has(evidenceId)),
      signature: text(action.signature, "MENTOR_DECISION_ACTION_SIGNATURE_REQUIRED", 160),
      allowed: allowedActionIds.has(actionId) && !prohibitedActionIds.has(actionId)
    };
  });
  assert.equal(new Set(actions.map((action) => action.actionId)).size, actions.length,
    "MENTOR_DECISION_ACTION_ID_DUPLICATE");
  assert.equal(new Set(actions.map((action) => action.ordinal)).size, actions.length,
    "MENTOR_DECISION_ACTION_ORDINAL_DUPLICATE");
  return actions.sort((left, right) => left.ordinal - right.ordinal || left.actionId.localeCompare(right.actionId));
}

export function evaluateMentorDecisionContract(input) {
  record(input, "MENTOR_DECISION_INPUT_REQUIRED");
  const actualMission = text(input.actualMission, "MENTOR_DECISION_ACTUAL_MISSION_REQUIRED", 600);
  const finishLine = text(input.finishLine, "MENTOR_DECISION_FINISH_LINE_REQUIRED", 600);
  const earliestSharedCausalBoundary = text(
    input.earliestSharedCausalBoundary,
    "MENTOR_DECISION_CAUSAL_BOUNDARY_REQUIRED",
    300
  );
  const retainedEvidence = record(input.retainedEvidence, "MENTOR_DECISION_RETAINED_EVIDENCE_REQUIRED");
  const requiredEvidenceIds = stringArray(
    retainedEvidence.requiredEvidenceIds,
    "MENTOR_DECISION_REQUIRED_EVIDENCE_IDS_REQUIRED",
    { allowEmpty: true }
  );
  const retainedEvidenceIds = new Set(stringArray(
    retainedEvidence.retainedEvidenceIds,
    "MENTOR_DECISION_RETAINED_EVIDENCE_IDS_REQUIRED",
    { allowEmpty: true }
  ));
  const acceptedEvidenceIds = new Set(optionalStringArray(
    retainedEvidence.acceptedEvidenceIds,
    [...retainedEvidenceIds],
    "MENTOR_DECISION_ACCEPTED_EVIDENCE_IDS_REQUIRED",
    { allowEmpty: true }
  ));
  assert.equal([...acceptedEvidenceIds].every((evidenceId) => retainedEvidenceIds.has(evidenceId)), true,
    "MENTOR_DECISION_ACCEPTED_EVIDENCE_NOT_RETAINED");
  const supportsDecision = boolean(
    retainedEvidence.supportsDecision,
    "MENTOR_DECISION_EVIDENCE_SUPPORT_BOOLEAN_REQUIRED"
  );
  const contradictionPresent = boolean(
    retainedEvidence.contradictionPresent,
    "MENTOR_DECISION_CONTRADICTION_BOOLEAN_REQUIRED"
  );
  const failure = record(input.failure, "MENTOR_DECISION_FAILURE_REQUIRED");
  const newMechanismRequired = boolean(
    failure.newMechanismRequired,
    "MENTOR_DECISION_NEW_MECHANISM_BOOLEAN_REQUIRED"
  );
  const missionComplete = boolean(input.missionComplete, "MENTOR_DECISION_MISSION_COMPLETE_BOOLEAN_REQUIRED");
  const previousActionSignatures = new Set(stringArray(
    input.previousActionSignatures,
    "MENTOR_DECISION_PREVIOUS_SIGNATURES_REQUIRED",
    { allowEmpty: true }
  ));
  const actions = mentorDecisionActions(input, acceptedEvidenceIds);
  const retainedEvidenceSufficient = supportsDecision
    && !contradictionPresent
    && requiredEvidenceIds.every((evidenceId) => acceptedEvidenceIds.has(evidenceId));
  const usefulActions = actions.filter((action) => action.safe && action.materiallyAdvancesMission);
  const existingAuthorityActions = usefulActions.filter((action) => action.allowed && !action.requiresNewAuthority);
  const newAuthorityActions = usefulActions.filter((action) => action.requiresNewAuthority || !action.allowed);
  const authorityClass = missionComplete
    ? MENTOR_AUTHORITY_CLASS.NO_ACTION_REQUIRED
    : existingAuthorityActions.length
      ? MENTOR_AUTHORITY_CLASS.EXISTING
      : newAuthorityActions.length
        ? MENTOR_AUTHORITY_CLASS.NEW_REQUIRED
        : MENTOR_AUTHORITY_CLASS.UNRESOLVED;
  const failureScope = !retainedEvidenceSufficient
    ? MENTOR_FAILURE_SCOPE.INSUFFICIENT_EVIDENCE
    : newMechanismRequired || authorityClass === MENTOR_AUTHORITY_CLASS.NEW_REQUIRED
      ? MENTOR_FAILURE_SCOPE.ARCHITECTURAL
      : MENTOR_FAILURE_SCOPE.BOUNDED;
  const eligibleActions = existingAuthorityActions.filter((action) => action.evidenceReady);
  const advancingActions = eligibleActions.filter((action) => !previousActionSignatures.has(action.signature));
  const selectedAction = retainedEvidenceSufficient
    && !missionComplete
    && !newMechanismRequired
    && authorityClass === MENTOR_AUTHORITY_CLASS.EXISTING
    ? advancingActions[0] || null
    : null;
  const repeatedLoopDetected = eligibleActions.length > 0
    && advancingActions.length === 0
    && eligibleActions.every((action) => previousActionSignatures.has(action.signature));
  const safeIndependentContinuation = Boolean(selectedAction)
    && authorityClass === MENTOR_AUTHORITY_CLASS.EXISTING
    && failureScope === MENTOR_FAILURE_SCOPE.BOUNDED;
  const nextActionClass = missionComplete
    ? MENTOR_NEXT_ACTION_CLASS.STOP_COMPLETE
    : !retainedEvidenceSufficient
      ? MENTOR_NEXT_ACTION_CLASS.STOP_INSUFFICIENT_EVIDENCE
      : safeIndependentContinuation
        ? MENTOR_NEXT_ACTION_CLASS.ADVANCE_WITHIN_EXISTING_AUTHORITY
        : repeatedLoopDetected
          ? MENTOR_NEXT_ACTION_CLASS.STOP_REPEATED_LOOP
          : newMechanismRequired || authorityClass === MENTOR_AUTHORITY_CLASS.NEW_REQUIRED
             ? MENTOR_NEXT_ACTION_CLASS.REQUEST_NEW_AUTHORITY
             : MENTOR_NEXT_ACTION_CLASS.STOP_NO_SAFE_ADVANCING_ACTION;
  const decisionVector = Object.freeze({
    retainedEvidenceSufficient,
    authorityClass,
    failureScope,
    safeIndependentContinuation,
    nextActionClass,
    selectedActionId: selectedAction?.actionId || null,
    repeatedLoopDetected,
    duplicateActionDetected: false
  });
  const actionEvidenceBinding = input.emittedAction === undefined
    ? selectedAction
      ? {
          actionId: selectedAction.actionId,
          permittedOperations: selectedAction.permittedOperations,
          selectedOperations: selectedAction.selectedOperations,
          permittedChildOperations: selectedAction.permittedChildOperations,
          permittedProviderPhases: selectedAction.permittedProviderPhases,
          requiredEvidenceIds: selectedAction.requiredEvidenceIds,
          evidenceReferences: selectedAction.evidenceReferences
        }
      : null
    : input.emittedAction;
  return finalizeMentorDecisionResponse({
    actualMission,
    finishLine,
    earliestSharedCausalBoundary,
    decisionVector,
    response: decisionVector,
    actionEvidenceBinding,
    authoritativeRetainedEvidenceIds: [...retainedEvidenceIds],
    acceptedEvidenceIds: [...acceptedEvidenceIds],
    rationaleCodes: input.rationaleCodes,
    rationaleClass: input.rationaleClass,
    prohibitedOperations: input.prohibitedOperations,
    uncertainties: input.uncertainties,
    uncertaintyClass: input.uncertaintyClass
  });
}

function evidenceIndex(input) {
  const entries = array(input.evidence, "MENTOR_EVIDENCE_REQUIRED");
  assert.ok(entries.length > 0, "MENTOR_EVIDENCE_REQUIRED");
  const index = new Map();
  for (const entry of entries) {
    record(entry, "MENTOR_EVIDENCE_RECORD_REQUIRED");
    const evidenceId = text(entry.evidenceId, "MENTOR_EVIDENCE_ID_REQUIRED", 120);
    assert.equal(index.has(evidenceId), false, "MENTOR_EVIDENCE_ID_DUPLICATE");
    assert.ok(Object.values(MENTOR_REASONING_DOMAIN).includes(entry.domain), "MENTOR_EVIDENCE_DOMAIN_INVALID");
    assert.equal(typeof entry.material, "boolean", "MENTOR_EVIDENCE_MATERIAL_BOOLEAN_REQUIRED");
    integer(entry.sequence, "MENTOR_EVIDENCE_SEQUENCE_REQUIRED");
    text(entry.observation, "MENTOR_EVIDENCE_OBSERVATION_REQUIRED", 600);
    index.set(evidenceId, entry);
  }
  return index;
}

export function classifyMentorGuidedDomain(input) {
  const evidence = evidenceIndex(input);
  const materialDomains = [...evidence.values()]
    .filter((entry) => entry.material)
    .map((entry) => entry.domain);
  assert.ok(materialDomains.length > 0, "MENTOR_MATERIAL_EVIDENCE_REQUIRED");
  const domains = [...new Set(materialDomains)];
  assert.equal(domains.length, 1, "MENTOR_DOMAIN_CONTRADICTION");
  return domains[0];
}

export function selectEarliestCommonCausalBoundary(input) {
  const evidence = evidenceIndex(input);
  const materialIds = [...evidence.entries()]
    .filter(([, entry]) => entry.material)
    .map(([evidenceId]) => evidenceId);
  const candidates = array(input.diagnoses, "MENTOR_DIAGNOSES_REQUIRED").map((diagnosis) => {
    record(diagnosis, "MENTOR_DIAGNOSIS_RECORD_REQUIRED");
    const diagnosisId = text(diagnosis.diagnosisId, "MENTOR_DIAGNOSIS_ID_REQUIRED", 120);
    const boundaryOrdinal = integer(diagnosis.boundaryOrdinal, "MENTOR_BOUNDARY_ORDINAL_REQUIRED");
    const supported = stringArray(diagnosis.supportedByEvidenceIds, "MENTOR_DIAGNOSIS_SUPPORT_REQUIRED");
    const explains = stringArray(diagnosis.explainsEvidenceIds, "MENTOR_DIAGNOSIS_COVERAGE_REQUIRED");
    for (const evidenceId of [...supported, ...explains]) {
      assert.equal(evidence.has(evidenceId), true, "MENTOR_DIAGNOSIS_UNKNOWN_EVIDENCE");
    }
    text(diagnosis.generalRule, "MENTOR_GENERAL_RULE_REQUIRED", 500);
    assert.equal(diagnosis.persistAsMemory, false, "MENTOR_GENERAL_RULE_MUST_BE_NON_PERSISTENT");
    return { ...diagnosis, diagnosisId, boundaryOrdinal, supported, explains };
  });
  assert.ok(candidates.length > 0, "MENTOR_DIAGNOSES_REQUIRED");
  const complete = candidates
    .filter((diagnosis) => materialIds.every((evidenceId) => diagnosis.explains.includes(evidenceId)))
    .sort((left, right) => left.boundaryOrdinal - right.boundaryOrdinal || left.diagnosisId.localeCompare(right.diagnosisId));
  assert.ok(complete.length > 0, "MENTOR_COMMON_CAUSAL_BOUNDARY_REQUIRED");
  return complete[0].diagnosisId;
}

export function rejectUnsupportedConclusions(input, domain = classifyMentorGuidedDomain(input)) {
  const evidence = evidenceIndex(input);
  const authority = record(input.authority, "MENTOR_AUTHORITY_REQUIRED");
  const grantedClaimTypes = new Set(stringArray(authority.grantedClaimTypes, "MENTOR_GRANTED_CLAIMS_REQUIRED", { allowEmpty: true }));
  const explicitlyProhibited = new Set(stringArray(authority.prohibitedClaimTypes, "MENTOR_PROHIBITED_CLAIMS_REQUIRED", { allowEmpty: true }));
  const rejected = [];
  for (const conclusion of array(input.proposedConclusions, "MENTOR_CONCLUSIONS_REQUIRED")) {
    record(conclusion, "MENTOR_CONCLUSION_RECORD_REQUIRED");
    const conclusionId = text(conclusion.conclusionId, "MENTOR_CONCLUSION_ID_REQUIRED", 120);
    const supportingEvidenceIds = stringArray(
      conclusion.supportingEvidenceIds,
      "MENTOR_CONCLUSION_SUPPORT_ARRAY_REQUIRED",
      { allowEmpty: true }
    );
    const claimType = text(conclusion.claimType, "MENTOR_CONCLUSION_CLAIM_TYPE_REQUIRED", 100);
    const assertedDomain = text(conclusion.assertedDomain, "MENTOR_CONCLUSION_DOMAIN_REQUIRED", 100);
    const supportMissing = supportingEvidenceIds.some((evidenceId) => !evidence.has(evidenceId));
    const domainExpansion = assertedDomain !== domain;
    const authorityMissing = explicitlyProhibited.has(claimType)
      || PROHIBITED_CLAIM_TYPES.has(claimType)
      || (!grantedClaimTypes.has(claimType) && claimType !== "BOUNDED_PROJECT_CONCLUSION");
    if (supportMissing || domainExpansion || authorityMissing) rejected.push(conclusionId);
  }
  assert.equal(new Set(rejected).size, rejected.length, "MENTOR_REJECTED_CONCLUSION_DUPLICATE");
  return Object.freeze(rejected);
}

function normalizedSolutionPath(input) {
  const actions = array(input.solutionPath, "MENTOR_SOLUTION_PATH_REQUIRED").map((action) => {
    record(action, "MENTOR_SOLUTION_ACTION_REQUIRED");
    const actionId = text(action.actionId, "MENTOR_ACTION_ID_REQUIRED", 120);
    const ordinal = integer(action.ordinal, "MENTOR_ACTION_ORDINAL_REQUIRED");
    assert.ok(["BLOCKED", "COMPLETE", "PENDING"].includes(action.status), "MENTOR_ACTION_STATUS_INVALID");
    const dependsOnActionIds = stringArray(action.dependsOnActionIds, "MENTOR_ACTION_DEPENDENCIES_REQUIRED", { allowEmpty: true });
    const producesEvidenceId = text(action.producesEvidenceId, "MENTOR_ACTION_EVIDENCE_TARGET_REQUIRED", 120);
    assert.equal(typeof action.materialStateChange, "boolean", "MENTOR_ACTION_STATE_CHANGE_BOOLEAN_REQUIRED");
    const blocker = action.blocker === "" ? "" : text(action.blocker, "MENTOR_ACTION_BLOCKER_INVALID", 80);
    if (blocker) assert.ok(Object.values(MENTOR_STOP_CAUSE).includes(blocker), "MENTOR_ACTION_BLOCKER_INVALID");
    text(action.verification, "MENTOR_ACTION_VERIFICATION_REQUIRED", 400);
    return { ...action, actionId, ordinal, dependsOnActionIds, producesEvidenceId, blocker };
  });
  assert.ok(actions.length > 0, "MENTOR_SOLUTION_PATH_REQUIRED");
  assert.equal(new Set(actions.map((action) => action.actionId)).size, actions.length, "MENTOR_ACTION_ID_DUPLICATE");
  assert.equal(new Set(actions.map((action) => action.ordinal)).size, actions.length, "MENTOR_ACTION_ORDINAL_DUPLICATE");
  const known = new Set(actions.map((action) => action.actionId));
  const checkpoint = record(input.checkpoint, "MENTOR_CHECKPOINT_REQUIRED");
  const completedActionIds = new Set(stringArray(checkpoint.completedActionIds, "MENTOR_COMPLETED_ACTIONS_REQUIRED", { allowEmpty: true }));
  for (const action of actions) {
    for (const dependency of action.dependsOnActionIds) {
      assert.ok(known.has(dependency) || completedActionIds.has(dependency), "MENTOR_ACTION_DEPENDENCY_UNKNOWN");
    }
  }
  return actions.sort((left, right) => left.ordinal - right.ordinal);
}

function redundantEvidenceAction(action, completedEvidenceIds) {
  return completedEvidenceIds.has(action.producesEvidenceId) && action.materialStateChange === false;
}

export function selectSmallestSafeAction(input) {
  const path = normalizedSolutionPath(input);
  const checkpoint = record(input.checkpoint, "MENTOR_CHECKPOINT_REQUIRED");
  const completedActionIds = new Set(stringArray(checkpoint.completedActionIds, "MENTOR_COMPLETED_ACTIONS_REQUIRED", { allowEmpty: true }));
  const completedEvidenceIds = new Set(stringArray(checkpoint.completedEvidenceIds, "MENTOR_COMPLETED_EVIDENCE_REQUIRED", { allowEmpty: true }));
  const authority = record(input.authority, "MENTOR_AUTHORITY_REQUIRED");
  const allowedActionIds = new Set(stringArray(authority.allowedActionIds, "MENTOR_ALLOWED_ACTIONS_REQUIRED", { allowEmpty: true }));
  const prohibitedActionIds = new Set(stringArray(authority.prohibitedActionIds, "MENTOR_PROHIBITED_ACTIONS_REQUIRED", { allowEmpty: true }));
  for (const action of path) {
    if (action.status === "COMPLETE" || completedActionIds.has(action.actionId)) continue;
    if (redundantEvidenceAction(action, completedEvidenceIds)) continue;
    if (action.blocker || action.status === "BLOCKED") continue;
    if (!action.dependsOnActionIds.every((dependency) => completedActionIds.has(dependency))) continue;
    if (!allowedActionIds.has(action.actionId) || prohibitedActionIds.has(action.actionId)) continue;
    return action.actionId;
  }
  const blockers = new Set(path.filter((action) => action.blocker).map((action) => action.blocker));
  if (path.some((action) => !allowedActionIds.has(action.actionId) || prohibitedActionIds.has(action.actionId))) {
    blockers.add(MENTOR_STOP_CAUSE.AUTHORITY);
  }
  assert.ok(blockers.size > 0 && [...blockers].every((cause) => Object.values(MENTOR_STOP_CAUSE).includes(cause)),
    "MENTOR_UNBOUNDED_OR_UNEXPLAINED_STOP_PROHIBITED");
  const cause = [...Object.values(MENTOR_STOP_CAUSE)].find((candidate) => blockers.has(candidate));
  return `STOP_${cause}`;
}

export function deriveCompleteFinishPath(input) {
  const checkpoint = record(input.checkpoint, "MENTOR_CHECKPOINT_REQUIRED");
  const completedActionIds = new Set(stringArray(checkpoint.completedActionIds, "MENTOR_COMPLETED_ACTIONS_REQUIRED", { allowEmpty: true }));
  const completedEvidenceIds = new Set(stringArray(checkpoint.completedEvidenceIds, "MENTOR_COMPLETED_EVIDENCE_REQUIRED", { allowEmpty: true }));
  const remaining = normalizedSolutionPath(input)
    .filter((action) => action.status !== "COMPLETE" && !completedActionIds.has(action.actionId))
    .filter((action) => !redundantEvidenceAction(action, completedEvidenceIds))
    .map((action) => action.actionId);
  assert.ok(remaining.length > 0, "MENTOR_FINISH_PATH_ALREADY_COMPLETE");
  return Object.freeze(remaining);
}

export function evaluateMentorGuidedReasoning(input) {
  record(input, "MENTOR_INPUT_REQUIRED");
  const source = record(input.source, "MENTOR_SOURCE_BINDING_REQUIRED");
  text(source.relativePath, "MENTOR_SOURCE_PATH_REQUIRED", 400);
  assert.match(text(source.sha256, "MENTOR_SOURCE_SHA_REQUIRED", 64), /^[a-f0-9]{64}$/);
  const mission = record(input.mission, "MENTOR_MISSION_REQUIRED");
  text(mission.objective, "MENTOR_MISSION_OBJECTIVE_REQUIRED", 600);
  text(mission.project, "MENTOR_PROJECT_REQUIRED", 120);
  text(mission.threadRole, "MENTOR_THREAD_ROLE_REQUIRED", 120);
  text(mission.checkpoint, "MENTOR_MISSION_CHECKPOINT_REQUIRED", 300);
  text(mission.finishLine, "MENTOR_FINISH_LINE_REQUIRED", 600);
  array(input.projectHistory, "MENTOR_PROJECT_HISTORY_REQUIRED");
  assert.ok(input.projectHistory.length > 0, "MENTOR_PROJECT_HISTORY_REQUIRED");
  for (const entry of input.projectHistory) text(entry, "MENTOR_PROJECT_HISTORY_ENTRY_REQUIRED", 600);
  array(input.inferences, "MENTOR_INFERENCES_REQUIRED");
  const knownEvidenceIds = evidenceIndex(input);
  for (const inference of input.inferences) {
    record(inference, "MENTOR_INFERENCE_RECORD_REQUIRED");
    text(inference.inferenceId, "MENTOR_INFERENCE_ID_REQUIRED", 120);
    const supportingEvidenceIds = stringArray(inference.supportingEvidenceIds, "MENTOR_INFERENCE_SUPPORT_REQUIRED");
    assert.equal(supportingEvidenceIds.every((evidenceId) => knownEvidenceIds.has(evidenceId)), true,
      "MENTOR_INFERENCE_UNKNOWN_EVIDENCE");
    text(inference.statement, "MENTOR_INFERENCE_STATEMENT_REQUIRED", 600);
  }
  const domain = classifyMentorGuidedDomain(input);
  const causalBoundaryId = selectEarliestCommonCausalBoundary(input);
  const causalDiagnosis = input.diagnoses.find((diagnosis) => diagnosis.diagnosisId === causalBoundaryId);
  const generalizedLesson = text(causalDiagnosis.generalRule, "MENTOR_GENERAL_RULE_REQUIRED", 500);
  const safeActionId = selectSmallestSafeAction(input);
  const finishPath = deriveCompleteFinishPath(input);
  const rejectedConclusionIds = rejectUnsupportedConclusions(input, domain);
  const verification = record(input.verification, "MENTOR_VERIFICATION_REQUIRED");
  const verifiedActionId = text(verification.actionId, "MENTOR_VERIFICATION_ACTION_REQUIRED", 120);
  const verificationEvidenceId = text(verification.evidenceId, "MENTOR_VERIFICATION_EVIDENCE_REQUIRED", 120);
  const finishLineActionId = text(verification.finishLineActionId, "MENTOR_VERIFICATION_FINISH_ACTION_REQUIRED", 120);
  if (!safeActionId.startsWith("STOP_")) assert.equal(verifiedActionId, safeActionId, "MENTOR_VERIFICATION_ACTION_MISMATCH");
  assert.ok(finishPath.includes(finishLineActionId), "MENTOR_FINISH_LINE_ACTION_MISSING");
  const selectedAction = input.solutionPath.find((action) => action.actionId === safeActionId);
  if (selectedAction) assert.equal(selectedAction.producesEvidenceId, verificationEvidenceId, "MENTOR_VERIFICATION_EVIDENCE_MISMATCH");
  return Object.freeze({
    valid: true,
    cycle: MENTOR_GUIDED_REASONING_CYCLE,
    domain,
    causalBoundaryId,
    generalizedLesson,
    safeActionId,
    finishPath,
    rejectedConclusionIds,
    sideEffectCount: 0,
    qualificationClaimed: false,
    learningClaimed: false,
    cognitiveImprovementClaimed: false,
    deploymentClaimed: false,
    activationClaimed: false,
    memoryImprovementClaimed: false
  });
}

export function assertMentorGuidedDecisionAssembly({
  state,
  candidates,
  selected,
  boundary,
  repeatedLoopDetected = false,
  duplicateActionDetected = false
}) {
  record(state, "MENTOR_DECISION_STATE_REQUIRED");
  record(state.customerMission, "MENTOR_DECISION_MISSION_REQUIRED");
  text(state.customerMission.purpose, "MENTOR_DECISION_MISSION_PURPOSE_REQUIRED", 100);
  text(state.knowledgeStateHash, "MENTOR_DECISION_EVIDENCE_HASH_REQUIRED", 100);
  record(state.evidenceStateSummary, "MENTOR_DECISION_EVIDENCE_SUMMARY_REQUIRED");
  text(state.evidenceStateSummary.evidenceStateHash, "MENTOR_DECISION_EVIDENCE_STATE_HASH_REQUIRED", 100);
  const options = array(candidates, "MENTOR_DECISION_CANDIDATES_REQUIRED");
  record(selected, "MENTOR_DECISION_SELECTION_REQUIRED");
  const actionType = text(selected.actionType, "MENTOR_DECISION_ACTION_REQUIRED", 100);
  text(boundary, "MENTOR_DECISION_BOUNDARY_REQUIRED", 100);
  const solutionPath = [...new Set([...options.map((candidate) => candidate.actionType), actionType])];
  assert.ok(solutionPath.length > 0, "MENTOR_DECISION_SOLUTION_PATH_REQUIRED");
  text(selected.expectedInformationTarget, "MENTOR_DECISION_VERIFICATION_TARGET_REQUIRED", 160);
  const authorized = options.some((candidate) => candidate.actionType === actionType) || actionType.startsWith("STOP_");
  assert.equal(authorized, true, "MENTOR_DECISION_OUTSIDE_EXISTING_AUTHORITY");
  assert.deepEqual(MENTOR_GUIDED_REASONING_CYCLE, [
    "ACTUAL_MISSION", "FINISH_LINE", "EARLIEST_SHARED_CAUSAL_BOUNDARY",
    "RETAINED_EVIDENCE_SUFFICIENCY", "AUTHORITY_SCOPE", "FAILURE_SCOPE",
    "SMALLEST_SAFE_ADVANCING_ACTION", "PROHIBITED_OPERATIONS",
    "UNCERTAINTY_AND_STOP_CONDITIONS"
  ]);
  const stopInsufficient = actionType === "STOP_INSUFFICIENT_EVIDENCE";
  const stopComplete = actionType === "STOP_COMPLETE";
  const acceptedEvidenceIds = [state.evidenceStateSummary.evidenceStateHash];
  const boundEvidenceIds = stopInsufficient ? [] : acceptedEvidenceIds;
  const emittedAction = {
    actionId: actionType,
    permittedOperations: selected.permittedOperations || [selected.operationPhase || actionType],
    selectedOperations: selected.selectedOperations || [selected.operationPhase || actionType],
    permittedChildOperations: selected.permittedChildOperations || [],
    permittedProviderPhases: selected.permittedProviderPhases || [],
    requiredEvidenceIds: repeatedLoopDetected || duplicateActionDetected ? acceptedEvidenceIds : boundEvidenceIds,
    evidenceReferences: repeatedLoopDetected || duplicateActionDetected ? acceptedEvidenceIds : boundEvidenceIds
  };
  const repeatedOrDuplicateStop = repeatedLoopDetected || duplicateActionDetected;
  const repeatedDecisionVector = repeatedOrDuplicateStop
    ? Object.freeze({
        retainedEvidenceSufficient: true,
        authorityClass: options.length ? MENTOR_AUTHORITY_CLASS.EXISTING : MENTOR_AUTHORITY_CLASS.UNRESOLVED,
        failureScope: MENTOR_FAILURE_SCOPE.BOUNDED,
        safeIndependentContinuation: false,
        nextActionClass: MENTOR_NEXT_ACTION_CLASS.STOP_REPEATED_LOOP,
        selectedActionId: null,
        repeatedLoopDetected,
        duplicateActionDetected
      })
    : null;
  const decision = repeatedOrDuplicateStop
    ? finalizeMentorDecisionResponse({
        actualMission: state.customerMission.purpose,
        finishLine: selected.expectedInformationTarget,
        earliestSharedCausalBoundary: state.knowledgeStateHash,
        decisionVector: repeatedDecisionVector,
        response: repeatedDecisionVector,
        actionEvidenceBinding: emittedAction,
        authoritativeRetainedEvidenceIds: acceptedEvidenceIds,
        acceptedEvidenceIds,
        rationaleCodes: selected.reasonCodes,
        prohibitedOperations: ["OUTSIDE_EXISTING_AUTHORITY"],
        uncertainties: selected.reasonCodes
      })
    : evaluateMentorDecisionContract({
    actualMission: state.customerMission.purpose,
    finishLine: selected.expectedInformationTarget,
    earliestSharedCausalBoundary: state.knowledgeStateHash,
    retainedEvidence: {
      requiredEvidenceIds: boundEvidenceIds,
      retainedEvidenceIds: acceptedEvidenceIds,
      acceptedEvidenceIds,
      supportsDecision: !stopInsufficient,
      contradictionPresent: false
    },
    authority: {
      allowedActionIds: options.map((candidate) => candidate.actionType),
      prohibitedActionIds: []
    },
    failure: { newMechanismRequired: false },
    missionComplete: stopComplete,
    actions: [selected, ...options.filter((candidate) => candidate.actionType !== actionType)]
      .filter((candidate) => !candidate.actionType.startsWith("STOP_"))
      .map((candidate, index) => ({
        actionId: candidate.actionType,
        ordinal: index,
        safe: true,
        materiallyAdvancesMission: true,
        requiresNewAuthority: false,
        requiredEvidenceIds: boundEvidenceIds,
        evidenceReferences: boundEvidenceIds,
        permittedOperations: [candidate.operationPhase || candidate.actionType],
        selectedOperations: [candidate.operationPhase || candidate.actionType],
        permittedChildOperations: candidate.permittedChildOperations || [],
        permittedProviderPhases: candidate.permittedProviderPhases || [],
        signature: `${candidate.actionType}:${candidate.targetIdentity}`
      })),
    emittedAction,
    previousActionSignatures: [],
    rationaleCodes: selected.reasonCodes,
    prohibitedOperations: ["OUTSIDE_EXISTING_AUTHORITY"],
    uncertainties: stopInsufficient ? selected.reasonCodes : []
  });
  if (!actionType.startsWith("STOP_")) {
    assert.equal(decision.selectedActionId, actionType, "MENTOR_DECISION_SMALLEST_ACTION_MISMATCH");
    assert.equal(decision.safeIndependentContinuation, true, "MENTOR_DECISION_SAFE_CONTINUATION_REQUIRED");
  }
  if (stopInsufficient && !repeatedOrDuplicateStop) {
    assert.equal(decision.nextActionClass, MENTOR_NEXT_ACTION_CLASS.STOP_INSUFFICIENT_EVIDENCE,
      "MENTOR_DECISION_INSUFFICIENT_EVIDENCE_STOP_REQUIRED");
  }
  if (stopComplete) {
    assert.equal(decision.nextActionClass, MENTOR_NEXT_ACTION_CLASS.STOP_COMPLETE,
      "MENTOR_DECISION_COMPLETE_STOP_REQUIRED");
  }
  if (repeatedOrDuplicateStop) {
    assert.equal(decision.nextActionClass, MENTOR_NEXT_ACTION_CLASS.STOP_REPEATED_LOOP,
      "MENTOR_DECISION_REPEATED_LOOP_STOP_REQUIRED");
    assert.equal(decision.repeatedLoopDetected || decision.duplicateActionDetected, true,
      "MENTOR_DECISION_REPEAT_OR_DUPLICATE_CAUSE_REQUIRED");
  }
  return decision;
}
