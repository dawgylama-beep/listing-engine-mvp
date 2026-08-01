const MATCH_CODES = Object.freeze({
  Exact: "exact",
  "Strong compatible": "strong_compatible",
  Compatible: "compatible"
});

const PRICE_TYPE_CODES = Object.freeze({
  "Current retail price": "current_retail",
  "Active asking price": "active_asking",
  "Buy It Now": "buy_it_now",
  "Verified sold": "verified_sold",
  "Completed auction": "completed_auction",
  "Current bid": "current_bid",
  "Opening bid": "opening_bid",
  "Auction estimate": "auction_estimate",
  "Closed unsold": "closed_unsold",
  "Reference/archive": "reference",
  "Price unavailable": "price_unavailable"
});

function text(value) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function finiteAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

function positiveNumber(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function uniqueStrings(values = []) {
  return [...new Set(values.map(text).filter(Boolean))];
}

function countBy(records = [], selectKey) {
  const counts = {};
  for (const record of records) {
    const key = text(selectKey(record)) || "Not identified";
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

const PERSONAL_BUY_PURPOSES = new Set([
  "personal",
  "personal buy",
  "personal_buy",
  "personal use",
  "personal_use",
  "buy for myself",
  "buying for myself"
]);

function normalizedPolicyText(value) {
  return text(value).toLowerCase().replace(/[-\s]+/g, "_");
}

function structuredPolicyText(record = {}, fields = []) {
  return fields.map((field) => normalizedPolicyText(record[field])).filter(Boolean).join(" ");
}

export function isPersonalBuyEvidencePurpose(purpose) {
  return PERSONAL_BUY_PURPOSES.has(text(purpose).toLowerCase());
}

export function classifyCustomerEvidenceSourceChannel(record = {}) {
  const explicitChannel = structuredPolicyText(record, [
    "canonicalSourceChannel",
    "sourceChannel",
    "sourceFamily",
    "purchaseSourceChannel",
    "sourceClassification",
    "channelType"
  ]);
  if (/\b(?:conventional_retail|retail|retailer|direct_retail|manufacturer_direct|store)\b/.test(explicitChannel)) {
    return "conventional_retail";
  }
  if (/\bauction\b/.test(explicitChannel)) return "auction";
  if (/\b(?:marketplace|secondary_market|specialty_dealer)\b/.test(explicitChannel)) return "marketplace";
  if (/\b(?:aggregator|archive|reference|knowledge_graph)\b/.test(explicitChannel)) return "aggregator";
  if (/\b(?:unknown|unclassified|other)\b/.test(explicitChannel)) return "unknown";

  if (
    text(record.retailEvidenceTier)
    || record.transactionalRetailerEvidence === true
    || record.retailPriceDecisionEligibility === true
    || normalizedPolicyText(record.priceType) === "current_retail_price"
  ) {
    return "conventional_retail";
  }

  const priceType = normalizedPolicyText(record.priceType);
  if (/^(?:current_bid|opening_bid|auction_estimate|completed_auction|closed_unsold)$/.test(priceType)) {
    return "auction";
  }
  if (/^(?:active_asking_price|buy_it_now|verified_sold)$/.test(priceType)) {
    return "marketplace";
  }
  if (
    priceType === "reference/archive"
    || /\b(?:aggregator|archive|reference|knowledge_graph)\b/.test(structuredPolicyText(record, ["sourceType", "sourceEvidenceType"]))
  ) {
    return "aggregator";
  }
  if (text(record.marketplace) && !text(record.retailer)) return "marketplace";
  if (text(record.retailer) && !text(record.marketplace)) return "conventional_retail";
  return "unknown";
}

function exactPackageContext(record = {}, targetIdentity = {}) {
  const targetQuantity = positiveNumber(targetIdentity.quantity);
  const recordQuantity = positiveNumber(record.quantity);
  const targetPackageType = normalizedPolicyText(targetIdentity.packageType);
  const recordPackageType = normalizedPolicyText(record.packageType);
  const quantityExact = targetQuantity === null
    ? true
    : recordQuantity !== null && recordQuantity === targetQuantity;
  const packageTypeExact = !targetPackageType
    ? true
    : Boolean(recordPackageType) && recordPackageType === targetPackageType;
  return {
    exact: quantityExact && packageTypeExact,
    variation: (targetQuantity !== null && recordQuantity !== null && recordQuantity !== targetQuantity)
      || Boolean(targetPackageType && recordPackageType && recordPackageType !== targetPackageType)
  };
}

function hasUsableItemPrice(record = {}) {
  return finiteAmount(record.price) !== null;
}

function hasActiveOfferPriceType(record = {}) {
  return /^(?:Active asking price|Buy It Now|Current retail price)$/i.test(text(record.priceType));
}

function isExplicitlyInactive(record = {}) {
  const status = structuredPolicyText(record, ["availabilityStatus", "availability", "listingStatus", "listingState"]);
  return /(?:^| )(?:unavailable|out_of_stock|closed|ended|expired|removed|not_available)(?:_| |$)/.test(status);
}

function hasSupportedAvailability(record = {}) {
  const status = structuredPolicyText(record, ["availabilityStatus", "availability", "listingStatus", "listingState"]);
  return /(?:^| )(?:active|available|in_stock|for_sale|orderable|pickup_available|listed)(?:_| |$)/.test(status)
    && !isExplicitlyInactive(record);
}

function hasSpecialMarketplaceContext(record = {}, targetIdentity = {}, analysisMode = "", decisionContext = {}) {
  if (analysisMode === "collectible") return true;
  if ([
    record.marketplaceNative,
    record.isMarketplaceNative,
    record.discontinued,
    record.isDiscontinued,
    record.rare,
    record.isRare,
    record.collectible,
    record.isCollectible,
    record.used,
    record.isUsed
  ].some((value) => value === true)) {
    return true;
  }
  const category = [
    structuredPolicyText(record, ["canonicalCategory", "category", "itemCategory", "productCategory"]),
    structuredPolicyText(targetIdentity, ["canonicalCategory", "category", "itemCategory", "productCategory"])
  ].filter(Boolean).join(" ");
  if (/\b(?:collectible|vintage|rare|discontinued|secondary_market|marketplace_native|auction)\b/.test(category)) {
    return true;
  }
  const condition = [
    structuredPolicyText(record, ["condition", "offerCondition", "itemCondition", "conditionGrade", "retailOfferConditionDisclosure"]),
    structuredPolicyText(decisionContext, ["condition"])
  ].filter(Boolean).join(" ");
  return /\b(?:used|preowned|pre_owned|secondhand|second_hand|vintage|antique|refurbished)\b/.test(condition);
}

function itemPriceAdvantage(record = {}, conventionalExactPrices = []) {
  const price = finiteAmount(record.price);
  return price !== null
    && conventionalExactPrices.length > 0
    && price < Math.min(...conventionalExactPrices);
}

function utilityDecision(record, context) {
  const sourceChannel = classifyCustomerEvidenceSourceChannel(record);
  const packageContext = exactPackageContext(record, context.targetIdentity);
  const exactRequestedOffer = record.exactIdentity === true && packageContext.exact;
  const priced = hasUsableItemPrice(record);
  const activeOffer = hasActiveOfferPriceType(record) && !isExplicitlyInactive(record);
  const specialMarketplaceContext = hasSpecialMarketplaceContext(
    record,
    context.targetIdentity,
    context.analysisMode,
    context.decisionContext
  );
  const priceAdvantage = itemPriceAdvantage(record, context.conventionalExactPrices);

  if (sourceChannel === "conventional_retail") {
    if (exactRequestedOffer && priced && !isExplicitlyInactive(record)) {
      return { bucket: 1, sourceChannel, policyReasonCode: "personal_buy_exact_priced_conventional_retail" };
    }
    if (exactRequestedOffer && !priced) {
      return { bucket: 2, sourceChannel, policyReasonCode: "personal_buy_exact_unpriced_conventional_retail" };
    }
    if ((priced && !isExplicitlyInactive(record)) || (!context.hasExactConventionalRetail && hasSupportedAvailability(record))) {
      return { bucket: 3, sourceChannel, policyReasonCode: "personal_buy_conventional_retail_alternative" };
    }
    return {
      bucket: 5,
      sourceChannel,
      policyReasonCode: packageContext.variation && context.hasExactConventionalRetail
        ? "personal_buy_package_variation_secondary_to_exact"
        : "personal_buy_conventional_retail_no_buying_utility"
    };
  }

  if (sourceChannel === "marketplace" || sourceChannel === "auction") {
    if (exactRequestedOffer && priced && activeOffer) {
      return { bucket: 4, sourceChannel, policyReasonCode: "personal_buy_useful_marketplace_offer" };
    }
    if (priced && (specialMarketplaceContext || priceAdvantage)) {
      return { bucket: 4, sourceChannel, policyReasonCode: context.hasUsefulConventionalRetail
        ? "personal_buy_useful_marketplace_offer"
        : "personal_buy_marketplace_fallback" };
    }
    if (
      !priced
      && exactRequestedOffer
      && specialMarketplaceContext
      && (context.analysisMode === "collectible" || hasSupportedAvailability(record))
    ) {
      return { bucket: 4, sourceChannel, policyReasonCode: "personal_buy_marketplace_fallback" };
    }
    return {
      bucket: 5,
      sourceChannel,
      policyReasonCode: packageContext.variation && context.hasExactConventionalRetail
        ? "personal_buy_package_variation_secondary_to_exact"
        : !priced
          ? "personal_buy_marketplace_no_usable_price"
          : "personal_buy_marketplace_no_buying_advantage"
    };
  }

  if (priced && exactRequestedOffer && activeOffer) {
    return { bucket: 4, sourceChannel, policyReasonCode: "personal_buy_unknown_source_buying_utility" };
  }
  if (
    !priced
    && exactRequestedOffer
    && context.analysisMode === "collectible"
    && text(record.marketplace)
  ) {
    return { bucket: 4, sourceChannel, policyReasonCode: "personal_buy_marketplace_fallback" };
  }
  return {
    bucket: 5,
    sourceChannel,
    policyReasonCode: "personal_buy_unknown_source_no_buying_utility"
  };
}

export function selectCustomerEvidenceForDisplay(records = [], {
  purpose = "personal",
  analysisMode = "collectible",
  targetIdentity = {},
  decisionContext = {},
  displayLimit = 8
} = {}) {
  const limit = Number.isFinite(displayLimit) ? Math.max(0, Math.floor(displayLimit)) : 8;
  if (!isPersonalBuyEvidencePurpose(purpose)) {
    return {
      policyApplied: false,
      displayEligible: [...records],
      display: records.slice(0, limit),
      decisions: []
    };
  }

  const sourceContexts = records.map((record) => ({
    record,
    sourceChannel: classifyCustomerEvidenceSourceChannel(record),
    packageContext: exactPackageContext(record, targetIdentity)
  }));
  const conventionalExactPrices = sourceContexts
    .filter(({ record, sourceChannel, packageContext }) => (
      sourceChannel === "conventional_retail"
      && record.exactIdentity === true
      && packageContext.exact
      && hasUsableItemPrice(record)
    ))
    .map(({ record }) => finiteAmount(record.price));
  const context = {
    analysisMode,
    targetIdentity,
    decisionContext,
    conventionalExactPrices,
    hasExactConventionalRetail: sourceContexts.some(({ record, sourceChannel, packageContext }) => (
      sourceChannel === "conventional_retail" && record.exactIdentity === true && packageContext.exact
    )),
    hasUsefulConventionalRetail: sourceContexts.some(({ record, sourceChannel, packageContext }) => (
      sourceChannel === "conventional_retail"
      && ((record.exactIdentity === true && packageContext.exact) || hasUsableItemPrice(record))
    ))
  };
  const classified = records.map((record, canonicalIndex) => ({
    record,
    canonicalIndex,
    ...utilityDecision(record, context)
  }));
  const displayEligibleDecisions = [1, 2, 3, 4]
    .flatMap((bucket) => classified.filter((decision) => decision.bucket === bucket));
  const displayedDecisions = displayEligibleDecisions.slice(0, limit);
  const displayedIds = new Set(displayedDecisions.map(({ record }) => record.evidenceId));

  return {
    policyApplied: true,
    displayEligible: displayEligibleDecisions.map(({ record }) => record),
    display: displayedDecisions.map(({ record }) => record),
    decisions: classified.map(({ record, canonicalIndex, bucket, sourceChannel, policyReasonCode }) => {
      const customerVisible = displayedIds.has(record.evidenceId);
      const displayEligible = bucket < 5;
      return {
        evidenceId: record.evidenceId,
        underlyingOfferId: record.underlyingOfferId,
        canonicalIndex,
        sourceChannel,
        utilityBucket: bucket,
        policyReasonCode,
        disposition: customerVisible ? "customer_visible" : "technical_details_only",
        dispositionReasonCode: customerVisible
          ? policyReasonCode
          : displayEligible
            ? "personal_buy_card_capacity_exhausted"
            : policyReasonCode
      };
    })
  };
}

function sourceIdentity(record = {}) {
  return text(record.retailer || record.marketplace || record.source || record.sourceDomain)
    || "Source not identified";
}

function quantityLabel(quantity, record = {}) {
  if (Number.isFinite(quantity)) {
    return `${quantity} count`;
  }
  return text(record.packageQuantityLabel);
}

function importantAttributes(record = {}) {
  return uniqueStrings([
    record.dimensions,
    record.packageType,
    record.designIdentity
  ]);
}

function safeProvenanceEntry(entry = null) {
  if (!entry || typeof entry !== "object" || !text(entry.sourceRecordId)) {
    return null;
  }
  return {
    sourceRecordId: text(entry.sourceRecordId),
    sourceUrl: text(entry.sourceUrl),
    acquisitionProvider: text(entry.acquisitionProvider),
    evidencePath: text(entry.evidencePath)
  };
}

function provenanceFor(record = {}, ...fields) {
  for (const field of fields) {
    const entry = safeProvenanceEntry(record.fieldProvenance?.[field]);
    if (entry) return entry;
  }
  return null;
}

function provenanceSummary(record = {}) {
  return {
    title: provenanceFor(record, "title"),
    retailer: provenanceFor(record, "retailer", "marketplace", "sourceDomain"),
    url: provenanceFor(record, "destinationUrl", "originalUrl"),
    price: provenanceFor(record, "price"),
    quantity: provenanceFor(record, "quantity")
  };
}

function legacyDetails(record = {}) {
  const allowed = [
    "retailerDomain",
    "listingStatus",
    "sourceEvidenceType",
    "sourceQuality",
    "exactPageRecoveryStatus",
    "exactPageRecoveryMode",
    "exactPageMatchedBarcodeIdentities",
    "retailOfferPlatform",
    "retailOfferSeller",
    "retailOfferSellerType",
    "retailOfferConditionDisclosure",
    "retailEvidenceTier",
    "retailEvidenceTierLabel",
    "targetProductFamily",
    "candidateProductFamily",
    "positiveCompatibilityEvidence",
    "contradictoryEvidence",
    "conciseLimitation",
    "knownDifferences",
    "retailerConfidenceLevel",
    "confidenceDowngradeReasons",
    "retailerAttributionEvidence",
    "namedStoreMatchStatus",
    "purchaseChannel",
    "onlineLocalStatus",
    "nearbyAddress",
    "storeAddress",
    "locationAddress",
    "retailerAddress",
    "pickupAddress",
    "qualification",
    "exactIdentity",
    "identityReference",
    "priceConflict"
  ];
  return Object.fromEntries(
    allowed
      .filter((field) => record[field] !== undefined)
      .map((field) => [field, record[field]])
  );
}

function canonicalCardBadge(record = {}, badgeResult = {}) {
  if (
    badgeResult.eligibility !== "eligible"
    || !Array.isArray(badgeResult.supportingEvidenceIds)
    || !badgeResult.supportingEvidenceIds.includes(record.evidenceId)
  ) {
    return null;
  }
  const code = text(badgeResult.code);
  const label = text(badgeResult.label);
  return code && label ? { code, label } : null;
}

export function serializeCustomerEvidenceRecord(
  record = {},
  { views = {}, badgeResult = {}, askingPrice = null } = {}
) {
  const evidenceId = text(record.evidenceId);
  const canonicalUrl = text(record.canonicalUrl);
  const source = sourceIdentity(record);
  const canonicalPrice = finiteAmount(record.price);
  const canonicalPriceType = text(record.priceType) || "Price unavailable";
  const canonicalMatchLabel = text(record.canonicalMatchQuality) || "Compatible";
  const quantity = positiveNumber(record.quantity);
  const deliveredCostAmount = finiteAmount(record.deliveredCostAmount);
  const unitPriceAmount = canonicalPrice !== null && quantity !== null
    ? canonicalPrice / quantity
    : null;
  const customerPriceLabel = canonicalPrice === null
    ? "Price unavailable"
    : `$${canonicalPrice.toFixed(2)}`;
  const cardBadge = canonicalCardBadge(record, badgeResult);
  const comparisonPrice = finiteAmount(askingPrice);
  const comparisonToYourPrice = text(record.comparisonToYourPrice)
    || (comparisonPrice !== null && canonicalPrice !== null
      ? canonicalPrice < comparisonPrice
        ? "Lower than your entered price."
        : canonicalPrice > comparisonPrice
          ? "Higher than your entered price."
          : "Matches your entered price."
      : "");
  const sourceObservationIds = uniqueStrings([
    ...(Array.isArray(record.observationIds) ? record.observationIds : []),
    record.sourceRecordId
  ]);

  return {
    evidenceId,
    underlyingOfferId: text(record.underlyingOfferId),
    canonicalUrl,
    destinationUrl: canonicalUrl,
    url: canonicalUrl,
    source,
    retailer: source,
    retailerDisplayName: source,
    sourceLabel: source,
    title: text(record.title) || "Source result",
    canonicalMatchCode: MATCH_CODES[canonicalMatchLabel] || "compatible",
    canonicalMatchLabel,
    canonicalMatchQuality: canonicalMatchLabel,
    matchQuality: canonicalMatchLabel,
    classification: canonicalMatchLabel,
    priceContextLabel: canonicalMatchLabel,
    canonicalPrice,
    price: canonicalPrice,
    itemPriceAmount: canonicalPrice,
    parsedPrice: canonicalPrice,
    canonicalPriceType,
    priceType: canonicalPriceType,
    priceTypeCode: PRICE_TYPE_CODES[canonicalPriceType] || "other",
    priceTypeLabel: canonicalPriceType,
    customerPriceLabel,
    displayedPrice: customerPriceLabel,
    itemPrice: customerPriceLabel,
    quantity,
    packageQuantity: quantity,
    quantityLabel: quantityLabel(quantity, record),
    packageQuantityLabel: quantityLabel(quantity, record),
    attributes: {
      dimensions: text(record.dimensions),
      packageType: text(record.packageType),
      designIdentity: text(record.designIdentity)
    },
    importantAttributes: importantAttributes(record),
    shippingStatus: text(record.shippingStatus) || "unknown",
    shippingLabel: text(record.shipping || record.shippingDisclosure) || "Not shown",
    shipping: text(record.shipping) || "Not shown",
    shippingAmount: finiteAmount(record.shippingAmount),
    shippingDisclosure: text(record.shippingDisclosure),
    deliveredCostAmount,
    deliveredCostStatus: deliveredCostAmount === null ? "not_established" : "known",
    deliveredCostLabel: deliveredCostAmount === null
      ? "Not established"
      : `$${deliveredCostAmount.toFixed(2)}`,
    deliveredCost: deliveredCostAmount === null
      ? "Not established"
      : `$${deliveredCostAmount.toFixed(2)}`,
    availabilityStatus: text(record.availabilityStatus || record.availability || record.listingStatus)
      || "Not confirmed",
    customerEligible: (views.customerEligibleIds || []).includes(evidenceId),
    displayEligible: (views.displayEligibleIds || []).includes(evidenceId),
    rangeEligible: (views.rangeEligibleIds || []).includes(evidenceId),
    decisionEligible: (views.decisionEligibleIds || []).includes(evidenceId),
    cardBadgeCode: cardBadge?.code || null,
    cardBadgeLabel: cardBadge?.label || null,
    cardBadge,
    sourceObservationIds,
    provenance: provenanceSummary(record),
    unitPriceAmount,
    unitPrice: Number.isFinite(unitPriceAmount)
      ? `$${unitPriceAmount.toFixed(unitPriceAmount < 0.1 ? 3 : 2)} each`
      : "",
    comparisonToYourPrice,
    includedInPreliminaryAskingPriceRange: record.rangeEligible === true
      && /^(Active asking price|Buy It Now)$/i.test(canonicalPriceType)
      ? "Yes - canonical active-asking support."
      : "No",
    influencedVerifiedMarketRange: record.rangeEligible === true
      && /^(Verified sold|Completed auction)$/i.test(canonicalPriceType)
      ? "Yes - canonical verified-sold support."
      : "No",
    ...legacyDetails(record)
  };
}

export function buildCustomerEvidenceSummary(
  { views = {}, records = [], customerEvidence = [] } = {}
) {
  const copyIds = (name) => [...(Array.isArray(views[name]) ? views[name] : [])];
  const summary = {
    acceptedIds: copyIds("acceptedIds"),
    customerEligibleIds: copyIds("customerEligibleIds"),
    displayEligibleIds: copyIds("displayEligibleIds"),
    displayedIds: copyIds("displayedIds"),
    rangeEligibleIds: copyIds("rangeEligibleIds"),
    decisionEligibleIds: copyIds("decisionEligibleIds"),
    priceBearingIds: copyIds("priceBearingIds"),
    exactMatchIds: copyIds("exactMatchIds"),
    rejectedIds: copyIds("rejectedDiagnosticOnlyIds")
  };
  summary.counts = {
    accepted: summary.acceptedIds.length,
    customerEligible: summary.customerEligibleIds.length,
    displayEligible: summary.displayEligibleIds.length,
    displayed: summary.displayedIds.length,
    rangeEligible: summary.rangeEligibleIds.length,
    decisionEligible: summary.decisionEligibleIds.length,
    priceBearing: summary.priceBearingIds.length,
    exactMatch: summary.exactMatchIds.length,
    rejected: summary.rejectedIds.length,
    finalizedRecords: records.length
  };
  summary.displayedCountByRetailer = countBy(customerEvidence, (record) => record.sourceLabel);
  summary.displayedCountByPriceType = countBy(customerEvidence, (record) => record.canonicalPriceType);
  summary.displayedCountByMatchClass = countBy(customerEvidence, (record) => record.canonicalMatchLabel);
  return summary;
}

export function serializeCanonicalCustomerEvidence(
  { records = [], views = {}, badgeResult = {} } = {},
  { askingPrice = null } = {}
) {
  const recordById = new Map(records.map((record) => [record.evidenceId, record]));
  const customerEvidence = (views.displayedIds || []).map((evidenceId) => (
    serializeCustomerEvidenceRecord(recordById.get(evidenceId), {
      views,
      badgeResult,
      askingPrice
    })
  ));
  return {
    customerEvidence,
    customerEvidenceSummary: buildCustomerEvidenceSummary({
      views,
      records,
      customerEvidence
    })
  };
}
