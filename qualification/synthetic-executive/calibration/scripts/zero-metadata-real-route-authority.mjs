import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import {
  assertHash, canonicalIso, exactKeys, seal, sha256Bytes, sha256Json, stableJson, writeExclusiveJson
} from "../../scripts/protocol.mjs";
import { assertNoSecretMaterial } from "./real-route-redaction.mjs";
import { calibrationArtifactBindings } from "./real-route-profile.mjs";
import {
  COGNITIVE_SUBJECT, FEATURE_BRANCH, PRIOR_ARTIFACT_HASHES, PRIOR_METADATA_EVIDENCE,
  ZERO_METADATA_ROUTE_RELEASE_TYPE, ZERO_METADATA_ROUTE_VERSION,
  inspectSealedZeroMetadataRouteRelease, repositoryRoot
} from "./zero-metadata-route-release.mjs";

export const ZERO_METADATA_AUTHORITY_FILE_NAME = "KATHERINE_SYNTHETIC_EXECUTIVE_ZERO_METADATA_REAL_ROUTE_CALIBRATION_V1.authority.json";
export const DEFAULT_ZERO_METADATA_AUTHORITY_PATH = `C:\\Users\\dawgy\\Projects\\katherine-eye-authorities\\${ZERO_METADATA_AUTHORITY_FILE_NAME}`;
export const PRIOR_AUTHORITY_PATH = "C:\\Users\\dawgy\\Projects\\katherine-eye-authorities\\KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_V1.authority.json";
export const ZERO_METADATA_AUTHORITY_SCHEMA_PATH = path.join(repositoryRoot, "qualification", "synthetic-executive", "calibration", "schemas", "zero-metadata-real-route-calibration-authority.schema.json");
export const ZERO_METADATA_AUTHORITY_RECEIPT_SCHEMA_PATH = path.join(repositoryRoot, "qualification", "synthetic-executive", "calibration", "schemas", "zero-metadata-authority-sealing-receipt.schema.json");

const PRIOR_CALIBRATION_ROOT = path.join(repositoryRoot, "qualification-results", "real-route-calibration-ee15190dac308935");
const PRIOR_ARTIFACT_PATHS = Object.freeze({
  consumedAuthority: PRIOR_AUTHORITY_PATH,
  calibrationResult: path.join(PRIOR_CALIBRATION_ROOT, "calibration-result.json"),
  metadataAccessReceipt: path.join(PRIOR_CALIBRATION_ROOT, "metadata-access-receipt.json"),
  qualificationLedger: path.join(PRIOR_CALIBRATION_ROOT, "governor", "qualification-ledger.ndjson")
});
const PRIOR_AUTHORITY_IDENTITY = "calibration-use-b1ad7e2a48e8005cb9dbd8ef9a61132cee15190dac308935";

const AUTHORITY_FIELDS = Object.freeze([
  "schemaVersion", "authorityType", "status", "cognitiveSubjectIdentity", "runnerReleaseIdentity",
  "priorMetadataEvidence", "providerProfileHash", "billingAttestationHash", "exactModelId", "endpointClass",
  "inferenceEndpoint", "reasoningEffort", "store", "calibrationCaseId", "calibrationCaseHash",
  "calibrationPromptHash", "promptByteCount", "executiveActionSchemaHash", "canonicalRequestHash",
  "safeProviderDiagnosticsContractVersion", "terminalResultSchemaVersion", "inputTokenCeiling",
  "outputTokenCeiling", "totalTokenCeiling", "maximumProviderCostUsd", "maximumMetadataAccessRequests",
  "maximumInferenceRequests", "maximumGovernedReasoningSteps", "maximumInferenceRetries",
  "maximumAgentToolCalls", "maximumEngineeringWorkerDispatches", "maximumSuccessors",
  "maximumWallClockDurationMs", "resultRootRelativePath", "singleUseIdentity", "createdAt", "expiresAt",
  "prohibitedActivities", "authoritySchemaHash", "authorityReceiptSchemaHash", "authorityHash"
]);

