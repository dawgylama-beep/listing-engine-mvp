import {
  cleanObjectText,
  sha256Object,
  stableInternalId,
  stableObjectJson
} from "./object-intelligence/stable.js";
import {
  calculateExperienceRecordHash,
  validateFinalExperienceAttestation,
  verifyFailureEnvelope
} from "./terminal-evidence.js";
import { EXPERIENCE_RECORD_SCHEMA_VERSION } from "./object-intelligence/experience.js";
import { COGNITIVE_EPISODE_SCHEMA_VERSION } from "./cognitive-governor/constants.js";

export const REFLECTION_OBSERVATION_SCHEMA_VERSION = "1.0";
export const CAUSAL_SIGNATURE_SCHEMA_VERSION = "1.0";
export const RETROSPECTIVE_LESSON_CANDIDATE_SCHEMA_VERSION = "1.0";
export const RETROSPECTIVE_REFLECTION_REPORT_SCHEMA_VERSION = "1.0";
export const MAX_RETROSPECTIVE_LESSON_CANDIDATE_BYTES = 65536;

export const HISTORICAL_TRUST_CLASS = Object.freeze({
  SEALED_AUTHORITATIVE_EXPERIENCE: "SEALED_AUTHORITATIVE_EXPERIENCE",
  FROZEN_VERIFIED_DIAGNOSTIC: "FROZEN_VERIFIED_DIAGNOSTIC",
  UNVERIFIED_LEGACY: "UNVERIFIED_LEGACY"
});

export const CAUSALITY_DOMAIN = Object.freeze({
  INTERNAL: "INTERNAL",
  EXTERNAL: "EXTERNAL",
  CUSTOMER_DEPENDENT: "CUSTOMER_DEPENDENT",
  SAFETY_DEPENDENT: "SAFETY_DEPENDENT",
  UNRESOLVED: "UNRESOLVED",
  NONE: "NONE"
});

export const REFLECTION_OUTCOME = Object.freeze({
  FAILURE: "FAILURE",
  SUCCESS: "SUCCESS",
  EXPECTED_STOP: "EXPECTED_STOP",
  UNRESOLVED: "UNRESOLVED"
});

export const FAILURE_CLASSIFICATION = Object.freeze({
  SYSTEM_LOGIC_DEFECT: "SYSTEM_LOGIC_DEFECT",
  EXPERIENCE_INTEGRITY_DEFECT: "EXPERIENCE_INTEGRITY_DEFECT",
  PROVIDER_OUTAGE: "PROVIDER_OUTAGE",
  NETWORK_FAILURE: "NETWORK_FAILURE",
  MISSING_CUSTOMER_INFORMATION: "MISSING_CUSTOMER_INFORMATION",
  MALFORMED_CUSTOMER_INPUT: "MALFORMED_CUSTOMER_INPUT",
  UNSUPPORTED_OBJECT_IDENTITY: "UNSUPPORTED_OBJECT_IDENTITY",
  EXPECTED_EVIDENCE_INSUFFICIENCY: "EXPECTED_EVIDENCE_INSUFFICIENCY",
  SAFETY_REFUSAL: "SAFETY_REFUSAL",
  ISOLATED_SOURCE_CORRUPTION: "ISOLATED_SOURCE_CORRUPTION",
  UNRESOLVED_CAUSE: "UNRESOLVED_CAUSE",
  NONE: "NONE"
});

export const CAUSAL_MECHANISM = Object.freeze({
  QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION: "QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION",
  DUPLICATE_ACTION_REPEATED_WITHOUT_KNOWLEDGE_CHANGE: "DUPLICATE_ACTION_REPEATED_WITHOUT_KNOWLEDGE_CHANGE",
  EXPERIENCE_ATTESTATION_INTEGRITY_LOSS: "EXPERIENCE_ATTESTATION_INTEGRITY_LOSS",
  MISSING_REQUIRED_CUSTOMER_DISCRIMINATOR: "MISSING_REQUIRED_CUSTOMER_DISCRIMINATOR",
  MALFORMED_CUSTOMER_INPUT: "MALFORMED_CUSTOMER_INPUT",
  UNSUPPORTED_OBJECT_IDENTITY: "UNSUPPORTED_OBJECT_IDENTITY",
  VERIFIED_EVIDENCE_INSUFFICIENT: "VERIFIED_EVIDENCE_INSUFFICIENT",
  EXTERNAL_PROVIDER_UNAVAILABLE: "EXTERNAL_PROVIDER_UNAVAILABLE",
  NETWORK_TRANSPORT_FAILURE: "NETWORK_TRANSPORT_FAILURE",
  SAFETY_BASED_REFUSAL: "SAFETY_BASED_REFUSAL",
  ISOLATED_SOURCE_CORRUPTION: "ISOLATED_SOURCE_CORRUPTION",
  UNRESOLVED_TERMINAL_FAILURE: "UNRESOLVED_TERMINAL_FAILURE",
  NO_CAUSAL_LOSS: "NO_CAUSAL_LOSS"
});

export const LESSON_CANDIDATE_STATUS = Object.freeze({
  PROPOSED_ONLY: "PROPOSED_ONLY"
});

