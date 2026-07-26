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
