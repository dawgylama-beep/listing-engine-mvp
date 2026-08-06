import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  MAX_EXPERIENCE_RECORD_BYTES,
  OBJECT_EVIDENCE_CLASSIFICATION,
  buildExperienceRecord,
  createInitialObjectSearchPlan,
  createObjectMindState,
  createPurposeNeutralObjectInput,
  experienceRecordByteLength,
  verifyObjectEvidenceCandidate,
  withObjectSearchPlan
} from "../lib/object-intelligence/index.js";

const photo = Object.freeze({
  name: "synthetic-identity-sentinel.png",
  dataUrl: "data:image/png;base64,iVBORw0KGgo="
});

function stateFor(identity, purchaseIntent = "buying for myself") {
  const neutralInput = createPurposeNeutralObjectInput({
    notes: identity.subjectIdentity,
    buyerIntake: { purchase_intent: purchaseIntent }
  });
  const state = createObjectMindState({
    analysisId: "synthetic-identity-sentinel",
    photos: [photo],
    neutralInput,
    extractedIdentity: identity
  });
  return withObjectSearchPlan(state, createInitialObjectSearchPlan(state));
}

function recorderIdentity(overrides = {}) {
  return {
    brand: "Not verified",
    makerIdentity: "not verified",
    manufacturer: "NOT VERIFIED",
    exactProductIdentity: "Unverified portable audio recorder",
    exactProductConfidence: "Low",
    productNameOrBoxTitle: "Unverified portable audio recorder",
    subjectIdentity: "Portable audio field recorder",
    likelyItemDescription: "Portable audio field recorder",
    visibleText: ["Not verified"],
    distinctiveVisualDescription: "not verified",
    visualRecognition: {
      visualSubject: "Portable audio field recorder",
      recognizedBrand: "Not verified",
      visibleWords: ["not verified"],
      visualStyle: "NOT VERIFIED"
    },
    ...overrides
  };
}

function clampIdentity(overrides = {}) {
  return {
    brand: "not verified",
    manufacturer: "Not Verified",
    exactProductIdentity: "Unverified quick-release bench clamp",
    exactProductConfidence: "Low",
    subjectIdentity: "Quick-release bench clamp",
    likelyItemDescription: "Quick-release bench clamp",
    visibleText: ["NOT VERIFIED"],
    distinctiveVisualDescription: "Not verified",
    visualRecognition: {
      visualSubject: "Quick-release bench clamp",
      recognizedBrand: "not verified",
      visibleWords: ["Not verified"],
      visualStyle: "not verified"
    },
    ...overrides
  };
}

function exactSource(state, overrides = {}) {
  return {
    title: "Aster Sound AR-42 portable audio recorder",
    snippet: "Aster Sound AR-42 handheld field recorder",
    url: "https://catalog.synthetic.example/audio/ar-42",
    canonicalUrl: "https://catalog.synthetic.example/audio/ar-42",
    itemTypeCompatible: true,
    identityMatchStrength: "Exact",
    objectMindHypothesisId: state.resolvedIdentity.selectedCandidateId,
    ...overrides
  };
}

test("unknown identity sentinels do not become purpose-neutral query terms", () => {
  const state = stateFor(recorderIdentity());
  assert.equal(state.searchPlan.some((record) => /\bnot verified\b/i.test(record.query)), false);
  assert(state.searchPlan.length > 0, "a useful broader-identity search should remain available");
});

test("the same sentinel rule applies to an unrelated object class", () => {
  const state = stateFor(clampIdentity(), "resale");
  assert.equal(state.searchPlan.some((record) => /\bnot verified\b/i.test(record.query)), false);
});

test("identity normalization and search planning remain purpose-neutral", () => {
  const purposes = [
    "buying for myself",
    "resale",
    "what's it worth",
    "marketplace listing"
  ];
  const projections = purposes.map((purpose) => {
    const state = stateFor(recorderIdentity(), purpose);
    return {
      observedFacts: state.observedFacts,
      hypotheses: state.identityHypotheses,
      resolvedIdentity: state.resolvedIdentity,
      searchPlan: state.searchPlan
    };
  });
  for (const projection of projections.slice(1)) assert.deepEqual(projection, projections[0]);
});

