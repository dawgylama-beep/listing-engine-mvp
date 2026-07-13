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
const feedbackButton = document.querySelector("#feedback-button");
const feedbackPanel = document.querySelector("#feedback-panel");
const feedbackText = document.querySelector("#feedback-text");
const feedbackCopyButton = document.querySelector("#feedback-copy-button");
const feedbackStatus = document.querySelector("#feedback-status");

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
  ["resultsFound", "Results Found"],
  ["strongComparables", "Strong Comparables"],
  ["partialComparables", "Partial Comparables"],
  ["referenceResults", "Reference Results"],
  ["weakMatches", "Weak Matches"],
  ["rejectedMatches", "Rejected Matches"],
  ["searchLimitations", "Search Limitations"],
  ["referenceRangeBasis", "Reference Range Basis"],
  ["searchDiagnostics", "Technical Search Details"],
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
  ["preliminaryReferenceRange", "Preliminary Reference Range"],
  ["fairValueNotEstablished", "Fair Value Not Established"],
  ["whatThisMeans", "What This Means"],
  ["bestNextStep", "Best Next Step"],
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
  ["resultsFound", "Results Found"],
  ["strongComparables", "Strong Comparables"],
  ["partialComparables", "Partial Comparables"],
  ["referenceResults", "Reference Results"],
  ["weakMatches", "Weak Matches"],
  ["rejectedMatches", "Rejected Matches"],
  ["searchLimitations", "Search Limitations"],
  ["referenceRangeBasis", "Reference Range Basis"],
  ["searchDiagnostics", "Technical Search Details"],
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
  ["preliminaryReferenceRange", "Preliminary Reference Range"],
  ["fairValueNotEstablished", "Fair Value Not Established"],
  ["whatThisMeans", "What This Means"],
  ["bestNextStep", "Best Next Step"],
  ["estimatedFairMarketValue", "Estimated Fair Market Value"],
  ["fairPriceRange", "Fair Price Range"],
  ["valueRating", "Value Rating"],
  ["recommendation", "Recommendation"],
  ["consumerDownsideRisk", "Consumer Downside Risk"],
  ["cautiousBuyExplanation", "Cautious Buy Explanation"],
  ["recommendedOffer", "Recommended Offer"],
  ["walkAwayPrice", "Walk-Away Price"],
  ["negotiationGuidance", "Negotiation Guidance"],
  ["reasonsToBuy", "Reasons to Buy"],
  ["reasonsForCaution", "Reasons for Caution"],
  ["productOrConditionRisks", "Product or Condition Risks"],
  ["betterValueConsiderations", "Better-Value Considerations"],
  ["searchCoverage", "Search Coverage"],
  ["resultsFound", "Results Found"],
  ["strongComparables", "Strong Comparables"],
  ["partialComparables", "Partial Comparables"],
  ["referenceResults", "Reference Results"],
  ["weakMatches", "Weak Matches"],
  ["rejectedMatches", "Rejected Matches"],
  ["searchLimitations", "Search Limitations"],
  ["referenceRangeBasis", "Reference Range Basis"],
  ["searchDiagnostics", "Technical Search Details"],
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
let loadingProgressTimer = null;
let loadingProgressIndex = 0;

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
feedbackButton.addEventListener("click", toggleFeedbackPanel);
feedbackCopyButton.addEventListener("click", copyFeedbackText);
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

  files.forEach((file, index) => {
    const item = document.createElement("div");
    item.className = "photo-preview-item";

    const image = document.createElement("img");
    image.className = "photo-thumb";
    image.alt = file.name || `Item photo ${index + 1}`;
    image.src = URL.createObjectURL(file);
    image.addEventListener("load", () => URL.revokeObjectURL(image.src), { once: true });

    const removeButton = document.createElement("button");
    removeButton.className = "photo-remove-button";
    removeButton.type = "button";
    removeButton.setAttribute("aria-label", `Remove photo ${index + 1}`);
    removeButton.textContent = "Remove";
    removeButton.addEventListener("click", () => removePhotoAt(index));

    item.append(image, removeButton);
    preview.appendChild(item);
  });
}

