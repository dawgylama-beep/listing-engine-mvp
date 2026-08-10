import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { assertQualifiedReleaseState } from "../benchmarks/blind-object-v2/scripts/release-qualification.mjs";
import { validateRealRouteReleaseRecord } from "../benchmarks/blind-object-v2/scripts/real-route-release-qualification.mjs";
import { verifyReadiness } from "../qualification/synthetic-executive/scripts/verify-readiness.mjs";

const run = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const qualificationRoot = path.join(repositoryRoot, "qualification", "synthetic-executive");
const readJson = async (...parts) => JSON.parse(await readFile(path.join(qualificationRoot, ...parts), "utf8"));

test("readiness manifest independently verifies all public artifacts, immutable product, and freeze", async () => {
  const result = await verifyReadiness();
  assert.equal(result.status, "KATHERINE_SYNTHETIC_EXECUTIVE_QUALIFICATION_READY");
  assert.equal(result.episodeCount, 12);
  assert.equal(result.productTrackedEntryCount, 666);
  assert.equal(result.productRuntimeManifestHash, "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8");
  assert.equal(result.frozenAggregateHash, "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699");
});

test("canonical role registry separates deterministic lifecycle integrity from the unqualified agent", async () => {
  const [registry, architecture] = await Promise.all([readJson("canonical-role-registry.json"), readJson("synthetic-executive-architecture.json")]);
  const controller = registry.roles.find((role) => role.componentId === "KE-LIC-001");
  assert.equal(controller.canonicalComponentName, "Lifecycle Integrity Controller");
  assert.deepEqual(controller.historicalAliases, ["Cognitive Lifecycle Governor"]);
  assert.equal(architecture.components.length, 12);
  assert.equal(architecture.qualificationState, "UNQUALIFIED");
  const agent = architecture.components.find((component) => component.componentId === "KE-SEA-001");
  for (const denied of ["repository edits", "shell commands", "production credentials", "product handler calls", "evaluator controls", "merge", "deployment"]) assert.ok(agent.prohibitedCapabilities.includes(denied));
});

test("public episode split exposes twelve bounded roots and no evaluator labels", async () => {
  const manifest = await readJson("episodes", "public-manifest.json");
  assert.deepEqual(manifest.episodes.map((episode) => episode.episodeId), ["KE-P7-H01", "KE-P7-H02", "KE-P7-H03", "KE-P7-H04", "KE-P7-H05", "KE-P7-H06", "KE-P7-A01", "KE-P7-A02", "KE-P7-A03", "KE-P7-N01", "KE-P7-N02", "KE-P7-N03"]);
  const text = JSON.stringify(manifest);
  for (const forbidden of ["expectedDiagnosis", "correctRepair", "expectedLesson", "nextPrompt", "expectedClassification", "expectedMemoryMatch"]) assert.equal(text.includes(forbidden), false);
  assert.equal(manifest.episodes.every((episode) => episode.authorizedTools.length === 4), true);
});

test("cost, denial, and fake-agent proofs are sealed and contain no real activity", async () => {
  const [cost, denial, harness] = await Promise.all([readJson("proofs", "cost-governor-proof.json"), readJson("proofs", "evaluator-control-access-denial-proof.json"), readJson("proofs", "deterministic-harness-proof.json")]);
  assert.equal(cost.results.length, 18); assert.equal(cost.results.every((item) => item.passed), true);
  assert.equal(cost.realModelCalls, 0); assert.equal(cost.networkAttempts, 0);
  assert.equal(denial.successfulAccessCount, 0); assert.equal(denial.deniedAttemptCount, 36);
  assert.equal(harness.caseCount, 12); assert.equal(harness.fakeAgentKinds.length, 9);
  assert.equal(harness.fixtureAgentDemonstratesSyntheticExecutiveCapability, false);
  assert.equal(harness.realModelCalls, 0); assert.equal(harness.providerCalls, 0);
});

test("calibration-only release validates while every benchmark command remains prohibited", async () => {
  const release = JSON.parse(await readFile(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "execution-release.json"), "utf8"));
  assert.equal(validateRealRouteReleaseRecord(release).valid, true);
  assert.equal(release.releasePurpose, "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_ONLY");
  assert.equal(release.realRouteCalibrationPerformed, false); assert.equal(release.syntheticExecutiveQualified, false);
  for (const mode of ["QUALIFY_OFFLINE", "PREFLIGHT", "CREATE_CONSENT", "EXECUTE", "READBACK"]) assert.throws(() => assertQualifiedReleaseState(release, mode), /prohibited/);
});

test("future top-level command requires separate sealed authority before proxy configuration", async () => {
  const script = path.join(qualificationRoot, "scripts", "run-qualification.mjs");
  await assert.rejects(run(process.execPath, [script, "RUN_FUTURE_AI"], { cwd: repositoryRoot, env: {} }), (error) => {
    assert.match(error.stderr, /requires --authorization/);
    assert.doesNotMatch(error.stderr, /fetch|network|provider/i);
    return true;
  });
});
