const form = document.querySelector("#listing-form");
const cameraInput = document.querySelector("#camera-photo");
const photosInput = document.querySelector("#photos");
const preview = document.querySelector("#photo-preview");
const statusBox = document.querySelector("#status");
const results = document.querySelector("#results");
const workflowInputs = Array.from(document.querySelectorAll('input[name="workflow_mode"]'));
const workflowHelper = document.querySelector("#workflow-helper");
const workflowSubmitButton = document.querySelector("#workflow-submit-button");
const workflowSubmitLabel = document.querySelector("#workflow-submit-label");
const platformField = document.querySelector("#platform-field");
const platformInput = document.querySelector("#platform");
const platformNote = document.querySelector("#platform-note");
const buyerIntakeSection = document.querySelector("#buyer-intake-section");
const buyerIntakeTitle = document.querySelector("#buyer-intake-title");
const purchaseIntentControl = document.querySelector("#purchase-intent-control");
const purchaseIntentInput = document.querySelector("#purchase_intent");
const askingPriceInput = document.querySelector("#asking_price");
const notesInput = document.querySelector("#notes");
const notesNote = document.querySelector("#notes-note");
const copyAllButton = document.querySelector("#copy-all");
const newItemButton = document.querySelector("#new-item-button");
const outputEyebrow = document.querySelector("#output-eyebrow");
const outputTitle = document.querySelector("#output-title");
const askPanel = document.querySelector("#ask-panel");
const askForm = document.querySelector("#ask-form");
const askQuestionInput = document.querySelector("#ask-question");
const askSubmitButton = document.querySelector("#ask-submit-button");
const askSubmitLabel = document.querySelector("#ask-submit-label");
const askStatusBox = document.querySelector("#ask-status");
const askHistory = document.querySelector("#ask-history");
const clearAskButton = document.querySelector("#clear-ask-button");

