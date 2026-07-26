import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { buildBrowserHandlerResponse } from "../helpers/build-browser-handler-response.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const photoFixture = path.join(repositoryRoot, "tests", "fixtures", "browser", "neutral-test-object.svg");
const screenshotDirectory = path.join(repositoryRoot, "test-results", "review-screenshots");

const purposes = Object.freeze({
  personal_use: {
    radioName: /Buying for Myself/i,
    requestPurpose: "personal_use",
    canonicalPurpose: "personal",
    reportType: "marketValue"
  },
  resale: {
    radioName: /Buying to Resell/i,
    requestPurpose: "resale",
    canonicalPurpose: "resale",
    reportType: "marketValue"
  },
  market_value: {
    radioName: /Value Something I Own/i,
    requestPurpose: "owner_value",
    canonicalPurpose: "owner_value",
    reportType: "marketValue"
  },
  listing: {
    radioName: /Sell Something I Own/i,
    requestPurpose: "seller_listing",
    canonicalPurpose: "seller_listing",
    reportType: "listing"
  }
});

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function countOccurrences(text, value) {
  if (!value) return 0;
  return String(text).split(value).length - 1;
}

function expectedMeta(record) {
  return [
    record.quantityLabel,
    record.canonicalMatchLabel,
    record.canonicalPriceType,
    record.unitPrice
  ].filter(Boolean).join(" · ");
}

function scenarioName({ evidenceMode, purpose, malformedCanonical }, projectName) {
  const state = malformedCanonical ? "fail-closed" : `${evidenceMode}-${purpose}`;
  return `${state}-${projectName}`;
}

function installBrowserGuards(page, scenario) {
  const state = {
    analysisRequests: [],
    externalRequests: [],
    productionDomainRequests: [],
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    unexpectedRequestFailures: [],
    handlerResult: null
  };

  page.on("console", (message) => {
    const record = { type: message.type(), text: message.text() };
    if (message.type() === "error") state.consoleErrors.push(record);
    if (message.type() === "warning") state.consoleWarnings.push(record);
  });
  page.on("pageerror", (error) => state.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (!state.externalRequests.includes(url)) {
      state.unexpectedRequestFailures.push({
        url,
        error: request.failure()?.errorText || "unknown request failure"
      });
    }
  });

  page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const local = url.hostname === "127.0.0.1";
    if (!local) {
      state.externalRequests.push(request.url());
      if (url.hostname === "katherineseye.com" || url.hostname.endsWith(".katherineseye.com")) {
        state.productionDomainRequests.push(request.url());
      }
      await route.abort("blockedbyclient");
      return;
    }

    if (url.pathname === "/api/generate-listing") {
      const body = request.postDataJSON();
      state.analysisRequests.push({
        method: request.method(),
        url: request.url(),
        body
      });
      state.handlerResult = await buildBrowserHandlerResponse({
        requestBody: body,
        evidenceMode: scenario.evidenceMode,
        malformedCanonical: scenario.malformedCanonical === true
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json; charset=utf-8",
        body: JSON.stringify(state.handlerResult.payload)
      });
      return;
    }

    await route.continue();
  });

  return state;
}

