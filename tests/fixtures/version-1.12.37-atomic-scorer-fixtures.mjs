import {
  ATOMIC_PREDICATE_TYPE,
  ATOMIC_PREDICATE_TYPES
} from "../../qualification/synthetic-executive/future-independent-qualification-contract/atomic-scorer.mjs";

export const atomicUnknownPredicateType = "UNKNOWN_ATOMIC_TYPE";

const fieldSpecs = Object.freeze({
  status: { type: "string" },
  equivalentStatus: { type: "string" },
  flag: { type: "boolean" },
  optionalLabel: { type: "string", nullable: true },
  requiredLabel: { type: "string" },
  tags: { type: "array" },
  evidenceReferences: { type: "array" },
  requiredEvidence: { type: "array" },
  prohibitedOperations: { type: "array" },
  trigger: { type: "boolean" },
  consequence: { type: "string" },
  conflict: { type: "boolean" },
  authorityClass: { type: "string" },
  nextActionClass: { type: "string" },
  evidenceSufficient: { type: "boolean" },
  conclusionClass: { type: "string" },
  failureScope: { type: "string" },
  rationale: { type: "string", narrative: true }
});

const passingResponse = Object.freeze({
  status: "READY",
  equivalentStatus: "ALPHA",
  flag: true,
  optionalLabel: null,
  requiredLabel: "present",
  tags: ["A", "B"],
  evidenceReferences: ["E1", "E2"],
  requiredEvidence: ["E1"],
  prohibitedOperations: [],
  trigger: true,
  consequence: "ALLOW",
  conflict: false,
  authorityClass: "EXISTING",
  nextActionClass: "ADVANCE",
  evidenceSufficient: true,
  conclusionClass: "APPROVE",
  failureScope: "BOUNDED",
  rationale: "Bounded explanation with explicit reference [E1]."
});

function declaration(type) {
  const common = { predicateId: `P_${type}`, type };
  const predicates = {
    [ATOMIC_PREDICATE_TYPE.ENUM_EQUALS]: { ...common, field: "status", expected: "READY" },
    [ATOMIC_PREDICATE_TYPE.ENUM_IN]: { ...common, field: "equivalentStatus", allowed: ["ALPHA", "BETA"] },
    [ATOMIC_PREDICATE_TYPE.BOOLEAN_EQUALS]: { ...common, field: "flag", expected: true },
    [ATOMIC_PREDICATE_TYPE.NULLABLE_EQUALS]: { ...common, field: "optionalLabel", expected: null },
    [ATOMIC_PREDICATE_TYPE.REQUIRED_FIELD]: { ...common, field: "requiredLabel" },
    [ATOMIC_PREDICATE_TYPE.SET_INCLUDES]: { ...common, field: "tags", members: ["A", "B"] },
    [ATOMIC_PREDICATE_TYPE.SET_EXCLUDES]: { ...common, field: "tags", members: ["X"] },
    [ATOMIC_PREDICATE_TYPE.ARRAY_MIN_CARDINALITY]: { ...common, field: "tags", minimum: 2 },
    [ATOMIC_PREDICATE_TYPE.ARRAY_EXACT_CARDINALITY]: { ...common, field: "tags", exact: 2 },
    [ATOMIC_PREDICATE_TYPE.EVIDENCE_REFERENCE_COVERAGE]: {
      ...common,
      field: "evidenceReferences",
      requiredEvidenceField: "requiredEvidence"
    },
    [ATOMIC_PREDICATE_TYPE.PROHIBITED_OPERATION_ABSENCE]: {
      ...common,
      field: "prohibitedOperations",
      members: ["DELETE"]
    },
    [ATOMIC_PREDICATE_TYPE.CROSS_FIELD_IMPLIES]: {
      ...common,
      if: { field: "trigger", equals: true },
      then: { field: "consequence", equals: "ALLOW" }
    },
    [ATOMIC_PREDICATE_TYPE.CROSS_FIELD_CONTRADICTION]: {
      ...common,
      left: { field: "trigger", equals: true },
      right: { field: "conflict", equals: true }
    },
    [ATOMIC_PREDICATE_TYPE.AUTHORITY_ACTION_COMPATIBILITY]: {
      ...common,
      authorityField: "authorityClass",
      actionField: "nextActionClass",
      allowedPairs: [["EXISTING", "ADVANCE"]]
    },
    [ATOMIC_PREDICATE_TYPE.EVIDENCE_CONCLUSION_COMPATIBILITY]: {
      ...common,
      evidenceSufficientField: "evidenceSufficient",
      conclusionField: "conclusionClass",
      requiresEvidenceValues: ["APPROVE"]
    },
    [ATOMIC_PREDICATE_TYPE.FAILURE_SCOPE_ACTION_COMPATIBILITY]: {
      ...common,
      failureScopeField: "failureScope",
      actionField: "nextActionClass",
      allowedPairs: [["BOUNDED", "ADVANCE"]]
    },
    [ATOMIC_PREDICATE_TYPE.NARRATIVE_CONSTRAINT]: {
      ...common,
      field: "rationale",
      maximumLength: 100,
      prohibitedTerms: ["forbidden"],
      requiredReferences: ["[E1]"]
    }
  };
  return structuredClone(predicates[type]);
}

