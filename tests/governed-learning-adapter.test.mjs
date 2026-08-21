import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  buildCognitiveEpisode,
  buildLessonCandidate,
  createCognitiveGovernor,
  recordCognitiveActionOutcome,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import {
  GOVERNED_LEARNING_ADAPTER_IDENTITY,
  GovernedLearningAdapter,
  GovernedLearningError
} from "../lib/cognitive-learning/adapter.js";

const fixedTime = "2026-08-21T16:00:00.000Z";
const evidenceAlpha = "visible-learning-evidence-alpha";
const evidenceBeta = "visible-learning-evidence-beta";

function objectMind(evidenceIds = []) {
  return {
    objectStateId: "governed-learning-object",
    identityStateHash: "a".repeat(64),
    requestIdentity: {
      inputImageIds: [],
      inputDescriptionProvenance: { sha256: "b".repeat(64) }
    },
    observedFacts: [{
      observationId: "learning-observation",
      factType: "governed_learning_fixture",
      value: "A bounded evidence failure is visible.",
      normalizedValue: "a bounded evidence failure is visible",
      certaintyBand: "HIGH",
      origin: "DIRECTLY_VISIBLE"
    }],
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: "learning-candidate",
      exactCandidateLabel: "Governed learning fixture",
      broaderFamilyIdentity: "governed learning evidence",
      exactnessLevel: "EXACT",
      confidenceBand: "HIGH",
      supportingObservationIds: ["learning-observation"],
      contradictingObservations: [],
      unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: "learning-candidate",
      stableIdentityKey: "governed-learning",
      exactnessClassification: "EXACT_IDENTITY",
      bestSupportedCustomerIdentity: "Governed learning fixture",
      broaderFallbackIdentity: "governed learning evidence",
      limitations: [],
      additionalEvidenceNeeded: []
    },
    searchPlan: [],
    candidateEvidence: evidenceIds.map((identity) => ({
      evidenceId: identity,
      sourceRecordId: identity,
      exactnessClassification: "COMPATIBLE",
      verificationState: "VERIFIED",
      sourceEvidenceText: `Visible evidence for ${identity}`
    }))
  };
}

function snapshot(evaluationId, {
  insufficient = false,
  memoryMarker = "",
  visibleEvidenceIds = [evidenceAlpha, evidenceBeta]
} = {}) {
  const mind = objectMind(visibleEvidenceIds);
  return {
    evaluationId,
    objectMindState: mind,
    evidenceRecords: mind.candidateEvidence,
    providerRequests: [],
    initialPlan: [],
    refinementPlan: [],
    directPageCandidates: [],
    providerBudget: { maximum: 0, consumed: 0 },
    directPageBudget: { maximum: 0, consumed: 0 },
    executiveState: {
      missionObjective: "Choose one bounded governed action.",
      finishLine: "A decision is tied to visible evidence.",
      earliestCausalBoundary: memoryMarker || "VISIBLE_LEARNING_BOUNDARY",
      visibleEvidenceIds,
      requiredEvidenceIds: visibleEvidenceIds,
      evidenceCondition: insufficient ? "INSUFFICIENT" : "SUPPORTED",
      failureCondition: insufficient ? "Insufficient verified evidence" : "Bounded visible failure",
      failureScope: insufficient ? "INSUFFICIENT_EVIDENCE" : "BOUNDED",
      uncertaintyClass: insufficient ? "INSUFFICIENT_EVIDENCE" : "NONE",
      authorityClass: "EXISTING",
      permittedOperations: ["RETURNED_EVIDENCE_EVALUATION"],
      prohibitedOperations: ["FABRICATE_EVIDENCE"],
      safeContinuation: !insufficient,
      newMechanismRequired: false,
      contradictionPresent: false,
      cycleDetected: false,
      duplicateDetected: false,
      dossierStage: insufficient ? "NOT_APPLICABLE" : "RETURNED",
      stoppingState: insufficient ? "INSUFFICIENT_EVIDENCE" : "ACTIVE"
    }
  };
}

function runtimeFor(evaluationId, { memory = {}, insufficient = false, memoryMarker = "" } = {}) {
  const governor = createCognitiveGovernor({ evaluationId });
  const input = snapshot(evaluationId, { insufficient, memoryMarker });
  const runtime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: input,
    executiveMemoryContext: {
      runIdentity: "learning-test-scope",
      currentEpisodeId: evaluationId,
      records: [],
      selectedMemoryIds: [],
      retrievalReceiptHash: "",
      startsEmpty: true,
      forwardOnly: true,
      ...memory
    }
  });
  return { governor, input, runtime };
}

