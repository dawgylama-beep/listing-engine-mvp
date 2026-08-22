import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createGenerateListingHandler } from "../api/generate-listing.js";
import {
  createCognitiveGovernor,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import {
  GOVERNED_LEARNING_ADAPTER_IDENTITY,
  GovernedLearningAdapter
} from "../lib/cognitive-learning/adapter.js";
import { retailRecoveryFixture } from "./fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const fixedTime = "2026-08-21T17:00:00.000Z";

function responseCapture() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

function responseForSchema(schemaName) {
  if (schemaName === "item_identity") {
    return {
      ...retailRecoveryFixture.identity,
      visualRecognition: retailRecoveryFixture.visualRecognition
    };
  }
  throw new Error(`Unexpected schema ${schemaName}`);
}

function authorityRuntime(evaluationId) {
  const governor = createCognitiveGovernor({ evaluationId });
  const evidenceId = `visible-authority-evidence-${evaluationId}`;
  const objectMindState = {
    objectStateId: `object-${evaluationId}`,
    identityStateHash: "a".repeat(64),
    requestIdentity: {
      inputImageIds: [],
      inputDescriptionProvenance: { sha256: "b".repeat(64) }
    },
    observedFacts: [{
      observationId: "authority-observation",
      factType: "visible_authority_evidence",
      value: "The governed transition evidence is visible.",
      normalizedValue: "the governed transition evidence is visible",
      certaintyBand: "HIGH",
      origin: "DIRECTLY_VISIBLE"
    }],
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: "authority-candidate",
      exactCandidateLabel: "Governed transition",
      broaderFamilyIdentity: "governed learning",
      exactnessLevel: "EXACT",
      confidenceBand: "HIGH",
      supportingObservationIds: ["authority-observation"],
      contradictingObservations: [],
      unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: "authority-candidate",
      stableIdentityKey: "governed-transition",
      exactnessClassification: "EXACT_IDENTITY",
      bestSupportedCustomerIdentity: "Governed transition",
      broaderFallbackIdentity: "governed learning",
      limitations: [],
      additionalEvidenceNeeded: []
    },
    searchPlan: [],
    candidateEvidence: [{
      evidenceId,
      sourceRecordId: evidenceId,
      exactnessClassification: "COMPATIBLE",
      verificationState: "VERIFIED",
      sourceEvidenceText: "Visible governed transition evidence."
    }]
  };
  const runtime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: {
      evaluationId,
      objectMindState,
      evidenceRecords: objectMindState.candidateEvidence,
      providerRequests: [],
      initialPlan: [],
      refinementPlan: [],
      directPageCandidates: [],
      providerBudget: { maximum: 0, consumed: 0 },
      directPageBudget: { maximum: 0, consumed: 0 },
      executiveState: {
        missionObjective: "Authorize one bounded governed learning transition.",
        finishLine: "The transition is tied to visible evidence.",
        earliestCausalBoundary: "GOVERNED_LEARNING_TRANSITION",
        visibleEvidenceIds: [evidenceId],
        requiredEvidenceIds: [evidenceId],
        evidenceCondition: "SUPPORTED",
        failureCondition: "Bounded learning transition",
        failureScope: "BOUNDED",
        uncertaintyClass: "NONE",
        authorityClass: "EXISTING",
        permittedOperations: ["RETURNED_EVIDENCE_EVALUATION"],
        prohibitedOperations: ["PROVIDER_LIFECYCLE_TRANSITION"],
        safeContinuation: true,
        newMechanismRequired: false,
        contradictionPresent: false,
        cycleDetected: false,
        duplicateDetected: false,
        dossierStage: "RETURNED",
        stoppingState: "ACTIVE"
      }
    },
    executiveMemoryContext: {
      runIdentity: "product-handler-learning-scope",
      currentEpisodeId: evaluationId,
      records: [],
      selectedMemoryIds: [],
      retrievalReceiptHash: "",
      startsEmpty: true,
      forwardOnly: true
    }
  });
  return { governor, runtime };
}