async function configureForm(page, scenario, state) {
  const purpose = purposes[scenario.purpose];
  await page.goto("/");
  await expect(page.getByText("Version 1.12.1", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: purpose.radioName }).check();

  await page.locator("#notes").fill(
    scenario.evidenceMode === "collectible"
      ? "Deterministic browser test for a Riverton Falcons 1999 Champions collector tray."
      : "Deterministic browser test for Cedarline Privacy Mailers, 48 count."
  );

  if (scenario.validateForm) {
    await page.locator("#workflow-submit-button").click();
    const purchaseContextValidation = await page.locator("#purchase_context").evaluate((element) => ({
      valid: element.checkValidity(),
      message: element.validationMessage
    }));
    expect(purchaseContextValidation.valid).toBe(false);
    expect(normalizeText(purchaseContextValidation.message)).not.toBe("");
    expect(state.analysisRequests).toHaveLength(0);
  }

  if (scenario.purpose === "personal_use" || scenario.purpose === "resale") {
    const context = scenario.evidenceMode === "retail" && scenario.purpose === "personal_use"
      ? "retail_store"
      : "private_seller";
    await page.locator("#purchase_context").selectOption(context);
    if (context === "retail_store") {
      await page.locator("#store_name").fill("Example Office Store");
      await page.locator("#location_zip").fill("30188");
    } else {
      await page.locator("#retailer_or_marketplace_name").fill("Deterministic private seller");
    }
  }

  if (scenario.purpose === "personal_use" || scenario.purpose === "resale") {
    await page.locator("#asking_price").fill(scenario.evidenceMode === "collectible" ? "10.00" : "5.50");
  }
  await page.locator("#item_condition").selectOption(scenario.evidenceMode === "collectible" ? "vintage" : "new");

  const productDetails = page.locator("details.details-panel").first();
  await productDetails.locator("summary").click();
  await page.locator("#item_name").fill(
    scenario.evidenceMode === "collectible"
      ? "Riverton Falcons 1999 Champions collector tray"
      : "Cedarline Privacy Mailers"
  );
  await page.locator("#known_brand").fill(scenario.evidenceMode === "collectible" ? "RefreshCo" : "Cedarline");
  if (scenario.evidenceMode === "retail") {
    await page.locator("#known_upc").fill("012345678905");
  }

  if (scenario.purpose === "listing") {
    await page.locator("#platform").selectOption({ label: "Facebook Marketplace" });
    await page.locator("#fulfillment_preference").selectOption("local_pickup");
    await page.locator("#selling_speed").selectOption("balanced");
  }

  if (scenario.validateForm) {
    await page.locator("#workflow-submit-button").click();
    await expect(page.locator("#status")).toContainText("upload at least one item photo");
    expect(state.analysisRequests).toHaveLength(0);
  }

  await page.locator("#photos").setInputFiles(photoFixture);
  await expect(page.locator(".photo-preview-item")).toHaveCount(1);
  await expect(page.locator(".photo-thumb")).toBeVisible();
}

function assertSubmittedRequest(state, scenario) {
  expect(state.analysisRequests).toHaveLength(1);
  const request = state.analysisRequests[0];
  const purpose = purposes[scenario.purpose];
  expect(request.method).toBe("POST");
  expect(request.body.reportType).toBe(purpose.reportType);
  expect(normalizeText(request.body.notes)).toContain("Deterministic browser test");
  expect(request.body.photos).toHaveLength(1);
  expect(request.body.photos[0].name).toBe("neutral-test-object.svg");
  expect(request.body.photos[0].dataUrl).toMatch(/^data:image\/(?:jpeg|png|webp);base64,/);

  const intake = request.body[purpose.reportType === "listing" ? "sellerIntake" : "buyerIntake"];
  if (purpose.reportType === "listing") {
    expect(request.body).toHaveProperty("sellerIntake");
  } else {
    expect(intake.purchase_intent).toBe(purpose.requestPurpose);
  }
  expect(normalizeText(intake.item_name)).not.toBe("");
  expect(normalizeText(intake.buyer_notes)).toContain("Deterministic browser test");
}