function removePhotoAt(index) {
  if (index < cameraPhotoFiles.length) {
    cameraPhotoFiles.splice(index, 1);
    renderPhotoPreview();
    return;
  }

  const uploadIndex = index - cameraPhotoFiles.length;
  const uploadedFiles = Array.from(photosInput.files || []);
  uploadedFiles.splice(uploadIndex, 1);

  if (typeof DataTransfer === "function") {
    const transfer = new DataTransfer();
    uploadedFiles.forEach((file) => transfer.items.add(file));
    photosInput.files = transfer.files;
  } else {
    photosInput.value = "";
  }

  renderPhotoPreview();
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
  startLoadingProgress(config, request.id, workflow);

  try {
    const photos = await preparePhotos(selectedPhotoFiles);
    if (!isCurrentRequest(request.id, workflow)) {
      return;
    }

    const requestBody = {
      analysisId: request.analysisId,
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

    const rawReport = data[config.responseKey];
    if (!rawReport) {
      throw new Error(config.errorMessage);
    }
    const report = normalizeReportForEvidenceDisplay(rawReport, workflow);

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
      photoCount: selectedPhotoFiles.length,
      analysisId: request.analysisId
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
    setStatus(getFriendlyErrorMessage(error, config), "error");
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
    analysisId: createSessionId(),
    controller
  };
}

function abortActiveRequest() {
  activeRequestId += 1;
  stopLoadingProgress();
  if (activeRequestController) {
    activeRequestController.abort();
    activeRequestController = null;
  }
}

function isCurrentRequest(requestId, workflow) {
  return requestId === activeRequestId && workflow === currentWorkflow;
}

function createItemSession({ workflow, config, formData, platform, notes, report, sections, photoCount, analysisId }) {
  const buyerIntake = config.reportType === "marketValue"
    ? {
        ...getBuyerIntake(formData, notes),
        purchase_intent: config.purchaseIntent
      }
    : {};
  const reportContext = extractReportContext(report, sections);

  return {
    sessionId: firstNonEmpty(report.analysisId, analysisId, createSessionId()),
    analysisId: firstNonEmpty(report.analysisId, analysisId),
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
    "analysisId",
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
    "resultsFound",
    "strongComparables",
    "partialComparables",
    "referenceResults",
    "weakMatches",
    "rejectedMatches",
    "searchLimitations",
    "referenceRangeBasis",
    "searchDiagnostics",
    "researchResults",
    "comparableQuality",
    "weFoundThisItem",
    "weFoundSimilarComparableItems",
    "currentAskingPrice",
    "askingPrice",
    "valuationEvidenceState",
    "valuationEvidenceLabel",
    "valuationEvidenceExplanation",
    "preliminaryReferenceRange",
    "fairValueNotEstablished",
    "whatThisMeans",
    "bestNextStep",
    "estimatedFairMarketValue",
    "fairPriceRange",
    "aiOnlyRoughValueRange",
    "valueRating",
    "recommendation",
    "consumerDownsideRisk",
    "cautiousBuyExplanation",
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

function normalizeReportForEvidenceDisplay(report, workflow) {
  const visibleResultCount = countVisibleResearchResults(report);
  const supportingResultCount = countReferenceSupportingResearchResults(report);
  if (supportingResultCount === 0) {
    return applyFrontendZeroEvidenceGuard(report, workflow);
  }
  const initialClassification = classifyValuationEvidenceForDisplay(report);
  const classified = initialClassification.state === "preliminary" && supportingResultCount === 0
    ? {
        state: "insufficient",
        label: "Fair Value Not Established",
        range: "",
        explanation: "No visible strong, partial, or reference source records support a preliminary range."
      }
    : initialClassification;
  const normalized = {
    ...report,
    valuationEvidenceState: classified.state,
    valuationEvidenceLabel: classified.label,
    valuationEvidenceExplanation: classified.explanation
  };

  if (workflow === "listing") {
    normalized.pricingEvidenceState = classified.state;
    return normalized;
  }

  if (classified.state === "supported") {
    normalized.estimatedFairMarketValue = normalizeMoneyText(normalized.estimatedFairMarketValue);
    normalized.estimatedMarketValue = normalizeMoneyText(normalized.estimatedMarketValue);
    normalized.fairPriceRange = normalizeMoneyArray(normalized.fairPriceRange);
    normalized.preliminaryReferenceRange = "";
    normalized.fairValueNotEstablished = "";
    return normalized;
  }

  if (classified.state === "preliminary") {
    normalized.preliminaryReferenceRange = firstNonEmpty(
      report.preliminaryReferenceRange,
      `${classified.range} based on ${supportingResultCount} visible strong, partial, or reference result${supportingResultCount === 1 ? "" : "s"}; no confirmed sales or strong comparable matches were found. This is not a verified fair-market-value estimate.`
    );
    normalized.referenceRangeBasis = firstNonEmpty(
      report.referenceRangeBasis,
      `${supportingResultCount} visible supporting result${supportingResultCount === 1 ? "" : "s"} and ${visibleResultCount} total search result${visibleResultCount === 1 ? "" : "s"} are visible in Research Details.`
    );
    normalized.fairValueNotEstablished = "";
    normalized.estimatedFairMarketValue = "";
    normalized.estimatedMarketValue = "";
    normalized.fairPriceRange = [];
    normalized.whatThisMeans = firstNonEmpty(report.whatThisMeans, buildPreliminaryMeaningText(report, classified));
    normalized.bestNextStep = firstNonEmpty(report.bestNextStep, getOneBestNextEvidenceStep(report));
    return normalized;
  }

  normalized.preliminaryReferenceRange = "";
  normalized.fairValueNotEstablished = "Fair Value: Not established";
  normalized.estimatedFairMarketValue = "";
  normalized.estimatedMarketValue = "";
  normalized.fairPriceRange = [];
  normalized.valueRating = "Insufficient Evidence";
  normalized.whatThisMeans = firstNonEmpty(report.whatThisMeans, "Fair market value has not been established from the available evidence.");
  normalized.bestNextStep = firstNonEmpty(report.bestNextStep, getOneBestNextEvidenceStep(report));
  normalized.referenceRangeBasis = firstNonEmpty(report.referenceRangeBasis, "No numeric preliminary range is shown because there are no visible structured source records supporting one.");
  return normalized;
}

function applyFrontendZeroEvidenceGuard(report, workflow) {
  const askingPrice = firstNonEmpty(report.askingPrice, report.currentAskingPrice, report.visiblePrice);
  const safeExplanation = askingPrice
    ? `At ${askingPrice}, this may be a reasonable personal-use purchase only because the financial exposure is limited and the item appears identifiable from the submitted evidence. The current search did not return visible source-backed comparable evidence, so market value was not established.`
    : "The current search did not return visible source-backed comparable evidence. Fair value is not established.";
  const guarded = {
    ...report,
    valuationEvidenceState: "insufficient",
    valuationEvidenceLabel: "Fair Value Not Established",
    valuationEvidenceExplanation: "Zero visible structured source-backed comparable results were retained. Market value is not established.",
    fairValueNotEstablished: "Fair Value: Not established",
    estimatedFairMarketValue: "",
    estimatedMarketValue: "",
    fairPriceRange: [],
    preliminaryReferenceRange: "",
    referenceRangeBasis: "",
    referenceCenter: "",
    marketLow: "",
    marketHigh: "",
    activeAskingRange: "",
    soldRange: "",
    priceToMarketRatio: "",
    belowMarketPercent: "",
    aiOnlyRoughValueRange: "",
    suggestedListingPrice: "",
    expectedSalePrice: "",
    minimumAcceptablePrice: "",
    recommendedListingPrice: "",
    suggestedOfferRange: "",
    valueRating: "Insufficient Evidence",
    whatThisMeans: "The current search did not return visible source-backed comparable evidence. Fair value is not established.",
    priceBasis: "Fair value not established - the current search did not return visible source-backed comparable evidence.",
    currentPriceAssessment: "Insufficient evidence - no source-backed market comparison is supported.",
    pricingRationale: safeExplanation,
    cautiousBuyExplanation: /personal/i.test(firstNonEmpty(report.buyerIntent, workflow)) ? safeExplanation : "",
    consumerDownsideRisk: askingPrice ? `Only the asking price (${askingPrice}) is available for a limited-downside personal-use assessment.` : report.consumerDownsideRisk
  };

  return sanitizeFrontendZeroEvidenceText(guarded, askingPrice);
}

function sanitizeFrontendZeroEvidenceText(value, askingPrice, key = "") {
  const allowedPriceKeys = new Set(["askingPrice", "currentAskingPrice", "visiblePrice"]);
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeFrontendZeroEvidenceText(item, askingPrice, key)).filter((item) => item !== "");
  }
  if (value && typeof value === "object") {
    const result = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] = sanitizeFrontendZeroEvidenceText(childValue, askingPrice, childKey);
    }
    return result;
  }
  if (typeof value !== "string" || allowedPriceKeys.has(key)) {
    return value;
  }
  return sanitizeUnsupportedFrontendMarketText(value, askingPrice);
}

function sanitizeUnsupportedFrontendMarketText(value, askingPrice) {
  const text = String(value || "");
  if (!text) return text;
  const unsupported = /reference center|market range|median market|market low|market high|active asking range|sold range|price-to-market|below[- ]market|below inferred|inferred fair|estimated fair market|fair market value|market suggests|visible market evidence|typical market|derived market/i.test(text);
  const range = /\$\s*\d[\d,]*(?:\.\d{1,2})?\s*(?:-|to|–|—)\s*\$?\s*\d[\d,]*(?:\.\d{1,2})?/.test(text);
  const askingAmount = extractMoneyAmountsFromText(askingPrice)[0];
  const amounts = extractMoneyAmountsFromText(text);
  const nonAskingMoney = amounts.some((amount) => !Number.isFinite(askingAmount) || Math.round(amount) !== Math.round(askingAmount));
  if (unsupported || range || (nonAskingMoney && /\bmarket|value|range|reference|asking|sold|price|below|above\b/i.test(text))) {
    return "The current search did not return visible source-backed comparable evidence. Fair value is not established.";
  }
  return text;
}

