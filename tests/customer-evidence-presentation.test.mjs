import assert from "node:assert/strict";
import test from "node:test";

await import("../public/customer-evidence.js");

const { buildCustomerEvidenceViewModel } = globalThis.KatherinesEyeCustomerEvidence;

function canonicalRecord(index, overrides = {}) {
  return {
    evidenceId: `evidence-${index}`,
    underlyingOfferId: `offer-${index}`,
    destinationUrl: `https://retailer-${index}.example/p/item-${index}`,
    sourceLabel: `Retailer ${index}`,
    title: `Canonical title ${index}`,
    canonicalMatchCode: index % 2 ? "compatible" : "exact",
    canonicalMatchLabel: index % 2 ? "Compatible" : "Exact",
    canonicalPrice: index + 1,
    canonicalPriceType: index % 2 ? "Active asking price" : "Current retail price",
    priceTypeCode: index % 2 ? "active_asking" : "current_retail",
    customerPriceLabel: `$${(index + 1).toFixed(2)}`,
    quantity: 10 + index,
    quantityLabel: `${10 + index} count`,
    importantAttributes: [`Attribute ${index}`],
    shippingStatus: "unknown",
    shippingLabel: "Not shown",
    deliveredCostStatus: "not_established",
    deliveredCostLabel: "Not established",
    availabilityStatus: "Not confirmed",
    customerEligible: true,
    displayEligible: true,
    rangeEligible: true,
    decisionEligible: true,
    cardBadgeCode: null,
    cardBadgeLabel: null,
    sourceObservationIds: [`observation-${index}`],
    ...overrides
  };
}

function summary(records) {
  const countBy = (field) => records.reduce((counts, record) => {
    const key = record[field];
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  return {
    displayedIds: records.map((record) => record.evidenceId),
    counts: { displayed: records.length },
    displayedCountByRetailer: countBy("sourceLabel"),
    displayedCountByPriceType: countBy("canonicalPriceType"),
    displayedCountByMatchClass: countBy("canonicalMatchLabel")
  };
}

test("pure presentation model preserves membership, order, immutable fields, and canonical badges", () => {
  const records = [
    canonicalRecord(0),
    canonicalRecord(1, {
      cardBadgeCode: "lower_qualified_offer_found",
      cardBadgeLabel: "Lower Qualified Offer Found"
    }),
    canonicalRecord(2, {
      canonicalPrice: null,
      customerPriceLabel: "Price unavailable",
      canonicalPriceType: "Reference/archive",
      priceTypeCode: "reference"
    })
  ];
  const model = buildCustomerEvidenceViewModel(records, summary(records));
  assert.equal(model.status, "ready");
  assert.deepEqual(model.cards.map((card) => card.evidenceId), records.map((record) => record.evidenceId));
  assert.deepEqual(model.cards.map((card) => card.destinationUrl), records.map((record) => record.destinationUrl));
  assert.deepEqual(model.cards.map((card) => card.sourceLabel), records.map((record) => record.sourceLabel));
  assert.deepEqual(model.cards.map((card) => card.title), records.map((record) => record.title));
  assert.deepEqual(model.cards.map((card) => card.canonicalMatchLabel), records.map((record) => record.canonicalMatchLabel));
  assert.deepEqual(model.cards.map((card) => card.canonicalPriceType), records.map((record) => record.canonicalPriceType));
  assert.equal(model.cards[0].cardBadge, null, "first position must not create a badge");
  assert.deepEqual(model.cards[1].cardBadge, {
    code: "lower_qualified_offer_found",
    label: "Lower Qualified Offer Found"
  });
  assert.equal(model.cards[2].customerPriceLabel, "Price unavailable");
});

test("presentation model performs no deduplication or second display cap", () => {
  const records = Array.from({ length: 12 }, (_, index) => canonicalRecord(index));
  records[1].destinationUrl = records[0].destinationUrl;
  const model = buildCustomerEvidenceViewModel(records, summary(records));
  assert.equal(model.status, "ready");
  assert.equal(model.cards.length, 12);
  assert.equal(model.cards.filter((card) => card.destinationUrl === records[0].destinationUrl).length, 2);
});

test("canonical evidence cannot be poisoned by unrelated legacy aliases", () => {
  const records = [canonicalRecord(0), canonicalRecord(1)];
  const report = {
    customerEvidence: records,
    customerEvidenceSummary: summary(records),
    pricesFound: [{ ...records[0], title: "Poisoned title", sourceLabel: "Wrong retailer" }],
    bestCompatiblePriceFound: {
      ...records[1],
      canonicalPrice: 999,
      cardBadgeCode: "fake_best_price",
      cardBadgeLabel: "Best price"
    },
    otherCompatiblePricesFound: [{ ...records[0], destinationUrl: "https://wrong.example/item" }],
    bestCurrentRetailAlternative: { ...records[0], canonicalMatchLabel: "Wrong classification" },
    otherCurrentRetailPrices: [{ ...records[1], sourceLabel: "Wrong retailer" }]
  };
  const model = buildCustomerEvidenceViewModel(
    report.customerEvidence,
    report.customerEvidenceSummary
  );
  assert.equal(model.cards[0].title, "Canonical title 0");
  assert.equal(model.cards[0].sourceLabel, "Retailer 0");
  assert.equal(model.cards[1].canonicalPrice, 2);
  assert.equal(model.cards[1].cardBadge, null);
});

test("missing or inconsistent canonical contract fails closed", () => {
  assert.equal(buildCustomerEvidenceViewModel(undefined, {}).status, "evidence_unavailable");
  const records = [canonicalRecord(0)];
  const wrongOrder = summary(records);
  wrongOrder.displayedIds = ["different-id"];
  assert.equal(buildCustomerEvidenceViewModel(records, wrongOrder).status, "evidence_unavailable");
  const wrongCount = summary(records);
  wrongCount.counts.displayed = 2;
  assert.equal(buildCustomerEvidenceViewModel(records, wrongCount).status, "evidence_unavailable");
  const wrongComposition = summary(records);
  wrongComposition.displayedCountByRetailer = { "Wrong retailer": 1 };
  assert.equal(buildCustomerEvidenceViewModel(records, wrongComposition).status, "evidence_unavailable");
});

test("owner and seller purposes preserve exact no-price evidence truthfully", () => {
  const exactNoPrice = canonicalRecord(0, {
    canonicalPrice: null,
    customerPriceLabel: "Price unavailable",
    canonicalPriceType: "Price unavailable",
    priceTypeCode: "price_unavailable",
    canonicalMatchCode: "exact",
    canonicalMatchLabel: "Exact"
  });
  for (const purpose of ["owner_value", "seller_listing"]) {
    const report = {
      purpose,
      customerEvidence: [exactNoPrice],
      customerEvidenceSummary: summary([exactNoPrice])
    };
    const model = buildCustomerEvidenceViewModel(
      report.customerEvidence,
      report.customerEvidenceSummary
    );
    assert.equal(model.status, "ready");
    assert.equal(model.cards.length, 1);
    assert.equal(model.cards[0].canonicalMatchLabel, "Exact");
    assert.equal(model.cards[0].canonicalPrice, null);
    assert.equal(model.cards[0].customerPriceLabel, "Price unavailable");
  }
});
