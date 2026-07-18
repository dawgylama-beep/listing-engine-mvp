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
const buyerIntakeEyebrow = document.querySelector("#buyer-intake-eyebrow");
const buyerIntakeTitle = document.querySelector("#buyer-intake-title");
const buyerIntakeHelper = document.querySelector("#buyer-intake-helper");
const purchaseContextControl = document.querySelector("#purchase-context-control");
const purchaseContextInput = document.querySelector("#purchase_context");
const askingPriceControl = document.querySelector("#asking-price-control");
const askingPriceLabel = document.querySelector("#asking-price-label");
const askingPriceNote = document.querySelector("#asking-price-note");
const retailContextFields = document.querySelector("#retail-context-fields");
const contextNameFields = document.querySelector("#context-name-fields");
const ownerLocationFields = document.querySelector("#owner-location-fields");
const sellerPreferencesFields = document.querySelector("#seller-preferences-fields");
const purchaseIntentControl = document.querySelector("#purchase-intent-control");
const purchaseIntentInput = document.querySelector("#purchase_intent");
const askingPriceInput = document.querySelector("#asking_price");
const completenessControl = document.querySelector("#completeness-control");
const itemCompletenessInput = document.querySelector("#item_completeness");
const ownerLocationZipInput = document.querySelector("#owner_location_zip");
const fulfillmentPreferenceInput = document.querySelector("#fulfillment_preference");
const sellingSpeedInput = document.querySelector("#selling_speed");
const storeNameInput = document.querySelector("#store_name");
const locationZipInput = document.querySelector("#location_zip");
const useLocationButton = document.querySelector("#use-location-button");
const retryLocationButton = document.querySelector("#retry-location-button");
const manualZipButton = document.querySelector("#manual-zip-button");
const skipLocationButton = document.querySelector("#skip-location-button");
const locationFallbackActions = document.querySelector("#location-fallback-actions");
const locationStatus = document.querySelector("#location-status");
const locationModeInput = document.querySelector("#location_mode");
const locationStateInput = document.querySelector("#location_state");
const locationPermissionInput = document.querySelector("#location_permission");
const locationAreaInput = document.querySelector("#location_area");
const retailerOrMarketplaceInput = document.querySelector("#retailer_or_marketplace_name");
const knownShippingAmountInput = document.querySelector("#known_shipping_amount");
const notesInput = document.querySelector("#notes");
const notesNote = document.querySelector("#notes-note");
const outputActions = document.querySelector("#output-actions");
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

const submissionStages = Object.freeze({
  IDLE: "idle",
  PHOTO_READ: "photo_read",
  IMAGE_PROCESS: "image_process",
  API_REQUEST: "api_request",
  API_RESPONSE: "api_response",
  REPORT_RENDER: "report_render"
});

const locationStates = Object.freeze({
  IDLE: "idle",
  REQUESTING: "requesting",
  PERMISSION_DENIED: "permission-denied",
  POSITION_UNAVAILABLE: "position-unavailable",
  TIMEOUT: "timeout",
  UNSUPPORTED: "unsupported",
  INSECURE_CONTEXT: "insecure-context",
  REVERSE_GEOCODE_FAILED: "reverse-geocode-failed",
  GENERAL_AREA_RESOLVED: "general-area-resolved",
  ZIP_RESOLVED: "zip-resolved",
  MANUAL_ZIP: "manual-ZIP",
  SKIPPED: "skipped"
});

let locationFailureCount = 0;

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
  ["itemIdentificationEvidence", "Item Identification Evidence"],
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
  ["itemIdentificationEvidence", "Item Identification Evidence"],
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

const ownerValueSections = valuationSections.map(([key, label]) => {
  const labels = {
    purchaserDecision: "Owner Value Assessment",
    buyer_risk_score: "Value Confidence Risk",
    buyerDecisionConfidence: "Assessment Confidence",
    currentAskingPrice: "Owner Price Context",
    maximumRecommendedBuyPrice: "Owner Value Limit",
    betterPriceCheckNeeded: "Additional Value Check Needed?",
    whatToVerifyBeforeBuying: "What To Verify Next"
  };
  return [key, labels[key] || label];
});

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
  ["purchaseContextSummary", "Purchase Context"],
  ["retailEvidenceMode", "Retail Evidence Mode"],
  ["retailRouteClassification", "Retail Route Classification"],
  ["retailPurchaseDecision", "Retail Purchase Decision"],
  ["askingStorePrice", "Asking / Store Price"],
  ["currentRetailPriceAssessment", "Current Retail Price Assessment"],
  ["namedStoreResult", "Named Store Result"],
  ["bestCurrentRetailAlternative", "Best Current Retail Alternative"],
  ["otherCurrentRetailPrices", "Other Current Retail Prices"],
  ["packageUnitPriceComparison", "Package and Unit Price Comparison"],
  ["localAvailabilityContext", "Local Availability Context"],
  ["retailPriceLimit", "Retail Price Limit"],
  ["barcodeSearchStatus", "Barcode Search Status"],
  ["localStoreContext", "Local Store Context"],
  ["retailPriceContext", "Retail Price Context"],
  ["packageUnitPriceContext", "Package / Unit Price Context"],
  ["askingPrice", "Asking Price"],
  ["bestCompatiblePriceFound", "Best Compatible Price Found"],
  ["currentPurchaseOptionSummary", "Current Purchase Option Summary"],
  ["priceSpectrumSummary", "Price Spectrum Summary"],
  ["otherCompatiblePricesFound", "Other Compatible Prices Found"],
  ["pricesFound", "Prices Found"],
  ["verifiedMarketRange", "Verified Market Range"],
  ["currentAskingPriceRange", "Current Asking-Price Range"],
  ["preliminaryReferenceRange", "Preliminary Reference Range"],
  ["priceRangeAnalysis", "Price Range Analysis"],
  ["customerPricingSummary", "Customer Pricing Summary"],
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
  ["maximumRecommendedPriceExplanation", "Maximum Price Guard"],
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
  ["itemIdentificationEvidence", "Item Identification Evidence"],
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
    eyebrow: "Personal-Use Buying Decision",
    title: "Buying for Myself",
    emptyMessage: "Your recommendation will appear here after analysis.",
    loadingMessage: "Searching comparable items for personal-use value...",
    activeLabel: "Analyzing...",
    defaultLabel: "Analyze Buying for Myself",
    workflowHelper: "Fair-price guidance, comparisons, and a clear buying recommendation.",
    platformNote: "Optional. Leave blank unless a marketplace context matters.",
    notesNote: "Optional. Add label wording, flaws, seller comments, measurements, or personal-use concerns.",
    buyerEyebrow: "Purchase details",
    buyerTitle: "Buying Details",
    buyerHelper: "Add what you know about the purchase opportunity. Price and condition can stay blank if you are not sure.",
    priceLabel: "Seller/store price",
    pricePlaceholder: "Seller/store price, e.g. $5.50",
    priceNote: "Optional. Add cents exactly when shown, such as 5.50.",
    showPlatform: false,
    showBuyerIntake: true,
    showPurchaseContext: true,
    showPrice: true,
    showCompleteness: false,
    showOwnerLocation: false,
    showSellerPreferences: false,
    platformRequired: false,
    notesRequired: false,
    askingPriceRequired: false,
    purchaseContextRequired: true
  },
  resale: {
    ...reportTypes.marketValue,
    workflow: "resale",
    purchaseIntent: "resale",
    eyebrow: "Resale Buying Decision",
    title: "Buying to Resell",
    emptyMessage: "Your recommendation will appear here after analysis.",
    loadingMessage: "Searching comparable items for resale potential...",
    activeLabel: "Analyzing...",
    defaultLabel: "Analyze Buying to Resell",
    workflowHelper: "Margin, resale price, platform fit, risk, and profit guidance.",
    platformNote: "Optional. Select where you may resell if you already know the target platform.",
    notesNote: "Optional. Add flaws, seller comments, transport costs, shipping issues, or resale concerns.",
    buyerEyebrow: "Acquisition details",
    buyerTitle: "Buying Details",
    buyerHelper: "Add acquisition price, purchase context, condition, expected costs, and product details when known.",
    priceLabel: "Acquisition price",
    pricePlaceholder: "Acquisition price, e.g. $12.75",
    priceNote: "Optional. Add exact cents for margin and risk calculations.",
    showPlatform: true,
    showBuyerIntake: true,
    showPurchaseContext: true,
    showPrice: true,
    showCompleteness: true,
    showOwnerLocation: false,
    showSellerPreferences: false,
    platformRequired: false,
    notesRequired: false,
    askingPriceRequired: false,
    purchaseContextRequired: false
  },
  market_value: {
    ...reportTypes.marketValue,
    workflow: "market_value",
    purchaseIntent: "owner_value",
    sections: ownerValueSections,
    eyebrow: "Owner Value Assessment",
    title: "Value Something I Own",
    emptyMessage: "Your recommendation will appear here after analysis.",
    loadingMessage: "Searching comparable items for owner value...",
    activeLabel: "Valuing...",
    defaultLabel: "Value My Item",
    workflowHelper: "Identify what you have and estimate its supported market value.",
    platformNote: "Optional. Select a likely venue only if it matters to value.",
    notesNote: "Optional. Add provenance, ownership notes, flaws, measurements, or what you already know.",
    buyerEyebrow: "Ownership details",
    buyerTitle: "Ownership Details",
    buyerHelper: "Add condition, completeness, age or provenance, and product details. No purchase price is required.",
    priceLabel: "",
    pricePlaceholder: "",
    priceNote: "",
    showPlatform: true,
    showBuyerIntake: true,
    showPurchaseContext: false,
    showPrice: false,
    showCompleteness: true,
    showOwnerLocation: true,
    showSellerPreferences: false,
    platformRequired: false,
    notesRequired: false,
    askingPriceRequired: false,
    purchaseContextRequired: false
  },
  listing: {
    ...reportTypes.listing,
    workflow: "listing",
    purchaseIntent: "seller_listing",
    eyebrow: "Seller Pricing and Listing Plan",
    title: "Sell Something I Own",
    emptyMessage: "Your recommendation will appear here after analysis.",
    loadingMessage: "Researching seller pricing and listing support...",
    activeLabel: "Creating...",
    defaultLabel: "Create Selling Plan and Listing",
    workflowHelper: "Set a selling price and create a seller-ready listing.",
    platformNote: "Optional. Select your preferred marketplace when useful.",
    notesNote: "Optional. Add ownership notes, flaws, measurements, accessories, and what a buyer should know.",
    buyerEyebrow: "Selling details",
    buyerTitle: "Selling Details",
    buyerHelper: "Add condition, completeness, platform preference, pickup or shipping, selling speed, and product details.",
    showPlatform: true,
    showBuyerIntake: true,
    showPurchaseContext: false,
    showPrice: false,
    showCompleteness: true,
    showOwnerLocation: false,
    showSellerPreferences: true,
    platformRequired: false,
    notesRequired: false,
    askingPriceRequired: false
  }
};

const defaultWorkflow = "personal_use";
const legacyWorkflowMap = {
  personal: "personal_use",
  personal_buy: "personal_use",
  personal_use_buy: "personal_use",
  worth_buying: "personal_use",
  resale_buy: "resale",
  reseller: "resale",
  check_market_value: "market_value",
  marketValue: "market_value",
  value: "market_value",
  owner_value: "market_value",
  generate_listing: "listing",
  sell: "listing",
  seller_listing: "listing"
};
const MAX_PHOTO_COUNT = 6;

let latestReport = null;
let latestSections = workflowConfigs[defaultWorkflow].sections;
let selectedPhotoFiles = [];
let pendingIdentityConfirmationToken = "";
let currentWorkflow = defaultWorkflow;
let activeItemSession = null;
let activeRequestId = 0;
let activeRequestController = null;
let activeAskRequestId = 0;
let activeAskRequestController = null;
let loadingProgressTimer = null;
let loadingProgressIndex = 0;
let reportRenderSequence = 0;

cameraInput.addEventListener("change", handleCameraPhotoChange);
photosInput.addEventListener("change", handleLibraryPhotoChange);
workflowInputs.forEach((input) => input.addEventListener("change", () => {
  applyWorkflowState({ clearOutput: true, abortRequests: true });
}));
purchaseContextInput.addEventListener("change", () => {
  const config = workflowConfigs[getSelectedWorkflow()] || workflowConfigs[defaultWorkflow];
  syncPurchaseContextFields(config);
});
useLocationButton.addEventListener("click", handleUseLocationClick);
retryLocationButton?.addEventListener("click", handleUseLocationClick);
manualZipButton?.addEventListener("click", handleManualZipClick);
skipLocationButton?.addEventListener("click", handleSkipLocationClick);
locationZipInput.addEventListener("input", handleManualZipInput);
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
  appendSelectedPhotoFiles(files);
  cameraInput.value = "";
  renderPhotoPreview();
}

function handleLibraryPhotoChange() {
  const files = Array.from(photosInput.files || []);
  appendSelectedPhotoFiles(files);
  photosInput.value = "";
  renderPhotoPreview();
}

