import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstat, readFile, stat } from "node:fs/promises";
import os from "node:os";
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
const REPOSITORY_STATE_SCHEMA_VERSION = "1.0";
const CONTROLLED_REPOSITORY_STATE_PROBES = new WeakSet();
const REPOSITORY_STATE_FIELDS = Object.freeze([
  "conflictedPaths",
  "head",
  "probeSucceeded",
  "processRoot",
  "repositoryRoot",
  "schemaVersion",
  "stagedTrackedPaths",
  "unstagedTrackedPaths",
  "version"
]);
const MAX_REPOSITORY_STATE_PATHS = 4096;
const MAX_REPOSITORY_PATH_LENGTH = 1024;

async function readJson(filePath) {
  return parseJsonStrict(await readFile(filePath, "utf8"), filePath);
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

function normalizedRepositoryPath(value, label) {
  assert.equal(typeof value, "string", `${label} must be text`);
  assert.ok(value.length > 0 && value.length <= MAX_REPOSITORY_PATH_LENGTH, `${label} length is invalid`);
  const resolved = path.resolve(value);
  assert.equal(value, resolved, `${label} must be an absolute normalized path`);
  return resolved;
}

function normalizedTrackedPaths(value, label) {
  assert.ok(Array.isArray(value), `${label} must be an array`);
  assert.ok(value.length <= MAX_REPOSITORY_STATE_PATHS, `${label} exceeds its bounded path count`);
  const normalized = value.map((entry) => {
    assert.equal(typeof entry, "string", `${label} entries must be text`);
    assert.ok(entry.length > 0 && entry.length <= MAX_REPOSITORY_PATH_LENGTH, `${label} contains an invalid path length`);
    assert.doesNotMatch(entry, /\\/, `${label} paths must use repository separators`);
    assert.equal(path.posix.isAbsolute(entry), false, `${label} paths must be relative`);
    assert.equal(path.posix.normalize(entry), entry, `${label} contains a non-canonical path`);
    assert.equal(entry.split("/").some((segment) => segment === ".." || segment === "."), false, `${label} contains a path operator`);
    return entry;
  });
  assert.equal(new Set(normalized).size, normalized.length, `${label} contains duplicate paths`);
  return Object.freeze([...normalized].sort());
}

export function validateRepositoryStateRecord(record) {
  assert.ok(record && typeof record === "object" && !Array.isArray(record), "repository-state record must be an object");
  assert.deepEqual(Object.keys(record).sort(), [...REPOSITORY_STATE_FIELDS], "repository-state record fields are invalid");
  assert.equal(record.schemaVersion, REPOSITORY_STATE_SCHEMA_VERSION, "repository-state schema version is invalid");
  assert.equal(typeof record.probeSucceeded, "boolean", "repository-state probe disposition must be boolean");
  assert.match(record.head || "", /^[a-f0-9]{40}$/, "repository-state HEAD is invalid");
  assert.match(record.version || "", /^\d+\.\d+\.\d+$/, "repository-state Version is invalid");
  return Object.freeze({
    schemaVersion: record.schemaVersion,
    probeSucceeded: record.probeSucceeded,
    repositoryRoot: normalizedRepositoryPath(record.repositoryRoot, "repository-state root"),
    processRoot: normalizedRepositoryPath(record.processRoot, "repository-state process root"),
    head: record.head,
    version: record.version,
    unstagedTrackedPaths: normalizedTrackedPaths(record.unstagedTrackedPaths, "unstaged tracked paths"),
    stagedTrackedPaths: normalizedTrackedPaths(record.stagedTrackedPaths, "staged tracked paths"),
    conflictedPaths: normalizedTrackedPaths(record.conflictedPaths, "conflicted paths")
  });
}

function parseTrackedStatus(output) {
  const unstagedTrackedPaths = new Set();
  const stagedTrackedPaths = new Set();
  const conflictedPaths = new Set();
  const conflicts = new Set(["DD", "AU", "UD", "UA", "DU", "AA", "UU"]);
  const records = output.split("\0");
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (!record) continue;
    assert.ok(record.length >= 4, "Git returned a malformed repository-state record");
    const state = record.slice(0, 2);
    const relativePath = record.slice(3).replaceAll("\\", "/");
    if (conflicts.has(state)) conflictedPaths.add(relativePath);
    if (state[0] !== " ") stagedTrackedPaths.add(relativePath);
    if (state[1] !== " ") unstagedTrackedPaths.add(relativePath);
    if (state[0] === "R" || state[0] === "C") index += 1;
  }
  return { unstagedTrackedPaths: [...unstagedTrackedPaths], stagedTrackedPaths: [...stagedTrackedPaths], conflictedPaths: [...conflictedPaths] };
}

export async function inspectRepositoryState() {
  try {
    const discoveredRoot = path.resolve(execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim());
    const head = currentCommit();
    const version = await currentVersion();
    const trackedStatus = execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=no"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true });
    return validateRepositoryStateRecord({
      schemaVersion: REPOSITORY_STATE_SCHEMA_VERSION,
      probeSucceeded: true,
      repositoryRoot: discoveredRoot,
      processRoot: path.resolve(process.cwd()),
      head,
      version,
      ...parseTrackedStatus(trackedStatus)
    });
  } catch (error) {
    throw new Error(`repository-state probe failed closed: ${error.message}`, { cause: error });
  }
}

