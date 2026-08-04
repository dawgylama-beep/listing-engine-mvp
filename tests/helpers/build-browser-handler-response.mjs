import { createGenerateListingHandler } from "../../api/generate-listing.js";
import { validateFinalEvidenceResult } from "../../lib/evidence/index.js";
import { retailRecoveryFixture } from "../fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./hard-network-denial.mjs";

const collectibleVisualRecognition = Object.freeze({
  visualSubject: "Riverton Falcons 1999 Champions collector tray",
  visualSubjectCategory: "sports advertising collectible",
  visualSubjectConfidence: "High",
  recognizedOrganization: "Riverton Falcons",
  recognizedBrand: "RefreshCo",
  recognizedInstitution: "Riverton University",
  recognizedTheme: "1999 Champions",
  visibleLogos: ["RefreshCo", "Riverton Falcons"],
  visibleWords: ["RIVERTON", "1999 CHAMPIONS", "Coach Rivera", "RefreshCo"],
  visibleColors: ["navy", "gold", "white"],
  distinctiveFeatures: ["collector tray", "championship wording", "coach portrait"],
  visualEvidence: ["RefreshCo script", "Riverton championship wording", "collector tray shape"],
  possibleInterpretations: ["commemorative sports advertising collector tray"],
  uncertaintyNotes: ["Manufacturing date is not independently confirmed."],
  visualStyle: "collegiate advertising collectible",
  estimatedEraStyle: "late 1990s"
});

const collectibleIdentity = Object.freeze({
  visualRecognition: collectibleVisualRecognition,
  visualSubject: collectibleVisualRecognition.visualSubject,
  visualSubjectCategory: collectibleVisualRecognition.visualSubjectCategory,
  visualSubjectConfidence: "High",
  recognizedOrganization: "Riverton Falcons",
  recognizedBrand: "RefreshCo",
  recognizedInstitution: "Riverton University",
  recognizedTheme: "1999 Champions",
  brand: "RefreshCo",
  manufacturer: "RefreshCo",
  model: "RFC-1999-CR",
  teamName: "Riverton Falcons",
  schoolName: "Riverton University",
  mascot: "Falcons",
  category: "sports advertising collectible tray",
  likelyItemDescription: "RefreshCo Riverton Falcons 1999 Champions collector tray",
  subjectIdentity: "Riverton Falcons RefreshCo collector tray",
  exactProductIdentity: "RefreshCo Riverton Falcons 1999 Champions collector tray",
  exactProductConfidence: "High",
  productNameOrBoxTitle: "RefreshCo Riverton Falcons collector tray",
  frontBoxWording: "1999 CHAMPIONS RIVERTON RefreshCo Coach Rivera",
  backLabelWording: "Official Riverton Falcons collector tray",
  brandSeries: "RefreshCo collegiate collector tray",
  condition: "used",
  currentAskingPrice: "$10.00",
  visiblePrice: "$10.00",
  visibleText: ["RIVERTON", "1999 CHAMPIONS", "Coach Rivera", "RefreshCo"],
  visualIdentityEvidence: ["RefreshCo logo", "Riverton Falcons championship wording", "collector tray shape"],
  textIdentityEvidence: ["RIVERTON", "1999 CHAMPIONS", "Coach Rivera"],
  strongestSearchableIdentifiers: [
    "Riverton Falcons 1999 Champions RefreshCo collector tray",
    "Coach Rivera Riverton championship tray"
  ],
  identitySummary: "RefreshCo Riverton Falcons 1999 Champions collector tray.",
  identityConflictNotes: [],
  buyerContext: []
});

const collectibleProviderResponse = Object.freeze({
  organic: [
    {
      position: 1,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray",
      link: "https://market-one.example/item/riverton-1999-champions-tray",
      snippet: "Exact Coach Rivera and 1999 Champions tray design. Model RFC-1999-CR. Price unavailable."
    },
    {
      position: 2,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray",
      link: "https://market-two.example/item/riverton-1999-champions-tray",
      snippet: "Active listing for the exact collector tray design, model RFC-1999-CR. Asking price $24.99."
    },
    {
      position: 3,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray",
      link: "https://market-two.example/item/riverton-1999-champions-tray?tracking=duplicate",
      snippet: "Duplicate observation of model RFC-1999-CR exact active listing at $24.99."
    },
    {
      position: 4,
      title: "Riverton Falcons collector trays",
      link: "https://archive.example/category/riverton-collector-trays",
      snippet: "Category page for assorted collector trays."
    },
    {
      position: 5,
      title: "Riverton Falcons 2001 runner-up tray",
      link: "https://market-three.example/item/riverton-2001-runner-up-tray",
      snippet: "Different year and different championship design. Asking price $15.00."
    },
    {
      position: 6,
      title: "History of promotional collector trays",
      link: "https://history.example/articles/promotional-collector-trays",
      snippet: "General history article without an item-specific offer."
    }
  ]
});

