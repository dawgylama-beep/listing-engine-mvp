import assert from "node:assert/strict";
import test from "node:test";
import { createGenerateListingHandler } from "../api/generate-listing.js";
import { validateFinalEvidenceResult } from "../lib/evidence/index.js";
import { retailRecoveryFixture } from "./fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

await import("../public/customer-evidence.js");

const { buildCustomerEvidenceViewModel } = globalThis.KatherinesEyeCustomerEvidence;
const removedEvidenceFields = [
  "bestCompatiblePriceFound",
  "otherCompatiblePricesFound",
  "bestCurrentRetailAlternative",
  "otherCurrentRetailPrices"
];

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

function clientVisibleShape(value) {
  if (Array.isArray(value)) {
    return value.map(clientVisibleShape).filter((item) => item !== null && item !== "");
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, clientVisibleShape(item)])
        .filter(([, item]) => item !== null && item !== "")
    );
  }
  return value;
}

function finalModelResponse(schemaName) {
  if (schemaName === "visual_subject_recognition") return retailRecoveryFixture.visualRecognition;
  if (schemaName === "item_identity") return retailRecoveryFixture.identity;
  if (schemaName === "consumer_purchase_decision") return retailRecoveryFixture.finalReport;
  if (schemaName === "market_value_report") {
    return {
      ...retailRecoveryFixture.finalReport,
      estimatedMarketValue: "$8.00 - $10.00",
      suggestedListingPrice: "$10.00",
      expectedSalePrice: "$8.00 - $10.00",
      minimumAcceptablePrice: "$7.00",
      recommendedSellingPlatform: "Local marketplace",
      expectedSellingTime: "Unknown",
      platformSpecificSellingGuidance: "Use canonical evidence."
    };
  }
  if (schemaName === "marketplace_listing") {
    return {
      optimizedListingTitle: "Cedarline Privacy Mailers 48 Count",
      title: "Cedarline Privacy Mailers 48 Count",
      listingDescription: "Cedarline privacy mailers shown in the submitted photos.",
      description: "Cedarline privacy mailers shown in the submitted photos.",
      itemSpecifics: { Brand: "Cedarline", Quantity: "48 count" },
      itemDetails: { Brand: "Cedarline", Quantity: "48 count" },
      conditionNotes: "Condition shown in submitted photos.",
      recommendedListingPrice: "$10.00",
      pricingConfidence: "Model value must be replaced by canonical evidence."
    };
  }
  throw new Error(`Unexpected deterministic schema: ${schemaName}`);
}

const cases = [
  {
    name: "Buy for Myself",
    reportType: "marketValue",
    purchaseIntent: "personal_use",
    expectedPurpose: "personal",
    envelope: "valuation"
  },
  {
    name: "Buy to Resell",
    reportType: "marketValue",
    purchaseIntent: "resale",
    expectedPurpose: "resale",
    envelope: "valuation"
  },
  {
    name: "Value Something I Own",
    reportType: "marketValue",
    purchaseIntent: "owner_value",
    expectedPurpose: "owner_value",
    envelope: "valuation"
  },
  {
    name: "Sell Something I Own",
    reportType: "listing",
    purchaseIntent: "seller_listing",
    expectedPurpose: "seller_listing",
    envelope: "listing"
  }
];

