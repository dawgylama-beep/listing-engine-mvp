import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  assertApprovedProductRuntimePath,
  ensureDetachedProductRuntime,
  removeDetachedProductRuntime,
  validateProductRuntimeSnapshot,
  verifyDetachedProductRuntime
} from "../benchmarks/blind-object-v2/scripts/execution-profile.mjs";
import { PRODUCT_SOURCE_HEAD, PRODUCT_SOURCE_VERSION } from "../benchmarks/blind-object-v2/scripts/execution-protocol.mjs";

const EXPECTED_RUNTIME_HASH = "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8";
const RUNTIME_PREFIX = `katherines-eye-v2-product-${PRODUCT_SOURCE_HEAD}-`;
const DUBIOUS_OWNERSHIP = `fatal: detected dubious ownership in repository at 'C:/Users/dawgy/AppData/Local/Temp/katherines-eye-v2-product-${PRODUCT_SOURCE_HEAD}'`;

function git(args, cwd = process.cwd()) {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}

function persistentSafeDirectories(scope) {
  try {
    return git(["config", `--${scope}`, "--get-all", "safe.directory"]);
  } catch (error) {
    assert.equal(error?.status, 1);
    return "";
  }
}

function disposableFixture() {
  return mkdtempSync(path.join(os.tmpdir(), RUNTIME_PREFIX));
}

test("A: the exact dubious-ownership failure is represented and stale fixed-directory reuse is absent", () => {
  assert.match(DUBIOUS_OWNERSHIP, /fatal: detected dubious ownership in repository/);
  const source = readFileSync(new URL("../benchmarks/blind-object-v2/scripts/execution-profile.mjs", import.meta.url), "utf8");
  const ensureSource = source.slice(source.indexOf("export function ensureDetachedProductRuntime"), source.indexOf("export async function resolveExecutionProfile"));
  assert.match(source, /mkdtempSync\(path\.join\(approvedTemporaryRoot\(\), PRODUCT_RUNTIME_PREFIX\)\)/);
  assert.doesNotMatch(source, /safe\.directory|config\s+--global|config\s+--system/);
  assert.doesNotMatch(ensureSource, /process\.env|candidate|operatorText|freeFormText/);
});

test("B-C: two fresh current-process runtimes verify identically and cleanup through Git", () => {
  const before = {
    global: persistentSafeDirectories("global"),
    system: persistentSafeDirectories("system")
  };
  const runtimes = [];
  try {
    runtimes.push(ensureDetachedProductRuntime(), ensureDetachedProductRuntime());
    for (const runtime of runtimes) {
      assert.equal(runtime.productSourceHead, PRODUCT_SOURCE_HEAD);
      assert.equal(runtime.productSourceVersion, PRODUCT_SOURCE_VERSION);
      assert.equal(runtime.trackedEntryCount, 666);
      assert.equal(runtime.productRuntimeManifestHash, EXPECTED_RUNTIME_HASH);
      assertApprovedProductRuntimePath(runtime.runtimeRoot);
    }
    assert.notEqual(runtimes[0].runtimeRoot, runtimes[1].runtimeRoot);
    assert.equal(runtimes[0].productRuntimeManifestHash, runtimes[1].productRuntimeManifestHash);
  } finally {
    for (const runtime of runtimes) removeDetachedProductRuntime(runtime.runtimeRoot);
  }
  assert.deepEqual({ global: persistentSafeDirectories("global"), system: persistentSafeDirectories("system") }, before);
});

test("D-H: wrong linkage, release drift, dirtiness, and tracked-file changes fail closed", () => {
  const wrongLink = disposableFixture();
  try {
    writeFileSync(path.join(wrongLink, ".git"), "gitdir: C:/unexpected/repository/.git/worktrees/foreign\n");
    assert.throws(() => verifyDetachedProductRuntime(wrongLink), /unexpected repository|metadata directory/);
  } finally {
    rmSync(wrongLink, { recursive: true, force: true });
  }

  const runtime = ensureDetachedProductRuntime();
  try {
    const valid = {
      head: runtime.productSourceHead,
      branch: "",
      status: "",
      records: runtime.fullTrackedTree,
      version: runtime.productSourceVersion
    };
    assert.throws(() => validateProductRuntimeSnapshot({ ...valid, head: "0".repeat(40) }), /HEAD differs/);
    assert.throws(() => validateProductRuntimeSnapshot({ ...valid, version: "0.0.0" }), /Version differs/);
    assert.throws(() => validateProductRuntimeSnapshot({ ...valid, branch: "main" }), /must be detached/);
    writeFileSync(path.join(runtime.runtimeRoot, "package.json"), `${readFileSync(path.join(runtime.runtimeRoot, "package.json"), "utf8")}\n`);
    assert.throws(() => verifyDetachedProductRuntime(runtime.runtimeRoot), /not clean/);
  } finally {
    removeDetachedProductRuntime(runtime.runtimeRoot);
  }
});

test("I-Q: reparse, traversal, ADS, outside-temp, stale, and caller-controlled paths are rejected", (t) => {
  const outside = path.resolve(process.cwd(), RUNTIME_PREFIX + "ABC123");
  assert.throws(() => assertApprovedProductRuntimePath(outside), /temporary root/);
  assert.throws(() => assertApprovedProductRuntimePath(path.join(os.tmpdir(), RUNTIME_PREFIX + "ABC123", "..")), /direct child|name/);
  if (process.platform === "win32") assert.throws(() => assertApprovedProductRuntimePath(path.join(os.tmpdir(), RUNTIME_PREFIX + "ABC123:stream")), /ADS|name/);

  const stale = disposableFixture();
  rmSync(stale, { recursive: true, force: true });
  assert.throws(() => verifyDetachedProductRuntime(stale), /absent/);

  const target = disposableFixture();
  const link = disposableFixture();
  rmSync(link, { recursive: true, force: true });
  try {
    symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
    assert.throws(() => assertApprovedProductRuntimePath(link), /symlink|reparse/);
  } catch (error) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error?.code)) t.skip(`platform cannot create a disposable directory link: ${error.code}`);
    else throw error;
  } finally {
    rmSync(link, { recursive: true, force: true });
    rmSync(target, { recursive: true, force: true });
  }
});
