import { deriveDecision } from "./decisions.js";
import {
  isPersonalBuyEvidencePurpose,
  selectCustomerEvidenceForDisplay,
  serializeCanonicalCustomerEvidence
} from "./customer.js";
import { diagnosticsFromFinalEvidence } from "./diagnostics.js";
import { assembleFinalEvidence } from "./finalize.js";
import { deriveCanonicalBuyerOfferResult } from "./offer.js";
import {
  deriveCanonicalRangeResults,
  deriveRetailLimitResult,
  projectLegacyRange
} from "./range.js";

export const FINAL_EVIDENCE_SCHEMA_VERSION = "1.0";

function uniqueIds(records = []) {
  return [...new Set(records.map((record) => record.evidenceId).filter(Boolean))];
}

function rejectedEvidenceId(record = {}) {
  const offerId = record.underlyingOfferId || record.evidenceId || "unknown-offer";
  const observationId = record.sourceRecordId || record.providerRecordId || record.originalUrl || record.destinationUrl || record.url || "unknown-observation";
  return `rejected:${offerId}:${observationId}`;
}

function normalizeRejectedRecords(records = [], acceptedIds = new Set()) {
  const byId = new Map();
  for (const record of records) {
    let evidenceId = rejectedEvidenceId(record);
    if (acceptedIds.has(evidenceId)) {
      evidenceId = `rejected:${evidenceId}`;
    }
    if (!byId.has(evidenceId)) {
      byId.set(evidenceId, {
        ...record,
        evidenceId,
        underlyingOfferId: record.underlyingOfferId || record.evidenceId
      });
    }
  }
  return [...byId.values()].sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
}

