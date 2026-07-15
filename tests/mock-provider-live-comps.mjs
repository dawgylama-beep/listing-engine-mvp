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
  if (_url === "https://google.serper.dev/search") {
    const payload = JSON.parse(options.body);
    serperPayloads.push({
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
  assert(unknownShipping[0].itemPrice === "$6" && unknownShipping[0].shipping === "Not shown" && unknownShipping[0].deliveredCost === "Not established", "A $6 listing with no shipping evidence should show item price, Shipping: Not shown, and Delivered cost: Not established.");
  assert(unknownShipping[0].shippingAmount === null && unknownShipping[0].deliveredCostAmount === null, "Unknown shipping should never be treated as free or as a delivered total.");
  assert(/may not be the lowest total cost because shipping was not shown/i.test(unknownShipping[0].comparisonToYourPrice), "Lower item price with unknown shipping should not be confirmed as a better delivered deal.");
  const freeShipping = __queryIntegrityTestHooks.buildConsumerPricesFound({ strongComparables: [priceRecord({ url: "https://example.com/free-shipping", delivery: "Free shipping" })] }, 10);
  assert(freeShipping[0].shipping === "Free" && freeShipping[0].deliveredCost === "$6.49", "Free shipping should produce delivered cost equal to item price.");
  assert(/lower delivered cost/i.test(freeShipping[0].comparisonToYourPrice), "Free-shipping compatible active listing can be described as lower delivered cost.");
  const deliveredRanking = __queryIntegrityTestHooks.buildConsumerPricesFound({
    strongComparables: [
      priceRecord({ url: "https://example.com/six-plus-fifteen", canonicalUrl: "https://example.com/six-plus-fifteen", displayedPrice: "$6.00", delivery: "Shipping $15.00" }),
      priceRecord({ url: "https://example.com/fifteen-free", canonicalUrl: "https://example.com/fifteen-free", displayedPrice: "$15.00", delivery: "Free shipping" }),
      priceRecord({ url: "https://example.com/six-unknown", canonicalUrl: "https://example.com/six-unknown", displayedPrice: "$6.00" }),
      priceRecord({ url: "https://example.com/twenty-five-included", canonicalUrl: "https://example.com/twenty-five-included", displayedPrice: "$25.00", delivery: "Shipping included" })
    ]
  }, 10);
  const bestDelivered = __queryIntegrityTestHooks.buildBestCompatiblePriceFound(deliveredRanking);
  assert(/fifteen-free/.test(bestDelivered.url) && bestDelivered.deliveredCost === "$15", "A $6 item with $15 shipping should rank behind a $15 item with free shipping.");
  assert(!/six-unknown/.test(bestDelivered.url), "A $6 item with unknown shipping must not automatically be labeled the best delivered deal.");
  const otherDelivered = __queryIntegrityTestHooks.buildOtherCompatiblePricesFound(deliveredRanking, bestDelivered);
  assert(JSON.stringify(otherDelivered).includes("twenty-five-included"), "Higher compatible prices should remain visible in Other Compatible Prices Found.");
  const spectrumSummary = __queryIntegrityTestHooks.buildPriceSpectrumSummary(deliveredRanking);
  assert(/unknown shipping|not shown/i.test(spectrumSummary) && /Known delivered costs ranged/i.test(spectrumSummary), "Price spectrum summary should separate item prices from known delivered costs and unknown shipping.");
  const auctionBid = __queryIntegrityTestHooks.buildConsumerPricesFound({ strongComparables: [priceRecord({ url: "https://example.com/current-bid", priceType: "Current bid", rawText: "Current bid $6.49" })] }, 10);
  assert(auctionBid[0].priceType === "Auction Current Bid" && !/sold/i.test(auctionBid[0].priceType), "Auction current bid must not be relabeled as final sold value.");
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
  assert(noPriceExactBuckets.strongComparables.length === 0, "No-price WorthPoint exact matches must not be Strong Comparables.");
  assert(noPriceExactBuckets.itemIdentificationEvidence.length === 1, "No-price exact matches should be Item Identification Evidence.");
  assert(/no usable price/i.test(noPriceExactBuckets.itemIdentificationEvidence[0].classification), "No-price exact identity evidence should label the missing price limitation.");
  assert(__queryIntegrityTestHooks.buildConsumerPricesFound(noPriceExactBuckets, 10).length === 0, "No-price identity evidence must not appear in Prices Found.");
  assert(__queryIntegrityTestHooks.canSupportPreliminaryAskingRangeFromVisibleRecord(noPriceExactBuckets.itemIdentificationEvidence[0]) === false, "No-price identity evidence must not support Preliminary Asking-Price Range.");
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
  assert(!JSON.stringify(mixedPrices).includes("no-price"), "Records without usable price evidence must not appear in Prices Found.");
  const priceEvidence = __queryIntegrityTestHooks.summarizeConsumerVisiblePriceEvidence(mixedSourceRecords);
  assert(priceEvidence.pricedRecords.length === mixedPrices.length, "Preliminary range should count compatible priced records only.");
  assert(mixedPrices.every((item) => item.includedInPreliminaryAskingPriceRange === "Yes" && item.influencedVerifiedMarketRange === "No"), "Active/reference asking records should be included in preliminary range without influencing verified market value.");
  assert(priceEvidence.primaryRangeType === "current_asking", "Active compatible listings should appear separately under Current Asking-Price Range when no verified sold evidence exists.");
  const preliminaryOutlierSourceRecords = {
    partialComparables: [
      priceRecord({ url: "https://example.com/prelim-6", canonicalUrl: "https://example.com/prelim-6", displayedPrice: "$6.00", priceType: "Reference Price", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-18", canonicalUrl: "https://example.com/prelim-18", displayedPrice: "$18.00", priceType: "Estimated/Guide Price", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-22", canonicalUrl: "https://example.com/prelim-22", displayedPrice: "$22.00", priceType: "Reference Price", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-30", canonicalUrl: "https://example.com/prelim-30", displayedPrice: "$30.00", priceType: "Active Asking", classification: "Partial Comparable", identityMatchStrength: "Partial" }),
      priceRecord({ url: "https://example.com/prelim-1155", canonicalUrl: "https://example.com/prelim-1155", title: "Georgia Bulldogs Coca-Cola collector tray rare signed premium variant", displayedPrice: "$1,155.00", priceType: "Estimated/Guide Price", classification: "Partial Comparable", identityMatchStrength: "Partial", itemIdentityDifferences: "Signed premium variant; not the submitted ordinary tray." })
    ]
  };
  const preliminaryOutlierEvidence = __queryIntegrityTestHooks.summarizeConsumerVisiblePriceEvidence(preliminaryOutlierSourceRecords);
  assert(preliminaryOutlierEvidence.primaryRangeType === "preliminary_reference", "Weak/partial/reference prices should stay in the Preliminary Reference Range bucket.");
  assert(preliminaryOutlierEvidence.low === 6 && preliminaryOutlierEvidence.high === 30, "Primary preliminary range should use the central cluster instead of the isolated high outlier.");
  assert(preliminaryOutlierEvidence.rawHigh === 1155, "Raw outlier price should remain visible in diagnostic evidence.");
  assert(preliminaryOutlierEvidence.outlierRecords.some((record) => /\$1,155/.test(record.displayedPrice)), "Excluded outlier should be preserved for Technical Search Details.");
  assert(/not used to set the primary range/i.test(preliminaryOutlierEvidence.outlierNote), "Outlier note should explain why the wide raw range did not set the primary range.");
  const preliminaryCards = __queryIntegrityTestHooks.buildConsumerPricesFound(preliminaryOutlierSourceRecords, 10, {
    excludeRangeOutlierUrls: preliminaryOutlierEvidence.outlierRecords.map((record) => record.url)
  });
  assert(!JSON.stringify(preliminaryCards).includes("1,155"), "Excluded range outlier should not remain in customer-facing Prices Found cards.");
  const conditionProfile = {
    condition: "used",
    concerns: [],
    isUnknown: false,
    hasHardRisk: false,
    hasModerateRisk: false,
    missingParts: false,
    repairRisk: false,
    risks: []
  };
  const buyerIntake = {
    purchase_context: "antique_mall",
    asking_price: "$10",
    purchase_intent: "personal_use",
    item_condition: "used",
    item_name: "Georgia Bulldogs Coca-Cola tray",
    known_brand: "Coca-Cola",
    buyer_notes: "HOW 'BOUT THEM DAWGS 1980 NATIONAL CHAMPIONS Vince Dooley"
  };
  const weakDecision = __queryIntegrityTestHooks.classifyConsumerPurchaseDecision({
    askingPriceNumber: 10,
    fairValueNumber: preliminaryOutlierEvidence.referenceCenter,
    reliableCompsFound: false,
    exactItems: [],
    similarItems: [],
    conditionProfile,
    buyerIntake,
    identity: georgiaIdentity,
    priceEvidence: preliminaryOutlierEvidence
  });
  assert(weakDecision.valueRating !== "Exceptional Value", "Weak/partial/reference evidence must not produce an Exceptional Value badge.");
  assert(/Low-Cost Cautious Buy|Reasonable Personal-Use Buy|Promising Price - Limited Evidence|Proceed with Caution/.test(weakDecision.valueRating), "Weak evidence should use a lower-certainty customer badge.");
  assert(/Low/i.test(weakDecision.pricingConfidence), "Weak/reference pricing should keep pricing confidence low.");
  const weakOffer = __queryIntegrityTestHooks.buildConsumerOffer({
    askingPriceNumber: 10,
    fairValueNumber: preliminaryOutlierEvidence.referenceCenter,
    decision: weakDecision,
    conditionProfile,
    priceEvidence: preliminaryOutlierEvidence
  });
  assert(weakOffer.openingOffer !== weakOffer.targetPurchasePrice, "Opening offer should not equal the target purchase price for a negotiable low-dollar buy.");
  assert(/\$[1-9]/.test(weakOffer.openingOffer) && /\$10/.test(weakOffer.targetPurchasePrice), "Opening offer should be below the $10 target asking price when negotiation is reasonable.");
  assert(weakOffer.openingOfferAmount < weakOffer.targetPurchasePriceAmount, "Opening offer amount should stay below target amount when negotiation is reasonable.");
  assert(weakOffer.targetPurchasePriceAmount <= weakOffer.maximumRecommendedPriceAmount, "Target purchase amount should not exceed the maximum recommended amount.");
  assert(weakOffer.maximumRecommendedPriceAmount === 10, "Asking $10, target $10, low confidence, no sold evidence, and no active exact/strong evidence cannot produce a $135 maximum.");
  assert(/capped near the target because available pricing evidence is weak/i.test(weakOffer.maximumRecommendedPriceExplanation), "Customer-facing explanation should state why the weak-evidence maximum was capped.");
  const weakWideReferenceEvidence = {
    primaryRangeType: "preliminary_reference",
    primaryRangeLabel: "Preliminary Reference Range",
    referenceCenter: 135,
    primaryRangeRecordCount: 4,
    pricedRecordCount: 6,
    primaryPreliminaryReferenceCount: 4,
    soldExactStrongCount: 0,
    activeExactStrongCount: 0,
    excludedOutlierCount: 2,
    outlierRecords: [
      { displayedPrice: "$5.00", rangeExclusionReason: "low weak reference outlier" },
      { displayedPrice: "$600.00", rangeExclusionReason: "high weak reference outlier" }
    ],
    priceBasis: "Weak, partial, guide, auction, and reference price context only."
  };
  const weakWideOffer = __queryIntegrityTestHooks.buildConsumerOffer({
    askingPriceNumber: 10,
    fairValueNumber: 135,
    decision: { valueRating: "Promising Price - Limited Evidence", recommendation: "Buy", pricingConfidence: "Low" },
    conditionProfile,
    priceEvidence: weakWideReferenceEvidence
  });
  assert(weakWideOffer.maximumRecommendedPriceAmount === 10, "Weak/reference prices ranging from $5-$600 cannot establish or inflate the maximum price.");
  assert(!/\$135|\$600/.test(weakWideOffer.maximumRecommendedPrice), "Excluded outliers and weak reference centers must not appear as the maximum recommended price.");
  const noMaximumOffer = __queryIntegrityTestHooks.buildConsumerOffer({
    askingPriceNumber: 85,
    fairValueNumber: 220,
    decision: { valueRating: "Proceed with Caution", recommendation: "Negotiate", pricingConfidence: "Low" },
    conditionProfile,
    priceEvidence: weakWideReferenceEvidence
  });
  assert(noMaximumOffer.maximumRecommendedPriceAmount === null && /Not established/i.test(noMaximumOffer.maximumRecommendedPrice), "Weak/reference evidence alone should use Maximum Recommended Price: Not established when a low-dollar cautious cap is not defensible.");
  const conditionalBuyOffer = __queryIntegrityTestHooks.buildConsumerOffer({
    askingPriceNumber: 10,
    fairValueNumber: 8.6,
    decision: { valueRating: "Good Value", recommendation: "Buy" },
    conditionProfile,
    priceEvidence: {
      primaryRangeType: "verified_market",
      primaryRangeLabel: "Verified Market Range",
      soldExactStrongCount: 1,
      activeExactStrongCount: 0,
      primaryRangeRecordCount: 1,
      pricedRecordCount: 1,
      hasVerifiedSoldEvidence: true
    }
  });
  const conditionalRecommendation = __queryIntegrityTestHooks.buildConsumerRecommendationText({ recommendation: "Buy" }, conditionalBuyOffer, 10);
  assert(/Buy only if negotiated to \$9 or below/i.test(conditionalRecommendation), "If maximum recommended price is below current asking price, Buy must become conditional.");
  const soldOutranksActive = __queryIntegrityTestHooks.summarizeConsumerVisiblePriceEvidence({
    strongComparables: [
      priceRecord({ url: "https://example.com/sold-40", canonicalUrl: "https://example.com/sold-40", displayedPrice: "$40.00", priceType: "Verified Sold", rawText: "Sold for $40.00", classification: "Exact Match", identityMatchStrength: "Exact" }),
      priceRecord({ url: "https://example.com/sold-44", canonicalUrl: "https://example.com/sold-44", displayedPrice: "$44.00", priceType: "Verified Sold", rawText: "Verified sold price $44.00", classification: "Strong Similar Match", identityMatchStrength: "Strong" }),
      priceRecord({ url: "https://example.com/active-15", canonicalUrl: "https://example.com/active-15", displayedPrice: "$15.00", priceType: "Active Asking", classification: "Exact Match", identityMatchStrength: "Exact" })
    ]
  });
  assert(soldOutranksActive.primaryRangeType === "verified_market", "Verified sold exact/strong evidence should outrank active asking evidence.");
  assert(/\$40-\$44/.test(soldOutranksActive.verifiedMarketRange), "Verified Market Range should be based on sold exact/strong prices.");
  const supportedHighOffer = __queryIntegrityTestHooks.buildConsumerOffer({
    askingPriceNumber: 10,
    fairValueNumber: 44,
    decision: { valueRating: "Exceptional Value", recommendation: "Buy", pricingConfidence: "Medium" },
    conditionProfile,
    priceEvidence: soldOutranksActive
  });
  assert(supportedHighOffer.maximumRecommendedPriceAmount > 20, "Strong verified sold evidence can still support a maximum materially above asking when justified.");
  assert(/qualified exact\/strong|verified sold|active exact\/strong/i.test(supportedHighOffer.maximumRecommendedPriceExplanation), "A maximum materially above target should explain the qualified exact/strong evidence basis.");
  const activeSoldWording = __queryIntegrityTestHooks.summarizeConsumerVisiblePriceEvidence({
    strongComparables: [
      priceRecord({ url: "https://example.com/sold-word-active", canonicalUrl: "https://example.com/sold-word-active", title: "Sold-style Georgia Bulldogs Coca-Cola tray listing", displayedPrice: "$18.00", priceType: "Active Asking", rawText: "For sale current listing asking price $18.00", classification: "Exact Match", identityMatchStrength: "Exact" })
    ]
  });
  assert(activeSoldWording.primaryRangeType === "current_asking", "Active listings cannot drive Verified Market Range merely because their title resembles sold wording.");
  const activeOutranksPartial = __queryIntegrityTestHooks.summarizeConsumerVisiblePriceEvidence({
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
  assert(recoveryQueries.some((record) => record.searchPass === "marketplace_domain_recovery" && /site:ebay\.com/i.test(record.query) && !/\bOR\b/.test(record.query)), "Recovery should include separate marketplace-domain site searches, not only one OR query.");
  assert(recoveryQueries.some((record) => record.searchPass === "price_oriented_recovery"), "Recovery should include price-oriented searches.");
  assert(recoveryQueries.some((record) => record.searchPass === "shopping_general_recovery"), "Recovery should include shopping/general web searches.");

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
