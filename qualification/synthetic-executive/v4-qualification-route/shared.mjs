import assert from "node:assert/strict";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { lstat, mkdir, readFile, realpath, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));

export const routeRoot = scriptDirectory;
export const qualificationRoot = path.resolve(routeRoot, "..");
export const repositoryRoot = path.resolve(qualificationRoot, "..", "..");
export const corpusRoot = path.join(qualificationRoot, "v4-held-out-corpus");
export const ROUTE_VERSION = "1.12.42";
export const CASE_IDS = Object.freeze(Array.from({ length: 14 }, (_, index) => `KE-V4-C${String(index + 1).padStart(2, "0")}`));
export const PACKAGE_IDENTITIES = Object.freeze({
  integrityManifestSha256: "a619da7409b8e03618b5a4971ea0a4a4859f25ff60dff425178bd71e0de4cc73",
  completePackageRootHash: "1ce01f46f944610f3501da467067f29571c75bfe90360ea5e46551d0387a90b5",
  publicCorpusRootHash: "d388c11c93b99bdba94dbab021acf9f5c3cfa75d4e5184742a33528d3d05819c",
  evaluatorControlAggregateHash: "68cc5d0359721fc8b738172ee2ab8a07116ebb5c50141fce2480eda4e766ab3e",
  releaseEvidenceSha256: "4a3987f10613abb7d92744930b23140d9f5b6d9210c2d9f54a155455e8656020",
  executionBudgetSha256: "dd965fe1fce0aa574e0ed2a48d7a84df40f8ee1567e438c6c3a03b2edafea9d6",
  authorityTemplateSha256: "6c82033266f6b69fef3ca0b2ce7d26b1d991d416d8b10bc4633a5c3457fcd2b2"
});
export const EXECUTION_LIMITS = Object.freeze({
  model: "gpt-5.6-sol", reasoningEffort: "medium", store: false, caseSlots: 14,
  maximumOutputTokensPerCase: 4_000, maximumRequestBytesPerCase: 64_000,
  aggregateMaximumRetries: 12, maximumReservationUsdPerSlot: 1.25, totalCostCeilingUsd: 12,
  maximumResponseBytes: 1_048_576, responseOverflowBytes: 1_048_577,
  pricing: Object.freeze({ inputUsdPerMillionTokens: 5, outputUsdPerMillionTokens: 30 })
});
export const MECHANICAL_RETRY_REASONS = Object.freeze([
  "PROVIDER_TIMEOUT", "PROVIDER_CONNECTION_FAILURE", "PROVIDER_RATE_LIMITED", "PROVIDER_SERVER_ERROR"
]);

export const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : (value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])) : value);
export const stableJson = (value) => JSON.stringify(canonicalize(value));
export const sha256Bytes = (value) => crypto.createHash("sha256").update(value).digest("hex");
export const sha256Json = (value) => sha256Bytes(Buffer.from(stableJson(value), "utf8"));

export function seal(record, hashField) {
  const core = canonicalize(record);
  assert.equal(Object.hasOwn(core, hashField), false, `${hashField} must not be supplied`);
  return Object.freeze({ ...core, [hashField]: sha256Json(core) });
}

export function verifySeal(record, hashField) {
  assert.ok(record && typeof record === "object" && !Array.isArray(record), `${hashField} record required`);
  const core = structuredClone(record); const claimed = core[hashField]; delete core[hashField];
  assert.match(claimed || "", /^[a-f0-9]{64}$/, `${hashField} missing`);
  assert.equal(sha256Json(core), claimed, `${hashField} differs`);
  return record;
}