export function createFinalEvidenceResult({
  analysisId = "",
  analysisMode = "collectible",
  targetIdentity = {},
  observations = [],
  providerRequests = [],
  displayLimit = 8,
  askingPrice = null,
  purpose = "personal",
  decisionContext = {}
} = {}) {
  const finalized = assembleFinalEvidence(observations, targetIdentity, { displayLimit });
  const acceptedRecords = finalized.all;
  const acceptedIds = new Set(uniqueIds(acceptedRecords));
  const rejectedRecords = normalizeRejectedRecords(finalized.rejected, acceptedIds);
  const records = [...acceptedRecords, ...rejectedRecords];
  const personalBuyEvidencePurpose = isPersonalBuyEvidencePurpose(purpose);
  const customerEligible = analysisMode === "retail" && !personalBuyEvidencePurpose
    ? finalized.customerEligible.filter((record) => (
        record.priceType === "Current retail price"
        || (record.priceType === "Price unavailable" && record.identityReference)
      ))
    : finalized.customerEligible;
  const customerDisplaySelection = selectCustomerEvidenceForDisplay(customerEligible, {
    purpose,
    analysisMode,
    targetIdentity,
    decisionContext,
    displayLimit
  });
  const displayEligible = customerDisplaySelection.displayEligible;
  const display = customerDisplaySelection.display;
  const views = {
    acceptedIds: uniqueIds(acceptedRecords),
    customerEligibleIds: uniqueIds(customerEligible),
    displayEligibleIds: uniqueIds(displayEligible),
    displayedIds: uniqueIds(display),
    rangeEligibleIds: uniqueIds(finalized.rangeEligible),
    decisionEligibleIds: uniqueIds(finalized.decisionEligible),
    priceBearingIds: uniqueIds(finalized.priceBearing),
    exactMatchIds: uniqueIds(acceptedRecords.filter((record) => record.exactIdentity)),
    rejectedDiagnosticOnlyIds: uniqueIds(rejectedRecords)
  };
  const counts = Object.fromEntries(
    Object.entries(views).map(([name, ids]) => [name.replace(/Ids$/, "Count"), ids.length])
  );
  const { rangeResult, rangeResults } = deriveCanonicalRangeResults(finalized, { analysisMode });
  const retailLimitResult = deriveRetailLimitResult(finalized, targetIdentity, { analysisMode });
  const range = projectLegacyRange(rangeResult);
  counts.rangeSupportCount = rangeResult.evidenceIds.length;
  counts.retailLimitSupportCount = retailLimitResult.evidenceIds.length;
  const decisionPrice = decisionContext.userEnteredPriceRole === "explicit_personal_budget"
    ? null
    : askingPrice;
  const decision = deriveDecision(finalized, {
    askingPrice: decisionPrice,
    purpose,
    mode: analysisMode,
    rangeResult,
    rangeResults,
    retailLimitResult,
    targetIdentity,
    decisionContext
  });
  const { decisionResult, confidenceResult, badgeResult } = decision;
  const { customerEvidence, customerEvidenceSummary } = serializeCanonicalCustomerEvidence({
    records,
    views,
    badgeResult
  }, {
    askingPrice
  });
  const buyerOfferResult = deriveCanonicalBuyerOfferResult({
    finalized,
    purpose,
    analysisMode,
    userEnteredPrice: askingPrice,
    targetIdentity,
    rangeResult,
    rangeResults,
    retailLimitResult,
    decisionResult,
    confidenceResult,
    badgeResult,
    decisionContext
  });
  const canonicalDecision = {
    ...decision,
    openingOffer: buyerOfferResult.openingOffer,
    targetPrice: buyerOfferResult.targetPrice,
    maximumPrice: buyerOfferResult.maximumPrice,
    negotiationGuidance: buyerOfferResult.guidanceSummary,
    userBudget: buyerOfferResult.userEnteredPriceRole === "explicit_personal_budget"
      ? buyerOfferResult.userEnteredPrice
      : null
  };
  counts.decisionSupportCount = decisionResult.supportingEvidenceIds.length;
  counts.identityConfidenceSupportCount = confidenceResult.identity.supportingEvidenceIds.length;
  counts.pricingConfidenceSupportCount = confidenceResult.pricing.supportingEvidenceIds.length;
  counts.badgeSupportCount = badgeResult.supportingEvidenceIds.length;
  counts.buyerOfferSupportCount = buyerOfferResult.supportingEvidenceIds.length;
  counts.customerEvidenceCount = customerEvidence.length;
  const diagnosticFinalized = {
    ...finalized,
    counts: {
      ...finalized.counts,
      customerEligible: customerEligible.length,
      displayed: display.length
    },
    customerEligible,
    display,
    finalizedCustomerRecordIds: views.customerEligibleIds,
    displayedRecordIds: views.displayedIds
  };
  const diagnostics = {
    ...diagnosticsFromFinalEvidence(diagnosticFinalized, providerRequests),
    ...(customerDisplaySelection.policyApplied ? {
      personalBuyEvidenceUtilityPolicy: "ordered_utility_buckets_v1",
      personalBuyEvidenceUtilityDecisions: customerDisplaySelection.decisions,
      finalizedCustomerClassifications: customerDisplaySelection.decisions.map((decision) => ({
        evidenceId: decision.evidenceId,
        classification: acceptedRecords.find((record) => record.evidenceId === decision.evidenceId)?.canonicalMatchQuality || "",
        sourceChannel: decision.sourceChannel,
        utilityBucket: decision.utilityBucket,
        disposition: decision.disposition,
        reasonCode: decision.dispositionReasonCode
      }))
    } : {}),
    finalizedCustomerRecordIds: views.customerEligibleIds,
    displayedRecordIds: views.displayedIds,
    rejectedDiagnosticOnlyRecordIds: views.rejectedDiagnosticOnlyIds,
    canonicalRangeStatus: rangeResult.status,
    canonicalRangeSupportEvidenceIds: rangeResult.evidenceIds,
    canonicalRangeSupportUnderlyingOfferIds: rangeResult.underlyingOfferIds,
    canonicalRetailLimitStatus: retailLimitResult.status,
    canonicalRetailLimitSupportEvidenceIds: retailLimitResult.evidenceIds,
    canonicalRetailLimitSupportUnderlyingOfferIds: retailLimitResult.underlyingOfferIds,
    canonicalDecisionStatus: decisionResult.status,
    canonicalRecommendationCode: decisionResult.recommendationCode,
    canonicalDecisionSupportEvidenceIds: decisionResult.supportingEvidenceIds,
    canonicalDecisionSupportUnderlyingOfferIds: decisionResult.supportingUnderlyingOfferIds,
    canonicalIdentityConfidence: confidenceResult.identity.level,
    canonicalIdentityConfidenceLevel: confidenceResult.identity.level,
    canonicalIdentityConfidenceSupportEvidenceIds: confidenceResult.identity.supportingEvidenceIds,
    canonicalIdentityConfidenceSupportUnderlyingOfferIds: confidenceResult.identity.supportingUnderlyingOfferIds,
    canonicalPricingConfidenceLevel: confidenceResult.pricing.level,
    canonicalPricingConfidenceSupportEvidenceIds: confidenceResult.pricing.supportingEvidenceIds,
    canonicalPricingConfidenceSupportUnderlyingOfferIds: confidenceResult.pricing.supportingUnderlyingOfferIds,
    canonicalBadgeCode: badgeResult.code,
    canonicalBadgeSupportEvidenceIds: badgeResult.supportingEvidenceIds,
    canonicalBadgeSupportUnderlyingOfferIds: badgeResult.supportingUnderlyingOfferIds,
    canonicalCustomerEvidenceIds: customerEvidenceSummary.displayedIds,
    canonicalCustomerEvidenceCount: customerEvidenceSummary.counts.displayed,
    canonicalDisplayedCountByRetailer: customerEvidenceSummary.displayedCountByRetailer,
    canonicalDisplayedCountByPriceType: customerEvidenceSummary.displayedCountByPriceType,
    canonicalDisplayedCountByMatchClass: customerEvidenceSummary.displayedCountByMatchClass,
    canonicalBuyerOfferApplicability: buyerOfferResult.applicability,
    canonicalBuyerOfferStatus: buyerOfferResult.status,
    canonicalBuyerOfferBasisCode: buyerOfferResult.basisCode,
    canonicalBuyerOfferGuidanceCode: buyerOfferResult.guidanceCode,
    canonicalBuyerOfferUserEnteredPriceRole: buyerOfferResult.userEnteredPriceRole,
    canonicalBuyerOfferSupportEvidenceIds: buyerOfferResult.supportingEvidenceIds,
    canonicalBuyerOfferSupportUnderlyingOfferIds: buyerOfferResult.supportingUnderlyingOfferIds,
    canonicalBuyerOfferSupportCount: buyerOfferResult.supportingEvidenceIds.length
  };

  return {
    schemaVersion: FINAL_EVIDENCE_SCHEMA_VERSION,
    analysisId,
    analysisMode,
    targetIdentity,
    records,
    views,
    counts,
    diagnostics,
    rangeResult,
    rangeResults,
    retailLimitResult,
    decisionResult,
    confidenceResult,
    badgeResult,
    buyerOfferResult,
    customerEvidence,
    customerEvidenceSummary,
    range,
    decision: canonicalDecision,
    acceptedRecords,
    rejectedRecords,
    customerEligible,
    displayEligible,
    rangeEligible: finalized.rangeEligible,
    decisionEligible: finalized.decisionEligible,
    priceBearing: finalized.priceBearing,
    display
  };
}
