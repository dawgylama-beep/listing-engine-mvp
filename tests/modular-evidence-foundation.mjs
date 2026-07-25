import assert from "node:assert/strict";
import {
  assembleFinalEvidence,
  buildCompactEvidenceList,
  buildFieldProvenance,
  buildIdentifierEquivalenceSet,
  dedupeUnderlyingOffers,
  deriveDecision,
  deriveRange,
  diagnosticsFromFinalEvidence,
  dimensionsCompatible,
  identifiersEquivalent,
  normalizePriceType,
  omitUnsupportedAssociations
} from "../lib/evidence/index.js";

function record(overrides = {}) {
  return {
    sourceRecordId: overrides.sourceRecordId || "fixture-record",
    title: "Supported product page",
    originalUrl: "https://example.com/product/supported-item",
    destinationUrl: "https://example.com/product/supported-item",
    retailer: "Example",
    acquisitionProvider: "deterministic fixture",
    pageType: "product",
    ...overrides
  };
}

const envelopeTarget = {
  upc: "041226087161",
  quantity: 45,
  dimensions: "4.125 x 9.5",
  packageType: "security envelope",
  compatibleQuantities: [40]
};
const exactEnvelopeUrl = "https://www.kroger.com/p/office-works-strip-and-seal-security-envelopes-white/0004122608716";
const envelopeRecords = [
  record({
    sourceRecordId: "kroger-exact",
    title: "Office Works Strip and Seal Security Envelopes White",
    originalUrl: exactEnvelopeUrl,
    destinationUrl: exactEnvelopeUrl,
    retailer: "Kroger",
    quantity: 45,
    dimensions: "4.12 x 9.5",
    packageType: "security envelope",
    listingStatus: "Product page",
    priceType: "Price unavailable"
  }),
  record({
    sourceRecordId: "target-compatible",
    title: "up & up Number 10 Security Envelopes",
    originalUrl: "https://www.target.com/p/security-envelopes/-/A-12345678",
    destinationUrl: "https://www.target.com/p/security-envelopes/-/A-12345678",
    retailer: "Target",
    quantity: 45,
    dimensions: "4.125 x 9.5",
    packageType: "security envelope",
    price: 2.99,
    priceType: "Current retail price"
  }),
  record({
    sourceRecordId: "wrong-a6",
    title: "JAM Paper A6 Envelopes",
    originalUrl: "https://example.com/product/a6",
    destinationUrl: "https://example.com/product/a6",
    retailer: "Paper Store",
    quantity: 45,
    dimensions: "4.75 x 6.5",
    packageType: "security envelope",
    price: 2.99,
    priceType: "Current retail price"
  }),
  record({
    sourceRecordId: "wrong-booklet",
    title: "Booklet Envelopes",
    originalUrl: "https://example.com/product/booklet",
    destinationUrl: "https://example.com/product/booklet",
    retailer: "Office Store",
    quantity: 45,
    dimensions: "10 x 13",
    packageType: "security envelope",
    price: 8.99,
    priceType: "Current retail price"
  })
];

assert.equal(identifiersEquivalent("0004122608716", "041226087161"), true, "UPC and zero-padded EAN form must be equivalent");
assert.ok(buildIdentifierEquivalenceSet("0004122608716").includes("04122608716") || identifiersEquivalent("0004122608716", "041226087161"));
assert.equal(dimensionsCompatible("4.125 x 9.5", "4.12 x 9.5"), true);
assert.equal(dimensionsCompatible("4.125 x 9.5", "4.75 x 6.5"), false);

