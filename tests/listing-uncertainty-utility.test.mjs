import assert from "node:assert/strict";
import test from "node:test";

import { __queryIntegrityTestHooks as hooks } from "../api/generate-listing.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

installHardNetworkDenial();

function supportedResearch({
  category,
  attributes = [],
  visibleColors = [],
  distinctiveFeatures = [],
  visualEvidence = [],
  possibleInterpretations = [],
  identityUnknowns = [],
  additionalEvidenceNeeded = []
}) {
  const canonicalResearchIdentity = {
    canonicalResearchIdentityId: `canonical-${category.replace(/\W+/g, "-").toLowerCase()}`,
    objectCategory: category,
    categoryConfidence: "MEDIUM",
    categoryObservationIds: ["observation-category"],
    ambiguityStatus: "CANONICAL_CATEGORY_ESTABLISHED",
    configurationAttributes: attributes.map((attribute, index) => ({
      ...attribute,
      observationIds: [`observation-attribute-${index + 1}`],
      provenance: attribute.provenance || "CANONICAL_VISIBLE_EVIDENCE"
    })),
    allowedHypothesisIds: ["candidate-broad"]
  };
  const identity = {
    canonicalResearchIdentity,
    subjectIdentity: category,
    makerIdentity: "Unsupported Exact Maker",
    year: "1899",
    authenticityStatus: "Authentic",
    identityUnknowns,
    additionalEvidenceNeeded,
    visualRecognition: {
      visualSubject: category,
      visualSubjectCategory: category,
      visualSubjectConfidence: "Medium",
      visibleColors,
      distinctiveFeatures,
      visualEvidence,
      possibleInterpretations,
      stillUnknown: ["Exact maker and date are not visible."]
    }
  };
  const objectMindState = {
    canonicalResearchIdentity,
    identityHypotheses: [{
      candidateId: "candidate-broad",
      broaderFamilyIdentity: possibleInterpretations[0] || category
    }]
  };
  return {
    executiveDisposition: "INSUFFICIENT_EVIDENCE",
    identity,
    objectMindState,
    executiveState: {
      currentIdentityResolutionStatus: "BROADER_FAMILY",
      unresolvedIdentityDiscriminators: identityUnknowns,
      executiveReadiness: {
        stopInsufficientReasonCodes: ["INSUFFICIENT_IDENTITY_SUPPORT", "INSUFFICIENT_PRICING_SUPPORT"],
        executiveBlockers: ["Exact identity and qualified pricing evidence remain unresolved."]
      },
      safetyState: {}
    },
    liveSearch: { searchDiagnostics: {} }
  };
}

