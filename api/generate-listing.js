const listingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "platform",
    "categorySuggestion",
    "identifiedItem",
    "identificationConfidence",
    "evidenceFoundInPhotos",
    "searchQueriesUsed",
    "sourcesSearched",
    "researchResults",
    "comparableQuality",
    "recommendedListingPrice",
    "suggestedOfferRange",
    "pricingConfidence",
    "pricingRationale",
    "optimizedListingTitle",
    "listingDescription",
    "itemSpecifics",
    "conditionNotes",
    "suggestedSellingPlatform",
    "additionalInformationNeeded",
    "title",
    "description",
    "itemDetails",
    "priceStrategy",
    "expectedSellingTimeline",
    "shippingDelivery",
    "stagingPhotos",
    "sellerNotes"
  ],
  properties: {
    platform: { type: "string" },
    categorySuggestion: { type: "string" },
    identifiedItem: { type: "string" },
    identificationConfidence: { type: "string" },
    evidenceFoundInPhotos: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: { type: "string" }
    },
    searchQueriesUsed: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    sourcesSearched: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    },
    researchResults: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    },
    comparableQuality: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    },
    recommendedListingPrice: { type: "string" },
    suggestedOfferRange: { type: "string" },
    pricingConfidence: { type: "string" },
    pricingRationale: { type: "string" },
    optimizedListingTitle: { type: "string" },
    listingDescription: { type: "string" },
    itemSpecifics: {
      type: "array",
      minItems: 3,
      maxItems: 10,
      items: { type: "string" }
    },
    conditionNotes: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    },
    suggestedSellingPlatform: { type: "string" },
    additionalInformationNeeded: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    title: { type: "string" },
    description: { type: "string" },
    itemDetails: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: { type: "string" }
    },
    priceStrategy: { type: "string" },
    expectedSellingTimeline: { type: "string" },
    shippingDelivery: { type: "string" },
    stagingPhotos: { type: "string" },
    sellerNotes: {
      type: "array",
      minItems: 2,
      maxItems: 6,
      items: { type: "string" }
    }
  }
};

const valuationSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "purchaserDecision",
    "buyer_risk_score",
    "buyer_risk_level",
    "buyer_risk_summary",
    "primary_risk_factors",
    "risk_reduction_actions",
    "liveComparableSearchStatus",
    "weFoundThisItem",
    "weFoundSimilarComparableItems",
    "liveSearchDidNotComplete",
    "noReliableComparableItemsFound",
    "searchCoverage",
    "itemIdentificationConfidence",
    "liveCompConfidence",
    "valuationConfidence",
    "buyerDecisionConfidence",
    "currentAskingPrice",
    "suggestedListingPrice",
    "expectedSalePrice",
    "minimumAcceptablePrice",
    "recommendedSellingPlatform",
    "expectedSellingTime",
    "platformSpecificSellingGuidance",
    "itemIdentification",
    "buyerTypeFit",
    "marketType",
    "itemClarityScore",
    "currentPriceAssessment",
    "priceConfidence",
    "priceBasis",
    "estimatedMarketValue",
    "aiOnlyRoughValueRange",
    "maximumRecommendedBuyPrice",
    "betterPriceCheckNeeded",
    "resalePotential",
    "missingDetails",
    "whatToVerifyBeforeBuying",
    "searchQueriesUsed"
  ],
  properties: {
    purchaserDecision: { type: "string" },
    buyer_risk_score: { type: "number" },
    buyer_risk_level: { type: "string" },
    buyer_risk_summary: { type: "string" },
    primary_risk_factors: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" }
    },
    risk_reduction_actions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string" }
    },
    liveComparableSearchStatus: { type: "string" },
    weFoundThisItem: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    weFoundSimilarComparableItems: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    liveSearchDidNotComplete: { type: "string" },
    noReliableComparableItemsFound: { type: "string" },
    searchCoverage: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    },
    itemIdentificationConfidence: { type: "string" },
    liveCompConfidence: { type: "string" },
    valuationConfidence: { type: "string" },
    buyerDecisionConfidence: { type: "string" },
    currentAskingPrice: { type: "string" },
    suggestedListingPrice: { type: "string" },
    expectedSalePrice: { type: "string" },
    minimumAcceptablePrice: { type: "string" },
    recommendedSellingPlatform: { type: "string" },
    expectedSellingTime: { type: "string" },
    platformSpecificSellingGuidance: { type: "string" },
    itemIdentification: { type: "string" },
    buyerTypeFit: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" }
    },
    marketType: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" }
    },
    itemClarityScore: { type: "string" },
    currentPriceAssessment: { type: "string" },
    priceConfidence: { type: "string" },
    priceBasis: { type: "string" },
    estimatedMarketValue: { type: "string" },
    aiOnlyRoughValueRange: { type: "string" },
    maximumRecommendedBuyPrice: { type: "string" },
    betterPriceCheckNeeded: { type: "string" },
    resalePotential: { type: "string" },
    missingDetails: {
      type: "array",
      minItems: 3,
      maxItems: 12,
      items: { type: "string" }
    },
    whatToVerifyBeforeBuying: {
      type: "array",
      minItems: 3,
      maxItems: 8,
      items: { type: "string" }
    },
    searchQueriesUsed: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    }
  }
};

const consumerDecisionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "buyerIntent",
    "identifiedItem",
    "identificationConfidence",
    "evidenceFoundInPhotos",
    "askingPrice",
    "estimatedFairMarketValue",
    "fairPriceRange",
    "valueRating",
    "recommendation",
    "recommendedOffer",
    "openingOffer",
    "targetPurchasePrice",
    "maximumRecommendedPrice",
    "walkAwayPrice",
    "negotiationGuidance",
    "reasonsToBuy",
    "reasonsForCaution",
    "productOrConditionRisks",
    "riskFlags",
    "betterValueConsiderations",
    "researchResults",
    "comparableQuality",
    "pricingConfidence",
    "pricingRationale",
    "additionalInformationNeeded",
    "searchQueriesUsed",
    "sourcesSearched"
  ],
  properties: {
    buyerIntent: { type: "string" },
    identifiedItem: { type: "string" },
    identificationConfidence: { type: "string" },
    evidenceFoundInPhotos: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: { type: "string" }
    },
    askingPrice: { type: "string" },
    estimatedFairMarketValue: { type: "string" },
    fairPriceRange: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" }
    },
    valueRating: { type: "string" },
    recommendation: { type: "string" },
    recommendedOffer: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" }
    },
    openingOffer: { type: "string" },
    targetPurchasePrice: { type: "string" },
    maximumRecommendedPrice: { type: "string" },
    walkAwayPrice: { type: "string" },
    negotiationGuidance: { type: "string" },
    reasonsToBuy: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    reasonsForCaution: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    productOrConditionRisks: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    riskFlags: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    },
    betterValueConsiderations: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    researchResults: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    },
    comparableQuality: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    },
    pricingConfidence: { type: "string" },
    pricingRationale: { type: "string" },
    additionalInformationNeeded: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    searchQueriesUsed: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    sourcesSearched: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    }
  }
};

const askMarketEdgeSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "answer",
    "answerType",
    "evidenceBasis",
    "assumptions",
    "recalculatedFields",
    "confidence",
    "recommendedNextAction",
    "needsNewSearch",
    "needsAdditionalPhoto",
    "suggestedPhoto",
    "revisedListingFields",
    "updatedScenario"
  ],
  properties: {
    answer: { type: "string" },
    answerType: {
      type: "string",
      enum: [
        "explanation",
        "price_scenario",
        "condition_scenario",
        "research_question",
        "evidence_request",
        "listing_revision",
        "platform_guidance",
        "new_live_search",
        "unsupported_or_unrelated"
      ]
    },
    evidenceBasis: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    assumptions: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    recalculatedFields: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    confidence: { type: "string" },
    recommendedNextAction: { type: "string" },
    needsNewSearch: { type: "boolean" },
    needsAdditionalPhoto: { type: "boolean" },
    suggestedPhoto: { type: "string" },
    revisedListingFields: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "priceStrategy", "conditionNotes", "sellerNotes"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        priceStrategy: { type: "string" },
        conditionNotes: { type: "string" },
        sellerNotes: { type: "string" }
      }
    },
    updatedScenario: { type: "string" }
  }
};

const visualRecognitionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "visualSubject",
    "visualSubjectCategory",
    "visualSubjectConfidence",
    "recognizedOrganization",
    "recognizedBrand",
    "recognizedCharacter",
    "recognizedInstitution",
    "recognizedTheme",
    "visibleLogos",
    "visibleLetters",
    "visibleWords",
    "visibleColors",
    "visualStyle",
    "estimatedEraStyle",
    "distinctiveFeatures",
    "visualEvidence",
    "possibleInterpretations",
    "visualConflicts",
    "stillUnknown",
    "userEvidenceReconciliation",
    "visualSummary"
  ],
  properties: {
    visualSubject: { type: "string" },
    visualSubjectCategory: { type: "string" },
    visualSubjectConfidence: { type: "string" },
    recognizedOrganization: { type: "string" },
    recognizedBrand: { type: "string" },
    recognizedCharacter: { type: "string" },
    recognizedInstitution: { type: "string" },
    recognizedTheme: { type: "string" },
    visibleLogos: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    visibleLetters: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    visibleWords: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    },
    visibleColors: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    visualStyle: { type: "string" },
    estimatedEraStyle: { type: "string" },
    distinctiveFeatures: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    },
    visualEvidence: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    },
    possibleInterpretations: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    visualConflicts: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    stillUnknown: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    userEvidenceReconciliation: { type: "string" },
    visualSummary: { type: "string" }
  }
};

const itemIdentitySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "brand",
    "manufacturer",
    "teamName",
    "schoolName",
    "mascot",
    "licensingStickerText",
    "model",
    "sku",
    "upcBarcode",
    "styleNumber",
    "size",
    "color",
    "material",
    "dimensions",
    "copyrightWording",
    "year",
    "missingComponentStatus",
    "condition",
    "currentAskingPrice",
    "category",
    "subjectIdentity",
    "subjectConfidence",
    "userProvidedIdentity",
    "visualIdentityEvidence",
    "textIdentityEvidence",
    "exactProductIdentity",
    "exactProductConfidence",
    "makerIdentity",
    "makerConfidence",
    "modelOrItemNumber",
    "eraEstimate",
    "eraConfidence",
    "licensingStatus",
    "authenticityStatus",
    "exactComparableStatus",
    "productNameOrBoxTitle",
    "frontBoxWording",
    "backLabelWording",
    "manufacturerLocationText",
    "visiblePrice",
    "brandSeries",
    "visibleText",
    "guidedBuyerIntakeSummary",
    "identityConflictNotes",
    "identityUnknowns",
    "identitySummary",
    "distinctiveVisualDescription",
    "likelyItemDescription",
    "strongestSearchableIdentifiers",
    "buyerContext"
  ],
  properties: {
    brand: { type: "string" },
    manufacturer: { type: "string" },
    teamName: { type: "string" },
    schoolName: { type: "string" },
    mascot: { type: "string" },
    licensingStickerText: { type: "string" },
    model: { type: "string" },
    sku: { type: "string" },
    upcBarcode: { type: "string" },
    styleNumber: { type: "string" },
    size: { type: "string" },
    color: { type: "string" },
    material: { type: "string" },
    dimensions: { type: "string" },
    copyrightWording: { type: "string" },
    year: { type: "string" },
    missingComponentStatus: { type: "string" },
    condition: { type: "string" },
    currentAskingPrice: { type: "string" },
    category: { type: "string" },
    subjectIdentity: { type: "string" },
    subjectConfidence: { type: "string" },
    userProvidedIdentity: { type: "string" },
    visualIdentityEvidence: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    textIdentityEvidence: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    exactProductIdentity: { type: "string" },
    exactProductConfidence: { type: "string" },
    makerIdentity: { type: "string" },
    makerConfidence: { type: "string" },
    modelOrItemNumber: { type: "string" },
    eraEstimate: { type: "string" },
    eraConfidence: { type: "string" },
    licensingStatus: { type: "string" },
    authenticityStatus: { type: "string" },
    exactComparableStatus: { type: "string" },
    productNameOrBoxTitle: { type: "string" },
    frontBoxWording: { type: "string" },
    backLabelWording: { type: "string" },
    manufacturerLocationText: { type: "string" },
    visiblePrice: { type: "string" },
    brandSeries: { type: "string" },
    visibleText: {
      type: "array",
      minItems: 0,
      maxItems: 10,
      items: { type: "string" }
    },
    guidedBuyerIntakeSummary: { type: "string" },
    identityConflictNotes: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    identityUnknowns: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    identitySummary: { type: "string" },
    distinctiveVisualDescription: { type: "string" },
    likelyItemDescription: { type: "string" },
    strongestSearchableIdentifiers: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    buyerContext: {
      type: "array",
      minItems: 1,
      maxItems: 8,
      items: { type: "string" }
    }
  }
};

const liveCompsSearchSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "liveSearchStatus",
    "comparableItemsFound",
    "noReliableMatchesReason",
    "searchEvidenceSummary"
  ],
  properties: {
    liveSearchStatus: { type: "string" },
    comparableItemsFound: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    noReliableMatchesReason: { type: "string" },
    searchEvidenceSummary: { type: "string" }
  }
};

const buyerIntakeStringFields = [
  "purchase_context",
  "asking_price",
  "purchase_intent",
  "item_condition",
  "item_name",
  "known_brand",
  "known_manufacturer",
  "known_model",
  "known_sku",
  "known_upc",
  "approximate_age_era",
  "buyer_notes"
];

const allowedConditionConcerns = new Set([
  "visible_damage",
  "missing_parts",
  "stains_or_wear",
  "cracks_or_chips",
  "not_working",
  "untested",
  "incomplete_set",
  "authenticity_concern",
  "odor_or_smoke",
  "other"
]);

const consumerDecisionThresholds = {
  exceptionalMaxRatio: 0.72,
  goodMaxRatio: 0.9,
  fairMaxRatio: 1.08,
  slightlyOverpricedMaxRatio: 1.22,
  overpricedMaxRatio: 1.45,
  conditionRiskDowngradeCount: 2
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = parseBody(req.body);
    const action = cleanText(body.action);

    if (action === "ask_market_edge") {
      return await handleAskMarketEdge({ body, res });
    }

    const platform = cleanText(body.platform);
    const notes = cleanText(body.notes);
    const photos = Array.isArray(body.photos) ? body.photos : [];
    const reportType = body.reportType === "marketValue" ? "marketValue" : "listing";
    const buyerIntake = reportType === "marketValue" ? normalizeBuyerIntake(body.buyerIntake) : null;

    if (reportType === "listing" && !platform) {
      return res.status(400).json({ error: "Choose a marketplace platform." });
    }

    if (reportType === "listing" && !notes) {
      return res.status(400).json({ error: "Add item notes before generating a listing." });
    }

    if (!photos.length) {
      return res.status(400).json({ error: "Upload at least one item photo." });
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "Missing OpenAI API key. Add OPENAI_API_KEY or OPEN_API_KEY in Vercel Environment Variables or local .env."
      });
    }

    const safePhotos = photos
      .slice(0, 6)
      .filter((photo) => typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"))
      .map((photo) => ({
        name: cleanText(photo.name || "Item photo"),
        dataUrl: photo.dataUrl
      }));

    if (!safePhotos.length) {
      return res.status(400).json({ error: "Uploaded photos must be image files." });
    }

    const report = await generateReportWithOpenAI({
      apiKey,
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      platform,
      notes,
      photos: safePhotos,
      reportType,
      buyerIntake
    });

    if (reportType === "marketValue") {
      return res.status(200).json({ valuation: report });
    }

    return res.status(200).json({ listing: report });
  } catch (error) {
    return res.status(502).json({
      error: error.message || "OpenAI API request failed."
    });
  }
}

async function handleAskMarketEdge({ body, res }) {
  if (JSON.stringify(body || {}).length > 180000) {
    return res.status(413).json({ error: "Ask Market Edge context is too large. Start a new item and try again." });
  }

  const sessionId = cleanText(body.sessionId).slice(0, 120);
  const workflow = normalizeAskWorkflow(body.workflow);
  const buyerIntent = cleanText(body.buyerIntent).slice(0, 80);
  const question = cleanText(body.question).slice(0, 900);
  const currentItemContext = sanitizeAskContext(body.currentItemContext);
  const recentConversationContext = sanitizeAskConversation(body.recentConversationContext);

  if (!sessionId) {
    return res.status(400).json({ error: "Ask Market Edge needs a current item session." });
  }

  if (!workflow) {
    return res.status(400).json({ error: "Ask Market Edge needs a valid workflow." });
  }

  if (!question) {
    return res.status(400).json({ error: "Enter a question about the current item." });
  }

  if (!currentItemContext || !currentItemContext.currentReport) {
    return res.status(400).json({ error: "Ask Market Edge needs a completed item report first." });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing OpenAI API key. Add OPENAI_API_KEY or OPEN_API_KEY in Vercel Environment Variables or local .env."
    });
  }

  const answerType = classifyAskQuestion(question);
  const proposedPrice = extractProposedPrice(question);
  const scenario = buildAskScenario({ answerType, proposedPrice, workflow, buyerIntent, currentItemContext });
  const answer = await generateAskMarketEdgeAnswer({
    apiKey,
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    sessionId,
    workflow,
    buyerIntent,
    question,
    answerType,
    proposedPrice,
    scenario,
    currentItemContext,
    recentConversationContext
  });

  return res.status(200).json({
    action: "ask_market_edge",
    sessionId,
    workflow,
    answer: normalizeAskAnswer(answer, { answerType, scenario })
  });
}

async function generateAskMarketEdgeAnswer({ apiKey, model, sessionId, workflow, buyerIntent, question, answerType, proposedPrice, scenario, currentItemContext, recentConversationContext }) {
  const workflowInstruction = {
    personal_use: "Active workflow is Buying for Myself. Use personal-use value, offer, fair-price, condition-risk, fit, and walk-away logic. Do not use reseller margin logic.",
    resale: "Active workflow is Buying to Resell. Use resale margin, fees, shipping/transport, liquidity, max-buy-price, risk, and likely net-profit logic.",
    market_value: "Active workflow is Check Market Value. Explain value estimate, confidence, research quality, and what evidence would improve confidence.",
    listing: "Active workflow is Generate Listing. Help revise listing copy, platform fit, title, description, price strategy, condition disclosure, and seller notes without inventing facts."
  }[workflow];
  const prompt = [
    "Ask Market Edge is not a generic chatbot. It is a context-aware item adviser discussing the current item and current report only.",
    "The current structured report is the authoritative starting point. Use the active report before generating new conclusions.",
    "Ground every answer in the active item session: uploaded-photo findings, user description, workflow, buyer intent, asking price, visual subject, visual confidence, exact product identity, exact product confidence, user-provided identity, photo evidence, search queries, sources searched, research results, comparable classifications, pricing estimates, recommendation, risk flags, listing content, prior follow-up exchanges, and user-provided scenario changes when available.",
    "Do not behave as though the user is asking about an unrelated new item unless the frontend has started a New Item session. Do not carry stale context from another workflow.",
    "Preserve verified facts, known uncertainty, condition disclosures, subject identity, exact-product uncertainty, source-backed facts versus inference, and prior scenario assumptions unless the user supplies new evidence that changes them.",
    "Avoid restarting the entire item analysis unless the user explicitly asks for a new analysis or a new search.",
    "No new live search is being performed inside this Ask response. Do not claim fresh marketplace search, sold-comps, source checks, new URLs, historical image search, or external database checks unless source-backed new results are explicitly supplied in the current context.",
    "Never invent marketplace evidence, search results, sold prices, sold dates, platform activity, exact image matches, exact product matches, maker, artist, date, edition, licensing, authenticity, defects, demand, historical references, prices, sources, or URLs.",
    "Clearly separate Visual Evidence, User-Provided Information, Search Evidence, Comparable Evidence, System Inference, Scenario Assumption, and Unknown or Unverified when those labels improve clarity.",
    "Question route behavior: explanation questions explain the current report, cite current evidence, do not rerun research, do not change the recommendation unless new information is supplied, and separate visual evidence, user input, search evidence, and inference.",
    "Question route behavior: price_scenario questions parse the proposed price, preserve current item identity and research, rerun only price or decision logic, state that no new market search occurred, and say only the price scenario changed.",
    "Never use reseller margin logic for a personal-use buyer. Use consumer fair-value, fit, condition risk, negotiation, alternatives, and walk-away logic for Buying for Myself.",
    "Use reseller profit, fees, shipping, net margin, max-buy price, liquidity, and risk logic for Buying to Resell.",
    "Question route behavior: condition_scenario questions record new details as user-provided, do not claim they were visually confirmed, preserve the original evidence record, distinguish observed condition from user-reported condition, and lower confidence when impact cannot be quantified.",
    "Question route behavior: research_question questions explain existing research, sources, rejected results, confidence, identity, authenticity, licensing, or verification status without fabricating additional support.",
    "Question route behavior: evidence_request questions identify the single most useful next detail or photo, such as a back label, maker mark, model number, dimensions, damage close-up, signature, copyright line, included accessories, or power-on photo.",
    "Question route behavior: listing_revision questions revise the current listing, preserve verified facts, visible condition issues, uncertainty disclosures, pricing honesty, and damage disclosures, and do not add official, licensed, authentic, rare, or exact era claims without support.",
    "Question route behavior: platform_guidance questions use current item characteristics like size, shipping difficulty, value, audience, collectibility, condition, confidence, and likely demand. Frame advice as practical guidance, not guaranteed platform performance.",
    "Question route behavior: new_live_search requests are deliberate search requests. Because this Ask endpoint does not execute a new follow-up live search, state that no new search occurred, answer only from current evidence, set needsNewSearch true, and do not fabricate sources or results.",
    "Question route behavior: unsupported_or_unrelated questions should explain that Ask Market Edge can only answer questions about the current item/report and should ask for a relevant item-specific question.",
    "Use the current report's Visual Recognition fields first for questions like what is this, why do you think it is a brand/organization/mascot/logo/character, what clues support that, or what should be photographed next.",
    "When identity is discussed, separate visual subject recognition, user-provided identity, exact product identity, maker, era, licensing, authenticity, exact comparable status, and pricing confidence.",
    "If broad subject identity is supported but exact product is unverified, preserve the supported subject instead of saying the whole identity is unverified.",
    "When exact evidence is unavailable, say what is known, what is likely, what came from the user, what the image supports, what searches support, what remains unverified, and what single next piece of evidence would help most.",
    "If asked whether an item is definitely a team/brand/mascot, explain subject confidence, visual consistency, user-provided identity, and what remains unverified.",
    "If asked whether it is authentic or licensed, do not infer authenticity from subject identity. Ask for the single most useful proof photo or marking.",
    "Use short recent conversation history to understand references like what about at $30, does that change your answer, what if the box is missing, make it shorter, use Facebook instead, search older ones, or why not. Avoid repetition and carry forward scenario changes only within this active item session.",
    workflowInstruction,
    `Controlled question route: ${answerType}.`,
    proposedPrice ? `Proposed scenario price parsed by the app: $${proposedPrice}.` : "No scenario price was parsed by the app.",
    scenario ? `Deterministic scenario notes: ${scenario}.` : "No deterministic scenario notes were available.",
    `Session ID: ${sessionId}.`
  ].join("\n");
  const userContent = [
    {
      type: "input_text",
      text: [
        `Question: ${question}`,
        "",
        "Current item context:",
        JSON.stringify(currentItemContext),
        "",
        "Recent conversation context:",
        JSON.stringify(recentConversationContext),
        "",
        prompt
      ].join("\n")
    }
  ];
  const payload = createResponsesPayload({
    model,
    systemText: "You are Ask Market Edge, a context-aware item and report follow-up assistant. The current structured report is authoritative context. Answer only from the active item session and return structured JSON.",
    userContent,
    schemaName: "ask_market_edge_answer",
    schema: askMarketEdgeSchema
  });

  return (await requestOpenAIJson({ apiKey, payload })).json;
}

function normalizeAskAnswer(answer, { answerType, scenario }) {
  const revised = answer.revisedListingFields || {};
  return {
    answer: cleanText(answer.answer),
    answerType: cleanText(answer.answerType) || answerType,
    evidenceBasis: normalizeStringArray(answer.evidenceBasis, 6),
    assumptions: normalizeStringArray(answer.assumptions, 6),
    recalculatedFields: normalizeStringArray(answer.recalculatedFields, 8),
    confidence: ensureConfidenceLayer(answer.confidence, "Low", "Ask Market Edge uses the current report context and does not perform a new live search unless source-backed new results are explicitly supplied."),
    recommendedNextAction: cleanText(answer.recommendedNextAction),
    needsNewSearch: answerType === "new_live_search" ? true : Boolean(answer.needsNewSearch),
    needsAdditionalPhoto: Boolean(answer.needsAdditionalPhoto),
    suggestedPhoto: cleanText(answer.suggestedPhoto),
    revisedListingFields: {
      title: cleanText(revised.title),
      description: cleanText(revised.description),
      priceStrategy: cleanText(revised.priceStrategy),
      conditionNotes: cleanText(revised.conditionNotes),
      sellerNotes: cleanText(revised.sellerNotes)
    },
    updatedScenario: cleanText(answer.updatedScenario || scenario)
  };
}

function normalizeAskWorkflow(value) {
  const workflow = cleanText(value);
  return ["personal_use", "resale", "market_value", "listing"].includes(workflow) ? workflow : "";
}

function sanitizeAskContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const allowedTopLevel = new Set([
    "sessionId",
    "workflow",
    "buyerIntent",
    "itemDescription",
    "askingPrice",
    "selectedPlatform",
    "photoCount",
    "buyerIntake",
    "currentReport"
  ]);
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (!allowedTopLevel.has(key)) {
      continue;
    }
    const sanitized = sanitizeAskValue(item, 0);
    if (sanitized !== null) {
      result[key] = sanitized;
    }
  }

  return Object.keys(result).length ? result : null;
}

function sanitizeAskConversation(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.slice(-4).map((entry) => sanitizeAskValue(entry, 0)).filter(Boolean);
}

function sanitizeAskValue(value, depth) {
  if (depth > 3) {
    return null;
  }

  if (Array.isArray(value)) {
    const items = value.map((item) => sanitizeAskValue(item, depth + 1)).filter((item) => item !== null).slice(0, 10);
    return items.length ? items : null;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [cleanText(key).slice(0, 80), sanitizeAskValue(item, depth + 1)])
      .filter(([key, item]) => key && item !== null)
      .slice(0, 35);
    return entries.length ? Object.fromEntries(entries) : null;
  }

  const text = cleanText(value).slice(0, 1400);
  return text ? text : null;
}

