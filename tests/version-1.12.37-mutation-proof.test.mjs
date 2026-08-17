import assert from "node:assert/strict";
import test from "node:test";

import { evaluateMentorDecisionContract } from "../lib/cognitive-governor/index.js";
import { evaluateAtomicContract } from "../qualification/synthetic-executive/future-independent-qualification-contract/atomic-scorer.mjs";
import {
  atomicContractForPredicate,
  atomicNegativeResponse,
  atomicPassingResponse,
  atomicPredicateDeclaration
} from "./fixtures/version-1.12.37-atomic-scorer-fixtures.mjs";
import { mentorDecisionFixtures } from "./fixtures/version-1.12.37-mentor-remediation.mjs";

const mentorOutputs = Object.freeze([
  "retainedEvidenceSufficient",
  "authorityClass",
  "failureScope",
  "safeIndependentContinuation",
  "nextActionClass",
  "selectedActionId",
  "repeatedLoopDetected"
]);

function changedFields(before, after, fields) {
  return fields.filter((field) => !Object.is(before[field], after[field]));
}

test("one-atom mentor mutations change every decisive output and preserve unrelated outputs", () => {
  const baseFixture = mentorDecisionFixtures.find((fixture) => fixture.fixtureId === "EVIDENCE_GREENHOUSE_POSITIVE");
  const baseline = evaluateMentorDecisionContract(baseFixture.input);
  const mutations = [
    {
      mutationId: "RETAINED_EVIDENCE_SUPPORT",
      mutate(input) { input.retainedEvidence.supportsDecision = false; },
      changed: ["retainedEvidenceSufficient", "failureScope", "safeIndependentContinuation", "nextActionClass", "selectedActionId"]
    },
    {
      mutationId: "AUTHORITY_SCOPE",
      mutate(input) { input.authority.allowedActionIds = []; },
      changed: ["authorityClass", "failureScope", "safeIndependentContinuation", "nextActionClass", "selectedActionId"]
    },
    {
      mutationId: "FAILURE_SCOPE",
      mutate(input) { input.failure.newMechanismRequired = true; },
      changed: ["failureScope", "safeIndependentContinuation", "nextActionClass", "selectedActionId"]
    },
    {
      mutationId: "SAFE_CONTINUATION",
      mutate(input) { input.actions[0].safe = false; },
      changed: ["authorityClass", "safeIndependentContinuation", "nextActionClass", "selectedActionId"]
    },
    {
      mutationId: "NEXT_ACTION_AND_LOOP",
      mutate(input) { input.previousActionSignatures = [input.actions[0].signature]; },
      changed: ["safeIndependentContinuation", "nextActionClass", "selectedActionId", "repeatedLoopDetected"]
    }
  ];
  const observedChangedOutputs = new Set();
  for (const mutation of mutations) {
    const input = structuredClone(baseFixture.input);
    mutation.mutate(input);
    const actual = evaluateMentorDecisionContract(input);
    const changed = changedFields(baseline, actual, mentorOutputs);
    assert.deepEqual(changed.sort(), [...mutation.changed].sort(), mutation.mutationId);
    changed.forEach((field) => observedChangedOutputs.add(field));
    const unrelated = mentorOutputs.filter((field) => !mutation.changed.includes(field));
    for (const field of unrelated) assert.deepEqual(actual[field], baseline[field], `${mutation.mutationId}:${field}`);
  }
  assert.deepEqual([...observedChangedOutputs].sort(), [...mentorOutputs].sort());
});

test("one response-atom mutation flips every atomic predicate type while an unrelated control remains stable", async () => {
  const { ATOMIC_PREDICATE_TYPES } = await import(
    "../qualification/synthetic-executive/future-independent-qualification-contract/atomic-scorer.mjs"
  );
  for (const type of ATOMIC_PREDICATE_TYPES) {
    const target = atomicPredicateDeclaration(type);
    const contract = atomicContractForPredicate(target);
    contract.fields.controlFlag = { type: "boolean" };
    contract.predicates.push({
      predicateId: "CONTROL_PREDICATE",
      type: "BOOLEAN_EQUALS",
      field: "controlFlag",
      expected: true
    });
    contract.checks.push({ checkId: "CONTROL_CHECK", predicateIds: ["CONTROL_PREDICATE"] });
    const baselineResponse = { ...structuredClone(atomicPassingResponse), controlFlag: true };
    const mutatedResponse = { ...atomicNegativeResponse(type), controlFlag: true };
    const changedInputAtoms = new Set([
      ...Object.keys(baselineResponse),
      ...Object.keys(mutatedResponse)
    ].filter((field) => JSON.stringify(baselineResponse[field]) !== JSON.stringify(mutatedResponse[field])));
    assert.equal(changedInputAtoms.size, 1, `${type}:exactly one response atom`);
    const baseline = evaluateAtomicContract(contract, baselineResponse);
    const mutated = evaluateAtomicContract(contract, mutatedResponse);
    const baselineById = new Map(baseline.executions.map((execution) => [execution.predicateId, execution]));
    const mutatedById = new Map(mutated.executions.map((execution) => [execution.predicateId, execution]));
    assert.equal(baselineById.get(target.predicateId).passed, true, `${type}:baseline`);
    assert.equal(mutatedById.get(target.predicateId).passed, false, `${type}:mutation detected`);
    assert.deepEqual(mutatedById.get("CONTROL_PREDICATE"), baselineById.get("CONTROL_PREDICATE"), `${type}:control`);
  }
});
