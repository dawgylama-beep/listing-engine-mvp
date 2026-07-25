import { normalizeDecisionPurpose } from "./decisions.js";

export const CANONICAL_BUYER_OFFER_APPLICABILITY = Object.freeze([
  "applicable",
  "not_applicable"
]);

export const CANONICAL_BUYER_OFFER_STATUSES = Object.freeze([
  "not_applicable",
  "insufficient_evidence",
  "asking_price_context_only",
  "retail_comparison_only",
  "asking_market_guidance",
  "market_supported",
  "resale_market_supported"
]);

export const CANONICAL_USER_ENTERED_PRICE_ROLES = Object.freeze([
  "not_provided",
  "observed_store_price",
  "seller_asking_price",
  "marketplace_asking_price",
  "proposed_purchase_price",
  "explicit_personal_budget",
  "unknown_transaction_amount"
]);

export const CANONICAL_BUYER_OFFER_GUIDANCE_CODES = Object.freeze([
  "not_applicable",
  "collect_more_pricing_evidence",
  "asking_price_context_only",
  "compare_qualified_retail_offers",
  "retail_price_not_verified",
  "canonical_decision_does_not_permit_offer",
  "active_asking_offer_guardrail",
  "verified_sold_offer_guardrail",
  "resale_verified_sold_guardrail"
]);

const PERSONAL_GOOD_PRICE_RATIO = 0.9;
const PERSONAL_HIGH_PRICE_RATIO = 1.08;
const PERSONAL_CONDITION_MULTIPLIERS = Object.freeze({
  hard: 0.84,
  moderate: 0.94,
  ordinary: 1.04
});

