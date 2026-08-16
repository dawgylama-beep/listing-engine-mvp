import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { EXPECTED_ENTRY_IDS, requireExactKeys, requireNonemptyString, validateMemberResult, validateRegistry } from "./version-1.12.35-boolean-predicate-successor-v2-contract.mjs";
import { ROOT, compactJson, compareInventories, inventoryRoot, readJson, sealRecord, sha256, verifySeal, writeCreateOnly } from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v2";
const registryPath = path.join(evidenceRoot, `${prefix}-registry.json`);
const registry = validateRegistry(readJson(registryPath));
const baseline = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json"));
const proofPath = path.join(evidenceRoot, `${prefix}-offline-proof-result.json`);
const proof = readJson(proofPath);
const proofSeal = verifySeal(proof, "proofHash");
if (proofSeal.valid !== true || proof.status !== "PASS" || proof.executionCount !== 1 || proof.sweepMembersExecuted !== 0) throw new Error("OFFLINE_PROOF_NOT_SINGLE_VERIFIED_PASS");
const ledgerPath = path.join(evidenceRoot, `${prefix}-execution-ledger.json`);
const ledger = readJson(ledgerPath);
const ledgerSeal = verifySeal(ledger, "executionLedgerHash");
if (ledgerSeal.valid !== true) throw new Error("EXECUTION_LEDGER_SEAL_INVALID");
const resultRoot = path.join(evidenceRoot, `${prefix}-member-results`);
const combinedPath = path.join(evidenceRoot, `${prefix}-combined-result.json`);
const stopPath = path.join(evidenceRoot, `${prefix}-terminal-stop.json`);
const inventoryPath = path.join(evidenceRoot, `${prefix}-final-file-set.json`);
const terminalPath = path.join(evidenceRoot, `${prefix}-terminal-release-record.json`);
for (const filePath of [combinedPath, stopPath, inventoryPath, terminalPath]) if (fs.existsSync(filePath) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${filePath}`);

const retainedEvidencePath = "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-sweep-result.json";
const adjudicationPath = "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-playwright-shared-fixture-adjudication.json";
const retained = registry.entries.filter((entry) => entry.state === "RETAINED_PASS").map((entry) => ({
  id: entry.id,
  provenance: "IMMUTABLE_PRIOR_SWEEP_RESULT",
  executionCount: 1,
  command: { executable: null, arguments: [], disposition: "RETAINED_ENTRY_NOT_REEXECUTABLE" },
  workingDirectory: entry.workingDirectory,
  status: "PASS",
  exitCode: entry.retainedResult.exitCode,
  stdoutSha256: null,
  stderrSha256: null,
  outputIdentityDisposition: "NOT_RECORDED_IN_IMMUTABLE_PRIOR_SWEEP_RESULT",
  dependencyDisposition: "PRIOR_SEALED_RESULT_RETAINED",
  restorationResult: entry.id === "STATIC-028" ? "RETROSPECTIVELY_PROVEN_EXACT" : entry.retainedResult.cleanupRestoration.status,
  captureIdentity: entry.id === "STATIC-028" ? { pathSetSha256: "f63ef7d3b833fb97fa10021ea5e3e5b601dc368221355963735cf2e1812e2124", aggregateSha256: "743275cbda857f57707a325796490c730be2e5e0fb823276e0dc8bbde0734735", adjudicationPath } : null,
  evidencePath: retainedEvidencePath,
}));

const continuation = registry.entries.filter((entry) => entry.state === "PENDING").map((entry) => {
  const resultPath = path.join(resultRoot, `${entry.id}.json`);
  if (fs.existsSync(resultPath) !== true) return { id: entry.id, provenance: "BOOLEAN_PREDICATE_SUCCESSOR_V2", executionCount: 0, command: { executable: entry.executable, arguments: entry.arguments }, workingDirectory: entry.workingDirectory, status: "NOT_RUN_DEPENDENCY", exitCode: null, stdoutSha256: null, stderrSha256: null, outputIdentityDisposition: "NOT_EXECUTED", dependencyDisposition: "RESULT_FILE_MISSING", restorationResult: "NOT_EXECUTED", captureIdentity: null, evidencePath: null };
  const result = validateMemberResult(readJson(resultPath), entry);
  return {
    id: entry.id,
    provenance: result.provenance,
    executionCount: result.executionCount,
    command: { executable: entry.executable, arguments: entry.arguments },
    workingDirectory: entry.workingDirectory,
    status: result.status,
    exitCode: result.exitIdentity.exitCode,
    stdoutSha256: result.outputIdentities.stdoutSha256,
    stderrSha256: result.outputIdentities.stderrSha256,
    outputIdentityDisposition: "SHA256_RECORDED",
    dependencyDisposition: result.dependencyDisposition,
    restorationResult: result.restoration.status,
    captureIdentity: null,
    evidencePath: path.relative(ROOT, resultPath).replaceAll("\\", "/"),
    evidenceSha256: sha256(fs.readFileSync(resultPath)),
    memberResultHash: result.memberResultHash,
  };
});

const entries = [...retained, ...continuation];
const actualIds = entries.map((entry) => entry.id);
const idCounts = new Map();
for (const id of actualIds) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
const duplicate = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id, count]) => ({ id, count }));
const missing = EXPECTED_ENTRY_IDS.filter((id) => idCounts.has(id) !== true);
const unexpected = [...idCounts.keys()].filter((id) => EXPECTED_ENTRY_IDS.includes(id) !== true);
const allowedStatuses = ["PASS", "FAIL", "NOT_RUN_DEPENDENCY"];
const unclassified = entries.filter((entry) => allowedStatuses.includes(entry.status) !== true).map((entry) => entry.id);
const totals = {
  entries: entries.length,
  pass: entries.filter((entry) => entry.status === "PASS").length,
  fail: entries.filter((entry) => entry.status === "FAIL").length,
  notRunDependency: entries.filter((entry) => entry.status === "NOT_RUN_DEPENDENCY").length,
  newlyExecuted: continuation.reduce((sum, entry) => sum + entry.executionCount, 0),
  retained: retained.length,
  duplicateExecutions: entries.filter((entry) => entry.executionCount > 1).length,
  duplicateIds: duplicate.length,
  unexpectedStatus: unclassified.length,
  missing: missing.length,
  unexpected: unexpected.length,
  unclassified: unclassified.length,
};
const expectedMutable = baseline.mutableOutputRoots[0];
const phaseRoot = path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd");
const state = {
  mutable: compareInventories(expectedMutable.inventory, inventoryRoot(expectedMutable.absoluteRoot, { pathBase: expectedMutable.pathBase })),
  quarantine: compareInventories(baseline.retainedQuarantine.inventory, inventoryRoot(baseline.retainedQuarantine.absoluteRoot, { pathBase: baseline.retainedQuarantine.absoluteRoot })),
  phase6a: compareInventories(baseline.phase6a.directory, inventoryRoot(phaseRoot, { pathBase: phaseRoot })),
};
const stateExact = state.mutable.equal === true && state.quarantine.equal === true && state.phase6a.equal === true;
const allPass = totals.entries === 68 && totals.pass === 68 && totals.fail === 0 && totals.notRunDependency === 0 && totals.newlyExecuted === 40 && totals.retained === 28 && totals.duplicateExecutions === 0 && totals.duplicateIds === 0 && totals.unexpectedStatus === 0 && totals.missing === 0 && totals.unexpected === 0 && totals.unclassified === 0 && compactJson(actualIds) === compactJson(EXPECTED_ENTRY_IDS) && stateExact === true;
const combinedBasis = {
  schemaVersion: "3.0",
  resultType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_COMBINED_68_ENTRY_RESULT",
  status: allPass === true ? "PASS" : "FAIL",
  entries,
  totals,
  duplicate,
  missing,
  unexpected,
  unclassified,
  retainedAndNewProvenancePhysicallyDistinct: true,
  offlineProof: { relativePath: path.relative(ROOT, proofPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(proofPath)), proofHash: proof.proofHash },
  executionLedger: { relativePath: path.relative(ROOT, ledgerPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(ledgerPath)), executionLedgerHash: ledger.executionLedgerHash },
  mutableState: state,
  finalReleaseConstructionPermitted: allPass,
};
const combined = sealRecord(combinedBasis, "combinedResultHash");
writeCreateOnly(combinedPath, combined);
if (allPass !== true) {
  const stopBasis = {
    schemaVersion: "2.0",
    receiptType: "VERSION_1_12_35_EXHAUSTIVE_VALIDATION_STOP",
    version: "1.12.35",
    releaseState: "UNRELEASED",
    combinedResult: { relativePath: path.relative(ROOT, combinedPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(combinedPath)), combinedResultHash: combined.combinedResultHash },
    failureInventory: entries.filter((entry) => entry.status !== "PASS"),
    totals,
    mutableStateExact: stateExact,
    pushAuthorized: false,
    preservedClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
    activity: { credentials: 0, providers: 0, metadata: 0, evaluators: 0, authorities: 0, qualificationReplays: 0, benchmarks: 0, productHandlers: 0, deployments: 0, merges: 0, pushes: 0, remoteWrites: 0 },
  };
  const stop = sealRecord(stopBasis, "terminalStopHash");
  writeCreateOnly(stopPath, stop);
  process.stdout.write(`${compactJson({ status: "STOP", totals, combinedResultHash: combined.combinedResultHash, terminalStopHash: stop.terminalStopHash })}\n`);
  process.exit(1);
}

const releaseCandidatePath = path.join(evidenceRoot, "version-1.12.35-release.json");
const releaseCandidate = readJson(releaseCandidatePath);
const releaseSeal = verifySeal(releaseCandidate, "releaseHash");
if (releaseSeal.valid !== true) throw new Error("RELEASE_CANDIDATE_SEAL_INVALID");
if (Array.isArray(releaseCandidate.changedFiles) !== true) throw new Error("RELEASE_CANDIDATE_CHANGED_FILES_NOT_ARRAY");
for (const [index, member] of releaseCandidate.changedFiles.entries()) {
  requireExactKeys(member, ["relativePath", "sha256"], `releaseCandidate.changedFiles[${index}]`);
  requireNonemptyString(member, "relativePath", `releaseCandidate.changedFiles[${index}]`);
  const hash = requireNonemptyString(member, "sha256", `releaseCandidate.changedFiles[${index}]`);
  if (/^[0-9a-f]{64}$/.test(hash) !== true) throw new Error(`releaseCandidate.changedFiles[${index}].sha256:EXPECTED_SHA256`);
}
const candidatePaths = releaseCandidate.changedFiles.map((member) => member.relativePath.replaceAll("\\", "/"));
const changedPaths = childProcess.execFileSync("git", ["diff", "--name-only", "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35..HEAD"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split(/\r?\n/).filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
const untracked = childProcess.execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
const untrackedSuccessor = untracked.filter((item) => item.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${prefix}-`));
const terminalRelativePath = path.relative(ROOT, terminalPath).replaceAll("\\", "/");
const inventoryRelativePath = path.relative(ROOT, inventoryPath).replaceAll("\\", "/");
const sourcePaths = [...candidatePaths, ...changedPaths, ...untrackedSuccessor];
const excludedReason = (relativePath) => {
  if (relativePath === terminalRelativePath) return "TERMINAL_RELEASE_RECORD";
  if (relativePath === inventoryRelativePath) return "THIS_DERIVED_INVENTORY";
  if (relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") === true || relativePath === "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json") return "PHASE6A";
  if (relativePath.startsWith("test-results/") === true) return "MUTABLE_OUTPUT_OR_RETAINED_RC";
  return null;
};
const fPaths = [...new Set(sourcePaths)].filter((relativePath) => excludedReason(relativePath) === null).sort();
const missingF = fPaths.filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)) !== true);
const duplicateF = fPaths.filter((relativePath, index) => fPaths.indexOf(relativePath) !== index);
const intersecting = fPaths.filter((relativePath) => excludedReason(relativePath) !== null);
const classifications = fPaths.map((relativePath) => ({
  relativePath,
  classification: untrackedSuccessor.includes(relativePath) === true ? "BOOLEAN_SUCCESSOR_V2" : changedPaths.includes(relativePath) === true ? "AUTHORIZED_VERSION_1_12_35_COMMIT_PATH" : candidatePaths.includes(relativePath) === true ? "SEALED_RELEASE_CANDIDATE_PATH" : null,
}));
const unclassifiedF = classifications.filter((item) => item.classification === null).map((item) => item.relativePath);
const unexpectedF = fPaths.filter((relativePath) => sourcePaths.includes(relativePath) !== true);
if (missingF.length !== 0 || duplicateF.length !== 0 || intersecting.length !== 0 || unclassifiedF.length !== 0 || unexpectedF.length !== 0 || fPaths.includes(terminalRelativePath) === true || fPaths.includes(inventoryRelativePath) === true) throw new Error(`FINAL_FILE_SET_INVALID:${compactJson({ missingF, duplicateF, intersecting, unclassifiedF, unexpectedF })}`);
const fFiles = fPaths.map((relativePath) => {
  const bytes = fs.readFileSync(path.join(ROOT, relativePath));
  return { relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) };
});
const fBasis = {
  schemaVersion: "2.0",
  inventoryType: "VERSION_1_12_35_FINAL_RELEASE_FILE_SET",
  exclusions: ["TERMINAL_RELEASE_RECORD", "PHASE6A", "RETAINED_RC", "RETAINED_QUARANTINE", "MUTABLE_OUTPUT_BASELINES", "COMMIT_OBJECTS", "THIS_DERIVED_INVENTORY"],
  fileCount: fFiles.length,
  totalBytes: fFiles.reduce((sum, file) => sum + file.byteLength, 0),
  paths: fPaths,
  pathSetHash: sha256(compactJson(fPaths)),
  files: fFiles,
  aggregateHash: sha256(compactJson(fFiles)),
  classifications,
  missing: missingF,
  unexpected: unexpectedF,
  duplicate: duplicateF,
  intersecting,
  unclassified: unclassifiedF,
  terminalExcluded: fPaths.includes(terminalRelativePath) !== true,
  derivedInventoryExcluded: fPaths.includes(inventoryRelativePath) !== true,
  phase6aIntersectionCount: 0,
  retainedCaptureIntersectionCount: 0,
};
writeCreateOnly(inventoryPath, fBasis);

