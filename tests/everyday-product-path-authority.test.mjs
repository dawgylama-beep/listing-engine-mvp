import assert from "node:assert/strict";
import test from "node:test";

import { buildBrowserHandlerResponse } from "./helpers/build-browser-handler-response.mjs";

function deterministicPhoto(name) {
  return {
    name,
    dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x5a).toString("base64")}`
  };
}

function cognitiveDiagnostics(result) {
  return result.report.searchDiagnostics?.cognitiveGovernor || {};
}

function assertAuthoritativeTerminalResult(result) {
  const diagnostics = cognitiveDiagnostics(result);
  const memory = diagnostics.governedLearning || {};
  assert.equal(diagnostics.terminalStatus, "COMPLETE");
  assert.equal(diagnostics.purposeJudgmentAllowed, true);
  assert.equal(memory.memoryStatus, "NOVEL");
  assert.deepEqual(memory.selectedLessonIds, []);
  assert.deepEqual(memory.appliedLessonIds, []);
  assert.equal(memory.nonReuseDecision, "NOVEL_OR_NO_APPLICABLE_MEMORY");
  assert.equal(memory.providerLifecycleAuthority, false);
  assert.match(memory.memoryTransitionHash, /^[a-f0-9]{64}$/);
  assert.equal(result.metadata.unexpectedNodeNetworkAttempts.length, 0);
  assert.equal(result.metadata.finalizerExecutions, 1);
}

test("ordinary antique, wearable, and household requests preserve canonical identity, condition, evidence, and memory authority", async (t) => {
  await t.test("antique or collectible with insufficient value evidence stops honestly", async () => {
    const result = await buildBrowserHandlerResponse({
      evidenceMode: "collectible",
      requestBody: {
        analysisId: "everyday-antique-owner-value",
        reportType: "marketValue",
        notes: "Painted commemorative metal serving tray with visible championship wording and light edge wear.",
        photos: [deterministicPhoto("commemorative-tray.jpg")],
        buyerIntake: {
          purchase_intent: "owner_value",
          purchase_context: "owned_item",
          item_name: "commemorative metal serving tray",
          item_condition: "vintage",
          condition_concerns: ["stains_or_wear"],
          buyer_notes: "Exact date and maker are not independently confirmed."
        }
      }
    });

    assert.equal(result.report.identifiedItem, "commemorative metal serving tray");
    assert.equal(result.report.subjectIdentity, "Riverton Falcons 1999 Champions collector tray");
    assert.deepEqual(result.report.conditionNotes, [
      "Reported condition: Vintage.",
      "Reported condition concern: Stains or wear."
    ]);
    assert.equal(result.report.valuationEvidenceState, "single_observation");
    assert.equal(result.report.fairValueNotEstablished, "Fair Value: Not established");
    assert.equal(result.report.recommendation, "Owner Value Assessment");
    assert.equal(result.report.identificationConfidence.includes("provider claim"), false);
    assert.match(result.report.pricingConfidence, /^Low -/);
    assert(result.report.whatIsKnown.some((value) => value.includes("commemorative metal serving tray")));
    assert(result.report.whatIsStillUnknown.some((value) => /Date or era/i.test(value)));
    assertAuthoritativeTerminalResult(result);
  });

  await t.test("wearable listing refuses provider-authored identity and condition contradictions", async () => {
    const result = await buildBrowserHandlerResponse({
      evidenceMode: "wearable",
      requestBody: {
        analysisId: "everyday-wearable-listing",
        reportType: "listing",
        platform: "Facebook Marketplace",
        notes: "Navy merino quarter-zip sweater with light cuff wear.",
        photos: [deterministicPhoto("navy-quarter-zip.jpg")],
        sellerIntake: {
          purchase_intent: "seller_listing",
          purchase_context: "owned_item",
          item_name: "Northline merino quarter-zip sweater",
          known_brand: "Northline",
          known_model: "USW-472",
          item_condition: "used_good",
          condition_concerns: ["stains_or_wear"],
          fulfillment_preference: "local_pickup",
          selling_speed: "balanced",
          buyer_notes: "Size M; light cuff wear; no holes seen."
        }
      }
    });

    assert.equal(result.report.identifiedItem, "Northline merino quarter-zip sweater");
    assert.equal(result.report.optimizedListingTitle, "Northline merino quarter-zip sweater");
    assert.equal(result.report.title, "Northline merino quarter-zip sweater");
    assert.equal(result.report.identifiedItem.includes("ceramic table lamp"), false);
    assert.equal(result.report.identificationConfidence.includes("provider claim"), false);
    assert.deepEqual(result.report.conditionNotes, [
      "Reported condition: Used good.",
      "Reported condition concern: Stains or wear."
    ]);
    assert.match(result.report.pricingConfidence, /^Medium -/);
    assert(result.report.whatIsKnown.some((value) => value.includes("USW-472")));
    assert(result.report.whatIsStillUnknown.includes("Exact season"));
    assert.deepEqual(result.metadata.schemas, ["item_identity", "marketplace_listing"]);
    assertAuthoritativeTerminalResult(result);
  });

  await t.test("ordinary household purchase returns a bounded current-retail decision", async () => {
    const result = await buildBrowserHandlerResponse({
      evidenceMode: "retail",
      requestBody: {
        analysisId: "everyday-household-retail",
        reportType: "marketValue",
        notes: "Sealed box of 48 privacy envelopes for ordinary household use.",
        photos: [deterministicPhoto("privacy-mailers.jpg")],
        buyerIntake: {
          purchase_intent: "personal_use",
          purchase_context: "retail_store",
          item_name: "Cedarline Privacy Mailers",
          known_brand: "Cedarline",
          known_upc: "012345678905",
          asking_price: "$5.50",
          item_condition: "new",
          store_name: "Example Office Store",
          buyer_notes: "Sealed box; price label says $5.50."
        }
      }
    });

    assert.equal(result.report.identifiedItem, "Cedarline Privacy Mailers, 48-count (UPC 012345678905)");
    assert.deepEqual(result.report.conditionNotes, ["Reported condition: New."]);
    assert.equal(result.report.valuationEvidenceState, "current_retail");
    assert.equal(result.report.recommendation, "Wait for a Better Price");
    assert.equal(result.report.identificationConfidence.includes("provider claim"), false);
    assert.match(result.report.currentRetailPriceAssessment, /\$4\.49-\$4\.99/);
    assert.match(result.report.pricingConfidence, /^Medium -/);
    assert(result.report.whatIsKnown.some((value) => value.includes("UPC 012345678905")));
    assert(result.report.whatIsStillUnknown.some((value) => /Date or era/i.test(value)));
    assertAuthoritativeTerminalResult(result);
  });
});
