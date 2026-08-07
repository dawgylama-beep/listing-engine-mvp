import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import {
  BENCHMARK_ID,
  FREEZE_CONSTRUCTION_STATE,
  PREPARATION_STATE,
  buildLegacyV1RejectionIndex,
  createAwaitingPreparationReceipt,
  freezeBenchmark,
  parseJsonStrict
} from "./protocol.mjs";
import { persistFrozenBenchmark } from "./freeze-store.mjs";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(benchmarkRoot, "..", "..");

async function readJson(filePath) {
  return parseJsonStrict(await readFile(filePath, "utf8"), filePath);
}

async function exists(filePath) {
  return Boolean(await stat(filePath, { throwIfNoEntry: false }));
}

function currentCommit() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
}

function assertTrackedReleaseClean() {
  execFileSync("git", ["diff", "--quiet"], { cwd: repositoryRoot, windowsHide: true });
  execFileSync("git", ["diff", "--cached", "--quiet"], { cwd: repositoryRoot, windowsHide: true });
}

async function currentVersion() {
  return (await readJson(path.join(repositoryRoot, "package.json"))).version;
}

function assertFixedAssetPath(assetPath) {
  assert.match(assetPath || "", /^assets\/v2-obj-(?:00[1-9]|01[0-4])-[a-d]\.(?:jpg|jpeg|png|webp)$/);
  const absolute = path.resolve(benchmarkRoot, "intake", ...assetPath.split("/"));
  const intakeAssetRoot = path.resolve(benchmarkRoot, "intake", "assets");
  const relative = path.relative(intakeAssetRoot, absolute);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "intake asset path escapes the fixed asset root");
  return absolute;
}

