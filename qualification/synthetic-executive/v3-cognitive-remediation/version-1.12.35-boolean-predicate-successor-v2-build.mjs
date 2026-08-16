import fs from "node:fs";
import path from "node:path";
import {
  booleanContractDefinitions,
  booleanMatrixRepresentations,
  inventorySetRepresentations,
  presenceRepresentations,
  typedMatrixDefinitions,
  validateRegistry,
} from "./version-1.12.35-boolean-predicate-successor-v2-contract.mjs";
import { ROOT, compactJson, readJson, sealRecord, sha256, writeCreateOnly } from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v2";
const priorPrefix = "version-1.12.35-boolean-predicate-successor-v1";
const outputs = {
  schema: path.join(evidenceRoot, `${prefix}-schema.json`),
  matrix: path.join(evidenceRoot, `${prefix}-predicate-matrix.json`),
  registry: path.join(evidenceRoot, `${prefix}-registry.json`),
  correction: path.join(evidenceRoot, `${prefix}-correction.json`),
  resultRoot: path.join(evidenceRoot, `${prefix}-member-results`),
};
if (fs.existsSync(outputs.correction) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${outputs.correction}`);
if (fs.existsSync(outputs.resultRoot) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${outputs.resultRoot}`);
const writeOrRequireExact = (filePath, value) => {
  if (fs.existsSync(filePath) !== true) { writeCreateOnly(filePath, value); return "CREATED"; }
  const existing = readJson(filePath);
  if (compactJson(existing) !== compactJson(value)) throw new Error(`PARTIAL_BUILD_OUTPUT_MISMATCH:${filePath}`);
  return "PRESERVED_EXACT_PARTIAL_OUTPUT";
};

const requiredRegistryKeys = ["schemaVersion", "registryType", "registryState", "version", "repositoryRoot", "checkpoint", "baseline", "priorEvidence", "executionRules", "counts", "entries", "registryHash"];
const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: `${prefix}-schema`,
  title: "Version 1.12.35 Boolean/presence successor v2 registry",
  type: "object",
  additionalProperties: false,
  required: requiredRegistryKeys,
  properties: {
    schemaVersion: { const: "3.0" },
    registryType: { const: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_REGISTRY" },
    registryState: { const: "SEALED_PRE_EXECUTION" },
    version: { const: "1.12.35" },
    repositoryRoot: { type: "string", minLength: 1 },
    checkpoint: { type: "object", additionalProperties: false, required: ["branch", "head", "tree", "parent", "trackingAndRemote", "ahead", "behind"] },
    baseline: { type: "object", additionalProperties: false, required: ["relativePath", "sha256", "baselineHash"] },
    priorEvidence: { type: "object", additionalProperties: false, required: ["registry", "offlineProof", "combinedResult", "terminalStop", "correction"] },
    executionRules: {
      type: "object",
      additionalProperties: false,
      required: booleanContractDefinitions.slice(0, 9).map((definition) => definition.field),
      properties: Object.fromEntries(booleanContractDefinitions.slice(0, 9).map((definition) => [definition.field, { type: "boolean", const: definition.expected }])),
    },
    counts: { type: "object", additionalProperties: false, required: ["entries", "retainedPass", "pendingStatic", "pendingReleaseGates"] },
    entries: {
      type: "array",
      minItems: 68,
      maxItems: 68,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "kind", "name", "state", "executable", "arguments", "workingDirectory", "dependencies", "shell", "baselineRequired", "outputProducing", "timeoutMs"],
        properties: {
          id: { type: "string" }, kind: { enum: ["STATIC", "RELEASE_GATE"] }, name: { type: "string", minLength: 1 }, state: { enum: ["RETAINED_PASS", "PENDING"] },
          executable: { type: ["string", "null"] }, arguments: { type: "array", items: { type: "string" } }, workingDirectory: { type: "string", minLength: 1 },
          dependencies: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } }, shell: { type: "boolean", const: false }, baselineRequired: { type: "boolean", const: true },
          outputProducing: { type: "boolean" }, timeoutMs: { type: "integer", minimum: 0, maximum: 300000 }, retainedResult: { type: "object" },
        },
      },
    },
    registryHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
  },
};
const schemaDisposition = writeOrRequireExact(outputs.schema, schema);

