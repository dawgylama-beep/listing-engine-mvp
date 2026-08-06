import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_ATTESTED_EXPERIENCE_RECORD_BYTES,
  MAX_FAILURE_ENVELOPE_BYTES,
  TERMINAL_STAGE,
  TERMINAL_TRANSITION,
  assertFinalExperienceAttestation,
  attachTerminalGovernor,
  attachTerminalProviderRecords,
  buildFailureEnvelope,
  calculateExperienceRecordHash,
  createEvaluationTerminalContext,
  emittedExperienceRecordByteLength,
  experienceRecordHashPreimageByteLength,
  recordTerminalStage,
  sealExperienceRecord,
  validateFinalExperienceAttestation,
  verifyFailureEnvelope
} from "../lib/terminal-evidence.js";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";

function start(context, stage) {
  return recordTerminalStage(context, stage, TERMINAL_TRANSITION.STARTED);
}

function complete(context, stage) {
  return recordTerminalStage(context, stage, TERMINAL_TRANSITION.COMPLETED);
}

function failAt(stages, error = Object.assign(new Error("private detail"), { code: "SYNTHETIC_FAILURE" })) {
  const context = createEvaluationTerminalContext({ evaluationId: "analysis-terminal-evidence" });
  for (const [stage, transition] of stages) recordTerminalStage(context, stage, transition);
  return { context, envelope: buildFailureEnvelope(context, error) };
}

function partialGovernor({ authoritative = false, activeExecution = false } = {}) {
  const lifecycleEvents = [{
    sequence: 1,
    eventType: "GOVERNOR_CONSTRUCTED",
    lifecycleEventIdentity: "lifecycle-construction"
  }];
  if (authoritative) lifecycleEvents.push({
    sequence: 2,
    eventType: "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED",
    lifecycleEventIdentity: "lifecycle-authoritative"
  });
  return {
    executionLedger: {
      schemaVersion: "1.1",
      evaluationIdentity: "governed-evaluation-terminal",
      lifecycleEvents,
      cognitiveStateSnapshotCount: authoritative ? 1 : 0,
      decisionInvocations: [{
        sequence: 1,
        actionType: "ACQUIRE_INITIAL_EVIDENCE",
        actionSignature: "cognitive-action-terminal",
        outcomeCode: activeExecution ? "NOT_EXECUTED" : "COMPLETED",
        decisionIdentity: "decision-terminal"
      }],
      controlledExecutionEvents: [{
        sequence: 1,
        operationKind: "PARENT_ACTION",
        operationPhase: "INITIAL_PROVIDER_ACQUISITION",
        actionType: "ACQUIRE_INITIAL_EVIDENCE",
        actionSignature: "cognitive-action-terminal",
        executionEventIdentity: "execution-terminal",
        status: activeExecution ? "STARTED" : "COMPLETED",
        errorCode: ""
      }],
      unauthorizedExecutionAttempts: []
    },
    lastState: {
      providerCapacity: { maximum: 12, consumed: 2 },
      directPageCapacity: { maximum: 2, consumed: 0 }
    }
  };
}

function attestationBundle(input = { schemaVersion: "1.0", objectStateId: "object-terminal" }) {
  const experienceRecord = sealExperienceRecord(input);
  const cognitiveEpisode = { linkedExperienceRecordHash: experienceRecord.experienceRecordHash };
  const emittedByteSize = emittedExperienceRecordByteLength(experienceRecord);
  const governorProof = {
    schemaVersion: "1.1",
    experienceRecord: {
      storedHash: experienceRecord.experienceRecordHash,
      linkedHash: cognitiveEpisode.linkedExperienceRecordHash,
      linkIntegrityPassed: true,
      canonicalByteSize: emittedByteSize,
      maximumByteSize: MAX_ATTESTED_EXPERIENCE_RECORD_BYTES,
      sizeCompliant: true
    },
    ceilings: {
      experienceRecord: {
        maximumBytes: MAX_ATTESTED_EXPERIENCE_RECORD_BYTES,
        consumedBytes: emittedByteSize,
        compliant: true
      }
    },
    proofHash: ""
  };
  governorProof.proofHash = sha256Object(governorProof);
  return { experienceRecord, cognitiveEpisode, governorProof };
}

