export const CANONICAL_RANGE_MINIMUM_INDEPENDENT_OFFERS = 2;

export const CANONICAL_RANGE_PRICE_GROUPS = Object.freeze({
  currentRetail: Object.freeze({
    key: "current_retail",
    label: "Current Retail Range",
    priceTypes: Object.freeze(["Current retail price"])
  }),
  activeAsking: Object.freeze({
    key: "active_asking",
    label: "Current Asking-Price Range",
    priceTypes: Object.freeze(["Active asking price", "Buy It Now"])
  }),
  verifiedSold: Object.freeze({
    key: "verified_sold",
    label: "Verified Market Range",
    priceTypes: Object.freeze(["Verified sold", "Completed auction"])
  })
});

function finitePrice(record = {}) {
  const value = Number(record.price);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function finiteQuantity(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function money(value) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
}

function uniqueCanonicalRecords(records = []) {
  const byOffer = new Map();
  for (const record of records) {
    const offerId = record?.underlyingOfferId;
    if (!record?.evidenceId || !offerId || byOffer.has(offerId)) continue;
    byOffer.set(offerId, record);
  }
  return [...byOffer.values()];
}

function recordsForRangeGroup(finalized = {}, group) {
  const allowedPriceTypes = new Set(group.priceTypes);
  return uniqueCanonicalRecords((finalized.rangeEligible || []).filter((record) => (
    record?.rangeEligible === true
    && record?.eligible !== false
    && allowedPriceTypes.has(record.priceType)
    && finitePrice(record) !== null
    && record.priceConflict?.status !== "unresolved"
  )));
}

function buildRangeGroupResult(finalized = {}, group) {
  const records = recordsForRangeGroup(finalized, group);
  const evidenceIds = records.map((record) => record.evidenceId);
  const underlyingOfferIds = records.map((record) => record.underlyingOfferId);
  const prices = records.map(finitePrice);
  const independentOfferCount = underlyingOfferIds.length;
  const established = independentOfferCount >= CANONICAL_RANGE_MINIMUM_INDEPENDENT_OFFERS;
  const singleObservation = independentOfferCount === 1;
  return {
    status: established ? "established" : singleObservation ? "single_observation" : "insufficient",
    priceType: group.key,
    priceTypeLabel: group.label,
    canonicalPriceTypes: [...group.priceTypes],
    observedPriceType: singleObservation ? records[0].priceType : null,
    low: established ? money(Math.min(...prices)) : null,
    high: established ? money(Math.max(...prices)) : null,
    observedPrice: singleObservation ? money(prices[0]) : null,
    observedEvidenceId: singleObservation ? evidenceIds[0] : null,
    observedUnderlyingOfferId: singleObservation ? underlyingOfferIds[0] : null,
    evidenceIds,
    underlyingOfferIds,
    independentOfferCount,
    evidenceCount: evidenceIds.length,
    insufficiencyReason: established
      ? ""
      : singleObservation
        ? "One independent priced offer was observed; at least two are required to establish a numerical range."
        : `No eligible priced ${group.label.toLowerCase()} offers were available.`
  };
}

function emptyPrimaryRangeResult(priceTypeComposition) {
  return {
    status: "insufficient",
    priceType: "none",
    priceTypeLabel: "Market Range",
    canonicalPriceTypes: [],
    observedPriceType: null,
    low: null,
    high: null,
    observedPrice: null,
    observedEvidenceId: null,
    observedUnderlyingOfferId: null,
    evidenceIds: [],
    underlyingOfferIds: [],
    independentOfferCount: 0,
    evidenceCount: 0,
    insufficiencyReason: "No eligible priced independent offers were available for a canonical market range.",
    priceTypeComposition
  };
}

export function deriveCanonicalRangeResults(finalized = {}, { analysisMode = "collectible" } = {}) {
  const currentRetail = buildRangeGroupResult(finalized, CANONICAL_RANGE_PRICE_GROUPS.currentRetail);
  const activeAsking = buildRangeGroupResult(finalized, CANONICAL_RANGE_PRICE_GROUPS.activeAsking);
  const verifiedSold = buildRangeGroupResult(finalized, CANONICAL_RANGE_PRICE_GROUPS.verifiedSold);
  const acceptedOffers = uniqueCanonicalRecords(finalized.all || []);
  const countAcceptedTypes = (priceTypes) => {
    const allowed = new Set(priceTypes);
    return acceptedOffers.filter((record) => allowed.has(record.priceType)).length;
  };
  const knownTypes = new Set([
    ...CANONICAL_RANGE_PRICE_GROUPS.currentRetail.priceTypes,
    ...CANONICAL_RANGE_PRICE_GROUPS.activeAsking.priceTypes,
    ...CANONICAL_RANGE_PRICE_GROUPS.verifiedSold.priceTypes,
    "Current bid",
    "Opening bid",
    "Auction estimate",
    "Closed unsold",
    "Reference/archive",
    "Price unavailable"
  ]);
  const priceTypeComposition = {
    currentRetail: currentRetail.independentOfferCount,
    activeAsking: activeAsking.independentOfferCount,
    verifiedSold: verifiedSold.independentOfferCount,
    auctionBid: countAcceptedTypes(["Current bid", "Opening bid"]),
    auctionReference: countAcceptedTypes(["Auction estimate", "Closed unsold"]),
    archiveReference: countAcceptedTypes(["Reference/archive"]),
    priceUnavailable: countAcceptedTypes(["Price unavailable"]),
    unknown: acceptedOffers.filter((record) => !knownTypes.has(record.priceType)).length
  };
  const selected = analysisMode === "retail"
    ? currentRetail
    : verifiedSold.independentOfferCount
      ? verifiedSold
      : activeAsking.independentOfferCount
        ? activeAsking
        : null;
  const rangeResult = selected
    ? { ...selected, priceTypeComposition }
    : emptyPrimaryRangeResult(priceTypeComposition);
  return {
    rangeResult,
    rangeResults: {
      currentRetail,
      activeAsking,
      verifiedSold
    }
  };
}

export function projectLegacyRange(rangeResult = {}) {
  return {
    status: rangeResult.status || "insufficient",
    eligibleCount: Number(rangeResult.evidenceCount || 0),
    independentOfferCount: Number(rangeResult.independentOfferCount || 0),
    low: Number.isFinite(rangeResult.low) ? rangeResult.low : null,
    high: Number.isFinite(rangeResult.high) ? rangeResult.high : null,
    established: rangeResult.status === "established",
    singleObservation: rangeResult.status === "single_observation"
      ? {
          price: rangeResult.observedPrice,
          priceType: rangeResult.observedPriceType,
          evidenceId: rangeResult.observedEvidenceId,
          underlyingOfferId: rangeResult.observedUnderlyingOfferId
        }
      : null,
    priceTypes: [...(rangeResult.canonicalPriceTypes || [])],
    evidenceIds: [...(rangeResult.evidenceIds || [])],
    underlyingOfferIds: [...(rangeResult.underlyingOfferIds || [])],
    insufficiencyReason: rangeResult.insufficiencyReason || ""
  };
}

export function deriveRange(finalized = {}, options = {}) {
  const { rangeResult } = deriveCanonicalRangeResults(finalized, options);
  return projectLegacyRange(rangeResult);
}

function retailLimitCandidate(record = {}, target = {}) {
  if (
    record?.eligible === false
    || record?.decisionEligible !== true
    || record?.priceType !== "Current retail price"
    || record?.nonTransactional
    || record?.qualification?.page?.eligible !== true
    || record?.qualification?.quantityCompatible === false
    || record?.qualification?.dimensionsCompatible === false
    || record?.priceConflict?.status === "unresolved"
    || !/^(Exact|Strong compatible|Compatible)$/i.test(record?.canonicalMatchQuality || "")
  ) {
    return null;
  }
  const itemAmount = finitePrice(record);
  if (itemAmount === null) return null;
  const deliveredAmount = Number(record.deliveredCostAmount);
  const comparableAmount = Number.isFinite(deliveredAmount) && deliveredAmount > 0 ? deliveredAmount : itemAmount;
  const targetQuantity = finiteQuantity(target.quantity);
  const candidateQuantity = finiteQuantity(record.quantity ?? record.packageQuantity);
  const exactIdentity = record.exactIdentity === true || record.canonicalMatchQuality === "Exact";
  const exactPackage = exactIdentity && (!targetQuantity || !candidateQuantity || targetQuantity === candidateQuantity);
  if (!exactPackage && targetQuantity && !candidateQuantity) return null;
  const normalizedAmount = targetQuantity && candidateQuantity && targetQuantity !== candidateQuantity
    ? comparableAmount / candidateQuantity * targetQuantity
    : comparableAmount;
  const comparisonBasis = exactPackage
    ? "exact_package_price"
    : targetQuantity && candidateQuantity && targetQuantity !== candidateQuantity
      ? "compatible_unit_normalized"
      : "compatible_package_price";
  return {
    record,
    amount: money(normalizedAmount),
    itemAmount: money(itemAmount),
    deliveredAmount: Number.isFinite(deliveredAmount) && deliveredAmount > 0 ? money(deliveredAmount) : null,
    targetQuantity,
    candidateQuantity,
    unitPriceAmount: candidateQuantity ? money(comparableAmount / candidateQuantity) : null,
    comparisonBasis
  };
}

export function deriveRetailLimitResult(finalized = {}, target = {}, { analysisMode = "collectible" } = {}) {
  if (analysisMode !== "retail") {
    return {
      status: "insufficient",
      amount: null,
      priceType: "current_retail",
      evidenceIds: [],
      underlyingOfferIds: [],
      independentOfferCount: 0,
      selectedEvidenceId: null,
      selectedUnderlyingOfferId: null,
      comparisonBasis: "not_applicable",
      quantityContext: { targetQuantity: finiteQuantity(target.quantity), selectedOfferQuantity: null, normalizedToTargetQuantity: null },
      unitPriceContext: { status: "unavailable", amount: null, unitLabel: "unit" },
      insufficiencyReason: "A retail price limit is available only in retail analysis mode."
    };
  }
  const candidates = uniqueCanonicalRecords(finalized.decisionEligible || [])
    .map((record) => retailLimitCandidate(record, target))
    .filter(Boolean)
    .sort((left, right) => left.amount - right.amount || left.record.evidenceId.localeCompare(right.record.evidenceId));
  if (!candidates.length) {
    return {
      status: "insufficient",
      amount: null,
      priceType: "current_retail",
      evidenceIds: [],
      underlyingOfferIds: [],
      independentOfferCount: 0,
      selectedEvidenceId: null,
      selectedUnderlyingOfferId: null,
      comparisonBasis: "not_established",
      quantityContext: { targetQuantity: finiteQuantity(target.quantity), selectedOfferQuantity: null, normalizedToTargetQuantity: null },
      unitPriceContext: { status: "unavailable", amount: null, unitLabel: "unit" },
      insufficiencyReason: "No accepted, decision-eligible, independent current-retail offer had a usable canonical price and truthful package comparison."
    };
  }
  const selected = candidates[0];
  return {
    status: "established",
    amount: selected.amount,
    priceType: "current_retail",
    evidenceIds: candidates.map((candidate) => candidate.record.evidenceId),
    underlyingOfferIds: candidates.map((candidate) => candidate.record.underlyingOfferId),
    independentOfferCount: candidates.length,
    selectedEvidenceId: selected.record.evidenceId,
    selectedUnderlyingOfferId: selected.record.underlyingOfferId,
    comparisonBasis: selected.comparisonBasis,
    quantityContext: {
      targetQuantity: selected.targetQuantity,
      selectedOfferQuantity: selected.candidateQuantity,
      normalizedToTargetQuantity: selected.comparisonBasis === "compatible_unit_normalized" ? selected.targetQuantity : null,
      supportQuantities: candidates.map((candidate) => ({
        evidenceId: candidate.record.evidenceId,
        quantity: candidate.candidateQuantity
      }))
    },
    unitPriceContext: {
      status: selected.unitPriceAmount !== null ? "established" : "unavailable",
      amount: selected.unitPriceAmount,
      unitLabel: "unit",
      deliveredCostUsed: selected.deliveredAmount !== null
    },
    insufficiencyReason: ""
  };
}
