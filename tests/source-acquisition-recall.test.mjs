import assert from "node:assert/strict";
import test from "node:test";
import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import { createFinalEvidenceResult, validateFinalEvidenceResult } from "../lib/evidence/index.js";
import {
  MAX_EXPERIENCE_RECORD_BYTES,
  OBJECT_EVIDENCE_CLASSIFICATION,
  buildExperienceRecord,
  createInitialObjectSearchPlan,
  createObjectMindState,
  createPurposeNeutralObjectInput,
  experienceRecordByteLength,
  withObjectSearchPlan
} from "../lib/object-intelligence/index.js";

function syntheticIdentity() {
  return {
    brand: "Aster Labs",
    model: "AX-41",
    exactProductIdentity: "Aster Labs AX-41 Spectrum Meter",
    exactProductConfidence: "High",
    category: "electronics",
    subjectIdentity: "Handheld spectrum meter",
    visibleText: ["Aster Labs", "AX-41", "calibrated spectrum"],
    diagnosticVisualDetails: ["amber scale window"],
    visualRecognition: {
      visualSubject: "Handheld spectrum meter",
      visualSubjectCategory: "electronics",
      visibleWords: ["Aster Labs", "AX-41", "calibrated spectrum"],
      distinctiveFeatures: ["amber scale window"]
    }
  };
}

function stateFor(identity = syntheticIdentity()) {
  const state = createObjectMindState({
    analysisId: "synthetic-source-acquisition",
    photos: [],
    neutralInput: createPurposeNeutralObjectInput({
      notes: identity.exactProductIdentity || identity.subjectIdentity
    }),
    extractedIdentity: identity
  });
  return withObjectSearchPlan(state, createInitialObjectSearchPlan(state));
}

function queryRecord(state) {
  const owner = state.searchPlan[0];
  return {
    query: owner.query,
    priority: 1,
    searchPass: "open_web_exact",
    objectMindQueryId: owner.queryId,
    objectMindHypothesisId: owner.owningHypothesisId,
    objectMindQueryType: owner.queryType,
    objectMindExactVisibleFactsUsed: owner.exactVisibleFactsUsed,
    objectMindDiscriminatorTested: owner.discriminatorTested,
    objectMindPhase: "INITIAL",
    objectMindProviderLane: "purpose_neutral_exact",
    allowedDomains: []
  };
}

function structuredResponse() {
  const actionUrl = "https://catalog.synthetic.example/products/ax-41?utm_source=provider";
  const canonicalActionUrl = "https://catalog.synthetic.example/products/ax-41";
  const archiveUrl = "https://archive.synthetic.example/reference/ax-41";
  const nearMatchUrl = "https://market.synthetic.example/listing/ax-42";
  return {
    actionUrl,
    canonicalActionUrl,
    archiveUrl,
    nearMatchUrl,
    data: {
      output: [{
        type: "web_search_call",
        action: {
          query: "Aster Labs AX-41 Spectrum Meter",
          sources: [{
            title: "Aster Labs AX-41 Spectrum Meter",
            url: actionUrl,
            snippet: "Aster Labs AX-41 calibrated spectrum meter with amber scale window. Active listing $31.00."
          }]
        }
      }, {
        type: "message",
        content: [{
          type: "output_text",
          text: JSON.stringify({
            comparableItemsFound: [],
            resultsFound: [],
            strongComparables: [],
            partialComparables: [],
            itemIdentificationEvidence: [],
            referenceResults: [],
            weakMatches: [],
            rejectedMatches: [],
            searchEvidenceSummary: "Synthetic structured response without prose URLs."
          }),
          annotations: [{
            type: "url_citation",
            title: "Aster Labs AX-41 Spectrum Meter",
            url: canonicalActionUrl
          }, {
            type: "url_citation",
            title: "Aster Labs spectrum meter archive",
            url: archiveUrl
          }, {
            type: "url_citation",
            title: "Aster Labs AX-42 Spectrum Meter",
            url: nearMatchUrl
          }, {
            type: "url_citation",
            title: "Unsupported source scheme",
            url: "ftp://files.synthetic.example/ax-41"
          }]
        }]
      }]
    }
  };
}

function dispositionObjects(experience) {
  const fields = experience.sourceAcquisitionDispositionFields;
  return experience.sourceAcquisitionDispositions.map((row) => Object.fromEntries(
    fields.map((field, index) => [field, row[index]])
  ));
}

