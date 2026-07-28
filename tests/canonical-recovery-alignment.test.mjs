import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createCanonicalRecoveryView,
  createFinalEvidenceResult,
  dedupeUnderlyingOffers,
  underlyingOfferKey
} from "../lib/evidence/index.js";
import {
  CANONICAL_OFFER_FACT_REGISTRY,
  canonicalOfferFactSets,
  normalizeCanonicalOfferUrl
} from "../lib/evidence/dedupe.js";
import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";

for (const key of Object.keys(process.env)) {
  if (/OPENAI|OPEN_API|SERPER|MARKETPLACE|RETAILER|PROVIDER|EBAY|ETSY/i.test(key)) {
    delete process.env[key];
  }
}

let unexpectedNetworkAttempts = 0;
globalThis.fetch = async () => {
  unexpectedNetworkAttempts += 1;
  throw new Error("Unexpected network access in canonical-recovery-alignment test.");
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetIdentity = {
  upc: "012345678905",
  quantity: 48,
  dimensions: "4.125 x 9.5 inches",
  packageType: "security envelopes",
  designAttributes: ["strip and seal", "security tint"]
};

function observation(overrides = {}) {
  return {
    sourceRecordId: "source-1",
    title: "Cedarline Security Envelopes 48 Count Strip and Seal Security Tint",
    retailer: "Direct Retail",
    retailerDomain: "direct.example",
    sourceDomain: "direct.example",
    destinationUrl: "https://direct.example/product/012345678905",
    upc: "012345678905",
    quantity: 48,
    dimensions: "4.125 x 9.5 inches",
    packageType: "security envelopes",
    designIdentity: "strip and seal security tint",
    exactIdentity: true,
    identityMatchStrength: "Exact",
    itemTypeCompatible: true,
    itemTypeCompatibilityStatus: "compatible",
    pageType: "product",
    price: 5.5,
    priceType: "Current retail price",
    ...overrides
  };
}

const category = observation({
  sourceRecordId: "category",
  title: "Security envelopes category",
  destinationUrl: "https://direct.example/category/envelopes",
  pageType: "category"
});
const quantityMismatch = observation({
  sourceRecordId: "wrong-quantity",
  destinationUrl: "https://direct.example/product/wrong-quantity",
  quantity: 200
});
const dimensionsMismatch = observation({
  sourceRecordId: "wrong-dimensions",
  destinationUrl: "https://direct.example/product/wrong-dimensions",
  dimensions: "6 x 9 inches"
});
const designMismatch = observation({
  sourceRecordId: "wrong-design",
  destinationUrl: "https://direct.example/product/wrong-design",
  title: "Plain invitation envelopes 48 count",
  designIdentity: "plain invitation"
});
const rejectedView = createCanonicalRecoveryView({
  observations: [category, quantityMismatch, dimensionsMismatch, designMismatch],
  targetIdentity
});
assert.equal(rejectedView.deduplicatedAcceptedCount, 0, "Category, quantity, dimension, and design mismatches cannot satisfy recovery.");
assert.equal(rejectedView.rejectedEvidenceIds.length, 4);
assert.equal(rejectedView.additionalPriceRecoveryNeeded, true);

const legacyApprovedCategory = { ...category, customerPriceCardEligibility: true };
const legacyApprovedView = createCanonicalRecoveryView({
  observations: [legacyApprovedCategory],
  targetIdentity
});
assert.equal(legacyApprovedView.deduplicatedAcceptedCount, 0, "A legacy-approved price card cannot override canonical rejection.");
assert.equal(legacyApprovedView.additionalPriceRecoveryNeeded, true);

const exactAcceptedDespiteLegacy = observation({
  sourceRecordId: "legacy-rejected-exact",
  customerPriceCardEligibility: false
});
const compatibleAcceptedDespiteLegacy = observation({
  sourceRecordId: "legacy-rejected-compatible",
  retailer: "Alternate Retail",
  retailerDomain: "alternate.example",
  sourceDomain: "alternate.example",
  destinationUrl: "https://alternate.example/product/security-envelopes-50",
  upc: "",
  exactIdentity: false,
  identityMatchStrength: "Strong",
  quantity: 50,
  price: 4.8,
  customerPriceCardEligibility: false
});
const legacyRejectedAcceptedView = createCanonicalRecoveryView({
  observations: [exactAcceptedDespiteLegacy, compatibleAcceptedDespiteLegacy],
  targetIdentity
});
assert.equal(legacyRejectedAcceptedView.deduplicatedAcceptedCount, 2);
assert.equal(legacyRejectedAcceptedView.additionalPriceRecoveryNeeded, false, "Canonical acceptance must prevent unnecessary recovery even when legacy card flags are false.");

const duplicateView = createCanonicalRecoveryView({
  observations: [
    exactAcceptedDespiteLegacy,
    {
      ...exactAcceptedDespiteLegacy,
      sourceRecordId: "source-1-direct",
      sourceQuality: "direct_product_page"
    }
  ],
  targetIdentity
});
assert.equal(duplicateView.deduplicatedAcceptedCount, 1, "Duplicate representations of one underlying offer count once.");
assert.equal(duplicateView.equivalentOfferCount, 1);

const crossRetailerView = createCanonicalRecoveryView({
  observations: [
    exactAcceptedDespiteLegacy,
    observation({
      sourceRecordId: "cross-retailer",
      retailer: "Second Retail",
      retailerDomain: "second.example",
      sourceDomain: "second.example",
      destinationUrl: "https://second.example/product/012345678905"
    })
  ],
  targetIdentity
});
assert.equal(crossRetailerView.deduplicatedAcceptedCount, 2, "Cross-retailer offers remain separate.");
assert.deepEqual(crossRetailerView.distinctQualifyingRetailerDomains, ["direct.example", "second.example"]);

const sameRetailerSeparateOffers = createCanonicalRecoveryView({
  observations: [
    observation({
      sourceRecordId: "offer-a",
      destinationUrl: "https://market.example/item/offer-a",
      originalUrl: "https://market.example/item/offer-a",
      retailer: "Market",
      offerId: "offer-a"
    }),
    observation({
      sourceRecordId: "offer-b",
      destinationUrl: "https://market.example/item/offer-b",
      originalUrl: "https://market.example/item/offer-b",
      retailer: "Market",
      offerId: "offer-b",
      price: 6.25
    })
  ],
  targetIdentity
});
assert.equal(sameRetailerSeparateOffers.deduplicatedAcceptedCount, 2, "Materially separate offers at one retailer remain separate.");

const exactNoPrice = observation({
  sourceRecordId: "exact-no-price",
  destinationUrl: "https://reference.example/product/012345678905",
  retailer: "Reference Retail",
  retailerDomain: "reference.example",
  sourceDomain: "reference.example",
  price: null,
  parsedPrice: null,
  displayedPrice: "Price unavailable",
  priceType: "Price unavailable"
});
const exactNoPriceView = createCanonicalRecoveryView({
  observations: [exactNoPrice],
  targetIdentity
});
assert.equal(exactNoPriceView.deduplicatedAcceptedCount, 1);
assert.equal(exactNoPriceView.exactNoPriceEvidenceCount, 1);
assert.equal(exactNoPriceView.priceBearingAcceptedCount, 0);
assert.equal(exactNoPriceView.additionalPriceRecoveryNeeded, true, "Exact no-price evidence cannot satisfy a price-bearing requirement.");

const transportDuplicate = hooks.coalesceIdenticalSerperTransportRecords([
  observation({ query: "query one", searchPass: "exact" }),
  observation({ query: "query two", searchPass: "retailer" })
]);
assert.equal(transportDuplicate.length, 1, "Transport-identical observations may be coalesced while query provenance is retained.");
assert.deepEqual(transportDuplicate[0].queriesFound.sort(), ["query one", "query two"]);
assert.deepEqual(transportDuplicate[0].searchPassesFound.sort(), ["exact", "retailer"]);
const transportDifferentPrice = hooks.coalesceIdenticalSerperTransportRecords([
  observation({ price: 5.5 }),
  observation({ price: 6.5 })
]);
assert.equal(transportDifferentPrice.length, 2, "Transport coalescing cannot merge different price states.");
const transportDifferentRetailer = hooks.coalesceIdenticalSerperTransportRecords([
  observation(),
  observation({
    retailer: "Second Retail",
    retailerDomain: "second.example",
    sourceDomain: "second.example",
    destinationUrl: "https://second.example/product/012345678905"
  })
]);
assert.equal(transportDifferentRetailer.length, 2);

for (const [field, changedValue] of [
  ["upc", "012345678912"],
  ["sku", "SKU-CHANGED"],
  ["model", "MODEL-CHANGED"],
  ["dimensions", "6 x 9 inches"],
  ["designIdentity", "different closure design"],
  ["color", "Blue"],
  ["finish", "Gloss"],
  ["shipping", 4.99],
  ["deliveredCost", 10.49],
  ["currency", "CAD"],
  ["sourceQuality", "direct_product_page"],
  ["directPageProvenance", "redirected_final_page"],
  ["directProductPage", true],
  ["imageUrl", "https://images.example/changed.jpg"],
  ["condition", "Used"],
  ["quantity", 50],
  ["listingStatus", "sold"],
  ["availability", "out of stock"],
  ["seller", "Different Seller"],
  ["price", 6.5]
]) {
  const records = hooks.coalesceIdenticalSerperTransportRecords([
    observation({ sourceQuality: "search_snippet", directPageProvenance: "provider_search" }),
    observation({ sourceQuality: "search_snippet", directPageProvenance: "provider_search", [field]: changedValue })
  ]);
  assert.equal(records.length, 2, `Transport observations differing only in ${field} must remain separate.`);
}
const runtimeOnlyTransportA = observation({
  query: "query one",
  searchPass: "pass one",
  observedAt: "2026-01-01T00:00:00.000Z",
  fetchedAt: "2026-01-01T00:00:01.000Z",
  duration: 10,
  elapsedMs: 10,
  attemptStartedAt: "2026-01-01T00:00:00.000Z",
  attemptCompletedAt: "2026-01-01T00:00:01.000Z",
  attemptId: "attempt-one",
  requestId: "request-one",
  processId: 101,
  testOnlyMetadata: "fixture-one",
  positiveCompatibilityEvidence: ["barcode", "quantity"]
});
const runtimeOnlyTransportB = observation({
  query: "query two",
  searchPass: "pass two",
  observedAt: "2026-02-01T00:00:00.000Z",
  fetchedAt: "2026-02-01T00:00:01.000Z",
  duration: 20,
  elapsedMs: 20,
  attemptStartedAt: "2026-02-01T00:00:00.000Z",
  attemptCompletedAt: "2026-02-01T00:00:01.000Z",
  attemptId: "attempt-two",
  requestId: "request-two",
  processId: 202,
  testOnlyMetadata: "fixture-two",
  positiveCompatibilityEvidence: ["quantity", "barcode"]
});
assert.equal(
  hooks.buildSerperTransportIdentity(runtimeOnlyTransportA),
  hooks.buildSerperTransportIdentity(runtimeOnlyTransportB),
  "Volatile provenance, runtime attempt IDs, arbitrary metadata, and set order cannot affect transport identity."
);
assert.equal(
  hooks.coalesceIdenticalSerperTransportRecords([runtimeOnlyTransportA, runtimeOnlyTransportB]).length,
  1
);
assert.deepEqual(
  hooks.coalesceIdenticalSerperTransportRecords([runtimeOnlyTransportA, runtimeOnlyTransportB]),
  hooks.coalesceIdenticalSerperTransportRecords([runtimeOnlyTransportB, runtimeOnlyTransportA]),
  "Transport coalescing cannot retain first-arrival query, pass, request ID, timestamp, or provenance order."
);
for (const nestedPath of hooks.serperTransportSetPaths) {
  const [parent, child] = nestedPath.split(".");
  assert.equal(
    hooks.buildSerperTransportIdentity({ title: "Nested set", [parent]: { [child]: ["Beta", "Alpha"] } }),
    hooks.buildSerperTransportIdentity({ title: "Nested set", [parent]: { [child]: ["Alpha", "Beta", "Alpha"] } }),
    `Nested set-like path ${nestedPath} must ignore order and duplicate values.`
  );
}
const transportPropertyOrderA = {
  title: "Transport property order",
  seller: "Seller One",
  price: 5.5,
  dimensions: [4.125, 9.5]
};
const transportPropertyOrderB = {
  dimensions: [4.125, 9.5],
  price: 5.5,
  seller: "Seller One",
  title: "Transport property order"
};
assert.equal(
  hooks.buildSerperTransportIdentity(transportPropertyOrderA),
  hooks.buildSerperTransportIdentity(transportPropertyOrderB),
  "Object property insertion order cannot affect transport identity."
);
assert.equal(
  hooks.buildSerperTransportIdentity({
    canonicalProductIdentity: { brand: "Cedarline", attributes: { count: 48, closure: "strip and seal" } }
  }),
  hooks.buildSerperTransportIdentity({
    canonicalProductIdentity: { attributes: { closure: "strip and seal", count: 48 }, brand: "Cedarline" }
  }),
  "Nested object property insertion order cannot affect transport identity."
);
for (const setField of hooks.serperTransportSetFields) {
  assert.equal(
    hooks.buildSerperTransportIdentity({ title: "Set normalization", [setField]: ["Beta", "Alpha"] }),
    hooks.buildSerperTransportIdentity({ title: "Set normalization", [setField]: ["Alpha", "Beta", "Alpha"] }),
    `Set-like ${setField} order and duplicate values cannot affect transport identity.`
  );
}
for (const materialField of hooks.serperTransportIdentityFields) {
  const isSetField = hooks.serperTransportSetFields.includes(materialField);
  const isUrlField = /(?:url|image)/i.test(materialField);
  const leftValue = isSetField
    ? ["Material A"]
    : isUrlField
      ? "https://transport.example/Material/A"
      : "Material A";
  const rightValue = isSetField
    ? ["Material B"]
    : isUrlField
      ? "https://transport.example/Material/B"
      : "Material B";
  assert.notEqual(
    hooks.buildSerperTransportIdentity({ [materialField]: leftValue }),
    hooks.buildSerperTransportIdentity({ [materialField]: rightValue }),
    `Explicit transport material field ${materialField} must affect identity.`
  );
}
const repeatedTransportIdentity = hooks.buildSerperTransportIdentity(runtimeOnlyTransportA);
for (let repetition = 0; repetition < 5; repetition += 1) {
  assert.equal(
    hooks.buildSerperTransportIdentity(runtimeOnlyTransportA),
    repeatedTransportIdentity,
    "Repeated transport identity runs must remain byte-for-byte stable."
  );
}
assert.notEqual(
  hooks.buildSerperTransportIdentity(observation({
    destinationUrl: "https://direct.example/Product/Offer?Variant=Blue"
  })),
  hooks.buildSerperTransportIdentity(observation({
    destinationUrl: "https://direct.example/product/Offer?Variant=Blue"
  })),
  "Transport URL identity preserves path case."
);
assert.notEqual(
  hooks.buildSerperTransportIdentity(observation({ dimensionValues: [4.125, 9.5] })),
  hooks.buildSerperTransportIdentity(observation({ dimensionValues: [9.5, 4.125] })),
  "Ordered transport arrays preserve tuple order."
);
const directAndSearchTransport = hooks.coalesceIdenticalSerperTransportRecords([
  observation({ sourceQuality: "search_snippet", directProductPage: false }),
  observation({ sourceQuality: "direct_product_page", directProductPage: true })
]);
assert.equal(directAndSearchTransport.length, 2, "Direct-page provenance cannot erase the search-result observation.");
const sameRetailerTransportOffers = hooks.coalesceIdenticalSerperTransportRecords([
  observation({ destinationUrl: "https://direct.example/product/offer-one", offerId: "offer-one" }),
  observation({ destinationUrl: "https://direct.example/product/offer-two", offerId: "offer-two" })
]);
assert.equal(sameRetailerTransportOffers.length, 2, "Different transport offers at one retailer remain separate.");

const sameRetailerBarcodeDifferentUrls = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "barcode-url-a",
    destinationUrl: "https://direct.example/product/offer-a"
  }),
  observation({
    sourceRecordId: "barcode-url-b",
    destinationUrl: "https://direct.example/product/offer-b",
    price: 6.25
  })
]);
assert.equal(sameRetailerBarcodeDifferentUrls.length, 2, "Retailer plus barcode cannot collapse distinct canonical URLs.");
assert(sameRetailerBarcodeDifferentUrls.every((record) => !record.priceConflict), "Separate URL offers cannot create a false same-offer price conflict.");