const PROHIBITED_ACTIVITIES = Object.freeze([
  "METADATA_PROVIDER_REQUEST", "TWELVE_CASE_QUALIFICATION", "PHASE_7_BENCHMARK_EXECUTION",
  "BENCHMARK_CONSENT_OR_RESERVATION", "PRODUCT_HANDLER_INVOCATION", "HISTORICAL_EPISODE_ACCESS",
  "ANALOGOUS_EPISODE_ACCESS", "NOVEL_EPISODE_ACCESS", "EVALUATOR_CONTROL_ACCESS",
  "EXECUTIVE_LESSON_CREATION_OR_PROMOTION", "ENGINEERING_WORKER_DISPATCH", "PRODUCTION_EXECUTION",
  "PRODUCT_MUTATION", "SOURCE_REPAIR", "MERGE", "PREVIEW_DEPLOYMENT", "PRODUCTION_DEPLOYMENT",
  "SUCCESSOR_CREATION", "ADDITIONAL_PROVIDER_REQUEST"
]);

function git(args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
}

function validateCognitiveSubject(value) {
  exactKeys(value, Object.keys(COGNITIVE_SUBJECT), "cognitive subject identity");
  assert.deepEqual(value, COGNITIVE_SUBJECT);
}

function validateRunnerReleaseIdentity(value) {
  exactKeys(value, ["releaseType", "routeVersion", "parentCommit", "parentTree", "runtimeCommit", "runtimeTree", "releaseRecordHash"], "runner release identity");
  assert.equal(value.releaseType, ZERO_METADATA_ROUTE_RELEASE_TYPE);
  assert.equal(value.routeVersion, ZERO_METADATA_ROUTE_VERSION);
  assert.equal(value.parentCommit, COGNITIVE_SUBJECT.commit);
  assert.equal(value.parentTree, COGNITIVE_SUBJECT.tree);
  for (const field of ["runtimeCommit", "runtimeTree"]) assert.match(value[field] || "", /^[a-f0-9]{40}$/);
  assertHash(value.releaseRecordHash, "runner release record hash");
}

function validatePriorMetadataEvidence(value) {
  exactKeys(value, ["evidenceType", "sourceCalibrationResultHash", "receiptRelativePath", "receiptFileHash", "canonicalSafeResponseHash", "returnedModelId", "newMetadataRequestAuthorized"], "prior metadata evidence");
  assert.deepEqual(value, {
    evidenceType: "PRIOR_SEALED_SUCCESSFUL_METADATA_RECEIPT",
    sourceCalibrationResultHash: PRIOR_ARTIFACT_HASHES.calibrationResult,
    receiptRelativePath: PRIOR_METADATA_EVIDENCE.receiptRelativePath,
    receiptFileHash: PRIOR_METADATA_EVIDENCE.receiptFileHash,
    canonicalSafeResponseHash: PRIOR_METADATA_EVIDENCE.canonicalSafeResponseHash,
    returnedModelId: PRIOR_METADATA_EVIDENCE.returnedModelId,
    newMetadataRequestAuthorized: false
  });
}

