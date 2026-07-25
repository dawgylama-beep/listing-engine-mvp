import handler, { __queryIntegrityTestHooks } from "../api/generate-listing.js";

const leakedPhrase = "Perform source-routed live comparable search";
const originalFetch = globalThis.fetch;
const originalEnvKey = process.env.OPENAI_API_KEY;
const originalFallbackKey = process.env.OPEN_API_KEY;
const originalSerperKey = process.env.SERPER_API_KEY;
const fakeSerperKeyValue = ["test", "serper", "placeholder"].join("-");
let activeFixture = null;
let livePayloads = [];
let serperPayloads = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function summarizeCanonicalEvidence(liveSearch = {}, { askingPrice = 10, identity = {}, buyerIntake = null } = {}) {
  if (!liveSearch.finalEvidenceResult) {
    __queryIntegrityTestHooks.buildConsumerPricesFound(liveSearch, askingPrice, {
      identity,
      buyerIntake: buyerIntake || __queryIntegrityTestHooks.normalizeBuyerIntake({})
    });
  }
  return __queryIntegrityTestHooks.summarizeConsumerVisiblePriceEvidence(liveSearch.finalEvidenceResult);
}

function openAIResponse(json, { query = "", citations = [], webSearchCall = false } = {}) {
  const output = [];
  if (webSearchCall) {
    output.push({
      type: "web_search_call",
      action: {
        query,
        sources: citations.map((citation) => ({
          title: citation.title,
          url: citation.url,
          snippet: "Mock source returned by web_search action sources."
        }))
      }
    });
  }
  output.push({
    type: "message",
    content: [
      {
        type: "output_text",
        text: JSON.stringify(json),
        annotations: citations.map((citation) => ({
          type: "url_citation",
          url: citation.url,
          title: citation.title
        }))
      }
    ]
  });

  return {
    ok: true,
    status: 200,
    async json() {
      return { output };
    }
  };
}

function schemaNameFromPayload(payload) {
  return payload?.text?.format?.name || "";
}

function exactQueryFromPayload(payload) {
  const text = payload?.input?.[1]?.content?.[0]?.text || "";
  return (text.match(/Search query to execute exactly:\s*(.+)/) || [])[1]?.trim() || "";
}

function searchPassFromPayload(payload) {
  const text = payload?.input?.[1]?.content?.[0]?.text || "";
  return (text.match(/Search pass:\s*(.+)/) || [])[1]?.trim() || "";
}

function visualRecognitionFor(fixture) {
  if (fixture === "holiday") {
    return {
      visualSubject: "Santa Claus boxed holiday decoration",
      visualSubjectCategory: "holiday decor",
      visualSubjectConfidence: "Medium",
      recognizedOrganization: "",
      recognizedBrand: "Santa's Workshop",
      recognizedCharacter: "Santa Claus",
      recognizedInstitution: "",
      recognizedTheme: "Christmas",
      visibleLogos: ["Santa's Workshop"],
      visibleLetters: [],
      visibleWords: ["Santa's Workshop", "Hubbard Ohio", "GAB031"],
      visibleColors: ["red", "green"],
      distinctiveFeatures: ["boxed seasonal figure"],
      visualEvidence: ["Santa figure", "box label"],
      possibleInterpretations: ["boxed holiday decoration"],
      uncertaintyNotes: ["Exact age not confirmed"],
      visualStyle: "seasonal decor",
      estimatedEraStyle: "vintage-style"
    };
  }

  return {
    visualSubject: "Georgia Bulldogs Coca-Cola collector tray",
    visualSubjectCategory: "sports advertising collectible",
    visualSubjectConfidence: "High",
    recognizedOrganization: "Georgia Bulldogs",
    recognizedBrand: "Coca-Cola",
    recognizedCharacter: "",
    recognizedInstitution: "University of Georgia",
    recognizedTheme: "1980 National Champions",
    visibleLogos: ["Coca-Cola", "Georgia Bulldogs"],
    visibleLetters: ["GEORGIA"],
    visibleWords: ["HOW 'BOUT THEM DAWGS", "1980 NATIONAL CHAMPIONS", "Vince Dooley", "Coca-Cola"],
    visibleColors: ["red", "black", "white"],
    distinctiveFeatures: ["collector tray", "championship wording", "coach name"],
    visualEvidence: ["Coca-Cola script", "Georgia championship wording"],
    possibleInterpretations: ["commemorative sports advertising collector tray"],
    uncertaintyNotes: ["Exact manufacturer date should be verified"],
    visualStyle: "collegiate advertising collectible",
    estimatedEraStyle: "early 1980s"
  };
}

function identityFor(fixture) {
  const visualRecognition = visualRecognitionFor(fixture);
  if (fixture === "holiday") {
    return {
      visualRecognition,
      visualSubject: visualRecognition.visualSubject,
      visualSubjectCategory: visualRecognition.visualSubjectCategory,
      visualSubjectConfidence: "Medium",
      recognizedOrganization: "",
      recognizedBrand: "Santa's Workshop",
      recognizedCharacter: "Santa Claus",
      recognizedInstitution: "",
      recognizedTheme: "Christmas",
      brand: "Santa's Workshop",
      manufacturer: "Unknown",
      teamName: "",
      schoolName: "",
      mascot: "",
      category: "boxed holiday decor",
      likelyItemDescription: "Santa Claus decoration / figurine in box",
      subjectIdentity: "Santa's Workshop Santa Claus holiday figure",
      exactProductIdentity: "Santa's Workshop Hubbard Ohio GAB031 Santa figure",
      exactProductConfidence: "Medium",
      productNameOrBoxTitle: "Santa's Workshop Santa Claus decoration",
      frontBoxWording: "Santa's Workshop Santa Claus",
      backLabelWording: "Hubbard Ohio GAB031",
      manufacturerLocationText: "Hubbard Ohio",
      brandSeries: "Santa's Workshop",
      model: "",
      sku: "GAB031",
      upcBarcode: "",
      styleNumber: "",
      condition: "used",
      currentAskingPrice: "$65",
      visiblePrice: "$65",
      visibleText: ["Santa's Workshop", "Hubbard Ohio", "GAB031"],
      visualIdentityEvidence: ["Santa figure", "boxed holiday decor"],
      textIdentityEvidence: ["Santa's Workshop", "GAB031"],
      strongestSearchableIdentifiers: ["Santa's Workshop Hubbard Ohio GAB031"],
      identitySummary: "Santa's Workshop boxed Santa holiday decoration.",
      identityConflictNotes: [],
      buyerContext: []
    };
  }

  return {
    visualRecognition,
    visualSubject: visualRecognition.visualSubject,
    visualSubjectCategory: visualRecognition.visualSubjectCategory,
    visualSubjectConfidence: "High",
    recognizedOrganization: "Georgia Bulldogs",
    recognizedBrand: "Coca-Cola",
    recognizedCharacter: "",
    recognizedInstitution: "University of Georgia",
    recognizedTheme: "1980 National Champions",
    brand: "Coca-Cola",
    manufacturer: "Coca-Cola",
    teamName: "Georgia Bulldogs",
    schoolName: "University of Georgia",
    mascot: "Bulldogs",
    category: "sports advertising collectible tray",
    likelyItemDescription: "Coca-Cola Georgia Bulldogs 1980 National Champions collector tray",
    subjectIdentity: "Georgia Bulldogs Coca-Cola collector tray",
    exactProductIdentity: "Coca-Cola Georgia Bulldogs 1980 National Champions collector tray",
    exactProductConfidence: "Medium",
    productNameOrBoxTitle: "Coca-Cola Georgia Bulldogs collector's tray",
    frontBoxWording: "1980 NATIONAL CHAMPIONS GEORGIA Coca-Cola Vince Dooley",
    backLabelWording: "HOW 'BOUT THEM DAWGS official Coca-Cola collector's tray",
    manufacturerLocationText: "",
    brandSeries: "official Coca-Cola collegiate collector tray",
    model: "",
    sku: "",
    upcBarcode: "",
    styleNumber: "",
    condition: "used",
    currentAskingPrice: "$10",
    visiblePrice: "$10",
    visibleText: ["HOW 'BOUT THEM DAWGS", "1980 NATIONAL CHAMPIONS", "Vince Dooley", "Coca-Cola", "Georgia Bulldogs"],
    visualIdentityEvidence: ["Coca-Cola logo", "Georgia Bulldogs championship wording", "collector tray shape"],
    textIdentityEvidence: ["HOW 'BOUT THEM DAWGS", "1980 NATIONAL CHAMPIONS", "Vince Dooley"],
    strongestSearchableIdentifiers: ["HOW 'BOUT THEM DAWGS Coca-Cola tray", "1980 NATIONAL CHAMPIONS Georgia Coca-Cola tray"],
    identitySummary: "Coca-Cola Georgia Bulldogs 1980 National Champions collector tray.",
    identityConflictNotes: [],
    buyerContext: []
  };
}

function liveSearchJsonFor(query, zeroResults) {
  if (zeroResults) {
    return {
      comparableItemsFound: [],
      strongComparables: [],
      partialComparables: [],
      referenceResults: [],
      weakMatches: [],
      rejectedMatches: [],
      sourcesSearched: [],
      searchCoverage: ["OpenAI web_search request completed but no reliable URL-cited exact or strong similar matches were returned."],
      searchQueriesUsed: [query],
      noReliableMatchesReason: "No source-backed exact or strong similar matches passed match-quality checks.",
      searchEvidenceSummary: "Live search completed with no retained source-backed comps."
    };
  }

  const isExact = /how '?bout them dawgs|1980 national champions|vince dooley/i.test(query);
  const url = isExact
    ? "https://example.com/georgia-coca-cola-tray"
    : "https://example.com/georgia-collector-reference";
  const title = isExact
    ? "Georgia Bulldogs 1980 National Champions Coca-Cola collector tray"
    : "Georgia Bulldogs Coca-Cola collectible reference";
  const item = `Source: Example Marketplace | Title: ${title} | Price: $24.99 | Shipping: $8.00 | Condition: Used | URL: ${url} | Match quality: ${isExact ? "Exact Match" : "Strong Similar Match"} | Price type: active asking price | Why: Visible Coca-Cola, Georgia Bulldogs, championship tray wording match the submitted item.`;

  return {
    comparableItemsFound: [item],
    strongComparables: [item],
    partialComparables: [],
    referenceResults: [],
    weakMatches: [],
    rejectedMatches: [],
    sourcesSearched: ["example.com"],
    searchCoverage: ["OpenAI web_search returned a source-backed marketplace-style result."],
    searchQueriesUsed: [query],
    noReliableMatchesReason: "",
    searchEvidenceSummary: "Source-backed exact or strong similar evidence was returned."
  };
}

function serperResponseFor(query) {
  if (activeFixture === "zero") {
    return {
      organic: [],
      shopping: [],
      relatedSearches: [{ query: "generic related search that must not become evidence" }]
    };
  }

  if (activeFixture === "holiday") {
    return {
      organic: [
        {
          title: "Santa's Workshop Hubbard Ohio GAB031 Santa Claus holiday figurine",
          link: "https://www.ebay.com/itm/santas-workshop-gab031-santa?utm_source=test",
          snippet: "Active listing for boxed Santa Claus holiday decoration. Price $64.99.",
          position: 1
        },
        {
          title: "Santa's Workshop Christmas decoration reference",
          link: "https://www.etsy.com/listing/santas-workshop-hubbard-ohio-reference",
          snippet: "Vintage-style holiday decor reference with Hubbard Ohio label text.",
          position: 2
        }
      ],
      shopping: [],
      knowledgeGraph: {
        title: "Santa's Workshop",
        website: "https://example.com/santas-workshop-reference",
        description: "Brand/reference identity only, not price evidence."
      },
      relatedSearches: [{ query: "Santa's Workshop Santa figurine" }]
    };
  }

  const exactRecord = {
    title: "1980 Georgia Bulldogs Coca-Cola National Champions collector tray",
    link: "https://www.ebay.com/itm/georgia-coca-cola-tray?utm_source=test",
    snippet: "HOW 'BOUT THEM DAWGS Vince Dooley collector tray active listing. Price $24.99.",
    position: 1
  };
  return {
    organic: [
      exactRecord,
      {
        title: "1981 Georgia Bulldogs Coca-Cola serving tray",
        link: "https://picclick.com/1981-georgia-bulldogs-coca-cola-serving-tray.html",
        snippet: "Similar Georgia Bulldogs Coca-Cola collector serving tray. Asking price $29.99.",
        position: 2
      },
      {
        title: "Georgia Bulldogs Coca-Cola championship bottle",
        link: "https://www.ebay.com/itm/georgia-coca-cola-bottle",
        snippet: "Bottle, not a tray. Asking $12.00.",
        position: 3
      },
      {
        title: "Vintage Coca-Cola serving tray",
        link: "https://www.etsy.com/listing/generic-coca-cola-serving-tray",
        snippet: "Generic Coca-Cola tray without Georgia Bulldogs identity. Price $18.00.",
        position: 4
      },
      {
        ...exactRecord,
        link: "https://www.ebay.com/itm/georgia-coca-cola-tray?utm_medium=duplicate",
        position: 5
      }
    ],
    shopping: [
      {
        title: "Georgia Bulldogs Coca-Cola collector tray shopping result",
        link: "https://www.mercari.com/us/item/georgia-coca-cola-tray/",
        source: "Mercari",
        price: "$22.00",
        delivery: "$7.99 delivery",
        position: 1
      }
    ],
    knowledgeGraph: {
      title: "Georgia Bulldogs football",
      website: "https://georgiadogs.com",
      description: "Reference identity only; not a price comp."
    },
    relatedSearches: [{ query: "Georgia Bulldogs Coca-Cola tray" }]
  };
}

function serperHttpResponse(json) {
  return {
    ok: true,
    status: 200,
    async json() {
      return json;
    }
  };
}

function consumerDecisionJson(zeroResults) {
  return {
    buyerIntent: "personal_use",
    identifiedItem: activeFixture === "holiday" ? "Santa's Workshop Santa Claus holiday figure" : "Georgia Bulldogs Coca-Cola 1980 National Champions collector tray",
    identificationConfidence: "Medium - visible wording and typed notes agree.",
    evidenceFoundInPhotos: ["Visible brand and item text were used."],
    purchaseContextSummary: "Purchase context supplied by buyer intake.",
    barcodeSearchStatus: "No readable barcode/UPC digits were supplied in this mock scenario.",
    localStoreContext: "Not applicable unless Retail store is selected.",
    retailPriceContext: "Not applicable unless Retail store or Online retailer is selected.",
    packageUnitPriceContext: "Package size/count was not established in this mock scenario.",
    askingPrice: activeFixture === "holiday" ? "$65" : "$10",
    estimatedFairMarketValue: zeroResults ? "$20-$30" : "$20-$35",
    fairPriceRange: zeroResults ? ["$20-$30"] : ["$20-$35"],
    valueRating: zeroResults ? "Insufficient Evidence" : "Good Value",
    recommendation: zeroResults ? "Buy" : "Buy",
    recommendedOffer: ["Offer only if condition and identity check out."],
    openingOffer: "Opening Offer: $8",
    targetPurchasePrice: "Target Purchase Price: $10",
    maximumRecommendedPrice: "Maximum Recommended Price: $12",
    walkAwayPrice: "Walk-Away Price: $15",
    negotiationGuidance: "Keep the offer tied to condition and source-backed evidence.",
    reasonsToBuy: ["Low asking price limits downside."],
    reasonsForCaution: zeroResults ? ["Weak Comparable Evidence"] : ["Active asking prices are not confirmed sold prices."],
    productOrConditionRisks: zeroResults ? ["Weak Comparable Evidence", "Older Model"] : ["Condition should be checked."],
    riskFlags: zeroResults ? ["Weak Comparable Evidence"] : [],
    betterValueConsiderations: zeroResults ? ["Wait for a similar item."] : [],
    researchResults: zeroResults ? ["No retained source-backed comps."] : ["Source-backed exact/strong similar active listing returned."],
    comparableQuality: zeroResults ? ["No reliable comps retained."] : ["Exact or strong identity evidence with active asking price."],
    pricingConfidence: zeroResults ? "Low - no retained source-backed comps." : "Medium - source-backed active listing evidence.",
    pricingRationale: zeroResults ? "AI-only reasoning should remain low confidence." : "Pricing uses source-backed active listing evidence.",
    additionalInformationNeeded: zeroResults ? ["Source-backed exact comparable result."] : [],
    searchQueriesUsed: [],
    sourcesSearched: []
  };
}

globalThis.fetch = async (_url, options = {}) => {
  if (_url === "https://google.serper.dev/search" || _url === "https://google.serper.dev/shopping") {
    const payload = JSON.parse(options.body);
    serperPayloads.push({
      endpoint: _url.endsWith("/shopping") ? "shopping" : "search",
      q: payload.q,
      gl: payload.gl,
      hl: payload.hl,
      num: payload.num,
      hasApiKeyHeader: Boolean(options.headers && options.headers["X-API-KEY"]),
      headerValue: options.headers && options.headers["X-API-KEY"]
    });
    return serperHttpResponse(serperResponseFor(payload.q));
  }

  const payload = JSON.parse(options.body);
  const schema = schemaNameFromPayload(payload);

  if (schema === "visual_subject_recognition") {
    return openAIResponse(visualRecognitionFor(activeFixture));
  }

  if (schema === "item_identity") {
    return openAIResponse(identityFor(activeFixture));
  }

  if (schema === "live_comparable_search") {
    const query = exactQueryFromPayload(payload);
    const tool = payload.tools?.[0] || {};
    livePayloads.push({
      query,
      searchPass: searchPassFromPayload(payload),
      toolChoice: payload.tool_choice,
      toolType: tool.type,
      searchContextSize: tool.search_context_size,
      allowedDomains: tool.filters?.allowed_domains || [],
      include: payload.include || [],
      bodyText: payload.input?.[1]?.content?.[0]?.text || ""
    });
    const zeroResults = activeFixture === "zero";
    const citations = zeroResults ? [] : [{ url: "https://example.com/georgia-coca-cola-tray", title: "Georgia Bulldogs Coca-Cola tray" }];
    return openAIResponse(liveSearchJsonFor(query, zeroResults), { query, citations, webSearchCall: true });
  }

  if (schema === "consumer_purchase_decision") {
    return openAIResponse(consumerDecisionJson(activeFixture === "zero"));
  }

  throw new Error(`Unexpected mocked schema: ${schema}`);
};

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

async function runScenario(fixture, bodyOverrides = {}) {
  activeFixture = fixture;
  livePayloads = [];
  serperPayloads = [];
  const req = {
    method: "POST",
    body: {
      analysisId: `analysis-test-${fixture}`,
      platform: "",
      notes: fixture === "holiday"
        ? "Santa's Workshop Hubbard Ohio GAB031 Santa Claus boxed holiday decoration asking $65"
        : "Georgia Bulldogs Coca-Cola collector tray HOW 'BOUT THEM DAWGS 1980 NATIONAL CHAMPIONS Vince Dooley asking $10",
      reportType: "marketValue",
      buyerIntake: {
        purchase_context: "facebook_marketplace",
        asking_price: fixture === "holiday" ? "$65" : "$10",
        purchase_intent: "personal_use",
        item_condition: "used",
        item_name: fixture === "holiday" ? "Santa's Workshop Santa figure" : "Georgia Bulldogs Coca-Cola tray",
        known_brand: fixture === "holiday" ? "Santa's Workshop" : "Coca-Cola",
        buyer_notes: fixture === "holiday" ? "Hubbard Ohio GAB031" : "HOW 'BOUT THEM DAWGS 1980 NATIONAL CHAMPIONS Vince Dooley"
      },
      photos: [{ name: `${fixture}.jpg`, dataUrl: "data:image/jpeg;base64,AAAA" }],
      ...bodyOverrides
    }
  };
  const res = createResponse();
  await handler(req, res);
  assert(res.statusCode === 200, `${fixture} scenario should return 200, got ${res.statusCode}: ${JSON.stringify(res.payload)}`);
  return { report: res.payload.valuation, livePayloads: [...livePayloads], serperPayloads: [...serperPayloads], json: JSON.stringify(res.payload) };
}