const fallbackOffer = (overrides = {}) => {
  const record = observation(overrides);
  delete record.destinationUrl;
  delete record.url;
  delete record.canonicalUrl;
  delete record.originalUrl;
  return record;
};
const sameBarcodeDifferentSellers = dedupeUnderlyingOffers([
  fallbackOffer({ sourceRecordId: "seller-a", seller: "Seller A" }),
  fallbackOffer({ sourceRecordId: "seller-b", seller: "Seller B" })
]);
assert.equal(sameBarcodeDifferentSellers.length, 2, "Same-retailer/barcode offers from different sellers remain separate.");
const sameBarcodeDifferentConditions = dedupeUnderlyingOffers([
  fallbackOffer({ sourceRecordId: "condition-new", condition: "New" }),
  fallbackOffer({ sourceRecordId: "condition-used", condition: "Used" })
]);
assert.equal(sameBarcodeDifferentConditions.length, 2, "Condition differences remain separate without a shared strong listing identity.");
assert(!underlyingOfferKey(fallbackOffer()).startsWith("retail:"), "Barcode cannot become a product-only retail offer key.");

const secondaryDesignFacts = dedupeUnderlyingOffers([
  fallbackOffer({
    sourceRecordId: "secondary-design-blue",
    designIdentity: "floral",
    variant: "blue"
  }),
  fallbackOffer({
    sourceRecordId: "secondary-design-red",
    designIdentity: "floral",
    variant: "red"
  })
]);
assert.equal(secondaryDesignFacts.length, 2, "A secondary populated variant cannot be hidden by equal designIdentity.");
const secondaryQuantityFacts = dedupeUnderlyingOffers([
  fallbackOffer({
    sourceRecordId: "secondary-quantity-12",
    quantity: 12,
    packageQuantity: 12
  }),
  fallbackOffer({
    sourceRecordId: "secondary-quantity-24",
    quantity: 12,
    packageQuantity: 24
  })
]);
assert.equal(secondaryQuantityFacts.length, 2, "A conflicting packageQuantity cannot be hidden by equal quantity.");
const differentFallbackModels = dedupeUnderlyingOffers([
  fallbackOffer({ sourceRecordId: "fallback-model-a", model: "MODEL-A" }),
  fallbackOffer({ sourceRecordId: "fallback-model-b", model: "MODEL-B" })
]);
assert.equal(differentFallbackModels.length, 2, "Different model facts remain distinct without strong listing proof.");
const missingVersusPopulatedFallback = dedupeUnderlyingOffers([
  fallbackOffer({ sourceRecordId: "fallback-model-missing", model: "" }),
  fallbackOffer({ sourceRecordId: "fallback-model-populated", model: "MODEL-A" })
]);
assert.equal(missingVersusPopulatedFallback.length, 2, "A missing material fact remains conservatively separate without strong listing proof.");
for (const [field, leftValue, rightValue] of [
  ["packageType", "box", "bag"],
  ["dimensions", "4 x 9 in", "6 x 9 in"],
  ["design", "Design A", "Design B"],
  ["condition", "New", "Used"],
  ["price", 5.5, 6.5],
  ["shippingCost", 0, 4.99],
  ["deliveredCost", 5.5, 10.49],
  ["listingStatus", "active", "sold"],
  ["availability", "in stock", "out of stock"]
]) {
  const fallbackDifferences = dedupeUnderlyingOffers([
    fallbackOffer({ sourceRecordId: `${field}-fallback-a`, [field]: leftValue }),
    fallbackOffer({ sourceRecordId: `${field}-fallback-b`, [field]: rightValue })
  ]);
  assert.equal(
    fallbackDifferences.length,
    2,
    `Different ${field} facts remain distinct absent strong listing proof.`
  );
}