function canonicalFixtureObservations(records) {
  return records.map((record) => ({
    ...record,
    submittedItemType: "handheld spectrum meter",
    candidateItemType: "handheld spectrum meter",
    itemTypeCompatible: true,
    itemTypeCompatibilityStatus: "compatible",
    itemTypeCompatibilityExplanation: "Synthetic fixture uses the same source-backed object type.",
    productFamilyCompatibilityOutcome: "compatible"
  }));
}

test("structured annotations are first-class candidates even when action sources and model prose omit them", () => {
  const state = stateFor();
  const fixture = structuredResponse();
  const records = hooks.collectStructuredProviderSourceRecords(fixture.data, queryRecord(state));
  const valid = records.filter((record) => record.url);

  assert.equal(records.length, 4);
  assert.equal(valid.length, 3);
  assert(valid.some((record) => record.url === fixture.archiveUrl));
  assert(valid.some((record) => record.url === fixture.nearMatchUrl));
  assert.equal(valid.filter((record) => record.url === fixture.canonicalActionUrl).length, 1);
  const merged = valid.find((record) => record.url === fixture.canonicalActionUrl);
  assert.deepEqual(merged.sourceExtractionProvenance, ["URL_CITATION_ANNOTATION", "WEB_SEARCH_ACTION_SOURCE"]);
  assert.equal(merged.sourceExtractionObservationCount, 2);
  assert.equal(merged.originalProviderUrls.length, 2);
  assert(records.every((record) => record.sourceRecordId && record.objectMindQueryId && record.provider === "openai_web_search"));
  assert(records.every((record) => record.objectMindClassification === undefined && record.exactIdentity === undefined));
  assert.equal(records.find((record) => !record.url).extractionDisposition, "DISALLOWED");
});

test("URL normalization deduplicates tracking variants without collapsing materially distinct pages", () => {
  assert.equal(
    hooks.canonicalizeComparableUrl("https://market.synthetic.example/item/100?utm_campaign=test#details"),
    "https://market.synthetic.example/item/100"
  );
  assert.equal(
    hooks.canonicalizeComparableUrl("https://market.synthetic.example/item/100?variant=blue"),
    "https://market.synthetic.example/item/100?variant=blue"
  );
  assert.notEqual(
    hooks.canonicalizeComparableUrl("https://market.synthetic.example/item/100"),
    hooks.canonicalizeComparableUrl("https://market.synthetic.example/item/101")
  );
});

test("plausible exact, unresolved, and near-match structured candidates reach Object Mind verification", () => {
  const identity = syntheticIdentity();
  const state = stateFor(identity);
  const fixture = structuredResponse();
  const acquisition = hooks.collectStructuredProviderSourceRecords(fixture.data, queryRecord(state));
  const context = hooks.buildSearchQueryContext(identity, [], identity.exactProductIdentity, hooks.normalizeBuyerIntake({
    purchase_context: "private_seller",
    item_name: identity.exactProductIdentity
  }));
  const verified = hooks.normalizeSerperCandidateRecords(acquisition, identity, context, state);

  assert.equal(verified.length, 3);
  assert(verified.some((record) => record.objectMindClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM));
  assert(verified.some((record) => /UNRESOLVED|COMPATIBLE/.test(record.objectMindVerificationState)));
  assert(verified.some((record) => /SIMILAR_OBJECT|UNRELATED/.test(record.objectMindClassification) || record.objectMindVerificationState === "REJECTED"));
  assert(verified.every((record) => record.objectMindSourceId && record.objectMindVerificationState));

  const canonicalObservations = canonicalFixtureObservations(verified);
  const final = createFinalEvidenceResult({
    analysisId: "synthetic-source-acquisition-final",
    analysisMode: "collectible",
    targetIdentity: { brand: identity.brand, model: identity.model, productName: identity.exactProductIdentity },
    observations: canonicalObservations,
    providerRequests: [],
    purpose: "personal"
  });
  validateFinalEvidenceResult(final);
  assert.equal(
    final.customerEvidence.filter((record) => record.canonicalMatchLabel === "Exact").length,
    1,
    JSON.stringify({
      accepted: final.acceptedRecords.map((record) => ({
        title: record.title,
        classification: record.objectMindClassification,
        verification: record.objectMindVerificationState,
        submittedItemType: record.submittedItemType,
        candidateItemType: record.candidateItemType,
        compatibility: record.itemTypeCompatibilityStatus,
        canonical: record.canonicalMatchQuality,
        customerEligible: record.customerEligible,
        exclusionReason: record.exclusionReason
      })),
      rejected: final.rejectedRecords.map((record) => ({
        title: record.title,
        classification: record.objectMindClassification,
        verification: record.objectMindVerificationState,
        exclusionReason: record.exclusionReason
      }))
    })
  );
  assert.equal(new Set(final.customerEvidence.map((record) => record.evidenceId)).size, final.customerEvidence.length);
});

