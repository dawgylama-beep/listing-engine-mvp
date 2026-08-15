import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";
import { createGenerateListingHandler } from "../../api/generate-listing.js";
import { validateFinalEvidenceResult } from "../../lib/evidence/index.js";
import { buildBrowserHandlerResponse } from "../helpers/build-browser-handler-response.mjs";
import { installHardNetworkDenial } from "../helpers/hard-network-denial.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..");
const photoFixture = path.join(repositoryRoot, "tests", "fixtures", "browser", "neutral-test-object.svg");
const screenshotDirectory = path.join(repositoryRoot, "test-results", "review-screenshots");

function resolveExpectedVersionBadge() {
  const packageVersion = JSON.parse(fs.readFileSync(path.join(repositoryRoot, "package.json"), "utf8")).version;
  if (typeof packageVersion !== "string" || !/^\d+\.\d+\.\d+$/.test(packageVersion)) {
    throw new Error("package.json version must be a semantic version string.");
  }
  return `Version ${packageVersion}`;
}

const expectedVersionBadge = resolveExpectedVersionBadge();

function createDemandingBmpFixture(filePath, width = 6000, height = 6000) {
  const rowBytes = Math.ceil((width * 3) / 4) * 4;
  const pixelBytes = rowBytes * height;
  const bitmap = Buffer.alloc(54 + pixelBytes);
  bitmap.write("BM", 0, "ascii");
  bitmap.writeUInt32LE(bitmap.length, 2);
  bitmap.writeUInt32LE(54, 10);
  bitmap.writeUInt32LE(40, 14);
  bitmap.writeInt32LE(width, 18);
  bitmap.writeInt32LE(height, 22);
  bitmap.writeUInt16LE(1, 26);
  bitmap.writeUInt16LE(24, 28);
  bitmap.writeUInt32LE(pixelBytes, 34);
  let random = 0x6d2b79f5;
  for (let offset = 54; offset < bitmap.length; offset += 1) {
    random ^= random << 13;
    random ^= random >>> 17;
    random ^= random << 5;
    bitmap[offset] = random & 0xff;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, bitmap);
  return bitmap.length;
}

async function createOrdinaryPngFixture(page, filePath) {
  const dataUrl = await page.evaluate(() => {
    const baseSize = 280;
    const source = document.createElement("canvas");
    source.width = baseSize;
    source.height = baseSize;
    const context = source.getContext("2d", { alpha: false });
    const unit = baseSize / 1100;
    context.fillStyle = "#f8f8f3";
    context.fillRect(0, 0, baseSize, baseSize);
    context.strokeStyle = "#d4e8ee";
    context.lineWidth = 1;
    for (let offset = -baseSize; offset < baseSize * 2; offset += 30) {
      context.beginPath();
      context.moveTo(offset, 0);
      context.lineTo(offset - baseSize, baseSize);
      context.stroke();
    }
    context.fillStyle = "#0f4d68";
    context.fillRect(60 * unit, 60 * unit, 980 * unit, 125 * unit);
    context.fillStyle = "#ffffff";
    context.font = `bold ${59 * unit}px Arial`;
    context.fillText("Office Works", 105 * unit, 145 * unit);
    context.fillStyle = "#ffffff";
    context.strokeStyle = "#0f4d68";
    context.lineWidth = Math.max(2, 7 * unit);
    context.fillRect(90 * unit, 250 * unit, 920 * unit, 625 * unit);
    context.strokeRect(90 * unit, 250 * unit, 920 * unit, 625 * unit);
    context.fillStyle = "#153d50";
    context.font = `bold ${43 * unit}px Arial`;
    context.fillText("Strip and Seal", 150 * unit, 360 * unit);
    context.fillText("Security Envelopes", 150 * unit, 418 * unit);
    context.font = `${35 * unit}px Arial`;
    context.fillText("White", 150 * unit, 518 * unit);
    context.fillText("45 Count", 150 * unit, 570 * unit);
    context.font = `bold ${33 * unit}px monospace`;
    context.fillText("UPC 041226087161", 150 * unit, 700 * unit);
    context.fillStyle = "#e5edf0";
    context.fillRect(150 * unit, 750 * unit, 750 * unit, 45 * unit);
    context.fillStyle = "#183f50";
    for (let index = 0; index < 48; index += 1) {
      const width = (index % 5 === 0 ? 5 : index % 3 === 0 ? 3 : 2) * unit;
      context.fillRect((180 + index * 13.5) * unit, 755 * unit, Math.max(1, width), 35 * unit);
    }
    const canvas = document.createElement("canvas");
    canvas.width = 2200;
    canvas.height = 2200;
    const output = canvas.getContext("2d", { alpha: false });
    output.imageSmoothingEnabled = false;
    output.drawImage(source, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  });
  const buffer = Buffer.from(dataUrl.split(",", 2)[1] || "", "base64");
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer);
  return {
    format: "png",
    width: 2200,
    height: 2200,
    bytes: buffer.length
  };
}

