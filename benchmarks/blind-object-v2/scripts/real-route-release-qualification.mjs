import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Bytes, sha256Json } from "./protocol.mjs";

export const REAL_ROUTE_RELEASE_SCHEMA_VERSION = "4.0";
export const REAL_ROUTE_RELEASE_TYPE = "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_RELEASE";
export const REAL_ROUTE_RELEASE_PURPOSE = "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_ONLY";
export const REAL_ROUTE_RELEASE_VERSION = "1.12.26";
export const REAL_ROUTE_RELEASE_RELATIVE_PATH = "benchmarks/blind-object-v2/execution-release.json";
export const VERSION_1_12_25_RECORD_HASH = "68bc7fb245c39c44d8d56775faaf8e65d55ba500bb0b660878254fa08e477c1c";
export const VERSION_1_12_25_SEAL_COMMIT = "d3f6ab915f6e3644f5a2962dfceda4ae6d059385";
export const VERSION_1_12_25_SEAL_TREE = "1b5eed0618ca480aaf59e9266a875013bc734c08";
export const PRIOR_CALIBRATION_FAILURE_RESULT_HASH = "e9b331c756c9f85be7d0e1b3b195ee8cd491a406c4ab12335584659c9e6ac67d";
export const PRIOR_CALIBRATION_FAILURE_FILE_HASH = "98cf10227a55294799678f1950719cfb23ebf3e02ff9b1dfc15a52a671abfdb1";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..", "..");
const qualificationRoot = path.join(repositoryRoot, "qualification", "synthetic-executive");
const calibrationRoot = path.join(qualificationRoot, "calibration");
const releasePath = path.join(repositoryRoot, REAL_ROUTE_RELEASE_RELATIVE_PATH);
const HASH = /^[a-f0-9]{64}$/;
const GIT_OBJECT = /^[a-f0-9]{40}$/;

const FIELDS = Object.freeze([
  "schemaVersion", "releaseType", "releaseState", "executorRuntimeHead", "executorVersion", "executorRuntimeTreeHash",
  "qualificationPolicyVersion", "requiredQualificationRelationship", "permittedQualificationOverlay", "releasePurpose",
  "realRouteCalibrationAuthorized", "realRouteCalibrationPerformed", "blindQualificationAuthorized", "blindQualificationPerformed",
  "syntheticExecutiveQualified", "cognitiveBehaviorEvaluated", "memoryTransferEvaluated", "novelFailureJudgmentEvaluated",
  "cognitionClaimAuthorized", "autonomyClaimAuthorized", "benchmarkExecutionAuthorized", "productionExecutionAuthorized",
  "productMutationAuthorized", "mergeAuthorized", "previewDeploymentAuthorized", "productionDeploymentAuthorized",
  "readinessManifestHash", "futureQualificationPlanHash", "publicEpisodeManifestHash", "evaluatorControlAggregateHash",
  "consentExecutionProhibitionHash", "priorCalibrationFailureResultHash", "priorCalibrationFailureFileHash",
  "providerProfileHash", "calibrationAuthoritySchemaHash", "calibrationResultSchemaHash", "calibrationCaseHash",
  "calibrationPromptHash", "executiveActionSchemaHash", "billingAttestationHash", "previousExecutionReleaseRecordHash",
  "previousSealCommit", "previousSealTree", "immutableProduct", "phase7cFrozenAggregate", "authorityDeclarations", "recordHash"
]);

const FALSE_FIELDS = Object.freeze([
  "realRouteCalibrationPerformed", "blindQualificationAuthorized", "blindQualificationPerformed", "syntheticExecutiveQualified",
  "cognitiveBehaviorEvaluated", "memoryTransferEvaluated", "novelFailureJudgmentEvaluated", "cognitionClaimAuthorized",
  "autonomyClaimAuthorized", "benchmarkExecutionAuthorized", "productionExecutionAuthorized", "productMutationAuthorized",
  "mergeAuthorized", "previewDeploymentAuthorized", "productionDeploymentAuthorized"
]);

const AUTHORITY = Object.freeze({
  realRouteCalibrationEnabled: true, metadataModelAccessCheckEnabled: true, singleInferenceEnabled: true,
  twelveCaseQualificationEnabled: false, benchmarkConsentCreationEnabled: false, benchmarkExecutionEnabled: false,
  productHandlerInvocationEnabled: false, engineeringWorkerDispatchEnabled: false, productionExecutionEnabled: false,
  productMutationEnabled: false, lessonPromotionEnabled: false, mergeEnabled: false,
  previewDeploymentEnabled: false, productionDeploymentEnabled: false
});

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function readJson(filePath) { return JSON.parse(readFileSync(filePath, "utf8")); }
function git(args) { return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim(); }

