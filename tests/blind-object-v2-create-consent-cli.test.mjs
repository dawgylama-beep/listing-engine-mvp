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
    [["-c", "user.name=Katherine Eye Tests", "-c", "user.email=tests@invalid.example", "commit", "--quiet", "-m", "test: isolated Version 1.12.22 runtime"], "runtime commit"]
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
    [["-c", "user.name=Katherine Eye Tests", "-c", "user.email=tests@invalid.example", "commit", "--quiet", "-m", "test: isolated Version 1.12.22 qualification seal"], "seal commit"]
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
  for (const relativePath of POST_HANDLER_ORIGINAL_PATHS) {
    await cp(path.join(sourceHistoryRoot, POST_HANDLER_ROOT_NAME, relativePath), path.join(isolatedPostHandlerRoot, relativePath), { errorOnExist: true, force: false });
  }
  await cp(path.join(sourceHistoryRoot, ".reservations", POST_HANDLER_RESERVATION_NAME), path.join(isolatedHistoryRoot, ".reservations", POST_HANDLER_RESERVATION_NAME), { errorOnExist: true, force: false });
  const isolatedConsentRoot = path.join(cloneRoot, "benchmarks", "blind-object-v2", "consent");
  await mkdir(isolatedConsentRoot, { recursive: true });
  await cp(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "consent", ZERO_EXTERNAL_CONSENT_NAME), path.join(isolatedConsentRoot, ZERO_EXTERNAL_CONSENT_NAME), { errorOnExist: true, force: false });
  await cp(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "consent", POST_HANDLER_CONSENT_NAME), path.join(isolatedConsentRoot, POST_HANDLER_CONSENT_NAME), { errorOnExist: true, force: false });

  const sourceDependencies = path.join(repositoryRoot, "node_modules");
  assert.equal(await exists(path.join(sourceDependencies, "@playwright", "test")), true, "qualified workspace dependency is absent");
  await symlink(sourceDependencies, path.join(cloneRoot, "node_modules"), "junction");
  assert.equal((await lstat(path.join(cloneRoot, "node_modules"))).isSymbolicLink(), true, "isolated dependency junction was not created");
}

