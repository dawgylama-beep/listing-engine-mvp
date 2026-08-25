import assert from "node:assert/strict";
import test from "node:test";

import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import {
  GOVERNED_RESEARCH_APPLICABILITY,
  classifyGovernedResearchOutcome
} from "../lib/cognitive-learning/adapter.js";
import { validateFinalEvidenceResult } from "../lib/evidence/index.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

function outcomeFeatures(overrides = {}) {
  return {
    providerCallsAttempted: 3,
    providerCallsSucceeded: 3,
    transportFailureCount: 0,
    traceableSourceCount: 3,
    normalizedCandidateCount: 3,
    exactComparableCount: 0,
    closeComparableCount: 0,
    categoryComparableCount: 0,
    strategyDiscardedCandidateCount: 0,
    serializationLossCount: 0,
    unsupportedQueryTermCount: 0,
    weakPriceProvenanceCount: 0,
    valueJudgmentExceedsEvidenceCount: 0,
    groundedPlan: true,
    fullLadderExecuted: true,
    ...overrides
  };
}

function comparableRecord({
  id,
  title,
  identityMatchStrength,
  objectMindClassification,
  objectMindVerificationState,
  price = null,
  priceEvidenceType = "Reference Without Price",
  itemTypeCompatible = true,
  url = `https://market.synthetic.example/product/${id}`
}) {
  return {
    sourceRecordId: `source-${id}`,
    title,
    url,
    canonicalUrl: url,
    domain: "market.synthetic.example",
    source: "Synthetic Market",
    sourceBacked: url ? "URL-cited" : "No usable URL supplied by source.",
    pageType: "product_or_listing",
    displayedPriceText: Number.isFinite(price) ? `$${price.toFixed(2)}` : "",
    parsedPrice: price,
    currency: Number.isFinite(price) ? "USD" : "",
    priceEvidenceType,
    priceType: priceEvidenceType,
    listingStatus: Number.isFinite(price) ? "Active listing" : "Status unknown",
    identityMatchStrength,
    classification: identityMatchStrength,
    matchLevel: identityMatchStrength === "Exact"
      ? "Exact comparable"
      : identityMatchStrength === "Partial"
        ? "Close comparable"
        : "Category comparable",
    materialDifferences: identityMatchStrength === "Exact"
      ? "No decision-critical identity difference was established."
      : identityMatchStrength === "Partial"
        ? "Exact edition remains unresolved."
        : "Maker and model remain unresolved; object type is verified.",
    evidentiaryConfidence: identityMatchStrength === "Exact" ? "High" : identityMatchStrength === "Partial" ? "Medium" : "Low",
    observationDate: "2026-08-20",
    submittedItemType: "ceramic mantel clock",
    candidateItemType: itemTypeCompatible ? "ceramic mantel clock" : "wall poster",
    itemTypeCompatible,
    itemTypeCompatibilityStatus: itemTypeCompatible ? "compatible" : "mismatch",
    itemTypeCompatibilityExplanation: itemTypeCompatible
      ? "The source-backed candidate is the same verified object type."
      : "The source-backed candidate is a different object type.",
    objectMindSourceId: `object-source-${id}`,
    objectMindClassification,
    objectMindVerificationState,
    objectMindSupportingAttributes: objectMindClassification === "EXACT_ITEM"
      ? [{ field: "product", status: "SUPPORTED" }]
      : [{ field: "object_type", status: "SUPPORTED" }],
    objectMindConflictingAttributes: [],
    objectMindRejectionReason: objectMindVerificationState === "REJECTED" ? "Object type is incompatible." : "",
    evidenceRole: identityMatchStrength === "Reference Only"
      ? "Identity/reference context only"
      : identityMatchStrength === "Partial"
        ? "Directional context only"
        : `Comparable evidence - ${priceEvidenceType}`,
    retained: objectMindVerificationState !== "REJECTED"
  };
}