function artifactBindings() {
  const readiness = readJson(path.join(qualificationRoot, "readiness-manifest.json"));
  const future = readJson(path.join(qualificationRoot, "future-qualification-plan.json"));
  const episodes = readJson(path.join(qualificationRoot, "episodes", "public-manifest.json"));
  const evaluator = readJson(path.join(qualificationRoot, "evaluator-control-aggregate.json"));
  const prohibition = readJson(path.join(qualificationRoot, "consent-execution-prohibition.json"));
  const profile = readJson(path.join(calibrationRoot, "provider-profile.json"));
  const calibrationCase = readJson(path.join(calibrationRoot, "calibration-case.json"));
  const attestation = readJson(path.join(calibrationRoot, "billing-attestation.json"));
  const promptBytes = readFileSync(path.join(calibrationRoot, "calibration-prompt.txt"));
  return {
    readinessManifestHash: readiness.readinessManifestHash,
    futureQualificationPlanHash: future.planHash,
    publicEpisodeManifestHash: episodes.manifestHash,
    evaluatorControlAggregateHash: evaluator.evaluatorControlAggregateHash,
    consentExecutionProhibitionHash: prohibition.prohibitionHash,
    providerProfileHash: profile.profileHash,
    calibrationAuthoritySchemaHash: sha256Bytes(readFileSync(path.join(calibrationRoot, "schemas", "real-route-calibration-authority.schema.json"))),
    calibrationResultSchemaHash: sha256Bytes(readFileSync(path.join(calibrationRoot, "schemas", "calibration-result.schema.json"))),
    calibrationCaseHash: calibrationCase.caseHash,
    calibrationPromptHash: sha256Bytes(promptBytes),
    executiveActionSchemaHash: sha256Bytes(readFileSync(path.join(qualificationRoot, "schemas", "executive-action.schema.json"))),
    billingAttestationHash: attestation.statementHash,
    immutableProduct: readiness.immutableProduct,
    phase7cFrozenAggregate: readiness.phase7cFrozenAggregate
  };
}

function validateCore(core) {
  exactKeys(core, FIELDS.filter((field) => field !== "recordHash"), "real-route calibration release core");
  assert.equal(core.schemaVersion, REAL_ROUTE_RELEASE_SCHEMA_VERSION);
  assert.equal(core.releaseType, REAL_ROUTE_RELEASE_TYPE);
  assert.ok(["PENDING_QUALIFICATION_SEAL", "QUALIFIED", "INVALID"].includes(core.releaseState));
  assert.equal(core.executorVersion, REAL_ROUTE_RELEASE_VERSION);
  assert.equal(core.qualificationPolicyVersion, "1.0");
  assert.equal(core.requiredQualificationRelationship, "DIRECT_PARENT_ONE_FILE_SEAL");
  assert.deepEqual(core.permittedQualificationOverlay, [REAL_ROUTE_RELEASE_RELATIVE_PATH]);
  assert.equal(core.releasePurpose, REAL_ROUTE_RELEASE_PURPOSE);
  assert.equal(core.realRouteCalibrationAuthorized, true);
  for (const field of FALSE_FIELDS) assert.equal(core[field], false, `${field} must remain false`);
  const expected = artifactBindings();
  for (const [field, value] of Object.entries(expected)) assert.deepEqual(core[field], value, `${field} differs from calibration artifact`);
  assert.equal(core.priorCalibrationFailureResultHash, PRIOR_CALIBRATION_FAILURE_RESULT_HASH);
  assert.equal(core.priorCalibrationFailureFileHash, PRIOR_CALIBRATION_FAILURE_FILE_HASH);
  assert.equal(core.previousExecutionReleaseRecordHash, VERSION_1_12_25_RECORD_HASH);
  assert.equal(core.previousSealCommit, VERSION_1_12_25_SEAL_COMMIT);
  assert.equal(core.previousSealTree, VERSION_1_12_25_SEAL_TREE);
  assert.deepEqual(core.immutableProduct, { commit: "7056eb0601dc69c5985703fea6fe665e82c6bed8", version: "1.12.13", runtimeManifestHash: "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8", trackedEntryCount: 666 });
  assert.equal(core.phase7cFrozenAggregate, "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699");
  exactKeys(core.authorityDeclarations, Object.keys(AUTHORITY), "real-route authority declarations");
  assert.deepEqual(core.authorityDeclarations, AUTHORITY);
  if (core.releaseState === "PENDING_QUALIFICATION_SEAL") { assert.equal(core.executorRuntimeHead, null); assert.equal(core.executorRuntimeTreeHash, null); }
  if (core.releaseState === "QUALIFIED") { assert.match(core.executorRuntimeHead || "", GIT_OBJECT); assert.match(core.executorRuntimeTreeHash || "", GIT_OBJECT); }
  for (const field of FIELDS.filter((field) => field.endsWith("Hash") && field !== "recordHash" && field !== "executorRuntimeTreeHash")) assert.match(core[field] || "", HASH, `${field} is invalid`);
  return core;
}

