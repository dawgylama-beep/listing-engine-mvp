import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createFinalEvidenceResult,
  createCanonicalRecoveryView
} from "../lib/evidence/index.js";

globalThis.fetch = async () => {
  throw new Error("Unexpected network access in final-evidence-boundary test.");
};

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const targetIdentity = {
  upc: "012345678905",
  quantity: 48,
  dimensions: "4.125 x 9.5 inches",
  packageType: "security envelopes",
  designAttributes: ["strip and seal", "security tint"]
};

function observation(overrides = {}) {
  const sourceRecordId = overrides.sourceRecordId || "source-1";
  const exact = overrides.exactIdentity !== false;
  return {
    sourceRecordId,
    title: "Cedarline Security Envelopes 48 Count",
    retailer: "Direct Retail",
    sourceDomain: "direct.example",
    destinationUrl: "https://direct.example/product/012345678905",
    upc: "012345678905",
    quantity: 48,
    dimensions: "4.125 x 9.5 inches",
    packageType: "security envelopes",
    designIdentity: "strip and seal security tint",
    exactIdentity: true,
    identityMatchStrength: "Exact",
    ...(exact ? {
      objectMindSourceId: `source:${sourceRecordId}`,
      objectMindClassification: "EXACT_ITEM",
      objectMindVerificationState: "VERIFIED",
      objectMindSupportingAttributes: [{ attribute: "synthetic_identity", status: "SUPPORTED" }],
      objectMindConflictingAttributes: []
    } : {}),
    pageType: "product",
    price: 5.5,
    priceType: "Current retail price",
    ...overrides
  };
}

function idSets(result) {
  return Object.fromEntries(
    Object.entries(result.views)
      .filter(([name]) => name !== "displayedIds")
      .map(([name, ids]) => [name, [...ids].sort()])
  );
}

function assertContract(result) {
  const recordIds = new Set(result.records.map((record) => record.evidenceId));
  assert.equal(recordIds.size, result.records.length, "contract records must have unique evidence IDs");
  for (const [viewName, ids] of Object.entries(result.views)) {
    assert.equal(new Set(ids).size, ids.length, `${viewName} must not contain duplicate IDs`);
    ids.forEach((id) => assert(recordIds.has(id), `${viewName} ID ${id} must exist in records`));
    assert.equal(result.counts[viewName.replace(/Ids$/, "Count")], ids.length, `${viewName} count must derive from the view`);
  }
  const rejected = new Set(result.views.rejectedDiagnosticOnlyIds);
  for (const viewName of ["acceptedIds", "customerEligibleIds", "rangeEligibleIds", "decisionEligibleIds"]) {
    result.views[viewName].forEach((id) => assert(!rejected.has(id), `rejected ID must remain outside ${viewName}`));
  }
  result.records.forEach((record) => {
    assert(record.evidenceId, "every record must have an evidence ID");
    assert(record.underlyingOfferId, "every record must retain an underlying-offer ID");
  });
}

const exact = observation();
const compatible = observation({
  sourceRecordId: "source-2",
  title: "Harborline Security Envelopes 48 Count",
  retailer: "Alternate Retail",
  sourceDomain: "alternate.example",
  destinationUrl: "https://alternate.example/product/security-envelopes-50",
  upc: "",
  quantity: 48,
  exactIdentity: false,
  identityMatchStrength: "Strong compatible",
  price: 4.8
});
const rejectedGeneric = observation({
  sourceRecordId: "source-3",
  title: "Security envelopes category",
  destinationUrl: "https://generic.example/category/envelopes",
  upc: "",
  exactIdentity: false,
  identityMatchStrength: "Weak",
  pageType: "category",
  price: null,
  priceType: "Reference/archive"
});

const result = createFinalEvidenceResult({
  analysisId: "analysis-boundary",
  analysisMode: "retail",
  targetIdentity,
  observations: [exact, compatible, rejectedGeneric],
  displayLimit: 8,
  askingPrice: 5.5
});
assertContract(result);
assert(result.views.exactMatchIds.includes(result.views.acceptedIds[0]), "exact evidence must enter the exact view");
assert.equal(result.views.acceptedIds.length, 2, "exact and compatible evidence must be accepted");
assert.equal(result.views.rejectedDiagnosticOnlyIds.length, 1, "generic category evidence must remain diagnostic-only");
assert.deepEqual(result.diagnostics.finalizedCustomerRecordIds, result.views.customerEligibleIds);
assert.deepEqual(result.diagnostics.displayedRecordIds, result.views.displayedIds);

