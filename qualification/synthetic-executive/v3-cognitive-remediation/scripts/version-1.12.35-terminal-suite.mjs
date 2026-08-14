import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { lstat, mkdir, readdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { canonicalize, sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
export const repositoryRoot = path.resolve(path.dirname(scriptPath), "..", "..", "..", "..");
export const policyPath = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-cognitive-remediation", "version-1.12.35-phase-owned-terminal-suite-policy.json");
export const captureDirectory = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-cognitive-remediation", "version-1.12.35-terminal-suite-capture");
export const successorCaptureIdentity = "VERSION_1_12_35_TERMINAL_SUITE_SUCCESSOR_001";
export const successorCaptureRelativePath = "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-terminal-suite-capture-successor-001";
export const successorCaptureDirectory = path.join(repositoryRoot, ...successorCaptureRelativePath.split("/"));
const temporaryDerivedName = ".version-1.12.35-terminal-suite-derived.mjs";
const ignoredDirectories = new Set([".git", "node_modules"]);
const captureRootRelativePath = "qualification/synthetic-executive/v3-cognitive-remediation";
const captureDefinitions = Object.freeze([{ identity: successorCaptureIdentity, relativePath: successorCaptureRelativePath }]);

const normalize = (value) => value.replaceAll("\\", "/");
const compareEntries = (left, right) => left.sourcePath < right.sourcePath ? -1 : left.sourcePath > right.sourcePath ? 1 : left.testIdentity < right.testIdentity ? -1 : left.testIdentity > right.testIdentity ? 1 : 0;
const sameEntry = (left, right) => left.sourcePath === right.sourcePath && left.testIdentity === right.testIdentity;
const literalPattern = String.raw`((?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*')|(?:\`(?:[^\`\\]|\\.)*\`))`;

export function assertCaptureDefinitions(definitions = captureDefinitions) {
  assert.equal(Array.isArray(definitions), true, "CAPTURE_DEFINITIONS_MUST_BE_AN_ARRAY");
  const identities = new Set();
  const destinations = new Set();
  for (const definition of definitions) {
    assert.deepEqual(Object.keys(definition).sort(), ["identity", "relativePath"], "CAPTURE_DEFINITION_FIELDS_CHANGED");
    assert.match(definition.identity, /^[A-Z][A-Z0-9_]*$/u, "CAPTURE_IDENTITY_FORMAT_INVALID");
    assert.equal(identities.has(definition.identity), false, "DUPLICATE_CAPTURE_IDENTITY");
    identities.add(definition.identity);
    assert.equal(path.isAbsolute(definition.relativePath), false, "CAPTURE_PATH_MUST_BE_RELATIVE");
    assert.equal(normalize(definition.relativePath), definition.relativePath, "CAPTURE_PATH_MUST_BE_NORMALIZED");
    assert.equal(definition.relativePath.split("/").some((segment) => segment === "" || segment === "." || segment === ".."), false, "CAPTURE_PATH_TRAVERSAL_FORBIDDEN");
    assert.equal(definition.relativePath.startsWith(`${captureRootRelativePath}/`), true, "CAPTURE_PATH_OUTSIDE_FIXED_ROOT");
    assert.equal(destinations.has(definition.relativePath), false, "DUPLICATE_CAPTURE_DESTINATION");
    destinations.add(definition.relativePath);
  }
  assert.equal(definitions.length, 1, "CAPTURE_DEFINITION_COUNT_CHANGED");
  assert.deepEqual(definitions[0], { identity: successorCaptureIdentity, relativePath: successorCaptureRelativePath }, "SUCCESSOR_CAPTURE_DEFINITION_CHANGED");
  return true;
}

assertCaptureDefinitions();

export function resolveSuccessorCapture(identity, { root = repositoryRoot } = {}) {
  assert.equal(typeof identity, "string", "CAPTURE_IDENTITY_MUST_BE_TEXT");
  assert.match(identity, /^[A-Z][A-Z0-9_]*$/u, "CAPTURE_IDENTITY_FORMAT_INVALID");
  const definition = captureDefinitions.find((entry) => entry.identity === identity);
  assert.ok(definition, "CAPTURE_IDENTITY_NOT_ALLOWLISTED");
  const resolvedRoot = path.resolve(root);
  const fixedCaptureRoot = path.resolve(resolvedRoot, ...captureRootRelativePath.split("/"));
  const destination = path.resolve(resolvedRoot, ...definition.relativePath.split("/"));
  const relative = normalize(path.relative(fixedCaptureRoot, destination));
  assert.equal(relative.startsWith("../") || relative === ".." || path.isAbsolute(relative), false, "CAPTURE_DESTINATION_OUTSIDE_FIXED_ROOT");
  assert.equal(normalize(path.relative(resolvedRoot, destination)), definition.relativePath, "CAPTURE_DESTINATION_MAPPING_CHANGED");
  return Object.freeze({ identity: definition.identity, relativePath: definition.relativePath, directory: destination, captureRoot: fixedCaptureRoot });
}

export function successorTerminalCommand(policy) {
  return `${policy.execution.command} ${successorCaptureIdentity}`;
}

function evaluateLiteral(raw) {
  assert.match(raw, /^(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)$/, "TEST_IDENTITY_MUST_BE_A_CLOSED_LITERAL");
  assert.equal(raw.includes("${"), false, "DYNAMIC_TEST_IDENTITY_REQUIRES_PINNED_EXPANSION");
  return Function(`"use strict"; return (${raw});`)();
}

function literalRegistrations(source, expression) {
  const values = [];
  const matcher = new RegExp(`${expression}\\s*\\(\\s*${literalPattern}`, "g");
  for (let match = matcher.exec(source); match; match = matcher.exec(source)) values.push({ raw: match[1], value: match[1].includes("${") ? null : evaluateLiteral(match[1]) });
  return values;
}

function candidateBasename(name) {
  return /^(?:test(?:-.+)?|.+(?:\.test|[-_]test))\.(?:cjs|mjs|js)$/.test(name);
}

async function walk(directory, output) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute, output);
    else if (candidateBasename(entry.name)) output.push(normalize(path.relative(repositoryRoot, absolute)));
  }
}