async function invokeProductHandler(adapter, analysisId) {
  let clock = Date.parse(fixedTime);
  const providerCalls = [];
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "offline-placeholder",
    getOpenAIModel: () => "offline-model",
    getSerperApiKey: () => "offline-placeholder",
    getGovernedLearningAdapter: () => adapter,
    nowMilliseconds: () => {
      clock += 5;
      return clock;
    },
    nowIso: () => new Date(clock).toISOString(),
    requestOpenAIJson: async ({ payload }) => {
      const schemaName = payload?.text?.format?.name;
      providerCalls.push(schemaName);
      if (schemaName !== "item_identity") {
        throw Object.assign(new Error("Offline purpose-judgment failure"), {
          code: "OFFLINE_PURPOSE_JUDGMENT_FAILURE"
        });
      }
      return { json: responseForSchema(schemaName), data: { output: [] } };
    },
    requestSerperSearch: async () => ({
      json: { organic: [], shopping: [], knowledgeGraph: null },
      statusCode: 200,
      elapsedMs: 1
    }),
    requestBoundedRetailProductPage: async () => ({
      attempted: false,
      statusCode: 0,
      contentType: "",
      body: "",
      error: "OFFLINE_TEST_NO_PAGE"
    })
  });
  const req = {
    method: "POST",
    body: {
      analysisId,
      reportType: "marketValue",
      platform: "",
      notes: "insufficient verified evidence for the exact item",
      photos: [{
        name: "offline-learning-fixture.jpg",
        dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x5a).toString("base64")}`
      }],
      buyerIntake: {
        ...retailRecoveryFixture.buyerIntake,
        purchase_intent: "owner_value",
        purchase_context: "owned_item"
      }
    }
  };
  const res = responseCapture();
  await handler(req, res);
  return { res, providerCalls };
}

test("POST /api/generate-listing reaches the shared governed adapter and exposes the authoritative transition", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-product-learning-"));
  const adapter = new GovernedLearningAdapter({
    root,
    learningScopeIdentity: "product-handler-learning-scope"
  });
  const networkGuard = installHardNetworkDenial();
  try {
    const first = await invokeProductHandler(adapter, "product-failure-episode");
    assert.equal(first.res.statusCode, 502);
    const firstLearning = first.res.payload.diagnostics.governedLearning;
    assert.equal(firstLearning.adapterIdentity, GOVERNED_LEARNING_ADAPTER_IDENTITY);
    assert.equal(
      firstLearning.lifecycleResult,
      "LESSON_CANDIDATE_RECORDED",
      JSON.stringify(first.res.payload.diagnostics)
    );
    assert.equal(firstLearning.promotionAuthorized, false);
    assert.deepEqual(firstLearning.selectedLessonIds, []);
    assert.equal((await adapter.status()).candidates, 1);

    const candidateId = firstLearning.candidateId;
    const trials = [
      {
        caseId: "product-trial-one",
        beforeScore: 0.3,
        afterScore: 0.7,
        beforeViolations: 1,
        afterViolations: 0,
        evidenceRefs: ["product-trial-evidence-one"]
      },
      {
        caseId: "product-trial-two",
        beforeScore: 0.4,
        afterScore: 0.75,
        beforeViolations: 0,
        afterViolations: 0,
        evidenceRefs: ["product-trial-evidence-two"]
      },
      {
        caseId: "product-trial-three",
        beforeScore: 0.45,
        afterScore: 0.8,
        beforeViolations: 0,
        afterViolations: 0,
        evidenceRefs: ["product-trial-evidence-three"]
      }
    ];
    const qualificationAuthority = authorityRuntime("product-qualification");
    const qualification = await adapter.qualifyCandidate({
      governor: qualificationAuthority.governor,
      runtime: qualificationAuthority.runtime,
      candidateId,
      trials,
      minimumMeanImprovement: 0.2,
      minimumApplicationImprovement: 0.1,
      visibleEvidenceIds: trials.flatMap((trial) => trial.evidenceRefs),
      episodeSequence: 2
    });
    assert.equal(qualification.verdict, "PASS");

    const promotionAuthority = authorityRuntime("product-promotion");
    const promotion = await adapter.promoteQualifiedLesson({
      governor: promotionAuthority.governor,
      runtime: promotionAuthority.runtime,
      qualificationId: qualification.qualificationId,
      episodeId: "product-promotion",
      episodeSequence: 3,
      createdAt: fixedTime
    });
    assert.equal(promotion.result, "LESSON_PROMOTED");

    const second = await invokeProductHandler(adapter, "materially-different-product-episode");
    assert.equal(second.res.statusCode, 502);
    const secondLearning = second.res.payload.diagnostics.governedLearning;
    assert.deepEqual(secondLearning.selectedLessonIds, [promotion.lessonId]);
    assert.deepEqual(secondLearning.appliedLessonIds, [promotion.lessonId]);
    assert.equal(secondLearning.memoryStatus, "RETRIEVED_APPLIED");
    assert.equal(secondLearning.nonReuseDecision, "AUTHORIZED_TRANSFER");
    assert.deepEqual(secondLearning.trialCandidateIds, []);
    assert.equal(secondLearning.providerLifecycleAuthority, false);
    assert.equal(first.providerCalls.length > 0, true);
    assert.equal(second.providerCalls.length > 0, true);
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});