function dataUrlByteLength(dataUrl) {
  return Buffer.from(String(dataUrl || "").split(",", 2)[1] || "", "base64").byteLength;
}

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
    radioName: /What’s It Worth\?/i,
    requestPurpose: "owner_value",
    canonicalPurpose: "owner_value",
    reportType: "marketValue"
  },
  listing: {
    radioName: /Create a Listing/i,
    requestPurpose: "seller_listing",
    canonicalPurpose: "seller_listing",
    reportType: "listing"
  }
});

const valuationContextFields = Object.freeze([
  "valuationEvidenceState",
  "valuationEvidenceLabel",
  "valuationEvidenceExplanation",
  "verifiedMarketRange",
  "currentAskingPriceRange",
  "preliminaryReferenceRange",
  "fairValueNotEstablished",
  "estimatedFairMarketValue",
  "estimatedMarketValue",
  "fairPriceRange",
  "currentRetailPriceAssessment",
  "retailPriceLimit",
  "valueRating",
  "priceBasis",
  "priceRationale",
  "pricingRationale",
  "recommendation",
  "recommendedListingPrice",
  "suggestedListingPrice",
  "expectedSalePrice",
  "minimumAcceptablePrice",
  "recommendedOffer",
  "walkAwayPrice",
  "maximumRecommendedPrice",
  "maximumRecommendedBuyPrice"
]);

const displayFieldKeysByState = Object.freeze({
  supported: Object.freeze(["verifiedMarketRange", "estimatedFairMarketValue", "estimatedMarketValue", "fairPriceRange"]),
  current_asking: Object.freeze(["currentAskingPriceRange"]),
  preliminary: Object.freeze(["preliminaryReferenceRange"]),
  single_observation: Object.freeze(["fairValueNotEstablished"]),
  insufficient: Object.freeze(["fairValueNotEstablished"]),
  current_retail: Object.freeze(["currentRetailPriceAssessment", "retailPriceLimit"]),
  retail_unverified: Object.freeze(["currentRetailPriceAssessment", "noCompatiblePricesFound"])
});

const rangeStateVisualRecognition = Object.freeze({
  visualSubject: "Riverton Falcons championship tray",
  visualSubjectCategory: "sports advertising collectible",
  visualSubjectConfidence: "High",
  recognizedOrganization: "Riverton Falcons",
  recognizedBrand: "RefreshCo",
  visibleWords: ["RIVERTON", "1999 CHAMPIONS", "RefreshCo"],
  visualEvidence: ["championship tray"]
});

const rangeStateIdentity = Object.freeze({
  visualRecognition: rangeStateVisualRecognition,
  ...rangeStateVisualRecognition,
  brand: "RefreshCo",
  manufacturer: "RefreshCo",
  category: "sports advertising collectible tray",
  likelyItemDescription: "RefreshCo Riverton Falcons 1999 Champions collector tray",
  subjectIdentity: "Riverton Falcons RefreshCo collector tray",
  exactProductIdentity: "RefreshCo Riverton Falcons 1999 Champions collector tray",
  exactProductConfidence: "High",
  productNameOrBoxTitle: "RefreshCo Riverton Falcons collector tray",
  frontBoxWording: "1999 CHAMPIONS RIVERTON RefreshCo",
  visibleText: ["RIVERTON", "1999 CHAMPIONS", "RefreshCo"],
  visualIdentityEvidence: ["RefreshCo logo", "Riverton championship wording"],
  textIdentityEvidence: ["RIVERTON", "1999 CHAMPIONS"],
  strongestSearchableIdentifiers: ["Riverton Falcons 1999 Champions RefreshCo collector tray"],
  identitySummary: "RefreshCo Riverton Falcons 1999 Champions collector tray.",
  identityConflictNotes: []
});

const rangeStateModelReport = Object.freeze({
  identifiedItem: "RefreshCo Riverton Falcons 1999 Champions collector tray",
  recommendation: "Need More Information",
  valueRating: "Model value must be replaced by canonical evidence.",
  suggestedListingPrice: "$30.00",
  expectedSalePrice: "$20.00 - $30.00",
  minimumAcceptablePrice: "$15.00",
  recommendedSellingPlatform: "Local marketplace"
});

const rangeStateProviderResponses = Object.freeze({
  supported: Object.freeze([
    Object.freeze({
      position: 1,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray sold",
      link: "https://sold-one.example/item/tray",
      snippet: "Exact item. Sold for $20.00 on June 2, 2026. Completed sale."
    }),
    Object.freeze({
      position: 2,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray sold",
      link: "https://sold-two.example/item/tray",
      snippet: "Exact item. Sold for $28.00 on May 10, 2026. Completed transaction."
    })
  ]),
  current_asking: Object.freeze([
    Object.freeze({
      position: 1,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray",
      link: "https://ask-one.example/item/tray",
      snippet: "Exact item active listing. Asking price $22.00. Available now."
    }),
    Object.freeze({
      position: 2,
      title: "Riverton Falcons 1999 Champions RefreshCo collector tray",
      link: "https://ask-two.example/item/tray",
      snippet: "Exact item active listing. Asking price $30.00. In stock."
    })
  ])
});