const TRUST_CLASSES = new Set(Object.values(HISTORICAL_TRUST_CLASS));
const DOMAINS = new Set(Object.values(CAUSALITY_DOMAIN));
const OUTCOMES = new Set(Object.values(REFLECTION_OUTCOME));
const CLASSIFICATIONS = new Set(Object.values(FAILURE_CLASSIFICATION));
const MECHANISMS = new Set(Object.values(CAUSAL_MECHANISM));
const HASH_PATTERN = /^[a-f0-9]{64}$/;

const PURPOSES = new Set([
  "PERSONAL_BUY",
  "RESALE",
  "WHATS_IT_WORTH",
  "MARKETPLACE_LISTING",
  "UNKNOWN"
]);

const CAUSAL_TEMPLATES = Object.freeze({
  [CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION]: {
    problem: "Evidence accepted by the authoritative qualification boundary can be lost before canonical finalization.",
    requiredBehavior: "PRESERVE_QUALIFIED_EVIDENCE_OR_RECORD_AN_EXPLICIT_AUTHORITATIVE_REJECTION",
    forbiddenBehavior: "SILENTLY_DROP_QUALIFIED_EVIDENCE_BEFORE_FINALIZATION",
    evidenceRequired: ["AUTHORITATIVE_QUALIFICATION", "ORDERED_FINALIZATION_DISPOSITION"],
    regression: ["QUALIFIED_EVIDENCE_SURVIVES_FINALIZATION", "REJECTION_REQUIRES_CANONICAL_REASON"]
  },
  [CAUSAL_MECHANISM.DUPLICATE_ACTION_REPEATED_WITHOUT_KNOWLEDGE_CHANGE]: {
    problem: "A controlled cognitive action can repeat after the knowledge state is unchanged.",
    requiredBehavior: "BLOCK_SEMANTICALLY_DUPLICATE_ACTIONS_WHEN_KNOWLEDGE_IS_UNCHANGED",
    forbiddenBehavior: "REPEAT_A_CONTROLLED_ACTION_WITHOUT_NEW_KNOWLEDGE",
    evidenceRequired: ["ACTION_SIGNATURE", "INPUT_AND_OUTPUT_KNOWLEDGE_HASHES"],
    regression: ["UNCHANGED_KNOWLEDGE_BLOCKS_DUPLICATE_ACTION", "MATERIAL_CHANGE_ALLOWS_RECONSIDERATION"]
  },
  [CAUSAL_MECHANISM.EXPERIENCE_ATTESTATION_INTEGRITY_LOSS]: {
    problem: "A terminal Experience Record can diverge from its sealed hash or response-bound proof.",
    requiredBehavior: "REVALIDATE_THE_FINAL_RESPONSE_BOUND_EXPERIENCE_BEFORE_EMISSION",
    forbiddenBehavior: "EMIT_POST_SEAL_EXPERIENCE_MUTATIONS",
    evidenceRequired: ["STORED_HASH", "RECALCULATED_HASH", "EPISODE_LINK", "PROOF_LINK"],
    regression: ["POST_SEAL_MUTATION_IS_REJECTED", "FINAL_RESPONSE_REVALIDATES_EXPERIENCE_ATTESTATION"]
  }
});

function canonicalToken(value, fallback = "UNKNOWN", maximumCharacters = 100) {
  const token = cleanObjectText(value, maximumCharacters)
    .normalize("NFKC")
    .toUpperCase()
    .replace(/HTTPS?[^\s]*/g, "")
    .replace(/\b[A-Z]{2,12}[-_]?\d+\b/g, "IDENTIFIER")
    .replace(/\b[A-F0-9]{32,}\b/g, "HASH")
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, maximumCharacters);
  return token || fallback;
}

function controlledToken(value, allowed, fallback) {
  const token = canonicalToken(value, fallback);
  return allowed.has(token) ? token : fallback;
}