const listingSections = [
  ["platform", "Platform"],
  ["categorySuggestion", "Category Suggestion"],
  ["identifiedItem", "Identified Item"],
  ["identificationConfidence", "Identification Confidence"],
  ["visualRecognitionSummary", "Visual Recognition Summary"],
  ["visualSubject", "Visual Subject"],
  ["visualSubjectCategory", "Visual Subject Category"],
  ["visualSubjectConfidence", "Visual Subject Confidence"],
  ["recognizedOrganization", "Recognized Organization"],
  ["recognizedBrand", "Recognized Brand"],
  ["recognizedCharacter", "Recognized Character"],
  ["visualRecognitionEvidence", "Visual Recognition Evidence"],
  ["visualRecognitionUnknowns", "Still Unknown From Visuals"],
  ["visualRecognitionConflicts", "Visual Conflicts"],
  ["subjectIdentity", "Subject Identity"],
  ["subjectConfidence", "Subject Confidence"],
  ["exactProductIdentity", "Exact Product Identity"],
  ["exactProductConfidence", "Exact Product Confidence"],
  ["makerDateLicensingStatus", "Maker / Date / Licensing Status"],
  ["whatIsKnown", "What Is Known"],
  ["whatIsStillUnknown", "What Is Still Unknown"],
  ["identityConflicts", "Identity Conflicts"],
  ["identitySummary", "Identity Summary"],
  ["evidenceFoundInPhotos", "Evidence Found in Photos"],
  ["searchQueriesUsed", "Search Queries Used"],
  ["sourcesSearched", "Sources Searched"],
  ["researchResults", "Research Results"],
  ["comparableQuality", "Comparable Quality"],
  ["recommendedListingPrice", "Recommended Listing Price"],
  ["suggestedOfferRange", "Suggested Offer Range"],
  ["pricingConfidence", "Pricing Confidence"],
  ["pricingRationale", "Pricing Rationale"],
  ["optimizedListingTitle", "Optimized Listing Title"],
  ["listingDescription", "Listing Description"],
  ["itemSpecifics", "Item Specifics"],
  ["conditionNotes", "Condition Notes"],
  ["suggestedSellingPlatform", "Suggested Selling Platform"],
  ["priceStrategy", "Price Strategy"],
  ["expectedSellingTimeline", "Expected Selling Timeline"],
  ["shippingDelivery", "Shipping / Delivery"],
  ["stagingPhotos", "Staging & Photos"],
  ["sellerNotes", "Seller Notes"],
  ["additionalInformationNeeded", "Additional Information Needed"]
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
  ["visualRecognitionSummary", "Visual Recognition Summary"],
  ["visualSubject", "Visual Subject"],
  ["visualSubjectCategory", "Visual Subject Category"],
  ["visualSubjectConfidence", "Visual Subject Confidence"],
  ["recognizedOrganization", "Recognized Organization"],
  ["recognizedBrand", "Recognized Brand"],
  ["recognizedCharacter", "Recognized Character"],
  ["visualRecognitionEvidence", "Visual Recognition Evidence"],
  ["visualRecognitionUnknowns", "Still Unknown From Visuals"],
  ["visualRecognitionConflicts", "Visual Conflicts"],
  ["subjectIdentity", "Subject Identity"],
  ["subjectConfidence", "Subject Confidence"],
  ["exactProductIdentity", "Exact Product Identity"],
  ["exactProductConfidence", "Exact Product Confidence"],
  ["makerDateLicensingStatus", "Maker / Date / Licensing Status"],
  ["whatIsKnown", "What Is Known"],
  ["whatIsStillUnknown", "What Is Still Unknown"],
  ["identityConflicts", "Identity Conflicts"],
  ["identitySummary", "Identity Summary"],
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

const consumerSections = [
  ["identifiedItem", "Identified Item"],
  ["identificationConfidence", "Identification Confidence"],
  ["visualRecognitionSummary", "Visual Recognition Summary"],
  ["visualSubject", "Visual Subject"],
  ["visualSubjectCategory", "Visual Subject Category"],
  ["visualSubjectConfidence", "Visual Subject Confidence"],
  ["recognizedOrganization", "Recognized Organization"],
  ["recognizedBrand", "Recognized Brand"],
  ["recognizedCharacter", "Recognized Character"],
  ["visualRecognitionEvidence", "Visual Recognition Evidence"],
  ["visualRecognitionUnknowns", "Still Unknown From Visuals"],
  ["visualRecognitionConflicts", "Visual Conflicts"],
  ["subjectIdentity", "Subject Identity"],
  ["subjectConfidence", "Subject Confidence"],
  ["exactProductIdentity", "Exact Product Identity"],
  ["exactProductConfidence", "Exact Product Confidence"],
  ["makerDateLicensingStatus", "Maker / Date / Licensing Status"],
  ["whatIsKnown", "What Is Known"],
  ["whatIsStillUnknown", "What Is Still Unknown"],
  ["identityConflicts", "Identity Conflicts"],
  ["identitySummary", "Identity Summary"],
  ["evidenceFoundInPhotos", "Evidence Found in Photos"],
  ["askingPrice", "Asking Price"],
  ["estimatedFairMarketValue", "Estimated Fair Market Value"],
  ["fairPriceRange", "Fair Price Range"],
  ["valueRating", "Value Rating"],
  ["recommendation", "Recommendation"],
  ["recommendedOffer", "Recommended Offer"],
  ["walkAwayPrice", "Walk-Away Price"],
  ["negotiationGuidance", "Negotiation Guidance"],
  ["reasonsToBuy", "Reasons to Buy"],
  ["reasonsForCaution", "Reasons for Caution"],
  ["productOrConditionRisks", "Product or Condition Risks"],
  ["betterValueConsiderations", "Better-Value Considerations"],
  ["researchResults", "Research Results"],
  ["comparableQuality", "Comparable Quality"],
  ["pricingConfidence", "Pricing Confidence"],
  ["additionalInformationNeeded", "Additional Information Needed"]
];

const reportTypes = {
  listing: {
    reportType: "listing",
    responseKey: "listing",
    sections: listingSections,
    eyebrow: "Generated draft",
    title: "Listing Sections",
    emptyMessage: "Your listing draft will appear here.",
    loadingMessage: "Researching item evidence and generating listing...",
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

const workflowConfigs = {
  personal_use: {
    ...reportTypes.marketValue,
    workflow: "personal_use",
    purchaseIntent: "personal_use",
    sections: consumerSections,
    eyebrow: "Personal-use buying decision",
    title: "Buying for Myself",
    emptyMessage: "Your personal-use buying recommendation will appear here.",
    loadingMessage: "Searching comparable items for personal-use value...",
    activeLabel: "Analyzing...",
    defaultLabel: "Analyze Personal Buy",
    workflowHelper: "Use this when you want to know if the item is fairly priced for you.",
    platformNote: "Optional. Leave blank unless a marketplace context matters.",
    notesNote: "Optional. Add flaws, label wording, seller comments, measurements, or personal-use concerns.",
    buyerTitle: "Personal Buying Intake",
    showPlatform: false,
    showBuyerIntake: true,
    platformRequired: false,
    notesRequired: false,
    askingPriceRequired: false
  },
  resale: {
    ...reportTypes.marketValue,
    workflow: "resale",
    purchaseIntent: "resale",
    eyebrow: "Resale buying decision",
    title: "Buying to Resell",
    emptyMessage: "Your resale buying analysis will appear here.",
    loadingMessage: "Searching comparable items for resale potential...",
    activeLabel: "Analyzing...",
    defaultLabel: "Analyze Resale Buy",
    workflowHelper: "Use this when you want margin, resale platform fit, risk, and profit guidance.",
    platformNote: "Optional. Select where you may resell if you already know the target platform.",
    notesNote: "Optional. Add flaws, seller comments, transport costs, shipping issues, or resale concerns.",
    buyerTitle: "Resale Buying Intake",
    showPlatform: true,
    showBuyerIntake: true,
    platformRequired: false,
    notesRequired: false,
    askingPriceRequired: false
  },
  market_value: {
    ...reportTypes.marketValue,
    workflow: "market_value",
    purchaseIntent: "",
    eyebrow: "Market value check",
    title: "Check Market Value",
    emptyMessage: "Your general market value report will appear here.",
    loadingMessage: "Searching comparable items for market value...",
    activeLabel: "Checking...",
    defaultLabel: "Check Market Value",
    workflowHelper: "Use this for a general value read when you are not choosing personal-use or resale logic yet.",
    platformNote: "Optional. Leave blank for broad market logic.",
    notesNote: "Optional. Add any item details, labels, flaws, measurements, or seller comments.",
    buyerTitle: "Market Value Intake",
    showPlatform: true,
    showBuyerIntake: true,
    platformRequired: false,
    notesRequired: false,
    askingPriceRequired: false
  },
  listing: {
    ...reportTypes.listing,
    workflow: "listing",
    purchaseIntent: "",
    workflowHelper: "Use this after you have the item and want a seller-ready marketplace listing.",
    platformNote: "Required for Generate Listing.",
    notesNote: "Required for Generate Listing. Add condition, flaws, measurements, and anything the buyer should know.",
    showPlatform: true,
    showBuyerIntake: false,
    platformRequired: true,
    notesRequired: true,
    askingPriceRequired: false
  }
};

const defaultWorkflow = "personal_use";

let latestReport = null;
let latestSections = workflowConfigs[defaultWorkflow].sections;
let cameraPhotoFiles = [];
let currentWorkflow = defaultWorkflow;
let activeItemSession = null;
let activeRequestId = 0;
let activeRequestController = null;
let activeAskRequestId = 0;
let activeAskRequestController = null;

cameraInput.addEventListener("change", handleCameraPhotoChange);
photosInput.addEventListener("change", renderPhotoPreview);
workflowInputs.forEach((input) => input.addEventListener("change", () => {
  applyWorkflowState({ clearOutput: true, abortRequests: true });
}));
form.addEventListener("submit", handleSubmit);
copyAllButton.addEventListener("click", () => {
  if (!latestReport) {
    return;
  }

  copyText(formatReport(latestReport, latestSections), copyAllButton);
});
newItemButton.addEventListener("click", startNewItem);
askForm.addEventListener("submit", submitAskQuestion);
clearAskButton.addEventListener("click", clearAskConversation);
window.addEventListener("pageshow", () => {
  applyWorkflowState({ clearOutput: true, abortRequests: true });
});

applyWorkflowState({ clearOutput: true, abortRequests: false });

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

  const workflow = getSelectedWorkflow();
  const config = workflowConfigs[workflow];
  syncWorkflowFormState(config);
  const formData = new FormData(form);
  const platform = String(formData.get("platform") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (config.platformRequired && !platform) {
    clearWorkflowOutput(config);
    setStatus("Choose a marketplace platform before generating a listing.", "error");
    return;
  }

  if (config.notesRequired && !notes) {
    clearWorkflowOutput(config);
    setStatus("Add item notes before generating a listing.", "error");
    return;
  }

  const selectedPhotoFiles = getSelectedPhotoFiles();
  if (!selectedPhotoFiles.length) {
    clearWorkflowOutput(config);
    setStatus("Take or upload at least one item photo before continuing.", "error");
    return;
  }

  latestReport = null;
  latestSections = config.sections;
  clearItemSession({ abortAsk: true });
  resetCopyAllButton();
  setOutputHeading(config);
  const request = startWorkflowRequest(workflow);
  setLoading(true, workflow);
  setStatus(config.loadingMessage, "loading");

  try {
    const photos = await preparePhotos(selectedPhotoFiles);
    if (!isCurrentRequest(request.id, workflow)) {
      return;
    }

    const requestBody = {
      platform,
      notes,
      photos,
      reportType: config.reportType
    };

    if (config.reportType === "marketValue") {
      requestBody.buyerIntake = {
        ...getBuyerIntake(formData, notes),
        purchase_intent: config.purchaseIntent
      };
    }

    const response = await fetch("/api/generate-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody),
      signal: request.controller.signal
    });

    if (!isCurrentRequest(request.id, workflow)) {
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || config.errorMessage);
    }

    const report = data[config.responseKey];
    if (!report) {
      throw new Error(config.errorMessage);
    }

    const sections = getSectionsForReport(config, report);
    latestReport = report;
    latestSections = sections;
    activeItemSession = createItemSession({
      workflow,
      config,
      formData,
      platform,
      notes,
      report,
      sections,
      photoCount: selectedPhotoFiles.length
    });
    setOutputHeading(getDisplayConfig(config, report));
    renderReport(report, sections);
    renderAskPanel();
    clearStatus();
    copyAllButton.disabled = false;
  } catch (error) {
    if (error.name === "AbortError" || !isCurrentRequest(request.id, workflow)) {
      return;
    }

    renderEmpty(config);
    setStatus(error.message || config.errorMessage, "error");
  } finally {
    if (isCurrentRequest(request.id, workflow)) {
      activeRequestController = null;
      setLoading(false, workflow);
    }
  }
}

function getSelectedWorkflow() {
  const selected = workflowInputs.find((input) => input.checked);
  return selected && workflowConfigs[selected.value] ? selected.value : defaultWorkflow;
}

function applyWorkflowState({ clearOutput = false, abortRequests = false } = {}) {
  const workflow = getSelectedWorkflow();
  const config = workflowConfigs[workflow] || workflowConfigs[defaultWorkflow];
  currentWorkflow = workflow;

  if (abortRequests) {
    abortActiveRequest();
  }

  syncWorkflowFormState(config);
  setOutputHeading(config);
  setLoading(false, workflow);

  if (clearOutput) {
    clearWorkflowOutput(config);
  }
}

function syncWorkflowFormState(config) {
  form.dataset.workflow = config.workflow;
  workflowHelper.textContent = config.workflowHelper;
  platformNote.textContent = config.platformNote;
  notesNote.textContent = config.notesNote;
  platformInput.required = Boolean(config.platformRequired);
  notesInput.required = Boolean(config.notesRequired);
  askingPriceInput.required = Boolean(config.askingPriceRequired);
  purchaseIntentInput.value = config.purchaseIntent;

  setWorkflowSectionState(platformField, {
    visible: config.showPlatform,
    disabled: !config.showPlatform
  });
  setWorkflowSectionState(buyerIntakeSection, {
    visible: config.showBuyerIntake,
    disabled: !config.showBuyerIntake
  });
  setWorkflowSectionState(purchaseIntentControl, {
    visible: false,
    disabled: true
  });

  if (config.showBuyerIntake) {
    buyerIntakeTitle.textContent = config.buyerTitle;
  }
}

function setWorkflowSectionState(element, { visible, disabled }) {
  element.hidden = !visible;
  element.setAttribute("aria-hidden", visible ? "false" : "true");
  const controls = element.querySelectorAll("input, select, textarea, button");

  for (const control of controls) {
    control.disabled = Boolean(disabled);
    if (disabled) {
      control.required = false;
    }
  }
}

function clearWorkflowOutput(config) {
  latestReport = null;
  latestSections = config.sections;
  clearItemSession({ abortAsk: true });
  resetCopyAllButton();
  clearStatus();
  setOutputHeading(config);
  renderEmpty(config);
}

function resetCopyAllButton() {
  copyAllButton.disabled = true;
  copyAllButton.textContent = "Copy All";
}

function startWorkflowRequest(workflow) {
  abortActiveRequest();
  const controller = new AbortController();
  activeRequestId += 1;
  activeRequestController = controller;
  return {
    id: activeRequestId,
    controller
  };
}

function abortActiveRequest() {
  activeRequestId += 1;
  if (activeRequestController) {
    activeRequestController.abort();
    activeRequestController = null;
  }
}

function isCurrentRequest(requestId, workflow) {
  return requestId === activeRequestId && workflow === currentWorkflow;
}

function createItemSession({ workflow, config, formData, platform, notes, report, sections, photoCount }) {
  const buyerIntake = config.reportType === "marketValue"
    ? {
        ...getBuyerIntake(formData, notes),
        purchase_intent: config.purchaseIntent
      }
    : {};
  const reportContext = extractReportContext(report, sections);

  return {
    sessionId: createSessionId(),
    workflow,
    buyerIntent: config.purchaseIntent || (workflow === "listing" ? "seller_listing" : "market_value"),
    reportType: config.reportType,
    itemDescription: notes,
    askingPrice: firstNonEmpty(buyerIntake.asking_price, reportContext.askingPrice, reportContext.currentAskingPrice),
    selectedPlatform: platform,
    photoCount,
    buyerIntake,
    reportContext,
    conversationHistory: []
  };
}

function createSessionId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function extractReportContext(report, sections = []) {
  const contextKeys = [
    "identifiedItem",
    "itemIdentification",
    "identificationConfidence",
    "itemIdentificationConfidence",
    "visualRecognitionSummary",
    "visualSubject",
    "visualSubjectCategory",
    "visualSubjectConfidence",
    "recognizedOrganization",
    "recognizedBrand",
    "recognizedCharacter",
    "recognizedInstitution",
    "recognizedTheme",
    "visualRecognitionEvidence",
    "visualRecognitionUnknowns",
    "visualRecognitionConflicts",
    "subjectIdentity",
    "subjectConfidence",
    "exactProductIdentity",
    "exactProductConfidence",
    "makerDateLicensingStatus",
    "whatIsKnown",
    "whatIsStillUnknown",
    "identityConflicts",
    "identitySummary",
    "evidenceFoundInPhotos",
    "searchQueriesUsed",
    "sourcesSearched",
    "searchCoverage",
    "researchResults",
    "comparableQuality",
    "weFoundThisItem",
    "weFoundSimilarComparableItems",
    "currentAskingPrice",
    "askingPrice",
    "estimatedFairMarketValue",
    "fairPriceRange",
    "aiOnlyRoughValueRange",
    "valueRating",
    "recommendation",
    "purchaserDecision",
    "recommendedOffer",
    "walkAwayPrice",
    "currentPriceAssessment",
    "priceConfidence",
    "pricingConfidence",
    "pricingRationale",
    "buyerDecisionConfidence",
    "liveComparableSearchStatus",
    "liveCompConfidence",
    "valuationConfidence",
    "buyer_risk_score",
    "buyer_risk_level",
    "buyer_risk_summary",
    "primary_risk_factors",
    "riskFlags",
    "resalePotential",
    "maximumRecommendedBuyPrice",
    "suggestedListingPrice",
    "expectedSalePrice",
    "minimumAcceptablePrice",
    "recommendedSellingPlatform",
    "platformSpecificSellingGuidance",
    "betterPriceCheckNeeded",
    "listingDescription",
    "optimizedListingTitle",
    "recommendedListingPrice",
    "priceStrategy",
    "itemSpecifics",
    "conditionNotes",
    "shippingDelivery",
    "stagingPhotos",
    "sellerNotes",
    "additionalInformationNeeded",
    "missingDetails",
    "whatToVerifyBeforeBuying"
  ];
  const allowed = new Set([...contextKeys, ...sections.map(([key]) => key)]);
  const context = {};

  for (const key of allowed) {
    const value = cleanContextValue(report[key]);
    if (value !== null) {
      context[key] = value;
    }
  }

  return context;
}

function cleanContextValue(value) {
  if (Array.isArray(value)) {
    const items = value
      .map((item) => cleanContextValue(item))
      .filter((item) => item !== null)
      .slice(0, 10);
    return items.length ? items : null;
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, cleanContextValue(item)])
      .filter(([, item]) => item !== null)
      .slice(0, 18);
    return entries.length ? Object.fromEntries(entries) : null;
  }

  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text ? text.slice(0, 1400) : null;
}

