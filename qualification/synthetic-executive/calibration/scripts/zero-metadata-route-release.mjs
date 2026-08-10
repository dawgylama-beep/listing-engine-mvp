import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { exactKeys, sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";

export const ZERO_METADATA_ROUTE_RELEASE_TYPE = "KATHERINE_SYNTHETIC_EXECUTIVE_ZERO_METADATA_ROUTE_RELEASE";
export const ZERO_METADATA_ROUTE_VERSION = "1.0";
export const ZERO_METADATA_ROUTE_RELEASE_PATH = "qualification/synthetic-executive/calibration/zero-metadata-route-release.json";
export const FEATURE_BRANCH = "refactor/beta-evidence-pipeline";
export const COGNITIVE_SUBJECT = Object.freeze({
  version: "1.12.27",
  commit: "061dd081e215d02b759a77e56b5b76a40d095d14",
  tree: "cc32e9b13355818652def44fda5e188deac08c2e",
  observabilityReleaseHash: "48ccfe3ca681725c551bcb3d461f1d0229f6484e3322f58a8f5a4c4a5c144d5f",
  canonicalRequestHash: "73fa81d6d3fce8add2d8911682330b954b2653edfb43de4aa37ee02eea6d079e",
  safeProviderDiagnosticsContractVersion: "1.0",
  terminalResultSchemaVersion: "1.1"
});

export const PRIOR_ARTIFACT_HASHES = Object.freeze({
  consumedAuthority: "4c507a05efb0c2a51060078e0c112b36a3349630e0d3c74b2a76b92bef390a3a",
  calibrationResult: "8e5f482627431dbae749597265d08ec2b9b825ce913e31340096c21650f77c4c",
  metadataAccessReceipt: "21415ddc582597227ed6f32681529200fc06ccfa2e4caa7f58797c6dcbba45a2",
  qualificationLedger: "2f5267adf0a84a8ce8112ea7ec4c93a702e0de1352421f7f0386d45e188e86fc"
});

export const PRIOR_METADATA_EVIDENCE = Object.freeze({
  receiptRelativePath: "qualification-results/real-route-calibration-ee15190dac308935/metadata-access-receipt.json",
  receiptFileHash: PRIOR_ARTIFACT_HASHES.metadataAccessReceipt,
  canonicalSafeResponseHash: "8a4f2eb296f7a3fd5d11b478d70cfbecd182f977aafa3e114a9bc8018754dc34",
  returnedModelId: "gpt-5.6-sol"
});

export const ZERO_METADATA_ROUTE_COMMIT_PATHS = Object.freeze([
  "PRODUCT_ROADMAP.md",
  "package.json",
  "qualification/synthetic-executive/calibration/README.md",
  "qualification/synthetic-executive/calibration/schemas/zero-metadata-authority-sealing-receipt.schema.json",
  "qualification/synthetic-executive/calibration/schemas/zero-metadata-real-route-calibration-authority.schema.json",
  "qualification/synthetic-executive/calibration/scripts/run-zero-metadata-real-route-calibration.mjs",
  "qualification/synthetic-executive/calibration/scripts/zero-metadata-real-route-authority.mjs",
  "qualification/synthetic-executive/calibration/scripts/zero-metadata-route-release.mjs",
  ZERO_METADATA_ROUTE_RELEASE_PATH,
  "tests/milestone-2c1-canonical-customer-evidence.ps1",
  "tests/synthetic-executive-zero-metadata-real-route.test.mjs"
]);

export const ZERO_METADATA_ROUTE_ARTIFACT_PATHS = Object.freeze(
  ZERO_METADATA_ROUTE_COMMIT_PATHS.filter((relativePath) => relativePath !== ZERO_METADATA_ROUTE_RELEASE_PATH)
);

const RELEASE_FIELDS = Object.freeze([
  "schemaVersion", "releaseType", "releaseState", "routeVersion", "cognitiveSubject",
  "providerProfileHash", "calibrationPromptHash", "executiveActionSchemaHash",
  "priorConsumedArtifactHashes", "priorMetadataEvidence", "governance",
  "permittedCommitPaths", "artifactHashes", "activityAssertions", "recordHash"
]);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..", "..", "..", "..");

function git(args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(repositoryRoot, relativePath), "utf8"));
}

function expectedGovernance() {
  return {
    exactModelId: "gpt-5.6-sol", endpointClass: "RESPONSES_API", inferenceEndpoint: "v1/responses",
    reasoningEffort: "medium", store: false, maximumMetadataAccessRequests: 0,
    maximumInferenceRequests: 1, maximumGovernedReasoningSteps: 1, maximumInferenceRetries: 0,
    maximumAgentToolCalls: 0, maximumEngineeringWorkerDispatches: 0, maximumSuccessors: 0,
    inputTokenCeiling: 8000, outputTokenCeiling: 2000, totalTokenCeiling: 10000,
    maximumWallClockDurationMs: 300000, maximumProviderCostUsd: 0.25
  };
}

export function currentZeroMetadataArtifactHashes() {
  return ZERO_METADATA_ROUTE_ARTIFACT_PATHS.map((relativePath) => ({
    relativePath,
    sha256: sha256Bytes(readFileSync(path.join(repositoryRoot, relativePath)))
  }));
}

