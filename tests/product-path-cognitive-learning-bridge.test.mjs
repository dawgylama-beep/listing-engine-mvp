import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { createGenerateListingHandler } from "../api/generate-listing.js";
import {
  COGNITIVE_ACTION,
  createCognitiveGovernor,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import { GovernedLearningAdapter } from "../lib/cognitive-learning/adapter.js";
import {
  buildEvidenceAcquisitionRequirement,
  reviewLessonCandidate
} from "../lib/lesson-gate.js";
import { sha256Object } from "../lib/object-intelligence/index.js";
import { retailRecoveryFixture } from "./fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const fixedTime = "2026-08-22T14:00:00.000Z";

function snapshot(evaluationId) {
  const evidenceId = `visible-product-evidence-${evaluationId}`;
  const objectMindState = {
    objectStateId: `object-${evaluationId}`,
    identityStateHash: "a".repeat(64),
    requestIdentity: {
      inputImageIds: [`image-${evaluationId}`],
      inputDescriptionProvenance: { sha256: "b".repeat(64) }
    },
    observedFacts: [{
      observationId: evidenceId,
      factType: "product_outcome",
      value: "One visible product outcome is bound to its evidence.",
      normalizedValue: "one visible product outcome is bound to its evidence",
      certaintyBand: "HIGH",
      origin: "DIRECTLY_VISIBLE"
    }],
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: `candidate-${evaluationId}`,
      exactCandidateLabel: "Bound product outcome",
      broaderFamilyIdentity: "product outcome",
      exactnessLevel: "EXACT",
      confidenceBand: "HIGH",
      supportingObservationIds: [evidenceId],
      contradictingObservations: [],
      unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: `candidate-${evaluationId}`,
      stableIdentityKey: `bound-outcome-${evaluationId}`,
      exactnessClassification: "EXACT_ITEM",
      bestSupportedCustomerIdentity: "Bound product outcome",
      broaderFallbackIdentity: "product outcome",
      limitations: [],
      additionalEvidenceNeeded: []
    },
    searchPlan: [],
    candidateEvidence: [{
      evidenceId,
      sourceRecordId: evidenceId,
      exactnessClassification: "COMPATIBLE",
      verificationState: "VERIFIED",
      sourceEvidenceText: "Visible product outcome evidence."
    }]
  };
  return {
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
      missionObjective: "Bind one completed product outcome.",
      finishLine: "The response and original evidence identities remain exact.",
      earliestCausalBoundary: "PRODUCT_OUTCOME_BINDING",
      visibleEvidenceIds: [evidenceId],
      requiredEvidenceIds: [evidenceId],
      evidenceCondition: "SUPPORTED",
      failureCondition: "Bounded product outcome",
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
  };
}

async function productRuntime(adapter, evaluationId, episodeSequence) {
  const governor = createCognitiveGovernor({ evaluationId });
  const memoryContext = await adapter.prepareEpisode({
    governor,
    episodeId: evaluationId,
    episodeSequence,
    queryFacets: { purpose: ["PRODUCT"] },
    queryText: "neutral product outcome",
    learningMode: "PRODUCT",
    createdAt: fixedTime
  });
  const runtime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: snapshot(evaluationId),
    executiveMemoryContext: memoryContext
  });
  return { governor, runtime, memoryContext };
}

async function recordOutcome(adapter, evaluationId, episodeSequence, seed) {
  const authority = await productRuntime(adapter, evaluationId, episodeSequence);
  const responseHash = seed.repeat(64);
  const originalEvidenceIdentity = String.fromCharCode(seed.charCodeAt(0) + 1).repeat(64);
  const cognitiveEpisodeHash = String.fromCharCode(seed.charCodeAt(0) + 2).repeat(64);
  await adapter.recordProductOutcome({
    governor: authority.governor,
    runtime: authority.runtime,
    episodeId: evaluationId,
    episodeSequence,
    responseHash,
    originalEvidenceIdentity,
    cognitiveEpisodeHash,
    submittedObjectFingerprint: `submitted-object-${evaluationId}`,
    memoryTransitionHash: authority.runtime.authoritativeMemoryTransition.memoryTransitionHash,
    createdAt: fixedTime
  });
  return { ...authority, responseHash, originalEvidenceIdentity, cognitiveEpisodeHash };
}

function responseCapture() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