export async function runPreparation(options = {}) {
  const allowedOptions = ["persist", "resultHistoryRoot", "root", "storageRootOverrideForTest", "v1Root"];
  assert.equal(Object.keys(options).every((key) => allowedOptions.includes(key)), true, "preparation options contain a release override or unsupported field");
  const {
    root = benchmarkRoot,
    v1Root = path.join(repositoryRoot, "benchmarks", "blind-object-v1"),
    resultHistoryRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results"),
    persist = false,
    storageRootOverrideForTest
  } = options;
  assert.equal(path.resolve(root), benchmarkRoot, "the real preparation command is fixed to the benchmark V2 root");
  const sourceRepositoryHead = currentCommit();
  const resolvedVersion = await currentVersion();
  const [benchmarkSpec, coverageContract, scoringContract] = await Promise.all([
    readJson(path.join(root, "benchmark-spec.json")),
    readJson(path.join(root, "coverage-contract.json")),
    readJson(path.join(root, "scoring-contract.json"))
  ]);
  assert.equal(benchmarkSpec.benchmarkId, BENCHMARK_ID);
  assert.equal(benchmarkSpec.preparationOnly, true);
  assert.equal(benchmarkSpec.preparationSafety.benchmarkExecutionAuthorized, false);

  const intakePath = path.join(root, "intake", "input-manifest.json");
  const controlsPath = path.join(root, "private", "private-controls.json");
  const releaseBoundaryPath = path.join(root, "intake", "release-boundary.json");
  const analysisPlanPath = path.join(root, "intake", "analysis-plan.json");
  const provenancePath = path.join(root, "private", "provenance.json");
  const sourceOriginalManifestPath = path.join(root, "private", "source-originals-manifest.json");
  const fixedInputPaths = [intakePath, controlsPath, releaseBoundaryPath, analysisPlanPath, provenancePath, sourceOriginalManifestPath];
  const presence = await Promise.all(fixedInputPaths.map(exists));
  const [intakePresent, controlsPresent] = presence;
  if (presence.every((value) => value === false)) {
    const receipt = createAwaitingPreparationReceipt({ benchmarkSpec, coverageContract, scoringContract, sourceCommit: sourceRepositoryHead, version: resolvedVersion });
    return Object.freeze({
      status: "PASS",
      state: PREPARATION_STATE.AWAITING_NEW_HOLDOUT_INPUTS,
      receipt,
      inputManifestPresent: false,
      privateControlsPresent: false,
      newAuthorizedObjectCount: 0,
      frozenRequestCount: 0,
      generatedFileCount: 0,
      consentReceiptCreated: false,
      invocationReservationCreated: false,
      benchmarkExecutionCount: 0,
      providerCallCount: 0,
      networkRequestCount: 0
    });
  }
  assert.equal(presence.every(Boolean), true, "partial freeze intake is INVALID: every fixed release, intake, private-control, plan, provenance, and source-original manifest is required");
  assertTrackedReleaseClean();

  const [intakeManifest, privateControls, packageBoundary, analysisPlan, provenance, sourceOriginalManifest, legacyIndex] = await Promise.all([
    readJson(intakePath),
    readJson(controlsPath),
    readJson(releaseBoundaryPath),
    readJson(analysisPlanPath),
    readJson(provenancePath),
    readJson(sourceOriginalManifestPath),
    buildLegacyV1RejectionIndex({ v1Root, resultHistoryRoot })
  ]);
  const assetBytesByPath = new Map();
  for (const object of intakeManifest.objects || []) {
    for (const photo of object.photos || []) {
      const absolute = assertFixedAssetPath(photo.path);
      assetBytesByPath.set(photo.path, await readFile(absolute));
    }
  }
  assert.deepEqual(Object.keys(sourceOriginalManifest).sort(), ["benchmarkId", "records", "schemaVersion", "visibility"].sort(), "source-original manifest fields are invalid");
  assert.equal(sourceOriginalManifest.benchmarkId, BENCHMARK_ID);
  assert.equal(sourceOriginalManifest.visibility, "PRIVATE_EVALUATOR_ONLY");
  assert.ok(Array.isArray(sourceOriginalManifest.records));
  const sourceOriginalBytesByPath = new Map();
  for (const record of sourceOriginalManifest.records) {
    const absolute = path.resolve(root, "private", ...record.evaluatorOnlyRelativePath.split("/"));
    const privateRoot = path.resolve(root, "private");
    const relative = path.relative(privateRoot, absolute);
    assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "source-original path escapes the fixed private root");
    sourceOriginalBytesByPath.set(record.evaluatorOnlyRelativePath, await readFile(absolute));
  }
  const frozen = freezeBenchmark({
    intakeManifest,
    privateControls,
    benchmarkSpec,
    coverageContract,
    scoringContract,
    assetBytesByPath,
    sourceOriginalInventory: sourceOriginalManifest.records,
    sourceOriginalBytesByPath,
    provenanceRecords: provenance.records,
    analysisPlan,
    packageBoundary,
    legacyIndex,
    sourceRepositoryHead,
    sourceVersion: resolvedVersion
  });
  const persistence = persist ? await persistFrozenBenchmark({
    frozen,
    intakeManifest,
    privateControls,
    assetBytesByPath,
    sourceOriginalBytesByPath,
    storageRootOverrideForTest
  }) : null;
  return Object.freeze({
    status: "PASS",
    state: persistence?.state || FREEZE_CONSTRUCTION_STATE.DRY_RUN_VALIDATED,
    constructionState: persistence?.constructionState || FREEZE_CONSTRUCTION_STATE.DRY_RUN_VALIDATED,
    freezeManifest: frozen.freezeManifest,
    inMemoryFreezeReceiptHash: frozen.freezeReceipt.receiptHash,
    inputManifestPresent: true,
    privateControlsPresent: true,
    newAuthorizedObjectCount: intakeManifest.objects.length,
    frozenRequestCount: frozen.requestContracts.length,
    generatedFileCount: persistence?.generatedFileCount || 0,
    freezeReceiptCreated: Boolean(persistence && !persistence.existingIdenticalFreezeReadback),
    existingIdenticalFreezeReadback: Boolean(persistence?.existingIdenticalFreezeReadback),
    consentReceiptCreated: false,
    invocationReservationCreated: false,
    benchmarkExecutionCount: 0,
    providerCallCount: 0,
    networkRequestCount: 0
  });
}

async function cli() {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 1 && args[0] === "--persist-freeze"), "usage: node prepare-benchmark.mjs [--persist-freeze]");
  const result = await runPreparation({ persist: args[0] === "--persist-freeze" });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
