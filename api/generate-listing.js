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
      maxItems: 20,
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
      maxItems: 14,
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
      maxItems: 24,
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
      maxItems: 12,
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
    "strongComparables",
    "partialComparables",
    "referenceResults",
    "weakMatches",
    "rejectedMatches",
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
    strongComparables: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string" }
    },
    partialComparables: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    referenceResults: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    weakMatches: {
      type: "array",
      minItems: 0,
      maxItems: 8,
      items: { type: "string" }
    },
    rejectedMatches: {
      type: "array",
      minItems: 0,
      maxItems: 8,
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
  conditionRiskDowngradeCount: 2,
  lowDollarCautiousBuyMax: 25,
  modestDollarCautiousBuyMax: 75,
  cautiousBuyMaxRatio: 0.78,
  activeListingReferenceMaxCount: 6
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
    const analysisId = cleanText(body.analysisId || createServerAnalysisId()).slice(0, 120);

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

    const safeReport = sanitizeClientVisiblePayload({
      ...report,
      analysisId
    });

    if (reportType === "marketValue") {
      return res.status(200).json({ valuation: safeReport });
    }

    return res.status(200).json({ listing: safeReport });
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
    answer: sanitizeClientVisiblePayload(normalizeAskAnswer(answer, { answerType, scenario }))
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
    "For questions about search activity, answer from searchDiagnostics fields such as allowedDomainsRequested, providerRequestRecords, providerCallsSucceeded, domainsActuallyReturned, providerSourceCount, retainedVisibleResultCount, and rejectedCandidateCount. Distinguish a targeted domain from a provider call, a returned URL domain, and a retained comparable record.",
    "Clearly separate Visual Evidence, User-Provided Information, Search Evidence, Comparable Evidence, System Inference, Scenario Assumption, and Unknown or Unverified when those labels improve clarity.",
    "Preserve the current report's valuationEvidenceState. If it is preliminary, call the range a Preliminary Reference Range, not Estimated Fair Value or Fair Market Value.",
    "If asked what it is worth and evidence is insufficient, say: The current search suggests a preliminary reference range from similar active listings, but fair market value is not established because no strong or confirmed sold comparables were found.",
    "Never convert active asking prices, loose similar items, category-level references, or AI-only reasoning into a confident value rating or confirmed fair-market-value estimate.",
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
    "analysisId",
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

  const text = cleanText(value).replace(/\\n/g, " ").slice(0, 1400);
  if (isInternalPromptFragment(text)) {
    return null;
  }
  return text ? text : null;
}

