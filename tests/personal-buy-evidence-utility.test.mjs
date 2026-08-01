import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createFinalEvidenceResult,
  normalizeCanonicalOfferUrl,
  validateFinalEvidenceResult
} from "../lib/evidence/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetIdentity = {
  quantity: 10,
  packageType: "unit pack"
};

function observation({
  id,
  sourceChannel,
  exact = true,
  quantity = 10,
  price = null,
  priceType = "Price unavailable",
  availabilityStatus = "",
  listingStatus = "",
  shippingStatus = "unknown",
  shippingAmount = null,
  deliveredCostAmount = null,
  condition = "",
  url = "",
  ...overrides
}) {
  const sourceToken = String(id).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const sourceUrl = url || `https://${sourceToken}.invalid/product/${sourceToken}`;
  const conventional = sourceChannel === "conventional_retail";
  return {
    sourceRecordId: id,
    title: id,
    originalUrl: sourceUrl,
    destinationUrl: sourceUrl,
    retailer: conventional ? `Retail source ${id}` : "",
    marketplace: conventional ? "" : `Market source ${id}`,
    sourceChannel,
    pageType: "product",
    exactIdentity: exact,
    identityMatchStrength: exact ? "Exact" : "Strong",
    quantity,
    packageType: "unit pack",
    price,
    priceType,
    availabilityStatus,
    listingStatus,
    shippingStatus,
    shippingAmount,
    deliveredCostAmount,
    condition,
    ...overrides
  };
}

function result(observations, options = {}) {
  const value = createFinalEvidenceResult({
    analysisId: options.analysisId || "personal-buy-utility",
    analysisMode: options.analysisMode || "retail",
    targetIdentity: options.targetIdentity || targetIdentity,
    observations,
    displayLimit: options.displayLimit ?? 8,
    askingPrice: options.askingPrice ?? 14,
    purpose: options.purpose || "personal",
    decisionContext: options.decisionContext || {}
  });
  validateFinalEvidenceResult(value);
  return value;
}

function displayedTitles(value) {
  return value.customerEvidence.map((record) => record.title);
}

function utilityDecision(value, title) {
  const record = value.acceptedRecords.find((item) => item.title === title);
  assert(record, `missing accepted fixture ${title}`);
  return value.diagnostics.personalBuyEvidenceUtilityDecisions.find((item) => item.evidenceId === record.evidenceId);
}

test("case 1 - ordinary retail consumable prioritizes useful conventional retail", () => {
  const value = result([
    observation({ id: "Exact retail priced", sourceChannel: "conventional_retail", price: 12, priceType: "Current retail price" }),
    observation({ id: "Exact retail unpriced", sourceChannel: "conventional_retail" }),
    observation({ id: "Exact marketplace unpriced", sourceChannel: "marketplace" }),
    observation({ id: "Marketplace variation unpriced", sourceChannel: "marketplace", exact: false, quantity: 8 }),
    observation({ id: "Retail variation priced", sourceChannel: "conventional_retail", exact: false, quantity: 8, price: 9, priceType: "Current retail price" })
  ]);

  assert.deepEqual(displayedTitles(value), [
    "Exact retail priced",
    "Exact retail unpriced",
    "Retail variation priced"
  ]);
  assert.equal(utilityDecision(value, "Exact marketplace unpriced").disposition, "technical_details_only");
  assert.equal(utilityDecision(value, "Marketplace variation unpriced").disposition, "technical_details_only");
  assert.equal(value.views.displayedIds.length, 3);
});

test("case 2 - common branded retail product keeps a truthful priced marketplace option", () => {
  const value = result([
    observation({ id: "Conventional exact", sourceChannel: "conventional_retail", price: 20, priceType: "Current retail price" }),
    observation({ id: "Marketplace exact", sourceChannel: "marketplace", price: 18, priceType: "Active asking price", shippingStatus: "unknown" }),
    observation({ id: "Conventional alternative", sourceChannel: "conventional_retail", exact: false, price: 17, priceType: "Current retail price" })
  ]);

  assert.deepEqual(displayedTitles(value), ["Conventional exact", "Conventional alternative", "Marketplace exact"]);
  const marketplace = value.customerEvidence.find((record) => record.title === "Marketplace exact");
  assert.equal(marketplace.canonicalPriceType, "Active asking price");
  assert.equal(marketplace.shippingStatus, "unknown");
  assert.equal(marketplace.deliveredCostAmount, null);
});

