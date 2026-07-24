export function createRecoveryAssessment({
  assessments = [],
  providerRequestRecords = [],
  maxProviderCalls = 0
} = {}) {
  const usableAssessments = assessments
    .filter((assessment) => assessment?.customerPriceCardEligibility)
    .filter((assessment) => !/^tier_5$/i.test(assessment.customerEvidenceTier || ""));
  const preliminaryRetailerDomains = new Set(usableAssessments
    .map((assessment) => String(assessment.retailerDomain || "").trim().toLowerCase())
    .filter(Boolean));
  const preliminaryExactRecordCount = usableAssessments.filter((assessment) => (
    /tier_1|tier_2/i.test(assessment.customerEvidenceTier || "")
    || /exact/i.test(assessment.packageCompatibilityLabel || assessment.identityMatchStrength || "")
  )).length;
  const preliminaryCompatibleRecordCount = Math.max(0, usableAssessments.length - preliminaryExactRecordCount);
  const providerCallsUsed = providerRequestRecords.filter((record) => record?.attempted).length;
  return {
    preliminaryUsableRecordCount: usableAssessments.length,
    preliminaryExactRecordCount,
    preliminaryCompatibleRecordCount,
    preliminaryRetailerDomains,
    preliminaryRetailerCount: preliminaryRetailerDomains.size,
    preliminaryEvidenceInsufficient: usableAssessments.length <= 1 || preliminaryExactRecordCount === 0,
    remainingSearchBudget: Math.max(0, maxProviderCalls - providerCallsUsed)
  };
}