test("valid maker-model evidence remains exact while adjacent models remain rejected", () => {
  const state = stateFor(recorderIdentity({
    brand: "Aster Sound",
    makerIdentity: "Aster Sound",
    manufacturer: "Aster Sound Works",
    model: "AR-42",
    exactProductIdentity: "Aster Sound AR-42 portable audio recorder",
    exactProductConfidence: "High",
    productNameOrBoxTitle: "Aster Sound AR-42 portable audio recorder",
    visibleText: ["Aster Sound", "AR-42"],
    distinctiveVisualDescription: "Handheld recorder with twin microphone capsules",
    visualRecognition: {
      visualSubject: "Portable audio field recorder",
      recognizedBrand: "Aster Sound",
      visibleWords: ["Aster Sound", "AR-42"],
      distinctiveFeatures: ["twin microphone capsules"]
    }
  }));
  const exact = verifyObjectEvidenceCandidate(state, exactSource(state));
  const adjacentModel = verifyObjectEvidenceCandidate(state, exactSource(state, {
    title: "Aster Sound AR-52 portable audio recorder",
    snippet: "Aster Sound AR-52 handheld field recorder",
    url: "https://catalog.synthetic.example/audio/ar-52",
    canonicalUrl: "https://catalog.synthetic.example/audio/ar-52"
  }));
  const brandAdjacentAccessory = verifyObjectEvidenceCandidate(state, exactSource(state, {
    title: "Aster Sound carrying case for portable recorders",
    snippet: "Compatible protective accessory",
    url: "https://catalog.synthetic.example/audio/carrying-case",
    canonicalUrl: "https://catalog.synthetic.example/audio/carrying-case"
  }));
  assert.equal(exact.exactnessClassification, OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM);
  assert.equal(exact.verificationState, "VERIFIED");
  assert.equal(adjacentModel.verificationState, "REJECTED");
  assert.equal(brandAdjacentAccessory.exactnessClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM, false);
});

test("removing an unknown sentinel does not fabricate evidence or hide provider failure", () => {
  const state = stateFor(clampIdentity());
  const experience = buildExperienceRecord({
    state,
    providerRequests: [{
      query: state.searchPlan[0].query,
      queryId: state.searchPlan[0].queryId,
      attempted: true,
      succeeded: false,
      failureStage: "provider_request_failure",
      errorCode: "synthetic_external_outage"
    }],
    sourcesFound: [],
    acceptedSources: [],
    rejectedSources: [],
    subsystemOutcomeFlags: {
      providerErrorObserved: true,
      emptySearchResult: true,
      exactEvidenceRecovered: false
    }
  });
  assert.equal(experience.exactEvidenceRecovered.length, 0);
  assert.equal(experience.sourcesAccepted.length, 0);
  assert.equal(experience.subsystemOutcomeFlags.providerErrorObserved, true);
  assert.equal(experience.subsystemOutcomeFlags.emptySearchResult, true);
  assert(experienceRecordByteLength(experience) <= MAX_EXPERIENCE_RECORD_BYTES);
  assert.match(experience.experienceRecordHash, /^[a-f0-9]{64}$/);
});

test("the focused repair stays network-denied and isolated from reflection and lesson gates", async () => {
  const originalFetch = globalThis.fetch;
  let networkAttempts = 0;
  globalThis.fetch = async () => {
    networkAttempts += 1;
    throw new Error("network access denied in identity-sentinel regression");
  };
  try {
    stateFor(recorderIdentity());
    stateFor(clampIdentity());
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(networkAttempts, 0);

  const [stateSource, indexSource] = await Promise.all([
    readFile(new URL("../lib/object-intelligence/state.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/object-intelligence/index.js", import.meta.url), "utf8")
  ]);
  assert.doesNotMatch(`${stateSource}\n${indexSource}`, /experience-reflection|lesson-gate/);
});
