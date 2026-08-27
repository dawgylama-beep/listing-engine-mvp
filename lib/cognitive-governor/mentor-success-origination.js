import assert from "node:assert/strict";
import { sha256Object, stableObjectJson } from "../object-intelligence/stable.js";

export const MENTOR_SUCCESS_ORIGINATION_SCHEMA_VERSION = "1.0";

export const MENTOR_SUCCESS_DISPOSITION = Object.freeze({
  NOVEL_SUCCESS_BEHAVIOR_SUPPORTED: "NOVEL_SUCCESS_BEHAVIOR_SUPPORTED",
  EXISTING_PROGRAMMED_COMPETENCE: "EXISTING_PROGRAMMED_COMPETENCE",
  INSUFFICIENT_CAUSAL_SUPPORT: "INSUFFICIENT_CAUSAL_SUPPORT",
  EXPECTED_SUCCESS_NO_LESSON: "EXPECTED_SUCCESS_NO_LESSON",
  EXTERNAL_CAUSE: "EXTERNAL_CAUSE",
  CONTRADICTORY_EVIDENCE: "CONTRADICTORY_EVIDENCE"
});

const MENTOR_HASH_PATTERN = /^[a-f0-9]{64}$/;
const MENTOR_TOKEN_PATTERN = /^[A-Z0-9_]+$/;

function record(value, code) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), code);
  return value;
}

function text(value, code, maximum = 500) {
  assert.equal(typeof value, "string", code);
  const normalized = value.normalize("NFKC").trim();
  assert.ok(normalized.length > 0 && normalized.length <= maximum, code);
  return normalized;
}

function array(value, code) {
  assert.ok(Array.isArray(value), code);
  return value;
}

function stringArray(value, code, { allowEmpty = false } = {}) {
  const values = array(value, code).map((item) => text(item, code, 180));
  if (!allowEmpty) assert.ok(values.length > 0, code);
  assert.equal(new Set(values).size, values.length, `${code}_DUPLICATE`);
  return values;
}

