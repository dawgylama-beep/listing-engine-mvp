import { deriveDecision, deriveRange } from "./decisions.js";
import { diagnosticsFromFinalEvidence } from "./diagnostics.js";
import { assembleFinalEvidence } from "./finalize.js";

export const FINAL_EVIDENCE_SCHEMA_VERSION = "1.0";

function uniqueIds(records = []) {
  return [...new Set(records.map((record) => record.evidenceId).filter(Boolean))];
}

function rejectedEvidenceId(record = {}) {
  const offerId = record.underlyingOfferId || record.evidenceId || "unknown-offer";
  const observationId = record.sourceRecordId || record.providerRecordId || record.originalUrl || record.destinationUrl || record.url || "unknown-observation";
  return `rejected:${offerId}:${observationId}`;
}

function normalizeRejectedRecords(records = [], acceptedIds = new Set()) {
  const byId = new Map();
  for (const record of records) {
    let evidenceId = rejectedEvidenceId(record);
    if (acceptedIds.has(evidenceId)) {
      evidenceId = `rejected:${evidenceId}`;
    }
    if (!byId.has(evidenceId)) {
      byId.set(evidenceId, {
        ...record,
        evidenceId,
        underlyingOfferId: record.underlyingOfferId || record.evidenceId
      });
    }
  }
  return [...byId.values()].sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
}

export function createFinalEvidenceResult({
  analysisId = "",
  analysisMode = "collectible",
  targetIdentity = {},
  observations = [],
  providerRequests = [],
  displayLimit = 8,
  askingPrice = null,
  purpose = "personal"
} = {}) {
  const finalized = assembleFinalEvidence(observations, targetIdentity, { displayLimit });
  const acceptedRecords = finalized.all;
  const acceptedIds = new Set(uniqueIds(acceptedRecords));
  const rejectedRecords = normalizeRejectedRecords(finalized.rejected, acceptedIds);
  const records = [...acceptedRecords, ...rejectedRecords];
  const views = {
    acceptedIds: uniqueIds(acceptedRecords),
    customerEligibleIds: uniqueIds(finalized.customerEligible),
    displayEligibleIds: uniqueIds(finalized.customerEligible),
    displayedIds: uniqueIds(finalized.display),
    rangeEligibleIds: uniqueIds(finalized.rangeEligible),
    decisionEligibleIds: uniqueIds(finalized.decisionEligible),
    priceBearingIds: uniqueIds(finalized.priceBearing),
    exactMatchIds: uniqueIds(acceptedRecords.filter((record) => record.exactIdentity)),
    rejectedDiagnosticOnlyIds: uniqueIds(rejectedRecords)
  };
  const counts = Object.fromEntries(
    Object.entries(views).map(([name, ids]) => [name.replace(/Ids$/, "Count"), ids.length])
  );
  const range = deriveRange(finalized);
  const decision = deriveDecision(finalized, {
    askingPrice,
    purpose,
    mode: analysisMode
  });
  const diagnostics = {
    ...diagnosticsFromFinalEvidence(finalized, providerRequests),
    finalizedCustomerRecordIds: views.customerEligibleIds,
    displayedRecordIds: views.displayedIds,
    rejectedDiagnosticOnlyRecordIds: views.rejectedDiagnosticOnlyIds
  };

  return {
    schemaVersion: FINAL_EVIDENCE_SCHEMA_VERSION,
    analysisId,
    analysisMode,
    targetIdentity,
    records,
    views,
    counts,
    diagnostics,
    range,
    decision,
    acceptedRecords,
    rejectedRecords,
    customerEligible: finalized.customerEligible,
    rangeEligible: finalized.rangeEligible,
    decisionEligible: finalized.decisionEligible,
    priceBearing: finalized.priceBearing,
    display: finalized.display
  };
}