export function validateZeroMetadataRealRouteAuthority(authority, { now = Date.now() } = {}) {
  exactKeys(authority, AUTHORITY_FIELDS, "zero-metadata calibration authority");
  assert.equal(authority.schemaVersion, "1.0");
  assert.equal(authority.authorityType, "SYNTHETIC_EXECUTIVE_ZERO_METADATA_REAL_ROUTE_CALIBRATION_ONLY");
  assert.equal(authority.status, "AUTHORIZED");
  validateCognitiveSubject(authority.cognitiveSubjectIdentity);
  validateRunnerReleaseIdentity(authority.runnerReleaseIdentity);
  validatePriorMetadataEvidence(authority.priorMetadataEvidence);
  for (const field of ["providerProfileHash", "billingAttestationHash", "calibrationCaseHash", "calibrationPromptHash", "executiveActionSchemaHash", "canonicalRequestHash", "authoritySchemaHash", "authorityReceiptSchemaHash", "authorityHash"]) assertHash(authority[field], field);
  assert.equal(authority.providerProfileHash, "da38983bd5a6381b90379e4fa49142a9bb7dcc16941cf1246b479cb6a962cab1");
  assert.equal(authority.exactModelId, "gpt-5.6-sol");
  assert.equal(authority.endpointClass, "RESPONSES_API");
  assert.equal(authority.inferenceEndpoint, "v1/responses");
  assert.equal(authority.reasoningEffort, "medium");
  assert.equal(authority.store, false);
  assert.equal(authority.calibrationCaseId, "KE-CAL-001");
  assert.equal(authority.calibrationPromptHash, "73dc7a21fa2db16c432b9630f3934ea87d78cd89b174b1739563b207a5a57e93");
  assert.equal(authority.executiveActionSchemaHash, "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba");
  assert.equal(authority.canonicalRequestHash, COGNITIVE_SUBJECT.canonicalRequestHash);
  assert.equal(authority.safeProviderDiagnosticsContractVersion, "1.0");
  assert.equal(authority.terminalResultSchemaVersion, "1.1");
  assert.ok(Number.isInteger(authority.promptByteCount) && authority.promptByteCount > 0 && authority.promptByteCount <= 8000);
  assert.equal(authority.inputTokenCeiling, 8000);
  assert.equal(authority.outputTokenCeiling, 2000);
  assert.equal(authority.totalTokenCeiling, 10000);
  assert.equal(authority.maximumProviderCostUsd, 0.25);
  assert.equal(authority.maximumMetadataAccessRequests, 0);
  assert.equal(authority.maximumInferenceRequests, 1);
  assert.equal(authority.maximumGovernedReasoningSteps, 1);
  assert.equal(authority.maximumInferenceRetries, 0);
  assert.equal(authority.maximumAgentToolCalls, 0);
  assert.equal(authority.maximumEngineeringWorkerDispatches, 0);
  assert.equal(authority.maximumSuccessors, 0);
  assert.equal(authority.maximumWallClockDurationMs, 300000);
  assert.match(authority.resultRootRelativePath || "", /^qualification-results\/real-route-zero-metadata-calibration-[a-f0-9]{16}$/);
  assert.match(authority.singleUseIdentity || "", /^zero-metadata-calibration-use-[a-f0-9]{48}$/);
  canonicalIso(authority.createdAt, "authority creation time");
  canonicalIso(authority.expiresAt, "authority expiration time");
  const lifetime = Date.parse(authority.expiresAt) - Date.parse(authority.createdAt);
  assert.ok(lifetime > 0 && lifetime <= 86_400_000, "authority lifetime exceeds 24 hours");
  assert.ok(now <= Date.parse(authority.expiresAt), "zero-metadata calibration authority expired");
  assert.deepEqual(authority.prohibitedActivities, PROHIBITED_ACTIVITIES);
  const core = structuredClone(authority); delete core.authorityHash;
  assert.equal(sha256Json(core), authority.authorityHash, "zero-metadata authority content hash differs");
  assertNoSecretMaterial(authority, "zero-metadata calibration authority");
  return authority;
}

