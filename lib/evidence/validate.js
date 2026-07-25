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
  "retailLimitResult"
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

function invariant(condition, message) {
  if (!condition) {
    throw new Error(`FinalEvidenceResult invariant failed: ${message}`);
  }
}

function sameIdSet(left = [], right = []) {
  return left.length === right.length
    && left.every((id) => right.includes(id));
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
  return result;
}