const envelopeFinal = assembleFinalEvidence(envelopeRecords, envelopeTarget);
assert.equal(envelopeFinal.counts.exact, 1, "exact URL barcode must produce one exact record");
assert.equal(envelopeFinal.counts.exactWithoutPrice, 1, "exact no-price page must survive");
assert.equal(envelopeFinal.counts.final, 2, "only exact and compatible envelope evidence survives");
assert.equal(envelopeFinal.all[0].retailer, "Kroger", "retailer identity must remain Kroger");
assert.equal(envelopeFinal.all.some((item) => item.retailer === "Bakers Plus"), false);
assert.equal(envelopeFinal.all.some((item) => item.retailer === "Target" && item.price === 2.99), true, "isolated low current-retail price must survive");
assert.equal(envelopeFinal.all.some((item) => /JAM Paper|Booklet/.test(item.title)), false);

const mixed = omitUnsupportedAssociations(record({
  sourceRecordId: "mixed-snippet",
  title: "JAM Paper A6 Envelopes",
  price: 2.99,
  originalUrl: "https://example.com/product/jam-a6",
  fieldProvenance: {
    title: { value: "JAM Paper A6 Envelopes", sourceRecordId: "jam", sourceUrl: "https://example.com/product/jam-a6" },
    originalUrl: { value: "https://example.com/product/jam-a6", sourceRecordId: "jam", sourceUrl: "https://example.com/product/jam-a6" },
    price: { value: 2.99, sourceRecordId: "target", sourceUrl: "https://example.com/product/target-envelopes" }
  }
}));
assert.equal(mixed.price, undefined, "mixed-snippet price association must be omitted");
assert.equal(mixed.priceAssociationStatus, "unsupported");
assert.equal(buildFieldProvenance(record({ title: "A", price: 1 })).title.sourceRecordId, "fixture-record");

const twoRetailers = dedupeUnderlyingOffers([
  record({ sourceRecordId: "r1", originalUrl: "https://retailer-one.example/product/123", destinationUrl: "https://retailer-one.example/product/123", retailer: "Retailer One", upc: "041226087161" }),
  record({ sourceRecordId: "r2", originalUrl: "https://retailer-two.example/product/123", destinationUrl: "https://retailer-two.example/product/123", retailer: "Retailer Two", upc: "041226087161" })
]);
assert.equal(twoRetailers.length, 2, "same product at different retailers is not one underlying offer");

const duplicateMarketplace = dedupeUnderlyingOffers([
  record({ marketplace: "eBay", marketplaceItemId: "123", originalMarketplaceDomain: "ebay.com", originalUrl: "https://ebay.com/itm/123", title: "Listing mirror" }),
  record({ marketplace: "eBay", marketplaceItemId: "123", originalMarketplaceDomain: "ebay.com", originalUrl: "https://picclick.com/mirror/123", title: "Original listing", price: 20 })
]);
assert.equal(duplicateMarketplace.length, 1, "one underlying marketplace offer appears once");
assert.equal(duplicateMarketplace[0].price, 20);