export async function loadPriorSealedMetadataEvidence() {
  for (const [name, filePath] of Object.entries(PRIOR_ARTIFACT_PATHS)) {
    const bytes = await readFile(filePath);
    assert.equal(sha256Bytes(bytes), PRIOR_ARTIFACT_HASHES[name], `${name} changed`);
  }
  const priorAuthority = JSON.parse(await readFile(PRIOR_AUTHORITY_PATH, "utf8"));
  assert.equal(priorAuthority.singleUseIdentity, PRIOR_AUTHORITY_IDENTITY);
  const stateRoot = path.join(path.dirname(PRIOR_AUTHORITY_PATH), ".calibration-authority-state", priorAuthority.singleUseIdentity);
  const consumption = JSON.parse(await readFile(path.join(stateRoot, "consumption.json"), "utf8"));
  const terminal = JSON.parse(await readFile(path.join(stateRoot, "terminal.json"), "utf8"));
  assert.equal(consumption.permanentlyConsumed, true);
  assert.equal(terminal.reusable, false);
  const receipt = JSON.parse(await readFile(PRIOR_ARTIFACT_PATHS.metadataAccessReceipt, "utf8"));
  exactKeys(receipt, ["canonicalSafeResponseHash", "httpSuccessClass", "requestTimestamp", "returnedModelId", "returnedObjectType", "returnedOwnerCategory", "safeProviderRequestId"], "prior metadata receipt");
  const safe = structuredClone(receipt); delete safe.canonicalSafeResponseHash;
  assert.equal(sha256Json(safe), receipt.canonicalSafeResponseHash);
  assert.equal(receipt.httpSuccessClass, "HTTP_2XX");
  assert.equal(receipt.returnedModelId, "gpt-5.6-sol");
  assert.equal(receipt.canonicalSafeResponseHash, PRIOR_METADATA_EVIDENCE.canonicalSafeResponseHash);
  return Object.freeze({
    evidenceType: "PRIOR_SEALED_SUCCESSFUL_METADATA_RECEIPT",
    sourceCalibrationResultHash: PRIOR_ARTIFACT_HASHES.calibrationResult,
    receiptRelativePath: PRIOR_METADATA_EVIDENCE.receiptRelativePath,
    receiptFileHash: PRIOR_METADATA_EVIDENCE.receiptFileHash,
    canonicalSafeResponseHash: PRIOR_METADATA_EVIDENCE.canonicalSafeResponseHash,
    returnedModelId: PRIOR_METADATA_EVIDENCE.returnedModelId,
    newMetadataRequestAuthorized: false
  });
}

export async function buildZeroMetadataRealRouteAuthority({
  createdAt = new Date().toISOString(), singleUseIdentity = null,
  releaseInspector = inspectSealedZeroMetadataRouteRelease,
  artifactLoader = calibrationArtifactBindings,
  priorMetadataLoader = loadPriorSealedMetadataEvidence
} = {}) {
  const runnerRelease = releaseInspector();
  const [bindings, priorMetadataEvidence, authoritySchemaBytes, authorityReceiptSchemaBytes] = await Promise.all([
    artifactLoader(), priorMetadataLoader(), readFile(ZERO_METADATA_AUTHORITY_SCHEMA_PATH), readFile(ZERO_METADATA_AUTHORITY_RECEIPT_SCHEMA_PATH)
  ]);
  const identity = singleUseIdentity || `zero-metadata-calibration-use-${crypto.randomBytes(24).toString("hex")}`;
  assert.match(identity, /^zero-metadata-calibration-use-[a-f0-9]{48}$/);
  const resultRootRelativePath = `qualification-results/real-route-zero-metadata-calibration-${identity.slice(-16)}`;
  const createdMs = Date.parse(canonicalIso(createdAt, "authority creation time"));
  const core = {
    schemaVersion: "1.0", authorityType: "SYNTHETIC_EXECUTIVE_ZERO_METADATA_REAL_ROUTE_CALIBRATION_ONLY", status: "AUTHORIZED",
    cognitiveSubjectIdentity: COGNITIVE_SUBJECT,
    runnerReleaseIdentity: {
      releaseType: ZERO_METADATA_ROUTE_RELEASE_TYPE, routeVersion: ZERO_METADATA_ROUTE_VERSION,
      parentCommit: runnerRelease.parentCommit, parentTree: runnerRelease.parentTree,
      runtimeCommit: runnerRelease.runtimeCommit, runtimeTree: runnerRelease.runtimeTree,
      releaseRecordHash: runnerRelease.releaseRecordHash
    },
    priorMetadataEvidence,
    providerProfileHash: bindings.profile.profileHash, billingAttestationHash: bindings.attestation.statementHash,
    exactModelId: bindings.profile.exactModelId, endpointClass: bindings.profile.endpointClass,
    inferenceEndpoint: bindings.profile.inferenceEndpoint, reasoningEffort: bindings.profile.reasoning.effort,
    store: bindings.profile.responsePersistence.store,
    calibrationCaseId: bindings.calibrationCase.episodeId, calibrationCaseHash: bindings.calibrationCase.caseHash,
    calibrationPromptHash: bindings.prompt.promptHash, promptByteCount: bindings.prompt.byteCount,
    executiveActionSchemaHash: bindings.executiveActionSchemaHash,
    canonicalRequestHash: COGNITIVE_SUBJECT.canonicalRequestHash,
    safeProviderDiagnosticsContractVersion: COGNITIVE_SUBJECT.safeProviderDiagnosticsContractVersion,
    terminalResultSchemaVersion: COGNITIVE_SUBJECT.terminalResultSchemaVersion,
    inputTokenCeiling: 8000, outputTokenCeiling: 2000, totalTokenCeiling: 10000,
    maximumProviderCostUsd: 0.25, maximumMetadataAccessRequests: 0, maximumInferenceRequests: 1,
    maximumGovernedReasoningSteps: 1, maximumInferenceRetries: 0, maximumAgentToolCalls: 0,
    maximumEngineeringWorkerDispatches: 0, maximumSuccessors: 0, maximumWallClockDurationMs: 300000,
    resultRootRelativePath, singleUseIdentity: identity, createdAt,
    expiresAt: new Date(createdMs + 86_400_000).toISOString(), prohibitedActivities: PROHIBITED_ACTIVITIES,
    authoritySchemaHash: sha256Bytes(authoritySchemaBytes), authorityReceiptSchemaHash: sha256Bytes(authorityReceiptSchemaBytes)
  };
  return seal(core, "authorityHash");
}