function classifyAskQuestion(question) {
  const text = cleanText(question).toLowerCase();
  if (/\b(search|look\s+for|find|rerun|re-run|run)\b.*\b(older|historical|retired|exact|more|comp|comps|comparable|comparables|sold|examples|model|sku|upc|barcode|image|images|again|version|versions|match|matches|reference|references)\b/.test(text)
    || /\b(search again|search older|look for historical|find more exact|look for sold|sold examples|live search|new search)\b/.test(text)) {
    return "new_live_search";
  }
  if (/\$\s*\d|\bat\s*\$|\b(what\s+(about|if)|would|should|could)\b.*\$\s*\d|\b(offer|pay|deal|margin|profit|net|maximum|max|most\s+i\s+should\s+pay|walk[- ]?away)\b/.test(text)
    || (/\b(worth|value)\b/.test(text) && !/\b(why|explain)\b/.test(text))) {
    return "price_scenario";
  }
  if (/\b(damage|damaged|condition|missing|included|box|crack|chip|stain|works|working|untested|part)\b/.test(text)) {
    return "condition_scenario";
  }
  if (/\b(sold|asking|source|comp|comparable|result|rejected|searched|evidence|confidence|why|definitely|identity|authentic|authenticity|licensed|licensing|real|verified|verify)\b/.test(text)) {
    return "research_question";
  }
  if (/\b(photo|picture|label|barcode|serial|model|mark|measure|measurement|verify|check)\b/.test(text)) {
    return "evidence_request";
  }
  if (/\b(rewrite|title|description|shorter|listing|facebook|ebay|mercari|etsy|poshmark|disclosure)\b/.test(text)) {
    return "listing_revision";
  }
  if (/\b(platform|sell|local|pickup|ship|shipping|where)\b/.test(text)) {
    return "platform_guidance";
  }
  if (/\b(why|explain|rating|recommendation)\b/.test(text)) {
    return "explanation";
  }
  return "unsupported_or_unrelated";
}

function extractProposedPrice(question) {
  const amounts = extractMoneyAmounts(question);
  return amounts.length ? amounts[0] : null;
}

function buildAskScenario({ answerType, proposedPrice, workflow, buyerIntent, currentItemContext }) {
  if (answerType !== "price_scenario" || !Number.isFinite(proposedPrice)) {
    return "";
  }

  const report = currentItemContext.currentReport || {};
  const fairRange = extractMoneyRange([
    report.estimatedFairMarketValue,
    report.fairPriceRange,
    report.aiOnlyRoughValueRange,
    report.expectedSalePrice,
    report.suggestedListingPrice,
    report.maximumRecommendedBuyPrice
  ].flat().join(" "));

  if (!fairRange) {
    return `Scenario price $${proposedPrice} was parsed, but the current report does not contain enough numeric value evidence for a deterministic recalculation.`;
  }

  const midpoint = (fairRange[0] + fairRange[1]) / 2;
  const ratio = proposedPrice / midpoint;
  if (workflow === "personal_use" || isPersonalUseIntent(buyerIntent)) {
    if (ratio <= consumerDecisionThresholds.goodMaxRatio) {
      return `At $${proposedPrice}, the price is below the current fair-value midpoint of about $${Math.round(midpoint)} and leans Good Value/Fair Price for personal use if condition assumptions still hold.`;
    }
    if (ratio <= consumerDecisionThresholds.fairMaxRatio) {
      return `At $${proposedPrice}, the price is close to the current fair-value midpoint of about $${Math.round(midpoint)} and leans Fair Price for personal use if condition assumptions still hold.`;
    }
    return `At $${proposedPrice}, the price is above the current fair-value midpoint of about $${Math.round(midpoint)} and should lean Negotiate/Pass unless condition, completeness, or fit improves.`;
  }

  const maxBuy = extractMoneyRange(String(report.maximumRecommendedBuyPrice || ""));
  if (maxBuy) {
    const ceiling = maxBuy[1];
    return proposedPrice <= ceiling
      ? `At $${proposedPrice}, the scenario is at or below the current max-buy guidance of about $${Math.round(ceiling)} before added resale costs.`
      : `At $${proposedPrice}, the scenario is above the current max-buy guidance of about $${Math.round(ceiling)} and likely weakens resale margin.`;
  }

  return `At $${proposedPrice}, use reseller margin caution because the current report does not contain a clear numeric maximum buy price.`;
}

async function generateReportWithOpenAI({ apiKey, model, platform, notes, photos, reportType, buyerIntake }) {
  if (reportType === "marketValue") {
    return generateMarketValueReportWithLiveSearch({ apiKey, model, platform, notes, photos, buyerIntake });
  }

  return generateListingWithResearch({ apiKey, model, platform, notes, photos });
}

async function generateListingWithResearch({ apiKey, model, platform, notes, photos }) {
  const research = await runResearchPipeline({
    apiKey,
    model,
    platform,
    notes,
    photos,
    buyerIntake: normalizeBuyerIntake({
      purchase_context: "online_marketplace",
      purchase_intent: "resale",
      buyer_notes: notes
    }),
    researchPurpose: "listing"
  });
  const report = await generateFinalListingReport({ apiKey, model, platform, notes, research });

  return enforceListingResearchHonesty(report, research, platform);
}

async function generateFinalListingReport({ apiKey, model, platform, notes, research }) {
  const { identity, sourceRoute, searchQueries, liveSearch } = research;
  const sourceBackedComps = liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found";
  const liveSearchBasis = sourceBackedComps
    ? "Live comparable search was performed. Use only the source-backed comparable items supplied by the backend when supporting price."
    : liveSearch.webSearchExecuted
      ? "Live search completed, but no reliable source-backed exact or strong similar comps passed filtering. Listing price must be cautious, broad, and low-confidence."
      : "Live search did not complete. Listing price must be cautious, broad, and low-confidence because it is not backed by live source results.";
  const userContent = [
    {
      type: "input_text",
      text: [
        `Marketplace platform: ${platform}`,
        `Seller item notes: ${notes}`,
        `Visual recognition report: ${JSON.stringify(identity.visualRecognition || {})}`,
        `Extracted item identity: ${JSON.stringify(identity)}`,
        `Source route: ${JSON.stringify(sourceRoute)}`,
        `Search queries: ${JSON.stringify(searchQueries)}`,
        `Live research result: ${JSON.stringify(liveSearch)}`,
        "",
        "Create an evidence-backed marketplace listing draft.",
        "Use the extracted photo evidence, visible text, seller notes, search queries, source route, and live research result supplied by the backend.",
        "Use the Visual Recognition report before exact product identity. The listing title should preserve a strongly supported broad visual subject when exact product, maker, date, licensing, or authenticity remains unknown.",
        "Separate broad subject identity from exact product identity. Use a supported subject in listing copy, but do not invent exact maker, year, model, licensing, or authenticity.",
        "If exact product identity is unknown, preserve the supported broad subject and state that exact item, maker, era, licensing, or authenticity remain unverified.",
        "Do not claim live sold evidence, marketplace activity, sold dates, prices, sources, demand, or search results beyond the supplied live research result.",
        "Never describe an active asking price as a confirmed sold price.",
        "Never fabricate sales, marketplace activity, sold dates, demand, prices, sources, URLs, or search results.",
        "Do not invent URLs, sources, comparable items, or sold comps.",
        "The researchResults section must use only source-backed comparable items supplied by the backend, or a clear no-usable-evidence message when none passed filtering.",
        "The comparableQuality section must classify evidence as Strong Comparable, Partial Comparable, Identity / Reference Result, Weak Match, or Rejected Match. Weak or rejected results must not materially drive the price.",
        "The recommendedListingPrice must distinguish asking prices, current retail pricing, reference-only results, source-backed comparable evidence, and the system's calculated estimate.",
        "When research is weak or unavailable, lower pricingConfidence, widen the price range, state uncertainty, and request useful additional evidence.",
        "Do not present a highly confident or precise price based only on visual opinion.",
        "OptimizedListingTitle and title should match. ListingDescription and description should match.",
        "ItemSpecifics and itemDetails should preserve brand, product name, series, model/item number, manufacturer/location, UPC/barcode, materials, colors, patterns, size/dimensions, piece count, packaging, condition, wear, damage, missing parts, maker marks, signatures, date/era clues, and distinctive visual features when known.",
        "ConditionNotes should include only condition details visible in photos or provided in notes.",
        `Research basis: ${liveSearchBasis}`
      ].join("\n")
    }
  ];

  const payload = createResponsesPayload({
    model,
    systemText: "You are Listing Engine, a careful assistant that turns item photos, seller notes, and source-backed research into marketplace listing drafts. Return only the requested structured JSON.",
    userContent,
    schemaName: "marketplace_listing",
    schema: listingSchema
  });

  return (await requestOpenAIJson({ apiKey, payload })).json;
}

async function generateMarketValueReportWithLiveSearch({ apiKey, model, platform, notes, photos, buyerIntake }) {
  const intake = buyerIntake || normalizeBuyerIntake({});
  const research = await runResearchPipeline({
    apiKey,
    model,
    platform,
    notes,
    photos,
    buyerIntake: intake,
    researchPurpose: "buyer_decision"
  });

  const { identity, sourceRoute, searchQueries, liveSearch } = research;

  if (isPersonalUseIntent(intake.purchase_intent)) {
    const report = await generateFinalConsumerDecisionReport({
      apiKey,
      model,
      platform,
      notes,
      identity,
      sourceRoute,
      searchQueries,
      liveSearch,
      buyerIntake: intake
    });

    return enforceConsumerDecisionHonesty(report, research, intake, platform);
  }

  const report = await generateFinalMarketValueReport({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, liveSearch, buyerIntake: intake });

  return enforceLiveSearchHonesty(report, liveSearch, intake, identity, platform);
}

async function runResearchPipeline({ apiKey, model, platform, notes, photos, buyerIntake, researchPurpose }) {
  const intake = buyerIntake || normalizeBuyerIntake({});
  const visualRecognition = await recognizeVisualSubject({ apiKey, model, platform, notes, photos, buyerIntake: intake });
  const identity = await extractItemIdentity({ apiKey, model, platform, notes, photos, buyerIntake: intake, visualRecognition });
  const sourceRoute = routeMarketSources(identity, intake, platform);
  const searchQueries = buildLiveSearchQueries(identity, sourceRoute, notes, intake);
  const liveSearch = await executeLiveComparableSearch({
    apiKey,
    model,
    platform,
    notes,
    identity,
    sourceRoute,
    searchQueries,
    buyerIntake: intake,
    researchPurpose
  });

  return { visualRecognition, identity, sourceRoute, searchQueries, liveSearch, buyerIntake: intake };
}

async function recognizeVisualSubject({ apiKey, model, platform, notes, photos, buyerIntake }) {
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const userContent = [
    {
      type: "input_text",
      text: [
        "Perform Visual Subject Recognition before any exact product identification, marketplace research, pricing, valuation, or listing generation.",
        "First answer: What am I looking at?",
        "Identify the broad visual subject independently of exact commercial product identity, maker, model, edition, date, licensing, authenticity, or comparable matches.",
        "Do not force every image into a retail-product classification. Recognize categories such as sports, mascots, logos, artwork, illustrations, advertising, posters, signs, plaques, prints, political memorabilia, military insignia, historical graphics, vintage packaging, toys, figurines, furniture, tools, appliances, electronics, clothing, jewelry, coins, watches, books, household items, antiques, and collectibles when supported.",
        "Treat user input as evidence. If it agrees with visual evidence, increase visual subject confidence. If it is neutral, preserve it as context. If it conflicts, report the conflict. Never silently discard user information and never blindly accept it.",
        "Keep visual subject confidence independent from exact product, maker, era, licensing, authenticity, comparable, and pricing confidence.",
        "Low or missing exact-product evidence must not reduce confidence in an obvious broad visual subject.",
        "Only populate fields supported by the photo evidence, visible text, and user notes. Never fabricate maker, artist, date, edition, license, authentication, exact product, sold data, source results, or image matches.",
        "Use confidence language such as High, Medium, Low, Strongly Supported, Likely, Confirmed, Not Yet Verified, or Exact Product Unknown.",
        `Marketplace platform context: ${platform || "No platform selected"}`,
        `User item notes: ${notes || "No additional notes provided."}`,
        "Guided Buyer Intake:",
        buyerIntakeText
      ].join("\n")
    },
    ...photos.map((photo) => ({
      type: "input_image",
      image_url: photo.dataUrl,
      detail: "auto"
    }))
  ];

  const payload = createResponsesPayload({
    model,
    systemText: "You are Market Edge's Visual Intelligence Engine. Recognize broad visual subjects from photos before product identification. Return only structured JSON.",
    userContent,
    schemaName: "visual_subject_recognition",
    schema: visualRecognitionSchema
  });

  return normalizeVisualRecognition((await requestOpenAIJson({ apiKey, payload })).json);
}

async function extractItemIdentity({ apiKey, model, platform, notes, photos, buyerIntake, visualRecognition }) {
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const userContent = [
    {
      type: "input_text",
      text: [
        "Extract the strongest searchable item identity from the photos, buyer notes, and Visual Recognition report.",
        "This stage happens after Visual Subject Recognition. Preserve the visual subject first, then narrow toward exact product, maker, model, edition, artist, manufacturer, license, material, dimensions, and comparable identifiers.",
        "Use Guided Buyer Intake as structured buyer-provided clues, but still verify against photos and visible text.",
        "Separate broad subject identity from exact product identity. Subject identity answers what is depicted or represented; exact product identity answers the exact item, maker, year, model, licensing, and comparable match.",
        "A broad subject may be likely or strongly supported even when the exact product, maker, era, licensing, authenticity, or exact comparable cannot be verified.",
        "Treat user-provided identity as meaningful evidence: do not accept it blindly, do not ignore it, and do not contradict it without visible or textual conflict.",
        "When the photos are visually consistent with the user description, preserve the subject as likely or strongly supported and explain what remains unverified.",
        "When the image is unclear, preserve the user description as a plausible but visually unconfirmed clue.",
        "When visible evidence conflicts with the user description, record the conflict plainly in identityConflictNotes.",
        "For logos, mascots, institutions, organizations, brands, characters, artwork, advertising, historical graphics, signs, posters, and collectibles, subjectIdentity should preserve the supported broad visual subject even if exact product, maker, age, and licensing are unknown.",
        "Use subjectConfidence separately from exactProductConfidence. Do not let no exact comparable found erase a supported broad subject identity.",
        "Preserve item name, brand, manufacturer, model, SKU, UPC, approximate age or era, condition, asking price, purchase context, and condition concerns when provided.",
        "Do not silently discard conflicts between typed identity fields, buyer notes, and photo evidence. Add conflicts or uncertainty to identityConflictNotes and lower confidence later.",
        "Prioritize exact visible front-box wording, back-label wording, manufacturer/location text, brand/series text, product name or box title, UPC/barcode, item code/SKU/style number, distinctive visual description, category, size, condition, visible price, and current asking price.",
        "Preserve searchable text exactly when visible. Do not collapse label text into generic terms if a brand, series, city/state, SKU, UPC, or item code appears.",
        "For institution, organization, school, team, mascot, logo, or character items, preserve names, visual symbols, licensing sticker text, manufacturer stamp, model number, copyright wording, year, product category, dimensions, material, and missing-component status when visible or provided.",
        "Do not describe an officially licensed sticker as proof of a specific manufacturer. If the manufacturer stamp is unclear, say that a closer photo is needed rather than treating all identification as failed.",
        "For holiday decor, capture wording such as Santa's Workshop, Hubbard Ohio, Santa Claus, Santa figurine, Christmas decoration, holiday decor, boxed seasonal decor, green box, height/size such as 10 inch if provided, item code such as GAB031, UPC/barcode, and asking price such as $65 when provided.",
        "For boxed seasonal decor or unbranded/private-label holiday figures, treat brand/series, location text, item code, UPC, and box/label wording as primary identity clues.",
        "For apparel, capture brand, style number, SKU/UPC, garment type, color, size, material, tag status, and current asking price.",
        "For electronics, capture exact model number, brand/manufacturer, specs visible in notes/photos, condition, charger/accessories, and current asking price.",
        "For ceramics/home goods, capture maker, pattern, piece count, lids, material, condition, and current asking price.",
        "Use Unknown for unknown text fields. Use an empty array only when no identifier is visible or provided.",
        "Buyer context options include retail, resale, secondhand, local, collectible, apparel, electronics, home goods, furniture, vintage, unknown.",
        `Marketplace platform: ${platform || "No platform selected"}`,
        `Buyer item notes: ${notes || "No additional notes provided."}`,
        `Visual Recognition Report: ${JSON.stringify(visualRecognition || {})}`,
        "Guided Buyer Intake:",
        buyerIntakeText
      ].join("\n")
    },
    ...photos.map((photo) => ({
      type: "input_image",
      image_url: photo.dataUrl,
      detail: "auto"
    }))
  ];

  const payload = createResponsesPayload({
    model,
    systemText: "You identify marketplace items after broad visual subject recognition. Return only structured JSON.",
    userContent,
    schemaName: "item_identity",
    schema: itemIdentitySchema
  });

  return normalizeIdentity({
    ...(await requestOpenAIJson({ apiKey, payload })).json,
    visualRecognition
  });
}

async function executeLiveComparableSearch({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, buyerIntake, researchPurpose = "buyer_decision" }) {
  const searchStartedAt = new Date().toISOString();
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const purposeText = researchPurpose === "listing"
    ? "Generate Listing price-support research. The goal is to support a cautious marketplace listing price and make research evidence visible."
    : "Worth Buying buyer-decision research. The goal is to decide whether the user should buy this item right now.";
  const userContent = [
    {
      type: "input_text",
      text: [
        "Perform source-routed live comparable search for marketplace item research.",
        `Research purpose: ${purposeText}`,
        "You must use web search. Do not rely only on general model knowledge.",
        "Use only the source route and targeted queries below. Do not default to eBay unless the route includes an eBay-related source.",
        "Use the targeted search queries as product-focused search inputs. Do not replace them with repetitive code-only queries or platform-stuffed variants.",
        "Search exact identifiers, brand/product-title wording, visual descriptions, category terms, and price/context when present.",
        "Return comparableItemsFound only when the result is source-backed and includes a URL from the live search results.",
        "Each comparableItemsFound string must include source/platform/site, title, price when visible, shipping when visible, condition when visible, URL/source link, match quality, and why it appears to match or is only similar.",
        "Do not invent URLs, prices, sources, sold comps, or platforms.",
        "Never describe active asking prices as confirmed sold prices.",
        "For Generate Listing research, include source-backed comparable or reference evidence that can support a listing price, but label weak/reference-only evidence honestly.",
        "For vintage, collectible, organization, logo, mascot, character, ceramic, cookie-jar, decor, and secondhand items, prioritize exact label/stamp searches, resale results, vintage results, collector/reference sources, organization/brand/character/licensee searches, and exact phrase results.",
        "Reject generic wholesalers, unrelated restaurant-supply sites, bulk import/manufacturing catalogs, unrelated current-retail products, and generic visual lookalikes as meaningful comps.",
        "Do not list a source as meaningfully searched merely because a weak result appeared. Search evidence should distinguish targeted source categories, actual relevant results reviewed, rejected irrelevant sources, and reliable cited sources.",
        "Treat typed buyer identity fields as strong clues only when they do not conflict with photos, visible label wording, or source results.",
        "Reject or weaken comps that conflict with reliable UPC, model, SKU, maker, brand, piece count, material, era, size, pattern, condition, or product type.",
        "Use purchase context to route the search: retail/mall means current product and retailer sources; consignment/thrift/flea/estate/antique means resale, vintage, collector, specialty reference, and exact-label searches; Facebook Marketplace/private seller means local value, pickup, negotiation, and transport/inspection risk.",
        "Classify each reliable result as Exact Match, Strong Similar Match, or Weak Similar Match, and explain why it is or is not comparable.",
        "If no reliable source-backed comps are found, return an empty comparableItemsFound array.",
        "",
        `Marketplace platform: ${platform || "No platform selected"}`,
        `Buyer item notes: ${notes || "No additional notes provided."}`,
        "Guided Buyer Intake:",
        buyerIntakeText,
        `Visual recognition report: ${JSON.stringify(identity.visualRecognition || {})}`,
        `Extracted identity: ${JSON.stringify(identity)}`,
        `Source route: ${JSON.stringify(sourceRoute)}`,
        `Targeted search queries: ${JSON.stringify(searchQueries)}`
      ].join("\n")
    }
  ];

  const payload = {
    model,
    tools: [{ type: "web_search" }],
    tool_choice: "required",
    include: ["web_search_call.action.sources"],
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are a live comparable search controller. Search the web using the provided source route, then return only structured JSON."
          }
        ]
      },
      {
        role: "user",
        content: userContent
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "live_comparable_search",
        schema: liveCompsSearchSchema,
        strict: true
      }
    }
  };

  const requestStartedAtMs = Date.now();
  let includeSourcesRequested = true;
  let includeFallbackReason = "";

  try {
    let response;
    try {
      response = await requestOpenAIJson({ apiKey, payload });
    } catch (error) {
      if (!isIncludeCompatibilityError(error)) {
        throw error;
      }

      includeSourcesRequested = false;
      includeFallbackReason = "Source include was not accepted by the provider; live search was retried without source-list include.";
      const retryPayload = { ...payload };
      delete retryPayload.include;
      response = await requestOpenAIJson({ apiKey, payload: retryPayload });
    }

    const { json, data, statusCode } = response;
    return normalizeLiveSearchResult({
      result: json,
      responseData: data,
      searchStartedAt,
      sourceRoute,
      searchQueries,
      elapsedMs: Date.now() - requestStartedAtMs,
      statusCode,
      includeSourcesRequested,
      includeFallbackReason
    });
  } catch (error) {
    return buildUnavailableLiveSearchResult({
      error,
      sourceRoute,
      searchQueries,
      searchStartedAt,
      elapsedMs: Date.now() - requestStartedAtMs,
      includeSourcesRequested,
      includeFallbackReason
    });
  }
}

async function generateFinalConsumerDecisionReport({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, liveSearch, buyerIntake }) {
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const liveSearchInstruction = liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found"
    ? "Live comparable search was performed. Use only the source-backed comparable items supplied by the backend when supporting price."
    : liveSearch.webSearchExecuted
      ? "Live search completed, but no reliable source-backed exact or strong similar comps passed filtering. The decision must be low confidence and should not present a precise walk-away price as fact."
      : "Live search did not complete. The decision must be low confidence and AI-reasoning-only.";
  const taskText = [
    "Create a personal-use consumer buying decision report, not a reseller profit report and not a marketplace listing draft.",
    "Primary question: Is this item fairly priced for someone buying it for themselves?",
    "Use the shared research evidence supplied by the backend: extracted identity, photo evidence, source route, queries, live search status, and source-backed comparable results.",
    "Use Visual Subject Recognition first. Explain what is visually supported before narrowing to exact product, model, maker, date, licensing, authenticity, pricing, or comparable evidence.",
    "Separate broad subject identity from exact product identity. A likely subject can be recognized even when exact product, maker, era, licensing, authenticity, or exact comparable are unverified.",
    "Do not turn exact-product uncertainty into total subject uncertainty. Preserve the supported broad subject and lower pricing/exact-product confidence separately.",
    "Do not use marketplace fee, shipping margin, profit, or resale spread logic to drive the recommendation.",
    "Focus on fair value, product fit, condition, completeness, replacement alternatives, buyer risk, negotiation, and whether the asking price makes sense for personal use.",
    "Use valueRating exactly as one of: Exceptional Value, Good Value, Fair Price, Slightly Overpriced, Overpriced, Poor Value, Insufficient Evidence.",
    "Use recommendation exactly as one of: Buy, Buy If It Fits Your Needs, Negotiate, Wait for a Better Price, Pass, Need More Information.",
    "The valueRating and recommendation must be distinct. Example: Fair Price / Buy If It Fits Your Needs or Slightly Overpriced / Negotiate.",
    "Do not assign a positive value rating merely because the item looks inexpensive. Compare asking price to evidence-backed fair value, condition, completeness, and uncertainty.",
    "estimatedFairMarketValue must clearly distinguish source-backed current retail, active asking prices, used-market evidence, sold evidence only when actually present, refurbished/open-box pricing, reference-only results, and the system's fair-value estimate.",
    "fairPriceRange must include Low Fair Price, Typical Fair Price, and High Fair Price.",
    "recommendedOffer must include Opening Offer, Target Purchase Price, and Maximum Recommended Price when evidence supports those numbers.",
    "walkAwayPrice must be clear when evidence is sufficient. When evidence is weak, say the walk-away price is not supported yet.",
    "negotiationGuidance must be honest buyer-facing language. Do not encourage dishonest claims or pretend a lower comp exists unless source-backed results support it.",
    "reasonsToBuy and reasonsForCaution must be specific to the available evidence, not generic praise or generic warnings.",
    "productOrConditionRisks and riskFlags must show only supported risks such as Identity Not Confirmed, Price Above Market, Missing Parts, Condition Unclear, Authenticity Unclear, Compatibility Risk, No Return Protection, Weak Comparable Evidence, Older Model, or Repair Risk.",
    "betterValueConsiderations may mention newer, older, refurbished, open-box, used, local pickup, competing brand, or waiting only when the available evidence supports it. Do not invent specific alternatives.",
    "researchResults must use only source-backed comparable/reference items supplied by the backend, or a clear no-usable-evidence message when none passed filtering.",
    "comparableQuality must classify evidence as Strong Comparable, Partial Comparable, Identity / Reference Result, Weak Match, or Rejected Match.",
    "pricingConfidence must start with High, Medium, or Low and explain why.",
    "Never fabricate sold data, URLs, prices, defects, authenticity, or source results. Never describe active asking prices as confirmed sales.",
    "If identity, condition, asking price, or reliable comps are weak, use Insufficient Evidence / Need More Information or a conservative recommendation. Do not give a precise walk-away price when confidence is insufficient.",
    "Ask for the single most useful next detail or photo when evidence is insufficient.",
    `Research basis: ${liveSearchInstruction}`
  ];
  const userContent = [
    {
      type: "input_text",
      text: [
        `Marketplace platform: ${platform || "No platform selected"}`,
        `Buyer item notes: ${notes || "No additional notes provided."}`,
        "Guided Buyer Intake:",
        buyerIntakeText,
        `Visual recognition report: ${JSON.stringify(identity.visualRecognition || {})}`,
        `Extracted item identity: ${JSON.stringify(identity)}`,
        `Backend source route: ${JSON.stringify(sourceRoute)}`,
        `Backend search queries: ${JSON.stringify(searchQueries)}`,
        `Live comparable search result: ${JSON.stringify(liveSearch)}`,
        "",
        ...taskText
      ].join("\n")
    }
  ];

  const payload = createResponsesPayload({
    model,
    systemText: "You are Marketplace Edge, a careful consumer purchase decision assistant. Help everyday buyers decide whether an item is fairly priced for personal use. Return only the requested structured JSON.",
    userContent,
    schemaName: "consumer_purchase_decision",
    schema: consumerDecisionSchema
  });

  return (await requestOpenAIJson({ apiKey, payload })).json;
}

