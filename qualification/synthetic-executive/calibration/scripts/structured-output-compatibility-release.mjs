import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { exactKeys, sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";
import { COGNITIVE_SUBJECT } from "./zero-metadata-route-release.mjs";
export { COGNITIVE_SUBJECT };

export const STRUCTURED_OUTPUT_RELEASE_TYPE = "KATHERINE_STRUCTURED_OUTPUT_COMPATIBILITY_TOOLING_RELEASE";
export const STRUCTURED_OUTPUT_ROUTE_VERSION = "1.0";
export const STRUCTURED_OUTPUT_RELEASE_PATH = "qualification/synthetic-executive/calibration/structured-output-compatibility-release.json";
export const FEATURE_BRANCH = "refactor/beta-evidence-pipeline";
export const STARTING_TOOLING_COMMIT = "3b51c5156ab33eea3cc6a5c2a4226aa87ef5eb45";
export const STARTING_TOOLING_TREE = "aecb6129e1accd1e40997a4ae368b875a019aec7";
export const EXPECTED_TRANSMITTED_SCHEMA_EXACT_HASH = "c1224e9fbe498a37cd807e30c9e8bf56b6ee51117c84f2e144066cfa75307f29";
export const EXPECTED_TRANSMITTED_SCHEMA_STABLE_HASH = "59ead3a16f7bbe889097e3fbd44d87373f7dab8cc1a85ad257592573e879728b";
export const EXPECTED_COMPLETE_SERIALIZED_REQUEST_HASH = "bb571ba1301703ff09bd804d2aef3d718b97a92f26aa0ff6fc3f54a7ce86b5ce";
export const EXPECTED_SAFE_PROVIDER_DIAGNOSTICS_CONTRACT_HASH = "09069908f8b5bb7a94db97777839db7c587594f91c62b71c9aec3f4b59deaed9";

export const PRIOR_CONSUMED_ARTIFACT_HASHES = Object.freeze({
  originalAuthority: "4c507a05efb0c2a51060078e0c112b36a3349630e0d3c74b2a76b92bef390a3a",
  originalCalibrationResult: "8e5f482627431dbae749597265d08ec2b9b825ce913e31340096c21650f77c4c",
  originalMetadataReceipt: "21415ddc582597227ed6f32681529200fc06ccfa2e4caa7f58797c6dcbba45a2",
  originalLedger: "2f5267adf0a84a8ce8112ea7ec4c93a702e0de1352421f7f0386d45e188e86fc",
  zeroMetadataAuthority: "8e859ed822e2b4c9fcaa4b4787d7c2cf7013ffbc62d89db82413cf96cc03abfb",
  zeroMetadataAuthoritySealingReceipt: "0e12a16197644af7927ea7803cc622e2ff1dd5b04e7ac0e1c8735cd21e84c9af",
  zeroMetadataClaimReceipt: "072ff6b5d85ee091a6741c3fa2ca733d553ced8f3e10640450d6a6e8fac91d69",
  zeroMetadataConsumptionReceipt: "469df23f8912d07a5fa17e1265563dc319454bc5306fb559c9c1b067cf13d508",
  zeroMetadataTerminalReceipt: "4cb5704641d11f0c8b30a0f010c1a0172758293f58823042a26e414740a0bce1",
  zeroMetadataCalibrationResult: "3058a5684232ae933a1ae79b1efc418dd45331cf0839d7635803f05ce4027c51",
  zeroMetadataLedger: "ef39a274c4e547154b8f89b6a79d9030589c980a664c6656cbd19d6146e70781"
});

export const STRUCTURED_OUTPUT_COMMIT_PATHS = Object.freeze([
  "PRODUCT_ROADMAP.md",
  "package.json",
  "qualification/synthetic-executive/calibration/README.md",
  "qualification/synthetic-executive/calibration/safe-provider-diagnostics-contract.json",
  "qualification/synthetic-executive/calibration/schemas/structured-output-authority-sealing-receipt.schema.json",
  "qualification/synthetic-executive/calibration/schemas/structured-output-calibration-result.schema.json",
  "qualification/synthetic-executive/calibration/schemas/structured-output-real-route-calibration-authority.schema.json",
  "qualification/synthetic-executive/calibration/scripts/real-route-governor.mjs",
  "qualification/synthetic-executive/calibration/scripts/real-route-profile.mjs",
  "qualification/synthetic-executive/calibration/scripts/real-route-provider.mjs",
  "qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs",
  "qualification/synthetic-executive/calibration/scripts/run-zero-metadata-real-route-calibration.mjs",
  "qualification/synthetic-executive/calibration/scripts/structured-output-compatibility-release.mjs",
  "qualification/synthetic-executive/calibration/scripts/zero-metadata-real-route-authority.mjs",
  STRUCTURED_OUTPUT_RELEASE_PATH,
  "qualification/synthetic-executive/scripts/action-broker.mjs",
  "qualification/synthetic-executive/scripts/verify-readiness.mjs",
  "scripts/verify-release-version.mjs",
  "tests/milestone-2c1-canonical-customer-evidence.ps1",
  "tests/synthetic-executive-real-route-calibration.test.mjs",
  "tests/synthetic-executive-zero-metadata-real-route.test.mjs"
]);

export const STRUCTURED_OUTPUT_ARTIFACT_PATHS = Object.freeze(
  STRUCTURED_OUTPUT_COMMIT_PATHS.filter((relativePath) => relativePath !== STRUCTURED_OUTPUT_RELEASE_PATH)
);

const RELEASE_FIELDS = Object.freeze([
  "schemaVersion", "releaseType", "releaseState", "routeVersion", "startingTooling", "cognitiveSubject",
  "providerProfileHash", "calibrationPromptHash", "canonicalExecutiveActionSchemaHash",
  "transmittedSchemaExactHash", "transmittedSchemaStableHash", "completeSerializedRequestHash",
  "safeProviderDiagnosticsContractVersion", "safeProviderDiagnosticsContractHash", "terminalResultSchemaVersion",
  "priorConsumedArtifactHashes", "documentedStructuredOutputsSubset", "governance",
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

export function currentStructuredOutputArtifactHashes() {
  return STRUCTURED_OUTPUT_ARTIFACT_PATHS.map((relativePath) => ({
    relativePath,
    sha256: sha256Bytes(readFileSync(path.join(repositoryRoot, relativePath)))
  }));
}

export function validateStructuredOutputCompatibilityRelease(record, { validateCurrentArtifacts = true } = {}) {
  exactKeys(record, RELEASE_FIELDS, "structured-output compatibility release");
  assert.equal(record.schemaVersion, "1.0");
  assert.equal(record.releaseType, STRUCTURED_OUTPUT_RELEASE_TYPE);
  assert.equal(record.releaseState, "SEALED_SOURCE_PATCH");
  assert.equal(record.routeVersion, STRUCTURED_OUTPUT_ROUTE_VERSION);
  assert.deepEqual(record.startingTooling, { commit: STARTING_TOOLING_COMMIT, tree: STARTING_TOOLING_TREE });
  assert.deepEqual(record.cognitiveSubject, COGNITIVE_SUBJECT);
  assert.equal(record.providerProfileHash, "da38983bd5a6381b90379e4fa49142a9bb7dcc16941cf1246b479cb6a962cab1");
  assert.equal(record.calibrationPromptHash, "73dc7a21fa2db16c432b9630f3934ea87d78cd89b174b1739563b207a5a57e93");
  assert.equal(record.canonicalExecutiveActionSchemaHash, "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba");
  assert.equal(record.transmittedSchemaExactHash, EXPECTED_TRANSMITTED_SCHEMA_EXACT_HASH);
  assert.equal(record.transmittedSchemaStableHash, EXPECTED_TRANSMITTED_SCHEMA_STABLE_HASH);
  assert.equal(record.completeSerializedRequestHash, EXPECTED_COMPLETE_SERIALIZED_REQUEST_HASH);
  assert.equal(record.safeProviderDiagnosticsContractHash, EXPECTED_SAFE_PROVIDER_DIAGNOSTICS_CONTRACT_HASH);
  assert.equal(record.safeProviderDiagnosticsContractVersion, "1.1");
  assert.equal(record.terminalResultSchemaVersion, "1.2");
  assert.deepEqual(record.priorConsumedArtifactHashes, PRIOR_CONSUMED_ARTIFACT_HASHES);
  assert.deepEqual(record.documentedStructuredOutputsSubset, {
    source: "https://developers.openai.com/api/docs/guides/structured-outputs",
    rootMustBeObject: true, rootAnyOfPermitted: false, everyFieldRequired: true,
    everyObjectAdditionalPropertiesFalse: true, maximumObjectProperties: 5000,
    maximumNestingLevels: 10, maximumSchemaStringCharacters: 120000,
    maximumEnumValues: 1000, numericMinimumMaximumPermittedForNonFineTunedModels: true,
    prohibitedCompositionKeywords: ["allOf", "not", "dependentRequired", "dependentSchemas", "if", "then", "else"]
  });
  assert.deepEqual(record.governance, {
    exactModelId: "gpt-5.6-sol", endpointClass: "RESPONSES_API", inferenceEndpoint: "v1/responses",
    reasoningEffort: "medium", store: false, maximumMetadataAccessRequests: 0,
    maximumInferenceRequests: 1, maximumGovernedReasoningSteps: 1, maximumInferenceRetries: 0,
    maximumAgentToolCalls: 0, maximumEngineeringWorkerDispatches: 0, maximumSuccessors: 0,
    inputTokenCeiling: 8000, outputTokenCeiling: 2000, totalTokenCeiling: 10000,
    maximumWallClockDurationMs: 300000, maximumProviderCostUsd: 0.25, schemaProbeRequests: 0
  });
  assert.deepEqual(record.permittedCommitPaths, STRUCTURED_OUTPUT_COMMIT_PATHS);
  assert.deepEqual(record.artifactHashes.map(({ relativePath }) => relativePath), STRUCTURED_OUTPUT_ARTIFACT_PATHS);
  if (validateCurrentArtifacts) assert.deepEqual(record.artifactHashes, currentStructuredOutputArtifactHashes());
  assert.deepEqual(record.activityAssertions, {
    credentialAccessCount: 0, providerRequestCount: 0, modelCallCount: 0,
    metadataRequestCount: 0, inferenceRequestCount: 0, schemaProbeRequestCount: 0, authorityCreated: false,
    calibrationPerformed: false, qualificationPerformed: false, benchmarkExecuted: false,
    productHandlerInvoked: false, previewDeployed: false, productionDeployed: false
  });
  const core = structuredClone(record); delete core.recordHash;
  assert.equal(sha256Json(core), record.recordHash, "structured-output compatibility release hash differs");
  return Object.freeze({ valid: true, recordHash: record.recordHash });
}

export function loadStructuredOutputCompatibilityRelease(options = {}) {
  const record = readJson(STRUCTURED_OUTPUT_RELEASE_PATH);
  validateStructuredOutputCompatibilityRelease(record, options);
  return Object.freeze(record);
}

export function inspectSealedStructuredOutputCompatibilityRelease({ gitImpl = git, validateCurrentArtifacts = true } = {}) {
  const release = loadStructuredOutputCompatibilityRelease({ validateCurrentArtifacts });
  const head = gitImpl(["rev-parse", "HEAD"]);
  const tree = gitImpl(["rev-parse", "HEAD^{tree}"]);
  const parents = gitImpl(["rev-list", "--parents", "-n", "1", head]).split(/\s+/).slice(1);
  assert.deepEqual(parents, [STARTING_TOOLING_COMMIT], "compatibility patch must be the direct non-merge child of the starting tooling release");
  assert.equal(gitImpl(["rev-parse", `${STARTING_TOOLING_COMMIT}^{tree}`]), STARTING_TOOLING_TREE);
  assert.equal(gitImpl(["rev-parse", `${COGNITIVE_SUBJECT.commit}^{tree}`]), COGNITIVE_SUBJECT.tree);
  assert.equal(JSON.parse(gitImpl(["show", `${COGNITIVE_SUBJECT.commit}:package.json`])).version, COGNITIVE_SUBJECT.version);
  assert.equal(readJson("package.json").version, COGNITIVE_SUBJECT.version, "product Version must remain the cognitive subject Version");
  assert.equal(gitImpl(["branch", "--show-current"]), FEATURE_BRANCH);
  assert.equal(gitImpl(["status", "--porcelain=v1", "--untracked-files=no"]), "", "tracked tooling release must be clean");
  const changed = gitImpl(["diff", "--name-only", STARTING_TOOLING_COMMIT, head]).split(/\r?\n/).filter(Boolean);
  assert.deepEqual(changed, STRUCTURED_OUTPUT_COMMIT_PATHS, "structured-output compatibility patch paths differ");
  return Object.freeze({
    valid: true, release, releaseRecordHash: release.recordHash,
    parentCommit: STARTING_TOOLING_COMMIT, parentTree: STARTING_TOOLING_TREE,
    runtimeCommit: head, runtimeTree: tree
  });
}

async function main() {
  const inspected = inspectSealedStructuredOutputCompatibilityRelease();
  process.stdout.write(`${stableJson({
    status: "KATHERINE_STRUCTURED_OUTPUT_COMPATIBILITY_TOOLING_RELEASE_VERIFIED",
    routeVersion: STRUCTURED_OUTPUT_ROUTE_VERSION,
    cognitiveSubject: COGNITIVE_SUBJECT,
    runtimeCommit: inspected.runtimeCommit,
    runtimeTree: inspected.runtimeTree,
    releaseRecordHash: inspected.releaseRecordHash,
    transmittedSchemaExactHash: inspected.release.transmittedSchemaExactHash,
    transmittedSchemaStableHash: inspected.release.transmittedSchemaStableHash,
    completeSerializedRequestHash: inspected.release.completeSerializedRequestHash,
    safeProviderDiagnosticsContractHash: inspected.release.safeProviderDiagnosticsContractHash
  })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