test("every provider-returned structured source receives a bounded Experience Record disposition", () => {
  const identity = syntheticIdentity();
  const state = stateFor(identity);
  const fixture = structuredResponse();
  const acquisition = hooks.collectStructuredProviderSourceRecords(fixture.data, queryRecord(state));
  const context = hooks.buildSearchQueryContext(identity, [], identity.exactProductIdentity, hooks.normalizeBuyerIntake({
    purchase_context: "private_seller",
    item_name: identity.exactProductIdentity
  }));
  const verified = hooks.normalizeSerperCandidateRecords(acquisition, identity, context, state);
  const reconciled = hooks.reconcileSourceAcquisitionRecords(acquisition, verified);
  const canonicalObservations = canonicalFixtureObservations(verified);
  const final = createFinalEvidenceResult({
    analysisId: "synthetic-source-disposition-final",
    analysisMode: "collectible",
    targetIdentity: { brand: identity.brand, model: identity.model, productName: identity.exactProductIdentity },
    observations: canonicalObservations,
    providerRequests: [],
    purpose: "personal"
  });
  const request = queryRecord(state);
  Object.assign(request, {
    attempted: true,
    logicalQueryAttempted: true,
    physicalAttemptCount: 1,
    succeeded: true,
    failureStage: "none",
    provider: "OpenAI web_search",
    providerKey: "openai_web_search",
    resultingCandidateIds: acquisition.map((record) => record.sourceRecordId)
  });
  const experience = buildExperienceRecord({
    state,
    providerRequests: [request],
    sourceAcquisitionRecords: reconciled,
    sourcesFound: canonicalObservations,
    acceptedSources: final.acceptedRecords,
    rejectedSources: final.rejectedRecords,
    customerVisibleSources: final.customerEvidence
  });
  const dispositions = dispositionObjects(experience);

  assert.equal(dispositions.length, acquisition.length);
  assert(dispositions.every((record) => record.sourceId && record.queryId && record.finalDisposition));
  assert(dispositions.some((record) => record.finalDisposition === "DISALLOWED"));
  assert(dispositions.some((record) => record.finalDisposition === "CANONICALLY_SELECTED"));
  assert.equal(experience.queryOwnership[0].resultingCandidateIds.length, acquisition.length);
  assert.notEqual(experience.queryOwnership[0].disposition, "NO_RESULT");
});

test("retail-ceiling source dispositions remain complete under the Experience Record byte limit", () => {
  const state = stateFor();
  const providerRequests = Array.from({ length: 28 }, (_, requestIndex) => ({
    query: `synthetic bounded query ${requestIndex}`,
    objectMindQueryId: `query-${requestIndex}`,
    objectMindHypothesisId: state.resolvedIdentity.selectedCandidateId,
    objectMindQueryType: "PROVIDER_ROUTED_IDENTITY_QUERY",
    objectMindPhase: requestIndex >= 24 ? "REFINEMENT" : "INITIAL",
    provider: "synthetic_provider",
    providerKey: "synthetic_provider",
    attempted: true,
    physicalAttemptCount: 1,
    succeeded: true,
    failureStage: "none",
    resultingCandidateIds: Array.from({ length: 12 }, (_, sourceIndex) => `source-${requestIndex}-${sourceIndex}`)
  }));
  const sourceAcquisitionRecords = providerRequests.flatMap((request, requestIndex) => (
    request.resultingCandidateIds.map((sourceRecordId, sourceIndex) => ({
      sourceRecordId,
      objectMindQueryId: request.objectMindQueryId,
      canonicalUrl: `https://bounded-${requestIndex}.synthetic.example/item/${sourceIndex}`,
      extractionDisposition: "PRESERVED",
      normalizationDisposition: "PRESERVED",
      enrichmentDisposition: "NOT_ENRICHABLE",
      verificationDisposition: "NOT_VERIFIED"
    }))
  ));
  const experience = buildExperienceRecord({ state, providerRequests, sourceAcquisitionRecords });
  assert.equal(experience.sourceAcquisitionDispositions.length, 28 * 12);
  assert(experience.sourceAcquisitionDispositions.every((row) => row.at(-1) === "NOT_ENRICHABLE"));
  assert(experienceRecordByteLength(experience) <= MAX_EXPERIENCE_RECORD_BYTES);
});

