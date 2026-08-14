import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { seal, sha256Bytes, sha256Json } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import {
  buildDerivedFixtureSource,
  buildTerminalPlan,
  classifyEntries,
  discoverEntriesFromPinnedSources,
  inspectSourceInputs,
  parseNodeSpecSummary,
  readPolicy,
  repositoryRoot,
  terminalNodeInvocation,
  validateTerminalCapture
} from "../qualification/synthetic-executive/v3-cognitive-remediation/scripts/version-1.12.35-terminal-suite.mjs";

const reseal = (policy, mutate) => {
  const core = structuredClone(policy);
  delete core.policyHash;
  mutate(core);
  return seal(core, "policyHash");
};

const load = async () => {
  const policy = await readPolicy();
  const inputs = await inspectSourceInputs(policy);
  const discoveredEntries = discoverEntriesFromPinnedSources(policy, inputs.bytesByPath);
  return { policy, inputs, discoveredEntries };
};

const successfulReporterOutput = ({ tests = 542, passed = 526, failed = 0, cancelled = 0, skipped = 16, todo = 0, finalNewline = true } = {}) => [
  `ℹ tests ${tests}`,
  "ℹ suites 0",
  `ℹ pass ${passed}`,
  `ℹ fail ${failed}`,
  `ℹ cancelled ${cancelled}`,
  `ℹ skipped ${skipped}`,
  `ℹ todo ${todo}`,
  "ℹ duration_ms 1"
].join("\n") + (finalNewline ? "\n" : "");

const validCapture = async () => {
  const plan = await buildTerminalPlan();
  return {
    plan,
    command: plan.policy.execution.command,
    nodeInvocation: terminalNodeInvocation(plan).nodeInvocation,
    exitCode: 0,
    stdout: successfulReporterOutput(),
    stderr: ""
  };
};

test("pre-authority N includes X while terminal-release R excludes exactly X", async () => {
  const plan = await buildTerminalPlan();
  assert.equal(plan.discoveredEntries.length, 543);
  assert.equal(plan.excludedEntries.length, 1);
  assert.deepEqual(plan.excludedEntries, [plan.policy.sets.X.entry]);
  assert.equal(plan.selectedEntries.length, 542);
  assert.equal(plan.selectedEntries.some((entry) => entry.sourcePath === plan.policy.sets.X.entry.sourcePath && entry.testIdentity === plan.policy.sets.X.entry.testIdentity), false);
  assert.equal(plan.discoveredEntries.some((entry) => entry.sourcePath === plan.policy.sets.X.entry.sourcePath && entry.testIdentity === plan.policy.sets.X.entry.testIdentity), true);
});

test("all five other tests in the frozen fixture source remain selected", async () => {
  const plan = await buildTerminalPlan();
  assert.equal(plan.discoveredEntries.filter((entry) => entry.sourcePath === plan.policy.sets.X.entry.sourcePath).length, 6);
  assert.equal(plan.selectedEntries.filter((entry) => entry.sourcePath === plan.policy.sets.X.entry.sourcePath).length, 5);
  const derived = buildDerivedFixtureSource(plan.policy, plan.sourceBytes.get(plan.policy.sets.X.entry.sourcePath));
  assert.equal(sha256Bytes(derived) === plan.policy.sets.X.sourceIdentity.worktreeSha256, false);
  assert.equal(derived.toString("utf8").includes(plan.policy.sets.X.entry.testIdentity), false);
});

test("a second exclusion or a changed pinned path or name fails closed", async () => {
  const { policy, discoveredEntries } = await load();
  const second = discoveredEntries.find((entry) => entry.testIdentity !== policy.sets.X.entry.testIdentity);
  const additional = reseal(policy, (core) => { core.phaseOwnership.terminalReleaseSuite.excludedEntryCount = 2; core.sets.X.count = 2; core.sets.X.entry = [core.sets.X.entry, second]; });
  assert.throws(() => classifyEntries(additional, discoveredEntries));
  for (const field of ["sourcePath", "testIdentity"]) {
    const changed = reseal(policy, (core) => { core.sets.X.entry[field] = `changed-${core.sets.X.entry[field]}`; });
    assert.throws(() => classifyEntries(changed, discoveredEntries));
  }
});

test("deleted, duplicated, and unknown discovered entries fail closed", async () => {
  const { policy, discoveredEntries } = await load();
  assert.throws(() => classifyEntries(policy, discoveredEntries.slice(1)));
  assert.throws(() => classifyEntries(policy, [...discoveredEntries, discoveredEntries[0]]));
  assert.throws(() => classifyEntries(policy, [...discoveredEntries.slice(1), { sourcePath: "tests/unknown.test.mjs", testIdentity: "unknown" }]));
});

test("changing the pinned fixture source identity fails before classification", async () => {
  const { policy, inputs } = await load();
  const changed = new Map(inputs.bytesByPath);
  changed.set(policy.sets.X.entry.sourcePath, Buffer.concat([changed.get(policy.sets.X.entry.sourcePath), Buffer.from("\n") ]));
  await assert.rejects(inspectSourceInputs(policy, { sourcePaths: inputs.paths, sourceBytes: changed }), /SOURCE_IDENTITY_CHANGED|FIXTURE_WORKTREE_IDENTITY_CHANGED/);
});