async function recordInitialFailure(adapter) {
  const { governor, input, runtime } = runtimeFor("failure-episode", { insufficient: true });
  recordCognitiveActionOutcome(governor, runtime.decision, input, {
    outcomeCode: "INSUFFICIENT_EVIDENCE_CONFIRMED",
    terminalStatus: "INSUFFICIENT_EVIDENCE"
  });
  const cognitiveEpisode = buildCognitiveEpisode(governor, {
    experienceRecordHash: "c".repeat(64)
  });
  const lessonCandidate = buildLessonCandidate(cognitiveEpisode);
  assert(lessonCandidate);
  const visibleEvidenceIds = [
    evidenceAlpha,
    evidenceBeta,
    ...(runtime.mentorDecision.evidenceReferences || []),
    cognitiveEpisode.cognitiveEpisodeHash,
    cognitiveEpisode.linkedExperienceRecordHash,
    lessonCandidate.lessonCandidateHash
  ];
  const result = await adapter.captureProductFailure({
    governor,
    runtime,
    episodeId: "failure-episode",
    episodeSequence: 1,
    cognitiveEpisode,
    lessonCandidate,
    visibleEvidenceIds,
    createdAt: fixedTime
  });
  return { ...result, visibleEvidenceIds };
}

function passingTrials() {
  return [
    {
      caseId: "trial-one",
      beforeScore: 0.35,
      afterScore: 0.75,
      beforeViolations: 1,
      afterViolations: 0,
      evidenceRefs: ["trial-evidence-one"]
    },
    {
      caseId: "trial-two",
      beforeScore: 0.4,
      afterScore: 0.72,
      beforeViolations: 0,
      afterViolations: 0,
      evidenceRefs: ["trial-evidence-two"]
    },
    {
      caseId: "trial-three",
      beforeScore: 0.5,
      afterScore: 0.8,
      beforeViolations: 0,
      afterViolations: 0,
      evidenceRefs: ["trial-evidence-three"]
    }
  ];
}

