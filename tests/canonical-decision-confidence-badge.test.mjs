import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalEvidenceResult,
  validateFinalEvidenceResult
} from "../lib/evidence/index.js";

function offer({
  id,
  url = `https://evidence.example/item/${id}`,
  title = "Sanitized exact product",
  retailer = "",
  marketplace = "",
  price = null,
  priceType = "Price unavailable",
  exact = true,
  match = exact ? "Exact" : "Strong",
  pageType = "product",
  quantity = 1,
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
    identityMatchStrength: match,
    pageType,
    quantity,
    upc
  };
}

function result(options = {}) {
  const value = createFinalEvidenceResult(options);
  validateFinalEvidenceResult(value);
  return value;
}

function supportRecords(value, ids = []) {
  const byId = new Map(value.records.map((record) => [record.evidenceId, record]));
  return ids.map((id) => byId.get(id));
}

const retailObservations = [
  offer({
    id: "exact-retail",
    url: "https://retailer-one.example/product/exact",
    retailer: "Retailer One",
    price: 5,
    priceType: "Current retail price",
    upc: "012345678905"
  }),
  offer({
    id: "compatible-retail",
    url: "https://retailer-two.example/product/compatible",
    retailer: "Retailer Two",
    price: 4,
    priceType: "Current retail price",
    exact: false,
    match: "Strong"
  })
];

test("retail price above the canonical limit produces an unfavorable traceable decision", () => {
  const value = result({
    analysisId: "retail-above-limit",
    analysisMode: "retail",
    targetIdentity: { upc: "012345678905", quantity: 1 },
    observations: retailObservations,
    askingPrice: 6,
    purpose: "personal"
  });

  assert.equal(value.retailLimitResult.status, "established");
  assert.equal(value.retailLimitResult.amount, 4);
  assert.equal(value.decisionResult.canonicalComparisonResult.status, "lower_qualified_offer_materially_undercuts");
  assert.equal(value.decisionResult.recommendationCode, "wait_for_better_price");
  assert.equal(value.badgeResult.code, "lower_qualified_offer_found");
  assert.deepEqual(value.decisionResult.supportingEvidenceIds, value.retailLimitResult.evidenceIds);
  assert.deepEqual(value.decisionResult.supportingUnderlyingOfferIds, value.retailLimitResult.underlyingOfferIds);
  assert(!/best|competitive|reasonable|bargain/i.test(value.decisionResult.summary));
  assert(supportRecords(value, value.decisionResult.supportingEvidenceIds).every((record) => record.decisionEligible));
});

test("retail price at the canonical limit stays conditional without an unsupported best-price claim", () => {
  const value = result({
    analysisId: "retail-at-limit",
    analysisMode: "retail",
    targetIdentity: { upc: "012345678905", quantity: 1 },
    observations: retailObservations,
    askingPrice: 4,
    purpose: "Buy for Myself"
  });

  assert.equal(value.decisionResult.canonicalComparisonResult.status, "at_or_below_retail_limit");
  assert.equal(value.decisionResult.recommendationCode, "consider_purchase");
  assert.equal(value.badgeResult.code, "qualified_retail_comparison");
  assert(!/best price|bargain/i.test(`${value.decisionResult.summary} ${value.badgeResult.label}`));
  assert.deepEqual(value.badgeResult.supportingEvidenceIds, value.decisionResult.supportingEvidenceIds);
});

test("one active collectible ask separates strong identity from limited pricing", () => {
  const value = result({
    analysisId: "one-active-ask",
    analysisMode: "collectible",
    targetIdentity: { designAttributes: ["championship wording", "coach portrait"] },
    observations: [
      offer({ id: "identity-a", url: "https://archive-one.example/item/exact-a", title: "Championship wording coach portrait exact design" }),
      offer({ id: "identity-b", url: "https://archive-two.example/item/exact-b", title: "Championship wording coach portrait exact design" }),
      offer({
        id: "asking",
        url: "https://market.example/item/one-active-ask",
        title: "Championship wording coach portrait exact design",
        marketplace: "Marketplace",
        price: 25,
        priceType: "Active asking price"
      })
    ],
    askingPrice: 10,
    purpose: "personal"
  });

  assert.equal(value.rangeResult.status, "single_observation");
  assert.equal(value.confidenceResult.identity.level, "high");
  assert.equal(value.confidenceResult.pricing.level, "low");
  assert.equal(value.decisionResult.recommendationCode, "need_more_information");
  assert.equal(value.badgeResult.code, "asking_price_context_only");
  assert.match(value.decisionResult.summary, /pricing evidence is insufficient/i);
  assert(!/established market|supported value|bargain/i.test(JSON.stringify([
    value.decisionResult,
    value.confidenceResult.pricing,
    value.badgeResult
  ])));
});