async function generateFinalMarketValueReport({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, liveSearch, buyerIntake }) {
  const platformContext = platform || "No specific marketplace selected. Use buyer-first market logic across retail, online, local, collector, resale, and secondhand contexts.";
  const resalePlatformContext = buildResalePlatformContext(platform, buyerIntake);
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const liveSearchInstruction = liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found"
    ? "Live comparable search was performed. Source-backed results are listed when reliable matches were found."
    : liveSearch.webSearchExecuted
      ? "Live comparable search completed with no reliable source-backed exact or strong similar comps. The remaining value range is AI market reasoning only and should be treated as low confidence."
      : "Live comparable search did not complete. The remaining value range is AI market reasoning only and should be treated as low confidence.";
  const taskText = [
    "Create a buyer-first Worth Buying / Market Intelligence report, not a marketplace listing draft.",
    "Primary question: Should the user buy this item at this price, right now?",
    "Use Visual Subject Recognition first. Preserve what the photos strongly support even if exact product identity, comps, maker, date, licensing, authenticity, or valuation remain uncertain.",
    "Use Guided Buyer Intake as the current purchase opportunity. The asking price is the seller/store price right now, not automatic market value.",
    "Separate broad subject identity from exact product identity. Preserve supported broad subject recognition even when maker, date, licensing, authenticity, and exact comparable are unverified.",
    "Do not let no exact comparable found erase a visually/user-supported subject identity; lower exact-product, comparable, and pricing confidence separately.",
    "Do not confuse purchase_context with platform: purchase_context is where the user is buying the item now; platform is where the user may later sell it.",
    "Consider purchase context, purchase intent, condition, condition concerns, identification confidence, live comp confidence, valuation confidence, and resale margin where relevant.",
    "For Worth Buying, platform is optional. When purchase_intent is resale or both and platform is selected, treat that selected platform as the intended resale platform. When no resale platform is selected, recommend the best likely selling platform.",
    "For resale intent, do not call something a good buy unless likely margin reasonably accounts for marketplace fees, shipping or transport, condition risk, time to sell, and comp confidence.",
    "Low confidence must materially control the decision. When reliable exact comps and reliable strong similar comps are missing, treat the case as weak evidence, not as a normal resale opportunity.",
    "In weak-evidence resale cases, prefer Pass or Need More Info at ordinary or ambitious asking prices. A speculative offer is allowed only at a substantial discount that protects the buyer from uncertain identity, uncertain demand, condition risk, fees, transport, shipping, breakage, time to sell, and the possibility of no buyer.",
    "Do not use the high end of an AI-only resale range to justify Buy Here or a close-to-asking negotiation target. Use the conservative realized-sale case, and do not recommend buying when expected profit only exists near the optimistic top of a low-confidence range.",
    "When no reliable comps exist, Suggested Listing Price is only an advertised starting point, not evidence of actual value. Expected Sale Price must be more conservative than Suggested Listing Price, and if evidence is too weak, say resale price cannot be estimated reliably from available evidence.",
    "Decision priority for Worth Buying: identify the item reliably, verify relevant comps, confirm demand, compare the asking price to conservative supported value, require margin after risks and costs, and only then recommend Buy Here or Negotiate.",
    "Return Buyer Risk Score fields for Worth Buying: buyer_risk_score from 0 to 100, buyer_risk_level, buyer_risk_summary, primary_risk_factors, and risk_reduction_actions.",
    "Buyer Risk Score is not confidence. It answers how risky it is to spend this amount of money on this item under these circumstances. Lower is safer; higher is riskier.",
    "Use levels exactly as Low Risk, Moderate Risk, High Risk, or Very High Risk. 0-24 is Low Risk, 25-49 is Moderate Risk, 50-74 is High Risk, and 75-100 is Very High Risk.",
    "Risk must combine Evidence Risk and Exposure Risk. Evidence Risk covers item identification uncertainty, live comparable quality, valuation support, demand uncertainty, and evidence conflicts. Exposure Risk covers dollars at risk, asking price versus conservative value, fees, shipping, transport, repair, storage, disposal, fraud, authenticity, and safety exposure.",
    "Low confidence should raise Buyer Risk Score, but weak evidence alone must not automatically force 100 when the buyer's actual downside is minimal.",
    "A very low asking price can reduce overall buyer risk only when transport, repair, shipping, storage, disposal, authenticity, fraud, safety, contamination, and missing-component exposure do not create meaningful added downside.",
    "Risk and purchaserDecision must agree. Low or Moderate Risk may support a cautious or speculative buy. High Risk should generally be Pass, Need More Info, or only a substantially lower offer. Very High Risk should generally be Pass. Do not pair a high risk score with Buy Here unless the rare exception is clearly explained.",
    "When evidence is weak but downside is genuinely limited, preserve the allowed decision labels but describe it as Speculative Buy, Buy only at this very low price, low-dollar gamble, or buy only if storage, transport, and condition create no added burden. Explain that valuation remains uncertain, resale is not guaranteed, low price limits dollar exposure, added costs could change the decision, and the buyer should not extrapolate a high resale value from the Buy decision.",
    "For personal-use intent, value may include replacement cost, availability, and buyer utility, but do not disguise preference as market value.",
    "Missing asking price should reduce Buyer Decision Confidence and limit maximum buy-price guidance, but it should not prevent useful identity, market research, or cautious resale-price guidance.",
    "Keep asking price, maximum recommended buy price, suggested listing price, expected sale price, and minimum acceptable price separate.",
    "If typed identity fields conflict with photo evidence, visible labels, or source-backed results, lower itemIdentificationConfidence and prefer Need More Info, Negotiate, Wait, or Pass.",
    "Tailor negotiation guidance to purchase context: flea market, estate sale, private seller, and Facebook Marketplace can include opening offer, target range, walk-away price, inspection, pickup, transport, and scam caution when evidence supports it; retail store or mall should emphasize sale price, coupons/markdown potential, return policy, and buy-elsewhere only when source-backed lower prices exist.",
    "Do not generate a precise offer range when evidence is too weak.",
    "Do not claim live sold-comps, marketplace search, retail search, better-price lookup, current listings, source links, or external database checks beyond the live comparable search status and source-backed comparableItemsFound supplied by the backend.",
    "The purchaserDecision section must start with exactly one of these labels: Buy Here, Negotiate, Buy Elsewhere, Wait, Pass, or Need More Info. Explain the reasoning briefly.",
    "If live search is unavailable or no reliable source-backed comps exist, do not overstate certainty. Lean Need More Info, Negotiate, Wait, or Pass unless the personal-use value is explicit.",
    "Use live comparable results when available, but do not invent or add comparable items beyond the supplied source-backed comparableItemsFound list.",
    "If item information is vague, default to Need More Info, Wait, or Negotiate rather than a strong Buy Here.",
    "The liveComparableSearchStatus section must be exactly the live search status supplied by the backend.",
    "The weFoundThisItem section must use only source-backed items supplied by the backend that are Exact Match or likely exact matches. Include source/platform/site, title, price, shipping if available, condition if available, link, match quality, and why it appears to match.",
    "The weFoundSimilarComparableItems section must use only source-backed items supplied by the backend that are similar but not exact. Include source/platform/site, title, price, shipping if available, condition if available, link, match quality, and why it is only similar.",
    "The liveSearchDidNotComplete section must be empty if web_search_call appeared. If no web_search_call appeared, say live search did not complete, sources searched were none, and source-backed comps could not be retrieved.",
    "The noReliableComparableItemsFound section must be empty when exact or similar source-backed comps are supplied, and it must also be empty when live search did not complete. If live search completed but no exact or strong similar source-backed comps were supplied, explain that no source-backed exact or strong similar matches passed match-quality checks.",
    "The searchCoverage section must describe source categories targeted, sources searched or returned only when supplied by the backend, and whether source-backed comps passed match-quality checks.",
    "Do not hand off marketplace discovery as a task to the user. Report what the system searched or found.",
    "The itemIdentificationConfidence, liveCompConfidence, valuationConfidence, and buyerDecisionConfidence sections must each start with High, Medium, or Low and include what supports confidence, what weakens confidence, and what evidence would improve confidence.",
    "Use Item Identification Confidence for how well photos, typed details, labels, UPC/model/SKU, and source results agree. Use Live Comp Confidence for source-backed match quality. Use Valuation Confidence for price range reliability. Use Buyer Decision Confidence for whether enough price/context/condition evidence exists to recommend action.",
    "The currentAskingPrice section must state the current seller/store asking price when provided, or clearly say it was not provided.",
    "The itemIdentification section must summarize the item, preserving school/team/mascot, licensing sticker, maker stamp, model/SKU/UPC, copyright/year, material, dimensions, product category, lid status, and missing-component status when known.",
    "The buyerTypeFit section must use one or more of these labels: Personal Use, Resale Opportunity, Both, Unclear.",
    "The marketType section must use one or more of these labels: Retail, Resale, Secondhand, Vintage, Collectible, Apparel/Fashion, Electronics, Home Goods, Local Marketplace, Unknown.",
    "The itemClarityScore section must start with High, Medium, or Low and explain what is known and what is missing.",
    "The currentPriceAssessment section must start with Fair, High, Low, or Unknown. If no current asking price is provided, say: Current price assessment requires the current asking price.",
    "The priceConfidence section must start with exactly one of these labels: High, Medium, or Low. Explain why confidence is high or low.",
    `The priceBasis section must distinguish source-backed live comparable search from AI-only fallback. Use this basis: ${liveSearchInstruction}`,
    "Use a broad estimatedMarketValue range, not a false-precision single number.",
    "The aiOnlyRoughValueRange section must be empty when reliable source-backed comps exist. If live search is unavailable or no reliable source-backed comps exist, label the value as AI-Only Rough Value Range and explain that it is not fact-backed by live comps.",
    "In maximumRecommendedBuyPrice, use value/savings logic for personal use and margin/profit logic for resale. If no asking price is provided, explain that buy-price guidance is limited.",
    "When purchase_intent is resale or both, recommendedSellingPlatform, suggestedListingPrice, expectedSalePrice, minimumAcceptablePrice, priceBasis, expectedSellingTime, and platformSpecificSellingGuidance must be filled.",
    "Suggested listing price is the starting advertised price. Expected sale price is the likely negotiated or realized sale price. Minimum acceptable price is the practical floor before fees, shipping, transport, condition risk, and time.",
    "If no reliable live comps exist, still provide resale-price guidance as AI-only, low confidence, and preferably as a cautious range. Do not present a single number as source-backed fact.",
    "For Facebook Marketplace guidance, include local pickup suitability, likely negotiation room, recommended starting price, realistic cash-acceptance range, transport or breakage considerations, and whether shipping should be avoided.",
    "When purchase_intent is personal_use, keep resale-price fields empty unless there is a clearly relevant resale angle, and do not force resale pricing.",
    "In betterPriceCheckNeeded, explain whether the source-backed results indicate a better price may exist. Do not tell the user to go search elsewhere, and do not claim actual cheaper listings were found unless supplied in source-backed comparableItemsFound.",
    "If no reliable comps are found for a high-priced decor item such as a $65 Santa or holiday decoration, avoid a confident Buy Here recommendation unless personal-use value is the clear reason. Prefer Need More Info, Negotiate, or Pass and explain why $65 is difficult to justify without brand/rarity or source-backed comps.",
    "Do not inflate values from generic category assumptions. Do not treat the user's asking price as market value. Do not treat weak lookalikes as strong comps.",
    "Do not default to eBay. eBay is only one market signal and should be mentioned only when the source route or item category makes it useful.",
    "For retail/current/SKU/UPC/model items, prioritize brand/manufacturer, retailer, Google Shopping-style, Amazon/major retail signals; eBay is secondary only for used/refurbished/resale.",
    "For apparel/fashion with tag/SKU/style number, prioritize brand site, retailer sites, Google Shopping-style web results, and Poshmark/fashion resale; eBay only when used/resale comparison is useful.",
    "For electronics/model-number items, prioritize manufacturer, major retailers, refurbished listings, Amazon/Best Buy/Walmart/Newegg-style sources; eBay only for used/refurbished comparison.",
    "For vintage/collectible/discontinued/holiday decor/ceramics/small shippable secondhand goods, eBay, Etsy, Mercari, Facebook Marketplace/local signals, and collector/reference sites may be relevant.",
    "For vintage, collectible, organization, logo, mascot, character, ceramic, cookie-jar, decor, and secondhand items, prioritize exact label and stamp searches, resale, vintage, collector/reference clues, organization/brand/character/licensee searches, and exact phrase results. Deprioritize generic wholesalers, restaurant-supply sites, bulk import/manufacturing catalogs, unrelated current retail, and generic visual lookalikes.",
    "For institution, organization, school, team, mascot, logo, or character items, do not treat an officially licensed sticker as proof of the manufacturer. If the manufacturer stamp is unclear, ask for a closer photo of the stamp while still preserving visual subject clues.",
    "For furniture or bulky local goods, prioritize Facebook Marketplace-style local value logic, Craigslist/OfferUp/local pickup resale, and local consignment logic; do not overvalue eBay because shipping distorts bulky-item prices.",
    "In resalePotential, include expected resale range, likely selling timeline, and best selling platforms only if resale is relevant; otherwise say resale is not the main reason to buy.",
    "In missingDetails, include specific missing identifiers such as brand, manufacturer, model, SKU, UPC/barcode, style number, size, color, material, condition, age/era, authenticity markers, completeness/accessories, and current asking price.",
    "In whatToVerifyBeforeBuying, ask category-specific verification questions.",
    "The searchQueriesUsed section must only include queries the backend actually used. Start with: These are the queries the system used.",
    "If photos show a tag, SKU, model, label, barcode, or other identifier, use that information in the reasoning.",
    "Make the report practical for a person standing in a store, flea market, consignment shop, thrift store, antique mall, or looking at an online listing."
  ];

  const userContent = [
    {
      type: "input_text",
      text: [
        `Marketplace platform: ${platform || "No platform selected"}`,
        `Market analysis context: ${platformContext}`,
        `Resale platform context: ${resalePlatformContext}`,
        `Buyer item notes: ${notes || "No additional notes provided."}`,
        "Guided Buyer Intake:",
        buyerIntakeText,
        `Visual recognition report: ${JSON.stringify(identity.visualRecognition || {})}`,
        `Extracted item identity: ${JSON.stringify(identity)}`,
        `Backend source route: ${JSON.stringify(sourceRoute)}`,
        `Backend search queries: ${JSON.stringify(searchQueries)}`,
        `Live comparable search result: ${JSON.stringify(liveSearch)}`,
        "",
        ...taskText
      ].join("\n")
    }
  ];

  const payload = createResponsesPayload({
    model,
    systemText: "You are Listing Engine, a buyer-first market intelligence assistant. Help shoppers, collectors, and resellers decide whether to buy an item right now. Return only the requested structured JSON.",
    userContent,
    schemaName: "market_value_report",
    schema: valuationSchema
  });

  return (await requestOpenAIJson({ apiKey, payload })).json;
}

function createResponsesPayload({ model, systemText, userContent, schemaName, schema }) {
  return {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: systemText
          }
        ]
      },
      {
        role: "user",
        content: userContent
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        schema,
        strict: true
      }
    }
  };
}

async function requestOpenAIJson({ apiKey, payload }) {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 90000);

  try {
    let response;
    try {
      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } catch (error) {
      throw createOpenAIRequestError({
        message: timedOut ? "OpenAI request timed out." : error.message || "OpenAI API request failed.",
        category: timedOut || error.name === "AbortError" ? "timeout" : "provider_error",
        timedOut: timedOut || error.name === "AbortError",
        cause: error
      });
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error && data.error.message ? data.error.message : "OpenAI API request failed.";
      throw createOpenAIRequestError({
        statusCode: response.status,
        type: data.error && data.error.type,
        code: data.error && data.error.code,
        message,
        category: classifyOpenAIErrorDetails({
          statusCode: response.status,
          type: data.error && data.error.type,
          code: data.error && data.error.code,
          message
        })
      });
    }

    const outputText = extractOutputText(data);
    if (!outputText) {
      throw new Error("OpenAI returned an empty response.");
    }

    return {
      json: JSON.parse(outputText),
      data,
      statusCode: response.status
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeIdentity(identity) {
  const visualRecognition = normalizeVisualRecognition(identity.visualRecognition || {});
  const normalized = {
    visualRecognition,
    visualSubject: firstKnown(identity.visualSubject, visualRecognition.visualSubject, identity.subjectIdentity),
    visualSubjectCategory: firstKnown(identity.visualSubjectCategory, visualRecognition.visualSubjectCategory, identity.category),
    visualSubjectConfidence: normalizeIdentityConfidence(firstKnown(identity.visualSubjectConfidence, visualRecognition.visualSubjectConfidence, identity.subjectConfidence)),
    recognizedOrganization: firstKnown(identity.recognizedOrganization, visualRecognition.recognizedOrganization, identity.schoolName, identity.teamName),
    recognizedBrand: firstKnown(identity.recognizedBrand, visualRecognition.recognizedBrand, identity.brand, identity.brandSeries),
    recognizedCharacter: firstKnown(identity.recognizedCharacter, visualRecognition.recognizedCharacter, identity.mascot),
    recognizedInstitution: firstKnown(identity.recognizedInstitution, visualRecognition.recognizedInstitution, identity.schoolName),
    recognizedTheme: firstKnown(identity.recognizedTheme, visualRecognition.recognizedTheme),
    brand: cleanText(identity.brand || "Unknown") || "Unknown",
    manufacturer: cleanText(identity.manufacturer || "Unknown") || "Unknown",
    teamName: cleanText(identity.teamName || "Unknown") || "Unknown",
    schoolName: cleanText(identity.schoolName || "Unknown") || "Unknown",
    mascot: cleanText(identity.mascot || "Unknown") || "Unknown",
    licensingStickerText: cleanText(identity.licensingStickerText || "Unknown") || "Unknown",
    model: cleanText(identity.model || "Unknown") || "Unknown",
    sku: cleanText(identity.sku || "Unknown") || "Unknown",
    upcBarcode: cleanText(identity.upcBarcode || "Unknown") || "Unknown",
    styleNumber: cleanText(identity.styleNumber || "Unknown") || "Unknown",
    size: cleanText(identity.size || "Unknown") || "Unknown",
    color: cleanText(identity.color || "Unknown") || "Unknown",
    material: cleanText(identity.material || "Unknown") || "Unknown",
    dimensions: cleanText(identity.dimensions || "Unknown") || "Unknown",
    copyrightWording: cleanText(identity.copyrightWording || "Unknown") || "Unknown",
    year: cleanText(identity.year || "Unknown") || "Unknown",
    missingComponentStatus: cleanText(identity.missingComponentStatus || "Unknown") || "Unknown",
    condition: cleanText(identity.condition || "Unknown") || "Unknown",
    currentAskingPrice: cleanText(identity.currentAskingPrice || "Unknown") || "Unknown",
    category: cleanText(identity.category || "Unknown") || "Unknown",
    subjectIdentity: cleanText(identity.subjectIdentity || "Unknown") || "Unknown",
    subjectConfidence: normalizeIdentityConfidence(identity.subjectConfidence || "Unclear"),
    userProvidedIdentity: cleanText(identity.userProvidedIdentity || "Unknown") || "Unknown",
    visualIdentityEvidence: normalizeStringArray(identity.visualIdentityEvidence, 8),
    textIdentityEvidence: normalizeStringArray(identity.textIdentityEvidence, 8),
    exactProductIdentity: cleanText(identity.exactProductIdentity || "Unknown") || "Unknown",
    exactProductConfidence: normalizeIdentityConfidence(identity.exactProductConfidence || "Unclear"),
    makerIdentity: cleanText(identity.makerIdentity || "Unknown") || "Unknown",
    makerConfidence: normalizeIdentityConfidence(identity.makerConfidence || "Unclear"),
    modelOrItemNumber: cleanText(identity.modelOrItemNumber || "Unknown") || "Unknown",
    eraEstimate: cleanText(identity.eraEstimate || "Unknown") || "Unknown",
    eraConfidence: normalizeIdentityConfidence(identity.eraConfidence || "Unclear"),
    licensingStatus: cleanText(identity.licensingStatus || "Not verified") || "Not verified",
    authenticityStatus: cleanText(identity.authenticityStatus || "Not verified") || "Not verified",
    exactComparableStatus: cleanText(identity.exactComparableStatus || "No exact comparable verified") || "No exact comparable verified",
    productNameOrBoxTitle: cleanText(identity.productNameOrBoxTitle || "Unknown") || "Unknown",
    frontBoxWording: cleanText(identity.frontBoxWording || "Unknown") || "Unknown",
    backLabelWording: cleanText(identity.backLabelWording || "Unknown") || "Unknown",
    manufacturerLocationText: cleanText(identity.manufacturerLocationText || "Unknown") || "Unknown",
    visiblePrice: cleanText(identity.visiblePrice || "Unknown") || "Unknown",
    brandSeries: cleanText(identity.brandSeries || "Unknown") || "Unknown",
    visibleText: normalizeStringArray(identity.visibleText, 10),
    guidedBuyerIntakeSummary: cleanText(identity.guidedBuyerIntakeSummary || "Unknown") || "Unknown",
    identityConflictNotes: normalizeStringArray(identity.identityConflictNotes, 6),
    identityUnknowns: normalizeStringArray(identity.identityUnknowns, 8),
    identitySummary: cleanText(identity.identitySummary || "Unknown") || "Unknown",
    distinctiveVisualDescription: cleanText(identity.distinctiveVisualDescription || "Unknown") || "Unknown",
    likelyItemDescription: cleanText(identity.likelyItemDescription || "Unknown") || "Unknown",
    strongestSearchableIdentifiers: normalizeStringArray(identity.strongestSearchableIdentifiers, 8),
    buyerContext: normalizeStringArray(identity.buyerContext, 8, ["unknown"])
  };

  return reconcileIdentityEvidence(normalized);
}

function normalizeVisualRecognition(value = {}) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    visualSubject: cleanText(source.visualSubject || "Unknown subject") || "Unknown subject",
    visualSubjectCategory: cleanText(source.visualSubjectCategory || "Unknown") || "Unknown",
    visualSubjectConfidence: normalizeIdentityConfidence(source.visualSubjectConfidence || "Unclear"),
    recognizedOrganization: cleanText(source.recognizedOrganization || "Not verified") || "Not verified",
    recognizedBrand: cleanText(source.recognizedBrand || "Not verified") || "Not verified",
    recognizedCharacter: cleanText(source.recognizedCharacter || "Not verified") || "Not verified",
    recognizedInstitution: cleanText(source.recognizedInstitution || "Not verified") || "Not verified",
    recognizedTheme: cleanText(source.recognizedTheme || "Not verified") || "Not verified",
    visibleLogos: normalizeStringArray(source.visibleLogos, 8),
    visibleLetters: normalizeStringArray(source.visibleLetters, 8),
    visibleWords: normalizeStringArray(source.visibleWords, 10),
    visibleColors: normalizeStringArray(source.visibleColors, 8),
    visualStyle: cleanText(source.visualStyle || "Unknown") || "Unknown",
    estimatedEraStyle: cleanText(source.estimatedEraStyle || "Not verified") || "Not verified",
    distinctiveFeatures: normalizeStringArray(source.distinctiveFeatures, 10),
    visualEvidence: normalizeStringArray(source.visualEvidence, 10),
    possibleInterpretations: normalizeStringArray(source.possibleInterpretations, 6),
    visualConflicts: normalizeStringArray(source.visualConflicts, 6),
    stillUnknown: normalizeStringArray(source.stillUnknown, 8),
    userEvidenceReconciliation: cleanText(source.userEvidenceReconciliation || "User input was preserved as evidence and reconciled against visible photo clues.") || "User input was preserved as evidence and reconciled against visible photo clues.",
    visualSummary: cleanText(source.visualSummary || "Visual subject recognition is limited by the submitted photos and notes.") || "Visual subject recognition is limited by the submitted photos and notes."
  };
}