export function assertZeroMetadataFeatureBranchSynchronized() {
  assert.equal(git(["branch", "--show-current"]), FEATURE_BRANCH);
  const local = git(["rev-parse", "HEAD"]);
  const remote = git(["rev-parse", `refs/remotes/origin/${FEATURE_BRANCH}`]);
  assert.equal(local, remote, "local and remote feature refs differ");
  return local;
}

async function makeReadOnly(filePath) {
  await chmod(filePath, 0o444);
  if (process.platform === "win32") execFileSync("attrib.exe", ["+R", filePath], { windowsHide: true });
}

export async function sealExternalZeroMetadataAuthority({
  authorityPath = DEFAULT_ZERO_METADATA_AUTHORITY_PATH, createdAt, singleUseIdentity,
  synchronizationInspector = assertZeroMetadataFeatureBranchSynchronized,
  authorityBuilder = buildZeroMetadataRealRouteAuthority
} = {}) {
  synchronizationInspector();
  const receiptPath = `${authorityPath}.sealing-receipt.json`;
  for (const target of [authorityPath, receiptPath]) {
    const exists = await stat(target).then(() => true, (error) => error?.code === "ENOENT" ? false : Promise.reject(error));
    assert.equal(exists, false, `zero-metadata authority target already exists: ${path.basename(target)}`);
  }
  const authority = await authorityBuilder({ createdAt, singleUseIdentity });
  validateZeroMetadataRealRouteAuthority(authority);
  const serialized = `${stableJson(authority)}\n`;
  assertNoSecretMaterial(serialized, "serialized zero-metadata authority");
  await writeExclusiveJson(authorityPath, authority);
  const authorityFileHash = sha256Bytes(Buffer.from(serialized, "utf8"));
  const receiptCore = {
    schemaVersion: "1.0", receiptType: "ZERO_METADATA_REAL_ROUTE_CALIBRATION_AUTHORITY_SEALING_RECEIPT",
    authorityHash: authority.authorityHash, authorityFileHash,
    authoritySchemaHash: authority.authoritySchemaHash, authorityReceiptSchemaHash: authority.authorityReceiptSchemaHash,
    providerProfileHash: authority.providerProfileHash,
    runnerReleaseRecordHash: authority.runnerReleaseIdentity.releaseRecordHash,
    singleUseIdentity: authority.singleUseIdentity, sealedAt: authority.createdAt
  };
  const receipt = seal(receiptCore, "receiptHash");
  await writeExclusiveJson(receiptPath, receipt);
  await Promise.all([makeReadOnly(authorityPath), makeReadOnly(receiptPath)]);
  return Object.freeze({ authority, authorityPath, authorityFileHash, receipt, receiptPath });
}

