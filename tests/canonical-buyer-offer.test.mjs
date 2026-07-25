import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalEvidenceResult,
  validateFinalEvidenceResult
} from "../lib/evidence/index.js";

const targetIdentity = Object.freeze({
  brand: "Northstar",
  productName: "Northstar Commemorative Sign",
  packageType: "metal sign",
  designAttributes: ["Northstar", "Champions", "Coach Avery"]
});

function observation({
  id,
  price = null,
  priceType = "Price unavailable",
  url = `https://${id}.example/item/${id}`,
  deliveredCostAmount,
  shippingStatus = "unknown",
  availabilityStatus = "unknown",
  exactIdentity = true,
  pageType = "product",
  title = "Northstar Champions Coach Avery commemorative metal sign",
  quantity = null
}) {
  return {
    sourceRecordId: id,
    destinationUrl: url,
    title,
    brand: "Northstar",
    packageType: "metal sign",
    designIdentity: title,
    designAttributes: ["Northstar", "Champions", "Coach Avery"],
    identityMatchStrength: exactIdentity ? "Exact" : "Partial",
    exactIdentity,
    pageType,
    price,
    priceType,
    deliveredCostAmount,
    shippingStatus,
    availabilityStatus,
    quantity
  };
}

function createResult({
  observations,
  askingPrice = 10,
  purpose = "personal",
  analysisMode = "collectible",
  displayLimit = 8,
  target = targetIdentity,
  decisionContext = {}
}) {
  const result = createFinalEvidenceResult({
    analysisId: "canonical-buyer-offer-test",
    analysisMode,
    targetIdentity: target,
    observations,
    displayLimit,
    askingPrice,
    purpose,
    decisionContext: {
      purchaseContext: analysisMode === "retail" ? "retail_store" : "private_seller",
      condition: "used",
      conditionConcerns: [],
      conditionRiskLevel: "ordinary",
      hasIdentifier: true,
      ...decisionContext
    }
  });
  validateFinalEvidenceResult(result);
  return result;
}

function assertNoNumbers(offer) {
  assert.equal(offer.openingOffer, null);
  assert.equal(offer.targetPrice, null);
  assert.equal(offer.maximumPrice, null);
}

function assertOrderedNumbers(offer) {
  assert(Number.isFinite(offer.openingOffer));
  assert(Number.isFinite(offer.targetPrice));
  assert(Number.isFinite(offer.maximumPrice));
  assert(offer.openingOffer <= offer.targetPrice);
  assert(offer.targetPrice <= offer.maximumPrice);
}

test("one active collectible ask remains context only and cannot create numerical buyer guidance", () => {
  const result = createResult({
    observations: [
      observation({ id: "identity-a" }),
      observation({ id: "identity-b", url: "https://identity-b.example/reference/item" }),
      observation({ id: "asking-a", price: 24.99, priceType: "Active asking price" })
    ]
  });
  const offer = result.buyerOfferResult;
  assert.equal(result.rangeResult.status, "single_observation");
  assert.equal(offer.status, "asking_price_context_only");
  assert.equal(offer.basisCode, "single_active_asking_observation");
  assert.equal(offer.userEnteredPriceRole, "seller_asking_price");
  assert.equal(offer.isBudgetOnly, false);
  assert.equal(offer.isMarketSupported, false);
  assertNoNumbers(offer);
  assert.deepEqual(offer.supportingEvidenceIds, result.rangeResult.evidenceIds);
  assert.equal(result.decisionResult.recommendationCode, "need_more_information");
  assert.equal(result.confidenceResult.pricing.level, "low");
  assert.equal(result.badgeResult.code, "asking_price_context_only");
});

test("no priced evidence keeps identity support separate and produces explicit insufficiency", () => {
  const result = createResult({
    observations: [
      observation({ id: "identity-a" }),
      observation({ id: "identity-b", url: "https://identity-b.example/reference/item" })
    ]
  });
  const offer = result.buyerOfferResult;
  assert(result.views.exactMatchIds.length >= 2);
  assert.equal(result.views.decisionEligibleIds.length, 0);
  assert.equal(offer.status, "insufficient_evidence");
  assert.equal(offer.supportingEvidenceIds.length, 0);
  assert(offer.insufficiencyReasons.length > 0);
  assert.equal(offer.isBudgetOnly, false);
  assertNoNumbers(offer);
});

