import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  V5_PROVIDER_ANALYSIS_SCHEMA,
  V5_PRIOR_RECOVERY_COMMIT,
  V5_RECOVERY_COMMIT_SUBJECT,
  V5_SEALED_PACKAGE_COMMIT,
  assertV5RecoveryAuthorization,
  assertMechanicalRetryReason,
  assertRequestAuthority,
  buildCaseRequest,
  createV5PurposeNeutralExecutiveState,
  recoverCompletedCandidateTransition,
  recoveryDispatchLedgerIdentity,
  validateAppendOnlyMemoryTransition,
  validateRecoveredLessonEvidence
} from "../qualification/synthetic-executive/v5-qualification-route/execute-core.mjs";
import {
  CASE_IDS,
  EXECUTION_LIMITS,
  PACKAGE_IDENTITIES,
  ROUTE_VERSION,
  inspectPackageIdentities,
  seal,
  sha256Json
} from "../qualification/synthetic-executive/v5-qualification-route/shared.mjs";
import { materializeV5ProviderVisibleCase } from "../qualification/synthetic-executive/v5-held-out-corpus/scripts/v5-visible-assembler.mjs";
import { absoluteFromCorpus, readJson } from "../qualification/synthetic-executive/v5-held-out-corpus/scripts/v5-package-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function runtimeVisibleCase(caseId) {
  const assembled = await materializeV5ProviderVisibleCase(caseId);
  const manifest = await readJson(absoluteFromCorpus("public", "cases", caseId, "manifest.json"));
  const byIdentity = new Map(assembled.materialization.artifacts.map((item) => [item.artifactId, item]));
  return {
    caseId,
    order: manifest.order,
    authorizedCapabilities: manifest.authorizedCapabilities,
    knowledgeCutoffIdentity: manifest.knowledgeCutoffIdentity,
    visibleAggregate: manifest.visibleAggregate,
    manifestSha256: "offline-projection-test",
    visibleArtifacts: manifest.visibleInventory.map((item) => ({
      artifactId: item.artifactId,
      relativePath: item.relativePath,
      sha256: item.sha256,
      bytes: item.bytes,
      content: JSON.parse(byIdentity.get(item.artifactId).contentUtf8)
    }))
  };
}

test("V5 sealed request envelope is public-only and bounded", async () => {
  assert.equal(ROUTE_VERSION, "1.12.45");
  assert.deepEqual(CASE_IDS, Array.from({ length: 14 }, (_, index) => `KE-V5-C${String(index + 1).padStart(2, "0")}`));
  assert.deepEqual(Object.fromEntries(Object.entries(await inspectPackageIdentities()).filter(([key]) => key in PACKAGE_IDENTITIES)), PACKAGE_IDENTITIES);
  assert.equal(EXECUTION_LIMITS.model, "gpt-5.6-sol");
  assert.equal(EXECUTION_LIMITS.reasoningEffort, "medium");
  assert.equal(EXECUTION_LIMITS.store, false);
  assert.equal(EXECUTION_LIMITS.caseSlots, 14);
  assert.equal(EXECUTION_LIMITS.maximumOutputTokensPerCase, 4_000);
  assert.equal(EXECUTION_LIMITS.totalCostCeilingUsd, 12);
  assert.equal(V5_PROVIDER_ANALYSIS_SCHEMA.properties.rationale.maxLength, 512);

  for (const caseId of CASE_IDS) {
    const request = await buildCaseRequest(caseId);
    const envelope = JSON.parse(request.serializedRequest);
    assert.equal(envelope.model, "gpt-5.6-sol");
    assert.equal(envelope.store, false);
    assert.equal(envelope.max_output_tokens, 4_000);
    assert.ok(request.requestBytes < 64_000);
    const serialized = request.serializedRequest;
    for (const forbidden of ["expectedResponse", "safetyCritical", "minimumPassingChecks", "FOUNDATIONAL_SOURCE", "HELD_OUT_ANALOGUE", "GENUINELY_NOVEL_OR_INSUFFICIENT"]) {
      assert.equal(serialized.includes(forbidden), false);
    }
  }
});

