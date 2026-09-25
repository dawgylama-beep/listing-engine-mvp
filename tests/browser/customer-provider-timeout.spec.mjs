import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { __queryIntegrityTestHooks, createGenerateListingHandler } from "../../api/generate-listing.js";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";
import { installHardNetworkDenial } from "../helpers/hard-network-denial.mjs";
import { buildControlledCustomerModelCorroborationReport } from "../helpers/build-browser-handler-response.mjs";

const baseUrl = "http://127.0.0.1:4177";

function captureResponse() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = String(value); },
    json(value) { this.payload = value; return this; }
  };
}

for (const timeoutStage of ["generation", "input-token-count"]) {
test(`a controlled ${timeoutStage} timeout ends analysis without a stale or saveable report`, async ({ page, context }) => {
  test.setTimeout(120_000);
  const prior = await buildControlledCustomerModelCorroborationReport();
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store });
  const accountHandler = createCustomerAccountHandler({ service, environment: {} });
  const account = await service.register({ username: "timeout_fixture", password: "local fixture password 123" });
  await context.addCookies([{ name: "ke_beta_session", value: account.session.token, url: baseUrl, httpOnly: true, sameSite: "Strict" }]);
  let analysisSubmissions = 0;
  let tokenCountRequests = 0;
  let providerRequests = 0;
  let countResponseBodyReads = 0;
  let controlledCountFetches = 0;
  const externalAttempts = [];
  const browserForbidden = [];
  let handlerResult = null;

  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "synthetic-not-a-credential",
    getOpenAIModel: () => "gpt-4.1-mini",
    getVisualIdentityModel: () => "gpt-5.6-luna",
    getSerperApiKey: () => "",
    getWebsiteCognitionMode: () => "DISABLED",
    usesAuthenticatedExactInputTokenCounting: true,
    createAnalysisId: () => "analysis-controlled-provider-timeout",
    requestOpenAIInputTokenCount: async ({ apiKey, payload, timeoutMs }) => {
      tokenCountRequests += 1;
      if (timeoutStage === "input-token-count") {
        const deniedFetch = globalThis.fetch;
        globalThis.fetch = async (url) => {
          assert.equal(url, "https://api.openai.com/v1/responses/input_tokens");
          controlledCountFetches += 1;
          return {
            ok: true,
            status: 200,
            headers: { get: () => null },
            json: async () => {
              countResponseBodyReads += 1;
              throw Object.assign(new Error("controlled aborted response body"), { name: "AbortError" });
            }
          };
        };
        try {
          return await __queryIntegrityTestHooks.requestOpenAIInputTokenCountNetwork({ apiKey, payload, timeoutMs });
        } finally {
          globalThis.fetch = deniedFetch;
        }
      }
      return { input_tokens: 10000 };
    },
    requestOpenAIJson: async () => {
      providerRequests += 1;
      const error = new Error("OpenAI request timed out.");
      error.liveSearchErrorCategory = "timeout";
      error.timedOut = true;
      throw error;
    }
  });

  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === baseUrl && !["/api/generate-listing", "/api/customer-account"].includes(url.pathname)) {
      await route.continue();
      return;
    }
    browserForbidden.push(`${route.request().method()} ${url.origin}${url.pathname}`);
    await route.abort("blockedbyclient");
  });
  await page.route("**/api/customer-account**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = await request.allHeaders();
    headers.host ||= url.host;
    const response = captureResponse();
    await accountHandler({
      method: request.method(),
      url: `${url.pathname}${url.search}`,
      headers,
      body: request.postData(),
      socket: { remoteAddress: "127.0.0.1" }
    }, response);
    await route.fulfill({ status: response.statusCode, headers: response.headers, body: JSON.stringify(response.payload) });
  });
  await page.route("**/api/generate-listing", async (route) => {
    analysisSubmissions += 1;
    const response = captureResponse();
    const guard = installHardNetworkDenial();
    try {
      await handler({ method: "POST", body: route.request().postDataJSON() }, response);
    } finally {
      externalAttempts.push(...guard.attempts);
      guard.restore();
    }
    handlerResult = { status: response.statusCode, payload: response.payload };
    await route.fulfill({ status: response.statusCode, contentType: "application/json", body: JSON.stringify(response.payload) });
  });

  await page.goto("/");
  await expect(page.locator("#account-menu-button")).toHaveText("@timeout_fixture");
  await page.evaluate((report) => {
    latestReport = report;
    latestSections = getSectionsForReport(workflowConfigs[currentWorkflow], report);
    renderReport(report, latestSections);
    globalThis.KatherinesEyeCustomerAccount.setCurrentReport(report, latestSections, currentWorkflow);
  }, prior);
  await expect(page.locator("#save-listing-button")).toBeVisible();
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const drawing = canvas.getContext("2d");
    drawing.fillStyle = "#ccc6ba";
    drawing.fillRect(0, 0, 160, 120);
    drawing.fillStyle = "#514a43";
    drawing.fillRect(35, 24, 90, 70);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#photos").setInputFiles({
    name: "synthetic-timeout-item.png", mimeType: "image/png", buffer: Buffer.from(encoded, "base64")
  });
  await page.locator("#purchase_context").selectOption("private_seller");
  const customerNotes = "Hand-cranked object with an unreadable maker label; please identify only what the photo supports.";
  await page.locator("#notes").fill(customerNotes);
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => analysisSubmissions).toBe(1);
  await expect(page.locator("#workflow-submit-button")).toBeEnabled({ timeout: 60_000 });

  const visible = {
    status: await page.locator("#status").innerText(),
    result: await page.locator("#results").innerText(),
    ariaBusy: await page.locator("#results").getAttribute("aria-busy"),
    reportCount: await page.locator(".report-root").count(),
    saveVisible: await page.locator("#save-listing-button").isVisible(),
    notes: await page.locator("#notes").inputValue(),
    photoPreviewCount: await page.locator(".photo-preview-item").count(),
    purchaseContext: await page.locator("#purchase_context").inputValue()
  };
  console.log("CONTROLLED_TIMEOUT_BOUNDARY", JSON.stringify({
    timeoutStage, analysisSubmissions, tokenCountRequests, providerRequests, controlledCountFetches, countResponseBodyReads,
    handlerStatus: handlerResult?.status, handlerCode: handlerResult?.payload?.code,
    externalAttempts: externalAttempts.length, browserForbidden: browserForbidden.length, visible
  }));
  assert.equal(analysisSubmissions, 1);
  assert.equal(providerRequests, timeoutStage === "generation" ? 1 : 0);
  assert.equal(tokenCountRequests, 1);
  assert.equal(controlledCountFetches, timeoutStage === "input-token-count" ? 1 : 0);
  assert.equal(countResponseBodyReads, timeoutStage === "input-token-count" ? 1 : 0);
  assert.equal(handlerResult?.status, 502);
  assert.equal(handlerResult?.payload?.code, "PROVIDER_TIMEOUT");
  assert.equal(handlerResult?.payload?.diagnostics?.terminalFailure?.errorCategory, "PROVIDER_FAILURE");
  assert.equal(handlerResult?.payload?.diagnostics?.providerFailurePhase,
    timeoutStage === "input-token-count" ? "INPUT_TOKEN_COUNT" : "");
  if (timeoutStage === "generation") {
    const modelRecord = handlerResult.payload.diagnostics.terminalFailure.partialProviderRecords
      .find((record) => record.provider === "openai_model");
    assert.ok(modelRecord);
    assert.ok(modelRecord.conservativeAuthorizationExposure.maximumRequestCostDollars > 0);
    assert.equal(modelRecord.conservativeAuthorizationExposure.maximumRequestCostScope,
      "ONE_MODEL_GENERATION_ATTEMPT_EXCLUDING_PRIOR_TOKEN_COUNT");
  }
  assert.deepEqual(externalAttempts, []);
  assert.deepEqual(browserForbidden, []);
  assert.equal(visible.ariaBusy, "false");
  assert.equal(visible.reportCount, 0);
  assert.equal(visible.saveVisible, false);
  assert.doesNotMatch(visible.result, /Acme Workshop HW-42/);
  assert.equal(visible.notes, customerNotes);
  assert.equal(visible.photoPreviewCount, 1);
  assert.equal(visible.purchaseContext, "private_seller");
  assert.match(visible.status, /timed out/i);
  assert.equal(Object.keys((await store.read()).histories[account.account.id] || {}).length, 0);
});
}
