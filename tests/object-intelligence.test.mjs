import assert from "node:assert/strict";
import test from "node:test";
import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import { computeCheckDigit } from "../lib/evidence/identity.js";
import { createFinalEvidenceResult, validateFinalEvidenceResult } from "../lib/evidence/index.js";
import {
  MAX_EXPERIENCE_RECORD_BYTES,
  OBJECT_EVIDENCE_CLASSIFICATION,
  applyObjectEvidenceVerification,
  buildExperienceRecord,
  createEvidenceInformedRefinement,
  createInitialObjectSearchPlan,
  createObjectMindState,
  createPurposeNeutralObjectInput,
  experienceRecordByteLength,
  incorporateCandidateEvidence,
  verifyObjectEvidenceCandidate,
  withObjectSearchPlan
} from "../lib/object-intelligence/index.js";

const photo = Object.freeze({
  name: "synthetic-object.png",
  dataUrl: "data:image/png;base64,iVBORw0KGgo="
});

function validUpc(body = "73123456789") {
  return `${body}${computeCheckDigit(body)}`;
}

function stateFor(identity, buyerIntake = {}, notes = identity.exactProductIdentity || identity.subjectIdentity || "Synthetic object") {
  const neutralInput = createPurposeNeutralObjectInput({ notes, buyerIntake });
  const state = createObjectMindState({
    analysisId: "synthetic-analysis",
    photos: [photo],
    neutralInput,
    extractedIdentity: identity
  });
  return withObjectSearchPlan(state, createInitialObjectSearchPlan(state));
}

function source({ title, url, snippet = "", query = "", owningHypothesisId = "", price = "$12.00" } = {}) {
  return {
    title,
    url,
    canonicalUrl: url,
    destinationUrl: url,
    snippet,
    rawText: `${title} ${snippet}`,
    displayedPriceText: price,
    parsedPrice: Number(price.replace(/[^0-9.]/g, "")),
    priceEvidenceType: "Active Asking",
    sourceType: "organic",
    pageType: "product_or_listing",
    itemTypeCompatible: true,
    identityMatchStrength: "Exact",
    query,
    objectMindHypothesisId: owningHypothesisId
  };
}

