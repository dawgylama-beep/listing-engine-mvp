import assert from "node:assert/strict";
import {
  assembleFinalEvidence,
  buildCompactEvidenceList,
  deriveDecision,
  deriveRange,
  diagnosticsFromFinalEvidence,
  identifiersEquivalent
} from "../lib/evidence/index.js";

function fixture(overrides = {}) {
  return {
    sourceRecordId: overrides.sourceRecordId || "fixture",
    title: "Item-specific product page",
    originalUrl: "https://market.example/item/default",
    destinationUrl: "https://market.example/item/default",
    retailer: "Example retailer",
    acquisitionProvider: "deterministic fixture",
    pageType: "product",
    ...overrides
  };
}

const retailTarget = {
  upc: "041226087161",
  quantity: 45,
  dimensions: "4.125 x 9.5",
  packageType: "security envelope",
  compatibleQuantities: [40]
};
const exactUrl = "https://retailer.example/p/security-envelopes/0004122608716";
assert.equal(identifiersEquivalent("0004122608716", retailTarget.upc), true);

const stageOne = [];
const recovered = [
  fixture({
    sourceRecordId: "recovery-exact",
    title: "Strip and seal security envelopes, 45 count",
    originalUrl: exactUrl,
    destinationUrl: exactUrl,
    retailer: "Retailer A",
    quantity: 45,
    dimensions: "4.12 x 9.5",
    packageType: "security envelope",
    priceType: "Price unavailable"
  }),
  fixture({
    sourceRecordId: "recovery-compatible",
    title: "Number 10 security envelopes, 45 count",
    originalUrl: "https://retailer-b.example/p/security-envelopes-45",
    destinationUrl: "https://retailer-b.example/p/security-envelopes-45",
    retailer: "Retailer B",
    identityMatchStrength: "Strong",
    quantity: 45,
    dimensions: "4.125 x 9.5",
    packageType: "security envelope",
    price: 2.99,
    priceType: "Current retail price"
  }),
  fixture({
    sourceRecordId: "wrong-size",
    title: "Small announcement envelopes",
    originalUrl: "https://retailer-c.example/p/small-envelopes",
    destinationUrl: "https://retailer-c.example/p/small-envelopes",
    retailer: "Retailer C",
    quantity: 45,
    dimensions: "4.75 x 6.5",
    packageType: "security envelope",
    price: 1.99,
    priceType: "Current retail price"
  })
];
assert.equal(assembleFinalEvidence(stageOne, retailTarget).counts.final, 0);
const postRecovery = assembleFinalEvidence([...stageOne, ...recovered], retailTarget);
const postRecoveryIds = postRecovery.finalizedCustomerRecordIds;
const postRecoveryDiagnostics = diagnosticsFromFinalEvidence(postRecovery);
const postRecoveryDecision = deriveDecision(postRecovery, { askingPrice: 5.5, mode: "retail" });
assert.deepEqual(postRecoveryDiagnostics.finalizedCustomerRecordIds, postRecoveryIds);
assert.deepEqual(postRecoveryDecision.finalizedCustomerRecordIds, postRecoveryIds);
assert.deepEqual(buildCompactEvidenceList(postRecovery).map((record) => record.evidenceId), postRecovery.displayedRecordIds);
assert.equal(postRecoveryDecision.exactProductFound, true);
assert.equal(postRecovery.all.some((record) => record.retailer === "Retailer B" && record.price === 2.99), true);
assert.equal(postRecovery.all.some((record) => record.sourceRecordId === "wrong-size"), false);
assert.equal(postRecovery.all.find((record) => record.exactIdentity).displayedPrice, "Price unavailable");