test("exact, close, and verified category evidence survive the complete funnel and serialize without pricing drift", () => {
  const networkGuard = installHardNetworkDenial();
  try {
    const exact = comparableRecord({
      id: "exact",
      title: "Aster Ceramics Model 18 Mantel Clock",
      identityMatchStrength: "Exact",
      objectMindClassification: "EXACT_ITEM",
      objectMindVerificationState: "VERIFIED",
      price: 84,
      priceEvidenceType: "Active Asking Price"
    });
    const close = comparableRecord({
      id: "close",
      title: "Aster Ceramics Model 18B Mantel Clock",
      identityMatchStrength: "Partial",
      objectMindClassification: "COMPATIBLE_ALTERNATIVE",
      objectMindVerificationState: "COMPATIBLE",
      price: 69,
      priceEvidenceType: "Active Asking Price"
    });
    const category = comparableRecord({
      id: "category",
      title: "Hand-painted Ceramic Mantel Clock",
      identityMatchStrength: "Reference Only",
      objectMindClassification: "INSUFFICIENT_EVIDENCE",
      objectMindVerificationState: "UNRESOLVED",
      url: "https://market.synthetic.example/product/context-clock"
    });
    const identityMismatch = comparableRecord({
      id: "mismatch",
      title: "Decorative Wall Poster",
      identityMatchStrength: "Rejected",
      objectMindClassification: "UNRELATED",
      objectMindVerificationState: "REJECTED",
      itemTypeCompatible: false,
      price: 12,
      priceEvidenceType: "Active Asking Price"
    });
    const missingUrl = comparableRecord({
      id: "missing-url",
      title: "Untraceable Ceramic Clock Claim",
      identityMatchStrength: "Reference Only",
      objectMindClassification: "INSUFFICIENT_EVIDENCE",
      objectMindVerificationState: "UNRESOLVED",
      url: ""
    });
    const records = [exact, close, category, identityMismatch, missingUrl];
    const liveSearch = {
      analysisId: "offline-comparable-funnel",
      searchProviderUsed: "offline synthetic provider",
      providerSourceRecords: records.filter((record) => record.url),
      sourceAcquisitionRecords: records.map((record) => ({
        ...record,
        extractionDisposition: record.url ? "PRESERVED" : "MALFORMED"
      })),
      providerRequestRecords: ["EXACT", "CLOSE", "CATEGORY"].map((level, index) => ({
        query: `${level.toLowerCase()} ceramic mantel clock`,
        comparableLadderLevel: level,
        attempted: true,
        logicalQueryAttempted: true,
        physicalAttemptCount: 1,
        succeeded: true,
        providerSourceCount: index === 0 ? 3 : 1
      })),
      searchDiagnostics: {},
      governedResearchStrategy: {
        executed: false,
        researchApplicabilityDecision: null,
        providerLifecycleAuthority: false
      }
    };
    const identity = {
      category: "ceramic mantel clock",
      subjectIdentity: "ceramic mantel clock",
      exactProductIdentity: "Aster Ceramics Model 18 Mantel Clock"
    };
    const buyerIntake = hooks.normalizeBuyerIntake({
      purchase_intent: "owner_value",
      purchase_context: "owned_item",
      item_name: "ceramic mantel clock"
    });

    const serialized = hooks.buildConsumerPricesFound(liveSearch, null, { identity, buyerIntake });
    validateFinalEvidenceResult(liveSearch.finalEvidenceResult);

    assert.deepEqual(
      serialized.map((record) => record.canonicalMatchLabel).sort(),
      ["Compatible", "Exact", "Strong compatible"],
      JSON.stringify({
        accepted: liveSearch.finalEvidenceResult.acceptedRecords,
        rejected: liveSearch.finalEvidenceResult.rejectedRecords,
        candidates: liveSearch.searchDiagnostics.comparableFunnel
      })
    );
    const closeCard = serialized.find((record) => record.canonicalMatchLabel === "Strong compatible");
    const categoryCard = serialized.find((record) => record.canonicalMatchLabel === "Compatible");
    assert.equal(closeCard.matchLevel, "Close comparable");
    assert.equal(categoryCard.matchLevel, "Category comparable");
    assert.equal(categoryCard.canonicalPrice, null);
    assert.equal(categoryCard.customerPriceLabel, "Price unavailable");
    assert.equal(categoryCard.currency, "Unknown");
    assert.equal(categoryCard.rangeEligible, false);
    assert.equal(categoryCard.decisionEligible, false);
    assert.equal(categoryCard.observationDate, "2026-08-20");
    assert.match(categoryCard.materialDifferences, /maker and model remain unresolved/i);
    assert.equal(categoryCard.evidentiaryConfidence, "Low");
    assert(serialized.every((record) => record.sourceLabel === "market.synthetic.example"));
    assert(serialized.filter((record) => record.canonicalPrice !== null).every((record) => record.canonicalPriceType === "Active asking price"));
    assert(!serialized.some((record) => /mismatch|missing-url/.test(record.evidenceId)));

    const finalById = new Map(liveSearch.finalEvidenceResult.acceptedRecords.map((record) => [record.evidenceId, record]));
    assert(serialized.every((record) => finalById.get(record.evidenceId)?.price === record.canonicalPrice));
    assert(!liveSearch.finalEvidenceResult.rangeResult.evidenceIds.includes(categoryCard.evidenceId));

    const funnel = liveSearch.searchDiagnostics.comparableFunnel;
    assert.deepEqual(funnel.serializedComparableCounts, { exact: 1, close: 1, category: 1 });
    assert.equal(funnel.stageCounts.retention, 3);
    assert.equal(funnel.stageCounts.responseSerialization, 3);
    assert.equal(funnel.rejectionReasons.serializationLoss, 0);
    assert.equal(funnel.rejectionReasons.missingSourceUrl, 1);
    assert(funnel.rejectionReasons.identityMismatch >= 1);
    assert.equal(
      liveSearch.searchDiagnostics.governedResearchStrategy.researchApplicabilityDecision.classification,
      GOVERNED_RESEARCH_APPLICABILITY.CLEAR
    );
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
  }
});