function classifyValuationEvidenceForDisplay(report = {}) {
  const state = String(report.valuationEvidenceState || "").toLowerCase();
  const directRange = normalizeMoneyText(firstNonEmpty(report.preliminaryReferenceRange, report.estimatedFairMarketValue, report.estimatedMarketValue, report.aiOnlyRoughValueRange, report.expectedSalePrice, report.suggestedListingPrice));
  if (state === "supported") {
    return {
      state: "supported",
      label: "Estimated Fair Market Value",
      range: directRange,
      explanation: firstNonEmpty(report.valuationEvidenceExplanation, "Source-backed exact or strong comparable evidence supports this value.")
    };
  }
  if (state === "preliminary") {
    return {
      state: "preliminary",
      label: "Preliminary Reference Range",
      range: directRange,
      explanation: firstNonEmpty(report.valuationEvidenceExplanation, "The range is tentative and not verified fair market value.")
    };
  }
  if (state === "insufficient") {
    return {
      state: "insufficient",
      label: "Fair Value Not Established",
      range: "",
      explanation: firstNonEmpty(report.valuationEvidenceExplanation, "The evidence is too weak for a defensible dollar range.")
    };
  }

  const evidenceText = [
    report.valueRating,
    report.priceConfidence,
    report.pricingConfidence,
    report.valuationConfidence,
    report.liveCompConfidence,
    report.buyerDecisionConfidence,
    report.priceBasis,
    report.currentPriceAssessment,
    report.researchResults,
    report.comparableQuality,
    report.noReliableComparableItemsFound,
    report.aiOnlyRoughValueRange
  ].flat().map((item) => String(item || "")).join(" ").toLowerCase();
  const hasInsufficientEvidence = /insufficient evidence|no reliable|weak|partial|rejected|ai-only|ai only|rough value|active listing|active asking|not established|unavailable|low confidence/.test(evidenceText);
  const hasReliableComps = /source-backed comps found|exact match|strong similar match/.test(evidenceText) && !hasInsufficientEvidence;
  const range = extractMoneyRangeText([
    report.preliminaryReferenceRange,
    report.estimatedFairMarketValue,
    report.fairPriceRange,
    report.aiOnlyRoughValueRange,
    report.estimatedMarketValue,
    report.expectedSalePrice,
    report.suggestedListingPrice
  ].flat().join(" "));

  if (hasReliableComps) {
    return {
      state: "supported",
      label: "Estimated Fair Market Value",
      range,
      explanation: "Source-backed exact or strong comparable evidence supports this value."
    };
  }

  if (range) {
    return {
      state: "preliminary",
      label: "Preliminary Reference Range",
      range,
      explanation: "The range is tentative and not verified fair market value."
    };
  }

  return {
    state: "insufficient",
    label: "Fair Value Not Established",
    range: "",
    explanation: "The evidence is too weak for a defensible dollar range."
  };
}

function buildPreliminaryMeaningText(report, classified) {
  const asking = extractMoneyAmountsFromText(firstNonEmpty(report.askingPrice, report.currentAskingPrice));
  const range = extractMoneyAmountsFromText(classified.range);
  if (asking.length && range.length >= 2 && asking[0] < Math.min(...range)) {
    return `At ${formatMoney(asking[0])}, the price may be favorable relative to similar active listings, but there is not enough reliable evidence for a confident Buy recommendation.`;
  }
  return "The price may be directionally useful, but fair market value has not been established because no confirmed sales or strong comparable matches were found.";
}

function getOneBestNextEvidenceStep(report) {
  return firstNonEmpty(
    Array.isArray(report.whatToVerifyBeforeBuying) ? report.whatToVerifyBeforeBuying[0] : report.whatToVerifyBeforeBuying,
    Array.isArray(report.additionalInformationNeeded) ? report.additionalInformationNeeded[0] : report.additionalInformationNeeded,
    Array.isArray(report.missingDetails) ? report.missingDetails[0] : report.missingDetails,
    "Add one clear close-up of the strongest label, model number, SKU, UPC/barcode, maker mark, measurement, or condition issue."
  );
}

function countVisibleResearchResults(report = {}) {
  return [
    report.resultsFound,
    report.strongComparables,
    report.partialComparables,
    report.referenceResults,
    report.weakMatches,
    report.rejectedMatches
  ].flat().filter(Boolean).length;
}

function countReferenceSupportingResearchResults(report = {}) {
  return [
    report.strongComparables,
    report.partialComparables,
    report.referenceResults
  ].flat().filter(isUsableSourceRecord).length;
}

function isUsableSourceRecord(item) {
  if (!item) {
    return false;
  }
  if (typeof item === "string") {
    return /https?:\/\//i.test(item) || /\b(source|platform|site|marketplace)\s*[:=-]/i.test(item);
  }
  return Boolean(item.url || (item.source && !/not supplied/i.test(item.source)));
}

function extractMoneyRangeText(text) {
  const amounts = extractMoneyAmountsFromText(text);
  if (amounts.length >= 2) {
    return `${formatMoney(Math.min(...amounts))}-${formatMoney(Math.max(...amounts))}`;
  }
  if (amounts.length === 1) {
    const amount = amounts[0];
    return `${formatMoney(amount * 0.8)}-${formatMoney(amount * 1.2)}`;
  }
  return "";
}

function extractMoneyAmountsFromText(text) {
  const amounts = [];
  const source = String(text || "");
  const patterns = [
    /\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/g,
    /\b(?:about|around|approx(?:imately)?|range|from|between|value|price|worth|listing|asking|listed)\D{0,24}(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:-|to|and)\s*\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)/gi,
    /\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:-|to)\s*\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      for (const group of match.slice(1).filter(Boolean)) {
        const amount = Number(group.replace(/,/g, ""));
        if (Number.isFinite(amount) && amount > 0 && amount < 100000) {
          amounts.push(amount);
        }
      }
    }
  }

  return [...new Set(amounts)];
}

function normalizeMoneyText(value) {
  const text = normalizeDisplayValue(value);
  if (!text) {
    return "";
  }
  return text
    .replace(/\$?\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s+(?:to|through)\s+\$?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b/g, (_, low, high) => `${formatMoney(Number(low.replace(/,/g, "")))}-${formatMoney(Number(high.replace(/,/g, "")))}`)
    .replace(/\$?\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*-\s*\$?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b/g, (_, low, high) => `${formatMoney(Number(low.replace(/,/g, "")))}-${formatMoney(Number(high.replace(/,/g, "")))}`);
}

function normalizeMoneyArray(value) {
  return Array.isArray(value)
    ? value.map(normalizeMoneyText).filter(Boolean)
    : normalizeMoneyText(value);
}

