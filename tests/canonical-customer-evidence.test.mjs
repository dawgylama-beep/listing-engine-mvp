import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalEvidenceResult,
  validateCustomerEvidenceCompatibilityProjection,
  validateFinalEvidenceResult
} from "../lib/evidence/index.js";

function observation({
  id,
  retailer,
  url,
  title,
  price = null,
  priceType = "Price unavailable",
  exact = false,
  strong = false,
  pageType = "product",
  quantity = 12,
  sourceQuality = "search_snippet",
  sourceChannel = ""
}) {
  return {
    sourceRecordId: id,
    destinationUrl: url,
    originalUrl: url,
    retailer,
    marketplace: retailer,
    sourceDomain: new URL(url).hostname,
    title,
    upc: "012345678905",
    quantity,
    exactIdentity: exact,
    identityMatchStrength: exact ? "Exact" : strong ? "Strong" : "Partial",
    pageType,
    price,
    priceType,
    sourceQuality,
    sourceChannel,
    dimensions: "4 x 6 inches",
    packageType: "test package"
  };
}

function completeFixture(displayLimit = 20) {
  const sameUrl = "https://alpha.example/p/exact-012345678905";
  return createFinalEvidenceResult({
    analysisId: `customer-contract-${displayLimit}`,
    analysisMode: "collectible",
    targetIdentity: {
      upc: "012345678905",
      quantity: 12,
      dimensions: "4 x 6 inches",
      packageType: "test package"
    },
    observations: [
      observation({
        id: "same-url-snippet",
        retailer: "Alpha",
        url: sameUrl,
        title: "Exact Test Product 12 Count",
        price: 8,
        priceType: "Current retail price",
        exact: true
      }),
      observation({
        id: "same-url-direct",
        retailer: "Alpha",
        url: sameUrl,
        title: "Exact Test Product 12 Count",
        price: 8,
        priceType: "Current retail price",
        exact: true,
        sourceQuality: "direct_product_page"
      }),
      observation({
        id: "cross-retailer",
        retailer: "Beta",
        url: "https://beta.example/p/exact-012345678905",
        title: "Exact Test Product 12 Count",
        price: 9,
        priceType: "Current retail price",
        exact: true
      }),
      observation({
        id: "exact-no-price",
        retailer: "Reference House",
        url: "https://reference.example/item/exact-012345678905",
        title: "Exact Test Product identity page",
        priceType: "Reference/archive",
        exact: true,
        sourceChannel: "conventional_retail"
      }),
      observation({
        id: "compatible-ask",
        retailer: "Market One",
        url: "https://market-one.example/item/compatible-ask",
        title: "Compatible Test Product 12 Count",
        price: 11,
        priceType: "Active asking price",
        strong: true
      }),
      observation({
        id: "auction-bid",
        retailer: "Auction One",
        url: "https://auction-one.example/lot/exact-bid",
        title: "Exact Test Product current auction",
        price: 6,
        priceType: "Current bid",
        exact: true,
        pageType: "auction"
      }),
      observation({
        id: "verified-sold",
        retailer: "Sold Archive",
        url: "https://sold.example/item/exact-sold",
        title: "Exact Test Product verified sold",
        price: 10,
        priceType: "Verified sold",
        exact: true
      }),
      observation({
        id: "generic-category",
        retailer: "Category",
        url: "https://category.example/search?q=test-product",
        title: "Test products category",
        price: 1,
        priceType: "Active asking price",
        pageType: "category"
      }),
      observation({
        id: "social",
        retailer: "Social",
        url: "https://instagram.com/p/test-product",
        title: "Social post about a test product",
        price: 2,
        priceType: "Active asking price",
        pageType: "social"
      })
    ],
    displayLimit,
    askingPrice: 15,
    purpose: "personal",
    decisionContext: {
      purchaseContext: "private_seller",
      purchaseIntent: "personal_use"
    }
  });
}

test("canonical customer evidence is one ordered projection of displayedIds", () => {
  const result = completeFixture();
  validateFinalEvidenceResult(result);

  assert.deepEqual(
    result.customerEvidence.map((record) => record.evidenceId),
    result.views.displayedIds
  );
  assert.equal(
    result.customerEvidence.filter((record) => record.canonicalUrl === "https://alpha.example/p/exact-012345678905").length,
    1,
    "same canonical offer must serialize once"
  );
  assert.equal(result.customerEvidenceSummary.displayedCountByRetailer.Alpha, 1);
  assert.equal(result.customerEvidenceSummary.displayedCountByRetailer.Beta, 1);
  assert.equal(result.customerEvidenceSummary.counts.displayed, result.customerEvidence.length);
  assert.deepEqual(result.diagnostics.canonicalCustomerEvidenceIds, result.views.displayedIds);
  assert.deepEqual(
    result.diagnostics.canonicalDisplayedCountByRetailer,
    result.customerEvidenceSummary.displayedCountByRetailer
  );
});

