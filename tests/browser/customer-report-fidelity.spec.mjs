import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";
import { buildControlledCustomerModelCorroborationReport } from "../helpers/build-browser-handler-response.mjs";

test("actual live renderer and saved history retain confidence, full identification, source and unknown billing", async ({ page, context }) => {
  const report = await buildControlledCustomerModelCorroborationReport();
  report.identitySummary = `${report.identitySummary || "Customer-reported model remains unverified."} ${"A readable maker/model label is still needed to link the reference to this photographed item. ".repeat(20)}`.trim();
  const untracedUrl = "https://www.ebay.com/itm/116634924403";
  report.customerSourceFindings.push({ title: "Untraced source", destinationUrl: untracedUrl, relationship: "Identity match" });
  const completeEnding = "A readable maker/model label is still needed to link the reference to this photographed item.";
  assert.ok(report.identitySummary.length > 1200);
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store });
  const handler = createCustomerAccountHandler({ service, environment: {} });
  const seed = await service.register({ username: "fidelity_fixture", password: "local fixture password 123" });
  const baseUrl = "http://127.0.0.1:4177";
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
  await expect(page.locator("#account-menu-button")).toHaveText("@fidelity_fixture");
  await page.evaluate((value) => renderReport(value, []), report);
  const liveConfidence = report.customerConfidenceSummary;
  for (const line of Object.values(liveConfidence)) {
    await expect(page.locator("#results")).toContainText(line);
  }
  await expect(page.locator(`#results a[href="${untracedUrl}"]`)).toHaveCount(0);
  await page.locator("#save-listing-button").click();
  await expect(page.locator("#save-listing-button")).toHaveText("Saved");
  await page.reload();
  await page.locator("#history-menu-button").click();
  await page.locator(".history-item").getByRole("button", { name: "View" }).click();
  const detail = page.locator("#history-detail");
  for (const line of Object.values(liveConfidence)) await expect(detail).toContainText(line);
  await expect(detail).toContainText(completeEnding);
  await expect(detail).toContainText("exact billed amount: UNKNOWN");
  await expect(detail).toContainText(`direct-page reads: ${report.customerMetering.directPageAttempts ?? "UNKNOWN"}`);
  await expect(detail.locator(`a[href="${untracedUrl}"]`)).toHaveCount(0);
  assert.deepEqual(forbidden, [], "Reopening made no provider or external request.");
  const saved = Object.values((await store.read()).histories[seed.account.id])[0].snapshot;
  assert.equal(saved.identification.summary, report.identitySummary);
  assert.deepEqual(saved.confidence, liveConfidence);
  assert.deepEqual(saved.confidenceModel, report.customerConfidence);
  assert.equal(saved.metering.billingStatus, "UNKNOWN");
  assert(saved.evidence.every((source) => !source.url || (source.sourceRecordId && source.acquisitionProvider)));
  assert(!saved.evidence.some((source) => source.url === untracedUrl));
});
