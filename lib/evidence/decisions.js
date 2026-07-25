import {
  deriveCanonicalRangeResults,
  deriveRange,
  deriveRetailLimitResult
} from "./range.js";

export { deriveRange } from "./range.js";

export const CANONICAL_CONFIDENCE_LEVELS = Object.freeze([
  "insufficient",
  "low",
  "medium",
  "high"
]);

export const CANONICAL_DECISION_CODES = Object.freeze([
  "need_more_information",
  "consider_purchase",
  "wait_for_better_price",
  "pass",
  "owner_value_assessment",
  "seller_listing_support"
]);

export const CANONICAL_BADGE_DEFINITIONS = Object.freeze({
  market_evidence_insufficient: Object.freeze({ label: "Market Evidence Insufficient", eligibility: "neutral_only", rationaleCodes: Object.freeze(["no_qualified_pricing_support"]) }),
  pricing_support_limited: Object.freeze({ label: "Pricing Support Limited", eligibility: "neutral_only", rationaleCodes: Object.freeze(["pricing_confidence_low", "canonical_support_is_not_verified_bargain_evidence"]) }),
  asking_price_context_only: Object.freeze({ label: "Asking-Price Context Only", eligibility: "neutral_only", rationaleCodes: Object.freeze(["pricing_confidence_low"]) }),
  qualified_retail_comparison: Object.freeze({ label: "Qualified Retail Comparison", eligibility: "eligible", rationaleCodes: Object.freeze(["qualified_current_retail_comparison"]) }),
  lower_qualified_offer_found: Object.freeze({ label: "Lower Qualified Offer Found", eligibility: "eligible", rationaleCodes: Object.freeze(["canonical_lower_offer_contradiction"]) }),
  above_supported_price: Object.freeze({ label: "Above Supported Price", eligibility: "eligible", rationaleCodes: Object.freeze(["entered_price_above_canonical_range"]) }),
  supported_value: Object.freeze({ label: "Supported Value", eligibility: "eligible", rationaleCodes: Object.freeze(["multiple_verified_sales_support_price"]) }),
  owner_value_supported: Object.freeze({ label: "Owner Value Evidence", eligibility: "eligible", rationaleCodes: Object.freeze(["owner_value_has_canonical_pricing_support"]) }),
  seller_evidence_supported: Object.freeze({ label: "Seller Evidence Context", eligibility: "eligible", rationaleCodes: Object.freeze(["seller_has_canonical_pricing_context"]) })
});

// This preserves the existing general fair-price tolerance. It is not product-specific.
export const CANONICAL_PRICE_COMPARISON_TOLERANCE_RATIO = 1.08;

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function list(value) {
  return Array.isArray(value) ? value : value === null || value === undefined || value === "" ? [] : [value];
}

