import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { canonicalize, sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
export const repositoryRoot = path.resolve(path.dirname(scriptPath), "..", "..", "..", "..");
export const policyPath = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-cognitive-remediation", "version-1.12.35-phase-owned-terminal-suite-policy.json");
const temporaryDerivedName = ".version-1.12.35-terminal-suite-derived.mjs";
const ignoredDirectories = new Set([".git", "node_modules"]);

const normalize = (value) => value.replaceAll("\\", "/");
const compareEntries = (left, right) => left.sourcePath < right.sourcePath ? -1 : left.sourcePath > right.sourcePath ? 1 : left.testIdentity < right.testIdentity ? -1 : left.testIdentity > right.testIdentity ? 1 : 0;
const sameEntry = (left, right) => left.sourcePath === right.sourcePath && left.testIdentity === right.testIdentity;
const literalPattern = String.raw`((?:"(?:[^"\\]|\\.)*")|(?:'(?:[^'\\]|\\.)*')|(?:\`(?:[^\`\\]|\\.)*\`))`;

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

function parseSummary(output) {
  const number = (label) => {
    const match = output.match(new RegExp(`^# ${label} (\\d+)$`, "m"));
    assert.ok(match, `NODE_TEST_SUMMARY_FIELD_MISSING:${label}`);
    return Number(match[1]);
  };
  return { tests: number("tests"), passed: number("pass"), failed: number("fail"), cancelled: number("cancelled"), skipped: number("skipped"), todo: number("todo") };
}

export async function runTerminalSuite() {
  const plan = await buildTerminalPlan();
  process.stdout.write(`${stableJson({ phase: "TERMINAL_SUITE_PLAN_PUBLISHED", N: plan.discoveredEntries, X: plan.excludedEntries, R: plan.selectedEntries, NHash: plan.policy.sets.N.hash, XHash: plan.policy.sets.X.hash, RHash: plan.policy.sets.R.hash })}\n`);
  const targetPath = plan.policy.sets.X.entry.sourcePath;
  const derivedPath = path.join(repositoryRoot, "tests", temporaryDerivedName);
  const derivedBytes = buildDerivedFixtureSource(plan.policy, plan.sourceBytes.get(targetPath));
  const executionSources = plan.sourcePaths.map((sourcePath) => sourcePath === targetPath ? normalize(path.relative(repositoryRoot, derivedPath)) : sourcePath);
  try {
    await writeFile(derivedPath, derivedBytes, { flag: "wx" });
    const { stdout, stderr } = await execFileAsync(process.execPath, ["--test", ...executionSources], { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, windowsHide: true });
    const combined = `${stdout}\n${stderr}`;
    assert.equal(combined.includes(plan.policy.sets.X.entry.testIdentity), false, "PHASE_EXCLUDED_FIXTURE_WAS_REPORTED_BY_TERMINAL_RUN");
    const summary = parseSummary(stdout);
    assert.deepEqual(summary, plan.policy.execution.expected, "TERMINAL_SUITE_RESULT_CHANGED");
    const result = canonicalize({
      command: plan.policy.execution.command,
      nodeInvocation: [process.execPath, "--test", ...executionSources],
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
      stdoutSha256: sha256Bytes(Buffer.from(stdout, "utf8")),
      stderrSha256: sha256Bytes(Buffer.from(stderr, "utf8"))
    });
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
  if (command === "RUN") { await runTerminalSuite(); return; }
  throw new Error("command must be PLAN or RUN");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) await main(process.argv.slice(2));
