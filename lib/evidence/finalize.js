import { matchEvidenceIdentity } from "./identity.js";
import { omitUnsupportedAssociations } from "./provenance.js";
import { normalizePriceType, qualifyEvidence } from "./qualification.js";
import { dedupeUnderlyingOffers, underlyingOfferKey } from "./dedupe.js";

function amount(value) {
  const numeric = typeof value === "number" ? value : Number(String(value || "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function normalizeRecord(record = {}, target = {}) {
  const base = omitUnsupportedAssociations({
    ...record,
    sourceRecordId: record.sourceRecordId || record.providerRecordId || record.originalUrl || record.url || record.destinationUrl
  });
  const price = amount(base.price ?? base.parsedPrice ?? base.itemPriceAmount ?? base.displayedPrice);
  const identity = matchEvidenceIdentity(base, target);
  const exactIdentity = Boolean(base.exactIdentity || /^exact/i.test(String(base.identityMatchStrength || base.classification || "")) || identity.exactIdentifier);
  const qualification = qualifyEvidence({ ...base, exactIdentity }, target);
  const normalizedPriceType = normalizePriceType(base.priceType || base.priceEvidenceType, {
    hasPrice: price !== null,
    reference: /reference|archive/i.test(String(base.evidenceRole || base.listingStatus || ""))
  });
  const priceType = base.prequalified && (base.priceType || base.priceEvidenceType)
    ? (base.priceType || base.priceEvidenceType)
    : normalizedPriceType;
  return {
    ...base,
    evidenceId: underlyingOfferKey(base),
    exactIdentity,
    identity,
    qualification,
    eligible: qualification.eligible
      || base.prequalified === true
      || (exactIdentity && qualification.page.pageType !== "category_or_editorial"),
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
  const normalized = records.map((record) => normalizeRecord(record, target));
  const retained = normalized.filter((record) => record.eligible);
  const deduped = dedupeUnderlyingOffers(retained);
  const finalized = deduped.map((record) => {
    const sameDesign = record.qualification.designMatch.match !== false;
    const rangeEligible = record.price !== null && sameDesign && (
      /^(Verified sold|Completed auction)$/i.test(record.priceType)
      || (record.exactIdentity && /^(Active asking price|Buy It Now|Current retail price)$/i.test(record.priceType))
    );
    const decisionEligible = rangeEligible && !/^(Current bid|Opening bid|Auction estimate|Closed unsold)$/i.test(record.priceType);
    return { ...record, rangeEligible, decisionEligible };
  });
  const sortRank = (record) => (record.exactIdentity ? 0 : 10) + (record.price === null ? 3 : 0)
    + (record.priceType === "Verified sold" || record.priceType === "Completed auction" ? 0 : 1);
  finalized.sort((a, b) => sortRank(a) - sortRank(b) || String(a.retailer || a.marketplace || a.source || "").localeCompare(String(b.retailer || b.marketplace || b.source || "")));
  const displayLimit = Number.isFinite(options.displayLimit) ? options.displayLimit : 8;
  return {
    all: finalized,
    display: finalized.slice(0, displayLimit),
    rejected: normalized.filter((record) => !record.eligible),
    counts: {
      final: finalized.length,
      exact: finalized.filter((record) => record.exactIdentity).length,
      compatible: finalized.filter((record) => !record.exactIdentity).length,
      priced: finalized.filter((record) => record.price !== null).length,
      exactWithoutPrice: finalized.filter((record) => record.exactIdentity && record.price === null).length,
      sources: new Set(finalized.map((record) => record.retailer || record.marketplace || record.sourceDomain || record.source).filter(Boolean)).size
    }
  };
}
