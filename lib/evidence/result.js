import { deriveDecision } from "./decisions.js";
import { diagnosticsFromFinalEvidence } from "./diagnostics.js";
import { assembleFinalEvidence } from "./finalize.js";
import {
  deriveCanonicalRangeResults,
  deriveRetailLimitResult,
  projectLegacyRange
} from "./range.js";

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
  const customerEligible = analysisMode === "retail"
    ? finalized.customerEligible.filter((record) => (
        record.priceType === "Current retail price"
        || (record.priceType === "Price unavailable" && record.identityReference)
      ))
    : finalized.customerEligible;
  const display = customerEligible.slice(0, Number.isFinite(displayLimit) ? displayLimit : 8);
  const views = {
    acceptedIds: uniqueIds(acceptedRecords),
    customerEligibleIds: uniqueIds(customerEligible),
    displayEligibleIds: uniqueIds(customerEligible),
    displayedIds: uniqueIds(display),
    rangeEligibleIds: uniqueIds(finalized.rangeEligible),
    decisionEligibleIds: uniqueIds(finalized.decisionEligible),
    priceBearingIds: uniqueIds(finalized.priceBearing),
    exactMatchIds: uniqueIds(acceptedRecords.filter((record) => record.exactIdentity)),
    rejectedDiagnosticOnlyIds: uniqueIds(rejectedRecords)
  };
  const counts = Object.fromEntries(
    Object.entries(views).map(([name, ids]) => [name.replace(/Ids$/, "Count"), ids.length])
  );
  const { rangeResult, rangeResults } = deriveCanonicalRangeResults(finalized, { analysisMode });
  const retailLimitResult = deriveRetailLimitResult(finalized, targetIdentity, { analysisMode });
  const range = projectLegacyRange(rangeResult);
  counts.rangeSupportCount = rangeResult.evidenceIds.length;
  counts.retailLimitSupportCount = retailLimitResult.evidenceIds.length;
  const decision = deriveDecision(finalized, {
    askingPrice,
    purpose,
    mode: analysisMode,
    range
  });
  const diagnosticFinalized = {
    ...finalized,
    counts: {
      ...finalized.counts,
      customerEligible: customerEligible.length,
      displayed: display.length
    },
    customerEligible,
    display,
    finalizedCustomerRecordIds: views.customerEligibleIds,
    displayedRecordIds: views.displayedIds
  };
  const diagnostics = {
    ...diagnosticsFromFinalEvidence(diagnosticFinalized, providerRequests),
    finalizedCustomerRecordIds: views.customerEligibleIds,
    displayedRecordIds: views.displayedIds,
    rejectedDiagnosticOnlyRecordIds: views.rejectedDiagnosticOnlyIds,
    canonicalRangeStatus: rangeResult.status,
    canonicalRangeSupportEvidenceIds: rangeResult.evidenceIds,
    canonicalRangeSupportUnderlyingOfferIds: rangeResult.underlyingOfferIds,
    canonicalRetailLimitStatus: retailLimitResult.status,
    canonicalRetailLimitSupportEvidenceIds: retailLimitResult.evidenceIds,
    canonicalRetailLimitSupportUnderlyingOfferIds: retailLimitResult.underlyingOfferIds
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
    rangeResult,
    rangeResults,
    retailLimitResult,
    range,
    decision,
    acceptedRecords,
    rejectedRecords,
    customerEligible,
    rangeEligible: finalized.rangeEligible,
    decisionEligible: finalized.decisionEligible,
    priceBearing: finalized.priceBearing,
    display
  };
}