function formatMoney(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString("en-US")}`;
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
  results.classList.remove("loading-state");
  results.innerHTML = "";

  results.appendChild(renderExecutiveSummary(report, currentWorkflow));

  const whyCards = buildSectionCards(report, sections, isWhySection);
  const whyGroup = renderReportGroup({
    title: "Why",
    helper: "The reasoning, confidence, risks, and evidence that shaped this recommendation.",
    open: true,
    children: whyCards.length ? whyCards : [renderPlainInsight("Why this result?", getBestWhyText(report))]
  });
  results.appendChild(whyGroup);

  const researchChildren = [];
  if (hasVisualRecognition(report)) {
    researchChildren.push(renderVisualRecognitionSummary(report));
  }

  if (report.subjectIdentity || report.exactProductIdentity || report.whatIsStillUnknown) {
    researchChildren.push(renderIdentitySummary(report));
  }

  if (hasResearchVisibility(report)) {
    researchChildren.push(renderResearchEvidencePanel(report));
  }

  researchChildren.push(...buildSectionCards(report, sections, (key) => !isWhySection(key) && !isResearchVisibilityKey(key)));
  if (!researchChildren.length) {
    researchChildren.push(renderPlainInsight("Research details", "No detailed research sections were returned for this report."));
  }

  const researchResultCount = countVisibleResearchResults(report);
  results.appendChild(renderReportGroup({
    title: researchResultCount ? `Research Details - ${researchResultCount} results found` : "Research Details",
    helper: researchResultCount
      ? "Search queries, sources, visible result records, comparable classification, rejection reasons, and limitations."
      : "Visual evidence, source coverage, comparable quality, pricing rationale, and detailed fields.",
    open: false,
    children: researchChildren
  }));

  results.appendChild(renderAppraiserSummary(report, currentWorkflow));
}

function buildSectionCards(report, sections, includeKey) {
  const seen = new Set();
  const cards = [];

  for (const [key, label] of sections) {
    if (seen.has(key) || !includeKey(key) || !shouldRenderSection(key, report[key])) {
      continue;
    }

    seen.add(key);
    cards.push(renderSectionCard({ key, label, value: report[key], report }));
  }

  return cards;
}

function hasResearchVisibility(report) {
  return Boolean(
    countVisibleResearchResults(report)
    || normalizeDisplayValue(report.searchQueriesUsed)
    || normalizeDisplayValue(report.sourcesSearched)
    || normalizeDisplayValue(report.searchCoverage)
    || normalizeDisplayValue(report.searchLimitations)
    || normalizeDisplayValue(report.searchDiagnostics)
  );
}

function isResearchVisibilityKey(key) {
  return new Set([
    "searchQueriesUsed",
    "sourcesSearched",
    "searchCoverage",
    "resultsFound",
    "strongComparables",
    "partialComparables",
    "referenceResults",
    "weakMatches",
    "rejectedMatches",
    "searchLimitations",
    "referenceRangeBasis",
    "searchDiagnostics"
  ]).has(key);
}

function renderResearchEvidencePanel(report) {
  const card = document.createElement("article");
  card.className = "section-card research-evidence-card";
  const header = document.createElement("div");
  header.className = "section-topline";
  const title = document.createElement("h3");
  title.textContent = "Research Evidence";
  const copyButton = document.createElement("button");
  copyButton.className = "copy-button";
  copyButton.type = "button";
  copyButton.textContent = "Copy Section";
  copyButton.addEventListener("click", () => copyText(formatResearchEvidence(report), copyButton));
  header.append(title, copyButton);

  const body = document.createElement("div");
  body.className = "section-body research-evidence-body";
  [
    ["Search Queries", report.searchQueriesUsed],
    ["Sources Searched", normalizeArray(report.sourcesSearched).length ? report.sourcesSearched : report.searchCoverage],
    ["Strong Comparables", report.strongComparables],
    ["Partial Comparables", report.partialComparables],
    ["Reference Results", report.referenceResults],
    ["Weak or Rejected Matches", [...normalizeArray(report.weakMatches), ...normalizeArray(report.rejectedMatches)]],
    ["Search Limitations", report.searchLimitations],
    ["Reference Range Basis", report.referenceRangeBasis],
    ["Technical Search Details", report.searchDiagnostics]
  ].forEach(([label, value]) => {
    if (!shouldRenderSection(label, value)) {
      return;
    }
    const subsection = document.createElement("section");
    subsection.className = "research-subsection";
    const heading = document.createElement("h4");
    heading.textContent = label;
    subsection.append(heading, label === "Technical Search Details" ? renderSearchDiagnostics(value) : renderValue(value));
    body.appendChild(subsection);
  });

  card.append(header, body);
  return card;
}

function renderSearchDiagnostics(diagnostics) {
  if (!diagnostics || typeof diagnostics !== "object") {
    return renderValue(diagnostics);
  }
  const wrapper = document.createElement("div");
  wrapper.className = "search-diagnostics";
  const summaryRows = [
    ["Queries Generated", Array.isArray(diagnostics.queriesGenerated) ? diagnostics.queriesGenerated.length : diagnostics.queryCount],
    ["Queries Attempted", Array.isArray(diagnostics.providerRequestRecords) ? diagnostics.providerRequestRecords.filter((record) => record.attempted).length : normalizeArray(diagnostics.queriesActuallySent).length],
    ["Sources Requested", diagnostics.sourcesRequested],
    ["Search Providers Queried", diagnostics.sourcesActuallyQueried],
    ["Provider Calls Attempted", diagnostics.providerCallsAttempted],
    ["Provider Calls Succeeded", diagnostics.providerCallsSucceeded],
    ["Raw Results Returned", diagnostics.rawResultCount],
    ["Results Parsed", diagnostics.parsedResultCount],
    ["Results Normalized", diagnostics.normalizedResultCount],
    ["Results Retained", diagnostics.retainedVisibleResultCount],
    ["Results Rejected", diagnostics.rejectedResultCount],
    ["Search Failure Stage", diagnostics.acquisitionFailureStage]
  ];

  const list = document.createElement("dl");
  list.className = "diagnostic-summary";
  summaryRows.forEach(([label, value]) => {
    if (!shouldRenderSection(label, value)) return;
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = cleanDiagnosticText(normalizeDisplayValue(value));
    list.append(dt, dd);
  });
  wrapper.appendChild(list);

  const records = Array.isArray(diagnostics.providerRequestRecords) && diagnostics.providerRequestRecords.length
    ? diagnostics.providerRequestRecords
    : diagnostics.queryResultsSummary;

  if (Array.isArray(records) && records.length) {
    const title = document.createElement("h5");
    title.textContent = "Search Queries Actually Sent";
    const rows = document.createElement("div");
    rows.className = "query-diagnostic-list";
    records.forEach((item) => rows.appendChild(renderQueryDiagnosticCard(item)));
    wrapper.append(title, rows);
  }

  if (Array.isArray(diagnostics.droppedResultReasons) && diagnostics.droppedResultReasons.length) {
    const title = document.createElement("h5");
    title.textContent = "Top Rejection Reasons";
    wrapper.append(title, renderValue(diagnostics.droppedResultReasons.map((item) => `${item.reason}: ${item.count}`)));
  }

  return wrapper;
}

function renderQueryDiagnosticCard(item) {
  const row = document.createElement("div");
  row.className = "query-diagnostic-row";
  const query = document.createElement("p");
  query.className = "query-diagnostic-query";
  query.textContent = cleanDiagnosticText(item.query || "Query not supplied");
  const facts = document.createElement("dl");
  facts.className = "query-diagnostic-facts";
  [
    ["Provider", item.provider || item.source],
    ["Attempted", (item.attempted ?? item.requestAttempted) ? "Yes" : "No"],
    ["Succeeded", (item.succeeded ?? item.requestSucceeded) ? "Yes" : "No"],
    ["Raw", item.rawResultCount],
    ["Parsed", item.parsedResultCount],
    ["Normalized", item.normalizedResultCount],
    ["Retained", item.retainedResultCount],
    ["Failure", item.failureStage || item.primaryRejectionStageOrReason],
    ["Error", item.errorCode || item.controlledError]
  ].forEach(([label, value]) => {
    if (!shouldRenderSection(label, value)) return;
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = cleanDiagnosticText(normalizeDisplayValue(value));
    facts.append(dt, dd);
  });
  row.append(query, facts);
  return row;
}

function cleanDiagnosticText(value) {
  return String(value || "").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
}

function renderSectionCard({ key, label, value, report }) {
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
  copyButton.textContent = "Copy Section";
  copyButton.addEventListener("click", () => {
    const copyValue = key === "buyer_risk_score" ? formatRiskSection(report) : formatSection(label, value);
    copyText(copyValue, copyButton);
  });

  const body = document.createElement("div");
  body.className = "section-body";
  body.appendChild(key === "buyer_risk_score" ? renderRiskScore(report) : renderValue(value));

  header.append(title, copyButton);
  card.append(header, body);
  return card;
}

function renderReportGroup({ title, helper, open = false, children = [] }) {
  const group = document.createElement("details");
  group.className = "report-group";
  group.open = open;

  const summary = document.createElement("summary");
  summary.className = "report-group-summary";
  const text = document.createElement("span");
  text.className = "details-summary-text";
  const titleText = document.createElement("span");
  titleText.className = "details-title";
  titleText.textContent = title;
  const helperText = document.createElement("span");
  helperText.className = "details-helper";
  helperText.textContent = helper;
  const chevron = document.createElement("span");
  chevron.className = "details-chevron";
  chevron.setAttribute("aria-hidden", "true");
  text.append(titleText, helperText);
  summary.append(text, chevron);

  const body = document.createElement("div");
  body.className = "report-group-body";
  children.forEach((child) => body.appendChild(child));
  group.append(summary, body);
  return group;
}

function renderPlainInsight(title, value) {
  const card = document.createElement("article");
  card.className = "section-card insight-card";
  const header = document.createElement("div");
  header.className = "section-topline";
  const heading = document.createElement("h3");
  heading.textContent = title;
  header.appendChild(heading);
  const body = document.createElement("div");
  body.className = "section-body";
  const paragraph = document.createElement("p");
  paragraph.textContent = value;
  body.appendChild(paragraph);
  card.append(header, body);
  return card;
}

function isWhySection(key) {
  return new Set([
    "recommendation",
    "purchaserDecision",
    "valueRating",
    "currentPriceAssessment",
    "buyerDecisionConfidence",
    "priceConfidence",
    "pricingConfidence",
    "pricingRationale",
    "valuationConfidence",
    "negotiationGuidance",
    "reasonsToBuy",
    "reasonsForCaution",
    "productOrConditionRisks",
    "primary_risk_factors",
    "risk_reduction_actions",
    "betterValueConsiderations",
    "betterPriceCheckNeeded",
    "resalePotential",
    "priceBasis"
  ]).has(key);
}

function getBestWhyText(report) {
  return firstNonEmpty(
    report.pricingRationale,
    report.negotiationGuidance,
    report.currentPriceAssessment,
    report.priceBasis,
    report.buyerDecisionConfidence,
    "The recommendation is based on the item evidence, available comparables, confidence level, price, condition, and remaining unknowns."
  );
}

function renderExecutiveSummary(report, workflow) {
  const summary = getExecutiveSummary(report, workflow);
  const card = document.createElement("article");
  card.className = `executive-summary-card ${getValueRatingModifier(summary.tone)}`;

  const header = document.createElement("div");
  header.className = "executive-summary-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "summary-eyebrow";
  eyebrow.textContent = summary.eyebrow;
  const title = document.createElement("h3");
  title.textContent = summary.title;
  const badge = document.createElement("span");
  badge.className = "summary-badge";
  badge.textContent = summary.badge;
  header.append(eyebrow, title, badge);

  const metrics = document.createElement("dl");
  metrics.className = "executive-metrics";
  summary.metrics.forEach(([name, value]) => {
    if (!value) {
      return;
    }

    const item = document.createElement("div");
    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = name;
    detail.textContent = value;
    item.append(term, detail);
    metrics.appendChild(item);
  });

  const confidence = renderConfidenceExplainer(report);
  const why = document.createElement("details");
  why.className = "summary-why";
  const whySummary = document.createElement("summary");
  whySummary.textContent = "Why?";
  const whyText = document.createElement("p");
  whyText.textContent = getBestWhyText(report);
  why.append(whySummary, whyText);

  const copyButton = document.createElement("button");
  copyButton.className = "copy-button summary-copy";
  copyButton.type = "button";
  copyButton.textContent = "Copy Summary";
  copyButton.addEventListener("click", () => copyText(formatExecutiveSummary(report, workflow), copyButton));

  card.append(header, metrics, confidence, why, copyButton);
  return card;
}

function getExecutiveSummary(report, workflow) {
  if (workflow === "listing") {
    const listingTitle = firstNonEmpty(report.optimizedListingTitle, report.title, report.listingTitle, report.identifiedItem, "Listing title needs review");
    const price = firstNonEmpty(report.recommendedListingPrice, report.suggestedListingPrice, report.priceStrategy, "Price needs review");
    const platform = firstNonEmpty(report.suggestedSellingPlatform, report.platform, report.recommendedSellingPlatform, "Platform not specified");
    const confidence = getConfidenceText(report);
    return {
      eyebrow: "Executive Summary",
      title: price,
      badge: "Generate Listing",
      tone: confidence,
      metrics: [
        ["Recommended Listing Price", price],
        ["Listing Title", listingTitle],
        ["Suggested Platform", platform],
        ["Confidence", confidence]
      ]
    };
  }

  if (workflow === "resale") {
    const decision = firstNonEmpty(report.purchaserDecision, report.recommendation, "Need More Info");
    const purchasePrice = firstNonEmpty(report.currentAskingPrice, report.askingPrice, "Not provided");
    const resaleRange = firstNonEmpty(report.expectedSalePrice, report.suggestedListingPrice, report.resalePotential, report.estimatedMarketValue, "Unclear");
    const profit = firstNonEmpty(report.expectedProfitPotential, report.profitPotential, report.minimumAcceptablePrice, report.resalePotential, "Not reliable enough to estimate");
    const maxBuy = firstNonEmpty(report.maximumRecommendedBuyPrice, report.walkAwayPrice, "No reliable maximum yet");
    const confidence = getConfidenceText(report);
    return {
      eyebrow: "Executive Summary",
      title: decision,
      badge: "Resale Decision",
      tone: decision,
      metrics: [
        ["Purchase Price", purchasePrice],
        ["Estimated Resale Range", resaleRange],
        ["Estimated Profit", profit],
        ["Maximum Buy Price", maxBuy],
        ["Confidence", confidence]
      ]
    };
  }

  if (workflow === "market_value") {
    const valuation = classifyValuationEvidenceForDisplay(report);
    const value = getValuationDisplayValue(report, valuation);
    const identity = firstNonEmpty(report.subjectIdentity, report.itemIdentification, report.identifiedItem, report.visualSubject, "Identity not verified");
    const confidence = getConfidenceText(report);
    return {
      eyebrow: "Executive Summary",
      title: value,
      badge: valuation.label,
      tone: confidence,
      metrics: [
        [valuation.label, value],
        ["Confidence", confidence],
        ["Most Likely Identity", identity]
      ]
    };
  }

  const recommendation = firstNonEmpty(report.recommendation, report.purchaserDecision, "Need More Information");
  const valueRating = firstNonEmpty(report.valueRating, report.currentPriceAssessment, "Insufficient Evidence");
  const askingPrice = firstNonEmpty(report.askingPrice, report.currentAskingPrice, "Not provided");
  const valuation = classifyValuationEvidenceForDisplay(report);
  const fairValue = getValuationDisplayValue(report, valuation);
  const confidence = getConfidenceText(report);
  const nextStep = firstNonEmpty(report.bestNextStep, report.recommendedOffer, report.negotiationGuidance, report.whatToVerifyBeforeBuying, report.additionalInformationNeeded, "Verify identity, condition, and price evidence before acting.");
  return {
    eyebrow: "Executive Summary",
    title: recommendation,
    badge: valueRating,
    tone: valueRating,
    metrics: [
      ["Recommendation", recommendation],
      ["Value Rating", valueRating],
      ["Asking Price", askingPrice],
      [valuation.label, fairValue],
      ["Confidence", confidence],
      ["Best Next Step", normalizeDisplayValue(nextStep)]
    ]
  };
}

function getValuationDisplayValue(report, valuation) {
  if (valuation.state === "supported") {
    return firstNonEmpty(report.estimatedFairMarketValue, report.estimatedMarketValue, report.fairPriceRange, valuation.range, "Value needs more evidence");
  }
  if (valuation.state === "preliminary") {
    return firstNonEmpty(report.preliminaryReferenceRange, valuation.range, "Preliminary reference range needs more evidence");
  }
  return firstNonEmpty(report.fairValueNotEstablished, "Fair Value: Not established");
}

function renderConfidenceExplainer(report) {
  const drivers = getConfidenceDrivers(report);
  const block = document.createElement("div");
  block.className = "confidence-explainer";
  const title = document.createElement("h4");
  title.textContent = `Confidence: ${getConfidenceText(report)}`;
  const list = document.createElement("ul");
  drivers.forEach((driver) => {
    const item = document.createElement("li");
    item.textContent = driver;
    list.appendChild(item);
  });
  block.append(title, list);
  return block;
}

function getConfidenceDrivers(report) {
  const drivers = [];
  const visualConfidence = String(report.visualSubjectConfidence || report.subjectConfidence || "").toLowerCase();
  const compText = normalizeDisplayValue(firstNonEmpty(report.comparableQuality, report.liveCompConfidence, report.researchResults)).toLowerCase();
  const exactText = String(report.exactProductIdentity || report.exactProductConfidence || "").toLowerCase();
  const priceText = normalizeDisplayValue(firstNonEmpty(report.priceConfidence, report.pricingConfidence, report.valuationConfidence, report.buyerDecisionConfidence)).toLowerCase();

  if (/high|strong|clearly|confirmed/.test(visualConfidence)) {
    drivers.push("Subject appears well supported by the photos.");
  } else if (visualConfidence) {
    drivers.push("Visual identification still has limits.");
  }

  if (/exact match|strong comparable|source-backed|reliable/.test(compText)) {
    drivers.push("Comparable evidence appears useful enough to support the decision.");
  } else if (/no reliable|weak|partial|rejected|ai-only|unavailable/.test(compText)) {
    drivers.push("Comparable evidence is limited or did not pass match-quality checks.");
  }

  if (/unknown|unverified|not verified|low/.test(exactText)) {
    drivers.push("Exact product, maker, date, licensing, or authenticity may still need verification.");
  }

  if (/low|insufficient|unclear|limited/.test(priceText)) {
    drivers.push("Pricing should be treated cautiously until stronger evidence is available.");
  } else if (/high|medium|moderate/.test(priceText)) {
    drivers.push("Pricing confidence is supported by the available evidence, but final condition still matters.");
  }

  if (!drivers.length) {
    drivers.push("Confidence depends on photo clarity, item identity, condition, and source-backed comparable quality.");
  }

  return drivers.slice(0, 4);
}

function renderAppraiserSummary(report, workflow) {
  const card = document.createElement("article");
  card.className = "appraiser-summary-card";
  const header = document.createElement("div");
  header.className = "appraiser-summary-header";
  const eyebrow = document.createElement("p");
  eyebrow.className = "summary-eyebrow";
  eyebrow.textContent = "Final read";
  const title = document.createElement("h3");
  title.textContent = "Appraiser Summary";
  header.append(eyebrow, title);

  const grid = document.createElement("div");
  grid.className = "appraiser-grid";
  [
    ["What I Know", getWhatIKnow(report)],
    ["What I'm Unsure About", getWhatIsUnclear(report)],
    ["What I'd Check Next", getWhatToCheckNext(report)],
    ["Final Recommendation", getFinalRecommendation(report, workflow)]
  ].forEach(([label, value]) => {
    const section = document.createElement("section");
    const heading = document.createElement("h4");
    heading.textContent = label;
    const paragraph = document.createElement("p");
    paragraph.textContent = normalizeDisplayValue(value);
    section.append(heading, paragraph);
    grid.appendChild(section);
  });

  card.append(header, grid);
  return card;
}

function getWhatIKnow(report) {
  return firstNonEmpty(
    report.whatIsKnown,
    report.visualRecognitionSummary,
    report.identitySummary,
    report.itemIdentification,
    report.identifiedItem,
    report.subjectIdentity,
    "The photos and notes provide enough context for a preliminary item read."
  );
}

function getWhatIsUnclear(report) {
  return firstNonEmpty(
    report.whatIsStillUnknown,
    report.missingDetails,
    report.additionalInformationNeeded,
    report.visualRecognitionUnknowns,
    report.identityConflicts,
    "Exact identity, condition, source-backed value, or buyer fit may still need verification."
  );
}

function getWhatToCheckNext(report) {
  return firstNonEmpty(
    report.whatToVerifyBeforeBuying,
    report.risk_reduction_actions,
    report.additionalInformationNeeded,
    report.stagingPhotos,
    "Take one clear close-up of the strongest label, mark, model number, damage area, or size reference."
  );
}

function getFinalRecommendation(report, workflow) {
  if (workflow === "listing") {
    return firstNonEmpty(report.priceStrategy, report.sellerNotes, report.recommendedListingPrice, "Use the listing draft, then verify facts and condition before posting.");
  }

  return firstNonEmpty(
    report.recommendation,
    report.purchaserDecision,
    report.currentPriceAssessment,
    report.maximumRecommendedBuyPrice,
    "Treat this as decision support and verify identity, condition, and pricing before acting."
  );
}

function getConfidenceText(report) {
  return normalizeDisplayValue(firstNonEmpty(
    report.buyerDecisionConfidence,
    report.priceConfidence,
    report.pricingConfidence,
    report.valuationConfidence,
    report.liveCompConfidence,
    report.identificationConfidence,
    report.itemIdentificationConfidence,
    report.visualSubjectConfidence,
    "Confidence depends on the evidence available."
  ));
}

function normalizeDisplayValue(value) {
  if (Array.isArray(value)) {
    return value
      .filter(Boolean)
      .map((item) => item && typeof item === "object" ? formatResearchRecordText(item) : String(item))
      .join(" | ");
  }

  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, item]) => String(item || "").trim())
      .map(([key, item]) => `${formatAnswerType(key)}: ${item}`)
      .join(" | ");
  }

  return String(value || "").replace(/\\n/g, " ").trim();
}

function normalizeArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  return value ? [value] : [];
}

function formatExecutiveSummary(report, workflow) {
  const summary = getExecutiveSummary(report, workflow);
  return [
    "Executive Summary",
    summary.title,
    "",
    ...summary.metrics
      .filter(([, value]) => value)
      .map(([label, value]) => `${label}\n${value}`),
    "",
    "Confidence Because",
    ...getConfidenceDrivers(report).map((item) => `- ${item}`),
    "",
    "Why",
    getBestWhyText(report)
  ].filter(Boolean).join("\n");
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
    analysisId: session.analysisId,
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
    empty.textContent = "Ask about this item, the evidence, the recommendation, a different price, or the listing. Ask Market Edge uses the current report and will tell you when a new search or more evidence is needed.";
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
  const valuation = classifyValuationEvidenceForDisplay(report);
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
    [valuation.label, getValuationDisplayValue(report, valuation)],
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

  if ((key === "estimatedFairMarketValue" || key === "fairPriceRange") && latestReport) {
    return classifyValuationEvidenceForDisplay(latestReport).state === "supported";
  }

  if ((key === "noReliableComparableItemsFound" || key === "liveSearchDidNotComplete" || key === "aiOnlyRoughValueRange") && !value) {
    return false;
  }

  return true;
}

function renderValue(value) {
  if (Array.isArray(value)) {
    if (value.some((item) => item && typeof item === "object")) {
      return renderResearchResultList(value);
    }

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

function renderResearchResultList(value) {
  const wrapper = document.createElement("div");
  wrapper.className = "source-result-list";

  for (const item of value) {
    if (!item || typeof item !== "object") {
      const paragraph = document.createElement("p");
      paragraph.textContent = String(item || "");
      wrapper.appendChild(paragraph);
      continue;
    }

    const card = document.createElement("article");
    card.className = "source-result-card";
    const heading = document.createElement("h5");
    heading.textContent = item.title || "Source result";
    card.appendChild(heading);

    const meta = document.createElement("dl");
    meta.className = "source-result-meta";
    [
      ["Source", item.source],
      ["Price", item.displayedPrice || item.price],
      ["Price Type", item.priceType],
      ["Classification", item.classification],
      ["Evidence Role", item.evidenceRole],
      ["Condition", item.condition],
      ["Influenced Range", item.influencedReferenceRange],
      ["Identity Differences", item.itemIdentityDifferences],
      ["Rejection Reason", item.rejectionReason],
      ["Source Support", item.sourceBacked]
    ].forEach(([label, detail]) => {
      if (!detail) {
        return;
      }
      const row = document.createElement("div");
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = detail;
      row.append(term, description);
      meta.appendChild(row);
    });
    card.appendChild(meta);

    if (item.matchExplanation) {
      const explanation = document.createElement("p");
      explanation.className = "source-result-explanation";
      explanation.textContent = item.matchExplanation;
      card.appendChild(explanation);
    }

    if (item.url) {
      const link = document.createElement("a");
      link.className = "source-result-link";
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.url;
      card.appendChild(link);
    } else {
      const noLink = document.createElement("p");
      noLink.className = "source-result-link missing";
      noLink.textContent = "No usable URL supplied by source.";
      card.appendChild(noLink);
    }

    wrapper.appendChild(card);
  }

  return wrapper;
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
  results.innerHTML = "";

  const intro = document.createElement("div");
  intro.className = "first-run-card";
  const title = document.createElement("h3");
  title.textContent = "Photograph any item.";
  const copy = document.createElement("p");
  copy.textContent = "We'll identify it, estimate its value, and help you make the smartest buying or selling decision.";
  const helper = document.createElement("p");
  helper.className = "first-run-helper";
  helper.textContent = config.emptyMessage;
  intro.append(title, copy, helper);
  results.appendChild(intro);
}

function setOutputHeading(config) {
  outputEyebrow.textContent = config.eyebrow;
  outputTitle.textContent = config.title;
}

function setLoading(isLoading, workflow = currentWorkflow) {
  const config = workflowConfigs[workflow] || workflowConfigs[defaultWorkflow];
  workflowSubmitButton.disabled = isLoading;
  workflowSubmitLabel.textContent = isLoading ? config.activeLabel : config.defaultLabel;

  if (!isLoading) {
    stopLoadingProgress();
  }
}

function startLoadingProgress(config, requestId, workflow) {
  stopLoadingProgress();
  loadingProgressIndex = 0;
  const stages = getLoadingStages(workflow);
  renderLoadingProgress(stages, loadingProgressIndex);
  setStatus(stages[loadingProgressIndex], "loading");

  loadingProgressTimer = setInterval(() => {
    if (!isCurrentRequest(requestId, workflow)) {
      stopLoadingProgress();
      return;
    }

    loadingProgressIndex = Math.min(loadingProgressIndex + 1, stages.length - 1);
    renderLoadingProgress(stages, loadingProgressIndex);
    setStatus(stages[loadingProgressIndex], "loading");
  }, 1500);
}

function stopLoadingProgress() {
  if (loadingProgressTimer) {
    clearInterval(loadingProgressTimer);
    loadingProgressTimer = null;
  }
}

function getLoadingStages(workflow) {
  if (workflow === "listing") {
    return [
      "Identifying subject",
      "Searching references",
      "Evaluating comparable quality",
      "Building listing price support",
      "Preparing listing"
    ];
  }

  return [
    "Identifying subject",
    "Searching references",
    "Evaluating comparable quality",
    "Calculating value",
    "Preparing report"
  ];
}

function renderLoadingProgress(stages, activeIndex) {
  results.className = "results loading-state";
  results.innerHTML = "";

  const card = document.createElement("section");
  card.className = "loading-card";
  card.setAttribute("aria-label", "Analysis progress");

  const title = document.createElement("h3");
  title.textContent = "Analyzing item";
  const helper = document.createElement("p");
  helper.textContent = "Market Edge is checking the item step by step.";

  const list = document.createElement("ol");
  list.className = "loading-steps";
  stages.forEach((stage, index) => {
    const item = document.createElement("li");
    item.textContent = stage;
    if (index < activeIndex) {
      item.className = "is-complete";
    } else if (index === activeIndex) {
      item.className = "is-active";
      item.setAttribute("aria-current", "step");
    }
    list.appendChild(item);
  });

  card.append(title, helper, list);
  results.appendChild(card);
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status is-visible is-${type}`;
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