test("two independent active asks permit asking-market guidance without claiming verified value", () => {
  const result = createResult({
    observations: [
      observation({ id: "asking-a", price: 20, priceType: "Active asking price" }),
      observation({ id: "asking-b", price: 30, priceType: "Buy It Now" })
    ]
  });
  const offer = result.buyerOfferResult;
  assert.equal(result.rangeResult.status, "established");
  assert.equal(result.rangeResult.priceType, "active_asking");
  assert.equal(offer.status, "asking_market_guidance");
  assert.equal(offer.basisCode, "active_asking_range");
  assert.match(offer.guidanceSummary, /asking-market guidance, not verified market value/i);
  assertOrderedNumbers(offer);
  assert.deepEqual(offer.supportingEvidenceIds, result.rangeResult.evidenceIds);
  assert.deepEqual(offer.supportingUnderlyingOfferIds, result.rangeResult.underlyingOfferIds);
});

test("multiple verified sold records support ordered canonical personal-use guidance", () => {
  const result = createResult({
    observations: [
      observation({ id: "sold-a", price: 30, priceType: "Verified sold", deliveredCostAmount: 36 }),
      observation({ id: "sold-b", price: 40, priceType: "Completed auction", deliveredCostAmount: 46 })
    ]
  });
  const offer = result.buyerOfferResult;
  assert.equal(result.confidenceResult.pricing.level, "high");
  assert.equal(offer.status, "market_supported");
  assert.equal(offer.basisCode, "verified_sold_range");
  assert.equal(offer.isMarketSupported, true);
  assertOrderedNumbers(offer);
  assert.deepEqual(
    [offer.openingOffer, offer.targetPrice, offer.maximumPrice],
    [8, 10, 36.05],
    "the migrated generic personal-use thresholds must remain unchanged"
  );
  assert(offer.maximumPrice <= result.rangeResult.high);
  assert(offer.deliveredCostFactors.includes("all_support_has_delivered_cost"));
});

test("ordinary retail with a lower qualified offer remains comparison-only", () => {
  const target = { upc: "012345678905", quantity: 45, productName: "Northstar Privacy Mailers" };
  const observations = [
    {
      sourceRecordId: "retail-a",
      destinationUrl: "https://retail-a.example/item/mailers",
      title: "Northstar Privacy Mailers 45 Count",
      upc: "012345678905",
      quantity: 45,
      exactIdentity: true,
      pageType: "product",
      price: 4.99,
      priceType: "Current retail price"
    },
    {
      sourceRecordId: "retail-b",
      destinationUrl: "https://retail-b.example/item/mailers",
      title: "Northstar Privacy Mailers 45 Count",
      upc: "012345678905",
      quantity: 45,
      exactIdentity: true,
      pageType: "product",
      price: 2.99,
      priceType: "Current retail price"
    }
  ];
  const result = createResult({
    observations,
    askingPrice: 5.5,
    analysisMode: "retail",
    target
  });
  const offer = result.buyerOfferResult;
  assert.equal(result.retailLimitResult.amount, 2.99);
  assert.equal(offer.status, "retail_comparison_only");
  assert.equal(offer.guidanceCode, "compare_qualified_retail_offers");
  assert.equal(offer.userEnteredPriceRole, "observed_store_price");
  assert.match(offer.guidanceSummary, /\$2\.99/);
  assert.match(offer.guidanceSummary, /does not create an opening offer/i);
  assertNoNumbers(offer);
  assert.deepEqual(offer.supportingEvidenceIds, result.retailLimitResult.evidenceIds);
});

test("observed prices are never budgets and an explicit budget is not market evidence", () => {
  const observations = [
    observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
    observation({ id: "sold-b", price: 40, priceType: "Completed auction" })
  ];
  const observed = createResult({ observations, askingPrice: 10 });
  assert.equal(observed.buyerOfferResult.userEnteredPriceRole, "seller_asking_price");
  assert.equal(observed.buyerOfferResult.isBudgetOnly, false);

  const budget = createResult({
    observations,
    askingPrice: 25,
    decisionContext: {
      purchaseContext: "private_seller",
      userEnteredPriceRole: "explicit_personal_budget"
    }
  });
  assert.equal(budget.buyerOfferResult.userEnteredPriceRole, "explicit_personal_budget");
  assert.equal(budget.buyerOfferResult.isBudgetOnly, true);
  assert.equal(budget.decisionResult.canonicalComparisonResult.status, "user_price_missing");
  assert.equal(budget.confidenceResult.pricing.level, observed.confidenceResult.pricing.level);
  assertNoNumbers(budget.buyerOfferResult);
});