test("policy and runner publish deterministic N, X, and R identities", async () => {
  const first = await buildTerminalPlan();
  const second = await buildTerminalPlan();
  assert.deepEqual(first.discoveredEntries, second.discoveredEntries);
  assert.deepEqual(first.selectedEntries, second.selectedEntries);
  assert.deepEqual(first.excludedEntries, second.excludedEntries);
  assert.equal(sha256Json(first.discoveredEntries), first.policy.sets.N.hash);
  assert.equal(sha256Json(first.excludedEntries), first.policy.sets.X.hash);
  assert.equal(sha256Json(first.selectedEntries), first.policy.sets.R.hash);
});

test("the frozen fixture, runner binding, and prior terminal evidence remain byte-identical", async () => {
  const policy = await readPolicy();
  const fixture = await readFile(`${repositoryRoot}/${policy.sets.X.entry.sourcePath}`);
  assert.equal(sha256Bytes(fixture), policy.sets.X.sourceIdentity.worktreeSha256);
  const [correction, stop] = await Promise.all([
    readFile(`${repositoryRoot}/qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-successor-release-test-correction.json`),
    readFile(`${repositoryRoot}/qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-successor-release-validation-stop.json`)
  ]);
  assert.equal(sha256Bytes(correction), "ee7312511cf52035519f46ad619e55acba37a49e0ef943faed903101b8f7ad67");
  assert.equal(sha256Bytes(stop), "47aa7e6e65e4e8f30398883d5c97e68e24f5ac48258511edb7791657b4867b11");
});

test("the retained Node 24 spec reporter format produces a complete accepted summary", async () => {
  const capture = await validCapture();
  assert.deepEqual(parseNodeSpecSummary(capture.stdout), capture.plan.policy.execution.expected);
  assert.deepEqual(validateTerminalCapture(capture), capture.plan.policy.execution.expected);
});

test("a missing tests summary fails closed even when child exit is zero", async () => {
  const capture = await validCapture();
  capture.stdout = capture.stdout.replace(/^ℹ tests 542\n/mu, "");
  assert.throws(() => validateTerminalCapture(capture), /NODE_TEST_SUMMARY_FIELD_MISSING:tests/);
});

test("malformed and nonnumeric summary counts fail closed", async () => {
  for (const replacement of ["ℹ tests: 542", "ℹ tests many"]) {
    const capture = await validCapture();
    capture.stdout = capture.stdout.replace("ℹ tests 542", replacement);
    assert.throws(() => validateTerminalCapture(capture), /NODE_TEST_SUMMARY_FIELD_(?:MISSING|NONNUMERIC):tests/);
  }
});

test("duplicate and conflicting summary fields fail closed", async () => {
  for (const duplicate of ["ℹ tests 542\n", "ℹ tests 541\n"]) {
    const capture = await validCapture();
    capture.stdout += duplicate;
    assert.throws(() => validateTerminalCapture(capture), /NODE_TEST_SUMMARY_FIELD_DUPLICATED:tests/);
  }
});

test("truncated reporter output fails closed", async () => {
  const capture = await validCapture();
  capture.stdout = successfulReporterOutput({ finalNewline: false });
  assert.throws(() => validateTerminalCapture(capture), /NODE_TEST_SUMMARY_OUTPUT_TRUNCATED/);
});

test("a nonzero child exit fails before an otherwise successful summary can be accepted", async () => {
  const capture = await validCapture();
  capture.exitCode = 1;
  assert.throws(() => validateTerminalCapture(capture), /TERMINAL_SUITE_CHILD_EXIT_NONZERO/);
});

test("an unexpected X identity in either output stream fails closed", async () => {
  for (const stream of ["stdout", "stderr"]) {
    const capture = await validCapture();
    capture[stream] += `${capture.plan.policy.sets.X.entry.testIdentity}\n`;
    assert.throws(() => validateTerminalCapture(capture), /PHASE_EXCLUDED_FIXTURE_WAS_REPORTED/);
  }
});

test("a missing selected R member fails closed", async () => {
  const capture = await validCapture();
  capture.plan = { ...capture.plan, selectedEntries: capture.plan.selectedEntries.slice(1) };
  assert.throws(() => validateTerminalCapture(capture), /TERMINAL_CAPTURE_R_HASH_CHANGED/);
});

test("changed N, X, or R hashes fail closed", async () => {
  for (const setName of ["N", "X", "R"]) {
    const capture = await validCapture();
    capture.plan = structuredClone(capture.plan);
    capture.plan.policy.sets[setName].hash = "0".repeat(64);
    assert.throws(() => validateTerminalCapture(capture), /TERMINAL_SUITE_POLICY_HASH_MISMATCH/);
  }
});

test("an incorrectly reconciled total fails closed", async () => {
  const capture = await validCapture();
  capture.stdout = successfulReporterOutput({ passed: 525 });
  assert.throws(() => validateTerminalCapture(capture), /NODE_TEST_SUMMARY_TOTAL_RECONCILIATION_FAILED/);
});