function fieldsFor(predicate) {
  const fields = [
    predicate.field,
    predicate.requiredEvidenceField,
    predicate.if?.field,
    predicate.then?.field,
    predicate.left?.field,
    predicate.right?.field,
    predicate.authorityField,
    predicate.actionField,
    predicate.evidenceSufficientField,
    predicate.conclusionField,
    predicate.failureScopeField
  ].filter(Boolean);
  return Object.fromEntries([...new Set(fields)].map((field) => [field, structuredClone(fieldSpecs[field])]));
}

function contractFor(predicate) {
  const isolatedPredicate = structuredClone(predicate);
  return {
    schemaVersion: "1.0",
    fields: fieldsFor(isolatedPredicate),
    predicates: [isolatedPredicate],
    checks: [{ checkId: `CHECK_${isolatedPredicate.type}`, predicateIds: [isolatedPredicate.predicateId] }]
  };
}

function negativeResponse(type) {
  const response = structuredClone(passingResponse);
  const changes = {
    [ATOMIC_PREDICATE_TYPE.ENUM_EQUALS]: () => { response.status = "WAIT"; },
    [ATOMIC_PREDICATE_TYPE.ENUM_IN]: () => { response.equivalentStatus = "GAMMA"; },
    [ATOMIC_PREDICATE_TYPE.BOOLEAN_EQUALS]: () => { response.flag = false; },
    [ATOMIC_PREDICATE_TYPE.NULLABLE_EQUALS]: () => { response.optionalLabel = "VALUE"; },
    [ATOMIC_PREDICATE_TYPE.REQUIRED_FIELD]: () => { delete response.requiredLabel; },
    [ATOMIC_PREDICATE_TYPE.SET_INCLUDES]: () => { response.tags = ["A"]; },
    [ATOMIC_PREDICATE_TYPE.SET_EXCLUDES]: () => { response.tags = ["A", "X"]; },
    [ATOMIC_PREDICATE_TYPE.ARRAY_MIN_CARDINALITY]: () => { response.tags = ["A"]; },
    [ATOMIC_PREDICATE_TYPE.ARRAY_EXACT_CARDINALITY]: () => { response.tags = ["A"]; },
    [ATOMIC_PREDICATE_TYPE.EVIDENCE_REFERENCE_COVERAGE]: () => { response.evidenceReferences = []; },
    [ATOMIC_PREDICATE_TYPE.PROHIBITED_OPERATION_ABSENCE]: () => { response.prohibitedOperations = ["DELETE"]; },
    [ATOMIC_PREDICATE_TYPE.CROSS_FIELD_IMPLIES]: () => { response.consequence = "DENY"; },
    [ATOMIC_PREDICATE_TYPE.CROSS_FIELD_CONTRADICTION]: () => { response.conflict = true; },
    [ATOMIC_PREDICATE_TYPE.AUTHORITY_ACTION_COMPATIBILITY]: () => { response.nextActionClass = "STOP"; },
    [ATOMIC_PREDICATE_TYPE.EVIDENCE_CONCLUSION_COMPATIBILITY]: () => { response.evidenceSufficient = false; },
    [ATOMIC_PREDICATE_TYPE.FAILURE_SCOPE_ACTION_COMPATIBILITY]: () => { response.failureScope = "ARCHITECTURAL"; },
    [ATOMIC_PREDICATE_TYPE.NARRATIVE_CONSTRAINT]: () => { response.rationale = "forbidden [E1]"; }
  };
  changes[type]();
  return response;
}

