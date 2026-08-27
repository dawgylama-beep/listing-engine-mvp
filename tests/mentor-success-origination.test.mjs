import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createCognitiveGovernor,
  runCanonicalCognitiveRuntime
} from "../lib/cognitive-governor/index.js";
import {
  MENTOR_SUCCESS_DISPOSITION,
  createProgrammedCompetenceManifest,
  originateMentorSuccessExplanations,
  validateAuthenticatedProductSuccessObservation
} from "../lib/cognitive-governor/mentor-success-origination.js";
import {
  GovernedLearningAdapter,
  sealIndependentProductSuccessEvaluation,
  sealStoredProductSuccessArtifact
} from "../lib/cognitive-learning/adapter.js";
import {
  buildInertLessonCandidateFromMentorSuccess,
  verifyRetrospectiveLessonCandidate
} from "../lib/experience-reflection.js";
import {
  LESSON_GATE_STATE,
  buildEvidenceAcquisitionRequirement,
  buildRegressionCharter,
  evaluateEvidenceAcquisitionInventory,
  reviewLessonCandidate,
  validateRegressionCharter
} from "../lib/lesson-gate.js";
import { sha256Object } from "../lib/object-intelligence/index.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const fixedTime = "2026-08-27T14:00:00.000Z";
const digest = (value) => sha256Object(value);
const evidenceRisk = Object.freeze({
  canonicalIdentityUnresolvedCount: 0,
  unsupportedQueryTermCount: 0,
  exactComparableCount: 1,
  closeComparableCount: 1,
  categoryComparableCount: 1,
  weakPriceProvenanceCount: 0,
  valueJudgmentExceedsEvidenceCount: 0
});

function snapshot(id) {
  const evidenceId = `evidence-${id}`;
  const objectMindState = {
    objectStateId: `object-${id}`,
    identityStateHash: digest({ id, identity: true }),
    requestIdentity: {
      inputImageIds: [`image-${id}`],
      inputDescriptionProvenance: { sha256: digest({ id, description: true }) }
    },
    observedFacts: [{
      observationId: evidenceId,
      factType: "authenticated_success_fixture",
      value: "A bounded offline success fixture is present.",
      normalizedValue: "a bounded offline success fixture is present",
      certaintyBand: "HIGH",
      origin: "DIRECTLY_VISIBLE"
    }],
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: `hypothesis-${id}`,
      exactCandidateLabel: "Neutral governed object",
      broaderFamilyIdentity: "governed object",
      exactnessLevel: "BROADER_FAMILY",
      confidenceBand: "MEDIUM",
      supportingObservationIds: [evidenceId],
      contradictingObservations: [],
      unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: `hypothesis-${id}`,
      stableIdentityKey: `neutral-${id}`,
      exactnessClassification: "BROADER_FAMILY",
      bestSupportedCustomerIdentity: "Neutral governed object",
      broaderFallbackIdentity: "governed object",
      limitations: [],
      additionalEvidenceNeeded: []
    },
    searchPlan: [],
    candidateEvidence: [{
      evidenceId,
      sourceRecordId: evidenceId,
      exactnessClassification: "COMPATIBLE",
      verificationState: "VERIFIED",
      sourceEvidenceText: "Neutral fixture evidence."
    }]
  };
  return {
    evaluationId: id,
    objectMindState,
    evidenceRecords: objectMindState.candidateEvidence,
    providerRequests: [],
    initialPlan: [],
    refinementPlan: [],
    directPageCandidates: [],
    providerBudget: { maximum: 0, consumed: 0 },
    directPageBudget: { maximum: 0, consumed: 0 },
    executiveState: {
      missionObjective: "Preserve one bounded authenticated product outcome.",
      finishLine: "Return only evidence-bound product state.",
      earliestCausalBoundary: "AUTHENTICATED_PRODUCT_SUCCESS",
      visibleEvidenceIds: [evidenceId],
      requiredEvidenceIds: [evidenceId],
      evidenceCondition: "SUPPORTED",
      failureCondition: "No failure is asserted.",
      failureScope: "BOUNDED",
      uncertaintyClass: "NONE",
      authorityClass: "EXISTING",
      permittedOperations: ["RETURNED_EVIDENCE_EVALUATION"],
      prohibitedOperations: ["PROVIDER_LIFECYCLE_TRANSITION", "MEMORY_PROMOTION"],
      safeContinuation: true,
      newMechanismRequired: false,
      contradictionPresent: false,
      cycleDetected: false,
      duplicateDetected: false,
      memoryReuseBoundary: "NOVEL",
      dossierStage: "CAPABLE",
      stoppingState: "ACTIVE"
    }
  };
}

