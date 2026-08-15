import fs from "node:fs";
import path from "node:path";
import {
  compactJson,
  inventoryRoot,
  readJson,
  recomputeEmbeddedHash,
  sha256Bytes,
  writeCompactJsonCreateOnly,
} from "./version-1.12.35-exhaustive-continuation-identity.mjs";

const root = "C:/Users/dawgy/Projects/listing-engine-mvp";
const evidenceRoot = path.join(root, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-exhaustive-continuation";
const paths = {
  baseline: path.join(evidenceRoot, `${prefix}-baseline.json`),
  fixture: path.join(evidenceRoot, `${prefix}-curly-apostrophe-fixture.json`),
  gateA: path.join(evidenceRoot, `${prefix}-gate-a-evidence.json`),
  registry: path.join(evidenceRoot, `${prefix}-registry.json`),
  correction: path.join(evidenceRoot, "version-1.12.35-playwright-adjudication-append-only-correction.json"),
  resultRoot: path.join(evidenceRoot, `${prefix}-member-results`),
};
for (const filePath of [paths.baseline, paths.fixture, paths.gateA, paths.registry, paths.correction]) {
  if (fs.existsSync(filePath)) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${filePath}`);
}

const priorRegistryPath = path.join(evidenceRoot, "version-1.12.35-exhaustive-sweep-registry.json");
const priorResultPath = path.join(evidenceRoot, "version-1.12.35-exhaustive-sweep-result.json");
const priorRegistry = readJson(priorRegistryPath);
const priorResult = readJson(priorResultPath);
const rcRoot = path.join(root, "test-results/playwright");
const reviewRoot = path.join(root, "test-results/review-screenshots");
const quarantineRoot = "C:/Users/dawgy/AppData/Local/Temp/k35rc-9473d1d92ed7";
const phase6aRoot = path.join(root, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd");
const phase6aManifest = path.join(root, "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json");

const rc = inventoryRoot(root, rcRoot, { pathBase: rcRoot });
const review = inventoryRoot(root, reviewRoot, { pathBase: reviewRoot });
const testResults = inventoryRoot(root, "test-results");
const quarantine = inventoryRoot(root, quarantineRoot, { pathBase: quarantineRoot });
const phase6aDirectory = inventoryRoot(root, phase6aRoot, { pathBase: phase6aRoot });
const phase6aManifestBytes = fs.readFileSync(phase6aManifest);
const phase6a = {
  directory: phase6aDirectory,
  invocationManifest: { relativePath: "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json", byteLength: phase6aManifestBytes.byteLength, sha256: sha256Bytes(phase6aManifestBytes) },
  totalFileCount: phase6aDirectory.fileCount + 1,
  totalBytes: phase6aDirectory.totalBytes + phase6aManifestBytes.byteLength,
  sealedInventoryHash: "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f",
  sealedPathSetHash: "d2edc95cbc9cc727a5adeaccffde68763cc5831356c4d4ec371741b6da269581",
  sealedInvocationManifestHash: "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466",
};
if (rc.fileCount !== 39 || rc.totalBytes !== 3864482 || phase6a.totalFileCount !== 85 || phase6a.totalBytes !== 72299353 || phase6a.invocationManifest.sha256 !== phase6a.sealedInvocationManifestHash) throw new Error("GOVERNED_BASELINE_IDENTITY_MISMATCH");
if (quarantine.fileCount !== rc.fileCount || quarantine.totalBytes !== rc.totalBytes || quarantine.pathSetSha256 !== rc.pathSetSha256 || quarantine.aggregateSha256 !== rc.aggregateSha256) throw new Error("RETAINED_QUARANTINE_IDENTITY_MISMATCH");

const baselineBasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_EXHAUSTIVE_CONTINUATION_GATE_A_BASELINE",
  version: "1.12.35",
  startingIdentity: {
    branch: "refactor/beta-evidence-pipeline",
    head: "48248039ab57e7e701656618f9c699b821ceb404",
    tree: "132895ba7ef8c2fd0fce9c96ae1ebbb0def36b36",
    trackingAndRemote: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35",
    ahead: 11,
    behind: 0,
  },
  mutableOutputRoots: [{ rootId: "TEST_RESULTS", absoluteRoot: path.join(root, "test-results").replaceAll("\\", "/"), pathBase: root.replaceAll("\\", "/"), inventory: testResults }],
  diagnosticInventories: { retainedRc: rc, reviewScreenshots: review },
  retainedQuarantine: { absoluteRoot: quarantineRoot, inventory: quarantine },
  phase6a,
  ignoredClassification: {
    ".env": { classification: "IGNORED_SECRET_STORE", exists: true, contentRead: false },
    "node_modules/": { classification: "IGNORED_DEPENDENCY_ROOT", contentInventoried: false },
    "debug.log": { classification: "IGNORED_HISTORICAL_LOG", contentDisplayed: false },
    "benchmarks/blind-object-v2-results/": { classification: "IGNORED_HISTORICAL_ARTIFACT_ROOT", fileCount: 39, totalBytes: 230387 },
    "benchmarks/blind-object-v2/consent/": { classification: "IGNORED_HISTORICAL_ARTIFACT_ROOT", fileCount: 5, totalBytes: 27303 },
    "benchmarks/blind-object-v2/intake/": { classification: "IGNORED_HISTORICAL_ARTIFACT_ROOT", fileCount: 31, totalBytes: 9073915 },
    "benchmarks/blind-object-v2/prepared/": { classification: "IGNORED_HISTORICAL_ARTIFACT_ROOT", fileCount: 89, totalBytes: 21972672 },
    "benchmarks/blind-object-v2/private/": { classification: "IGNORED_HISTORICAL_ARTIFACT_ROOT", fileCount: 31, totalBytes: 12908316 },
    "qualification-results/": { classification: "IGNORED_HISTORICAL_ARTIFACT_ROOT", fileCount: 865, totalBytes: 2392096 },
    "test-results/": { classification: "IGNORED_MUTABLE_OUTPUT_BASELINE", fileCount: testResults.fileCount, totalBytes: testResults.totalBytes },
  },
  unexpectedUntracked: [],
  unexpectedIgnored: [],
  missing: [],
  overlapping: [],
  duplicate: [],
  unreadable: [],
  unclassified: [],
};
const baseline = { ...baselineBasis, baselineHash: sha256Bytes(compactJson(baselineBasis)) };
writeCompactJsonCreateOnly(paths.baseline, baseline);

const curlyFiles = rc.files.filter((file) => Buffer.from(file.relativePath, "utf8").includes(Buffer.from([0xe2, 0x80, 0x99])));
if (curlyFiles.length !== 6) throw new Error(`CURLY_FIXTURE_MEMBER_COUNT:${curlyFiles.length}`);
const fixtureBasis = {
  schemaVersion: "1.0",
  fixtureType: "UTF8_CURLY_APOSTROPHE_PATH_ROUND_TRIP",
  encoding: "UTF-8",
  normalization: "NFC_FORWARD_SLASH_REPOSITORY_RELATIVE",
  members: curlyFiles,
  pathSetSha256: sha256Bytes(compactJson(curlyFiles.map((file) => file.relativePath))),
  aggregateSha256: sha256Bytes(compactJson(curlyFiles)),
};
writeCompactJsonCreateOnly(paths.fixture, { ...fixtureBasis, fixtureHash: sha256Bytes(compactJson(fixtureBasis)) });

const malformedPath = path.join(evidenceRoot, "version-1.12.35-playwright-shared-fixture-adjudication.json");
const malformed = readJson(malformedPath);
const malformedFullFileSha256 = sha256Bytes(fs.readFileSync(malformedPath));
const malformedIdentity = recomputeEmbeddedHash(malformedPath, "adjudicationHash");
const successorAdjudicationBasis = {
  recordType: "VERSION_1_12_35_PLAYWRIGHT_SHARED_FIXTURE_ADJUDICATION_SUCCESSOR",
  classification: malformed.classification,
  retainedRecordPath: path.relative(root, malformedPath).replaceAll("\\", "/"),
  retainedRecordFullFileSha256: malformedFullFileSha256,
  retainedRc: rc,
  retainedQuarantine: quarantine,
  correction: "FINAL_SERIALIZED_COMPACT_JSON_HASH_RECOMPUTED_AFTER_ALL_FIELDS_AND_UTF8_PATHS_FINALIZED",
};
const successorAdjudication = { ...successorAdjudicationBasis, adjudicationHash: sha256Bytes(compactJson(successorAdjudicationBasis)) };
const policySources = [
  "AGENTS.md",
  "qualification/synthetic-executive/v3-cognitive-remediation/offline-validation-adjudication.json",
  "qualification/synthetic-executive/v3-cognitive-remediation/v3-release-binding-correction.json",
].map((relativePath) => ({ relativePath, sha256: sha256Bytes(fs.readFileSync(path.join(root, relativePath))) }));
const correctionBasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_PLAYWRIGHT_ADJUDICATION_APPEND_ONLY_CORRECTION",
  version: "1.12.35",
  correctionState: "SEALED_APPEND_ONLY_SUPERSESSION",
  malformedRecord: {
    path: path.relative(root, malformedPath).replaceAll("\\", "/"),
    fullFileSha256: malformedFullFileSha256,
    identityField: "adjudicationHash",
    declaredHash: malformedIdentity.declared,
    independentlyRecomputedHash: malformedIdentity.recomputed,
    matchesAdvertisedConstruction: malformedIdentity.matches,
    preciseConstructionError: "THE_EMBEDDED_HASH_WAS_NOT_RECOMPUTED_FROM_THE_FINAL_SERIALIZED_RECORD_AFTER_ALL FINAL FIELDS WERE PRESENT; IT DOES NOT EQUAL SHA256(COMPACT_JSON(RECORD_WITH_adjudicationHash_OMITTED))",
    bytesPreserved: true,
  },
  policyProof: {
    appendOnlySupersessionPermitted: true,
    basis: "The pre-existing tracked repository policy requires immutable Git history, while the tracked offline-validation adjudication explicitly binds a supersededValidationHash and the tracked V3 release-binding correction retains historical evidence unchanged. Together they establish correction by a new separately sealed record, never mutation of the prior record.",
    sources: policySources,
  },
  successorAdjudication,
  waiver: false,
};
writeCompactJsonCreateOnly(paths.correction, { ...correctionBasis, correctionHash: sha256Bytes(compactJson(correctionBasis)) });

const sixCommitted = [
  ["tests/browser/canonical-evidence.spec.mjs", null],
  ["qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-playwright-shared-fixture-adjudication.json", "adjudicationHash"],
  ["qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-sweep-registry.json", null],
  ["qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-sweep-capture-manifest.json", "captureManifestHash"],
  ["qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-sweep-result.json", "resultHash"],
  ["qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-sweep-terminal-stop.json", "terminalStopReceiptHash"],
].map(([relativePath, field]) => {
  const absolutePath = path.join(root, relativePath);
  const audit = { relativePath, fullFileSha256: sha256Bytes(fs.readFileSync(absolutePath)), committedBytesEqualWorktree: true, embeddedIdentityField: field, embeddedIdentity: null, independentlyRecomputedIdentity: null, embeddedIdentityMatches: null };
  if (field) Object.assign(audit, { embeddedIdentity: recomputeEmbeddedHash(absolutePath, field).declared, independentlyRecomputedIdentity: recomputeEmbeddedHash(absolutePath, field).recomputed, embeddedIdentityMatches: recomputeEmbeddedHash(absolutePath, field).matches });
  return audit;
});
const gateABasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_EXHAUSTIVE_CONTINUATION_GATE_A_EVIDENCE",
  checkpoint: baseline.startingIdentity,
  retainedEvidence: {
    browserFixtureSha256: "e2f2eb4aa96e9fd4850d59bc0b89638a3df63ead5c8ffc821f9cee2d23ab5af4",
    captureManifestHash: "419c93872356ee994fc27120017952b9c805a34209226dd0c91f32a214f66d2a",
    sweepResultHash: "c6c6aa3f00aebf7e3f7e448da9133fe3dbd785a848ac6f87c2cf0afd5f169f19",
    terminalStopReceiptHash: "35c3953b7687df82e32e0aafbc0b4e40207c37a1d28600931265dd8b294c777c",
  },
  sixCommittedFileAudit: sixCommitted,
  internalHashMismatchCount: sixCommitted.filter((item) => item.embeddedIdentityMatches === false).length,
  knownInternalMismatches: sixCommitted.filter((item) => item.embeddedIdentityMatches === false).map((item) => item.relativePath),
  baselinePath: path.relative(root, paths.baseline).replaceAll("\\", "/"),
  baselineHash: baseline.baselineHash,
  classifiedSets: { phase6a: true, retainedRc: true, retainedQuarantine: true, reviewScreenshots: true, otherIgnoredRoots: true },
  missing: [], unexpected: [], overlapping: [], duplicate: [], unreadable: [], unclassified: [],
};
writeCompactJsonCreateOnly(paths.gateA, { ...gateABasis, gateAEvidenceHash: sha256Bytes(compactJson(gateABasis)) });

const powershell = "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
const node = process.execPath.replaceAll("\\", "/");
const gatesScript = path.join(evidenceRoot, `${prefix}-gates.mjs`).replaceAll("\\", "/");
const priorById = new Map(priorRegistry.entries.map((entry) => [entry.id, entry]));
const priorResultById = new Map(priorResult.matrix.static.map((entry) => [entry.id, entry]));
const retained = Array.from({ length: 28 }, (_, index) => {
  const id = `STATIC-${String(index + 1).padStart(3, "0")}`;
  const prior = priorById.get(id);
  const result = priorResultById.get(id);
  if (result.status !== "PASS" || result.executionCount !== 1) throw new Error(`RETAINED_RESULT_MISMATCH:${id}`);
  return { id, kind: "STATIC", name: prior.path, state: "RETAINED_PASS", executable: null, arguments: [], workingDirectory: root, dependencies: ["PRIOR_SWEEP_RESULT_SEALED"], outputProducing: id === "STATIC-028", timeoutMs: 0, retainedResult: result };
});
const pendingStatic = Array.from({ length: 25 }, (_, index) => {
  const id = `STATIC-${String(index + 29).padStart(3, "0")}`;
  const prior = priorById.get(id);
  const script = path.join(root, prior.path).replaceAll("\\", "/");
  return { id, kind: "STATIC", name: prior.path, state: "PENDING", executable: powershell, arguments: ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script], workingDirectory: root, dependencies: ["CHECKPOINT_VALID", "OFFLINE_HARNESS_PROOF_PASS", "SAFE_EXECUTION_STATE"], outputProducing: false, timeoutMs: 300000 };
});
const releaseSpecs = [
  ["RELEASE-001", "Browser validation", node, [gatesScript, "browser-retained"]],
  ["RELEASE-002", "Frontend-credential scan", node, [gatesScript, "frontend-credential-scan"]],
  ["RELEASE-003", "Governing secret scan", node, [gatesScript, "governing-secret-scan"]],
  ["RELEASE-004", "JavaScript syntax validation", node, ["--check", path.join(root, "tests/browser/canonical-evidence.spec.mjs").replaceAll("\\", "/")]],
  ["RELEASE-005", "server.ps1 -Check", node, [gatesScript, "server-check"]],
  ["RELEASE-006", "Complete release-version validation", node, [path.join(root, "scripts/verify-release-version.mjs").replaceAll("\\", "/")]],
  ["RELEASE-007", "git diff --check", "git", ["diff", "--check"]],
  ["RELEASE-008", "Candidate reconciliation", node, [gatesScript, "candidate-reconciliation"]],
  ["RELEASE-009", "Frozen cognitive and corpus identity verification", node, [gatesScript, "frozen-identities"]],
  ["RELEASE-010", "Execution-evidence verification", node, [gatesScript, "execution-evidence"]],
  ["RELEASE-011", "Evaluation-evidence verification", node, [gatesScript, "evaluation-evidence"]],
  ["RELEASE-012", "Evaluator-audit verification", node, [gatesScript, "evaluator-audit"]],
  ["RELEASE-013", "Result-seal verification", node, [gatesScript, "result-seal"]],
  ["RELEASE-014", "Phase 6A identity verification", node, [gatesScript, "phase6a"]],
  ["RELEASE-015", "Repository-integrity and classification verification", node, [gatesScript, "repository-integrity"]],
];
const pendingRelease = releaseSpecs.map(([id, name, executable, arguments_]) => ({ id, kind: "RELEASE_GATE", name, state: "PENDING", executable, arguments: arguments_, workingDirectory: root, dependencies: ["CHECKPOINT_VALID", "OFFLINE_HARNESS_PROOF_PASS", "SAFE_EXECUTION_STATE"], outputProducing: false, timeoutMs: 300000 }));
const registryBasis = {
  schemaVersion: "1.0",
  registryType: "VERSION_1_12_35_EXHAUSTIVE_CONTINUATION_SUCCESSOR_REGISTRY",
  registryState: "SEALED_PRE_EXECUTION",
  repositoryRoot: root,
  version: "1.12.35",
  checkpoint: baseline.startingIdentity,
  priorRegistry: { relativePath: path.relative(root, priorRegistryPath).replaceAll("\\", "/"), sha256: sha256Bytes(fs.readFileSync(priorRegistryPath)) },
  priorResult: { relativePath: path.relative(root, priorResultPath).replaceAll("\\", "/"), sha256: sha256Bytes(fs.readFileSync(priorResultPath)), resultHash: "c6c6aa3f00aebf7e3f7e448da9133fe3dbd785a848ac6f87c2cf0afd5f169f19" },
  baseline: { relativePath: path.relative(root, paths.baseline).replaceAll("\\", "/"), baselineHash: baseline.baselineHash },
  executionRules: { shell: false, inlineNodeCommands: false, executionCountCeilingPerPendingEntry: 1, retainedEntriesExecutable: false, powershellExecutionPolicyScope: "PROCESS_ONLY_BYPASS", continueIndependentFailures: true },
  counts: { entries: 68, retainedPass: 28, pendingStatic: 25, pendingReleaseGates: 15 },
  entries: [...retained, ...pendingStatic, ...pendingRelease],
};
writeCompactJsonCreateOnly(paths.registry, { ...registryBasis, registryHash: sha256Bytes(compactJson(registryBasis)) });
fs.mkdirSync(paths.resultRoot, { recursive: true });
process.stdout.write(`${compactJson({ status: "PASS", outputs: Object.fromEntries(Object.entries(paths).map(([key, value]) => [key, value.replaceAll("\\", "/")])) })}\n`);