function finitePrice(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function money(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function titleCase(value = "") {
  return String(value)
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function normalizeDecisionPurpose(value = "") {
  const purpose = String(value || "").trim().toLowerCase();
  if (/owner_value|value.*own|market_value/.test(purpose)) return "owner_value";
  if (/seller_listing|sell.*own|listing/.test(purpose)) return "seller_listing";
  if (/resale|resell|both/.test(purpose)) return "resale";
  return "personal";
}

function recordMap(finalized = {}) {
  return new Map((finalized.all || []).map((record) => [record.evidenceId, record]));
}

function recordsForIds(finalized = {}, ids = []) {
  const byId = recordMap(finalized);
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

function offerIdsForRecords(records = []) {
  return records.map((record) => record.underlyingOfferId).filter(Boolean);
}

function hasIdentifierAgreement(record = {}, targetIdentity = {}) {
  if (record.identity?.exactIdentifier) return true;
  const targetIdentifiers = unique([
    targetIdentity.upc,
    targetIdentity.sku,
    targetIdentity.model
  ].map((value) => String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase()));
  if (!targetIdentifiers.length) return false;
  const recordIdentifiers = unique([
    record.upc,
    record.sku,
    record.model,
    record.itemNumber
  ].map((value) => String(value || "").replace(/[^a-z0-9]/gi, "").toLowerCase()));
  return recordIdentifiers.some((value) => targetIdentifiers.includes(value));
}

export function deriveCanonicalIdentityConfidence(finalized = {}, targetIdentity = {}) {
  const accepted = finalized.all || [];
  const exact = accepted.filter((record) => record.exactIdentity === true);
  const identifierExact = exact.filter((record) => hasIdentifierAgreement(record, targetIdentity));
  const supporting = identifierExact.length ? identifierExact : exact.length ? exact : accepted;
  const conflictCount = accepted.filter((record) => (
    record.priceConflict?.status === "unresolved"
    || record.identity?.conflicts?.length
    || record.identityConflict === true
  )).length;
  const targetConflicts = unique(list(targetIdentity.identityConflictNotes));
  let level = "insufficient";
  const rationaleCodes = [];
  const weakeningFactors = [];

  if (identifierExact.length || exact.length >= 2) {
    level = "high";
    rationaleCodes.push(identifierExact.length ? "exact_identifier_support" : "multiple_exact_identity_sources");
  } else if (exact.length === 1) {
    level = "medium";
    rationaleCodes.push("one_exact_identity_source");
  } else if (accepted.length) {
    level = "low";
    rationaleCodes.push("compatible_identity_only");
  } else {
    rationaleCodes.push("no_accepted_identity_evidence");
  }

  if (!identifierExact.length) weakeningFactors.push("No accepted evidence record supplied an exact matching identifier.");
  if (!exact.length) weakeningFactors.push("No accepted exact-identity record was available.");
  if (conflictCount || targetConflicts.length) {
    weakeningFactors.push("Canonical identity evidence contains unresolved or reported attribute conflicts.");
    if (level === "high") level = "medium";
  }

  return {
    level,
    rationaleCodes: unique(rationaleCodes),
    supportingEvidenceIds: unique(supporting.map((record) => record.evidenceId)),
    supportingUnderlyingOfferIds: unique(offerIdsForRecords(supporting)),
    weakeningFactors: unique(weakeningFactors)
  };
}

function primaryPricingSupport(rangeResult = {}, retailLimitResult = {}, analysisMode = "collectible") {
  if (analysisMode === "retail") {
    return {
      evidenceIds: unique([
        ...(rangeResult.evidenceIds || []),
        ...(retailLimitResult.evidenceIds || [])
      ]),
      priceType: "current_retail"
    };
  }
  return {
    evidenceIds: unique(rangeResult.evidenceIds || []),
    priceType: rangeResult.priceType || "none"
  };
}

export function deriveCanonicalPricingConfidence(
  finalized = {},
  {
    analysisMode = "collectible",
    rangeResult = {},
    rangeResults = {},
    retailLimitResult = {}
  } = {}
) {
  const support = primaryPricingSupport(rangeResult, retailLimitResult, analysisMode);
  const decisionEligibleIds = new Set((finalized.decisionEligible || []).map((record) => record.evidenceId));
  const records = recordsForIds(finalized, support.evidenceIds).filter((record) => (
    decisionEligibleIds.has(record.evidenceId)
    && finitePrice(record.price) !== null
  ));
  const evidenceIds = unique(records.map((record) => record.evidenceId));
  const underlyingOfferIds = unique(offerIdsForRecords(records));
  const verifiedSoldCount = Number(rangeResults.verifiedSold?.independentOfferCount || 0);
  const currentRetailCount = Number(rangeResults.currentRetail?.independentOfferCount || 0);
  const activeAskingCount = Number(rangeResults.activeAsking?.independentOfferCount || 0);
  const unresolvedConflictCount = (finalized.all || []).filter((record) => record.priceConflict?.status === "unresolved").length;
  const unknownDeliveredCost = records.some((record) => (
    /unknown|unavailable|not confirmed/i.test(String(record.shippingStatus || record.deliveredCostStatus || ""))
    || (record.shippingStatus === undefined && record.deliveredCostAmount === undefined)
  ));
  const quantityUncertain = records.some((record) => record.qualification?.quantityCompatible === null);
  const availabilityUncertain = records.some((record) => (
    /unconfirmed|unknown|unavailable|stale/i.test(String(record.availabilityStatus || record.availability || ""))
  ));
  const rationaleCodes = [];
  const weakeningFactors = [];
  let level = "insufficient";

  if (!records.length) {
    rationaleCodes.push("no_qualified_priced_evidence");
  } else if (verifiedSoldCount >= 2) {
    level = "high";
    rationaleCodes.push("multiple_independent_verified_sales");
  } else if (analysisMode === "retail" && currentRetailCount >= 2) {
    level = currentRetailCount >= 3 ? "high" : "medium";
    rationaleCodes.push("multiple_independent_current_retail_offers");
  } else if (activeAskingCount >= 2) {
    level = "medium";
    rationaleCodes.push("multiple_independent_active_asking_offers");
  } else {
    level = "low";
    rationaleCodes.push("one_independent_priced_offer");
  }

  if (activeAskingCount > 0 && verifiedSoldCount === 0 && analysisMode !== "retail") {
    weakeningFactors.push("Active asking prices are not verified realized sales.");
  }
  if (unresolvedConflictCount) weakeningFactors.push("At least one canonical identity record has an unresolved price conflict.");
  if (unknownDeliveredCost) weakeningFactors.push("Shipping or delivered cost is not fully established for all pricing support.");
  if (quantityUncertain) weakeningFactors.push("Package quantity compatibility is not explicit for all pricing support.");
  if (availabilityUncertain) weakeningFactors.push("Current availability is not fully confirmed for all pricing support.");
  if (rangeResult.status !== "established") weakeningFactors.push("At least two independent offers did not establish the primary numerical range.");

  return {
    level,
    priceType: support.priceType,
    rationaleCodes: unique(rationaleCodes),
    supportingEvidenceIds: evidenceIds,
    supportingUnderlyingOfferIds: unique(underlyingOfferIds),
    weakeningFactors: unique(weakeningFactors)
  };
}

function buildCanonicalComparison({
  analysisMode,
  userPrice,
  rangeResult,
  retailLimitResult
}) {
  if (!Number.isFinite(userPrice) || userPrice <= 0) {
    return {
      status: "user_price_missing",
      basis: "none",
      userPrice: null,
      referenceLow: null,
      referenceHigh: null,
      referenceAmount: null,
      differenceAmount: null,
      ratio: null,
      supportingEvidenceIds: [],
      supportingUnderlyingOfferIds: []
    };
  }
  if (analysisMode === "retail") {
    if (retailLimitResult.status !== "established" || !Number.isFinite(retailLimitResult.amount)) {
      return {
        status: "retail_limit_not_established",
        basis: "retail_limit",
        userPrice,
        referenceLow: null,
        referenceHigh: null,
        referenceAmount: null,
        differenceAmount: null,
        ratio: null,
        supportingEvidenceIds: [],
        supportingUnderlyingOfferIds: []
      };
    }
    const referenceAmount = retailLimitResult.amount;
    const ratio = userPrice / referenceAmount;
    const status = userPrice <= referenceAmount
      ? "at_or_below_retail_limit"
      : ratio <= CANONICAL_PRICE_COMPARISON_TOLERANCE_RATIO
        ? "within_retail_tolerance"
        : "lower_qualified_offer_materially_undercuts";
    return {
      status,
      basis: "retail_limit",
      userPrice,
      referenceLow: referenceAmount,
      referenceHigh: referenceAmount,
      referenceAmount,
      differenceAmount: money(userPrice - referenceAmount),
      ratio,
      supportingEvidenceIds: [...(retailLimitResult.evidenceIds || [])],
      supportingUnderlyingOfferIds: [...(retailLimitResult.underlyingOfferIds || [])]
    };
  }
  if (rangeResult.status === "established") {
    const ratio = userPrice / rangeResult.high;
    const status = userPrice < rangeResult.low
      ? "below_supported_range"
      : userPrice <= rangeResult.high
        ? "within_supported_range"
        : ratio <= CANONICAL_PRICE_COMPARISON_TOLERANCE_RATIO
          ? "within_supported_tolerance"
          : "above_supported_range";
    return {
      status,
      basis: rangeResult.priceType,
      userPrice,
      referenceLow: rangeResult.low,
      referenceHigh: rangeResult.high,
      referenceAmount: rangeResult.high,
      differenceAmount: money(userPrice - rangeResult.high),
      ratio,
      supportingEvidenceIds: [...(rangeResult.evidenceIds || [])],
      supportingUnderlyingOfferIds: [...(rangeResult.underlyingOfferIds || [])]
    };
  }
  if (rangeResult.status === "single_observation") {
    return {
      status: "single_observation_only",
      basis: rangeResult.priceType,
      userPrice,
      referenceLow: null,
      referenceHigh: null,
      referenceAmount: rangeResult.observedPrice,
      differenceAmount: money(userPrice - rangeResult.observedPrice),
      ratio: userPrice / rangeResult.observedPrice,
      supportingEvidenceIds: [...(rangeResult.evidenceIds || [])],
      supportingUnderlyingOfferIds: [...(rangeResult.underlyingOfferIds || [])]
    };
  }
  return {
    status: "market_evidence_insufficient",
    basis: "none",
    userPrice,
    referenceLow: null,
    referenceHigh: null,
    referenceAmount: null,
    differenceAmount: null,
    ratio: null,
    supportingEvidenceIds: [],
    supportingUnderlyingOfferIds: []
  };
}

function hardConditionRisk(decisionContext = {}) {
  const text = [
    decisionContext.condition,
    ...list(decisionContext.conditionConcerns)
  ].join(" ").toLowerCase();
  return /not[_ -]?working|unsafe|authenticity|counterfeit|missing[_ -]?(?:parts|critical)|cracks?|repair|contaminat|mold|smoke|odor/.test(text);
}

function decisionSummary(recommendationCode, comparison, purpose) {
  if (recommendationCode === "owner_value_assessment") {
    return comparison.status === "market_evidence_insufficient"
      ? "Owner Value Assessment — Identity may be supported, but canonical pricing evidence is insufficient to establish market value."
      : "Owner Value Assessment — Canonical pricing evidence is available for valuation context; condition and selling venue still affect realized value.";
  }
  if (recommendationCode === "seller_listing_support") {
    return "Seller Listing Support — Use canonical evidence as pricing context without treating asking prices as realized value.";
  }
  if (recommendationCode === "wait_for_better_price") {
    return "Wait for a Better Price — A lower qualified canonical current-retail offer materially undercuts the entered price.";
  }
  if (recommendationCode === "pass") {
    return "Pass — The entered price is above the supported canonical price range or the unresolved risk is too high.";
  }
  if (recommendationCode === "consider_purchase") {
    return purpose === "resale"
      ? "Buy If It Fits Your Resale Requirements — Canonical price evidence is supportive, but fees, shipping, condition, liquidity, and required margin remain separate."
      : "Buy If It Fits Your Needs — Canonical price evidence supports a cautious purchase, without claiming this is the best available price.";
  }
  return "Need More Information — Canonical pricing evidence is insufficient for a market-supported purchase recommendation.";
}

export function deriveCanonicalDecisionResult({
  finalized = {},
  purpose = "personal",
  analysisMode = "collectible",
  userPrice = null,
  rangeResult = {},
  retailLimitResult = {},
  confidenceResult = {},
  decisionContext = {}
} = {}) {
  const normalizedPurpose = normalizeDecisionPurpose(purpose);
  const price = finitePrice(userPrice);
  let comparison = buildCanonicalComparison({
    analysisMode,
    userPrice: price,
    rangeResult,
    retailLimitResult
  });
  if (
    ["owner_value", "seller_listing"].includes(normalizedPurpose)
    && comparison.status === "user_price_missing"
  ) {
    const support = rangeResult.status === "established" || rangeResult.status === "single_observation"
      ? rangeResult
      : retailLimitResult.status === "established"
        ? retailLimitResult
        : null;
    if (support) {
      comparison = {
        ...comparison,
        status: "canonical_pricing_context",
        basis: rangeResult.status === "established" || rangeResult.status === "single_observation"
          ? rangeResult.priceType
          : "retail_limit",
        referenceLow: Number.isFinite(rangeResult.low) ? rangeResult.low : null,
        referenceHigh: Number.isFinite(rangeResult.high) ? rangeResult.high : null,
        referenceAmount: finitePrice(rangeResult.observedPrice) || finitePrice(retailLimitResult.amount),
        supportingEvidenceIds: [...(support.evidenceIds || [])],
        supportingUnderlyingOfferIds: [...(support.underlyingOfferIds || [])]
      };
    }
  }
  const rationaleCodes = [];
  const insufficiencyReasons = [];
  const contradictions = [];
  let status = "insufficient";
  let recommendationCode = "need_more_information";

  if (normalizedPurpose === "owner_value") {
    status = confidenceResult.pricing?.level === "insufficient" ? "insufficient" : "assessment_only";
    recommendationCode = "owner_value_assessment";
    rationaleCodes.push("owner_value_purpose");
  } else if (normalizedPurpose === "seller_listing") {
    status = confidenceResult.pricing?.level === "insufficient" ? "insufficient" : "seller_support";
    recommendationCode = "seller_listing_support";
    rationaleCodes.push("seller_listing_purpose");
  } else if (comparison.status === "user_price_missing") {
    insufficiencyReasons.push("A user-entered price is required for a purchase recommendation.");
    rationaleCodes.push("user_price_missing");
  } else if (comparison.status === "lower_qualified_offer_materially_undercuts") {
    status = "unfavorable";
    recommendationCode = "wait_for_better_price";
    rationaleCodes.push("lower_qualified_current_retail_offer");
    contradictions.push("entered_price_above_canonical_retail_limit");
  } else if (comparison.status === "above_supported_range") {
    status = "unfavorable";
    recommendationCode = "pass";
    rationaleCodes.push("entered_price_above_supported_range");
    contradictions.push("entered_price_exceeds_canonical_range");
  } else if (
    comparison.status === "at_or_below_retail_limit"
    || comparison.status === "within_retail_tolerance"
    || comparison.status === "below_supported_range"
    || comparison.status === "within_supported_range"
    || comparison.status === "within_supported_tolerance"
  ) {
    status = "conditional";
    recommendationCode = "consider_purchase";
    rationaleCodes.push(comparison.status);
  } else if (comparison.status === "single_observation_only") {
    rationaleCodes.push("one_observed_price_is_not_market_value");
    insufficiencyReasons.push("One active priced observation does not establish market value.");
  } else {
    rationaleCodes.push("canonical_pricing_support_insufficient");
    insufficiencyReasons.push("No established canonical range or retail limit supports a market-based purchase recommendation.");
  }

  rationaleCodes.push(`identity_confidence_${confidenceResult.identity?.level || "insufficient"}`);
  rationaleCodes.push(`pricing_confidence_${confidenceResult.pricing?.level || "insufficient"}`);
  if (
    recommendationCode === "consider_purchase"
    && confidenceResult.pricing?.level === "insufficient"
  ) {
    status = "insufficient";
    recommendationCode = "need_more_information";
    rationaleCodes.push("pricing_confidence_cannot_support_purchase");
    insufficiencyReasons.push("Canonical pricing confidence is insufficient for a market-supported purchase recommendation.");
  }
  if (
    recommendationCode === "consider_purchase"
    && confidenceResult.identity?.level === "insufficient"
  ) {
    status = "insufficient";
    recommendationCode = "need_more_information";
    rationaleCodes.push("identity_confidence_cannot_support_purchase");
    insufficiencyReasons.push("Canonical identity confidence is insufficient for a purchase recommendation.");
  }
  if (hardConditionRisk(decisionContext) && recommendationCode === "consider_purchase") {
    status = "insufficient";
    recommendationCode = "need_more_information";
    rationaleCodes.push("supported_condition_risk_requires_verification");
    contradictions.push("condition_or_authenticity_risk");
  }
  if (
    normalizedPurpose === "resale"
    && recommendationCode === "consider_purchase"
    && confidenceResult.pricing?.level !== "high"
  ) {
    status = "insufficient";
    recommendationCode = "need_more_information";
    rationaleCodes.push("resale_requires_stronger_realized_value_support");
    insufficiencyReasons.push("Resale fees, delivered cost, liquidity, condition, and required margin are not fully supported by the canonical pricing evidence.");
  }

  const supportingRecords = recordsForIds(finalized, comparison.supportingEvidenceIds)
    .filter((record) => record.decisionEligible === true);
  const supportingEvidenceIds = unique(supportingRecords.map((record) => record.evidenceId));
  const supportingUnderlyingOfferIds = unique(offerIdsForRecords(supportingRecords));
  return {
    status,
    recommendationCode,
    recommendationLabel: recommendationCode === "need_more_information"
      ? "Need More Information"
      : recommendationCode === "consider_purchase"
        ? normalizedPurpose === "resale"
          ? "Buy If It Fits Your Resale Requirements"
          : "Buy If It Fits Your Needs"
        : recommendationCode === "wait_for_better_price"
          ? "Wait for a Better Price"
          : recommendationCode === "pass"
            ? "Pass"
            : titleCase(recommendationCode),
    purpose: normalizedPurpose,
    rationaleCodes: unique(rationaleCodes),
    summary: decisionSummary(recommendationCode, comparison, normalizedPurpose),
    supportingEvidenceIds,
    supportingUnderlyingOfferIds,
    rangeSupportIds: [...(rangeResult.evidenceIds || [])],
    retailLimitSupportIds: [...(retailLimitResult.evidenceIds || [])],
    insufficiencyReasons: unique(insufficiencyReasons),
    contradictions: unique(contradictions),
    userPrice: price,
    canonicalComparisonResult: comparison
  };
}

export function deriveCanonicalBadgeResult({
  decisionResult = {},
  confidenceResult = {},
  rangeResult = {},
  rangeResults = {}
} = {}) {
  const pricingLevel = confidenceResult.pricing?.level || "insufficient";
  const comparisonStatus = decisionResult.canonicalComparisonResult?.status;
  let code = "market_evidence_insufficient";
  const rationaleCodes = [];

  if (decisionResult.purpose === "owner_value" && ["medium", "high"].includes(pricingLevel)) {
    code = "owner_value_supported";
    rationaleCodes.push("owner_value_has_canonical_pricing_support");
  } else if (decisionResult.purpose === "seller_listing" && ["medium", "high"].includes(pricingLevel)) {
    code = "seller_evidence_supported";
    rationaleCodes.push("seller_has_canonical_pricing_context");
  } else if (comparisonStatus === "lower_qualified_offer_materially_undercuts") {
    code = "lower_qualified_offer_found";
    rationaleCodes.push("canonical_lower_offer_contradiction");
  } else if (comparisonStatus === "above_supported_range") {
    code = "above_supported_price";
    rationaleCodes.push("entered_price_above_canonical_range");
  } else if (pricingLevel === "insufficient") {
    rationaleCodes.push("no_qualified_pricing_support");
  } else if (pricingLevel === "low") {
    code = rangeResult.status === "single_observation" && rangeResult.priceType === "active_asking"
      ? "asking_price_context_only"
      : "pricing_support_limited";
    rationaleCodes.push("pricing_confidence_low");
  } else if (
    Number(rangeResults.verifiedSold?.independentOfferCount || 0) >= 2
    && ["below_supported_range", "within_supported_range"].includes(comparisonStatus)
  ) {
    code = "supported_value";
    rationaleCodes.push("multiple_verified_sales_support_price");
  } else if (
    rangeResult.priceType === "current_retail"
    && ["at_or_below_retail_limit", "within_retail_tolerance"].includes(comparisonStatus)
  ) {
    code = "qualified_retail_comparison";
    rationaleCodes.push("qualified_current_retail_comparison");
  } else {
    code = "pricing_support_limited";
    rationaleCodes.push("canonical_support_is_not_verified_bargain_evidence");
  }

  const definition = CANONICAL_BADGE_DEFINITIONS[code];
  return {
    code,
    label: definition.label,
    eligibility: definition.eligibility,
    rationaleCodes,
    supportingEvidenceIds: [...(decisionResult.supportingEvidenceIds || [])],
    supportingUnderlyingOfferIds: [...(decisionResult.supportingUnderlyingOfferIds || [])]
  };
}

export function deriveDecision(
  finalized = {},
  {
    askingPrice = null,
    purpose = "personal",
    mode = "collectible",
    rangeResult: suppliedRangeResult = null,
    rangeResults: suppliedRangeResults = null,
    retailLimitResult: suppliedRetailLimitResult = null,
    targetIdentity = {},
    decisionContext = {}
  } = {}
) {
  const derivedRanges = suppliedRangeResult && suppliedRangeResults
    ? { rangeResult: suppliedRangeResult, rangeResults: suppliedRangeResults }
    : deriveCanonicalRangeResults(finalized, { analysisMode: mode });
  const retailLimitResult = suppliedRetailLimitResult
    || deriveRetailLimitResult(finalized, targetIdentity, { analysisMode: mode });
  const confidenceResult = {
    identity: deriveCanonicalIdentityConfidence(finalized, targetIdentity),
    pricing: deriveCanonicalPricingConfidence(finalized, {
      analysisMode: mode,
      rangeResult: derivedRanges.rangeResult,
      rangeResults: derivedRanges.rangeResults,
      retailLimitResult
    })
  };
  const decisionResult = deriveCanonicalDecisionResult({
    finalized,
    purpose,
    analysisMode: mode,
    userPrice: finitePrice(askingPrice),
    rangeResult: derivedRanges.rangeResult,
    retailLimitResult,
    confidenceResult,
    decisionContext
  });
  const badgeResult = deriveCanonicalBadgeResult({
    decisionResult,
    confidenceResult,
    rangeResult: derivedRanges.rangeResult,
    rangeResults: derivedRanges.rangeResults
  });
  const soldRecordCount = Number(derivedRanges.rangeResults.verifiedSold?.independentOfferCount || 0);
  const exactProductFound = (finalized.counts?.exact || 0) > 0;
  return {
    decisionResult,
    confidenceResult,
    badgeResult,
    recommendation: decisionResult.recommendationLabel,
    recommendationCode: decisionResult.recommendationCode,
    confidence: titleCase(confidenceResult.pricing.level),
    pricingConfidence: titleCase(confidenceResult.pricing.level),
    identityConfidence: titleCase(confidenceResult.identity.level),
    badge: badgeResult.label,
    range: derivedRanges.rangeResult,
    recoveryNeeded: !exactProductFound,
    transactionEvidence: soldRecordCount > 0,
    soldRecordCount,
    exactProductFound,
    finalizedCustomerRecordIds: finalized.finalizedCustomerRecordIds || []
  };
}
