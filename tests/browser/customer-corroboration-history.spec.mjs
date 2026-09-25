import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";
import { buildControlledCustomerModelCorroborationReport } from "../helpers/build-browser-handler-response.mjs";

test("controlled corroboration survives actual save, read, and customer history rendering", async ({ page, context }, testInfo) => {
  const report = await buildControlledCustomerModelCorroborationReport();
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store });
  const handler = createCustomerAccountHandler({ service, environment: {} });
  const seed = await service.register({ username: "corroboration_fixture", password: "local fixture password 123" });
  const baseUrl = "http://127.0.0.1:4177";
  await context.addCookies([{ name: "ke_beta_session", value: seed.session.token, url: baseUrl, httpOnly: true, sameSite: "Strict" }]);

  const forbiddenRequests = [];
  const accountRequests = [];
  await page.route("**/*", async (route) => {
    const requestUrl = new URL(route.request().url());
    if (requestUrl.origin === baseUrl && requestUrl.pathname !== "/api/generate-listing") {
      await route.continue();
      return;
    }
    forbiddenRequests.push(`${route.request().method()} ${requestUrl.origin}${requestUrl.pathname}`);
    await route.abort("blockedbyclient");
  });
  await page.route("**/api/customer-account**", async (route) => {
    const request = route.request();
    const requestUrl = new URL(request.url());
    const requestHeaders = await request.allHeaders();
    requestHeaders.host ||= requestUrl.host;
    const response = {
      statusCode: 200,
      headers: {},
      payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[String(name).toLowerCase()] = String(value); },
      json(value) { this.payload = value; return this; }
    };
    await handler({
      method: request.method(),
      url: `${requestUrl.pathname}${requestUrl.search}`,
      headers: requestHeaders,
      body: request.postData(),
      socket: { remoteAddress: "127.0.0.1" }
    }, response);
    accountRequests.push({
      method: request.method(),
      action: requestUrl.searchParams.get("action") || (request.postDataJSON()?.action ?? "session"),
      status: response.statusCode,
      code: response.payload?.code || "",
      hostMatches: requestHeaders.host === requestUrl.host,
      originMatches: requestHeaders.origin === requestUrl.origin,
      hasOrigin: Boolean(requestHeaders.origin)
    });
    await route.fulfill({ status: response.statusCode, headers: response.headers, body: JSON.stringify(response.payload) });
  });

  await page.goto("/");
  await expect(page.locator("#account-menu-button")).toHaveText("@corroboration_fixture");
  await page.evaluate((value) => {
    globalThis.setReportActionsVisible(true);
    globalThis.KatherinesEyeCustomerAccount.setCurrentReport(value, [], "personal_use");
  }, report);
  await expect(page.locator("#save-listing-button")).toBeVisible();
  await page.locator("#save-listing-button").click();
  await expect(page.locator("#save-listing-button")).toHaveText("Saved");

  await page.reload();
  await expect(page.locator("#account-menu-button")).toHaveText("@corroboration_fixture");
  await page.locator("#history-menu-button").click();
  await expect(page.locator(".history-item")).toHaveCount(1);
  await page.locator(".history-item").getByRole("button", { name: "View" }).click();
  const detail = page.locator("#history-detail");
  await expect(detail).toContainText("Acme Workshop HW-42 hand-cranked bench mechanism reference");
  const displayed = await detail.innerText();
  const identification = detail.getByRole("heading", { name: "Identification", exact: true }).locator("..");
  const pricing = detail.getByRole("heading", { name: "Pricing disposition", exact: true }).locator("..");
  const research = detail.getByRole("heading", { name: "Recommended research", exact: true }).locator("..");
  const source = detail.locator(".saved-evidence article").filter({ hasText: "Acme Workshop HW-42 hand-cranked bench mechanism reference" });
  const sourceHref = await source.getByRole("link", { name: "Open source" }).getAttribute("href");

  await expect(identification).toContainText("customer-reported Acme Workshop HW-42");
  await expect(identification).toContainText("Exact item: Insufficient");
  await expect(research).toContainText("close photo of the maker/model label");
  await expect(source).toContainText("Reference match only; photographed identity unverified");
  await expect(source).not.toContainText("Identity match");
  await expect(source).toContainText("This source supports the item identity");
  await expect(source).toContainText("Not used to set a price.");
  await expect(pricing).toContainText(/Fair Value Not Established|Fair Value: Not established/i);
  assert.equal(sourceHref, "https://support.acme-workshop.example/reference/hw-42");
  assert.equal(forbiddenRequests.length, 0, `Reopening attempted an analysis, research, or external request: ${forbiddenRequests.join(", ")}`);
  assert.equal(accountRequests.find((request) => request.action === "save_listing")?.status, 200);
  assert.equal(accountRequests.find((request) => request.action === "listing")?.status, 200);
  assert.equal(Object.keys((await store.read()).histories[seed.account.id] || {}).length, 1);
  console.log("REOPENED_CORROBORATION", JSON.stringify({
    identification: await identification.innerText(),
    source: await source.innerText(),
    sourceHref,
    pricing: await pricing.innerText(),
    recommendedResearch: await research.innerText()
  }));

  await testInfo.attach("retained-corroboration-reopened-customer-text", {
    body: displayed,
    contentType: "text/plain"
  });
});
