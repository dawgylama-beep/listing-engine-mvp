import assert from "node:assert/strict";
import test from "node:test";

import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import {
  GOVERNED_RESEARCH_APPLICABILITY,
  classifyGovernedResearchOutcome
} from "../lib/cognitive-learning/adapter.js";
import { validateFinalEvidenceResult } from "../lib/evidence/index.js";
import {
  createInitialObjectSearchPlan,
  createObjectMindState,
  createPurposeNeutralObjectInput,
  withObjectSearchPlan
} from "../lib/object-intelligence/index.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const syntheticPhoto = Object.freeze({
  name: "structural-fixture.png",
  dataUrl: "data:image/png;base64,iVBORw0KGgo="
});

function structuralObjectState(analysisId, notes, extractedIdentity) {
  const neutralInput = createPurposeNeutralObjectInput({ notes, buyerIntake: { item_name: notes } });
  const state = createObjectMindState({
    analysisId,
    photos: [syntheticPhoto],
    neutralInput,
    extractedIdentity
  });
  return withObjectSearchPlan(state, createInitialObjectSearchPlan(state, { maximumQueries: 8 }));
}

function ladderPlan(objectLabel) {
  return [
    ["EXACT", `${objectLabel} exact identity`],
    ["EXACT", `${objectLabel} exact marks`],
    ["CLOSE", `${objectLabel} same functional family`],
    ["CLOSE", `${objectLabel} comparable configuration`],
    ["CATEGORY", `${objectLabel} category market context`]
  ].map(([level, query], index) => ({
    queryId: `query-${level.toLowerCase()}-${index}`,
    objectMindQueryId: `query-${level.toLowerCase()}-${index}`,
    query,
    comparableLadderLevel: level
  }));
}

async function runLadderFixture(objectLabel, sufficiencyByLevel) {
  const executed = [];
  const result = await hooks.executeBoundedComparableFallback({
    queryRecords: ladderPlan(objectLabel),
    executeLevel: async (records, level) => {
      executed.push({ level, queries: records.map((record) => record.query) });
    },
    evidenceSufficientAfterLevel: (level) => sufficiencyByLevel[level] === true
  });
  return { executed, result };
}

function comparableRecord({
  id,
  title,
  level,
  identityMatchStrength,
  objectMindClassification,
  objectMindVerificationState,
  price = null,
  url = `https://market.synthetic.example/item/${id}`,
  itemTypeCompatible = true,
  materialDifferences = ""
}) {
  return {
    sourceRecordId: `source-${id}`,
    title,
    url,
    canonicalUrl: url,
    destinationUrl: url,
    domain: "market.synthetic.example",
    source: "Synthetic Market",
    sourceBacked: "URL-cited",
    pageType: "product_or_listing",
    displayedPriceText: Number.isFinite(price) ? `$${price.toFixed(2)}` : "",
    parsedPrice: price,
    currency: Number.isFinite(price) ? "USD" : "",
    priceEvidenceType: Number.isFinite(price) ? "Active Asking Price" : "Reference Without Price",
    priceType: Number.isFinite(price) ? "Active Asking Price" : "Reference Without Price",
    listingStatus: Number.isFinite(price) ? "Active listing" : "Status unknown",
    comparableLadderLevel: level,
    identityMatchStrength,
    classification: identityMatchStrength,
    matchLevel: identityMatchStrength === "Exact"
      ? "Exact comparable"
      : identityMatchStrength === "Partial"
        ? "Close comparable"
        : identityMatchStrength === "Reference Only"
          ? "Category comparable"
          : "Rejected",
    materialDifferences,
    evidentiaryConfidence: level === "EXACT" ? "High" : level === "CLOSE" ? "Medium" : "Low",
    observationDate: "2026-08-25",
    submittedItemType: "ceramic wall clock",
    candidateItemType: itemTypeCompatible ? "ceramic wall clock" : "printed wall poster",
    itemTypeCompatible,
    itemTypeCompatibilityStatus: itemTypeCompatible ? "compatible" : "mismatch",
    itemTypeCompatibilityExplanation: itemTypeCompatible
      ? "The source-backed candidate belongs to the same functional object family."
      : "The source-backed candidate is a different object family.",
    objectMindSourceId: `object-source-${id}`,
    objectMindClassification,
    objectMindVerificationState,
    objectMindSupportingAttributes: objectMindClassification === "EXACT_ITEM"
      ? [{ field: "product", status: "SUPPORTED" }]
      : [{ field: "object_type", status: "SUPPORTED" }],
    objectMindConflictingAttributes: [],
    objectMindRejectionReason: objectMindVerificationState === "REJECTED" ? "Object family mismatch." : "",
    evidenceRole: level === "CATEGORY" ? "Identity/reference context only" : "Comparable evidence - Active Asking Price",
    retained: objectMindVerificationState !== "REJECTED"
  };
}