function firstNonEmpty(...values) {
  return values.map((value) => String(value || "").trim()).find(Boolean) || "";
}

function clearItemSession({ abortAsk = false } = {}) {
  if (abortAsk) {
    abortActiveAskRequest();
  }

  activeItemSession = null;
  hideAskPanel();
}

function startNewItem() {
  abortActiveRequest();
  abortActiveAskRequest();
  form.reset();
  cameraPhotoFiles = [];
  photosInput.value = "";
  cameraInput.value = "";
  workflowInputs.forEach((input) => {
    input.checked = input.value === defaultWorkflow;
  });
  renderPhotoPreview();
  applyWorkflowState({ clearOutput: true, abortRequests: true });
  askQuestionInput.value = "";
  setStatus("Ready for a new item.", "success");
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

function getSectionsForReport(config, report) {
  if (config.reportType === "marketValue" && isConsumerReport(report)) {
    return consumerSections;
  }

  return config.sections;
}

function getDisplayConfig(config, report) {
  if (config.reportType === "marketValue" && isConsumerReport(report)) {
    return {
      ...config,
      eyebrow: "Personal-use buying decision",
      title: "Buying for Myself"
    };
  }

  return config;
}

function isConsumerReport(report) {
  return String(report && report.buyerIntent || "").toLowerCase() === "personal_use";
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

  if (hasVisualRecognition(report)) {
    results.appendChild(renderVisualRecognitionSummary(report));
  }

  if (isConsumerReport(report)) {
    results.appendChild(renderConsumerSummary(report));
  }

  if (report.subjectIdentity || report.exactProductIdentity || report.whatIsStillUnknown) {
    results.appendChild(renderIdentitySummary(report));
  }

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

function hasVisualRecognition(report) {
  return Boolean(report.visualSubject || report.visualRecognitionSummary || report.visualRecognitionEvidence);
}

function renderVisualRecognitionSummary(report) {
  const card = document.createElement("article");
  card.className = "visual-summary-card";

  const header = document.createElement("div");
  header.className = "visual-summary-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "summary-eyebrow";
  eyebrow.textContent = "Visual recognition";
  const title = document.createElement("h3");
  title.textContent = report.visualSubject || report.subjectIdentity || "Visual subject needs verification";
  const badge = document.createElement("span");
  badge.className = "summary-badge";
  badge.textContent = report.visualSubjectConfidence || report.subjectConfidence || "Confidence unclear";
  header.append(eyebrow, title, badge);

  const details = document.createElement("div");
  details.className = "visual-summary-details";
  const category = document.createElement("p");
  category.textContent = `Category: ${report.visualSubjectCategory || "Not verified"}`;
  const recognized = [
    formatSummaryPart("Organization", report.recognizedOrganization),
    formatSummaryPart("Brand", report.recognizedBrand),
    formatSummaryPart("Character", report.recognizedCharacter),
    formatSummaryPart("Institution", report.recognizedInstitution),
    formatSummaryPart("Theme", report.recognizedTheme)
  ].filter(Boolean);
  const recognizedLine = document.createElement("p");
  recognizedLine.textContent = recognized.length
    ? `Recognized clues: ${recognized.join("; ")}`
    : "Recognized clues: none verified beyond the visible subject.";
  const unknowns = Array.isArray(report.visualRecognitionUnknowns)
    ? report.visualRecognitionUnknowns
    : report.visualRecognitionUnknowns ? [report.visualRecognitionUnknowns] : [];
  const unknownLine = document.createElement("p");
  unknownLine.textContent = unknowns.length
    ? `Still unknown: ${unknowns.slice(0, 5).join("; ")}`
    : "Still unknown: exact product, maker, date, licensing, comparable confidence, and pricing confidence unless shown below.";
  details.append(category, recognizedLine, unknownLine);
  card.append(header, details);
  return card;
}

function formatSummaryPart(label, value) {
  const text = String(value || "").trim();
  if (!text || /^(unknown|not verified|n\/a|none)$/i.test(text)) {
    return "";
  }
  return `${label}: ${text}`;
}

function renderIdentitySummary(report) {
  const card = document.createElement("article");
  card.className = "identity-summary-card";

  const header = document.createElement("div");
  header.className = "identity-summary-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "summary-eyebrow";
  eyebrow.textContent = "Identity evidence";
  const title = document.createElement("h3");
  title.textContent = report.subjectIdentity || report.identifiedItem || "Subject identity needs verification";
  const badge = document.createElement("span");
  badge.className = "summary-badge";
  badge.textContent = report.subjectConfidence || "Subject confidence unclear";
  header.append(eyebrow, title, badge);

  const unknowns = Array.isArray(report.whatIsStillUnknown)
    ? report.whatIsStillUnknown
    : report.whatIsStillUnknown ? [report.whatIsStillUnknown] : [];
  const details = document.createElement("div");
  details.className = "identity-summary-details";
  const exact = document.createElement("p");
  exact.textContent = `Exact product: ${report.exactProductIdentity || "Not verified"}`;
  const unverified = document.createElement("p");
  unverified.textContent = unknowns.length
    ? `Still unverified: ${unknowns.slice(0, 4).join("; ")}`
    : "Still unverified: exact maker, date, licensing, authenticity, and comparable match unless shown below.";
  details.append(exact, unverified);
  card.append(header, details);
  return card;
}

async function submitAskQuestion(event) {
  event.preventDefault();

  const question = askQuestionInput.value.trim();
  const session = activeItemSession;
  const workflow = currentWorkflow;

  if (!session || !latestReport) {
    setAskStatus("Ask Market Edge needs a completed item report first.", "error");
    return;
  }

  if (!question) {
    setAskStatus("Enter a question about the current item first.", "error");
    askQuestionInput.focus();
    return;
  }

  const request = startAskRequest(session.sessionId, workflow);
  setAskLoading(true);
  setAskStatus("Reviewing your question...", "loading");

  try {
    const response = await fetch("/api/generate-listing", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "ask_market_edge",
        sessionId: session.sessionId,
        workflow,
        buyerIntent: session.buyerIntent,
        question,
        currentItemContext: buildAskContext(session),
        recentConversationContext: getRecentConversationContext(session)
      }),
      signal: request.controller.signal
    });

    if (!isCurrentAskRequest(request.id, session.sessionId, workflow)) {
      return;
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "We could not answer that question. Please try again.");
    }

    const answer = data.answer;
    if (!answer || !answer.answer) {
      throw new Error("Ask Market Edge returned an empty answer.");
    }

    session.conversationHistory.push({
      question,
      response: answer,
      createdAt: new Date().toISOString()
    });
    session.conversationHistory = session.conversationHistory.slice(-8);
    askQuestionInput.value = "";
    renderAskConversation();
    clearAskStatus();
  } catch (error) {
    if (error.name === "AbortError" || !isCurrentAskRequest(request.id, session.sessionId, workflow)) {
      return;
    }

    setAskStatus(error.message || "We could not answer that question. Please try again.", "error");
  } finally {
    if (isCurrentAskRequest(request.id, session.sessionId, workflow)) {
      activeAskRequestController = null;
      setAskLoading(false);
    }
  }
}

