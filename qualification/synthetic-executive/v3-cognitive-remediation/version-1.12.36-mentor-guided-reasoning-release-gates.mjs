import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertNoRawValueFields,
  scanRepository
} from "./version-1.12.35-secret-scan-sentinel-successor-v1-scanner.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..", "..", "..");
const secretRegistryPath = path.join(path.dirname(scriptPath), "version-1.12.35-secret-scan-sentinel-successor-v1-registry.json");
const powershellPath = "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const normalize = (value) => value.replaceAll("\\", "/");

function git(arguments_) {
  const result = childProcess.spawnSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });
  assert.equal(result.status, 0, `git ${arguments_.join(" ")} failed`);
  return result.stdout.trim();
}

function runServerCheck() {
  const temporaryBase = path.resolve(os.tmpdir());
  const temporaryRoot = fs.mkdtempSync(path.join(temporaryBase, "k36-mentor-server-check-"));
  assert.ok(temporaryRoot.startsWith(temporaryBase + path.sep), "TEMPORARY_ROOT_ESCAPE");
  assert.ok(path.basename(temporaryRoot).startsWith("k36-mentor-server-check-"), "TEMPORARY_ROOT_PREFIX_MISMATCH");
  const sourcePath = path.join(repositoryRoot, "server.ps1");
  const temporaryPath = path.join(temporaryRoot, "server.ps1");
  const environment = { ...process.env };
  for (const name of ["OPENAI_API_KEY", "OPEN_API_KEY", "SERPER_API_KEY"]) delete environment[name];
  try {
    fs.copyFileSync(sourcePath, temporaryPath, fs.constants.COPYFILE_EXCL);
    assert.equal(fs.existsSync(path.join(temporaryRoot, ".env")), false, "TEMPORARY_ROOT_CONTAINS_DOTENV");
    const sourceBytes = fs.readFileSync(sourcePath);
    const copyBytes = fs.readFileSync(temporaryPath);
    assert.deepEqual(copyBytes, sourceBytes, "SERVER_COPY_IDENTITY_MISMATCH");
    const arguments_ = ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", temporaryPath, "-Check"];
    const result = childProcess.spawnSync(powershellPath, arguments_, {
      cwd: temporaryRoot,
      encoding: "utf8",
      env: environment,
      shell: false,
      timeout: 300_000,
      windowsHide: true
    });
    assert.equal(result.error, undefined, "SERVER_CHECK_SPAWN_FAILED");
    assert.equal(result.status, 0, "SERVER_CHECK_FAILED");
    return {
      status: "PASS",
      executionCount: 1,
      sourceByteLength: sourceBytes.length,
      sourceSha256: sha256(sourceBytes),
      copyExact: true,
      dotenvPresent: false,
      credentialSourceReads: 0,
      exitCode: result.status,
      stdoutSha256: sha256(result.stdout ?? ""),
      stderrSha256: sha256(result.stderr ?? "")
    };
  } finally {
    const resolved = path.resolve(temporaryRoot);
    assert.ok(resolved.startsWith(temporaryBase + path.sep), "TEMPORARY_REMOVAL_ESCAPE");
    assert.ok(path.basename(resolved).startsWith("k36-mentor-server-check-"), "TEMPORARY_REMOVAL_PREFIX_MISMATCH");
    fs.rmSync(resolved, { force: true, recursive: true });
  }
}

function runSecretScan() {
  const registry = JSON.parse(fs.readFileSync(secretRegistryPath, "utf8"));
  const result = scanRepository(repositoryRoot, registry);
  assertNoRawValueFields(result, "secretScan");
  assert.equal(result.status, "PASS", "SENTINEL_AWARE_SECRET_SCAN_FAILED");
  assert.equal(result.knownSentinelFindingCount, 6);
  assert.equal(result.unexpectedFindingCount, 0);
  assert.equal(result.missingRegistryEntryCount, 0);
  assert.equal(result.credentialValuesRead, 0);
  assert.equal(result.rawValuesEmitted, 0);
  return { ...result, executionCount: 1, credentialSourceReads: 0 };
}

