import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalEvidenceResult,
  validateFinalEvidenceResult
} from "../lib/evidence/index.js";
import { priceConflictFixture } from "./fixtures/production-shaped-evidence.mjs";

function offer({
  id,
  url = `https://offers.example/item/${id}`,
  title = "Sanitized exact collector item",
  retailer = "",
  marketplace = "",
  price = null,
  priceType = "Price unavailable",
  exact = true,
  match = exact ? "Exact" : "Strong",
  pageType = "product",
  quantity = null,
  dimensions = "",
  packageType = "",
  designIdentity = "",
  upc = ""
} = {}) {
  return {
    sourceRecordId: id,
    destinationUrl: url,
    title,
    retailer,
    marketplace,
    price,
    priceType,
    exactIdentity: exact,
    ...(exact ? {
      objectMindSourceId: `source:${id}`,
      objectMindClassification: "EXACT_ITEM",
      objectMindVerificationState: "VERIFIED",
      objectMindSupportingAttributes: [{ attribute: "synthetic_identity", status: "SUPPORTED" }],
      objectMindConflictingAttributes: []
    } : {}),
    identityMatchStrength: match,
    pageType,
    quantity,
    dimensions,
    packageType,
    designIdentity,
    upc
  };
}

function createResult(options = {}) {
  const result = createFinalEvidenceResult(options);
  validateFinalEvidenceResult(result);
  return result;
}

function supportRecords(result, support) {
  const records = new Map(result.records.map((record) => [record.evidenceId, record]));
  return support.evidenceIds.map((id) => records.get(id));
}

test("one active asking offer is one observation and never a numerical range", () => {
  const observations = [
    offer({ id: "identity-1", url: "https://archive-one.example/item/exact", price: null }),
    offer({ id: "identity-2", url: "https://archive-two.example/item/exact", price: null }),
    offer({
      id: "asking-1",
      url: "https://market.example/item/asking-1",
      marketplace: "market.example",
      price: 24.99,
      priceType: "Active asking price"
    })
  ];
  const result = createResult({
    analysisId: "single-active-asking",
    analysisMode: "collectible",
    observations
  });

  assert.equal(result.rangeResult.status, "single_observation");
  assert.equal(result.rangeResult.priceType, "active_asking");
  assert.equal(result.rangeResult.observedPrice, 24.99);
  assert.equal(result.rangeResult.low, null);
  assert.equal(result.rangeResult.high, null);
  assert.equal(result.rangeResult.evidenceIds.length, 1);
  assert.equal(result.rangeResult.underlyingOfferIds.length, 1);
  assert.equal(result.rangeResults.verifiedSold.status, "insufficient");
  assert.equal(result.rangeResults.currentRetail.status, "insufficient");
  assert.equal(result.views.exactMatchIds.length, 3);
});

test("zero priced offers retain identity but expose neither a range nor an observed price", () => {
  const result = createResult({
    analysisId: "zero-priced",
    analysisMode: "collectible",
    observations: [
      offer({ id: "identity-1", url: "https://archive-one.example/item/no-price", price: null }),
      offer({ id: "identity-2", url: "https://archive-two.example/item/no-price", price: null })
    ]
  });

  assert.equal(result.rangeResult.status, "insufficient");
  assert.equal(result.rangeResult.low, null);
  assert.equal(result.rangeResult.high, null);
  assert.equal(result.rangeResult.observedPrice, null);
  assert.equal(result.rangeResult.evidenceIds.length, 0);
  assert.match(result.rangeResult.insufficiencyReason, /no eligible priced/i);
  assert.equal(result.views.exactMatchIds.length, 2);
  assert(result.acceptedRecords.every((record) => record.displayedPrice === "Price unavailable"));
});

test("duplicate observations of one offer count once and remain traceable", () => {
  const sharedUrl = "https://market.example/item/duplicate-offer?utm_source=first";
  const result = createResult({
    analysisId: "duplicate-offer",
    analysisMode: "collectible",
    observations: [
      offer({ id: "duplicate-a", url: sharedUrl, price: 18, priceType: "Active asking price" }),
      offer({ id: "duplicate-b", url: sharedUrl.replace("first", "second"), price: 18, priceType: "Active asking price" }),
      offer({ id: "duplicate-c", url: sharedUrl.replace("first", "third"), price: 18, priceType: "Active asking price" })
    ]
  });

  assert.equal(result.acceptedRecords.length, 1);
  assert.equal(result.rangeResult.status, "single_observation");
  assert.equal(result.rangeResult.independentOfferCount, 1);
  assert.equal(result.rangeResult.evidenceIds.length, 1);
  assert.equal(result.acceptedRecords[0].observationIds.length, 3);
  assert.deepEqual(new Set(result.acceptedRecords[0].observationIds), new Set(["duplicate-a", "duplicate-b", "duplicate-c"]));
});

