import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  ATOMIC_PREDICATE_TYPES,
  evaluateAtomicContract,
  reconcilePredicateExecutions,
  validateAtomicContract
} from "../qualification/synthetic-executive/future-independent-qualification-contract/atomic-scorer.mjs";
import {
  atomicScorerFixtures,
  atomicUnknownPredicateType
} from "./fixtures/version-1.12.37-atomic-scorer-fixtures.mjs";

const qualificationContract = JSON.parse(await readFile(new URL(
  "../qualification/synthetic-executive/future-independent-qualification-contract/contract.json",
  import.meta.url
), "utf8"));

function exactFailure(callback, expectedCode, context) {
  assert.throws(callback, (error) => {
    assert.equal(String(error?.message || "").split(/\r?\n/, 1)[0], expectedCode, context);
    return true;
  }, context);
}

test("the contract, scorer registry, and atomic fixture matrix are total", () => {
  const contractTypes = [...qualificationContract.scoring.atomicPredicateTypes].sort();
  const scorerTypes = [...ATOMIC_PREDICATE_TYPES].sort();
  assert.deepEqual(scorerTypes, contractTypes, "ATOMIC_CONTRACT_SCORER_TYPE_SET_MISMATCH");
  assert.equal(ATOMIC_PREDICATE_TYPES.length, 17);
  assert.equal(atomicScorerFixtures.length, 102);
  assert.equal(new Set(atomicScorerFixtures.map((fixture) => fixture.fixtureId)).size, 102);
  const requiredClasses = new Set([
    "VALID_POSITIVE",
    "VALID_NEGATIVE",
    "MISSING_FIELD",
    "WRONG_TYPE",
    "CONTRADICTORY_COMBINATION"
  ]);
  for (const type of ATOMIC_PREDICATE_TYPES) {
    const members = atomicScorerFixtures.filter((fixture) => fixture.predicateType === type);
    assert.equal(members.length, 6, type);
    for (const required of requiredClasses) {
      assert.equal(members.filter((fixture) => fixture.class === required).length, 1, `${type}:${required}`);
    }
    const classes = new Set(members.map((fixture) => fixture.class));
    assert.equal(classes.has("UNKNOWN_PREDICATE") || classes.has("UNKNOWN_FIELD"), true, `${type}:unknown`);
  }
  const allClasses = new Set(atomicScorerFixtures.map((fixture) => fixture.class));
  assert.equal(allClasses.has("UNKNOWN_PREDICATE"), true);
  assert.equal(allClasses.has("UNKNOWN_FIELD"), true);
  assert.deepEqual(
    [...allClasses].filter((fixtureClass) => !requiredClasses.has(fixtureClass)
      && !["UNKNOWN_PREDICATE", "UNKNOWN_FIELD"].includes(fixtureClass)),
    []
  );
  const unknownPredicateFixtures = atomicScorerFixtures.filter((fixture) => fixture.class === "UNKNOWN_PREDICATE");
  assert.equal(unknownPredicateFixtures.length, 1, "ATOMIC_UNKNOWN_SENTINEL_FIXTURE_COUNT");
  assert.deepEqual(
    [...new Set(unknownPredicateFixtures.flatMap((fixture) => fixture.contract.predicates.map((predicate) => predicate.type)))],
    [atomicUnknownPredicateType],
    "ATOMIC_UNKNOWN_SENTINEL_NOT_CANONICAL"
  );
  assert.equal(ATOMIC_PREDICATE_TYPES.includes(atomicUnknownPredicateType), false);
});

test("all valid atomic fixtures produce exact pass or fail results with no partial credit", () => {
  for (const fixture of atomicScorerFixtures.filter((item) => !item.expected.startsWith("REJECT"))) {
    const result = evaluateAtomicContract(fixture.contract, fixture.response);
    assert.equal(result.executions.length, 1, fixture.fixtureId);
    assert.equal(result.executions[0].passed, fixture.expected === "PASS", fixture.fixtureId);
    assert.equal(result.checks[0].passed, fixture.expected === "PASS", fixture.fixtureId);
    assert.equal(result.qualified, fixture.expected === "PASS", fixture.fixtureId);
    assert.equal(result.discretionaryPartialCredit, false, fixture.fixtureId);
    assert.equal(result.providerEvaluatorUsed, false, fixture.fixtureId);
    assert.equal(result.narrativeSemanticInferenceUsed, false, fixture.fixtureId);
    assert.equal(Object.hasOwn(result, "score"), false, fixture.fixtureId);
  }
});

