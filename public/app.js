const form = document.querySelector("#listing-form");
const cameraInput = document.querySelector("#camera-photo");
const photosInput = document.querySelector("#photos");
const preview = document.querySelector("#photo-preview");
const statusBox = document.querySelector("#status");
const results = document.querySelector("#results");
const generateButton = document.querySelector("#generate-button");
const marketValueButton = document.querySelector("#market-value-button");
const buttonLabel = document.querySelector("#button-label");
const marketValueLabel = document.querySelector("#market-value-label");
const copyAllButton = document.querySelector("#copy-all");
const outputEyebrow = document.querySelector("#output-eyebrow");
const outputTitle = document.querySelector("#output-title");

const listingSections = [
  ["platform", "Platform"],
  ["categorySuggestion", "Category Suggestion"],
  ["title", "Title"],
  ["description", "Description"],
  ["itemDetails", "Item Details"],
  ["priceStrategy", "Price Strategy"],
  ["expectedSellingTimeline", "Expected Selling Timeline"],
  ["shippingDelivery", "Shipping / Delivery"],
  ["stagingPhotos", "Staging & Photos"],
  ["sellerNotes", "Seller Notes"]
];

const valuationSections = [
  ["purchaserDecision", "Purchase Decision"],
  ["buyer_risk_score", "Buyer Risk Score"],
  ["buyerDecisionConfidence", "Buyer Decision Confidence"],
  ["currentAskingPrice", "Current Asking Price"],
  ["maximumRecommendedBuyPrice", "Maximum Recommended Buy Price"],
  ["suggestedListingPrice", "Suggested Listing Price"],
  ["expectedSalePrice", "Expected Sale Price"],
  ["minimumAcceptablePrice", "Minimum Acceptable Price"],
  ["recommendedSellingPlatform", "Recommended Selling Platform"],
  ["primary_risk_factors", "Primary Risk Factors"],
  ["risk_reduction_actions", "Risk Reduction Actions"],
  ["priceBasis", "Pricing Basis"],
  ["expectedSellingTime", "Expected Selling Time"],
  ["platformSpecificSellingGuidance", "Platform-Specific Selling Guidance"],
  ["itemIdentification", "Item Identification"],
  ["liveComparableSearchStatus", "Live Comp Status"],
  ["itemIdentificationConfidence", "Item Identification Confidence"],
  ["weFoundThisItem", "We Found This Item"],
  ["weFoundSimilarComparableItems", "We Found Similar Comparable Items"],
  ["liveSearchDidNotComplete", "Live Search Did Not Complete"],
  ["noReliableComparableItemsFound", "No Reliable Comparable Items Found"],
  ["searchCoverage", "Search Coverage"],
  ["liveCompConfidence", "Live Comp Confidence"],
  ["valuationConfidence", "Valuation Confidence"],
  ["aiOnlyRoughValueRange", "AI-Only Rough Value Range"],
  ["buyerTypeFit", "Buyer Type Fit"],
  ["marketType", "Market Type"],
  ["itemClarityScore", "Item Clarity Score"],
  ["currentPriceAssessment", "Current Price Assessment"],
  ["priceConfidence", "Price Confidence"],
  ["betterPriceCheckNeeded", "Better-Price Check Needed?"],
  ["resalePotential", "Resale Potential"],
  ["missingDetails", "Missing Details"],
  ["whatToVerifyBeforeBuying", "What To Verify Before Buying"],
  ["searchQueriesUsed", "Search Queries Used"]
];

