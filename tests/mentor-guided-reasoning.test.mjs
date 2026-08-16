import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MENTOR_GUIDED_REASONING_CYCLE,
  evaluateMentorGuidedReasoning
} from "../lib/cognitive-governor/index.js";

const repositoryRoot = new URL("../", import.meta.url);
const fixturePath = new URL("./fixtures/version-1.12.36-mentor-guided-remediation.json", import.meta.url);
const fixtureDocument = JSON.parse(await readFile(fixturePath, "utf8"));

function clone(value) {
  return structuredClone(value);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

test("the remediation fixture set contains the ten required preserved project-evidence classes", () => {
  assert.equal(fixtureDocument.schemaVersion, "1.0");
  assert.equal(fixtureDocument.fixtures.length, 10);
  assert.deepEqual(fixtureDocument.fixtures.map((fixture) => fixture.fixtureId), [
    "SCRATCH_WORKSPACE_IS_NOT_WINDOWS_REPOSITORY_UNAVAILABLE",
    "BOOLEAN_AND_OWN_PROPERTY_EXACTNESS",
    "CAPTURE_INVENTORY_SET_NOT_ORDERED_ARRAY",
    "TWELVE_PLAYWRIGHT_ERRORS_SHARE_ONE_BOUNDARY",
    "FROZEN_PRE_AUTHORITY_FIXTURE_NOT_LATER_RELEASE_AUTHORITY",
    "WINDOWS_LONG_PATH_WORKTREE_CONTEXT_NOT_PRODUCT_FAILURE",
    "DETERMINISTIC_SENTINELS_NOT_CREDENTIAL_EXPOSURE",
    "SYMPTOM_REPAIR_REQUIRES_FULL_DEFECT_CLASS_AUDIT",
    "CHECKPOINT_PREVENTS_AUTHORIZATION_AND_EVIDENCE_LOOPS",
    "TOOL_LIMITATION_REQUIRES_FINISH_LINE_PATH"
  ]);
});

test("every fixture is bound to the exact preserved source bytes", async () => {
  for (const fixture of fixtureDocument.fixtures) {
    const bytes = await readFile(new URL(fixture.source.relativePath.replaceAll("\\", "/"), repositoryRoot));
    assert.equal(sha256(bytes), fixture.source.sha256, fixture.fixtureId);
  }
});

test("mentor-guided reasoning produces the exact bounded classifications and finish paths", () => {
  for (const fixture of fixtureDocument.fixtures) {
    const before = JSON.stringify(fixture);
    const result = evaluateMentorGuidedReasoning(fixture);
    assert.equal(JSON.stringify(fixture), before, `${fixture.fixtureId}: source mutated`);
    assert.equal(result.valid, true, fixture.fixtureId);
    assert.deepEqual(result.cycle, MENTOR_GUIDED_REASONING_CYCLE, fixture.fixtureId);
    assert.equal(result.domain, fixture.expected.domain, fixture.fixtureId);
    assert.equal(result.causalBoundaryId, fixture.expected.causalBoundaryId, fixture.fixtureId);
    assert.deepEqual(result.rejectedConclusionIds, fixture.expected.rejectedConclusionIds, fixture.fixtureId);
    assert.equal(result.generalizedLesson, fixture.expected.generalizedLesson, fixture.fixtureId);
    assert.equal(result.safeActionId, fixture.expected.safeActionId, fixture.fixtureId);
    assert.deepEqual(result.finishPath, fixture.expected.finishPath, fixture.fixtureId);
    assert.equal(result.sideEffectCount, 0, fixture.fixtureId);
    for (const claim of [
      "qualificationClaimed",
      "learningClaimed",
      "cognitiveImprovementClaimed",
      "deploymentClaimed",
      "activationClaimed",
      "memoryImprovementClaimed"
    ]) assert.equal(result[claim], false, `${fixture.fixtureId}:${claim}`);
  }
});

test("the causal selector chooses the earliest boundary that explains all material evidence", () => {
  const fixture = clone(fixtureDocument.fixtures.find((entry) => entry.fixtureId === "TWELVE_PLAYWRIGHT_ERRORS_SHARE_ONE_BOUNDARY"));
  fixture.diagnoses.unshift({
    diagnosisId: "LATE_FULL_COVERAGE",
    boundaryOrdinal: 9,
    supportedByEvidenceIds: fixture.evidence.map((entry) => entry.evidenceId),
    explainsEvidenceIds: fixture.evidence.map((entry) => entry.evidenceId),
    generalRule: "A later boundary can also cover the evidence but is not the earliest.",
    persistAsMemory: false
  });
  assert.equal(evaluateMentorGuidedReasoning(fixture).causalBoundaryId, "SHARED_FIXTURE_CAUSAL_BOUNDARY");
});

test("completed evidence loops are skipped while independent authorized work continues", () => {
  const fixture = fixtureDocument.fixtures.find((entry) => entry.fixtureId === "CHECKPOINT_PREVENTS_AUTHORIZATION_AND_EVIDENCE_LOOPS");
  const result = evaluateMentorGuidedReasoning(fixture);
  assert.equal(result.safeActionId, "RUN_NEXT_VALIDATION");
  assert.deepEqual(result.finishPath, ["RUN_NEXT_VALIDATION", "FINALIZE_TERMINAL_EVIDENCE"]);
});

test("one blocked tool form does not erase the complete successor finish path", () => {
  const fixture = fixtureDocument.fixtures.find((entry) => entry.fixtureId === "TOOL_LIMITATION_REQUIRES_FINISH_LINE_PATH");
  const result = evaluateMentorGuidedReasoning(fixture);
  assert.equal(result.safeActionId, "SELECT_LITERAL_PATH_SUCCESSOR");
  assert.deepEqual(result.finishPath, [
    "RETRY_UNSUPPORTED_FORM",
    "SELECT_LITERAL_PATH_SUCCESSOR",
    "RUN_AND_CAPTURE_VALIDATION"
  ]);
});

test("missing, malformed, contradictory, and incomplete inputs fail closed", () => {
  const base = fixtureDocument.fixtures[0];
  const missing = clone(base);
  delete missing.mission.objective;
  assert.throws(() => evaluateMentorGuidedReasoning(missing), /MENTOR_MISSION_OBJECTIVE_REQUIRED/);

  const malformed = clone(base);
  malformed.evidence = {};
  assert.throws(() => evaluateMentorGuidedReasoning(malformed), /MENTOR_EVIDENCE_REQUIRED/);

  const contradictory = clone(base);
  contradictory.evidence[1].domain = "PRODUCT_BEHAVIOR";
  assert.throws(() => evaluateMentorGuidedReasoning(contradictory), /MENTOR_DOMAIN_CONTRADICTION/);

  const incompleteDiagnosis = clone(base);
  incompleteDiagnosis.diagnoses = incompleteDiagnosis.diagnoses.map((diagnosis) => ({
    ...diagnosis,
    explainsEvidenceIds: [incompleteDiagnosis.evidence[0].evidenceId]
  }));
  assert.throws(() => evaluateMentorGuidedReasoning(incompleteDiagnosis), /MENTOR_COMMON_CAUSAL_BOUNDARY_REQUIRED/);

  const incompletePath = clone(base);
  incompletePath.solutionPath = [];
  assert.throws(() => evaluateMentorGuidedReasoning(incompletePath), /MENTOR_SOLUTION_PATH_REQUIRED/);

  const unknownInference = clone(base);
  unknownInference.inferences[0].supportingEvidenceIds = ["UNKNOWN_EVIDENCE"];
  assert.throws(() => evaluateMentorGuidedReasoning(unknownInference), /MENTOR_INFERENCE_UNKNOWN_EVIDENCE/);
});

test("qualification, learning, cognitive-improvement, deployment, activation, and memory claims remain absent", async () => {
  const contractSource = await readFile(new URL("../lib/cognitive-governor/mentor-guided-reasoning.js", import.meta.url), "utf8");
  assert.doesNotMatch(contractSource, /fetch\s*\(|requestOpenAI|providerRequest|child_process|\bspawn\s*\(|new\s+Agent/i);
  assert.doesNotMatch(contractSource, /from\s+["']node:fs|\b(?:appendFile|mkdir|rename|writeFile)\b|memoryPromotion|qualif(?:y|ied)\s*=\s*true|deploy(?:ed|ment)\s*=\s*true/i);
  const serializedFixtures = JSON.stringify(fixtureDocument);
  assert.doesNotMatch(serializedFixtures, /Bearer\s+[A-Za-z0-9._~+/=-]{20,}|sk-[A-Za-z0-9_-]{20,}/);
});
