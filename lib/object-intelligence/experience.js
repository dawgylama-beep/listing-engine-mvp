import { boundedUniqueStrings, cleanObjectText, sanitizeStructuredRecord, sha256Object, stableInternalId, stableObjectJson } from "./stable.js";
import { OBJECT_EVIDENCE_CLASSIFICATION } from "./verification.js";

export const EXPERIENCE_RECORD_SCHEMA_VERSION = "1.0";
export const MAX_EXPERIENCE_RECORD_BYTES = 65536;

function sourceProjection(record = {}, {
  canonicalSelectionResult = "",
  finalCustomerClassification = ""
} = {}) {
  const qualificationEligible = record.qualification?.eligible;
  return {
    evidenceId: cleanObjectText(record.evidenceId, 1000),
    sourceId: cleanObjectText(record.objectMindSourceId || record.sourceId || record.evidenceId, 160),
    queryId: cleanObjectText(record.objectMindQueryId || record.queryId, 100),
    url: cleanObjectText(record.canonicalUrl || record.destinationUrl || record.url, 1000),
    owningHypothesisId: cleanObjectText(record.objectMindHypothesisId || record.owningHypothesisId, 100),
    exactnessClassification: cleanObjectText(record.objectMindClassification || record.exactnessClassification || record.canonicalMatchQuality, 100),
    verificationState: cleanObjectText(record.objectMindVerificationState || record.verificationState, 100),
    rejectionReason: cleanObjectText(record.objectMindRejectionReason || record.rejectionReason || record.exclusionReason, 360),
    directPageVerified: Boolean(record.objectMindDirectPageVerified || record.directPageVerified),
    canonicalQualificationResult: qualificationEligible === true
      ? "QUALIFIED"
      : qualificationEligible === false
        ? "NOT_QUALIFIED"
        : "NOT_EVALUATED",
    canonicalSelectionResult: cleanObjectText(canonicalSelectionResult, 80),
    finalCustomerClassification: cleanObjectText(finalCustomerClassification, 100)
  };
}

function requestProjection(record = {}, { found = [], accepted = [], rejected = [] } = {}) {
  const phase = cleanObjectText(record.objectMindPhase || record.queryPhase || "INITIAL", 40);
  const owningHypothesisId = cleanObjectText(record.owningHypothesisId || record.objectMindHypothesisId, 100);
  const query = cleanObjectText(record.query, 240);
  const queryId = cleanObjectText(record.queryId || record.objectMindQueryId, 100)
    || stableInternalId("query", [phase, owningHypothesisId, query, record.providerKey || record.provider], 14);
  const requestCandidateIds = new Set(boundedUniqueStrings(record.resultingCandidateIds, 12, 160));
  const matching = found.filter((source) => (
    source.queryId === queryId
    || (source.sourceId && requestCandidateIds.has(source.sourceId))
  ));
  const acceptedIds = new Set(accepted.map((source) => source.sourceId).filter(Boolean));
  const rejectedIds = new Set(rejected.map((source) => source.sourceId).filter(Boolean));
  const resultingCandidateIds = boundedUniqueStrings([
    record.resultingCandidateIds,
    matching.map((source) => source.sourceId)
  ].flat(), 12, 160);
  const acceptedCandidates = matching.filter((source) => acceptedIds.has(source.sourceId));
  const rejectedCandidates = matching.filter((source) => rejectedIds.has(source.sourceId));
  const unresolvedCandidates = matching.filter((source) => /UNRESOLVED/.test(source.verificationState));
  const downgradedCandidates = matching.filter((source) => /EXACT_DESIGN|COMPATIBLE|SIMILAR|INSUFFICIENT/.test(source.exactnessClassification));
  const attempted = Number(record.physicalAttemptCount || 0) > 0 || Boolean(record.attempted);
  const disposition = acceptedCandidates.length
    ? "ACCEPTED"
    : rejectedCandidates.length
      ? "REJECTED"
      : unresolvedCandidates.length
        ? "UNRESOLVED"
        : downgradedCandidates.length
          ? "DOWNGRADED"
          : matching.length
            ? "NO_ACCEPTED_EVIDENCE"
            : record.succeeded
              ? "NO_RESULT"
              : attempted
                ? "PROVIDER_FAILURE"
                : "NOT_EXECUTED";
  const dispositionReason = cleanObjectText(
    rejectedCandidates.find((source) => source.rejectionReason)?.rejectionReason
    || unresolvedCandidates.find((source) => source.rejectionReason)?.rejectionReason
    || downgradedCandidates.find((source) => source.rejectionReason)?.rejectionReason
    || record.resultDispositionReason
    || record.failureStage
    || disposition,
    360
  );
  return {
    queryId,
    owningHypothesisId,
    queryType: cleanObjectText(record.queryType || record.objectMindQueryType, 100),
    query,
    normalizedQuery: cleanObjectText(record.normalizedCandidate || record.finalQuery || record.query, 240),
    phase,
    exactVisibleFactsUsed: boundedUniqueStrings(record.objectMindExactVisibleFactsUsed || record.exactVisibleFactsUsed, 12, 100),
    discriminatorTested: cleanObjectText(record.objectMindDiscriminatorTested || record.discriminatorTested, 180),
    provider: cleanObjectText(record.providerKey || record.provider, 80),
    providerLane: cleanObjectText(record.objectMindProviderLane || record.providerKey || record.provider, 80),
    attempted,
    succeeded: Boolean(record.succeeded),
    resultState: cleanObjectText(record.failureStage || (record.succeeded ? "SUCCEEDED" : "NOT_EXECUTED"), 100),
    resultingCandidateIds,
    disposition,
    dispositionReason
  };
}

