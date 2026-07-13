import handler from "../api/generate-listing.js";

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
  assert(diagnostics.providerRequestRecords.length <= 6, "Serper query budget should stay within six ordinary calls.");
  assert(diagnostics.providerRequestRecords.every((record) => record.attempted === true), "Every sent query record should be attempted.");
  assert(diagnostics.providerRequestRecords.every((record) => diagnostics.queriesActuallySent.includes(record.query)), "Sent queries should match attempted provider records.");
  assert(diagnostics.providerRequestRecords.some((record) => /HOW '?BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS|Vince Dooley/i.test(record.query)), "Exact Georgia visible clues should be prioritized into attempted queries.");
  assert(diagnostics.providerRequestRecords.some((record) => /Coca-Cola/i.test(record.query)), "Coca-Cola punctuation should survive attempted queries.");
  assert(diagnostics.providerRequestRecords.some((record) => record.searchPass === "open_web_exact"), "Open-web exact pass should be recorded.");
  assert(diagnostics.providerRequestRecords.some((record) => record.searchPass === "marketplace_site_google"), "Marketplace site pass should be recorded.");
  assert(Array.isArray(diagnostics.allowedDomainsRequested) && diagnostics.allowedDomainsRequested.includes("ebay.com"), "Marketplace allowed domains should include ebay.com for sports collectible tray routing.");
  assert(diagnostics.providerSourceCount > 0, "Provider source count should be tracked separately from visible comps.");
  assert(diagnostics.organicResultCount > 0, "Organic result count should be tracked.");
  assert(diagnostics.shoppingResultCount > 0, "Shopping result count should be tracked.");
  assert(diagnostics.domainsActuallyReturned.includes("ebay.com"), "Returned domains should come from actual Serper result URLs.");
  assert(diagnostics.deduplicatedCandidateCount < diagnostics.providerSourceCount, "Duplicate listings should merge after URL canonicalization.");
  assert(diagnostics.exactCandidateCount > 0, "Exact candidates should be counted.");
  assert(diagnostics.strongSimilarCandidateCount > 0, "Strong-similar candidates should be counted.");
  assert(Array.isArray(georgia.report.weFoundThisItem) && georgia.report.weFoundThisItem.length > 0, "Exact active listing should remain visible.");
  assert(JSON.stringify(georgia.report.strongComparables || []).includes("https://www.ebay.com/itm/georgia-coca-cola-tray"), "Exact tray URL should remain visible.");
  assert(JSON.stringify(georgia.report.strongComparables || []).includes("Active Asking") || JSON.stringify(georgia.report.strongComparables || []).includes("Shopping Offer"), "Visible exact/strong cards should label asking/shopping evidence accurately.");
  assert(JSON.stringify(georgia.report.rejectedMatches || []).includes("bottle"), "Unrelated bottle result should be rejected as an item-type mismatch.");

  const querySet = new Set(diagnostics.providerRequestRecords.map((record) => record.query.toLowerCase()));
  assert(querySet.size === diagnostics.providerRequestRecords.length, "Duplicate Serper queries should not be sent.");
  assert(georgia.serperPayloads.length === diagnostics.providerRequestRecords.length, "Serper payload count should match provider request records.");
  assert(georgia.serperPayloads.every((item) => item.hasApiKeyHeader), "Serper requests should include the server-side API key header.");
  assert(georgia.serperPayloads.every((item) => item.gl === "us" && item.hl === "en" && item.num === 10), "Serper requests should use expected US English defaults.");
  assert(georgia.serperPayloads.every((item) => !item.q.includes(leakedPhrase)), "Serper query strings should not include internal prompts.");
  assert(georgia.serperPayloads.some((item) => /site:ebay\.com|site:etsy\.com|site:mercari\.com|site:worthpoint\.com|site:picclick\.com/i.test(item.q)), "At least one Serper query should use Google marketplace site routing.");
  assert(georgia.livePayloads.length === 0, "OpenAI web_search live comparable fallback should not run when Serper succeeds.");

  const zero = await runScenario("zero");
  assert(!zero.json.includes(leakedPhrase), "Zero-result JSON should not include leaked prompt phrase.");
  assert(zero.report.searchDiagnostics.searchProviderUsed === "Serper Google Search", "Zero-result diagnostics should still identify Serper as the provider.");
  assert(zero.report.searchDiagnostics.acquisitionFailureStage === "serper_zero_results", "Zero-result diagnostics should use controlled Serper zero-result stage.");
  assert(zero.report.valuationEvidenceState === "insufficient", "Zero retained results should keep valuation evidence insufficient.");
  assert(/not established/i.test([zero.report.fairValueNotEstablished, zero.report.estimatedFairMarketValue].filter(Boolean).join(" ")), "Zero retained results should not preserve unsupported fair value.");
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
