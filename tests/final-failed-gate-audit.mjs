import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}.`);
  }
}

function assertIncludes(haystack, needle, message) {
  assert(String(haystack || "").includes(needle), message);
}

function assertNotMatches(haystack, pattern, message) {
  assert(!pattern.test(String(haystack || "")), message);
}

function money(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function buildRetailFixture() {
  const buyerIntake = hooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    purchase_intent: "personal_use",
    item_name: "Cedarline privacy mailers",
    known_brand: "Cedarline",
    known_upc: "012345678905",
    store_name: "CornerMart",
    location_zip: "10001",
    asking_price: "5.50",
    buyer_notes: "Cedarline privacy mailers 48 count 4.12 x 9.5 inches self seal"
  });
  const identity = hooks.finalizeIdentityForResearch({
    brand: "Cedarline",
    manufacturer: "Cedarline",
    productNameOrBoxTitle: "Cedarline Privacy Mailers",
    likelyItemDescription: "privacy mailers",
    category: "privacy mailers",
    visualSubjectCategory: "privacy mailers",
    upcBarcode: "012345678905",
    packageQuantity: "48 count",
    packageSize: "4.12 x 9.5 inches",
    visibleText: [
      "Cedarline Privacy Mailers",
      "48 count",
      "012345678905",
      "4.12 x 9.5 inches"
    ]
  }, buyerIntake);
  const route = hooks.routeMarketSources(identity, buyerIntake, "Cedarline privacy mailers");
  const context = hooks.buildSearchQueryContext(identity, route, "Cedarline privacy mailers", buyerIntake);
  return { buyerIntake, identity, route, context };
}

function retailRecord({ title, retailer, domain, url, price = null, quantity = 50, exact = false, stage = "stage_5_online_retail", sourceType = "organic" } = {}) {
  const priceText = Number.isFinite(price) ? money(price) : "";
  const productText = exact ? "Cedarline Privacy Mailers" : title.replace(/\s+-\s+.+$/, "");
  return {
    title,
    url,
    canonicalUrl: url,
    domain,
    source: retailer,
    sourceBacked: "URL-cited",
    sourceType,
    displayedPrice: priceText,
    displayedPriceText: priceText,
    parsedPrice: Number.isFinite(price) ? price : null,
    priceType: "Current Retail Price",
    priceEvidenceType: "Current Retail Price",
    classification: exact ? "Exact Match" : "Strong Similar Match",
    identityMatchStrength: exact ? "Exact Identity Match" : "Strong Similar",
    itemTypeCompatible: true,
    itemTypeCompatibilityStatus: "compatible",
    submittedItemType: "privacy mailers",
    candidateItemType: "privacy mailers",
    snippet: `${priceText ? `Current retail price ${priceText}. ` : "Price not shown. "}${productText} ${quantity} count. Add to cart.`,
    rawText: `${priceText ? `Current retail price ${priceText}. ` : "Price not shown. "}${productText} ${quantity} count. Add to cart. ${exact ? "UPC 012345678905." : "Functional privacy mailer alternative."}`,
    query: `${retailer} privacy mailers`,
    searchPass: stage,
    retailStage: stage,
    searchType: sourceType === "shopping" ? "shopping" : "organic_web",
    providerEndpoint: sourceType === "shopping" ? "serper_shopping" : "serper_search"
  };
}

function buildCollectibleFixture() {
  const buyerIntake = hooks.normalizeBuyerIntake({
    purchase_context: "resale",
    purchase_intent: "resale",
    item_name: "Riverton Rockets 1997 Victory Classic metal sign",
    asking_price: "10",
    buyer_notes: "Riverton Rockets 1997 Victory Classic Coach Lane commemorative metal sign"
  });
  const identity = hooks.finalizeIdentityForResearch({
    brand: "Riverton Rockets",
    visualOrganization: "Riverton Rockets",
    productNameOrBoxTitle: "Riverton Rockets 1997 Victory Classic metal sign",
    likelyItemDescription: "commemorative metal sign",
    category: "sports advertising collectible sign",
    visualSubjectCategory: "sports advertising collectible sign",
    visualFeatures: "1997 Victory Classic Coach Lane shield design",
    frontBoxWording: "1997 Victory Classic",
    year: "1997",
    visibleText: [
      "Riverton Rockets",
      "1997 Victory Classic",
      "Coach Lane",
      "metal sign"
    ]
  }, buyerIntake);
  const route = hooks.routeMarketSources(identity, buyerIntake, "Riverton Rockets 1997 Victory Classic metal sign auction sold");
  const context = hooks.buildSearchQueryContext(identity, route, "Riverton Rockets 1997 Victory Classic metal sign auction sold", buyerIntake);
  return { buyerIntake, identity, route, context };
}

function collectibleRecord({ title, url, source, price, priceType, classification = "Exact Match", itemTypeCompatible = true, status = "compatible", rawExtra = "" } = {}) {
  const priceText = Number.isFinite(price) ? money(price) : "";
  return {
    title,
    url,
    canonicalUrl: url,
    domain: hooks.unwrapRetailDestinationUrl(url).replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, ""),
    source,
    sourceBacked: "URL-cited",
    displayedPrice: priceText,
    displayedPriceText: priceText,
    parsedPrice: Number.isFinite(price) ? price : null,
    priceType,
    priceEvidenceType: priceType,
    activeSoldReferenceStatus: priceType,
    classification,
    identityMatchStrength: classification,
    itemTypeCompatible,
    itemTypeCompatibilityStatus: status,
    submittedItemType: "metal sign",
    candidateItemType: itemTypeCompatible ? "metal sign" : "different collectible object",
    snippet: `${title}. ${priceType}. ${priceText}. ${rawExtra}`,
    rawText: `${title}. ${priceType}. ${priceText}. ${rawExtra}`,
    query: "Riverton Rockets 1997 Victory Classic metal sign",
    searchPass: "collectible_exact_source_recovery"
  };
}

function testRetailExactRecoveryAfterCompatibleOnlyFinalList() {
  const { buyerIntake, identity, context } = buildRetailFixture();
  const noPriceExact = retailRecord({
    title: "Cedarline Privacy Mailers 48 Count - DirectRetail",
    retailer: "DirectRetail",
    domain: "directretail.com",
    url: "https://www.directretail.com/p/cedarline-privacy-mailers-012345678905",
    price: null,
    quantity: 48,
    exact: true,
    stage: "stage_1_exact_identity"
  });
  const compatibleOne = retailRecord({
    title: "Harborline Privacy Mailers 50 Count - Walmart",
    retailer: "Walmart",
    domain: "walmart.com",
    url: "https://www.walmart.com/ip/harborline-privacy-mailers-50",
    price: 4.8,
    quantity: 50
  });
  const compatibleTwo = retailRecord({
    title: "PaperPeak Privacy Mailers 50 Count - Target",
    retailer: "Target",
    domain: "target.com",
    url: "https://www.target.com/p/paperpeak-privacy-mailers-50",
    price: 6.25,
    quantity: 50
  });
  const recordsBeforeRecovery = [noPriceExact, compatibleOne, compatibleTwo];
  const initialPrices = hooks.buildConsumerPricesFound({
    providerSourceRecords: recordsBeforeRecovery,
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 5.5, { identity, buyerIntake });
  const initialSnapshot = hooks.buildFinalRetailCustomerEvidenceSnapshot(recordsBeforeRecovery, context);

  assert(initialPrices.length >= 2, "Compatible alternatives must remain visible before exact recovery.");
  assertEqual(initialSnapshot.exactCustomerEvidenceCount, 0, "The finalized pre-recovery list must have zero exact priced rows.");
  assert(hooks.shouldRunLimitedResultRetailRecovery({
    context,
    providerRequestRecords: [{ retailStage: "stage_5_online_retail", attempted: true, succeeded: true }],
    records: recordsBeforeRecovery,
    customerEvidenceSnapshot: initialSnapshot
  }), "Limited-result recovery must inspect the finalized customer-visible retail list and run when exact evidence is absent.");

  const recoveredExact = hooks.enrichExactRetailPageRecord(retailRecord({
    title: "Cedarline Privacy Mailers 48 Count - DirectRetail",
    retailer: "DirectRetail",
    domain: "directretail.com",
    url: "https://www.directretail.com/p/cedarline-privacy-mailers-012345678905",
    price: 3.49,
    quantity: 48,
    exact: true,
    stage: "stage_7_limited_result_recovery"
  }), context);
  const deduped = hooks.dedupeSerperCandidateRecords([...recordsBeforeRecovery, recoveredExact], context);
  const finalPrices = hooks.buildConsumerPricesFound({
    providerSourceRecords: deduped,
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 5.5, { identity, buyerIntake });
  const retailProfile = hooks.buildRetailEvidenceProfile({
    buyerIntake,
    identity,
    liveSearch: { providerSourceRecords: deduped, searchDiagnostics: { retailEvidenceMode: "current-retail-only" } },
    pricesFound: finalPrices,
    askingPriceNumber: 5.5,
    searchCompleted: true
  });

  assert(finalPrices.length >= 3, "The exact priced result and compatible alternatives must remain in one final list.");
  assert(/directretail/i.test(finalPrices[0].retailerDisplayName || finalPrices[0].retailerDomain || ""), "Recovered exact retailer page must lead compatible alternatives.");
  assertEqual(finalPrices[0].itemPrice, "$3.49", "Recovered exact page must carry its source-backed price.");
  assertEqual(finalPrices[0].packageQuantity, 48, "Recovered exact page must carry source-backed package quantity.");
  assert(finalPrices.slice(1).every((record) => /Compatible|Strong|Alternative|Retail/i.test(record.priceContextLabel || record.matchQuality || "")), "Compatible alternatives must remain beneath the exact row.");
  assertNotMatches(retailProfile.currentRetailPriceAssessment, /exact current .*not found/i, "Report must not say the exact product was not found after exact recovery succeeds.");
  assertEqual(hooks.retailSerperBudgetAllocation.maxProviderCalls, 28, "Retail provider-call ceiling must remain 28.");
}

function testRetailerAttributionAndAggregatorTruth() {
  const { buyerIntake, identity, context } = buildRetailFixture();
  const direct = retailRecord({
    title: "Cedarline Privacy Mailers 48 Count - DirectRetail",
    retailer: "DirectRetail",
    domain: "directretail.com",
    url: "https://www.directretail.com/p/cedarline-privacy-mailers-012345678905",
    price: 4.2,
    quantity: 48,
    exact: true
  });
  const aggregatorWithoutMerchant = retailRecord({
    title: "Cedarline Privacy Mailers 48 Count - DeliveryHub",
    retailer: "DeliveryHub",
    domain: "instacart.com",
    url: "https://www.instacart.com/products/cedarline-mailers",
    price: 4.2,
    quantity: 48,
    exact: true
  });
  aggregatorWithoutMerchant.source = "Instacart";
  aggregatorWithoutMerchant.rawText = "Current retail price $4.20. Cedarline Privacy Mailers 48 count. UPC 012345678905. Add to cart.";
  const aggregatorWithMerchant = {
    ...aggregatorWithoutMerchant,
    source: "Instacart",
    merchantName: "DirectRetail",
    sellerName: "DirectRetail",
    rawText: "Current retail price $4.20. Merchant: DirectRetail. Cedarline Privacy Mailers 48 count. UPC 012345678905. Add to cart."
  };
  const providerResult = {
    ...direct,
    source: "Google Search",
    domain: "google.com",
    url: "https://www.google.com/search?q=cedarline+mailers"
  };
  const directAttribution = hooks.deriveRetailerAttribution(direct, context);
  const aggregatorWithoutAttribution = hooks.deriveRetailerAttribution(aggregatorWithoutMerchant, context);
  const aggregatorWithAttribution = hooks.deriveRetailerAttribution(aggregatorWithMerchant, context);
  const providerAttribution = hooks.deriveRetailerAttribution(providerResult, context);

  assert(/directretail/i.test(directAttribution.retailerDisplayName || directAttribution.retailerDomain || ""), "Direct retailer domain must label the direct retailer.");
  assertEqual(aggregatorWithoutAttribution.retailerDisplayName, "Instacart", "Aggregator results must not be relabeled without source-backed merchant evidence.");
  assertEqual(aggregatorWithAttribution.retailerDisplayName, "DirectRetail via Instacart", "Aggregator merchant evidence must preserve merchant and platform.");
  assert(/Search provider/i.test(providerAttribution.retailerDisplayName) || providerAttribution.transactionalRetailerEvidence === false, "Search provider pages must not become customer-visible retailers.");

  const deduped = hooks.buildConsumerPricesFound({
    providerSourceRecords: [aggregatorWithMerchant, direct],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 5.5, { identity, buyerIntake });
  assert(/directretail/i.test(deduped[0].retailerDisplayName || ""), "Equivalent direct retailer evidence should replace aggregator duplicates.");
}

function testCollectibleExactSourceAcquisitionAndOrdering() {
  const { buyerIntake, identity, route, context } = buildCollectibleFixture();
  const ladder = hooks.buildCollectibleAttributeSearchLadder(context);
  const exactIndex = ladder.findIndex((query) => /1997 Victory Classic|Coach Lane/i.test(query));
  const broadIndex = ladder.findIndex((query) => /\bvintage\b|\bcollectible\b/i.test(query) && !/1997 Victory Classic|Coach Lane/i.test(query));
  assert(exactIndex >= 0, "Collectible ladder must start from exact identity signatures.");
  assert(broadIndex === -1 || exactIndex < broadIndex, "Exact identity signatures must precede broad family searches.");

  const targets = hooks.buildSecondaryMarketAuctionTargets(context, 12);
  const families = new Set(targets.map((target) => target.sourceFamily));
  assert(families.has("marketplace"), "Bounded collectible targets must include verified sold/completed marketplace sources.");
  assert(families.has("auction"), "Bounded collectible targets must include auction-house sources.");
  assert(families.has("archive"), "Bounded collectible targets must include archive/reference sources.");
  assert(families.has("specialty_dealer"), "Bounded collectible targets must include collectible/specialty transactional sources.");

  const terms = hooks.buildCollectiblePriceTypeRecoveryTerms(context);
  for (const term of ["sold", "completed auction", "buy it now", "active listing", "current bid", "opening bid", "auction estimate", "archive"]) {
    assert(terms.includes(term), `Collectible search terms must include ${term}.`);
  }

  const plan = hooks.buildSerperSearchPlan({
    searchQueries: hooks.buildLiveSearchQueries(identity, route, "Riverton Rockets 1997 Victory Classic metal sign auction sold", buyerIntake),
    sourceRoute: route,
    identity,
    buyerIntake,
    notes: "Riverton Rockets 1997 Victory Classic metal sign auction sold"
  });
  const attempted = plan.filter((record) => record.validationPassed !== false).slice(0, 12);
  assert(attempted.length <= 12, "Non-retail Serper plan should remain within the existing bounded general provider-call budget.");

  const sold = collectibleRecord({
    title: "Riverton Rockets 1997 Victory Classic metal sign sold result",
    url: "https://auction.example/lot/riverton-rockets-1997-victory-classic-sign-sold",
    source: "Auction Example",
    price: 18,
    priceType: "Completed Auction",
    rawExtra: "Completed auction. Sold at auction. Price realized $18."
  });
  const active = collectibleRecord({
    title: "Riverton Rockets 1997 Victory Classic metal sign active listing",
    url: "https://market.example/item/riverton-rockets-1997-victory-classic-sign-active",
    source: "Market Example",
    price: 12,
    priceType: "Active Asking",
    rawExtra: "Active listing. Asking price $12."
  });
  const bid = collectibleRecord({
    title: "Riverton Rockets 1997 Victory Classic metal sign current bid",
    url: "https://bid.example/item/riverton-rockets-1997-victory-classic-sign-current-bid",
    source: "Bid Example",
    price: 7,
    priceType: "Auction Current Bid",
    rawExtra: "Current bid $7."
  });
  const prices = hooks.buildConsumerPricesFound({
    strongComparables: [active, sold, bid],
    searchDiagnostics: { retailEvidenceMode: "collectible-resale" }
  }, 10, { identity, buyerIntake });

  assertEqual(prices[0].priceType, "Completed Auction", "Exact sold/completed auction evidence should lead active asking evidence for collectibles.");
  assert(prices.some((record) => record.priceType === "Auction Current Bid"), "Auction exact current bid should reach the primary compact evidence list.");
}

function testCollectibleIdentityFirewallAndPriceTypes() {
  const { buyerIntake, identity } = buildCollectibleFixture();
  const article = collectibleRecord({
    title: "Riverton Rockets 1997 Victory Classic article",
    url: "https://news.example/riverton-rockets-1997-victory-classic-article",
    source: "News Example",
    price: 22,
    priceType: "Reference Price",
    classification: "Reference Only",
    itemTypeCompatible: false,
    status: "mismatch",
    rawExtra: "Article about the event, not the metal sign object."
  });
  const differentDesign = collectibleRecord({
    title: "Riverton Rockets 1998 Celebration metal sign different design",
    url: "https://market.example/item/riverton-rockets-1998-celebration-sign",
    source: "Market Example",
    price: 30,
    priceType: "Verified Sold",
    classification: "Related Reference",
    itemTypeCompatible: true,
    status: "compatible",
    rawExtra: "Different year and design."
  });
  const noVisible = hooks.buildConsumerPricesFound({
    strongComparables: [article, differentDesign],
    searchDiagnostics: { retailEvidenceMode: "collectible-resale" }
  }, 10, { identity, buyerIntake });
  assertEqual(noVisible.length, 0, "Related articles and wrong designs cannot influence displayed price evidence.");

  const labels = [
    ["Verified Sold", collectibleRecord({ title: "Verified sold item", url: "https://sold.example/a", source: "Sold Example", price: 11, priceType: "Verified Sold", rawExtra: "Sold for $11. Confirmed sold." })],
    ["Active Asking", collectibleRecord({ title: "Active asking item", url: "https://active.example/a", source: "Active Example", price: 12, priceType: "Active Asking", rawExtra: "Active asking price $12." })],
    ["Buy It Now", collectibleRecord({ title: "Buy It Now item", url: "https://buy.example/a", source: "Buy Example", price: 13, priceType: "Buy It Now", rawExtra: "Buy It Now price $13." })],
    ["Auction Current Bid", collectibleRecord({ title: "Current bid item", url: "https://bid.example/a", source: "Bid Example", price: 14, priceType: "Auction Current Bid", rawExtra: "Current bid $14." })],
    ["Auction Opening Bid", collectibleRecord({ title: "Opening bid item", url: "https://open.example/a", source: "Open Example", price: 15, priceType: "Auction Opening Bid", rawExtra: "Opening bid $15." })],
    ["Completed Auction", collectibleRecord({ title: "Completed auction item", url: "https://complete.example/a", source: "Complete Example", price: 16, priceType: "Completed Auction", rawExtra: "Completed auction. Sold at auction. Price realized $16." })],
    ["Closed Unsold Listing", collectibleRecord({ title: "Closed unsold item", url: "https://unsold.example/a", source: "Unsold Example", price: 17, priceType: "Closed Unsold Listing", rawExtra: "Closed unsold. No sale." })],
    ["Auction Estimate", collectibleRecord({ title: "Auction estimate item", url: "https://estimate.example/a", source: "Estimate Example", price: 18, priceType: "Auction Estimate", rawExtra: "Auction estimate $18." })],
    ["Price Unavailable", collectibleRecord({ title: "Price unavailable item", url: "https://unknown.example/a", source: "Unknown Example", price: null, priceType: "Price Unavailable", rawExtra: "Price unavailable." })],
    ["Reference Price", collectibleRecord({ title: "Completed auction without sold proof", url: "https://reference.example/a", source: "Reference Example", price: 19, priceType: "Completed Auction", rawExtra: "Completed auction catalog. No confirmed sold evidence." })]
  ];

  for (const [expected, record] of labels) {
    assertEqual(hooks.normalizePriceTypeLabel(record.priceType, record), expected, `${expected} price type must be preserved.`);
  }
}

function testBuyerDecisionAndDiagnosticTruth() {
  const { buyerIntake, identity, route, context } = buildCollectibleFixture();
  const expensiveSold = collectibleRecord({
    title: "Riverton Rockets 1997 Victory Classic metal sign verified sold",
    url: "https://sold.example/riverton-rockets-1997-victory-classic-sign",
    source: "Sold Example",
    price: 75,
    priceType: "Verified Sold",
    rawExtra: "Sold for $75. Confirmed sold."
  });
  const report = {
    buyerPurpose: "Buying to Resell",
    askingPrice: "$10",
    pricesFound: hooks.buildConsumerPricesFound({
      strongComparables: [expensiveSold],
      searchDiagnostics: { retailEvidenceMode: "collectible-resale" }
    }, 10, { identity, buyerIntake })
  };
  const summary = hooks.summarizeConsumerVisiblePriceEvidence(report.pricesFound);
  const decision = { valueRating: "Exceptional Value", recommendation: "Buy" };
  const offer = hooks.buildConsumerOffer({
    askingPriceNumber: 10,
    fairValueNumber: 75,
    decision,
    conditionProfile: { hasHardRisk: false, hasModerateRisk: false },
    priceEvidence: summary
  });
  const guidance = hooks.buildConsumerNegotiationGuidance("", {
    decision,
    offer,
    reliableCompsFound: true,
    askingPriceNumber: 10,
    fairValueNumber: 75
  });

  assert(offer.openingOfferAmount <= 10, "Opening offer must never exceed asking price.");
  assert(offer.targetPurchasePriceAmount <= 10, "Target negotiation price must never exceed asking price.");
  assertNotMatches(guidance, /negotiate (?:up|above)|raise .*offer/i, "Guidance must never advise negotiating upward.");

  const diagnostics = hooks.buildSerperSearchDiagnostics({
    sourceRoute: route,
    searchQueries: ["Riverton Rockets 1997 Victory Classic metal sign"],
    queriesPrioritized: ["Riverton Rockets 1997 Victory Classic metal sign"],
    providerRequestRecords: [
      hooks.createSerperRequestRecord({
        query: "Riverton Rockets 1997 Victory Classic metal sign",
        priority: 1,
        searchPass: "exact_identity",
        marketplaceDomains: ["ebay.com"],
        validationPassed: true
      })
    ].map((record) => ({ ...record, attempted: true, succeeded: true, providerSourceCount: 1, organicResultCount: 1, returnedResultCount: 1, domainsReturned: ["ebay.com"] })),
    providerResponseSummaries: [],
    records: [expensiveSold],
    providerSourceCount: 1,
    retainedVisibleResultCount: 1,
    rejectedCandidateCount: 0,
    identity,
    buyerIntake,
    notes: "Riverton Rockets 1997 Victory Classic metal sign"
  });

  assertEqual(diagnostics.searchProviderUsed, "Serper Google Search", "Diagnostics must name the actual acquisition/search provider.");
  assertEqual(diagnostics.sourceCategoryExecutionMode, "source_categories_are_query_strategies_not_separate_search_engines", "Diagnostics must not imply source categories are independent engines.");
  assertEqual(diagnostics.providerCallsAttempted, 1, "Diagnostics must report provider calls used.");
  assertEqual(diagnostics.providerCallBudget, 12, "Diagnostics must report the non-retail provider-call ceiling.");
  assertEqual(diagnostics.providerCallBudgetRemaining, 11, "Diagnostics must report remaining call budget.");
  assert(Array.isArray(diagnostics.allowedDomainsRequested), "Diagnostics must report domains requested separately.");
  assert(diagnostics.domainsActuallyReturned.includes("sold.example"), "Diagnostics must report domains returned from records.");
  assertEqual(diagnostics.exactSecondaryMarketVisibleCount, 1, "Diagnostics must count final-visible qualified results separately from raw provider coverage.");
}

function testCompactRendererContractAndProductionGeneralization() {
  const app = readFileSync(path.join(root, "public/app.js"), "utf8");
  const api = readFileSync(path.join(root, "api/generate-listing.js"), "utf8");
  const productionText = [
    api,
    app,
    readFileSync(path.join(root, "public/index.html"), "utf8"),
    readFileSync(path.join(root, "server.ps1"), "utf8"),
    readFileSync(path.join(root, "package.json"), "utf8")
  ].join("\n");
  const compactSummaryStart = app.indexOf("function renderConsumerCompactSummary");
  const compactSummaryEnd = app.indexOf("function renderCustomerTechnicalSearchDetails");
  const compactSummary = compactSummaryStart >= 0 && compactSummaryEnd > compactSummaryStart
    ? app.slice(compactSummaryStart, compactSummaryEnd)
    : "";

  assertIncludes(app, 'list.className = "prices-found-list compact-price-list";', "One compact Where to Buy list container must render customer-visible rows.");
  assertIncludes(app, "buildUnifiedCustomerEvidenceList(report)", "All workflows must route customer price evidence through the unified normalized collection.");
  assertIncludes(app, "Prices and availability can change. Check the retailer before purchasing.", "A single shared availability disclaimer must appear below the compact list.");
  assertNotMatches(compactSummary, /Best Compatible Price Found|Other Compatible Prices Found/, "Legacy best/other visible sections must not return to the primary report.");
  assertNotMatches(productionText, /Office Works Security Envelopes|041226087161|6110325|30188|Georgia Bulldogs Coca-Cola|HOW '?BOUT THEM DAWGS|georgia-coca-cola-tray|office-works-strip-and-seal-security-envelopes/i, "Production code must not contain acceptance-item or exact-source routing literals.");
}

testRetailExactRecoveryAfterCompatibleOnlyFinalList();
testRetailerAttributionAndAggregatorTruth();
testCollectibleExactSourceAcquisitionAndOrdering();
testCollectibleIdentityFirewallAndPriceTypes();
testBuyerDecisionAndDiagnosticTruth();
testCompactRendererContractAndProductionGeneralization();

console.log("Final failed-gate audit checks OK - generic retail, collectible, diagnostic, and compact-list gates verified.");