function createResponseCapture() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

async function buildRangeStateHandlerResponse({ requestBody, state }) {
  const organic = rangeStateProviderResponses[state];
  if (!organic) {
    throw new Error(`Unsupported deterministic range-state fixture: ${state}`);
  }

  const schemas = [];
  const providerStages = [];
  const directPageRequests = [];
  const finalized = [];
  let clock = Date.parse("2026-07-24T16:00:00.000Z");
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-browser-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => requestBody.analysisId || `analysis-browser-${state}`,
    nowMilliseconds: () => {
      clock += 5;
      return clock;
    },
    nowIso: () => new Date(clock).toISOString(),
    requestOpenAIJson: async ({ payload }) => {
      const schemaName = payload?.text?.format?.name;
      schemas.push(schemaName);
      if (schemaName === "item_identity") {
        return { json: rangeStateIdentity, data: { output: [] } };
      }
      if (schemaName === "market_value_report") {
        return { json: rangeStateModelReport, data: { output: [] } };
      }
      throw new Error(`Unexpected deterministic range-state schema: ${schemaName}`);
    },
    requestSerperSearch: async ({ queryRecord }) => {
      providerStages.push(queryRecord?.retailStage || queryRecord?.searchPass || "unknown");
      return { json: { organic }, statusCode: 200, elapsedMs: 2 };
    },
    requestBoundedRetailProductPage: async (url) => {
      directPageRequests.push(url);
      return {
        finalUrl: url,
        statusCode: 200,
        elapsedMs: 2,
        html: "<html><body><h1>Riverton Falcons 1999 Champions RefreshCo collector tray</h1></body></html>",
        sourceEvidenceText: `Riverton Falcons 1999 Champions RefreshCo collector tray ${organic.map((record) => record.snippet).join(" ")}`
      };
    },
    onFinalEvidenceResult: (result) => finalized.push(result)
  });

  const response = createResponseCapture();
  const networkGuard = installHardNetworkDenial();
  try {
    await handler({ method: "POST", body: structuredClone(requestBody) }, response);
  } finally {
    networkGuard.restore();
  }

  if (response.statusCode !== 200 || !response.payload) {
    throw new Error(`Deterministic range-state handler failed with status ${response.statusCode}.`);
  }
  expect(networkGuard.attempts).toEqual([]);
  expect(finalized).toHaveLength(1);
  validateFinalEvidenceResult(finalized[0]);
  const envelope = requestBody.reportType === "listing" ? "listing" : "valuation";

  return {
    payload: response.payload,
    envelope,
    report: response.payload[envelope],
    canonicalReport: response.payload[envelope],
    finalEvidenceResult: finalized[0],
    metadata: {
      schemas,
      providerStages,
      directPageRequests,
      finalizerExecutions: finalized.length,
      unexpectedNodeNetworkAttempts: networkGuard.attempts
    }
  };
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function countOccurrences(text, value) {
  if (!value) return 0;
  return String(text).split(value).length - 1;
}

function hasDisplayValue(value) {
  return Array.isArray(value)
    ? value.length > 0
    : value !== null && value !== undefined && normalizeText(value) !== "";
}

function applyScenarioContract(result, scenario) {
  if (!scenario.canonicalContractVariant && !scenario.malformedValuation) {
    return result;
  }

  const payload = structuredClone(result.payload);
  const report = payload[result.envelope];
  if (scenario.canonicalContractVariant === "preliminary") {
    report.valuationEvidenceState = "preliminary";
    report.valuationEvidenceLabel = "Preliminary Reference Range";
    report.valuationEvidenceExplanation = "Weak, partial, guide, auction, or reference evidence supports only a preliminary reference range.";
    report.preliminaryReferenceRange = String(report.currentAskingPriceRange || "")
      .replace(/^Current Asking-Price Range/i, "Preliminary Reference Range");
    report.currentAskingPriceRange = "";
    report.fairValueNotEstablished = "";
  }

  if (scenario.malformedValuation) {
    report.preliminaryReferenceRange = "$111.00-$222.00 malformed canonical range";
    report.internalValuationNarrative = "Untrusted free text claims a $333.00-$444.00 value.";
    if (scenario.malformedValuation === "missing_state") {
      delete report.valuationEvidenceState;
    } else if (scenario.malformedValuation === "unknown_state") {
      report.valuationEvidenceState = "unknown_contract_state";
    } else if (scenario.malformedValuation === "missing_label") {
      delete report.valuationEvidenceLabel;
    } else if (scenario.malformedValuation === "missing_explanation") {
      delete report.valuationEvidenceExplanation;
    }
  }

  return {
    ...result,
    payload,
    report,
    canonicalReport: report
  };
}

