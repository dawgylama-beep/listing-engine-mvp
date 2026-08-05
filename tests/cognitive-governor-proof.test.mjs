import assert from "node:assert/strict";
import test from "node:test";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";
import { buildGovernorExecutionProof } from "../lib/cognitive-governor/index.js";
import { validateGovernorProof } from "../benchmarks/blind-object-v1-execution-v1/scripts/governor-proof-validator.mjs";

function withHash(value, field) {
  const unhashed = { ...value, [field]: "" };
  return { ...unhashed, [field]: sha256Object(unhashed) };
}

function proofFixture({ withLesson = true, withProvider = true } = {}) {
  const experienceRecord = withHash({ schemaVersion: "1.0", objectStateId: "object-a", experienceRecordHash: "" }, "experienceRecordHash");
  const cognitiveEpisode = withHash({
    schemaVersion: "1.0",
    terminalStatus: "COMPLETE",
    linkedExperienceRecordHash: experienceRecord.experienceRecordHash,
    blockedDuplicateActions: [],
    cycleDetections: [],
    cognitiveEpisodeHash: ""
  }, "cognitiveEpisodeHash");
  const lessonCandidate = withLesson ? withHash({
    schemaVersion: "1.0",
    status: "UNVALIDATED",
    promotionAuthorized: false,
    cognitiveEpisodeHash: cognitiveEpisode.cognitiveEpisodeHash,
    lessonCandidateHash: ""
  }, "lessonCandidateHash") : null;
  const decisions = [{
    sequence: 1,
    evaluationIdentity: "governed-evaluation-a",
    actionType: "ACQUIRE_INITIAL_EVIDENCE",
    actionSignature: "cognitive-action-acquire",
    reasonCodes: ["INITIAL_PLAN_READY"],
    inputKnowledgeStateHash: "a".repeat(64),
    outputKnowledgeStateHash: "b".repeat(64),
    materialKnowledgeChanged: true
  }, {
    sequence: 2,
    evaluationIdentity: "governed-evaluation-a",
    actionType: "STOP_COMPLETE",
    actionSignature: "cognitive-action-stop",
    reasonCodes: ["EVALUATION_COMPLETE"],
    inputKnowledgeStateHash: "b".repeat(64),
    outputKnowledgeStateHash: "b".repeat(64),
    materialKnowledgeChanged: false
  }];
  const executions = [{
    sequence: 1,
    executionEventIdentity: "execution-acquire",
    operationKind: "PARENT_ACTION",
    operationPhase: "INITIAL_PROVIDER_ACQUISITION",
    actionType: "ACQUIRE_INITIAL_EVIDENCE",
    actionSignature: "cognitive-action-acquire",
    decisionInvocationSequence: 1,
    parentExecutionEventIdentity: "",
    status: "COMPLETED",
    errorCode: ""
  }, {
    sequence: 2,
    executionEventIdentity: "execution-stop",
    operationKind: "PARENT_ACTION",
    operationPhase: "TERMINAL_STOP_TRANSITION",
    actionType: "STOP_COMPLETE",
    actionSignature: "cognitive-action-stop",
    decisionInvocationSequence: 2,
    parentExecutionEventIdentity: "",
    status: "COMPLETED",
    errorCode: ""
  }];
  const providerRequests = withProvider ? [{
    governorScopeClassification: "GOVERNOR_CONTROLLED",
    parentGovernorActionType: "ACQUIRE_INITIAL_EVIDENCE",
    parentGovernorActionSignature: "cognitive-action-acquire",
    controlledExecutionEventIdentity: "execution-acquire",
    providerOperationPhase: "INITIAL_PROVIDER_ACQUISITION",
    logicalProviderRequestIdentity: "provider-request-a",
    physicalAttemptCount: 2,
    physicalRetryAttemptCount: 1,
    physicalAttempts: [{ attempt: 1, retry: false, provider: "serper", outcome: "failed" }, { attempt: 2, retry: true, provider: "serper", outcome: "succeeded" }]
  }] : [];
  const governor = { executionLedger: {
    evaluationIdentity: "governed-evaluation-a",
    governorConstructionEvents: [{ sequence: 1 }],
    authoritativeCognitiveStateEvents: [{ sequence: 1 }],
    cognitiveStateSnapshotCount: 2,
    decisionInvocations: decisions,
    controlledExecutionEvents: executions,
    unauthorizedExecutionAttempts: [],
    providerRequestOwnership: []
  } };
  const proof = buildGovernorExecutionProof({
    governor,
    cognitiveEpisode,
    lessonCandidate,
    experienceRecord,
    providerRequests,
    providerCapacity: { maximum: 12, consumed: withProvider ? 2 : 0 },
    directPageCapacity: { maximum: 2, consumed: 0 }
  });
  return { proof, cognitiveEpisode, lessonCandidate, experienceRecord };
}

