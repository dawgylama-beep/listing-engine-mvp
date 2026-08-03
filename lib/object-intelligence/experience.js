import { boundedUniqueStrings, cleanObjectText, sanitizeStructuredRecord, sha256Object, stableObjectJson } from "./stable.js";
import { OBJECT_EVIDENCE_CLASSIFICATION } from "./verification.js";

export const EXPERIENCE_RECORD_SCHEMA_VERSION = "1.0";
export const MAX_EXPERIENCE_RECORD_BYTES = 65536;

function sourceProjection(record = {}) {
  return {
    sourceId: cleanObjectText(record.objectMindSourceId || record.sourceId || record.evidenceId, 160),
    url: cleanObjectText(record.canonicalUrl || record.destinationUrl || record.url, 1000),
    owningHypothesisId: cleanObjectText(record.objectMindHypothesisId || record.owningHypothesisId, 100),
    exactnessClassification: cleanObjectText(record.objectMindClassification || record.exactnessClassification || record.canonicalMatchQuality, 100),
    verificationState: cleanObjectText(record.objectMindVerificationState || record.verificationState, 100),
    rejectionReason: cleanObjectText(record.objectMindRejectionReason || record.rejectionReason || record.exclusionReason, 360),
    directPageVerified: Boolean(record.objectMindDirectPageVerified || record.directPageVerified)
  };
}

function requestProjection(record = {}) {
  return {
    queryId: cleanObjectText(record.queryId || record.objectMindQueryId, 100),
    owningHypothesisId: cleanObjectText(record.owningHypothesisId || record.objectMindHypothesisId, 100),
    queryType: cleanObjectText(record.queryType || record.objectMindQueryType, 100),
    query: cleanObjectText(record.query, 240),
    phase: cleanObjectText(record.objectMindPhase || record.queryPhase || "INITIAL", 40),
    providerLane: cleanObjectText(record.providerKey || record.provider, 80),
    attempted: Number(record.physicalAttemptCount || 0) > 0 || Boolean(record.attempted),
    succeeded: Boolean(record.succeeded),
    resultState: cleanObjectText(record.failureStage || (record.succeeded ? "SUCCEEDED" : "NOT_EXECUTED"), 100)
  };
}

function directPageOutcomes(providerRequests = []) {
  return providerRequests
    .filter((record) => /direct_product_page_fetch/i.test(String(record.providerEndpoint || "")))
    .map((record) => ({
      url: cleanObjectText(record.query, 1000),
      attempted: Number(record.physicalAttemptCount || 0) > 0,
      succeeded: Boolean(record.succeeded),
      outcome: cleanObjectText(record.failureStage || (record.succeeded ? "SUCCEEDED" : "NOT_EXECUTED"), 120)
    }))
    .slice(0, 2);
}

export function buildExperienceRecord({
  state = {},
  providerRequests = [],
  sourcesFound = [],
  acceptedSources = [],
  rejectedSources = [],
  subsystemOutcomeFlags = {}
} = {}) {
  const observations = (state.observedFacts || []).slice(0, 64).map((fact) => ({
    factType: fact.factType,
    normalizedValue: fact.normalizedValue,
    certaintyBand: fact.certaintyBand,
    origin: fact.origin
  }));
  const hypotheses = (state.identityHypotheses || []).slice(0, 6).map((candidate) => ({
    candidateId: candidate.candidateId,
    exactCandidateLabel: candidate.exactCandidateLabel,
    broaderFamilyIdentity: candidate.broaderFamilyIdentity,
    brandOrMaker: candidate.brandOrMaker,
    model: candidate.model,
    exactnessLevel: candidate.exactnessLevel,
    confidenceBand: candidate.confidenceBand,
    unresolvedDiscriminators: candidate.unresolvedDiscriminators
  }));
  const found = (sourcesFound.length ? sourcesFound : state.candidateEvidence || []).map(sourceProjection).slice(0, 50);
  const accepted = acceptedSources.map(sourceProjection).slice(0, 32);
  const rejected = rejectedSources.map(sourceProjection).slice(0, 50);
  const exactEvidenceRecovered = accepted.filter((source) => (
    source.exactnessClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM
    || /^exact$/i.test(source.exactnessClassification)
  ));
  let record = sanitizeStructuredRecord({
    schemaVersion: EXPERIENCE_RECORD_SCHEMA_VERSION,
    objectStateSchemaVersion: state.schemaVersion,
    objectStateId: state.objectStateId,
    observationSummary: observations,
    identityHypothesesConsidered: hypotheses,
    finalResolvedIdentity: state.resolvedIdentity,
    unresolvedAlternatives: (state.resolvedIdentity?.remainingAlternativeCandidateIds || []).slice(0, 5),
    queriesAttempted: providerRequests.map(requestProjection).slice(0, 28),
    queryOwnership: providerRequests.map(requestProjection).filter((record) => record.queryId || record.owningHypothesisId).slice(0, 28),
    sourcesFound: found,
    sourcesAccepted: accepted,
    sourcesRejected: rejected,
    rejectionReasons: boundedUniqueStrings(rejected.map((source) => source.rejectionReason), 32, 360),
    directPageVerificationOutcomes: directPageOutcomes(providerRequests),
    exactEvidenceRecovered,
    evidenceGaps: state.verifiedEvidenceSummary?.evidenceGaps || [],
    additionalEvidenceNeeded: state.resolvedIdentity?.additionalEvidenceNeeded || [],
    subsystemOutcomeFlags,
    finalIdentityStateHash: state.identityStateHash,
    experienceRecordHash: ""
  });
  record.experienceRecordHash = sha256Object({ ...record, experienceRecordHash: "" });
  if (Buffer.byteLength(stableObjectJson(record), "utf8") > MAX_EXPERIENCE_RECORD_BYTES) {
    record = {
      ...record,
      observationSummary: record.observationSummary.slice(0, 32),
      queriesAttempted: record.queriesAttempted.slice(0, 16),
      queryOwnership: record.queryOwnership.slice(0, 16),
      sourcesFound: record.sourcesFound.slice(0, 20),
      sourcesAccepted: record.sourcesAccepted.slice(0, 16),
      sourcesRejected: record.sourcesRejected.slice(0, 20),
      rejectionReasons: record.rejectionReasons.slice(0, 20),
      experienceRecordHash: ""
    };
    record.experienceRecordHash = sha256Object({ ...record, experienceRecordHash: "" });
  }
  return record;
}

export function experienceRecordByteLength(record = {}) {
  return Buffer.byteLength(stableObjectJson(record), "utf8");
}