test("pre-observation and observation failures retain the exact entered stage", () => {
  const before = failAt([
    [TERMINAL_STAGE.REQUEST_ACCEPTED, TERMINAL_TRANSITION.STARTED],
    [TERMINAL_STAGE.REQUEST_ACCEPTED, TERMINAL_TRANSITION.COMPLETED],
    [TERMINAL_STAGE.INPUT_VALIDATION, TERMINAL_TRANSITION.STARTED]
  ]).envelope;
  assert.equal(before.stageAtFailure, TERMINAL_STAGE.INPUT_VALIDATION);
  assert.equal(before.progress.flags.objectObservationBegan, false);
  const during = failAt([
    [TERMINAL_STAGE.REQUEST_ACCEPTED, TERMINAL_TRANSITION.STARTED],
    [TERMINAL_STAGE.REQUEST_ACCEPTED, TERMINAL_TRANSITION.COMPLETED],
    [TERMINAL_STAGE.OBJECT_OBSERVATION, TERMINAL_TRANSITION.STARTED]
  ]).envelope;
  assert.equal(during.stageAtFailure, TERMINAL_STAGE.OBJECT_OBSERVATION);
  assert.equal(during.progress.flags.objectObservationBegan, true);
  assert.equal(during.progress.flags.objectObservationCompleted, false);
});

test("identity, finalization, purpose, and Experience sealing failures remain distinct", () => {
  for (const stage of [
    TERMINAL_STAGE.IDENTITY_FORMATION,
    TERMINAL_STAGE.CANONICAL_EVIDENCE_FINALIZATION,
    TERMINAL_STAGE.PURPOSE_JUDGMENT,
    TERMINAL_STAGE.EXPERIENCE_RECORD_SEALING
  ]) {
    const { envelope } = failAt([[stage, TERMINAL_TRANSITION.STARTED]]);
    assert.equal(envelope.stageAtFailure, stage);
    assert.equal(envelope.progress.stageEvents.at(-1).transition, TERMINAL_TRANSITION.FAILED);
  }
});

test("failure before Governor construction explicitly has no fabricated Governor evidence", () => {
  const { envelope } = failAt([[TERMINAL_STAGE.IDENTITY_FORMATION, TERMINAL_TRANSITION.STARTED]]);
  assert.equal(envelope.governorReached, false);
  assert.equal(envelope.authoritativeStateReached, false);
  assert.equal(envelope.partialGovernorLedgerPresent, false);
  assert.equal(envelope.partialGovernorLedger, null);
  assert.equal(Object.hasOwn(envelope, "executionProof"), false);
});

test("construction and authoritative lifecycle records survive without a normal proof", () => {
  const context = createEvaluationTerminalContext({ evaluationId: "analysis-governor-partial" });
  start(context, TERMINAL_STAGE.GOVERNOR_CONSTRUCTION);
  const governor = partialGovernor({ authoritative: true });
  attachTerminalGovernor(context, governor);
  complete(context, TERMINAL_STAGE.GOVERNOR_CONSTRUCTION);
  start(context, TERMINAL_STAGE.AUTHORITATIVE_STATE_INITIALIZATION);
  complete(context, TERMINAL_STAGE.AUTHORITATIVE_STATE_INITIALIZATION);
  start(context, TERMINAL_STAGE.INITIAL_ACQUISITION);
  const envelope = buildFailureEnvelope(context, Object.assign(new Error("failed"), { code: "PROVIDER_FAILED" }));
  assert.equal(envelope.governorReached, true);
  assert.equal(envelope.authoritativeStateReached, true);
  assert.deepEqual(envelope.partialGovernorLedger.lifecycleEvents.map((event) => event.eventType), [
    "GOVERNOR_CONSTRUCTED",
    "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED"
  ]);
  assert.equal(envelope.partialGovernorLedger.classification, "PARTIAL_OR_FAILED");
  assert.equal(Object.hasOwn(envelope, "executionProof"), false);
});