test("V5 public state projection derives evidence, authority, cycle, and duplicate boundaries", async () => {
  const states = {};
  for (const caseId of ["KE-V5-C04", "KE-V5-C05", "KE-V5-C06", "KE-V5-C13"]) {
    states[caseId] = createV5PurposeNeutralExecutiveState(await runtimeVisibleCase(caseId));
  }
  assert.equal(states["KE-V5-C04"].evidenceCondition, "INSUFFICIENT");
  assert.equal(states["KE-V5-C05"].cycleDetected, true);
  assert.equal(states["KE-V5-C06"].duplicateDetected, true);
  assert.equal(states["KE-V5-C13"].authorityClass, "NEW_REQUIRED");
});

test("V5 route fails closed on budget and retry expansion", () => {
  assert.throws(() => assertRequestAuthority({ requestBytes: 64_001, outputTokens: 4_000, reservationUsd: 1, priorReservedUsd: 0 }), /REQUEST_BYTE_CEILING_EXCEEDED/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_001, reservationUsd: 1, priorReservedUsd: 0 }), /OUTPUT_TOKEN_CEILING_EXCEEDED/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_000, reservationUsd: 1, priorReservedUsd: 11.1 }), /TOTAL_COST_CEILING_EXCEEDED/);
  assert.equal(assertMechanicalRetryReason("PROVIDER_TIMEOUT"), true);
  assert.throws(() => assertMechanicalRetryReason("RESPONSE_QUALITY"), /UNAUTHORIZED_OR_QUALITY_BASED_RETRY/);
});

function memoryRecord(memoryId, sourceEpisodeSequence, mentorDecisionIdentity = "mentor-02", evidenceReferences = []) {
  return Object.freeze({
    memoryId,
    contentHash: `${memoryId}-hash`,
    evidenceReferences,
    evidenceAggregateHash: sha256Json(evidenceReferences),
    sourceEpisodeSequence,
    mentorDecisionIdentity,
    runIdentity: "run-identity"
  });
}

test("V5 append-only validation is identity- and sequence-based, not filename-prefix-based", () => {
  const prior = memoryRecord("ke-learning-candidate-z-prior", 11);
  const appended = memoryRecord("ke-learning-candidate-a-new", 21);
  const context = {
    memoryBeforeIds: [prior.memoryId],
    executiveMemoryContext: { records: [prior] },
    beforeLearningStatus: { lastEpisodeSequence: 11 },
    learningEpisodeSequence: 20,
    mentorDecisionIdentity: "mentor-02"
  };
  const prepared = { runIdentity: { runIdentityHash: "run-identity" } };
  const valid = validateAppendOnlyMemoryTransition({
    context,
    afterRecords: [appended, prior],
    prepared,
    expectedAppendedMemoryIds: [appended.memoryId]
  });
  assert.deepEqual(valid.afterIds, [prior.memoryId, appended.memoryId]);
  assert.throws(() => validateAppendOnlyMemoryTransition({ context, afterRecords: [appended], prepared, expectedAppendedMemoryIds: [appended.memoryId] }), /V5_MEMORY_RECORD_DELETED/);
  assert.throws(() => validateAppendOnlyMemoryTransition({ context, afterRecords: [appended, { ...prior, contentHash: "changed" }], prepared, expectedAppendedMemoryIds: [appended.memoryId] }), /V5_MEMORY_RECORD_MUTATED_OR_REPLACED/);
  assert.throws(() => validateAppendOnlyMemoryTransition({ context, afterRecords: [memoryRecord("unauthorized", 21), appended, prior], prepared, expectedAppendedMemoryIds: [appended.memoryId] }), /V5_UNAUTHORIZED_MEMORY_INSERTION_OR_MISSING_APPEND/);
  assert.throws(() => validateAppendOnlyMemoryTransition({ context, afterRecords: [prior, prior], prepared, expectedAppendedMemoryIds: [] }), /V5_DUPLICATE_MEMORY_IDENTITY/);
  assert.throws(() => validateAppendOnlyMemoryTransition({ context, afterRecords: [prior], prepared, expectedAppendedMemoryIds: [prior.memoryId] }), /V5_MEMORY_IDENTITY_REPLAY/);
  assert.throws(() => validateAppendOnlyMemoryTransition({ context, afterRecords: [memoryRecord("late-name-old-sequence", 10), prior], prepared, expectedAppendedMemoryIds: ["late-name-old-sequence"] }), /V5_MEMORY_APPEND_NOT_FORWARD_ONLY/);
});