for (const scenario of cases) {
  test(`real handler preserves canonical customer evidence for ${scenario.name}`, async () => {
    const finalEvidenceResults = [];
    const handler = createGenerateListingHandler({
      getOpenAIApiKey: () => "deterministic-openai-placeholder",
      getOpenAIModel: () => "deterministic-test-model",
      getSerperApiKey: () => "deterministic-serper-placeholder",
      createAnalysisId: () => `analysis-${scenario.expectedPurpose}`,
      requestOpenAIJson: async ({ payload }) => ({
        json: finalModelResponse(payload?.text?.format?.name),
        data: { output: [] }
      }),
      requestSerperSearch: async ({ queryRecord }) => ({
        json: queryRecord?.retailStage === "stage_7_limited_result_recovery"
          ? retailRecoveryFixture.recoveryProviderResponse
          : retailRecoveryFixture.preliminaryProviderResponse,
        statusCode: 200,
        elapsedMs: 1
      }),
      requestBoundedRetailProductPage: async () => retailRecoveryFixture.directPageResult,
      onFinalEvidenceResult: (result) => finalEvidenceResults.push(result)
    });
    const intake = {
      ...retailRecoveryFixture.buyerIntake,
      purchase_intent: scenario.purchaseIntent,
      buyer_intent: scenario.purchaseIntent,
      ...(scenario.expectedPurpose === "owner_value"
        ? { asking_price: "", observed_price: "" }
        : {})
    };
    const req = {
      method: "POST",
      body: {
        reportType: scenario.reportType,
        platform: scenario.reportType === "listing" ? "Local marketplace" : "",
        notes: "Security envelopes, strip and seal, 48 count.",
        photos: [{
          name: "sanitized-retail-package.png",
          dataUrl: "data:image/png;base64,iVBORw0KGgo="
        }],
        ...(scenario.reportType === "listing"
          ? { sellerIntake: intake }
          : { buyerIntake: intake })
      }
    };
    const res = createResponseCapture();
    const networkGuard = installHardNetworkDenial();
    try {
      await handler(req, res);
    } finally {
      networkGuard.restore();
    }

    assert.equal(networkGuard.attempts.length, 0);
    assert.equal(res.statusCode, 200);
    assert.equal(finalEvidenceResults.length, 1);
    const finalEvidenceResult = finalEvidenceResults[0];
    validateFinalEvidenceResult(finalEvidenceResult);
    assert.equal(finalEvidenceResult.decisionResult.purpose, scenario.expectedPurpose);

    const report = res.payload[scenario.envelope];
    const viewModel = buildCustomerEvidenceViewModel(
      report.customerEvidence,
      report.customerEvidenceSummary
    );
    assert.equal(viewModel.status, "ready");
    assert.deepEqual(
      viewModel.cards.map((card) => card.evidenceId),
      finalEvidenceResult.views.displayedIds
    );
    assert.deepEqual(report.pricesFound, report.customerEvidence);
    removedEvidenceFields.forEach((field) => assert.equal(Object.hasOwn(report, field), false));
    assert.deepEqual(
      viewModel.cards.map((card) => card.sourceLabel),
      report.customerEvidence.map((record) => record.sourceLabel)
    );
    assert.deepEqual(
      viewModel.cards.map((card) => card.canonicalPriceType),
      report.customerEvidence.map((record) => record.canonicalPriceType)
    );
    assert.deepEqual(
      viewModel.cards.map((card) => card.canonicalMatchLabel),
      report.customerEvidence.map((record) => record.canonicalMatchLabel)
    );
    assert.deepEqual(
      report.searchDiagnostics.canonicalCustomerEvidenceIds,
      finalEvidenceResult.views.displayedIds
    );
    assert.equal(
      report.searchDiagnostics.canonicalCustomerEvidenceCount,
      report.customerEvidence.length
    );
    assert.deepEqual(report.decisionResult, clientVisibleShape(finalEvidenceResult.decisionResult));
    assert.deepEqual(report.buyerOfferResult, clientVisibleShape(finalEvidenceResult.buyerOfferResult));

    if (scenario.expectedPurpose === "resale") {
      assert.equal(report.suggestedListingPrice, "$10.00");
      assert.equal(report.expectedSalePrice, "$8.00 - $10.00");
      assert.equal(report.minimumAcceptablePrice, "$7.00");
      assert.equal(report.recommendedSellingPlatform, "Local marketplace");
      assert.equal(report.platformSpecificSellingGuidance, "Use canonical evidence.");
    }
    if (scenario.expectedPurpose === "seller_listing") {
      assert.equal(report.optimizedListingTitle, "Cedarline Privacy Mailers 48 Count");
      assert.equal(report.title, "Cedarline Privacy Mailers 48 Count");
      assert.equal(report.listingDescription, "Cedarline privacy mailers shown in the submitted photos.");
      assert(report.itemSpecifics.some((item) => item === "Recognized brand: Cedarline"));
      assert.equal(finalEvidenceResult.buyerOfferResult.status, "not_applicable");
    }
  });
}
