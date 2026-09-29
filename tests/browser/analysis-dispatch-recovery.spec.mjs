import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { buildControlledCustomerModelCorroborationReport } from "../helpers/build-browser-handler-response.mjs";

const receiptKey = "katherine-eye.analysis-dispatch.v1";

async function openPreparedForm(page) {
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname !== "127.0.0.1") return route.abort("blockedbyclient");
    if (url.pathname === "/api/customer-account") {
      return route.fulfill({ status: 200, contentType: "application/json", body: '{"account":null}' });
    }
    return route.continue();
  });
  await page.goto("/");
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
}

test("an unconfirmed POST retains a safe reference and cannot be submitted again after reload", async ({ page }) => {
  let posts = 0;
  let receiptAtDispatch;
  let finishTransport;
  await openPreparedForm(page);
  await page.route("**/api/generate-listing", async (route) => {
    posts += 1;
    receiptAtDispatch = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), receiptKey);
    await new Promise((resolve) => { finishTransport = resolve; });
    await route.abort("failed");
  });
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => posts).toBe(1);
  await page.evaluate(() => document.querySelector("#listing-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  await expect(page.locator("#status")).toContainText("already in progress");
  assert.equal(posts, 1);
  finishTransport();
  await expect(page.locator("#status")).toContainText("cannot confirm");
  assert.equal(posts, 1);
  assert.equal(receiptAtDispatch.state, "dispatch_unconfirmed");
  assert.match(receiptAtDispatch.analysisId, /^[a-zA-Z0-9-]{8,120}$/);
  assert.deepEqual(Object.keys(receiptAtDispatch).sort(), ["analysisId", "httpStatus", "startedAt", "state", "updatedAt", "workflow"].sort());
  await expect(page.locator("#analysis-failure-reference")).toContainText(receiptAtDispatch.analysisId);
  await expect(page.locator("#workflow-submit-button")).toBeDisabled();
  await page.reload();
  await expect(page.locator("#status")).toContainText("cannot confirm");
  await expect(page.locator("#workflow-submit-button")).toBeDisabled();
  await page.evaluate(() => document.querySelector("#listing-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(posts, 1, "a recovered unknown dispatch must not trigger another POST");
  assert.equal(await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)).analysisId, receiptKey), receiptAtDispatch.analysisId);
});

test("a received but unreadable response remains unconfirmed without a second POST", async ({ page }) => {
  let posts = 0;
  await openPreparedForm(page);
  await page.route("**/api/generate-listing", async (route) => {
    posts += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: "not-json" });
  });
  await page.locator("#workflow-submit-button").click();
  await expect(page.locator("#status")).toContainText("cannot confirm");
  const receipt = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), receiptKey);
  assert.equal(receipt.state, "response_unreadable");
  assert.equal(receipt.httpStatus, 200);
  assert.equal(posts, 1);
  await expect(page.locator("#workflow-submit-button")).toBeDisabled();
  await page.evaluate((key) => {
    const recorded = JSON.parse(sessionStorage.getItem(key));
    sessionStorage.setItem(key, JSON.stringify({ ...recorded, state: "response_received" }));
  }, receiptKey);
  await page.reload();
  await expect(page.locator("#status")).toContainText("cannot confirm");
  await expect(page.locator("#workflow-submit-button")).toBeDisabled();
  assert.equal(posts, 1);
});

test("failed receipt storage rejects before dispatch; a completed report is not marked unknown", async ({ page }) => {
  let posts = 0;
  const report = await buildControlledCustomerModelCorroborationReport();
  await openPreparedForm(page);
  await page.route("**/api/generate-listing", async (route) => {
    posts += 1;
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ valuation: report }) });
  });
  await page.evaluate(() => {
    window.originalStorageSetItemForTest = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("synthetic storage denial"); };
  });
  await page.locator("#workflow-submit-button").click();
  await expect(page.locator("#status")).toContainText("was not sent");
  assert.equal(posts, 0);
  await page.evaluate(() => { Storage.prototype.setItem = window.originalStorageSetItemForTest; });
  await page.locator("#workflow-submit-button").click();
  await expect(page.locator(".report-root")).toBeVisible();
  const receipt = await page.evaluate((key) => JSON.parse(sessionStorage.getItem(key)), receiptKey);
  assert.equal(receipt.state, "report_received");
  assert.equal(receipt.httpStatus, 200);
  assert.equal(posts, 1);
  await expect(page.locator("#status")).not.toContainText("cannot confirm");
  await page.reload();
  await expect(page.locator("#status")).toContainText("A report came back");
  await expect(page.locator("#workflow-submit-button")).toBeDisabled();
  assert.equal(posts, 1);
});
