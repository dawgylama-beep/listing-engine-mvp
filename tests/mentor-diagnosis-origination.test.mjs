import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  MENTOR_DIAGNOSIS_DISPOSITION,
  originateMentorDiagnosisCandidates,
  validateMentorDiagnosisCandidate
} from "../lib/cognitive-governor/index.js";
import {
  CAUSALITY_DOMAIN,
  CAUSAL_MECHANISM,
  FAILURE_CLASSIFICATION,
  HISTORICAL_TRUST_CLASS,
  REFLECTION_OUTCOME,
  buildInertLessonCandidateFromMentorDiagnosis,
  buildReflectionObservation
} from "../lib/experience-reflection.js";
import { LESSON_GATE_STATE, reviewLessonCandidate } from "../lib/lesson-gate.js";
import { sha256Object } from "../lib/object-intelligence/stable.js";

function hash(label) {
  return sha256Object({ syntheticMentorFixture: label });
}

function observation(label, {
  objectClass = label,
  lineage = `${label}-lineage`,
  episode = `${label}-episode`,
  event = `${label}-event`,
  boundary = "CANONICAL_EVIDENCE_FINALIZATION",
  expectedState = "ACCEPTED_EVIDENCE_RETAINED",
  actualState = "ACCEPTED_EVIDENCE_DROPPED",
  outcome = REFLECTION_OUTCOME.FAILURE,
  causalityDomain = CAUSALITY_DOMAIN.INTERNAL,
  failureClassification = FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
  causalMechanism = CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION,
  counterexampleForSignatureHash = ""
} = {}) {
  return buildReflectionObservation({
    trustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    integrityVerified: true,
    sourceAggregateHash: hash(`${label}-aggregate`),
    sourceRecordHash: hash(`${label}-record`),
    sourceArtifactHash: hash(`${label}-artifact`),
    episodeIdentity: hash(episode),
    objectClassIdentity: hash(objectClass),
    causalEventIdentity: hash(event),
    sourceLineageIdentity: hash(lineage),
    customerPurpose: "WHATS_IT_WORTH",
    outcome,
    causalityDomain,
    failureClassification,
    causalMechanism,
    earliestSupportedLossBoundary: boundary,
    expectedState,
    actualState,
    terminalOutcome: outcome,
    counterexampleForSignatureHash
  });
}

function originate(episodeObservations) {
  return originateMentorDiagnosisCandidates({ episodeObservations });
}

test("authenticated internal failures originate a complete provisional causal diagnosis", () => {
  const report = originate([
    observation("ceramic-vessel", { objectClass: "rigid-vessel" }),
    observation("textile-carrier", { objectClass: "flexible-carrier" })
  ]);
  assert.equal(report.diagnoses.length, 1);
  const diagnosis = report.diagnoses[0];
  assert.equal(validateMentorDiagnosisCandidate(diagnosis), true);
  assert.match(diagnosis.diagnosisId, /^mentor-diagnosis-[a-f0-9]{24}$/);
  assert.equal(diagnosis.supportingEpisodes.length, 2);
  assert.equal(diagnosis.failureStage, "CANONICAL_EVIDENCE_FINALIZATION");
  assert.deepEqual(diagnosis.violatedInvariant, {
    expectedState: "ACCEPTED_EVIDENCE_RETAINED",
    actualState: "ACCEPTED_EVIDENCE_DROPPED"
  });
  assert.equal(diagnosis.causeVsSymptomEvidence.causalityDomain, "INTERNAL");
  assert.equal(diagnosis.confidence.band, "MODERATE");
  assert.ok(Array.isArray(diagnosis.competingExplanations));
  assert.ok(diagnosis.generalizedCorrectivePrinciple.length > 0);
  assert.ok(diagnosis.applicability);
  assert.ok(diagnosis.exclusions.length > 0);
  assert.equal(diagnosis.requiredFixedTrials.length, 4);
  assert.ok(diagnosis.expectedMeasurableImprovement);
  assert.ok(diagnosis.safetyAndTransferRisks.length > 0);
  assert.ok(diagnosis.rejectionConditions.length > 0);
  assert.ok(diagnosis.rollbackConditions.length > 0);
});

