import {
  booleanContractDefinitions,
  booleanMatrixRepresentations,
  materializeRepresentation,
  requireExactBoolean,
  requireExactString,
  requireInteger,
  requireNonemptyString,
  requireOwn,
  requireOwnPlainObject,
  requirePlainObject,
  requireStringArray,
  runBooleanMatrixCase,
  runTypedMatrixCase,
  typedMatrixDefinitions,
} from "./version-1.12.35-boolean-predicate-successor-v1-contract.mjs";
import { compactJson, compareInventoryMemberSets, requireOwnAbsent, verifySeal } from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";

export {
  booleanContractDefinitions,
  booleanMatrixRepresentations,
  materializeRepresentation,
  requireExactBoolean,
  requireExactString,
  requireInteger,
  requireNonemptyString,
  requireOwn,
  requireOwnPlainObject,
  requirePlainObject,
  requireStringArray,
  runBooleanMatrixCase,
  runTypedMatrixCase,
  typedMatrixDefinitions,
};

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const EXPECTED_HEAD = "5da4c3de47a2860495087bacacdd60ac3c65603b";
const EXPECTED_TREE = "d5c162ae6777c6e080ac27de0d9a0ae29fda8ace";
const EXPECTED_PARENT = "e2b511d6b95f1049369a1128dbb38c4b26d762b6";
const EXPECTED_REMOTE = "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35";
const RETAINED_IDS = Array.from({ length: 28 }, (_, index) => `STATIC-${String(index + 1).padStart(3, "0")}`);
const PENDING_STATIC_IDS = Array.from({ length: 25 }, (_, index) => `STATIC-${String(index + 29).padStart(3, "0")}`);
const PENDING_RELEASE_IDS = Array.from({ length: 15 }, (_, index) => `RELEASE-${String(index + 1).padStart(3, "0")}`);
export const EXPECTED_ENTRY_IDS = Object.freeze([...RETAINED_IDS, ...PENDING_STATIC_IDS, ...PENDING_RELEASE_IDS]);

export function requireExactKeys(value, expectedKeys, label) {
  requirePlainObject(value, label);
  const actual = Object.keys(value).sort();
  const expected = [...expectedKeys].sort();
  if (compactJson(actual) !== compactJson(expected)) throw new Error(`${label}:EXACT_KEYS_MISMATCH:${compactJson({ expected, actual })}`);
  return value;
}

export function requireNullableString(value, key, label) {
  const actual = requireOwn(value, key, label);
  if (actual !== null && typeof actual !== "string") throw new Error(`${label}.${key}:EXPECTED_NULL_OR_STRING`);
  return actual;
}

export function requireExactStringArray(value, key, expected, label) {
  const actual = requireStringArray(value, key, { minimumLength: expected.length }, label);
  if (actual.length !== expected.length || actual.some((item, index) => item !== expected[index])) throw new Error(`${label}.${key}:EXPECTED_EXACT_STRING_ARRAY`);
  return actual;
}

export function requireExactInteger(value, key, expected, label) {
  return requireInteger(value, key, { minimum: expected, maximum: expected }, label);
}

export function requireExactSha256(value, key, expected, label) {
  const actual = requireExactString(value, key, expected, label);
  if (/^[0-9a-f]{64}$/.test(actual) !== true) throw new Error(`${label}.${key}:EXPECTED_SHA256`);
  return actual;
}

function validateCheckpoint(registry) {
  const checkpoint = requireOwnPlainObject(registry, "checkpoint", "registry");
  requireExactKeys(checkpoint, ["branch", "head", "tree", "parent", "trackingAndRemote", "ahead", "behind"], "registry.checkpoint");
  requireExactString(checkpoint, "branch", "refactor/beta-evidence-pipeline", "registry.checkpoint");
  requireExactString(checkpoint, "head", EXPECTED_HEAD, "registry.checkpoint");
  requireExactString(checkpoint, "tree", EXPECTED_TREE, "registry.checkpoint");
  requireExactString(checkpoint, "parent", EXPECTED_PARENT, "registry.checkpoint");
  requireExactString(checkpoint, "trackingAndRemote", EXPECTED_REMOTE, "registry.checkpoint");
  requireExactInteger(checkpoint, "ahead", 13, "registry.checkpoint");
  requireExactInteger(checkpoint, "behind", 0, "registry.checkpoint");
}

