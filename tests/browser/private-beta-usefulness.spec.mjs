import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";
import { buildBrowserHandlerResponse } from "../helpers/build-browser-handler-response.mjs";

async function installAccountRoute(page) {
  const store = createMemoryCustomerAccountStore();
  const handler = createCustomerAccountHandler({ service: createCustomerAccountService({ store }) });
  await page.route("**/api/customer-account**", async (route) => {
    const request = route.request();
    const response = {
      statusCode: 200,
      headers: {},
      payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[name.toLowerCase()] = String(value); },
      json(payload) { this.payload = payload; return this; }
    };
    await handler({
      method: request.method(),
      url: request.url(),
      headers: { ...await request.allHeaders(), host: new URL(request.url()).host },
      body: request.postData()
    }, response);
    await route.fulfill({
      status: response.statusCode,
      headers: response.headers,
      body: JSON.stringify(response.payload)
    });
  });
  return store;
}

async function uploadControlledPhoto(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 160;
    canvas.height = 120;
    const context = canvas.getContext("2d");
    context.fillStyle = "#f4eee3";
    context.fillRect(0, 0, 160, 120);
    context.fillStyle = "#6e4933";
    context.fillRect(38, 18, 84, 88);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#photos").setInputFiles({
    name: "controlled-private-beta-item.png",
    mimeType: "image/png",
    buffer: Buffer.from(data, "base64")
  });
}

async function register(page, username, password) {
  await page.locator("#account-create-button").click();
  await page.locator("#register-username").fill(username);
  await page.locator("#register-preferred-name").fill("Private Beta Tester");
  await page.locator("#register-password").fill(password);
  await page.locator("#account-consent").check();
  await page.locator("#account-register-form button[type=submit]").click();
  await expect(page.locator("#account-username")).toHaveText(`@${username}`);
  await page.locator("#account-close-button").click();
}

async function deleteAccountAndProveCleanup(page, store, password) {
  if (await page.locator("#history-panel").isVisible()) {
    await page.locator("#close-history-button").click();
  }
  await page.locator("#account-menu-button").click();
  await page.getByText("Delete account and saved reports", { exact: true }).click();
  await page.locator("#delete-account-password").fill(password);
  await page.locator("#delete-account-form button[type=submit]").click();
  await expect(page.locator("#account-menu-button")).toHaveText("Sign in");
  const state = await store.read();
  expect(Object.keys(state.accounts)).toHaveLength(0);
  expect(Object.keys(state.sessions)).toHaveLength(0);
  expect(Object.values(state.histories).flatMap((entries) => Object.keys(entries))).toHaveLength(0);
  return {
    accounts: Object.keys(state.accounts).length,
    sessions: Object.keys(state.sessions).length,
    historyRecords: Object.values(state.histories).flatMap((entries) => Object.keys(entries)).length
  };
}

