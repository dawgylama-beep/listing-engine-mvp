import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm,
  stat
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  sha256Bytes,
  sha256Json,
  stableJson,
  validateFreezeManifest,
  validateFreezeReceipt,
  validateFrozenRequestContract
} from "./protocol.mjs";
import {
  EXECUTION_MODE,
  validateInvocationReservation
} from "./execution-protocol.mjs";
import { assertNoTruncatedIdentityCollision } from "./launch-identity.mjs";

export const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const repositoryRoot = path.resolve(benchmarkRoot, "..", "..");
export const defaultResultHistoryRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v2-results");
export const defaultFreezeRoot = path.join(
  benchmarkRoot,
  "prepared",
  "freezes",
  "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699"
);

const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,95}$/;
const SAFE_RELATIVE = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*:)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;
const SAFE_EXTENSIONS = new Set([".json", ".jpg", ".jpeg", ".png", ".webp"]);
const PUBLIC_FREEZE_FILES = new Set([
  "freeze-manifest.json",
  "freeze-receipt.json",
  "analysis-plan.json",
  "source-package-boundary.json",
  "validation-report.json"
]);
export const RESULT_ROOT_ARTIFACT_ROLES = Object.freeze({
  "launch-scope.json": "LAUNCH_SCOPE",
  "execution-profile.json": "EXECUTION_PROFILE",
  "pricing-profile.json": "PRICING_PROFILE",
  "cost-envelope.json": "COST_ENVELOPE",
  "execution-consent.json": "EXECUTION_CONSENT",
  "invocation-reservation.json": "INVOCATION_RESERVATION",
  "execution-journal.json": "EXECUTION_JOURNAL",
  "cost-ledger.json": "COST_LEDGER",
  "unscored-result-manifest.json": "UNSCORED_RESULT_MANIFEST",
  "validation-report.json": "UNSCORED_VALIDATION_REPORT"
});
export const OPTIONAL_RESULT_ROOT_ARTIFACT_ROLES = Object.freeze({
  "continuation-scope.json": "CONTINUATION_SCOPE",
  "composite-unscored-evidence-manifest.json": "COMPOSITE_UNSCORED_EVIDENCE_MANIFEST"
});
export const HANDLER_RETURNED_DIRECTORY = "handler-returned";
export const TERMINAL_FAILURE_ARTIFACT_ROLES = Object.freeze({
  "zero-external-supersession-receipt.json": "ZERO_EXTERNAL_SUPERSESSION_RECEIPT",
  "post-handler-reconciliation-receipt.json": "POST_HANDLER_RECONCILIATION_RECEIPT",
  "reservation-closure-receipt.json": "RESERVATION_CLOSURE_RECEIPT",
  "terminal-failure-manifest.json": "TERMINAL_FAILURE_MANIFEST",
  "terminal-failure-validation-report.json": "TERMINAL_FAILURE_VALIDATION_REPORT"
});
export const RESULT_RESPONSE_DIRECTORY = "responses";
const RESULT_RESPONSE_PATH = /^responses\/(V2-RUN-(?:00[1-9]|01[0-9]|02[0-6]))\.json$/;
const HANDLER_RETURNED_PATH = /^handler-returned\/(V2-RUN-(?:00[1-9]|01[0-9]|02[0-6]))\.json$/;
const ANALYSIS_ID = /^V2-RUN-(?:00[1-9]|01[0-9]|02[0-6])$/;
const WINDOWS_DEVICE_BASENAME = /^(?:con|prn|aux|nul|clock\$|com[1-9]|lpt[1-9])$/i;

