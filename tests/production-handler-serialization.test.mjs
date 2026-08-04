import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  createGenerateListingHandler
} from "../api/generate-listing.js";
import { validateFinalEvidenceResult } from "../lib/evidence/index.js";
import { retailRecoveryFixture } from "./fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

await import("../public/customer-evidence.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { buildCustomerEvidenceViewModel } = globalThis.KatherinesEyeCustomerEvidence;

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

function responseForSchema(schemaName) {
  if (schemaName === "item_identity") {
    return {
      ...retailRecoveryFixture.identity,
      visualRecognition: retailRecoveryFixture.visualRecognition
    };
  }
  if (schemaName === "consumer_purchase_decision") {
    return retailRecoveryFixture.finalReport;
  }
  throw new Error(`Unexpected deterministic OpenAI schema request: ${schemaName}`);
}

function modelInputContribution(payload) {
  const images = [];
  const inputText = [];
  for (const message of payload.input || []) {
    for (const content of message.content || []) {
      if (content.type === "input_image") images.push(content);
      if (content.type === "input_text") inputText.push(String(content.text || ""));
    }
  }
  const redacted = structuredClone(payload);
  for (const message of redacted.input || []) {
    for (const content of message.content || []) {
      if (content.type === "input_image") content.image_url = "[bounded image input]";
    }
  }
  const imageDataCharacters = images.reduce((total, image) => total + String(image.image_url || "").length, 0);
  const decodedImageBytes = images.reduce((total, image) => (
    total + Buffer.from(String(image.image_url || "").split(",", 2)[1] || "", "base64").byteLength
  ), 0);
  const ordinaryPayloadCharacters = JSON.stringify(redacted).length;
  const maxOutputTokens = Number(payload.max_output_tokens) || 0;
  return {
    images,
    inputText,
    decodedImageBytes,
    imageDataCharacters,
    ordinaryPayloadCharacters,
    maxOutputTokens,
    estimatedTokens: Math.ceil(ordinaryPayloadCharacters / 4)
      + (images.length * 2500)
      + maxOutputTokens
  };
}

function collectSerializedEvidenceIds(report = {}) {
  const ids = [];
  const add = (record) => {
    if (record && typeof record === "object" && record.evidenceId) ids.push(record.evidenceId);
  };
  for (const field of [
    "pricesFound",
    "strongComparables",
    "partialComparables",
    "itemIdentificationEvidence",
    "referenceResults"
  ]) {
    for (const record of Array.isArray(report[field]) ? report[field] : []) add(record);
  }
  return ids;
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

test("real production handler serializes canonical evidence IDs through deterministic adapters", async () => {
  const trace = {
    openAISchemas: [],
    openAIPayloads: [],
    modelRequestBudgets: [],
    serperStages: [],
    directPageRequests: [],
    finalEvidenceResults: []
  };
  let clock = Date.parse(retailRecoveryFixture.fixedNow);
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-test-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => retailRecoveryFixture.analysisId,
    nowMilliseconds: () => {
      clock += 5;
      return clock;
    },
    nowIso: () => new Date(clock).toISOString(),
    onModelRequestBudget: (observation) => {
      trace.modelRequestBudgets.push(observation);
    },
    requestOpenAIJson: async ({ payload }) => {
      assert.equal(payload.model, "deterministic-test-model");
      const schemaName = payload?.text?.format?.name;
      trace.openAISchemas.push(schemaName);
      trace.openAIPayloads.push(payload);
      return { json: responseForSchema(schemaName), data: { output: [] } };
    },
    requestSerperSearch: async ({ queryRecord }) => {
      const stage = queryRecord?.retailStage || queryRecord?.searchPass || "unknown";
      trace.serperStages.push(stage);
      return {
        json: stage === "stage_7_limited_result_recovery"
          ? retailRecoveryFixture.recoveryProviderResponse
          : retailRecoveryFixture.preliminaryProviderResponse,
        statusCode: 200,
        elapsedMs: 4
      };
    },
    requestBoundedRetailProductPage: async (url) => {
      trace.directPageRequests.push(url);
      return retailRecoveryFixture.directPageResult;
    },
    onFinalEvidenceResult: (result) => {
      trace.finalEvidenceResults.push(result);
    }
  });
  const req = {
    method: "POST",
    body: {
      reportType: "marketValue",
      platform: "",
      notes: "041226087161",
      photos: [{
        name: "ordinary-upc-product.jpg",
        dataUrl: `data:image/jpeg;base64,${Buffer.alloc(220000, 0x5a).toString("base64")}`
      }],
      buyerIntake: retailRecoveryFixture.buyerIntake
    }
  };
  const res = createResponseCapture();
  const networkGuard = installHardNetworkDenial();
  try {
    await handler(req, res);
  } finally {
    networkGuard.restore();
  }

  assert.equal(networkGuard.attempts.length, 0, "all expected external calls must be satisfied by injected adapters");
  assert.equal(res.statusCode, 200);
  assert(res.payload?.valuation, "real handler must serialize the valuation response envelope");
  assert.equal(res.payload.valuation.analysisId, retailRecoveryFixture.analysisId);
  assert.deepEqual(trace.openAISchemas, [
    "item_identity",
    "consumer_purchase_decision"
  ]);
  const contributions = trace.openAIPayloads.map(modelInputContribution);
  assert.deepEqual(
    trace.modelRequestBudgets.map((item) => item.purpose),
    trace.openAISchemas
  );
  assert(trace.modelRequestBudgets.every((item) => item.guardThreshold === 360000 && item.guardResult === "pass"));
  assert.deepEqual(
    trace.modelRequestBudgets.map((item) => item.estimatedTokens),
    contributions.map((item) => item.estimatedTokens)
  );
  assert.equal(contributions.reduce((total, item) => total + item.images.length, 0), 1);
  assert.equal(contributions[0].images.length, 1);
  assert.equal(contributions[0].images[0].detail, "high");
  assert.equal(contributions[0].decodedImageBytes, 220000);
  assert.equal(trace.modelRequestBudgets[0].decodedImageBytes, 220000);
  assert.equal(trace.modelRequestBudgets[0].imageDataCharacters, req.body.photos[0].dataUrl.length);
  assert.equal(contributions[1].images.length, 0);
  assert(contributions.every((item) => item.inputText.every((text) => !text.includes("data:image/"))));
  assert(contributions.every((item) => item.maxOutputTokens > 0 && item.maxOutputTokens <= 6000));
  assert(
    contributions.every((item) => item.ordinaryPayloadCharacters < 1200000),
    "ordinary prompt, schema, tool, and context text must remain below 300,000 estimated tokens"
  );
  assert(
    Math.max(...contributions.map((item) => item.estimatedTokens)) <= 360000,
    "ordinary one-photo UPC request must stay under the deterministic pre-provider budget"
  );
  assert(
    400000 - Math.max(...contributions.map((item) => item.estimatedTokens)) >= 40000,
    "ordinary one-photo UPC request must retain at least a 40,000-token margin below the observed ceiling"
  );
  const ordinaryPhotoDataUrl = req.body.photos[0].dataUrl;
  assert.equal(
    trace.openAIPayloads.reduce(
      (total, payload) => total + (JSON.stringify(payload).split(ordinaryPhotoDataUrl).length - 1),
      0
    ),
    1,
    "one browser photo must occur in exactly one model request block"
  );
  assert.equal(
    res.payload.valuation.searchDiagnostics.physicalProviderAttemptCount,
    trace.serperStages.length,
    "Non-search OpenAI orchestration calls must not consume the comparable-search provider budget."
  );
  assert(trace.serperStages.some((stage) => stage !== "stage_7_limited_result_recovery"), "preliminary acquisition must execute");
  assert(trace.serperStages.includes("stage_7_limited_result_recovery"), "bounded recovery must execute");
  assert(trace.directPageRequests.length >= 1, "direct-page enrichment must execute");
  assert.equal(trace.finalEvidenceResults.length, 1, "authoritative finalizer observer must run exactly once");

  const finalEvidenceResult = trace.finalEvidenceResults[0];
  validateFinalEvidenceResult(finalEvidenceResult);
  assert.equal(finalEvidenceResult.analysisId, retailRecoveryFixture.analysisId);
  assert(finalEvidenceResult.records.every((record) => record.evidenceId));
  assert(finalEvidenceResult.records.every((record) => record.underlyingOfferId));
  assert.equal(
    new Set(finalEvidenceResult.acceptedRecords.map((record) => record.underlyingOfferId)).size,
    finalEvidenceResult.acceptedRecords.length,
    "one underlying offer must finalize once"
  );
  assert(finalEvidenceResult.acceptedRecords.some((record) => record.displayedPrice === "Price unavailable"));

  const report = res.payload.valuation;
  const customerEvidenceViewModel = buildCustomerEvidenceViewModel(
    report.customerEvidence,
    report.customerEvidenceSummary
  );
  assert.equal(customerEvidenceViewModel.status, "ready");
  assert.deepEqual(
    customerEvidenceViewModel.cards.map((card) => card.evidenceId),
    finalEvidenceResult.views.displayedIds
  );
  assert.deepEqual(
    report.customerEvidence.map((record) => record.evidenceId),
    finalEvidenceResult.views.displayedIds
  );
  assert.deepEqual(report.pricesFound, report.customerEvidence);
  for (const field of [
    "bestCompatiblePriceFound",
    "otherCompatiblePricesFound",
    "bestCurrentRetailAlternative",
    "otherCurrentRetailPrices"
  ]) {
    assert.equal(Object.hasOwn(report, field), false, `${field} must not be serialized`);
  }
  assert.equal(report.customerEvidenceSummary.counts.displayed, customerEvidenceViewModel.cards.length);
  assert.deepEqual(
    report.searchDiagnostics.canonicalCustomerEvidenceIds,
    customerEvidenceViewModel.cards.map((card) => card.evidenceId)
  );
  assert.deepEqual(
    report.searchDiagnostics.canonicalDisplayedCountByRetailer,
    report.customerEvidenceSummary.displayedCountByRetailer
  );
  for (const [index, card] of customerEvidenceViewModel.cards.entries()) {
    const canonical = report.customerEvidence[index];
    assert.equal(card.title, canonical.title);
    assert.equal(card.sourceLabel, canonical.sourceLabel);
    assert.equal(card.destinationUrl, canonical.destinationUrl);
    assert.equal(card.canonicalPrice, canonical.canonicalPrice ?? null);
    assert.equal(card.canonicalPriceType, canonical.canonicalPriceType);
    assert.equal(card.quantity, canonical.quantity ?? null);
    assert.equal(card.canonicalMatchLabel, canonical.canonicalMatchLabel);
  }
  assert(
    Number(report.searchDiagnostics?.normalizedCandidateCount || 0) > 0,
    "production provider normalization must produce at least one candidate"
  );
  const rejectedDiagnosticText = JSON.stringify([
    report.searchDiagnostics?.currentRetailCandidatesRejected,
    report.rejectedMatches
  ]);
  assert(/category|search/i.test(rejectedDiagnosticText), "generic category record must remain in rejection diagnostics");
  const canonicalIds = new Set(finalEvidenceResult.records.map((record) => record.evidenceId));
  const serializedEvidenceIds = collectSerializedEvidenceIds(report);
  serializedEvidenceIds.forEach((id) => assert(canonicalIds.has(id), `serialized evidence contains unknown evidence ID ${id}`));
  assert.deepEqual(
    [...report.searchDiagnostics.finalizedCustomerRecordIds].sort(),
    [...finalEvidenceResult.views.customerEligibleIds].sort()
  );
  assert.deepEqual(
    [...report.searchDiagnostics.displayedCustomerRecordIds].sort(),
    [...finalEvidenceResult.views.displayedIds].sort()
  );
  assert.equal(
    report.searchDiagnostics.finalCustomerEvidenceCount,
    finalEvidenceResult.views.customerEligibleIds.length
  );
  assert.equal(
    new Set(finalEvidenceResult.views.displayedIds).size,
    finalEvidenceResult.views.displayedIds.length
  );
  assert.equal(report.rangeResult.status, finalEvidenceResult.rangeResult.status);
  assert.equal(report.rangeResult.priceType, finalEvidenceResult.rangeResult.priceType);
  assert.equal(report.rangeResult.low ?? null, finalEvidenceResult.rangeResult.low);
  assert.equal(report.rangeResult.high ?? null, finalEvidenceResult.rangeResult.high);
  assert.equal(report.rangeResult.observedPrice ?? null, finalEvidenceResult.rangeResult.observedPrice);
  assert.deepEqual(report.rangeResult.evidenceIds, finalEvidenceResult.rangeResult.evidenceIds);
  assert.deepEqual(report.rangeResult.underlyingOfferIds, finalEvidenceResult.rangeResult.underlyingOfferIds);
  assert.deepEqual(report.rangeResult.priceTypeComposition, finalEvidenceResult.rangeResult.priceTypeComposition);
  for (const groupName of ["currentRetail", "activeAsking", "verifiedSold"]) {
    assert.equal(report.rangeResults[groupName].status, finalEvidenceResult.rangeResults[groupName].status);
    assert.equal(report.rangeResults[groupName].low ?? null, finalEvidenceResult.rangeResults[groupName].low);
    assert.equal(report.rangeResults[groupName].high ?? null, finalEvidenceResult.rangeResults[groupName].high);
    assert.equal(report.rangeResults[groupName].observedPrice ?? null, finalEvidenceResult.rangeResults[groupName].observedPrice);
    assert.deepEqual(report.rangeResults[groupName].evidenceIds, finalEvidenceResult.rangeResults[groupName].evidenceIds);
    assert.deepEqual(report.rangeResults[groupName].underlyingOfferIds, finalEvidenceResult.rangeResults[groupName].underlyingOfferIds);
  }
  assert.equal(report.retailLimitResult.status, finalEvidenceResult.retailLimitResult.status);
  assert.equal(report.retailLimitResult.amount ?? null, finalEvidenceResult.retailLimitResult.amount);
  assert.deepEqual(report.retailLimitResult.evidenceIds, finalEvidenceResult.retailLimitResult.evidenceIds);
  assert.deepEqual(report.retailLimitResult.underlyingOfferIds, finalEvidenceResult.retailLimitResult.underlyingOfferIds);
  assert.equal(report.retailLimitResult.comparisonBasis, finalEvidenceResult.retailLimitResult.comparisonBasis);
  assert.deepEqual(report.rangeSupportEvidenceIds, finalEvidenceResult.rangeResult.evidenceIds);
  assert.deepEqual(report.rangeSupportUnderlyingOfferIds, finalEvidenceResult.rangeResult.underlyingOfferIds);
  assert.deepEqual(report.rangeSupportingEvidenceIds, finalEvidenceResult.rangeResult.evidenceIds);
  assert.deepEqual(report.rangeSupportingUnderlyingOfferIds, finalEvidenceResult.rangeResult.underlyingOfferIds);
  assert.deepEqual(report.retailLimitSupportEvidenceIds, finalEvidenceResult.retailLimitResult.evidenceIds);
  assert.deepEqual(report.retailLimitSupportUnderlyingOfferIds, finalEvidenceResult.retailLimitResult.underlyingOfferIds);
  assert.deepEqual(report.retailPriceLimitSupportingEvidenceIds, finalEvidenceResult.retailLimitResult.evidenceIds);
  assert.deepEqual(report.retailPriceLimitSupportingUnderlyingOfferIds, finalEvidenceResult.retailLimitResult.underlyingOfferIds);
  assert.deepEqual(
    report.searchDiagnostics.canonicalRangeSupportEvidenceIds,
    finalEvidenceResult.rangeResult.evidenceIds
  );
  assert.deepEqual(
    report.searchDiagnostics.canonicalRetailLimitSupportEvidenceIds,
    finalEvidenceResult.retailLimitResult.evidenceIds
  );
  assert.equal(
    report.searchDiagnostics.canonicalRangeStatus,
    finalEvidenceResult.rangeResult.status
  );
  assert.equal(
    report.searchDiagnostics.canonicalRetailLimitStatus,
    finalEvidenceResult.retailLimitResult.status
  );
  if (finalEvidenceResult.rangeResult.status === "established") {
    assert.match(report.priceSpectrumSummary, new RegExp(`\\$${finalEvidenceResult.rangeResult.low.toFixed(2)}`));
    assert.match(report.priceSpectrumSummary, new RegExp(`\\$${finalEvidenceResult.rangeResult.high.toFixed(2)}`));
  } else {
    assert.equal(finalEvidenceResult.rangeResult.low, null);
    assert.equal(finalEvidenceResult.rangeResult.high, null);
  }
  if (finalEvidenceResult.retailLimitResult.status === "established") {
    assert.match(report.retailPriceLimit, new RegExp(`\\$${finalEvidenceResult.retailLimitResult.amount.toFixed(2)}`));
    assert.equal(report.maximumRecommendedPrice ?? "", "");
  }
  assert.equal(report.verifiedMarketRange ?? "", "");
  assert.equal(report.currentAskingPriceRange ?? "", "");
  assert.equal(report.preliminaryReferenceRange ?? "", "");
  assert.deepEqual(report.decisionResult, clientVisibleShape(finalEvidenceResult.decisionResult));
  assert.deepEqual(report.confidenceResult, clientVisibleShape(finalEvidenceResult.confidenceResult));
  assert.deepEqual(report.badgeResult, clientVisibleShape(finalEvidenceResult.badgeResult));
  assert.deepEqual(report.buyerOfferResult, clientVisibleShape(finalEvidenceResult.buyerOfferResult));
  assert.equal(finalEvidenceResult.buyerOfferResult.status, "retail_comparison_only");
  assert.equal(report.openingOffer ?? "", "");
  assert.equal(report.targetPurchasePrice ?? "", "");
  assert.equal(report.maximumRecommendedPrice ?? "", "");
  assert.equal(report.maximumRecommendedBuyPrice ?? "", "");
  assert.deepEqual(report.recommendedOffer ?? [], []);
  assert.equal(report.negotiationGuidance, finalEvidenceResult.buyerOfferResult.guidanceSummary);
  assert.deepEqual(report.buyerOfferSupportEvidenceIds, finalEvidenceResult.buyerOfferResult.supportingEvidenceIds);
  assert.deepEqual(report.buyerOfferSupportUnderlyingOfferIds, finalEvidenceResult.buyerOfferResult.supportingUnderlyingOfferIds);
  assert.equal(report.buyerOfferSupportCount, finalEvidenceResult.buyerOfferResult.supportingEvidenceIds.length);
  assert.deepEqual(
    report.buyerOfferSupportRecords.map((record) => record.evidenceId),
    finalEvidenceResult.buyerOfferResult.supportingEvidenceIds
  );
  assert.equal(report.recommendationCode, finalEvidenceResult.decisionResult.recommendationCode);
  assert.equal(report.recommendationStatus, finalEvidenceResult.decisionResult.status);
  assert.equal(report.recommendation, finalEvidenceResult.decisionResult.recommendationLabel);
  assert.equal(report.retailPurchaseDecision, finalEvidenceResult.decisionResult.recommendationLabel);
  assert.equal(report.purchaserDecision, finalEvidenceResult.decisionResult.summary);
  assert.equal(report.recommendationRationale, finalEvidenceResult.decisionResult.summary);
  assert.equal(report.valueRating, finalEvidenceResult.badgeResult.label);
  assert.equal(report.badge, finalEvidenceResult.badgeResult.label);
  assert.equal(report.customerBadge, finalEvidenceResult.badgeResult.label);
  assert.equal(report.identificationConfidence, report.itemIdentificationConfidence);
  assert.equal(report.pricingConfidence, report.priceConfidence);
  assert.equal(report.pricingConfidence, report.liveCompConfidence);
  assert.equal(report.pricingConfidence, report.valuationConfidence);
  assert.equal(report.pricingConfidence, report.buyerDecisionConfidence);
  assert.deepEqual(report.decisionSupportEvidenceIds, finalEvidenceResult.decisionResult.supportingEvidenceIds);
  assert.deepEqual(report.decisionSupportUnderlyingOfferIds, finalEvidenceResult.decisionResult.supportingUnderlyingOfferIds);
  assert.equal(report.decisionSupportCount, finalEvidenceResult.decisionResult.supportingEvidenceIds.length);
  assert.deepEqual(report.pricingConfidenceSupportEvidenceIds, finalEvidenceResult.confidenceResult.pricing.supportingEvidenceIds);
  assert.deepEqual(report.pricingConfidenceSupportUnderlyingOfferIds, finalEvidenceResult.confidenceResult.pricing.supportingUnderlyingOfferIds);
  assert.deepEqual(report.identityConfidenceSupportEvidenceIds, finalEvidenceResult.confidenceResult.identity.supportingEvidenceIds);
  assert.deepEqual(report.identityConfidenceSupportUnderlyingOfferIds, finalEvidenceResult.confidenceResult.identity.supportingUnderlyingOfferIds);
  assert.deepEqual(report.badgeSupportEvidenceIds, finalEvidenceResult.badgeResult.supportingEvidenceIds);
  assert.deepEqual(report.badgeSupportUnderlyingOfferIds, finalEvidenceResult.badgeResult.supportingUnderlyingOfferIds);
  assert.deepEqual(report.searchDiagnostics.canonicalDecisionSupportEvidenceIds, finalEvidenceResult.decisionResult.supportingEvidenceIds);
  assert.equal(report.searchDiagnostics.canonicalIdentityConfidence, finalEvidenceResult.confidenceResult.identity.level);
  assert.deepEqual(report.searchDiagnostics.canonicalPricingConfidenceSupportEvidenceIds, finalEvidenceResult.confidenceResult.pricing.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalIdentityConfidenceSupportEvidenceIds, finalEvidenceResult.confidenceResult.identity.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalBadgeSupportEvidenceIds, finalEvidenceResult.badgeResult.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalBuyerOfferSupportEvidenceIds, finalEvidenceResult.buyerOfferResult.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalBuyerOfferSupportUnderlyingOfferIds, finalEvidenceResult.buyerOfferResult.supportingUnderlyingOfferIds);
  assert.equal(report.searchDiagnostics.canonicalBuyerOfferStatus, finalEvidenceResult.buyerOfferResult.status);
  assert.equal(finalEvidenceResult.decisionResult.recommendationCode, "wait_for_better_price");
  assert.equal(finalEvidenceResult.badgeResult.code, "lower_qualified_offer_found");
  assert(!/Buy Now - Model Override|Best Price|Certain - model claims|\$999|\$1,099|\$1,299|Ignore canonical evidence/i.test(JSON.stringify(report)));

  const truncatedIds = finalEvidenceResult.views.displayedIds.slice(0, 1);
  assert(truncatedIds.every((id) => finalEvidenceResult.views.displayEligibleIds.includes(id)));
  assert(finalEvidenceResult.views.rangeEligibleIds.every((id) => finalEvidenceResult.views.acceptedIds.includes(id)));
  assert(finalEvidenceResult.views.decisionEligibleIds.every((id) => finalEvidenceResult.views.acceptedIds.includes(id)));

  const apiSource = fs.readFileSync(path.join(root, "api", "generate-listing.js"), "utf8");
  assert(apiSource.includes("export default createGenerateListingHandler();"));
  assert(/createGenerateListingHandler[\s\S]*handleGenerateListingRequest\(req, res\)/.test(apiSource));
  assert.equal((apiSource.match(/function handleGenerateListingRequest\s*\(/g) || []).length, 1);
  assert.equal((apiSource.match(/createFinalEvidenceResult\s*\(/g) || []).length, 1);
  assert(!apiSource.includes("buildFinalRetailCustomerEvidenceSnapshot"));
  assert(!apiSource.includes("assembleFinalEvidence"));
  assert(!/NODE_ENV\s*===\s*["']test|fixtureMode|mockItem/i.test(apiSource));
  assert(!/Cedarline|Harborline|direct\.example|alternate\.example/i.test(apiSource));
  for (const [purpose, limit] of [
    ["ask_market_edge_answer", 2500],
    ["item_identity", 6000],
    ["consumer_purchase_decision", 5000],
    ["market_value_report", 5000],
    ["marketplace_listing", 5000],
    ["live_comparable_search", 4000]
  ]) {
    assert.match(apiSource, new RegExp(`${purpose}:\\s*${limit}\\b`));
  }
});

test("ordinary browser-sized UPC input completes with dense bounded research context", async () => {
  const budgetObservations = [];
  const modelPurposes = [];
  const finalEvidenceResults = [];
  let serperCalls = 0;
  let directPageCalls = 0;
  let clock = Date.parse(retailRecoveryFixture.fixedNow);
  const requestBody = {
    reportType: "marketValue",
    platform: "",
    notes: "041226087161",
    photos: [{
      name: "ordinary-office-works-2200.png",
      dataUrl: `data:image/jpeg;base64,${Buffer.alloc(105018, 0x5a).toString("base64")}`
    }],
    buyerIntake: {
      purchase_context: "online_retailer",
      retailer_or_marketplace_name: "Office Works",
      purchase_intent: "personal_use",
      item_condition: "new",
      item_name: "Office Works Strip and Seal Security Envelopes White 45 Count",
      known_brand: "Office Works",
      known_upc: "041226087161",
      buyer_notes: "041226087161"
    }
  };
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-test-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => "analysis-ordinary-browser-sized-upc",
    nowMilliseconds: () => {
      clock += 5;
      return clock;
    },
    nowIso: () => new Date(clock).toISOString(),
    onModelRequestBudget: (observation) => budgetObservations.push(observation),
    requestOpenAIJson: async ({ payload }) => {
      const purpose = payload?.text?.format?.name;
      const budget = budgetObservations.at(-1);
      assert.equal(budget?.purpose, purpose, "the model adapter must run only after its exact request guard");
      assert.equal(budget?.guardResult, "pass");
      modelPurposes.push(purpose);
      if (purpose === "item_identity") {
        return {
          json: {
            ...retailRecoveryFixture.identity,
            visualRecognition: retailRecoveryFixture.visualRecognition
          },
          data: { output: [] }
        };
      }
      if (purpose === "consumer_purchase_decision") {
        return { json: retailRecoveryFixture.finalReport, data: { output: [] } };
      }
      throw new Error(`Unexpected deterministic model purpose: ${purpose}`);
    },
    requestSerperSearch: async ({ queryRecord }) => {
      serperCalls += 1;
      const querySlug = Buffer.from(String(queryRecord?.query || serperCalls)).toString("hex").slice(0, 24);
      return {
        json: {
          organic: Array.from({ length: 10 }, (_, index) => ({
            position: index + 1,
            title: `Office Works Strip and Seal Security Envelopes White 45 Count UPC 041226087161 result ${index + 1}`,
            link: `https://retailer-${serperCalls}.example/product/${querySlug}-${index + 1}`,
            snippet: `Current retail product page for Office Works Strip and Seal Security Envelopes White 45 Count UPC 041226087161. Price $5.${String(index + 10).slice(-2)}. In stock online. ${"Package evidence and current retailer context. ".repeat(3)}`
          }))
        },
        statusCode: 200,
        elapsedMs: 2
      };
    },
    requestBoundedRetailProductPage: async (url) => {
      directPageCalls += 1;
      return {
        finalUrl: url,
        statusCode: 200,
        elapsedMs: 2,
        html: "<html><body>Office Works Strip and Seal Security Envelopes White 45 Count $5.49</body></html>",
        sourceEvidenceText: "Office Works Strip and Seal Security Envelopes White 45 Count UPC 041226087161 current retail price $5.49"
      };
    },
    onFinalEvidenceResult: (result) => finalEvidenceResults.push(result)
  });
  const response = createResponseCapture();
  const networkGuard = installHardNetworkDenial();
  try {
    await handler({ method: "POST", body: structuredClone(requestBody) }, response);
  } finally {
    networkGuard.restore();
  }

  assert.equal(response.statusCode, 200);
  assert(response.payload?.valuation, "ordinary one-photo Personal Buy must complete a valuation report");
  assert.match(JSON.stringify(response.payload.valuation), /041226087161/);
  assert.deepEqual(modelPurposes, ["item_identity", "consumer_purchase_decision"]);
  assert.equal(budgetObservations.length, 2);
  assert(budgetObservations.every((item) => item.guardThreshold === 360000 && item.guardResult === "pass"));
  assert(budgetObservations.every((item) => item.estimatedTokens < 360000));
  assert.equal(budgetObservations[0].imageCount, 1);
  assert.equal(budgetObservations[0].decodedImageBytes, 105018);
  assert.equal(budgetObservations[0].imageDataCharacters, requestBody.photos[0].dataUrl.length);
  assert.equal(budgetObservations[1].imageCount, 0);
  assert(budgetObservations[1].ordinaryPayloadCharacters < 120000);
  assert(serperCalls > 0 && serperCalls <= 28);
  assert(directPageCalls <= 2);
  assert.equal(finalEvidenceResults.length, 1);
  validateFinalEvidenceResult(finalEvidenceResults[0]);
  assert.deepEqual(networkGuard.attempts, []);
});

test("multimodal bounds reject excessive inputs before providers and mask provider details", async () => {
  const baseBody = {
    reportType: "marketValue",
    platform: "",
    notes: "041226087161",
    photos: [{
      name: "ordinary-upc-product.png",
      dataUrl: "data:image/png;base64,iVBORw0KGgo="
    }],
    buyerIntake: {
      purchase_intent: "personal_use",
      known_upc: "041226087161"
    }
  };

  let oversizedPhotoProviderCalls = 0;
  const oversizedPhotoHandler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    requestOpenAIJson: async () => {
      oversizedPhotoProviderCalls += 1;
      throw new Error("provider must not be invoked");
    }
  });
  const oversizedPhotoResponse = createResponseCapture();
  await oversizedPhotoHandler({
    method: "POST",
    body: {
      ...baseBody,
      photos: [{
        name: "excessive.png",
        dataUrl: `data:image/png;base64,${Buffer.alloc(240001, 0x61).toString("base64")}`
      }]
    }
  }, oversizedPhotoResponse);
  assert.equal(oversizedPhotoResponse.statusCode, 413);
  assert.equal(oversizedPhotoProviderCalls, 0);
  assert.equal(oversizedPhotoResponse.payload.code, "analysis_input_too_large");

  let earlyRejectionProviderCalls = 0;
  const earlyRejectionBudgets = [];
  const earlyRejectionHandler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    onModelRequestBudget: (observation) => earlyRejectionBudgets.push(observation),
    requestOpenAIJson: async () => {
      earlyRejectionProviderCalls += 1;
      throw new Error("provider must not be invoked");
    }
  });
  const earlyCases = [
    {
      name: "combined decoded photo bytes",
      expectedStatus: 413,
      expectedCode: "analysis_input_too_large",
      photos: [
        { name: "combined-one.png", dataUrl: `data:image/png;base64,${Buffer.alloc(120001, 0x61).toString("base64")}` },
        { name: "combined-two.png", dataUrl: `data:image/png;base64,${Buffer.alloc(120001, 0x62).toString("base64")}` }
      ]
    },
    {
      name: "seven photos",
      expectedStatus: 413,
      expectedCode: "analysis_input_too_large",
      photos: Array.from({ length: 7 }, (_, index) => ({
        name: `photo-${index + 1}.png`,
        dataUrl: "data:image/png;base64,iVBORw0KGgo="
      }))
    },
    {
      name: "invalid image type",
      expectedStatus: 400,
      expectedCode: "invalid_image_input",
      photos: [{ name: "invalid.gif", dataUrl: "data:image/gif;base64,R0lGODlhAQABAAAAACw=" }]
    }
  ];
  for (const inputCase of earlyCases) {
    const response = createResponseCapture();
    await earlyRejectionHandler({
      method: "POST",
      body: { ...baseBody, photos: inputCase.photos }
    }, response);
    assert.equal(response.statusCode, inputCase.expectedStatus, inputCase.name);
    assert.equal(response.payload.code, inputCase.expectedCode, inputCase.name);
  }
  assert.equal(earlyRejectionProviderCalls, 0);
  assert.deepEqual(earlyRejectionBudgets, []);

  let oversizedRequestProviderCalls = 0;
  const oversizedRequestBudgets = [];
  const oversizedRequestHandler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    onModelRequestBudget: (observation) => oversizedRequestBudgets.push(observation),
    requestOpenAIJson: async () => {
      oversizedRequestProviderCalls += 1;
      throw new Error("provider must not be invoked");
    }
  });
  const oversizedRequestResponse = createResponseCapture();
  await oversizedRequestHandler({
    method: "POST",
    body: {
      ...baseBody,
      notes: "A".repeat(1500000)
    }
  }, oversizedRequestResponse);
  assert.equal(oversizedRequestResponse.statusCode, 413);
  assert.equal(oversizedRequestProviderCalls, 0);
  assert.equal(oversizedRequestResponse.payload.code, "analysis_input_too_large");
  assert.equal(oversizedRequestBudgets.length, 1);
  assert.equal(oversizedRequestBudgets[0].purpose, "item_identity");
  assert.equal(oversizedRequestBudgets[0].guardThreshold, 360000);
  assert.equal(oversizedRequestBudgets[0].guardResult, "reject");
  assert(oversizedRequestBudgets[0].estimatedTokens > 360000);

  const providerDetail = "Request too large for gpt-4.1-mini-long-context INTERNAL_ORGANIZATION_MARKER Limit 400000 stack fixture-secret";
  let failingProviderCalls = 0;
  const failingProviderBudgets = [];
  const providerFailureHandler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    onModelRequestBudget: (observation) => failingProviderBudgets.push(observation),
    requestOpenAIJson: async () => {
      failingProviderCalls += 1;
      throw new Error(providerDetail);
    }
  });
  const providerFailureResponse = createResponseCapture();
  await providerFailureHandler({ method: "POST", body: baseBody }, providerFailureResponse);
  assert.equal(providerFailureResponse.statusCode, 502);
  assert.equal(failingProviderCalls, 1);
  assert.equal(failingProviderBudgets.length, 1);
  assert.equal(failingProviderBudgets[0].guardResult, "pass");
  const customerError = JSON.stringify(providerFailureResponse.payload);
  assert.match(customerError, /Katherine/);
  for (const forbidden of [
    "INTERNAL_ORGANIZATION_MARKER",
    "gpt-4.1-mini-long-context",
    "400000",
    "stack",
    "fixture-secret",
    "Request too large"
  ]) {
    assert.equal(customerError.includes(forbidden), false, `${forbidden} must not reach the customer`);
  }
});

