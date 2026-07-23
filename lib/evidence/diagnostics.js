export function diagnosticsFromFinalEvidence(finalized = {}, providerRequests = [], debugLimit = 50) {
  const all = finalized.all || [];
  const attempted = providerRequests.filter((record) => record?.attempted !== false);
  return {
    finalEvidenceCount: finalized.counts?.final || 0,
    exactMatchCount: finalized.counts?.exact || 0,
    compatibleMatchCount: finalized.counts?.compatible || 0,
    exactWithoutPriceCount: finalized.counts?.exactWithoutPrice || 0,
    retailerSourceCount: finalized.counts?.sources || 0,
    providerCallsAttempted: attempted.length,
    providerCallsSucceeded: attempted.filter((record) => record.succeeded).length,
    displayedEvidenceCount: (finalized.display || []).length,
    diagnosticSample: all.slice(0, debugLimit).map((record) => ({
      evidenceId: record.evidenceId,
      source: record.retailer || record.marketplace || record.sourceDomain || record.source,
      exactIdentity: record.exactIdentity,
      priceType: record.priceType
    }))
  };
}
