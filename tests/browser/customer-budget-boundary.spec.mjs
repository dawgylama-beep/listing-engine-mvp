import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createGenerateListingHandler } from "../../api/generate-listing.js";
import { buildControlledCustomerModelCorroborationReport, controlledBrowserModelResponse } from "../helpers/build-browser-handler-response.mjs";
import { installHardNetworkDenial } from "../helpers/hard-network-denial.mjs";

const source = {
  title: "Nutella hazelnut spread product guide",
  url: "https://controlled.example/reference/nutella-spread",
  snippet: "Synthetic brand-level reference: Nutella is a hazelnut cocoa spread; jar size, condition, and price are unavailable."
};

function captureResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

async function uploadPhoto(page) {
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const context = canvas.getContext("2d");
    context.fillStyle = "#ddd5c8";
    context.fillRect(0, 0, 160, 120);
    context.fillStyle = "#514b45";
    context.fillRect(38, 24, 86, 70);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#photos").setInputFiles({
    name: "synthetic-incomplete-retail-jar.png",
    mimeType: "image/png",
    buffer: Buffer.from(encoded, "base64")
  });
}

test("customer sees an honest budget stop after relevant controlled research", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const prior = await buildControlledCustomerModelCorroborationReport();
  const providerPurposes = [];
  const budgetObservations = [];
  const sentQueries = [];
  const returnedSources = [];
  const networkAttempts = [];
  let analysisRequests = 0;
  let countRequests = 0;
  let handlerResult = null;

  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "synthetic-not-a-credential",
    getOpenAIModel: () => "gpt-4.1-mini",
    getVisualIdentityModel: () => "gpt-5.6-luna",
    getSerperApiKey: () => "",
    getWebsiteCognitionMode: () => "DISABLED",
    usesAuthenticatedExactInputTokenCounting: true,
    createAnalysisId: () => "analysis-controlled-budget-stop",
    requestOpenAIInputTokenCount: async () => {
      countRequests += 1;
      return { input_tokens: 350000 };
    },
    requestOpenAIJson: async ({ payload }) => {
      const purpose = payload.text.format.name;
      providerPurposes.push(purpose);
      if (purpose !== "live_comparable_search") {
        assert.equal(purpose, "item_identity", "the final model request must not be dispatched");
        return { json: controlledBrowserModelResponse(purpose, "retail-incomplete"), data: { output: [] }, statusCode: 200 };
      }
      const query = (payload.input?.[1]?.content?.[0]?.text || "").match(/Search query to execute exactly:\s*(.+)/)?.[1]?.trim() || "";
      sentQueries.push(query);
      returnedSources.push({ query, ...source });
      const result = {
        liveSearchStatus: "Live Search Completed - Reference Found",
        comparableItemsFound: [],
        strongComparables: [],
        partialComparables: [],
        itemIdentificationEvidence: [`${source.title} — brand-level documentation only; no exact package identification or price.`],
        referenceResults: [],
        weakMatches: [],
        rejectedMatches: [],
        noReliableMatchesReason: "The guide does not identify this photographed package size or establish a transaction price.",
        searchEvidenceSummary: "A relevant brand guide was found; exact package and value remain unverified."
      };
      return {
        json: result,
        data: { output: [
          { type: "web_search_call", action: { query, sources: [source] } },
          { type: "message", content: [{ type: "output_text", text: JSON.stringify(result), annotations: [{ type: "url_citation", title: source.title, url: source.url }] }] }
        ] },
        statusCode: 200
      };
    },
    requestBoundedRetailProductPage: async () => ({ statusCode: 404, html: "" }),
    onModelRequestBudget: (observation) => budgetObservations.push(observation)
  });

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1") return route.abort("blockedbyclient");
    if (url.pathname === "/api/customer-account") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ account: null }) });
    }
    return route.continue();
  });
  await page.route("**/api/generate-listing", async (route) => {
    analysisRequests += 1;
    const response = captureResponse();
    const networkGuard = installHardNetworkDenial();
    try {
      await handler({ method: "POST", body: route.request().postDataJSON() }, response);
    } finally {
      networkAttempts.push(...networkGuard.attempts);
      networkGuard.restore();
    }
    handlerResult = { statusCode: response.statusCode, payload: response.payload };
    await route.fulfill({ status: response.statusCode, contentType: "application/json", body: JSON.stringify(response.payload) });
  });

  await page.goto("/");
  await page.evaluate((report) => {
    latestReport = report;
    latestSections = getSectionsForReport(workflowConfigs[currentWorkflow], report);
    renderReport(report, latestSections);
  }, prior);
  await expect(page.locator(".report-root")).toContainText("Acme Workshop HW-42");
  await uploadPhoto(page);
  await page.locator("#purchase_context").selectOption("online_retailer");
  await page.locator("#retailer_or_marketplace_name").fill("Controlled retailer");
  await page.locator("#asking_price").fill("10.00");
  await page.locator("#notes").fill("Nutella hazelnut cocoa spread jar; net weight and barcode are not visible.");
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => analysisRequests).toBe(1);
  await expect(page.locator("#workflow-submit-button")).toBeEnabled({ timeout: 60_000 });

  const visible = {
    status: await page.locator("#status").innerText(),
    result: await page.locator("#results").innerText(),
    reportCount: await page.locator(".report-root").count(),
    saveVisible: await page.locator("#save-listing-button").isVisible(),
    ariaBusy: await page.locator("#results").getAttribute("aria-busy")
  };
  const evidence = {
    kind: "CONTROLLED_PROVIDER_BUDGET_BOUNDARY",
    priorReportWasControlledHandlerOutput: true,
    sourceIsSynthetic: true,
    source,
    analysisRequests,
    countRequests,
    providerPurposes,
    sentQueries,
    returnedSources,
    budgetObservations,
    handlerResult,
    networkAttempts,
    visible
  };
  await fs.writeFile(testInfo.outputPath("budget-boundary.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");

  assert.equal(networkAttempts.length, 0);
  assert.equal(analysisRequests, 1);
  assert.ok(returnedSources.length > 0, "controlled research must have returned a relevant reference");
  assert.equal(handlerResult.statusCode, 502);
  assert.equal(handlerResult.payload.code, "ANALYSIS_SPENDING_LIMIT_REACHED");
  assert.equal(handlerResult.payload.diagnostics.modelExecutionBudget.modelGenerationRequestCount, providerPurposes.length);
  assert.ok(handlerResult.payload.diagnostics.modelExecutionBudget.reservedSpendingDollars <= 2.5);
  assert.ok(handlerResult.payload.diagnostics.terminalFailure.partialProviderRecords.every((record) => record.physicalRetryAttemptCount === 0));
  assert.equal(providerPurposes.includes("consumer_purchase_decision"), false);
  assert.equal(visible.ariaBusy, "false");
  assert.equal(visible.reportCount, 0);
  assert.equal(visible.saveVisible, false);
  assert.doesNotMatch(visible.result, /Acme Workshop HW-42|Nutella hazelnut spread product guide/);
  assert.match(visible.status, /spending limit/i);
  assert.match(visible.status, /no completed report or value assessment/i);
  assert.match(visible.status, /no(?:thing will)? retry automatically/i);
  assert.match(visible.status, /photos are still selected/i);
  assert.match(visible.status, /contact your private-beta support/i);
});
