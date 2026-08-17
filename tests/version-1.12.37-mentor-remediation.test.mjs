import assert from "node:assert/strict";
import test from "node:test";

import {
  MENTOR_GUIDED_REASONING_CYCLE,
  evaluateMentorDecisionContract
} from "../lib/cognitive-governor/index.js";
import { mentorDecisionFixtures } from "./fixtures/version-1.12.37-mentor-remediation.mjs";

const groups = Object.freeze([
  "EVIDENCE_SUFFICIENCY",
  "AUTHORITY_SCOPE",
  "FAILURE_SCOPE",
  "SMALLEST_SAFE_ACTION_AND_LOOP"
]);

const requiredTags = Object.freeze([
  "positive",
  "negative",
  "contradiction",
  "missing evidence",
  "excessive-authority request",
  "premature stopping",
  "unsafe continuation"
]);

test("the new mentor regression set contains exactly 32 independently authored fixtures", () => {
  assert.equal(mentorDecisionFixtures.length, 32);
  assert.equal(new Set(mentorDecisionFixtures.map((fixture) => fixture.fixtureId)).size, 32);
  for (const group of groups) {
    const members = mentorDecisionFixtures.filter((fixture) => fixture.group === group);
    assert.equal(members.length, 8, group);
    const tags = new Set(members.flatMap((fixture) => fixture.tags));
    for (const tag of requiredTags) assert.equal(tags.has(tag), true, `${group}:${tag}`);
  }
});

test("mentor decisions follow the required explicit order and exact typed outputs", () => {
  assert.deepEqual(MENTOR_GUIDED_REASONING_CYCLE, [
    "ACTUAL_MISSION",
    "FINISH_LINE",
    "EARLIEST_SHARED_CAUSAL_BOUNDARY",
    "RETAINED_EVIDENCE_SUFFICIENCY",
    "AUTHORITY_SCOPE",
    "FAILURE_SCOPE",
    "SMALLEST_SAFE_ADVANCING_ACTION",
    "PROHIBITED_OPERATIONS",
    "UNCERTAINTY_AND_STOP_CONDITIONS"
  ]);
  for (const fixture of mentorDecisionFixtures) {
    const before = JSON.stringify(fixture.input);
    const actual = evaluateMentorDecisionContract(fixture.input);
    assert.equal(JSON.stringify(fixture.input), before, `${fixture.fixtureId}:input mutated`);
    assert.deepEqual(actual.decisionOrder, MENTOR_GUIDED_REASONING_CYCLE, fixture.fixtureId);
    for (const [field, expected] of Object.entries(fixture.expected)) {
      assert.deepEqual(actual[field], expected, `${fixture.fixtureId}:${field}`);
    }
  }
});

test("evidence, authority, failure scope, continuation, and action remain independently typed", () => {
  const insufficientArchitecturalHint = mentorDecisionFixtures.find((fixture) => (
    fixture.fixtureId === "FAILURE_ORCHARD_INSUFFICIENT_NOT_ARCHITECTURAL"
  ));
  const insufficient = evaluateMentorDecisionContract(insufficientArchitecturalHint.input);
  assert.equal(insufficient.retainedEvidenceSufficient, false);
  assert.equal(insufficient.failureScope, "INSUFFICIENT_EVIDENCE");
  assert.notEqual(insufficient.failureScope, "ARCHITECTURAL");

  const authorityIndependent = mentorDecisionFixtures.find((fixture) => (
    fixture.fixtureId === "AUTHORITY_WEATHER_MISSING"
  ));
  const authority = evaluateMentorDecisionContract(authorityIndependent.input);
  assert.equal(authority.retainedEvidenceSufficient, false);
  assert.equal(authority.authorityClass, "EXISTING");
  assert.equal(authority.safeIndependentContinuation, false);

  const bounded = mentorDecisionFixtures.find((fixture) => (
    fixture.fixtureId === "AUTHORITY_LANGUAGE_PREMATURE_STOP"
  ));
  const continuation = evaluateMentorDecisionContract(bounded.input);
  assert.equal(continuation.failureScope, "BOUNDED");
  assert.equal(continuation.safeIndependentContinuation, true);
  assert.equal(continuation.nextActionClass, "ADVANCE_WITHIN_EXISTING_AUTHORITY");
});