test("actual reconciled CREATE_CONSENT CLI uses the canonical isolated benchmark root exactly once and creates no later successor authority", { timeout: 180_000 }, async () => {
  const realFreezeManifest = path.join(repositoryRoot, "benchmarks", "blind-object-v2", "prepared", "freezes", FREEZE, "freeze-manifest.json");
  const realFreezeBefore = await readFile(realFreezeManifest);
  const realAuthorityRoots = [
    path.join(repositoryRoot, "benchmarks", "blind-object-v2", "consent"),
    path.join(repositoryRoot, "benchmarks", "blind-object-v2", "invocations"),
    path.join(repositoryRoot, "benchmarks", "blind-object-v2", "results"),
    path.join(repositoryRoot, "benchmarks", "blind-object-v2-results")
  ];
  const realAuthorityBefore = await Promise.all(realAuthorityRoots.map(snapshotTree));

  const testRoot = await mkdtemp(path.join(canonicalTemporaryRoot, TEMP_PREFIX));
  const cloneRoot = path.join(testRoot, "repository");
  try {
    await createIsolatedRepository(cloneRoot);
    const cliPath = path.join(cloneRoot, "benchmarks", "blind-object-v2", "scripts", "run-authorized-execution.mjs");
    const cliSource = await readFile(cliPath, "utf8");
    assert.match(cliSource, /import\s*\{[\s\S]*?\bbenchmarkRoot\b[\s\S]*?\}\s*from\s*"\.\/execution-store\.mjs";/, "CLI does not import the canonical benchmark root authority");
    assert.doesNotMatch(cliSource, /process\.env[^\n]*(?:BENCHMARK|ROOT)|(?:BENCHMARK|ROOT)[^\n]*process\.env/i, "CLI reads a caller-selected benchmark root from the environment");
    const guardPath = path.join(cloneRoot, "tests", "helpers", "blind-object-v2-cli-isolation-guard.cjs");
    const guardLog = path.join(testRoot, "guard-attempts.jsonl");
    const callerSelectedRoot = path.join(testRoot, "caller-selected-root");
    const childEnvironment = {
      ...process.env,
      OPENAI_API_KEY: "isolated-cli-regression-credential-present",
      OPEN_API_KEY: "",
      SERPER_API_KEY: "",
      OPENAI_MODEL: "gpt-4.1-mini",
      BENCHMARK_ROOT: callerSelectedRoot,
      KATHERINES_EYE_BENCHMARK_ROOT: callerSelectedRoot,
      KATHERINES_EYE_CLI_GUARD_LOG: guardLog,
      NODE_OPTIONS: `--require=${guardPath}`
    };

    const rejectedOverride = await run(process.execPath, [cliPath, "CREATE_CONSENT", FREEZE, callerSelectedRoot], { cwd: cloneRoot, env: childEnvironment });
    assert.notEqual(rejectedOverride.code, 0);
    assert.match(rejectedOverride.stderr, /accepts no consent hash or other argument/);
    assert.equal(await exists(callerSelectedRoot), false, "caller-selected benchmark root was created");

    const reconciled = jsonOutput(await run(process.execPath, [cliPath, "RECONCILE_V11221", FREEZE], { cwd: cloneRoot, env: childEnvironment }), "isolated Version 1.12.21 reconciliation");
    assert.equal(reconciled.disposition, "VERSION_1_12_21_POST_HANDLER_FAILURE_RECONCILED_SEALED");
    assert.equal(reconciled.handlerInvocationCount, 1);
    assert.equal(reconciled.providerAttemptCount, 9);
    assert.equal(reconciled.physicalProviderAttemptCount, 9);
    assert.equal(reconciled.conservativeAccountedCost, 1.50682355);
    assert.equal(reconciled.actualBilledCostStatus, "UNKNOWN");

    const preflight = jsonOutput(await run(process.execPath, [cliPath, "PREFLIGHT", FREEZE], { cwd: cloneRoot, env: childEnvironment }), "isolated PREFLIGHT");
    assert.equal(preflight.executorVersion, "1.12.22");
    assert.equal(preflight.handlerInvocationCount, 0);
    assert.equal(preflight.providerAttemptCount, 0);
    assert.equal(preflight.continuationRequestCount, 25);
    assert.equal(preflight.priorPhysicalAttemptCount, 9);
    assert.equal(preflight.priorConservativeCost, 1.50682355);
    assert.equal(preflight.continuationConservativeMaximumCost, 37.67058877);
    assert.equal(preflight.cumulativeConservativeMaximumCost, 39.17741232);

    const created = jsonOutput(await run(process.execPath, [cliPath, "CREATE_CONSENT", FREEZE], { cwd: cloneRoot, env: childEnvironment }), "isolated CREATE_CONSENT");
    assert.equal(created.disposition, "CONSENT_CREATED_NOT_EXECUTED");
    assert.equal(created.consentId, preflight.proposedConsentId, "consent identity differs from the release-derived preflight identity");
    assert.equal(created.launchScopeHash, preflight.launchScopeHash);

    const canonicalConsentRoot = path.join(cloneRoot, "benchmarks", "blind-object-v2", "consent");
    const consentEntries = await readdir(canonicalConsentRoot, { withFileTypes: true });
    assert.deepEqual(consentEntries.map((entry) => entry.name).sort(), [ZERO_EXTERNAL_CONSENT_NAME, POST_HANDLER_CONSENT_NAME, `${created.consentId}.json`].sort());
    assert.equal(consentEntries.every((entry) => entry.isFile()), true);
    const consentPath = path.join(canonicalConsentRoot, `${created.consentId}.json`);
    const consentBytes = await readFile(consentPath);
    const consent = JSON.parse(consentBytes.toString("utf8"));
    assert.equal(validateExecutionConsent(consent).valid, true);
    assert.equal(consent.consentId, preflight.proposedConsentId);
    assert.equal(consent.consentHash, created.consentHash);

    for (const target of [
      path.join(cloneRoot, "benchmarks", "blind-object-v2", "invocations"),
      path.join(cloneRoot, "benchmarks", "blind-object-v2", "results")
    ]) assert.equal(await exists(target), false, `premature later authority exists: ${target}`);

    const duplicate = await run(process.execPath, [cliPath, "CREATE_CONSENT", FREEZE], { cwd: cloneRoot, env: childEnvironment });
    assert.notEqual(duplicate.code, 0, "duplicate CREATE_CONSENT unexpectedly succeeded");
    assert.match(duplicate.stderr, /EEXIST|already exists|exclusive/i);
    assert.deepEqual(await readFile(consentPath), consentBytes, "duplicate invocation changed the consent artifact");
    assert.equal((await readdir(canonicalConsentRoot)).length, 3);

    assert.equal(await exists(guardLog), false, "provider, handler, evaluator-only, or private-control guard recorded an attempt");
    assert.equal(await exists(callerSelectedRoot), false);
  } finally {
    await cleanupIsolatedRepository(testRoot, cloneRoot);
  }

  assert.deepEqual(await readFile(realFreezeManifest), realFreezeBefore, "isolated cleanup changed the real freeze manifest");
  assert.deepEqual(await Promise.all(realAuthorityRoots.map(snapshotTree)), realAuthorityBefore, "isolated cleanup touched real authority or results paths");
  assert.equal(await exists(path.join(repositoryRoot, "node_modules", "@playwright", "test")), true, "isolated cleanup touched workspace dependencies");
});
