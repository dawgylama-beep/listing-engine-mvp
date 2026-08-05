import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  repositoryRoot,
  resolveExecutorCommit,
  writeJsonExclusive
} from "./execution-common.mjs";

export const RELEASE_INVOCATION_SCHEMA_VERSION = 1;

function git(args, cwd = repositoryRoot) {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}

async function manifestFiles(root) {
  if (!await stat(root, { throwIfNoEntry: false })) return [];
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await manifestFiles(absolute));
    else if (entry.name === "frozen-result-manifest.json" || entry.name.endsWith(".invocation-manifest.json") || entry.name === "invocation-manifest.json") output.push(absolute);
  }
  return output.sort();
}

export async function beginReleaseBoundInvocation({
  expectedProductCommit,
  resultRoot,
  resultHistoryRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results"),
  repositoryPath = repositoryRoot,
  currentHead = () => git(["rev-parse", "HEAD"], repositoryPath),
  currentStatus = () => git(["status", "--porcelain=v1", "--untracked-files=all"], repositoryPath),
  executorCommit = () => resolveExecutorCommit(),
  nowIso = () => new Date().toISOString()
} = {}) {
  assert.match(expectedProductCommit || "", /^[a-f0-9]{40}$/, "an explicit full 40-character expected product commit is required");
  assert.ok(resultRoot, "an exclusive result root is required");
  const resolvedResultRoot = path.resolve(resultRoot);
  const resolvedHistoryRoot = path.resolve(resultHistoryRoot);
  const relativeResult = path.relative(resolvedHistoryRoot, resolvedResultRoot);
  assert.ok(relativeResult && !relativeResult.startsWith("..") && !path.isAbsolute(relativeResult), "result root must be a new child of the benchmark result-history root");
  assert.match(path.basename(resolvedResultRoot), /^phase6a-[a-z0-9][a-z0-9-]*$/, "Phase 6A result identifier is invalid");

  const actualProductCommit = currentHead();
  assert.match(actualProductCommit, /^[a-f0-9]{40}$/);
  assert.equal(actualProductCommit, expectedProductCommit, "expected product commit does not match the current full HEAD");
  assert.equal(currentStatus(), "", "working tree must be clean before release binding");
  assert.equal(await stat(resolvedResultRoot, { throwIfNoEntry: false }), undefined, "result directory already exists");

  for (const filePath of await manifestFiles(resolvedHistoryRoot)) {
    let manifest;
    try {
      manifest = JSON.parse(await readFile(filePath, "utf8"));
    } catch {
      continue;
    }
    assert.notEqual(
      manifest.productCommit,
      expectedProductCommit,
      `a prior complete or partial invocation is already bound to product commit ${expectedProductCommit}`
    );
  }

  const manifest = {
    schemaVersion: RELEASE_INVOCATION_SCHEMA_VERSION,
    status: "STARTED",
    resultId: path.basename(resolvedResultRoot),
    productCommit: actualProductCommit,
    executorCommit: executorCommit(),
    startedAt: nowIso(),
    networkTransmissionCountAtBinding: 0,
    handlerInvocationCountAtBinding: 0
  };
  await mkdir(path.dirname(resolvedResultRoot), { recursive: true });
  const invocationRegistryPath = path.join(resolvedHistoryRoot, `.phase6a-${actualProductCommit}.invocation-manifest.json`);
  await writeJsonExclusive(invocationRegistryPath, manifest);
  await mkdir(resolvedResultRoot);
  await writeJsonExclusive(path.join(resolvedResultRoot, "invocation-manifest.json"), manifest);
  return Object.freeze({ ...manifest, resultRoot: resolvedResultRoot, invocationRegistryPath });
}