function validateBinding(value, label, hashKey = "sha256", expectedKeys = ["relativePath", hashKey]) {
  requireExactKeys(value, expectedKeys, label);
  requireNonemptyString(value, "relativePath", label);
  const hash = requireNonemptyString(value, hashKey, label);
  if (/^[0-9a-f]{64}$/.test(hash) !== true) throw new Error(`${label}.${hashKey}:EXPECTED_SHA256`);
}

function validateRetainedResult(result, entry, label) {
  requireExactKeys(result, ["id", "path", "executionCount", "exitCode", "status", "sanitizedFailure", "generatedCaptureIdentity", "cleanupRestoration", "laterMembersSafeToExecute"], label);
  requireExactString(result, "id", entry.id, label);
  requireNonemptyString(result, "path", label);
  requireExactInteger(result, "executionCount", 1, label);
  requireExactInteger(result, "exitCode", 0, label);
  requireExactString(result, "status", "PASS", label);
  if (requireOwn(result, "sanitizedFailure", label) !== null) throw new Error(`${label}.sanitizedFailure:EXPECTED_NULL`);
  const cleanup = requireOwnPlainObject(result, "cleanupRestoration", label);
  if (entry.id === "STATIC-028") {
    const capture = requireOwnPlainObject(result, "generatedCaptureIdentity", label);
    requireExactKeys(capture, ["manifestPath", "captureManifestHash"], `${label}.generatedCaptureIdentity`);
    requireNonemptyString(capture, "manifestPath", `${label}.generatedCaptureIdentity`);
    requireExactSha256(capture, "captureManifestHash", "419c93872356ee994fc27120017952b9c805a34209226dd0c91f32a214f66d2a", `${label}.generatedCaptureIdentity`);
    requireExactKeys(cleanup, ["status", "rcFileCount", "rcTotalBytes", "inCommandMemberExact", "postStopUtf8MemberSetExact", "serverProcesses", "portListeners", "phase6aCount", "phase6aBytes", "persistentPoliciesUnchanged"], `${label}.cleanupRestoration`);
    requireExactString(cleanup, "status", "FAIL", `${label}.cleanupRestoration`);
    requireExactInteger(cleanup, "rcFileCount", 39, `${label}.cleanupRestoration`);
    requireExactInteger(cleanup, "rcTotalBytes", 3864482, `${label}.cleanupRestoration`);
    requireExactBoolean(cleanup, "inCommandMemberExact", false, `${label}.cleanupRestoration`);
    requireExactBoolean(cleanup, "postStopUtf8MemberSetExact", true, `${label}.cleanupRestoration`);
    requireExactInteger(cleanup, "serverProcesses", 0, `${label}.cleanupRestoration`);
    requireExactInteger(cleanup, "portListeners", 0, `${label}.cleanupRestoration`);
    requireExactInteger(cleanup, "phase6aCount", 85, `${label}.cleanupRestoration`);
    requireExactInteger(cleanup, "phase6aBytes", 72299353, `${label}.cleanupRestoration`);
    requireExactBoolean(cleanup, "persistentPoliciesUnchanged", true, `${label}.cleanupRestoration`);
    requireExactBoolean(result, "laterMembersSafeToExecute", false, label);
  } else {
    if (requireOwn(result, "generatedCaptureIdentity", label) !== null) throw new Error(`${label}.generatedCaptureIdentity:EXPECTED_NULL`);
    requireExactKeys(cleanup, ["status", "rcRestored"], `${label}.cleanupRestoration`);
    requireExactString(cleanup, "status", "NOT_REQUIRED", `${label}.cleanupRestoration`);
    if (requireOwn(cleanup, "rcRestored", `${label}.cleanupRestoration`) !== null) throw new Error(`${label}.cleanupRestoration.rcRestored:EXPECTED_NULL`);
    requireExactBoolean(result, "laterMembersSafeToExecute", true, label);
  }
}