function createServerAnalysisId() {
  return `analysis-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sanitizeClientVisiblePayload(value, key = "") {
  if (key === "researchPromptInternal") {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizeClientVisiblePayload(item, key))
      .filter((item) => item !== undefined && item !== null && item !== "");
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      if (isSensitiveClientFieldName(childKey)) {
        continue;
      }
      const sanitized = sanitizeClientVisiblePayload(childValue, childKey);
      if (sanitized !== undefined && sanitized !== null && sanitized !== "") {
        result[childKey] = sanitized;
      }
    }
    return result;
  }
  if (typeof value !== "string") {
    return value;
  }
  const text = cleanText(value.replace(/\\n/g, " "));
  if (!text || isInternalPromptFragment(text)) {
    return "";
  }
  return text;
}

function isSensitiveClientFieldName(key) {
  return /researchPromptInternal|systemPrompt|developerPrompt|promptTemplate|authorization|headers|apiKey|secret|environment/i.test(String(key || ""));
}

function isInternalPromptFragment(value) {
  const text = cleanText(value).toLowerCase();
  if (!text) {
    return false;
  }
  return /perform source-routed live comparable search|use web_search for this one exact query|you are a live comparable search controller|you are a query-bound live comparable search executor|return only structured json|tool_choice|authorization\s*:|bearer\s+sk-|process\.env|openai_api_key|open_api_key|developer instructions|system instructions|research prompt bodies|literal prompt templates/.test(text);
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
  const classified = report.valuationEvidenceState
    ? {
        state: cleanText(report.valuationEvidenceState),
        range: extractValuationEvidenceRange(report)
      }
    : classifyValuationEvidence({ report });
  const fairRange = extractMoneyRange([
    report.preliminaryReferenceRange,
    report.fairValueNotEstablished,
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

  if (classified.state !== "supported") {
    const rangeText = classified.range || formatMoneyRange(fairRange[0], fairRange[1]);
    if (workflow === "personal_use" || isPersonalUseIntent(buyerIntent)) {
      return `At $${proposedPrice}, compare the scenario only to the current preliminary reference range of ${rangeText}. The price may be favorable relative to similar active listings, but there is not enough reliable evidence for a confident Buy recommendation.`;
    }
    return `At $${proposedPrice}, use reseller caution because the available range is preliminary reference evidence only (${rangeText}), not verified fair market value or confirmed sold-comps support.`;
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
        "Preserve all meaningful visible wording from every uploaded image, including front text, back text, slogans, event names, dates, named people, copyright lines, manufacturer/location text, dimensions, licensing language, and collector-edition wording.",
        "When multiple photos are provided, merge the evidence across photos before summarizing. Do not let a front-photo clue replace or discard a back-label clue.",
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
        "Preserve searchable text exactly when visible. Do not collapse label text into generic terms if a brand, series, city/state, SKU, UPC, item code, slogan, event name, organization/team, named person, year, dimension, or reverse-side description appears.",
        "For branded collectibles, advertising/promotional items, sports memorabilia, commemorative items, collector plates/trays, toys, books, art, tools, and appliances, preserve exact visible phrase combinations because they are usually stronger search keys than generic category descriptions.",
        "For multi-photo items, merge front wording, reverse wording, side labels, tags, stamps, and visual form into one identity record. Do not treat one photo independently if another photo supplies stronger exact text.",
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
  const requestStartedAtMs = Date.now();
  const queriesPrioritized = buildDomainDirectedSearchPlan({ searchQueries, sourceRoute, identity, buyerIntake, notes });
  const providerRequestRecords = [];
  const providerResponseSummaries = [];
  const providerErrors = [];
  const responseDataList = [];
  const resultList = [];
  const safeRawResultSummaries = [];
  const providerSourceRecords = [];
  let includeSourcesRequested = true;
  let includeFallbackReason = "";
  let searchControlsSupported = true;
  let searchControlsFallbackReason = "";

  for (const queryRecord of queriesPrioritized) {
    const requestRecord = {
      query: queryRecord.query,
      priority: queryRecord.priority,
      searchPass: queryRecord.searchPass,
      sourceRoute: queryRecord.sourceRoute,
      allowedDomainsRequested: queryRecord.allowedDomains,
      allowedDomainsApplied: Boolean(queryRecord.allowedDomains?.length),
      provider: "OpenAI web_search",
      attempted: true,
      succeeded: false,
      providerSourceCount: 0,
      domainsReturned: [],
      sourceURLsReturned: [],
      rawResultCount: 0,
      parsedResultCount: 0,
      normalizedResultCount: 0,
      retainedResultCount: 0,
      errorCode: "",
      failureStage: "provider_request_failure"
    };
    providerRequestRecords.push(requestRecord);

    try {
      const payload = createQueryBoundLiveSearchPayload({
        model,
        platform,
        notes,
        identity,
        sourceRoute,
        queryRecord,
        buyerIntake,
        researchPurpose,
        includeSources: includeSourcesRequested,
        useSearchControls: searchControlsSupported
      });
      let response;
      try {
        response = await requestOpenAIJson({ apiKey, payload });
      } catch (error) {
        if (!isWebSearchOptionCompatibilityError(error)) {
          throw error;
        }

        if (isIncludeCompatibilityError(error)) {
          includeSourcesRequested = false;
          includeFallbackReason = "Source include was not accepted by the provider; query-bound live search was retried without source-list include.";
        }
        if (isSearchControlCompatibilityError(error)) {
          searchControlsSupported = false;
          searchControlsFallbackReason = "Search controls such as allowed domain filters or search_context_size were not accepted by the provider; the request was retried without those controls.";
        }
        requestRecord.allowedDomainsApplied = searchControlsSupported && Boolean(queryRecord.allowedDomains?.length);
        response = await requestOpenAIJson({
          apiKey,
          payload: createQueryBoundLiveSearchPayload({
            model,
            platform,
            notes,
            identity,
            sourceRoute,
            queryRecord,
            buyerIntake,
            researchPurpose,
            includeSources: includeSourcesRequested,
            useSearchControls: searchControlsSupported
          })
        });
      }

      const { json, data, statusCode } = response;
      const citations = collectUrlCitations(data);
      const webSearchCalls = collectWebSearchCalls(data);
      const sourceRecords = collectWebSearchSourceRecords(data, queryRecord);
      const sourceBackfillRecords = sourceRecords.length ? [] : citations.map((citation) => sourceRecordFromCitation(citation, queryRecord));
      const requestSourceRecords = [...sourceRecords, ...sourceBackfillRecords];
      const rawSummaries = collectSafeRawResultSummaries({
        result: json,
        citations,
        searchQueries: [queryRecord.query],
        queriesActuallySent: [queryRecord.query]
      }).map((summary) => ({ ...summary, query: queryRecord.query }));
      const bucketedResearch = buildResearchResultBuckets(json, normalizeStringArray(json.comparableItemsFound, 8), citations, identity);
      const normalization = bucketedResearch.normalizationDiagnostics || {};
      const domainsReturned = summarizeSourceLabels(requestSourceRecords.map((record) => record.domain).filter(Boolean));
      const sourceURLsReturned = [...new Set(requestSourceRecords.map((record) => record.url).filter(Boolean))].slice(0, 20);

      requestRecord.succeeded = webSearchCalls.length > 0;
      requestRecord.providerSourceCount = requestSourceRecords.length;
      requestRecord.domainsReturned = domainsReturned;
      requestRecord.sourceURLsReturned = sourceURLsReturned;
      requestRecord.rawResultCount = rawSummaries.length;
      requestRecord.parsedResultCount = Number(normalization.parsedResultCount || 0);
      requestRecord.normalizedResultCount = Number(normalization.normalizedResultCount || 0);
      requestRecord.retainedResultCount = Number(normalization.retainedVisibleResultCount || 0);
      requestRecord.failureStage = classifySearchFailureStage({
        providerCallsSucceeded: webSearchCalls.length,
        rawResultCount: requestRecord.providerSourceCount || requestRecord.rawResultCount,
        parsedResultCount: requestRecord.parsedResultCount,
        normalizedResultCount: requestRecord.normalizedResultCount,
        retainedVisibleResultCount: requestRecord.retainedResultCount,
        rejectedResultCount: Number(normalization.rejectedResultCount || 0),
        providerErrors: []
      });
      requestRecord.errorCode = "";

      resultList.push(json);
      responseDataList.push(data);
      safeRawResultSummaries.push(...rawSummaries);
      providerSourceRecords.push(...requestSourceRecords);
      providerResponseSummaries.push({
        query: queryRecord.query,
        priority: queryRecord.priority,
        searchPass: queryRecord.searchPass,
        provider: "OpenAI web_search",
        allowedDomainsRequested: queryRecord.allowedDomains,
        allowedDomainsApplied: requestRecord.allowedDomainsApplied,
        statusCode,
        webSearchCallAppeared: webSearchCalls.length > 0,
        urlCitationCount: citations.length,
        providerSourceCount: requestSourceRecords.length,
        sourceURLsReturned,
        domainsReturned,
        providerActionQueries: collectWebSearchActionQueries(webSearchCalls).filter((query) => !isInternalPromptFragment(query)).slice(0, 4)
      });
    } catch (error) {
      const diagnostic = classifyLiveSearchError(error);
      requestRecord.succeeded = false;
      requestRecord.errorCode = diagnostic.code || diagnostic.type || diagnostic.category || "provider_error";
      requestRecord.failureStage = diagnostic.category === "timeout" ? "provider_request_failure" : "provider_request_failure";
      providerErrors.push({
        ...diagnostic,
        query: queryRecord.query,
        priority: queryRecord.priority
      });
      providerResponseSummaries.push({
        query: queryRecord.query,
        priority: queryRecord.priority,
        searchPass: queryRecord.searchPass,
        provider: "OpenAI web_search",
        allowedDomainsRequested: queryRecord.allowedDomains,
        allowedDomainsApplied: requestRecord.allowedDomainsApplied,
        statusCode: diagnostic.statusCode || null,
        webSearchCallAppeared: false,
        urlCitationCount: 0,
        providerSourceCount: 0,
        sourceURLsReturned: [],
        domainsReturned: [],
        errorCode: requestRecord.errorCode,
        errorMessage: diagnostic.message
      });
    }
  }

  const successfulRecords = providerRequestRecords.filter((record) => record.succeeded);
  if (!successfulRecords.length) {
    return buildUnavailableLiveSearchResult({
      error: providerErrors[0] || new Error("Live search failed before source results could be retrieved."),
      sourceRoute,
      searchQueries,
      queriesPrioritized,
      providerRequestRecords,
      providerResponseSummaries,
      searchStartedAt,
      elapsedMs: Date.now() - requestStartedAtMs,
      includeSourcesRequested,
      includeFallbackReason,
      searchControlsFallbackReason,
      providerErrors
    });
  }

  return normalizeLiveSearchResult({
    result: mergeLiveSearchResults(resultList),
    responseData: mergeResponseData(responseDataList),
    identity,
    searchStartedAt,
    sourceRoute,
    searchQueries,
    queriesActuallySent: providerRequestRecords.filter((record) => record.attempted).map((record) => record.query),
    queriesPrioritized,
    providerRequestRecords,
    providerResponseSummaries,
    providerErrors,
    providerSourceRecords,
    safeRawResultSummaries,
    elapsedMs: Date.now() - requestStartedAtMs,
    statusCode: providerResponseSummaries.find((item) => item.statusCode)?.statusCode || null,
    includeSourcesRequested,
    includeFallbackReason,
    searchControlsFallbackReason
  });
}

function createQueryBoundLiveSearchPayload({ model, platform, notes, identity, sourceRoute, queryRecord, buyerIntake, researchPurpose, includeSources = true, useSearchControls = true }) {
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const purposeText = researchPurpose === "listing"
    ? "Generate Listing price-support research."
    : "Worth Buying buyer-decision research.";
  const researchPromptInternal = [
    "Use web_search for this one exact query only.",
    "Do not replace the query with the whole instruction block.",
    "Do not invent URLs, prices, sources, sold comps, or platforms.",
    "Never describe active asking prices as confirmed sold prices.",
    "Classify identity match separately from price evidence type.",
    "Return only source-backed URL results that came from this query, and put weak or irrelevant URL-cited results in rejectedMatches with reasons."
  ].join(" ");
  const tool = { type: "web_search" };
  if (useSearchControls) {
    tool.search_context_size = "medium";
    if (queryRecord.allowedDomains?.length) {
      tool.filters = {
        allowed_domains: queryRecord.allowedDomains
      };
    }
  }
  const payload = {
    model,
    tools: [tool],
    tool_choice: "required",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are a query-bound live comparable search executor. Search exactly the supplied query and return structured JSON."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: [
              researchPromptInternal,
              `Research purpose: ${purposeText}`,
              `Search query to execute exactly: ${queryRecord.query}`,
              `Search pass: ${queryRecord.searchPass}`,
              queryRecord.allowedDomains?.length
                ? `Allowed domains requested: ${queryRecord.allowedDomains.join(", ")}`
                : "Allowed domains requested: none (open web search).",
              `Query priority: ${queryRecord.priority}`,
              `Source route requested: ${JSON.stringify(sourceRoute)}`,
              `Marketplace platform context: ${platform || "No platform selected"}`,
              `Buyer item notes: ${notes || "No additional notes provided."}`,
              "Guided Buyer Intake:",
              buyerIntakeText,
              `Extracted identity: ${JSON.stringify(identity)}`,
              "Return every source-backed result reviewed in the correct visibility bucket: strongComparables, partialComparables, referenceResults, weakMatches, or rejectedMatches.",
              "Each result string must include source/platform/site, title, visible price if any, URL, match quality, price evidence type, and why it matches or was rejected."
            ].join("\n")
          }
        ]
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

  if (includeSources) {
    payload.include = ["web_search_call.action.sources"];
  }

  return payload;
}

function buildPrioritizedQueryRecords(searchQueries = [], sourceRoute = []) {
  return buildDomainDirectedSearchPlan({ searchQueries, sourceRoute });
}

function buildDomainDirectedSearchPlan({ searchQueries = [], sourceRoute = [], identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "" } = {}) {
  const sourceCategories = buildSourcesTargeted(sourceRoute);
  const context = buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const marketplaceDomains = selectMarketplaceAllowedDomains(context, sourceRoute, buyerIntake);
  const cleanedQueries = [];
  for (const query of searchQueries) {
    const cleaned = cleanSearchQuery(removeUnsupportedQueryDescriptors(query, context), 12);
    if (cleaned && !isInternalPromptFragment(cleaned) && !isRepetitiveQuery(cleaned, cleanedQueries)) {
      cleanedQueries.push(cleaned);
    }
  }

  const exactQueries = cleanedQueries.filter((query) => isHighValueExactQuery(query, context));
  const marketplaceSeedQueries = cleanedQueries.filter((query) => isMarketplaceUsefulQuery(query, context));
  const fallbackQueries = cleanedQueries.filter((query) => !exactQueries.includes(query));
  const records = [];

  const addRecord = ({ query, searchPass, allowedDomains = [] }) => {
    const domainKey = allowedDomains.join("|").toLowerCase();
    if (!query || records.some((record) => (
      queriesAreSemanticallySame(record.query, query)
        && (record.allowedDomains || []).join("|").toLowerCase() === domainKey
    ))) {
      return;
    }
    records.push({
      query,
      priority: records.length + 1,
      searchPass,
      sourceRoute: sourceCategories,
      allowedDomains
    });
  };

  mergeStringArrays(exactQueries, cleanedQueries, 6).slice(0, 4).forEach((query) => {
    addRecord({ query, searchPass: "open_web_exact" });
  });

  if (marketplaceDomains.length) {
    mergeStringArrays(exactQueries, marketplaceSeedQueries, cleanedQueries, 6).slice(0, 3).forEach((query) => {
      addRecord({ query, searchPass: "marketplace_domain", allowedDomains: marketplaceDomains });
    });
  }

  mergeStringArrays(fallbackQueries, cleanedQueries, 4).slice(0, 2).forEach((query) => {
    addRecord({ query, searchPass: "broader_fallback" });
  });

  return records.slice(0, 8).map((record, index) => ({
    ...record,
    priority: index + 1
  }));
}

function selectMarketplaceAllowedDomains(context = {}, sourceRoute = [], buyerIntake = normalizeBuyerIntake({})) {
  const routeText = sourceRoute.join(" ").toLowerCase();
  const haystack = [
    context.routeText,
    routeText,
    buyerIntake.purchase_context,
    buyerIntake.purchase_intent,
    context.itemType,
    context.visualCategory,
    context.categoryPhrase,
    context.productTitle,
    context.subjectIdentity
  ].join(" ").toLowerCase();

  if (/apparel|fashion|dress|shirt|jacket|shoe|poshmark|depop/.test(haystack)) {
    return ["poshmark.com", "ebay.com", "mercari.com", "depop.com"];
  }
  if (/electronics|laptop|computer|phone|tablet|camera|refurb|model specs/.test(haystack)) {
    return ["ebay.com", "bestbuy.com", "walmart.com", "amazon.com", "newegg.com"];
  }
  if (/furniture|sofa|chair|table|dresser|cabinet|local pickup|facebook marketplace|craigslist|offerup|bulky/.test(haystack)) {
    return ["facebook.com", "craigslist.org", "offerup.com", "ebay.com"];
  }
  if (/vintage|collectible|memorabilia|commemorative|advertising|promotional|sports|team|school|mascot|licensed|collector|tray|serving tray|plate|plaque|tin|sign|holiday|christmas|santa|ceramic|canister|cookie jar|etsy|mercari|worthpoint|picclick/.test(haystack)) {
    return ["ebay.com", "etsy.com", "mercari.com", "worthpoint.com", "picclick.com"];
  }
  if (/retail|manufacturer|brand site|shopping|new with tags|sku|upc|barcode/.test(haystack)) {
    return ["amazon.com", "walmart.com", "target.com", "ebay.com"];
  }
  return [];
}

function isHighValueExactQuery(query, context = {}) {
  const text = cleanText(query);
  if (!text) return false;
  return /"[^"]{4,}"/.test(text)
    || context.upc && text.includes(context.upc)
    || context.model && text.toLowerCase().includes(context.model.toLowerCase())
    || context.itemCode && text.toLowerCase().includes(context.itemCode.toLowerCase())
    || /(?:18|19|20)\d{2}|champion|national|official|collector|commemorative|licensed|slogan|team|school|coach|brand|tray|plate|sku|upc/i.test(text);
}

function isMarketplaceUsefulQuery(query, context = {}) {
  const text = cleanText(query).toLowerCase();
  const itemType = cleanText(context.itemType).toLowerCase();
  return isHighValueExactQuery(query, context)
    || text.includes(itemType)
    || /brand|model|sku|upc|collector|vintage|resale|tray|plate|dress|laptop|furniture|canister/.test(text);
}

function queriesAreSemanticallySame(left, right) {
  const a = querySemanticSignature(left);
  const b = querySemanticSignature(right);
  if (!a || !b) return false;
  if (a === b) return true;
  const aTokens = new Set(a.split(" "));
  const bTokens = new Set(b.split(" "));
  const overlap = [...aTokens].filter((token) => bTokens.has(token)).length;
  const smaller = Math.min(aTokens.size, bTokens.size) || 1;
  return overlap / smaller > 0.92;
}

function querySemanticSignature(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/["'’]/g, "")
    .replace(/\b(?:the|and|with|for|official|collector'?s?|collectible|vintage|used|item|listing|price|resale|ebay|etsy|mercari|worthpoint|picclick)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeLiveSearchResults(results = []) {
  const merged = {
    liveSearchStatus: "",
    comparableItemsFound: [],
    strongComparables: [],
    partialComparables: [],
    referenceResults: [],
    weakMatches: [],
    rejectedMatches: [],
    sourcesSearched: [],
    searchCoverage: [],
    noReliableMatchesReason: "",
    searchEvidenceSummary: "",
    searchQueriesUsed: []
  };

  for (const result of results) {
    for (const key of ["comparableItemsFound", "strongComparables", "partialComparables", "referenceResults", "weakMatches", "rejectedMatches", "sourcesSearched", "searchCoverage", "searchQueriesUsed"]) {
      merged[key].push(...normalizeStringArray(result?.[key], 24));
    }
    merged.noReliableMatchesReason = firstKnown(merged.noReliableMatchesReason, result?.noReliableMatchesReason);
    merged.searchEvidenceSummary = firstKnown(merged.searchEvidenceSummary, result?.searchEvidenceSummary);
  }

  for (const key of ["comparableItemsFound", "strongComparables", "partialComparables", "referenceResults", "weakMatches", "rejectedMatches", "sourcesSearched", "searchCoverage", "searchQueriesUsed"]) {
    merged[key] = [...new Set(merged[key])].slice(0, 24);
  }

  return merged;
}

function mergeResponseData(responseDataList = []) {
  return {
    output: responseDataList.flatMap((data) => Array.isArray(data?.output) ? data.output : [])
  };
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
    "Use valuation evidence states consistently: supported, preliminary, or insufficient.",
    "Use Estimated Fair Market Value only when exact or strong comparable evidence is sufficient. Use Preliminary Reference Range when evidence is weak, partial, active-listing-only, category-level, or AI-reasoning-only. Use Fair Value: Not established when no defensible range exists.",
    "If valueRating is Insufficient Evidence, do not label any field as Estimated Fair Value, Fair Market Value, Typical Selling Price, or Confirmed Value. Use Preliminary Reference Range or Fair Value: Not established instead.",
    "When active asking-price evidence is used, call it current active listings or results found during the current search. Never present active asking prices as confirmed sold evidence.",
    "recommendedOffer must include Opening Offer, Target Purchase Price, and Maximum Recommended Price when evidence supports those numbers.",
    "walkAwayPrice must be clear when evidence is sufficient. When evidence is weak, say the walk-away price is not supported yet.",
    "negotiationGuidance must be honest buyer-facing language. Do not encourage dishonest claims or pretend a lower comp exists unless source-backed results support it.",
    "reasonsToBuy and reasonsForCaution must be specific to the available evidence, not generic praise or generic warnings.",
    "productOrConditionRisks and riskFlags must show only supported risks such as Identity Not Confirmed, Price Above Market, Missing Parts, Condition Unclear, Authenticity Unclear, Compatibility Risk, No Return Protection, Weak Comparable Evidence, Older Model, or Repair Risk.",
    "For ordinary vintage, collectible, advertising, commemorative, holiday, or decorative items, do not treat Older Model, No Warranty, or No Return Protection as risks unless the purchase context, seller terms, electronics/compatibility concerns, or condition facts make them material.",
    "betterValueConsiderations may mention newer, older, refurbished, open-box, used, local pickup, competing brand, or waiting only when the available evidence supports it. Do not invent specific alternatives.",
    "Do not recommend waiting for a similar item when the recommendation is Buy or Buy If It Fits Your Needs unless a concrete condition, authenticity, compatibility, safety, price, or return-policy problem supports waiting.",
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
    "Use valuation evidence states consistently: supported, preliminary, or insufficient.",
    "Use Estimated Fair Market Value only when exact or strong comparable evidence is sufficient. Use Preliminary Reference Range when evidence is weak, partial, active-listing-only, category-level, or AI-reasoning-only. Use Fair Value: Not established when no defensible range exists.",
    "If evidence is insufficient, do not label any range as Estimated Fair Value, Fair Market Value, Typical Selling Price, or Confirmed Value. Say the price may be favorable only relative to similar active listings when that is the only evidence.",
    "Active asking-price ranges are reference evidence only. Never present them as confirmed sold evidence or verified fair market value.",
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
    textIdentityEvidence: normalizeStringArray(identity.textIdentityEvidence, 14),
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
    visibleText: normalizeStringArray(identity.visibleText, 24),
    guidedBuyerIntakeSummary: cleanText(identity.guidedBuyerIntakeSummary || "Unknown") || "Unknown",
    identityConflictNotes: normalizeStringArray(identity.identityConflictNotes, 6),
    identityUnknowns: normalizeStringArray(identity.identityUnknowns, 8),
    identitySummary: cleanText(identity.identitySummary || "Unknown") || "Unknown",
    distinctiveVisualDescription: cleanText(identity.distinctiveVisualDescription || "Unknown") || "Unknown",
    likelyItemDescription: cleanText(identity.likelyItemDescription || "Unknown") || "Unknown",
    strongestSearchableIdentifiers: normalizeStringArray(identity.strongestSearchableIdentifiers, 12),
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
    visibleWords: normalizeStringArray(source.visibleWords, 20),
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
  const isBrandedMemorabilia = /memorabilia|commemorative|champion|championship|national champions?|sports|athletics|team|school|university|college|coach|player|mascot|official|licensed|souvenir|collector|collectible|advertising|promotional|promo|beverage|beer|tobacco|gas|oil|tray|serving tray|collector'?s tray|plate|plaque|tin|sign/.test(haystack);
  const isPromotionalCollectible = /advertising|promotional|promo|brand|soda|beverage|beer|tobacco|gas|oil|automotive|commemorative|souvenir|licensed|collector|collectible|tray|plate|plaque|tin|sign/.test(haystack);
  const isCookieJarOrContainer = /cookie jar|container|canister|lid|lidded|ceramic jar|collectible jar/.test(haystack);
  const isVintageCollectible = /vintage|collectible|ceramic|canister|cookie jar|container|holiday|santa|christmas|discontinued|antique|decor|resale|secondhand|mercari|etsy|collegiate|mascot|licensed|memorabilia|commemorative|champion|championship|advertising|promotional|tray|serving tray|plate|plaque|tin|sign/.test(haystack);
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

  if ((isSecondhandContext || hasResaleIntent) && (isSeasonalDecor || isVintageCollectible || isOrganizationCollectible || isBrandedMemorabilia || isPromotionalCollectible || isCookieJarOrContainer || !isRetailCurrent)) {
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

  if (isBrandedMemorabilia || isPromotionalCollectible) {
    route.push(
      "exact visible phrase searches",
      "eBay-style active and sold resale results",
      "Etsy-style vintage and advertising collectible results",
      "auction/archive source clues",
      "collector/reference source clues",
      "general web exact phrase results",
      "organization/team/brand/event searches"
    );
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
  const context = buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const queries = [
    ...buildHighPriorityExactQueries(context),
    ...buildFallbackSearchQueries(context)
  ];

  const diverseQueries = [];
  const scored = [];
  let index = 0;
  for (const query of queries.map((item) => cleanSearchQuery(removeUnsupportedQueryDescriptors(item, context), 12)).filter(Boolean)) {
    if (!isRepetitiveQuery(query, diverseQueries)) {
      diverseQueries.push(query);
      scored.push({
        query,
        score: scoreSearchQuerySpecificity(query, context),
        index
      });
    }
    index += 1;
  }

  const maxQueries = context.hasHighSpecificityText ? 14 : context.seasonalDecor || context.organizationCollectible || context.visualReferenceSubject ? 8 : 6;
  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.query)
    .slice(0, maxQueries);
}

function buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake = normalizeBuyerIntake({})) {
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
  const seasonalDecor = isSeasonalDecorIdentity(identity, routeText, notesText);
  const organizationCollectible = isOrganizationCollectibleIdentity(identity, routeText, notesText);
  const brandedMemorabilia = isBrandedMemorabiliaIdentity(identity, routeText, notesText);
  const promotionalCollectible = isPromotionalCollectibleIdentity(identity, routeText, notesText);
  const visualReferenceSubject = /visual subject reference|historical\/reference|logo\/mascot\/artwork|image\/reference|artwork|illustration|logo|mascot|advertising|poster|sign|plaque|print|political|military|insignia|vintage graphic/.test(routeText);
  const visibleEvidence = collectVisibleSearchEvidence(identity, visualRecognition, notesText, buyerIntake);
  const distinctivePhrases = extractDistinctiveSearchPhrases(visibleEvidence);
  const years = extractSearchYears(visibleEvidence.join(" "));
  const namedPeople = extractLikelyNamedPeople(visibleEvidence.join(" "));
  const itemType = inferSearchItemType(identity, visualCategory, productTitle, notesText, routeText);
  const eventPhrases = distinctivePhrases.filter((phrase) => /champion|anniversary|tournament|bowl|series|festival|event|official|collector|edition|commemorative|national|world|regional|conference|\b\d{4}\b/i.test(phrase));
  const hasHighSpecificityText = distinctivePhrases.length > 0 || upc || model || itemCode;

  return {
    routeText,
    notesText,
    visualRecognition,
    visualSubject,
    visualCategory,
    visualOrganization,
    visualBrand,
    visualCharacter,
    visibleLetters,
    visibleWords,
    visualFeatures,
    visualStyle,
    subjectIdentity,
    exactProductIdentity,
    productTitle,
    brand,
    manufacturer,
    teamName,
    schoolName,
    mascot,
    model,
    itemCode,
    upc,
    ageEra,
    conditionText,
    concernText,
    locationText,
    licensingText,
    labelText,
    visualPhrase,
    categoryPhrase,
    subjectPhrase,
    price,
    seasonalDecor,
    organizationCollectible,
    brandedMemorabilia,
    promotionalCollectible,
    visualReferenceSubject,
    visibleEvidence,
    distinctivePhrases,
    years,
    namedPeople,
    itemType,
    eventPhrases,
    hasHighSpecificityText
  };
}

function buildHighPriorityExactQueries(context) {
  const queries = [];
  const organization = firstKnown(context.visualOrganization, context.schoolName, context.teamName, context.subjectIdentity);
  const brand = firstKnown(context.brand, context.visualBrand, context.manufacturer);
  const itemType = context.itemType;
  const exactVisibleEntries = context.visibleEvidence
    .map((item) => cleanSearchQuery(item, 8))
    .filter((item) => isDistinctiveSearchPhrase(item) && (item.split(/\s+/).length <= 6 || /['&]|\b(?:18|19|20)\d{2}\b|champion|national/i.test(item)))
    .slice(0, 8);
  const sloganLikePhrases = context.distinctivePhrases.filter((phrase) => /['&]|slogan|motto|catchphrase/i.test(phrase)).slice(0, 3);
  const primaryPhrases = mergeStringArrays(exactVisibleEntries, context.distinctivePhrases.slice(0, 7), sloganLikePhrases, 14);

  queries.push(...buildDiverseSearchIntentQueries(context));

  if (context.upc) {
    queries.push(context.upc);
    queries.push(compactWords([context.upc, brand || context.productTitle, itemType]));
  }
  if (context.model || context.itemCode) {
    queries.push(compactWords([brand || context.manufacturer, context.model || context.itemCode, itemType]));
  }

  for (const phrase of primaryPhrases) {
    const quoted = quoteSearchPhrase(phrase);
    queries.push(compactWords([quoted, brand, itemType]));
    queries.push(compactWords([quoted, organization, brand, itemType]));
  }

  for (const phrase of context.eventPhrases.slice(0, 3)) {
    queries.push(compactWords([quoteSearchPhrase(phrase), organization, brand, itemType]));
  }

  for (const year of context.years.slice(0, 2)) {
    queries.push(compactWords([year, organization, brand, itemType]));
    queries.push(compactWords([year, organization, context.eventPhrases[0], itemType]));
  }

  for (const person of context.namedPeople.slice(0, 3)) {
    queries.push(compactWords([person, organization, brand, itemType]));
  }

  queries.push(compactWords([brand, organization, context.eventPhrases[0], itemType]));
  queries.push(compactWords([brand, organization, context.productTitle, itemType]));
  queries.push(compactWords([context.exactProductIdentity || context.productTitle, brand, itemType]));
  queries.push(compactWords([context.labelText, context.itemCode || context.model || context.ageEra]));

  return queries;
}

function buildDiverseSearchIntentQueries(context) {
  const queries = [];
  const organization = firstKnown(context.visualOrganization, context.schoolName, context.teamName, context.subjectIdentity);
  const brand = firstKnown(context.brand, context.visualBrand, context.manufacturer);
  const itemType = context.itemType;
  const exactVisiblePhrase = selectExactVisiblePhrase(context);
  const eventPhrase = selectEventSearchPhrase(context);
  const namedPerson = context.namedPeople[0] || "";
  const year = context.years[0] || "";
  const followOnYear = year && Number.isFinite(Number(year)) ? String(Number(year) + 1) : "";

  if (exactVisiblePhrase) {
    queries.push(compactWords([quoteSearchPhrase(exactVisiblePhrase), brand, itemType]));
  }
  if (brand || organization || itemType) {
    queries.push(compactWords([brand, organization, itemType]));
  }
  if (namedPerson) {
    queries.push(compactWords([namedPerson, organization, brand, itemType]));
  }
  if (eventPhrase || year) {
    queries.push(compactWords([year, organization, eventPhrase, brand, itemType]));
  }
  if (followOnYear && /champion|commemorative|collector|official|edition/i.test([eventPhrase, context.productTitle, context.subjectIdentity].join(" "))) {
    queries.push(compactWords([followOnYear, organization, year, eventPhrase, brand, itemType]));
  }
  if (brand || organization || itemType) {
    queries.push(compactWords([brand, organization, itemType]));
  }
  if (/official|licensed|collector|commemorative/i.test([context.licensingText, context.eventPhrases, context.productTitle, context.subjectIdentity].join(" "))) {
    queries.push(compactWords(["official", brand, organization, itemType]));
  }
  queries.push(compactWords([context.exactProductIdentity || context.productTitle || context.subjectIdentity, brand, itemType]));

  return queries.filter(Boolean);
}

function selectExactVisiblePhrase(context) {
  const candidates = mergeStringArrays(
    context.distinctivePhrases,
    context.eventPhrases,
    context.visibleEvidence,
    24
  );
  return candidates
    .map((item) => cleanSearchQuery(item, 7))
    .filter((item) => isDistinctiveSearchPhrase(item))
    .sort((a, b) => {
      const scoreA = scoreExactVisiblePhrase(a);
      const scoreB = scoreExactVisiblePhrase(b);
      return scoreB - scoreA || a.length - b.length;
    })[0] || "";
}

function selectEventSearchPhrase(context) {
  return context.eventPhrases
    .map((item) => cleanSearchQuery(item, 7))
    .sort((a, b) => scoreExactVisiblePhrase(b) - scoreExactVisiblePhrase(a) || a.length - b.length)[0] || "";
}

function scoreExactVisiblePhrase(value) {
  const text = cleanText(value);
  let score = 0;
  if (/[A-Z]{2,}/.test(value)) score += 2;
  if (/['’]/.test(text)) score += 8;
  if (/\b(?:18|19|20)\d{2}\b/.test(text)) score += 5;
  if (/champion|national|official|collector|commemorative|edition|slogan|motto/i.test(text)) score += 5;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 3 && wordCount <= 6) score += 3;
  if (wordCount > 8) score -= 4;
  return score;
}

function buildFallbackSearchQueries(context) {
  const queries = [];

  if (context.visualSubject) {
    queries.push(compactWords([context.visualSubject, context.visualCategory]));
  }
  if (context.visualOrganization || context.visualCharacter || context.visibleLetters || context.visibleWords) {
    queries.push(compactWords([context.visualOrganization || context.visualBrand, context.visualCharacter, context.visibleLetters, context.visibleWords, context.visualCategory]));
  }
  if (context.visualReferenceSubject) {
    queries.push(compactWords([context.visualSubject, context.visualStyle, "reference"]));
    queries.push(compactWords([context.visualOrganization || context.visualBrand, context.visualCharacter, "vintage artwork logo mascot"]));
    queries.push(compactWords([context.visibleWords || context.visibleLetters, context.visualFeatures, "historical image"]));
  }

  if (context.organizationCollectible || context.brandedMemorabilia || context.promotionalCollectible) {
    queries.push(compactWords([context.subjectIdentity, "memorabilia collectible"]));
    queries.push(compactWords([context.schoolName || context.teamName, context.mascot, context.itemType, "collectible"]));
    queries.push(compactWords([context.schoolName || context.teamName, context.mascot, "artwork print poster plaque tray"]));
    queries.push(compactWords([context.schoolName || context.teamName, context.mascot, context.productTitle, "collectible"]));
    queries.push(compactWords([context.manufacturer || context.brand, context.schoolName || context.teamName, context.mascot, context.itemType]));
    queries.push(compactWords([context.licensingText, context.schoolName || context.teamName, context.mascot, context.itemType]));
  } else if (context.seasonalDecor) {
    queries.push(compactWords([context.brand, context.locationText, context.itemCode]));
    queries.push(compactWords([context.brand, context.itemCode, mostDistinctiveProductWord(context.productTitle)]));
    queries.push(compactWords([context.upc, context.brand || context.manufacturer]));
    queries.push(compactWords([context.brand, context.productTitle]));
    queries.push(compactWords([context.productTitle, context.itemCode]));
    queries.push(compactWords([context.brand, context.locationText, mostDistinctiveCategoryWord(context.categoryPhrase)]));
    queries.push(compactWords([context.labelText, context.itemCode]));
  } else {
    if (context.model) {
      queries.push(compactWords([context.brand || context.manufacturer, context.model]));
      queries.push(compactWords([context.brand, context.model, extractSpecs(context.notesText), "price"]));
    }

    if (context.itemCode) {
      queries.push(compactWords([context.itemCode, mostDistinctiveCategoryWord(context.categoryPhrase)]));
    }

    if (context.manufacturer && context.productTitle) {
      queries.push(compactWords([context.manufacturer, context.productTitle]));
    }

    if (context.labelText) {
      queries.push(context.labelText);
    }

    queries.push(compactWords([context.brand, context.productTitle]));
    queries.push(context.subjectPhrase);
    queries.push(context.visualPhrase);

    if (context.price && /holiday|collectible|vintage|decor|ceramic|apparel|fashion|resale|secondhand|memorabilia|advertising|promotional/.test(context.routeText)) {
      queries.push(compactWords([context.price, mostDistinctiveProductWord(context.productTitle), mostDistinctiveCategoryWord(context.categoryPhrase), context.conditionText, context.concernText]));
    }

    if (context.ageEra) {
      queries.push(compactWords([context.ageEra, context.brand || context.manufacturer, mostDistinctiveProductWord(context.productTitle)]));
    }

    queries.push(context.categoryPhrase);
  }

  return queries;
}

function normalizeLiveSearchResult({ result, responseData, identity = {}, searchStartedAt, sourceRoute, searchQueries, queriesActuallySent = [], queriesPrioritized = [], providerRequestRecords = [], providerResponseSummaries = [], providerErrors = [], providerSourceRecords = [], safeRawResultSummaries = [], elapsedMs, statusCode, includeSourcesRequested, includeFallbackReason, searchControlsFallbackReason }) {
  const citations = collectUrlCitations(responseData);
  const webSearchCalls = collectWebSearchCalls(responseData);
  const sourcesSearched = collectWebSearchSources(responseData);
  const sourceRecords = dedupeProviderSourceRecords(providerSourceRecords.length ? providerSourceRecords : citations.map((citation) => sourceRecordFromCitation(citation, {})));
  const domainsActuallyReturned = summarizeSourceLabels(sourceRecords.map((record) => record.domain).filter(Boolean));
  const sourceURLsReturned = [...new Set(sourceRecords.map((record) => record.url).filter(Boolean))].slice(0, 50);
  const webSearchExecuted = webSearchCalls.length > 0;
  const rawItems = normalizeStringArray(result.comparableItemsFound, 8);
  const rawResultSummaries = safeRawResultSummaries.length
    ? safeRawResultSummaries
    : collectSafeRawResultSummaries({ result, citations, searchQueries, queriesActuallySent });
  const bucketedResearch = buildResearchResultBuckets(result, rawItems, citations, identity);
  const comparableItemsFound = recordsToLegacyComparableStrings([
    ...bucketedResearch.strongComparables,
    ...bucketedResearch.partialComparables.filter((item) => /strong similar/i.test(item.classification))
  ]);
  let liveSearchStatus = "Live Search Unavailable - AI Reasoning Only";

  if (webSearchExecuted && comparableItemsFound.length) {
    liveSearchStatus = "Live Search Completed - Source-Backed Comps Found";
  } else if (webSearchExecuted) {
    liveSearchStatus = "Live Search Completed - No Reliable Comps Found";
  }
  const noReliableMatchesReason = liveSearchStatus === "Live Search Completed - Source-Backed Comps Found"
    ? ""
    : diagnoseSearchAcquisition({
        webSearchExecuted,
        citations,
        bucketedResearch,
        searchQueries
      });

  return {
    liveSearchStatus,
    comparableItemsFound,
    resultsFound: bucketedResearch.resultsFound,
    strongComparables: bucketedResearch.strongComparables,
    partialComparables: bucketedResearch.partialComparables,
    referenceResults: bucketedResearch.referenceResults,
    weakMatches: bucketedResearch.weakMatches,
    rejectedMatches: bucketedResearch.rejectedMatches,
    visibleResearchResultCount: bucketedResearch.resultsFound.length,
    noReliableMatchesReason,
    searchEvidenceSummary: cleanText(result.searchEvidenceSummary || ""),
    sourceRoute,
    searchQueries,
    queriesPrioritized,
    queriesActuallySent,
    providerRequestRecords,
    providerResponseSummaries,
    providerSourceRecords: sourceRecords.slice(0, 50),
    sourcesTargeted: buildSourcesTargeted(sourceRoute),
    sourceCategoriesTargeted: buildSourcesTargeted(sourceRoute),
    allowedDomainsRequested: collectAllowedDomainsRequested(providerRequestRecords),
    searchProviderUsed: "OpenAI web_search",
    domainsActuallyReturned,
    sourceURLsReturned,
    providerSourceCount: sourceRecords.length,
    parsedCandidateCount: Number(bucketedResearch.normalizationDiagnostics?.parsedResultCount || 0),
    normalizedCandidateCount: Number(bucketedResearch.normalizationDiagnostics?.normalizedResultCount || 0),
    retainedVisibleResultCount: Number(bucketedResearch.normalizationDiagnostics?.retainedVisibleResultCount || 0),
    rejectedCandidateCount: Number(bucketedResearch.normalizationDiagnostics?.rejectedResultCount || 0),
    sourcesSearched,
    sourcesReturned: domainsActuallyReturned,
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
      visibleResearchResultCount: bucketedResearch.resultsFound.length,
      finalLiveSearchStatus: liveSearchStatus,
      includeSourcesRequested,
      includeFallbackReason,
      searchControlsFallbackReason
    },
    searchDiagnostics: buildSearchDiagnostics({
      searchQueries,
      queriesActuallySent,
      queriesPrioritized,
      sourceRoute,
      sourcesSearched,
      citations,
      providerSourceRecords: sourceRecords,
      webSearchCalls,
      rawResultSummaries,
      bucketedResearch,
      providerErrors,
      providerRequestRecords,
      providerResponseSummaries,
      liveSearchStatus,
      elapsedMs,
      searchControlsFallbackReason
    })
  };
}

function buildUnavailableLiveSearchResult({ error, sourceRoute, searchQueries, queriesPrioritized = [], providerRequestRecords = [], providerResponseSummaries = [], providerErrors = [], searchStartedAt, elapsedMs, includeSourcesRequested, includeFallbackReason, searchControlsFallbackReason }) {
  const diagnostic = classifyLiveSearchError(error);
  const liveSearchStatus = statusForLiveSearchError(diagnostic.category);
  const errors = providerErrors.length ? providerErrors : [diagnostic];

  return {
    liveSearchStatus,
    comparableItemsFound: [],
    resultsFound: [],
    strongComparables: [],
    partialComparables: [],
    referenceResults: [],
    weakMatches: [],
    rejectedMatches: [],
    visibleResearchResultCount: 0,
    noReliableMatchesReason: "Live search did not complete, so source-backed comps could not be retrieved.",
    searchEvidenceSummary: diagnostic.userMessage,
    sourceRoute,
    searchQueries,
    queriesPrioritized,
    queriesActuallySent: providerRequestRecords.filter((record) => record.attempted).map((record) => record.query),
    providerRequestRecords,
    providerResponseSummaries,
    providerSourceRecords: [],
    sourcesTargeted: buildSourcesTargeted(sourceRoute),
    sourceCategoriesTargeted: buildSourcesTargeted(sourceRoute),
    allowedDomainsRequested: collectAllowedDomainsRequested(providerRequestRecords),
    searchProviderUsed: "OpenAI web_search",
    domainsActuallyReturned: [],
    sourceURLsReturned: [],
    providerSourceCount: 0,
    parsedCandidateCount: 0,
    normalizedCandidateCount: 0,
    retainedVisibleResultCount: 0,
    rejectedCandidateCount: 0,
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
      includeFallbackReason,
      searchControlsFallbackReason
    },
    searchDiagnostics: buildSearchDiagnostics({
      searchQueries,
      queriesActuallySent: providerRequestRecords.filter((record) => record.attempted).map((record) => record.query),
      queriesPrioritized,
      sourceRoute,
      sourcesSearched: [],
      citations: [],
      providerSourceRecords: [],
      webSearchCalls: [],
      rawResultSummaries: [],
      bucketedResearch: buildEmptyResearchBuckets(),
      providerErrors: errors,
      providerRequestRecords,
      providerResponseSummaries,
      liveSearchStatus,
      elapsedMs,
      searchControlsFallbackReason
    })
  };
}

function diagnoseSearchAcquisition({ webSearchExecuted, citations = [], bucketedResearch = {}, searchQueries = [] }) {
  if (!webSearchExecuted) {
    return "Live comparable search was unavailable before exact phrase queries could retrieve source results.";
  }
  const visibleCount = bucketedResearch.resultsFound?.length || 0;
  const strongCount = bucketedResearch.strongComparables?.length || 0;
  const rejectedCount = (bucketedResearch.weakMatches?.length || 0) + (bucketedResearch.rejectedMatches?.length || 0);
  const exactPhraseQueries = searchQueries.filter((query) => /"[^"]{4,}"/.test(query));
  if (!citations.length) {
    return exactPhraseQueries.length
      ? "Exact phrase searches were attempted, but the live response did not return URL-cited source records."
      : "Live search was executed, but no URL-cited source records were returned; this is an acquisition failure rather than a valuation conclusion.";
  }
  if (!visibleCount) {
    return "Live search returned URL citations, but the response did not preserve usable structured result records.";
  }
  if (!strongCount && rejectedCount) {
    return "Live search returned visible source records, but they were classified as weak or rejected after identity and item-type checks.";
  }
  if (!strongCount) {
    return "Live search returned source records, but none qualified as exact or strong identity matches after filtering.";
  }
  return "Exact or strong identity matches were visible, but price evidence was not strong enough to mark confirmed fair-market value.";
}

function buildEmptyResearchBuckets() {
  return {
    strongComparables: [],
    partialComparables: [],
    referenceResults: [],
    weakMatches: [],
    rejectedMatches: [],
    resultsFound: [],
    normalizationDiagnostics: {
      parsedResultCount: 0,
      normalizedResultCount: 0,
      deduplicatedResultCount: 0,
      exactMatchCountBeforeFiltering: 0,
      strongMatchCountBeforeFiltering: 0,
      partialMatchCountBeforeFiltering: 0,
      referenceResultCountBeforeFiltering: 0,
      weakMatchCountBeforeFiltering: 0,
      rejectedResultCount: 0,
      retainedVisibleResultCount: 0,
      droppedResultReasons: []
    }
  };
}

function buildSearchDiagnostics({ searchQueries = [], queriesActuallySent = [], queriesPrioritized = [], sourceRoute = [], sourcesSearched = [], citations = [], providerSourceRecords = [], webSearchCalls = [], rawResultSummaries = [], bucketedResearch = buildEmptyResearchBuckets(), providerErrors = [], providerRequestRecords = [], providerResponseSummaries = [], liveSearchStatus = "", elapsedMs = 0, searchControlsFallbackReason = "" }) {
  const normalization = bucketedResearch.normalizationDiagnostics || {};
  const safeQueriesActuallySent = queriesActuallySent.map(cleanText).filter((query) => query && !isInternalPromptFragment(query)).slice(0, 20);
  const queryTransmissionMode = providerRequestRecords.length ? "query_bound_provider_requests" : "no_query_bound_provider_records";
  const sourceRecords = dedupeProviderSourceRecords(providerSourceRecords);
  const rawResultCount = rawResultSummaries.length;
  const providerSourceCount = sourceRecords.length || providerRequestRecords.reduce((sum, record) => sum + Number(record.providerSourceCount || 0), 0);
  const parsedResultCount = Number(normalization.parsedResultCount || 0);
  const normalizedResultCount = Number(normalization.normalizedResultCount || 0);
  const deduplicatedResultCount = Number(normalization.deduplicatedResultCount || 0);
  const retainedVisibleResultCount = Number(normalization.retainedVisibleResultCount || 0);
  const rejectedResultCount = Number(normalization.rejectedResultCount || 0);
  const queryResultsSummary = buildQueryResultsSummary({
    searchQueries,
    queriesActuallySent: safeQueriesActuallySent,
    queryTransmissionMode,
    webSearchCalls,
    rawResultSummaries,
    retainedVisibleResultCount,
    providerErrors,
    providerRequestRecords
  });
  const diagnostics = {
    queriesGenerated: searchQueries,
    queriesPrioritized: queriesPrioritized.length ? queriesPrioritized : searchQueries.map((query, index) => ({ query, priority: index + 1, sourceRoute: buildSourcesTargeted(sourceRoute) })),
    queriesActuallySent: safeQueriesActuallySent,
    queryTransmissionMode,
    executionLimitation: queryTransmissionMode === "query_bound_provider_requests"
      ? "Each prioritized query was sent in its own OpenAI web_search-enabled request. The provider does not expose every downstream marketplace endpoint, so source accounting is based on provider request records and returned URL citations."
      : "No query-bound provider request records were available, so the app does not claim individual queries were sent.",
    queryCount: searchQueries.length,
    sourceCategoriesTargeted: buildSourcesTargeted(sourceRoute),
    allowedDomainsRequested: collectAllowedDomainsRequested(providerRequestRecords),
    searchProviderUsed: "OpenAI web_search",
    sourcesRequested: buildSourcesTargeted(sourceRoute),
    sourcesActuallyQueried: providerRequestRecords.some((record) => record.attempted) ? ["OpenAI web_search"] : [],
    sourceRoute,
    providerCallsAttempted: providerRequestRecords.filter((record) => record.attempted).length,
    providerCallsSucceeded: providerRequestRecords.filter((record) => record.succeeded).length,
    providerSourceCount,
    domainsActuallyReturned: summarizeSourceLabels(sourceRecords.map((record) => record.domain).filter(Boolean)),
    sourceURLsReturned: [...new Set(sourceRecords.map((record) => record.url).filter(Boolean))].slice(0, 50),
    providerErrors: providerErrors.map(sanitizeProviderErrorSummary),
    providerRequestRecords: providerRequestRecords.map(sanitizeProviderRequestRecord),
    providerResponseSummaries: providerResponseSummaries.map(sanitizeProviderResponseSummary),
    providerSourceRecords: sourceRecords.slice(0, 50),
    rawResultCount,
    parsedCandidateCount: parsedResultCount,
    normalizedCandidateCount: normalizedResultCount,
    rejectedCandidateCount: rejectedResultCount,
    parsedResultCount,
    normalizedResultCount,
    deduplicatedResultCount,
    exactMatchCountBeforeFiltering: Number(normalization.exactMatchCountBeforeFiltering || 0),
    strongMatchCountBeforeFiltering: Number(normalization.strongMatchCountBeforeFiltering || 0),
    partialMatchCountBeforeFiltering: Number(normalization.partialMatchCountBeforeFiltering || 0),
    referenceResultCountBeforeFiltering: Number(normalization.referenceResultCountBeforeFiltering || 0),
    weakMatchCountBeforeFiltering: Number(normalization.weakMatchCountBeforeFiltering || 0),
    rejectedResultCount,
    retainedVisibleResultCount,
    droppedResultReasons: normalizeDropReasons(normalization.droppedResultReasons),
    queryResultsSummary,
    acquisitionFailureStage: classifySearchFailureStage({
      providerCallsSucceeded: providerRequestRecords.filter((record) => record.succeeded).length,
      rawResultCount: providerSourceCount || rawResultCount,
      parsedResultCount,
      normalizedResultCount,
      retainedVisibleResultCount,
      rejectedResultCount,
      providerErrors
    }),
    safeRawResults: rawResultSummaries.filter((item) => !isInternalPromptFragment(Object.values(item || {}).join(" "))).slice(0, 16),
    sourcesSearched: summarizeSourceLabels(sourcesSearched),
    sourcesReturned: summarizeSourceLabels(sourceRecords.map((record) => record.domain || record.title || record.url)),
    searchControlsFallbackReason,
    elapsedMilliseconds: elapsedMs,
    liveSearchStatus
  };
  return diagnostics;
}

function buildQueryResultsSummary({ searchQueries = [], queriesActuallySent = [], queryTransmissionMode = "", webSearchCalls = [], rawResultSummaries = [], retainedVisibleResultCount = 0, providerErrors = [], providerRequestRecords = [] }) {
  if (providerRequestRecords.length) {
    return providerRequestRecords.map((record) => ({
      query: cleanText(record.query),
      source: cleanText(record.provider || "OpenAI web_search"),
      searchPass: cleanText(record.searchPass),
      sourceRoute: normalizeStringArray(record.sourceRoute, 8),
      allowedDomainsRequested: normalizeStringArray(record.allowedDomainsRequested, 8),
      allowedDomainsApplied: Boolean(record.allowedDomainsApplied),
      requestAttempted: Boolean(record.attempted),
      requestSucceeded: Boolean(record.succeeded),
      providerSourceCount: Number(record.providerSourceCount || 0),
      domainsReturned: normalizeStringArray(record.domainsReturned, 8),
      sourceURLsReturned: normalizeStringArray(record.sourceURLsReturned, 12),
      rawResultCount: Number(record.rawResultCount || 0),
      parsedResultCount: Number(record.parsedResultCount || 0),
      normalizedResultCount: Number(record.normalizedResultCount || 0),
      retainedResultCount: Number(record.retainedResultCount || 0),
      controlledError: cleanText(record.errorCode),
      primaryRejectionStageOrReason: cleanText(record.failureStage || "unknown")
    })).slice(0, 20);
  }

  const exposedQueries = new Set(queriesActuallySent.map((query) => cleanText(query).toLowerCase()).filter(Boolean));
  const providerSucceeded = webSearchCalls.length > 0;
  const queryLevelCountsAvailable = queriesActuallySent.length > 0;
  return searchQueries.map((query) => {
    const normalized = cleanText(query).toLowerCase();
    const matchingRaw = rawResultSummaries.filter((item) => cleanText(item.query).toLowerCase() === normalized);
    const queryWasExposed = exposedQueries.has(normalized);
    return {
      query,
      source: "OpenAI web_search",
      requestAttempted: queryTransmissionMode === "prompt_supplied_to_search_controller" || queryWasExposed,
      requestSucceeded: providerSucceeded,
      rawResultCount: queryLevelCountsAvailable ? matchingRaw.length : 0,
      parsedResultCount: queryLevelCountsAvailable ? matchingRaw.length : 0,
      retainedResultCount: queryLevelCountsAvailable ? matchingRaw.filter((item) => item.retained).length : 0,
      controlledError: providerErrors.length
        ? providerErrors.map((error) => sanitizeProviderErrorSummary(error).message).filter(Boolean).join("; ")
        : queryLevelCountsAvailable
          ? ""
          : "Provider did not expose query-level result counts; query was supplied to the search controller.",
      primaryRejectionStageOrReason: retainedVisibleResultCount
        ? "none"
        : queryLevelCountsAvailable && matchingRaw.length
          ? "filtering_failure"
          : providerSucceeded
            ? "provider_zero_results_or_unexposed_query_results"
            : "provider_request_failure"
    };
  }).slice(0, 20);
}

function sanitizeProviderRequestRecord(record = {}) {
  return {
    query: cleanText(record.query),
    priority: Number(record.priority || 0),
    searchPass: cleanText(record.searchPass),
    sourceRoute: normalizeStringArray(record.sourceRoute, 8),
    allowedDomainsRequested: normalizeStringArray(record.allowedDomainsRequested, 8),
    allowedDomainsApplied: Boolean(record.allowedDomainsApplied),
    provider: cleanText(record.provider || "OpenAI web_search"),
    attempted: Boolean(record.attempted),
    succeeded: Boolean(record.succeeded),
    providerSourceCount: Number(record.providerSourceCount || 0),
    domainsReturned: normalizeStringArray(record.domainsReturned, 8),
    sourceURLsReturned: normalizeStringArray(record.sourceURLsReturned, 12),
    rawResultCount: Number(record.rawResultCount || 0),
    parsedResultCount: Number(record.parsedResultCount || 0),
    normalizedResultCount: Number(record.normalizedResultCount || 0),
    retainedResultCount: Number(record.retainedResultCount || 0),
    errorCode: cleanText(record.errorCode),
    failureStage: cleanText(record.failureStage || "unknown")
  };
}

function sanitizeProviderResponseSummary(summary = {}) {
  return {
    query: cleanText(summary.query),
    priority: Number(summary.priority || 0),
    searchPass: cleanText(summary.searchPass),
    provider: cleanText(summary.provider || "OpenAI web_search"),
    allowedDomainsRequested: normalizeStringArray(summary.allowedDomainsRequested, 8),
    allowedDomainsApplied: Boolean(summary.allowedDomainsApplied),
    statusCode: summary.statusCode || null,
    webSearchCallAppeared: Boolean(summary.webSearchCallAppeared),
    urlCitationCount: Number(summary.urlCitationCount || 0),
    providerSourceCount: Number(summary.providerSourceCount || 0),
    sourceURLsReturned: normalizeStringArray(summary.sourceURLsReturned, 12),
    domainsReturned: normalizeStringArray(summary.domainsReturned, 8),
    providerActionQueries: normalizeStringArray(summary.providerActionQueries, 4).filter((query) => !isInternalPromptFragment(query)),
    errorCode: cleanText(summary.errorCode),
    errorMessage: sanitizeErrorText(summary.errorMessage || "")
  };
}

function collectAllowedDomainsRequested(providerRequestRecords = []) {
  const domains = [];
  for (const record of providerRequestRecords) {
    for (const domain of normalizeStringArray(record.allowedDomainsRequested || record.allowedDomains, 12)) {
      addUnique(domains, domain);
    }
  }
  return domains.slice(0, 24);
}

function classifySearchFailureStage({ providerCallsSucceeded, rawResultCount, parsedResultCount, normalizedResultCount, retainedVisibleResultCount, rejectedResultCount, providerErrors = [] }) {
  if (retainedVisibleResultCount > 0) return "none";
  if (providerErrors.length) return "provider_request_failure";
  if (!providerCallsSucceeded) return "query_transmission_failure";
  if (rawResultCount === 0) return "provider_zero_results";
  if (parsedResultCount === 0) return "raw_parse_failure";
  if (normalizedResultCount === 0) return "normalization_failure";
  if (rejectedResultCount > 0 || normalizedResultCount > 0) return "filtering_failure";
  return "unknown";
}

function collectSafeRawResultSummaries({ result = {}, citations = [], searchQueries = [], queriesActuallySent = [] }) {
  const summaries = [];
  const fallbackQuery = queriesActuallySent[0] || searchQueries[0] || "";
  const addSummary = (value, bucketName, query = fallbackQuery) => {
    const rawText = cleanText(value);
    if (!rawText) return;
    const url = extractFirstUrl(rawText);
    summaries.push({
      title: extractResultTitle(rawText, inferSourceFromResult(rawText, url), url),
      url,
      source: inferSourceFromResult(rawText, url),
      displayedPriceText: extractDisplayedPrice(rawText),
      snippet: rawText.replace(/https?:\/\/[^\s),;]+/gi, "").slice(0, 260),
      query,
      bucketName,
      retained: /strong|partial|reference/i.test(bucketName)
    });
  };

  normalizeStringArray(result.comparableItemsFound, 12).forEach((item) => addSummary(item, "comparableItemsFound"));
  normalizeStringArray(result.strongComparables, 12).forEach((item) => addSummary(item, "strongComparables"));
  normalizeStringArray(result.partialComparables, 12).forEach((item) => addSummary(item, "partialComparables"));
  normalizeStringArray(result.referenceResults, 12).forEach((item) => addSummary(item, "referenceResults"));
  normalizeStringArray(result.weakMatches, 12).forEach((item) => addSummary(item, "weakMatches"));
  normalizeStringArray(result.rejectedMatches, 12).forEach((item) => addSummary(item, "rejectedMatches"));

  for (const citation of citations.slice(0, 12)) {
    summaries.push({
      title: cleanText(citation.title || citation.url),
      url: cleanText(citation.url),
      source: sourceLabelFromCitation(citation),
      displayedPriceText: "",
      snippet: "URL citation returned by provider.",
      query: fallbackQuery,
      bucketName: "urlCitation",
      retained: false
    });
  }

  return summaries.slice(0, 24);
}

function addDropReason(diagnostics, reason) {
  diagnostics.droppedResultReasons.push(reason);
}

function normalizeDropReasons(reasons = []) {
  const counts = new Map();
  for (const reason of reasons.map(cleanText).filter(Boolean)) {
    counts.set(reason, (counts.get(reason) || 0) + 1);
  }
  return [...counts.entries()].map(([reason, count]) => ({ reason, count })).slice(0, 12);
}

function incrementPreFilterCount(diagnostics, bucketName, record) {
  const classification = cleanText(record.classification).toLowerCase();
  if (/exact/.test(classification)) diagnostics.exactMatchCountBeforeFiltering += 1;
  else if (/strong/.test(classification)) diagnostics.strongMatchCountBeforeFiltering += 1;
  else if (bucketName === "partialComparables" || /partial/.test(classification)) diagnostics.partialMatchCountBeforeFiltering += 1;
  else if (bucketName === "referenceResults" || /reference/.test(classification)) diagnostics.referenceResultCountBeforeFiltering += 1;
  else if (bucketName === "weakMatches" || /weak/.test(classification)) diagnostics.weakMatchCountBeforeFiltering += 1;
  if (bucketName === "rejectedMatches" || /rejected/.test(classification)) diagnostics.rejectedResultCount += 1;
}

function trimBucketWithReason(bucket, maxItems, diagnostics, reason) {
  if (bucket.length <= maxItems) return;
  const dropped = bucket.length - maxItems;
  bucket.splice(maxItems);
  for (let index = 0; index < dropped; index += 1) {
    addDropReason(diagnostics, reason);
  }
}

function sanitizeProviderErrorSummary(error = {}) {
  return {
    category: cleanText(error.category || error.liveSearchErrorCategory || "unknown"),
    statusCode: error.statusCode || error.openAIStatusCode || null,
    type: cleanText(error.type || error.openAIErrorType || ""),
    code: cleanText(error.code || error.openAIErrorCode || ""),
    message: sanitizeErrorText(error.message || error.openAIErrorMessage || error.userMessage || "")
  };
}

function buildResearchResultBuckets(result, legacyItems, citations, identity = {}) {
  const seen = new Set();
  const buckets = buildEmptyResearchBuckets();
  const diagnostics = {
    parsedResultCount: 0,
    normalizedResultCount: 0,
    deduplicatedResultCount: 0,
    droppedResultReasons: [],
    exactMatchCountBeforeFiltering: 0,
    strongMatchCountBeforeFiltering: 0,
    partialMatchCountBeforeFiltering: 0,
    referenceResultCountBeforeFiltering: 0,
    weakMatchCountBeforeFiltering: 0,
    rejectedResultCount: 0
  };

  const addRecord = (bucketName, text) => {
    diagnostics.parsedResultCount += 1;
    const record = normalizeResearchResultRecord(text, bucketName, citations, identity);
    if (!record.rawText) {
      addDropReason(diagnostics, "missing title or raw result text");
      return;
    }
    diagnostics.normalizedResultCount += 1;
    const identityStrength = classifyIdentityMatchStrength(record, identity);
    if (!/rejected|weak/i.test(record.classification) && /exact|strong/i.test(identityStrength)) {
      bucketName = "strongComparables";
      record.classification = identityStrength;
      record.evidenceRole = buildEvidenceRoleForIdentityStrength(record);
      record.influencedReferenceRange = record.displayedPrice ? "Yes, as visible asking/sold evidence with price-type limitations." : "No price supplied; identity support only.";
    }
    const key = `${record.url || ""}|${record.title}|${record.classification}|${record.rejectionReason}`.toLowerCase();
    if (seen.has(key)) {
      addDropReason(diagnostics, "duplicate");
      return;
    }
    seen.add(key);
    diagnostics.deduplicatedResultCount += 1;
    incrementPreFilterCount(diagnostics, bucketName, record);
    buckets[bucketName].push(record);
  };

  normalizeStringArray(result.strongComparables, 6).forEach((item) => addRecord("strongComparables", item));
  normalizeStringArray(result.partialComparables, 8).forEach((item) => addRecord("partialComparables", item));
  normalizeStringArray(result.referenceResults, 8).forEach((item) => addRecord("referenceResults", item));
  normalizeStringArray(result.weakMatches, 8).forEach((item) => addRecord("weakMatches", item));
  normalizeStringArray(result.rejectedMatches, 8).forEach((item) => addRecord("rejectedMatches", item));

  for (const item of legacyItems) {
    if (isRejectedWeakComparableItem(item) || /\brejected\b/i.test(item)) {
      addRecord("rejectedMatches", item);
    } else if (/\bweak\b/i.test(item)) {
      addRecord("weakMatches", item);
    } else if (/\breference|identity\b/i.test(item)) {
      addRecord("referenceResults", item);
    } else if (/\bpartial|similar\b/i.test(item) && !/\bexact match\b|\blikely exact\b|\bstrong similar match\b/i.test(item)) {
      addRecord("partialComparables", item);
    } else {
      addRecord("strongComparables", item);
    }
  }

  trimBucketWithReason(buckets.strongComparables, 6, diagnostics, "strong comparable display cap");
  trimBucketWithReason(buckets.partialComparables, 8, diagnostics, "partial comparable display cap");
  trimBucketWithReason(buckets.referenceResults, 8, diagnostics, "reference result display cap");
  trimBucketWithReason(buckets.weakMatches, 8, diagnostics, "weak match display cap");
  trimBucketWithReason(buckets.rejectedMatches, 8, diagnostics, "rejected match display cap");
  buckets.resultsFound = [
    ...buckets.strongComparables,
    ...buckets.partialComparables,
    ...buckets.referenceResults,
    ...buckets.weakMatches,
    ...buckets.rejectedMatches
  ].slice(0, 24);
  diagnostics.retainedVisibleResultCount = [
    ...buckets.strongComparables,
    ...buckets.partialComparables,
    ...buckets.referenceResults
  ].filter(isUsableSourceRecord).length;
  buckets.normalizationDiagnostics = diagnostics;

  return buckets;
}

function normalizeResearchResultRecord(value, bucketName, citations = [], identity = {}) {
  const rawText = cleanText(value);
  const url = extractFirstUrl(rawText);
  const source = inferSourceFromResult(rawText, url);
  const displayedPrice = extractDisplayedPrice(rawText);
  const classification = inferResultClassification(rawText, bucketName);
  const priceType = inferPriceType(rawText);
  const rejected = bucketName === "rejectedMatches" || /rejected|not comparable|not a comparable|failed/i.test(rawText);
  const identityStrength = classifyIdentityMatchStrength({ rawText, title: extractResultTitle(rawText, source, url), classification }, identity);

  return {
    title: extractResultTitle(rawText, source, url),
    source,
    url: url || "",
    displayedPrice,
    currency: displayedPrice ? "$" : "",
    priceType,
    condition: extractLabeledResultPart(rawText, /condition\s*[:=-]\s*([^|;.]+)/i),
    classification: identityStrength || classification,
    evidenceRole: identityStrength ? buildEvidenceRoleForIdentityStrength({ priceType, displayedPrice }) : inferEvidenceRole(bucketName, classification),
    matchExplanation: extractMatchExplanation(rawText),
    itemIdentityDifferences: extractIdentityDifferences(rawText),
    influencedReferenceRange: ["strongComparables", "partialComparables", "referenceResults"].includes(bucketName) ? "Yes, as visible evidence only." : "No.",
    rejectionReason: rejected ? extractRejectionReason(rawText, classification) : "",
    sourceBacked: url && hasCitedUrl(rawText, citations) ? "URL-cited" : url ? "URL provided by result text" : "No usable URL supplied by source.",
    rawText
  };
}

function recordsToLegacyComparableStrings(records) {
  return records
    .filter((record) => record.url && record.sourceBacked === "URL-cited" && !/rejected|weak/i.test(record.classification))
    .map(formatResearchRecordForLegacySection)
    .slice(0, 6);
}

function formatResearchRecordForLegacySection(record) {
  return [
    `Source/platform/site: ${record.source || "Unknown source"}`,
    `Title: ${record.title || "Title not supplied"}`,
    record.displayedPrice ? `Price: ${record.displayedPrice}` : "",
    record.priceType ? `Price Type: ${record.priceType}` : "",
    record.condition ? `Condition: ${record.condition}` : "",
    record.url ? `URL: ${record.url}` : "URL: No usable URL supplied by source.",
    `Match quality: ${record.classification}`,
    record.matchExplanation ? `Why: ${record.matchExplanation}` : ""
  ].filter(Boolean).join(" | ");
}

function extractFirstUrl(text) {
  const match = String(text || "").match(/https?:\/\/[^\s),;]+/i);
  return match ? match[0].replace(/[.)\]]+$/, "") : "";
}

function inferSourceFromResult(text, url) {
  const labeled = extractLabeledResultPart(text, /(?:source|platform|site|marketplace)\s*[:=-]\s*([^|;.]+)/i);
  if (labeled) {
    return labeled;
  }
  if (url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch {
      return "Source URL supplied";
    }
  }
  return "Source not supplied";
}

function extractDisplayedPrice(text) {
  const match = String(text || "").match(/\$\s*\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?/);
  return match ? normalizeMoneyLabelText(match[0]) : "";
}

function inferPriceType(text) {
  const source = String(text || "").toLowerCase();
  if (/sold|completed sale|sale price|sold price/.test(source) && !/not sold|no sold/.test(source)) {
    return "Confirmed sold price";
  }
  if (/active|asking|listed|listing price|current listing|for sale/.test(source)) {
    return "Active asking price";
  }
  if (/retail|msrp|store price/.test(source)) {
    return "Current retail price";
  }
  return "Price type not confirmed";
}

function inferResultClassification(text, bucketName) {
  const source = String(text || "").toLowerCase();
  if (/\bexact match\b|\blikely exact\b/.test(source) || bucketName === "strongComparables") {
    return /\bstrong similar\b/.test(source) ? "Strong Similar Match" : "Exact / Strong Comparable";
  }
  if (/\bpartial\b/.test(source) || bucketName === "partialComparables") {
    return "Partial Comparable";
  }
  if (/\breference|identity\b/.test(source) || bucketName === "referenceResults") {
    return "Reference Result";
  }
  if (/\bweak\b/.test(source) || bucketName === "weakMatches") {
    return "Weak Match";
  }
  return "Rejected Match";
}

function classifyIdentityMatchStrength(record = {}, identity = {}) {
  const resultText = [
    record.title,
    record.rawText,
    record.matchExplanation
  ].map(cleanText).join(" ").toLowerCase();
  if (!resultText) {
    return "";
  }

  if (/\b(exact match|likely exact|same item|same product)\b/i.test(resultText)) {
    return "Exact Identity Match";
  }

  const visualRecognition = normalizeVisualRecognition(identity.visualRecognition || {});
  const exactSignals = [
    identity.upcBarcode,
    identity.model,
    identity.sku,
    identity.styleNumber,
    identity.modelOrItemNumber,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.brandSeries
  ].filter(hasKnownValue);
  const majorSignals = [
    identity.brand,
    identity.manufacturer,
    identity.recognizedBrand,
    visualRecognition.recognizedBrand,
    identity.teamName,
    identity.schoolName,
    identity.recognizedOrganization,
    visualRecognition.recognizedOrganization,
    identity.mascot,
    identity.recognizedCharacter,
    visualRecognition.recognizedCharacter,
    identity.year,
    identity.copyrightWording,
    identity.category,
    identity.visualSubject,
    visualRecognition.visualSubject
  ].filter(hasKnownValue);
  const phraseSignals = extractDistinctiveSearchPhrases(collectVisibleSearchEvidence(identity, visualRecognition, "", normalizeBuyerIntake({}))).slice(0, 8);
  let score = 0;

  for (const signal of exactSignals) {
    if (signalMatchesResult(signal, resultText)) {
      score += 4;
    }
  }
  for (const signal of majorSignals) {
    if (signalMatchesResult(signal, resultText)) {
      score += 2;
    }
  }
  for (const phrase of phraseSignals) {
    if (signalMatchesResult(phrase, resultText)) {
      score += 3;
    }
  }

  const sameItemType = signalMatchesResult(inferSearchItemType(identity, identity.visualSubjectCategory, identity.productNameOrBoxTitle, "", ""), resultText);
  if (sameItemType) {
    score += 2;
  }

  if (score >= 9) {
    return "Exact Identity Match";
  }
  if (score >= 6) {
    return "Strong Identity Match";
  }
  return "";
}

function signalMatchesResult(signal, resultText) {
  const text = cleanText(signal).toLowerCase();
  if (!text || text.length < 3) {
    return false;
  }
  if (resultText.includes(text)) {
    return true;
  }
  const tokens = text.split(/\s+/).filter((token) => token.length > 2 && !/^(the|and|with|for|from|official|collector|vintage|used|item)$/.test(token));
  if (tokens.length < 2) {
    return false;
  }
  const matched = tokens.filter((token) => resultText.includes(token)).length;
  return matched / tokens.length >= 0.75;
}

function buildEvidenceRoleForIdentityStrength(record = {}) {
  if (/sold/i.test(record.priceType || "")) {
    return "Exact or strong identity match with confirmed sold-price evidence when the source label is accurate.";
  }
  if (/active|asking/i.test(record.priceType || "")) {
    return "Exact or strong identity match with active asking-price evidence; useful for buyer context but not confirmed sold value.";
  }
  if (record.displayedPrice) {
    return "Exact or strong identity match with visible price; price type must be verified before treating it as value evidence.";
  }
  return "Exact or strong identity match; supports identification but not a numeric value by itself.";
}

function inferEvidenceRole(bucketName, classification) {
  if (bucketName === "strongComparables") {
    return "Can support a value estimate if identity, condition, and price type match.";
  }
  if (bucketName === "partialComparables") {
    return "Can support a preliminary reference range only.";
  }
  if (bucketName === "referenceResults") {
    return "Identity or category reference only; not a direct value comp.";
  }
  if (bucketName === "weakMatches") {
    return "Weak context only; should not drive price.";
  }
  return `Rejected evidence; should not drive price. ${classification}`;
}

function extractResultTitle(text, source, url) {
  const labeled = extractLabeledResultPart(text, /title\s*[:=-]\s*([^|;.]+)/i);
  if (labeled) {
    return labeled;
  }
  return cleanText(String(text || "")
    .replace(/https?:\/\/[^\s),;]+/gi, "")
    .replace(/(?:source|platform|site|marketplace|price|shipping|condition|url|link|match quality|why)\s*[:=-]\s*[^|;]+/gi, "")
    .replace(source || "", "")
  ).slice(0, 160) || (url ? "Source result" : "Result title not supplied");
}

function extractLabeledResultPart(text, pattern) {
  const match = String(text || "").match(pattern);
  return match ? cleanText(match[1]) : "";
}

function extractMatchExplanation(text) {
  return extractLabeledResultPart(text, /(?:why|match explanation|appears to match|reason)\s*[:=-]\s*([^|]+)/i)
    || cleanText(text).slice(0, 260);
}

function extractIdentityDifferences(text) {
  return extractLabeledResultPart(text, /(?:identity differences|differences|different because)\s*[:=-]\s*([^|]+)/i);
}

function extractRejectionReason(text, classification) {
  const explicit = extractLabeledResultPart(text, /(?:rejection reason|reason rejected|rejected because|why rejected)\s*[:=-]\s*([^|]+)/i);
  if (explicit) {
    return explicit;
  }
  const source = String(text || "").toLowerCase();
  const reasons = [
    [/different maker|maker mismatch|brand mismatch/, "Different maker or brand."],
    [/different year|era mismatch|date mismatch/, "Different year or era."],
    [/different tray|design mismatch|pattern mismatch/, "Different design or pattern."],
    [/different size|size mismatch|dimension/, "Different size or dimensions."],
    [/reproduction|replica/, "Reproduction or replica risk."],
    [/active asking|asking price only|listed price only/, "Active asking price only; not confirmed sold evidence."],
    [/condition mismatch|damaged|missing|incomplete/, "Condition or completeness mismatch."],
    [/generic|broad category|not exact/, "Generic category result rather than a matching item."],
    [/insufficient|unclear|missing details/, "Insufficient item details to compare responsibly."]
  ];
  const found = reasons.find(([pattern]) => pattern.test(source));
  return found ? found[1] : `Not reliable enough for valuation. Classification: ${classification}.`;
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
  const researchVisibility = buildResearchVisibilityFields(liveSearch);

  const normalizedReport = {
    ...report,
    platform,
    categorySuggestion: cleanText(report.categorySuggestion || identity.category || "Uncategorized"),
    identifiedItem: cleanText(report.identifiedItem || buildIdentifiedItem(identity)),
    identificationConfidence: ensureConfidenceLayer(report.identificationConfidence, "Medium", "Identification is based on photo evidence, visible text, seller notes, and source-routing results."),
    ...visualFields,
    ...identityFields,
    ...researchVisibility,
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

  return applyValuationEvidenceLabels(normalizedReport, {
    reliableCompsFound: reliableResearchFound,
    searchCompleted: Boolean(liveSearch.webSearchExecuted),
    workflow: "listing"
  });
}

function buildListingSearchQueriesUsed(liveSearch) {
  const sentQueries = normalizeStringArray(liveSearch.queriesActuallySent, 20);
  const generatedQueries = normalizeStringArray(liveSearch.searchQueries, 20);
  const queries = sentQueries.length ? sentQueries : generatedQueries;
  if (!queries.length) {
    return [];
  }

  const lead = liveSearch.webSearchExecuted
    ? "These are the queries the system used."
    : "These are the queries the system attempted before live research became unavailable.";
  return [lead, ...queries];
}

function buildListingResearchResults(liveSearch, comparableItemsFound) {
  const visibility = buildResearchVisibilityFields(liveSearch);
  if (visibility.resultsFound.length) {
    return visibility.resultsFound;
  }

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
  const visibility = buildResearchVisibilityFields(liveSearch);
  if (visibility.resultsFound.length) {
    return [
      `Strong Comparables: ${visibility.strongComparables.length}`,
      `Partial Comparables: ${visibility.partialComparables.length}`,
      `Reference Results: ${visibility.referenceResults.length}`,
      `Weak Matches: ${visibility.weakMatches.length}`,
      `Rejected Matches: ${visibility.rejectedMatches.length}`
    ];
  }

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

function buildResearchVisibilityFields(liveSearch = {}) {
  const strongComparables = normalizeResearchRecordArray(liveSearch.strongComparables, "strongComparables");
  const partialComparables = normalizeResearchRecordArray(liveSearch.partialComparables, "partialComparables");
  const referenceResults = normalizeResearchRecordArray(liveSearch.referenceResults, "referenceResults");
  const weakMatches = normalizeResearchRecordArray(liveSearch.weakMatches, "weakMatches");
  const rejectedMatches = normalizeResearchRecordArray(liveSearch.rejectedMatches, "rejectedMatches");
  const resultsFound = [
    ...strongComparables,
    ...partialComparables,
    ...referenceResults,
    ...weakMatches,
    ...rejectedMatches
  ].slice(0, 24);
  const searchLimitations = buildSearchLimitations(liveSearch, resultsFound);
  const visibleResearchResultCount = resultsFound.length;

  return {
    resultsFound,
    strongComparables,
    partialComparables,
    referenceResults,
    weakMatches,
    rejectedMatches,
    searchLimitations,
    visibleResearchResultCount,
    searchDiagnostics: liveSearch.searchDiagnostics || null,
    referenceRangeBasis: visibleResearchResultCount
      ? `${visibleResearchResultCount} visible source-backed result${visibleResearchResultCount === 1 ? "" : "s"} were returned. Strong results can support value; partial/reference results can only support a preliminary range; weak/rejected matches do not establish fair value.`
      : "No visible structured source records were returned, so a preliminary reference range is not supported."
  };
}

function normalizeResearchRecordArray(value, bucketName) {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  return items
    .map((item) => typeof item === "object" && item !== null
      ? normalizeExistingResearchRecord(item, bucketName)
      : normalizeResearchResultRecord(item, bucketName, []))
    .filter((item) => item && (item.rawText || item.title || item.url))
    .slice(0, 8);
}

function normalizeExistingResearchRecord(item, bucketName) {
  const rawText = cleanText(item.rawText || Object.entries(item).map(([key, value]) => `${key}: ${value}`).join(" | "));
  const url = cleanText(item.url || extractFirstUrl(rawText));
  return {
    title: cleanText(item.title) || extractResultTitle(rawText, cleanText(item.source), url),
    source: cleanText(item.source) || inferSourceFromResult(rawText, url),
    url,
    displayedPrice: normalizeMoneyLabelText(cleanText(item.displayedPrice || item.price)),
    currency: cleanText(item.currency) || (item.displayedPrice || item.price ? "$" : ""),
    priceType: cleanText(item.priceType) || inferPriceType(rawText),
    condition: cleanText(item.condition),
    classification: cleanText(item.classification) || inferResultClassification(rawText, bucketName),
    evidenceRole: cleanText(item.evidenceRole) || inferEvidenceRole(bucketName, cleanText(item.classification)),
    matchExplanation: cleanText(item.matchExplanation) || extractMatchExplanation(rawText),
    itemIdentityDifferences: cleanText(item.itemIdentityDifferences) || extractIdentityDifferences(rawText),
    influencedReferenceRange: cleanText(item.influencedReferenceRange) || (["strongComparables", "partialComparables", "referenceResults"].includes(bucketName) ? "Yes, as visible evidence only." : "No."),
    rejectionReason: cleanText(item.rejectionReason) || (bucketName === "rejectedMatches" ? extractRejectionReason(rawText, cleanText(item.classification)) : ""),
    sourceBacked: cleanText(item.sourceBacked) || (url ? "URL provided by result text" : "No usable URL supplied by source."),
    rawText
  };
}

function buildSearchLimitations(liveSearch, resultsFound) {
  const limitations = [];
  if (!liveSearch.webSearchExecuted) {
    limitations.push("Live search was unavailable, so no source records could be retrieved.");
  } else if (!resultsFound.length) {
    limitations.push("Live search completed, but no visible structured source-backed result records were returned.");
  }
  if (liveSearch.noReliableMatchesReason) {
    limitations.push(liveSearch.noReliableMatchesReason);
  }
  if (!normalizeResearchRecordArray(liveSearch.strongComparables, "strongComparables").length) {
    limitations.push("No exact or strong comparable records are visible in this report.");
  }
  if (normalizeResearchRecordArray(liveSearch.weakMatches, "weakMatches").length || normalizeResearchRecordArray(liveSearch.rejectedMatches, "rejectedMatches").length) {
    limitations.push("Weak and rejected matches are shown for transparency but do not establish fair market value.");
  }
  if (resultsFound.some((item) => item.priceType === "Active asking price")) {
    limitations.push("Active asking prices are not confirmed sold evidence.");
  }

  return limitations.length ? limitations : ["Source-backed results are shown with their evidence role and limitations."];
}

function countVisibleResearchResults(report = {}) {
  return [
    report.resultsFound,
    report.strongComparables,
    report.partialComparables,
    report.referenceResults,
    report.weakMatches,
    report.rejectedMatches
  ].flat().filter(Boolean).length;
}

function countReferenceSupportingResearchResults(report = {}) {
  return [
    report.strongComparables,
    report.partialComparables,
    report.referenceResults
  ].flat().filter(isUsableSourceRecord).length;
}

function isUsableSourceRecord(item) {
  if (!item) {
    return false;
  }
  if (typeof item === "string") {
    return /https?:\/\//i.test(item) || /\b(source|platform|site|marketplace)\s*[:=-]/i.test(item);
  }
  return Boolean(item.url || (item.source && !/not supplied/i.test(item.source)));
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

function classifyValuationEvidence({ report = {}, reliableCompsFound = false, searchCompleted = false } = {}) {
  const evidenceText = [
    report.valueRating,
    report.priceConfidence,
    report.pricingConfidence,
    report.valuationConfidence,
    report.liveCompConfidence,
    report.buyerDecisionConfidence,
    report.priceBasis,
    report.currentPriceAssessment,
    report.researchResults,
    report.comparableQuality,
    report.noReliableComparableItemsFound,
    report.aiOnlyRoughValueRange,
    report.estimatedFairMarketValue,
    report.fairPriceRange,
    report.estimatedMarketValue
  ].flat().map(cleanText).join(" ").toLowerCase();
  const valueRating = cleanText(report.valueRating).toLowerCase();
  const hasInsufficientRating = valueRating === "insufficient evidence" || /\binsufficient evidence\b/.test(evidenceText);
  const hasWeakEvidence = /no reliable|weak|partial|rejected|ai-only|ai only|rough value|active listing|active asking|not established|unavailable|low confidence|source-backed comps? (?:were )?not available/.test(evidenceText);
  const range = extractValuationEvidenceRange(report);

  if (reliableCompsFound && !hasInsufficientRating && !hasWeakEvidence) {
    return {
      state: "supported",
      label: "Estimated Fair Market Value",
      range,
      confidence: "Supported",
      explanation: "Exact or strong source-backed comparable evidence supports a fair-market-value estimate."
    };
  }

  if (range) {
    return {
      state: "preliminary",
      label: "Preliminary Reference Range",
      range,
      confidence: "Low",
      explanation: searchCompleted
        ? "No strong or confirmed sold comparable evidence supports a fair-market-value estimate. This range is only a reference from weak, partial, active, or category-level evidence found during the current search."
        : "Live comparable search did not produce source-backed valuation evidence. This range is only a cautious reference from item evidence and market reasoning."
    };
  }

  return {
    state: "insufficient",
    label: "Fair Value Not Established",
    range: "",
    confidence: "Low",
    explanation: "The available evidence is too weak for a defensible dollar range."
  };
}

function applyValuationEvidenceLabels(report, { reliableCompsFound = false, searchCompleted = false, workflow = "" } = {}) {
  let classified = classifyValuationEvidence({ report, reliableCompsFound, searchCompleted });
  const visibleResultCount = countVisibleResearchResults(report);
  const supportingResultCount = countReferenceSupportingResearchResults(report);
  if (classified.state === "preliminary" && supportingResultCount === 0) {
    classified = {
      state: "insufficient",
      label: "Fair Value Not Established",
      range: "",
      confidence: "Low",
      explanation: "The report did not include visible structured strong, partial, or reference records to support a preliminary range."
    };
  }
  const normalized = {
    ...report,
    valuationEvidenceState: classified.state,
    valuationEvidenceLabel: classified.label,
    valuationEvidenceExplanation: classified.explanation
  };

  if (supportingResultCount === 0) {
    return applyZeroEvidenceGuard(normalized, { workflow });
  }

  if (workflow === "listing") {
    normalized.pricingEvidenceState = classified.state;
    normalized.pricingRationale = ensurePrefix(normalized.pricingRationale, `Valuation evidence state: ${classified.state}. `);
    return normalized;
  }

  if (classified.state === "supported") {
    normalized.estimatedFairMarketValue = normalizeMoneyLabelText(normalized.estimatedFairMarketValue);
    normalized.estimatedMarketValue = normalizeMoneyLabelText(normalized.estimatedMarketValue);
    normalized.fairPriceRange = normalizeMoneyLabelArray(normalized.fairPriceRange);
    normalized.preliminaryReferenceRange = "";
    normalized.fairValueNotEstablished = "";
    return normalized;
  }

  if (classified.state === "preliminary") {
    const reference = buildPreliminaryReferenceRangeText(classified, { searchCompleted, visibleResultCount: supportingResultCount });
    normalized.preliminaryReferenceRange = reference;
    normalized.referenceRangeBasis = cleanText(normalized.referenceRangeBasis)
      || `${supportingResultCount} visible strong, partial, or reference result${supportingResultCount === 1 ? "" : "s"} support this preliminary reference range. ${visibleResultCount} total search result${visibleResultCount === 1 ? "" : "s"} are visible in Research Details.`;
    normalized.fairValueNotEstablished = "";
    normalized.estimatedFairMarketValue = "";
    normalized.estimatedMarketValue = "";
    normalized.fairPriceRange = [];
    normalized.valueRating = /insufficient evidence/i.test(cleanText(normalized.valueRating))
      ? "Insufficient Evidence"
      : normalized.valueRating;
    normalized.whatThisMeans = buildWeakEvidenceMeaningText({ report: normalized, classified });
    normalized.bestNextStep = buildBestNextEvidenceStep(normalized);
    normalized.priceBasis = ensurePrefix(normalized.priceBasis, "Preliminary reference only - active asking prices, weak partial results, or AI reasoning are not confirmed fair market value. ");
    normalized.currentPriceAssessment = buildCautiousCurrentPriceAssessment(normalized.currentPriceAssessment, { report: normalized, classified });
    return normalized;
  }

  normalized.preliminaryReferenceRange = "";
  normalized.fairValueNotEstablished = "Fair Value: Not established";
  normalized.estimatedFairMarketValue = "";
  normalized.estimatedMarketValue = "";
  normalized.fairPriceRange = [];
  normalized.valueRating = "Insufficient Evidence";
  normalized.recommendation = cleanText(normalized.recommendation) || "Need More Information";
  normalized.whatThisMeans = "Fair market value has not been established from the available evidence. Do not treat this as a confirmed value estimate.";
  normalized.bestNextStep = buildBestNextEvidenceStep(normalized);
  normalized.priceBasis = ensurePrefix(normalized.priceBasis, "Fair value not established - available evidence is too weak for a defensible dollar range. ");
  normalized.referenceRangeBasis = "No numeric preliminary range is shown because there are no visible structured source records supporting one.";
  return normalized;
}

function applyZeroEvidenceGuard(report, { workflow = "" } = {}) {
  const askingPriceText = firstKnown(report.askingPrice, report.currentAskingPrice, report.visiblePrice);
  const safeLowDownsideText = buildZeroEvidenceLowDownsideText(askingPriceText);
  const sanitized = sanitizeZeroEvidenceMarketText(report, askingPriceText);

  const guarded = {
    ...sanitized,
    valuationEvidenceState: "insufficient",
    valuationEvidenceLabel: "Fair Value Not Established",
    valuationEvidenceExplanation: "Zero visible structured source-backed comparable results were retained. Market value is not established.",
    pricingEvidenceState: workflow === "listing" ? "insufficient" : sanitized.pricingEvidenceState,
    estimatedFairMarketValue: null,
    estimatedMarketValue: null,
    fairPriceRange: [],
    preliminaryReferenceRange: null,
    referenceRangeBasis: null,
    referenceCenter: null,
    marketLow: null,
    marketHigh: null,
    activeAskingRange: null,
    soldRange: null,
    priceToMarketRatio: null,
    belowMarketPercent: null,
    aiOnlyRoughValueRange: null,
    suggestedListingPrice: null,
    expectedSalePrice: null,
    minimumAcceptablePrice: null,
    recommendedListingPrice: null,
    suggestedOfferRange: null,
    fairValueNotEstablished: "Fair Value: Not established",
    valueRating: "Insufficient Evidence",
    whatThisMeans: "The current search did not return visible source-backed comparable evidence. Fair value is not established.",
    priceBasis: "Fair value not established - the current search did not return visible source-backed comparable evidence.",
    currentPriceAssessment: "Insufficient evidence - no source-backed market comparison is supported.",
    pricingRationale: safeLowDownsideText,
    cautiousBuyExplanation: shouldAllowZeroEvidencePersonalBuy(report, askingPriceText)
      ? safeLowDownsideText
      : "",
    consumerDownsideRisk: askingPriceText
      ? `Limited-dollar exposure can be considered from the user's asking price (${askingPriceText}) only. No market comparison was established.`
      : "No asking price was available for a downside-only personal-use assessment.",
    recommendedOffer: [],
    openingOffer: "Not source-supported - no market value was established.",
    targetPurchasePrice: "Not source-supported - no market value was established.",
    maximumRecommendedPrice: "Not source-supported - no market value was established.",
    maximumRecommendedBuyPrice: "Not source-supported - no market value was established.",
    walkAwayPrice: "No market-based walk-away price is supported without visible comparable evidence.",
    negotiationGuidance: askingPriceText
      ? `Only the user's asking price (${askingPriceText}) is visible. Any personal-use decision should be based on limited financial exposure, condition, and whether the buyer likes the item; not on an established market value.`
      : "No market-based negotiation guidance is supported without visible comparable evidence.",
    reasonsForCaution: mergeStringArrays(
      sanitized.reasonsForCaution,
      ["No visible source-backed comparable evidence was retained.", "Market value was not established."],
      8
    ),
    additionalInformationNeeded: mergeStringArrays(
      sanitized.additionalInformationNeeded,
      ["Visible exact or strong source-backed comparable records are needed before showing source-backed price guidance."],
      8
    )
  };

  if (shouldAllowZeroEvidencePersonalBuy(report, askingPriceText)) {
    guarded.recommendation = cleanText(report.recommendation) && !/need more information/i.test(report.recommendation)
      ? report.recommendation
      : "Buy";
    guarded.reasonsToBuy = [safeLowDownsideText];
  } else if (!cleanText(guarded.recommendation)) {
    guarded.recommendation = "Need More Information";
  }

  return guarded;
}

