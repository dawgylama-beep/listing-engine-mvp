import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";
import { buildControlledCustomerModelCorroborationReport } from "../helpers/build-browser-handler-response.mjs";

async function preparedBrowser(page, context) {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  const account = await service.register({ username: "recovery_browser", password: "synthetic password 123" });
  const handler = createCustomerAccountHandler({ service, environment: {} });
  await context.addCookies([{ name: "ke_beta_session", value: account.session.token, url: "http://127.0.0.1:4177", httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/*", async (route) => {
    if (new URL(route.request().url()).hostname !== "127.0.0.1") return route.abort("blockedbyclient");
    return route.continue();
  });
  await page.route("**/api/customer-account**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = await request.allHeaders();
    headers.host ||= url.host;
    const res = { statusCode: 200, headers: {}, payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[name] = value; },
      json(payload) { this.payload = payload; return this; }
    };
    await handler({ method: request.method(), url: `${url.pathname}${url.search}`, headers,
      body: request.postData(), socket: { remoteAddress: "127.0.0.1" } }, res);
    await route.fulfill({ status: res.statusCode, headers: res.headers, contentType: "application/json", body: JSON.stringify(res.payload) });
  });
  await page.goto("/");
  await expect(page.locator("#account-menu-button")).toHaveText("@recovery_browser");
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 120;
    const context = canvas.getContext("2d");
    context.fillStyle = "#b8aba0";
    context.fillRect(0, 0, 120, 120);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#photos").setInputFiles({ name: "synthetic-item.png", mimeType: "image/png", buffer: Buffer.from(encoded, "base64") });
  await page.locator("#purchase_context").selectOption("private_seller");
  return { service, account };
}

test("lost browser response and reload recover the exact completed report without a second POST or implicit Save", async ({ page, context }) => {
  const { service, account } = await preparedBrowser(page, context);
  const report = await buildControlledCustomerModelCorroborationReport();
  let posts = 0;
  let analysisId = "";
  let recoveryId = "";
  await page.route("**/api/generate-listing", async (route) => {
    posts += 1;
    const body = route.request().postDataJSON();
    analysisId = body.analysisId;
    recoveryId = body.recovery.recoveryId;
    const claimed = await service.claimAnalysisRecovery(account.session.token, { analysisId, ...body.recovery });
    assert.equal(claimed.claimed, true);
    await service.completeAnalysisRecovery(account.session.token, {
      analysisId, recoveryId, state: "SUCCEEDED", statusCode: 200, response: { valuation: report }
    });
    await route.abort("failed");
  });
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => posts).toBe(1);
  await expect(page.locator(".report-root")).toBeVisible();
  assert.deepEqual((await service.listHistory(account.session.token)).listings, []);
  const before = await page.locator(".report-root").innerText();
  await page.reload();
  await expect(page.locator(".report-root")).toBeVisible();
  assert.equal(await page.locator(".report-root").innerText(), before);
  assert.equal(posts, 1);
  assert.equal((await service.readAnalysisRecovery(account.session.token, analysisId, recoveryId)).state, "SUCCEEDED");
  assert.deepEqual((await service.listHistory(account.session.token)).listings, []);
  await expect(page.locator("#save-listing-button")).toBeVisible();
  await page.locator("#save-listing-button").click();
  await expect.poll(async () => (await service.listHistory(account.session.token)).listings.length).toBe(1);
  assert.equal((await service.readAnalysisRecovery(account.session.token, analysisId, recoveryId)).state, "SUCCEEDED");
});

test("pending and terminal analysis states never trigger an automatic second POST", async ({ page, context }) => {
  const { service, account } = await preparedBrowser(page, context);
  let posts = 0;
  let identity;
  await page.route("**/api/generate-listing", async (route) => {
    posts += 1;
    const body = route.request().postDataJSON();
    identity = { analysisId: body.analysisId, recoveryId: body.recovery.recoveryId, requestHash: body.recovery.requestHash, photoHashes: body.recovery.photoHashes };
    assert.equal((await service.claimAnalysisRecovery(account.session.token, identity)).claimed, true);
    await route.abort("failed");
  });
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => posts).toBe(1);
  await page.reload();
  await expect(page.locator("#status")).toContainText("still running");
  assert.equal(posts, 1);
  await service.completeAnalysisRecovery(account.session.token, {
    analysisId: identity.analysisId, recoveryId: identity.recoveryId,
    state: "FAILED_TERMINAL", statusCode: 502, response: { error: "The provider timed out. No report was completed." }
  });
  await expect(page.locator("#status")).toContainText("provider timed out", { timeout: 12000 });
  await expect(page.locator("#save-listing-button")).toBeHidden();
  assert.equal(posts, 1);
});

test("signed-out analysis stops before provider dispatch and explains the account requirement", async ({ page }) => {
  let providerPosts = 0;
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1") return route.abort("blockedbyclient");
    return route.continue();
  });
  await page.route("**/api/customer-account**", (route) => route.fulfill({ status: 401, contentType: "application/json", body: '{"code":"authentication_required","error":"Sign in."}' }));
  await page.route("**/api/generate-listing", (route) => { providerPosts += 1; return route.abort("blockedbyclient"); });
  await page.goto("/");
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 120;
    canvas.getContext("2d").fillRect(0, 0, 120, 120);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#photos").setInputFiles({ name: "synthetic-item.png", mimeType: "image/png", buffer: Buffer.from(encoded, "base64") });
  await page.locator("#purchase_context").selectOption("private_seller");
  await page.locator("#workflow-submit-button").click();
  await expect(page.locator("#status")).toContainText("Sign in to your Katherine’s Eye account");
  await expect(page.locator("#photo-preview img")).toHaveCount(1);
  assert.equal(providerPosts, 0);
});