test("actual handler and customer UI keep useful source context without unsupported value claims", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const mobile = testInfo.project.name === "mobile";
  const evidenceMode = mobile ? "unidentified" : "retail-incomplete";
  const expectedSource = mobile
    ? "Hand-cranked cast-metal mechanisms: identification guide"
    : "Nutella Hazelnut Spread with Cocoa";
  const expectedMissingDetail = mobile ? "maker’s mark" : "package size";
  const username = mobile ? "usefulness_mobile" : "usefulness_desktop";
  const password = "isolated usefulness password";
  const store = await installAccountRoute(page);
  let analysisRequests = 0;
  let handlerEvidence = null;

  await page.route("**/api/generate-listing", async (route) => {
    analysisRequests += 1;
    handlerEvidence = await buildBrowserHandlerResponse({
      requestBody: route.request().postDataJSON(),
      evidenceMode
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(handlerEvidence.payload)
    });
  });

  await page.goto("/");
  await register(page, username, password);
  await uploadControlledPhoto(page);
  await page.locator("#purchase_context").selectOption(mobile ? "private_seller" : "online_retailer");
  if (!mobile) await page.locator("#retailer_or_marketplace_name").fill("Controlled retailer");
  await page.locator("#asking_price").fill("5.50");
  await page.locator("#workflow-submit-button").click();

  await expect(page.locator("#save-listing-button")).toBeVisible({ timeout: 60_000 });
  expect(analysisRequests).toBe(1);
  expect(handlerEvidence.report.customerEvidence).toHaveLength(0);
  expect(handlerEvidence.report.customerSourceFindings.map((item) => item.title)).toContain(expectedSource);
  expect(handlerEvidence.metadata.customerSearchTrace.sanitizedQueries.length).toBeGreaterThan(0);
  expect(handlerEvidence.metadata.customerSearchTrace.returnedSourceReferences.length).toBeGreaterThan(0);
  expect(handlerEvidence.metadata.customerSearchTrace.rejectionReasons.length).toBeGreaterThan(0);
  expect(handlerEvidence.metadata.customerSearchTrace.retentionLimitation).toContain("not complete raw provider payloads");

  const reportRoot = page.locator(".report-root");
  await expect(reportRoot.locator(".report-identity-header")).toContainText("Photo match:");
  await expect(reportRoot.locator(".report-identity-header")).toContainText("Exact item: Insufficient");
  await expect(reportRoot.locator(".report-identity-header")).not.toContainText("Subject Confidence:");
  await expect(reportRoot.locator(".customer-source-findings")).toContainText(expectedSource);
  await expect(reportRoot.locator(".customer-source-findings")).toContainText("Not used to set a price");
  await expect(reportRoot.locator(".action-plan")).toContainText(expectedMissingDetail);
  await expect(reportRoot.locator(".canonical-evidence-section")).toHaveCount(0);
  await expect(reportRoot.locator(".consumer-compact-sections")).not.toContainText("Barcode Search Status");
  await expect(reportRoot.locator(".consumer-summary-card")).not.toContainText("canonical supporting evidence");
  await expect(reportRoot.locator(".action-plan")).not.toContainText("decision-eligible");
  await expect(reportRoot.locator(".action-plan")).not.toContainText("canonical price");
  await expect(reportRoot).toContainText("no value range was established");

  const reportText = await reportRoot.innerText();
  const verificationArtifact = {
    schemaVersion: "1.0",
    surface: testInfo.project.name,
    evidenceMode,
    analysisRequests,
    customerReport: reportText,
    searchTrace: handlerEvidence.metadata.customerSearchTrace,
    sourceFindings: handlerEvidence.report.customerSourceFindings,
    missingDetails: handlerEvidence.report.customerMissingDetails,
    customerConfidenceSummary: handlerEvidence.report.customerConfidenceSummary,
    valuationEvidenceState: handlerEvidence.report.valuationEvidenceState,
    valuationEvidenceExplanation: handlerEvidence.report.valuationEvidenceExplanation,
    rawProviderPayloadRetained: false
  };
  await writeFile(testInfo.outputPath("customer-report.txt"), `${reportText}\n`, "utf8");
  await writeFile(testInfo.outputPath("verification-artifact.json"), `${JSON.stringify(verificationArtifact, null, 2)}\n`, "utf8");
  await page.screenshot({ path: testInfo.outputPath("customer-report.png"), fullPage: true });

  await page.locator("#save-listing-button").click();
  await expect(page.locator("#status")).toContainText("Saved privately");
  await page.locator("#account-menu-button").click();
  await page.locator("#account-signout-button").click();
  await page.locator("#login-username").fill(username);
  await page.locator("#login-password").fill(password);
  await page.locator("#account-login-form button[type=submit]").click();
  await expect(page.locator("#account-username")).toHaveText(`@${username}`);
  await page.locator("#account-history-button").click();
  await expect(page.locator(".history-item")).toHaveCount(1);
  await page.locator(".history-item").getByRole("button", { name: "View", exact: true }).click();
  await expect(page.locator("#history-detail")).toContainText(expectedSource);

  verificationArtifact.cleanup = await deleteAccountAndProveCleanup(page, store, password);
  await writeFile(testInfo.outputPath("verification-artifact.json"), `${JSON.stringify(verificationArtifact, null, 2)}\n`, "utf8");
});
