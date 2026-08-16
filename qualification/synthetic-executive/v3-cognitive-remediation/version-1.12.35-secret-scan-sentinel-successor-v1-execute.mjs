import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  ROOT,
  compactJson,
  compareInventories,
  inventoryRoot,
  readJson,
  sealRecord,
  sha256,
  verifySeal,
  writeCreateOnly,
} from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";
import {
  SCANNER_PREFIX,
  assertNoRawValueFields,
  scanRepository,
  validateSentinelRegistry,
} from "./version-1.12.35-secret-scan-sentinel-successor-v1-scanner.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const resultRoot = path.join(evidenceRoot, `${SCANNER_PREFIX}-member-results`);
const ledgerPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-execution-ledger.json`);
const stopPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-terminal-stop.json`);
const registryPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-registry.json`);
const correctionPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-correction.json`);
const proofPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-focused-proof-result.json`);
const baselinePath = path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json");

for (const occupied of [resultRoot, ledgerPath, stopPath]) if (fs.existsSync(occupied) === true) throw new Error(`SUCCESSOR_EXECUTION_ALREADY_STARTED:${occupied}`);

const registry = readJson(registryPath);
const correction = readJson(correctionPath);
const proof = readJson(proofPath);
const baseline = readJson(baselinePath);
validateSentinelRegistry(registry);
if (verifySeal(correction, "correctionHash").valid !== true) throw new Error("CORRECTION_SEAL_INVALID");
if (verifySeal(proof, "proofHash").valid !== true || proof.status !== "PASS" || proof.executionCount !== 1) throw new Error("FOCUSED_PROOF_NOT_EXACT_PASS");
if (proof.correction.correctionHash !== correction.correctionHash || proof.registry.registryHash !== registry.registryHash) throw new Error("FOCUSED_PROOF_BINDING_MISMATCH");

const expectedGateIds = ["RELEASE-003-SUCCESSOR", "RELEASE-007-SUCCESSOR", "RELEASE-008-SUCCESSOR", "RELEASE-014-SUCCESSOR", "RELEASE-015-SUCCESSOR"];
if (compactJson(correction.invalidatedGateClosure.release) !== compactJson(expectedGateIds)) throw new Error("INVALIDATED_GATE_SET_CHANGED");

const git = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim();
const gitZ = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0);
const normalized = (value) => value.replaceAll("\\", "/");

function inventorySummary(expected, absoluteRoot) {
  const actual = inventoryRoot(absoluteRoot, { pathBase: absoluteRoot });
  const comparison = compareInventories(expected, actual);
  return {
    exact: comparison.equal,
    fileCount: actual.fileCount,
    totalBytes: actual.totalBytes,
    pathSetSha256: actual.pathSetSha256,
    aggregateSha256: actual.aggregateSha256,
    missingCount: comparison.missing.length,
    unexpectedCount: comparison.unexpected.length,
    changedCount: comparison.changed.length,
  };
}

function protectedSnapshot() {
  const phaseRoot = baseline.phase6a.directory.root;
  const phaseDirectory = inventorySummary(baseline.phase6a.directory, phaseRoot);
  const invocationPath = path.join(ROOT, baseline.phase6a.invocationManifest.relativePath);
  const invocationExact = fs.existsSync(invocationPath) === true
    && fs.statSync(invocationPath).size === baseline.phase6a.invocationManifest.byteLength
    && sha256(fs.readFileSync(invocationPath)) === baseline.phase6a.invocationManifest.sha256;
  const retainedRc = inventorySummary(baseline.diagnosticInventories.retainedRc, baseline.diagnosticInventories.retainedRc.root);
  const reviewScreenshots = inventorySummary(baseline.diagnosticInventories.reviewScreenshots, baseline.diagnosticInventories.reviewScreenshots.root);
  const retainedQuarantine = inventorySummary(baseline.retainedQuarantine.inventory, baseline.retainedQuarantine.inventory.root);
  const historicalEvidence = Object.fromEntries(Object.entries(correction.historicalBindings).map(([key, binding]) => [key, sha256(fs.readFileSync(path.join(ROOT, binding.relativePath)))]));
  const findingSources = Object.fromEntries([...new Map(correction.adjudications.map((item) => [item.relativePath, item.sourceSha256]))].map(([relativePath]) => [relativePath, sha256(fs.readFileSync(path.join(ROOT, relativePath)))]));
  const exact = phaseDirectory.exact === true
    && invocationExact === true
    && retainedRc.exact === true
    && reviewScreenshots.exact === true
    && retainedQuarantine.exact === true
    && Object.entries(historicalEvidence).every(([key, hash]) => hash === correction.historicalBindings[key].sha256)
    && Object.entries(findingSources).every(([relativePath, hash]) => hash === correction.adjudications.find((item) => item.relativePath === relativePath).sourceSha256);
  return {
    exact,
    phase6a: { ...phaseDirectory, invocationExact, totalFileCount: phaseDirectory.fileCount + (invocationExact ? 1 : 0), totalBytesWithManifest: phaseDirectory.totalBytes + (fs.existsSync(invocationPath) ? fs.statSync(invocationPath).size : 0) },
    retainedRc,
    reviewScreenshots,
    retainedQuarantine,
    historicalEvidence,
    findingSources,
  };
}

function protectedSummary(snapshot) {
  return {
    exact: snapshot.exact,
    phase6a: { exact: snapshot.phase6a.exact && snapshot.phase6a.invocationExact, fileCount: snapshot.phase6a.totalFileCount, totalBytes: snapshot.phase6a.totalBytesWithManifest },
    retainedRc: { exact: snapshot.retainedRc.exact, fileCount: snapshot.retainedRc.fileCount, totalBytes: snapshot.retainedRc.totalBytes },
    reviewScreenshots: { exact: snapshot.reviewScreenshots.exact, fileCount: snapshot.reviewScreenshots.fileCount, totalBytes: snapshot.reviewScreenshots.totalBytes },
    retainedQuarantine: { exact: snapshot.retainedQuarantine.exact, fileCount: snapshot.retainedQuarantine.fileCount, totalBytes: snapshot.retainedQuarantine.totalBytes },
    historicalEvidence: snapshot.historicalEvidence,
    findingSources: snapshot.findingSources,
  };
}

function gitLockPaths() {
  const root = path.join(ROOT, ".git");
  const found = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory() === true) visit(absolutePath);
      else if (entry.isFile() === true && entry.name.endsWith(".lock")) found.push(normalized(path.relative(ROOT, absolutePath)));
    }
  };
  visit(root);
  return found.sort();
}

function assertExact(condition, code, details = {}) {
  if (condition !== true) {
    const error = new Error(code);
    error.code = code;
    error.details = details;
    throw error;
  }
}

const initialProtected = protectedSnapshot();
assertExact(initialProtected.exact, "INITIAL_PROTECTED_ARTIFACT_MISMATCH", protectedSummary(initialProtected));
fs.mkdirSync(resultRoot, { recursive: false });
const results = [];

function runGate(entryId, gate) {
  const startedAt = new Date().toISOString();
  const started = Date.now();
  let status = "PASS";
  let details;
  let failureCode = null;
  try {
    details = gate();
  } catch (error) {
    status = "FAIL";
    failureCode = typeof error?.code === "string" ? error.code : "UNEXPECTED_GATE_FAILURE";
    details = typeof error?.details === "object" && error.details !== null ? error.details : {};
  }
  const after = protectedSnapshot();
  if (after.exact !== true || compactJson(protectedSummary(after)) !== compactJson(protectedSummary(initialProtected))) {
    status = "FAIL";
    failureCode = "PROTECTED_ARTIFACT_MUTATION";
    details = { before: protectedSummary(initialProtected), after: protectedSummary(after) };
  }
  const basis = {
    schemaVersion: "1.0",
    resultType: "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_MEMBER_RESULT",
    entryId,
    executionCount: 1,
    status,
    failureCode,
    startedAt,
    durationMs: Date.now() - started,
    details,
    restoration: { exact: after.exact, protectedSummaryHash: sha256(compactJson(protectedSummary(after))) },
    activity: { credentialSourcesRead: 0, credentialValuesRead: 0, providerCalls: 0, metadataCalls: 0, evaluatorCalls: 0, authorityCreation: 0, qualificationReplays: 0, benchmarkRuns: 0, productHandlerCalls: 0, deployments: 0, merges: 0, remoteWrites: 0 },
  };
  assertNoRawValueFields(basis, entryId);
  const result = sealRecord(basis, "memberResultHash");
  writeCreateOnly(path.join(resultRoot, `${entryId}.json`), result);
  results.push(result);
  return result;
}

const gates = [
  ["RELEASE-003-SUCCESSOR", () => {
    const scan = scanRepository(ROOT, registry);
    assertNoRawValueFields(scan, "governingSecretScan");
    assertExact(scan.status === "PASS", "SUCCESSOR_SECRET_SCAN_FAILED", { ...scan, findings: scan.findings || [] });
    assertExact(scan.knownSentinelFindingCount === 6 && scan.findings.length === 6 && scan.unexpectedFindingCount === 0 && scan.missingRegistryEntryCount === 0, "SUCCESSOR_SECRET_SCAN_COUNT_MISMATCH", scan);
    return scan;
  }],
  ["RELEASE-007-SUCCESSOR", () => {
    const result = childProcess.spawnSync("git", ["diff", "--check"], { cwd: ROOT, encoding: "utf8", windowsHide: true, shell: false });
    const spawnErrorAbsent = Object.prototype.hasOwnProperty.call(result, "error") !== true;
    const successorPaths = gitZ(["ls-files", "--others", "--exclude-standard", "-z"]).map(normalized).filter((relativePath) => relativePath.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${SCANNER_PREFIX}-`)).sort();
    const trailingWhitespace = [];
    for (const relativePath of successorPaths) {
      const text = fs.readFileSync(path.join(ROOT, relativePath), "utf8");
      if (text.split(/\r?\n/).some((line) => /[ \t]+$/.test(line))) trailingWhitespace.push(relativePath);
    }
    assertExact(result.status === 0 && spawnErrorAbsent === true && (result.stdout || "") === "" && (result.stderr || "") === "" && trailingWhitespace.length === 0, "DIFF_CHECK_FAILED", { exitCode: result.status, spawnErrorAbsent, stdoutSha256: sha256(result.stdout || ""), stderrSha256: sha256(result.stderr || ""), trailingWhitespace });
    return { command: "git diff --check", executionCount: 1, exitCode: 0, successorFilesCheckedForTrailingWhitespace: successorPaths.length, trailingWhitespace: [], stdoutSha256: sha256(""), stderrSha256: sha256("") };
  }],
  ["RELEASE-008-SUCCESSOR", () => {
    const entries = gitZ(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
    const trackedChanges = entries.filter((entry) => entry.startsWith("?? ") !== true);
    const untracked = entries.filter((entry) => entry.startsWith("?? ")).map((entry) => normalized(entry.slice(3))).sort();
    const phase6a = untracked.filter((relativePath) => relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") || relativePath === "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json");
    const successor = untracked.filter((relativePath) => relativePath.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${SCANNER_PREFIX}-`));
    const unexpected = untracked.filter((relativePath) => phase6a.includes(relativePath) !== true && successor.includes(relativePath) !== true);
    const identity = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), parent: git(["rev-parse", "HEAD^"]), tracking: git(["rev-parse", "@{u}"]), staged: git(["diff", "--cached", "--name-only"]), indexSha256: sha256(fs.readFileSync(path.join(ROOT, ".git/index"))) };
    const exactIdentity = identity.branch === "refactor/beta-evidence-pipeline" && identity.head === "b3bde8269a17b54dcff956a1c5f5be1cb28092d3" && identity.tree === "3e36290477de110d8eaed4d0975259e8f03b17a9" && identity.parent === "5da4c3de47a2860495087bacacdd60ac3c65603b" && identity.tracking === "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35" && identity.staged === "" && identity.indexSha256 === correction.checkpoint.indexSha256;
    assertExact(exactIdentity && trackedChanges.length === 0 && phase6a.length === 85 && successor.length > 0 && unexpected.length === 0 && gitLockPaths().length === 0, "CANDIDATE_RECONCILIATION_MISMATCH", { identity, trackedChangeCount: trackedChanges.length, phase6aCount: phase6a.length, successorCount: successor.length, unexpected, lockPaths: gitLockPaths() });
    return { ...identity, trackedChangeCount: 0, phase6aCount: 85, successorCount: successor.length, unexpected: [], lockPaths: [] };
  }],
  ["RELEASE-014-SUCCESSOR", () => {
    const snapshot = protectedSnapshot();
    assertExact(snapshot.exact && snapshot.phase6a.totalFileCount === 85 && snapshot.phase6a.totalBytesWithManifest === 72299353, "PHASE6A_IDENTITY_MISMATCH", protectedSummary(snapshot));
    return { fileCount: 85, totalBytes: 72299353, inventoryHash: baseline.phase6a.sealedInventoryHash, pathSetHash: baseline.phase6a.sealedPathSetHash, invocationManifestHash: baseline.phase6a.sealedInvocationManifestHash, retainedRcExact: snapshot.retainedRc.exact, reviewScreenshotsExact: snapshot.reviewScreenshots.exact, retainedQuarantineExact: snapshot.retainedQuarantine.exact };
  }],
  ["RELEASE-015-SUCCESSOR", () => {
    const actual = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), parent: git(["rev-parse", "HEAD^"]), tracking: git(["rev-parse", "@{u}"]), indexSha256: sha256(fs.readFileSync(path.join(ROOT, ".git/index"))) };
    const scriptBindingsExact = correction.scriptBindings.every((binding) => sha256(fs.readFileSync(path.join(ROOT, binding.relativePath))) === binding.sha256);
    const historicalBindingsExact = Object.entries(correction.historicalBindings).every(([, binding]) => sha256(fs.readFileSync(path.join(ROOT, binding.relativePath))) === binding.sha256);
    const findingSourcesExact = correction.adjudications.every((item) => sha256(fs.readFileSync(path.join(ROOT, item.relativePath))) === item.sourceSha256);
    const versionExact = readJson(path.join(ROOT, "package.json")).version === "1.12.35";
    const sealsExact = verifySeal(registry, "registryHash").valid === true && verifySeal(correction, "correctionHash").valid === true && verifySeal(proof, "proofHash").valid === true;
    const identityExact = actual.branch === "refactor/beta-evidence-pipeline" && actual.head === correction.checkpoint.head && actual.tree === correction.checkpoint.tree && actual.parent === correction.checkpoint.parent && actual.tracking === correction.checkpoint.directRemoteBeforeImplementation && actual.indexSha256 === correction.checkpoint.indexSha256;
    const snapshot = protectedSnapshot();
    assertExact(identityExact && scriptBindingsExact && historicalBindingsExact && findingSourcesExact && versionExact && sealsExact && snapshot.exact && gitLockPaths().length === 0, "REPOSITORY_INTEGRITY_MISMATCH", { actual, identityExact, scriptBindingsExact, historicalBindingsExact, findingSourcesExact, versionExact, sealsExact, protectedExact: snapshot.exact, lockPaths: gitLockPaths() });
    return { ...actual, scriptBindingsExact, historicalBindingsExact, findingSourcesExact, versionExact, sealsExact, protectedExact: true, classification: "VERSION_1_12_35_EXHAUSTIVE_VALIDATION_STOPPED_BY_RELEASE_003_SECRET_SCAN", historicalStopPreserved: true, releaseState: "SUCCESSOR_GATES_PASS_PENDING_CONSOLIDATION" };
  }],
];

for (const [entryId, gate] of gates) {
  const result = runGate(entryId, gate);
  if (result.status !== "PASS") break;
}

const passed = results.filter((result) => result.status === "PASS").length;
const failed = results.filter((result) => result.status === "FAIL").length;
const ledgerBasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_EXECUTION_LEDGER",
  executionState: failed === 0 && results.length === expectedGateIds.length ? "COMPLETE_PASS" : "STOPPED_ON_FIRST_FAILURE",
  intendedGateIds: expectedGateIds,
  executedGateIds: results.map((result) => result.entryId),
  executionCounts: Object.fromEntries(results.map((result) => [result.entryId, result.executionCount])),
  results: results.map((result) => ({ entryId: result.entryId, status: result.status, memberResultHash: result.memberResultHash })),
  totals: { intended: expectedGateIds.length, executed: results.length, passed, failed, dependencyNotRun: expectedGateIds.length - results.length },
  stopOnFirstFailure: true,
  focusedProofExecutionCount: proof.executionCount,
  release003SuccessorExecutionCount: results.filter((result) => result.entryId === "RELEASE-003-SUCCESSOR").length,
  activity: { credentialSourcesRead: 0, credentialValuesRead: 0, providerCalls: 0, metadataCalls: 0, evaluatorCalls: 0, authorityCreation: 0, qualificationReplays: 0, benchmarkRuns: 0, productHandlerCalls: 0, deployments: 0, merges: 0, remoteWrites: 0 },
};
const ledger = sealRecord(ledgerBasis, "ledgerHash");
writeCreateOnly(ledgerPath, ledger);

if (failed !== 0 || results.length !== expectedGateIds.length) {
  const stopBasis = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_TERMINAL_STOP",
    classification: "VERSION_1_12_35_SECRET_SCAN_SUCCESSOR_VALIDATION_STOPPED",
    releaseState: "UNRELEASED",
    failedGate: results.find((result) => result.status === "FAIL")?.entryId || null,
    ledger: { relativePath: normalized(path.relative(ROOT, ledgerPath)), sha256: sha256(fs.readFileSync(ledgerPath)), ledgerHash: ledger.ledgerHash },
    rerunAllowed: false,
    pushAllowed: false,
    historicalStopPreserved: true,
  };
  const stop = sealRecord(stopBasis, "stopHash");
  writeCreateOnly(stopPath, stop);
  process.stdout.write(`${compactJson({ status: "STOP", failedGate: stop.failedGate, executed: results.length, stopHash: stop.stopHash })}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${compactJson({ status: "PASS", executed: results.length, passed, failed, ledgerHash: ledger.ledgerHash, release003SuccessorExecutionCount: 1 })}\n`);
}