test("case 3 - marketplace-native used item retains an exact active offer", () => {
  const value = result([
    observation({
      id: "Used marketplace offer",
      sourceChannel: "marketplace",
      price: 31,
      priceType: "Buy It Now",
      condition: "used",
      shippingStatus: "unknown"
    })
  ], { decisionContext: { condition: "used" } });

  assert.deepEqual(displayedTitles(value), ["Used marketplace offer"]);
  assert.equal(value.customerEvidence[0].canonicalPrice, 31);
  assert.equal(value.customerEvidence[0].shippingStatus, "unknown");
  assert.equal(value.customerEvidence[0].deliveredCostAmount, null);
  assert.equal(value.retailLimitResult.status, "insufficient");
});

test("case 4 - discontinued item requires supported availability for an unpriced marketplace fallback", () => {
  const value = result([
    observation({ id: "Discontinued priced offer", sourceChannel: "marketplace", price: 44, priceType: "Active asking price" }),
    observation({ id: "Discontinued available reference", sourceChannel: "marketplace", availabilityStatus: "Available from seller" }),
    observation({ id: "Discontinued unpriced reference", sourceChannel: "marketplace" })
  ], { targetIdentity: { ...targetIdentity, category: "discontinued" } });

  assert.deepEqual(displayedTitles(value), ["Discontinued priced offer", "Discontinued available reference"]);
  assert.equal(utilityDecision(value, "Discontinued available reference").policyReasonCode, "personal_buy_marketplace_fallback");
  assert.equal(utilityDecision(value, "Discontinued unpriced reference").disposition, "technical_details_only");
});

test("case 5 - collectible and marketplace-dependent evidence retains legitimate marketplace behavior", () => {
  const observations = [
    observation({ id: "Collectible active offer", sourceChannel: "marketplace", price: 50, priceType: "Active asking price" }),
    observation({ id: "Collectible sold evidence", sourceChannel: "marketplace", price: 42, priceType: "Verified sold" }),
    observation({ id: "Collectible current auction", sourceChannel: "auction", price: 25, priceType: "Current bid", pageType: "auction" }),
    observation({ id: "Collectible identity source", sourceChannel: "unknown" })
  ];
  const value = result(observations, { analysisMode: "collectible" });

  assert.deepEqual(new Set(displayedTitles(value)), new Set(observations.map((record) => record.title)));
  assert(value.diagnostics.personalBuyEvidenceUtilityDecisions.every((decision) => decision.utilityBucket === 4));
});

test("case 6 - exact package stays ahead of priced variations and unpriced variations are diagnostic-only", () => {
  const value = result([
    observation({ id: "Exact requested package", sourceChannel: "conventional_retail", price: 15, priceType: "Current retail price" }),
    observation({ id: "Smaller priced package", sourceChannel: "conventional_retail", exact: false, quantity: 8, price: 11, priceType: "Current retail price" }),
    observation({ id: "Larger priced package", sourceChannel: "conventional_retail", exact: false, quantity: 12, price: 17, priceType: "Current retail price" }),
    observation({ id: "Smaller unpriced package", sourceChannel: "conventional_retail", exact: false, quantity: 8 })
  ]);

  assert.equal(displayedTitles(value)[0], "Exact requested package");
  assert.deepEqual(new Set(displayedTitles(value).slice(1)), new Set(["Smaller priced package", "Larger priced package"]));
  assert(value.customerEvidence.slice(1).every((record) => record.canonicalMatchLabel === "Strong compatible"));
  assert.equal(utilityDecision(value, "Smaller unpriced package").dispositionReasonCode, "personal_buy_package_variation_secondary_to_exact");
  assert(value.customerEvidence.filter((record) => record.quantity !== 10).every((record) => Number.isFinite(record.unitPriceAmount)));
});

