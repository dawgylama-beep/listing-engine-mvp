import assert from "node:assert/strict";
import test from "node:test";

import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import {
  createInitialObjectSearchPlan,
  createObjectMindState,
  createPurposeNeutralObjectInput,
  incorporateCandidateEvidence,
  withObjectSearchPlan
} from "../lib/object-intelligence/index.js";
import { buildBrowserHandlerResponse } from "./helpers/build-browser-handler-response.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

function photo(seed) {
  return {
    name: `${seed}.jpg`,
    dataUrl: `data:image/jpeg;base64,${Buffer.alloc(256, seed.charCodeAt(0)).toString("base64")}`
  };
}

function stateFor({ analysisId, identity, notes = "", buyerIntake = {}, imageSeed = "a" }) {
  const state = createObjectMindState({
    analysisId,
    photos: [photo(imageSeed)],
    neutralInput: createPurposeNeutralObjectInput({ notes, buyerIntake }),
    extractedIdentity: identity
  });
  return withObjectSearchPlan(state, createInitialObjectSearchPlan(state));
}

function providerPlan(state, identity = {}, overrides = {}) {
  return hooks.buildSerperSearchPlan({
    searchQueries: overrides.searchQueries || state.searchPlan.map((record) => record.query),
    sourceRoute: overrides.sourceRoute || ["general web exact phrase results"],
    identity: {
      ...identity,
      canonicalResearchIdentity: state.canonicalResearchIdentity
    },
    buyerIntake: overrides.buyerIntake || {
      purchase_intent: "owner_value",
      purchase_context: "owned_item"
    },
    notes: overrides.notes || "",
    objectMindState: state
  });
}

test("canonical research identity rejects an unrelated default noun and binds every query to current visible evidence", () => {
  const identity = {
    visualSubject: "wall clock",
    subjectIdentity: "wall clock",
    category: "timekeeping device",
    diagnosticVisualDetails: ["octagonal case", "pendulum window"],
    identityHypotheses: [{
      exactCandidateLabel: "unrelated porcelain figurine",
      broaderFamilyIdentity: "figurine",
      supportingObservations: ["imagined ceramic body"],
      confidenceBand: "HIGH"
    }],
    visualRecognition: {
      visualSubject: "wall clock",
      visualSubjectCategory: "timekeeping device",
      distinctiveFeatures: ["octagonal case", "pendulum window"]
    }
  };
  const state = stateFor({ analysisId: "clock-request", identity, imageSeed: "c" });
  const plan = providerPlan(state, identity, {
    searchQueries: ["figurine inherited stale default"],
    sourceRoute: ["vintage and secondary-market sources"]
  });
  assert.equal(state.canonicalResearchIdentity.objectCategory, "wall clock");
  assert.equal(state.canonicalResearchIdentity.allowedHypothesisIds.length, 0);
  assert(plan.length > 0);
  assert(plan.every((record) => /wall clock/i.test(record.query)));
  assert(plan.every((record) => !/figurine/i.test(record.query)));
  assert(plan.every((record) => record.authoritativeQueryProvenanceDecision === "AUTHORIZED_CURRENT_REQUEST_IDENTITY"));
  assert(plan.every((record) => record.objectMindIdentityTermProvenance.some((entry) => (
    entry.role === "CANONICAL_OBJECT_CATEGORY"
    && entry.observationIds.length > 0
  ))));
  assert(plan.every((record) => record.objectMindIdentityTermsUsed.every((term) => (
    record.objectMindIdentityTermProvenance.some((entry) => {
      const normalizedTerm = term.toLowerCase();
      const normalizedEntry = entry.term.toLowerCase();
      return normalizedTerm.includes(normalizedEntry) || normalizedEntry.includes(normalizedTerm);
    })
  ))));
});

test("supported visible configuration refines a generic category without accepting unsupported specificity", () => {
  const state = stateFor({
    analysisId: "appliance-request",
    imageSeed: "t",
    identity: {
      visualSubject: "kitchen appliance",
      subjectIdentity: "kitchen appliance",
      category: "small kitchen appliance",
      diagnosticVisualDetails: ["four separate bread slots", "two independent control levers"],
      identityHypotheses: [
        {
          exactCandidateLabel: "generic four-slot kitchen toaster",
          broaderFamilyIdentity: "small kitchen appliance",
          supportingObservations: ["four separate bread slots"],
          confidenceBand: "MEDIUM"
        },
        {
          exactCandidateLabel: "premium branded toaster model ZX-900",
          broaderFamilyIdentity: "small kitchen appliance",
          supportingObservations: ["brand badge not visible"],
          confidenceBand: "HIGH"
        }
      ],
      visualRecognition: {
        visualSubject: "kitchen appliance",
        visualSubjectCategory: "small kitchen appliance",
        distinctiveFeatures: ["four separate bread slots", "two independent control levers"]
      }
    }
  });
  assert.equal(state.canonicalResearchIdentity.objectCategory, "toaster");
  assert(state.canonicalResearchIdentity.configurationAttributes.some((attribute) => /four separate bread slots/i.test(attribute.value)));
  assert(state.searchPlan.every((record) => /toaster/i.test(record.query)));
  assert(state.searchPlan.some((record) => /four separate bread slots/i.test(record.query)));
  assert(state.searchPlan.every((record) => !/ZX-900|premium branded/i.test(record.query)));
});

