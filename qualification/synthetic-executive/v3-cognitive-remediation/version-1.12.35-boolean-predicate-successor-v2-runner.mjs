import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { requireOwnAbsent, ROOT, compactJson, compareInventories, inventoryRoot, readJson, sealRecord, sha256, verifySeal, writeCreateOnly } from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";
import { validateRegistry } from "./version-1.12.35-boolean-predicate-successor-v2-contract.mjs";

const arguments_ = process.argv.slice(2);
if (arguments_.length !== 4 || arguments_.some((value) => typeof value !== "string" || value.length === 0)) throw new Error("EXPECTED_FOUR_NONEMPTY_STRING_ARGUMENTS");
const [registryPath, baselinePath, entryId, resultPath] = arguments_;
if (fs.existsSync(resultPath) === true) throw new Error(`RESULT_ALREADY_EXISTS:${resultPath}`);
const registry = validateRegistry(readJson(registryPath));
const baseline = readJson(baselinePath);
const baselineSeal = verifySeal(baseline, "baselineHash");
if (baselineSeal.valid !== true) throw new Error("BASELINE_SEAL_INVALID");
const entry = registry.entries.find((candidate) => candidate.id === entryId);
if (entry === undefined) throw new Error(`ENTRY_NOT_FOUND:${entryId}`);
if (entry.state !== "PENDING") throw new Error(`ENTRY_NOT_EXECUTABLE:${entryId}:${entry.state}`);

function compareGovernedState() {
  const expectedMutable = baseline.mutableOutputRoots[0];
  const mutableActual = inventoryRoot(expectedMutable.absoluteRoot, { pathBase: expectedMutable.pathBase });
  const quarantineExpected = baseline.retainedQuarantine;
  const quarantineActual = inventoryRoot(quarantineExpected.absoluteRoot, { pathBase: quarantineExpected.absoluteRoot });
  const phaseExpected = baseline.phase6a.directory;
  const phaseRoot = path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd");
  const phaseActual = inventoryRoot(phaseRoot, { pathBase: phaseRoot });
  return [
    { rootId: "TEST_RESULTS", ...compareInventories(expectedMutable.inventory, mutableActual) },
    { rootId: "RETAINED_QUARANTINE", ...compareInventories(quarantineExpected.inventory, quarantineActual) },
    { rootId: "PHASE6A_DIRECTORY", ...compareInventories(phaseExpected, phaseActual) },
  ];
}

const before = compareGovernedState();
if (before.every((result) => result.equal === true) !== true) throw new Error(`PRE_EXECUTION_BASELINE_MISMATCH:${compactJson(before)}`);
const startedAt = new Date().toISOString();
const startedMs = Date.now();
const child = childProcess.spawnSync(entry.executable, entry.arguments, { cwd: entry.workingDirectory, encoding: "utf8", windowsHide: true, shell: false, timeout: entry.timeoutMs, maxBuffer: 32 * 1024 * 1024 });
const after = compareGovernedState();
const restorationPass = after.every((result) => result.equal === true);
let spawnErrorAbsent = false;
try { requireOwnAbsent(child, "error", `${entry.id}.spawnResult`); spawnErrorAbsent = true; } catch { spawnErrorAbsent = false; }
const exitCode = typeof child.status === "number" && Number.isInteger(child.status) === true ? child.status : -1;
const stdout = typeof child.stdout === "string" ? child.stdout : "";
const stderr = typeof child.stderr === "string" ? child.stderr : "";
const signal = child.signal === null || typeof child.signal === "string" ? child.signal : null;
const status = exitCode === 0 && restorationPass === true && spawnErrorAbsent === true ? "PASS" : "FAIL";
const sanitize = (text) => text.replace(/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{8,}\b/g, "[REDACTED_SECRET]").replace(/authorization\s*[:=]\s*bearer\s+\S+/gi, "authorization:[REDACTED]").slice(-4096);
const resultBasis = {
  schemaVersion: "3.0",
  resultType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_MEMBER_RESULT",
  entryId,
  provenance: "BOOLEAN_PREDICATE_SUCCESSOR_V2_EXECUTION",
  executionCount: 1,
  status,
  startedAt,
  durationMs: Date.now() - startedMs,
  exitIdentity: { exitCode, signal, spawnError: spawnErrorAbsent === true ? null : "SPAWN_ERROR_OWN_PROPERTY_PRESENT" },
  outputIdentities: { stdoutByteLength: Buffer.byteLength(stdout, "utf8"), stdoutSha256: sha256(stdout), stderrByteLength: Buffer.byteLength(stderr, "utf8"), stderrSha256: sha256(stderr), sanitizedFailure: status === "FAIL" ? sanitize(`${stdout}\n${stderr}`) : null },
  dependencyDisposition: "PREREQUISITES_SATISFIED",
  restoration: { required: entry.outputProducing, status: restorationPass === true ? (entry.outputProducing === true ? "BASELINE_EQUAL_AFTER_OUTPUT_PRODUCING_EXECUTION" : "NO_MUTATION_OBSERVED") : "BASELINE_MISMATCH", roots: after },
  processContract: { executable: entry.executable, arguments: entry.arguments, workingDirectory: entry.workingDirectory, shell: false },
};
const result = sealRecord(resultBasis, "memberResultHash");
writeCreateOnly(resultPath, result);
process.stdout.write(`${compactJson({ entryId, status, exitCode, resultPath: path.relative(ROOT, resultPath).replaceAll("\\", "/"), resultSha256: sha256(fs.readFileSync(resultPath)), memberResultHash: result.memberResultHash })}\n`);
process.exit(status === "PASS" ? 0 : 1);