test("an unknown transaction amount is labeled truthfully and does not become an offer input", () => {
  const observations = [
    observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
    observation({ id: "sold-b", price: 40, priceType: "Completed auction" })
  ];
  const result = createResult({
    observations,
    askingPrice: 1,
    decisionContext: { purchaseContext: "" }
  });
  assert.equal(result.buyerOfferResult.userEnteredPriceRole, "unknown_transaction_amount");
  assert.equal(result.buyerOfferResult.isBudgetOnly, false);
  assertOrderedNumbers(result.buyerOfferResult);
  assert.notEqual(result.buyerOfferResult.targetPrice, 1);
  assert.notEqual(result.buyerOfferResult.maximumPrice, 1);
});

test("delivered-cost uncertainty remains explicit and does not become delivered-cost certainty", () => {
  const result = createResult({
    observations: [
      observation({ id: "sold-a", price: 30, priceType: "Verified sold", shippingStatus: "unknown" }),
      observation({ id: "sold-b", price: 40, priceType: "Completed auction", shippingStatus: "unknown" })
    ]
  });
  const offer = result.buyerOfferResult;
  assert(offer.deliveredCostFactors.includes("shipping_or_checkout_cost_not_established"));
  assert(offer.contradictions.includes("delivered_cost_not_fully_established"));
  assert.equal(offer.availabilityContext.status, "not_fully_confirmed");
  assert(offer.contradictions.includes("availability_not_fully_confirmed"));
  assert.match(offer.guidanceSummary, /shipping, taxes, and checkout cost remain separate/i);
  assert.doesNotMatch(offer.guidanceSummary, /lowest delivered cost|better delivered deal/i);
});

test("the migrated generic condition guard lowers the supported personal-use maximum", () => {
  const observations = [
    observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
    observation({ id: "sold-b", price: 40, priceType: "Completed auction" })
  ];
  const ordinary = createResult({ observations });
  const hardRisk = createResult({
    observations,
    decisionContext: {
      purchaseContext: "private_seller",
      conditionRiskLevel: "hard",
      condition: "damaged",
      conditionConcerns: ["damage"]
    }
  });
  assert(hardRisk.buyerOfferResult.maximumPrice < ordinary.buyerOfferResult.maximumPrice);
});

test("quantity-incompatible records cannot set numerical buyer guidance", () => {
  const result = createResult({
    target: { ...targetIdentity, quantity: 1 },
    observations: [
      observation({ id: "sold-two-pack-a", price: 30, priceType: "Verified sold", quantity: 2 }),
      observation({ id: "sold-two-pack-b", price: 40, priceType: "Completed auction", quantity: 2 })
    ]
  });
  assertNoNumbers(result.buyerOfferResult);
  assert.equal(result.buyerOfferResult.isMarketSupported, false);
  assert.equal(result.buyerOfferResult.supportingEvidenceIds.length, 0);
});

test("resale requires verified sold support and preserves the existing generic margin policy", () => {
  const oneAsk = createResult({
    purpose: "resale",
    observations: [
      observation({ id: "asking-a", price: 40, priceType: "Active asking price" })
    ],
    decisionContext: {
      purchaseContext: "private_seller",
      purchaseIntent: "resale",
      hasIdentifier: true
    }
  });
  assert.equal(oneAsk.decisionResult.recommendationCode, "need_more_information");
  assertNoNumbers(oneAsk.buyerOfferResult);

  const sold = createResult({
    purpose: "resale",
    observations: [
      observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
      observation({ id: "sold-b", price: 40, priceType: "Completed auction" })
    ],
    decisionContext: {
      purchaseContext: "private_seller",
      purchaseIntent: "resale",
      hasIdentifier: true
    }
  });
  assert.equal(sold.buyerOfferResult.status, "resale_market_supported");
  assert.equal(sold.buyerOfferResult.basisCode, "verified_sold_range");
  assertOrderedNumbers(sold.buyerOfferResult);
  assert.deepEqual(
    [
      sold.buyerOfferResult.openingOffer,
      sold.buyerOfferResult.targetPrice,
      sold.buyerOfferResult.maximumPrice
    ],
    [7, 10, 10],
    "the migrated generic resale cost, risk, and required-profit thresholds must remain unchanged"
  );
  assert.match(sold.buyerOfferResult.guidanceSummary, /existing generic resale allowances/i);
  assert.deepEqual(sold.buyerOfferResult.supportingEvidenceIds, sold.rangeResult.evidenceIds);
});

