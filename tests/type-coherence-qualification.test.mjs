import assert from "node:assert/strict";
import test from "node:test";
import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import { computeCheckDigit } from "../lib/evidence/identity.js";
import { createFinalEvidenceResult, qualifyEvidence } from "../lib/evidence/index.js";
import {
  applyObjectEvidenceVerification,
  createInitialObjectSearchPlan,
  createObjectMindState,
  createPurposeNeutralObjectInput,
  withObjectSearchPlan
} from "../lib/object-intelligence/index.js";

const photo = Object.freeze({
  name: "synthetic-type-coherence.png",
  dataUrl: "data:image/png;base64,iVBORw0KGgo="
});

function validUpc(body = "73123456789") {
  return `${body}${computeCheckDigit(body)}`;
}

function watchIdentity(overrides = {}) {
  return {
    brand: "Northstar",
    manufacturer: "Northstar Works",
    model: "AX-41",
    productNameOrBoxTitle: "Northstar AX-41 digital wristwatch",
    exactProductIdentity: "Northstar AX-41 digital wristwatch",
    exactProductConfidence: "High",
    likelyItemDescription: "Digital wristwatch",
    subjectIdentity: "Digital wristwatch",
    category: "collector plate",
    visibleText: ["Northstar", "AX-41"],
    visualRecognition: {
      visualSubject: "Digital wristwatch",
      visibleWords: ["Northstar", "AX-41"]
    },
    ...overrides
  };
}

function staleWatchContext(overrides = {}) {
  return {
    itemType: "collector plate",
    productTitle: "Northstar AX-41 digital wristwatch",
    exactProductIdentity: "Northstar AX-41 digital wristwatch",
    subjectIdentity: "Digital wristwatch",
    brand: "Northstar",
    manufacturer: "Northstar Works",
    model: "AX-41",
    ...overrides
  };
}

function exactWatchSource(overrides = {}) {
  const record = {
    sourceRecordId: "source-synthetic-watch",
    title: "Northstar Works AX-41 digital watch",
    url: "https://merchant.example/product/northstar-ax-41-digital-watch",
    canonicalUrl: "https://merchant.example/product/northstar-ax-41-digital-watch",
    destinationUrl: "https://merchant.example/product/northstar-ax-41-digital-watch",
    snippet: "",
    rawText: "",
    pageType: "product_or_listing",
    sourceType: "organic",
    identityMatchStrength: "Exact",
    priceEvidenceType: "Price unavailable",
    ...overrides
  };
  if (Object.hasOwn(overrides, "url")) {
    if (!Object.hasOwn(overrides, "canonicalUrl")) record.canonicalUrl = record.url;
    if (!Object.hasOwn(overrides, "destinationUrl")) record.destinationUrl = record.url;
  }
  if (!Object.hasOwn(overrides, "rawText")) record.rawText = `${record.title} ${record.snippet}`;
  return record;
}

function compatibility(record = exactWatchSource(), identity = watchIdentity(), context = staleWatchContext()) {
  return hooks.evaluateComparableItemTypeCompatibility(record, identity, context);
}

function objectState(identity = watchIdentity()) {
  const neutralInput = createPurposeNeutralObjectInput({
    notes: identity.exactProductIdentity,
    buyerIntake: {}
  });
  const state = createObjectMindState({
    analysisId: "synthetic-type-coherence-analysis",
    photos: [photo],
    neutralInput,
    extractedIdentity: identity
  });
  return withObjectSearchPlan(state, createInitialObjectSearchPlan(state));
}