test("exact identity without priced evidence cannot create price confidence, a price badge, or market validation", () => {
  const value = result({
    analysisId: "identity-only",
    analysisMode: "collectible",
    targetIdentity: { upc: "012345678905" },
    observations: [
      offer({ id: "identity-a", url: "https://archive-one.example/item/identity", upc: "012345678905" }),
      offer({ id: "identity-b", url: "https://archive-two.example/item/identity", upc: "012345678905" })
    ],
    askingPrice: 10,
    purpose: "personal"
  });

  assert.equal(value.confidenceResult.identity.level, "high");
  assert.equal(value.confidenceResult.pricing.level, "insufficient");
  assert(value.confidenceResult.identity.supportingEvidenceIds.length > 0);
  assert.deepEqual(value.confidenceResult.pricing.supportingEvidenceIds, []);
  assert.equal(value.badgeResult.code, "market_evidence_insufficient");
  assert.equal(value.decisionResult.recommendationCode, "need_more_information");
  assert.match(value.decisionResult.summary, /insufficient/i);
});

function verifiedMarketObservations() {
  return [
    offer({
      id: "sold-a",
      url: "https://auction-one.example/lot/sold-a",
      title: "Championship wording coach portrait exact design",
      marketplace: "Auction One",
      price: 12,
      priceType: "Verified sold"
    }),
    offer({
      id: "sold-b",
      url: "https://auction-two.example/lot/sold-b",
      title: "Championship wording coach portrait exact design",
      marketplace: "Auction Two",
      price: 15,
      priceType: "Completed auction"
    }),
    offer({
      id: "sold-c",
      url: "https://auction-three.example/lot/sold-c",
      title: "Championship wording coach portrait exact design",
      marketplace: "Auction Three",
      price: 18,
      priceType: "Sold price"
    })
  ];
}

test("multiple independent verified sales can support high pricing confidence and a traceable value badge", () => {
  const value = result({
    analysisId: "verified-market",
    analysisMode: "collectible",
    observations: verifiedMarketObservations(),
    askingPrice: 15,
    purpose: "personal"
  });

  assert.equal(value.rangeResult.status, "established");
  assert.equal(value.rangeResult.priceType, "verified_sold");
  assert.equal(value.confidenceResult.pricing.level, "high");
  assert.equal(value.decisionResult.recommendationCode, "consider_purchase");
  assert.equal(value.badgeResult.code, "supported_value");
  assert.deepEqual(value.confidenceResult.pricing.supportingEvidenceIds, value.rangeResult.evidenceIds);
  assert(supportRecords(value, value.confidenceResult.pricing.supportingEvidenceIds)
    .every((record) => /sold|completed auction/i.test(record.priceType)));
});

test("rejected category, history, social, navigation, and wrong-design records cannot alter canonical outputs", () => {
  const common = {
    analysisMode: "collectible",
    targetIdentity: { designAttributes: ["championship wording", "coach portrait"] },
    askingPrice: 15,
    purpose: "personal"
  };
  const baseline = result({
    ...common,
    analysisId: "rejection-baseline",
    observations: verifiedMarketObservations()
  });
  const withRejected = result({
    ...common,
    analysisId: "rejection-adversarial",
    observations: [
      ...verifiedMarketObservations(),
      offer({ id: "category", url: "https://catalog.example/category/items", pageType: "category", price: 1, priceType: "Active asking price" }),
      offer({ id: "history", url: "https://history.example/article/item", pageType: "article", price: 2, priceType: "Reference/archive" }),
      offer({ id: "social", url: "https://social.example/posts/item", pageType: "social", price: 3, priceType: "Active asking price" }),
      offer({ id: "navigation", url: "https://search.example/search?q=item", pageType: "search", price: 4, priceType: "Current retail price" }),
      offer({ id: "wrong-design", url: "https://market.example/item/wrong-design", title: "Different championship design", exact: false, match: "Partial", price: 5, priceType: "Active asking price" })
    ]
  });

  assert(withRejected.rejectedRecords.length >= 5);
  assert.deepEqual(withRejected.decisionResult, baseline.decisionResult);
  assert.deepEqual(withRejected.confidenceResult.pricing, baseline.confidenceResult.pricing);
  assert.deepEqual(withRejected.badgeResult, baseline.badgeResult);
  const rejectedIds = new Set(withRejected.views.rejectedDiagnosticOnlyIds);
  for (const id of [
    ...withRejected.decisionResult.supportingEvidenceIds,
    ...withRejected.confidenceResult.pricing.supportingEvidenceIds,
    ...withRejected.badgeResult.supportingEvidenceIds
  ]) {
    assert(!rejectedIds.has(id));
  }
});

