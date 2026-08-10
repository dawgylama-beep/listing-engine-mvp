import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { inspectQualifiedRealRouteRelease } from "../../../../benchmarks/blind-object-v2/scripts/real-route-release-qualification.mjs";
import { assertHash, canonicalIso, exactKeys, seal, sha256Bytes, sha256Json, stableJson, writeExclusiveJson } from "../../scripts/protocol.mjs";
import { assertNoSecretMaterial } from "./real-route-redaction.mjs";
import { calibrationArtifactBindings, repositoryRoot } from "./real-route-profile.mjs";

export const AUTHORITY_FILE_NAME = "KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_V1.authority.json";
export const DEFAULT_AUTHORITY_PATH = "C:\\Users\\dawgy\\Projects\\katherine-eye-authorities\\KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_V1.authority.json";
export const FEATURE_BRANCH = "refactor/beta-evidence-pipeline";

const AUTHORITY_FIELDS = Object.freeze([
  "schemaVersion", "authorityType", "status", "releaseIdentity", "readinessManifestHash",
  "priorCalibrationFailureResultHash", "providerProfileHash", "billingAttestationHash", "exactModelId",
  "endpointClass", "calibrationCaseId", "calibrationCaseHash", "calibrationPromptHash", "promptByteCount",
  "executiveActionSchemaHash", "inputTokenCeiling", "outputTokenCeiling", "maximumProviderCostUsd",
  "maximumMetadataAccessRequests", "maximumInferenceRequests", "maximumInferenceRetries", "maximumAgentToolCalls",
  "maximumEngineeringWorkerDispatches", "maximumWallClockDurationMs", "resultRootRelativePath", "singleUseIdentity",
  "createdAt", "expiresAt", "prohibitedActivities", "authoritySchemaHash", "authorityHash"
]);

const PROHIBITED_ACTIVITIES = Object.freeze([
  "TWELVE_CASE_QUALIFICATION", "PHASE_7_BENCHMARK_EXECUTION", "BENCHMARK_CONSENT_OR_RESERVATION",
  "PRODUCT_HANDLER_INVOCATION", "HISTORICAL_EPISODE_ACCESS", "ANALOGOUS_EPISODE_ACCESS",
  "NOVEL_EPISODE_ACCESS", "EVALUATOR_CONTROL_ACCESS", "EXECUTIVE_LESSON_CREATION_OR_PROMOTION",
  "ENGINEERING_WORKER_DISPATCH", "PRODUCTION_EXECUTION", "PRODUCT_MUTATION", "MERGE",
  "PREVIEW_DEPLOYMENT", "PRODUCTION_DEPLOYMENT", "ADDITIONAL_PROVIDER_REQUEST"
]);

function git(args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
}

function validateReleaseIdentity(value) {
  exactKeys(value, ["version", "runtimeCommit", "runtimeTree", "sealCommit", "sealTree", "releaseRecordHash"], "authority release identity");
  assert.equal(value.version, "1.12.26");
  for (const field of ["runtimeCommit", "runtimeTree", "sealCommit", "sealTree"]) assert.match(value[field] || "", /^[a-f0-9]{40}$/);
  assertHash(value.releaseRecordHash, "release record hash");
}

export function validateRealRouteAuthority(authority, { now = Date.now() } = {}) {
  exactKeys(authority, AUTHORITY_FIELDS, "real-route calibration authority");
  assert.equal(authority.schemaVersion, "1.0");
  assert.equal(authority.authorityType, "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_ONLY");
  assert.equal(authority.status, "AUTHORIZED");
  validateReleaseIdentity(authority.releaseIdentity);
  for (const field of ["readinessManifestHash", "priorCalibrationFailureResultHash", "providerProfileHash", "billingAttestationHash", "calibrationCaseHash", "calibrationPromptHash", "executiveActionSchemaHash", "authoritySchemaHash", "authorityHash"]) assertHash(authority[field], field);
  assert.equal(authority.exactModelId, "gpt-5.6-sol");
  assert.equal(authority.endpointClass, "RESPONSES_API");
  assert.equal(authority.calibrationCaseId, "KE-CAL-001");
  assert.ok(Number.isInteger(authority.promptByteCount) && authority.promptByteCount > 0 && authority.promptByteCount <= 8000);
  assert.equal(authority.inputTokenCeiling, 8000);
  assert.equal(authority.outputTokenCeiling, 2000);
  assert.equal(authority.maximumProviderCostUsd, 0.25);
  assert.equal(authority.maximumMetadataAccessRequests, 1);
  assert.equal(authority.maximumInferenceRequests, 1);
  assert.equal(authority.maximumInferenceRetries, 0);
  assert.equal(authority.maximumAgentToolCalls, 0);
  assert.equal(authority.maximumEngineeringWorkerDispatches, 0);
  assert.equal(authority.maximumWallClockDurationMs, 300000);
  assert.match(authority.resultRootRelativePath || "", /^qualification-results\/real-route-calibration-[a-f0-9]{16}$/);
  assert.match(authority.singleUseIdentity || "", /^calibration-use-[a-f0-9]{48}$/);
  canonicalIso(authority.createdAt, "authority creation time");
  canonicalIso(authority.expiresAt, "authority expiration time");
  const lifetime = Date.parse(authority.expiresAt) - Date.parse(authority.createdAt);
  assert.ok(lifetime > 0 && lifetime <= 86_400_000, "authority lifetime exceeds 24 hours");
  assert.ok(now <= Date.parse(authority.expiresAt), "real-route calibration authority expired");
  assert.deepEqual(authority.prohibitedActivities, PROHIBITED_ACTIVITIES);
  const core = structuredClone(authority); delete core.authorityHash;
  assert.equal(sha256Json(core), authority.authorityHash, "authority content hash differs");
  assertNoSecretMaterial(authority, "real-route calibration authority");
  return authority;
}