test("external insufficiency, provider failures, expected stops, and unresolved support do not become internal diagnoses", () => {
  const report = originate([
    observation("source-gap", {
      causalityDomain: CAUSALITY_DOMAIN.EXTERNAL,
      failureClassification: FAILURE_CLASSIFICATION.ISOLATED_SOURCE_CORRUPTION,
      causalMechanism: CAUSAL_MECHANISM.ISOLATED_SOURCE_CORRUPTION
    }),
    observation("provider-stop", {
      causalityDomain: CAUSALITY_DOMAIN.EXTERNAL,
      failureClassification: FAILURE_CLASSIFICATION.PROVIDER_OUTAGE,
      causalMechanism: CAUSAL_MECHANISM.EXTERNAL_PROVIDER_UNAVAILABLE
    }),
    observation("customer-stop", {
      outcome: REFLECTION_OUTCOME.EXPECTED_STOP,
      causalityDomain: CAUSALITY_DOMAIN.CUSTOMER_DEPENDENT,
      failureClassification: FAILURE_CLASSIFICATION.MISSING_CUSTOMER_INFORMATION,
      causalMechanism: CAUSAL_MECHANISM.MISSING_REQUIRED_CUSTOMER_DISCRIMINATOR
    }),
    observation("unresolved-stop", {
      outcome: REFLECTION_OUTCOME.UNRESOLVED,
      causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
      failureClassification: FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE,
      causalMechanism: CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE
    })
  ]);
  assert.equal(report.diagnoses.length, 0);
  assert.deepEqual(new Set(report.nonDiagnosticDispositions.map((entry) => entry.disposition)), new Set([
    MENTOR_DIAGNOSIS_DISPOSITION.EXTERNAL_CAUSAL_INSUFFICIENCY,
    MENTOR_DIAGNOSIS_DISPOSITION.PROVIDER_OR_TRANSPORT_FAILURE,
    MENTOR_DIAGNOSIS_DISPOSITION.EXPECTED_EXTERNAL_STOP,
    MENTOR_DIAGNOSIS_DISPOSITION.INSUFFICIENT_CAUSAL_SUPPORT
  ]));
});

test("a later failure in one authenticated lineage is retained as a downstream symptom", () => {
  const root = observation("root-boundary", {
    lineage: "shared-execution",
    event: "root-event",
    boundary: "IDENTITY_FORMATION",
    expectedState: "CANONICAL_IDENTITY_RETAINED",
    actualState: "CANONICAL_IDENTITY_REPLACED"
  });
  const symptom = observation("later-symptom", {
    lineage: "shared-execution",
    event: "later-event",
    boundary: "PURPOSE_JUDGMENT",
    expectedState: "PURPOSE_USES_CANONICAL_IDENTITY",
    actualState: "PURPOSE_USES_REPLACED_IDENTITY",
    causalMechanism: CAUSAL_MECHANISM.DUPLICATE_ACTION_REPEATED_WITHOUT_KNOWLEDGE_CHANGE
  });
  const report = originate([symptom, root]);
  assert.equal(report.diagnoses.length, 1);
  assert.equal(report.diagnoses[0].failureStage, "IDENTITY_FORMATION");
  assert.equal(report.diagnoses[0].causeVsSymptomEvidence.downstreamSymptoms.length, 1);
  assert.equal(report.diagnoses[0].causeVsSymptomEvidence.downstreamSymptoms[0].episodeIdentity, symptom.episodeIdentity);
  assert.equal(report.nonDiagnosticDispositions.some((entry) => (
    entry.observationHash === symptom.observationHash
    && entry.disposition === MENTOR_DIAGNOSIS_DISPOSITION.DOWNSTREAM_SYMPTOM
  )), true);
});

test("competing causes and successful counterevidence reduce confidence explicitly", () => {
  const cause = observation("primary-cause", { objectClass: "manual-tool" });
  const providerAlternative = observation("external-alternative", {
    boundary: cause.earliestSupportedLossBoundary,
    causalityDomain: CAUSALITY_DOMAIN.EXTERNAL,
    failureClassification: FAILURE_CLASSIFICATION.NETWORK_FAILURE,
    causalMechanism: CAUSAL_MECHANISM.NETWORK_TRANSPORT_FAILURE
  });
  const counterexample = observation("successful-counterexample", {
    boundary: cause.earliestSupportedLossBoundary,
    expectedState: cause.expectedState,
    actualState: "ACCEPTED_EVIDENCE_RETAINED",
    outcome: REFLECTION_OUTCOME.SUCCESS,
    causalityDomain: CAUSALITY_DOMAIN.NONE,
    failureClassification: FAILURE_CLASSIFICATION.NONE,
    causalMechanism: CAUSAL_MECHANISM.NO_CAUSAL_LOSS,
    counterexampleForSignatureHash: cause.causalSignatureHash
  });
  const diagnosis = originate([counterexample, providerAlternative, cause]).diagnoses[0];
  assert.equal(diagnosis.competingExplanations.some((entry) => (
    entry.explanationClass === "COMPETING_PROVIDER_OR_TRANSPORT_CAUSE"
  )), true);
  assert.equal(diagnosis.causeVsSymptomEvidence.counterevidence.length, 1);
  assert.equal(diagnosis.confidence.band, "LOW");
  assert.ok(diagnosis.confidence.uncertainty.includes("COUNTEREVIDENCE_REQUIRES_ADJUDICATION"));
  assert.ok(diagnosis.confidence.uncertainty.includes("COMPETING_EXPLANATIONS_REMAIN"));
});