const sameExplicitListing = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "listing-search",
    offerId: "shared-listing-123",
    destinationUrl: "https://market.example/item/shared-listing-123?utm_source=search",
    retailer: "Market",
    sourceDomain: "market.example",
    seller: "Seller One",
    provider: "Serper Google Search",
    query: "shared listing search",
    searchPass: "open_web_exact",
    sourceQuality: "search_snippet",
    snippet: ""
  }),
  observation({
    sourceRecordId: "listing-direct",
    offerId: "shared-listing-123",
    destinationUrl: "https://market.example/item/shared-listing-123",
    retailer: "Market",
    sourceDomain: "market.example",
    seller: "Seller One",
    provider: "Direct product page fetch",
    query: "https://market.example/item/shared-listing-123",
    searchPass: "exact_retail_page_enrichment",
    sourceQuality: "direct_product_page",
    directProductPage: true,
    snippet: "Verified listing detail from the direct page."
  })
]);
assert.equal(sameExplicitListing.length, 1, "Two representations of the same explicit listing ID count once.");
assert.equal(sameExplicitListing[0].snippet, "Verified listing detail from the direct page.", "Missing listing detail may be enriched.");
assert.deepEqual(sameExplicitListing[0].observationIds, ["listing-direct", "listing-search"]);
assert.deepEqual(sameExplicitListing[0].providersFound, ["Direct product page fetch", "Serper Google Search"]);
assert.deepEqual(sameExplicitListing[0].searchPassesFound, ["exact_retail_page_enrichment", "open_web_exact"]);
assert.deepEqual(sameExplicitListing[0].directPageObservationIds, ["listing-direct"]);

const sameCanonicalListingUrl = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "url-search",
    destinationUrl: "https://direct.example/product/012345678905?utm_source=search",
    seller: "Direct Retail",
    provider: "Serper Google Search"
  }),
  observation({
    sourceRecordId: "url-direct",
    destinationUrl: "https://direct.example/product/012345678905",
    seller: "Direct Retail",
    provider: "Direct product page fetch",
    directProductPage: true
  })
]);
assert.equal(sameCanonicalListingUrl.length, 1, "Search and direct-page observations of one canonical listing count once.");

assert.equal(
  normalizeCanonicalOfferUrl("HTTPS://WWW.Example.COM:443/Case/Path?b=2&utm_source=search&A=Upper&a=lower#Section"),
  "https://www.example.com/Case/Path?A=Upper&a=lower&b=2#Section",
  "URL identity normalizes only proven-safe components and documented tracking parameters."
);
assert.equal(
  normalizeCanonicalOfferUrl("https://example.com/Case/Path?b=2&a=1&a=2"),
  "https://example.com/Case/Path?a=1&a=2&b=2",
  "Non-tracking duplicate query parameters remain present and deterministically ordered."
);
const pathCaseOffers = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "path-case-upper",
    destinationUrl: "https://direct.example/Product/Offer",
    seller: "Direct Retail"
  }),
  observation({
    sourceRecordId: "path-case-lower",
    destinationUrl: "https://direct.example/product/Offer",
    seller: "Direct Retail"
  })
]);
assert.equal(pathCaseOffers.length, 2, "Case-sensitive URL paths cannot be lowercased into one offer.");
const nonTrackingQueryOffers = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "query-case-upper",
    destinationUrl: "https://direct.example/product/offer?Variant=Blue",
    seller: "Direct Retail"
  }),
  observation({
    sourceRecordId: "query-case-lower",
    destinationUrl: "https://direct.example/product/offer?Variant=blue",
    seller: "Direct Retail"
  })
]);
assert.equal(nonTrackingQueryOffers.length, 2, "Case-sensitive non-tracking query values remain material.");
const trackingOnlyUrlVariants = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "tracking-url-a",
    destinationUrl: "https://direct.example/Product/Offer?utm_source=one&b=2&a=1",
    seller: "Direct Retail"
  }),
  observation({
    sourceRecordId: "tracking-url-b",
    destinationUrl: "https://DIRECT.EXAMPLE:443/Product/Offer?a=1&b=2&fbclid=ignored",
    seller: "Direct Retail"
  })
]);
assert.equal(trackingOnlyUrlVariants.length, 1, "Host/default-port/query-order and tracking-only URL differences normalize together.");

const sellerSeparatedListing = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "seller-separated-a",
    offerId: "shared-seller-safe-listing",
    seller: "Seller A"
  }),
  observation({
    sourceRecordId: "seller-separated-b",
    offerId: "shared-seller-safe-listing",
    sellerName: "Seller B"
  })
]);
assert.equal(sellerSeparatedListing.length, 2, "One strong listing identity cannot bridge two populated sellers.");
const retailerMerchantAndSeller = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "retailer-merchant-search",
    offerId: "retailer-merchant-listing",
    merchantName: "Retailer Source",
    retailer: "Retailer Source",
    seller: "Third Party Seller"
  }),
  observation({
    sourceRecordId: "retailer-merchant-direct",
    offerId: "retailer-merchant-listing",
    retailer: "Retailer Source",
    seller: "Third Party Seller",
    sourceQuality: "direct_product_page"
  })
]);
assert.equal(retailerMerchantAndSeller.length, 1, "Retailer/source merchantName cannot split one proven third-party offer.");
assert.equal(retailerMerchantAndSeller[0].seller, "Third Party Seller");
assert.equal(retailerMerchantAndSeller[0].merchantName, "Retailer Source");
const locationStoreName = dedupeUnderlyingOffers([
  observation({ sourceRecordId: "location-search", offerId: "location-listing", storeName: "Downtown Store", seller: "Seller One" }),
  observation({ sourceRecordId: "location-direct", offerId: "location-listing", seller: "Seller One" })
]);
assert.equal(locationStoreName.length, 1, "A physical-location storeName cannot become offer-seller identity.");
assert.equal(locationStoreName[0].storeName, "Downtown Store");
const activeSellerAliases = CANONICAL_OFFER_FACT_REGISTRY
  .find((family) => family.name === "seller")
  .aliases;
for (const sellerField of activeSellerAliases) {
  const sellerAliasSeparated = dedupeUnderlyingOffers([
    observation({
      sourceRecordId: `${sellerField}-seller-a`,
      offerId: `${sellerField}-seller-safe-listing`,
      seller: "",
      sellerName: "",
      [sellerField]: "Seller A"
    }),
    observation({
      sourceRecordId: `${sellerField}-seller-b`,
      offerId: `${sellerField}-seller-safe-listing`,
      seller: "",
      sellerName: "",
      [sellerField]: "Seller B"
    })
  ]);
  assert.equal(
    sellerAliasSeparated.length,
    2,
    `Active seller alias ${sellerField} must partition conflicting sellers.`
  );
}
const sellerEnrichedListing = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "seller-known",
    offerId: "seller-enrichment-listing",
    seller: "Seller A",
    sourceQuality: "direct_product_page"
  }),
  observation({
    sourceRecordId: "seller-missing",
    offerId: "seller-enrichment-listing",
    seller: ""
  })
]);
assert.equal(sellerEnrichedListing.length, 1, "A seller-missing observation may join exactly one populated compatible seller group.");
assert.equal(sellerEnrichedListing[0].seller, "Seller A");
const urlSellerEnrichedListing = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "url-seller-known",
    seller: "Seller A",
    sourceQuality: "direct_product_page"
  }),
  observation({
    sourceRecordId: "url-seller-missing",
    seller: ""
  })
]);
assert.equal(urlSellerEnrichedListing.length, 1, "A canonical URL with one uniquely known seller deduplicates once.");
assert.equal(urlSellerEnrichedListing[0].seller, "Seller A");
const sellerBridgeBlocked = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "seller-bridge-a",
    offerId: "seller-bridge-listing",
    seller: "Seller A"
  }),
  observation({
    sourceRecordId: "seller-bridge-b",
    offerId: "seller-bridge-listing",
    seller: "Seller B"
  }),
  observation({
    sourceRecordId: "seller-bridge-missing",
    offerId: "seller-bridge-listing",
    seller: ""
  })
]);
assert.equal(sellerBridgeBlocked.length, 3, "Seller-missing evidence cannot bridge two distinct populated seller groups.");
assert(
  sellerBridgeBlocked.some((record) => /seller-unspecified/.test(record.underlyingOfferId)),
  "The missing-seller observation remains in an unresolved seller partition."
);
const urlSellerBridgeBlocked = dedupeUnderlyingOffers([
  observation({ sourceRecordId: "url-seller-a", seller: "Seller A" }),
  observation({ sourceRecordId: "url-seller-b", seller: "Seller B" }),
  observation({ sourceRecordId: "url-seller-missing", seller: "" })
]);
assert.equal(urlSellerBridgeBlocked.length, 3, "A canonical URL cannot bridge two known sellers through missing-seller evidence.");