export function validateRegistryEntry(entry, index) {
  const label = `registry.entries[${index}]`;
  const commonKeys = ["id", "kind", "name", "state", "executable", "arguments", "workingDirectory", "dependencies", "shell", "baselineRequired", "outputProducing", "timeoutMs"];
  requirePlainObject(entry, label);
  const id = requireNonemptyString(entry, "id", label);
  const retained = RETAINED_IDS.includes(id);
  requireExactKeys(entry, retained === true ? [...commonKeys, "retainedResult"] : commonKeys, label);
  requireNonemptyString(entry, "name", label);
  requireNonemptyString(entry, "workingDirectory", label);
  requireExactBoolean(entry, "shell", false, label);
  requireExactBoolean(entry, "baselineRequired", true, label);
  requireExactBoolean(entry, "outputProducing", id === "STATIC-028", label);
  const expectedDependencies = retained === true ? ["PRIOR_SWEEP_RESULT_SEALED"] : ["CHECKPOINT_VALID", "BOOLEAN_SUCCESSOR_OFFLINE_PROOF_PASS", "SAFE_EXECUTION_STATE"];
  requireExactStringArray(entry, "dependencies", expectedDependencies, label);
  if (retained === true) {
    requireExactString(entry, "kind", "STATIC", label);
    requireExactString(entry, "state", "RETAINED_PASS", label);
    if (requireOwn(entry, "executable", label) !== null) throw new Error(`${label}.executable:EXPECTED_NULL`);
    requireExactStringArray(entry, "arguments", [], label);
    requireExactInteger(entry, "timeoutMs", 0, label);
    validateRetainedResult(requireOwnPlainObject(entry, "retainedResult", label), entry, `${label}.retainedResult`);
  } else if (PENDING_STATIC_IDS.includes(id) === true) {
    requireExactString(entry, "kind", "STATIC", label);
    requireExactString(entry, "state", "PENDING", label);
    requireNonemptyString(entry, "executable", label);
    requireStringArray(entry, "arguments", { minimumLength: 7 }, label);
    requireExactInteger(entry, "timeoutMs", 300000, label);
  } else if (PENDING_RELEASE_IDS.includes(id) === true) {
    requireExactString(entry, "kind", "RELEASE_GATE", label);
    requireExactString(entry, "state", "PENDING", label);
    requireNonemptyString(entry, "executable", label);
    requireStringArray(entry, "arguments", { minimumLength: 1 }, label);
    requireExactInteger(entry, "timeoutMs", 300000, label);
  } else {
    throw new Error(`${label}.id:UNAUTHORIZED_ENTRY_ID:${id}`);
  }
  return entry;
}

