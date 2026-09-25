import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";
import { buildControlledCustomerModelCorroborationReport } from "../helpers/build-browser-handler-response.mjs";
const baseUrl = "http://127.0.0.1:4177";

test("saved corroboration remains private across logout and a fresh browser login", async ({ page, context, browser }, testInfo) => {
  const report = await buildControlledCustomerModelCorroborationReport();
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store });
  const handler = createCustomerAccountHandler({ service, environment: {} });
  const password = "local fixture password 123";
  const seed = await service.register({ username: "corroboration_fixture", password });
  const accountRequests = [];
  const forbiddenRequests = [];

  async function dispatchAccount(method, url, headers, body) {
    const response = {
      statusCode: 200,
      headers: {},
      payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[String(name).toLowerCase()] = String(value); },
      json(value) { this.payload = value; return this; }
    };
    await handler({
      method,
      url,
      headers,
      body,
      socket: { remoteAddress: "127.0.0.1" }
    }, response);
    return response;
  }

  async function routeAccount(browserPage) {
    await browserPage.route("**/*", async (route) => {
      const requestUrl = new URL(route.request().url());
      if (requestUrl.origin === baseUrl && requestUrl.pathname !== "/api/generate-listing") {
        await route.continue();
        return;
      }
      forbiddenRequests.push(`${route.request().method()} ${requestUrl.origin}${requestUrl.pathname}`);
      await route.abort("blockedbyclient");
    });
    await browserPage.route("**/api/customer-account**", async (route) => {
      const request = route.request();
      const requestUrl = new URL(request.url());
      const headers = await request.allHeaders();
      headers.host ||= requestUrl.host;
      const response = await dispatchAccount(
        request.method(), `${requestUrl.pathname}${requestUrl.search}`, headers, request.postData()
      );
      let action = requestUrl.searchParams.get("action") || "session";
      if (request.postData()) action = JSON.parse(request.postData()).action || action;
      accountRequests.push({ action, status: response.statusCode, code: response.payload?.code || "" });
      await route.fulfill({
        status: response.statusCode,
        headers: response.headers,
        body: JSON.stringify(response.payload)
      });
    });
  }

  await context.addCookies([{ name: "ke_beta_session", value: seed.session.token, url: baseUrl, httpOnly: true, sameSite: "Strict" }]);
  await routeAccount(page);
  await page.goto("/");
  await expect(page.locator("#account-menu-button")).toHaveText("@corroboration_fixture");
  await page.evaluate((report) => {
    globalThis.setReportActionsVisible(true);
    globalThis.KatherinesEyeCustomerAccount.setCurrentReport(report, [], "personal_use");
  }, report);
  await page.locator("#save-listing-button").click();
  await expect(page.locator("#save-listing-button")).toHaveText("Saved");
  const history = (await store.read()).histories[seed.account.id];
  assert.equal(Object.keys(history).length, 1, "The retained report must be saved for the session transition");
  const listingId = Object.keys(history)[0];

  await page.locator("#account-menu-button").click();
  await page.locator("#account-signout-button").click();
  await expect(page.locator("#account-menu-button")).toHaveText("Sign in");
  assert.equal(accountRequests.find((request) => request.action === "logout")?.status, 200);
  const staleHeaders = { host: new URL(baseUrl).host, cookie: `ke_beta_session=${seed.session.token}` };
  const staleHistory = await dispatchAccount("GET", "/api/customer-account?action=history", staleHeaders);
  const staleListing = await dispatchAccount(
    "GET", `/api/customer-account?action=listing&listingId=${encodeURIComponent(listingId)}`, staleHeaders
  );
  assert.equal(staleHistory.statusCode, 401, "Logout must revoke old-session history access");
  assert.equal(staleListing.statusCode, 401, "Logout must revoke old-session report access");

  const freshContext = await browser.newContext({
    baseURL: baseUrl,
    serviceWorkers: "block",
    viewport: page.viewportSize(),
    reducedMotion: "reduce"
  });
  try {
    assert.equal((await freshContext.cookies(baseUrl)).length, 0, "The returning browser must start without inherited cookies");
    const returningPage = await freshContext.newPage();
    await routeAccount(returningPage);
    await returningPage.goto("/");
    await expect(returningPage.locator("#account-menu-button")).toHaveText("Sign in");
    await returningPage.locator("#account-menu-button").click();
    await returningPage.locator("#login-username").fill("corroboration_fixture");
    await returningPage.locator("#login-password").fill(password);
    await returningPage.locator("#account-login-form button[type='submit']").click();
    await expect(returningPage.locator("#account-menu-button")).toHaveText("@corroboration_fixture");
    assert.equal(accountRequests.find((request) => request.action === "login")?.status, 200);
    const returningCookie = (await freshContext.cookies(baseUrl)).find((cookie) => cookie.name === "ke_beta_session");
    assert.ok(returningCookie && returningCookie.value !== seed.session.token,
      "The returning login must establish a different authenticated session");

    await returningPage.locator("#account-close-button").click();
    await returningPage.locator("#history-menu-button").click();
    await expect(returningPage.locator(".history-item")).toHaveCount(1);
    await returningPage.locator(".history-item").getByRole("button", { name: "View" }).click();
    const detail = returningPage.locator("#history-detail");
    const identification = detail.getByRole("heading", { name: "Identification", exact: true }).locator("..");
    const pricing = detail.getByRole("heading", { name: "Pricing disposition", exact: true }).locator("..");
    const research = detail.getByRole("heading", { name: "Recommended research", exact: true }).locator("..");
    const source = detail.locator(".saved-evidence article").filter({
      hasText: "Acme Workshop HW-42 hand-cranked bench mechanism reference"
    });
    await expect(identification).toContainText("customer-reported Acme Workshop HW-42");
    await expect(identification).toContainText("Exact item: Insufficient");
    await expect(source).toContainText("Reference match only; photographed identity unverified");
    await expect(source).toContainText("Not used to set a price.");
    await expect(pricing).toContainText(/Fair Value Not Established|Fair Value: Not established/i);
    await expect(research).toContainText("close photo of the maker/model label");
    assert.equal(await source.getByRole("link", { name: "Open source" }).getAttribute("href"),
      "https://support.acme-workshop.example/reference/hw-42");
    assert.equal(accountRequests.find((request) => request.action === "history")?.status, 200);
    assert.equal(accountRequests.find((request) => request.action === "listing")?.status, 200);
    assert.deepEqual(forbiddenRequests, [], "Reopening must not request analysis, research, or external traffic");
    assert.equal(Object.keys((await store.read()).histories[seed.account.id]).length, 1);
    await testInfo.attach("fresh-session-reopened-corroboration", {
      body: await detail.innerText(), contentType: "text/plain"
    });
  } finally {
    await freshContext.close();
  }
});
