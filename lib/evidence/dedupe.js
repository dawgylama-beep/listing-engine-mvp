const TRACKING_QUERY_PARAMETERS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "gclid",
  "dclid",
  "fbclid",
  "msclkid",
  "mc_cid",
  "mc_eid"
]);

const DIRECT_LISTING_URL_FIELDS = [
  "canonicalUrl",
  "destinationUrl",
  "url",
  "sourceUrl"
];

const ORIGINAL_LISTING_URL_FIELDS = [
  "originalSourceUrl",
  "originalUrl"
];

const SELLER_FIELDS = [
  "seller",
  "merchantSeller",
  "sellerName",
  "actualSeller",
  "sourceSeller",
  "merchantName",
  "offerSeller",
  "soldBy",
  "retailOfferSeller",
  "actualMerchant",
  "offerMerchant",
  "sourceMerchant",
  "storeName"
];

const LISTING_IDENTIFIER_FIELDS = [
  "marketplaceItemId",
  "offerId",
  "listingId",
  "retailerOfferId",
  "lotId",
  "auctionLotId",
  "itemId"
];

const LISTING_IDENTIFIER_TYPES = Object.freeze({
  marketplaceItemId: "marketplace-item",
  offerId: "offer",
  listingId: "listing",
  retailerOfferId: "retailer-offer",
  lotId: "auction-lot",
  auctionLotId: "auction-lot",
  itemId: "item"
});

function isPopulated(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.some(isPopulated);
  return true;
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])])
    );
  }
  return value;
}

function stableStringify(value) {
  return JSON.stringify(stableValue(value));
}

function stableKeyComponent(value) {
  return encodeURIComponent(stableStringify(value));
}

function normalizedToken(value) {
  if (value && typeof value === "object") return stableStringify(value);
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizedIdentifier(value) {
  if (value && typeof value === "object") return stableStringify(value);
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizedScope(value) {
  return encodeURIComponent(normalizedToken(value).replace(/^www\./, ""));
}

function normalizedBarcode(value) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .replace(/^0(?=\d{12}$)/, "");
}

function normalizedNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  const text = String(value ?? "").trim();
  const numeric = text.replace(/[,$\s]/g, "");
  if (/^-?\d+(?:\.\d+)?$/.test(numeric)) {
    const parsed = Number(numeric);
    return Number.isFinite(parsed) ? String(parsed) : "";
  }
  return normalizedToken(value);
}

function normalizedQuantity(value) {
  const text = String(value ?? "").trim();
  const quantityOnly = text.match(
    /^(\d+(?:\.\d+)?)\s*(?:count|ct|pieces?|pcs?|units?|pack|pk|envelopes?)?$/i
  );
  return quantityOnly ? String(Number(quantityOnly[1])) : normalizedToken(value);
}

function normalizedDimensions(value) {
  return normalizedToken(value)
    .replace(/[×✕]/g, "x")
    .replace(/\b(?:inches|inch)\b/g, "in")
    .replace(/\s*x\s*/g, "x")
    .replace(/\s+/g, " ");
}

function normalizedCurrency(value) {
  return normalizedIdentifier(value).toUpperCase();
}

function normalizedBooleanOrText(value) {
  return typeof value === "boolean" ? String(value) : normalizedToken(value);
}

function normalizedListingIdentifier(value, field) {
  const identifier = normalizedIdentifier(value);
  return identifier ? `${LISTING_IDENTIFIER_TYPES[field] || field}:${identifier}` : "";
}

function flattenFactValues(value, arrayMode = "set") {
  if (!isPopulated(value)) return [];
  if (!Array.isArray(value)) return [value];
  if (arrayMode === "ordered") return [stableValue(value)];
  return value.flatMap((item) => flattenFactValues(item, arrayMode));
}

function compareCaseSensitiveText(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function normalizeCanonicalOfferUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    const retainedPairs = [...url.searchParams.entries()]
      .filter(([name]) => !TRACKING_QUERY_PARAMETERS.has(String(name).toLowerCase()))
      .sort(([leftName, leftValue], [rightName, rightValue]) => (
        compareCaseSensitiveText(leftName, rightName)
        || compareCaseSensitiveText(leftValue, rightValue)
      ));
    url.search = "";
    for (const [name, queryValue] of retainedPairs) {
      url.searchParams.append(name, queryValue);
    }
    return url.toString();
  } catch {
    return "";
  }
}

function normalizedImageIdentity(value) {
  return normalizeCanonicalOfferUrl(value) || normalizedIdentifier(value);
}