async function recordOutcome(adapter, id, sequence) {
  const governor = createCognitiveGovernor({ evaluationId: id });
  const memoryContext = await adapter.prepareEpisode({
    governor,
    episodeId: id,
    episodeSequence: sequence,
    queryFacets: {
      purpose: ["NEUTRAL_REVIEW"],
      researchEvidenceRisk: evidenceRisk,
      frozenPreInterventionStateHash: digest(`${id}-pre`)
    },
    queryText: `offline authenticated success fixture ${id}`,
    createdAt: fixedTime
  });
  const runtime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: snapshot(id),
    executiveMemoryContext: memoryContext
  });
  const responseHash = digest(`${id}-response`);
  const originalEvidenceIdentity = digest(`${id}-input`);
  const outcome = await adapter.recordProductOutcome({
    governor,
    runtime,
    episodeId: id,
    episodeSequence: sequence,
    responseHash,
    originalEvidenceIdentity,
    cognitiveEpisodeHash: digest(`${id}-cognitive-episode`),
    submittedObjectFingerprint: `object-class-${id}`,
    memoryTransitionHash: runtime.authoritativeMemoryTransition.memoryTransitionHash,
    frozenPreInterventionStateHash: digest(`${id}-pre`),
    researchPlanStateHash: digest(`${id}-research-plan`),
    researchApplicabilityDecisionHash: memoryContext.researchApplicabilityDecision.applicabilityDecisionHash,
    createdAt: fixedTime
  });
  return { outcome, responseHash, originalEvidenceIdentity };
}

function successArtifact(record, { expected = false, complete = true, external = false } = {}) {
  const id = record.outcome.episode_id;
  const providerOne = {
    requestIdentity: digest(`${id}-provider-request-one`),
    responseIdentity: digest(`${id}-provider-response-one-id`),
    responseHash: digest(`${id}-provider-response-one`),
    providerAuthored: false
  };
  const providerTwo = {
    requestIdentity: digest(`${id}-provider-request-two`),
    responseIdentity: digest(`${id}-provider-response-two-id`),
    responseHash: digest(`${id}-provider-response-two`),
    providerAuthored: false
  };
  const evaluation = sealIndependentProductSuccessEvaluation({
    evaluationIdentity: digest(`${id}-evaluation`),
    evaluatorIdentity: digest("independent-evaluator"),
    evaluationAuthorityIdentity: digest("independent-evaluation-authority"),
    independent: true,
    selfEvaluation: false,
    providerAuthored: false,
    fatalRegressionCount: 0,
    dimensions: {
      identityAccuracy: 0.9,
      purposeAccuracy: 0.9,
      conditionAccuracy: 0.9,
      evidenceTraceability: 0.9,
      uncertaintyCalibration: 0.9,
      decisionUsefulness: 0.9,
      schemaCoverage: 0.9,
      regressionSafety: 0.9
    }
  });
  return sealStoredProductSuccessArtifact({
    schemaVersion: "1.0",
    artifactType: "FROZEN_INDEPENDENT_PRODUCT_SUCCESS_EVALUATION",
    episodeId: id,
    outcomeId: record.outcome.outcomeId,
    inputBinding: {
      inputIdentity: digest(`${id}-input-identity`),
      inputHash: record.originalEvidenceIdentity,
      imageIdentity: digest(`${id}-image-identity`),
      imageHash: digest(`${id}-image-hash`)
    },
    providerResponses: [providerTwo, providerOne],
    productOutput: {
      outputIdentity: digest(`${id}-output-identity`),
      outputHash: record.responseHash
    },
    independentEvaluation: evaluation,
    modelIdentity: "KATHERINE_MODEL_FIXTURE_V1",
    policyVersion: "KATHERINE_POLICY_V1",
    productSchemaVersion: "1.12.52",
    behaviorTrace: [{
      behaviorId: "GOVERNED_EVIDENCE_LADDER",
      actionPattern: "APPLY_GOVERNED_RESEARCH_STRATEGY",
      causalityDomain: external ? "EXTERNAL" : "INTERNAL",
      scope: ["KATHERINE_PRODUCT_RESEARCH"],
      applicabilityTriggers: ["COMPARABLE_RESEARCH_STRATEGY_RISK"],
      exclusions: ["NO_CANONICAL_RESEARCH_PLAN", "CLEAR_GROUNDED_RESEARCH_STRATEGY"],
      supportingEvidenceHashes: [providerOne.responseHash, evaluation.evaluationRecordHash],
      causalAttribution: {
        baselineObservationHash: digest(`${id}-baseline`),
        treatmentObservationHash: digest(`${id}-treatment`),
        interventionOnlyDifference: complete,
        evaluatorAttributionConfirmed: complete,
        externalContributionDominant: external
      }
    }],
    expectedSuccessNoLesson: expected,
    counterevidenceHashes: [],
    alternativeExplanations: [],
    provenance: {
      authorityClass: "INDEPENDENT_AUTHENTICATED_PRODUCT_EVALUATION",
      sourceType: "FROZEN_OFFLINE_PRODUCT_EPISODE",
      sourceIdentity: digest(`${id}-frozen-source`),
      providerAuthored: false
    },
    unresolvedFatalRegression: false,
    evaluatedAt: fixedTime
  });
}