const sameListingIdDifferentSources = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "same-id-source-a",
    offerId: "source-scoped-listing",
    retailer: "Source A",
    sourceDomain: "source-a.example",
    destinationUrl: "https://source-a.example/item/source-scoped-listing",
    seller: "Seller One"
  }),
  observation({
    sourceRecordId: "same-id-source-b",
    offerId: "source-scoped-listing",
    retailer: "Source B",
    sourceDomain: "source-b.example",
    destinationUrl: "https://source-b.example/item/source-scoped-listing",
    seller: "Seller One"
  })
]);
assert.equal(sameListingIdDifferentSources.length, 2, "The same textual listing ID on different sources remains separate.");
for (const parameter of ["seller", "offer", "listing", "condition", "variant"]) {
  const parameterVariants = dedupeUnderlyingOffers([
    observation({
      sourceRecordId: `${parameter}-parameter-a`,
      destinationUrl: `https://direct.example/product/offer?${parameter}=Alpha`,
      seller: "Direct Retail"
    }),
    observation({
      sourceRecordId: `${parameter}-parameter-b`,
      destinationUrl: `https://direct.example/product/offer?${parameter}=Beta`,
      seller: "Direct Retail"
    })
  ]);
  assert.equal(
    parameterVariants.length,
    2,
    `Offer-discriminating ${parameter} query parameters remain distinct.`
  );
}
const fragmentVariants = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "fragment-a",
    destinationUrl: "https://direct.example/product/offer#seller-a",
    seller: "Direct Retail"
  }),
  observation({
    sourceRecordId: "fragment-b",
    destinationUrl: "https://direct.example/product/offer#seller-b",
    seller: "Direct Retail"
  })
]);
assert.equal(fragmentVariants.length, 2, "Non-tracking fragments remain offer-discriminating.");

const factRegistryNames = CANONICAL_OFFER_FACT_REGISTRY.map((family) => family.name);
for (const requiredFamily of [
  "seller",
  "listingIdentifier",
  "sku",
  "productIdentifier",
  "barcode",
  "model",
  "quantity",
  "dimensions",
  "design",
  "colorFinish",
  "condition",
  "itemPrice",
  "currency",
  "shipping",
  "deliveredCost",
  "listingState",
  "availability",
  "sourceQuality",
  "directPage",
  "image"
]) {
  assert(factRegistryNames.includes(requiredFamily), `Canonical offer-fact registry must include ${requiredFamily}.`);
}
const repeatedAliasFacts = canonicalOfferFactSets(observation({
  seller: "Seller One",
  sellerName: " seller one ",
  sku: "SKU-ABC",
  SKU: "SKU-ABC",
  model: "Model-Z",
  modelNumber: "Model-Z",
  condition: "New",
  offerCondition: " new ",
  price: 5.5,
  parsedPrice: "5.50"
}));
assert.deepEqual(repeatedAliasFacts.seller, ["seller one"]);
assert.deepEqual(repeatedAliasFacts.sku, ["SKU-ABC"]);
assert.deepEqual(repeatedAliasFacts.model, ["Model-Z"]);
assert.deepEqual(repeatedAliasFacts.condition, ["new"]);
assert.deepEqual(repeatedAliasFacts.itemPrice, ["5.5"]);
assert.deepEqual(
  canonicalOfferFactSets(observation({
    offerId: "CASE-SENSITIVE-ID",
    listingId: "CASE-SENSITIVE-ID"
  })).listingIdentifier,
  ["listing:CASE-SENSITIVE-ID", "offer:CASE-SENSITIVE-ID"],
  "Explicit listing identifier type and case remain represented."
);

const enrichedMaterialFactObservations = [
  observation({
    sourceRecordId: "material-search",
    offerId: "material-enrichment-listing",
    seller: "Seller One",
    sourceQuality: "search_snippet",
    sku: "SKU-ENRICH",
    model: "MODEL-ENRICH",
    productId: "PRODUCT-ENRICH",
    color: "White",
    finish: "Matte",
    imageIdentity: "IMAGE-ENRICH"
  }),
  observation({
    sourceRecordId: "material-direct",
    offerId: "material-enrichment-listing",
    sellerName: "Seller One",
    sourceQuality: "direct_product_page",
    directProductPage: true,
    sku: "",
    model: "",
    productId: "",
    upc: "",
    color: "",
    finish: "",
    imageIdentity: ""
  })
];
const enrichedMaterialFacts = dedupeUnderlyingOffers(enrichedMaterialFactObservations);
assert.equal(enrichedMaterialFacts.length, 1);
assert.equal(enrichedMaterialFacts[0].sku, "SKU-ENRICH", "A missing SKU is enriched from the lower-ranked observation.");
assert.equal(enrichedMaterialFacts[0].model, "MODEL-ENRICH", "A missing model is enriched from the lower-ranked observation.");
assert.equal(enrichedMaterialFacts[0].productId, "PRODUCT-ENRICH", "A missing product ID is enriched.");
assert.equal(enrichedMaterialFacts[0].upc, "012345678905", "A missing barcode is enriched.");
assert.equal(enrichedMaterialFacts[0].color, "White");
assert.equal(enrichedMaterialFacts[0].finish, "Matte");
assert.equal(enrichedMaterialFacts[0].imageIdentity, "IMAGE-ENRICH", "A missing image identity is enriched.");
const enrichedMaterialFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: enrichedMaterialFactObservations
});
assert.equal(enrichedMaterialFinal.acceptedRecords.length, 1);
assert.equal(enrichedMaterialFinal.acceptedRecords[0].model, "MODEL-ENRICH");
assert.equal(enrichedMaterialFinal.acceptedRecords[0].sku, "SKU-ENRICH");
assert.equal(enrichedMaterialFinal.acceptedRecords[0].upc, "012345678905");
assert.equal(enrichedMaterialFinal.acceptedRecords[0].color, "White");
assert.equal(enrichedMaterialFinal.acceptedRecords[0].finish, "Matte");
assert.equal(enrichedMaterialFinal.acceptedRecords[0].imageIdentity, "IMAGE-ENRICH");

for (const {
  family,
  field,
  leftValue,
  rightValue
} of [
  { family: "sku", field: "sku", leftValue: "SKU-A", rightValue: "SKU-B" },
  { family: "productIdentifier", field: "productId", leftValue: "PRODUCT-A", rightValue: "PRODUCT-B" },
  { family: "barcode", field: "upc", leftValue: "012345678905", rightValue: "012345678912" },
  { family: "model", field: "model", leftValue: "MODEL-A", rightValue: "MODEL-B" },
  { family: "quantity", field: "quantity", leftValue: 48, rightValue: 50 },
  { family: "dimensions", field: "dimensions", leftValue: "4 x 9 in", rightValue: "6 x 9 in" },
  { family: "design", field: "design", leftValue: "Design A", rightValue: "Design B" },
  { family: "colorFinish", field: "color", leftValue: "White", rightValue: "Blue" },
  { family: "colorFinish", field: "finish", leftValue: "Matte", rightValue: "Gloss" },
  { family: "condition", field: "condition", leftValue: "New", rightValue: "Used" },
  { family: "currency", field: "currency", leftValue: "USD", rightValue: "CAD" },
  { family: "shipping", field: "shippingCost", leftValue: 0, rightValue: 4.99 },
  { family: "deliveredCost", field: "deliveredCost", leftValue: 5.5, rightValue: 10.49 },
  { family: "listingState", field: "listingStatus", leftValue: "active", rightValue: "sold" },
  { family: "availability", field: "availability", leftValue: "in stock", rightValue: "out of stock" },
  { family: "image", field: "imageUrl", leftValue: "https://images.example/A.jpg", rightValue: "https://images.example/B.jpg" }
]) {
  const conflict = dedupeUnderlyingOffers([
    observation({
      sourceRecordId: `${family}-conflict-a`,
      offerId: `${family}-conflict-listing`,
      seller: "Seller One",
      sourceQuality: "search_snippet",
      [field]: leftValue
    }),
    observation({
      sourceRecordId: `${family}-conflict-b`,
      offerId: `${family}-conflict-listing`,
      seller: "Seller One",
      sourceQuality: "direct_product_page",
      directProductPage: true,
      [field]: rightValue
    })
  ]);
  assert.equal(conflict.length, 1);
  assert(
    conflict[0].materialOfferConflicts?.[family]?.length >= 2,
    `Conflicting populated ${family} facts must remain explicit.`
  );
}