export function validateRegistry(registry) {
  requireExactKeys(registry, ["schemaVersion", "registryType", "registryState", "version", "repositoryRoot", "checkpoint", "baseline", "priorEvidence", "executionRules", "counts", "entries", "registryHash"], "registry");
  requireExactString(registry, "schemaVersion", "3.0", "registry");
  requireExactString(registry, "registryType", "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_REGISTRY", "registry");
  requireExactString(registry, "registryState", "SEALED_PRE_EXECUTION", "registry");
  requireExactString(registry, "version", "1.12.35", "registry");
  requireNonemptyString(registry, "repositoryRoot", "registry");
  validateCheckpoint(registry);
  const baseline = requireOwnPlainObject(registry, "baseline", "registry");
  requireExactKeys(baseline, ["relativePath", "sha256", "baselineHash"], "registry.baseline");
  validateBinding(baseline, "registry.baseline", "sha256", ["relativePath", "sha256", "baselineHash"]);
  if (/^[0-9a-f]{64}$/.test(requireNonemptyString(baseline, "baselineHash", "registry.baseline")) !== true) throw new Error("registry.baseline.baselineHash:EXPECTED_SHA256");
  const prior = requireOwnPlainObject(registry, "priorEvidence", "registry");
  requireExactKeys(prior, ["registry", "offlineProof", "combinedResult", "terminalStop", "correction"], "registry.priorEvidence");
  for (const key of Object.keys(prior)) validateBinding(prior[key], `registry.priorEvidence.${key}`);
  const rules = requireOwnPlainObject(registry, "executionRules", "registry");
  requireExactKeys(rules, booleanContractDefinitions.slice(0, 9).map((item) => item.field), "registry.executionRules");
  for (const definition of booleanContractDefinitions.slice(0, 9)) requireExactBoolean(rules, definition.field, definition.expected, "registry.executionRules");
  const counts = requireOwnPlainObject(registry, "counts", "registry");
  requireExactKeys(counts, ["entries", "retainedPass", "pendingStatic", "pendingReleaseGates"], "registry.counts");
  requireExactInteger(counts, "entries", 68, "registry.counts");
  requireExactInteger(counts, "retainedPass", 28, "registry.counts");
  requireExactInteger(counts, "pendingStatic", 25, "registry.counts");
  requireExactInteger(counts, "pendingReleaseGates", 15, "registry.counts");
  const entries = requireOwn(registry, "entries", "registry");
  if (Array.isArray(entries) !== true || entries.length !== 68) throw new Error("registry.entries:EXPECTED_68_ENTRY_ARRAY");
  entries.forEach(validateRegistryEntry);
  const ids = entries.map((entry) => entry.id);
  if (compactJson(ids) !== compactJson(EXPECTED_ENTRY_IDS)) throw new Error("registry.entries:EXPECTED_EXACT_ORDERED_ID_SET");
  const seal = verifySeal(registry, "registryHash");
  if (seal.valid !== true) throw new Error("registry.registryHash:INVALID_SEAL");
  return registry;
}

export function validateSchema(schema) {
  requirePlainObject(schema, "schema");
  requireExactString(schema, "$id", "version-1.12.35-boolean-predicate-successor-v2-schema", "schema");
  requireExactString(schema, "type", "object", "schema");
  requireExactBoolean(schema, "additionalProperties", false, "schema");
  requireExactStringArray(schema, "required", ["schemaVersion", "registryType", "registryState", "version", "repositoryRoot", "checkpoint", "baseline", "priorEvidence", "executionRules", "counts", "entries", "registryHash"], "schema");
  const properties = requireOwnPlainObject(schema, "properties", "schema");
  const rules = requireOwnPlainObject(requireOwnPlainObject(properties, "executionRules", "schema.properties"), "properties", "schema.properties.executionRules");
  for (const definition of booleanContractDefinitions.slice(0, 9)) {
    const fieldSchema = requireOwnPlainObject(rules, definition.field, "schema.properties.executionRules.properties");
    requireExactString(fieldSchema, "type", "boolean", `schema.executionRules.${definition.field}`);
    requireExactBoolean(fieldSchema, "const", definition.expected, `schema.executionRules.${definition.field}`);
  }
  const entries = requireOwnPlainObject(properties, "entries", "schema.properties");
  requireExactString(entries, "type", "array", "schema.properties.entries");
  requireExactInteger(entries, "minItems", 68, "schema.properties.entries");
  requireExactInteger(entries, "maxItems", 68, "schema.properties.entries");
  const entryProperties = requireOwnPlainObject(requireOwnPlainObject(entries, "items", "schema.properties.entries"), "properties", "schema.properties.entries.items");
  const shell = requireOwnPlainObject(entryProperties, "shell", "schema.properties.entries.items.properties");
  requireExactString(shell, "type", "boolean", "schema.entries.shell");
  requireExactBoolean(shell, "const", false, "schema.entries.shell");
  return schema;
}