function shouldAllowZeroEvidencePersonalBuy(report, askingPriceText) {
  const amount = extractFirstMoneyAmount(askingPriceText);
  return /personal_use/i.test(cleanText(report.buyerIntent || report.purchase_intent || ""))
    && Number.isFinite(amount)
    && amount <= consumerDecisionThresholds.lowDollarCautiousBuyMax
    && !/repair|missing|not working|for parts|unsafe|authenticity/i.test([report.productOrConditionRisks, report.riskFlags].flat().join(" "));
}

function buildZeroEvidenceLowDownsideText(askingPriceText) {
  const price = askingPriceText || "the stated asking price";
  return `At ${price}, this may be a reasonable personal-use purchase only because the financial exposure is limited and the item appears identifiable from the submitted evidence. The current search did not return visible source-backed comparable evidence, so market value was not established.`;
}

function sanitizeZeroEvidenceMarketText(value, askingPriceText, key = "") {
  const allowedPriceKeys = new Set(["askingPrice", "currentAskingPrice", "visiblePrice"]);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeZeroEvidenceMarketText(item, askingPriceText, key)).filter((item) => item !== "");
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] = sanitizeZeroEvidenceMarketText(childValue, askingPriceText, childKey);
    }
    return result;
  }
  if (typeof value !== "string") {
    return value;
  }
  if (allowedPriceKeys.has(key)) {
    return value;
  }
  return sanitizeUnsupportedMarketText(value, askingPriceText);
}