const collectibleTarget = {
  designAttributes: ["Coca-Cola", "Georgia Bulldogs", "1980 National Champions", "Vince Dooley", "How 'bout them Dawgs", "tray"]
};
const collectibleRecords = [
  record({
    sourceRecordId: "ebay-exact",
    title: "Coca-Cola Georgia Bulldogs 1980 National Champions Vince Dooley How 'bout them Dawgs tray",
    originalUrl: "https://www.ebay.com/itm/123456789012",
    destinationUrl: "https://www.ebay.com/itm/123456789012",
    marketplace: "eBay",
    retailer: "",
    identityMatchStrength: "Exact",
    listingStatus: "Active listing",
    priceType: "Active listing"
  }),
  record({
    sourceRecordId: "auction-exact",
    title: "Coca-Cola Georgia Bulldogs 1980 National Champions Vince Dooley How 'bout them Dawgs tray",
    originalUrl: "https://auction.example/lot/55",
    destinationUrl: "https://auction.example/lot/55",
    marketplace: "Auction House",
    retailer: "",
    identityMatchStrength: "Exact",
    price: 24,
    priceType: "Completed auction"
  }),
  record({
    sourceRecordId: "generic-tray",
    title: "Vintage Generic Coca-Cola Serving Tray",
    originalUrl: "https://market.example/listing/generic",
    destinationUrl: "https://market.example/listing/generic",
    marketplace: "Marketplace",
    retailer: "",
    price: 18,
    priceType: "Active asking price"
  }),
  record({
    sourceRecordId: "etsy-category",
    title: "Coca-Cola trays category",
    originalUrl: "https://www.etsy.com/search?q=coca-cola+tray",
    destinationUrl: "https://www.etsy.com/search?q=coca-cola+tray",
    marketplace: "Etsy",
    retailer: "",
    price: 30,
    priceType: "Active asking price"
  }),
  record({
    sourceRecordId: "collector-category",
    title: "Coca-Cola trays Collectors Weekly category",
    originalUrl: "https://www.collectorsweekly.com/coca-cola/trays",
    destinationUrl: "https://www.collectorsweekly.com/coca-cola/trays",
    marketplace: "Collectors Weekly",
    retailer: "",
    price: 40,
    pageType: "category",
    priceType: "Reference/archive"
  })
];
const collectibleFinal = assembleFinalEvidence(collectibleRecords, collectibleTarget);
assert.equal(collectibleFinal.counts.final, 2, "only same-design records survive collectible qualification");
assert.equal(collectibleFinal.counts.exactWithoutPrice, 1, "exact active no-price listing survives");
assert.equal(collectibleFinal.all.some((item) => /Generic/.test(item.title)), false);
assert.equal(collectibleFinal.all.some((item) => /Etsy|Collectors Weekly/.test(item.marketplace)), false);
assert.equal(deriveRange(collectibleFinal).established, false, "one qualified offer cannot establish a range");
assert.equal(deriveRange(collectibleFinal).singleObservation.price, 24, "one qualified offer remains a truthful observation");

const noPricedCollectible = assembleFinalEvidence([collectibleRecords[0]], collectibleTarget);
assert.equal(deriveRange(noPricedCollectible).established, false, "exact identity without price cannot create a numerical range");
const cautious = deriveDecision(noPricedCollectible, { askingPrice: 10, purpose: "personal" });
assert.equal(cautious.recommendation, "Need More Information");
assert.equal(cautious.badge, "Market Evidence Insufficient");
assert.equal(cautious.maximumPrice, undefined, "the canonical decision helper does not independently calculate a buyer maximum");

for (const priceType of [
  "Verified sold", "Completed auction", "Active asking price", "Buy It Now", "Current bid",
  "Opening bid", "Auction estimate", "Closed unsold", "Current retail price", "Price unavailable", "Reference/archive"
]) {
  const hasPrice = !["Price unavailable", "Reference/archive"].includes(priceType);
  assert.equal(normalizePriceType(priceType, { hasPrice, reference: priceType === "Reference/archive" }), priceType);
}

const many = assembleFinalEvidence(Array.from({ length: 75 }, (_, index) => record({
  sourceRecordId: `record-${index}`,
  originalUrl: `https://example.com/product/${index}`,
  destinationUrl: `https://example.com/product/${index}`,
  title: `Compatible product ${index}`,
  price: index + 1,
  priceType: "Current retail price"
})), {});
const diagnostics = diagnosticsFromFinalEvidence(many, [
  { attempted: true, succeeded: true },
  { attempted: true, succeeded: false },
  { attempted: false, succeeded: false }
], 50);
assert.equal(diagnostics.finalEvidenceCount, 75, "diagnostic sample limit must not affect business counts");
assert.equal(diagnostics.diagnosticSample.length, 50);
assert.equal(diagnostics.providerCallsAttempted, 2);
assert.equal(diagnostics.providerCallsSucceeded, 1);

const compact = buildCompactEvidenceList(envelopeFinal, 5.5);
assert.equal(compact.length, envelopeFinal.display.length);
assert.equal(compact[0].displayedPrice, "Price unavailable");
assert.equal(compact[0].priceContextLabel, "Exact item");
assert.equal(compact[1].unitPrice, "$0.066 each");

console.log("PASS modular evidence foundation deterministic acceptance");