function getFriendlyErrorMessage(error, config) {
  const message = String(error && error.message || "").trim();

  if (/no results/i.test(message)) {
    return "We could not find an exact match. Try one full-item photo plus one close-up of the label, mark, model number, barcode, or damage.";
  }

  if (/api key|OPENAI/i.test(message)) {
    return message;
  }

  if (/network|failed to fetch|request failed|timeout/i.test(message)) {
    return "The analysis could not finish because the connection stalled. Try again with the same photos, or start with fewer/lower-resolution photos.";
  }

  return message || `${config.errorMessage} The most useful next step is one clear full-item photo plus one close-up of any label, mark, model number, barcode, or condition issue.`;
}

function toggleFeedbackPanel() {
  const shouldShow = feedbackPanel.hidden;
  feedbackPanel.hidden = !shouldShow;
  feedbackButton.setAttribute("aria-expanded", shouldShow ? "true" : "false");
  feedbackStatus.textContent = "";

  if (shouldShow) {
    feedbackText.focus();
  }
}

async function copyFeedbackText() {
  const text = feedbackText.value.trim();
  if (!text) {
    feedbackStatus.textContent = "Add a quick note first.";
    feedbackText.focus();
    return;
  }

  const context = latestReport
    ? `Workflow: ${workflowConfigs[currentWorkflow].title || currentWorkflow}\nCurrent result: ${normalizeDisplayValue(getFinalRecommendation(latestReport, currentWorkflow))}\n\n`
    : "";
  await navigator.clipboard.writeText(`${context}Feedback:\n${text}`);
  feedbackStatus.textContent = "Feedback copied. Paste it into your beta feedback message.";
  feedbackText.value = "";
}

