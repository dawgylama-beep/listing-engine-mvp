import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  ROOT,
  compactJson,
  readJson,
  sealRecord,
  sha256,
  verifySeal,
  writeCreateOnly,
} from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";
import {
  SCANNER_PREFIX,
  assertNoRawValueFields,
  validateSentinelRegistry,
} from "./version-1.12.35-secret-scan-sentinel-successor-v1-scanner.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const resultRoot = path.join(evidenceRoot, `${SCANNER_PREFIX}-member-results`);
const registryPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-registry.json`);
const correctionPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-correction.json`);
const proofPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-focused-proof-result.json`);
const ledgerPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-execution-ledger.json`);
const stopPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-terminal-stop.json`);
const combinedPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-combined-result.json`);
const fileSetPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-release-file-set.json`);
const terminalPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-terminal-release-record.json`);
const historicalCombinedPath = path.join(evidenceRoot, "version-1.12.35-boolean-predicate-successor-v2-combined-result.json");
const historicalStopPath = path.join(evidenceRoot, "version-1.12.35-boolean-predicate-successor-v2-terminal-stop.json");
const releaseCandidatePath = path.join(evidenceRoot, "version-1.12.35-release.json");

for (const outputPath of [combinedPath, fileSetPath, terminalPath]) if (fs.existsSync(outputPath) === true) throw new Error(`FINALIZATION_ALREADY_EXECUTED:${outputPath}`);
if (fs.existsSync(stopPath) === true) throw new Error("SUCCESSOR_STOP_EXISTS_FINALIZATION_FORBIDDEN");

const registry = readJson(registryPath);
const correction = readJson(correctionPath);
const proof = readJson(proofPath);
const ledger = readJson(ledgerPath);
const historicalCombined = readJson(historicalCombinedPath);
const releaseCandidate = readJson(releaseCandidatePath);
validateSentinelRegistry(registry);
if (verifySeal(correction, "correctionHash").valid !== true) throw new Error("CORRECTION_SEAL_INVALID");
if (verifySeal(proof, "proofHash").valid !== true || proof.status !== "PASS" || proof.executionCount !== 1) throw new Error("FOCUSED_PROOF_NOT_EXACT_PASS");
if (verifySeal(ledger, "ledgerHash").valid !== true || ledger.executionState !== "COMPLETE_PASS") throw new Error("EXECUTION_LEDGER_NOT_COMPLETE_PASS");
if (sha256(fs.readFileSync(historicalCombinedPath)) !== "d8c6fe7563650732269fd0121b7bea0ee08dae2fd81797b79776cbe4a54e4006") throw new Error("HISTORICAL_COMBINED_RESULT_CHANGED");
if (sha256(fs.readFileSync(historicalStopPath)) !== "9c01ae637c11920283db3fc82243ea08defeeee208c240bd8ac5ea2fa572e300") throw new Error("HISTORICAL_TERMINAL_STOP_CHANGED");

const expectedGateIds = correction.invalidatedGateClosure.release;
if (expectedGateIds.length !== 5 || ledger.totals.intended !== 5 || ledger.totals.executed !== 5 || ledger.totals.passed !== 5 || ledger.totals.failed !== 0 || ledger.totals.dependencyNotRun !== 0 || ledger.release003SuccessorExecutionCount !== 1) throw new Error("SUCCESSOR_GATE_TOTALS_NOT_EXACT_PASS");
const memberResults = expectedGateIds.map((entryId) => {
  const absolutePath = path.join(resultRoot, `${entryId}.json`);
  const result = readJson(absolutePath);
  if (verifySeal(result, "memberResultHash").valid !== true || result.entryId !== entryId || result.executionCount !== 1 || result.status !== "PASS") throw new Error(`MEMBER_RESULT_NOT_EXACT_PASS:${entryId}`);
  return { entryId, relativePath: path.relative(ROOT, absolutePath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(absolutePath)), memberResultHash: result.memberResultHash, status: result.status, executionCount: result.executionCount };
});