const sameFactsAcrossAliases = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "alias-facts-a",
    offerId: "same-alias-facts",
    seller: "Seller One",
    condition: "New",
    sku: "SKU-SAME",
    model: "MODEL-SAME"
  }),
  observation({
    sourceRecordId: "alias-facts-b",
    offerId: "same-alias-facts",
    sellerName: " seller one ",
    offerCondition: " new ",
    SKU: "SKU-SAME",
    modelNumber: "MODEL-SAME"
  })
]);
assert.equal(sameFactsAcrossAliases.length, 1);
assert.equal(sameFactsAcrossAliases[0].materialOfferConflicts?.seller, undefined);
assert.equal(sameFactsAcrossAliases[0].materialOfferConflicts?.condition, undefined);
assert.equal(sameFactsAcrossAliases[0].materialOfferConflicts?.sku, undefined);
assert.equal(sameFactsAcrossAliases[0].materialOfferConflicts?.model, undefined);

const sellerAliasConflict = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "seller-alias-conflict",
    offerId: "seller-alias-conflict-listing",
    seller: "Seller A",
    sellerName: "Seller B"
  })
]);
assert.equal(sellerAliasConflict.length, 1);
assert.equal(sellerAliasConflict[0].materialOfferConflicts.seller.length, 2, "Conflicting seller aliases remain explicit rather than selecting one silently.");

const provenListingConflict = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "conflict-a",
    offerId: "conflicting-listing",
    sourceQuality: "search_snippet",
    price: 5.5,
    condition: "New"
  }),
  observation({
    sourceRecordId: "conflict-b",
    offerId: "conflicting-listing",
    sourceQuality: "search_snippet",
    price: 6.5,
    condition: "Used"
  })
]);
assert.equal(provenListingConflict.length, 1);
assert.equal(provenListingConflict[0].priceConflict.status, "unresolved", "Conflicting same-listing prices retain deterministic conflict treatment.");
assert.equal(provenListingConflict[0].materialOfferConflicts.condition.length, 2, "Conflicting same-listing material facts remain available.");

const finalForStableIds = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: [exactAcceptedDespiteLegacy, compatibleAcceptedDespiteLegacy]
});
assert.deepEqual(
  legacyRejectedAcceptedView.acceptedEvidenceIds.slice().sort(),
  finalForStableIds.views.acceptedIds.slice().sort(),
  "Recovery-view stable IDs must equal final evidence IDs for unchanged observations."
);

const correctedOfferObservations = [
  observation({
    sourceRecordId: "corrected-offer-a",
    destinationUrl: "https://direct.example/product/corrected-offer-a"
  }),
  observation({
    sourceRecordId: "corrected-offer-b",
    destinationUrl: "https://direct.example/product/corrected-offer-b",
    price: 6.25
  })
];
const correctedRecoveryView = createCanonicalRecoveryView({
  observations: correctedOfferObservations,
  targetIdentity
});
const correctedFinalResult = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: correctedOfferObservations
});
assert.equal(correctedRecoveryView.deduplicatedAcceptedCount, 2);
assert.equal(correctedRecoveryView.distinctQualifyingRetailerDomains.length, 1);
assert.equal(correctedRecoveryView.additionalPriceRecoveryNeeded, false, "Recovery sufficiency must count the two distinct offers rather than a false barcode-level duplicate.");
assert.equal(correctedFinalResult.customerEvidence.length, 2, "Final customer evidence cannot hide distinct same-barcode offers.");
assert.deepEqual(
  correctedRecoveryView.acceptedEvidenceIds.slice().sort(),
  correctedFinalResult.views.acceptedIds.slice().sort(),
  "Corrected separate-offer IDs remain stable from recovery through finalization."
);
const secondaryAliasOfferObservations = [
  observation({
    sourceRecordId: "secondary-alias-offer-a",
    destinationUrl: "https://direct.example/product/secondary-alias-offer-a",
    quantity: 48,
    packageQuantity: 48,
    price: 5.5
  }),
  observation({
    sourceRecordId: "secondary-alias-offer-b",
    destinationUrl: "https://direct.example/product/secondary-alias-offer-b",
    quantity: 48,
    packageQuantity: 50,
    price: 6.25
  })
];
const secondaryAliasRecovery = createCanonicalRecoveryView({
  observations: secondaryAliasOfferObservations,
  targetIdentity
});
const secondaryAliasFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: secondaryAliasOfferObservations
});
assert.equal(secondaryAliasRecovery.deduplicatedAcceptedCount, 2, "Recovery preserves the corrected two-offer universe.");
assert.equal(secondaryAliasRecovery.distinctQualifyingRetailerCount, 1);
assert.equal(secondaryAliasFinal.customerEvidence.length, 2, "Final customer evidence preserves the corrected two-offer universe.");
assert.deepEqual(
  secondaryAliasRecovery.acceptedEvidenceIds,
  secondaryAliasFinal.views.acceptedIds,
  "Secondary-alias offer IDs remain aligned from recovery through finalization."
);
const sellerUniverseObservations = [
  observation({
    sourceRecordId: "seller-universe-a",
    offerId: "seller-universe-listing",
    seller: "Seller A"
  }),
  observation({
    sourceRecordId: "seller-universe-b",
    offerId: "seller-universe-listing",
    seller: "Seller B"
  }),
  observation({
    sourceRecordId: "seller-universe-missing",
    offerId: "seller-universe-listing",
    seller: ""
  })
];
const sellerUniverseRecovery = createCanonicalRecoveryView({
  observations: sellerUniverseObservations,
  targetIdentity
});
const sellerUniverseFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: sellerUniverseObservations
});
assert.equal(sellerUniverseRecovery.deduplicatedAcceptedCount, 3);
assert.equal(sellerUniverseFinal.customerEvidence.length, 3, "Missing seller cannot collapse two known sellers in final customer evidence.");
const uniqueSellerFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: [
    observation({
      sourceRecordId: "unique-seller-known-final",
      offerId: "unique-seller-final-listing",
      seller: "Seller A"
    }),
    observation({
      sourceRecordId: "unique-seller-missing-final",
      offerId: "unique-seller-final-listing",
      seller: ""
    })
  ]
});
assert.equal(uniqueSellerFinal.customerEvidence.length, 1, "One uniquely resolvable missing seller appears once in final customer evidence.");
const duplicateListingFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: [
    observation({
      sourceRecordId: "final-listing-search",
      offerId: "final-shared-listing",
      provider: "Serper Google Search",
      sourceQuality: "search_snippet"
    }),
    observation({
      sourceRecordId: "final-listing-direct",
      offerId: "final-shared-listing",
      provider: "Direct product page fetch",
      sourceQuality: "direct_product_page",
      directProductPage: true
    })
  ]
});
assert.equal(duplicateListingFinal.customerEvidence.length, 1, "Final customer evidence shows one proven offer observed through multiple passes.");

const deterministicObservations = [
  observation({
    sourceRecordId: "deterministic-a-search",
    offerId: "deterministic-offer-a",
    seller: "Seller A",
    sourceQuality: "search_snippet",
    query: "query z",
    searchPass: "pass z",
    model: "MODEL-A"
  }),
  observation({
    sourceRecordId: "deterministic-a-direct",
    offerId: "deterministic-offer-a",
    sellerName: "Seller A",
    sourceQuality: "direct_product_page",
    directProductPage: true,
    query: "query a",
    searchPass: "pass a",
    model: "",
    snippet: "Direct page observation"
  }),
  observation({
    sourceRecordId: "deterministic-b",
    offerId: "deterministic-offer-b",
    seller: "Seller B",
    destinationUrl: "https://direct.example/product/deterministic-b",
    price: 6.25
  })
];
const deterministicForwardDedupe = dedupeUnderlyingOffers(deterministicObservations);
const deterministicReverseDedupe = dedupeUnderlyingOffers(deterministicObservations.slice().reverse());
assert.deepEqual(
  deterministicReverseDedupe,
  deterministicForwardDedupe,
  "Canonical representative selection, enrichment, provenance, conflicts, and group ordering are input-order independent."
);
const deterministicForwardRecovery = createCanonicalRecoveryView({
  observations: deterministicObservations,
  targetIdentity
});
const deterministicReverseRecovery = createCanonicalRecoveryView({
  observations: deterministicObservations.slice().reverse(),
  targetIdentity
});
assert.deepEqual(
  deterministicReverseRecovery.acceptedEvidenceIds,
  deterministicForwardRecovery.acceptedEvidenceIds,
  "Recovery IDs and order are stable when provider completion order reverses."
);
assert.deepEqual(
  deterministicReverseRecovery.rejectedEvidenceIds,
  deterministicForwardRecovery.rejectedEvidenceIds
);
const deterministicForwardFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: deterministicObservations
});
const deterministicReverseFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: deterministicObservations.slice().reverse()
});
assert.deepEqual(
  deterministicReverseFinal.views,
  deterministicForwardFinal.views,
  "Final canonical evidence views are stable when input order reverses."
);
assert.deepEqual(
  deterministicReverseFinal.customerEvidence,
  deterministicForwardFinal.customerEvidence,
  "Customer-visible evidence ordering and content are stable when input order reverses."
);