async function copyText(text, button) {
  await navigator.clipboard.writeText(text);
  const original = button.textContent;
  button.textContent = "Copied!";
  button.classList.add("is-copied");
  setTimeout(() => {
    button.textContent = original;
    button.classList.remove("is-copied");
  }, 1200);
}

function formatReport(report, sections) {
  const detailText = sections
    .filter(([key]) => shouldRenderSection(key, report[key]))
    .map(([key, label]) => key === "buyer_risk_score" ? formatRiskSection(report) : formatSection(label, report[key]))
    .join("\n\n");
  const finalText = [
    "What I Know",
    normalizeDisplayValue(getWhatIKnow(report)),
    "",
    "What I'm Unsure About",
    normalizeDisplayValue(getWhatIsUnclear(report)),
    "",
    "What I'd Check Next",
    normalizeDisplayValue(getWhatToCheckNext(report)),
    "",
    "Final Recommendation",
    normalizeDisplayValue(getFinalRecommendation(report, currentWorkflow))
  ].join("\n");

  return [
    formatExecutiveSummary(report, currentWorkflow),
    detailText,
    finalText
  ].filter(Boolean).join("\n\n");
}

function formatResearchEvidence(report) {
  return [
    formatSection("Search Queries", report.searchQueriesUsed),
    formatSection("Sources Searched", normalizeArray(report.sourcesSearched).length ? report.sourcesSearched : report.searchCoverage),
    formatSection("Strong Comparables", report.strongComparables),
    formatSection("Partial Comparables", report.partialComparables),
    formatSection("Reference Results", report.referenceResults),
    formatSection("Weak Matches", report.weakMatches),
    formatSection("Rejected Matches", report.rejectedMatches),
    formatSection("Search Limitations", report.searchLimitations),
    formatSection("Reference Range Basis", report.referenceRangeBasis),
    formatSection("Technical Search Details", formatSearchDiagnosticsText(report.searchDiagnostics)),
    formatSection("Consumer Downside Risk", report.consumerDownsideRisk),
    formatSection("Cautious Buy Explanation", report.cautiousBuyExplanation)
  ].filter((item) => item.trim()).join("\n\n");
}