export const CANONICAL_OFFER_FACT_REGISTRY = Object.freeze([
  {
    name: "source",
    aliases: [
      "originalMarketplaceDomain",
      "marketplaceDomain",
      "marketplace",
      "sourceDomain",
      "retailerDomain",
      "retailerDisplayName",
      "retailer",
      "merchant",
      "domain"
    ],
    normalize: normalizedToken,
    conflict: false
  },
  {
    name: "seller",
    aliases: SELLER_FIELDS,
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "listingIdentifier",
    aliases: LISTING_IDENTIFIER_FIELDS,
    normalize: normalizedListingIdentifier,
    conflict: true
  },
  {
    name: "sku",
    aliases: [
      "retailerProductSku",
      "sku",
      "SKU",
      "productSku",
      "itemNumber",
      "styleNumber"
    ],
    normalize: normalizedIdentifier,
    conflict: true
  },
  {
    name: "productIdentifier",
    aliases: [
      "sourceProductId",
      "productId",
      "catalogProductId"
    ],
    normalize: normalizedIdentifier,
    conflict: true
  },
  {
    name: "barcode",
    aliases: [
      "gtin",
      "gtin12",
      "gtin13",
      "upc",
      "UPC",
      "barcode",
      "ean",
      "EAN",
      "isbn",
      "ISBN"
    ],
    normalize: normalizedBarcode,
    conflict: true
  },
  {
    name: "productIdentity",
    aliases: [
      "productIdentity",
      "canonicalProductIdentity",
      "exactProductIdentity",
      "normalizedProductIdentity"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "model",
    aliases: [
      "model",
      "modelNumber",
      "modelOrItemNumber",
      "manufacturerPartNumber",
      "mpn",
      "MPN"
    ],
    normalize: normalizedIdentifier,
    conflict: true
  },
  {
    name: "quantity",
    aliases: [
      "quantity",
      "packageQuantity",
      "unitCount",
      "count",
      "packSize",
      "packageCount",
      "pieceCount",
      "candidatePackQuantity",
      "submittedPackQuantity"
    ],
    normalize: normalizedQuantity,
    conflict: true
  },
  {
    name: "dimensions",
    aliases: [
      "dimensions",
      "dimensionText",
      "packageSize",
      "sizeDimensions",
      "size",
      "dimensionValues",
      "dimensionUnits",
      "dimensionUnit"
    ],
    normalize: normalizedDimensions,
    arrayMode: "ordered",
    conflict: true
  },
  {
    name: "packageType",
    aliases: [
      "packageType",
      "packagingType",
      "containerType"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "design",
    aliases: [
      "designIdentity",
      "design",
      "designDescription",
      "variant",
      "style",
      "pattern",
      "designVariant"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "colorFinish",
    aliases: [
      "color",
      "colour",
      "finish",
      "colorFinish"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "brand",
    aliases: [
      "brand",
      "manufacturer",
      "maker"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "edition",
    aliases: [
      "edition",
      "releaseYear",
      "year",
      "series"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "condition",
    aliases: [
      "offerCondition",
      "condition",
      "priceCondition",
      "retailOfferConditionDisclosure",
      "conditionGrade"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "itemPrice",
    aliases: [
      "price",
      "parsedPrice",
      "itemPriceAmount",
      "displayedPrice",
      "displayedPriceText"
    ],
    normalize: normalizedNumber,
    conflict: false
  },
  {
    name: "unitPrice",
    aliases: [
      "unitPrice",
      "unitPriceAmount",
      "pricePerUnit"
    ],
    normalize: normalizedNumber,
    conflict: true
  },
  {
    name: "currency",
    aliases: [
      "currency",
      "currencyCode"
    ],
    normalize: normalizedCurrency,
    conflict: true
  },
  {
    name: "shipping",
    aliases: [
      "shipping",
      "shippingCost",
      "shippingAmount",
      "shippingPrice",
      "delivery",
      "deliveryCost"
    ],
    normalize: normalizedNumber,
    conflict: true
  },
  {
    name: "deliveredCost",
    aliases: [
      "deliveredCost",
      "deliveredPrice",
      "totalPrice",
      "deliveredCostAmount",
      "totalDeliveredCost"
    ],
    normalize: normalizedNumber,
    conflict: true
  },
  {
    name: "priceType",
    aliases: [
      "priceType",
      "priceEvidenceType",
      "priceTypeLabel"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "listingState",
    aliases: [
      "listingStatus",
      "listingState",
      "activeSoldReferenceStatus",
      "saleStatus",
      "transactionStatus"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "availability",
    aliases: [
      "availability",
      "availabilityStatus",
      "stockStatus",
      "inventoryStatus"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "sourceQuality",
    aliases: [
      "sourceQuality",
      "observationQuality",
      "evidencePath",
      "sourceEvidenceType",
      "acquisitionSourceQuality"
    ],
    normalize: normalizedToken,
    conflict: false
  },
  {
    name: "directPage",
    aliases: [
      "directProductPage",
      "exactRetailPage",
      "directPageProvenance",
      "directPageSource",
      "exactPageRecoveryStatus",
      "exactPageRecoveryMode",
      "exactPageEnrichmentStatus",
      "retailOfferPageType",
      "pageType"
    ],
    normalize: normalizedBooleanOrText,
    conflict: false
  },
  {
    name: "image",
    aliases: [
      "imageUrl",
      "imageIdentity",
      "image",
      "thumbnailUrl",
      "images"
    ],
    normalize: normalizedImageIdentity,
    conflict: true
  },
  {
    name: "directListingUrl",
    aliases: DIRECT_LISTING_URL_FIELDS,
    normalize: normalizeCanonicalOfferUrl,
    conflict: false
  },
  {
    name: "originalListingUrl",
    aliases: ORIGINAL_LISTING_URL_FIELDS,
    normalize: normalizeCanonicalOfferUrl,
    conflict: false
  },
  {
    name: "title",
    aliases: [
      "title",
      "productTitle",
      "offerTitle"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "itemType",
    aliases: [
      "submittedItemType",
      "candidateItemType",
      "itemType",
      "targetProductFamily",
      "candidateProductFamily"
    ],
    normalize: normalizedToken,
    conflict: true
  },
  {
    name: "compatibility",
    aliases: [
      "exactIdentity",
      "identityMatchStrength",
      "itemTypeCompatible",
      "itemTypeCompatibilityStatus",
      "quantityCompatible",
      "dimensionsCompatible"
    ],
    normalize: normalizedBooleanOrText,
    conflict: false
  },
  {
    name: "store",
    aliases: [
      "storeId",
      "storeNumber",
      "locationName",
      "storeLocation"
    ],
    normalize: normalizedToken,
    conflict: true
  }
]);

function collectFamilyFactEntries(record = {}, family) {
  const entries = [];
  for (const field of family.aliases) {
    for (const value of flattenFactValues(record[field], family.arrayMode)) {
      const normalized = family.normalize(value, field);
      if (!isPopulated(normalized)) continue;
      entries.push({
        field,
        normalized,
        value
      });
    }
  }
  const byNormalized = new Map();
  for (const entry of entries.sort((left, right) => (
    left.normalized.localeCompare(right.normalized)
    || left.field.localeCompare(right.field)
    || stableStringify(left.value).localeCompare(stableStringify(right.value))
  ))) {
    if (!byNormalized.has(entry.normalized)) byNormalized.set(entry.normalized, entry);
  }
  return [...byNormalized.values()];
}

function familyByName(name) {
  return CANONICAL_OFFER_FACT_REGISTRY.find((family) => family.name === name);
}

function inferredListingIdentifiers(record = {}, urlValues = []) {
  const text = [record.rawText, record.snippet, record.title].filter(Boolean).join(" ");
  const inferred = [
    text.match(/\b(?:marketplace\s+)?item\s+id\s*[:#]?\s*([a-z0-9-]{6,})\b/i)?.[1],
    ...urlValues.map((urlValue) => (
      String(urlValue).match(/\/(?:itm|item|lot)\/([a-z0-9-]{6,})(?:[/?#]|$)/i)?.[1]
    ))
  ].filter(Boolean).map((value) => `inferred-item:${normalizedIdentifier(value)}`);
  return [...new Set(inferred)].sort();
}

function inferredBarcodes(record = {}, urlValues = []) {
  const text = [record.rawText, record.snippet, record.title].filter(Boolean).join(" ");
  return [...new Set([
    text.match(/\b(?:gtin|upc|barcode)\s*[:#]?\s*(\d{12,14})\b/i)?.[1],
    ...urlValues.map((urlValue) => (
      String(urlValue).match(/(?:^|[^\d])(\d{12,14})(?:[^\d]|$)/)?.[1]
    ))
  ].filter(Boolean).map(normalizedBarcode).filter(Boolean))].sort();
}

function collectUrlFacts(record = {}, fields = DIRECT_LISTING_URL_FIELDS) {
  const values = fields.flatMap((field) => flattenFactValues(record[field]));
  if (
    !values.length
    && fields === DIRECT_LISTING_URL_FIELDS
    && /^https?:\/\//i.test(String(record.sourceRecordId || ""))
  ) {
    values.push(record.sourceRecordId);
  }
  return [...new Set(values.map(normalizeCanonicalOfferUrl).filter(Boolean))].sort();
}

export function canonicalOfferFactSets(record = {}) {
  const facts = {};
  for (const family of CANONICAL_OFFER_FACT_REGISTRY) {
    const values = collectFamilyFactEntries(record, family).map((entry) => entry.normalized);
    if (values.length) facts[family.name] = values;
  }
  const urlValues = [
    ...collectUrlFacts(record, DIRECT_LISTING_URL_FIELDS),
    ...collectUrlFacts(record, ORIGINAL_LISTING_URL_FIELDS)
  ];
  const barcodes = [
    ...(facts.barcode || []),
    ...inferredBarcodes(record, urlValues)
  ];
  if (barcodes.length) facts.barcode = [...new Set(barcodes)].sort();
  return facts;
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

function offerIdentityDescriptor(record = {}) {
  const directUrls = collectUrlFacts(record, DIRECT_LISTING_URL_FIELDS);
  const allUrlValues = [
    ...directUrls,
    ...collectUrlFacts(record, ORIGINAL_LISTING_URL_FIELDS)
  ];
  const explicitListingIds = collectFamilyFactEntries(
    record,
    familyByName("listingIdentifier")
  ).map((entry) => entry.normalized);
  const listingIds = explicitListingIds.length
    ? [...new Set(explicitListingIds)].sort()
    : inferredListingIdentifiers(record, allUrlValues);
  const scope = sourceScope(record, directUrls[0] || allUrlValues[0] || "");
  const sellers = collectFamilyFactEntries(record, familyByName("seller"))
    .map((entry) => entry.normalized);
  if (listingIds.length) {
    return {
      strength: "listing-identifier",
      strong: true,
      baseKey: `offer:${scope}:${stableKeyComponent(listingIds)}`,
      sellers
    };
  }
  if (directUrls.length) {
    return {
      strength: "canonical-url",
      strong: true,
      baseKey: `url:${scope}:${stableKeyComponent(directUrls)}`,
      sellers
    };
  }
  const materialFacts = canonicalOfferFactSets(record);
  return {
    strength: "material",
    strong: false,
    baseKey: `material:${stableKeyComponent(materialFacts)}`,
    sellers
  };
}

function sellerPartitionLabel(sellers = []) {
  if (!sellers.length) return "seller-unspecified";
  if (sellers.length === 1) return `seller:${stableKeyComponent(sellers)}`;
  return `seller-ambiguous:${stableKeyComponent(sellers)}`;
}

export function underlyingOfferKey(record = {}) {
  const descriptor = offerIdentityDescriptor(record);
  return `${descriptor.baseKey}:${sellerPartitionLabel(descriptor.sellers)}`;
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

function stableRecordKey(record = {}) {
  return stableStringify({
    facts: canonicalOfferFactSets(record),
    sourceRecordId: normalizedIdentifier(record.sourceRecordId),
    provider: normalizedToken(record.provider || record.providerKey || record.searchProvider),
    query: normalizedToken(record.query),
    searchPass: normalizedToken(record.searchPass),
    observation: stableValue(record)
  });
}

function compareObservationPreference(left, right) {
  return observationRank(right) - observationRank(left)
    || completeness(right) - completeness(left)
    || stableRecordKey(left).localeCompare(stableRecordKey(right));
}

function validPrice(record = {}) {
  const value = Number(record.price ?? record.parsedPrice ?? record.itemPriceAmount);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function chooseField(records, field) {
  return records
    .filter((record) => isPopulated(record[field]))
    .sort(compareObservationPreference)[0];
}

function observationProvenance(record = {}) {
  return {
    sourceRecordId: record.sourceRecordId || "",
    provider: record.provider || record.providerKey || record.searchProvider || "",
    query: record.query || "",
    queriesFound: [...new Set([
      ...(Array.isArray(record.queriesFound) ? record.queriesFound : []),
      record.query
    ].filter(Boolean))].sort(),
    searchPass: record.searchPass || "",
    searchPassesFound: [...new Set([
      ...(Array.isArray(record.searchPassesFound) ? record.searchPassesFound : []),
      record.searchPass
    ].filter(Boolean))].sort(),
    sourceQuality: record.sourceQuality || record.observationQuality || record.evidencePath || record.sourceEvidenceType || "",
    directProductPage: record.directProductPage === true || record.exactRetailPage === true,
    directPageProvenance: record.directPageProvenance || record.directPageSource || record.sourceEvidenceType || ""
  };
}

function buildMaterialOfferConflicts(records = []) {
  const conflicts = {};
  for (const family of CANONICAL_OFFER_FACT_REGISTRY.filter((entry) => entry.conflict)) {
    const populated = records.flatMap((record) => (
      collectFamilyFactEntries(record, family).map((entry) => ({
        sourceRecordId: record.sourceRecordId || "",
        field: entry.field,
        value: entry.value,
        normalizedValue: entry.normalized,
        sourceQuality: record.sourceQuality || record.observationQuality || record.evidencePath || ""
      }))
    ));
    const distinct = [...new Set(populated.map((entry) => entry.normalizedValue))];
    if (distinct.length <= 1) continue;
    conflicts[family.name] = populated.sort((left, right) => (
      left.normalizedValue.localeCompare(right.normalizedValue)
      || left.sourceRecordId.localeCompare(right.sourceRecordId)
      || left.field.localeCompare(right.field)
      || stableStringify(left.value).localeCompare(stableStringify(right.value))
    ));
  }
  return conflicts;
}

function mergeOfferObservations(records, key) {
  const ranked = records.slice().sort(compareObservationPreference);
  const merged = { ...ranked[0] };
  const provenance = { ...(merged.fieldProvenance || {}) };
  const mergeableFields = [...new Set([
    "snippet",
    "rawText",
    "sourceEvidenceText",
    "provider",
    "providerKey",
    "searchProvider",
    ...CANONICAL_OFFER_FACT_REGISTRY.flatMap((family) => family.aliases)
  ])];
  for (const field of mergeableFields) {
    const supplier = chooseField(ranked, field);
    if (!supplier) continue;
    merged[field] = supplier[field];
    if (supplier.fieldProvenance?.[field]) provenance[field] = supplier.fieldProvenance[field];
  }
  const materialOfferConflicts = buildMaterialOfferConflicts(ranked);

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
  merged.evidenceId = key;
  merged.canonicalOfferFactSets = canonicalOfferFactSets(merged);
  merged.observationIds = [...new Set(records.map((record) => record.sourceRecordId).filter(Boolean))].sort();
  merged.observationProvenance = records
    .map(observationProvenance)
    .sort((left, right) => stableStringify(left).localeCompare(stableStringify(right)));
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

function appendGroupedRecord(grouped, key, record) {
  const group = grouped.get(key) || [];
  group.push(record);
  grouped.set(key, group);
}

function buildSellerSafeGroups(records = []) {
  const grouped = new Map();
  const strongGroups = new Map();
  for (const record of records) {
    const descriptor = offerIdentityDescriptor(record);
    if (!descriptor.strong) {
      appendGroupedRecord(
        grouped,
        `${descriptor.baseKey}:${sellerPartitionLabel(descriptor.sellers)}`,
        record
      );
      continue;
    }
    const baseGroup = strongGroups.get(descriptor.baseKey) || [];
    baseGroup.push({ record, descriptor });
    strongGroups.set(descriptor.baseKey, baseGroup);
  }

  for (const [baseKey, entries] of [...strongGroups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const populatedSellerGroups = new Map();
    const sellerMissingEntries = [];
    for (const entry of entries) {
      if (!entry.descriptor.sellers.length) {
        sellerMissingEntries.push(entry.record);
        continue;
      }
      const sellerLabel = sellerPartitionLabel(entry.descriptor.sellers);
      appendGroupedRecord(populatedSellerGroups, sellerLabel, entry.record);
    }
    for (const [sellerLabel, sellerRecords] of [...populatedSellerGroups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
      for (const record of sellerRecords) {
        appendGroupedRecord(grouped, `${baseKey}:${sellerLabel}`, record);
      }
    }
    if (!sellerMissingEntries.length) continue;
    const populatedSellerLabels = [...populatedSellerGroups.keys()];
    const solePopulatedSeller = populatedSellerLabels.length === 1
      && populatedSellerLabels[0].startsWith("seller:")
      ? populatedSellerLabels[0]
      : "";
    const missingSellerLabel = solePopulatedSeller || "seller-unspecified";
    for (const record of sellerMissingEntries) {
      appendGroupedRecord(grouped, `${baseKey}:${missingSellerLabel}`, record);
    }
  }
  return grouped;
}

export function dedupeUnderlyingOffers(records = []) {
  const grouped = buildSellerSafeGroups(records);
  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, observations]) => mergeOfferObservations(observations, key));
}