const booleanCaseCount = booleanContractDefinitions.length * booleanMatrixRepresentations.length;
const inheritedTypedCaseCount = typedMatrixDefinitions.reduce((sum, definition) => sum + definition.representations.length, 0);
const matrixBasis = {
  schemaVersion: "2.0",
  matrixType: "VERSION_1_12_35_BOOLEAN_PRESENCE_AND_INVENTORY_PREDICATE_MATRIX",
  booleanDefinitions: booleanContractDefinitions,
  booleanRepresentations: booleanMatrixRepresentations,
  booleanCaseCount,
  inheritedTypedDefinitions: typedMatrixDefinitions,
  inheritedTypedCaseCount,
  ownAbsenceRepresentations: presenceRepresentations,
  ownAbsenceCaseCount: presenceRepresentations.length,
  inventorySetRepresentations,
  inventorySetCaseCount: inventorySetRepresentations.length,
  totalCaseCount: booleanCaseCount + inheritedTypedCaseCount + presenceRepresentations.length + inventorySetRepresentations.length,
};
const matrix = sealRecord(matrixBasis, "matrixHash");
const matrixDisposition = writeOrRequireExact(outputs.matrix, matrix);

const priorRegistryPath = path.join(evidenceRoot, `${priorPrefix}-registry.json`);
const priorRegistry = readJson(priorRegistryPath);
const entries = structuredClone(priorRegistry.entries);
const oldGatesName = `${priorPrefix}-gates.mjs`;
const newGatesName = `${prefix}-gates.mjs`;
for (const entry of entries) {
  if (entry.state !== "PENDING") continue;
  entry.arguments = entry.arguments.map((argument) => typeof argument === "string" && argument.endsWith(oldGatesName) === true ? argument.slice(0, -oldGatesName.length) + newGatesName : argument);
}

