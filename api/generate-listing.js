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
    "purchaseContextSummary",
    "barcodeSearchStatus",
    "localStoreContext",
    "retailPriceContext",
    "packageUnitPriceContext",
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
    purchaseContextSummary: { type: "string" },
    barcodeSearchStatus: { type: "string" },
    localStoreContext: { type: "string" },
    retailPriceContext: { type: "string" },
    packageUnitPriceContext: { type: "string" },
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
    "barcodeReadStatus",
    "barcodeFailureMessage",
    "packageQuantity",
    "packageSize",
    "unitCount",
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
    barcodeReadStatus: { type: "string" },
    barcodeFailureMessage: { type: "string" },
    packageQuantity: { type: "string" },
    packageSize: { type: "string" },
    unitCount: { type: "string" },
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
    "itemIdentificationEvidence",
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
    itemIdentificationEvidence: {
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
  "store_name",
  "location_zip",
  "location_mode",
  "location_state",
  "location_permission",
  "location_area",
  "owner_location_zip",
  "retailer_or_marketplace_name",
  "known_shipping_amount",
  "identity_confirmation",
  "item_condition",
  "item_completeness",
  "fulfillment_preference",
  "selling_speed",
  "item_name",
  "known_brand",
  "known_manufacturer",
  "known_model",
  "known_sku",
  "known_upc",
  "approximate_age_era",
  "buyer_notes",
  "asking_price_cents",
  "known_shipping_amount_cents"
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
    const buyerIntake = reportType === "marketValue" ? normalizeBuyerIntake(body.buyerIntake) : normalizeBuyerIntake(body.sellerIntake);
    const analysisId = cleanText(body.analysisId || createServerAnalysisId()).slice(0, 120);

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
    if (error.identityConfirmationRequired) {
      return res.status(409).json({
        action: "identity_confirmation_required",
        error: error.message,
        confirmation: sanitizeClientVisiblePayload(error.confirmation || {})
      });
    }

    return res.status(502).json({
      error: error.message || "OpenAI API request failed."
    });
  }
}

async function handleAskMarketEdge({ body, res }) {
  if (JSON.stringify(body || {}).length > 180000) {
    return res.status(413).json({ error: "Ask Katherine’s Eye context is too large. Start a new item and try again." });
  }

  const sessionId = cleanText(body.sessionId).slice(0, 120);
  const workflow = normalizeAskWorkflow(body.workflow);
  const buyerIntent = cleanText(body.buyerIntent).slice(0, 80);
  const question = cleanText(body.question).slice(0, 900);
  const currentItemContext = sanitizeAskContext(body.currentItemContext);
  const recentConversationContext = sanitizeAskConversation(body.recentConversationContext);

  if (!sessionId) {
    return res.status(400).json({ error: "Ask Katherine’s Eye needs a current item session." });
  }

  if (!workflow) {
    return res.status(400).json({ error: "Ask Katherine’s Eye needs a valid workflow." });
  }

  if (!question) {
    return res.status(400).json({ error: "Enter a question about the current item." });
  }

  if (!currentItemContext || !currentItemContext.currentReport) {
    return res.status(400).json({ error: "Ask Katherine’s Eye needs a completed item report first." });
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
    market_value: "Active workflow is Value Something I Own. Use owner valuation, identification confidence, condition, completeness, value evidence, likely selling venues, and next-verification logic. Do not ask for purchase price or use buying-decision labels.",
    listing: "Active workflow is Sell Something I Own. Help with seller pricing, listing copy, platform fit, pickup/shipping fit, selling speed, condition disclosure, and seller notes without inventing facts."
  }[workflow];
  const prompt = [
    "Ask Katherine’s Eye is not a generic chatbot. It is a context-aware item adviser discussing the current item and current report only.",
    "The current structured report is the authoritative starting point. Use the active report before generating new conclusions.",
    "Ground every answer in the active item session: uploaded-photo findings, user description, workflow, buyer intent, asking price, visual subject, visual confidence, exact product identity, exact product confidence, user-provided identity, photo evidence, search queries, sources searched, research results, comparable classifications, pricing estimates, recommendation, risk flags, listing content, prior follow-up exchanges, and user-provided scenario changes when available.",
    "Do not behave as though the user is asking about an unrelated new item unless the frontend has started a New Item session. Do not carry stale context from another workflow.",
    "Preserve verified facts, known uncertainty, condition disclosures, subject identity, exact-product uncertainty, source-backed facts versus inference, and prior scenario assumptions unless the user supplies new evidence that changes them.",
    "Avoid restarting the entire item analysis unless the user explicitly asks for a new analysis or a new search.",
    "No new live search is being performed inside this Ask response. Do not claim fresh marketplace search, sold-comps, source checks, new URLs, historical image search, or external database checks unless source-backed new results are explicitly supplied in the current context.",
    "Never invent marketplace evidence, search results, sold prices, sold dates, platform activity, exact image matches, exact product matches, maker, artist, date, edition, licensing, authenticity, defects, demand, historical references, prices, sources, or URLs.",
    "For questions about search activity, answer from stored searchDiagnostics fields such as searchProviderUsed, serperConfigured, serperCallsAttempted, serperCallsSucceeded, fallbackProviderUsed, providerRequestRecords, providerResponseSummaries, domainsActuallyReturned, organicResultCount, shoppingResultCount, providerSourceCount, retainedVisibleResultCount, rejectedCandidateCount, and droppedResultReasons.",
    "If asked what Google or Serper returned, use only stored Serper diagnostics and visible source records. Do not perform a new search, invent search activity, reveal provider keys, or claim a domain was searched unless a query record targeted it or a source-backed result returned it.",
    "Distinguish a targeted marketplace domain, a provider call, a returned URL domain, a raw Google provider result, a parsed candidate, and a retained comparable record.",
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
    "Question route behavior: unsupported_or_unrelated questions should explain that Ask Katherine’s Eye can only answer questions about the current item/report and should ask for a relevant item-specific question.",
    "Use the current report's Visual Recognition fields first for questions like what is this, why do you think it is a brand/organization/mascot/logo/character, what clues support that, or what should be photographed next.",
    "When identity is discussed, separate visual subject recognition, user-provided identity, exact product identity, maker, era, licensing, authenticity, exact comparable status, and pricing confidence.",
    "If broad subject identity is supported but exact product is unverified, preserve the supported subject instead of saying the whole identity is unverified.",
    "When exact evidence is unavailable, say what is known, what is likely, what came from the user, what the image supports, what searches support, what remains unverified, and what single next piece of evidence would help most.",
    "If asked whether an item is definitely a team/brand/mascot, explain subject confidence, visual consistency, user-provided identity, and what remains unverified.",
    "If asked whether it is authentic or licensed, do not infer authenticity from subject identity. Ask for the single most useful proof photo or marking.",
    "Use short recent conversation history to understand references like what about at $30, does that change your answer, what if the box is missing, make it shorter, use Facebook instead, search older ones, or why not. Avoid repetition and carry forward scenario changes only within this active item session.",
    workflowInstruction,
    `Controlled question route: ${answerType}.`,
    proposedPrice ? `Proposed scenario price parsed by the app: ${formatMoney(proposedPrice)}.` : "No scenario price was parsed by the app.",
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
    systemText: "You are Ask Katherine’s Eye, a context-aware item and report follow-up assistant. The current structured report is authoritative context. Answer only from the active item session and return structured JSON.",
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
    confidence: ensureConfidenceLayer(answer.confidence, "Low", "Ask Katherine’s Eye uses the current report context and does not perform a new live search unless source-backed new results are explicitly supplied."),
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
    return `Scenario price ${formatMoney(proposedPrice)} was parsed, but the current report does not contain enough numeric value evidence for a deterministic recalculation.`;
  }

  if (classified.state !== "supported") {
    const rangeText = classified.range || formatMoneyRange(fairRange[0], fairRange[1]);
    if (workflow === "personal_use" || isPersonalUseIntent(buyerIntent)) {
      return `At ${formatMoney(proposedPrice)}, compare the scenario only to the current preliminary reference range of ${rangeText}. The price may be favorable relative to similar active listings, but there is not enough reliable evidence for a confident Buy recommendation.`;
    }
    return `At ${formatMoney(proposedPrice)}, use reseller caution because the available range is preliminary reference evidence only (${rangeText}), not verified fair market value or confirmed sold-comps support.`;
  }

  const midpoint = (fairRange[0] + fairRange[1]) / 2;
  const ratio = proposedPrice / midpoint;
  if (workflow === "personal_use" || isPersonalUseIntent(buyerIntent)) {
    if (ratio <= consumerDecisionThresholds.goodMaxRatio) {
      return `At ${formatMoney(proposedPrice)}, the price is below the current fair-value midpoint of about ${formatMoney(midpoint)} and leans Good Value/Fair Price for personal use if condition assumptions still hold.`;
    }
    if (ratio <= consumerDecisionThresholds.fairMaxRatio) {
      return `At ${formatMoney(proposedPrice)}, the price is close to the current fair-value midpoint of about ${formatMoney(midpoint)} and leans Fair Price for personal use if condition assumptions still hold.`;
    }
    return `At ${formatMoney(proposedPrice)}, the price is above the current fair-value midpoint of about ${formatMoney(midpoint)} and should lean Negotiate/Pass unless condition, completeness, or fit improves.`;
  }

  const maxBuy = extractMoneyRange(String(report.maximumRecommendedBuyPrice || ""));
  if (maxBuy) {
    const ceiling = maxBuy[1];
    return proposedPrice <= ceiling
      ? `At ${formatMoney(proposedPrice)}, the scenario is at or below the current max-buy guidance of about ${formatMoney(ceiling)} before added resale costs.`
      : `At ${formatMoney(proposedPrice)}, the scenario is above the current max-buy guidance of about ${formatMoney(ceiling)} and likely weakens resale margin.`;
  }

  return `At ${formatMoney(proposedPrice)}, use reseller margin caution because the current report does not contain a clear numeric maximum buy price.`;
}

async function generateReportWithOpenAI({ apiKey, model, platform, notes, photos, reportType, buyerIntake }) {
  if (reportType === "marketValue") {
    return generateMarketValueReportWithLiveSearch({ apiKey, model, platform, notes, photos, buyerIntake });
  }

  return generateListingWithResearch({ apiKey, model, platform, notes, photos, buyerIntake });
}

async function generateListingWithResearch({ apiKey, model, platform, notes, photos, buyerIntake }) {
  const sellerIntake = normalizeBuyerIntake({
    ...(buyerIntake || {}),
    purchase_context: "owned_item",
    purchase_intent: "seller_listing",
    buyer_notes: notes
  });
  const research = await runResearchPipeline({
    apiKey,
    model,
    platform,
    notes,
    photos,
    buyerIntake: sellerIntake,
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
    systemText: "You are Katherine’s Eye, a careful assistant that turns item photos, seller notes, and source-backed research into marketplace listing drafts. Return only the requested structured JSON.",
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
  const extractedIdentity = await extractItemIdentity({ apiKey, model, platform, notes, photos, buyerIntake: intake, visualRecognition });
  const identity = finalizeIdentityForResearch(extractedIdentity, intake);

  if (identity.canonicalProductIdentity?.userConfirmationRequired && !identityConfirmationMatches(intake, identity.canonicalProductIdentity)) {
    throw createIdentityConfirmationRequiredError(identity.canonicalProductIdentity);
  }

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
    systemText: "You are Katherine’s Eye Visual Intelligence Engine. Recognize broad visual subjects from photos before product identification. Return only structured JSON.",
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
        "For ordinary current retail products, barcode/UPC digits are the highest-priority identity clue. Extract and preserve the exact digit sequence when readable.",
        "If barcode lines are visible but the digits cannot be read confidently, set barcodeReadStatus to unreadable and set barcodeFailureMessage to: The barcode could not be read clearly. Upload a closer photo of the barcode or enter the numbers manually.",
        "Capture pack size, package quantity, unit count, dimensions, closure type, variation, and quantity wording when visible or provided, such as 100-count envelopes, peel-and-seal, #10, legal size, multipack, bottle count, ounce count, or sheet count.",
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

async function executeLiveComparableSearch(args) {
  const serperApiKey = getSerperApiKey();
  if (serperApiKey) {
    const serperResult = await executeSerperComparableSearch({ ...args, serperApiKey });
    if (!serperResult.shouldUseOpenAIFallback) {
      return serperResult;
    }

    const fallbackResult = await executeOpenAIWebComparableSearch(args);
    return annotateOpenAIFallbackResult(fallbackResult, serperResult);
  }

  const fallbackResult = await executeOpenAIWebComparableSearch(args);
  return {
    ...fallbackResult,
    serperConfigured: false,
    primarySearchProvider: "OpenAI web_search",
    fallbackProviderUsed: false,
    primaryProviderFailureState: "serper_not_configured",
    searchDiagnostics: {
      ...(fallbackResult.searchDiagnostics || {}),
      serperConfigured: false,
      fallbackProviderUsed: false,
      primarySearchProvider: "OpenAI web_search",
      primaryProviderFailureState: "serper_not_configured"
    }
  };
}

async function executeOpenAIWebComparableSearch({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, buyerIntake, researchPurpose = "buyer_decision" }) {
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
      providerErrors,
      identity,
      buyerIntake,
      notes
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
    searchControlsFallbackReason,
    buyerIntake,
    notes
  });
}

function getSerperApiKey() {
  return cleanText(process.env.SERPER_API_KEY || "");
}

const retailSerperBudgetAllocation = Object.freeze({
  maxProviderCalls: 18,
  exactIdentity: 4,
  exactProductReduced: 3,
  compatibleAlternatives: 4,
  retailerSpecific: 5,
  shoppingGeneral: 2
});

async function executeSerperComparableSearch({ serperApiKey, platform, notes, identity, sourceRoute, searchQueries, buyerIntake, researchPurpose = "buyer_decision" }) {
  const searchStartedAt = new Date().toISOString();
  const requestStartedAtMs = Date.now();
  const queriesPrioritized = buildSerperSearchPlan({ searchQueries, sourceRoute, identity, buyerIntake, notes });
  const providerRequestRecords = queriesPrioritized.map((queryRecord) => createSerperRequestRecord(queryRecord));
  const providerResponseSummaries = [];
  const providerErrors = [];
  const rawProviderRecords = [];

  providerRequestRecords.forEach((requestRecord, index) => {
    if (!requestRecord.attempted) {
      providerResponseSummaries.push(createSerperPreflightRejectedResponseSummary(queriesPrioritized[index], requestRecord));
    }
  });

  const executableRequests = providerRequestRecords
    .map((requestRecord, index) => ({ requestRecord, queryRecord: queriesPrioritized[index] }))
    .filter(({ requestRecord }) => requestRecord.attempted);

  await Promise.all(executableRequests.map(async ({ requestRecord, queryRecord }) => {
    try {
      const response = await requestSerperSearch({
        apiKey: serperApiKey,
        query: queryRecord.query,
        prevalidated: queryRecord.validationPassed !== false,
        timeoutMs: 7000,
        maxRetries: 1
      });
      const parsed = parseSerperResponse(response.json, queryRecord);
      rawProviderRecords.push(...parsed.records);
      requestRecord.succeeded = true;
      requestRecord.statusCode = response.statusCode;
      requestRecord.elapsedMilliseconds = response.elapsedMs;
      requestRecord.organicResultCount = parsed.organicResultCount;
      requestRecord.shoppingResultCount = parsed.shoppingResultCount;
      requestRecord.knowledgeGraphResultCount = parsed.knowledgeGraphResultCount;
      requestRecord.providerSourceCount = parsed.records.length;
      requestRecord.rawResultCount = parsed.records.length;
      requestRecord.parsedResultCount = parsed.records.length;
      requestRecord.normalizedResultCount = parsed.records.length;
      requestRecord.domainsReturned = summarizeSourceLabels(parsed.records.map((record) => record.domain));
      requestRecord.sourceURLsReturned = parsed.records.map((record) => record.url).filter(Boolean).slice(0, 12);
      requestRecord.failureStage = parsed.records.length ? "none" : "serper_zero_results";
      providerResponseSummaries.push(createSerperResponseSummary(queryRecord, requestRecord, parsed));
    } catch (error) {
      const diagnostic = classifySerperError(error);
      requestRecord.succeeded = false;
      requestRecord.errorCode = diagnostic.code || diagnostic.category;
      requestRecord.failureStage = diagnostic.category;
      providerErrors.push({
        ...diagnostic,
        query: queryRecord.query,
        priority: queryRecord.priority
      });
      providerResponseSummaries.push({
        query: queryRecord.query,
        priority: queryRecord.priority,
        searchPass: queryRecord.searchPass,
        retailStage: queryRecord.retailStage || "",
        retailStageLabel: queryRecord.retailStageLabel || "",
        retailBudgetBucket: queryRecord.retailBudgetBucket || "",
        provider: "Serper Google Search",
        providerKey: "serper_google",
        marketplaceDomainsRequested: queryRecord.marketplaceDomains || [],
        rawCandidate: queryRecord.rawCandidate || queryRecord.query,
        candidateOrigin: queryRecord.candidateOrigin || queryRecord.searchPass,
        normalizedCandidate: queryRecord.normalizedCandidate || queryRecord.query,
        finalQuery: queryRecord.finalQuery || queryRecord.query,
        validationPassed: queryRecord.validationPassed !== false,
        validationFailureReason: queryRecord.validationFailureReason || "",
        statusCode: diagnostic.statusCode || null,
        providerSourceCount: 0,
        organicResultCount: 0,
        shoppingResultCount: 0,
        domainsReturned: [],
        sourceURLsReturned: [],
        errorCode: diagnostic.code || diagnostic.category,
        errorMessage: diagnostic.message
      });
    }
  }));

  const successfulRecords = providerRequestRecords.filter((record) => record.succeeded);
  const elapsedMs = Date.now() - requestStartedAtMs;
  if (!successfulRecords.length) {
    return buildSerperUnavailableLiveSearchResult({
      error: providerErrors[0] || createSerperRequestError({ category: "serper_provider_error", message: "Serper Google Search failed before source results could be retrieved." }),
      sourceRoute,
      searchQueries,
      queriesPrioritized,
      providerRequestRecords,
      providerResponseSummaries,
      providerErrors,
      searchStartedAt,
      elapsedMs,
      identity,
      buyerIntake,
      notes
    });
  }

  const context = buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const normalizedRecords = normalizeSerperCandidateRecords(rawProviderRecords, identity, context);
  const dedupedRecords = dedupeSerperCandidateRecords(normalizedRecords);
  applySerperRecordAccountingToRequests(providerRequestRecords, providerResponseSummaries, dedupedRecords);
  return normalizeSerperLiveSearchResult({
    records: dedupedRecords,
    rawProviderRecords,
    searchStartedAt,
    sourceRoute,
    searchQueries,
    queriesPrioritized,
    providerRequestRecords,
    providerResponseSummaries,
    providerErrors,
    elapsedMs,
    researchPurpose,
    identity,
    buyerIntake,
    notes
  });
}

function createSerperRequestRecord(queryRecord) {
  const validationPassed = queryRecord.validationPassed !== false;
  return {
    query: queryRecord.query,
    priority: queryRecord.priority,
    searchPass: queryRecord.searchPass,
    retailStage: queryRecord.retailStage || "",
    retailStageLabel: queryRecord.retailStageLabel || "",
    retailBudgetBucket: queryRecord.retailBudgetBucket || "",
    sourceRoute: queryRecord.sourceRoute,
    marketplaceDomainsRequested: queryRecord.marketplaceDomains || [],
    allowedDomainsRequested: queryRecord.marketplaceDomains || [],
    rawCandidate: cleanText(queryRecord.rawCandidate || queryRecord.query),
    candidateOrigin: cleanText(queryRecord.candidateOrigin || queryRecord.searchPass),
    normalizedCandidate: cleanText(queryRecord.normalizedCandidate || queryRecord.query),
    finalQuery: cleanText(queryRecord.finalQuery || queryRecord.query),
    validationPassed,
    validationFailureReason: cleanText(queryRecord.validationFailureReason),
    provider: "Serper Google Search",
    providerKey: "serper_google",
    attempted: validationPassed,
    succeeded: false,
    providerSourceCount: 0,
    organicResultCount: 0,
    shoppingResultCount: 0,
    knowledgeGraphResultCount: 0,
    rawResultCount: 0,
    parsedResultCount: 0,
    normalizedResultCount: 0,
    retainedResultCount: 0,
    domainsReturned: [],
    sourceURLsReturned: [],
    errorCode: validationPassed ? "" : "invalid_query_preflight",
    failureStage: validationPassed ? "serper_provider_error" : "invalid_query_preflight"
  };
}

function createSerperPreflightRejectedResponseSummary(queryRecord = {}, requestRecord = {}) {
  return {
    query: requestRecord.query || queryRecord.query,
    priority: requestRecord.priority || queryRecord.priority,
    searchPass: requestRecord.searchPass || queryRecord.searchPass,
    retailStage: requestRecord.retailStage || queryRecord.retailStage || "",
    retailStageLabel: requestRecord.retailStageLabel || queryRecord.retailStageLabel || "",
    retailBudgetBucket: requestRecord.retailBudgetBucket || queryRecord.retailBudgetBucket || "",
    provider: "Serper Google Search",
    providerKey: "serper_google",
    marketplaceDomainsRequested: requestRecord.marketplaceDomainsRequested || queryRecord.marketplaceDomains || [],
    allowedDomainsRequested: requestRecord.allowedDomainsRequested || queryRecord.marketplaceDomains || [],
    rawCandidate: requestRecord.rawCandidate || queryRecord.rawCandidate || "",
    candidateOrigin: requestRecord.candidateOrigin || queryRecord.candidateOrigin || "",
    normalizedCandidate: requestRecord.normalizedCandidate || queryRecord.normalizedCandidate || "",
    finalQuery: requestRecord.finalQuery || queryRecord.finalQuery || queryRecord.query || "",
    validationPassed: false,
    validationFailureReason: requestRecord.validationFailureReason || queryRecord.validationFailureReason || "invalid_query_preflight",
    statusCode: null,
    providerSourceCount: 0,
    organicResultCount: 0,
    shoppingResultCount: 0,
    knowledgeGraphResultCount: 0,
    domainsReturned: [],
    sourceURLsReturned: [],
    errorCode: "invalid_query_preflight",
    errorMessage: "Query rejected locally before Serper execution.",
    failureStage: "invalid_query_preflight"
  };
}

async function requestSerperSearch({ apiKey, query, prevalidated = false, timeoutMs = 7000, maxRetries = 1 }) {
  const safeQuery = cleanSerperQuery(query);
  const validation = prevalidated
    ? validateSerperTransportQuery(safeQuery)
    : validateSerperQueryCandidate(safeQuery);
  if (!validation.passed) {
    throw createSerperRequestError({ category: "invalid_query_preflight", code: validation.reason, message: "Serper query was rejected before provider execution." });
  }

  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const startedAt = Date.now();
    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey
        },
        body: JSON.stringify({
          q: safeQuery,
          gl: "us",
          hl: "en",
          num: 10
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const category = classifySerperStatus(response.status, data);
        throw createSerperRequestError({
          category,
          statusCode: response.status,
          code: cleanText(data?.error || data?.code || ""),
          message: summarizeSerperErrorMessage(data, response.status)
        });
      }
      return { json: data, statusCode: response.status, elapsedMs: Date.now() - startedAt };
    } catch (error) {
      clearTimeout(timeout);
      lastError = error.name === "AbortError"
        ? createSerperRequestError({ category: "serper_timeout", code: "timeout", message: "Serper request timed out." })
        : error;
      const diagnostic = classifySerperError(lastError);
      if (attempt >= maxRetries || ["serper_authentication_failure", "serper_rate_limited"].includes(diagnostic.category)) {
        throw lastError;
      }
    }
  }
  throw lastError || createSerperRequestError({ category: "serper_provider_error", message: "Serper request failed." });
}

function parseSerperResponse(data = {}, queryRecord = {}) {
  const records = [];
  const organic = Array.isArray(data.organic) ? data.organic : [];
  const shopping = Array.isArray(data.shopping) ? data.shopping : [];
  const knowledgeGraph = data.knowledgeGraph && typeof data.knowledgeGraph === "object" ? data.knowledgeGraph : null;

  organic.forEach((item, index) => {
    const url = canonicalizeComparableUrl(item.link || item.url);
    if (!url) return;
    records.push(createSerperProviderRecord({
      provider: "serper_google",
      queryRecord,
      title: item.title,
      url,
      snippet: item.snippet,
      displayedPriceText: extractDisplayedPrice([item.title, item.snippet].join(" ")),
      sourceType: "organic",
      position: item.position || index + 1,
      date: item.date
    }));
  });

  shopping.forEach((item, index) => {
    const url = canonicalizeComparableUrl(item.link || item.url);
    if (!url) return;
    records.push(createSerperProviderRecord({
      provider: "serper_google",
      queryRecord,
      title: item.title,
      url,
      snippet: [item.source, item.delivery, item.rating ? `Rating ${item.rating}` : ""].filter(Boolean).join(" | "),
      displayedPriceText: item.price || extractDisplayedPrice([item.title, item.source].join(" ")),
      sourceType: "shopping",
      position: item.position || index + 1,
      delivery: item.delivery,
      imageUrl: item.imageUrl,
      rating: item.rating,
      ratingCount: item.ratingCount
    }));
  });

  if (knowledgeGraph) {
    const kgUrl = canonicalizeComparableUrl(knowledgeGraph.website || knowledgeGraph.link || knowledgeGraph.url);
    if (kgUrl) {
      records.push(createSerperProviderRecord({
        provider: "serper_google",
        queryRecord,
        title: knowledgeGraph.title,
        url: kgUrl,
        snippet: knowledgeGraph.description,
        displayedPriceText: "",
        sourceType: "knowledge_graph_reference",
        position: 0
      }));
    }
  }

  return {
    records,
    organicResultCount: organic.length,
    shoppingResultCount: shopping.length,
    knowledgeGraphResultCount: knowledgeGraph ? 1 : 0,
    relatedSearchCount: Array.isArray(data.relatedSearches) ? data.relatedSearches.length : 0
  };
}

function createSerperProviderRecord({ provider, queryRecord, title, url, snippet, displayedPriceText, sourceType, position, date = "", delivery = "", imageUrl = "", rating = "", ratingCount = "" }) {
  const canonicalUrl = canonicalizeComparableUrl(url);
  return {
    provider,
    query: cleanText(queryRecord.query),
    searchPass: cleanText(queryRecord.searchPass),
    marketplaceDomainsRequested: normalizeStringArray(queryRecord.marketplaceDomains, 8),
    title: cleanText(title || canonicalUrl),
    url: canonicalUrl,
    canonicalUrl,
    domain: hostnameFromUrl(canonicalUrl),
    snippet: cleanText(snippet),
    displayedPriceText: normalizeMoneyLabelText(cleanText(displayedPriceText)),
    parsedPrice: parseDisplayedPrice(displayedPriceText),
    currency: displayedPriceText ? "$" : "",
    sourceType: cleanText(sourceType),
    position: Number(position || 0),
    date: cleanText(date),
    delivery: cleanText(delivery),
    imageUrl: cleanText(imageUrl),
    rating: cleanText(rating),
    ratingCount: cleanText(ratingCount)
  };
}

function normalizeSerperCandidateRecords(records = [], identity = {}, context = {}) {
  return records
    .filter((record) => record.url && /^https?:\/\//i.test(record.url))
    .map((record) => {
      const itemTypeCompatibility = evaluateComparableItemTypeCompatibility(record, identity, context);
      const identityMatchStrength = classifySerperIdentityMatch(record, identity, context, itemTypeCompatibility);
      const priceEvidenceType = classifySerperPriceEvidence(record);
      const valuationBearing = isValuationBearingComparable(identityMatchStrength, priceEvidenceType, itemTypeCompatibility);
      const preliminaryRangeIncluded = isPreliminaryAskingPriceRangeEvidence(identityMatchStrength, priceEvidenceType, itemTypeCompatibility, record);
      const verifiedMarketInfluence = isVerifiedMarketRangeEvidence(identityMatchStrength, priceEvidenceType, itemTypeCompatibility, record);
      const rejectionReason = buildSerperRejectionReason(record, identityMatchStrength, context, itemTypeCompatibility);
      return {
        ...record,
        itemTypeCompatible: itemTypeCompatibility.itemTypeCompatible,
        submittedItemType: itemTypeCompatibility.submittedItemType,
        candidateItemType: itemTypeCompatibility.candidateItemType,
        itemTypeCompatibilityStatus: itemTypeCompatibility.status,
        itemTypeCompatibilityExplanation: itemTypeCompatibility.explanation,
        submittedPackQuantity: itemTypeCompatibility.submittedPackQuantity || "",
        candidatePackQuantity: itemTypeCompatibility.candidatePackQuantity || "",
        identityMatchStrength,
        priceEvidenceType,
        priceTypeLabel: normalizePriceTypeLabel(priceEvidenceType, record),
        retained: !/Rejected/i.test(identityMatchStrength),
        rejectionReason,
        sourceBacked: "URL-cited",
        matchExplanation: buildSerperMatchExplanation(record, identityMatchStrength, priceEvidenceType, itemTypeCompatibility),
        evidenceRole: buildSerperEvidenceRole(identityMatchStrength, priceEvidenceType, itemTypeCompatibility),
        itemIdentityDifferences: /Rejected|Weak|Partial|Reference/i.test(identityMatchStrength) || !itemTypeCompatibility.itemTypeCompatible ? rejectionReason : "",
        influencedVerifiedMarketRange: verifiedMarketInfluence
          ? "Yes - verified sold evidence from a compatible exact or strong match."
          : buildVerifiedMarketRangeNonInfluenceReason(priceEvidenceType, itemTypeCompatibility),
        includedInPreliminaryAskingPriceRange: preliminaryRangeIncluded
          ? "Yes - compatible visible price evidence included in the preliminary asking-price range."
          : buildPreliminaryRangeNonInclusionReason(priceEvidenceType, itemTypeCompatibility),
        influencedReferenceRange: valuationBearing && record.displayedPriceText
          ? (verifiedMarketInfluence
              ? "Influenced verified market range: Yes."
              : "Influenced verified market range: No. Included in preliminary asking-price range: Yes.")
          : buildNonValuationInfluenceReason(priceEvidenceType, itemTypeCompatibility)
      };
    });
}

function dedupeSerperCandidateRecords(records = []) {
  const byUrl = new Map();
  for (const record of records) {
    const key = record.canonicalUrl || record.url;
    const existing = byUrl.get(key);
    if (!existing) {
      byUrl.set(key, {
        ...record,
        queriesFound: [record.query].filter(Boolean),
        searchPassesFound: [record.searchPass].filter(Boolean)
      });
      continue;
    }
    const merged = preferRicherSerperRecord(existing, record);
    merged.queriesFound = mergeStringArrays(existing.queriesFound, [record.query], 8);
    merged.searchPassesFound = mergeStringArrays(existing.searchPassesFound, [record.searchPass], 6);
    byUrl.set(key, merged);
  }
  return [...byUrl.values()];
}

function applySerperRecordAccountingToRequests(providerRequestRecords = [], providerResponseSummaries = [], records = []) {
  for (const requestRecord of providerRequestRecords) {
    const query = cleanText(requestRecord.query);
    const matchingRecords = records.filter((record) => {
      const queriesFound = normalizeStringArray(record.queriesFound, 12);
      return record.query === query || queriesFound.includes(query);
    });
    const retained = matchingRecords.filter((record) => /Exact|Strong Similar|Partial|Reference Only/i.test(record.identityMatchStrength));
    const rejected = matchingRecords.filter((record) => /Rejected/i.test(record.identityMatchStrength));
    requestRecord.normalizedResultCount = matchingRecords.length || requestRecord.normalizedResultCount || 0;
    requestRecord.retainedResultCount = retained.length;
    requestRecord.rejectedResultCount = rejected.length;
    requestRecord.failureStage = classifySerperAcquisitionStage({
      providerCallsSucceeded: requestRecord.succeeded ? 1 : 0,
      providerSourceCount: requestRecord.providerSourceCount,
      normalizedCandidateCount: requestRecord.normalizedResultCount,
      retainedVisibleResultCount: requestRecord.retainedResultCount,
      rejectedCandidateCount: requestRecord.rejectedResultCount,
      providerErrors: requestRecord.errorCode ? [{ category: requestRecord.errorCode }] : []
    });
  }

  for (const summary of providerResponseSummaries) {
    const matchingRequest = providerRequestRecords.find((record) => record.query === summary.query);
    if (!matchingRequest) continue;
    summary.normalizedResultCount = matchingRequest.normalizedResultCount;
    summary.retainedResultCount = matchingRequest.retainedResultCount;
    summary.rejectedResultCount = matchingRequest.rejectedResultCount;
    summary.failureStage = matchingRequest.failureStage;
  }
}

function normalizeSerperLiveSearchResult({ records, rawProviderRecords, searchStartedAt, sourceRoute, searchQueries, queriesPrioritized, providerRequestRecords, providerResponseSummaries, providerErrors, elapsedMs, identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "" }) {
  const buckets = bucketSerperRecords(records);
  const strongVisible = buckets.strongComparables;
  const comparableItemsFound = recordsToLegacyComparableStrings(strongVisible);
  const providerSourceCount = rawProviderRecords.length;
  const retainedVisibleResultCount = [...buckets.strongComparables, ...buckets.partialComparables, ...buckets.itemIdentificationEvidence, ...buckets.referenceResults].length;
  const rejectedCandidateCount = records.filter((record) => !record.retained || /Rejected/i.test(record.identityMatchStrength)).length;
  const domainsActuallyReturned = summarizeSourceLabels(records.map((record) => record.domain));
  const liveSearchStatus = comparableItemsFound.length
    ? "Live Search Completed - Source-Backed Comps Found"
    : "Live Search Completed - No Reliable Comps Found";
  const acquisitionFailureStage = classifySerperAcquisitionStage({
    providerCallsSucceeded: providerRequestRecords.filter((record) => record.succeeded).length,
    providerSourceCount,
    normalizedCandidateCount: records.length,
    retainedVisibleResultCount,
    rejectedCandidateCount,
    providerErrors
  });
  const diagnostics = buildSerperSearchDiagnostics({
    sourceRoute,
    searchQueries,
    queriesPrioritized,
    providerRequestRecords,
    providerResponseSummaries,
    providerErrors,
    records,
    providerSourceCount,
    retainedVisibleResultCount,
    rejectedCandidateCount,
    acquisitionFailureStage,
    elapsedMs,
    liveSearchStatus,
    identity,
    buyerIntake,
    notes
  });

  return {
    liveSearchStatus,
    comparableItemsFound,
    resultsFound: [...buckets.strongComparables, ...buckets.partialComparables, ...buckets.itemIdentificationEvidence, ...buckets.referenceResults, ...buckets.weakMatches, ...buckets.rejectedMatches].slice(0, 24),
    strongComparables: buckets.strongComparables,
    partialComparables: buckets.partialComparables,
    itemIdentificationEvidence: buckets.itemIdentificationEvidence,
    referenceResults: buckets.referenceResults,
    weakMatches: buckets.weakMatches,
    rejectedMatches: buckets.rejectedMatches,
    visibleResearchResultCount: retainedVisibleResultCount,
    noReliableMatchesReason: comparableItemsFound.length ? "" : "Serper Google Search completed, but no compatible source-backed exact or strong similar priced matches passed match-quality checks.",
    searchEvidenceSummary: comparableItemsFound.length ? "Serper Google Search returned source-backed exact or strong similar priced comparable evidence." : "Serper Google Search returned no compatible source-backed prices; retained exact no-price records are identity evidence only.",
    sourceRoute,
    searchQueries,
    queriesPrioritized,
    queriesActuallySent: providerRequestRecords.filter((record) => record.attempted).map((record) => record.query),
    providerRequestRecords,
    providerResponseSummaries,
    providerSourceRecords: records.slice(0, 50),
    sourcesTargeted: buildSourcesTargeted(sourceRoute),
    sourceCategoriesTargeted: buildSourcesTargeted(sourceRoute),
    allowedDomainsRequested: collectMarketplaceDomainsRequested(providerRequestRecords),
    searchProviderUsed: "Serper Google Search",
    primarySearchProvider: "serper_google",
    serperConfigured: true,
    fallbackProviderUsed: false,
    primaryProviderFailureState: acquisitionFailureStage,
    domainsActuallyReturned,
    sourceURLsReturned: records.map((record) => record.url).filter(Boolean).slice(0, 50),
    providerSourceCount,
    organicResultCount: providerRequestRecords.reduce((sum, record) => sum + Number(record.organicResultCount || 0), 0),
    shoppingResultCount: providerRequestRecords.reduce((sum, record) => sum + Number(record.shoppingResultCount || 0), 0),
    parsedCandidateCount: rawProviderRecords.length,
    normalizedCandidateCount: records.length,
    deduplicatedCandidateCount: records.length,
    retainedVisibleResultCount,
    rejectedCandidateCount,
    sourcesSearched: ["Serper Google Search"],
    sourcesReturned: domainsActuallyReturned,
    searchStartedAt,
    searchCompletedAt: new Date().toISOString(),
    webSearchExecuted: true,
    citations: records.map((record) => ({ url: record.url, title: record.title })),
    diagnostics: {
      elapsedMilliseconds: elapsedMs,
      webSearchCallAppeared: false,
      sourceBackedCompCount: comparableItemsFound.length,
      visibleResearchResultCount: retainedVisibleResultCount,
      finalLiveSearchStatus: liveSearchStatus,
      serperConfigured: true,
      fallbackProviderUsed: false
    },
    searchDiagnostics: diagnostics,
    shouldUseOpenAIFallback: false
  };
}

function buildSerperUnavailableLiveSearchResult({ error, sourceRoute, searchQueries, queriesPrioritized, providerRequestRecords, providerResponseSummaries, providerErrors, searchStartedAt, elapsedMs, identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "" }) {
  const diagnostic = classifySerperError(error);
  const diagnostics = buildSerperSearchDiagnostics({
    sourceRoute,
    searchQueries,
    queriesPrioritized,
    providerRequestRecords,
    providerResponseSummaries,
    providerErrors: providerErrors.length ? providerErrors : [diagnostic],
    records: [],
    providerSourceCount: 0,
    retainedVisibleResultCount: 0,
    rejectedCandidateCount: 0,
    acquisitionFailureStage: diagnostic.category,
    elapsedMs,
    liveSearchStatus: "Live Search Unavailable - Serper Provider Error",
    identity,
    buyerIntake,
    notes
  });

  return {
    liveSearchStatus: "Live Search Unavailable - Serper Provider Error",
    comparableItemsFound: [],
    resultsFound: [],
    strongComparables: [],
    partialComparables: [],
    itemIdentificationEvidence: [],
    referenceResults: [],
    weakMatches: [],
    rejectedMatches: [],
    visibleResearchResultCount: 0,
    noReliableMatchesReason: "Serper Google Search was unavailable before source-backed comparable results could be retrieved.",
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
    allowedDomainsRequested: collectMarketplaceDomainsRequested(providerRequestRecords),
    searchProviderUsed: "Serper Google Search",
    primarySearchProvider: "serper_google",
    serperConfigured: true,
    fallbackProviderUsed: false,
    primaryProviderFailureState: diagnostic.category,
    domainsActuallyReturned: [],
    sourceURLsReturned: [],
    providerSourceCount: 0,
    organicResultCount: 0,
    shoppingResultCount: 0,
    parsedCandidateCount: 0,
    normalizedCandidateCount: 0,
    deduplicatedCandidateCount: 0,
    retainedVisibleResultCount: 0,
    rejectedCandidateCount: 0,
    sourcesSearched: [],
    sourcesReturned: [],
    searchStartedAt,
    searchCompletedAt: new Date().toISOString(),
    webSearchExecuted: false,
    citations: [],
    diagnostics: {
      elapsedMilliseconds: elapsedMs,
      errorCategory: diagnostic.category,
      finalLiveSearchStatus: "Live Search Unavailable - Serper Provider Error",
      serperConfigured: true,
      fallbackProviderUsed: false
    },
    searchDiagnostics: diagnostics,
    shouldUseOpenAIFallback: true
  };
}

function annotateOpenAIFallbackResult(openaiResult, serperResult) {
  const serperDiagnostics = serperResult.searchDiagnostics || {};
  const openaiDiagnostics = openaiResult.searchDiagnostics || {};
  return {
    ...openaiResult,
    searchEvidenceSummary: ensurePrefix(openaiResult.searchEvidenceSummary, "Primary Google-result provider unavailable - Serper Google Search could not complete, so OpenAI web_search fallback was used. "),
    serperConfigured: true,
    primarySearchProvider: "serper_google",
    fallbackProviderUsed: true,
    primaryProviderFailureState: serperResult.primaryProviderFailureState || serperDiagnostics.acquisitionFailureStage || "serper_provider_error",
    searchDiagnostics: {
      ...openaiDiagnostics,
      serperConfigured: true,
      fallbackProviderUsed: true,
      primarySearchProvider: "serper_google",
      primaryProviderFailureState: serperResult.primaryProviderFailureState || serperDiagnostics.acquisitionFailureStage || "serper_provider_error",
      fallbackProvider: "OpenAI web_search",
      serperProviderRequestRecords: serperDiagnostics.providerRequestRecords || [],
      serperProviderResponseSummaries: serperDiagnostics.providerResponseSummaries || []
    }
  };
}

function buildSerperSearchPlan({ searchQueries = [], sourceRoute = [], identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "" } = {}) {
  const context = buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const sourceCategories = buildSourcesTargeted(sourceRoute);
  const marketplaceDomains = selectMarketplaceAllowedDomains(context, sourceRoute, buyerIntake).slice(0, 5);
  if (isCurrentRetailOnlyMode(context.retailEvidenceMode) && (context.retailStoreContext || context.onlineRetailerContext)) {
    return buildRetailSerperSearchPlan({
      searchQueries,
      sourceRoute,
      identity,
      buyerIntake,
      notes,
      context,
      sourceCategories
    });
  }
  const domainRecords = buildDomainDirectedSearchPlan({ searchQueries, sourceRoute, identity, buyerIntake, notes });
  const buildCandidate = ({ query, rawCandidate = query, candidateOrigin = "", searchPass, marketplaceDomains: requestedDomains = [] }) => ({
    query: cleanSerperQuery(finalizeSearchQueryCandidate(query, context, requestedDomains.length ? 18 : 12)),
    rawCandidate: cleanText(rawCandidate || query),
    candidateOrigin,
    searchPass,
    marketplaceDomains: requestedDomains
  });
  const highPriorityCandidates = [
    ...domainRecords
      .filter((record) => record.searchPass === "open_web_exact")
      .map((record) => buildCandidate({
        query: record.query,
        rawCandidate: record.rawCandidate || record.query,
        candidateOrigin: record.candidateOrigin || "domain_directed_exact",
        searchPass: "open_web_exact",
        marketplaceDomains: record.allowedDomains || record.marketplaceDomains || []
      })),
    ...buildHighPriorityExactQueries(context).map((query) => buildCandidate({
      query,
      rawCandidate: query,
      candidateOrigin: "high_priority_exact",
      searchPass: "open_web_exact"
    })),
    ...normalizeStringArray(searchQueries, 24).map((query) => buildCandidate({
      query,
      rawCandidate: query,
      candidateOrigin: "model_search_query",
      searchPass: "open_web_exact"
    }))
  ].filter((record) => record.query || record.rawCandidate);
  const fallbackCandidates = [
    ...domainRecords
      .filter((record) => record.searchPass !== "open_web_exact")
      .map((record) => buildCandidate({
        query: record.query,
        rawCandidate: record.rawCandidate || record.query,
        candidateOrigin: record.candidateOrigin || "domain_directed_fallback",
        searchPass: record.searchPass || "broader_fallback",
        marketplaceDomains: record.allowedDomains || record.marketplaceDomains || []
      })),
    ...buildFallbackSearchQueries(context).map((query) => buildCandidate({
      query,
      rawCandidate: query,
      candidateOrigin: "broader_fallback",
      searchPass: "broader_fallback"
    }))
  ].filter((record) => record.query || record.rawCandidate);
  const recoveryCandidates = buildSerperRecoverySearchQueries(context, marketplaceDomains)
    .map((record) => buildCandidate(record))
    .filter((record) => record.query || record.rawCandidate);
  const validRecords = [];
  const rejectedRecords = [];
  const signatureIndexes = new Map();
  const addRecord = ({ query, rawCandidate = query, candidateOrigin = "", searchPass, marketplaceDomains: requestedDomains = [], maxValidRecords = 12 }) => {
    const normalizedCandidate = cleanSerperQuery(query);
    const finalQuery = normalizedCandidate;
    const validation = validateSerperQueryCandidate(finalQuery, context, { searchPass, marketplaceDomains: requestedDomains, rawCandidate });
    const baseRecord = {
      query: finalQuery || cleanText(rawCandidate),
      rawCandidate: cleanText(rawCandidate || query),
      candidateOrigin: cleanText(candidateOrigin || searchPass),
      normalizedCandidate,
      finalQuery,
      searchPass,
      sourceRoute: sourceCategories,
      marketplaceDomains: requestedDomains,
      allowedDomains: requestedDomains,
      validationPassed: validation.passed,
      validationFailureReason: validation.passed ? "" : validation.reason
    };
    if (!validation.passed) {
      rejectedRecords.push({
        ...baseRecord,
        priority: validRecords.length + rejectedRecords.length + 1
      });
      return;
    }
    if (validRecords.length >= maxValidRecords) {
      return;
    }
    const domainKey = requestedDomains.map((domain) => domain.toLowerCase()).join("|");
    const siteSignature = (finalQuery.match(/\bsite:[a-z0-9.-]+/i) || [""])[0].toLowerCase();
    const signature = `${querySemanticSignature(finalQuery)}|${domainKey}|${siteSignature}`;
    if (!signature.trim()) return;
    const candidateRecord = {
      ...baseRecord,
      query: finalQuery,
      priority: validRecords.length + 1
    };
    if (signatureIndexes.has(signature)) {
      const existingIndex = signatureIndexes.get(signature);
      if (shouldPreferSerperQueryRecord(candidateRecord, validRecords[existingIndex], context)) {
        validRecords[existingIndex] = {
          ...candidateRecord,
          priority: existingIndex + 1
        };
      }
      return;
    }
    signatureIndexes.set(signature, validRecords.length);
    validRecords.push(candidateRecord);
  };

  const initialHighPriorityCandidates = highPriorityCandidates
    .filter((record) => record.candidateOrigin !== "model_search_query")
    .slice(0, 24);
  const modelSearchCandidatesToValidate = highPriorityCandidates
    .filter((record) => record.candidateOrigin === "model_search_query");

  initialHighPriorityCandidates.forEach((record) => {
    addRecord({ ...record, maxValidRecords: 4 });
  });

  if (marketplaceDomains.length && validRecords.length < 6) {
    const seedRecord = validRecords.find((record) => isMarketplaceUsefulQuery(record.query, context))
      || highPriorityCandidates.find((record) => record.validationPassed !== false && isMarketplaceUsefulQuery(record.query, context))
      || highPriorityCandidates[0]
      || fallbackCandidates[0]
      || null;
    const seedQuery = seedRecord?.query
      || compactWords([context.brand, context.productTitle, context.itemType]);
    const siteQuery = buildSerperMarketplaceQuery(seedQuery, marketplaceDomains);
    addRecord({ query: siteQuery, rawCandidate: seedRecord?.rawCandidate || seedQuery, candidateOrigin: "marketplace_domain_composition", searchPass: "marketplace_site_google", marketplaceDomains });
  }

  modelSearchCandidatesToValidate.forEach((record) => {
    addRecord({ ...record, maxValidRecords: 10 });
  });

  for (const record of recoveryCandidates.filter((item) => item.searchPass === "marketplace_domain_recovery").slice(0, 1)) {
    if (validRecords.length >= 12) break;
    addRecord({ ...record, maxValidRecords: 12 });
  }

  for (const record of recoveryCandidates.filter((item) => item.searchPass === "price_oriented_recovery").slice(0, 1)) {
    if (validRecords.length >= 12) break;
    addRecord({ ...record, maxValidRecords: 12 });
  }

  for (const record of recoveryCandidates.filter((item) => item.searchPass === "shopping_general_recovery")) {
    if (validRecords.length >= 12) break;
    addRecord({ ...record, maxValidRecords: 12 });
  }

  for (const record of recoveryCandidates.filter((item) => item.searchPass !== "marketplace_domain_recovery" && item.searchPass !== "price_oriented_recovery" && item.searchPass !== "shopping_general_recovery")) {
    if (validRecords.length >= 12) break;
    addRecord({ ...record, maxValidRecords: 12 });
  }

  for (const record of fallbackCandidates) {
    if (validRecords.length >= 12) break;
    addRecord({ ...record, maxValidRecords: 12 });
  }

  if (!validRecords.length) {
    addRecord({
      query: compactWords([context.productTitle, context.brand, context.itemType, context.itemCode || context.model || context.upc]),
      candidateOrigin: "last_resort_identity_fallback",
      searchPass: "broader_fallback"
    });
  }

  return [
    ...validRecords.slice(0, 12),
    ...rejectedRecords.slice(0, 24)
  ].map((record, index) => ({
    ...record,
    priority: index + 1
  }));
}

function buildRetailSerperSearchPlan({ searchQueries = [], sourceRoute = [], identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "", context = null, sourceCategories = [] } = {}) {
  const retailContext = context || buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const categories = sourceCategories.length ? sourceCategories : buildSourcesTargeted(sourceRoute);
  const stageQueries = buildRetailStagedSearchQueries(retailContext, searchQueries);
  const stageBudgets = {
    stage_1_exact_identity: retailSerperBudgetAllocation.exactIdentity,
    stage_2_exact_product_reduced: retailSerperBudgetAllocation.exactProductReduced,
    stage_3_compatible_alternatives: retailSerperBudgetAllocation.compatibleAlternatives,
    stage_4_retailer_specific: retailSerperBudgetAllocation.retailerSpecific,
    stage_5_shopping_general: retailSerperBudgetAllocation.shoppingGeneral
  };
  const validRecords = [];
  const rejectedRecords = [];
  const stageCounts = {};
  const signatureIndexes = new Map();

  const addRecord = (record = {}) => {
    const stage = cleanText(record.retailStage || record.searchPass || "retail_recovery");
    const stageBudget = Number(stageBudgets[stage] || retailSerperBudgetAllocation.maxProviderCalls);
    stageCounts[stage] = stageCounts[stage] || 0;
    if (stageCounts[stage] >= stageBudget || validRecords.length >= retailSerperBudgetAllocation.maxProviderCalls) {
      return;
    }

    const requestedDomains = normalizeStringArray(record.marketplaceDomains, 8);
    const normalizedCandidate = cleanSerperQuery(finalizeSearchQueryCandidate(record.query, retailContext, requestedDomains.length ? 18 : 14));
    const finalQuery = normalizedCandidate;
    const validation = validateSerperQueryCandidate(finalQuery, retailContext, {
      searchPass: record.searchPass,
      marketplaceDomains: requestedDomains,
      rawCandidate: record.rawCandidate || record.query,
      retailStage: stage
    });
    const baseRecord = {
      query: finalQuery || cleanText(record.rawCandidate || record.query),
      rawCandidate: cleanText(record.rawCandidate || record.query),
      candidateOrigin: cleanText(record.candidateOrigin || stage),
      normalizedCandidate,
      finalQuery,
      searchPass: record.searchPass,
      retailStage: stage,
      retailStageLabel: cleanText(record.retailStageLabel),
      retailBudgetBucket: cleanText(record.retailBudgetBucket),
      sourceRoute: categories,
      marketplaceDomains: requestedDomains,
      allowedDomains: requestedDomains,
      validationPassed: validation.passed,
      validationFailureReason: validation.passed ? "" : validation.reason
    };

    if (!validation.passed) {
      rejectedRecords.push({
        ...baseRecord,
        priority: validRecords.length + rejectedRecords.length + 1
      });
      return;
    }

    const siteSignature = (finalQuery.match(/\bsite:[a-z0-9.-]+/i) || [""])[0].toLowerCase();
    const signature = `${querySemanticSignature(finalQuery)}|${siteSignature}|${requestedDomains.map((domain) => domain.toLowerCase()).join("|")}`;
    if (!signature.trim()) {
      return;
    }
    const candidateRecord = {
      ...baseRecord,
      query: finalQuery,
      priority: validRecords.length + 1
    };
    if (signatureIndexes.has(signature)) {
      const existingIndex = signatureIndexes.get(signature);
      if (shouldPreferSerperQueryRecord(candidateRecord, validRecords[existingIndex], retailContext)) {
        validRecords[existingIndex] = {
          ...candidateRecord,
          priority: existingIndex + 1
        };
      }
      return;
    }
    signatureIndexes.set(signature, validRecords.length);
    validRecords.push(candidateRecord);
    stageCounts[stage] += 1;
  };

  for (const record of stageQueries) {
    addRecord(record);
  }

  if (!validRecords.length) {
    addRecord({
      query: compactWords([retailContext.productTitle, retailContext.brand, retailContext.itemType, retailContext.itemCode || retailContext.model || retailContext.upc, "current retail price"]),
      rawCandidate: compactWords([retailContext.productTitle, retailContext.brand, retailContext.itemType, "current retail price"]),
      candidateOrigin: "retail_last_resort_identity_fallback",
      searchPass: "stage_5_shopping_general",
      retailStage: "stage_5_shopping_general",
      retailStageLabel: "Stage 5 - Shopping/general retail recovery",
      retailBudgetBucket: "shoppingGeneral"
    });
  }

  return [
    ...validRecords.slice(0, retailSerperBudgetAllocation.maxProviderCalls),
    ...rejectedRecords.slice(0, 24)
  ].map((record, index) => ({
    ...record,
    priority: index + 1
  }));
}

function buildRetailStagedSearchQueries(context = {}, modelSearchQueries = []) {
  const records = [];
  const barcode = context.barcodeDigits || normalizeBarcodeDigits(context.upc);
  const storeName = cleanText(context.storeName || context.retailerOrMarketplaceName);
  const brand = firstKnown(context.brand, context.visualBrand, context.manufacturer);
  const identifier = firstKnown(context.itemCode, context.model);
  const productFamily = deriveRetailProductFamily(context);
  const closure = deriveRetailClosurePhrase(context);
  const productTitle = cleanSearchQuery(firstKnown(context.productTitle, context.exactProductIdentity, context.subjectIdentity, productFamily), 9);
  const exactProduct = cleanSearchQuery(compactWords([brand, productTitle || productFamily, context.packageQuantity, context.packageSize]), 12);
  const reducedProduct = stripRetailUnavailableIdentifiers(firstKnown(productTitle, exactProduct, productFamily), context);
  const submittedQuantity = getRetailSubmittedPackageQuantity(context);
  const compatibleCounts = getRetailCompatiblePackageCounts(submittedQuantity);
  const retailers = buildRetailerSpecificSearchTargets(context);

  const add = ({ query, rawCandidate = query, searchPass, retailStage, retailStageLabel, retailBudgetBucket, candidateOrigin, marketplaceDomains = [] }) => {
    if (!query) return;
    records.push({
      query,
      rawCandidate,
      candidateOrigin,
      searchPass,
      retailStage,
      retailStageLabel,
      retailBudgetBucket,
      marketplaceDomains
    });
  };

  const stage1 = "stage_1_exact_identity";
  const stage2 = "stage_2_exact_product_reduced";
  const stage3 = "stage_3_compatible_alternatives";
  const stage4 = "stage_4_retailer_specific";
  const stage5 = "stage_5_shopping_general";

  if (barcode) {
    add({ query: barcode, searchPass: stage1, retailStage: stage1, retailStageLabel: "Stage 1 - Exact identity", retailBudgetBucket: "exactIdentity", candidateOrigin: "retail_exact_upc" });
    add({ query: compactWords([storeName, barcode]), searchPass: stage1, retailStage: stage1, retailStageLabel: "Stage 1 - Exact identity", retailBudgetBucket: "exactIdentity", candidateOrigin: "retail_store_upc" });
    if (context.retailerDomain) {
      add({
        query: buildSerperSingleMarketplaceQuery(barcode, context.retailerDomain),
        rawCandidate: barcode,
        searchPass: stage1,
        retailStage: stage1,
        retailStageLabel: "Stage 1 - Exact identity",
        retailBudgetBucket: "exactIdentity",
        candidateOrigin: "retail_site_upc",
        marketplaceDomains: [context.retailerDomain]
      });
    }
  }
  if (brand && identifier) {
    add({ query: compactWords([brand, identifier]), searchPass: stage1, retailStage: stage1, retailStageLabel: "Stage 1 - Exact identity", retailBudgetBucket: "exactIdentity", candidateOrigin: "retail_brand_identifier" });
  }
  if (exactProduct) {
    add({ query: exactProduct, searchPass: stage1, retailStage: stage1, retailStageLabel: "Stage 1 - Exact identity", retailBudgetBucket: "exactIdentity", candidateOrigin: "retail_exact_product_package" });
  }

  for (const query of mergeStringArrays(
    reducedProduct,
    compactWords([brand, productFamily]),
    compactWords([brand, closure, productFamily]),
    compactWords([productFamily, "item", identifier]),
    modelSearchQueries,
    8
  )) {
    add({ query, searchPass: stage2, retailStage: stage2, retailStageLabel: "Stage 2 - Exact product without unavailable identifiers", retailBudgetBucket: "exactProductReduced", candidateOrigin: "retail_reduced_exact_product" });
  }

  for (const count of compatibleCounts) {
    add({
      query: compactWords([productFamily, closure, `${count} count`]),
      searchPass: stage3,
      retailStage: stage3,
      retailStageLabel: "Stage 3 - Strong compatible alternatives",
      retailBudgetBucket: "compatibleAlternatives",
      candidateOrigin: "retail_compatible_pack_count"
    });
  }
  add({ query: compactWords(["business", productFamily, "self seal"]), searchPass: stage3, retailStage: stage3, retailStageLabel: "Stage 3 - Strong compatible alternatives", retailBudgetBucket: "compatibleAlternatives", candidateOrigin: "retail_compatible_business_self_seal" });
  add({ query: compactWords(["comparable", productFamily, "current retail price"]), searchPass: stage3, retailStage: stage3, retailStageLabel: "Stage 3 - Strong compatible alternatives", retailBudgetBucket: "compatibleAlternatives", candidateOrigin: "retail_compatible_current_price" });

  for (const retailer of retailers) {
    add({
      query: compactWords([retailer, productFamily, closure, compatibleCounts[0] ? `${compatibleCounts[0]} count` : "", "current price"]),
      searchPass: stage4,
      retailStage: stage4,
      retailStageLabel: "Stage 4 - Retailer-specific alternatives",
      retailBudgetBucket: "retailerSpecific",
      candidateOrigin: "retail_separate_retailer_query"
    });
  }

  add({ query: compactWords([productFamily, closure, "shopping"]), searchPass: stage5, retailStage: stage5, retailStageLabel: "Stage 5 - Shopping/general retail recovery", retailBudgetBucket: "shoppingGeneral", candidateOrigin: "retail_shopping_recovery" });
  add({ query: compactWords([productFamily, closure, "package price"]), searchPass: stage5, retailStage: stage5, retailStageLabel: "Stage 5 - Shopping/general retail recovery", retailBudgetBucket: "shoppingGeneral", candidateOrigin: "retail_general_package_price" });
  add({ query: compactWords([productFamily, "current retail price"]), searchPass: stage5, retailStage: stage5, retailStageLabel: "Stage 5 - Shopping/general retail recovery", retailBudgetBucket: "shoppingGeneral", candidateOrigin: "retail_general_current_price" });

  return records;
}

function stripRetailUnavailableIdentifiers(value = "", context = {}) {
  let text = cleanText(value);
  for (const identifier of [context.barcodeDigits, context.upc, context.itemCode, context.model].map(cleanText).filter(Boolean)) {
    text = text.replace(new RegExp(`\\b${escapeRegExp(identifier)}\\b`, "gi"), "");
  }
  return cleanSearchQuery(text.replace(/\b(?:upc|barcode|sku|item\s*(?:number|#)?)\b/gi, " "), 10);
}

function deriveRetailProductFamily(context = {}) {
  const text = normalizeComparableText([
    context.productTitle,
    context.exactProductIdentity,
    context.subjectIdentity,
    context.itemType,
    context.categoryPhrase,
    context.notesText
  ].join(" "));
  if (/\bsecurity\b/.test(text) && /\benvelopes?\b/.test(text)) return "security envelopes";
  if (/\benvelopes?\b/.test(text)) return "envelopes";
  if (/\bstationery\b/.test(text)) return "stationery";
  return cleanSearchQuery(firstKnown(context.itemType, context.categoryPhrase, context.productTitle, context.subjectIdentity), 6);
}

function deriveRetailClosurePhrase(context = {}) {
  const text = normalizeComparableText([
    context.productTitle,
    context.exactProductIdentity,
    context.subjectIdentity,
    context.itemType,
    context.categoryPhrase,
    context.notesText
  ].join(" "));
  if (/\bstrip\s*(?:and|&)?\s*seal\b/.test(text)) return "strip and seal";
  if (/\bpeel\s*(?:and|&)?\s*seal\b/.test(text)) return "peel and seal";
  if (/\bself\s*seal\b/.test(text)) return "self seal";
  if (/\bgummed\b/.test(text)) return "gummed";
  return /\benvelopes?\b/.test(text) ? "self seal" : "";
}

function getRetailSubmittedPackageQuantity(context = {}) {
  return extractPackQuantityNumber([
    context.packageQuantity,
    context.packageSize,
    context.productTitle,
    context.exactProductIdentity,
    context.subjectIdentity,
    context.notesText
  ].join(" "));
}

function getRetailCompatiblePackageCounts(quantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return [];
  }
  const down = Math.max(1, Math.floor(quantity / 10) * 10);
  const up = Math.ceil(quantity / 10) * 10;
  const nearby = [down, quantity, up].filter((item) => item > 1);
  if (quantity <= 60) {
    nearby.push(100, 80);
  } else {
    nearby.push(quantity * 2);
  }
  return [...new Set(nearby)].slice(0, 5);
}

function buildRetailerSpecificSearchTargets(context = {}) {
  const text = normalizeComparableText([
    context.productTitle,
    context.exactProductIdentity,
    context.subjectIdentity,
    context.itemType,
    context.categoryPhrase,
    context.notesText
  ].join(" "));
  const storeName = cleanText(context.storeName || context.retailerOrMarketplaceName);
  const officeRetailers = ["Walmart", "Target", "Staples", "Office Depot", "Amazon", "Kroger"];
  const generalRetailers = ["Walmart", "Target", "Amazon", "Kroger"];
  return mergeStringArrays(
    storeName,
    /\benvelopes?|stationery|office\b/.test(text) ? officeRetailers : generalRetailers,
    8
  );
}

function buildSerperRecoverySearchQueries(context = {}, marketplaceDomains = []) {
  const records = [];
  const organization = firstKnown(context.visualOrganization, context.schoolName, context.teamName, context.subjectIdentity);
  const brand = firstKnown(context.brand, context.visualBrand, context.manufacturer);
  const itemType = /^(?:not\s+verified|unknown|none|n\/a)?$/i.test(cleanText(context.itemType))
    ? mostDistinctiveCategoryWord(context.productTitle || context.subjectIdentity || context.categoryPhrase)
    : context.itemType;
  const exactPhrase = selectExactVisiblePhrase(context);
  const eventPhrase = selectEventSearchPhrase(context);
  const productTitle = cleanSearchQuery(context.exactProductIdentity || context.productTitle || context.subjectIdentity, 8);
  const identifier = firstKnown(context.upc, context.model, context.itemCode);
  const exactBases = mergeStringArrays(
    identifier ? [compactWords([identifier, brand || productTitle, itemType])] : [],
    exactPhrase ? [compactWords([quoteSearchPhrase(exactPhrase), brand, organization, itemType])] : [],
    eventPhrase ? [compactWords([quoteSearchPhrase(eventPhrase), organization, brand, itemType])] : [],
    productTitle ? [compactWords([productTitle, brand, itemType])] : [],
    context.labelText ? [compactWords([context.labelText, identifier, itemType])] : [],
    8
  ).filter(Boolean);
  const reducedBases = mergeStringArrays(
    compactWords([brand, organization, itemType]),
    compactWords([organization, eventPhrase, itemType]),
    compactWords([brand, eventPhrase, itemType]),
    compactWords([context.namedPeople?.[0], organization, itemType]),
    compactWords([mostDistinctiveProductWord(productTitle), organization, brand, itemType]),
    8
  ).filter(Boolean);
  const priceTerms = context.retailStoreContext || context.onlineRetailerContext
    ? ["current price", "shopping", "in stock", "pickup", "delivery"]
    : ["price", "sold", "for sale", "auction", "value"];

  const add = ({ query, searchPass, candidateOrigin, marketplaceDomains: domains = [] }) => {
    if (!query) return;
    const queryWithItemNoun = !context.retailStoreContext
      && /recovery/i.test(searchPass || "")
      && itemType
      && !hasQueryItemNoun(query, context)
      ? cleanSearchQuery([query, itemType].filter(Boolean).join(" "), 14)
      : query;
    records.push({
      query: queryWithItemNoun,
      rawCandidate: query,
      candidateOrigin,
      searchPass,
      marketplaceDomains: domains
    });
  };

  for (const query of exactBases.slice(0, 4)) {
    add({ query, candidateOrigin: "recovery_exact_identity", searchPass: "priced_recovery_exact" });
  }

  for (const query of reducedBases.slice(0, 4)) {
    add({ query, candidateOrigin: "recovery_reduced_identity", searchPass: "priced_recovery_reduced" });
  }

  for (const base of mergeStringArrays(exactBases, reducedBases, 4)) {
    for (const term of priceTerms.slice(0, 3)) {
      add({
        query: compactWords([base, term]),
        candidateOrigin: "recovery_price_oriented",
        searchPass: "price_oriented_recovery"
      });
    }
  }

  for (const domain of marketplaceDomains.slice(0, 5)) {
    const base = mergeStringArrays(exactBases, reducedBases, 2)[0] || productTitle || compactWords([brand, organization, itemType]);
    add({
      query: buildSerperSingleMarketplaceQuery(base, domain),
      candidateOrigin: "recovery_separate_marketplace_domain",
      searchPass: "marketplace_domain_recovery",
      marketplaceDomains: [domain]
    });
  }

  for (const base of mergeStringArrays(exactBases, reducedBases, 3)) {
    add({
      query: compactWords([base, "shopping"]),
      candidateOrigin: "recovery_shopping_general",
      searchPass: "shopping_general_recovery"
    });
  }

  return records;
}

function buildSerperSingleMarketplaceQuery(seedQuery, domain) {
  const baseQuery = cleanSerperQuery(seedQuery);
  const cleanDomain = cleanText(domain).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0];
  if (!baseQuery || !cleanDomain) {
    return baseQuery;
  }
  return cleanSerperQuery(`${baseQuery} site:${cleanDomain}`, 260);
}

function buildSerperMarketplaceQuery(seedQuery, marketplaceDomains = []) {
  const baseQuery = cleanSerperQuery(seedQuery);
  let sites = marketplaceDomains
    .map((domain) => cleanText(domain).replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0])
    .filter(Boolean)
    .slice(0, 5)
    .map((domain) => `site:${domain}`);
  if (!baseQuery || !sites.length) {
    return baseQuery;
  }
  let candidate = `${baseQuery} (${sites.join(" OR ")})`;
  while (candidate.length > 260 && sites.length > 1) {
    sites = sites.slice(0, -1);
    candidate = `${baseQuery} (${sites.join(" OR ")})`;
  }
  if (candidate.length <= 260) {
    return cleanSerperQuery(candidate, 260);
  }
  const sitePart = `(${sites.join(" OR ")})`;
  const shortenedBase = shortenQueryCoreWholeTerms(baseQuery, Math.max(120, 260 - sitePart.length - 1));
  return cleanSerperQuery(`${shortenedBase} ${sitePart}`, 260);
}

function cleanSerperQuery(value, maxLength = 240) {
  let text = sanitizeSearchQueryText(normalizeTokenString(value))
    .replace(/\b(unknown|n\/a|none|not visible)\b/gi, "")
    .replace(/\b([A-Za-z0-9']+\s+[A-Za-z0-9']+)(\s+\1\b)+/gi, "$1")
    .replace(/\b(\w+)(\s+\1\b)+/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || isInternalPromptFragment(text)) {
    return "";
  }
  if (text.length <= maxLength) {
    return text;
  }
  return shortenSerperQueryWithoutFragments(text, maxLength);
}

function shortenSerperQueryWithoutFragments(text, maxLength) {
  const { coreQuery, sitePart } = splitSerperSiteRestriction(text);
  const siteBudget = sitePart ? sitePart.length + 1 : 0;
  const coreBudget = Math.max(80, maxLength - siteBudget);
  const shortenedCore = shortenQueryCoreWholeTerms(coreQuery, coreBudget);
  const candidate = `${shortenedCore}${sitePart ? ` ${sitePart}` : ""}`.trim();
  if (!candidate || candidate.length <= maxLength) {
    return candidate;
  }
  const reducedSitePart = reduceSiteRestriction(sitePart);
  const reducedCandidate = `${coreQuery}${reducedSitePart ? ` ${reducedSitePart}` : ""}`.trim();
  if (!reducedCandidate || reducedCandidate.length <= maxLength) {
    return reducedCandidate;
  }
  return shortenQueryCoreWholeTerms(coreQuery, maxLength);
}

function splitSerperSiteRestriction(text) {
  const value = cleanText(text);
  const match = value.match(/\s*(\((?:site:[^)]+)\))\s*$/i);
  if (!match) {
    return { coreQuery: value, sitePart: "" };
  }
  return {
    coreQuery: value.slice(0, match.index).trim(),
    sitePart: match[1].trim()
  };
}

function normalizeSearchQuotes(value) {
  return String(value || "")
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'");
}

function parseListLikeSearchPhrases(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseListLikeSearchPhrases(item));
  }
  const source = normalizeSearchQuotes(value);
  if (!cleanText(source)) {
    return [];
  }

  const likelyList = /[\[\]{}]|\s*,\s*['"]|['"]\s*,|;\s*['"]|[|]/.test(source);
  if (!likelyList) {
    const phrase = sanitizeSearchPhrase(source);
    return phrase ? [phrase] : [];
  }

  const withoutBrackets = source
    .replace(/^[\s[\]{}()]+|[\s[\]{}()]+$/g, "")
    .replace(/\\"/g, "\"")
    .replace(/"{2,}/g, "\"")
    .trim();
  const pieces = withoutBrackets
    .split(/\s*(?:,|;|\||\n|\r)+\s*/g)
    .map(sanitizeSearchPhrase)
    .filter(Boolean);
  return [...new Set(pieces.map((piece) => piece.toLowerCase()))]
    .map((lower) => pieces.find((piece) => piece.toLowerCase() === lower))
    .filter(Boolean);
}

function sanitizeSearchPhrase(value) {
  let text = normalizeSearchQuotes(value)
    .replace(/\\"/g, "\"")
    .replace(/[{}[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  text = text
    .replace(/^[\s,"']+|[\s,"']+$/g, "")
    .replace(/\s*,\s*$/g, "")
    .replace(/^\s*,\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || /^["']*$/.test(text)) {
    return "";
  }
  return text;
}

function sanitizeSearchQueryText(value) {
  let text = normalizeSearchQuotes(value)
    .replace(/\\"/g, "\"")
    .replace(/[{}[\]]+/g, " ")
    .replace(/\s*,\s*,+/g, ", ")
    .replace(/(^|\s)""+(?=\S)/g, "$1\"")
    .replace(/(?<=\S)""+(\s|$)/g, "\"$1")
    .replace(/""/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if ((text.match(/"/g) || []).length % 2 !== 0) {
    text = text.replace(/"/g, "");
  }

  return text
    .replace(/^[\s,]+|[\s,]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function querySyntaxFailureReason(query, rawCandidate = "") {
  const values = [rawCandidate, query].map((value) => normalizeSearchQuotes(value)).filter((value) => cleanText(value));
  for (const value of values) {
    const text = cleanText(value);
    if (!text) continue;
    if (/[\[\]{}]/.test(text) || /\s*,\s*['"]|['"]\s*,/.test(text)) {
      return "serialized_list_artifact";
    }
    if (/""/.test(text) || /^"{2,}|"{2,}$/.test(text)) {
      return "repeated_or_empty_quotation_marks";
    }
    if ((text.match(/"/g) || []).length % 2 !== 0) {
      return "unbalanced_quotation_marks";
    }
    if (/^['",\s]+$/.test(text)) {
      return "empty_or_malformed_exact_query";
    }
  }
  return "";
}

function reduceSiteRestriction(sitePart) {
  const sites = String(sitePart || "").match(/site:[A-Za-z0-9.-]+/gi) || [];
  return sites.length ? `(${sites[0]})` : "";
}

function shortenQueryCoreWholeTerms(coreQuery, maxLength) {
  const core = cleanText(coreQuery);
  if (!core || core.length <= maxLength) {
    return core;
  }
  const terms = splitQueryTermsPreservingQuotes(core);
  const kept = [];
  for (const term of terms) {
    const candidate = [...kept, term].join(" ");
    if (candidate.length > maxLength) {
      continue;
    }
    kept.push(term);
  }
  return kept.length ? kept.join(" ") : core;
}

function validateSerperQueryCandidate(query, context = {}, options = {}) {
  const finalQuery = cleanSerperQuery(query);
  const { coreQuery } = splitSerperSiteRestriction(finalQuery);
  const core = cleanText(coreQuery);
  const terms = extractMeaningfulQueryTerms(core);
  const hasLongIdentifier = hasLongIdentifierTerm(core, context);
  const hasItemNoun = hasQueryItemNoun(core, context);
  const hasAnchor = hasMeaningfulQueryIdentityAnchor(core, context);
  const hasRetailAlternativeAnchor = hasCurrentRetailAlternativeQueryAnchor(core, context, options);
  const syntaxFailure = querySyntaxFailureReason(core, options.rawCandidate);

  if (!core || isInternalPromptFragment(core)) {
    return { passed: false, reason: "empty_or_internal_query" };
  }
  if (syntaxFailure) {
    return { passed: false, reason: syntaxFailure };
  }
  if (isCurrentRetailOnlyMode(context.retailEvidenceMode) && isRetailForbiddenSecondaryEvidenceText(core)) {
    return { passed: false, reason: "retail_forbidden_secondary_market_terms" };
  }
  if (isBrandOnlyQuery(core, context)) {
    return { passed: false, reason: "brand_only_query" };
  }
  if (isPersonOnlyQuery(core, context)) {
    return { passed: false, reason: "person_only_query" };
  }
  if (isYearOnlyQuery(core)) {
    return { passed: false, reason: "year_only_query" };
  }
  if (isIncompleteQueryFragment(core)) {
    return { passed: false, reason: "incomplete_word_fragment" };
  }
  if (isYearPlusShortFragment(core)) {
    return { passed: false, reason: "year_plus_short_fragment" };
  }
  const unsupportedTerms = findUnsupportedQueryTerms(core, context);
  if (unsupportedTerms.length) {
    return { passed: false, reason: `unsupported_identity_term:${unsupportedTerms.slice(0, 3).join(",")}` };
  }
  if (!hasLongIdentifier && terms.length < 2) {
    return { passed: false, reason: "fewer_than_two_meaningful_identity_terms" };
  }
  if (isGenericCategoryOnlyQuery(core, context)) {
    return { passed: false, reason: "generic_category_only" };
  }
  if (!hasItemNoun && !hasLongIdentifier) {
    return { passed: false, reason: "missing_concrete_item_noun" };
  }
  if (!hasAnchor && !hasLongIdentifier && !hasRetailAlternativeAnchor) {
    return { passed: false, reason: "missing_identity_anchor" };
  }
  if (usesPersonNameWithoutItemAnchor(core, context)) {
    return { passed: false, reason: "person_name_without_item_anchor" };
  }
  if (options.searchPass === "broader_fallback" && !hasLongIdentifier && (!hasItemNoun || !hasAnchor)) {
    return { passed: false, reason: !hasItemNoun ? "fallback_missing_item_noun" : "fallback_missing_identity_anchor" };
  }
  return { passed: true, reason: "" };
}

function hasCurrentRetailAlternativeQueryAnchor(query, context = {}, options = {}) {
  if (!isCurrentRetailOnlyMode(context.retailEvidenceMode)) {
    return false;
  }
  const text = normalizeComparableText(query);
  const stageText = cleanText(`${options.searchPass || ""} ${options.retailStage || ""}`);
  const recoveryStage = /stage_3_compatible_alternatives|stage_4_retailer_specific|stage_5_shopping_general|compatible|retailer|shopping|recovery/i.test(stageText);
  if (!recoveryStage) {
    return false;
  }
  const hasRetailProductNoun = hasQueryItemNoun(text, context);
  const hasCurrentRetailSignal = /\b(?:current|retail|shopping|price|package|pack|count|ct|store|walmart|target|staples|office depot|amazon|kroger|pickup|delivery)\b/i.test(text);
  const hasCompatibilitySignal = /\b(?:security|business|strip|seal|self|peel|gummed|envelope|envelopes|stationery)\b/i.test(text)
    || /\b\d{1,5}\s*(?:count|ct|pack|pk|envelopes?)\b/i.test(text);
  return hasRetailProductNoun && hasCurrentRetailSignal && hasCompatibilitySignal;
}

function validateSerperTransportQuery(query) {
  const finalQuery = cleanSerperQuery(query);
  const { coreQuery } = splitSerperSiteRestriction(finalQuery);
  const core = cleanText(coreQuery);
  const syntaxFailure = querySyntaxFailureReason(core, query);
  if (!core || isInternalPromptFragment(core)) {
    return { passed: false, reason: "empty_or_internal_query" };
  }
  if (syntaxFailure) {
    return { passed: false, reason: syntaxFailure };
  }
  if (isIncompleteQueryFragment(core)) {
    return { passed: false, reason: "incomplete_word_fragment" };
  }
  if (isYearPlusShortFragment(core)) {
    return { passed: false, reason: "year_plus_short_fragment" };
  }
  return { passed: true, reason: "" };
}

function extractMeaningfulQueryTerms(query) {
  const { coreQuery } = splitSerperSiteRestriction(query);
  return cleanText(coreQuery)
    .replace(/"([^"]+)"/g, " $1 ")
    .replace(/site:[A-Za-z0-9.-]+/gi, " ")
    .toLowerCase()
    .match(/[a-z0-9][a-z0-9'-]*/g)?.filter((term) => {
      if (/^(?:18|19|20)\d{2}$/.test(term) || /^\d{3,14}$/.test(term)) return true;
      if (term.length < 3) return false;
      return !isQueryStopWord(term) && !isGenericSearchOnlyTerm(term);
    }) || [];
}

function isQueryStopWord(term) {
  return /^(?:the|and|or|for|with|from|this|that|them|they|his|her|its|our|your|about|into|onto|near|price|value|listing|search|used|old|new|item|photo|image)$/.test(term);
}

function isGenericSearchOnlyTerm(term) {
  return /^(?:vintage|collectible|collectibles|decor|decoration|memorabilia|resale|marketplace|official|licensed|limited|edition|collector|commemorative|unknown|generic)$/.test(term);
}

function isIncompleteQueryFragment(query) {
  const core = cleanText(query).replace(/^"|"$/g, "");
  const terms = extractMeaningfulQueryTerms(core);
  return terms.length <= 1 && /^[A-Za-z]{2,3}$/.test(core) && !/^(sku|upc)$/i.test(core);
}

function isYearPlusShortFragment(query) {
  const core = cleanText(query).replace(/["]/g, "");
  const parts = core.split(/\s+/).filter(Boolean);
  return parts.length <= 2
    && parts.some((part) => /^(?:18|19|20)\d{2}$/.test(part))
    && parts.some((part) => /^[A-Za-z]{1,3}$/.test(part));
}

function isGenericCategoryOnlyQuery(query, context = {}) {
  const terms = extractMeaningfulQueryTerms(query);
  if (terms.length > 0 && terms.every((term) => isGenericSearchOnlyTerm(term))) {
    return true;
  }
  const normalized = normalizeQueryIdentityValue(query);
  const categoryValues = [
    context.categoryPhrase,
    context.visualCategory,
    context.itemType,
    context.category
  ].map(normalizeQueryIdentityValue).filter(Boolean);
  return Boolean(normalized && categoryValues.some((value) => value === normalized));
}

function hasLongIdentifierTerm(query, context = {}) {
  const text = cleanText(query).toLowerCase();
  const knownIdentifiers = [
    context.upc,
    context.model,
    context.itemCode
  ].map(cleanText).filter(Boolean);
  if (knownIdentifiers.some((identifier) => text.includes(identifier.toLowerCase()))) {
    return true;
  }
  return /\b\d{8,14}\b/.test(text) || /\b[A-Z0-9]{4,}[-_][A-Z0-9-]{2,}\b/i.test(query);
}

function hasQueryItemNoun(query, context = {}) {
  const text = cleanText(query).toLowerCase();
  const itemTokens = itemTypeTokens(context.itemType).filter((token) => token.length >= 3);
  if (itemTokens.some((token) => text.includes(token))) {
    return true;
  }
  return /\b(?:tray|plate|plaque|sign|poster|print|sticker|decal|figurine|figure|statue|box|jar|canister|set|dress|shirt|jacket|shoe|laptop|computer|phone|tablet|chair|table|sofa|dresser|cabinet|lamp|vase|book|toy|tool|watch|coin|bag|purse|envelope|envelopes|stationery|paper|pack|count)\b/i.test(text);
}

function hasQueryIdentityAnchor(query, context = {}) {
  const text = cleanText(query).toLowerCase();
  if (/"[^"]{4,}"/.test(query)) return true;
  if (/\b(?:18|19|20)\d{2}\b/.test(text)) return true;
  if (hasLongIdentifierTerm(query, context)) return true;
  const anchors = [
    context.brand,
    context.visualBrand,
    context.manufacturer,
    context.visualOrganization,
    context.schoolName,
    context.teamName,
    context.subjectIdentity,
    context.productTitle,
    context.exactProductIdentity,
    ...normalizeStringArray(context.distinctivePhrases, 8),
    ...normalizeStringArray(context.eventPhrases, 6)
  ].map(cleanText).filter((value) => value.length >= 4);
  return anchors.some((anchor) => containsNormalizedPhrase(text, anchor));
}

function hasMeaningfulQueryIdentityAnchor(query, context = {}) {
  const text = cleanText(query);
  if (hasLongIdentifierTerm(text, context)) return true;
  const quoted = [...text.matchAll(/"([^"]{4,})"/g)].map((match) => match[1]);
  if (quoted.some((phrase) => !isGenericCategoryOnlyQuery(phrase, context) && !hasQueryItemNoun(phrase, context))) {
    return true;
  }
  if (/\b(?:18|19|20)\d{2}\b/.test(text) && extractMeaningfulQueryTerms(text).length >= 2) {
    return true;
  }
  const anchors = [
    context.brand,
    context.visualBrand,
    context.manufacturer,
    context.visualOrganization,
    context.schoolName,
    context.teamName,
    context.subjectIdentity,
    context.productTitle,
    context.exactProductIdentity,
    ...normalizeStringArray(context.namedPeople, 6),
    ...normalizeStringArray(context.distinctivePhrases, 8),
    ...normalizeStringArray(context.eventPhrases, 6)
  ].map(cleanText).filter((value) => value.length >= 4);
  return anchors.some((anchor) => {
    if (!containsNormalizedPhrase(normalizeComparableText(text), anchor)) {
      return false;
    }
    const normalizedAnchor = normalizeQueryIdentityValue(anchor);
    if (!normalizedAnchor || isGenericCategoryOnlyQuery(anchor, context)) {
      return false;
    }
    return true;
  });
}

function normalizeQueryIdentityValue(value) {
  return normalizeComparableText(value)
    .replace(/["]/g, "")
    .replace(/\b(?:the|and|with|for|official|collector'?s?|collectible|vintage|used|item|listing|price|resale)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBrandOnlyQuery(query, context = {}) {
  const normalized = normalizeQueryIdentityValue(query);
  if (!normalized) return false;
  const brands = [
    context.brand,
    context.visualBrand,
    context.manufacturer
  ].map(normalizeQueryIdentityValue).filter(Boolean);
  return brands.some((brand) => brand === normalized);
}

function isPersonOnlyQuery(query, context = {}) {
  const normalized = normalizeQueryIdentityValue(query);
  if (!normalized) return false;
  return normalizeStringArray(context.namedPeople, 8)
    .map(normalizeQueryIdentityValue)
    .filter(Boolean)
    .some((name) => name === normalized);
}

function isYearOnlyQuery(query) {
  return /^(?:18|19|20)\d{2}$/.test(cleanText(query).replace(/"/g, ""));
}

function usesPersonNameWithoutItemAnchor(query, context = {}) {
  const text = cleanText(query).toLowerCase();
  const people = normalizeStringArray(context.namedPeople, 6);
  if (!people.some((name) => containsNormalizedPhrase(text, name))) {
    return false;
  }
  return !hasQueryItemNoun(query, context)
    && !hasLongIdentifierTerm(query, context)
    && ![context.brand, context.visualBrand, context.visualOrganization, context.schoolName, context.teamName].map(cleanText).some((anchor) => anchor && containsNormalizedPhrase(text, anchor));
}

function shouldPreferSerperQueryRecord(candidate, existing, context = {}) {
  if (!existing) return true;
  const candidateScore = scoreSearchQuerySpecificity(candidate.query, context) + extractMeaningfulQueryTerms(candidate.query).length;
  const existingScore = scoreSearchQuerySpecificity(existing.query, context) + extractMeaningfulQueryTerms(existing.query).length;
  if (candidateScore !== existingScore) {
    return candidateScore > existingScore;
  }
  return cleanText(candidate.query).length > cleanText(existing.query).length;
}

function createSerperRequestError({ category = "serper_provider_error", code = "", statusCode = null, message = "Serper Google Search request failed." } = {}) {
  const error = new Error(sanitizeErrorText(message));
  error.category = category;
  error.code = sanitizeErrorText(code);
  error.statusCode = statusCode;
  return error;
}

function classifySerperStatus(statusCode, data = {}) {
  const haystack = [data.error, data.message, data.code, data?.error?.message].map((value) => String(value || "").toLowerCase()).join(" ");
  if (statusCode === 401 || statusCode === 403 || /auth|api key|unauthorized|forbidden/.test(haystack)) {
    return "serper_authentication_failure";
  }
  if (statusCode === 429 || /rate|quota|limit|billing/.test(haystack)) {
    return "serper_rate_limited";
  }
  if (statusCode === 408 || statusCode === 504 || /timeout|timed out/.test(haystack)) {
    return "serper_timeout";
  }
  return "serper_provider_error";
}

function summarizeSerperErrorMessage(data = {}, statusCode = null) {
  const message = data?.error?.message || data?.message || data?.error || data?.code || "";
  return sanitizeErrorText(message || `Serper Google Search request failed with status ${statusCode || "unknown"}.`);
}

function classifySerperError(error = {}) {
  const category = error.category
    || (error.name === "AbortError" ? "serper_timeout" : "")
    || classifySerperStatus(error.statusCode, error);
  const message = sanitizeErrorText(error.message || "Serper Google Search was unavailable before source results could be retrieved.");
  const userMessage = category === "serper_authentication_failure"
    ? "Serper Google Search authentication failed. The key value was not exposed."
    : category === "serper_rate_limited"
      ? "Serper Google Search was rate limited or quota-limited."
      : category === "serper_timeout"
        ? "Serper Google Search timed out before source results could be retrieved."
        : message;
  return {
    category,
    statusCode: error.statusCode || null,
    code: sanitizeErrorText(error.code || ""),
    message,
    userMessage
  };
}

function canonicalizeComparableUrl(url) {
  const text = cleanText(url);
  if (!/^https?:\/\//i.test(text)) {
    return "";
  }
  try {
    const parsed = new URL(text);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^utm_/i.test(key) || /^(fbclid|gclid|msclkid|igshid|mc_cid|mc_eid|ref|spm|campid|customid)$/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    return parsed.toString().replace(/[.,;]+$/, "");
  } catch {
    return "";
  }
}

function parseDisplayedPrice(text) {
  const normalized = extractDisplayedPrice(text);
  if (!normalized) {
    return null;
  }
  const amount = Number(normalized.replace(/[$,]/g, ""));
  return Number.isFinite(amount) ? amount : null;
}

function createSerperResponseSummary(queryRecord, requestRecord, parsed) {
  return {
    query: queryRecord.query,
    priority: queryRecord.priority,
    searchPass: queryRecord.searchPass,
    retailStage: queryRecord.retailStage || "",
    retailStageLabel: queryRecord.retailStageLabel || "",
    retailBudgetBucket: queryRecord.retailBudgetBucket || "",
    provider: "Serper Google Search",
    providerKey: "serper_google",
    marketplaceDomainsRequested: queryRecord.marketplaceDomains || [],
    allowedDomainsRequested: queryRecord.marketplaceDomains || [],
    rawCandidate: queryRecord.rawCandidate || queryRecord.query,
    candidateOrigin: queryRecord.candidateOrigin || queryRecord.searchPass,
    normalizedCandidate: queryRecord.normalizedCandidate || queryRecord.query,
    finalQuery: queryRecord.finalQuery || queryRecord.query,
    validationPassed: queryRecord.validationPassed !== false,
    validationFailureReason: queryRecord.validationFailureReason || "",
    statusCode: requestRecord.statusCode || null,
    webSearchCallAppeared: false,
    providerSourceCount: parsed.records.length,
    organicResultCount: parsed.organicResultCount,
    shoppingResultCount: parsed.shoppingResultCount,
    knowledgeGraphResultCount: parsed.knowledgeGraphResultCount,
    relatedSearchCount: parsed.relatedSearchCount,
    parsedCandidateCount: parsed.records.length,
    retainedResultCount: requestRecord.retainedResultCount || 0,
    sourceURLsReturned: requestRecord.sourceURLsReturned || [],
    domainsReturned: requestRecord.domainsReturned || []
  };
}

function classifySerperIdentityMatch(record = {}, identity = {}, context = {}, itemTypeCompatibility = null) {
  const haystack = normalizeComparableText([
    record.title,
    record.snippet,
    record.domain,
    record.url
  ].join(" "));
  if (!haystack) {
    return "Rejected";
  }

  const itemType = cleanText(context.itemType || inferSearchItemType(identity, context.visualCategory, context.productTitle, context.notesText, context.routeText));
  const compatibility = itemTypeCompatibility || evaluateComparableItemTypeCompatibility(record, identity, context);

  const identifiers = [
    context.upc,
    context.model,
    context.itemCode,
    identity.upcBarcode,
    identity.model,
    identity.sku,
    identity.styleNumber,
    identity.modelOrItemNumber
  ].map(cleanText).filter(hasKnownValue);
  const identifierHit = identifiers.some((identifier) => containsNormalizedPhrase(haystack, identifier));

  const distinctivePhrases = mergeStringArrays(
    context.distinctivePhrases,
    context.eventPhrases,
    context.visibleEvidence,
    identity.strongestSearchableIdentifiers,
    identity.textIdentityEvidence,
    24
  ).filter((phrase) => cleanText(phrase).split(/\s+/).length >= 2);
  const exactPhraseHits = distinctivePhrases.filter((phrase) => containsNormalizedPhrase(haystack, phrase));
  const brandHit = containsAnyKnownPhrase(haystack, [context.brand, context.visualBrand, identity.brand, identity.brandSeries, identity.manufacturer]);
  const organizationHit = containsAnyKnownPhrase(haystack, [context.visualOrganization, context.schoolName, context.teamName, identity.schoolName, identity.teamName, identity.recognizedOrganization]);
  const personHit = containsAnyKnownPhrase(haystack, context.namedPeople || []);
  const yearHit = containsAnyKnownPhrase(haystack, context.years || []);
  const itemTypeHit = isComparableItemTypeValuationSafe(compatibility) || hasItemTypeSupport(haystack, itemType);
  const productHit = containsAnyKnownPhrase(haystack, [context.productTitle, context.subjectIdentity, context.exactProductIdentity, identity.productNameOrBoxTitle]);
  const hasIdentitySignal = identifierHit
    || exactPhraseHits.length
    || brandHit
    || organizationHit
    || personHit
    || yearHit
    || productHit
    || record.sourceType === "knowledge_graph_reference";

  if (!isComparableItemTypeValuationSafe(compatibility)) {
    if (compatibility.itemTypeCompatible === false) {
      return hasIdentitySignal ? "Reference Only" : "Rejected";
    }
    return hasIdentitySignal ? "Reference Only" : "Weak";
  }

  if (identifierHit) {
    return "Exact";
  }
  if (hasCurrentRetailAlternativeSourceSupport(record, context, compatibility)) {
    return "Strong Similar";
  }

  const score = [
    exactPhraseHits.length >= 2 ? 4 : exactPhraseHits.length ? 3 : 0,
    itemTypeHit ? 2 : 0,
    brandHit ? 2 : 0,
    organizationHit ? 2 : 0,
    personHit ? 1 : 0,
    yearHit ? 1 : 0,
    productHit ? 1 : 0
  ].reduce((sum, value) => sum + value, 0);

  const hasDistinctiveExactSupport = exactPhraseHits.length >= 2
    || productHit
    || (organizationHit && (personHit || yearHit));
  if (itemTypeHit && hasDistinctiveExactSupport && (brandHit || organizationHit || productHit) && score >= 7) {
    return "Exact";
  }
  if ((itemTypeHit && (brandHit || organizationHit || productHit)) || score >= 5) {
    return "Strong Similar";
  }
  if (score >= 3 || exactPhraseHits.length || (itemTypeHit && (brandHit || organizationHit))) {
    return "Partial";
  }
  if (record.sourceType === "knowledge_graph_reference" || brandHit || organizationHit || productHit) {
    return "Reference Only";
  }
  if (score > 0 || itemTypeHit) {
    return "Weak";
  }
  return "Rejected";
}

function hasCurrentRetailAlternativeSourceSupport(record = {}, context = {}, itemTypeCompatibility = {}) {
  if (!isCurrentRetailOnlyMode(context.retailEvidenceMode) || !isComparableItemTypeValuationSafe(itemTypeCompatibility)) {
    return false;
  }
  const text = normalizeComparableText([
    record.title,
    record.snippet,
    record.domain,
    record.url,
    record.query,
    record.searchPass,
    record.displayedPriceText
  ].join(" "));
  if (!text || isRetailForbiddenSecondaryEvidenceText(text)) {
    return false;
  }
  const productFamily = normalizeComparableText(deriveRetailProductFamily(context));
  const familyTokens = itemTypeTokens(productFamily || context.itemType).filter((token) => token.length >= 3);
  const hasFamily = productFamily
    ? containsNormalizedPhrase(text, productFamily) || familyTokens.some((token) => new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "i").test(text))
    : familyTokens.some((token) => new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "i").test(text));
  const submittedNeedsSecurity = /\bsecurity\b/.test(normalizeComparableText([context.productTitle, context.exactProductIdentity, context.subjectIdentity, context.notesText].join(" ")));
  const candidateHasSecurity = /\b(?:security|privacy|confidential|security\s+tint)\b/.test(text);
  const hasRetailPriceSignal = record.sourceType === "shopping"
    || Boolean(record.displayedPriceText || Number.isFinite(record.parsedPrice))
    || /\b(?:current price|retail price|shopping offer|in stock|pickup|delivery|add to cart|store price)\b/i.test(text);
  const hasPackageOrClosureSignal = /\b\d{1,5}\s*(?:count|ct|pack|pk|envelopes?)\b/i.test(text)
    || /\b(?:strip|peel|self|gummed|seal)\b/i.test(text)
    || /\b(?:business|security|privacy|confidential)\b/i.test(text);
  return hasFamily && hasRetailPriceSignal && hasPackageOrClosureSignal && (!submittedNeedsSecurity || candidateHasSecurity);
}

function normalizeComparableText(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[â€™]/g, "'")
    .replace(/[^a-z0-9$.'":\/ -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsNormalizedPhrase(haystack, phrase) {
  const needle = normalizeComparableText(phrase).replace(/^["']|["']$/g, "");
  if (!needle || !hasKnownValue(needle)) {
    return false;
  }
  if (needle.length <= 3) {
    return new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(haystack);
  }
  return haystack.includes(needle);
}

function containsAnyKnownPhrase(haystack, values = []) {
  return normalizeStringArray(values, 20).filter(hasKnownValue).some((value) => containsNormalizedPhrase(haystack, value));
}

function hasItemTypeSupport(haystack, itemType) {
  const tokens = itemTypeTokens(itemType);
  return tokens.some((token) => new RegExp(`\\b${escapeRegExp(token)}s?\\b`, "i").test(haystack));
}

function itemTypeTokens(itemType) {
  const text = normalizeComparableText(itemType);
  const tokens = [];
  const groups = [
    ["tray", /tray|serving tray|collector tray|plate|platter/],
    ["figurine", /figurine|figure|statue|decoration|decor|ornament|santa|christmas|holiday/],
    ["dress", /dress|gown|skirt|apparel|clothing|shirt|jacket|shoe|boots?/],
    ["laptop", /laptop|computer|notebook|macbook|chromebook/],
    ["canister", /canister|cookie jar|jar|container|set/],
    ["furniture", /furniture|sofa|chair|table|dresser|cabinet|desk|couch/],
    ["bag", /bag|purse|handbag|tote|wallet/],
    ["watch", /watch|wristwatch/],
    ["phone", /phone|smartphone|iphone|android/],
    ["envelope", /envelope|stationery|security envelope|peel[- ]?and[- ]?seal|gummed/]
  ];
  for (const [token, pattern] of groups) {
    if (pattern.test(text)) tokens.push(token);
  }
  if (!tokens.length) {
    tokens.push(...text.split(/\s+/).filter((token) => token.length > 3).slice(0, 3));
  }
  return [...new Set(tokens)];
}

const comparableItemTypeDefinitions = [
  { key: "replacement_piece", label: "replacement part or single piece", priority: 125, patterns: [/\breplacement\s+(?:piece|part|lid|base|drawer|shelf|shade)\b/i, /\bparts?\s+only\b/i, /\bsingle\s+(?:piece|lid|plate|bowl|cup)\b/i] },
  { key: "serving_tray", label: "serving/decorative tray", priority: 120, patterns: [/\b(?:serving|decorative|collector|collectible|advertising|display|bar)?\s*trays?\b/i, /\bplatters?\b/i] },
  { key: "bottle", label: "bottle", priority: 118, patterns: [/\bbottles?\b/i] },
  { key: "sign", label: "sign or wall plaque", priority: 116, patterns: [/\bsigns?\b/i, /\bwall\s+plaques?\b/i, /\btin\s+signs?\b/i] },
  { key: "plate", label: "plate", priority: 114, patterns: [/\bplates?\b/i, /\bcollector\s+plates?\b/i] },
  { key: "cup_glass", label: "cup, mug, glass, or tumbler", priority: 114, patterns: [/\bcups?\b/i, /\bmugs?\b/i, /\bglasses?\b/i, /\btumblers?\b/i] },
  { key: "poster_print", label: "poster, print, or flat wall art", priority: 114, patterns: [/\bposters?\b/i, /\bprints?\b/i, /\bwall\s+art\b/i] },
  { key: "can", label: "can or tin", priority: 112, patterns: [/\bcans?\b/i, /\btins?\b/i] },
  { key: "cooler", label: "cooler or ice chest", priority: 112, patterns: [/\bcoolers?\b/i, /\bice\s+chests?\b/i] },
  { key: "ornament", label: "ornament", priority: 112, patterns: [/\bornaments?\b/i] },
  { key: "figurine", label: "figurine, figure, or statue", priority: 112, patterns: [/\bfigurines?\b/i, /\bfigures?\b/i, /\bstatu(?:e|es|ette|ettes)\b/i, /\bsculptures?\b/i] },
  { key: "sticker_decal", label: "sticker or decal", priority: 110, patterns: [/\bstickers?\b/i, /\bdecals?\b/i, /\bwindow\s+clings?\b/i] },
  { key: "box", label: "box or container", priority: 108, patterns: [/\bbox(?:es)?\b/i, /\bcrates?\b/i] },
  { key: "canister", label: "canister, jar, or storage container", priority: 108, patterns: [/\bcanisters?\b/i, /\bcookie\s+jars?\b/i, /\bjars?\b/i, /\bstorage\s+containers?\b/i] },
  { key: "bowl", label: "bowl", priority: 106, patterns: [/\bbowls?\b/i] },
  { key: "complete_set", label: "complete set", priority: 105, patterns: [/\bcomplete\s+sets?\b/i, /\bsets?\s+of\s+\d+\b/i, /\b\d+\s*[- ]?\s*piece\s+sets?\b/i] },
  { key: "book", label: "book or manual", priority: 104, patterns: [/\bbooks?\b/i, /\bmanuals?\b/i, /\bcatalogs?\b/i] },
  { key: "card", label: "card", priority: 104, patterns: [/\bcards?\b/i, /\btrading\s+cards?\b/i] },
  { key: "apparel", label: "shirt, jacket, or apparel", priority: 104, patterns: [/\bshirts?\b/i, /\bjackets?\b/i, /\bsweaters?\b/i, /\bjerseys?\b/i, /\bapparel\b/i] },
  { key: "hat", label: "hat or cap", priority: 104, patterns: [/\bhats?\b/i, /\bcaps?\b/i] },
  { key: "dress", label: "dress or gown", priority: 104, patterns: [/\bdresses?\b/i, /\bgowns?\b/i] },
  { key: "shoe", label: "shoe or boot", priority: 104, patterns: [/\bshoes?\b/i, /\bboots?\b/i, /\bsneakers?\b/i] },
  { key: "envelope_box", label: "boxed envelopes or stationery", priority: 110, patterns: [/\benvelopes?\b/i, /\bstationery\b/i, /\bsecurity\s+envelopes?\b/i, /\bpeel[- ]?and[- ]?seal\b/i, /\bgummed\s+envelopes?\b/i] },
  { key: "bag", label: "bag, purse, or tote", priority: 104, patterns: [/\bbags?\b/i, /\bpurses?\b/i, /\bhandbags?\b/i, /\btotes?\b/i] },
  { key: "wallet", label: "wallet", priority: 104, patterns: [/\bwallets?\b/i] },
  { key: "watch", label: "watch", priority: 104, patterns: [/\bwatches?\b/i, /\bwristwatches?\b/i] },
  { key: "phone", label: "phone", priority: 104, patterns: [/\bphones?\b/i, /\bsmartphones?\b/i, /\biphones?\b/i, /\bandroid\s+phones?\b/i] },
  { key: "laptop", label: "laptop or computer", priority: 104, patterns: [/\blaptops?\b/i, /\bnotebooks?\b/i, /\bcomputers?\b/i, /\bmacbooks?\b/i, /\bchromebooks?\b/i] },
  { key: "electronics_accessory", label: "electronics accessory", priority: 106, patterns: [/\bchargers?\b/i, /\bbatter(?:y|ies)\b/i, /\bkeyboards?\b/i, /\bsleeves?\b/i] },
  { key: "lamp", label: "lamp or light fixture", priority: 104, patterns: [/\blamps?\b/i, /\blight\s+fixtures?\b/i] },
  { key: "lamp_shade", label: "lamp shade", priority: 106, patterns: [/\blamp\s+shades?\b/i, /\bshades?\s+only\b/i] },
  { key: "furniture", label: "furniture", priority: 102, patterns: [/\bsofas?\b/i, /\bcouches?\b/i, /\bchairs?\b/i, /\btables?\b/i, /\bdressers?\b/i, /\bcabinets?\b/i, /\bdesks?\b/i] }
];

function evaluateComparableItemTypeCompatibility(record = {}, identity = {}, context = {}) {
  const submittedText = buildSubmittedItemTypeText(identity, context);
  const candidateText = buildCandidateItemTypeText(record);
  const submitted = detectCanonicalComparableItemType(submittedText);
  const titleUrlCandidate = detectCanonicalComparableItemType([record.title, record.url, record.canonicalUrl].filter(Boolean).join(" "));
  const candidate = titleUrlCandidate.key ? titleUrlCandidate : detectCanonicalComparableItemType(candidateText);
  const setScope = detectComparableSetScope(submittedText, candidateText);
  const packScope = detectComparablePackScope(submittedText, candidateText, context);

  if (setScope.status !== "compatible") {
    return {
      itemTypeCompatible: false,
      status: setScope.status,
      submittedItemType: submitted.label || setScope.submittedScope || "submitted item",
      candidateItemType: candidate.label || setScope.candidateScope || "candidate result",
      explanation: setScope.explanation
    };
  }

  if (packScope.status !== "compatible") {
    return {
      itemTypeCompatible: false,
      status: packScope.status,
      submittedItemType: submitted.label || "submitted item",
      candidateItemType: candidate.label || "candidate result",
      submittedPackQuantity: packScope.submittedQuantity,
      candidatePackQuantity: packScope.candidateQuantity,
      explanation: packScope.explanation
    };
  }

  if (!submitted.key) {
    return {
      itemTypeCompatible: false,
      status: "submitted_type_unknown",
      submittedItemType: "",
      candidateItemType: candidate.label,
      explanation: "No concrete submitted item type could be established, so source prices cannot be treated as exact or strong comparables."
    };
  }

  if (!candidate.key) {
    return {
      itemTypeCompatible: false,
      status: "candidate_type_unknown",
      submittedItemType: submitted.label,
      candidateItemType: "",
      explanation: `Candidate product form is unknown; it is not valuation-compatible with the submitted ${submitted.label}.`
    };
  }

  if (candidate.key !== submitted.key) {
    return {
      itemTypeCompatible: false,
      status: "item_type_mismatch",
      submittedItemType: submitted.label,
      candidateItemType: candidate.label,
      explanation: `Product-form mismatch: submitted item appears to be ${articleFor(submitted.label)} ${submitted.label}, but the candidate appears to be ${articleFor(candidate.label)} ${candidate.label}. Shared brand, date, event, or theme wording cannot make different product types comparable.`
    };
  }

  return {
    itemTypeCompatible: true,
    status: "compatible",
    submittedItemType: submitted.label,
    candidateItemType: candidate.label,
    explanation: `Candidate product form matches the submitted ${submitted.label}.`
  };
}

function buildSubmittedItemTypeText(identity = {}, context = {}) {
  return [
    context.itemType,
    context.productTitle,
    context.subjectIdentity,
    context.exactProductIdentity,
    context.visualCategory,
    context.notesText,
    identity.itemType,
    identity.category,
    identity.visualSubject,
    identity.visualSubjectCategory,
    identity.likelyItemDescription,
    identity.productNameOrBoxTitle,
    identity.exactProductIdentity,
    identity.subjectIdentity,
    identity.brandSeries,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.packageQuantity,
    identity.packageSize,
    identity.unitCount
  ].filter(Boolean).join(" ");
}

function buildCandidateItemTypeText(record = {}) {
  return [
    record.title,
    record.snippet,
    record.description,
    record.condition,
    record.category,
    record.sourceType,
    record.domain,
    record.url,
    record.canonicalUrl,
    record.rawText
  ].filter(Boolean).join(" ");
}

function detectCanonicalComparableItemType(text) {
  const normalized = normalizeComparableText(text);
  if (!normalized) {
    return { key: "", label: "", matches: [] };
  }

  const matches = [];
  for (const definition of comparableItemTypeDefinitions) {
    const hit = definition.patterns.find((pattern) => pattern.test(normalized));
    if (hit) {
      matches.push({
        key: definition.key,
        label: definition.label,
        priority: definition.priority,
        pattern: String(hit)
      });
    }
  }

  if (!matches.length) {
    return { key: "", label: "", matches: [] };
  }

  matches.sort((a, b) => b.priority - a.priority || a.label.localeCompare(b.label));
  return { ...matches[0], matches };
}

function detectComparableSetScope(submittedText, candidateText) {
  const submitted = normalizeComparableText(submittedText);
  const candidate = normalizeComparableText(candidateText);
  const submittedCompleteSet = /\bcomplete\s+sets?\b|\bsets?\s+of\s+\d+\b|\b\d+\s*[- ]?\s*piece\s+sets?\b/i.test(submitted);
  const submittedReplacement = /\breplacement\s+(?:piece|part|lid|base|drawer|shelf|shade)\b|\bparts?\s+only\b|\bsingle\s+(?:piece|lid|plate|bowl|cup)\b/i.test(submitted);
  const candidateCompleteSet = /\bcomplete\s+sets?\b|\bsets?\s+of\s+\d+\b|\b\d+\s*[- ]?\s*piece\s+sets?\b/i.test(candidate);
  const candidateReplacement = /\breplacement\s+(?:piece|part|lid|base|drawer|shelf|shade)\b|\bparts?\s+only\b|\bsingle\s+(?:piece|lid|plate|bowl|cup)\b/i.test(candidate);

  if (submittedCompleteSet && candidateReplacement) {
    return {
      status: "set_scope_mismatch",
      submittedScope: "complete set",
      candidateScope: "replacement part or single piece",
      explanation: "Product-scope mismatch: a complete set cannot use a replacement part or single-piece listing as exact or strong valuation evidence."
    };
  }
  if (submittedReplacement && candidateCompleteSet) {
    return {
      status: "set_scope_mismatch",
      submittedScope: "replacement part or single piece",
      candidateScope: "complete set",
      explanation: "Product-scope mismatch: a replacement part or single piece cannot use a complete-set listing as exact or strong valuation evidence."
    };
  }
  return { status: "compatible", explanation: "" };
}

function detectComparablePackScope(submittedText, candidateText, context = {}) {
  const submittedQuantity = extractPackQuantityNumber(submittedText);
  const candidateQuantity = extractPackQuantityNumber(candidateText);
  const submittedTextNormalized = normalizeComparableText(submittedText);
  const candidateTextNormalized = normalizeComparableText(candidateText);
  const sameProductFamily = /\benvelopes?\b/.test(submittedTextNormalized) && /\benvelopes?\b/.test(candidateTextNormalized);

  if (!Number.isFinite(submittedQuantity) || !Number.isFinite(candidateQuantity)) {
    return {
      status: "compatible",
      submittedQuantity: Number.isFinite(submittedQuantity) ? submittedQuantity : null,
      candidateQuantity: Number.isFinite(candidateQuantity) ? candidateQuantity : null,
      explanation: ""
    };
  }

  if (submittedQuantity === candidateQuantity) {
    return { status: "compatible", submittedQuantity, candidateQuantity, explanation: "" };
  }

  if (sameProductFamily) {
    if (isCurrentRetailOnlyMode(context.retailEvidenceMode)) {
      return {
        status: "compatible",
        submittedQuantity,
        candidateQuantity,
        explanation: `Retail pack-count difference: submitted item appears to be ${submittedQuantity}-count, and the candidate appears to be ${candidateQuantity}-count. Keep package price and unit price separate; do not treat the packages as exact matches.`
      };
    }
    return {
      status: "pack_quantity_mismatch",
      submittedQuantity,
      candidateQuantity,
      explanation: `Pack-size mismatch: submitted item appears to be ${submittedQuantity}-count, but the candidate appears to be ${candidateQuantity}-count. Use only unit-price context when product type and specifications are compatible; do not treat the package prices as exact matches.`
    };
  }

  return { status: "compatible", submittedQuantity, candidateQuantity, explanation: "" };
}

function extractPackQuantityNumber(value) {
  const text = normalizeComparableText(value);
  const patterns = [
    /\b(\d{1,5})\s*(?:count|ct|cnt|pk|pack|piece|pc|pcs|sheets?|envelopes?|units?)\b/i,
    /\b(?:count|ct|pack|quantity|qty)\s*[:#-]?\s*(\d{1,5})\b/i,
    /\b(\d{1,5})\s*[- ]?(?:count|ct)\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = Number(match[1]);
      if (Number.isFinite(amount) && amount > 1) {
        return amount;
      }
    }
  }
  return null;
}

function extractBestPackQuantityNumber(values = []) {
  const items = Array.isArray(values) ? values : [values];
  for (const value of items) {
    const quantity = extractPackQuantityNumber(value);
    if (Number.isFinite(quantity)) {
      return quantity;
    }
  }
  return null;
}

function extractPackQuantityText(value) {
  const quantity = extractPackQuantityNumber(value);
  return Number.isFinite(quantity) ? `${quantity}-count` : "";
}

function isComparableItemTypeValuationSafe(itemTypeCompatibility = {}) {
  return Boolean(itemTypeCompatibility && itemTypeCompatibility.itemTypeCompatible === true && itemTypeCompatibility.status === "compatible");
}

function isValuationBearingComparable(identityMatchStrength = "", priceEvidenceType = "", itemTypeCompatibility = {}) {
  return isComparableItemTypeValuationSafe(itemTypeCompatibility)
    && /Exact|Strong Similar/i.test(identityMatchStrength)
    && !/No Usable|Reference Without Price|Non-Transactional Reference|Bulk\/Lot Reference/i.test(priceEvidenceType);
}

function isVerifiedMarketRangeEvidence(identityMatchStrength = "", priceEvidenceType = "", itemTypeCompatibility = {}, record = {}) {
  return isComparableItemTypeValuationSafe(itemTypeCompatibility)
    && /Exact|Strong Similar/i.test(identityMatchStrength)
    && isQualifiedVerifiedSoldPriceEvidence(record, normalizePriceTypeLabel(priceEvidenceType, record), identityMatchStrength);
}

function isPreliminaryAskingPriceRangeEvidence(identityMatchStrength = "", priceEvidenceType = "", itemTypeCompatibility = {}, record = {}) {
  const normalizedPriceType = normalizePriceTypeLabel(priceEvidenceType, record);
  return isComparableItemTypeValuationSafe(itemTypeCompatibility)
    && /Exact|Strong Similar|Partial/i.test(identityMatchStrength)
    && Boolean(record.displayedPriceText || record.displayedPrice || record.price || Number.isFinite(record.parsedPrice))
    && !/No Usable|Reference Without Price|Unknown Price Type|Non-Transactional Reference|Bulk\/Lot Reference/i.test(normalizedPriceType);
}

function buildNonValuationInfluenceReason(priceEvidenceType = "", itemTypeCompatibility = {}) {
  if (!isComparableItemTypeValuationSafe(itemTypeCompatibility)) {
    return `No - ${cleanText(itemTypeCompatibility.explanation) || "product form was not confirmed as compatible with the submitted item."}`;
  }
  if (/Bulk\/Lot Reference/i.test(priceEvidenceType)) {
    return "No - bulk/lot reference; unit price was not established.";
  }
  if (/Non-Transactional Reference/i.test(priceEvidenceType)) {
    return "No - non-transactional content is not completed sale or current purchase evidence.";
  }
  if (/No Usable|Reference Without Price/i.test(priceEvidenceType)) {
    return "No price supplied or no usable valuation price evidence.";
  }
  return "No - match quality is not exact or strong enough for valuation.";
}

function buildVerifiedMarketRangeNonInfluenceReason(priceEvidenceType = "", itemTypeCompatibility = {}) {
  if (!isComparableItemTypeValuationSafe(itemTypeCompatibility)) {
    return `No - ${cleanText(itemTypeCompatibility.explanation) || "product form was not confirmed as compatible with the submitted item."}`;
  }
  if (!/Confirmed Sold|Verified Sold/i.test(priceEvidenceType)) {
    return "No - visible price is not verified sold evidence.";
  }
  return "No - match quality is not exact or strong enough for verified market value.";
}

function buildPreliminaryRangeNonInclusionReason(priceEvidenceType = "", itemTypeCompatibility = {}) {
  if (!isComparableItemTypeValuationSafe(itemTypeCompatibility)) {
    return `No - ${cleanText(itemTypeCompatibility.explanation) || "product form was not confirmed as compatible with the submitted item."}`;
  }
  if (/Bulk\/Lot Reference/i.test(priceEvidenceType)) {
    return "No - bulk/lot reference; unit price was not established.";
  }
  if (/Non-Transactional Reference/i.test(priceEvidenceType)) {
    return "No - non-transactional content is not market price evidence.";
  }
  if (/No Usable|Reference Without Price/i.test(priceEvidenceType)) {
    return "No - no usable visible price was supplied.";
  }
  return "No - match quality is not useful enough for a preliminary asking-price range.";
}

function articleFor(label = "") {
  return /^[aeiou]/i.test(cleanText(label)) ? "an" : "a";
}

function hasStrongItemTypeMismatch(haystack, itemType) {
  const tokens = itemTypeTokens(itemType);
  if (tokens.includes("tray") && /\b(bottle|can|mug|tumbler|glass|cooler|sign|shirt|cap|hat)\b/i.test(haystack) && !/\btray|platter|plate\b/i.test(haystack)) {
    return true;
  }
  if (tokens.includes("figurine") && /\b(card|book|shirt|poster|sticker|mug|plate)\b/i.test(haystack) && !/\bfigurine|figure|statue|decoration|decor|ornament|santa|christmas|holiday\b/i.test(haystack)) {
    return true;
  }
  if (tokens.includes("dress") && /\b(handbag|shoe|watch|jewelry|perfume|coat)\b/i.test(haystack) && !/\bdress|gown|skirt\b/i.test(haystack)) {
    return true;
  }
  if (tokens.includes("laptop") && /\b(case|charger|battery|keyboard|skin|sleeve)\b/i.test(haystack) && !/\blaptop|notebook|computer|macbook|chromebook\b/i.test(haystack)) {
    return true;
  }
  return false;
}

function classifySerperPriceEvidence(record = {}) {
  const text = normalizeComparableText([record.title, record.snippet, record.domain, record.displayedPriceText].join(" "));
  const hasPrice = Boolean(record.displayedPriceText || Number.isFinite(record.parsedPrice));
  if (isBulkLotReferenceWithoutUnitPrice(record)) {
    return "Bulk/Lot Reference";
  }
  if (isNonTransactionalContentRecord(record)) {
    return "Non-Transactional Reference";
  }
  if (record.sourceType === "shopping" && hasPrice) {
    return "Shopping Offer";
  }
  if (hasPrice && /\b(sold for|sold price|price realized|hammer price|final sale price)\b/i.test(text) && hasExplicitSoldTransactionProof(record)) {
    return "Confirmed Sold";
  }
  if (hasPrice && /\b(sold|ended|completed)\b/i.test(text)) {
    return "Ended Listing Without Confirmed Sale";
  }
  if (hasPrice) {
    return "Active Asking";
  }
  if (record.sourceType === "knowledge_graph_reference" || /reference|archive|worthpoint|picclick|collector|history|wiki/.test(text)) {
    return "Reference Without Price";
  }
  return "No Usable Price Evidence";
}

function buildSerperRejectionReason(record = {}, identityMatchStrength = "", context = {}, itemTypeCompatibility = {}) {
  const haystack = normalizeComparableText([record.title, record.snippet, record.url].join(" "));
  if (!isComparableItemTypeValuationSafe(itemTypeCompatibility)) {
    return cleanText(itemTypeCompatibility.explanation)
      || `Rejected as an item-type mismatch for expected ${context.itemType || "item"}.`;
  }
  if (identityMatchStrength === "Rejected" && hasStrongItemTypeMismatch(haystack, context.itemType)) {
    return `Rejected as an item-type mismatch for expected ${context.itemType || "item"}.`;
  }
  if (identityMatchStrength === "Rejected") {
    return "Rejected because the result did not share enough specific identity signals with the submitted item.";
  }
  if (identityMatchStrength === "Weak") {
    return "Weak identity overlap only; not used to establish fair value.";
  }
  if (identityMatchStrength === "Partial") {
    return "Partial match; useful only as directional context unless stronger identifiers are verified.";
  }
  if (identityMatchStrength === "Reference Only") {
    return "Reference source only; useful for identity context but not direct valuation.";
  }
  return "";
}

function buildSerperMatchExplanation(record = {}, identityMatchStrength = "", priceEvidenceType = "", itemTypeCompatibility = {}) {
  const source = record.domain || "source";
  if (!isComparableItemTypeValuationSafe(itemTypeCompatibility)) {
    return `${cleanText(itemTypeCompatibility.explanation) || "Candidate product form is not valuation-compatible with the submitted item."} This result may provide identity context only and must not influence valuation.`;
  }
  if (identityMatchStrength === "Exact") {
    return `Appears to match specific visible identifiers, wording, brand, or item type from the submitted item. Price evidence: ${priceEvidenceType}.`;
  }
  if (identityMatchStrength === "Strong Similar") {
    return `Shares strong brand/category/identity signals with the submitted item, but one or more exact details may differ. Price evidence: ${priceEvidenceType}.`;
  }
  if (identityMatchStrength === "Partial") {
    return `Shares some identity or category signals from ${source}, but it is not exact enough for fair-market value by itself.`;
  }
  if (identityMatchStrength === "Reference Only") {
    return `Source-backed identity/reference result from ${source}; no direct comparable price should be inferred.`;
  }
  if (identityMatchStrength === "Weak") {
    return `Weak overlap with the submitted item; shown for transparency and not used as a valuation comp.`;
  }
  return `Rejected because it is not comparable to the submitted item.`;
}

function buildSerperEvidenceRole(identityMatchStrength = "", priceEvidenceType = "", itemTypeCompatibility = {}) {
  if (!isComparableItemTypeValuationSafe(itemTypeCompatibility)) {
    return itemTypeCompatibility.itemTypeCompatible === false
      ? "Identity/reference context only - product type differs; not valuation support"
      : "Identity/reference context only - candidate product type not established; not valuation support";
  }
  if (/Bulk\/Lot Reference/i.test(priceEvidenceType)) {
    return "Rejected - bulk/lot reference without established unit price";
  }
  if (/Non-Transactional Reference/i.test(priceEvidenceType)) {
    return "Rejected - not a market transaction";
  }
  if (/Exact|Strong Similar/.test(identityMatchStrength) && !/No Usable|Reference Without Price/.test(priceEvidenceType)) {
    return `Comparable evidence - ${priceEvidenceType}`;
  }
  if (/Exact|Strong Similar/.test(identityMatchStrength)) {
    return "Identity evidence only - no usable price";
  }
  if (identityMatchStrength === "Partial") {
    return "Directional context only";
  }
  if (identityMatchStrength === "Reference Only") {
    return "Identity/reference context only";
  }
  if (identityMatchStrength === "Weak") {
    return "Weak match shown for transparency only";
  }
  return "Rejected - not used for valuation";
}

function preferRicherSerperRecord(existing = {}, incoming = {}) {
  const score = (record) => {
    let value = 0;
    if (record.displayedPriceText) value += 8;
    if (record.snippet) value += 2;
    if (record.sourceType === "shopping") value += 2;
    if (record.identityMatchStrength === "Exact") value += 10;
    else if (record.identityMatchStrength === "Strong Similar") value += 7;
    else if (record.identityMatchStrength === "Partial") value += 4;
    else if (record.identityMatchStrength === "Reference Only") value += 2;
    value += Math.min(4, Math.floor(cleanText(record.title).length / 40));
    return value;
  };
  return score(incoming) > score(existing)
    ? { ...incoming, queriesFound: existing.queriesFound, searchPassesFound: existing.searchPassesFound }
    : { ...existing };
}

function bucketSerperRecords(records = []) {
  const buckets = {
    strongComparables: [],
    partialComparables: [],
    itemIdentificationEvidence: [],
    referenceResults: [],
    weakMatches: [],
    rejectedMatches: []
  };
  for (const record of records) {
    const visible = serperRecordToVisibleResearchRecord(record);
    if (isStrongComparableEvidenceRecord(record, visible)) {
      buckets.strongComparables.push(visible);
    } else if (isNoPriceIdentityReference(record, visible)) {
      buckets.itemIdentificationEvidence.push({
        ...visible,
        classification: "Exact identity reference - no usable price",
        evidenceRole: "Identity/reference context only - not valuation support",
        influencedReferenceRange: "No - exact identity reference only because no usable visible price was found.",
        influencedVerifiedMarketRange: "No - no usable sold price evidence.",
        includedInPreliminaryAskingPriceRange: "No - no usable visible price evidence."
      });
    } else if (record.identityMatchStrength === "Partial") {
      buckets.partialComparables.push(visible);
    } else if (record.identityMatchStrength === "Reference Only") {
      buckets.referenceResults.push(visible);
    } else if (record.identityMatchStrength === "Weak") {
      buckets.weakMatches.push(visible);
    } else {
      buckets.rejectedMatches.push(visible);
    }
  }
  return {
    strongComparables: buckets.strongComparables.slice(0, 8),
    partialComparables: buckets.partialComparables.slice(0, 8),
    itemIdentificationEvidence: buckets.itemIdentificationEvidence.slice(0, 8),
    referenceResults: buckets.referenceResults.slice(0, 8),
    weakMatches: buckets.weakMatches.slice(0, 8),
    rejectedMatches: buckets.rejectedMatches.slice(0, 8)
  };
}

function isStrongComparableEvidenceRecord(record = {}, visible = serperRecordToVisibleResearchRecord(record)) {
  if (!(record.identityMatchStrength === "Exact" || record.identityMatchStrength === "Strong Similar")) {
    return false;
  }
  if (!visible.url || visible.sourceBacked !== "URL-cited") {
    return false;
  }
  if (!canSupportPreliminaryAskingRangeFromVisibleRecord(visible)) {
    return false;
  }
  return !/Unknown Price Type|No Usable Price Evidence|Reference Without Price|Identity\/Reference/i.test(normalizePriceTypeLabel(visible.priceType || visible.priceEvidenceType, visible));
}

function isNoPriceIdentityReference(record = {}, visible = serperRecordToVisibleResearchRecord(record)) {
  if (!(record.identityMatchStrength === "Exact" || record.identityMatchStrength === "Strong Similar")) {
    return false;
  }
  const amount = getVisibleItemPriceAmount(visible);
  return !Number.isFinite(amount) || amount <= 0 || /No Usable Price Evidence|Reference Without Price|Unknown Price Type/i.test(normalizePriceTypeLabel(visible.priceType || visible.priceEvidenceType, visible));
}

function serperRecordToVisibleResearchRecord(record = {}) {
  const classification = record.identityMatchStrength === "Exact"
    ? "Exact Match"
    : record.identityMatchStrength === "Strong Similar"
      ? "Strong Similar Match"
      : record.identityMatchStrength === "Partial"
        ? "Partial Comparable"
        : record.identityMatchStrength === "Reference Only"
          ? "Reference Only"
          : record.identityMatchStrength === "Weak"
            ? "Weak Match"
            : "Rejected Match";
  const status = /sold/i.test(record.priceEvidenceType)
    ? "sold/ended evidence status requires source context"
    : /Active Asking|Shopping Offer/i.test(record.priceEvidenceType)
      ? "active/reference asking evidence"
      : "reference/no-price evidence";
  return {
    title: record.title || record.url || "Source result",
    source: record.domain || record.source || "Serper Google result",
    url: record.url,
    canonicalUrl: record.canonicalUrl,
    displayedPrice: record.displayedPriceText,
    price: record.displayedPriceText,
    parsedPrice: record.parsedPrice,
    currency: record.currency,
    priceType: record.priceEvidenceType,
    priceTypeLabel: record.priceTypeLabel,
    evidenceType: record.evidenceType || record.evidenceRole || classification,
    delivery: record.delivery,
    condition: inferConditionFromSerperRecord(record),
    classification,
    identityMatchStrength: record.identityMatchStrength,
    itemTypeCompatible: record.itemTypeCompatible,
    submittedItemType: record.submittedItemType,
    candidateItemType: record.candidateItemType,
    itemTypeCompatibilityStatus: record.itemTypeCompatibilityStatus,
    itemTypeCompatibilityExplanation: record.itemTypeCompatibilityExplanation,
    submittedPackQuantity: record.submittedPackQuantity,
    candidatePackQuantity: record.candidatePackQuantity,
    evidenceRole: record.evidenceRole,
    matchExplanation: record.matchExplanation,
    itemIdentityDifferences: record.itemIdentityDifferences,
    influencedReferenceRange: record.influencedReferenceRange,
    influencedVerifiedMarketRange: record.influencedVerifiedMarketRange,
    includedInPreliminaryAskingPriceRange: record.includedInPreliminaryAskingPriceRange,
    rejectionReason: record.rejectionReason,
    sourceBacked: record.sourceBacked,
    provider: "serper_google",
    providerLabel: "Serper Google Search",
    sourceType: record.sourceType,
    searchPass: record.searchPass,
    query: record.query,
    queriesFound: record.queriesFound || [record.query].filter(Boolean),
    searchPassesFound: record.searchPassesFound || [record.searchPass].filter(Boolean),
    activeSoldReferenceStatus: status,
    snippet: record.snippet,
    rawText: [
      `Provider: serper_google`,
      `Source/platform/site: ${record.domain || "Unknown source"}`,
      `Title: ${record.title || "Title not supplied"}`,
      record.displayedPriceText ? `Price: ${record.displayedPriceText}` : "",
      record.delivery ? `Shipping/Delivery: ${record.delivery}` : "",
      `Price Type: ${record.priceEvidenceType}`,
      `Price Label: ${record.priceTypeLabel}`,
      `Evidence Type: ${record.evidenceType || record.evidenceRole || classification}`,
      `URL: ${record.url}`,
      `Match quality: ${classification}`,
      `Submitted Item Type: ${record.submittedItemType || "Unknown"}`,
      `Candidate Item Type: ${record.candidateItemType || "Unknown"}`,
      `Item Type Compatible: ${record.itemTypeCompatible === true ? "Yes" : "No"}`,
      record.submittedPackQuantity ? `Submitted Pack Quantity: ${record.submittedPackQuantity}` : "",
      record.candidatePackQuantity ? `Candidate Pack Quantity: ${record.candidatePackQuantity}` : "",
      `Influenced Verified Market Range: ${record.influencedVerifiedMarketRange}`,
      `Included in Preliminary Asking-Price Range: ${record.includedInPreliminaryAskingPriceRange}`,
      `Source Type: ${record.sourceType}`,
      `Search pass: ${record.searchPass}`,
      `Query: ${record.query}`,
      `Why: ${record.matchExplanation}`
    ].filter(Boolean).join(" | ")
  };
}

function inferConditionFromSerperRecord(record = {}) {
  const text = normalizeComparableText([record.title, record.snippet].join(" "));
  if (/\bnew with tags|nwt|new\b/.test(text)) return "New or retail listing language visible";
  if (/\bused|preowned|pre-owned|vintage|antique\b/.test(text)) return "Used/vintage listing language visible";
  if (/\bdamaged|cracked|chips?|repair|parts only\b/.test(text)) return "Condition issue language visible";
  return "";
}

function classifySerperAcquisitionStage({ providerCallsSucceeded = 0, providerSourceCount = 0, normalizedCandidateCount = 0, retainedVisibleResultCount = 0, rejectedCandidateCount = 0, providerErrors = [] } = {}) {
  if (retainedVisibleResultCount > 0) return "none";
  if (!providerCallsSucceeded) {
    return providerErrors[0]?.category || "serper_provider_error";
  }
  if (providerSourceCount === 0) return "serper_zero_results";
  if (normalizedCandidateCount === 0) return "normalization_failure";
  if (rejectedCandidateCount > 0 || normalizedCandidateCount > 0) return "filtering_failure";
  return "unknown";
}

function buildSerperSearchDiagnostics({ sourceRoute = [], searchQueries = [], queriesPrioritized = [], providerRequestRecords = [], providerResponseSummaries = [], providerErrors = [], records = [], providerSourceCount = 0, retainedVisibleResultCount = 0, rejectedCandidateCount = 0, acquisitionFailureStage = "unknown", elapsedMs = 0, liveSearchStatus = "", identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "" } = {}) {
  const context = buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const retailDiagnostics = buildRetailSearchDiagnostics({
    context,
    providerRequestRecords,
    records,
    searchQueries
  });
  const providerCallsAttempted = providerRequestRecords.filter((record) => record.attempted).length;
  const providerCallsSucceeded = providerRequestRecords.filter((record) => record.succeeded).length;
  const invalidQueryPreflightCount = providerRequestRecords.filter((record) => record.validationPassed === false || record.failureStage === "invalid_query_preflight").length;
  const organicResultCount = providerRequestRecords.reduce((sum, record) => sum + Number(record.organicResultCount || 0), 0);
  const shoppingResultCount = providerRequestRecords.reduce((sum, record) => sum + Number(record.shoppingResultCount || 0), 0);
  const pricedCandidateCount = records.filter((record) => Number.isFinite(getVisibleItemPriceAmount(serperRecordToVisibleResearchRecord(record)))).length;
  const compatiblePricedCandidateCount = records.filter((record) => isStrongComparableEvidenceRecord(record)).length;
  const noPriceIdentityReferenceCount = records.filter((record) => isNoPriceIdentityReference(record)).length;
  const rejectedMismatchCount = records.filter((record) => /Rejected|Weak/i.test(record.identityMatchStrength) || /mismatch|incompatible/i.test(record.rejectionReason || record.itemTypeCompatibilityStatus || "")).length;
  const recoverySearchPassesAttempted = providerRequestRecords
    .filter((record) => record.attempted && /recovery/i.test(record.searchPass || ""))
    .map((record) => record.searchPass);
  const droppedResultReasons = normalizeDropReasons(records
    .filter((record) => record.rejectionReason)
    .map((record) => record.rejectionReason));
  return {
    queriesGenerated: searchQueries,
    queriesPrioritized,
    queriesActuallySent: providerRequestRecords.filter((record) => record.attempted).map((record) => record.query),
    queryTransmissionMode: "query_bound_serper_requests",
    executionLimitation: "Each prioritized query was sent server-side to Serper Google Search. Provider results are source-backed Google result records; only retained exact, strong, partial, or reference records are shown as visible evidence.",
    queryCount: searchQueries.length,
    sourceCategoriesTargeted: buildSourcesTargeted(sourceRoute),
    ...retailDiagnostics,
    allowedDomainsRequested: collectMarketplaceDomainsRequested(providerRequestRecords),
    searchProviderUsed: "Serper Google Search",
    providerKey: "serper_google",
    serperConfigured: true,
    sourcesRequested: buildSourcesTargeted(sourceRoute),
    sourcesActuallyQueried: providerCallsAttempted ? ["Serper Google Search"] : [],
    sourceRoute,
    providerCallsAttempted,
    providerCallsSucceeded,
    invalidQueryPreflightCount,
    serperCallsAttempted: providerCallsAttempted,
    serperCallsSucceeded: providerCallsSucceeded,
    providerSourceCount,
    organicResultCount,
    shoppingResultCount,
    domainsActuallyReturned: summarizeSourceLabels(records.map((record) => record.domain).filter(Boolean)),
    sourceURLsReturned: [...new Set(records.map((record) => record.url).filter(Boolean))].slice(0, 50),
    providerErrors: providerErrors.map(sanitizeProviderErrorSummary),
    providerRequestRecords: providerRequestRecords.map(sanitizeProviderRequestRecord),
    queryCandidateDiagnostics: providerRequestRecords.map(sanitizeProviderRequestRecord),
    providerResponseSummaries: providerResponseSummaries.map(sanitizeProviderResponseSummary),
    providerSourceRecords: records.map(serperRecordToVisibleResearchRecord).slice(0, 50),
    rawResultCount: providerSourceCount,
    parsedCandidateCount: providerSourceCount,
    normalizedCandidateCount: records.length,
    deduplicatedCandidateCount: records.length,
    exactCandidateCount: records.filter((record) => /^Exact\b/i.test(record.identityMatchStrength || "")).length,
    strongSimilarCandidateCount: records.filter((record) => /Strong Similar/i.test(record.identityMatchStrength || "")).length,
    pricedCandidateCount,
    compatiblePricedCandidateCount,
    noPriceIdentityReferenceCount,
    rejectedMismatchCount,
    compatiblePricedRecoveryThreshold: 3,
    recoverySearchPassesAttempted: [...new Set(recoverySearchPassesAttempted)],
    visibleRetainedResultCount: retainedVisibleResultCount,
    retainedVisibleResultCount,
    rejectedCandidateCount,
    rejectedResultCount: rejectedCandidateCount,
    droppedResultReasons,
    queryResultsSummary: buildQueryResultsSummary({
      searchQueries,
      queriesActuallySent: providerRequestRecords.filter((record) => record.attempted).map((record) => record.query),
      queryTransmissionMode: "query_bound_serper_requests",
      retainedVisibleResultCount,
      providerErrors,
      providerRequestRecords
    }),
    fallbackProviderUsed: false,
    acquisitionFailureStage,
    safeRawResults: [],
    sourcesSearched: providerCallsAttempted ? ["Serper Google Search"] : [],
    sourcesReturned: summarizeSourceLabels(records.map((record) => record.domain || record.title || record.url)),
    elapsedMilliseconds: elapsedMs,
    liveSearchStatus
  };
}

function buildRetailSearchDiagnostics({ context = {}, providerRequestRecords = [], records = [], searchQueries = [] } = {}) {
  const retailSpecificQueries = normalizeStringArray(searchQueries, 24)
    .filter((query) => isRetailSpecificQuery(query, context))
    .slice(0, 12);
  const retailEvidenceMode = context.retailEvidenceMode || "collectible-resale";
  const retailRouteClassification = context.retailRouteClassification || "";
  const storeName = context.storeName || context.retailerOrMarketplaceName;
  const namedStoreRequests = providerRequestRecords.filter((record) => storeName && cleanText(record.query).toLowerCase().includes(storeName.toLowerCase()));
  const upcRequests = providerRequestRecords.filter((record) => context.barcodeDigits && cleanText(record.query).includes(context.barcodeDigits));
  const storeReturned = records.some((record) => storeName && [
    record.domain,
    record.title,
    record.snippet,
    record.url
  ].join(" ").toLowerCase().includes(storeName.toLowerCase()));
  const exactUpcFound = records.some((record) => context.barcodeDigits && [
    record.title,
    record.snippet,
    record.url,
    record.query
  ].join(" ").includes(context.barcodeDigits));
  const packMismatchRecords = records.filter((record) => /pack_quantity_mismatch/i.test(record.itemTypeCompatibilityStatus || record.rejectionReason || ""));
  const unsupportedRejected = normalizeStringArray(context.unsupportedIdentityTerms, 24);
  const allQueryRecords = providerRequestRecords.length
    ? providerRequestRecords
    : normalizeStringArray(searchQueries, 24).map((query) => ({ query, validationPassed: true }));
  const suppressedQueryRecords = allQueryRecords.filter((record) => /retail_forbidden_secondary_market_terms/i.test(record.validationFailureReason || "") || isRetailForbiddenSecondaryEvidenceText(record.rawCandidate || record.query));
  const currentRetailAccepted = records.filter((record) => isQualifiedCurrentRetailSourceRecord(record, context));
  const retailRejected = records.filter((record) => !currentRetailAccepted.includes(record) && (
    isRetailForbiddenSecondaryEvidenceText([record.title, record.snippet, record.rawText, record.url, record.priceType, record.priceEvidenceType].join(" "))
    || !isQualifiedCurrentRetailSourceRecord(record, context)
  ));
  const retailStageRecords = providerRequestRecords.filter((record) => record.retailStage);
  const retailQueriesPlanned = retailStageRecords.map((record) => ({
    stage: cleanText(record.retailStageLabel || record.retailStage),
    query: cleanText(record.query),
    attempted: Boolean(record.attempted),
    succeeded: Boolean(record.succeeded),
    providerSourceCount: Number(record.providerSourceCount || 0),
    organicResultCount: Number(record.organicResultCount || 0),
    shoppingResultCount: Number(record.shoppingResultCount || 0)
  }));
  const retailQueriesExecuted = retailQueriesPlanned.filter((record) => record.attempted);
  const retailStagesPlanned = [...new Set(retailQueriesPlanned.map((record) => record.stage).filter(Boolean))];
  const retailStagesAttempted = [...new Set(retailQueriesExecuted.map((record) => record.stage).filter(Boolean))];
  const pricedRecords = records.filter((record) => Number.isFinite(getVisibleItemPriceAmount(record)));
  const compatibilityReviews = records.map((record) => ({
    record,
    compatibility: classifyRetailSourceRecordCompatibility(record, context)
  }));
  const exactRetailMatchCount = compatibilityReviews.filter((item) => item.compatibility.label === "Exact Retail Match").length;
  const strongRetailAlternativeCount = compatibilityReviews.filter((item) => item.compatibility.label === "Strong Retail Alternative").length;
  const unitPriceComparableCount = compatibilityReviews.filter((item) => item.compatibility.label === "Unit-Price Comparable").length;
  const retailCategoryContextCount = compatibilityReviews.filter((item) => item.compatibility.label === "Retail Category Context").length;
  const rejectedRetailMismatchCount = compatibilityReviews.filter((item) => item.compatibility.label === "Rejected Retail Mismatch").length;
  const stage1AcceptedCount = currentRetailAccepted.filter((record) => /stage_1_exact_identity/i.test(record.searchPass || "")).length;
  const resaleSuppressed = context.retailStoreContext || context.onlineRetailerContext
    ? normalizeStringArray(searchQueries, 24).every((query) => !isRetailForbiddenSecondaryEvidenceText(query))
    : false;
  const locationState = cleanText(context.locationState);
  const locationDeniedManualZip = /permission-denied|denied/i.test(`${locationState} ${context.locationPermission} ${context.locationMode}`) && Boolean(context.locationZip);
  const locationUnavailable = /position-unavailable|timeout|unsupported|insecure-context|reverse-geocode-failed|skipped/i.test(locationState);

  return {
    retailEvidenceMode,
    retailRouteClassification,
    retailProviderCallBudget: retailSerperBudgetAllocation,
    retailRecoveryTrigger: isCurrentRetailOnlyMode(retailEvidenceMode)
      ? stage1AcceptedCount < 3
        ? `Stage 1 produced ${stage1AcceptedCount} usable current retail record${stage1AcceptedCount === 1 ? "" : "s"}; reduced-product, compatible-alternative, retailer-specific, and shopping/general recovery stages were included within the bounded retail budget.`
        : "Stage 1 produced at least three usable current retail records; recovery records may still appear only if already inside the bounded staged plan."
      : "",
    retailStagesPlanned,
    retailStagesAttempted,
    retailQueriesPlanned,
    retailQueriesExecuted,
    retailProviderCallsUsed: retailQueriesExecuted.length,
    retailSearchBudgetRemaining: Math.max(0, retailSerperBudgetAllocation.maxProviderCalls - retailQueriesExecuted.length),
    retailRecoveryStoppedReason: isCurrentRetailOnlyMode(retailEvidenceMode)
      ? retailQueriesExecuted.length >= retailSerperBudgetAllocation.maxProviderCalls
        ? "Bounded retail provider-call budget reached."
        : "All planned bounded retail stages were executed or rejected by local preflight validation."
      : "",
    recordsWithVisiblePrices: pricedRecords.length,
    recordsRejectedBeforeCompatibilityReview: providerRequestRecords.filter((record) => record.validationPassed === false).length,
    recordsRejectedByCompatibilityReview: retailRejected.length,
    compatibleAlternativesAccepted: currentRetailAccepted.length,
    exactRetailMatchCount,
    strongRetailAlternativeCount,
    unitPriceComparableCount,
    retailCategoryContextCount,
    rejectedRetailMismatchCount,
    retailRejectionReasons: normalizeDropReasons(retailRejected.map((record) => {
      if (isRetailForbiddenSecondaryEvidenceText([record.title, record.snippet, record.rawText, record.url, record.priceType, record.priceEvidenceType].join(" "))) {
        return "secondary_market_or_reference_evidence";
      }
      return classifyRetailSourceRecordCompatibility(record, context).reason || record.rejectionReason || record.itemTypeCompatibilityExplanation || "retail_compatibility_filter";
    })),
    queriesSuppressed: isCurrentRetailOnlyMode(retailEvidenceMode)
      ? "sold/auction/historical/collector/resale terms suppressed for current-retail-only evidence mode"
      : "",
    currentRetailCandidatesAccepted: currentRetailAccepted.map((record) => ({
      title: cleanText(record.title),
      source: cleanText(record.source || record.domain || inferSourceFromResult(record.rawText, record.url)),
      url: cleanText(record.url),
      displayedPrice: cleanText(record.displayedPrice || record.displayedPriceText || record.price),
      retailEvidenceLabel: "Current retail candidate accepted"
    })).slice(0, 12),
    currentRetailCandidatesRejected: retailRejected.map((record) => ({
      title: cleanText(record.title),
      source: cleanText(record.source || record.domain || inferSourceFromResult(record.rawText, record.url)),
      url: cleanText(record.url),
      displayedPrice: cleanText(record.displayedPrice || record.displayedPriceText || record.price),
      reason: isRetailForbiddenSecondaryEvidenceText([record.title, record.snippet, record.rawText, record.url, record.priceType, record.priceEvidenceType].join(" "))
        ? "Excluded from retail decision as secondary-market, auction, sold, historical, guide, reference, or resale evidence."
        : cleanText(record.rejectionReason || record.itemTypeCompatibilityExplanation || "Did not pass current retail source/package/identity checks.")
    })).slice(0, 12),
    referenceSecondaryEvidenceExcludedFromRetailDecision: retailRejected
      .filter((record) => isRetailForbiddenSecondaryEvidenceText([record.title, record.snippet, record.rawText, record.url, record.priceType, record.priceEvidenceType].join(" ")))
      .length,
    canonicalProductIdentity: context.canonicalProductIdentity || null,
    finalizedSearchIdentity: context.finalizedSearchIdentity || context.canonicalCustomerTitle || "",
    canonicalIdentityConfidence: context.canonicalIdentityConfidence || "",
    conflictingCandidatesRejected: context.conflictingCandidatesRejected || [],
    unsupportedQueryTermsRejected: unsupportedRejected,
    retailQueryIntegrity: {
      exactUpcQueryAttempted: context.barcodeDigits ? upcRequests.some((record) => cleanText(record.query) === context.barcodeDigits && record.attempted) : false,
      storeUpcQueryAttempted: context.barcodeDigits && storeName ? upcRequests.some((record) => cleanText(record.query).toLowerCase().includes(storeName.toLowerCase()) && record.attempted) : false,
      retailerDomainQueryAttempted: context.retailerDomain ? providerRequestRecords.some((record) => cleanText(record.query).toLowerCase().includes(`site:${context.retailerDomain}`) && record.attempted) : false,
      namedStoreQueriesGenerated: namedStoreRequests.length,
      resaleQueriesSuppressed: resaleSuppressed,
      suppressedSecondaryMarketQueryCount: suppressedQueryRecords.length,
      unsupportedQueryTermsRejected: unsupportedRejected
    },
    purchaseContext: context.purchaseContext || "",
    storeName: storeName || "",
    locationModeUsed: context.locationMode || "",
    locationStateUsed: locationState || "",
    locationLookupOutcome: locationDeniedManualZip
      ? `Location permission was not granted. ZIP ${context.locationZip} was entered manually.`
      : context.locationArea ? `General area resolved: ${context.locationArea}` : locationUnavailable ? `Location fallback used: ${locationState}` : context.locationMode || "not requested",
    zipPresence: context.locationZip ? "ZIP provided" : "ZIP not provided",
    manualZipUsed: locationDeniedManualZip ? `Manual ZIP used: ${context.locationZip}` : "",
    browserCoordinatesDisplayed: "No",
    barcodeExtractionStatus: context.barcodeDigits
      ? "Barcode/UPC digits available"
      : context.barcodeReadStatus === "unreadable"
        ? "Barcode visible but unreadable"
        : context.barcodeReadStatus || "unknown",
    exactBarcodeDigitsUsed: context.barcodeDigits || "",
    retailSpecificQueries,
    namedStoreQueryResults: storeName
      ? `${namedStoreRequests.filter((record) => record.attempted).length} named-store quer${namedStoreRequests.length === 1 ? "y" : "ies"} attempted; named-store result ${storeReturned ? "returned" : "not returned"}.`
      : "No named store supplied.",
    exactUpcQueryResults: context.barcodeDigits
      ? `${upcRequests.filter((record) => record.attempted).length} UPC quer${upcRequests.length === 1 ? "y" : "ies"} attempted; exact UPC result ${exactUpcFound ? "found" : "not found"}.`
      : "No exact barcode/UPC digits available.",
    packSizeMatchDetails: context.packageQuantity || context.packageSize
      ? `Submitted package clues: ${compactWords([context.packageQuantity, context.packageSize]) || "not established"}.`
      : "Submitted package size/count not established.",
    rejectedPackSizeMismatches: packMismatchRecords.map((record) => cleanText(record.rejectionReason || record.itemTypeCompatibilityExplanation)).filter(Boolean).slice(0, 8),
    localSourceCoverage: context.locationZip
      ? "ZIP was supplied for nearby/local price context. Inventory availability must still be source-backed."
      : /browser_location/.test(context.locationMode)
        ? "Browser location was approved for general local context; precise coordinates are not stored or displayed."
        : "No ZIP or approved location supplied; nearby price and availability coverage is limited."
  };
}

function classifyRetailSourceRecordCompatibility(record = {}, context = {}) {
  const fakeIdentity = {
    packageQuantity: context.packageQuantity,
    unitCount: context.packageQuantity,
    packageSize: context.packageSize,
    productNameOrBoxTitle: context.productTitle,
    exactProductIdentity: context.exactProductIdentity,
    subjectIdentity: context.subjectIdentity,
    category: context.itemType,
    likelyItemDescription: context.subjectIdentity,
    brand: context.brand || context.visualBrand,
    manufacturer: context.manufacturer,
    upcBarcode: context.barcodeDigits || context.upc,
    sku: context.itemCode,
    model: context.model
  };
  const fakeIntake = normalizeBuyerIntake({
    purchase_context: context.purchaseContext,
    item_name: context.productTitle || context.subjectIdentity || context.itemType,
    buyer_notes: context.notesText,
    known_brand: context.brand || context.visualBrand,
    known_sku: context.itemCode,
    known_model: context.model,
    known_upc: context.barcodeDigits || context.upc
  });
  return classifyRetailPackageCompatibility(record, fakeIdentity, fakeIntake);
}

function isRetailSpecificQuery(query, context = {}) {
  const text = cleanText(query).toLowerCase();
  return Boolean(
    (context.barcodeDigits && text.includes(context.barcodeDigits))
    || (context.storeName && text.includes(context.storeName.toLowerCase()))
    || (context.retailerDomain && text.includes(context.retailerDomain.toLowerCase()))
    || /\bcurrent retail|shopping|replacement cost|manufacturer price|nearby price|pickup\b/.test(text)
  );
}

function collectMarketplaceDomainsRequested(providerRequestRecords = []) {
  const domains = [];
  for (const record of providerRequestRecords) {
    for (const domain of normalizeStringArray(record.marketplaceDomainsRequested || record.allowedDomainsRequested || record.allowedDomains, 12)) {
      addUnique(domains, domain);
    }
  }
  return domains.slice(0, 24);
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
              "Return every source-backed result reviewed in the correct visibility bucket: strongComparables, partialComparables, itemIdentificationEvidence, referenceResults, weakMatches, or rejectedMatches.",
              "Exact identity matches without a usable visible price belong in itemIdentificationEvidence, not strongComparables.",
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
    const cleaned = finalizeSearchQueryCandidate(query, context, 12);
    if (cleaned && !isInternalPromptFragment(cleaned) && !isRepetitiveQuery(cleaned, cleanedQueries)) {
      cleanedQueries.push(cleaned);
    }
  }

  const exactQueries = cleanedQueries.filter((query) => isHighValueExactQuery(query, context));
  const marketplaceSeedQueries = cleanedQueries.filter((query) => isMarketplaceUsefulQuery(query, context));
  const fallbackQueries = cleanedQueries.filter((query) => !exactQueries.includes(query));
  const records = [];

  const addRecord = ({ query, searchPass, allowedDomains = [] }) => {
    const finalQuery = finalizeSearchQueryCandidate(query, context, allowedDomains.length ? 18 : 12);
    const domainKey = allowedDomains.join("|").toLowerCase();
    if (!finalQuery || records.some((record) => (
      queriesAreSemanticallySame(record.query, finalQuery)
        && (record.allowedDomains || []).join("|").toLowerCase() === domainKey
    ))) {
      return;
    }
    records.push({
      query: finalQuery,
      priority: records.length + 1,
      searchPass,
      sourceRoute: sourceCategories,
      allowedDomains
    });
  };

  if (context.retailStoreContext || context.onlineRetailerContext) {
    const retailQueries = buildRetailContextSearchQueries(context).slice(0, 6);
    retailQueries.slice(0, 3).forEach((query) => {
      addRecord({ query, searchPass: "open_web_exact" });
    });
    if (marketplaceDomains.length) {
      retailQueries.slice(0, 3).forEach((query) => {
        addRecord({ query, searchPass: "retail_store_domain", allowedDomains: marketplaceDomains });
      });
    }
  }

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

  if (isRetailStorePurchaseContext(buyerIntake.purchase_context) || context.retailStoreContext) {
    return mergeStringArrays(
      getRetailerDomainForStore(getRetailStoreName(buyerIntake)),
      ["walmart.com", "target.com", "staples.com", "officedepot.com", "kroger.com", "amazon.com", "homedepot.com", "lowes.com", "dollargeneral.com"],
      8
    );
  }
  if (isOnlineRetailerPurchaseContext(buyerIntake.purchase_context) || context.onlineRetailerContext) {
    return mergeStringArrays(
      getRetailerDomainForStore(firstKnown(buyerIntake.retailer_or_marketplace_name, buyerIntake.store_name)),
      ["amazon.com", "walmart.com", "target.com", "bestbuy.com"],
      6
    );
  }
  if (isResaleMarketplacePurchaseContext(buyerIntake.purchase_context) || context.resaleMarketplaceContext) {
    return ["ebay.com", "etsy.com", "mercari.com"];
  }
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
  return sanitizeSearchQueryText(value)
    .toLowerCase()
    .replace(/site:[A-Za-z0-9.-]+/gi, "")
    .replace(/["'â€™]/g, "")
    .replace(/\b(?:the|and|with|for|official|collector'?s?|collectible|vintage|used|item|listing|price|resale|ebay|etsy|mercari|worthpoint|picclick)\b/g, "")
    .replace(/[()]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mergeLiveSearchResults(results = []) {
  const merged = {
    liveSearchStatus: "",
    comparableItemsFound: [],
    strongComparables: [],
    partialComparables: [],
    itemIdentificationEvidence: [],
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
    for (const key of ["comparableItemsFound", "strongComparables", "partialComparables", "itemIdentificationEvidence", "referenceResults", "weakMatches", "rejectedMatches", "sourcesSearched", "searchCoverage", "searchQueriesUsed"]) {
      merged[key].push(...normalizeStringArray(result?.[key], 24));
    }
    merged.noReliableMatchesReason = firstKnown(merged.noReliableMatchesReason, result?.noReliableMatchesReason);
    merged.searchEvidenceSummary = firstKnown(merged.searchEvidenceSummary, result?.searchEvidenceSummary);
  }

  for (const key of ["comparableItemsFound", "strongComparables", "partialComparables", "itemIdentificationEvidence", "referenceResults", "weakMatches", "rejectedMatches", "sourcesSearched", "searchCoverage", "searchQueriesUsed"]) {
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
    "The backend supplied a finalized Canonical Product Identity when available. Treat it as authoritative for customer-facing item title, search identity, matching, pricing, and recommendation wording. Rejected identity candidates may appear only as rejected diagnostics, not as active product identity.",
    "For Retail store purchase context, evaluate current retail replacement cost first. Use exact UPC/barcode, store name, current retailer price, manufacturer/current retail price, nearby competing retailer results, delivered/pickup context, and package/quantity compatibility before any resale/collectible logic.",
    "For ordinary current retail consumables, do not prioritize historical sold comps and do not call a price a confirmed good deal unless source-backed current retail comparisons support it.",
    "For ordinary current retail products, use Retail Evidence Mode: current-retail-only. Do not use auction, historical sold, guide, WorthPoint, PicClick, resale, thrift, flea-market, estate-sale, collector, or secondary-market evidence to establish customer-facing current retail value.",
    "For ordinary fixed-price retail-store purchases, do not show Opening Offer, negotiation target, offer ladder, market-supported maximum, personal-enjoyment exception, or Maximum Price Guard. Default to Store price is fixed unless the intake explicitly says the retail price is negotiable.",
    "For ordinary current retail products, show Current Retail Price: Not verified when no exact/strong qualified current retail source was found. Do not fabricate a retail range, named-store price, or competing retailer result.",
    "Use retail labels only for retail evidence: Exact Retail Match, Strong Retail Alternative, Unit-Price Comparable, Retail Category Context, or Rejected Retail Mismatch. Do not label ordinary retail results as Verified Sold, Reference Price, Auction Current Bid, Historical Sold Evidence, or Preliminary Reference Range.",
    "If the barcode could not be read and no manual UPC was supplied, tell the customer directly: The barcode could not be read clearly. Upload a closer photo of the barcode or enter the numbers manually.",
    "When no current retail comparisons are found for a retail-store purchase, use conditional labels such as Price Not Verified, Low-Risk Purchase - Limited Evidence, Reasonable Personal-Use Purchase - Current retail price not confirmed, or Wait for Retail Price Confirmation. Do not output an unconditional Buy paired with Insufficient Evidence or no compatible prices.",
    "For retail products, compare package price and unit price separately when quantity is explicit and compatible. Do not compare a 100-count box directly with a 25-count box as an exact match; use unit-price context only when product type, size, and specs are compatible.",
    "Local Store Context must include named store and ZIP/general area when supplied, current store price if found, pickup/availability only when source-backed, and 'Availability not confirmed' when inventory support is missing.",
    "Fill purchaseContextSummary, barcodeSearchStatus, localStoreContext, retailPriceContext, and packageUnitPriceContext. If a field does not apply, briefly say it is not applicable rather than inventing evidence.",
    "Next Best Action must ask for the specific missing retail identifier: closer barcode photo, manual UPC, store name, ZIP code, box size, pack count, quantity, model, or SKU.",
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
    systemText: "You are Katherine’s Eye, a careful consumer purchase decision assistant. Help everyday buyers decide whether an item is fairly priced for personal use. Return only the requested structured JSON.",
    userContent,
    schemaName: "consumer_purchase_decision",
    schema: consumerDecisionSchema
  });

  return (await requestOpenAIJson({ apiKey, payload })).json;
}

async function generateFinalMarketValueReport({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, liveSearch, buyerIntake }) {
  const ownerValue = isOwnerValueIntent(buyerIntake.purchase_intent);
  const platformContext = platform || (ownerValue
    ? "No specific marketplace selected. Use owner value logic across likely resale, local, collector, retail reference, and secondhand contexts."
    : "No specific marketplace selected. Use buyer-first market logic across retail, online, local, collector, resale, and secondhand contexts.");
  const resalePlatformContext = buildResalePlatformContext(platform, buyerIntake);
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const liveSearchInstruction = liveSearch.liveSearchStatus === "Live Search Completed - Source-Backed Comps Found"
    ? "Live comparable search was performed. Source-backed results are listed when reliable matches were found."
    : liveSearch.webSearchExecuted
      ? "Live comparable search completed with no reliable source-backed exact or strong similar comps. The remaining value range is AI market reasoning only and should be treated as low confidence."
      : "Live comparable search did not complete. The remaining value range is AI market reasoning only and should be treated as low confidence.";
  const taskText = [
    ownerValue ? "Create an owner value assessment, not a buying decision and not a marketplace listing draft." : "Create a buyer-first Worth Buying / Market Intelligence report, not a marketplace listing draft.",
    ownerValue ? "Primary question: What is this owned item worth based on supported evidence, condition, completeness, and likely selling venues?" : "Primary question: Should the user buy this item at this price, right now?",
    "Use Visual Subject Recognition first. Preserve what the photos strongly support even if exact product identity, comps, maker, date, licensing, authenticity, or valuation remain uncertain.",
    ownerValue ? "Use Guided Buyer Intake as ownership context. Do not require purchase location, seller/store asking price, opening offer, target purchase price, or walk-away price." : "Use Guided Buyer Intake as the current purchase opportunity. The asking price is the seller/store price right now, not automatic market value.",
    ownerValue ? "Include likely identification, value evidence, verified sold range when supported, active asking range when supported, preliminary reference range when only weaker evidence is available, value drivers, condition effects, recommended selling venues, confidence, and next best action." : "",
    "Separate broad subject identity from exact product identity. Preserve supported broad subject recognition even when maker, date, licensing, authenticity, and exact comparable are unverified.",
    "Do not let no exact comparable found erase a visually/user-supported subject identity; lower exact-product, comparable, and pricing confidence separately.",
    ownerValue ? "Do not confuse ownership context with platform: owner context describes the item the user already has; platform is where the user may sell it if they choose." : "Do not confuse purchase_context with platform: purchase_context is where the user is buying the item now; platform is where the user may later sell it.",
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
    systemText: ownerValue
      ? "You are Katherine’s Eye, an owner-value assessment assistant. Help people identify what they own, estimate supported value, and choose practical selling venues without inventing evidence. Return only the requested structured JSON."
      : "You are Katherine’s Eye, a buyer-first market intelligence assistant. Help shoppers, collectors, and resellers decide whether to buy an item right now. Return only the requested structured JSON.",
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
    barcodeReadStatus: normalizeBarcodeReadStatus(identity.barcodeReadStatus, identity.upcBarcode),
    barcodeFailureMessage: cleanText(identity.barcodeFailureMessage || ""),
    packageQuantity: cleanText(identity.packageQuantity || "Unknown") || "Unknown",
    packageSize: cleanText(identity.packageSize || "Unknown") || "Unknown",
    unitCount: cleanText(identity.unitCount || "Unknown") || "Unknown",
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

function finalizeIdentityForResearch(identity = {}, buyerIntake = normalizeBuyerIntake({})) {
  const canonicalProductIdentity = buildCanonicalProductIdentity(identity, buyerIntake);
  return applyCanonicalProductIdentity(identity, canonicalProductIdentity);
}

function buildCanonicalProductIdentity(identity = {}, buyerIntake = normalizeBuyerIntake({})) {
  const intake = normalizeBuyerIntake(buyerIntake);
  const upc = getSearchBarcodeDigits(identity, intake);
  const visiblePackageWording = compactWords([
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : "",
    identity.textIdentityEvidence
  ]);
  const strongEvidenceText = [
    upc,
    intake.known_upc_digits,
    intake.known_upc,
    intake.known_brand,
    intake.known_manufacturer,
    intake.known_model,
    intake.known_sku,
    intake.item_name,
    visiblePackageWording,
    identity.brand,
    identity.manufacturer,
    identity.productNameOrBoxTitle,
    identity.frontBoxWording,
    identity.backLabelWording,
    identity.manufacturerLocationText,
    identity.sku,
    identity.styleNumber,
    identity.model,
    identity.modelOrItemNumber,
    identity.packageQuantity,
    identity.packageSize,
    identity.unitCount,
    identity.dimensions,
    identity.size
  ].flat().map(cleanText).filter(Boolean).join(" ");
  const weakVisualText = [
    identity.visualSubject,
    identity.visualSubjectCategory,
    identity.subjectIdentity,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    identity.category,
    identity.exactProductIdentity,
    identity.visualRecognition?.visualSubject,
    identity.visualRecognition?.visualSubjectCategory,
    identity.visualRecognition?.possibleInterpretations,
    identity.visualRecognition?.distinctiveFeatures
  ].flat().map(cleanText).filter(Boolean).join(" ");
  const allEvidenceText = [strongEvidenceText, weakVisualText, intake.buyer_notes].join(" ");
  const categoryProfile = detectCanonicalCategoryProfile({ strongEvidenceText, weakVisualText, allEvidenceText, purchaseContext: intake.purchase_context });
  const brand = firstKnown(
    intake.known_brand,
    extractSupportedBrandFromEvidence(strongEvidenceText),
    supportedByEvidence(identity.brand, strongEvidenceText) ? identity.brand : "",
    supportedByEvidence(identity.recognizedBrand, strongEvidenceText) ? identity.recognizedBrand : "",
    identity.brand
  );
  const manufacturer = firstKnown(
    intake.known_manufacturer,
    supportedByEvidence(identity.manufacturer, strongEvidenceText) ? identity.manufacturer : "",
    brand
  );
  const sku = firstKnown(
    intake.known_sku,
    extractItemNumberFromEvidence(strongEvidenceText),
    identity.sku,
    identity.styleNumber,
    /^\d{8,14}$/.test(cleanText(identity.modelOrItemNumber)) ? "" : identity.modelOrItemNumber
  );
  const packageQuantity = firstKnown(
    extractPackQuantityText(strongEvidenceText),
    identity.packageQuantity,
    identity.unitCount
  );
  const dimensionsOrSize = firstKnown(identity.dimensions, identity.size, identity.packageSize);
  const closureOrVariant = extractRetailVariantFromEvidence(strongEvidenceText);
  const productName = buildCanonicalProductName({
    categoryProfile,
    brand,
    productTitle: firstKnown(intake.item_name, identity.productNameOrBoxTitle, identity.exactProductIdentity, identity.likelyItemDescription),
    evidenceText: strongEvidenceText,
    variant: closureOrVariant
  });
  const rejectedCandidates = buildRejectedCanonicalCandidates({
    identity,
    canonicalCategory: categoryProfile.categoryKey,
    strongEvidenceText,
    weakVisualText
  });
  const unresolvedConflicts = rejectedCandidates.filter((candidate) => candidate.status === "needs_confirmation");
  const supportedSourceList = buildCanonicalSourceList({ upc, visiblePackageWording, intake, identity });
  const confidence = buildCanonicalConfidence({ upc, productName, packageQuantity, sku, rejectedCandidates, unresolvedConflicts });
  const userConfirmationRequired = unresolvedConflicts.length > 0;
  const confirmationToken = buildCanonicalConfirmationToken({ productName, upc, sku, packageQuantity });
  const fields = {
    productName: createCanonicalField(productName, confidence, supportedSourceList, "accepted", "Final product name reconciled from the strongest barcode, package text, item-number, and user-entered evidence."),
    brand: createCanonicalField(brand, brand ? "High" : "Low", supportedSourceList, brand ? "accepted" : "unknown", brand ? "Brand is supported by package, typed, or identity evidence." : "Brand was not established."),
    manufacturer: createCanonicalField(manufacturer, manufacturer ? "Medium" : "Low", supportedSourceList, manufacturer ? "accepted" : "unknown", manufacturer ? "Manufacturer is supported by available evidence or aligned with brand." : "Manufacturer was not established."),
    category: createCanonicalField(categoryProfile.category, categoryProfile.confidence, categoryProfile.sources, "accepted", categoryProfile.reason),
    subcategory: createCanonicalField(categoryProfile.subcategory, categoryProfile.confidence, categoryProfile.sources, "accepted", categoryProfile.reason),
    UPC: createCanonicalField(upc, upc ? "High" : "Low", upc ? ["manual barcode/UPC or readable barcode"] : [], upc ? "accepted" : "unknown", upc ? "Exact UPC/barcode digits outrank visual inference." : "No exact UPC/barcode digits were available."),
    SKU: createCanonicalField(sku, sku ? "High" : "Low", sku ? ["SKU/item-number evidence"] : [], sku ? "accepted" : "unknown", sku ? "Item number/SKU is supported by visible or typed evidence." : "SKU/item number was not established."),
    packageQuantity: createCanonicalField(packageQuantity, packageQuantity ? "High" : "Low", packageQuantity ? ["package quantity wording"] : [], packageQuantity ? "accepted" : "unknown", packageQuantity ? "Package quantity is price-relevant for retail matching." : "Package quantity was not established."),
    dimensionsOrSize: createCanonicalField(dimensionsOrSize, dimensionsOrSize ? "Medium" : "Low", dimensionsOrSize ? ["size/dimensions evidence"] : [], dimensionsOrSize ? "accepted" : "unknown", dimensionsOrSize ? "Size or dimensions were preserved for matching." : "Size or dimensions were not established."),
    variant: createCanonicalField(closureOrVariant, closureOrVariant ? "Medium" : "Low", closureOrVariant ? ["visible package wording"] : [], closureOrVariant ? "accepted" : "unknown", closureOrVariant ? "Variant or closure type is price-relevant and supported." : "Variant was not established."),
    material: createCanonicalField(firstKnown(identity.material), hasKnownValue(identity.material) ? "Medium" : "Low", hasKnownValue(identity.material) ? ["material evidence"] : [], hasKnownValue(identity.material) ? "accepted" : "unknown", "Material is included only when supported."),
    color: createCanonicalField(firstKnown(identity.color), hasKnownValue(identity.color) ? "Medium" : "Low", hasKnownValue(identity.color) ? ["color evidence"] : [], hasKnownValue(identity.color) ? "accepted" : "unknown", "Color is included only when price-relevant and supported."),
    visiblePackageWording: createCanonicalField(visiblePackageWording, visiblePackageWording ? "High" : "Low", visiblePackageWording ? ["visible package/OCR text"] : [], visiblePackageWording ? "accepted" : "unknown", "Visible package wording is preserved as stronger evidence than broad visual inference."),
    purchaseContext: createCanonicalField(intake.purchase_context, intake.purchase_context ? "High" : "Low", intake.purchase_context ? ["guided buyer intake"] : [], intake.purchase_context ? "accepted" : "unknown", "Purchase context controls source routing."),
    storeName: createCanonicalField(getRetailStoreName(intake), getRetailStoreName(intake) ? "High" : "Low", getRetailStoreName(intake) ? ["guided buyer intake"] : [], getRetailStoreName(intake) ? "accepted" : "unknown", "Store name is used only for named-store search and diagnostics.")
  };

  const finalizedSearchIdentity = compactWords([
    canonicalFieldValue({ fields }, "brand"),
    canonicalFieldValue({ fields }, "productName"),
    canonicalFieldValue({ fields }, "variant"),
    canonicalFieldValue({ fields }, "packageQuantity"),
    canonicalFieldValue({ fields }, "SKU")
  ]);
  const customerFacingTitle = formatCanonicalCustomerTitle({ fields, productName, brand, packageQuantity, variant: closureOrVariant, sku, upc });

  return {
    fields,
    canonicalConfidence: confidence,
    evidenceSourcesUsed: supportedSourceList,
    conflictingCandidatesRejected: rejectedCandidates,
    unsupportedTermsRejected: buildUnsupportedTermsFromRejectedCandidates(rejectedCandidates),
    userConfirmationRequired,
    confirmationToken,
    finalizedSearchIdentity,
    customerFacingTitle,
    localSearchLocation: cleanText(intake.location_zip || intake.location_area),
    locationMethod: cleanText(intake.location_mode || (intake.location_zip ? "manual_zip" : "")),
    reason: userConfirmationRequired
      ? "Material identity conflict could not be resolved without user confirmation."
      : "Canonical identity finalized from the strongest available evidence before search."
  };
}

function createCanonicalField(value, confidence, sources = [], status = "accepted", reason = "") {
  return {
    value: cleanText(value),
    confidence: cleanText(confidence || "Low"),
    sources: normalizeStringArray(sources, 8),
    status: cleanText(status || "accepted"),
    reason: cleanText(reason)
  };
}

function canonicalFieldValue(canonicalProductIdentity = {}, fieldName) {
  const field = canonicalProductIdentity.fields?.[fieldName];
  return cleanText(field && typeof field === "object" ? field.value : canonicalProductIdentity[fieldName]);
}

function supportedByEvidence(value, evidenceText) {
  const text = cleanText(value);
  if (!text || !hasKnownValue(text)) {
    return false;
  }
  return cleanText(evidenceText).toLowerCase().includes(text.toLowerCase());
}

function detectCanonicalCategoryProfile({ strongEvidenceText = "", weakVisualText = "", allEvidenceText = "", purchaseContext = "" } = {}) {
  const strong = cleanText(strongEvidenceText).toLowerCase();
  const all = cleanText(allEvidenceText).toLowerCase();
  const sources = strong ? ["barcode/package/OCR/user evidence"] : ["visual/user evidence"];

  if (/\bsecurity envelopes?\b|strip\s*&?\s*seal|#?\s*10\s+envelopes?|\benvelopes?\b|stationery/.test(strong || all)) {
    return {
      categoryKey: "envelopes",
      category: "Office supplies",
      subcategory: /\bsecurity envelopes?\b|strip\s*&?\s*seal/.test(strong || all) ? "Security envelopes" : "Envelopes",
      confidence: strong ? "High" : "Medium",
      sources,
      reason: "Envelope/package wording is stronger than broad visual inference."
    };
  }
  if (/mug|cup/.test(strong || all)) {
    return { categoryKey: "mug", category: "Drinkware", subcategory: "Mug", confidence: strong ? "High" : "Medium", sources, reason: "Mug wording or visual evidence was detected." };
  }
  if (/planter|plant pot/.test(strong || all)) {
    return { categoryKey: "planter", category: "Home and garden", subcategory: "Planter", confidence: strong ? "High" : "Medium", sources, reason: "Planter wording or visual evidence was detected." };
  }
  if (/ornament/.test(strong || all)) {
    return { categoryKey: "ornament", category: "Holiday decor", subcategory: "Ornament", confidence: strong ? "High" : "Medium", sources, reason: "Ornament evidence was detected." };
  }
  if (/figurine|figure/.test(strong || all)) {
    return { categoryKey: "figurine", category: "Decor", subcategory: "Figurine", confidence: strong ? "High" : "Medium", sources, reason: "Figurine evidence was detected." };
  }
  if (/poster|print|artwork|illustration/.test(strong || weakVisualText)) {
    return { categoryKey: "poster_print", category: "Wall art", subcategory: "Poster print", confidence: strong ? "Medium" : "Low", sources, reason: "Poster/print evidence was detected, but it must not override stronger product evidence." };
  }
  if (isRetailStorePurchaseContext(purchaseContext) || isOnlineRetailerPurchaseContext(purchaseContext)) {
    return { categoryKey: "retail_product", category: "Current retail product", subcategory: "Retail item", confidence: "Medium", sources, reason: "Retail purchase context was provided." };
  }
  return { categoryKey: "unknown", category: "Unknown", subcategory: "Unknown", confidence: "Low", sources: [], reason: "No strong category evidence was established." };
}

function extractSupportedBrandFromEvidence(text) {
  const source = cleanText(text);
  const knownBrands = [
    "Office Works",
    "Staples",
    "Avery",
    "Scotch",
    "Pen+Gear",
    "Mead",
    "Up & Up",
    "Great Value",
    "Kroger",
    "Target",
    "Walmart"
  ];
  return knownBrands.find((brand) => source.toLowerCase().includes(brand.toLowerCase())) || "";
}

function extractItemNumberFromEvidence(text) {
  const source = cleanText(text);
  const labeled = source.match(/\b(?:item|item\s*number|sku|style|model|no\.?)\s*[:#]?\s*([A-Z0-9-]{4,18})\b/i);
  if (labeled) {
    return labeled[1];
  }
  return "";
}

function extractRetailVariantFromEvidence(text) {
  const source = cleanText(text);
  if (/strip\s*&\s*seal|strip\s+and\s+seal|strip\s*seal/i.test(source)) {
    return "Strip & Seal";
  }
  if (/peel\s*&\s*seal|peel\s+and\s+seal/i.test(source)) {
    return "Peel & Seal";
  }
  if (/self[-\s]?seal/i.test(source)) {
    return "Self-Seal";
  }
  if (/gummed/i.test(source)) {
    return "Gummed";
  }
  return "";
}

function buildCanonicalProductName({ categoryProfile = {}, brand = "", productTitle = "", evidenceText = "", variant = "" } = {}) {
  if (categoryProfile.categoryKey === "envelopes") {
    const envelopeType = /\bsecurity envelopes?\b/i.test(evidenceText) ? "Security Envelopes" : "Envelopes";
    return compactWords([brand, envelopeType, variant]);
  }
  return firstKnown(productTitle, compactWords([brand, categoryProfile.subcategory]), categoryProfile.subcategory, categoryProfile.category);
}

function buildRejectedCanonicalCandidates({ identity = {}, canonicalCategory = "", strongEvidenceText = "", weakVisualText = "" } = {}) {
  const rejected = [];
  const strong = cleanText(strongEvidenceText).toLowerCase();
  const weak = cleanText(weakVisualText).toLowerCase();
  const addRejected = (value, reason, status = "rejected") => {
    const text = cleanText(value);
    if (!text || rejected.some((candidate) => candidate.value.toLowerCase() === text.toLowerCase())) return;
    rejected.push({
      value: text,
      confidence: status === "needs_confirmation" ? "Medium" : "Low",
      sources: ["lower-priority visual inference"],
      status,
      reason
    });
  };

  const productConflicts = [
    { term: "poster print", pattern: /\bposter\s+print\b|poster|print|artwork|illustration/, conflictsWith: ["envelopes"], reason: "Conflicts with stronger barcode, OCR/package, and item-number evidence for envelopes." },
    { term: "planter", pattern: /\bplanter|plant pot\b/, conflictsWith: ["mug"], reason: "Conflicts with stronger mug/product evidence." },
    { term: "mug", pattern: /\bmug|cup\b/, conflictsWith: ["planter"], reason: "Conflicts with stronger planter/product evidence." },
    { term: "ornament", pattern: /\bornament\b/, conflictsWith: ["figurine"], reason: "Conflicts with stronger figurine/product evidence." },
    { term: "figurine", pattern: /\bfigurine|figure\b/, conflictsWith: ["ornament"], reason: "Conflicts with stronger ornament/product evidence." },
    { term: "plain envelopes", pattern: /\bplain envelopes?\b/, conflictsWith: ["envelopes"], reason: "Security-envelope evidence is stronger than generic plain-envelope wording." }
  ];

  for (const conflict of productConflicts) {
    if (conflict.pattern.test(weak) && conflict.conflictsWith.includes(canonicalCategory) && !conflict.pattern.test(strong)) {
      addRejected(conflict.term, conflict.reason);
    }
  }

  if (!canonicalCategory || canonicalCategory === "unknown") {
    const visualCategories = productConflicts.filter((conflict) => conflict.pattern.test(weak)).map((conflict) => conflict.term);
    if (visualCategories.length > 1) {
      addRejected(visualCategories.join(" / "), "Multiple material identity candidates were present and stronger evidence did not resolve the conflict.", "needs_confirmation");
    }
  }

  return rejected.slice(0, 8);
}

function buildUnsupportedTermsFromRejectedCandidates(rejectedCandidates = []) {
  const terms = [];
  for (const candidate of rejectedCandidates) {
    const value = cleanText(candidate.value).toLowerCase();
    if (!value) continue;
    addUnique(terms, value);
    if (/poster|print|artwork|illustration/.test(value)) {
      ["poster print", "poster", "print", "artwork", "illustration"].forEach((term) => addUnique(terms, term));
    }
    if (/plain envelopes?/.test(value)) {
      addUnique(terms, "plain envelope");
      addUnique(terms, "plain envelopes");
    }
  }
  return terms.slice(0, 20);
}

function buildCanonicalSourceList({ upc = "", visiblePackageWording = "", intake = {}, identity = {} } = {}) {
  const sources = [];
  if (normalizeBarcodeDigits(intake.known_upc) || normalizeBarcodeDigits(intake.known_upc_digits)) addUnique(sources, "manually entered barcode/UPC");
  if (normalizeBarcodeDigits(identity.upcBarcode) || upc) addUnique(sources, "barcode/UPC evidence");
  if (visiblePackageWording) addUnique(sources, "visible package/OCR wording");
  if (intake.known_sku || identity.sku || identity.styleNumber || identity.modelOrItemNumber) addUnique(sources, "SKU/item-number evidence");
  if (intake.item_name || intake.known_brand || intake.buyer_notes) addUnique(sources, "user-entered buyer details");
  if (intake.purchase_context) addUnique(sources, "purchase context");
  if (getRetailStoreName(intake)) addUnique(sources, "store name");
  return sources.slice(0, 10);
}

function buildCanonicalConfidence({ upc = "", productName = "", packageQuantity = "", sku = "", rejectedCandidates = [], unresolvedConflicts = [] } = {}) {
  if (unresolvedConflicts.length) {
    return "Low - material identity conflict requires user confirmation.";
  }
  if (upc && productName && (packageQuantity || sku)) {
    return rejectedCandidates.length
      ? "High - stronger barcode/package evidence resolved lower-priority visual conflict."
      : "High - barcode/package evidence supports the product identity.";
  }
  if (productName && (packageQuantity || sku || upc)) {
    return "Medium - product identity has useful identifiers but should still be verified.";
  }
  return "Low - product identity needs stronger barcode, label, SKU, or package evidence.";
}

function buildCanonicalConfirmationToken({ productName = "", upc = "", sku = "", packageQuantity = "" } = {}) {
  return cleanText([productName, upc, sku, packageQuantity].filter(Boolean).join("|")).toLowerCase().replace(/[^a-z0-9|]+/g, "-").slice(0, 160);
}

function identityConfirmationMatches(buyerIntake = normalizeBuyerIntake({}), canonicalProductIdentity = {}) {
  const supplied = cleanText(buyerIntake.identity_confirmation);
  if (!supplied) {
    return false;
  }
  return supplied === canonicalProductIdentity.confirmationToken || /^(yes|confirmed|confirm)$/i.test(supplied);
}

function createIdentityConfirmationRequiredError(canonicalProductIdentity = {}) {
  const mostLikely = [
    canonicalFieldValue(canonicalProductIdentity, "productName"),
    canonicalFieldValue(canonicalProductIdentity, "packageQuantity"),
    canonicalFieldValue(canonicalProductIdentity, "UPC") ? `UPC ${canonicalFieldValue(canonicalProductIdentity, "UPC")}` : ""
  ].filter(Boolean).join("\n");
  const rejected = normalizeArray(canonicalProductIdentity.conflictingCandidatesRejected)
    .map((candidate) => cleanText(candidate.value))
    .filter(Boolean);
  const error = new Error("We found conflicting product details. Confirm the item before research continues.");
  error.identityConfirmationRequired = true;
  error.confirmation = {
    message: "We found conflicting product details.",
    mostLikelyItem: mostLikely || canonicalProductIdentity.customerFacingTitle || "Likely product identification needs confirmation.",
    conflictingDetailRejected: rejected,
    actions: ["Confirm item", "Edit item description", "Enter UPC", "Upload clearer photo"],
    confirmationToken: canonicalProductIdentity.confirmationToken || "",
    canonicalProductIdentity
  };
  return error;
}

function formatCanonicalCustomerTitle({ fields = {}, productName = "", brand = "", packageQuantity = "", variant = "", sku = "", upc = "" } = {}) {
  const fieldWrapper = { fields };
  const title = firstKnown(
    canonicalFieldValue(fieldWrapper, "productName"),
    compactWords([brand, productName, variant])
  );
  const pack = firstKnown(canonicalFieldValue(fieldWrapper, "packageQuantity"), packageQuantity);
  const identifiers = [sku ? `item ${sku}` : "", upc ? `UPC ${upc}` : ""].filter(Boolean).join(", ");
  return [
    pack ? `${title}, ${pack}` : title,
    identifiers ? `(${identifiers})` : ""
  ].filter(Boolean).join(" ");
}

function applyCanonicalProductIdentity(identity = {}, canonicalProductIdentity = {}) {
  const productName = canonicalFieldValue(canonicalProductIdentity, "productName");
  const brand = canonicalFieldValue(canonicalProductIdentity, "brand");
  const manufacturer = canonicalFieldValue(canonicalProductIdentity, "manufacturer");
  const category = canonicalFieldValue(canonicalProductIdentity, "category");
  const subcategory = canonicalFieldValue(canonicalProductIdentity, "subcategory");
  const upc = canonicalFieldValue(canonicalProductIdentity, "UPC");
  const sku = canonicalFieldValue(canonicalProductIdentity, "SKU");
  const packageQuantity = canonicalFieldValue(canonicalProductIdentity, "packageQuantity");
  const dimensionsOrSize = canonicalFieldValue(canonicalProductIdentity, "dimensionsOrSize");
  const visiblePackageWording = canonicalFieldValue(canonicalProductIdentity, "visiblePackageWording");
  const variant = canonicalFieldValue(canonicalProductIdentity, "variant");
  const rejectedNotes = normalizeArray(canonicalProductIdentity.conflictingCandidatesRejected)
    .map((candidate) => `${candidate.value} rejected: ${candidate.reason}`)
    .filter(Boolean);

  return {
    ...identity,
    canonicalProductIdentity,
    productNameOrBoxTitle: productName || identity.productNameOrBoxTitle,
    exactProductIdentity: productName || identity.exactProductIdentity,
    likelyItemDescription: productName || identity.likelyItemDescription,
    brand: brand || identity.brand,
    manufacturer: manufacturer || identity.manufacturer,
    category: subcategory || category || identity.category,
    upcBarcode: upc || identity.upcBarcode,
    sku: sku || identity.sku,
    modelOrItemNumber: sku || identity.modelOrItemNumber,
    packageQuantity: packageQuantity || identity.packageQuantity,
    packageSize: dimensionsOrSize || identity.packageSize,
    size: dimensionsOrSize || identity.size,
    visibleText: mergeStringArrays(identity.visibleText, visiblePackageWording ? [visiblePackageWording] : [], 24),
    textIdentityEvidence: mergeStringArrays(identity.textIdentityEvidence, visiblePackageWording ? [visiblePackageWording] : [], 14),
    strongestSearchableIdentifiers: mergeStringArrays(
      upc ? [upc] : [],
      sku ? [compactWords([brand, sku])] : [],
      productName ? [compactWords([brand, productName, variant, packageQuantity])] : [],
      identity.strongestSearchableIdentifiers,
      12
    ),
    identityConflictNotes: mergeStringArrays(identity.identityConflictNotes, rejectedNotes, 8),
    identitySummary: `${identity.identitySummary || ""} Canonical Product Identity: ${canonicalProductIdentity.customerFacingTitle || canonicalProductIdentity.finalizedSearchIdentity || productName || "not established"}.`.trim()
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

function normalizeBarcodeReadStatus(value, upcBarcode = "") {
  const text = cleanText(value).toLowerCase();
  if (normalizeBarcodeDigits(upcBarcode)) {
    return "readable";
  }
  if (/unreadable|unclear|blur|not clear|cannot|could not|failed/.test(text)) {
    return "unreadable";
  }
  if (/not visible|none|absent|no barcode/.test(text)) {
    return "not_visible";
  }
  return text || "unknown";
}

function normalizeBarcodeDigits(value) {
  const digits = cleanText(value).replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 14 ? digits : "";
}

function normalizeZipCode(value) {
  const text = cleanText(value);
  const match = text.match(/\b\d{5}(?:-\d{4})?\b/);
  return match ? match[0] : "";
}

function normalizePurchaseContext(value) {
  const context = cleanText(value).toLowerCase();
  const aliases = {
    mall: "retail_store",
    online_marketplace: "ebay_etsy_mercari",
    consignment_store: "thrift_store",
    flea_market: "flea_market_yard_sale",
    yard_sale: "flea_market_yard_sale"
  };
  return aliases[context] || context;
}

function isRetailStorePurchaseContext(value) {
  return normalizePurchaseContext(value) === "retail_store";
}

function isOnlineRetailerPurchaseContext(value) {
  return normalizePurchaseContext(value) === "online_retailer";
}

function isResaleMarketplacePurchaseContext(value) {
  return normalizePurchaseContext(value) === "ebay_etsy_mercari";
}

function isSecondhandPurchaseContext(value) {
  return /^(flea_market_yard_sale|thrift_store|estate_sale|antique_mall)$/.test(normalizePurchaseContext(value));
}

function isLocalPrivatePurchaseContext(value) {
  return /^(facebook_marketplace|private_seller)$/.test(normalizePurchaseContext(value));
}

function getRetailStoreName(buyerIntake = {}) {
  return cleanText(buyerIntake.store_name || buyerIntake.retailer_or_marketplace_name);
}

function getRetailerDomainForStore(storeName = "") {
  const text = cleanText(storeName).toLowerCase();
  const domains = [
    [/walmart/, "walmart.com"],
    [/target/, "target.com"],
    [/home\s*depot/, "homedepot.com"],
    [/lowe'?s/, "lowes.com"],
    [/dollar\s*general/, "dollargeneral.com"],
    [/staples/, "staples.com"],
    [/office\s*depot|officemax/, "officedepot.com"],
    [/best\s*buy/, "bestbuy.com"],
    [/amazon/, "amazon.com"],
    [/costco/, "costco.com"],
    [/sam'?s\s*club/, "samsclub.com"],
    [/walgreens/, "walgreens.com"],
    [/cvs/, "cvs.com"],
    [/kroger/, "kroger.com"]
  ];
  return domains.find(([pattern]) => pattern.test(text))?.[1] || "";
}

function getSearchBarcodeDigits(identity = {}, buyerIntake = normalizeBuyerIntake({})) {
  return firstKnown(
    normalizeBarcodeDigits(buyerIntake.known_upc_digits),
    normalizeBarcodeDigits(buyerIntake.known_upc),
    normalizeBarcodeDigits(identity.upcBarcode),
    normalizeBarcodeDigits(identity.modelOrItemNumber)
  );
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

  intake.purchase_context = normalizePurchaseContext(intake.purchase_context);
  intake.location_zip = normalizeZipCode(intake.location_zip);
  intake.owner_location_zip = normalizeZipCode(intake.owner_location_zip);
  intake.location_area = cleanText(intake.location_area);
  intake.known_upc_digits = normalizeBarcodeDigits(intake.known_upc);
  intake.store_name = cleanText(intake.store_name);
  intake.retailer_or_marketplace_name = cleanText(intake.retailer_or_marketplace_name);
  intake.location_mode = cleanText(intake.location_mode || (intake.location_zip ? "manual_zip" : intake.location_area ? "browser_location_general_area" : ""));
  intake.location_state = cleanText(intake.location_state || (intake.location_zip ? "manual-ZIP" : intake.location_area ? "general-area-resolved" : ""));
  intake.location_permission = cleanText(intake.location_permission);
  intake.condition_concerns = normalizeConditionConcerns(source.condition_concerns);
  intake.asking_price_cents = parseCurrencyCents(source.asking_price_cents ?? intake.asking_price);
  intake.known_shipping_amount_cents = parseCurrencyCents(source.known_shipping_amount_cents ?? intake.known_shipping_amount);
  intake.parsed_asking_price = centsToMoney(intake.asking_price_cents);
  if (!Number.isFinite(intake.parsed_asking_price)) {
    intake.parsed_asking_price = parseAskingPrice(intake.asking_price);
  }

  return intake;
}

function parseCurrencyCents(value) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return Math.round(value);
  }
  const text = cleanText(value);
  if (!text) {
    return null;
  }
  const match = text.match(/(?:^|[^\d])(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)(?:[^\d]|$)/);
  if (!match) {
    return null;
  }
  const amount = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(amount) && amount >= 0 ? Math.round(amount * 100) : null;
}

function centsToMoney(cents) {
  return Number.isFinite(cents) ? cents / 100 : null;
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
    `store_name: ${intake.store_name || "not provided"}`,
    `location_zip: ${intake.location_zip || "not provided"}`,
    `location_mode: ${intake.location_mode || "not provided"}`,
    `location_state: ${intake.location_state || "not provided"}`,
    `location_permission: ${intake.location_permission || "not provided"}`,
    `location_area: ${intake.location_area || "not provided"}`,
    `retailer_or_marketplace_name: ${intake.retailer_or_marketplace_name || "not provided"}`,
    `known_shipping_amount: ${intake.known_shipping_amount || "not provided"}`,
    `item_condition: ${intake.item_condition || "not provided"}`,
    `condition_concerns: ${intake.condition_concerns.length ? intake.condition_concerns.join(", ") : "none provided"}`,
    `item_name: ${intake.item_name || "not provided"}`,
    `known_brand: ${intake.known_brand || "not provided"}`,
    `known_manufacturer: ${intake.known_manufacturer || "not provided"}`,
    `known_model: ${intake.known_model || "not provided"}`,
    `known_sku: ${intake.known_sku || "not provided"}`,
    `known_upc: ${intake.known_upc || "not provided"}`,
    `known_upc_digits: ${intake.known_upc_digits || "not provided"}`,
    `identity_confirmation: ${intake.identity_confirmation || "not provided"}`,
    `approximate_age_era: ${intake.approximate_age_era || "not provided"}`,
    `buyer_notes: ${intake.buyer_notes || "not provided"}`
  ].join("\n");
}

function routeMarketSources(identity, buyerIntake = normalizeBuyerIntake({}), platform = "") {
  const route = [];
  const purchaseContext = normalizePurchaseContext(buyerIntake.purchase_context);
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
    buyerIntake.known_upc_digits,
    buyerIntake.store_name,
    buyerIntake.location_zip,
    buyerIntake.retailer_or_marketplace_name,
    buyerIntake.known_shipping_amount,
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
    Array.isArray(identity.identityConflictNotes) ? identity.identityConflictNotes.join(" ") : "",
    Array.isArray(identity.buyerContext) ? identity.buyerContext.join(" ") : ""
  ].join(" ").toLowerCase();

  const hasIdentifier = hasKnownValue(identity.upcBarcode) || hasKnownValue(identity.model) || hasKnownValue(identity.sku) || hasKnownValue(identity.styleNumber);
  const hasKnownIntakeIdentifier = Boolean(getSearchBarcodeDigits(identity, buyerIntake)) || hasKnownValue(buyerIntake.known_model) || hasKnownValue(buyerIntake.known_sku);
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
  const isRetailContext = isRetailStorePurchaseContext(purchaseContext);
  const isSecondhandContext = isSecondhandPurchaseContext(purchaseContext);
  const isLocalPrivateContext = isLocalPrivatePurchaseContext(purchaseContext);
  const isOnlineRetailerContext = isOnlineRetailerPurchaseContext(purchaseContext);
  const isResaleMarketplaceContext = isResaleMarketplacePurchaseContext(purchaseContext);
  const isLocalResalePlatform = hasResaleIntent && /facebook marketplace|craigslist|offerup|local/.test(selectedPlatform.toLowerCase());
  const isRetailCurrent = isRetailContext || isOnlineRetailerContext || hasIdentifier || hasKnownIntakeIdentifier || /retail|current|new with tags|brand site|manufacturer|upc|sku|barcode/.test(haystack);

  if (isRetailContext) {
    route.push(
      "retail-store current replacement-cost sources",
      "exact UPC/barcode retail lookup",
      "named store current price search",
      "store name plus UPC search",
      "store name plus brand/model/SKU search",
      "current retailer price",
      "manufacturer/current retail product page",
      "nearby competing retailer search",
      "current shopping results",
      "pack-size and quantity matching",
      "local pickup/availability only when source-backed"
    );
    return route;
  }

  if (isOnlineRetailerContext) {
    route.push(
      "online retailer current listing",
      "exact product identifier lookup",
      "current active retail prices",
      "delivered cost with shipping",
      "seller or retailer credibility",
      "return policy when source-backed",
      "competing online retailers",
      "pack-size and quantity matching"
    );
    return route;
  }

  if (isResaleMarketplaceContext) {
    route.push(
      "exact active marketplace listing",
      "eBay/Etsy/Mercari active and sold resale results",
      "shipping and delivered-cost comparisons",
      "seller/listing status when source-backed",
      "match-quality filtered resale comps"
    );
    return route;
  }

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
    if (/used|refurbished|resale|secondhand/.test(haystack) || isResaleMarketplaceContext) {
      route.push("eBay used/refurbished secondary signal");
    }
    return route;
  }

  route.push("broad web search", "Google Shopping-style web results if retail-like", "local resale signals if local or bulky", "collector/reference sites if vintage or unusual");
  return route;
}

function buildLiveSearchQueries(identity, sourceRoute, notes, buyerIntake = normalizeBuyerIntake({})) {
  const context = buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const retailQueries = buildRetailContextSearchQueries(context);
  const queries = [
    ...retailQueries,
    ...buildHighPriorityExactQueries(context),
    ...buildFallbackSearchQueries(context)
  ];

  const diverseQueries = [];
  const scored = [];
  let index = 0;
  for (const query of queries.map((item) => finalizeSearchQueryCandidate(item, context, 12)).filter(Boolean)) {
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
  if (context.retailStoreContext || context.onlineRetailerContext) {
    const safeRetailQueries = retailQueries.map((item) => finalizeSearchQueryCandidate(item, context, 18)).filter(Boolean);
    const safeRetailSet = new Set();
    const orderedRetailQueries = [];
    for (const query of safeRetailQueries) {
      const siteSignature = (query.match(/\bsite:[a-z0-9.-]+/i) || [""])[0].toLowerCase();
      const signature = `${querySemanticSignature(query)}|${siteSignature}`;
      if (signature && !safeRetailSet.has(signature)) {
        safeRetailSet.add(signature);
        orderedRetailQueries.push(query);
      }
    }
    const remaining = scored
      .filter((item) => !orderedRetailQueries.some((retailQuery) => queriesAreSemanticallySame(retailQuery, item.query)))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .map((item) => item.query);
    return mergeStringArrays(orderedRetailQueries, remaining, maxQueries);
  }

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((item) => item.query)
    .slice(0, maxQueries);
}

function buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake = normalizeBuyerIntake({})) {
  const routeText = sourceRoute.join(" ").toLowerCase();
  const notesText = cleanText([notes, buyerIntake.buyer_notes].filter(Boolean).join(" "));
  const visualRecognition = normalizeVisualRecognition(identity.visualRecognition || {});
  const canonicalProductIdentity = identity.canonicalProductIdentity || {};
  const canonicalProductName = canonicalFieldValue(canonicalProductIdentity, "productName");
  const canonicalBrand = canonicalFieldValue(canonicalProductIdentity, "brand");
  const canonicalManufacturer = canonicalFieldValue(canonicalProductIdentity, "manufacturer");
  const canonicalCategory = canonicalFieldValue(canonicalProductIdentity, "category");
  const canonicalSubcategory = canonicalFieldValue(canonicalProductIdentity, "subcategory");
  const canonicalUpc = canonicalFieldValue(canonicalProductIdentity, "UPC");
  const canonicalSku = canonicalFieldValue(canonicalProductIdentity, "SKU");
  const canonicalPackageQuantity = canonicalFieldValue(canonicalProductIdentity, "packageQuantity");
  const canonicalDimensions = canonicalFieldValue(canonicalProductIdentity, "dimensionsOrSize");
  const canonicalVariant = canonicalFieldValue(canonicalProductIdentity, "variant");
  const canonicalVisiblePackageWording = canonicalFieldValue(canonicalProductIdentity, "visiblePackageWording");
  const visualSubject = firstKnown(identity.visualSubject, visualRecognition.visualSubject, identity.subjectIdentity, identity.userProvidedIdentity);
  const visualCategory = firstKnown(canonicalSubcategory, canonicalCategory, identity.visualSubjectCategory, visualRecognition.visualSubjectCategory, identity.category);
  const visualOrganization = firstKnown(identity.recognizedOrganization, visualRecognition.recognizedOrganization, identity.recognizedInstitution, visualRecognition.recognizedInstitution, identity.schoolName, identity.teamName);
  const visualBrand = firstKnown(canonicalBrand, identity.recognizedBrand, visualRecognition.recognizedBrand, identity.brandSeries, identity.brand);
  const visualCharacter = firstKnown(identity.recognizedCharacter, visualRecognition.recognizedCharacter, identity.mascot);
  const visibleLetters = normalizeStringArray(visualRecognition.visibleLetters, 8).join(" ");
  const visibleWords = normalizeStringArray(visualRecognition.visibleWords, 10).join(" ");
  const visualFeatures = normalizeStringArray(visualRecognition.distinctiveFeatures, 6).join(" ");
  const visualStyle = firstKnown(visualRecognition.visualStyle, visualRecognition.estimatedEraStyle);
  const subjectIdentity = firstKnown(visualSubject, identity.subjectIdentity, identity.userProvidedIdentity);
  const exactProductIdentity = firstKnown(canonicalProductName, getVerifiedExactProductIdentity(identity.exactProductIdentity));
  const productTitle = firstKnown(canonicalProductName, buyerIntake.item_name, identity.productNameOrBoxTitle, exactProductIdentity, subjectIdentity, identity.likelyItemDescription, notesText.slice(0, 120));
  const brand = firstKnown(canonicalBrand, buyerIntake.known_brand, visualBrand, identity.brandSeries, identity.brand, buyerIntake.known_manufacturer, identity.manufacturer);
  const manufacturer = firstKnown(canonicalManufacturer, buyerIntake.known_manufacturer, identity.manufacturer);
  const teamName = firstKnown(identity.teamName);
  const schoolName = firstKnown(identity.schoolName);
  const mascot = firstKnown(identity.mascot);
  const model = firstKnown(buyerIntake.known_model, identity.model);
  const itemCode = firstKnown(canonicalSku, buyerIntake.known_sku, identity.sku, identity.styleNumber);
  const upc = canonicalUpc || getSearchBarcodeDigits(identity, buyerIntake) || firstKnown(buyerIntake.known_upc, identity.upcBarcode);
  const barcodeDigits = normalizeBarcodeDigits(upc);
  const purchaseContext = normalizePurchaseContext(buyerIntake.purchase_context);
  const storeName = getRetailStoreName(buyerIntake);
  const retailerOrMarketplaceName = cleanText(buyerIntake.retailer_or_marketplace_name);
  const locationZip = normalizeZipCode(buyerIntake.location_zip);
  const locationArea = cleanText(buyerIntake.location_area);
  const locationMode = cleanText(buyerIntake.location_mode || (locationZip ? "manual_zip" : ""));
  const locationState = cleanText(buyerIntake.location_state || (locationZip ? "manual-ZIP" : locationArea ? "general-area-resolved" : ""));
  const retailerDomain = getRetailerDomainForStore(firstKnown(storeName, retailerOrMarketplaceName));
  const retailStoreContext = isRetailStorePurchaseContext(purchaseContext);
  const onlineRetailerContext = isOnlineRetailerPurchaseContext(purchaseContext);
  const resaleMarketplaceContext = isResaleMarketplacePurchaseContext(purchaseContext);
  const secondhandPurchaseContext = isSecondhandPurchaseContext(purchaseContext);
  const localPrivatePurchaseContext = isLocalPrivatePurchaseContext(purchaseContext);
  const ageEra = firstKnown(buyerIntake.approximate_age_era);
  const conditionText = firstKnown(buyerIntake.item_condition, identity.condition);
  const concernText = Array.isArray(buyerIntake.condition_concerns) ? buyerIntake.condition_concerns.join(" ") : "";
  const locationText = firstKnown(identity.manufacturerLocationText);
  const licensingText = firstKnown(identity.licensingStickerText);
  const labelText = compactWords([canonicalVisiblePackageWording, identity.frontBoxWording, identity.backLabelWording, identity.licensingStickerText, identity.copyrightWording, Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : ""]);
  const visualPhrase = buildVisualPhrase(identity, notesText);
  const categoryPhrase = buildCategoryPhrase(identity, routeText, notesText);
  const subjectPhrase = compactWords([subjectIdentity, categoryPhrase]);
  const price = buyerIntake.parsed_asking_price === null ? extractPrice(identity.currentAskingPrice) || extractPrice(notesText) : String(buyerIntake.parsed_asking_price);
  const seasonalDecor = isSeasonalDecorIdentity(identity, routeText, notesText);
  const organizationCollectible = isOrganizationCollectibleIdentity(identity, routeText, notesText);
  const brandedMemorabilia = isBrandedMemorabiliaIdentity(identity, routeText, notesText);
  const promotionalCollectible = isPromotionalCollectibleIdentity(identity, routeText, notesText);
  const visualReferenceSubject = /visual subject reference|historical\/reference|logo\/mascot\/artwork|image\/reference|artwork|illustration|logo|mascot|advertising|poster|sign|plaque|print|political|military|insignia|vintage graphic/.test(routeText);
  const visibleEvidence = mergeStringArrays(canonicalVisiblePackageWording ? [canonicalVisiblePackageWording] : [], collectVisibleSearchEvidence(identity, visualRecognition, notesText, buyerIntake), 24);
  const distinctivePhrases = extractDistinctiveSearchPhrases(visibleEvidence);
  const years = extractSearchYears(visibleEvidence.join(" "));
  const namedPeople = extractLikelyNamedPeople(visibleEvidence.join(" "));
  const itemType = firstKnown(canonicalSubcategory, inferSearchItemType(identity, visualCategory, productTitle, notesText, routeText));
  const eventPhrases = distinctivePhrases.filter((phrase) => /champion|anniversary|tournament|bowl|series|festival|event|official|collector|edition|commemorative|national|world|regional|conference|\b\d{4}\b/i.test(phrase));
  const packageQuantity = firstKnown(canonicalPackageQuantity, identity.packageQuantity, identity.unitCount, extractPackQuantityText([productTitle, notesText, identity.size, identity.dimensions, identity.frontBoxWording, identity.backLabelWording].join(" ")));
  const packageSize = firstKnown(canonicalDimensions, identity.packageSize, identity.size, identity.dimensions);
  const hasHighSpecificityText = distinctivePhrases.length > 0 || barcodeDigits || upc || model || itemCode;
  const retailEvidenceMode = getRetailEvidenceMode({ buyerIntake, identity });
  const retailRouteClassification = getRetailRouteClassification({ buyerIntake, identity });

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
    barcodeDigits,
    barcodeReadStatus: normalizeBarcodeReadStatus(identity.barcodeReadStatus, identity.upcBarcode),
    barcodeFailureMessage: cleanText(identity.barcodeFailureMessage),
    purchaseContext,
    storeName,
    retailerOrMarketplaceName,
    locationZip,
    locationArea,
    locationMode,
    locationState,
    locationPermission: cleanText(buyerIntake.location_permission),
    retailerDomain,
    knownShippingAmount: cleanText(buyerIntake.known_shipping_amount),
    retailStoreContext,
    onlineRetailerContext,
    resaleMarketplaceContext,
    secondhandPurchaseContext,
    localPrivatePurchaseContext,
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
    packageQuantity,
    packageSize,
    canonicalProductIdentity,
    finalizedSearchIdentity: canonicalProductIdentity.finalizedSearchIdentity || "",
    canonicalCustomerTitle: canonicalProductIdentity.customerFacingTitle || "",
    unsupportedIdentityTerms: normalizeStringArray(canonicalProductIdentity.unsupportedTermsRejected, 24),
    conflictingCandidatesRejected: normalizeArray(canonicalProductIdentity.conflictingCandidatesRejected),
    canonicalIdentityConfidence: cleanText(canonicalProductIdentity.canonicalConfidence),
    canonicalUserConfirmationRequired: Boolean(canonicalProductIdentity.userConfirmationRequired),
    canonicalVariant,
    retailEvidenceMode,
    retailRouteClassification,
    eventPhrases,
    hasHighSpecificityText
  };
}

function buildRetailContextSearchQueries(context) {
  if (!context.retailStoreContext && !context.onlineRetailerContext) {
    return [];
  }
  const queries = [];
  const barcode = context.barcodeDigits || normalizeBarcodeDigits(context.upc);
  const storeName = context.storeName || context.retailerOrMarketplaceName;
  const brand = firstKnown(context.brand, context.visualBrand, context.manufacturer);
  const identifier = firstKnown(context.model, context.itemCode);
  const productTitle = firstKnown(context.productTitle, context.exactProductIdentity, context.subjectIdentity, context.itemType);
  const productType = firstKnown(context.itemType, mostDistinctiveCategoryWord(context.categoryPhrase));
  const packageQuantity = cleanText(context.packageQuantity).replace(/\b(\d+)-count\b/gi, "$1 count");
  const pack = compactWords([packageQuantity, context.packageSize]);
  const location = context.locationZip || cleanText(context.locationArea);

  if (barcode) {
    queries.push(barcode);
    queries.push(compactWords([storeName, barcode]));
    if (context.retailerDomain) {
      queries.push(buildSerperSingleMarketplaceQuery(barcode, context.retailerDomain));
    }
  }

  if (brand && productTitle) {
    queries.push(compactWords([brand, productTitle]));
  }
  if (brand && identifier) {
    queries.push(compactWords([brand, identifier]));
  }
  if (brand && productType && packageQuantity) {
    queries.push(compactWords([brand, productType, packageQuantity]));
  }
  if (storeName && productTitle) {
    queries.push(compactWords([storeName, brand, productTitle]));
  }
  if (storeName && productType && packageQuantity) {
    queries.push(compactWords([storeName, productType, packageQuantity]));
  }
  if (productType && packageQuantity && location) {
    queries.push(compactWords([productType, packageQuantity, "near", location]));
  }

  if (barcode) {
    queries.push(compactWords([barcode, brand || productTitle]));
    queries.push(compactWords([barcode, productTitle, pack]));
    queries.push(compactWords([barcode, "current price"]));
  }
  if (identifier && storeName) {
    queries.push(compactWords([storeName, brand, identifier, productType]));
  }
  if (identifier) {
    queries.push(compactWords([brand, identifier, "current retail price"]));
  }
  if (productTitle) {
    queries.push(compactWords([productTitle, pack, "current retail price"]));
    queries.push(compactWords([brand, productTitle, "manufacturer price"]));
    queries.push(compactWords([productTitle, "shopping replacement cost"]));
  }
  if (context.retailerDomain && productTitle && !barcode) {
    queries.push(buildSerperSingleMarketplaceQuery(compactWords([productTitle, pack]), context.retailerDomain));
  }
  if (location && productTitle) {
    queries.push(compactWords([productTitle, storeName, location]));
    queries.push(compactWords([productTitle, location, "nearby price"]));
  }

  return mergeStringArrays(queries, 16);
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

  if (context.retailStoreContext || context.onlineRetailerContext) {
    queries.push(...buildRetailContextSearchQueries(context));
  }

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
  if (/['â€™]/.test(text)) score += 8;
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

function normalizeLiveSearchResult({ result, responseData, identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "", searchStartedAt, sourceRoute, searchQueries, queriesActuallySent = [], queriesPrioritized = [], providerRequestRecords = [], providerResponseSummaries = [], providerErrors = [], providerSourceRecords = [], safeRawResultSummaries = [], elapsedMs, statusCode, includeSourcesRequested, includeFallbackReason, searchControlsFallbackReason }) {
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
    itemIdentificationEvidence: bucketedResearch.itemIdentificationEvidence,
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
      identity,
      buyerIntake,
      notes,
      searchControlsFallbackReason
    })
  };
}

function buildUnavailableLiveSearchResult({ error, sourceRoute, searchQueries, queriesPrioritized = [], providerRequestRecords = [], providerResponseSummaries = [], providerErrors = [], searchStartedAt, elapsedMs, includeSourcesRequested, includeFallbackReason, searchControlsFallbackReason, identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "" }) {
  const diagnostic = classifyLiveSearchError(error);
  const liveSearchStatus = statusForLiveSearchError(diagnostic.category);
  const errors = providerErrors.length ? providerErrors : [diagnostic];

  return {
    liveSearchStatus,
    comparableItemsFound: [],
    resultsFound: [],
    strongComparables: [],
    partialComparables: [],
    itemIdentificationEvidence: [],
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
      identity,
      buyerIntake,
      notes,
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
    itemIdentificationEvidence: [],
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

function buildSearchDiagnostics({ searchQueries = [], queriesActuallySent = [], queriesPrioritized = [], sourceRoute = [], sourcesSearched = [], citations = [], providerSourceRecords = [], webSearchCalls = [], rawResultSummaries = [], bucketedResearch = buildEmptyResearchBuckets(), providerErrors = [], providerRequestRecords = [], providerResponseSummaries = [], liveSearchStatus = "", elapsedMs = 0, searchControlsFallbackReason = "", identity = {}, buyerIntake = normalizeBuyerIntake({}), notes = "" }) {
  const normalization = bucketedResearch.normalizationDiagnostics || {};
  const context = buildSearchQueryContext(identity, sourceRoute, notes, buyerIntake);
  const retailDiagnostics = buildRetailSearchDiagnostics({
    context,
    providerRequestRecords,
    records: providerSourceRecords,
    searchQueries
  });
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
    ...retailDiagnostics,
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
      providerKey: cleanText(record.providerKey || ""),
      searchPass: cleanText(record.searchPass),
      retailStage: cleanText(record.retailStage),
      retailStageLabel: cleanText(record.retailStageLabel),
      retailBudgetBucket: cleanText(record.retailBudgetBucket),
      sourceRoute: normalizeStringArray(record.sourceRoute, 8),
      allowedDomainsRequested: normalizeStringArray(record.allowedDomainsRequested, 8),
      marketplaceDomainsRequested: normalizeStringArray(record.marketplaceDomainsRequested, 8),
      allowedDomainsApplied: Boolean(record.allowedDomainsApplied),
      rawCandidate: cleanText(record.rawCandidate),
      candidateOrigin: cleanText(record.candidateOrigin),
      normalizedCandidate: cleanText(record.normalizedCandidate),
      finalQuery: cleanText(record.finalQuery || record.query),
      validationPassed: record.validationPassed !== false,
      validationFailureReason: cleanText(record.validationFailureReason),
      requestAttempted: Boolean(record.attempted),
      requestSucceeded: Boolean(record.succeeded),
      providerSourceCount: Number(record.providerSourceCount || 0),
      organicResultCount: Number(record.organicResultCount || 0),
      shoppingResultCount: Number(record.shoppingResultCount || 0),
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
    retailStage: cleanText(record.retailStage),
    retailStageLabel: cleanText(record.retailStageLabel),
    retailBudgetBucket: cleanText(record.retailBudgetBucket),
    sourceRoute: normalizeStringArray(record.sourceRoute, 8),
    allowedDomainsRequested: normalizeStringArray(record.allowedDomainsRequested, 8),
    marketplaceDomainsRequested: normalizeStringArray(record.marketplaceDomainsRequested, 8),
    allowedDomainsApplied: Boolean(record.allowedDomainsApplied),
    rawCandidate: cleanText(record.rawCandidate),
    candidateOrigin: cleanText(record.candidateOrigin),
    normalizedCandidate: cleanText(record.normalizedCandidate),
    finalQuery: cleanText(record.finalQuery || record.query),
    validationPassed: record.validationPassed !== false,
    validationFailureReason: cleanText(record.validationFailureReason),
    provider: cleanText(record.provider || "OpenAI web_search"),
    providerKey: cleanText(record.providerKey || ""),
    attempted: Boolean(record.attempted),
    succeeded: Boolean(record.succeeded),
    providerSourceCount: Number(record.providerSourceCount || 0),
    organicResultCount: Number(record.organicResultCount || 0),
    shoppingResultCount: Number(record.shoppingResultCount || 0),
    knowledgeGraphResultCount: Number(record.knowledgeGraphResultCount || 0),
    domainsReturned: normalizeStringArray(record.domainsReturned, 8),
    sourceURLsReturned: normalizeStringArray(record.sourceURLsReturned, 12),
    rawResultCount: Number(record.rawResultCount || 0),
    parsedResultCount: Number(record.parsedResultCount || 0),
    normalizedResultCount: Number(record.normalizedResultCount || 0),
    retainedResultCount: Number(record.retainedResultCount || 0),
    rejectedResultCount: Number(record.rejectedResultCount || 0),
    errorCode: cleanText(record.errorCode),
    failureStage: cleanText(record.failureStage || "unknown")
  };
}

function sanitizeProviderResponseSummary(summary = {}) {
  return {
    query: cleanText(summary.query),
    priority: Number(summary.priority || 0),
    searchPass: cleanText(summary.searchPass),
    retailStage: cleanText(summary.retailStage),
    retailStageLabel: cleanText(summary.retailStageLabel),
    retailBudgetBucket: cleanText(summary.retailBudgetBucket),
    provider: cleanText(summary.provider || "OpenAI web_search"),
    providerKey: cleanText(summary.providerKey || ""),
    allowedDomainsRequested: normalizeStringArray(summary.allowedDomainsRequested, 8),
    marketplaceDomainsRequested: normalizeStringArray(summary.marketplaceDomainsRequested, 8),
    allowedDomainsApplied: Boolean(summary.allowedDomainsApplied),
    rawCandidate: cleanText(summary.rawCandidate),
    candidateOrigin: cleanText(summary.candidateOrigin),
    normalizedCandidate: cleanText(summary.normalizedCandidate),
    finalQuery: cleanText(summary.finalQuery || summary.query),
    validationPassed: summary.validationPassed !== false,
    validationFailureReason: cleanText(summary.validationFailureReason),
    statusCode: summary.statusCode || null,
    webSearchCallAppeared: Boolean(summary.webSearchCallAppeared),
    urlCitationCount: Number(summary.urlCitationCount || 0),
    providerSourceCount: Number(summary.providerSourceCount || 0),
    organicResultCount: Number(summary.organicResultCount || 0),
    shoppingResultCount: Number(summary.shoppingResultCount || 0),
    knowledgeGraphResultCount: Number(summary.knowledgeGraphResultCount || 0),
    relatedSearchCount: Number(summary.relatedSearchCount || 0),
    parsedCandidateCount: Number(summary.parsedCandidateCount || 0),
    normalizedResultCount: Number(summary.normalizedResultCount || 0),
    retainedResultCount: Number(summary.retainedResultCount || 0),
    rejectedResultCount: Number(summary.rejectedResultCount || 0),
    sourceURLsReturned: normalizeStringArray(summary.sourceURLsReturned, 12),
    domainsReturned: normalizeStringArray(summary.domainsReturned, 8),
    providerActionQueries: normalizeStringArray(summary.providerActionQueries, 4).filter((query) => !isInternalPromptFragment(query)),
    failureStage: cleanText(summary.failureStage || ""),
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
  normalizeStringArray(result.itemIdentificationEvidence, 12).forEach((item) => addSummary(item, "itemIdentificationEvidence"));
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
    const itemTypeValuationSafe = isComparableItemTypeValuationSafe({
      itemTypeCompatible: record.itemTypeCompatible,
      status: record.itemTypeCompatibilityStatus
    });
    if (!itemTypeValuationSafe && !/rejected|weak/i.test(record.classification)) {
      bucketName = "referenceResults";
      record.classification = "Reference Only";
      record.evidenceRole = buildSerperEvidenceRole("Reference Only", record.priceType, {
        itemTypeCompatible: record.itemTypeCompatible,
        status: record.itemTypeCompatibilityStatus,
        explanation: record.itemTypeCompatibilityExplanation
      });
      record.influencedReferenceRange = buildNonValuationInfluenceReason(record.priceType, {
        itemTypeCompatible: record.itemTypeCompatible,
        status: record.itemTypeCompatibilityStatus,
        explanation: record.itemTypeCompatibilityExplanation
      });
      record.itemIdentityDifferences = cleanText(record.itemIdentityDifferences || record.itemTypeCompatibilityExplanation);
    } else if (!/rejected|weak/i.test(record.classification) && /exact|strong/i.test(identityStrength)) {
      record.classification = identityStrength;
      if (canSupportPreliminaryAskingRangeFromVisibleRecord(record)) {
        bucketName = "strongComparables";
        record.evidenceRole = buildEvidenceRoleForIdentityStrength(record);
        record.influencedReferenceRange = "Yes, as compatible visible asking/sold evidence with price-type limitations.";
      } else {
        bucketName = "itemIdentificationEvidence";
        record.classification = "Exact identity reference - no usable price";
        record.evidenceRole = "Identity/reference context only - not valuation support";
        record.influencedReferenceRange = "No - exact identity reference only because no usable visible price was found.";
        record.influencedVerifiedMarketRange = "No - no usable sold price evidence.";
        record.includedInPreliminaryAskingPriceRange = "No - no usable visible price evidence.";
      }
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
  normalizeStringArray(result.itemIdentificationEvidence, 8).forEach((item) => addRecord("itemIdentificationEvidence", item));
  normalizeStringArray(result.referenceResults, 8).forEach((item) => addRecord("referenceResults", item));
  normalizeStringArray(result.weakMatches, 8).forEach((item) => addRecord("weakMatches", item));
  normalizeStringArray(result.rejectedMatches, 8).forEach((item) => addRecord("rejectedMatches", item));

  for (const item of legacyItems) {
    if (isRejectedWeakComparableItem(item) || /\brejected\b/i.test(item)) {
      addRecord("rejectedMatches", item);
    } else if (/\bweak\b/i.test(item)) {
      addRecord("weakMatches", item);
    } else if (/\breference|identity\b/i.test(item)) {
      addRecord("itemIdentificationEvidence", item);
    } else if (/\bpartial|similar\b/i.test(item) && !/\bexact match\b|\blikely exact\b|\bstrong similar match\b/i.test(item)) {
      addRecord("partialComparables", item);
    } else {
      addRecord("strongComparables", item);
    }
  }

  trimBucketWithReason(buckets.strongComparables, 6, diagnostics, "strong comparable display cap");
  trimBucketWithReason(buckets.partialComparables, 8, diagnostics, "partial comparable display cap");
  trimBucketWithReason(buckets.itemIdentificationEvidence, 8, diagnostics, "item identification evidence display cap");
  trimBucketWithReason(buckets.referenceResults, 8, diagnostics, "reference result display cap");
  trimBucketWithReason(buckets.weakMatches, 8, diagnostics, "weak match display cap");
  trimBucketWithReason(buckets.rejectedMatches, 8, diagnostics, "rejected match display cap");
  buckets.resultsFound = [
    ...buckets.strongComparables,
    ...buckets.partialComparables,
    ...buckets.itemIdentificationEvidence,
    ...buckets.referenceResults,
    ...buckets.weakMatches,
    ...buckets.rejectedMatches
  ].slice(0, 24);
  diagnostics.retainedVisibleResultCount = [
    ...buckets.strongComparables,
    ...buckets.partialComparables,
    ...buckets.itemIdentificationEvidence,
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
  const title = extractResultTitle(rawText, source, url);
  const identityStrength = classifyIdentityMatchStrength({ rawText, title, classification }, identity);
  const sourceType = extractLabeledResultPart(rawText, /source\s*type\s*[:=-]\s*([^|;.]+)/i);
  const searchPass = extractLabeledResultPart(rawText, /search\s*pass\s*[:=-]\s*([^|;.]+)/i);
  const query = extractLabeledResultPart(rawText, /query\s*[:=-]\s*([^|;.]+)/i);
  const provider = extractLabeledResultPart(rawText, /provider\s*[:=-]\s*([^|;.]+)/i);
  const delivery = extractLabeledResultPart(rawText, /(?:shipping\/delivery|shipping|delivery)\s*[:=-]\s*([^|;.]+)/i);
  const evaluatedCompatibility = evaluateComparableItemTypeCompatibility({ title, rawText, url, snippet: rawText, source, sourceType }, identity, {});
  const itemTypeCompatible = parseCompatibilityBoolean(extractLabeledResultPart(rawText, /item\s+type\s+compatible\s*[:=-]\s*([^|;.]+)/i), evaluatedCompatibility.itemTypeCompatible);
  const itemTypeCompatibility = {
    ...evaluatedCompatibility,
    itemTypeCompatible
  };
  const itemTypeValuationSafe = isComparableItemTypeValuationSafe(itemTypeCompatibility);
  const visibleClassification = itemTypeValuationSafe || rejected || /weak|rejected/i.test(classification)
    ? (identityStrength || classification)
    : "Reference Only";
  const priceTypeLabel = normalizePriceTypeLabel(priceType, { title, rawText, url, delivery });
  const preliminaryRangeIncluded = itemTypeValuationSafe
    && displayedPrice
    && /exact|strong|partial/i.test(visibleClassification)
    && !/No Usable|Reference Without Price|Unknown Price Type/i.test(priceTypeLabel);
  const verifiedMarketInfluence = itemTypeValuationSafe
    && displayedPrice
    && /exact|strong/i.test(visibleClassification)
    && isQualifiedVerifiedSoldPriceEvidence({ priceType, priceTypeLabel, rawText, url, source, sourceBacked: url ? "URL provided by result text" : "" }, priceTypeLabel, visibleClassification);

  return {
    title,
    source,
    url: url || "",
    canonicalUrl: canonicalizeComparableUrl(url) || url || "",
    displayedPrice,
    currency: displayedPrice ? "$" : "",
    priceType,
    priceTypeLabel,
    delivery,
    condition: extractLabeledResultPart(rawText, /condition\s*[:=-]\s*([^|;.]+)/i),
    classification: visibleClassification,
    itemTypeCompatible,
    submittedItemType: cleanText(extractLabeledResultPart(rawText, /submitted\s+item\s+type\s*[:=-]\s*([^|;.]+)/i)) || itemTypeCompatibility.submittedItemType,
    candidateItemType: cleanText(extractLabeledResultPart(rawText, /candidate\s+item\s+type\s*[:=-]\s*([^|;.]+)/i)) || itemTypeCompatibility.candidateItemType,
    itemTypeCompatibilityStatus: itemTypeCompatibility.status,
    itemTypeCompatibilityExplanation: itemTypeCompatibility.explanation,
    evidenceRole: itemTypeValuationSafe
      ? (identityStrength ? buildEvidenceRoleForIdentityStrength({ priceType, displayedPrice }) : inferEvidenceRole(bucketName, classification))
      : buildSerperEvidenceRole("Reference Only", priceType, itemTypeCompatibility),
    matchExplanation: extractMatchExplanation(rawText),
    itemIdentityDifferences: extractIdentityDifferences(rawText) || (!itemTypeValuationSafe ? itemTypeCompatibility.explanation : ""),
    influencedVerifiedMarketRange: verifiedMarketInfluence ? "Yes - verified sold evidence from a compatible exact or strong match." : buildVerifiedMarketRangeNonInfluenceReason(priceTypeLabel, itemTypeCompatibility),
    includedInPreliminaryAskingPriceRange: preliminaryRangeIncluded ? "Yes - compatible visible price evidence included in the preliminary asking-price range." : buildPreliminaryRangeNonInclusionReason(priceTypeLabel, itemTypeCompatibility),
    influencedReferenceRange: preliminaryRangeIncluded
      ? (verifiedMarketInfluence ? "Influenced verified market range: Yes." : "Influenced verified market range: No. Included in preliminary asking-price range: Yes.")
      : buildNonValuationInfluenceReason(priceTypeLabel, itemTypeCompatibility),
    rejectionReason: rejected ? extractRejectionReason(rawText, classification) : "",
    sourceBacked: url && hasCitedUrl(rawText, citations) ? "URL-cited" : url ? "URL provided by result text" : "No usable URL supplied by source.",
    provider,
    sourceType,
    searchPass,
    query,
    activeSoldReferenceStatus: inferActiveSoldReferenceStatus(priceType, rawText),
    rawText
  };
}

function parseCompatibilityBoolean(value, fallback = false) {
  const text = cleanText(value).toLowerCase();
  if (/^(yes|true|compatible)\b/.test(text)) return true;
  if (/^(no|false|incompatible|unknown)\b/.test(text)) return false;
  return fallback === true;
}

function recordsToLegacyComparableStrings(records) {
  return records
    .filter((record) => record.url && record.sourceBacked === "URL-cited" && canInfluenceValuationFromVisibleRecord(record) && !/rejected|weak/i.test(record.classification))
    .map(formatResearchRecordForLegacySection)
    .slice(0, 6);
}

function formatResearchRecordForLegacySection(record) {
  return [
    record.provider ? `Provider: ${record.provider}` : "",
    `Source/platform/site: ${record.source || "Unknown source"}`,
    `Title: ${record.title || "Title not supplied"}`,
    record.displayedPrice ? `Price: ${record.displayedPrice}` : "",
    record.delivery ? `Shipping/Delivery: ${record.delivery}` : "",
    record.priceType ? `Price Type: ${record.priceType}` : "",
    record.priceTypeLabel ? `Price Label: ${record.priceTypeLabel}` : "",
    record.condition ? `Condition: ${record.condition}` : "",
    record.url ? `URL: ${record.url}` : "URL: No usable URL supplied by source.",
    `Match quality: ${record.classification}`,
    record.submittedItemType ? `Submitted Item Type: ${record.submittedItemType}` : "",
    record.candidateItemType ? `Candidate Item Type: ${record.candidateItemType}` : "",
    typeof record.itemTypeCompatible === "boolean" ? `Item Type Compatible: ${record.itemTypeCompatible ? "Yes" : "No"}` : "",
    record.influencedVerifiedMarketRange ? `Influenced Verified Market Range: ${record.influencedVerifiedMarketRange}` : "",
    record.includedInPreliminaryAskingPriceRange ? `Included in Preliminary Asking-Price Range: ${record.includedInPreliminaryAskingPriceRange}` : "",
    record.sourceType ? `Source Type: ${record.sourceType}` : "",
    record.activeSoldReferenceStatus ? `Active/Sold/Reference Status: ${record.activeSoldReferenceStatus}` : "",
    record.searchPass ? `Search pass: ${record.searchPass}` : "",
    record.query ? `Query: ${record.query}` : "",
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
  const source = String(text || "");
  const moneyPattern = "\\$\\s*\\d{1,6}(?:,\\d{3})*(?:\\.\\d{1,2})?";
  const labeledPatterns = [
    new RegExp(`\\b(?:sale\\s+price|current\\s+price|retail\\s+price|store\\s+price|package\\s+price|item\\s+price|price|now)\\s*(?:is|:|=|-)?\\s*(${moneyPattern})`, "i"),
    new RegExp(`(${moneyPattern})\\s*(?:each|per\\s+(?:pack|package|box)|/\\s*(?:pack|box))`, "i")
  ];
  for (const pattern of labeledPatterns) {
    const match = source.match(pattern);
    if (match) {
      return normalizeMoneyLabelText(match[1]);
    }
  }
  for (const match of source.matchAll(new RegExp(moneyPattern, "g"))) {
    const amountText = match[0];
    const start = match.index || 0;
    const before = source.slice(Math.max(0, start - 36), start).toLowerCase();
    const after = source.slice(start + amountText.length, start + amountText.length + 36).toLowerCase();
    if (/\b(?:shipping|delivery|freight|pickup|save|savings|coupon|review|rating)\b/.test(`${before} ${after}`)) {
      continue;
    }
    return normalizeMoneyLabelText(amountText);
  }
  return "";
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

function inferActiveSoldReferenceStatus(priceType, rawText = "") {
  const text = [priceType, rawText].map(cleanText).join(" ").toLowerCase();
  if (/confirmed sold|sold price|sold for|price realized/.test(text)) return "confirmed sold evidence";
  if (/ended listing/.test(text)) return "ended listing without confirmed sale";
  if (/active asking|asking price|for sale|current listing|shopping offer/.test(text)) return "active/reference asking evidence";
  if (/reference/.test(text)) return "reference/no-price evidence";
  return "";
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
  const itemIdentificationEvidence = normalizeResearchRecordArray(liveSearch.itemIdentificationEvidence, "itemIdentificationEvidence");
  const referenceResults = normalizeResearchRecordArray(liveSearch.referenceResults, "referenceResults");
  const weakMatches = normalizeResearchRecordArray(liveSearch.weakMatches, "weakMatches");
  const rejectedMatches = normalizeResearchRecordArray(liveSearch.rejectedMatches, "rejectedMatches");
  const resultsFound = [
    ...strongComparables,
    ...partialComparables,
    ...itemIdentificationEvidence,
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
    itemIdentificationEvidence,
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
  const displayedPrice = normalizeMoneyLabelText(cleanText(item.displayedPrice || item.displayedPriceText || item.price));
  const sourcePriceType = cleanText(item.priceType || item.priceEvidenceType) || inferPriceType(rawText);
  const priceTypeLabel = normalizePriceTypeLabel(sourcePriceType, {
    ...item,
    rawText,
    url,
    displayedPrice,
    price: displayedPrice
  });
  const priceType = /Non-Transactional Reference|Bulk\/Lot Reference/i.test(priceTypeLabel) ? priceTypeLabel : sourcePriceType;
  const nonMarketTransaction = /Non-Transactional Reference|Bulk\/Lot Reference/i.test(priceTypeLabel);
  const nonMarketReason = /Bulk\/Lot Reference/i.test(priceTypeLabel)
    ? "Bulk/lot reference - unit price not established."
    : "Non-transactional reference - not a market transaction.";
  return {
    title: cleanText(item.title) || extractResultTitle(rawText, cleanText(item.source), url),
    source: cleanText(item.source) || inferSourceFromResult(rawText, url),
    url,
    canonicalUrl: cleanText(item.canonicalUrl) || canonicalizeComparableUrl(url) || url,
    displayedPrice,
    currency: cleanText(item.currency) || (displayedPrice ? "$" : ""),
    priceType,
    priceTypeLabel,
    delivery: cleanText(item.delivery || item.shipping),
    condition: cleanText(item.condition),
    classification: nonMarketTransaction ? (priceTypeLabel === "Bulk/Lot Reference" ? "Rejected - Bulk/Lot Reference" : "Rejected - Not a Market Transaction") : cleanText(item.classification) || inferResultClassification(rawText, bucketName),
    identityMatchStrength: cleanText(item.identityMatchStrength),
    evidenceType: cleanText(item.evidenceType) || extractLabeledResultPart(rawText, /evidence\s*type\s*[:=-]\s*([^|;.]+)/i),
    itemTypeCompatible: item.itemTypeCompatible === true || cleanText(item.itemTypeCompatible).toLowerCase() === "true",
    submittedItemType: cleanText(item.submittedItemType),
    candidateItemType: cleanText(item.candidateItemType),
    itemTypeCompatibilityStatus: cleanText(item.itemTypeCompatibilityStatus),
    itemTypeCompatibilityExplanation: cleanText(item.itemTypeCompatibilityExplanation),
    evidenceRole: nonMarketTransaction ? `Rejected - ${nonMarketReason}` : cleanText(item.evidenceRole) || inferEvidenceRole(bucketName, cleanText(item.classification)),
    matchExplanation: cleanText(item.matchExplanation) || extractMatchExplanation(rawText),
    itemIdentityDifferences: cleanText(item.itemIdentityDifferences) || extractIdentityDifferences(rawText),
    influencedReferenceRange: nonMarketTransaction ? `No - ${nonMarketReason}` : cleanText(item.influencedReferenceRange) || (["strongComparables", "partialComparables", "referenceResults"].includes(bucketName) ? "Yes, as visible evidence only." : "No."),
    influencedVerifiedMarketRange: nonMarketTransaction ? `No - ${nonMarketReason}` : cleanText(item.influencedVerifiedMarketRange),
    includedInPreliminaryAskingPriceRange: nonMarketTransaction ? `No - ${nonMarketReason}` : cleanText(item.includedInPreliminaryAskingPriceRange),
    rejectionReason: nonMarketTransaction ? nonMarketReason : cleanText(item.rejectionReason) || (bucketName === "rejectedMatches" ? extractRejectionReason(rawText, cleanText(item.classification)) : ""),
    sourceBacked: cleanText(item.sourceBacked) || (url ? "URL provided by result text" : "No usable URL supplied by source."),
    provider: cleanText(item.provider || item.providerKey || extractLabeledResultPart(rawText, /provider\s*[:=-]\s*([^|;.]+)/i)),
    providerLabel: cleanText(item.providerLabel),
    sourceType: cleanText(item.sourceType || extractLabeledResultPart(rawText, /source\s*type\s*[:=-]\s*([^|;.]+)/i)),
    searchPass: cleanText(item.searchPass || extractLabeledResultPart(rawText, /search\s*pass\s*[:=-]\s*([^|;.]+)/i)),
    query: cleanText(item.query || extractLabeledResultPart(rawText, /query\s*[:=-]\s*([^|;.]+)/i)),
    queriesFound: normalizeStringArray(item.queriesFound, 8),
    searchPassesFound: normalizeStringArray(item.searchPassesFound, 6),
    activeSoldReferenceStatus: cleanText(item.activeSoldReferenceStatus) || inferActiveSoldReferenceStatus(priceType, rawText),
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
    limitations.push("No compatible exact or strong comparable records with usable visible prices are visible in this report.");
  }
  if (normalizeResearchRecordArray(liveSearch.itemIdentificationEvidence, "itemIdentificationEvidence").length) {
    limitations.push("Exact no-price source records are item identification evidence only and do not establish market value.");
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
    report.itemIdentificationEvidence,
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
  ].flat().filter((item) => isUsableSourceRecord(item) && canSupportPreliminaryAskingRangeFromVisibleRecord(item)).length;
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

function buildComparableEvidenceText(record = {}, { includeSystemLabels = true } = {}) {
  const parts = [
    record.title,
    record.snippet,
    record.description,
    record.condition,
    record.delivery,
    record.shipping,
    record.source,
    record.domain,
    record.url,
    record.sourceType,
    record.activeSoldReferenceStatus,
    includeSystemLabels ? record.priceType : "",
    includeSystemLabels ? record.priceEvidenceType : "",
    includeSystemLabels ? record.priceTypeLabel : "",
    includeSystemLabels ? record.evidenceRole : "",
    record.rawText
  ];
  return cleanText(parts.filter(Boolean).join(" "));
}

function stripSystemPriceEvidenceLabels(text = "") {
  return cleanText(text)
    .replace(/\b(?:price\s*(?:type|label|evidence\s*type)|evidence\s*role|influenced\s*verified\s*market\s*range|included\s*in\s*preliminary\s*asking[- ]price\s*range)\s*[:=-]\s*(?:confirmed\s*sold|verified\s*sold|sold\/ended|yes[^|;.]*|comparable\s*evidence[^|;.]*)(?=$|[|;.])/gi, " ")
    .replace(/\bactive\/sold\/reference\s*status\s*[:=-]\s*sold\/ended\s*evidence\s*status\s*requires\s*source\s*context\b/gi, " ");
}

function isFacebookMarketplaceRecord(record = {}) {
  const text = normalizeComparableText(buildComparableEvidenceText(record));
  return /\bfacebook\s+marketplace\b|facebook\.com\/marketplace|fb\.com\/marketplace/i.test(text);
}

function isSocialOrEditorialSourceRecord(record = {}) {
  const text = normalizeComparableText(buildComparableEvidenceText(record));
  if (isFacebookMarketplaceRecord(record)) {
    return false;
  }
  return /\b(?:facebook|instagram|reddit|pinterest|tiktok|youtube|blogspot|wordpress|blog|forum|message\s*board|collector\s+discussion|discussion\s+thread|social\s+post)\b/i.test(text)
    || /(?:facebook|instagram|reddit|pinterest|tiktok|youtube|blogspot|wordpress)\.com/i.test(text);
}

function hasNonTransactionalContentSignals(record = {}) {
  const text = normalizeComparableText(buildComparableEvidenceText(record, { includeSystemLabels: false }));
  return /\b(?:i\s+found|look\s+what\s+i\s+found|thrift\s+haul|at\s+the\s+thrift|thrifted|haul|my\s+finds?|picked\s+(?:this|these|it|them)\s+up|estate\s+sale\s+find|flea\s+market\s+find|collector\s+discussion|discussion\s+thread|blog\s+post|forum\s+post|photo\s+post|social\s+post|shared\s+post|price\s+guide|guide\s+only|reference\s+only)\b/i.test(text);
}

function detectBulkLotQuantity(record = {}) {
  const text = normalizeComparableText(buildComparableEvidenceText(record, { includeSystemLabels: false }));
  const patterns = [
    /\b(?:lot|bundle|collection|group|case)\s+of\s+(\d{1,3})\b/i,
    /\b(\d{1,3})\s*[- ]?(?:piece|pc)\s+(?:lot|bundle|set|collection|group)\b/i,
    /\b(?:lot|bundle|collection|group)\s+(?:with|containing)\s+(\d{1,3})\b/i,
    /\b(\d{1,3})\s+(?:vintage\s+|antique\s+|used\s+|collectible\s+|coca[-\s]?cola\s+)?(?:trays|plates|items|pieces|figurines|figures|decorations|ornaments|mugs|cups|bottles|signs|stickers|books)\b/i
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const quantity = match ? Number.parseInt(match[1], 10) : null;
    if (Number.isFinite(quantity) && quantity > 1) {
      return { quantity, text };
    }
  }
  if (/\b(?:pair|lot|bundle|collection|group)\b/i.test(text)) {
    return { quantity: 2, text };
  }
  return { quantity: 1, text };
}

function hasSupportedUnitNormalization(record = {}, quantityContext = detectBulkLotQuantity(record)) {
  const text = quantityContext.text || normalizeComparableText(buildComparableEvidenceText(record, { includeSystemLabels: false }));
  return /\b(?:unit\s*price|per\s+(?:item|piece|tray|unit)|each|ea\.?)\b/i.test(text)
    && /\b(?:single|one)\s+(?:item|piece|tray|unit)\b|\$?\s*\d/i.test(text);
}

function isBulkLotReferenceWithoutUnitPrice(record = {}) {
  const quantityContext = detectBulkLotQuantity(record);
  return quantityContext.quantity > 1 && !hasSupportedUnitNormalization(record, quantityContext);
}

function isNonTransactionalContentRecord(record = {}) {
  if (isBulkLotReferenceWithoutUnitPrice(record)) {
    return true;
  }
  if (isSocialOrEditorialSourceRecord(record)) {
    return true;
  }
  return hasNonTransactionalContentSignals(record) && !hasExplicitSoldTransactionProof(record);
}

function hasExplicitSoldTransactionProof(record = {}) {
  const amount = getVisibleItemPriceAmount(record);
  if (!Number.isFinite(amount) || amount <= 0) {
    return false;
  }
  const text = normalizeComparableText(stripSystemPriceEvidenceLabels(buildComparableEvidenceText(record, { includeSystemLabels: false })));
  if (/\b(?:not\s+sold|no\s+sold|without\s+confirmed\s+sale|not\s+a\s+sold\s+listing|ended\s+listing\s+without\s+confirmed\s+sale)\b/i.test(text)) {
    return false;
  }
  const hasTransactionLanguage = /\b(?:sold\s+for|sold\s+at|verified\s+sold\s+price|confirmed\s+sold\s+price|sold\s+price|final\s+sale\s+price|price\s+realized|hammer\s+price|completed\s+sale|completed\s+transaction|closed\s+transaction|auction\s+result|winning\s+bid|won\s+for)\b/i.test(text)
    || (isFacebookMarketplaceRecord(record) && /\b(?:marked\s+sold|sold\s+on\s+facebook\s+marketplace|facebook\s+marketplace\s+sold|completed\s+sale)\b/i.test(text));
  if (!hasTransactionLanguage) {
    return false;
  }
  if (isSocialOrEditorialSourceRecord(record) && !isFacebookMarketplaceRecord(record)) {
    return false;
  }
  return !isBulkLotReferenceWithoutUnitPrice(record);
}

function isCurrentPurchasableSourceRecord(record = {}) {
  const priceType = normalizePriceTypeLabel(record.priceType || record.priceEvidenceType, record);
  const text = normalizeComparableText(buildComparableEvidenceText(record, { includeSystemLabels: false }));
  return /Active Asking/i.test(priceType)
    && !isNonTransactionalContentRecord(record)
    && !/\b(?:sold|completed|ended|unavailable|removed|out\s+of\s+stock|price\s+guide|reference\s+only)\b/i.test(text);
}

function canInfluenceValuationFromVisibleRecord(record = {}) {
  if (!record || typeof record === "string") {
    return false;
  }
  if (!canSupportPreliminaryAskingRangeFromVisibleRecord(record)) {
    return false;
  }
  const influenceText = cleanText(record.influencedReferenceRange).toLowerCase();
  if (/^no\b|not valuation|must not influence|product type differs|product form|candidate product type not established/.test(influenceText)) {
    return false;
  }
  if (record.itemTypeCompatible === false || cleanText(record.itemTypeCompatible).toLowerCase() === "false") {
    return false;
  }
  if (/mismatch|unknown|scope/.test(cleanText(record.itemTypeCompatibilityStatus).toLowerCase())) {
    return false;
  }
  if (/not valuation support|identity\/reference context only|weak match|directional context only|rejected/i.test(record.evidenceRole || "")) {
    return false;
  }
  return /exact|strong/i.test(record.classification || record.identityMatchStrength || record.matchExplanation || record.rawText || "");
}

function canSupportPreliminaryAskingRangeFromVisibleRecord(record = {}) {
  if (!record || typeof record === "string" || !isUsableSourceRecord(record)) {
    return false;
  }
  if (isBulkLotReferenceWithoutUnitPrice(record) || isNonTransactionalContentRecord(record)) {
    return false;
  }
  if (record.itemTypeCompatible === false || cleanText(record.itemTypeCompatible).toLowerCase() === "false") {
    return false;
  }
  if (/mismatch|unknown|scope/.test(cleanText(record.itemTypeCompatibilityStatus).toLowerCase())) {
    return false;
  }
  if (!/exact|strong|partial/i.test(record.classification || record.identityMatchStrength || "")) {
    return false;
  }
  if (/weak|rejected/i.test(record.classification || record.evidenceRole || "")) {
    return false;
  }
  const amount = getVisibleItemPriceAmount(record);
  if (!Number.isFinite(amount) || amount <= 0) {
    return false;
  }
  return !/Unknown Price Type|No Usable Price Evidence|Reference Without Price|Non-Transactional Reference|Bulk\/Lot Reference/i.test(normalizePriceTypeLabel(record.priceType || record.priceEvidenceType, record));
}

function buildConsumerPricesFound(liveSearch = {}, askingPriceNumber = null, { excludeRangeOutlierUrls = [] } = {}) {
  const excluded = new Set(excludeRangeOutlierUrls.map((url) => canonicalizeComparableUrl(url) || cleanText(url)).filter(Boolean));
  const candidateRecords = [
    ...normalizeResearchRecordArray(liveSearch.strongComparables, "strongComparables"),
    ...normalizeResearchRecordArray(liveSearch.partialComparables, "partialComparables"),
    ...normalizeResearchRecordArray(liveSearch.referenceResults, "referenceResults")
  ];
  const byListing = new Map();

  for (const record of candidateRecords) {
    if (!isPriceFoundEligible(record)) {
      continue;
    }
    const enriched = buildPriceFoundRecord(record, askingPriceNumber);
    const key = canonicalizeComparableUrl(enriched.url) || `${enriched.title}|${enriched.source}|${enriched.itemPrice}`.toLowerCase();
    if (excluded.has(canonicalizeComparableUrl(enriched.url) || cleanText(enriched.url))) {
      continue;
    }
    const existing = byListing.get(key);
    if (!existing || priceFoundSortRank(enriched) < priceFoundSortRank(existing)) {
      byListing.set(key, enriched);
    }
  }

  return [...byListing.values()]
    .sort(comparePriceFoundRecords)
    .slice(0, 8);
}

function dedupeResearchRecordsByListing(records = []) {
  const byListing = new Map();
  for (const record of records) {
    const key = canonicalizeComparableUrl(record.canonicalUrl || record.url)
      || `${cleanText(record.title)}|${cleanText(record.source)}|${cleanText(record.displayedPrice || record.price)}`.toLowerCase();
    if (!key) {
      continue;
    }
    const existing = byListing.get(key);
    if (!existing) {
      byListing.set(key, record);
      continue;
    }
    const existingScore = canInfluenceValuationFromVisibleRecord(existing) ? 2 : canSupportPreliminaryAskingRangeFromVisibleRecord(existing) ? 1 : 0;
    const incomingScore = canInfluenceValuationFromVisibleRecord(record) ? 2 : canSupportPreliminaryAskingRangeFromVisibleRecord(record) ? 1 : 0;
    if (incomingScore > existingScore) {
      byListing.set(key, record);
    }
  }
  return [...byListing.values()];
}

function isPriceFoundEligible(record = {}) {
  if (!record || typeof record === "string" || !record.url || !isUsableSourceRecord(record)) {
    return false;
  }
  if (isBulkLotReferenceWithoutUnitPrice(record) || isNonTransactionalContentRecord(record)) {
    return false;
  }
  if (record.itemTypeCompatible === false || cleanText(record.itemTypeCompatible).toLowerCase() === "false") {
    return false;
  }
  if (/mismatch|unknown|scope/.test(cleanText(record.itemTypeCompatibilityStatus).toLowerCase())) {
    return false;
  }
  if (!/exact|strong|partial/i.test(record.classification || record.identityMatchStrength || "")) {
    return false;
  }
  if (/weak|rejected/i.test(record.classification || record.evidenceRole || "")) {
    return false;
  }
  if (/Non-Transactional Reference|Bulk\/Lot Reference|No Usable Price Evidence|Reference Without Price/i.test(normalizePriceTypeLabel(record.priceType || record.priceEvidenceType, record))) {
    return false;
  }
  const amount = getVisibleItemPriceAmount(record);
  return Number.isFinite(amount) && amount > 0;
}

function buildPriceFoundRecord(record = {}, askingPriceNumber = null) {
  const itemAmount = getVisibleItemPriceAmount(record);
  const shipping = extractShippingEvidence(record);
  const deliveredAmount = Number.isFinite(itemAmount) && shipping.deliveredCostSupported && Number.isFinite(shipping.amount)
    ? Math.round((itemAmount + shipping.amount) * 100) / 100
    : null;
  const priceType = normalizePriceTypeLabel(record.priceType || record.priceEvidenceType, record);
  const listingStatus = inferPriceFoundListingStatus(record, priceType);
  const includedInPreliminaryRange = canSupportPreliminaryAskingRangeFromVisibleRecord(record);
  const influencedVerified = isQualifiedVerifiedSoldPriceEvidence(record, priceType, cleanText(record.classification || record.identityMatchStrength)) && canInfluenceValuationFromVisibleRecord(record);

  return {
    title: cleanText(record.title) || "Source result",
    source: cleanText(record.source) || inferSourceFromResult(record.rawText, record.url),
    marketplace: cleanText(record.source) || inferSourceFromResult(record.rawText, record.url),
    url: cleanText(record.url),
    canonicalUrl: cleanText(record.canonicalUrl) || canonicalizeComparableUrl(record.url) || cleanText(record.url),
    itemPrice: Number.isFinite(itemAmount) ? formatSourceMoney(itemAmount) : cleanText(record.displayedPrice || record.price),
    itemPriceAmount: Number.isFinite(itemAmount) ? itemAmount : null,
    shipping: shipping.label,
    shippingAmount: Number.isFinite(shipping.amount) ? shipping.amount : null,
    shippingStatus: shipping.status,
    shippingDisclosure: shipping.disclosure,
    deliveredCost: Number.isFinite(deliveredAmount) ? formatSourceMoney(deliveredAmount) : "Not established",
    deliveredCostAmount: Number.isFinite(deliveredAmount) ? deliveredAmount : null,
    deliveredCostStatus: Number.isFinite(deliveredAmount) ? "established" : "not_established",
    priceType,
    matchQuality: cleanText(record.classification || record.identityMatchStrength) || "Comparable Match",
    listingStatus,
    conciseLimitation: buildPriceFoundLimitation(record, priceType, shipping, listingStatus),
    comparisonToYourPrice: buildPriceFoundComparison({ askingPriceNumber, itemAmount, shipping, deliveredAmount, priceType }),
    includedInPreliminaryAskingPriceRange: includedInPreliminaryRange ? "Yes" : "No",
    influencedVerifiedMarketRange: influencedVerified ? "Yes" : "No",
    itemTypeCompatible: record.itemTypeCompatible === true,
    submittedItemType: cleanText(record.submittedItemType),
    candidateItemType: cleanText(record.candidateItemType),
    condition: cleanText(record.condition),
    sourceBacked: cleanText(record.sourceBacked),
    rawText: cleanText(record.rawText)
  };
}

function normalizePriceTypeLabel(priceType = "", record = {}) {
  if (isBulkLotReferenceWithoutUnitPrice(record)) {
    return "Bulk/Lot Reference";
  }
  if (isNonTransactionalContentRecord(record)) {
    return "Non-Transactional Reference";
  }
  const text = normalizeComparableText([
    priceType,
    record.priceType,
    record.priceEvidenceType,
    record.activeSoldReferenceStatus,
    record.title,
    record.snippet,
    record.rawText
  ].join(" "));
  if (/\b(sold for|sold price|price realized|hammer price|final sale price|confirmed sold|verified sold)\b/i.test(text)) {
    return hasExplicitSoldTransactionProof(record) ? "Verified Sold" : "Reference Price";
  }
  if (/\b(current bid|current auction bid|bid currently|latest bid)\b/i.test(text)) {
    return "Auction Current Bid";
  }
  if (/\b(opening bid|starting bid|start bid|min(?:imum)? bid)\b/i.test(text)) {
    return "Auction Opening Bid";
  }
  if (/\b(estimated|estimate|guide price|price guide|appraisal|book value)\b/i.test(text)) {
    return "Estimated/Guide Price";
  }
  if (/\b(active asking|shopping offer|asking price|listed price|for sale|current listing|active\/reference asking|active listing)\b/i.test(text)) {
    return "Active Asking";
  }
  if (/\b(reference price|reference\/no-price|reference|ended listing without confirmed sale|ended|completed)\b/i.test(text)) {
    return "Reference Price";
  }
  return "Unknown Price Type";
}

function getVisibleItemPriceAmount(record = {}) {
  const amount = extractFirstMoneyAmount(record.displayedPrice || record.displayedPriceText || record.price);
  if (Number.isFinite(amount) && amount > 0) {
    return amount;
  }
  return Number.isFinite(record.parsedPrice) && record.parsedPrice > 0 ? record.parsedPrice : null;
}

function extractShippingEvidence(record = {}) {
  const text = [
    record.shipping,
    record.delivery,
    record.rawText,
    record.snippet,
    record.title
  ].map(cleanText).join(" ");
  if (/\b(?:pickup\s+only|local\s+pickup|local\s+collection|pick\s*up\s+only)\b/i.test(text)) {
    return {
      status: "pickup",
      label: "Pickup only",
      amount: null,
      deliveredCostSupported: false,
      disclosure: "Pickup only; no shipped delivered cost was shown."
    };
  }
  if (/\b(?:calculated\s+(?:at\s+checkout|shipping)|shipping\s+calculated|calculated\s+delivery)\b/i.test(text)) {
    return {
      status: "calculated",
      label: "Calculated at checkout",
      amount: null,
      deliveredCostSupported: false,
      disclosure: "Shipping was calculated at checkout and no supported amount was visible."
    };
  }
  if (/\b(?:shipping|delivery)\s+(?:included|is\s+included|included\s+in\s+(?:price|total))\b|\b(?:price|total)\s+includes\s+(?:shipping|delivery)\b/i.test(text)) {
    return {
      status: "included",
      label: "Included",
      amount: 0,
      deliveredCostSupported: true,
      disclosure: "Shipping was explicitly shown as included."
    };
  }
  if (/\b(?:free\s+(?:shipping|delivery)|(?:shipping|delivery)\s*[:=-]?\s*free)\b/i.test(text)) {
    return {
      status: "free",
      label: "Free",
      amount: 0,
      deliveredCostSupported: true,
      disclosure: "Shipping was explicitly shown as free."
    };
  }
  const amountMatch = text.match(/\b(?:shipping|delivery)(?:\s+(?:charge|cost|fee))?\s*(?:is|:|=|-)?\s*(\$?\s*\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/i)
    || text.match(/(\$\s*\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:shipping|delivery)\b/i);
  if (amountMatch) {
    const amount = extractFirstMoneyAmount(amountMatch[1]);
    if (Number.isFinite(amount)) {
      return {
        status: "known",
        label: formatSourceMoneyWithCents(amount),
        amount,
        deliveredCostSupported: true,
        disclosure: `Shipping was shown as ${formatSourceMoneyWithCents(amount)}.`
      };
    }
  }
  return {
    status: "unknown",
    label: "Not shown",
    amount: null,
    deliveredCostSupported: false,
    disclosure: "Shipping was not shown."
  };
}

function inferPriceFoundListingStatus(record = {}, priceType = "") {
  const text = normalizeComparableText([record.title, record.snippet, record.rawText, record.activeSoldReferenceStatus].join(" "));
  if (/Bulk\/Lot Reference/i.test(priceType)) {
    return "Bulk/lot reference - unit price not established";
  }
  if (/Non-Transactional Reference/i.test(priceType)) {
    return "Non-transactional reference - not a market transaction";
  }
  if (/\b(unavailable|removed|out of stock|no longer available|cached|stale)\b/i.test(text)) {
    return "Unavailable/stale reference - not confirmed as currently purchasable";
  }
  if (/Verified Sold/i.test(priceType)) {
    return "Historical sold evidence - not a current purchasing option";
  }
  if (/Auction Current Bid/i.test(priceType)) {
    return "Current auction bid - not a final sale value";
  }
  if (/Auction Opening Bid/i.test(priceType)) {
    return "Auction opening bid - not a final sale value";
  }
  if (/Active Asking/i.test(priceType)) {
    return "Active asking/listed price - current availability not independently confirmed";
  }
  if (/Estimated|Guide|Reference/i.test(priceType)) {
    return "Reference price - not confirmed as a current sale or purchase option";
  }
  return "Price visible, but status is not confirmed";
}

function buildPriceFoundLimitation(record = {}, priceType = "", shipping = {}, listingStatus = "") {
  const limits = [];
  if (/Bulk\/Lot Reference/i.test(priceType)) {
    limits.push("Bulk/lot reference - unit price not established.");
  }
  if (/Non-Transactional Reference/i.test(priceType)) {
    limits.push("Non-transactional content; do not use it as completed sale or current purchase evidence.");
  }
  if (!/Verified Sold/i.test(priceType)) {
    limits.push(`${priceType} is not verified sold value.`);
  }
  if (shipping.status === "unknown") {
    limits.push("Shipping was not shown, so delivered cost cannot be confirmed.");
  } else if (shipping.status === "calculated") {
    limits.push("Shipping is calculated at checkout, so delivered cost is not established.");
  } else if (shipping.status === "pickup") {
    limits.push("Pickup-only result; compare against local pickup cost, not shipped delivery.");
  }
  if (/partial/i.test(record.classification || "")) {
    limits.push(cleanText(record.itemIdentityDifferences) || "Partial compatible match; exact details differ or remain unknown.");
  }
  if (/unavailable|stale|historical/i.test(listingStatus)) {
    limits.push("Do not treat this as a currently purchasable alternative.");
  }
  limits.push("Taxes or other checkout charges may still apply if not shown by the source.");
  return limits.filter(Boolean).join(" ");
}

function buildPriceFoundComparison({ askingPriceNumber, itemAmount, shipping, deliveredAmount, priceType }) {
  if (!Number.isFinite(askingPriceNumber) || askingPriceNumber <= 0 || !Number.isFinite(itemAmount)) {
    return "No entered purchase price was available for a direct comparison.";
  }
  if (/Verified Sold|Estimated|Guide|Reference|Unknown|Auction/i.test(priceType)) {
    return "Useful price context, but not a confirmed currently purchasable delivered-cost alternative.";
  }
  if (Number.isFinite(deliveredAmount)) {
    if (deliveredAmount < askingPriceNumber) {
      return "A compatible active listing was found at a lower delivered cost.";
    }
    if (itemAmount < askingPriceNumber && deliveredAmount > askingPriceNumber) {
      return "The online item price is lower, but its delivered cost is higher after shipping.";
    }
    if (Math.abs(deliveredAmount - askingPriceNumber) < 0.01) {
      return "The delivered cost is about the same as the entered purchase price.";
    }
    return `Your ${formatMoney(askingPriceNumber)} purchase price appears competitive with this compatible active asking price once delivered cost is considered.`;
  }
  if (shipping.status === "unknown" && itemAmount < askingPriceNumber) {
    return "A lower item price was found, but this listing may not be the lowest total cost because shipping was not shown.";
  }
  if (shipping.status === "unknown") {
    return `Your ${formatMoney(askingPriceNumber)} purchase price appears competitive with this compatible item price, but shipping was not shown.`;
  }
  return "Delivered cost was not established from the visible source details.";
}

function priceFoundSortRank(record = {}) {
  if (/Active Asking/i.test(record.priceType) && Number.isFinite(record.deliveredCostAmount)) return 1;
  if (/Active Asking/i.test(record.priceType)) return 2;
  if (/Verified Sold/i.test(record.priceType)) return 3;
  if (/Auction Current Bid|Auction Opening Bid/i.test(record.priceType)) return 4;
  return 5;
}

function comparePriceFoundRecords(a, b) {
  const rankDelta = priceFoundSortRank(a) - priceFoundSortRank(b);
  if (rankDelta) return rankDelta;
  const aDelivered = Number.isFinite(a.deliveredCostAmount) ? a.deliveredCostAmount : Number.POSITIVE_INFINITY;
  const bDelivered = Number.isFinite(b.deliveredCostAmount) ? b.deliveredCostAmount : Number.POSITIVE_INFINITY;
  if (aDelivered !== bDelivered) return aDelivered - bDelivered;
  const aPrice = Number.isFinite(a.itemPriceAmount) ? a.itemPriceAmount : Number.POSITIVE_INFINITY;
  const bPrice = Number.isFinite(b.itemPriceAmount) ? b.itemPriceAmount : Number.POSITIVE_INFINITY;
  return aPrice - bPrice;
}

function compareCompatiblePriceContext(a, b) {
  const aHasDelivered = Number.isFinite(a.deliveredCostAmount);
  const bHasDelivered = Number.isFinite(b.deliveredCostAmount);
  if (aHasDelivered && bHasDelivered && a.deliveredCostAmount !== b.deliveredCostAmount) {
    return a.deliveredCostAmount - b.deliveredCostAmount;
  }
  if (aHasDelivered !== bHasDelivered) {
    return aHasDelivered ? -1 : 1;
  }
  const aPrice = Number.isFinite(a.itemPriceAmount) ? a.itemPriceAmount : Number.POSITIVE_INFINITY;
  const bPrice = Number.isFinite(b.itemPriceAmount) ? b.itemPriceAmount : Number.POSITIVE_INFINITY;
  if (aPrice !== bPrice) return aPrice - bPrice;
  return priceFoundSortRank(a) - priceFoundSortRank(b);
}

function priceContextKey(record = {}) {
  return canonicalizeComparableUrl(record.canonicalUrl || record.url)
    || `${cleanText(record.title)}|${cleanText(record.source)}|${cleanText(record.itemPrice)}`.toLowerCase();
}

function annotatePriceContextRecord(record = {}, label = "", summary = "") {
  return {
    ...record,
    priceContextLabel: label,
    priceContextSummary: summary
  };
}

function isCurrentPurchasablePriceFoundRecord(record = {}) {
  return /Active Asking|Shopping Offer|Current Retail Price/i.test(record.priceType || record.priceTypeLabel || "")
    && !/historical|sold|reference|auction|not a current purchasing option|not confirmed as currently purchasable|unavailable|stale/i.test(record.listingStatus || "")
    && !/Non-Transactional Reference|Bulk\/Lot Reference|Verified Sold|Estimated|Guide|Reference|Auction/i.test(record.priceType || "");
}

function getRetailEvidenceMode({ buyerIntake = normalizeBuyerIntake({}), identity = {} } = {}) {
  if (isOrdinaryCurrentRetailProduct({ buyerIntake, identity })) {
    return "current-retail-only";
  }
  if ((isRetailStorePurchaseContext(buyerIntake.purchase_context) || isOnlineRetailerPurchaseContext(buyerIntake.purchase_context))
    && /\b(?:discontinued|retired|unavailable|out\s+of\s+stock|no\s+longer\s+made|secondary\s+market|replacement)\b/i.test(buildConsumerRiskContextText({ buyerIntake, identity }))) {
    return "secondary-market-replacement";
  }
  return "collectible-resale";
}

function getRetailRouteClassification({ buyerIntake = normalizeBuyerIntake({}), identity = {} } = {}) {
  if (isOrdinaryCurrentRetailProduct({ buyerIntake, identity })) {
    return "Ordinary Current Retail Product";
  }
  const text = buildConsumerRiskContextText({ buyerIntake, identity });
  if (/\b(?:discontinued|retired|unavailable|out\s+of\s+stock|no\s+longer\s+made|secondary\s+market|replacement)\b/i.test(text)) {
    return "Secondary-Market Replacement Product";
  }
  return "Collectible / Resale Product";
}

function isCurrentRetailOnlyMode(mode) {
  return cleanText(mode).toLowerCase() === "current-retail-only";
}

function isOrdinaryCurrentRetailProduct({ buyerIntake = normalizeBuyerIntake({}), identity = {} } = {}) {
  const purchaseContext = normalizePurchaseContext(buyerIntake.purchase_context);
  const retailContext = isRetailStorePurchaseContext(purchaseContext) || isOnlineRetailerPurchaseContext(purchaseContext);
  if (!retailContext) {
    return false;
  }
  const text = buildConsumerRiskContextText({ buyerIntake, identity });
  const hasIdentifier = Boolean(
    getSearchBarcodeDigits(identity, buyerIntake)
    || hasKnownValue(buyerIntake.known_sku)
    || hasKnownValue(buyerIntake.known_model)
    || hasKnownValue(identity.sku)
    || hasKnownValue(identity.model)
  );
  const ordinaryRetailSignals = /\b(?:upc|barcode|sku|model|retail|store|kroger|walmart|target|staples|office depot|officeworks|office works|envelopes?|security envelopes?|stationery|office supplies?|grocery|household|consumable|pack|count|ct|box|carton|current product|new product)\b/i.test(text);
  const collectibleSignals = /\b(?:vintage|antique|collectible|memorabilia|commemorative|rare|limited edition|numbered edition|one[-\s]?of[-\s]?a[-\s]?kind|handmade|custom|estate sale|flea market|thrift|yard sale|secondhand|resale|used|pre[-\s]?owned|etsy|mercari|ebay|auction|worthpoint|picclick|historical sold|retired logo|retired design)\b/i.test(text);
  const discontinuedSignals = /\b(?:discontinued|retired product|no longer made|out of stock everywhere|secondary-market replacement)\b/i.test(text);
  return (hasIdentifier || ordinaryRetailSignals) && !collectibleSignals && !discontinuedSignals;
}

function isRetailForbiddenSecondaryEvidenceText(value = "") {
  return /\b(?:sold|completed|ended listing|historical|auction|bid|hammer price|price realized|worthpoint|picclick|ebay sold|etsy vintage|mercari sold|collector value|collectible value|resale value|thrift|flea market|estate sale|active resale|used marketplace|pre[-\s]?owned|secondhand)\b/i.test(cleanText(value));
}

function stripRetailSecondaryMarketQueryTerms(query = "") {
  return cleanSearchQuery(cleanText(query)
    .replace(/\b(?:sold|completed|historical|auction|bid|worthpoint|picclick|ebay sold|etsy vintage|mercari sold|collector value|collectible value|resale value)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim(), 18);
}

function classifyRetailPackageCompatibility(record = {}, identity = {}, buyerIntake = normalizeBuyerIntake({})) {
  const submittedQuantity = extractBestPackQuantityNumber([
    identity.packageQuantity,
    identity.unitCount,
    identity.packageSize,
    identity.dimensions,
    buyerIntake.item_name,
    buyerIntake.buyer_notes
  ]);
  const candidateQuantity = extractBestPackQuantityNumber([
    record.title,
    record.rawText,
    record.snippet,
    record.conciseLimitation
  ]);
  const submittedText = cleanText([
    identity.productNameOrBoxTitle,
    identity.category,
    identity.likelyItemDescription,
    buyerIntake.item_name,
    buyerIntake.buyer_notes
  ].join(" ")).toLowerCase();
  const candidateText = cleanText([
    record.title,
    record.rawText,
    record.snippet
  ].join(" ")).toLowerCase();
  const text = cleanText([submittedText, candidateText].join(" ")).toLowerCase();
  const submittedIsEnvelope = /\benvelopes?\b/.test(submittedText);
  const candidateIsEnvelope = /\benvelopes?\b/.test(candidateText);
  const submittedNeedsSecurity = submittedIsEnvelope && /\b(?:security|privacy|confidential|inside\s+security|security\s+tint)\b/.test(submittedText);
  const candidateHasSecurity = /\b(?:security|privacy|confidential|inside\s+security|security\s+tint)\b/.test(candidateText);
  const submittedBrand = cleanText(firstKnown(identity.brand, identity.manufacturer, buyerIntake.known_brand));
  const submittedIdentifier = cleanText(firstKnown(identity.upcBarcode, identity.sku, identity.model, identity.styleNumber, buyerIntake.known_upc, buyerIntake.known_sku, buyerIntake.known_model));
  const candidateHasSubmittedBrand = submittedBrand && containsNormalizedPhrase(candidateText, submittedBrand);
  const candidateHasSubmittedIdentifier = submittedIdentifier && containsNormalizedPhrase(candidateText, submittedIdentifier);

  if (submittedIsEnvelope && !candidateIsEnvelope) {
    return {
      status: "materially_incompatible",
      label: "Rejected Retail Mismatch",
      reason: "Submitted product is an envelope package, but the result did not clearly describe envelopes."
    };
  }
  if (submittedNeedsSecurity && !candidateHasSecurity) {
    return {
      status: "materially_incompatible",
      label: "Rejected Retail Mismatch",
      reason: "Security-envelope evidence was not compatible with a non-security envelope result."
    };
  }
  if (Number.isFinite(submittedQuantity) && Number.isFinite(candidateQuantity) && submittedQuantity > 0 && candidateQuantity > 0) {
    if (submittedQuantity === candidateQuantity) {
      if (!candidateHasSubmittedIdentifier && !(candidateHasSubmittedBrand && /exact/i.test(record.matchQuality || record.classification || record.identityMatchStrength || ""))) {
        return {
          status: "strong_retail_alternative",
          label: "Strong Retail Alternative",
          reason: `Package count matches at ${submittedQuantity} units, but the exact UPC/SKU/private-label product was not confirmed.`
        };
      }
      return {
        status: "exact_package_match",
        label: "Exact Retail Match",
        reason: `Exact identifier or brand/product support and package count match at ${submittedQuantity} units.`
      };
    }
    const ratio = Math.max(submittedQuantity, candidateQuantity) / Math.min(submittedQuantity, candidateQuantity);
    if (ratio <= 1.25 || (submittedQuantity === 45 && candidateQuantity === 50) || (submittedQuantity === 50 && candidateQuantity === 45)) {
      return {
        status: "strong_retail_alternative",
        label: "Strong Retail Alternative",
        reason: `${submittedQuantity}-count and ${candidateQuantity}-count packages are close enough for unit-price comparison, not exact package-price comparison.`
      };
    }
    if (ratio <= 2.5) {
      return {
        status: "unit_price_only",
        label: "Unit-Price Comparable",
        reason: `${candidateQuantity}-count package may be unit-price comparable but is not an exact package-price match to ${submittedQuantity}-count.`
      };
    }
    return {
      status: "materially_incompatible",
      label: "Rejected Retail Mismatch",
      reason: `Package count differs too much for retail price comparison (${submittedQuantity} vs ${candidateQuantity}).`
    };
  }
  if (/\bstrip[-\s]?and[-\s]?seal\b/i.test(text) && /\bgummed\b/i.test(text)) {
    return {
      status: "strong_retail_alternative",
      label: "Strong Retail Alternative",
      reason: "Strip-and-seal and gummed closures may be compatible alternatives, but they are not exact package matches."
    };
  }
  return {
    status: "unknown_or_not_applicable",
    label: /exact|strong/i.test(record.matchQuality || record.classification || record.identityMatchStrength || "") ? "Strong Retail Alternative" : "Retail Category Context",
    reason: "Package compatibility should be verified from the source."
  };
}

function isQualifiedCurrentRetailPriceFoundRecord(record = {}, identity = {}, buyerIntake = normalizeBuyerIntake({})) {
  if (!record || typeof record !== "object" || !record.url || !Number.isFinite(record.itemPriceAmount)) {
    return false;
  }
  const text = [
    record.source,
    record.marketplace,
    record.title,
    record.priceType,
    record.listingStatus,
    record.conciseLimitation,
    record.rawText,
    record.url
  ].map(cleanText).join(" ");
  if (isRetailForbiddenSecondaryEvidenceText(text)) {
    return false;
  }
  if (!isCurrentPurchasablePriceFoundRecord(record)) {
    return false;
  }
  const packageCompatibility = classifyRetailPackageCompatibility(record, identity, buyerIntake);
  return packageCompatibility.status !== "materially_incompatible" && packageCompatibility.label !== "Retail Category Context";
}

function isQualifiedCurrentRetailSourceRecord(record = {}, context = {}) {
  if (!record || typeof record !== "object" || !record.url || !isUsableSourceRecord(record)) {
    return false;
  }
  const amount = getVisibleItemPriceAmount(record);
  if (!Number.isFinite(amount) || amount <= 0) {
    return false;
  }
  const text = [
    record.source,
    record.domain,
    record.title,
    record.snippet,
    record.rawText,
    record.priceType,
    record.priceEvidenceType,
    record.activeSoldReferenceStatus,
    record.url
  ].map(cleanText).join(" ");
  if (isRetailForbiddenSecondaryEvidenceText(text)) {
    return false;
  }
  if (!/Active Asking/i.test(normalizePriceTypeLabel(record.priceType || record.priceEvidenceType, record))
    && !/\b(?:in stock|pickup|delivery|add to cart|current price|shopping offer|retail price|store price)\b/i.test(text)) {
    return false;
  }
  if (/\b(?:unavailable|out\s+of\s+stock|not\s+available|removed|stale|cached)\b/i.test(text)) {
    return false;
  }
  if (record.itemTypeCompatible === false || /mismatch/i.test(cleanText(record.itemTypeCompatibilityStatus || record.rejectionReason))) {
    return false;
  }
  if (context && isCurrentRetailOnlyMode(context.retailEvidenceMode)) {
    const fakeIdentity = {
      packageQuantity: context.packageQuantity,
      unitCount: context.packageQuantity,
      packageSize: context.packageSize,
      productNameOrBoxTitle: context.productTitle,
      category: context.itemType,
      likelyItemDescription: context.subjectIdentity
    };
    const fakeIntake = normalizeBuyerIntake({
      purchase_context: context.purchaseContext,
      item_name: context.productTitle,
      buyer_notes: context.notesText
    });
    const compatibility = classifyRetailPackageCompatibility(record, fakeIdentity, fakeIntake);
    return compatibility.status !== "materially_incompatible" && compatibility.label !== "Retail Category Context";
  }
  return true;
}

function buildRetailEvidenceProfile({ buyerIntake = normalizeBuyerIntake({}), identity = {}, liveSearch = {}, pricesFound = [], askingPriceNumber = null, searchCompleted = false } = {}) {
  const retailEvidenceMode = getRetailEvidenceMode({ buyerIntake, identity });
  const retailRouteClassification = getRetailRouteClassification({ buyerIntake, identity });
  const currentRetailOnly = isCurrentRetailOnlyMode(retailEvidenceMode);
  const storeName = getRetailStoreName(buyerIntake);
  const allPrices = normalizeArray(pricesFound).filter((item) => item && typeof item === "object");
  const acceptedPrices = currentRetailOnly
    ? allPrices.filter((record) => isQualifiedCurrentRetailPriceFoundRecord(record, identity, buyerIntake))
    : allPrices;
  const excludedPrices = currentRetailOnly
    ? allPrices.filter((record) => !acceptedPrices.includes(record))
    : [];
  const acceptedWithRetailLabels = acceptedPrices.map((record) => {
    const packageCompatibility = classifyRetailPackageCompatibility(record, identity, buyerIntake);
    const exactLabel = /exact/i.test(record.matchQuality || "") ? "Exact Retail Match" : packageCompatibility.label;
    const label = packageCompatibility.status === "exact_package_match" ? exactLabel : packageCompatibility.label;
    return {
      ...record,
      priceType: "Current Retail Price",
      priceTypeLabel: label,
      priceContextLabel: label,
      priceContextSummary: packageCompatibility.reason,
      retailPackageCompatibility: packageCompatibility.status
    };
  });
  const namedStorePrices = acceptedWithRetailLabels.filter((record) => storeName && [
    record.source,
    record.marketplace,
    record.title,
    record.url,
    record.rawText
  ].join(" ").toLowerCase().includes(storeName.toLowerCase().split(/\s+/)[0]));
  const exactRetail = acceptedWithRetailLabels.filter((record) => /exact/i.test(record.matchQuality || record.priceContextLabel || ""));
  const strongRetail = acceptedWithRetailLabels.filter((record) => /exact|strong/i.test(record.matchQuality || record.priceContextLabel || ""));
  const sorted = acceptedWithRetailLabels.slice().sort(compareCompatiblePriceContext);
  const amounts = sorted.map((record) => record.itemPriceAmount).filter(Number.isFinite).sort((a, b) => a - b);
  const unitAmounts = sorted.map((record) => {
    const quantity = extractPackQuantityNumber([record.title, record.rawText, record.conciseLimitation].join(" "));
    return Number.isFinite(record.itemPriceAmount) && Number.isFinite(quantity) && quantity > 0
      ? record.itemPriceAmount / quantity
      : null;
  }).filter(Number.isFinite).sort((a, b) => a - b);
  const submittedQuantity = extractPackQuantityNumber([
    identity.packageQuantity,
    identity.unitCount,
    identity.packageSize,
    identity.productNameOrBoxTitle,
    buyerIntake.item_name,
    buyerIntake.buyer_notes
  ].join(" "));
  const retailUnitName = /\benvelopes?\b/i.test([
    identity.productNameOrBoxTitle,
    identity.category,
    identity.likelyItemDescription,
    buyerIntake.item_name,
    buyerIntake.buyer_notes
  ].join(" ")) ? "envelope" : "unit";
  const retailRange = amounts.length >= 2 ? formatMoneyRangeFromAmounts(amounts[0], amounts[amounts.length - 1]) : "";
  const askingText = Number.isFinite(askingPriceNumber) ? formatMoney(askingPriceNumber) : "the entered store price";
  const unitRangeText = unitAmounts.length >= 2
    ? ` Unit prices ranged from ${formatUnitMoney(unitAmounts[0])} to ${formatUnitMoney(unitAmounts[unitAmounts.length - 1])} per ${retailUnitName}.`
    : unitAmounts.length === 1
      ? ` Unit price was ${formatUnitMoney(unitAmounts[0])} per ${retailUnitName} where quantity was visible.`
      : "";
  const askingUnitText = Number.isFinite(askingPriceNumber) && Number.isFinite(submittedQuantity) && submittedQuantity > 0
    ? ` The entered ${askingText} price equals approximately ${formatUnitMoney(askingPriceNumber / submittedQuantity)} per ${retailUnitName}.`
    : "";
  const best = sorted[0] ? annotatePriceContextRecord(
    sorted[0],
    "Best Current Retail Alternative",
    sorted[0].deliveredCostAmount
      ? `Lowest supported delivered cost found: ${sorted[0].deliveredCost}. Taxes may apply.`
      : "Lowest qualified current retail item price found. Shipping, pickup, taxes, or availability may still need source confirmation."
  ) : null;
  const noRetailPrice = "Current Retail Price: Not verified";
  const priceAssessment = !currentRetailOnly
    ? ""
    : amounts.length >= 2
      ? `${exactRetail.length >= 2 ? "Exact Current Retail Range" : "Compatible Current Retail Alternatives"}: ${retailRange} based on ${acceptedWithRetailLabels.length} qualified source-backed current retail price${acceptedWithRetailLabels.length === 1 ? "" : "s"}. ${exactRetail.length >= 2 ? "Exact package matches were found." : "An exact listing was not confirmed; compatible alternatives are not the same item."}${unitRangeText}${askingUnitText} Package size, unit price, shipping, pickup, taxes, and availability remain separate.`
      : amounts.length === 1
        ? `${exactRetail.length ? "Current Retail Price Found" : "Compatible Current Retail Alternative"}: ${formatMoney(amounts[0])} from ${sorted[0].source || "one source"}. ${exactRetail.length ? "" : "The exact product/package was not confirmed; compare unit price rather than treating this as the same package price. "}${unitRangeText}${askingUnitText} Confirm package size, taxes, availability, and pickup/delivery before relying on it.`
        : `${noRetailPrice}. No qualified source-backed current retail price passed exact/strong identity, package, and source checks.`;
  const namedStoreResult = buildNamedStoreRetailResult({
    storeName,
    namedStorePrices,
    liveSearch,
    searchCompleted,
    currentRetailOnly
  });
  const retailPurchaseDecision = !currentRetailOnly
    ? ""
    : amounts.length
      ? buildRetailPurchaseDecisionFromPrices({ askingPriceNumber, acceptedPrices: acceptedWithRetailLabels })
      : Number.isFinite(askingPriceNumber) && askingPriceNumber <= consumerDecisionThresholds.lowDollarCautiousBuyMax
        ? "Low-Risk Purchase - Price Not Verified"
        : "Current Retail Price Not Verified";
  const retailPriceLimit = !currentRetailOnly
    ? ""
    : amounts.length
      ? buildRetailPriceLimitFromPrices({ acceptedPrices: acceptedWithRetailLabels, askingPriceNumber })
      : "Retail Price Limit: Not established";

  return {
    retailEvidenceMode,
    retailRouteClassification,
    currentRetailOnly,
    storeName,
    acceptedPrices: acceptedWithRetailLabels,
    excludedPrices,
    namedStorePrices,
    exactRetailCount: exactRetail.length,
    strongRetailCount: strongRetail.length,
    currentRetailPriceAssessment: priceAssessment,
    namedStoreResult,
    bestCurrentRetailAlternative: best,
    otherCurrentRetailPrices: best
      ? sorted.filter((record) => priceContextKey(record) !== priceContextKey(best)).slice(0, 4)
      : sorted.slice(0, 4),
    packageUnitPriceComparison: buildRetailPackageUnitPriceComparison(identity, acceptedWithRetailLabels),
    localAvailabilityContext: buildRetailLocalAvailabilityContext(buyerIntake, liveSearch),
    retailPurchaseDecision,
    retailPriceLimit,
    askingStorePrice: Number.isFinite(askingPriceNumber)
      ? `Store/asking price entered: ${askingText}.`
      : buildConsumerAskingPriceText(buyerIntake, identity),
    priceConfidence: amounts.length
      ? ensureConfidenceLayer("", amounts.length >= 2 ? "Medium" : "Low", "Only qualified current retail price evidence was used. Verify package size, taxes, pickup/delivery, and availability.")
      : forceLowConfidence("", "No qualified current retail price was verified; retail decision is based only on entered price, item identity, and low-dollar exposure."),
    nextBestAction: amounts.length
      ? "Confirm exact package count, local availability, taxes, and pickup or delivery terms before purchasing."
      : "Confirm the shelf/app price at the named store, check the UPC/package count, and compare against a current retailer result before calling this a deal.",
    searchCompleted
  };
}

function buildNamedStoreRetailResult({ storeName = "", namedStorePrices = [], liveSearch = {}, searchCompleted = false, currentRetailOnly = false } = {}) {
  if (!currentRetailOnly) {
    return "";
  }
  const store = storeName || "Named store";
  if (namedStorePrices.length) {
    const first = namedStorePrices[0];
    const exact = /exact/i.test(first.matchQuality || first.priceContextLabel || "");
    return `${exact ? "Exact product price found" : "Compatible product price found"} at ${store}: ${first.itemPrice || "price shown"}${first.url ? " (source-backed)." : "."}`;
  }
  const attempted = normalizeStringArray(liveSearch.queriesActuallySent || liveSearch.searchQueries, 24)
    .some((query) => storeName && cleanText(query).toLowerCase().includes(storeName.toLowerCase()));
  if (storeName && attempted && searchCompleted) {
    return `${store} searched - exact product not found. No source-backed ${store} price was found in the current search.`;
  }
  if (storeName && searchCompleted) {
    return `${store} price unavailable. No source-backed ${store} price was found in the current search.`;
  }
  return `${store} availability not confirmed. No source-backed ${store} price was found in the current search.`;
}

function buildRetailPurchaseDecisionFromPrices({ askingPriceNumber, acceptedPrices = [] } = {}) {
  if (!Number.isFinite(askingPriceNumber) || !acceptedPrices.length) {
    return "Current Retail Price Found - Check Store Price";
  }
  const amounts = acceptedPrices.map((record) => Number.isFinite(record.deliveredCostAmount) ? record.deliveredCostAmount : record.itemPriceAmount).filter(Number.isFinite);
  if (!amounts.length) {
    return "Current Retail Price Found - Check Store Price";
  }
  const lowest = Math.min(...amounts);
  const highest = Math.max(...amounts);
  if (askingPriceNumber <= lowest) {
    return "Good Retail Price - Source-Backed";
  }
  if (askingPriceNumber <= highest * 1.1) {
    return "Reasonable Retail Price - Verify Package";
  }
  return "Compare Before Buying";
}

function buildRetailPriceLimitFromPrices({ acceptedPrices = [], askingPriceNumber = null } = {}) {
  const amounts = acceptedPrices.map((record) => Number.isFinite(record.deliveredCostAmount) ? record.deliveredCostAmount : record.itemPriceAmount).filter(Number.isFinite);
  if (!amounts.length) {
    return "Retail Price Limit: Not established";
  }
  const best = Math.min(...amounts);
  const label = Number.isFinite(askingPriceNumber) && askingPriceNumber <= best
    ? `Retail Price Limit: ${formatMoney(best)} before taxes and package/availability checks.`
    : `Retail Price Limit: ${formatMoney(Math.max(best, Math.min(...amounts)))} based on qualified current retail evidence.`;
  return `${label} Do not use secondary-market, auction, sold, or reference prices for this retail limit.`;
}

function buildRetailPackageUnitPriceComparison(identity = {}, pricesFound = []) {
  if (!pricesFound.length) {
    return "Package and unit price comparison: Not established because no qualified current retail price was verified.";
  }
  const rows = pricesFound.map((record) => {
    const amount = Number(record.itemPriceAmount);
    const quantity = extractPackQuantityNumber([record.title, record.rawText, record.conciseLimitation].join(" "));
    if (Number.isFinite(amount) && Number.isFinite(quantity) && quantity > 0) {
      return `${record.title || record.source}: package price ${formatMoney(amount)} for ${quantity} units (${formatUnitMoney(amount / quantity)} per unit). ${record.priceContextSummary || ""}`;
    }
    return `${record.title || record.source}: ${record.itemPrice || "price shown"}; unit price not established from visible package count.`;
  }).filter(Boolean).slice(0, 4);
  return rows.length ? rows.join(" ") : buildPackageUnitPriceContext(identity, pricesFound);
}

function buildRetailLocalAvailabilityContext(buyerIntake = normalizeBuyerIntake({}), liveSearch = {}) {
  const zip = normalizeZipCode(buyerIntake.location_zip);
  const permission = cleanText(buyerIntake.location_permission || buyerIntake.location_mode);
  const store = getRetailStoreName(buyerIntake);
  if (/denied/i.test(permission) && zip) {
    return `Location permission was not granted. ZIP ${zip} was entered manually. Try Location Again is available in the intake. ${store ? `${store} availability is not confirmed unless a source-backed store result says so.` : "Named-store availability is not confirmed unless source-backed."}`;
  }
  if (zip) {
    return `ZIP ${zip} was used for local retail context. Store inventory and pickup availability are not confirmed unless a source-backed result says so.`;
  }
  if (/browser_location/i.test(permission)) {
    return "Browser location was allowed for general local context; precise coordinates are not displayed. Store inventory still requires source-backed confirmation.";
  }
  return "Local availability was not verified. Enter ZIP or store context to improve retail coverage.";
}

function buildRetailCurrentPriceSpectrumSummary(profile = {}) {
  if (!profile.currentRetailOnly) {
    return "";
  }
  const prices = normalizeArray(profile.acceptedPrices);
  if (!prices.length) {
    return "Current retail price spectrum: not established because no qualified current retail prices were found.";
  }
  const amounts = prices.map((record) => record.itemPriceAmount).filter(Number.isFinite).sort((a, b) => a - b);
  if (amounts.length >= 2) {
    return `Current retail price spectrum uses qualified current retail evidence only: ${formatMoneyRangeFromAmounts(amounts[0], amounts[amounts.length - 1])}. Secondary-market, auction, sold, historical, guide, and reference prices are excluded.`;
  }
  return `Current retail price spectrum uses one qualified current retail price only: ${formatMoney(amounts[0])}. A range is not shown from a single source.`;
}

function applyCurrentRetailDecisionFirewall(report = {}, profile = {}) {
  if (!profile.currentRetailOnly) {
    return report;
  }
  const acceptedPrices = normalizeArray(profile.acceptedPrices);
  const hasRetailEvidence = acceptedPrices.length > 0;
  const forbiddenNotice = "Retail Evidence Mode: current-retail-only. Customer-facing retail price guidance uses only qualified current retail evidence; secondary-market, auction, sold, historical, guide, and reference prices are excluded from the retail decision.";
  const valueRating = hasRetailEvidence
    ? report.valueRating
    : "Price Not Verified - Low Financial Risk";
  const recommendation = profile.retailPurchaseDecision || (hasRetailEvidence ? report.recommendation : "Low-Risk Purchase - Price Not Verified");
  const priceAssessment = profile.currentRetailPriceAssessment || "Current Retail Price: Not verified.";

  return {
    ...report,
    retailEvidenceMode: profile.retailEvidenceMode,
    retailRouteClassification: profile.retailRouteClassification,
    retailPurchaseDecision: recommendation,
    askingStorePrice: profile.askingStorePrice,
    currentRetailPriceAssessment: priceAssessment,
    namedStoreResult: profile.namedStoreResult,
    bestCurrentRetailAlternative: profile.bestCurrentRetailAlternative,
    otherCurrentRetailPrices: profile.otherCurrentRetailPrices,
    packageUnitPriceComparison: profile.packageUnitPriceComparison,
    localAvailabilityContext: profile.localAvailabilityContext,
    retailPriceLimit: profile.retailPriceLimit,
    priceConfidence: profile.priceConfidence || report.priceConfidence,
    pricingConfidence: profile.priceConfidence || report.pricingConfidence,
    liveComparableSearchStatus: report.liveComparableSearchStatus,
    pricesFound: acceptedPrices,
    noCompatiblePricesFound: acceptedPrices.length
      ? ""
      : "Current Retail Price: Not verified. No qualified current retail prices were found.",
    bestCompatiblePriceFound: profile.bestCurrentRetailAlternative,
    otherCompatiblePricesFound: profile.otherCurrentRetailPrices,
    currentPurchaseOptionSummary: profile.currentRetailPriceAssessment,
    priceSpectrumSummary: buildRetailCurrentPriceSpectrumSummary(profile),
    retailPriceContext: profile.currentRetailPriceAssessment,
    packageUnitPriceContext: profile.packageUnitPriceComparison,
    localStoreContext: profile.localAvailabilityContext,
    verifiedMarketRange: "",
    currentAskingPriceRange: "",
    preliminaryReferenceRange: "",
    referenceRangeBasis: "",
    valuationEvidenceState: hasRetailEvidence ? "current_retail" : "retail_unverified",
    valuationEvidenceLabel: hasRetailEvidence ? "Current Retail Price Assessment" : "Current Retail Price Not Verified",
    valuationEvidenceExplanation: hasRetailEvidence
      ? "Qualified source-backed current retail evidence was used. Sold, auction, guide, reference, and secondary-market evidence did not set retail price guidance."
      : "No qualified source-backed current retail price was found. Retail value is not verified.",
    priceRangeAnalysis: hasRetailEvidence
      ? "Retail range analysis is limited to qualified current retail prices. A range is shown only when at least two qualified records exist."
      : "No retail range is shown because no qualified current retail price was verified.",
    customerPricingSummary: priceAssessment,
    priceBasis: ensurePrefix(report.priceBasis, forbiddenNotice),
    estimatedFairMarketValue: "",
    fairPriceRange: [],
    fairValueNotEstablished: hasRetailEvidence ? "" : "Current Retail Price: Not verified",
    valueRating,
    recommendation,
    buyerDecisionConfidence: hasRetailEvidence
      ? ensureConfidenceLayer(report.buyerDecisionConfidence, "Medium", "Current retail evidence was retained; verify store availability and package/unit match.")
      : "Low - current retail price was not verified with source-backed current retail evidence.",
    bestNextStep: profile.nextBestAction || report.bestNextStep,
    consumerDownsideRisk: report.consumerDownsideRisk,
    cautiousBuyExplanation: "",
    recommendedOffer: [],
    openingOffer: "",
    targetPurchasePrice: "",
    maximumRecommendedPrice: profile.retailPriceLimit,
    maximumRecommendedBuyPrice: profile.retailPriceLimit,
    maximumRecommendedPriceExplanation: "",
    walkAwayPrice: "",
    negotiationGuidance: "",
    reasonsToBuy: hasRetailEvidence ? normalizeFlexibleArray(report.reasonsToBuy, 4, []) : [],
    reasonsForCaution: mergeStringArrays(
      hasRetailEvidence ? report.reasonsForCaution : [],
      hasRetailEvidence
        ? ["Verify exact package count, local availability, taxes, and pickup/delivery terms."]
        : ["No source-backed current retail price was verified.", "Do not treat auction, sold, guide, reference, or resale evidence as the current retail price."],
      8
    ),
    productOrConditionRisks: report.productOrConditionRisks,
    betterValueConsiderations: hasRetailEvidence
      ? report.betterValueConsiderations
      : ["Current retail price was not verified. Confirm the named-store shelf/app price or a qualified current retailer price before calling this a deal."],
    currentPriceAssessment: priceAssessment,
    pricingRationale: ensurePrefix(profile.currentRetailPriceAssessment || report.pricingRationale, forbiddenNotice),
    searchDiagnostics: {
      ...(report.searchDiagnostics || {}),
      retailEvidenceMode: profile.retailEvidenceMode,
      retailRouteClassification: profile.retailRouteClassification,
      queriesSuppressed: "sold/auction/historical/collector/resale terms suppressed for current-retail-only evidence mode",
      customerFacingRetailEvidenceCount: acceptedPrices.length,
      referenceSecondaryEvidenceExcludedFromRetailDecision: Number(report.searchDiagnostics?.referenceSecondaryEvidenceExcludedFromRetailDecision || 0) + normalizeArray(profile.excludedPrices).length
    }
  };
}

function buildBestCompatiblePriceFound(pricesFound = []) {
  const records = pricesFound
    .filter((item) => Number.isFinite(item.itemPriceAmount))
    .filter(isCurrentPurchasablePriceFoundRecord);
  if (!records.length) {
    return null;
  }
  const knownDelivered = records
    .filter((item) => Number.isFinite(item.deliveredCostAmount))
    .sort(compareCompatiblePriceContext);
  if (knownDelivered.length) {
    const best = knownDelivered[0];
    return annotatePriceContextRecord(
      best,
      "Lowest Known Delivered Cost Found",
      `Lowest supported delivered cost found: ${best.deliveredCost}. Taxes may apply.`
    );
  }
  const lowestItem = records.slice().sort((a, b) => (a.itemPriceAmount || 0) - (b.itemPriceAmount || 0))[0];
  return annotatePriceContextRecord(
    lowestItem,
    "Lowest Current Visible Item Price Found",
    "Shipping was not shown for this current active item price, so it is not established as the lowest delivered cost."
  );
}

function buildCurrentPurchaseOptionSummary(pricesFound = []) {
  const currentOptions = pricesFound.filter(isCurrentPurchasablePriceFoundRecord);
  const knownDelivered = currentOptions.filter((item) => Number.isFinite(item.deliveredCostAmount));
  if (knownDelivered.length) {
    const lowest = knownDelivered.slice().sort(compareCompatiblePriceContext)[0];
    return `A compatible current purchasing option with confirmed delivered cost was found: ${lowest.deliveredCost}. Historical sold and reference prices are not treated as current best deals.`;
  }
  if (currentOptions.length) {
    return "Compatible current asking-price results were found, but no compatible current purchasing option had a confirmed delivered cost. Shipping, pickup, taxes, or checkout costs still need verification.";
  }
  if (pricesFound.some((item) => /Verified Sold|Reference|Auction|Guide|Estimated/i.test(item.priceType || ""))) {
    return "No compatible current purchasing option with a confirmed delivered cost was found. Historical sold, auction, guide, or reference prices are context only and are not a current best deal.";
  }
  return "No compatible current purchasing option with a confirmed delivered cost was found.";
}

function buildOtherCompatiblePricesFound(pricesFound = [], best = null) {
  const bestKey = best ? priceContextKey(best) : "";
  const candidates = pricesFound
    .filter((item) => Number.isFinite(item.itemPriceAmount) && priceContextKey(item) !== bestKey)
    .slice()
    .sort(compareCompatiblePriceContext);
  if (!candidates.length) {
    return [];
  }
  const selected = [];
  const add = (record) => {
    if (!record) return;
    const key = priceContextKey(record);
    if (!key || selected.some((item) => priceContextKey(item) === key)) return;
    selected.push(annotatePriceContextRecord(record, "Other compatible price found", "Useful compatible price context shown for comparison."));
  };
  add(candidates[0]);
  add(candidates[Math.floor(candidates.length / 2)]);
  add(candidates[candidates.length - 1]);
  add(candidates.find((item) => /Verified Sold/i.test(item.priceType)));
  add(candidates.find((item) => /Active Asking/i.test(item.priceType) && Number.isFinite(item.deliveredCostAmount)));
  add(candidates.find((item) => item.shippingStatus === "unknown"));
  return selected.slice(0, 4);
}

function buildPriceSpectrumSummary(pricesFound = []) {
  const records = pricesFound.filter((item) => Number.isFinite(item.itemPriceAmount));
  if (!records.length) {
    return "No compatible source-backed prices were found.";
  }
  const itemAmounts = records.map((item) => item.itemPriceAmount).filter(Number.isFinite).sort((a, b) => a - b);
  const deliveredAmounts = records.map((item) => item.deliveredCostAmount).filter(Number.isFinite).sort((a, b) => a - b);
  const unknownShippingCount = records.filter((item) => item.shippingStatus === "unknown").length;
  const calculatedShippingCount = records.filter((item) => item.shippingStatus === "calculated").length;
  const itemRange = itemAmounts.length
    ? formatMoneyRangeFromAmounts(itemAmounts[0], itemAmounts[itemAmounts.length - 1])
    : "";
  const deliveredRange = deliveredAmounts.length
    ? formatMoneyRangeFromAmounts(deliveredAmounts[0], deliveredAmounts[deliveredAmounts.length - 1])
    : "";
  const parts = [];
  if (itemRange) {
    parts.push(`Compatible visible item prices ranged from ${itemRange}.`);
  }
  if (deliveredRange) {
    parts.push(`Known delivered costs ranged from ${deliveredRange}.`);
  } else {
    parts.push("No delivered-cost range was established because shipping was not fully visible.");
  }
  if (unknownShippingCount) {
    parts.push(`${unknownShippingCount} result${unknownShippingCount === 1 ? "" : "s"} had shipping not shown; those item prices are not delivered totals.`);
  }
  if (calculatedShippingCount) {
    parts.push(`${calculatedShippingCount} result${calculatedShippingCount === 1 ? "" : "s"} had shipping calculated at checkout.`);
  }
  return parts.join(" ");
}

function buildPricesFoundSummary(pricesFound = [], askingPriceNumber = null) {
  if (!pricesFound.length) {
    return "No compatible source-backed visible prices were available for the prominent Prices Found section.";
  }
  const knownDelivered = pricesFound.filter((item) => Number.isFinite(item.deliveredCostAmount));
  const lowerDelivered = Number.isFinite(askingPriceNumber)
    ? knownDelivered.filter((item) => item.deliveredCostAmount < askingPriceNumber)
    : [];
  if (lowerDelivered.length) {
    return `${pricesFound.length} compatible priced source record${pricesFound.length === 1 ? "" : "s"} were found; ${lowerDelivered.length} had a lower confirmed delivered cost than the entered purchase price. Active asking prices are not verified sold values.`;
  }
  if (Number.isFinite(askingPriceNumber) && knownDelivered.length) {
    return `${pricesFound.length} compatible priced source record${pricesFound.length === 1 ? "" : "s"} were found; none with known delivered cost was lower than ${formatMoney(askingPriceNumber)}. Active asking prices are not verified sold values.`;
  }
  return `${pricesFound.length} compatible priced source record${pricesFound.length === 1 ? "" : "s"} were found, but at least some delivered costs could not be confirmed because shipping was not shown.`;
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
  const canonicalTitle = cleanText(identity.canonicalProductIdentity?.customerFacingTitle);
  if (canonicalTitle) {
    return canonicalTitle;
  }

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
  const explicitLabel = cleanText(report.valuationEvidenceLabel);
  const explicitState = cleanText(report.valuationEvidenceState).toLowerCase();
  const explicitRange = firstKnown(report.verifiedMarketRange, report.currentAskingPriceRange, report.preliminaryReferenceRange);
  if (explicitRange && /verified market range/i.test(explicitLabel)) {
    return {
      state: "supported",
      label: explicitLabel,
      range: explicitRange,
      confidence: "Supported",
      explanation: cleanText(report.valuationEvidenceExplanation) || "Qualified verified sold exact/strong evidence supports the displayed market range."
    };
  }
  if (explicitRange && (/current asking-price range/i.test(explicitLabel) || explicitState === "current_asking")) {
    return {
      state: "current_asking",
      label: explicitLabel || "Current Asking-Price Range",
      range: explicitRange,
      confidence: "Medium",
      explanation: cleanText(report.valuationEvidenceExplanation) || "Active exact/strong asking-price evidence supports a current asking-price range, not verified fair market value."
    };
  }
  if (explicitRange && /preliminary reference range/i.test(explicitLabel)) {
    return {
      state: "preliminary",
      label: explicitLabel,
      range: explicitRange,
      confidence: "Low",
      explanation: cleanText(report.valuationEvidenceExplanation) || "Weak, partial, guide, auction, or reference evidence supports only a preliminary reference range."
    };
  }
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

  if (classified.state === "preliminary" || classified.state === "current_asking") {
    const reference = buildPreliminaryReferenceRangeText(classified, { searchCompleted, visibleResultCount: supportingResultCount });
    const basisLabel = classified.state === "current_asking" ? "current asking-price range" : "preliminary reference range";
    if (classified.state === "current_asking") {
      normalized.currentAskingPriceRange = cleanText(normalized.currentAskingPriceRange) || reference;
      normalized.preliminaryReferenceRange = /^current asking-price range/i.test(cleanText(normalized.preliminaryReferenceRange))
        ? ""
        : cleanText(normalized.preliminaryReferenceRange);
    } else {
      normalized.preliminaryReferenceRange = reference;
    }
    normalized.referenceRangeBasis = cleanText(normalized.referenceRangeBasis)
      || `${supportingResultCount} visible strong, partial, or reference result${supportingResultCount === 1 ? "" : "s"} support this ${basisLabel}. ${visibleResultCount} total search result${visibleResultCount === 1 ? "" : "s"} are visible in Research Details.`;
    normalized.fairValueNotEstablished = "";
    normalized.estimatedFairMarketValue = "";
    normalized.estimatedMarketValue = "";
    normalized.fairPriceRange = [];
    normalized.valueRating = /insufficient evidence/i.test(cleanText(normalized.valueRating))
      ? "Insufficient Evidence"
      : normalized.valueRating;
    normalized.whatThisMeans = buildWeakEvidenceMeaningText({ report: normalized, classified });
    normalized.bestNextStep = buildBestNextEvidenceStep(normalized);
    normalized.priceBasis = ensurePrefix(normalized.priceBasis, `${classified.label} only - active asking prices, weak partial results, guide prices, or AI reasoning are not confirmed fair market value. `);
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
  const isRetailReport = /retail store|current retail|local store context|barcode\/upc|price not verified/i.test([
    report.purchaseContextSummary,
    report.localStoreContext,
    report.retailPriceContext,
    report.barcodeSearchStatus,
    report.currentPriceAssessment,
    report.valueRating
  ].flat().map(cleanText).join(" "));
  const safeLowDownsideText = buildZeroEvidenceLowDownsideText(askingPriceText);
  const retailLowDownsideText = askingPriceText
    ? `At ${askingPriceText}, the current retail price was not verified against compatible source-backed retail prices. Financial exposure may be limited, but this is not a confirmed good retail price.`
    : "The current retail price was not verified against compatible source-backed retail prices.";
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
    valueRating: isRetailReport ? "Price Not Verified - Low Financial Risk" : "Insufficient Evidence",
    whatThisMeans: isRetailReport ? retailLowDownsideText : "The current search did not return visible source-backed comparable evidence. Fair value is not established.",
    priceBasis: isRetailReport
      ? "Price not verified - the current search did not return compatible source-backed current retail prices."
      : "Fair value not established - the current search did not return visible source-backed comparable evidence.",
    currentPriceAssessment: isRetailReport
      ? `Price Not Verified - ${retailLowDownsideText}`
      : "Insufficient evidence - no source-backed market comparison is supported.",
    pricingRationale: isRetailReport ? retailLowDownsideText : safeLowDownsideText,
    cautiousBuyExplanation: shouldAllowZeroEvidencePersonalBuy(report, askingPriceText) && !isRetailReport
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

  if (isRetailReport) {
    guarded.recommendation = cleanText(report.recommendation) && !/^buy$/i.test(cleanText(report.recommendation))
      ? report.recommendation
      : "Low-Risk Purchase - Limited Evidence";
    guarded.reasonsToBuy = [];
    guarded.bestNextStep = cleanText(report.bestNextStep) || "Upload a closer barcode photo, enter the UPC manually, and confirm the store, ZIP code, and package count.";
  } else if (shouldAllowZeroEvidencePersonalBuy(report, askingPriceText)) {
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
  const hasUnsupportedMarketClaim = /reference center|market range|median market|market low|market high|active asking range|sold range|price-to-market|below[- ]market|below inferred|inferred fair|estimated fair market|fair market value|market suggests|visible market evidence|typical market|derived market|source-backed value|comparable evidence appears useful enough/i.test(source);
  const hasMoneyRange = /\$\s*\d[\d,]*(?:\.\d{1,2})?\s*(?:-|to|â€“|â€”)\s*\$?\s*\d[\d,]*(?:\.\d{1,2})?/.test(source);
  const hasPercentMarket = /\b\d{1,3}%\b.*\b(market|value|below|above|discount)/i.test(source);
  const askingAmount = extractFirstMoneyAmount(askingPriceText);
  const amounts = extractMoneyAmounts(source);
  const askingCents = moneyAmountToCents(askingAmount);
  const hasNonAskingMoney = amounts.some((amount) => !Number.isFinite(askingCents) || moneyAmountToCents(amount) !== askingCents);

  if (hasUnsupportedMarketClaim || hasMoneyRange || hasPercentMarket || (hasNonAskingMoney && /\bmarket|value|range|reference|asking|sold|price|below|above\b/i.test(source))) {
    return "The current search did not return visible source-backed comparable evidence. Fair value is not established.";
  }

  return source;
}

function moneyAmountToCents(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
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
  if (classified.label === "Current Asking-Price Range") {
    return `${classified.range} based on ${visibleResultCount} active exact/strong asking-price result${visibleResultCount === 1 ? "" : "s"} found during the current search. This is not verified fair market value because no qualified sold evidence was available.`;
  }
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

  const labeledReport = applyValuationEvidenceLabels(normalizedReport, {
    reliableCompsFound,
    searchCompleted,
    workflow: "market_value"
  });
  return isOwnerValueIntent(buyerIntake.purchase_intent)
    ? applyOwnerValueReportModel(labeledReport, buyerIntake, identity, platform, { reliableCompsFound, searchCompleted })
    : labeledReport;
}

function applyOwnerValueReportModel(report = {}, buyerIntake = normalizeBuyerIntake({}), identity = {}, platform = "", context = {}) {
  const valueEvidence = firstKnown(
    report.estimatedMarketValue,
    report.fairPriceRange,
    report.preliminaryReferenceRange,
    report.aiOnlyRoughValueRange,
    report.currentPriceAssessment,
    "Value is not established from the available evidence yet."
  );
  const sellingVenue = firstKnown(
    report.recommendedSellingPlatform,
    platform,
    "Recommended selling venue depends on size, shipping practicality, condition, and buyer audience."
  );
  const ownerLocation = buyerIntake.owner_location_zip
    ? ` Owner ZIP context was provided as ${buyerIntake.owner_location_zip}; do not expose precise coordinates.`
    : "";
  const nextVerification = firstKnown(
    report.whatToVerifyBeforeBuying,
    report.missingDetails,
    "Verify exact identifiers, condition, completeness, dimensions, and any maker, model, label, barcode, signature, or authenticity clues before relying on a final value."
  );
  const confidenceBasis = context.reliableCompsFound
    ? "Source-backed comparable evidence is available, but condition, completeness, and venue still affect realized value."
    : context.searchCompleted
      ? "Search completed without reliable exact or strong similar comps; treat the value as preliminary."
      : "Live search did not complete; treat the value as low-confidence and AI-assisted.";

  return {
    ...report,
    buyerIntent: "owner_value",
    purchaserDecision: `Owner Value Assessment - ${stripOwnerBuyingLanguage(valueEvidence)}`,
    buyerTypeFit: firstKnown(report.buyerTypeFit, "Owner valuation / possible sale"),
    currentAskingPrice: "Not required - this workflow values an item already owned.",
    currentPriceAssessment: stripOwnerBuyingLanguage(firstKnown(report.currentPriceAssessment, valueEvidence)),
    maximumRecommendedBuyPrice: "",
    betterPriceCheckNeeded: stripOwnerBuyingLanguage(firstKnown(report.betterPriceCheckNeeded, `Additional value check depends on stronger identity, condition, completeness, and source-backed comparable evidence.${ownerLocation}`)),
    whatToVerifyBeforeBuying: nextVerification,
    buyerDecisionConfidence: ensureConfidenceLayer(report.buyerDecisionConfidence, "Low", confidenceBasis),
    recommendedSellingPlatform: sellingVenue,
    searchDiagnostics: {
      ...(report.searchDiagnostics || {}),
      purposeModel: "owner_value"
    }
  };
}

function stripOwnerBuyingLanguage(value = "") {
  return cleanText(value)
    .replace(/\bBuy Here\b/gi, "Owner Value")
    .replace(/\bNegotiate\b/gi, "Value Needs Context")
    .replace(/\bPass\b/gi, "Value Not Supported")
    .replace(/\bmaximum recommended buy price\b/gi, "owner value limit")
    .replace(/\bwalk-away price\b/gi, "value limit")
    .replace(/\bopening offer\b/gi, "preliminary value context")
    .replace(/\btarget purchase price\b/gi, "target value context")
    .replace(/\bbefore buying\b/gi, "before relying on the value");
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
  const pricesFound = buildConsumerPricesFound(liveSearch, askingPriceNumber, {
    excludeRangeOutlierUrls: priceEvidence.outlierRecords.map((record) => record.url)
  });
  const retailEvidenceProfile = buildRetailEvidenceProfile({
    buyerIntake,
    identity,
    liveSearch,
    pricesFound,
    askingPriceNumber,
    searchCompleted
  });
  const customerFacingPricesFound = retailEvidenceProfile.currentRetailOnly
    ? retailEvidenceProfile.acceptedPrices
    : pricesFound;
  const retainedVisibleResultCount = Number(liveSearch.searchDiagnostics?.retainedVisibleResultCount || liveSearch.visibleResearchResultCount || 0);
  const fairValueNumber = retailEvidenceProfile.currentRetailOnly
    ? null
    : priceEvidence.referenceCenter || (retainedVisibleResultCount ? extractConsumerFairValueNumber(report) : null);
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
  const retailCalibration = buildRetailDecisionCalibration({
    decision,
    buyerIntake,
    identity,
    liveSearch,
    priceEvidence,
    pricesFound: customerFacingPricesFound,
    askingPriceNumber,
    searchCompleted
  });
  Object.assign(decision, retailCalibration.decisionOverrides);
  const offer = buildConsumerOffer({
    askingPriceNumber,
    fairValueNumber,
    decision,
    conditionProfile,
    priceEvidence
  });
  const basis = reliableCompsFound
    ? "Pricing uses source-backed comparable or reference results that passed filtering."
    : searchCompleted
      ? "Live research completed, but no source-backed exact or strong similar comps passed filtering. Consumer decision is low confidence."
      : "Live research did not complete. Consumer decision is AI-reasoning-only and low confidence.";
  const pricesFoundSummary = buildPricesFoundSummary(customerFacingPricesFound, askingPriceNumber);
  const bestCompatiblePriceFound = retailEvidenceProfile.currentRetailOnly
    ? retailEvidenceProfile.bestCurrentRetailAlternative
    : buildBestCompatiblePriceFound(customerFacingPricesFound);
  const otherCompatiblePricesFound = retailEvidenceProfile.currentRetailOnly
    ? retailEvidenceProfile.otherCurrentRetailPrices
    : buildOtherCompatiblePricesFound(customerFacingPricesFound, bestCompatiblePriceFound);
  const priceSpectrumSummary = retailEvidenceProfile.currentRetailOnly
    ? buildRetailCurrentPriceSpectrumSummary(retailEvidenceProfile)
    : buildPriceSpectrumSummary(customerFacingPricesFound);
  const currentPurchaseOptionSummary = retailEvidenceProfile.currentRetailOnly
    ? retailEvidenceProfile.currentRetailPriceAssessment
    : buildCurrentPurchaseOptionSummary(customerFacingPricesFound);
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
    purchaseContextSummary: buildPurchaseContextSummary(buyerIntake),
    retailEvidenceMode: retailEvidenceProfile.retailEvidenceMode,
    retailRouteClassification: retailEvidenceProfile.retailRouteClassification,
    retailPurchaseDecision: retailEvidenceProfile.retailPurchaseDecision,
    askingStorePrice: retailEvidenceProfile.askingStorePrice,
    currentRetailPriceAssessment: retailEvidenceProfile.currentRetailPriceAssessment,
    namedStoreResult: retailEvidenceProfile.namedStoreResult,
    bestCurrentRetailAlternative: retailEvidenceProfile.bestCurrentRetailAlternative,
    otherCurrentRetailPrices: retailEvidenceProfile.otherCurrentRetailPrices,
    packageUnitPriceComparison: retailEvidenceProfile.packageUnitPriceComparison,
    localAvailabilityContext: retailEvidenceProfile.localAvailabilityContext,
    retailPriceLimit: retailEvidenceProfile.retailPriceLimit,
    barcodeSearchStatus: buildBarcodeSearchStatus(identity, buyerIntake, liveSearch),
    localStoreContext: buildLocalStoreContext(buyerIntake, liveSearch),
    retailPriceContext: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.currentRetailPriceAssessment : buildRetailPriceContext(buyerIntake, priceEvidence, customerFacingPricesFound, liveSearch),
    packageUnitPriceContext: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.packageUnitPriceComparison : buildPackageUnitPriceContext(identity, customerFacingPricesFound, liveSearch),
    askingPrice: buildConsumerAskingPriceText(buyerIntake, identity),
    bestCompatiblePriceFound,
    currentPurchaseOptionSummary,
    otherCompatiblePricesFound,
    priceSpectrumSummary,
    pricesFound: customerFacingPricesFound,
    noCompatiblePricesFound: customerFacingPricesFound.length ? "" : retailEvidenceProfile.currentRetailOnly ? "Current Retail Price: Not verified. No qualified current retail prices were found." : "No compatible source-backed prices were found.",
    verifiedMarketRange: retailEvidenceProfile.currentRetailOnly ? "" : priceEvidence.verifiedMarketRange,
    currentAskingPriceRange: retailEvidenceProfile.currentRetailOnly ? "" : priceEvidence.currentAskingPriceRange,
    preliminaryReferenceRange: retailEvidenceProfile.currentRetailOnly ? "" : priceEvidence.primaryRangeType === "preliminary_reference"
      ? cleanText(report.preliminaryReferenceRange) || buildConsumerPreliminaryReferenceRange(priceEvidence, conditionProfile)
      : priceEvidence.preliminaryReferenceRange,
    referenceRangeBasis: retailEvidenceProfile.currentRetailOnly ? "" : cleanText(report.referenceRangeBasis) || priceEvidence.referenceRangeBasis || researchVisibility.referenceRangeBasis,
    valuationEvidenceState: retailEvidenceProfile.currentRetailOnly ? (customerFacingPricesFound.length ? "current_retail" : "retail_unverified") : priceEvidence.primaryRangeType === "verified_market" ? "supported" : priceEvidence.primaryRangeType === "current_asking" ? "current_asking" : priceEvidence.primaryRangeType ? "preliminary" : "insufficient",
    valuationEvidenceLabel: retailEvidenceProfile.currentRetailOnly ? (customerFacingPricesFound.length ? "Current Retail Price Assessment" : "Current Retail Price Not Verified") : priceEvidence.primaryRangeLabel || "Fair Value Not Established",
    valuationEvidenceExplanation: retailEvidenceProfile.currentRetailOnly ? "Retail evidence is isolated to current retail records only." : buildConsumerValuationEvidenceExplanation(priceEvidence),
    priceRangeAnalysis: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.currentRetailPriceAssessment : buildConsumerPriceRangeAnalysis(priceEvidence),
    pricingOutliersExcluded: priceEvidence.outlierRecords,
    customerPricingSummary: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.currentRetailPriceAssessment : buildConsumerPricingSummary({ priceEvidence, decision, searchCompleted, pricesFound: customerFacingPricesFound }),
    priceBasis: ensurePrefix(report.priceBasis, retailEvidenceProfile.currentRetailOnly ? "Retail Evidence Mode: current-retail-only. Pricing basis uses qualified current retail evidence only." : priceEvidence.priceBasis || "Pricing basis distinguishes exact identity matches from active asking-price evidence and confirmed sold evidence."),
    estimatedFairMarketValue: retailEvidenceProfile.currentRetailOnly ? "" : priceEvidence.primaryRangeType === "verified_market" ? priceEvidence.verifiedMarketRange : buildConsumerFairMarketValueText(report.estimatedFairMarketValue, {
      fairValueNumber,
      reliableCompsFound
    }),
    fairPriceRange: retailEvidenceProfile.currentRetailOnly ? [] : buildConsumerFairPriceRange(report.fairPriceRange, {
      fairValueNumber,
      reliableCompsFound
    }),
    valueRating: decision.valueRating,
    recommendation: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.retailPurchaseDecision : retailCalibration.recommendation || buildConsumerRecommendationText(decision, offer, askingPriceNumber),
    buyerDecisionConfidence: retailCalibration.buyerDecisionConfidence || report.buyerDecisionConfidence,
    bestNextStep: retailCalibration.bestNextStep || report.bestNextStep,
    consumerDownsideRisk: decision.downsideRisk.summary,
    cautiousBuyExplanation: retailEvidenceProfile.currentRetailOnly ? "" : decision.cautiousBuyExplanation,
    recommendedOffer: retailEvidenceProfile.currentRetailOnly ? [] : offer.recommendedOffer,
    openingOffer: retailEvidenceProfile.currentRetailOnly ? "" : offer.openingOffer,
    targetPurchasePrice: retailEvidenceProfile.currentRetailOnly ? "" : offer.targetPurchasePrice,
    maximumRecommendedPrice: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.retailPriceLimit : offer.maximumRecommendedPrice,
    maximumRecommendedPriceExplanation: retailEvidenceProfile.currentRetailOnly ? "" : offer.maximumRecommendedPriceExplanation,
    walkAwayPrice: retailEvidenceProfile.currentRetailOnly ? "" : offer.walkAwayPrice,
    negotiationGuidance: retailEvidenceProfile.currentRetailOnly ? "" : buildConsumerNegotiationGuidance(report.negotiationGuidance, {
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
    currentPriceAssessment: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.currentRetailPriceAssessment : retailCalibration.currentPriceAssessment || report.currentPriceAssessment,
    pricingConfidence: retailEvidenceProfile.currentRetailOnly ? retailEvidenceProfile.priceConfidence : retailCalibration.pricingConfidence || decision.pricingConfidence,
    pricingRationale: ensurePrefix(report.pricingRationale, `${retailCalibration.pricingRationalePrefix || basis} ${priceEvidence.primaryEvidenceSummary || ""} ${priceEvidence.outlierNote || ""} ${pricesFoundSummary} ${decision.cautiousBuyExplanation || ""}`),
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

  const guardedReport = applyValuationEvidenceLabels(normalizedReport, {
    reliableCompsFound,
    searchCompleted,
    workflow: "personal_use"
  });
  return applyCurrentRetailDecisionFirewall(guardedReport, retailEvidenceProfile);
}

function buildPurchaseContextSummary(buyerIntake = normalizeBuyerIntake({})) {
  const context = normalizePurchaseContext(buyerIntake.purchase_context);
  const label = purchaseContextLabel(context);
  if (!context) {
    return "Purchase context was not provided. Research used cautious general buyer logic.";
  }
  const store = getRetailStoreName(buyerIntake);
  const zip = normalizeZipCode(buyerIntake.location_zip);
  const area = cleanText(buyerIntake.location_area);
  const location = zip
    ? `ZIP ${zip}`
    : area
      ? `general area ${area}`
      : /location_(denied|unavailable|timeout|unsupported|skipped)|reverse_geocode_failed|insecure_context|permission-denied|position-unavailable|reverse-geocode-failed|insecure-context|skipped/.test(`${buyerIntake.location_mode} ${buyerIntake.location_permission} ${buyerIntake.location_state}`)
        ? "local prices and nearby availability will not be checked"
        : /browser_location/.test(buyerIntake.location_mode)
          ? "general browser location approved"
          : "no local ZIP/location supplied";
  const details = [
    `Purchase context: ${label}.`,
    store ? `Store/marketplace: ${store}.` : "",
    isRetailStorePurchaseContext(context) ? `Local context: ${location}.` : "",
    buyerIntake.known_shipping_amount ? `Shipping/delivery entered: ${buyerIntake.known_shipping_amount}.` : ""
  ].filter(Boolean);
  return details.join(" ");
}

function purchaseContextLabel(context) {
  const labels = {
    retail_store: "Retail store",
    online_retailer: "Online retailer",
    facebook_marketplace: "Facebook Marketplace",
    ebay_etsy_mercari: "eBay / Etsy / Mercari",
    flea_market_yard_sale: "Flea market / yard sale",
    estate_sale: "Estate sale",
    antique_mall: "Antique mall",
    thrift_store: "Thrift store",
    private_seller: "Private seller",
    other: "Other"
  };
  return labels[normalizePurchaseContext(context)] || cleanText(context) || "Not provided";
}

function buildBarcodeSearchStatus(identity = {}, buyerIntake = normalizeBuyerIntake({}), liveSearch = {}) {
  const digits = getSearchBarcodeDigits(identity, buyerIntake);
  if (digits) {
    const attempted = normalizeStringArray(liveSearch.queriesActuallySent || liveSearch.searchQueries, 24)
      .some((query) => cleanText(query).includes(digits));
    return `Barcode/UPC digits used: ${digits}. Exact UPC/barcode search ${attempted ? "was attempted" : "was prepared but not confirmed as attempted in diagnostics"}.`;
  }
  if (normalizeBarcodeReadStatus(identity.barcodeReadStatus, identity.upcBarcode) === "unreadable" || cleanText(identity.barcodeFailureMessage)) {
    return "The barcode could not be read clearly. Upload a closer photo of the barcode or enter the numbers manually.";
  }
  return "No readable barcode/UPC digits were available. Enter the barcode or UPC number if it is visible on the package.";
}

function buildLocalStoreContext(buyerIntake = normalizeBuyerIntake({}), liveSearch = {}) {
  if (!isRetailStorePurchaseContext(buyerIntake.purchase_context)) {
    return "";
  }
  const store = getRetailStoreName(buyerIntake) || "Store not provided";
  const zip = normalizeZipCode(buyerIntake.location_zip);
  const area = cleanText(buyerIntake.location_area);
  const returned = normalizeStringArray(liveSearch.sourcesReturned || liveSearch.domainsActuallyReturned, 12);
  const namedStoreReturned = store !== "Store not provided" && returned.some((source) => source.toLowerCase().includes(store.toLowerCase().split(/\s+/)[0]));
  const locationText = zip
    ? `ZIP/general area: ${zip}.`
    : area
      ? `General area: ${area}. Enter ZIP for more precise local pricing.`
      : /location_(denied|unavailable|timeout|unsupported|skipped)|reverse_geocode_failed|insecure_context|permission-denied|position-unavailable|reverse-geocode-failed|insecure-context|skipped/.test(`${buyerIntake.location_mode} ${buyerIntake.location_permission} ${buyerIntake.location_state}`)
        ? "Local prices and nearby availability were not checked because ZIP/local area was unavailable."
        : /browser_location/.test(buyerIntake.location_mode)
          ? "General location permission was approved; precise coordinates are not stored or displayed."
          : "No ZIP/location supplied, so nearby price and availability were limited.";
  return [
    `Named store: ${store}.`,
    locationText,
    namedStoreReturned ? "Store-specific source results returned; review source-backed price cards for exact price support." : "No store-specific price found.",
    "Availability not confirmed unless a source card explicitly states pickup or availability."
  ].join(" ");
}

function buildRetailPriceContext(buyerIntake = normalizeBuyerIntake({}), priceEvidence = {}, pricesFound = [], liveSearch = {}) {
  if (!isRetailStorePurchaseContext(buyerIntake.purchase_context) && !isOnlineRetailerPurchaseContext(buyerIntake.purchase_context)) {
    return "";
  }
  const currentRetailPrices = normalizeArray(pricesFound).filter(isCurrentPurchasablePriceFoundRecord);
  if (currentRetailPrices.length) {
    return `Current retail comparison found: ${currentRetailPrices.length} compatible current purchasable price${currentRetailPrices.length === 1 ? "" : "s"} passed filtering. Package price remains separate from shipping/delivery and unit price.`;
  }
  const status = cleanText(liveSearch.liveSearchStatus || "");
  if (/No Reliable Comps/i.test(status) || liveSearch.webSearchExecuted) {
    return "Current retail price not verified. Search ran, but no compatible source-backed current retail price passed match-quality, package-size, and identifier checks.";
  }
  return "Current retail price not verified because live search did not complete.";
}

function buildPackageUnitPriceContext(identity = {}, pricesFound = [], liveSearch = {}) {
  const packageText = compactWords([identity.packageQuantity, identity.packageSize, identity.unitCount]);
  const records = normalizeArray(pricesFound).filter((record) => record && typeof record === "object");
  const unitContext = records
    .map((record) => buildUnitPriceContextForRecord(record, packageText))
    .filter(Boolean)
    .slice(0, 4);
  const mismatchCount = normalizeArray(liveSearch.searchDiagnostics?.rejectedPackSizeMismatches).length;
  if (unitContext.length) {
    return unitContext.join(" ");
  }
  if (mismatchCount) {
    return `${mismatchCount} result${mismatchCount === 1 ? "" : "s"} rejected or limited because package count/size did not match. Unit pricing was not used as package price.`;
  }
  return packageText
    ? `Submitted package clues: ${packageText}. Unit-price normalization only applies when quantity, product type, and size are explicit and compatible.`
    : "Package size/count was not established, so package-price and unit-price normalization are limited.";
}

function buildUnitPriceContextForRecord(record = {}, packageText = "") {
  const amount = getVisibleItemPriceAmount(record);
  const quantity = extractPackQuantityNumber([record.title, record.rawText, record.conciseLimitation, packageText].join(" "));
  if (!Number.isFinite(amount) || !Number.isFinite(quantity) || quantity <= 0) {
    return "";
  }
  return `${record.title || "Source price"}: package price ${formatMoney(amount)} for ${quantity} units - about ${formatUnitMoney(amount / quantity)} per unit. Package price remains ${formatMoney(amount)}.`;
}

function formatUnitMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return "";
  }
  const decimals = amount < 0.01 ? 4 : amount < 1 ? 3 : 2;
  return `$${amount.toFixed(decimals)}`;
}

function buildRetailDecisionCalibration({ decision, buyerIntake, identity, liveSearch, priceEvidence, pricesFound, askingPriceNumber, searchCompleted } = {}) {
  if (!isRetailStorePurchaseContext(buyerIntake.purchase_context)) {
    return {
      decisionOverrides: {},
      recommendation: "",
      currentPriceAssessment: "",
      buyerDecisionConfidence: "",
      bestNextStep: "",
      pricingConfidence: "",
      pricingRationalePrefix: ""
    };
  }

  const currentRetailPrices = normalizeArray(pricesFound).filter(isCurrentPurchasablePriceFoundRecord);
  const hasCurrentRetailComparison = currentRetailPrices.length > 0 || Number(priceEvidence.activeExactStrongCount || 0) > 0;
  const lowFinancialRisk = Number.isFinite(askingPriceNumber) && askingPriceNumber <= consumerDecisionThresholds.lowDollarCautiousBuyMax;
  if (hasCurrentRetailComparison) {
    const label = lowFinancialRisk ? "Good Retail Price" : "Reasonable Retail Price";
    return {
      decisionOverrides: {
        valueRating: label,
        recommendation: decision.recommendation === "Buy" ? "Buy If It Fits Your Needs" : decision.recommendation,
        pricingConfidence: ensureConfidenceLayer(decision.pricingConfidence, "Medium", "Current retail source-backed price evidence was retained; verify package size, quantity, and store terms.")
      },
      recommendation: decision.recommendation === "Buy" ? "Buy If It Fits Your Needs" : "",
      currentPriceAssessment: `${label} - current retail comparison evidence was retained. Check package size, quantity, shipping/delivery, and return policy before relying on the comparison.`,
      buyerDecisionConfidence: "Medium - retail price comparison evidence was retained, but package size, availability, and local pickup must remain source-backed.",
      bestNextStep: "",
      pricingConfidence: "",
      pricingRationalePrefix: "Retail purchase basis - current retail price evidence was retained and package compatibility still matters.",
      searchCompleted
    };
  }

  const barcodeDigits = getSearchBarcodeDigits(identity, buyerIntake);
  const missingActions = [];
  if (!barcodeDigits) {
    missingActions.push("Upload a closer barcode photo or enter the UPC manually.");
  }
  if (!getRetailStoreName(buyerIntake)) {
    missingActions.push("Add the store name.");
  }
  if (!normalizeZipCode(buyerIntake.location_zip) && !cleanText(buyerIntake.location_area) && !/browser_location_(zip|general_area)|manual_zip|location_skipped/.test(buyerIntake.location_mode || "")) {
    missingActions.push("Enter your ZIP code.");
  }
  if (!hasKnownValue(identity.packageQuantity) && !hasKnownValue(identity.unitCount)) {
    missingActions.push("Confirm the package size and count.");
  }
  const bestNextStep = missingActions[0] || "Confirm the exact UPC, package count, and current store shelf price.";
  const valueRating = lowFinancialRisk
    ? "Price Not Verified - Low Financial Risk"
    : "Price Not Verified";
  const recommendation = lowFinancialRisk
    ? "Low-Risk Purchase - Limited Evidence"
    : "Need More Information";
  const explanation = Number.isFinite(askingPriceNumber)
    ? `${formatMoney(askingPriceNumber)} was not verified against compatible source-backed current retail prices. Financial exposure may be limited, but Katherine’s Eye did not confirm this is a good deal.`
    : "The current retail price was not verified because no compatible source-backed current retail price passed filtering.";

  return {
    decisionOverrides: {
      valueRating,
      recommendation,
      pricingConfidence: forceLowConfidence("", explanation),
      cautiousBuyExplanation: explanation,
      evidenceWarning: "Retail price was not verified; decision is conditional and low-certainty."
    },
    recommendation,
    currentPriceAssessment: `${valueRating} - ${explanation}`,
    buyerDecisionConfidence: "Low - current retail price was not verified with source-backed compatible prices.",
    bestNextStep,
    pricingConfidence: forceLowConfidence("", explanation),
    pricingRationalePrefix: `Retail purchase basis - ${explanation}`
  };
}

function isLowDollarAskingInsideWeakPreliminaryRange({ askingPriceNumber, priceEvidence = {}, conditionProfile = {}, downsideRisk = {} } = {}) {
  if (!Number.isFinite(askingPriceNumber) || askingPriceNumber <= 0 || askingPriceNumber > 50) {
    return false;
  }
  if (cleanText(priceEvidence.primaryRangeType) !== "preliminary_reference") {
    return false;
  }
  if (Number(priceEvidence.soldExactStrongCount || 0) > 0 || Number(priceEvidence.activeExactStrongCount || 0) > 0) {
    return false;
  }
  const low = Number(priceEvidence.low);
  const high = Number(priceEvidence.high);
  if (!Number.isFinite(low) || !Number.isFinite(high) || low <= 0 || high < low) {
    return false;
  }
  if (askingPriceNumber < low || askingPriceNumber > high) {
    return false;
  }
  if (conditionProfile.hasHardRisk || Array.isArray(downsideRisk.hardFactors) && downsideRisk.hardFactors.length) {
    return false;
  }
  return true;
}

function buildWeakRangePersonalBuyExplanation(askingPriceNumber) {
  const asking = Number.isFinite(askingPriceNumber) ? formatMoney(askingPriceNumber) : "the asking price";
  return `Reliable sold or active exact-match prices were not found. The asking price falls within the preliminary reference range, so the item may still be reasonable for personal use. Negotiating is worthwhile, but the available evidence does not prove that ${asking} is overpriced.`;
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
  const hasStrongPriceEvidence = priceEvidence.hasStrongPriceEvidence === true;
  const hasVerifiedSoldEvidence = priceEvidence.hasVerifiedSoldEvidence === true;
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
  const weakRangePersonalBuy = isLowDollarAskingInsideWeakPreliminaryRange({
    askingPriceNumber,
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
  const limitedEvidencePersonalBuy = hasAskingPrice
    && hasFairValue
    && priceEvidence.pricedRecordCount > 0
    && (downsideRisk.lowDollarExposure || downsideRisk.modestDollarExposure)
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

  if (weakRangePersonalBuy) {
    const explanation = buildWeakRangePersonalBuyExplanation(askingPriceNumber);
    return {
      valueRating: "Reasonable Personal-Use Buy - Limited Evidence",
      recommendation: "Buy If It Fits Your Needs",
      badgeReason: "The asking price is inside the preliminary reference range, but no qualified sold or active exact/strong prices established fair market value.",
      pricingConfidence: forceLowConfidence("", explanation),
      riskFlags,
      downsideRisk,
      cautiousBuyExplanation: explanation,
      evidenceWarning: "Weak/reference evidence should support cautious personal-use judgment only; it does not prove a precise market value or that the current asking price is overpriced."
    };
  }

  if (!hasAskingPrice || !hasFairValue || (!hasReliableEvidence && !cautiousBuy && !limitedEvidencePersonalBuy)) {
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
  let badgeReason = "The asking price was compared to the strongest available source-backed price bucket.";

  if (!hasStrongPriceEvidence) {
    if (ratio <= consumerDecisionThresholds.goodMaxRatio && downsideRisk.lowDollarExposure) {
      valueRating = "Low-Cost Cautious Buy";
      recommendation = "Buy If It Fits Your Needs";
      badgeReason = "No verified sold or active exact/strong price evidence was available, but the asking price is low and favorable to the central preliminary cluster.";
    } else if (ratio <= consumerDecisionThresholds.goodMaxRatio) {
      valueRating = "Promising Price - Limited Evidence";
      recommendation = "Buy If It Fits Your Needs";
      badgeReason = "The price appears favorable to preliminary evidence, but the range is driven by weak, partial, guide, auction, or reference prices.";
    } else if (ratio <= consumerDecisionThresholds.fairMaxRatio) {
      valueRating = "Reasonable Personal-Use Buy";
      recommendation = "Buy If It Fits Your Needs";
      badgeReason = "The price is near the central preliminary range, but evidence quality is limited.";
    } else {
      valueRating = "Proceed with Caution";
      recommendation = ratio <= consumerDecisionThresholds.slightlyOverpricedMaxRatio ? "Negotiate" : "Wait for a Better Price";
      badgeReason = "The price is not clearly favorable once weak evidence and outlier filtering are considered.";
    }
  } else if (ratio <= consumerDecisionThresholds.exceptionalMaxRatio && (hasVerifiedSoldEvidence || priceEvidence.activeExactStrongCount >= 2)) {
    valueRating = "Exceptional Value";
    recommendation = "Buy";
    badgeReason = hasVerifiedSoldEvidence
      ? "The asking price is materially below qualified verified sold evidence."
      : "The asking price is materially below multiple active exact/strong asking-price records.";
  } else if (ratio <= consumerDecisionThresholds.goodMaxRatio) {
    valueRating = hasVerifiedSoldEvidence ? "Good Value" : "Promising Price - Limited Evidence";
    recommendation = "Buy";
    badgeReason = hasVerifiedSoldEvidence
      ? "The asking price is below qualified sold evidence."
      : "The asking price is below active exact/strong evidence, but no qualified sold range was available.";
  } else if (ratio <= consumerDecisionThresholds.fairMaxRatio) {
    valueRating = "Fair Price";
    recommendation = "Buy If It Fits Your Needs";
    badgeReason = "The asking price is near the strongest available central range.";
  } else if (ratio <= consumerDecisionThresholds.slightlyOverpricedMaxRatio) {
    valueRating = "Slightly Overpriced";
    recommendation = "Negotiate";
    badgeReason = "The asking price is above the strongest available central range.";
  } else if (ratio <= consumerDecisionThresholds.overpricedMaxRatio) {
    valueRating = "Overpriced";
    recommendation = "Wait for a Better Price";
    badgeReason = "The asking price is materially above the strongest available central range.";
  }

  if (cautiousBuy && (recommendation === "Pass" || recommendation === "Need More Information" || recommendation === "Wait for a Better Price" || recommendation === "Negotiate")) {
    valueRating = priceEvidence.hasVerifiedSoldEvidence ? "Good Value" : "Low-Cost Cautious Buy";
    recommendation = "Buy If It Fits Your Needs";
    badgeReason = priceEvidence.hasVerifiedSoldEvidence
      ? "Low downside and sold evidence support a cautious buy."
      : "Low downside supports a cautious personal-use buy, but sold evidence is not available.";
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
    badgeReason,
    pricingConfidence: !hasStrongPriceEvidence
      ? forceLowConfidence("", "Pricing uses a central preliminary cluster from weak, partial, guide, auction, or reference evidence; no verified sold or active exact/strong range was available.")
      : cautiousBuy
      ? ensureConfidenceLayer("", "Medium", "Exact or strong visible source-backed identity evidence and limited dollar downside support a cautious personal-use Buy; active asking prices are not confirmed sold prices.")
      : hasVerifiedSoldEvidence
        ? ensureConfidenceLayer("", "Medium", "Qualified verified sold exact/strong evidence supports the price direction, but condition and buyer fit still matter.")
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
  const exactOrStrongRecords = records.filter((record) => canInfluenceValuationFromVisibleRecord(record));
  const preliminaryRangeRecords = dedupeResearchRecordsByListing(records.filter((record) => canSupportPreliminaryAskingRangeFromVisibleRecord(record)));
  const pricedRecords = preliminaryRangeRecords
    .map(buildWeightedPriceEvidenceRecord)
    .filter((record) => Number.isFinite(record.amount) && record.amount > 0);
  const activeExactStrongRecords = pricedRecords.filter((record) => record.evidenceBucket === "current_asking");
  const soldExactStrongRecords = pricedRecords.filter((record) => record.evidenceBucket === "verified_market");
  const soldRecords = soldExactStrongRecords;
  const activeRecords = activeExactStrongRecords;
  const buckets = buildPriceEvidenceBuckets(pricedRecords);
  const primaryBucket = selectPrimaryPriceEvidenceBucket(buckets);
  const primaryAnalysis = analyzePriceEvidenceCluster(primaryBucket.records, primaryBucket);
  const includedPriceTypes = [...new Set(pricedRecords.map((record) => record.normalizedPriceType).filter(Boolean))];
  const basisParts = [];

  if (soldExactStrongRecords.length) {
    basisParts.push(`${soldExactStrongRecords.length} qualified verified sold exact/strong result${soldExactStrongRecords.length === 1 ? "" : "s"}`);
  }
  if (activeExactStrongRecords.length) {
    basisParts.push(`${activeExactStrongRecords.length} active exact/strong asking-price result${activeExactStrongRecords.length === 1 ? "" : "s"}`);
  }
  const weakerCount = pricedRecords.length - soldExactStrongRecords.length - activeExactStrongRecords.length;
  if (weakerCount > 0) {
    basisParts.push(`${weakerCount} weaker partial, guide, auction, or reference price${weakerCount === 1 ? "" : "s"}`);
  }

  const outlierRecords = primaryAnalysis.excludedRecords.map((record) => formatPriceEvidenceDiagnosticRecord(record));
  const rawAmounts = pricedRecords.map((record) => record.amount).sort((a, b) => a - b);
  const primaryRangeText = primaryAnalysis.hasRange
    ? formatMoneyRange(roundMoney(primaryAnalysis.low), roundMoney(primaryAnalysis.high))
    : "";
  const outlierNote = buildOutlierRangeNote(outlierRecords);
  const primaryIncludedRecords = primaryAnalysis.includedRecords || [];
  const primaryUnknownShippingCount = primaryIncludedRecords
    .map(extractShippingEvidence)
    .filter((shipping) => shipping.status === "unknown").length;
  const primaryVerifiedSoldCount = primaryIncludedRecords.filter((record) => record.evidenceBucket === "verified_market").length;
  const primaryActiveAskingCount = primaryIncludedRecords.filter((record) => record.evidenceBucket === "current_asking").length;
  const primaryPreliminaryReferenceCount = primaryIncludedRecords.filter((record) => record.evidenceBucket === "preliminary_reference").length;

  return {
    records,
    exactOrStrongRecords,
    pricedRecords,
    preliminaryRangeRecords,
    soldCount: soldRecords.length,
    activeCount: activeRecords.length,
    exactOrStrongCount: exactOrStrongRecords.length,
    soldExactStrongCount: soldExactStrongRecords.length,
    activeExactStrongCount: activeExactStrongRecords.length,
    strongPricedCount: soldExactStrongRecords.length + activeExactStrongRecords.length,
    pricedRecordCount: pricedRecords.length,
    includedPriceTypes,
    low: primaryAnalysis.low,
    high: primaryAnalysis.high,
    referenceCenter: primaryAnalysis.center,
    rawLow: rawAmounts.length ? Math.min(...rawAmounts) : null,
    rawHigh: rawAmounts.length ? Math.max(...rawAmounts) : null,
    activeLow: activeExactStrongRecords.length ? Math.min(...activeExactStrongRecords.map((record) => record.amount)) : null,
    activeHigh: activeExactStrongRecords.length ? Math.max(...activeExactStrongRecords.map((record) => record.amount)) : null,
    verifiedMarketRange: buckets.verified_market.analysis.hasRange ? formatPriceEvidenceRangeText("Verified Market Range", buckets.verified_market.analysis) : "",
    currentAskingPriceRange: buckets.current_asking.analysis.hasRange ? formatPriceEvidenceRangeText("Current Asking-Price Range", buckets.current_asking.analysis) : "",
    preliminaryReferenceRange: buckets.preliminary_reference.analysis.hasRange ? formatPriceEvidenceRangeText("Preliminary Reference Range", buckets.preliminary_reference.analysis) : "",
    primaryRangeLabel: primaryAnalysis.hasRange ? primaryBucket.label : "",
    primaryRangeType: primaryAnalysis.hasRange ? primaryBucket.key : "",
    primaryRangeText,
    primaryRangeRecordCount: primaryAnalysis.includedRecords.length,
    primaryRawRecordCount: primaryBucket.records.length,
    primaryVerifiedSoldCount,
    primaryActiveAskingCount,
    primaryPreliminaryReferenceCount,
    primaryUnknownShippingCount,
    primaryEvidenceSummary: primaryAnalysis.hasRange && primaryBucket.records.length
      ? `${primaryBucket.label} driven by ${primaryAnalysis.includedRecords.length} of ${primaryBucket.records.length} compatible priced record${primaryBucket.records.length === 1 ? "" : "s"}.`
      : "",
    outlierRecords,
    excludedOutlierCount: outlierRecords.length,
    outlierNote,
    rangeUsefulnessGuardApplied: primaryAnalysis.rangeUsefulnessGuardApplied,
    hasVerifiedSoldEvidence: soldExactStrongRecords.length > 0,
    hasStrongPriceEvidence: soldExactStrongRecords.length > 0 || activeExactStrongRecords.length > 0,
    priceBasis: basisParts.length
      ? `Visible price basis - ${basisParts.join("; ")}. The primary customer range uses the strongest available bucket: ${primaryBucket.label}. Active asking prices, auction bids, and guide/reference prices are not confirmed sold values.`
      : "",
    referenceRangeBasis: primaryAnalysis.hasRange
      ? `${primaryBucket.label} uses ${primaryAnalysis.includedRecords.length} central compatible priced source record${primaryAnalysis.includedRecords.length === 1 ? "" : "s"} from the strongest available evidence bucket. Included price types: ${includedPriceTypes.join(", ") || "visible prices"}. ${outlierNote || "No range-setting outliers were excluded."} Shipping is shown separately in Prices Found and is not included unless explicitly stated there.`
      : ""
  };
}

function buildWeightedPriceEvidenceRecord(record = {}) {
  const amount = getVisibleItemPriceAmount(record);
  const normalizedPriceType = normalizePriceTypeLabel(record.priceType || record.priceEvidenceType, record);
  const matchLevel = classifyPriceEvidenceMatchLevel(record);
  const evidenceBucket = classifyPriceEvidenceBucket({ normalizedPriceType, matchLevel, record });
  const evidenceWeight = priceEvidenceWeight({ normalizedPriceType, matchLevel, evidenceBucket });
  return {
    ...record,
    amount,
    normalizedPriceType,
    priceEvidenceMatchLevel: matchLevel,
    evidenceBucket,
    evidenceBucketLabel: priceEvidenceBucketLabel(evidenceBucket),
    evidenceWeight
  };
}

function classifyPriceEvidenceMatchLevel(record = {}) {
  const text = cleanText([record.classification, record.identityMatchStrength, record.evidenceRole, record.rawText].join(" ")).toLowerCase();
  if (/exact/.test(text)) return "exact";
  if (/strong/.test(text)) return "strong";
  if (/partial/.test(text)) return "partial";
  return "reference";
}

function classifyPriceEvidenceBucket({ normalizedPriceType = "", matchLevel = "", record = {} } = {}) {
  const exactOrStrong = matchLevel === "exact" || matchLevel === "strong";
  if (isQualifiedVerifiedSoldPriceEvidence(record, normalizedPriceType, matchLevel) && exactOrStrong) {
    return "verified_market";
  }
  if (/Active Asking/i.test(normalizedPriceType) && exactOrStrong) {
    return "current_asking";
  }
  return "preliminary_reference";
}

function isQualifiedVerifiedSoldPriceEvidence(record = {}, normalizedPriceType = "", matchLevel = "") {
  const exactOrStrong = /exact|strong/i.test(matchLevel);
  if (!exactOrStrong || !/Verified Sold/i.test(normalizedPriceType)) {
    return false;
  }
  if (!isUsableSourceRecord(record)) {
    return false;
  }
  if (isBulkLotReferenceWithoutUnitPrice(record) || isNonTransactionalContentRecord(record)) {
    return false;
  }
  if (!hasExplicitSoldTransactionProof(record)) {
    return false;
  }
  const statusText = cleanText([
    record.priceType,
    record.priceEvidenceType,
    record.priceTypeLabel,
    record.activeSoldReferenceStatus,
    record.influencedVerifiedMarketRange,
    extractLabeledResultPart(record.rawText, /(?:price\s*type|price\s*evidence\s*type|listing\s*status|sold\s*status|status)\s*[:=-]\s*([^|;.]+)/i)
  ].join(" "));
  if (!/\b(confirmed sold|verified sold|sold for|sold price|final sale price|price realized|hammer price|completed sale)\b/i.test(statusText)) {
    return false;
  }
  return !/\b(active asking|shopping offer|for sale|current listing|current bid|opening bid|asking price|estimated|guide price|reference price|reference without price|ended listing without confirmed sale)\b/i.test(statusText);
}

function priceEvidenceBucketLabel(bucket) {
  if (bucket === "verified_market") return "Verified Market Range";
  if (bucket === "current_asking") return "Current Asking-Price Range";
  return "Preliminary Reference Range";
}

function priceEvidenceWeight({ normalizedPriceType = "", matchLevel = "", evidenceBucket = "" } = {}) {
  if (evidenceBucket === "verified_market" && matchLevel === "exact") return 1;
  if (evidenceBucket === "verified_market" && matchLevel === "strong") return 2;
  if (evidenceBucket === "current_asking" && matchLevel === "exact") return 3;
  if (evidenceBucket === "current_asking" && matchLevel === "strong") return 4;
  if (matchLevel === "partial") return 5;
  if (/Estimated|Guide|Reference|Auction|Unknown/i.test(normalizedPriceType)) return 6;
  return 6;
}

function buildPriceEvidenceBuckets(pricedRecords = []) {
  const buckets = {
    verified_market: { key: "verified_market", label: "Verified Market Range", records: [] },
    current_asking: { key: "current_asking", label: "Current Asking-Price Range", records: [] },
    preliminary_reference: { key: "preliminary_reference", label: "Preliminary Reference Range", records: [] }
  };
  for (const record of pricedRecords) {
    const bucket = buckets[record.evidenceBucket] || buckets.preliminary_reference;
    bucket.records.push(record);
  }
  for (const bucket of Object.values(buckets)) {
    bucket.records.sort((a, b) => a.evidenceWeight - b.evidenceWeight || a.amount - b.amount);
    bucket.analysis = analyzePriceEvidenceCluster(bucket.records, bucket);
  }
  return buckets;
}

function selectPrimaryPriceEvidenceBucket(buckets) {
  return buckets.verified_market.records.length
    ? buckets.verified_market
    : buckets.current_asking.records.length
      ? buckets.current_asking
      : buckets.preliminary_reference;
}

function analyzePriceEvidenceCluster(records = [], bucket = { key: "preliminary_reference", label: "Preliminary Reference Range" }) {
  const sorted = records
    .filter((record) => Number.isFinite(record.amount) && record.amount > 0)
    .slice()
    .sort((a, b) => a.amount - b.amount);
  if (!sorted.length) {
    return {
      hasRange: false,
      low: null,
      high: null,
      center: null,
      median: null,
      q1: null,
      q3: null,
      iqr: null,
      includedRecords: [],
      excludedRecords: [],
      rangeUsefulnessGuardApplied: false
    };
  }

  const amounts = sorted.map((record) => record.amount);
  const median = medianAmount(amounts);
  const q1 = quartileAmount(amounts, 0.25);
  const q3 = quartileAmount(amounts, 0.75);
  const iqr = Number.isFinite(q1) && Number.isFinite(q3) ? q3 - q1 : 0;
  const lowerFence = Number.isFinite(iqr) && iqr > 0 ? q1 - (1.5 * iqr) : null;
  const upperFence = Number.isFinite(iqr) && iqr > 0 ? q3 + (1.5 * iqr) : null;
  const strongestWeight = sorted.reduce((min, record) => Math.min(min, record.evidenceWeight || 9), 9);
  const excluded = [];
  let included = sorted.filter((record) => {
    const reason = priceRangeExclusionReason(record, { median, lowerFence, upperFence, strongestWeight, bucket });
    if (reason) {
      excluded.push({ ...record, rangeExclusionReason: reason });
      return false;
    }
    return true;
  });

  const rawLow = Math.min(...amounts);
  const rawHigh = Math.max(...amounts);
  const rawRatio = rawLow > 0 ? rawHigh / rawLow : Number.POSITIVE_INFINITY;
  let rangeUsefulnessGuardApplied = excluded.length > 0;
  if (included.length >= 4) {
    const includedLow = Math.min(...included.map((record) => record.amount));
    const includedHigh = Math.max(...included.map((record) => record.amount));
    const includedRatio = includedLow > 0 ? includedHigh / includedLow : Number.POSITIVE_INFINITY;
    if (includedRatio > 6 && Number.isFinite(q1) && Number.isFinite(q3)) {
      const central = included.filter((record) => record.amount >= q1 && record.amount <= q3);
      if (central.length >= 2) {
        const centralKeys = new Set(central.map(priceEvidenceRecordKey));
        excluded.push(...included
          .filter((record) => !centralKeys.has(priceEvidenceRecordKey(record)))
          .map((record) => ({
            ...record,
            rangeExclusionReason: "Excluded from primary range because the strongest available range remained excessively wide; kept in technical details as outer reference evidence."
          })));
        included = central;
        rangeUsefulnessGuardApplied = true;
      }
    }
  }

  if (!included.length) {
    included = sorted.slice(0, Math.min(sorted.length, 3));
  }
  const includedAmounts = included.map((record) => record.amount).sort((a, b) => a - b);
  return {
    hasRange: includedAmounts.length > 0,
    low: includedAmounts.length ? Math.min(...includedAmounts) : null,
    high: includedAmounts.length ? Math.max(...includedAmounts) : null,
    center: includedAmounts.length ? medianAmount(includedAmounts) : null,
    rawLow,
    rawHigh,
    rawRatio,
    median,
    q1,
    q3,
    iqr,
    includedRecords: included,
    excludedRecords: excluded,
    rangeUsefulnessGuardApplied
  };
}

function priceRangeExclusionReason(record = {}, { median = null, lowerFence = null, upperFence = null, strongestWeight = 9, bucket = {} } = {}) {
  if (!Number.isFinite(record.amount) || !Number.isFinite(median) || median <= 0) {
    return "";
  }
  const outsideIqrFence = (Number.isFinite(lowerFence) && record.amount < lowerFence)
    || (Number.isFinite(upperFence) && record.amount > upperFence);
  const smallSampleExtreme = record.amount > median * 4
    || record.amount < median / 4;
  if (!outsideIqrFence && !smallSampleExtreme) {
    return "";
  }
  const weakerThanBest = (record.evidenceWeight || 9) > strongestWeight;
  const weakEvidence = /partial|reference/i.test(record.priceEvidenceMatchLevel || "")
    || /Estimated|Guide|Reference|Auction|Unknown/i.test(record.normalizedPriceType || "");
  const variantRisk = hasOutlierVariantSignals(record);
  const hugeDeviation = record.amount > median * 6 || record.amount < median / 6;
  const preliminaryBucket = bucket.key === "preliminary_reference";
  if (preliminaryBucket || weakerThanBest || weakEvidence || variantRisk || hugeDeviation) {
    const direction = record.amount > median ? "high" : "low";
    return `Excluded from primary range as an isolated ${direction} price relative to the central cluster; evidence bucket ${priceEvidenceBucketLabel(record.evidenceBucket)} with ${record.normalizedPriceType || "unknown price type"}.`;
  }
  return "";
}

function hasOutlierVariantSignals(record = {}) {
  const text = cleanText([
    record.title,
    record.snippet,
    record.rawText,
    record.itemIdentityDifferences,
    record.matchExplanation,
    record.condition
  ].join(" ")).toLowerCase();
  return /\b(signed|autograph|authenticated|graded|mint|sealed|new old stock|rare variant|limited numbered|prototype|lot of|set of|case of|bundle|pair|quantity|oversized|large format|different size|different variant|premium condition|complete set)\b/.test(text);
}

function priceEvidenceRecordKey(record = {}) {
  return canonicalizeComparableUrl(record.canonicalUrl || record.url)
    || `${cleanText(record.title)}|${cleanText(record.source)}|${record.amount}`.toLowerCase();
}

function formatPriceEvidenceDiagnosticRecord(record = {}) {
  return {
    title: cleanText(record.title) || "Source result",
    source: cleanText(record.source) || inferSourceFromResult(record.rawText, record.url),
    url: cleanText(record.url),
    displayedPrice: Number.isFinite(record.amount) ? formatMoney(record.amount) : cleanText(record.displayedPrice || record.price),
    priceType: cleanText(record.normalizedPriceType || record.priceType),
    matchQuality: cleanText(record.classification || record.identityMatchStrength),
    evidenceBucket: priceEvidenceBucketLabel(record.evidenceBucket),
    evidenceWeight: record.evidenceWeight,
    rangeExclusionReason: cleanText(record.rangeExclusionReason),
    sourceBacked: cleanText(record.sourceBacked)
  };
}

function formatPriceEvidenceRangeText(label, analysis = {}) {
  if (!analysis.hasRange) {
    return "";
  }
  return `${label} - approximately ${formatMoneyRangeFromAmounts(analysis.low, analysis.high)}`;
}

function buildOutlierRangeNote(outlierRecords = []) {
  const amounts = outlierRecords
    .map((record) => extractFirstMoneyAmount(record.displayedPrice))
    .filter((amount) => Number.isFinite(amount) && amount > 0)
    .sort((a, b) => a - b);
  if (!amounts.length) {
    return "";
  }
  return `Additional outlier/reference prices ranged from ${formatMoneyRange(Math.min(...amounts), Math.max(...amounts))} and were not used to set the primary range.`;
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
    : "the visible compatible listing range";
  const priceTypeText = priceEvidence.soldCount
    ? `${priceEvidence.soldCount} sold result${priceEvidence.soldCount === 1 ? "" : "s"} plus ${priceEvidence.activeCount} active asking result${priceEvidence.activeCount === 1 ? "" : "s"}`
    : `${priceEvidence.activeCount} active asking result${priceEvidence.activeCount === 1 ? "" : "s"} and no confirmed sold-price result`;
  const conditionText = conditionProfile.hasModerateRisk
    ? "Visible/entered wear or used condition lowers confidence and should keep the value estimate below clean examples."
    : "No major condition adjustment was triggered by the current intake.";
  return `Cautious Buy logic - The ${formatMoney(askingPriceNumber)} asking price is below the visible compatible reference center of about ${formatMoney(fairValueNumber)} and below or favorable to ${range}. Evidence is ${priceTypeText}, so this is a cautious personal-use Buy rather than a high-confidence fair-market-value call. ${conditionText} ${downsideRisk.summary}`;
}

function buildConsumerPreliminaryReferenceRange(priceEvidence, conditionProfile) {
  if (!priceEvidence.pricedRecords?.length || !Number.isFinite(priceEvidence.low) || !Number.isFinite(priceEvidence.high)) {
    return "";
  }
  const label = priceEvidence.primaryRangeLabel || "Preliminary Reference Range";
  const conditionNote = conditionProfile.hasHardRisk
    ? " Condition/completeness concerns may justify paying materially below this range."
    : conditionProfile.hasModerateRisk
      ? " Used or uncertain condition may justify paying below clean examples."
      : "";
  const soldNote = priceEvidence.hasVerifiedSoldEvidence
    ? " Verified sold evidence is present in the strongest bucket."
    : " No qualified verified sold evidence was available for the primary range.";
  return `${label} - approximately ${formatMoneyRange(roundMoney(priceEvidence.low), roundMoney(priceEvidence.high))} based on ${priceEvidence.primaryRangeRecordCount || priceEvidence.pricedRecordCount} central compatible visible item price${(priceEvidence.primaryRangeRecordCount || priceEvidence.pricedRecordCount) === 1 ? "" : "s"}. ${soldNote} Active asking prices, auction bids, and reference prices are not confirmed sold values; shipping is shown separately in Prices Found when available. ${priceEvidence.outlierNote || ""}${conditionNote}`.replace(/\s+/g, " ").trim();
}

function buildConsumerPriceRangeAnalysis(priceEvidence = {}) {
  if (!priceEvidence.pricedRecords?.length) {
    return "No compatible visible price records were available for range analysis.";
  }
  const parts = [
    `Strongest bucket: ${priceEvidence.primaryRangeLabel || "none"}.`,
    `Records used in primary range: ${priceEvidence.primaryRangeRecordCount || 0} of ${priceEvidence.primaryRawRecordCount || 0}.`,
    Number.isFinite(priceEvidence.referenceCenter) ? `Median/center used: ${formatMoney(priceEvidence.referenceCenter)}.` : "",
    priceEvidence.hasVerifiedSoldEvidence ? "Qualified sold evidence was available." : "No qualified sold evidence was available.",
    priceEvidence.outlierNote || "No outlier/reference prices were excluded from the primary range."
  ];
  return parts.filter(Boolean).join(" ");
}

function buildConsumerPricingSummary({ priceEvidence = {}, decision = {}, searchCompleted = false, pricesFound = [] } = {}) {
  if (!priceEvidence.pricedRecords?.length) {
    return searchCompleted
      ? "No compatible visible prices were strong enough to create a buyer-facing range. The recommendation is based on limited evidence."
      : "Live search did not complete, so no source-backed price range was established.";
  }
  const activeShownSeparately = Math.max(0, priceEvidence.activeExactStrongCount - priceEvidence.primaryActiveAskingCount);
  const primaryUnknownShippingCount = Number(priceEvidence.primaryUnknownShippingCount || 0);
  const visibleUnknownShippingCount = pricesFound.filter((item) => item.shippingStatus === "unknown").length;
  const unknownShippingCount = primaryUnknownShippingCount || visibleUnknownShippingCount;
  return [
    `${priceEvidence.primaryRangeLabel || "Primary range"} drove the displayed range using ${priceEvidence.primaryRangeRecordCount || 0} central record${(priceEvidence.primaryRangeRecordCount || 0) === 1 ? "" : "s"}.`,
    `${priceEvidence.primaryVerifiedSoldCount || 0} verified sold exact/strong record${(priceEvidence.primaryVerifiedSoldCount || 0) === 1 ? "" : "s"} were used.`,
    `${priceEvidence.primaryActiveAskingCount || 0} active asking record${(priceEvidence.primaryActiveAskingCount || 0) === 1 ? "" : "s"} were used in the displayed range.`,
    activeShownSeparately ? `${activeShownSeparately} active listing${activeShownSeparately === 1 ? " was" : "s were"} shown separately.` : "",
    unknownShippingCount ? `${unknownShippingCount} compatible price result${unknownShippingCount === 1 ? " had" : "s had"} unknown shipping.` : "No range-driving result had unknown shipping.",
    priceEvidence.excludedOutlierCount ? `${priceEvidence.excludedOutlierCount} outlier/reference price${priceEvidence.excludedOutlierCount === 1 ? " was" : "s were"} excluded from the primary range.` : "No range-setting outliers were excluded.",
    `Badge selected: ${decision.valueRating || "not rated"} because ${decision.badgeReason || "the asking price was compared to the strongest available evidence bucket."}`
  ].filter(Boolean).join(" ");
}

function buildConsumerValuationEvidenceExplanation(priceEvidence = {}) {
  if (!priceEvidence.pricedRecords?.length) {
    return "No compatible visible priced evidence was available.";
  }
  if (priceEvidence.primaryRangeType === "verified_market") {
    return "Qualified verified sold exact/strong evidence supports the displayed market range.";
  }
  if (priceEvidence.primaryRangeType === "current_asking") {
    return "No qualified sold range was available, so the displayed range uses active exact/strong asking-price evidence only.";
  }
  return "The displayed range is preliminary because the strongest available price evidence is weak, partial, guide, auction, or reference evidence.";
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

function quartileAmount(amounts, percentile) {
  const sorted = amounts.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) {
    return null;
  }
  if (sorted.length === 1) {
    return sorted[0];
  }
  const position = (sorted.length - 1) * percentile;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) {
    return sorted[lower];
  }
  return sorted[lower] + ((sorted[upper] - sorted[lower]) * (position - lower));
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
  const recommendation = cleanText(decision.recommendation);
  const purchasePositive = /^buy\b/i.test(recommendation)
    || /^cautious buy\b/i.test(recommendation)
    || /^low-risk purchase\b/i.test(recommendation)
    || /^low risk purchase\b/i.test(recommendation);
  if (!purchasePositive) {
    return values;
  }

  const riskText = [
    conditionProfile.risks,
    decision.riskFlags,
    decision.downsideRisk?.hardFactors,
    decision.downsideRisk?.moderateFactors
  ].flat().map(cleanText).join(" ").toLowerCase();
  const hasConcreteWaitRisk = /missing|repair|authenticity|price above|compatibility|damage|incomplete/.test(riskText);

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

function buildMaximumPriceEvidenceProfile(priceEvidence = {}) {
  const verifiedSoldCount = Number(priceEvidence.soldExactStrongCount || priceEvidence.primaryVerifiedSoldCount || 0);
  const activeExactStrongCount = Number(priceEvidence.activeExactStrongCount || priceEvidence.primaryActiveAskingCount || 0);
  const primaryRangeType = cleanText(priceEvidence.primaryRangeType);
  const primaryRangeRecordCount = Number(priceEvidence.primaryRangeRecordCount || 0);
  const primaryPreliminaryReferenceCount = Number(priceEvidence.primaryPreliminaryReferenceCount || 0);
  const weakerRecordCount = Math.max(0, Number(priceEvidence.pricedRecordCount || 0) - verifiedSoldCount - activeExactStrongCount);
  const hasVerifiedSoldSupport = verifiedSoldCount > 0;
  const hasActiveExactStrongSupport = activeExactStrongCount > 0;
  const hasQualifiedExactStrongEvidence = hasVerifiedSoldSupport || hasActiveExactStrongSupport;
  const hasConsistentStrongCluster = hasQualifiedExactStrongEvidence
    && primaryRangeRecordCount >= 2
    && primaryRangeType !== "preliminary_reference";
  const hasMarketMaximumSupport = hasQualifiedExactStrongEvidence || hasConsistentStrongCluster;

  return {
    verifiedSoldCount,
    activeExactStrongCount,
    primaryRangeType,
    primaryRangeRecordCount,
    primaryPreliminaryReferenceCount,
    weakerRecordCount,
    hasVerifiedSoldSupport,
    hasActiveExactStrongSupport,
    hasQualifiedExactStrongEvidence,
    hasMarketMaximumSupport,
    weakReferenceOnly: !hasMarketMaximumSupport && (primaryRangeType === "preliminary_reference" || weakerRecordCount > 0)
  };
}

function isLowConfidenceDecision(decision = {}, priceEvidence = {}) {
  const text = cleanText([
    decision.pricingConfidence,
    decision.buyerDecisionConfidence,
    decision.valueRating,
    decision.badgeReason,
    decision.evidenceWarning,
    priceEvidence.primaryRangeLabel,
    priceEvidence.priceBasis
  ].join(" "));
  return /\b(low|limited|weak|preliminary|insufficient|reference|partial|guide|auction)\b/i.test(text);
}

function buildMaximumRecommendedPricePolicy({ askingPriceNumber, targetPrice, proposedMaxPrice, decision = {}, priceEvidence = {} } = {}) {
  const profile = buildMaximumPriceEvidenceProfile(priceEvidence);
  const lowConfidence = isLowConfidenceDecision(decision, priceEvidence);
  const lowDollarAsking = Number.isFinite(askingPriceNumber) && askingPriceNumber > 0 && askingPriceNumber <= 50;
  const fallbackCap = Number.isFinite(targetPrice)
    ? targetPrice
    : Number.isFinite(askingPriceNumber)
      ? askingPriceNumber
      : null;

  if (!Number.isFinite(proposedMaxPrice) || proposedMaxPrice <= 0) {
    return {
      established: false,
      maxPrice: null,
      explanation: "No reliable maximum could be established because no verified sold or active exact/strong comparable prices were found."
    };
  }

  if (!profile.hasMarketMaximumSupport) {
    if (lowDollarAsking && Number.isFinite(fallbackCap) && fallbackCap > 0) {
      return {
        established: true,
        maxPrice: roundMoney(fallbackCap),
        explanation: "The maximum is capped near the target because available pricing evidence is weak. No reliable higher market ceiling could be established without verified sold or active exact/strong comparable prices. Personal enjoyment may justify paying more, but the market-supported maximum is not established beyond this cautious ceiling."
      };
    }
    return {
      established: false,
      maxPrice: null,
      explanation: "No reliable maximum could be established because no verified sold or active exact/strong comparable prices were found. Weak, partial, guide, auction, estimated, or reference prices may provide context only."
    };
  }

  let maxPrice = proposedMaxPrice;
  const explanations = [];
  if (Number.isFinite(targetPrice) && targetPrice > 0 && maxPrice > targetPrice * 2) {
    if (!profile.hasQualifiedExactStrongEvidence) {
      maxPrice = targetPrice * 2;
      explanations.push("The maximum was capped because a price above 2x the target requires qualified exact/strong evidence.");
    } else {
      explanations.push("A maximum above 2x the target is allowed only because qualified exact/strong price evidence is available.");
    }
  }
  if (Number.isFinite(askingPriceNumber) && askingPriceNumber > 0 && maxPrice > askingPriceNumber * 3) {
    if (!profile.hasVerifiedSoldSupport && !profile.hasActiveExactStrongSupport) {
      maxPrice = askingPriceNumber * 3;
      explanations.push("The maximum was capped because a price above 3x the current asking price requires verified sold or active exact/strong support.");
    } else {
      explanations.push("A maximum above 3x the current asking price is supported by verified sold or active exact/strong evidence.");
    }
  }
  if (lowConfidence && !profile.hasVerifiedSoldSupport && profile.activeExactStrongCount < 2) {
    const lowConfidenceCap = Math.max(
      Number.isFinite(targetPrice) && targetPrice > 0 ? targetPrice * 2 : 0,
      Number.isFinite(askingPriceNumber) && askingPriceNumber > 0 ? askingPriceNumber * 3 : 0
    );
    if (lowConfidenceCap > 0 && maxPrice > lowConfidenceCap) {
      maxPrice = lowConfidenceCap;
      explanations.push("Low pricing confidence capped the maximum so it cannot run far above the asking or target price.");
    }
  }
  if (Number.isFinite(targetPrice) && targetPrice > 0 && maxPrice < targetPrice) {
    maxPrice = targetPrice;
    explanations.push("The maximum was raised only enough to stay consistent with the target purchase price.");
  }

  return {
    established: true,
    maxPrice: roundMoney(maxPrice),
    explanation: explanations.length
      ? explanations.join(" ")
      : "Maximum Recommended Price is tied to verified sold or active exact/strong comparable support, not weak reference prices."
  };
}

function buildConsumerOffer({ askingPriceNumber, fairValueNumber, decision, conditionProfile, priceEvidence = {} }) {
  const unsupported = decision.valueRating === "Insufficient Evidence"
    || !Number.isFinite(askingPriceNumber)
    || !Number.isFinite(fairValueNumber)
    || fairValueNumber <= 0;

  if (unsupported) {
    return {
      openingOffer: "Not supported yet - verify identity, condition, asking price, and reliable comparables first.",
      targetPurchasePrice: "Not supported yet - evidence is too weak for a responsible target price.",
      maximumRecommendedPrice: "Not supported yet - do not set a maximum from weak evidence.",
      maximumRecommendedPriceExplanation: "No reliable maximum could be established because no verified sold or active exact/strong comparable prices were found.",
      openingOfferAmount: null,
      targetPurchasePriceAmount: null,
      maximumRecommendedPriceAmount: null,
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
  let openingOffer = roundOpeningOfferBelowAsking({ askingPriceNumber, targetPrice, factor: 0.88 });
  const weakRangePersonalBuy = isLowDollarAskingInsideWeakPreliminaryRange({
    askingPriceNumber,
    priceEvidence,
    conditionProfile,
    downsideRisk: decision.downsideRisk || {}
  });

  if (askingPriceNumber <= fairValueNumber * consumerDecisionThresholds.goodMaxRatio) {
    targetPrice = roundMoney(askingPriceNumber);
    openingOffer = roundOpeningOfferBelowAsking({ askingPriceNumber, targetPrice, factor: decision.valueRating === "Exceptional Value" ? 0.92 : 0.82 });
    maxPrice = roundMoney(Math.max(targetPrice, Math.min(fairValueNumber * 1.03, maxPrice)));
  } else if (askingPriceNumber > fairValueNumber * consumerDecisionThresholds.fairMaxRatio) {
    targetPrice = roundMoney(Math.min(maxPrice, fairValueNumber * 0.96));
    openingOffer = roundOpeningOfferBelowAsking({ askingPriceNumber, targetPrice, factor: 0.86 });
  }

  if (weakRangePersonalBuy) {
    targetPrice = roundMoney(askingPriceNumber);
    openingOffer = roundOpeningOfferBelowAsking({ askingPriceNumber, targetPrice, factor: 0.82 });
    maxPrice = roundMoney(Math.max(maxPrice, targetPrice));
  }

  if (openingOffer > targetPrice) {
    openingOffer = targetPrice;
  }
  if (Number.isFinite(askingPriceNumber) && askingPriceNumber > 1 && openingOffer >= askingPriceNumber && /Negotiate|Buy|Promising|Cautious|Reasonable/i.test([decision.recommendation, decision.valueRating].join(" "))) {
    openingOffer = Math.max(1, askingPriceNumber <= 25 ? Math.floor(askingPriceNumber - 1) : roundMoney(askingPriceNumber * 0.9));
  }
  if (targetPrice > maxPrice) {
    targetPrice = maxPrice;
  }

  const maximumPolicy = buildMaximumRecommendedPricePolicy({
    askingPriceNumber,
    targetPrice,
    proposedMaxPrice: maxPrice,
    decision,
    priceEvidence
  });

  if (!maximumPolicy.established) {
    if (openingOffer > targetPrice) {
      openingOffer = targetPrice;
    }
    if (openingOffer >= targetPrice && targetPrice > 1) {
      openingOffer = Math.max(1, targetPrice <= 25 ? Math.floor(targetPrice - 1) : roundMoney(targetPrice * 0.9));
    }
    const openingOfferText = `Opening Offer: ${formatMoney(openingOffer)}`;
    const targetPurchasePrice = `Target Purchase Price: ${formatMoney(targetPrice)}`;
    const maximumRecommendedPrice = "Maximum Recommended Price: Not established";
    const maximumRecommendedPriceExplanation = maximumPolicy.explanation;
    return {
      openingOffer: openingOfferText,
      targetPurchasePrice,
      maximumRecommendedPrice,
      maximumRecommendedPriceExplanation,
      openingOfferAmount: openingOffer,
      targetPurchasePriceAmount: targetPrice,
      maximumRecommendedPriceAmount: null,
      walkAwayPrice: `Walk-Away Price: Not established. ${maximumRecommendedPriceExplanation}`,
      recommendedOffer: [
        openingOfferText,
        targetPurchasePrice,
        maximumRecommendedPrice,
        `Maximum Price Note: ${maximumRecommendedPriceExplanation}`
      ]
    };
  }

  maxPrice = maximumPolicy.maxPrice;
  if (targetPrice > maxPrice) {
    targetPrice = maxPrice;
  }
  if (openingOffer >= targetPrice && targetPrice > 1) {
    openingOffer = Math.max(1, targetPrice <= 25 ? Math.floor(targetPrice - 1) : roundMoney(targetPrice * 0.9));
  }
  if (targetPrice > maxPrice) {
    targetPrice = maxPrice;
  }
  if (openingOffer > targetPrice) {
    openingOffer = Math.max(1, targetPrice <= 25 ? Math.floor(targetPrice - 1) : roundMoney(targetPrice * 0.9));
  }

  const openingOfferText = `Opening Offer: ${formatMoney(openingOffer)}`;
  const targetPurchasePrice = `Target Purchase Price: ${formatMoney(targetPrice)}`;
  const maximumRecommendedPrice = `Maximum Recommended Price: ${formatMoney(maxPrice)}`;
  const maximumRecommendedPriceExplanation = maximumPolicy.explanation;

  return {
    openingOffer: openingOfferText,
    targetPurchasePrice,
    maximumRecommendedPrice,
    maximumRecommendedPriceExplanation,
    openingOfferAmount: openingOffer,
    targetPurchasePriceAmount: targetPrice,
    maximumRecommendedPriceAmount: maxPrice,
    walkAwayPrice: `Walk-Away Price: ${formatMoney(maxPrice)} for personal use unless condition, accessories, warranty, return protection, or exact model evidence improves.`,
    recommendedOffer: [openingOfferText, targetPurchasePrice, maximumRecommendedPrice, `Maximum Price Note: ${maximumRecommendedPriceExplanation}`]
  };
}

function buildConsumerRecommendationText(decision = {}, offer = {}, askingPriceNumber = null) {
  const maxPrice = Number.isFinite(offer.maximumRecommendedPriceAmount)
    ? offer.maximumRecommendedPriceAmount
    : extractFirstMoneyAmount(offer.maximumRecommendedPrice);
  if (Number.isFinite(askingPriceNumber) && Number.isFinite(maxPrice) && maxPrice < askingPriceNumber && /buy/i.test(decision.recommendation || "")) {
    return `Buy only if negotiated to ${formatMoney(maxPrice)} or below.`;
  }
  return decision.recommendation;
}

function roundOpeningOfferBelowAsking({ askingPriceNumber, targetPrice, factor = 0.88 } = {}) {
  const base = Number.isFinite(targetPrice) ? targetPrice : askingPriceNumber;
  if (!Number.isFinite(base) || base <= 1) {
    return 1;
  }
  let rounded = base <= 25
    ? Math.max(1, Math.floor(base * factor))
    : roundMoney(Math.max(1, base * factor));
  if (Number.isFinite(askingPriceNumber) && askingPriceNumber > 1 && rounded >= askingPriceNumber) {
    rounded = askingPriceNumber <= 25
      ? Math.max(1, Math.floor(askingPriceNumber - 1))
      : roundMoney(askingPriceNumber * 0.9);
  }
  return rounded;
}

function buildConsumerNegotiationGuidance(value, { decision, offer, reliableCompsFound, askingPriceNumber, fairValueNumber }) {
  const text = cleanText(value);
  const maxPrice = Number.isFinite(offer.maximumRecommendedPriceAmount)
    ? offer.maximumRecommendedPriceAmount
    : extractFirstMoneyAmount(offer.maximumRecommendedPrice);
  if (Number.isFinite(askingPriceNumber) && Number.isFinite(maxPrice) && maxPrice < askingPriceNumber && /buy/i.test(decision.recommendation || "")) {
    const conditionalText = `Buy only if negotiated to ${formatMoney(maxPrice)} or below. The current asking price is ${formatMoney(askingPriceNumber)}, so the deal is conditional rather than an unconditional Buy.`;
    return [conditionalText, text].filter(Boolean).join(" ");
  }
  if (!reliableCompsFound || decision.valueRating === "Insufficient Evidence") {
    if (decision.valueRating !== "Insufficient Evidence" && Array.isArray(offer.recommendedOffer) && offer.recommendedOffer.length) {
      return text || `Use this as cautious personal-use negotiation, not a verified market claim. ${offer.openingOffer}; ${offer.targetPurchasePrice}; keep the maximum tied to the central supported range and condition.`;
    }
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
  if (isRetailStorePurchaseContext(buyerIntake.purchase_context)) {
    if (!getSearchBarcodeDigits(identity, buyerIntake)) {
      addUnique(needed, "Upload a closer barcode photo or enter the UPC manually.");
    }
    if (!getRetailStoreName(buyerIntake)) {
      addUnique(needed, "Add the store name.");
    }
    if (!normalizeZipCode(buyerIntake.location_zip) && !cleanText(buyerIntake.location_area) && !/browser_location_(zip|general_area)|manual_zip|location_skipped/.test(buyerIntake.location_mode || "")) {
      addUnique(needed, "Enter your ZIP code for nearby retail price context.");
    }
    if (!hasKnownValue(identity.packageQuantity) && !hasKnownValue(identity.unitCount)) {
      addUnique(needed, "Confirm the box size, count, quantity, and any variation such as security, peel-and-seal, or plain.");
    }
  }
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
  const canonicalTitle = cleanText(identity.canonicalProductIdentity?.customerFacingTitle);
  if (canonicalTitle) {
    return `Identified as: ${canonicalTitle}. Canonical identity confidence: ${identity.canonicalProductIdentity.canonicalConfidence || "not established"}.`;
  }

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
  const canonical = identity.canonicalProductIdentity || {};
  const canonicalTitle = cleanText(canonical.customerFacingTitle);

  if (canonicalTitle) {
    known.push(`Canonical product identity: ${canonicalTitle}`);
  }
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
    exactProductIdentity: canonicalTitle || identity.exactProductIdentity || "Not verified",
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

function isOwnerValueIntent(value) {
  return /^owner_value$/i.test(cleanText(value));
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

function formatMoneyRangeFromAmounts(low, high) {
  if (Math.abs(low - high) < 0.01) {
    return formatSourceMoney(low);
  }
  return `${formatSourceMoney(low)}-${formatSourceMoney(high)}`;
}

function formatMoney(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "";
  }
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatSourceMoney(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  const roundedCents = Math.round(value * 100) / 100;
  return roundedCents.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatSourceMoneyWithCents(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
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
  const organicResultCount = Number(liveSearch.organicResultCount || diagnostics.organicResultCount || 0);
  const shoppingResultCount = Number(liveSearch.shoppingResultCount || diagnostics.shoppingResultCount || 0);
  const parsedCandidateCount = Number(liveSearch.parsedCandidateCount || diagnostics.parsedCandidateCount || diagnostics.parsedResultCount || 0);
  const normalizedCandidateCount = Number(liveSearch.normalizedCandidateCount || diagnostics.normalizedCandidateCount || diagnostics.normalizedResultCount || 0);
  const retainedVisibleResultCount = Number(liveSearch.retainedVisibleResultCount || diagnostics.retainedVisibleResultCount || 0);
  const rejectedCandidateCount = Number(liveSearch.rejectedCandidateCount || diagnostics.rejectedCandidateCount || diagnostics.rejectedResultCount || 0);
  const coverage = [
    `Source categories targeted: ${buildSourcesTargeted(liveSearch.sourceRoute).join("; ")}`
  ];

  coverage.push(`Search provider used: ${cleanText(liveSearch.searchProviderUsed || diagnostics.searchProviderUsed || "OpenAI web_search")}.`);
  if (diagnostics.serperConfigured !== undefined) {
    coverage.push(`Serper configured: ${diagnostics.serperConfigured ? "Yes" : "No"}. Fallback provider used: ${diagnostics.fallbackProviderUsed ? "Yes" : "No"}.`);
  }

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
  if (organicResultCount || shoppingResultCount) {
    coverage.push(`${organicResultCount} organic Google result${organicResultCount === 1 ? "" : "s"} and ${shoppingResultCount} shopping result${shoppingResultCount === 1 ? "" : "s"} returned by the provider.`);
  }
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
    for (const phrase of parseListLikeSearchPhrases(value)) {
      addUnique(evidence, phrase);
    }
  }
  for (const list of arrays) {
    for (const item of normalizeStringArray(list, 24)) {
      for (const phrase of parseListLikeSearchPhrases(item)) {
        addUnique(evidence, phrase);
      }
    }
  }
  return evidence.slice(0, 42);
}

function extractDistinctiveSearchPhrases(evidenceItems) {
  const phrases = [];
  for (const item of evidenceItems) {
    const sources = parseListLikeSearchPhrases(item);
    for (const sourceItem of sources) {
      const source = normalizeTokenString(sourceItem).replace(/[?!]+/g, "").trim();
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
    ["boxed envelopes", /envelope|envelopes|stationery|security envelope|strip\s*&?\s*seal|peel[- ]?and[- ]?seal|gummed/],
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
  const text = sanitizeSearchPhrase(value).replace(/"/g, "").trim();
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
  if (context.barcodeDigits && text.includes(context.barcodeDigits.toLowerCase())) score += 14;
  if ((context.retailStoreContext || context.onlineRetailerContext) && /\b(?:retail|shopping|current price|manufacturer price|replacement cost|pickup|nearby)\b/.test(text)) score += 5;
  if (context.storeName && text.includes(context.storeName.toLowerCase())) score += 7;
  if (context.retailerDomain && text.includes(context.retailerDomain.toLowerCase())) score += 6;
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
  const text = sanitizeSearchQueryText(normalizeTokenString(value))
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
    context.subjectIdentity,
    context.finalizedSearchIdentity,
    context.canonicalCustomerTitle
  ].flat().map(cleanText).join(" ").toLowerCase();

  if (!/\blimited edition\b/.test(evidenceText)) {
    text = text.replace(/\blimited edition\b/gi, "");
  }

  for (const term of normalizeStringArray(context.unsupportedIdentityTerms, 24)) {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi");
    text = text.replace(pattern, "");
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

function finalizeSearchQueryCandidate(value, context = {}, maxTerms = 12) {
  let cleaned = cleanSearchQuery(removeUnsupportedQueryDescriptors(value, context), maxTerms);
  if (isCurrentRetailOnlyMode(context.retailEvidenceMode) && isRetailForbiddenSecondaryEvidenceText(cleaned)) {
    cleaned = stripRetailSecondaryMarketQueryTerms(cleaned);
  }
  const unsupportedTerms = findUnsupportedQueryTerms(cleaned, context);
  if (unsupportedTerms.length) {
    for (const term of unsupportedTerms) {
      cleaned = cleaned.replace(new RegExp(`\\b${escapeRegExp(term)}\\b`, "gi"), "");
    }
    cleaned = cleanSearchQuery(cleaned, maxTerms);
  }
  if (findUnsupportedQueryTerms(cleaned, context).length) {
    return "";
  }
  return cleaned;
}

function findUnsupportedQueryTerms(query, context = {}) {
  const text = cleanText(query).toLowerCase();
  if (!text) {
    return [];
  }
  const terms = normalizeStringArray(context.unsupportedIdentityTerms, 24)
    .map((term) => term.toLowerCase())
    .filter(Boolean);
  const found = [];
  for (const term of terms) {
    if (new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text)) {
      found.push(term);
    }
  }
  return found;
}

function normalizeTokenString(value) {
  return normalizeSearchQuotes(value)
    .replace(/[|[\]{}]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function trimQueryTerms(text, maxTerms) {
  const terms = splitQueryTermsPreservingQuotes(text);
  return terms.slice(0, maxTerms).join(" ");
}

function splitQueryTermsPreservingQuotes(text) {
  return cleanText(text).match(/"[^"]+"|\S+/g) || [];
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
  const hasSiteRestriction = /\bsite:[a-z0-9.-]+/i.test(normalized);
  for (const existing of existingQueries) {
    const existingNormalized = existing.toLowerCase();
    const existingHasSiteRestriction = /\bsite:[a-z0-9.-]+/i.test(existingNormalized);
    if (hasSiteRestriction !== existingHasSiteRestriction) {
      continue;
    }
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

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value] : [];
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

export const __queryIntegrityTestHooks = {
  normalizeBuyerIntake,
  finalizeIdentityForResearch,
  buildCanonicalProductIdentity,
  routeMarketSources,
  buildLiveSearchQueries,
  buildSearchQueryContext,
  buildRetailContextSearchQueries,
  buildRetailStagedSearchQueries,
  buildRetailSerperSearchPlan,
  retailSerperBudgetAllocation,
  finalizeSearchQueryCandidate,
  findUnsupportedQueryTerms,
  buildSerperSearchPlan,
  buildSerperMarketplaceQuery,
  buildSerperSingleMarketplaceQuery,
  bucketSerperRecords,
  parseSerperResponse,
  isStrongComparableEvidenceRecord,
  isNoPriceIdentityReference,
  cleanSerperQuery,
  parseListLikeSearchPhrases,
  validateSerperQueryCandidate,
  splitQueryTermsPreservingQuotes,
  shortenSerperQueryWithoutFragments,
  createSerperRequestRecord,
  evaluateComparableItemTypeCompatibility,
  classifySerperIdentityMatch,
  classifySerperPriceEvidence,
  buildSerperEvidenceRole,
  canInfluenceValuationFromVisibleRecord,
  canSupportPreliminaryAskingRangeFromVisibleRecord,
  buildConsumerPricesFound,
  buildBestCompatiblePriceFound,
  buildOtherCompatiblePricesFound,
  buildPriceSpectrumSummary,
  buildCurrentPurchaseOptionSummary,
  summarizeConsumerVisiblePriceEvidence,
  buildConsumerOffer,
  buildConsumerRecommendationText,
  buildMaximumRecommendedPricePolicy,
  buildMaximumPriceEvidenceProfile,
  classifyConsumerPurchaseDecision,
  buildWeightedPriceEvidenceRecord,
  analyzePriceEvidenceCluster,
  extractShippingEvidence,
  normalizePriceTypeLabel,
  isQualifiedVerifiedSoldPriceEvidence,
  isNonTransactionalContentRecord,
  isBulkLotReferenceWithoutUnitPrice,
  hasExplicitSoldTransactionProof,
  isCurrentPurchasablePriceFoundRecord,
  buildRetailDecisionCalibration,
  classifyRetailPackageCompatibility,
  buildRetailEvidenceProfile,
  extractPackQuantityNumber,
  extractDisplayedPrice,
  parseCurrencyCents,
  moneyAmountToCents,
  formatMoney,
  formatSourceMoney,
  formatUnitMoney,
  normalizeBarcodeDigits
};
