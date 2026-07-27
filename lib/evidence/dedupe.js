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

function normalizedToken(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizedScope(value) {
  return normalizedToken(value).replace(/^www\./, "").replace(/[^a-z0-9.-]+/g, "");
}

function sourceScope(record = {}, urlValue = "") {
  const urlDomain = (() => {
    try { return new URL(urlValue).hostname.replace(/^www\./, ""); } catch { return ""; }
  })();
  const evidenceText = [record.rawText, record.snippet, record.title].filter(Boolean).join(" ");
  const statedOriginDomain = evidenceText.match(
    /\b(?:from|original(?:ly)?\s+(?:at|on)|mirror\s+of(?:\s+marketplace)?(?:\s+item)?(?:\s+id\s+[a-z0-9-]+)?\s+from)\s+([a-z0-9.-]+\.[a-z]{2,})\b/i
  )?.[1] || "";
  const marketplaceDomain = /\.[a-z]{2,}$/i.test(String(record.marketplace || "").trim())
    ? record.marketplace
    : "";
  return normalizedScope(
    record.originalMarketplaceDomain
    || statedOriginDomain
    || marketplaceDomain
    || urlDomain
    || record.marketplace
    || record.sourceDomain
    || record.retailerDomain
    || record.retailerDisplayName
    || record.retailer
    || record.merchant
    || "unknown-source"
  );
}

function sellerScope(record = {}) {
  return normalizedScope(record.seller || record.merchantSeller || record.sellerName || "");
}

export function underlyingOfferKey(record = {}) {
  const text = [record.rawText, record.snippet, record.title].filter(Boolean).join(" ");
  const urlValue = String(
    record.canonicalUrl
    || record.destinationUrl
    || record.url
    || record.sourceUrl
    || record.originalSourceUrl
    || record.originalUrl
    || (/^https?:\/\//i.test(String(record.sourceRecordId || "")) ? record.sourceRecordId : "")
    || ""
  );
  const barcode = String(
    record.gtin
    || record.upc
    || record.barcode
    || text.match(/\b(?:gtin|upc|barcode)\s*[:#]?\s*(\d{12,14})\b/i)?.[1]
    || urlValue.match(/(?:^|[^\d])(\d{12,14})(?:[^\d]|$)/)?.[1]
    || ""
  ).replace(/\D/g, "").replace(/^0(?=\d{12}$)/, "");
  const listingId = String(
    record.marketplaceItemId
    || record.offerId
    || record.listingId
    || record.retailerOfferId
    || record.lotId
    || text.match(/\b(?:marketplace\s+)?item\s+id\s*[:#]?\s*([a-z0-9-]{6,})\b/i)?.[1]
    || urlValue.match(/\/(?:itm|item|lot)\/([a-z0-9-]{6,})(?:[/?#]|$)/i)?.[1]
    || ""
  ).trim().toLowerCase();
  const scope = sourceScope(record, urlValue);
  const seller = sellerScope(record);
  if (listingId) return `offer:${scope}:${seller || "seller-unspecified"}:${listingId}`;
  const directUrl = normalizedUrl(urlValue);
  if (directUrl) return `url:${scope}:${seller || "seller-unspecified"}:${directUrl}`;
  const materialOfferFingerprint = {
    source: scope,
    seller,
    productIdentity: normalizedToken(
      record.productIdentity
      || record.canonicalProductIdentity
      || record.model
      || record.modelNumber
      || record.retailerProductSku
      || record.sku
      || record.title
    ),
    barcode,
    quantity: normalizedToken(record.quantity ?? record.packageQuantity ?? record.unitCount),
    dimensions: normalizedToken(record.dimensions || record.dimensionText || record.packageSize),
    design: normalizedToken(record.designIdentity || record.design || record.variant || record.color || record.finish),
    condition: normalizedToken(record.offerCondition || record.condition),
    price: normalizedToken(record.price ?? record.parsedPrice ?? record.itemPriceAmount),
    currency: normalizedToken(record.currency || record.currencyCode),
    shipping: normalizedToken(record.shipping ?? record.shippingCost ?? record.shippingAmount),
    deliveredCost: normalizedToken(record.deliveredCost ?? record.deliveredPrice ?? record.totalPrice),
    listingState: normalizedToken(record.listingStatus || record.listingState),
    availability: normalizedToken(record.availability),
    imageIdentity: normalizedToken(record.imageUrl || record.imageIdentity)
  };
  return `material:${JSON.stringify(materialOfferFingerprint)}`;
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

function conflictValue(value) {
  if (value === undefined) return "";
  if (value === null) return "null";
  if (typeof value === "object") {
    return JSON.stringify(value, Object.keys(value).sort());
  }
  return normalizedToken(value);
}

function observationProvenance(record = {}) {
  return {
    sourceRecordId: record.sourceRecordId || "",
    provider: record.provider || record.providerKey || record.searchProvider || "",
    query: record.query || "",
    queriesFound: [...new Set([
      ...(Array.isArray(record.queriesFound) ? record.queriesFound : []),
      record.query
    ].filter(Boolean))],
    searchPass: record.searchPass || "",
    searchPassesFound: [...new Set([
      ...(Array.isArray(record.searchPassesFound) ? record.searchPassesFound : []),
      record.searchPass
    ].filter(Boolean))],
    sourceQuality: record.sourceQuality || record.observationQuality || record.evidencePath || record.sourceEvidenceType || "",
    directProductPage: record.directProductPage === true || record.exactRetailPage === true,
    directPageProvenance: record.directPageProvenance || record.directPageSource || record.sourceEvidenceType || ""
  };
}

function mergeOfferObservations(records, key) {
  const ranked = records.slice().sort((left, right) => observationRank(right) - observationRank(left)
    || completeness(right) - completeness(left));
  const merged = { ...ranked[0] };
  const provenance = { ...(merged.fieldProvenance || {}) };
  const mergeableFields = [
    "title",
    "snippet",
    "rawText",
    "sourceEvidenceText",
    "retailer",
    "retailerDisplayName",
    "marketplace",
    "sourceDomain",
    "retailerDomain",
    "seller",
    "originalUrl",
    "destinationUrl",
    "url",
    "canonicalUrl",
    "quantity",
    "packageQuantity",
    "unitCount",
    "dimensions",
    "packageType",
    "designIdentity",
    "design",
    "variant",
    "condition",
    "offerCondition",
    "shipping",
    "shippingCost",
    "deliveredCost",
    "currency",
    "listingStatus",
    "listingState",
    "availability",
    "sourceQuality",
    "directPageProvenance"
  ];
  for (const field of mergeableFields) {
    const supplier = chooseField(ranked, field);
    if (!supplier) continue;
    merged[field] = supplier[field];
    if (supplier.fieldProvenance?.[field]) provenance[field] = supplier.fieldProvenance[field];
  }
  const materialConflictFields = [
    "quantity",
    "packageQuantity",
    "unitCount",
    "dimensions",
    "designIdentity",
    "design",
    "variant",
    "condition",
    "offerCondition",
    "shipping",
    "shippingCost",
    "deliveredCost",
    "currency",
    "listingStatus",
    "listingState",
    "availability"
  ];
  const materialOfferConflicts = {};
  for (const field of materialConflictFields) {
    const populated = ranked.filter((record) => (
      record[field] !== undefined && record[field] !== null && record[field] !== ""
    ));
    const distinct = [...new Set(populated.map((record) => conflictValue(record[field])))];
    if (distinct.length > 1) {
      materialOfferConflicts[field] = populated.map((record) => ({
        sourceRecordId: record.sourceRecordId || "",
        value: record[field],
        sourceQuality: record.sourceQuality || record.observationQuality || record.evidencePath || ""
      }));
    }
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
  merged.observationIds = [...new Set(records.map((record) => record.sourceRecordId).filter(Boolean))].sort();
  merged.observationProvenance = records
    .map(observationProvenance)
    .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  merged.providersFound = [...new Set(merged.observationProvenance.map((item) => item.provider).filter(Boolean))].sort();
  merged.queriesFound = [...new Set(merged.observationProvenance.flatMap((item) => item.queriesFound).filter(Boolean))].sort();
  merged.searchPassesFound = [...new Set(merged.observationProvenance.flatMap((item) => item.searchPassesFound).filter(Boolean))].sort();
  merged.sourceQualitiesFound = [...new Set(merged.observationProvenance.map((item) => item.sourceQuality).filter(Boolean))].sort();
  merged.directPageObservationIds = merged.observationProvenance
    .filter((item) => item.directProductPage)
    .map((item) => item.sourceRecordId)
    .filter(Boolean)
    .sort();
  if (Object.keys(materialOfferConflicts).length) {
    merged.materialOfferConflicts = materialOfferConflicts;
  } else {
    delete merged.materialOfferConflicts;
  }
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