test("bounded fallback transitions exact to close to category only when canonical retained evidence remains insufficient", async () => {
  const networkGuard = installHardNetworkDenial();
  try {
    const antiqueClock = await runLadderFixture("antique wall clock", { EXACT: true });
    assert.deepEqual(antiqueClock.executed.map((entry) => entry.level), ["EXACT"]);
    assert.equal(antiqueClock.result.stoppedAfterLevel, "EXACT");
    assert.equal(antiqueClock.result.fullLadderAttempted, false);

    const genericSweater = await runLadderFixture("generic sweater jumper", { EXACT: false, CLOSE: true });
    assert.deepEqual(genericSweater.executed.map((entry) => entry.level), ["EXACT", "CLOSE"]);
    assert.equal(genericSweater.result.stoppedAfterLevel, "CLOSE");
    assert.equal(genericSweater.result.fullLadderAttempted, false);

    const disassembledToaster = await runLadderFixture("disassembled toaster", { EXACT: false, CLOSE: false });
    assert.deepEqual(disassembledToaster.executed.map((entry) => entry.level), ["EXACT", "CLOSE", "CATEGORY"]);
    assert.equal(disassembledToaster.result.stoppedAfterLevel, "");
    assert.equal(disassembledToaster.result.fullLadderAttempted, true);

    for (const fixture of [antiqueClock, genericSweater, disassembledToaster]) {
      const queries = fixture.executed.flatMap((entry) => entry.queries);
      assert(queries.length <= 8);
      assert.equal(new Set(queries.map((query) => query.toLowerCase())).size, queries.length);
    }
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
  }
});

test("canonical plans for the three structural fixtures reserve bounded exact, close, and category capacity", () => {
  const fixtures = [
    structuralObjectState("clock-plan", "antique ceramic wall clock", {
      brand: "Aster Ceramics",
      model: "AC-18",
      exactProductIdentity: "Aster Ceramics AC-18 Wall Clock",
      subjectIdentity: "ceramic wall clock",
      visibleText: ["Aster Ceramics", "AC-18"],
      visualRecognition: { visualSubject: "ceramic wall clock", visibleWords: ["Aster Ceramics", "AC-18"] }
    }),
    structuralObjectState("sweater-plan", "generic sweater jumper", {
      exactProductIdentity: "Unknown",
      subjectIdentity: "knitted sweater jumper",
      material: "knit textile",
      identityHypotheses: [{
        exactCandidateLabel: "",
        broaderFamilyIdentity: "knitted pullover sweater",
        supportingObservations: ["knit textile"],
        contradictingObservations: [],
        unresolvedDiscriminators: ["brand and fiber content"],
        distinguishingQueryOrObservation: ["read the garment label"],
        exactnessLevel: "BROADER_FAMILY",
        confidenceBand: "LOW"
      }],
      visualRecognition: { visualSubject: "knitted sweater jumper", visibleWords: [] }
    }),
    structuralObjectState("toaster-plan", "disassembled two-slot toaster", {
      exactProductIdentity: "Unknown",
      subjectIdentity: "two-slot electric toaster",
      diagnosticVisualDetails: ["housing removed", "two bread slots"],
      identityHypotheses: [{
        exactCandidateLabel: "",
        broaderFamilyIdentity: "two-slot electric toaster",
        supportingObservations: ["two bread slots"],
        contradictingObservations: [],
        unresolvedDiscriminators: ["maker and model label"],
        distinguishingQueryOrObservation: ["photograph the base label"],
        exactnessLevel: "BROADER_FAMILY",
        confidenceBand: "LOW"
      }],
      visualRecognition: { visualSubject: "disassembled two-slot electric toaster", visibleWords: [] }
    })
  ];

  for (const state of fixtures) {
    const levels = new Set(state.searchPlan.map((record) => record.comparableLadderLevel));
    assert.deepEqual([...levels].sort(), ["CATEGORY", "CLOSE", "EXACT"]);
    assert(state.searchPlan.length <= 8);
    assert.equal(new Set(state.searchPlan.map((record) => record.query.toLowerCase())).size, state.searchPlan.length);
    const providerPlan = hooks.buildCanonicalObjectSerperSearchPlan({
      context: { resaleMarketplaceContext: true },
      sourceCategories: ["marketplaces"],
      marketplaceDomains: ["ebay.com"],
      objectMindState: state
    });
    const providerLevels = new Set(providerPlan.map((record) => record.comparableLadderLevel));
    assert.deepEqual([...providerLevels].sort(), ["CATEGORY", "CLOSE", "EXACT"]);
    assert(providerPlan.length <= 8);
    assert.equal(new Set(providerPlan.map((record) => record.query.toLowerCase())).size, providerPlan.length);
  }
});