async function lstatIfExists(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export function assertSafeIdentity(value, label = "identity") {
  assert.match(value || "", SAFE_ID, `${label} is not a safe repository-owned identity`);
  assert.doesNotMatch(value, /\.|:|\\|\//, `${label} contains a path operator`);
  return value;
}

export function assertSafeRelativeFile(relativePath, { extensions = SAFE_EXTENSIONS } = {}) {
  assertCanonicalRelativePath(relativePath);
  assert.ok(extensions.has(path.extname(relativePath).toLowerCase()), `unsupported file extension ${relativePath}`);
  assert.doesNotMatch(relativePath, /(?:^|\/)evaluator-only(?:\/|$)/i, "evaluator-only paths are forbidden to the execution spine");
  return relativePath;
}

function assertCanonicalRelativePath(relativePath) {
  assert.equal(typeof relativePath, "string", "result artifact path must be text");
  assert.equal(relativePath.normalize("NFC"), relativePath, `result artifact path is not Unicode-normalized: ${relativePath}`);
  assert.doesNotMatch(relativePath, /\\/, `result artifact path must use repository separators: ${relativePath}`);
  assert.match(relativePath || "", SAFE_RELATIVE, `unsafe relative path ${relativePath}`);
  assert.equal(path.posix.normalize(relativePath), relativePath, `result artifact path is not canonical: ${relativePath}`);
  for (const segment of relativePath.split("/")) {
    assert.equal(WINDOWS_DEVICE_BASENAME.test(segment.split(".")[0]), false, `result artifact path contains a reserved device name: ${relativePath}`);
  }
  return relativePath;
}

export function classifyResultArtifactPath(relativePath, { kind = "file" } = {}) {
  assert.ok(["file", "directory"].includes(kind), "result artifact kind is invalid");
  assertCanonicalRelativePath(relativePath);
  if (kind === "directory") {
    assert.ok([RESULT_RESPONSE_DIRECTORY, HANDLER_RETURNED_DIRECTORY].includes(relativePath), `unknown result-tree directory: ${relativePath}`);
    return Object.freeze({ relativePath, kind, role: relativePath === RESULT_RESPONSE_DIRECTORY ? "TERMINAL_RESPONSE_DIRECTORY" : "HANDLER_RETURNED_DIRECTORY", analysisId: null });
  }
  assertSafeRelativeFile(relativePath, { extensions: new Set([".json"]) });
  const rootRole = RESULT_ROOT_ARTIFACT_ROLES[relativePath] || OPTIONAL_RESULT_ROOT_ARTIFACT_ROLES[relativePath] || TERMINAL_FAILURE_ARTIFACT_ROLES[relativePath];
  if (rootRole) return Object.freeze({ relativePath, kind, role: rootRole, analysisId: null });
  const response = relativePath.match(RESULT_RESPONSE_PATH);
  if (response) return Object.freeze({ relativePath, kind, role: "TERMINAL_RESPONSE", analysisId: response[1] });
  const handlerReturned = relativePath.match(HANDLER_RETURNED_PATH);
  assert.ok(handlerReturned, `unknown result-tree artifact: ${relativePath}`);
  return Object.freeze({ relativePath, kind, role: "HANDLER_RETURNED_RECEIPT", analysisId: handlerReturned[1] });
}

export function expectedResultArtifactPaths(responseAnalysisIds, { handlerReturnedAnalysisIds = responseAnalysisIds, includeContinuationScope = false, includeCompositeEvidence = false } = {}) {
  assert.ok(Array.isArray(responseAnalysisIds), "response analysis IDs must be an array");
  const seen = new Set();
  const responsePaths = responseAnalysisIds.map((analysisId) => {
    assert.match(analysisId || "", ANALYSIS_ID, `invalid response analysis ID ${analysisId}`);
    assert.equal(seen.has(analysisId), false, `duplicate response analysis ID ${analysisId}`);
    seen.add(analysisId);
    return `${RESULT_RESPONSE_DIRECTORY}/${analysisId}.json`;
  });
  assert.ok(Array.isArray(handlerReturnedAnalysisIds), "handler-returned analysis IDs must be an array");
  const handlerPaths = handlerReturnedAnalysisIds.map((analysisId) => {
    assert.match(analysisId || "", ANALYSIS_ID, `invalid handler-returned analysis ID ${analysisId}`);
    return `${HANDLER_RETURNED_DIRECTORY}/${analysisId}.json`;
  });
  return Object.freeze([
    ...Object.keys(RESULT_ROOT_ARTIFACT_ROLES),
    ...(includeContinuationScope ? ["continuation-scope.json"] : []),
    ...(includeCompositeEvidence ? ["composite-unscored-evidence-manifest.json"] : []),
    ...responsePaths,
    ...handlerPaths
  ].sort());
}

export function classifyResultArtifactInventory(relativePaths, { terminalKind = "SUCCESS" } = {}) {
  assert.ok(Array.isArray(relativePaths), "result artifact inventory must be an array");
  assert.ok(["SUCCESS", "FAILURE"].includes(terminalKind), "result terminal kind is invalid");
  const exactPaths = new Set();
  const caseFoldedPaths = new Set();
  const records = [];
  for (const relativePath of relativePaths) {
    assertCanonicalRelativePath(relativePath);
    assert.equal(exactPaths.has(relativePath), false, `duplicate normalized result path: ${relativePath}`);
    exactPaths.add(relativePath);
    const caseFolded = relativePath.toLowerCase();
    assert.equal(caseFoldedPaths.has(caseFolded), false, `case-colliding result path: ${relativePath}`);
    caseFoldedPaths.add(caseFolded);
    records.push(classifyResultArtifactPath(relativePath));
  }
  const baseRequired = Object.keys(RESULT_ROOT_ARTIFACT_ROLES).filter((relativePath) => !["unscored-result-manifest.json", "validation-report.json"].includes(relativePath));
  const requiredPaths = terminalKind === "SUCCESS"
    ? Object.keys(RESULT_ROOT_ARTIFACT_ROLES)
    : [...baseRequired, "terminal-failure-manifest.json", "terminal-failure-validation-report.json"];
  for (const required of requiredPaths) {
    assert.equal(exactPaths.has(required), true, `required result artifact is absent: ${required}`);
  }
  if (terminalKind === "SUCCESS") {
    for (const forbidden of Object.keys(TERMINAL_FAILURE_ARTIFACT_ROLES)) assert.equal(exactPaths.has(forbidden), false, `successful result contains failure artifact: ${forbidden}`);
  } else {
    for (const forbidden of ["unscored-result-manifest.json", "validation-report.json"]) assert.equal(exactPaths.has(forbidden), false, `terminal failure contains successful-result artifact: ${forbidden}`);
    assert.equal(exactPaths.has("composite-unscored-evidence-manifest.json"), false, "terminal failure cannot contain composite success evidence");
  }
  records.sort((left, right) => left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0);
  const canonicalRecords = records.map((record) => ({
    relativePath: record.relativePath,
    role: record.role,
    analysisId: record.analysisId
  }));
  return Object.freeze({
    valid: true,
    relativePaths: Object.freeze(canonicalRecords.map((record) => record.relativePath)),
    records: Object.freeze(canonicalRecords.map((record) => Object.freeze(record))),
    responseAnalysisIds: Object.freeze(canonicalRecords.filter((record) => record.role === "TERMINAL_RESPONSE").map((record) => record.analysisId)),
    inventoryHash: sha256Json(canonicalRecords)
  });
}

export function resolveWithin(root, relativePath, options) {
  assertSafeRelativeFile(relativePath, options);
  const resolvedRoot = path.resolve(root);
  const absolute = path.resolve(resolvedRoot, ...relativePath.split("/"));
  const relative = path.relative(resolvedRoot, absolute);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `path escapes trusted root: ${relativePath}`);
  return absolute;
}

export function deriveResultRoot(resultHistoryRoot, resultId) {
  assertSafeIdentity(resultId, "result ID");
  const history = path.resolve(resultHistoryRoot);
  const resultRoot = path.resolve(history, resultId);
  assert.equal(path.dirname(resultRoot), history, "result root must be a direct child of the fixed result-history root");
  return resultRoot;
}

export function resolveResultHistoryRoot(mode, overrideForSynthetic = null) {
  assert.ok(Object.values(EXECUTION_MODE).includes(mode));
  if (mode === EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION) {
    assert.equal(overrideForSynthetic, null, "real execution cannot override the result root");
    return defaultResultHistoryRoot;
  }
  assert.ok(overrideForSynthetic, "synthetic execution requires an operating-system temporary result root");
  const resolved = path.resolve(overrideForSynthetic);
  const temporary = path.resolve(os.tmpdir());
  const relative = path.relative(temporary, resolved);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "synthetic result root must remain under the operating-system temporary directory");
  return resolved;
}