function reconcileIdentityEvidence(identity) {
  const subjectFromTeam = compactWords([
    firstKnown(identity.schoolName, identity.teamName),
    identity.mascot,
    inferSubjectObjectWord(identity)
  ]);
  const subjectCandidate = firstKnown(
    identity.visualSubject,
    identity.subjectIdentity,
    identity.userProvidedIdentity,
    subjectFromTeam,
    identity.productNameOrBoxTitle,
    identity.likelyItemDescription,
    identity.category
  );
  const exactCandidate = firstKnown(
    identity.exactProductIdentity,
    identity.productNameOrBoxTitle,
    identity.model,
    identity.sku,
    identity.upcBarcode,
    identity.styleNumber
  );
  const makerCandidate = firstKnown(identity.makerIdentity, identity.manufacturer, identity.brand, identity.manufacturerLocationText);
  const modelCandidate = firstKnown(identity.modelOrItemNumber, identity.model, identity.sku, identity.upcBarcode, identity.styleNumber);
  const unknowns = [...identity.identityUnknowns];
  const visualRecognition = normalizeVisualRecognition(identity.visualRecognition);
  for (const unknown of visualRecognition.stillUnknown) {
    unknowns.push(unknown);
  }

  if (!hasKnownValue(exactCandidate)) {
    unknowns.push("Exact product identity not verified.");
  }
  if (!hasKnownValue(makerCandidate)) {
    unknowns.push("Maker or manufacturer not verified.");
  }
  if (!hasKnownValue(identity.eraEstimate) && !hasKnownValue(identity.year) && !hasKnownValue(identity.copyrightWording)) {
    unknowns.push("Date or era not verified.");
  }
  if (!hasKnownValue(identity.licensingStatus) || /not verified|unknown/i.test(identity.licensingStatus)) {
    unknowns.push("Licensing status not verified.");
  }
  if (!hasKnownValue(identity.authenticityStatus) || /not verified|unknown/i.test(identity.authenticityStatus)) {
    unknowns.push("Authenticity not verified.");
  }

  const subjectConfidence = strengthenSubjectConfidence({
    current: identity.subjectConfidence,
    identity,
    subjectCandidate
  });
  const exactProductIdentity = hasKnownValue(exactCandidate)
    ? exactCandidate
    : buildUnverifiedExactProductText(identity, subjectCandidate);

  return {
    ...identity,
    visualRecognition,
    visualSubject: firstKnown(identity.visualSubject, visualRecognition.visualSubject, subjectCandidate) || "Unknown subject",
    visualSubjectCategory: firstKnown(identity.visualSubjectCategory, visualRecognition.visualSubjectCategory, identity.category) || "Unknown",
    visualSubjectConfidence: normalizeIdentityConfidence(firstKnown(identity.visualSubjectConfidence, visualRecognition.visualSubjectConfidence, subjectConfidence)),
    recognizedOrganization: firstKnown(identity.recognizedOrganization, visualRecognition.recognizedOrganization, identity.schoolName, identity.teamName) || "Not verified",
    recognizedBrand: firstKnown(identity.recognizedBrand, visualRecognition.recognizedBrand, identity.brand, identity.brandSeries) || "Not verified",
    recognizedCharacter: firstKnown(identity.recognizedCharacter, visualRecognition.recognizedCharacter, identity.mascot) || "Not verified",
    recognizedInstitution: firstKnown(identity.recognizedInstitution, visualRecognition.recognizedInstitution, identity.schoolName) || "Not verified",
    recognizedTheme: firstKnown(identity.recognizedTheme, visualRecognition.recognizedTheme) || "Not verified",
    subjectIdentity: subjectCandidate || "Unknown subject",
    subjectConfidence,
    exactProductIdentity,
    exactProductConfidence: normalizeIdentityConfidence(identity.exactProductConfidence || (hasKnownValue(exactCandidate) ? "Plausible" : "Low - exact item not verified")),
    makerIdentity: hasKnownValue(makerCandidate) ? makerCandidate : "Not verified",
    makerConfidence: normalizeIdentityConfidence(identity.makerConfidence || (hasKnownValue(makerCandidate) ? "Plausible" : "Low - maker not verified")),
    modelOrItemNumber: hasKnownValue(modelCandidate) ? modelCandidate : "Not verified",
    eraEstimate: firstKnown(identity.eraEstimate, identity.year, identity.copyrightWording) || "Not verified",
    eraConfidence: normalizeIdentityConfidence(identity.eraConfidence || "Low - era not verified"),
    licensingStatus: hasKnownValue(identity.licensingStatus) ? identity.licensingStatus : "Not verified",
    authenticityStatus: hasKnownValue(identity.authenticityStatus) ? identity.authenticityStatus : "Not verified",
    exactComparableStatus: hasKnownValue(identity.exactComparableStatus) ? identity.exactComparableStatus : "No exact comparable verified",
    identityUnknowns: [...new Set(unknowns.map(cleanText).filter(Boolean))].slice(0, 8),
    identitySummary: buildIdentitySummaryText({
      subjectIdentity: subjectCandidate,
      subjectConfidence,
      exactProductIdentity,
      makerIdentity: hasKnownValue(makerCandidate) ? makerCandidate : "Not verified",
      licensingStatus: identity.licensingStatus,
      authenticityStatus: identity.authenticityStatus
    })
  };
}

function normalizeIdentityConfidence(value) {
  const text = cleanText(value);
  if (!text) {
    return "Unclear";
  }
  if (/high|confirmed|strong/i.test(text)) {
    return text.includes("-") ? text : `${text} - supported by available subject evidence.`;
  }
  if (/medium|likely|plausible/i.test(text)) {
    return text.includes("-") ? text : `${text} - plausible but still needs verification.`;
  }
  if (/low|unclear|insufficient|not verified|conflict/i.test(text)) {
    return text.includes("-") ? text : `${text} - limited evidence.`;
  }
  return text;
}

function strengthenSubjectConfidence({ current, identity, subjectCandidate }) {
  const currentText = normalizeIdentityConfidence(current);
  const userProvided = firstKnown(identity.userProvidedIdentity, identity.guidedBuyerIntakeSummary, identity.likelyItemDescription);
  const visualEvidence = normalizeStringArray(identity.visualIdentityEvidence, 8).join(" ");
  const textEvidence = normalizeStringArray(identity.textIdentityEvidence, 8).join(" ");
  const conflictText = normalizeStringArray(identity.identityConflictNotes, 6).join(" ");
  const hasConflict = /conflict|inconsistent|different|mismatch/i.test(conflictText);
  const hasSubject = hasKnownValue(subjectCandidate);
  const subjectToken = mostDistinctiveProductWord(subjectCandidate);
  const visualSupports = hasSubject && subjectToken && new RegExp(escapeRegExp(subjectToken), "i").test([visualEvidence, textEvidence, userProvided].join(" "));

  if (hasConflict) {
    return "Low - conflicting evidence must be resolved before subject identity is trusted.";
  }

  if (hasSubject && userProvided && (visualSupports || /likely|high|strong|confirmed/i.test(currentText))) {
    return "High - user-provided identity is consistent with available visual or text evidence.";
  }

  if (hasSubject && userProvided) {
    return "Plausible - user-provided identity is preserved as a clue, but stronger visual or text confirmation is needed.";
  }

  if (hasSubject && /high|strong|likely|plausible|medium/i.test(currentText)) {
    return currentText;
  }

  return hasSubject ? "Plausible - broad subject is the strongest available identity, but exact verification is incomplete." : "Unclear - subject identity needs stronger visual, text, or user-provided evidence.";
}

function buildUnverifiedExactProductText(identity, subjectIdentity) {
  const category = firstKnown(identity.category, inferSubjectObjectWord(identity), "item");
  const subject = firstKnown(subjectIdentity, identity.userProvidedIdentity, identity.likelyItemDescription);
  if (subject) {
    return `Unverified exact product - likely ${subject}; exact item, maker, date, and licensing are not confirmed.`;
  }
  return `Unverified exact product - likely ${category}; exact item, maker, date, and licensing are not confirmed.`;
}

function buildIdentitySummaryText({ subjectIdentity, subjectConfidence, exactProductIdentity, makerIdentity, licensingStatus, authenticityStatus }) {
  return [
    `Subject Identity: ${subjectIdentity || "Unknown"}`,
    `Subject Confidence: ${subjectConfidence || "Unclear"}`,
    `Exact Product Identity: ${exactProductIdentity || "Not verified"}`,
    `Maker / Manufacturer: ${makerIdentity || "Not verified"}`,
    `Licensing / Authenticity: ${cleanText(licensingStatus || "Not verified")} / ${cleanText(authenticityStatus || "Not verified")}`
  ].join(" | ");
}

function inferSubjectObjectWord(identity) {
  const text = [
    identity.category,
    identity.likelyItemDescription,
    identity.productNameOrBoxTitle,
    identity.distinctiveVisualDescription,
    identity.userProvidedIdentity
  ].join(" ").toLowerCase();

  if (/mascot|logo|team|school|university|college|athletics|character/.test(text)) {
    if (/image|print|picture|poster|art|artwork|plaque|sign|decal|sticker/.test(text)) {
      return "mascot image";
    }
    return "mascot collectible";
  }
  if (/poster|print|picture|image|art|artwork/.test(text)) {
    return "image";
  }
  if (/sign|plaque/.test(text)) {
    return "sign or plaque";
  }
  return "";
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeBuyerIntake(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const intake = {};

  for (const field of buyerIntakeStringFields) {
    intake[field] = cleanText(source[field]);
  }

  intake.condition_concerns = normalizeConditionConcerns(source.condition_concerns);
  intake.parsed_asking_price = parseAskingPrice(intake.asking_price);

  return intake;
}

function normalizeConditionConcerns(value) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return [
    ...new Set(
      items
        .map((item) => cleanText(item))
        .filter((item) => allowedConditionConcerns.has(item))
    )
  ];
}

function parseAskingPrice(value) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }

  const match = text.match(/(?:^|[^\d])(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)(?:[^\d]|$)/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatBuyerIntakeForPrompt(buyerIntake) {
  const intake = buyerIntake || normalizeBuyerIntake({});
  const parsedPrice = intake.parsed_asking_price === null ? "null" : String(intake.parsed_asking_price);
  return [
    `purchase_context: ${intake.purchase_context || "not provided"}`,
    `asking_price_raw: ${intake.asking_price || "not provided"}`,
    `asking_price_number: ${parsedPrice}`,
    `purchase_intent: ${intake.purchase_intent || "not provided"}`,
    `item_condition: ${intake.item_condition || "not provided"}`,
    `condition_concerns: ${intake.condition_concerns.length ? intake.condition_concerns.join(", ") : "none provided"}`,
    `item_name: ${intake.item_name || "not provided"}`,
    `known_brand: ${intake.known_brand || "not provided"}`,
    `known_manufacturer: ${intake.known_manufacturer || "not provided"}`,
    `known_model: ${intake.known_model || "not provided"}`,
    `known_sku: ${intake.known_sku || "not provided"}`,
    `known_upc: ${intake.known_upc || "not provided"}`,
    `approximate_age_era: ${intake.approximate_age_era || "not provided"}`,
    `buyer_notes: ${intake.buyer_notes || "not provided"}`
  ].join("\n");
}

function routeMarketSources(identity, buyerIntake = normalizeBuyerIntake({}), platform = "") {
  const route = [];
  const purchaseContext = cleanText(buyerIntake.purchase_context);
  const purchaseIntent = cleanText(buyerIntake.purchase_intent);
  const selectedPlatform = cleanText(platform);
  const itemCondition = cleanText(buyerIntake.item_condition);
  const conditionConcerns = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns.join(" ") : "";
  const haystack = [
    selectedPlatform,
    purchaseContext,
    purchaseIntent,
    itemCondition,
    conditionConcerns,
    buyerIntake.item_name,
    buyerIntake.known_brand,
    buyerIntake.known_manufacturer,
    buyerIntake.known_model,
    buyerIntake.known_sku,
    buyerIntake.known_upc,
    buyerIntake.approximate_age_era,
    buyerIntake.asking_price,
    identity.visualSubject,
    identity.visualSubjectCategory,
    identity.visualSubjectConfidence,
    identity.recognizedOrganization,
    identity.recognizedBrand,
    identity.recognizedCharacter,
    identity.recognizedInstitution,
    identity.recognizedTheme,
    identity.visualRecognition?.visualStyle,
    identity.visualRecognition?.estimatedEraStyle,
    Array.isArray(identity.visualRecognition?.visibleLogos) ? identity.visualRecognition.visibleLogos.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visibleLetters) ? identity.visualRecognition.visibleLetters.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visibleWords) ? identity.visualRecognition.visibleWords.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visibleColors) ? identity.visualRecognition.visibleColors.join(" ") : "",
    Array.isArray(identity.visualRecognition?.distinctiveFeatures) ? identity.visualRecognition.distinctiveFeatures.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visualEvidence) ? identity.visualRecognition.visualEvidence.join(" ") : "",
    Array.isArray(identity.visualRecognition?.possibleInterpretations) ? identity.visualRecognition.possibleInterpretations.join(" ") : "",
    identity.subjectIdentity,
    identity.userProvidedIdentity,
    getVerifiedExactProductIdentity(identity.exactProductIdentity),
    identity.identitySummary,
    identity.category,
    identity.likelyItemDescription,
    identity.brand,
    identity.manufacturer,
    identity.teamName,
    identity.schoolName,
    identity.mascot,
    identity.licensingStickerText,
    identity.model,
    identity.sku,
    identity.upcBarcode,
    identity.styleNumber,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.manufacturerLocationText,
    identity.brandSeries,
    identity.copyrightWording,
    identity.year,
    identity.dimensions,
    identity.missingComponentStatus,
    Array.isArray(identity.visualIdentityEvidence) ? identity.visualIdentityEvidence.join(" ") : "",
    Array.isArray(identity.textIdentityEvidence) ? identity.textIdentityEvidence.join(" ") : "",
    Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : "",
    identity.distinctiveVisualDescription,
    identity.guidedBuyerIntakeSummary,
    identity.identityConflictNotes.join(" "),
    identity.buyerContext.join(" ")
  ].join(" ").toLowerCase();

  const hasIdentifier = hasKnownValue(identity.upcBarcode) || hasKnownValue(identity.model) || hasKnownValue(identity.sku) || hasKnownValue(identity.styleNumber);
  const hasKnownIntakeIdentifier = hasKnownValue(buyerIntake.known_upc) || hasKnownValue(buyerIntake.known_model) || hasKnownValue(buyerIntake.known_sku);
  const hasResaleIntent = isResaleIntent(purchaseIntent);
  const isSeasonalDecor = /santa|christmas|holiday|seasonal|workshop|hubbard|figurine|boxed|box|resin|ceramic.*figure|decor/.test(haystack);
  const isApparel = /apparel|fashion|dress|shirt|jacket|shoe|pants|skirt|size|style/.test(haystack);
  const isElectronics = /electronics|computer|laptop|tablet|phone|model|processor|battery|charger|refurb/.test(haystack);
  const isFurniture = /furniture|sofa|chair|table|dresser|cabinet|local pickup|facebook marketplace|craigslist|offerup|bulky/.test(haystack);
  const isVisualReferenceSubject = /artwork|illustration|painting|print|poster|sign|plaque|decal|sticker|advertising|logo|mascot|character|institution|organization|university|government|corporation|historical graphic|retired logo|alternate logo|political memorabilia|military insignia|vintage graphic|vintage packaging/.test(haystack);
  const isOrganizationCollectible = /institution|organization|university|college|government|corporation|brand|officially licensed|license|licensing|team|school|mascot|logo|character|athletics|sports logo|school colors/.test(haystack);
  const isCookieJarOrContainer = /cookie jar|container|canister|lid|lidded|ceramic jar|collectible jar/.test(haystack);
  const isVintageCollectible = /vintage|collectible|ceramic|canister|cookie jar|container|holiday|santa|christmas|discontinued|antique|decor|resale|secondhand|mercari|etsy|collegiate|mascot|licensed/.test(haystack);
  const isRetailContext = /^(retail_store|mall)$/.test(purchaseContext);
  const isSecondhandContext = /^(consignment_store|thrift_store|flea_market|estate_sale|antique_mall)$/.test(purchaseContext);
  const isLocalPrivateContext = /^(facebook_marketplace|private_seller)$/.test(purchaseContext);
  const isOnlineContext = purchaseContext === "online_marketplace";
  const isLocalResalePlatform = hasResaleIntent && /facebook marketplace|craigslist|offerup|local/.test(selectedPlatform.toLowerCase());
  const isRetailCurrent = isRetailContext || hasIdentifier || hasKnownIntakeIdentifier || /retail|current|new with tags|brand site|manufacturer|upc|sku|barcode/.test(haystack);

  if (isLocalPrivateContext || isLocalResalePlatform || isFurniture) {
    route.push("Facebook Marketplace-style local value logic", "Craigslist / OfferUp / local pickup resale", "local consignment logic");
    if (isElectronics) {
      route.push("electronics model-number sources for better-price checks");
    }
    if (isVintageCollectible || isSeasonalDecor || isOrganizationCollectible || isCookieJarOrContainer) {
      route.push(
        "exact label/stamp searches",
        "eBay-style resale results",
        "Etsy-style vintage results",
        "Mercari-style resale results",
        "collector/reference/brand clue results",
        "team/school/mascot/licensee searches",
        "Google-style exact phrase results"
      );
    }
    return route;
  }

  if ((isSecondhandContext || hasResaleIntent) && (isSeasonalDecor || isVintageCollectible || isOrganizationCollectible || isCookieJarOrContainer || !isRetailCurrent)) {
    route.push("secondhand resale results", "vintage and collector sources", "specialty reference sources", "exact-label web results");
    if (isSeasonalDecor || isVintageCollectible || isOrganizationCollectible || isCookieJarOrContainer) {
      route.push(
        "exact label/stamp searches",
        "eBay-style resale results",
        "Etsy-style vintage results",
        "Mercari-style resale results",
        "WorthPoint-style reference clues where accessible",
        "team/school/mascot/licensee searches",
        "Google-style exact phrase results"
      );
    }
    return route;
  }

  if (isVisualReferenceSubject && !isRetailCurrent) {
    route.push("visual subject reference searches", "historical/reference sources", "logo/mascot/artwork reference sources", "general web image/reference results", "resale marketplaces only after subject reference");
    if (isVintageCollectible || isOrganizationCollectible) {
      route.push("collector/reference clues", "exact phrase visual subject searches");
    }
    return route;
  }

  if (isSeasonalDecor || isVintageCollectible || isOrganizationCollectible || isCookieJarOrContainer) {
    route.push("exact label/stamp searches", "eBay-style resale results", "Etsy-style vintage results", "Mercari-style resale results", "collector/reference/brand clue results", "team/school/mascot/licensee searches", "general web results using exact label text");
    return route;
  }

  if (isElectronics) {
    route.push("manufacturer site", "major retailers", "refurbished listings", "Amazon / Best Buy / Walmart / Newegg-style sources", "eBay used/refurbished secondary signal");
    return route;
  }

  if (isApparel) {
    route.push("brand site", "retailer sites", "Google Shopping-style web results", "Poshmark or resale fashion sites");
    if (/resale|secondhand|used|vintage|collectible/.test(haystack)) {
      route.push("eBay used/resale secondary signal");
    }
    return route;
  }

  if (isRetailCurrent) {
    route.push("brand/manufacturer site", "retailer sites", "Google Shopping-style web results", "Amazon/major retail when relevant");
    if (/used|refurbished|resale|secondhand/.test(haystack) || isOnlineContext) {
      route.push("eBay used/refurbished secondary signal");
    }
    return route;
  }

  route.push("broad web search", "Google Shopping-style web results if retail-like", "local resale signals if local or bulky", "collector/reference sites if vintage or unusual");
  return route;
}

function buildLiveSearchQueries(identity, sourceRoute, notes, buyerIntake = normalizeBuyerIntake({})) {
  const routeText = sourceRoute.join(" ").toLowerCase();
  const notesText = cleanText([notes, buyerIntake.buyer_notes].filter(Boolean).join(" "));
  const visualRecognition = normalizeVisualRecognition(identity.visualRecognition || {});
  const visualSubject = firstKnown(identity.visualSubject, visualRecognition.visualSubject, identity.subjectIdentity, identity.userProvidedIdentity);
  const visualCategory = firstKnown(identity.visualSubjectCategory, visualRecognition.visualSubjectCategory, identity.category);
  const visualOrganization = firstKnown(identity.recognizedOrganization, visualRecognition.recognizedOrganization, identity.recognizedInstitution, visualRecognition.recognizedInstitution, identity.schoolName, identity.teamName);
  const visualBrand = firstKnown(identity.recognizedBrand, visualRecognition.recognizedBrand, identity.brandSeries, identity.brand);
  const visualCharacter = firstKnown(identity.recognizedCharacter, visualRecognition.recognizedCharacter, identity.mascot);
  const visibleLetters = normalizeStringArray(visualRecognition.visibleLetters, 8).join(" ");
  const visibleWords = normalizeStringArray(visualRecognition.visibleWords, 10).join(" ");
  const visualFeatures = normalizeStringArray(visualRecognition.distinctiveFeatures, 6).join(" ");
  const visualStyle = firstKnown(visualRecognition.visualStyle, visualRecognition.estimatedEraStyle);
  const subjectIdentity = firstKnown(visualSubject, identity.subjectIdentity, identity.userProvidedIdentity);
  const exactProductIdentity = getVerifiedExactProductIdentity(identity.exactProductIdentity);
  const productTitle = firstKnown(buyerIntake.item_name, identity.productNameOrBoxTitle, exactProductIdentity, subjectIdentity, identity.likelyItemDescription, notesText.slice(0, 120));
  const brand = firstKnown(buyerIntake.known_brand, visualBrand, identity.brandSeries, identity.brand, buyerIntake.known_manufacturer, identity.manufacturer);
  const manufacturer = firstKnown(buyerIntake.known_manufacturer, identity.manufacturer);
  const teamName = firstKnown(identity.teamName);
  const schoolName = firstKnown(identity.schoolName);
  const mascot = firstKnown(identity.mascot);
  const model = firstKnown(buyerIntake.known_model, identity.model);
  const itemCode = firstKnown(buyerIntake.known_sku, identity.sku, identity.styleNumber);
  const upc = firstKnown(buyerIntake.known_upc, identity.upcBarcode);
  const ageEra = firstKnown(buyerIntake.approximate_age_era);
  const conditionText = firstKnown(buyerIntake.item_condition, identity.condition);
  const concernText = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns.join(" ") : "";
  const locationText = firstKnown(identity.manufacturerLocationText);
  const licensingText = firstKnown(identity.licensingStickerText);
  const labelText = compactWords([identity.frontBoxWording, identity.backLabelWording, identity.licensingStickerText, identity.copyrightWording, Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : ""]);
  const visualPhrase = buildVisualPhrase(identity, notesText);
  const categoryPhrase = buildCategoryPhrase(identity, routeText, notesText);
  const subjectPhrase = compactWords([subjectIdentity, categoryPhrase]);
  const price = buyerIntake.parsed_asking_price === null ? extractPrice(identity.currentAskingPrice) || extractPrice(notesText) : String(buyerIntake.parsed_asking_price);
  const queries = [];
  const seasonalDecor = isSeasonalDecorIdentity(identity, routeText, notesText);
  const organizationCollectible = isOrganizationCollectibleIdentity(identity, routeText, notesText);
  const visualReferenceSubject = /visual subject reference|historical\/reference|logo\/mascot\/artwork|image\/reference|artwork|illustration|logo|mascot|advertising|poster|sign|plaque|print|political|military|insignia|vintage graphic/.test(routeText);

  if (visualSubject) {
    queries.push(compactWords([visualSubject, visualCategory]));
  }
  if (visualOrganization || visualCharacter || visibleLetters || visibleWords) {
    queries.push(compactWords([visualOrganization || visualBrand, visualCharacter, visibleLetters, visibleWords, visualCategory]));
  }
  if (visualReferenceSubject) {
    queries.push(compactWords([visualSubject, visualStyle, "reference"]));
    queries.push(compactWords([visualOrganization || visualBrand, visualCharacter, "vintage artwork logo mascot"]));
    queries.push(compactWords([visibleWords || visibleLetters, visualFeatures, "historical image"]));
  }

  if (upc) {
    queries.push(upc);
    queries.push(compactWords([upc, brand || manufacturer || productTitle]));
  }

  if (organizationCollectible) {
    queries.push(compactWords([subjectIdentity, "vintage mascot image"]));
    queries.push(compactWords([schoolName || teamName, mascot, "vintage mascot image"]));
    queries.push(compactWords([schoolName || teamName, mascot, "artwork print poster plaque"]));
    queries.push(compactWords([schoolName || teamName, mascot, "collectible"]));
    queries.push(compactWords([schoolName || teamName, mascot, productTitle, "collectible"]));
    queries.push(compactWords([schoolName || teamName, mascot, "logo vintage"]));
    queries.push(compactWords([manufacturer, schoolName || teamName, mascot]));
    queries.push(compactWords([labelText, itemCode || model || ageEra]));
    queries.push(compactWords([licensingText, schoolName || teamName, mascot]));
    queries.push(compactWords([schoolName || teamName, mascot, identity.material, identity.missingComponentStatus]));
  } else if (seasonalDecor) {
    queries.push(compactWords([brand, locationText, itemCode]));
    queries.push(compactWords([brand, itemCode, "Santa"]));
    queries.push(compactWords([upc, brand || manufacturer]));
    queries.push(compactWords([brand, productTitle]));
    queries.push(compactWords(["boxed Santa Claus holiday figurine", itemCode]));
    queries.push(compactWords([brand, locationText, "Christmas decoration"]));
    queries.push(compactWords([labelText, itemCode]));
  } else {
    if (model) {
      queries.push(compactWords([brand || manufacturer, model]));
    }

    if (itemCode) {
      queries.push(compactWords([itemCode, mostDistinctiveCategoryWord(identity.category || categoryPhrase)]));
    }

    if (model) {
      queries.push(compactWords([brand, model, extractSpecs(notesText), "price"]));
    }

    if (manufacturer && productTitle) {
      queries.push(compactWords([manufacturer, productTitle]));
    }

    if (labelText) {
      queries.push(labelText);
    }

    queries.push(compactWords([brand, productTitle]));
    queries.push(subjectPhrase);
    queries.push(visualPhrase);

    if (price && /holiday|collectible|vintage|decor|ceramic|apparel|fashion|resale|secondhand/.test(routeText)) {
      queries.push(compactWords([price, mostDistinctiveProductWord(productTitle), mostDistinctiveCategoryWord(identity.category || categoryPhrase), conditionText, concernText]));
    }

    if (ageEra) {
      queries.push(compactWords([ageEra, brand || manufacturer, mostDistinctiveProductWord(productTitle)]));
    }

    queries.push(categoryPhrase);
  }

  const diverseQueries = [];
  for (const query of queries.map(cleanSearchQuery).filter(Boolean)) {
    if (!isRepetitiveQuery(query, diverseQueries)) {
      diverseQueries.push(query);
    }
  }

  return diverseQueries.slice(0, seasonalDecor || organizationCollectible || visualReferenceSubject ? 7 : 5);
}

function normalizeLiveSearchResult({ result, responseData, searchStartedAt, sourceRoute, searchQueries, elapsedMs, statusCode, includeSourcesRequested, includeFallbackReason }) {
  const citations = collectUrlCitations(responseData);
  const webSearchCalls = collectWebSearchCalls(responseData);
  const sourcesSearched = collectWebSearchSources(responseData);
  const webSearchExecuted = webSearchCalls.length > 0;
  const rawItems = normalizeStringArray(result.comparableItemsFound, 6);
  const comparableItemsFound = rawItems.filter((item) => hasCitedUrl(item, citations) && !isRejectedWeakComparableItem(item));
  let liveSearchStatus = "Live Search Unavailable - AI Reasoning Only";

  if (webSearchExecuted && comparableItemsFound.length) {
    liveSearchStatus = "Live Search Completed - Source-Backed Comps Found";
  } else if (webSearchExecuted) {
    liveSearchStatus = "Live Search Completed - No Reliable Comps Found";
  }

  return {
    liveSearchStatus,
    comparableItemsFound,
    noReliableMatchesReason: liveSearchStatus === "Live Search Completed - Source-Backed Comps Found"
      ? ""
      : "Live search completed, but no reliable source-backed exact or strong similar matches were found.",
    searchEvidenceSummary: cleanText(result.searchEvidenceSummary || ""),
    sourceRoute,
    searchQueries,
    sourcesTargeted: buildSourcesTargeted(sourceRoute),
    sourcesSearched,
    sourcesReturned: summarizeSourceLabels(citations.map((citation) => sourceLabelFromCitation(citation)).filter(Boolean)),
    searchStartedAt,
    searchCompletedAt: new Date().toISOString(),
    webSearchExecuted,
    citations,
    diagnostics: {
      openAIStatusCode: statusCode || null,
      openAIErrorType: "",
      openAIErrorCode: "",
      openAIErrorMessage: "",
      elapsedMilliseconds: elapsedMs,
      timedOut: false,
      webSearchCallAppeared: webSearchExecuted,
      urlCitationCount: citations.length,
      sourceBackedCompCount: comparableItemsFound.length,
      finalLiveSearchStatus: liveSearchStatus,
      includeSourcesRequested,
      includeFallbackReason
    }
  };
}