test("V5 recovery recognizes one completed governed candidate transition without replay", () => {
  const context = {
    caseId: "KE-V5-C02",
    runIdentityHash: "run-identity",
    learningEpisodeSequence: 20,
    visibleEvidenceIds: ["visible-01", "visible-02", "visible-03", "visible-04-unused"],
    mentorDecisionIdentity: "mentor-02",
    beforeLearningStatus: {
      applications: 0, candidates: 1, failures: 1, qualifications: 0,
      promotedLessons: 0, retainedLessons: 0, rolledBackLessons: 0
    }
  };
  const events = [
    { sequence: 4, event_type: "FAILURE_RECORDED", learning_scope_identity: "run-identity", payload: { episode_id: "KE-V5-C02", episode_sequence: 21, failure_category: "CATEGORY", cognitive_episode_hash: "visible-01", evidence_references: ["visible-01", "visible-02", "visible-03"], failure_id: "failure-02" } },
    { sequence: 5, event_type: "MENTOR_DIAGNOSIS_RECORDED", learning_scope_identity: "run-identity", payload: { failure_id: "failure-02", diagnosis_id: "diagnosis-02", mentor_decision_identity: "mentor-02" } },
    { sequence: 6, event_type: "LESSON_CANDIDATE_RECORDED", learning_scope_identity: "run-identity", payload: { failure_id: "failure-02", diagnosis_id: "diagnosis-02", candidate_id: "candidate-02", memory_id: "memory-02", memory_hash: "memory-02-hash" } }
  ];
  const candidate = recoverCompletedCandidateTransition({
    events,
    afterRecords: [memoryRecord("memory-02", 21, "mentor-02", ["visible-01", "visible-02", "visible-03"])],
    context,
    learningStatus: {
      applications: 0, candidates: 2, failures: 2, qualifications: 0,
      promotedLessons: 0, retainedLessons: 0, rolledBackLessons: 0, lastEpisodeSequence: 21
    },
    learningCategory: "CATEGORY"
  });
  assert.deepEqual(candidate, {
    result: "LESSON_CANDIDATE_RECORDED",
    failureId: "failure-02",
    diagnosisId: "diagnosis-02",
    candidateId: "candidate-02",
    memoryId: "memory-02",
    promotionAuthorized: false
  });
  assert.throws(() => recoverCompletedCandidateTransition({
    events: [...events, events[2]],
    afterRecords: [memoryRecord("memory-02", 21, "mentor-02", ["visible-01", "visible-02", "visible-03"])],
    context,
    learningStatus: { applications: 0, candidates: 2, failures: 2, qualifications: 0, promotedLessons: 0, retainedLessons: 0, rolledBackLessons: 0, lastEpisodeSequence: 21 },
    learningCategory: "CATEGORY"
  }), /V5_RECOVERY_CANDIDATE_EVENT_NOT_EXACT/);
});

