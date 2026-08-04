import {
  CANONICAL_BADGE_DEFINITIONS,
  CANONICAL_CONFIDENCE_LEVELS,
  CANONICAL_DECISION_CODES
} from "./decisions.js";
import {
  CANONICAL_BUYER_OFFER_APPLICABILITY,
  CANONICAL_BUYER_OFFER_GUIDANCE_CODES,
  CANONICAL_BUYER_OFFER_STATUSES,
  CANONICAL_USER_ENTERED_PRICE_ROLES
} from "./offer.js";
import { hasVerifiedObjectMindExactness } from "./finalize.js";

const REQUIRED_FIELDS = Object.freeze([
  "schemaVersion",
  "analysisId",
  "analysisMode",
  "targetIdentity",
  "records",
  "acceptedRecords",
  "rejectedRecords",
  "views",
  "counts",
  "diagnostics",
  "rangeResult",
  "rangeResults",
  "retailLimitResult",
  "decisionResult",
  "confidenceResult",
  "badgeResult",
  "buyerOfferResult",
  "customerEvidence",
  "customerEvidenceSummary"
]);

const REQUIRED_VIEWS = Object.freeze([
  "acceptedIds",
  "customerEligibleIds",
  "displayEligibleIds",
  "displayedIds",
  "rangeEligibleIds",
  "decisionEligibleIds",
  "priceBearingIds",
  "exactMatchIds",
  "rejectedDiagnosticOnlyIds"
]);

const CUSTOMER_MATCH_CODES = Object.freeze({
  Exact: "exact",
  "Strong compatible": "strong_compatible",
  Compatible: "compatible"
});

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`FinalEvidenceResult invariant failed: ${message}`);
  }
}

function sameIdSet(left = [], right = []) {
  return left.length === right.length
    && left.every((id) => right.includes(id));
}

function sameIdOrder(left = [], right = []) {
  return left.length === right.length
    && left.every((id, index) => id === right[index]);
}

function canonicalSource(record = {}) {
  return String(record.retailer || record.marketplace || record.source || record.sourceDomain || "").trim()
    || "Source not identified";
}