function buildUnavailableLiveSearchResult({ error, sourceRoute, searchQueries, searchStartedAt, elapsedMs, includeSourcesRequested, includeFallbackReason }) {
  const diagnostic = classifyLiveSearchError(error);
  const liveSearchStatus = statusForLiveSearchError(diagnostic.category);

  return {
    liveSearchStatus,
    comparableItemsFound: [],
    noReliableMatchesReason: "Live search did not complete, so source-backed comps could not be retrieved.",
    searchEvidenceSummary: diagnostic.userMessage,
    sourceRoute,
    searchQueries,
    sourcesTargeted: buildSourcesTargeted(sourceRoute),
    sourcesSearched: [],
    sourcesReturned: [],
    searchStartedAt,
    searchCompletedAt: new Date().toISOString(),
    webSearchExecuted: false,
    citations: [],
    diagnostics: {
      openAIStatusCode: diagnostic.statusCode,
      openAIErrorType: diagnostic.type,
      openAIErrorCode: diagnostic.code,
      openAIErrorMessage: diagnostic.message,
      elapsedMilliseconds: elapsedMs,
      timedOut: diagnostic.category === "timeout",
      webSearchCallAppeared: false,
      urlCitationCount: 0,
      sourceBackedCompCount: 0,
      finalLiveSearchStatus: liveSearchStatus,
      errorCategory: diagnostic.category,
      includeSourcesRequested,
      includeFallbackReason
    }
  };
}

function enforceListingResearchHonesty(report, research, platform) {
  const { identity, liveSearch } = research;
  const sourceBackedCompsFound = liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found";
  const comparableItemsFound = sourceBackedCompsFound ? liveSearch.comparableItemsFound : [];
  const { hasReliableMatch } = splitComparableItems(comparableItemsFound);
  const reliableResearchFound = sourceBackedCompsFound && hasReliableMatch;
  const listingBasis = reliableResearchFound
    ? "Pricing uses source-backed live research results that passed comparable filtering."
    : liveSearch.webSearchExecuted
      ? "Live research completed, but no source-backed exact or strong similar comps passed filtering. Pricing is a cautious estimate, not evidence-backed fact."
      : "Live research did not complete. Pricing is a cautious estimate, not evidence-backed fact.";
  const title = cleanText(report.optimizedListingTitle || report.title || buildIdentifiedItem(identity));
  const description = cleanText(report.listingDescription || report.description || "Description should be completed after verifying the item details and condition.");
  const itemSpecifics = normalizeFlexibleArray(report.itemSpecifics, 10, normalizeFlexibleArray(report.itemDetails, 10, buildPhotoEvidence(identity)));
  const conditionNotes = normalizeFlexibleArray(report.conditionNotes, 8, buildConditionNotes(identity));
  const visualFields = buildVisualRecognitionReportFields(identity);
  const identityFields = buildIdentityReportFields(identity, liveSearch);

  return {
    ...report,
    platform,
    categorySuggestion: cleanText(report.categorySuggestion || identity.category || "Uncategorized"),
    identifiedItem: cleanText(report.identifiedItem || buildIdentifiedItem(identity)),
    identificationConfidence: ensureConfidenceLayer(report.identificationConfidence, "Medium", "Identification is based on photo evidence, visible text, seller notes, and source-routing results."),
    ...visualFields,
    ...identityFields,
    evidenceFoundInPhotos: buildPhotoEvidence(identity),
    searchQueriesUsed: buildListingSearchQueriesUsed(liveSearch),
    sourcesSearched: buildSearchCoverage(liveSearch),
    researchResults: buildListingResearchResults(liveSearch, comparableItemsFound),
    comparableQuality: buildListingComparableQuality(liveSearch, comparableItemsFound),
    recommendedListingPrice: buildListingPriceText(report.recommendedListingPrice, reliableResearchFound),
    suggestedOfferRange: buildListingOfferRange(report.suggestedOfferRange, reliableResearchFound),
    pricingConfidence: reliableResearchFound
      ? ensureConfidenceLayer(report.pricingConfidence, "Medium", "Source-backed research exists, but final pricing still depends on condition, completeness, platform, and buyer demand.")
      : forceLowConfidence(report.pricingConfidence || "Insufficient - No reliable source-backed exact or strong similar comps are available.", "Listing price support is weak because reliable live research evidence is missing."),
    pricingRationale: ensurePrefix(report.pricingRationale, listingBasis),
    optimizedListingTitle: title,
    listingDescription: description,
    itemSpecifics,
    conditionNotes,
    suggestedSellingPlatform: cleanText(report.suggestedSellingPlatform || platform || "Selected marketplace platform"),
    additionalInformationNeeded: normalizeFlexibleArray(report.additionalInformationNeeded, 8, buildAdditionalInfoNeeded(identity, reliableResearchFound)),
    title,
    description,
    itemDetails: normalizeFlexibleArray(report.itemDetails, 8, itemSpecifics).slice(0, 8),
    priceStrategy: ensurePrefix(report.priceStrategy, listingBasis)
  };
}

function buildListingSearchQueriesUsed(liveSearch) {
  if (!liveSearch.searchQueries || !liveSearch.searchQueries.length) {
    return [];
  }

  const lead = liveSearch.webSearchExecuted
    ? "These are the queries the system used."
    : "These are the queries the system attempted before live research became unavailable.";
  return [lead, ...liveSearch.searchQueries];
}

function buildListingResearchResults(liveSearch, comparableItemsFound) {
  if (comparableItemsFound.length) {
    return comparableItemsFound;
  }

  if (liveSearch.webSearchExecuted) {
    return [
      "Live research completed, but no source-backed exact or strong similar comparables passed filtering.",
      cleanText(liveSearch.noReliableMatchesReason || liveSearch.searchEvidenceSummary || "Weak, generic, conflicting, uncited, or irrelevant results were rejected and were not used as price support.")
    ];
  }

  return [
    `${liveSearch.liveSearchStatus}. Live comparable research was attempted but unavailable before source-backed results could be retrieved.`,
    cleanText(liveSearch.searchEvidenceSummary || "No reliable source-backed research results are available for this listing price.")
  ];
}

function buildListingComparableQuality(liveSearch, comparableItemsFound) {
  if (!comparableItemsFound.length) {
    return [
      liveSearch.webSearchExecuted
        ? "Rejected Match - no returned result had enough cited, relevant evidence to drive listing price."
        : "Rejected Match - live research did not return source-backed comparable evidence."
    ];
  }

  return comparableItemsFound.map((item) => {
    if (/\bexact match\b|\blikely exact\b/i.test(item)) {
      return `Strong Comparable - ${item}`;
    }
    if (/\bstrong similar match\b/i.test(item)) {
      return `Partial Comparable - ${item}`;
    }
    if (/\bweak similar match\b|\bweak match\b/i.test(item)) {
      return `Weak Match - ${item}`;
    }
    return `Identity / Reference Result - ${item}`;
  });
}

function buildListingPriceText(value, reliableResearchFound) {
  const text = cleanText(value || "Price range requires more evidence.");
  if (reliableResearchFound) {
    return text;
  }

  return ensurePrefix(text, "Low-confidence cautious estimate -");
}

function buildListingOfferRange(value, reliableResearchFound) {
  const text = cleanText(value || "Offer range should stay flexible until stronger comparable evidence is available.");
  if (reliableResearchFound) {
    return text;
  }

  return ensurePrefix(text, "Low-confidence offer guidance -");
}

function buildIdentifiedItem(identity) {
  return compactWords([
    identity.visualSubject,
    identity.subjectIdentity,
    getVerifiedExactProductIdentity(identity.exactProductIdentity),
    identity.brandSeries,
    identity.brand,
    identity.manufacturer,
    identity.productNameOrBoxTitle,
    identity.model,
    identity.sku,
    identity.category
  ]) || cleanText(identity.likelyItemDescription || "Item identity needs verification.");
}

function buildPhotoEvidence(identity) {
  const evidence = [];
  const pairs = [
    ["Visual subject", identity.visualSubject],
    ["Visual subject category", identity.visualSubjectCategory],
    ["Visual subject confidence", identity.visualSubjectConfidence],
    ["Recognized organization", identity.recognizedOrganization],
    ["Recognized brand", identity.recognizedBrand],
    ["Recognized character", identity.recognizedCharacter],
    ["Subject identity", identity.subjectIdentity],
    ["Subject confidence", identity.subjectConfidence],
    ["User-provided identity", identity.userProvidedIdentity],
    ["Exact product identity", identity.exactProductIdentity],
    ["Exact product confidence", identity.exactProductConfidence],
    ["Brand", identity.brand],
    ["Brand/series", identity.brandSeries],
    ["Manufacturer", identity.manufacturer],
    ["Manufacturer/location", identity.manufacturerLocationText],
    ["Product or box title", identity.productNameOrBoxTitle],
    ["Model", identity.model],
    ["SKU/item code", identity.sku],
    ["UPC/barcode", identity.upcBarcode],
    ["Style/serial number", identity.styleNumber],
    ["Material", identity.material],
    ["Color/pattern", compactWords([identity.color, identity.pattern])],
    ["Size/dimensions", compactWords([identity.size, identity.dimensions])],
    ["Piece count", identity.pieceCount],
    ["Packaging", identity.packaging],
    ["Condition", identity.condition],
    ["Visible price", identity.visiblePrice],
    ["Maker marks/signature", compactWords([identity.makerMarks, identity.signatureText])],
    ["Date/era", compactWords([identity.dateOrEraClues, identity.copyrightWording])],
    ["Era estimate", identity.eraEstimate],
    ["Licensing status", identity.licensingStatus],
    ["Authenticity status", identity.authenticityStatus],
    ["Exact comparable status", identity.exactComparableStatus],
    ["Distinctive visual features", identity.distinctiveVisualDescription]
  ];

  for (const [label, value] of pairs) {
    if (hasKnownValue(value)) {
      evidence.push(`${label}: ${cleanText(value)}`);
    }
  }

  for (const text of normalizeStringArray(identity.visibleText, 6)) {
    evidence.push(`Visible text: ${text}`);
  }

  for (const text of normalizeStringArray(identity.visualIdentityEvidence, 4)) {
    evidence.push(`Visual identity evidence: ${text}`);
  }

  for (const text of normalizeStringArray(identity.visualRecognition?.visualEvidence, 4)) {
    evidence.push(`Visual recognition evidence: ${text}`);
  }

  for (const text of normalizeStringArray(identity.textIdentityEvidence, 4)) {
    evidence.push(`Text/user identity evidence: ${text}`);
  }

  for (const conflict of normalizeStringArray(identity.identityConflictNotes, 4)) {
    evidence.push(`Identity conflict or uncertainty: ${conflict}`);
  }

  return evidence.slice(0, 12).length ? evidence.slice(0, 12) : ["No strong visible product evidence was extracted. Add closer photos of labels, marks, tags, model numbers, or UPC/barcode details."];
}

function buildConditionNotes(identity) {
  const notes = [];
  for (const value of [identity.condition, identity.wearDamage, identity.missingComponentStatus, identity.packaging]) {
    if (hasKnownValue(value)) {
      notes.push(cleanText(value));
    }
  }
  return notes.length ? notes : ["Condition should be verified from photos and in person before listing."];
}

function buildAdditionalInfoNeeded(identity, reliableResearchFound) {
  const needed = [];
  if (!reliableResearchFound) {
    needed.push("Stronger source-backed comparable evidence before using a confident price.");
  }

  const checks = [
    ["brand or manufacturer", identity.brand, identity.manufacturer],
    ["model, SKU, item number, or UPC/barcode", identity.model, identity.sku, identity.upcBarcode],
    ["exact condition and missing parts", identity.condition, identity.missingComponentStatus],
    ["size, dimensions, material, or piece count", identity.size, identity.dimensions, identity.material, identity.pieceCount],
    ["maker marks, signatures, date, or era clues", identity.makerMarks, identity.signatureText, identity.dateOrEraClues]
  ];

  for (const [label, ...values] of checks) {
    if (!values.some(hasKnownValue)) {
      needed.push(`Clearer ${label}.`);
    }
  }

  return needed.slice(0, 8);
}

function normalizeFlexibleArray(value, maxItems, fallback = []) {
  const items = Array.isArray(value)
    ? value
    : typeof value === "string" && value.trim()
      ? [value]
      : fallback;
  return items.map(cleanText).filter(Boolean).slice(0, maxItems);
}

function enforceLiveSearchHonesty(report, liveSearch, buyerIntake = normalizeBuyerIntake({}), identity = {}, platform = "") {
  const sourceBackedCompsFound = liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found";
  const searchCompleted = liveSearch.webSearchExecuted;
  const comparableItemsFound = sourceBackedCompsFound ? liveSearch.comparableItemsFound : [];
  const { exactItems, similarItems, hasReliableMatch } = splitComparableItems(comparableItemsFound);
  const reliableCompsFound = sourceBackedCompsFound && hasReliableMatch;
  const liveComparableSearchStatus = reliableCompsFound
    ? liveSearch.liveSearchStatus
    : searchCompleted
      ? "Live Search Completed - No Reliable Comps Found"
      : liveSearch.liveSearchStatus;
  const displayedExactItems = reliableCompsFound ? exactItems : [];
  const displayedSimilarItems = reliableCompsFound ? similarItems : [];
  const hasAskingPrice = hasKnownValue(buyerIntake.asking_price);
  const resaleGuidance = buildResalePricingGuidance(report, {
    buyerIntake,
    identity,
    platform,
    sourceRoute: liveSearch.sourceRoute,
    reliableCompsFound
  });
  const liveSearchDidNotComplete = searchCompleted
    ? ""
    : buildLiveSearchDidNotCompleteMessage(liveSearch);
  const noReliableMessage = !searchCompleted || reliableCompsFound
    ? ""
    : "Live search completed, but no reliable source-backed exact or strong similar matches passed match-quality checks. This may mean the item is generic, private-label, seasonal, poorly indexed, or missing strong identifiers. Treat the recommendation as lower-confidence.";
  const basis = reliableCompsFound
    ? "Live comparable search was performed. Source-backed results are listed when reliable matches were found."
    : searchCompleted
      ? "Live comparable search completed with no reliable source-backed exact or strong similar comps. The remaining value range is AI market reasoning only and should be treated as low confidence."
      : "Live comparable search did not complete. The remaining value range is AI market reasoning only and should be treated as low confidence.";
  const aiOnlyRoughValueRange = reliableCompsFound
    ? ""
    : buildAiOnlyRoughValueRange(report);
  const visualFields = buildVisualRecognitionReportFields(identity);
  const identityFields = buildIdentityReportFields(identity, { ...liveSearch, liveSearchStatus: liveComparableSearchStatus });
  const guardedPurchaserDecision = guardBuyerDecision(report.purchaserDecision, {
    reliableCompsFound,
    buyerIntake,
    resaleGuidance
  });
  const buyerRisk = buildBuyerRiskAssessment({
    report,
    buyerIntake,
    identity,
    reliableCompsFound,
    searchCompleted,
    liveComparableSearchStatus,
    resaleGuidance,
    purchaserDecision: guardedPurchaserDecision
  });
  const alignedPurchaserDecision = alignDecisionWithRisk(guardedPurchaserDecision, buyerRisk, buyerIntake);

  return {
    ...report,
    purchaserDecision: alignedPurchaserDecision,
    buyer_risk_score: buyerRisk.score,
    buyer_risk_level: buyerRisk.level,
    buyer_risk_summary: buyerRisk.summary,
    primary_risk_factors: buyerRisk.primaryRiskFactors,
    risk_reduction_actions: buyerRisk.riskReductionActions,
    liveComparableSearchStatus,
    weFoundThisItem: displayedExactItems,
    weFoundSimilarComparableItems: displayedSimilarItems,
    liveSearchDidNotComplete,
    noReliableComparableItemsFound: noReliableMessage,
    searchCoverage: buildSearchCoverage({ ...liveSearch, liveSearchStatus: liveComparableSearchStatus }),
    ...visualFields,
    ...identityFields,
    itemIdentificationConfidence: ensureConfidenceLayer(report.itemIdentificationConfidence, "Medium", "Item identity is based on the submitted photos and notes; verify missing maker, model, tag, condition, or barcode details."),
    liveCompConfidence: reliableCompsFound
      ? ensureConfidenceLayer(report.liveCompConfidence, "Medium", "Source-backed comparable items were found, but match quality still depends on condition and exact item details.")
      : forceLowConfidence(report.liveCompConfidence, "No source-backed exact or strong similar comps are available for this report."),
    valuationConfidence: reliableCompsFound
      ? ensureConfidenceLayer(report.valuationConfidence, "Medium", "Source-backed comps support the estimate, but condition and local demand can still shift value.")
      : forceLowConfidence(report.valuationConfidence, "The value range is AI-only market reasoning because reliable live comps were not available."),
    buyerDecisionConfidence: buildBuyerDecisionConfidence(report.buyerDecisionConfidence, {
      reliableCompsFound,
      hasAskingPrice,
      buyerRisk
    }),
    currentAskingPrice: buildCurrentAskingPrice(buyerIntake, identity),
    suggestedListingPrice: resaleGuidance.suggestedListingPrice,
    expectedSalePrice: resaleGuidance.expectedSalePrice,
    minimumAcceptablePrice: resaleGuidance.minimumAcceptablePrice,
    recommendedSellingPlatform: resaleGuidance.recommendedSellingPlatform,
    expectedSellingTime: resaleGuidance.expectedSellingTime,
    platformSpecificSellingGuidance: resaleGuidance.platformSpecificSellingGuidance,
    itemIdentification: buildItemIdentification(identity),
    currentPriceAssessment: buildCurrentPriceAssessment(report.currentPriceAssessment, {
      buyerIntake,
      reliableCompsFound,
      resaleGuidance
    }),
    priceConfidence: reliableCompsFound
      ? ensureConfidenceLayer(report.priceConfidence, "Medium", "Source-backed comps support pricing direction, but condition and local demand still matter.")
      : forceLowConfidence(report.priceConfidence, "No reliable source-backed comps support the price estimate."),
    aiOnlyRoughValueRange,
    maximumRecommendedBuyPrice: buildMaximumRecommendedBuyPrice(report.maximumRecommendedBuyPrice, {
      buyerIntake,
      reliableCompsFound,
      resaleGuidance
    }),
    resalePotential: buildResalePotential(report.resalePotential, {
      buyerIntake,
      reliableCompsFound,
      resaleGuidance
    }),
    searchQueriesUsed: buildSearchQueriesUsed(liveSearch),
    priceBasis: ensurePrefix(report.priceBasis, basis)
  };
}

function enforceConsumerDecisionHonesty(report, research, buyerIntake = normalizeBuyerIntake({}), platform = "") {
  const { identity = {}, liveSearch = {} } = research;
  const sourceBackedCompsFound = liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found";
  const searchCompleted = Boolean(liveSearch.webSearchExecuted);
  const comparableItemsFound = sourceBackedCompsFound ? normalizeStringArray(liveSearch.comparableItemsFound, 6) : [];
  const { exactItems, similarItems, hasReliableMatch } = splitComparableItems(comparableItemsFound);
  const reliableCompsFound = sourceBackedCompsFound && hasReliableMatch;
  const liveSearchStatus = reliableCompsFound
    ? liveSearch.liveSearchStatus
    : searchCompleted
      ? "Live Search Completed - No Reliable Comps Found"
      : liveSearch.liveSearchStatus;
  const askingPriceNumber = getConsumerAskingPriceNumber(buyerIntake, identity);
  const fairValueNumber = extractConsumerFairValueNumber(report);
  const conditionProfile = getConsumerConditionProfile(buyerIntake, identity);
  const decision = deriveConsumerDecision({
    askingPriceNumber,
    fairValueNumber,
    reliableCompsFound,
    exactItems,
    similarItems,
    conditionProfile,
    buyerIntake,
    identity
  });
  const offer = buildConsumerOffer({
    askingPriceNumber,
    fairValueNumber,
    decision,
    conditionProfile
  });
  const basis = reliableCompsFound
    ? "Pricing uses source-backed comparable or reference results that passed filtering."
    : searchCompleted
      ? "Live research completed, but no source-backed exact or strong similar comps passed filtering. Consumer decision is low confidence."
      : "Live research did not complete. Consumer decision is AI-reasoning-only and low confidence.";
  const researchResults = buildListingResearchResults({ ...liveSearch, liveSearchStatus }, comparableItemsFound);
  const comparableQuality = buildListingComparableQuality({ ...liveSearch, liveSearchStatus }, comparableItemsFound);
  const cautionItems = mergeStringArrays(
    report.reasonsForCaution,
    decision.riskFlags,
    decision.evidenceWarning ? [decision.evidenceWarning] : [],
    8
  );
  const productRisks = mergeStringArrays(
    report.productOrConditionRisks,
    decision.riskFlags.map((flag) => `Risk flag: ${flag}`),
    conditionProfile.risks,
    8
  );
  const visualFields = buildVisualRecognitionReportFields(identity);
  const identityFields = buildIdentityReportFields(identity, { ...liveSearch, liveSearchStatus });

  return {
    ...report,
    buyerIntent: "personal_use",
    identifiedItem: cleanText(report.identifiedItem || buildIdentifiedItem(identity)),
    identificationConfidence: ensureConfidenceLayer(report.identificationConfidence, "Medium", "Identification is based on submitted photos, visible text, typed buyer details, and source-routing results."),
    ...visualFields,
    ...identityFields,
    evidenceFoundInPhotos: buildPhotoEvidence(identity),
    askingPrice: buildConsumerAskingPriceText(buyerIntake, identity),
    estimatedFairMarketValue: buildConsumerFairMarketValueText(report.estimatedFairMarketValue, {
      fairValueNumber,
      reliableCompsFound
    }),
    fairPriceRange: buildConsumerFairPriceRange(report.fairPriceRange, {
      fairValueNumber,
      reliableCompsFound
    }),
    valueRating: decision.valueRating,
    recommendation: decision.recommendation,
    recommendedOffer: offer.recommendedOffer,
    openingOffer: offer.openingOffer,
    targetPurchasePrice: offer.targetPurchasePrice,
    maximumRecommendedPrice: offer.maximumRecommendedPrice,
    walkAwayPrice: offer.walkAwayPrice,
    negotiationGuidance: buildConsumerNegotiationGuidance(report.negotiationGuidance, {
      decision,
      offer,
      reliableCompsFound,
      askingPriceNumber,
      fairValueNumber
    }),
    reasonsToBuy: decision.valueRating === "Insufficient Evidence"
      ? normalizeFlexibleArray(report.reasonsToBuy, 8, [])
      : normalizeFlexibleArray(report.reasonsToBuy, 8, buildConsumerReasonsToBuy(decision, reliableCompsFound)),
    reasonsForCaution: cautionItems,
    productOrConditionRisks: productRisks,
    riskFlags: decision.riskFlags,
    betterValueConsiderations: normalizeFlexibleArray(report.betterValueConsiderations, 8, buildConsumerBetterValueConsiderations(decision, conditionProfile)),
    researchResults,
    comparableQuality,
    pricingConfidence: decision.pricingConfidence,
    pricingRationale: ensurePrefix(report.pricingRationale, basis),
    additionalInformationNeeded: buildConsumerAdditionalInfoNeeded(report.additionalInformationNeeded, {
      reliableCompsFound,
      buyerIntake,
      identity,
      conditionProfile
    }),
    searchQueriesUsed: buildListingSearchQueriesUsed(liveSearch),
    sourcesSearched: buildSearchCoverage({ ...liveSearch, liveSearchStatus }),
    liveComparableSearchStatus: liveSearchStatus,
    weFoundThisItem: reliableCompsFound ? exactItems : [],
    weFoundSimilarComparableItems: reliableCompsFound ? similarItems : []
  };
}

function deriveConsumerDecision({ askingPriceNumber, fairValueNumber, reliableCompsFound, exactItems, similarItems, conditionProfile, buyerIntake, identity }) {
  const riskFlags = buildConsumerRiskFlags({
    askingPriceNumber,
    fairValueNumber,
    reliableCompsFound,
    conditionProfile,
    buyerIntake,
    identity
  });
  const hasAskingPrice = Number.isFinite(askingPriceNumber);
  const hasFairValue = Number.isFinite(fairValueNumber) && fairValueNumber > 0;
  const hasReliableEvidence = reliableCompsFound && (exactItems.length > 0 || similarItems.length > 0);

  if (!hasAskingPrice || !hasFairValue || !hasReliableEvidence) {
    return {
      valueRating: "Insufficient Evidence",
      recommendation: "Need More Information",
      pricingConfidence: forceLowConfidence("", buildConsumerLowConfidenceReason({ hasAskingPrice, hasFairValue, hasReliableEvidence })),
      riskFlags,
      evidenceWarning: "Consumer value cannot be rated confidently until the asking price, exact identity, condition, and source-backed comparable evidence are stronger."
    };
  }

  const ratio = askingPriceNumber / fairValueNumber;
  let valueRating = "Poor Value";
  let recommendation = "Pass";

  if (ratio <= consumerDecisionThresholds.exceptionalMaxRatio) {
    valueRating = "Exceptional Value";
    recommendation = "Buy";
  } else if (ratio <= consumerDecisionThresholds.goodMaxRatio) {
    valueRating = "Good Value";
    recommendation = "Buy";
  } else if (ratio <= consumerDecisionThresholds.fairMaxRatio) {
    valueRating = "Fair Price";
    recommendation = "Buy If It Fits Your Needs";
  } else if (ratio <= consumerDecisionThresholds.slightlyOverpricedMaxRatio) {
    valueRating = "Slightly Overpriced";
    recommendation = "Negotiate";
  } else if (ratio <= consumerDecisionThresholds.overpricedMaxRatio) {
    valueRating = "Overpriced";
    recommendation = "Wait for a Better Price";
  }

  if (conditionProfile.hasHardRisk) {
    if (valueRating === "Exceptional Value" || valueRating === "Good Value") {
      valueRating = "Fair Price";
    }
    if (recommendation === "Buy") {
      recommendation = "Negotiate";
    }
  } else if (conditionProfile.hasModerateRisk && recommendation === "Buy") {
    recommendation = "Buy If It Fits Your Needs";
  }

  if (conditionProfile.isUnknown && (recommendation === "Buy" || recommendation === "Buy If It Fits Your Needs")) {
    recommendation = "Need More Information";
    if (valueRating === "Exceptional Value" || valueRating === "Good Value") {
      valueRating = "Insufficient Evidence";
    }
  }

  if (riskFlags.filter((flag) => flag !== "No Return Protection").length >= consumerDecisionThresholds.conditionRiskDowngradeCount && recommendation === "Buy") {
    recommendation = "Buy If It Fits Your Needs";
  }

  return {
    valueRating,
    recommendation,
    pricingConfidence: exactItems.length
      ? ensureConfidenceLayer("", "Medium", "Exact or likely exact source-backed evidence supports the price direction, but condition and buyer fit still matter.")
      : ensureConfidenceLayer("", "Medium", "Strong similar source-backed evidence supports the price direction, but exact model, condition, and accessories can shift value."),
    riskFlags,
    evidenceWarning: ""
  };
}