function appendSelectedPhotoFiles(files) {
  const existingSignatures = new Set(selectedPhotoFiles.map(getPhotoFileSignature));
  const additions = [];

  for (const file of files) {
    if (selectedPhotoFiles.length + additions.length >= MAX_PHOTO_COUNT) {
      break;
    }
    const signature = getPhotoFileSignature(file);
    if (!signature || existingSignatures.has(signature)) {
      continue;
    }
    existingSignatures.add(signature);
    additions.push(file);
  }

  selectedPhotoFiles = [...selectedPhotoFiles, ...additions].slice(0, MAX_PHOTO_COUNT);
}

function getPhotoFileSignature(file) {
  if (!file) {
    return "";
  }
  return [
    file.name || "unnamed-photo",
    file.size || 0,
    file.lastModified || 0,
    file.type || "unknown-type"
  ].join("|");
}

function getSelectedPhotoFiles() {
  return selectedPhotoFiles.slice(0, MAX_PHOTO_COUNT);
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
  if (index >= 0 && index < selectedPhotoFiles.length) {
    selectedPhotoFiles.splice(index, 1);
  }
  photosInput.value = "";
  cameraInput.value = "";
  renderPhotoPreview();
}

async function handleSubmit(event) {
  event.preventDefault();

  const workflow = getSelectedWorkflow();
  const config = workflowConfigs[workflow];
  syncWorkflowFormState(config);
  const formData = new FormData(form);
  const platform = String(formData.get("platform") || "").trim();
  const rawNotes = String(formData.get("notes") || "").trim();
  const notes = buildWorkflowNotes(config, formData, rawNotes);

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

  const priceError = validateVisibleCurrencyFields(config, formData);
  if (priceError) {
    clearWorkflowOutput(config);
    setStatus(priceError, "error");
    return;
  }

  const buyerContextError = validateBuyerPurchaseContext(config, formData);
  if (buyerContextError) {
    clearWorkflowOutput(config);
    setStatus(buyerContextError, "error");
    return;
  }

  const photoFilesForRequest = getSelectedPhotoFiles();
  if (!photoFilesForRequest.length) {
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
  const submissionState = { stage: submissionStages.IDLE };
  setLoading(true, workflow);
  startLoadingProgress(config, request.id, workflow);

  try {
    setSubmissionStage(submissionState, submissionStages.PHOTO_READ);
    const photos = await preparePhotos(photoFilesForRequest, submissionState);
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
    } else if (config.workflow === "listing") {
      requestBody.sellerIntake = getBuyerIntake(formData, notes);
    }

    setSubmissionStage(submissionState, submissionStages.API_REQUEST);
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

    setSubmissionStage(submissionState, submissionStages.API_RESPONSE);
    let data;
    try {
      data = await response.json();
    } catch (error) {
      throw createSubmissionError("Could not read the analysis response.", submissionStages.API_RESPONSE, "api_response_parse_failed", error);
    }
    if (!response.ok) {
      if (data.action === "identity_confirmation_required") {
        pendingIdentityConfirmationToken = String(data.confirmation?.confirmationToken || "").trim();
        stopLoadingProgress();
        setLoading(false, workflow);
        renderIdentityConfirmationCard(data.confirmation || {}, config);
        setStatus("Confirm the item details before research continues.", "error");
        return;
      }
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
      photoCount: photoFilesForRequest.length,
      analysisId: request.analysisId
    });
    setOutputHeading(getDisplayConfig(config, report));
    setSubmissionStage(submissionState, submissionStages.REPORT_RENDER);
    try {
      renderReport(report, sections);
      renderAskPanel();
    } catch (error) {
      throw createSubmissionError("Could not display the analysis report.", submissionStages.REPORT_RENDER, "report_render_failed", error);
    }
    clearStatus();
    copyAllButton.disabled = false;
  } catch (error) {
    if (error.name === "AbortError" || !isCurrentRequest(request.id, workflow)) {
      return;
    }

    clearItemSession({ abortAsk: true });
    renderEmpty(config);
    setStatus(getFriendlyErrorMessage(error, config, submissionState), "error");
  } finally {
    if (isCurrentRequest(request.id, workflow)) {
      activeRequestController = null;
      setLoading(false, workflow);
    }
  }
}

function getSelectedWorkflow() {
  const selected = workflowInputs.find((input) => input.checked);
  return normalizeWorkflowValue(selected && selected.value);
}