function composition(records = [], field) {
  return records.reduce((counts, record) => {
    const key = String(record[field] || "").trim() || "Not identified";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateCustomerEvidence(result, recordById, rejected) {
  invariant(Array.isArray(result.customerEvidence), "customerEvidence must be an array");
  const ids = result.customerEvidence.map((record, index) => {
    invariant(record && typeof record === "object", `customerEvidence[${index}] must be an object`);
    invariant(record.evidenceId, `customerEvidence[${index}] is missing evidenceId`);
    return record.evidenceId;
  });
  invariant(sameIdOrder(ids, result.views.displayedIds), "customerEvidence IDs or order do not exactly match views.displayedIds");
  invariant(new Set(ids).size === ids.length, "customerEvidence contains duplicate evidenceId values");

  const badgeSupportIds = new Set(result.badgeResult.supportingEvidenceIds || []);
  for (const serialized of result.customerEvidence) {
    const id = serialized.evidenceId;
    const canonical = recordById.get(id);
    invariant(canonical, `customerEvidence contains unknown evidence ID ${id}`);
    invariant(!rejected.has(id), `rejected evidence ID ${id} appears in customerEvidence`);
    invariant(serialized.underlyingOfferId === canonical.underlyingOfferId, `customerEvidence ${id} underlyingOfferId conflicts with canonical record`);
    invariant(
      serialized.title === (String(canonical.title || "Source result").replace(/\s+/g, " ").trim()),
      `customerEvidence ${id} title conflicts with canonical record`
    );
    invariant(serialized.sourceLabel === canonicalSource(canonical), `customerEvidence ${id} retailer conflicts with canonical record`);
    invariant(serialized.canonicalUrl === canonical.canonicalUrl, `customerEvidence ${id} canonical URL conflicts with canonical record`);
    invariant(serialized.destinationUrl === canonical.canonicalUrl, `customerEvidence ${id} destination URL conflicts with canonical record`);
    invariant(serialized.canonicalPrice === canonical.price, `customerEvidence ${id} price conflicts with canonical record`);
    invariant(serialized.canonicalPriceType === canonical.priceType, `customerEvidence ${id} price type conflicts with canonical record`);
    invariant(serialized.quantity === canonical.quantity, `customerEvidence ${id} quantity conflicts with canonical record`);
    invariant(serialized.canonicalMatchLabel === canonical.canonicalMatchQuality, `customerEvidence ${id} match classification conflicts with canonical record`);
    invariant(
      serialized.canonicalMatchCode === CUSTOMER_MATCH_CODES[canonical.canonicalMatchQuality],
      `customerEvidence ${id} canonical match code conflicts with canonical record`
    );
    invariant(serialized.customerEligible === result.views.customerEligibleIds.includes(id), `customerEvidence ${id} customer eligibility conflicts with canonical view`);
    invariant(serialized.displayEligible === result.views.displayEligibleIds.includes(id), `customerEvidence ${id} display eligibility conflicts with canonical view`);
    invariant(serialized.rangeEligible === result.views.rangeEligibleIds.includes(id), `customerEvidence ${id} range eligibility conflicts with canonical view`);
    invariant(serialized.decisionEligible === result.views.decisionEligibleIds.includes(id), `customerEvidence ${id} decision eligibility conflicts with canonical view`);
    if (canonical.price === null) {
      invariant(serialized.customerPriceLabel === "Price unavailable", `customerEvidence ${id} exact no-price semantics are not Price unavailable`);
    }
    const expectsBadge = result.badgeResult.eligibility === "eligible" && badgeSupportIds.has(id);
    invariant(
      serialized.cardBadgeCode === (expectsBadge ? result.badgeResult.code : null),
      `customerEvidence ${id} card badge code conflicts with canonical badge`
    );
    invariant(
      serialized.cardBadgeLabel === (expectsBadge ? result.badgeResult.label : null),
      `customerEvidence ${id} card badge label conflicts with canonical badge`
    );
    invariant(
      sameJson(serialized.cardBadge, expectsBadge
        ? { code: result.badgeResult.code, label: result.badgeResult.label }
        : null),
      `customerEvidence ${id} card badge object conflicts with canonical badge`
    );
  }

  const summary = result.customerEvidenceSummary;
  invariant(summary && typeof summary === "object", "customerEvidenceSummary must be an object");
  const summaryViews = {
    acceptedIds: "acceptedIds",
    customerEligibleIds: "customerEligibleIds",
    displayEligibleIds: "displayEligibleIds",
    displayedIds: "displayedIds",
    rangeEligibleIds: "rangeEligibleIds",
    decisionEligibleIds: "decisionEligibleIds",
    priceBearingIds: "priceBearingIds",
    exactMatchIds: "exactMatchIds",
    rejectedIds: "rejectedDiagnosticOnlyIds"
  };
  for (const [summaryName, viewName] of Object.entries(summaryViews)) {
    invariant(Array.isArray(summary[summaryName]), `customerEvidenceSummary.${summaryName} must be an array`);
    invariant(
      sameIdOrder(summary[summaryName], result.views[viewName]),
      `customerEvidenceSummary.${summaryName} does not match views.${viewName}`
    );
  }
  const expectedCounts = {
    accepted: summary.acceptedIds.length,
    customerEligible: summary.customerEligibleIds.length,
    displayEligible: summary.displayEligibleIds.length,
    displayed: summary.displayedIds.length,
    rangeEligible: summary.rangeEligibleIds.length,
    decisionEligible: summary.decisionEligibleIds.length,
    priceBearing: summary.priceBearingIds.length,
    exactMatch: summary.exactMatchIds.length,
    rejected: summary.rejectedIds.length,
    finalizedRecords: result.records.length
  };
  invariant(sameJson(summary.counts, expectedCounts), "customerEvidenceSummary.counts do not equal canonical ID-array lengths");
  invariant(
    sameJson(summary.displayedCountByRetailer, composition(result.customerEvidence, "sourceLabel")),
    "customerEvidenceSummary retailer composition does not match customerEvidence"
  );
  invariant(
    sameJson(summary.displayedCountByPriceType, composition(result.customerEvidence, "canonicalPriceType")),
    "customerEvidenceSummary price-type composition does not match customerEvidence"
  );
  invariant(
    sameJson(summary.displayedCountByMatchClass, composition(result.customerEvidence, "canonicalMatchLabel")),
    "customerEvidenceSummary match-class composition does not match customerEvidence"
  );
  invariant(result.counts.customerEvidenceCount === ids.length, "count customerEvidenceCount does not equal customerEvidence.length");
}

export function validateCustomerEvidenceCompatibilityProjection(customerEvidence = [], report = {}) {
  const removedFields = [
    ["best", "Compatible", "Price", "Found"].join(""),
    ["other", "Compatible", "Prices", "Found"].join(""),
    ["best", "Current", "Retail", "Alternative"].join(""),
    ["other", "Current", "Retail", "Prices"].join("")
  ];
  for (const field of removedFields) {
    invariant(!Object.hasOwn(report, field), `removed legacy evidence field ${field} must not be emitted`);
  }
  invariant(Array.isArray(report.pricesFound), "pricesFound compatibility projection must be an array");
  const canonicalById = new Map(customerEvidence.map((record) => [record.evidenceId, record]));
  const projectionIds = report.pricesFound.map((record, index) => {
    invariant(record && typeof record === "object", `pricesFound[${index}] contains a non-record value`);
    invariant(record.evidenceId, `pricesFound[${index}] is missing evidenceId`);
    return record.evidenceId;
  });
  for (const record of report.pricesFound) {
    const canonical = canonicalById.get(record.evidenceId);
    invariant(canonical, `pricesFound contains unknown evidence ID ${record.evidenceId}`);
    invariant(
      sameJson(record, canonical),
      `pricesFound fields conflict with canonical customerEvidence record ${record.evidenceId}`
    );
  }
  invariant(new Set(projectionIds).size === projectionIds.length, "pricesFound compatibility projection contains duplicate evidence IDs");
  invariant(
    sameIdOrder(projectionIds, customerEvidence.map((record) => record.evidenceId)),
    "pricesFound compatibility projection IDs or order do not exactly match customerEvidence"
  );
  return report;
}

function scanSerializableValue(value, path = "result", seen = new Set()) {
  const valueType = typeof value;
  if (!value || valueType !== "object") {
    if (valueType === "string") {
      invariant(!/\bBearer\s+[A-Za-z0-9._~+/-]{8,}/i.test(value), `${path} contains an authorization value`);
      invariant(!/\b(?:sk|ghp|github_pat)-?[A-Za-z0-9_-]{20,}\b/i.test(value), `${path} contains a secret-shaped value`);
      invariant(!/\b(?:OPENAI_API_KEY|OPEN_API_KEY|SERPER_API_KEY|Authorization)\s*[:=]\s*\S+/i.test(value), `${path} contains a serialized credential or environment value`);
    }
    return;
  }
  invariant(!seen.has(value), `${path} contains a circular reference`);
  seen.add(value);
  for (const [key, child] of Object.entries(value)) {
    invariant(
      !/(?:authorization|cookie|password|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|processEnv|runtimeEnv|environmentVariables?)/i.test(key),
      `${path}.${key} is a secret-bearing field`
    );
    scanSerializableValue(child, `${path}.${key}`, seen);
  }
  seen.delete(value);
}

const RANGE_PRICE_TYPES = Object.freeze({
  current_retail: new Set(["Current retail price"]),
  active_asking: new Set(["Active asking price", "Buy It Now"]),
  verified_sold: new Set(["Verified sold", "Completed auction"])
});

function validateSupportIds({ support, label, recordById, accepted, rejected, eligibleIds, requiredPriceTypes = null }) {
  invariant(support && typeof support === "object", `${label} must be an object`);
  invariant(Array.isArray(support.evidenceIds), `${label}.evidenceIds must be an array`);
  invariant(Array.isArray(support.underlyingOfferIds), `${label}.underlyingOfferIds must be an array`);
  invariant(new Set(support.evidenceIds).size === support.evidenceIds.length, `${label}.evidenceIds contains a duplicate ID`);
  invariant(new Set(support.underlyingOfferIds).size === support.underlyingOfferIds.length, `${label}.underlyingOfferIds contains a duplicate ID`);
  invariant(support.evidenceIds.length === support.underlyingOfferIds.length, `${label} evidence and underlying-offer ID counts differ`);
  invariant(support.independentOfferCount === support.underlyingOfferIds.length, `${label}.independentOfferCount does not equal unique underlying-offer count`);
  if (Object.hasOwn(support, "evidenceCount")) {
    invariant(support.evidenceCount === support.evidenceIds.length, `${label}.evidenceCount does not equal evidenceIds.length`);
  }
  support.evidenceIds.forEach((id, index) => {
    const record = recordById.get(id);
    invariant(record, `${label} contains unknown evidence ID ${id}`);
    invariant(accepted.has(id), `${label} contains non-accepted evidence ID ${id}`);
    invariant(!rejected.has(id), `${label} contains rejected evidence ID ${id}`);
    invariant(record.underlyingOfferId === support.underlyingOfferIds[index], `${label} underlyingOfferId does not match evidence ID ${id}`);
    invariant(Number.isFinite(record.price) && record.price > 0, `${label} contains price-unavailable evidence ID ${id}`);
    if (eligibleIds) {
      invariant(eligibleIds.has(id), `${label} contains ineligible support evidence ID ${id}`);
    }
    if (requiredPriceTypes) {
      invariant(requiredPriceTypes.has(record.priceType), `${label} evidence ID ${id} has incompatible price type ${record.priceType}`);
    }
  });
}

function validateRangeSupport({ support, label, recordById, accepted, rejected, rangeEligible }) {
  const requiredPriceTypes = RANGE_PRICE_TYPES[support?.priceType] || null;
  validateSupportIds({
    support,
    label,
    recordById,
    accepted,
    rejected,
    eligibleIds: rangeEligible,
    requiredPriceTypes
  });
  invariant(["established", "single_observation", "insufficient"].includes(support.status), `${label} has invalid status ${support.status}`);
  if (support.status === "established") {
    invariant(support.independentOfferCount >= 2, `${label} numerical range has fewer than two independent offers`);
    invariant(Number.isFinite(support.low) && Number.isFinite(support.high), `${label} established range is missing numerical low/high`);
    invariant(support.low <= support.high, `${label} low is greater than high`);
    invariant(support.observedPrice === null, `${label} established range must not expose one observed price`);
  } else if (support.status === "single_observation") {
    invariant(support.independentOfferCount === 1, `${label} single-observation status does not have exactly one independent offer`);
    invariant(support.low === null && support.high === null, `${label} one-observation result must not contain numerical low/high`);
    invariant(Number.isFinite(support.observedPrice) && support.observedPrice > 0, `${label} one-observation result is missing observedPrice`);
    invariant(support.observedEvidenceId === support.evidenceIds[0], `${label} observedEvidenceId does not match its sole support ID`);
    invariant(support.observedUnderlyingOfferId === support.underlyingOfferIds[0], `${label} observedUnderlyingOfferId does not match its sole offer ID`);
  } else {
    invariant(support.independentOfferCount === 0, `${label} insufficient status has supporting offers`);
    invariant(support.low === null && support.high === null, `${label} insufficient status must not contain numerical low/high`);
    invariant(support.observedPrice === null, `${label} zero-observation result must not contain observedPrice`);
    invariant(Boolean(support.insufficiencyReason), `${label} insufficient status is missing insufficiencyReason`);
  }
}

function validateCanonicalIdSupport({
  support,
  label,
  recordById,
  accepted,
  rejected,
  decisionEligible = null,
  requirePrice = false,
  requireExactIdentity = false
}) {
  invariant(support && typeof support === "object", `${label} must be an object`);
  invariant(Array.isArray(support.supportingEvidenceIds), `${label}.supportingEvidenceIds must be an array`);
  invariant(Array.isArray(support.supportingUnderlyingOfferIds), `${label}.supportingUnderlyingOfferIds must be an array`);
  invariant(
    new Set(support.supportingEvidenceIds).size === support.supportingEvidenceIds.length,
    `${label}.supportingEvidenceIds contains a duplicate ID`
  );
  invariant(
    new Set(support.supportingUnderlyingOfferIds).size === support.supportingUnderlyingOfferIds.length,
    `${label}.supportingUnderlyingOfferIds contains a duplicate ID`
  );
  invariant(
    support.supportingEvidenceIds.length === support.supportingUnderlyingOfferIds.length,
    `${label} evidence and underlying-offer ID counts differ`
  );
  support.supportingEvidenceIds.forEach((id, index) => {
    const record = recordById.get(id);
    invariant(record, `${label} contains unknown evidence ID ${id}`);
    invariant(accepted.has(id), `${label} contains non-accepted evidence ID ${id}`);
    invariant(!rejected.has(id), `${label} contains rejected evidence ID ${id}`);
    invariant(
      record.underlyingOfferId === support.supportingUnderlyingOfferIds[index],
      `${label} underlyingOfferId does not match evidence ID ${id}`
    );
    if (decisionEligible) {
      invariant(decisionEligible.has(id), `${label} contains non-decision-eligible evidence ID ${id}`);
    }
    if (requirePrice) {
      invariant(Number.isFinite(record.price) && record.price > 0, `${label} contains non-priced evidence ID ${id}`);
    }
    if (requireExactIdentity) {
      invariant(record.exactIdentity === true, `${label} contains non-exact identity evidence ID ${id}`);
    }
  });
}

export function validateFinalEvidenceResult(result) {
  invariant(result && typeof result === "object" && !Array.isArray(result), "result must be an object");
  for (const field of REQUIRED_FIELDS) {
    invariant(Object.hasOwn(result, field), `missing top-level field ${field}`);
  }
  invariant(Array.isArray(result.records), "records must be an array");
  invariant(Array.isArray(result.acceptedRecords), "acceptedRecords must be an array");
  invariant(Array.isArray(result.rejectedRecords), "rejectedRecords must be an array");
  invariant(result.views && typeof result.views === "object", "views must be an object");
  invariant(result.counts && typeof result.counts === "object", "counts must be an object");
  invariant(result.diagnostics && typeof result.diagnostics === "object", "diagnostics must be an object");

  scanSerializableValue(result);
  try {
    JSON.stringify(result);
  } catch (error) {
    throw new Error(`FinalEvidenceResult invariant failed: result is not serializable: ${error.message}`);
  }

  const recordIds = result.records.map((record, index) => {
    invariant(record && typeof record === "object", `records[${index}] must be an object`);
    invariant(record.evidenceId, `records[${index}] is missing evidenceId`);
    invariant(record.underlyingOfferId, `record ${record.evidenceId} is missing underlyingOfferId`);
    return record.evidenceId;
  });
  invariant(new Set(recordIds).size === recordIds.length, "records contain duplicate evidenceId values");
  const allIds = new Set(recordIds);
  const collectionIds = (name) => result[name].map((record, index) => {
    invariant(record && record.evidenceId, `${name}[${index}] is missing evidenceId`);
    return record.evidenceId;
  });
  const acceptedRecordIds = collectionIds("acceptedRecords");
  const rejectedRecordIds = collectionIds("rejectedRecords");
  invariant(new Set(acceptedRecordIds).size === acceptedRecordIds.length, "acceptedRecords contain duplicate evidenceId values");
  invariant(new Set(rejectedRecordIds).size === rejectedRecordIds.length, "rejectedRecords contain duplicate evidenceId values");

  for (const viewName of REQUIRED_VIEWS) {
    const ids = result.views[viewName];
    invariant(Array.isArray(ids), `view ${viewName} must be an ID array`);
    invariant(new Set(ids).size === ids.length, `view ${viewName} contains a duplicate ID`);
    for (const id of ids) {
      invariant(allIds.has(id), `view ${viewName} contains unknown ID ${id}`);
    }
    const countName = viewName.replace(/Ids$/, "Count");
    invariant(result.counts[countName] === ids.length, `count ${countName} does not equal ${viewName}.length`);
  }

  const accepted = new Set(result.views.acceptedIds);
  const customer = new Set(result.views.customerEligibleIds);
  const displayEligible = new Set(result.views.displayEligibleIds);
  const rejected = new Set(result.views.rejectedDiagnosticOnlyIds);
  const rangeEligible = new Set(result.views.rangeEligibleIds);
  const decisionEligible = new Set(result.views.decisionEligibleIds);
  const recordById = new Map(result.records.map((record) => [record.evidenceId, record]));
  for (const record of result.records) {
    const exact = record.exactIdentity === true || record.canonicalMatchQuality === "Exact";
    invariant(
      !exact || hasVerifiedObjectMindExactness(record),
      `record ${record.evidenceId} is Exact without verified Object Mind exactness`
    );
  }
  invariant(sameIdSet(acceptedRecordIds, result.views.acceptedIds), "acceptedRecords IDs do not match acceptedIds");
  invariant(sameIdSet(rejectedRecordIds, result.views.rejectedDiagnosticOnlyIds), "rejectedRecords IDs do not match rejectedDiagnosticOnlyIds");
  invariant(
    sameIdSet([...acceptedRecordIds, ...rejectedRecordIds], recordIds),
    "records do not exactly contain acceptedRecords and rejectedRecords"
  );
  for (const id of rejected) {
    for (const viewName of ["acceptedIds", "customerEligibleIds", "displayEligibleIds", "displayedIds", "rangeEligibleIds", "decisionEligibleIds"]) {
      invariant(!result.views[viewName].includes(id), `rejected ID ${id} appears in ${viewName}`);
    }
  }
  for (const id of result.views.displayedIds) {
    invariant(displayEligible.has(id), `displayed ID ${id} is not display-eligible`);
    invariant(customer.has(id), `displayed ID ${id} is not customer-eligible`);
  }
  for (const viewName of ["customerEligibleIds", "displayEligibleIds", "displayedIds", "rangeEligibleIds", "decisionEligibleIds", "priceBearingIds", "exactMatchIds"]) {
    for (const id of result.views[viewName]) {
      invariant(accepted.has(id), `${viewName} ID ${id} is not accepted evidence`);
    }
  }
  validateCustomerEvidence(result, recordById, rejected);

  for (const [name, support] of Object.entries(result.rangeResults || {})) {
    validateRangeSupport({
      support,
      label: `rangeResults.${name}`,
      recordById,
      accepted,
      rejected,
      rangeEligible
    });
  }
  validateRangeSupport({
    support: result.rangeResult,
    label: "rangeResult",
    recordById,
    accepted,
    rejected,
    rangeEligible
  });
  invariant(result.counts.rangeSupportCount === result.rangeResult.evidenceIds.length, "count rangeSupportCount does not equal rangeResult.evidenceIds.length");
  const selectedGroup = Object.values(result.rangeResults).find((support) => support.priceType === result.rangeResult.priceType);
  const composition = result.rangeResult.priceTypeComposition || {};
  invariant(composition.currentRetail === result.rangeResults.currentRetail.independentOfferCount, "rangeResult priceTypeComposition.currentRetail disagrees with canonical current-retail support");
  invariant(composition.activeAsking === result.rangeResults.activeAsking.independentOfferCount, "rangeResult priceTypeComposition.activeAsking disagrees with canonical active-asking support");
  invariant(composition.verifiedSold === result.rangeResults.verifiedSold.independentOfferCount, "rangeResult priceTypeComposition.verifiedSold disagrees with canonical verified-sold support");
  if (result.rangeResult.priceType !== "none") {
    invariant(selectedGroup, `rangeResult price type ${result.rangeResult.priceType} has no canonical group`);
    invariant(sameIdSet(selectedGroup.evidenceIds, result.rangeResult.evidenceIds), "rangeResult support IDs do not match its canonical price-type group");
    invariant(selectedGroup.status === result.rangeResult.status, "rangeResult status does not match its canonical price-type group");
  }

  const retailLimit = result.retailLimitResult;
  validateSupportIds({
    support: retailLimit,
    label: "retailLimitResult",
    recordById,
    accepted,
    rejected,
    eligibleIds: decisionEligible,
    requiredPriceTypes: RANGE_PRICE_TYPES.current_retail
  });
  invariant(["established", "insufficient"].includes(retailLimit.status), `retailLimitResult has invalid status ${retailLimit.status}`);
  invariant(result.counts.retailLimitSupportCount === retailLimit.evidenceIds.length, "count retailLimitSupportCount does not equal retailLimitResult.evidenceIds.length");
  if (retailLimit.status === "established") {
    invariant(retailLimit.independentOfferCount >= 1, "retailLimitResult established status has no independent offer");
    invariant(Number.isFinite(retailLimit.amount) && retailLimit.amount > 0, "retailLimitResult established status has no numerical amount");
    invariant(retailLimit.evidenceIds.includes(retailLimit.selectedEvidenceId), `retailLimitResult selected evidence ID ${retailLimit.selectedEvidenceId} is not in support IDs`);
    invariant(retailLimit.underlyingOfferIds.includes(retailLimit.selectedUnderlyingOfferId), `retailLimitResult selected underlying-offer ID ${retailLimit.selectedUnderlyingOfferId} is not in support IDs`);
  } else {
    invariant(retailLimit.independentOfferCount === 0, "retailLimitResult insufficient status has supporting offers");
    invariant(retailLimit.amount === null, "retailLimitResult insufficient status must not contain an amount");
    invariant(Boolean(retailLimit.insufficiencyReason), "retailLimitResult insufficient status is missing insufficiencyReason");
  }

  const decisionResult = result.decisionResult;
  invariant(decisionResult && typeof decisionResult === "object", "decisionResult must be an object");
  invariant(
    ["insufficient", "conditional", "unfavorable", "assessment_only", "seller_support"].includes(decisionResult.status),
    `decisionResult has invalid status ${decisionResult.status}`
  );
  invariant(
    CANONICAL_DECISION_CODES.includes(decisionResult.recommendationCode),
    `decisionResult has invalid recommendationCode ${decisionResult.recommendationCode}`
  );
  invariant(
    ["personal", "resale", "owner_value", "seller_listing"].includes(decisionResult.purpose),
    `decisionResult has invalid purpose ${decisionResult.purpose}`
  );
  invariant(Array.isArray(decisionResult.rationaleCodes), "decisionResult.rationaleCodes must be an array");
  invariant(Array.isArray(decisionResult.rangeSupportIds), "decisionResult.rangeSupportIds must be an array");
  invariant(Array.isArray(decisionResult.retailLimitSupportIds), "decisionResult.retailLimitSupportIds must be an array");
  invariant(Array.isArray(decisionResult.insufficiencyReasons), "decisionResult.insufficiencyReasons must be an array");
  invariant(Array.isArray(decisionResult.contradictions), "decisionResult.contradictions must be an array");
  validateCanonicalIdSupport({
    support: decisionResult,
    label: "decisionResult",
    recordById,
    accepted,
    rejected,
    decisionEligible
  });
  invariant(
    sameIdSet(decisionResult.rangeSupportIds, result.rangeResult.evidenceIds),
    "decisionResult.rangeSupportIds do not match rangeResult.evidenceIds"
  );
  invariant(
    sameIdSet(decisionResult.retailLimitSupportIds, result.retailLimitResult.evidenceIds),
    "decisionResult.retailLimitSupportIds do not match retailLimitResult.evidenceIds"
  );
  invariant(
    result.counts.decisionSupportCount === decisionResult.supportingEvidenceIds.length,
    "count decisionSupportCount does not equal decisionResult.supportingEvidenceIds.length"
  );
  const comparison = decisionResult.canonicalComparisonResult;
  invariant(comparison && typeof comparison === "object", "decisionResult.canonicalComparisonResult must be an object");
  validateCanonicalIdSupport({
    support: comparison,
    label: "decisionResult.canonicalComparisonResult",
    recordById,
    accepted,
    rejected,
    decisionEligible
  });
  invariant(
    sameIdSet(comparison.supportingEvidenceIds, decisionResult.supportingEvidenceIds),
    "decisionResult comparison support IDs do not match decision support IDs"
  );

  const confidenceResult = result.confidenceResult;
  invariant(confidenceResult && typeof confidenceResult === "object", "confidenceResult must be an object");
  for (const confidenceType of ["identity", "pricing"]) {
    const confidence = confidenceResult[confidenceType];
    invariant(confidence && typeof confidence === "object", `confidenceResult.${confidenceType} must be an object`);
    invariant(
      CANONICAL_CONFIDENCE_LEVELS.includes(confidence.level),
      `confidenceResult.${confidenceType} has invalid level ${confidence.level}`
    );
    invariant(Array.isArray(confidence.rationaleCodes), `confidenceResult.${confidenceType}.rationaleCodes must be an array`);
    invariant(Array.isArray(confidence.weakeningFactors), `confidenceResult.${confidenceType}.weakeningFactors must be an array`);
    validateCanonicalIdSupport({
      support: confidence,
      label: `confidenceResult.${confidenceType}`,
      recordById,
      accepted,
      rejected,
      decisionEligible: confidenceType === "pricing" ? decisionEligible : null,
      requirePrice: confidenceType === "pricing"
    });
  }
  if (result.views.exactMatchIds.length && confidenceResult.identity.supportingEvidenceIds.length) {
    for (const id of confidenceResult.identity.supportingEvidenceIds) {
      invariant(recordById.get(id)?.exactIdentity === true, `confidenceResult.identity contains non-exact identity evidence ID ${id} while exact support exists`);
    }
  }
  invariant(
    result.counts.identityConfidenceSupportCount === confidenceResult.identity.supportingEvidenceIds.length,
    "count identityConfidenceSupportCount does not equal identity confidence support length"
  );
  invariant(
    result.counts.pricingConfidenceSupportCount === confidenceResult.pricing.supportingEvidenceIds.length,
    "count pricingConfidenceSupportCount does not equal pricing confidence support length"
  );
  if (!confidenceResult.pricing.supportingEvidenceIds.length) {
    invariant(confidenceResult.pricing.level === "insufficient", "no-priced-evidence state must have insufficient pricing confidence");
  }
  const pricingSupportCount = confidenceResult.pricing.supportingUnderlyingOfferIds.length;
  const pricingRationaleByLevel = {
    insufficient: ["no_qualified_priced_evidence"],
    low: ["one_independent_priced_offer"],
    medium: ["multiple_independent_current_retail_offers", "multiple_independent_active_asking_offers"],
    high: ["multiple_independent_verified_sales", "multiple_independent_current_retail_offers"]
  };
  invariant(
    confidenceResult.pricing.rationaleCodes.some((code) => pricingRationaleByLevel[confidenceResult.pricing.level].includes(code)),
    `confidenceResult.pricing rationaleCodes disagree with level ${confidenceResult.pricing.level}`
  );
  if (confidenceResult.pricing.level === "low") {
    invariant(pricingSupportCount === 1, "low pricing confidence must have exactly one independent priced offer");
  }
  if (["medium", "high"].includes(confidenceResult.pricing.level)) {
    invariant(pricingSupportCount >= 2, `${confidenceResult.pricing.level} pricing confidence requires at least two independent priced offers`);
  }
  const oneActiveAskingWithoutSold = result.analysisMode !== "retail"
    && result.rangeResults.activeAsking.status === "single_observation"
    && result.rangeResults.verifiedSold.independentOfferCount === 0;
  if (oneActiveAskingWithoutSold) {
    invariant(
      ["insufficient", "low"].includes(confidenceResult.pricing.level),
      "one active asking price without sold evidence cannot produce established pricing confidence"
    );
    invariant(
      !confidenceResult.pricing.rationaleCodes.includes("established_market"),
      "one active asking price without sold evidence cannot produce established-market rationale"
    );
  }

  const badgeResult = result.badgeResult;
  invariant(badgeResult && typeof badgeResult === "object", "badgeResult must be an object");
  const badgeDefinition = CANONICAL_BADGE_DEFINITIONS[badgeResult.code];
  invariant(badgeDefinition, `badgeResult has invalid code ${badgeResult.code}`);
  invariant(badgeResult.label === badgeDefinition.label, `badgeResult label disagrees with code ${badgeResult.code}`);
  invariant(badgeResult.eligibility === badgeDefinition.eligibility, `badgeResult eligibility disagrees with code ${badgeResult.code}`);
  invariant(Array.isArray(badgeResult.rationaleCodes), "badgeResult.rationaleCodes must be an array");
  invariant(badgeResult.rationaleCodes.length > 0, "badgeResult.rationaleCodes must not be empty");
  for (const rationaleCode of badgeResult.rationaleCodes) {
    invariant(
      badgeDefinition.rationaleCodes.includes(rationaleCode),
      `badgeResult rationale code ${rationaleCode} disagrees with badge code ${badgeResult.code}`
    );
  }
  validateCanonicalIdSupport({
    support: badgeResult,
    label: "badgeResult",
    recordById,
    accepted,
    rejected,
    decisionEligible
  });
  invariant(
    sameIdSet(badgeResult.supportingEvidenceIds, decisionResult.supportingEvidenceIds),
    "badgeResult support IDs do not match decisionResult support IDs"
  );
  invariant(
    result.counts.badgeSupportCount === badgeResult.supportingEvidenceIds.length,
    "count badgeSupportCount does not equal badgeResult.supportingEvidenceIds.length"
  );
  if (badgeResult.code === "supported_value") {
    invariant(
      ["medium", "high"].includes(confidenceResult.pricing.level),
      "supported-value badge cannot exist with low or insufficient pricing confidence"
    );
  }
  if (comparison.status === "lower_qualified_offer_materially_undercuts") {
    invariant(
      badgeResult.code === "lower_qualified_offer_found",
      "lower canonical qualified offer contradiction must select lower-qualified-offer badge"
    );
    invariant(
      !["consider_purchase"].includes(decisionResult.recommendationCode),
      "lower canonical qualified offer contradiction cannot produce a favorable recommendation"
    );
  }
  if (!confidenceResult.pricing.supportingEvidenceIds.length) {
    invariant(
      badgeResult.code === "market_evidence_insufficient",
      "no-priced-evidence state cannot produce a price-based badge"
    );
  }
  invariant(result.decision?.recommendationCode === decisionResult.recommendationCode, "legacy decision recommendationCode disagrees with decisionResult");
  invariant(result.decision?.badge === badgeResult.label, "legacy decision badge disagrees with badgeResult");

  const buyerOfferResult = result.buyerOfferResult;
  invariant(buyerOfferResult && typeof buyerOfferResult === "object", "buyerOfferResult must be an object");
  invariant(
    CANONICAL_BUYER_OFFER_APPLICABILITY.includes(buyerOfferResult.applicability),
    `buyerOfferResult has invalid applicability ${buyerOfferResult.applicability}`
  );
  invariant(
    CANONICAL_BUYER_OFFER_STATUSES.includes(buyerOfferResult.status),
    `buyerOfferResult has invalid status ${buyerOfferResult.status}`
  );
  invariant(
    (buyerOfferResult.applicability === "not_applicable") === (buyerOfferResult.status === "not_applicable"),
    "buyerOfferResult applicability and status disagree"
  );
  invariant(
    CANONICAL_BUYER_OFFER_GUIDANCE_CODES.includes(buyerOfferResult.guidanceCode),
    `buyerOfferResult has invalid guidanceCode ${buyerOfferResult.guidanceCode}`
  );
  invariant(
    CANONICAL_USER_ENTERED_PRICE_ROLES.includes(buyerOfferResult.userEnteredPriceRole),
    `buyerOfferResult has invalid userEnteredPriceRole ${buyerOfferResult.userEnteredPriceRole}`
  );
  invariant(buyerOfferResult.purpose === decisionResult.purpose, "buyerOfferResult purpose does not match decisionResult purpose");
  invariant(
    buyerOfferResult.marketRangeStatus === result.rangeResult.status,
    "buyerOfferResult marketRangeStatus does not match rangeResult.status"
  );
  invariant(
    buyerOfferResult.pricingConfidenceLevel === confidenceResult.pricing.level,
    "buyerOfferResult pricingConfidenceLevel does not match confidenceResult.pricing.level"
  );
  invariant(Array.isArray(buyerOfferResult.rangeSupportIds), "buyerOfferResult.rangeSupportIds must be an array");
  invariant(Array.isArray(buyerOfferResult.retailLimitSupportIds), "buyerOfferResult.retailLimitSupportIds must be an array");
  invariant(Array.isArray(buyerOfferResult.rationaleCodes), "buyerOfferResult.rationaleCodes must be an array");
  invariant(Array.isArray(buyerOfferResult.insufficiencyReasons), "buyerOfferResult.insufficiencyReasons must be an array");
  invariant(Array.isArray(buyerOfferResult.deliveredCostFactors), "buyerOfferResult.deliveredCostFactors must be an array");
  invariant(Array.isArray(buyerOfferResult.contradictions), "buyerOfferResult.contradictions must be an array");
  invariant(
    new Set(buyerOfferResult.rangeSupportIds).size === buyerOfferResult.rangeSupportIds.length,
    "buyerOfferResult.rangeSupportIds contains a duplicate ID"
  );
  invariant(
    new Set(buyerOfferResult.retailLimitSupportIds).size === buyerOfferResult.retailLimitSupportIds.length,
    "buyerOfferResult.retailLimitSupportIds contains a duplicate ID"
  );
  invariant(
    sameIdSet(buyerOfferResult.rangeSupportIds, result.rangeResult.evidenceIds),
    "buyerOfferResult.rangeSupportIds do not match rangeResult.evidenceIds"
  );
  invariant(
    sameIdSet(buyerOfferResult.retailLimitSupportIds, result.retailLimitResult.evidenceIds),
    "buyerOfferResult.retailLimitSupportIds do not match retailLimitResult.evidenceIds"
  );
  validateCanonicalIdSupport({
    support: buyerOfferResult,
    label: "buyerOfferResult",
    recordById,
    accepted,
    rejected,
    decisionEligible,
    requirePrice: true
  });
  const allowedOfferSupportIds = new Set([
    ...buyerOfferResult.rangeSupportIds,
    ...buyerOfferResult.retailLimitSupportIds
  ]);
  for (const id of buyerOfferResult.supportingEvidenceIds) {
    invariant(allowedOfferSupportIds.has(id), `buyerOfferResult support evidence ID ${id} is not canonical range or retail-limit support`);
    const record = recordById.get(id);
    invariant(record.priceConflict?.status !== "unresolved", `buyerOfferResult contains unresolved-price-conflict evidence ID ${id}`);
  }
  invariant(
    result.counts.buyerOfferSupportCount === buyerOfferResult.supportingEvidenceIds.length,
    "count buyerOfferSupportCount does not equal buyerOfferResult.supportingEvidenceIds.length"
  );
  invariant(
    buyerOfferResult.quantityContext && typeof buyerOfferResult.quantityContext === "object",
    "buyerOfferResult.quantityContext must be an object"
  );
  invariant(
    Array.isArray(buyerOfferResult.quantityContext.supportQuantities),
    "buyerOfferResult.quantityContext.supportQuantities must be an array"
  );
  invariant(
    buyerOfferResult.availabilityContext && typeof buyerOfferResult.availabilityContext === "object",
    "buyerOfferResult.availabilityContext must be an object"
  );
  invariant(
    Array.isArray(buyerOfferResult.availabilityContext.supportStates),
    "buyerOfferResult.availabilityContext.supportStates must be an array"
  );
  for (const field of ["openingOffer", "targetPrice", "maximumPrice"]) {
    const value = buyerOfferResult[field];
    invariant(value === null || (Number.isFinite(value) && value > 0), `buyerOfferResult.${field} must be null or a positive number`);
  }
  invariant(
    buyerOfferResult.userEnteredPrice === null
      || (Number.isFinite(buyerOfferResult.userEnteredPrice) && buyerOfferResult.userEnteredPrice > 0),
    "buyerOfferResult.userEnteredPrice must be null or a positive number"
  );
  const noNumericalGuidanceStatuses = new Set([
    "not_applicable",
    "insufficient_evidence",
    "asking_price_context_only",
    "retail_comparison_only"
  ]);
  if (noNumericalGuidanceStatuses.has(buyerOfferResult.status)) {
    invariant(
      buyerOfferResult.openingOffer === null
        && buyerOfferResult.targetPrice === null
        && buyerOfferResult.maximumPrice === null,
      `buyerOfferResult status ${buyerOfferResult.status} must not contain numerical guidance`
    );
  }
  const hasNumericalGuidance = [
    buyerOfferResult.openingOffer,
    buyerOfferResult.targetPrice,
    buyerOfferResult.maximumPrice
  ].some(Number.isFinite);
  const numericalGuidanceStatuses = new Set([
    "asking_market_guidance",
    "market_supported",
    "resale_market_supported"
  ]);
  const hasCompleteNumericalGuidance = [
    buyerOfferResult.openingOffer,
    buyerOfferResult.targetPrice,
    buyerOfferResult.maximumPrice
  ].every(Number.isFinite);
  if (numericalGuidanceStatuses.has(buyerOfferResult.status)) {
    invariant(
      hasCompleteNumericalGuidance,
      `buyerOfferResult status ${buyerOfferResult.status} requires complete opening, target, and maximum guidance`
    );
  }
  invariant(
    buyerOfferResult.isMarketSupported === numericalGuidanceStatuses.has(buyerOfferResult.status),
    `buyerOfferResult isMarketSupported disagrees with status ${buyerOfferResult.status}`
  );
  if (hasNumericalGuidance) {
    invariant(result.rangeResult.status === "established", "buyerOfferResult numerical guidance requires an established canonical range");
    invariant(
      confidenceResult.pricing.level !== "insufficient",
      "buyerOfferResult numerical guidance requires non-insufficient canonical pricing confidence"
    );
    invariant(
      ["consider_purchase", "pass"].includes(decisionResult.recommendationCode),
      `buyerOfferResult numerical guidance is not permitted by canonical recommendation ${decisionResult.recommendationCode}`
    );
    invariant(buyerOfferResult.isMarketSupported === true, "buyerOfferResult numerical guidance must be canonically market supported");
    invariant(buyerOfferResult.supportingEvidenceIds.length >= 2, "buyerOfferResult numerical guidance requires at least two canonical supporting offers");
  }
  if (
    Number.isFinite(buyerOfferResult.openingOffer)
    && Number.isFinite(buyerOfferResult.targetPrice)
    && Number.isFinite(buyerOfferResult.maximumPrice)
  ) {
    invariant(
      buyerOfferResult.openingOffer <= buyerOfferResult.targetPrice,
      "buyerOfferResult openingOffer is greater than targetPrice"
    );
    invariant(
      buyerOfferResult.targetPrice <= buyerOfferResult.maximumPrice,
      "buyerOfferResult targetPrice is greater than maximumPrice"
    );
  }
  if (oneActiveAskingWithoutSold) {
    invariant(
      !hasNumericalGuidance && buyerOfferResult.isMarketSupported === false,
      "one active asking price without an established range cannot produce market-supported numerical buyer guidance"
    );
  }
  if (buyerOfferResult.status === "retail_comparison_only") {
    invariant(!hasNumericalGuidance, "retail-comparison-only buyerOfferResult must not contain negotiation figures");
  }
  if (
    result.analysisMode === "retail"
    && Number.isFinite(buyerOfferResult.maximumPrice)
    && result.retailLimitResult.status === "established"
  ) {
    invariant(
      buyerOfferResult.maximumPrice <= result.retailLimitResult.amount,
      "buyerOfferResult maximumPrice contradicts the canonical retail limit"
    );
  }
  if (["owner_value", "seller_listing"].includes(decisionResult.purpose)) {
    invariant(
      buyerOfferResult.applicability === "not_applicable"
        && buyerOfferResult.status === "not_applicable",
      `seller-purpose ${decisionResult.purpose} must have buyer offer applicability set to not applicable`
    );
  }
  if (buyerOfferResult.applicability === "not_applicable") {
    invariant(!hasNumericalGuidance, "not-applicable buyerOfferResult must not contain numerical guidance");
  }
  invariant(
    buyerOfferResult.isBudgetOnly === (buyerOfferResult.userEnteredPriceRole === "explicit_personal_budget"),
    "buyerOfferResult isBudgetOnly disagrees with userEnteredPriceRole"
  );
  if (["observed_store_price", "seller_asking_price", "marketplace_asking_price"].includes(buyerOfferResult.userEnteredPriceRole)) {
    invariant(buyerOfferResult.isBudgetOnly === false, `buyerOfferResult observed price role ${buyerOfferResult.userEnteredPriceRole} cannot be marked as budget`);
  }
  invariant(result.decision?.openingOffer === buyerOfferResult.openingOffer, "legacy decision openingOffer disagrees with buyerOfferResult");
  invariant(result.decision?.targetPrice === buyerOfferResult.targetPrice, "legacy decision targetPrice disagrees with buyerOfferResult");
  invariant(result.decision?.maximumPrice === buyerOfferResult.maximumPrice, "legacy decision maximumPrice disagrees with buyerOfferResult");
  invariant(result.decision?.negotiationGuidance === buyerOfferResult.guidanceSummary, "legacy decision negotiationGuidance disagrees with buyerOfferResult");

  invariant(
    sameIdSet(result.diagnostics.finalizedCustomerRecordIds, result.views.customerEligibleIds),
    "diagnostic finalizedCustomerRecordIds do not match customerEligibleIds"
  );
  invariant(
    sameIdSet(result.diagnostics.displayedRecordIds, result.views.displayedIds),
    "diagnostic displayedRecordIds do not match displayedIds"
  );
  invariant(
    sameIdSet(result.diagnostics.rejectedDiagnosticOnlyRecordIds, result.views.rejectedDiagnosticOnlyIds),
    "diagnostic rejectedDiagnosticOnlyRecordIds do not match rejectedDiagnosticOnlyIds"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalRangeSupportEvidenceIds, result.rangeResult.evidenceIds),
    "diagnostic canonicalRangeSupportEvidenceIds do not match rangeResult.evidenceIds"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalRangeSupportUnderlyingOfferIds, result.rangeResult.underlyingOfferIds),
    "diagnostic canonicalRangeSupportUnderlyingOfferIds do not match rangeResult.underlyingOfferIds"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalRetailLimitSupportEvidenceIds, result.retailLimitResult.evidenceIds),
    "diagnostic canonicalRetailLimitSupportEvidenceIds do not match retailLimitResult.evidenceIds"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalRetailLimitSupportUnderlyingOfferIds, result.retailLimitResult.underlyingOfferIds),
    "diagnostic canonicalRetailLimitSupportUnderlyingOfferIds do not match retailLimitResult.underlyingOfferIds"
  );
  invariant(result.diagnostics.canonicalDecisionStatus === decisionResult.status, "diagnostic canonicalDecisionStatus does not match decisionResult.status");
  invariant(result.diagnostics.canonicalRecommendationCode === decisionResult.recommendationCode, "diagnostic canonicalRecommendationCode does not match decisionResult.recommendationCode");
  invariant(
    sameIdSet(result.diagnostics.canonicalDecisionSupportEvidenceIds, decisionResult.supportingEvidenceIds),
    "diagnostic canonicalDecisionSupportEvidenceIds do not match decisionResult.supportingEvidenceIds"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalDecisionSupportUnderlyingOfferIds, decisionResult.supportingUnderlyingOfferIds),
    "diagnostic canonicalDecisionSupportUnderlyingOfferIds do not match decisionResult.supportingUnderlyingOfferIds"
  );
  invariant(result.diagnostics.canonicalIdentityConfidence === confidenceResult.identity.level, "diagnostic canonicalIdentityConfidence does not match confidenceResult.identity.level");
  invariant(result.diagnostics.canonicalIdentityConfidenceLevel === confidenceResult.identity.level, "diagnostic canonicalIdentityConfidenceLevel does not match confidenceResult.identity.level");
  invariant(
    sameIdSet(result.diagnostics.canonicalIdentityConfidenceSupportEvidenceIds, confidenceResult.identity.supportingEvidenceIds),
    "diagnostic canonicalIdentityConfidenceSupportEvidenceIds do not match identity confidence support"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalIdentityConfidenceSupportUnderlyingOfferIds, confidenceResult.identity.supportingUnderlyingOfferIds),
    "diagnostic canonicalIdentityConfidenceSupportUnderlyingOfferIds do not match identity confidence support"
  );
  invariant(result.diagnostics.canonicalPricingConfidenceLevel === confidenceResult.pricing.level, "diagnostic canonicalPricingConfidenceLevel does not match confidenceResult.pricing.level");
  invariant(
    sameIdSet(result.diagnostics.canonicalPricingConfidenceSupportEvidenceIds, confidenceResult.pricing.supportingEvidenceIds),
    "diagnostic canonicalPricingConfidenceSupportEvidenceIds do not match pricing confidence support"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalPricingConfidenceSupportUnderlyingOfferIds, confidenceResult.pricing.supportingUnderlyingOfferIds),
    "diagnostic canonicalPricingConfidenceSupportUnderlyingOfferIds do not match pricing confidence support"
  );
  invariant(result.diagnostics.canonicalBadgeCode === badgeResult.code, "diagnostic canonicalBadgeCode does not match badgeResult.code");
  invariant(
    sameIdSet(result.diagnostics.canonicalBadgeSupportEvidenceIds, badgeResult.supportingEvidenceIds),
    "diagnostic canonicalBadgeSupportEvidenceIds do not match badgeResult.supportingEvidenceIds"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalBadgeSupportUnderlyingOfferIds, badgeResult.supportingUnderlyingOfferIds),
    "diagnostic canonicalBadgeSupportUnderlyingOfferIds do not match badgeResult.supportingUnderlyingOfferIds"
  );
  invariant(
    result.diagnostics.canonicalBuyerOfferApplicability === buyerOfferResult.applicability,
    "diagnostic canonicalBuyerOfferApplicability does not match buyerOfferResult.applicability"
  );
  invariant(
    result.diagnostics.canonicalBuyerOfferStatus === buyerOfferResult.status,
    "diagnostic canonicalBuyerOfferStatus does not match buyerOfferResult.status"
  );
  invariant(
    result.diagnostics.canonicalBuyerOfferBasisCode === buyerOfferResult.basisCode,
    "diagnostic canonicalBuyerOfferBasisCode does not match buyerOfferResult.basisCode"
  );
  invariant(
    result.diagnostics.canonicalBuyerOfferGuidanceCode === buyerOfferResult.guidanceCode,
    "diagnostic canonicalBuyerOfferGuidanceCode does not match buyerOfferResult.guidanceCode"
  );
  invariant(
    result.diagnostics.canonicalBuyerOfferUserEnteredPriceRole === buyerOfferResult.userEnteredPriceRole,
    "diagnostic canonicalBuyerOfferUserEnteredPriceRole does not match buyerOfferResult.userEnteredPriceRole"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalBuyerOfferSupportEvidenceIds, buyerOfferResult.supportingEvidenceIds),
    "diagnostic canonicalBuyerOfferSupportEvidenceIds do not match buyerOfferResult.supportingEvidenceIds"
  );
  invariant(
    sameIdSet(result.diagnostics.canonicalBuyerOfferSupportUnderlyingOfferIds, buyerOfferResult.supportingUnderlyingOfferIds),
    "diagnostic canonicalBuyerOfferSupportUnderlyingOfferIds do not match buyerOfferResult.supportingUnderlyingOfferIds"
  );
  invariant(
    result.diagnostics.canonicalBuyerOfferSupportCount === buyerOfferResult.supportingEvidenceIds.length,
    "diagnostic canonicalBuyerOfferSupportCount does not match buyerOfferResult support length"
  );
  invariant(
    sameIdOrder(result.diagnostics.canonicalCustomerEvidenceIds, result.customerEvidenceSummary.displayedIds),
    "diagnostic canonicalCustomerEvidenceIds do not match customerEvidenceSummary.displayedIds"
  );
  invariant(
    result.diagnostics.canonicalCustomerEvidenceCount === result.customerEvidence.length,
    "diagnostic canonicalCustomerEvidenceCount does not match customerEvidence.length"
  );
  invariant(
    sameJson(result.diagnostics.canonicalDisplayedCountByRetailer, result.customerEvidenceSummary.displayedCountByRetailer),
    "diagnostic canonicalDisplayedCountByRetailer does not match customer evidence summary"
  );
  invariant(
    sameJson(result.diagnostics.canonicalDisplayedCountByPriceType, result.customerEvidenceSummary.displayedCountByPriceType),
    "diagnostic canonicalDisplayedCountByPriceType does not match customer evidence summary"
  );
  invariant(
    sameJson(result.diagnostics.canonicalDisplayedCountByMatchClass, result.customerEvidenceSummary.displayedCountByMatchClass),
    "diagnostic canonicalDisplayedCountByMatchClass does not match customer evidence summary"
  );
  return result;
}