const reportTypes = {
  listing: {
    reportType: "listing",
    responseKey: "listing",
    sections: listingSections,
    eyebrow: "Generated draft",
    title: "Listing Sections",
    emptyMessage: "Your listing draft will appear here.",
    loadingMessage: "Generating listing from photos and notes...",
    errorMessage: "Unable to generate listing.",
    activeLabel: "Generating...",
    defaultLabel: "Generate Listing"
  },
  marketValue: {
    reportType: "marketValue",
    responseKey: "valuation",
    sections: valuationSections,
    eyebrow: "Buyer-first market intelligence",
    title: "Worth Buying?",
    emptyMessage: "Your buyer-first market intelligence report will appear here.",
    loadingMessage: "Searching comparable items...",
    errorMessage: "Unable to check whether this is worth buying.",
    activeLabel: "Checking...",
    defaultLabel: "Worth Buying?"
  }
};

let latestReport = null;
let latestSections = listingSections;
let cameraPhotoFiles = [];

cameraInput.addEventListener("change", handleCameraPhotoChange);
photosInput.addEventListener("change", renderPhotoPreview);
form.addEventListener("submit", handleSubmit);
copyAllButton.addEventListener("click", () => {
  if (!latestReport) {
    return;
  }

  copyText(formatReport(latestReport, latestSections), copyAllButton);
});

function handleCameraPhotoChange() {
  const files = Array.from(cameraInput.files || []);
  cameraPhotoFiles = [...cameraPhotoFiles, ...files].slice(0, 6);
  cameraInput.value = "";
  renderPhotoPreview();
}

function getSelectedPhotoFiles() {
  return [...cameraPhotoFiles, ...Array.from(photosInput.files || [])].slice(0, 6);
}

