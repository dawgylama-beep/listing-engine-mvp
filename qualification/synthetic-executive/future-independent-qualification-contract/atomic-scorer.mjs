import assert from "node:assert/strict";

export const ATOMIC_PREDICATE_TYPE = Object.freeze({
  ENUM_EQUALS: "ENUM_EQUALS",
  ENUM_IN: "ENUM_IN",
  BOOLEAN_EQUALS: "BOOLEAN_EQUALS",
  NULLABLE_EQUALS: "NULLABLE_EQUALS",
  REQUIRED_FIELD: "REQUIRED_FIELD",
  SET_INCLUDES: "SET_INCLUDES",
  SET_EXCLUDES: "SET_EXCLUDES",
  ARRAY_MIN_CARDINALITY: "ARRAY_MIN_CARDINALITY",
  ARRAY_EXACT_CARDINALITY: "ARRAY_EXACT_CARDINALITY",
  EVIDENCE_REFERENCE_COVERAGE: "EVIDENCE_REFERENCE_COVERAGE",
  PROHIBITED_OPERATION_ABSENCE: "PROHIBITED_OPERATION_ABSENCE",
  CROSS_FIELD_IMPLIES: "CROSS_FIELD_IMPLIES",
  CROSS_FIELD_CONTRADICTION: "CROSS_FIELD_CONTRADICTION",
  AUTHORITY_ACTION_COMPATIBILITY: "AUTHORITY_ACTION_COMPATIBILITY",
  EVIDENCE_CONCLUSION_COMPATIBILITY: "EVIDENCE_CONCLUSION_COMPATIBILITY",
  FAILURE_SCOPE_ACTION_COMPATIBILITY: "FAILURE_SCOPE_ACTION_COMPATIBILITY",
  NARRATIVE_CONSTRAINT: "NARRATIVE_CONSTRAINT"
});

export const ATOMIC_PREDICATE_TYPES = Object.freeze(Object.values(ATOMIC_PREDICATE_TYPE));

const JSON_TYPES = new Set(["array", "boolean", "null", "number", "object", "string"]);

function jsonType(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function uniqueStrings(value, code, { allowEmpty = false } = {}) {
  assert.ok(Array.isArray(value), code);
  assert.equal(value.every((item) => typeof item === "string" && item.length > 0), true, code);
  if (!allowEmpty) assert.ok(value.length > 0, code);
  assert.equal(new Set(value).size, value.length, `${code}_DUPLICATE`);
  return value;
}

function valueAt(input, field) {
  const parts = field.split(".");
  let value = input;
  for (const part of parts) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, part)) {
      return { present: false, value: undefined };
    }
    value = value[part];
  }
  return { present: true, value };
}

function conditionFields(condition, code) {
  assert.ok(condition && typeof condition === "object" && !Array.isArray(condition), code);
  assert.equal(typeof condition.field, "string", code);
  assert.ok(Object.hasOwn(condition, "equals"), code);
  return [condition.field];
}

function referencedFields(predicate) {
  switch (predicate.type) {
    case ATOMIC_PREDICATE_TYPE.EVIDENCE_REFERENCE_COVERAGE:
      return [predicate.field, predicate.requiredEvidenceField];
    case ATOMIC_PREDICATE_TYPE.CROSS_FIELD_IMPLIES:
      return [
        ...conditionFields(predicate.if, "ATOMIC_IMPLIES_IF_INVALID"),
        ...conditionFields(predicate.then, "ATOMIC_IMPLIES_THEN_INVALID")
      ];
    case ATOMIC_PREDICATE_TYPE.CROSS_FIELD_CONTRADICTION:
      return [
        ...conditionFields(predicate.left, "ATOMIC_CONTRADICTION_LEFT_INVALID"),
        ...conditionFields(predicate.right, "ATOMIC_CONTRADICTION_RIGHT_INVALID")
      ];
    case ATOMIC_PREDICATE_TYPE.AUTHORITY_ACTION_COMPATIBILITY:
      return [predicate.authorityField, predicate.actionField];
    case ATOMIC_PREDICATE_TYPE.EVIDENCE_CONCLUSION_COMPATIBILITY:
      return [predicate.evidenceSufficientField, predicate.conclusionField];
    case ATOMIC_PREDICATE_TYPE.FAILURE_SCOPE_ACTION_COMPATIBILITY:
      return [predicate.failureScopeField, predicate.actionField];
    default:
      return [predicate.field];
  }
}