test("real production handler serializes one active asking offer as one observation, not a range", async () => {
  const finalEvidenceResults = [];
  const visualRecognition = {
    visualSubject: "Commemorative metal advertising sign",
    visualSubjectCategory: "sports advertising collectible",
    visualSubjectConfidence: "High",
    recognizedBrand: "Refreshment Brand",
    visibleWords: ["Falcons", "1999 Champions", "Coach Rivera"],
    visualEvidence: ["Team design", "championship wording", "coach portrait"],
    unresolvedVisualQuestions: []
  };
  const identity = {
    brand: "Refreshment Brand",
    model: "RB-F99-CR",
    productNameOrBoxTitle: "Falcons 1999 Champions Coach Rivera metal advertising sign",
    subjectIdentity: "Commemorative metal advertising sign",
    exactProductIdentity: "Falcons 1999 Champions Coach Rivera metal advertising sign",
    likelyItemDescription: "Sports advertising metal sign",
    visibleText: ["Falcons", "1999 Champions", "Coach Rivera"],
    designAttributes: ["Falcons", "1999 Champions", "Coach Rivera"],
    strongestSearchableIdentifiers: ["Falcons 1999 Champions Coach Rivera metal advertising sign"],
    identityConflictNotes: []
  };
  const providerResponse = {
    organic: [
      {
        position: 1,
        title: "Refreshment Brand RB-F99-CR Falcons 1999 Champions Coach Rivera metal advertising sign",
        link: "https://www.ebay.com/itm/123456789013",
        snippet: "Exact design reference page. Price unavailable."
      },
      {
        position: 2,
        title: "Refreshment Brand RB-F99-CR Falcons 1999 Champions Coach Rivera metal advertising sign",
        link: "https://www.ebay.com/itm/123456789012",
        snippet: "Buy It Now $24.99. Exact design currently listed for sale."
      }
    ]
  };
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-test-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => "analysis-handler-one-asking",
    requestOpenAIJson: async ({ payload }) => {
      const schemaName = payload?.text?.format?.name;
      if (schemaName === "item_identity") return { json: { ...identity, visualRecognition }, data: { output: [] } };
      if (schemaName === "consumer_purchase_decision") {
        return {
          json: {
            identifiedItem: identity.exactProductIdentity,
            identificationConfidence: "Certain - model claims exact design.",
            itemIdentificationConfidence: "Certain - model claims exact design.",
            pricingConfidence: "Certain - model claims complete market support.",
            buyerDecisionConfidence: "Certain - model claims complete market support.",
            recommendation: "Buy Now - Model Override",
            retailPurchaseDecision: "Buy Now - Model Override",
            purchaserDecision: "Buy Now - Model Override",
            valueRating: "Best Price",
            badge: "Best Price",
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
          },
          data: { output: [] }
        };
      }
      throw new Error(`Unexpected deterministic schema request: ${schemaName}`);
    },
    requestSerperSearch: async () => ({
      json: providerResponse,
      statusCode: 200,
      elapsedMs: 2
    }),
    requestBoundedRetailProductPage: async (url) => ({
      finalUrl: url,
      statusCode: 200,
      elapsedMs: 2,
      html: "<html><body>Refreshment Brand RB-F99-CR Falcons 1999 Champions Coach Rivera metal advertising sign. Price unavailable.</body></html>",
      sourceEvidenceText: "Refreshment Brand RB-F99-CR Falcons 1999 Champions Coach Rivera metal advertising sign. Price unavailable."
    }),
    onFinalEvidenceResult: (result) => finalEvidenceResults.push(result)
  });
  const req = {
    method: "POST",
    body: {
      reportType: "marketValue",
      platform: "",
      notes: "Falcons 1999 Champions Coach Rivera metal advertising sign.",
      photos: [{
        name: "sanitized-collector-plaque.png",
        dataUrl: "data:image/png;base64,iVBORw0KGgo="
      }],
      buyerIntake: {
        purchase_intent: "personal_use",
        buyer_intent: "personal_use",
        purchase_context: "private_seller",
        item_name: "Falcons 1999 Champions Coach Rivera metal advertising sign",
        asking_price: "$10.00",
        observed_price: "$10.00",
        buyer_notes: "Exact commemorative design shown in the submitted photo."
      }
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
  assert.equal(
    finalEvidenceResult.rangeResult.status,
    "single_observation",
    JSON.stringify(finalEvidenceResult.records.map((record) => ({
      title: record.title,
      price: record.price,
      priceType: record.priceType,
      rangeEligible: record.rangeEligible,
      exclusionReason: record.exclusionReason
    })))
  );
  assert.equal(finalEvidenceResult.rangeResult.priceType, "active_asking");
  assert.equal(finalEvidenceResult.rangeResult.observedPrice, 24.99);
  assert.equal(finalEvidenceResult.rangeResult.low, null);
  assert.equal(finalEvidenceResult.rangeResult.high, null);
  assert.equal(finalEvidenceResult.rangeResult.evidenceIds.length, 1);
  assert.equal(finalEvidenceResult.rangeResult.underlyingOfferIds.length, 1);

  const report = res.payload.valuation;
  assert.equal(report.rangeResult.status, "single_observation");
  assert.equal(report.rangeResult.observedPrice, 24.99);
  assert.equal(report.rangeResult.low ?? null, null);
  assert.equal(report.rangeResult.high ?? null, null);
  assert.deepEqual(report.rangeSupportEvidenceIds, finalEvidenceResult.rangeResult.evidenceIds);
  assert.deepEqual(report.rangeSupportUnderlyingOfferIds, finalEvidenceResult.rangeResult.underlyingOfferIds);
  assert.equal(report.currentAskingPriceRange ?? "", "");
  assert.equal(report.verifiedMarketRange ?? "", "");
  assert.equal(report.estimatedFairMarketValue ?? "", "");
  assert.deepEqual(report.fairPriceRange ?? [], []);
  assert.match(report.priceSpectrumSummary, /one (?:active asking price|buy it now) observed/i);
  assert.match(report.priceSpectrumSummary, /no numerical market range was established/i);
  assert.deepEqual(report.decisionResult, clientVisibleShape(finalEvidenceResult.decisionResult));
  assert.deepEqual(report.confidenceResult, clientVisibleShape(finalEvidenceResult.confidenceResult));
  assert.deepEqual(report.badgeResult, clientVisibleShape(finalEvidenceResult.badgeResult));
  assert.deepEqual(report.buyerOfferResult, clientVisibleShape(finalEvidenceResult.buyerOfferResult));
  assert.equal(finalEvidenceResult.buyerOfferResult.status, "asking_price_context_only");
  assert.equal(finalEvidenceResult.buyerOfferResult.isMarketSupported, false);
  assert.equal(report.openingOffer ?? "", "");
  assert.equal(report.targetPurchasePrice ?? "", "");
  assert.equal(report.maximumRecommendedPrice ?? "", "");
  assert.equal(report.maximumRecommendedBuyPrice ?? "", "");
  assert.deepEqual(report.recommendedOffer ?? [], []);
  assert.equal(report.negotiationGuidance, finalEvidenceResult.buyerOfferResult.guidanceSummary);
  assert.deepEqual(report.buyerOfferSupportEvidenceIds, finalEvidenceResult.buyerOfferResult.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalBuyerOfferSupportEvidenceIds, finalEvidenceResult.buyerOfferResult.supportingEvidenceIds);
  assert.equal(finalEvidenceResult.confidenceResult.pricing.level, "low");
  assert.notEqual(
    finalEvidenceResult.confidenceResult.identity.level,
    finalEvidenceResult.confidenceResult.pricing.level,
    JSON.stringify(finalEvidenceResult.acceptedRecords.map((record) => ({
      objectMindClassification: record.objectMindClassification,
      objectMindVerificationState: record.objectMindVerificationState,
      canonicalMatchQuality: record.canonicalMatchQuality,
      priceType: record.priceType
    })))
  );
  assert.equal(finalEvidenceResult.decisionResult.recommendationCode, "need_more_information");
  assert.equal(finalEvidenceResult.badgeResult.code, "asking_price_context_only");
  assert.equal(report.recommendation, finalEvidenceResult.decisionResult.recommendationLabel);
  assert.equal(report.purchaserDecision, finalEvidenceResult.decisionResult.summary);
  assert.equal(report.valueRating, finalEvidenceResult.badgeResult.label);
  assert.equal(report.badge, finalEvidenceResult.badgeResult.label);
  assert.deepEqual(report.searchDiagnostics.canonicalDecisionSupportEvidenceIds, finalEvidenceResult.decisionResult.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalPricingConfidenceSupportEvidenceIds, finalEvidenceResult.confidenceResult.pricing.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalBadgeSupportEvidenceIds, finalEvidenceResult.badgeResult.supportingEvidenceIds);
  assert(!/Buy Now - Model Override|Best Price|Certain - model claims|\$999|\$1,099|\$1,299|Ignore canonical evidence/i.test(JSON.stringify(report)));
});

