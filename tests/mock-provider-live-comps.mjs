import handler from "../api/generate-listing.js";

const leakedPhrase = "Perform source-routed live comparable search";
const originalFetch = globalThis.fetch;
const originalEnvKey = process.env.OPENAI_API_KEY;
const originalFallbackKey = process.env.OPEN_API_KEY;
let activeFixture = null;
let livePayloads = [];

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
  return { report: res.payload.valuation, livePayloads: [...livePayloads], json: JSON.stringify(res.payload) };
}

try {
  process.env.OPENAI_API_KEY = "test-openai-key-not-real";
  delete process.env.OPEN_API_KEY;

  const holiday = await runScenario("holiday");
  assert(holiday.report.analysisId === "analysis-test-holiday", "Holiday analysis id should round-trip.");

  const georgia = await runScenario("georgia");
  assert(georgia.report.analysisId === "analysis-test-georgia", "Georgia analysis id should round-trip.");
  assert(!georgia.json.includes(leakedPhrase), "Client-visible Georgia JSON should not include leaked prompt phrase.");
  assert(!georgia.json.includes("\\n"), "Client-visible Georgia JSON should not include literal slash-n sequences.");
  assert(!/holiday decor \/ collectible/i.test(georgia.json), "Georgia report should not inherit old holiday decor wording.");
  assert(!/Santa's Workshop|GAB031/i.test(georgia.json), "Georgia report should not inherit the prior holiday session.");

  const diagnostics = georgia.report.searchDiagnostics;
  assert(diagnostics.queryTransmissionMode === "query_bound_provider_requests", "Diagnostics should use query-bound provider mode.");
  assert(Array.isArray(diagnostics.providerRequestRecords) && diagnostics.providerRequestRecords.length > 0, "Provider request records should exist.");
  assert(diagnostics.providerRequestRecords.every((record) => record.attempted === true), "Every sent query record should be attempted.");
  assert(diagnostics.providerRequestRecords.every((record) => diagnostics.queriesActuallySent.includes(record.query)), "Sent queries should match attempted provider records.");
  assert(diagnostics.providerRequestRecords.some((record) => /HOW '?BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS|Vince Dooley/i.test(record.query)), "Exact Georgia visible clues should be prioritized into attempted queries.");
  assert(diagnostics.providerRequestRecords.some((record) => /Coca-Cola/i.test(record.query)), "Coca-Cola punctuation should survive attempted queries.");
  assert(diagnostics.providerRequestRecords.some((record) => record.searchPass === "open_web_exact"), "Open-web exact pass should be recorded.");
  assert(diagnostics.providerRequestRecords.some((record) => record.searchPass === "marketplace_domain"), "Marketplace-domain pass should be recorded.");
  assert(Array.isArray(diagnostics.allowedDomainsRequested) && diagnostics.allowedDomainsRequested.includes("ebay.com"), "Marketplace allowed domains should include ebay.com for sports collectible tray routing.");
  assert(diagnostics.providerSourceCount > 0, "Provider source count should be tracked separately from visible comps.");
  assert(diagnostics.domainsActuallyReturned.includes("example.com"), "Returned domains should come from actual provider source URLs.");
  assert(diagnostics.safeRawResults.some((record) => record.query && /Georgia|Coca-Cola|DAWGS|NATIONAL/i.test(record.query)), "Raw provider summaries should retain producing query.");
  assert(Array.isArray(georgia.report.weFoundThisItem) && georgia.report.weFoundThisItem.length > 0, "Exact active listing should remain visible.");

  const querySet = new Set(diagnostics.providerRequestRecords.map((record) => record.query.toLowerCase()));
  assert(querySet.size < diagnostics.providerRequestRecords.length, "Strong exact queries may be sent once open-web and once with marketplace-domain filters.");
  assert(livePayloads.every((item) => !item.query.includes(leakedPhrase)), "Mocked provider query strings should not be internal prompts.");
  assert(livePayloads.every((item) => item.toolType === "web_search"), "Live payloads should use current web_search.");
  assert(livePayloads.every((item) => item.toolChoice === "required"), "Live payloads should force web_search execution.");
  assert(livePayloads.every((item) => item.include.includes("web_search_call.action.sources")), "Live payloads should request web_search action sources.");
  assert(livePayloads.some((item) => item.searchContextSize === "medium"), "Live payloads should request medium search context when supported.");
  assert(livePayloads.some((item) => item.allowedDomains.includes("ebay.com")), "At least one marketplace-domain payload should request ebay.com.");

  const zero = await runScenario("zero");
  assert(!zero.json.includes(leakedPhrase), "Zero-result JSON should not include leaked prompt phrase.");
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
}