export function validateMemberResult(result, entry) {
  const label = `memberResult.${entry.id}`;
  requireExactKeys(result, ["schemaVersion", "resultType", "entryId", "provenance", "executionCount", "status", "startedAt", "durationMs", "exitIdentity", "outputIdentities", "dependencyDisposition", "restoration", "processContract", "memberResultHash"], label);
  requireExactString(result, "schemaVersion", "3.0", label);
  requireExactString(result, "resultType", "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_MEMBER_RESULT", label);
  requireExactString(result, "entryId", entry.id, label);
  requireExactString(result, "provenance", "BOOLEAN_PREDICATE_SUCCESSOR_V2_EXECUTION", label);
  requireExactInteger(result, "executionCount", 1, label);
  const status = requireNonemptyString(result, "status", label);
  if (["PASS", "FAIL"].includes(status) !== true) throw new Error(`${label}.status:UNEXPECTED_STATUS`);
  requireNonemptyString(result, "startedAt", label);
  requireInteger(result, "durationMs", { minimum: 0, maximum: Number.MAX_SAFE_INTEGER }, label);
  const exitIdentity = requireOwnPlainObject(result, "exitIdentity", label);
  requireExactKeys(exitIdentity, ["exitCode", "signal", "spawnError"], `${label}.exitIdentity`);
  requireInteger(exitIdentity, "exitCode", { minimum: -1, maximum: 255 }, `${label}.exitIdentity`);
  requireNullableString(exitIdentity, "signal", `${label}.exitIdentity`);
  requireNullableString(exitIdentity, "spawnError", `${label}.exitIdentity`);
  const outputs = requireOwnPlainObject(result, "outputIdentities", label);
  requireExactKeys(outputs, ["stdoutByteLength", "stdoutSha256", "stderrByteLength", "stderrSha256", "sanitizedFailure"], `${label}.outputIdentities`);
  requireInteger(outputs, "stdoutByteLength", { minimum: 0, maximum: Number.MAX_SAFE_INTEGER }, `${label}.outputIdentities`);
  requireInteger(outputs, "stderrByteLength", { minimum: 0, maximum: Number.MAX_SAFE_INTEGER }, `${label}.outputIdentities`);
  for (const key of ["stdoutSha256", "stderrSha256"]) {
    const hash = requireNonemptyString(outputs, key, `${label}.outputIdentities`);
    if (/^[0-9a-f]{64}$/.test(hash) !== true) throw new Error(`${label}.outputIdentities.${key}:EXPECTED_SHA256`);
  }
  requireNullableString(outputs, "sanitizedFailure", `${label}.outputIdentities`);
  requireExactString(result, "dependencyDisposition", "PREREQUISITES_SATISFIED", label);
  const restoration = requireOwnPlainObject(result, "restoration", label);
  requireExactKeys(restoration, ["required", "status", "roots"], `${label}.restoration`);
  requireExactBoolean(restoration, "required", entry.outputProducing, `${label}.restoration`);
  const restorationStatus = requireNonemptyString(restoration, "status", `${label}.restoration`);
  if (["BASELINE_EQUAL_AFTER_OUTPUT_PRODUCING_EXECUTION", "NO_MUTATION_OBSERVED", "BASELINE_MISMATCH"].includes(restorationStatus) !== true) throw new Error(`${label}.restoration.status:UNEXPECTED_STATUS`);
  const roots = requireOwn(restoration, "roots", `${label}.restoration`);
  if (Array.isArray(roots) !== true || roots.length !== 3) throw new Error(`${label}.restoration.roots:EXPECTED_THREE_ITEM_ARRAY`);
  for (const [index, root] of roots.entries()) {
    requirePlainObject(root, `${label}.restoration.roots[${index}]`);
    requireNonemptyString(root, "rootId", `${label}.restoration.roots[${index}]`);
    if (typeof requireOwn(root, "equal", `${label}.restoration.roots[${index}]`) !== "boolean") throw new Error(`${label}.restoration.roots[${index}].equal:EXPECTED_BOOLEAN`);
  }
  const processContract = requireOwnPlainObject(result, "processContract", label);
  requireExactKeys(processContract, ["executable", "arguments", "workingDirectory", "shell"], `${label}.processContract`);
  requireExactString(processContract, "executable", entry.executable, `${label}.processContract`);
  requireExactStringArray(processContract, "arguments", entry.arguments, `${label}.processContract`);
  requireExactString(processContract, "workingDirectory", entry.workingDirectory, `${label}.processContract`);
  requireExactBoolean(processContract, "shell", false, `${label}.processContract`);
  const seal = verifySeal(result, "memberResultHash");
  if (seal.valid !== true) throw new Error(`${label}.memberResultHash:INVALID_SEAL`);
  return result;
}

