const listingSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "platform",
    "categorySuggestion",
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
    "productNameOrBoxTitle",
    "frontBoxWording",
    "backLabelWording",
    "manufacturerLocationText",
    "visiblePrice",
    "brandSeries",
    "visibleText",
    "guidedBuyerIntakeSummary",
    "identityConflictNotes",
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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = parseBody(req.body);
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

async function generateReportWithOpenAI({ apiKey, model, platform, notes, photos, reportType, buyerIntake }) {
  if (reportType === "marketValue") {
    return generateMarketValueReportWithLiveSearch({ apiKey, model, platform, notes, photos, buyerIntake });
  }

  return generateListingWithOpenAI({ apiKey, model, platform, notes, photos });
}

async function generateListingWithOpenAI({ apiKey, model, platform, notes, photos }) {
  const userContent = [
    {
      type: "input_text",
      text: [
        `Marketplace platform: ${platform}`,
        `Seller item notes: ${notes}`,
        "",
        "Create a practical marketplace listing. Be specific, honest, and concise.",
        "Do not claim unseen condition details. If something is uncertain from the photos or notes, say what the seller should verify."
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
    systemText: "You are Listing Engine, a careful assistant that turns item photos and seller notes into marketplace listing drafts. Return only the requested structured JSON.",
    userContent,
    schemaName: "marketplace_listing",
    schema: listingSchema
  });

  return (await requestOpenAIJson({ apiKey, payload })).json;
}

async function generateMarketValueReportWithLiveSearch({ apiKey, model, platform, notes, photos, buyerIntake }) {
  const intake = buyerIntake || normalizeBuyerIntake({});
  const identity = await extractItemIdentity({ apiKey, model, platform, notes, photos, buyerIntake: intake });
  const sourceRoute = routeMarketSources(identity, intake, platform);
  const searchQueries = buildLiveSearchQueries(identity, sourceRoute, notes, intake);
  const liveSearch = await executeLiveComparableSearch({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, buyerIntake: intake });
  const report = await generateFinalMarketValueReport({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, liveSearch, buyerIntake: intake });

  return enforceLiveSearchHonesty(report, liveSearch, intake, identity, platform);
}

async function extractItemIdentity({ apiKey, model, platform, notes, photos, buyerIntake }) {
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const userContent = [
    {
      type: "input_text",
      text: [
        "Extract the strongest searchable item identity from the photos and buyer notes.",
        "Use Guided Buyer Intake as structured buyer-provided clues, but still verify against photos and visible text.",
        "Preserve item name, brand, manufacturer, model, SKU, UPC, approximate age or era, condition, asking price, purchase context, and condition concerns when provided.",
        "Do not silently discard conflicts between typed identity fields, buyer notes, and photo evidence. Add conflicts or uncertainty to identityConflictNotes and lower confidence later.",
        "Prioritize exact visible front-box wording, back-label wording, manufacturer/location text, brand/series text, product name or box title, UPC/barcode, item code/SKU/style number, distinctive visual description, category, size, condition, visible price, and current asking price.",
        "Preserve searchable text exactly when visible. Do not collapse label text into generic terms if a brand, series, city/state, SKU, UPC, or item code appears.",
        "For collegiate products, preserve team name, school name, mascot, licensing sticker text, manufacturer stamp, model number, copyright wording, year, product category, dimensions, material, lid status, and missing-component status when visible or provided.",
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
    systemText: "You identify marketplace items from photos and buyer notes. Return only structured JSON.",
    userContent,
    schemaName: "item_identity",
    schema: itemIdentitySchema
  });

  return normalizeIdentity((await requestOpenAIJson({ apiKey, payload })).json);
}

async function executeLiveComparableSearch({ apiKey, model, platform, notes, identity, sourceRoute, searchQueries, buyerIntake }) {
  const searchStartedAt = new Date().toISOString();
  const buyerIntakeText = formatBuyerIntakeForPrompt(buyerIntake);
  const userContent = [
    {
      type: "input_text",
      text: [
        "Perform source-routed live comparable search for a buyer deciding whether to buy this item right now.",
        "You must use web search. Do not rely only on general model knowledge.",
        "Use only the source route and targeted queries below. Do not default to eBay unless the route includes an eBay-related source.",
        "Use the targeted search queries as product-focused search inputs. Do not replace them with repetitive code-only queries or platform-stuffed variants.",
        "Search exact identifiers, brand/product-title wording, visual descriptions, category terms, and price/context when present.",
        "Return comparableItemsFound only when the result is source-backed and includes a URL from the live search results.",
        "Each comparableItemsFound string must include source/platform/site, title, price when visible, shipping when visible, condition when visible, URL/source link, match quality, and why it appears to match or is only similar.",
        "Do not invent URLs, prices, sources, sold comps, or platforms.",
        "For vintage, collectible, collegiate, ceramic, cookie-jar, decor, and secondhand items, prioritize exact label/stamp searches, eBay-style resale results, Etsy-style vintage results, Mercari-style resale results, collector/reference sources, team/school/mascot/licensee searches, and Google-style exact phrase results.",
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
    "Use Guided Buyer Intake as the current purchase opportunity. The asking price is the seller/store price right now, not automatic market value.",
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
    "For vintage, collectible, collegiate, ceramic, cookie-jar, decor, and secondhand items, prioritize exact label and stamp searches, eBay-style resale, Etsy-style vintage, Mercari-style resale, collector/reference clues, team/school/licensee searches, and exact phrase results. Deprioritize generic wholesalers, restaurant-supply sites, bulk import/manufacturing catalogs, unrelated current retail, and generic visual lookalikes.",
    "For collegiate products, do not treat an officially licensed sticker as proof of the manufacturer. If the manufacturer stamp is unclear, ask for a closer photo of the stamp while still preserving team/school/mascot clues.",
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
  return {
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
    productNameOrBoxTitle: cleanText(identity.productNameOrBoxTitle || "Unknown") || "Unknown",
    frontBoxWording: cleanText(identity.frontBoxWording || "Unknown") || "Unknown",
    backLabelWording: cleanText(identity.backLabelWording || "Unknown") || "Unknown",
    manufacturerLocationText: cleanText(identity.manufacturerLocationText || "Unknown") || "Unknown",
    visiblePrice: cleanText(identity.visiblePrice || "Unknown") || "Unknown",
    brandSeries: cleanText(identity.brandSeries || "Unknown") || "Unknown",
    visibleText: normalizeStringArray(identity.visibleText, 10),
    guidedBuyerIntakeSummary: cleanText(identity.guidedBuyerIntakeSummary || "Unknown") || "Unknown",
    identityConflictNotes: normalizeStringArray(identity.identityConflictNotes, 6),
    distinctiveVisualDescription: cleanText(identity.distinctiveVisualDescription || "Unknown") || "Unknown",
    likelyItemDescription: cleanText(identity.likelyItemDescription || "Unknown") || "Unknown",
    strongestSearchableIdentifiers: normalizeStringArray(identity.strongestSearchableIdentifiers, 8),
    buyerContext: normalizeStringArray(identity.buyerContext, 8, ["unknown"])
  };
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
  const isCollegiateCollectible = /collegiate|college|university|ncaa|officially licensed|license|licensing|team|school|mascot|bulldog|tigers|crimson|sooners|razorbacks|lsu|georgia|alabama|oklahoma|arkansas/.test(haystack);
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
    if (isVintageCollectible || isSeasonalDecor || isCollegiateCollectible || isCookieJarOrContainer) {
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

  if ((isSecondhandContext || hasResaleIntent) && (isSeasonalDecor || isVintageCollectible || isCollegiateCollectible || isCookieJarOrContainer || !isRetailCurrent)) {
    route.push("secondhand resale results", "vintage and collector sources", "specialty reference sources", "exact-label web results");
    if (isSeasonalDecor || isVintageCollectible || isCollegiateCollectible || isCookieJarOrContainer) {
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

  if (isSeasonalDecor || isVintageCollectible || isCollegiateCollectible || isCookieJarOrContainer) {
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
  const productTitle = firstKnown(buyerIntake.item_name, identity.productNameOrBoxTitle, identity.likelyItemDescription, notesText.slice(0, 120));
  const brand = firstKnown(buyerIntake.known_brand, identity.brandSeries, identity.brand, buyerIntake.known_manufacturer, identity.manufacturer);
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
  const price = buyerIntake.parsed_asking_price === null ? extractPrice(identity.currentAskingPrice) || extractPrice(notesText) : String(buyerIntake.parsed_asking_price);
  const queries = [];
  const seasonalDecor = isSeasonalDecorIdentity(identity, routeText, notesText);
  const collegiateCollectible = isCollegiateCollectibleIdentity(identity, routeText, notesText);

  if (upc) {
    queries.push(upc);
    queries.push(compactWords([upc, brand || manufacturer || productTitle]));
  }

  if (collegiateCollectible) {
    queries.push(compactWords([schoolName || teamName, mascot, productTitle, "ceramic collectible"]));
    queries.push(compactWords([schoolName || teamName, mascot, "cookie jar canister"]));
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

  return diverseQueries.slice(0, seasonalDecor || collegiateCollectible ? 6 : 5);
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
    identity.productNameOrBoxTitle,
    identity.likelyItemDescription,
    identity.distinctiveVisualDescription,
    identity.material,
    identity.teamName,
    identity.schoolName,
    identity.mascot,
    identity.licensingStickerText
  ].join(" ").toLowerCase();

  if (/collegiate|college|university|ncaa|mascot|bulldog|officially licensed|licensee/.test(haystack)) {
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

function formatKnownPart(label, value) {
  const text = firstKnown(value);
  return text ? `${label}: ${text}` : "";
}

function isResaleIntent(value) {
  return /^(resale|both)$/i.test(cleanText(value));
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

  if (/vintage|collectible|ceramic|cookie jar|container|canister|collegiate|mascot|licensee|etsy|mercari|collector|resale/.test(routeText)) {
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
  return compactWords([
    identity.size,
    identity.distinctiveVisualDescription,
    identity.color,
    identity.material,
    mostDistinctiveProductWord(identity.likelyItemDescription),
    mostDistinctiveCategoryWord(identity.category),
    inferVisualTerms(notes)
  ]);
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
    Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : ""
  ].join(" ").toLowerCase();

  return /santa|christmas|holiday|seasonal|workshop|hubbard|boxed|figurine|ceramic.*figure|resin.*figure|decor/.test(haystack)
    && !/laptop|computer|electronics|dress|apparel|fashion|furniture|sofa|chair|table/.test(haystack);
}

function isCollegiateCollectibleIdentity(identity, routeText, notesText) {
  const haystack = [
    routeText,
    notesText,
    identity.category,
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
    Array.isArray(identity.visibleText) ? identity.visibleText.join(" ") : ""
  ].join(" ").toLowerCase();

  return /collegiate|college|university|ncaa|officially licensed|license|licensing|team|school|mascot|bulldog|tigers|crimson|sooners|razorbacks|lsu|georgia|alabama|oklahoma|arkansas/.test(haystack)
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
    ["collegiate", "collegiate collectible"],
    ["officially licensed", "officially licensed"],
    ["bulldog", "bulldog mascot"],
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
  if (/collegiate|college|university|mascot|bulldog|licensed|cookie jar|container/i.test(cleaned)) {
    return "collegiate ceramic mascot collectible cookie jar";
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