export function createRealRouteReleaseRecord(core) {
  validateCore(core);
  return Object.freeze({ ...structuredClone(core), recordHash: sha256Json(core) });
}

export function validateRealRouteReleaseRecord(record) {
  exactKeys(record, FIELDS, "real-route calibration release record");
  const core = structuredClone(record); delete core.recordHash; validateCore(core);
  assert.match(record.recordHash || "", HASH); assert.equal(sha256Json(core), record.recordHash, "real-route release record hash differs");
  return Object.freeze({ valid: true, recordHash: record.recordHash, releaseState: record.releaseState });
}

export function isRealRouteCalibrationRelease(record) {
  return record?.schemaVersion === REAL_ROUTE_RELEASE_SCHEMA_VERSION && record?.releaseType === REAL_ROUTE_RELEASE_TYPE;
}

export function realRouteReleaseCoreFromArtifacts({ executorRuntimeHead = null, executorRuntimeTreeHash = null, releaseState = "PENDING_QUALIFICATION_SEAL" } = {}) {
  const bindings = artifactBindings();
  return {
    schemaVersion: REAL_ROUTE_RELEASE_SCHEMA_VERSION, releaseType: REAL_ROUTE_RELEASE_TYPE, releaseState,
    executorRuntimeHead, executorVersion: REAL_ROUTE_RELEASE_VERSION, executorRuntimeTreeHash,
    qualificationPolicyVersion: "1.0", requiredQualificationRelationship: "DIRECT_PARENT_ONE_FILE_SEAL",
    permittedQualificationOverlay: [REAL_ROUTE_RELEASE_RELATIVE_PATH], releasePurpose: REAL_ROUTE_RELEASE_PURPOSE,
    realRouteCalibrationAuthorized: true, realRouteCalibrationPerformed: false, blindQualificationAuthorized: false,
    blindQualificationPerformed: false, syntheticExecutiveQualified: false, cognitiveBehaviorEvaluated: false,
    memoryTransferEvaluated: false, novelFailureJudgmentEvaluated: false, cognitionClaimAuthorized: false,
    autonomyClaimAuthorized: false, benchmarkExecutionAuthorized: false, productionExecutionAuthorized: false,
    productMutationAuthorized: false, mergeAuthorized: false, previewDeploymentAuthorized: false, productionDeploymentAuthorized: false,
    ...bindings, priorCalibrationFailureResultHash: PRIOR_CALIBRATION_FAILURE_RESULT_HASH,
    priorCalibrationFailureFileHash: PRIOR_CALIBRATION_FAILURE_FILE_HASH,
    previousExecutionReleaseRecordHash: VERSION_1_12_25_RECORD_HASH,
    previousSealCommit: VERSION_1_12_25_SEAL_COMMIT, previousSealTree: VERSION_1_12_25_SEAL_TREE,
    authorityDeclarations: AUTHORITY
  };
}

export function inspectQualifiedRealRouteRelease() {
  const record = readJson(releasePath); validateRealRouteReleaseRecord(record); assert.equal(record.releaseState, "QUALIFIED");
  const head = git(["rev-parse", "HEAD"]); const parents = git(["rev-list", "--parents", "-n", "1", head]).split(/\s+/).slice(1);
  assert.deepEqual(parents, [record.executorRuntimeHead], "real-route seal must be a direct non-merge child");
  assert.equal(git(["rev-parse", `${record.executorRuntimeHead}^{tree}`]), record.executorRuntimeTreeHash);
  assert.equal(JSON.parse(git(["show", `${record.executorRuntimeHead}:package.json`])).version, REAL_ROUTE_RELEASE_VERSION);
  assert.equal(JSON.parse(readFileSync(path.join(repositoryRoot, "package.json"), "utf8")).version, REAL_ROUTE_RELEASE_VERSION);
  assert.deepEqual(git(["diff", "--name-only", record.executorRuntimeHead, head]).split(/\r?\n/).filter(Boolean), [REAL_ROUTE_RELEASE_RELATIVE_PATH]);
  assert.equal(git(["status", "--porcelain=v1", "--untracked-files=no"]), "");
  assert.equal(realpathSync(git(["rev-parse", "--show-toplevel"])).toLowerCase(), realpathSync(repositoryRoot).toLowerCase());
  return Object.freeze({ valid: true, runtimeCommit: record.executorRuntimeHead, runtimeTree: record.executorRuntimeTreeHash, sealCommit: head, sealTree: git(["rev-parse", `${head}^{tree}`]), releaseRecordHash: record.recordHash, release: record });
}
