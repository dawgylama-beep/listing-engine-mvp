import assert from "node:assert/strict";
import test from "node:test";
import { finalizeCustomerReportIntegrity } from "../lib/customer-report-integrity.js";
import { sanitizeHistorySnapshot } from "../lib/customer-account/service.js";

// OBJ-008's retained Preview accessibility capture reported High exact-item
// confidence alongside "No accepted evidence record supplied an exact matching
// identifier." These are historical UI observations, not provider payloads.
const cameraUrl = "https://bluemooncamera.com/museum/exhibit/6422/kodak-brownie-hawkeye-flash-model";
const ebayUrl = "https://www.ebay.com/itm/116634924403";

function report() {
  return {
    subjectIdentity: "Vintage box camera",
    visualSubjectConfidence: "High",
    exactProductIdentity: "Kodak Brownie Hawkeye Flash Model",
    identificationConfidence: "High - multiple exact identity sources; no exact matching identifier",
    confidenceResult: {
      identity: { level: "high", rationaleCodes: ["multiple_exact_identity_sources"], supportingEvidenceIds: ["camera-1"] },
      pricing: { level: "insufficient" }
    },
    identitySummary: "Subject Identity: A vintage box camera photographed from the front | Subject Confidence: High - user-provided identity is consistent with available visual or text evidence. | Exact Product Identity: Kodak Brownie Hawkeye Flash Model box camera, based on the visible front labeling | Maker / Manufacturer: Kodak / Eastman Kodak Company | Licensing / Authenticity: Not applicable or unknown; no licensing sticker visible / Not independently authenticated; appearance and labeling are consistent with the visible mark, while the photographed unit's exact revision and working condition remain unverified.",
    searchDiagnostics: {
      searchProviderUsed: "Serper Google Search",
      serperCallsAttempted: 6,
      physicalProviderAttemptCount: 6,
      providerSourceRecords: [{ sourceRecordId: "camera-1", acquisitionProvider: "serper_google", canonicalUrl: cameraUrl, title: "Brownie Hawkeye Flash Model" }],
      modelExecutionBudget: { modelGenerationRequestCount: 2, inputTokenCountRequestCount: 2, webSearchToolCallCount: 0, reservedSpendingDollars: 1.25, maximumSpendingDollars: 2.5, observations: [] }
    },
    customerSourceFindings: [
      { title: "Brownie Hawkeye Flash Model", sourceRecordId: "camera-1", acquisitionProvider: "serper_google", destinationUrl: cameraUrl },
      { title: "Untraced eBay listing", destinationUrl: ebayUrl }
    ],
    resultsFound: [{ title: "Untraced eBay listing", url: ebayUrl, provider: "serper_google" }],
    customerEvidence: [],
    customerEvidenceSummary: { displayedIds: [], counts: { displayed: 0 }, displayedCountByRetailer: {}, displayedCountByPriceType: {}, displayedCountByMatchClass: {} }
  };
}

test("retained OBJ-008 contradiction resolves into four distinct, honest confidence axes", () => {
  const value = finalizeCustomerReportIntegrity(report());
  assert.equal(value.customerConfidence.visibleCategory.level, "High");
  assert.equal(value.customerConfidence.exactItem.level, "Medium");
  assert.equal(value.customerConfidence.exactItem.acceptedExactIdentifier, false);
  assert.equal(value.customerConfidence.workingCondition.level, "Insufficient");
  assert.equal(value.customerConfidence.valuation.level, "Insufficient");
  assert.doesNotMatch(value.customerConfidenceSummary.exactItem, /: High\b/);
  assert.match(value.customerConfidenceSummary.exactItem, /No accepted source establishes an exact matching identifier/);
});