test("two independent offers of one canonical price type establish low and high", () => {
  const result = createResult({
    analysisId: "two-active-offers",
    analysisMode: "collectible",
    observations: [
      offer({ id: "asking-low", url: "https://market-one.example/item/low", price: 18, priceType: "Active asking price" }),
      offer({ id: "asking-high", url: "https://market-two.example/item/high", price: 27.5, priceType: "Buy It Now" })
    ]
  });

  assert.equal(result.rangeResult.status, "established");
  assert.equal(result.rangeResult.priceType, "active_asking");
  assert.equal(result.rangeResult.low, 18);
  assert.equal(result.rangeResult.high, 27.5);
  assert.equal(result.rangeResult.independentOfferCount, 2);
  assert.equal(result.rangeResult.evidenceIds.length, 2);
  assert.equal(result.rangeResult.underlyingOfferIds.length, 2);
  assert.deepEqual(supportRecords(result, result.rangeResult).map((record) => record.price).sort((a, b) => a - b), [18, 27.5]);
});

test("canonical price groups isolate retail, asking, sold, bids, and non-transactional pages", () => {
  const observations = [
    offer({ id: "retail-1", url: "https://retailer-one.example/product/one", retailer: "Retailer One", price: 6, priceType: "Current retail price" }),
    offer({ id: "retail-2", url: "https://retailer-two.example/product/two", retailer: "Retailer Two", price: 8, priceType: "Current retail price" }),
    offer({ id: "ask-1", url: "https://market-one.example/item/one", marketplace: "Market One", price: 20, priceType: "Active asking price" }),
    offer({ id: "ask-2", url: "https://market-two.example/item/two", marketplace: "Market Two", price: 25, priceType: "Buy It Now" }),
    offer({ id: "sold-1", url: "https://auction-one.example/lot/one", marketplace: "Auction One", price: 15, priceType: "Verified sold" }),
    offer({ id: "sold-2", url: "https://auction-two.example/lot/two", marketplace: "Auction Two", price: 17, priceType: "Completed auction" }),
    offer({ id: "bid", url: "https://auction-three.example/lot/three", marketplace: "Auction Three", price: 12, priceType: "Current bid" }),
    offer({ id: "no-price", url: "https://identity.example/item/no-price", price: null, priceType: "Price unavailable" }),
    offer({ id: "archive", url: "https://archive.example/item/reference", price: 40, priceType: "Reference/archive", pageType: "archive" }),
    offer({ id: "category", url: "https://catalog.example/category/items", price: 10, priceType: "Current retail price", pageType: "category" }),
    offer({ id: "history", url: "https://history.example/article/item", price: 30, priceType: "Reference/archive", pageType: "article" }),
    offer({ id: "social", url: "https://social.example/posts/item", price: 35, priceType: "Reference/archive", pageType: "social" })
  ];
  const collectible = createResult({
    analysisId: "price-type-isolation-collectible",
    analysisMode: "collectible",
    observations
  });
  const retail = createResult({
    analysisId: "price-type-isolation-retail",
    analysisMode: "retail",
    observations
  });

  assert.deepEqual(supportRecords(collectible, collectible.rangeResults.currentRetail).map((record) => record.priceType), ["Current retail price", "Current retail price"]);
  assert.deepEqual(new Set(supportRecords(collectible, collectible.rangeResults.activeAsking).map((record) => record.priceType)), new Set(["Active asking price", "Buy It Now"]));
  assert.deepEqual(new Set(supportRecords(collectible, collectible.rangeResults.verifiedSold).map((record) => record.priceType)), new Set(["Verified sold", "Completed auction"]));
  assert.equal(collectible.rangeResult.priceType, "verified_sold");
  assert.equal(collectible.rangeResult.low, 15);
  assert.equal(collectible.rangeResult.high, 17);
  assert.equal(collectible.rangeResult.priceTypeComposition.currentRetail, 2);
  assert.equal(collectible.rangeResult.priceTypeComposition.activeAsking, 2);
  assert.equal(collectible.rangeResult.priceTypeComposition.verifiedSold, 2);
  assert.equal(collectible.rangeResult.priceTypeComposition.auctionBid, 1);
  assert.equal(collectible.rangeResult.priceTypeComposition.priceUnavailable, 1);
  assert(!collectible.views.rangeEligibleIds.includes(collectible.acceptedRecords.find((record) => record.sourceRecordId === "bid")?.evidenceId));
  assert(["archive", "category", "history", "social"].every((id) => collectible.rejectedRecords.some((record) => record.sourceRecordId === id)));
  assert.equal(retail.rangeResult.priceType, "current_retail");
  assert.equal(retail.rangeResult.low, 6);
  assert.equal(retail.rangeResult.high, 8);
  assert(supportRecords(retail, retail.retailLimitResult).every((record) => record.priceType === "Current retail price"));
});

