import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { sha256Json } from "./protocol.mjs";
import { benchmarkRoot, repositoryRoot } from "./execution-store.mjs";
import { createProductCostSourceManifest } from "./product-cost-source.mjs";
import {
  UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH,
  VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH,
  VERSION_1_12_21_TERMINAL_FAILURE_RECEIPT_HASH,
  VERSION_1_12_21_ZERO_EXTERNAL_SUPERSESSION_RECEIPT_HASH,
  VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH
} from "./consent-revocation.mjs";
import { VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH, VERSION_1_12_23_FAILURE_EVIDENCE_HASH } from "./version1123-failure-evidence.mjs";
import { PUBLIC_IDENTIFIER_CONTRACT_MANIFEST } from "./public-identifier-contract-manifest.mjs";
import { COGNITIVE_LIFECYCLE_INVARIANT_CATALOG } from "./cognitive-lifecycle-invariants.mjs";
import { COGNITIVE_LIFECYCLE_GOVERNOR_VERSION } from "./cognitive-lifecycle-governor.mjs";
import { QUARANTINE_ENCRYPTION } from "./handler-return-quarantine.mjs";
import { isReadinessRelease, validateReadinessReleaseRecord } from "./readiness-release-qualification.mjs";

export const EXECUTION_RELEASE_SCHEMA_VERSION = "2.5";
export const EXECUTION_RELEASE_TYPE = "BENCHMARK_EXECUTOR_RELEASE";
export const QUALIFICATION_POLICY_VERSION = "1.0";
export const QUALIFICATION_RELATIONSHIP = "DIRECT_PARENT_ONE_FILE_SEAL";
export const EXECUTION_RELEASE_RELATIVE_PATH = "benchmarks/blind-object-v2/execution-release.json";
export const EXECUTION_RELEASE_PATH = path.join(benchmarkRoot, "execution-release.json");
export const EXECUTION_RELEASE_STATE = Object.freeze({
  PENDING: "PENDING_QUALIFICATION_SEAL",
  QUALIFIED: "QUALIFIED",
  INVALID: "INVALID"
});

