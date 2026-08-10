import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import {
  cp,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  unlink,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { validateExecutionConsent } from "../benchmarks/blind-object-v2/scripts/execution-protocol.mjs";
import { createExecutionReleaseRecord } from "../benchmarks/blind-object-v2/scripts/release-qualification.mjs";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const canonicalTemporaryRoot = path.resolve(await fsRealpath(os.tmpdir()));
const FREEZE = "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699";
const PRODUCT_HEAD = "7056eb0601dc69c5985703fea6fe665e82c6bed8";
const ZERO_EXTERNAL_ROOT_NAME = "result-root-b912b16dae9e822f1076257815bd2e1a7d8cece05afe18e9";
const ZERO_EXTERNAL_CONSENT_NAME = "consent-d1b50d51ddd008ecc7cae6925633043fd64c57489d0c1b45.json";
const ZERO_EXTERNAL_RESERVATION_NAME = "invocation-0d5a024913e582fdd3a65cd44923d217ce2e6936f00e4f65.json";
const POST_HANDLER_ROOT_NAME = "result-root-f65ebb9d361c4977ac76755f8c7059375ae6d8d3fb4b0464";
const POST_HANDLER_CONSENT_NAME = "consent-ebe3e1f4d0d1b781fcc3f408bc2989fd74739fe7bd79faae.json";
const POST_HANDLER_RESERVATION_NAME = "invocation-3540a4bf98950418b6f5fbea2f6b82388e2b03a8d6c02909.json";
const POST_HANDLER_ORIGINAL_PATHS = Object.freeze(["cost-envelope.json", "cost-ledger.json", "execution-consent.json", "execution-journal.json", "execution-profile.json", "invocation-reservation.json", "launch-scope.json", "pricing-profile.json"]);
const POST_HANDLER_APPEND_PATHS = Object.freeze(["post-handler-reconciliation-receipt.json", "reservation-closure-receipt.json", "terminal-failure-manifest.json", "terminal-failure-validation-report.json"]);
const UNUSED_V11222_CONSENT_NAME = "consent-4ccd259de4ab835833dffe3274f5b0bf0b8b507359a5665f.json";
const VERSION_1123_FAILURE_ROOT_NAME = "result-root-1b8675557a5c786630a1f72ea5e157236cbdc4d9bacec149";
const TEMP_PREFIX = "katherines-eye-create-consent-cli-";
const PRODUCT_RUNTIME_PREFIX = `katherines-eye-v2-product-${PRODUCT_HEAD}-`;
const PUBLIC_FREEZE_FILES = Object.freeze([
  "analysis-plan.json",
  "freeze-manifest.json",
  "freeze-receipt.json",
  "source-package-boundary.json",
  "validation-report.json"
]);

async function fsRealpath(target) {
  const { realpath } = await import("node:fs/promises");
  return realpath(target);
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

async function exists(target) {
  return Boolean(await stat(target, { throwIfNoEntry: false }));
}

async function snapshotTree(root) {
  if (!await exists(root)) return null;
  const records = [];
  async function visit(current, relative = "") {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const childRelative = relative ? `${relative}/${entry.name}` : entry.name;
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) {
        records.push({ path: `${childRelative}/`, bytes: null });
        await visit(child, childRelative);
      } else {
        assert.equal(entry.isFile(), true, `unexpected authority entry type: ${childRelative}`);
        records.push({ path: childRelative, bytes: (await readFile(child)).toString("base64") });
      }
    }
  }
  await visit(root);
  return records;
}

async function run(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
      ...options
    });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: Number.isInteger(error?.code) ? error.code : 1,
      stdout: String(error?.stdout || ""),
      stderr: String(error?.stderr || error?.message || "")
    };
  }
}

function jsonOutput(result, label) {
  assert.equal(result.code, 0, `${label} failed: ${result.stderr}`);
  const lines = result.stdout.split(/\r?\n/).filter(Boolean);
  assert.equal(lines.length, 1, `${label} must emit exactly one JSON record`);
  return JSON.parse(lines[0]);
}

function assertDirectTemporaryChild(target, prefix) {
  const resolved = path.resolve(target);
  assert.equal(samePath(path.dirname(resolved), canonicalTemporaryRoot), true, "cleanup target must be a direct child of the canonical temporary root");
  assert.equal(path.basename(resolved).startsWith(prefix), true, "cleanup target prefix differs");
  return resolved;
}