test("V5 recovered lesson evidence is the exact committed nonempty authorized subset", () => {
  const context = { visibleEvidenceIds: ["visible-01", "visible-02", "visible-03", "visible-04-unused"] };
  const references = ["visible-01", "visible-02", "visible-03"];
  const failureEvent = { payload: { cognitive_episode_hash: "visible-01", evidence_references: references } };
  const candidateEvent = { payload: { memory_hash: "memory-hash" } };
  const memoryRecord = { contentHash: "memory-hash", evidenceReferences: references, evidenceAggregateHash: sha256Json(references) };
  const valid = validateRecoveredLessonEvidence({ context, failureEvent, candidateEvent, memoryRecord });
  assert.deepEqual(valid.committedEvidenceReferences, references);
  assert.deepEqual(valid.unusedAuthorizedVisibleIds, ["visible-04-unused"]);

  const attempt = ({ visible = context.visibleEvidenceIds, event = references, memory = event, aggregate = sha256Json(memory), contentHash = "memory-hash", candidateHash = contentHash } = {}) => (
    validateRecoveredLessonEvidence({
      context: { visibleEvidenceIds: visible },
      failureEvent: { payload: { cognitive_episode_hash: visible[0], evidence_references: event } },
      candidateEvent: { payload: { memory_hash: candidateHash } },
      memoryRecord: { contentHash, evidenceReferences: memory, evidenceAggregateHash: aggregate }
    })
  );
  assert.throws(() => attempt({ event: [] }), /V5_RECOVERY_LESSON_EVIDENCE_EMPTY/);
  assert.throws(() => attempt({ event: ["visible-01", "unknown-reference", "visible-03"] }), /V5_RECOVERY_LESSON_EVIDENCE_NOT_AUTHORIZED_VISIBLE/);
  assert.throws(() => attempt({ visible: ["visible-01", "private:hidden-control", "visible-03", "visible-04-unused"], event: ["visible-01", "private:hidden-control", "visible-03"] }), /V5_RECOVERY_PRIVATE_OR_SYNTHETIC_EVIDENCE_FORBIDDEN/);
  assert.throws(() => attempt({ visible: ["visible-01", "a".repeat(64), "visible-03", "visible-04-unused"], event: ["visible-01", "a".repeat(64), "visible-03"] }), /V5_RECOVERY_RUNTIME_HASH_EVIDENCE_FORBIDDEN/);
  assert.throws(() => attempt({ event: ["visible-01", "visible-01", "visible-03"] }), /V5_RECOVERY_LESSON_EVIDENCE_DUPLICATED/);
  assert.throws(() => attempt({ event: ["visible-01", "visible-02", "visible-04-unused"], memory: ["visible-01", "visible-02", "visible-04-unused"] }), /V5_RECOVERY_LESSON_INPUT_COMMITMENT_MISMATCH/);
  assert.throws(() => attempt({ event: references, memory: ["visible-01", "visible-02", "visible-04-unused"] }), /V5_RECOVERY_LESSON_MEMORY_COMMITMENT_MISMATCH/);
  assert.throws(() => attempt({ aggregate: "mutated-aggregate" }), /V5_RECOVERY_LESSON_EVIDENCE_AGGREGATE_MUTATED/);
  assert.throws(() => attempt({ candidateHash: "substituted-memory-hash" }), /V5_RECOVERY_CANDIDATE_MEMORY_CHANGED/);
});