test("governed acquisition and thrown provider attempts retain ownership, failure, and retry telemetry", () => {
  const context = createEvaluationTerminalContext({ evaluationId: "analysis-provider-partial" });
  const governor = partialGovernor({ authoritative: true, activeExecution: true });
  attachTerminalGovernor(context, governor);
  complete(context, TERMINAL_STAGE.GOVERNOR_CONSTRUCTION);
  complete(context, TERMINAL_STAGE.AUTHORITATIVE_STATE_INITIALIZATION);
  start(context, TERMINAL_STAGE.INITIAL_ACQUISITION);
  const records = [{
    evaluationIdentity: governor.executionLedger.evaluationIdentity,
    providerKey: "synthetic_provider",
    providerOperationPhase: "INITIAL_PROVIDER_ACQUISITION",
    governorScopeClassification: "GOVERNOR_CONTROLLED",
    parentGovernorActionSignature: "cognitive-action-terminal",
    controlledExecutionEventIdentity: "execution-terminal",
    logicalProviderRequestIdentity: "logical-provider-terminal",
    logicalQueryAttempted: true,
    physicalAttemptCount: 2,
    physicalRetryAttemptCount: 1,
    physicalAttempts: [
      { attempt: 1, retry: false, provider: "synthetic_provider", outcome: "failed" },
      { attempt: 2, retry: true, provider: "synthetic_provider", outcome: "failed" }
    ],
    succeeded: false,
    statusCode: 503,
    errorCode: "provider_unavailable"
  }];
  attachTerminalProviderRecords(context, records);
  const envelope = buildFailureEnvelope(context, Object.assign(new Error("secret provider body"), {
    code: "PROVIDER_UNAVAILABLE",
    statusCode: 503
  }));
  assert.equal(envelope.controlledOperationActive, true);
  assert.equal(envelope.activeControlledActionSignature, "cognitive-action-terminal");
  assert.equal(envelope.activeControlledExecutionEventIdentity, "execution-terminal");
  assert.equal(envelope.logicalProviderRequestCount, 1);
  assert.equal(envelope.physicalProviderAttemptCount, 2);
  assert.equal(envelope.partialProviderRecords[0].physicalAttempts[1].retry, true);
  assert.equal(envelope.partialProviderRecords[0].physicalAttempts[1].outcome, "failed");
  assert.equal(envelope.partialProviderRecords[0].retryConsumed, 1);
  assert.equal(envelope.partialGovernorLedger.selectedDecisions.length, 1, "transport retry must not create another Governor decision");
});

