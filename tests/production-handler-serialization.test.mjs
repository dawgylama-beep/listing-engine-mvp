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

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

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
  if (schemaName === "visual_subject_recognition") {
    return retailRecoveryFixture.visualRecognition;
  }
  if (schemaName === "item_identity") {
    return retailRecoveryFixture.identity;
  }
  if (schemaName === "consumer_purchase_decision") {
    return retailRecoveryFixture.finalReport;
  }
  throw new Error(`Unexpected deterministic OpenAI schema request: ${schemaName}`);
}

function collectSerializedEvidenceIds(report = {}) {
  const ids = [];
  const add = (record) => {
    if (record && typeof record === "object" && record.evidenceId) ids.push(record.evidenceId);
  };
  for (const field of [
    "pricesFound",
    "otherCompatiblePricesFound",
    "otherCurrentRetailPrices",
    "strongComparables",
    "partialComparables",
    "itemIdentificationEvidence",
    "referenceResults"
  ]) {
    for (const record of Array.isArray(report[field]) ? report[field] : []) add(record);
  }
  add(report.bestCompatiblePriceFound);
  add(report.bestCurrentRetailAlternative);
  return ids;
}

test("real production handler serializes canonical evidence IDs through deterministic adapters", async () => {
  const trace = {
    openAISchemas: [],
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
    requestOpenAIJson: async ({ payload }) => {
      assert.equal(payload.model, "deterministic-test-model");
      const schemaName = payload?.text?.format?.name;
      trace.openAISchemas.push(schemaName);
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

  assert.equal(networkGuard.attempts.length, 0, "all expected external calls must be satisfied by injected adapters");
  assert.equal(res.statusCode, 200);
  assert(res.payload?.valuation, "real handler must serialize the valuation response envelope");
  assert.equal(res.payload.valuation.analysisId, retailRecoveryFixture.analysisId);
  assert.deepEqual(trace.openAISchemas, [
    "visual_subject_recognition",
    "item_identity",
    "consumer_purchase_decision"
  ]);
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
  serializedEvidenceIds.forEach((id) => assert(canonicalIds.has(id), `serialized alias contains unknown evidence ID ${id}`));
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
    assert.match(report.maximumRecommendedPrice, new RegExp(`\\$${finalEvidenceResult.retailLimitResult.amount.toFixed(2)}`));
  }
  assert.equal(report.verifiedMarketRange ?? "", "");
  assert.equal(report.currentAskingPriceRange ?? "", "");
  assert.equal(report.preliminaryReferenceRange ?? "", "");

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
        title: "Falcons 1999 Champions Coach Rivera metal advertising sign",
        link: "https://www.ebay.com/itm/123456789013",
        snippet: "Exact design reference page. Price unavailable."
      },
      {
        position: 2,
        title: "Falcons 1999 Champions Coach Rivera metal advertising sign",
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
      if (schemaName === "visual_subject_recognition") return { json: visualRecognition, data: { output: [] } };
      if (schemaName === "item_identity") return { json: identity, data: { output: [] } };
      if (schemaName === "consumer_purchase_decision") {
        return {
          json: {
            identifiedItem: identity.exactProductIdentity,
            identificationConfidence: "High - exact design wording is visible.",
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
      html: "<html><body>Falcons 1999 Champions Coach Rivera metal advertising sign. Price unavailable.</body></html>",
      sourceEvidenceText: "Falcons 1999 Champions Coach Rivera metal advertising sign. Price unavailable."
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
});