async function invoke(handler, body) {
  const res = responseCapture();
  await handler({ method: "POST", body }, res);
  return res;
}

function feedbackCorrection(providerAuthored = false) {
  return {
    correctedState: "BALANCE_EXACT_CLOSE_AND_CATEGORY_COMPARABLES",
    evidenceProvenance: {
      authorityClass: "OWNER_VERIFIED_PRODUCT_OUTCOME",
      sourceType: "DIRECT_REVIEW_OF_PRODUCT_RESPONSE_AND_SOURCE_EVIDENCE",
      sourceIdentity: "e".repeat(64),
      providerAuthored
    }
  };
}

function lessonGateBinding(feedback) {
  return {
    candidateId: feedback.candidateId,
    failureId: feedback.failureId,
    diagnosisId: feedback.diagnosisId,
    memoryId: feedback.memoryId,
    memoryContentHash: feedback.inertStrategyCandidate.contentHash,
    mentorDecisionIdentity: feedback.mentorDecisionIdentity
  };
}

function visualIdentity({ mode = "unsupported" } = {}) {
  const strategyRisk = mode === "strategy_risk";
  const clear = mode === "clear";
  const visibleWords = strategyRisk
    ? ["Visible Brand", "Signature Vessel", "Archive Series", "Kitchen Division", "Etched Crest"]
    : clear
      ? ["Visible Brand", "VB-100"]
      : [];
  const identityHypotheses = strategyRisk
    ? ["Signature Vessel", "Archive Series Vessel", "Kitchen Division Vessel", "Etched Crest Vessel"].map((label) => ({
        exactCandidateLabel: label,
        broaderFamilyIdentity: "household vessel",
        brandOrMaker: "Visible Brand",
        model: "Unknown",
        supportingObservations: [label],
        contradictingObservations: [],
        unresolvedDiscriminators: ["Exact model remains unreadable."],
        distinguishingQueryOrObservation: ["Find a readable model label."],
        exactnessLevel: "EXACT_CANDIDATE",
        confidenceBand: "LOW"
      }))
    : [];
  return {
    brand: strategyRisk || clear ? "Visible Brand" : "Unsupported Mark",
    manufacturer: mode === "unsupported" ? "Imaginary Maker" : "Unknown",
    model: clear ? "VB-100" : "Unknown",
    exactProductIdentity: strategyRisk
      ? "Visible Brand Signature Vessel"
      : clear
        ? "Visible Brand VB-100 household vessel"
        : "Unsupported Mark four-slot Bakelite vessel",
    exactProductConfidence: clear ? "High" : "Low",
    productNameOrBoxTitle: strategyRisk ? "Signature Vessel" : "Unknown",
    subjectIdentity: "household vessel",
    likelyItemDescription: "household vessel",
    category: "household vessel",
    material: mode === "unsupported" ? "Bakelite" : "Unknown",
    packageQuantity: mode === "unsupported" ? "four-slot" : "Unknown",
    construction: mode === "unsupported" ? "four-slot configuration" : "Unknown",
    visibleText: visibleWords,
    textIdentityEvidence: visibleWords,
    strongestSearchableIdentifiers: visibleWords,
    identityUnknowns: clear ? [] : ["Exact model remains unreadable."],
    additionalEvidenceNeeded: clear ? [] : ["A readable model or maker label."],
    identityConflictNotes: [],
    identityHypotheses,
    visualRecognition: {
      visualSubject: "household vessel",
      visualSubjectCategory: "household vessel",
      visualSubjectConfidence: "High",
      possibleInterpretations: ["household vessel"],
      recognizedBrand: strategyRisk || clear ? "Visible Brand" : "Unsupported Mark",
      visibleWords,
      visibleLetters: [],
      visibleLogos: [],
      visibleColors: ["neutral"],
      distinctiveFeatures: [],
      visualEvidence: ["A household vessel is visible."],
      stillUnknown: clear ? [] : ["Exact model remains unreadable."],
      visualConflicts: []
    }
  };
}

