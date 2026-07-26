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
      snippet: "Exact Coach Rivera and 1999 Champions tray design. Price unavailable."
    },
    {
      position: 2,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray",
      link: "https://market-two.example/item/riverton-1999-champions-tray",
      snippet: "Active listing for the exact collector tray design. Asking price $24.99."
    },
    {
      position: 3,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray",
      link: "https://market-two.example/item/riverton-1999-champions-tray?tracking=duplicate",
      snippet: "Duplicate observation of the exact active listing at $24.99."
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
  if (schemaName === "visual_subject_recognition") {
    return collectible ? collectibleVisualRecognition : retailRecoveryFixture.visualRecognition;
  }
  if (schemaName === "item_identity") {
    return collectible ? collectibleIdentity : retailRecoveryFixture.identity;
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

function directPageResult(url, evidenceMode) {
  if (evidenceMode !== "collectible") {
    return retailRecoveryFixture.directPageResult;
  }
  return {
    finalUrl: url,
    statusCode: 200,
    elapsedMs: 2,
    html: "<html><body><h1>Riverton Falcons 1999 Champions RefreshCo collector tray</h1><p>Coach Rivera exact design.</p><p>Price unavailable.</p></body></html>",
    sourceEvidenceText: "Riverton Falcons 1999 Champions RefreshCo collector tray Coach Rivera exact design Price unavailable"
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
            ? retailRecoveryFixture.recoveryProviderResponse
            : retailRecoveryFixture.preliminaryProviderResponse,
        statusCode: 200,
        elapsedMs: 2
      };
    },
    requestBoundedRetailProductPage: async (url) => {
      directPageRequests.push(url);
      return directPageResult(url, evidenceMode);
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
