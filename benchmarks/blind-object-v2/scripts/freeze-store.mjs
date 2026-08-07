import assert from "node:assert/strict";
import { mkdtemp, mkdir, open, readFile, readdir, rename, rm, lstat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BENCHMARK_ID,
  FREEZE_CONSTRUCTION_STATE,
  PREPARATION_STATE,
  sha256Bytes,
  sha256Json,
  stableJson,
  validateFreezeManifest,
  validateFreezeReceipt,
  validateFrozenRequestContract
} from "./protocol.mjs";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultFreezesRoot = path.join(benchmarkRoot, "prepared", "freezes");
const HASH = /^[a-f0-9]{64}$/;
const SAFE_RELATIVE_FILE = /^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*:)[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/;
const SAFE_EXTENSIONS = new Set([".json", ".jpg", ".jpeg", ".png", ".webp"]);

function jsonBytes(value) {
  return Buffer.from(`${stableJson(value)}\n`, "utf8");
}

function assertSafeRelativeFile(relativePath) {
  assert.match(relativePath || "", SAFE_RELATIVE_FILE, `unsafe freeze artifact path: ${relativePath}`);
  assert.ok(SAFE_EXTENSIONS.has(path.extname(relativePath).toLowerCase()), `executable or unsupported freeze artifact extension: ${relativePath}`);
  return relativePath;
}

function resolveWithin(root, relativePath) {
  assertSafeRelativeFile(relativePath);
  const absolute = path.resolve(root, ...relativePath.split("/"));
  const relative = path.relative(root, absolute);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), `freeze artifact escapes root: ${relativePath}`);
  return absolute;
}

function sourceExtension(relativePath) {
  const extension = path.extname(relativePath).toLowerCase();
  assert.ok([".jpg", ".jpeg", ".png", ".webp"].includes(extension), "source-original extension is unsupported");
  return extension;
}

function artifactPlan({ frozen, intakeManifest, privateControls, assetBytesByPath, sourceOriginalBytesByPath }) {
  validateFreezeManifest(frozen.freezeManifest);
  validateFreezeReceipt(frozen.freezeReceipt, frozen.freezeManifest);
  frozen.requestContracts.forEach(validateFrozenRequestContract);
  assert.equal(frozen.state, PREPARATION_STATE.FROZEN_AWAITING_CONSENT);
  assert.equal(frozen.constructionState, FREEZE_CONSTRUCTION_STATE.DRY_RUN_VALIDATED);
  assert.ok(assetBytesByPath instanceof Map);
  assert.ok(sourceOriginalBytesByPath instanceof Map);
  const intakePhotoById = new Map(intakeManifest.objects.flatMap((object) => object.photos.map((photo) => [photo.assetId, photo])));
  const entries = [];
  const add = (relativePath, bytes, privacyClass) => {
    assertSafeRelativeFile(relativePath);
    const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    entries.push(Object.freeze({ relativePath, bytes: buffer, sha256: sha256Bytes(buffer), privacyClass }));
  };
  add("freeze-manifest.json", jsonBytes(frozen.freezeManifest), "PUBLIC_FREEZE_AUTHORITY");
  add("source-package-boundary.json", jsonBytes({ schemaVersion: "1.0", benchmarkId: BENCHMARK_ID, ...frozen.packageBoundary }), "PUBLIC_FREEZE_BOUNDARY");
  add("analysis-plan.json", jsonBytes(frozen.analysisPlan), "PUBLIC_CANDIDATE_PLAN");
  for (const request of frozen.requestContracts) add(`requests/${request.analysisId}.json`, jsonBytes(request), "PUBLIC_FROZEN_REQUEST");
  for (const asset of frozen.sanitizedInputInventory) {
    const intakePhoto = intakePhotoById.get(asset.photoId);
    assert.ok(intakePhoto, `missing intake photo for ${asset.photoId}`);
    const bytes = assetBytesByPath.get(intakePhoto.path);
    assert.ok(bytes, `missing sanitized bytes for ${asset.photoId}`);
    assert.equal(Buffer.byteLength(bytes), asset.bytes);
    assert.equal(sha256Bytes(bytes), asset.sha256);
    add(asset.frozenRelativePath, bytes, "PUBLIC_FROZEN_INPUT");
  }
  add("evaluator-only/private-controls.json", jsonBytes(privateControls), "PRIVATE_EVALUATOR_ONLY");
  add("evaluator-only/provenance.json", jsonBytes({ schemaVersion: "1.0", benchmarkId: BENCHMARK_ID, visibility: "PRIVATE_EVALUATOR_ONLY", records: frozen.provenanceRecords }), "PRIVATE_EVALUATOR_ONLY");
  for (const original of frozen.sourceOriginalInventory) {
    const bytes = sourceOriginalBytesByPath.get(original.evaluatorOnlyRelativePath);
    assert.ok(bytes, `missing source-original bytes for ${original.photoId}`);
    assert.equal(Buffer.byteLength(bytes), original.bytes);
    assert.equal(sha256Bytes(bytes), original.sha256);
    add(`evaluator-only/source-originals/${original.canonicalObjectId}/${original.photoId}${sourceExtension(original.evaluatorOnlyRelativePath)}`, bytes, "PRIVATE_EVALUATOR_ONLY");
  }
  const validationReport = {
    schemaVersion: "1.0",
    benchmarkId: BENCHMARK_ID,
    validationState: "PERSISTENCE_PLAN_VALIDATED",
    completeFrozenAggregateHash: frozen.freezeManifest.completeFrozenAggregateHash,
    freezeManifestHash: frozen.freezeManifest.freezeManifestHash,
    requestCount: frozen.requestContracts.length,
    sanitizedPhotoCount: frozen.sanitizedInputInventory.length,
    sourceOriginalCount: frozen.sourceOriginalInventory.length,
    executionAuthorized: false,
    consentReceiptCreated: false,
    invocationReservationCreated: false,
    providerCallCount: 0,
    networkRequestCount: 0,
    benchmarkExecutionCount: 0
  };
  add("validation-report.json", jsonBytes(validationReport), "PUBLIC_VALIDATION_RECORD");
  add("freeze-receipt.json", jsonBytes(frozen.freezeReceipt), "PUBLIC_FREEZE_AUTHORITY");
  const paths = entries.map((entry) => entry.relativePath);
  assert.equal(new Set(paths).size, paths.length, "freeze artifact plan contains duplicate paths");
  return Object.freeze(entries);
}