function sanitizeUnsupportedMarketText(text, askingPriceText = "") {
  const source = cleanText(text);
  if (!source) return source;
  const hasUnsupportedMarketClaim = /reference center|market range|median market|market low|market high|active asking range|sold range|price-to-market|below[- ]market|below inferred|inferred fair|estimated fair market|fair market value|market suggests|visible market evidence|typical market|derived market|source-backed value/i.test(source);
  const hasMoneyRange = /\$\s*\d[\d,]*(?:\.\d{1,2})?\s*(?:-|to|–|—)\s*\$?\s*\d[\d,]*(?:\.\d{1,2})?/.test(source);
  const hasPercentMarket = /\b\d{1,3}%\b.*\b(market|value|below|above|discount)/i.test(source);
  const askingAmount = extractFirstMoneyAmount(askingPriceText);
  const amounts = extractMoneyAmounts(source);
  const hasNonAskingMoney = amounts.some((amount) => !Number.isFinite(askingAmount) || Math.round(amount) !== Math.round(askingAmount));

  if (hasUnsupportedMarketClaim || hasMoneyRange || hasPercentMarket || (hasNonAskingMoney && /\bmarket|value|range|reference|asking|sold|price|below|above\b/i.test(source))) {
    return "The current search did not return visible source-backed comparable evidence. Fair value is not established.";
  }

  return source;
}