function renderAskPanel() {
  const hasReport = Boolean(activeItemSession && latestReport);
  askPanel.hidden = !hasReport;

  if (!hasReport) {
    return;
  }

  renderAskConversation();
  clearAskStatus();
  setAskLoading(false);
}

function hideAskPanel() {
  askPanel.hidden = true;
  askHistory.innerHTML = "";
  askQuestionInput.value = "";
  clearAskStatus();
  setAskLoading(false);
}

function clearAskConversation() {
  abortActiveAskRequest();
  if (activeItemSession) {
    activeItemSession.conversationHistory = [];
  }
  renderAskConversation();
  clearAskStatus();
}

function buildAskContext(session) {
  return {
    sessionId: session.sessionId,
    workflow: session.workflow,
    buyerIntent: session.buyerIntent,
    itemDescription: session.itemDescription,
    askingPrice: session.askingPrice,
    selectedPlatform: session.selectedPlatform,
    photoCount: session.photoCount,
    buyerIntake: session.buyerIntake,
    currentReport: session.reportContext
  };
}

function getRecentConversationContext(session) {
  return (session.conversationHistory || []).slice(-4).map((entry) => ({
    question: entry.question,
    answer: entry.response.answer,
    answerType: entry.response.answerType,
    assumptions: entry.response.assumptions,
    updatedScenario: entry.response.updatedScenario
  }));
}

