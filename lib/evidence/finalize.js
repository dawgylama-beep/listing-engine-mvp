import { matchEvidenceIdentity } from "./identity.js";
import { omitUnsupportedAssociations } from "./provenance.js";
import { normalizePriceType, qualifyEvidence } from "./qualification.js";
import { dedupeUnderlyingOffers, underlyingOfferKey } from "./dedupe.js";

function amount(value) {
  const numeric = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function quantity(value, fallbackText = "") {
  const explicit = Number(value);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const match = String(fallbackText || "").match(/\b(\d{1,5})\s*(?:count|ct\.?|pack|pieces?|pcs?\.?|units?)\b/i);
  const inferred = Number(match?.[1]);
  return Number.isFinite(inferred) && inferred > 0 ? inferred : null;
}

export function normalizeEvidenceRecord(record = {}, target = {}) {
  const base = omitUnsupportedAssociations({
    ...record,
    sourceRecordId: record.sourceRecordId || record.providerRecordId || record.originalUrl || record.url || record.destinationUrl
  });
  const price = amount(base.price ?? base.parsedPrice ?? base.itemPriceAmount ?? base.displayedPrice);
  const canonicalQuantity = quantity(
    base.quantity ?? base.packageQuantity,
    [base.title, base.snippet, base.rawText, base.packageQuantityLabel].filter(Boolean).join(" ")
  );
  const identity = matchEvidenceIdentity(base, target);
  const exactIdentity = Boolean(base.exactIdentity || /^exact/i.test(String(base.identityMatchStrength || base.classification || "")) || identity.exactIdentifier);
  const qualification = qualifyEvidence({ ...base, quantity: canonicalQuantity, exactIdentity }, target);
  const normalizedPriceType = normalizePriceType(base.priceType || base.priceEvidenceType, {
    hasPrice: price !== null,
    reference: /reference|archive/i.test(String([
      base.priceType,
      base.priceEvidenceType,
      base.evidenceRole,
      base.listingStatus
    ].filter(Boolean).join(" ")))
  });
  const priceType = normalizedPriceType;
  const canonicalUrl = base.canonicalUrl || base.destinationUrl || base.originalUrl || base.url || "";
  const canonicalMatchQuality = exactIdentity
    ? "Exact"
    : /strong/i.test(String(base.identityMatchStrength || base.classification || base.matchQuality || ""))
      ? "Strong compatible"
      : "Compatible";
  const identityReference = price === null && (exactIdentity || canonicalMatchQuality === "Strong compatible");
  const nonTransactional = /reference|archive|non-transaction|bulk|category|editorial|social/i.test([
    priceType,
    base.evidenceRole,
    base.pageType,
    base.classification
  ].join(" "));
  const transactional = /^(Verified sold|Completed auction|Active asking price|Buy It Now|Current retail price)$/i.test(priceType);
  const exactAuctionContext = exactIdentity && /^(Current bid|Opening bid|Auction estimate|Closed unsold)$/i.test(priceType);
  const customerEligible = qualification.eligible && (
    transactional
    || identityReference
    || exactAuctionContext
  );
  return {
    ...base,
    evidenceId: underlyingOfferKey({ ...base, destinationUrl: canonicalUrl }),
    underlyingOfferId: underlyingOfferKey({ ...base, destinationUrl: canonicalUrl }),
    canonicalUrl,
    quantity: canonicalQuantity,
    exactIdentity,
    canonicalMatchQuality,
    identity,
    qualification,
    eligible: customerEligible,
    customerEligible,
    identityReference,
    nonTransactional,
    exclusionReason: customerEligible ? "" : qualification.rejectionReason
      || (nonTransactional ? "Non-transactional, category, editorial, social, or generic reference." : "Evidence did not meet customer eligibility."),
    price,
    parsedPrice: price,
    displayedPrice: price === null ? "Price unavailable" : (base.displayedPrice || `$${price.toFixed(2)}`),
    priceType,
    priceEvidenceType: priceType,
    rangeEligible: false,
    decisionEligible: false
  };
}

export function assembleFinalEvidence(records = [], target = {}, options = {}) {
  const normalized = records.map((record) => normalizeEvidenceRecord(record, target));
  const retained = normalized.filter((record) => record.eligible);
  const deduped = dedupeUnderlyingOffers(retained);
  const finalized = deduped.map((record) => {
    const sameDesign = record.qualification.designMatch.match !== false;
    const rangeEligible = record.price !== null && sameDesign && !record.nonTransactional && (
      /^(Verified sold|Completed auction)$/i.test(record.priceType)
      || /^(Active asking price|Buy It Now|Current retail price)$/i.test(record.priceType)
    );
    const decisionEligible = rangeEligible && !/^(Current bid|Opening bid|Auction estimate|Closed unsold)$/i.test(record.priceType);
    return { ...record, rangeEligible, decisionEligible };
  });
  const sortRank = (record) => (record.exactIdentity ? 0 : 10) + (record.price === null ? 3 : 0)
    + (record.priceType === "Verified sold" || record.priceType === "Completed auction" ? 0 : 1);
  finalized.sort((a, b) => sortRank(a) - sortRank(b) || String(a.retailer || a.marketplace || a.source || "").localeCompare(String(b.retailer || b.marketplace || b.source || "")));
  const displayLimit = Number.isFinite(options.displayLimit) ? options.displayLimit : 8;
  const customerEligible = finalized.filter((record) => record.customerEligible);
  const rangeEligible = finalized.filter((record) => record.rangeEligible);
  const decisionEligible = finalized.filter((record) => record.decisionEligible);
  const priceBearing = finalized.filter((record) => record.price !== null);
  const displayed = customerEligible.slice(0, displayLimit);
  const rejected = normalized.filter((record) => !record.eligible);
  return {
    all: finalized,
    customerEligible,
    rangeEligible,
    decisionEligible,
    priceBearing,
    display: displayed,
    rejected,
    counts: {
      finalizedAccepted: finalized.length,
      final: finalized.length,
      customerEligible: customerEligible.length,
      displayed: displayed.length,
      rangeEligible: rangeEligible.length,
      decisionEligible: decisionEligible.length,
      priceBearing: priceBearing.length,
      rejectedDiagnosticOnly: rejected.length,
      exact: finalized.filter((record) => record.exactIdentity).length,
      compatible: finalized.filter((record) => !record.exactIdentity).length,
      priced: finalized.filter((record) => record.price !== null).length,
      exactWithoutPrice: finalized.filter((record) => record.exactIdentity && record.price === null).length,
      sources: new Set(finalized.map((record) => record.retailer || record.marketplace || record.sourceDomain || record.source).filter(Boolean)).size
    },
    finalizedCustomerRecordIds: customerEligible.map((record) => record.evidenceId),
    displayedRecordIds: displayed.map((record) => record.evidenceId)
  };
}