export async function discoverFormerSourcePaths() {
  const output = [];
  await walk(repositoryRoot, output);
  return output.sort();
}

export async function readPolicy() {
  return JSON.parse(await readFile(policyPath, "utf8"));
}

export function assertPolicySeal(policy) {
  assert.equal(policy.policyHash, sha256Json(Object.fromEntries(Object.entries(policy).filter(([key]) => key !== "policyHash"))), "TERMINAL_SUITE_POLICY_HASH_MISMATCH");
  assert.equal(policy.policyType, "VERSION_1_12_35_PROSPECTIVE_PHASE_OWNED_TERMINAL_NODE_SUITE");
  assert.equal(policy.policyState, "SEALED_PROSPECTIVE_RELEASE_SUITE_POLICY");
  assert.equal(policy.formerSweep.permanentlyFailed, true);
  assert.equal(policy.formerSweep.acceptedAdjudication, "PREEXISTING_EXPECTED_NEGATIVE_AUTHORITY_ABSENT");
  assert.equal(policy.phaseOwnership.terminalReleaseSuite.selectionOperation, "N_MINUS_EXACT_X");
  assert.equal(policy.phaseOwnership.terminalReleaseSuite.excludedEntryCount, 1);
  assert.equal(policy.phaseOwnership.terminalReleaseSuite.additionalExclusionsPermitted, false);
  return true;
}

export async function inspectSourceInputs(policy, { sourcePaths, sourceBytes } = {}) {
  assertPolicySeal(policy);
  const paths = sourcePaths || await discoverFormerSourcePaths();
  assert.equal(paths.length, policy.sourceInputs.count, "FORMER_SWEEP_SOURCE_COUNT_CHANGED");
  assert.equal(sha256Json(paths), policy.sourceInputs.pathSetHash, "FORMER_SWEEP_SOURCE_PATH_SET_CHANGED");
  const bytesByPath = sourceBytes || new Map(await Promise.all(paths.map(async (sourcePath) => [sourcePath, await readFile(path.join(repositoryRoot, sourcePath))])));
  const identities = paths.map((sourcePath) => ({ sourcePath, sha256: sha256Bytes(bytesByPath.get(sourcePath)) }));
  assert.equal(sha256Json(identities), policy.sourceInputs.worktreeIdentityAggregateHash, "FORMER_SWEEP_SOURCE_IDENTITY_CHANGED");
  const target = policy.sets.X;
  assert.equal(sha256Bytes(bytesByPath.get(target.entry.sourcePath)), target.sourceIdentity.worktreeSha256, "PINNED_FIXTURE_WORKTREE_IDENTITY_CHANGED");
  return { paths, bytesByPath, identities };
}