function compactAttemptProjection(record = {}, { minimal = false } = {}) {
  const projection = {
    queryId: cleanObjectText(record.queryId, minimal ? 48 : 72),
    attempted: Boolean(record.attempted),
    succeeded: Boolean(record.succeeded),
    resultState: cleanObjectText(record.resultState, minimal ? 32 : 64)
  };
  if (!minimal) {
    projection.phase = cleanObjectText(record.phase, 24);
    projection.providerLane = cleanObjectText(record.providerLane, 48);
  }
  return projection;
}

function compactOwnershipProjection(record = {}, { minimal = false } = {}) {
  return {
    queryId: cleanObjectText(record.queryId, minimal ? 48 : 64),
    owningHypothesisId: cleanObjectText(record.owningHypothesisId, minimal ? 48 : 64),
    queryType: cleanObjectText(record.queryType, minimal ? 32 : 48),
    normalizedQuery: cleanObjectText(record.normalizedQuery, minimal ? 80 : 120),
    phase: cleanObjectText(record.phase, minimal ? 16 : 24),
    exactVisibleFactsUsed: boundedUniqueStrings(record.exactVisibleFactsUsed, minimal ? 2 : 3, minimal ? 40 : 48),
    discriminatorTested: cleanObjectText(record.discriminatorTested, minimal ? 64 : 80),
    provider: cleanObjectText(record.provider, minimal ? 32 : 48),
    resultingCandidateIds: boundedUniqueStrings(record.resultingCandidateIds, minimal ? 2 : 3, minimal ? 48 : 64),
    disposition: cleanObjectText(record.disposition, minimal ? 24 : 32),
    dispositionReason: cleanObjectText(record.dispositionReason, minimal ? 64 : 96)
  };
}

function compactIdentityProjection(identity = {}, { minimal = false } = {}) {
  return {
    status: cleanObjectText(identity.status, 40),
    selectedCandidateId: cleanObjectText(identity.selectedCandidateId, 80),
    canonicalLabel: cleanObjectText(identity.canonicalLabel || identity.exactProductIdentity, minimal ? 100 : 180),
    confidenceBand: cleanObjectText(identity.confidenceBand || identity.exactProductConfidence, 40),
    additionalEvidenceNeeded: boundedUniqueStrings(identity.additionalEvidenceNeeded, minimal ? 2 : 4, minimal ? 80 : 120),
    remainingAlternativeCandidateIds: boundedUniqueStrings(identity.remainingAlternativeCandidateIds, minimal ? 2 : 4, 80)
  };
}

function boundedFlagProjection(flags = {}) {
  return Object.fromEntries(Object.entries(flags || {})
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(0, 24)
    .map(([key, value]) => [
      cleanObjectText(key, 60),
      typeof value === "boolean" || typeof value === "number"
        ? value
        : cleanObjectText(value, 80)
    ]));
}

function withExperienceHash(record = {}) {
  const unhashed = { ...record, experienceRecordHash: "" };
  return { ...unhashed, experienceRecordHash: sha256Object(unhashed) };
}