const ancestry = childProcess.execFileSync("git", ["rev-list", "--first-parent", "--reverse", "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35^..HEAD"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/);
const terminal = {
  schemaVersion: "2.0",
  recordType: "VERSION_1_12_35_TERMINAL_RELEASE_RECORD",
  version: "1.12.35",
  releaseState: "READY_FOR_FINAL_COMMIT_AND_SINGLE_PUSH",
  preservedClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
  combinedResult: { relativePath: path.relative(ROOT, combinedPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(combinedPath)), combinedResultHash: combined.combinedResultHash },
  finalFileSet: { fileCount: fBasis.fileCount, totalBytes: fBasis.totalBytes, pathSetHash: fBasis.pathSetHash, aggregateHash: fBasis.aggregateHash },
  finalFileSetInventory: { relativePath: inventoryRelativePath, sha256: sha256(fs.readFileSync(inventoryPath)), excludedFromF: true },
  terminalPath: terminalRelativePath,
  terminalExcludedFromF: true,
  ancestry,
  intendedFinalSubject: "test: complete version 1.12.35 release validation",
  futureCommitOrTreeEmbedded: false,
  reconciliation: { missing: [], unexpected: [], duplicate: [], intersecting: [], unclassified: [] },
  activity: { credentials: 0, providers: 0, metadata: 0, evaluators: 0, authorities: 0, qualificationReplays: 0, benchmarks: 0, productHandlers: 0, deployments: 0, merges: 0, remoteWritesBeforeAuthorizedPush: 0 },
};
writeCreateOnly(terminalPath, terminal);
process.stdout.write(`${compactJson({ status: "RELEASE_CONSTRUCTION_READY", totals, combinedResultHash: combined.combinedResultHash, f: { fileCount: fBasis.fileCount, totalBytes: fBasis.totalBytes, pathSetHash: fBasis.pathSetHash, aggregateHash: fBasis.aggregateHash }, inventoryPath: inventoryRelativePath, inventorySha256: sha256(fs.readFileSync(inventoryPath)), terminalPath: terminalRelativePath, terminalSha256: sha256(fs.readFileSync(terminalPath)) })}\n`);
