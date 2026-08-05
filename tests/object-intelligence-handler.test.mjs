import assert from "node:assert/strict";
import test from "node:test";
import { createGenerateListingHandler } from "../api/generate-listing.js";
import { computeCheckDigit } from "../lib/evidence/identity.js";
import { validateFinalEvidenceResult } from "../lib/evidence/index.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";
import { validateGovernorProof } from "../benchmarks/blind-object-v1-execution-v1/scripts/governor-proof-validator.mjs";

await import("../public/customer-evidence.js");
const { buildCustomerEvidenceViewModel } = globalThis.KatherinesEyeCustomerEvidence;

function responseCapture() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

function identityFixture(upc) {
  return {
    brand: "Sable Ridge",
    manufacturer: "Sable Ridge Instruments",
    model: "SR-12",
    upcBarcode: upc,
    productNameOrBoxTitle: "Sable Ridge SR-12 Pocket Hygrometer",
    exactProductIdentity: "Sable Ridge SR-12 Pocket Hygrometer 12 Count Display Box",
    exactProductConfidence: "High",
    subjectIdentity: "Pocket hygrometer display box",
    subjectConfidence: "High",
    category: "Environmental measurement device",
    packageQuantity: "12 count",
    color: "slate blue",
    material: "plastic and metal",
    shape: "rectangular handheld device",
    construction: "molded case with digital display",
    condition: "used",
    completeness: "device and display box present",
    accessories: [],
    diagnosticVisualDetails: ["round humidity dial icon", "SR-12 label"],
    additionalEvidenceNeeded: [],
    visibleText: ["Sable Ridge", "SR-12", "12 count", upc],
    strongestSearchableIdentifiers: [upc, "Sable Ridge SR-12"],
    identityConflictNotes: [],
    identityUnknowns: [],
    identityHypotheses: [{
      exactCandidateLabel: "Sable Ridge SR-12 Pocket Hygrometer 12 Count Display Box",
      broaderFamilyIdentity: "Sable Ridge pocket hygrometer",
      brandOrMaker: "Sable Ridge",
      model: "SR-12",
      variantPackageEditionDesign: "12 count display box",
      supportingObservations: ["Sable Ridge", "SR-12", "12 count", upc],
      contradictingObservations: [],
      unresolvedDiscriminators: [],
      distinguishingQueryOrObservation: [],
      exactnessLevel: "EXACT_CANDIDATE",
      confidenceBand: "HIGH"
    }],
    visualRecognition: {
      visualSubject: "Pocket hygrometer display box",
      visualSubjectCategory: "environmental measurement device",
      visualSubjectConfidence: "High",
      recognizedOrganization: "Not verified",
      recognizedBrand: "Sable Ridge",
      recognizedCharacter: "Not verified",
      recognizedInstitution: "Not verified",
      recognizedTheme: "measurement",
      visibleLogos: ["Sable Ridge"],
      visibleLetters: ["SR-12"],
      visibleWords: ["Sable Ridge", "SR-12", "12 count", upc],
      visibleColors: ["slate blue"],
      visualStyle: "retail display packaging",
      estimatedEraStyle: "current",
      distinctiveFeatures: ["round humidity dial icon"],
      visualEvidence: ["device and display box present"],
      possibleInterpretations: [],
      visualConflicts: [],
      stillUnknown: [],
      userEvidenceReconciliation: "Object clues agree with the visible label.",
      visualSummary: "Sable Ridge SR-12 pocket hygrometer display box."
    }
  };
}