function integer(value, code) {
  assert.ok(Number.isInteger(value) && value >= 0, code);
  return value;
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function observationToken(value, code) {
  const normalized = text(value, code, 160);
  assert.match(normalized, MENTOR_TOKEN_PATTERN, code);
  return normalized;
}

function observationHash(value, code) {
  const normalized = text(value, code, 64);
  assert.match(normalized, MENTOR_HASH_PATTERN, code);
  return normalized;
}

function validateSuccessBehaviorTrace(value) {
  const trace = record(value, "MENTOR_SUCCESS_BEHAVIOR_TRACE_REQUIRED");
  const behaviorId = observationToken(trace.behaviorId, "MENTOR_SUCCESS_BEHAVIOR_ID_INVALID");
  const actionPattern = observationToken(trace.actionPattern, "MENTOR_SUCCESS_ACTION_PATTERN_INVALID");
  const causalityDomain = observationToken(trace.causalityDomain, "MENTOR_SUCCESS_CAUSALITY_DOMAIN_INVALID");
  assert.equal(["INTERNAL", "EXTERNAL"].includes(causalityDomain), true,
    "MENTOR_SUCCESS_CAUSALITY_DOMAIN_INVALID");
  const scope = stringArray(trace.scope, "MENTOR_SUCCESS_SCOPE_REQUIRED");
  const applicabilityTriggers = stringArray(
    trace.applicabilityTriggers,
    "MENTOR_SUCCESS_APPLICABILITY_REQUIRED"
  );
  const exclusions = stringArray(trace.exclusions, "MENTOR_SUCCESS_EXCLUSIONS_REQUIRED");
  const supportingEvidenceHashes = stringArray(
    trace.supportingEvidenceHashes,
    "MENTOR_SUCCESS_SUPPORTING_EVIDENCE_REQUIRED"
  ).map((value) => observationHash(value, "MENTOR_SUCCESS_SUPPORTING_EVIDENCE_HASH_INVALID"));
  const attribution = record(trace.causalAttribution, "MENTOR_SUCCESS_CAUSAL_ATTRIBUTION_REQUIRED");
  const baselineObservationHash = observationHash(
    attribution.baselineObservationHash,
    "MENTOR_SUCCESS_BASELINE_HASH_INVALID"
  );
  const treatmentObservationHash = observationHash(
    attribution.treatmentObservationHash,
    "MENTOR_SUCCESS_TREATMENT_HASH_INVALID"
  );
  assert.equal(typeof attribution.interventionOnlyDifference, "boolean",
    "MENTOR_SUCCESS_INTERVENTION_DIFFERENCE_BOOLEAN_REQUIRED");
  assert.equal(typeof attribution.evaluatorAttributionConfirmed, "boolean",
    "MENTOR_SUCCESS_EVALUATOR_ATTRIBUTION_BOOLEAN_REQUIRED");
  assert.equal(typeof attribution.externalContributionDominant, "boolean",
    "MENTOR_SUCCESS_EXTERNAL_CONTRIBUTION_BOOLEAN_REQUIRED");
  const behaviorSignatureCore = {
    behaviorId,
    actionPattern,
    causalityDomain,
    scope,
    applicabilityTriggers,
    exclusions
  };
  const core = {
    ...behaviorSignatureCore,
    supportingEvidenceHashes: uniqueSorted(supportingEvidenceHashes),
    causalAttribution: {
      baselineObservationHash,
      treatmentObservationHash,
      interventionOnlyDifference: attribution.interventionOnlyDifference,
      evaluatorAttributionConfirmed: attribution.evaluatorAttributionConfirmed,
      externalContributionDominant: attribution.externalContributionDominant
    },
    behaviorSignatureHash: sha256Object(behaviorSignatureCore)
  };
  const expected = sha256Object(behaviorSignatureCore);
  observationHash(trace.behaviorSignatureHash, "MENTOR_SUCCESS_BEHAVIOR_SIGNATURE_INVALID");
  assert.equal(trace.behaviorSignatureHash, expected, "MENTOR_SUCCESS_BEHAVIOR_SIGNATURE_MISMATCH");
  return Object.freeze({ ...core, behaviorSignatureHash: expected });
}

function validateIndependentSuccessEvaluation(value) {
  const evaluation = record(value, "MENTOR_SUCCESS_EVALUATION_REQUIRED");
  observationHash(evaluation.evaluationIdentity, "MENTOR_SUCCESS_EVALUATION_IDENTITY_INVALID");
  observationHash(evaluation.evaluatorIdentity, "MENTOR_SUCCESS_EVALUATOR_IDENTITY_INVALID");
  observationHash(evaluation.evaluationAuthorityIdentity, "MENTOR_SUCCESS_EVALUATION_AUTHORITY_INVALID");
  assert.equal(evaluation.result, "PASS", "MENTOR_SUCCESS_EVALUATION_NOT_PASSING");
  assert.equal(evaluation.independent, true, "MENTOR_SUCCESS_EVALUATION_NOT_INDEPENDENT");
  assert.equal(evaluation.selfEvaluation, false, "MENTOR_SUCCESS_SELF_EVALUATION_PROHIBITED");
  assert.equal(evaluation.providerAuthored, false, "MENTOR_SUCCESS_PROVIDER_EVALUATION_PROHIBITED");
  assert.equal(integer(evaluation.fatalRegressionCount, "MENTOR_SUCCESS_FATAL_REGRESSION_COUNT_INVALID"), 0,
    "MENTOR_SUCCESS_FATAL_REGRESSION_PRESENT");
  const dimensions = record(evaluation.dimensions, "MENTOR_SUCCESS_EVALUATION_DIMENSIONS_REQUIRED");
  for (const name of [
    "identityAccuracy",
    "purposeAccuracy",
    "conditionAccuracy",
    "evidenceTraceability",
    "uncertaintyCalibration",
    "decisionUsefulness",
    "schemaCoverage",
    "regressionSafety"
  ]) {
    assert.equal(typeof dimensions[name], "number", `MENTOR_SUCCESS_${name.toUpperCase()}_SCORE_INVALID`);
    assert.ok(dimensions[name] >= 0 && dimensions[name] <= 1,
      `MENTOR_SUCCESS_${name.toUpperCase()}_SCORE_INVALID`);
  }
  observationHash(evaluation.evaluationRecordHash, "MENTOR_SUCCESS_EVALUATION_HASH_INVALID");
  assert.equal(
    sha256Object({ ...evaluation, evaluationRecordHash: "" }),
    evaluation.evaluationRecordHash,
    "MENTOR_SUCCESS_EVALUATION_HASH_MISMATCH"
  );
  return JSON.parse(stableObjectJson(evaluation));
}

export function validateAuthenticatedProductSuccessObservation(value) {
  const observation = record(value, "MENTOR_AUTHENTICATED_SUCCESS_REQUIRED");
  assert.equal(observation.schemaVersion, MENTOR_SUCCESS_ORIGINATION_SCHEMA_VERSION,
    "MENTOR_AUTHENTICATED_SUCCESS_SCHEMA_INVALID");
  assert.equal(observation.recordType, "AUTHENTICATED_PRODUCT_SUCCESS_OBSERVATION",
    "MENTOR_AUTHENTICATED_SUCCESS_TYPE_INVALID");
  assert.equal(observation.authenticationState, "LEDGER_AUTHENTICATED",
    "MENTOR_AUTHENTICATED_SUCCESS_LEDGER_AUTHORITY_REQUIRED");
  assert.equal(observation.outcome, "SUCCESS", "MENTOR_AUTHENTICATED_SUCCESS_OUTCOME_INVALID");
  assert.equal(observation.sourceTrustClass, "SEALED_AUTHORITATIVE_EXPERIENCE",
    "MENTOR_AUTHENTICATED_SUCCESS_TRUST_CLASS_INVALID");
  assert.equal(observation.sourceIntegrityValid, true, "MENTOR_AUTHENTICATED_SUCCESS_INTEGRITY_INVALID");
  assert.equal(observation.eligibleForLessonSupport, true,
    "MENTOR_AUTHENTICATED_SUCCESS_LESSON_SUPPORT_INVALID");
  assert.equal(observation.unresolvedFatalRegression, false,
    "MENTOR_AUTHENTICATED_SUCCESS_FATAL_REGRESSION_UNRESOLVED");
  assert.equal(observation.providerLifecycleAuthority, false,
    "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_AUTHORITY_PROHIBITED");
  assert.equal(typeof observation.expectedSuccessNoLesson, "boolean",
    "MENTOR_AUTHENTICATED_SUCCESS_EXPECTATION_BOOLEAN_REQUIRED");
  for (const [field, code] of [
    ["successObservationId", "MENTOR_AUTHENTICATED_SUCCESS_ID_INVALID"],
    ["sourceRecordHash", "MENTOR_AUTHENTICATED_SUCCESS_SOURCE_HASH_INVALID"],
    ["sourceArtifactHash", "MENTOR_AUTHENTICATED_SUCCESS_ARTIFACT_HASH_INVALID"],
    ["episodeIdentity", "MENTOR_AUTHENTICATED_SUCCESS_EPISODE_IDENTITY_INVALID"],
    ["objectClassIdentity", "MENTOR_AUTHENTICATED_SUCCESS_OBJECT_CLASS_INVALID"],
    ["outcomeIdentity", "MENTOR_AUTHENTICATED_SUCCESS_OUTCOME_IDENTITY_INVALID"],
    ["ledgerEventIdentity", "MENTOR_AUTHENTICATED_SUCCESS_LEDGER_EVENT_INVALID"],
    ["modelIdentityHash", "MENTOR_AUTHENTICATED_SUCCESS_MODEL_HASH_INVALID"],
    ["adapterIdentityHash", "MENTOR_AUTHENTICATED_SUCCESS_ADAPTER_HASH_INVALID"],
    ["policyIdentityHash", "MENTOR_AUTHENTICATED_SUCCESS_POLICY_HASH_INVALID"],
    ["activeLessonBundleIdentity", "MENTOR_AUTHENTICATED_SUCCESS_LESSON_BUNDLE_INVALID"],
    ["observationHash", "MENTOR_AUTHENTICATED_SUCCESS_HASH_INVALID"]
  ]) observationHash(observation[field], code);
  text(observation.episodeId, "MENTOR_AUTHENTICATED_SUCCESS_EPISODE_ID_REQUIRED", 160);
  text(observation.modelIdentity, "MENTOR_AUTHENTICATED_SUCCESS_MODEL_ID_REQUIRED", 160);
  text(observation.adapterIdentity, "MENTOR_AUTHENTICATED_SUCCESS_ADAPTER_ID_REQUIRED", 160);
  text(observation.policyVersion, "MENTOR_AUTHENTICATED_SUCCESS_POLICY_VERSION_REQUIRED", 80);
  text(observation.productSchemaVersion, "MENTOR_AUTHENTICATED_SUCCESS_PRODUCT_SCHEMA_REQUIRED", 80);
  const input = record(observation.inputBinding, "MENTOR_AUTHENTICATED_SUCCESS_INPUT_BINDING_REQUIRED");
  observationHash(input.inputIdentity, "MENTOR_AUTHENTICATED_SUCCESS_INPUT_IDENTITY_INVALID");
  observationHash(input.inputHash, "MENTOR_AUTHENTICATED_SUCCESS_INPUT_HASH_INVALID");
  if (input.imageIdentity) observationHash(input.imageIdentity, "MENTOR_AUTHENTICATED_SUCCESS_IMAGE_IDENTITY_INVALID");
  if (input.imageHash) observationHash(input.imageHash, "MENTOR_AUTHENTICATED_SUCCESS_IMAGE_HASH_INVALID");
  assert.equal(Boolean(input.imageIdentity), Boolean(input.imageHash),
    "MENTOR_AUTHENTICATED_SUCCESS_IMAGE_BINDING_INCOMPLETE");
  const providerResponses = array(
    observation.providerResponses,
    "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_RESPONSES_REQUIRED"
  );
  const providerResponseIdentities = new Set();
  for (const response of providerResponses) {
    record(response, "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_RESPONSE_INVALID");
    observationHash(response.requestIdentity, "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_REQUEST_INVALID");
    observationHash(response.responseIdentity, "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_RESPONSE_IDENTITY_INVALID");
    observationHash(response.responseHash, "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_RESPONSE_HASH_INVALID");
    assert.equal(response.providerAuthored, false, "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_AUTHORITY_PROHIBITED");
    assert.equal(providerResponseIdentities.has(response.responseIdentity), false,
      "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_RESPONSE_DUPLICATE");
    providerResponseIdentities.add(response.responseIdentity);
  }
  const output = record(observation.productOutput, "MENTOR_AUTHENTICATED_SUCCESS_OUTPUT_BINDING_REQUIRED");
  observationHash(output.outputIdentity, "MENTOR_AUTHENTICATED_SUCCESS_OUTPUT_IDENTITY_INVALID");
  observationHash(output.outputHash, "MENTOR_AUTHENTICATED_SUCCESS_OUTPUT_HASH_INVALID");
  const evaluation = validateIndependentSuccessEvaluation(observation.independentEvaluation);
  assert.notEqual(evaluation.evaluatorIdentity, observation.modelIdentityHash,
    "MENTOR_AUTHENTICATED_SUCCESS_MODEL_SELF_EVALUATION_PROHIBITED");
  assert.notEqual(evaluation.evaluatorIdentity, observation.adapterIdentityHash,
    "MENTOR_AUTHENTICATED_SUCCESS_ADAPTER_SELF_EVALUATION_PROHIBITED");
  const provenance = record(observation.provenance, "MENTOR_AUTHENTICATED_SUCCESS_PROVENANCE_REQUIRED");
  text(provenance.authorityClass, "MENTOR_AUTHENTICATED_SUCCESS_AUTHORITY_CLASS_REQUIRED", 120);
  text(provenance.sourceType, "MENTOR_AUTHENTICATED_SUCCESS_SOURCE_TYPE_REQUIRED", 120);
  observationHash(provenance.sourceIdentity, "MENTOR_AUTHENTICATED_SUCCESS_PROVENANCE_IDENTITY_INVALID");
  assert.equal(provenance.providerAuthored, false, "MENTOR_AUTHENTICATED_SUCCESS_PROVIDER_PROVENANCE_PROHIBITED");
  const traces = array(observation.behaviorTrace, "MENTOR_AUTHENTICATED_SUCCESS_BEHAVIOR_TRACE_REQUIRED")
    .map(validateSuccessBehaviorTrace);
  assert.ok(traces.length > 0, "MENTOR_AUTHENTICATED_SUCCESS_BEHAVIOR_TRACE_REQUIRED");
  assert.equal(new Set(traces.map((trace) => trace.behaviorSignatureHash)).size, traces.length,
    "MENTOR_AUTHENTICATED_SUCCESS_BEHAVIOR_TRACE_DUPLICATE");
  stringArray(observation.counterevidenceHashes, "MENTOR_AUTHENTICATED_SUCCESS_COUNTEREVIDENCE_REQUIRED", {
    allowEmpty: true
  }).forEach((value) => observationHash(value, "MENTOR_AUTHENTICATED_SUCCESS_COUNTEREVIDENCE_HASH_INVALID"));
  stringArray(observation.alternativeExplanations, "MENTOR_AUTHENTICATED_SUCCESS_ALTERNATIVES_REQUIRED", {
    allowEmpty: true
  });
  assert.equal(
    sha256Object({ ...observation, observationHash: "" }),
    observation.observationHash,
    "MENTOR_AUTHENTICATED_SUCCESS_HASH_MISMATCH"
  );
  return JSON.parse(stableObjectJson(observation));
}

export function createProgrammedCompetenceManifest(behaviorIds = []) {
  const core = {
    schemaVersion: MENTOR_SUCCESS_ORIGINATION_SCHEMA_VERSION,
    recordType: "KATHERINE_PROGRAMMED_COMPETENCE_MANIFEST",
    behaviorIds: uniqueSorted(stringArray(behaviorIds, "MENTOR_PROGRAMMED_COMPETENCE_ARRAY_REQUIRED", {
      allowEmpty: true
    }).map((value) => observationToken(value, "MENTOR_PROGRAMMED_COMPETENCE_ID_INVALID"))),
    providerLifecycleAuthority: false,
    manifestHash: ""
  };
  core.manifestHash = sha256Object(core);
  return Object.freeze(core);
}

function validateProgrammedCompetenceManifest(value) {
  const manifest = record(value, "MENTOR_PROGRAMMED_COMPETENCE_MANIFEST_REQUIRED");
  assert.equal(manifest.schemaVersion, MENTOR_SUCCESS_ORIGINATION_SCHEMA_VERSION,
    "MENTOR_PROGRAMMED_COMPETENCE_SCHEMA_INVALID");
  assert.equal(manifest.recordType, "KATHERINE_PROGRAMMED_COMPETENCE_MANIFEST",
    "MENTOR_PROGRAMMED_COMPETENCE_TYPE_INVALID");
  assert.equal(manifest.providerLifecycleAuthority, false, "MENTOR_PROGRAMMED_COMPETENCE_PROVIDER_AUTHORITY_PROHIBITED");
  stringArray(manifest.behaviorIds, "MENTOR_PROGRAMMED_COMPETENCE_ARRAY_REQUIRED", { allowEmpty: true })
    .forEach((value) => observationToken(value, "MENTOR_PROGRAMMED_COMPETENCE_ID_INVALID"));
  observationHash(manifest.manifestHash, "MENTOR_PROGRAMMED_COMPETENCE_HASH_INVALID");
  assert.equal(sha256Object({ ...manifest, manifestHash: "" }), manifest.manifestHash,
    "MENTOR_PROGRAMMED_COMPETENCE_HASH_MISMATCH");
  return JSON.parse(stableObjectJson(manifest));
}

function authenticatedSuccessReference(observation) {
  return Object.freeze({
    successObservationId: observation.successObservationId,
    observationHash: observation.observationHash,
    sourceRecordHash: observation.sourceRecordHash,
    sourceTrustClass: observation.sourceTrustClass,
    episodeId: observation.episodeId,
    episodeIdentity: observation.episodeIdentity,
    objectClassIdentity: observation.objectClassIdentity,
    ledgerEventIdentity: observation.ledgerEventIdentity,
    evaluationRecordHash: observation.independentEvaluation.evaluationRecordHash,
    outputHash: observation.productOutput.outputHash,
    activeLessonBundleIdentity: observation.activeLessonBundleIdentity
  });
}

function strongestSuccessBehavior(observation) {
  return [...observation.behaviorTrace].sort((left, right) => (
    right.supportingEvidenceHashes.length - left.supportingEvidenceHashes.length
    || left.behaviorSignatureHash.localeCompare(right.behaviorSignatureHash)
  ))[0];
}

function completeSuccessCausalSupport(trace) {
  return trace.causalityDomain === "INTERNAL"
    && trace.causalAttribution.interventionOnlyDifference
    && trace.causalAttribution.evaluatorAttributionConfirmed
    && !trace.causalAttribution.externalContributionDominant
    && trace.supportingEvidenceHashes.length >= 2;
}

function mentorSuccessDisposition(group, trace, programmed) {
  if (group.every((observation) => observation.expectedSuccessNoLesson)) {
    return {
      disposition: MENTOR_SUCCESS_DISPOSITION.EXPECTED_SUCCESS_NO_LESSON,
      basis: "THE_AUTHENTICATED_OUTCOME_MATCHES_AN_EXPECTED_SUCCESS_WITHOUT_A_NOVEL_BEHAVIOR_CLAIM"
    };
  }
  if (trace.causalityDomain === "EXTERNAL" || trace.causalAttribution.externalContributionDominant) {
    return {
      disposition: MENTOR_SUCCESS_DISPOSITION.EXTERNAL_CAUSE,
      basis: "THE_DOMINANT_AUTHENTICATED_SUCCESS_CAUSE_IS_EXTERNAL_TO_KATHERINE_BEHAVIOR"
    };
  }
  if (programmed.behaviorIds.includes(trace.behaviorId)) {
    return {
      disposition: MENTOR_SUCCESS_DISPOSITION.EXISTING_PROGRAMMED_COMPETENCE,
      basis: `BEHAVIOR_IS_PRESENT_IN_PROGRAMMED_COMPETENCE_MANIFEST:${programmed.manifestHash}`
    };
  }
  if (!group.some((observation) => completeSuccessCausalSupport(strongestSuccessBehavior(observation)))) {
    return {
      disposition: MENTOR_SUCCESS_DISPOSITION.INSUFFICIENT_CAUSAL_SUPPORT,
      basis: "AUTHENTICATED_SUCCESS_EXISTS_BUT_INTERVENTION_SPECIFIC_CAUSAL_SUPPORT_IS_INCOMPLETE"
    };
  }
  return {
    disposition: MENTOR_SUCCESS_DISPOSITION.NOVEL_SUCCESS_BEHAVIOR_SUPPORTED,
    basis: "AUTHENTICATED_INDEPENDENT_EVALUATION_AND_BOUND_CAUSAL_COMPARISON_SUPPORT_A_NOVEL_BEHAVIOR_HYPOTHESIS"
  };
}

function buildMentorSuccessExplanation(group, trace, programmed) {
  const observations = [...group].sort((left, right) => left.observationHash.localeCompare(right.observationHash));
  const independentEpisodeCount = new Set(observations.map((item) => item.episodeIdentity)).size;
  const independentObjectClassCount = new Set(observations.map((item) => item.objectClassIdentity)).size;
  const counterevidenceHashes = uniqueSorted(observations.flatMap((item) => item.counterevidenceHashes));
  const alternativeExplanations = uniqueSorted(observations.flatMap((item) => item.alternativeExplanations));
  let confidenceScore = independentObjectClassCount >= 3 ? 0.86 : independentObjectClassCount === 2 ? 0.72 : 0.46;
  confidenceScore -= Math.min(counterevidenceHashes.length, 2) * 0.12;
  confidenceScore -= Math.min(alternativeExplanations.length, 2) * 0.06;
  confidenceScore = Math.max(0.1, Number(confidenceScore.toFixed(2)));
  const uncertainty = uniqueSorted([
    "BOUNDED_TO_LEDGER_AUTHENTICATED_SUCCESS_OBSERVATIONS",
    independentEpisodeCount < 3 ? "ADDITIONAL_INDEPENDENT_TRIALS_REQUIRED" : "FIXED_TRANSFER_TRIALS_REQUIRED",
    counterevidenceHashes.length ? "AUTHENTICATED_COUNTEREVIDENCE_REQUIRES_ADJUDICATION" : "NO_AUTHENTICATED_COUNTEREVIDENCE_OBSERVED",
    alternativeExplanations.length ? "ALTERNATIVE_EXPLANATIONS_REMAIN" : "NO_RECORDED_ALTERNATIVE_EXPLANATION"
  ]);
  const core = {
    schemaVersion: MENTOR_SUCCESS_ORIGINATION_SCHEMA_VERSION,
    recordType: "MENTOR_SUCCESS_EXPLANATION",
    status: "PROVISIONAL_SUCCESS_EXPLANATION_ONLY",
    disposition: MENTOR_SUCCESS_DISPOSITION.NOVEL_SUCCESS_BEHAVIOR_SUPPORTED,
    programmedCompetenceManifestHash: programmed.manifestHash,
    originatingSuccessObservation: authenticatedSuccessReference(observations[0]),
    supportingSuccessObservations: observations.map(authenticatedSuccessReference),
    independentEpisodeCount,
    independentObjectClassCount,
    generalizedBehavior: {
      behaviorId: trace.behaviorId,
      actionPattern: trace.actionPattern,
      behaviorSignatureHash: trace.behaviorSignatureHash,
      principle: `Apply ${trace.actionPattern} only when the authenticated applicability triggers are present.`,
      scope: uniqueSorted(trace.scope),
      applicabilityTriggers: uniqueSorted(trace.applicabilityTriggers),
      exclusions: uniqueSorted(trace.exclusions)
    },
    causalEvidence: {
      supportingEvidenceHashes: uniqueSorted(observations.flatMap((item) => strongestSuccessBehavior(item).supportingEvidenceHashes)),
      baselineObservationHashes: uniqueSorted(observations.map((item) => strongestSuccessBehavior(item).causalAttribution.baselineObservationHash)),
      treatmentObservationHashes: uniqueSorted(observations.map((item) => strongestSuccessBehavior(item).causalAttribution.treatmentObservationHash)),
      evaluationRecordHashes: uniqueSorted(observations.map((item) => item.independentEvaluation.evaluationRecordHash)),
      ledgerEventIdentities: uniqueSorted(observations.map((item) => item.ledgerEventIdentity)),
      counterevidenceHashes,
      alternativeExplanations
    },
    confidence: {
      score: confidenceScore,
      band: confidenceScore >= 0.8 ? "HIGH" : confidenceScore >= 0.6 ? "MODERATE" : "LOW",
      basis: [
        `AUTHENTICATED_SUCCESS_EPISODES:${independentEpisodeCount}`,
        `INDEPENDENT_OBJECT_CLASSES:${independentObjectClassCount}`,
        `COUNTEREVIDENCE:${counterevidenceHashes.length}`,
        `ALTERNATIVE_EXPLANATIONS:${alternativeExplanations.length}`
      ]
    },
    uncertainty,
    risks: [
      "ONE_EXAMPLE_COINCIDENCE",
      "OBJECT_OR_IMAGE_OVERFIT",
      "EXISTING_COMPETENCE_MISLABELED_AS_LEARNING",
      "NEUTRAL_OR_HARMFUL_TRANSFER",
      "SAME_PROCESS_PERSISTENCE_FALSE_POSITIVE"
    ],
    fixedTrialRequirements: [
      { trialClass: "APPLICABLE_INTERVENTION", requiredCount: 2, successCriterion: "INDEPENDENT_HELD_OUT_CASE_IMPROVES_WITHOUT_VIOLATION_INCREASE" },
      { trialClass: "NON_APPLICABLE_CONTROL", requiredCount: 1, successCriterion: "NON_APPLICABLE_CASE_REMAINS_UNCHANGED" }
    ],
    rejectionConditions: [
      "ORIGINATING_EPISODE_REUSED",
      "INDEPENDENT_OBJECT_CLASS_DIVERSITY_MISSING",
      "CAUSAL_CHAIN_INCOMPLETE",
      "MEAN_IMPROVEMENT_BELOW_EXISTING_THRESHOLD",
      "CASE_REGRESSION_OBSERVED",
      "PROVIDER_AUTHORITY_ASSERTED"
    ],
    rollbackConditions: [
      "LATER_APPLICATION_REGRESSES_ANY_MEASURED_DIMENSION",
      "APPLICABILITY_SELECTS_AN_EXCLUDED_CASE",
      "FRESH_PROCESS_RECONSTRUCTION_FAILS",
      "SAFETY_OR_EVIDENCE_TRACEABILITY_REGRESSES"
    ],
    persistAsMemory: false,
    qualificationAuthorized: false,
    promotionAuthorized: false,
    runtimeConsumptionAuthorized: false,
    productChangeAuthorized: false,
    publicationAuthorized: false,
    providerLifecycleAuthority: false,
    explanationId: "",
    explanationHash: ""
  };
  const seed = sha256Object(core);
  const explanation = {
    ...core,
    explanationId: `mentor-success-${seed.slice(0, 24)}`,
    explanationHash: ""
  };
  explanation.explanationHash = sha256Object(explanation);
  return Object.freeze(explanation);
}

export function validateMentorSuccessExplanation(value) {
  const explanation = record(value, "MENTOR_SUCCESS_EXPLANATION_REQUIRED");
  assert.equal(explanation.schemaVersion, MENTOR_SUCCESS_ORIGINATION_SCHEMA_VERSION,
    "MENTOR_SUCCESS_EXPLANATION_SCHEMA_INVALID");
  assert.equal(explanation.recordType, "MENTOR_SUCCESS_EXPLANATION",
    "MENTOR_SUCCESS_EXPLANATION_TYPE_INVALID");
  assert.equal(explanation.status, "PROVISIONAL_SUCCESS_EXPLANATION_ONLY",
    "MENTOR_SUCCESS_EXPLANATION_STATUS_INVALID");
  assert.equal(explanation.disposition, MENTOR_SUCCESS_DISPOSITION.NOVEL_SUCCESS_BEHAVIOR_SUPPORTED,
    "MENTOR_SUCCESS_EXPLANATION_DISPOSITION_INVALID");
  text(explanation.explanationId, "MENTOR_SUCCESS_EXPLANATION_ID_REQUIRED", 120);
  observationHash(explanation.explanationHash, "MENTOR_SUCCESS_EXPLANATION_HASH_INVALID");
  observationHash(explanation.programmedCompetenceManifestHash,
    "MENTOR_SUCCESS_EXPLANATION_PROGRAMMED_MANIFEST_HASH_INVALID");
  record(explanation.originatingSuccessObservation, "MENTOR_SUCCESS_EXPLANATION_ORIGIN_REQUIRED");
  assert.ok(array(explanation.supportingSuccessObservations, "MENTOR_SUCCESS_EXPLANATION_SUPPORT_REQUIRED").length > 0,
    "MENTOR_SUCCESS_EXPLANATION_SUPPORT_REQUIRED");
  record(explanation.generalizedBehavior, "MENTOR_SUCCESS_EXPLANATION_BEHAVIOR_REQUIRED");
  observationToken(explanation.generalizedBehavior.behaviorId, "MENTOR_SUCCESS_EXPLANATION_BEHAVIOR_ID_INVALID");
  observationToken(explanation.generalizedBehavior.actionPattern, "MENTOR_SUCCESS_EXPLANATION_ACTION_INVALID");
  observationHash(explanation.generalizedBehavior.behaviorSignatureHash,
    "MENTOR_SUCCESS_EXPLANATION_BEHAVIOR_SIGNATURE_INVALID");
  record(explanation.causalEvidence, "MENTOR_SUCCESS_EXPLANATION_CAUSAL_EVIDENCE_REQUIRED");
  record(explanation.confidence, "MENTOR_SUCCESS_EXPLANATION_CONFIDENCE_REQUIRED");
  assert.ok(array(explanation.uncertainty, "MENTOR_SUCCESS_EXPLANATION_UNCERTAINTY_REQUIRED").length > 0);
  assert.ok(array(explanation.risks, "MENTOR_SUCCESS_EXPLANATION_RISKS_REQUIRED").length > 0);
  assert.ok(array(explanation.fixedTrialRequirements, "MENTOR_SUCCESS_EXPLANATION_TRIALS_REQUIRED").length > 0);
  assert.ok(array(explanation.rejectionConditions, "MENTOR_SUCCESS_EXPLANATION_REJECTION_REQUIRED").length > 0);
  assert.ok(array(explanation.rollbackConditions, "MENTOR_SUCCESS_EXPLANATION_ROLLBACK_REQUIRED").length > 0);
  for (const field of [
    "persistAsMemory",
    "qualificationAuthorized",
    "promotionAuthorized",
    "runtimeConsumptionAuthorized",
    "productChangeAuthorized",
    "publicationAuthorized",
    "providerLifecycleAuthority"
  ]) assert.equal(explanation[field], false, `MENTOR_SUCCESS_EXPLANATION_${field.toUpperCase()}_MUST_BE_FALSE`);
  assert.equal(sha256Object({ ...explanation, explanationHash: "" }), explanation.explanationHash,
    "MENTOR_SUCCESS_EXPLANATION_HASH_MISMATCH");
  return true;
}

export function originateMentorSuccessExplanations(input = {}) {
  const request = record(input, "MENTOR_SUCCESS_ORIGINATION_INPUT_REQUIRED");
  const received = array(request.successObservations, "MENTOR_SUCCESS_OBSERVATIONS_REQUIRED");
  const programmed = validateProgrammedCompetenceManifest(request.programmedCompetenceManifest);
  const dispositions = [];
  const authenticatedByHash = new Map();
  for (const raw of received) {
    try {
      const observation = validateAuthenticatedProductSuccessObservation(raw);
      if (!authenticatedByHash.has(observation.observationHash)) authenticatedByHash.set(observation.observationHash, observation);
    } catch {
      dispositions.push(Object.freeze({
        successObservationId: String(raw?.successObservationId || "UNAUTHENTICATED"),
        observationHash: MENTOR_HASH_PATTERN.test(String(raw?.observationHash || ""))
          ? raw.observationHash
          : sha256Object(raw || {}),
        behaviorId: "UNRESOLVED",
        disposition: MENTOR_SUCCESS_DISPOSITION.INSUFFICIENT_CAUSAL_SUPPORT,
        basis: "LEDGER_AUTHENTICATED_PRODUCT_SUCCESS_REQUIRED"
      }));
    }
  }
  const authenticated = [...authenticatedByHash.values()]
    .sort((left, right) => left.observationHash.localeCompare(right.observationHash));
  const episodeVariants = new Map();
  for (const observation of authenticated) {
    if (!episodeVariants.has(observation.episodeIdentity)) episodeVariants.set(observation.episodeIdentity, []);
    episodeVariants.get(observation.episodeIdentity).push(observation);
  }
  const contradictoryHashes = new Set();
  for (const variants of episodeVariants.values()) {
    if (variants.length < 2) continue;
    for (const observation of variants) {
      contradictoryHashes.add(observation.observationHash);
      dispositions.push(Object.freeze({
        successObservationId: observation.successObservationId,
        observationHash: observation.observationHash,
        behaviorId: strongestSuccessBehavior(observation).behaviorId,
        disposition: MENTOR_SUCCESS_DISPOSITION.CONTRADICTORY_EVIDENCE,
        basis: "ONE_EPISODE_IDENTITY_HAS_MULTIPLE_LEDGER_AUTHENTICATED_SUCCESS_OBSERVATIONS"
      }));
    }
  }
  const consistent = authenticated.filter((observation) => !contradictoryHashes.has(observation.observationHash));
  const groups = new Map();
  for (const observation of consistent) {
    const trace = strongestSuccessBehavior(observation);
    if (!groups.has(trace.behaviorSignatureHash)) groups.set(trace.behaviorSignatureHash, { trace, observations: [] });
    groups.get(trace.behaviorSignatureHash).observations.push(observation);
  }
  const explanations = [];
  for (const group of [...groups.values()].sort((left, right) => (
    left.trace.behaviorSignatureHash.localeCompare(right.trace.behaviorSignatureHash)
  ))) {
    const assessment = mentorSuccessDisposition(group.observations, group.trace, programmed);
    if (assessment.disposition === MENTOR_SUCCESS_DISPOSITION.NOVEL_SUCCESS_BEHAVIOR_SUPPORTED) {
      explanations.push(buildMentorSuccessExplanation(group.observations, group.trace, programmed));
      continue;
    }
    for (const observation of group.observations) dispositions.push(Object.freeze({
      successObservationId: observation.successObservationId,
      observationHash: observation.observationHash,
      behaviorId: group.trace.behaviorId,
      disposition: assessment.disposition,
      basis: assessment.basis
    }));
  }
  explanations.sort((left, right) => left.explanationId.localeCompare(right.explanationId));
  dispositions.sort((left, right) => (
    left.disposition.localeCompare(right.disposition)
    || left.observationHash.localeCompare(right.observationHash)
  ));
  explanations.forEach(validateMentorSuccessExplanation);
  const report = {
    schemaVersion: MENTOR_SUCCESS_ORIGINATION_SCHEMA_VERSION,
    recordType: "MENTOR_SUCCESS_ORIGINATION_REPORT",
    programmedCompetenceManifestHash: programmed.manifestHash,
    authenticatedObservationCount: authenticated.length,
    consistentObservationCount: consistent.length,
    explanations,
    nonCandidateDispositions: dispositions,
    persistAsMemory: false,
    qualificationAuthorized: false,
    promotionAuthorized: false,
    runtimeConsumptionAuthorized: false,
    productChangeAuthorized: false,
    publicationAuthorized: false,
    providerLifecycleAuthority: false,
    reportHash: ""
  };
  report.reportHash = sha256Object(report);
  return Object.freeze(report);
}