async function assertCanonicalCards(page, state, scenario) {
  const report = state.handlerResult.report;
  const finalEvidenceResult = state.handlerResult.finalEvidenceResult;
  const cards = page.locator(".canonical-evidence-section [data-evidence-id]");
  const expectedIds = report.customerEvidenceSummary.displayedIds;
  const actualIds = await cards.evaluateAll((elements) => elements.map((element) => element.dataset.evidenceId));

  await expect(page.locator(".canonical-evidence-section")).toHaveCount(1);
  await expect(cards).toHaveCount(report.customerEvidence.length);
  expect(actualIds).toEqual(expectedIds);
  expect(new Set(actualIds).size).toBe(actualIds.length);
  expect(report.customerEvidence.map((record) => record.evidenceId)).toEqual(expectedIds);
  expect(report.searchDiagnostics.canonicalCustomerEvidenceIds).toEqual(expectedIds);
  expect(finalEvidenceResult.views.displayedIds).toEqual(expectedIds);
  expect(state.handlerResult.metadata.finalizerExecutions).toBe(1);
  expect(state.handlerResult.metadata.unexpectedNodeNetworkAttempts).toEqual([]);

  const retailerCounts = Object.fromEntries(
    [...new Set(report.customerEvidence.map((record) => record.sourceLabel))]
      .map((source) => [source, report.customerEvidence.filter((record) => record.sourceLabel === source).length])
  );
  const priceTypeCounts = Object.fromEntries(
    [...new Set(report.customerEvidence.map((record) => record.canonicalPriceType))]
      .map((priceType) => [priceType, report.customerEvidence.filter((record) => record.canonicalPriceType === priceType).length])
  );
  const matchCounts = Object.fromEntries(
    [...new Set(report.customerEvidence.map((record) => record.canonicalMatchLabel))]
      .map((match) => [match, report.customerEvidence.filter((record) => record.canonicalMatchLabel === match).length])
  );
  expect(retailerCounts).toEqual(report.customerEvidenceSummary.displayedCountByRetailer);
  expect(priceTypeCounts).toEqual(report.customerEvidenceSummary.displayedCountByPriceType);
  expect(matchCounts).toEqual(report.customerEvidenceSummary.displayedCountByMatchClass);

  for (const [index, record] of report.customerEvidence.entries()) {
    const card = cards.nth(index);
    await expect(card).toHaveAttribute("data-evidence-id", record.evidenceId);
    await expect(card.locator(".price-found-source")).toHaveText(
      `${record.sourceLabel} — ${record.customerPriceLabel}`
    );
    await expect(card.locator(".price-found-meta-line")).toHaveText(expectedMeta(record));
    await expect(card.locator(".price-found-product-title")).toHaveText(record.title);
    const link = card.getByRole("link", { name: "View source" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", record.destinationUrl);
    expect(normalizeText(await link.getAttribute("aria-label")) || normalizeText(await link.textContent())).not.toBe("");

    if (record.cardBadge) {
      await expect(card.locator(".best-price-badge")).toHaveText(record.cardBadge.label);
      await expect(card.locator(".best-price-badge")).toHaveAttribute("data-badge-code", record.cardBadge.code);
    } else {
      await expect(card.locator(".best-price-badge")).toHaveCount(0);
    }
  }

  const rejectedIds = new Set(report.customerEvidenceSummary.rejectedIds || []);
  expect(actualIds.filter((id) => rejectedIds.has(id))).toEqual([]);
  await expect(page.getByRole("heading", { name: "Prices Found", exact: true })).toHaveCount(0);

  if (scenario.expectCrossRetailer) {
    const uniqueSources = new Set(report.customerEvidence.map((record) => record.sourceLabel));
    const uniqueUrls = new Set(report.customerEvidence.map((record) => record.destinationUrl));
    expect(uniqueSources.size).toBeGreaterThanOrEqual(2);
    expect(uniqueUrls.size).toBeGreaterThanOrEqual(2);
  }

  if (scenario.expectDuplicateObservation) {
    const merged = report.customerEvidence.find((record) => record.sourceObservationIds.length > 1);
    expect(merged, "duplicate source observations must finalize into one canonical offer").toBeTruthy();
    expect(actualIds.filter((evidenceId) => evidenceId === merged.evidenceId)).toHaveLength(1);
  }

  if (scenario.expectNoPrice) {
    const noPrice = report.customerEvidence.find((record) => record.customerPriceLabel === "Price unavailable");
    expect(noPrice, "an exact no-price canonical record is required").toBeTruthy();
    expect(noPrice.customerPriceLabel).toBe("Price unavailable");
    expect(Number.isFinite(noPrice.canonicalPrice)).toBe(false);
    const card = cards.nth(report.customerEvidence.indexOf(noPrice));
    await expect(card.locator(".price-found-source")).toContainText("Price unavailable");
    await expect(card.getByRole("link", { name: "View source" })).toHaveAttribute("href", noPrice.destinationUrl);
    const otherPrices = report.customerEvidence
      .filter((record) => record.evidenceId !== noPrice.evidenceId)
      .map((record) => record.customerPriceLabel)
      .filter((label) => label !== "Price unavailable");
    for (const price of otherPrices) {
      await expect(card.locator(".price-found-source")).not.toContainText(price);
    }
  }
}

async function assertCopyParity(page, report) {
  const copyButton = page.locator(".summary-copy").first();
  await expect(copyButton).toBeVisible();
  await copyButton.click();
  await expect(copyButton).toHaveText("Copied!");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const indexes = report.customerEvidence.map((record) => copied.indexOf(record.destinationUrl));
  expect(indexes.every((index) => index >= 0)).toBe(true);
  expect(indexes).toEqual([...indexes].sort((left, right) => left - right));
  for (const record of report.customerEvidence) {
    expect(countOccurrences(copied, record.destinationUrl)).toBe(1);
  }
  if (report.customerEvidence.some((record) => record.customerPriceLabel === "Price unavailable")) {
    expect(copied).toContain("Price unavailable");
  }
}

async function readabilityAudit(page) {
  return page.locator(".canonical-evidence-section").evaluate((section) => {
    const parseColor = (value) => {
      const match = String(value).match(/rgba?\(([^)]+)\)/i);
      if (!match) return null;
      const parts = match[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return {
        r: parts[0],
        g: parts[1],
        b: parts[2],
        a: parts.length > 3 ? parts[3] : 1
      };
    };
    const composite = (foreground, background) => {
      const alpha = foreground.a + background.a * (1 - foreground.a);
      if (!alpha) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (foreground.r * foreground.a + background.r * background.a * (1 - foreground.a)) / alpha,
        g: (foreground.g * foreground.a + background.g * background.a * (1 - foreground.a)) / alpha,
        b: (foreground.b * foreground.a + background.b * background.a * (1 - foreground.a)) / alpha,
        a: alpha
      };
    };
    const effectiveBackground = (element) => {
      let background = { r: 0, g: 0, b: 0, a: 0 };
      for (let current = element; current; current = current.parentElement) {
        const currentStyle = getComputedStyle(current);
        const layer = parseColor(currentStyle.backgroundColor);
        if (layer) background = composite(background, layer);
        if (background.a < 1 && currentStyle.backgroundImage !== "none") {
          const imageLayer = parseColor(currentStyle.backgroundImage);
          if (imageLayer) background = composite(background, { ...imageLayer, a: 1 });
        }
      }
      return background.a < 1
        ? composite(background, { r: 255, g: 255, b: 255, a: 1 })
        : background;
    };
    const luminance = (color) => {
      const channel = (value) => {
        const normalized = value / 255;
        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
    };
    const contrast = (left, right) => {
      const values = [luminance(left), luminance(right)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    const describe = (element) => ({
      tag: element.tagName.toLowerCase(),
      className: element.className,
      text: String(element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 180)
    });
    const failures = [];
    const required = [
      section,
      ...section.querySelectorAll(
        ".price-found-row, h4, .price-found-source, .price-found-meta-line, .price-found-product-title, .price-found-action"
      )
    ];

    for (const element of required) {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const text = String(element.textContent || "").replace(/\s+/g, " ").trim();
      if (!element.isConnected) failures.push({ ...describe(element), issue: "detached" });
      if (style.display === "none") failures.push({ ...describe(element), issue: "display:none" });
      if (["hidden", "collapse"].includes(style.visibility)) failures.push({ ...describe(element), issue: `visibility:${style.visibility}` });
      if (Number(style.opacity) <= 0) failures.push({ ...describe(element), issue: `opacity:${style.opacity}` });
      if (rect.width <= 0 || rect.height <= 0) failures.push({ ...describe(element), issue: "non-positive bounding box", rect: rect.toJSON() });
      if (element !== section && !text) failures.push({ ...describe(element), issue: "empty required text" });

      if (text && !element.classList.contains("price-found-row")) {
        const color = parseColor(style.color);
        const background = effectiveBackground(element);
        if (!color || color.a <= 0) {
          failures.push({ ...describe(element), issue: "text color has no visible alpha", color: style.color });
        } else {
          const ratio = contrast(composite(color, background), background);
          const fontSize = Number.parseFloat(style.fontSize);
          const fontWeight = Number.parseInt(style.fontWeight, 10) || 400;
          const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
          const minimum = large ? 3 : 4.5;
          if (ratio + 0.01 < minimum) {
            failures.push({
              ...describe(element),
              issue: "text contrast below threshold",
              color: style.color,
              background,
              contrast: Number(ratio.toFixed(2)),
              minimum,
              fontSize,
              fontWeight
            });
          }
        }
      }
    }

    const viewportWidth = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > viewportWidth + 1) {
      failures.push({
        issue: "document horizontal overflow",
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: viewportWidth
      });
    }
    if (section.scrollWidth > section.clientWidth + 1) {
      failures.push({
        issue: "evidence-section horizontal overflow",
        scrollWidth: section.scrollWidth,
        clientWidth: section.clientWidth
      });
    }

    const cards = [...section.querySelectorAll(".price-found-row")];
    for (const card of cards) {
      const cardRect = card.getBoundingClientRect();
      if (cardRect.left < -1 || cardRect.right > viewportWidth + 1) {
        failures.push({ ...describe(card), issue: "card outside viewport width", rect: cardRect.toJSON(), viewportWidth });
      }
      if (card.scrollWidth > card.clientWidth + 1) {
        failures.push({ ...describe(card), issue: "card horizontal clipping", scrollWidth: card.scrollWidth, clientWidth: card.clientWidth });
      }
      const visibleChildren = [...card.children].filter((child) => getComputedStyle(child).display !== "none");
      const lastChild = visibleChildren.at(-1);
      if (lastChild && lastChild.getBoundingClientRect().bottom > cardRect.bottom + 1) {
        failures.push({ ...describe(card), issue: "card content vertically clipped" });
      }
      const ordered = [
        card.querySelector(".price-found-primary"),
        card.querySelector(".price-found-meta-line"),
        card.querySelector(".price-found-product-title"),
        card.querySelector(".price-found-address"),
        card.querySelector(".price-found-actions")
      ].filter(Boolean);
      for (let index = 1; index < ordered.length; index += 1) {
        const previous = ordered[index - 1].getBoundingClientRect();
        const current = ordered[index].getBoundingClientRect();
        if (current.top < previous.bottom - 2) {
          failures.push({ ...describe(card), issue: "card text overlap", previous: previous.toJSON(), current: current.toJSON() });
        }
      }
      const link = card.querySelector(".price-found-action");
      if (link) {
        const linkStyle = getComputedStyle(link);
        const linkColor = parseColor(linkStyle.color);
        const linkBackground = effectiveBackground(link);
        const ratio = linkColor ? contrast(composite(linkColor, linkBackground), linkBackground) : 0;
        if (ratio + 0.01 < 3) {
          failures.push({
            ...describe(link),
            issue: "source-control contrast below 3:1",
            color: linkStyle.color,
            background: linkBackground,
            contrast: Number(ratio.toFixed(2))
          });
        }
      }
    }

    for (let index = 1; index < cards.length; index += 1) {
      const gap = cards[index].getBoundingClientRect().top - cards[index - 1].getBoundingClientRect().bottom;
      if (gap > 72) failures.push({ issue: "large unexplained blank region between cards", gap });
    }
    if (cards.length) {
      const tailGap = section.getBoundingClientRect().bottom - cards.at(-1).getBoundingClientRect().bottom;
      if (tailGap > 180) failures.push({ issue: "large unexplained blank region after evidence cards", gap: tailGap });
    }

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        documentClientWidth: viewportWidth,
        documentScrollWidth: document.documentElement.scrollWidth
      },
      cardCount: cards.length,
      failures
    };
  });
}

async function assertReadability(page) {
  const metrics = await readabilityAudit(page);
  const links = page.locator(".canonical-evidence-section .price-found-action");
  for (let index = 0; index < await links.count(); index += 1) {
    const link = links.nth(index);
    await link.scrollIntoViewIfNeeded();
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual((await page.evaluate(() => window.innerWidth)) + 1);
  }
  expect(metrics.failures, JSON.stringify(metrics, null, 2)).toEqual([]);
  return metrics;
}

async function captureScreenshots(page, scenario, projectName) {
  fs.mkdirSync(screenshotDirectory, { recursive: true });
  const name = scenarioName(scenario, projectName);
  const fullPagePath = path.join(screenshotDirectory, `${name}-full.png`);
  const evidencePath = path.join(screenshotDirectory, `${name}-evidence.png`);
  await page.screenshot({ path: fullPagePath, fullPage: true });
  await page.locator(".canonical-evidence-section").screenshot({ path: evidencePath });
  return { fullPagePath, evidencePath };
}

function assertStable(state) {
  expect(state.consoleErrors, JSON.stringify(state.consoleErrors, null, 2)).toEqual([]);
  expect(state.pageErrors, JSON.stringify(state.pageErrors, null, 2)).toEqual([]);
  expect(state.externalRequests, JSON.stringify(state.externalRequests, null, 2)).toEqual([]);
  expect(state.productionDomainRequests).toEqual([]);
  expect(state.unexpectedRequestFailures, JSON.stringify(state.unexpectedRequestFailures, null, 2)).toEqual([]);
  if (state.consoleWarnings.length) {
    console.log(`BROWSER_INFORMATIONAL_WARNINGS ${JSON.stringify(state.consoleWarnings)}`);
  }
}

async function runSuccessfulScenario(page, scenario, projectName) {
  const state = installBrowserGuards(page, scenario);
  await configureForm(page, scenario, state);
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => state.analysisRequests.length).toBe(1);
  await expect(page.locator(".canonical-evidence-section")).toHaveCount(1);
  await expect(page.locator(".canonical-evidence-section [data-evidence-id]").first()).toBeVisible();
  await page.waitForTimeout(200);

  assertSubmittedRequest(state, scenario);
  await assertCanonicalCards(page, state, scenario);
  expect(state.handlerResult.finalEvidenceResult.decisionResult.purpose).toBe(
    purposes[scenario.purpose].canonicalPurpose
  );

  if (scenario.purpose === "listing") {
    expect(state.handlerResult.report.optimizedListingTitle).toBe("Cedarline Privacy Mailers 48 Count");
    await expect(page.locator("#results")).toContainText("Cedarline Privacy Mailers 48 Count");
  }

  if (scenario.copyParity) {
    await assertCopyParity(page, state.handlerResult.report);
  }
  const screenshots = await captureScreenshots(page, scenario, projectName);
  assertStable(state);
  const readability = await assertReadability(page);
  return { state, screenshots, readability };
}