test("valid proof independently validates Episode, Experience, Lesson, attempts, and ceilings", () => {
  const fixture = proofFixture();
  const result = validateGovernorProof(fixture);
  assert.equal(result.passed, true, JSON.stringify(result.failures));
  assert.equal(fixture.proof.governorInvocationCount, 1);
  assert.equal(fixture.proof.authoritativeCognitiveStateCount, 1);
  assert.equal(fixture.proof.unauthorizedActionCount, 0);
});

test("Episode mutation and Experience link mismatch fail integrity validation", () => {
  const episodeMutation = proofFixture();
  episodeMutation.cognitiveEpisode.terminalStatus = "INSUFFICIENT_EVIDENCE";
  assert.ok(validateGovernorProof(episodeMutation).failures.some((failure) => failure.code === "COGNITIVE_EPISODE_HASH_INVALID"));
  const linkMutation = proofFixture();
  linkMutation.cognitiveEpisode.linkedExperienceRecordHash = "f".repeat(64);
  assert.ok(validateGovernorProof(linkMutation).failures.some((failure) => failure.code === "EXPERIENCE_LINK_INVALID"));
});

test("Lesson mutation, validation status, and promotion are rejected", () => {
  const hashMutation = proofFixture();
  hashMutation.lessonCandidate.status = "MUTATED";
  const hashResult = validateGovernorProof(hashMutation);
  assert.ok(hashResult.failures.some((failure) => failure.code === "LESSON_HASH_INVALID"));
  assert.ok(hashResult.failures.some((failure) => failure.code === "LESSON_STATUS_INVALID"));
  const promotionMutation = proofFixture();
  promotionMutation.lessonCandidate = withHash({ ...promotionMutation.lessonCandidate, promotionAuthorized: true }, "lessonCandidateHash");
  assert.ok(validateGovernorProof(promotionMutation).failures.some((failure) => failure.code === "LESSON_PROMOTION_INVALID"));
});

test("unauthorized records cannot be concealed by setting unauthorizedActionCount to zero", () => {
  const fixture = proofFixture();
  fixture.proof.unauthorizedExecutionAttempts.push({ reasonCode: "AUTHORIZATION_MISSING" });
  fixture.proof.unauthorizedExecutionAttemptCount = 0;
  fixture.proof.unauthorizedActionCount = 0;
  const result = validateGovernorProof(fixture);
  assert.ok(result.failures.some((failure) => failure.code === "UNAUTHORIZED_ATTEMPT_COUNT_MISMATCH"));
  assert.ok(result.failures.some((failure) => failure.code === "UNAUTHORIZED_ACTION_COUNT_MISMATCH"));
});

test("provider, refinement, direct-page, retry, Experience, Episode, and Lesson ceilings fail honestly", () => {
  for (const name of ["provider", "refinement", "directPage", "retry", "experienceRecord", "cognitiveEpisode", "lessonCandidate"]) {
    const fixture = proofFixture();
    fixture.proof.ceilings[name].compliant = false;
    const result = validateGovernorProof(fixture);
    assert.ok(result.failures.some((failure) => failure.code === `${name.toUpperCase()}_CEILING_EXCEEDED`), name);
  }
});

test("proof hashing is deterministic and covers authorization fields", () => {
  const first = proofFixture().proof;
  const second = proofFixture().proof;
  assert.equal(stableObjectJson(first), stableObjectJson(second));
  second.selectedDecisions[0].actionSignature = "mutated";
  assert.ok(validateGovernorProof({ ...proofFixture(), proof: second }).failures.some((failure) => failure.code === "PROOF_HASH_INVALID"));
});