function renderAskConversation() {
  askHistory.innerHTML = "";
  const history = activeItemSession ? activeItemSession.conversationHistory : [];

  if (!history.length) {
    const empty = document.createElement("p");
    empty.className = "ask-empty";
    empty.textContent = "Ask one focused question about the current item. The answer will use this report's evidence and will not run a new search.";
    askHistory.appendChild(empty);
    return;
  }

  for (const entry of history) {
    askHistory.appendChild(renderAskEntry(entry));
  }
}

function renderAskEntry(entry) {
  const card = document.createElement("article");
  card.className = "ask-entry";

  const question = document.createElement("div");
  question.className = "ask-question";
  question.textContent = entry.question;

  const answerTop = document.createElement("div");
  answerTop.className = "ask-answer-top";
  const answerType = document.createElement("span");
  answerType.className = "ask-answer-type";
  answerType.textContent = formatAnswerType(entry.response.answerType);
  const confidence = document.createElement("span");
  confidence.className = "ask-confidence";
  confidence.textContent = entry.response.confidence || "Confidence: limited";
  answerTop.append(answerType, confidence);

  const answer = document.createElement("p");
  answer.className = "ask-answer";
  answer.textContent = entry.response.answer;

  const details = document.createElement("div");
  details.className = "ask-details";
  appendAskDetail(details, "Evidence Basis", entry.response.evidenceBasis);
  appendAskDetail(details, "Assumptions", entry.response.assumptions);
  appendAskDetail(details, "Recalculated Fields", entry.response.recalculatedFields);
  appendAskDetail(details, "Recommended Next Action", entry.response.recommendedNextAction);
  appendAskDetail(details, "Suggested Photo", entry.response.suggestedPhoto);
  appendAskDetail(details, "Updated Scenario", entry.response.updatedScenario);

  const revisedListing = renderRevisedListing(entry.response.revisedListingFields);
  if (revisedListing) {
    details.appendChild(revisedListing);
  }

  const copyButton = document.createElement("button");
  copyButton.className = "copy-button ask-copy";
  copyButton.type = "button";
  copyButton.textContent = "Copy Answer";
  copyButton.addEventListener("click", () => copyText(formatAskAnswer(entry), copyButton));

  card.append(question, answerTop, answer, details, copyButton);
  return card;
}