async function writeSyncedFile(filePath, bytes) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const handle = await open(filePath, "wx", 0o600);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function lstatIfExists(filePath) {
  try {
    return await lstat(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function assertSafeDirectoryChain(trustedRoot, target) {
  const root = path.resolve(trustedRoot);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(root, resolvedTarget);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "freeze storage root escapes its trusted boundary");
  let current = root;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    const currentStat = await lstatIfExists(current);
    if (!currentStat) break;
    assert.equal(currentStat.isSymbolicLink(), false, `freeze storage path contains a symlink or reparse entry: ${current}`);
    assert.equal(currentStat.isDirectory(), true, `freeze storage path contains a non-directory entry: ${current}`);
  }
}

function validatePersistenceBindings(frozen, intakeManifest, privateControls) {
  const manifest = frozen.freezeManifest;
  assert.equal(sha256Json(intakeManifest), manifest.publicIntakeManifestHash, "public intake hash changed before persistence");
  assert.equal(sha256Json(privateControls), manifest.privateControlAggregateHash, "private-control aggregate changed before persistence");
  assert.equal(sha256Json(frozen.sanitizedInputInventory), manifest.sanitizedInputAggregateHash, "sanitized-input aggregate changed before persistence");
  assert.equal(sha256Json(frozen.sourceOriginalInventory), manifest.sourceOriginalAggregateHash, "source-original aggregate changed before persistence");
  assert.equal(sha256Json(frozen.provenanceRecords), manifest.provenanceAggregateHash, "provenance aggregate changed before persistence");
  assert.equal(sha256Json(frozen.analysisPlan), manifest.analysisPlanHash, "analysis-plan hash changed before persistence");
  const requestHashRecords = frozen.requestContracts.map((request) => ({ analysisId: request.analysisId, requestContractHash: request.requestContractHash }));
  assert.equal(sha256Json(requestHashRecords), manifest.requestAggregateHash, "request aggregate changed before persistence");
  assert.deepEqual(frozen.requestContracts.map((request) => request.requestContractHash), manifest.requestContractHashes, "request-hash inventory changed before persistence");
  const sanitizedByPhoto = new Map(frozen.sanitizedInputInventory.map((asset) => [asset.photoId, asset]));
  for (const request of frozen.requestContracts) {
    for (const asset of request.inputAssets) {
      const { canonicalObjectId, ...expectedRequestAsset } = sanitizedByPhoto.get(asset.photoId) || {};
      assert.equal(canonicalObjectId, request.canonicalObjectId, `${request.analysisId} request asset belongs to a different object`);
      assert.deepEqual(asset, expectedRequestAsset, `${request.analysisId} request asset differs from the sanitized inventory`);
    }
  }
  const completeCore = {
    freezeSchemaVersion: manifest.schemaVersion,
    benchmarkId: manifest.benchmarkId,
    candidateSetId: manifest.candidateSetId,
    canonicalObjectIdNamespace: manifest.canonicalObjectIdNamespace,
    sourceRepositoryHead: manifest.sourceRepositoryHead,
    sourceVersion: manifest.sourceVersion,
    sourcePackageSha256: manifest.sourcePackageSha256,
    sourcePackageBytes: manifest.sourcePackageBytes,
    packageManifestFileHash: manifest.packageManifestFileHash,
    checksumFileHash: manifest.checksumFileHash,
    sanitizedInputAggregateHash: manifest.sanitizedInputAggregateHash,
    sourceOriginalAggregateHash: manifest.sourceOriginalAggregateHash,
    publicIntakeManifestHash: manifest.publicIntakeManifestHash,
    privateControlAggregateHash: manifest.privateControlAggregateHash,
    provenanceAggregateHash: manifest.provenanceAggregateHash,
    analysisPlanHash: manifest.analysisPlanHash,
    requestAggregateHash: manifest.requestAggregateHash,
    specificationHash: manifest.specificationHash,
    coverageHash: manifest.coverageHash,
    scoringHash: manifest.scoringHash,
    objectCount: manifest.objectCount,
    sanitizedPhotoCount: manifest.sanitizedPhotoCount,
    sourceOriginalCount: manifest.sourceOriginalCount,
    requestCount: manifest.requestCount,
    anchorObjectCount: manifest.anchorObjectCount,
    laneCounts: manifest.laneCounts,
    primaryPurposeCounts: manifest.primaryPurposeCounts,
    analysisPurposeCounts: manifest.analysisPurposeCounts
  };
  assert.deepEqual(frozen.completeFrozenAggregatePreimage, completeCore, "complete frozen aggregate preimage changed before persistence");
  assert.equal(sha256Json(completeCore), manifest.completeFrozenAggregateHash, "complete frozen aggregate hash changed before persistence");
  return true;
}

async function collectFiles(root, current = root, records = []) {
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    assert.equal(entry.isSymbolicLink(), false, `freeze tree contains a symlink or reparse entry: ${absolute}`);
    if (entry.isDirectory()) await collectFiles(root, absolute, records);
    else {
      assert.equal(entry.isFile(), true, `freeze tree contains a non-file entry: ${absolute}`);
      records.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  }
  return records;
}

async function verifyTree(root, plan) {
  const rootStat = await lstat(root);
  assert.equal(rootStat.isDirectory(), true, "freeze root is not a directory");
  assert.equal(rootStat.isSymbolicLink(), false, "freeze root cannot be a symlink or reparse point");
  const actualPaths = (await collectFiles(root)).sort();
  const plannedPaths = plan.map((entry) => entry.relativePath).sort();
  assert.deepEqual(actualPaths, plannedPaths, "freeze tree is partial, corrupt, or contains unexpected files");
  for (const entry of plan) {
    const bytes = await readFile(resolveWithin(root, entry.relativePath));
    assert.equal(bytes.length, entry.bytes.length, `${entry.relativePath} byte count mismatch after persistence`);
    assert.equal(sha256Bytes(bytes), entry.sha256, `${entry.relativePath} hash mismatch after persistence`);
    assert.deepEqual(bytes, entry.bytes, `${entry.relativePath} bytes differ after persistence`);
  }
  return true;
}

function resolveFreezesRoot(storageRootOverrideForTest) {
  if (!storageRootOverrideForTest) return defaultFreezesRoot;
  const resolved = path.resolve(storageRootOverrideForTest);
  const temporaryRoot = path.resolve(os.tmpdir());
  const relative = path.relative(temporaryRoot, resolved);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "test freeze root must remain under the operating-system temporary directory");
  return resolved;
}

