(function installCustomerBetaFoundation(root) {
  "use strict";

  const accountButton = document.querySelector("#account-menu-button");
  const historyMenuButton = document.querySelector("#history-menu-button");
  const accountPanel = document.querySelector("#account-panel");
  const accountBackdrop = document.querySelector("#account-panel-backdrop");
  const accountCloseButton = document.querySelector("#account-close-button");
  const serviceStatus = document.querySelector("#account-service-status");
  const signedOutView = document.querySelector("#account-signed-out-view");
  const signedInView = document.querySelector("#account-signed-in-view");
  const accountUsername = document.querySelector("#account-username");
  const registerForm = document.querySelector("#account-register-form");
  const loginForm = document.querySelector("#account-login-form");
  const signoutButton = document.querySelector("#account-signout-button");
  const retentionForm = document.querySelector("#retention-form");
  const retentionSelect = document.querySelector("#history-retention-days");
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

  const cleanText = (value, maximum = 1200) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maximum);
  const listValues = (value, maximumItems = 16) => {
    const values = Array.isArray(value) ? value : value ? [value] : [];
    return [...new Set(values.map((item) => cleanText(item, 500)).filter(Boolean))].slice(0, maximumItems);
  };
  const firstPresent = (...values) => values.find((value) => (
    Array.isArray(value) ? value.some(Boolean) : Boolean(cleanText(value, 1))
  )) || "";

  async function requestAccount(url = "/api/customer-account", options = {}) {
    let response;
    try {
      response = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        ...options,
        headers: options.body ? { "Content-Type": "application/json", ...(options.headers || {}) } : options.headers
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
    accountButton.textContent = signedIn ? `@${account.username}` : "Account";
    if (signedIn) {
      accountUsername.textContent = `@${account.username}`;
      retentionSelect.value = String(account.preferences?.historyRetentionDays || 30);
    }
    if (accountServiceAvailable === false && !signedIn) {
      setAccountStatus("Private beta accounts need a configured secure account store in this environment. Photo analysis remains available without an account.", "neutral");
    }
  }

  async function hydrateSession() {
    try {
      const payload = await requestAccount("/api/customer-account?action=session");
      account = payload.account || null;
      accountServiceAvailable = true;
    } catch (error) {
      account = null;
      accountServiceAvailable = !["account_service_unavailable", "account_request_failed"].includes(error.code) && error.status !== 404 && error.status !== 503;
    }
    renderAccountState();
  }

  function focusableAccountElements() {
    return [...accountPanel.querySelectorAll("button, input, select, summary, [href], [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.disabled && !element.closest("[hidden]"));
  }

  function openAccountPanel({ focusPrivacy = false } = {}) {
    accountPanelReturnFocus = document.activeElement;
    accountPanel.hidden = false;
    accountBackdrop.hidden = false;
    document.body.classList.add("account-panel-open");
    accountButton.setAttribute("aria-expanded", "true");
    const target = focusPrivacy && account ? retentionSelect : focusableAccountElements()[0] || accountPanel;
    target.focus();
  }

  function closeAccountPanel() {
    accountPanel.hidden = true;
    accountBackdrop.hidden = true;
    document.body.classList.remove("account-panel-open");
    accountButton.setAttribute("aria-expanded", "false");
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
      const payload = await requestAccount("/api/customer-account", {
        method: "POST",
        body: JSON.stringify({ action, username: values.get("username"), password: values.get("password") })
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
    const viewModel = root.KatherinesEyeCustomerEvidence?.buildCustomerEvidenceViewModel?.(
      report?.customerEvidence,
      report?.customerEvidenceSummary
    );
    if (!viewModel || viewModel.evidenceUnavailable) return [];
    return viewModel.cards.map((card) => ({
      source: card.sourceLabel,
      title: card.title,
      match: card.canonicalMatchLabel,
      price: `${card.customerPriceLabel || "Price unavailable"}${card.canonicalPriceType ? ` · ${card.canonicalPriceType}` : ""}`,
      deliveredCost: card.deliveredCostLabel,
      availability: card.availabilityStatus,
      limitation: card.conciseLimitation || card.knownDifferences,
      url: card.destinationUrl
    }));
  }

  function buildHistorySnapshot(report = {}) {
    const pricingDisposition = cleanText(firstNonEmpty(
      report.valuationEvidenceLabel,
      report.pricingDisposition,
      report.currentRetailPriceAssessment,
      report.fairValueNotEstablished,
      "Pricing not established"
    ));
    return {
      workflow: currentReportWorkflow,
      title: cleanText(firstNonEmpty(report.listingTitle, report.exactProductIdentity, report.subjectIdentity, report.identifiedItem, "Saved Katherine’s Eye result"), 160),
      identification: {
        confidence: cleanText(firstNonEmpty(report.exactProductConfidence, report.identificationConfidence, report.visualSubjectConfidence, "Not established"), 120),
        summary: cleanText(firstNonEmpty(report.identitySummary, report.visualRecognitionSummary, report.itemIdentification, report.subjectIdentity), 1200)
      },
      listing: {
        title: cleanText(firstNonEmpty(report.listingTitle, report.optimizedTitle, report.title), 240),
        description: cleanText(firstNonEmpty(report.listingDescription, report.optimizedDescription, report.description), 6000),
        itemDetails: listValues(firstPresent(report.itemDetails, report.keyProductFacts, report.keyItemDetails), 24),
        visibleCondition: listValues(firstPresent(report.visibleCondition, report.conditionObservations, report.conditionNotes, report.conditionAssessment), 16)
      },
      pricing: {
        disposition: pricingDisposition,
        range: cleanText(firstNonEmpty(report.verifiedMarketRange, report.estimatedResaleRange, report.currentRetailPriceAssessment), 160),
        rationale: cleanText(firstNonEmpty(report.pricingRationale, report.valuationEvidenceExplanation, report.priceBasis, report.fairValueNotEstablished), 1200)
      },
      recommendation: cleanText(firstNonEmpty(report.recommendation, report.purchaserDecision, report.bestNextStep), 1600),
      uncertainty: listValues(firstPresent(report.whatIsStillUnknown, report.uncertainty, report.searchLimitations), 16),
      alternatives: listValues(firstPresent(report.alternativeIdentifications, report.alternatives, report.possibleIdentities), 12),
      requestedPhotos: listValues(firstPresent(report.requestedAdditionalPhotos, report.additionalPhotosNeeded, report.photosToAdd), 12),
      researchSteps: listValues(firstPresent(report.recommendedResearchSteps, report.whatToCheckNext, report.additionalInformationNeeded, report.bestNextStep), 16),
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
        row.textContent = cleanText(item, 500);
        list.appendChild(row);
      });
      section.appendChild(list);
    } else {
      const paragraph = document.createElement("p");
      paragraph.textContent = cleanText(value, 6000);
      section.appendChild(paragraph);
    }
    parent.appendChild(section);
  }

  function renderSavedListing(listing) {
    const snapshot = listing.snapshot || {};
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
    appendSnapshotSection(article, "Identification", [snapshot.title, snapshot.identification?.summary, snapshot.identification?.confidence ? `Confidence: ${snapshot.identification.confidence}` : ""]);
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
      title.textContent = "Comparable evidence";
      evidenceSection.appendChild(title);
      snapshot.evidence.forEach((record) => {
        const row = document.createElement("article");
        const rowTitle = document.createElement("h5");
        rowTitle.textContent = cleanText(record.title || record.source, 300);
        const rowCopy = document.createElement("p");
        rowCopy.textContent = [record.source, record.match, record.price, record.deliveredCost, record.availability, record.limitation].filter(Boolean).join(" · ");
        row.append(rowTitle, rowCopy);
        if (record.url) {
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
  hydrateSession();
})(globalThis);
