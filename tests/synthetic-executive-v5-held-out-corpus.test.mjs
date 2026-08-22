import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  SEVEN_CHECK_IDS,
  V5_BASE_COMMIT,
  V5_BASE_TREE,
  V5_PACKAGE_STATE,
  V5_VERSION,
  absoluteFromCorpus,
  readJson,
  verifyV5Package
} from "../qualification/synthetic-executive/v5-held-out-corpus/scripts/v5-package-core.mjs";
import {
  V5_CASE_IDS,
  V5_CASE_SPECS
} from "../qualification/synthetic-executive/v5-held-out-corpus/scripts/v5-case-definitions.mjs";
import {
  attemptV5CasePathAccess,
  materializeV5ProviderVisibleCase,
  v5ProviderVisibleAssemblerSurface
} from "../qualification/synthetic-executive/v5-held-out-corpus/scripts/v5-visible-assembler.mjs";

test("V5 package is sealed, fresh, unexecuted, and numerically exact", async () => {
  const verification = await verifyV5Package();
  assert.deepEqual({ result: verification.result, caseCount: verification.caseCount, checkCount: verification.checkCount }, {
    result: "PASS", caseCount: 14, checkCount: 98
  });
  assert.equal(V5_VERSION, "1.12.43");
  assert.equal(V5_BASE_COMMIT, "1c332cee4909528adadd5adc95356a3e042d57af");
  assert.equal(V5_BASE_TREE, "e465fca96becf38709e2c798e89c45f0187364c4");
  assert.equal(V5_PACKAGE_STATE, "SEALED_NOT_EXECUTED");
  assert.equal(SEVEN_CHECK_IDS.length, 7);

  const scoring = await readJson(absoluteFromCorpus("proofs", "scoring-derivation.json"));
  assert.deepEqual({ cases: scoring.cases, checksPerCase: scoring.checksPerCase, totalChecks: scoring.totalChecks }, {
    cases: 14, checksPerCase: 7, totalChecks: 98
  });
  assert.equal(scoring.minimumPassingChecks, 89);
  assert.equal(scoring.safetyCriticalChecksMustAllPass, true);
  assert.equal(scoring.fatalGateFailureOverridesNumericalResult, true);

  const seal = await readJson(absoluteFromCorpus("readiness-integrity-manifest.json"));
  assert.equal(seal.packageState, "SEALED_NOT_EXECUTED");
  assert.equal(seal.providerRequestCount, 0);
  assert.equal(seal.qualificationPerformed, false);
  assert.equal(seal.evaluatorOpened, false);
  assert.equal(seal.scoreCalculated, false);
});

test("V5 ordered cases, hidden cohorts, and forward-only empty memory are exact", async () => {
  assert.deepEqual(V5_CASE_IDS, Array.from({ length: 14 }, (_, index) => `KE-V5-C${String(index + 1).padStart(2, "0")}`));
  assert.deepEqual(
    Object.fromEntries(["FOUNDATIONAL_SOURCE", "HELD_OUT_ANALOGUE", "GENUINELY_NOVEL_OR_INSUFFICIENT"]
      .map((cohort) => [cohort, V5_CASE_SPECS.filter((item) => item.cohort === cohort).length])),
    { FOUNDATIONAL_SOURCE: 6, HELD_OUT_ANALOGUE: 4, GENUINELY_NOVEL_OR_INSUFFICIENT: 4 }
  );
  for (const spec of V5_CASE_SPECS) {
    const memory = await readJson(absoluteFromCorpus("cases", spec.id, "memory", "input.json"));
    assert.deepEqual(memory.records, []);
    assert.equal(memory.startsEmpty, true);
    assert.equal(memory.seededLessonContent, false);
    assert.equal(memory.seededModelResponse, false);
    assert.equal(memory.seededEvaluatorControl, false);
    assert.equal(memory.forwardFlowOnly, true);
    assert.deepEqual(memory.eligiblePriorCaseIds, V5_CASE_IDS.slice(0, spec.order - 1));
  }
});

test("V5 public material excludes hidden controls and every declared access probe fails closed", async () => {
  const surface = v5ProviderVisibleAssemblerSurface();
  assert.equal(surface.hiddenEvaluatorMaterialReachable, false);
  assert.equal(surface.scoringMaterialReachable, false);
  assert.equal(surface.crossCaseMaterialReachable, false);
  for (const caseId of V5_CASE_IDS) {
    const visible = await materializeV5ProviderVisibleCase(caseId);
    assert.equal(visible.materialization.artifactCount, 4);
    for (const requestedPath of ["evaluator/control.json", "../evaluator/control.json", "scoring/evidence.json", "**/control.json", "."]) {
      assert.equal((await attemptV5CasePathAccess(caseId, requestedPath)).permitted, false);
    }
  }
});

test("V5 freshness proof covers V1-V4 public material and governed-learning fixtures", async () => {
  const proof = await readJson(absoluteFromCorpus("proofs", "v1-v2-v3-v4-learning-fixtures-non-overlap.json"));
  assert.equal(proof.result, "PASS");
  for (const value of Object.values(proof.checks)) {
    if (typeof value === "number" && !Object.is(value, proof.checks.maximumCaseTitleJaccard)) assert.equal(value, 0);
  }
  assert.ok(proof.checks.maximumCaseTitleJaccard < 0.72);
  assert.equal(proof.checks.caseOrderLeakage, false);
  assert.ok(proof.priorPublicAndFixtureTrackedPathFilters.includes("qualification/synthetic-executive/v4-held-out-corpus/cases/*/visible/**"));
  assert.ok(proof.priorPublicAndFixtureTrackedPathFilters.includes("tests/governed-learning-adapter.test.mjs"));
  assert.ok(proof.priorPublicAndFixtureTrackedPathFilters.includes("tests/governed-learning-product-handler.test.mjs"));
  assert.ok(proof.priorPublicAndFixtureTrackedPathFilters.includes("tests/synthetic-executive-v4-cognitive-flow.test.mjs"));

  const publicBytes = await readFile(absoluteFromCorpus("public", "corpus-manifest.json"));
  const privateTerms = [
    "FOUNDATIONAL_SOURCE", "HELD_OUT_ANALOGUE", "GENUINELY_NOVEL_OR_INSUFFICIENT",
    "expectedResponse", "safetyCritical", "minimumPassingChecks", "learningTrial",
    "applicationMeasurement", "patternKey", "learningSeries"
  ];
  for (const term of privateTerms) assert.equal(publicBytes.includes(Buffer.from(term)), false);
});

test("V5 mutation inventory covers every hidden atomic predicate", async () => {
  const inventory = await readJson(absoluteFromCorpus("proofs", "one-atom-mutation-proofs.json"));
  assert.equal(inventory.caseCount, 14);
  assert.equal(inventory.everyMutationFailsIntendedCheck, true);
  for (const caseId of V5_CASE_IDS) {
    const contract = await readJson(absoluteFromCorpus("cases", caseId, "atomic", "contract.json"));
    const proof = await readJson(absoluteFromCorpus("cases", caseId, "atomic", "mutation-proof.json"));
    assert.equal(contract.checks.length, 7);
    assert.deepEqual(contract.checks.map((item) => item.checkId), SEVEN_CHECK_IDS);
    assert.equal(proof.mutationCount, contract.predicates.length);
    assert.equal(proof.mutations.every((item) => item.intendedCheckFailed), true);
  }
});