function expectedMeta(record) {
  return [
    record.quantityLabel,
    record.canonicalMatchLabel,
    record.canonicalPriceType,
    record.unitPrice
  ].filter(Boolean).join(" · ");
}

function scenarioName({ evidenceMode, purpose, malformedCanonical, malformedValuation, canonicalContractVariant, handlerState }, projectName) {
  const state = malformedCanonical
    ? "fail-closed"
    : malformedValuation
      ? `valuation-${malformedValuation}`
      : `${canonicalContractVariant || handlerState || evidenceMode}-${purpose}`;
  return `${state}-${projectName}`;
}

async function installBrowserGuards(page, scenario) {
  const state = {
    analysisRequests: [],
    askRequests: [],
    externalRequests: [],
    productionDomainRequests: [],
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    unexpectedRequestFailures: [],
    handlerResult: null,
    handlerReportSnapshots: []
  };

  await page.addInitScript(() => {
    const originalJson = Response.prototype.json;
    const deepFreeze = (value) => {
      if (!value || typeof value !== "object" || Object.isFrozen(value)) {
        return value;
      }
      Object.freeze(value);
      Object.values(value).forEach(deepFreeze);
      return value;
    };
    Response.prototype.json = async function canonicalHandlerJson(...args) {
      const data = await originalJson.apply(this, args);
      const report = data?.valuation || data?.listing;
      if (report) {
        window.__canonicalHandlerReportSnapshot = JSON.stringify(report);
        window.__canonicalHandlerReportDeepFrozen = true;
        deepFreeze(report);
      }
      return data;
    };
  });

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

  await page.route("**/*", async (route) => {
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
      if (body.action === "ask_market_edge") {
        state.askRequests.push(body);
        await route.fulfill({
          status: 200,
          contentType: "application/json; charset=utf-8",
          body: JSON.stringify({
            answer: {
              answer: "Deterministic captured Ask response.",
              answerType: "item_context",
              assumptions: [],
              updatedScenario: {}
            }
          })
        });
        return;
      }
      state.analysisRequests.push({
        method: request.method(),
        url: request.url(),
        bodyBytes: Buffer.byteLength(request.postData() || "", "utf8"),
        body
      });
      const handlerResult = scenario.handlerState
        ? await buildRangeStateHandlerResponse({ requestBody: body, state: scenario.handlerState })
        : await buildBrowserHandlerResponse({
            requestBody: body,
            evidenceMode: scenario.evidenceMode,
            malformedCanonical: scenario.malformedCanonical === true
          });
      state.handlerResult = applyScenarioContract(handlerResult, scenario);
      state.handlerReportSnapshots.push(JSON.stringify(state.handlerResult.report));
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
  await expect(page.getByText(expectedVersionBadge, { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: purpose.radioName }).check();

  await page.locator("#notes").fill(
    scenario.tokenBudgetFixture
      ? "041226087161"
      : scenario.evidenceMode === "collectible"
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
    const context = scenario.purchaseContext || (scenario.evidenceMode === "retail" && scenario.purpose === "personal_use"
      ? "retail_store"
      : "private_seller");
    await page.locator("#purchase_context").selectOption(context);
    if (context === "retail_store") {
      await page.locator("#store_name").fill("Example Office Store");
      await page.locator("#location_zip").fill("30188");
    } else {
      await page.locator("#retailer_or_marketplace_name").fill(
        scenario.retailerName || (scenario.tokenBudgetFixture ? "Office Works" : "Deterministic private seller")
      );
    }
  }

  if (scenario.purpose === "personal_use" || scenario.purpose === "resale") {
    await page.locator("#asking_price").fill(scenario.evidenceMode === "collectible" ? "10.00" : "5.50");
  }
  await page.locator("#item_condition").selectOption(scenario.evidenceMode === "collectible" ? "vintage" : "new");

  const productDetails = page.locator("details.details-panel").first();
  await productDetails.locator("summary").click();
  await page.locator("#item_name").fill(
    scenario.itemName || (scenario.evidenceMode === "collectible"
      ? "Riverton Falcons 1999 Champions collector tray"
      : "Cedarline Privacy Mailers")
  );
  await page.locator("#known_brand").fill(
    scenario.knownBrand || (scenario.evidenceMode === "collectible" ? "RefreshCo" : "Cedarline")
  );
  if (scenario.evidenceMode === "retail") {
    await page.locator("#known_upc").fill(scenario.tokenBudgetFixture ? "041226087161" : "012345678905");
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

  await page.locator("#photos").setInputFiles(scenario.photoFixture || photoFixture);
  await expect(page.locator(".photo-preview-item")).toHaveCount(1);
  await expect(page.locator(".photo-thumb")).toBeVisible();
}

function assertSubmittedRequest(state, scenario) {
  expect(state.analysisRequests).toHaveLength(1);
  const request = state.analysisRequests[0];
  const purpose = purposes[scenario.purpose];
  expect(request.method).toBe("POST");
  expect(request.body.reportType).toBe(purpose.reportType);
  expect(normalizeText(request.body.notes)).toContain(
    scenario.tokenBudgetFixture ? "041226087161" : "Deterministic browser test"
  );
  expect(request.body.photos).toHaveLength(1);
  expect(request.body.photos[0].name).toBe(
    scenario.photoFixture ? path.basename(scenario.photoFixture) : "neutral-test-object.svg"
  );
  expect(request.body.photos[0].dataUrl).toMatch(/^data:image\/(?:jpeg|png|webp);base64,/);

  const intake = request.body[purpose.reportType === "listing" ? "sellerIntake" : "buyerIntake"];
  if (purpose.reportType === "listing") {
    expect(request.body).toHaveProperty("sellerIntake");
  } else {
    expect(intake.purchase_intent).toBe(purpose.requestPurpose);
  }
  expect(normalizeText(intake.item_name)).not.toBe("");
  expect(normalizeText(intake.buyer_notes)).toContain(
    scenario.tokenBudgetFixture ? "041226087161" : "Deterministic browser test"
  );
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
    await expect(card.locator(".price-found-source")).toHaveText(record.sourceLabel);
    await expect(card.locator(".price-found-price strong")).toHaveText(record.customerPriceLabel);
    await expect(card.locator(".evidence-match-badge")).toHaveText(record.canonicalMatchLabel);
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
    await expect(card.locator(".price-found-price strong")).toContainText("Price unavailable");
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

function expectedOutputText(value) {
  if (Array.isArray(value)) {
    return normalizeText(value.map((item) => typeof item === "object" ? JSON.stringify(item) : item).join(" "));
  }
  if (value && typeof value === "object") {
    return normalizeText(Object.values(value).join(" "));
  }
  return normalizeText(value);
}

async function assertCanonicalValuationParity(page, state, scenario) {
  const report = state.handlerResult.report;
  const summary = page.locator(".consumer-summary-card, .executive-summary-card").first();
  const expectedState = scenario.expectedValuationState || report.valuationEvidenceState;
  expect(report.valuationEvidenceState).toBe(expectedState);
  await expect(summary).toHaveAttribute("data-valuation-contract-valid", "true");
  await expect(summary).toHaveAttribute("data-valuation-state", report.valuationEvidenceState);
  await expect(summary).toHaveAttribute("data-valuation-label", report.valuationEvidenceLabel);
  await expect(summary).toHaveAttribute("data-valuation-explanation", report.valuationEvidenceExplanation);
  await expect(summary).toContainText(report.valuationEvidenceLabel);
  await expect(summary).toContainText(report.valuationEvidenceExplanation);

  const resultsText = normalizeText(await page.locator("#results").textContent());
  const displayFields = displayFieldKeysByState[report.valuationEvidenceState] || [];
  for (const field of displayFields) {
    if (hasDisplayValue(report[field])) {
      expect(resultsText).toContain(expectedOutputText(report[field]));
    }
  }

  const copyButton = page.locator("#copy-all");
  await expect(copyButton).toBeEnabled();
  await copyButton.click();
  await expect(copyButton).toHaveText("Copied!");
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain(report.valuationEvidenceState);
  expect(copied).toContain(report.valuationEvidenceLabel);
  expect(copied).toContain(report.valuationEvidenceExplanation);
  for (const field of displayFields) {
    if (hasDisplayValue(report[field])) {
      expect(normalizeText(copied)).toContain(expectedOutputText(report[field]));
    }
  }

  await page.locator("#ask-question").fill("What valuation state is in the current report?");
  await page.locator("#ask-submit-button").click();
  await expect.poll(() => state.askRequests.length).toBe(1);
  await expect(page.locator("#ask-history")).toContainText("Deterministic captured Ask response.");
  const askReport = state.askRequests[0].currentItemContext.currentReport;
  expect(askReport.valuationEvidenceState).toBe(report.valuationEvidenceState);
  expect(askReport.valuationEvidenceLabel).toBe(report.valuationEvidenceLabel);
  expect(askReport.valuationEvidenceExplanation).toBe(report.valuationEvidenceExplanation);
  for (const field of valuationContextFields) {
    if (hasDisplayValue(report[field])) {
      expect(askReport[field], `Ask context must preserve ${field}`).toEqual(report[field]);
    }
  }
  if (["single_observation", "insufficient"].includes(report.valuationEvidenceState) && !hasDisplayValue(report.preliminaryReferenceRange)) {
    expect(hasDisplayValue(askReport.preliminaryReferenceRange)).toBe(false);
  }

  const browserCapture = await page.evaluate(() => ({
    frozen: window.__canonicalHandlerReportDeepFrozen,
    snapshot: window.__canonicalHandlerReportSnapshot
  }));
  expect(browserCapture.frozen).toBe(true);
  expect(browserCapture.snapshot).toBe(state.handlerReportSnapshots.at(-1));
  expect(JSON.stringify(state.handlerResult.report)).toBe(state.handlerReportSnapshots.at(-1));
}

async function assertReRenderImmutability(page, state) {
  const firstHandlerResult = state.handlerResult;
  const firstSnapshot = state.handlerReportSnapshots.at(-1);
  await page.locator("#workflow-submit-button").click();
  await expect.poll(() => state.analysisRequests.length).toBe(2);
  await expect(page.locator(".canonical-evidence-section")).toHaveCount(1);
  const secondReport = state.handlerResult.report;
  const summary = page.locator(".consumer-summary-card, .executive-summary-card").first();
  await expect(summary).toHaveAttribute("data-valuation-state", secondReport.valuationEvidenceState);
  await expect(summary).toHaveAttribute("data-valuation-label", secondReport.valuationEvidenceLabel);
  await expect(summary).toHaveAttribute("data-valuation-explanation", secondReport.valuationEvidenceExplanation);
  expect(JSON.stringify(firstHandlerResult.report)).toBe(firstSnapshot);
  expect(JSON.stringify(secondReport)).toBe(state.handlerReportSnapshots.at(-1));
  expect(await page.evaluate(() => window.__canonicalHandlerReportSnapshot)).toBe(state.handlerReportSnapshots.at(-1));
}

async function assertMalformedValuationFailsClosed(page, state, scenario) {
  const report = state.handlerResult.report;
  const summary = page.locator(".consumer-summary-card, .executive-summary-card").first();
  await expect(summary).toHaveAttribute("data-valuation-contract-valid", "false");
  await expect(summary).toHaveAttribute("data-valuation-state", "");
  await expect(summary).toHaveAttribute("data-valuation-label", "Valuation Unavailable");
  await expect(summary).toHaveAttribute("data-valuation-explanation", "Canonical valuation information is unavailable.");
  await expect(summary).toContainText("Valuation Unavailable");
  await expect(summary).toContainText("Canonical valuation information is unavailable.");
  const resultsText = normalizeText(await page.locator("#results").textContent());
  expect(resultsText).not.toContain("$111.00-$222.00");
  expect(resultsText).not.toContain("$333.00-$444.00");
  expect(resultsText).not.toContain("unknown_contract_state");

  const copyButton = page.locator("#copy-all");
  await copyButton.click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Valuation Unavailable");
  expect(copied).toContain("Canonical valuation information is unavailable.");
  expect(copied).not.toContain("$111.00-$222.00");
  expect(copied).not.toContain("$333.00-$444.00");
  expect(copied).not.toContain("unknown_contract_state");
  expect(copied).not.toContain("\ninsufficient\n");

  await page.locator("#ask-question").fill("What valuation state is in the current report?");
  await page.locator("#ask-submit-button").click();
  await expect.poll(() => state.askRequests.length).toBe(1);
  const askReport = state.askRequests[0].currentItemContext.currentReport;
  expect(askReport.valuationEvidenceState).toBe(report.valuationEvidenceState);
  if (Object.hasOwn(report, "valuationEvidenceLabel")) {
    expect(askReport.valuationEvidenceLabel).toBe(report.valuationEvidenceLabel);
  }
  if (Object.hasOwn(report, "valuationEvidenceExplanation")) {
    expect(askReport.valuationEvidenceExplanation).toBe(report.valuationEvidenceExplanation);
  }
  expect(askReport.preliminaryReferenceRange).toBe(report.preliminaryReferenceRange);
  expect(JSON.stringify(state.handlerResult.report)).toBe(state.handlerReportSnapshots.at(-1));
  expect(await page.evaluate(() => window.__canonicalHandlerReportSnapshot)).toBe(state.handlerReportSnapshots.at(-1));
  expect(scenario.malformedValuation).toMatch(/^(missing_state|unknown_state|missing_label|missing_explanation)$/);
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
  expect(state.consoleWarnings, JSON.stringify(state.consoleWarnings, null, 2)).toEqual([]);
}

async function runSuccessfulScenario(page, scenario, projectName) {
  const state = await installBrowserGuards(page, scenario);
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
  await assertCanonicalValuationParity(page, state, scenario);

  if (scenario.purpose === "listing") {
    expect(state.handlerResult.report.optimizedListingTitle).toBe("Cedarline Privacy Mailers 48 Count");
    await expect(page.locator("#results")).toContainText("Cedarline Privacy Mailers 48 Count");
  }

  if (scenario.copyParity) {
    await assertCopyParity(page, state.handlerResult.report);
  }
  if (scenario.reRender) {
    await assertReRenderImmutability(page, state);
  }
  const screenshots = await captureScreenshots(page, scenario, projectName);
  assertStable(state);
  const readability = await assertReadability(page);
  return { state, screenshots, readability };
}

test("real form submits one retail analysis and renders canonical cards", async ({ page }, testInfo) => {
  testInfo.setTimeout(180_000);
  const ordinaryPhotoPath = testInfo.outputPath("ordinary-office-works-2200.png");
  const ordinarySource = await createOrdinaryPngFixture(page, ordinaryPhotoPath);
  const result = await runSuccessfulScenario(page, {
    evidenceMode: "retail",
    purpose: "personal_use",
    expectedValuationState: "current_retail",
    validateForm: true,
    expectCrossRetailer: true,
    copyParity: true,
    tokenBudgetFixture: true,
    purchaseContext: "online_retailer",
    retailerName: "Office Works",
    itemName: "Office Works Strip and Seal Security Envelopes White 45 Count",
    knownBrand: "Office Works",
    photoFixture: ordinaryPhotoPath
  }, testInfo.project.name);
  const submittedRequest = result.state.analysisRequests[0];
  const request = submittedRequest.body;
  const processed = request.photos[0].dataUrl;
  const processedPhotoBytes = dataUrlByteLength(processed);
  const processedImage = await page.evaluate((dataUrl) => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.width, height: image.height });
    image.onerror = () => reject(new Error("Processed image could not be decoded."));
    image.src = dataUrl;
  }), processed);
  expect(ordinarySource).toEqual(expect.objectContaining({
    format: "png",
    width: 2200,
    height: 2200
  }));
  expect(ordinarySource.bytes).toBeGreaterThanOrEqual(100000);
  expect(ordinarySource.bytes).toBeLessThanOrEqual(140000);
  expect(processed).toMatch(/^data:image\/jpeg;base64,/);
  expect(processedPhotoBytes).toBeGreaterThan(0);
  expect(processedPhotoBytes).toBeLessThanOrEqual(240000);
  expect(processedPhotoBytes).toBeLessThan(ordinarySource.bytes);
  expect(Math.max(processedImage.width, processedImage.height)).toBeLessThanOrEqual(1400);
  expect(processed.length).toBeGreaterThan(0);
  expect(submittedRequest.bodyBytes).toBeLessThan(400000);
  expect(request.photos).toHaveLength(1);
  expect(JSON.stringify(request).split(processed).length - 1).toBe(1);
  expect(JSON.stringify({
    notes: request.notes,
    buyerIntake: request.buyerIntake,
    platform: request.platform
  })).not.toContain("data:image/");
  expect(request.notes).toBe("041226087161");
  expect(request.buyerIntake.known_upc).toBe("041226087161");
  expect(request.buyerIntake.purchase_context).toBe("online_retailer");
  expect(result.state.handlerResult.metadata.schemas).toEqual(["item_identity", "consumer_purchase_decision"]);
  expect(result.state.handlerResult.metadata.finalizerExecutions).toBe(1);
  expect(result.state.handlerResult.metadata.unexpectedNodeNetworkAttempts).toEqual([]);
  expect(await page.locator("#photos").evaluate((input) => input.files?.length || 0)).toBe(0);
  expect(await page.locator(".photo-preview-item").count()).toBe(1);

  const demandingPhotoPath = testInfo.outputPath("demanding-token-budget-photo-6000.bmp");
  const demandingSourceBytes = createDemandingBmpFixture(demandingPhotoPath);
  const demandingPage = await page.context().newPage();
  try {
    const demandingScenario = {
      evidenceMode: "retail",
      purpose: "personal_use",
      expectedValuationState: "current_retail",
      expectCrossRetailer: true,
      tokenBudgetFixture: true,
      purchaseContext: "online_retailer",
      retailerName: "Office Works",
      itemName: "Office Works Strip and Seal Security Envelopes White 45 Count",
      knownBrand: "Office Works",
      photoFixture: demandingPhotoPath
    };
    const demandingState = await installBrowserGuards(demandingPage, demandingScenario);
    await configureForm(demandingPage, demandingScenario, demandingState);
    await demandingPage.locator("#workflow-submit-button").click();
    await expect.poll(() => demandingState.analysisRequests.length).toBe(1);
    await expect(demandingPage.locator(".canonical-evidence-section")).toHaveCount(1);
    assertSubmittedRequest(demandingState, demandingScenario);
    assertStable(demandingState);
    const demandingSubmission = demandingState.analysisRequests[0];
    const demandingRequest = demandingSubmission.body;
    const demandingProcessed = demandingRequest.photos[0].dataUrl;
    const demandingProcessedBytes = dataUrlByteLength(demandingProcessed);
    const demandingImage = await demandingPage.evaluate((dataUrl) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.width, height: image.height });
      image.onerror = () => reject(new Error("Processed demanding image could not be decoded."));
      image.src = dataUrl;
    }), demandingProcessed);
    expect(demandingSourceBytes).toBe(108000054);
    expect(demandingProcessed).toMatch(/^data:image\/jpeg;base64,/);
    expect(demandingProcessedBytes).toBeGreaterThan(processedPhotoBytes);
    expect(demandingProcessedBytes).toBeLessThanOrEqual(240000);
    expect(demandingSubmission.bodyBytes).toBeGreaterThan(submittedRequest.bodyBytes);
    expect(demandingSubmission.bodyBytes).toBeLessThan(400000);
    expect(Math.max(demandingImage.width, demandingImage.height)).toBeLessThanOrEqual(1400);
    expect(demandingRequest.photos).toHaveLength(1);
    expect(JSON.stringify(demandingRequest).split(demandingProcessed).length - 1).toBe(1);
    expect(JSON.stringify({
      notes: demandingRequest.notes,
      buyerIntake: demandingRequest.buyerIntake,
      platform: demandingRequest.platform
    })).not.toContain("data:image/");
    expect(demandingState.handlerResult.metadata.schemas).toEqual(["item_identity", "consumer_purchase_decision"]);
    expect(demandingState.handlerResult.metadata.finalizerExecutions).toBe(1);
    expect(demandingState.handlerResult.metadata.unexpectedNodeNetworkAttempts).toEqual([]);
  } finally {
    await demandingPage.close();
  }
});