test("A: stale submitted type yields to coherent normalized type and exact source identity", () => {
  const result = compatibility();
  assert.equal(result.itemTypeCompatible, true);
  assert.equal(result.status, "compatible");
  assert.equal(result.originalSubmittedItemType, "plate");
  assert.equal(result.normalizedSubmittedItemType, "watch");
  assert.equal(result.itemTypeCoherenceStatus, "reconciled_stale_submitted_type");
  assert.deepEqual(result.authoritativeExactIdentitySignals, ["exact_model_and_maker"]);

  const qualification = qualifyEvidence({
    ...exactWatchSource(),
    itemTypeCompatible: result.itemTypeCompatible,
    itemTypeCompatibilityStatus: result.status,
    exactIdentity: true
  });
  assert.equal(qualification.eligible, true);

  const upc = validUpc("71234567890");
  const unknownCandidateType = compatibility({
    title: `Arbor cocoa spread ${upc}`,
    url: `https://merchant.example/product/arbor-${upc}`,
    canonicalUrl: `https://merchant.example/product/arbor-${upc}`
  }, {
    brand: "Arbor",
    manufacturer: "Arbor Foods",
    upcBarcode: upc,
    productNameOrBoxTitle: "Arbor cocoa spread jar",
    exactProductIdentity: "Arbor cocoa spread jar",
    likelyItemDescription: "Jar of cocoa spread",
    subjectIdentity: "Jar of cocoa spread",
    category: "poster print"
  }, {
    itemType: "poster print",
    productTitle: "Arbor cocoa spread jar",
    subjectIdentity: "Jar of cocoa spread",
    brand: "Arbor",
    manufacturer: "Arbor Foods",
    barcodeDigits: upc,
    barcodeIdentitySet: [upc]
  });
  assert.equal(unknownCandidateType.itemTypeCompatible, true);
  assert.equal(unknownCandidateType.itemTypeCoherenceStatus, "reconciled_unknown_candidate_type_exact_identity");
  assert.equal(unknownCandidateType.candidateItemType, "canister, jar, or storage container");
});

test("B: unresolved weak type plus category-adjacent evidence is not promoted", () => {
  const source = exactWatchSource({
    title: "Northstar digital watch collection",
    url: "https://merchant.example/product/northstar-digital-watch",
    canonicalUrl: "https://merchant.example/product/northstar-digital-watch",
    destinationUrl: "https://merchant.example/product/northstar-digital-watch",
    snippet: "Northstar watches"
  });
  const result = compatibility(source);
  assert.equal(result.itemTypeCompatible, true);
  assert.equal(result.status, "compatible");
  assert.equal(result.itemTypeCoherenceStatus, "normalized_type_compatible_not_exact");
  assert.deepEqual(result.authoritativeExactIdentitySignals, []);
  assert.notEqual(hooks.classifySerperIdentityMatch(source, watchIdentity(), staleWatchContext(), result), "Exact");
  assert.equal(qualifyEvidence({
    ...source,
    itemTypeCompatible: result.itemTypeCompatible,
    itemTypeCompatibilityStatus: result.status,
    itemTypeCoherenceStatus: result.itemTypeCoherenceStatus,
    exactIdentity: true
  }).eligible, false);
});

test("C: genuine cross-product type conflict remains rejected", () => {
  const identity = {
    brand: "Meridian",
    productNameOrBoxTitle: "Meridian commemorative collector plate",
    exactProductIdentity: "Meridian commemorative collector plate",
    subjectIdentity: "Collector plate",
    category: "collector plate"
  };
  const context = {
    itemType: "collector plate",
    productTitle: "Meridian commemorative collector plate",
    brand: "Meridian"
  };
  const result = compatibility(exactWatchSource({ title: "Meridian digital watch" }), identity, context);
  assert.equal(result.itemTypeCompatible, false);
  assert.equal(result.status, "item_type_mismatch");
  assert.equal(result.itemTypeCoherenceStatus, "genuine_item_type_conflict");
});

test("D: brand-adjacent product distractor remains rejected", () => {
  const result = compatibility(exactWatchSource({
    title: "Northstar countertop mixer",
    url: "https://merchant.example/product/northstar-countertop-mixer",
    canonicalUrl: "https://merchant.example/product/northstar-countertop-mixer"
  }));
  assert.equal(result.itemTypeCompatible, false);
  assert.equal(result.status, "normalized_type_mismatch");
  assert.deepEqual(result.authoritativeExactIdentitySignals, []);
});

test("E: model-like text cannot override a genuine object-type conflict", () => {
  const result = compatibility(exactWatchSource({
    title: "Northstar AX-41 collector plate",
    url: "https://merchant.example/product/northstar-ax-41-collector-plate",
    canonicalUrl: "https://merchant.example/product/northstar-ax-41-collector-plate"
  }));
  assert.equal(result.itemTypeCompatible, false);
  assert.equal(result.status, "normalized_type_mismatch");
  assert.deepEqual(result.authoritativeExactIdentitySignals, ["exact_model_and_maker"]);
});

