import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const photoFixture = path.join(repositoryRoot, "tests", "fixtures", "browser", "neutral-test-object.svg");
const visualReviewDirectory = String(process.env.KE_AESTHETIC_REVIEW_DIR || "").trim();

const viewports = Object.freeze([
  { name: "desktop", width: 1440, height: 1000 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 }
]);

function evidenceRecord(index, overrides = {}) {
  return {
    evidenceId: `experience-evidence-${index}`,
    underlyingOfferId: `experience-offer-${index}`,
    destinationUrl: `https://source-${index}.example/items/everyday-object-${index}`,
    sourceLabel: index % 2 ? "Hearth & Home Market" : "Northstar Mercantile",
    title: `Everyday object evidence record ${index + 1}`,
    canonicalMatchCode: index % 2 ? "compatible" : "exact",
    canonicalMatchLabel: index % 2 ? "Compatible variation" : "Exact match",
    canonicalPrice: 18 + index,
    canonicalPriceType: index % 2 ? "Active asking price" : "Current retail price",
    priceTypeCode: index % 2 ? "active_asking" : "current_retail",
    customerPriceLabel: `$${(18 + index).toFixed(2)}`,
    quantity: 1,
    quantityLabel: "1 item",
    importantAttributes: index % 2 ? ["Different finish", "Same model family"] : ["Matching model", "Matching package"],
    shippingStatus: "unknown",
    shippingLabel: "Shipping not shown",
    deliveredCostAmount: null,
    deliveredCostStatus: "not_established",
    deliveredCostLabel: "Delivered cost not established",
    availabilityStatus: index % 2 ? "Active listing; availability unconfirmed" : "Current listing; availability unconfirmed",
    customerEligible: true,
    displayEligible: true,
    rangeEligible: true,
    decisionEligible: true,
    sourceObservationIds: [`experience-observation-${index}`],
    purchaseChannel: index % 2 ? "Marketplace" : "Retailer",
    conciseLimitation: index % 2 ? "Finish varies from the photographed item." : "Condition must still be checked at the source.",
    knownDifferences: index % 2 ? ["Finish"] : [],
    ...overrides
  };
}

function evidenceSummary(records) {
  const countBy = (field) => records.reduce((counts, record) => {
    const key = record[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  return {
    displayedIds: records.map((record) => record.evidenceId),
    counts: { displayed: records.length },
    displayedCountByRetailer: countBy("sourceLabel"),
    displayedCountByPriceType: countBy("canonicalPriceType"),
    displayedCountByMatchClass: countBy("canonicalMatchLabel")
  };
}

function reportFixture(overrides = {}) {
  const records = overrides.customerEvidence || [evidenceRecord(0), evidenceRecord(1)];
  return {
    buyerIntent: "personal_use",
    exactProductIdentity: "Hawthorne & Finch walnut valet tray, model HF-214",
    subjectIdentity: "Walnut valet tray",
    identitySummary: "A small walnut organizer with a maker’s mark and removable divider.",
    exactProductConfidence: "High",
    whatIsStillUnknown: ["Final condition under the divider has not been photographed."],
    valuationEvidenceState: "supported",
    valuationEvidenceLabel: "Supported market range",
    valuationEvidenceExplanation: "The range is supported by exact and compatible source records shown below.",
    verifiedMarketRange: "$18.00–$28.00",
    askingPrice: "$20.00",
    recommendation: "A reasonable personal-use buy if the hidden surfaces are clean.",
    valueRating: "Fair value",
    pricingConfidence: "Moderate",
    purchaseContextSummary: "Considering the item for personal use at a local shop.",
    customerPricingSummary: "The asking price sits within the supported market range.",
    maximumRecommendedPriceExplanation: "Stay at or below $24.00 unless condition is exceptional.",
    recommendedOffer: "$18.00–$20.00",
    negotiationGuidance: "Ask whether the divider lifts out and check for staining before agreeing to the price.",
    productOrConditionRisks: ["Hidden staining", "Loose divider"],
    bestNextStep: "Lift the divider, photograph the base, and confirm there is no odor or water damage.",
    additionalInformationNeeded: "One clear photograph beneath the divider would improve confidence.",
    customerEvidence: records,
    customerEvidenceSummary: evidenceSummary(records),
    searchQueriesUsed: ["Hawthorne Finch HF-214 walnut valet tray"],
    sourcesSearched: ["Retail", "Marketplace"],
    searchLimitations: ["No verified completed sale was supplied."],
    searchDiagnostics: {
      queryCount: 1,
      queriesActuallySent: ["Hawthorne Finch HF-214 walnut valet tray"],
      retainedVisibleResultCount: records.length,
      canonicalCustomerEvidenceIds: records.map((record) => record.evidenceId)
    },
    ...overrides,
    customerEvidence: records,
    customerEvidenceSummary: overrides.customerEvidenceSummary || evidenceSummary(records)
  };
}

async function installLocalOnlyGuard(page) {
  const externalRequests = [];
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === "127.0.0.1" && url.port === "4177") {
      await route.continue();
      return;
    }
    externalRequests.push(route.request().url());
    await route.abort("blockedbyclient");
  });
  return { externalRequests, consoleErrors, pageErrors };
}