test("complete governed lifecycle qualifies, promotes, applies, retains, rolls back, and persists", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-governed-learning-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "learning-test-scope" });
  try {
    await adapter.initialize();
    const candidate = await recordInitialFailure(adapter);
    assert.equal(candidate.promotionAuthorized, false);

    const candidateRecords = await adapter.memoryStore.list();
    const candidateRecord = candidateRecords.find((record) => record.memoryId === candidate.memoryId);
    assert.equal(candidateRecord.status, "CANDIDATE");

    const productContext = {
      runIdentity: "learning-test-scope",
      currentEpisodeId: "prequalification-product",
      records: candidateRecords,
      selectedMemoryIds: [candidate.memoryId],
      retrievalReceiptHash: "d".repeat(64),
      startsEmpty: true,
      forwardOnly: true,
      learningMode: "PRODUCT"
    };
    const prequalification = runtimeFor("prequalification-product", { memory: productContext });
    assert.deepEqual(prequalification.runtime.governedLearning.appliedLessonIds, []);
    assert.deepEqual(prequalification.runtime.governedLearning.trialCandidateIds, []);

    const qualificationAuthority = runtimeFor("qualification-episode");
    const trials = passingTrials();
    const trialEvidence = trials.flatMap((trial) => trial.evidenceRefs);
    const qualification = await adapter.qualifyCandidate({
      governor: qualificationAuthority.governor,
      runtime: qualificationAuthority.runtime,
      candidateId: candidate.candidateId,
      trials,
      minimumMeanImprovement: 0.2,
      minimumApplicationImprovement: 0.1,
      visibleEvidenceIds: trialEvidence,
      episodeSequence: 2
    });
    assert.equal(qualification.verdict, "PASS");
    assert.equal(qualification.mean_improvement, 0.34);

    await assert.rejects(
      adapter.promoteQualifiedLesson({
        governor: qualificationAuthority.governor,
        runtime: structuredClone(qualificationAuthority.runtime),
        qualificationId: qualification.qualificationId,
        episodeId: "promotion-episode",
        episodeSequence: 3,
        createdAt: fixedTime
      }),
      (error) => error instanceof GovernedLearningError && error.code === "GOVERNOR_LEARNING_AUTHORITY_REQUIRED"
    );

    const promotionAuthority = runtimeFor("promotion-episode");
    const promotion = await adapter.promoteQualifiedLesson({
      governor: promotionAuthority.governor,
      runtime: promotionAuthority.runtime,
      qualificationId: qualification.qualificationId,
      episodeId: "promotion-episode",
      episodeSequence: 3,
      createdAt: fixedTime
    });
    assert.equal(promotion.result, "LESSON_PROMOTED");

    const restarted = new GovernedLearningAdapter({ root, learningScopeIdentity: "learning-test-scope" });
    assert.equal((await restarted.status()).promotedLessons, 1);
    assert.equal((await restarted.verify()).result, "VALID");

    const laterContext = await restarted.prepareEpisode({
      governor: createCognitiveGovernor({ evaluationId: "later-materially-different" }),
      episodeId: "later-materially-different",
      episodeSequence: 4,
      queryFacets: {
        pattern: [candidateRecord.observedFailurePattern],
        failureClass: [candidateRecord.observedFailurePattern]
      },
      queryText: `${candidateRecord.observedFailurePattern} materially different later episode`,
      createdAt: fixedTime
    });
    assert.deepEqual(laterContext.selectedMemoryIds, [promotion.lessonId]);
    const later = runtimeFor("later-materially-different", {
      memory: laterContext,
      memoryMarker: "MATERIALLY_DIFFERENT_LATER_BOUNDARY"
    });
    assert.deepEqual(later.runtime.governedLearning.appliedLessonIds, [promotion.lessonId]);
    assert.equal(later.runtime.governedLearning.providerLifecycleAuthority, false);

    const retained = await restarted.recordApplication({
      governor: later.governor,
      runtime: later.runtime,
      lessonId: promotion.lessonId,
      caseId: "later-success",
      episodeId: "later-materially-different",
      episodeSequence: 4,
      beforeScore: 0.5,
      afterScore: 0.78,
      beforeViolations: 0,
      afterViolations: 0,
      evidenceRefs: ["later-success-evidence"],
      visibleEvidenceIds: ["later-success-evidence"],
      createdAt: fixedTime
    });
    assert.equal(retained.result, "LESSON_RETAINED");
    assert.equal(retained.improvement, 0.28);

    const harmfulGovernor = createCognitiveGovernor({ evaluationId: "harmful-episode" });
    const harmfulContext = await restarted.prepareEpisode({
      governor: harmfulGovernor,
      episodeId: "harmful-episode",
      episodeSequence: 5,
      queryFacets: { pattern: [candidateRecord.observedFailurePattern] },
      queryText: candidateRecord.observedFailurePattern,
      createdAt: fixedTime
    });
    const harmfulRuntime = runCanonicalCognitiveRuntime({
      governor: harmfulGovernor,
      snapshot: snapshot("harmful-episode", { memoryMarker: "HARMFUL_LATER_BOUNDARY" }),
      executiveMemoryContext: harmfulContext
    });
    const rolledBack = await restarted.recordApplication({
      governor: harmfulGovernor,
      runtime: harmfulRuntime,
      lessonId: promotion.lessonId,
      caseId: "later-regression",
      episodeId: "harmful-episode",
      episodeSequence: 5,
      beforeScore: 0.7,
      afterScore: 0.55,
      beforeViolations: 0,
      afterViolations: 1,
      evidenceRefs: ["later-regression-evidence"],
      visibleEvidenceIds: ["later-regression-evidence"],
      createdAt: fixedTime
    });
    assert.equal(rolledBack.result, "LESSON_ROLLED_BACK");
    assert.equal(rolledBack.verdict, "REGRESSION");
    assert.equal((await restarted.status()).rolledBackLessons, 1);

    const postRollbackGovernor = createCognitiveGovernor({ evaluationId: "post-rollback" });
    const postRollback = await restarted.prepareEpisode({
      governor: postRollbackGovernor,
      episodeId: "post-rollback",
      episodeSequence: 6,
      queryFacets: { pattern: [candidateRecord.observedFailurePattern] },
      queryText: candidateRecord.observedFailurePattern,
      createdAt: fixedTime
    });
    assert.deepEqual(postRollback.selectedMemoryIds, []);
    const postRollbackRuntime = runCanonicalCognitiveRuntime({
      governor: postRollbackGovernor,
      snapshot: snapshot("post-rollback"),
      executiveMemoryContext: postRollback
    });
    await assert.rejects(
      restarted.recordApplication({
        governor: postRollbackGovernor,
        runtime: postRollbackRuntime,
        lessonId: promotion.lessonId,
        caseId: "forbidden-reapplication",
        episodeId: "post-rollback",
        episodeSequence: 6,
        beforeScore: 0.5,
        afterScore: 0.9,
        beforeViolations: 0,
        afterViolations: 0,
        evidenceRefs: ["forbidden-reapplication-evidence"],
        visibleEvidenceIds: ["forbidden-reapplication-evidence"],
        createdAt: fixedTime
      }),
      (error) => error instanceof GovernedLearningError && error.code === "LESSON_NOT_APPLICABLE"
    );

    const novel = await restarted.prepareEpisode({
      governor: createCognitiveGovernor({ evaluationId: "novel-episode" }),
      episodeId: "novel-episode",
      episodeSequence: 6,
      queryFacets: { pattern: ["unrelated novel condition"] },
      queryText: "unrelated novel condition",
      createdAt: fixedTime
    });
    assert.deepEqual(novel.selectedMemoryIds, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("failed trials cannot promote and workspaces remain isolated", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-governed-learning-fail-"));
  const isolatedRoot = await mkdtemp(path.join(os.tmpdir(), "ke-governed-learning-isolated-"));
  try {
    const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "scope-one" });
    const isolated = new GovernedLearningAdapter({ root: isolatedRoot, learningScopeIdentity: "scope-two" });
    const candidate = await recordInitialFailure(new GovernedLearningAdapter({
      root,
      learningScopeIdentity: "learning-test-scope"
    }));
    const authority = runtimeFor("failed-qualification");
    const trials = passingTrials();
    trials[1] = { ...trials[1], afterScore: 0.2 };
    const qualification = await new GovernedLearningAdapter({
      root,
      learningScopeIdentity: "learning-test-scope"
    }).qualifyCandidate({
      governor: authority.governor,
      runtime: authority.runtime,
      candidateId: candidate.candidateId,
      trials,
      minimumMeanImprovement: 0.2,
      minimumApplicationImprovement: 0.1,
      visibleEvidenceIds: trials.flatMap((trial) => trial.evidenceRefs),
      episodeSequence: 2
    });
    assert.equal(qualification.verdict, "FAIL");
    const promotionAuthority = runtimeFor("failed-promotion");
    await assert.rejects(
      new GovernedLearningAdapter({
        root,
        learningScopeIdentity: "learning-test-scope"
      }).promoteQualifiedLesson({
        governor: promotionAuthority.governor,
        runtime: promotionAuthority.runtime,
        qualificationId: qualification.qualificationId,
        episodeId: "failed-promotion",
        episodeSequence: 3,
        createdAt: fixedTime
      }),
      (error) => error instanceof GovernedLearningError && error.code === "QUALIFICATION_NOT_PASSING"
    );
    await isolated.initialize();
    assert.equal((await isolated.status()).candidates, 0);
    await assert.rejects(
      adapter.initialize(),
      (error) => error instanceof GovernedLearningError && error.code === "LEARNING_WORKSPACE_BINDING_MISMATCH"
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(isolatedRoot, { recursive: true, force: true });
  }
});