export const presenceRepresentations = Object.freeze(["MISSING", "UNDEFINED", "NULL", "FALSE", "ZERO", "EMPTY_STRING", "EMPTY_ARRAY", "EMPTY_OBJECT"]);

export function runOwnAbsenceCase(representation) {
  const subject = {};
  if (representation !== "MISSING") {
    const values = { UNDEFINED: undefined, NULL: null, FALSE: false, ZERO: 0, EMPTY_STRING: "", EMPTY_ARRAY: [], EMPTY_OBJECT: {} };
    subject.error = values[representation];
  }
  let accepted = false;
  let error = null;
  try { requireOwnAbsent(subject, "error", "spawnResult"); accepted = true; } catch (caught) { error = caught.message; }
  const expectedAccepted = representation === "MISSING";
  return { caseId: `OWN_ABSENCE:${representation}`, representation, expectedAccepted, accepted, matchesExpectation: accepted === expectedAccepted, error };
}

export const inventorySetRepresentations = Object.freeze(["EXACT_ORDER", "REORDERED", "MISSING", "UNEXPECTED", "CHANGED_BYTES", "CHANGED_HASH", "DUPLICATE_EXPECTED", "DUPLICATE_ACTUAL", "NULL", "EMPTY_OBJECT"]);

export function runInventorySetCase(representation) {
  const a = { relativePath: "a.txt", byteLength: 1, sha256: "a".repeat(64) };
  const b = { relativePath: "b.txt", byteLength: 2, sha256: "b".repeat(64) };
  let expected = [a, b];
  let actual = [structuredClone(a), structuredClone(b)];
  if (representation === "REORDERED") actual.reverse();
  else if (representation === "MISSING") actual.pop();
  else if (representation === "UNEXPECTED") actual.push({ relativePath: "c.txt", byteLength: 3, sha256: "c".repeat(64) });
  else if (representation === "CHANGED_BYTES") actual[0].byteLength = 2;
  else if (representation === "CHANGED_HASH") actual[0].sha256 = "d".repeat(64);
  else if (representation === "DUPLICATE_EXPECTED") expected = [a, structuredClone(a)];
  else if (representation === "DUPLICATE_ACTUAL") actual = [a, structuredClone(a)];
  else if (representation === "NULL") actual = null;
  else if (representation === "EMPTY_OBJECT") actual = {};
  let accepted = false;
  let error = null;
  try { accepted = compareInventoryMemberSets(expected, actual).equal === true; } catch (caught) { error = caught.message; }
  const expectedAccepted = ["EXACT_ORDER", "REORDERED"].includes(representation);
  return { caseId: `INVENTORY_SET:${representation}`, representation, expectedAccepted, accepted, matchesExpectation: accepted === expectedAccepted, error };
}

export function exactOwn(value, key) {
  return typeof value === "object" && value !== null && Array.isArray(value) !== true && own(value, key) === true;
}
