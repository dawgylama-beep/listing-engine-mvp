(function installCustomerBetaFoundation(root) {
  "use strict";

  const accountButton = document.querySelector("#account-menu-button");
  const createAccountButton = document.querySelector("#account-create-button");
  const historyMenuButton = document.querySelector("#history-menu-button");
  const accountPanel = document.querySelector("#account-panel");
  const accountBackdrop = document.querySelector("#account-panel-backdrop");
  const accountCloseButton = document.querySelector("#account-close-button");
  const serviceStatus = document.querySelector("#account-service-status");
  const signedOutView = document.querySelector("#account-signed-out-view");
  const signedInView = document.querySelector("#account-signed-in-view");
  const accountUsername = document.querySelector("#account-username");
  const personalizedGreeting = document.querySelector("#personalized-greeting");
  const personalizedGreetingTitle = document.querySelector("#personalized-greeting-title");
  const registerForm = document.querySelector("#account-register-form");
  const loginForm = document.querySelector("#account-login-form");
  const signoutButton = document.querySelector("#account-signout-button");
  const preferredNameForm = document.querySelector("#preferred-name-form");
  const preferredNameInput = document.querySelector("#account-preferred-name");
  const retentionForm = document.querySelector("#retention-form");
  const retentionSelect = document.querySelector("#history-retention-days");
  const passwordForm = document.querySelector("#change-password-form");
  const exportButton = document.querySelector("#account-export-button");
  const deleteAccountForm = document.querySelector("#delete-account-form");
  const accountHistoryButton = document.querySelector("#account-history-button");
  const privacyDetailsButton = document.querySelector("#privacy-details-button");
  const saveListingButton = document.querySelector("#save-listing-button");
  const openHistoryButton = document.querySelector("#open-history-button");
  const closeHistoryButton = document.querySelector("#close-history-button");
  const historyPanel = document.querySelector("#history-panel");
  const historyList = document.querySelector("#history-list");
  const historyDetail = document.querySelector("#history-detail");
  const historyStatus = document.querySelector("#history-status");
  const photoDropzone = document.querySelector("#photo-dropzone");
  const libraryInput = document.querySelector("#photos");

  let account = null;
  let accountServiceAvailable = null;
  let currentReport = null;
  let currentReportSections = [];
  let currentReportWorkflow = "personal_use";
  let accountPanelReturnFocus = null;
  let csrfToken = "";

  const cleanText = (value, maximum = 1200) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maximum);
  const completeText = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
  const listValues = (value) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return [...new Set(values.map(completeText).filter(Boolean))];
  };
  const firstPresent = (...values) => values.find((value) => (
    Array.isArray(value) ? value.some(Boolean) : Boolean(cleanText(value, 1))
  )) || "";

  async function requestAccount(url = "/api/customer-account", options = {}) {
    let response;
    try {
      const method = String(options.method || "GET").toUpperCase();
      const headers = {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(csrfToken && method !== "GET" ? { "X-CSRF-Token": csrfToken } : {}),
        ...(options.headers || {})
      };
      response = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        ...options,
        headers
      });
    } catch {
      const error = new Error("Private beta accounts are unavailable in this environment.");
      error.code = "account_service_unavailable";
      throw error;
    }
    let payload = {};
    try {
      payload = await response.json();
    } catch {
      payload = {};
    }
    if (!response.ok) {
      const error = new Error(payload.error || "The private account service could not complete this request.");
      error.code = payload.code || "account_request_failed";
      error.status = response.status;
      throw error;
    }
    const nextCsrfToken = cleanText(payload.csrfToken || payload.session?.csrfToken, 128);
    if (nextCsrfToken) csrfToken = nextCsrfToken;
    return payload;
  }

  function setAccountStatus(message = "", type = "") {
    serviceStatus.textContent = message;
    serviceStatus.className = `account-service-status${message ? " is-visible" : ""}${type ? ` is-${type}` : ""}`;
  }

  function setHistoryStatus(message = "", type = "") {
    historyStatus.textContent = message;
    historyStatus.className = `status${message ? " is-visible" : ""}${type ? ` is-${type}` : ""}`;
  }

  function renderAccountState() {
    const signedIn = Boolean(account);
    signedOutView.hidden = signedIn;
    signedInView.hidden = !signedIn;
    historyMenuButton.hidden = !signedIn;
    openHistoryButton.hidden = !signedIn;
    saveListingButton.hidden = !(signedIn && currentReport);
    accountButton.textContent = signedIn ? `@${account.username}` : "Sign in";
    if (createAccountButton) createAccountButton.hidden = signedIn;
    personalizedGreeting.hidden = !signedIn;
    if (signedIn) {
      const preferredName = String(account.preferredName || account.username || "").trim() || account.username;
      accountUsername.textContent = `@${account.username}`;
      preferredNameInput.value = preferredName;
      personalizedGreetingTitle.textContent = `Hi, ${preferredName}! Are we shopping, selling, or just looking around today?`;
      retentionSelect.value = String(account.preferences?.historyRetentionDays || 30);
    } else {
      preferredNameInput.value = "";
      personalizedGreetingTitle.textContent = "";
    }
    if (accountServiceAvailable === false && !signedIn) {
      setAccountStatus("Private beta analysis requires a configured secure account store so an interrupted request cannot run twice.", "neutral");
    }
  }

  async function hydrateSession() {
    try {
      const payload = await requestAccount("/api/customer-account?action=session");
      account = payload.account || null;
      accountServiceAvailable = true;
    } catch (error) {
      account = null;
      csrfToken = "";
      accountServiceAvailable = !["account_service_unavailable", "account_request_failed"].includes(error.code) && error.status !== 404 && error.status !== 503;
    }
    renderAccountState();
  }

  function focusableAccountElements() {
    return [...accountPanel.querySelectorAll("button, input, select, summary, [href], [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.disabled && !element.closest("[hidden]"));
  }

  function openAccountPanel({ focusPrivacy = false, intent = "login" } = {}) {
    accountPanelReturnFocus = document.activeElement;
    accountPanel.hidden = false;
    accountBackdrop.hidden = false;
    document.body.classList.add("account-panel-open");
    accountButton.setAttribute("aria-expanded", "true");
    createAccountButton?.setAttribute("aria-expanded", "true");
    const credentialInput = document.querySelector(intent === "register" ? "#register-username" : "#login-username");
    const target = focusPrivacy && account ? retentionSelect : !account ? credentialInput : focusableAccountElements()[0] || accountPanel;
    target.focus();
    target.scrollIntoView({ block: "nearest" });
  }

  function closeAccountPanel() {
    accountPanel.hidden = true;
    accountBackdrop.hidden = true;
    document.body.classList.remove("account-panel-open");
    accountButton.setAttribute("aria-expanded", "false");
    createAccountButton?.setAttribute("aria-expanded", "false");
    if (accountPanelReturnFocus?.focus) accountPanelReturnFocus.focus();
  }

  function handleAccountKeydown(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeAccountPanel();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = focusableAccountElements();
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  async function submitCredentials(formElement, action) {
    const submitButton = formElement.querySelector("button[type='submit']");
    const values = new FormData(formElement);
    submitButton.disabled = true;
    setAccountStatus(action === "register" ? "Creating your private account…" : "Signing in…", "loading");
    try {
      const requestBody = { action, username: values.get("username"), password: values.get("password") };
      if (action === "register") requestBody.preferredName = values.get("preferredName");
      const payload = await requestAccount("/api/customer-account", {
        method: "POST",
        body: JSON.stringify(requestBody)
      });
      account = payload.account;
      accountServiceAvailable = true;
      formElement.reset();
      setAccountStatus(action === "register" ? "Account created. Your saved reports are private to this username." : "Signed in.", "success");
      renderAccountState();
    } catch (error) {
      accountServiceAvailable = error.code !== "account_service_unavailable";
      setAccountStatus(error.message, "error");
      renderAccountState();
    } finally {
      submitButton.disabled = false;
    }
  }

  function evidenceSnapshot(report) {
    const exactItemUnverified = report?.customerConfidence?.exactItem?.acceptedExactIdentifier !== true
      || /^(?:not verified|unverified|unknown)\b/i.test(cleanText(report?.exactProductIdentity, 160))
      || /^(?:insufficient|low)\b/i.test(cleanText(report?.exactProductConfidence, 160));
    const viewModel = root.KatherinesEyeCustomerEvidence?.buildCustomerEvidenceViewModel?.(
      report?.customerEvidence,
      report?.customerEvidenceSummary
    );
    const priceEvidence = !viewModel || viewModel.evidenceUnavailable ? [] : viewModel.cards
      .filter((card) => card.destinationUrl && card.sourceProvenance?.sourceRecordId)
      .map((card) => ({
      source: card.sourceLabel,
      acquisitionProvider: card.sourceProvenance.acquisitionProvider,
      sourceRecordId: card.sourceProvenance.sourceRecordId,
      title: card.title,
      match: card.canonicalMatchLabel,
      price: `${card.customerPriceLabel || "Price unavailable"}${card.canonicalPriceType ? ` · ${card.canonicalPriceType}` : ""}`,
      deliveredCost: card.deliveredCostLabel,
      availability: card.availabilityStatus,
      limitation: card.conciseLimitation || card.knownDifferences,
      url: card.destinationUrl
    }));
    const sourceFindings = (Array.isArray(report?.customerSourceFindings) ? report.customerSourceFindings : [])
      .filter((finding) => finding.sourceProvenance?.sourceRecordId
        && finding.sourceProvenance?.acquisitionProvider
        && finding.sourceProvenance?.sourceUrl === finding.destinationUrl)
      .slice(0, 6)
      .map((finding) => ({
        source: finding.sourceLabel,
        acquisitionProvider: finding.sourceProvenance.acquisitionProvider,
        sourceRecordId: finding.sourceProvenance.sourceRecordId,
        title: finding.title,
        match: exactItemUnverified && /^identity match$/i.test(cleanText(finding.relationship, 160))
          ? "Reference match only; photographed identity unverified"
          : finding.relationship,
        price: "",
        deliveredCost: "",
        availability: "",
        limitation: [finding.whyItHelps, finding.valuationUse].filter(Boolean).join(" "),
        url: finding.destinationUrl
      }));
    const seen = new Set();
    return [...priceEvidence, ...sourceFindings].filter((record) => {
      const key = `${record.url || ""}|${record.title || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function meaningfulIdentityTitle(report = {}) {
    for (const value of [report.listingTitle, report.exactProductIdentity, report.subjectIdentity, report.identifiedItem, report.visualSubject]) {
      const text = completeText(value);
      if (text && !/^(?:not verified|unknown|unverified|insufficient)/i.test(text)) return text;
    }
    return "Saved Katherine’s Eye result";
  }

  function customerConfidenceSnapshot(report = {}) {
    const summary = report.customerConfidenceSummary;
    if (!summary || typeof summary !== "object" || Array.isArray(summary)) return {};
    return Object.fromEntries(["photoMatch", "exactItem", "workingCondition", "priceSupport"]
      .map((key) => [key, completeText(summary[key])]).filter(([, value]) => value));
  }

  function buildHistorySnapshot(report = {}) {
    const pricingDisposition = completeText(firstNonEmpty(
      report.valuationEvidenceLabel,
      report.pricingDisposition,
      report.currentRetailPriceAssessment,
      report.fairValueNotEstablished,
      "Pricing not established"
    ));
    return {
      workflow: currentReportWorkflow,
      title: meaningfulIdentityTitle(report),
      identification: {
        confidence: cleanText(report.customerConfidence?.exactItem?.level || "Insufficient", 120),
        summary: completeText(firstNonEmpty(report.identitySummary, report.visualRecognitionSummary, report.itemIdentification, report.subjectIdentity)),
        customerExplanation: completeText(report.customerConfidenceSummary?.exactItem)
      },
      confidence: customerConfidenceSnapshot(report),
      confidenceModel: report.customerConfidence || {},
      metering: report.customerMetering || { billingStatus: "UNKNOWN" },
      listing: {
        title: completeText(firstNonEmpty(report.listingTitle, report.optimizedTitle, report.title)),
        description: completeText(firstNonEmpty(report.listingDescription, report.optimizedDescription, report.description)),
        itemDetails: listValues(firstPresent(report.itemDetails, report.keyProductFacts, report.keyItemDetails), 24),
        visibleCondition: listValues(firstPresent(report.visibleCondition, report.conditionObservations, report.conditionNotes, report.conditionAssessment), 16)
      },
      pricing: {
        disposition: pricingDisposition,
        range: completeText(firstNonEmpty(report.verifiedMarketRange, report.estimatedResaleRange, report.currentRetailPriceAssessment)),
        rationale: completeText(firstNonEmpty(report.pricingRationale, report.valuationEvidenceExplanation, report.priceBasis, report.fairValueNotEstablished))
      },
      recommendation: completeText(firstNonEmpty(report.recommendation, report.purchaserDecision, report.bestNextStep)),
      uncertainty: listValues(firstPresent(report.whatIsStillUnknown, report.uncertainty, report.searchLimitations), 16),
      alternatives: listValues(firstPresent(report.alternativeIdentifications, report.alternatives, report.possibleIdentities), 12),
      requestedPhotos: listValues(firstPresent(report.requestedAdditionalPhotos, report.additionalPhotosNeeded, report.photosToAdd), 12),
      researchSteps: listValues(firstPresent(report.customerMissingDetails, report.recommendedResearchSteps, report.whatToCheckNext, report.additionalInformationNeeded, report.bestNextStep), 16),
      evidence: evidenceSnapshot(report)
    };
  }

  async function saveCurrentListing() {
    if (!account) {
      openAccountPanel();
      setAccountStatus("Sign in before saving a report.", "neutral");
      return;
    }
    if (!currentReport) return;
    saveListingButton.disabled = true;
    const originalLabel = saveListingButton.textContent;
    saveListingButton.textContent = "Saving…";
    try {
      await requestAccount("/api/customer-account", {
        method: "POST",
        body: JSON.stringify({ action: "save_listing", snapshot: buildHistorySnapshot(currentReport) })
      });
      saveListingButton.textContent = "Saved";
      setStatus("Saved privately to your account. Uploaded image files were not retained.", "success");
    } catch (error) {
      saveListingButton.textContent = originalLabel;
      setStatus(error.message, "error");
    } finally {
      saveListingButton.disabled = false;
    }
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "Date unavailable";
  }

  function emptyHistoryDetail(message = "Select a saved result to revisit it.") {
    const paragraph = document.createElement("p");
    paragraph.textContent = message;
    historyDetail.replaceChildren(paragraph);
  }

  function renderHistoryList(listings = []) {
    historyList.innerHTML = "";
    if (!listings.length) {
      const empty = document.createElement("div");
      empty.className = "history-empty-state";
      const title = document.createElement("h3");
      title.textContent = "No saved results yet";
      const copy = document.createElement("p");
      copy.textContent = "Analyze an item, then choose Save to history. Photos are not added to history.";
      empty.append(title, copy);
      historyList.appendChild(empty);
      emptyHistoryDetail("A saved report will open here.");
      return;
    }

    listings.forEach((listing) => {
      const card = document.createElement("article");
      card.className = "history-item";
      const title = document.createElement("h3");
      title.textContent = listing.name;
      const meta = document.createElement("p");
      meta.className = "history-item-meta";
      meta.textContent = `Saved ${formatDate(listing.createdAt)} · Expires ${formatDate(listing.expiresAt)} · No images stored`;
      const actions = document.createElement("div");
      actions.className = "history-item-actions";
      const view = document.createElement("button");
      view.className = "secondary-button";
      view.type = "button";
      view.textContent = "View";
      view.addEventListener("click", () => openSavedListing(listing.id));
      const nameLabel = document.createElement("label");
      nameLabel.className = "visually-hidden-label";
      nameLabel.htmlFor = `rename-${listing.id}`;
      nameLabel.textContent = `Rename ${listing.name}`;
      const nameInput = document.createElement("input");
      nameInput.id = `rename-${listing.id}`;
      nameInput.value = listing.name;
      nameInput.maxLength = 80;
      const rename = document.createElement("button");
      rename.className = "secondary-button";
      rename.type = "button";
      rename.textContent = "Rename";
      rename.addEventListener("click", () => renameSavedListing(listing.id, nameInput.value));
      const remove = document.createElement("button");
      remove.className = "text-danger-button";
      remove.type = "button";
      remove.textContent = "Delete";
      remove.addEventListener("click", () => {
        if (remove.dataset.confirming === "true") deleteSavedListing(listing.id);
        else {
          remove.dataset.confirming = "true";
          remove.textContent = "Confirm delete";
          setTimeout(() => {
            remove.dataset.confirming = "false";
            remove.textContent = "Delete";
          }, 5000);
        }
      });
      actions.append(view, nameLabel, nameInput, rename, remove);
      card.append(title, meta, actions);
      historyList.appendChild(card);
    });
  }

  function appendSnapshotSection(parent, titleText, value) {
    const values = Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
    if (!values.length) return;
    const section = document.createElement("section");
    section.className = "saved-detail-section";
    const title = document.createElement("h4");
    title.textContent = titleText;
    section.appendChild(title);
    if (Array.isArray(value)) {
      const list = document.createElement("ul");
      values.forEach((item) => {
        const row = document.createElement("li");
        row.textContent = completeText(item);
        list.appendChild(row);
      });
      section.appendChild(list);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = completeText(value);
      section.appendChild(paragraph);
    }
    parent.appendChild(section);
  }

  function renderSavedListing(listing) {
    const snapshot = listing.snapshot || {};
    const visibleConfidence = snapshot.confidenceModel?.visibleCategory;
    const visibleConfidenceCopy = visibleConfidence?.level
      ? `Visible-item confidence: ${visibleConfidence.level}${visibleConfidence.explanation ? ` — ${visibleConfidence.explanation}` : ""}`
      : "Visible-item confidence: Unclear — the saved report does not establish visible-item confidence.";
    const identificationSummary = completeText(snapshot.identification?.summary).replace(
      /(?:Subject Confidence|Visible-item confidence)\s*:\s*[^|]*/gi,
      visibleConfidenceCopy
    );
    const article = document.createElement("div");
    article.className = "saved-report";
    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Saved Katherine’s Eye result";
    const heading = document.createElement("h3");
    heading.textContent = listing.name;
    const meta = document.createElement("p");
    meta.className = "history-item-meta";
    meta.textContent = `Saved ${formatDate(listing.createdAt)} · Expires ${formatDate(listing.expiresAt)} · Uploaded images not retained`;
    article.append(eyebrow, heading, meta);
    appendSnapshotSection(article, "Identification", [snapshot.title, identificationSummary, snapshot.identification?.customerExplanation]);
    const savedConfidence = [snapshot.confidence?.photoMatch, snapshot.confidence?.exactItem, snapshot.confidence?.workingCondition, snapshot.confidence?.priceSupport]
      .filter(Boolean).map((line) => completeText(line).replace(/Subject Confidence\s*:\s*[^|]*/gi, visibleConfidenceCopy));
    appendSnapshotSection(article, "Confidence", savedConfidence.length
      ? savedConfidence
      : snapshot.identification?.confidence ? [`Legacy saved confidence: ${snapshot.identification.confidence}`] : []);
    appendSnapshotSection(article, "Listing title", snapshot.listing?.title);
    appendSnapshotSection(article, "Listing description", snapshot.listing?.description);
    appendSnapshotSection(article, "Item details", snapshot.listing?.itemDetails);
    appendSnapshotSection(article, "Visible condition", snapshot.listing?.visibleCondition);
    appendSnapshotSection(article, "Pricing disposition", [snapshot.pricing?.disposition, snapshot.pricing?.range, snapshot.pricing?.rationale]);
    appendSnapshotSection(article, "Recommendation", snapshot.recommendation);
    appendSnapshotSection(article, "Uncertainty", snapshot.uncertainty);
    appendSnapshotSection(article, "Alternatives", snapshot.alternatives);
    appendSnapshotSection(article, "Helpful additional photos", snapshot.requestedPhotos);
    appendSnapshotSection(article, "Recommended research", snapshot.researchSteps);
    if (Array.isArray(snapshot.evidence) && snapshot.evidence.length) {
      const evidenceSection = document.createElement("section");
      evidenceSection.className = "saved-detail-section saved-evidence";
      const title = document.createElement("h4");
      title.textContent = "Supporting sources";
      evidenceSection.appendChild(title);
      snapshot.evidence.forEach((record) => {
        const row = document.createElement("article");
        const rowTitle = document.createElement("h5");
        rowTitle.textContent = completeText(record.title || record.source);
        const rowCopy = document.createElement("p");
        rowCopy.textContent = [record.source, record.acquisitionProvider ? `via ${record.acquisitionProvider}` : "", record.match, record.price, record.deliveredCost, record.availability, record.limitation].filter(Boolean).join(" · ");
        row.append(rowTitle, rowCopy);
        if (record.url && record.sourceRecordId && record.acquisitionProvider) {
          const link = document.createElement("a");
          link.href = record.url;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Open source";
          row.appendChild(link);
        }
        evidenceSection.appendChild(row);
      });
      article.appendChild(evidenceSection);
    }
    const metering = snapshot.metering || {};
    const totalReserved = metering.reservationScope === "TOTAL_PROVIDER_CONSERVATIVE_EXPOSURE";
    const reservation = Number.isFinite(metering.reservedUpperBoundDollars) ? `$${metering.reservedUpperBoundDollars.toFixed(4)}` : "UNKNOWN";
    appendSnapshotSection(article, "Provider activity and billing", `Generation requests: ${Number.isSafeInteger(metering.generationRequests) ? metering.generationRequests : "UNKNOWN"}; token-count requests: ${Number.isSafeInteger(metering.tokenCountRequests) ? metering.tokenCountRequests : "UNKNOWN"}; search attempts: ${Number.isSafeInteger(metering.searchProviderAttempts) ? metering.searchProviderAttempts : "UNKNOWN"}; search-tool calls: ${Number.isSafeInteger(metering.searchToolCalls) ? metering.searchToolCalls : "UNKNOWN"}; direct-page reads: ${Number.isSafeInteger(metering.directPageAttempts) ? metering.directPageAttempts : "UNKNOWN"}; reported tokens: ${Object.keys(metering.reportedTokens || {}).length ? JSON.stringify(metering.reportedTokens) : "UNKNOWN"}; ${totalReserved ? `conservative total-provider reservation: ${reservation} (model ${Number.isFinite(metering.modelReservedUpperBoundDollars) ? `$${metering.modelReservedUpperBoundDollars.toFixed(4)}` : "UNKNOWN"} + Serper ${Number.isFinite(metering.serperReservedUpperBoundDollars) ? `$${metering.serperReservedUpperBoundDollars.toFixed(4)}` : "UNKNOWN"}; ${metering.searchProviderAttempts ?? "UNKNOWN"}/${metering.serperAttemptCeiling ?? "UNKNOWN"} Serper attempts); authorized exposure ceiling: ${Number.isFinite(metering.maximumAuthorizedDollars) ? `$${metering.maximumAuthorizedDollars.toFixed(2)}` : "UNKNOWN"}` : `model-request reservation (not total billing): ${reservation}; all-provider ceiling not verified by this display`}; exact billed amount: UNKNOWN.`);
    historyDetail.replaceChildren(article);
  }

  async function loadHistory() {
    setHistoryStatus("Loading your private history…", "loading");
    try {
      const payload = await requestAccount("/api/customer-account?action=history");
      renderHistoryList(payload.listings || []);
      setHistoryStatus(payload.listings?.length ? `${payload.listings.length} saved result${payload.listings.length === 1 ? "" : "s"}.` : "No saved results yet.", "success");
    } catch (error) {
      renderHistoryList([]);
      setHistoryStatus(error.message, "error");
    }
  }

  async function openHistory() {
    if (!account) {
      openAccountPanel();
      setAccountStatus("Sign in to open private saved history.", "neutral");
      return;
    }
    closeAccountPanel();
    historyPanel.hidden = false;
    historyPanel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    await loadHistory();
    historyPanel.focus?.();
  }

  async function openSavedListing(listingId) {
    setHistoryStatus("Opening saved result…", "loading");
    try {
      const payload = await requestAccount(`/api/customer-account?action=listing&listingId=${encodeURIComponent(listingId)}`);
      renderSavedListing(payload.listing);
      setHistoryStatus("Saved result opened.", "success");
    } catch (error) {
      setHistoryStatus(error.message, "error");
    }
  }

  async function renameSavedListing(listingId, name) {
    try {
      await requestAccount("/api/customer-account", {
        method: "PATCH",
        body: JSON.stringify({ action: "rename_listing", listingId, name })
      });
      setHistoryStatus("Saved result renamed.", "success");
      await loadHistory();
    } catch (error) {
      setHistoryStatus(error.message, "error");
    }
  }

  async function deleteSavedListing(listingId) {
    try {
      await requestAccount("/api/customer-account", {
        method: "DELETE",
        body: JSON.stringify({ action: "delete_listing", listingId })
      });
      emptyHistoryDetail("The saved result was deleted.");
      setHistoryStatus("Saved result deleted.", "success");
      await loadHistory();
    } catch (error) {
      setHistoryStatus(error.message, "error");
    }
  }

  createAccountButton?.addEventListener("click", () => openAccountPanel({ intent: "register" }));
  accountButton?.addEventListener("click", () => openAccountPanel());
  accountBackdrop?.addEventListener("click", closeAccountPanel);
  accountCloseButton?.addEventListener("click", closeAccountPanel);
  accountPanel?.addEventListener("keydown", handleAccountKeydown);
  privacyDetailsButton?.addEventListener("click", () => openAccountPanel({ focusPrivacy: true }));
  registerForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitCredentials(registerForm, "register");
  });
  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    submitCredentials(loginForm, "login");
  });
  signoutButton?.addEventListener("click", async () => {
    try {
      await requestAccount("/api/customer-account", { method: "POST", body: JSON.stringify({ action: "logout" }) });
    } catch {
    }
    account = null;
    csrfToken = "";
    historyPanel.hidden = true;
    setAccountStatus("Signed out.", "success");
    renderAccountState();
  });
  retentionForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const payload = await requestAccount("/api/customer-account", {
        method: "PATCH",
        body: JSON.stringify({ action: "preferences", historyRetentionDays: Number(retentionSelect.value) })
      });
      account = payload.account;
      setAccountStatus(`Saved reports will be kept for ${account.preferences.historyRetentionDays} days.`, "success");
      renderAccountState();
    } catch (error) {
      setAccountStatus(error.message, "error");
    }
  });
  preferredNameForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = preferredNameForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      const payload = await requestAccount("/api/customer-account", {
        method: "PATCH",
        body: JSON.stringify({ action: "profile", preferredName: preferredNameInput.value })
      });
      account = payload.account;
      setAccountStatus("Preferred name updated.", "success");
      renderAccountState();
    } catch (error) {
      setAccountStatus(error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = new FormData(passwordForm);
    const submitButton = passwordForm.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      const payload = await requestAccount("/api/customer-account", {
        method: "PATCH",
        body: JSON.stringify({
          action: "change_password",
          currentPassword: values.get("currentPassword"),
          newPassword: values.get("newPassword")
        })
      });
      account = payload.account;
      passwordForm.reset();
      setAccountStatus("Password changed. Other signed-in sessions were revoked.", "success");
      renderAccountState();
    } catch (error) {
      setAccountStatus(error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
  exportButton?.addEventListener("click", async () => {
    try {
      const payload = await requestAccount("/api/customer-account?action=export");
      const blob = new Blob([`${JSON.stringify(payload.export, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `katherines-eye-${account.username}-export.json`;
      link.click();
      URL.revokeObjectURL(url);
      setAccountStatus("Your account export was prepared. It excludes passwords, session tokens, and uploaded images.", "success");
    } catch (error) {
      setAccountStatus(error.message, "error");
    }
  });
  deleteAccountForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = new FormData(deleteAccountForm).get("password");
    try {
      await requestAccount("/api/customer-account", {
        method: "DELETE",
        body: JSON.stringify({ action: "delete_account", password })
      });
      account = null;
      csrfToken = "";
      deleteAccountForm.reset();
      historyPanel.hidden = true;
      setAccountStatus("Account and saved reports deleted.", "success");
      renderAccountState();
    } catch (error) {
      setAccountStatus(error.message, "error");
    }
  });
  saveListingButton?.addEventListener("click", saveCurrentListing);
  historyMenuButton?.addEventListener("click", openHistory);
  openHistoryButton?.addEventListener("click", openHistory);
  accountHistoryButton?.addEventListener("click", openHistory);
  closeHistoryButton?.addEventListener("click", () => {
    historyPanel.hidden = true;
    openHistoryButton.focus();
  });

  if (photoDropzone && libraryInput) {
    photoDropzone.addEventListener("click", () => libraryInput.click());
    photoDropzone.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        libraryInput.click();
      }
    });
    for (const eventName of ["dragenter", "dragover"]) {
      photoDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        photoDropzone.classList.add("is-dragging");
      });
    }
    for (const eventName of ["dragleave", "drop"]) {
      photoDropzone.addEventListener(eventName, (event) => {
        event.preventDefault();
        photoDropzone.classList.remove("is-dragging");
      });
    }
    photoDropzone.addEventListener("drop", (event) => {
      appendSelectedPhotoFiles(Array.from(event.dataTransfer?.files || []));
      renderPhotoPreview();
    });
  }

  root.KatherinesEyeCustomerAccount = Object.freeze({
    async registerAnalysis(identity) {
      await sessionHydration;
      if (!account) {
        const error = new Error("Sign in before starting an analysis so an interrupted result can be recovered.");
        error.code = "analysis_authentication_required";
        throw error;
      }
      return requestAccount("/api/customer-account", {
        method: "POST",
        body: JSON.stringify({ action: "register_analysis", ...identity })
      });
    },
    async getAnalysisStatus(analysisId, recoveryId) {
      await sessionHydration;
      if (!account) throw new Error("Sign in to recover this analysis.");
      return requestAccount(`/api/customer-account?action=analysis_status&analysisId=${encodeURIComponent(analysisId)}&recoveryId=${encodeURIComponent(recoveryId)}`);
    },
    getCsrfToken() { return csrfToken; },
    setCurrentReport(report, sections = [], workflow = "personal_use") {
      currentReport = report && typeof report === "object" ? report : null;
      currentReportSections = Array.isArray(sections) ? sections : [];
      currentReportWorkflow = cleanText(workflow, 40) || "personal_use";
      void currentReportSections;
      renderAccountState();
    },
    openAccountPanel,
    openHistory
  });

  renderAccountState();
  const sessionHydration = hydrateSession();
})(globalThis);