test("real form submits one retail analysis and renders canonical cards", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "retail",
    purpose: "personal_use",
    validateForm: true,
    expectCrossRetailer: true,
    copyParity: true
  }, testInfo.project.name);
});

test("Buy to Resell renders canonical evidence exactly once", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "retail",
    purpose: "resale"
  }, testInfo.project.name);
});

test("Value Something I Own renders canonical evidence exactly once", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "retail",
    purpose: "market_value"
  }, testInfo.project.name);
});

test("Sell Something I Own preserves seller content and canonical evidence", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "retail",
    purpose: "listing"
  }, testInfo.project.name);
});

test("collectible duplicate, cross-retailer, and exact no-price evidence stay canonical", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "collectible",
    purpose: "personal_use",
    expectCrossRetailer: true,
    expectDuplicateObservation: true,
    expectNoPrice: true,
    copyParity: true
  }, testInfo.project.name);
});

test("malformed canonical evidence fails closed without legacy reconstruction", async ({ page }, testInfo) => {
  const scenario = {
    evidenceMode: "retail",
    purpose: "personal_use",
    malformedCanonical: true
  };
  const state = installBrowserGuards(page, scenario);
  await configureForm(page, scenario, state);
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => state.analysisRequests.length).toBe(1);
  const section = page.locator(".canonical-evidence-section");
  await expect(section).toHaveCount(1);
  await expect(section).toContainText("Finalized customer evidence is unavailable.");
  await expect(section.locator("[data-evidence-id]")).toHaveCount(0);
  await expect(section).not.toContainText("Wrong retailer");
  await expect(section).not.toContainText("$999.00");
  await expect(page.getByRole("heading", { name: "Prices Found", exact: true })).toHaveCount(0);
  assertSubmittedRequest(state, scenario);
  await captureScreenshots(page, scenario, testInfo.project.name);
  assertStable(state);
  await assertReadability(page);
});