const resolvedConflict = assembleFinalEvidence([
  fixture({
    sourceRecordId: "stale-snippet",
    originalUrl: exactUrl,
    destinationUrl: exactUrl,
    retailer: "Retailer A",
    price: 1.49,
    priceType: "Current retail price",
    sourceQuality: "search_snippet"
  }),
  fixture({
    sourceRecordId: "direct-page",
    originalUrl: exactUrl,
    destinationUrl: exactUrl,
    retailer: "Retailer A",
    price: 2.99,
    priceType: "Current retail price",
    sourceQuality: "direct_product_page"
  })
], { upc: retailTarget.upc });
assert.equal(resolvedConflict.all.length, 1);
assert.equal(resolvedConflict.all[0].price, 2.99);
assert.equal(resolvedConflict.all[0].priceConflict.status, "resolved");
assert.equal(resolvedConflict.all[0].priceConflict.selectedSourceRecordId, "direct-page");
assert.equal(resolvedConflict.all[0].title, "Item-specific product page", "same-offer merge must not import another offer's title");
assert.equal(resolvedConflict.all[0].retailer, "Retailer A", "same-offer merge must preserve retailer association");

const unresolvedConflict = assembleFinalEvidence([
  fixture({
    sourceRecordId: "snippet-a",
    originalUrl: exactUrl,
    destinationUrl: exactUrl,
    price: 1.49,
    priceType: "Current retail price",
    sourceQuality: "search_snippet"
  }),
  fixture({
    sourceRecordId: "snippet-b",
    originalUrl: exactUrl,
    destinationUrl: exactUrl,
    price: 2.99,
    priceType: "Current retail price",
    sourceQuality: "search_snippet"
  })
], { upc: retailTarget.upc });
assert.equal(unresolvedConflict.all.length, 1);
assert.equal(unresolvedConflict.all[0].price, null);
assert.equal(unresolvedConflict.all[0].displayedPrice, "Price unavailable");
assert.equal(unresolvedConflict.all[0].priceConflict.status, "unresolved");

const collectibleTarget = {
  designAttributes: ["official bulldog tray", "1980 national champions", "vince dooley", "coca-cola"]
};
const collectible = assembleFinalEvidence([
  fixture({
    sourceRecordId: "exact-no-price-one",
    title: "Official Bulldog Tray 1980 National Champions Vince Dooley Coca-Cola",
    originalUrl: "https://market-one.example/item/100",
    destinationUrl: "https://market-one.example/item/100",
    marketplace: "Marketplace One",
    retailer: "",
    identityMatchStrength: "Exact",
    priceType: "Price unavailable"
  }),
  fixture({
    sourceRecordId: "exact-no-price-two",
    title: "Official Bulldog Tray 1980 National Champions Vince Dooley Coca-Cola",
    originalUrl: "https://market-two.example/listing/200",
    destinationUrl: "https://market-two.example/listing/200",
    marketplace: "Marketplace Two",
    retailer: "",
    identityMatchStrength: "Exact",
    priceType: "Price unavailable"
  }),
  fixture({
    sourceRecordId: "one-asking",
    title: "Official Bulldog Tray 1980 National Champions Vince Dooley Coca-Cola",
    originalUrl: "https://market-three.example/item/300",
    destinationUrl: "https://market-three.example/item/300",
    marketplace: "Marketplace Three",
    retailer: "",
    identityMatchStrength: "Exact",
    price: 22.8,
    priceType: "Active asking price"
  }),
  fixture({
    sourceRecordId: "category",
    title: "Vintage Coca-Cola trays category",
    originalUrl: "https://collector.example/category/trays",
    destinationUrl: "https://collector.example/category/trays",
    priceType: "Reference/archive"
  }),
  fixture({
    sourceRecordId: "history",
    title: "A brief history of Coca-Cola serving trays",
    originalUrl: "https://history.example/article/trays",
    destinationUrl: "https://history.example/article/trays",
    priceType: "Reference/archive"
  }),
  fixture({
    sourceRecordId: "social",
    title: "Fans drinking soda",
    originalUrl: "https://facebook.com/example/posts/123",
    destinationUrl: "https://facebook.com/example/posts/123",
    priceType: "Reference/archive"
  })
], collectibleTarget, { displayLimit: 2 });
assert.equal(collectible.counts.finalizedAccepted, 3);
assert.equal(collectible.counts.customerEligible, 3);
assert.equal(collectible.counts.displayed, 2);
assert.equal(collectible.counts.rangeEligible, 1);
assert.equal(collectible.counts.rejectedDiagnosticOnly, 3);
assert.equal(collectible.rejected.some((record) => record.sourceRecordId === "category"), true);
assert.equal(collectible.rejected.some((record) => record.sourceRecordId === "history"), true);
assert.equal(collectible.rejected.some((record) => record.sourceRecordId === "social"), true);
assert.equal(collectible.customerEligible.every((record) => record.canonicalMatchQuality === "Exact"), true);