test("provider source bindings retain the acquisition channel and fail closed for untraced or substituted links", () => {
  const value = finalizeCustomerReportIntegrity(report());
  assert.equal(value.customerSourceFindings.length, 1);
  assert.equal(value.customerSourceFindings[0].sourceProvenance.acquisitionProvider, "serper_google");
  assert.equal(value.customerSourceFindings[0].sourceProvenance.sourceRecordId, "camera-1");
  assert.equal(value.resultsFound[0].url, "");
  assert.equal(value.searchDiagnostics.customerSourceProvenance.rejectedCount, 2);

  const wrongChannel = report();
  wrongChannel.customerSourceFindings[0].acquisitionProvider = "openai_web_search";
  assert.equal(finalizeCustomerReportIntegrity(wrongChannel).customerSourceFindings.length, 0);
  const wrongId = report();
  wrongId.customerSourceFindings[0].sourceRecordId = "different-source";
  assert.equal(finalizeCustomerReportIntegrity(wrongId).customerSourceFindings.length, 0);
});

test("canonical customer cards require matching URL, record identity and acquisition channel", () => {
  const input = report();
  input.customerEvidence = [{
    evidenceId: "evidence-camera-1", sourceLabel: "Blue Moon Camera", canonicalPriceType: "Price unavailable",
    canonicalMatchLabel: "Exact", destinationUrl: cameraUrl, sourceObservationIds: ["camera-1"],
    provenance: { url: { sourceRecordId: "camera-1", acquisitionProvider: "serper_google", sourceUrl: cameraUrl } }
  }];
  const accepted = finalizeCustomerReportIntegrity(input);
  assert.equal(accepted.customerEvidence.length, 1);
  assert.equal(accepted.customerEvidence[0].sourceProvenance.sourceRecordId, "camera-1");
  assert.equal(accepted.customerEvidenceSummary.counts.displayed, 1);
  const wrongProvider = structuredClone(input);
  wrongProvider.customerEvidence[0].provenance.url.acquisitionProvider = "openai_web_search";
  const rejected = finalizeCustomerReportIntegrity(wrongProvider);
  assert.equal(rejected.customerEvidence.length, 0);
  assert.equal(rejected.customerEvidenceSummary.counts.displayed, 0);
  assert.equal(rejected.pricesFound.length, 0);
  wrongProvider.customerEvidence[0].canonicalPrice = 18;
  assert.throws(() => finalizeCustomerReportIntegrity(wrongProvider), { code: "SOURCE_PROVENANCE_BINDING_FAILED" });
});

test("complete identification and the same confidence survive snapshot sanitation", () => {
  const value = finalizeCustomerReportIntegrity(report());
  const longIdentification = `${value.identitySummary} ${"The customer needs to verify the label and camera operation. ".repeat(24)}`.trim();
  assert.ok(longIdentification.length > 1200);
  const snapshot = sanitizeHistorySnapshot({
    workflow: "resale",
    title: value.exactProductIdentity,
    identification: { confidence: value.customerConfidence.exactItem.level, summary: longIdentification },
    confidence: value.customerConfidenceSummary,
    confidenceModel: value.customerConfidence,
    listing: { description: `${"A retained customer-facing sentence. ".repeat(220)}The ending remains visible.` },
    uncertainty: [`${"Operational condition remains unknown. ".repeat(20)}Verify the shutter.`],
    evidence: value.customerSourceFindings.map((source) => ({
      title: source.title,
      sourceRecordId: source.sourceProvenance.sourceRecordId,
      acquisitionProvider: source.sourceProvenance.acquisitionProvider,
      url: source.destinationUrl
    })),
    metering: value.customerMetering
  });
  assert.equal(snapshot.identification.summary, longIdentification);
  assert.match(snapshot.listing.description, /The ending remains visible\.$/);
  assert.match(snapshot.uncertainty[0], /Verify the shutter\.$/);
  assert.deepEqual(snapshot.confidence, value.customerConfidenceSummary);
  assert.deepEqual(snapshot.confidenceModel, value.customerConfidence);
  assert.equal(snapshot.evidence[0].url, cameraUrl);
  assert.equal(snapshot.evidence[0].acquisitionProvider, "serper_google");
  assert.equal(snapshot.metering.billingStatus, "UNKNOWN");
  assert.equal(snapshot.metering.exactBilledDollars, null);
  assert.equal(snapshot.metering.reservedUpperBoundDollars, 1.25);
});