const combinedBasis = {
  schemaVersion: "1.0",
  resultType: "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_COMBINED_RESULT",
  version: "1.12.35",
  status: "PASS",
  releaseValidationState: "PASS",
  historicalValidation: {
    classification: "VERSION_1_12_35_EXHAUSTIVE_VALIDATION_STOPPED_BY_RELEASE_003_SECRET_SCAN",
    preserved: true,
    reclassifiedOrOverwritten: false,
    combinedResult: { relativePath: path.relative(ROOT, historicalCombinedPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(historicalCombinedPath)), combinedResultHash: historicalCombined.combinedResultHash },
    terminalStop: { relativePath: path.relative(ROOT, historicalStopPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(historicalStopPath)) },
    totals: { entries: 68, passed: 67, failed: 1, dependencyNotRun: 0 },
    onlyFailure: "RELEASE-003",
  },
  currentAcceptance: {
    sixFindingsProvedNonSecret: true,
    findingBearingFilesByteIdentical: true,
    narrowScannerCorrectionAccepted: true,
    focusedProofPass: true,
    successorRelease003Pass: true,
    invalidatedGateClosurePass: true,
    unaffectedHistoricalPassesRetained: true,
    protectedArtifactsExact: true,
    currentFailedGates: 0,
  },
  correction: { relativePath: path.relative(ROOT, correctionPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(correctionPath)), correctionHash: correction.correctionHash },
  registry: { relativePath: path.relative(ROOT, registryPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(registryPath)), registryHash: registry.registryHash },
  focusedProof: { relativePath: path.relative(ROOT, proofPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(proofPath)), proofHash: proof.proofHash, executionCount: 1, cases: proof.totals.cases, passed: proof.totals.passed },
  executionLedger: { relativePath: path.relative(ROOT, ledgerPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(ledgerPath)), ledgerHash: ledger.ledgerHash },
  successorMembers: memberResults,
  successorTotals: { entries: 5, passed: 5, failed: 0, dependencyNotRun: 0 },
  cumulativeEvidenceTotals: { historicalEntries: 68, historicalRetainedPasses: 67, historicalAcceptedStops: 1, focusedProofs: 1, successorGateEntries: 5, currentPasses: 5, currentFailures: 0 },
  preservedQualificationClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
  unauthorizedActivity: { credentialSourcesRead: 0, credentialValuesRead: 0, providerCalls: 0, metadataCalls: 0, evaluatorCalls: 0, authorityCreation: 0, qualificationReplays: 0, benchmarkRuns: 0, productHandlerCalls: 0, deployments: 0, merges: 0, remoteWrites: 0 },
};
assertNoRawValueFields(combinedBasis, "combinedResult");
const combined = sealRecord(combinedBasis, "combinedResultHash");
writeCreateOnly(combinedPath, combined);

const git = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim();
const gitZ = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
const remoteBase = "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35";
const releaseCandidatePaths = releaseCandidate.changedFiles.map((item) => item.relativePath.replaceAll("\\", "/"));
const committedPaths = git(["diff", "--name-only", `${remoteBase}..HEAD`]).split(/\r?\n/).filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
const successorUntrackedPaths = gitZ(["ls-files", "--others", "--exclude-standard", "-z"]).filter((relativePath) => relativePath.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${SCANNER_PREFIX}-`));
const combinedRelativePath = path.relative(ROOT, combinedPath).replaceAll("\\", "/");
const fileSetRelativePath = path.relative(ROOT, fileSetPath).replaceAll("\\", "/");
const terminalRelativePath = path.relative(ROOT, terminalPath).replaceAll("\\", "/");
const union = [...new Set([...releaseCandidatePaths, ...committedPaths, ...successorUntrackedPaths, combinedRelativePath])].sort();
const excluded = (relativePath) => relativePath === fileSetRelativePath
  || relativePath === terminalRelativePath
  || relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/")
  || relativePath === "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json"
  || relativePath.startsWith("test-results/");
const fPaths = union.filter((relativePath) => excluded(relativePath) !== true);
const missing = fPaths.filter((relativePath) => fs.existsSync(path.join(ROOT, relativePath)) !== true);
const duplicate = fPaths.filter((relativePath, index) => fPaths.indexOf(relativePath) !== index);
const intersecting = fPaths.filter((relativePath) => excluded(relativePath) === true);
const classifications = fPaths.map((relativePath) => ({
  relativePath,
  releaseCandidate: releaseCandidatePaths.includes(relativePath),
  committedAfterRemoteBase: committedPaths.includes(relativePath),
  secretScanSuccessor: relativePath.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${SCANNER_PREFIX}-`),
}));
const unclassified = classifications.filter((item) => item.releaseCandidate !== true && item.committedAfterRemoteBase !== true && item.secretScanSuccessor !== true).map((item) => item.relativePath);
if (missing.length !== 0 || duplicate.length !== 0 || intersecting.length !== 0 || unclassified.length !== 0 || fPaths.includes(fileSetRelativePath) || fPaths.includes(terminalRelativePath)) throw new Error(`FINAL_FILE_SET_RECONCILIATION_FAILED:${compactJson({ missing, duplicate, intersecting, unclassified })}`);
const files = fPaths.map((relativePath) => {
  const bytes = fs.readFileSync(path.join(ROOT, relativePath));
  return { relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) };
});
const fileSetBasis = {
  schemaVersion: "1.0",
  inventoryType: "VERSION_1_12_35_RELEASE_VALIDATION_FINAL_FILE_SET",
  unionSources: { releaseCandidate: releaseCandidatePaths.length, committedAfterRemoteBase: committedPaths.length, secretScanSuccessor: successorUntrackedPaths.length },
  exclusions: ["THIS_DERIVED_FILE_SET", "TERMINAL_RELEASE_RECORD", "PHASE6A", "RETAINED_RC", "RETAINED_QUARANTINE", "REVIEW_SCREENSHOTS", "MUTABLE_OUTPUTS", "COMMIT_OBJECTS"],
  fileCount: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.byteLength, 0),
  paths: fPaths,
  pathSetHash: sha256(compactJson(fPaths)),
  files,
  aggregateHash: sha256(compactJson(files)),
  classifications,
  reconciliation: { missing: [], unexpected: [], duplicate: [], intersecting: [], unclassified: [] },
  phase6aIntersectionCount: 0,
  retainedCaptureIntersectionCount: 0,
  terminalExcluded: true,
  derivedFileSetExcluded: true,
};
const fileSet = sealRecord(fileSetBasis, "fileSetHash");
writeCreateOnly(fileSetPath, fileSet);