function buildConsumerRiskFlags({ askingPriceNumber, fairValueNumber, reliableCompsFound, conditionProfile, buyerIntake, identity }) {
  const flags = [];
  const identityValues = [
    identity.brand,
    identity.manufacturer,
    identity.model,
    identity.sku,
    identity.upcBarcode,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    buyerIntake.item_name,
    buyerIntake.known_brand,
    buyerIntake.known_model,
    buyerIntake.known_sku,
    buyerIntake.known_upc
  ].filter(hasKnownValue);
  const concerns = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns : [];
  const context = cleanText(buyerIntake.purchase_context).toLowerCase();
  const itemText = [
    identity.category,
    identity.likelyItemDescription,
    identity.productNameOrBoxTitle,
    buyerIntake.buyer_notes,
    buyerIntake.approximate_age_era
  ].join(" ").toLowerCase();

  if (identityValues.length < 2 || normalizeStringArray(identity.identityConflictNotes, 6).length) {
    addUnique(flags, "Identity Not Confirmed");
  }
  if (!reliableCompsFound) {
    addUnique(flags, "Weak Comparable Evidence");
  }
  if (Number.isFinite(askingPriceNumber) && Number.isFinite(fairValueNumber) && askingPriceNumber > fairValueNumber * consumerDecisionThresholds.fairMaxRatio) {
    addUnique(flags, "Price Above Market");
  }
  if (conditionProfile.isUnknown) {
    addUnique(flags, "Condition Unclear");
  }
  if (conditionProfile.missingParts || concerns.some((item) => /missing|incomplete/.test(item))) {
    addUnique(flags, "Missing Parts");
  }
  if (concerns.some((item) => /authenticity/.test(item))) {
    addUnique(flags, "Authenticity Unclear");
  }
  if (/facebook|private|flea|estate|thrift|consignment|antique/.test(context)) {
    addUnique(flags, "No Return Protection");
  }
  if (/electronics|laptop|phone|tablet|camera|charger|software|locked|compatibility/.test(itemText)) {
    addUnique(flags, "Compatibility Risk");
  }
  if (conditionProfile.repairRisk) {
    addUnique(flags, "Repair Risk");
  }
  if (/older model|outdated|vintage|discontinued|old|legacy/.test(itemText)) {
    addUnique(flags, "Older Model");
  }

  return flags.slice(0, 10);
}

function getConsumerConditionProfile(buyerIntake, identity = {}) {
  const condition = cleanText(firstKnown(buyerIntake.item_condition, identity.condition)).toLowerCase();
  const concerns = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns : [];
  const risks = [];
  const isUnknown = !condition || /unknown/.test(condition);
  const hasHardRisk = /poor|for_parts|damaged|missing|not_working|untested/.test(condition)
    || concerns.some((item) => /missing|not_working|untested|incomplete|authenticity|cracks/.test(item));
  const hasModerateRisk = /used|vintage|fair|open_box/.test(condition)
    || concerns.some((item) => /visible_damage|stains_or_wear|odor_or_smoke|other/.test(item));
  const missingParts = /missing/.test(condition) || concerns.some((item) => /missing|incomplete/.test(item));
  const repairRisk = /poor|for_parts|damaged|not_working|untested/.test(condition)
    || concerns.some((item) => /not_working|untested|cracks|visible_damage/.test(item));

  if (isUnknown) {
    risks.push("Condition is not confirmed.");
  }
  if (hasHardRisk) {
    risks.push("Condition or completeness could materially reduce personal-use value.");
  } else if (hasModerateRisk) {
    risks.push("Condition should be inspected before paying near the top of the fair range.");
  }

  return {
    condition,
    concerns,
    isUnknown,
    hasHardRisk,
    hasModerateRisk,
    missingParts,
    repairRisk,
    risks
  };
}

function buildConsumerLowConfidenceReason({ hasAskingPrice, hasFairValue, hasReliableEvidence }) {
  const reasons = [];
  if (!hasAskingPrice) {
    reasons.push("no current asking price was provided");
  }
  if (!hasFairValue) {
    reasons.push("no evidence-backed fair value could be extracted");
  }
  if (!hasReliableEvidence) {
    reasons.push("no source-backed exact or strong similar comps passed filtering");
  }

  return `Consumer value rating is insufficient because ${reasons.join(", ")}.`;
}

function buildConsumerOffer({ askingPriceNumber, fairValueNumber, decision, conditionProfile }) {
  const unsupported = decision.valueRating === "Insufficient Evidence"
    || !Number.isFinite(askingPriceNumber)
    || !Number.isFinite(fairValueNumber)
    || fairValueNumber <= 0;

  if (unsupported) {
    return {
      openingOffer: "Not supported yet - verify identity, condition, asking price, and reliable comparables first.",
      targetPurchasePrice: "Not supported yet - evidence is too weak for a responsible target price.",
      maximumRecommendedPrice: "Not supported yet - do not set a maximum from weak evidence.",
      walkAwayPrice: "Not enough evidence for a precise walk-away price.",
      recommendedOffer: [
        "Opening Offer: Not supported yet.",
        "Target Purchase Price: Not supported yet.",
        "Maximum Recommended Price: Not supported yet."
      ]
    };
  }

  const conditionMultiplier = conditionProfile.hasHardRisk ? 0.84 : conditionProfile.hasModerateRisk ? 0.94 : 1.04;
  let maxPrice = roundMoney(fairValueNumber * conditionMultiplier);
  let targetPrice = roundMoney(Math.min(askingPriceNumber, maxPrice));
  let openingOffer = roundMoney(Math.max(1, targetPrice * 0.9));

  if (askingPriceNumber <= fairValueNumber * consumerDecisionThresholds.goodMaxRatio) {
    targetPrice = roundMoney(askingPriceNumber);
    openingOffer = roundMoney(Math.max(1, askingPriceNumber * 0.95));
    maxPrice = roundMoney(Math.max(targetPrice, Math.min(fairValueNumber * 1.03, maxPrice)));
  } else if (askingPriceNumber > fairValueNumber * consumerDecisionThresholds.fairMaxRatio) {
    targetPrice = roundMoney(Math.min(maxPrice, fairValueNumber * 0.96));
    openingOffer = roundMoney(Math.max(1, targetPrice * 0.88));
  }

  if (openingOffer > targetPrice) {
    openingOffer = targetPrice;
  }
  if (targetPrice > maxPrice) {
    targetPrice = maxPrice;
  }

  const openingOfferText = `Opening Offer: ${formatMoney(openingOffer)}`;
  const targetPurchasePrice = `Target Purchase Price: ${formatMoney(targetPrice)}`;
  const maximumRecommendedPrice = `Maximum Recommended Price: ${formatMoney(maxPrice)}`;

  return {
    openingOffer: openingOfferText,
    targetPurchasePrice,
    maximumRecommendedPrice,
    walkAwayPrice: `Walk-Away Price: ${formatMoney(maxPrice)} for personal use unless condition, accessories, warranty, return protection, or exact model evidence improves.`,
    recommendedOffer: [openingOfferText, targetPurchasePrice, maximumRecommendedPrice]
  };
}

function buildConsumerNegotiationGuidance(value, { decision, offer, reliableCompsFound, askingPriceNumber, fairValueNumber }) {
  const text = cleanText(value);
  if (!reliableCompsFound || decision.valueRating === "Insufficient Evidence") {
    return text || "Do not negotiate from a precise market claim yet. First verify the exact item, condition, included parts, and a reliable comparable price.";
  }

  if (Number.isFinite(askingPriceNumber) && Number.isFinite(fairValueNumber) && askingPriceNumber <= fairValueNumber * consumerDecisionThresholds.goodMaxRatio) {
    return text || `The current price appears within or below the supported fair range, so aggressive negotiation may not be justified. ${offer.targetPurchasePrice}`;
  }

  return text || `Use the supported fair-value range and condition issues to make a calm offer. ${offer.openingOffer}; ${offer.targetPurchasePrice}; do not exceed ${offer.maximumRecommendedPrice.replace("Maximum Recommended Price: ", "")} unless inspection improves confidence.`;
}

function buildConsumerReasonsToBuy(decision, reliableCompsFound) {
  if (!reliableCompsFound) {
    return [];
  }
  if (decision.valueRating === "Exceptional Value" || decision.valueRating === "Good Value") {
    return ["Asking price appears below the supported fair-value estimate if condition and identity check out."];
  }
  if (decision.valueRating === "Fair Price") {
    return ["Asking price appears within the supported fair range for personal use."];
  }
  return [];
}

function buildConsumerBetterValueConsiderations(decision, conditionProfile) {
  if (decision.valueRating === "Overpriced" || decision.valueRating === "Poor Value") {
    return ["Consider waiting for a lower price, a better-condition example, open-box/refurbished options, or a comparable model with clearer evidence."];
  }
  if (decision.valueRating === "Slightly Overpriced") {
    return ["A better value may be available if the seller negotiates closer to the target purchase price or if a cleaner comparable appears."];
  }
  if (conditionProfile.hasHardRisk || conditionProfile.isUnknown) {
    return ["A similar item with clearer condition, included accessories, or return protection may be the better value even at a similar price."];
  }
  return [];
}

function buildConsumerAdditionalInfoNeeded(value, { reliableCompsFound, buyerIntake, identity, conditionProfile }) {
  const needed = normalizeFlexibleArray(value, 8, []);
  if (!reliableCompsFound) {
    addUnique(needed, "One source-backed exact or strong similar comparable result for the same model, SKU, UPC, maker, size, or item code.");
  }
  if (!Number.isFinite(getConsumerAskingPriceNumber(buyerIntake, identity))) {
    addUnique(needed, "Current seller asking price.");
  }
  if (conditionProfile.isUnknown) {
    addUnique(needed, "Clear condition confirmation, including whether it works and whether any parts or accessories are missing.");
  }
  if (!hasKnownValue(identity.model) && !hasKnownValue(identity.sku) && !hasKnownValue(identity.upcBarcode)) {
    addUnique(needed, "A closer photo of the model label, SKU, UPC/barcode, maker mark, tag, or underside/back label.");
  }

  return needed.slice(0, 8);
}

function getConsumerAskingPriceNumber(buyerIntake, identity = {}) {
  if (Number.isFinite(buyerIntake.parsed_asking_price)) {
    return buyerIntake.parsed_asking_price;
  }

  const amounts = extractMoneyAmounts([
    identity.currentAskingPrice,
    identity.visiblePrice
  ].join(" "));

  return amounts.length ? amounts[0] : null;
}

function buildConsumerAskingPriceText(buyerIntake, identity = {}) {
  const raw = cleanText(buyerIntake.asking_price);
  if (raw) {
    return `Current asking price: ${raw}`;
  }

  const visible = firstKnown(identity.currentAskingPrice, identity.visiblePrice);
  if (visible) {
    return `Current asking price visible or inferred from photos: ${visible}`;
  }

  return "Not provided - enter the current asking price for a personal-use value decision.";
}

function extractConsumerFairValueNumber(report) {
  const amounts = extractMoneyAmounts([
    report.estimatedFairMarketValue,
    ...(Array.isArray(report.fairPriceRange) ? report.fairPriceRange : [])
  ].join(" "));

  if (!amounts.length) {
    return null;
  }

  const sorted = amounts.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) {
    return sorted[middle];
  }

  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function buildConsumerFairMarketValueText(value, { fairValueNumber, reliableCompsFound }) {
  const text = cleanText(value);
  if (!reliableCompsFound) {
    return ensurePrefix(text || "No source-backed fair market value can be confirmed.", "Insufficient evidence - ");
  }

  if (text) {
    return text;
  }

  return Number.isFinite(fairValueNumber)
    ? `Estimated fair market value centers around ${formatMoney(fairValueNumber)} based on source-backed comparable evidence, adjusted for condition and buyer context.`
    : "Source-backed comps exist, but a fair market value range still needs verification.";
}

function buildConsumerFairPriceRange(value, { fairValueNumber, reliableCompsFound }) {
  const existing = normalizeFlexibleArray(value, 4, []);
  if (!reliableCompsFound || !Number.isFinite(fairValueNumber)) {
    return existing.length
      ? existing.map((item) => ensurePrefix(item, "Insufficient evidence - "))
      : ["Insufficient evidence - Low, typical, and high fair prices are not supported until exact identity, condition, and comparable evidence improve."];
  }

  if (existing.length >= 3) {
    return existing;
  }

  return [
    `Low Fair Price: ${formatMoney(roundMoney(fairValueNumber * 0.86))}`,
    `Typical Fair Price: ${formatMoney(roundMoney(fairValueNumber))}`,
    `High Fair Price: ${formatMoney(roundMoney(fairValueNumber * 1.12))}`
  ];
}

function mergeStringArrays(...args) {
  const maxItems = typeof args[args.length - 1] === "number" ? args.pop() : 8;
  const merged = [];

  for (const value of args) {
    const items = Array.isArray(value) ? value : value ? [value] : [];
    for (const item of items) {
      addUnique(merged, item);
    }
  }

  return merged.slice(0, maxItems);
}

function buildBuyerRiskAssessment({ report, buyerIntake, identity, reliableCompsFound, searchCompleted, liveComparableSearchStatus, resaleGuidance, purchaserDecision }) {
  let evidenceScore = reliableCompsFound ? 22 : searchCompleted ? 58 : 64;
  let exposureScore = 32;
  const factors = [];
  const actions = [];
  const riskText = [
    report.liveCompConfidence,
    report.valuationConfidence,
    report.priceConfidence,
    report.buyerDecisionConfidence,
    report.priceBasis,
    report.expectedSellingTime,
    report.resalePotential,
    resaleGuidance.expectedSellingTime,
    resaleGuidance.platformSpecificSellingGuidance,
    liveComparableSearchStatus
  ].join(" ").toLowerCase();

  if (reliableCompsFound) {
    evidenceScore -= 8;
  } else {
    addUnique(factors, searchCompleted ? "No reliable sold comps" : "AI-only valuation");
    addUnique(actions, "Confirm recent sold prices for the exact item or a strong similar match.");
  }

  if (/ai-only|no reliable|source-backed comps are not available|low confidence/.test(riskText)) {
    evidenceScore += reliableCompsFound ? 0 : 8;
  }

  const identityRisk = getIdentityRisk(identity);
  evidenceScore += identityRisk.scoreAdjustment;
  for (const factor of identityRisk.factors) {
    addUnique(factors, factor);
  }
  for (const action of identityRisk.actions) {
    addUnique(actions, action);
  }

  const conditionRisk = getConditionRisk(buyerIntake, identity);
  exposureScore += conditionRisk.scoreAdjustment;
  for (const factor of conditionRisk.factors) {
    addUnique(factors, factor);
  }
  for (const action of conditionRisk.actions) {
    addUnique(actions, action);
  }

  const priceRisk = getPriceExposureRisk({ report, buyerIntake, reliableCompsFound, resaleGuidance });
  exposureScore += priceRisk.scoreAdjustment;
  for (const factor of priceRisk.factors) {
    addUnique(factors, factor);
  }
  for (const action of priceRisk.actions) {
    addUnique(actions, action);
  }

  const liquidityRisk = getLiquidityRisk({ report, identity, resaleGuidance });
  exposureScore += liquidityRisk.scoreAdjustment;
  for (const factor of liquidityRisk.factors) {
    addUnique(factors, factor);
  }
  for (const action of liquidityRisk.actions) {
    addUnique(actions, action);
  }

  if (isResaleIntent(buyerIntake.purchase_intent)) {
    exposureScore += 6;
  } else if (/personal_use/i.test(cleanText(buyerIntake.purchase_intent))) {
    exposureScore -= 4;
    if (!reliableCompsFound) {
      addUnique(factors, "Overpayment risk still exists for personal use");
      addUnique(actions, "Buy only if personal value justifies the price despite weak market evidence.");
    }
  }

  if (isDirectBuyDecision(purchaserDecision) && !reliableCompsFound && !priceRisk.limitedDownside) {
    evidenceScore += 10;
    addUnique(factors, "Recommendation would be aggressive without reliable comps");
  }

  const boundedEvidenceScore = clamp(Math.round(evidenceScore), 0, 100);
  const boundedExposureScore = clamp(Math.round(exposureScore), 0, 100);
  let normalizedScore = clamp(Math.round((boundedEvidenceScore * 0.45) + (boundedExposureScore * 0.55)), 0, 100);

  if (Number.isFinite(priceRisk.minimumFinalScore)) {
    normalizedScore = Math.max(normalizedScore, priceRisk.minimumFinalScore);
  }

  if (priceRisk.limitedDownside && !priceRisk.hasHardDownside && !priceRisk.hasHighAddedCost) {
    normalizedScore = Math.min(normalizedScore, reliableCompsFound ? 39 : 49);
  }

  const level = riskLevelForScore(normalizedScore);
  const primaryRiskFactors = factors.slice(0, 6);
  const riskReductionActions = actions.slice(0, 6);

  if (!primaryRiskFactors.length) {
    primaryRiskFactors.push("No major buyer-protection risk stood out from the available evidence.");
  }
  if (!riskReductionActions.length) {
    riskReductionActions.push("Verify identity, condition, price, and market evidence before buying.");
  }

  return {
    score: normalizedScore,
    level,
    summary: buildBuyerRiskSummary(level, primaryRiskFactors, buyerIntake),
    primaryRiskFactors,
    riskReductionActions,
    evidenceScore: boundedEvidenceScore,
    exposureScore: boundedExposureScore,
    limitedDownside: priceRisk.limitedDownside,
    hardDownside: priceRisk.hasHardDownside || priceRisk.hasHighAddedCost
  };
}

function getIdentityRisk(identity = {}) {
  const knownFields = [
    identity.brand,
    identity.manufacturer,
    identity.model,
    identity.sku,
    identity.upcBarcode,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording
  ].filter(hasKnownValue);
  const conflictCount = Array.isArray(identity.identityConflictNotes) ? identity.identityConflictNotes.filter(hasKnownValue).length : 0;
  const result = { scoreAdjustment: 0, factors: [], actions: [] };

  if (conflictCount > 0) {
    result.scoreAdjustment += 16;
    result.factors.push("Conflicting identity evidence");
    result.actions.push("Resolve the label, model, UPC, or photo conflict before buying.");
  }

  if (knownFields.length >= 4) {
    result.scoreAdjustment -= 8;
  } else if (knownFields.length <= 1) {
    result.scoreAdjustment += 12;
    result.factors.push("Unclear maker or model");
    result.actions.push("Photograph the manufacturer stamp, model number, SKU, UPC, or label more closely.");
  } else {
    result.scoreAdjustment += 5;
    result.factors.push("Incomplete item identification");
    result.actions.push("Confirm exact brand, model, dimensions, and identifying numbers.");
  }

  return result;
}

function getConditionRisk(buyerIntake, identity = {}) {
  const condition = cleanText(firstKnown(buyerIntake.item_condition, identity.condition)).toLowerCase();
  const concerns = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns : [];
  const result = { scoreAdjustment: 0, factors: [], actions: [] };

  if (!condition || /unknown/.test(condition)) {
    result.scoreAdjustment += 8;
    result.factors.push("Unknown condition");
    result.actions.push("Inspect condition closely before paying.");
  }

  if (/damaged|missing|untested/.test(condition)) {
    result.scoreAdjustment += 12;
    result.factors.push("Condition or completeness risk");
  }

  const concernLabels = {
    visible_damage: "Visible damage",
    missing_parts: "Missing parts",
    stains_or_wear: "Stains or wear",
    cracks_or_chips: "Cracks or chips",
    not_working: "Not working",
    untested: "Untested",
    incomplete_set: "Incomplete set",
    authenticity_concern: "Authenticity concern",
    odor_or_smoke: "Odor or smoke",
    other: "Other condition concern"
  };

  for (const concern of concerns) {
    const label = concernLabels[concern] || cleanText(concern);
    if (!label) {
      continue;
    }
    result.scoreAdjustment += /authenticity|not working|untested|missing|cracks/i.test(label) ? 7 : 4;
    addUnique(result.factors, label);
  }

  if (concerns.length || /damaged|missing|untested|unknown/.test(condition)) {
    result.actions.push("Photograph and verify damage, missing pieces, function, odor, and authenticity before buying.");
  }

  return result;
}

function getPriceExposureRisk({ report, buyerIntake, reliableCompsFound, resaleGuidance }) {
  const result = {
    scoreAdjustment: 0,
    factors: [],
    actions: [],
    limitedDownside: false,
    hasHardDownside: false,
    hasHighAddedCost: false,
    minimumFinalScore: null
  };
  const askingPrice = buyerIntake.parsed_asking_price;
  const exposureProfile = getDownsideExposureProfile({ report, buyerIntake, resaleGuidance });

  if (!Number.isFinite(askingPrice)) {
    result.scoreAdjustment += 28;
    result.factors.push("Missing asking price");
    result.actions.push("Enter the current asking price before making a buy decision.");
    return result;
  }

  if (exposureProfile.hardFactors.length) {
    result.hasHardDownside = true;
    result.scoreAdjustment += 34;
    result.minimumFinalScore = 75;
    for (const factor of exposureProfile.hardFactors) {
      addUnique(result.factors, factor);
    }
    result.actions.push("Do not let a low sticker price override safety, fraud, authenticity, repair, contamination, or disposal risk.");
  }

  if (exposureProfile.hasHighAddedCost) {
    result.hasHighAddedCost = true;
    result.scoreAdjustment += Math.min(34, 16 + Math.ceil(exposureProfile.highestAddedCost / Math.max(askingPrice, 1)));
    result.minimumFinalScore = Math.max(result.minimumFinalScore || 0, 68);
    result.factors.push(`Added cost exposure around ${formatMoney(exposureProfile.highestAddedCost)}`);
    result.actions.push("Include transport, freight, repair, storage, shipping, and disposal costs before treating the price as low-risk.");
  }

  const lowPriceCanReduceRisk = !result.hasHardDownside && !result.hasHighAddedCost;

  if (isResaleIntent(buyerIntake.purchase_intent)) {
    if (!reliableCompsFound) {
      const ceiling = resaleGuidance.speculativeBuyCeiling;
      if (askingPrice <= 0) {
        result.limitedDownside = true;
        if (lowPriceCanReduceRisk) {
          result.scoreAdjustment -= 18;
          result.factors.push("Free item limits cash exposure");
          result.actions.push("Only proceed if transport, storage, repair, safety, and disposal add no meaningful burden.");
        } else {
          result.factors.push("Free price does not erase added downside");
        }
      } else if (askingPrice <= 10) {
        result.limitedDownside = true;
        if (lowPriceCanReduceRisk) {
          result.scoreAdjustment -= askingPrice <= 1 ? 28 : 22;
          result.factors.push(askingPrice <= 1 ? "Token purchase price limits cash exposure" : "Very low purchase price limits downside");
          result.actions.push("Treat this only as a low-dollar speculative buy; do not infer proven resale value from the low price.");
        } else {
          result.factors.push("Low price does not erase added downside");
        }
      } else if (Number.isFinite(ceiling) && askingPrice <= ceiling) {
        result.limitedDownside = askingPrice <= 25;
        if (lowPriceCanReduceRisk) {
          result.scoreAdjustment -= askingPrice <= 25 ? 14 : 6;
          result.factors.push(askingPrice <= 25 ? "Low purchase price limits downside" : "Asking price stays below low-confidence ceiling");
          result.actions.push("Keep any offer at or below the low-confidence speculative ceiling.");
        } else {
          result.factors.push("Speculative ceiling is offset by added downside");
        }
      } else if (Number.isFinite(ceiling)) {
        const spreadPenalty = Math.min(28, 12 + Math.ceil(((askingPrice - ceiling) / Math.max(ceiling, 1)) * 12));
        result.scoreAdjustment += Math.max(12, spreadPenalty);
        result.factors.push("Asking price exceeds low-confidence speculative ceiling");
        result.actions.push("Pass unless the seller accepts a substantially lower offer.");
      } else {
        if (lowPriceCanReduceRisk && askingPrice <= 25) {
          result.scoreAdjustment += askingPrice <= 10 ? -10 : 2;
          result.limitedDownside = true;
          result.factors.push("Low price partly offsets unsupported resale value");
          result.actions.push("Buy only as a small speculative gamble with no assumed resale profit.");
        } else {
          result.scoreAdjustment += askingPrice <= 50 ? 16 : 22;
          result.factors.push("No supported speculative buy price");
          result.actions.push("Need stronger sold-price evidence before risking resale capital.");
        }
      }
      return result;
    }

    const supportedRange = extractMoneyRange([
      report.expectedSalePrice,
      report.estimatedMarketValue,
      report.resalePotential
    ].join(" "));

    if (supportedRange) {
      const conservativeSale = Math.min(...supportedRange);
      if (askingPrice <= conservativeSale * 0.45) {
        result.scoreAdjustment -= 18;
      } else if (askingPrice <= conservativeSale * 0.65) {
        result.scoreAdjustment -= 8;
      } else if (askingPrice >= conservativeSale * 0.85) {
        result.scoreAdjustment += askingPrice >= conservativeSale ? 25 : 18;
        result.factors.push("Asking price too close to conservative sale value");
        result.actions.push("Negotiate for a larger safety margin after fees, time, and condition risk.");
      }
    }
  } else if (!reliableCompsFound) {
    result.scoreAdjustment += 8;
    result.factors.push("Market value is not source-supported");
  }

  return result;
}