function permutations(values) {
  if (values.length <= 1) return [values.slice()];
  return values.flatMap((value, index) => (
    permutations(values.filter((_, candidateIndex) => candidateIndex !== index))
      .map((remainder) => [value, ...remainder])
  ));
}

const threeTiedOffers = [
  observation({
    sourceRecordId: "tied-offer-c",
    offerId: "tied-offer-c",
    seller: "Seller One",
    destinationUrl: "https://direct.example/item/tied-offer-c"
  }),
  observation({
    sourceRecordId: "tied-offer-a",
    offerId: "tied-offer-a",
    seller: "Seller One",
    destinationUrl: "https://direct.example/item/tied-offer-a"
  }),
  observation({
    sourceRecordId: "tied-offer-b",
    offerId: "tied-offer-b",
    seller: "Seller One",
    destinationUrl: "https://direct.example/item/tied-offer-b"
  })
];
const tiedBaselineDedupe = dedupeUnderlyingOffers(threeTiedOffers);
const tiedBaselineRecovery = createCanonicalRecoveryView({
  observations: threeTiedOffers,
  targetIdentity
});
const tiedBaselineFinal = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: threeTiedOffers
});
assert.equal(tiedBaselineFinal.customerEvidence.length, 3);
for (const permutation of permutations(threeTiedOffers)) {
  assert.deepEqual(
    dedupeUnderlyingOffers(permutation),
    tiedBaselineDedupe,
    "Every permutation of three tied offers must preserve canonical offer and evidence-ID order."
  );
  assert.deepEqual(
    createCanonicalRecoveryView({ observations: permutation, targetIdentity }),
    tiedBaselineRecovery,
    "Every permutation of three tied offers must preserve the complete recovery contract, including observations."
  );
  assert.deepEqual(
    createFinalEvidenceResult({
      analysisMode: "retail",
      targetIdentity,
      observations: permutation
    }),
    tiedBaselineFinal,
    "Every permutation of three tied offers must preserve final evidence and customerEvidence order."
  );
}

const volatileTimestampObservations = [
  observation({
    sourceRecordId: "timestamp-b",
    offerId: "timestamp-stable-listing",
    title: "Stable title B",
    fetchedAt: "2026-01-01T00:00:00.000Z",
    observedAt: "2026-01-01T00:00:01.000Z",
    providerCompletedAt: "2026-01-01T00:00:02.000Z",
    enrichedAt: "2026-01-01T00:00:03.000Z"
  }),
  observation({
    sourceRecordId: "timestamp-a",
    offerId: "timestamp-stable-listing",
    title: "Stable title A",
    fetchedAt: "2026-02-01T00:00:00.000Z",
    observedAt: "2026-02-01T00:00:01.000Z",
    providerCompletedAt: "2026-02-01T00:00:02.000Z",
    enrichedAt: "2026-02-01T00:00:03.000Z"
  })
];
const timestampBaseline = dedupeUnderlyingOffers(volatileTimestampObservations);
const swappedTimestamps = volatileTimestampObservations.map((record, index, all) => ({
  ...record,
  fetchedAt: all[1 - index].fetchedAt,
  observedAt: all[1 - index].observedAt,
  providerCompletedAt: all[1 - index].providerCompletedAt,
  enrichedAt: all[1 - index].enrichedAt
}));
const timestampSwapped = dedupeUnderlyingOffers(swappedTimestamps);
for (const field of ["sourceRecordId", "title", "price", "fieldProvenance", "materialOfferConflicts", "underlyingOfferId", "evidenceId"]) {
  assert.deepEqual(timestampSwapped[0][field], timestampBaseline[0][field], `Volatile timestamps cannot change ${field}.`);
}
const comparatorTriple = volatileTimestampObservations.concat(observation({
  sourceRecordId: "timestamp-c",
  offerId: "timestamp-stable-listing",
  title: "Stable title C"
}));
for (const left of comparatorTriple) {
  for (const right of comparatorTriple) {
    assert.equal(
      Math.sign(hooks.compareObservationPreference(left, right))
        + Math.sign(hooks.compareObservationPreference(right, left)),
      0,
      "Representative comparator must be antisymmetric."
    );
  }
}
const sortedComparatorTriple = comparatorTriple.slice().sort(hooks.compareObservationPreference);
assert(hooks.compareObservationPreference(sortedComparatorTriple[0], sortedComparatorTriple[2]) <= 0, "Representative comparator must be transitive.");

const reversedConflictForward = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "reversed-conflict-a",
    offerId: "reversed-conflict-listing",
    seller: "Seller One",
    sourceQuality: "search_snippet",
    condition: "New",
    model: "MODEL-A",
    price: 5.5
  }),
  observation({
    sourceRecordId: "reversed-conflict-b",
    offerId: "reversed-conflict-listing",
    seller: "Seller One",
    sourceQuality: "search_snippet",
    condition: "Used",
    model: "MODEL-B",
    price: 6.5
  })
]);
const reversedConflictBackward = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "reversed-conflict-b",
    offerId: "reversed-conflict-listing",
    seller: "Seller One",
    sourceQuality: "search_snippet",
    condition: "Used",
    model: "MODEL-B",
    price: 6.5
  }),
  observation({
    sourceRecordId: "reversed-conflict-a",
    offerId: "reversed-conflict-listing",
    seller: "Seller One",
    sourceQuality: "search_snippet",
    condition: "New",
    model: "MODEL-A",
    price: 5.5
  })
]);
assert.deepEqual(
  reversedConflictBackward,
  reversedConflictForward,
  "Reversing conflicting observations cannot change price conflict, material conflict, or provenance ordering."
);
const repeatedConflictDedupe = dedupeUnderlyingOffers([
  observation({
    sourceRecordId: "duplicate-conflict-a",
    offerId: "duplicate-conflict-listing",
    condition: "New"
  }),
  observation({
    sourceRecordId: "duplicate-conflict-b",
    offerId: "duplicate-conflict-listing",
    condition: "Used"
  }),
  observation({
    sourceRecordId: "duplicate-conflict-b",
    offerId: "duplicate-conflict-listing",
    condition: "Used"
  })
]);
assert.equal(repeatedConflictDedupe[0].materialOfferConflicts.condition.length, 2, "Identical conflict entries must deduplicate.");
assert.equal(repeatedConflictDedupe[0].observationProvenance.length, 2, "Identical observation provenance must deduplicate.");

const recoveryRequestRecords = [];
recoveryRequestRecords.canonicalRecoveryDecisionView = exactNoPriceView;
recoveryRequestRecords.canonicalRecoveryStoppingView = exactNoPriceView;
const recoveryDiagnostics = hooks.buildRetailSearchDiagnostics({
  context: {
    ...targetIdentity,
    retailEvidenceMode: "current-retail-only",
    itemType: "security envelopes",
    productTitle: "Cedarline Security Envelopes",
    brand: "Cedarline",
    barcodeDigits: targetIdentity.upc,
    packageQuantity: targetIdentity.quantity,
    packageSize: targetIdentity.dimensions
  },
  providerRequestRecords: recoveryRequestRecords,
  records: [exactNoPrice],
  searchQueries: []
});
assert.deepEqual(
  recoveryDiagnostics.recoveryAssessment.decisionSupportIds,
  recoveryDiagnostics.recoveryAssessment.recoveryTriggeringSupportIds,
  "Recovery diagnostic support IDs must be the exact IDs used by the recovery decision."
);

const enrichedContext = {
  retailEvidenceMode: "current-retail-only",
  itemType: "security envelopes",
  categoryPhrase: "security envelopes",
  productTitle: "Cedarline Security Envelopes 48 Count",
  exactProductIdentity: "Cedarline Security Envelopes",
  brand: "Cedarline",
  barcodeDigits: targetIdentity.upc,
  barcodeIdentitySet: [targetIdentity.upc],
  packageQuantity: 48,
  packageSize: targetIdentity.dimensions,
  retailerSpecificTargets: []
};
const enrichedTargetRecord = observation({
  retailer: "Target",
  retailerDomain: "target.com",
  sourceDomain: "target.com",
  destinationUrl: "https://www.target.com/p/cedarline-security-envelopes-48"
});
const enrichedTargetView = hooks.buildCanonicalRecoveryViewForRecords([enrichedTargetRecord], {
  identity: enrichedContext,
  context: enrichedContext,
  providerRequestRecords: []
});
const targetQueries = hooks.buildLimitedResultRetailRecoveryQueries(
  enrichedContext,
  [],
  [enrichedTargetRecord],
  enrichedTargetView
);
assert(targetQueries.every((record) => !record.marketplaceDomains.includes("target.com")), "Enriched accepted retailer domains must be excluded from recovery target selection.");
assert.equal(hooks.shouldRunLimitedResultRetailRecovery({
  context: enrichedContext,
  identity: enrichedContext,
  records: [exactAcceptedDespiteLegacy, compatibleAcceptedDespiteLegacy],
  providerRequestRecords: [],
  recoveryView: legacyRejectedAcceptedView
}), false, "The same enriched canonical view must stop unnecessary recovery.");

