import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  CURRENT_RELEASE_RECORD_RELATIVE_PATH,
  STARTING,
  readV3ReleaseRecordBinding,
  repositoryRoot,
  validateV3ReleaseRecordBinding
} from "../qualification/synthetic-executive/qualification-real-route/scripts/v3-blind-qualification-runner.mjs";

const historicalPath = path.join(repositoryRoot, "qualification", "synthetic-executive", "qualification-real-route", "response-evidence-repair-release.json");
const currentPath = path.join(repositoryRoot, ...CURRENT_RELEASE_RECORD_RELATIVE_PATH.split("/"));

async function fixtureRootWith(bytes) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-v3-release-binding-"));
  const target = path.join(root, ...CURRENT_RELEASE_RECORD_RELATIVE_PATH.split("/"));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  return root;
}

test("the exact Version 1.12.34 release-record path and SHA pass", async () => {
  const binding = await readV3ReleaseRecordBinding();
  assert.equal(binding.relativePath, CURRENT_RELEASE_RECORD_RELATIVE_PATH);
  assert.equal(binding.releaseRecordSha256, STARTING.releaseRecordSha256);
  assert.equal(binding.release.version, STARTING.version);
  assert.equal(binding.release.releaseHash, STARTING.releaseHash);
  assert.equal(binding.release.evaluation.evaluationHash, STARTING.v2EvaluationHash);
  assert.equal(binding.release.evaluation.resultSealHash, STARTING.v2ResultSealHash);
});

test("the historical Version 1.12.32 record cannot satisfy the current gate", async () => {
  const bytes = await readFile(historicalPath);
  const root = await fixtureRootWith(bytes);
  await assert.rejects(readV3ReleaseRecordBinding({ root }), /V3_CURRENT_RELEASE_RECORD_SHA_MISMATCH/);
});

test("missing or altered current release records fail closed", async () => {
  const missingRoot = await mkdtemp(path.join(os.tmpdir(), "ke-v3-release-binding-missing-"));
  await assert.rejects(readV3ReleaseRecordBinding({ root: missingRoot }), /ENOENT/);
  const bytes = await readFile(currentPath);
  const altered = Buffer.concat([bytes.subarray(0, bytes.length - 2), Buffer.from(" \n", "utf8")]);
  const alteredRoot = await fixtureRootWith(altered);
  await assert.rejects(readV3ReleaseRecordBinding({ root: alteredRoot }), /V3_CURRENT_RELEASE_RECORD_SHA_MISMATCH/);
});

test("correct bytes at an unapproved path fail without fallback discovery", async () => {
  const bytes = await readFile(currentPath);
  const release = JSON.parse(bytes.toString("utf8"));
  assert.throws(() => validateV3ReleaseRecordBinding({
    relativePath: "qualification/synthetic-executive/qualification-real-route/copied-current-release.json",
    releaseBytes: bytes,
    release
  }), /V3_CURRENT_RELEASE_RECORD_PATH_NOT_APPROVED/);
  await assert.rejects(readV3ReleaseRecordBinding({
    relativePath: "qualification/synthetic-executive/qualification-real-route/copied-current-release.json"
  }), /V3_CURRENT_RELEASE_RECORD_PATH_NOT_APPROVED/);
});

test("the current path containing historical bytes fails", async () => {
  const root = await fixtureRootWith(await readFile(historicalPath));
  await assert.rejects(readV3ReleaseRecordBinding({ root }), /V3_CURRENT_RELEASE_RECORD_SHA_MISMATCH/);
});

test("Version, commit, tree, release, evaluation and result-seal mismatches fail", async () => {
  const bytes = await readFile(currentPath);
  const release = JSON.parse(bytes.toString("utf8"));
  for (const [field, value, pattern] of [
    ["version", "1.12.33", /V3_CURRENT_RELEASE_VERSION_MISMATCH/],
    ["commit", "0".repeat(40), /V3_CURRENT_RELEASE_COMMIT_MISMATCH/],
    ["tree", "0".repeat(40), /V3_CURRENT_RELEASE_TREE_MISMATCH/]
  ]) {
    assert.throws(() => validateV3ReleaseRecordBinding({
      relativePath: CURRENT_RELEASE_RECORD_RELATIVE_PATH,
      releaseBytes: bytes,
      release,
      repositoryIdentity: { ...STARTING, [field]: value }
    }), pattern);
  }
  for (const [mutate, pattern] of [
    [(value) => { value.version = "1.12.33"; }, /V3_CURRENT_RELEASE_RECORD_VERSION_MISMATCH/],
    [(value) => { value.releaseHash = "0".repeat(64); }, /V3_CURRENT_RELEASE_HASH_MISMATCH/],
    [(value) => { value.evaluation.evaluationHash = "0".repeat(64); }, /V3_CURRENT_RELEASE_EVALUATION_MISMATCH/],
    [(value) => { value.evaluation.resultSealHash = "0".repeat(64); }, /V3_CURRENT_RELEASE_RESULT_SEAL_MISMATCH/]
  ]) {
    const altered = structuredClone(release); mutate(altered);
    assert.throws(() => validateV3ReleaseRecordBinding({
      relativePath: CURRENT_RELEASE_RECORD_RELATIVE_PATH,
      releaseBytes: bytes,
      release: altered
    }), pattern);
  }
});