test("Buy to Resell renders canonical evidence exactly once", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "collectible",
    purpose: "resale",
    expectedValuationState: "single_observation"
  }, testInfo.project.name);
});

test("What’s It Worth renders canonical evidence exactly once", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "collectible",
    purpose: "market_value",
    expectedValuationState: "single_observation"
  }, testInfo.project.name);
});

test("Create a Listing preserves seller content and canonical evidence", async ({ page }, testInfo) => {
  await runSuccessfulScenario(page, {
    evidenceMode: "retail",
    purpose: "listing",
    expectedValuationState: "insufficient"
  }, testInfo.project.name);
});

test("collectible duplicate, cross-retailer, and exact no-price evidence stay canonical", async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000);
  await runSuccessfulScenario(page, {
    evidenceMode: "collectible",
    purpose: "personal_use",
    expectedValuationState: "single_observation",
    expectCrossRetailer: true,
    expectDuplicateObservation: true,
    expectNoPrice: true,
    copyParity: true,
    reRender: true
  }, testInfo.project.name);

  const rangeScenarios = [
    {
      evidenceMode: "collectible",
      purpose: "market_value",
      handlerState: "supported",
      expectedValuationState: "supported"
    },
    {
      evidenceMode: "collectible",
      purpose: "market_value",
      handlerState: "current_asking",
      expectedValuationState: "current_asking"
    },
    {
      evidenceMode: "collectible",
      purpose: "market_value",
      handlerState: "current_asking",
      canonicalContractVariant: "preliminary",
      expectedValuationState: "preliminary"
    }
  ];
  for (const scenario of rangeScenarios) {
    const rangePage = await page.context().newPage();
    try {
      await runSuccessfulScenario(rangePage, scenario, testInfo.project.name);
    } finally {
      await rangePage.close();
    }
  }
});

