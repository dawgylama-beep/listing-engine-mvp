import assert from "node:assert/strict";
import test from "node:test";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { beginReleaseBoundInvocation } from "../benchmarks/blind-object-v1-execution-v1/scripts/release-binding.mjs";
import { repositoryRoot, stableJson } from "../benchmarks/blind-object-v1-execution-v1/scripts/execution-common.mjs";
import { verifyFrozenResultIntegrity } from "../benchmarks/blind-object-v1-execution-v1/scripts/result-integrity.mjs";
import { gradeFrozenResults } from "../benchmarks/blind-object-v1-execution-v1/scripts/grade-frozen-results.mjs";

const COMMIT = "1".repeat(40);
const OTHER_COMMIT = "2".repeat(40);
const EXECUTOR_COMMIT = "3".repeat(40);

async function withTemp(callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-release-binding-"));
  try {
    return await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}

function options(root, overrides = {}) {
  const history = path.join(root, "history");
  return {
    expectedProductCommit: COMMIT,
    resultRoot: path.join(history, "phase6a-test-commit"),
    resultHistoryRoot: history,
    currentHead: () => COMMIT,
    currentStatus: () => "",
    executorCommit: () => EXECUTOR_COMMIT,
    nowIso: () => "2026-08-05T12:00:00.000Z",
    ...overrides
  };
}

test("release binding rejects a mismatched expected full commit before creating a result directory", async () => withTemp(async (root) => {
  const configured = options(root, { currentHead: () => OTHER_COMMIT });
  await assert.rejects(beginReleaseBoundInvocation(configured), /does not match/);
  await assert.rejects(readdir(configured.resultHistoryRoot), /ENOENT/);
}));

test("release binding rejects a dirty starting tree", async () => withTemp(async (root) => {
  const configured = options(root, { currentStatus: () => " M api/generate-listing.js" });
  await assert.rejects(beginReleaseBoundInvocation(configured), /working tree must be clean/);
}));

test("release binding rejects an existing result directory", async () => withTemp(async (root) => {
  const configured = options(root);
  await mkdir(configured.resultRoot, { recursive: true });
  await assert.rejects(beginReleaseBoundInvocation(configured), /already exists/);
}));

test("release binding rejects a prior partial or complete manifest for the same commit", async () => withTemp(async (root) => {
  const configured = options(root);
  const prior = path.join(configured.resultHistoryRoot, "phase6a-prior");
  await mkdir(prior, { recursive: true });
  await writeFile(path.join(prior, "invocation-manifest.json"), JSON.stringify({ status: "STARTED", productCommit: COMMIT }), "utf8");
  await assert.rejects(beginReleaseBoundInvocation(configured), /prior complete or partial invocation/);
}));

test("release binding atomically records STARTED only in an isolated temporary result directory", async () => withTemp(async (root) => {
  const realResultsRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results");
  const before = (await readdir(realResultsRoot)).filter((name) => name.startsWith("phase6a-")).sort();
  const binding = await beginReleaseBoundInvocation(options(root));
  const manifest = JSON.parse(await readFile(path.join(binding.resultRoot, "invocation-manifest.json"), "utf8"));
  assert.equal(manifest.status, "STARTED");
  assert.equal(manifest.productCommit, COMMIT);
  assert.equal(manifest.executorCommit, EXECUTOR_COMMIT);
  assert.equal(manifest.networkTransmissionCountAtBinding, 0);
  assert.equal(manifest.handlerInvocationCountAtBinding, 0);
  assert.deepEqual((await readdir(realResultsRoot)).filter((name) => name.startsWith("phase6a-")).sort(), before);
}));

test("historical frozen results remain readable and the frozen product grader is byte-stable", async () => withTemp(async (root) => {
  const historicalRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results", "current-a4a7214");
  const verified = await verifyFrozenResultIntegrity(historicalRoot);
  assert.equal(verified.responses.length, 26);
  const outputRoot = path.join(root, "grading");
  const graded = await gradeFrozenResults({ resultRoot: historicalRoot, outputRoot, synthetic: false });
  const storedAggregate = JSON.parse(await readFile(path.join(historicalRoot, "grading", "aggregate-score.json"), "utf8"));
  assert.equal(stableJson(graded.aggregate), stableJson(storedAggregate));
  const newAggregateBytes = await readFile(path.join(outputRoot, "aggregate-score.json"));
  const storedAggregateBytes = await readFile(path.join(historicalRoot, "grading", "aggregate-score.json"));
  assert.deepEqual(newAggregateBytes, storedAggregateBytes);
}));