test("owner-value and seller-listing purposes explicitly reject buyer-offer applicability", () => {
  const observations = [
    observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
    observation({ id: "sold-b", price: 40, priceType: "Completed auction" })
  ];
  for (const purpose of ["owner_value", "seller_listing"]) {
    const result = createResult({ observations, askingPrice: null, purpose });
    assert.equal(result.buyerOfferResult.applicability, "not_applicable");
    assert.equal(result.buyerOfferResult.status, "not_applicable");
    assert.equal(result.buyerOfferResult.guidanceCode, "not_applicable");
    assertNoNumbers(result.buyerOfferResult);
  }
});

test("display truncation cannot change canonical buyer-offer outputs", () => {
  const observations = [
    observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
    observation({ id: "sold-b", price: 40, priceType: "Completed auction" }),
    observation({ id: "identity-a" })
  ];
  const full = createResult({ observations, displayLimit: 8 });
  const truncated = createResult({ observations, displayLimit: 1 });
  assert.notDeepEqual(full.views.displayedIds, truncated.views.displayedIds);
  assert.deepEqual(full.buyerOfferResult, truncated.buyerOfferResult);
});

test("rejected and diagnostic-only evidence cannot influence canonical buyer guidance", () => {
  const accepted = [
    observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
    observation({ id: "sold-b", price: 40, priceType: "Completed auction" })
  ];
  const baseline = createResult({ observations: accepted });
  const withRejected = createResult({
    observations: [
      ...accepted,
      observation({
        id: "category",
        price: 1,
        priceType: "Active asking price",
        pageType: "category",
        exactIdentity: false,
        title: "Generic category navigation page"
      }),
      observation({
        id: "wrong-design",
        price: 500,
        priceType: "Verified sold",
        exactIdentity: false,
        title: "Different design and unrelated item"
      })
    ]
  });
  assert(withRejected.views.rejectedDiagnosticOnlyIds.length >= 1);
  assert.deepEqual(withRejected.buyerOfferResult, baseline.buyerOfferResult);
  const rejectedIds = new Set(withRejected.views.rejectedDiagnosticOnlyIds);
  assert(withRejected.buyerOfferResult.supportingEvidenceIds.every((id) => !rejectedIds.has(id)));
});

test("validator reports exact buyer-offer invariant and offending ID failures", () => {
  const build = () => createResult({
    observations: [
      observation({ id: "sold-a", price: 30, priceType: "Verified sold" }),
      observation({ id: "sold-b", price: 40, priceType: "Completed auction" })
    ]
  });

  const unknown = build();
  unknown.buyerOfferResult.supportingEvidenceIds[0] = "unknown-offer-id";
  assert.throws(
    () => validateFinalEvidenceResult(unknown),
    /buyerOfferResult contains unknown evidence ID unknown-offer-id/
  );

  const wrongOffer = build();
  wrongOffer.buyerOfferResult.supportingUnderlyingOfferIds[0] = "wrong-underlying-offer";
  assert.throws(
    () => validateFinalEvidenceResult(wrongOffer),
    /buyerOfferResult underlyingOfferId does not match evidence ID/
  );

  const invalidStatus = build();
  invalidStatus.buyerOfferResult.status = "invented_status";
  assert.throws(
    () => validateFinalEvidenceResult(invalidStatus),
    /buyerOfferResult has invalid status invented_status/
  );

  const forbiddenNumber = build();
  forbiddenNumber.buyerOfferResult.status = "insufficient_evidence";
  assert.throws(
    () => validateFinalEvidenceResult(forbiddenNumber),
    /status insufficient_evidence must not contain numerical guidance/
  );

  const partialGuidance = build();
  partialGuidance.buyerOfferResult.targetPrice = null;
  assert.throws(
    () => validateFinalEvidenceResult(partialGuidance),
    /status market_supported requires complete opening, target, and maximum guidance/
  );

  const unsupportedFlag = build();
  unsupportedFlag.buyerOfferResult.isMarketSupported = false;
  assert.throws(
    () => validateFinalEvidenceResult(unsupportedFlag),
    /isMarketSupported disagrees with status market_supported/
  );

  const invalidRole = build();
  invalidRole.buyerOfferResult.userEnteredPriceRole = "automatic_budget";
  assert.throws(
    () => validateFinalEvidenceResult(invalidRole),
    /buyerOfferResult has invalid userEnteredPriceRole automatic_budget/
  );

  const diagnosticMismatch = build();
  diagnosticMismatch.diagnostics.canonicalBuyerOfferSupportEvidenceIds = [];
  assert.throws(
    () => validateFinalEvidenceResult(diagnosticMismatch),
    /diagnostic canonicalBuyerOfferSupportEvidenceIds do not match/
  );
});