function finalModelResponse(schemaName, exactIdentity) {
  if (schemaName === "consumer_purchase_decision") {
    return {
      identifiedItem: exactIdentity,
      identificationConfidence: "Model identity output must be reconciled.",
      pricingConfidence: "Model pricing output must be reconciled.",
      recommendation: "Model recommendation must be reconciled.",
      valueRating: "Model badge must be reconciled.",
      reasonsToBuy: [],
      reasonsForCaution: [],
      productOrConditionRisks: [],
      betterValueConsiderations: [],
      additionalInformationNeeded: []
    };
  }
  if (schemaName === "market_value_report") {
    return {
      identifiedItem: exactIdentity,
      identificationConfidence: "Model identity output must be reconciled.",
      suggestedListingPrice: "$18.00",
      expectedSalePrice: "$15.00",
      minimumAcceptablePrice: "$12.00",
      recommendedSellingPlatform: "Synthetic local marketplace",
      expectedSellingTime: "Unknown",
      platformSpecificSellingGuidance: "Use verified evidence.",
      reasonsToBuy: [],
      reasonsForCaution: [],
      productOrConditionRisks: [],
      betterValueConsiderations: [],
      additionalInformationNeeded: []
    };
  }
  if (schemaName === "marketplace_listing") {
    return {
      optimizedListingTitle: exactIdentity,
      title: exactIdentity,
      listingDescription: "Synthetic listing draft based on the submitted object.",
      description: "Synthetic listing draft based on the submitted object.",
      itemSpecifics: ["Brand: Sable Ridge", "Model: SR-12", "Package: 12 count"],
      itemDetails: ["Brand: Sable Ridge", "Model: SR-12", "Package: 12 count"],
      conditionNotes: ["Used condition shown."],
      recommendedListingPrice: "$18.00",
      suggestedOfferRange: "$12.00-$18.00",
      pricingConfidence: "Model pricing output must be reconciled.",
      categorySuggestion: "Environmental measurement device",
      suggestedSellingPlatform: "Synthetic local marketplace",
      additionalInformationNeeded: []
    };
  }
  throw new Error(`Unexpected deterministic final schema: ${schemaName}`);
}