export async function persistFrozenBenchmark({
  frozen,
  intakeManifest,
  privateControls,
  assetBytesByPath,
  sourceOriginalBytesByPath,
  storageRootOverrideForTest,
  failureAfterFileCountForTest
}) {
  const plan = artifactPlan({ frozen, intakeManifest, privateControls, assetBytesByPath, sourceOriginalBytesByPath });
  validatePersistenceBindings(frozen, intakeManifest, privateControls);
  const completeHash = frozen.freezeManifest.completeFrozenAggregateHash;
  assert.match(completeHash || "", HASH);
  const freezesRoot = resolveFreezesRoot(storageRootOverrideForTest);
  const trustedRoot = storageRootOverrideForTest ? path.resolve(os.tmpdir()) : benchmarkRoot;
  await assertSafeDirectoryChain(trustedRoot, freezesRoot);
  const finalRoot = path.join(freezesRoot, completeHash);
  assert.equal(finalRoot, path.resolve(freezesRoot, completeHash), "freeze root must be hash-addressed");
  if (await lstatIfExists(finalRoot)) {
    await verifyTree(finalRoot, plan);
    return Object.freeze({
      status: "PASS",
      constructionState: FREEZE_CONSTRUCTION_STATE.EXISTING_IDENTICAL_FREEZE_READBACK,
      state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
      frozenArtifactRoot: frozen.freezeManifest.frozenArtifactRoot,
      completeFrozenAggregateHash: completeHash,
      freezeManifestHash: frozen.freezeManifest.freezeManifestHash,
      receiptHash: frozen.freezeReceipt.receiptHash,
      generatedFileCount: 0,
      existingIdenticalFreezeReadback: true,
      executionAuthorized: false
    });
  }
  await mkdir(freezesRoot, { recursive: true });
  await assertSafeDirectoryChain(trustedRoot, freezesRoot);
  const temporaryRoot = await mkdtemp(path.join(freezesRoot, `.${completeHash}.pending-`));
  let renamed = false;
  try {
    const receiptEntry = plan.find((entry) => entry.relativePath === "freeze-receipt.json");
    const preReceipt = plan.filter((entry) => entry !== receiptEntry);
    let written = 0;
    for (const entry of preReceipt) {
      await writeSyncedFile(resolveWithin(temporaryRoot, entry.relativePath), entry.bytes);
      written += 1;
      if (failureAfterFileCountForTest && written === failureAfterFileCountForTest) throw new Error("synthetic atomic-write failure");
    }
    await verifyTreeSubset(temporaryRoot, preReceipt);
    await writeSyncedFile(resolveWithin(temporaryRoot, receiptEntry.relativePath), receiptEntry.bytes);
    await verifyTree(temporaryRoot, plan);
    try {
      await rename(temporaryRoot, finalRoot);
      renamed = true;
    } catch (error) {
      if (!await lstatIfExists(finalRoot)) throw error;
      await verifyTree(finalRoot, plan);
      await rm(temporaryRoot, { recursive: true, force: true });
      return Object.freeze({
        status: "PASS",
        constructionState: FREEZE_CONSTRUCTION_STATE.EXISTING_IDENTICAL_FREEZE_READBACK,
        state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
        frozenArtifactRoot: frozen.freezeManifest.frozenArtifactRoot,
        completeFrozenAggregateHash: completeHash,
        freezeManifestHash: frozen.freezeManifest.freezeManifestHash,
        receiptHash: frozen.freezeReceipt.receiptHash,
        generatedFileCount: 0,
        existingIdenticalFreezeReadback: true,
        executionAuthorized: false
      });
    }
    await verifyTree(finalRoot, plan);
    return Object.freeze({
      status: "PASS",
      constructionState: FREEZE_CONSTRUCTION_STATE.FROZEN_AWAITING_CONSENT,
      state: PREPARATION_STATE.FROZEN_AWAITING_CONSENT,
      frozenArtifactRoot: frozen.freezeManifest.frozenArtifactRoot,
      completeFrozenAggregateHash: completeHash,
      freezeManifestHash: frozen.freezeManifest.freezeManifestHash,
      receiptHash: frozen.freezeReceipt.receiptHash,
      generatedFileCount: plan.length,
      existingIdenticalFreezeReadback: false,
      executionAuthorized: false
    });
  } catch (error) {
    if (!renamed) await rm(temporaryRoot, { recursive: true, force: true });
    Object.defineProperty(error, "freezeConstructionState", { value: FREEZE_CONSTRUCTION_STATE.WRITE_FAILED, enumerable: true, configurable: true });
    throw error;
  }
}

async function verifyTreeSubset(root, plan) {
  const actualPaths = (await collectFiles(root)).sort();
  const plannedPaths = plan.map((entry) => entry.relativePath).sort();
  assert.deepEqual(actualPaths, plannedPaths, "pending freeze tree differs from its pre-receipt plan");
  for (const entry of plan) {
    const bytes = await readFile(resolveWithin(root, entry.relativePath));
    assert.deepEqual(bytes, entry.bytes, `${entry.relativePath} differs before receipt sealing`);
  }
  return true;
}

export function expectedFreezeArtifactPath(completeFrozenAggregateHash) {
  assert.match(completeFrozenAggregateHash || "", HASH);
  return `benchmarks/blind-object-v2/prepared/freezes/${completeFrozenAggregateHash}`;
}