test("real production handler preserves resale seller fields while projecting the canonical buyer offer", async () => {
  const finalEvidenceResults = [];
  const visualRecognition = {
    visualSubject: "Commemorative metal advertising sign",
    visualSubjectCategory: "sports advertising collectible",
    visualSubjectConfidence: "High",
    recognizedBrand: "Refreshment Brand",
    visibleWords: ["Falcons", "1999 Champions", "Coach Rivera"],
    visualEvidence: ["Team design", "championship wording", "coach portrait"],
    unresolvedVisualQuestions: []
  };
  const identity = {
    brand: "Refreshment Brand",
    productNameOrBoxTitle: "Falcons 1999 Champions Coach Rivera metal advertising sign",
    subjectIdentity: "Commemorative metal advertising sign",
    exactProductIdentity: "Falcons 1999 Champions Coach Rivera metal advertising sign",
    likelyItemDescription: "Sports advertising metal sign",
    visibleText: ["Falcons", "1999 Champions", "Coach Rivera"],
    designAttributes: ["Falcons", "1999 Champions", "Coach Rivera"],
    strongestSearchableIdentifiers: ["Falcons 1999 Champions Coach Rivera metal advertising sign"],
    identityConflictNotes: []
  };
  const providerResponse = {
    organic: [
      {
        position: 1,
        title: "Falcons 1999 Champions Coach Rivera metal advertising sign sold",
        link: "https://www.ebay.com/itm/223456789010",
        snippet: "Confirmed sold for $50.00. Exact design completed sale."
      },
      {
        position: 2,
        title: "Falcons 1999 Champions Coach Rivera metal advertising sign sold",
        link: "https://www.ebay.com/itm/223456789011",
        snippet: "Confirmed sold for $55.00. Exact design completed sale."
      }
    ]
  };
  const sellerFields = {
    suggestedListingPrice: "$75.00",
    expectedSalePrice: "$60.00",
    minimumAcceptablePrice: "$50.00",
    recommendedSellingPlatform: "Local Collector Marketplace",
    expectedSellingTime: "Two to four weeks",
    platformSpecificSellingGuidance: "Use clear condition photos and disclose every flaw."
  };
  const expectedSellerOutput = {
    suggestedListingPrice: "AI-only low-confidence advertised guidance - A cautious advertised range may be around $50.00-$75.00 only after verification, but it is not proof of resale value.",
    expectedSalePrice: "Resale price cannot be estimated reliably from available evidence. If a buyer exists, a conservative realized sale would need to fall below the advertised range and should be treated as highly uncertain. A cautious advertised range may be around $50.00-$75.00 only after verification, but it is not proof of resale value. The item may fail to sell.",
    minimumAcceptablePrice: "No reliable minimum acceptable resale price is supported without exact or strong similar comps; do not treat any floor as guaranteed liquidity.",
    recommendedSellingPlatform: "Local Collector Marketplace",
    expectedSellingTime: "Highly uncertain; sale may be slow, require repeated markdowns, or fail entirely until demand is verified.",
    platformSpecificSellingGuidance: "Local Collector Marketplace guidance - do not use an AI-only listing range to justify buying. Account for fees, transport, shipping or breakage, condition uncertainty, negotiation, and time-to-sell before risking cash."
  };
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-test-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => "analysis-handler-resale-seller-fields",
    requestOpenAIJson: async ({ payload }) => {
      const schemaName = payload?.text?.format?.name;
      if (schemaName === "item_identity") return { json: { ...identity, visualRecognition }, data: { output: [] } };
      if (schemaName === "market_value_report") {
        return {
          json: {
            identifiedItem: identity.exactProductIdentity,
            identificationConfidence: "Model identity prose.",
            pricingConfidence: "Model pricing prose.",
            recommendation: "Model recommendation.",
            valueRating: "Model badge.",
            currentAskingPrice: "$10.00",
            ...sellerFields,
            reasonsToBuy: [],
            reasonsForCaution: [],
            productOrConditionRisks: [],
            betterValueConsiderations: [],
            additionalInformationNeeded: []
          },
          data: { output: [] }
        };
      }
      throw new Error(`Unexpected deterministic schema request: ${schemaName}`);
    },
    requestSerperSearch: async () => ({
      json: providerResponse,
      statusCode: 200,
      elapsedMs: 2
    }),
    requestBoundedRetailProductPage: async (url) => {
      const amount = url.endsWith("9010") ? "50.00" : "55.00";
      const sourceEvidenceText = `Falcons 1999 Champions Coach Rivera metal advertising sign. Confirmed sold for $${amount}. Completed sale.`;
      return {
        finalUrl: url,
        statusCode: 200,
        elapsedMs: 2,
        html: `<html><body>${sourceEvidenceText}</body></html>`,
        sourceEvidenceText
      };
    },
    onFinalEvidenceResult: (result) => finalEvidenceResults.push(result)
  });
  const req = {
    method: "POST",
    body: {
      reportType: "marketValue",
      platform: "",
      notes: "Falcons 1999 Champions Coach Rivera metal advertising sign.",
      photos: [{
        name: "sanitized-resale-collector-sign.png",
        dataUrl: "data:image/png;base64,iVBORw0KGgo="
      }],
      buyerIntake: {
        purchase_intent: "resale",
        buyer_intent: "resale",
        purchase_context: "private_seller",
        item_name: "Falcons 1999 Champions Coach Rivera metal advertising sign",
        asking_price: "$10.00",
        observed_price: "$10.00",
        item_condition: "used",
        buyer_notes: "Exact commemorative design shown in the submitted photo."
      }
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
  assert.equal(finalEvidenceResult.buyerOfferResult.status, "resale_market_supported");

  const report = res.payload.valuation;
  assert.deepEqual(report.buyerOfferResult, clientVisibleShape(finalEvidenceResult.buyerOfferResult));
  assert.deepEqual(report.buyerOfferSupportEvidenceIds, finalEvidenceResult.buyerOfferResult.supportingEvidenceIds);
  assert.deepEqual(report.searchDiagnostics.canonicalBuyerOfferSupportEvidenceIds, finalEvidenceResult.buyerOfferResult.supportingEvidenceIds);
  for (const [field, expected] of Object.entries(expectedSellerOutput)) {
    assert.equal(report[field], expected, `canonical buyer projection changed seller field ${field}`);
  }
});