function getDownsideExposureProfile({ report = {}, buyerIntake = {}, resaleGuidance = {} }) {
  const concerns = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns : [];
  const haystack = [
    buyerIntake.item_condition,
    buyerIntake.buyer_notes,
    concerns.join(" "),
    report.currentPriceAssessment,
    report.resalePotential,
    report.missingDetails,
    report.conditionAssessment,
    resaleGuidance.platformSpecificSellingGuidance
  ].join(" ").toLowerCase();
  const hardFactors = [];

  if (/counterfeit|authenticity_concern|authenticity concern|legal exposure|platform exposure/.test(haystack)) {
    hardFactors.push("Authenticity, legal, or platform exposure");
  }
  if (/unsafe|electrical hazard|hazardous|hazmat|contaminat|infestation|mold|smoke|odor/.test(haystack)) {
    hardFactors.push("Safety, contamination, odor, or disposal exposure");
  }
  if (/scam|fraud|stolen|seller pressure|wire transfer|gift card/.test(haystack)) {
    hardFactors.push("Fraud or scam indicators");
  }
  if (/major repair|not_working|not working|missing critical|missing_parts|missing parts|incomplete_set|incomplete set/.test(haystack)) {
    hardFactors.push("Repair or missing-component exposure");
  }

  const askingPrice = Number.isFinite(buyerIntake.parsed_asking_price) ? buyerIntake.parsed_asking_price : 0;
  const addedCostText = [buyerIntake.buyer_notes, buyerIntake.item_condition, concerns.join(" ")].join(" ");
  const addedCosts = extractMoneyAmounts(addedCostText);
  const highestAddedCost = addedCosts.filter((amount) => amount > Math.max(askingPrice + 1, 15)).sort((a, b) => b - a)[0] || 0;
  const hasCostBurdenText = /freight|transport|shipping|delivery|pickup|storage|repair|parts|disposal|dump|hazard|cleaning/.test(addedCostText.toLowerCase());
  const hasHighAddedCost = hasCostBurdenText && highestAddedCost >= Math.max(25, askingPrice * 1.5);

  return {
    hardFactors,
    highestAddedCost,
    hasHighAddedCost
  };
}

function getLiquidityRisk({ report, identity = {}, resaleGuidance = {} }) {
  const haystack = [
    report.expectedSellingTime,
    report.marketType,
    report.resalePotential,
    resaleGuidance.expectedSellingTime,
    resaleGuidance.platformSpecificSellingGuidance,
    identity.category,
    identity.material,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription
  ].join(" ").toLowerCase();
  const result = { scoreAdjustment: 0, factors: [], actions: [] };

  if (/uncertain demand|unverified|may fail to sell|slow|long|one to three months|seasonal|narrow|collector/.test(haystack)) {
    result.scoreAdjustment += 9;
    result.factors.push("Uncertain resale demand");
    result.actions.push("Verify recent demand before buying for resale.");
  }

  if (/fragile|ceramic|glass|breakage|shipping|local pickup|bulky|transport/.test(haystack)) {
    result.scoreAdjustment += 7;
    result.factors.push("Shipping, transport, or breakage risk");
    result.actions.push("Account for pickup, packing, shipping, breakage, and return risk.");
  }

  return result;
}

function alignDecisionWithRisk(decision, buyerRisk, buyerIntake) {
  const text = cleanText(decision || "Need More Info - Buyer decision requires more item details.");
  const detail = stripDecisionLabel(text) || "Risk must be reduced before buying.";

  if (buyerRisk.score >= 75 && isBuyOrNegotiateDecision(text)) {
    if (!hasKnownValue(buyerIntake.asking_price)) {
      return `Need More Info - Buyer Risk Score is ${buyerRisk.score} (${buyerRisk.level}) because the purchase decision is incomplete. ${detail}`;
    }
    return `Pass - Buyer Risk Score is ${buyerRisk.score} (${buyerRisk.level}), so buying at the current price would put too much downside risk on the buyer. ${detail}`;
  }

  if (buyerRisk.score >= 50 && isDirectBuyDecision(text)) {
    return `Need More Info - Buyer Risk Score is ${buyerRisk.score} (${buyerRisk.level}), so a direct Buy recommendation would be too aggressive without reducing risk. ${detail}`;
  }

  if (buyerRisk.score <= 49 && buyerRisk.limitedDownside && /^Pass\b/i.test(text)) {
    return `Buy Here - Speculative Buy only at this very low price. Valuation remains uncertain, resale is not guaranteed, and this decision depends on limited dollar exposure; added transport, storage, repair, safety, disposal, or condition costs would change the decision. ${detail}`;
  }

  return text;
}

function isBuyOrNegotiateDecision(value) {
  return /^(Buy Here|Buy\b|Strong Buy|Cautious Buy|Speculative Buy|Buy with Conditions|Negotiate)\b/i.test(cleanText(value));
}

function isDirectBuyDecision(value) {
  return /^(Buy Here|Buy\b|Strong Buy|Cautious Buy|Speculative Buy|Buy with Conditions)\b/i.test(cleanText(value));
}

function riskLevelForScore(score) {
  if (score <= 24) {
    return "Low Risk";
  }
  if (score <= 49) {
    return "Moderate Risk";
  }
  if (score <= 74) {
    return "High Risk";
  }
  return "Very High Risk";
}

function buildBuyerRiskSummary(level, factors, buyerIntake) {
  const asking = cleanText(buyerIntake.asking_price);
  const factorText = factors.slice(0, 3).map((factor) => factor.toLowerCase()).join(", ");
  const priceText = asking ? ` at the ${asking} asking price` : " because the asking price is missing";

  return `${level} because ${factorText || "the available evidence leaves buyer downside to verify"}${priceText}. This blends evidence uncertainty with purchase downside; confidence can remain low even when dollar exposure is limited. Lower is safer; higher is riskier.`;
}

function addUnique(list, value) {
  const text = cleanText(value);
  if (text && !list.some((item) => item.toLowerCase() === text.toLowerCase())) {
    list.push(text);
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildBuyerDecisionConfidence(value, { reliableCompsFound, hasAskingPrice, buyerRisk }) {
  if (!hasAskingPrice) {
    return forceLowConfidence(value, "No current asking price was provided, so the buy decision cannot be fully assessed.");
  }

  if (reliableCompsFound) {
    return ensureConfidenceLayer(value, "Medium", "The recommendation uses source-backed comps plus item details, but final confidence depends on condition and authenticity checks.");
  }

  if (buyerRisk?.limitedDownside && !buyerRisk?.hardDownside && buyerRisk.score <= 49) {
    return forceMediumConfidence(value, "Buyer decision confidence is moderate only because the current price limits dollar exposure. Item identification, live comp, and valuation confidence remain low; resale is not guaranteed and added costs could change the decision.");
  }

  return forceLowConfidence(value, "The buyer decision should be conservative because live comp support is missing.");
}

function buildResalePlatformContext(platform, buyerIntake = normalizeBuyerIntake({})) {
  const selectedPlatform = cleanText(platform);
  const intent = cleanText(buyerIntake.purchase_intent);

  if (!isResaleIntent(intent)) {
    return "Purchase intent is not resale or both; do not force resale pricing.";
  }

  return selectedPlatform
    ? `${selectedPlatform} is the intended resale platform.`
    : "No resale platform was selected; recommend the best likely selling platform.";
}

function buildResalePricingGuidance(report, { buyerIntake, identity, platform, sourceRoute, reliableCompsFound }) {
  if (!isResaleIntent(buyerIntake.purchase_intent)) {
    return {
      recommendedSellingPlatform: "",
      suggestedListingPrice: "",
      expectedSalePrice: "",
      minimumAcceptablePrice: "",
      expectedSellingTime: "",
      platformSpecificSellingGuidance: ""
    };
  }

  const recommendedSellingPlatform = cleanText(report.recommendedSellingPlatform)
    || recommendSellingPlatform({ platform, identity, sourceRoute });
  const moneyRange = extractMoneyRange([
    report.suggestedListingPrice,
    report.expectedSalePrice,
    report.minimumAcceptablePrice,
    report.aiOnlyRoughValueRange,
    report.estimatedMarketValue,
    report.resalePotential
  ].join(" "));
  const fallback = buildFallbackSellPriceGuidance(moneyRange);

  if (!reliableCompsFound) {
    return buildLowConfidenceResaleGuidance({
      report,
      buyerIntake,
      recommendedSellingPlatform,
      moneyRange
    });
  }

  return {
    recommendedSellingPlatform,
    suggestedListingPrice: labelResalePriceGuidance(report.suggestedListingPrice, fallback.suggestedListingPrice, reliableCompsFound),
    expectedSalePrice: labelResalePriceGuidance(report.expectedSalePrice, fallback.expectedSalePrice, reliableCompsFound),
    minimumAcceptablePrice: labelResalePriceGuidance(report.minimumAcceptablePrice, fallback.minimumAcceptablePrice, reliableCompsFound),
    expectedSellingTime: cleanText(report.expectedSellingTime) || fallback.expectedSellingTime,
    platformSpecificSellingGuidance: cleanText(report.platformSpecificSellingGuidance)
      || buildPlatformSpecificSellingGuidance(recommendedSellingPlatform, fallback)
  };
}

function buildLowConfidenceResaleGuidance({ report, buyerIntake, recommendedSellingPlatform, moneyRange }) {
  const speculativeBuyCeiling = calculateSpeculativeBuyCeiling({ moneyRange, buyerIntake });
  const speculativeOfferText = speculativeBuyCeiling
    ? `A low-confidence speculative offer should stay around ${formatSpeculativeOfferRange(speculativeBuyCeiling)} or lower after inspection.`
    : "No responsible speculative offer can be calculated until stronger identity, condition, and demand evidence is available.";
  const cautiousAdvertisedRange = moneyRange
    ? `A cautious advertised range may be around ${formatMoneyRange(roundMoney(moneyRange[0]), roundMoney(moneyRange[1]))} only after verification, but it is not proof of resale value.`
    : "Resale price cannot be estimated reliably from available evidence.";
  const expectedSaleRange = moneyRange
    ? `If a buyer exists, a conservative realized sale would need to fall below the advertised range and should be treated as highly uncertain. ${cautiousAdvertisedRange}`
    : "Resale price cannot be estimated reliably from available evidence.";

  return {
    recommendedSellingPlatform,
    suggestedListingPrice: `AI-only low-confidence advertised guidance - ${cautiousAdvertisedRange}`,
    expectedSalePrice: `Resale price cannot be estimated reliably from available evidence. ${expectedSaleRange} The item may fail to sell.`,
    minimumAcceptablePrice: "No reliable minimum acceptable resale price is supported without exact or strong similar comps; do not treat any floor as guaranteed liquidity.",
    expectedSellingTime: "Highly uncertain; sale may be slow, require repeated markdowns, or fail entirely until demand is verified.",
    platformSpecificSellingGuidance: `${recommendedSellingPlatform || "Resale"} guidance - do not use an AI-only listing range to justify buying. ${speculativeOfferText} Account for fees, transport, shipping or breakage, condition uncertainty, negotiation, and time-to-sell before risking cash.`,
    speculativeBuyCeiling,
    speculativeOfferText
  };
}

function calculateSpeculativeBuyCeiling({ moneyRange, buyerIntake }) {
  if (!moneyRange) {
    return null;
  }

  const conservativeSale = Math.min(...moneyRange);
  if (!Number.isFinite(conservativeSale) || conservativeSale <= 0) {
    return null;
  }

  const context = cleanText(buyerIntake.purchase_context).toLowerCase();
  const platformIntent = cleanText(buyerIntake.purchase_intent).toLowerCase();
  const condition = cleanText(buyerIntake.item_condition).toLowerCase();
  const concerns = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns : [];
  const localPurchase = /facebook|private|flea|estate|thrift|consignment|antique|local/.test(context);
  const damagedOrUntested = /damaged|missing|untested|unknown/.test(condition) || concerns.some((item) => /damage|missing|cracks|not_working|untested|incomplete|authenticity|odor/.test(item));
  const hasIdentifier = [
    buyerIntake.item_name,
    buyerIntake.known_brand,
    buyerIntake.known_manufacturer,
    buyerIntake.known_model,
    buyerIntake.known_sku,
    buyerIntake.known_upc
  ].some(hasKnownValue);

  const sellingCostRate = localPurchase ? 0.1 : 0.18;
  const conditionAllowance = damagedOrUntested ? 0.18 : 0.08;
  const identityAllowance = hasIdentifier ? 0.06 : 0.14;
  const uncertaintyAllowance = 0.16 + Math.min(0.12, concerns.length * 0.03) + identityAllowance;
  const requiredProfit = Math.max(conservativeSale <= 35 ? 8 : 10, conservativeSale * (platformIntent === "both" ? 0.14 : 0.16));
  const riskAdjustedNet = conservativeSale * Math.max(0.2, 1 - sellingCostRate - conditionAllowance - uncertaintyAllowance);
  const ceiling = roundMoney(riskAdjustedNet - requiredProfit);

  return ceiling > 0 ? ceiling : null;
}

function formatSpeculativeOfferRange(ceiling) {
  const high = roundMoney(ceiling);
  const low = roundMoney(Math.max(1, high * 0.7));
  return formatMoneyRange(low, high);
}

function labelResalePriceGuidance(value, fallback, reliableCompsFound) {
  const text = cleanText(value || fallback);
  if (!text || reliableCompsFound || /ai-only|low confidence|source-backed/i.test(text)) {
    return text;
  }

  return `AI-only low-confidence guidance - ${text}`;
}

function buildFallbackSellPriceGuidance(moneyRange) {
  if (!moneyRange) {
    return {
      suggestedListingPrice: "No reliable price range was available; use a broad, cautious advertised range after verifying exact identity, condition, and local demand.",
      expectedSalePrice: "No reliable price range was available; likely realized price is highly uncertain without stronger identity or comparable-sale evidence.",
      minimumAcceptablePrice: "No reliable price range was available; set the practical floor only after accounting for fees, shipping or transport, breakage risk, condition risk, and time.",
      expectedSellingTime: "Highly uncertain until exact identity, condition, and demand are clearer."
    };
  }

  const [low, high] = moneyRange;
  const suggestedLow = roundMoney(Math.max(low, high * 0.85));
  const suggestedHigh = roundMoney(high * 1.15);
  const expectedLow = roundMoney(Math.max(low, high * 0.5));
  const expectedHigh = roundMoney(Math.max(expectedLow, high * 0.75));
  const minimumLow = roundMoney(low);
  const minimumHigh = roundMoney(Math.max(minimumLow, low * 1.35));

  return {
    suggestedListingPrice: `Approximately ${formatMoneyRange(suggestedLow, suggestedHigh)} starting advertised price, adjusted for condition, demand, and negotiation room.`,
    expectedSalePrice: `Approximately ${formatMoneyRange(expectedLow, expectedHigh)} likely realized sale price after negotiation or platform friction.`,
    minimumAcceptablePrice: `Approximately ${formatMoneyRange(minimumLow, minimumHigh)} practical floor before fees, shipping, transport, condition risk, and time are considered.`,
    expectedSellingTime: "Several weeks to one to three months; faster only if the item has clear local demand, strong identity, and clean condition."
  };
}

function recommendSellingPlatform({ platform, identity, sourceRoute = [] }) {
  const selectedPlatform = cleanText(platform);
  if (selectedPlatform) {
    return selectedPlatform;
  }

  const haystack = [
    sourceRoute.join(" "),
    identity.category,
    identity.subjectIdentity,
    identity.userProvidedIdentity,
    identity.exactProductIdentity,
    identity.productNameOrBoxTitle,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    identity.material,
    identity.teamName,
    identity.schoolName,
    identity.mascot,
    identity.licensingStickerText
  ].join(" ").toLowerCase();

  if (/institution|organization|college|university|mascot|logo|character|sports logo|school colors|officially licensed|licensee/.test(haystack)) {
    return "Specialty collector group";
  }
  if (/furniture|bulky|fragile|ceramic|cookie jar|container|canister|local pickup/.test(haystack)) {
    return "Facebook Marketplace";
  }
  if (/vintage|handmade|decor|collectible|etsy/.test(haystack)) {
    return "Etsy";
  }
  if (/apparel|fashion|dress|shirt|shoe|poshmark/.test(haystack)) {
    return "Poshmark";
  }
  if (/electronics|laptop|tablet|phone|model|refurbished/.test(haystack)) {
    return "eBay";
  }

  return "eBay";
}

function buildPlatformSpecificSellingGuidance(platform, fallback) {
  const platformText = cleanText(platform) || "the recommended platform";
  if (/facebook marketplace/i.test(platformText)) {
    return [
      "Facebook Marketplace guidance - local pickup is suitable when the item is fragile, bulky, or low-to-mid value.",
      `Start near ${fallback.suggestedListingPrice.toLowerCase()}`,
      `Expect negotiation toward ${fallback.expectedSalePrice.toLowerCase()}`,
      `Do not accept below ${fallback.minimumAcceptablePrice.toLowerCase()} unless time, storage, or condition risk matters more than margin.`,
      "Confirm dimensions, lid or missing-component status, chips/cracks, and transport needs. Avoid shipping fragile ceramic unless packaging risk is acceptable."
    ].join(" ");
  }

  return `${platformText} guidance - price with room for offers, disclose flaws and missing pieces plainly, account for fees and shipping friction, and avoid treating AI-only ranges as source-backed facts.`;
}

function buildCurrentAskingPrice(buyerIntake, identity = {}) {
  const rawAskingPrice = cleanText(buyerIntake.asking_price);
  if (rawAskingPrice) {
    return `Current seller asking price: ${rawAskingPrice}`;
  }

  const visiblePrice = firstKnown(identity.currentAskingPrice, identity.visiblePrice);
  if (visiblePrice) {
    return `Current asking price visible or inferred from photos: ${visiblePrice}`;
  }

  return "Not provided - current asking price is needed for a confident buy decision, but resale-price guidance can still be estimated cautiously.";
}

function buildCurrentPriceAssessment(value, { buyerIntake, reliableCompsFound, resaleGuidance }) {
  const text = cleanText(value);
  if (reliableCompsFound) {
    return text;
  }

  if (!hasKnownValue(buyerIntake.asking_price)) {
    return ensurePrefix(text, "Unknown - Current price assessment requires the current asking price.");
  }

  if (isResaleIntent(buyerIntake.purchase_intent)) {
    const askingPrice = buyerIntake.parsed_asking_price;
    const ceiling = resaleGuidance.speculativeBuyCeiling;
    if (Number.isFinite(askingPrice) && Number.isFinite(ceiling) && askingPrice <= ceiling && askingPrice <= 25) {
      return `Low-confidence speculative - ${formatMoney(askingPrice)} may limit downside, but demand and realized resale value are unverified.`;
    }

    return `High risk - Current asking price is not supported by reliable exact or strong similar comps. ${resaleGuidance.speculativeOfferText || "Need more evidence before considering any offer."}`;
  }

  return ensurePrefix(text, "Unknown - Market support is low because reliable comps are missing.");
}

function buildMaximumRecommendedBuyPrice(value, { buyerIntake, reliableCompsFound, resaleGuidance }) {
  const text = cleanText(value);
  if (reliableCompsFound) {
    return text;
  }

  if (!hasKnownValue(buyerIntake.asking_price)) {
    return "Need More Info - Current asking price is required before a maximum recommended buy price can be trusted.";
  }

  if (isResaleIntent(buyerIntake.purchase_intent)) {
    if (resaleGuidance.speculativeBuyCeiling) {
      return `Low-confidence speculative ceiling: ${formatMoney(resaleGuidance.speculativeBuyCeiling)} or less. This ceiling uses conservative realized-sale logic and subtracts selling costs, transport or shipping risk, condition risk, identity risk, uncertainty, and required profit. It is not a confident buy price.`;
    }

    return "No reliable maximum buy price can be recommended because source-backed comps, demand, and realized resale value are not strong enough.";
  }

  return ensurePrefix(text, "Low confidence - Buy only if personal utility justifies the price; market value is not source-supported.");
}

function buildResalePotential(value, { buyerIntake, reliableCompsFound, resaleGuidance }) {
  const text = cleanText(value);
  if (!isResaleIntent(buyerIntake.purchase_intent)) {
    return text || "Resale is not the main reason to buy.";
  }

  if (reliableCompsFound) {
    return text;
  }

  return `Low-confidence speculative resale only - demand is unverified, the item may not sell, and an advertised listing price is not the same as realized value. ${resaleGuidance.speculativeOfferText || "Need stronger comps before risking resale capital."}`;
}

function buildItemIdentification(identity = {}) {
  const identityParts = [
    formatKnownPart("subject", identity.subjectIdentity),
    formatKnownPart("subject confidence", identity.subjectConfidence),
    formatKnownPart("exact product", identity.exactProductIdentity),
    formatKnownPart("exact product confidence", identity.exactProductConfidence),
    firstKnown(identity.productNameOrBoxTitle, identity.likelyItemDescription, identity.category),
    formatKnownPart("school/team", firstKnown(identity.schoolName, identity.teamName)),
    formatKnownPart("mascot", identity.mascot),
    formatKnownPart("licensing", identity.licensingStickerText),
    formatKnownPart("maker/stamp", firstKnown(identity.manufacturer, identity.brand, identity.manufacturerLocationText)),
    formatKnownPart("model/SKU/UPC", firstKnown(identity.model, identity.sku, identity.upcBarcode, identity.styleNumber)),
    formatKnownPart("copyright/year", firstKnown(identity.copyrightWording, identity.year)),
    formatKnownPart("material", identity.material),
    formatKnownPart("dimensions", firstKnown(identity.dimensions, identity.size)),
    formatKnownPart("condition", identity.condition),
    formatKnownPart("lid/missing components", identity.missingComponentStatus)
  ].filter(Boolean);

  if (!identityParts.length) {
    return "Need more info - item identification remains incomplete. A closer photo of labels, stamps, dimensions, lid status, and missing pieces would improve confidence.";
  }

  return `Identified as: ${identityParts.join("; ")}.`;
}

function buildIdentityReportFields(identity, liveSearch = {}) {
  const known = [];
  const unknowns = normalizeStringArray(identity.identityUnknowns, 8);
  const visualEvidence = normalizeStringArray(identity.visualIdentityEvidence, 6);
  const textEvidence = normalizeStringArray(identity.textIdentityEvidence, 6);
  const conflicts = normalizeStringArray(identity.identityConflictNotes, 6);

  if (hasKnownValue(identity.subjectIdentity)) {
    known.push(`Subject: ${identity.subjectIdentity}`);
  }
  if (hasKnownValue(identity.userProvidedIdentity)) {
    known.push(`User-provided identity: ${identity.userProvidedIdentity}`);
  }
  for (const item of visualEvidence.slice(0, 3)) {
    known.push(`Visual evidence: ${item}`);
  }
  for (const item of textEvidence.slice(0, 3)) {
    known.push(`Text evidence: ${item}`);
  }
  if (hasKnownValue(identity.exactComparableStatus)) {
    known.push(`Comparable status: ${identity.exactComparableStatus}`);
  } else if (liveSearch.liveSearchStatus && !/Source-Backed Comps Found/i.test(liveSearch.liveSearchStatus)) {
    known.push("Comparable status: No source-backed exact comparable passed filtering.");
  }

  const makerDateLicensing = [
    `Maker / Manufacturer: ${firstKnown(identity.makerIdentity, identity.manufacturer) || "Not verified"}`,
    `Date / Era: ${firstKnown(identity.eraEstimate, identity.year, identity.copyrightWording) || "Not verified"}`,
    `Licensing: ${identity.licensingStatus || "Not verified"}`,
    `Authenticity: ${identity.authenticityStatus || "Not verified"}`
  ];

  return {
    subjectIdentity: identity.subjectIdentity || "Unknown subject",
    subjectConfidence: identity.subjectConfidence || "Unclear",
    exactProductIdentity: identity.exactProductIdentity || "Not verified",
    exactProductConfidence: identity.exactProductConfidence || "Low - exact product not verified.",
    makerDateLicensingStatus: makerDateLicensing,
    whatIsKnown: known.length ? known.slice(0, 8) : ["Broad subject identity needs stronger visual, text, or user-provided evidence."],
    whatIsStillUnknown: unknowns.length ? unknowns : [
      "Exact product identity",
      "Maker or manufacturer",
      "Date or era",
      "Licensing or authenticity",
      "Exact source-backed comparable match"
    ],
    identityConflicts: conflicts,
    identitySummary: identity.identitySummary || buildIdentitySummaryText({
      subjectIdentity: identity.subjectIdentity,
      subjectConfidence: identity.subjectConfidence,
      exactProductIdentity: identity.exactProductIdentity,
      makerIdentity: identity.makerIdentity,
      licensingStatus: identity.licensingStatus,
      authenticityStatus: identity.authenticityStatus
    })
  };
}

function buildVisualRecognitionReportFields(identity = {}) {
  const visual = normalizeVisualRecognition(identity.visualRecognition || {});
  const visualSubject = firstKnown(identity.visualSubject, visual.visualSubject, identity.subjectIdentity);
  const visualSubjectCategory = firstKnown(identity.visualSubjectCategory, visual.visualSubjectCategory, identity.category);
  const visualSubjectConfidence = normalizeIdentityConfidence(firstKnown(identity.visualSubjectConfidence, visual.visualSubjectConfidence, identity.subjectConfidence));
  const visualEvidence = mergeStringArrays(
    visual.visualEvidence,
    visual.distinctiveFeatures,
    visual.visibleLogos.map((item) => `Visible logo/symbol: ${item}`),
    visual.visibleLetters.map((item) => `Visible letter: ${item}`),
    visual.visibleWords.map((item) => `Visible word: ${item}`),
    visual.visibleColors.map((item) => `Visible color: ${item}`),
    10
  );
  let unknowns = normalizeStringArray(visual.stillUnknown, 8);
  if (!unknowns.length) {
    unknowns = [
      "Exact product identity",
      "Maker or artist",
      "Date or era",
      "Licensing or authenticity",
      "Comparable confidence",
      "Pricing confidence"
    ];
  }

  return {
    visualSubject: visualSubject || "Unknown visual subject",
    visualSubjectCategory: visualSubjectCategory || "Unknown",
    visualSubjectConfidence: visualSubjectConfidence || "Unclear",
    recognizedOrganization: firstKnown(identity.recognizedOrganization, visual.recognizedOrganization) || "Not verified",
    recognizedBrand: firstKnown(identity.recognizedBrand, visual.recognizedBrand) || "Not verified",
    recognizedCharacter: firstKnown(identity.recognizedCharacter, visual.recognizedCharacter) || "Not verified",
    recognizedInstitution: firstKnown(identity.recognizedInstitution, visual.recognizedInstitution) || "Not verified",
    recognizedTheme: firstKnown(identity.recognizedTheme, visual.recognizedTheme) || "Not verified",
    visualRecognitionEvidence: visualEvidence.length ? visualEvidence : ["No strong visual subject evidence was extracted. Add clearer full-item and close-up photos."],
    visualRecognitionUnknowns: unknowns,
    visualRecognitionConflicts: normalizeStringArray(visual.visualConflicts, 6),
    visualRecognitionSummary: buildVisualRecognitionSummaryText({
      visualSubject,
      visualSubjectCategory,
      visualSubjectConfidence,
      visual,
      unknowns
    })
  };
}

function buildVisualRecognitionSummaryText({ visualSubject, visualSubjectCategory, visualSubjectConfidence, visual, unknowns }) {
  const recognized = [
    formatKnownPart("organization", visual.recognizedOrganization),
    formatKnownPart("brand", visual.recognizedBrand),
    formatKnownPart("character", visual.recognizedCharacter),
    formatKnownPart("institution", visual.recognizedInstitution),
    formatKnownPart("theme", visual.recognizedTheme)
  ].filter(Boolean);
  const evidence = mergeStringArrays(visual.visualEvidence, visual.distinctiveFeatures, 4);
  return [
    `Visual Subject: ${visualSubject || "Unknown visual subject"}`,
    `Category: ${visualSubjectCategory || "Unknown"}`,
    `Confidence: ${visualSubjectConfidence || "Unclear"}`,
    recognized.length ? `Recognized clues: ${recognized.join("; ")}` : "",
    evidence.length ? `Supporting evidence: ${evidence.join("; ")}` : "",
    unknowns.length ? `Still unknown: ${unknowns.slice(0, 5).join("; ")}` : "",
    visual.userEvidenceReconciliation ? `User evidence reconciliation: ${visual.userEvidenceReconciliation}` : "",
    visual.visualSummary ? `Summary: ${visual.visualSummary}` : ""
  ].filter(Boolean).join(" | ");
}

function formatKnownPart(label, value) {
  const text = firstKnown(value);
  return text ? `${label}: ${text}` : "";
}

function isResaleIntent(value) {
  return /^(resale|both)$/i.test(cleanText(value));
}

function isPersonalUseIntent(value) {
  return /^personal_use$/i.test(cleanText(value));
}

function extractMoneyRange(text) {
  const amounts = [];
  const regex = /\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/g;
  let match;

  while ((match = regex.exec(String(text || ""))) !== null) {
    const amount = Number(match[1].replace(/,/g, ""));
    if (Number.isFinite(amount) && amount > 0 && amount < 100000) {
      amounts.push(amount);
    }
  }

  if (!amounts.length) {
    return null;
  }

  const low = Math.min(...amounts);
  const high = Math.max(...amounts);
  if (low === high) {
    return [low * 0.8, high * 1.2];
  }

  return [low, high];
}

function extractMoneyAmounts(text) {
  const amounts = [];
  const source = String(text || "");
  const patterns = [
    /\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/g,
    /(?:transport|freight|shipping|delivery|pickup|storage|repair|parts|disposal|dump|cleaning)\D{0,24}(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const amount = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(amount) && amount > 0 && amount < 100000) {
        amounts.push(amount);
      }
    }
  }

  return [...new Set(amounts)];
}

function roundMoney(value) {
  const step = value >= 25 ? 5 : 1;
  return Math.max(step, Math.round(value / step) * step);
}

function formatMoneyRange(low, high) {
  let roundedLow = Math.min(low, high);
  let roundedHigh = Math.max(low, high);

  if (roundedLow === roundedHigh) {
    roundedLow = Math.max(1, roundedLow - 1);
    roundedHigh += 1;
  }

  return `${formatMoney(roundedLow)}-${formatMoney(roundedHigh)}`;
}

function formatMoney(value) {
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function splitComparableItems(items) {
  const exactItems = [];
  const similarItems = [];
  let hasReliableMatch = false;

  for (const item of items) {
    if (/\bexact match\b|\blikely exact\b/i.test(item)) {
      exactItems.push(item);
      hasReliableMatch = true;
    } else {
      similarItems.push(item);
      if (/\bstrong similar match\b/i.test(item)) {
        hasReliableMatch = true;
      }
    }
  }

  return { exactItems, similarItems, hasReliableMatch };
}

function buildLiveSearchDidNotCompleteMessage(liveSearch) {
  const diagnostic = liveSearch.diagnostics || {};
  const details = [];
  if (diagnostic.openAIStatusCode) {
    details.push(`OpenAI status ${diagnostic.openAIStatusCode}`);
  }
  if (diagnostic.openAIErrorType) {
    details.push(`error type ${diagnostic.openAIErrorType}`);
  }
  if (diagnostic.openAIErrorCode) {
    details.push(`code ${diagnostic.openAIErrorCode}`);
  }

  const summary = diagnostic.openAIErrorMessage || liveSearch.searchEvidenceSummary || "No provider detail was returned.";
  const detailText = details.length ? ` Safe diagnostic: ${details.join(", ")}. ${summary}` : ` Safe diagnostic: ${summary}`;
  return `${liveSearch.liveSearchStatus}. Sources searched: None. Live search did not complete, so source-backed comps could not be retrieved.${detailText}`;
}

function buildAiOnlyRoughValueRange(report) {
  const valueRange = cleanText(report.aiOnlyRoughValueRange || report.estimatedMarketValue || "No reliable source-backed value range is available.");
  return ensurePrefix(valueRange, "AI-Only Rough Value Range - ");
}

function guardBuyerDecision(value, { reliableCompsFound, buyerIntake, resaleGuidance }) {
  const text = cleanText(value || "Need More Info - Buyer decision requires more item details.");
  if (reliableCompsFound) {
    return text;
  }

  if (!hasKnownValue(buyerIntake.asking_price)) {
    return `Need More Info - Current asking price is missing, and reliable source-backed comps are not available. ${stripDecisionLabel(text)}`;
  }

  if (isResaleIntent(buyerIntake.purchase_intent)) {
    const askingPrice = buyerIntake.parsed_asking_price;
    const ceiling = resaleGuidance.speculativeBuyCeiling;
    const exposureProfile = getDownsideExposureProfile({ buyerIntake, resaleGuidance });
    const lowDollarSpeculation = Number.isFinite(askingPrice)
      && askingPrice <= 25
      && (askingPrice <= 10 || (Number.isFinite(ceiling) && askingPrice <= ceiling))
      && !exposureProfile.hardFactors.length
      && !exposureProfile.hasHighAddedCost;
    if (lowDollarSpeculation) {
      return `Buy Here - Speculative Buy only at this very low price. Valuation remains uncertain, resale is not guaranteed, low price limits dollar exposure, and added transport, storage, repair, safety, disposal, or condition costs would change the decision. Do not extrapolate a high resale value from this Buy decision.`;
    }

    return `Pass - At the current asking price, reliable comps do not support a resale purchase. ${resaleGuidance.speculativeOfferText || "Need more information before considering a lower speculative offer."} ${stripDecisionLabel(text)}`;
  }

  if (/^buy here\b/i.test(text)) {
    return `Need More Info - Live source-backed comps are not available, so a Buy Here recommendation would be too confident unless personal-use value clearly justifies the price. ${stripDecisionLabel(text)}`;
  }

  return text;
}

function stripDecisionLabel(value) {
  return cleanText(value).replace(/^(Buy Here|Buy|Strong Buy|Cautious Buy|Speculative Buy|Buy with Conditions|Negotiate|Buy Elsewhere|Wait|Pass|Need More Info)\s*[-:]\s*/i, "").trim();
}

function ensureConfidenceLayer(value, fallbackLabel, fallbackReason) {
  const text = cleanText(value);
  if (/^(high|medium|low)\b/i.test(text)) {
    return text;
  }

  return `${fallbackLabel} - ${fallbackReason} Supports: submitted photos and notes. Weakens: missing or uncertain item details. Improve by verifying exact identifiers, condition, and source-backed comparable results.`;
}

function forceLowConfidence(value, reason) {
  const text = cleanText(value);
  const suffix = text.replace(/^(high|medium|low)\s*[-:]\s*/i, "");
  const detail = suffix || "Supports: photos and notes. Weakens: missing source-backed comparable evidence. Improve by finding exact, cited comparable matches.";
  return `Low - ${reason} ${detail}`.trim();
}

function forceMediumConfidence(value, reason) {
  const text = cleanText(value);
  const suffix = text.replace(/^(high|medium|low)\s*[-:]\s*/i, "");
  const detail = suffix || "Supports: very low current asking price and limited dollar exposure. Weakens: missing source-backed comparable evidence. Improve by verifying exact identity, condition, demand, and added costs.";
  return `Medium - ${reason} ${detail}`.trim();
}

function buildSearchCoverage(liveSearch) {
  if (!liveSearch.webSearchExecuted) {
    const targeted = liveSearch.sourcesTargeted && liveSearch.sourcesTargeted.length
      ? liveSearch.sourcesTargeted.join("; ")
      : "No source categories were selected.";
    return [
      "Sources searched: None.",
      "Live search did not complete before source results could be retrieved.",
      `Source categories targeted before failure: ${targeted}`
    ];
  }

  const queryText = liveSearch.searchQueries.join(" ").toLowerCase();
  const routeText = liveSearch.sourceRoute.join(" ").toLowerCase();
  const coverage = [
    `Source categories targeted: ${buildSourcesTargeted(liveSearch.sourceRoute).join("; ")}`
  ];

  if (liveSearch.sourcesSearched && liveSearch.sourcesSearched.length) {
    coverage.push(`Sources searched: ${summarizeSourceLabels(liveSearch.sourcesSearched).join("; ")}`);
  } else {
    coverage.push("Sources searched: Live web search executed, but the provider did not return a separate source list.");
  }

  if (liveSearch.sourcesReturned && liveSearch.sourcesReturned.length) {
    coverage.push(`Sources returned with URL citations: ${summarizeSourceLabels(liveSearch.sourcesReturned).join("; ")}`);
  } else {
    coverage.push("Sources returned with URL citations: None.");
  }

  if (liveSearch.liveSearchStatus === "Live Search Completed - No Reliable Comps Found") {
    coverage.push("No source-backed exact or strong similar matches passed match-quality checks.");
    coverage.push("Returned results were rejected when they lacked exact label/code matches, had only weak lookalike evidence, or did not include a cited URL in the comparable item text.");
  }

  if (/vintage|collectible|ceramic|cookie jar|container|canister|organization|logo|mascot|character|licensee|etsy|mercari|collector|resale/.test(routeText)) {
    coverage.push("Rejected irrelevant source categories: generic wholesalers, restaurant-supply sites, bulk import/manufacturing catalogs, unrelated current-retail lookalikes, and generic visual lookalikes.");
  }

  if (liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found") {
    coverage.push("Reliable cited sources: comparable-item cards include only URL-cited exact or strong similar resale/reference results.");
  }

  if (/\b\d{8,14}\b|sku|style|model|gab\d+/i.test(queryText)) {
    coverage.push("Searched using barcode/item code/model identifiers when available.");
  }

  if (/workshop|box|brand|title|label|tag|manufacturer/i.test(queryText)) {
    coverage.push("Searched using visible box, label, brand, or product-title wording.");
  }

  if (/santa|christmas|holiday|figurine|decor|dress|laptop|canister|ceramic|furniture/i.test(queryText)) {
    coverage.push("Searched using visual item description and category terms.");
  }

  if (/holiday|collectible|vintage|ceramic|etsy|mercari|collector|resale/.test(routeText)) {
    coverage.push("Searched relevant holiday decor / collectible sources.");
  }

  if (/manufacturer site|retailer|google shopping|amazon|major retail/.test(routeText)) {
    coverage.push("Searched retail/product sources.");
  }

  if (/fashion|apparel|poshmark/.test(routeText)) {
    coverage.push("Searched fashion resale/retail sources.");
  }

  if (/electronics|refurbished|best buy|newegg|model/.test(routeText)) {
    coverage.push("Searched electronics/model-number sources.");
  }

  if (/facebook|craigslist|offerup|local|furniture|consignment/.test(routeText)) {
    coverage.push("Searched local/bulky-item source categories where available.");
  }

  return coverage.length ? coverage : ["Searched source categories selected from the item details and buyer context."];
}

function buildSearchQueriesUsed(liveSearch) {
  if (!liveSearch.webSearchExecuted || !liveSearch.searchQueries.length) {
    return [];
  }

  return ["These are the queries the system used.", ...liveSearch.searchQueries];
}

function buildVisualPhrase(identity, notes) {
  const visualRecognition = normalizeVisualRecognition(identity.visualRecognition || {});
  return compactWords([
    identity.visualSubject,
    identity.visualSubjectCategory,
    visualRecognition.visualSubject,
    visualRecognition.visualSubjectCategory,
    firstKnown(identity.recognizedOrganization, visualRecognition.recognizedOrganization),
    firstKnown(identity.recognizedBrand, visualRecognition.recognizedBrand),
    firstKnown(identity.recognizedCharacter, visualRecognition.recognizedCharacter),
    normalizeStringArray(visualRecognition.visibleWords, 4).join(" "),
    normalizeStringArray(visualRecognition.visibleLetters, 4).join(" "),
    normalizeStringArray(visualRecognition.distinctiveFeatures, 4).join(" "),
    identity.size,
    identity.distinctiveVisualDescription,
    identity.color,
    identity.material,
    mostDistinctiveProductWord(identity.likelyItemDescription),
    mostDistinctiveCategoryWord(identity.category),
    inferVisualTerms(notes)
  ]);
}

function getVerifiedExactProductIdentity(value) {
  const text = cleanText(value);
  if (!hasKnownValue(text) || /^(unverified|unknown|not verified|no exact)/i.test(text)) {
    return "";
  }
  return text;
}

function buildCategoryPhrase(identity, routeText, notes) {
  const terms = [
    mostDistinctiveProductWord(identity.productNameOrBoxTitle),
    mostDistinctiveCategoryWord(identity.category),
    inferSourceIntentTerms(routeText),
    inferVisualTerms(notes)
  ];
  return compactWords(terms);
}

function inferSourceIntentTerms(routeText) {
  if (/furniture|local|craigslist|offerup|consignment/.test(routeText)) {
    return "local resale furniture";
  }
  if (/electronics|refurbished|best buy|newegg|model/.test(routeText)) {
    return "model specs price refurbished";
  }
  if (/fashion|apparel|poshmark/.test(routeText)) {
    return "dress fashion style size";
  }
  if (/holiday|collectible|vintage|ceramic|etsy|mercari|collector/.test(routeText)) {
    return "holiday collectible decor figurine";
  }
  if (/brand|manufacturer|retailer|amazon|major retail/.test(routeText)) {
    return "retail product price";
  }
  return "price resale value";
}

function isSeasonalDecorIdentity(identity, routeText, notesText) {
  const haystack = [
    routeText,
    notesText,
    identity.category,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.manufacturerLocationText,
    identity.brandSeries,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    identity.visualSubject,
    identity.visualSubjectCategory,
    identity.recognizedOrganization,
    identity.recognizedBrand,
    identity.recognizedCharacter,
    identity.recognizedInstitution,
    identity.recognizedTheme,
    identity.visualRecognition?.visualStyle,
    identity.visualRecognition?.estimatedEraStyle,
    Array.isArray(identity.visualRecognition?.visibleLogos) ? identity.visualRecognition.visibleLogos.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visibleLetters) ? identity.visualRecognition.visibleLetters.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visibleWords) ? identity.visualRecognition.visibleWords.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visibleColors) ? identity.visualRecognition.visibleColors.join(" ") : "",
    Array.isArray(identity.visualRecognition?.distinctiveFeatures) ? identity.visualRecognition.distinctiveFeatures.join(" ") : "",
    Array.isArray(identity.visualRecognition?.visualEvidence) ? identity.visualRecognition.visualEvidence.join(" ") : "",
    Array.isArray(identity.visualIdentityEvidence) ? identity.visualIdentityEvidence.join(" ") : "",
    Array.isArray(identity.textIdentityEvidence) ? identity.textIdentityEvidence.join(" ") : "",
    Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : ""
  ].join(" ").toLowerCase();

  return /santa|christmas|holiday|seasonal|workshop|hubbard|boxed|figurine|ceramic.*figure|resin.*figure|decor/.test(haystack)
    && !/laptop|computer|electronics|dress|apparel|fashion|furniture|sofa|chair|table/.test(haystack);
}