test("close and category evidence retain their labels and limitations while category context has no pricing authority", () => {
  const networkGuard = installHardNetworkDenial();
  try {
    const exact = comparableRecord({
      id: "clock-exact",
      title: "Aster Model 18 Ceramic Wall Clock",
      level: "EXACT",
      identityMatchStrength: "Exact",
      objectMindClassification: "EXACT_ITEM",
      objectMindVerificationState: "VERIFIED",
      price: 84,
      materialDifferences: "No decision-critical identity difference was established."
    });
    const close = comparableRecord({
      id: "clock-close",
      title: "Aster Model 18B Ceramic Wall Clock",
      level: "CLOSE",
      identityMatchStrength: "Partial",
      objectMindClassification: "COMPATIBLE_ALTERNATIVE",
      objectMindVerificationState: "COMPATIBLE",
      price: 69,
      materialDifferences: "The movement configuration and exact edition remain unresolved."
    });
    const duplicateClose = { ...close, sourceRecordId: "source-clock-close-duplicate" };
    const category = comparableRecord({
      id: "clock-category",
      title: "Hand-painted Ceramic Wall Clock",
      level: "CATEGORY",
      identityMatchStrength: "Reference Only",
      objectMindClassification: "INSUFFICIENT_EVIDENCE",
      objectMindVerificationState: "UNRESOLVED",
      price: 41,
      materialDifferences: "Maker, movement, age, dimensions, and condition remain unresolved; only the functional object family is relevant."
    });
    const unrelated = comparableRecord({
      id: "poster",
      title: "Printed Wall Poster",
      level: "CATEGORY",
      identityMatchStrength: "Rejected",
      objectMindClassification: "UNRELATED",
      objectMindVerificationState: "REJECTED",
      price: 12,
      itemTypeCompatible: false,
      materialDifferences: "Different functional object family."
    });
    const records = [exact, close, duplicateClose, category, unrelated];
    const liveSearch = {
      analysisId: "offline-comparable-fallback",
      searchProviderUsed: "offline synthetic provider",
      providerSourceRecords: records,
      sourceAcquisitionRecords: records.map((record) => ({ ...record, extractionDisposition: "PRESERVED" })),
      providerRequestRecords: ["EXACT", "CLOSE", "CATEGORY"].map((level) => ({
        query: `${level.toLowerCase()} ceramic wall clock`,
        comparableLadderLevel: level,
        attempted: true,
        logicalQueryAttempted: true,
        physicalAttemptCount: 1,
        succeeded: true,
        providerSourceCount: 1
      })),
      searchDiagnostics: {},
      governedResearchStrategy: { executed: false, researchApplicabilityDecision: null, providerLifecycleAuthority: false }
    };
    const identity = {
      category: "ceramic wall clock",
      subjectIdentity: "ceramic wall clock",
      exactProductIdentity: "Aster Model 18 Ceramic Wall Clock"
    };
    const buyerIntake = hooks.normalizeBuyerIntake({
      purchase_intent: "owner_value",
      purchase_context: "owned_item",
      item_name: "ceramic wall clock"
    });

    const serialized = hooks.buildConsumerPricesFound(liveSearch, null, { identity, buyerIntake });
    validateFinalEvidenceResult(liveSearch.finalEvidenceResult);
    assert.equal(serialized.filter((record) => record.matchLevel === "Close comparable").length, 1);
    assert.equal(
      serialized.filter((record) => record.matchLevel === "Category comparable").length,
      1,
      JSON.stringify({ serialized, accepted: liveSearch.finalEvidenceResult.acceptedRecords, rejected: liveSearch.finalEvidenceResult.rejectedRecords })
    );
    assert(!serialized.some((record) => record.matchLevel === "Exact comparable" && /18B|Hand-painted/i.test(record.title)));
    const closeCard = serialized.find((record) => record.matchLevel === "Close comparable");
    const categoryCard = serialized.find((record) => record.matchLevel === "Category comparable");
    assert.match(closeCard.materialDifferences, /movement configuration and exact edition/i);
    assert.match(categoryCard.materialDifferences, /maker, movement, age, dimensions, and condition/i);
    assert.equal(categoryCard.canonicalPrice, null);
    assert.equal(categoryCard.rangeEligible, false);
    assert.equal(categoryCard.decisionEligible, false);
    assert(!serialized.some((record) => /poster/i.test(record.title)));
    assert.equal(serialized.filter((record) => /18B/i.test(record.title)).length, 1);
    assert.equal(liveSearch.searchDiagnostics.comparableFunnel.fullLadderAttempted, true);
    assert.doesNotThrow(() => JSON.stringify({ serialized, finalEvidenceResult: liveSearch.finalEvidenceResult }));
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
  }
});