test("weak or conflicting identities broaden safely and provider claims cannot replace the canonical category", () => {
  const state = stateFor({
    analysisId: "ambiguous-request",
    imageSeed: "u",
    identity: {
      visualSubject: "small handheld object",
      subjectIdentity: "small handheld object",
      category: "hand tool",
      diagnosticVisualDetails: ["dark handle", "curved metal edge"],
      identityHypotheses: [
        {
          exactCandidateLabel: "maker-specific leather tool",
          broaderFamilyIdentity: "leather tool",
          supportingObservations: ["unreadable maker stamp"],
          confidenceBand: "HIGH"
        },
        {
          exactCandidateLabel: "bookbinding implement",
          broaderFamilyIdentity: "bookbinding implement",
          supportingObservations: ["different edge profile"],
          confidenceBand: "HIGH"
        }
      ],
      visualRecognition: {
        visualSubject: "small handheld object",
        visualSubjectCategory: "hand tool",
        distinctiveFeatures: ["dark handle", "curved metal edge"]
      }
    }
  });
  assert.equal(state.canonicalResearchIdentity.objectCategory, "small handheld object");
  assert.equal(state.canonicalResearchIdentity.allowedHypothesisIds.length, 0);
  assert(state.searchPlan.every((record) => /small handheld object/i.test(record.query)));
  assert(state.searchPlan.every((record) => !/maker-specific|bookbinding/i.test(record.query)));
});

test("unrelated requests remain isolated in both execution orders and during concurrent construction", async () => {
  const definitions = {
    garment: {
      analysisId: "garment-request",
      imageSeed: "g",
      identity: {
        visualSubject: "knit sweater",
        subjectIdentity: "knit sweater",
        category: "clothing",
        construction: "ribbed cuffs",
        visualRecognition: { visualSubject: "knit sweater", visualSubjectCategory: "clothing", distinctiveFeatures: ["ribbed cuffs"] }
      }
    },
    lamp: {
      analysisId: "lamp-request",
      imageSeed: "l",
      identity: {
        visualSubject: "table lamp",
        subjectIdentity: "table lamp",
        category: "lighting device",
        material: "brass",
        visualRecognition: { visualSubject: "table lamp", visualSubjectCategory: "lighting device", distinctiveFeatures: ["brass stem"] }
      }
    }
  };
  const forward = [stateFor(definitions.garment), stateFor(definitions.lamp)];
  const reverse = [stateFor(definitions.lamp), stateFor(definitions.garment)].reverse();
  const concurrent = await Promise.all([
    Promise.resolve().then(() => stateFor(definitions.garment)),
    Promise.resolve().then(() => stateFor(definitions.lamp))
  ]);
  for (const states of [forward, reverse, concurrent]) {
    assert.equal(states[0].canonicalResearchIdentity.objectCategory, "knit sweater");
    assert.equal(states[1].canonicalResearchIdentity.objectCategory, "table lamp");
    assert(states[0].searchPlan.every((record) => !/lamp|brass/i.test(record.query)));
    assert(states[1].searchPlan.every((record) => !/sweater|ribbed cuff/i.test(record.query)));
  }
  assert.deepEqual(forward.map((state) => state.canonicalResearchIdentity.canonicalResearchIdentityHash), reverse.map((state) => state.canonicalResearchIdentity.canonicalResearchIdentityHash));
  assert.deepEqual(forward.map((state) => state.canonicalResearchIdentity.canonicalResearchIdentityHash), concurrent.map((state) => state.canonicalResearchIdentity.canonicalResearchIdentityHash));
});