async function cleanupIsolatedRepository(testRoot, cloneRoot) {
  if (await exists(path.join(cloneRoot, ".git"))) {
    const listed = await run("git", ["worktree", "list", "--porcelain"], { cwd: cloneRoot });
    assert.equal(listed.code, 0, listed.stderr);
    const worktrees = listed.stdout.split(/\r?\n/)
      .filter((line) => line.startsWith("worktree "))
      .map((line) => line.slice("worktree ".length));
    for (const worktree of worktrees) {
      if (samePath(worktree, cloneRoot)) continue;
      assertDirectTemporaryChild(worktree, PRODUCT_RUNTIME_PREFIX);
      const removed = await run("git", ["worktree", "remove", "--force", "--", worktree], { cwd: cloneRoot });
      assert.equal(removed.code, 0, removed.stderr);
    }
    const pruned = await run("git", ["worktree", "prune"], { cwd: cloneRoot });
    assert.equal(pruned.code, 0, pruned.stderr);
  }
  const dependencyLink = path.join(cloneRoot, "node_modules");
  const dependencyLinkStat = await lstat(dependencyLink, { throwIfNoEntry: false });
  if (dependencyLinkStat) {
    assert.equal(dependencyLinkStat.isSymbolicLink(), true, "isolated dependency path is not a removable junction");
    await unlink(dependencyLink);
  }
  await rm(assertDirectTemporaryChild(testRoot, TEMP_PREFIX), { recursive: true, force: true });
}

