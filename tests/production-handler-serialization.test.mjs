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