function runRepositoryIntegrity() {
  const modified = git(["diff", "--name-only", "-z"]).split("\0").filter(Boolean).map(normalize).sort();
  const frozenPrefixes = [
    "qualification/synthetic-executive/v3-held-out-corpus/",
    "qualification/synthetic-executive/v3-qualification-result-v1.12.35/"
  ];
  const frozenMutations = modified.filter((relativePath) => (
    frozenPrefixes.some((prefix) => relativePath.startsWith(prefix))
    || relativePath.endsWith("cognitive-freeze.json")
    || relativePath.endsWith("v3-release-binding-successor-executable-freeze.json")
  ));
  const version11235Mutations = modified.filter((relativePath) => relativePath.includes("version-1.12.35"));
  const cognitiveFreeze = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "qualification/synthetic-executive/v3-cognitive-remediation/cognitive-freeze.json"), "utf8"));
  const successorFreeze = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "qualification/synthetic-executive/v3-cognitive-remediation/v3-release-binding-successor-executable-freeze.json"), "utf8"));
  const corpusSeal = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "qualification/synthetic-executive/v3-held-out-corpus/corpus-seal.json"), "utf8"));
  const terminalPath = path.join(repositoryRoot, "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-secret-scan-sentinel-successor-v1-terminal-release-record.json");
  const dotEnvIgnored = childProcess.spawnSync("git", ["check-ignore", "-q", ".env"], { cwd: repositoryRoot, windowsHide: true }).status === 0;
  const dotEnvTracked = childProcess.spawnSync("git", ["ls-files", "--error-unmatch", ".env"], { cwd: repositoryRoot, windowsHide: true }).status === 0;
  assert.deepEqual(frozenMutations, []);
  assert.deepEqual(version11235Mutations, []);
  assert.equal(cognitiveFreeze.freezeHash, "f0127ed29a1fe40fdd08936712ad09ff884405dbf8c81147f5709e3f2c2eb194");
  assert.equal(successorFreeze.successorFreezeHash, "45f7779d2ad4a16f3a99bc4eadd994a93edf40776d26f39a0c9016c43db37f02");
  assert.equal(corpusSeal.corpusSealHash, "61c67cf5a725ea0eab6d02e8f3ac4ece6bc02fb0fd8e2dffb378878db8bc1061");
  assert.equal(sha256(fs.readFileSync(terminalPath)), "670deefbc40a98b8eeb93c552783e60db579db395731e1d6954a130a4f139277");
  assert.equal(dotEnvIgnored, true);
  assert.equal(dotEnvTracked, false);
  return {
    status: "PASS",
    executionCount: 1,
    branch: git(["branch", "--show-current"]),
    head: git(["rev-parse", "HEAD"]),
    tree: git(["rev-parse", "HEAD^{tree}"]),
    tracking: git(["rev-parse", "@{upstream}"]),
    frozenMutations,
    version11235Mutations,
    cognitiveFreezeHash: cognitiveFreeze.freezeHash,
    successorFreezeHash: successorFreeze.successorFreezeHash,
    corpusSealHash: corpusSeal.corpusSealHash,
    version11235TerminalSha256: sha256(fs.readFileSync(terminalPath)),
    dotEnvIgnored,
    dotEnvTracked
  };
}

function executeGate(gateId, gate) {
  const startedAt = new Date().toISOString();
  const started = performance.now();
  try {
    const details = gate();
    return { gateId, status: "PASS", startedAt, durationMs: Math.round(performance.now() - started), details };
  } catch (error) {
    return {
      gateId,
      status: "FAIL",
      startedAt,
      durationMs: Math.round(performance.now() - started),
      failureCode: error?.message ?? "UNEXPECTED_GATE_FAILURE",
      details: {}
    };
  }
}

function runCorrection(resultRelativePath) {
  assert.equal(resultRelativePath, normalize(resultRelativePath));
  assert.ok(resultRelativePath.startsWith("qualification/synthetic-executive/v3-cognitive-remediation/"));
  const resultPath = path.join(repositoryRoot, ...resultRelativePath.split("/"));
  assert.equal(fs.existsSync(resultPath), false, "CORRECTION_RESULT_ALREADY_EXISTS");
  const results = [
    executeGate("SERVER_CHECK", runServerCheck),
    executeGate("SECRET_SCAN", runSecretScan),
    executeGate("REPOSITORY_INTEGRITY", runRepositoryIntegrity)
  ];
  const failures = results.filter((item) => item.status !== "PASS");
  const record = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_36_MENTOR_GUIDED_REASONING_CONSOLIDATED_CORRECTION_RESULT",
    version: "1.12.36",
    correctionCycle: 1,
    executionCountPerGate: 1,
    overallStatus: failures.length === 0 ? "PASS" : "FAIL",
    results,
    activity: {
      credentialSourceReads: 0,
      credentialValuesRead: 0,
      providerCalls: 0,
      metadataRequests: 0,
      v3Executions: 0,
      v3Evaluations: 0,
      qualificationExecutions: 0,
      benchmarkExecutions: 0,
      productHandlerCalls: 0,
      deployments: 0,
      activations: 0,
      remoteWrites: 0
    }
  };
  assertNoRawValueFields(record, "correctionResult");
  fs.writeFileSync(resultPath, `${JSON.stringify(record, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  const resultSha256 = sha256(fs.readFileSync(resultPath));
  process.stdout.write(`${JSON.stringify({ overallStatus: record.overallStatus, passed: results.length - failures.length, failed: failures.length, resultRelativePath, resultSha256 })}\n`);
  if (failures.length !== 0) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  assert.equal(process.argv[2], "RUN_CORRECTION", "Usage: node version-1.12.36-mentor-guided-reasoning-release-gates.mjs RUN_CORRECTION <result-path>");
  assert.equal(typeof process.argv[3], "string", "RESULT_PATH_REQUIRED");
  runCorrection(process.argv[3]);
}