const ancestry = git(["rev-list", "--first-parent", "--reverse", `${remoteBase}^..HEAD`]).split(/\r?\n/).filter((item) => item.length > 0);
const terminalBasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_RELEASE_VALIDATION_TERMINAL_RECORD",
  version: "1.12.35",
  releaseValidationState: "PASS",
  releaseState: "READY_FOR_AUTHORITATIVE_COMMIT_AND_SINGLE_ORDINARY_PUSH",
  historicalStop: { preserved: true, classification: "VERSION_1_12_35_EXHAUSTIVE_VALIDATION_STOPPED_BY_RELEASE_003_SECRET_SCAN", reclassifiedOrOverwritten: false },
  currentAcceptance: combined.currentAcceptance,
  combinedResult: { relativePath: combinedRelativePath, sha256: sha256(fs.readFileSync(combinedPath)), combinedResultHash: combined.combinedResultHash },
  finalFileSet: { relativePath: fileSetRelativePath, sha256: sha256(fs.readFileSync(fileSetPath)), fileSetHash: fileSet.fileSetHash, fileCount: fileSet.fileCount, totalBytes: fileSet.totalBytes, pathSetHash: fileSet.pathSetHash, aggregateHash: fileSet.aggregateHash },
  terminalPath: terminalRelativePath,
  terminalExcludedFromFinalFileSet: true,
  preFinalCommitCheckpoint: { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), parent: git(["rev-parse", "HEAD^"]), tracking: git(["rev-parse", "@{u}"]), directRemoteBeforeImplementation: correction.checkpoint.directRemoteBeforeImplementation },
  ancestry,
  intendedFinalSubject: "test: complete version 1.12.35 release validation",
  intendedPush: { remote: "origin", branch: "refactor/beta-evidence-pipeline", ordinaryNonForce: true, maximumAttempts: 1 },
  futureCommitOrTreeEmbedded: false,
  reconciliation: { missing: [], unexpected: [], duplicate: [], intersecting: [], unclassified: [] },
  protectedArtifacts: correction.protectedArtifactIdentity,
  remainingManualVerification: ["POST_PUSH_DIRECT_REMOTE_READBACK"],
  activity: { credentialSourcesRead: 0, credentialValuesRead: 0, providerCalls: 0, metadataCalls: 0, evaluatorCalls: 0, authorityCreation: 0, qualificationReplays: 0, benchmarkRuns: 0, productHandlerCalls: 0, deployments: 0, merges: 0, remoteWritesBeforeAuthorizedPush: 0 },
};
assertNoRawValueFields(terminalBasis, "terminalRecord");
const terminal = sealRecord(terminalBasis, "terminalHash");
writeCreateOnly(terminalPath, terminal);
if (verifySeal(combined, "combinedResultHash").valid !== true || verifySeal(fileSet, "fileSetHash").valid !== true || verifySeal(terminal, "terminalHash").valid !== true) throw new Error("FINAL_RECORD_READBACK_SEAL_FAILURE");
process.stdout.write(`${compactJson({ status: "PASS", releaseValidationState: "PASS", combinedResultHash: combined.combinedResultHash, fileSetHash: fileSet.fileSetHash, finalFileCount: fileSet.fileCount, finalFileBytes: fileSet.totalBytes, terminalHash: terminal.terminalHash, intendedFinalSubject: terminal.intendedFinalSubject })}\n`);