test("append-only ledger detects byte tampering and imports no provider/network authority", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-governed-learning-tamper-"));
  try {
    const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "learning-test-scope" });
    await recordInitialFailure(adapter);
    const source = await readFile(adapter.paths.ledger, "utf8");
    await writeFile(adapter.paths.ledger, source.replace("FAILURE_RECORDED", "FAILURE_MUTATED"), "utf8");
    await assert.rejects(
      adapter.verify(),
      (error) => error instanceof GovernedLearningError
        && ["LEARNING_LEDGER_TAMPERED", "LEARNING_EVENT_TYPE_UNKNOWN"].includes(error.code)
    );
    const adapterSource = await readFile(new URL("../lib/cognitive-learning/adapter.js", import.meta.url), "utf8");
    assert.doesNotMatch(adapterSource, /node:(?:http|https|net|tls|child_process)|\bfetch\s*\(/);
    assert.match(adapterSource, new RegExp(GOVERNED_LEARNING_ADAPTER_IDENTITY));
    assert.match(adapterSource, /async qualifyCandidate\([\s\S]*?assertRuntimeAuthority\(governor, runtime\)/);
    assert.match(adapterSource, /async promoteQualifiedLesson\([\s\S]*?assertRuntimeAuthority\(governor, runtime\)/);
    assert.match(adapterSource, /async recordApplication\([\s\S]*?assertRuntimeAuthority\(governor, runtime\)/);
    assert.match(adapterSource, /providerLifecycleAuthority:\s*false/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
