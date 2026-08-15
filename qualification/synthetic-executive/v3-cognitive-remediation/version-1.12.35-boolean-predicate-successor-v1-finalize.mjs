import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { validateRegistry } from "./version-1.12.35-boolean-predicate-successor-v1-contract.mjs";
import { ROOT, compactJson, compareInventories, inventoryRoot, readJson, sealRecord, sha256, writeCreateOnly } from "./version-1.12.35-boolean-predicate-successor-v1-identity.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v1";
const registry = validateRegistry(readJson(path.join(evidenceRoot, `${prefix}-registry.json`)));
const baseline = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json"));
const resultRoot = path.join(evidenceRoot, `${prefix}-member-results`);
const combinedPath = path.join(evidenceRoot, `${prefix}-combined-result.json`);
const stopPath = path.join(evidenceRoot, `${prefix}-terminal-stop.json`);
const inventoryPath = path.join(evidenceRoot, `${prefix}-final-file-set.json`);
const terminalPath = path.join(evidenceRoot, `${prefix}-terminal-release-record.json`);
for (const filePath of [combinedPath, stopPath, inventoryPath, terminalPath]) if (fs.existsSync(filePath) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${filePath}`);

const retained = registry.entries.filter((entry) => entry.state === "RETAINED_PASS").map((entry) => ({ id: entry.id, provenance: "IMMUTABLE_PRIOR_SWEEP_RESULT", executionCount: 1, command: null, workingDirectory: entry.workingDirectory, status: "PASS", exitCode: entry.retainedResult.exitCode, stdoutSha256: null, stderrSha256: null, dependencyDisposition: "PRIOR_SEALED_RESULT_RETAINED", restorationResult: entry.id === "STATIC-028" ? "RETROSPECTIVELY_PROVEN_EXACT" : entry.retainedResult.cleanupRestoration.status, captureIdentity: entry.retainedResult.generatedCaptureIdentity }));
const continuation = registry.entries.filter((entry) => entry.state === "PENDING").map((entry) => {
  const resultPath = path.join(resultRoot, `${entry.id}.json`);
  if (fs.existsSync(resultPath) !== true) return { id: entry.id, provenance: "BOOLEAN_PREDICATE_SUCCESSOR", executionCount: 0, command: { executable: entry.executable, arguments: entry.arguments }, workingDirectory: entry.workingDirectory, status: "NOT_RUN_DEPENDENCY", exitCode: null, stdoutSha256: null, stderrSha256: null, dependencyDisposition: "RESULT_FILE_MISSING", restorationResult: "NOT_EXECUTED", captureIdentity: null };
  const result = readJson(resultPath);
  return { id: entry.id, provenance: result.provenance, executionCount: result.executionCount, command: { executable: entry.executable, arguments: entry.arguments }, workingDirectory: entry.workingDirectory, status: result.status, exitCode: result.exitIdentity.exitCode, stdoutSha256: result.outputIdentities.stdoutSha256, stderrSha256: result.outputIdentities.stderrSha256, dependencyDisposition: result.dependencyDisposition, restorationResult: result.restoration.status, captureIdentity: null, resultPath: path.relative(ROOT, resultPath).replaceAll("\\", "/"), resultSha256: sha256(fs.readFileSync(resultPath)) };
});
const entries = [...retained, ...continuation];
const statuses = ["PASS", "FAIL", "NOT_RUN_DEPENDENCY"];
const totals = { entries: entries.length, pass: entries.filter((entry) => entry.status === "PASS").length, fail: entries.filter((entry) => entry.status === "FAIL").length, notRunDependency: entries.filter((entry) => entry.status === "NOT_RUN_DEPENDENCY").length, newlyExecuted: continuation.reduce((sum, entry) => sum + entry.executionCount, 0), retained: retained.length, duplicateExecutions: entries.filter((entry) => entry.executionCount > 1).length, unexpectedStatus: entries.filter((entry) => statuses.includes(entry.status) !== true).length, missing: 68 - entries.length, unclassified: 0 };
const expectedMutable = baseline.mutableOutputRoots[0];
const state = { mutable: compareInventories(expectedMutable.inventory, inventoryRoot(expectedMutable.absoluteRoot, { pathBase: expectedMutable.pathBase })), quarantine: compareInventories(baseline.retainedQuarantine.inventory, inventoryRoot(baseline.retainedQuarantine.absoluteRoot, { pathBase: baseline.retainedQuarantine.absoluteRoot })), phase6a: compareInventories(baseline.phase6a.directory, inventoryRoot(path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd"), { pathBase: path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd") })) };
const stateExact = state.mutable.equal === true && state.quarantine.equal === true && state.phase6a.equal === true;
const allPass = totals.entries === 68 && totals.pass === 68 && totals.fail === 0 && totals.notRunDependency === 0 && totals.duplicateExecutions === 0 && totals.unexpectedStatus === 0 && totals.missing === 0 && stateExact === true;
const combinedBasis = { schemaVersion: "2.0", resultType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_COMBINED_68_ENTRY_RESULT", status: allPass === true ? "PASS" : "FAIL", entries, totals, duplicate: [], unexpected: [], unclassified: [], mutableState: state, finalReleaseConstructionPermitted: allPass };
const combined = sealRecord(combinedBasis, "combinedResultHash");
writeCreateOnly(combinedPath, combined);
if (allPass !== true) {
  const stopBasis = { schemaVersion: "1.0", receiptType: "VERSION_1_12_35_EXHAUSTIVE_VALIDATION_STOP", version: "1.12.35", releaseState: "UNRELEASED", combinedResult: { relativePath: path.relative(ROOT, combinedPath).replaceAll("\\", "/"), hash: combined.combinedResultHash }, failureInventory: entries.filter((entry) => entry.status !== "PASS"), totals, mutableStateExact: stateExact, pushAuthorized: false, preservedClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION", activity: { credentials: 0, providers: 0, metadata: 0, evaluators: 0, authorities: 0, qualificationReplays: 0, benchmarks: 0, productHandlers: 0, deployments: 0, merges: 0, pushes: 0, remoteWrites: 0 } };
  const stop = sealRecord(stopBasis, "terminalStopHash"); writeCreateOnly(stopPath, stop); process.stdout.write(`${compactJson({ status: "STOP", totals, combinedResultHash: combined.combinedResultHash, terminalStopHash: stop.terminalStopHash })}\n`); process.exit(1);
}

const releaseCandidate = readJson(path.join(evidenceRoot, "version-1.12.35-release.json"));
const historicalPaths = releaseCandidate.changedFiles.map((item) => item.relativePath.replaceAll("\\", "/"));
const changedPaths = childProcess.execFileSync("git", ["diff", "--name-only", "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35..HEAD"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split(/\r?\n/).filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
const untrackedSuccessor = childProcess.execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/")).filter((item) => item.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${prefix}-`));
const excluded = new Set([path.relative(ROOT, inventoryPath).replaceAll("\\", "/"), path.relative(ROOT, terminalPath).replaceAll("\\", "/")]);
const fPaths = [...new Set([...historicalPaths, ...changedPaths, ...untrackedSuccessor])].filter((item) => excluded.has(item) !== true && item.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") !== true && item !== "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json" && item.startsWith("test-results/") !== true).sort();
const missingF = fPaths.filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)) !== true);
if (missingF.length !== 0) throw new Error(`FINAL_FILE_SET_MISSING:${compactJson(missingF)}`);
const fFiles = fPaths.map((relativePath) => { const absolutePath = path.join(ROOT, relativePath); const bytes = fs.readFileSync(absolutePath); return { relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) }; });
const fBasis = { schemaVersion: "1.0", inventoryType: "VERSION_1_12_35_FINAL_RELEASE_FILE_SET", exclusions: ["TERMINAL_RELEASE_RECORD", "PHASE6A", "RETAINED_RC", "RETAINED_QUARANTINE", "MUTABLE_OUTPUT_BASELINES", "COMMIT_OBJECTS", "THIS_DERIVED_INVENTORY"], fileCount: fFiles.length, totalBytes: fFiles.reduce((sum, file) => sum + file.byteLength, 0), paths: fPaths, pathSetHash: sha256(compactJson(fPaths)), files: fFiles, aggregateHash: sha256(compactJson(fFiles)), missing: [], unexpected: [], duplicate: [], intersecting: [], unclassified: [] };
writeCreateOnly(inventoryPath, fBasis);
const ancestry = childProcess.execFileSync("git", ["rev-list", "--first-parent", "--reverse", "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35^..HEAD"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
const terminal = { schemaVersion: "1.0", recordType: "VERSION_1_12_35_TERMINAL_RELEASE_RECORD", version: "1.12.35", releaseState: "READY_FOR_FINAL_COMMIT_AND_SINGLE_PUSH", preservedClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION", combinedResultHash: combined.combinedResultHash, finalFileSet: fBasis, finalFileSetInventory: { relativePath: path.relative(ROOT, inventoryPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(inventoryPath)), excludedFromF: true }, terminalExcludedFromF: true, ancestry, intendedFinalSubject: "test: complete version 1.12.35 release validation", futureCommitOrTreeEmbedded: false, activity: { credentials: 0, providers: 0, metadata: 0, evaluators: 0, authorities: 0, qualificationReplays: 0, benchmarks: 0, productHandlers: 0, deployments: 0, merges: 0, remoteWritesBeforeAuthorizedPush: 0 } };
writeCreateOnly(terminalPath, terminal);
process.stdout.write(`${compactJson({ status: "RELEASE_CONSTRUCTION_READY", totals, combinedResultHash: combined.combinedResultHash, f: { fileCount: fBasis.fileCount, totalBytes: fBasis.totalBytes, pathSetHash: fBasis.pathSetHash, aggregateHash: fBasis.aggregateHash }, inventoryPath: path.relative(ROOT, inventoryPath).replaceAll("\\", "/"), terminalPath: path.relative(ROOT, terminalPath).replaceAll("\\", "/"), terminalSha256: sha256(fs.readFileSync(terminalPath)) })}\n`);