const reordered = createFinalEvidenceResult({
  analysisId: "analysis-boundary",
  analysisMode: "retail",
  targetIdentity,
  observations: [
    { ...rejectedGeneric, title: rejectedGeneric.title.toUpperCase() },
    { ...compatible, title: compatible.title.toUpperCase(), matchQuality: "Customer label changed" },
    { ...exact, title: exact.title.toUpperCase(), matchQuality: "Presentation label changed" }
  ],
  displayLimit: 8,
  askingPrice: 5.5
});
assert.deepEqual(
  result.records.map((record) => record.evidenceId).sort(),
  reordered.records.map((record) => record.evidenceId).sort(),
  "evidence IDs must be independent of provider order and presentation formatting"
);
assert.deepEqual(idSets(result), idSets(reordered), "non-display view membership must be order-independent");

const truncated = createFinalEvidenceResult({
  analysisId: "analysis-boundary",
  analysisMode: "retail",
  targetIdentity,
  observations: [exact, compatible, rejectedGeneric],
  displayLimit: 1,
  askingPrice: 5.5
});
assert.equal(truncated.views.displayedIds.length, 1);
assert.deepEqual(idSets(result), idSets(truncated), "display truncation must not alter business views");
assert.deepEqual(
  result.records.map((record) => [record.evidenceId, record.underlyingOfferId]).sort(),
  truncated.records.map((record) => [record.evidenceId, record.underlyingOfferId]).sort(),
  "display truncation must not alter stable identities"
);

const duplicateResult = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: [
    exact,
    { ...exact, sourceRecordId: "source-1-direct", sourceQuality: "direct_product_page" }
  ]
});
assert.equal(duplicateResult.views.acceptedIds.length, 1, "same offer must finalize once");
assert.equal(duplicateResult.views.displayedIds.length, 1, "same offer must display once");
assert.equal(duplicateResult.acceptedRecords[0].observationIds.length, 2, "source observations must remain traceable");

const preliminary = createCanonicalRecoveryView({
  observations: [],
  targetIdentity,
  providerAccounting: {
    logicalProviderQueryCount: 1,
    physicalProviderAttemptCount: 1,
    maximumPhysicalProviderAttempts: 28
  }
});
assert.equal(preliminary.additionalPriceRecoveryNeeded, true);
assert.equal(preliminary.providerAccounting.remainingPhysicalProviderAttempts, 27);
const recoveredResult = createFinalEvidenceResult({
  analysisMode: "retail",
  targetIdentity,
  observations: [exact, compatible, rejectedGeneric]
});
assert.equal(recoveredResult.views.acceptedIds.length, 2);
assert.equal(recoveredResult.views.rejectedDiagnosticOnlyIds.length, 1);

const apiSource = fs.readFileSync(path.join(root, "api", "generate-listing.js"), "utf8");
assert(!apiSource.includes("buildFinalRetailCustomerEvidenceSnapshot"), "early final customer snapshot must be deleted");
assert.equal((apiSource.match(/createFinalEvidenceResult\s*\(/g) || []).length, 1, "production must call the canonical builder exactly once");
assert(!apiSource.includes("assembleFinalEvidence"), "production API must not directly call the modular finalizer");
const diagnosticsStart = apiSource.indexOf("function buildRetailSearchDiagnostics");
const diagnosticsEnd = apiSource.indexOf("\nfunction ", diagnosticsStart + 10);
const preliminaryDiagnostics = apiSource.slice(diagnosticsStart, diagnosticsEnd);
for (const forbidden of ["finalCustomerRecordIds", "finalCustomerVisibleCountByRetailer", "customerVisibleCountByRetailer", "displayedCustomerEvidence"]) {
  assert(!preliminaryDiagnostics.includes(forbidden), `preliminary diagnostics must not publish ${forbidden}`);
}

console.log("final-evidence-boundary: PASS");