function fieldTypeValid(fieldSpec, value) {
  if (value === null && fieldSpec.nullable === true) return true;
  return jsonType(value) === fieldSpec.type;
}

function conditionMatches(response, condition) {
  const actual = valueAt(response, condition.field);
  return actual.present && Object.is(actual.value, condition.equals);
}

function pairAllowed(left, right, allowedPairs) {
  return allowedPairs.some((pair) => Array.isArray(pair)
    && pair.length === 2
    && Object.is(pair[0], left)
    && Object.is(pair[1], right));
}

function predicateContradictionKey(predicate) {
  if ([
    ATOMIC_PREDICATE_TYPE.ENUM_EQUALS,
    ATOMIC_PREDICATE_TYPE.BOOLEAN_EQUALS,
    ATOMIC_PREDICATE_TYPE.NULLABLE_EQUALS
  ].includes(predicate.type)) return `${predicate.type}:${predicate.field}`;
  return "";
}

export function assertNoContradictoryPredicates(predicates) {
  const exact = new Map();
  const includes = new Map();
  const excludes = new Map();
  for (const predicate of predicates) {
    const key = predicateContradictionKey(predicate);
    if (key) {
      const serialized = JSON.stringify(predicate.expected);
      if (exact.has(key)) assert.equal(exact.get(key), serialized, "ATOMIC_CONTRADICTORY_EXACT_PREDICATES");
      exact.set(key, serialized);
    }
    if (predicate.type === ATOMIC_PREDICATE_TYPE.SET_INCLUDES) {
      includes.set(predicate.field, new Set([...(includes.get(predicate.field) || []), ...predicate.members]));
    }
    if (predicate.type === ATOMIC_PREDICATE_TYPE.SET_EXCLUDES) {
      excludes.set(predicate.field, new Set([...(excludes.get(predicate.field) || []), ...predicate.members]));
    }
  }
  for (const [field, required] of includes) {
    const forbidden = excludes.get(field) || new Set();
    assert.equal([...required].some((value) => forbidden.has(value)), false,
      "ATOMIC_CONTRADICTORY_SET_PREDICATES");
  }
  return true;
}