test("failure envelopes are generic, sanitized, bounded, deterministic, and independently verifiable", () => {
  const context = createEvaluationTerminalContext({ evaluationId: "analysis-secret-test" });
  start(context, TERMINAL_STAGE.OBJECT_OBSERVATION);
  const bearerFixture = `Bearer ${"a".repeat(26)}`;
  const keyFixture = `sk-${"x".repeat(26)}`;
  const error = Object.assign(new Error(`${bearerFixture} ${keyFixture} raw provider body input description`), {
    code: "PROVIDER_FAILURE",
    authorization: bearerFixture,
    rawBody: "raw provider body",
    image: "data:image/png;base64,AAAA"
  });
  const envelope = buildFailureEnvelope(context, error);
  const serialized = JSON.stringify(envelope);
  assert.equal(envelope.sanitizedMessage, "An internal evaluation operation failed before completion.");
  for (const forbidden of ["Bearer", "sk-", "raw provider body", "input description", "data:image", "authorization"]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.equal(envelope.canonicalByteSize <= MAX_FAILURE_ENVELOPE_BYTES, true);
  assert.equal(verifyFailureEnvelope(envelope).valid, true);
  const repeated = failAt([[TERMINAL_STAGE.OBJECT_OBSERVATION, TERMINAL_TRANSITION.STARTED]], error).envelope;
  assert.equal(envelope.errorFingerprint, repeated.errorFingerprint);
});

test("terminal event and envelope hashes fail after any causal mutation", () => {
  const { envelope } = failAt([[TERMINAL_STAGE.OBJECT_OBSERVATION, TERMINAL_TRANSITION.STARTED]]);
  for (const mutate of [
    (value) => { value.stageAtFailure = TERMINAL_STAGE.IDENTITY_FORMATION; },
    (value) => { value.errorCategory = "MUTATED"; },
    (value) => { value.lastCompletedStage = "MUTATED"; },
    (value) => { value.governorReached = true; },
    (value) => { value.physicalProviderAttemptCount = 99; },
    (value) => { value.partialGovernorLedgerPresent = true; },
    (value) => { value.terminalOutcome = "SUCCEEDED"; },
    (value) => { value.progress.stageEvents[0].stage = TERMINAL_STAGE.RESPONSE_EMISSION; }
  ]) {
    const mutated = structuredClone(envelope);
    mutate(mutated);
    assert.equal(verifyFailureEnvelope(mutated).valid, false);
  }
});

test("one created context has one identity and a monotonic deterministic event sequence", () => {
  const context = createEvaluationTerminalContext({ evaluationId: "analysis-one-context" });
  start(context, TERMINAL_STAGE.REQUEST_ACCEPTED);
  complete(context, TERMINAL_STAGE.REQUEST_ACCEPTED);
  start(context, TERMINAL_STAGE.INPUT_VALIDATION);
  assert.equal(context.stageEvents.length, 3);
  assert.deepEqual(context.stageEvents.map((event) => event.sequence), [1, 2, 3]);
  assert.equal(new Set(context.stageEvents.map((event) => event.evaluationIdentity)).size, 1);
  assert.equal(new Set(context.stageEvents.map((event) => event.eventIdentity)).size, 3);
});

test("one sealed Experience Record drives hash, Episode link, proof hash, and full emitted byte size", () => {
  const fixture = attestationBundle({ schemaVersion: "1.0", objectStateId: "object-valid", facts: ["one", "two"] });
  const result = validateFinalExperienceAttestation(fixture);
  assert.equal(result.valid, true, JSON.stringify(result.mismatches));
  assert.equal(result.storedHash, calculateExperienceRecordHash(fixture.experienceRecord));
  assert.equal(result.episodeLinkedHash, result.storedHash);
  assert.equal(result.proofStoredHash, result.storedHash);
  assert.equal(result.proofByteSize, emittedExperienceRecordByteLength(fixture.experienceRecord));
  assert.equal(Object.isFrozen(fixture.experienceRecord), true);
  assert.equal(Object.isFrozen(fixture.experienceRecord.facts), true);
  assert.notEqual(result.hashPreimageByteSize, result.emittedByteSize, "hash-empty preimage bytes and full emitted bytes are distinct semantics");
  assert.doesNotThrow(() => assertFinalExperienceAttestation(fixture));
});

test("post-seal add, remove, change, stale hash, size, and Episode mutations all fail deterministically", () => {
  const fixture = attestationBundle({ schemaVersion: "1.0", objectStateId: "object-mutations", facts: ["one"] });
  assert.throws(() => { fixture.experienceRecord.added = true; }, TypeError);
  const mutations = [
    { record: { ...fixture.experienceRecord, added: true }, code: "EXPERIENCE_HASH_MISMATCH" },
    { record: Object.fromEntries(Object.entries(fixture.experienceRecord).filter(([key]) => key !== "objectStateId")), code: "EXPERIENCE_HASH_MISMATCH" },
    { record: { ...fixture.experienceRecord, objectStateId: "changed" }, code: "EXPERIENCE_HASH_MISMATCH" },
    { record: { ...fixture.experienceRecord, experienceRecordHash: "f".repeat(64) }, code: "EXPERIENCE_HASH_MISMATCH" }
  ];
  for (const mutation of mutations) {
    const result = validateFinalExperienceAttestation({ ...fixture, experienceRecord: mutation.record });
    assert.equal(result.valid, false);
    assert(result.mismatches.includes(mutation.code));
  }
  const sizeMismatch = structuredClone(fixture);
  sizeMismatch.governorProof.experienceRecord.canonicalByteSize += 179;
  sizeMismatch.governorProof.ceilings.experienceRecord.consumedBytes += 179;
  sizeMismatch.governorProof.proofHash = "";
  sizeMismatch.governorProof.proofHash = sha256Object(sizeMismatch.governorProof);
  assert(validateFinalExperienceAttestation(sizeMismatch).mismatches.includes("PROOF_EXPERIENCE_SIZE_MISMATCH"));
  const linkMismatch = structuredClone(fixture);
  linkMismatch.cognitiveEpisode.linkedExperienceRecordHash = "e".repeat(64);
  assert(validateFinalExperienceAttestation(linkMismatch).mismatches.includes("EPISODE_EXPERIENCE_LINK_MISMATCH"));
  const invalidContentWithStoredLink = structuredClone(fixture);
  invalidContentWithStoredLink.experienceRecord.objectStateId = "RUN-022-equivalent-stale-content";
  assert(validateFinalExperienceAttestation(invalidContentWithStoredLink).mismatches.includes("EXPERIENCE_HASH_MISMATCH"));
});

test("final mismatch becomes a sanitized terminal failure rather than a false success proof", () => {
  const fixture = attestationBundle({ schemaVersion: "1.0", objectStateId: "object-response" });
  const mutated = { ...fixture.experienceRecord, lateField: "not sealed" };
  let caught;
  try {
    assertFinalExperienceAttestation({ ...fixture, experienceRecord: mutated });
  } catch (error) {
    caught = error;
  }
  assert.equal(caught.code, "EXPERIENCE_ATTESTATION_MISMATCH");
  const context = createEvaluationTerminalContext({ evaluationId: "analysis-attestation-failure" });
  start(context, TERMINAL_STAGE.RESPONSE_EMISSION);
  const envelope = buildFailureEnvelope(context, caught);
  assert.equal(envelope.internalCode, "EXPERIENCE_ATTESTATION_MISMATCH");
  assert.equal(envelope.errorCategory, "EXPERIENCE_INTEGRITY");
  assert.equal(envelope.stageAtFailure, TERMINAL_STAGE.RESPONSE_EMISSION);
  assert(envelope.attestation.mismatches.includes("EXPERIENCE_HASH_MISMATCH"));
  assert.equal(Object.hasOwn(envelope, "executionProof"), false);
  assert.equal(verifyFailureEnvelope(envelope).valid, true);
});

test("the 65,536-byte full emitted Experience ceiling remains enforced", () => {
  assert.equal(MAX_ATTESTED_EXPERIENCE_RECORD_BYTES, 65536);
  assert.throws(
    () => sealExperienceRecord({ schemaVersion: "1.0", uncontrolledPadding: "x".repeat(70000) }),
    (error) => error.code === "EXPERIENCE_RECORD_SIZE_LIMIT"
  );
});

test("attestation hashing and serialization are deterministic", () => {
  const left = attestationBundle({ schemaVersion: "1.0", b: 2, a: 1 });
  const right = attestationBundle({ a: 1, schemaVersion: "1.0", b: 2 });
  assert.equal(stableObjectJson(left.experienceRecord), stableObjectJson(right.experienceRecord));
  assert.equal(left.experienceRecord.experienceRecordHash, right.experienceRecord.experienceRecordHash);
});