function normalizeWorkflowValue(value) {
  const raw = String(value || "").trim();
  if (workflowConfigs[raw]) {
    return raw;
  }
  return legacyWorkflowMap[raw] || defaultWorkflow;
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
  purchaseContextInput.required = Boolean(config.showBuyerIntake && config.purchaseContextRequired);
  purchaseIntentInput.value = config.purchaseIntent;
  askingPriceLabel.textContent = config.priceLabel || "Price";
  askingPriceInput.placeholder = config.pricePlaceholder || "";
  askingPriceNote.textContent = config.priceNote || "";

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
  setWorkflowSectionState(purchaseContextControl, {
    visible: Boolean(config.showPurchaseContext),
    disabled: !config.showPurchaseContext
  });
  setWorkflowSectionState(askingPriceControl, {
    visible: Boolean(config.showPrice),
    disabled: !config.showPrice
  });
  setWorkflowSectionState(completenessControl, {
    visible: Boolean(config.showCompleteness),
    disabled: !config.showCompleteness
  });
  setWorkflowSectionState(ownerLocationFields, {
    visible: Boolean(config.showOwnerLocation),
    disabled: !config.showOwnerLocation
  });
  setWorkflowSectionState(sellerPreferencesFields, {
    visible: Boolean(config.showSellerPreferences),
    disabled: !config.showSellerPreferences
  });

  if (config.showBuyerIntake) {
    buyerIntakeEyebrow.textContent = config.buyerEyebrow || "Details";
    buyerIntakeTitle.textContent = config.buyerTitle;
    buyerIntakeHelper.textContent = config.buyerHelper || "Add what you know.";
  }

  syncPurchaseContextFields(config);
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

function syncPurchaseContextFields(config) {
  const showBuyerIntake = Boolean(config.showBuyerIntake);
  const context = String(purchaseContextInput.value || "").trim();
  const contextControlsVisible = showBuyerIntake && Boolean(config.showPurchaseContext);
  const retailSelected = contextControlsVisible && context === "retail_store";
  const namedContextSelected = contextControlsVisible && [
    "online_retailer",
    "facebook_marketplace",
    "ebay_etsy_mercari",
    "private_seller",
    "other"
  ].includes(context);

  setWorkflowSectionState(retailContextFields, {
    visible: retailSelected,
    disabled: !retailSelected
  });
  setWorkflowSectionState(contextNameFields, {
    visible: namedContextSelected,
    disabled: !namedContextSelected
  });

  storeNameInput.required = retailSelected;
  const locationResolvedForForm = Boolean(locationZipInput.value.trim() || locationAreaInput.value.trim() || /browser_location_(zip|general_area)|manual_zip|location_skipped/.test(locationModeInput.value));
  locationZipInput.required = retailSelected && !locationResolvedForForm;
  purchaseContextInput.required = Boolean(contextControlsVisible && config.purchaseContextRequired);

  if (!retailSelected) {
    storeNameInput.required = false;
    locationZipInput.required = false;
    locationStatus.textContent = "";
    locationModeInput.value = "";
    locationStateInput.value = locationStates.IDLE;
    locationPermissionInput.value = "";
    locationAreaInput.value = "";
    setLocationFallbackActions(false);
  }

  if (!namedContextSelected) {
    retailerOrMarketplaceInput.required = false;
    knownShippingAmountInput.required = false;
  }
}

function validateBuyerPurchaseContext(config, formData) {
  if (!config.showBuyerIntake) {
    return "";
  }

  const context = String(formData.get("purchase_context") || "").trim();
  if (config.purchaseContextRequired && !context) {
    return "Choose where you are buying this before continuing.";
  }

  if (context !== "retail_store") {
    return "";
  }

  const storeName = String(formData.get("store_name") || "").trim();
  const zip = String(formData.get("location_zip") || "").trim();
  const locationMode = String(formData.get("location_mode") || "").trim();
  const locationState = String(formData.get("location_state") || "").trim();
  const locationPermission = String(formData.get("location_permission") || "").trim();
  const locationArea = String(formData.get("location_area") || "").trim();

  if (!storeName) {
    return "Enter the store name before checking a retail-store purchase.";
  }

  const locationResolved = Boolean(zip || locationArea || /browser_location_(zip|general_area)|manual_zip/.test(locationMode) || /zip-resolved|general-area-resolved|manual-ZIP/.test(locationState));
  const locationFallbackAcknowledged = /location_(denied|unavailable|timeout|unsupported|skipped)|reverse_geocode_failed|insecure_context/.test(`${locationMode} ${locationPermission}`)
    || /permission-denied|position-unavailable|timeout|unsupported|insecure-context|reverse-geocode-failed|skipped/.test(locationState);
  if (!locationResolved && !locationFallbackAcknowledged) {
    return "Enter a ZIP code or tap Use My Location before checking nearby retail prices.";
  }

  return "";
}

function validateVisibleCurrencyFields(config, formData) {
  const fields = [
    { visible: Boolean(config.showPrice), name: "asking_price", label: config.priceLabel || "Price" },
    { visible: !knownShippingAmountInput.disabled, name: "known_shipping_amount", label: "Shipping amount" }
  ];

  for (const field of fields) {
    const value = String(formData.get(field.name) || "").trim();
    if (!field.visible || !value || /free|pickup|included|unknown|not sure/i.test(value)) {
      continue;
    }
    if (parseCurrencyCentsFromText(value) === null) {
      return `${field.label} must include a valid nonnegative amount, such as 5.50 or $1,199.95.`;
    }
  }

  return "";
}

function parseCurrencyCentsFromText(value) {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }
  const match = text.match(/(?:^|[^\d])(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)(?:[^\d]|$)/);
  if (!match) {
    return null;
  }
  const normalized = match[1].replace(/,/g, "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }
  return Math.round(amount * 100);
}

function formatIntakeLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function buildWorkflowNotes(config, formData, rawNotes) {
  const structured = [];
  const add = (label, name) => {
    const value = String(formData.get(name) || "").trim();
    if (value) {
      structured.push(`${label}: ${formatIntakeLabel(value)}`);
    }
  };

  if (config.workflow === "market_value") {
    add("Completeness", "item_completeness");
    add("Owner ZIP", "owner_location_zip");
  }

  if (config.workflow === "listing") {
    add("Condition", "item_condition");
    add("Completeness", "item_completeness");
    add("Pickup or shipping", "fulfillment_preference");
    add("Selling speed", "selling_speed");
    add("Preferred marketplace", "platform");
  }

  return [rawNotes, ...structured].filter(Boolean).join("\n");
}

async function handleUseLocationClick() {
  const isLocalSession = ["localhost", "127.0.0.1"].includes(location.hostname);
  if (!window.isSecureContext && !isLocalSession) {
    applyLocationFallback({
      state: locationStates.INSECURE_CONTEXT,
      mode: "insecure_context",
      permission: "unavailable",
      message: "Location services require a secure browser connection. Enter a ZIP code.",
      showActions: true,
      allowRetry: false
    });
    return;
  }

  if (!navigator.geolocation) {
    applyLocationFallback({
      state: locationStates.UNSUPPORTED,
      mode: "location_unsupported",
      permission: "unsupported",
      message: "Location services are not supported in this browser. Enter a ZIP code.",
      showActions: true,
      allowRetry: false
    });
    return;
  }

  setLocationButtonBusy(true);
  setLocationState(locationStates.REQUESTING, {
    mode: "browser_location_pending",
    permission: "prompt",
    message: "Requesting location permission..."
  });
  locationPermissionInput.value = "prompt";
  locationAreaInput.value = "";
  setLocationFallbackActions(false);

  try {
    const position = await getCurrentBrowserPosition();
    setLocationState(locationStates.REQUESTING, {
      mode: "browser_location_resolving",
      permission: "granted",
      message: "Location found. Finding your general area..."
    });
    const area = await reverseGeocodePosition(position);
    if (area.zip) {
      locationFailureCount = 0;
      locationZipInput.value = area.zip;
      locationAreaInput.value = area.label;
      setLocationState(locationStates.ZIP_RESOLVED, {
        mode: "browser_location_zip",
        permission: "granted",
        message: `Location found: ${area.label}. Precise coordinates are not stored or displayed.`
      });
    } else if (area.label) {
      locationFailureCount = 0;
      locationAreaInput.value = area.label;
      setLocationState(locationStates.GENERAL_AREA_RESOLVED, {
        mode: "browser_location_general_area",
        permission: "granted",
        message: `General area found: ${area.label}. Enter ZIP for more precise local pricing. Precise coordinates are not stored or displayed.`
      });
    } else {
      locationFailureCount += 1;
      applyLocationFallback({
        state: locationStates.REVERSE_GEOCODE_FAILED,
        mode: "reverse_geocode_failed",
        permission: "granted",
        message: "Your general area was found, but the ZIP code could not be confirmed. Enter the ZIP for more precise local pricing.",
        showActions: true,
        allowRetry: locationFailureCount < 2
      });
      return;
    }
  } catch (error) {
    handleLocationError(error);
  } finally {
    setLocationButtonBusy(false);
    syncPurchaseContextFields(workflowConfigs[getSelectedWorkflow()] || workflowConfigs[defaultWorkflow]);
  }
}

function getCurrentBrowserPosition() {
  return new Promise((resolve, reject) => {
    try {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 15 * 60 * 1000
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function reverseGeocodePosition(position) {
  const latitude = Number(position?.coords?.latitude);
  const longitude = Number(position?.coords?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("reverse_geocode_failed");
  }

  const roundedLatitude = Math.round(latitude * 1000) / 1000;
  const roundedLongitude = Math.round(longitude * 1000) / 1000;
  const response = await fetch("/api/reverse-geocode", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      latitude: roundedLatitude,
      longitude: roundedLongitude
    }),
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("reverse_geocode_failed");
  }
  const data = await response.json();
  const zip = String(data.zip || "").match(/\b\d{5}(?:-\d{4})?\b/)?.[0] || "";
  const label = String(data.label || [data.city, data.state, zip].filter(Boolean).join(" ")).trim();
  return { zip, label: label || zip };
}

function handleLocationError(error) {
  locationFailureCount += 1;
  const allowRetry = locationFailureCount < 2;
  const code = Number(error?.code || 0);
  if (code === 1) {
    applyLocationFallback({
      state: locationStates.PERMISSION_DENIED,
      mode: "location_denied",
      permission: "denied",
      message: "Location access was not granted. Enable location for this browser and site, or enter a ZIP code.",
      showActions: true,
      allowRetry
    });
    return;
  }
  if (code === 2) {
    applyLocationFallback({
      state: locationStates.POSITION_UNAVAILABLE,
      mode: "location_unavailable",
      permission: "unavailable",
      message: "Your location could not be determined. Try again or enter a ZIP code.",
      showActions: true,
      allowRetry
    });
    return;
  }
  if (code === 3) {
    applyLocationFallback({
      state: locationStates.TIMEOUT,
      mode: "location_timeout",
      permission: "timeout",
      message: "Location lookup timed out. Try again or enter a ZIP code.",
      showActions: true,
      allowRetry
    });
    return;
  }
  if (String(error?.message || "").includes("reverse_geocode_failed")) {
    applyLocationFallback({
      state: locationStates.REVERSE_GEOCODE_FAILED,
      mode: "reverse_geocode_failed",
      permission: "granted",
      message: "Your location was found, but Katherine’s Eye could not determine the ZIP code. Enter the ZIP manually.",
      showActions: true,
      allowRetry
    });
    return;
  }
  applyLocationFallback({
    state: locationStates.POSITION_UNAVAILABLE,
    mode: "location_unavailable",
    permission: "unavailable",
    message: "Your location could not be determined. Try again or enter a ZIP code.",
    showActions: true,
    allowRetry
  });
}

function setLocationState(state, { mode = "", permission = "", message = "" } = {}) {
  locationStateInput.value = state || locationStates.IDLE;
  locationModeInput.value = mode;
  locationPermissionInput.value = permission;
  if (message) {
    locationStatus.textContent = message;
  }
}

function applyLocationFallback({ state, mode, permission, message, showActions = false, allowRetry = true }) {
  setLocationState(state, { mode, permission, message });
  locationAreaInput.value = "";
  locationStatus.textContent = `${message} Enter ZIP manually to use the same local retail search path.`;
  setLocationFallbackActions(showActions, { allowRetry });
  syncPurchaseContextFields(workflowConfigs[getSelectedWorkflow()] || workflowConfigs[defaultWorkflow]);
}

function handleManualZipClick() {
  locationFailureCount = 0;
  locationZipInput.focus();
  setLocationState(locationStates.MANUAL_ZIP, {
    mode: "manual_zip",
    permission: locationPermissionInput.value || "manual",
    message: "Enter ZIP manually for more precise local pricing."
  });
  setLocationFallbackActions(false);
  syncPurchaseContextFields(workflowConfigs[getSelectedWorkflow()] || workflowConfigs[defaultWorkflow]);
}

function handleSkipLocationClick() {
  locationFailureCount = 0;
  locationZipInput.value = "";
  locationAreaInput.value = "";
  setLocationState(locationStates.SKIPPED, {
    mode: "location_skipped",
    permission: locationPermissionInput.value || "skipped",
    message: "Local prices and nearby availability will not be checked."
  });
  setLocationFallbackActions(false);
  syncPurchaseContextFields(workflowConfigs[getSelectedWorkflow()] || workflowConfigs[defaultWorkflow]);
}

function handleManualZipInput() {
  if (!locationZipInput.value.trim()) {
    if (locationStateInput.value === locationStates.MANUAL_ZIP || locationModeInput.value === "manual_zip") {
      setLocationState(locationStates.IDLE, { mode: "", permission: "", message: "" });
      locationStatus.textContent = "";
    }
    syncPurchaseContextFields(workflowConfigs[getSelectedWorkflow()] || workflowConfigs[defaultWorkflow]);
    return;
  }

  locationAreaInput.value = "";
  locationFailureCount = 0;
  setLocationState(locationStates.MANUAL_ZIP, {
    mode: "manual_zip",
    permission: "manual",
    message: "Manual ZIP entered for local pricing context."
  });
  setLocationFallbackActions(false);
  syncPurchaseContextFields(workflowConfigs[getSelectedWorkflow()] || workflowConfigs[defaultWorkflow]);
}

function setLocationFallbackActions(visible, { allowRetry = true } = {}) {
  if (!locationFallbackActions) {
    return;
  }
  locationFallbackActions.hidden = !visible;
  if (retryLocationButton) {
    retryLocationButton.hidden = !visible || !allowRetry;
  }
  if (manualZipButton) {
    manualZipButton.hidden = !visible;
  }
  if (skipLocationButton) {
    skipLocationButton.hidden = !visible;
  }
}

function setLocationButtonBusy(isBusy) {
  useLocationButton.disabled = isBusy;
  useLocationButton.textContent = isBusy ? "Finding Location..." : "Use My Location";
}

function clearWorkflowOutput(config) {
  latestReport = null;
  latestSections = config.sections;
  pendingIdentityConfirmationToken = "";
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
    : config.workflow === "listing"
      ? {
          ...getBuyerIntake(formData, notes),
          purchase_intent: "seller_listing"
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
    "itemIdentificationEvidence",
    "referenceResults",
    "weakMatches",
    "rejectedMatches",
    "searchLimitations",
    "referenceRangeBasis",
    "searchDiagnostics",
    "researchResults",
    "comparableQuality",
    "purchaseContextSummary",
    "retailEvidenceMode",
    "retailRouteClassification",
    "retailPurchaseDecision",
    "askingStorePrice",
    "currentRetailPriceAssessment",
    "namedStoreResult",
    "bestCurrentRetailAlternative",
    "otherCurrentRetailPrices",
    "packageUnitPriceComparison",
    "localAvailabilityContext",
    "retailPriceLimit",
    "barcodeSearchStatus",
    "localStoreContext",
    "retailPriceContext",
    "packageUnitPriceContext",
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
  selectedPhotoFiles = [];
  photosInput.value = "";
  cameraInput.value = "";
  itemCompletenessInput.value = "";
  ownerLocationZipInput.value = "";
  fulfillmentPreferenceInput.value = "";
  sellingSpeedInput.value = "";
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
    store_name: getValue("store_name"),
    location_zip: getValue("location_zip"),
    location_mode: getValue("location_mode"),
    location_state: getValue("location_state"),
    location_permission: getValue("location_permission"),
    location_area: getValue("location_area"),
    owner_location_zip: getValue("owner_location_zip"),
    retailer_or_marketplace_name: getValue("retailer_or_marketplace_name"),
    known_shipping_amount: getValue("known_shipping_amount"),
    identity_confirmation: pendingIdentityConfirmationToken,
    item_condition: getValue("item_condition"),
    item_completeness: getValue("item_completeness"),
    fulfillment_preference: getValue("fulfillment_preference"),
    selling_speed: getValue("selling_speed"),
    condition_concerns: formData.getAll("condition_concerns").map((value) => String(value || "").trim()).filter(Boolean),
    item_name: getValue("item_name"),
    known_brand: getValue("known_brand"),
    known_manufacturer: getValue("known_manufacturer"),
    known_model: getValue("known_model"),
    known_sku: getValue("known_sku"),
    known_upc: getValue("known_upc"),
    approximate_age_era: getValue("approximate_age_era"),
    buyer_notes: notes,
    asking_price_cents: parseCurrencyCentsFromText(getValue("asking_price")),
    known_shipping_amount_cents: parseCurrencyCentsFromText(getValue("known_shipping_amount"))
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
      eyebrow: "Personal-Use Buying Decision",
      title: "Buying for Myself"
    };
  }

  return config;
}

function isConsumerReport(report) {
  return String(report && report.buyerIntent || "").toLowerCase() === "personal_use";
}

function isCurrentRetailOnlyReport(report) {
  return String(report && report.retailEvidenceMode || "").toLowerCase() === "current-retail-only";
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

  if (classified.state === "current_asking") {
    normalized.currentAskingPriceRange = firstNonEmpty(
      report.currentAskingPriceRange,
      `${classified.range} based on ${supportingResultCount} visible active exact/strong asking-price result${supportingResultCount === 1 ? "" : "s"}; this is not verified fair market value because qualified sold evidence was not available.`
    );
    normalized.referenceRangeBasis = firstNonEmpty(
      report.referenceRangeBasis,
      `${supportingResultCount} visible supporting result${supportingResultCount === 1 ? "" : "s"} and ${visibleResultCount} total search result${visibleResultCount === 1 ? "" : "s"} are visible in Research Details.`
    );
    normalized.fairValueNotEstablished = "";
    normalized.estimatedFairMarketValue = "";
    normalized.estimatedMarketValue = "";
    normalized.fairPriceRange = [];
    normalized.whatThisMeans = firstNonEmpty(report.whatThisMeans, "The active asking range is directionally useful, but it is not verified fair market value because no qualified sold evidence established a sold range.");
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
  const retailContext = isRetailStoreReport(report);
  const safeExplanation = askingPrice
    ? `At ${askingPrice}, this may be a reasonable personal-use purchase only because the financial exposure is limited and the item appears identifiable from the submitted evidence. The current search did not return visible source-backed comparable evidence, so market value was not established.`
    : "The current search did not return visible source-backed comparable evidence. Fair value is not established.";
  const retailExplanation = askingPrice
    ? `At ${askingPrice}, the current retail price was not verified against source-backed current-retail comparisons. The financial exposure may be limited, but Katherine’s Eye did not confirm this is a good deal.`
    : "The current retail price was not verified against source-backed current-retail comparisons.";
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
    valueRating: retailContext ? "Price Not Verified - Low Financial Risk" : "Insufficient Evidence",
    recommendation: retailContext ? firstNonEmpty(report.recommendation, "Low-Risk Purchase - Limited Evidence") : report.recommendation,
    whatThisMeans: retailContext ? retailExplanation : "The current search did not return visible source-backed comparable evidence. Fair value is not established.",
    priceBasis: retailContext
      ? "Price not verified - the current search did not return source-backed current-retail comparisons."
      : "Fair value not established - the current search did not return visible source-backed comparable evidence.",
    currentPriceAssessment: retailContext
      ? "Price Not Verified - no source-backed current-retail comparison is supported."
      : "Insufficient evidence - no source-backed market comparison is supported.",
    pricingRationale: retailContext ? retailExplanation : safeExplanation,
    cautiousBuyExplanation: /personal/i.test(firstNonEmpty(report.buyerIntent, workflow)) ? (retailContext ? retailExplanation : safeExplanation) : "",
    consumerDownsideRisk: askingPrice ? `Only the asking price (${askingPrice}) is available for a limited-downside personal-use assessment.` : report.consumerDownsideRisk
  };

  return sanitizeFrontendZeroEvidenceText(guarded, askingPrice);
}

function isRetailStoreReport(report = {}) {
  const text = [
    report.purchaseContextSummary,
    report.localStoreContext,
    report.retailPriceContext,
    report.searchCoverage,
    report.priceBasis,
    report.currentPriceAssessment
  ].flat().map((item) => normalizeDisplayValue(item)).join(" ").toLowerCase();
  return /\bretail store\b|store name|local store context|current retail|nearby retail|barcode\/upc/i.test(text);
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
  const unsupported = /reference center|market range|median market|market low|market high|active asking range|sold range|price-to-market|below[- ]market|below inferred|inferred fair|estimated fair market|fair market value|market suggests|visible market evidence|typical market|derived market|comparable evidence appears useful enough/i.test(text);
  const range = /\$\s*\d[\d,]*(?:\.\d{1,2})?\s*(?:-|to|â€“|â€”)\s*\$?\s*\d[\d,]*(?:\.\d{1,2})?/.test(text);
  const askingAmount = extractMoneyAmountsFromText(askingPrice)[0];
  const amounts = extractMoneyAmountsFromText(text);
  const askingCents = moneyToCents(askingAmount);
  const nonAskingMoney = amounts.some((amount) => !Number.isFinite(askingCents) || moneyToCents(amount) !== askingCents);
  if (unsupported || range || (nonAskingMoney && /\bmarket|value|range|reference|asking|sold|price|below|above\b/i.test(text))) {
    return "The current search did not return visible source-backed comparable evidence. Fair value is not established.";
  }
  return text;
}

function classifyValuationEvidenceForDisplay(report = {}) {
  const state = String(report.valuationEvidenceState || "").toLowerCase();
  const explicitLabel = String(report.valuationEvidenceLabel || "").trim();
  const directRange = normalizeMoneyText(firstNonEmpty(report.verifiedMarketRange, report.currentAskingPriceRange, report.preliminaryReferenceRange, report.estimatedFairMarketValue, report.estimatedMarketValue, report.aiOnlyRoughValueRange, report.expectedSalePrice, report.suggestedListingPrice));
  if (state === "supported") {
    return {
      state: "supported",
      label: explicitLabel || "Verified Market Range",
      range: directRange,
      explanation: firstNonEmpty(report.valuationEvidenceExplanation, "Qualified verified sold exact or strong comparable evidence supports this value.")
    };
  }
  if (state === "current_asking") {
    return {
      state: "current_asking",
      label: explicitLabel || "Current Asking-Price Range",
      range: directRange,
      explanation: firstNonEmpty(report.valuationEvidenceExplanation, "Active exact or strong asking-price evidence supports this current asking range; it is not verified fair market value.")
    };
  }
  if (state === "preliminary") {
    return {
      state: "preliminary",
      label: explicitLabel || "Preliminary Reference Range",
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
    report.verifiedMarketRange,
    report.currentAskingPriceRange,
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
    report.itemIdentificationEvidence,
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
  ].flat().filter((item) => isUsableSourceRecord(item) && !/no usable price|identity\/reference|reference without price/i.test(normalizeDisplayValue(item))).length;
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
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    return "";
  }
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function moneyToCents(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

async function preparePhotos(photoFiles = getSelectedPhotoFiles(), submissionState = null) {
  const photos = [];

  for (const file of photoFiles) {
    photos.push({
      name: file.name,
      dataUrl: await resizeImage(file, submissionState)
    });
  }

  return photos;
}

function renderReport(report, sections) {
  stopLoadingProgress();
  setReportActionsVisible(true);
  const renderId = `report-${++reportRenderSequence}`;
  results.className = "results";
  results.dataset.currentReportId = renderId;

  const reportRoot = document.createElement("div");
  reportRoot.className = "report-root";
  reportRoot.dataset.reportId = renderId;

  if (isConsumerReport(report)) {
    reportRoot.appendChild(renderConsumerCompactSummary(report, currentWorkflow));
    reportRoot.appendChild(renderCustomerTechnicalSearchDetails(report));
    appendEndOfReport(reportRoot);
    results.replaceChildren(reportRoot);
    return;
  }

  reportRoot.appendChild(renderExecutiveSummary(report, currentWorkflow));

  const whyCards = buildSectionCards(report, sections, isWhySection);
  const whyGroup = renderReportGroup({
    title: "Why This Recommendation",
    helper: "The main reasons, confidence, risks, and evidence.",
    open: true,
    children: whyCards.length ? whyCards : [renderPlainInsight("Why this result?", getBestWhyText(report))]
  });
  reportRoot.appendChild(whyGroup);

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
  reportRoot.appendChild(renderReportGroup({
    title: researchResultCount ? `Research Details - ${researchResultCount} visible records` : "Research Details",
    helper: researchResultCount
      ? "Visible source records, comparable classification, rejection reasons, and limits."
      : "Visual evidence, source coverage, comparable quality, price rationale, and limits.",
    open: false,
    children: researchChildren
  }));

  reportRoot.appendChild(renderAppraiserSummary(report, currentWorkflow));
  appendEndOfReport(reportRoot);
  results.replaceChildren(reportRoot);
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
    "itemIdentificationEvidence",
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
  title.textContent = "Evidence Found";
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
    ["Source Coverage", normalizeArray(report.sourcesSearched).length ? report.sourcesSearched : report.searchCoverage],
    ["Item Identification Evidence", report.itemIdentificationEvidence],
    ["Price Range Analysis", report.priceRangeAnalysis],
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
    if (label === "Technical Search Details") {
      subsection.classList.add("technical-search-details");
      subsection.append(heading, renderTechnicalSearchDetails(value));
    } else {
      subsection.append(heading, renderValue(value));
    }
    body.appendChild(subsection);
  });

  card.append(header, body);
  return card;
}

function renderCustomerTechnicalSearchDetails(report) {
  const details = document.createElement("details");
  details.className = "technical-details-disclosure technical-report-disclosure";

  const summary = document.createElement("summary");
  summary.className = "technical-details-summary";
  summary.textContent = "Technical Search Details";

  const body = document.createElement("div");
  body.className = "search-diagnostics customer-technical-body";

  [
    ["Search Queries Used", report.searchQueriesUsed],
    ["Source Coverage", normalizeArray(report.sourcesSearched).length ? report.sourcesSearched : report.searchCoverage],
    ["Item Identification Evidence", report.itemIdentificationEvidence],
    ["Strong Comparables", report.strongComparables],
    ["Partial Comparables", report.partialComparables],
    ["Reference Results", report.referenceResults],
    ["Weak or Rejected Matches", [...normalizeArray(report.weakMatches), ...normalizeArray(report.rejectedMatches)]],
    ["Search Limitations", report.searchLimitations],
    ["Reference Range Basis", report.referenceRangeBasis],
    ["Pricing Outliers Excluded", report.pricingOutliersExcluded],
    ["Full Search Diagnostics", report.searchDiagnostics]
  ].forEach(([label, value]) => {
    if (!shouldRenderSection(label, value)) {
      return;
    }
    const section = document.createElement("section");
    section.className = "technical-report-section";
    const heading = document.createElement("h4");
    heading.textContent = label;
    section.append(heading, label === "Full Search Diagnostics" ? renderSearchDiagnostics(value) : renderValue(value));
    body.appendChild(section);
  });

  details.append(summary, body);
  return details;
}

function renderTechnicalSearchDetails(value) {
  const details = document.createElement("details");
  details.className = "technical-details-disclosure";
  const summary = document.createElement("summary");
  summary.className = "technical-details-summary";
  summary.textContent = "Show Technical Search Details";
  details.append(summary, renderSearchDiagnostics(value));
  return details;
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
    ["Search Provider Used", diagnostics.searchProviderUsed || diagnostics.sourcesActuallyQueried],
    ["Source Categories Targeted", diagnostics.sourceCategoriesTargeted || diagnostics.sourcesRequested],
    ["Canonical Product Identity", diagnostics.canonicalProductIdentity],
    ["Finalized Search Identity", diagnostics.finalizedSearchIdentity],
    ["Canonical Identity Confidence", diagnostics.canonicalIdentityConfidence],
    ["Conflicting Candidates Rejected", diagnostics.conflictingCandidatesRejected],
    ["Barcode Integrity", diagnostics.barcodeIntegrity],
    ["Canonical Retail Identity", diagnostics.canonicalRetailIdentity],
    ["Retail Query Integrity", diagnostics.retailQueryIntegrity],
    ["Unsupported Query Terms Rejected", diagnostics.unsupportedQueryTermsRejected],
    ["Purchase Context", diagnostics.purchaseContext],
    ["Store Name", diagnostics.storeName],
    ["Location Mode Used", diagnostics.locationModeUsed],
    ["Location State", diagnostics.locationStateUsed],
    ["Location Lookup Outcome", diagnostics.locationLookupOutcome],
    ["ZIP Present", diagnostics.zipPresence],
    ["Barcode Extraction Status", diagnostics.barcodeExtractionStatus],
    ["Exact Barcode Digits Used", diagnostics.exactBarcodeDigitsUsed],
    ["Retail-Specific Queries", diagnostics.retailSpecificQueries],
    ["Named Store Query Results", diagnostics.namedStoreQueryResults],
    ["Pack-Size Match Details", diagnostics.packSizeMatchDetails],
    ["Rejected Pack-Size Mismatches", diagnostics.rejectedPackSizeMismatches],
    ["Local Source Coverage", diagnostics.localSourceCoverage],
    ["Allowed Domains Requested", diagnostics.allowedDomainsRequested],
    ["Domains Actually Returned", diagnostics.domainsActuallyReturned || diagnostics.sourcesReturned],
    ["Provider Calls Attempted", diagnostics.providerCallsAttempted],
    ["Provider Calls Succeeded", diagnostics.providerCallsSucceeded],
    ["Serper Configured", diagnostics.serperConfigured === undefined ? "" : diagnostics.serperConfigured ? "Yes" : "No"],
    ["Fallback Provider Used", diagnostics.fallbackProviderUsed === undefined ? "" : diagnostics.fallbackProviderUsed ? "Yes" : "No"],
    ["Serper Calls Attempted", diagnostics.serperCallsAttempted],
    ["Serper Calls Succeeded", diagnostics.serperCallsSucceeded],
    ["Barcode Integrity", diagnostics.barcodeIntegrity],
    ["Canonical Retail Identity", diagnostics.canonicalRetailIdentity],
    ["Retail Evidence Mode", diagnostics.retailEvidenceMode],
    ["Retail Route Classification", diagnostics.retailRouteClassification],
    ["Retail Provider Call Budget", diagnostics.retailProviderCallBudget],
    ["Retail Recovery Trigger", diagnostics.retailRecoveryTrigger],
    ["Retail Stages Planned", diagnostics.retailStagesPlanned],
    ["Retail Stages Attempted", diagnostics.retailStagesAttempted],
    ["Retail Queries Planned", diagnostics.retailQueriesPlanned],
    ["Retail Queries Executed", diagnostics.retailQueriesExecuted],
    ["Location-Aware Retail Search Status", diagnostics.locationAwareRetailSearchStatus],
    ["Local Retail Queries Attempted", diagnostics.localRetailQueriesAttempted],
    ["Shopping Execution Status", diagnostics.shoppingExecutionStatus],
    ["Shopping Endpoint Attempted", diagnostics.shoppingEndpointAttempted],
    ["Shopping Endpoint Unavailable", diagnostics.shoppingEndpointUnavailable],
    ["Retail Provider Calls Used", diagnostics.retailProviderCallsUsed],
    ["Retail Search Budget Remaining", diagnostics.retailSearchBudgetRemaining],
    ["Retail Recovery Stopped Reason", diagnostics.retailRecoveryStoppedReason],
    ["Queries Suppressed", diagnostics.queriesSuppressed],
    ["Customer-Facing Retail Evidence Count", diagnostics.customerFacingRetailEvidenceCount],
    ["Records With Visible Prices", diagnostics.recordsWithVisiblePrices],
    ["Records Rejected Before Compatibility Review", diagnostics.recordsRejectedBeforeCompatibilityReview],
    ["Records Rejected By Compatibility Review", diagnostics.recordsRejectedByCompatibilityReview],
    ["Compatible Alternatives Accepted", diagnostics.compatibleAlternativesAccepted],
    ["Zero-Result Identity Recovery Triggered", diagnostics.zeroResultIdentityRecoveryTriggered],
    ["Exact Retail Match Count", diagnostics.exactRetailMatchCount],
    ["Strong Retail Alternative Count", diagnostics.strongRetailAlternativeCount],
    ["Unit-Price Comparable Count", diagnostics.unitPriceComparableCount],
    ["Retail Category Context Count", diagnostics.retailCategoryContextCount],
    ["Rejected Retail Mismatch Count", diagnostics.rejectedRetailMismatchCount],
    ["Retail Rejection Reasons", diagnostics.retailRejectionReasons],
    ["Current Retail Candidates Accepted", diagnostics.currentRetailCandidatesAccepted],
    ["Customer Price Eligible Retail Candidates", diagnostics.customerPriceEligibleRetailCandidateCount],
    ["Current Retail Candidates Rejected", diagnostics.currentRetailCandidatesRejected],
    ["Reference/Secondary Evidence Excluded From Retail Decision", diagnostics.referenceSecondaryEvidenceExcludedFromRetailDecision],
    ["Manual ZIP Used", diagnostics.manualZipUsed],
    ["Location State", diagnostics.locationStateUsed],
    ["Location Lookup Outcome", diagnostics.locationLookupOutcome],
    ["Browser Coordinates Displayed", diagnostics.browserCoordinatesDisplayed],
    ["Provider Sources Returned", diagnostics.providerSourceCount],
    ["Organic Results Returned", diagnostics.organicResultCount],
    ["Shopping Results Returned", diagnostics.shoppingResultCount],
    ["Structured Candidates Created", diagnostics.parsedCandidateCount ?? diagnostics.parsedResultCount],
    ["Normalized Candidates", diagnostics.normalizedCandidateCount ?? diagnostics.normalizedResultCount],
    ["Unique Candidates", diagnostics.deduplicatedCandidateCount ?? diagnostics.deduplicatedResultCount],
    ["Visible Comparable Records Retained", diagnostics.retainedVisibleResultCount],
    ["Priced Candidates Returned", diagnostics.pricedCandidateCount],
    ["Compatible Priced Candidates", diagnostics.compatiblePricedCandidateCount],
    ["No-Price Identity References", diagnostics.noPriceIdentityReferenceCount],
    ["Rejected Mismatches", diagnostics.rejectedMismatchCount],
    ["Compatible Priced Recovery Threshold", diagnostics.compatiblePricedRecoveryThreshold],
    ["Recovery Search Passes Attempted", diagnostics.recoverySearchPassesAttempted],
    ["Rejected Candidates", diagnostics.rejectedCandidateCount ?? diagnostics.rejectedResultCount],
    ["Acquisition Failure Stage", diagnostics.acquisitionFailureStage]
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
    const attemptedRecords = records.filter(isAttemptedDiagnosticRecord);
    const rejectedRecords = records.filter((record) => !isAttemptedDiagnosticRecord(record));
    const title = document.createElement("h5");
    title.textContent = "Search Query Diagnostics";
    wrapper.appendChild(title);

    const controls = document.createElement("div");
    controls.className = "query-diagnostic-controls";
    const toggleDetails = document.createElement("button");
    toggleDetails.className = "query-diagnostic-toggle";
    toggleDetails.type = "button";
    toggleDetails.textContent = "Show all details";
    toggleDetails.addEventListener("click", () => toggleAllQueryDetails(wrapper, toggleDetails));
    controls.appendChild(toggleDetails);
    wrapper.appendChild(controls);

    if (attemptedRecords.length) {
      wrapper.appendChild(renderQueryDiagnosticList(attemptedRecords));
    }

    if (rejectedRecords.length) {
      wrapper.appendChild(renderRejectedQuerySummary(rejectedRecords));
      const rejectedDisclosure = document.createElement("details");
      rejectedDisclosure.className = "rejected-query-disclosure";
      const rejectedSummary = document.createElement("summary");
      rejectedSummary.textContent = `Show rejected queries (${rejectedRecords.length})`;
      rejectedDisclosure.append(rejectedSummary, renderQueryDiagnosticList(rejectedRecords, "rejected"));
      wrapper.appendChild(rejectedDisclosure);
    }
  }

  if (Array.isArray(diagnostics.droppedResultReasons) && diagnostics.droppedResultReasons.length) {
    const title = document.createElement("h5");
    title.textContent = "Top Rejection Reasons";
    wrapper.append(title, renderValue(diagnostics.droppedResultReasons.map((item) => `${item.reason}: ${item.count}`)));
  }

  return wrapper;
}

function renderQueryDiagnosticList(records, modifier = "") {
  const rows = document.createElement("div");
  rows.className = ["query-diagnostic-list", modifier && `is-${modifier}`].filter(Boolean).join(" ");
  records.forEach((item) => rows.appendChild(renderQueryDiagnosticCard(item)));
  return rows;
}

function isAttemptedDiagnosticRecord(item) {
  return Boolean(item?.attempted ?? item?.requestAttempted);
}

function renderRejectedQuerySummary(records) {
  const wrapper = document.createElement("div");
  wrapper.className = "rejected-query-summary";
  const title = document.createElement("p");
  title.textContent = `${records.length} rejected quer${records.length === 1 ? "y" : "ies"} blocked before provider calls.`;
  const list = document.createElement("ul");
  const reasonCounts = new Map();
  records.forEach((record) => {
    const reason = cleanDiagnosticText(record.validationFailureReason || record.failureStage || record.primaryRejectionStageOrReason || "not recorded");
    reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
  });
  [...reasonCounts.entries()].forEach(([reason, count]) => {
    const item = document.createElement("li");
    item.textContent = `${count}: ${reason}`;
    list.appendChild(item);
  });
  wrapper.append(title, list);
  return wrapper;
}

function toggleAllQueryDetails(wrapper, button) {
  const queryDetails = Array.from(wrapper.querySelectorAll("details.query-diagnostic-row"));
  const rejectedDisclosure = wrapper.querySelector("details.rejected-query-disclosure");
  const shouldOpen = queryDetails.some((details) => !details.open);
  if (rejectedDisclosure) {
    rejectedDisclosure.open = shouldOpen;
  }
  queryDetails.forEach((details) => {
    details.open = shouldOpen;
  });
  button.textContent = shouldOpen ? "Hide all details" : "Show all details";
  button.setAttribute("aria-pressed", shouldOpen ? "true" : "false");
}

function renderQueryDiagnosticCard(item) {
  const row = document.createElement("details");
  row.className = `query-diagnostic-row ${isAttemptedDiagnosticRecord(item) ? "is-attempted" : "is-rejected"}`;
  const summary = document.createElement("summary");
  summary.className = "query-diagnostic-summary";
  const query = document.createElement("span");
  query.className = "query-diagnostic-query";
  query.textContent = cleanDiagnosticText(item.finalQuery || item.query || "Query not supplied");
  const meta = document.createElement("span");
  meta.className = "query-diagnostic-meta";
  meta.textContent = [
    isAttemptedDiagnosticRecord(item) ? "Attempted" : "Rejected",
    item.retailStageLabel || item.retailStage,
    formatSearchPass(item.searchPass) || "search pass not recorded",
    item.validationPassed === false ? cleanDiagnosticText(item.validationFailureReason || "invalid query preflight") : ""
  ].filter(Boolean).join(" - ");
  summary.append(query, meta);
  const facts = document.createElement("dl");
  facts.className = "query-diagnostic-facts";
  [
    ["Raw Candidate", item.rawCandidate],
    ["Candidate Origin", item.candidateOrigin],
    ["Normalized Candidate", item.normalizedCandidate],
    ["Final Query", item.finalQuery || item.query],
    ["Validation", item.validationPassed === false ? "Rejected before provider call" : "Passed"],
    ["Validation Reason", item.validationFailureReason],
    ["Provider", item.provider || item.source],
    ["Retail Stage", item.retailStageLabel || item.retailStage],
    ["Retail Budget Bucket", item.retailBudgetBucket],
    ["Search Pass", formatSearchPass(item.searchPass)],
    ["Allowed Domains", item.allowedDomainsRequested || item.allowedDomains],
    ["Marketplace Domains", item.marketplaceDomainsRequested],
    ["Attempted", (item.attempted ?? item.requestAttempted) ? "Yes" : "No"],
    ["Succeeded", (item.succeeded ?? item.requestSucceeded) ? "Yes" : "No"],
    ["Provider Sources Returned", item.providerSourceCount ?? item.rawResultCount],
    ["Organic Results", item.organicResultCount],
    ["Shopping Results", item.shoppingResultCount],
    ["Domains Returned", item.domainsReturned],
    ["Structured Candidates Created", item.parsedResultCount],
    ["Normalized Candidates", item.normalizedResultCount],
    ["Comparable Records Retained", item.retainedResultCount],
    ["Customer Price Eligible", item.qualifiedResultCount],
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
  row.append(summary, facts);
  return row;
}

function cleanDiagnosticText(value) {
  return String(value || "").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();
}

function formatSearchPass(value) {
  const text = cleanDiagnosticText(value);
  return text ? text.replace(/_/g, " ") : "";
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
  body.appendChild(key === "buyer_risk_score"
    ? renderRiskScore(report)
    : key === "pricesFound"
      ? renderPricesFound(value)
      : renderValue(value));

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
    "pricesFound",
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
  whySummary.textContent = "Why this recommendation?";
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
      badge: "Seller Pricing and Listing Plan",
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
      badge: "Owner Value Assessment",
      tone: confidence,
      metrics: [
        [valuation.label, value],
        ["Recommended Selling Venues", firstNonEmpty(report.recommendedSellingPlatform, report.platformSpecificSellingGuidance)],
        ["Confidence", confidence],
        ["Most Likely Identity", identity]
      ]
    };
  }

  if (isCurrentRetailOnlyReport(report)) {
    const recommendation = firstNonEmpty(report.retailPurchaseDecision, report.recommendation, "Current Retail Price Not Verified");
    const priceAssessment = firstNonEmpty(report.currentRetailPriceAssessment, report.noCompatiblePricesFound, "Current Retail Price: Not verified");
    const askingPrice = firstNonEmpty(report.askingStorePrice, report.askingPrice, "Not provided");
    const confidence = getConfidenceText(report);
    const nextStep = firstNonEmpty(report.bestNextStep, report.whatToVerifyBeforeBuying, report.additionalInformationNeeded, "Confirm package count, current store price, taxes, and pickup or delivery terms before acting.");
    return {
      eyebrow: "Executive Summary",
      title: recommendation,
      badge: firstNonEmpty(report.retailRouteClassification, "Ordinary Current Retail Product"),
      tone: report.valueRating || recommendation,
      metrics: [
        ["Retail Purchase Decision", recommendation],
        ["Asking / Store Price", askingPrice],
        ["Current Retail Price Assessment", priceAssessment],
        ["Retail Price Limit", report.retailPriceLimit],
        ["Confidence", confidence],
        ["Best Next Step", normalizeDisplayValue(nextStep)]
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
      badge: workflow === "personal_use" ? "Personal-Use Buying Decision" : valueRating,
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
  if (isCurrentRetailOnlyReport(report)) {
    return firstNonEmpty(report.currentRetailPriceAssessment, report.noCompatiblePricesFound, "Current Retail Price: Not verified");
  }
  if (valuation.state === "supported") {
    return firstNonEmpty(report.estimatedFairMarketValue, report.estimatedMarketValue, report.fairPriceRange, valuation.range, "Value needs more evidence");
  }
  if (valuation.state === "preliminary") {
    return firstNonEmpty(report.preliminaryReferenceRange, valuation.range, "Preliminary reference range needs more evidence");
  }
  if (valuation.state === "current_asking") {
    return firstNonEmpty(report.currentAskingPriceRange, valuation.range, "Current asking-price range needs more evidence");
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
  const evidenceState = String(report.valuationEvidenceState || report.valuationEvidenceLabel || "").toLowerCase();
  const retainedCount = Number(report.retainedVisibleResultCount || report.visibleResearchResultCount || report.searchDiagnostics?.retainedVisibleResultCount || report.searchDiagnostics?.visibleRetainedResultCount || 0);
  const visibleCompCount = [
    report.weFoundThisItem,
    report.weFoundSimilarComparableItems,
    report.comparableItemsFound,
    report.strongComparables
  ].flat().filter(Boolean).length;
  const zeroValuationEvidence = /insufficient|not established/.test(evidenceState)
    || (!retainedCount && !visibleCompCount && /no reliable|not established|no source-backed|zero visible|insufficient/i.test([
      compText,
      report.valuationEvidenceExplanation,
      report.fairValueNotEstablished,
      report.noReliableMatchesReason
    ].join(" ")));

  if (/high|strong|clearly|confirmed/.test(visualConfidence)) {
    drivers.push("Subject appears well supported by the photos.");
  } else if (visualConfidence) {
    drivers.push("Visual identification still has limits.");
  }

  if (!zeroValuationEvidence && /exact match|strong comparable|source-backed|reliable/.test(compText)) {
    drivers.push("Source-backed comparable evidence supports this decision.");
  } else if (/no reliable|weak|partial|rejected|ai-only|unavailable/.test(compText)) {
    drivers.push("Comparable evidence is limited or did not pass match-quality checks.");
  } else if (zeroValuationEvidence) {
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
  eyebrow.textContent = "Bottom line";
  const title = document.createElement("h3");
  title.textContent = "Final Summary";
  header.append(eyebrow, title);

  const grid = document.createElement("div");
  grid.className = "appraiser-grid";
  [
    ["What We Know", getWhatIKnow(report)],
    ["What Still Needs Checking", getWhatIsUnclear(report)],
    ["What To Check Next", getWhatToCheckNext(report)],
    ["Bottom Line", getFinalRecommendation(report, workflow)]
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

function renderEndOfReportMarker() {
  const marker = document.createElement("p");
  marker.className = "end-of-report-marker";
  marker.setAttribute("role", "note");
  marker.textContent = "End of Report";
  return marker;
}

function appendEndOfReport(reportRoot) {
  reportRoot.appendChild(renderEndOfReportMarker());
}

function getWhatIKnow(report) {
  return firstNonEmpty(
    report.whatIsKnown,
    report.visualRecognitionSummary,
    report.identitySummary,
    report.itemIdentification,
    report.identifiedItem,
    report.subjectIdentity,
    "The photos and notes provide enough context for a preliminary read."
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
    setAskStatus("Ask Katherine’s Eye needs a completed item report first.", "error");
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
      throw new Error("Ask Katherine’s Eye returned an empty answer.");
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
    empty.textContent = getAskEmptyPrompt(activeItemSession);
    askHistory.appendChild(empty);
    return;
  }

  for (const entry of history) {
    askHistory.appendChild(renderAskEntry(entry));
  }
}

function getAskEmptyPrompt(session) {
  if (session?.workflow === "market_value") {
    return "Ask about this item, condition, provenance, valuation evidence, selling venues, or what would improve confidence. Ask Katherine’s Eye uses the current owner value assessment.";
  }
  if (session?.workflow === "listing") {
    return "Ask about platform fit, pricing, title, description, shipping, pickup, selling speed, or listing revisions. Ask Katherine’s Eye uses the current seller plan.";
  }
  if (session?.workflow === "resale") {
    return "Ask about price, alternatives, margin, platform fit, risk, shipping, negotiation, or timeline. Ask Katherine’s Eye uses the current resale buying report.";
  }
  return "Ask about this item, the evidence, the recommendation, price, alternatives, shipping, or negotiation. Ask Katherine’s Eye uses the current buying report.";
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
  askSubmitLabel.textContent = isLoading ? "Reviewing..." : "Ask Katherine’s Eye";
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
  const retailReport = isCurrentRetailOnlyReport(report);
  const card = document.createElement("article");
  card.className = `consumer-summary-card ${getValueRatingModifier(report.valueRating)}`;

  const header = document.createElement("div");
  header.className = "consumer-summary-header";

  const label = document.createElement("p");
  label.className = "summary-eyebrow";
  label.textContent = retailReport ? "Retail purchase decision" : "Personal-Use Buying Decision";

  const title = document.createElement("h3");
  title.textContent = retailReport
    ? report.retailPurchaseDecision || report.recommendation || "Current Retail Price Not Verified"
    : report.recommendation || "Need More Information";

  const badge = document.createElement("span");
  badge.className = "summary-badge";
  badge.textContent = retailReport
    ? report.retailRouteClassification || report.valueRating || "Ordinary Current Retail Product"
    : report.valueRating || "Insufficient Evidence";

  header.append(label, title, badge);

  const grid = document.createElement("dl");
  grid.className = "consumer-summary-grid";
  const metrics = retailReport
    ? [
        ["Asking / Store Price", report.askingStorePrice || report.askingPrice],
        ["Current Retail Price Assessment", report.currentRetailPriceAssessment],
        ["Retail Price Limit", report.retailPriceLimit],
        ["Pricing Confidence", report.pricingConfidence || report.priceConfidence]
      ]
    : [
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

function renderConsumerCompactSummary(report, workflow) {
  const card = renderConsumerSummary(report);
  const details = document.createElement("div");
  details.className = "consumer-compact-sections";
  const copyButton = document.createElement("button");
  copyButton.className = "copy-button summary-copy";
  copyButton.type = "button";
  copyButton.textContent = "Copy Summary";
  copyButton.addEventListener("click", () => copyText(formatExecutiveSummary(report, workflow), copyButton));

  if (isCurrentRetailOnlyReport(report)) {
    appendConsumerCompactSection(details, "Retail Purchase Decision", firstNonEmpty(
      report.retailPurchaseDecision,
      report.recommendation,
      "Current Retail Price Not Verified"
    ));
    appendConsumerCompactSection(details, "Asking / Store Price", firstNonEmpty(report.askingStorePrice, report.askingPrice));
    appendConsumerCompactSection(details, "Current Retail Price Assessment", report.currentRetailPriceAssessment);
    appendConsumerCompactSection(details, "Named Store Result", report.namedStoreResult);

    if (report.bestCurrentRetailAlternative && typeof report.bestCurrentRetailAlternative === "object") {
      const bestSection = document.createElement("section");
      bestSection.className = "consumer-compact-section price-context-section";
      const bestTitle = document.createElement("h4");
      bestTitle.textContent = report.bestCurrentRetailAlternative.priceContextLabel || "Best Current Retail Alternative";
      bestSection.appendChild(bestTitle);
      if (report.bestCurrentRetailAlternative.priceContextSummary) {
        const summary = document.createElement("p");
        summary.textContent = report.bestCurrentRetailAlternative.priceContextSummary;
        bestSection.appendChild(summary);
      }
      bestSection.appendChild(renderPriceFoundCard(report.bestCurrentRetailAlternative));
      details.appendChild(bestSection);
    }

    if (normalizeArray(report.otherCurrentRetailPrices).length) {
      const otherSection = document.createElement("section");
      otherSection.className = "consumer-compact-section price-context-section";
      const otherTitle = document.createElement("h4");
      otherTitle.textContent = "Other Current Retail Prices";
      otherSection.appendChild(otherTitle);
      otherSection.appendChild(renderPricesFound(report.otherCurrentRetailPrices));
      details.appendChild(otherSection);
    }

    appendConsumerCompactSection(details, "Package and Unit Price Comparison", firstNonEmpty(report.packageUnitPriceComparison, report.packageUnitPriceContext));
    appendConsumerCompactSection(details, "Local Availability Context", firstNonEmpty(report.localAvailabilityContext, report.localStoreContext));
    appendConsumerCompactSection(details, "Price Confidence", firstNonEmpty(report.pricingConfidence, report.priceConfidence));
    appendConsumerCompactSection(details, "Retail Price Limit", report.retailPriceLimit);
    appendConsumerCompactSection(details, "Next Best Action", firstNonEmpty(
      report.bestNextStep,
      report.whatToVerifyBeforeBuying,
      report.additionalInformationNeeded,
      "Confirm package count, current store price, taxes, and pickup or delivery terms before acting."
    ));

    const pricesSection = document.createElement("section");
    pricesSection.className = "consumer-compact-section";
    const pricesTitle = document.createElement("h4");
    pricesTitle.textContent = "Current Retail Prices Found";
    pricesSection.appendChild(pricesTitle);
    if (normalizeArray(report.pricesFound).length) {
      pricesSection.appendChild(renderPricesFound(report.pricesFound));
    } else {
      const empty = document.createElement("p");
      empty.textContent = report.noCompatiblePricesFound || "Current Retail Price: Not verified.";
      pricesSection.appendChild(empty);
    }
    details.appendChild(pricesSection);

    card.append(details, copyButton);
    return card;
  }

  appendConsumerCompactSection(details, "Evidence Summary", firstNonEmpty(
    report.customerPricingSummary,
    report.priceRangeAnalysis,
    report.searchEvidenceSummary,
    report.comparableQuality,
    report.noCompatiblePricesFound,
    report.noReliableComparableItemsFound,
    "Evidence is limited to the submitted photos, notes, and any source-backed records shown below."
  ));

  appendConsumerCompactSection(details, "Purchase Context", report.purchaseContextSummary);
  appendConsumerCompactSection(details, "Barcode Search Status", report.barcodeSearchStatus);
  appendConsumerCompactSection(details, "Local Store Context", report.localStoreContext);
  appendConsumerCompactSection(details, "Retail Price Context", report.retailPriceContext);
  appendConsumerCompactSection(details, "Package / Unit Price Context", report.packageUnitPriceContext);

  appendConsumerCompactSection(details, "Maximum Price Guard", report.maximumRecommendedPriceExplanation);

  if (report.bestCompatiblePriceFound && typeof report.bestCompatiblePriceFound === "object") {
    const bestSection = document.createElement("section");
    bestSection.className = "consumer-compact-section price-context-section";
    const bestTitle = document.createElement("h4");
    bestTitle.textContent = report.bestCompatiblePriceFound.priceContextLabel || "Best Compatible Price Found";
    bestSection.appendChild(bestTitle);
    if (report.bestCompatiblePriceFound.priceContextSummary) {
      const summary = document.createElement("p");
      summary.textContent = report.bestCompatiblePriceFound.priceContextSummary;
      bestSection.appendChild(summary);
    }
    bestSection.appendChild(renderPriceFoundCard(report.bestCompatiblePriceFound));
    details.appendChild(bestSection);
  }

  appendConsumerCompactSection(details, "Current Purchase Option Summary", report.currentPurchaseOptionSummary);

  appendConsumerCompactSection(details, "Price Spectrum Summary", report.priceSpectrumSummary);

  if (normalizeArray(report.otherCompatiblePricesFound).length) {
    const otherSection = document.createElement("section");
    otherSection.className = "consumer-compact-section price-context-section";
    const otherTitle = document.createElement("h4");
    otherTitle.textContent = "Other Compatible Prices Found";
    otherSection.appendChild(otherTitle);
    otherSection.appendChild(renderPricesFound(report.otherCompatiblePricesFound));
    details.appendChild(otherSection);
  }

  const pricesSection = document.createElement("section");
  pricesSection.className = "consumer-compact-section";
  const pricesTitle = document.createElement("h4");
  pricesTitle.textContent = "Prices Found";
  pricesSection.appendChild(pricesTitle);
  if (normalizeArray(report.pricesFound).length) {
    pricesSection.appendChild(renderPricesFound(report.pricesFound));
  } else {
    const empty = document.createElement("p");
    empty.textContent = report.noCompatiblePricesFound || "No compatible source-backed prices were found.";
    pricesSection.appendChild(empty);
  }
  details.appendChild(pricesSection);

  appendConsumerCompactSection(details, "Next Best Action", firstNonEmpty(
    report.bestNextStep,
    report.recommendedOffer,
    report.negotiationGuidance,
    report.whatToVerifyBeforeBuying,
    report.additionalInformationNeeded,
    "Verify item identity, condition, and price evidence before acting."
  ));

  card.append(details, copyButton);
  return card;
}

function appendConsumerCompactSection(wrapper, title, value) {
  if (!shouldRenderSection(title, value)) {
    return;
  }
  const section = document.createElement("section");
  section.className = "consumer-compact-section";
  const heading = document.createElement("h4");
  heading.textContent = title;
  section.append(heading, renderValue(value));
  wrapper.appendChild(section);
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

  if (latestReport && isCurrentRetailOnlyReport(latestReport) && new Set([
    "recommendedOffer",
    "maximumRecommendedPriceExplanation",
    "walkAwayPrice",
    "negotiationGuidance",
    "verifiedMarketRange",
    "currentAskingPriceRange",
    "preliminaryReferenceRange",
    "estimatedFairMarketValue",
    "fairPriceRange"
  ]).has(key)) {
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

function renderPricesFound(value) {
  const records = normalizeArray(value).filter((item) => item && typeof item === "object");
  const wrapper = document.createElement("div");
  wrapper.className = "prices-found-list";

  if (!records.length) {
    const empty = document.createElement("p");
    empty.textContent = "No compatible source-backed visible prices were found.";
    wrapper.appendChild(empty);
    return wrapper;
  }

  for (const item of records) {
    wrapper.appendChild(renderPriceFoundCard(item));
  }

  return wrapper;
}

function renderPriceFoundCard(item) {
  const card = document.createElement("article");
  card.className = "price-found-card";
  const retailerName = item.retailerDisplayName || item.source || item.marketplace || "Retailer not identified";
  const retailerUnknown = /retailer not identified|^source$/i.test(retailerName);
  const priceText = firstNonEmpty(item.itemPrice, item.displayedPrice, item.price, "Price not shown");
  const matchLabel = getPriceFoundMatchLabel(item);
  const addressText = getPriceFoundAddress(item);
  const directionsUrl = getPriceFoundDirectionsUrl(item, addressText);

  const header = document.createElement("div");
  header.className = "price-found-header";
  const titleGroup = document.createElement("div");
  titleGroup.className = "price-found-title-group";
  const title = document.createElement("h5");
  title.textContent = item.title || "Source listing";
  const source = document.createElement("p");
  source.className = "price-found-source";
  source.textContent = `Found at ${retailerUnknown ? "Retailer not identified" : retailerName} — ${priceText}`;
  titleGroup.append(source);
  header.append(titleGroup);

  const amounts = document.createElement("dl");
  amounts.className = "price-found-amounts";
  const quantityText = item.packageQuantity
    ? `${item.packageQuantity} units${item.unitPrice ? ` · ${item.unitPrice} each` : ""}`
    : "Not shown";
  [
    ["Price", item.itemPrice],
    ["Quantity / unit", quantityText],
    ["Availability", item.listingStatus || "Availability unconfirmed"]
  ].forEach(([label, detail]) => appendDefinitionRow(amounts, label, detail));

  const meta = document.createElement("dl");
  meta.className = "price-found-visible-meta";
  [
    ["Match", item.matchQuality || item.priceTypeLabel],
    ["Difference", item.knownDifferences || item.priceContextSummary || "No material difference shown"],
    ["Limit", item.conciseLimitation]
  ].forEach(([label, detail]) => appendDefinitionRow(meta, label, detail));

  const comparison = document.createElement("p");
  comparison.className = "price-found-comparison";
  comparison.textContent = item.comparisonToYourPrice || item.conciseLimitation || "";

  const quantity = document.createElement("p");
  quantity.className = "price-found-quantity";
  quantity.textContent = `Quantity: ${formatPriceFoundQuantity(item)}`;

  const unitPrice = document.createElement("p");
  unitPrice.className = "price-found-unit-price";
  unitPrice.textContent = item.unitPrice ? `Unit price: ${item.unitPrice}` : "";

  const match = document.createElement("p");
  match.className = "price-found-match";
  match.textContent = matchLabel;

  title.className = "price-found-product-title";

  const address = document.createElement("p");
  address.className = "price-found-address";
  address.textContent = addressText ? `Nearby address: ${addressText}` : "";

  const checkNote = document.createElement("p");
  checkNote.className = "price-found-check-note";
  checkNote.textContent = "Check with this location for price and availability.";

  const details = document.createElement("details");
  details.className = "price-found-details";
  const summary = document.createElement("summary");
  summary.textContent = "Details";
  const detailList = document.createElement("dl");
  detailList.className = "price-found-visible-meta";
  [
    ["Product title", item.title],
    ["Retailer domain", item.retailerDomain],
    ["Product listing", item.url],
    ["Destination URL", item.destinationUrl],
    ["Search provider", item.searchProvider],
    ["Evidence type", item.sourceEvidenceType],
    ["Evidence tier", item.retailEvidenceTierLabel || item.retailEvidenceTier || item.priceTypeLabel],
    ["Match label", matchLabel],
    ["Compatibility analysis", item.priceContextSummary],
    ["Product family", [item.targetProductFamily, item.candidateProductFamily].filter(Boolean).join(" / ")],
    ["Positive compatibility evidence", normalizeDisplayValue(item.positiveCompatibilityEvidence)],
    ["Contradictory evidence", normalizeDisplayValue(item.contradictoryEvidence)],
    ["Differences", item.knownDifferences],
    ["Retailer confidence", item.retailerConfidenceLevel],
    ["Confidence reasoning", normalizeDisplayValue(item.confidenceDowngradeReasons)],
    ["Attribution evidence", normalizeDisplayValue(item.retailerAttributionEvidence)],
    ["Availability/status from source", item.listingStatus],
    ["Shipping", item.shipping || "Not shown"],
    ["Delivered cost", item.deliveredCost || "Not established"],
    ["Shipping note", item.shippingDisclosure],
    ["Named-store match", item.namedStoreMatchStatus],
    ["Decision eligible", item.retailPriceDecisionEligibility === false ? "No" : item.retailPriceDecisionEligibility === true ? "Yes" : ""],
    ["Comparison to your price", item.comparisonToYourPrice],
    ["Full limitations", item.conciseLimitation],
    ["Full note", item.priceContextSummary]
  ].forEach(([label, detail]) => appendDefinitionRow(detailList, label, detail));
  details.append(summary, detailList);

  const defaultNodes = [
    header,
    quantity,
    ...(item.unitPrice ? [unitPrice] : []),
    match,
    title,
    ...(addressText ? [address] : []),
    checkNote,
    details
  ];
  const actionUrl = directionsUrl || item.url;
  if (actionUrl) {
    const link = document.createElement("a");
    link.className = "source-result-link price-found-action";
    link.href = actionUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = directionsUrl ? "Get Directions" : retailerUnknown ? "View Listing" : `View at ${retailerName}`;
    card.append(...defaultNodes, link);
  } else {
    card.append(...defaultNodes);
  }

  return card;
}

function formatPriceFoundQuantity(item = {}) {
  const raw = firstNonEmpty(item.packageQuantityLabel, item.packageQuantity, item.quantity, item.unitCount);
  if (!raw) {
    return "Not shown";
  }
  const cleaned = String(raw).replace(/\b(\d+)-count\b/gi, "$1 count").trim();
  if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
    return `${cleaned} count`;
  }
  return cleaned;
}

function getPriceFoundMatchLabel(item = {}) {
  return firstNonEmpty(item.priceContextLabel, item.priceTypeLabel, item.matchQuality, item.priceType, "Current retail price");
}

function getPriceFoundAddress(item = {}) {
  const raw = firstNonEmpty(
    item.nearbyAddress,
    item.storeAddress,
    item.locationAddress,
    item.retailerAddress,
    item.pickupAddress,
    item.address
  );
  const address = normalizeDisplayValue(raw);
  if (!address || /^https?:\/\//i.test(address) || /^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(address)) {
    return "";
  }
  return address;
}

function getPriceFoundDirectionsUrl(item = {}, addressText = "") {
  const explicitUrl = firstNonEmpty(item.directionsUrl, item.directionsURL, item.mapUrl, item.mapsUrl, item.googleMapsUrl);
  if (/^https?:\/\//i.test(explicitUrl)) {
    return explicitUrl;
  }
  if (!item.url && addressText) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
  }
  return "";
}

function appendDefinitionRow(list, label, detail) {
  if (!detail) {
    return;
  }
  const row = document.createElement("div");
  const term = document.createElement("dt");
  const description = document.createElement("dd");
  term.textContent = label;
  description.textContent = detail;
  row.append(term, description);
  list.appendChild(row);
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
      ["Provider", item.providerLabel || item.provider],
      ["Source", item.source],
      ["Source Type", item.sourceType],
      ["Search Pass", formatSearchPass(item.searchPass)],
      ["Query", item.query],
      ["Price", item.displayedPrice || item.price],
      ["Price Type", item.priceType],
      ["Price Label", item.priceTypeLabel],
      ["Shipping/Delivery", item.delivery],
      ["Active/Sold/Reference Status", item.activeSoldReferenceStatus],
      ["Classification", item.classification],
      ["Identity Match", item.identityMatchStrength],
      ["Evidence Role", item.evidenceRole],
      ["Condition", item.condition],
      ["Influenced Verified Market Range", item.influencedVerifiedMarketRange],
      ["Included in Preliminary Asking-Price Range", item.includedInPreliminaryAskingPriceRange],
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
      link.textContent = "Open source";
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

function renderIdentityConfirmationCard(confirmation = {}, config = workflowConfigs[defaultWorkflow]) {
  latestReport = null;
  copyAllButton.disabled = true;
  setReportActionsVisible(false);
  results.className = "results";
  setOutputHeading(config);

  const card = document.createElement("article");
  card.className = "section-card identity-confirmation-card";

  const title = document.createElement("h3");
  title.textContent = confirmation.message || "We found conflicting product details.";

  const helper = document.createElement("p");
  helper.textContent = "Confirm the likely item before Katherine’s Eye searches prices.";

  const likely = document.createElement("div");
  likely.className = "identity-confirmation-block";
  const likelyLabel = document.createElement("strong");
  likelyLabel.textContent = "Most likely item";
  const likelyText = document.createElement("p");
  likelyText.textContent = String(confirmation.mostLikelyItem || "Likely product identification needs confirmation.").replace(/\n+/g, " / ");
  likely.append(likelyLabel, likelyText);

  const rejected = normalizeArray(confirmation.conflictingDetailRejected);
  if (rejected.length) {
    const conflict = document.createElement("div");
    conflict.className = "identity-confirmation-block";
    const conflictLabel = document.createElement("strong");
    conflictLabel.textContent = "Conflicting detail rejected";
    const conflictText = document.createElement("p");
    conflictText.textContent = rejected.join(", ");
    conflict.append(conflictLabel, conflictText);
    card.append(title, helper, likely, conflict);
  } else {
    card.append(title, helper, likely);
  }

  const actions = document.createElement("div");
  actions.className = "identity-confirmation-actions";

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.className = "primary-button";
  confirmButton.textContent = "Confirm item";
  confirmButton.addEventListener("click", () => {
    pendingIdentityConfirmationToken = String(confirmation.confirmationToken || pendingIdentityConfirmationToken || "confirmed").trim();
    setStatus("Item confirmed. Running research now...", "loading");
    form.requestSubmit();
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "secondary-button";
  editButton.textContent = "Edit item description";
  editButton.addEventListener("click", () => {
    pendingIdentityConfirmationToken = "";
    notesInput.focus();
    setStatus("Edit the item notes, then analyze again.", "success");
  });

  const upcButton = document.createElement("button");
  upcButton.type = "button";
  upcButton.className = "secondary-button";
  upcButton.textContent = "Enter UPC";
  upcButton.addEventListener("click", () => {
    pendingIdentityConfirmationToken = "";
    const upcInput = document.querySelector("#known_upc");
    upcInput?.focus();
    setStatus("Enter the barcode or UPC number, then analyze again.", "success");
  });

  const photoButton = document.createElement("button");
  photoButton.type = "button";
  photoButton.className = "secondary-button";
  photoButton.textContent = "Upload clearer photo";
  photoButton.addEventListener("click", () => {
    pendingIdentityConfirmationToken = "";
    photosInput.click();
    setStatus("Add a clearer label or barcode photo, then analyze again.", "success");
  });

  actions.append(confirmButton, editButton, upcButton, photoButton);
  card.appendChild(actions);
  results.replaceChildren(card);
}

function renderEmpty(config = workflowConfigs[defaultWorkflow]) {
  stopLoadingProgress();
  latestReport = null;
  copyAllButton.disabled = true;
  setReportActionsVisible(false);
  results.className = "results empty-state";

  const intro = document.createElement("div");
  intro.className = "first-run-card compact-empty-card";
  const copy = document.createElement("p");
  copy.textContent = "Your recommendation will appear here after analysis.";
  const helper = document.createElement("p");
  helper.className = "first-run-helper";
  helper.textContent = "Add clear photos and any details you know.";
  intro.append(copy, helper);
  results.replaceChildren(intro);
}

function setReportActionsVisible(visible) {
  if (!outputActions) {
    return;
  }
  outputActions.hidden = !visible;
  if (!visible) {
    feedbackPanel.hidden = true;
    feedbackButton.setAttribute("aria-expanded", "false");
    feedbackStatus.textContent = "";
  }
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
  setReportActionsVisible(false);

  const card = document.createElement("section");
  card.className = "loading-card";
  card.setAttribute("aria-label", "Analysis progress");

  const title = document.createElement("h3");
  title.textContent = "Analyzing item";
  const helper = document.createElement("p");
  helper.textContent = "Katherine’s Eye is checking the item step by step.";

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
  results.replaceChildren(card);
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status is-visible is-${type}`;
}

function clearStatus() {
  statusBox.textContent = "";
  statusBox.className = "status";
}

function setSubmissionStage(state, stage) {
  if (state) {
    state.stage = stage || submissionStages.IDLE;
  }
}

function createSubmissionError(message, stage, code, cause) {
  const error = new Error(message);
  error.submissionStage = stage || submissionStages.IDLE;
  error.code = code || "";
  if (cause) {
    error.cause = cause;
  }
  return error;
}

function submissionStageFromError(error, fallbackState = {}) {
  return error?.submissionStage || fallbackState?.stage || submissionStages.IDLE;
}

function isPhotoReadStage(stage) {
  return stage === submissionStages.PHOTO_READ;
}

function isImageProcessStage(stage) {
  return stage === submissionStages.IMAGE_PROCESS;
}

function isApiTransportStage(stage) {
  return stage === submissionStages.API_REQUEST || stage === submissionStages.API_RESPONSE;
}

function getFriendlyErrorMessage(error, config, submissionState = {}) {
  const message = String(error && error.message || "").trim();
  const stage = submissionStageFromError(error, submissionState);

  if (/load failed/i.test(message)) {
    if (isPhotoReadStage(stage)) {
      return "We couldn't read that photo. Please select the photo again and retry.";
    }
    if (isImageProcessStage(stage)) {
      return "We couldn't process that photo. Please select a different copy or screenshot of the image.";
    }
    if (isApiTransportStage(stage)) {
      return "The connection was interrupted before we could confirm the analysis. Please check your connection before retrying.";
    }
    return "The analysis could not finish because the connection stalled. Please check your connection before retrying.";
  }

  if (/could not read an uploaded photo|photo_read_failed/i.test(message) || error?.code === "photo_read_failed") {
    return "We couldn't read that photo. Please select the photo again and retry.";
  }

  if (/could not process an uploaded photo|image_decode_failed|image_resize_failed/i.test(message) || /image_decode_failed|image_resize_failed/.test(error?.code || "")) {
    return "We couldn't process that photo. Please select a different copy or screenshot of the image.";
  }

  if (/api_response_parse_failed|could not read the analysis response/i.test(message) || error?.code === "api_response_parse_failed") {
    return "The analysis response was interrupted before it could be read. Please check your connection before retrying.";
  }

  if (/report_render_failed|could not display the analysis report/i.test(message) || error?.code === "report_render_failed") {
    return "The analysis completed, but the report could not be displayed. Please try again.";
  }

  if (/no results/i.test(message)) {
    return "We could not find an exact match. Try one full-item photo plus one close-up of the label, mark, model number, barcode, or damage.";
  }

  if (/api\s*key|service configuration|not configured/i.test(message)) {
    return "The analysis service is not configured for this environment yet. Please try again after setup is complete.";
  }

  if (/network|failed to fetch|request failed|timeout/i.test(message)) {
    return "The connection was interrupted before we could confirm the analysis. Please check your connection before retrying.";
  }

  return message || `${config.errorMessage} The most useful next step is one clear full-item photo plus one close-up of any label, mark, model number, barcode, or condition issue.`;
}

function toggleFeedbackPanel() {
  if (!latestReport) {
    return;
  }
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
    "What We Know",
    normalizeDisplayValue(getWhatIKnow(report)),
    "",
    "What Still Needs Checking",
    normalizeDisplayValue(getWhatIsUnclear(report)),
    "",
    "What To Check Next",
    normalizeDisplayValue(getWhatToCheckNext(report)),
    "",
    "Bottom Line",
    normalizeDisplayValue(getFinalRecommendation(report, currentWorkflow)),
    "",
    "End of Report"
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
    formatSection("Source Coverage", normalizeArray(report.sourcesSearched).length ? report.sourcesSearched : report.searchCoverage),
    formatSection("Item Identification Evidence", report.itemIdentificationEvidence),
    formatSection("Price Range Analysis", report.priceRangeAnalysis),
    formatSection("Strong Comparables", report.strongComparables),
    formatSection("Partial Comparables", report.partialComparables),
    formatSection("Reference Results", report.referenceResults),
    formatSection("Weak Matches", report.weakMatches),
    formatSection("Rejected Matches", report.rejectedMatches),
    formatSection("Search Limitations", report.searchLimitations),
    formatSection("Reference Range Basis", report.referenceRangeBasis),
    formatSection("Pricing Outliers Excluded", report.pricingOutliersExcluded),
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
    ["Search Provider Used", diagnostics.searchProviderUsed || diagnostics.sourcesActuallyQueried],
    ["Source Categories Targeted", diagnostics.sourceCategoriesTargeted || diagnostics.sourcesRequested],
    ["Allowed Domains Requested", diagnostics.allowedDomainsRequested],
    ["Domains Actually Returned", diagnostics.domainsActuallyReturned || diagnostics.sourcesReturned],
    ["Provider Calls Attempted", diagnostics.providerCallsAttempted],
    ["Provider Calls Succeeded", diagnostics.providerCallsSucceeded],
    ["Serper Configured", diagnostics.serperConfigured === undefined ? "" : diagnostics.serperConfigured ? "Yes" : "No"],
    ["Fallback Provider Used", diagnostics.fallbackProviderUsed === undefined ? "" : diagnostics.fallbackProviderUsed ? "Yes" : "No"],
    ["Serper Calls Attempted", diagnostics.serperCallsAttempted],
    ["Serper Calls Succeeded", diagnostics.serperCallsSucceeded],
    ["Retail Evidence Mode", diagnostics.retailEvidenceMode],
    ["Retail Route Classification", diagnostics.retailRouteClassification],
    ["Retail Provider Call Budget", diagnostics.retailProviderCallBudget],
    ["Retail Recovery Trigger", diagnostics.retailRecoveryTrigger],
    ["Retail Stages Planned", diagnostics.retailStagesPlanned],
    ["Retail Stages Attempted", diagnostics.retailStagesAttempted],
    ["Retail Queries Planned", diagnostics.retailQueriesPlanned],
    ["Retail Queries Executed", diagnostics.retailQueriesExecuted],
    ["Retail Provider Calls Used", diagnostics.retailProviderCallsUsed],
    ["Retail Search Budget Remaining", diagnostics.retailSearchBudgetRemaining],
    ["Retail Recovery Stopped Reason", diagnostics.retailRecoveryStoppedReason],
    ["Queries Suppressed", diagnostics.queriesSuppressed],
    ["Customer-Facing Retail Evidence Count", diagnostics.customerFacingRetailEvidenceCount],
    ["Records With Visible Prices", diagnostics.recordsWithVisiblePrices],
    ["Records Rejected Before Compatibility Review", diagnostics.recordsRejectedBeforeCompatibilityReview],
    ["Records Rejected By Compatibility Review", diagnostics.recordsRejectedByCompatibilityReview],
    ["Compatible Alternatives Accepted", diagnostics.compatibleAlternativesAccepted],
    ["Zero-Result Identity Recovery Triggered", diagnostics.zeroResultIdentityRecoveryTriggered],
    ["Exact Retail Match Count", diagnostics.exactRetailMatchCount],
    ["Strong Retail Alternative Count", diagnostics.strongRetailAlternativeCount],
    ["Unit-Price Comparable Count", diagnostics.unitPriceComparableCount],
    ["Retail Category Context Count", diagnostics.retailCategoryContextCount],
    ["Rejected Retail Mismatch Count", diagnostics.rejectedRetailMismatchCount],
    ["Retail Rejection Reasons", diagnostics.retailRejectionReasons],
    ["Current Retail Candidates Accepted", diagnostics.currentRetailCandidatesAccepted],
    ["Customer Price Eligible Retail Candidates", diagnostics.customerPriceEligibleRetailCandidateCount],
    ["Current Retail Candidates Rejected", diagnostics.currentRetailCandidatesRejected],
    ["Reference/Secondary Evidence Excluded From Retail Decision", diagnostics.referenceSecondaryEvidenceExcludedFromRetailDecision],
    ["Manual ZIP Used", diagnostics.manualZipUsed],
    ["Browser Coordinates Displayed", diagnostics.browserCoordinatesDisplayed],
    ["Provider Sources Returned", diagnostics.providerSourceCount],
    ["Organic Results Returned", diagnostics.organicResultCount],
    ["Shopping Results Returned", diagnostics.shoppingResultCount],
    ["Structured Candidates Created", diagnostics.parsedCandidateCount ?? diagnostics.parsedResultCount],
    ["Normalized Candidates", diagnostics.normalizedCandidateCount ?? diagnostics.normalizedResultCount],
    ["Unique Candidates", diagnostics.deduplicatedCandidateCount ?? diagnostics.deduplicatedResultCount],
    ["Visible Comparable Records Retained", diagnostics.retainedVisibleResultCount],
    ["Priced Candidates Returned", diagnostics.pricedCandidateCount],
    ["Compatible Priced Candidates", diagnostics.compatiblePricedCandidateCount],
    ["No-Price Identity References", diagnostics.noPriceIdentityReferenceCount],
    ["Rejected Mismatches", diagnostics.rejectedMismatchCount],
    ["Compatible Priced Recovery Threshold", diagnostics.compatiblePricedRecoveryThreshold],
    ["Recovery Search Passes Attempted", diagnostics.recoverySearchPassesAttempted],
    ["Rejected Candidates", diagnostics.rejectedCandidateCount ?? diagnostics.rejectedResultCount],
    ["Acquisition Failure Stage", diagnostics.acquisitionFailureStage]
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
    rows.push("Search Query Diagnostics:");
    records.forEach((item) => {
      rows.push(`- Query: ${cleanDiagnosticText(item.query)} | Final Query: ${cleanDiagnosticText(item.finalQuery || item.query)} | Raw Candidate: ${cleanDiagnosticText(item.rawCandidate || "") || "not recorded"} | Origin: ${cleanDiagnosticText(item.candidateOrigin || "") || "not recorded"} | Validation: ${item.validationPassed === false ? "rejected before provider call" : "passed"}${item.validationFailureReason ? ` | Validation Reason: ${cleanDiagnosticText(item.validationFailureReason)}` : ""} | Retail Stage: ${cleanDiagnosticText(item.retailStageLabel || item.retailStage || "") || "not retail-staged"} | Search Pass: ${formatSearchPass(item.searchPass) || "not recorded"} | Provider: ${cleanDiagnosticText(item.provider || item.source || "OpenAI web_search")} | Endpoint/Search Type: ${cleanDiagnosticText(item.providerEndpoint || "") || "not recorded"} / ${cleanDiagnosticText(item.searchType || "") || "not recorded"} | Generated: ${cleanDiagnosticText(item.generatedStatus || "") || "generated"} | Planned: ${cleanDiagnosticText(item.plannedStatus || "") || "planned"} | Allowed Domains: ${cleanDiagnosticText(normalizeDisplayValue(item.allowedDomainsRequested || item.allowedDomains || [])) || "none"} | Marketplace Domains: ${cleanDiagnosticText(normalizeDisplayValue(item.marketplaceDomainsRequested || [])) || "none"} | Attempted: ${(item.attempted ?? item.requestAttempted) ? "yes" : "no"} | Succeeded: ${(item.succeeded ?? item.requestSucceeded) ? "yes" : "no"} | Provider Sources Returned: ${item.returnedResultCount ?? item.providerSourceCount ?? item.rawResultCount ?? 0} | Organic: ${item.organicResultCount ?? 0} | Shopping: ${item.shoppingResultCount ?? 0} | Domains Returned: ${cleanDiagnosticText(normalizeDisplayValue(item.domainsReturned || [])) || "none"} | Structured Candidates Created: ${item.parsedResultCount ?? 0} | Comparable Records Retained: ${item.retainedResultCount ?? 0} | Customer Price Eligible: ${item.qualifiedResultCount ?? 0} | Stage: ${item.failureStage || item.primaryRejectionStageOrReason || "none"}${item.errorCode || item.controlledError ? ` | Error: ${cleanDiagnosticText(item.errorCode || item.controlledError)}` : ""}`);
    });
  }

  return rows.join("\n");
}

function formatSection(label, value) {
  if (isPriceFoundSectionLabel(label)) {
    const body = Array.isArray(value)
      ? value.map(formatPriceFoundRecordText).join("\n")
      : value && typeof value === "object"
        ? formatPriceFoundRecordText(value)
        : value;
    return `${label}\n${body || ""}`;
  }

  const body = Array.isArray(value)
    ? value.map((item) => item && typeof item === "object" ? formatResearchRecordText(item) : `- ${item}`).join("\n")
    : value && typeof value === "object"
      ? formatResearchRecordText(value)
      : value;
  return `${label}\n${body || ""}`;
}

function isPriceFoundSectionLabel(label = "") {
  return /^(Best Compatible Price Found|Other Compatible Prices Found|Prices Found|Best Current Retail Alternative|Other Current Retail Prices|Current Retail Prices Found)$/i.test(label);
}

function formatPriceFoundRecordText(item = {}) {
  const retailer = item.retailerDisplayName || item.source || item.marketplace || "Retailer not identified";
  const retailerUnknown = /retailer not identified|^source$/i.test(retailer);
  const priceText = firstNonEmpty(item.itemPrice, item.displayedPrice, item.price, "Price not shown");
  const matchLabel = getPriceFoundMatchLabel(item);
  const addressText = getPriceFoundAddress(item);
  const directionsUrl = getPriceFoundDirectionsUrl(item, addressText);
  const actionLabel = directionsUrl ? "Get Directions" : retailerUnknown ? "View Listing" : `View at ${retailer}`;
  const fields = [
    ["Quantity", formatPriceFoundQuantity(item)],
    ["Unit price", item.unitPrice],
    ["Match", matchLabel],
    ["Nearby address", addressText],
    ["Next step", "Check with this location for price and availability."],
    ["Shipping", item.shipping || "Not shown"],
    ["Delivered cost", item.deliveredCost || "Not established"],
    ["Retailer domain", item.retailerDomain],
    ["Search provider", item.searchProvider],
    [actionLabel, directionsUrl || item.url]
  ]
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`);
  const title = item.title ? ` | Product: ${item.title}` : "";
  return `- Found at ${retailerUnknown ? "Retailer not identified" : retailer} — ${priceText}${fields.length ? ` | ${fields.join(" | ")}` : ""}${title}`;
}

function formatResearchRecordText(item) {
  const fields = [
    ["Title", item.title],
    ["Provider", item.providerLabel || item.provider],
    ["Source", item.source],
    ["Source Type", item.sourceType],
    ["Search Pass", formatSearchPass(item.searchPass)],
    ["Query", item.query],
    ["URL", item.url || "No usable URL supplied by source."],
    ["Item Price", item.itemPrice],
    ["Shipping", item.shipping],
    ["Delivered Cost", item.deliveredCost],
    ["Displayed Price", item.displayedPrice || item.price],
    ["Currency", item.currency],
    ["Price Type", item.priceType],
    ["Price Label", item.priceTypeLabel],
    ["Shipping/Delivery", item.delivery],
    ["Listing Status", item.listingStatus],
    ["Comparison", item.comparisonToYourPrice],
    ["Active/Sold/Reference Status", item.activeSoldReferenceStatus],
    ["Classification", item.classification],
    ["Match Quality", item.matchQuality],
    ["Identity Match", item.identityMatchStrength],
    ["Evidence Role", item.evidenceRole],
    ["Condition", item.condition],
    ["Match Explanation", item.matchExplanation],
    ["Concise Limitation", item.conciseLimitation],
    ["Identity Differences", item.itemIdentityDifferences],
    ["Influenced Verified Market Range", item.influencedVerifiedMarketRange],
    ["Included in Preliminary Asking-Price Range", item.includedInPreliminaryAskingPriceRange],
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

function resizeImage(file, submissionState = null) {
  return new Promise((resolve, reject) => {
    setSubmissionStage(submissionState, submissionStages.PHOTO_READ);
    const reader = new FileReader();
    reader.onerror = () => reject(createSubmissionError("Could not read an uploaded photo.", submissionStages.PHOTO_READ, "photo_read_failed", reader.error));
    reader.onload = () => {
      setSubmissionStage(submissionState, submissionStages.IMAGE_PROCESS);
      if (typeof reader.result !== "string") {
        reject(createSubmissionError("Could not read an uploaded photo.", submissionStages.PHOTO_READ, "photo_read_failed"));
        return;
      }
      const image = new Image();
      image.onerror = () => reject(createSubmissionError("Could not process an uploaded photo.", submissionStages.IMAGE_PROCESS, "image_decode_failed"));
      image.onload = () => {
        setSubmissionStage(submissionState, submissionStages.IMAGE_PROCESS);
        try {
          const maxDimension = 1400;
          const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext("2d");
          if (!context) {
            throw new Error("Canvas unavailable.");
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        } catch (error) {
          reject(createSubmissionError("Could not process an uploaded photo.", submissionStages.IMAGE_PROCESS, "image_resize_failed", error));
        }
      };
      try {
        image.src = reader.result;
      } catch (error) {
        reject(createSubmissionError("Could not process an uploaded photo.", submissionStages.IMAGE_PROCESS, "image_decode_failed", error));
      }
    };
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(createSubmissionError("Could not read an uploaded photo.", submissionStages.PHOTO_READ, "photo_read_failed", error));
    }
  });
}