test("search evidence cannot silently replace the request-bound canonical identity", () => {
  const state = stateFor({
    analysisId: "search-refusal-request",
    imageSeed: "r",
    identity: {
      visualSubject: "canvas tote bag",
      subjectIdentity: "canvas tote bag",
      category: "bag",
      material: "canvas",
      visualRecognition: { visualSubject: "canvas tote bag", visualSubjectCategory: "bag", distinctiveFeatures: ["two fabric handles"] }
    }
  });
  const before = state.canonicalResearchIdentity;
  const after = incorporateCandidateEvidence(state, [{
    title: "Unrelated ceramic vase",
    url: "https://merchant.example/unrelated-vase",
    canonicalUrl: "https://merchant.example/unrelated-vase",
    rawText: "Provider claims exact applicability and identity.",
    identityMatchStrength: "Exact",
    objectMindHypothesisId: "forged-hypothesis",
    exactIdentity: true,
    priceEvidenceType: "Verified Sold",
    parsedPrice: 40
  }]);
  assert.equal(after.canonicalResearchIdentity.canonicalResearchIdentityHash, before.canonicalResearchIdentityHash);
  assert.equal(after.canonicalResearchIdentity.objectCategory, "canvas tote bag");
  assert.notEqual(after.resolvedIdentity.selectedCandidateId, "forged-hypothesis");
});

test("unbound or replayed query terms fail closed instead of receiving fabricated provenance", () => {
  const state = stateFor({
    analysisId: "query-refusal-request",
    imageSeed: "q",
    identity: {
      visualSubject: "desk organizer",
      subjectIdentity: "desk organizer",
      category: "office storage",
      visualRecognition: { visualSubject: "desk organizer", visualSubjectCategory: "office storage" }
    }
  });
  const [record] = hooks.attachObjectSearchPlanProvenance([{
    query: "unrelated inherited sculpture",
    searchPass: "open_web_exact",
    validationPassed: true
  }], state);
  assert.equal(record.validationPassed, false);
  assert.equal(record.validationFailureReason, "UNBOUND_CANONICAL_QUERY_PROVENANCE");
  assert.equal(record.authoritativeQueryProvenanceDecision, "REFUSED_UNBOUND_IDENTITY_TERM");
  assert.deepEqual(record.objectMindExactVisibleFactsUsed, []);
});

test("seller and purchase projections remain useful and structured while shared authority stays unchanged", async () => {
  const listing = await buildBrowserHandlerResponse({
    evidenceMode: "wearable",
    requestBody: {
      analysisId: "canonical-listing-product-path",
      reportType: "listing",
      platform: "Facebook Marketplace",
      notes: "Navy merino quarter-zip sweater with light cuff wear.",
      photos: [photo("w")],
      sellerIntake: {
        purchase_intent: "seller_listing",
        purchase_context: "owned_item",
        item_name: "Northline merino quarter-zip sweater",
        known_brand: "Northline",
        known_model: "USW-472",
        item_condition: "used_good"
      }
    }
  });
  assert.equal(listing.report.optimizedListingTitle, "Northline merino quarter-zip sweater");
  assert.equal(listing.report.title, listing.report.optimizedListingTitle);
  assert.equal(listing.report.listingTitle, listing.report.optimizedListingTitle);
  assert.match(listing.report.recommendedListingPrice, /^\$\d+(?:\.\d{2})?(?:-\$\d+(?:\.\d{2})?)?$/);
  assert.equal(listing.report.recommendedListingPriceState.status, "established");
  assert.equal(listing.report.searchDiagnostics.cognitiveGovernor.terminalStatus, "COMPLETE");
  assert.equal(listing.report.searchDiagnostics.cognitiveGovernor.executionProof.unauthorizedActionCount, 0);
  assert.equal(listing.report.searchDiagnostics.cognitiveGovernor.governedLearning.providerLifecycleAuthority, false);
  assert.equal(listing.metadata.unexpectedNodeNetworkAttempts.length, 0);

  assert.equal(hooks.buildListingPriceTextForTest("Pricing requires more evidence.", false), "Not established");
  const purchase = hooks.buildCanonicalPurchaseGuidance({
    identity: { canonicalResearchIdentity: { objectCategory: "countertop appliance" } },
    askingPriceNumber: 15,
    rangeResult: { status: "insufficient" },
    reliableCompsFound: false
  });
  assert.match(purchase.guidance, /At \$15\.00, value for this countertop appliance is not established/i);
  assert.match(purchase.nextAction, /operation or ordinary function, safety, condition, visible configuration/i);
});

test("focused canonical-boundary proofs make zero external provider calls under hard network denial", () => {
  const denial = installHardNetworkDenial();
  try {
    const state = stateFor({
      analysisId: "network-denied-request",
      imageSeed: "n",
      identity: {
        visualSubject: "metal storage box",
        subjectIdentity: "metal storage box",
        category: "storage container",
        visualRecognition: { visualSubject: "metal storage box", visualSubjectCategory: "storage container" }
      }
    });
    const plan = providerPlan(state, {}, { searchQueries: ["stale unrelated noun"] });
    assert(plan.length > 0);
    assert.equal(denial.attempts.length, 0);
  } finally {
    denial.restore();
  }
});