test("contradictory or unauthenticated observations fail closed", () => {
  const first = observation("contradiction-a", { episode: "same-episode" });
  const second = observation("contradiction-b", {
    episode: "same-episode",
    expectedState: "GOVERNED_STATE_RETAINED",
    actualState: "GOVERNED_STATE_LOST"
  });
  const tampered = structuredClone(observation("tampered-observation"));
  tampered.actualState = "TAMPERED_STATE";
  const report = originate([first, tampered, second]);
  assert.equal(report.diagnoses.length, 0);
  assert.equal(report.nonDiagnosticDispositions.filter((entry) => (
    entry.disposition === MENTOR_DIAGNOSIS_DISPOSITION.CONTRADICTORY_EPISODE_EVIDENCE
  )).length, 2);
  assert.equal(report.nonDiagnosticDispositions.filter((entry) => (
    entry.disposition === MENTOR_DIAGNOSIS_DISPOSITION.UNAUTHENTICATED_EPISODE
  )).length, 1);
});

test("origination is deterministic, order invariant, duplicate-idempotent, and candidate hashes reject mutation", () => {
  const observations = [
    observation("garden-device", { objectClass: "powered-device" }),
    observation("paper-volume", { objectClass: "bound-paper" })
  ];
  const forward = originate(observations);
  const reversed = originate([...observations].reverse());
  const replayedDuplicate = originate([...observations, ...observations]);
  assert.deepEqual(reversed, forward);
  assert.deepEqual(replayedDuplicate, forward);
  const mutated = structuredClone(forward.diagnoses[0]);
  mutated.generalizedCorrectivePrinciple = "Use an object-specific exception.";
  assert.throws(() => validateMentorDiagnosisCandidate(mutated), /MENTOR_ORIGINATED_DIAGNOSIS_HASH_MISMATCH/);
});

test("originated diagnoses remain inert and contain no object or episode identity as a decision rule", async () => {
  const observations = [
    observation("distinct-alpha-object", { objectClass: "alpha-structure" }),
    observation("distinct-beta-object", { objectClass: "beta-structure" })
  ];
  const report = originate(observations);
  const diagnosis = report.diagnoses[0];
  for (const field of ["persistAsMemory", "promotionAuthorized", "runtimeConsumptionAuthorized", "productChangeAuthorized"]) {
    assert.equal(report[field], false);
    assert.equal(diagnosis[field], false);
  }
  const rule = diagnosis.generalizedCorrectivePrinciple;
  assert.doesNotMatch(rule, /distinct-alpha-object|distinct-beta-object|alpha-structure|beta-structure/i);
  for (const value of observations.flatMap((entry) => [entry.episodeIdentity, entry.objectClassIdentity, entry.observationHash])) {
    assert.equal(rule.includes(value), false);
  }
  const source = await readFile(new URL("../lib/cognitive-governor/mentor-guided-reasoning.js", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fetch\s*\(|requestOpenAI|providerRequest|child_process|node:fs|writeFile|appendFile|memoryPromotion/i);
  assert.doesNotMatch(source, /\b(?:V4|V5)-C\d+\b|qualification-run-001/i);
});

test("Mentor diagnoses become hash-addressed inert candidates without gaining lifecycle authority", () => {
  const diagnosis = originate([observation("single-supported-failure")]).diagnoses[0];
  const candidate = buildInertLessonCandidateFromMentorDiagnosis(diagnosis);
  assert.equal(candidate.origin.diagnosisId, diagnosis.diagnosisId);
  assert.equal(candidate.origin.diagnosisHash, diagnosis.candidateHash);
  assert.equal(candidate.supportingObservations[0].episodeIdentity, diagnosis.supportingEpisodes[0].episodeIdentity);
  assert.match(candidate.candidateId, /^lesson-candidate-[a-f0-9]{24}$/);
  assert.match(candidate.candidateHash, /^[a-f0-9]{64}$/);
  assert.equal(candidate.fixedTrialRequirementsHash, sha256Object(diagnosis.requiredFixedTrials));
  assert.deepEqual(candidate.fixedTrialRequirements, diagnosis.requiredFixedTrials);
  for (const field of [
    "persistAsMemory",
    "promotionAuthorized",
    "runtimeConsumptionAuthorized",
    "productChangeAuthorized",
    "providerLifecycleAuthority"
  ]) assert.equal(candidate[field], false, field);

  const governorReview = reviewLessonCandidate(candidate);
  assert.equal(governorReview.state, LESSON_GATE_STATE.PROOF_BLOCKED);
  assert.equal(governorReview.proofEligible, false);
  assert(governorReview.reasons.includes("INSUFFICIENT_INDEPENDENT_EPISODES"));
  assert(governorReview.reasons.includes("INSUFFICIENT_INDEPENDENT_OBJECT_CLASSES"));
});

test("the existing lesson Governor accepts only independently supported diagnosis-derived candidates for fixed proof", () => {
  const diagnosis = originate([
    observation("supported-one", { objectClass: "independent-one" }),
    observation("supported-two", { objectClass: "independent-two" })
  ]).diagnoses[0];
  const candidate = buildInertLessonCandidateFromMentorDiagnosis(diagnosis);
  const governorReview = reviewLessonCandidate(candidate);
  assert.equal(governorReview.state, LESSON_GATE_STATE.PROOF_REQUIRED);
  assert.equal(governorReview.proofEligible, true);
  assert.equal(governorReview.independentEpisodeCount, 2);
  assert.equal(governorReview.independentObjectClassCount, 2);
});