function rehashObservation(observation, mutation) {
  const clone = structuredClone(observation);
  mutation(clone);
  clone.observationHash = "";
  clone.observationHash = sha256Object(clone);
  return clone;
}

test("authenticated product success reaches the real Mentor and Lesson Gate without operative authority", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-success-origin-"));
  const networkGuard = installHardNetworkDenial();
  try {
    const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "success-origin-scope" });
    const records = [];
    for (let index = 1; index <= 3; index += 1) {
      records.push(await recordOutcome(adapter, `success-${index}`, index));
    }
    const artifacts = records.map((record) => successArtifact(record));
    const inventory = await adapter.inventoryAuthenticatedProductSuccesses({ frozenSuccessArtifacts: artifacts });
    assert.equal(inventory.authenticatedSuccessCount, 3, JSON.stringify(inventory.rejectedArtifacts));
    assert.equal(inventory.rejectedArtifactCount, 0);
    assert.equal(inventory.persistenceAuthorized, false);
    assert.equal(inventory.providerLifecycleAuthority, false);
    for (const observation of inventory.authenticatedSuccessObservations) {
      assert.doesNotThrow(() => validateAuthenticatedProductSuccessObservation(observation));
      assert.equal(observation.productOutput.outputHash,
        records.find((record) => record.outcome.outcomeId === observation.outcomeIdentity).responseHash);
      assert.match(observation.ledgerEventIdentity, /^[a-f0-9]{64}$/);
      assert.equal(observation.independentEvaluation.result, "PASS");
      assert.equal(observation.unresolvedFatalRegression, false);
    }

    const programmed = createProgrammedCompetenceManifest(["BARCODE_FIRST_IDENTIFICATION"]);
    const mentor = await adapter.originateMentorSuccessFromInventory({
      inventory,
      programmedCompetenceManifest: programmed
    });
    assert.equal(mentor.explanations.length, 1);
    assert.equal(mentor.nonCandidateDispositions.length, 0);
    const explanation = mentor.explanations[0];
    assert.equal(explanation.disposition, MENTOR_SUCCESS_DISPOSITION.NOVEL_SUCCESS_BEHAVIOR_SUPPORTED);
    assert.equal(explanation.independentEpisodeCount, 3);
    assert.equal(explanation.independentObjectClassCount, 3);
    assert.equal(explanation.persistAsMemory, false);
    assert.equal(explanation.publicationAuthorized, false);
    assert.equal(explanation.providerLifecycleAuthority, false);

    const candidate = buildInertLessonCandidateFromMentorSuccess(explanation);
    const verification = verifyRetrospectiveLessonCandidate(candidate);
    assert.equal(verification.valid, true);
    assert.deepEqual({
      persistAsMemory: candidate.persistAsMemory,
      qualificationAuthorized: candidate.qualificationAuthorized,
      promotionAuthorized: candidate.promotionAuthorized,
      runtimeConsumptionAuthorized: candidate.runtimeConsumptionAuthorized,
      productChangeAuthorized: candidate.productChangeAuthorized,
      publicationAuthorized: candidate.publicationAuthorized,
      providerLifecycleAuthority: candidate.providerLifecycleAuthority
    }, {
      persistAsMemory: false,
      qualificationAuthorized: false,
      promotionAuthorized: false,
      runtimeConsumptionAuthorized: false,
      productChangeAuthorized: false,
      publicationAuthorized: false,
      providerLifecycleAuthority: false
    });
    const review = reviewLessonCandidate(candidate);
    assert.equal(review.state, LESSON_GATE_STATE.PROOF_REQUIRED);
    assert.equal(review.proofEligible, true);
    assert.equal(review.independentEpisodeCount, 2);
    assert.equal(review.independentObjectClassCount, 2);
    const charter = buildRegressionCharter({
      candidate,
      fixtureManifestHash: digest("fixed-concealed-success-trial-manifest")
    });
    assert.deepEqual(validateRegressionCharter(charter, candidate), {
      valid: true,
      proofEligible: true,
      failures: []
    });
    assert.equal(charter.fixedTrialRequirementsHash, candidate.fixedTrialRequirementsHash);
    assert.equal(charter.originatingEpisodeExcluded, true);

    const oneObservationInventory = {
      ...inventory,
      authenticatedSuccessCount: 1,
      authenticatedSuccessObservations: [inventory.authenticatedSuccessObservations[0]],
      inventoryHash: ""
    };
    oneObservationInventory.inventoryHash = sha256Object(oneObservationInventory);
    const oneMentor = originateMentorSuccessExplanations({
      successObservations: oneObservationInventory.authenticatedSuccessObservations,
      programmedCompetenceManifest: programmed
    });
    const oneCandidate = buildInertLessonCandidateFromMentorSuccess(oneMentor.explanations[0]);
    const oneReview = reviewLessonCandidate(oneCandidate);
    assert.equal(oneReview.state, LESSON_GATE_STATE.PROOF_BLOCKED);
    assert(oneReview.reasons.includes("INSUFFICIENT_INDEPENDENT_EPISODES"));
    assert(oneReview.reasons.includes("INSUFFICIENT_INDEPENDENT_OBJECT_CLASSES"));
    const requirement = buildEvidenceAcquisitionRequirement(oneCandidate);
    assert.deepEqual(requirement.evidenceDeficits, {
      additionalIndependentEpisodesRequired: 2,
      additionalIndependentObjectClassesRequired: 2
    });
    const evidenceInventory = evaluateEvidenceAcquisitionInventory({
      requirement,
      candidate: oneCandidate,
      observations: [
        inventory.authenticatedSuccessObservations[0],
        inventory.authenticatedSuccessObservations[1],
        inventory.authenticatedSuccessObservations[1]
      ]
    });
    assert.equal(evidenceInventory.acceptedObservationCount, 1);
    assert(evidenceInventory.rejectedObservations.some((item) => item.reasons.includes("ORIGINATING_SUCCESS_REUSE")));
    assert(evidenceInventory.rejectedObservations.some((item) => item.reasons.includes("BATCH_DUPLICATE_EPISODE")));

    const programmedBehavior = createProgrammedCompetenceManifest(["GOVERNED_EVIDENCE_LADDER"]);
    const existing = originateMentorSuccessExplanations({
      successObservations: oneObservationInventory.authenticatedSuccessObservations,
      programmedCompetenceManifest: programmedBehavior
    });
    assert.equal(existing.explanations.length, 0);
    assert.equal(existing.nonCandidateDispositions[0].disposition,
      MENTOR_SUCCESS_DISPOSITION.EXISTING_PROGRAMMED_COMPETENCE);

    const origin = inventory.authenticatedSuccessObservations[0];
    const expectedObservation = rehashObservation(origin, (value) => { value.expectedSuccessNoLesson = true; });
    const expectedReport = await adapter.originateMentorSuccessFromInventory({
      inventory: {
        ...oneObservationInventory,
        authenticatedSuccessObservations: [expectedObservation],
        inventoryHash: ""
      },
      programmedCompetenceManifest: programmed
    }).catch((error) => error);
    assert.equal(expectedReport.code, "PRODUCT_SUCCESS_INVENTORY_TAMPERED");
    const directExpectedInventory = {
      ...oneObservationInventory,
      authenticatedSuccessObservations: [expectedObservation],
      inventoryHash: ""
    };
    directExpectedInventory.inventoryHash = sha256Object(directExpectedInventory);
    const expectedDisposition = originateMentorSuccessExplanations({
      successObservations: directExpectedInventory.authenticatedSuccessObservations,
      programmedCompetenceManifest: programmed
    });
    assert.equal(expectedDisposition.explanations.length, 0);
    assert.equal(expectedDisposition.nonCandidateDispositions[0].disposition,
      MENTOR_SUCCESS_DISPOSITION.EXPECTED_SUCCESS_NO_LESSON);

    const insufficientObservation = rehashObservation(origin, (value) => {
      value.behaviorTrace[0].causalAttribution.interventionOnlyDifference = false;
      value.behaviorTrace[0].causalAttribution.evaluatorAttributionConfirmed = false;
    });
    const insufficientInventory = {
      ...oneObservationInventory,
      authenticatedSuccessObservations: [insufficientObservation],
      inventoryHash: ""
    };
    insufficientInventory.inventoryHash = sha256Object(insufficientInventory);
    const insufficient = originateMentorSuccessExplanations({
      successObservations: insufficientInventory.authenticatedSuccessObservations,
      programmedCompetenceManifest: programmed
    });
    assert.equal(insufficient.explanations.length, 0);
    assert.equal(insufficient.nonCandidateDispositions[0].disposition,
      MENTOR_SUCCESS_DISPOSITION.INSUFFICIENT_CAUSAL_SUPPORT);

    const externalObservation = rehashObservation(origin, (value) => {
      const trace = value.behaviorTrace[0];
      trace.causalityDomain = "EXTERNAL";
      trace.causalAttribution.externalContributionDominant = true;
      trace.behaviorSignatureHash = sha256Object({
        behaviorId: trace.behaviorId,
        actionPattern: trace.actionPattern,
        causalityDomain: trace.causalityDomain,
        scope: trace.scope,
        applicabilityTriggers: trace.applicabilityTriggers,
        exclusions: trace.exclusions
      });
    });
    const external = originateMentorSuccessExplanations({
      successObservations: [externalObservation],
      programmedCompetenceManifest: programmed
    });
    assert.equal(external.explanations.length, 0);
    assert.equal(external.nonCandidateDispositions[0].disposition,
      MENTOR_SUCCESS_DISPOSITION.EXTERNAL_CAUSE);

    const providerAuthored = rehashObservation(origin, (value) => {
      value.provenance.providerAuthored = true;
    });
    assert.throws(
      () => validateAuthenticatedProductSuccessObservation(providerAuthored),
      /MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_PROVENANCE_PROHIBITED/
    );

    const contradictory = rehashObservation(origin, (value) => {
      value.productOutput.outputIdentity = digest("contradictory-output-identity");
    });
    const contradictoryInventory = {
      ...oneObservationInventory,
      authenticatedSuccessCount: 2,
      authenticatedSuccessObservations: [origin, contradictory],
      inventoryHash: ""
    };
    contradictoryInventory.inventoryHash = sha256Object(contradictoryInventory);
    const contradiction = originateMentorSuccessExplanations({
      successObservations: contradictoryInventory.authenticatedSuccessObservations,
      programmedCompetenceManifest: programmed
    });
    assert.equal(contradiction.explanations.length, 0);
    assert.equal(contradiction.nonCandidateDispositions.length, 2);
    assert(contradiction.nonCandidateDispositions.every((item) => (
      item.disposition === MENTOR_SUCCESS_DISPOSITION.CONTRADICTORY_EVIDENCE
    )));

    const changedTrials = structuredClone(candidate);
    changedTrials.fixedTrialRequirements[0].requiredCount = 1;
    changedTrials.candidateHash = "";
    changedTrials.candidateHash = sha256Object(changedTrials);
    assert(reviewLessonCandidate(changedTrials).reasons.includes("FIXED_TRIAL_REQUIREMENTS_INVALID"));
    assert.deepEqual(networkGuard.attempts, []);
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});