const priorEvidenceNames = {
  registry: `${priorPrefix}-registry.json`,
  offlineProof: `${priorPrefix}-offline-proof-result.json`,
  combinedResult: `${priorPrefix}-combined-result.json`,
  terminalStop: `${priorPrefix}-terminal-stop.json`,
  correction: `${priorPrefix}-correction.json`,
};
const priorEvidence = Object.fromEntries(Object.entries(priorEvidenceNames).map(([key, name]) => {
  const absolutePath = path.join(evidenceRoot, name);
  return [key, { relativePath: path.relative(ROOT, absolutePath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(absolutePath)) }];
}));
const baselinePath = path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json");
const baseline = readJson(baselinePath);
const registryBasis = {
  schemaVersion: "3.0",
  registryType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_REGISTRY",
  registryState: "SEALED_PRE_EXECUTION",
  version: "1.12.35",
  repositoryRoot: ROOT,
  checkpoint: { branch: "refactor/beta-evidence-pipeline", head: "5da4c3de47a2860495087bacacdd60ac3c65603b", tree: "d5c162ae6777c6e080ac27de0d9a0ae29fda8ace", parent: "e2b511d6b95f1049369a1128dbb38c4b26d762b6", trackingAndRemote: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35", ahead: 13, behind: 0 },
  baseline: { relativePath: path.relative(ROOT, baselinePath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(baselinePath)), baselineHash: baseline.baselineHash },
  priorEvidence,
  executionRules: structuredClone(priorRegistry.executionRules),
  counts: structuredClone(priorRegistry.counts),
  entries,
};
const registry = sealRecord(registryBasis, "registryHash");
const registryDisposition = writeOrRequireExact(outputs.registry, registry);
validateRegistry(registry);
fs.mkdirSync(outputs.resultRoot, { recursive: false });

const successorScriptNames = ["identity.mjs", "contract.mjs", "gates.mjs", "runner.mjs", "execute.mjs", "build.mjs", "offline-proof.mjs", "finalize.mjs"].map((suffix) => `${prefix}-${suffix}`);
const successorPaths = [...successorScriptNames.map((name) => path.join(evidenceRoot, name)), outputs.schema, outputs.matrix, outputs.registry].map((absolutePath) => {
  if (fs.existsSync(absolutePath) !== true) throw new Error(`SUCCESSOR_PATH_MISSING:${absolutePath}`);
  const bytes = fs.readFileSync(absolutePath);
  return { relativePath: path.relative(ROOT, absolutePath).replaceAll("\\", "/"), byteLength: bytes.byteLength, sha256: sha256(bytes) };
}).sort((left, right) => left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0);

const defects = [
  { predicate: "v1-offline-proof:69 compactJson(rcTuples) === compactJson(adjudication.members)", affectedFields: ["retainedCapture.members"], classification: "ORDERED_ARRAY_EQUALITY_CONFLATED_WITH_EXACT_INVENTORY_SET_EQUALITY" },
  { predicate: "v1-offline-proof:26 optional-chain includes", affectedFields: ["schema.required", "schema.executionRules", "schema.entries"], classification: "OWN_PROPERTY_AND_ARRAY_TYPE_NOT_SEPARATELY_REQUIRED" },
  { predicate: "v1-offline-proof:35, v1-runner:41, v1-gates:66 error === undefined", affectedFields: ["spawnResult.error"], classification: "MISSING_PROPERTY_CONFLATED_WITH_OWN_UNDEFINED" },
  { predicate: "v1-contract:retainedResult direct field comparisons", affectedFields: ["retainedResult.status", "retainedResult.executionCount", "retainedResult.cleanupRestoration"], classification: "NESTED_OWN_PROPERTY_AND_EXACT_TYPE_VALIDATION_INCOMPLETE" },
  { predicate: "v1-contract registry checkpoint/baseline/priorEvidence omitted", affectedFields: ["checkpoint", "baseline", "priorEvidence"], classification: "SCHEMA_DECLARED_NESTED_OBJECTS_ACCEPTED_WITHOUT_COMPLETE_TYPED_VALIDATION" },
  { predicate: "v1-gates:25 projects length only", affectedFields: ["browserExecution.projects"], classification: "ARRAY_LENGTH_CONFLATED_WITH_EXACT_ORDERED_MEMBER_IDENTITY" },
  { predicate: "v1-gates:88 unauthorizedActivity ?? {} values.every", affectedFields: ["unauthorizedActivity"], classification: "MISSING_OR_INCOMPLETE_OBJECT_ACCEPTED_AS_ZERO_ACTIVITY" },
  { predicate: "v1-gates:88 exactCaseOrder length only", affectedFields: ["exactCaseOrder"], classification: "ARRAY_LENGTH_CONFLATED_WITH_EXACT_CASE_ID_ORDER" },
  { predicate: "v1-gates:78 static result filename count only", affectedFields: ["memberResults"], classification: "COUNT_CONFLATED_WITH_EXACT_EXPECTED_PATH_SET" },
  { predicate: "v1-gates secret scan unreadable catch/continue", affectedFields: ["candidateFiles"], classification: "UNREADABLE_CANDIDATE_CONFLATED_WITH_CLEAN_CANDIDATE" },
  { predicate: "v1-finalize:22-23 unvalidated result projection", affectedFields: ["memberResult"], classification: "RESULT_PRESENCE_CONFLATED_WITH_VALID_SEALED_TYPED_RESULT" },
  { predicate: "v1-finalize:27/32 hardcoded reconciliation arrays", affectedFields: ["duplicate", "unexpected", "unclassified"], classification: "EMPTY_LITERAL_REPORTED_WITHOUT_EXACT_SET_RECONCILIATION" },
  { predicate: "v1-finalize:41-49 release file-set projection", affectedFields: ["releaseCandidate.changedFiles", "F"], classification: "DERIVED_ARRAYS_NOT_FULLY_TYPE_VALIDATED_OR_INTERSECTION_PROVEN" },
];
const correctionBasis = {
  schemaVersion: "2.0",
  recordType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SYSTEMIC_APPEND_ONLY_SUCCESSOR_V2_CORRECTION",
  correctionState: "SEALED_PRE_OFFLINE_PROOF",
  version: "1.12.35",
  checkpoint: registry.checkpoint,
  priorFailure: { proofType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_OFFLINE_PROOF", status: "FAIL", executionCount: 1, onlyFailureGate: "RETAINED_RC", permanentlyFailed: true, reclassified: false, sweepMembersExecuted: 0, staticContinuationExecuted: 0, releaseGatesExecuted: 0 },
  constructionRecovery: { initialAttemptStatus: "FAIL_BEFORE_PROOF_OR_MEMBER_EXECUTION", failureCode: "REGISTRY_BASELINE_EXACT_KEYS_HELPER_REJECTED_VALID_BASELINE_HASH", schemaDisposition, matrixDisposition, registryDisposition, priorOutputsPreservedByteForByte: true, deletedOrOverwrittenPaths: 0 },
  priorBindings: priorEvidence,
  completePredicateAudit: defects,
  defectCount: defects.length,
  correctionSemantics: { inventoryMembersComparedAsUniquePathKeyedSets: true, exactExpectedOrderRebindingForSealedHashes: true, ownPropertyPresenceSeparatedFromValue: true, exactSchemaDeclaredTypesRequired: true, resultSetsReconciledFromActualIds: true, memberResultsTypedAndSealVerified: true },
  predicateMatrix: { relativePath: path.relative(ROOT, outputs.matrix).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(outputs.matrix)), matrixHash: matrix.matrixHash, totalCaseCount: matrix.totalCaseCount },
  successorPaths,
  behaviorBoundary: { governingTestBehaviorChanged: false, productBehaviorChanged: false, cognitiveBehaviorChanged: false, corpusChanged: false, scorerChanged: false, evaluatorChanged: false, authorityChanged: false, providerAccessed: false, credentialAccessed: false, benchmarkExecuted: false, deploymentActivity: false, remoteWrites: 0 },
  preservedClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
};
const correction = sealRecord(correctionBasis, "correctionHash");
writeCreateOnly(outputs.correction, correction);
process.stdout.write(`${compactJson({ status: "PASS", predicateDefectCount: defects.length, tableCaseCount: matrix.totalCaseCount, registryHash: registry.registryHash, correctionHash: correction.correctionHash })}\n`);