function firstField(predicate) {
  return Object.keys(fieldsFor(predicate))[0];
}

function fixtureSet(type, index) {
  const predicate = declaration(type);
  const positiveContract = contractFor(predicate);
  const missing = structuredClone(passingResponse);
  delete missing[firstField(predicate)];
  const wrongType = structuredClone(passingResponse);
  wrongType[firstField(predicate)] = { invalid: true };
  const contradictionContract = contractFor(predicate);
  contradictionContract.fields.flag = { type: "boolean" };
  contradictionContract.predicates.push(
    { predicateId: "CONFLICT_TRUE", type: "BOOLEAN_EQUALS", field: "flag", expected: true },
    { predicateId: "CONFLICT_FALSE", type: "BOOLEAN_EQUALS", field: "flag", expected: false }
  );
  contradictionContract.checks[0].predicateIds.push("CONFLICT_TRUE", "CONFLICT_FALSE");
  const unknownContract = contractFor(predicate);
  const unknownPredicateProbe = index === 0;
  if (unknownPredicateProbe) unknownContract.predicates[0].type = atomicUnknownPredicateType;
  else {
    const field = firstField(unknownContract.predicates[0]);
    if (unknownContract.predicates[0].field) unknownContract.predicates[0].field = "undeclaredField";
    else if (unknownContract.predicates[0].authorityField) unknownContract.predicates[0].authorityField = "undeclaredField";
    else if (unknownContract.predicates[0].evidenceSufficientField) unknownContract.predicates[0].evidenceSufficientField = "undeclaredField";
    else if (unknownContract.predicates[0].failureScopeField) unknownContract.predicates[0].failureScopeField = "undeclaredField";
    else if (unknownContract.predicates[0].if) unknownContract.predicates[0].if.field = "undeclaredField";
    else if (unknownContract.predicates[0].left) unknownContract.predicates[0].left.field = "undeclaredField";
    else throw new Error(`unknown-field mutation unavailable for ${field}`);
  }
  return [
    { fixtureId: `${type}_POSITIVE`, predicateType: type, class: "VALID_POSITIVE", contract: positiveContract, response: structuredClone(passingResponse), expected: "PASS" },
    { fixtureId: `${type}_NEGATIVE`, predicateType: type, class: "VALID_NEGATIVE", contract: contractFor(declaration(type)), response: negativeResponse(type), expected: "FAIL" },
    { fixtureId: `${type}_MISSING`, predicateType: type, class: "MISSING_FIELD", contract: contractFor(declaration(type)), response: missing, expected: "FAIL" },
    { fixtureId: `${type}_WRONG_TYPE`, predicateType: type, class: "WRONG_TYPE", contract: contractFor(declaration(type)), response: wrongType, expected: "FAIL" },
    { fixtureId: `${type}_CONTRADICTORY`, predicateType: type, class: "CONTRADICTORY_COMBINATION", contract: contradictionContract, response: structuredClone(passingResponse), expected: "REJECT_CONTRACT" },
    { fixtureId: `${type}_UNKNOWN`, predicateType: type, class: unknownPredicateProbe ? "UNKNOWN_PREDICATE" : "UNKNOWN_FIELD", contract: unknownContract, response: structuredClone(passingResponse), expected: "REJECT_CONTRACT" }
  ];
}

export const atomicScorerFixtures = Object.freeze(
  ATOMIC_PREDICATE_TYPES.flatMap((type, index) => fixtureSet(type, index)).map(Object.freeze)
);

export const atomicPassingResponse = passingResponse;
export const atomicPredicateDeclaration = declaration;
export const atomicContractForPredicate = contractFor;
export const atomicNegativeResponse = negativeResponse;