test("research outcome taxonomy distinguishes strategy loss, transport failure, and honest insufficiency from grounded success", () => {
  const cleanZero = classifyGovernedResearchOutcome(outcomeFeatures({ traceableSourceCount: 0, normalizedCandidateCount: 0 }));
  assert.notEqual(cleanZero.classification, GOVERNED_RESEARCH_APPLICABILITY.CLEAR);
  assert.equal(cleanZero.classification, GOVERNED_RESEARCH_APPLICABILITY.INSUFFICIENT);
  assert.equal(cleanZero.applicable, false);

  const strategyLoss = classifyGovernedResearchOutcome(outcomeFeatures({ strategyDiscardedCandidateCount: 2 }));
  assert.equal(strategyLoss.classification, GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE);
  assert.equal(strategyLoss.applicable, true);
  assert.deepEqual(strategyLoss.requiredApplicabilitySignals, ["COMPARABLE_RESEARCH_STRATEGY_RISK", "CANONICAL_PRODUCT_STATE"]);

  const transport = classifyGovernedResearchOutcome(outcomeFeatures({
    providerCallsSucceeded: 0,
    transportFailureCount: 3,
    traceableSourceCount: 0,
    normalizedCandidateCount: 0,
    fullLadderExecuted: false
  }));
  assert.equal(transport.classification, GOVERNED_RESEARCH_APPLICABILITY.OPERATIONAL);
  assert.equal(transport.applicable, false);
  assert.equal(transport.requiredApplicabilitySignals.length, 0);

  const inadequateLadder = classifyGovernedResearchOutcome(outcomeFeatures({
    traceableSourceCount: 2,
    normalizedCandidateCount: 2,
    fullLadderExecuted: false
  }));
  assert.equal(inadequateLadder.classification, GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE);

  const grounded = classifyGovernedResearchOutcome(outcomeFeatures({
    exactComparableCount: 1,
    closeComparableCount: 1,
    categoryComparableCount: 1
  }));
  assert.equal(grounded.classification, GOVERNED_RESEARCH_APPLICABILITY.CLEAR);
  assert.equal(grounded.applicable, false);
});
