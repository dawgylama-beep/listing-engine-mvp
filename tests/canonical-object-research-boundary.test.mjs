import assert from "node:assert/strict";
import test from "node:test";

import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import {
  createInitialObjectSearchPlan,
  createObjectMindState,
  createPurposeNeutralObjectInput,
  incorporateCandidateEvidence,
  projectCanonicalEvidenceIdentity,
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

test("raw visual claims must pass the evidence projection before they can become research identity", () => {
  const projected = projectCanonicalEvidenceIdentity({
    brand: "Speculative Brand",
    model: "ZX-9",
    material: "cashmere",
    packageQuantity: "four-slot",
    construction: "four independent slots",
    exactProductIdentity: "Speculative Brand ZX-9 cashmere toaster",
    exactProductConfidence: "High",
    subjectIdentity: "four-slot toaster",
    category: "four-slot toaster",
    visibleText: [],
    visualRecognition: {
      visualSubject: "four-slot toaster",
      visualSubjectCategory: "countertop appliance",
      visibleWords: [],
      visibleLetters: [],
      visibleLogos: [],
      visualEvidence: ["A countertop appliance is visible."],
      distinctiveFeatures: []
    }
  });
  assert.equal(projected.brand, "Unknown");
  assert.equal(projected.model, "Unknown");
  assert.equal(projected.material, "Unknown");
  assert.equal(projected.packageQuantity, "Unknown");
  assert.equal(projected.construction, "Unknown");
  assert.equal(projected.exactProductIdentity, "Unknown");
  assert.match(projected.subjectIdentity, /toaster/i);
  assert(projected.canonicalEvidenceProjection.rejectedClaims.length >= 6);

  const labelSupported = projectCanonicalEvidenceIdentity({
    brand: "Visible Brand",
    model: "VB-10",
    material: "100% cotton",
    exactProductIdentity: "Visible Brand VB-10 sweater",
    visibleText: ["Visible Brand", "VB-10", "100% cotton"],
    subjectIdentity: "sweater",
    visualRecognition: {
      visualSubject: "sweater",
      visibleWords: ["Visible Brand", "VB-10", "100% cotton"],
      visibleLetters: [],
      visibleLogos: [],
      visualEvidence: ["A sweater is visible."]
    }
  });
  assert.equal(labelSupported.brand, "Visible Brand");
  assert.equal(labelSupported.model, "VB-10");
  assert.equal(labelSupported.material, "100% cotton");
  assert(labelSupported.canonicalEvidenceProjection.directlySupportedFields.includes("material"));
});

test("uncertain or unreadable label guesses never become canonical identity or query terms", () => {
  const projected = projectCanonicalEvidenceIdentity({
    recognizedBrand: "Possibly West End Watch Co.; dial text is not fully certain",
    exactProductIdentity: "Possibly a West End Watch Co. pendulum wall clock",
    visibleText: [
      "Dial text appears to read WEST END-WATCH CO.",
      "Not applicable; no box visible"
    ],
    textIdentityEvidence: ["The neck label cannot be transcribed reliably"],
    visualSubject: "octagonal pendulum wall clock",
    visualSubjectCategory: "Clock / wall-mounted pendulum clock",
    diagnosticVisualDetails: ["Round clock dial", "Visible lower pendulum"],
    identityHypotheses: [{
      exactCandidateLabel: "Branded vintage wall pendulum/regulator clock",
      broaderFamilyIdentity: "pendulum clock",
      brandOrMaker: "Possibly West End Watch Co.",
      unresolvedDiscriminators: ["Readable maker mark"],
      supportingObservations: ["Round clock dial", "Visible lower pendulum"],
      confidenceBand: "LOW"
    }],
    visualRecognition: {
      visualSubject: "octagonal pendulum wall clock",
      visualSubjectCategory: "Clock / wall-mounted pendulum clock",
      recognizedBrand: "Possibly West End Watch Co.",
      visibleWords: ["Wording is uncertain"],
      visualEvidence: ["A round dial and pendulum compartment are visible."]
    }
  });
  assert.equal(projected.recognizedBrand, "Unknown");
  assert.equal(projected.exactProductIdentity, "Unknown");
  assert.deepEqual(projected.visibleText, []);
  assert.deepEqual(projected.visualRecognition.visibleWords, []);
  const state = stateFor({ analysisId: "uncertain-label", identity: projected, imageSeed: "l" });
  assert.equal(state.canonicalResearchIdentity.objectCategory, "wall-mounted pendulum clock");
  assert(state.searchPlan.every((record) => !/west end|not applicable|no box|uncertain/i.test(record.query)));
});

test("descriptive visual subjects compact to the compatible product category for research", () => {
  const cases = [
    ["A basic crewneck knit sweater, shown laid flat with two long sleeves.", "Apparel / sweater", "sweater"],
    ["Apparel; sweater or knit pullover", "Apparel; sweater or knit pullover", "sweater or knit pullover"],
    ["A countertop pop-up toaster with multiple bread slots.", "Small kitchen appliance / toaster", "toaster"],
    ["A large octagonal wall clock with a pendulum compartment.", "Clock / wall-mounted pendulum clock", "wall-mounted pendulum clock"]
  ];
  for (const [visualSubject, visualSubjectCategory, expectedCategory] of cases) {
    const identity = {
      visualSubject,
      subjectIdentity: visualSubject,
      visualSubjectCategory,
      category: visualSubjectCategory,
      diagnosticVisualDetails: ["Visible product form"],
      visualRecognition: {
        visualSubject,
        visualSubjectCategory,
        distinctiveFeatures: ["Visible product form"]
      }
    };
    const state = stateFor({ analysisId: `compact-${expectedCategory}`, identity, imageSeed: expectedCategory });
    assert.equal(state.canonicalResearchIdentity.objectCategory, expectedCategory);
    assert(state.searchPlan.every((record) => record.query.length <= 220));
  }
});

test("explicit age and configuration unknowns override weaker visual hypotheses before research", () => {
  const projected = projectCanonicalEvidenceIdentity({
    visualSubject: "A vintage four-slot electric toaster",
    visualSubjectCategory: "Small kitchen appliance / toaster",
    subjectIdentity: "vintage four-slot toaster",
    likelyItemDescription: "Vintage four-slot electric toaster",
    diagnosticVisualDetails: ["Several parallel top openings are visible"],
    identityUnknowns: ["Exact slot count is unresolved", "Date or era is unknown"],
    additionalEvidenceNeeded: ["Clear top-down photo to confirm the slot count"],
    identityHypotheses: [{
      exactCandidateLabel: "Four-slot electric toaster",
      broaderFamilyIdentity: "multi-slot toaster",
      supportingObservations: ["Several parallel top openings are visible"],
      confidenceBand: "LOW"
    }],
    visualRecognition: {
      visualSubject: "A vintage four-slot electric toaster",
      visualSubjectCategory: "Small kitchen appliance / toaster",
      distinctiveFeatures: ["Several parallel top openings are visible"]
    }
  });
  assert.doesNotMatch(projected.visualSubject, /vintage/i);
  assert.doesNotMatch(projected.subjectIdentity, /vintage/i);
  const state = stateFor({ analysisId: "unknown-slot-count", identity: projected, imageSeed: "u" });
  assert.equal(state.canonicalResearchIdentity.objectCategory, "toaster");
  assert(state.searchPlan.every((record) => !/four[- ]slot/i.test(record.query)));
});

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
  assert(listing.report.resultsFound.length > 0);
  for (const comparable of listing.report.resultsFound) {
    for (const field of ["source", "currency", "marketStatus", "matchLevel", "materialDifferences", "evidentiaryConfidence"]) {
      assert.equal(Object.hasOwn(comparable, field), true, `${field} missing from retained comparable`);
    }
    assert.match(comparable.matchLevel, /Exact comparable|Close comparable|Category comparable/);
    assert.match(comparable.marketStatus, /sold\/completed|active asking|current retail|category\/reference/);
  }
  const datedComparable = hooks.serperRecordToVisibleResearchRecord({
    title: "Visible Brand VB-10 sweater",
    domain: "market.example",
    url: "https://market.example/vb-10",
    displayedPriceText: "$32.00",
    parsedPrice: 32,
    currency: "$",
    date: "2026-08-20",
    priceEvidenceType: "Verified Sold",
    activeSoldReferenceStatus: "Sold for $32.00 in a completed sale.",
    rawText: "Visible Brand VB-10 sweater sold for $32.00 in a completed sale.",
    identityMatchStrength: "Exact",
    sourceBacked: "URL-cited",
    itemIdentityDifferences: "Condition differs."
  });
  assert.equal(datedComparable.currency, "USD");
  assert.equal(datedComparable.observationDate, "2026-08-20");
  assert.equal(datedComparable.marketStatus, "sold/completed evidence");
  assert.equal(datedComparable.matchLevel, "Exact comparable");
  assert.equal(datedComparable.materialDifferences, "Condition differs.");
  assert.equal(datedComparable.evidentiaryConfidence, "High");
  assert.match(listing.report.recommendedListingPrice, /^\$\d+(?:\.\d{2})?(?:-\$\d+(?:\.\d{2})?)?$/);
  assert.equal(listing.report.pricingEvidenceState, "insufficient");
  assert.equal(listing.report.recommendedListingPriceState.status, "preliminary");
  assert.equal(listing.report.pricingState, "preliminary");
  assert.notEqual(listing.report.recommendedListingPriceState.status, "established");
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