export function validateAtomicContract(contract) {
  assert.ok(contract && typeof contract === "object" && !Array.isArray(contract), "ATOMIC_CONTRACT_REQUIRED");
  assert.ok(contract.fields && typeof contract.fields === "object" && !Array.isArray(contract.fields),
    "ATOMIC_FIELD_REGISTRY_REQUIRED");
  const fieldNames = Object.keys(contract.fields);
  assert.ok(fieldNames.length > 0, "ATOMIC_FIELD_REGISTRY_EMPTY");
  for (const [field, spec] of Object.entries(contract.fields)) {
    assert.ok(field.length > 0 && spec && typeof spec === "object", "ATOMIC_FIELD_SPEC_INVALID");
    assert.ok(JSON_TYPES.has(spec.type), "ATOMIC_FIELD_TYPE_UNKNOWN");
    if (spec.narrative === true) assert.equal(spec.type, "string", "ATOMIC_NARRATIVE_FIELD_MUST_BE_STRING");
  }
  assert.ok(Array.isArray(contract.predicates) && contract.predicates.length > 0, "ATOMIC_PREDICATES_REQUIRED");
  const predicateIds = contract.predicates.map((predicate) => predicate.predicateId);
  uniqueStrings(predicateIds, "ATOMIC_PREDICATE_ID_REQUIRED");
  for (const predicate of contract.predicates) {
    assert.ok(ATOMIC_PREDICATE_TYPES.includes(predicate.type), "ATOMIC_PREDICATE_TYPE_UNKNOWN");
    for (const field of referencedFields(predicate)) {
      assert.equal(typeof field, "string", "ATOMIC_PREDICATE_FIELD_REQUIRED");
      assert.equal(Object.hasOwn(contract.fields, field), true, "ATOMIC_PREDICATE_FIELD_UNKNOWN");
    }
    if (predicate.type === ATOMIC_PREDICATE_TYPE.NARRATIVE_CONSTRAINT) {
      assert.equal(contract.fields[predicate.field].narrative, true, "ATOMIC_NARRATIVE_FIELD_NOT_DECLARED");
      assert.ok(Number.isInteger(predicate.maximumLength) && predicate.maximumLength > 0,
        "ATOMIC_NARRATIVE_MAXIMUM_INVALID");
      uniqueStrings(predicate.prohibitedTerms || [], "ATOMIC_NARRATIVE_PROHIBITED_TERMS_INVALID", { allowEmpty: true });
      uniqueStrings(predicate.requiredReferences || [], "ATOMIC_NARRATIVE_REFERENCES_INVALID", { allowEmpty: true });
      assert.equal(Object.hasOwn(predicate, "expected"), false, "ATOMIC_NARRATIVE_FULL_STRING_EQUALITY_FORBIDDEN");
    }
  }
  assertNoContradictoryPredicates(contract.predicates);
  assert.ok(Array.isArray(contract.checks) && contract.checks.length > 0, "ATOMIC_CHECKS_REQUIRED");
  const checkIds = contract.checks.map((check) => check.checkId);
  uniqueStrings(checkIds, "ATOMIC_CHECK_ID_REQUIRED");
  const knownPredicates = new Set(predicateIds);
  const bound = [];
  for (const check of contract.checks) {
    const ids = uniqueStrings(check.predicateIds, "ATOMIC_CHECK_PREDICATES_REQUIRED");
    assert.equal(ids.every((id) => knownPredicates.has(id)), true, "ATOMIC_CHECK_PREDICATE_UNKNOWN");
    bound.push(...ids);
  }
  assert.equal(new Set(bound).size, bound.length, "ATOMIC_PREDICATE_BOUND_MORE_THAN_ONCE");
  assert.deepEqual([...bound].sort(), [...predicateIds].sort(), "ATOMIC_PREDICATE_BINDING_INCOMPLETE");
  return Object.freeze({ fieldCount: fieldNames.length, predicateCount: predicateIds.length, checkCount: checkIds.length });
}

function evaluateDeclaredPredicate(predicate, response) {
  const actual = predicate.field ? valueAt(response, predicate.field) : null;
  switch (predicate.type) {
    case ATOMIC_PREDICATE_TYPE.ENUM_EQUALS:
    case ATOMIC_PREDICATE_TYPE.BOOLEAN_EQUALS:
    case ATOMIC_PREDICATE_TYPE.NULLABLE_EQUALS:
      return actual.present && Object.is(actual.value, predicate.expected);
    case ATOMIC_PREDICATE_TYPE.ENUM_IN:
      return actual.present && Array.isArray(predicate.allowed) && predicate.allowed.includes(actual.value);
    case ATOMIC_PREDICATE_TYPE.REQUIRED_FIELD:
      return actual.present;
    case ATOMIC_PREDICATE_TYPE.SET_INCLUDES:
      return actual.present && Array.isArray(actual.value)
        && predicate.members.every((member) => actual.value.includes(member));
    case ATOMIC_PREDICATE_TYPE.SET_EXCLUDES:
    case ATOMIC_PREDICATE_TYPE.PROHIBITED_OPERATION_ABSENCE:
      return actual.present && Array.isArray(actual.value)
        && predicate.members.every((member) => !actual.value.includes(member));
    case ATOMIC_PREDICATE_TYPE.ARRAY_MIN_CARDINALITY:
      return actual.present && Array.isArray(actual.value) && actual.value.length >= predicate.minimum;
    case ATOMIC_PREDICATE_TYPE.ARRAY_EXACT_CARDINALITY:
      return actual.present && Array.isArray(actual.value) && actual.value.length === predicate.exact;
    case ATOMIC_PREDICATE_TYPE.EVIDENCE_REFERENCE_COVERAGE: {
      const required = valueAt(response, predicate.requiredEvidenceField);
      return actual.present && required.present && Array.isArray(actual.value) && Array.isArray(required.value)
        && required.value.every((reference) => actual.value.includes(reference));
    }
    case ATOMIC_PREDICATE_TYPE.CROSS_FIELD_IMPLIES:
      return !conditionMatches(response, predicate.if) || conditionMatches(response, predicate.then);
    case ATOMIC_PREDICATE_TYPE.CROSS_FIELD_CONTRADICTION:
      return !(conditionMatches(response, predicate.left) && conditionMatches(response, predicate.right));
    case ATOMIC_PREDICATE_TYPE.AUTHORITY_ACTION_COMPATIBILITY: {
      const authority = valueAt(response, predicate.authorityField);
      const action = valueAt(response, predicate.actionField);
      return authority.present && action.present && pairAllowed(authority.value, action.value, predicate.allowedPairs);
    }
    case ATOMIC_PREDICATE_TYPE.EVIDENCE_CONCLUSION_COMPATIBILITY: {
      const evidence = valueAt(response, predicate.evidenceSufficientField);
      const conclusion = valueAt(response, predicate.conclusionField);
      return evidence.present && conclusion.present
        && (!predicate.requiresEvidenceValues.includes(conclusion.value) || evidence.value === true);
    }
    case ATOMIC_PREDICATE_TYPE.FAILURE_SCOPE_ACTION_COMPATIBILITY: {
      const scope = valueAt(response, predicate.failureScopeField);
      const action = valueAt(response, predicate.actionField);
      return scope.present && action.present && pairAllowed(scope.value, action.value, predicate.allowedPairs);
    }
    case ATOMIC_PREDICATE_TYPE.NARRATIVE_CONSTRAINT:
      return actual.present
        && typeof actual.value === "string"
        && actual.value.length > 0
        && actual.value.length <= predicate.maximumLength
        && predicate.prohibitedTerms.every((term) => !actual.value.includes(term))
        && predicate.requiredReferences.every((reference) => actual.value.includes(reference));
    default:
      assert.fail("ATOMIC_PREDICATE_TYPE_UNKNOWN");
  }
}

