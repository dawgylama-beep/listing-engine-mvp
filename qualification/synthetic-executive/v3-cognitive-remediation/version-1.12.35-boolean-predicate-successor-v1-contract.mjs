const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

export function requirePlainObject(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${label}:EXPECTED_PLAIN_OBJECT`);
  return value;
}

export function requireOwn(value, key, label) {
  requirePlainObject(value, label);
  if (own(value, key) !== true) throw new Error(`${label}.${key}:MISSING_OWN_PROPERTY`);
  return value[key];
}

export function requireExactBoolean(value, key, expected, label) {
  if (typeof expected !== "boolean") throw new Error(`${label}.${key}:INVALID_EXPECTED_BOOLEAN`);
  const actual = requireOwn(value, key, label);
  if (typeof actual !== "boolean") throw new Error(`${label}.${key}:EXPECTED_BOOLEAN`);
  if (actual !== expected) throw new Error(`${label}.${key}:EXPECTED_${String(expected).toUpperCase()}`);
  return actual;
}

export function requireNonemptyString(value, key, label) {
  const actual = requireOwn(value, key, label);
  if (typeof actual !== "string" || actual.length === 0) throw new Error(`${label}.${key}:EXPECTED_NONEMPTY_STRING`);
  return actual;
}

export function requireExactString(value, key, expected, label) {
  const actual = requireNonemptyString(value, key, label);
  if (actual !== expected) throw new Error(`${label}.${key}:EXPECTED_LITERAL:${expected}`);
  return actual;
}

export function requireInteger(value, key, { minimum = Number.MIN_SAFE_INTEGER, maximum = Number.MAX_SAFE_INTEGER } = {}, label) {
  const actual = requireOwn(value, key, label);
  if (typeof actual !== "number" || Number.isInteger(actual) !== true || actual < minimum || actual > maximum) throw new Error(`${label}.${key}:EXPECTED_INTEGER_${minimum}_${maximum}`);
  return actual;
}

export function requireStringArray(value, key, { minimumLength = 0 } = {}, label) {
  const actual = requireOwn(value, key, label);
  if (Array.isArray(actual) !== true || actual.length < minimumLength || actual.some((item) => typeof item !== "string" || item.length === 0)) throw new Error(`${label}.${key}:EXPECTED_STRING_ARRAY_MIN_${minimumLength}`);
  return actual;
}

export function requireOwnPlainObject(value, key, label) {
  return requirePlainObject(requireOwn(value, key, label), `${label}.${key}`);
}

const retainedIds = new Set(Array.from({ length: 28 }, (_, index) => `STATIC-${String(index + 1).padStart(3, "0")}`));
const pendingStaticIds = new Set(Array.from({ length: 25 }, (_, index) => `STATIC-${String(index + 29).padStart(3, "0")}`));
const pendingReleaseIds = new Set(Array.from({ length: 15 }, (_, index) => `RELEASE-${String(index + 1).padStart(3, "0")}`));

export const booleanContractDefinitions = Object.freeze([
  { id: "RULE_SHELL", field: "shell", expected: false },
  { id: "RULE_INLINE_NODE", field: "inlineNodeCommands", expected: false },
  { id: "RULE_SHELL_GENERATED_JAVASCRIPT", field: "shellGeneratedJavaScript", expected: false },
  { id: "RULE_WINDOWS_SHELL_REINTERPRETATION", field: "windowsShellReinterpretation", expected: false },
  { id: "RULE_RETAINED_EXECUTABLE", field: "retainedEntriesExecutable", expected: false },
  { id: "RULE_CONTINUE_INDEPENDENT_FAILURES", field: "continueIndependentFailures", expected: true },
  { id: "RULE_CREDENTIAL_ACCESS", field: "credentialAccessPermitted", expected: false },
  { id: "RULE_REMOTE_WRITE", field: "remoteWritePermitted", expected: false },
  { id: "RULE_BASELINE_REQUIRED", field: "baselineRequired", expected: true },
  { id: "ENTRY_SHELL", field: "shell", expected: false },
  { id: "ENTRY_OUTPUT_PRODUCING_FALSE", field: "outputProducing", expected: false },
  { id: "ENTRY_OUTPUT_PRODUCING_TRUE", field: "outputProducing", expected: true },
]);

export function validateRegistryEntry(entry, index) {
  const label = `registry.entries[${index}]`;
  requirePlainObject(entry, label);
  const id = requireNonemptyString(entry, "id", label);
  const kind = requireNonemptyString(entry, "kind", label);
  const name = requireNonemptyString(entry, "name", label);
  const state = requireNonemptyString(entry, "state", label);
  requireNonemptyString(entry, "workingDirectory", label);
  requireStringArray(entry, "arguments", { minimumLength: 0 }, label);
  requireStringArray(entry, "dependencies", { minimumLength: 1 }, label);
  requireExactBoolean(entry, "shell", false, label);
  requireExactBoolean(entry, "baselineRequired", true, label);
  const expectedOutputProducing = id === "STATIC-028";
  requireExactBoolean(entry, "outputProducing", expectedOutputProducing, label);
  requireInteger(entry, "timeoutMs", { minimum: 0, maximum: 300000 }, label);
  if (retainedIds.has(id) === true) {
    if (kind !== "STATIC" || state !== "RETAINED_PASS") throw new Error(`${label}:RETAINED_CLASSIFICATION_MISMATCH`);
    if (requireOwn(entry, "executable", label) !== null) throw new Error(`${label}.executable:EXPECTED_NULL`);
    if (entry.arguments.length !== 0 || entry.timeoutMs !== 0) throw new Error(`${label}:RETAINED_EXECUTION_CONTRACT_MISMATCH`);
    requireOwnPlainObject(entry, "retainedResult", label);
    if (entry.retainedResult.status !== "PASS" || entry.retainedResult.executionCount !== 1) throw new Error(`${label}.retainedResult:EXPECTED_SINGLE_PASS`);
  } else if (pendingStaticIds.has(id) === true) {
    if (kind !== "STATIC" || state !== "PENDING") throw new Error(`${label}:PENDING_STATIC_CLASSIFICATION_MISMATCH`);
    requireNonemptyString(entry, "executable", label);
  } else if (pendingReleaseIds.has(id) === true) {
    if (kind !== "RELEASE_GATE" || state !== "PENDING") throw new Error(`${label}:PENDING_RELEASE_CLASSIFICATION_MISMATCH`);
    requireNonemptyString(entry, "executable", label);
  } else {
    throw new Error(`${label}.id:UNAUTHORIZED_ENTRY_ID:${id}`);
  }
  return { id, kind, name, state };
}

export function validateRegistry(registry) {
  requirePlainObject(registry, "registry");
  requireExactString(registry, "schemaVersion", "2.0", "registry");
  requireExactString(registry, "registryType", "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_REGISTRY", "registry");
  requireExactString(registry, "registryState", "SEALED_PRE_EXECUTION", "registry");
  requireExactString(registry, "version", "1.12.35", "registry");
  requireNonemptyString(registry, "repositoryRoot", "registry");
  const rules = requireOwnPlainObject(registry, "executionRules", "registry");
  for (const definition of booleanContractDefinitions.slice(0, 9)) requireExactBoolean(rules, definition.field, definition.expected, "registry.executionRules");
  const counts = requireOwnPlainObject(registry, "counts", "registry");
  requireInteger(counts, "entries", { minimum: 68, maximum: 68 }, "registry.counts");
  requireInteger(counts, "retainedPass", { minimum: 28, maximum: 28 }, "registry.counts");
  requireInteger(counts, "pendingStatic", { minimum: 25, maximum: 25 }, "registry.counts");
  requireInteger(counts, "pendingReleaseGates", { minimum: 15, maximum: 15 }, "registry.counts");
  const entries = requireOwn(registry, "entries", "registry");
  if (Array.isArray(entries) !== true || entries.length !== 68) throw new Error("registry.entries:EXPECTED_68_ENTRY_ARRAY");
  entries.forEach(validateRegistryEntry);
  const ids = entries.map((entry) => entry.id);
  if (new Set(ids).size !== 68) throw new Error("registry.entries:DUPLICATE_IDS");
  return registry;
}

export const booleanMatrixRepresentations = Object.freeze([
  "EXACT_FALSE", "EXACT_TRUE", "MISSING", "UNDEFINED", "NULL", "STRING_FALSE", "STRING_TRUE", "ZERO", "ONE", "EMPTY_STRING", "EMPTY_ARRAY", "EMPTY_OBJECT",
]);

export function materializeRepresentation(representation) {
  if (representation === "EXACT_FALSE") return { present: true, value: false };
  if (representation === "EXACT_TRUE") return { present: true, value: true };
  if (representation === "MISSING") return { present: false, value: undefined };
  if (representation === "UNDEFINED") return { present: true, value: undefined };
  if (representation === "NULL") return { present: true, value: null };
  if (representation === "STRING_FALSE") return { present: true, value: "false" };
  if (representation === "STRING_TRUE") return { present: true, value: "true" };
  if (representation === "ZERO") return { present: true, value: 0 };
  if (representation === "ONE") return { present: true, value: 1 };
  if (representation === "EMPTY_STRING") return { present: true, value: "" };
  if (representation === "EMPTY_ARRAY") return { present: true, value: [] };
  if (representation === "EMPTY_OBJECT") return { present: true, value: {} };
  throw new Error(`UNKNOWN_REPRESENTATION:${representation}`);
}

export function runBooleanMatrixCase(definition, representation) {
  const materialized = materializeRepresentation(representation);
  const subject = {};
  if (materialized.present === true) subject[definition.field] = materialized.value;
  let accepted = false;
  let error = null;
  try {
    requireExactBoolean(subject, definition.field, definition.expected, definition.id);
    accepted = true;
  } catch (caught) {
    error = caught.message;
  }
  const expectedAccepted = representation === (definition.expected === true ? "EXACT_TRUE" : "EXACT_FALSE");
  return { caseId: `${definition.id}:${representation}`, definitionId: definition.id, field: definition.field, expectedLiteral: definition.expected, representation, expectedAccepted, accepted, matchesExpectation: accepted === expectedAccepted, error };
}

const typedCaseValues = Object.freeze({
  MISSING: { present: false, value: undefined }, UNDEFINED: { present: true, value: undefined }, NULL: { present: true, value: null }, FALSE: { present: true, value: false }, TRUE: { present: true, value: true }, ZERO: { present: true, value: 0 }, ONE: { present: true, value: 1 }, NEGATIVE_ONE: { present: true, value: -1 }, FRACTION: { present: true, value: 1.5 }, EMPTY_STRING: { present: true, value: "" }, STRING_FALSE: { present: true, value: "false" }, VALID_LITERAL: { present: true, value: "PENDING" }, WRONG_LITERAL: { present: true, value: "RETAINED_PASS" }, EMPTY_ARRAY: { present: true, value: [] }, VALID_STRING_ARRAY: { present: true, value: ["x"] }, INVALID_MIXED_ARRAY: { present: true, value: ["x", 1] }, EMPTY_OBJECT: { present: true, value: {} }, NONEMPTY_OBJECT: { present: true, value: { x: 1 } },
});

export const typedMatrixDefinitions = Object.freeze([
  { id: "NONEMPTY_STRING", representations: ["VALID_LITERAL", "STRING_FALSE", "MISSING", "UNDEFINED", "NULL", "FALSE", "TRUE", "ZERO", "ONE", "EMPTY_STRING", "EMPTY_ARRAY", "EMPTY_OBJECT"], expectedAccepted: ["VALID_LITERAL", "STRING_FALSE"] },
  { id: "EXACT_STRING", representations: ["VALID_LITERAL", "WRONG_LITERAL", "MISSING", "UNDEFINED", "NULL", "FALSE", "TRUE", "ZERO", "ONE", "EMPTY_STRING", "EMPTY_ARRAY", "EMPTY_OBJECT"], expectedAccepted: ["VALID_LITERAL"] },
  { id: "INTEGER_RANGE", representations: ["ZERO", "ONE", "NEGATIVE_ONE", "FRACTION", "STRING_FALSE", "MISSING", "UNDEFINED", "NULL", "FALSE", "TRUE", "EMPTY_ARRAY", "EMPTY_OBJECT"], expectedAccepted: ["ZERO", "ONE"] },
  { id: "NONEMPTY_STRING_ARRAY", representations: ["VALID_STRING_ARRAY", "EMPTY_ARRAY", "INVALID_MIXED_ARRAY", "VALID_LITERAL", "MISSING", "UNDEFINED", "NULL", "FALSE", "TRUE", "ZERO", "ONE", "EMPTY_OBJECT"], expectedAccepted: ["VALID_STRING_ARRAY"] },
  { id: "PLAIN_OBJECT", representations: ["EMPTY_OBJECT", "NONEMPTY_OBJECT", "EMPTY_ARRAY", "VALID_STRING_ARRAY", "VALID_LITERAL", "MISSING", "UNDEFINED", "NULL", "FALSE", "TRUE", "ZERO", "ONE"], expectedAccepted: ["EMPTY_OBJECT", "NONEMPTY_OBJECT"] },
]);

export function runTypedMatrixCase(definition, representation) {
  const materialized = typedCaseValues[representation];
  if (materialized === undefined) throw new Error(`UNKNOWN_TYPED_REPRESENTATION:${representation}`);
  const subject = {};
  if (materialized.present === true) subject.value = materialized.value;
  let accepted = false;
  let error = null;
  try {
    if (definition.id === "NONEMPTY_STRING") requireNonemptyString(subject, "value", definition.id);
    else if (definition.id === "EXACT_STRING") requireExactString(subject, "value", "PENDING", definition.id);
    else if (definition.id === "INTEGER_RANGE") requireInteger(subject, "value", { minimum: 0, maximum: 300000 }, definition.id);
    else if (definition.id === "NONEMPTY_STRING_ARRAY") requireStringArray(subject, "value", { minimumLength: 1 }, definition.id);
    else if (definition.id === "PLAIN_OBJECT") requireOwnPlainObject(subject, "value", definition.id);
    else throw new Error(`UNKNOWN_TYPED_DEFINITION:${definition.id}`);
    accepted = true;
  } catch (caught) { error = caught.message; }
  const expectedAccepted = definition.expectedAccepted.includes(representation);
  return { caseId: `${definition.id}:${representation}`, definitionId: definition.id, representation, expectedAccepted, accepted, matchesExpectation: accepted === expectedAccepted, error };
}