async function openFresh(page) {
  await page.goto("/");
  await expect(page.locator("#listing-form")).toBeVisible();
}

async function renderReportFixture(page, report, workflow = "personal_use") {
  await page.evaluate(({ fixture, selectedWorkflow }) => {
    currentWorkflow = selectedWorkflow;
    latestReport = structuredClone(fixture);
    latestSections = workflowConfigs[selectedWorkflow].sections;
    setOutputHeading(workflowConfigs[selectedWorkflow]);
    renderReport(latestReport, latestSections);
    copyAllButton.disabled = false;
  }, { fixture: report, selectedWorkflow: workflow });
  await expect(page.locator(".report-root")).toBeVisible();
}

async function assertViewportIntegrity(page) {
  const metrics = await page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
    };
    const overflow = [...document.querySelectorAll("body *")]
      .filter(visible)
      .map((element) => {
        const box = element.getBoundingClientRect();
        return { tag: element.tagName, className: element.className, left: box.left, right: box.right };
      })
      .filter((box) => box.left < -1 || box.right > window.innerWidth + 1)
      .slice(0, 8);
    const keyTargets = [
      ...document.querySelectorAll(".workflow-option, .photo-action, .primary-button, .price-found-action, .technical-details-summary")
    ].filter(visible).map((element) => {
      const box = element.getBoundingClientRect();
      return { label: element.textContent.trim().slice(0, 60), width: box.width, height: box.height };
    });
    return {
      bodyWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      overflow,
      shortTargets: keyTargets.filter((target) => target.height < 43 || target.width < 43)
    };
  });
  expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
  expect(metrics.overflow, JSON.stringify(metrics.overflow, null, 2)).toEqual([]);
  expect(metrics.shortTargets, JSON.stringify(metrics.shortTargets, null, 2)).toEqual([]);
}

async function captureReview(page, viewportName, stateName) {
  if (!visualReviewDirectory) return;
  fs.mkdirSync(visualReviewDirectory, { recursive: true });
  await page.screenshot({
    path: path.join(visualReviewDirectory, `${viewportName}-${stateName}.png`),
    fullPage: true
  });
}

async function verifyState(page, viewportName, stateName) {
  await assertViewportIntegrity(page);
  await captureReview(page, viewportName, stateName);
}