export function reconcilePredicateExecutions(contract, executions) {
  validateAtomicContract(contract);
  assert.ok(Array.isArray(executions), "ATOMIC_EXECUTIONS_REQUIRED");
  const ids = executions.map((execution) => execution.predicateId);
  uniqueStrings(ids, "ATOMIC_EXECUTION_ID_REQUIRED");
  const declared = contract.predicates.map((predicate) => predicate.predicateId).sort();
  assert.deepEqual([...ids].sort(), declared, "ATOMIC_PREDICATE_EXECUTION_SET_MISMATCH");
  return true;
}

export function evaluateAtomicContract(contract, response) {
  const contractSummary = validateAtomicContract(contract);
  assert.ok(response && typeof response === "object" && !Array.isArray(response), "ATOMIC_RESPONSE_REQUIRED");
  const executions = contract.predicates.map((predicate) => {
    const fields = referencedFields(predicate);
    const fieldState = fields.map((field) => {
      const actual = valueAt(response, field);
      return {
        field,
        present: actual.present,
        typeValid: actual.present && fieldTypeValid(contract.fields[field], actual.value)
      };
    });
    const structuralPass = fieldState.every((state) => state.present && state.typeValid);
    const passed = structuralPass && evaluateDeclaredPredicate(predicate, response);
    return Object.freeze({
      predicateId: predicate.predicateId,
      type: predicate.type,
      passed,
      failureCode: passed
        ? null
        : fieldState.some((state) => !state.present)
          ? "MISSING_FIELD"
          : fieldState.some((state) => !state.typeValid)
            ? "INVALID_TYPE"
            : "PREDICATE_FALSE"
    });
  });
  reconcilePredicateExecutions(contract, executions);
  const byId = new Map(executions.map((execution) => [execution.predicateId, execution]));
  const checks = contract.checks.map((check) => {
    const predicateResults = check.predicateIds.map((predicateId) => byId.get(predicateId));
    return Object.freeze({
      checkId: check.checkId,
      conjunction: true,
      passed: predicateResults.every((execution) => execution.passed),
      predicateIds: Object.freeze([...check.predicateIds])
    });
  });
  return Object.freeze({
    valid: true,
    qualified: checks.every((check) => check.passed),
    discretionaryPartialCredit: false,
    providerEvaluatorUsed: false,
    narrativeSemanticInferenceUsed: false,
    contractSummary,
    executions: Object.freeze(executions),
    checks: Object.freeze(checks)
  });
}