test("available token telemetry is retained while absent billing stays UNKNOWN", () => {
  const input = report();
  input.searchDiagnostics.modelExecutionBudget.observations = [
    { reportedTokens: { inputTokens: 100, cachedInputTokens: 20, outputTokens: 30, totalTokens: 130 } },
    { reportedTokens: { inputTokens: 50, outputTokens: 10, totalTokens: 60 } }
  ];
  const metering = finalizeCustomerReportIntegrity(input).customerMetering;
  assert.equal(metering.generationRequests, 2);
  assert.equal(metering.tokenCountRequests, 2);
  assert.equal(metering.searchProviderAttempts, 6);
  assert.deepEqual(metering.reportedTokens, { inputTokens: 150, cachedInputTokens: 20, outputTokens: 40, totalTokens: 190 });
  assert.equal(metering.requestObservations.length, 2);
  const snapshot = sanitizeHistorySnapshot({ metering });
  assert.deepEqual(snapshot.metering.requestObservations, metering.requestObservations);
  assert.equal(metering.exactBilledDollars, null);
  assert.equal(metering.billingStatus, "UNKNOWN");
});

test("current total-provider reservation and failed Serper attempt survive save without invented billing", () => {
  const input = report();
  input.searchDiagnostics.modelExecutionBudget = {
    schemaVersion: "2.0", modelGenerationRequestCount: 2, inputTokenCountRequestCount: 2,
    webSearchToolCallCount: 0, reservedSpendingDollars: 1.2,
    maximumSpendingDollars: 2.44, maximumTotalProviderSpendingDollars: 2.5,
    serperReservedSpendingDollars: 0.06, maximumSerperAttempts: 6, serperAttemptReservationDollars: 0.01,
    serperAttemptCount: 2, serperAttempts: [
      { ordinal: 1, status: "FAILED", conservativeExposureDollars: 0.01 },
      { ordinal: 2, status: "SUCCEEDED", conservativeExposureDollars: 0.01 }
    ], observations: []
  };
  const metering = finalizeCustomerReportIntegrity(input).customerMetering;
  assert.equal(metering.reservationScope, "TOTAL_PROVIDER_CONSERVATIVE_EXPOSURE");
  assert.equal(metering.modelReservedUpperBoundDollars, 1.2);
  assert.equal(metering.serperReservedUpperBoundDollars, 0.06);
  assert.equal(metering.reservedUpperBoundDollars, 1.26);
  assert.equal(metering.maximumAuthorizedDollars, 2.5);
  assert.equal(metering.searchProviderAttempts, 2);
  assert.equal(metering.serperAttemptRecords[0].status, "FAILED");
  assert.equal(metering.billingStatus, "UNKNOWN");
  assert.equal(metering.exactBilledDollars, null);
  const saved = sanitizeHistorySnapshot({ metering });
  assert.equal(saved.metering.reservationScope, metering.reservationScope);
  assert.equal(saved.metering.serperAttemptRecords[0].status, "FAILED");
  assert.equal(saved.metering.reservedUpperBoundDollars, 1.26);
  assert.equal(saved.metering.exactBilledDollars, null);
  const inconsistent = sanitizeHistorySnapshot({ metering: { ...metering, modelReservedUpperBoundDollars: 2.5 } });
  assert.equal(inconsistent.metering.reservationScope, "MODEL_EXECUTION_ONLY_NOT_TOTAL_PROVIDER_BILLING");
});

test("oversized report text fails saving instead of ending mid-sentence", () => {
  assert.throws(() => sanitizeHistorySnapshot({ identification: { summary: "x".repeat(32001) } }), {
    code: "history_snapshot_too_large"
  });
});