function offlineProductHandler(adapter, {
  learningMode = "PRODUCT",
  identityMode = "unsupported",
  nominatedCandidateId = "",
  failPurposeResponse = false,
  poisonPurposeIdentity = false
} = {}) {
  const calls = [];
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "offline-placeholder",
    getOpenAIModel: () => "ordinary-version-1.12.50-model",
    getVisualIdentityModel: () => "gpt-5.6-luna",
    getGovernedLearningAdapter: () => adapter,
    getGovernedLearningMode: () => learningMode,
    getGovernedTrialRequest: ({ analysisId, frozenPreInterventionStateHash }) => (
      learningMode === "GOVERNED_TRIAL" && nominatedCandidateId
        ? {
            candidateId: nominatedCandidateId,
            beforeArmEpisodeId: "neutral-before-arm",
            afterArmEpisodeId: analysisId,
            frozenPreInterventionStateHash,
            purpose: "ISOLATED_CAUSAL_QUALIFICATION"
          }
        : null
    ),
    nowMilliseconds: (() => { let value = Date.parse(fixedTime); return () => (value += 5); })(),
    nowIso: () => fixedTime,
    requestOpenAIJson: async ({ payload }) => {
      calls.push({ model: payload.model, payload });
      if (payload?.text?.format?.name === "item_identity") {
        return {
          json: visualIdentity({ mode: identityMode }),
          data: {
            id: `response-${calls.length}`,
            usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
          },
          statusCode: 200
        };
      }
      if (["consumer_purchase_decision", "market_value_report"].includes(payload?.text?.format?.name)) {
        if (failPurposeResponse) {
          throw Object.assign(new Error("Offline provider transport failure."), {
            code: "OFFLINE_PROVIDER_TRANSPORT",
            openAIErrorCode: "transport_error",
            statusCode: 502
          });
        }
        return {
          json: poisonPurposeIdentity
            ? {
                ...retailRecoveryFixture.finalReport,
                priceBasis: "Unsupported Mark Bakelite four-slot configuration.",
                bestNextStep: "Verify the Imaginary Maker label before relying on value.",
                whatToVerifyBeforeBuying: "Confirm Unsupported Mark and Bakelite construction."
              }
            : retailRecoveryFixture.finalReport,
          data: {
            id: `response-${calls.length}`,
            usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 }
          },
          statusCode: 200
        };
      }
      throw Object.assign(new Error("Offline purpose boundary"), { code: "OFFLINE_PURPOSE_BOUNDARY" });
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
      error: "OFFLINE_NO_PAGE"
    })
  });
  return { handler, calls };
}