function finitePrice(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function money(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function unique(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function normalizePurchaseContext(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const aliases = {
    mall: "retail_store",
    online_marketplace: "ebay_etsy_mercari",
    consignment_store: "thrift_store",
    flea_market: "flea_market_yard_sale",
    yard_sale: "flea_market_yard_sale"
  };
  return aliases[normalized] || normalized;
}

export function deriveCanonicalUserEnteredPriceRole({
  userEnteredPrice = null,
  explicitRole = "",
  analysisMode = "collectible",
  purchaseContext = ""
} = {}) {
  if (finitePrice(userEnteredPrice) === null) return "not_provided";
  const suppliedRole = String(explicitRole || "").trim().toLowerCase();
  if (CANONICAL_USER_ENTERED_PRICE_ROLES.includes(suppliedRole)) return suppliedRole;
  const context = normalizePurchaseContext(purchaseContext);
  if (analysisMode === "retail" || /^(retail_store|online_retailer)$/.test(context)) {
    return "observed_store_price";
  }
  if (context === "ebay_etsy_mercari") return "marketplace_asking_price";
  if (/^(facebook_marketplace|private_seller|flea_market_yard_sale|thrift_store|estate_sale|antique_mall)$/.test(context)) {
    return "seller_asking_price";
  }
  return "unknown_transaction_amount";
}

function recordsForSupport(finalized = {}, evidenceIds = []) {
  const eligibleById = new Map((finalized.decisionEligible || []).map((record) => [record.evidenceId, record]));
  return evidenceIds.map((id) => eligibleById.get(id)).filter((record) => (
    record
    && record.decisionEligible === true
    && record.eligible !== false
    && finitePrice(record.price) !== null
    && record.priceConflict?.status !== "unresolved"
  ));
}

function supportFromRecords(records = []) {
  return {
    evidenceIds: records.map((record) => record.evidenceId),
    underlyingOfferIds: records.map((record) => record.underlyingOfferId)
  };
}

function deriveDeliveredCostFactors(records = [], decisionContext = {}) {
  if (!records.length) return [];
  const knownDelivered = records.filter((record) => finitePrice(record.deliveredCostAmount) !== null);
  const factors = [];
  if (knownDelivered.length === records.length) {
    factors.push("all_support_has_delivered_cost");
  } else if (knownDelivered.length) {
    factors.push("some_support_missing_delivered_cost");
  } else if (finitePrice(decisionContext.knownShippingAmount) !== null) {
    factors.push("user_supplied_shipping_not_market_evidence");
  } else {
    factors.push("shipping_or_checkout_cost_not_established");
  }
  factors.push("taxes_not_established_unless_source_confirms");
  return factors;
}

function deriveQuantityContext(records = [], targetIdentity = {}, retailLimitResult = {}) {
  const quantities = records.map((record) => ({
    evidenceId: record.evidenceId,
    quantity: finitePrice(record.quantity ?? record.packageQuantity)
  }));
  const unresolved = records.some((record) => record.qualification?.quantityCompatible === null);
  return {
    targetQuantity: finitePrice(targetIdentity.quantity),
    supportQuantities: quantities,
    compatibilityStatus: unresolved ? "partially_unresolved" : "qualified",
    retailLimitQuantityContext: retailLimitResult.quantityContext || null
  };
}

function deriveAvailabilityContext(records = [], decisionContext = {}) {
  const states = records.map((record) => String(
    record.availabilityStatus
    || record.availability
    || record.listingStatus
    || "unknown"
  ).trim().toLowerCase());
  const uncertain = states.some((state) => !state || /unknown|unconfirmed|unavailable|stale/.test(state));
  return {
    status: uncertain ? "not_fully_confirmed" : "supported_by_source_records",
    supportStates: states,
    requestContext: String(decisionContext.availabilityContext || "").trim()
  };
}

function contextContradictions(records, decisionResult, deliveredCostFactors, quantityContext, availabilityContext) {
  const contradictions = [...(decisionResult.contradictions || [])];
  if (deliveredCostFactors.includes("shipping_or_checkout_cost_not_established")
    || deliveredCostFactors.includes("some_support_missing_delivered_cost")) {
    contradictions.push("delivered_cost_not_fully_established");
  }
  if (quantityContext.compatibilityStatus !== "qualified") {
    contradictions.push("quantity_compatibility_not_fully_established");
  }
  if (availabilityContext.status !== "supported_by_source_records") {
    contradictions.push("availability_not_fully_confirmed");
  }
  if (records.some((record) => record.qualification?.dimensionsCompatible === null)) {
    contradictions.push("dimensions_compatibility_not_fully_established");
  }
  return unique(contradictions);
}

function blankResult({
  purpose,
  userEnteredPrice,
  userEnteredPriceRole,
  rangeResult,
  retailLimitResult,
  confidenceResult
}) {
  return {
    applicability: ["owner_value", "seller_listing"].includes(purpose) ? "not_applicable" : "applicable",
    status: ["owner_value", "seller_listing"].includes(purpose) ? "not_applicable" : "insufficient_evidence",
    purpose,
    basisCode: "none",
    currency: "USD",
    openingOffer: null,
    targetPrice: null,
    maximumPrice: null,
    userEnteredPrice,
    userEnteredPriceRole,
    marketRangeStatus: rangeResult.status || "insufficient",
    pricingConfidenceLevel: confidenceResult.pricing?.level || "insufficient",
    supportingEvidenceIds: [],
    supportingUnderlyingOfferIds: [],
    rangeSupportIds: [...(rangeResult.evidenceIds || [])],
    retailLimitSupportIds: [...(retailLimitResult.evidenceIds || [])],
    rationaleCodes: [],
    insufficiencyReasons: [],
    deliveredCostFactors: [],
    quantityContext: {
      targetQuantity: null,
      supportQuantities: [],
      compatibilityStatus: "not_evaluated",
      retailLimitQuantityContext: retailLimitResult.quantityContext || null
    },
    availabilityContext: {
      status: "not_evaluated",
      supportStates: [],
      requestContext: ""
    },
    guidanceCode: "collect_more_pricing_evidence",
    guidanceSummary: "",
    isMarketSupported: false,
    isBudgetOnly: userEnteredPriceRole === "explicit_personal_budget",
    contradictions: []
  };
}

function roundOpeningOffer(targetPrice, factor) {
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) return null;
  if (targetPrice <= 1) return money(targetPrice);
  const amount = targetPrice <= 25
    ? Math.max(1, Math.floor(targetPrice * factor))
    : Math.max(1, targetPrice * factor);
  return money(Math.min(amount, targetPrice));
}

function personalOfferAmounts({ userEnteredPrice, userEnteredPriceRole, rangeResult, decisionContext }) {
  const center = (rangeResult.low + rangeResult.high) / 2;
  const riskLevel = ["hard", "moderate"].includes(decisionContext.conditionRiskLevel)
    ? decisionContext.conditionRiskLevel
    : "ordinary";
  let maximumPrice = Math.min(
    rangeResult.high,
    center * PERSONAL_CONDITION_MULTIPLIERS[riskLevel]
  );
  const transactionPrice = [
    "seller_asking_price",
    "marketplace_asking_price",
    "proposed_purchase_price"
  ].includes(userEnteredPriceRole)
    ? finitePrice(userEnteredPrice)
    : null;
  let targetPrice = transactionPrice === null
    ? Math.min(center, maximumPrice)
    : Math.min(transactionPrice, maximumPrice);
  let openingFactor = 0.88;
  if (transactionPrice !== null && transactionPrice <= center * PERSONAL_GOOD_PRICE_RATIO) {
    targetPrice = transactionPrice;
    openingFactor = 0.82;
    maximumPrice = Math.max(targetPrice, Math.min(rangeResult.high, center * 1.03, maximumPrice));
  } else if (transactionPrice !== null && transactionPrice > center * PERSONAL_HIGH_PRICE_RATIO) {
    targetPrice = Math.min(maximumPrice, center * 0.96);
    openingFactor = 0.86;
  }
  if (userEnteredPriceRole === "explicit_personal_budget") {
    maximumPrice = Math.min(maximumPrice, userEnteredPrice);
    targetPrice = Math.min(targetPrice, maximumPrice);
  }
  maximumPrice = money(maximumPrice);
  targetPrice = money(Math.min(targetPrice, maximumPrice));
  return {
    openingOffer: roundOpeningOffer(targetPrice, openingFactor),
    targetPrice,
    maximumPrice
  };
}

function resaleOfferAmounts({ userEnteredPrice, userEnteredPriceRole, rangeResult, decisionContext, targetIdentity }) {
  const conservativeSale = finitePrice(rangeResult.low);
  if (conservativeSale === null) return null;
  const context = normalizePurchaseContext(decisionContext.purchaseContext);
  const condition = String(decisionContext.condition || "").toLowerCase();
  const concerns = Array.isArray(decisionContext.conditionConcerns)
    ? decisionContext.conditionConcerns
    : [];
  const localPurchase = /facebook|private|flea|estate|thrift|consignment|antique|local/.test(context);
  const damagedOrUntested = /damaged|missing|untested|unknown/.test(condition)
    || concerns.some((item) => /damage|missing|cracks|not_working|untested|incomplete|authenticity|odor/.test(String(item)));
  const hasIdentifier = decisionContext.hasIdentifier === true || [
    targetIdentity.upc,
    targetIdentity.sku,
    targetIdentity.model,
    targetIdentity.brand,
    targetIdentity.productName
  ].some((value) => String(value || "").trim());
  const sellingCostRate = localPurchase ? 0.1 : 0.18;
  const conditionAllowance = damagedOrUntested ? 0.18 : 0.08;
  const identityAllowance = hasIdentifier ? 0.06 : 0.14;
  const uncertaintyAllowance = 0.16 + Math.min(0.12, concerns.length * 0.03) + identityAllowance;
  const requiredProfit = Math.max(
    conservativeSale <= 35 ? 8 : 10,
    conservativeSale * (String(decisionContext.purchaseIntent || "").toLowerCase() === "both" ? 0.14 : 0.16)
  );
  const riskAdjustedNet = conservativeSale * Math.max(
    0.2,
    1 - sellingCostRate - conditionAllowance - uncertaintyAllowance
  );
  let maximumPrice = money(riskAdjustedNet - requiredProfit);
  if (maximumPrice === null || maximumPrice <= 0) return null;
  if (userEnteredPriceRole === "explicit_personal_budget") {
    maximumPrice = money(Math.min(maximumPrice, userEnteredPrice));
  }
  const transactionPrice = [
    "seller_asking_price",
    "marketplace_asking_price",
    "proposed_purchase_price"
  ].includes(userEnteredPriceRole)
    ? finitePrice(userEnteredPrice)
    : null;
  const targetPrice = money(transactionPrice === null
    ? maximumPrice
    : Math.min(transactionPrice, maximumPrice));
  const openingOffer = roundOpeningOffer(
    Math.min(targetPrice, maximumPrice),
    0.7
  );
  return {
    openingOffer,
    targetPrice,
    maximumPrice
  };
}

function withSupportContext(result, {
  records,
  targetIdentity,
  retailLimitResult,
  decisionResult,
  decisionContext
}) {
  const support = supportFromRecords(records);
  const deliveredCostFactors = deriveDeliveredCostFactors(records, decisionContext);
  const quantityContext = deriveQuantityContext(records, targetIdentity, retailLimitResult);
  const availabilityContext = deriveAvailabilityContext(records, decisionContext);
  return {
    ...result,
    supportingEvidenceIds: support.evidenceIds,
    supportingUnderlyingOfferIds: support.underlyingOfferIds,
    deliveredCostFactors,
    quantityContext,
    availabilityContext,
    contradictions: contextContradictions(
      records,
      decisionResult,
      deliveredCostFactors,
      quantityContext,
      availabilityContext
    )
  };
}

export function deriveCanonicalBuyerOfferResult({
  finalized = {},
  purpose = "personal",
  analysisMode = "collectible",
  userEnteredPrice = null,
  targetIdentity = {},
  rangeResult = {},
  rangeResults = {},
  retailLimitResult = {},
  decisionResult = {},
  confidenceResult = {},
  badgeResult = {},
  decisionContext = {}
} = {}) {
  const normalizedPurpose = normalizeDecisionPurpose(purpose);
  const enteredPrice = finitePrice(userEnteredPrice);
  const userEnteredPriceRole = deriveCanonicalUserEnteredPriceRole({
    userEnteredPrice: enteredPrice,
    explicitRole: decisionContext.userEnteredPriceRole,
    analysisMode,
    purchaseContext: decisionContext.purchaseContext
  });
  let result = blankResult({
    purpose: normalizedPurpose,
    userEnteredPrice: enteredPrice,
    userEnteredPriceRole,
    rangeResult,
    retailLimitResult,
    confidenceResult
  });

  if (result.applicability === "not_applicable") {
    return {
      ...result,
      guidanceCode: "not_applicable",
      guidanceSummary: "Buyer offer and negotiation guidance is not applicable to owner-value or seller-listing purposes.",
      rationaleCodes: [`${normalizedPurpose}_buyer_offer_not_applicable`]
    };
  }

  if (analysisMode === "retail") {
    const retailRecords = recordsForSupport(finalized, retailLimitResult.evidenceIds || []);
    result = withSupportContext({
      ...result,
      status: retailLimitResult.status === "established"
        ? "retail_comparison_only"
        : "insufficient_evidence",
      basisCode: retailLimitResult.status === "established"
        ? "current_retail_comparison"
        : "none",
      guidanceCode: retailLimitResult.status === "established"
        ? "compare_qualified_retail_offers"
        : "retail_price_not_verified",
      guidanceSummary: retailLimitResult.status === "established"
        ? `Use the qualified current-retail comparison at $${retailLimitResult.amount.toFixed(2)} and verify package quantity, availability, shipping or pickup, taxes, and checkout cost. Ordinary retail comparison does not create an opening offer, negotiation target, or buyer maximum.`
        : "No qualified current-retail comparison was established. Verify the exact package, current price, availability, taxes, and pickup or delivery terms.",
      rationaleCodes: retailLimitResult.status === "established"
        ? ["ordinary_retail_negotiation_not_applicable", "canonical_retail_limit_is_authoritative"]
        : ["canonical_retail_limit_not_established"],
      insufficiencyReasons: retailLimitResult.status === "established"
        ? []
        : [retailLimitResult.insufficiencyReason || "No canonical current-retail comparison was established."]
    }, {
      records: retailRecords,
      targetIdentity,
      retailLimitResult,
      decisionResult,
      decisionContext
    });
    return result;
  }

  const rangeRecords = recordsForSupport(finalized, rangeResult.evidenceIds || []);
  result = withSupportContext(result, {
    records: rangeRecords,
    targetIdentity,
    retailLimitResult,
    decisionResult,
    decisionContext
  });

  if (rangeResult.status !== "established") {
    const oneActiveAsk = rangeResult.status === "single_observation"
      && rangeResult.priceType === "active_asking"
      && Number(rangeResults.verifiedSold?.independentOfferCount || 0) === 0;
    return {
      ...result,
      status: oneActiveAsk ? "asking_price_context_only" : "insufficient_evidence",
      basisCode: oneActiveAsk ? "single_active_asking_observation" : "none",
      guidanceCode: oneActiveAsk ? "asking_price_context_only" : "collect_more_pricing_evidence",
      guidanceSummary: oneActiveAsk
        ? "One active asking price is context only. It does not establish market value, an opening offer, a target purchase price, or a buyer maximum."
        : "Collect at least two independent qualified prices of the appropriate type, with condition and delivered-cost context, before setting numerical buyer guidance.",
      rationaleCodes: oneActiveAsk
        ? ["one_active_asking_price_is_not_a_market_range"]
        : ["canonical_numerical_range_not_established"],
      insufficiencyReasons: [
        rangeResult.insufficiencyReason
        || "Canonical pricing evidence is insufficient for numerical buyer guidance."
      ],
      isMarketSupported: false
    };
  }

  if (
    confidenceResult.pricing?.level === "insufficient"
    || !["consider_purchase", "pass"].includes(decisionResult.recommendationCode)
  ) {
    return {
      ...result,
      status: "insufficient_evidence",
      basisCode: rangeResult.priceType,
      guidanceCode: "canonical_decision_does_not_permit_offer",
      guidanceSummary: "The canonical decision or pricing confidence does not permit numerical buyer-offer guidance.",
      rationaleCodes: ["canonical_decision_does_not_permit_numerical_guidance"],
      insufficiencyReasons: unique([
        ...(decisionResult.insufficiencyReasons || []),
        "Canonical decision requirements for numerical buyer guidance were not met."
      ])
    };
  }

  if (normalizedPurpose === "resale") {
    if (
      rangeResult.priceType !== "verified_sold"
      || confidenceResult.pricing?.level !== "high"
    ) {
      return {
        ...result,
        status: "insufficient_evidence",
        basisCode: rangeResult.priceType,
        guidanceCode: "collect_more_pricing_evidence",
        guidanceSummary: "Resale maximum guidance requires a canonical verified-sold range and high pricing confidence. Asking prices alone are not realized resale value.",
        rationaleCodes: ["resale_requires_verified_sold_range_and_high_confidence"],
        insufficiencyReasons: ["Canonical verified-sold support is insufficient for a resale purchase maximum."]
      };
    }
    const amounts = resaleOfferAmounts({
      userEnteredPrice: enteredPrice,
      userEnteredPriceRole,
      rangeResult,
      decisionContext,
      targetIdentity
    });
    if (!amounts) {
      return {
        ...result,
        status: "insufficient_evidence",
        basisCode: "verified_sold_range",
        guidanceCode: "collect_more_pricing_evidence",
        guidanceSummary: "Canonical sold evidence exists, but the existing generic resale cost, condition, uncertainty, and required-profit policy does not leave a positive supported purchase maximum.",
        rationaleCodes: ["generic_resale_guardrail_has_no_positive_maximum"],
        insufficiencyReasons: ["No positive resale purchase maximum remains after the existing generic risk and margin allowances."]
      };
    }
    return {
      ...result,
      ...amounts,
      status: "resale_market_supported",
      basisCode: "verified_sold_range",
      guidanceCode: "resale_verified_sold_guardrail",
      guidanceSummary: "Buyer guardrails use the canonical verified-sold range and the existing generic resale allowances for selling costs, condition, identity uncertainty, liquidity risk, and required profit. Platform-specific fees and guaranteed resale outcomes are not assumed.",
      rationaleCodes: [
        "canonical_verified_sold_range",
        "existing_generic_resale_cost_and_margin_policy"
      ],
      isMarketSupported: true
    };
  }

  const amounts = personalOfferAmounts({
    userEnteredPrice: enteredPrice,
    userEnteredPriceRole,
    rangeResult,
    decisionContext
  });
  const activeAsking = rangeResult.priceType === "active_asking";
  return {
    ...result,
    ...amounts,
    status: activeAsking ? "asking_market_guidance" : "market_supported",
    basisCode: activeAsking ? "active_asking_range" : "verified_sold_range",
    guidanceCode: activeAsking
      ? "active_asking_offer_guardrail"
      : "verified_sold_offer_guardrail",
    guidanceSummary: activeAsking
      ? "Buyer guardrails use at least two independent canonical active asking prices. This is asking-market guidance, not verified market value; condition, availability, shipping, taxes, and checkout cost remain separate."
      : "Buyer guardrails use the canonical verified-sold range and the existing generic personal-use condition and price-position policy. Condition, availability, shipping, taxes, and checkout cost remain separate.",
    rationaleCodes: activeAsking
      ? ["canonical_active_asking_range", "asking_market_not_verified_market_value"]
      : ["canonical_verified_sold_range", "existing_generic_personal_use_offer_policy"],
    isMarketSupported: true,
    contradictions: unique([
      ...result.contradictions,
      ...(badgeResult.code === "above_supported_price"
        ? ["entered_price_above_supported_price"]
        : [])
    ])
  };
}
