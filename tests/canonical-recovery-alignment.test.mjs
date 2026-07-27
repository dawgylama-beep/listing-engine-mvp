import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createCanonicalRecoveryView,
  createFinalEvidenceResult
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

const exhaustedProviderBudget = hooks.createPhysicalAttemptBudget(1, "provider_search");
const exhaustedProviderRecord = hooks.createSerperRequestRecord(retryQuery);
assert.equal(hooks.consumePhysicalAttempt(exhaustedProviderBudget, exhaustedProviderRecord), true);
assert.equal(hooks.consumePhysicalAttempt(exhaustedProviderBudget, exhaustedProviderRecord, { retry: true }), false);
const exhaustedDirectBudget = hooks.createPhysicalAttemptBudget(hooks.directPageEnrichmentMaxAttempts, "direct_page_enrichment");
const directRecord = {};
assert.equal(hooks.consumePhysicalAttempt(exhaustedDirectBudget, directRecord), true);
assert.equal(hooks.consumePhysicalAttempt(exhaustedDirectBudget, directRecord), true);
assert.equal(hooks.consumePhysicalAttempt(exhaustedDirectBudget, directRecord), false, "No direct-page attempt may occur after the independent cap is exhausted.");

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