try {
  process.env.OPENAI_API_KEY = "test-openai-key-not-real";
  delete process.env.OPEN_API_KEY;
  process.env.SERPER_API_KEY = fakeSerperKeyValue;

  const georgiaQueryContext = {
    brand: "Coca-Cola",
    visualBrand: "Coca-Cola",
    manufacturer: "Coca-Cola",
    visualOrganization: "Georgia Bulldogs",
    schoolName: "University of Georgia",
    teamName: "Georgia Bulldogs",
    subjectIdentity: "Georgia Bulldogs Coca-Cola collector tray",
    productTitle: "Coca-Cola Georgia Bulldogs collector tray",
    exactProductIdentity: "Coca-Cola Georgia Bulldogs 1980 National Champions collector tray",
    itemType: "collector tray",
    categoryPhrase: "sports advertising collectible tray",
    visualCategory: "sports advertising collectible",
    distinctivePhrases: ["GEORGIA", "1980 NATIONAL CHAMPIONS", "Official Bulldogs", "HOW 'BOUT THEM DAWGS"],
    eventPhrases: ["1980 NATIONAL CHAMPIONS"],
    namedPeople: ["Vince Dooley"],
    years: ["1980"]
  };
  const georgiaIdentity = identityFor("georgia");
  const retailBuyerIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    asking_price: "$6",
    purchase_intent: "personal_use",
    store_name: "Staples",
    location_zip: "44484",
    item_name: "security envelopes",
    known_brand: "Example Office",
    known_upc: "661565005611",
    buyer_notes: "100 count security envelopes peel and seal"
  });
  const retailIdentity = {
    brand: "Example Office",
    manufacturer: "Example Office",
    model: "",
    sku: "ENV100",
    upcBarcode: "661565005611",
    styleNumber: "",
    category: "boxed envelopes",
    productNameOrBoxTitle: "Example Office Security Envelopes",
    exactProductIdentity: "Example Office security envelopes 100 count",
    subjectIdentity: "boxed security envelopes",
    likelyItemDescription: "100-count peel-and-seal security envelopes",
    frontBoxWording: "Security Envelopes 100 Count Peel & Seal",
    backLabelWording: "UPC 661565005611",
    packageQuantity: "100-count",
    packageSize: "#10 envelopes",
    unitCount: "100",
    visibleText: ["Security Envelopes", "100 Count", "661565005611"],
    identityConflictNotes: [],
    strongestSearchableIdentifiers: ["661565005611", "Example Office security envelopes 100 count"],
    visualRecognition: {
      visualSubject: "box of security envelopes",
      visualSubjectCategory: "office supplies",
      recognizedBrand: "Example Office"
    }
  };
  const retailRoute = __queryIntegrityTestHooks.routeMarketSources(retailIdentity, retailBuyerIntake, "");
  assert(/retail-store current replacement-cost sources/i.test(retailRoute.join(" ")), "Retail store purchases should route to current retail replacement-cost sources first.");
  assert(!/eBay-style resale results/i.test(retailRoute.join(" ")), "Ordinary retail-store consumables should not prioritize eBay-style resale results.");
  const retailQueries = __queryIntegrityTestHooks.buildLiveSearchQueries(retailIdentity, retailRoute, "100 count security envelopes asking $6", retailBuyerIntake);
  assert(retailQueries[0] === "661565005611", "Readable UPC should be the first-priority retail search identifier.");
  assert(retailQueries.some((query) => /661565005611/i.test(query) && /Staples/i.test(query)), "Store name plus UPC should be generated as a separate retail query.");
  assert(retailQueries.some((query) => /current retail price|shopping replacement cost/i.test(query)), "Retail route should generate current retail/replacement-cost queries.");
  const retailPlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: retailQueries,
    sourceRoute: retailRoute,
    identity: retailIdentity,
    buyerIntake: retailBuyerIntake,
    notes: "100 count security envelopes asking $6"
  });
  assert(retailPlan.some((record) => record.query === "661565005611" && record.validationPassed !== false), "Exact UPC-alone Serper query should pass validation.");
  assert(retailPlan.some((record) => /Staples/i.test(record.query) && /661565005611/.test(record.query)), "Serper plan should include store plus UPC query.");
  const packMismatch = __queryIntegrityTestHooks.evaluateComparableItemTypeCompatibility(
    { title: "Example Office Security Envelopes 25 Count", snippet: "25-count peel-and-seal #10 envelopes.", url: "https://example.com/25-count-envelopes" },
    retailIdentity,
    __queryIntegrityTestHooks.buildSearchQueryContext(retailIdentity, retailRoute, "100 count security envelopes", retailBuyerIntake)
  );
  assert(packMismatch.itemTypeCompatible === true, "Same-family retail envelope pack-count differences should reach retail compatibility review instead of being rejected as item-type mismatches.");
  const tooWideRetailPack = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Example Office Security Envelopes 25 Count",
      rawText: "Example Office security envelopes 25 count peel-and-seal current retail price $3.99",
      itemPriceAmount: 3.99,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/25-count-envelopes"
    },
    retailIdentity,
    retailBuyerIntake
  );
  assert(tooWideRetailPack.label === "Rejected Retail Mismatch", "A 25-count box should still be rejected for a submitted 100-count package when the package relationship is too wide.");
  const compatibleQuantity = __queryIntegrityTestHooks.extractPackQuantityNumber("100-count security envelopes");
  assert(compatibleQuantity === 100, "Pack quantity parser should extract 100-count retail quantities.");
  assert(__queryIntegrityTestHooks.formatMoney(5.5) === "$5.50", "formatMoney should preserve $5.50 instead of rounding to $6.");
  assert(__queryIntegrityTestHooks.formatSourceMoney(6) === "$6.00", "formatSourceMoney should show cents for whole-dollar source prices.");
  assert(__queryIntegrityTestHooks.formatUnitMoney(5.5 / 45) === "$0.122", "Sub-dollar unit prices should retain useful precision.");
  assert(__queryIntegrityTestHooks.formatUnitCents(5.5 / 45) === "12.2 cents", "Submitted $5.50 divided by 45 should display as about 12.2 cents each.");
  assert(__queryIntegrityTestHooks.parseCurrencyCents("$5.50") === 550, "Currency parser should store $5.50 as 550 cents.");
  assert(__queryIntegrityTestHooks.moneyAmountToCents(5.5) === 550, "Money amount helper should convert decimal dollars to cents.");
  assert(__queryIntegrityTestHooks.extractDisplayedPrice("Sale price $5 - $7 for a package") === "$5", "Price extractor should handle visible price ranges without inventing precision.");
  assert(__queryIntegrityTestHooks.extractDisplayedPrice("Was $7.99. Now $5.50 for the package.") === "$5.50", "Price extractor should prefer sale/current price context over original price.");
  assert(__queryIntegrityTestHooks.extractDisplayedPrice("1,024 reviews. Shipping $7.99. Price $5.50.") === "$5.50", "Price extractor should not use review counts or shipping amounts as the item price.");
  assert(__queryIntegrityTestHooks.extractDisplayedPrice("Shipping $7.99 only") === "", "Shipping-only amounts should not become item prices.");
  assert(__queryIntegrityTestHooks.normalizePriceTypeLabel("Shopping Offer", { title: "Security envelopes", priceType: "Shopping Offer" }) === "Active Asking", "Shopping-result prices should normalize as current active retail offers.");
  const parsedRetailSerper = __queryIntegrityTestHooks.parseSerperResponse({
    organic: [
      {
        title: "Staples Security Envelopes 40 Count Self Seal",
        link: "https://example.com/staples-security-envelopes-40",
        snippet: "1,024 reviews. Shipping $7.99. Price $4.99.",
        position: 1
      }
    ],
    shopping: [
      {
        title: "Pen+Gear Security Envelopes 100 Count Self Seal",
        link: "https://example.com/pen-gear-security-envelopes-100",
        source: "Walmart",
        price: "$8.99",
        delivery: "Shipping not shown",
        position: 1
      }
    ]
  }, {
    query: "security envelopes strip and seal current price",
    searchPass: "stage_5_shopping_general",
    searchType: "shopping",
    providerEndpoint: "serper_shopping"
  });
  assert(parsedRetailSerper.organicResultCount === 1 && parsedRetailSerper.shoppingResultCount === 1, "Serper parser should count organic and shopping retail results.");
  assert(parsedRetailSerper.records.some((record) => record.sourceType === "organic" && record.displayedPriceText === "$4.99" && record.parsedPrice === 4.99), "Organic retail prices should be parsed from price context without using shipping.");
  assert(parsedRetailSerper.records.some((record) => record.sourceType === "shopping" && record.displayedPriceText === "$8.99" && record.parsedPrice === 8.99), "Shopping-result prices should be parsed from structured shopping price fields.");
  assert(parsedRetailSerper.records.every((record) => record.searchType === "shopping" && record.providerEndpoint === "serper_shopping"), "Shopping records should retain the dedicated endpoint/search type metadata.");
  assert(__queryIntegrityTestHooks.classifySerperStatus(404, { message: "unknown endpoint" }, "shopping") === "serper_shopping_unavailable", "Shopping endpoint failures should be classified as Shopping unavailable, not zero Shopping results.");
  const validUpc = __queryIntegrityTestHooks.validateRetailBarcodeCandidate("041226087161");
  assert(validUpc.valid === true && validUpc.format === "UPC-A", "Valid UPC-A should pass check-digit validation.");
  const transposedUpc = __queryIntegrityTestHooks.validateRetailBarcodeCandidate("014226087161");
  assert(transposedUpc.valid === false && transposedUpc.reason === "check_digit_failed", "Transposed UPC-A digits should fail check-digit validation.");
  const alternateBarcodeIntegrity = __queryIntegrityTestHooks.buildBarcodeIntegrity({
    upcBarcode: "014226087161",
    backLabelWording: "OCR saw 014226087161; visible UPC 041226087161",
    visibleText: ["041226087161", "Office Works Security Envelopes"]
  }, __queryIntegrityTestHooks.normalizeBuyerIntake({ purchase_context: "retail_store" }));
  assert(alternateBarcodeIntegrity.acceptedSequence === "041226087161", "Alternate valid OCR candidate should replace a failed first barcode candidate only when visible evidence supports it.");
  assert(alternateBarcodeIntegrity.rejectedCandidates.some((candidate) => candidate.sequence === "014226087161"), "Rejected barcode candidates should be retained for Technical Search Details.");
  assert(typeof __queryIntegrityTestHooks.buildRetailDecisionCalibration === "undefined", "The superseded retail decision calibrator must remain deleted.");
  const officeWorksIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    asking_price: "$6",
    purchase_intent: "personal_use",
    store_name: "Kroger",
    location_zip: "30188",
    item_name: "Office Works Security Envelopes",
    known_brand: "Office Works",
    known_sku: "6110325",
    known_upc: "041226087161",
    buyer_notes: "Office Works Security Envelopes 45 count Strip & Seal item number 6110325"
  });
  const officeWorksExtractedIdentity = {
    brand: "Office Works",
    manufacturer: "Office Works",
    sku: "6110325",
    upcBarcode: "041226087161",
    category: "office supplies",
    productNameOrBoxTitle: "Office Works Security Envelopes",
    exactProductIdentity: "Office Works poster print",
    subjectIdentity: "Office Works poster print",
    likelyItemDescription: "poster print",
    frontBoxWording: "Office Works Security Envelopes 45 Count Strip & Seal",
    backLabelWording: "UPC 041226087161 Item 6110325",
    dimensions: "4.12 x 9.5 inches",
    packageSize: "4.12 x 9.5 inches",
    packageQuantity: "45 count",
    visibleText: ["Office Works", "Security Envelopes", "45 Count", "Strip & Seal", "4.12 x 9.5 inches", "6110325", "041226087161"],
    visualRecognition: {
      visualSubject: "Office Works poster print",
      visualSubjectCategory: "poster print",
      possibleInterpretations: ["poster print"]
    },
    identityConflictNotes: []
  };
  const officeWorksIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch(officeWorksExtractedIdentity, officeWorksIntake);
  assert(/Office Works Security Envelopes/i.test(officeWorksIdentity.canonicalProductIdentity.customerFacingTitle), "Canonical identity should preserve Office Works security envelopes.");
  assert(/poster print/i.test(JSON.stringify(officeWorksIdentity.canonicalProductIdentity.conflictingCandidatesRejected)), "Conflicting poster print should be retained only as a rejected diagnostic.");
  assert(!officeWorksIdentity.canonicalProductIdentity.userConfirmationRequired, "Strong UPC/OCR/package evidence should resolve weak visual conflict without interrupting the user.");
  const officeWorksPackageField = officeWorksIdentity.canonicalProductIdentity.fields.packageQuantity;
  const officeWorksDimensionField = officeWorksIdentity.canonicalProductIdentity.fields.dimensionsOrSize;
  assert(officeWorksPackageField.value === "45-count" && officeWorksPackageField.status === "accepted", "Visible 45 count should produce accepted canonical package quantity 45-count.");
  assert(/45 Count/i.test(officeWorksPackageField.sources.join(" ")), "Canonical package quantity should retain explicit quantity evidence.");
  assert(/4\.12 x 9\.5 inches/i.test(officeWorksDimensionField.value), "Dimensions should remain in the dimensions field.");
  assert(!/4-count/i.test(JSON.stringify(officeWorksPackageField)), "The 4.12-inch dimension must not become 4-count package evidence.");
  assert(__queryIntegrityTestHooks.extractPackQuantityNumber("4.12 x 9.5 inches") === null, "Decimal dimensions must never truncate into 4 count.");
  assert(__queryIntegrityTestHooks.extractPackQuantityNumber("4.125 x 9.5 inches security envelopes") === null, "Decimal fractions in dimensions must never become package counts.");
  assert(__queryIntegrityTestHooks.extractPackQuantityNumber("#10 envelopes 4.125 x 9.5 inches") === null, "Envelope size numbers should not become quantity evidence.");
  assert(__queryIntegrityTestHooks.extractPackQuantityNumber("pack of 45 security envelopes") === 45, "Explicit pack-of quantity wording should remain supported.");
  const officeWorksNoCountIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    asking_price: "$5.50",
    purchase_intent: "personal_use",
    store_name: "Kroger",
    location_zip: "30188",
    item_name: "Office Works Security Envelopes",
    known_brand: "Office Works",
    known_sku: "6110325",
    known_upc: "041226087161",
    buyer_notes: "Office Works Security Envelopes Strip & Seal item number 6110325"
  });
  const suspiciousFourCountIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch({
    ...officeWorksExtractedIdentity,
    frontBoxWording: "Office Works Security Envelopes Strip & Seal 4.12 x 9.5 inches",
    packageQuantity: "4 count",
    unitCount: "4",
    visibleText: ["Office Works", "Security Envelopes", "Strip & Seal", "4.12 x 9.5 inches", "6110325", "041226087161"]
  }, officeWorksNoCountIntake);
  assert(suspiciousFourCountIdentity.canonicalProductIdentity.fields.packageQuantity.status === "uncertain", "Unsupported 4 count for ordinary security envelopes should become uncertain.");
  assert(suspiciousFourCountIdentity.canonicalProductIdentity.uncertainPackageQuantityCandidate === "4-count", "Uncertain low quantity candidate should be retained only as diagnostic evidence.");
  assert(!suspiciousFourCountIdentity.packageQuantity, "Uncertain package quantity must not be copied back as the searchable identity quantity.");
  assert(__queryIntegrityTestHooks.getSearchablePackageQuantity(suspiciousFourCountIdentity, officeWorksNoCountIntake, suspiciousFourCountIdentity.canonicalProductIdentity) === "", "Uncertain package quantity must not be searchable package quantity.");
  const suspiciousFourCountRoute = __queryIntegrityTestHooks.routeMarketSources(suspiciousFourCountIdentity, officeWorksNoCountIntake, "");
  const suspiciousFourCountQueries = __queryIntegrityTestHooks.buildLiveSearchQueries(suspiciousFourCountIdentity, suspiciousFourCountRoute, "Office Works Security Envelopes 4.12 x 9.5 inches", officeWorksNoCountIntake);
  const suspiciousFourCountPlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: suspiciousFourCountQueries,
    sourceRoute: suspiciousFourCountRoute,
    identity: suspiciousFourCountIdentity,
    buyerIntake: officeWorksNoCountIntake,
    notes: "Office Works Security Envelopes 4.12 x 9.5 inches asking $5.50 at Kroger ZIP 30188"
  });
  assert(!suspiciousFourCountPlan.some((record) => /\b4\s*count\b|4-count/i.test(record.query)), "Unsupported 4 count must not drive generated or attempted retailer queries.");
  assert(!suspiciousFourCountPlan.some((record) => /stage_3_compatible_alternatives/.test(record.retailStage || "") && /\b(?:40|45|50|100)\s*count\b/i.test(record.query)), "Uncertain count must not generate fixed-count alternative queries.");
  const unknownCountIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch({
    ...officeWorksExtractedIdentity,
    frontBoxWording: "Office Works Security Envelopes Strip & Seal",
    packageQuantity: "",
    unitCount: "",
    visibleText: ["Office Works", "Security Envelopes", "Strip & Seal", "4.12 x 9.5 inches", "6110325", "041226087161"]
  }, officeWorksNoCountIntake);
  assert(unknownCountIdentity.canonicalProductIdentity.fields.packageQuantity.status === "unknown", "Unknown package count should remain unknown.");
  const unknownCountRoute = __queryIntegrityTestHooks.routeMarketSources(unknownCountIdentity, officeWorksNoCountIntake, "");
  const unknownCountPlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: __queryIntegrityTestHooks.buildLiveSearchQueries(unknownCountIdentity, unknownCountRoute, "Office Works Security Envelopes no visible quantity", officeWorksNoCountIntake),
    sourceRoute: unknownCountRoute,
    identity: unknownCountIdentity,
    buyerIntake: officeWorksNoCountIntake,
    notes: "Office Works Security Envelopes asking $5.50 at Kroger ZIP 30188"
  });
  assert(!unknownCountPlan.some((record) => /stage_3_compatible_alternatives/.test(record.retailStage || "") && /\b\d{1,4}\s*count\b/i.test(record.query)), "Unknown quantity must not invent fixed-count alternative queries.");
  const officeWorksRoute = __queryIntegrityTestHooks.routeMarketSources(officeWorksIdentity, officeWorksIntake, "");
  const officeWorksQueries = __queryIntegrityTestHooks.buildLiveSearchQueries(officeWorksIdentity, officeWorksRoute, "Office Works poster print maybe envelopes", officeWorksIntake);
  assert(officeWorksQueries[0] === "041226087161", "Office Works exact UPC should be first retail query.");
  assert(officeWorksQueries.some((query) => /^Kroger\s+041226087161$/i.test(query)), "Kroger plus exact UPC should be generated separately.");
  assert(officeWorksQueries.some((query) => /^041226087161\s+site:kroger\.com$/i.test(query)), "Known retailer-domain plus UPC should be generated.");
  assert(officeWorksQueries.some((query) => /Office Works 6110325/i.test(query)), "Brand plus item number should be generated.");
  assert(officeWorksQueries.some((query) => /Office Works security envelopes 45 count/i.test(query)), "Brand plus product type plus package count should be generated.");
  assert(!officeWorksQueries.some((query) => /poster|print/i.test(query)), "Unsupported poster print terms must not enter retail search queries.");
  assert(!officeWorksQueries.some((query) => /\b(?:sold|auction|completed|opening bid|historical sale|eBay sold)\b/i.test(query)), "Retail-store route must suppress resale-oriented query terms for ordinary current products.");
  const officeWorksPlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: officeWorksQueries,
    sourceRoute: officeWorksRoute,
    identity: officeWorksIdentity,
    buyerIntake: officeWorksIntake,
    notes: "Office Works Security Envelopes strip and seal 45 count asking $5.50 at Kroger ZIP 30188"
  });
  const officeWorksRequestRecords = officeWorksPlan.map((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record));
  const officeWorksAttempted = officeWorksRequestRecords.filter((record) => record.attempted);
  const officeWorksAttemptedQueries = officeWorksAttempted.map((record) => record.query);
  assert(officeWorksAttemptedQueries[0] === "041226087161", "Exact UPC search should execute first in the retail staged plan.");
  assert(officeWorksAttempted.length <= __queryIntegrityTestHooks.retailSerperBudgetAllocation.maxProviderCalls, "Retail recovery provider-call budget should stay bounded.");
  assert(officeWorksAttempted.filter((record) => record.retailBudgetBucket === "exactIdentity").length <= __queryIntegrityTestHooks.retailSerperBudgetAllocation.exactIdentity, "Exact-query allocation cannot consume the entire retail recovery budget.");
  assert(officeWorksAttempted.some((record) => record.retailStage === "stage_2_exact_product_reduced"), "Exact miss recovery should include Stage 2 reduced exact-product queries.");
  assert(officeWorksAttempted.some((record) => record.retailStage === "stage_3_compatible_alternatives"), "Compatible-alternative recovery queries should be executed, not merely planned.");
  assert(officeWorksAttempted.some((record) => /security envelopes strip and seal .*40 count/i.test(record.query)), "Stage 3 should execute a compatible 40-count security-envelope query.");
  assert(officeWorksAttempted.some((record) => /security envelopes strip and seal .*45 count/i.test(record.query)), "Stage 3 should execute a compatible 45-count security-envelope query.");
  assert(officeWorksAttempted.some((record) => /security envelopes strip and seal .*50 count/i.test(record.query)), "Stage 3 should execute a compatible 50-count security-envelope query.");
  assert(officeWorksAttempted.some((record) => /security envelopes strip and seal .*100 count/i.test(record.query)), "Stage 3 should execute a compatible 100-count security-envelope query.");
  assert(officeWorksAttempted.some((record) => record.retailStage === "stage_4_retailer_specific" && /\bWalmart\b/i.test(record.query)), "Retailer-specific recovery should execute separate Walmart queries.");
  assert(officeWorksAttempted.some((record) => record.retailStage === "stage_4_retailer_specific" && /\bStaples\b/i.test(record.query)), "Retailer-specific recovery should execute separate Staples queries.");
  assert(officeWorksAttempted.filter((record) => record.retailStage === "stage_4_retailer_specific").every((record) => !/\bOR\b/.test(record.query)), "Retailer-specific recovery must not rely on one large OR query.");
  for (const [retailer, domain] of [["Kroger", "kroger.com"], ["Walmart", "walmart.com"], ["Target", "target.com"], ["Staples", "staples.com"], ["Office Depot", "officedepot.com"]]) {
    assert(officeWorksAttempted.some((record) => record.retailStage === "stage_4_retailer_specific" && new RegExp(`\\b${retailer}\\b`, "i").test(record.query) && record.query.includes(`site:${domain}`)), `${retailer} recovery should be domain constrained to ${domain}.`);
  }
  const officeWorksShoppingRequests = officeWorksAttempted.filter((record) => record.retailStage === "stage_5_shopping_general");
  assert(officeWorksShoppingRequests.length > 0, "Shopping recovery queries should execute within the retail budget.");
  assert(officeWorksShoppingRequests.every((record) => record.searchType === "shopping" && record.providerEndpoint === "serper_shopping"), "Stage 5 retail recovery must use the dedicated Shopping endpoint metadata.");
  assert(officeWorksAttempted.some((record) => record.retailStage === "stage_6_local_retail" && /30188/.test(record.query)), "A usable ZIP should reserve and execute a location-aware retail stage.");
  assert(officeWorksAttempted.some((record) => record.retailStage === "stage_6_local_retail" && record.searchType === "organic_web" && record.providerEndpoint === "serper_search"), "Location-aware retail execution should use the organic web endpoint unless a separate local provider exists.");
  assert(officeWorksAttempted.filter((record) => record.retailStage === "stage_4_retailer_specific").every((record) => /\b45\s*count\b/i.test(record.query) && !/\b40\s*count\b/i.test(record.query)), "Retailer-specific recovery should lead with the confirmed 45 count, not the lower nearby count.");
  assert(officeWorksAttempted.some((record) => record.retailStage === "stage_6_local_retail" && /\b45\s*count\b/i.test(record.query) && !/\b40\s*count\b/i.test(record.query)), "ZIP/local retail recovery should lead with the confirmed 45 count.");
  assert(officeWorksRequestRecords.every((record) => record.generatedStatus === "generated" && record.plannedStatus === "planned" && typeof record.attempted === "boolean" && typeof record.succeeded === "boolean" && Number.isFinite(record.returnedResultCount) && Number.isFinite(record.qualifiedResultCount)), "Generated, planned, attempted, succeeded, returned, and qualified states should remain distinct on provider request records.");
  const officeWorksContext = __queryIntegrityTestHooks.buildSearchQueryContext(
    officeWorksIdentity,
    officeWorksRoute,
    "Office Works Security Envelopes 45 count",
    officeWorksIntake
  );
  const shoppingUnavailableDiagnostics = __queryIntegrityTestHooks.buildRetailSearchDiagnostics({
    context: officeWorksContext,
    providerRequestRecords: officeWorksRequestRecords.map((record) => record.retailStage === "stage_5_shopping_general"
      ? { ...record, attempted: true, succeeded: false, errorCode: "serper_shopping_unavailable", failureStage: "serper_shopping_unavailable" }
      : record),
    records: [],
    searchQueries: officeWorksQueries
  });
  assert(shoppingUnavailableDiagnostics.shoppingEndpointAttempted === "Yes" && shoppingUnavailableDiagnostics.shoppingEndpointUnavailable === "Yes", "Shopping unavailable should be distinguishable from not attempted.");
  assert(/Shopping execution unavailable/i.test(shoppingUnavailableDiagnostics.shoppingExecutionStatus), "Shopping unavailable should be labeled unavailable, not searched with zero results.");
  const shoppingZeroDiagnostics = __queryIntegrityTestHooks.buildRetailSearchDiagnostics({
    context: officeWorksContext,
    providerRequestRecords: officeWorksRequestRecords.map((record) => record.retailStage === "stage_5_shopping_general"
      ? { ...record, attempted: true, succeeded: true, shoppingResultCount: 0, providerSourceCount: 0, returnedResultCount: 0 }
      : record),
    records: [],
    searchQueries: officeWorksQueries
  });
  assert(/Shopping endpoint attempted; 0 shopping results returned/i.test(shoppingZeroDiagnostics.shoppingExecutionStatus), "Shopping attempted with zero results should remain different from Shopping unavailable.");
  const localUnattemptedDiagnostics = __queryIntegrityTestHooks.buildRetailSearchDiagnostics({
    context: officeWorksContext,
    providerRequestRecords: officeWorksRequestRecords.map((record) => record.retailStage === "stage_6_local_retail"
      ? { ...record, attempted: false, succeeded: false, providerSourceCount: 0, returnedResultCount: 0 }
      : record),
    records: [],
    searchQueries: officeWorksQueries
  });
  assert(localUnattemptedDiagnostics.locationAwareRetailSearchStatus === "Location was provided, but no location-aware retail search was executed.", "Generated but unattempted ZIP query must not imply local search occurred.");
  assert(__queryIntegrityTestHooks.buildRetailLocalAvailabilityContext(officeWorksIntake, { searchDiagnostics: localUnattemptedDiagnostics }) === "Location was provided, but no location-aware retail search was executed.", "Customer report should use attempted execution, not ZIP presence, for local retail language.");
  const detectedZipIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    ...officeWorksIntake,
    location_mode: "browser_location_zip",
    location_state: "zip-resolved",
    location_permission: "granted",
    location_area: "Woodstock, GA 30188"
  });
  const manualZipLocalQuery = officeWorksAttempted.find((record) => record.retailStage === "stage_6_local_retail")?.query;
  const detectedZipRoute = __queryIntegrityTestHooks.routeMarketSources(officeWorksIdentity, detectedZipIntake, "");
  const detectedZipPlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: __queryIntegrityTestHooks.buildLiveSearchQueries(officeWorksIdentity, detectedZipRoute, "Office Works Security Envelopes 45 count", detectedZipIntake),
    sourceRoute: detectedZipRoute,
    identity: officeWorksIdentity,
    buyerIntake: detectedZipIntake,
    notes: "Office Works Security Envelopes strip and seal 45 count asking $5.50 at Kroger ZIP 30188"
  });
  const detectedZipLocalQuery = detectedZipPlan.map((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record)).find((record) => record.attempted && record.retailStage === "stage_6_local_retail")?.query;
  assert(manualZipLocalQuery && detectedZipLocalQuery === manualZipLocalQuery, "Manual ZIP and detected ZIP should converge on the same backend local-retail execution path.");
  const localEnvelopeRecord = {
    title: "Retail Security Envelopes 45 Count Strip Seal",
    domain: "target.com",
    source: "Target",
    url: "https://target.com/p/security-envelopes-45",
    displayedPriceText: "$5.50",
    parsedPrice: 5.5,
    priceEvidenceType: "Active Asking",
    sourceType: "organic",
    searchType: "organic_web",
    providerEndpoint: "serper_search",
    searchPass: "stage_6_local_retail",
    query: manualZipLocalQuery,
    identityMatchStrength: "Strong Similar",
    itemTypeCompatible: true,
    itemTypeCompatibilityStatus: "compatible",
    sourceBacked: "URL-cited",
    snippet: "Current price $5.50. Pickup availability not confirmed."
  };
  const localEnvelopeDiagnostics = __queryIntegrityTestHooks.buildRetailSearchDiagnostics({
    context: officeWorksContext,
    providerRequestRecords: officeWorksRequestRecords.map((record) => record.retailStage === "stage_6_local_retail"
      ? { ...record, attempted: true, succeeded: true, providerSourceCount: 1, returnedResultCount: 1 }
      : record),
    records: [localEnvelopeRecord],
    searchQueries: officeWorksQueries
  });
  assert(/local retail candidate.*visible prices passed source screening/i.test(localEnvelopeDiagnostics.locationAwareRetailSearchStatus), "Local diagnostics should describe source-screened candidates, not ambiguous qualified results.");
  assert(localEnvelopeDiagnostics.customerPriceEligibleRetailCandidateCount === 1, "Eligible local retail candidates should be counted from shared assessments.");
  const promotedLocalEnvelopePrices = __queryIntegrityTestHooks.buildConsumerPricesFound({
    providerSourceRecords: [localEnvelopeRecord],
    searchDiagnostics: localEnvelopeDiagnostics
  }, 5.5, { identity: officeWorksIdentity, buyerIntake: officeWorksIntake });
  assert(promotedLocalEnvelopePrices.length === 1 && /Compatible alternative|Exact item/i.test(promotedLocalEnvelopePrices[0].priceContextLabel), "Eligible local-stage current retail evidence should reach customer Prices Found with the canonical match label.");

  const genericRetailIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    asking_price: "$12.00",
    purchase_intent: "personal_use",
    store_name: "Target",
    location_zip: "10001",
    item_name: "Private label household cleaner 12 count",
    known_brand: "Store Brand",
    buyer_notes: "ordinary current retail household consumable"
  });
  const genericRetailIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch({
    brand: "Store Brand",
    productNameOrBoxTitle: "Private label household cleaner",
    category: "household cleaner",
    likelyItemDescription: "household cleaner",
    packageQuantity: "12 count",
    frontBoxWording: "Private label household cleaner 12 count"
  }, genericRetailIntake);
  const retailRecord = (overrides = {}) => ({
    title: "National Brand Household Cleaner 10 Count",
    domain: "national-retailer.example",
    source: "National Retailer",
    url: "https://national-retailer.example/household-cleaner-10",
    displayedPriceText: "$10.00",
    parsedPrice: 10,
    priceEvidenceType: "Active Asking",
    sourceType: "organic",
    searchType: "organic_web",
    providerEndpoint: "serper_search",
    searchPass: "stage_3_compatible_alternatives",
    query: "household cleaner 10 count current price",
    identityMatchStrength: "Strong Similar",
    itemTypeCompatible: true,
    itemTypeCompatibilityStatus: "compatible",
    sourceBacked: "URL-cited",
    snippet: "Current price $10.00. In stock.",
    ...overrides
  });
  const retailContext = __queryIntegrityTestHooks.buildSearchQueryContext(genericRetailIdentity, __queryIntegrityTestHooks.routeMarketSources(genericRetailIdentity, genericRetailIntake, ""), "household cleaner", genericRetailIntake);
  const officeWorksBarcodeIdentities = __queryIntegrityTestHooks.buildBarcodeIdentitySet("041226087161");
  assert(officeWorksBarcodeIdentities.includes("041226087161") && officeWorksBarcodeIdentities.includes("0041226087161"), "UPC-A and zero-padded EAN-13 identities should share one barcode equivalence set.");
  assert(__queryIntegrityTestHooks.barcodeIdentitySetsIntersect(officeWorksBarcodeIdentities, __queryIntegrityTestHooks.buildBarcodeIdentitySet("0041226087161")), "Zero-padded GTIN identity should compare equivalent to the submitted UPC-A.");
  assert(__queryIntegrityTestHooks.hasEquivalentBarcodeIdentity({
    title: "Office Works Strip and Seal Security Envelopes White 45 Count",
    url: "https://retailer.example/p/office-works/0041226087161"
  }, { barcodeIdentitySet: officeWorksBarcodeIdentities }), "Exact retailer-page URLs can support barcode equivalence without identical raw UPC formatting.");
  const officeWorksExactPage = retailRecord({
    title: "Office Works Strip and Seal Security Envelopes White 45 Count",
    domain: "kroger.com",
    source: "Kroger",
    url: "https://www.kroger.com/p/office-works-strip-and-seal-security-envelopes-white/0041226087161",
    displayedPriceText: "$2.99",
    parsedPrice: 2.99,
    searchPass: "stage_1_exact_identity",
    query: "0041226087161 site:kroger.com",
    rawText: "Current price $2.99. GTIN 0041226087161. 45 count. Availability not shown.",
    snippet: "Current price $2.99. 45 count. Availability not shown."
  });
  const enrichedOfficeWorksExactPage = __queryIntegrityTestHooks.enrichExactRetailPageRecord(officeWorksExactPage, officeWorksContext);
  assert(enrichedOfficeWorksExactPage.exactRetailPage === true && enrichedOfficeWorksExactPage.parsedPrice === 2.99, "Likely exact retailer product pages should be enriched and preserve current item price.");
  assert(__queryIntegrityTestHooks.isLikelyExactRetailProductPage(enrichedOfficeWorksExactPage, officeWorksContext), "Exact retailer page recovery should identify product-page URLs with equivalent UPC/GTIN support.");
  const lowerCompatibleOfficeOffer = retailRecord({
    title: "Security Envelopes Strip and Seal 50 Count",
    domain: "staples.com",
    source: "Staples",
    url: "https://www.staples.com/security-envelopes-strip-seal-50",
    displayedPriceText: "$1.99",
    parsedPrice: 1.99,
    searchPass: "stage_3_compatible_alternatives",
    query: "security envelopes strip and seal 50 count current price",
    rawText: "Current price $1.99. 50 count. Free shipping.",
    snippet: "Current price $1.99. 50 count. Free shipping."
  });
  const exactAndCompatiblePrices = __queryIntegrityTestHooks.buildConsumerPricesFound({
    providerSourceRecords: [lowerCompatibleOfficeOffer, enrichedOfficeWorksExactPage],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 5.5, { identity: officeWorksIdentity, buyerIntake: officeWorksIntake });
  assert(/kroger/i.test(exactAndCompatiblePrices[0]?.retailerDisplayName || "") && exactAndCompatiblePrices[0].itemPrice === "$2.99", "Exact retailer product price should outrank a cheaper compatible alternative in Where to Buy.");
  assert(/Exact item/i.test(exactAndCompatiblePrices[0].priceContextLabel), "Exact retailer product page promotion should reach the canonical exact-item context.");
  assert(exactAndCompatiblePrices.some((record) => /45-count and 50-count packages.*unit-price comparison/i.test(record.knownDifferences || record.priceContextSummary || "")), "Package-count differences should remain disclosed for compatible alternatives.");
  assert(/Availability unconfirmed/i.test(exactAndCompatiblePrices[0].listingStatus || ""), "Availability must not be inferred solely from a visible price.");
  const recoveryAssessment = __queryIntegrityTestHooks.createRecoveryAssessment({
    assessments: __queryIntegrityTestHooks.buildRetailEvidenceAssessments([enrichedOfficeWorksExactPage], officeWorksContext),
    providerRequestRecords: officeWorksRequestRecords,
    maxProviderCalls: __queryIntegrityTestHooks.retailSerperBudgetAllocation.maxProviderCalls
  });
  assert(recoveryAssessment.preliminaryUsableRecordCount === 1 && recoveryAssessment.preliminaryExactRecordCount === 1, "Limited-result recovery must inspect preliminary qualified acquisition evidence, not raw candidate counts.");
  const duplicateExactPages = __queryIntegrityTestHooks.dedupeSerperCandidateRecords([
    enrichedOfficeWorksExactPage,
    {
      ...enrichedOfficeWorksExactPage,
      url: "https://www.kroger.com/p/office-works-strip-and-seal-security-envelopes-white/00041226087161?utm_source=test",
      canonicalUrl: "https://www.kroger.com/p/office-works-strip-and-seal-security-envelopes-white/00041226087161"
    }
  ], officeWorksContext);
  assert(duplicateExactPages.length === 1, "Equivalent exact retailer-page offers should not duplicate Where to Buy rows.");
  assert(__queryIntegrityTestHooks.shouldRunLimitedResultRetailRecovery({
    context: officeWorksContext,
    providerRequestRecords: officeWorksRequestRecords,
    records: [enrichedOfficeWorksExactPage],
    recoveryAssessment
  }), "One-result recovery should trigger when only one customer-visible retailer survives and data-driven retailer targets remain.");
  const limitedRecoveryQueries = __queryIntegrityTestHooks.buildLimitedResultRetailRecoveryQueries(officeWorksContext, officeWorksRequestRecords, [enrichedOfficeWorksExactPage]);
  assert(limitedRecoveryQueries.length > 0 && limitedRecoveryQueries.length <= __queryIntegrityTestHooks.retailSerperBudgetAllocation.limitedResultRecovery, "Limited-result recovery queries must remain bounded.");
  assert(limitedRecoveryQueries.every((record) => record.retailStage === "stage_7_limited_result_recovery" && record.marketplaceDomains.length === 1), "Limited-result recovery should use domain-constrained retailer diversity queries.");
  assert(__queryIntegrityTestHooks.parseCurrencyCents("$5.50") === 550, "Existing $5.50 precision should remain exact.");
  assert(__queryIntegrityTestHooks.retailSizeTokensCompatible("4.12 x 9.5 inches", "4.125 x 9.5 inches"), "Visible 4.12-inch envelope dimensions should compare as mailing size, not become a package count.");
  assert(__queryIntegrityTestHooks.retailSizeTokensCompatible("4.12 x 9.5 inches", "#10"), "Approximate #10 mailing dimensions should be compatible with #10 notation.");
  const multiRetailerOfficePrices = __queryIntegrityTestHooks.buildConsumerPricesFound({
    providerSourceRecords: [
      enrichedOfficeWorksExactPage,
      lowerCompatibleOfficeOffer,
      retailRecord({
        title: "Security Envelopes Strip and Seal 45 Count",
        domain: "target.com",
        source: "Target",
        url: "https://www.target.com/p/security-envelopes-strip-seal-45",
        displayedPriceText: "$3.29",
        parsedPrice: 3.29,
        searchPass: "stage_4_retailer_specific",
        query: "security envelopes strip and seal 45 count current price site:target.com",
        rawText: "Current price $3.29. 45 count. Pickup availability not confirmed.",
        snippet: "Current price $3.29. 45 count."
      })
    ],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 5.5, { identity: officeWorksIdentity, buyerIntake: officeWorksIntake });
  assert(new Set(multiRetailerOfficePrices.map((record) => record.retailerDomain)).size >= 3, "Multiple retailers should appear when supported by source-backed current retail evidence.");

  const retailAssessments = __queryIntegrityTestHooks.buildRetailEvidenceAssessments([
    retailRecord(),
    retailRecord({ title: "Household Cleaner Refill", url: "https://national-retailer.example/household-cleaner-refill", displayedPriceText: "$8.00", parsedPrice: 8, snippet: "Current price $8.00. Availability not shown." }),
    retailRecord({ title: "Wrong Accessory Replacement Cap", url: "https://national-retailer.example/replacement-cap", itemTypeCompatible: false, itemTypeCompatibilityStatus: "mismatch", snippet: "Current price $2.00." }),
    retailRecord({ title: "Used marketplace household cleaner lot", url: "https://marketplace.example/used-cleaner", priceEvidenceType: "Active Asking", snippet: "Used marketplace listing $4.00." })
  ], retailContext);
  assert(retailAssessments.some((assessment) => assessment.customerPriceCardEligibility && assessment.customerEvidenceTier !== "tier_5"), "Cross-brand ordinary retail alternatives should be eligible when product type and price are supported.");
  assert(retailAssessments.some((assessment) => /package price only/i.test(assessment.confidenceDowngradeReasons.join(" "))), "Missing package count should downgrade to package-price-only instead of hard rejection.");
  assert(retailAssessments.some((assessment) => /Wrong product type|incompatible|Wrong Accessory|Wrong product/i.test(`${assessment.sourceTitle} ${assessment.hardRejectionReason}`)), "Accessory or wrong-product records should be hard rejected.");
  assert(retailAssessments.some((assessment) => /secondary|reference|Used marketplace/i.test(`${assessment.sourceTitle} ${assessment.hardRejectionReason} ${assessment.secondaryMarketStatus}`)), "Used-marketplace contamination should not become current retail evidence.");
  const redirectedRetailUrl = "https://www.google.com/url?q=https%3A%2F%2Fmerchant.example%2Fcleaner-12&sa=U";
  assert(__queryIntegrityTestHooks.unwrapRetailDestinationUrl(redirectedRetailUrl) === "https://merchant.example/cleaner-12", "Search-provider redirects should unwrap to the destination retailer URL when present.");
  const retailerAttributionAssessments = __queryIntegrityTestHooks.buildRetailEvidenceAssessments([
    retailRecord({
      title: "Shopping Household Cleaner 12 Count",
      url: redirectedRetailUrl,
      domain: "google.com",
      merchantName: "Merchant Example",
      sourceType: "shopping",
      searchType: "shopping",
      providerEndpoint: "serper_shopping",
      displayedPriceText: "$10.50",
      parsedPrice: 10.5,
      priceEvidenceType: "Shopping Offer"
    }),
    retailRecord({
      title: "Household Cleaner 12 Count",
      url: "https://www.google.com/search?q=household-cleaner-12",
      domain: "google.com",
      source: "Google",
      displayedPriceText: "$1.99",
      parsedPrice: 1.99,
      snippet: "Current price $1.99."
    }),
    retailRecord({
      title: "PROWORX Medium Raceway Accessory Cord Hiding Kit",
      url: "https://hardware.example/accessory-kit",
      domain: "hardware.example",
      source: "Hardware Example",
      displayedPriceText: "$7.99",
      parsedPrice: 7.99,
      snippet: "Security, privacy, seal, office current price overlap."
    })
  ], retailContext);
  const merchantAssessment = retailerAttributionAssessments.find((assessment) => /Shopping Household Cleaner/i.test(assessment.sourceTitle));
  assert(merchantAssessment.retailerDisplayName === "Merchant Example", "Retailer name should come from structured Shopping merchant evidence.");
  assert(merchantAssessment.retailerDomain === "merchant.example", "Destination retailer domain should be distinguished from the search provider domain.");
  assert(merchantAssessment.searchProvider === "Serper Google Search", "Search provider should remain technical metadata, not the seller.");
  assert(merchantAssessment.destinationUrl === "https://merchant.example/cleaner-12", "Customer destination URL should preserve the true retailer destination.");
  const aggregatorMerchantAssessment = __queryIntegrityTestHooks.buildRetailEvidenceAssessments([retailRecord({
    title: "Household Cleaner 12 Count",
    domain: "instacart.com",
    source: "Instacart",
    url: "https://www.instacart.com/products/household-cleaner-12",
    displayedPriceText: "$8.99",
    parsedPrice: 8.99,
    searchPass: "stage_6_local_retail",
    rawText: "Current price $8.99. Retailer: Target. Availability not shown.",
    snippet: "Current price $8.99. Retailer: Target."
  })], retailContext)[0];
  assert(aggregatorMerchantAssessment.retailerDisplayName === "Target via Instacart", "Aggregator rows with source-backed merchant evidence should attribute both merchant and platform.");
  const aggregatorPlatformAssessment = __queryIntegrityTestHooks.buildRetailEvidenceAssessments([retailRecord({
    title: "Household Cleaner 12 Count",
    domain: "instacart.com",
    source: "Instacart",
    url: "https://www.instacart.com/products/household-cleaner-12-unattributed",
    displayedPriceText: "$8.99",
    parsedPrice: 8.99,
    searchPass: "stage_6_local_retail",
    rawText: "Current price $8.99. Availability not shown.",
    snippet: "Current price $8.99."
  })], retailContext)[0];
  assert(aggregatorPlatformAssessment.retailerDisplayName === "Instacart", "Aggregator rows without merchant evidence should not invent a physical retailer.");
  const providerOnlyAssessment = retailerAttributionAssessments.find((assessment) => /google\.com\/search/i.test(assessment.sourceUrl));
  assert(providerOnlyAssessment.retailerDisplayName === "Retailer not identified", "Unknown retailer should be displayed explicitly.");
  assert(providerOnlyAssessment.retailPriceDecisionEligibility === false, "Unknown-retailer evidence must not be eligible for best alternative or retail limit.");
  const accessoryAssessment = retailerAttributionAssessments.find((assessment) => /PROWORX/i.test(assessment.sourceTitle));
  assert(accessoryAssessment.customerPriceCardEligibility === false, "Product-type mismatch cannot become a customer price card.");
  assert(/Product-family mismatch|contradictory title/i.test(accessoryAssessment.hardRejectionReason), "Accessory versus primary product mismatch should be hard rejected from negative title evidence.");
  assert(accessoryAssessment.contradictoryEvidence.length > 0, "Contradictory product-family evidence should be recorded.");
  const promotedGenericPrices = __queryIntegrityTestHooks.buildConsumerPricesFound({
    providerSourceRecords: [
      retailRecord(),
      retailRecord({ title: "Shopping Household Cleaner 12 Count", sourceType: "shopping", searchType: "shopping", providerEndpoint: "serper_shopping", searchPass: "stage_5_shopping_general", url: "https://shopping-retailer.example/cleaner-12", displayedPriceText: "$11.50", parsedPrice: 11.5, priceEvidenceType: "Shopping Offer" }),
      retailRecord({ title: "Local Household Cleaner 12 Count", searchPass: "stage_6_local_retail", query: "household cleaner near 10001 12 count current price", url: "https://local-retailer.example/cleaner-12", displayedPriceText: "$11.00", parsedPrice: 11 })
    ],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 12, { identity: genericRetailIdentity, buyerIntake: genericRetailIntake });
  assert(promotedGenericPrices.some((record) => /Shopping Household Cleaner/i.test(record.title)), "Shopping-stage priced records should promote to customer prices.");
  assert(promotedGenericPrices.some((record) => /Local Household Cleaner/i.test(record.title)), "Local-stage priced records should promote to customer prices.");
  assert(promotedGenericPrices.every((record) => record.priceType === "Current retail price"), "Promoted ordinary retail cards should use the canonical current-retail price type.");
  assert(promotedGenericPrices.every((record) => record.retailerDisplayName), "Every promoted retail card should carry a retailer display name.");
  const directExactHouseholdOffer = enrichedOfficeWorksExactPage;
  const aggregatorExactHouseholdOffer = __queryIntegrityTestHooks.enrichExactRetailPageRecord(retailRecord({
    title: "Office Works Strip and Seal Security Envelopes White 45 Count",
    domain: "instacart.com",
    source: "Instacart",
    url: "https://www.instacart.com/products/office-works-strip-and-seal-security-envelopes-white",
    displayedPriceText: "$2.99",
    parsedPrice: 2.99,
    searchPass: "stage_6_local_retail",
    rawText: "Current price $2.99. Retailer: Kroger. GTIN 0041226087161. 45 count. Availability not shown.",
    snippet: "Current price $2.99. Retailer: Kroger. 45 count."
  }), officeWorksContext);
  const dedupedCustomerRetailOffers = __queryIntegrityTestHooks.buildConsumerPricesFound({
    providerSourceRecords: [aggregatorExactHouseholdOffer, directExactHouseholdOffer],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 5.5, { identity: officeWorksIdentity, buyerIntake: officeWorksIntake });
  assert(dedupedCustomerRetailOffers.length === 1 && /kroger\.com/i.test(dedupedCustomerRetailOffers[0].url || ""), "Equivalent direct retailer evidence should replace aggregator duplicates for the same exact offer.");
  const decisionSafetyLiveSearch = {
    providerSourceRecords: [
      retailRecord({ title: "Household Cleaner 12 Count", url: "https://www.google.com/search?q=household-cleaner-12", domain: "google.com", source: "Google", displayedPriceText: "$1.99", parsedPrice: 1.99, snippet: "Current price $1.99." }),
      retailRecord({ title: "National Brand Household Cleaner 12 Count", url: "https://merchant.example/cleaner-12", domain: "merchant.example", source: "Merchant Example", displayedPriceText: "$10.00", parsedPrice: 10 })
    ],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  };
  const decisionSafetyPrices = __queryIntegrityTestHooks.buildConsumerPricesFound(decisionSafetyLiveSearch, 12, { identity: genericRetailIdentity, buyerIntake: genericRetailIntake });
  assert(!decisionSafetyPrices.some((record) => /google\.com\/search/i.test(record.url || "")), "Search-provider pages must not be promoted as customer-visible current retail cards.");
  assert(decisionSafetyPrices.every((record) => record.retailPriceDecisionEligibility !== false || /Retailer not identified/i.test(record.retailerDisplayName)), "Any visible unknown-retailer current retail card must remain decision-ineligible.");
  const decisionSafetyProfile = __queryIntegrityTestHooks.buildRetailEvidenceProfile({
    buyerIntake: genericRetailIntake,
    identity: genericRetailIdentity,
    liveSearch: decisionSafetyLiveSearch,
    pricesFound: decisionSafetyPrices,
    askingPriceNumber: 12,
    searchCompleted: true
  });
  assert(decisionSafetyProfile.bestCurrentRetailAlternative?.itemPriceAmount === 10, "Best Current Retail Alternative must ignore unknown-retailer prices.");
  assert(!/1\.99/.test(decisionSafetyProfile.retailPriceLimit), "Retail Price Limit must not be established by unknown-retailer evidence.");
  const richerDuplicate = __queryIntegrityTestHooks.dedupeSerperCandidateRecords([
    retailRecord({ url: "https://duplicate.example/product", canonicalUrl: "https://duplicate.example/product", displayedPriceText: "", parsedPrice: null, snippet: "No visible price." }),
    retailRecord({ url: "https://duplicate.example/product", canonicalUrl: "https://duplicate.example/product", displayedPriceText: "$9.99", parsedPrice: 9.99, snippet: "Current price $9.99. In stock." })
  ]);
  assert(richerDuplicate.length === 1 && richerDuplicate[0].displayedPriceText === "$9.99", "Richer price-bearing duplicate should survive deduplication.");
  const uncertainSkuIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch({
    brand: "Store Brand",
    productNameOrBoxTitle: "Private label household cleaner",
    category: "household cleaner",
    sku: "610325",
    upcBarcode: "041226087161",
    backLabelWording: "UPC 041226087161 Item 6110325",
    visibleText: ["Store Brand", "Household Cleaner", "Item 6110325", "041226087161"]
  }, __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    item_name: "Private label household cleaner",
    known_upc: "041226087161"
  }));
  assert(uncertainSkuIdentity.canonicalProductIdentity.fields.SKU.status === "uncertain", "Competing OCR SKU candidates should be downgraded to uncertain.");
  assert(!uncertainSkuIdentity.sku, "Uncertain OCR SKU must not be copied into exact searchable identity.");
  assert(uncertainSkuIdentity.canonicalProductIdentity.fields.UPC.value === "041226087161", "Valid barcode should remain the stronger exact identity.");
  const invalidBarcodeIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    asking_price: "$5.50",
    purchase_intent: "personal_use",
    store_name: "Kroger",
    location_zip: "30188",
    item_name: "Office Works Security Envelopes",
    known_brand: "Office Works",
    known_sku: "6110325",
    known_upc: "014226087161",
    buyer_notes: "Office Works Security Envelopes 45 count Strip & Seal item number 6110325"
  });
  const invalidBarcodeIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch({
    ...officeWorksExtractedIdentity,
    upcBarcode: "014226087161",
    backLabelWording: "UPC 014226087161 Item 6110325",
    visibleText: ["Office Works", "Security Envelopes", "45 Count", "Strip & Seal", "6110325", "014226087161"]
  }, invalidBarcodeIntake);
  const invalidBarcodeRoute = __queryIntegrityTestHooks.routeMarketSources(invalidBarcodeIdentity, invalidBarcodeIntake, "");
  const invalidBarcodeQueries = __queryIntegrityTestHooks.buildLiveSearchQueries(invalidBarcodeIdentity, invalidBarcodeRoute, "Office Works Security Envelopes 45 count", invalidBarcodeIntake);
  assert(!invalidBarcodeQueries.some((query) => /014226087161/.test(query)), "Invalid barcode queries must not be executed or retained in live search queries.");
  assert(invalidBarcodeQueries.some((query) => /security envelopes/i.test(query)), "No valid barcode should still trigger package-attribute retail recovery.");
  const invalidBarcodePlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: invalidBarcodeQueries,
    sourceRoute: invalidBarcodeRoute,
    identity: invalidBarcodeIdentity,
    buyerIntake: invalidBarcodeIntake,
    notes: "Office Works Security Envelopes strip and seal 45 count asking $5.50 at Kroger ZIP 30188"
  });
  const invalidBarcodeAttempted = invalidBarcodePlan.filter((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record).attempted);
  assert(!invalidBarcodeAttempted.some((record) => /014226087161/.test(record.query)), "Invalid barcode must not consume exact retail provider budget.");
  assert(invalidBarcodeAttempted.some((record) => record.retailStage === "stage_3_compatible_alternatives"), "Invalid barcode fallback should still execute cross-brand compatible alternatives.");
  const invalidBarcodeContext = __queryIntegrityTestHooks.buildSearchQueryContext(
    invalidBarcodeIdentity,
    invalidBarcodeRoute,
    "Office Works Security Envelopes 45 count",
    invalidBarcodeIntake
  );
  const zeroAcceptedDiagnostics = __queryIntegrityTestHooks.buildRetailSearchDiagnostics({
    context: invalidBarcodeContext,
    providerRequestRecords: invalidBarcodePlan.map((record) => ({
      ...__queryIntegrityTestHooks.createSerperRequestRecord(record),
      succeeded: true,
      providerSourceCount: 9,
      organicResultCount: 9
    })),
    records: Array.from({ length: 12 }, (_, index) => ({
      title: `Security shipping labels ${index + 1}`,
      rawText: "shipping labels current retail price $4.99",
      displayedPriceText: "$4.99",
      parsedPrice: 4.99,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: `https://example.com/shipping-labels-${index + 1}`
    })),
    searchQueries: invalidBarcodeQueries
  });
  assert(/Yes/i.test(zeroAcceptedDiagnostics.zeroResultIdentityRecoveryTriggered), "Many returned results plus zero accepted candidates should trigger identity-recovery diagnostics.");
  const officeWorksStrongAlternative = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Office Works Security Envelopes 50 Count Gummed",
      rawText: "Office Works security envelopes 50 count gummed current retail price $5.50",
      itemPriceAmount: 5.5,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/office-works-50-count"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(officeWorksStrongAlternative.label === "Strong Retail Alternative", "45-count and 50-count retail packages should recover as a strong retail alternative.");
  const officeWorksSameCountAlternative = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Office Works Security Envelopes 45 Count Gummed",
      rawText: "Office Works security envelopes 45 count gummed current retail price $5.25",
      itemPriceAmount: 5.25,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/office-works-45-count"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(["Exact Retail Match", "Strong Retail Alternative"].includes(officeWorksSameCountAlternative.label), "A compatible 45-count product should survive retail package compatibility review.");
  const differentBrandStrongAlternative = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Staples Security Envelopes 40 Count Self Seal",
      rawText: "Staples security envelopes 40 count self seal current retail price $4.99",
      itemPriceAmount: 4.99,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/staples-security-envelopes-40"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(differentBrandStrongAlternative.label === "Strong Retail Alternative", "Different brands should qualify as strong retail alternatives when function, security purpose, closure, and pack relationship are compatible.");
  const officeWorksUnitComparable = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Pen+Gear Security Envelopes 100 Count Self Seal",
      rawText: "Pen+Gear security envelopes 100 count self seal current retail price $8.99",
      itemPriceAmount: 8.99,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/pen-gear-security-envelopes-100"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(officeWorksUnitComparable.label === "Unit-Price Comparable", "Larger compatible retail packages should be limited to unit-price comparison.");
  const missingQuantityAlternative = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Staples Security Envelopes Self Seal",
      rawText: "Staples security envelopes self seal current retail price $4.49",
      itemPriceAmount: 4.49,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/staples-security-envelopes"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(missingQuantityAlternative.status === "quantity_unknown_functional_replacement" && missingQuantityAlternative.label === "Strong Retail Alternative", "Missing alternative quantity should downgrade comparison quality instead of eliminating a same-type retail result.");
  const compatible80Count = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Mead Security Envelopes 80 Count Self Seal",
      rawText: "Mead security envelopes 80 count self seal current retail price $7.49",
      itemPriceAmount: 7.49,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/mead-security-envelopes-80"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(compatible80Count.label === "Unit-Price Comparable", "80-count compatible retail packages should remain available for unit-price comparison.");
  const officeWorksMismatch = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Plain White Envelopes 45 Count",
      rawText: "plain envelopes 45 count current retail price $4.99",
      itemPriceAmount: 4.99,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/plain-envelopes"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(officeWorksMismatch.label === "Rejected Retail Mismatch", "Security-envelope evidence should reject plain-envelope retail results.");
  const wrongCategoryMismatch = __queryIntegrityTestHooks.classifyRetailPackageCompatibility(
    {
      title: "Security Shipping Labels 45 Count",
      rawText: "shipping labels 45 count current retail price $4.99",
      itemPriceAmount: 4.99,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://example.com/security-shipping-labels"
    },
    officeWorksIdentity,
    officeWorksIntake
  );
  assert(wrongCategoryMismatch.label === "Rejected Retail Mismatch" && /wrong product category/i.test(wrongCategoryMismatch.reason), "Unrelated product categories should be rejected early even when domain and price look retail-like.");
  const irrelevantOfficeWorksRecords = [
    {
      title: "Office Works Business Center - Woodstock",
      rawText: "Office workspace services and business printing. Price $5.50 consultation.",
      displayedPriceText: "$5.50",
      parsedPrice: 5.5,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://www.mapquest.com/us/georgia/office-works-business-center"
    },
    {
      title: "Office Works design studio social profile",
      rawText: "Office design company profile with photos and government references.",
      displayedPriceText: "$5.50",
      parsedPrice: 5.5,
      priceType: "Active Asking",
      listingStatus: "In stock",
      url: "https://www.facebook.com/officeworksdesign"
    }
  ];
  assert(irrelevantOfficeWorksRecords.every((record) => !__queryIntegrityTestHooks.isQualifiedCurrentRetailSourceRecord(record, officeWorksContext)), "Unrelated Office Works business, social, and location results must not qualify as envelope retail evidence.");
  const officeWorksProfileRecords = [
    retailRecord({
      source: "Staples",
      domain: "staples.example",
      title: "Staples Security Envelopes 40 Count Self Seal",
      rawText: "Staples security envelopes 40 count self seal current retail price $4.99",
      snippet: "Staples security envelopes 40 count self seal current retail price $4.99. Shipping not shown.",
      displayedPriceText: "$4.99",
      parsedPrice: 4.99,
      url: "https://example.com/staples-security-envelopes-40"
    }),
    retailRecord({
      source: "Office Works",
      domain: "office-works.example",
      title: "Office Works Security Envelopes 45 Count Gummed",
      rawText: "Office Works security envelopes 45 count gummed current retail price $5.25",
      snippet: "Office Works security envelopes 45 count gummed current retail price $5.25.",
      displayedPriceText: "$5.25",
      parsedPrice: 5.25,
      url: "https://example.com/office-works-45-count"
    }),
    retailRecord({
      source: "Example Retail",
      domain: "example-retail.example",
      title: "Office Works Security Envelopes 50 Count Gummed",
      rawText: "Office Works security envelopes 50 count gummed current retail price $5.50",
      snippet: "Office Works security envelopes 50 count gummed current retail price $5.50.",
      displayedPriceText: "$5.50",
      parsedPrice: 5.5,
      url: "https://example.com/office-works-50-count"
    }),
    retailRecord({
      source: "Walmart",
      domain: "walmart.example",
      title: "Pen+Gear Security Envelopes 100 Count Self Seal",
      rawText: "Pen+Gear security envelopes 100 count self seal current retail price $8.99",
      snippet: "Pen+Gear security envelopes 100 count self seal current retail price $8.99.",
      displayedPriceText: "$8.99",
      parsedPrice: 8.99,
      url: "https://example.com/pen-gear-security-envelopes-100"
    })
  ];
  const officeWorksProfileLiveSearch = {
    webSearchExecuted: true,
    providerSourceRecords: officeWorksProfileRecords,
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  };
  const officeWorksProfilePrices = __queryIntegrityTestHooks.buildConsumerPricesFound(
    officeWorksProfileLiveSearch,
    5.5,
    { identity: officeWorksIdentity, buyerIntake: officeWorksIntake }
  );
  const officeWorksRetailProfile = __queryIntegrityTestHooks.buildRetailEvidenceProfile({
    buyerIntake: officeWorksIntake,
    identity: officeWorksIdentity,
    liveSearch: officeWorksProfileLiveSearch,
    askingPriceNumber: 5.5,
    searchCompleted: true,
    pricesFound: officeWorksProfilePrices
  });
  assert(
    officeWorksRetailProfile.acceptedPrices.length === 3,
    `Only canonically compatible nearby-count alternatives should remain available for customer-facing retail output. ${JSON.stringify(officeWorksRetailProfile.acceptedPrices.map((record) => ({ title: record.title, quantity: record.packageQuantity, price: record.itemPriceAmount })))}`
  );
  assert(officeWorksRetailProfile.acceptedPrices.some((record) => /Staples/i.test(record.title)), "Unknown shipping should not reject an otherwise useful current retailer alternative.");
  assert(!officeWorksRetailProfile.acceptedPrices.some((record) => /100 Count/i.test(record.title)), "A materially incompatible 100-count package must not support the retail range or limit.");
  assert(/Compatible Current Retail Alternatives/i.test(officeWorksRetailProfile.currentRetailPriceAssessment), "Retail recovery should disclose compatible alternatives when exact package is not confirmed.");
  assert(!/No qualified source-backed current retail price/i.test(officeWorksRetailProfile.currentRetailPriceAssessment), "Accepted alternatives cannot coexist with a no-qualified-current-retail-prices assessment.");
  assert(!/Not established/i.test(officeWorksRetailProfile.retailPriceLimit), "Accepted alternatives should establish a retail price limit instead of leaving it empty.");
  assert(!/Not established/i.test(officeWorksRetailProfile.packageUnitPriceComparison), "Accepted unit-price comparables should establish package and unit-price comparison.");
  assert(officeWorksRetailProfile.otherCurrentRetailPrices.length === 2, "Canonical compatible alternatives should be displayable as best plus other retail prices.");
  assert(/Exact Product: An exact current Office Works listing was not found/i.test(officeWorksRetailProfile.currentRetailPriceAssessment), "Exact and cross-brand results should remain clearly distinguished.");
  assert(/about 12\.2 cents each \(\$0\.122 per unit\)/i.test(officeWorksRetailProfile.currentRetailPriceAssessment), "Entered $5.50 for 45 should be shown as about 12.2 cents each.");
  assert(/canonical unit-price context/i.test(officeWorksRetailProfile.currentRetailPriceAssessment), "Canonical retail assessment should disclose selected unit-price context.");
  assert(/Target package quantity: 45/i.test(officeWorksRetailProfile.packageUnitPriceComparison), "Retail package comparison should preserve the submitted quantity context.");
  const neutralBrandIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "retail_store",
    asking_price: "$4.75",
    purchase_intent: "personal_use",
    store_name: "Kroger",
    location_zip: "30188",
    item_name: "Northstar Paper Co Security Envelopes",
    known_brand: "Northstar Paper Co",
    known_sku: "NS-45",
    known_upc: "012345678905",
    buyer_notes: "Northstar Paper Co Security Envelopes Strip & Seal 45 count item NS-45"
  });
  const neutralBrandIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch({
    brand: "Northstar Paper Co",
    manufacturer: "Northstar Paper Co",
    sku: "NS-45",
    upcBarcode: "012345678905",
    category: "security envelopes",
    productNameOrBoxTitle: "Northstar Paper Co Security Envelopes",
    exactProductIdentity: "Northstar Paper Co Security Envelopes",
    subjectIdentity: "Northstar Paper Co Security Envelopes",
    packageQuantity: "45 count",
    unitCount: "45",
    packageSize: "#10 envelopes 4.125 x 9.5 inches",
    dimensions: "4.125 x 9.5 inches",
    frontBoxWording: "Northstar Paper Co Security Envelopes 45 Count Strip & Seal",
    backLabelWording: "UPC 012345678905 Item NS-45",
    visibleText: ["Northstar Paper Co", "Security Envelopes", "45 Count", "Strip & Seal", "4.125 x 9.5 inches", "NS-45", "012345678905"]
  }, neutralBrandIntake);
  const neutralBrandRoute = __queryIntegrityTestHooks.routeMarketSources(neutralBrandIdentity, neutralBrandIntake, "");
  const neutralBrandQueries = __queryIntegrityTestHooks.buildLiveSearchQueries(neutralBrandIdentity, neutralBrandRoute, "Northstar Paper Co security envelopes 45 count", neutralBrandIntake);
  assert(neutralBrandIdentity.canonicalProductIdentity.fields.brand.value === "Northstar Paper Co", "Neutral synthetic brand should be retained from structured/user-supported evidence without production brand literals.");
  assert(neutralBrandQueries[0] === "012345678905", "Neutral synthetic brand retail route should remain barcode-first.");
  assert(neutralBrandQueries.some((query) => /Northstar Paper Co NS-45/i.test(query)), "Neutral synthetic brand should generate brand plus item-number retail queries.");
  assert(neutralBrandQueries.some((query) => /Northstar Paper Co security envelopes 45 count/i.test(query)), "Neutral synthetic brand should generate current retail product queries from general identity evidence.");
  const missingQuantityRecord = retailRecord({
    source: "Staples",
    domain: "staples.example",
    title: "Staples Security Envelopes Self Seal",
    rawText: "Staples security envelopes self seal current retail price $4.49",
    snippet: "Staples security envelopes self seal current retail price $4.49",
    displayedPriceText: "$4.49",
    parsedPrice: 4.49,
    url: "https://example.com/staples-security-envelopes"
  });
  const missingQuantityLiveSearch = {
    webSearchExecuted: true,
    providerSourceRecords: [missingQuantityRecord],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  };
  const missingQuantityPrices = __queryIntegrityTestHooks.buildConsumerPricesFound(
    missingQuantityLiveSearch,
    5.5,
    { identity: officeWorksIdentity, buyerIntake: officeWorksIntake }
  );
  const missingQuantityRetailProfile = __queryIntegrityTestHooks.buildRetailEvidenceProfile({
    buyerIntake: officeWorksIntake,
    identity: officeWorksIdentity,
    liveSearch: missingQuantityLiveSearch,
    askingPriceNumber: 5.5,
    searchCompleted: true,
    pricesFound: missingQuantityPrices
  });
  assert(missingQuantityRetailProfile.acceptedPrices.length === 1, "Missing-count same-type alternative should remain customer-visible as compatible current retail evidence.");
  assert(/not established|unavailable/i.test(missingQuantityRetailProfile.packageUnitPriceComparison), "Unit price should not be calculated when the alternative package quantity is missing.");
  const itemTypeCases = [
    ["decorative tray compatible", "Georgia Bulldogs Coca-Cola decorative collector tray", true],
    ["serving tray compatible", "1980 Georgia Bulldogs Coca-Cola serving tray", true],
    ["bottle incompatible", "Georgia Bulldogs Coca-Cola championship bottle", false],
    ["sign incompatible", "Georgia Bulldogs Coca-Cola tin sign", false],
    ["plate incompatible", "Georgia Bulldogs Coca-Cola collector plate", false],
    ["cup incompatible", "Georgia Bulldogs Coca-Cola mug cup", false],
    ["poster incompatible", "Georgia Bulldogs Coca-Cola championship poster", false],
    ["can incompatible", "Georgia Bulldogs Coca-Cola unopened can", false],
    ["ornament incompatible", "Georgia Bulldogs Coca-Cola Christmas ornament", false],
    ["figurine incompatible", "Georgia Bulldogs Coca-Cola mascot figurine", false],
    ["unknown candidate type incompatible", "Georgia Bulldogs Coca-Cola championship memorabilia", false]
  ];
  for (const [label, title, expectedCompatible] of itemTypeCases) {
    const compatibility = __queryIntegrityTestHooks.evaluateComparableItemTypeCompatibility(
      { title, snippet: "Shared Georgia Bulldogs, championship, and Coca-Cola wording.", url: `https://example.com/${label.replace(/\s+/g, "-")}` },
      georgiaIdentity,
      georgiaQueryContext
    );
    assert(compatibility.itemTypeCompatible === expectedCompatible, `${label} item-type compatibility should be ${expectedCompatible}.`);
  }
  const slugConflict = __queryIntegrityTestHooks.evaluateComparableItemTypeCompatibility(
    { title: "Georgia Bulldogs Coca-Cola championship collectible", snippet: "Shared event and brand wording.", url: "https://example.com/georgia-coca-cola-bottle" },
    georgiaIdentity,
    georgiaQueryContext
  );
  assert(slugConflict.itemTypeCompatible === false && /bottle/i.test(slugConflict.candidateItemType), "URL slug product noun should prevent a mismatched item from becoming compatible.");
  const bottleCompatibility = __queryIntegrityTestHooks.evaluateComparableItemTypeCompatibility(
    { title: "Georgia Bulldogs Coca-Cola championship bottle", snippet: "Same brand, year, event, and team wording as a tray.", url: "https://www.ebay.com/itm/georgia-coca-cola-bottle" },
    georgiaIdentity,
    georgiaQueryContext
  );
  const bottleMatch = __queryIntegrityTestHooks.classifySerperIdentityMatch(
    { title: "Georgia Bulldogs Coca-Cola championship bottle", snippet: "Same brand, year, event, and team wording as a tray. Asking $12.00.", url: "https://www.ebay.com/itm/georgia-coca-cola-bottle" },
    georgiaIdentity,
    georgiaQueryContext,
    bottleCompatibility
  );
  assert(!/Exact|Strong Similar/i.test(bottleMatch), "Shared brand/year/event wording must not override a product-form mismatch.");
  const bottleRole = __queryIntegrityTestHooks.buildSerperEvidenceRole("Reference Only", "Active Asking", bottleCompatibility);
  assert(/not valuation support/i.test(bottleRole), "Mismatched active asking listings should be reference-only, not valuation evidence.");
  const replacementCompatibility = __queryIntegrityTestHooks.evaluateComparableItemTypeCompatibility(
    { title: "Replacement single tray insert piece", snippet: "One replacement piece only.", url: "https://example.com/replacement-piece" },
    { ...georgiaIdentity, likelyItemDescription: "complete set of Coca-Cola Georgia Bulldogs collector tray pieces" },
    { ...georgiaQueryContext, itemType: "complete set collector tray" }
  );
  assert(replacementCompatibility.itemTypeCompatible === false && /set/i.test(replacementCompatibility.status), "Complete set and replacement-piece scope mismatch should not be exact.");
  const priceRecord = (overrides = {}) => ({
    title: "Georgia Bulldogs Coca-Cola collector tray active listing",
    source: "Example Marketplace",
    url: "https://example.com/compatible-tray-active",
    canonicalUrl: "https://example.com/compatible-tray-active",
    displayedPrice: "$6.49",
    priceType: "Active Asking",
    classification: "Exact Match",
    identityMatchStrength: "Exact",
    evidenceRole: "Comparable evidence - Active Asking",
    itemTypeCompatible: true,
    itemTypeCompatibilityStatus: "compatible",
    submittedItemType: "serving/decorative tray",
    candidateItemType: "serving/decorative tray",
    sourceBacked: "URL-cited",
    ...overrides
  });
  const deliveredHigher = __queryIntegrityTestHooks.buildConsumerPricesFound({ strongComparables: [priceRecord({ delivery: "Shipping $8.00" })] }, 10);
  assert(deliveredHigher.length === 1, "Compatible active listing with visible price should appear in Prices Found.");
  assert(deliveredHigher[0].itemPrice === "$6.49" && deliveredHigher[0].shipping === "$8.00" && deliveredHigher[0].deliveredCost === "$14.49", "Delivered cost should equal item price plus explicit shipping.");
  assert(/delivered cost is higher/i.test(deliveredHigher[0].comparisonToYourPrice), "Lower item price with higher delivered cost must not be called a better deal.");
  const unknownShipping = __queryIntegrityTestHooks.buildConsumerPricesFound({ strongComparables: [priceRecord({ url: "https://example.com/unknown-shipping", displayedPrice: "$6.00" })] }, 10);
  assert(unknownShipping[0].itemPrice === "$6.00" && unknownShipping[0].shipping === "Not shown" && unknownShipping[0].deliveredCost === "Not established", "A $6 listing with no shipping evidence should show item price, Shipping: Not shown, and Delivered cost: Not established.");
  assert(unknownShipping[0].shippingAmount === null && unknownShipping[0].deliveredCostAmount === null, "Unknown shipping should never be treated as free or as a delivered total.");
  assert(/may not be the lowest total cost because shipping was not shown/i.test(unknownShipping[0].comparisonToYourPrice), "Lower item price with unknown shipping should not be confirmed as a better delivered deal.");
  const freeShipping = __queryIntegrityTestHooks.buildConsumerPricesFound({ strongComparables: [priceRecord({ url: "https://example.com/free-shipping", delivery: "Free shipping" })] }, 10);
  assert(freeShipping[0].shipping === "Free" && freeShipping[0].deliveredCost === "$6.49", "Free shipping should produce delivered cost equal to item price.");
  assert(/lower delivered cost/i.test(freeShipping[0].comparisonToYourPrice), "Free-shipping compatible active listing can be described as lower delivered cost.");
  const deliveredRankingLiveSearch = {
    strongComparables: [
      priceRecord({ url: "https://example.com/six-plus-fifteen", canonicalUrl: "https://example.com/six-plus-fifteen", displayedPrice: "$6.00", delivery: "Shipping $15.00" }),
      priceRecord({ url: "https://example.com/fifteen-free", canonicalUrl: "https://example.com/fifteen-free", displayedPrice: "$15.00", delivery: "Free shipping" }),
      priceRecord({ url: "https://example.com/six-unknown", canonicalUrl: "https://example.com/six-unknown", displayedPrice: "$6.00" }),
      priceRecord({ url: "https://example.com/twenty-five-included", canonicalUrl: "https://example.com/twenty-five-included", displayedPrice: "$25.00", delivery: "Shipping included" })
    ]
  };
  const deliveredRanking = __queryIntegrityTestHooks.buildConsumerPricesFound(deliveredRankingLiveSearch, 10);
  const bestDelivered = __queryIntegrityTestHooks.buildBestCompatiblePriceFound(deliveredRanking);
  assert(/fifteen-free/.test(bestDelivered.url) && bestDelivered.deliveredCost === "$15.00", "A $6 item with $15 shipping should rank behind a $15 item with free shipping.");
  assert(!/six-unknown/.test(bestDelivered.url), "A $6 item with unknown shipping must not automatically be labeled the best delivered deal.");
  const otherDelivered = __queryIntegrityTestHooks.buildOtherCompatiblePricesFound(deliveredRanking, bestDelivered);
  assert(JSON.stringify(otherDelivered).includes("twenty-five-included"), "Higher compatible prices should remain visible in Other Compatible Prices Found.");
  const spectrumSummary = __queryIntegrityTestHooks.buildPriceSpectrumSummary(
    summarizeCanonicalEvidence(deliveredRankingLiveSearch)
  );
  assert(/canonical offer/i.test(spectrumSummary) && /\$6\.00-\$25\.00/.test(spectrumSummary), "Price spectrum summary must project the canonical active-asking range without rebuilding it from display cards.");
  const auctionBid = __queryIntegrityTestHooks.buildConsumerPricesFound({ strongComparables: [priceRecord({ url: "https://example.com/current-bid", priceType: "Current bid", rawText: "Current bid $6.49" })] }, 10);
  assert(auctionBid[0].priceType === "Current bid" && !/sold/i.test(auctionBid[0].priceType), "Auction current bid must not be relabeled as final sold value.");
  const noPriceExactBuckets = __queryIntegrityTestHooks.bucketSerperRecords([{
    title: "WorthPoint Georgia Bulldogs Coca-Cola collector tray reference",
    domain: "worthpoint.com",
    source: "worthpoint.com",
    url: "https://www.worthpoint.com/worthopedia/georgia-bulldogs-coca-cola-tray",
    displayedPriceText: "",
    parsedPrice: null,
    priceEvidenceType: "Reference Without Price",
    priceTypeLabel: "Reference Without Price",
    identityMatchStrength: "Exact",
    itemTypeCompatible: true,
    itemTypeCompatibilityStatus: "compatible",
    submittedItemType: "serving/decorative tray",
    candidateItemType: "serving/decorative tray",
    evidenceRole: "Identity/reference context only",
    matchExplanation: "The title appears to identify the same tray, but the visible source result does not expose a usable price.",
    sourceBacked: "URL-cited",
    sourceType: "organic",
    searchPass: "open_web_exact",
    query: "Georgia Bulldogs Coca-Cola collector tray"
  }]);
  assert(noPriceExactBuckets.strongComparables.length === 1, "Exact secondary-market no-price references may remain visible as source-backed exact evidence.");
  assert(noPriceExactBuckets.itemIdentificationEvidence.length === 0, "Exact secondary-market source evidence should not be buried solely because the source is an archive or marketplace.");
  const noPriceWorthPointPrices = __queryIntegrityTestHooks.buildConsumerPricesFound(noPriceExactBuckets, 10);
  assert(noPriceWorthPointPrices.length === 1 && /Reference|Price Unavailable/i.test(noPriceWorthPointPrices[0].priceType) && !Number.isFinite(noPriceWorthPointPrices[0].itemPriceAmount), "Exact no-price reference/archive evidence may be visible but must remain price-unavailable context.");
  assert(__queryIntegrityTestHooks.canSupportPreliminaryAskingRangeFromVisibleRecord(noPriceExactBuckets.strongComparables[0]) === false, "No-price reference/archive evidence must not support Preliminary Asking-Price Range.");
  assert(summarizeCanonicalEvidence(noPriceExactBuckets).pricedRecordCount === 0, "Exact no-price reference/archive evidence must not become range-setting price evidence.");
  const mixedSourceRecords = {
    strongComparables: [
      priceRecord({ url: "https://example.com/duplicate?utm_source=a", canonicalUrl: "https://example.com/duplicate", delivery: "Shipping $8.00" }),
      priceRecord({ url: "https://example.com/duplicate?utm_source=b", canonicalUrl: "https://example.com/duplicate", delivery: "Shipping $8.00" }),
      priceRecord({ url: "https://example.com/bottle", title: "Georgia Bulldogs Coca-Cola bottle", candidateItemType: "bottle", itemTypeCompatible: false, itemTypeCompatibilityStatus: "item_type_mismatch" }),
      priceRecord({ url: "https://example.com/unknown-type", title: "Georgia Bulldogs Coca-Cola memorabilia", candidateItemType: "", itemTypeCompatible: false, itemTypeCompatibilityStatus: "candidate_type_unknown" })
    ],
    partialComparables: [
      priceRecord({ url: "https://example.com/partial-compatible", classification: "Partial Comparable", identityMatchStrength: "Partial", itemIdentityDifferences: "Same tray form but exact year is unclear." })
    ],
    referenceResults: [
      priceRecord({ url: "https://example.com/no-price", displayedPrice: "", price: "", priceType: "Reference Without Price" })
    ]
  };
  const mixedPrices = __queryIntegrityTestHooks.buildConsumerPricesFound(mixedSourceRecords, 10);
  assert(mixedPrices.filter((item) => /duplicate/.test(item.url)).length === 1, "Duplicate canonical-equivalent listing URLs should count once.");
  assert(!JSON.stringify(mixedPrices).includes("bottle") && !JSON.stringify(mixedPrices).includes("unknown-type"), "Mismatched and unknown item types must not appear in Prices Found.");
  assert(JSON.stringify(mixedPrices).includes("partial-compatible"), "Partial but product-type-compatible priced listings may appear in Prices Found.");
  assert(mixedPrices.some((item) => /no-price/.test(item.url) && item.displayedPrice === "Price unavailable"), "Exact identity/reference pages without usable price evidence must remain visible as Price unavailable.");
  const priceEvidence = summarizeCanonicalEvidence(mixedSourceRecords);
  assert(priceEvidence.pricedRecords.length === mixedPrices.filter((item) => Number(item.price) > 0).length, "Preliminary range should count compatible priced records only.");
  assert(mixedPrices.filter((item) => Number(item.price) > 0).every((item) => /^Yes/.test(item.includedInPreliminaryAskingPriceRange) && item.influencedVerifiedMarketRange === "No"), "Active/reference asking records should be included in the canonical active-asking group without influencing verified market value.");
  assert(priceEvidence.primaryRangeType === "current_asking", "Active compatible listings should appear separately under Current Asking-Price Range when no verified sold evidence exists.");
  const preliminaryOutlierSourceRecords = {
    partialComparables: [
      priceRecord({ url: "https://example.com/prelim-6", canonicalUrl: "https://example.com/prelim-6", displayedPrice: "$6.00", priceType: "Active Asking", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-18", canonicalUrl: "https://example.com/prelim-18", displayedPrice: "$18.00", priceType: "Active Asking", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-22", canonicalUrl: "https://example.com/prelim-22", displayedPrice: "$22.00", priceType: "Active Asking", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-30", canonicalUrl: "https://example.com/prelim-30", displayedPrice: "$30.00", priceType: "Active Asking", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-1155", canonicalUrl: "https://example.com/prelim-1155", title: "Georgia Bulldogs Coca-Cola collector tray rare signed premium variant", displayedPrice: "$1,155.00", priceType: "Active Asking", classification: "Partial Comparable", identityMatchStrength: "Partial", itemIdentityDifferences: "Signed premium variant; not the submitted ordinary tray." })
    ]
  };
  const preliminaryOutlierEvidence = summarizeCanonicalEvidence(preliminaryOutlierSourceRecords);
  assert(preliminaryOutlierEvidence.primaryRangeType === "current_asking", "Accepted active asking prices must remain in the canonical active-asking price-type group.");
  assert(preliminaryOutlierEvidence.low === 6 && preliminaryOutlierEvidence.high === 1155, "Canonical low/high must derive from every accepted independent support ID without a competing display-card outlier engine.");
  assert(preliminaryOutlierEvidence.outlierRecords.length === 0, "The translation-only summary must not independently exclude canonical support as outliers.");
  const preliminaryCards = __queryIntegrityTestHooks.buildConsumerPricesFound(preliminaryOutlierSourceRecords, 10);
  assert(JSON.stringify(preliminaryCards).includes("1,155"), "Display cards must not silently remove evidence used by the canonical range.");
  const weakCanonical = preliminaryOutlierSourceRecords.finalEvidenceResult;
  assert(weakCanonical.badgeResult.code === "pricing_support_limited", "Active asking evidence without verified sales must use a neutral canonical badge.");
  assert(weakCanonical.confidenceResult.pricing.level === "medium", "Multiple independent active asks may produce medium canonical pricing confidence.");
  assert(weakCanonical.badgeResult.label !== "Exceptional Value", "Weak asking evidence must not produce an Exceptional Value badge.");
  const weakOffer = weakCanonical.buyerOfferResult;
  assert(weakOffer.status === "asking_market_guidance", "Multiple independent active asks may produce only canonical asking-market guidance.");
  assert(weakOffer.basisCode === "active_asking_range", "Active-ask guidance must expose an active-asking basis.");
  assert(weakOffer.openingOffer < weakOffer.targetPrice, "Opening offer should stay below the target when canonical asking-market guidance is supported.");
  assert(weakOffer.targetPrice <= weakOffer.maximumPrice, "Canonical buyer-offer figures must remain ordered.");
  assert(/not (?:a )?verified market value/i.test(weakOffer.guidanceSummary), "Active-asking guidance must explicitly disclaim verified market value.");
  assert(typeof __queryIntegrityTestHooks.buildConsumerRecommendationText === "undefined", "The superseded recommendation override helper must remain deleted.");
  const soldOutranksActiveSource = {
    strongComparables: [
      priceRecord({ url: "https://example.com/sold-40", canonicalUrl: "https://example.com/sold-40", displayedPrice: "$40.00", priceType: "Verified Sold", rawText: "Sold for $40.00", classification: "Exact Match", identityMatchStrength: "Exact" }),
      priceRecord({ url: "https://example.com/sold-44", canonicalUrl: "https://example.com/sold-44", displayedPrice: "$44.00", priceType: "Verified Sold", rawText: "Verified sold price $44.00", classification: "Strong Similar Match", identityMatchStrength: "Strong" }),
      priceRecord({ url: "https://example.com/active-15", canonicalUrl: "https://example.com/active-15", displayedPrice: "$15.00", priceType: "Active Asking", classification: "Exact Match", identityMatchStrength: "Exact" })
    ]
  };
  const soldOutranksActive = summarizeCanonicalEvidence(soldOutranksActiveSource);
  assert(soldOutranksActive.primaryRangeType === "verified_market", "Verified sold exact/strong evidence should outrank active asking evidence.");
  assert(/\$40\.00-\$44\.00/.test(soldOutranksActive.verifiedMarketRange), "Verified Market Range should be based on sold exact/strong prices.");
  const supportedHighOffer = soldOutranksActiveSource.finalEvidenceResult.buyerOfferResult;
  assert(supportedHighOffer.status === "market_supported", "Multiple verified sold records may support canonical numerical guidance.");
  assert(supportedHighOffer.maximumPrice > supportedHighOffer.targetPrice, "Strong verified sold evidence can support a maximum above the current target when justified.");
  assert(/verified[- ]sold/i.test(supportedHighOffer.guidanceSummary), "Market-supported guidance should explain its verified-sold basis.");
  const singleActiveAskingSource = {
    strongComparables: [
      priceRecord({ url: "https://example.com/active-22", canonicalUrl: "https://example.com/active-22", displayedPrice: "$22.00", priceType: "Active Asking", classification: "Exact Match", identityMatchStrength: "Exact" })
    ]
  };
  summarizeCanonicalEvidence(singleActiveAskingSource);
  const singleActiveOffer = singleActiveAskingSource.finalEvidenceResult.buyerOfferResult;
  assert(singleActiveOffer.status === "asking_price_context_only", "A single active asking listing must remain context only.");
  assert(singleActiveOffer.openingOffer === null && singleActiveOffer.targetPrice === null && singleActiveOffer.maximumPrice === null, "A single active asking listing cannot create numerical buyer guidance.");
  assert(!/negotiate (?:up|above)|raise .*offer/i.test(singleActiveOffer.guidanceSummary), "Canonical guidance must not tell a buyer to negotiate upward.");
  const activeSoldWording = summarizeCanonicalEvidence({
    strongComparables: [
      priceRecord({ url: "https://example.com/sold-word-active", canonicalUrl: "https://example.com/sold-word-active", title: "Sold-style Georgia Bulldogs Coca-Cola tray listing", displayedPrice: "$18.00", priceType: "Active Asking", rawText: "For sale current listing asking price $18.00", classification: "Exact Match", identityMatchStrength: "Exact" })
    ]
  });
  assert(activeSoldWording.primaryRangeType === "current_asking", "Active listings cannot drive Verified Market Range merely because their title resembles sold wording.");
  const activeOutranksPartial = summarizeCanonicalEvidence({
    strongComparables: [
      priceRecord({ url: "https://example.com/active-24", canonicalUrl: "https://example.com/active-24", displayedPrice: "$24.00", priceType: "Active Asking", classification: "Exact Match", identityMatchStrength: "Exact" })
    ],
    partialComparables: [
      priceRecord({ url: "https://example.com/partial-6", canonicalUrl: "https://example.com/partial-6", displayedPrice: "$6.00", priceType: "Reference Price", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/partial-1155", canonicalUrl: "https://example.com/partial-1155", displayedPrice: "$1,155.00", priceType: "Estimated/Guide Price", classification: "Partial Comparable", identityMatchStrength: "Partial" })
    ]
  });
  assert(activeOutranksPartial.primaryRangeType === "current_asking", "Active exact/strong asking evidence should outrank partial/reference prices when sold evidence is absent.");
  assert(/Current Asking-Price Range/i.test(activeOutranksPartial.currentAskingPriceRange), "Current asking bucket should expose its own customer-facing range label.");
  const socialThriftHaulBulkRecord = priceRecord({
    title: "I FOUND 14 vintage Coca-Cola trays at the thrift for $4.99",
    source: "Facebook group post",
    url: "https://www.facebook.com/groups/thriftfinds/posts/14-coke-trays",
    canonicalUrl: "https://www.facebook.com/groups/thriftfinds/posts/14-coke-trays",
    displayedPrice: "$4.99",
    priceType: "Verified Sold",
    rawText: "Facebook social post: I FOUND 14 vintage Coca-Cola trays at the thrift for $4.99",
    classification: "Strong Similar Match",
    identityMatchStrength: "Strong",
    evidenceRole: "Comparable evidence - Verified Sold"
  });
  assert(__queryIntegrityTestHooks.isBulkLotReferenceWithoutUnitPrice(socialThriftHaulBulkRecord), "A 14-tray thrift-haul post should be recognized as a bulk/lot reference without unit pricing.");
  assert(__queryIntegrityTestHooks.isNonTransactionalContentRecord(socialThriftHaulBulkRecord), "Facebook thrift-haul content should be treated as non-transactional.");
  assert(__queryIntegrityTestHooks.normalizePriceTypeLabel("Verified Sold", socialThriftHaulBulkRecord) === "Bulk/Lot Reference", "Bulk/social thrift-haul content must not keep a Verified Sold badge.");
  assert(__queryIntegrityTestHooks.hasExplicitSoldTransactionProof(socialThriftHaulBulkRecord) === false, "A thrift-haul/social post must not be treated as explicit completed transaction proof.");
  assert(__queryIntegrityTestHooks.isQualifiedVerifiedSoldPriceEvidence(socialThriftHaulBulkRecord, "Verified Sold", "Strong") === false, "Non-transactional bulk/social content must not count as qualified verified sold evidence.");
  const socialThriftHaulPrices = __queryIntegrityTestHooks.buildConsumerPricesFound({ strongComparables: [socialThriftHaulBulkRecord] }, 10);
  assert(socialThriftHaulPrices.length === 0, "Non-transactional bulk/social content must not appear in customer-facing Prices Found cards.");
  const socialThriftHaulEvidence = summarizeCanonicalEvidence({ strongComparables: [socialThriftHaulBulkRecord] });
  assert(socialThriftHaulEvidence.pricedRecordCount === 0 && socialThriftHaulEvidence.soldExactStrongCount === 0, "Non-transactional bulk/social content must not drive any price range or verified sold counts.");
  const facebookMarketplaceSold = priceRecord({
    title: "Facebook Marketplace Coca-Cola tray marked sold",
    source: "Facebook Marketplace",
    url: "https://www.facebook.com/marketplace/item/123456789",
    canonicalUrl: "https://www.facebook.com/marketplace/item/123456789",
    displayedPrice: "$18.00",
    priceType: "Verified Sold",
    rawText: "Facebook Marketplace completed sale: marked sold for $18.00.",
    classification: "Exact Match",
    identityMatchStrength: "Exact",
    evidenceRole: "Comparable evidence - Verified Sold"
  });
  assert(__queryIntegrityTestHooks.hasExplicitSoldTransactionProof(facebookMarketplaceSold), "Facebook Marketplace can qualify only when marketplace context and explicit sold/completed status are present.");
  assert(__queryIntegrityTestHooks.isQualifiedVerifiedSoldPriceEvidence(facebookMarketplaceSold, "Verified Sold", "Exact"), "Explicit Facebook Marketplace completed-sale evidence can qualify when item identity and price are compatible.");
  const soldOnlyPrices = __queryIntegrityTestHooks.buildConsumerPricesFound({
    strongComparables: [
      priceRecord({
        url: "https://www.ebay.com/itm/sold-compatible-tray",
        canonicalUrl: "https://www.ebay.com/itm/sold-compatible-tray",
        displayedPrice: "$18.00",
        priceType: "Verified Sold",
        rawText: "Completed sale sold for $18.00.",
        classification: "Exact Match",
        identityMatchStrength: "Exact"
      })
    ]
  }, 10);
  assert(soldOnlyPrices.length === 1 && soldOnlyPrices[0].priceType === "Verified sold", "Qualified historical sold evidence may remain visible as historical context.");
  assert(__queryIntegrityTestHooks.buildBestCompatiblePriceFound(soldOnlyPrices) === null, "Historical sold evidence alone must not become Best Compatible Price Found.");
  assert(/No compatible current purchasing option with a confirmed delivered cost/i.test(__queryIntegrityTestHooks.buildCurrentPurchaseOptionSummary(soldOnlyPrices)), "Historical sold-only evidence should explain that no current confirmed delivered-cost option was found.");
  const parsedList = __queryIntegrityTestHooks.parseListLikeSearchPhrases("['GEORGIA', '1980 NATIONAL CHAMPIONS', 'Official Bulldogs']");
  assert(parsedList.includes("GEORGIA") && parsedList.includes("1980 NATIONAL CHAMPIONS") && parsedList.includes("Official Bulldogs"), "Serialized list-like visible phrases should become clean individual phrases.");
  const malformedCandidates = [
    "\"\"GEORGIA', '1980 NATIONAL CHAMPIONS', 'Official Bulldogs\" Coca-Cola collector tray",
    "\"\"'Official Bulldogs Tray', 'Vince Dooley',\" Coca-Cola collector tray"
  ];
  for (const malformed of malformedCandidates) {
    const cleanedMalformed = __queryIntegrityTestHooks.cleanSerperQuery(malformed);
    const validation = __queryIntegrityTestHooks.validateSerperQueryCandidate(cleanedMalformed, georgiaQueryContext, { rawCandidate: malformed, searchPass: "open_web_exact" });
    assert(validation.passed === false, `Malformed serialized-list query should be rejected: ${malformed}`);
    assert(/serialized_list_artifact|quotation_marks|malformed_exact/i.test(validation.reason), `Malformed query should explain syntax failure, got ${validation.reason}.`);
    const requestRecord = __queryIntegrityTestHooks.createSerperRequestRecord({
      query: cleanedMalformed || malformed,
      priority: 1,
      searchPass: "open_web_exact",
      validationPassed: false,
      validationFailureReason: validation.reason
    });
    assert(requestRecord.attempted === false && requestRecord.failureStage === "invalid_query_preflight", "Malformed rejected queries should not be attempted.");
  }
  const cleanExact = __queryIntegrityTestHooks.cleanSerperQuery("\"GEORGIA\" \"1980 NATIONAL CHAMPIONS\" \"Official Bulldogs\" Coca-Cola collector tray");
  assert(((cleanExact.match(/"/g) || []).length % 2) === 0, "Clean reconstructed exact query should have balanced quotation marks.");
  assert(__queryIntegrityTestHooks.validateSerperQueryCandidate(cleanExact, georgiaQueryContext, { rawCandidate: cleanExact, searchPass: "open_web_exact" }).passed === true, "Clean product-specific exact query should pass preflight.");
  const rejectedShapes = [
    ["Coca-Cola", "brand-only query"],
    ["Vince Dooley", "person-only query"],
    ["1980", "year-only query"],
    ["collector tray", "category-only query"],
    ["Un", "incomplete fragment"],
    ["1980 Un", "year plus fragment"]
  ];
  for (const [query, label] of rejectedShapes) {
    const validation = __queryIntegrityTestHooks.validateSerperQueryCandidate(query, georgiaQueryContext, { rawCandidate: query, searchPass: "broader_fallback" });
    assert(validation.passed === false, `${label} should be rejected before provider execution.`);
    const requestRecord = __queryIntegrityTestHooks.createSerperRequestRecord({
      query,
      priority: 1,
      searchPass: "broader_fallback",
      validationPassed: false,
      validationFailureReason: validation.reason
    });
    assert(requestRecord.attempted === false && requestRecord.failureStage === "invalid_query_preflight", `${label} should consume no provider call.`);
  }

  const queryPlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: [
      "Vin",
      "1980 Un",
      "Coca-Cola",
      "\"\"GEORGIA', '1980 NATIONAL CHAMPIONS', 'Official Bulldogs\" Coca-Cola collector tray",
      "\"GEORGIA\" \"1980 NATIONAL CHAMPIONS\" \"Official Bulldogs\" Coca-Cola collector tray",
      "1980 University of Georgia Bulldogs Coca-Cola collector tray",
      "\"HOW 'BOUT THEM DAWGS\" Coca-Cola collector tray",
      "1980 University of Georgia Bulldogs Coca-Cola collector tray"
    ],
    sourceRoute: [
      "eBay-style active and sold resale results",
      "Etsy-style vintage and advertising collectible results",
      "Mercari-style resale results",
      "WorthPoint-style reference clues where accessible",
      "PicClick-style marketplace index results"
    ],
    identity: identityFor("georgia"),
    buyerIntake: {
      purchase_context: "antique_mall",
      asking_price: "$10",
      purchase_intent: "personal_use",
      item_condition: "used",
      buyer_notes: "vintage Coca-Cola Georgia Bulldogs tray"
    },
    notes: "vintage Coca-Cola Georgia Bulldogs collector tray 1980 University of Georgia National Champions Vince Dooley"
  });
  const invalidPlanRecords = queryPlan.filter((record) => record.validationPassed === false);
  const validPlanRecords = queryPlan.filter((record) => record.validationPassed !== false);
  assert(invalidPlanRecords.some((record) => record.rawCandidate === "Vin" && record.validationFailureReason === "incomplete_word_fragment"), "Vin should be rejected before provider execution.");
  assert(invalidPlanRecords.some((record) => record.rawCandidate === "1980 Un" && record.validationFailureReason === "year_plus_short_fragment"), "1980 Un should be rejected before provider execution.");
  assert(invalidPlanRecords.some((record) => record.rawCandidate === "Coca-Cola" && record.validationFailureReason === "brand_only_query"), "Brand-only fallback should be rejected before provider execution.");
  assert(invalidPlanRecords.some((record) => /GEORGIA'.*Official Bulldogs/.test(record.rawCandidate) && record.validationFailureReason === "serialized_list_artifact"), "Malformed serialized-list exact query should be rejected before provider execution.");
  assert(invalidPlanRecords.every((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record).attempted === false), "Invalid query records should not be attempted.");
  assert(invalidPlanRecords.every((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record).failureStage === "invalid_query_preflight"), "Invalid query records should report the preflight failure stage.");
  assert(validPlanRecords.some((record) => /1980 University of Georgia Bulldogs Coca-Cola collector tray/i.test(record.query)), "Long identity phrase should survive to final provider query.");
  assert(validPlanRecords.some((record) => /"GEORGIA" "1980 NATIONAL CHAMPIONS" "Official Bulldogs" Coca-Cola collector tray/i.test(record.query)), "Clean reconstructed exact phrase query should survive to final provider query.");
  assert(validPlanRecords.some((record) => /"HOW 'BOUT THEM DAWGS"/i.test(record.query)), "Exact quoted visible wording should be preserved.");
  const marketplacePlanRecord = validPlanRecords.find((record) => record.searchPass === "marketplace_site_google");
  assert(marketplacePlanRecord && /Coca-Cola|Georgia Bulldogs|collector tray|1980/i.test(marketplacePlanRecord.query), "Marketplace site query should append domains to a complete identity query.");
  assert(marketplacePlanRecord && /site:ebay\.com|site:etsy\.com|site:mercari\.com|site:worthpoint\.com|site:picclick\.com/i.test(marketplacePlanRecord.query), "Marketplace site query should retain domain routing.");
  assert(new Set(validPlanRecords.map((record) => record.query.toLowerCase())).size === validPlanRecords.length, "Duplicate cleanup should not keep repeated weaker query records.");
  assert(validPlanRecords.every((record) => /tray/i.test(record.query)), "Broader valid queries should retain the concrete product noun.");
  const recoveryQueries = validPlanRecords.filter((record) => /recovery/i.test(record.searchPass || ""));
  assert(recoveryQueries.length > 0, "Recovery query passes should be available when compatible priced evidence is scarce.");
  assert(recoveryQueries.some((record) => /collectible_exact_source_recovery|marketplace_domain_recovery/i.test(record.searchPass) && /\bsite:[a-z0-9.-]+/i.test(record.query) && !/\bOR\b/.test(record.query)), "Recovery should include separate source-domain site searches, not only one OR query.");
  assert(recoveryQueries.some((record) => record.searchPass === "price_oriented_recovery"), "Recovery should include price-oriented searches.");
  assert(recoveryQueries.some((record) => record.searchPass === "shopping_general_recovery"), "Recovery should include shopping/general web searches.");

  const collectibleIntake = __queryIntegrityTestHooks.normalizeBuyerIntake({
    purchase_context: "antique_mall",
    asking_price: "$10",
    purchase_intent: "personal_use",
    item_condition: "used",
    buyer_notes: "vintage Coca-Cola Georgia Bulldogs tray"
  });
  const collectibleIdentity = __queryIntegrityTestHooks.finalizeIdentityForResearch(identityFor("georgia"), collectibleIntake);
  const collectibleRoute = __queryIntegrityTestHooks.routeMarketSources(collectibleIdentity, collectibleIntake, "vintage advertising collectible auction");
  const collectibleContext = __queryIntegrityTestHooks.buildSearchQueryContext(
    collectibleIdentity,
    collectibleRoute,
    "vintage advertising collectible auction HOW 'BOUT THEM DAWGS 1980 NATIONAL CHAMPIONS Vince Dooley",
    collectibleIntake
  );
  const secondaryTargets = __queryIntegrityTestHooks.buildSecondaryMarketAuctionTargets(collectibleContext, 8).map((target) => target.domain);
  assert(secondaryTargets.includes("ebay.com") && secondaryTargets.includes("liveauctioneers.com") && secondaryTargets.includes("hibid.com"), "Collectible routing should use a data-driven secondary-market and auction registry.");
  const collectibleLadder = __queryIntegrityTestHooks.buildCollectibleAttributeSearchLadder(collectibleContext);
  assert(collectibleLadder.some((query) => /HOW '?BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS/i.test(query)), "Collectible exact-search ladder should preserve visible slogans and event wording.");
  const collectiblePlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: __queryIntegrityTestHooks.buildLiveSearchQueries(
      collectibleIdentity,
      collectibleRoute,
      "vintage Coca-Cola Georgia Bulldogs collector tray 1980 University of Georgia National Champions Vince Dooley",
      collectibleIntake
    ),
    sourceRoute: collectibleRoute,
    identity: collectibleIdentity,
    buyerIntake: collectibleIntake,
    notes: "vintage Coca-Cola Georgia Bulldogs collector tray 1980 University of Georgia National Champions Vince Dooley"
  });
  const collectibleAttempted = collectiblePlan
    .map((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record))
    .filter((record) => record.attempted);
  assert(collectibleAttempted.length <= 12, "Collectible Serper plan should remain within the existing bounded general provider-call budget.");
  assert(collectibleAttempted.some((record) => record.searchPass === "collectible_exact_source_recovery"), "Collectible exact source recovery should be executable, not display-only.");
  assert(collectibleAttempted.some((record) => /site:liveauctioneers\.com|site:hibid\.com|site:invaluable\.com/i.test(record.query)), "Collectible recovery should include bounded auction-domain site queries.");
  assert(__queryIntegrityTestHooks.retailSerperBudgetAllocation.maxProviderCalls === 28, "Retail provider-call ceiling must remain 28.");

  const collectibleQueryRecord = {
    query: "\"HOW 'BOUT THEM DAWGS\" Coca-Cola Georgia Bulldogs collector tray site:liveauctioneers.com",
    searchPass: "collectible_exact_source_recovery",
    searchType: "organic_web",
    providerEndpoint: "serper_search",
    marketplaceDomains: ["liveauctioneers.com"]
  };
  const rawAuctionRecords = __queryIntegrityTestHooks.parseSerperResponse({
    organic: [
      {
        title: "HOW 'BOUT THEM DAWGS Georgia Coca-Cola collector tray current bid",
        link: "https://www.liveauctioneers.com/item/exact-current-bid",
        snippet: "Current bid $15.00 for HOW 'BOUT THEM DAWGS 1980 NATIONAL CHAMPIONS Coca-Cola collector tray with Vince Dooley wording.",
        position: 1
      },
      {
        title: "HOW 'BOUT THEM DAWGS Georgia Coca-Cola collector tray opening bid",
        link: "https://hibid.com/lot/exact-opening-bid",
        snippet: "Opening bid $10.00 for exact collector tray with 1980 NATIONAL CHAMPIONS and Vince Dooley wording.",
        position: 2
      },
      {
        title: "HOW 'BOUT THEM DAWGS Georgia Coca-Cola collector tray auction estimate",
        link: "https://www.invaluable.com/auction-lot/exact-estimate",
        snippet: "Auction estimate $40.00 to $60.00 for exact Coca-Cola Georgia Bulldogs 1980 NATIONAL CHAMPIONS collector tray.",
        position: 3
      },
      {
        title: "HOW 'BOUT THEM DAWGS Georgia Coca-Cola collector tray auction result",
        link: "https://www.auctionzip.com/auction-lot/exact-sold-result",
        snippet: "Sold for $32.00. Price realized for exact 1980 NATIONAL CHAMPIONS Coca-Cola tray with Vince Dooley wording.",
        position: 4
      },
      {
        title: "HOW 'BOUT THEM DAWGS Georgia Coca-Cola collector tray closed unsold",
        link: "https://www.liveauctioneers.com/item/exact-unsold",
        snippet: "Closed unsold listing. Not sold at $20.00 for exact collector tray with 1980 NATIONAL CHAMPIONS wording.",
        position: 5
      },
      {
        title: "HOW 'BOUT THEM DAWGS Georgia Coca-Cola collector tray active listing",
        link: "https://www.mercari.com/us/item/exact-price-not-shown/",
        snippet: "Active listing for exact tray with 1980 NATIONAL CHAMPIONS and Vince Dooley wording. Price not shown.",
        position: 6
      },
      {
        title: "HOW 'BOUT THEM DAWGS Georgia Coca-Cola collector tray Buy It Now",
        link: "https://www.ebay.com/itm/exact-buy-it-now",
        snippet: "Buy It Now $25.00 for exact 1980 NATIONAL CHAMPIONS Coca-Cola collector tray with Vince Dooley wording. Active listing.",
        position: 7
      },
      {
        title: "Different 1981 Georgia Bulldogs Coca-Cola serving tray",
        link: "https://www.ebay.com/itm/different-1981-tray",
        snippet: "Different design active asking price $29.99.",
        position: 8
      }
    ],
    shopping: [],
    relatedSearches: []
  }, collectibleQueryRecord).records;
  const normalizedAuctionRecords = __queryIntegrityTestHooks.normalizeSerperCandidateRecords(rawAuctionRecords, collectibleIdentity, collectibleContext);
  const auctionRecordFor = (pattern) => normalizedAuctionRecords.find((record) => pattern.test(record.url));
  const liveAuctionBid = auctionRecordFor(/exact-current-bid/);
  const hibidOpeningBid = auctionRecordFor(/exact-opening-bid/);
  const invaluableEstimate = auctionRecordFor(/exact-estimate/);
  const auctionZipSold = auctionRecordFor(/exact-sold-result/);
  const liveAuctionUnsold = auctionRecordFor(/exact-unsold/);
  const mercariNoPrice = auctionRecordFor(/exact-price-not-shown/);
  const ebayBuyItNow = auctionRecordFor(/exact-buy-it-now/);
  const differentDesign = auctionRecordFor(/different-1981-tray/);
  assert(liveAuctionBid?.identityMatchStrength === "Exact" && liveAuctionBid.retained !== false, "Auction origin must not reject an exact design/object match.");
  assert(liveAuctionBid.priceEvidenceType === "Auction Current Bid", "Current auction bid must remain a current bid.");
  assert(hibidOpeningBid.priceEvidenceType === "Auction Opening Bid", "Opening bid must remain an opening bid.");
  assert(invaluableEstimate.priceEvidenceType === "Auction Estimate", "Auction estimate must remain an estimate.");
  assert(auctionZipSold.priceTypeLabel === "Completed Auction", "Confirmed auction sales should be labeled as completed auction evidence instead of active bids.");
  assert(liveAuctionUnsold.priceEvidenceType === "Closed Unsold Listing", "Closed unsold listing must not become sold or active asking evidence.");
  assert(mercariNoPrice.priceEvidenceType === "Active Listing", "Exact active listing with no visible price should keep active-listing status.");
  assert(ebayBuyItNow.priceEvidenceType === "Buy It Now" && ebayBuyItNow.priceTypeLabel === "Buy It Now", "Explicit Buy It Now must remain Buy It Now through parsing and normalization.");
  assert(__queryIntegrityTestHooks.classifySerperPriceEvidence({ title: "Exact tray active listing", snippet: "Active listing price $19.99.", displayedPriceText: "$19.99", parsedPrice: 19.99, domain: "ebay.com" }) === "Active Asking", "Generic active listings without explicit Buy It Now evidence should remain Active Asking.");
  assert(__queryIntegrityTestHooks.classifySerperPriceEvidence({ title: "Exact tray current bid", snippet: "Current bid $15.00 with Buy It Now unavailable.", displayedPriceText: "$15.00", parsedPrice: 15, domain: "hibid.com" }) === "Auction Current Bid", "Buy It Now wording must not overwrite current bid evidence.");
  assert(__queryIntegrityTestHooks.classifySerperPriceEvidence({ title: "Exact tray auction estimate", snippet: "Auction estimate $40.00 to $60.00; Buy It Now not shown.", displayedPriceText: "$40.00", parsedPrice: 40, domain: "invaluable.com" }) === "Auction Estimate", "Buy It Now wording must not overwrite auction estimate evidence.");
  assert(__queryIntegrityTestHooks.classifySerperPriceEvidence({ title: "Exact tray sold result", snippet: "Sold for $32.00. Buy It Now listing ended.", displayedPriceText: "$32.00", parsedPrice: 32, domain: "auctionzip.com" }) === "Confirmed Sold", "Buy It Now wording must not overwrite verified sold evidence.");
  assert(__queryIntegrityTestHooks.classifySerperPriceEvidence({ title: "Exact tray closed unsold", snippet: "Closed unsold listing. Buy It Now $20.00 was not sold.", displayedPriceText: "$20.00", parsedPrice: 20, domain: "liveauctioneers.com" }) === "Closed Unsold Listing", "Buy It Now wording must not overwrite closed-unsold evidence.");
  assert(__queryIntegrityTestHooks.classifySerperPriceEvidence({ title: "Exact tray completed auction", snippet: "Completed auction result. Winning bid sold at auction for $32.00.", displayedPriceText: "$32.00", parsedPrice: 32, domain: "liveauctioneers.com", url: "https://www.liveauctioneers.com/item/completed-auction" }) === "Completed Auction", "Completed auction results with transaction proof should remain distinct from active bids.");
  assert(__queryIntegrityTestHooks.isRelatedDesignOnlyRecord(differentDesign), "Different designs should be marked as related-only evidence.");

  const auctionBuckets = __queryIntegrityTestHooks.bucketSerperRecords(normalizedAuctionRecords);
  const collectiblePrices = __queryIntegrityTestHooks.buildConsumerPricesFound({
    strongComparables: auctionBuckets.strongComparables,
    partialComparables: auctionBuckets.partialComparables,
    itemIdentificationEvidence: auctionBuckets.itemIdentificationEvidence,
    referenceResults: auctionBuckets.referenceResults
  }, 10, { identity: collectibleIdentity, buyerIntake: collectibleIntake });
  assert(collectiblePrices.some((record) => /liveauctioneers\.com\/item\/exact-current-bid/i.test(record.url) && record.priceType === "Current bid"), "Exact auction current bid should reach the primary compact evidence list.");
  assert(collectiblePrices.some((record) => /ebay\.com\/itm\/exact-buy-it-now/i.test(record.url) && record.priceType === "Buy It Now"), "Exact Buy It Now listing should reach the primary compact evidence list.");
  assert(collectiblePrices.some((record) => /mercari\.com\/us\/item\/exact-price-not-shown/i.test(record.url) && record.priceType === "Price unavailable" && !Number.isFinite(record.itemPriceAmount)), "Exact active listing without visible price should remain showable.");
  assert(!collectiblePrices.some((record) => /different-1981-tray/i.test(record.url)), "Different designs cannot replace exact design evidence in the primary list.");

  const noSoldBuckets = __queryIntegrityTestHooks.bucketSerperRecords(normalizedAuctionRecords.filter((record) => !/auctionzip\.com/i.test(record.url)));
  const noSoldEvidence = summarizeCanonicalEvidence({
    strongComparables: noSoldBuckets.strongComparables,
    partialComparables: noSoldBuckets.partialComparables,
    referenceResults: noSoldBuckets.referenceResults
  });
  assert(noSoldEvidence.hasVerifiedSoldEvidence === false, "No verified sold evidence should be reported when only Buy It Now, current bids, opening bids, estimates, unsold listings, or no-price listings survive.");
  assert(noSoldEvidence.primaryRangeType !== "verified_market", "Auction bids and estimates cannot establish a verified market range.");
  assert(
    noSoldEvidence.pricedRecords.some((record) => record.priceType === "Buy It Now")
      && noSoldEvidence.rangeResults.activeAsking.evidenceIds.length > 0,
    "Buy It Now may support the canonical active-asking group while staying outside verified-market evidence."
  );
  const completedAuctionEvidence = summarizeCanonicalEvidence({
    strongComparables: [
      priceRecord({ url: "https://example.com/completed-auction", canonicalUrl: "https://example.com/completed-auction", displayedPrice: "$32.00", priceType: "Completed Auction", rawText: "Completed auction result. Winning bid sold at auction for $32.00.", classification: "Exact Match", identityMatchStrength: "Exact" })
    ]
  });
  assert(completedAuctionEvidence.primaryRangeType === "verified_market" && completedAuctionEvidence.hasVerifiedSoldEvidence === true, "Completed auction transaction evidence should support the verified-market bucket.");
  const exactNoPriceAndRelated = normalizedAuctionRecords.filter((record) => /exact-price-not-shown|different-1981-tray/i.test(record.url));
  const relatedOnlyBuckets = __queryIntegrityTestHooks.bucketSerperRecords(exactNoPriceAndRelated);
  const relatedOnlyEvidence = summarizeCanonicalEvidence({
    strongComparables: relatedOnlyBuckets.strongComparables,
    partialComparables: relatedOnlyBuckets.partialComparables,
    referenceResults: relatedOnlyBuckets.referenceResults
  });
  assert(relatedOnlyEvidence.pricedRecordCount === 0 && !relatedOnlyEvidence.primaryRangeType, "Related items cannot create a range when the exact current listing lacks sold-price evidence.");
  assert(__queryIntegrityTestHooks.shouldRunCollectibleExactRecovery(collectibleContext, [differentDesign]), "Exact-result recovery should trigger when only different designs survive.");
  assert(__queryIntegrityTestHooks.shouldRunCollectibleExactRecovery(collectibleContext, [{ ...liveAuctionBid, retained: false, identityMatchStrength: "Rejected" }]), "Exact-result recovery should trigger when exact raw candidates are suppressed before the customer list.");
  const noSoldPrices = collectiblePrices.filter((record) => !/auctionzip\.com/i.test(record.url));
  const exactNotice = __queryIntegrityTestHooks.buildConsumerPricingSummary({
    priceEvidence: noSoldEvidence,
    searchCompleted: true,
    pricesFound: noSoldPrices
  });
  assert(/An exact current listing was found at .* for .*active asking price, Buy It Now listing, or auction bid, not a confirmed market value/i.test(exactNotice), "Exact active listing notice should distinguish Buy It Now/listing/bid evidence from confirmed market value.");

  const holiday = await runScenario("holiday");
  assert(holiday.report.analysisId === "analysis-test-holiday", "Holiday analysis id should round-trip.");

  const georgia = await runScenario("georgia");
  assert(georgia.report.analysisId === "analysis-test-georgia", "Georgia analysis id should round-trip.");
  assert(!georgia.json.includes(leakedPhrase), "Client-visible Georgia JSON should not include leaked prompt phrase.");
  assert(!georgia.json.includes("\\n"), "Client-visible Georgia JSON should not include literal slash-n sequences.");
  assert(!/holiday decor \/ collectible/i.test(georgia.json), "Georgia report should not inherit old holiday decor wording.");
  assert(!/Santa's Workshop|GAB031/i.test(georgia.json), "Georgia report should not inherit the prior holiday session.");
  assert(!georgia.json.includes(fakeSerperKeyValue), "Client-visible Georgia JSON should not include the Serper key value.");
  assert(!georgia.json.includes("X-API-KEY"), "Client-visible Georgia JSON should not include Serper authentication headers.");

  const diagnostics = georgia.report.searchDiagnostics;
  assert(diagnostics.searchProviderUsed === "Serper Google Search", "Serper should be the primary search provider when configured.");
  assert(diagnostics.queryTransmissionMode === "query_bound_serper_requests", "Diagnostics should use query-bound Serper request mode.");
  assert(diagnostics.serperConfigured === true, "Diagnostics should confirm Serper is configured without exposing the key.");
  assert(diagnostics.fallbackProviderUsed === false, "OpenAI web_search fallback should not run when Serper succeeds.");
  assert(Array.isArray(diagnostics.providerRequestRecords) && diagnostics.providerRequestRecords.length > 0, "Provider request records should exist.");
  const attemptedRecords = diagnostics.providerRequestRecords.filter((record) => record.attempted);
  assert(attemptedRecords.length <= 12, "Serper query budget should stay within the bounded recovery call budget.");
  assert(attemptedRecords.length > 0 && attemptedRecords.every((record) => diagnostics.queriesActuallySent.includes(record.query)), "Sent queries should match attempted provider records.");
  assert(attemptedRecords.some((record) => /HOW '?BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS|Vince Dooley/i.test(record.query)), "Exact Georgia visible clues should be prioritized into attempted queries.");
  assert(attemptedRecords.some((record) => /Coca-Cola/i.test(record.query)), "Coca-Cola punctuation should survive attempted queries.");
  assert(attemptedRecords.some((record) => record.searchPass === "open_web_exact"), "Open-web exact pass should be recorded.");
  assert(attemptedRecords.some((record) => record.searchPass === "marketplace_site_google"), "Marketplace site pass should be recorded.");
  assert(Array.isArray(diagnostics.allowedDomainsRequested) && diagnostics.allowedDomainsRequested.includes("ebay.com"), "Marketplace allowed domains should include ebay.com for sports collectible tray routing.");
  assert(diagnostics.providerSourceCount > 0, "Provider source count should be tracked separately from visible comps.");
  assert(diagnostics.organicResultCount > 0, "Organic result count should be tracked.");
  assert(diagnostics.shoppingResultCount > 0, "Shopping result count should be tracked.");
  assert(diagnostics.domainsActuallyReturned.includes("ebay.com"), "Returned domains should come from actual Serper result URLs.");
  assert(diagnostics.deduplicatedCandidateCount < diagnostics.providerSourceCount, "Duplicate listings should merge after URL canonicalization.");
  assert(diagnostics.exactCandidateCount > 0, "Exact candidates should be counted.");
  assert(diagnostics.strongSimilarCandidateCount > 0, "Strong-similar candidates should be counted.");
  assert(Number.isFinite(diagnostics.pricedCandidateCount) && diagnostics.pricedCandidateCount >= diagnostics.compatiblePricedCandidateCount, "Diagnostics should track priced and compatible priced candidates.");
  assert(Number.isFinite(diagnostics.noPriceIdentityReferenceCount), "Diagnostics should track no-price identity references.");
  assert(Number.isFinite(diagnostics.rejectedMismatchCount), "Diagnostics should track rejected mismatches.");
  assert(diagnostics.compatiblePricedRecoveryThreshold === 3, "Diagnostics should expose the compatible priced recovery threshold.");
  assert(Array.isArray(diagnostics.recoverySearchPassesAttempted), "Diagnostics should list recovery search passes attempted.");
  assert(Array.isArray(georgia.report.weFoundThisItem) && georgia.report.weFoundThisItem.length > 0, "Exact active listing should remain visible.");
  assert(JSON.stringify(georgia.report.strongComparables || []).includes("https://www.ebay.com/itm/georgia-coca-cola-tray"), "Exact tray URL should remain visible.");
  assert(JSON.stringify(georgia.report.strongComparables || []).includes("Active Asking") || JSON.stringify(georgia.report.strongComparables || []).includes("Shopping Offer"), "Visible exact/strong cards should label asking/shopping evidence accurately.");
  assert(!JSON.stringify(georgia.report.strongComparables || []).includes("georgia-coca-cola-bottle"), "Mismatched bottle result must not remain in exact/strong comparable evidence.");
  assert(JSON.stringify([georgia.report.referenceResults, georgia.report.rejectedMatches]).includes("georgia-coca-cola-bottle"), "Mismatched bottle result may be retained only as reference or rejected transparency evidence.");
  assert(JSON.stringify([georgia.report.referenceResults, georgia.report.rejectedMatches]).includes("Influenced Verified Market Range"), "Mismatched product-form evidence should use explicit verified/preliminary range labels.");

  const querySet = new Set(attemptedRecords.map((record) => record.query.toLowerCase()));
  assert(querySet.size === attemptedRecords.length, "Duplicate Serper queries should not be sent.");
  assert(georgia.serperPayloads.length === diagnostics.providerRequestRecords.filter((record) => record.attempted).length, "Serper payload count should match attempted provider request records.");
  assert(georgia.serperPayloads.every((item) => item.hasApiKeyHeader), "Serper requests should include the server-side API key header.");
  assert(georgia.serperPayloads.every((item) => item.gl === "us" && item.hl === "en" && item.num === 10), "Serper requests should use expected US English defaults.");
  assert(georgia.serperPayloads.every((item) => item.q !== "Vin" && item.q !== "1980 Un"), "Invalid query fragments should never be sent to Serper.");
  assert(diagnostics.providerRequestRecords.filter((record) => record.validationPassed === false).every((record) => record.attempted === false), "Preflight-rejected records should consume zero mocked Serper calls.");
  assert(georgia.serperPayloads.every((item) => !item.q.includes(leakedPhrase)), "Serper query strings should not include internal prompts.");
  assert(georgia.serperPayloads.some((item) => /site:ebay\.com|site:etsy\.com|site:mercari\.com|site:worthpoint\.com|site:picclick\.com/i.test(item.q)), "At least one Serper query should use Google marketplace site routing.");
  assert(georgia.livePayloads.length === 0, "OpenAI web_search live comparable fallback should not run when Serper succeeds.");

  const zero = await runScenario("zero");
  assert(!zero.json.includes(leakedPhrase), "Zero-result JSON should not include leaked prompt phrase.");
  assert(zero.report.searchDiagnostics.searchProviderUsed === "Serper Google Search", "Zero-result diagnostics should still identify Serper as the provider.");
  assert(zero.report.searchDiagnostics.acquisitionFailureStage === "serper_zero_results", "Zero-result diagnostics should use controlled Serper zero-result stage.");
  assert(zero.report.valuationEvidenceState === "insufficient", "Zero retained results should keep valuation evidence insufficient.");
  assert(/not established/i.test([zero.report.fairValueNotEstablished, zero.report.estimatedFairMarketValue].filter(Boolean).join(" ")), "Zero retained results should not preserve unsupported fair value.");
  assert(!zero.json.includes("Comparable evidence appears useful enough to support the decision."), "Zero retained valuation evidence should never claim comparable evidence is useful enough.");
  assert(!/\$20\s*-\s*\$30|\$20-\$30/i.test(JSON.stringify([zero.report.estimatedFairMarketValue, zero.report.estimatedMarketValue, zero.report.fairPriceRange, zero.report.preliminaryReferenceRange])), "Zero retained valuation evidence should not preserve unsupported market-value numbers.");
  assert(!/supported/i.test(String(zero.report.valuationEvidenceState)), "Visual identification confidence must not override zero market-evidence confidence.");
  assert(!JSON.stringify(zero.report.productOrConditionRisks || []).includes("Older Model"), "Ordinary collectible zero-result risk list should suppress Older Model.");
  assert(!JSON.stringify(zero.report.betterValueConsiderations || []).includes("Wait for a similar item"), "Buy should not automatically recommend waiting without concrete risk support.");

  const onlinePlan = __queryIntegrityTestHooks.buildSerperSearchPlan({
    searchQueries: __queryIntegrityTestHooks.buildLiveSearchQueries(genericRetailIdentity, __queryIntegrityTestHooks.routeMarketSources(genericRetailIdentity, genericRetailIntake, ""), "ordinary household cleaner 12 count", genericRetailIntake),
    sourceRoute: __queryIntegrityTestHooks.routeMarketSources(genericRetailIdentity, genericRetailIntake, ""),
    identity: genericRetailIdentity,
    buyerIntake: genericRetailIntake,
    notes: "ordinary household cleaner 12 count"
  });
  const onlineAttempted = onlinePlan
    .filter((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record).attempted)
    .filter((record) => record.retailStage === "stage_5_online_retail");
  assert(onlineAttempted.length > 0, "Online retail registry stage should produce executable current-retail queries.");
  assert(onlineAttempted.length <= __queryIntegrityTestHooks.retailSerperBudgetAllocation.onlineRetail, "Online retail registry queries must remain within the bounded online budget.");
  assert(onlinePlan.filter((record) => __queryIntegrityTestHooks.createSerperRequestRecord(record).attempted).length <= __queryIntegrityTestHooks.retailSerperBudgetAllocation.maxProviderCalls, "Retail plan must stay within the global provider-call budget after online coverage is added.");
  assert(__queryIntegrityTestHooks.buildOnlineRetailSearchTargets(retailContext).some((target) => target.domain === "amazon.com"), "Amazon should be one data-driven online registry target for ordinary current retail products.");

  const amazonMarketplaceOffer = retailRecord({
    title: "Household Cleaner 12 Count",
    domain: "amazon.com",
    source: "Amazon",
    url: "https://www.amazon.com/household-cleaner-12",
    displayedPriceText: "$7.99",
    parsedPrice: 7.99,
    searchPass: "stage_5_online_retail",
    query: "household cleaner 12 count current price online site:amazon.com",
    seller: "Helpful Supply Co",
    rawText: "Current price $7.99. In stock. Sold by Helpful Supply Co. Subscribe & Save coupon Prime member price. Shipping not shown.",
    snippet: "Current price $7.99. In stock. Sold by Helpful Supply Co. Subscribe & Save coupon Prime member price."
  });
  const targetOnlineOffer = retailRecord({
    title: "Household Cleaner 12 Count",
    domain: "target.com",
    source: "Target",
    url: "https://www.target.com/store/10001/household-cleaner-12",
    displayedPriceText: "$8.49",
    parsedPrice: 8.49,
    searchPass: "stage_5_online_retail",
    query: "household cleaner 12 count current price online site:target.com",
    rawText: "Current price $8.49. In stock. Free shipping.",
    snippet: "Current price $8.49. In stock. Free shipping."
  });
  const nearbyOffer = retailRecord({
    title: "Household Cleaner 12 Count",
    domain: "target.com",
    source: "Target",
    url: "https://www.target.com/p/household-cleaner-12",
    displayedPriceText: "$8.99",
    parsedPrice: 8.99,
    searchPass: "stage_6_local_retail",
    query: "household cleaner near 10001 12 count current price",
    storeAddress: "123 Main St, New York, NY 10001",
    rawText: "Current price $8.99. Pickup available at 123 Main St, New York, NY 10001.",
    snippet: "Current price $8.99. Pickup available."
  });
  const onlineWhereToBuy = __queryIntegrityTestHooks.buildConsumerPricesFound({
    providerSourceRecords: [amazonMarketplaceOffer, targetOnlineOffer, nearbyOffer],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 9, { identity: genericRetailIdentity, buyerIntake: genericRetailIntake });
  const amazonWhereToBuy = onlineWhereToBuy.find((record) => /amazon/i.test(record.retailerDisplayName || ""));
  const targetWhereToBuy = onlineWhereToBuy.find((record) => /target/i.test(record.retailerDisplayName || "") && record.purchaseChannel === "Online");
  const nearbyWhereToBuy = onlineWhereToBuy.find((record) => /Nearby/i.test(record.purchaseChannel || ""));
  assert(amazonWhereToBuy, "Supported Amazon offers can enter Where to Buy.");
  assert(targetWhereToBuy, "Other online retailers should enter Where to Buy through the same online-retail architecture.");
  assert(nearbyWhereToBuy, "Nearby and online results should appear in one compact Where to Buy list.");
  assert(onlineWhereToBuy.some((record) => record.purchaseChannel === "Online") && onlineWhereToBuy.some((record) => /Nearby/i.test(record.purchaseChannel || "")), "Purchase channel should be clearly labeled for online and nearby rows.");
  assert(amazonWhereToBuy.retailOfferPlatform === "Amazon" && amazonWhereToBuy.retailOfferSeller === "Helpful Supply Co", "Marketplace platform and actual seller must remain distinct.");
  assert(/Third-party seller on Amazon/i.test(amazonWhereToBuy.retailOfferSellerType), "Third-party seller evidence must not be flattened into Amazon first-party evidence.");
  assert(/Subscribe-and-save|Coupon|Membership-only/i.test(amazonWhereToBuy.retailOfferConditionDisclosure), "Conditional online pricing should be disclosed on the price record.");
  assert(amazonWhereToBuy.shipping === "Not shown" && amazonWhereToBuy.deliveredCost === "Not established" && amazonWhereToBuy.deliveredCostAmount === null, "Unknown online shipping must not be treated as free shipping or delivered cost.");
  assert(targetWhereToBuy.shipping === "Free" && targetWhereToBuy.deliveredCost === "$8.49", "Explicit free shipping can establish delivered cost for an online offer.");
  assert(amazonWhereToBuy.purchaseChannel === "Online" && !/Nearby/i.test(amazonWhereToBuy.purchaseChannel), "Online item prices must not be implied to apply at a nearby physical store.");
  const bestOnlineDelivered = __queryIntegrityTestHooks.buildBestCompatiblePriceFound([amazonWhereToBuy, targetWhereToBuy]);
  assert(/target\.com/.test(bestOnlineDelivered.url) && bestOnlineDelivered.priceContextLabel === "Lowest Known Delivered Cost Found", "Online item price cannot establish best delivered cost without supported shipping.");
  const noAmazonWhereToBuy = __queryIntegrityTestHooks.buildConsumerPricesFound({
    providerSourceRecords: [targetOnlineOffer],
    searchDiagnostics: { retailEvidenceMode: "current-retail-only" }
  }, 9, { identity: genericRetailIdentity, buyerIntake: genericRetailIntake });
  assert(!noAmazonWhereToBuy.some((record) => /amazon/i.test(`${record.retailerDisplayName} ${record.url}`)), "Amazon must not be fabricated or guaranteed when no supported Amazon result exists.");
  const searchProviderOnlineAssessment = __queryIntegrityTestHooks.buildRetailEvidenceAssessments([retailRecord({
    title: "Household Cleaner 12 Count",
    domain: "google.com",
    source: "Google",
    url: "https://www.google.com/search?q=household-cleaner-12",
    displayedPriceText: "$1.99",
    parsedPrice: 1.99,
    searchPass: "stage_5_online_retail",
    snippet: "Current price $1.99."
  })], retailContext)[0];
  assert(searchProviderOnlineAssessment.retailerDisplayName === "Retailer not identified" && searchProviderOnlineAssessment.retailPriceDecisionEligibility === false, "Search-provider pages must not become online retailers or retail decision evidence.");

  console.log("Mock provider live comps checks OK.");
} finally {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    delete globalThis.fetch;
  }
  if (originalEnvKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalEnvKey;
  }
  if (originalFallbackKey === undefined) {
    delete process.env.OPEN_API_KEY;
  } else {
    process.env.OPEN_API_KEY = originalFallbackKey;
  }
  if (originalSerperKey === undefined) {
    delete process.env.SERPER_API_KEY;
  } else {
    process.env.SERPER_API_KEY = originalSerperKey;
  }
}