test("exact no-price, classification, price type, and field associations remain canonical", () => {
  const result = completeFixture();
  const noPrice = result.customerEvidence.find((record) => record.title.includes("identity page"));
  assert(noPrice);
  assert.equal(noPrice.canonicalMatchLabel, "Exact");
  assert.equal(noPrice.canonicalPrice, null);
  assert.equal(noPrice.customerPriceLabel, "Price unavailable");
  assert.equal(noPrice.canonicalPriceType, "Reference/archive");
  assert.equal(noPrice.destinationUrl, "https://reference.example/item/exact-012345678905");

  const compatible = result.customerEvidence.find((record) => record.title.startsWith("Compatible"));
  assert.equal(compatible.canonicalMatchLabel, "Strong compatible");
  assert.equal(compatible.canonicalPriceType, "Active asking price");
  assert.equal(compatible.sourceLabel, "Market One");
  assert.equal(compatible.canonicalPrice, 11);
  assert.equal(compatible.quantity, 12);

  const bid = result.customerEvidence.find((record) => record.sourceLabel === "Auction One");
  assert.equal(bid.canonicalPriceType, "Current bid");
  const sold = result.customerEvidence.find((record) => record.sourceLabel === "Sold Archive");
  assert.equal(sold.canonicalPriceType, "Verified sold");
});

test("generic, social, and rejected records stay diagnostic-only", () => {
  const result = completeFixture();
  const customerIds = new Set(result.customerEvidence.map((record) => record.evidenceId));
  const rejectedText = JSON.stringify(result.rejectedRecords);
  assert.match(rejectedText, /generic-category|social|category|instagram/i);
  result.views.rejectedDiagnosticOnlyIds.forEach((id) => assert(!customerIds.has(id)));
});

test("presentation truncation changes only displayed membership", () => {
  const full = completeFixture(20);
  const truncated = completeFixture(2);
  assert.deepEqual(truncated.customerEvidence.map((record) => record.evidenceId), truncated.views.displayedIds);
  assert.equal(truncated.customerEvidence.length, 2);
  assert.deepEqual(truncated.rangeResult, full.rangeResult);
  assert.deepEqual(truncated.rangeResults, full.rangeResults);
  assert.deepEqual(truncated.retailLimitResult, full.retailLimitResult);
  assert.deepEqual(truncated.decisionResult, full.decisionResult);
  assert.deepEqual(truncated.confidenceResult, full.confidenceResult);
  assert.deepEqual(truncated.badgeResult, full.badgeResult);
  assert.deepEqual(truncated.buyerOfferResult, full.buyerOfferResult);
});

test("deprecated pricesFound is an exact canonical projection and removed aliases fail validation", () => {
  const result = completeFixture();
  const first = result.customerEvidence[0];
  const report = {
    pricesFound: structuredClone(result.customerEvidence)
  };
  assert.equal(validateCustomerEvidenceCompatibilityProjection(result.customerEvidence, report), report);

  assert.throws(
    () => validateCustomerEvidenceCompatibilityProjection(result.customerEvidence, {
      pricesFound: [{ ...first, sourceLabel: "Wrong Retailer" }, ...result.customerEvidence.slice(1)]
    }),
    new RegExp(`pricesFound fields conflict with canonical customerEvidence record ${first.evidenceId}`)
  );
  assert.throws(
    () => validateCustomerEvidenceCompatibilityProjection(result.customerEvidence, {
      pricesFound: [{ ...first, evidenceId: "fake-evidence-id" }, ...result.customerEvidence.slice(1)]
    }),
    /pricesFound contains unknown evidence ID fake-evidence-id/
  );
  assert.throws(
    () => validateCustomerEvidenceCompatibilityProjection(result.customerEvidence, {
      pricesFound: [first, first, ...result.customerEvidence.slice(2)]
    }),
    /pricesFound compatibility projection contains duplicate evidence IDs/
  );
  assert.throws(
    () => validateCustomerEvidenceCompatibilityProjection(result.customerEvidence, {
      pricesFound: result.customerEvidence.slice().reverse()
    }),
    /pricesFound compatibility projection IDs or order do not exactly match customerEvidence/
  );

  for (const field of [
    "bestCompatiblePriceFound",
    "otherCompatiblePricesFound",
    "bestCurrentRetailAlternative",
    "otherCurrentRetailPrices"
  ]) {
    assert.throws(
      () => validateCustomerEvidenceCompatibilityProjection(result.customerEvidence, {
        pricesFound: result.customerEvidence,
        [field]: first
      }),
      new RegExp(`removed legacy evidence field ${field} must not be emitted`)
    );
  }
});

test("validator identifies customer evidence invariant and evidence ID", () => {
  const result = completeFixture();
  const id = result.customerEvidence[0].evidenceId;
  const mutated = structuredClone(result);
  mutated.customerEvidence[0].title = "Conflicting title";
  assert.throws(
    () => validateFinalEvidenceResult(mutated),
    new RegExp(`customerEvidence ${id} title conflicts with canonical record`)
  );
});