test("display truncation cannot alter decision, confidence, badge, or their support IDs", () => {
  const common = {
    analysisMode: "collectible",
    observations: verifiedMarketObservations(),
    askingPrice: 15,
    purpose: "personal"
  };
  const truncated = result({ ...common, analysisId: "display-one", displayLimit: 1 });
  const expanded = result({ ...common, analysisId: "display-all", displayLimit: 99 });

  assert.notDeepEqual(truncated.views.displayedIds, expanded.views.displayedIds);
  assert.deepEqual(truncated.decisionResult, expanded.decisionResult);
  assert.deepEqual(truncated.confidenceResult, expanded.confidenceResult);
  assert.deepEqual(truncated.badgeResult, expanded.badgeResult);
});

test("purpose-specific decision codes preserve resale, owner-value, and seller-listing foundations", () => {
  const common = {
    analysisMode: "collectible",
    observations: verifiedMarketObservations(),
    askingPrice: 15
  };
  const resale = result({ ...common, analysisId: "purpose-resale", purpose: "Buy to Resell" });
  const owner = result({ ...common, analysisId: "purpose-owner", purpose: "Value Something I Own", askingPrice: null });
  const seller = result({ ...common, analysisId: "purpose-seller", purpose: "Sell Something I Own", askingPrice: null });

  assert.equal(resale.decisionResult.purpose, "resale");
  assert.equal(resale.decisionResult.recommendationCode, "consider_purchase");
  assert.match(resale.decisionResult.recommendationLabel, /resale requirements/i);
  assert.equal(owner.decisionResult.recommendationCode, "owner_value_assessment");
  assert.equal(owner.badgeResult.code, "owner_value_supported");
  assert(owner.decisionResult.supportingEvidenceIds.length > 0);
  assert.equal(seller.decisionResult.recommendationCode, "seller_listing_support");
  assert.equal(seller.badgeResult.code, "seller_evidence_supported");
  assert(seller.decisionResult.supportingEvidenceIds.length > 0);
});

test("validator reports exact decision, confidence, badge, and diagnostic invariant failures", () => {
  const value = createFinalEvidenceResult({
    analysisMode: "retail",
    targetIdentity: { upc: "012345678905", quantity: 1 },
    observations: retailObservations,
    askingPrice: 6,
    purpose: "personal"
  });

  const unknownDecisionId = structuredClone(value);
  unknownDecisionId.decisionResult.supportingEvidenceIds[0] = "unknown-decision-evidence";
  assert.throws(
    () => validateFinalEvidenceResult(unknownDecisionId),
    /decisionResult contains unknown evidence ID unknown-decision-evidence/
  );

  const invalidConfidence = structuredClone(value);
  invalidConfidence.confidenceResult.pricing.level = "certain";
  assert.throws(
    () => validateFinalEvidenceResult(invalidConfidence),
    /confidenceResult\.pricing has invalid level certain/
  );

  const wrongUnderlyingOffer = structuredClone(value);
  wrongUnderlyingOffer.decisionResult.supportingUnderlyingOfferIds[0] = "wrong-underlying-offer";
  assert.throws(
    () => validateFinalEvidenceResult(wrongUnderlyingOffer),
    /decisionResult underlyingOfferId does not match evidence ID/
  );

  const unsupportedBadge = createFinalEvidenceResult({
    analysisMode: "retail",
    targetIdentity: { upc: "012345678905", quantity: 1 },
    observations: [retailObservations[0]],
    askingPrice: 5,
    purpose: "personal"
  });
  unsupportedBadge.badgeResult.code = "supported_value";
  unsupportedBadge.badgeResult.label = "Supported Value";
  unsupportedBadge.badgeResult.eligibility = "eligible";
  unsupportedBadge.badgeResult.rationaleCodes = ["multiple_verified_sales_support_price"];
  assert.throws(
    () => validateFinalEvidenceResult(unsupportedBadge),
    /supported-value badge cannot exist with low or insufficient pricing confidence/
  );

  const mismatchedBadgeRationale = structuredClone(value);
  mismatchedBadgeRationale.badgeResult.rationaleCodes = ["multiple_verified_sales_support_price"];
  assert.throws(
    () => validateFinalEvidenceResult(mismatchedBadgeRationale),
    /badgeResult rationale code multiple_verified_sales_support_price disagrees with badge code lower_qualified_offer_found/
  );

  const diagnosticMismatch = structuredClone(value);
  diagnosticMismatch.diagnostics.canonicalBadgeSupportEvidenceIds = [];
  assert.throws(
    () => validateFinalEvidenceResult(diagnosticMismatch),
    /diagnostic canonicalBadgeSupportEvidenceIds do not match/
  );
});