function appendAskDetail(parent, label, value) {
  const values = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  if (!values.length) {
    return;
  }

  const block = document.createElement("div");
  block.className = "ask-detail";
  const title = document.createElement("h3");
  title.textContent = label;
  const list = document.createElement("ul");
  for (const item of values.slice(0, 6)) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }
  block.append(title, list);
  parent.appendChild(block);
}

function renderRevisedListing(fields = {}) {
  const entries = Object.entries(fields || {}).filter(([, value]) => String(value || "").trim());
  if (!entries.length) {
    return null;
  }

  const block = document.createElement("div");
  block.className = "ask-detail revised-listing";
  const title = document.createElement("h3");
  title.textContent = "Revised Listing";
  block.appendChild(title);

  for (const [key, value] of entries) {
    const item = document.createElement("p");
    item.textContent = `${formatAnswerType(key)}: ${value}`;
    block.appendChild(item);
  }

  const button = document.createElement("button");
  button.className = "copy-button";
  button.type = "button";
  button.textContent = "Copy Revision";
  button.addEventListener("click", () => copyText(entries.map(([key, value]) => `${formatAnswerType(key)}\n${value}`).join("\n\n"), button));
  block.appendChild(button);
  return block;
}

function formatAskAnswer(entry) {
  const response = entry.response;
  return [
    `Question\n${entry.question}`,
    `Answer\n${response.answer}`,
    formatOptionalAskSection("Answer Type", formatAnswerType(response.answerType)),
    formatOptionalAskSection("Evidence Basis", response.evidenceBasis),
    formatOptionalAskSection("Assumptions", response.assumptions),
    formatOptionalAskSection("Recalculated Fields", response.recalculatedFields),
    formatOptionalAskSection("Confidence", response.confidence),
    formatOptionalAskSection("Recommended Next Action", response.recommendedNextAction),
    formatOptionalAskSection("Suggested Photo", response.suggestedPhoto),
    formatOptionalAskSection("Updated Scenario", response.updatedScenario)
  ].filter(Boolean).join("\n\n");
}