async function createIsolatedRepository(cloneRoot) {
  await mkdir(cloneRoot, { recursive: true });
  for (const [args, label] of [
    [["init"], "git init"],
    [["remote", "add", "source", repositoryRoot], "git remote add"],
    [["fetch", "--no-tags", "--depth=2", "source", "refs/heads/refactor/beta-evidence-pipeline"], "release fetch"],
    [["checkout", "-b", "refactor/beta-evidence-pipeline", "FETCH_HEAD"], "release checkout"],
    [["fetch", "--no-tags", "--depth=1", "source", PRODUCT_HEAD], "product fetch"]
  ]) {
    const result = await run("git", args, { cwd: cloneRoot });
    assert.equal(result.code, 0, `${label} failed: ${result.stderr}`);
  }

  for (const relativePath of [
    "package.json",
    "package-lock.json",
    "public/index.html",
    "server.ps1",
    "scripts/verify-release-version.mjs",
    "benchmarks/blind-object-v2/execution-release.json",
    "benchmarks/blind-object-v2/post-handler-failure-authority.json",
    "benchmarks/blind-object-v2/scripts",
    "benchmarks/blind-object-v2/schemas",
    "tests/helpers/blind-object-v2-cli-isolation-guard.cjs"
  ]) {
    const source = path.join(repositoryRoot, relativePath);
    const target = path.join(cloneRoot, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { recursive: true, force: true });
  }
  const pendingPath = path.join(cloneRoot, "benchmarks", "blind-object-v2", "execution-release.json");
  const pendingSource = JSON.parse(await readFile(pendingPath, "utf8"));
  delete pendingSource.recordHash;
  pendingSource.releaseState = "PENDING_QUALIFICATION_SEAL";
  pendingSource.executorRuntimeHead = null;
  pendingSource.executorRuntimeTreeHash = null;
  const pendingRecord = createExecutionReleaseRecord(pendingSource);
  await writeFile(pendingPath, `${JSON.stringify(pendingRecord, null, 2)}\n`);
  for (const [args, label] of [
    [["add", "-A"], "runtime stage"],
    [["-c", "user.name=Katherine Eye Tests", "-c", "user.email=tests@invalid.example", "commit", "--quiet", "-m", "test: isolated Version 1.12.24 runtime"], "runtime commit"]
  ]) {
    const result = await run("git", args, { cwd: cloneRoot });
    assert.equal(result.code, 0, `${label} failed: ${result.stderr}`);
  }
  const runtimeHeadResult = await run("git", ["rev-parse", "HEAD"], { cwd: cloneRoot });
  const runtimeTreeResult = await run("git", ["rev-parse", "HEAD^{tree}"], { cwd: cloneRoot });
  assert.equal(runtimeHeadResult.code, 0, runtimeHeadResult.stderr);
  assert.equal(runtimeTreeResult.code, 0, runtimeTreeResult.stderr);
  const qualifiedCore = structuredClone(pendingRecord);
  delete qualifiedCore.recordHash;
  qualifiedCore.releaseState = "QUALIFIED";
  qualifiedCore.executorRuntimeHead = runtimeHeadResult.stdout.trim();
  qualifiedCore.executorRuntimeTreeHash = runtimeTreeResult.stdout.trim();
  const qualifiedRecord = createExecutionReleaseRecord(qualifiedCore);
  await writeFile(pendingPath, `${JSON.stringify(qualifiedRecord, null, 2)}\n`);
  for (const [args, label] of [
    [["add", "--", "benchmarks/blind-object-v2/execution-release.json"], "seal stage"],
    [["-c", "user.name=Katherine Eye Tests", "-c", "user.email=tests@invalid.example", "commit", "--quiet", "-m", "test: isolated Version 1.12.24 qualification seal"], "seal commit"]
  ]) {
    const result = await run("git", args, { cwd: cloneRoot });
    assert.equal(result.code, 0, `${label} failed: ${result.stderr}`);
  }

  const sourceFreezeRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v2", "prepared", "freezes", FREEZE);
  const isolatedFreezeRoot = path.join(cloneRoot, "benchmarks", "blind-object-v2", "prepared", "freezes", FREEZE);
  await mkdir(isolatedFreezeRoot, { recursive: true });
  for (const name of PUBLIC_FREEZE_FILES) await cp(path.join(sourceFreezeRoot, name), path.join(isolatedFreezeRoot, name), { errorOnExist: true, force: false });
  for (const name of ["assets", "requests"]) await cp(path.join(sourceFreezeRoot, name), path.join(isolatedFreezeRoot, name), { recursive: true, errorOnExist: true, force: false });
  assert.equal(await exists(path.join(isolatedFreezeRoot, "evaluator-only")), false, "isolated repository copied evaluator-only originals");

  const sourceHistoryRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v2-results");
  const isolatedHistoryRoot = path.join(cloneRoot, "benchmarks", "blind-object-v2-results");
  await mkdir(path.join(isolatedHistoryRoot, ".reservations"), { recursive: true });
  await cp(path.join(sourceHistoryRoot, ZERO_EXTERNAL_ROOT_NAME), path.join(isolatedHistoryRoot, ZERO_EXTERNAL_ROOT_NAME), { recursive: true, errorOnExist: true, force: false });
  await cp(path.join(sourceHistoryRoot, ".reservations", ZERO_EXTERNAL_RESERVATION_NAME), path.join(isolatedHistoryRoot, ".reservations", ZERO_EXTERNAL_RESERVATION_NAME), { errorOnExist: true, force: false });
  const isolatedPostHandlerRoot = path.join(isolatedHistoryRoot, POST_HANDLER_ROOT_NAME);
  await mkdir(path.join(isolatedPostHandlerRoot, "responses"), { recursive: true });
  for (const relativePath of [...POST_HANDLER_ORIGINAL_PATHS, ...POST_HANDLER_APPEND_PATHS]) {
    await cp(path.join(sourceHistoryRoot, POST_HANDLER_ROOT_NAME, relativePath), path.join(isolatedPostHandlerRoot, relativePath), { errorOnExist: true, force: false });
  }
  await cp(path.join(sourceHistoryRoot, ".reservations", POST_HANDLER_RESERVATION_NAME), path.join(isolatedHistoryRoot, ".reservations", POST_HANDLER_RESERVATION_NAME), { errorOnExist: true, force: false });
  await cp(path.join(sourceHistoryRoot, VERSION_1123_FAILURE_ROOT_NAME), path.join(isolatedHistoryRoot, VERSION_1123_FAILURE_ROOT_NAME), { recursive: true, errorOnExist: true, force: false });
  const isolatedRevocationRoot = path.join(isolatedHistoryRoot, ".consent-revocations");
  await mkdir(isolatedRevocationRoot, { recursive: true });
  await cp(path.join(sourceHistoryRoot, ".consent-revocations", UNUSED_V11222_CONSENT_NAME), path.join(isolatedRevocationRoot, UNUSED_V11222_CONSENT_NAME), { errorOnExist: true, force: false });
  const isolatedConsentRoot = path.join(cloneRoot, "benchmarks", "blind-object-v2", "consent");
  await mkdir(isolatedConsentRoot, { recursive: true });
  await cp(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "consent", ZERO_EXTERNAL_CONSENT_NAME), path.join(isolatedConsentRoot, ZERO_EXTERNAL_CONSENT_NAME), { errorOnExist: true, force: false });
  await cp(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "consent", POST_HANDLER_CONSENT_NAME), path.join(isolatedConsentRoot, POST_HANDLER_CONSENT_NAME), { errorOnExist: true, force: false });
  await cp(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "consent", UNUSED_V11222_CONSENT_NAME), path.join(isolatedConsentRoot, UNUSED_V11222_CONSENT_NAME), { errorOnExist: true, force: false });

  const sourceDependencies = path.join(repositoryRoot, "node_modules");
  assert.equal(await exists(path.join(sourceDependencies, "@playwright", "test")), true, "qualified workspace dependency is absent");
  await symlink(sourceDependencies, path.join(cloneRoot, "node_modules"), "junction");
  assert.equal((await lstat(path.join(cloneRoot, "node_modules"))).isSymbolicLink(), true, "isolated dependency junction was not created");
}

test("Version 1.12.25 readiness release blocks every benchmark CLI mode before preflight or authority creation", async () => {
  const cliPath = path.join(repositoryRoot, "benchmarks", "blind-object-v2", "scripts", "run-authorized-execution.mjs");
  const fakeConsentHash = "a".repeat(64);
  for (const [mode, extra] of [
    ["REVOKE_V11222_CONSENT", []], ["QUALIFY_OFFLINE", []], ["PREFLIGHT", []], ["CREATE_CONSENT", []],
    ["EXECUTE", [fakeConsentHash]], ["READBACK", [fakeConsentHash]], ["RECONCILE_V11221", []]
  ]) {
    const result = await run(process.execPath, [cliPath, mode, FREEZE, ...extra], { cwd: repositoryRoot, env: {} });
    assert.notEqual(result.code, 0, `${mode} unexpectedly crossed the readiness-only release boundary`);
    assert.match(result.stderr, /prohibited by the synthetic-executive qualification-readiness-only release/i);
  }
});