function renderPhotoPreview() {
  preview.innerHTML = "";
  const files = getSelectedPhotoFiles();

  for (const file of files) {
    const image = document.createElement("img");
    image.className = "photo-thumb";
    image.alt = file.name || "Uploaded item photo";
    image.src = URL.createObjectURL(file);
    image.addEventListener("load", () => URL.revokeObjectURL(image.src), { once: true });
    preview.appendChild(image);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const mode = event.submitter && event.submitter.dataset.action === "marketValue" ? "marketValue" : "listing";
  const config = reportTypes[mode];
  const formData = new FormData(form);
  const platform = String(formData.get("platform") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (mode === "listing" && !platform) {
    latestReport = null;
    latestSections = config.sections;
    copyAllButton.disabled = true;
    setOutputHeading(config);
    renderEmpty(config);
    setStatus("Choose a marketplace platform before generating a listing.", "error");
    return;
  }

  if (mode === "listing" && !notes) {
    latestReport = null;
    latestSections = config.sections;
    copyAllButton.disabled = true;
    setOutputHeading(config);
    renderEmpty(config);
    setStatus("Add item notes before generating a listing.", "error");
    return;
  }

  const selectedPhotoFiles = getSelectedPhotoFiles();
  if (!selectedPhotoFiles.length) {
    latestReport = null;
    latestSections = config.sections;
    copyAllButton.disabled = true;
    setOutputHeading(config);
    renderEmpty(config);
    setStatus("Take or upload at least one item photo before continuing.", "error");
    return;
  }

  latestReport = null;
  latestSections = config.sections;
  copyAllButton.disabled = true;
  setOutputHeading(config);
  setLoading(true, mode);
  setStatus(config.loadingMessage, "loading");

  try {
    const photos = await preparePhotos(selectedPhotoFiles);
    const requestBody = {
      platform,
      notes,
      photos,
      reportType: config.reportType
    };

    if (mode === "marketValue") {
      requestBody.buyerIntake = getBuyerIntake(formData, notes);
    }

    const response = await fetch("/api/generate-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || config.errorMessage);
    }

    const report = data[config.responseKey];
    if (!report) {
      throw new Error(config.errorMessage);
    }

    latestReport = report;
    latestSections = config.sections;
    renderReport(report, config.sections);
    clearStatus();
    copyAllButton.disabled = false;
  } catch (error) {
    renderEmpty(config);
    setStatus(error.message || config.errorMessage, "error");
  } finally {
    setLoading(false, mode);
  }
}

function getBuyerIntake(formData, notes) {
  const getValue = (name) => String(formData.get(name) || "").trim();

  return {
    purchase_context: getValue("purchase_context"),
    asking_price: getValue("asking_price"),
    purchase_intent: getValue("purchase_intent"),
    item_condition: getValue("item_condition"),
    condition_concerns: formData.getAll("condition_concerns").map((value) => String(value || "").trim()).filter(Boolean),
    item_name: getValue("item_name"),
    known_brand: getValue("known_brand"),
    known_manufacturer: getValue("known_manufacturer"),
    known_model: getValue("known_model"),
    known_sku: getValue("known_sku"),
    known_upc: getValue("known_upc"),
    approximate_age_era: getValue("approximate_age_era"),
    buyer_notes: notes
  };
}

async function preparePhotos(photoFiles = getSelectedPhotoFiles()) {
  const photos = [];

  for (const file of photoFiles) {
    photos.push({
      name: file.name,
      dataUrl: await resizeImage(file)
    });
  }

  return photos;
}

function renderReport(report, sections) {
  results.classList.remove("empty-state");
  results.innerHTML = "";

  for (const [key, label] of sections) {
    if (!shouldRenderSection(key, report[key])) {
      continue;
    }

    const card = document.createElement("article");
    card.className = key === "buyer_risk_score"
      ? `section-card risk-score-card ${getRiskModifier(report.buyer_risk_level)}`
      : "section-card";

    const header = document.createElement("div");
    header.className = "section-topline";

    const title = document.createElement("h3");
    title.textContent = label;

    const copyButton = document.createElement("button");
    copyButton.className = "copy-button";
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => {
      const copyValue = key === "buyer_risk_score" ? formatRiskSection(report) : formatSection(label, report[key]);
      copyText(copyValue, copyButton);
    });

    const body = document.createElement("div");
    body.className = "section-body";
    body.appendChild(key === "buyer_risk_score" ? renderRiskScore(report) : renderValue(report[key]));

    header.append(title, copyButton);
    card.append(header, body);
    results.appendChild(card);
  }
}

function shouldRenderSection(key, value) {
  if (Array.isArray(value) && value.length === 0) {
    return false;
  }

  if (typeof value === "string" && !value.trim()) {
    return false;
  }

  if ((key === "weFoundThisItem" || key === "weFoundSimilarComparableItems") && Array.isArray(value)) {
    return value.some((item) => /https?:\/\//i.test(String(item || "")));
  }

  if ((key === "noReliableComparableItemsFound" || key === "liveSearchDidNotComplete" || key === "aiOnlyRoughValueRange") && !value) {
    return false;
  }

  return true;
}

function renderValue(value) {
  if (Array.isArray(value)) {
    const list = document.createElement("ul");
    for (const item of value) {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      list.appendChild(listItem);
    }
    return list;
  }

  const paragraph = document.createElement("p");
  paragraph.textContent = value || "";
  return paragraph;
}

function renderRiskScore(report) {
  const score = normalizeRiskScore(report.buyer_risk_score);
  const level = String(report.buyer_risk_level || riskLevelFromScore(score));
  const summary = String(report.buyer_risk_summary || "Risk depends on available photos, item details, market evidence, price, condition, and resale uncertainty.");
  const wrapper = document.createElement("div");
  wrapper.className = "risk-score";

  const top = document.createElement("div");
  top.className = "risk-score-top";

  const scoreText = document.createElement("p");
  scoreText.className = "risk-score-number";
  scoreText.textContent = `${score}`;

  const detail = document.createElement("div");
  detail.className = "risk-score-detail";

  const levelText = document.createElement("p");
  levelText.className = "risk-score-level";
  levelText.textContent = level;

  const direction = document.createElement("p");
  direction.className = "risk-score-direction";
  direction.textContent = "Lower is safer. Higher is riskier.";

  detail.append(levelText, direction);
  top.append(scoreText, detail);

  const meter = document.createElement("div");
  meter.className = "risk-meter";
  meter.setAttribute("role", "meter");
  meter.setAttribute("aria-label", `Buyer Risk Score ${score} out of 100, ${level}. Lower is safer.`);
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", "100");
  meter.setAttribute("aria-valuenow", String(score));

  const fill = document.createElement("div");
  fill.className = "risk-meter-fill";
  fill.style.width = `${score}%`;
  meter.appendChild(fill);

  const labels = document.createElement("div");
  labels.className = "risk-meter-labels";
  labels.innerHTML = "<span>0 Low</span><span>25 Moderate</span><span>50 High</span><span>75 Very High</span><span>100</span>";

  const summaryText = document.createElement("p");
  summaryText.className = "risk-score-summary";
  summaryText.textContent = summary;

  const note = document.createElement("p");
  note.className = "risk-score-note";
  note.textContent = "The Buyer Risk Score is decision support based on available photos, item details, market evidence, price, condition, and resale uncertainty. It is not a guarantee of value, authenticity, profit, or sale.";

  wrapper.append(top, meter, labels, summaryText, note);
  return wrapper;
}

function renderEmpty(config = reportTypes.listing) {
  latestReport = null;
  copyAllButton.disabled = true;
  results.className = "results empty-state";
  results.innerHTML = `<p>${config.emptyMessage}</p>`;
}

function setOutputHeading(config) {
  outputEyebrow.textContent = config.eyebrow;
  outputTitle.textContent = config.title;
}

function setLoading(isLoading, mode) {
  generateButton.disabled = isLoading;
  marketValueButton.disabled = isLoading;
  buttonLabel.textContent = isLoading && mode === "listing" ? reportTypes.listing.activeLabel : reportTypes.listing.defaultLabel;
  marketValueLabel.textContent = isLoading && mode === "marketValue" ? reportTypes.marketValue.activeLabel : reportTypes.marketValue.defaultLabel;
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status is-visible is-${type}`;
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  const original = button.textContent;
  button.textContent = "Copied";
  setTimeout(() => {
    button.textContent = original;
  }, 1200);
}

function formatReport(report, sections) {
  return sections
    .filter(([key]) => shouldRenderSection(key, report[key]))
    .map(([key, label]) => key === "buyer_risk_score" ? formatRiskSection(report) : formatSection(label, report[key]))
    .join("\n\n");
}

function formatSection(label, value) {
  const body = Array.isArray(value) ? value.map((item) => `- ${item}`).join("\n") : value;
  return `${label}\n${body || ""}`;
}

function formatRiskSection(report) {
  const score = normalizeRiskScore(report.buyer_risk_score);
  const level = String(report.buyer_risk_level || riskLevelFromScore(score));
  const summary = String(report.buyer_risk_summary || "");
  return [
    "Buyer Risk Score",
    `${score}/100`,
    level,
    "Lower is safer. Higher is riskier.",
    summary,
    "The Buyer Risk Score is decision support based on available photos, item details, market evidence, price, condition, and resale uncertainty. It is not a guarantee of value, authenticity, profit, or sale."
  ].filter(Boolean).join("\n");
}

function normalizeRiskScore(value) {
  const score = Number(value);
  if (!Number.isFinite(score)) {
    return 100;
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function riskLevelFromScore(score) {
  if (score <= 24) {
    return "Low Risk";
  }
  if (score <= 49) {
    return "Moderate Risk";
  }
  if (score <= 74) {
    return "High Risk";
  }
  return "Very High Risk";
}

function getRiskModifier(level) {
  const text = String(level || "").toLowerCase();
  if (text.includes("very high")) {
    return "risk-very-high";
  }
  if (text.includes("high")) {
    return "risk-high";
  }
  if (text.includes("moderate")) {
    return "risk-moderate";
  }
  return "risk-low";
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read an uploaded photo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not process an uploaded photo."));
      image.onload = () => {
        const maxDimension = 1400;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