test("retail limit uses only canonical qualified current-retail offers with truthful quantity context", () => {
  const targetIdentity = {
    upc: "012345678905",
    quantity: 48,
    dimensions: "4.125 x 9.5",
    packageType: "mailer box"
  };
  const exactUrl = "https://retailer-one.example/product/012345678905";
  const observations = [
    offer({
      id: "exact-retail-a",
      url: `${exactUrl}?utm_source=one`,
      retailer: "Retailer One",
      price: 4.99,
      priceType: "Current retail price",
      quantity: 48,
      dimensions: "4.125 x 9.5",
      packageType: "mailer box",
      upc: "012345678905"
    }),
    offer({
      id: "exact-retail-b",
      url: `${exactUrl}?utm_source=two`,
      retailer: "Retailer One",
      price: 4.99,
      priceType: "Current retail price",
      quantity: 48,
      dimensions: "4.125 x 9.5",
      packageType: "mailer box",
      upc: "012345678905"
    }),
    offer({
      id: "compatible-retail",
      url: "https://retailer-two.example/product/compatible",
      retailer: "Retailer Two",
      price: 3.99,
      priceType: "Current retail price",
      exact: false,
      match: "Strong",
      quantity: 50,
      dimensions: "4.125 x 9.5",
      packageType: "mailer box"
    }),
    offer({
      id: "marketplace-ask",
      url: "https://market.example/item/asking",
      marketplace: "Market",
      price: 2.5,
      priceType: "Active asking price",
      quantity: 48,
      dimensions: "4.125 x 9.5",
      packageType: "mailer box"
    }),
    offer({
      id: "wrong-package",
      url: "https://retailer-three.example/product/wrong-package",
      retailer: "Retailer Three",
      price: 2.99,
      priceType: "Current retail price",
      exact: false,
      match: "Strong",
      quantity: 100,
      dimensions: "4.125 x 9.5",
      packageType: "mailer box"
    }),
    offer({
      id: "identity-no-price",
      url: "https://reference.example/product/012345678905",
      retailer: "Reference",
      price: null,
      priceType: "Price unavailable",
      quantity: 48,
      dimensions: "4.125 x 9.5",
      packageType: "mailer box",
      upc: "012345678905"
    })
  ];
  const result = createResult({
    analysisId: "retail-limit",
    analysisMode: "retail",
    targetIdentity,
    observations
  });
  const support = supportRecords(result, result.retailLimitResult);

  assert.equal(result.retailLimitResult.status, "established");
  assert.equal(result.retailLimitResult.amount, 3.83);
  assert.equal(result.retailLimitResult.independentOfferCount, 2);
  assert.equal(result.retailLimitResult.evidenceIds.length, 2);
  assert.equal(new Set(result.retailLimitResult.underlyingOfferIds).size, 2);
  assert(support.every((record) => record.priceType === "Current retail price"));
  assert(support.every((record) => record.price !== null));
  assert(!support.some((record) => record.sourceRecordId === "marketplace-ask"));
  assert(!support.some((record) => record.sourceRecordId === "wrong-package"));
  assert(!support.some((record) => record.sourceRecordId === "identity-no-price"));
  assert.equal(result.acceptedRecords.find((record) => record.sourceRecordId === "exact-retail-a")?.observationIds.length, 2);
  assert.equal(result.retailLimitResult.quantityContext.targetQuantity, 48);
  assert.equal(result.retailLimitResult.quantityContext.selectedOfferQuantity, 50);
  assert.equal(result.retailLimitResult.quantityContext.normalizedToTargetQuantity, 48);
  assert.equal(result.retailLimitResult.comparisonBasis, "compatible_unit_normalized");
  assert.equal(result.retailLimitResult.unitPriceContext.status, "established");
});

test("resolved and unresolved same-offer conflicts have canonical pricing behavior", () => {
  const resolved = createResult({
    analysisId: "resolved-conflict",
    analysisMode: "retail",
    targetIdentity: priceConflictFixture.targetIdentity,
    observations: priceConflictFixture.resolved
  });
  assert.equal(resolved.acceptedRecords.length, 1);
  assert.equal(resolved.acceptedRecords[0].price, 4.99);
  assert.equal(resolved.acceptedRecords[0].priceConflict.status, "resolved");
  assert.equal(resolved.rangeResult.status, "single_observation");
  assert.equal(resolved.rangeResult.evidenceIds.length, 1);
  assert.equal(resolved.retailLimitResult.evidenceIds.length, 1);
  assert.equal(resolved.retailLimitResult.amount, 4.99);
  assert.equal(resolved.acceptedRecords[0].priceConflict.observations.length, 2);

  const unresolved = createResult({
    analysisId: "unresolved-conflict",
    analysisMode: "retail",
    targetIdentity: priceConflictFixture.targetIdentity,
    observations: priceConflictFixture.unresolved
  });
  assert.equal(unresolved.acceptedRecords.length, 1);
  assert.equal(unresolved.acceptedRecords[0].displayedPrice, "Price unavailable");
  assert.equal(unresolved.acceptedRecords[0].priceConflict.status, "unresolved");
  assert.equal(unresolved.rangeResult.status, "insufficient");
  assert.equal(unresolved.rangeResult.evidenceIds.length, 0);
  assert.equal(unresolved.retailLimitResult.status, "insufficient");
  assert.equal(unresolved.retailLimitResult.evidenceIds.length, 0);
  assert.equal(unresolved.views.exactMatchIds.length, 1);
});