export async function buildRealRouteAuthority({ createdAt = new Date().toISOString(), singleUseIdentity = null } = {}) {
  const release = inspectQualifiedRealRouteRelease();
  const bindings = await calibrationArtifactBindings();
  const identity = singleUseIdentity || `calibration-use-${crypto.randomBytes(24).toString("hex")}`;
  assert.match(identity, /^calibration-use-[a-f0-9]{48}$/);
  const resultRootRelativePath = `qualification-results/real-route-calibration-${identity.slice(-16)}`;
  const createdMs = Date.parse(canonicalIso(createdAt, "authority creation time"));
  const core = {
    schemaVersion: "1.0", authorityType: "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_ONLY", status: "AUTHORIZED",
    releaseIdentity: { version: "1.12.26", runtimeCommit: release.runtimeCommit, runtimeTree: release.runtimeTree, sealCommit: release.sealCommit, sealTree: release.sealTree, releaseRecordHash: release.releaseRecordHash },
    readinessManifestHash: release.release.readinessManifestHash,
    priorCalibrationFailureResultHash: release.release.priorCalibrationFailureResultHash,
    providerProfileHash: bindings.profile.profileHash, billingAttestationHash: bindings.attestation.statementHash,
    exactModelId: bindings.profile.exactModelId, endpointClass: bindings.profile.endpointClass,
    calibrationCaseId: bindings.calibrationCase.episodeId, calibrationCaseHash: bindings.calibrationCase.caseHash,
    calibrationPromptHash: bindings.prompt.promptHash, promptByteCount: bindings.prompt.byteCount,
    executiveActionSchemaHash: bindings.executiveActionSchemaHash,
    inputTokenCeiling: 8000, outputTokenCeiling: 2000, maximumProviderCostUsd: 0.25,
    maximumMetadataAccessRequests: 1, maximumInferenceRequests: 1, maximumInferenceRetries: 0,
    maximumAgentToolCalls: 0, maximumEngineeringWorkerDispatches: 0, maximumWallClockDurationMs: 300000,
    resultRootRelativePath, singleUseIdentity: identity, createdAt,
    expiresAt: new Date(createdMs + 86_400_000).toISOString(), prohibitedActivities: PROHIBITED_ACTIVITIES,
    authoritySchemaHash: bindings.authoritySchemaHash
  };
  return seal(core, "authorityHash");
}

function assertFeatureBranchSynchronized() {
  assert.equal(git(["branch", "--show-current"]), FEATURE_BRANCH, "real-route calibration must remain on the feature branch");
  const local = git(["rev-parse", "HEAD"]);
  const remote = git(["rev-parse", `refs/remotes/origin/${FEATURE_BRANCH}`]);
  assert.equal(local, remote, "local and remote feature refs differ");
  return local;
}

async function makeReadOnly(filePath) {
  await chmod(filePath, 0o444);
  if (process.platform === "win32") execFileSync("attrib.exe", ["+R", filePath], { windowsHide: true });
}