test("aesthetic foundation renders sixteen deterministic customer states at desktop, tablet, and mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "The desktop project drives all three explicit aesthetic viewports.");
  const guard = await installLocalOnlyGuard(page);
  const photoBuffer = fs.readFileSync(photoFixture);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await openFresh(page);
    await expect(page.getByText("Your guide to identifying, valuing, buying, and selling the things around you.", { exact: true })).toBeVisible();
    await expect(page.locator("#workflow-field legend")).toContainText("What would you like help with?");
    await verifyState(page, viewport.name, "01-opening");

    const resalePurpose = page.getByRole("radio", { name: /Buying to Resell/i });
    await resalePurpose.check();
    await expect(resalePurpose).toBeChecked();
    const selectedStyle = await page.locator(".workflow-option:has(input:checked)").evaluate((element) => getComputedStyle(element).boxShadow);
    expect(selectedStyle).toContain("inset");
    await verifyState(page, viewport.name, "02-purpose-selected");

    await openFresh(page);
    await page.locator("#photos").setInputFiles({ name: "front.svg", mimeType: "image/svg+xml", buffer: photoBuffer });
    await expect(page.locator(".photo-preview-item")).toHaveCount(1);
    await expect(page.locator(".photo-order")).toHaveText("Photo 1");
    await verifyState(page, viewport.name, "03-one-photo");

    await openFresh(page);
    await page.locator("#photos").setInputFiles([
      { name: "front.svg", mimeType: "image/svg+xml", buffer: photoBuffer },
      { name: "back.svg", mimeType: "image/svg+xml", buffer: photoBuffer },
      { name: "mark.svg", mimeType: "image/svg+xml", buffer: photoBuffer }
    ]);
    await expect(page.locator(".photo-preview-item")).toHaveCount(3);
    await expect(page.locator(".photo-order")).toHaveText(["Photo 1", "Photo 2", "Photo 3"]);
    await verifyState(page, viewport.name, "04-multiple-photos");

    await openFresh(page);
    await page.evaluate(() => renderLoadingProgress(getLoadingStages("personal_use"), 2));
    await expect(page.locator("#results")).toHaveAttribute("aria-busy", "true");
    await expect(page.locator(".loading-steps .is-active")).toHaveText("Comparing identity possibilities");
    await expect(page.locator(".loading-steps .is-complete")).toHaveCount(0);
    await verifyState(page, viewport.name, "05-loading");

    await openFresh(page);
    const retail = reportFixture({
      retailEvidenceMode: "current-retail-only",
      retailPurchaseDecision: "Buy at the current store price if the package count matches.",
      valuationEvidenceState: "current_retail",
      valuationEvidenceLabel: "Current retail price guidance",
      valuationEvidenceExplanation: "Current compatible retail offers support the displayed price guidance.",
      currentRetailPriceAssessment: "$18.00–$22.00 current compatible retail context",
      retailPriceLimit: "$22.00",
      askingStorePrice: "$19.99",
      namedStoreResult: "The named store price is within the compatible retail context.",
      currentPurchaseOptionSummary: "The named store is the clearest immediate purchase option."
    });
    await renderReportFixture(page, retail);
    await expect(page.locator(".report-identity-header")).toContainText(retail.exactProductIdentity);
    await expect(page.locator(".consumer-summary-card")).toContainText(retail.retailPurchaseDecision);
    await verifyState(page, viewport.name, "06-retail-current-price");

    await openFresh(page);
    const noPriceRecord = evidenceRecord(0, {
      canonicalPrice: null,
      canonicalPriceType: "Price unavailable",
      priceTypeCode: "price_unavailable",
      customerPriceLabel: "Price unavailable",
      deliveredCostLabel: "Delivered cost unavailable"
    });
    const noPrice = reportFixture({
      valuationEvidenceState: "insufficient",
      valuationEvidenceLabel: "Valuation not established",
      valuationEvidenceExplanation: "The exact source did not supply a usable price.",
      fairValueNotEstablished: "A fair value cannot be established from the available priced evidence.",
      recommendation: "Need More Information",
      customerEvidence: [noPriceRecord]
    });
    await renderReportFixture(page, noPrice);
    await expect(page.locator(".price-found-price strong")).toHaveText("Price unavailable");
    await verifyState(page, viewport.name, "07-price-unavailable");

    await openFresh(page);
    const collectible = reportFixture({
      exactProductIdentity: "Riverton Falcons 1999 championship advertising tray",
      subjectIdentity: "Sports advertising collectible tray",
      recommendation: "Treat the active listings as asking-price context, not verified sales.",
      valuationEvidenceLabel: "Supported asking-price context",
      valuationEvidenceExplanation: "Exact and similar active marketplace listings support context but do not prove a sale.",
      verifiedMarketRange: "$24.00–$38.00",
      customerEvidence: [
        evidenceRecord(0, { sourceLabel: "Collectors Market", canonicalPriceType: "Active asking price", priceTypeCode: "active_asking", purchaseChannel: "Marketplace" }),
        evidenceRecord(1, { sourceLabel: "Auction House", canonicalPriceType: "Auction listing", priceTypeCode: "auction", purchaseChannel: "Auction" })
      ]
    });
    await renderReportFixture(page, collectible);
    await expect(page.locator(".canonical-evidence-section")).toContainText("Active asking price");
    await expect(page.locator(".canonical-evidence-section")).toContainText("Auction listing");
    await verifyState(page, viewport.name, "08-collectible-marketplace");

    await openFresh(page);
    const single = reportFixture({
      valuationEvidenceState: "single_observation",
      valuationEvidenceLabel: "Single-observation context",
      valuationEvidenceExplanation: "Only one usable price observation was supplied.",
      fairValueNotEstablished: "One observation is not enough to establish a supported range.",
      customerEvidence: [evidenceRecord(0)]
    });
    await renderReportFixture(page, single);
    await expect(page.locator(".consumer-summary-card")).toContainText(single.valuationEvidenceExplanation);
    await verifyState(page, viewport.name, "09-single-observation");

    await openFresh(page);
    const uncertain = reportFixture({
      exactProductIdentity: "",
      subjectIdentity: "Small divided wooden object",
      identitySummary: "The object category is visible, but the maker and exact use remain uncertain.",
      exactProductConfidence: "Low",
      valuationEvidenceState: "insufficient",
      valuationEvidenceLabel: "Insufficient valuation evidence",
      valuationEvidenceExplanation: "Identity uncertainty prevents reliable price guidance.",
      fairValueNotEstablished: "A supported value is not established.",
      recommendation: "Need More Information",
      whatIsStillUnknown: ["Maker", "Dimensions", "Mark beneath the base"],
      customerEvidence: []
    });
    await renderReportFixture(page, uncertain);
    await expect(page.locator(".identity-confidence")).toContainText("Low");
    await expect(page.locator(".identity-limitation")).toContainText("Maker");
    await verifyState(page, viewport.name, "10-uncertain-identification");

    await openFresh(page);
    await page.locator("#purchase_context").selectOption("online_retailer");
    await page.locator("#listing-form").evaluate((form) => form.requestSubmit());
    await expect(page.locator("#form-error-photos")).toContainText("Add at least one item photograph");
    await expect(page.locator("#photos")).toHaveAttribute("aria-invalid", "true");
    await verifyState(page, viewport.name, "11-customer-safe-error");

    await openFresh(page);
    const longCopy = reportFixture({
      exactProductIdentity: "Hawthorne & Finch limited workshop edition walnut-and-brass valet organizer with removable watch rail and monogrammed presentation case",
      recommendation: "Proceed only after checking every hidden surface, confirming the workshop mark, measuring the removable rail, comparing the delivered cost, and deciding whether the unusually long presentation-case description matches the photographed object.",
      bestNextStep: "Ask for a sharply focused photograph of the underside, the monogram, the workshop stamp, the removable rail, and every condition issue before making a decision."
    });
    await renderReportFixture(page, longCopy);
    await expect(page.locator(".report-identity-header h3")).toHaveText(longCopy.exactProductIdentity);
    await verifyState(page, viewport.name, "12-long-content");

    await openFresh(page);
    const eight = reportFixture({ customerEvidence: Array.from({ length: 8 }, (_, index) => evidenceRecord(index)) });
    await renderReportFixture(page, eight);
    await expect(page.locator(".price-found-row")).toHaveCount(8);
    const renderedIds = await page.locator(".price-found-row").evaluateAll((rows) => rows.map((row) => row.dataset.evidenceId));
    expect(renderedIds).toEqual(eight.customerEvidence.map((record) => record.evidenceId));
    await verifyState(page, viewport.name, "13-eight-evidence-cards");

    await openFresh(page);
    await renderReportFixture(page, reportFixture());
    const technical = page.locator(".technical-report-disclosure");
    await expect(technical).not.toHaveAttribute("open", "");
    await verifyState(page, viewport.name, "14a-technical-collapsed");
    await technical.locator("summary").click();
    await expect(technical).toHaveAttribute("open", "");
    await verifyState(page, viewport.name, "14b-technical-expanded");

    await openFresh(page);
    await renderReportFixture(page, reportFixture());
    await page.locator(".summary-copy").click();
    await expect(page.locator(".summary-copy")).toHaveText("Copied!");
    await verifyState(page, viewport.name, "15-copy-controls");

    await openFresh(page);
    const askReport = reportFixture();
    await renderReportFixture(page, askReport);
    await page.evaluate((fixture) => {
      activeItemSession = {
        sessionId: "experience-session",
        workflow: "personal_use",
        report: structuredClone(fixture),
        conversationHistory: []
      };
      renderAskPanel();
    }, askReport);
    await expect(page.locator("#ask-panel")).toBeVisible();
    await expect(page.locator("#ask-question")).toHaveAccessibleName("Question");
    await verifyState(page, viewport.name, "16-ask-section");
  }

  expect(guard.externalRequests).toEqual([]);
  expect(guard.consoleErrors).toEqual([]);
  expect(guard.pageErrors).toEqual([]);
});