const retryQuery = {
  query: "Cedarline security envelopes current price",
  searchPass: "open_web_exact",
  validationPassed: true
};
const retryRecord = hooks.createSerperRequestRecord(retryQuery);
const retryBudget = hooks.createPhysicalAttemptBudget(2, "provider_search");
let retryAdapterCalls = 0;
const retryResponse = await hooks.requestSerperSearchWithBudget({
  requestRecord: retryRecord,
  queryRecord: retryQuery,
  attemptBudget: retryBudget,
  apiKey: "test-only-redacted",
  maxRetries: 1,
  requestAdapter: async () => {
    retryAdapterCalls += 1;
    if (retryAdapterCalls === 1) throw new Error("deterministic retry");
    return { json: { organic: [] }, statusCode: 200, elapsedMs: 1 };
  }
});
assert.equal(retryResponse.statusCode, 200);
assert.equal(retryAdapterCalls, 2);
assert.equal(retryRecord.logicalQueryAttempted, true);
assert.equal(retryRecord.physicalAttemptCount, 2);
assert.equal(retryRecord.physicalRetryAttemptCount, 1);

for (const ceiling of [28, 12]) {
  const cappedRecord = hooks.createSerperRequestRecord(retryQuery);
  const cappedBudget = hooks.createPhysicalAttemptBudget(ceiling, "provider_search");
  cappedBudget.physicalAttemptCount = ceiling - 1;
  let cappedAdapterCalls = 0;
  await assert.rejects(
    hooks.requestSerperSearchWithBudget({
      requestRecord: cappedRecord,
      queryRecord: retryQuery,
      attemptBudget: cappedBudget,
      apiKey: "test-only-redacted",
      maxRetries: 1,
      requestAdapter: async () => {
        cappedAdapterCalls += 1;
        throw new Error("deterministic failure");
      }
    }),
    /budget was exhausted/i
  );
  assert.equal(cappedAdapterCalls, 1, `Retry must not exceed the ${ceiling}-attempt ceiling.`);
  assert.equal(cappedBudget.physicalAttemptCount, ceiling);
}

function openAIRequestRecord() {
  return {
    query: "Cedarline security envelopes current price",
    provider: "OpenAI web_search",
    providerKey: "openai_web_search",
    providerEndpoint: "openai_web_search",
    logicalQueryAttempted: false,
    attempted: false,
    physicalAttemptCount: 0,
    physicalRetryAttemptCount: 0,
    physicalAttempts: []
  };
}

const oneOpenAIBudget = hooks.createPhysicalAttemptBudget(28, "provider_search");
const oneOpenAIRecord = openAIRequestRecord();
let oneOpenAIAdapterCalls = 0;
await hooks.requestOpenAIComparableSearchWithBudget({
  requestRecord: oneOpenAIRecord,
  attemptBudget: oneOpenAIBudget,
  apiKey: "test-only-redacted",
  buildPayload: () => ({ model: "offline-test" }),
  requestAdapter: async () => {
    oneOpenAIAdapterCalls += 1;
    return { json: {}, data: {}, statusCode: 200 };
  }
});
assert.equal(oneOpenAIAdapterCalls, 1);
assert.equal(oneOpenAIRecord.logicalQueryAttempted, true);
assert.equal(oneOpenAIRecord.physicalAttemptCount, 1);
assert.equal(oneOpenAIRecord.physicalRetryAttemptCount, 0);
assert.equal(oneOpenAIRecord.physicalAttempts[0].provider, "openai_web_search");
assert.equal(oneOpenAIRecord.physicalAttempts[0].outcome, "succeeded");

const retryOpenAIBudget = hooks.createPhysicalAttemptBudget(28, "provider_search");
const retryOpenAIRecord = openAIRequestRecord();
let retryOpenAIAdapterCalls = 0;
await hooks.requestOpenAIComparableSearchWithBudget({
  requestRecord: retryOpenAIRecord,
  attemptBudget: retryOpenAIBudget,
  apiKey: "test-only-redacted",
  buildPayload: ({ retry }) => ({ retry }),
  requestAdapter: async () => {
    retryOpenAIAdapterCalls += 1;
    if (retryOpenAIAdapterCalls === 1) {
      throw Object.assign(new Error("unknown parameter include"), {
        openAIErrorCode: "invalid_include"
      });
    }
    return { json: {}, data: {}, statusCode: 200 };
  }
});
assert.equal(retryOpenAIAdapterCalls, 2);
assert.equal(retryOpenAIRecord.logicalQueryAttempted, true);
assert.equal(retryOpenAIRecord.physicalAttemptCount, 2);
assert.equal(retryOpenAIRecord.physicalRetryAttemptCount, 1);
assert.deepEqual(retryOpenAIRecord.physicalAttempts.map((attempt) => attempt.outcome), ["failed", "succeeded"]);

for (const ceiling of [28, 12]) {
  const nearlyExhaustedBudget = hooks.createPhysicalAttemptBudget(ceiling, "provider_search");
  nearlyExhaustedBudget.physicalAttemptCount = ceiling - 1;
  const nearlyExhaustedRecord = openAIRequestRecord();
  let nearlyExhaustedCalls = 0;
  await assert.rejects(
    hooks.requestOpenAIComparableSearchWithBudget({
      requestRecord: nearlyExhaustedRecord,
      attemptBudget: nearlyExhaustedBudget,
      apiKey: "test-only-redacted",
      buildPayload: () => ({ model: "offline-test" }),
      requestAdapter: async () => {
        nearlyExhaustedCalls += 1;
        throw new Error("unsupported include compatibility option");
      }
    }),
    /budget was exhausted/i
  );
  assert.equal(nearlyExhaustedCalls, 1, `Only attempt ${ceiling} may reach the OpenAI fallback adapter.`);
  assert.equal(nearlyExhaustedBudget.physicalAttemptCount, ceiling);
  assert.equal(nearlyExhaustedRecord.physicalAttemptCount, 1);
  assert.equal(nearlyExhaustedRecord.physicalRetryAttemptCount, 0, "A denied retry is not a physical attempt.");

  const exhaustedBudget = hooks.createPhysicalAttemptBudget(ceiling, "provider_search");
  exhaustedBudget.physicalAttemptCount = ceiling;
  const exhaustedRecord = openAIRequestRecord();
  let exhaustedCalls = 0;
  await assert.rejects(
    hooks.requestOpenAIComparableSearchWithBudget({
      requestRecord: exhaustedRecord,
      attemptBudget: exhaustedBudget,
      apiKey: "test-only-redacted",
      buildPayload: () => ({ model: "offline-test" }),
      requestAdapter: async () => {
        exhaustedCalls += 1;
        return { json: {}, data: {}, statusCode: 200 };
      }
    }),
    /budget was exhausted/i
  );
  assert.equal(exhaustedCalls, 0, `No OpenAI adapter call may occur after the ${ceiling}-attempt ceiling.`);
  assert.equal(exhaustedBudget.physicalAttemptCount, ceiling, "An exhausted-budget diagnostic cannot increment the physical count.");
  assert.equal(exhaustedRecord.physicalAttemptCount, 0);
}

const sharedProviderBudget = hooks.createPhysicalAttemptBudget(28, "provider_search");
const sharedSerperRecord = hooks.createSerperRequestRecord(retryQuery);
await hooks.requestSerperSearchWithBudget({
  requestRecord: sharedSerperRecord,
  queryRecord: retryQuery,
  attemptBudget: sharedProviderBudget,
  apiKey: "test-only-redacted",
  maxRetries: 0,
  requestAdapter: async () => ({ json: { organic: [] }, statusCode: 200, elapsedMs: 1 })
});
const sharedOpenAIRecord = openAIRequestRecord();
await hooks.requestOpenAIComparableSearchWithBudget({
  requestRecord: sharedOpenAIRecord,
  attemptBudget: sharedProviderBudget,
  apiKey: "test-only-redacted",
  buildPayload: () => ({ model: "offline-test" }),
  requestAdapter: async () => ({ json: {}, data: {}, statusCode: 200 })
});
const sharedAccounting = hooks.buildProviderAttemptAccounting(
  [sharedSerperRecord, sharedOpenAIRecord],
  { maximumPhysicalProviderAttempts: 28 }
);
assert.equal(sharedAccounting.logicalProviderQueryCount, 2);
assert.equal(sharedAccounting.physicalProviderAttemptCount, 2);
assert.deepEqual(
  [sharedSerperRecord, sharedOpenAIRecord].flatMap((record) => record.physicalAttempts.map((attempt) => attempt.provider)),
  ["serper_google", "openai_web_search"],
  "Serper and OpenAI fallback attempts must appear in one provider-search accounting universe."
);
const unrelatedOpenAIBudget = hooks.createPhysicalAttemptBudget(28, "provider_search");
let unrelatedOpenAICalls = 0;
await (async () => {
  unrelatedOpenAICalls += 1;
  return { purpose: "non-search orchestration" };
})();
assert.equal(unrelatedOpenAICalls, 1);
assert.equal(unrelatedOpenAIBudget.physicalAttemptCount, 0, "Non-search OpenAI orchestration is outside the comparable-search meter.");