function extractValuationEvidenceRange(report = {}) {
  const sourceText = [
    report.preliminaryReferenceRange,
    report.estimatedFairMarketValue,
    report.fairPriceRange,
    report.aiOnlyRoughValueRange,
    report.estimatedMarketValue,
    report.expectedSalePrice,
    report.suggestedListingPrice
  ].flat().map(cleanText).filter(Boolean).join(" ");
  const strongRange = extractMoneyRange(sourceText);
  if (strongRange) {
    return formatMoneyRange(strongRange[0], strongRange[1]);
  }

  const looseAmounts = extractLooseMoneyAmounts(sourceText);
  if (looseAmounts.length >= 2) {
    return formatMoneyRange(Math.min(...looseAmounts), Math.max(...looseAmounts));
  }

  if (looseAmounts.length === 1) {
    const amount = looseAmounts[0];
    return formatMoneyRange(amount * 0.8, amount * 1.2);
  }

  return "";
}

function extractLooseMoneyAmounts(text) {
  const values = [];
  const source = String(text || "");
  const patterns = [
    /\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/g,
    /\b(?:about|around|approx(?:imately)?|range|from|between|value|price|worth|listing|asking|listed)\D{0,24}(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:-|to|and)\s*\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/gi,
    /\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:-|to)\s*\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      const groups = match.slice(1).filter(Boolean);
      for (const group of groups) {
        const amount = Number(group.replace(/,/g, ""));
        if (Number.isFinite(amount) && amount > 0 && amount < 100000) {
          values.push(amount);
        }
      }
    }
  }

  return [...new Set(values)];
}

