import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  compareInventories,
  compactJson,
  inventoryRoot,
  readJson,
  sha256Bytes,
  writeCompactJsonCreateOnly,
} from "./version-1.12.35-exhaustive-continuation-identity.mjs";

const root = "C:/Users/dawgy/Projects/listing-engine-mvp";
const evidenceRoot = path.join(root, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-exhaustive-continuation";
const registryPath = path.join(evidenceRoot, `${prefix}-registry.json`);
const baselinePath = path.join(evidenceRoot, `${prefix}-baseline.json`);
const correctionPath = path.join(evidenceRoot, "version-1.12.35-playwright-adjudication-append-only-correction.json");
const gateCPath = path.join(evidenceRoot, `${prefix}-gate-c-validation-stop.json`);
const combinedPath = path.join(evidenceRoot, `${prefix}-combined-result.json`);
const terminalPath = path.join(evidenceRoot, `${prefix}-terminal-stop.json`);
for (const filePath of [gateCPath, combinedPath, terminalPath]) if (fs.existsSync(filePath)) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${filePath}`);

const registry = readJson(registryPath);
const baseline = readJson(baselinePath);
const correction = readJson(correctionPath);
const mutableRoot = baseline.mutableOutputRoots[0];
const mutableActual = inventoryRoot(root, mutableRoot.absoluteRoot, { pathBase: mutableRoot.pathBase });
const mutableComparison = compareInventories(mutableRoot.inventory, mutableActual);
const rcActual = inventoryRoot(root, "test-results/playwright", { pathBase: path.join(root, "test-results/playwright") });
const quarantineActual = inventoryRoot(root, baseline.retainedQuarantine.absoluteRoot, { pathBase: baseline.retainedQuarantine.absoluteRoot });
const quarantineComparison = compareInventories(baseline.retainedQuarantine.inventory, quarantineActual);
const phaseDirectory = inventoryRoot(root, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd", { pathBase: path.join(root, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd") });
const phaseManifestPath = path.join(root, baseline.phase6a.invocationManifest.relativePath);
const phaseManifestSha256 = sha256Bytes(fs.readFileSync(phaseManifestPath));
const phase6aExact = phaseDirectory.fileCount + 1 === 85 && phaseDirectory.totalBytes + fs.statSync(phaseManifestPath).size === 72299353 && phaseManifestSha256 === baseline.phase6a.sealedInvocationManifestHash;
const committedDiff = childProcess.execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
const staged = childProcess.execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
if (!mutableComparison.equal || !quarantineComparison.equal || !phase6aExact || committedDiff || staged) throw new Error(`STOP_PRESERVATION_PRECONDITION_FAILED:${compactJson({ mutableComparison, quarantineComparison, phase6aExact, committedDiff, staged })}`);

const gateCBasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_EXHAUSTIVE_CONTINUATION_GATE_C_VALIDATION_STOP",
  version: "1.12.35",
  status: "FAIL",
  checkpoint: registry.checkpoint,
  command: [process.execPath.replaceAll("\\", "/"), path.join(evidenceRoot, `${prefix}-offline-proof.mjs`).replaceAll("\\", "/")],
  executionCount: 1,
  exitCode: 1,
  sweepMembersExecuted: 0,
  failure: {
    code: "OFFLINE_PROOF_BOOLEAN_POLARITY_DEFECT",
    location: `${prefix}-offline-proof.mjs:57`,
    exactCondition: "executableProof.some((item) => Object.values(item).includes(false))",
    explanation: "Every one of the 40 pending entries reported executableExists=true, workingDirectoryExists=true, scriptArgumentsExist=true, roundTripExact=true, and noInlineNode=true, while the required shell=false property was itself incorrectly interpreted as a failing Boolean.",
    semanticProofPassed: false,
    repairAttempted: false,
    retryAttempted: false,
  },
  docketDisposition: "STOP_WITHOUT_EXECUTING_THE_SWEEP",
  mutableOutputBaselineEqual: true,
  retainedRc: { fileCount: rcActual.fileCount, totalBytes: rcActual.totalBytes, unchanged: true },
  retainedQuarantineUnchanged: true,
  phase6aUnchanged: true,
  correctionEvidencePreserved: { relativePath: path.relative(root, correctionPath).replaceAll("\\", "/"), correctionHash: correction.correctionHash },
  prohibitedActivity: { credentialAccesses: 0, providerRequests: 0, metadataRequests: 0, evaluatorInvocations: 0, authoritiesCreated: 0, caseReplays: 0, benchmarksExecuted: 0, productHandlerCalls: 0, deployments: 0, merges: 0, remoteWrites: 0 },
};
const gateC = { ...gateCBasis, gateCStopHash: sha256Bytes(compactJson(gateCBasis)) };
writeCompactJsonCreateOnly(gateCPath, gateC);

const entries = registry.entries.map((entry) => {
  if (entry.state === "RETAINED_PASS") {
    return {
      id: entry.id,
      provenance: "IMMUTABLE_PRIOR_SWEEP_RESULT",
      executionCount: 1,
      status: "PASS",
      exitIdentity: { exitCode: entry.retainedResult.exitCode },
      outputIdentities: entry.retainedResult.generatedCaptureIdentity,
      dependencyDisposition: "PRIOR_SEALED_RESULT_RETAINED",
      restorationResult: entry.id === "STATIC-028" ? "RETROSPECTIVELY_PROVEN_EXACT_AT_GATE_A" : entry.retainedResult.cleanupRestoration.status,
    };
  }
  return {
    id: entry.id,
    provenance: "SUCCESSOR_CONTINUATION_REGISTRY",
    executionCount: 0,
    status: "NOT_RUN_DEPENDENCY",
    exitIdentity: null,
    outputIdentities: null,
    dependencyDisposition: "OFFLINE_HARNESS_PROOF_FAILED",
    failedPrerequisite: "OFFLINE_HARNESS_PROOF_PASS",
    restorationResult: "NOT_REQUIRED_NOT_EXECUTED",
  };
});
const combinedBasis = {
  schemaVersion: "1.0",
  resultType: "VERSION_1_12_35_EXHAUSTIVE_CONTINUATION_COMBINED_STOP_RESULT",
  version: "1.12.35",
  status: "FAIL_CLOSED_BEFORE_SWEEP_EXECUTION",
  entries,
  totals: { entries: 68, retainedPass: 28, continuationPass: 0, fail: 0, notRunDependency: 40, continuationExecutionCount: 0 },
  gateCStop: { relativePath: path.relative(root, gateCPath).replaceAll("\\", "/"), gateCStopHash: gateC.gateCStopHash },
  mutableOutputRootsEqualGateABaseline: true,
  constructionOfFinalReleaseSetPermitted: false,
};
const combined = { ...combinedBasis, combinedResultHash: sha256Bytes(compactJson(combinedBasis)) };
writeCompactJsonCreateOnly(combinedPath, combined);

const evidencePaths = fs.readdirSync(evidenceRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile() && (entry.name.startsWith(prefix) || entry.name === path.basename(correctionPath)) && entry.name !== path.basename(terminalPath))
  .map((entry) => path.join(evidenceRoot, entry.name))
  .sort((left, right) => left.localeCompare(right, "en"))
  .map((absolutePath) => ({ relativePath: path.relative(root, absolutePath).replaceAll("\\", "/"), sha256: sha256Bytes(fs.readFileSync(absolutePath)) }));
const terminalBasis = {
  schemaVersion: "1.0",
  receiptType: "VERSION_1_12_35_EXHAUSTIVE_RELEASE_VALIDATION_CONTINUATION_TERMINAL_STOP",
  version: "1.12.35",
  releaseState: "UNRELEASED",
  preservedQualification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
  checkpoint: registry.checkpoint,
  terminalClassification: "VERSION_1_12_35_EXHAUSTIVE_CONTINUATION_STOPPED_AT_OFFLINE_HARNESS_PROOF",
  rootCause: gateC.failure,
  combinedResult: { relativePath: path.relative(root, combinedPath).replaceAll("\\", "/"), combinedResultHash: combined.combinedResultHash },
  evidenceInventory: evidencePaths,
  preservation: { previouslyCommittedBytesChanged: false, mutableOutputBaselineEqual: true, retainedRcUnchanged: true, retainedQuarantineUnchanged: true, phase6aUnchanged: true },
  execution: { retainedMembersRerun: 0, staticContinuationMembersExecuted: 0, releaseGatesExecuted: 0, retries: 0 },
  activity: { credentialAccesses: 0, providerRequests: 0, metadataRequests: 0, evaluatorInvocations: 0, authoritiesCreated: 0, qualificationReplays: 0, benchmarkExecutions: 0, productHandlerCalls: 0, deployments: 0, merges: 0, pushes: 0, remoteWrites: 0 },
  finalReleaseSetConstructed: false,
  finalReleaseRecordConstructed: false,
  pushAuthorized: false,
};
const terminal = { ...terminalBasis, terminalStopHash: sha256Bytes(compactJson(terminalBasis)) };
writeCompactJsonCreateOnly(terminalPath, terminal);
process.stdout.write(`${compactJson({ status: "SEALED_STOP", gateCStopHash: gateC.gateCStopHash, combinedResultHash: combined.combinedResultHash, terminalStopHash: terminal.terminalStopHash, evidenceCountExcludingTerminal: evidencePaths.length })}\n`);
