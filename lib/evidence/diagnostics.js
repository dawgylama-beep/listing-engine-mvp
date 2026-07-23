export function diagnosticsFromFinalEvidence(finalized = {}, providerRequests = [], debugLimit = 50) {
  const all = finalized.all || [];
  const attempted = providerRequests.filter((record) => record?.attempted !== false);
  return {
    finalizedAcceptedEvidenceCount: finalized.counts?.finalizedAccepted || 0,
    customerEligibleEvidenceCount: finalized.counts?.customerEligible || 0,
    displayedEvidenceCount: finalized.counts?.displayed || 0,
    rangeEligibleEvidenceCount: finalized.counts?.rangeEligible || 0,
    decisionEligibleEvidenceCount: finalized.counts?.decisionEligible || 0,
    priceBearingEvidenceCount: finalized.counts?.priceBearing || 0,
    rejectedDiagnosticOnlyCount: finalized.counts?.rejectedDiagnosticOnly || 0,
    finalizedCustomerRecordIds: finalized.finalizedCustomerRecordIds || [],
    displayedRecordIds: finalized.displayedRecordIds || [],
    finalizedCustomerClassifications: (finalized.customerEligible || []).map((record) => ({
      evidenceId: record.evidenceId,
      classification: record.canonicalMatchQuality
    })),
    finalEvidenceCount: finalized.counts?.final || 0,
    exactMatchCount: finalized.counts?.exact || 0,
    compatibleMatchCount: finalized.counts?.compatible || 0,
    exactWithoutPriceCount: finalized.counts?.exactWithoutPrice || 0,
    retailerSourceCount: finalized.counts?.sources || 0,
    providerCallsAttempted: attempted.length,
    providerCallsSucceeded: attempted.filter((record) => record.succeeded).length,
    diagnosticSample: all.slice(0, debugLimit).map((record) => ({
      evidenceId: record.evidenceId,
      source: record.retailer || record.marketplace || record.sourceDomain || record.source,
      classification: record.canonicalMatchQuality,
      priceType: record.priceType
    }))
  };
}