test("case 7 - only low-utility unpriced marketplace evidence yields no customer cards", () => {
  const value = result([
    observation({ id: "Unpriced marketplace one", sourceChannel: "marketplace" }),
    observation({ id: "Unpriced marketplace two", sourceChannel: "marketplace" })
  ]);

  assert.deepEqual(value.customerEvidence, []);
  assert.equal(value.decisionResult.recommendationCode, "need_more_information");
  assert(value.diagnostics.personalBuyEvidenceUtilityDecisions.every((decision) => (
    decision.disposition === "technical_details_only"
    && decision.policyReasonCode === "personal_buy_marketplace_no_usable_price"
  )));
});

test("case 8 - card capacity is filled by bucket and preserves canonical order within buckets", () => {
  const observations = [
    ...Array.from({ length: 4 }, (_, index) => observation({
      id: `Exact priced retail ${index}`,
      sourceChannel: "conventional_retail",
      price: 20 + index,
      priceType: "Current retail price"
    })),
    ...Array.from({ length: 2 }, (_, index) => observation({
      id: `Exact unpriced retail ${index}`,
      sourceChannel: "conventional_retail"
    })),
    ...Array.from({ length: 4 }, (_, index) => observation({
      id: `Priced retail variation ${index}`,
      sourceChannel: "conventional_retail",
      exact: false,
      quantity: index % 2 ? 8 : 12,
      price: 10 + index,
      priceType: "Current retail price"
    })),
    ...Array.from({ length: 3 }, (_, index) => observation({
      id: `Priced marketplace ${index}`,
      sourceChannel: "marketplace",
      price: 18 + index,
      priceType: "Active asking price"
    })),
    ...Array.from({ length: 3 }, (_, index) => observation({
      id: `Unpriced marketplace ${index}`,
      sourceChannel: "marketplace"
    }))
  ];
  const value = result(observations);
  const visibleDecisions = value.diagnostics.personalBuyEvidenceUtilityDecisions
    .filter((decision) => decision.disposition === "customer_visible");
  const expectedIds = [1, 2, 3, 4]
    .flatMap((bucket) => value.diagnostics.personalBuyEvidenceUtilityDecisions
      .filter((decision) => decision.utilityBucket === bucket)
      .sort((left, right) => left.canonicalIndex - right.canonicalIndex))
    .slice(0, 8)
    .map((decision) => decision.evidenceId);

  assert.equal(value.customerEvidence.length, 8);
  assert.deepEqual(value.views.displayedIds, expectedIds);
  assert(visibleDecisions.every((decision) => decision.utilityBucket <= 3));
  assert(value.diagnostics.personalBuyEvidenceUtilityDecisions
    .filter((decision) => decision.utilityBucket === 5)
    .every((decision) => decision.disposition === "technical_details_only"));
});

test("case 9 - utility selection preserves canonical deduplication", () => {
  const sharedUrl = "https://duplicate-source.invalid/product/shared-offer";
  const value = result([
    observation({ id: "Duplicate snippet", sourceChannel: "conventional_retail", price: 16, priceType: "Current retail price", url: `${sharedUrl}?utm_source=fixture` }),
    observation({ id: "Duplicate direct", sourceChannel: "conventional_retail", price: 16, priceType: "Current retail price", url: sharedUrl, sourceQuality: "direct_product_page" }),
    observation({ id: "Independent offer", sourceChannel: "conventional_retail", price: 17, priceType: "Current retail price" })
  ]);
  const evidenceIds = value.acceptedRecords.map((record) => record.evidenceId);
  const normalizedUrls = value.acceptedRecords.map((record) => normalizeCanonicalOfferUrl(record.canonicalUrl));
  const offerIds = value.acceptedRecords.map((record) => record.underlyingOfferId);
  const customerIds = value.customerEvidence.map((record) => record.evidenceId);

  assert.equal(value.acceptedRecords.length, 2);
  assert.equal(evidenceIds.length - new Set(evidenceIds).size, 0);
  assert.equal(normalizedUrls.length - new Set(normalizedUrls).size, 0);
  assert.equal(offerIds.length - new Set(offerIds).size, 0);
  assert.equal(customerIds.length - new Set(customerIds).size, 0);
});