function buildPreliminaryReferenceRangeText(classified, { searchCompleted, visibleResultCount = 0 }) {
  const evidence = searchCompleted
    ? `based on ${visibleResultCount} visible similar active listing or partial/reference result${visibleResultCount === 1 ? "" : "s"} found during the current search`
    : "based on item evidence and AI market reasoning because live source-backed comps were unavailable";
  return `${classified.range} ${evidence}; no confirmed sales or strong comparable matches were found. This is not a verified fair-market-value estimate.`;
}

function buildWeakEvidenceMeaningText({ report, classified }) {
  const askingAmounts = extractMoneyAmounts([report.askingPrice, report.currentAskingPrice].join(" "));
  const rangeAmounts = extractMoneyAmounts(classified.range);
  if (askingAmounts.length && rangeAmounts.length >= 2) {
    const asking = askingAmounts[0];
    const low = Math.min(...rangeAmounts);
    if (asking < low) {
      return `At ${formatMoney(asking)}, the price may be favorable relative to similar active listings, but there is not enough reliable evidence for a confident Buy recommendation.`;
    }
  }

  return "The price may be directionally useful, but fair market value has not been established because no confirmed sales or strong comparable matches were found.";
}

function buildBestNextEvidenceStep(report) {
  const existing = firstKnown(
    Array.isArray(report.whatToVerifyBeforeBuying) ? report.whatToVerifyBeforeBuying[0] : report.whatToVerifyBeforeBuying,
    Array.isArray(report.additionalInformationNeeded) ? report.additionalInformationNeeded[0] : report.additionalInformationNeeded,
    Array.isArray(report.missingDetails) ? report.missingDetails[0] : report.missingDetails
  );

  return existing || "Add one clear close-up of the strongest label, model number, SKU, UPC/barcode, maker mark, measurement, or condition issue.";
}

function buildCautiousCurrentPriceAssessment(value, { report, classified }) {
  const text = cleanText(value);
  const meaning = buildWeakEvidenceMeaningText({ report, classified });
  if (!text || /excellent value|good value|below market|fair market value/i.test(text)) {
    return `Unknown - ${meaning}`;
  }
  return ensurePrefix(text, "Low-confidence assessment - ");
}

function normalizeMoneyLabelText(value) {
  const text = cleanText(value);
  if (!text) {
    return "";
  }

  return text
    .replace(/\$?\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s+(?:to|through)\s+\$?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b/g, (_, low, high) => `${formatMoney(Number(low.replace(/,/g, "")))}-${formatMoney(Number(high.replace(/,/g, "")))}`)
    .replace(/\$?\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*-\s*\$?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b/g, (_, low, high) => `${formatMoney(Number(low.replace(/,/g, "")))}-${formatMoney(Number(high.replace(/,/g, "")))}`);
}

function formatMoneyInputText(value) {
  const text = cleanText(value);
  if (!text) {
    return "";
  }
  if (/^\$/.test(text)) {
    return normalizeMoneyLabelText(text);
  }
  const plainAmount = text.match(/^(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)$/);
  if (plainAmount) {
    return formatMoney(Number(plainAmount[1].replace(/,/g, "")));
  }
  return normalizeMoneyLabelText(text);
}