test("zero retained priced evidence drives every pricing-availability field and currentPriceAssessment to not established", () => {
  const emptyFinalEvidenceResult = {
    acceptedRecords: [],
    views: { priceBearingIds: [] },
    rangeResult: { status: "insufficient", low: null, high: null }
  };
  const reconciled = hooks.reconcileCanonicalResponsePriceState({
    valuationEvidenceState: "supported",
    pricingEvidenceState: "supported",
    currentPriceAssessment: "Canonical pricing evidence is available.",
    pricingRationale: "A supported range is available.",
    estimatedMarketValue: "$80-$100",
    recommendedListingPrice: "$95"
  }, {
    workflow: "listing",
    reliableResearchFound: true,
    finalEvidenceResult: emptyFinalEvidenceResult
  });
  assert.equal(reconciled.pricingEvidenceAvailable, false);
  assert.equal(reconciled.canonicalPricingEvidenceAvailable, false);
  assert.equal(reconciled.authoritativeRetainedPricedEvidenceCount, 0);
  assert.equal(reconciled.pricingState, "not_established");
  assert.equal(reconciled.valuationEvidenceState, "insufficient");
  assert.match(reconciled.currentPriceAssessment, /no retained priced canonical evidence is available/i);
  assert.equal(reconciled.estimatedMarketValue, "");
  assert.equal(reconciled.recommendedListingPrice, null);

  const zeroOutcome = classifyGovernedResearchOutcome({
    providerCallsAttempted: 5,
    providerCallsSucceeded: 5,
    transportFailureCount: 0,
    traceableSourceCount: 5,
    normalizedCandidateCount: 5,
    exactComparableCount: 0,
    closeComparableCount: 0,
    categoryComparableCount: 0,
    strategyDiscardedCandidateCount: 0,
    serializationLossCount: 0,
    unsupportedQueryTermCount: 0,
    weakPriceProvenanceCount: 0,
    valueJudgmentExceedsEvidenceCount: 0,
    groundedPlan: true,
    fullLadderExecuted: true
  });
  assert.notEqual(zeroOutcome.classification, GOVERNED_RESEARCH_APPLICABILITY.CLEAR);
  assert.equal(zeroOutcome.classification, GOVERNED_RESEARCH_APPLICABILITY.INSUFFICIENT);
  assert.doesNotThrow(() => JSON.stringify(reconciled));
});
