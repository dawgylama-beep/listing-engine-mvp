// The same report fields are sent to the live renderer and retained by history.
// Provider-source records are the acquisition ledger; a model-supplied URL is not.
const text = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const level = (value, fallback = "Insufficient") => {
  const normalized = text(typeof value === "object" ? value?.level : value).toLowerCase();
  if (/\bhigh\b|\bstrong\b/.test(normalized)) return "High";
  if (/\bmedium\b|\bmoderate\b/.test(normalized)) return "Medium";
  if (/\blow\b|\bweak\b/.test(normalized)) return "Low";
  return fallback;
};
const finiteCount = (value) => Number.isSafeInteger(value) && value >= 0 ? value : null;
const providerKey = (value) => {
  const normalized = text(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (normalized === "serper_google_search") return "serper_google";
  if (normalized === "openai_web_search" || normalized === "openai_websearch") return "openai_web_search";
  return normalized;
};

function urlKey(value) {
  try {
    const url = new URL(text(value));
    if (!/^https?:$/.test(url.protocol) || url.username || url.password) return "";
    url.hash = "";
    return url.href.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function acquisitionLedger(report) {
  const records = report.searchDiagnostics?.providerSourceRecords;
  return (Array.isArray(records) ? records : []).filter((record) => (
    urlKey(record?.canonicalUrl || record?.url)
    && text(record?.sourceRecordId)
    && providerKey(record?.acquisitionProvider || record?.provider || record?.providerKey)
  ));
}

function bindLink(record, ledger, { urlField = "url", id = "", claimedProvider = "" } = {}) {
  const url = urlKey(record?.[urlField]);
  if (!url) return null;
  const matches = ledger.filter((entry) => (
    urlKey(entry.canonicalUrl || entry.url) === url
    && (!id || text(entry.sourceRecordId) === id)
  ));
  const providers = new Set(matches.map((entry) => providerKey(entry.acquisitionProvider || entry.provider || entry.providerKey)));
  if (!matches.length || providers.size !== 1) return null;
  const provider = [...providers][0];
  if (claimedProvider && providerKey(claimedProvider) !== provider) return null;
  const sourceRecordIds = [...new Set(matches.map((entry) => text(entry.sourceRecordId)))].sort();
  const selected = [...matches].sort((left, right) => text(left.sourceRecordId).localeCompare(text(right.sourceRecordId)))[0];
  return {
    sourceRecordId: text(selected.sourceRecordId),
    sourceRecordIds,
    acquisitionProvider: provider,
    sourceUrl: text(record[urlField]),
    acquisitionUrl: text(selected.canonicalUrl || selected.url)
  };
}

export function bindCustomerSourceProvenance(report = {}) {
  const ledger = acquisitionLedger(report);
  const rejected = [];
  const bindResearch = (record) => {
    const url = text(record?.url || record?.canonicalUrl);
    if (!url) return record;
    const binding = bindLink({ url }, ledger, {
      id: text(record?.sourceRecordId),
      claimedProvider: text(record?.acquisitionProvider || record?.provider)
    });
    if (binding) return { ...record, sourceProvenance: binding, acquisitionProvider: binding.acquisitionProvider };
    rejected.push({ kind: "research", reason: "SOURCE_PROVENANCE_UNVERIFIED" });
    return { ...record, url: "", canonicalUrl: "", sourceBacked: "Source link unverified and withheld." };
  };
  const result = { ...report };
  for (const key of ["resultsFound", "strongComparables", "partialComparables", "itemIdentificationEvidence", "referenceResults", "weakMatches", "rejectedMatches"]) {
    if (Array.isArray(result[key])) result[key] = result[key].map(bindResearch);
  }
  if (Array.isArray(result.customerSourceFindings)) {
    result.customerSourceFindings = result.customerSourceFindings.flatMap((finding) => {
      const binding = bindLink(finding, ledger, {
        urlField: "destinationUrl",
        id: text(finding.sourceRecordId),
        claimedProvider: text(finding.acquisitionProvider)
      });
      if (binding) return [{ ...finding, sourceProvenance: binding }];
      rejected.push({ kind: "finding", reason: "SOURCE_PROVENANCE_UNVERIFIED" });
      return [];
    });
  }
  if (Array.isArray(result.customerEvidence)) {
    result.customerEvidence = result.customerEvidence.flatMap((card) => {
      const urlProvenance = card.provenance?.url;
      const provenanceId = text(urlProvenance?.sourceRecordId);
      const cardUrl = urlKey(card.destinationUrl);
      const observationIds = Array.isArray(card.sourceObservationIds) ? card.sourceObservationIds.map(text) : [];
      // Older canonical records use their source URL as the observation ID.
      // In that case, require a real acquisition ID in the same card's retained observations.
      const bindingIds = provenanceId && urlKey(provenanceId) !== cardUrl
        ? [provenanceId]
        : observationIds.filter((id) => id && urlKey(id) !== cardUrl);
      const binding = (bindingIds.length ? bindingIds : [""]).map((id) => bindLink(card, ledger, {
        urlField: "destinationUrl",
        id,
        claimedProvider: text(urlProvenance?.acquisitionProvider)
      })).find(Boolean);
      if (binding && (!observationIds.length || !observationIds.some((id) => urlKey(id) !== cardUrl)
        || observationIds.includes(binding.sourceRecordId))
        && (!urlProvenance?.sourceUrl || urlKey(urlProvenance.sourceUrl) === urlKey(binding.sourceUrl))) {
        return [{ ...card, sourceProvenance: binding }];
      }
      if (Number(card.canonicalPrice ?? card.price) > 0) {
        const error = new Error("A price-bearing customer source has no authenticated acquisition binding.");
        error.code = "SOURCE_PROVENANCE_BINDING_FAILED";
        throw error;
      }
      rejected.push({ kind: "customer_evidence", reason: "SOURCE_PROVENANCE_UNVERIFIED" });
      return [];
    });
    const cards = result.customerEvidence;
    const countBy = (key) => Object.fromEntries([...new Set(cards.map((card) => text(card[key])))].filter(Boolean)
      .map((value) => [value, cards.filter((card) => text(card[key]) === value).length]));
    result.customerEvidenceSummary = {
      ...(result.customerEvidenceSummary || {}),
      displayedIds: cards.map((card) => card.evidenceId),
      counts: { ...(result.customerEvidenceSummary?.counts || {}), displayed: cards.length },
      displayedCountByRetailer: countBy("sourceLabel"),
      displayedCountByPriceType: countBy("canonicalPriceType"),
      displayedCountByMatchClass: countBy("canonicalMatchLabel")
    };
    result.pricesFound = cards;
  }
  result.searchDiagnostics = {
    ...(result.searchDiagnostics || {}),
    customerSourceProvenance: { checked: true, rejectedCount: rejected.length, rejected }
  };
  return result;
}

export function buildCustomerConfidence(report = {}) {
  const canonical = report.confidenceResult?.identity || {};
  const exactIdentifier = Array.isArray(canonical.rationaleCodes)
    && canonical.rationaleCodes.includes("exact_identifier_support")
    && Array.isArray(canonical.supportingEvidenceIds)
    && canonical.supportingEvidenceIds.length > 0;
  const visibleLevel = level(report.subjectConfidence || report.visualSubjectConfidence, "Unclear");
  const requestedExactLevel = level(canonical.level || report.identificationConfidence || report.exactProductConfidence);
  const exactLevel = requestedExactLevel === "High" && !exactIdentifier ? "Medium" : requestedExactLevel;
  // Neither a photo nor model prose is an operational test of this unit.
  const workingLevel = "Insufficient";
  const valuationLevel = level(report.confidenceResult?.pricing?.level || report.pricingConfidence || report.valuationConfidence);
  const exactReason = exactIdentifier
    ? "Accepted evidence links an exact identifier to the photographed item."
    : "No accepted source establishes an exact matching identifier; maker, model, or variant still needs confirmation.";
  return {
    visibleCategory: { level: visibleLevel, explanation: "The photos support the visible item type, not every exact variant." },
    exactItem: { level: exactLevel, explanation: exactReason, acceptedExactIdentifier: exactIdentifier },
    workingCondition: { level: workingLevel, explanation: "Appearance alone does not establish whether the item works." },
    valuation: { level: valuationLevel, explanation: valuationLevel === "Insufficient" || valuationLevel === "Low"
      ? "Compatible transaction evidence did not establish a reliable value."
      : "Value is limited to qualifying compatible price evidence." }
  };
}

export function buildCustomerMetering(report = {}) {
  const budget = report.searchDiagnostics?.modelExecutionBudget || {};
  const search = report.searchDiagnostics || {};
  const totalProviderBound = Number.isFinite(budget.maximumTotalProviderSpendingDollars)
    && Number.isFinite(budget.serperReservedSpendingDollars)
    && Number.isFinite(budget.reservedSpendingDollars)
    && Number.isFinite(budget.maximumSpendingDollars)
    && Number.isFinite(budget.serperAttemptReservationDollars)
    && Number.isSafeInteger(budget.serperAttemptCount)
    && Number.isSafeInteger(budget.maximumSerperAttempts)
    && budget.serperAttemptCount >= 0
    && budget.serperAttemptCount <= budget.maximumSerperAttempts
    && budget.maximumSpendingDollars + budget.serperReservedSpendingDollars <= budget.maximumTotalProviderSpendingDollars + 1e-8
    && budget.reservedSpendingDollars + budget.serperReservedSpendingDollars <= budget.maximumTotalProviderSpendingDollars + 1e-8
    && Math.abs(budget.serperReservedSpendingDollars
      - budget.maximumSerperAttempts * budget.serperAttemptReservationDollars) <= 1e-8;
  const observations = Array.isArray(budget.observations) ? budget.observations : [];
  const reportedTokens = observations.reduce((totals, observation) => {
    const usage = observation?.reportedTokens || {};
    for (const key of ["inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens"]) {
      const count = finiteCount(usage[key]);
      if (count !== null) totals[key] = (totals[key] || 0) + count;
    }
    return totals;
  }, {});
  return {
    generationRequests: finiteCount(budget.modelGenerationRequestCount),
    tokenCountRequests: finiteCount(budget.inputTokenCountRequestCount),
    searchProviderAttempts: finiteCount(budget.serperAttemptCount ?? search.physicalProviderAttemptCount ?? search.serperCallsAttempted),
    searchToolCalls: finiteCount(budget.webSearchToolCallCount),
    directPageAttempts: finiteCount(search.physicalDirectPageAttemptCount),
    reportedTokens,
    requestObservations: observations.map((observation) => ({
      purpose: text(observation?.purpose),
      status: text(observation?.status),
      reportedTokens: Object.fromEntries(["inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens"]
        .map((key) => [key, finiteCount(observation?.reportedTokens?.[key])])
        .filter(([, count]) => count !== null))
    })),
    modelReservedUpperBoundDollars: Number.isFinite(budget.reservedSpendingDollars) ? budget.reservedSpendingDollars : null,
    serperReservedUpperBoundDollars: totalProviderBound ? budget.serperReservedSpendingDollars : null,
    serperAttemptCeiling: totalProviderBound ? budget.maximumSerperAttempts : null,
    serperAttemptRecords: totalProviderBound && Array.isArray(budget.serperAttempts)
      ? budget.serperAttempts.map((attempt) => ({
        ordinal: finiteCount(attempt?.ordinal),
        status: text(attempt?.status),
        conservativeExposureDollars: Number.isFinite(attempt?.conservativeExposureDollars)
          ? attempt.conservativeExposureDollars : null,
        exactBilledDollars: null
      })) : [],
    reservedUpperBoundDollars: totalProviderBound
      ? budget.reservedSpendingDollars + budget.serperReservedSpendingDollars
      : Number.isFinite(budget.reservedSpendingDollars) ? budget.reservedSpendingDollars : null,
    reservationScope: totalProviderBound ? "TOTAL_PROVIDER_CONSERVATIVE_EXPOSURE" : "MODEL_EXECUTION_ONLY_NOT_TOTAL_PROVIDER_BILLING",
    maximumAuthorizedDollars: totalProviderBound ? budget.maximumTotalProviderSpendingDollars
      : Number.isFinite(budget.maximumSpendingDollars) ? budget.maximumSpendingDollars : null,
    exactBilledDollars: null,
    billingStatus: "UNKNOWN"
  };
}

export function finalizeCustomerReportIntegrity(report = {}) {
  const bound = bindCustomerSourceProvenance(report);
  const confidence = buildCustomerConfidence(bound);
  const visibleConfidence = `Visible-item confidence: ${confidence.visibleCategory.level} — ${confidence.visibleCategory.explanation}`;
  const identitySummary = text(bound.identitySummary).replace(
    /(?:Subject Confidence|Visible-item confidence)\s*:\s*[^|]*/gi,
    visibleConfidence
  );
  const suppliedExactDetail = text(bound.customerConfidenceSummary?.exactItem)
    .replace(/^Exact item:\s*(?:High|Medium|Low|Insufficient|Unclear)\s*[—-]?\s*/i, "");
  return {
    ...bound,
    identitySummary,
    identificationConfidence: `${confidence.exactItem.level} — ${confidence.exactItem.explanation}`,
    itemIdentificationConfidence: `${confidence.exactItem.level} — ${confidence.exactItem.explanation}`,
    exactProductConfidence: `${confidence.exactItem.level} — ${confidence.exactItem.explanation}`,
    customerConfidence: confidence,
    customerConfidenceSummary: {
      photoMatch: `Visible item: ${confidence.visibleCategory.level} — ${confidence.visibleCategory.explanation}`,
      exactItem: `Exact item: ${confidence.exactItem.level} — ${suppliedExactDetail ? `${suppliedExactDetail} ` : ""}${confidence.exactItem.explanation}`,
      workingCondition: `Working condition: ${confidence.workingCondition.level} — ${confidence.workingCondition.explanation}`,
      priceSupport: `Valuation: ${confidence.valuation.level} — ${confidence.valuation.explanation}`
    },
    customerMetering: buildCustomerMetering(bound)
  };
}