export async function loadExternalZeroMetadataAuthority({ authorityPath = DEFAULT_ZERO_METADATA_AUTHORITY_PATH, now = Date.now() } = {}) {
  const bytes = await readFile(authorityPath);
  const authority = JSON.parse(bytes.toString("utf8"));
  validateZeroMetadataRealRouteAuthority(authority, { now });
  const receiptPath = `${authorityPath}.sealing-receipt.json`;
  const receipt = JSON.parse(await readFile(receiptPath, "utf8"));
  exactKeys(receipt, ["schemaVersion", "receiptType", "authorityHash", "authorityFileHash", "authoritySchemaHash", "authorityReceiptSchemaHash", "providerProfileHash", "runnerReleaseRecordHash", "singleUseIdentity", "sealedAt", "receiptHash"], "zero-metadata authority receipt");
  const receiptCore = structuredClone(receipt); delete receiptCore.receiptHash;
  assert.equal(sha256Json(receiptCore), receipt.receiptHash);
  assert.equal(receipt.receiptType, "ZERO_METADATA_REAL_ROUTE_CALIBRATION_AUTHORITY_SEALING_RECEIPT");
  assert.equal(receipt.authorityHash, authority.authorityHash);
  assert.equal(receipt.authorityFileHash, sha256Bytes(bytes));
  assertNoSecretMaterial(bytes.toString("utf8"), "external zero-metadata authority");
  return Object.freeze({ authority, authorityPath, authorityFileHash: sha256Bytes(bytes), receipt, receiptPath });
}

export function zeroMetadataAuthorityStatePaths(authorityPath, authority) {
  const root = path.join(path.dirname(authorityPath), ".zero-metadata-calibration-authority-state", authority.singleUseIdentity);
  return Object.freeze({ root, claimPath: path.join(root, "claim.json"), consumptionPath: path.join(root, "consumption.json"), terminalPath: path.join(root, "terminal.json") });
}

export async function claimZeroMetadataAuthority({ authorityPath, authority, claimedAt = new Date().toISOString() }) {
  const paths = zeroMetadataAuthorityStatePaths(authorityPath, authority);
  await mkdir(paths.root, { recursive: true });
  const record = seal({ schemaVersion: "1.0", receiptType: "ZERO_METADATA_REAL_ROUTE_AUTHORITY_TERMINAL_CLAIM", authorityHash: authority.authorityHash, singleUseIdentity: authority.singleUseIdentity, claimedAt: canonicalIso(claimedAt, "claim time") }, "receiptHash");
  await writeExclusiveJson(paths.claimPath, record);
  return Object.freeze({ paths, record });
}

export async function consumeZeroMetadataAuthority({ paths, authority, reservationHash, requestIdentity, consumedAt = new Date().toISOString() }) {
  assertHash(reservationHash, "reservation hash"); assertHash(requestIdentity, "request identity");
  const record = seal({ schemaVersion: "1.0", receiptType: "ZERO_METADATA_REAL_ROUTE_AUTHORITY_INFERENCE_CONSUMPTION", authorityHash: authority.authorityHash, singleUseIdentity: authority.singleUseIdentity, reservationHash, requestIdentity, consumedAt: canonicalIso(consumedAt, "consumption time"), permanentlyConsumed: true }, "receiptHash");
  await writeExclusiveJson(paths.consumptionPath, record);
  return record;
}

export async function closeZeroMetadataAuthority({ paths, authority, status, resultHash = null, closedAt = new Date().toISOString() }) {
  if (resultHash !== null) assertHash(resultHash, "terminal result hash");
  const consumed = await stat(paths.consumptionPath).then(() => true, (error) => error?.code === "ENOENT" ? false : Promise.reject(error));
  const record = seal({ schemaVersion: "1.0", receiptType: "ZERO_METADATA_REAL_ROUTE_AUTHORITY_TERMINAL_CLOSURE", authorityHash: authority.authorityHash, singleUseIdentity: authority.singleUseIdentity, terminalStatus: status, inferenceAuthorityConsumed: consumed, resultHash, closedAt: canonicalIso(closedAt, "closure time"), reusable: false }, "receiptHash");
  await writeExclusiveJson(paths.terminalPath, record);
  return record;
}