export function validateZeroMetadataRouteReleaseRecord(record, { validateCurrentArtifacts = true } = {}) {
  exactKeys(record, RELEASE_FIELDS, "zero-metadata route release");
  assert.equal(record.schemaVersion, "1.0");
  assert.equal(record.releaseType, ZERO_METADATA_ROUTE_RELEASE_TYPE);
  assert.equal(record.releaseState, "SEALED_SOURCE_PATCH");
  assert.equal(record.routeVersion, ZERO_METADATA_ROUTE_VERSION);
  assert.deepEqual(record.cognitiveSubject, COGNITIVE_SUBJECT);
  assert.equal(record.providerProfileHash, "da38983bd5a6381b90379e4fa49142a9bb7dcc16941cf1246b479cb6a962cab1");
  assert.equal(record.calibrationPromptHash, "73dc7a21fa2db16c432b9630f3934ea87d78cd89b174b1739563b207a5a57e93");
  assert.equal(record.executiveActionSchemaHash, "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba");
  assert.deepEqual(record.priorConsumedArtifactHashes, PRIOR_ARTIFACT_HASHES);
  assert.deepEqual(record.priorMetadataEvidence, PRIOR_METADATA_EVIDENCE);
  assert.deepEqual(record.governance, expectedGovernance());
  assert.deepEqual(record.permittedCommitPaths, ZERO_METADATA_ROUTE_COMMIT_PATHS);
  assert.deepEqual(record.artifactHashes.map(({ relativePath }) => relativePath), ZERO_METADATA_ROUTE_ARTIFACT_PATHS);
  if (validateCurrentArtifacts) assert.deepEqual(record.artifactHashes, currentZeroMetadataArtifactHashes());
  assert.deepEqual(record.activityAssertions, {
    credentialAccessCount: 0, providerRequestCount: 0, modelCallCount: 0,
    metadataRequestCount: 0, inferenceRequestCount: 0, authorityCreated: false,
    calibrationPerformed: false, qualificationPerformed: false, benchmarkExecuted: false,
    productHandlerInvoked: false, previewDeployed: false, productionDeployed: false
  });
  const core = structuredClone(record); delete core.recordHash;
  assert.equal(sha256Json(core), record.recordHash, "zero-metadata route release hash differs");
  return Object.freeze({ valid: true, recordHash: record.recordHash });
}

export function loadZeroMetadataRouteRelease(options = {}) {
  const record = readJson(ZERO_METADATA_ROUTE_RELEASE_PATH);
  validateZeroMetadataRouteReleaseRecord(record, options);
  return Object.freeze(record);
}

export function inspectSealedZeroMetadataRouteRelease({ gitImpl = git } = {}) {
  const release = loadZeroMetadataRouteRelease();
  const head = gitImpl(["rev-parse", "HEAD"]);
  const tree = gitImpl(["rev-parse", "HEAD^{tree}"]);
  const parents = gitImpl(["rev-list", "--parents", "-n", "1", head]).split(/\s+/).slice(1);
  assert.deepEqual(parents, [COGNITIVE_SUBJECT.commit], "runner patch must be the direct non-merge child of the cognitive subject");
  assert.equal(gitImpl(["rev-parse", `${COGNITIVE_SUBJECT.commit}^{tree}`]), COGNITIVE_SUBJECT.tree);
  assert.equal(JSON.parse(gitImpl(["show", `${COGNITIVE_SUBJECT.commit}:package.json`])).version, COGNITIVE_SUBJECT.version);
  assert.equal(readJson("package.json").version, COGNITIVE_SUBJECT.version, "product Version must remain the cognitive subject Version");
  assert.equal(gitImpl(["branch", "--show-current"]), FEATURE_BRANCH);
  assert.equal(gitImpl(["status", "--porcelain=v1", "--untracked-files=no"]), "", "tracked tooling release must be clean");
  const changed = gitImpl(["diff", "--name-only", COGNITIVE_SUBJECT.commit, head]).split(/\r?\n/).filter(Boolean);
  assert.deepEqual(changed, ZERO_METADATA_ROUTE_COMMIT_PATHS, "zero-metadata patch paths differ");
  return Object.freeze({
    valid: true, release, releaseRecordHash: release.recordHash,
    parentCommit: COGNITIVE_SUBJECT.commit, parentTree: COGNITIVE_SUBJECT.tree,
    runtimeCommit: head, runtimeTree: tree
  });
}

async function main() {
  const inspected = inspectSealedZeroMetadataRouteRelease();
  process.stdout.write(`${stableJson({
    status: "KATHERINE_SYNTHETIC_EXECUTIVE_ZERO_METADATA_ROUTE_RELEASE_VERIFIED",
    routeVersion: ZERO_METADATA_ROUTE_VERSION,
    cognitiveSubject: COGNITIVE_SUBJECT,
    runtimeCommit: inspected.runtimeCommit,
    runtimeTree: inspected.runtimeTree,
    releaseRecordHash: inspected.releaseRecordHash
  })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