test("unknown declarations and contradictory combinations fail closed", () => {
  for (const fixture of atomicScorerFixtures.filter((item) => item.expected === "REJECT_CONTRACT")) {
    const expectedCode = fixture.class === "UNKNOWN_PREDICATE"
      ? "ATOMIC_PREDICATE_TYPE_UNKNOWN"
      : fixture.class === "UNKNOWN_FIELD"
        ? "ATOMIC_PREDICATE_FIELD_UNKNOWN"
        : "ATOMIC_CONTRADICTORY_EXACT_PREDICATES";
    exactFailure(() => validateAtomicContract(fixture.contract), expectedCode, fixture.fixtureId);
  }
});

test("duplicate predicate identifiers fail closed", () => {
  const fixture = atomicScorerFixtures.find((item) => item.expected === "PASS");
  const duplicate = structuredClone(fixture.contract);
  duplicate.predicates.push(structuredClone(duplicate.predicates[0]));
  exactFailure(
    () => validateAtomicContract(duplicate),
    "ATOMIC_PREDICATE_ID_REQUIRED_DUPLICATE",
    "duplicate predicate identifier"
  );
});

test("missing and duplicate predicate executions fail closed", () => {
  const fixture = atomicScorerFixtures.find((item) => item.expected === "PASS");
  const result = evaluateAtomicContract(fixture.contract, fixture.response);
  exactFailure(
    () => reconcilePredicateExecutions(fixture.contract, []),
    "ATOMIC_EXECUTION_ID_REQUIRED",
    "missing predicate execution"
  );
  exactFailure(
    () => reconcilePredicateExecutions(fixture.contract, [result.executions[0], result.executions[0]]),
    "ATOMIC_EXECUTION_ID_REQUIRED_DUPLICATE",
    "duplicate predicate execution"
  );
});

test("each check is exactly a declared conjunction and narrative equality is unavailable", () => {
  for (const fixture of atomicScorerFixtures.filter((item) => item.expected === "PASS")) {
    const summary = validateAtomicContract(fixture.contract);
    assert.equal(summary.predicateCount, 1, fixture.fixtureId);
    assert.equal(summary.checkCount, 1, fixture.fixtureId);
    const result = evaluateAtomicContract(fixture.contract, fixture.response);
    assert.equal(result.checks[0].conjunction, true, fixture.fixtureId);
  }
  assert.equal(ATOMIC_PREDICATE_TYPES.includes("NARRATIVE_EQUALS"), false);
  assert.equal(ATOMIC_PREDICATE_TYPES.includes("FULL_STRING_EQUALS"), false);
});

test("every registered fixture receives exactly one classified totality execution", () => {
  const executions = [];
  for (const fixture of atomicScorerFixtures) {
    if (fixture.expected === "REJECT_CONTRACT") {
      const expectedCode = fixture.class === "UNKNOWN_PREDICATE"
        ? "ATOMIC_PREDICATE_TYPE_UNKNOWN"
        : fixture.class === "UNKNOWN_FIELD"
          ? "ATOMIC_PREDICATE_FIELD_UNKNOWN"
          : "ATOMIC_CONTRADICTORY_EXACT_PREDICATES";
      exactFailure(() => validateAtomicContract(fixture.contract), expectedCode, fixture.fixtureId);
    } else {
      const result = evaluateAtomicContract(fixture.contract, fixture.response);
      assert.equal(result.qualified, fixture.expected === "PASS", fixture.fixtureId);
      assert.equal(Object.hasOwn(result, "score"), false, fixture.fixtureId);
    }
    executions.push(fixture.fixtureId);
  }
  const registered = atomicScorerFixtures.map((fixture) => fixture.fixtureId).sort();
  assert.equal(executions.length, registered.length);
  assert.equal(new Set(executions).size, executions.length);
  assert.deepEqual([...executions].sort(), registered);
});