test("packaged retail exact identifier accepts the exact count and rejects a wrong-count distractor", () => {
  const upc = validUpc();
  const state = stateFor({
    brand: "Northstar Supply",
    model: "NSM-480",
    upcBarcode: upc,
    productNameOrBoxTitle: "Northstar Shield Mailers",
    exactProductIdentity: "Northstar Shield Mailers 48 Count",
    exactProductConfidence: "High",
    subjectIdentity: "Security mailers",
    packageQuantity: "48 count",
    visibleText: ["Northstar Shield", "48 count", upc],
    visualRecognition: { visualSubject: "Box of security mailers", visibleWords: ["Northstar Shield", "48 count"] }
  });
  const owner = state.resolvedIdentity.selectedCandidateId;
  const exact = verifyObjectEvidenceCandidate(state, source({
    title: `Northstar Shield Mailers 48 Count ${upc}`,
    url: `https://www.amazon.com/product/${upc}`,
    owningHypothesisId: owner
  }));
  const distractor = verifyObjectEvidenceCandidate(state, source({
    title: "Northstar Shield Mailers 24 Count",
    url: "https://www.amazon.com/product/northstar-24",
    owningHypothesisId: owner
  }));
  assert.equal(exact.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
  assert.equal(exact.verificationState, "VERIFIED");
  assert.equal(distractor.verificationState, "REJECTED");
  assert.match(distractor.rejectionReason, /Package count differs/i);
});

test("tool maker and model verification rejects a similar family model", () => {
  const state = stateFor({
    brand: "Aurelia Tools",
    model: "ATX-310",
    productNameOrBoxTitle: "Aurelia ATX-310 Rotary Driver",
    exactProductIdentity: "Aurelia ATX-310 Rotary Driver",
    exactProductConfidence: "High",
    subjectIdentity: "Cordless rotary driver",
    visibleText: ["Aurelia", "ATX-310"],
    visualRecognition: { visualSubject: "Cordless rotary driver", visibleWords: ["Aurelia", "ATX-310"] }
  });
  const exact = verifyObjectEvidenceCandidate(state, source({
    title: "Aurelia Tools ATX-310 Rotary Driver",
    url: "https://www.amazon.com/product/aurelia-atx-310"
  }));
  const family = verifyObjectEvidenceCandidate(state, source({
    title: "Aurelia Tools ATX-320 Rotary Driver",
    url: "https://www.amazon.com/product/aurelia-atx-320"
  }));
  assert.equal(exact.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
  assert.equal(family.verificationState, "REJECTED");
  assert.match(family.rejectionReason, /different family model/i);
});

test("established enriched compatibility remains non-exact and raw similarity cannot claim compatibility", () => {
  const state = stateFor({
    brand: "Northstar Home",
    productNameOrBoxTitle: "Northstar Home Surface Cleaner 12 Count",
    exactProductIdentity: "Northstar Home Surface Cleaner 12 Count",
    exactProductConfidence: "High",
    subjectIdentity: "Packaged household surface cleaner",
    packageQuantity: "12 count",
    visibleText: ["Northstar Home", "Surface Cleaner", "12 count"],
    visualRecognition: { visualSubject: "Packaged household surface cleaner", visibleWords: ["Northstar Home", "12 count"] }
  });
  const raw = source({
    title: "Harbor House Surface Cleaner 12 Count",
    url: "https://merchant.example/product/harbor-house-cleaner"
  });
  const enriched = verifyObjectEvidenceCandidate(state, {
    ...raw,
    identityMatchStrength: "Strong Similar",
    candidateObjectClassification: "same_object_compatible_alternative",
    productFamilyCompatibilityOutcome: "compatible",
    retailPriceDecisionEligibility: true,
    transactionalRetailerEvidence: true,
    contradictoryEvidence: []
  });
  const unqualifiedRaw = verifyObjectEvidenceCandidate(state, raw);
  assert.equal(enriched.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.COMPATIBLE_ALTERNATIVE);
  assert.equal(enriched.verificationState, "COMPATIBLE");
  assert.notEqual(enriched.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
  assert.equal(unqualifiedRaw.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.SIMILAR_OBJECT);
  assert.equal(unqualifiedRaw.verificationState, "REJECTED");
});

test("an exact-target query echo and generic brand or category support cannot establish exactness", () => {
  const state = stateFor({
    brand: "Cinder Atelier",
    exactProductIdentity: "Cinder Atelier Meridian Desk Vessel",
    exactProductConfidence: "Medium",
    subjectIdentity: "Decorative desk vessel",
    visibleText: ["Cinder Atelier"],
    identityUnknowns: ["base mark", "dimensions"],
    visualRecognition: { visualSubject: "Decorative desk vessel", visibleWords: ["Cinder Atelier"] }
  });
  const query = "Cinder Atelier Meridian Desk Vessel";
  const echo = verifyObjectEvidenceCandidate(state, source({
    title: query,
    query,
    url: "https://merchant.example/product/meridian-vessel"
  }));
  const generic = verifyObjectEvidenceCandidate(state, source({
    title: "Cinder Atelier decorative vessel in blue ceramic",
    query,
    url: "https://merchant.example/product/generic-vessel"
  }));
  assert.equal(echo.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.INSUFFICIENT_EVIDENCE);
  assert.equal(echo.verificationState, "UNRESOLVED");
  assert.equal(echo.directPageEligible, true);
  assert.notEqual(generic.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
});

test("multiple independent non-generic source discriminators can establish exactness without an object-specific rule", () => {
  const state = stateFor({
    brand: "Quill and Fen",
    exactProductIdentity: "Quill and Fen Solstice Folio",
    exactProductConfidence: "Medium",
    subjectIdentity: "Bound presentation folio",
    packageQuantity: "3 count",
    dimensions: "11 x 17",
    shape: "stepped crescent clasp",
    visibleText: ["Quill and Fen", "Solstice Press Mark"],
    diagnosticVisualDetails: ["stepped crescent clasp"],
    identityUnknowns: ["catalog number not visible"],
    visualRecognition: {
      visualSubject: "Bound presentation folio",
      visibleWords: ["Quill and Fen", "Solstice Press Mark"],
      distinctiveFeatures: ["stepped crescent clasp"]
    }
  });
  const candidate = verifyObjectEvidenceCandidate(state, source({
    title: "Quill and Fen Solstice Folio 3 count 11 x 17",
    snippet: "Solstice Press Mark with stepped crescent clasp",
    url: "https://merchant.example/product/solstice-folio"
  }));
  assert.equal(candidate.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
  assert.equal(candidate.verificationState, "VERIFIED");
  assert(candidate.supportReasons.some((reason) => /dimensions/i.test(reason)));
  assert(candidate.supportReasons.some((reason) => /package count/i.test(reason)));
});

test("vintage design family stays exact-design with its edition unresolved", () => {
  const state = stateFor({
    subjectIdentity: "Art-deco sailboat serving plaque",
    subjectConfidence: "High",
    exactProductIdentity: "Unknown",
    exactProductConfidence: "Low",
    material: "brass",
    color: "navy blue",
    visibleText: ["Harbor Lights", "No. 7"],
    diagnosticVisualDetails: ["raised sailboat", "rope border"],
    identityUnknowns: ["Edition and workshop mark remain unreadable"],
    visualRecognition: {
      visualSubject: "Art-deco sailboat serving plaque",
      visibleWords: ["Harbor Lights", "No. 7"],
      distinctiveFeatures: ["raised sailboat", "rope border"]
    }
  });
  const candidate = verifyObjectEvidenceCandidate(state, source({
    title: "Art-deco sailboat serving plaque Harbor Lights No. 7 raised sailboat rope border",
    url: "https://www.ebay.com/itm/700000000001"
  }));
  assert.equal(candidate.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_DESIGN_VARIATION_UNRESOLVED);
  assert.equal(candidate.verificationState, "UNRESOLVED_VARIATION");
  assert.match(candidate.rejectionReason, /edition, package, or variation remains unresolved/i);
});

test("ambiguous unmarked object keeps several hypotheses and does not create a false exact", () => {
  const state = stateFor({
    subjectIdentity: "Small hand-shaped workshop implement",
    subjectConfidence: "Medium",
    exactProductIdentity: "Unknown",
    exactProductConfidence: "Low",
    material: "dark hardwood and steel",
    identityHypotheses: [
      {
        exactCandidateLabel: "",
        broaderFamilyIdentity: "Leather edge creaser",
        supportingObservations: ["curved steel edge"],
        contradictingObservations: [],
        unresolvedDiscriminators: ["working-edge profile"],
        distinguishingQueryOrObservation: ["close photograph of the working edge"],
        exactnessLevel: "BROADER_FAMILY",
        confidenceBand: "LOW"
      },
      {
        exactCandidateLabel: "",
        broaderFamilyIdentity: "Bookbinding folding tool",
        supportingObservations: ["hand-shaped hardwood body"],
        contradictingObservations: [],
        unresolvedDiscriminators: ["maker stamp"],
        distinguishingQueryOrObservation: ["raking-light photograph of the handle"],
        exactnessLevel: "BROADER_FAMILY",
        confidenceBand: "LOW"
      }
    ],
    visualRecognition: {
      visualSubject: "Small hand-shaped workshop implement",
      possibleInterpretations: ["Leather edge creaser", "Bookbinding folding tool"]
    }
  });
  assert(state.identityHypotheses.length >= 2);
  assert.notEqual(state.resolvedIdentity.exactnessClassification, "EXACT_ITEM");
  assert(state.resolvedIdentity.additionalEvidenceNeeded.length > 0);
  const unrelated = verifyObjectEvidenceCandidate(state, source({
    title: "Modern stainless kitchen spatula",
    url: "https://www.amazon.com/product/kitchen-spatula"
  }));
  assert.notEqual(unrelated.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
});

test("damage and incompleteness remain observations rather than identity or search terms", () => {
  const state = stateFor({
    brand: "Cobalt Audio",
    model: "CA-17",
    exactProductIdentity: "Cobalt Audio CA-17 Field Recorder",
    exactProductConfidence: "High",
    subjectIdentity: "Portable field recorder",
    condition: "Cracked battery door",
    completeness: "Microphone cover missing",
    missingComponentStatus: "Microphone cover missing",
    visibleText: ["Cobalt Audio", "CA-17"],
    visualRecognition: { visualSubject: "Portable field recorder", visibleWords: ["Cobalt Audio", "CA-17"] }
  });
  assert(state.observedFacts.some((fact) => fact.factType === "condition" && /cracked/i.test(fact.value)));
  assert(state.observedFacts.some((fact) => fact.factType === "completeness" && /missing/i.test(fact.value)));
  assert.match(state.resolvedIdentity.bestSupportedCustomerIdentity, /Cobalt Audio CA-17/i);
  assert.equal(state.searchPlan.some((record) => /cracked|missing/i.test(record.query)), false);
});

test("purpose changes do not change the frozen identity-state hash", () => {
  const identity = {
    brand: "Verdant Optics",
    model: "VO-42",
    exactProductIdentity: "Verdant Optics VO-42 Monocular",
    exactProductConfidence: "High",
    subjectIdentity: "Compact monocular",
    visibleText: ["Verdant Optics", "VO-42"],
    visualRecognition: { visualSubject: "Compact monocular", visibleWords: ["Verdant Optics", "VO-42"] }
  };
  const purposes = ["personal_use", "resale", "owner_value", "seller_listing"];
  const states = purposes.map((purchaseIntent) => stateFor(identity, {
    purchase_intent: purchaseIntent,
    item_name: identity.exactProductIdentity,
    item_condition: "used"
  }, "Verdant Optics VO-42 monocular"));
  assert.equal(new Set(states.map((state) => state.identityStateHash)).size, 1);
  assert.equal(new Set(states.map((state) => state.requestIdentity.purpose)).size, 4);
});

test("evidence can weaken the initial candidate, promote a verified alternate, and avoid unnecessary refinement", () => {
  const state = stateFor({
    brand: "Orion Instruments",
    model: "MX-10",
    exactProductIdentity: "Orion Instruments MX-10 Meter",
    exactProductConfidence: "High",
    subjectIdentity: "Handheld measurement meter",
    visibleText: ["Orion Instruments"],
    identityHypotheses: [
      {
        exactCandidateLabel: "Orion Instruments MX-10 Meter",
        broaderFamilyIdentity: "Orion handheld meter",
        brandOrMaker: "Orion Instruments",
        model: "MX-10",
        supportingObservations: ["Orion Instruments"],
        contradictingObservations: [],
        unresolvedDiscriminators: ["last model digit"],
        distinguishingQueryOrObservation: ["model label close-up"],
        exactnessLevel: "EXACT_CANDIDATE",
        confidenceBand: "MEDIUM"
      },
      {
        exactCandidateLabel: "Orion Instruments MX-12 Meter",
        broaderFamilyIdentity: "Orion handheld meter",
        brandOrMaker: "Orion Instruments",
        model: "MX-12",
        supportingObservations: ["Orion Instruments"],
        contradictingObservations: [],
        unresolvedDiscriminators: ["last model digit"],
        distinguishingQueryOrObservation: ["model label close-up"],
        exactnessLevel: "EXACT_CANDIDATE",
        confidenceBand: "MEDIUM"
      }
    ],
    visualRecognition: { visualSubject: "Handheld measurement meter", visibleWords: ["Orion Instruments"] }
  });
  const [initial, alternate] = state.identityHypotheses;
  const records = [
    source({
      title: "Orion Instruments MX-99 Meter",
      url: "https://www.amazon.com/product/orion-mx-99",
      owningHypothesisId: initial.candidateId
    }),
    source({
      title: "Orion Instruments MX-12 Meter",
      url: "https://www.amazon.com/product/orion-mx-12",
      owningHypothesisId: alternate.candidateId
    })
  ];
  const refinement = createEvidenceInformedRefinement(state, records, { attemptedQueries: [] });
  assert.equal(refinement.state.resolvedIdentity.selectedCandidateId, alternate.candidateId);
  assert.equal(refinement.state.refinementCount, 0);
  assert(refinement.state.resolutionHistory.some((entry) => entry.event === "ALTERNATE_HYPOTHESIS_PROMOTED"));
  const second = createEvidenceInformedRefinement(refinement.state, records, { attemptedQueries: [] });
  assert.deepEqual(second.searchPlan, []);
  assert.equal(second.state.refinementCount, 0);
});

test("no verified exact evidence triggers one materially new provenance-backed refinement and never a second", () => {
  const state = stateFor({
    sku: "AW-47",
    exactProductIdentity: "Arbor Calibration Wheel",
    exactProductConfidence: "Medium",
    subjectIdentity: "Handheld calibration wheel",
    diagnosticVisualDetails: ["radial brass spokes"],
    identityUnknowns: ["catalog code"],
    visualRecognition: {
      visualSubject: "Handheld calibration wheel",
      distinctiveFeatures: ["radial brass spokes"]
    }
  });
  const attemptedQueries = state.searchPlan.map((record) => record.query);
  const first = createEvidenceInformedRefinement(state, [source({
    title: "Generic plastic measuring wheel",
    url: "https://merchant.example/product/plastic-wheel"
  })], { attemptedQueries, maximumQueries: 4 });
  assert.equal(first.state.refinementCount, 1);
  assert(first.searchPlan.length >= 1 && first.searchPlan.length <= 4);
  assert(first.searchPlan.every((record) => record.discriminatorTested));
  assert(first.searchPlan.every((record) => !attemptedQueries.some((query) => query.toLowerCase() === record.query.toLowerCase())));
  assert(first.searchPlan.every((record) => record.exactVisibleFactsUsed.length > 0));
  assert.match(first.state.resolutionHistory.at(-1).reason, /no verified exact evidence/i);
  const second = createEvidenceInformedRefinement(first.state, [], { attemptedQueries, maximumQueries: 4 });
  assert.equal(second.state.refinementCount, 1);
  assert.deepEqual(second.searchPlan, []);
});

test("the OpenAI provider lane shares refinement capacity and gives every sent query bounded Experience Record ownership", async () => {
  const identity = {
    sku: "AW-47",
    exactProductIdentity: "Arbor Calibration Wheel",
    exactProductConfidence: "Medium",
    subjectIdentity: "Handheld calibration wheel",
    diagnosticVisualDetails: ["radial brass spokes"],
    identityUnknowns: ["catalog code"],
    visualRecognition: {
      visualSubject: "Handheld calibration wheel",
      distinctiveFeatures: ["radial brass spokes"]
    }
  };
  const state = stateFor(identity);
  let callCount = 0;
  const requestAdapter = async () => {
    callCount += 1;
    const json = {
      comparableItemsFound: [],
      resultsFound: [],
      strongComparables: [],
      partialComparables: [],
      itemIdentificationEvidence: [],
      referenceResults: [],
      weakMatches: [],
      rejectedMatches: [],
      searchEvidenceSummary: "Synthetic bounded no-match response."
    };
    const sourceRecord = {
      title: `Unrelated plastic hanger ${callCount}`,
      url: `https://example.org/item-${callCount}`,
      snippet: "No matching object identity facts."
    };
    return {
      json,
      data: {
        output: [{
          type: "web_search_call",
          action: { query: `synthetic-${callCount}`, sources: [sourceRecord] }
        }, {
          type: "message",
          content: [{ type: "output_text", text: JSON.stringify(json), annotations: [] }]
        }]
      },
      statusCode: 200,
      elapsedMs: 1
    };
  };
  const liveSearch = await hooks.executeOpenAIWebComparableSearch({
    apiKey: "synthetic-placeholder",
    model: "synthetic-model",
    platform: "",
    notes: identity.exactProductIdentity,
    identity,
    sourceRoute: [],
    searchQueries: state.searchPlan.map((record) => record.query),
    buyerIntake: hooks.normalizeBuyerIntake({ purchase_intent: "personal_use", purchase_context: "private_seller" }),
    objectMindState: state,
    requestAdapter,
    directPageRequestAdapter: async () => {
      throw new Error("No direct-page request was expected for unrelated sources.");
    }
  });
  const sent = liveSearch.providerRequestRecords.filter((record) => Number(record.physicalAttemptCount || 0) > 0);
  const refinementRequests = sent.filter((record) => record.objectMindPhase === "REFINEMENT");
  assert(liveSearch.objectMindState, JSON.stringify({
    status: liveSearch.liveSearchStatus,
    errors: liveSearch.providerRequestRecords.map((record) => ({ errorCode: record.errorCode, failureStage: record.failureStage })),
    responses: liveSearch.providerResponseSummaries
  }));
  assert.equal(liveSearch.objectMindState.refinementCount, 1);
  assert(refinementRequests.length >= 1 && refinementRequests.length <= 4);
  assert(sent.length <= 12);
  assert(sent.every((record) => record.objectMindQueryId && record.objectMindHypothesisId));
  assert(refinementRequests.every((record) => record.objectMindDiscriminatorTested && record.objectMindExactVisibleFactsUsed.length));
  const rejected = liveSearch.providerSourceRecords.filter((record) => record.objectMindVerificationState === "REJECTED");
  const experience = buildExperienceRecord({
    state: liveSearch.objectMindState,
    providerRequests: liveSearch.providerRequestRecords,
    sourcesFound: liveSearch.providerSourceRecords,
    acceptedSources: [],
    rejectedSources: rejected
  });
  assert.equal(experience.queryOwnership.length, sent.length);
  assert(experience.queryOwnership.every((record) => record.queryId && record.normalizedQuery && record.disposition));
  assert(experience.queryOwnership.some((record) => record.phase === "REFINEMENT" && record.discriminatorTested));

  const exhaustedBudget = hooks.createPhysicalAttemptBudget(2, "provider_search");
  const capacityBound = await hooks.executeOpenAIWebComparableSearch({
    apiKey: "synthetic-placeholder",
    model: "synthetic-model",
    platform: "",
    notes: identity.exactProductIdentity,
    identity,
    sourceRoute: [],
    searchQueries: state.searchPlan.map((record) => record.query),
    buyerIntake: hooks.normalizeBuyerIntake({ purchase_intent: "personal_use", purchase_context: "private_seller" }),
    objectMindState: state,
    providerAttemptBudget: exhaustedBudget,
    requestAdapter,
    directPageRequestAdapter: async () => {
      throw new Error("No direct-page request was expected for unrelated sources.");
    }
  });
  assert.equal(exhaustedBudget.physicalAttemptCount, 2);
  assert.equal(capacityBound.objectMindState.refinementCount, 0);
  assert.equal(capacityBound.providerRequestRecords.filter((record) => record.objectMindPhase === "REFINEMENT" && record.attempted).length, 0);
});

test("direct-page verification admits qualified candidates only, remains capped at two, and can reject after page evidence", async () => {
  const identity = {
    brand: "Juniper Devices",
    model: "JD-80",
    exactProductIdentity: "Juniper Devices JD-80 Sensor",
    exactProductConfidence: "High",
    subjectIdentity: "Handheld environmental sensor",
    visibleText: ["Juniper Devices", "JD-80"],
    visualRecognition: { visualSubject: "Handheld environmental sensor", visibleWords: ["Juniper Devices", "JD-80"] }
  };
  const state = stateFor(identity);
  const context = hooks.buildSearchQueryContext(identity, [], identity.exactProductIdentity, {
    purchase_intent: "personal_use",
    purchase_context: "online_retailer",
    item_name: identity.exactProductIdentity,
    known_model: "JD-80"
  });
  const candidates = hooks.normalizeSerperCandidateRecords([
    source({ title: "Juniper Devices JD-80 Sensor", url: "https://www.amazon.com/product/juniper-jd-80-a" }),
    source({ title: "Juniper Devices JD-80 Sensor", url: "https://www.amazon.com/product/juniper-jd-80-b" }),
    source({ title: "Unrelated kitchen storage bin", url: "https://www.amazon.com/product/storage-bin" })
  ], identity, context, state);
  const requests = [];
  const fetched = [];
  const verified = await hooks.executeExactRetailPageDirectEnrichment({
    context,
    identity,
    objectMindState: state,
    currentRecords: candidates,
    providerRequestRecords: requests,
    providerResponseSummaries: [],
    providerErrors: [],
    requestAdapter: async (url) => {
      fetched.push(url);
      const rejected = url.endsWith("-b");
      const sourceEvidenceText = rejected
        ? "Juniper Devices JD-90 Sensor, alternate family model."
        : "Juniper Devices JD-80 Sensor, exact model confirmed.";
      return { finalUrl: url, statusCode: 200, elapsedMs: 1, html: `<html>${sourceEvidenceText}</html>`, sourceEvidenceText };
    }
  });
  assert.equal(fetched.length, 2);
  assert.equal(requests.filter((record) => Number(record.physicalAttemptCount || 0) > 0).length, 2);
  assert.equal(fetched.some((url) => url.endsWith("storage-bin")), false);
  assert(verified.some((record) => record.objectMindDirectPageVerified && record.objectMindVerificationState === "VERIFIED"));
  assert(verified.some((record) => record.objectMindDirectPageVerified && record.objectMindVerificationState === "REJECTED"));
});

test("a plausible information-poor candidate can use a direct page, then re-enter enrichment and verification before canonical authority", async () => {
  const identity = {
    brand: "Morrow Foundry",
    exactProductIdentity: "Morrow Foundry Arc Clock",
    exactProductConfidence: "Medium",
    subjectIdentity: "Arched mantel clock",
    dimensions: "8 x 12",
    shape: "arched stepped bezel",
    visibleText: ["Morrow Foundry", "Series Seven Seal"],
    diagnosticVisualDetails: ["arched stepped bezel"],
    identityUnknowns: ["rear catalog mark"],
    visualRecognition: {
      visualSubject: "Arched mantel clock",
      visibleWords: ["Morrow Foundry", "Series Seven Seal"],
      distinctiveFeatures: ["arched stepped bezel"]
    }
  };
  const state = stateFor(identity);
  const context = hooks.buildSearchQueryContext(identity, [], identity.exactProductIdentity, {
    purchase_intent: "personal_use",
    purchase_context: "online_retailer",
    item_name: identity.exactProductIdentity,
    known_brand: identity.brand
  });
  const initial = hooks.normalizeSerperCandidateRecords([source({
    title: "Morrow Foundry Arc Clock",
    url: "https://www.amazon.com/product/morrow-arc-clock",
    owningHypothesisId: state.resolvedIdentity.selectedCandidateId,
    price: ""
  })], identity, context, state);
  assert.equal(initial[0].objectMindClassification, OBJECT_EVIDENCE_CLASSIFICATION.INSUFFICIENT_EVIDENCE);
  assert.equal(initial[0].objectMindVerificationState, "UNRESOLVED");
  assert.equal(initial[0].objectMindDirectPageEligible, true);
  const rawCanonical = createFinalEvidenceResult({
    analysisId: "synthetic-raw-direct-boundary",
    analysisMode: "retail",
    targetIdentity: { brand: identity.brand, productName: identity.exactProductIdentity },
    observations: initial,
    providerRequests: [],
    purpose: "personal"
  });
  assert.equal(rawCanonical.acceptedRecords.some((record) => record.objectMindClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM), false);
  const requests = [];
  const enriched = await hooks.executeExactRetailPageDirectEnrichment({
    context,
    identity,
    objectMindState: state,
    currentRecords: initial,
    providerRequestRecords: requests,
    providerResponseSummaries: [],
    providerErrors: [],
    requestAdapter: async (url) => ({
      finalUrl: url,
      statusCode: 200,
      elapsedMs: 1,
      html: "<html>Morrow Foundry Arc Clock Series Seven Seal 8 x 12 arched stepped bezel</html>",
      sourceEvidenceText: "Morrow Foundry Arc Clock Series Seven Seal 8 x 12 arched stepped bezel"
    })
  });
  assert.equal(requests.filter((record) => Number(record.physicalAttemptCount || 0) > 0).length, 1);
  assert.match(requests[0].objectMindQueryId, /^query-/);
  assert(requests[0].resultingCandidateIds.length > 0);
  assert.equal(enriched[0].objectMindDirectPageVerified, true);
  assert.equal(enriched[0].objectMindClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
  assert.equal(enriched[0].objectMindVerificationState, "VERIFIED");
  const final = createFinalEvidenceResult({
    analysisId: "synthetic-enriched-direct-boundary",
    analysisMode: "retail",
    targetIdentity: { brand: identity.brand, productName: identity.exactProductIdentity },
    observations: enriched,
    providerRequests: requests,
    purpose: "personal"
  });
  assert(final.acceptedRecords.every((record) => record.objectMindVerificationState !== "REJECTED"));
  assert([...final.acceptedRecords, ...final.rejectedRecords].some((record) => /morrow-arc-clock/i.test(record.canonicalUrl || record.url)));
});

test("exact, compatible, similar, unrelated, unresolved, and rejected evidence states remain distinguishable", () => {
  const upc = validUpc("76123456789");
  const state = stateFor({
    brand: "Heliotrope Lab",
    model: "HL-63",
    upcBarcode: upc,
    exactProductIdentity: "Heliotrope Lab HL-63 Prism Stand",
    exactProductConfidence: "High",
    subjectIdentity: "Optical prism stand",
    packageQuantity: "6 count",
    visibleText: ["Heliotrope Lab", "HL-63", upc],
    visualRecognition: { visualSubject: "Optical prism stand", visibleWords: ["Heliotrope Lab", "HL-63"] }
  });
  const exact = verifyObjectEvidenceCandidate(state, source({ title: `Heliotrope Lab HL-63 Prism Stand ${upc} 6 count`, url: "https://example.org/exact" }));
  const compatible = verifyObjectEvidenceCandidate(state, {
    ...source({ title: "Heliotrope Lab compatible prism stand", url: "https://example.org/compatible" }),
    candidateObjectClassification: "same_object_compatible_alternative",
    productFamilyCompatibilityOutcome: "compatible",
    retailPriceDecisionEligibility: true,
    transactionalRetailerEvidence: true,
    contradictoryEvidence: []
  });
  const unresolvedState = stateFor({
    brand: "Umber Studio",
    exactProductIdentity: "Umber Studio Meridian Form",
    exactProductConfidence: "Medium",
    subjectIdentity: "Decorative studio form",
    identityUnknowns: ["maker code"],
    visualRecognition: { visualSubject: "Decorative studio form" }
  });
  const unresolved = verifyObjectEvidenceCandidate(unresolvedState, source({ title: "Umber Studio Meridian Form", url: "https://example.org/unresolved" }));
  const similar = verifyObjectEvidenceCandidate(state, source({ title: "Blue metal optical stand", url: "https://example.org/similar" }));
  const unrelated = verifyObjectEvidenceCandidate(state, { ...source({ title: "Cotton kitchen towel", url: "https://example.org/unrelated" }), itemTypeCompatible: false });
  const rejected = verifyObjectEvidenceCandidate(state, source({ title: "Heliotrope Lab HL-63 Prism Stand 12 count", url: "https://example.org/rejected" }));
  assert.equal(exact.verificationState, "VERIFIED");
  assert.equal(compatible.verificationState, "COMPATIBLE");
  assert.equal(unresolved.verificationState, "UNRESOLVED");
  assert.equal(unresolved.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.INSUFFICIENT_EVIDENCE);
  assert.equal(similar.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.SIMILAR_OBJECT);
  assert.equal(unrelated.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.UNRELATED);
  assert.equal(rejected.verificationState, "REJECTED");
});

test("Experience Record is deterministic, bounded, secret-safe, and records accepted and rejected outcomes", () => {
  const state = stateFor({
    brand: "Lumen Works",
    model: "LW-22",
    exactProductIdentity: "Lumen Works LW-22 Inspection Lamp",
    exactProductConfidence: "High",
    subjectIdentity: "Rechargeable inspection lamp",
    visibleText: ["Lumen Works", "LW-22"],
    visualRecognition: { visualSubject: "Rechargeable inspection lamp", visibleWords: ["Lumen Works", "LW-22"] }
  });
  const records = applyObjectEvidenceVerification(state, [
    source({ title: "Lumen Works LW-22 Inspection Lamp", url: "https://www.amazon.com/product/lumen-lw-22" }),
    source({ title: "Generic desk lamp", url: "https://www.amazon.com/product/generic-desk-lamp" })
  ]);
  const evidenceState = incorporateCandidateEvidence(state, records);
  const providerRequests = [{
    query: "Lumen Works LW-22",
    objectMindQueryId: state.searchPlan[0]?.queryId,
    objectMindHypothesisId: state.resolvedIdentity.selectedCandidateId,
    objectMindQueryType: "EXACT_BRAND_MODEL",
    attempted: true,
    physicalAttemptCount: 1,
    succeeded: true,
    failureStage: "none",
    provider: "synthetic_provider",
    authorization: "Bearer should-never-appear",
    apiKey: "should-never-appear"
  }];
  const accepted = records.filter((record) => record.objectMindVerificationState === "VERIFIED");
  const rejected = records.filter((record) => record.objectMindVerificationState === "REJECTED");
  const first = buildExperienceRecord({ state: evidenceState, providerRequests, sourcesFound: records, acceptedSources: accepted, rejectedSources: rejected });
  const second = buildExperienceRecord({ state: evidenceState, providerRequests, sourcesFound: records, acceptedSources: accepted, rejectedSources: rejected });
  assert.deepEqual(first, second);
  assert.match(first.finalIdentityStateHash, /^[a-f0-9]{64}$/);
  assert.match(first.experienceRecordHash, /^[a-f0-9]{64}$/);
  assert(experienceRecordByteLength(first) <= MAX_EXPERIENCE_RECORD_BYTES);
  const rendered = JSON.stringify(first);
  assert.doesNotMatch(rendered, /Bearer|should-never-appear|authorization|apiKey|chain.of.thought|benchmark/i);
  assert(first.sourcesAccepted.length > 0);
  assert(first.sourcesRejected.length > 0);
});

test("Experience Record keeps every bounded sent-query owner under the record byte ceiling", () => {
  const state = stateFor({
    brand: "Verdant Instruments",
    exactProductIdentity: "Verdant Instruments Field Comparator",
    exactProductConfidence: "Medium",
    subjectIdentity: "Field comparator",
    identityUnknowns: ["maker code", "scale arrangement"],
    visibleText: ["Verdant Instruments", "graduated scale"],
    visualRecognition: { visualSubject: "Field comparator", visibleWords: ["Verdant Instruments", "graduated scale"] }
  });
  const providerRequests = Array.from({ length: 32 }, (_, index) => ({
    objectMindQueryId: `query-${index}-${"q".repeat(120)}`,
    objectMindHypothesisId: index === 31 ? "" : `${state.resolvedIdentity.selectedCandidateId}-${"h".repeat(120)}`,
    objectMindQueryType: "EVIDENCE_INFORMED_DISAMBIGUATION",
    objectMindPhase: index >= 28 ? "DIRECT_PAGE" : "REFINEMENT",
    objectMindExactVisibleFactsUsed: Array.from({ length: 12 }, (unused, factIndex) => `observation-${factIndex}-${"f".repeat(120)}`),
    objectMindDiscriminatorTested: `scale arrangement ${"d".repeat(240)}`,
    provider: "synthetic_provider",
    query: `Verdant Instruments field comparator ${index} ${"query".repeat(80)}`,
    normalizedCandidate: `verdant instruments field comparator ${index} ${"normalized".repeat(60)}`,
    resultingCandidateIds: Array.from({ length: 12 }, (unused, candidateIndex) => `source-${index}-${candidateIndex}-${"s".repeat(180)}`),
    physicalAttemptCount: 1,
    attempted: true,
    succeeded: true,
    failureStage: "none"
  }));
  const first = buildExperienceRecord({ state, providerRequests });
  const second = buildExperienceRecord({ state, providerRequests });
  assert.deepEqual(first, second);
  assert.equal(first.queriesAttempted.length, providerRequests.length);
  assert.equal(first.queryOwnership.length, providerRequests.length);
  assert(first.queryOwnership.every((record) => record.queryId && record.normalizedQuery && record.provider && record.disposition));
  assert.equal(first.queryOwnership.at(-1).owningHypothesisId, "");
  assert(experienceRecordByteLength(first) <= MAX_EXPERIENCE_RECORD_BYTES);
});

test("empty results, repeated distractors, and provider errors cannot create an unbounded loop", () => {
  const state = stateFor({
    subjectIdentity: "Unmarked ceramic workshop form",
    exactProductIdentity: "Unknown",
    exactProductConfidence: "Low",
    identityUnknowns: ["maker mark", "dimensions"],
    visualRecognition: { visualSubject: "Unmarked ceramic workshop form" }
  });
  const first = createEvidenceInformedRefinement(state, [], { attemptedQueries: [], maximumQueries: 4 });
  assert(first.searchPlan.length <= 4);
  const second = createEvidenceInformedRefinement(first.state, [], { attemptedQueries: [], maximumQueries: 4 });
  assert.equal(second.searchPlan.length, 0);
  const repeated = Array.from({ length: 100 }, () => source({
    title: "Unrelated plastic organizer",
    url: "https://www.amazon.com/product/repeated-distractor"
  }));
  const withRepeated = incorporateCandidateEvidence(second.state, repeated);
  assert(withRepeated.candidateEvidence.length <= 50);
  assert.equal(new Set(withRepeated.candidateEvidence.map((record) => record.sourceId)).size, withRepeated.candidateEvidence.length);
});

test("Object Mind classifications feed the existing canonical authority without a competing final-evidence result", () => {
  const upc = validUpc("74123456789");
  const identity = {
    brand: "Pinebridge Paper",
    model: "PB-60",
    upcBarcode: upc,
    exactProductIdentity: "Pinebridge Document Sleeves 60 Count",
    exactProductConfidence: "High",
    subjectIdentity: "Document sleeves",
    packageQuantity: "60 count",
    visibleText: ["Pinebridge", "PB-60", "60 count", upc],
    visualRecognition: { visualSubject: "Pack of document sleeves", visibleWords: ["Pinebridge", "60 count"] }
  };
  const state = stateFor(identity);
  const records = applyObjectEvidenceVerification(state, [
    source({ title: `Pinebridge Document Sleeves 60 Count ${upc}`, url: `https://www.amazon.com/product/${upc}` }),
    source({ title: "Pinebridge Document Sleeves 20 Count", url: "https://www.amazon.com/product/pinebridge-20" })
  ]);
  const result = createFinalEvidenceResult({
    analysisId: "synthetic-canonical-integration",
    analysisMode: "retail",
    targetIdentity: { upc, model: "PB-60", brand: "Pinebridge Paper", productName: identity.exactProductIdentity, quantity: 60 },
    observations: records,
    providerRequests: [],
    purpose: "personal"
  });
  assert.equal(result.schemaVersion, "1.0");
  assert(result.acceptedRecords.some((record) => record.objectMindClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM));
  assert(result.rejectedRecords.some((record) => /Package count differs/i.test(record.exclusionReason)));
  assert.equal(result.rangeEligible.some((record) => record.objectMindVerificationState === "REJECTED"), false);
});

test("legacy exact fields, exact-target queries, and canonical acceptance cannot bypass Object Mind exactness", () => {
  const base = {
    pageType: "product_or_listing",
    price: 18,
    priceType: "Active asking price",
    exactIdentity: true,
    identityMatchStrength: "Exact",
    classification: "Exact Match",
    matchQuality: "Exact product",
    query: "synthetic exact-target query",
    searchPass: "exact_target",
    objectMindSupportingAttributes: [{ attribute: "synthetic_family", status: "SUPPORTED" }],
    objectMindConflictingAttributes: []
  };
  const observations = [
    ["unresolved", "INSUFFICIENT_EVIDENCE", "UNRESOLVED"],
    ["compatible", "COMPATIBLE_ALTERNATIVE", "COMPATIBLE"],
    ["variation", "EXACT_DESIGN_VARIATION_UNRESOLVED", "UNRESOLVED_VARIATION"],
    ["similar", "SIMILAR_OBJECT", "REJECTED"],
    ["unrelated", "UNRELATED", "REJECTED"]
  ].map(([id, objectMindClassification, objectMindVerificationState]) => ({
    ...base,
    sourceRecordId: id,
    destinationUrl: `https://${id}.example/item/synthetic-object`,
    title: `Synthetic ${id} object evidence`,
    objectMindSourceId: `source:${id}`,
    objectMindClassification,
    objectMindVerificationState,
    objectMindRejectionReason: objectMindVerificationState === "VERIFIED" ? "" : `Synthetic ${id} disposition.`
  }));
  const result = createFinalEvidenceResult({
    analysisMode: "collectible",
    observations,
    displayLimit: 8,
    purpose: "personal"
  });
  validateFinalEvidenceResult(result);
  assert.equal(result.customerEvidence.some((record) => record.canonicalMatchLabel === "Exact"), false);
  assert.equal(result.customerEvidence.some((record) => record.title.includes("unresolved")), true);
  assert.equal(result.customerEvidence.some((record) => record.title.includes("compatible")), true);
  assert.equal(result.customerEvidence.find((record) => record.title.includes("variation"))?.canonicalMatchLabel, "Strong compatible");
  assert.equal(result.customerEvidence.some((record) => /similar|unrelated/.test(record.title)), false);
  assert(result.rejectedRecords.some((record) => record.objectMindVerificationState === "REJECTED"));
  assert.deepEqual(result.customerEvidence.map((record) => record.evidenceId), result.views.displayedIds);
});

test("verified barcode and model evidence, including exact no-price evidence, retains one exactness authority", () => {
  const barcode = validUpc("76123456789");
  const barcodeState = stateFor({
    brand: "Meridian Archive",
    upcBarcode: barcode,
    exactProductIdentity: "Meridian Archive Document Case 24 Count",
    exactProductConfidence: "High",
    subjectIdentity: "Document case",
    packageQuantity: "24 count",
    visibleText: ["Meridian Archive", "24 count", barcode],
    visualRecognition: { visualSubject: "Document case", visibleWords: ["Meridian Archive", "24 count"] }
  });
  const barcodeRecord = applyObjectEvidenceVerification(barcodeState, [source({
    title: `Meridian Archive Document Case 24 Count ${barcode}`,
    url: `https://barcode.example/item/${barcode}`,
    price: ""
  })])[0];
  barcodeRecord.parsedPrice = null;
  barcodeRecord.price = null;
  barcodeRecord.priceType = "Reference/archive";
  barcodeRecord.priceEvidenceType = "Reference/archive";
  barcodeRecord.sourceChannel = "conventional_retail";

  const modelState = stateFor({
    brand: "Quartz Workshop",
    model: "QW-8421",
    exactProductIdentity: "Quartz Workshop QW-8421 Bench Light",
    exactProductConfidence: "High",
    subjectIdentity: "Bench light",
    visibleText: ["Quartz Workshop", "QW-8421"],
    visualRecognition: { visualSubject: "Bench light", visibleWords: ["Quartz Workshop", "QW-8421"] }
  });
  const modelRecord = applyObjectEvidenceVerification(modelState, [source({
    title: "Quartz Workshop QW-8421 Bench Light",
    url: "https://model.example/item/qw-8421",
    price: "$42.00"
  })])[0];

  for (const [state, record, targetIdentity] of [
    [barcodeState, barcodeRecord, { upc: barcode, quantity: 24 }],
    [modelState, modelRecord, { brand: "Quartz Workshop", model: "QW-8421" }]
  ]) {
    const result = createFinalEvidenceResult({
      analysisMode: "collectible",
      targetIdentity,
      observations: [record],
      displayLimit: 8,
      purpose: "personal"
    });
    validateFinalEvidenceResult(result);
    assert.equal(result.customerEvidence.length, 1);
    assert.equal(result.customerEvidence[0].canonicalMatchLabel, "Exact");
    assert.equal(result.acceptedRecords[0].objectMindSourceId, record.objectMindSourceId);
    assert.equal(result.acceptedRecords[0].objectMindVerificationState, "VERIFIED");
    const evidenceState = incorporateCandidateEvidence(state, [record], { phase: "CANONICAL_FINALIZATION" });
    const experience = buildExperienceRecord({
      state: evidenceState,
      sourcesFound: [record],
      acceptedSources: result.acceptedRecords,
      rejectedSources: result.rejectedRecords,
      customerVisibleSources: result.customerEvidence
    });
    assert.equal(experience.exactEvidenceRecovered.length, 1);
    assert.equal(experience.sourcesAccepted[0].evidenceId, result.customerEvidence[0].evidenceId);
    assert.equal(experience.sourcesAccepted[0].canonicalQualificationResult, "QUALIFIED");
    assert.equal(experience.sourcesAccepted[0].canonicalSelectionResult, "SELECTED_FOR_CUSTOMER");
    assert.equal(experience.sourcesAccepted[0].finalCustomerClassification, "Exact");
  }
  assert.equal(barcodeRecord.objectMindClassification, "EXACT_ITEM");
  assert.equal(modelRecord.objectMindClassification, "EXACT_ITEM");
});

test("customer purpose cannot alter verified exactness and zero verified exacts cannot serialize as Exact", () => {
  const state = stateFor({
    brand: "Saffron Instruments",
    model: "SI-730",
    exactProductIdentity: "Saffron Instruments SI-730 Field Gauge",
    exactProductConfidence: "High",
    subjectIdentity: "Field gauge",
    visibleText: ["Saffron Instruments", "SI-730"],
    visualRecognition: { visualSubject: "Field gauge", visibleWords: ["Saffron Instruments", "SI-730"] }
  });
  const exact = applyObjectEvidenceVerification(state, [source({
    title: "Saffron Instruments SI-730 Field Gauge",
    url: "https://gauge.example/item/si-730"
  })])[0];
  const classifications = ["personal", "resale", "owner_value", "seller_listing"].map((purpose) => {
    const result = createFinalEvidenceResult({ observations: [exact], purpose });
    validateFinalEvidenceResult(result);
    return result.customerEvidence[0].canonicalMatchLabel;
  });
  assert.deepEqual(classifications, ["Exact", "Exact", "Exact", "Exact"]);

  const unresolved = {
    ...exact,
    sourceRecordId: "unresolved-copy",
    destinationUrl: "https://gauge.example/item/si-730-unresolved",
    canonicalUrl: "https://gauge.example/item/si-730-unresolved",
    url: "https://gauge.example/item/si-730-unresolved",
    objectMindSourceId: "source:unresolved-copy",
    objectMindClassification: "INSUFFICIENT_EVIDENCE",
    objectMindVerificationState: "UNRESOLVED",
    objectMindRejectionReason: "The model variant remains unresolved.",
    exactIdentity: true,
    identityMatchStrength: "Exact"
  };
  const unresolvedResult = createFinalEvidenceResult({ observations: [unresolved], purpose: "personal" });
  validateFinalEvidenceResult(unresolvedResult);
  const unresolvedState = incorporateCandidateEvidence(state, [unresolved], { phase: "CANONICAL_FINALIZATION" });
  const experience = buildExperienceRecord({
    state: unresolvedState,
    sourcesFound: [unresolved],
    acceptedSources: unresolvedResult.acceptedRecords,
    rejectedSources: unresolvedResult.rejectedRecords,
    customerVisibleSources: unresolvedResult.customerEvidence
  });
  assert.equal(experience.exactEvidenceRecovered.length, 0);
  assert.equal(unresolvedResult.customerEvidence.some((record) => record.canonicalMatchLabel === "Exact"), false);

  const tampered = createFinalEvidenceResult({ observations: [exact], purpose: "personal" });
  tampered.acceptedRecords[0].objectMindVerificationState = "UNRESOLVED";
  assert.throws(
    () => validateFinalEvidenceResult(tampered),
    /is Exact without verified Object Mind exactness/
  );
});

test("provider and direct-page ceilings remain 12, 28, and 2 with one reserved refinement phase", () => {
  const upc = validUpc("75123456789");
  const identity = {
    brand: "Silverline Office",
    model: "SO-36",
    upcBarcode: upc,
    exactProductIdentity: "Silverline Archive Folders 36 Count",
    exactProductConfidence: "High",
    subjectIdentity: "Archive folders",
    packageQuantity: "36 count",
    visibleText: ["Silverline", "SO-36", "36 count", upc],
    visualRecognition: { visualSubject: "Box of archive folders", visibleWords: ["Silverline", "36 count"] }
  };
  const state = stateFor(identity);
  const standard = hooks.buildSerperSearchPlan({
    searchQueries: state.searchPlan.map((record) => record.query),
    sourceRoute: [],
    identity,
    buyerIntake: { purchase_intent: "resale", purchase_context: "private_seller" },
    notes: identity.exactProductIdentity,
    objectMindState: state
  });
  const retail = hooks.buildSerperSearchPlan({
    searchQueries: state.searchPlan.map((record) => record.query),
    sourceRoute: [],
    identity,
    buyerIntake: { purchase_intent: "personal_use", purchase_context: "retail_store", item_name: identity.exactProductIdentity, known_upc: upc },
    notes: identity.exactProductIdentity,
    objectMindState: state
  });
  assert(standard.filter((record) => record.validationPassed !== false).length <= 8);
  assert(standard.filter((record) => record.validationPassed !== false).length + 4 <= 12);
  assert(retail.filter((record) => record.validationPassed !== false).length <= 24);
  assert(retail.filter((record) => record.validationPassed !== false).length + 4 <= 28);
  assert.equal(hooks.directPageEnrichmentMaxAttempts, 2);
  assert.equal(hooks.retailSerperBudgetAllocation.maxProviderCalls, 28);
});