test("customer purpose cannot alter acquisition plans or provider request payloads", () => {
  const identity = {
    brand: "Northstar Atelier",
    model: "NA-82",
    exactProductIdentity: "Northstar Atelier Meridian Desk Form",
    exactProductConfidence: "Medium",
    subjectIdentity: "Radial metal desk sculpture",
    visibleText: ["Northstar Atelier", "Meridian"],
    diagnosticVisualDetails: ["eleven radial spokes", "slate base"],
    visualRecognition: {
      visualSubject: "Radial metal desk sculpture",
      visibleWords: ["Northstar Atelier", "Meridian"],
      distinctiveFeatures: ["eleven radial spokes", "slate base"]
    }
  };
  const state = stateFor(identity);
  const intents = ["personal_use", "resale", "owner_value", "seller_listing"];
  const variants = intents.map((purchaseIntent) => {
    const intake = hooks.normalizeBuyerIntake({
      purchase_intent: purchaseIntent,
      purchase_context: "private_seller",
      buyer_notes: identity.exactProductIdentity
    });
    const route = hooks.routeMarketSources(identity, intake, purchaseIntent === "resale" ? "Synthetic resale platform" : "");
    const queries = hooks.buildLiveSearchQueries(identity, route, identity.exactProductIdentity, intake);
    const plan = hooks.buildSerperSearchPlan({
      searchQueries: queries,
      sourceRoute: route,
      identity,
      buyerIntake: intake,
      notes: identity.exactProductIdentity,
      objectMindState: state
    }).filter((record) => record.validationPassed !== false);
    const providerQuery = plan[0];
    const payload = hooks.createQueryBoundLiveSearchPayload({
      model: "synthetic-model",
      platform: purchaseIntent === "resale" ? "Synthetic resale platform" : "",
      notes: identity.exactProductIdentity,
      identity,
      sourceRoute: route,
      queryRecord: providerQuery,
      buyerIntake: intake,
      researchPurpose: purchaseIntent === "seller_listing" ? "listing" : "buyer_decision"
    });
    return { route, plan, payload };
  });

  assert.equal(new Set(variants.map((variant) => JSON.stringify(variant.route))).size, 1);
  assert.equal(new Set(variants.map((variant) => JSON.stringify(variant.plan))).size, 1);
  assert.equal(new Set(variants.map((variant) => JSON.stringify(variant.payload))).size, 1);
  const prompt = JSON.stringify(variants[0].payload);
  assert.doesNotMatch(prompt, /purchase_intent|Worth Buying|Generate Listing|resale platform/i);
  assert.match(prompt, /purpose-neutral|source-candidate acquisition/i);
});

test("source-backed identifiers and independent discriminators lead bounded purpose-neutral queries", () => {
  const identifierState = stateFor(syntheticIdentity());
  assert.equal(identifierState.searchPlan[0].queryType, "EXACT_BRAND_MODEL");
  assert(identifierState.searchPlan[0].exactVisibleFactsUsed.length > 0);

  const discriminatorState = stateFor({
    brand: "Cobalt Workshop",
    exactProductIdentity: "Cobalt Workshop Meridian Dial",
    exactProductConfidence: "Medium",
    subjectIdentity: "Mechanical display dial",
    visibleText: ["Cobalt Workshop", "Meridian Series"],
    diagnosticVisualDetails: ["crescent pointer", "six brass index tabs"],
    visualRecognition: {
      visualSubject: "Mechanical display dial",
      visibleWords: ["Cobalt Workshop", "Meridian Series"],
      distinctiveFeatures: ["crescent pointer", "six brass index tabs"]
    }
  });
  assert(discriminatorState.searchPlan.some((record) => (
    record.exactVisibleFactsUsed.length >= 2
    && /EXACT_VISIBLE_PHRASE|HYPOTHESIS_DISAMBIGUATION|EXACT_MAKER_OBJECT_TYPE/.test(record.queryType)
  )));
  assert(discriminatorState.searchPlan.every((record) => record.providerLane === "purpose_neutral_exact"));
  assert(identifierState.searchPlan.length <= 12 && discriminatorState.searchPlan.length <= 12);
});