export function discoverEntriesFromPinnedSources(policy, bytesByPath) {
  const entries = [];
  let staticCallsites = 0;
  let staticSkipCallsites = 0;
  for (const sourcePath of [...bytesByPath.keys()].sort()) {
    const source = bytesByPath.get(sourcePath).toString("utf8");
    for (const registration of literalRegistrations(source, String.raw`(?<![\w.])test`)) {
      staticCallsites += 1;
      if (registration.value === null) {
        const owner = policy.discovery.dynamicTopLevelRegistrations.filter((item) => item.sourcePath === sourcePath && `\`${item.template}\`` === registration.raw);
        assert.equal(owner.length, 1, `UNKNOWN_DYNAMIC_TEST_REGISTRATION:${sourcePath}:${registration.raw}`);
        continue;
      }
      entries.push({ sourcePath, testIdentity: registration.value });
    }
    for (const registration of literalRegistrations(source, String.raw`(?<![\w.])test\.skip`)) {
      staticSkipCallsites += 1;
      entries.push({ sourcePath, testIdentity: registration.value });
    }
  }
  assert.equal(staticCallsites, policy.discovery.staticNodeTestCallsites, "STATIC_NODE_TEST_CALLSITE_COUNT_CHANGED");
  assert.equal(staticSkipCallsites, policy.discovery.staticNodeTestSkipCallsites, "STATIC_NODE_TEST_SKIP_CALLSITE_COUNT_CHANGED");

  const alias = policy.discovery.pinnedAlias;
  const aliasSource = bytesByPath.get(alias.sourcePath).toString("utf8");
  const aliasRegistrations = literalRegistrations(aliasSource, alias.identifier);
  assert.equal(aliasRegistrations.length, alias.entryCount, "PINNED_ALIAS_REGISTRATION_COUNT_CHANGED");
  for (const registration of aliasRegistrations) entries.push({ sourcePath: alias.sourcePath, testIdentity: registration.value });

  for (const registration of policy.discovery.dynamicTopLevelRegistrations) {
    assert.equal(registration.testIdentities.length, 4, `DYNAMIC_REGISTRATION_EXPANSION_CHANGED:${registration.sourcePath}`);
    for (const testIdentity of registration.testIdentities) entries.push({ sourcePath: registration.sourcePath, testIdentity });
  }

  const nested = policy.discovery.nestedRegistration;
  const nestedSource = bytesByPath.get(nested.sourcePath).toString("utf8");
  assert.equal((nestedSource.match(/\bt\.test\s*\(/g) || []).length, nested.callsiteCount, "PINNED_NESTED_REGISTRATION_CALLSITE_COUNT_CHANGED");
  for (const child of nested.childIdentities) entries.push({ sourcePath: nested.sourcePath, testIdentity: `${nested.parentIdentity} > ${child}` });
  for (const registration of policy.discovery.fileProcessRegistrations) entries.push({ sourcePath: registration.sourcePath, testIdentity: registration.testIdentity });
  return entries.sort(compareEntries);
}

export function classifyEntries(policy, discoveredEntries) {
  assertPolicySeal(policy);
  const entries = [...discoveredEntries].sort(compareEntries);
  const duplicates = entries.filter((entry, index) => index > 0 && sameEntry(entry, entries[index - 1]));
  assert.deepEqual(duplicates, [], "DUPLICATED_TEST_ENTRY");
  assert.equal(entries.length, policy.sets.N.count, "DISCOVERED_TEST_ENTRY_COUNT_CHANGED");
  assert.equal(sha256Json(entries), policy.sets.N.hash, "DISCOVERED_TEST_ENTRY_SET_CHANGED");
  assert.equal(policy.sets.X.count, 1);
  assert.equal(sha256Json([policy.sets.X.entry]), policy.sets.X.hash, "PINNED_EXCLUSION_IDENTITY_CHANGED");
  const matches = entries.filter((entry) => sameEntry(entry, policy.sets.X.entry));
  assert.equal(matches.length, 1, "PINNED_EXCLUSION_MISSING_OR_DUPLICATED");
  const selectedEntries = entries.filter((entry) => !sameEntry(entry, policy.sets.X.entry));
  const excludedEntries = matches;
  assert.equal(excludedEntries.length, 1, "ADDITIONAL_EXCLUSION_FORBIDDEN");
  assert.equal(selectedEntries.length, policy.sets.R.count, "TERMINAL_SELECTION_COUNT_CHANGED");
  assert.equal(sha256Json(selectedEntries), policy.sets.R.hash, "TERMINAL_SELECTION_SET_CHANGED");
  assert.equal(selectedEntries.filter((entry) => entry.sourcePath === policy.sets.X.entry.sourcePath).length, policy.sets.X.sourceIdentity.remainingTerminalEntryCount, "APPLICABLE_FIXTURE_SOURCE_TEST_LOST");
  return { discoveredEntries: entries, selectedEntries, excludedEntries };
}

export async function buildTerminalPlan({ policy = null, sourcePaths, sourceBytes } = {}) {
  const resolvedPolicy = policy || await readPolicy();
  const inputs = await inspectSourceInputs(resolvedPolicy, { sourcePaths, sourceBytes });
  const discoveredEntries = discoverEntriesFromPinnedSources(resolvedPolicy, inputs.bytesByPath);
  return { policy: resolvedPolicy, sourcePaths: inputs.paths, sourceBytes: inputs.bytesByPath, ...classifyEntries(resolvedPolicy, discoveredEntries) };
}

function findCallEnd(source, start) {
  const opening = source.indexOf("(", start);
  assert.ok(opening > start, "PINNED_FIXTURE_CALL_OPENING_NOT_FOUND");
  let depth = 0;
  let state = "code";
  for (let index = opening; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (state === "line") { if (character === "\n") state = "code"; continue; }
    if (state === "block") { if (character === "*" && next === "/") { state = "code"; index += 1; } continue; }
    if (state === "single" || state === "double" || state === "template") {
      if (character === "\\") { index += 1; continue; }
      if ((state === "single" && character === "'") || (state === "double" && character === '"') || (state === "template" && character === "`")) state = "code";
      continue;
    }
    if (character === "/" && next === "/") { state = "line"; index += 1; continue; }
    if (character === "/" && next === "*") { state = "block"; index += 1; continue; }
    if (character === "'") { state = "single"; continue; }
    if (character === '"') { state = "double"; continue; }
    if (character === "`") { state = "template"; continue; }
    if (character === "(") depth += 1;
    if (character === ")") {
      depth -= 1;
      if (depth === 0) {
        let end = index + 1;
        if (source[end] === ";") end += 1;
        if (source.slice(end, end + 2) === "\r\n") end += 2;
        else if (source[end] === "\n") end += 1;
        return end;
      }
    }
  }
  throw new Error("PINNED_FIXTURE_CALL_END_NOT_FOUND");
}

export function buildDerivedFixtureSource(policy, sourceBytes) {
  assertPolicySeal(policy);
  assert.equal(sha256Bytes(sourceBytes), policy.sets.X.sourceIdentity.worktreeSha256, "PINNED_FIXTURE_WORKTREE_IDENTITY_CHANGED");
  const source = sourceBytes.toString("utf8");
  const marker = `test(${JSON.stringify(policy.sets.X.entry.testIdentity)}`;
  const start = source.indexOf(marker);
  assert.ok(start >= 0, "PINNED_FIXTURE_CALL_NOT_FOUND");
  assert.equal(source.indexOf(marker, start + marker.length), -1, "PINNED_FIXTURE_CALL_DUPLICATED");
  const end = findCallEnd(source, start);
  const derived = `${source.slice(0, start)}${source.slice(end)}`;
  assert.equal(derived.includes(policy.sets.X.entry.testIdentity), false, "PINNED_FIXTURE_REMAINS_IN_DERIVED_SOURCE");
  return Buffer.from(derived, "utf8");
}

const reporterFields = new Map([
  ["tests", "tests"],
  ["pass", "passed"],
  ["fail", "failed"],
  ["cancelled", "cancelled"],
  ["skipped", "skipped"],
  ["todo", "todo"]
]);

export function parseNodeSpecSummary(output) {
  assert.equal(typeof output, "string", "NODE_TEST_OUTPUT_MUST_BE_TEXT");
  assert.equal(output.endsWith("\n"), true, "NODE_TEST_SUMMARY_OUTPUT_TRUNCATED");
  const captured = new Map([...reporterFields.keys()].map((field) => [field, []]));
  for (const line of output.split(/\r?\n/u)) {
    const match = line.match(/^ℹ\s+(tests|pass|fail|cancelled|skipped|todo)(?:\s+(.*))?$/u);
    if (match) captured.get(match[1]).push(match[2] ?? "");
  }
  const summary = {};
  for (const [reporterField, resultField] of reporterFields) {
    const values = captured.get(reporterField);
    assert.notEqual(values.length, 0, `NODE_TEST_SUMMARY_FIELD_MISSING:${reporterField}`);
    assert.equal(values.length, 1, `NODE_TEST_SUMMARY_FIELD_DUPLICATED:${reporterField}`);
    assert.match(values[0], /^(?:0|[1-9]\d*)$/u, `NODE_TEST_SUMMARY_FIELD_NONNUMERIC:${reporterField}`);
    const value = Number(values[0]);
    assert.equal(Number.isSafeInteger(value), true, `NODE_TEST_SUMMARY_FIELD_OUT_OF_RANGE:${reporterField}`);
    summary[resultField] = value;
  }
  return summary;
}

function reporterDisplayName(testIdentity) {
  const separator = testIdentity.lastIndexOf(" > ");
  return normalize(separator < 0 ? testIdentity : testIdentity.slice(separator + 3));
}

export function parseReportedEntries(plan, output) {
  const byDisplayName = new Map();
  for (const entry of plan.selectedEntries) {
    const displayName = reporterDisplayName(entry.testIdentity);
    assert.equal(byDisplayName.has(displayName), false, `DUPLICATE_REPORTER_DISPLAY_IDENTITY:${displayName}`);
    byDisplayName.set(displayName, entry);
  }
  const outcomesByDisplayName = new Map([...byDisplayName.keys()].map((name) => [name, []]));
  const unexpected = [];
  for (const line of output.split(/\r?\n/u)) {
    const match = line.match(/^\s*([✔✖﹣]) (.+?) \((?:0|[1-9]\d*)(?:\.\d+)?ms\)(?: # SKIP)?$/u);
    if (!match) continue;
    const displayName = normalize(match[2]);
    const outcome = match[1] === "✔" ? "PASSED" : match[1] === "﹣" ? "SKIPPED" : "FAILED";
    if (!byDisplayName.has(displayName)) unexpected.push({ displayName, outcome });
    else outcomesByDisplayName.get(displayName).push(outcome);
  }
  assert.deepEqual(unexpected, [], "NODE_TEST_REPORTER_UNEXPECTED_ENTRY");
  const reportedEntries = plan.selectedEntries.map((entry) => {
    const outcomes = outcomesByDisplayName.get(reporterDisplayName(entry.testIdentity));
    assert.notEqual(outcomes.length, 0, `NODE_TEST_REPORTER_ENTRY_MISSING:${entry.sourcePath}:${entry.testIdentity}`);
    assert.equal(outcomes.length, 1, `NODE_TEST_REPORTER_ENTRY_DUPLICATED:${entry.sourcePath}:${entry.testIdentity}`);
    return { ...entry, outcome: outcomes[0] };
  });
  return reportedEntries;
}

export function terminalNodeInvocation(plan) {
  const targetPath = plan.policy.sets.X.entry.sourcePath;
  const derivedPath = path.join(repositoryRoot, "tests", temporaryDerivedName);
  const executionSources = plan.sourcePaths.map((sourcePath) => sourcePath === targetPath ? normalize(path.relative(repositoryRoot, derivedPath)) : sourcePath);
  return { derivedPath, executionSources, nodeInvocation: [process.execPath, "--test", ...executionSources] };
}

export function validateTerminalCapture({ plan, command, nodeInvocation, exitCode, stdout, stderr, successorIdentity = null }) {
  assertPolicySeal(plan.policy);
  const expectedCommand = successorIdentity === null ? plan.policy.execution.command : successorTerminalCommand(plan.policy);
  if (successorIdentity !== null) assert.equal(successorIdentity, successorCaptureIdentity, "CAPTURE_IDENTITY_NOT_ALLOWLISTED");
  assert.equal(command, expectedCommand, "TERMINAL_SUITE_COMMAND_CHANGED");
  assert.deepEqual(nodeInvocation, terminalNodeInvocation(plan).nodeInvocation, "TERMINAL_SUITE_CHILD_COMMAND_CHANGED");
  assert.equal(exitCode, 0, "TERMINAL_SUITE_CHILD_EXIT_NONZERO");
  assert.equal(sha256Json(plan.discoveredEntries), plan.policy.sets.N.hash, "TERMINAL_CAPTURE_N_HASH_CHANGED");
  assert.equal(sha256Json(plan.excludedEntries), plan.policy.sets.X.hash, "TERMINAL_CAPTURE_X_HASH_CHANGED");
  assert.equal(sha256Json(plan.selectedEntries), plan.policy.sets.R.hash, "TERMINAL_CAPTURE_R_HASH_CHANGED");
  assert.equal(plan.discoveredEntries.length, plan.policy.sets.N.count, "TERMINAL_CAPTURE_N_COUNT_CHANGED");
  assert.equal(plan.excludedEntries.length, plan.policy.sets.X.count, "TERMINAL_CAPTURE_X_COUNT_CHANGED");
  assert.equal(plan.selectedEntries.length, plan.policy.sets.R.count, "TERMINAL_CAPTURE_R_COUNT_CHANGED");
  assert.equal(plan.selectedEntries.some((entry) => sameEntry(entry, plan.policy.sets.X.entry)), false, "PHASE_EXCLUDED_FIXTURE_REMAINS_SELECTED");
  assert.equal(plan.selectedEntries.filter((entry) => entry.sourcePath === plan.policy.sets.X.entry.sourcePath).length, plan.policy.sets.X.sourceIdentity.remainingTerminalEntryCount, "APPLICABLE_FIXTURE_SOURCE_TEST_LOST");
  const combined = `${stdout}\n${stderr}`;
  assert.equal(combined.includes(plan.policy.sets.X.entry.testIdentity), false, "PHASE_EXCLUDED_FIXTURE_WAS_REPORTED_BY_TERMINAL_RUN");
  const summary = parseNodeSpecSummary(stdout);
  assert.equal(summary.tests, summary.passed + summary.failed + summary.cancelled + summary.skipped + summary.todo, "NODE_TEST_SUMMARY_TOTAL_RECONCILIATION_FAILED");
  assert.equal(summary.tests, plan.selectedEntries.length, "TERMINAL_SUITE_SELECTED_TEST_TOTAL_CHANGED");
  assert.deepEqual(summary, plan.policy.execution.expected, "TERMINAL_SUITE_RESULT_CHANGED");
  assert.equal(summary.failed, 0, "TERMINAL_SUITE_FAILURES_PRESENT");
  const reportedEntries = successorIdentity === null ? null : parseReportedEntries(plan, stdout);
  if (reportedEntries !== null) {
    assert.equal(reportedEntries.length, plan.policy.sets.R.count, "NODE_TEST_REPORTED_ENTRY_COUNT_CHANGED");
    assert.equal(reportedEntries.filter((entry) => entry.outcome === "PASSED").length, summary.passed, "NODE_TEST_REPORTED_PASS_COUNT_CHANGED");
    assert.equal(reportedEntries.filter((entry) => entry.outcome === "FAILED").length, summary.failed, "NODE_TEST_REPORTED_FAIL_COUNT_CHANGED");
    assert.equal(reportedEntries.filter((entry) => entry.outcome === "SKIPPED").length, summary.skipped, "NODE_TEST_REPORTED_SKIP_COUNT_CHANGED");
    const formerlyBlocked = new Set([
      "B-C: two fresh current-process runtimes verify identically and cleanup through Git",
      "D-H: wrong linkage, release drift, dirtiness, and tracked-file changes fail closed"
    ]);
    assert.equal(reportedEntries.filter((entry) => entry.sourcePath === "tests/blind-object-v2-detached-runtime.test.mjs" && formerlyBlocked.has(entry.testIdentity) && entry.outcome === "PASSED").length, 2, "DETACHED_RUNTIME_TESTS_DID_NOT_COMPLETE_AND_PASS");
  }
  return { summary, reportedEntries };
}

async function assertExclusiveCaptureDestination(capture) {
  if (capture.identity !== null) {
    assert.equal(capture.identity, successorCaptureIdentity, "CAPTURE_IDENTITY_NOT_ALLOWLISTED");
    assert.equal(capture.relativePath, successorCaptureRelativePath, "CAPTURE_DESTINATION_MAPPING_CHANGED");
    assert.equal(capture.directory, path.join(capture.captureRoot, path.basename(successorCaptureRelativePath)), "CAPTURE_DESTINATION_OUTSIDE_FIXED_ROOT");
  }
  const captureRootStat = await lstat(capture.captureRoot);
  assert.equal(captureRootStat.isDirectory(), true, "CAPTURE_ROOT_MUST_BE_A_DIRECTORY");
  assert.equal(captureRootStat.isSymbolicLink(), false, "CAPTURE_ROOT_SYMLINK_FORBIDDEN");
  assert.equal(await realpath(capture.captureRoot), capture.captureRoot, "CAPTURE_ROOT_REALPATH_CHANGED");
  try {
    const destinationStat = await lstat(capture.directory);
    assert.equal(destinationStat.isSymbolicLink(), false, "CAPTURE_DESTINATION_SYMLINK_FORBIDDEN");
    throw new assert.AssertionError({ message: "CAPTURE_DESTINATION_PREEXISTS" });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

export async function createSuccessorCaptureDirectory(identity, { root = repositoryRoot } = {}) {
  const capture = resolveSuccessorCapture(identity, { root });
  await assertExclusiveCaptureDestination(capture);
  await mkdir(capture.directory);
  return capture;
}

export async function captureChildResult({ capture, command, nodeInvocation, exitCode, signal, stdout, stderr }) {
  await assertExclusiveCaptureDestination(capture);
  await mkdir(capture.directory);
  const childRecord = canonicalize({ command, executable: nodeInvocation[0], arguments: nodeInvocation.slice(1), cwd: repositoryRoot, exitCode, signal: signal ?? null });
  const childRecordBytes = Buffer.from(`${stableJson(childRecord)}\n`, "utf8");
  const paths = {
    childCommand: path.join(capture.directory, "child-command.json"),
    stdout: path.join(capture.directory, "stdout.txt"),
    stderr: path.join(capture.directory, "stderr.txt"),
    result: path.join(capture.directory, "accepted-result.json")
  };
  await writeFile(paths.childCommand, childRecordBytes, { flag: "wx" });
  await writeFile(paths.stdout, stdout, { flag: "wx" });
  await writeFile(paths.stderr, stderr, { flag: "wx" });
  return {
    childRecord,
    paths,
    hashes: {
      childCommandSha256: sha256Bytes(childRecordBytes),
      stdoutSha256: sha256Bytes(stdout),
      stderrSha256: sha256Bytes(stderr)
    }
  };
}

export async function writeAcceptedCaptureResult(capture, result) {
  assert.equal(capture.identity, successorCaptureIdentity, "CAPTURE_IDENTITY_NOT_ALLOWLISTED");
  assert.equal(capture.relativePath, successorCaptureRelativePath, "CAPTURE_DESTINATION_MAPPING_CHANGED");
  assert.equal(capture.directory, path.join(capture.captureRoot, path.basename(successorCaptureRelativePath)), "CAPTURE_DESTINATION_OUTSIDE_FIXED_ROOT");
  const resultPath = path.join(capture.directory, "accepted-result.json");
  const resultBytes = Buffer.from(`${stableJson(result)}\n`, "utf8");
  await writeFile(resultPath, resultBytes, { flag: "wx" });
  return { path: resultPath, byteLength: resultBytes.length, sha256: sha256Bytes(resultBytes) };
}

export async function runTerminalSuite({ successorIdentity = null } = {}) {
  const plan = await buildTerminalPlan();
  process.stdout.write(`${stableJson({ phase: "TERMINAL_SUITE_PLAN_PUBLISHED", N: plan.discoveredEntries, X: plan.excludedEntries, R: plan.selectedEntries, NHash: plan.policy.sets.N.hash, XHash: plan.policy.sets.X.hash, RHash: plan.policy.sets.R.hash })}\n`);
  const capture = successorIdentity === null
    ? Object.freeze({ identity: null, relativePath: normalize(path.relative(repositoryRoot, captureDirectory)), directory: captureDirectory, captureRoot: path.dirname(captureDirectory) })
    : resolveSuccessorCapture(successorIdentity);
  const command = successorIdentity === null ? plan.policy.execution.command : successorTerminalCommand(plan.policy);
  const targetPath = plan.policy.sets.X.entry.sourcePath;
  const { derivedPath, executionSources, nodeInvocation } = terminalNodeInvocation(plan);
  const derivedBytes = buildDerivedFixtureSource(plan.policy, plan.sourceBytes.get(targetPath));
  try {
    await writeFile(derivedPath, derivedBytes, { flag: "wx" });
    let child;
    try {
      const completed = await execFileAsync(nodeInvocation[0], nodeInvocation.slice(1), { cwd: repositoryRoot, encoding: null, maxBuffer: 64 * 1024 * 1024, windowsHide: true });
      child = { exitCode: 0, signal: null, stdout: completed.stdout, stderr: completed.stderr };
    } catch (error) {
      child = {
        exitCode: Number.isInteger(error.code) ? error.code : null,
        signal: error.signal ?? null,
        stdout: Buffer.isBuffer(error.stdout) ? error.stdout : Buffer.from(error.stdout || "", "utf8"),
        stderr: Buffer.isBuffer(error.stderr) ? error.stderr : Buffer.from(error.stderr || "", "utf8")
      };
    }
    const captured = await captureChildResult({ capture, command, nodeInvocation, ...child });
    const stdout = child.stdout.toString("utf8");
    const stderr = child.stderr.toString("utf8");
    const { summary, reportedEntries } = validateTerminalCapture({ plan, command, nodeInvocation, exitCode: child.exitCode, stdout, stderr, successorIdentity });
    const result = canonicalize({
      command,
      captureIdentity: capture.identity ?? "LEGACY_UNIDENTIFIED_CAPTURE",
      captureDirectory: capture.relativePath,
      nodeInvocation,
      childExitCode: child.exitCode,
      discoveredEntries: plan.discoveredEntries.length,
      selectedTerminalEntries: plan.selectedEntries.length,
      phaseExcludedEntries: plan.excludedEntries,
      reportedTests: summary.tests,
      executedNonSkippedTests: summary.tests - summary.skipped,
      ...summary,
      unexplainedOmissions: 0,
      additionalExclusions: 0,
      originalFixtureSourceExecuted: false,
      temporaryDerivedSourceRemoved: true,
      reportedEntries: reportedEntries ?? "NOT_CAPTURED_BY_LEGACY_ROUTE",
      captureArtifacts: {
        childCommand: normalize(path.relative(repositoryRoot, captured.paths.childCommand)),
        stdout: normalize(path.relative(repositoryRoot, captured.paths.stdout)),
        stderr: normalize(path.relative(repositoryRoot, captured.paths.stderr))
      },
      ...captured.hashes
    });
    if (successorIdentity === null) {
      const resultBytes = Buffer.from(`${stableJson(result)}\n`, "utf8");
      await writeFile(captured.paths.result, resultBytes, { flag: "wx" });
    } else {
      await writeAcceptedCaptureResult(capture, result);
    }
    process.stdout.write(`${stableJson({ phase: "TERMINAL_SUITE_COMPLETE", result })}\n`);
    return result;
  } finally {
    await rm(derivedPath, { force: true });
  }
}

async function main(argv) {
  const command = argv[0];
  if (command === "PLAN") {
    const plan = await buildTerminalPlan();
    process.stdout.write(`${stableJson({ command, N: plan.discoveredEntries, X: plan.excludedEntries, R: plan.selectedEntries, NHash: plan.policy.sets.N.hash, XHash: plan.policy.sets.X.hash, RHash: plan.policy.sets.R.hash })}\n`);
    return;
  }
  if (command === "RUN" && argv.length === 1) { await runTerminalSuite(); return; }
  if (command === "RUN" && argv.length === 2) {
    resolveSuccessorCapture(argv[1]);
    await runTerminalSuite({ successorIdentity: argv[1] });
    return;
  }
  throw new Error("command must be PLAN or RUN");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) await main(process.argv.slice(2));
