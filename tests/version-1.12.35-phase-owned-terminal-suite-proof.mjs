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
  readPolicy,
  repositoryRoot
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
