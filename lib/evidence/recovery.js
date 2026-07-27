import { dedupeUnderlyingOffers } from "./dedupe.js";
import { normalizeEvidenceRecord } from "./finalize.js";

function uniqueIds(records = []) {
  return [...new Set(records.map((record) => record.evidenceId).filter(Boolean))];
}

function rejectedEvidenceId(record = {}) {
  const offerId = record.underlyingOfferId || record.evidenceId || "unknown-offer";
  const observationId = record.sourceRecordId
    || record.providerRecordId
    || record.originalUrl
    || record.destinationUrl
    || record.url
    || "unknown-observation";
  return `rejected:${offerId}:${observationId}`;
}

function retailerDomain(record = {}) {
  const explicit = String(record.retailerDomain || record.sourceDomain || "").trim().toLowerCase();
  if (explicit) return explicit.replace(/^www\./, "");
  try {
    return new URL(String(record.destinationUrl || record.originalUrl || record.url || "")).hostname
      .replace(/^www\./, "")
      .toLowerCase();
  } catch {
    return "";
  }
}

function normalizedAccounting(accounting = {}) {
  const maximumPhysicalProviderAttempts = Math.max(0, Number(accounting.maximumPhysicalProviderAttempts || 0));
  const physicalProviderAttemptCount = Math.max(0, Number(accounting.physicalProviderAttemptCount || 0));
  return {
    rawProviderObservationCount: Math.max(0, Number(accounting.rawProviderObservationCount || 0)),
    logicalProviderQueryCount: Math.max(0, Number(accounting.logicalProviderQueryCount || 0)),
    physicalProviderAttemptCount,
    physicalProviderRetryAttemptCount: Math.max(0, Number(accounting.physicalProviderRetryAttemptCount || 0)),
    maximumPhysicalProviderAttempts,
    remainingPhysicalProviderAttempts: Math.max(0, maximumPhysicalProviderAttempts - physicalProviderAttemptCount),
    logicalDirectPageEnrichmentCount: Math.max(0, Number(accounting.logicalDirectPageEnrichmentCount || 0)),
    physicalDirectPageAttemptCount: Math.max(0, Number(accounting.physicalDirectPageAttemptCount || 0)),
    maximumPhysicalDirectPageAttempts: Math.max(0, Number(accounting.maximumPhysicalDirectPageAttempts || 0))
  };
}