function formatSearchDiagnosticsText(diagnostics) {
  if (!diagnostics || typeof diagnostics !== "object") {
    return "";
  }
  const rows = [
    ["Queries Generated", Array.isArray(diagnostics.queriesGenerated) ? diagnostics.queriesGenerated.length : diagnostics.queryCount],
    ["Queries Attempted", Array.isArray(diagnostics.providerRequestRecords) ? diagnostics.providerRequestRecords.filter((record) => record.attempted).length : normalizeArray(diagnostics.queriesActuallySent).length],
    ["Sources Requested", diagnostics.sourcesRequested],
    ["Search Providers Queried", diagnostics.sourcesActuallyQueried],
    ["Provider Calls Attempted", diagnostics.providerCallsAttempted],
    ["Provider Calls Succeeded", diagnostics.providerCallsSucceeded],
    ["Raw Results Returned", diagnostics.rawResultCount],
    ["Results Parsed", diagnostics.parsedResultCount],
    ["Results Normalized", diagnostics.normalizedResultCount],
    ["Results Retained", diagnostics.retainedVisibleResultCount],
    ["Results Rejected", diagnostics.rejectedResultCount],
    ["Search Failure Stage", diagnostics.acquisitionFailureStage]
  ]
    .filter(([, value]) => shouldRenderSection("diagnostic", value))
    .map(([label, value]) => `${label}: ${cleanDiagnosticText(normalizeDisplayValue(value))}`);

  if (Array.isArray(diagnostics.droppedResultReasons) && diagnostics.droppedResultReasons.length) {
    rows.push("Top Rejection Reasons:");
    diagnostics.droppedResultReasons.forEach((item) => {
      rows.push(`- ${item.reason}: ${item.count}`);
    });
  }

  const records = Array.isArray(diagnostics.providerRequestRecords) && diagnostics.providerRequestRecords.length
    ? diagnostics.providerRequestRecords
    : diagnostics.queryResultsSummary;
  if (Array.isArray(records) && records.length) {
    rows.push("Search Queries Actually Sent:");
    records.forEach((item) => {
      rows.push(`- Query: ${cleanDiagnosticText(item.query)} | Attempted: ${(item.attempted ?? item.requestAttempted) ? "yes" : "no"} | Succeeded: ${(item.succeeded ?? item.requestSucceeded) ? "yes" : "no"} | Raw: ${item.rawResultCount} | Parsed: ${item.parsedResultCount} | Normalized: ${item.normalizedResultCount || 0} | Retained: ${item.retainedResultCount} | Stage: ${item.failureStage || item.primaryRejectionStageOrReason || "none"}${item.errorCode || item.controlledError ? ` | Error: ${cleanDiagnosticText(item.errorCode || item.controlledError)}` : ""}`);
    });
  }

  return rows.join("\n");
}

function formatSection(label, value) {
  const body = Array.isArray(value)
    ? value.map((item) => item && typeof item === "object" ? formatResearchRecordText(item) : `- ${item}`).join("\n")
    : value && typeof value === "object"
      ? formatResearchRecordText(value)
      : value;
  return `${label}\n${body || ""}`;
}

function formatResearchRecordText(item) {
  const fields = [
    ["Title", item.title],
    ["Source", item.source],
    ["URL", item.url || "No usable URL supplied by source."],
    ["Displayed Price", item.displayedPrice || item.price],
    ["Currency", item.currency],
    ["Price Type", item.priceType],
    ["Classification", item.classification],
    ["Evidence Role", item.evidenceRole],
    ["Condition", item.condition],
    ["Match Explanation", item.matchExplanation],
    ["Identity Differences", item.itemIdentityDifferences],
    ["Influenced Reference Range", item.influencedReferenceRange],
    ["Rejection Reason", item.rejectionReason],
    ["Source Support", item.sourceBacked]
  ]
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`);
  return fields.length ? `- ${fields.join(" | ")}` : `- ${String(item.rawText || "")}`;
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