export async function sealExternalRealRouteAuthority({ authorityPath = DEFAULT_AUTHORITY_PATH, createdAt, singleUseIdentity } = {}) {
  assertFeatureBranchSynchronized();
  const authority = await buildRealRouteAuthority({ createdAt, singleUseIdentity });
  validateRealRouteAuthority(authority);
  const schema = JSON.parse(await readFile(new URL("../schemas/real-route-calibration-authority.schema.json", import.meta.url), "utf8"));
  assert.equal(schema.properties.authorityType.const, authority.authorityType, "authority schema type differs");
  const serialized = `${stableJson(authority)}\n`;
  assertNoSecretMaterial(serialized, "serialized authority");
  await writeExclusiveJson(authorityPath, authority);
  const authorityFileHash = sha256Bytes(Buffer.from(serialized, "utf8"));
  const receiptCore = {
    schemaVersion: "1.0", receiptType: "REAL_ROUTE_CALIBRATION_AUTHORITY_SEALING_RECEIPT",
    authorityHash: authority.authorityHash, authorityFileHash, authoritySchemaHash: authority.authoritySchemaHash,
    providerProfileHash: authority.providerProfileHash, singleUseIdentity: authority.singleUseIdentity, sealedAt: authority.createdAt
  };
  const receipt = seal(receiptCore, "receiptHash");
  const receiptPath = `${authorityPath}.sealing-receipt.json`;
  await writeExclusiveJson(receiptPath, receipt);
  await Promise.all([makeReadOnly(authorityPath), makeReadOnly(receiptPath)]);
  return Object.freeze({ authority, authorityPath, authorityFileHash, receipt, receiptPath });
}

export async function loadExternalRealRouteAuthority({ authorityPath = DEFAULT_AUTHORITY_PATH, now = Date.now() } = {}) {
  const bytes = await readFile(authorityPath);
  const authority = JSON.parse(bytes.toString("utf8"));
  validateRealRouteAuthority(authority, { now });
  const receiptPath = `${authorityPath}.sealing-receipt.json`;
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  const receiptCore = structuredClone(receipt); delete receiptCore.receiptHash;
  assert.equal(sha256Json(receiptCore), receipt.receiptHash, "authority sealing receipt hash differs");
  assert.equal(receipt.authorityHash, authority.authorityHash);
  assert.equal(receipt.authorityFileHash, sha256Bytes(bytes));
  assertNoSecretMaterial(bytes.toString("utf8"), "external authority");
  return Object.freeze({ authority, authorityPath, authorityFileHash: sha256Bytes(bytes), receipt, receiptPath });
}

export function authorityStatePaths(authorityPath, authority) {
  const root = path.join(path.dirname(authorityPath), ".calibration-authority-state", authority.singleUseIdentity);
  return Object.freeze({ root, claimPath: path.join(root, "claim.json"), consumptionPath: path.join(root, "consumption.json"), terminalPath: path.join(root, "terminal.json") });
}

export async function claimExternalAuthority({ authorityPath, authority, claimedAt = new Date().toISOString() }) {
  const paths = authorityStatePaths(authorityPath, authority);
  await mkdir(paths.root, { recursive: true });
  const record = seal({ schemaVersion: "1.0", receiptType: "REAL_ROUTE_AUTHORITY_TERMINAL_CLAIM", authorityHash: authority.authorityHash, singleUseIdentity: authority.singleUseIdentity, claimedAt: canonicalIso(claimedAt, "claim time") }, "receiptHash");
  await writeExclusiveJson(paths.claimPath, record);
  return Object.freeze({ paths, record });
}

export async function consumeExternalAuthority({ paths, authority, reservationHash, requestIdentity, consumedAt = new Date().toISOString() }) {
  assertHash(reservationHash, "reservation hash"); assertHash(requestIdentity, "request identity");
  const record = seal({ schemaVersion: "1.0", receiptType: "REAL_ROUTE_AUTHORITY_INFERENCE_CONSUMPTION", authorityHash: authority.authorityHash, singleUseIdentity: authority.singleUseIdentity, reservationHash, requestIdentity, consumedAt: canonicalIso(consumedAt, "consumption time"), permanentlyConsumed: true }, "receiptHash");
  await writeExclusiveJson(paths.consumptionPath, record);
  return record;
}

export async function closeExternalAuthority({ paths, authority, status, resultHash = null, closedAt = new Date().toISOString() }) {
  if (resultHash !== null) assertHash(resultHash, "terminal result hash");
  const consumed = await stat(paths.consumptionPath).then(() => true, (error) => error?.code === "ENOENT" ? false : Promise.reject(error));
  const record = seal({ schemaVersion: "1.0", receiptType: "REAL_ROUTE_AUTHORITY_TERMINAL_CLOSURE", authorityHash: authority.authorityHash, singleUseIdentity: authority.singleUseIdentity, terminalStatus: status, inferenceAuthorityConsumed: consumed, resultHash, closedAt: canonicalIso(closedAt, "closure time"), reusable: false }, "receiptHash");
  await writeExclusiveJson(paths.terminalPath, record);
  return record;
}
