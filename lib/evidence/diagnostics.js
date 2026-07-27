export function diagnosticsFromFinalEvidence(finalized = {}, providerRequests = [], debugLimit = 50) {
  const all = finalized.all || [];
  const providerSearchRequests = providerRequests.filter((record) => !/direct_product_page_fetch/i.test(String(record?.providerEndpoint || "")));
  const directPageRequests = providerRequests.filter((record) => /direct_product_page_fetch/i.test(String(record?.providerEndpoint || "")));
  const physicalAttempts = (record) => record?.physicalAttemptCount === undefined
    ? record?.attempted === false ? 0 : 1
    : Number(record.physicalAttemptCount || 0) || (record?.succeeded ? 1 : 0);
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
    logicalProviderQueryCount: providerSearchRequests.filter((record) => (
      record?.logicalQueryAttempted === undefined ? record?.attempted !== false : record.logicalQueryAttempted
    )).length,
    providerCallsAttempted: providerSearchRequests.reduce((sum, record) => sum + physicalAttempts(record), 0),
    physicalProviderAttemptCount: providerSearchRequests.reduce((sum, record) => sum + physicalAttempts(record), 0),
    physicalProviderRetryAttemptCount: providerSearchRequests.reduce((sum, record) => sum + Number(record?.physicalRetryAttemptCount || 0), 0),
    logicalDirectPageEnrichmentCount: directPageRequests.filter((record) => (
      record?.logicalQueryAttempted === undefined ? record?.attempted !== false : record.logicalQueryAttempted
    )).length,
    physicalDirectPageAttemptCount: directPageRequests.reduce((sum, record) => sum + physicalAttempts(record), 0),
    providerCallsSucceeded: providerSearchRequests.filter((record) => record?.succeeded).length,
    directPageFetchesSucceeded: directPageRequests.filter((record) => record?.succeeded).length,
    diagnosticSample: all.slice(0, debugLimit).map((record) => ({
      evidenceId: record.evidenceId,
      source: record.retailer || record.marketplace || record.sourceDomain || record.source,
      classification: record.canonicalMatchQuality,
      priceType: record.priceType
    }))
  };
}
