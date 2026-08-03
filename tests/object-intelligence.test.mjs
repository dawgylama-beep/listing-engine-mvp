import assert from "node:assert/strict";
import test from "node:test";
import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import { computeCheckDigit } from "../lib/evidence/identity.js";
import { createFinalEvidenceResult } from "../lib/evidence/index.js";
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

test("evidence can weaken the initial candidate, promote an existing alternate, and refine only once", () => {
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
  assert.equal(refinement.state.refinementCount, 1);
  assert(refinement.state.resolutionHistory.some((entry) => entry.event === "ALTERNATE_HYPOTHESIS_PROMOTED"));
  const second = createEvidenceInformedRefinement(refinement.state, records, { attemptedQueries: [] });
  assert.deepEqual(second.searchPlan, []);
  assert.equal(second.state.refinementCount, 1);
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
