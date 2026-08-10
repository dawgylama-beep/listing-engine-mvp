import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Json } from "./protocol.mjs";

export const READINESS_RELEASE_SCHEMA_VERSION = "3.0";
export const READINESS_RELEASE_TYPE = "SYNTHETIC_EXECUTIVE_QUALIFICATION_READINESS_RELEASE";
export const READINESS_RELEASE_PURPOSE = "SYNTHETIC_EXECUTIVE_QUALIFICATION_READINESS_ONLY";
export const READINESS_RELEASE_VERSION = "1.12.25";
export const READINESS_RELEASE_RELATIVE_PATH = "benchmarks/blind-object-v2/execution-release.json";
export const PREVIOUS_EXECUTION_RELEASE_RECORD_HASH = "1de044262cdde4b31a10e23ba5947589c1c76c771eb66f7ea70e9cc27b045bfd";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..", "..");
const qualificationRoot = path.join(repositoryRoot, "qualification", "synthetic-executive");
const releasePath = path.join(repositoryRoot, READINESS_RELEASE_RELATIVE_PATH);
const HASH = /^[a-f0-9]{64}$/;
const GIT_OBJECT = /^[a-f0-9]{40}$/;

const FIELDS = Object.freeze([
  "schemaVersion", "releaseType", "releaseState", "executorRuntimeHead", "executorVersion", "executorRuntimeTreeHash",
  "qualificationPolicyVersion", "requiredQualificationRelationship", "permittedQualificationOverlay", "releasePurpose",
  "aiQualificationPerformed", "productionExecutionAuthorized", "syntheticExecutiveQualified", "cognitionClaimAuthorized", "autonomyClaimAuthorized",
  "readinessManifestHash", "canonicalRoleRegistryHash", "architectureManifestHash", "trustBoundaryDiagramHash",
  "publicEpisodeManifestHash", "evaluatorControlAggregateHash", "budgetProfileHash", "costGovernorProofHash",
  "deterministicHarnessProofHash", "consentExecutionProhibitionHash", "futureQualificationPlanHash",
  "previousExecutionReleaseRecordHash", "immutableProduct", "phase7cFrozenAggregate", "authorityDeclarations", "recordHash"
]);

const AUTHORITY = Object.freeze({
  benchmarkConsentCreationEnabled: false, benchmarkExecutionEnabled: false, modelQualificationEnabled: false,
  providerActivityEnabled: false, productHandlerInvocationEnabled: false, productionExecutionEnabled: false,
  repairEnabled: false, mergeEnabled: false, previewDeploymentEnabled: false, productionDeploymentEnabled: false
});

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.join(qualificationRoot, relativePath), "utf8"));
}

function validateCore(core) {
  exactKeys(core, FIELDS.filter((field) => field !== "recordHash"), "readiness release core");
  assert.equal(core.schemaVersion, READINESS_RELEASE_SCHEMA_VERSION);
  assert.equal(core.releaseType, READINESS_RELEASE_TYPE);
  assert.ok(["PENDING_QUALIFICATION_SEAL", "QUALIFIED", "INVALID"].includes(core.releaseState));
  assert.equal(core.executorVersion, READINESS_RELEASE_VERSION);
  assert.equal(core.qualificationPolicyVersion, "1.0");
  assert.equal(core.requiredQualificationRelationship, "DIRECT_PARENT_ONE_FILE_SEAL");
  assert.deepEqual(core.permittedQualificationOverlay, [READINESS_RELEASE_RELATIVE_PATH]);
  assert.equal(core.releasePurpose, READINESS_RELEASE_PURPOSE);
  for (const field of ["aiQualificationPerformed", "productionExecutionAuthorized", "syntheticExecutiveQualified", "cognitionClaimAuthorized", "autonomyClaimAuthorized"]) assert.equal(core[field], false, `${field} must remain false`);
  const readiness = readJson("readiness-manifest.json");
  const roleRegistry = readJson("canonical-role-registry.json");
  const architecture = readJson("synthetic-executive-architecture.json");
  const trustBoundary = readJson("trust-boundary.json");
  const episodes = readJson("episodes/public-manifest.json");
  const evaluator = readJson("evaluator-control-aggregate.json");
  const budget = readJson("qualification-budget-profile.json");
  const costProof = readJson("proofs/cost-governor-proof.json");
  const harnessProof = readJson("proofs/deterministic-harness-proof.json");
  const prohibition = readJson("consent-execution-prohibition.json");
  const futurePlan = readJson("future-qualification-plan.json");
  const bindings = {
    readinessManifestHash: readiness.readinessManifestHash, canonicalRoleRegistryHash: roleRegistry.registryHash,
    architectureManifestHash: architecture.manifestHash, trustBoundaryDiagramHash: trustBoundary.diagramHash,
    publicEpisodeManifestHash: episodes.manifestHash, evaluatorControlAggregateHash: evaluator.evaluatorControlAggregateHash,
    budgetProfileHash: budget.profileHash, costGovernorProofHash: costProof.proofHash,
    deterministicHarnessProofHash: harnessProof.proofHash, consentExecutionProhibitionHash: prohibition.prohibitionHash,
    futureQualificationPlanHash: futurePlan.planHash
  };
  for (const [field, value] of Object.entries(bindings)) { assert.match(core[field] || "", HASH); assert.equal(core[field], value, `${field} differs from readiness artifact`); }
  assert.equal(readiness.status, "KATHERINE_SYNTHETIC_EXECUTIVE_QUALIFICATION_READY");
  assert.equal(readiness.aiQualificationPerformed, false); assert.equal(readiness.syntheticExecutiveQualified, false);
  assert.equal(core.previousExecutionReleaseRecordHash, PREVIOUS_EXECUTION_RELEASE_RECORD_HASH);
  exactKeys(core.immutableProduct, ["commit", "version", "runtimeManifestHash", "trackedEntryCount"], "immutable product identity");
  assert.deepEqual(core.immutableProduct, { commit: "7056eb0601dc69c5985703fea6fe665e82c6bed8", version: "1.12.13", runtimeManifestHash: "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8", trackedEntryCount: 666 });
  assert.equal(core.phase7cFrozenAggregate, "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699");
  exactKeys(core.authorityDeclarations, Object.keys(AUTHORITY), "readiness release authority declarations");
  assert.deepEqual(core.authorityDeclarations, AUTHORITY);
  if (core.releaseState === "PENDING_QUALIFICATION_SEAL") { assert.equal(core.executorRuntimeHead, null); assert.equal(core.executorRuntimeTreeHash, null); }
  if (core.releaseState === "QUALIFIED") { assert.match(core.executorRuntimeHead || "", GIT_OBJECT); assert.match(core.executorRuntimeTreeHash || "", GIT_OBJECT); }
  return core;
}