const exhaustedProviderBudget = hooks.createPhysicalAttemptBudget(1, "provider_search");
const exhaustedProviderRecord = hooks.createSerperRequestRecord(retryQuery);
assert.equal(hooks.consumePhysicalAttempt(exhaustedProviderBudget, exhaustedProviderRecord), true);
assert.equal(hooks.consumePhysicalAttempt(exhaustedProviderBudget, exhaustedProviderRecord, { retry: true }), false);
const exhaustedDirectBudget = hooks.createPhysicalAttemptBudget(hooks.directPageEnrichmentMaxAttempts, "direct_page_enrichment");
const directRecord = {};
assert.equal(hooks.consumePhysicalAttempt(exhaustedDirectBudget, directRecord), true);
assert.equal(hooks.consumePhysicalAttempt(exhaustedDirectBudget, directRecord), true);
assert.equal(hooks.consumePhysicalAttempt(exhaustedDirectBudget, directRecord), false, "No direct-page attempt may occur after the independent cap is exhausted.");

const productionRecoveryRequestRecords = [];
const productionRecoveryResponseSummaries = [];
const productionRecoveryErrors = [];
const productionProviderBudget = hooks.createPhysicalAttemptBudget(28, "provider_search");
const productionDirectBudget = hooks.createPhysicalAttemptBudget(2, "direct_page_enrichment");
let productionDirectAdapterCalls = 0;
const productionRecoveryQueries = [];
await hooks.executeLimitedResultRetailRecovery({
  serperApiKey: "test-only-redacted",
  context: enrichedContext,
  identity: enrichedContext,
  providerRequestRecords: productionRecoveryRequestRecords,
  providerResponseSummaries: productionRecoveryResponseSummaries,
  providerErrors: productionRecoveryErrors,
  rawProviderRecords: [],
  currentRecords: [
    observation({
      sourceRecordId: "production-enrichment-source",
      retailer: "Target",
      retailerDomain: "target.com",
      sourceDomain: "target.com",
      destinationUrl: "https://www.target.com/p/cedarline-security-envelopes-48",
      query: "012345678905 Cedarline security envelopes",
      searchPass: "stage_1_exact_identity",
      rawText: "Cedarline security envelopes 48 count UPC 012345678905",
      price: null,
      parsedPrice: null,
      displayedPrice: "Price unavailable",
      priceType: "Price unavailable"
    })
  ],
  providerAttemptBudget: productionProviderBudget,
  directPageAttemptBudget: productionDirectBudget,
  directPageRequestAdapter: async (url) => {
    productionDirectAdapterCalls += 1;
    return {
      finalUrl: url,
      statusCode: 200,
      elapsedMs: 1,
      html: "<html><head><title>Cedarline Security Envelopes 48 Count</title></head><body>UPC 012345678905 Price $5.50 In stock</body></html>",
      sourceEvidenceText: "Cedarline Security Envelopes 48 Count UPC 012345678905 Price $5.50 In stock"
    };
  },
  serperRequestAdapter: async ({ query }) => {
    productionRecoveryQueries.push(query);
    return { json: { organic: [] }, statusCode: 200, elapsedMs: 1 };
  }
});
assert.equal(productionDirectAdapterCalls, 1, "The production enrichment path must invoke its injected direct-page adapter.");
assert(productionRecoveryQueries.length > 0, "The production path must continue into bounded recovery after one enriched offer.");
assert(
  productionRecoveryQueries.every((query) => !/target\.com/i.test(query)),
  "Recovery targeting must consume the enrichment-produced canonical view and exclude its accepted retailer domain."
);
assert.equal(productionDirectBudget.physicalAttemptCount, 1);
assert.equal(productionProviderBudget.physicalAttemptCount, productionRecoveryQueries.length);
assert.notEqual(
  productionDirectBudget,
  productionProviderBudget,
  "Direct-page and provider-search attempts must remain in independent budget categories."
);

const threePageCandidates = ["c", "a", "b"].map((suffix) => ({
  ...enrichedTargetRecord,
  sourceRecordId: `three-page-${suffix}`,
  query: "012345678905 Cedarline security envelopes",
  searchPass: "stage_1_exact_identity",
  rawText: "Cedarline security envelopes 48 count UPC 012345678905",
  destinationUrl: `https://www.target.com/p/cedarline-security-envelopes-48?offer=${suffix}`,
  url: `https://www.target.com/p/cedarline-security-envelopes-48?offer=${suffix}`,
  canonicalUrl: `https://www.target.com/p/cedarline-security-envelopes-48?offer=${suffix}`,
  price: null,
  parsedPrice: null,
  displayedPrice: "Price unavailable",
  priceType: "Price unavailable"
}));
let selectedPageBaseline = null;
for (const permutation of permutations(threePageCandidates)) {
  const selectedPages = [];
  const pageBudget = hooks.createPhysicalAttemptBudget(2, "direct_page_enrichment");
  await hooks.executeExactRetailPageDirectEnrichment({
    context: enrichedContext,
    currentRecords: permutation,
    providerRequestRecords: [],
    providerResponseSummaries: [],
    providerErrors: [],
    directPageAttemptBudget: pageBudget,
    requestAdapter: async (url) => {
      selectedPages.push(url);
      return {
        finalUrl: url,
        statusCode: 200,
        elapsedMs: 1,
        sourceEvidenceText: "Cedarline Security Envelopes 48 Count UPC 012345678905 Price $5.50 In stock"
      };
    }
  });
  selectedPageBaseline ??= selectedPages;
  assert.deepEqual(selectedPages, selectedPageBaseline, "All six input permutations must select the same two qualified pages.");
  assert.equal(selectedPages.length, 2, "The direct-page ceiling remains exactly two physical fetches.");
  assert.equal(pageBudget.physicalAttemptCount, 2);
}

const deniedFetch = globalThis.fetch;
let redirectFetchInvocations = 0;
globalThis.fetch = async (url) => {
  redirectFetchInvocations += 1;
  if (redirectFetchInvocations === 1) {
    return new Response("", {
      status: 302,
      headers: { location: "https://www.target.com/p/final-envelope-page" }
    });
  }
  return new Response("<html><body>Cedarline Security Envelopes 48 Count UPC 012345678905 Price $5.50</body></html>", {
    status: 200,
    headers: { "content-type": "text/html" }
  });
};
const redirectBudget = hooks.createPhysicalAttemptBudget(2, "direct_page_enrichment");
const redirectRequestRecord = {
  provider: "Direct product page fetch",
  providerKey: "direct_product_page_fetch",
  physicalAttemptCount: 0,
  physicalRetryAttemptCount: 0,
  physicalAttempts: []
};
const redirectResult = await hooks.requestBoundedRetailProductPageNetwork(
  "https://www.target.com/p/starting-envelope-page",
  enrichedContext,
  enrichedTargetRecord,
  {
    attemptBudget: redirectBudget,
    requestRecord: redirectRequestRecord,
    initialAttemptReserved: false
  }
);
assert.equal(redirectResult.statusCode, 200);
assert.equal(redirectFetchInvocations, 2, "One real redirect path consumes exactly two injected fetch invocations.");
assert.equal(redirectBudget.physicalAttemptCount, 2);
await assert.rejects(
  hooks.requestBoundedRetailProductPageNetwork(
    "https://www.target.com/p/third-envelope-page",
    enrichedContext,
    enrichedTargetRecord,
    {
      attemptBudget: redirectBudget,
      requestRecord: redirectRequestRecord,
      initialAttemptReserved: false
    }
  ),
  /budget was exhausted/i
);
assert.equal(redirectFetchInvocations, 2, "A third direct-page fetch cannot occur after the independent ceiling.");
globalThis.fetch = deniedFetch;

for (const purpose of ["personal", "resale", "owner_value", "seller_listing"]) {
  const purposeResult = createFinalEvidenceResult({
    analysisMode: "retail",
    purpose,
    targetIdentity,
    observations: [exactAcceptedDespiteLegacy]
  });
  assert.equal(purposeResult.customerEvidence.length, 1, `${purpose} must retain canonical customer evidence.`);
}

const rejectedLeakResult = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: [exactAcceptedDespiteLegacy, category],
  askingPrice: 5.5
});
const rejectedIds = new Set(rejectedLeakResult.views.rejectedDiagnosticOnlyIds);
for (const ids of [
  rejectedLeakResult.views.customerEligibleIds,
  rejectedLeakResult.views.rangeEligibleIds,
  rejectedLeakResult.views.decisionEligibleIds,
  rejectedLeakResult.decisionResult.supportingEvidenceIds,
  rejectedLeakResult.badgeResult.supportingEvidenceIds,
  rejectedLeakResult.buyerOfferResult.supportingEvidenceIds
]) {
  assert(ids.every((id) => !rejectedIds.has(id)), "Rejected evidence cannot leak into customer or business-support views.");
}

const apiSource = fs.readFileSync(path.join(root, "api", "generate-listing.js"), "utf8");
assert.equal((apiSource.match(/createFinalEvidenceResult\s*\(/g) || []).length, 1);
assert.equal((apiSource.match(/assembleFinalEvidence\s*\(/g) || []).length, 0);
assert(!apiSource.includes("buildFinalRetailCustomerEvidenceSnapshot"));
assert(!/buildLimitedResultRetailRecoveryQueries\(context,\s*providerRequestRecords,\s*currentRecords/.test(apiSource), "Recovery targeting must not receive the stale currentRecords collection.");
assert(/pricesFound:\s*customerEvidence/.test(apiSource), "pricesFound must remain a compatibility alias of customerEvidence.");
assert.equal(Object.keys(rejectedLeakResult).filter((key) => key === "customerEvidence").length, 1, "Final output must retain one canonical customerEvidence field.");
assert.equal(unexpectedNetworkAttempts, 0);

console.log("canonical-recovery-alignment: PASS");