test("F: a validated identifier cannot override an unresolved genuine type conflict", () => {
  const upc = validUpc("74567890123");
  const identity = {
    brand: "Helios",
    manufacturer: "Helios Studio",
    upcBarcode: upc,
    productNameOrBoxTitle: "Helios commemorative collector plate",
    exactProductIdentity: "Helios commemorative collector plate",
    subjectIdentity: "Collector plate",
    category: "collector plate"
  };
  const context = {
    itemType: "collector plate",
    productTitle: "Helios commemorative collector plate",
    brand: "Helios",
    manufacturer: "Helios Studio",
    barcodeDigits: upc,
    barcodeIdentitySet: [upc]
  };
  const source = exactWatchSource({
    title: `Helios digital watch ${upc}`,
    url: `https://merchant.example/product/helios-watch-${upc}`,
    canonicalUrl: `https://merchant.example/product/helios-watch-${upc}`
  });
  const result = compatibility(source, identity, context);
  assert.equal(result.itemTypeCompatible, false);
  assert.equal(result.status, "normalized_type_mismatch");
  assert.deepEqual(result.authoritativeExactIdentitySignals, ["equivalent_validated_barcode"]);
});

test("G: coherent exact source remains eligible for verification and canonical qualification", () => {
  const result = compatibility();
  const verified = applyObjectEvidenceVerification(objectState(), [{
    ...exactWatchSource(),
    itemTypeCompatible: result.itemTypeCompatible,
    itemTypeCompatibilityStatus: result.status,
    itemTypeCompatibilityExplanation: result.explanation
  }])[0];
  assert.equal(verified.objectMindClassification, "EXACT_ITEM");
  assert.equal(verified.objectMindVerificationState, "VERIFIED");
  assert.equal(verified.objectMindDirectPageEligible, true);
});

test("H: type-coherence is purpose neutral", () => {
  const purposes = ["personal", "resale", "owner", "listing"];
  const decisions = purposes.map((purchaseContext) => compatibility(
    exactWatchSource(),
    watchIdentity(),
    staleWatchContext({ purchaseContext })
  )).map((result) => ({
    compatible: result.itemTypeCompatible,
    status: result.status,
    coherence: result.itemTypeCoherenceStatus,
    submitted: result.submittedItemType,
    candidate: result.candidateItemType
  }));
  assert.equal(decisions.length, 4);
  for (const decision of decisions.slice(1)) assert.deepEqual(decision, decisions[0]);
});

test("I: existing cross-product firewall rejects resolved-type distractors", () => {
  const distractors = [
    "Northstar AX-41 collector plate",
    "Northstar AX-41 replacement watch battery",
    "Northstar AX-41 wall plaque"
  ];
  for (const title of distractors) {
    const result = compatibility(exactWatchSource({ title }));
    assert.equal(result.itemTypeCompatible, false, title);
    assert.match(result.status, /mismatch/, title);
  }
});

test("J: reconciled evidence still enters the one canonical finalizer", () => {
  const result = compatibility();
  const verified = applyObjectEvidenceVerification(objectState(), [{
    ...exactWatchSource(),
    itemTypeCompatible: result.itemTypeCompatible,
    itemTypeCompatibilityStatus: result.status,
    itemTypeCompatibilityExplanation: result.explanation
  }])[0];
  const finalEvidence = createFinalEvidenceResult({
    analysisId: "synthetic-type-coherence-finalizer",
    analysisMode: "collectible",
    targetIdentity: {},
    observations: [verified],
    purpose: "personal"
  });
  assert.equal(finalEvidence.acceptedRecords.length, 1);
  assert.deepEqual(finalEvidence.customerEvidence.map((record) => record.evidenceId), finalEvidence.views.displayedIds);
  assert.deepEqual(finalEvidence.views.acceptedIds, finalEvidence.acceptedRecords.map((record) => record.evidenceId));
  assert.equal(finalEvidence.records.length, finalEvidence.acceptedRecords.length + finalEvidence.rejectedRecords.length);
});