export async function readJson(filePath) { return JSON.parse(await readFile(filePath, "utf8")); }
export async function writeExclusiveJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${stableJson(value)}\n`, { encoding: "utf8", flag: "wx" });
  return value;
}
export async function writeExclusiveBytes(filePath, bytes) {
  await mkdir(path.dirname(filePath), { recursive: true }); await writeFile(filePath, bytes, { flag: "wx" });
}
export async function existsLiteral(filePath) {
  try { await lstat(filePath); return true; }
  catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

function normalizedForComparison(value) {
  const normalized = path.resolve(value).replace(/[\\/]+$/, "");
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}
export function pathInside(candidate, parent) {
  const relative = path.relative(normalizedForComparison(parent), normalizedForComparison(candidate));
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
function rejectPathAliases(absolutePath) {
  assert.equal(absolutePath.startsWith("\\\\?\\") || absolutePath.startsWith("\\\\.\\"), false, "EXTENDED_PATH_ALIAS_FORBIDDEN");
  for (const component of absolutePath.split(/[\\/]+/)) {
    assert.equal(/[. ]$/.test(component), false, "TRAILING_PATH_ALIAS_FORBIDDEN");
    assert.equal(/~\d/i.test(component), false, "SHORT_NAME_PATH_ALIAS_FORBIDDEN");
  }
}
export async function assertExternalNewResultsRoot(resultsRoot, { protectedRoots }) {
  assert.equal(typeof resultsRoot, "string");
  assert.equal(path.isAbsolute(resultsRoot), true, "RESULTS_ROOT_MUST_BE_ABSOLUTE");
  assert.equal(path.resolve(resultsRoot), resultsRoot, "RESULTS_ROOT_MUST_BE_CANONICAL");
  rejectPathAliases(resultsRoot);
  assert.equal(await existsLiteral(resultsRoot), false, "RESULTS_ROOT_MUST_NOT_EXIST");
  const lower = resultsRoot.replaceAll("\\", "/").toLowerCase();
  assert.equal(/\/(benchmarks|blind-object-v1-results|qualification-results)(\/|$)/.test(lower), false, "EARLIER_RESULTS_LOCATION_FORBIDDEN");
  for (const protectedRoot of protectedRoots) assert.equal(pathInside(resultsRoot, protectedRoot), false, "RESULTS_ROOT_INSIDE_PROTECTED_TREE");
  const parent = path.dirname(resultsRoot); const parentStat = await lstat(parent);
  assert.equal(parentStat.isSymbolicLink(), false, "RESULTS_PARENT_REPARSE_POINT_FORBIDDEN");
  assert.equal(normalizedForComparison(await realpath(parent)), normalizedForComparison(parent), "RESULTS_PARENT_PATH_ALIAS_FORBIDDEN");
  return true;
}
export async function assertExternalExistingFile(filePath, { protectedRoots }) {
  assert.equal(path.isAbsolute(filePath), true, "AUTHORIZATION_PATH_MUST_BE_ABSOLUTE");
  assert.equal(path.resolve(filePath), filePath, "AUTHORIZATION_PATH_MUST_BE_CANONICAL"); rejectPathAliases(filePath);
  const sourceStat = await lstat(filePath);
  assert.equal(sourceStat.isFile(), true, "AUTHORIZATION_MUST_BE_FILE");
  assert.equal(sourceStat.isSymbolicLink(), false, "AUTHORIZATION_REPARSE_POINT_FORBIDDEN");
  assert.equal(normalizedForComparison(await realpath(filePath)), normalizedForComparison(filePath), "AUTHORIZATION_PATH_ALIAS_FORBIDDEN");
  for (const protectedRoot of protectedRoots) assert.equal(pathInside(filePath, protectedRoot), false, "AUTHORIZATION_INSIDE_PROTECTED_TREE");
  return true;
}

const gitArgs = (...args) => ["-c", "core.longpaths=true", "-c", "core.autocrlf=false", "-c", "core.eol=lf", ...args];
export async function inspectRepository(root = repositoryRoot) {
  const git = async (...args) => (await execFileAsync("git", gitArgs(...args), { cwd: root, encoding: "utf8" })).stdout.trim();
  const [head, tree, parent, subject, status, gitDirectory, commonDirectory, worktreesText] = await Promise.all([
    git("rev-parse", "HEAD"), git("show", "-s", "--format=%T", "HEAD"), git("show", "-s", "--format=%P", "HEAD"),
    git("show", "-s", "--format=%s", "HEAD"), git("status", "--porcelain", "--untracked-files=no"),
    git("rev-parse", "--path-format=absolute", "--git-dir"), git("rev-parse", "--path-format=absolute", "--git-common-dir"), git("worktree", "list", "--porcelain")
  ]);
  assert.equal(status, "", "TRACKED_REPOSITORY_MUST_BE_CLEAN");
  const worktreeRoots = worktreesText.split(/\r?\n/).filter((line) => line.startsWith("worktree ")).map((line) => path.resolve(line.slice(9)));
  return Object.freeze({ head, tree, parent, subject, status, gitDirectory: path.resolve(gitDirectory), commonDirectory: path.resolve(commonDirectory), worktreeRoots });
}
export async function inspectPackageIdentities(root = corpusRoot) {
  const paths = {
    integrityManifestSha256: "readiness-integrity-manifest.json", releaseEvidenceSha256: "v4-package-release-evidence.json",
    executionBudgetSha256: "proposed/execution-budget.json", authorityTemplateSha256: "proposed/authority-binding-template.json"
  };
  const actual = {};
  for (const [field, relativePath] of Object.entries(paths)) actual[field] = sha256Bytes(await readFile(path.join(root, ...relativePath.split("/"))));
  const manifest = await readJson(path.join(root, "readiness-integrity-manifest.json"));
  actual.completePackageRootHash = manifest.completePackageRootHash; actual.publicCorpusRootHash = manifest.publicCorpusRootHash;
  actual.evaluatorControlAggregateHash = manifest.evaluatorControlAggregateHash;
  assert.deepEqual(actual, PACKAGE_IDENTITIES, "SEALED_V4_IDENTITIES_DIFFER");
  return Object.freeze({ ...actual, manifest });
}
export async function runSealedVerifier(root = corpusRoot) {
  const result = await execFileAsync(process.execPath, [path.join(root, "scripts", "v4-package-verifier.mjs")], { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  const parsed = JSON.parse(result.stdout.trim()); assert.equal(parsed.result, "PASS", "SEALED_V4_VERIFIER_FAILED");
  assert.equal(parsed.caseCount, 14); assert.equal(parsed.checkCount, 98); return Object.freeze(parsed);
}

export function validateAuthorization(authority, { resultsRoot, repositoryIdentity, now = new Date().toISOString() }) {
  verifySeal(authority, "authorizationHash"); assert.equal(authority.schemaVersion, "1.0");
  assert.equal(authority.authorityType, "EXTERNAL_CONTROL_ROOM_V4_QUALIFICATION_AUTHORIZATION");
  assert.equal(authority.authorizationStatus, "AUTHORIZED", "V4_AUTHORITY_NOT_AUTHORIZED"); assert.equal(authority.singleRun, true);
  assert.match(authority.authorizationId || "", /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/); assert.match(authority.runId || "", /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/);
  const issued = Date.parse(authority.issuedAt); const expires = Date.parse(authority.expiresAt); const current = Date.parse(now);
  assert.equal(Number.isFinite(issued) && Number.isFinite(expires) && Number.isFinite(current), true, "AUTHORITY_TIME_INVALID");
  assert.ok(issued <= current, "AUTHORITY_NOT_YET_VALID"); assert.ok(current < expires, "AUTHORITY_EXPIRED");
  assert.equal(authority.repositoryCommit, repositoryIdentity.head, "AUTHORITY_REPOSITORY_COMMIT_MISMATCH");
  assert.deepEqual(authority.packageIdentities, PACKAGE_IDENTITIES, "AUTHORITY_PACKAGE_IDENTITIES_MISMATCH");
  assert.equal(normalizedForComparison(authority.resultsRoot), normalizedForComparison(resultsRoot), "AUTHORITY_RESULTS_ROOT_MISMATCH");
  for (const [field, expected] of Object.entries({
    model: EXECUTION_LIMITS.model, reasoningEffort: EXECUTION_LIMITS.reasoningEffort, store: false, caseSlots: 14,
    maximumOutputTokensPerCase: 4_000, maximumRequestBytesPerCase: 64_000, aggregateMaximumRetries: 12,
    maximumReservationUsdPerSlot: 1.25, totalCostCeilingUsd: 12, replayPermitted: false,
    replacementCasesPermitted: false, authorityResetPermitted: false, evaluatorAccessBeforeFreezePermitted: false
  })) assert.deepEqual(authority[field], expected, `AUTHORITY_${field.toUpperCase()}_MISMATCH`);
  assert.deepEqual(authority.mechanicalRetryReasons, MECHANICAL_RETRY_REASONS); return authority;
}
export function authorizationFixture(overrides = {}) {
  return seal({
    schemaVersion: "1.0", authorityType: "EXTERNAL_CONTROL_ROOM_V4_QUALIFICATION_AUTHORIZATION", authorizationStatus: "AUTHORIZED",
    authorizationId: "OFFLINE-CONTROL-ROOM-AUTHORITY", runId: "OFFLINE-V4-RUN-IDENTITY",
    issuedAt: "2026-08-21T12:00:00.000Z", expiresAt: "2026-08-22T12:00:00.000Z", repositoryCommit: "0".repeat(40),
    packageIdentities: PACKAGE_IDENTITIES, resultsRoot: "", model: EXECUTION_LIMITS.model, reasoningEffort: EXECUTION_LIMITS.reasoningEffort,
    store: false, caseSlots: 14, maximumOutputTokensPerCase: 4_000, maximumRequestBytesPerCase: 64_000,
    aggregateMaximumRetries: 12, maximumReservationUsdPerSlot: 1.25, totalCostCeilingUsd: 12,
    replayPermitted: false, replacementCasesPermitted: false, authorityResetPermitted: false,
    evaluatorAccessBeforeFreezePermitted: false, mechanicalRetryReasons: MECHANICAL_RETRY_REASONS, singleRun: true, ...overrides
  }, "authorizationHash");
}
export async function appendLedger(resultsRoot, entry) {
  const ledgerRoot = path.join(resultsRoot, "ledger"); await mkdir(ledgerRoot, { recursive: true });
  const names = (await readdir(ledgerRoot)).filter((name) => /^\d{6}-.+\.json$/.test(name)).sort(); const ordinal = names.length;
  const sealed = seal({ schemaVersion: "1.0", ordinal, ...entry }, "ledgerEntryHash");
  const kind = String(entry.kind || "entry").toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  await writeExclusiveJson(path.join(ledgerRoot, `${String(ordinal).padStart(6, "0")}-${kind}.json`), sealed); return sealed;
}
export async function readLedger(resultsRoot) {
  const ledgerRoot = path.join(resultsRoot, "ledger"); const names = (await readdir(ledgerRoot)).filter((name) => /^\d{6}-.+\.json$/.test(name)).sort();
  const entries = [];
  for (const [index, name] of names.entries()) { const entry = verifySeal(await readJson(path.join(ledgerRoot, name)), "ledgerEntryHash"); assert.equal(entry.ordinal, index, "LEDGER_ORDINAL_GAP"); entries.push(entry); }
  return entries;
}
export async function acquireExecutionLock(resultsRoot, { resume, invocationId }) {
  const active = path.join(resultsRoot, ".execution-active");
  if (resume) { assert.equal(await existsLiteral(active), true, "NO_INTERRUPTED_EXECUTION_TO_RESUME"); await rename(active, path.join(resultsRoot, `.execution-abandoned-${invocationId}`)); }
  else assert.equal(await existsLiteral(active), false, "DUPLICATE_EXECUTION_INVOCATION");
  await mkdir(active, { recursive: false }); await writeExclusiveJson(path.join(active, "invocation.json"), seal({ schemaVersion: "1.0", invocationId, resume }, "invocationHash"));
  return Object.freeze({ active, complete: async () => rename(active, path.join(resultsRoot, `.execution-complete-${invocationId}`)) });
}
export function parseCliArguments(argv, required, optionalFlags = []) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) { const token = argv[index]; if (optionalFlags.includes(token)) { result[token.slice(2)] = true; continue; } assert.ok(token.startsWith("--") && index + 1 < argv.length, `INVALID_ARGUMENT:${token}`); result[token.slice(2)] = argv[++index]; }
  for (const field of required) assert.ok(result[field], `MISSING_ARGUMENT:${field}`); return result;
}