test("bounded categories retain useful listing drafts across different incomplete-evidence combinations", async (t) => {
  const cases = [
    {
      name: "figurine group with unknown condition and price",
      research: supportedResearch({
        category: "porcelain figurine group",
        attributes: [
          { factType: "material", value: "glazed porcelain" },
          { factType: "shape", value: "standing grouped figures" },
          { factType: "design", value: "blue floral motif" }
        ],
        visibleColors: ["blue", "white"],
        distinctiveFeatures: ["raised floral details"],
        visualEvidence: ["Multiple standing figures are shown together."],
        possibleInterpretations: ["decorative figurine group", "tabletop ornament"],
        identityUnknowns: ["Maker, origin, date, and authenticity are unresolved."]
      }),
      categoryPattern: /porcelain figurine group/i,
      visiblePattern: /blue|glazed porcelain|floral/i,
      conditionPattern: /cannot be confirmed/i
    },
    {
      name: "woven textile with visible condition concern",
      research: supportedResearch({
        category: "woven textile wall hanging",
        attributes: [
          { factType: "construction", value: "woven rectangular panel" },
          { factType: "design", value: "geometric border motif" }
        ],
        visibleColors: ["rust", "navy"],
        distinctiveFeatures: ["tassels along the lower edge"],
        visualEvidence: ["Fraying is visible along one side edge."],
        possibleInterpretations: ["decorative wall textile", "small woven panel"],
        identityUnknowns: ["Fiber content and origin are unresolved."]
      }),
      categoryPattern: /woven textile wall hanging/i,
      visiblePattern: /rust|navy|geometric|tassels/i,
      conditionPattern: /fraying is visible/i
    },
    {
      name: "metal box with incomplete maker identity and pricing",
      research: supportedResearch({
        category: "small metal storage box",
        attributes: [
          { factType: "material", value: "cast metal" },
          { factType: "shape", value: "rectangular lidded form" }
        ],
        visibleColors: ["dark gray"],
        distinctiveFeatures: ["raised geometric lid pattern"],
        possibleInterpretations: ["decorative trinket box", "small desk box"],
        identityUnknowns: ["Maker and production date are unresolved."],
        additionalEvidenceNeeded: ["Photograph the underside mark straight on in even light."]
      }),
      categoryPattern: /small metal storage box/i,
      visiblePattern: /cast metal|rectangular|geometric/i,
      conditionPattern: /cannot be confirmed/i
    }
  ];

  for (const fixture of cases) {
    await t.test(fixture.name, () => {
      const report = hooks.buildControlledExecutiveReport(fixture.research, {
        workflow: "listing",
        platform: "eBay"
      });

      assert.equal(report.analysisStatus, "INSUFFICIENT_EVIDENCE");
      assert.equal(report.requestedPurposeComplete, false);
      assert.equal(report.executiveOutcome.purposeJudgmentRan, false);
      assert.equal(report.executiveOutcome.completedPurposeReportEmitted, false);
      assert.equal(report.executiveOutcome.safelySupportedListingDraftEmitted, true);
      assert.equal(report.executiveOutcome.pricingJudgmentWithheld, true);
      assert.match(report.categorySuggestion, fixture.categoryPattern);
      assert.match(report.optimizedListingTitle, fixture.categoryPattern);
      assert.match(report.listingDescription, fixture.visiblePattern);
      assert.match(report.conditionNotes.join(" "), fixture.conditionPattern);
      assert.equal(report.pricingStatus, "insufficient");
      assert.equal(report.pricingEvidenceState, "insufficient");
      assert.equal(report.recommendedListingPrice, "Not established");
      assert.equal(report.recommendedListingPriceState.amount, null);
      assert.match(report.listingDescription, /maker, origin, date, authenticity, model, and valuation are not established/i);
      assert.doesNotMatch(JSON.stringify(report), /Unsupported Exact Maker|1899|\$\d/);
      assert(report.whatIsKnown.length > 0);
      assert(report.whatIsStillUnknown.some((value) => /unverified|uncertain|unresolved|not visible/i.test(value)));
      assert(report.additionalInformationNeeded.some((value) => /maker mark|signature|stamp|label/i.test(value)));
      assert(report.researchNextSteps.some((value) => /qualified transaction evidence/i.test(value)));
      assert(report.searchLimitations.some((value) => /qualified transaction evidence/i.test(value)));
      assert(report.plausibleAlternatives.length > 0);
    });
  }
});

test("unsupported broad category keeps the full controlled refusal", () => {
  const research = supportedResearch({ category: "unresolved object" });
  research.identity.canonicalResearchIdentity.categoryConfidence = "INSUFFICIENT";
  research.identity.canonicalResearchIdentity.categoryObservationIds = [];

  const report = hooks.buildControlledExecutiveReport(research, {
    workflow: "listing",
    platform: "eBay"
  });

  assert.equal(report.analysisStatus, "INSUFFICIENT_EVIDENCE");
  assert.equal(report.title, "More information is needed");
  assert.equal(report.requestedPurposeComplete, false);
  assert.equal(report.executiveOutcome.completedPurposeReportEmitted, false);
  assert.equal("optimizedListingTitle" in report, false);
  assert.equal("listingDescription" in report, false);
  assert.equal("pricingStatus" in report, false);
});

test("safety and customer-input dispositions never emit an uncertainty listing", () => {
  const safetyResearch = supportedResearch({ category: "table lamp" });
  safetyResearch.executiveDisposition = "SAFETY_ONLY";
  safetyResearch.executiveState.safetyState = {
    mandatoryCustomerDisposition: "Disconnect power and obtain qualified inspection.",
    disposition: "SAFETY_ONLY"
  };
  const awaitingResearch = supportedResearch({ category: "table lamp" });
  awaitingResearch.executiveDisposition = "AWAITING_CUSTOMER_INPUT";
  awaitingResearch.cognitiveGovernor = {
    requestedCustomerInput: {
      requestedDetail: "Provide a clear photograph of the electrical label.",
      requestedFields: ["electrical label"]
    }
  };

  for (const research of [safetyResearch, awaitingResearch]) {
    const report = hooks.buildControlledExecutiveReport(research, {
      workflow: "listing",
      platform: "eBay"
    });
    assert.equal(report.requestedPurposeComplete, false);
    assert.equal(report.executiveOutcome.completedPurposeReportEmitted, false);
    assert.equal("optimizedListingTitle" in report, false);
    assert.equal("listingDescription" in report, false);
  }
});
