import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import {
  BENCHMARK_ID,
  PREPARATION_STATE,
  buildLegacyV1RejectionIndex,
  createAwaitingPreparationReceipt,
  freezeBenchmark
} from "./protocol.mjs";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(benchmarkRoot, "..", "..");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function exists(filePath) {
  return Boolean(await stat(filePath, { throwIfNoEntry: false }));
}

function currentCommit() {
  return execFileSync("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
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

export async function runPreparation({
  root = benchmarkRoot,
  sourceCommit = currentCommit(),
  version,
  v1Root = path.join(repositoryRoot, "benchmarks", "blind-object-v1"),
  resultHistoryRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results")
} = {}) {
  assert.equal(path.resolve(root), benchmarkRoot, "the real preparation command is fixed to the benchmark V2 root");
  const resolvedVersion = version || await currentVersion();
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
  const intakePresent = await exists(intakePath);
  const controlsPresent = await exists(controlsPath);
  if (!intakePresent && !controlsPresent) {
    const receipt = createAwaitingPreparationReceipt({ benchmarkSpec, coverageContract, scoringContract, sourceCommit, version: resolvedVersion });
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
  assert.equal(intakePresent, true, "partial intake is INVALID: input manifest missing");
  assert.equal(controlsPresent, true, "partial intake is INVALID: private controls missing");

  const [intakeManifest, privateControls, legacyIndex] = await Promise.all([
    readJson(intakePath),
    readJson(controlsPath),
    buildLegacyV1RejectionIndex({ v1Root, resultHistoryRoot })
  ]);
  const assetBytesByPath = new Map();
  for (const object of intakeManifest.objects || []) {
    for (const photo of object.photos || []) {
      const absolute = assertFixedAssetPath(photo.path);
      assetBytesByPath.set(photo.path, await readFile(absolute));
    }
  }
  const frozen = freezeBenchmark({
    intakeManifest,
    privateControls,
    coverageContract,
    scoringContract,
    assetBytesByPath,
    legacyIndex,
    sourceCommit,
    version: resolvedVersion
  });
  return Object.freeze({
    status: "PASS",
    state: frozen.state,
    freezeManifest: frozen.freezeManifest,
    inputManifestPresent: true,
    privateControlsPresent: true,
    newAuthorizedObjectCount: intakeManifest.objects.length,
    frozenRequestCount: frozen.requestContracts.length,
    generatedFileCount: 0,
    consentReceiptCreated: false,
    invocationReservationCreated: false,
    benchmarkExecutionCount: 0,
    providerCallCount: 0,
    networkRequestCount: 0
  });
}

async function cli() {
  assert.equal(process.argv.length, 2, "Phase 7B preparation accepts no arguments and cannot execute a benchmark");
  const result = await runPreparation();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