test("a completed real handler response is frozen into the learning ledger before feedback authority exists", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-product-outcome-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "product-outcome-scope" });
  const networkGuard = installHardNetworkDenial();
  let clock = Date.parse(retailRecoveryFixture.fixedNow);
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "offline-placeholder",
    getOpenAIModel: () => "ordinary-version-1.12.50-model",
    getSerperApiKey: () => "offline-placeholder",
    getGovernedLearningAdapter: () => adapter,
    nowMilliseconds: () => (clock += 5),
    nowIso: () => new Date(clock).toISOString(),
    requestOpenAIJson: async ({ payload }) => {
      const schema = payload?.text?.format?.name;
      if (schema === "item_identity") {
        return {
          json: {
            ...retailRecoveryFixture.identity,
            visualRecognition: retailRecoveryFixture.visualRecognition
          },
          data: { id: "offline-identity", output: [] },
          statusCode: 200
        };
      }
      if (schema === "consumer_purchase_decision") {
        return {
          json: retailRecoveryFixture.finalReport,
          data: { id: "offline-decision", output: [] },
          statusCode: 200
        };
      }
      throw new Error(`Unexpected schema ${schema}`);
    },
    requestSerperSearch: async ({ queryRecord }) => ({
      json: (queryRecord?.retailStage || queryRecord?.searchPass) === "stage_7_limited_result_recovery"
        ? retailRecoveryFixture.recoveryProviderResponse
        : retailRecoveryFixture.preliminaryProviderResponse,
      statusCode: 200,
      elapsedMs: 4
    }),
    requestBoundedRetailProductPage: async () => retailRecoveryFixture.directPageResult
  });
  try {
    const response = await invoke(handler, {
      analysisId: "completed-product-outcome",
      reportType: "marketValue",
      platform: "",
      notes: "041226087161",
      photos: [{
        name: "neutral-product.jpg",
        dataUrl: `data:image/jpeg;base64,${Buffer.alloc(220000, 0x5a).toString("base64")}`
      }],
      buyerIntake: retailRecoveryFixture.buyerIntake
    });
    assert.equal(response.statusCode, 200, JSON.stringify(response.payload));
    const outcome = await adapter.productOutcome("completed-product-outcome");
    assert(outcome);
    assert.equal(outcome.response_hash, sha256Object(response.payload));
    assert.equal(outcome.provider_lifecycle_authority, false);
    assert.equal((await adapter.status()).productOutcomes, 1);
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("baseline eyesight uses one Luna pass and rejects unsupported identity, material, and configuration claims", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-baseline-eyesight-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "baseline-eyesight-scope" });
  const networkGuard = installHardNetworkDenial();
  try {
    const product = offlineProductHandler(adapter, {
      identityMode: "unsupported",
      poisonPurposeIdentity: true
    });
    const response = await invoke(product.handler, {
      analysisId: "baseline-eyesight-product",
      reportType: "marketValue",
      notes: "",
      photos: [{ name: "ordinary.jpg", dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x51).toString("base64")}` }],
      buyerIntake: { purchase_intent: "owner_value", purchase_context: "owned_item" }
    });
    assert.equal(response.statusCode, 200, JSON.stringify(response.payload));
    const identityCalls = product.calls.filter((call) => call.payload?.text?.format?.name === "item_identity");
    assert.equal(identityCalls.length, 1);
    assert.equal(identityCalls[0].model, "gpt-5.6-luna");
    assert.deepEqual(identityCalls[0].payload.reasoning, { effort: "medium" });
    assert.equal(identityCalls[0].payload.store, false);
    const imageParts = identityCalls[0].payload.input.flatMap((entry) => entry.content || [])
      .filter((content) => content.type === "input_image");
    assert.equal(imageParts.length, 1);
    assert.equal(imageParts[0].detail, "original");
    const valuation = response.payload.valuation;
    assert.match(valuation.itemIdentification, /household vessel/i);
    assert.doesNotMatch(JSON.stringify(valuation.searchQueriesUsed || []), /Unsupported Mark|Imaginary Maker|Bakelite|four-slot/i);
    assert.doesNotMatch(valuation.priceBasis || "", /Unsupported Mark|Imaginary Maker|Bakelite|four-slot/i);
    assert.doesNotMatch(valuation.bestNextStep || "", /Unsupported Mark|Imaginary Maker|Bakelite|four-slot/i);
    assert.doesNotMatch(valuation.whatToVerifyBeforeBuying || "", /Unsupported Mark|Imaginary Maker|Bakelite|four-slot/i);
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("authenticated product feedback reaches the canonical mentor and produces only an inert bound candidate", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-product-feedback-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "product-feedback-scope" });
  const networkGuard = installHardNetworkDenial();
  try {
    const outcome = await recordOutcome(adapter, "training-product-outcome", 1, "1");
    const envelope = await adapter.authorizeProductOutcomeFeedback({
      episodeId: "training-product-outcome",
      responseHash: outcome.responseHash,
      originalEvidenceIdentity: outcome.originalEvidenceIdentity,
      failedClaim: {
        claimPath: "analysis.searchDiagnostics.queriesActuallySent",
        claimClass: "COMPARABLE_RESEARCH_STRATEGY",
        assertedValue: "Exact-only queries exhausted the bounded search budget.",
        failureKind: "FAILED_TO_BROADEN_COMPARABLE_RESEARCH"
      },
      correction: feedbackCorrection(false),
      issuedAt: fixedTime
    });
    const handler = createGenerateListingHandler({
      getGovernedLearningAdapter: () => adapter,
      nowIso: () => fixedTime,
      createAnalysisId: () => "feedback-diagnosis"
    });
    const accepted = await invoke(handler, {
      analysisId: "feedback-diagnosis",
      action: "submit_product_outcome_feedback",
      feedbackEnvelope: envelope
    });
    assert.equal(accepted.statusCode, 200, JSON.stringify(accepted.payload));
    assert.equal(accepted.payload.feedback.result, "LESSON_CANDIDATE_RECORDED");
    assert.equal(accepted.payload.feedback.mentorDiagnosis.selectedActionId, COGNITIVE_ACTION.EVALUATE_RETURNED_EVIDENCE);
    assert.equal(accepted.payload.feedback.inertStrategyCandidate.status, "CANDIDATE");
    assert.equal(accepted.payload.feedback.inertStrategyCandidate.recommendedActionPattern, COGNITIVE_ACTION.APPLY_GOVERNED_RESEARCH_STRATEGY);
    assert.equal(accepted.payload.feedback.promotionAuthorized, false);
    assert.equal(accepted.payload.feedback.providerLifecycleAuthority, false);
    assert.equal((await adapter.status()).promotedLessons, 0);

    const ordinary = await adapter.prepareEpisode({
      governor: createCognitiveGovernor({ evaluationId: "ordinary-after-candidate" }),
      episodeId: "ordinary-after-candidate",
      episodeSequence: 3,
      queryFacets: {
        requiredApplicabilitySignals: ["COMPARABLE_RESEARCH_STRATEGY_RISK"]
      },
      queryText: "comparable research strategy risk",
      learningMode: "PRODUCT",
      createdAt: fixedTime
    });
    assert.deepEqual(ordinary.selectedMemoryIds, []);

    const forged = structuredClone(envelope);
    forged.failedClaim.assertedValue = "Forged value";
    const refusedForgery = await invoke(handler, {
      analysisId: "forged-feedback",
      action: "submit_product_outcome_feedback",
      feedbackEnvelope: forged
    });
    assert.equal(refusedForgery.statusCode, 502);
    assert.equal(refusedForgery.payload.diagnostics.governedLearning.lifecycleResult, "PRODUCT_FEEDBACK_REFUSED");

    const crossEpisode = structuredClone(envelope);
    crossEpisode.boundEpisodeId = "different-product-outcome";
    const refusedCrossEpisode = await invoke(handler, {
      analysisId: "cross-episode-feedback",
      action: "submit_product_outcome_feedback",
      feedbackEnvelope: crossEpisode
    });
    assert.equal(refusedCrossEpisode.statusCode, 502);
    assert.equal(
      refusedCrossEpisode.payload.diagnostics.governedLearning.refusalCode,
      "PRODUCT_FEEDBACK_AUTHORITY_INVALID"
    );

    const refusedReplay = await invoke(handler, {
      analysisId: "replayed-feedback",
      action: "submit_product_outcome_feedback",
      feedbackEnvelope: envelope
    });
    assert.equal(refusedReplay.statusCode, 502);
    assert.equal(refusedReplay.payload.diagnostics.governedLearning.refusalCode, "PRODUCT_FEEDBACK_BINDING");

    await assert.rejects(
      adapter.authorizeProductOutcomeFeedback({
        episodeId: "missing-product-outcome",
        responseHash: "f".repeat(64),
        originalEvidenceIdentity: "e".repeat(64),
        failedClaim: envelope.failedClaim,
        correction: feedbackCorrection(false),
        issuedAt: fixedTime
      }),
      (error) => error.code === "PRODUCT_FEEDBACK_OUTCOME_NOT_FOUND"
    );
    await assert.rejects(
      adapter.authorizeProductOutcomeFeedback({
        episodeId: "training-product-outcome",
        responseHash: outcome.responseHash,
        originalEvidenceIdentity: "f".repeat(64),
        failedClaim: envelope.failedClaim,
        correction: feedbackCorrection(false),
        issuedAt: fixedTime
      }),
      (error) => error.code === "PRODUCT_FEEDBACK_OUTCOME_NOT_FOUND"
    );
    await assert.rejects(
      adapter.authorizeProductOutcomeFeedback({
        episodeId: "training-product-outcome",
        responseHash: outcome.responseHash,
        originalEvidenceIdentity: outcome.originalEvidenceIdentity,
        failedClaim: envelope.failedClaim,
        correction: feedbackCorrection(true),
        issuedAt: fixedTime
      }),
      (error) => error.code === "PROVIDER_AUTHORED_FEEDBACK_PROHIBITED"
    );
    assert.equal((await adapter.status()).acceptedFeedback, 1);
    await assert.rejects(
      adapter.prepareEpisode({
        governor: createCognitiveGovernor({ evaluationId: "reordered-feedback-episode" }),
        episodeId: "reordered-feedback-episode",
        episodeSequence: 1,
        queryFacets: { purpose: ["PRODUCT_OUTCOME_FEEDBACK"] },
        queryText: "reordered feedback",
        learningMode: "FEEDBACK",
        createdAt: fixedTime
      }),
      (error) => ["FORWARD_ONLY_EPISODE_REQUIRED", "EXECUTIVE_MEMORY_FORWARD_ORDER"].includes(error.code)
    );
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("authenticated visible-object-class failure reaches the same Mentor boundary without gaining product authority", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-product-identity-feedback-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "product-identity-feedback-scope" });
  const networkGuard = installHardNetworkDenial();
  try {
    const outcome = await recordOutcome(adapter, "identity-product-outcome", 1, "7");
    const envelope = await adapter.authorizeProductOutcomeFeedback({
      episodeId: "identity-product-outcome",
      responseHash: outcome.responseHash,
      originalEvidenceIdentity: outcome.originalEvidenceIdentity,
      failedClaim: {
        claimPath: "valuation.identifiedItem",
        claimClass: "VISIBLE_OBJECT_CLASS_IDENTIFICATION",
        assertedValue: "The returned broad identity omitted the authenticated visible object class.",
        failureKind: "FAILED_VISIBLE_OBJECT_CLASS_IDENTIFICATION"
      },
      correction: {
        correctedState: "VISIBLE_OBJECT_CLASS_SUPPORTED",
        evidenceProvenance: {
          authorityClass: "OWNER_AUTHORIZED_INDEPENDENT_EVALUATOR",
          sourceType: "AUTHENTICATED_FROZEN_IMAGE_AND_PRODUCT_RESPONSE_REVIEW",
          sourceIdentity: "e".repeat(64),
          providerAuthored: false
        }
      },
      issuedAt: fixedTime
    });
    const handler = createGenerateListingHandler({
      getGovernedLearningAdapter: () => adapter,
      nowIso: () => fixedTime,
      createAnalysisId: () => "identity-feedback-diagnosis"
    });
    const accepted = await invoke(handler, {
      analysisId: "identity-feedback-diagnosis",
      action: "submit_product_outcome_feedback",
      feedbackEnvelope: envelope
    });
    assert.equal(accepted.statusCode, 200, JSON.stringify(accepted.payload));
    assert.equal(accepted.payload.feedback.result, "LESSON_CANDIDATE_RECORDED");
    assert.equal(accepted.payload.feedback.mentorDiagnosis.selectedActionId, COGNITIVE_ACTION.EVALUATE_RETURNED_EVIDENCE);
    assert.equal(accepted.payload.feedback.inertStrategyCandidate.status, "CANDIDATE");
    assert.equal(
      accepted.payload.feedback.inertStrategyCandidate.recommendedActionPattern,
      COGNITIVE_ACTION.EVALUATE_RETURNED_EVIDENCE
    );
    assert.deepEqual(
      accepted.payload.feedback.inertStrategyCandidate.requiredApplicabilitySignals,
      ["VISIBLE_OBJECT_CLASS_IDENTIFICATION_RISK"]
    );
    assert.equal(accepted.payload.feedback.inertStrategyCandidate.feedbackBinding.feedbackId, envelope.feedbackId);
    assert.equal(accepted.payload.feedback.promotionAuthorized, false);
    assert.equal(accepted.payload.feedback.providerLifecycleAuthority, false);
    assert.equal((await adapter.status()).promotedLessons, 0);

    const binding = lessonGateBinding(accepted.payload.feedback);
    const gateCandidate = await adapter.reconstructLessonGateCandidate(binding);
    const gateReview = reviewLessonCandidate(gateCandidate);
    assert.equal(gateReview.candidateIntegrity.valid, true);
    assert.equal(gateReview.candidateIntegrity.hashMatch, true);
    assert.equal(gateReview.candidateIntegrity.nonOperative, true);
    assert.equal(gateReview.independentEpisodeCount, 0);
    assert.equal(gateReview.independentObjectClassCount, 0);
    assert.deepEqual(gateReview.reasons, [
      "CAUSALITY_NOT_INTERNAL",
      "INSUFFICIENT_INDEPENDENT_EPISODES",
      "INSUFFICIENT_INDEPENDENT_OBJECT_CLASSES",
      "UNREGISTERED_CAUSAL_MECHANISM"
    ]);
    assert.equal(gateCandidate.causalSignature.causalityDomain, "UNRESOLVED");
    assert.equal(gateCandidate.origin.governedLearningBinding.candidateEventId, binding.candidateId);
    assert.equal(gateCandidate.origin.governedLearningBinding.failureId, binding.failureId);
    assert.equal(gateCandidate.origin.governedLearningBinding.diagnosisId, binding.diagnosisId);
    assert.equal(gateCandidate.origin.governedLearningBinding.memoryId, binding.memoryId);
    assert.equal(gateCandidate.origin.governedLearningBinding.memoryContentHash, binding.memoryContentHash);
    assert.equal(
      gateCandidate.origin.governedLearningBinding.mentorDecisionIdentity,
      binding.mentorDecisionIdentity
    );
    assert.throws(
      () => buildEvidenceAcquisitionRequirement(gateCandidate),
      /deficit-only PROOF_BLOCKED candidate/
    );

    for (const field of [
      "failureId",
      "diagnosisId",
      "memoryContentHash",
      "mentorDecisionIdentity"
    ]) {
      await assert.rejects(
        adapter.reconstructLessonGateCandidate({ ...binding, [field]: "f".repeat(64) }),
        (error) => error.code === "LESSON_GATE_CANDIDATE_BINDING_MISMATCH"
      );
    }
    await assert.rejects(
      adapter.reconstructLessonGateCandidate({ ...binding, memoryId: "substituted-memory" }),
      (error) => error.code === "LESSON_GATE_CANDIDATE_BINDING_MISMATCH"
    );
    await assert.rejects(
      adapter.reconstructLessonGateCandidate({ ...binding, candidateId: "f".repeat(64) }),
      (error) => error.code === "LESSON_GATE_CANDIDATE_NOT_FOUND"
    );
    await assert.rejects(
      adapter.reconstructLessonGateCandidate({ ...binding, causalityDomain: "INTERNAL" }),
      (error) => error.code === "LEARNING_UNKNOWN_FIELD"
    );
    const tamperedGateCandidate = structuredClone(gateCandidate);
    tamperedGateCandidate.origin.governedLearningBinding.failureId = "f".repeat(64);
    assert(reviewLessonCandidate(tamperedGateCandidate).reasons.includes("CANDIDATE_INTEGRITY_INVALID"));
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("the canonical fallback makes an obsolete exact-only trial inapplicable without changing Luna identity", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-product-research-action-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "research-action-scope" });
  const networkGuard = installHardNetworkDenial();
  try {
    const outcome = await recordOutcome(adapter, "research-training-outcome", 1, "4");
    const envelope = await adapter.authorizeProductOutcomeFeedback({
      episodeId: "research-training-outcome",
      responseHash: outcome.responseHash,
      originalEvidenceIdentity: outcome.originalEvidenceIdentity,
      failedClaim: {
        claimPath: "analysis.searchDiagnostics.queriesActuallySent",
        claimClass: "COMPARABLE_RESEARCH_STRATEGY",
        assertedValue: "Exact-only queries exhausted the bounded search budget.",
        failureKind: "FAILED_TO_BROADEN_COMPARABLE_RESEARCH"
      },
      correction: feedbackCorrection(false),
      issuedAt: fixedTime
    });
    const feedbackHandler = createGenerateListingHandler({
      getGovernedLearningAdapter: () => adapter,
      nowIso: () => fixedTime,
      createAnalysisId: () => "research-feedback"
    });
    const feedback = await invoke(feedbackHandler, {
      analysisId: "research-feedback",
      action: "submit_product_outcome_feedback",
      feedbackEnvelope: envelope
    });
    assert.equal(feedback.statusCode, 200, JSON.stringify(feedback.payload));
    const candidateId = feedback.payload.feedback.candidateId;
    await assert.rejects(
      adapter.reconstructLessonGateCandidate(lessonGateBinding(feedback.payload.feedback)),
      (error) => error.code === "LESSON_GATE_FEEDBACK_DOMAIN_UNSUPPORTED"
    );
    const riskyProduct = offlineProductHandler(adapter, {
      learningMode: "GOVERNED_TRIAL",
      identityMode: "strategy_risk",
      nominatedCandidateId: candidateId
    });
    const riskyResponse = await invoke(riskyProduct.handler, {
      analysisId: "later-risky-product",
      reportType: "marketValue",
      notes: "",
      photos: [{ name: "neutral.jpg", dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x52).toString("base64")}` }],
      buyerIntake: { purchase_intent: "owner_value", purchase_context: "owned_item" }
    });
    assert.equal(riskyResponse.statusCode, 502, JSON.stringify(riskyResponse.payload));
    assert.equal(riskyResponse.payload.code, "QUALIFICATION_TRIAL_NOMINATION_INVALID");
    const identityCalls = riskyProduct.calls.filter((call) => call.payload?.text?.format?.name === "item_identity");
    assert.equal(identityCalls.length, 1);
    assert.equal(identityCalls[0].model, "gpt-5.6-luna");
    assert.deepEqual(identityCalls[0].payload.reasoning, { effort: "medium" });
    assert.equal(identityCalls[0].payload.store, false);
    assert(identityCalls[0].payload.input.some((entry) => (
      entry.role === "user"
      && entry.content.some((content) => content.type === "input_image" && content.detail === "original")
    )));
    assert.equal(riskyProduct.calls.some((call) => (
      call.payload?.text?.format?.name === "market_value_report"
      && call.model === "ordinary-version-1.12.50-model"
    )), false);

    const canonicalProduct = offlineProductHandler(adapter, { learningMode: "PRODUCT", identityMode: "strategy_risk" });
    const canonicalResponse = await invoke(canonicalProduct.handler, {
      analysisId: "canonical-balanced-product",
      reportType: "marketValue",
      notes: "canonical fallback control",
      photos: [{ name: "neutral.jpg", dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x55).toString("base64")}` }],
      buyerIntake: { purchase_intent: "owner_value", purchase_context: "owned_item" }
    });
    assert.equal(canonicalResponse.statusCode, 200, JSON.stringify(canonicalResponse.payload));
    assert.equal(canonicalProduct.calls.filter((call) => call.model === "gpt-5.6-luna").length, 1);
    const canonicalAction = canonicalResponse.payload.valuation.searchDiagnostics.governedResearchStrategy;
    assert.equal(canonicalAction.executed, false);
    assert(canonicalAction.preInterventionResearchApplicabilityDecision.features.exactComparableCount > 0);
    assert(canonicalAction.preInterventionResearchApplicabilityDecision.features.closeComparableCount > 0);
    assert(canonicalAction.preInterventionResearchApplicabilityDecision.features.categoryComparableCount > 0);

    const clearProduct = offlineProductHandler(adapter, { learningMode: "PRODUCT", identityMode: "clear" });
    const clearResponse = await invoke(clearProduct.handler, {
      analysisId: "clear-non-transfer-product",
      reportType: "marketValue",
      notes: "clear control",
      photos: [{ name: "neutral.jpg", dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x53).toString("base64")}` }],
      buyerIntake: { purchase_intent: "owner_value", purchase_context: "owned_item" }
    });
    assert.equal(clearResponse.statusCode, 200, JSON.stringify(clearResponse.payload));
    assert.equal(clearProduct.calls.filter((call) => call.model === "gpt-5.6-luna").length, 1);
    assert.equal(clearResponse.payload.valuation.searchDiagnostics.governedResearchStrategy.executed, false);
    assert.notEqual(
      clearResponse.payload.valuation.searchDiagnostics.governedResearchStrategy.researchApplicabilityDecision.classification,
      "CLEAR_GROUNDED_RESEARCH_STRATEGY"
    );
    assert.equal((await adapter.status()).promotedLessons, 0);
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("a post-Governor provider transport failure creates zero cognitive candidates", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-product-transport-exclusion-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "transport-exclusion-scope" });
  const networkGuard = installHardNetworkDenial();
  try {
    const product = offlineProductHandler(adapter, {
      learningMode: "PRODUCT",
      identityMode: "clear",
      failPurposeResponse: true
    });
    const response = await invoke(product.handler, {
      analysisId: "transport-failure-product",
      reportType: "marketValue",
      notes: "neutral transport proof",
      photos: [{ name: "neutral.jpg", dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x54).toString("base64")}` }],
      buyerIntake: { purchase_intent: "owner_value", purchase_context: "owned_item" }
    });
    assert.equal(response.statusCode, 200, JSON.stringify(response.payload));
    assert.equal(response.payload.valuation.analysisStatus, "PARTIAL_PROVIDER_FAILURE");
    assert.equal(response.payload.valuation.pricingState, "not_established");
    assert.equal(response.payload.valuation.fairValue, "Not established");
    assert.equal(response.payload.valuation.requestedPurposeComplete, false);
    assert.equal(response.payload.valuation.searchDiagnostics.recoverablePartialResponse.genericHttp502Avoided, true);
    assert.equal((await adapter.status()).candidates, 0);
    assert.equal((await adapter.status()).failures, 0);
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});