function isOrganizationCollectibleIdentity(identity, routeText, notesText) {
  const haystack = [
    routeText,
    notesText,
    identity.category,
    identity.subjectIdentity,
    identity.userProvidedIdentity,
    identity.exactProductIdentity,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.manufacturerLocationText,
    identity.brandSeries,
    identity.teamName,
    identity.schoolName,
    identity.mascot,
    identity.licensingStickerText,
    identity.copyrightWording,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    Array.isArray(identity.visualIdentityEvidence) ? identity.visualIdentityEvidence.join(" ") : "",
    Array.isArray(identity.textIdentityEvidence) ? identity.textIdentityEvidence.join(" ") : "",
    Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : ""
  ].join(" ").toLowerCase();

  return /institution|organization|university|college|government|corporation|brand|officially licensed|license|licensing|team|school|mascot|logo|character|athletics|sports logo|school colors/.test(haystack)
    && /ceramic|cookie jar|container|canister|decor|collectible|mascot|figurine|lid|lidded/.test(haystack);
}

function inferVisualTerms(text) {
  const lower = String(text || "").toLowerCase();
  const terms = [];
  const candidates = [
    ["santa", "Santa Claus"],
    ["christmas", "Christmas"],
    ["holiday", "holiday decor"],
    ["figurine", "figurine"],
    ["green box", "green box"],
    ["red suit", "red suit"],
    ["tree", "tree"],
    ["collegiate", "institutional collectible"],
    ["officially licensed", "officially licensed"],
    ["mascot", "mascot"],
    ["cookie jar", "cookie jar"],
    ["dress", "dress"],
    ["laptop", "laptop"],
    ["canister", "canister set"],
    ["container", "container"],
    ["ceramic", "ceramic"],
    ["furniture", "furniture"]
  ];

  for (const [needle, value] of candidates) {
    if (lower.includes(needle)) {
      terms.push(value);
    }
  }

  const sizeMatch = String(text || "").match(/\b\d+(?:\.\d+)?\s?(?:inch|inches|in\.|")\b/i);
  if (sizeMatch) {
    terms.unshift(sizeMatch[0].replace(/"/, " inch"));
  }

  return terms.join(" ");
}

function extractSpecs(text) {
  return normalizeTokenString(String(text || "").match(/\b(?:i[3579]|ryzen\s?\d|m[1234]|16gb|8gb|32gb|256gb|512gb|1tb|ssd|hdd)\b/gi)?.join(" ") || "");
}

function extractPrice(text) {
  const match = String(text || "").match(/\$\s?\d+(?:\.\d{2})?/);
  return match ? match[0].replace(/\s+/, "") : "";
}

function firstKnown(...values) {
  return values.map(cleanText).find(hasKnownValue) || "";
}

function compactWords(parts) {
  return cleanSearchQuery(parts.filter(hasKnownValue).join(" "));
}

function cleanSearchQuery(value) {
  const text = normalizeTokenString(value)
    .replace(/\b(unknown|n\/a|none|not visible)\b/gi, "")
    .replace(/\b([A-Za-z0-9']+\s+[A-Za-z0-9']+)(\s+\1\b)+/gi, "$1")
    .replace(/\b(\w+)(\s+\1\b)+/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return trimQueryTerms(text, 10);
}

function normalizeTokenString(value) {
  return String(value || "")
    .replace(/[|[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimQueryTerms(text, maxTerms) {
  const terms = text.split(/\s+/).filter(Boolean);
  return terms.slice(0, maxTerms).join(" ");
}

function mostDistinctiveProductWord(text) {
  const cleaned = normalizeTokenString(text);
  if (!cleaned) {
    return "";
  }

  const words = cleaned.split(/\s+/).filter((word) => !/^(the|and|with|for|item|unknown|decoration|decor)$/i.test(word));
  return words.slice(0, 5).join(" ") || cleaned;
}

function mostDistinctiveCategoryWord(text) {
  const cleaned = normalizeTokenString(text);
  if (!cleaned) {
    return "";
  }

  if (/santa|christmas|holiday/i.test(cleaned)) {
    return "Santa Claus holiday decor collectible figurine";
  }
  if (/dress|apparel|fashion/i.test(cleaned)) {
    return "dress fashion style";
  }
  if (/laptop|computer|electronics/i.test(cleaned)) {
    return "laptop model specs";
  }
  if (/institution|organization|collegiate|college|university|mascot|logo|character|sports logo|licensed|cookie jar|container/i.test(cleaned)) {
    return "organization logo mascot collectible decor";
  }
  if (/canister|ceramic/i.test(cleaned)) {
    return "ceramic canister set pattern lids";
  }
  if (/furniture|sofa|chair|table|dresser/i.test(cleaned)) {
    return "local resale furniture";
  }

  return trimQueryTerms(cleaned, 5);
}

function isRepetitiveQuery(query, existingQueries) {
  const normalized = query.toLowerCase();
  const tokens = new Set(normalized.split(/\s+/).filter(Boolean));
  for (const existing of existingQueries) {
    const existingTokens = new Set(existing.toLowerCase().split(/\s+/).filter(Boolean));
    const overlap = [...tokens].filter((token) => existingTokens.has(token)).length;
    const smaller = Math.min(tokens.size, existingTokens.size) || 1;
    if (normalized === existing.toLowerCase() || overlap / smaller > 0.9) {
      return true;
    }
  }
  return false;
}

function createOpenAIRequestError({ statusCode = null, type = "", code = "", message = "OpenAI API request failed.", category = "provider_error", timedOut = false, cause = null }) {
  const error = new Error(sanitizeErrorText(message));
  error.openAIStatusCode = statusCode;
  error.openAIErrorType = sanitizeErrorText(type);
  error.openAIErrorCode = sanitizeErrorText(code);
  error.openAIErrorMessage = sanitizeErrorText(message);
  error.liveSearchErrorCategory = category;
  error.timedOut = timedOut;
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function classifyOpenAIErrorDetails({ statusCode, type, code, message }) {
  const haystack = [type, code, message].map((value) => String(value || "").toLowerCase()).join(" ");

  if (statusCode === 429 || /rate|quota|billing|insufficient_quota/.test(haystack)) {
    return "rate_limit_or_quota";
  }

  if (/web_search|tool|tool_choice|model|unsupported|not supported|does not support|unknown parameter|invalid.*include/.test(haystack)) {
    return "unsupported_tool_or_model";
  }

  if (statusCode) {
    return "provider_error";
  }

  return "unknown_live_search_error";
}

function classifyLiveSearchError(error) {
  const category = error.liveSearchErrorCategory || classifyOpenAIErrorDetails({
    statusCode: error.openAIStatusCode,
    type: error.openAIErrorType,
    code: error.openAIErrorCode,
    message: error.message
  });
  const message = sanitizeErrorText(error.openAIErrorMessage || error.message || "Live search failed before source results could be retrieved.");

  return {
    category,
    statusCode: error.openAIStatusCode || null,
    type: sanitizeErrorText(error.openAIErrorType || ""),
    code: sanitizeErrorText(error.openAIErrorCode || ""),
    message,
    userMessage: message
  };
}

function statusForLiveSearchError(category) {
  if (category === "timeout") {
    return "Live Search Unavailable - Timeout";
  }

  if (category === "unsupported_tool_or_model") {
    return "Live Search Unavailable - Unsupported Tool/Model";
  }

  if (category === "provider_error" || category === "rate_limit_or_quota") {
    return "Live Search Unavailable - Provider Error";
  }

  return "Live Search Unavailable - AI Reasoning Only";
}

function isIncludeCompatibilityError(error) {
  const text = [
    error.openAIErrorType,
    error.openAIErrorCode,
    error.openAIErrorMessage,
    error.message
  ].map((value) => String(value || "").toLowerCase()).join(" ");

  return /include|web_search_call\.action\.sources|unknown parameter|invalid.*include|unsupported.*include/.test(text);
}

function sanitizeErrorText(value) {
  return cleanText(value)
    .replace(/sk-[A-Za-z0-9_-]+/g, "[redacted-api-key]")
    .replace(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi, "[redacted-image-data]")
    .slice(0, 240);
}

function collectUrlCitations(data) {
  const citations = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      for (const annotation of content.annotations || []) {
        if (annotation.type === "url_citation" && annotation.url) {
          citations.push({
            url: normalizeUrl(annotation.url),
            title: cleanText(annotation.title || annotation.url)
          });
        }
      }
    }
  }
  return citations;
}

function collectWebSearchCalls(data) {
  return (data.output || []).filter((item) => item.type === "web_search_call");
}

function collectWebSearchSources(data) {
  const sources = [];
  for (const call of collectWebSearchCalls(data)) {
    const actionSources = call.action && Array.isArray(call.action.sources) ? call.action.sources : [];
    for (const source of actionSources) {
      const normalized = normalizeSourceEntry(source);
      if (normalized) {
        sources.push(normalized);
      }
    }
  }

  return [...new Set(sources)].slice(0, 8);
}

function summarizeSourceLabels(sources) {
  return [...new Set(sources.map(sourceLabel).filter(Boolean))].slice(0, 8);
}

function sourceLabelFromCitation(citation) {
  return sourceLabel(citation.title || citation.url);
}

function sourceLabel(value) {
  const text = cleanText(value);
  if (!text) {
    return "";
  }

  const url = extractUrls(text)[0];
  if (url && text === url) {
    return hostnameFromUrl(url);
  }

  if (url) {
    return cleanText(text.replace(url, "").replace(/[()]/g, ""));
  }

  return text.length > 80 ? `${text.slice(0, 77)}...` : text;
}

function normalizeSourceEntry(source) {
  if (typeof source === "string") {
    return sourceLabel(source);
  }

  const title = cleanText(source.title || source.name || source.source || source.site || "");
  const url = cleanText(source.url || source.link || "");

  return sourceLabel(title || url);
}

function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function buildSourcesTargeted(sourceRoute) {
  return normalizeStringArray(sourceRoute, 8);
}

function hasCitedUrl(text, citations) {
  if (!citations.length) {
    return false;
  }

  const urls = extractUrls(text).map(normalizeUrl);
  return urls.some((url) => citations.some((citation) => url === citation.url || url.startsWith(citation.url) || citation.url.startsWith(url)));
}

function isRejectedWeakComparableItem(text) {
  return /restaurant[\s-]?supply|webstaurant|wholesale|bulk import|import catalog|manufacturing catalog|manufacturer catalog|alibaba|ali\s?express|made-in-china|global sources|dhgate|unrelated current retail|generic visual lookalike/i.test(String(text || ""));
}

function extractUrls(text) {
  return String(text || "").match(/https?:\/\/[^\s)]+/g) || [];
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/[.,;]+$/, "");
}

function normalizeStringArray(value, maxItems, fallback = []) {
  const items = Array.isArray(value) ? value : fallback;
  return items.map(cleanText).filter(Boolean).slice(0, maxItems);
}

function hasKnownValue(value) {
  const text = cleanText(value);
  return Boolean(text && !/^unknown|n\/a|none|not visible$/i.test(text));
}

function ensurePrefix(value, prefix) {
  const text = cleanText(value);
  if (text.toLowerCase().startsWith(prefix.toLowerCase())) {
    return text;
  }
  return `${prefix} ${text}`.trim();
}

function extractOutputText(data) {
  if (typeof data.output_text === "string") {
    return data.output_text;
  }

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseBody(body) {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }

  return body || {};
}
