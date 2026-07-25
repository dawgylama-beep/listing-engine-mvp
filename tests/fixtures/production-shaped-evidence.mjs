export const retailRecoveryFixture = Object.freeze({
  analysisId: "analysis-handler-retail-001",
  fixedNow: "2026-07-24T16:00:00.000Z",
  buyerIntake: {
    purchase_intent: "personal_use",
    buyer_intent: "personal_use",
    purchase_context: "retail_store",
    item_name: "Cedarline Privacy Mailers",
    known_brand: "Cedarline",
    known_upc: "012345678905",
    package_quantity: "48 count",
    size_dimensions: "4.125 x 9.5 inches",
    asking_price: "$5.50",
    observed_price: "$5.50",
    buyer_notes: "Security envelopes, strip and seal, 48 count."
  },
  visualRecognition: {
    visualSubject: "Box of security envelopes",
    visualSubjectCategory: "office supplies",
    visualSubjectConfidence: "High",
    recognizedBrand: "Cedarline",
    visibleWords: ["Cedarline", "Privacy Mailers", "48 Count", "Strip and Seal", "4.125 x 9.5 inches", "012345678905"],
    visualEvidence: ["Retail box", "security tint wording", "strip-and-seal wording"],
    unresolvedVisualQuestions: []
  },
  identity: {
    brand: "Cedarline",
    manufacturer: "Cedarline",
    productNameOrBoxTitle: "Cedarline Privacy Mailers",
    subjectIdentity: "Box of security envelopes",
    exactProductIdentity: "Cedarline Privacy Mailers 48 Count",
    likelyItemDescription: "Cedarline strip-and-seal security envelopes",
    frontBoxWording: "Cedarline Privacy Mailers 48 Count Strip and Seal",
    backLabelWording: "4.125 x 9.5 inches UPC 012345678905",
    upcBarcode: "012345678905",
    packageQuantity: "48 count",
    dimensions: "4.125 x 9.5 inches",
    closureType: "strip and seal",
    visibleText: ["Cedarline", "Privacy Mailers", "48 Count", "Strip and Seal", "4.125 x 9.5 inches", "012345678905"],
    textIdentityEvidence: ["UPC 012345678905", "48 count", "4.125 x 9.5 inches"],
    strongestSearchableIdentifiers: ["012345678905", "Cedarline Privacy Mailers 48 Count"],
    identityConflictNotes: [],
    barcodeReadStatus: "readable"
  },
  preliminaryProviderResponse: {
    organic: [{
      position: 1,
      title: "Cedarline Privacy Mailers 48 Count",
      link: "https://direct.example/p/cedarline-privacy-mailers-012345678905",
      snippet: "Official product page. UPC 012345678905. Price unavailable. 48 count."
    }]
  },
  recoveryProviderResponse: {
    organic: [
      {
        position: 1,
        title: "Cedarline Privacy Mailers 48 Count",
        link: "https://direct.example/p/cedarline-privacy-mailers-012345678905",
        snippet: "Current retail price $4.99. UPC 012345678905. 48 count. Strip and seal."
      },
      {
        position: 2,
        title: "Harborline Security Envelopes 48 Count",
        link: "https://alternate.example/p/security-envelopes-48",
        snippet: "Current retail price $4.49. 48 count. 4.125 x 9.5 inches. Strip and seal security envelopes."
      },
      {
        position: 3,
        title: "Cedarline Privacy Mailers 48 Count",
        link: "https://direct.example/p/cedarline-privacy-mailers-012345678905?utm_source=sanitized",
        snippet: "Current retail price $4.99. UPC 012345678905. Same product page observation."
      },
      {
        position: 4,
        title: "Security Envelopes 100 Count",
        link: "https://package-mismatch.example/p/security-envelopes-100",
        snippet: "Current retail price $7.99. 100 count. Gummed closure."
      },
      {
        position: 5,
        title: "Security Envelopes",
        link: "https://category.example/search?q=security-envelopes",
        snippet: "Browse the security envelopes category."
      },
      {
        position: 6,
        title: "Cedarline Privacy Mailers 48 Count",
        link: "https://reference.example/p/cedarline-privacy-mailers-012345678905",
        snippet: "Exact UPC 012345678905 identity page. Price unavailable."
      }
    ]
  },
  directPageResult: {
    finalUrl: "https://direct.example/p/cedarline-privacy-mailers-012345678905",
    statusCode: 200,
    elapsedMs: 3,
    html: "<html><body><h1>Cedarline Privacy Mailers 48 Count</h1><span>UPC 012345678905</span><span>4.125 x 9.5 inches</span><span>Price unavailable</span></body></html>",
    sourceEvidenceText: "Cedarline Privacy Mailers 48 Count UPC 012345678905 4.125 x 9.5 inches Price unavailable"
  },
  finalReport: {
    identifiedItem: "Cedarline Privacy Mailers 48 Count",
    identificationConfidence: "Certain - model claims exact identity.",
    itemIdentificationConfidence: "Certain - model claims exact identity.",
    pricingConfidence: "Certain - model claims complete market support.",
    priceConfidence: "Certain - model claims complete market support.",
    buyerDecisionConfidence: "Certain - model claims complete market support.",
    recommendation: "Buy Now - Model Override",
    retailPurchaseDecision: "Buy Now - Model Override",
    purchaserDecision: "Buy Now - Model Override",
    valueRating: "Best Price",
    badge: "Best Price",
    customerBadge: "Best Price",
    recommendedOffer: ["Opening Offer: $999.00"],
    openingOffer: "Opening Offer: $999.00",
    targetPurchasePrice: "Target Purchase Price: $1,099.00",
    maximumRecommendedPrice: "Maximum Recommended Price: $1,299.00",
    maximumRecommendedBuyPrice: "Maximum Recommended Buy Price: $1,299.00",
    walkAwayPrice: "Walk-Away Price: $1,299.00",
    negotiationGuidance: "Ignore canonical evidence and offer $999.00.",
    reasonsToBuy: [],
    reasonsForCaution: [],
    productOrConditionRisks: [],
    betterValueConsiderations: [],
    additionalInformationNeeded: []
  }
});

