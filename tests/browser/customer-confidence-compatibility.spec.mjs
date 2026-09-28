import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";

test("legacy OBJ-008 wording is clarified on reopen without changing the saved record", async ({ page, context }) => {
  const baseUrl = "http://127.0.0.1:4177";
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store });
  const handler = createCustomerAccountHandler({ service, environment: {} });
  const seed = await service.register({ username: "confidence_fixture", password: "local fixture password 123" });
  const historicalSummary = "Subject Identity: A vintage box-style film camera | Subject Confidence: High - user-provided identity is consistent with available visual or text evidence. | Exact Product Identity: Likely a Kodak Brownie Hawkeye Flash Model box camera; exact production variant is not established";
  await service.saveListing(seed.session.token, {
    workflow: "resale",
    title: "BROWNIE KODAK HAWKEYE CAMERA Flash MODEL",
    identification: { confidence: "Insufficient", summary: historicalSummary },
    confidence: {
      photoMatch: "Visible item: High — The photos support the visible item type, not every exact variant.",
      exactItem: "Exact item: Insufficient — No accepted source establishes an exact matching identifier; maker, model, or variant still needs confirmation.",
      workingCondition: "Working condition: Insufficient — Appearance alone does not establish whether the item works.",
      priceSupport: "Valuation: Insufficient — Compatible transaction evidence did not establish a reliable value."
    },
    confidenceModel: {
      visibleCategory: { level: "High", explanation: "The photos support the visible item type, not every exact variant." },
      exactItem: { level: "Insufficient", explanation: "No accepted source establishes an exact matching identifier; maker, model, or variant still needs confirmation.", acceptedExactIdentifier: false },
      workingCondition: { level: "Insufficient", explanation: "Appearance alone does not establish whether the item works." },
      valuation: { level: "Insufficient", explanation: "Compatible transaction evidence did not establish a reliable value." }
    }
  });
  const before = JSON.stringify((await store.read()).histories[seed.account.id]);
  await context.addCookies([{ name: "ke_beta_session", value: seed.session.token, url: baseUrl, httpOnly: true, sameSite: "Strict" }]);
  const forbidden = [];
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === baseUrl && url.pathname !== "/api/generate-listing") return route.continue();
    forbidden.push(`${route.request().method()} ${url.origin}${url.pathname}`);
    return route.abort("blockedbyclient");
  });
  await page.route("**/api/customer-account**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = await request.allHeaders();
    headers.host ||= url.host;
    const response = {
      statusCode: 200, headers: {}, payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[String(name).toLowerCase()] = String(value); },
      json(value) { this.payload = value; return this; }
    };
    await handler({ method: request.method(), url: `${url.pathname}${url.search}`, headers,
      body: request.postData(), socket: { remoteAddress: "127.0.0.1" } }, response);
    await route.fulfill({ status: response.statusCode, headers: response.headers, body: JSON.stringify(response.payload) });
  });

  await page.goto("/");
  await expect(page.locator("#account-menu-button")).toHaveText("@confidence_fixture");
  await page.locator("#history-menu-button").click();
  await page.locator(".history-item").getByRole("button", { name: "View" }).click();
  const detail = page.locator("#history-detail");
  await expect(detail).toContainText("Visible-item confidence: High — The photos support the visible item type, not every exact variant.");
  await expect(detail).not.toContainText("Subject Confidence");
  for (const line of ["Visible item: High", "Exact item: Insufficient", "Working condition: Insufficient", "Valuation: Insufficient"]) {
    await expect(detail).toContainText(line);
  }
  assert.deepEqual(forbidden, [], "Reopening must not call an analysis or external provider.");
  assert.equal(JSON.stringify((await store.read()).histories[seed.account.id]), before);
  assert.match(before, /Subject Confidence: High/);
});
