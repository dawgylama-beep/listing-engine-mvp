function normalizedUrl(value) {
  try {
    const url = new URL(String(value || ""));
    ["utm_source", "utm_medium", "utm_campaign", "gclid"].forEach((key) => url.searchParams.delete(key));
    url.hash = "";
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return "";
  }
}

export function underlyingOfferKey(record = {}) {
  const text = [record.rawText, record.snippet, record.title].filter(Boolean).join(" ");
  const urlValue = String(record.originalUrl || record.destinationUrl || record.url || "");
  const retailPriceType = String(record.priceType || record.priceEvidenceType || "");
  const barcode = String(
    record.gtin
    || record.upc
    || record.barcode
    || text.match(/\b(?:gtin|upc|barcode)\s*[:#]?\s*(\d{12,14})\b/i)?.[1]
    || urlValue.match(/(?:^|[^\d])(\d{12,14})(?:[^\d]|$)/)?.[1]
    || ""
  ).replace(/\D/g, "").replace(/^0(?=\d{12}$)/, "");
  const retailerName = String(
    record.retailerDisplayName
    || record.retailer
    || record.merchant
    || ""
  ).replace(/\s+via\s+.+$/i, "").trim().toLowerCase();
  const marketplaceId = String(
    record.marketplaceItemId
    || record.offerId
    || record.lotId
    || text.match(/\b(?:marketplace\s+)?item\s+id\s*[:#]?\s*([a-z0-9-]{6,})\b/i)?.[1]
    || urlValue.match(/\/(?:itm|item|lot)\/([a-z0-9-]{6,})(?:[/?#]|$)/i)?.[1]
    || ""
  ).trim().toLowerCase();
  const originDomain = String(
    record.originalMarketplaceDomain
    || text.match(/\b(?:from|original(?:ly)?\s+(?:at|on))\s+([a-z0-9.-]+\.[a-z]{2,})\b/i)?.[1]
    || (() => {
      try { return new URL(urlValue).hostname.replace(/^www\./, ""); } catch { return ""; }
    })()
    || record.marketplace
    || record.sourceDomain
    || ""
  ).toLowerCase();
  if (marketplaceId) return `offer:${originDomain}:${marketplaceId}`;
  if (/^current retail price$/i.test(retailPriceType) && barcode && retailerName) {
    return `retail:${retailerName}:${barcode}`;
  }
  const original = normalizedUrl(record.originalUrl);
  if (original) return `url:${original}`;
  const destination = normalizedUrl(record.destinationUrl || record.url);
  if (destination) return `url:${destination}`;
  return [
    record.marketplace || record.retailer || record.sourceDomain,
    record.seller,
    record.title,
    record.price,
    record.imageUrl
  ].map((value) => String(value || "").trim().toLowerCase()).join("|");
}

function completeness(record = {}) {
  return ["title", "destinationUrl", "retailer", "marketplace", "price", "priceType", "listingStatus", "quantity"]
    .reduce((score, key) => score + (record[key] !== undefined && record[key] !== "" ? 1 : 0), 0);
}

function sourceQualityRank(record = {}) {
  if (record.exactRetailPage === true || record.directProductPage === true) return 40;
  const quality = String(
    record.sourceQuality
    || record.observationQuality
    || record.evidencePath
    || record.sourceEvidenceType
    || ""
  ).toLowerCase();
  if (/direct[_ -]?(?:current[_ -]?)?(?:product|listing)[_ -]?page|page[_ -]?verified/.test(quality)) return 40;
  if (/structured[_ -]?(?:retailer|marketplace)|retailer[_ -]?api/.test(quality)) return 30;
  if (/provider[_ -]?organic|organic[_ -]?result/.test(quality)) return 20;
  if (/search[_ -]?snippet|snippet/.test(quality)) return 10;
  if (record.exactIdentity === true) return 35;
  return 0;
}

function timestampRank(record = {}) {
  const value = Date.parse(record.observedAt || record.evidenceTimestamp || record.fetchedAt || "");
  return Number.isFinite(value) ? value : 0;
}

function observationRank(record = {}) {
  return sourceQualityRank(record) * 1e15 + timestampRank(record);
}

function validPrice(record = {}) {
  const value = Number(record.price ?? record.parsedPrice ?? record.itemPriceAmount);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function chooseField(records, field) {
  return records
    .filter((record) => record[field] !== undefined && record[field] !== null && record[field] !== "")
    .sort((left, right) => observationRank(right) - observationRank(left)
      || completeness(right) - completeness(left))[0];
}

function mergeOfferObservations(records, key) {
  const ranked = records.slice().sort((left, right) => observationRank(right) - observationRank(left)
    || completeness(right) - completeness(left));
  const merged = { ...ranked[0] };
  const provenance = { ...(merged.fieldProvenance || {}) };
  for (const field of ["title", "retailer", "marketplace", "sourceDomain", "originalUrl", "destinationUrl", "quantity", "dimensions", "packageType", "designIdentity"]) {
    const supplier = chooseField(ranked, field);
    if (!supplier) continue;
    merged[field] = supplier[field];
    if (supplier.fieldProvenance?.[field]) provenance[field] = supplier.fieldProvenance[field];
  }

  const priced = ranked.filter((record) => validPrice(record) !== null);
  const distinctPrices = [...new Set(priced.map(validPrice))];
  if (distinctPrices.length === 1) {
    const supplier = priced[0];
    merged.price = validPrice(supplier);
    merged.parsedPrice = merged.price;
    merged.priceType = supplier.priceType || supplier.priceEvidenceType;
    merged.priceEvidenceType = merged.priceType;
    if (supplier.fieldProvenance?.price) provenance.price = supplier.fieldProvenance.price;
  } else if (distinctPrices.length > 1) {
    const bestRank = observationRank(priced[0]);
    const best = priced.filter((record) => observationRank(record) === bestRank);
    if (best.length === 1 && sourceQualityRank(best[0]) > sourceQualityRank(priced[1])) {
      const supplier = best[0];
      merged.price = validPrice(supplier);
      merged.parsedPrice = merged.price;
      merged.priceType = supplier.priceType || supplier.priceEvidenceType;
      merged.priceEvidenceType = merged.priceType;
      if (supplier.fieldProvenance?.price) provenance.price = supplier.fieldProvenance.price;
      merged.priceConflict = {
        status: "resolved",
        selectedSourceRecordId: supplier.sourceRecordId,
        observations: priced.map((record) => ({
          sourceRecordId: record.sourceRecordId,
          price: validPrice(record),
          sourceQuality: record.sourceQuality || record.observationQuality || record.evidencePath || ""
        }))
      };
    } else {
      merged.price = null;
      merged.parsedPrice = null;
      merged.displayedPrice = "Price unavailable";
      merged.priceType = "Price unavailable";
      merged.priceEvidenceType = "Price unavailable";
      delete provenance.price;
      merged.priceConflict = {
        status: "unresolved",
        reason: "Conflicting same-offer prices had no uniquely higher-quality observation.",
        observations: priced.map((record) => ({
          sourceRecordId: record.sourceRecordId,
          price: validPrice(record),
          sourceQuality: record.sourceQuality || record.observationQuality || record.evidencePath || ""
        }))
      };
    }
  }
  merged.fieldProvenance = provenance;
  merged.underlyingOfferId = key;
  merged.observationIds = records.map((record) => record.sourceRecordId).filter(Boolean);
  return merged;
}

export function dedupeUnderlyingOffers(records = []) {
  const grouped = new Map();
  for (const record of records) {
    const key = underlyingOfferKey(record);
    if (!key) continue;
    const group = grouped.get(key) || [];
    group.push(record);
    grouped.set(key, group);
  }
  return [...grouped.entries()].map(([key, observations]) => mergeOfferObservations(observations, key));
}