function normalizeMoneyLabelArray(value) {
  return Array.isArray(value)
    ? value.map(normalizeMoneyLabelText).filter(Boolean)
    : normalizeMoneyLabelText(value);
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
  const researchVisibility = buildResearchVisibilityFields({ ...liveSearch, liveSearchStatus: liveComparableSearchStatus });
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

  const normalizedReport = {
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
    ...researchVisibility,
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

  return applyValuationEvidenceLabels(normalizedReport, {
    reliableCompsFound,
    searchCompleted,
    workflow: "market_value"
  });
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
  const priceEvidence = summarizeConsumerVisiblePriceEvidence(liveSearch);
  const retainedVisibleResultCount = Number(liveSearch.searchDiagnostics?.retainedVisibleResultCount || liveSearch.visibleResearchResultCount || 0);
  const fairValueNumber = priceEvidence.referenceCenter || (retainedVisibleResultCount ? extractConsumerFairValueNumber(report) : null);
  const conditionProfile = getConsumerConditionProfile(buyerIntake, identity);
  const decision = classifyConsumerPurchaseDecision({
    askingPriceNumber,
    fairValueNumber,
    reliableCompsFound,
    exactItems,
    similarItems,
    conditionProfile,
    buyerIntake,
    identity,
    priceEvidence
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
  const productRisks = sanitizeConsumerRiskList(
    mergeStringArrays(
      report.productOrConditionRisks,
      decision.riskFlags.map((flag) => `Risk flag: ${flag}`),
      conditionProfile.risks,
      12
    ),
    { buyerIntake, identity }
  ).slice(0, 8);
  const betterValueConsiderations = sanitizeBetterValueConsiderations(
    normalizeFlexibleArray(report.betterValueConsiderations, 8, buildConsumerBetterValueConsiderations(decision, conditionProfile)),
    { decision, conditionProfile }
  );
  const visualFields = buildVisualRecognitionReportFields(identity);
  const identityFields = buildIdentityReportFields(identity, { ...liveSearch, liveSearchStatus });
  const researchVisibility = buildResearchVisibilityFields({ ...liveSearch, liveSearchStatus });

  const normalizedReport = {
    ...report,
    buyerIntent: "personal_use",
    identifiedItem: cleanText(report.identifiedItem || buildIdentifiedItem(identity)),
    identificationConfidence: ensureConfidenceLayer(report.identificationConfidence, "Medium", "Identification is based on submitted photos, visible text, typed buyer details, and source-routing results."),
    ...visualFields,
    ...identityFields,
    ...researchVisibility,
    evidenceFoundInPhotos: buildPhotoEvidence(identity),
    askingPrice: buildConsumerAskingPriceText(buyerIntake, identity),
    preliminaryReferenceRange: cleanText(report.preliminaryReferenceRange) || buildConsumerPreliminaryReferenceRange(priceEvidence, conditionProfile),
    referenceRangeBasis: cleanText(report.referenceRangeBasis) || priceEvidence.referenceRangeBasis || researchVisibility.referenceRangeBasis,
    priceBasis: ensurePrefix(report.priceBasis, priceEvidence.priceBasis || "Pricing basis distinguishes exact identity matches from active asking-price evidence and confirmed sold evidence."),
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
    consumerDownsideRisk: decision.downsideRisk.summary,
    cautiousBuyExplanation: decision.cautiousBuyExplanation,
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
    betterValueConsiderations,
    researchResults,
    comparableQuality,
    pricingConfidence: decision.pricingConfidence,
    pricingRationale: ensurePrefix(report.pricingRationale, `${basis} ${decision.cautiousBuyExplanation || ""}`),
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

  return applyValuationEvidenceLabels(normalizedReport, {
    reliableCompsFound,
    searchCompleted,
    workflow: "personal_use"
  });
}

function classifyConsumerPurchaseDecision({ askingPriceNumber, fairValueNumber, reliableCompsFound, exactItems, similarItems, conditionProfile, buyerIntake, identity, priceEvidence = {} }) {
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
  const hasExactIdentityEvidence = priceEvidence.exactOrStrongCount > 0 || exactItems.length > 0;
  const hasReliableEvidence = reliableCompsFound && (hasExactIdentityEvidence || similarItems.length > 0);
  const downsideRisk = calculateConsumerDownsideRisk({
    askingPriceNumber,
    fairValueNumber,
    conditionProfile,
    buyerIntake
  });
  const cautiousBuy = isCautiousConsumerBuySupported({
    askingPriceNumber,
    fairValueNumber,
    hasExactIdentityEvidence,
    priceEvidence,
    conditionProfile,
    downsideRisk
  });
  const clearIdentity = hasClearConsumerIdentity(identity);
  const zeroEvidenceLowDownsideBuy = hasAskingPrice
    && !hasFairValue
    && downsideRisk.lowDollarExposure
    && clearIdentity
    && !conditionProfile.hasHardRisk
    && !downsideRisk.hardFactors.length;

  if (zeroEvidenceLowDownsideBuy) {
    return {
      valueRating: "Insufficient Evidence",
      recommendation: "Buy",
      pricingConfidence: forceLowConfidence("", "Market value is not established because no visible structured comparable evidence was retained. The recommendation is based only on limited dollar exposure and item clarity."),
      riskFlags,
      downsideRisk,
      cautiousBuyExplanation: buildZeroEvidenceLowDownsideText(formatMoney(askingPriceNumber)),
      evidenceWarning: "Valuation evidence is insufficient; this is a low-dollar personal-use decision, not a market-value conclusion."
    };
  }

  if (!hasAskingPrice || !hasFairValue || (!hasReliableEvidence && !cautiousBuy)) {
    return {
      valueRating: "Insufficient Evidence",
      recommendation: "Need More Information",
      pricingConfidence: forceLowConfidence("", buildConsumerLowConfidenceReason({ hasAskingPrice, hasFairValue, hasReliableEvidence })),
      riskFlags,
      downsideRisk,
      cautiousBuyExplanation: "",
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

  if (cautiousBuy && (recommendation === "Pass" || recommendation === "Need More Information" || recommendation === "Wait for a Better Price" || recommendation === "Negotiate")) {
    valueRating = priceEvidence.soldCount > 0 ? "Good Value" : "Potentially Good Value";
    recommendation = "Buy";
  }

  if (conditionProfile.hasHardRisk) {
    if (valueRating === "Exceptional Value" || valueRating === "Good Value") {
      valueRating = "Fair Price";
    }
    if (recommendation === "Buy") {
      recommendation = "Negotiate";
    }
  } else if (conditionProfile.hasModerateRisk && recommendation === "Buy" && !cautiousBuy) {
    recommendation = "Buy If It Fits Your Needs";
  }

  if (conditionProfile.isUnknown && !downsideRisk.lowDollarExposure && (recommendation === "Buy" || recommendation === "Buy If It Fits Your Needs")) {
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
    pricingConfidence: cautiousBuy
      ? ensureConfidenceLayer("", "Medium", "Exact or strong visible source-backed identity evidence and limited dollar downside support a cautious personal-use Buy; active asking prices are not confirmed sold prices.")
      : exactItems.length || priceEvidence.exactOrStrongCount
        ? ensureConfidenceLayer("", "Medium", "Exact or likely exact source-backed evidence supports the price direction, but condition and buyer fit still matter.")
        : ensureConfidenceLayer("", "Medium", "Strong similar source-backed evidence supports the price direction, but exact model, condition, and accessories can shift value."),
    riskFlags,
    downsideRisk,
    cautiousBuyExplanation: cautiousBuy ? buildCautiousBuyExplanation({
      askingPriceNumber,
      fairValueNumber,
      priceEvidence,
      conditionProfile,
      downsideRisk
    }) : "",
    evidenceWarning: cautiousBuy
      ? "Buy recommendation is cautious because the strongest price evidence may be active asking prices rather than confirmed sold prices."
      : ""
  };
}

function deriveConsumerDecision(args) {
  return classifyConsumerPurchaseDecision(args);
}

function hasClearConsumerIdentity(identity = {}) {
  const evidence = [
    identity.subjectIdentity,
    identity.exactProductIdentity,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.brand,
    identity.teamName,
    identity.schoolName,
    identity.visualSubject,
    identity.likelyItemDescription,
    ...(Array.isArray(identity.visibleText) ? identity.visibleText : [])
  ].filter(hasKnownValue);
  return evidence.length >= 3 && !normalizeStringArray(identity.identityConflictNotes, 4).length;
}

function summarizeConsumerVisiblePriceEvidence(liveSearch = {}) {
  const records = [
    ...normalizeResearchRecordArray(liveSearch.strongComparables, "strongComparables"),
    ...normalizeResearchRecordArray(liveSearch.partialComparables, "partialComparables"),
    ...normalizeResearchRecordArray(liveSearch.referenceResults, "referenceResults")
  ].filter(isUsableSourceRecord);
  const exactOrStrongRecords = records.filter((record) => /exact|strong/i.test(record.classification || record.matchExplanation || record.rawText || ""));
  const pricedRecords = exactOrStrongRecords
    .map((record) => ({
      ...record,
      amount: extractFirstMoneyAmount(record.displayedPrice || record.rawText)
    }))
    .filter((record) => Number.isFinite(record.amount) && record.amount > 0);
  const soldRecords = pricedRecords.filter((record) => /sold/i.test(record.priceType || ""));
  const activeRecords = pricedRecords.filter((record) => /active|asking|listed|for sale/i.test(record.priceType || record.rawText || ""));
  const amounts = pricedRecords.map((record) => record.amount).sort((a, b) => a - b);
  const activeAmounts = activeRecords.map((record) => record.amount).sort((a, b) => a - b);
  const soldAmounts = soldRecords.map((record) => record.amount).sort((a, b) => a - b);
  const basisParts = [];

  if (soldAmounts.length) {
    basisParts.push(`${soldAmounts.length} exact/strong sold-price result${soldAmounts.length === 1 ? "" : "s"}`);
  }
  if (activeAmounts.length) {
    basisParts.push(`${activeAmounts.length} exact/strong active asking-price result${activeAmounts.length === 1 ? "" : "s"}`);
  }

  const referenceCenter = amounts.length ? medianAmount(amounts) : null;
  const low = amounts.length ? Math.min(...amounts) : null;
  const high = amounts.length ? Math.max(...amounts) : null;

  return {
    records,
    exactOrStrongRecords,
    pricedRecords,
    soldCount: soldAmounts.length,
    activeCount: activeAmounts.length,
    exactOrStrongCount: exactOrStrongRecords.length,
    low,
    high,
    referenceCenter,
    activeLow: activeAmounts.length ? Math.min(...activeAmounts) : null,
    activeHigh: activeAmounts.length ? Math.max(...activeAmounts) : null,
    priceBasis: basisParts.length
      ? `Visible price basis - ${basisParts.join("; ")}. Active asking prices support a practical buyer comparison but are not confirmed sold values.`
      : "",
    referenceRangeBasis: amounts.length
      ? `${amounts.length} visible priced exact/strong result${amounts.length === 1 ? "" : "s"} support a preliminary personal-use reference range. Active asking prices are labeled separately from sold prices.`
      : ""
  };
}

function calculateConsumerDownsideRisk({ askingPriceNumber, fairValueNumber, conditionProfile, buyerIntake }) {
  const hasAsking = Number.isFinite(askingPriceNumber);
  const exposure = hasAsking ? askingPriceNumber : null;
  const lowDollarExposure = hasAsking && askingPriceNumber <= consumerDecisionThresholds.lowDollarCautiousBuyMax;
  const modestDollarExposure = hasAsking && askingPriceNumber <= consumerDecisionThresholds.modestDollarCautiousBuyMax;
  const ratio = Number.isFinite(fairValueNumber) && fairValueNumber > 0 && hasAsking
    ? askingPriceNumber / fairValueNumber
    : null;
  const hardFactors = [];
  const context = cleanText(buyerIntake.purchase_context).toLowerCase();

  if (conditionProfile.hasHardRisk) hardFactors.push("hard condition/functionality risk");
  if (conditionProfile.missingParts) hardFactors.push("missing parts risk");
  if (conditionProfile.repairRisk) hardFactors.push("repair or functionality risk");
  if (/freight|delivery|shipping|oversized|transport|appliance|furniture/.test(context)) hardFactors.push("possible transport or delivery exposure");

  return {
    exposure,
    ratio,
    lowDollarExposure,
    modestDollarExposure,
    hardFactors,
    summary: hasAsking
      ? `${lowDollarExposure ? "Low" : modestDollarExposure ? "Moderate" : "Higher"} absolute downside at ${formatMoney(askingPriceNumber)}${Number.isFinite(ratio) ? ` (${Math.round(ratio * 100)}% of the visible reference center)` : ""}. ${hardFactors.length ? `Caution factors: ${hardFactors.join(", ")}.` : "No major added-cost factor was identified from the intake."}`
      : "Downside cannot be calculated because the asking price is missing."
  };
}

function isCautiousConsumerBuySupported({ askingPriceNumber, fairValueNumber, hasExactIdentityEvidence, priceEvidence, conditionProfile, downsideRisk }) {
  if (!Number.isFinite(askingPriceNumber) || !Number.isFinite(fairValueNumber) || fairValueNumber <= 0) {
    return false;
  }
  if (!hasExactIdentityEvidence || !priceEvidence.pricedRecords?.length) {
    return false;
  }
  if (conditionProfile.hasHardRisk || downsideRisk.hardFactors.length) {
    return false;
  }
  const belowVisibleLow = Number.isFinite(priceEvidence.low) && askingPriceNumber < priceEvidence.low;
  const favorableRatio = askingPriceNumber / fairValueNumber <= consumerDecisionThresholds.cautiousBuyMaxRatio;
  return (downsideRisk.lowDollarExposure || downsideRisk.modestDollarExposure) && (belowVisibleLow || favorableRatio);
}

function buildCautiousBuyExplanation({ askingPriceNumber, fairValueNumber, priceEvidence, conditionProfile, downsideRisk }) {
  const range = Number.isFinite(priceEvidence.low) && Number.isFinite(priceEvidence.high)
    ? `${formatMoney(priceEvidence.low)}-${formatMoney(priceEvidence.high)}`
    : "the visible exact/strong listing range";
  const priceTypeText = priceEvidence.soldCount
    ? `${priceEvidence.soldCount} sold result${priceEvidence.soldCount === 1 ? "" : "s"} plus ${priceEvidence.activeCount} active asking result${priceEvidence.activeCount === 1 ? "" : "s"}`
    : `${priceEvidence.activeCount} active asking result${priceEvidence.activeCount === 1 ? "" : "s"} and no confirmed sold-price result`;
  const conditionText = conditionProfile.hasModerateRisk
    ? "Visible/entered wear or used condition lowers confidence and should keep the value estimate below clean examples."
    : "No major condition adjustment was triggered by the current intake.";
  return `Cautious Buy logic - The ${formatMoney(askingPriceNumber)} asking price is below the visible exact/strong reference center of about ${formatMoney(fairValueNumber)} and below or favorable to ${range}. Evidence is ${priceTypeText}, so this is a cautious personal-use Buy rather than a high-confidence fair-market-value call. ${conditionText} ${downsideRisk.summary}`;
}

function buildConsumerPreliminaryReferenceRange(priceEvidence, conditionProfile) {
  if (!priceEvidence.pricedRecords?.length || !Number.isFinite(priceEvidence.low) || !Number.isFinite(priceEvidence.high)) {
    return "";
  }
  let low = priceEvidence.low;
  let high = priceEvidence.high;
  if (conditionProfile.hasHardRisk) {
    low *= 0.55;
    high *= 0.7;
  } else if (conditionProfile.hasModerateRisk) {
    low *= 0.8;
    high *= 0.85;
  }
  return `Preliminary Reference Range - approximately ${formatMoneyRange(roundMoney(low), roundMoney(high))} based on visible exact/strong source records. Active asking prices are not confirmed sold values, and condition can move the practical value lower.`;
}

function extractFirstMoneyAmount(text) {
  const amounts = extractMoneyAmounts(text);
  return amounts.length ? amounts[0] : null;
}

function medianAmount(amounts) {
  const sorted = amounts.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) {
    return null;
  }
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) {
    return sorted[middle];
  }
  return (sorted[middle - 1] + sorted[middle]) / 2;
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
  const olderModelSupported = isOlderModelRiskSupported({ buyerIntake, identity });

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
  if (isNoReturnProtectionSupported({ buyerIntake, identity })) {
    addUnique(flags, "No Return Protection");
  }
  if (/electronics|laptop|phone|tablet|camera|charger|software|locked|compatibility/.test(itemText)) {
    addUnique(flags, "Compatibility Risk");
  }
  if (conditionProfile.repairRisk) {
    addUnique(flags, "Repair Risk");
  }
  if (olderModelSupported) {
    addUnique(flags, "Older Model");
  }

  return flags.slice(0, 10);
}

function sanitizeConsumerRiskList(items, { buyerIntake, identity }) {
  const olderModelSupported = isOlderModelRiskSupported({ buyerIntake, identity });
  const noReturnSupported = isNoReturnProtectionSupported({ buyerIntake, identity });
  const noWarrantySupported = isNoWarrantyRiskSupported({ buyerIntake, identity });

  return normalizeStringArray(items, 12).filter((item) => {
    if (/^older model\b/i.test(item) || /\bolder model\b/i.test(item)) {
      return olderModelSupported;
    }
    if (/^no warranty\b/i.test(item) || /\bno warranty\b/i.test(item)) {
      return noWarrantySupported;
    }
    if (/^no return protection\b/i.test(item) || /\bno return protection\b/i.test(item)) {
      return noReturnSupported;
    }
    return true;
  });
}

function sanitizeBetterValueConsiderations(items, { decision, conditionProfile }) {
  const values = normalizeStringArray(items, 8);
  if (decision.recommendation !== "Buy" && decision.recommendation !== "Buy If It Fits Your Needs") {
    return values;
  }

  const riskText = [
    conditionProfile.risks,
    decision.riskFlags,
    decision.downsideRisk?.hardFactors,
    decision.downsideRisk?.moderateFactors
  ].flat().map(cleanText).join(" ").toLowerCase();
  const hasConcreteWaitRisk = /condition|missing|repair|authenticity|price above|compatibility|return protection|shipping|damage|incomplete|unclear/.test(riskText);

  return values.filter((item) => {
    if (!/\b(wait|similar item|another item|better value may be available|cleaner comparable|open-box|refurbished|comparable model)\b/i.test(item)) {
      return true;
    }
    return hasConcreteWaitRisk;
  });
}

function isOrdinaryVintageCollectibleContext({ buyerIntake, identity }) {
  const text = buildConsumerRiskContextText({ buyerIntake, identity });
  return /vintage|collectible|memorabilia|commemorative|souvenir|advertising|promotional|sports|team|school|mascot|licensed|collector'?s?\s+(?:tray|plate)|serving tray|plaque|tin|sign|ceramic|canister|cookie jar|holiday|christmas|santa|seasonal|antique/.test(text)
    && !/electronics|laptop|phone|tablet|camera|charger|appliance|tool|software|locked|compatibility|battery|processor|model specs/.test(text);
}

function isNoReturnProtectionSupported({ buyerIntake, identity }) {
  const context = cleanText(buyerIntake.purchase_context).toLowerCase();
  const text = buildConsumerRiskContextText({ buyerIntake, identity });
  return /^(facebook_marketplace|private_seller|flea_market|estate_sale)$/.test(context)
    || /\b(as[-\s]?is|final sale|no returns?|cash only|private seller|yard sale|garage sale|estate sale|flea market)\b/.test(text);
}

function isNoWarrantyRiskSupported({ buyerIntake, identity }) {
  const text = buildConsumerRiskContextText({ buyerIntake, identity });
  return /\b(no warranty|as[-\s]?is|final sale|untested|not working|for parts|electronics|laptop|phone|tablet|camera|appliance|power tool|battery|charger|software|locked)\b/.test(text);
}

function isOlderModelRiskSupported({ buyerIntake, identity }) {
  const text = buildConsumerRiskContextText({ buyerIntake, identity });
  if (isOrdinaryVintageCollectibleContext({ buyerIntake, identity })) {
    return false;
  }
  return /\b(older model|outdated|legacy|obsolete|unsupported|discontinued)\b/.test(text)
    && /\b(electronics|laptop|phone|tablet|camera|appliance|tool|software|compatibility|battery|charger|parts?)\b/.test(text);
}

function buildConsumerRiskContextText({ buyerIntake, identity }) {
  return [
    buyerIntake.purchase_context,
    buyerIntake.item_condition,
    buyerIntake.item_name,
    buyerIntake.known_brand,
    buyerIntake.known_manufacturer,
    buyerIntake.known_model,
    buyerIntake.known_sku,
    buyerIntake.approximate_age_era,
    buyerIntake.buyer_notes,
    Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns.join(" ") : "",
    identity.visualSubject,
    identity.visualSubjectCategory,
    identity.category,
    identity.likelyItemDescription,
    identity.productNameOrBoxTitle,
    identity.subjectIdentity,
    identity.exactProductIdentity,
    identity.distinctiveVisualDescription,
    identity.brand,
    identity.manufacturer,
    identity.teamName,
    identity.schoolName,
    identity.mascot,
    identity.model,
    identity.sku,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.brandSeries,
    Array.isArray(identity.visualIdentityEvidence) ? identity.visualIdentityEvidence.join(" ") : "",
    Array.isArray(identity.textIdentityEvidence) ? identity.textIdentityEvidence.join(" ") : ""
  ].map(cleanText).join(" ").toLowerCase();
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
    return `Current asking price: ${formatMoneyInputText(raw)}`;
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
    return `Current seller asking price: ${formatMoneyInputText(rawAskingPrice)}`;
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
  const diagnostics = liveSearch.searchDiagnostics || {};
  const allowedDomains = normalizeStringArray(liveSearch.allowedDomainsRequested || diagnostics.allowedDomainsRequested, 24);
  const domainsReturned = normalizeStringArray(liveSearch.domainsActuallyReturned || diagnostics.domainsActuallyReturned || liveSearch.sourcesReturned, 24);
  const providerSourceCount = Number(liveSearch.providerSourceCount || diagnostics.providerSourceCount || 0);
  const parsedCandidateCount = Number(liveSearch.parsedCandidateCount || diagnostics.parsedCandidateCount || diagnostics.parsedResultCount || 0);
  const normalizedCandidateCount = Number(liveSearch.normalizedCandidateCount || diagnostics.normalizedCandidateCount || diagnostics.normalizedResultCount || 0);
  const retainedVisibleResultCount = Number(liveSearch.retainedVisibleResultCount || diagnostics.retainedVisibleResultCount || 0);
  const rejectedCandidateCount = Number(liveSearch.rejectedCandidateCount || diagnostics.rejectedCandidateCount || diagnostics.rejectedResultCount || 0);
  const coverage = [
    `Source categories targeted: ${buildSourcesTargeted(liveSearch.sourceRoute).join("; ")}`
  ];

  coverage.push(`Search provider used: ${cleanText(liveSearch.searchProviderUsed || diagnostics.searchProviderUsed || "OpenAI web_search")}.`);

  if (allowedDomains.length) {
    coverage.push(`Marketplace-domain search requested across: ${allowedDomains.join(", ")}.`);
  } else {
    coverage.push("Marketplace-domain restrictions requested: none for open-web pass.");
  }

  if (diagnostics.sourcesActuallyQueried?.length) {
    coverage.push(`Provider queried: ${summarizeSourceLabels(diagnostics.sourcesActuallyQueried).join("; ")}.`);
  } else if (liveSearch.sourcesSearched && liveSearch.sourcesSearched.length) {
    coverage.push(`Provider-reported source scope: ${summarizeSourceLabels(liveSearch.sourcesSearched).join("; ")}.`);
  } else {
    coverage.push("Search provider queried: Live web search executed, but provider-level source scope was not separately exposed.");
  }

  if (domainsReturned.length) {
    coverage.push(`Domains actually returned: ${domainsReturned.join(", ")}.`);
  } else {
    coverage.push("Domains actually returned: none with URL-cited provider sources.");
  }

  coverage.push(`${providerSourceCount} provider source${providerSourceCount === 1 ? "" : "s"} returned.`);
  coverage.push(`${parsedCandidateCount} structured candidate${parsedCandidateCount === 1 ? "" : "s"} created; ${normalizedCandidateCount} normalized; ${retainedVisibleResultCount} visible comparable/reference record${retainedVisibleResultCount === 1 ? "" : "s"} retained; ${rejectedCandidateCount} rejected.`);

  for (const marketplaceDomain of allowedDomains.filter((domain) => /ebay\.com|etsy\.com|mercari\.com|poshmark\.com|worthpoint\.com|picclick\.com|facebook\.com|craigslist\.org|offerup\.com/i.test(domain))) {
    if (!domainsReturned.some((domain) => domain.toLowerCase() === marketplaceDomain.toLowerCase())) {
      coverage.push(`${marketplaceDomain}-restricted search was requested where supported, but no ${marketplaceDomain} source URLs were returned.`);
    }
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

  if (/holiday|christmas|santa|seasonal/.test(routeText)) {
    coverage.push("Targeted seasonal decor and collectible resale/reference source categories.");
  } else if (/collectible|vintage|ceramic|etsy|mercari|collector|resale|memorabilia|commemorative|advertising|promotional|sports|team|school|mascot/.test(routeText)) {
    coverage.push("Targeted collectible, resale, auction/archive, and reference source categories.");
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
  const sentQueries = normalizeStringArray(liveSearch.queriesActuallySent, 20);
  if (!liveSearch.webSearchExecuted || !sentQueries.length) {
    return [];
  }

  return ["These are the queries the system used.", ...sentQueries];
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
    && /ceramic|cookie jar|container|canister|decor|collectible|mascot|figurine|lid|lidded|memorabilia|commemorative|champion|championship|advertising|promotional|tray|serving tray|plate|plaque|tin|sign/.test(haystack);
}

function isBrandedMemorabiliaIdentity(identity, routeText, notesText) {
  const haystack = buildIdentitySearchHaystack(identity, routeText, notesText);
  return /memorabilia|commemorative|champion|championship|national champions?|sports|athletics|team|school|university|college|coach|player|mascot|official|licensed|souvenir|collector|collectible|tray|serving tray|collector'?s tray|plate|plaque|tin|sign/.test(haystack);
}

function isPromotionalCollectibleIdentity(identity, routeText, notesText) {
  const haystack = buildIdentitySearchHaystack(identity, routeText, notesText);
  return /advertising|promotional|promo|brand|beverage|soda|beer|tobacco|gas|oil|automotive|commemorative|souvenir|licensed|collector|collectible|tray|plate|plaque|tin|sign/.test(haystack);
}

function buildIdentitySearchHaystack(identity, routeText, notesText) {
  const visualRecognition = normalizeVisualRecognition(identity.visualRecognition || {});
  return [
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
    identity.brand,
    identity.manufacturer,
    identity.teamName,
    identity.schoolName,
    identity.mascot,
    identity.licensingStickerText,
    identity.copyrightWording,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    visualRecognition.visualSubject,
    visualRecognition.visualSubjectCategory,
    visualRecognition.recognizedOrganization,
    visualRecognition.recognizedBrand,
    normalizeStringArray(visualRecognition.visibleWords, 20).join(" "),
    normalizeStringArray(visualRecognition.visibleLetters, 8).join(" "),
    normalizeStringArray(visualRecognition.distinctiveFeatures, 10).join(" "),
    Array.isArray(identity.visualIdentityEvidence) ? identity.visualIdentityEvidence.join(" ") : "",
    Array.isArray(identity.textIdentityEvidence) ? identity.textIdentityEvidence.join(" ") : "",
    Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : ""
  ].join(" ").toLowerCase();
}

function collectVisibleSearchEvidence(identity, visualRecognition, notesText, buyerIntake = normalizeBuyerIntake({})) {
  const values = [
    buyerIntake.item_name,
    buyerIntake.known_brand,
    buyerIntake.known_manufacturer,
    buyerIntake.known_model,
    buyerIntake.known_sku,
    buyerIntake.known_upc,
    buyerIntake.approximate_age_era,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.manufacturerLocationText,
    identity.licensingStickerText,
    identity.copyrightWording,
    identity.brandSeries,
    identity.brand,
    identity.manufacturer,
    identity.teamName,
    identity.schoolName,
    identity.mascot,
    identity.model,
    identity.sku,
    identity.upcBarcode,
    identity.styleNumber,
    identity.dimensions,
    identity.category,
    identity.subjectIdentity,
    identity.exactProductIdentity,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    visualRecognition.visualSubject,
    visualRecognition.visualSubjectCategory,
    visualRecognition.recognizedOrganization,
    visualRecognition.recognizedBrand,
    visualRecognition.recognizedCharacter,
    visualRecognition.recognizedInstitution,
    visualRecognition.recognizedTheme,
    notesText
  ];
  const arrays = [
    visualRecognition.visibleWords,
    visualRecognition.visibleLetters,
    visualRecognition.visibleLogos,
    visualRecognition.distinctiveFeatures,
    visualRecognition.visualEvidence,
    identity.visualIdentityEvidence,
    identity.textIdentityEvidence,
    identity.visibleText,
    identity.strongestSearchableIdentifiers
  ];
  const evidence = [];
  for (const value of values) {
    addUnique(evidence, value);
  }
  for (const list of arrays) {
    for (const item of normalizeStringArray(list, 24)) {
      addUnique(evidence, item);
    }
  }
  return evidence.slice(0, 42);
}

function extractDistinctiveSearchPhrases(evidenceItems) {
  const phrases = [];
  for (const item of evidenceItems) {
    const source = normalizeTokenString(item).replace(/[?!]+/g, "").trim();
    if (!source) {
      continue;
    }
    const chunks = source
      .split(/\s*(?:[.;:|/\\]+|\s+-\s+)\s*/g)
      .map((chunk) => cleanSearchQuery(chunk, 9))
      .filter(Boolean);
    for (const chunk of chunks) {
      if (isDistinctiveSearchPhrase(chunk)) {
        addUnique(phrases, chunk);
      }
      const words = chunk.split(/\s+/).filter(Boolean);
      if (words.length > 8) {
        for (let start = 0; start <= words.length - 4; start += 2) {
          const windowText = words.slice(start, start + 6).join(" ");
          if (isDistinctiveSearchPhrase(windowText)) {
            addUnique(phrases, windowText);
          }
        }
      }
    }
  }
  return phrases
    .sort((a, b) => scoreDistinctivePhrase(b) - scoreDistinctivePhrase(a) || a.length - b.length)
    .slice(0, 14);
}

function isDistinctiveSearchPhrase(value) {
  const text = cleanText(value);
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 9) {
    return false;
  }
  if (/^(unknown|not verified|not provided|item|photo|image|used|vintage|collectible|decor|memorabilia)$/i.test(text)) {
    return false;
  }
  return /['&]|\b\d{3,14}\b|\b[A-Z][a-z]+ [A-Z][a-z]+\b|champion|official|collector|edition|commemorative|anniversary|licensed|national|world|conference|slogan|copyright|model|style|serial|upc|barcode|tray|plate|book|edition|author|artist|signature|brand|team|school|university/i.test(text);
}

function scoreDistinctivePhrase(value) {
  const text = cleanText(value);
  let score = 0;
  if (/\b(?:18|19|20)\d{2}\b/.test(text)) score += 5;
  if (/champion|national|world|conference|anniversary|commemorative|event/i.test(text)) score += 5;
  if (/['&]/.test(text)) score += 4;
  if (/official|collector|edition|licensed|copyright/i.test(text)) score += 3;
  if (/model|style|serial|upc|barcode|\b\d{8,14}\b/i.test(text)) score += 6;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount >= 2 && wordCount <= 5) score += 3;
  if (wordCount > 8) score -= 3;
  return score;
}

function extractSearchYears(text) {
  return [...new Set(String(text || "").match(/\b(?:18|19|20)\d{2}\b/g) || [])].slice(0, 4);
}

function extractLikelyNamedPeople(text) {
  const names = [];
  const source = String(text || "").replace(/[|/\\]+/g, " ");
  const matches = source.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z']+){1,3}\b/g) || [];
  for (const match of matches) {
    if (!/\b(National Champions?|Collector|Official|Workshop|Christmas|United States|New York|Los Angeles|Limited Edition|Collector Edition)\b/i.test(match)) {
      addUnique(names, match);
    }
  }
  return names.slice(0, 6);
}

function inferSearchItemType(identity, visualCategory, productTitle, notesText, routeText) {
  const haystack = [
    productTitle,
    identity.category,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    identity.visualSubject,
    visualCategory,
    notesText,
    routeText
  ].join(" ").toLowerCase();
  const knownTypes = [
    ["collector tray", /collector'?s tray|collector tray|serving tray|tray\b/],
    ["collector plate", /collector plate|commemorative plate|plate\b/],
    ["advertising sign", /advertising sign|tin sign|sign\b/],
    ["poster print", /poster|print|artwork|illustration/],
    ["book", /\bbook|author|edition|isbn\b/],
    ["toy", /\btoy|figure|action figure|doll\b/],
    ["tool", /\btool|drill|saw|wrench|model number\b/],
    ["appliance", /\bappliance|mixer|vacuum|washer|dryer|refrigerator\b/],
    ["holiday decor", /holiday|christmas|santa|seasonal|decor|figurine/],
    ["ceramic canister", /canister|cookie jar|ceramic jar|lidded/],
    ["apparel", /dress|shirt|jacket|shoe|pants|apparel|fashion/],
    ["electronics", /laptop|computer|phone|tablet|electronics/],
    ["furniture", /sofa|chair|table|dresser|cabinet|furniture/]
  ];
  for (const [label, pattern] of knownTypes) {
    if (pattern.test(haystack)) {
      return label;
    }
  }
  return mostDistinctiveCategoryWord(firstKnown(identity.category, visualCategory, productTitle, notesText));
}

function quoteSearchPhrase(value) {
  const text = cleanText(value).replace(/"/g, "").trim();
  if (!text) {
    return "";
  }
  return `"${text}"`;
}

function scoreSearchQuerySpecificity(query, context) {
  const text = String(query || "").toLowerCase();
  const quoted = getQuotedQueryPhrase(query);
  const quotedWordCount = quoted ? quoted.split(/\s+/).filter(Boolean).length : 0;
  let score = 0;
  if (/"[^"]{4,}"/.test(query)) score += 12;
  if (quoted && quotedWordCount <= 5 && /\b(?:18|19|20)\d{2}\b|champion|national|official|collector|edition|commemorative|['&]/i.test(quoted)) score += 6;
  if (quoted && /['&]|slogan|motto|catchphrase/i.test(quoted)) score += 8;
  if (quotedWordCount > 8) score -= 3;
  if (context.upc && text.includes(context.upc.toLowerCase())) score += 12;
  if (context.model && text.includes(context.model.toLowerCase())) score += 9;
  if (context.itemCode && text.includes(context.itemCode.toLowerCase())) score += 9;
  if (context.brand && text.includes(context.brand.toLowerCase())) score += 7;
  if (context.visualOrganization && text.includes(context.visualOrganization.toLowerCase())) score += 7;
  if (context.schoolName && text.includes(context.schoolName.toLowerCase())) score += 6;
  if (context.teamName && text.includes(context.teamName.toLowerCase())) score += 6;
  if (context.itemType && text.includes(context.itemType.toLowerCase().split(/\s+/)[0])) score += 5;
  if (/\b(?:18|19|20)\d{2}\b/.test(text)) score += 5;
  if (/champion|official|collector|edition|commemorative|anniversary|licensed|slogan|signed|artist|author|model|style|barcode|upc/.test(text)) score += 4;
  if (context.namedPeople.some((name) => text.includes(name.toLowerCase()))) score += 4;
  if (/old|vintage item|football collectible|collectible decor|price resale value|broad web search/.test(text)) score -= 5;
  return score;
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

function cleanSearchQuery(value, maxTerms = 10) {
  const text = normalizeTokenString(value)
    .replace(/\b(unknown|n\/a|none|not visible)\b/gi, "")
    .replace(/\b([A-Za-z0-9']+\s+[A-Za-z0-9']+)(\s+\1\b)+/gi, "$1")
    .replace(/\b(\w+)(\s+\1\b)+/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return trimQueryTerms(text, maxTerms);
}

function removeUnsupportedQueryDescriptors(value, context = {}) {
  let text = cleanText(value);
  const evidenceText = [
    context.visibleEvidence,
    context.distinctivePhrases,
    context.eventPhrases,
    context.notesText,
    context.labelText,
    context.productTitle,
    context.subjectIdentity
  ].flat().map(cleanText).join(" ").toLowerCase();

  if (!/\blimited edition\b/.test(evidenceText)) {
    text = text.replace(/\blimited edition\b/gi, "");
  }

  text = text
    .replace(/\b(?:prominent|bold|large|red|black|white|green|blue|yellow|gold|silver)\s+(?:lettering|letters|text|wording|font|type)\b/gi, "")
    .replace(/\btext on\b/gi, "")
    .replace(/\b(?:features?|shows?|depicts?)\b/gi, "")
    .replace(/\b(?:photo|image|picture|front|back)\s+(?:of|shows?)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  return text;
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
  const quotedPhrase = getQuotedQueryPhrase(normalized);
  const tokens = new Set(normalized.split(/\s+/).filter(Boolean));
  for (const existing of existingQueries) {
    const existingNormalized = existing.toLowerCase();
    const existingQuotedPhrase = getQuotedQueryPhrase(existingNormalized);
    if (quotedPhrase && existingQuotedPhrase && quotedPhrase !== existingQuotedPhrase) {
      continue;
    }
    const existingTokens = new Set(existingNormalized.split(/\s+/).filter(Boolean));
    const overlap = [...tokens].filter((token) => existingTokens.has(token)).length;
    const smaller = Math.min(tokens.size, existingTokens.size) || 1;
    if (normalized === existingNormalized || overlap / smaller > 0.9) {
      return true;
    }
  }
  return false;
}

function getQuotedQueryPhrase(query) {
  const match = String(query || "").match(/"([^"]{4,})"/);
  return match ? match[1].trim() : "";
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
  const category = error.liveSearchErrorCategory || error.category || classifyOpenAIErrorDetails({
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

function isSearchControlCompatibilityError(error) {
  const text = [
    error.openAIErrorType,
    error.openAIErrorCode,
    error.openAIErrorMessage,
    error.message
  ].map((value) => String(value || "").toLowerCase()).join(" ");

  return /filters|allowed_domains|search_context_size|unknown parameter|invalid.*tools|unsupported.*web_search|unsupported.*filters|unsupported.*search_context/.test(text);
}

function isWebSearchOptionCompatibilityError(error) {
  return isIncludeCompatibilityError(error) || isSearchControlCompatibilityError(error);
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

function collectWebSearchActionQueries(calls) {
  const queries = [];
  for (const call of calls || []) {
    const action = call.action || {};
    const candidates = [
      action.query,
      action.search_query,
      action.searchQuery,
      action.q
    ];
    for (const candidate of candidates) {
      const query = cleanText(candidate);
      if (query) {
        addUnique(queries, query);
      }
    }
  }
  return queries.slice(0, 20);
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

function collectWebSearchSourceRecords(data, queryRecord = {}) {
  const records = [];
  for (const call of collectWebSearchCalls(data)) {
    const actionSources = call.action && Array.isArray(call.action.sources) ? call.action.sources : [];
    for (const source of actionSources) {
      const record = normalizeProviderSourceRecord(source, queryRecord);
      if (record.url || record.title || record.domain) {
        records.push(record);
      }
    }
  }
  return dedupeProviderSourceRecords(records).slice(0, 50);
}

function normalizeProviderSourceRecord(source, queryRecord = {}) {
  const value = typeof source === "string" ? { title: source, url: extractFirstUrl(source) } : source || {};
  const url = normalizeUrl(cleanText(value.url || value.link || value.uri || ""));
  const title = cleanText(value.title || value.name || value.source || value.site || url || "");
  const snippet = cleanText(value.snippet || value.description || value.text || value.summary || "");
  const domain = hostnameFromUrl(url) || sourceLabel(title);
  return {
    title,
    url,
    domain,
    source: domain || title,
    snippet,
    displayedPriceText: extractDisplayedPrice([title, snippet].join(" ")),
    query: cleanText(queryRecord.query),
    searchPass: cleanText(queryRecord.searchPass),
    allowedDomains: normalizeStringArray(queryRecord.allowedDomains, 8)
  };
}

function sourceRecordFromCitation(citation, queryRecord = {}) {
  const url = normalizeUrl(citation.url);
  const title = cleanText(citation.title || url);
  const domain = hostnameFromUrl(url) || sourceLabelFromCitation(citation);
  return {
    title,
    url,
    domain,
    source: domain || title,
    snippet: "URL citation returned by provider.",
    displayedPriceText: "",
    query: cleanText(queryRecord.query),
    searchPass: cleanText(queryRecord.searchPass),
    allowedDomains: normalizeStringArray(queryRecord.allowedDomains, 8)
  };
}

function dedupeProviderSourceRecords(records = []) {
  const seen = new Set();
  const output = [];
  for (const record of records) {
    const key = `${record.url || ""}|${record.title || ""}|${record.query || ""}`.toLowerCase();
    if (!key.trim() || seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(record);
  }
  return output;
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