async function assertNoReparseChain(trustedRoot, target, { allowMissingLeaf = true } = {}) {
  const root = path.resolve(trustedRoot);
  const resolved = path.resolve(target);
  const relative = path.relative(root, resolved);
  assert.ok(relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative)), "target escapes trusted root");
  let current = root;
  const rootStat = await lstatIfExists(root);
  if (rootStat) {
    assert.equal(rootStat.isSymbolicLink(), false, `trusted root is a symlink or reparse point: ${root}`);
    assert.equal(rootStat.isDirectory(), true, `trusted root is not a directory: ${root}`);
  }
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    const currentStat = await lstatIfExists(current);
    if (!currentStat) {
      assert.equal(allowMissingLeaf, true, `required path is absent: ${current}`);
      break;
    }
    assert.equal(currentStat.isSymbolicLink(), false, `path contains a symlink or reparse point: ${current}`);
  }
}

export async function writeExclusiveSynced(filePath, value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(`${stableJson(value)}\n`, "utf8");
  await mkdir(path.dirname(filePath), { recursive: true });
  const handle = await open(filePath, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  return sha256Bytes(bytes);
}

export async function replaceSynced(filePath, value) {
  const current = await lstatIfExists(filePath);
  assert.ok(current?.isFile(), `atomic replacement target is absent or not a file: ${filePath}`);
  assert.equal(current.isSymbolicLink(), false, `atomic replacement target is a symlink: ${filePath}`);
  const bytes = Buffer.from(`${stableJson(value)}\n`, "utf8");
  const temporary = `${filePath}.pending-${process.pid}-${randomBytes(6).toString("hex")}`;
  await writeExclusiveSynced(temporary, bytes);
  try {
    await rename(temporary, filePath);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return sha256Bytes(bytes);
}

export async function readJsonStrictFile(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function loadPublicFreeze(freezeRoot = defaultFreezeRoot, { onRead = () => {} } = {}) {
  const root = path.resolve(freezeRoot);
  const observe = async (relativePath) => {
    assert.doesNotMatch(relativePath, /(?:^|\/)evaluator-only(?:\/|$)/i, "execution attempted evaluator-only access");
    onRead(relativePath);
    return readFile(resolveWithin(root, relativePath));
  };
  for (const relativePath of PUBLIC_FREEZE_FILES) assertSafeRelativeFile(relativePath);
  const manifest = JSON.parse((await observe("freeze-manifest.json")).toString("utf8"));
  const receipt = JSON.parse((await observe("freeze-receipt.json")).toString("utf8"));
  validateFreezeManifest(manifest);
  validateFreezeReceipt(receipt, manifest);
  assert.equal(manifest.completeFrozenAggregateHash, path.basename(root), "freeze root is not its complete aggregate");
  assert.equal(manifest.state, "FROZEN_AWAITING_CONSENT");
  Object.values(manifest.absentAuthority).forEach((value) => assert.equal(value, false));
  for (const field of ["executionConsentAuthorized", "invocationReservationAuthorized", "providerAccessAuthorized", "networkAccessAuthorized", "scoringAuthorized", "deploymentAuthorized"]) assert.equal(receipt[field], false);

  const analysisPlan = JSON.parse((await observe("analysis-plan.json")).toString("utf8"));
  assert.equal(analysisPlan.analysisCount, 26);
  const requests = [];
  const requestHashes = new Set();
  const assetCache = new Map();
  for (const analysis of analysisPlan.analyses) {
    const relativePath = `requests/${analysis.analysisId}.json`;
    const request = JSON.parse((await observe(relativePath)).toString("utf8"));
    validateFrozenRequestContract(request);
    assert.equal(request.analysisId, analysis.analysisId);
    assert.equal(request.canonicalObjectId, analysis.objectId);
    assert.equal(request.customerPurpose, analysis.purpose);
    assert.equal(request.privateControlMaterialIncluded, false);
    assert.equal(request.executionAuthorized, false);
    assert.equal(request.inputAssets.length, 2, `${request.analysisId} must bind exactly two sanitized photos`);
    assert.equal(requestHashes.has(request.requestContractHash), false, `${request.analysisId} request hash is duplicated`);
    requestHashes.add(request.requestContractHash);
    for (const asset of request.inputAssets) {
      assert.match(asset.frozenRelativePath, /^assets\/V2-OBJ-(?:00[1-9]|01[0-4])\/V2-OBJ-(?:00[1-9]|01[0-4])-[AB]\.(?:jpg|jpeg|png|webp)$/);
      if (!assetCache.has(asset.frozenRelativePath)) {
        const bytes = await observe(asset.frozenRelativePath);
        assert.equal(bytes.length, asset.bytes, `${asset.frozenRelativePath} byte count changed`);
        assert.equal(sha256Bytes(bytes), asset.sha256, `${asset.frozenRelativePath} hash changed`);
        assetCache.set(asset.frozenRelativePath, bytes);
      }
    }
    requests.push(Object.freeze(request));
  }
  assert.equal(requests.length, 26);
  assert.equal(requestHashes.size, 26);
  assert.equal(assetCache.size, 28);
  assert.deepEqual(requests.map((request) => request.requestContractHash), manifest.requestContractHashes);
  assert.equal(sha256Json(requests.map((request) => ({ analysisId: request.analysisId, requestContractHash: request.requestContractHash }))), manifest.requestAggregateHash);
  return Object.freeze({ root, manifest, receipt, analysisPlan, requests: Object.freeze(requests), assetCache });
}

export async function createExclusiveReservation(storeRoot, reservation, { zeroExternalSupersessionReceipt = null, terminalFailureReceipt = null, unusedConsentRevocationReceipt = null, releaseIdentity = null } = {}) {
  validateInvocationReservation(reservation);
  if (zeroExternalSupersessionReceipt && !terminalFailureReceipt && !unusedConsentRevocationReceipt) {
    const { validateZeroExternalSupersessionReceipt } = await import("./pre-external-recovery-protocol.mjs");
    validateZeroExternalSupersessionReceipt(zeroExternalSupersessionReceipt, {
      receiptId: reservation.zeroExternalSupersessionReceiptId,
      receiptHash: reservation.zeroExternalSupersessionReceiptHash,
      successorExecutionReleaseRecordHash: reservation.executionReleaseRecordHash,
      successorExecutorRuntimeHead: reservation.executorRuntimeHead,
      successorQualificationHead: reservation.qualificationHead,
      successorExecutorVersion: reservation.executorVersion
    });
  } else if (zeroExternalSupersessionReceipt || terminalFailureReceipt || unusedConsentRevocationReceipt) {
    const { validateContinuationReleaseChain } = await import("./consent-revocation.mjs");
    const releaseChain = validateContinuationReleaseChain({ releaseIdentity, zeroExternalSupersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt });
    assert.equal(reservation.zeroExternalSupersessionReceiptId, zeroExternalSupersessionReceipt.receiptId);
    assert.equal(reservation.zeroExternalSupersessionReceiptHash, zeroExternalSupersessionReceipt.receiptHash);
    assert.equal(reservation.terminalFailureReceiptId, terminalFailureReceipt.receiptId);
    assert.equal(reservation.terminalFailureReceiptHash, terminalFailureReceipt.receiptHash);
    assert.equal(reservation.unusedConsentRevocationReceiptId, unusedConsentRevocationReceipt.receiptId);
    assert.equal(reservation.unusedConsentRevocationReceiptHash, unusedConsentRevocationReceipt.receiptHash);
    assert.equal(reservation.releaseChainHash, releaseChain.releaseChainHash);
    assert.equal(reservation.executionReleaseRecordHash, releaseChain.version1123ExecutionReleaseRecordHash);
  }
  const root = path.resolve(storeRoot);
  await mkdir(root, { recursive: true });
  await assertNoReparseChain(root, root);
  const files = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
  let supersededReservationObserved = false;
  let terminalFailedReservationObserved = false;
  for (const entry of files) {
    const existing = await readJsonStrictFile(path.join(root, entry.name));
    let legacySupersededReservation = false;
    let legacyContinuationReservation = false;
    try {
      validateInvocationReservation(existing);
    } catch (error) {
      legacySupersededReservation = Boolean(zeroExternalSupersessionReceipt)
        && existing?.schemaVersion === "1.0"
        && existing?.executorVersion === "1.12.20"
        && existing?.invocationId === zeroExternalSupersessionReceipt.supersededInvocationId
        && existing?.reservationId === zeroExternalSupersessionReceipt.supersededReservationId
        && existing?.reservationHash === zeroExternalSupersessionReceipt.sourceReservationHash
        && existing?.consentHash === zeroExternalSupersessionReceipt.sourceConsentHash
        && existing?.state === "STARTED";
      legacyContinuationReservation = Boolean(terminalFailureReceipt)
        && existing?.schemaVersion === "1.1"
        && existing?.executorVersion === "1.12.21"
        && existing?.invocationId === terminalFailureReceipt.sourceInvocationId
        && existing?.reservationId === terminalFailureReceipt.sourceReservationId
        && existing?.reservationHash === terminalFailureReceipt.sourceReservationHash
        && existing?.state === "STARTED";
      if (!legacySupersededReservation && !legacyContinuationReservation) throw error;
      if (legacySupersededReservation) supersededReservationObserved = true;
      if (legacyContinuationReservation) terminalFailedReservationObserved = true;
    }
    for (const field of ["invocationId", "reservationId", "resultId", "resultRootName"]) assertNoTruncatedIdentityCollision(existing, reservation, field);
    const sameIdentity = existing.invocationId === reservation.invocationId
      || existing.reservationId === reservation.reservationId
      || existing.consentHash === reservation.consentHash
      || existing.resultId === reservation.resultId
      || existing.resultRootName === reservation.resultRootName
      || existing.launchScopeHash === reservation.launchScopeHash
      || existing.completeFrozenAggregateHash === reservation.completeFrozenAggregateHash;
    if (!sameIdentity) continue;
    if (existing.recordHash === reservation.recordHash) {
      assert.equal(zeroExternalSupersessionReceipt, null, "zero-external supersession receipt is already consumed by this reservation");
      return Object.freeze({ status: "EXISTING_IDENTICAL_READBACK", reservation: existing, filePath: path.join(root, entry.name) });
    }
    if (legacySupersededReservation || legacyContinuationReservation) continue;
    assert.fail("a conflicting reservation already owns the invocation, consent, result, or freeze aggregate");
  }
  if (zeroExternalSupersessionReceipt) assert.equal(supersededReservationObserved, true, "superseded legacy reservation proof is absent");
  if (terminalFailureReceipt) assert.equal(terminalFailedReservationObserved, true, "terminal Version 1.12.21 reservation proof is absent");
  const filePath = path.join(root, `${reservation.invocationId}.json`);
  await writeExclusiveSynced(filePath, reservation);
  const readback = await readJsonStrictFile(filePath);
  validateInvocationReservation(readback);
  assert.deepEqual(readback, reservation, "reservation readback differs");
  return Object.freeze({ status: "CREATED", reservation: readback, filePath });
}

export async function replaceReservation(filePath, reservation) {
  validateInvocationReservation(reservation);
  const current = await readJsonStrictFile(filePath);
  validateInvocationReservation(current);
  assert.equal(current.reservationHash, reservation.reservationHash, "reservation identity cannot change during transition");
  await replaceSynced(filePath, reservation);
  const readback = await readJsonStrictFile(filePath);
  assert.deepEqual(readback, reservation);
  return readback;
}

export async function createExclusiveResultRoot(resultHistoryRoot, resultId) {
  const history = path.resolve(resultHistoryRoot);
  const resultRoot = deriveResultRoot(history, resultId);
  await mkdir(history, { recursive: true });
  await assertNoReparseChain(history, history);
  await mkdir(resultRoot);
  const resultStat = await lstat(resultRoot);
  assert.equal(resultStat.isDirectory(), true);
  assert.equal(resultStat.isSymbolicLink(), false);
  await mkdir(path.join(resultRoot, "responses"));
  await mkdir(path.join(resultRoot, HANDLER_RETURNED_DIRECTORY));
  return resultRoot;
}

export async function writeResultFile(resultRoot, relativePath, value, { replace = false } = {}) {
  classifyResultArtifactPath(relativePath);
  const allowed = new Set([".json"]);
  const absolute = resolveWithin(resultRoot, relativePath, { extensions: allowed });
  await assertNoReparseChain(resultRoot, path.dirname(absolute));
  if (replace) await replaceSynced(absolute, value);
  else await writeExclusiveSynced(absolute, value);
  return absolute;
}

export async function computeResultTreeAggregate(resultRoot, relativePaths) {
  const records = [];
  const seen = new Set();
  for (const relativePath of [...relativePaths].sort()) {
    classifyResultArtifactPath(relativePath);
    assert.equal(seen.has(relativePath), false, `duplicate result aggregate path ${relativePath}`);
    seen.add(relativePath);
    const absolute = resolveWithin(resultRoot, relativePath, { extensions: new Set([".json"]) });
    const fileStat = await lstat(absolute);
    assert.equal(fileStat.isSymbolicLink(), false, `result file is a symlink: ${relativePath}`);
    assert.equal(fileStat.isFile(), true, `result path is not a file: ${relativePath}`);
    const bytes = await readFile(absolute);
    records.push({ relativePath, bytes: bytes.length, sha256: sha256Bytes(bytes) });
  }
  return Object.freeze({ records: Object.freeze(records), aggregate: sha256Json(records) });
}

export async function listResultFiles(resultRoot, { terminalKind = "SUCCESS" } = {}) {
  const root = path.resolve(resultRoot);
  const rootStat = await lstat(root);
  assert.equal(rootStat.isDirectory(), true, "result root is not a directory");
  assert.equal(rootStat.isSymbolicLink(), false, "result root is a symlink or reparse point");
  const records = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const absolute = path.join(current, entry.name);
      const relativePath = path.relative(root, absolute).replaceAll("\\", "/");
      const entryStat = await lstat(absolute);
      assert.equal(entry.isSymbolicLink() || entryStat.isSymbolicLink(), false, `result tree contains a symlink or reparse point: ${relativePath}`);
      if (entry.isDirectory()) {
        assert.equal(entryStat.isDirectory(), true, `result tree directory metadata differs: ${relativePath}`);
        classifyResultArtifactPath(relativePath, { kind: "directory" });
        await walk(absolute);
      } else {
        assert.equal(entry.isFile() && entryStat.isFile(), true, `result tree contains a non-file entry: ${relativePath}`);
        classifyResultArtifactPath(relativePath);
        records.push(relativePath);
      }
    }
  }
  await walk(root);
  return classifyResultArtifactInventory(records, { terminalKind }).relativePaths;
}

export async function assertNoRealAuthorityArtifacts() {
  const candidates = [
    path.join(benchmarkRoot, "consent"),
    path.join(benchmarkRoot, "invocations"),
    path.join(benchmarkRoot, "results"),
    defaultResultHistoryRoot
  ];
  const found = [];
  for (const candidate of candidates) if (await stat(candidate, { throwIfNoEntry: false })) found.push(candidate);
  assert.deepEqual(found, [], "real V2 execution authority or result artifacts exist");
  return true;
}
