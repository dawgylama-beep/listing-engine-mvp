import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  compareInventories,
  compactJson,
  inventoryRoot,
  readJson,
  sha256Bytes,
  writeCompactJsonCreateOnly,
} from "./version-1.12.35-exhaustive-continuation-identity.mjs";

const [registryPath, baselinePath, entryId, resultPath] = process.argv.slice(2);
if (![registryPath, baselinePath, entryId, resultPath].every(Boolean)) throw new Error("USAGE: runner registry baseline entryId resultPath");
if (fs.existsSync(resultPath)) throw new Error(`RESULT_ALREADY_EXISTS:${resultPath}`);

const registry = readJson(registryPath);
const baseline = readJson(baselinePath);
const entry = registry.entries.find((candidate) => candidate.id === entryId);
if (!entry) throw new Error(`ENTRY_NOT_FOUND:${entryId}`);
if (entry.state !== "PENDING") throw new Error(`ENTRY_NOT_EXECUTABLE:${entryId}:${entry.state}`);

function compareGovernedRoots() {
  return baseline.mutableOutputRoots.map((expected) => {
    const actual = inventoryRoot(registry.repositoryRoot, expected.absoluteRoot, { pathBase: expected.pathBase });
    return { rootId: expected.rootId, ...compareInventories(expected.inventory, actual), actual };
  });
}

const before = compareGovernedRoots();
if (before.some((result) => !result.equal)) throw new Error(`PRE_EXECUTION_BASELINE_MISMATCH:${compactJson(before)}`);
const startedAt = new Date().toISOString();
const startedMs = Date.now();
const child = childProcess.spawnSync(entry.executable, entry.arguments, {
  cwd: entry.workingDirectory,
  encoding: "utf8",
  windowsHide: true,
  shell: false,
  timeout: entry.timeoutMs,
  maxBuffer: 32 * 1024 * 1024,
});
const after = compareGovernedRoots();
const restorationPass = after.every((result) => result.equal);
const exitCode = Number.isInteger(child.status) ? child.status : -1;
const stdout = child.stdout ?? "";
const stderr = child.stderr ?? "";
const status = exitCode === 0 && restorationPass && !child.error ? "PASS" : "FAIL";
const result = {
  schemaVersion: "1.0",
  resultType: "VERSION_1_12_35_CONTINUATION_MEMBER_RESULT",
  entryId,
  provenance: "SUCCESSOR_CONTINUATION_EXECUTION",
  executionCount: 1,
  status,
  startedAt,
  durationMs: Date.now() - startedMs,
  exitIdentity: {
    exitCode,
    signal: child.signal ?? null,
    spawnError: child.error ? `${child.error.name}:${child.error.code ?? "UNKNOWN"}` : null,
  },
  outputIdentities: {
    stdoutByteLength: Buffer.byteLength(stdout, "utf8"),
    stdoutSha256: sha256Bytes(stdout),
    stderrByteLength: Buffer.byteLength(stderr, "utf8"),
    stderrSha256: sha256Bytes(stderr),
    boundedOutput: `${stdout}\n${stderr}`.slice(-4096),
  },
  dependencyDisposition: "PREREQUISITES_SATISFIED",
  restoration: {
    required: entry.outputProducing,
    status: restorationPass ? (entry.outputProducing ? "BASELINE_EQUAL_AFTER_EXECUTION" : "NO_MUTATION_OBSERVED") : "BASELINE_MISMATCH",
    roots: after.map(({ rootId, equal, existenceChanged, missing, unexpected, changed }) => ({ rootId, equal, existenceChanged, missing, unexpected, changed })),
  },
  processContract: {
    executable: entry.executable,
    arguments: entry.arguments,
    workingDirectory: entry.workingDirectory,
    shell: false,
  },
};
writeCompactJsonCreateOnly(resultPath, result);
process.stdout.write(`${compactJson({ entryId, status, exitCode, resultPath, resultSha256: sha256Bytes(fs.readFileSync(resultPath)) })}\n`);
process.exit(status === "PASS" ? 0 : 1);