test("display truncation cannot alter canonical ranges, limits, or support", () => {
  const observations = [
    offer({ id: "retail-1", url: "https://retailer-one.example/product/one", retailer: "Retailer One", price: 6, priceType: "Current retail price", quantity: 24 }),
    offer({ id: "retail-2", url: "https://retailer-two.example/product/two", retailer: "Retailer Two", price: 8, priceType: "Current retail price", quantity: 24 }),
    offer({ id: "retail-3", url: "https://retailer-three.example/product/three", retailer: "Retailer Three", price: 7, priceType: "Current retail price", quantity: 24 }),
    offer({ id: "identity", url: "https://reference.example/product/no-price", retailer: "Reference", price: null, quantity: 24 })
  ];
  const common = {
    analysisId: "display-truncation",
    analysisMode: "retail",
    targetIdentity: { quantity: 24 },
    observations
  };
  const truncated = createResult({ ...common, displayLimit: 1 });
  const expanded = createResult({ ...common, displayLimit: 99 });

  assert.equal(truncated.views.displayedIds.length, 1);
  assert(expanded.views.displayedIds.length > truncated.views.displayedIds.length);
  assert.deepEqual(truncated.rangeResult, expanded.rangeResult);
  assert.deepEqual(truncated.rangeResults, expanded.rangeResults);
  assert.deepEqual(truncated.retailLimitResult, expanded.retailLimitResult);
  assert.equal(truncated.counts.rangeSupportCount, expanded.counts.rangeSupportCount);
  assert.equal(truncated.counts.retailLimitSupportCount, expanded.counts.retailLimitSupportCount);
});

test("validator identifies canonical range and retail-limit support violations", () => {
  const result = createFinalEvidenceResult({
    analysisMode: "retail",
    targetIdentity: { quantity: 1 },
    observations: [
      offer({ id: "retail-1", retailer: "Retailer One", price: 6, priceType: "Current retail price", quantity: 1 }),
      offer({ id: "retail-2", retailer: "Retailer Two", price: 8, priceType: "Current retail price", quantity: 1 }),
      offer({ id: "asking-1", marketplace: "Marketplace", price: 5, priceType: "Active asking price", quantity: 1 })
    ]
  });
  const unknown = structuredClone(result);
  unknown.rangeResult.evidenceIds[0] = "unknown-canonical-support";
  assert.throws(
    () => validateFinalEvidenceResult(unknown),
    /rangeResults\.currentRetail contains unknown evidence ID unknown-canonical-support/
  );

  const oneAsRange = structuredClone(result);
  oneAsRange.rangeResult.independentOfferCount = 1;
  oneAsRange.rangeResult.underlyingOfferIds = oneAsRange.rangeResult.underlyingOfferIds.slice(0, 1);
  oneAsRange.rangeResult.evidenceIds = oneAsRange.rangeResult.evidenceIds.slice(0, 1);
  oneAsRange.rangeResult.evidenceCount = 1;
  oneAsRange.counts.rangeSupportCount = 1;
  assert.throws(
    () => validateFinalEvidenceResult(oneAsRange),
    /numerical range has fewer than two independent offers/
  );

  const wrongRetailType = structuredClone(result);
  const askingRecord = wrongRetailType.records.find((record) => record.sourceRecordId === "asking-1");
  wrongRetailType.retailLimitResult.evidenceIds = [askingRecord.evidenceId];
  wrongRetailType.retailLimitResult.underlyingOfferIds = [askingRecord.underlyingOfferId];
  wrongRetailType.retailLimitResult.independentOfferCount = 1;
  wrongRetailType.retailLimitResult.selectedEvidenceId = askingRecord.evidenceId;
  wrongRetailType.retailLimitResult.selectedUnderlyingOfferId = askingRecord.underlyingOfferId;
  wrongRetailType.counts.retailLimitSupportCount = 1;
  assert.throws(
    () => validateFinalEvidenceResult(wrongRetailType),
    new RegExp(`retailLimitResult evidence ID .* has incompatible price type Active asking price`)
  );
});
