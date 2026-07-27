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
  ["dimensions", "6 x 9 inches"],
  ["designIdentity", "different closure design"],
  ["shipping", 4.99],
  ["deliveredCost", 10.49],
  ["sourceQuality", "direct_product_page"],
  ["directPageProvenance", "redirected_final_page"],
  ["condition", "Used"],
  ["quantity", 50],
  ["listingStatus", "sold"],
  ["seller", "Different Seller"],
  ["price", 6.5]
]) {
  const records = hooks.coalesceIdenticalSerperTransportRecords([
    observation({ sourceQuality: "search_snippet", directPageProvenance: "provider_search" }),
    observation({ sourceQuality: "search_snippet", directPageProvenance: "provider_search", [field]: changedValue })
  ]);
  assert.equal(records.length, 2, `Transport observations differing only in ${field} must remain separate.`);
}
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
