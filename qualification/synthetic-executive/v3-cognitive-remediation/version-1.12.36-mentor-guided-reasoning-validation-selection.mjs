import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..", "..", "..");
const registryPath = path.join(path.dirname(scriptPath), "version-1.12.36-mentor-guided-reasoning-validation-selection.json");
const browserPath = "tests/milestone-2c2-browser-dom.ps1";

const normalize = (value) => value.replaceAll("\\", "/");
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function duplicates(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) (seen.has(value) ? repeated : seen).add(value);
  return [...repeated].sort();
}

function validatePathList(name, values) {
  assert.ok(Array.isArray(values), `${name}:EXPECTED_ARRAY`);
  for (const value of values) {
    assert.equal(typeof value, "string", `${name}:EXPECTED_STRING_PATH`);
    assert.equal(value, normalize(value), `${name}:NON_NORMALIZED_PATH:${value}`);
    assert.equal(/[?*\[\]{}]/.test(value), false, `${name}:WILDCARD_FORBIDDEN:${value}`);
    assert.ok(value.startsWith("tests/") && value.endsWith(".ps1"), `${name}:INVALID_TEST_PATH:${value}`);
  }
}

export function validateSelectionRegistry(registry, availablePowerShellPaths) {
  assert.equal(registry?.schemaVersion, "1.0");
  assert.equal(registry?.recordType, "VERSION_1_12_36_MENTOR_GUIDED_REASONING_VALIDATION_SELECTION");
  assert.equal(registry?.version, "1.12.36");
  assert.equal(registry?.selectionMode, "EXPLICIT_REGISTRY_ONLY");
  assert.equal(registry?.browserGate?.mapped, false);
  assert.equal(registry?.browserGate?.classification, "NOT_APPLICABLE_TO_DECLARED_VERSION_1_12_36_CHANGE_CLOSURE");
  assert.equal(registry?.browserGate?.path, browserPath);
  validatePathList("retainedMembers", registry.retainedMembers);
  validatePathList("pendingMembers", registry.pendingMembers);
  const excluded = registry.excludedMembers?.map((item) => item?.path);
  validatePathList("excludedMembers", excluded);

  const selected = [...registry.retainedMembers, ...registry.pendingMembers];
  const classified = [...selected, ...excluded];
  const available = [...availablePowerShellPaths].map(normalize).sort();
  validatePathList("availablePowerShellPaths", available);
  const selectedSet = new Set(selected);
  const excludedSet = new Set(excluded);
  const availableSet = new Set(available);
  const classifiedSet = new Set(classified);
  const reconciliation = {
    missing: selected.filter((value) => !availableSet.has(value)).sort(),
    unexpected: classified.filter((value) => !availableSet.has(value)).sort(),
    duplicate: duplicates(classified),
    intersecting: selected.filter((value) => excludedSet.has(value)).sort(),
    unclassified: available.filter((value) => !classifiedSet.has(value)).sort()
  };

  assert.equal(selectedSet.has(browserPath), false, "UNMAPPED_BROWSER_SELECTED");
  assert.ok(registry.excludedMembers.some((item) => item.path === browserPath && item.classification === "UNMAPPED_BROWSER_GATE"), "UNMAPPED_BROWSER_EXCLUSION_REQUIRED");
  assert.deepEqual(reconciliation, registry.reconciliation, `SELECTION_RECONCILIATION_FAILED:${JSON.stringify(reconciliation)}`);
  assert.equal(registry.retainedMembers.length, registry.expectedCounts.retainedMembers);
  assert.equal(registry.pendingMembers.length, registry.expectedCounts.pendingMembers);
  assert.equal(selected.length, registry.expectedCounts.governingMembers);
  assert.equal(excluded.length, registry.expectedCounts.excludedMembers);
  assert.equal(available.length, registry.expectedCounts.powerShellPaths);
  assert.equal(registry.execution.directoryEnumerationMaySelectTests, false);
  assert.equal(registry.execution.maximumExecutionsPerPendingMember, 1);

  return Object.freeze({
    selected: Object.freeze([...selected]),
    retained: Object.freeze([...registry.retainedMembers]),
    pending: Object.freeze([...registry.pendingMembers]),
    excluded: Object.freeze([...excluded]),
    reconciliation: Object.freeze(reconciliation)
  });
}

export function discoverPowerShellInventory(root = repositoryRoot) {
  const testRoot = path.join(root, "tests");
  const discovered = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith(".ps1")) discovered.push(normalize(path.relative(root, absolute)));
    }
  };
  visit(testRoot);
  return discovered.sort();
}

export function loadSelectionRegistry() {
  return JSON.parse(fs.readFileSync(registryPath, "utf8"));
}