export function createReadinessReleaseRecord(core) {
  validateCore(core);
  return Object.freeze({ ...structuredClone(core), recordHash: sha256Json(core) });
}

export function validateReadinessReleaseRecord(record) {
  exactKeys(record, FIELDS, "readiness release record");
  const core = structuredClone(record); delete core.recordHash; validateCore(core);
  assert.match(record.recordHash || "", HASH); assert.equal(sha256Json(core), record.recordHash);
  return Object.freeze({ valid: true, recordHash: record.recordHash, releaseState: record.releaseState });
}

export function isReadinessRelease(record) {
  return record?.schemaVersion === READINESS_RELEASE_SCHEMA_VERSION && record?.releaseType === READINESS_RELEASE_TYPE;
}

function git(args) { return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim(); }

export function inspectQualifiedReadinessRelease() {
  const record = JSON.parse(readFileSync(releasePath, "utf8")); validateReadinessReleaseRecord(record);
  assert.equal(record.releaseState, "QUALIFIED");
  const head = git(["rev-parse", "HEAD"]); const parents = git(["rev-list", "--parents", "-n", "1", head]).split(/\s+/).slice(1);
  assert.deepEqual(parents, [record.executorRuntimeHead], "readiness seal must be a direct non-merge child");
  assert.equal(git(["rev-parse", `${record.executorRuntimeHead}^{tree}`]), record.executorRuntimeTreeHash);
  assert.equal(JSON.parse(git(["show", `${record.executorRuntimeHead}:package.json`])).version, READINESS_RELEASE_VERSION);
  assert.equal(JSON.parse(readFileSync(path.join(repositoryRoot, "package.json"), "utf8")).version, READINESS_RELEASE_VERSION);
  assert.deepEqual(git(["diff", "--name-only", record.executorRuntimeHead, head]).split(/\r?\n/).filter(Boolean), [READINESS_RELEASE_RELATIVE_PATH]);
  assert.equal(git(["status", "--porcelain=v1", "--untracked-files=no"]), "");
  assert.equal(realpathSync(git(["rev-parse", "--show-toplevel"])).toLowerCase(), realpathSync(repositoryRoot).toLowerCase());
  return Object.freeze({ valid: true, executorRuntimeHead: record.executorRuntimeHead, qualificationHead: head, executorRuntimeTreeHash: record.executorRuntimeTreeHash, executionReleaseRecordHash: record.recordHash, executorVersion: record.executorVersion, release: record });
}

export function readinessReleaseCoreFromArtifacts({ executorRuntimeHead = null, executorRuntimeTreeHash = null, releaseState = "PENDING_QUALIFICATION_SEAL" } = {}) {
  const readiness = readJson("readiness-manifest.json");
  return {
    schemaVersion: READINESS_RELEASE_SCHEMA_VERSION, releaseType: READINESS_RELEASE_TYPE, releaseState,
    executorRuntimeHead, executorVersion: READINESS_RELEASE_VERSION, executorRuntimeTreeHash,
    qualificationPolicyVersion: "1.0", requiredQualificationRelationship: "DIRECT_PARENT_ONE_FILE_SEAL", permittedQualificationOverlay: [READINESS_RELEASE_RELATIVE_PATH],
    releasePurpose: READINESS_RELEASE_PURPOSE, aiQualificationPerformed: false, productionExecutionAuthorized: false,
    syntheticExecutiveQualified: false, cognitionClaimAuthorized: false, autonomyClaimAuthorized: false,
    readinessManifestHash: readiness.readinessManifestHash, canonicalRoleRegistryHash: readiness.canonicalRoleRegistryHash,
    architectureManifestHash: readiness.architectureManifestHash, trustBoundaryDiagramHash: readiness.trustBoundaryDiagramHash,
    publicEpisodeManifestHash: readiness.publicEpisodeManifestHash, evaluatorControlAggregateHash: readiness.evaluatorControlAggregateHash,
    budgetProfileHash: readiness.budgetProfileHash, costGovernorProofHash: readiness.costGovernorProofHash,
    deterministicHarnessProofHash: readiness.deterministicHarnessProofHash, consentExecutionProhibitionHash: readiness.consentExecutionProhibitionHash,
    futureQualificationPlanHash: readiness.futureQualificationPlanHash, previousExecutionReleaseRecordHash: PREVIOUS_EXECUTION_RELEASE_RECORD_HASH,
    immutableProduct: readiness.immutableProduct, phase7cFrozenAggregate: readiness.phase7cFrozenAggregate, authorityDeclarations: AUTHORITY
  };
}
