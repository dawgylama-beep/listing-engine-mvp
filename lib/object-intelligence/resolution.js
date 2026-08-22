import { createRefinementSearchPlan } from "./search-plan.js";
import { OBJECT_EVIDENCE_CLASSIFICATION, verifyObjectEvidenceCandidate } from "./verification.js";
import { boundedUniqueStrings, cleanObjectText, stableInternalId } from "./stable.js";

function evidenceSummary(candidateEvidence = [], existingGaps = []) {
  const ids = (classification, state = "") => candidateEvidence
    .filter((item) => item.exactnessClassification === classification && (!state || item.verificationState === state))
    .map((item) => item.sourceId);
  return {
    acceptedExactItemSourceIds: ids(OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM, "VERIFIED"),
    acceptedExactDesignSourceIds: ids(OBJECT_EVIDENCE_CLASSIFICATION.EXACT_DESIGN_VARIATION_UNRESOLVED),
    unresolvedVariationSourceIds: ids(OBJECT_EVIDENCE_CLASSIFICATION.EXACT_DESIGN_VARIATION_UNRESOLVED),
    compatibleSourceIds: ids(OBJECT_EVIDENCE_CLASSIFICATION.COMPATIBLE_ALTERNATIVE),
    insufficientSourceIds: ids(OBJECT_EVIDENCE_CLASSIFICATION.INSUFFICIENT_EVIDENCE),
    similarSourceIds: ids(OBJECT_EVIDENCE_CLASSIFICATION.SIMILAR_OBJECT),
    rejectedSourceIds: candidateEvidence.filter((item) => item.verificationState === "REJECTED").map((item) => item.sourceId),
    unresolvedSourceIds: candidateEvidence.filter((item) => /UNRESOLVED/.test(item.verificationState)).map((item) => item.sourceId),
    evidenceGaps: boundedUniqueStrings(existingGaps, 12, 180)
  };
}

export function incorporateCandidateEvidence(state = {}, records = [], { phase = "INITIAL" } = {}) {
  const bySource = new Map((state.candidateEvidence || []).map((item) => [item.sourceId, item]));
  for (const record of records) {
    const verified = verifyObjectEvidenceCandidate(state, record);
    if (!bySource.has(verified.sourceId) || verified.directPageVerified) bySource.set(verified.sourceId, verified);
  }
  const candidateEvidence = [...bySource.values()]
    .sort((left, right) => left.sourceId.localeCompare(right.sourceId))
    .slice(0, 50);
  const exact = candidateEvidence.find((item) => (
    item.exactnessClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM
    && item.verificationState === "VERIFIED"
  ));
  const currentSelectedId = state.resolvedIdentity?.selectedCandidateId || "";
  const governedHypothesisIds = new Set(state.canonicalResearchIdentity?.allowedHypothesisIds || []);
  const promotedId = exact?.owningHypothesisId
    && governedHypothesisIds.has(exact.owningHypothesisId)
    && (state.identityHypotheses || []).some((item) => item.candidateId === exact.owningHypothesisId)
    ? exact.owningHypothesisId
    : currentSelectedId;
  const promoted = promotedId && promotedId !== currentSelectedId;
  const resolvedIdentity = {
    ...(state.resolvedIdentity || {}),
    selectedCandidateId: promotedId,
    remainingAlternativeCandidateIds: (state.identityHypotheses || [])
      .filter((item) => item.candidateId !== promotedId)
      .map((item) => item.candidateId)
  };
  const sequence = (state.resolutionHistory || []).length + 1;
  const event = exact
    ? promoted ? "ALTERNATE_HYPOTHESIS_PROMOTED" : "HYPOTHESIS_CONFIRMED_BY_EVIDENCE"
    : candidateEvidence.some((item) => item.verificationState === "REJECTED")
      ? "CANDIDATE_EVIDENCE_REJECTED"
      : "EVIDENCE_GAP_RECORDED";
  const historyEntry = {
    transitionId: stableInternalId("transition", [state.objectStateId, sequence, phase, event], 14),
    sequence,
    event,
    factsAdded: [],
    candidateId: promotedId,
    outcome: exact?.exactnessClassification || "NO_EXACT_EVIDENCE",
    reason: exact
      ? cleanObjectText(exact.supportReasons.join(" "), 360) || "Candidate evidence confirmed the bounded identity hypothesis."
      : "No candidate established exact item identity; rejected candidates remain diagnostic-only."
  };
  return {
    ...state,
    resolvedIdentity,
    candidateEvidence,
    verifiedEvidenceSummary: evidenceSummary(candidateEvidence, resolvedIdentity.additionalEvidenceNeeded),
    resolutionHistory: [...(state.resolutionHistory || []), historyEntry].slice(-24)
  };
}

export function createEvidenceInformedRefinement(state = {}, records = [], {
  attemptedQueries = [],
  maximumQueries = 4
} = {}) {
  const evidenceState = incorporateCandidateEvidence(state, records, { phase: "INITIAL" });
  if (Number(evidenceState.refinementCount || 0) >= 1) {
    return { state: evidenceState, searchPlan: [] };
  }
  const exactFound = evidenceState.verifiedEvidenceSummary.acceptedExactItemSourceIds.length > 0;
  const refinementPlan = exactFound
    ? []
    : createRefinementSearchPlan(evidenceState, { attemptedQueries, maximumQueries });
  const refinementTriggered = refinementPlan.length > 0;
  const sequence = evidenceState.resolutionHistory.length + 1;
  const stateWithRefinement = {
    ...evidenceState,
    refinementCount: Number(evidenceState.refinementCount || 0) + (refinementTriggered ? 1 : 0),
    searchPlan: [...(evidenceState.searchPlan || []), ...refinementPlan].slice(0, 16),
    resolutionHistory: [...evidenceState.resolutionHistory, {
      transitionId: stableInternalId("transition", [evidenceState.objectStateId, sequence, "REFINEMENT_PHASE_BOUNDED"], 14),
      sequence,
      event: refinementTriggered ? "REFINEMENT_PHASE_TRIGGERED" : "REFINEMENT_PHASE_NOT_TRIGGERED",
      factsAdded: [],
      candidateId: evidenceState.resolvedIdentity?.selectedCandidateId || "",
      outcome: exactFound ? "NOT_NEEDED_EXACT_CONFIRMED" : refinementTriggered ? "PLANNED" : "NO_SUPPORTED_REFINEMENT_QUERY",
      reason: exactFound
        ? "Exact evidence was already verified; no refinement query was needed."
        : refinementTriggered
          ? `No verified exact evidence was recovered; one bounded refinement phase was triggered by ${refinementPlan.length} materially new provenance-backed discriminator quer${refinementPlan.length === 1 ? "y" : "ies"}.`
          : "No verified exact evidence was recovered, but the Object Mind could not form a materially new provenance-backed discriminator query."
    }].slice(-24)
  };
  return { state: stateWithRefinement, searchPlan: refinementPlan };
}