const listingModelResponse = Object.freeze({
  optimizedListingTitle: "Cedarline Privacy Mailers 48 Count",
  title: "Cedarline Privacy Mailers 48 Count",
  listingDescription: "Cedarline privacy mailers shown in the submitted deterministic test image.",
  description: "Cedarline privacy mailers shown in the submitted deterministic test image.",
  itemSpecifics: { Brand: "Cedarline", Quantity: "48 count" },
  itemDetails: { Brand: "Cedarline", Quantity: "48 count" },
  conditionNotes: "Condition should be verified from the submitted image.",
  recommendedListingPrice: "$10.00",
  pricingConfidence: "Model value must be replaced by canonical evidence."
});

function createResponseCapture() {
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

function marketValueModelResponse(baseReport) {
  return {
    ...baseReport,
    estimatedMarketValue: "$8.00 - $10.00",
    suggestedListingPrice: "$10.00",
    expectedSalePrice: "$8.00 - $10.00",
    minimumAcceptablePrice: "$7.00",
    recommendedSellingPlatform: "Local marketplace",
    expectedSellingTime: "Unknown",
    platformSpecificSellingGuidance: "Use canonical evidence."
  };
}

function modelResponse(schemaName, evidenceMode) {
  const collectible = evidenceMode === "collectible";
  const baseReport = retailRecoveryFixture.finalReport;
  if (schemaName === "item_identity") {
    return {
      ...(collectible ? collectibleIdentity : retailRecoveryFixture.identity),
      visualRecognition: collectible ? collectibleVisualRecognition : retailRecoveryFixture.visualRecognition
    };
  }
  if (schemaName === "consumer_purchase_decision") {
    return baseReport;
  }
  if (schemaName === "market_value_report") {
    return marketValueModelResponse(baseReport);
  }
  if (schemaName === "marketplace_listing") {
    return listingModelResponse;
  }
  throw new Error(`Unexpected deterministic browser schema: ${schemaName}`);
}

function buildRetailProviderFixture(requestBody = {}) {
  const intake = requestBody.buyerIntake || requestBody.sellerIntake || {};
  const upc = String(intake.known_upc || intake.known_upc_digits || "").replace(/\D/g, "");
  if (!upc || upc === retailRecoveryFixture.identity.upcBarcode) {
    return {
      preliminaryProviderResponse: retailRecoveryFixture.preliminaryProviderResponse,
      recoveryProviderResponse: retailRecoveryFixture.recoveryProviderResponse,
      directPageResult: retailRecoveryFixture.directPageResult,
      exactUrl: retailRecoveryFixture.directPageResult.finalUrl,
      compatibleDirectPageText: "Harborline Security Envelopes 48 Count 4.125 x 9.5 inches Strip and seal"
    };
  }
  const brand = String(intake.known_brand || "Synthetic Office").trim();
  const itemName = String(intake.item_name || `${brand} Security Envelopes`).trim();
  const count = Number(itemName.match(/\b(\d{1,4})\s*(?:count|ct)\b/i)?.[1] || 1);
  const exactUrl = `https://direct.example/p/verified-security-envelopes-${upc}`;
  const exactSnippet = `UPC ${upc}. ${count} count. 4.125 x 9.5 inches. Strip and seal.`;
  return {
    preliminaryProviderResponse: {
      organic: [{
        position: 1,
        title: itemName,
        link: exactUrl,
        snippet: `Official product page. ${exactSnippet} Price unavailable.`
      }]
    },
    recoveryProviderResponse: {
      organic: [
        {
          position: 1,
          title: itemName,
          link: exactUrl,
          snippet: `Current retail price $4.99. ${exactSnippet}`
        },
        {
          position: 2,
          title: `Harborline Security Envelopes ${count} Count`,
          link: `https://alternate.example/p/security-envelopes-${count}`,
          snippet: `Current retail price $4.49. ${count} count. 4.125 x 9.5 inches. Strip and seal security envelopes.`
        },
        {
          position: 3,
          title: itemName,
          link: `${exactUrl}?utm_source=synthetic-duplicate`,
          snippet: `Current retail price $4.99. UPC ${upc}. Same product-page observation.`
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
          title: itemName,
          link: `https://reference.example/p/verified-security-envelopes-${upc}`,
          snippet: `Exact UPC ${upc} identity page. Price unavailable.`
        }
      ]
    },
    directPageResult: {
      finalUrl: exactUrl,
      statusCode: 200,
      elapsedMs: 3,
      html: `<html><body><h1>${itemName}</h1><span>UPC ${upc}</span><span>${count} count</span><span>4.125 x 9.5 inches</span></body></html>`,
      sourceEvidenceText: `${itemName} UPC ${upc} ${count} count 4.125 x 9.5 inches Strip and seal`
    },
    exactUrl,
    compatibleDirectPageText: `Harborline Security Envelopes ${count} Count 4.125 x 9.5 inches Strip and seal`
  };
}

function directPageResult(url, evidenceMode, retailFixture) {
  if (evidenceMode !== "collectible") {
    const exactPage = url.split("?")[0] === retailFixture.exactUrl.split("?")[0];
    const sourceEvidenceText = exactPage
      ? retailFixture.directPageResult.sourceEvidenceText
      : retailFixture.compatibleDirectPageText;
    return {
      ...retailFixture.directPageResult,
      finalUrl: url,
      html: `<html><body>${sourceEvidenceText}</body></html>`,
      sourceEvidenceText
    };
  }
  return {
    finalUrl: url,
    statusCode: 200,
    elapsedMs: 2,
    html: "<html><body><h1>Riverton Falcons 1999 Champions RefreshCo collector tray</h1><p>Coach Rivera exact design. Model RFC-1999-CR.</p><p>Price unavailable.</p></body></html>",
    sourceEvidenceText: "Riverton Falcons 1999 Champions RefreshCo collector tray Coach Rivera exact design model RFC-1999-CR Price unavailable"
  };
}

function responseEnvelope(requestBody = {}) {
  return requestBody.reportType === "listing" ? "listing" : "valuation";
}

function malformedPayload(payload, envelope) {
  const clone = structuredClone(payload);
  const report = clone[envelope];
  report.customerEvidence = null;
  delete report.customerEvidenceSummary;
  report.pricesFound = [{
    evidenceId: "legacy-poison",
    sourceLabel: "Wrong retailer",
    title: "Fabricated fallback record",
    destinationUrl: "https://wrong.example/fabricated",
    canonicalPrice: 999,
    canonicalPriceType: "Current retail price",
    canonicalMatchLabel: "Exact",
    customerPriceLabel: "$999.00"
  }];
  return clone;
}

export async function buildBrowserHandlerResponse({
  requestBody,
  evidenceMode = "retail",
  malformedCanonical = false
} = {}) {
  if (!requestBody || typeof requestBody !== "object") {
    throw new Error("A real browser request body is required.");
  }

  const schemas = [];
  const providerStages = [];
  const directPageRequests = [];
  const finalized = [];
  const retailFixture = buildRetailProviderFixture(requestBody);
  let clock = Date.parse(retailRecoveryFixture.fixedNow);
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-browser-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => requestBody.analysisId || `analysis-browser-${evidenceMode}`,
    nowMilliseconds: () => {
      clock += 5;
      return clock;
    },
    nowIso: () => new Date(clock).toISOString(),
    requestOpenAIJson: async ({ payload }) => {
      const schemaName = payload?.text?.format?.name;
      schemas.push(schemaName);
      return {
        json: modelResponse(schemaName, evidenceMode),
        data: { output: [] }
      };
    },
    requestSerperSearch: async ({ queryRecord }) => {
      const stage = queryRecord?.retailStage || queryRecord?.searchPass || "unknown";
      providerStages.push(stage);
      return {
        json: evidenceMode === "collectible"
          ? collectibleProviderResponse
          : stage === "stage_7_limited_result_recovery"
            ? retailFixture.recoveryProviderResponse
            : retailFixture.preliminaryProviderResponse,
        statusCode: 200,
        elapsedMs: 2
      };
    },
    requestBoundedRetailProductPage: async (url) => {
      directPageRequests.push(url);
      return directPageResult(url, evidenceMode, retailFixture);
    },
    onFinalEvidenceResult: (result) => finalized.push(result)
  });

  const response = createResponseCapture();
  const networkGuard = installHardNetworkDenial();
  try {
    await handler({ method: "POST", body: structuredClone(requestBody) }, response);
  } finally {
    networkGuard.restore();
  }

  if (response.statusCode !== 200 || !response.payload) {
    throw new Error(`Deterministic production handler failed with status ${response.statusCode}.`);
  }
  if (networkGuard.attempts.length !== 0) {
    throw new Error(`Unexpected Node network attempts: ${JSON.stringify(networkGuard.attempts)}`);
  }
  if (finalized.length !== 1) {
    throw new Error(`Expected one finalizer execution, received ${finalized.length}.`);
  }
  validateFinalEvidenceResult(finalized[0]);

  const envelope = responseEnvelope(requestBody);
  const payload = malformedCanonical
    ? malformedPayload(response.payload, envelope)
    : response.payload;

  return {
    payload,
    envelope,
    report: payload[envelope],
    canonicalReport: response.payload[envelope],
    finalEvidenceResult: finalized[0],
    metadata: {
      schemas,
      providerStages,
      directPageRequests,
      finalizerExecutions: finalized.length,
      unexpectedNodeNetworkAttempts: networkGuard.attempts
    }
  };
}