async function runRetailHandlerForProviderOrder(recoveryRecords, completionDelays = []) {
  const finalEvidenceResults = [];
  let clock = Date.parse(retailRecoveryFixture.fixedNow);
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-test-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => retailRecoveryFixture.analysisId,
    nowMilliseconds: () => {
      clock += 5;
      return clock;
    },
    nowIso: () => new Date(clock).toISOString(),
    requestOpenAIJson: async ({ payload }) => ({
      json: responseForSchema(payload?.text?.format?.name),
      data: { output: [] }
    }),
    requestSerperSearch: async ({ queryRecord }) => {
      const planIndex = Math.max(0, Number(queryRecord?.priority || 1) - 1);
      const delayMs = completionDelays.length
        ? completionDelays[planIndex % completionDelays.length]
        : 0;
      if (delayMs) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
      return {
        json: queryRecord?.retailStage === "stage_7_limited_result_recovery"
          ? { organic: recoveryRecords }
          : retailRecoveryFixture.preliminaryProviderResponse,
        statusCode: 200,
        elapsedMs: delayMs || 4
      };
    },
    requestBoundedRetailProductPage: async () => retailRecoveryFixture.directPageResult,
    onFinalEvidenceResult: (result) => finalEvidenceResults.push(result)
  });
  const req = {
    method: "POST",
    body: {
      reportType: "marketValue",
      platform: "",
      notes: "Security envelopes, strip and seal, 48 count.",
      photos: [{
        name: "sanitized-retail-package.png",
        dataUrl: "data:image/png;base64,iVBORw0KGgo="
      }],
      buyerIntake: retailRecoveryFixture.buyerIntake
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
  return {
    finalEvidenceResult: finalEvidenceResults[0],
    report: res.payload.valuation
  };
}

test("real production handler preserves final customer evidence across provider completion order", async () => {
  const forwardRecords = retailRecoveryFixture.recoveryProviderResponse.organic;
  const forward = await runRetailHandlerForProviderOrder(forwardRecords);
  const reversed = await runRetailHandlerForProviderOrder(forwardRecords.slice().reverse());
  validateFinalEvidenceResult(forward.finalEvidenceResult);
  validateFinalEvidenceResult(reversed.finalEvidenceResult);
  assert.deepEqual(
    reversed.finalEvidenceResult.views,
    forward.finalEvidenceResult.views,
    "Canonical final evidence IDs and order cannot depend on provider completion order."
  );
  assert.deepEqual(
    reversed.finalEvidenceResult.customerEvidence,
    forward.finalEvidenceResult.customerEvidence,
    "Canonical customer evidence content and order cannot depend on provider completion order."
  );
  assert.deepEqual(
    reversed.report.customerEvidence,
    forward.report.customerEvidence,
    "Serialized handler customer evidence cannot depend on provider completion order."
  );
  assert.deepEqual(
    reversed.report.searchDiagnostics.canonicalCustomerEvidenceIds,
    forward.report.searchDiagnostics.canonicalCustomerEvidenceIds
  );
  assert.deepEqual(reversed.report.pricesFound, reversed.report.customerEvidence);

  for (const completionDelays of [
    [12, 1, 7],
    [1, 12, 7],
    [7, 1, 12]
  ]) {
    const delayed = await runRetailHandlerForProviderOrder(forwardRecords, completionDelays);
    validateFinalEvidenceResult(delayed.finalEvidenceResult);
    assert.deepEqual(delayed.finalEvidenceResult.views, forward.finalEvidenceResult.views);
    assert.deepEqual(delayed.finalEvidenceResult.customerEvidence, forward.finalEvidenceResult.customerEvidence);
    assert.deepEqual(delayed.report.customerEvidence, forward.report.customerEvidence);
    assert.deepEqual(delayed.report.pricesFound, delayed.report.customerEvidence);
  }
});