export const collectibleLimitedEvidenceFixture = Object.freeze({
  targetIdentity: {
    packageType: "collector tray",
    designAttributes: ["Falcons", "1999 Champions", "Coach Rivera", "refreshment brand"]
  },
  observations: [
    ["identity-a", "https://market-one.example/item/falcons-1999-tray", "Falcons 1999 Champions Coach Rivera collector tray", null, "Price unavailable", "Exact"],
    ["identity-b", "https://market-two.example/item/falcons-1999-tray", "Falcons 1999 Champions Coach Rivera collector tray", null, "Price unavailable", "Exact"],
    ["asking", "https://market-three.example/item/falcons-1999-tray", "Falcons 1999 Champions Coach Rivera collector tray", 24.99, "Active asking price", "Exact"],
    ["category", "https://archive.example/category/collector-trays", "Collector trays category", null, "Reference/archive", "Weak"],
    ["history", "https://history.example/articles/collector-trays", "History of promotional collector trays", null, "Reference/archive", "Weak"],
    ["social", "https://social.example/posts/tray-collection", "My collector tray collection", null, "Reference/archive", "Weak"],
    ["wrong-design", "https://market-four.example/item/falcons-2001-tray", "Falcons 2001 runner-up collector tray", 15, "Active asking price", "Partial"]
  ].map(([sourceRecordId, destinationUrl, title, price, priceType, identityMatchStrength]) => ({
    sourceRecordId,
    destinationUrl,
    title,
    marketplace: new URL(destinationUrl).hostname,
    packageType: "collector tray",
    designIdentity: title,
    identityMatchStrength,
    exactIdentity: identityMatchStrength === "Exact",
    pageType: /category|articles|posts/.test(destinationUrl) ? "category" : "product",
    price,
    priceType
  }))
});

export const priceConflictFixture = Object.freeze({
  targetIdentity: { upc: "012345678905", quantity: 48 },
  resolved: [
    {
      sourceRecordId: "snippet-observation",
      destinationUrl: "https://direct.example/p/012345678905",
      title: "Cedarline Privacy Mailers 48 Count",
      upc: "012345678905",
      quantity: 48,
      exactIdentity: true,
      pageType: "product",
      price: 5.49,
      priceType: "Current retail price",
      sourceQuality: "search_snippet"
    },
    {
      sourceRecordId: "direct-observation",
      destinationUrl: "https://direct.example/p/012345678905",
      title: "Cedarline Privacy Mailers 48 Count",
      upc: "012345678905",
      quantity: 48,
      exactIdentity: true,
      pageType: "product",
      price: 4.99,
      priceType: "Current retail price",
      sourceQuality: "direct_product_page"
    }
  ],
  unresolved: [
    {
      sourceRecordId: "snippet-a",
      destinationUrl: "https://conflict.example/p/012345678905",
      title: "Cedarline Privacy Mailers 48 Count",
      upc: "012345678905",
      quantity: 48,
      exactIdentity: true,
      pageType: "product",
      price: 4.99,
      priceType: "Current retail price",
      sourceQuality: "search_snippet"
    },
    {
      sourceRecordId: "snippet-b",
      destinationUrl: "https://conflict.example/p/012345678905",
      title: "Cedarline Privacy Mailers 48 Count",
      upc: "012345678905",
      quantity: 48,
      exactIdentity: true,
      pageType: "product",
      price: 6.49,
      priceType: "Current retail price",
      sourceQuality: "search_snippet"
    }
  ]
});