export function createControlledRepositoryStateProbe(record) {
  const snapshot = validateRepositoryStateRecord(record);
  const probe = Object.freeze(async () => snapshot);
  CONTROLLED_REPOSITORY_STATE_PROBES.add(probe);
  return probe;
}

function assertRepositoryState(state, requiredIdentity) {
  assert.equal(state.probeSucceeded, true, "repository-state probe did not complete");
  assert.equal(state.repositoryRoot, repositoryRoot, "repository identity differs from the required repository root");
  assert.equal(state.processRoot, repositoryRoot, "the preparation process root is not the repository root");
  assert.equal(state.head, requiredIdentity.head, "repository HEAD differs from the required HEAD");
  assert.equal(state.version, requiredIdentity.version, "repository Version differs from the required Version");
  assert.deepEqual(state.conflictedPaths, [], "unmerged or conflicted tracked paths are forbidden");
  assert.deepEqual(state.unstagedTrackedPaths, [], "unstaged tracked source changes are forbidden");
  assert.deepEqual(state.stagedTrackedPaths, [], "staged tracked source changes are forbidden");
}

async function assertControlledNoInputRoot(root) {
  const temporaryRoot = path.resolve(os.tmpdir());
  const resolvedRoot = path.resolve(root);
  const relative = path.relative(temporaryRoot, resolvedRoot);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "controlled no-input root must remain under the operating-system temporary directory");
  let current = temporaryRoot;
  for (const segment of relative.split(path.sep)) {
    current = path.join(current, segment);
    const currentStat = await lstat(current);
    assert.equal(currentStat.isSymbolicLink(), false, `controlled no-input root contains a symlink or reparse point: ${current}`);
    assert.equal(currentStat.isDirectory(), true, `controlled no-input root contains a non-directory entry: ${current}`);
  }
  return resolvedRoot;
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
  const allowedOptions = ["persist", "repositoryStateProbe", "resultHistoryRoot", "root", "storageRootOverrideForTest", "v1Root"];
  assert.equal(Object.keys(options).every((key) => allowedOptions.includes(key)), true, "preparation options contain a release override or unsupported field");
  const {
    root = benchmarkRoot,
    v1Root = path.join(repositoryRoot, "benchmarks", "blind-object-v1"),
    resultHistoryRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results"),
    persist = false,
    repositoryStateProbe,
    storageRootOverrideForTest
  } = options;
  const controlledState = repositoryStateProbe !== undefined;
  if (controlledState) {
    assert.equal(CONTROLLED_REPOSITORY_STATE_PROBES.has(repositoryStateProbe), true, "only a repository-owned controlled state probe may be used by a direct module caller");
    assert.deepEqual(Object.keys(options).sort(), ["repositoryStateProbe", "root"], "controlled repository state is restricted to the no-input preparation fixture");
    assert.equal(persist, false, "controlled repository state cannot persist a freeze");
  } else {
    assert.equal(path.resolve(root), benchmarkRoot, "the real preparation command is fixed to the benchmark V2 root");
  }
  const requiredIdentity = { head: currentCommit(), version: await currentVersion() };
  const repositoryState = validateRepositoryStateRecord(controlledState ? await repositoryStateProbe() : await inspectRepositoryState());
  assertRepositoryState(repositoryState, requiredIdentity);
  const sourceRepositoryHead = repositoryState.head;
  const resolvedVersion = repositoryState.version;
  const preparationRoot = controlledState ? await assertControlledNoInputRoot(root) : benchmarkRoot;
  const [benchmarkSpec, coverageContract, scoringContract] = await Promise.all([
    readJson(path.join(benchmarkRoot, "benchmark-spec.json")),
    readJson(path.join(benchmarkRoot, "coverage-contract.json")),
    readJson(path.join(benchmarkRoot, "scoring-contract.json"))
  ]);
  assert.equal(benchmarkSpec.benchmarkId, BENCHMARK_ID);
  assert.equal(benchmarkSpec.preparationOnly, true);
  assert.equal(benchmarkSpec.preparationSafety.benchmarkExecutionAuthorized, false);

  const intakePath = path.join(preparationRoot, "intake", "input-manifest.json");
  const controlsPath = path.join(preparationRoot, "private", "private-controls.json");
  const releaseBoundaryPath = path.join(preparationRoot, "intake", "release-boundary.json");
  const analysisPlanPath = path.join(preparationRoot, "intake", "analysis-plan.json");
  const provenancePath = path.join(preparationRoot, "private", "provenance.json");
  const sourceOriginalManifestPath = path.join(preparationRoot, "private", "source-originals-manifest.json");
  const fixedInputPaths = [intakePath, controlsPath, releaseBoundaryPath, analysisPlanPath, provenancePath, sourceOriginalManifestPath];
  const presence = await Promise.all(fixedInputPaths.map(exists));
  const [intakePresent, controlsPresent] = presence;
  if (controlledState) assert.equal(presence.every((value) => value === false), true, "controlled repository state may only exercise an empty no-input root");
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
    const absolute = path.resolve(preparationRoot, "private", ...record.evaluatorOnlyRelativePath.split("/"));
    const privateRoot = path.resolve(preparationRoot, "private");
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