function identityHash(prefix, value) {
  const text = cleanObjectText(value, 240);
  if (HASH_PATTERN.test(text)) return text;
  return sha256Object({ namespace: prefix, value: text || "UNAVAILABLE" });
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function recalculateEmbeddedHash(value, field) {
  if (!value || typeof value !== "object") return "";
  return sha256Object({ ...value, [field]: "" });
}

function sourceRecordIdentity(hash = "") {
  return stableInternalId("reflection-source", hash || "unverified", 24);
}

function trustValidationFailure(trustClass, failures) {
  return {
    valid: false,
    trustClass,
    eligibleForLessonSupport: false,
    failures: uniqueSorted(failures)
  };
}

export function validateHistoricalReflectionSource(source = {}) {
  const trustClass = controlledToken(
    source.trustClass,
    TRUST_CLASSES,
    HISTORICAL_TRUST_CLASS.UNVERIFIED_LEGACY
  );
  if (trustClass === HISTORICAL_TRUST_CLASS.UNVERIFIED_LEGACY) {
    return trustValidationFailure(trustClass, ["LEGACY_PROVENANCE_UNVERIFIED"]);
  }
  if (trustClass === HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC) {
    const failures = [];
    if (source.integrityVerified !== true) failures.push("FROZEN_AGGREGATE_NOT_VERIFIED");
    if (!HASH_PATTERN.test(cleanObjectText(source.sourceAggregateHash, 80))) failures.push("FROZEN_AGGREGATE_HASH_MISSING");
    if (!HASH_PATTERN.test(cleanObjectText(source.sourceRecordHash, 80))) failures.push("FROZEN_RECORD_HASH_MISSING");
    return failures.length
      ? trustValidationFailure(trustClass, failures)
      : { valid: true, trustClass, eligibleForLessonSupport: true, failures: [] };
  }

  const failures = [];
  const experienceRecord = source.experienceRecord;
  const cognitiveEpisode = source.cognitiveEpisode;
  const governorProof = source.governorProof;
  if (experienceRecord?.schemaVersion !== EXPERIENCE_RECORD_SCHEMA_VERSION) failures.push("EXPERIENCE_SCHEMA_UNSUPPORTED");
  if (cognitiveEpisode?.schemaVersion !== COGNITIVE_EPISODE_SCHEMA_VERSION) failures.push("COGNITIVE_EPISODE_SCHEMA_UNSUPPORTED");
  const storedExperienceHash = cleanObjectText(experienceRecord?.experienceRecordHash, 80);
  if (!HASH_PATTERN.test(storedExperienceHash)) failures.push("EXPERIENCE_HASH_MISSING");
  if (experienceRecord && storedExperienceHash !== calculateExperienceRecordHash(experienceRecord)) failures.push("EXPERIENCE_HASH_MISMATCH");
  const episodeHash = cleanObjectText(cognitiveEpisode?.cognitiveEpisodeHash, 80);
  if (!HASH_PATTERN.test(episodeHash) || episodeHash !== recalculateEmbeddedHash(cognitiveEpisode, "cognitiveEpisodeHash")) {
    failures.push("COGNITIVE_EPISODE_HASH_MISMATCH");
  }
  const attestation = validateFinalExperienceAttestation({ experienceRecord, cognitiveEpisode, governorProof });
  failures.push(...attestation.mismatches);
  if (source.sourceRecordHash && source.sourceRecordHash !== storedExperienceHash) failures.push("SOURCE_RECORD_HASH_MISMATCH");
  return failures.length
    ? trustValidationFailure(trustClass, failures)
    : { valid: true, trustClass, eligibleForLessonSupport: true, failures: [] };
}

function failureEnvelopeFacts(source) {
  const envelope = source.failureEnvelope;
  if (!envelope || !verifyFailureEnvelope(envelope).valid) return null;
  const category = canonicalToken(envelope.errorCategory, "UNRESOLVED_CAUSE");
  if (category === "PROVIDER_FAILURE") {
    return {
      outcome: REFLECTION_OUTCOME.FAILURE,
      domain: CAUSALITY_DOMAIN.EXTERNAL,
      classification: FAILURE_CLASSIFICATION.PROVIDER_OUTAGE,
      mechanism: CAUSAL_MECHANISM.EXTERNAL_PROVIDER_UNAVAILABLE,
      boundary: canonicalToken(envelope.stageAtFailure, "INITIAL_ACQUISITION"),
      expectedState: "PROVIDER_OPERATION_COMPLETES",
      actualState: "PROVIDER_OPERATION_FAILED"
    };
  }
  if (category === "CLIENT_INPUT_REJECTED" || category === "IDENTITY_CONFIRMATION_REQUIRED") {
    return {
      outcome: REFLECTION_OUTCOME.EXPECTED_STOP,
      domain: CAUSALITY_DOMAIN.CUSTOMER_DEPENDENT,
      classification: category === "CLIENT_INPUT_REJECTED"
        ? FAILURE_CLASSIFICATION.MALFORMED_CUSTOMER_INPUT
        : FAILURE_CLASSIFICATION.MISSING_CUSTOMER_INFORMATION,
      mechanism: category === "CLIENT_INPUT_REJECTED"
        ? CAUSAL_MECHANISM.MALFORMED_CUSTOMER_INPUT
        : CAUSAL_MECHANISM.MISSING_REQUIRED_CUSTOMER_DISCRIMINATOR,
      boundary: canonicalToken(envelope.stageAtFailure, "INPUT_VALIDATION"),
      expectedState: "REQUIRED_CUSTOMER_INPUT_AVAILABLE",
      actualState: "REQUIRED_CUSTOMER_INPUT_UNAVAILABLE"
    };
  }
  if (category === "EXPERIENCE_INTEGRITY" || category === "GOVERNOR_AUTHORIZATION_FAILURE") {
    return {
      outcome: REFLECTION_OUTCOME.FAILURE,
      domain: CAUSALITY_DOMAIN.INTERNAL,
      classification: category === "EXPERIENCE_INTEGRITY"
        ? FAILURE_CLASSIFICATION.EXPERIENCE_INTEGRITY_DEFECT
        : FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
      mechanism: category === "EXPERIENCE_INTEGRITY"
        ? CAUSAL_MECHANISM.EXPERIENCE_ATTESTATION_INTEGRITY_LOSS
        : CAUSAL_MECHANISM.DUPLICATE_ACTION_REPEATED_WITHOUT_KNOWLEDGE_CHANGE,
      boundary: canonicalToken(envelope.stageAtFailure, "UNRESOLVED_BEFORE_AUTHORITY"),
      expectedState: "AUTHORITATIVE_INTEGRITY_PRESERVED",
      actualState: "AUTHORITATIVE_INTEGRITY_REJECTED"
    };
  }
  return {
    outcome: REFLECTION_OUTCOME.UNRESOLVED,
    domain: CAUSALITY_DOMAIN.UNRESOLVED,
    classification: FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE,
    mechanism: CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE,
    boundary: canonicalToken(envelope.stageAtFailure, "UNRESOLVED_BEFORE_AUTHORITY"),
    expectedState: "TERMINAL_EVALUATION_COMPLETES",
    actualState: "TERMINAL_EVALUATION_FAILED"
  };
}

function cognitiveEpisodeFacts(source) {
  const episode = source.cognitiveEpisode || {};
  const lesson = source.episodeLessonCandidate || source.lessonCandidate || {};
  const category = canonicalToken(lesson.generalizedFailureCategory, "");
  if (episode.requestedCustomerInput || category === "MISSING_CUSTOMER_DISCRIMINATOR") {
    return {
      outcome: REFLECTION_OUTCOME.EXPECTED_STOP,
      domain: CAUSALITY_DOMAIN.CUSTOMER_DEPENDENT,
      classification: FAILURE_CLASSIFICATION.MISSING_CUSTOMER_INFORMATION,
      mechanism: CAUSAL_MECHANISM.MISSING_REQUIRED_CUSTOMER_DISCRIMINATOR,
      boundary: "CUSTOMER_INPUT_TRANSITION",
      expectedState: "REQUIRED_CUSTOMER_DISCRIMINATOR_AVAILABLE",
      actualState: "REQUIRED_CUSTOMER_DISCRIMINATOR_MISSING"
    };
  }
  const safety = canonicalToken(episode.safetyState, "");
  if (safety && safety !== "NO_BLOCKING_SAFETY_CONDITION") {
    return {
      outcome: REFLECTION_OUTCOME.EXPECTED_STOP,
      domain: CAUSALITY_DOMAIN.SAFETY_DEPENDENT,
      classification: FAILURE_CLASSIFICATION.SAFETY_REFUSAL,
      mechanism: CAUSAL_MECHANISM.SAFETY_BASED_REFUSAL,
      boundary: "PURPOSE_JUDGMENT",
      expectedState: "SAFE_ACTION_SUPPORTED",
      actualState: safety
    };
  }
  if (episode.cycleDetections?.length || episode.blockedDuplicateActions?.length
    || category === "REPEATED_UNCHANGED_KNOWLEDGE_STATE" || category === "DUPLICATE_ACTION_ATTEMPT") {
    return {
      outcome: REFLECTION_OUTCOME.FAILURE,
      domain: CAUSALITY_DOMAIN.INTERNAL,
      classification: FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
      mechanism: CAUSAL_MECHANISM.DUPLICATE_ACTION_REPEATED_WITHOUT_KNOWLEDGE_CHANGE,
      boundary: "GOVERNOR_CONSTRUCTION",
      expectedState: "NEXT_ACTION_CHANGES_KNOWLEDGE",
      actualState: "ACTION_REPEATED_WITH_UNCHANGED_KNOWLEDGE"
    };
  }
  if (episode.terminalStatus === "INSUFFICIENT_EVIDENCE" || category === "INSUFFICIENT_VERIFIED_EVIDENCE") {
    return {
      outcome: REFLECTION_OUTCOME.EXPECTED_STOP,
      domain: CAUSALITY_DOMAIN.UNRESOLVED,
      classification: FAILURE_CLASSIFICATION.EXPECTED_EVIDENCE_INSUFFICIENCY,
      mechanism: CAUSAL_MECHANISM.VERIFIED_EVIDENCE_INSUFFICIENT,
      boundary: "CANONICAL_EVIDENCE_FINALIZATION",
      expectedState: "SUFFICIENT_VERIFIED_EVIDENCE_AVAILABLE",
      actualState: "VERIFIED_EVIDENCE_INSUFFICIENT"
    };
  }
  return {
    outcome: episode.terminalStatus === "COMPLETE" ? REFLECTION_OUTCOME.SUCCESS : REFLECTION_OUTCOME.UNRESOLVED,
    domain: episode.terminalStatus === "COMPLETE" ? CAUSALITY_DOMAIN.NONE : CAUSALITY_DOMAIN.UNRESOLVED,
    classification: episode.terminalStatus === "COMPLETE" ? FAILURE_CLASSIFICATION.NONE : FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE,
    mechanism: episode.terminalStatus === "COMPLETE" ? CAUSAL_MECHANISM.NO_CAUSAL_LOSS : CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE,
    boundary: episode.terminalStatus === "COMPLETE" ? "RESPONSE_EMISSION" : "UNRESOLVED_BEFORE_AUTHORITY",
    expectedState: "TERMINAL_EVALUATION_COMPLETES",
    actualState: episode.terminalStatus === "COMPLETE" ? "TERMINAL_EVALUATION_COMPLETED" : "TERMINAL_STATE_UNRESOLVED"
  };
}

function deriveCausalFacts(source, trustValidation) {
  if (source.causalMechanism || source.failureClassification || source.causalityDomain || source.outcome) {
    return {
      outcome: controlledToken(source.outcome, OUTCOMES, REFLECTION_OUTCOME.UNRESOLVED),
      domain: controlledToken(source.causalityDomain, DOMAINS, CAUSALITY_DOMAIN.UNRESOLVED),
      classification: controlledToken(source.failureClassification, CLASSIFICATIONS, FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE),
      mechanism: controlledToken(source.causalMechanism, MECHANISMS, CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE),
      boundary: canonicalToken(source.earliestSupportedLossBoundary, "UNRESOLVED_BEFORE_AUTHORITY"),
      expectedState: canonicalToken(source.expectedState, "EXPECTED_STATE_UNAVAILABLE"),
      actualState: canonicalToken(source.actualState, "ACTUAL_STATE_UNAVAILABLE")
    };
  }
  const envelopeFacts = failureEnvelopeFacts(source);
  if (envelopeFacts) return envelopeFacts;
  if (source.experienceRecord && trustValidation.trustClass === HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC
    && trustValidation.failures.length === 0) {
    const stored = cleanObjectText(source.experienceRecord.experienceRecordHash, 80);
    if (stored && stored !== calculateExperienceRecordHash(source.experienceRecord)) {
      return {
        outcome: REFLECTION_OUTCOME.FAILURE,
        domain: CAUSALITY_DOMAIN.INTERNAL,
        classification: FAILURE_CLASSIFICATION.EXPERIENCE_INTEGRITY_DEFECT,
        mechanism: CAUSAL_MECHANISM.EXPERIENCE_ATTESTATION_INTEGRITY_LOSS,
        boundary: "EXPERIENCE_RECORD_SEALING",
        expectedState: "SEALED_EXPERIENCE_MATCHES_RESPONSE_BOUND_PROOF",
        actualState: "SEALED_EXPERIENCE_DIVERGED_FROM_RESPONSE_BOUND_PROOF"
      };
    }
  }
  if (source.cognitiveEpisode) return cognitiveEpisodeFacts(source);
  if (Number(source.handlerStatusCode || 0) >= 500) {
    return {
      outcome: REFLECTION_OUTCOME.UNRESOLVED,
      domain: CAUSALITY_DOMAIN.UNRESOLVED,
      classification: FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE,
      mechanism: CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE,
      boundary: "UNRESOLVED_BEFORE_AUTHORITY",
      expectedState: "TERMINAL_EVALUATION_COMPLETES",
      actualState: "TERMINAL_HANDLER_FAILURE_WITHOUT_CAUSAL_PROOF"
    };
  }
  return {
    outcome: Number(source.handlerStatusCode || 0) >= 200 && Number(source.handlerStatusCode || 0) < 300
      ? REFLECTION_OUTCOME.SUCCESS
      : REFLECTION_OUTCOME.UNRESOLVED,
    domain: CAUSALITY_DOMAIN.NONE,
    classification: FAILURE_CLASSIFICATION.NONE,
    mechanism: CAUSAL_MECHANISM.NO_CAUSAL_LOSS,
    boundary: "RESPONSE_EMISSION",
    expectedState: "TERMINAL_EVALUATION_COMPLETES",
    actualState: "TERMINAL_EVALUATION_COMPLETED"
  };
}

function providerDisposition(source = {}) {
  const records = source.governorProof?.providerRequestOwnership || source.providerAttemptRecords || [];
  return {
    logicalRequestCount: records.filter((record) => record.logicalQueryAttempted).length,
    physicalAttemptCount: records.reduce((total, record) => total + Number(record.physicalAttemptCount || 0), 0),
    physicalRetryCount: records.reduce((total, record) => total + Number(record.physicalRetryAttemptCount || 0), 0),
    disposition: records.some((record) => Number(record.physicalAttemptCount || 0) > 0)
      ? "ATTEMPTED"
      : "NOT_RECORDED"
  };
}

function evidenceDisposition(source = {}) {
  const experience = source.experienceRecord || {};
  return {
    sourcesFoundCount: Number(experience.sourcesFound?.length || 0),
    sourcesAcceptedCount: Number(experience.sourcesAccepted?.length || 0),
    sourcesRejectedCount: Number(experience.sourcesRejected?.length || 0),
    exactEvidenceRecoveredCount: Number(experience.exactEvidenceRecovered?.length || 0),
    evidenceGapCount: Number(experience.evidenceGaps?.length || 0)
  };
}

export function createCausalSignature(observation = {}) {
  const signature = {
    schemaVersion: CAUSAL_SIGNATURE_SCHEMA_VERSION,
    authorityBoundary: canonicalToken(observation.earliestSupportedLossBoundary, "UNRESOLVED_BEFORE_AUTHORITY"),
    causalMechanism: controlledToken(observation.causalMechanism, MECHANISMS, CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE),
    failureClassification: controlledToken(observation.failureClassification, CLASSIFICATIONS, FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE),
    causalityDomain: controlledToken(observation.causalityDomain, DOMAINS, CAUSALITY_DOMAIN.UNRESOLVED),
    triggerClass: canonicalToken(observation.triggerClass || observation.causalMechanism, "UNRESOLVED_TRIGGER"),
    signatureHash: ""
  };
  signature.signatureHash = sha256Object(signature);
  return signature;
}

export function buildReflectionObservation(source = {}) {
  const input = JSON.parse(stableObjectJson(source));
  const trustValidation = validateHistoricalReflectionSource(input);
  const facts = deriveCausalFacts(input, trustValidation);
  const sourceHash = cleanObjectText(input.sourceRecordHash || input.experienceRecord?.experienceRecordHash, 80)
    || sha256Object({ trustClass: trustValidation.trustClass, legacyIdentity: cleanObjectText(input.legacyIdentity, 120) });
  const episodeIdentity = identityHash("episode", input.episodeIdentity || input.cognitiveEpisode?.cognitiveEpisodeHash || sourceHash);
  const objectClassIdentity = identityHash(
    "object-class",
    input.objectClassIdentity || input.cognitiveEpisode?.submittedObjectFingerprint || input.experienceRecord?.objectStateId || sourceHash
  );
  const causalEventIdentity = identityHash(
    "causal-event",
    input.causalEventIdentity || input.failureEnvelope?.errorFingerprint || input.cognitiveEpisode?.cognitiveEpisodeHash || sourceHash
  );
  const observation = {
    schemaVersion: REFLECTION_OBSERVATION_SCHEMA_VERSION,
    sourceRecordId: sourceRecordIdentity(sourceHash),
    sourceRecordHash: HASH_PATTERN.test(sourceHash) ? sourceHash : sha256Object(sourceHash),
    sourceArtifactHash: identityHash("source-artifact", input.sourceArtifactHash || sourceHash),
    sourceAggregateHash: HASH_PATTERN.test(cleanObjectText(input.sourceAggregateHash, 80))
      ? input.sourceAggregateHash
      : "",
    sourceTrustClass: trustValidation.trustClass,
    sourceIntegrityValid: trustValidation.valid,
    sourceIntegrityFailures: trustValidation.failures,
    episodeIdentity,
    objectClassIdentity,
    customerPurpose: PURPOSES.has(canonicalToken(input.customerPurpose, "UNKNOWN"))
      ? canonicalToken(input.customerPurpose, "UNKNOWN")
      : "UNKNOWN",
    causalEventIdentity,
    sourceLineageIdentity: identityHash("source-lineage", input.sourceLineageIdentity || episodeIdentity),
    expectedState: canonicalToken(facts.expectedState, "EXPECTED_STATE_UNAVAILABLE"),
    actualState: canonicalToken(facts.actualState, "ACTUAL_STATE_UNAVAILABLE"),
    earliestSupportedLossBoundary: canonicalToken(facts.boundary, "UNRESOLVED_BEFORE_AUTHORITY"),
    terminalOutcome: canonicalToken(input.terminalOutcome || input.cognitiveEpisode?.terminalStatus || facts.outcome, "UNRESOLVED"),
    outcome: facts.outcome,
    failureClassification: facts.classification,
    causalityDomain: facts.domain,
    causalMechanism: facts.mechanism,
    providerDisposition: providerDisposition(input),
    evidenceDisposition: evidenceDisposition(input),
    eligibleForLessonSupport: trustValidation.eligibleForLessonSupport
      && facts.outcome === REFLECTION_OUTCOME.FAILURE
      && facts.domain === CAUSALITY_DOMAIN.INTERNAL,
    supportExclusionReasons: [],
    counterexampleForSignatureHash: cleanObjectText(input.counterexampleForSignatureHash, 80),
    observationHash: ""
  };
  if (!trustValidation.eligibleForLessonSupport) observation.supportExclusionReasons.push(...trustValidation.failures);
  if (facts.outcome !== REFLECTION_OUTCOME.FAILURE) observation.supportExclusionReasons.push("NOT_A_FAILURE");
  if (facts.domain !== CAUSALITY_DOMAIN.INTERNAL) observation.supportExclusionReasons.push("NON_INTERNAL_CAUSALITY");
  observation.supportExclusionReasons = uniqueSorted(observation.supportExclusionReasons);
  const causalSignature = createCausalSignature(observation);
  observation.causalSignatureHash = causalSignature.signatureHash;
  observation.observationHash = sha256Object(observation);
  return observation;
}

function observationReference(observation) {
  return {
    observationId: stableInternalId("reflection-observation", observation.observationHash, 24),
    observationHash: observation.observationHash,
    sourceRecordId: observation.sourceRecordId,
    sourceRecordHash: observation.sourceRecordHash,
    sourceTrustClass: observation.sourceTrustClass,
    episodeIdentity: observation.episodeIdentity,
    causalEventIdentity: observation.causalEventIdentity,
    objectClassIdentity: observation.objectClassIdentity,
    customerPurpose: observation.customerPurpose
  };
}

function independentObservations(observations = []) {
  const byRecord = new Map();
  for (const observation of observations) {
    if (!byRecord.has(observation.sourceRecordHash)) byRecord.set(observation.sourceRecordHash, observation);
  }
  const byObject = new Map();
  for (const observation of [...byRecord.values()].sort((left, right) => left.observationHash.localeCompare(right.observationHash))) {
    const key = observation.objectClassIdentity || observation.causalEventIdentity || observation.episodeIdentity;
    if (!byObject.has(key)) byObject.set(key, observation);
  }
  return [...byObject.values()];
}

function templateFor(signature) {
  return CAUSAL_TEMPLATES[signature.causalMechanism] || {
    problem: "An internal authority boundary can produce a repeated causal loss across independent object classes.",
    requiredBehavior: "PRESERVE_THE_AUTHORITATIVE_PRECONDITION_THROUGH_THE_NAMED_BOUNDARY",
    forbiddenBehavior: "SILENTLY_DIVERGE_FROM_THE_AUTHORITATIVE_PRECONDITION",
    evidenceRequired: ["AUTHORITATIVE_PRECONDITION", "ORDERED_CAUSAL_BOUNDARY", "TERMINAL_DISPOSITION"],
    regression: ["SHARED_CAUSE_REPRODUCES_ACROSS_UNRELATED_OBJECT_CLASSES", "SUCCESSFUL_COUNTEREXAMPLE_REMAINS_VALID"]
  };
}

function candidateByteLength(candidate) {
  return Buffer.byteLength(stableObjectJson(candidate), "utf8");
}

function buildRetrospectiveLessonCandidate({
  signature,
  supporting,
  counterevidence,
  totalRecordsExamined,
  uniqueRecordsExamined
}) {
  const independentSupport = independentObservations(supporting);
  const independentCounterevidence = independentObservations(counterevidence);
  const template = templateFor(signature);
  const counterevidenceStrong = independentCounterevidence.length >= independentSupport.length;
  const trustComposition = Object.fromEntries(Object.values(HISTORICAL_TRUST_CLASS).map((trustClass) => [
    trustClass,
    independentSupport.filter((observation) => observation.sourceTrustClass === trustClass).length
  ]));
  const core = {
    schemaVersion: RETROSPECTIVE_LESSON_CANDIDATE_SCHEMA_VERSION,
    recordType: "RETROSPECTIVE_LESSON_CANDIDATE",
    status: LESSON_CANDIDATE_STATUS.PROPOSED_ONLY,
    sourceRecords: independentSupport.map(observationReference),
    sourceTrustClasses: uniqueSorted(independentSupport.map((observation) => observation.sourceTrustClass)),
    trustComposition,
    totalRecordsExamined,
    uniqueRecordsExamined,
    independentlySupportingEpisodeCount: independentSupport.length,
    independentObjectClassCount: uniqueSorted(independentSupport.map((observation) => observation.objectClassIdentity)).length,
    purposeCoverage: uniqueSorted(supporting.map((observation) => observation.customerPurpose)),
    earliestSharedLossBoundary: signature.authorityBoundary,
    causalSignature: signature,
    supportingObservations: independentSupport.map(observationReference),
    disconfirmingObservations: independentCounterevidence.map(observationReference),
    generalizedProblemStatement: template.problem,
    proposedInvariant: {
      authorityBoundary: signature.authorityBoundary,
      triggeringConditions: [signature.triggerClass, signature.causalMechanism],
      evidenceRequired: template.evidenceRequired,
      requiredBehavior: template.requiredBehavior,
      forbiddenBehavior: template.forbiddenBehavior,
      expectedCounterexamples: ["MATERIAL_PRECONDITION_DIFFERS", "CAUSAL_MECHANISM_NOT_ESTABLISHED"]
    },
    scope: {
      causalityDomain: signature.causalityDomain,
      failureClassification: signature.failureClassification,
      authorityBoundary: signature.authorityBoundary
    },
    nonScope: ["OBJECT_SPECIFIC_ANSWER", "CUSTOMER_MEMORY", "CONVERSATIONAL_PERSONALITY", "PROVIDER_OUTAGE", "CUSTOMER_INPUT_INSUFFICIENCY"],
    forbiddenOverreach: [
      "AUTOMATIC_CODE_INSTALLATION",
      "AUTOMATIC_TEST_MODIFICATION",
      "LIVE_GOVERNOR_CONSUMPTION",
      "LIVE_EVIDENCE_PIPELINE_CONSUMPTION",
      "OBJECT_SPECIFIC_EXCEPTION",
      "CUSTOMER_SPECIFIC_RULE"
    ],
    expectedBehavioralEffect: "NO_RUNTIME_EFFECT_UNLESS_A_SEPARATE_HUMAN_REVIEW_AND_PROMOTION_STATION_IS_AUTHORIZED",
    safetyImplications: ["PRESERVE_EXISTING_STOPPING_AND_SAFETY_POLICY", "DO_NOT_RECLASSIFY_EXPECTED_SAFETY_STOPS_AS_DEFECTS"],
    regressionObligations: template.regression,
    unresolvedQuestions: counterevidence.length
      ? ["COUNTEREVIDENCE_MUST_BE_ADJUDICATED_BEFORE_ANY_PROMOTION"]
      : ["PRODUCTION_SCOPE_AND_COUNTEREXAMPLES_REQUIRE_SEPARATE_REVIEW"],
    promotionEligibilityState: counterevidenceStrong ? "BLOCKED_BY_COUNTEREVIDENCE" : "ELIGIBLE_FOR_HUMAN_REVIEW_ONLY",
    promotionAuthorized: false,
    runtimeConsumptionAuthorized: false
  };
  const candidateSeed = sha256Object(core);
  const candidate = {
    ...core,
    candidateId: `lesson-candidate-${candidateSeed.slice(0, 24)}`,
    candidateHash: ""
  };
  candidate.candidateHash = sha256Object(candidate);
  if (candidateByteLength(candidate) > MAX_RETROSPECTIVE_LESSON_CANDIDATE_BYTES) {
    throw new Error("Retrospective Lesson Candidate exceeds its canonical byte ceiling.");
  }
  return candidate;
}

export function verifyRetrospectiveLessonCandidate(candidate = {}) {
  const recalculatedHash = sha256Object({ ...candidate, candidateHash: "" });
  const forbiddenText = stableObjectJson({
    causalSignature: candidate.causalSignature,
    generalizedProblemStatement: candidate.generalizedProblemStatement,
    proposedInvariant: candidate.proposedInvariant,
    scope: candidate.scope,
    nonScope: candidate.nonScope,
    forbiddenOverreach: candidate.forbiddenOverreach,
    regressionObligations: candidate.regressionObligations
  });
  const privateOrSpecific = /https?:|www\.|\b[A-Z]{2,12}[-_]\d+\b|customerName|productName|frozenDescription|expectedUrl/i.test(forbiddenText);
  return {
    valid: candidate.schemaVersion === RETROSPECTIVE_LESSON_CANDIDATE_SCHEMA_VERSION
      && candidate.status === LESSON_CANDIDATE_STATUS.PROPOSED_ONLY
      && candidate.promotionAuthorized === false
      && candidate.runtimeConsumptionAuthorized === false
      && candidate.candidateHash === recalculatedHash
      && candidateByteLength(candidate) <= MAX_RETROSPECTIVE_LESSON_CANDIDATE_BYTES
      && !privateOrSpecific,
    hashMatch: candidate.candidateHash === recalculatedHash,
    bounded: candidateByteLength(candidate) <= MAX_RETROSPECTIVE_LESSON_CANDIDATE_BYTES,
    nonOperative: candidate.status === LESSON_CANDIDATE_STATUS.PROPOSED_ONLY
      && candidate.promotionAuthorized === false
      && candidate.runtimeConsumptionAuthorized === false,
    privateOrSpecificContentDetected: privateOrSpecific,
    recalculatedHash,
    canonicalByteSize: candidateByteLength(candidate)
  };
}

function patternDisposition(signature, observations, independentSupport, counterevidence) {
  if (signature.causalityDomain !== CAUSALITY_DOMAIN.INTERNAL) return "NON_INTERNAL_CAUSALITY";
  if (!observations.some((observation) => observation.sourceIntegrityValid)) return "NO_VERIFIED_SOURCE";
  if (independentSupport.length < 2) return "INSUFFICIENT_INDEPENDENT_SUPPORT";
  if (counterevidence.length >= independentSupport.length) return "BLOCKED_BY_COUNTEREVIDENCE";
  return "CANDIDATE_SUPPORTED";
}

export function reflectOnHistoricalExperiences(sources = []) {
  const observations = sources.map(buildReflectionObservation)
    .sort((left, right) => left.observationHash.localeCompare(right.observationHash));
  const uniqueByObservationHash = new Map();
  for (const observation of observations) {
    if (!uniqueByObservationHash.has(observation.observationHash)) {
      uniqueByObservationHash.set(observation.observationHash, observation);
    }
  }
  const uniqueObservations = [...uniqueByObservationHash.values()];
  const groups = new Map();
  for (const observation of uniqueObservations) {
    const signature = createCausalSignature(observation);
    const group = groups.get(signature.signatureHash) || { signature, observations: [] };
    group.observations.push(observation);
    groups.set(signature.signatureHash, group);
  }
  const candidates = [];
  const patternAssessments = [];
  for (const group of [...groups.values()].sort((left, right) => left.signature.signatureHash.localeCompare(right.signature.signatureHash))) {
    const supporting = group.observations.filter((observation) => observation.eligibleForLessonSupport);
    const counterevidence = uniqueObservations.filter((observation) => (
      observation.outcome === REFLECTION_OUTCOME.SUCCESS
      && (observation.causalSignatureHash === group.signature.signatureHash
        || observation.counterexampleForSignatureHash === group.signature.signatureHash)
    ));
    const independentSupport = independentObservations(supporting);
    const independentCounterevidence = independentObservations(counterevidence);
    const disposition = patternDisposition(group.signature, group.observations, independentSupport, independentCounterevidence);
    patternAssessments.push({
      causalSignature: group.signature,
      recordsInPattern: group.observations.length,
      independentlySupportingEpisodeCount: independentSupport.length,
      independentObjectClassCount: uniqueSorted(independentSupport.map((observation) => observation.objectClassIdentity)).length,
      counterevidenceCount: independentCounterevidence.length,
      purposeCoverage: uniqueSorted(group.observations.map((observation) => observation.customerPurpose)),
      disposition
    });
    if (disposition === "CANDIDATE_SUPPORTED" || disposition === "BLOCKED_BY_COUNTEREVIDENCE") {
      candidates.push(buildRetrospectiveLessonCandidate({
        signature: group.signature,
        supporting,
        counterevidence,
        totalRecordsExamined: observations.length,
        uniqueRecordsExamined: uniqueObservations.length
      }));
    }
  }
  const report = {
    schemaVersion: RETROSPECTIVE_REFLECTION_REPORT_SCHEMA_VERSION,
    reportType: "READ_ONLY_RETROSPECTIVE_REFLECTION",
    totalRecordsExamined: observations.length,
    uniqueRecordsExamined: uniqueObservations.length,
    trustClassCounts: Object.fromEntries(Object.values(HISTORICAL_TRUST_CLASS).map((trustClass) => [
      trustClass,
      uniqueObservations.filter((observation) => observation.sourceTrustClass === trustClass).length
    ])),
    observations: uniqueObservations,
    patternAssessments,
    lessonCandidates: candidates.sort((left, right) => left.candidateHash.localeCompare(right.candidateHash)),
    runtimeConsumptionAuthorized: false,
    sourceMutationAuthorized: false,
    reportHash: ""
  };
  report.reportHash = sha256Object(report);
  return report;
}
