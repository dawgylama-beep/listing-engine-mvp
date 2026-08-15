import fs from "node:fs";
import path from "node:path";
import { booleanContractDefinitions, booleanMatrixRepresentations, typedMatrixDefinitions } from "./version-1.12.35-boolean-predicate-successor-v1-contract.mjs";
import { ROOT, compactJson, readJson, sealRecord, sha256, writeCreateOnly } from "./version-1.12.35-boolean-predicate-successor-v1-identity.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v1";
const outputs = { schema: path.join(evidenceRoot, `${prefix}-schema.json`), matrix: path.join(evidenceRoot, `${prefix}-predicate-matrix.json`), registry: path.join(evidenceRoot, `${prefix}-registry.json`), correction: path.join(evidenceRoot, `${prefix}-correction.json`), resultRoot: path.join(evidenceRoot, `${prefix}-member-results`) };
for (const filePath of [outputs.schema, outputs.matrix, outputs.registry, outputs.correction]) if (fs.existsSync(filePath) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${filePath}`);

const schema = {
  $schema: "https://json-schema.org/draft/2020-12/schema", $id: `${prefix}-schema`, title: "Version 1.12.35 Boolean-predicate successor registry", type: "object", additionalProperties: false,
  required: ["schemaVersion", "registryType", "registryState", "version", "repositoryRoot", "checkpoint", "baseline", "priorEvidence", "executionRules", "counts", "entries", "registryHash"],
  properties: {
    schemaVersion: { const: "2.0" }, registryType: { const: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_REGISTRY" }, registryState: { const: "SEALED_PRE_EXECUTION" }, version: { const: "1.12.35" }, repositoryRoot: { type: "string", minLength: 1 }, checkpoint: { type: "object" }, baseline: { type: "object" }, priorEvidence: { type: "object" },
    executionRules: { type: "object", additionalProperties: false, required: booleanContractDefinitions.slice(0, 9).map((item) => item.field), properties: Object.fromEntries(booleanContractDefinitions.slice(0, 9).map((item) => [item.field, { type: "boolean", const: item.expected }])) },
    counts: { type: "object", additionalProperties: false, required: ["entries", "retainedPass", "pendingStatic", "pendingReleaseGates"], properties: { entries: { type: "integer", const: 68 }, retainedPass: { type: "integer", const: 28 }, pendingStatic: { type: "integer", const: 25 }, pendingReleaseGates: { type: "integer", const: 15 } } },
    entries: { type: "array", minItems: 68, maxItems: 68, items: { type: "object", additionalProperties: false, required: ["id", "kind", "name", "state", "executable", "arguments", "workingDirectory", "dependencies", "shell", "baselineRequired", "outputProducing", "timeoutMs"], properties: { id: { type: "string", pattern: "^(STATIC-0(?:[0-4][0-9]|5[0-3])|RELEASE-0(?:0[1-9]|1[0-5]))$" }, kind: { enum: ["STATIC", "RELEASE_GATE"] }, name: { type: "string", minLength: 1 }, state: { enum: ["RETAINED_PASS", "PENDING"] }, executable: { type: ["string", "null"] }, arguments: { type: "array", items: { type: "string" } }, workingDirectory: { type: "string", minLength: 1 }, dependencies: { type: "array", minItems: 1, items: { type: "string", minLength: 1 } }, shell: { type: "boolean", const: false }, baselineRequired: { type: "boolean", const: true }, outputProducing: { type: "boolean" }, timeoutMs: { type: "integer", minimum: 0, maximum: 300000 }, retainedResult: { type: "object" } } } },
    registryHash: { type: "string", pattern: "^[0-9a-f]{64}$" },
  },
};
writeCreateOnly(outputs.schema, schema);

const matrixBasis = { schemaVersion: "1.0", matrixType: "VERSION_1_12_35_TYPED_PREDICATE_MATRIX", booleanDefinitions: booleanContractDefinitions, booleanRepresentations: booleanMatrixRepresentations, booleanCaseCount: booleanContractDefinitions.length * booleanMatrixRepresentations.length, typedDefinitions: typedMatrixDefinitions, typedCaseCount: typedMatrixDefinitions.reduce((sum, definition) => sum + definition.representations.length, 0) };
const matrix = sealRecord(matrixBasis, "matrixHash");
writeCreateOnly(outputs.matrix, matrix);

const priorRegistryPath = path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-registry.json");
const priorResultPath = path.join(evidenceRoot, "version-1.12.35-exhaustive-sweep-result.json");
const baselinePath = path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json");
const priorRegistry = readJson(priorRegistryPath);
const priorResult = readJson(priorResultPath);
const priorById = new Map(priorRegistry.entries.map((entry) => [entry.id, entry]));
const priorResultById = new Map(priorResult.matrix.static.map((entry) => [entry.id, entry]));
const powershell = "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
const node = process.execPath.replaceAll("\\", "/");
const gatesScript = path.join(evidenceRoot, `${prefix}-gates.mjs`).replaceAll("\\", "/");
const retained = Array.from({ length: 28 }, (_, index) => {
  const id = `STATIC-${String(index + 1).padStart(3, "0")}`;
  const source = priorById.get(id); const retainedResult = priorResultById.get(id);
  if (source === undefined || retainedResult === undefined || retainedResult.status !== "PASS" || retainedResult.executionCount !== 1) throw new Error(`RETAINED_RESULT_MISMATCH:${id}`);
  return { id, kind: "STATIC", name: source.name, state: "RETAINED_PASS", executable: null, arguments: [], workingDirectory: ROOT, dependencies: ["PRIOR_SWEEP_RESULT_SEALED"], shell: false, baselineRequired: true, outputProducing: id === "STATIC-028", timeoutMs: 0, retainedResult };
});
const pendingStatic = Array.from({ length: 25 }, (_, index) => {
  const id = `STATIC-${String(index + 29).padStart(3, "0")}`; const source = priorById.get(id); if (source === undefined) throw new Error(`PRIOR_ENTRY_MISSING:${id}`);
  const scriptPath = path.join(ROOT, source.name).replaceAll("\\", "/");
  return { id, kind: "STATIC", name: source.name, state: "PENDING", executable: powershell, arguments: ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", scriptPath], workingDirectory: ROOT, dependencies: ["CHECKPOINT_VALID", "BOOLEAN_SUCCESSOR_OFFLINE_PROOF_PASS", "SAFE_EXECUTION_STATE"], shell: false, baselineRequired: true, outputProducing: false, timeoutMs: 300000 };
});
const releaseSpecs = [
  ["RELEASE-001", "Browser validation", node, [gatesScript, "browser-retained"]], ["RELEASE-002", "Frontend-credential scan", node, [gatesScript, "frontend-credential-scan"]], ["RELEASE-003", "Governing secret scan", node, [gatesScript, "governing-secret-scan"]], ["RELEASE-004", "JavaScript syntax validation", node, ["--check", path.join(ROOT, "tests/browser/canonical-evidence.spec.mjs").replaceAll("\\", "/")]], ["RELEASE-005", "server.ps1 -Check", node, [gatesScript, "server-check"]], ["RELEASE-006", "Complete release-version validation", node, [path.join(ROOT, "scripts/verify-release-version.mjs").replaceAll("\\", "/")]], ["RELEASE-007", "git diff --check", "git", ["diff", "--check"]], ["RELEASE-008", "Candidate reconciliation", node, [gatesScript, "candidate-reconciliation"]], ["RELEASE-009", "Frozen cognitive and corpus identity verification", node, [gatesScript, "frozen-identities"]], ["RELEASE-010", "Execution-evidence verification", node, [gatesScript, "execution-evidence"]], ["RELEASE-011", "Evaluation-evidence verification", node, [gatesScript, "evaluation-evidence"]], ["RELEASE-012", "Evaluator-audit verification", node, [gatesScript, "evaluator-audit"]], ["RELEASE-013", "Result-seal verification", node, [gatesScript, "result-seal"]], ["RELEASE-014", "Phase 6A identity verification", node, [gatesScript, "phase6a"]], ["RELEASE-015", "Repository-integrity and classification verification", node, [gatesScript, "repository-integrity"]],
];
const pendingRelease = releaseSpecs.map(([id, name, executable, arguments_]) => ({ id, kind: "RELEASE_GATE", name, state: "PENDING", executable, arguments: arguments_, workingDirectory: ROOT, dependencies: ["CHECKPOINT_VALID", "BOOLEAN_SUCCESSOR_OFFLINE_PROOF_PASS", "SAFE_EXECUTION_STATE"], shell: false, baselineRequired: true, outputProducing: false, timeoutMs: 300000 }));
const registryBasis = {
  schemaVersion: "2.0", registryType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_REGISTRY", registryState: "SEALED_PRE_EXECUTION", version: "1.12.35", repositoryRoot: ROOT,
  checkpoint: { branch: "refactor/beta-evidence-pipeline", head: "e2b511d6b95f1049369a1128dbb38c4b26d762b6", tree: "339efb038dc1515e68fd10a208abda581530cae1", parent: "48248039ab57e7e701656618f9c699b821ceb404", trackingAndRemote: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35", ahead: 12, behind: 0 },
  baseline: { relativePath: path.relative(ROOT, baselinePath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(baselinePath)), baselineHash: readJson(baselinePath).baselineHash },
  priorEvidence: { registry: { relativePath: path.relative(ROOT, priorRegistryPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(priorRegistryPath)) }, failedGateC: { relativePath: `qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-continuation-gate-c-validation-stop.json`, sha256: sha256(fs.readFileSync(path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-gate-c-validation-stop.json"))), classification: "OFFLINE_PROOF_BOOLEAN_POLARITY_DEFECT" } },
  executionRules: { shell: false, inlineNodeCommands: false, shellGeneratedJavaScript: false, windowsShellReinterpretation: false, retainedEntriesExecutable: false, continueIndependentFailures: true, credentialAccessPermitted: false, remoteWritePermitted: false, baselineRequired: true },
  counts: { entries: 68, retainedPass: 28, pendingStatic: 25, pendingReleaseGates: 15 }, entries: [...retained, ...pendingStatic, ...pendingRelease],
};
const registry = sealRecord(registryBasis, "registryHash");
writeCreateOnly(outputs.registry, registry);
fs.mkdirSync(outputs.resultRoot, { recursive: true });

const priorPaths = ["version-1.12.35-exhaustive-continuation-offline-proof.mjs", "version-1.12.35-exhaustive-continuation-registry.json", "version-1.12.35-exhaustive-continuation-gate-c-validation-stop.json", "version-1.12.35-exhaustive-continuation-terminal-stop.json", "version-1.12.35-exhaustive-continuation-combined-result.json"].map((name) => path.join(evidenceRoot, name));
const successorScriptNames = ["contract.mjs", "identity.mjs", "gates.mjs", "runner.mjs", "build.mjs", "offline-proof.mjs", "finalize.mjs"].map((suffix) => `${prefix}-${suffix}`);
const successorPaths = [...successorScriptNames.map((name) => path.join(evidenceRoot, name)), outputs.schema, outputs.matrix, outputs.registry].map((absolutePath) => {
  if (fs.existsSync(absolutePath) !== true) throw new Error(`SUCCESSOR_PATH_MISSING:${absolutePath}`);
  return { relativePath: path.relative(ROOT, absolutePath).replaceAll("\\", "/"), byteLength: fs.statSync(absolutePath).size, sha256: sha256(fs.readFileSync(absolutePath)) };
}).sort((left, right) => left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0);
const defects = [
  { predicate: "offline-proof:57 Object.values(item).includes(false)", affectedFields: ["executableProof.shell"], classification: "VALID_EXACT_FALSE_REJECTED_BY_AGGREGATE_FALSE_SEARCH" },
  { predicate: "runner:14 arguments.every(Boolean)", affectedFields: ["registryPath", "baselinePath", "entryId", "resultPath"], classification: "NONEMPTY_STRING_PRESENCE_CONFLATED_WITH_TRUTHINESS" },
  { predicate: "runner:31/43 and offline-proof:61 result.equal truthiness/negation", affectedFields: ["inventoryComparison.equal"], classification: "EXACT_TRUE_NOT_REQUIRED" },
  { predicate: "runner:47/60 child.error negation/ternary", affectedFields: ["spawnResult.error"], classification: "PRESENCE_CONFLATED_WITH_TRUTHINESS" },
  { predicate: "runner:72 outputProducing ternary", affectedFields: ["registry.entries[].outputProducing"], classification: "BOOLEAN_LITERAL_NOT_EXACTLY_VALIDATED" },
  { predicate: "offline-proof:81/90 and gates findings/count conditions", affectedFields: ["trackedDiff", "dependencyReferences.length", "findings.length", "staged.length", "unexpected.length"], classification: "STRING_OR_COUNT_CONFLATED_WITH_TRUTHINESS" },
  { predicate: "gates:29 browser.canonicalTestCount", affectedFields: ["browserExecution.canonicalProjectInstances", "browserExecution.attemptsPerCanonicalProjectInstance"], classification: "NONEXISTENT_FIELD_AND_INCOMPLETE_PRESENCE_VALIDATION" },
  { predicate: "build:161 optional field truthiness and terminalStopReceiptHash mapping", affectedFields: ["sixCommitted[].embeddedIdentityField", "terminalStop.receiptHash"], classification: "OPTIONAL_STRING_PRESENCE_CONFLATED_AND_WRONG_IDENTITY_FIELD" },
  { predicate: "finalize:39 Boolean negation and string truthiness", affectedFields: ["mutableComparison.equal", "quarantineComparison.equal", "phase6aExact", "committedDiff", "staged"], classification: "MIXED_TYPE_POLARITY_CONFLATION" },
];
const correctionBasis = {
  schemaVersion: "1.0", recordType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SYSTEMIC_APPEND_ONLY_CORRECTION", correctionState: "SEALED_PRE_OFFLINE_PROOF", version: "1.12.35", checkpoint: registry.checkpoint,
  priorFailure: { classification: "FAIL — OFFLINE_PROOF_BOOLEAN_POLARITY_DEFECT", permanentlyFailed: true, reclassified: false, sweepMembersExecuted: 0, staticContinuationExecuted: 0, releaseGatesExecuted: 0 },
  priorBindings: priorPaths.map((absolutePath) => ({ relativePath: path.relative(ROOT, absolutePath).replaceAll("\\", "/"), byteLength: fs.statSync(absolutePath).size, sha256: sha256(fs.readFileSync(absolutePath)) })),
  completePredicateAudit: defects, defectCount: defects.length,
  predicateMatrix: { relativePath: path.relative(ROOT, outputs.matrix).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(outputs.matrix)), matrixHash: matrix.matrixHash, booleanCaseCount: matrix.booleanCaseCount, typedCaseCount: matrix.typedCaseCount, totalCaseCount: matrix.booleanCaseCount + matrix.typedCaseCount },
  successorPaths,
  behaviorBoundary: { governingTestBehaviorChanged: false, productBehaviorChanged: false, cognitiveBehaviorChanged: false, corpusChanged: false, scorerChanged: false, evaluatorChanged: false, authorityChanged: false, providerAccessed: false, credentialAccessed: false, benchmarkExecuted: false, deploymentActivity: false, remoteWrites: 0 },
  preservedClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
};
const correction = sealRecord(correctionBasis, "correctionHash");
writeCreateOnly(outputs.correction, correction);
process.stdout.write(`${compactJson({ status: "PASS", outputs: Object.fromEntries(Object.entries(outputs).map(([key, value]) => [key, value.replaceAll("\\", "/")])), predicateDefectCount: defects.length, tableCaseCount: matrix.booleanCaseCount + matrix.typedCaseCount, correctionHash: correction.correctionHash })}\n`);