function directPageOutcomes(providerRequests = []) {
  return providerRequests
    .filter((record) => /direct_product_page_fetch/i.test(String(record.providerEndpoint || "")))
    .map((record) => ({
      queryId: cleanObjectText(record.queryId || record.objectMindQueryId, 100),
      owningHypothesisId: cleanObjectText(record.owningHypothesisId || record.objectMindHypothesisId, 100),
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
  customerVisibleSources = [],
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
  const found = (sourcesFound.length ? sourcesFound : state.candidateEvidence || []).map((source) => sourceProjection(source)).slice(0, 50);
  const customerByEvidenceId = new Map(customerVisibleSources
    .filter((source) => source?.evidenceId)
    .map((source) => [source.evidenceId, source]));
  const accepted = acceptedSources.map((source) => {
    const customerSource = customerByEvidenceId.get(source.evidenceId);
    return sourceProjection(source, {
      canonicalSelectionResult: customerSource
        ? "SELECTED_FOR_CUSTOMER"
        : source.customerEligible
          ? "CUSTOMER_ELIGIBLE_NOT_SELECTED"
          : "CANONICALLY_ACCEPTED",
      finalCustomerClassification: customerSource?.canonicalMatchLabel || ""
    });
  }).slice(0, 32);
  const rejected = rejectedSources.map(sourceProjection).slice(0, 50);
  const requestOutcomes = { found, accepted, rejected };
  const requests = providerRequests.map((request) => requestProjection(request, requestOutcomes));
  const attemptedRequests = requests.filter((request) => request.attempted);
  const exactEvidenceRecovered = accepted.filter((source) => (
    (source.exactnessClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM
      || /^exact$/i.test(source.exactnessClassification))
    && /VERIFIED|ACCEPTED/i.test(source.verificationState)
  ));
  let record = sanitizeStructuredRecord({
    schemaVersion: EXPERIENCE_RECORD_SCHEMA_VERSION,
    objectStateSchemaVersion: state.schemaVersion,
    objectStateId: state.objectStateId,
    observationSummary: observations,
    identityHypothesesConsidered: hypotheses,
    finalResolvedIdentity: state.resolvedIdentity,
    unresolvedAlternatives: (state.resolvedIdentity?.remainingAlternativeCandidateIds || []).slice(0, 5),
    queriesAttempted: attemptedRequests.slice(0, 32),
    queryOwnership: attemptedRequests.slice(0, 32),
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
  record = withExperienceHash(record);
  if (Buffer.byteLength(stableObjectJson(record), "utf8") > MAX_EXPERIENCE_RECORD_BYTES) {
    record = withExperienceHash({
      ...record,
      observationSummary: record.observationSummary.slice(0, 24),
      sourcesFound: record.sourcesFound.slice(0, 10),
      sourcesAccepted: record.sourcesAccepted.slice(0, 10),
      sourcesRejected: record.sourcesRejected.slice(0, 10),
      rejectionReasons: record.rejectionReasons.slice(0, 12)
    });
    if (Buffer.byteLength(stableObjectJson(record), "utf8") > MAX_EXPERIENCE_RECORD_BYTES) {
      record = withExperienceHash({
        ...record,
        observationSummary: record.observationSummary.slice(0, 12),
        identityHypothesesConsidered: record.identityHypothesesConsidered.slice(0, 4),
        finalResolvedIdentity: compactIdentityProjection(record.finalResolvedIdentity),
        queriesAttempted: record.queriesAttempted.map((request) => compactAttemptProjection(request)),
        queryOwnership: record.queryOwnership.map((request) => compactOwnershipProjection(request)),
        sourcesFound: record.sourcesFound.slice(0, 4),
        sourcesAccepted: record.sourcesAccepted.slice(0, 4),
        sourcesRejected: record.sourcesRejected.slice(0, 4),
        rejectionReasons: record.rejectionReasons.slice(0, 6),
        evidenceGaps: boundedUniqueStrings(record.evidenceGaps, 4, 120),
        additionalEvidenceNeeded: boundedUniqueStrings(record.additionalEvidenceNeeded, 4, 120),
        subsystemOutcomeFlags: boundedFlagProjection(record.subsystemOutcomeFlags)
      });
      if (Buffer.byteLength(stableObjectJson(record), "utf8") > MAX_EXPERIENCE_RECORD_BYTES) {
        record = withExperienceHash({
          ...record,
          observationSummary: record.observationSummary.slice(0, 4),
          identityHypothesesConsidered: record.identityHypothesesConsidered.slice(0, 2),
          finalResolvedIdentity: compactIdentityProjection(record.finalResolvedIdentity, { minimal: true }),
          queriesAttempted: record.queriesAttempted.map((request) => compactAttemptProjection(request, { minimal: true })),
          queryOwnership: record.queryOwnership.map((request) => compactOwnershipProjection(request, { minimal: true })),
          sourcesFound: record.sourcesFound.slice(0, 2),
          sourcesAccepted: record.sourcesAccepted.slice(0, 2),
          sourcesRejected: record.sourcesRejected.slice(0, 2),
          rejectionReasons: boundedUniqueStrings(record.rejectionReasons, 2, 80),
          evidenceGaps: boundedUniqueStrings(record.evidenceGaps, 2, 80),
          additionalEvidenceNeeded: boundedUniqueStrings(record.additionalEvidenceNeeded, 2, 80),
          subsystemOutcomeFlags: boundedFlagProjection(record.subsystemOutcomeFlags)
        });
      }
    }
  }
  return record;
}

export function experienceRecordByteLength(record = {}) {
  return Buffer.byteLength(stableObjectJson(record), "utf8");
}