test("the real handler preserves purpose-neutral identity, canonical response fields, and Experience Record compatibility across all four purposes", async () => {
  const body = "76123456789";
  const upc = `${body}${computeCheckDigit(body)}`;
  const identity = identityFixture(upc);
  const purposes = [
    { name: "personal", reportType: "marketValue", purchaseIntent: "personal_use", envelope: "valuation", expectedPurpose: "personal" },
    { name: "resale", reportType: "marketValue", purchaseIntent: "resale", envelope: "valuation", expectedPurpose: "resale" },
    { name: "owner value", reportType: "marketValue", purchaseIntent: "owner_value", envelope: "valuation", expectedPurpose: "owner_value" },
    { name: "listing", reportType: "listing", purchaseIntent: "seller_listing", envelope: "listing", expectedPurpose: "seller_listing" }
  ];
  const identityHashes = [];
  const finalPurposes = [];
  const identityPrompts = [];
  const reports = [];
  const cognitiveDiagnostics = [];
  const networkGuard = installHardNetworkDenial();
  try {
    for (const scenario of purposes) {
      const finalEvidenceResults = [];
      const directPageRequests = [];
      const handler = createGenerateListingHandler({
        getOpenAIApiKey: () => "deterministic-openai-placeholder",
        getOpenAIModel: () => "deterministic-test-model",
        getSerperApiKey: () => "deterministic-serper-placeholder",
        createAnalysisId: () => `synthetic-${scenario.name.replace(/\s+/g, "-")}`,
        requestOpenAIJson: async ({ payload }) => {
          const schemaName = payload?.text?.format?.name;
          if (schemaName === "item_identity") {
            const text = (payload.input || []).flatMap((message) => message.content || [])
              .filter((item) => item.type === "input_text")
              .map((item) => String(item.text || ""))
              .join("\n");
            identityPrompts.push(text);
            return { json: identity, data: { output: [] } };
          }
          return { json: finalModelResponse(schemaName, identity.exactProductIdentity), data: { output: [] } };
        },
        requestSerperSearch: async () => ({
          json: {
            organic: [
              {
                position: 1,
                title: `${identity.exactProductIdentity} ${upc}`,
                link: `https://www.amazon.com/product/${upc}`,
                snippet: "Current product page price $14.00. Exact 12 count display box."
              },
              {
                position: 2,
                title: `${identity.exactProductIdentity} ${upc}`,
                link: `https://merchant-two.example/product/${upc}`,
                snippet: "Independent current product page price $15.00. Exact 12 count display box."
              },
              {
                position: 3,
                title: "Sable Ridge SR-12 Pocket Hygrometer 6 Count Display Box",
                link: "https://www.amazon.com/product/sable-ridge-six-count",
                snippet: "Current product page price $9.00. Six count package."
              },
              {
                position: 4,
                title: `${identity.exactProductIdentity} search results`,
                link: `https://catalog.example/search?q=${upc}`,
                snippet: "Search category page mentioning an exact-looking title and price $13.00."
              }
            ]
          },
          statusCode: 200,
          elapsedMs: 1
        }),
        requestBoundedRetailProductPage: async (url) => {
          directPageRequests.push(url);
          return {
            finalUrl: url,
            statusCode: 200,
            elapsedMs: 1,
            html: `<html>${identity.exactProductIdentity} ${upc} current price $14.00</html>`,
            sourceEvidenceText: `${identity.exactProductIdentity} ${upc}. Exact 12 count display box. Current price $14.00.`
          };
        },
        onFinalEvidenceResult: (result) => finalEvidenceResults.push(result)
      });
      const intake = {
        purchase_intent: scenario.purchaseIntent,
        buyer_intent: scenario.purchaseIntent,
        purchase_context: "private_seller",
        item_name: identity.exactProductIdentity,
        known_brand: identity.brand,
        known_manufacturer: identity.manufacturer,
        known_model: identity.model,
        known_upc: upc,
        asking_price: "$15.00",
        item_condition: "used",
        item_completeness: "device and display box present",
        buyer_notes: identity.exactProductIdentity,
        store_name: "Example Depot",
        location_zip: "90210"
      };
      const requestBody = {
        reportType: scenario.reportType,
        platform: scenario.reportType === "listing" ? "Synthetic Market" : "",
        notes: identity.exactProductIdentity,
        photos: [{ name: "synthetic-hygrometer.png", dataUrl: "data:image/png;base64,iVBORw0KGgo=" }],
        ...(scenario.reportType === "listing" ? { sellerIntake: intake } : { buyerIntake: intake })
      };
      const response = responseCapture();
      await handler({ method: "POST", body: requestBody }, response);
      assert.equal(response.statusCode, 200, scenario.name);
      assert.equal(finalEvidenceResults.length, 1, scenario.name);
      validateFinalEvidenceResult(finalEvidenceResults[0]);
      finalPurposes.push(finalEvidenceResults[0].decisionResult.purpose);
      const report = response.payload[scenario.envelope];
      reports.push(report);
      const diagnostics = report.searchDiagnostics?.objectIntelligence;
      assert(diagnostics, `${scenario.name} object diagnostics missing`);
      assert.match(diagnostics.identityStateHash, /^[a-f0-9]{64}$/);
      assert.match(diagnostics.experienceRecord?.experienceRecordHash || "", /^[a-f0-9]{64}$/);
      identityHashes.push(diagnostics.identityStateHash);
      const cognitive = report.searchDiagnostics?.cognitiveGovernor;
      assert(cognitive, `${scenario.name} Cognitive Governor diagnostics missing`);
      assert.equal(cognitive.objectMindStateId, diagnostics.objectStateId);
      assert.equal(cognitive.objectMindSemanticHash, diagnostics.identityStateHash);
      assert.match(cognitive.knowledgeStateHash, /^[a-f0-9]{64}$/);
      assert.match(cognitive.cognitiveStateHash, /^[a-f0-9]{64}$/);
      assert.equal(cognitive.terminalStatus, "COMPLETE");
      assert.equal(cognitive.directPageCapacity.maximum, 2);
      assert(cognitive.providerCapacity.maximum === 12 || cognitive.providerCapacity.maximum === 28);
      assert.equal(cognitive.cognitiveEpisode.linkedExperienceRecordHash, diagnostics.experienceRecord.experienceRecordHash);
      assert.match(cognitive.cognitiveEpisode.cognitiveEpisodeHash, /^[a-f0-9]{64}$/);
      assert.equal(cognitive.lessonCandidate ?? null, null);
      const proofValidation = validateGovernorProof({
        proof: cognitive.executionProof,
        cognitiveEpisode: cognitive.cognitiveEpisode,
        lessonCandidate: cognitive.lessonCandidate,
        experienceRecord: diagnostics.experienceRecord
      });
      assert.equal(proofValidation.passed, true, `${scenario.name}: ${JSON.stringify(proofValidation.failures)}`);
      assert.equal(cognitive.executionProof.governorInvocationCount, 1);
      assert.equal(cognitive.executionProof.authoritativeCognitiveStateCount, 1);
      assert.equal(cognitive.executionProof.unauthorizedActionCount, 0);
      const actionTypes = cognitive.cognitiveEpisode.actionDecisions.map((record) => record.actionType);
      assert.equal(actionTypes[0], "ACQUIRE_INITIAL_EVIDENCE");
      assert(actionTypes.includes("FINALIZE_EVIDENCE"));
      assert(actionTypes.includes("PROCEED_TO_PURPOSE_JUDGMENT"));
      assert.equal(actionTypes.at(-1), "STOP_COMPLETE");
      assert(
        actionTypes.indexOf("FINALIZE_EVIDENCE") < actionTypes.indexOf("PROCEED_TO_PURPOSE_JUDGMENT"),
        `${scenario.name} purpose judgment preceded canonical finalization`
      );
      for (const action of cognitive.cognitiveEpisode.actionDecisions) {
        assert(action.inputCognitiveStateHash);
        assert(action.actionSignature);
        assert(action.reasonCodes.length);
        assert(action.outcomeCode);
        assert(action.outputCognitiveStateHash);
        assert.equal(typeof action.materialKnowledgeChanged, "boolean");
      }
      cognitiveDiagnostics.push(cognitive);
      assert.equal(report.analysisId, `synthetic-${scenario.name.replace(/\s+/g, "-")}`);
      assert(Array.isArray(report.customerEvidence));
      assert(report.customerEvidenceSummary && typeof report.customerEvidenceSummary === "object");
      assert.equal(new Set(report.customerEvidence.map((record) => record.sourceLabel)).size, 2);
      assert.equal(directPageRequests.length, 2);
      const exactAccepted = finalEvidenceResults[0].acceptedRecords.filter((record) => (
        record.objectMindClassification === "EXACT_ITEM" && record.customerEligible
      ));
      assert.equal(new Set(exactAccepted.map((record) => record.sourceDomain)).size, 2);
      for (const record of exactAccepted) {
        assert.equal(record.objectMindVerificationState, "VERIFIED");
        assert(record.objectMindSourceId);
        assert(record.sourceRecordId);
        assert(record.destinationUrl);
        assert(Number.isFinite(record.price));
        assert(record.fieldProvenance && typeof record.fieldProvenance === "object");
        assert(record.qualification && typeof record.qualification === "object");
      }
      assert.doesNotMatch(JSON.stringify(finalEvidenceResults[0].customerEvidence), /catalog\.example\/search/i);
      assert.doesNotMatch(JSON.stringify(finalEvidenceResults[0].acceptedRecords), /catalog\.example\/search/i);
      assert.doesNotMatch(JSON.stringify(finalEvidenceResults[0].customerEvidence), /sable-ridge-six-count|6 Count Display Box/i);
      assert.doesNotMatch(JSON.stringify(finalEvidenceResults[0].acceptedRecords), /sable-ridge-six-count|6 Count Display Box/i);
      const serializedBefore = JSON.stringify(report);
      const view = buildCustomerEvidenceViewModel(report.customerEvidence, report.customerEvidenceSummary);
      assert.equal(view.status, "ready");
      assert.equal(JSON.stringify(report), serializedBefore, "customer evidence projection mutated the response");
      const reportWithoutRecord = structuredClone(report);
      delete reportWithoutRecord.searchDiagnostics.objectIntelligence;
      const absentView = buildCustomerEvidenceViewModel(reportWithoutRecord.customerEvidence, reportWithoutRecord.customerEvidenceSummary);
      assert.equal(absentView.status, "ready", "frontend compatibility failed when object diagnostics were absent");
    }
  } finally {
    networkGuard.restore();
  }

  assert.deepEqual(finalPurposes, purposes.map((scenario) => scenario.expectedPurpose));
  assert.equal(new Set(identityHashes).size, 1, "purpose changed the pre-advice identity-state hash");
  assert.equal(new Set(cognitiveDiagnostics.map((record) => record.knowledgeStateHash)).size, 1, "purpose changed governed knowledge");
  const identityEvidenceActionTypes = new Set([
    "ACQUIRE_INITIAL_EVIDENCE",
    "REFINE_EVIDENCE_SEARCH",
    "VERIFY_DIRECT_PAGE",
    "FINALIZE_EVIDENCE"
  ]);
  const governedIdentitySequences = cognitiveDiagnostics.map((record) => record.cognitiveEpisode.actionDecisions
    .filter((action) => identityEvidenceActionTypes.has(action.actionType))
    .map((action) => ({ actionType: action.actionType, targetIdentity: action.targetIdentity, reasonCodes: action.reasonCodes })));
  for (const sequence of governedIdentitySequences.slice(1)) {
    assert.deepEqual(sequence, governedIdentitySequences[0]);
  }
  assert.equal(identityPrompts.length, 4);
  for (const prompt of identityPrompts) {
    assert.doesNotMatch(prompt, /personal_use|owner_value|seller_listing|\bresale\b|\$15\.00|Example Depot|90210|Synthetic Market/i);
    assert.match(prompt, /Sable Ridge SR-12 Pocket Hygrometer/i);
  }
  assert(reports.every((report) => report.searchDiagnostics.objectIntelligence.experienceRecord.subsystemOutcomeFlags.refinementCount <= 1));
});
