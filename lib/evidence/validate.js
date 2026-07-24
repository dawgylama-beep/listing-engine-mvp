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
  "diagnostics"
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
  return result;
}