export function validateCurrentSelection() {
  return validateSelectionRegistry(loadSelectionRegistry(), discoverPowerShellInventory());
}

function runPending(resultRelativePath) {
  const registry = loadSelectionRegistry();
  const selection = validateSelectionRegistry(registry, discoverPowerShellInventory());
  assert.equal(selection.pending.includes(browserPath), false, "UNMAPPED_BROWSER_SELECTED");
  assert.equal(resultRelativePath, normalize(resultRelativePath));
  assert.ok(resultRelativePath.startsWith("qualification/synthetic-executive/v3-cognitive-remediation/"));
  assert.ok(resultRelativePath.endsWith(".json"));
  const resultPath = path.join(repositoryRoot, ...resultRelativePath.split("/"));
  assert.equal(fs.existsSync(resultPath), false, "PENDING_RESULT_ALREADY_EXISTS");
  const executable = registry.execution.executable;
  const executableBytes = fs.readFileSync(executable);
  const environment = { ...process.env };
  for (const name of registry.execution.providerCredentialVariablesRemoved) delete environment[name];
  const members = [];
  for (let index = 0; index < selection.pending.length; index += 1) {
    const relativePath = selection.pending[index];
    assert.notEqual(relativePath, browserPath);
    const absolutePath = path.join(repositoryRoot, ...relativePath.split("/"));
    const sourceBytes = fs.readFileSync(absolutePath);
    const arguments_ = [...registry.execution.argumentsBeforePath, absolutePath];
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const result = childProcess.spawnSync(executable, arguments_, {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: environment,
      maxBuffer: 16 * 1024 * 1024,
      shell: false,
      timeout: 300_000,
      windowsHide: true
    });
    const durationMs = Math.round(performance.now() - started);
    const stdout = result.stdout ?? "";
    const stderr = result.stderr ?? "";
    members.push({
      ordinal: index + 1,
      relativePath,
      executionCount: 1,
      startedAt,
      durationMs,
      exitCode: result.status,
      signal: result.signal ?? null,
      spawnError: result.error?.code ?? null,
      status: result.status === 0 && result.error === undefined ? "PASS" : "FAIL",
      sourceByteLength: sourceBytes.length,
      sourceSha256: sha256(sourceBytes),
      stdoutByteLength: Buffer.byteLength(stdout),
      stdoutSha256: sha256(stdout),
      stderrByteLength: Buffer.byteLength(stderr),
      stderrSha256: sha256(stderr)
    });
  }
  const failures = members.filter((item) => item.status !== "PASS");
  const record = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_36_MENTOR_GUIDED_REASONING_POWERSHELL_STATIC_RESULT",
    version: "1.12.36",
    selectionMode: registry.selectionMode,
    selectionRegistry: {
      relativePath: normalize(path.relative(repositoryRoot, registryPath)),
      sha256: sha256(fs.readFileSync(registryPath))
    },
    executable: {
      path: normalize(executable),
      byteLength: executableBytes.length,
      sha256: sha256(executableBytes)
    },
    retainedMembers: { count: selection.retained.length, executionCountThisRun: 0 },
    newlyExecutedMembers: { count: members.length, pass: members.length - failures.length, fail: failures.length },
    browserGate: {
      path: browserPath,
      executionCountThisRun: 0,
      classification: registry.browserGate.classification
    },
    reconciliation: selection.reconciliation,
    members,
    overallStatus: failures.length === 0 ? "PASS" : "FAIL"
  };
  fs.writeFileSync(resultPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  const readback = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  assert.equal(readback.members.length, selection.pending.length);
  assert.deepEqual(readback.members.map((item) => item.relativePath), selection.pending);
  process.stdout.write(`${JSON.stringify({ overallStatus: record.overallStatus, memberCount: members.length, passed: members.length - failures.length, failed: failures.length, resultRelativePath, resultSha256: sha256(fs.readFileSync(resultPath)) })}\n`);
  if (failures.length !== 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const mode = process.argv[2];
  if (mode === "VALIDATE") {
    const result = validateCurrentSelection();
    process.stdout.write(`${JSON.stringify({ status: "PASS", governingMembers: result.selected.length, retainedMembers: result.retained.length, pendingMembers: result.pending.length, excludedMembers: result.excluded.length, reconciliation: result.reconciliation })}\n`);
  } else if (mode === "RUN_PENDING") {
    assert.equal(typeof process.argv[3], "string", "RESULT_PATH_REQUIRED");
    runPending(process.argv[3]);
  } else {
    throw new Error("Usage: node version-1.12.36-mentor-guided-reasoning-validation-selection.mjs VALIDATE|RUN_PENDING [result-path]");
  }
}