export function createCanonicalRecoveryView({
  observations = [],
  targetIdentity = {},
  providerAccounting = {}
} = {}) {
  const normalized = observations.map((record) => normalizeEvidenceRecord(record, targetIdentity));
  const acceptedObservations = normalized.filter((record) => record.eligible);
  const accepted = dedupeUnderlyingOffers(acceptedObservations);
  const rejectedById = new Map();
  for (const record of normalized.filter((candidate) => !candidate.eligible)) {
    const rejection = {
      evidenceId: rejectedEvidenceId(record),
      underlyingOfferId: record.underlyingOfferId || record.evidenceId,
      sourceRecordId: record.sourceRecordId,
      reason: record.exclusionReason,
      record
    };
    if (!rejectedById.has(rejection.evidenceId)) {
      rejectedById.set(rejection.evidenceId, rejection);
    }
  }
  const rejected = [...rejectedById.values()]
    .sort((left, right) => left.evidenceId.localeCompare(right.evidenceId));
  const exact = accepted.filter((record) => record.exactIdentity);
  const strong = accepted.filter((record) => /strong/i.test(String(record.canonicalMatchQuality || "")));
  const priceBearing = accepted.filter((record) => Number.isFinite(record.price) && record.price > 0);
  const exactPriceBearing = priceBearing.filter((record) => record.exactIdentity);
  const exactNoPrice = exact.filter((record) => !Number.isFinite(record.price) || record.price <= 0);
  const distinctQualifyingRetailerDomains = [...new Set(accepted.map(retailerDomain).filter(Boolean))].sort();
  const additionalPriceRecoveryNeeded = priceBearing.length <= 1 || exactPriceBearing.length === 0;
  const recoveryTriggeringSupportIds = additionalPriceRecoveryNeeded ? uniqueIds(accepted) : [];
  const recoveryStoppingSupportIds = additionalPriceRecoveryNeeded ? [] : uniqueIds(priceBearing);
  const accounting = normalizedAccounting({
    ...providerAccounting,
    rawProviderObservationCount: providerAccounting.rawProviderObservationCount ?? observations.length
  });

  return {
    observations: normalized,
    accepted,
    rejected,
    acceptedEvidenceIds: uniqueIds(accepted),
    rejectedEvidenceIds: rejected.map((record) => record.evidenceId),
    rejectedEvidenceReasons: rejected.map(({ evidenceId, underlyingOfferId, sourceRecordId, reason }) => ({
      evidenceId,
      underlyingOfferId,
      sourceRecordId,
      reason
    })),
    underlyingOfferIds: [...new Set(accepted.map((record) => record.underlyingOfferId).filter(Boolean))],
    deduplicatedAcceptedCount: accepted.length,
    exactAcceptedCount: exact.length,
    strongAcceptedCount: strong.length,
    priceBearingAcceptedCount: priceBearing.length,
    exactPriceBearingAcceptedCount: exactPriceBearing.length,
    exactNoPriceEvidenceCount: exactNoPrice.length,
    distinctQualifyingRetailerDomains,
    distinctQualifyingRetailerCount: distinctQualifyingRetailerDomains.length,
    equivalentOfferCount: Math.max(0, acceptedObservations.length - accepted.length),
    additionalPriceRecoveryNeeded,
    recoveryTriggeringSupportIds,
    recoveryStoppingSupportIds,
    decisionSupportIds: additionalPriceRecoveryNeeded
      ? recoveryTriggeringSupportIds
      : recoveryStoppingSupportIds,
    providerAccounting: accounting
  };
}

export function createRecoveryAssessment({
  observations = [],
  records = [],
  assessments = [],
  targetIdentity = {},
  providerRequestRecords = [],
  maxProviderCalls = 0
} = {}) {
  const sourceRecords = observations.length
    ? observations
    : records.length
      ? records
      : assessments.map((assessment) => assessment?.record).filter(Boolean);
  const physicalProviderAttemptCount = providerRequestRecords.reduce((sum, record) => (
    sum + (record?.physicalAttemptCount === undefined
      ? record?.attempted ? 1 : 0
      : Number(record.physicalAttemptCount || 0))
  ), 0);
  const canonicalRecoveryView = createCanonicalRecoveryView({
    observations: sourceRecords,
    targetIdentity,
    providerAccounting: {
      logicalProviderQueryCount: providerRequestRecords.filter((record) => (
        record?.logicalQueryAttempted === undefined ? record?.attempted : record.logicalQueryAttempted
      )).length,
      physicalProviderAttemptCount,
      physicalProviderRetryAttemptCount: providerRequestRecords.reduce(
        (sum, record) => sum + Number(record?.physicalRetryAttemptCount || 0),
        0
      ),
      maximumPhysicalProviderAttempts: maxProviderCalls
    }
  });
  return {
    canonicalRecoveryView,
    preliminaryUsableRecordCount: canonicalRecoveryView.priceBearingAcceptedCount,
    preliminaryExactRecordCount: canonicalRecoveryView.exactPriceBearingAcceptedCount,
    preliminaryCompatibleRecordCount: Math.max(
      0,
      canonicalRecoveryView.priceBearingAcceptedCount - canonicalRecoveryView.exactPriceBearingAcceptedCount
    ),
    preliminaryRetailerDomains: new Set(canonicalRecoveryView.distinctQualifyingRetailerDomains),
    preliminaryRetailerCount: canonicalRecoveryView.distinctQualifyingRetailerCount,
    preliminaryEvidenceInsufficient: canonicalRecoveryView.additionalPriceRecoveryNeeded,
    remainingSearchBudget: canonicalRecoveryView.providerAccounting.remainingPhysicalProviderAttempts
  };
}