test("success inventory rejects tamper, replay, substitution, insertion, deletion, and reordering", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-success-integrity-"));
  try {
    const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "success-integrity-scope" });
    const record = await recordOutcome(adapter, "integrity-success", 1);
    const artifact = successArtifact(record);
    const tampered = structuredClone(artifact);
    tampered.policyVersion = "TAMPERED_POLICY";
    tampered.artifactHash = digest("tampered-artifact-hash");
    const substitutedCore = structuredClone(artifact);
    delete substitutedCore.artifactHash;
    substitutedCore.productOutput.outputHash = digest("substituted-output");
    const substituted = sealStoredProductSuccessArtifact(substitutedCore);
    const insertedCore = structuredClone(artifact);
    delete insertedCore.artifactHash;
    insertedCore.episodeId = "inserted-episode";
    insertedCore.outcomeId = digest("inserted-outcome");
    const inserted = sealStoredProductSuccessArtifact(insertedCore);
    const deletedCore = structuredClone(artifact);
    delete deletedCore.artifactHash;
    deletedCore.providerResponses = [];
    const deleted = sealStoredProductSuccessArtifact(deletedCore);
    const reordered = structuredClone(artifact);
    reordered.providerResponses.reverse();
    reordered.artifactHash = digest("reordered-artifact-hash");
    const inventory = await adapter.inventoryAuthenticatedProductSuccesses({
      frozenSuccessArtifacts: [artifact, artifact, tampered, substituted, inserted, deleted, reordered]
    });
    assert.equal(inventory.authenticatedSuccessCount, 1);
    assert.equal(inventory.rejectedArtifactCount, 6);
    const reasons = inventory.rejectedArtifacts.flatMap((item) => item.reasons);
    assert(reasons.includes("ARTIFACT_REPLAY"));
    assert(reasons.includes("PRODUCT_SUCCESS_ARTIFACT_TAMPERED"), JSON.stringify(reasons));
    assert(reasons.includes("PRODUCT_SUCCESS_OUTCOME_BINDING"));
    assert(reasons.includes("PRODUCT_SUCCESS_OUTCOME_LEDGER_EVENT_MISSING"));
    assert(reasons.includes("PRODUCT_SUCCESS_BEHAVIOR_EVIDENCE_UNBOUND"));

    await recordOutcome(adapter, "integrity-second", 2);
    const ledgerSource = await readFile(adapter.paths.ledger, "utf8");
    const lines = ledgerSource.trimEnd().split("\n");
    const reorderedLedger = [...lines].reverse();
    await writeFile(adapter.paths.ledger, `${reorderedLedger.join("\n")}\n`, "utf8");
    await assert.rejects(
      adapter.inventoryAuthenticatedProductSuccesses({ frozenSuccessArtifacts: [artifact] }),
      (error) => ["LEARNING_LEDGER_ORDER", "LEARNING_LEDGER_TAMPERED"].includes(error.code)
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("unbound success-candidate nomination is rejected by the existing Governor adapter", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-success-nomination-"));
  try {
    const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity: "success-nomination-scope" });
    const governor = createCognitiveGovernor({ evaluationId: "unbound-success-nomination" });
    await assert.rejects(adapter.prepareEpisode({
      governor,
      episodeId: "unbound-success-nomination",
      episodeSequence: 1,
      queryFacets: {
        purpose: ["NEUTRAL_REVIEW"],
        researchEvidenceRisk: {
          ...evidenceRisk,
          canonicalIdentityUnresolvedCount: 1,
          unsupportedQueryTermCount: 1
        },
        frozenPreInterventionStateHash: digest("unbound-pre")
      },
      queryText: "unbound NOMINATE attempt",
      learningMode: "GOVERNED_TRIAL",
      trialRequest: {
        candidateId: "manually-injected-success-candidate",
        beforeArmEpisodeId: "unbound-before",
        afterArmEpisodeId: "unbound-success-nomination",
        frozenPreInterventionStateHash: digest("unbound-pre"),
        purpose: "ISOLATED_CAUSAL_QUALIFICATION"
      },
      createdAt: fixedTime
    }), (error) => error.code === "QUALIFICATION_TRIAL_NOMINATION_INVALID");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