test("case 10 - non-Personal-Buy purposes preserve canonical membership and order", () => {
  const observations = [
    observation({ id: "Purpose retail", sourceChannel: "conventional_retail", price: 22, priceType: "Current retail price" }),
    observation({ id: "Purpose marketplace", sourceChannel: "marketplace", price: 19, priceType: "Active asking price" }),
    observation({ id: "Purpose no price", sourceChannel: "marketplace" })
  ];

  for (const purpose of ["resale", "owner_value", "seller_listing", "collectible"]) {
    const value = result(observations, { purpose, analysisMode: "collectible" });
    const canonicalOrder = value.acceptedRecords
      .filter((record) => record.customerEligible)
      .slice(0, 8)
      .map((record) => record.evidenceId);
    assert.deepEqual(value.views.displayedIds, canonicalOrder, `${purpose} changed customer-evidence order`);
    assert.equal(value.diagnostics.personalBuyEvidenceUtilityPolicy, undefined);
  }
});

test("case 11 - visibility selection leaves every canonical valuation authority invariant", () => {
  const observations = [
    observation({ id: "Invariant retail low", sourceChannel: "conventional_retail", price: 12, priceType: "Current retail price", sellerListingContext: "preserved" }),
    observation({ id: "Invariant retail high", sourceChannel: "conventional_retail", price: 18, priceType: "Current retail price", sellerListingContext: "preserved" }),
    observation({ id: "Invariant marketplace no price", sourceChannel: "marketplace", sellerListingContext: "preserved" })
  ];
  const full = result(observations, { displayLimit: 8, analysisId: "invariance" });
  const hidden = result(observations, { displayLimit: 0, analysisId: "invariance" });

  for (const field of [
    "rangeResult",
    "rangeResults",
    "retailLimitResult",
    "decisionResult",
    "confidenceResult",
    "badgeResult",
    "buyerOfferResult",
    "acceptedRecords",
    "rangeEligible",
    "decisionEligible",
    "priceBearing"
  ]) {
    assert.deepEqual(hidden[field], full[field], `${field} changed with customer-card capacity`);
  }
  assert.deepEqual(
    hidden.acceptedRecords.map((record) => record.fieldProvenance),
    full.acceptedRecords.map((record) => record.fieldProvenance)
  );
  assert(hidden.acceptedRecords.every((record) => record.sellerListingContext === "preserved"));
});

test("case 12 - demoted records retain bounded reasons in collapsed Technical Search Details", () => {
  const value = result([
    observation({ id: "Diagnostic retail", sourceChannel: "conventional_retail", price: 13, priceType: "Current retail price" }),
    observation({ id: "Diagnostic marketplace", sourceChannel: "marketplace" }),
    observation({ id: "Diagnostic unknown", sourceChannel: "unknown" })
  ]);
  const demoted = utilityDecision(value, "Diagnostic marketplace");
  const unknown = utilityDecision(value, "Diagnostic unknown");
  const classification = value.diagnostics.finalizedCustomerClassifications
    .find((item) => item.evidenceId === demoted.evidenceId);
  const appSource = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
  const disclosureStart = appSource.indexOf("function renderCustomerTechnicalSearchDetails");
  const disclosureEnd = appSource.indexOf("\nfunction ", disclosureStart + 10);
  const disclosure = appSource.slice(disclosureStart, disclosureEnd);

  assert.equal(demoted.disposition, "technical_details_only");
  assert.equal(demoted.dispositionReasonCode, "personal_buy_marketplace_no_usable_price");
  assert.equal(unknown.sourceChannel, "unknown");
  assert.equal(unknown.dispositionReasonCode, "personal_buy_unknown_source_no_buying_utility");
  assert.equal(classification.reasonCode, demoted.dispositionReasonCode);
  assert.equal(value.diagnostics.personalBuyEvidenceUtilityDecisions.length, value.views.customerEligibleIds.length);
  assert.match(disclosure, /document\.createElement\("details"\)/);
  assert.doesNotMatch(disclosure, /\.open\s*=\s*true/);
});