test("V5 recovery authority binds the original dispatch ledger and forbids consumed-case replacement", () => {
  const originalLedger = [
    { ledgerEntryHash: "a".repeat(64), kind: "DISPATCH_INTENT_PERSISTED", caseId: "KE-V5-C01", attempt: 1, requestHash: "request-01", dispatchIntentHash: "intent-01" },
    { ledgerEntryHash: "b".repeat(64), kind: "PROVIDER_RESPONSE_CAPTURED", caseId: "KE-V5-C01", attempt: 1 },
    { ledgerEntryHash: "c".repeat(64), kind: "DISPATCH_INTENT_PERSISTED", caseId: "KE-V5-C02", attempt: 1, requestHash: "request-02", dispatchIntentHash: "intent-02" },
    { ledgerEntryHash: "d".repeat(64), kind: "PROVIDER_RESPONSE_CAPTURED", caseId: "KE-V5-C02", attempt: 1 }
  ];
  const prepared = {
    runIdentity: { runIdentityHash: "run-identity", runId: "run-id", repositoryCommit: V5_SEALED_PACKAGE_COMMIT },
    authorization: { authorizationHash: "authority-hash" },
    authorizationReceipt: { authorizationReceiptHash: "receipt-hash" }
  };
  const repositoryIdentity = { head: "correction-commit", parent: V5_PRIOR_RECOVERY_COMMIT, subject: V5_RECOVERY_COMMIT_SUBJECT };
  const c01Terminal = { terminalHash: "terminal-01", captureHash: "capture-01", responseHash: "response-01", runtimeEvidenceHash: "runtime-01" };
  const c02Capture = { captureHash: "capture-02", responseHash: "response-02", providerResponseId: "provider-02", requestHash: "request-02" };
  const authority = seal({
    schemaVersion: "1.0",
    authorityType: "EXTERNAL_APPEND_ONLY_V5_RECOVERY_AUTHORIZATION",
    authorizationStatus: "AUTHORIZED",
    singleRecovery: true,
    resultsRoot: "X:/external/results",
    originalRunIdentityHash: "run-identity",
    originalRunId: "run-id",
    originalPackageCommit: V5_SEALED_PACKAGE_COMMIT,
    priorCorrectionCommit: V5_PRIOR_RECOVERY_COMMIT,
    priorRouteVersion: "1.12.44",
    correctionRouteVersion: "1.12.45",
    correctionCommit: "correction-commit",
    packageIdentities: PACKAGE_IDENTITIES,
    originalBudgetIdentity: PACKAGE_IDENTITIES.executionBudgetSha256,
    originalAuthority: { authorizationHash: "authority-hash", authorizationReceiptHash: "receipt-hash" },
    originalDispatchLedger: recoveryDispatchLedgerIdentity(originalLedger),
    consumedCaseIds: ["KE-V5-C01", "KE-V5-C02"],
    unattemptedInitialCaseIds: CASE_IDS.slice(2),
    unattemptedInitialCaseSlots: 12,
    zeroReplacementAuthorityForConsumedCases: true,
    redispatchConsumedCasesPermitted: false,
    evaluatorAccessBeforeAllTerminalSealsPermitted: false,
    c01TerminalIdentity: { terminalHash: "terminal-01", captureHash: "capture-01", responseHash: "response-01", runtimeEvidenceHash: "runtime-01" },
    c02ImmutableResponseIdentity: { captureHash: "capture-02", responseHash: "response-02", providerResponseId: "provider-02", requestHash: "request-02" }
  }, "recoveryAuthorizationHash");
  assert.equal(assertV5RecoveryAuthorization(authority, {
    resultsRoot: "X:/external/results", prepared, repositoryIdentity, originalLedger, c01Terminal, c02Capture
  }), authority);
  const replacement = seal({ ...Object.fromEntries(Object.entries(authority).filter(([key]) => key !== "recoveryAuthorizationHash")), zeroReplacementAuthorityForConsumedCases: false }, "recoveryAuthorizationHash");
  assert.throws(() => assertV5RecoveryAuthorization(replacement, {
    resultsRoot: "X:/external/results", prepared, repositoryIdentity, originalLedger, c01Terminal, c02Capture
  }), /V5_RECOVERY_REPLACEMENT_AUTHORITY_FORBIDDEN/);
});

test("V5 execution cannot import evaluator controls or grant provider lifecycle authority", async () => {
  const execution = await readFile(path.join(root, "qualification", "synthetic-executive", "v5-qualification-route", "execute-core.mjs"), "utf8");
  const preparation = await readFile(path.join(root, "qualification", "synthetic-executive", "v5-qualification-route", "prepare-core.mjs"), "utf8");
  assert.doesNotMatch(execution, /evaluator\/control\.json|scoring\/evidence\.json|cohort-transfer-map/);
  assert.doesNotMatch(preparation, /evaluator\/control\.json|scoring\/evidence\.json|cohort-transfer-map/);
  assert.match(execution, /new GovernedLearningAdapter/);
  assert.match(execution, /learningMode:\s*"PRODUCT"/);
  assert.match(execution, /providerLifecycleAuthority:\s*false/);
  assert.doesNotMatch(execution, /providerAnalysis[^\n]*(qualifyCandidate|promoteCandidate|recordApplication)/);
});
