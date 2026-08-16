import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { validateMemberResult, validateRegistry } from "./version-1.12.35-boolean-predicate-successor-v2-contract.mjs";
import { ROOT, compactJson, readJson, sealRecord, sha256, verifySeal, writeCreateOnly } from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v2";
const registryPath = path.join(evidenceRoot, `${prefix}-registry.json`);
const baselinePath = path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json");
const proofPath = path.join(evidenceRoot, `${prefix}-offline-proof-result.json`);
const runnerPath = path.join(evidenceRoot, `${prefix}-runner.mjs`);
const resultRoot = path.join(evidenceRoot, `${prefix}-member-results`);
const ledgerPath = path.join(evidenceRoot, `${prefix}-execution-ledger.json`);
if (fs.existsSync(ledgerPath) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${ledgerPath}`);

const proof = readJson(proofPath);
const proofSeal = verifySeal(proof, "proofHash");
if (proofSeal.valid !== true || proof.status !== "PASS" || proof.executionCount !== 1 || proof.sweepMembersExecuted !== 0) throw new Error("OFFLINE_PROOF_NOT_SINGLE_VERIFIED_PASS");
const registry = validateRegistry(readJson(registryPath));
const pending = registry.entries.filter((entry) => entry.state === "PENDING");
const execution = [];
let safeToContinue = true;

for (const entry of pending) {
  const resultPath = path.join(resultRoot, `${entry.id}.json`);
  if (fs.existsSync(resultPath) === true) {
    const retainedForwardProgress = validateMemberResult(readJson(resultPath), entry);
    execution.push({ id: entry.id, disposition: "VERIFIED_EXISTING_FORWARD_PROGRESS", status: retainedForwardProgress.status, executionCount: retainedForwardProgress.executionCount, resultPath: path.relative(ROOT, resultPath).replaceAll("\\", "/"), resultSha256: sha256(fs.readFileSync(resultPath)) });
    safeToContinue = retainedForwardProgress.restoration.roots.every((root) => root.equal === true);
    if (safeToContinue !== true) break;
    continue;
  }
  if (safeToContinue !== true) break;
  const invocation = childProcess.spawnSync(process.execPath, [runnerPath, registryPath, baselinePath, entry.id, resultPath], { cwd: ROOT, encoding: "utf8", windowsHide: true, shell: false, timeout: entry.timeoutMs + 30000, maxBuffer: 4 * 1024 * 1024 });
  if (Object.prototype.hasOwnProperty.call(invocation, "error") === true) throw new Error(`RUNNER_SPAWN_ERROR:${entry.id}`);
  if (fs.existsSync(resultPath) !== true) throw new Error(`RUNNER_RESULT_MISSING:${entry.id}:${invocation.status}`);
  const result = validateMemberResult(readJson(resultPath), entry);
  execution.push({ id: entry.id, disposition: "EXECUTED_NOW", status: result.status, executionCount: result.executionCount, exitCode: result.exitIdentity.exitCode, stdoutSha256: result.outputIdentities.stdoutSha256, stderrSha256: result.outputIdentities.stderrSha256, restorationStatus: result.restoration.status, resultPath: path.relative(ROOT, resultPath).replaceAll("\\", "/"), resultSha256: sha256(fs.readFileSync(resultPath)) });
  process.stdout.write(`${compactJson(execution.at(-1))}\n`);
  safeToContinue = result.restoration.roots.every((root) => root.equal === true);
}

const resultFiles = fs.readdirSync(resultRoot).filter((name) => /^(?:STATIC-0(?:29|3\d|4\d|5[0-3])|RELEASE-0(?:0[1-9]|1[0-5]))\.json$/.test(name)).sort();
const expectedFiles = pending.map((entry) => `${entry.id}.json`).sort();
const missing = expectedFiles.filter((name) => resultFiles.includes(name) !== true);
const unexpected = resultFiles.filter((name) => expectedFiles.includes(name) !== true);
const duplicateExecutions = execution.filter((item) => item.executionCount !== 1).map((item) => item.id);
const results = pending.filter((entry) => fs.existsSync(path.join(resultRoot, `${entry.id}.json`)) === true).map((entry) => validateMemberResult(readJson(path.join(resultRoot, `${entry.id}.json`)), entry));
const totals = { pendingEntries: pending.length, terminalResults: results.length, pass: results.filter((result) => result.status === "PASS").length, fail: results.filter((result) => result.status === "FAIL").length, executionCount: results.reduce((sum, result) => sum + result.executionCount, 0), missing: missing.length, unexpected: unexpected.length, duplicateExecutions: duplicateExecutions.length };
const ledgerBasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_EXECUTION_LEDGER",
  proof: { relativePath: path.relative(ROOT, proofPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(proofPath)), proofHash: proof.proofHash },
  registry: { relativePath: path.relative(ROOT, registryPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(registryPath)), registryHash: registry.registryHash },
  execution,
  totals,
  missing,
  unexpected,
  duplicateExecutions,
  safeToContinue,
};
const ledger = sealRecord(ledgerBasis, "executionLedgerHash");
writeCreateOnly(ledgerPath, ledger);
const complete = totals.terminalResults === 40 && totals.executionCount === 40 && missing.length === 0 && unexpected.length === 0 && duplicateExecutions.length === 0;
process.stdout.write(`${compactJson({ status: complete === true ? "COMPLETE" : "INCOMPLETE", totals, safeToContinue, executionLedgerHash: ledger.executionLedgerHash })}\n`);
process.exit(complete === true ? 0 : 1);
