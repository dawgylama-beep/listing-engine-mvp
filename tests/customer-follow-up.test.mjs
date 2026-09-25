import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { buildBrowserHandlerResponse } from "./helpers/build-browser-handler-response.mjs";

export function mechanicalFollowUpInput(overrides = {}) {
  return {
    reportType: "marketValue",
    platform: "",
    notes: "The seller says the maker is Acme Workshop and the model is HW-42. I have not verified the label.",
    photos: [{ name: "controlled-mechanism.jpg", dataUrl: `data:image/jpeg;base64,${Buffer.alloc(2048, 0x5a).toString("base64")}` }],
    buyerIntake: {
      purchase_intent: "personal_use", buyer_intent: "personal_use",
      purchase_context: "private_seller", asking_price: "$5.50",
      known_brand: "Acme Workshop", known_model: "HW-42", item_condition: "unknown",
      ...overrides
    }
  };
}

export async function captureFollowUp(input, name, evidenceMode = "unidentified") {
  const evidence = await buildBrowserHandlerResponse({ requestBody: input, evidenceMode });
  if (process.env.KATHERINE_FOLLOW_UP_EVIDENCE_ROOT) {
    const root = path.resolve(process.env.KATHERINE_FOLLOW_UP_EVIDENCE_ROOT);
    await mkdir(root, { recursive: true });
    await writeFile(path.join(root, `${name}.json`), `${JSON.stringify({
      classification: "CONTROLLED_PROVIDER_EVIDENCE_NOT_LIVE_REASONING",
      originalInput: input,
      modelFixture: "retained unidentified fixture, unchanged",
      report: evidence.report,
      metadata: evidence.metadata
    }, null, 2)}\n`);
  }
  return evidence;
}

test("mechanical follow-up verifies supplied maker/model rather than requesting them again", async () => {
  const evidence = await captureFollowUp(mechanicalFollowUpInput(), "supplied-maker-model");
  const { report, metadata } = evidence;
  assert.deepEqual(metadata.unexpectedNodeNetworkAttempts, []);
  assert.equal(metadata.finalizerExecutions, 1);
  assert.match(report.identificationConfidence, /^Insufficient\b/);
  assert.equal(report.customerEvidence.length, 0);
  assert.match(report.customerMissingDetails[0], /verify the details you entered/i);
  assert(!report.customerMissingDetails.some(detail => /^The model or part number/.test(detail)));
  assert(report.customerMissingDetails.some(detail => /what moves/.test(detail)));
  assert.match(report.customerConfidenceSummary.exactItem, /verify the details you entered/i);
  assert(!/Exact item: High/.test(report.customerConfidenceSummary.exactItem));
});

test("missing or explicitly unknown maker/model retain their original identification questions", async () => {
  const evidence = await captureFollowUp(mechanicalFollowUpInput({ known_brand: "unknown", known_model: "not verified" }), "unknown-maker-model");
  assert.deepEqual(evidence.report.customerMissingDetails, [
    "Close photos of every maker’s mark, logo, stamp, or patent number.",
    "The model or part number, if one appears on the base, back, or moving parts.",
    "A full side view beside a ruler, plus what moves when the handle or mechanism is operated."
  ]);
  assert(!evidence.metadata.customerSearchTrace.sanitizedQueries.some(query => /not verified|\bunknown\b/i.test(query)));
  assert.deepEqual(evidence.metadata.unexpectedNodeNetworkAttempts, []);
});

test("customer-reported model reaches research without becoming unsupported identity or value", async () => {
  const evidence = await captureFollowUp(mechanicalFollowUpInput(), "supplied-maker-model-research");
  const { report, metadata } = evidence;
  const modelQuery = metadata.customerSearchTrace.sanitizedQueries.find(query => /\bHW-42\b/i.test(query));

  assert(modelQuery, "expected a sanitized research query containing the customer-reported model");
  assert.match(modelQuery, /Acme Workshop/i);
  assert.match(modelQuery, /hand-cranked metal mechanism/i);
  assert.equal(report.exactProductIdentity, "Not verified");
  assert.match(report.identificationConfidence, /^Insufficient\b/);
  assert.equal(report.customerEvidence.length, 0);
  assert.equal(report.valuationEvidenceState, "insufficient");
  assert.equal(report.fairValue, "Not established");
  assert(!report.whatIsKnown.some(item => /Source corroboration:/i.test(item)));
  assert.doesNotMatch(report.customerConfidenceSummary.exactItem, /museum|coffee grinder|corroborat/i);
  assert(metadata.customerSearchTrace.rejectionReasons.some(({ reason }) => (
    /broad category or partial visual similarity/i.test(reason)
  )));
  assert.deepEqual(metadata.unexpectedNodeNetworkAttempts, []);
});

test("independent model reference reaches the customer report without inventing price support", async () => {
  const evidence = await captureFollowUp(
    mechanicalFollowUpInput(),
    "supplied-model-corroborating-reference-baseline",
    "customer-model-corroboration"
  );
  const { report, metadata } = evidence;
  const source = report.customerSourceFindings.find(({ destinationUrl }) => (
    destinationUrl === "https://support.acme-workshop.example/reference/hw-42"
  ));

  assert(source, "expected the model-specific source finding to retain its URL");
  assert.equal(source.sourceLabel, "support.acme-workshop.example");
  assert.equal(source.relationship, "Identity match");
  assert.match(source.whyItHelps, /supports the item identity/i);
  assert.equal(source.valuationUse, "Not used to set a price.");
  assert(report.whatIsKnown.some(item => (
    /Source corroboration:.*Acme Workshop HW-42.*customer-reported.*does not verify the photographed item's label/i.test(item)
  )));
  assert.match(report.customerConfidenceSummary.exactItem, /mentions the customer-reported Acme Workshop HW-42/i);
  assert.match(report.customerConfidenceSummary.exactItem, /but it still needs a close photo of the maker\/model label/i);
  assert.equal(report.exactProductIdentity, "Not verified");
  assert.match(report.identificationConfidence, /^Insufficient\b/);
  assert.equal(report.customerEvidence.length, 0);
  assert.equal(report.valuationEvidenceState, "insufficient");
  assert.equal(report.fairValue, "Not established");
  assert(metadata.customerSearchTrace.returnedSourceReferences.some(({ url }) => url === source.destinationUrl));
  assert(metadata.customerSearchTrace.rejectionReasons.some(({ url, reason }) => (
    url === source.destinationUrl && /not a market transaction/i.test(reason)
  )));
  assert.deepEqual(evidence.metadata.unexpectedNodeNetworkAttempts, []);
});