function formatOptionalAskSection(label, value) {
  if (Array.isArray(value)) {
    return value.length ? `${label}\n${value.map((item) => `- ${item}`).join("\n")}` : "";
  }

  return value ? `${label}\n${value}` : "";
}

function formatAnswerType(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function startAskRequest(sessionId, workflow) {
  abortActiveAskRequest();
  const controller = new AbortController();
  activeAskRequestId += 1;
  activeAskRequestController = controller;
  return {
    id: activeAskRequestId,
    sessionId,
    workflow,
    controller
  };
}

function abortActiveAskRequest() {
  activeAskRequestId += 1;
  if (activeAskRequestController) {
    activeAskRequestController.abort();
    activeAskRequestController = null;
  }
}

function isCurrentAskRequest(requestId, sessionId, workflow) {
  return requestId === activeAskRequestId
    && activeItemSession
    && activeItemSession.sessionId === sessionId
    && workflow === currentWorkflow;
}

function setAskLoading(isLoading) {
  askSubmitButton.disabled = isLoading;
  askSubmitLabel.textContent = isLoading ? "Reviewing..." : "Ask Market Edge";
}

function setAskStatus(message, type) {
  askStatusBox.textContent = message;
  askStatusBox.className = `status ask-status is-visible is-${type}`;
}

function clearAskStatus() {
  askStatusBox.textContent = "";
  askStatusBox.className = "status ask-status";
}

function renderConsumerSummary(report) {
  const card = document.createElement("article");
  card.className = `consumer-summary-card ${getValueRatingModifier(report.valueRating)}`;

  const header = document.createElement("div");
  header.className = "consumer-summary-header";

  const label = document.createElement("p");
  label.className = "summary-eyebrow";
  label.textContent = "Personal-use decision";

  const title = document.createElement("h3");
  title.textContent = report.recommendation || "Need More Information";

  const badge = document.createElement("span");
  badge.className = "summary-badge";
  badge.textContent = report.valueRating || "Insufficient Evidence";

  header.append(label, title, badge);

  const grid = document.createElement("dl");
  grid.className = "consumer-summary-grid";
  const metrics = [
    ["Asking Price", report.askingPrice],
    ["Estimated Fair Value", report.estimatedFairMarketValue],
    ["Recommended Offer", Array.isArray(report.recommendedOffer) ? report.recommendedOffer.join(" | ") : report.recommendedOffer],
    ["Pricing Confidence", report.pricingConfidence]
  ];

  for (const [name, value] of metrics) {
    if (!value || (Array.isArray(value) && !value.length)) {
      continue;
    }

    const item = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = name;
    detail.textContent = value;
    item.append(term, detail);
    grid.appendChild(item);
  }

  card.append(header, grid);
  return card;
}

function getValueRatingModifier(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("exceptional") || text.includes("good")) {
    return "value-positive";
  }
  if (text.includes("fair")) {
    return "value-fair";
  }
  if (text.includes("slightly") || text.includes("overpriced")) {
    return "value-caution";
  }
  if (text.includes("poor") || text.includes("insufficient")) {
    return "value-risk";
  }
  return "value-neutral";
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
  note.textContent = "The Buyer Risk Score is not a confidence score. It blends evidence uncertainty with purchase downside from price, condition, added costs, safety, authenticity, liquidity, and resale uncertainty. It is not a guarantee of value, authenticity, profit, or sale.";

  wrapper.append(top, meter, labels, summaryText, note);
  return wrapper;
}

function renderEmpty(config = workflowConfigs[defaultWorkflow]) {
  latestReport = null;
  copyAllButton.disabled = true;
  results.className = "results empty-state";
  results.innerHTML = `<p>${config.emptyMessage}</p>`;
}

function setOutputHeading(config) {
  outputEyebrow.textContent = config.eyebrow;
  outputTitle.textContent = config.title;
}

function setLoading(isLoading, workflow = currentWorkflow) {
  const config = workflowConfigs[workflow] || workflowConfigs[defaultWorkflow];
  workflowSubmitButton.disabled = isLoading;
  workflowSubmitLabel.textContent = isLoading ? config.activeLabel : config.defaultLabel;
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
    "The Buyer Risk Score is not a confidence score. It blends evidence uncertainty with purchase downside from price, condition, added costs, safety, authenticity, liquidity, and resale uncertainty. It is not a guarantee of value, authenticity, profit, or sale."
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