const oneAskingRange = deriveRange(collectible);
assert.equal(oneAskingRange.established, false);
assert.equal(oneAskingRange.singleObservation.price, 22.8);
const collectibleDecision = deriveDecision(collectible, { askingPrice: 10, purpose: "personal" });
assert.equal(collectibleDecision.recommendation, "Need More Information");
assert.equal(collectibleDecision.confidence, "Low");
assert.equal(collectibleDecision.badge, "Asking-Price Context Only");
assert.equal(collectibleDecision.openingOffer, null);
assert.equal(collectibleDecision.targetPrice, null);
assert.equal(collectibleDecision.maximumPrice, null);
assert.match(collectibleDecision.negotiationGuidance, /outside the canonical decision contract/i);

const collectibleDiagnostics = diagnosticsFromFinalEvidence(collectible);
assert.equal(collectibleDiagnostics.customerEligibleEvidenceCount, 3);
assert.equal(collectibleDiagnostics.displayedEvidenceCount, 2);
assert.equal(collectibleDiagnostics.rangeEligibleEvidenceCount, 1);
assert.equal(collectibleDiagnostics.finalEvidenceCount, 3);
assert.deepEqual(collectibleDiagnostics.finalizedCustomerRecordIds, collectible.finalizedCustomerRecordIds);

const fullDisplay = assembleFinalEvidence(collectible.all, collectibleTarget, { displayLimit: 8 });
assert.equal(fullDisplay.counts.finalizedAccepted, collectible.counts.finalizedAccepted);
assert.equal(deriveRange(fullDisplay).established, deriveRange(collectible).established);
assert.equal(deriveDecision(fullDisplay, { askingPrice: 10 }).recommendation, collectibleDecision.recommendation);

const duplicateAndIndependent = assembleFinalEvidence([
  fixture({
    sourceRecordId: "mirror-one",
    marketplace: "Marketplace",
    marketplaceItemId: "same-offer",
    originalMarketplaceDomain: "market.example",
    originalUrl: "https://market.example/item/same-offer",
    destinationUrl: "https://market.example/item/same-offer",
    price: 20,
    priceType: "Active asking price",
    exactIdentity: true
  }),
  fixture({
    sourceRecordId: "mirror-two",
    marketplace: "Marketplace",
    marketplaceItemId: "same-offer",
    originalMarketplaceDomain: "market.example",
    originalUrl: "https://mirror.example/item/same-offer",
    destinationUrl: "https://mirror.example/item/same-offer",
    price: 20,
    priceType: "Active asking price",
    exactIdentity: true
  }),
  fixture({
    sourceRecordId: "independent",
    marketplace: "Other Marketplace",
    marketplaceItemId: "different-offer",
    originalUrl: "https://other.example/item/different-offer",
    destinationUrl: "https://other.example/item/different-offer",
    price: 25,
    priceType: "Active asking price",
    exactIdentity: true
  })
], {});
assert.equal(duplicateAndIndependent.counts.finalizedAccepted, 2);
assert.equal(deriveRange(duplicateAndIndependent).independentOfferCount, 2);
assert.equal(deriveRange(duplicateAndIndependent).established, true);

console.log("PASS canonical finalized evidence pipeline deterministic acceptance");