test("malformed canonical evidence fails closed without legacy reconstruction", async ({ page }, testInfo) => {
  testInfo.setTimeout(120_000);
  const scenario = {
    evidenceMode: "retail",
    purpose: "personal_use",
    malformedCanonical: true,
    expectedValuationState: "current_retail"
  };
  const state = await installBrowserGuards(page, scenario);
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
  await assertCanonicalValuationParity(page, state, scenario);
  await captureScreenshots(page, scenario, testInfo.project.name);
  assertStable(state);
  await assertReadability(page);

  for (const malformedValuation of ["missing_state", "unknown_state", "missing_label", "missing_explanation"]) {
    const malformedScenario = {
      evidenceMode: "collectible",
      purpose: "resale",
      malformedValuation
    };
    const malformedPage = await page.context().newPage();
    try {
      const malformedState = await installBrowserGuards(malformedPage, malformedScenario);
      await configureForm(malformedPage, malformedScenario, malformedState);
      await malformedPage.locator("#workflow-submit-button").click();
      await expect.poll(() => malformedState.analysisRequests.length).toBe(1);
      await expect(malformedPage.locator(".canonical-evidence-section [data-evidence-id]").first()).toBeVisible();
      assertSubmittedRequest(malformedState, malformedScenario);
      await assertCanonicalCards(malformedPage, malformedState, malformedScenario);
      await assertMalformedValuationFailsClosed(malformedPage, malformedState, malformedScenario);
      await captureScreenshots(malformedPage, malformedScenario, testInfo.project.name);
      assertStable(malformedState);
      await assertReadability(malformedPage);
    } finally {
      await malformedPage.close();
    }
  }
});