const HASH = /^[a-f0-9]{64}$/;
const GIT_OBJECT = /^[a-f0-9]{40}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const RELEASE_FIELDS = Object.freeze([
  "schemaVersion",
  "releaseType",
  "releaseState",
  "executorRuntimeHead",
  "executorVersion",
  "executorRuntimeTreeHash",
  "qualificationPolicyVersion",
  "requiredQualificationRelationship",
  "permittedQualificationOverlay",
  "productSourceHead",
  "productSourceVersion",
  "productCostSourceManifestHash",
  "preExternalFailureAuthorityHash",
  "postHandlerFailureAuthorityHash",
  "historicalExecutionReleaseRecordHash",
  "predecessorExecutionReleaseRecordHash",
  "version1122ExecutionReleaseRecordHash",
  "version1123FailureEvidenceHash",
  "publicIdentifierContractManifestHash",
  "lifecycleInvariantCatalogHash",
  "cognitiveLifecycleGovernorVersion",
  "handlerReturnQuarantineEncryption",
  "unusedConsentAuthorityHash",
  "historicalZeroExternalSupersessionReceiptHash",
  "historicalTerminalFailureReceiptHash",
  "benchmarkContractIdentity",
  "handler",
  "completePhysicalAttemptCeiling",
  "launchScopeSchemaVersion",
  "costEnvelopeSchemaVersion",
  "maximumAuthorizedCostMinorUnits",
  "authorityDeclarations",
  "recordHash"
]);
const CONTRACT_FIELDS = Object.freeze([
  "benchmarkId",
  "completeFrozenAggregateHash",
  "freezeManifestHash",
  "requestAggregateHash"
]);
const AUTHORITY_FIELDS = Object.freeze([
  "consentCreationEnabled",
  "executionEnabled",
  "preExternalReconciliationEnabled",
  "zeroExternalSupersessionEnabled",
  "postHandlerReconciliationEnabled",
  "unusedConsentRevocationEnabled",
  "continuationExecutionEnabled",
  "realExecutionAuthorized",
  "privateControlsAuthorized",
  "scoringAuthorized",
  "reflectionAuthorized",
  "repairAuthorized",
  "deploymentAuthorized"
]);
const AUTHORITY_EXPECTATIONS = Object.freeze({
  consentCreationEnabled: true,
  executionEnabled: true,
  preExternalReconciliationEnabled: false,
  zeroExternalSupersessionEnabled: false,
  postHandlerReconciliationEnabled: false,
  unusedConsentRevocationEnabled: false,
  continuationExecutionEnabled: true,
  realExecutionAuthorized: false,
  privateControlsAuthorized: false,
  scoringAuthorized: false,
  reflectionAuthorized: false,
  repairAuthorized: false,
  deploymentAuthorized: false
});
const SNAPSHOT_FIELDS = Object.freeze([
  "repositoryRoot",
  "expectedRepositoryRoot",
  "branch",
  "trackedStatus",
  "conflictedPaths",
  "qualificationHead",
  "qualificationParents",
  "runtimeObjectType",
  "runtimeTreeHash",
  "runtimeVersion",
  "qualificationVersion",
  "sealDiffStatus",
  "sealDiffPaths"
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function git(args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
}

function lines(value) {
  return String(value || "").split(/\r?\n/).filter(Boolean);
}

function parsePackageVersion(text, label) {
  const version = JSON.parse(text).version;
  assert.match(version || "", VERSION, `${label} Version is invalid`);
  return version;
}

function validateReleaseCore(core) {
  exactKeys(core, RELEASE_FIELDS.filter((field) => field !== "recordHash"), "execution release core");
  assert.equal(core.schemaVersion, EXECUTION_RELEASE_SCHEMA_VERSION);
  assert.equal(core.releaseType, EXECUTION_RELEASE_TYPE);
  assert.ok(Object.values(EXECUTION_RELEASE_STATE).includes(core.releaseState), "execution release state is invalid");
  assert.match(core.executorVersion || "", VERSION);
  assert.equal(core.qualificationPolicyVersion, QUALIFICATION_POLICY_VERSION);
  assert.equal(core.requiredQualificationRelationship, QUALIFICATION_RELATIONSHIP);
  assert.deepEqual(core.permittedQualificationOverlay, [EXECUTION_RELEASE_RELATIVE_PATH]);
  assert.match(core.productSourceHead || "", GIT_OBJECT);
  assert.match(core.productSourceVersion || "", VERSION);
  assert.equal(core.productCostSourceManifestHash, createProductCostSourceManifest().manifestHash, "execution release Product Cost-Source Manifest differs");
  assert.equal(core.preExternalFailureAuthorityHash, "084cea4676da753ce48a177472c36043f216802c9c97b9cc3a188b8abc17885d", "execution release pre-external failure authority differs");
  assert.equal(core.postHandlerFailureAuthorityHash, "915089ed141f32dd38530df9ee1bd89288aa7bb4a2e5b2abe8cf4f96a24202b7", "execution release post-handler failure authority differs");
  assert.equal(core.historicalExecutionReleaseRecordHash, VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH, "execution release historical Version 1.12.21 authority differs");
  assert.equal(core.predecessorExecutionReleaseRecordHash, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH, "execution release immediate predecessor Version 1.12.23 authority differs");
  assert.equal(core.version1122ExecutionReleaseRecordHash, VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH, "execution release Version 1.12.22 chain authority differs");
  assert.equal(core.version1123FailureEvidenceHash, VERSION_1_12_23_FAILURE_EVIDENCE_HASH, "execution release Version 1.12.23 failure evidence differs");
  assert.equal(core.publicIdentifierContractManifestHash, PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.manifestHash);
  assert.equal(core.lifecycleInvariantCatalogHash, COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.catalogHash);
  assert.equal(core.cognitiveLifecycleGovernorVersion, COGNITIVE_LIFECYCLE_GOVERNOR_VERSION);
  assert.equal(core.handlerReturnQuarantineEncryption, QUARANTINE_ENCRYPTION);
  assert.equal(core.unusedConsentAuthorityHash, UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH, "execution release unused Version 1.12.22 consent authority differs");
  assert.equal(core.historicalZeroExternalSupersessionReceiptHash, VERSION_1_12_21_ZERO_EXTERNAL_SUPERSESSION_RECEIPT_HASH, "execution release historical supersession receipt differs");
  assert.equal(core.historicalTerminalFailureReceiptHash, VERSION_1_12_21_TERMINAL_FAILURE_RECEIPT_HASH, "execution release historical terminal-failure receipt differs");
  exactKeys(core.benchmarkContractIdentity, CONTRACT_FIELDS, "benchmark contract identity");
  assert.equal(core.benchmarkContractIdentity.benchmarkId, "blind-object-v2");
  for (const field of CONTRACT_FIELDS.filter((field) => field !== "benchmarkId")) {
    assert.match(core.benchmarkContractIdentity[field] || "", HASH, `benchmark contract ${field} is invalid`);
  }
  assert.equal(core.handler, "api/generate-listing.js#createGenerateListingHandler");
  assert.equal(core.completePhysicalAttemptCeiling, 832);
  assert.equal(core.launchScopeSchemaVersion, "2.5");
  assert.equal(core.costEnvelopeSchemaVersion, "1.1");
  assert.equal(core.maximumAuthorizedCostMinorUnits, 4000);
  exactKeys(core.authorityDeclarations, AUTHORITY_FIELDS, "execution release authority declarations");
  for (const field of AUTHORITY_FIELDS) {
    assert.equal(core.authorityDeclarations[field], AUTHORITY_EXPECTATIONS[field], `${field} differs from the bounded Version 1.12.24 authority`);
  }

  if (core.releaseState === EXECUTION_RELEASE_STATE.PENDING) {
    assert.equal(core.executorRuntimeHead, null, "pending release cannot predeclare its own runtime commit");
    assert.equal(core.executorRuntimeTreeHash, null, "pending release cannot predeclare its own runtime tree");
  } else if (core.releaseState === EXECUTION_RELEASE_STATE.QUALIFIED) {
    assert.match(core.executorRuntimeHead || "", GIT_OBJECT, "qualified executor runtime head is invalid");
    assert.match(core.executorRuntimeTreeHash || "", GIT_OBJECT, "qualified executor runtime tree hash is invalid");
  } else {
    assert.ok(core.executorRuntimeHead === null || GIT_OBJECT.test(core.executorRuntimeHead), "invalid release runtime head is malformed");
    assert.ok(core.executorRuntimeTreeHash === null || GIT_OBJECT.test(core.executorRuntimeTreeHash), "invalid release runtime tree is malformed");
  }
  return core;
}

export function createExecutionReleaseRecord(core) {
  validateReleaseCore(core);
  return Object.freeze({ ...structuredClone(core), recordHash: sha256Json(core) });
}

export function validateExecutionReleaseRecord(record) {
  exactKeys(record, RELEASE_FIELDS, "execution release record");
  const core = structuredClone(record);
  delete core.recordHash;
  validateReleaseCore(core);
  assert.match(record.recordHash || "", HASH, "execution release record hash is invalid");
  assert.equal(sha256Json(core), record.recordHash, "execution release record hash mismatch");
  return Object.freeze({ valid: true, recordHash: record.recordHash, releaseState: record.releaseState });
}

export function assertQualifiedReleaseState(record, commandMode) {
  if (isReadinessRelease(record)) {
    validateReadinessReleaseRecord(record);
    assert.fail(`${commandMode} is prohibited by the synthetic-executive qualification-readiness-only release`);
  }
  assert.ok(["REVOKE_V11222_CONSENT", "QUALIFY_OFFLINE", "PREFLIGHT", "CREATE_CONSENT", "EXECUTE", "READBACK", "RECONCILE_V11221"].includes(commandMode), "release command mode is invalid");
  validateExecutionReleaseRecord(record);
  assert.equal(record.releaseState, EXECUTION_RELEASE_STATE.QUALIFIED, `${commandMode} requires a QUALIFIED executor release`);
  return true;
}

export function validateQualificationSnapshot(snapshot, qualifiedRecord, pendingRecord) {
  exactKeys(snapshot, SNAPSHOT_FIELDS, "qualification snapshot");
  validateExecutionReleaseRecord(qualifiedRecord);
  validateExecutionReleaseRecord(pendingRecord);
  assert.equal(qualifiedRecord.releaseState, EXECUTION_RELEASE_STATE.QUALIFIED, "current release record is not qualified");
  assert.equal(pendingRecord.releaseState, EXECUTION_RELEASE_STATE.PENDING, "executor runtime commit was not pending qualification");
  assert.equal(samePath(snapshot.repositoryRoot, snapshot.expectedRepositoryRoot), true, "qualification ran in the wrong repository");
  assert.equal(snapshot.branch, "refactor/beta-evidence-pipeline", "qualified execution requires the release branch");
  assert.equal(snapshot.trackedStatus, "", "qualified execution requires a clean tracked tree and index");
  assert.deepEqual(snapshot.conflictedPaths, [], "qualified execution rejects conflicted paths");
  assert.match(snapshot.qualificationHead || "", GIT_OBJECT, "qualification head is invalid");
  assert.deepEqual(snapshot.qualificationParents, [qualifiedRecord.executorRuntimeHead], "qualification head must be the direct non-merge child of the executor runtime head");
  assert.equal(snapshot.runtimeObjectType, "commit", "executor runtime head is not a commit");
  assert.equal(snapshot.runtimeTreeHash, qualifiedRecord.executorRuntimeTreeHash, "executor runtime tree identity differs");
  assert.equal(snapshot.runtimeVersion, qualifiedRecord.executorVersion, "executor runtime Version differs");
  assert.equal(snapshot.qualificationVersion, qualifiedRecord.executorVersion, "qualification Version differs");
  assert.equal(qualifiedRecord.executorRuntimeHead, snapshot.qualificationParents[0], "release record runtime head differs from qualification parent");
  assert.equal(pendingRecord.executorVersion, qualifiedRecord.executorVersion, "pending and qualified executor Versions differ");
  assert.equal(pendingRecord.recordHash === qualifiedRecord.recordHash, false, "qualification seal did not change the release record");
  assert.deepEqual(snapshot.sealDiffPaths, [EXECUTION_RELEASE_RELATIVE_PATH], "qualification overlay must contain only execution-release.json");
  assert.deepEqual(snapshot.sealDiffStatus, [`M\t${EXECUTION_RELEASE_RELATIVE_PATH}`], "qualification seal must modify exactly the existing execution-release record");
  return Object.freeze({
    valid: true,
    executorRuntimeHead: qualifiedRecord.executorRuntimeHead,
    qualificationHead: snapshot.qualificationHead,
    executorRuntimeTreeHash: qualifiedRecord.executorRuntimeTreeHash,
    executionReleaseRecordHash: qualifiedRecord.recordHash,
    productCostSourceManifestHash: qualifiedRecord.productCostSourceManifestHash,
    qualificationPolicyVersion: qualifiedRecord.qualificationPolicyVersion,
    executorVersion: qualifiedRecord.executorVersion,
    release: qualifiedRecord
  });
}

function readRecordAtCommit(commit) {
  return JSON.parse(git(["show", `${commit}:${EXECUTION_RELEASE_RELATIVE_PATH}`]));
}

export function inspectQualifiedRepositoryRelease(commandMode) {
  const qualifiedRecord = JSON.parse(readFileSync(EXECUTION_RELEASE_PATH, "utf8"));
  assertQualifiedReleaseState(qualifiedRecord, commandMode);
  const qualificationHead = git(["rev-parse", "HEAD"]);
  const qualificationParents = git(["rev-list", "--parents", "-n", "1", qualificationHead]).split(/\s+/).slice(1);
  const runtimeHead = qualifiedRecord.executorRuntimeHead;
  const pendingRecord = readRecordAtCommit(runtimeHead);
  const snapshot = {
    repositoryRoot: realpathSync(git(["rev-parse", "--show-toplevel"])),
    expectedRepositoryRoot: realpathSync(repositoryRoot),
    branch: git(["branch", "--show-current"]),
    trackedStatus: git(["status", "--porcelain=v1", "--untracked-files=no"]),
    conflictedPaths: lines(git(["diff", "--name-only", "--diff-filter=U"])),
    qualificationHead,
    qualificationParents,
    runtimeObjectType: git(["cat-file", "-t", runtimeHead]),
    runtimeTreeHash: git(["rev-parse", `${runtimeHead}^{tree}`]),
    runtimeVersion: parsePackageVersion(git(["show", `${runtimeHead}:package.json`]), "executor runtime"),
    qualificationVersion: parsePackageVersion(readFileSync(path.join(repositoryRoot, "package.json"), "utf8"), "qualification"),
    sealDiffStatus: lines(git(["diff", "--name-status", runtimeHead, qualificationHead])),
    sealDiffPaths: lines(git(["diff", "--name-only", runtimeHead, qualificationHead]))
  };
  return validateQualificationSnapshot(snapshot, qualifiedRecord, pendingRecord);
}
