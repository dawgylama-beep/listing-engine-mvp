import {
  BENCHMARK_ID,
  EXECUTION_MODE,
  EXECUTOR_VERSION,
  PRODUCT_SOURCE_HEAD,
  PRODUCT_SOURCE_VERSION,
  conservativeMaximumCost,
  createExecutionConsent,
  createPricingProfile
} from "./execution-protocol.mjs";
import { resolveExecutionProfile } from "./execution-profile.mjs";

export const SYNTHETIC_EXECUTOR_HEAD = "b".repeat(40);
export const SYNTHETIC_PRODUCT_RUNTIME_HASH = "a".repeat(64);
export const SYNTHETIC_TIME = "2026-08-07T12:00:00.000Z";

export function deterministicClock(start = SYNTHETIC_TIME) {
  let current = Date.parse(start);
  return () => {
    const value = new Date(current).toISOString();
    current += 1;
    return value;
  };
}

export async function createSyntheticAuthority(frozen, suffix = "compatibility") {
  const environment = {
    OPENAI_API_KEY: "synthetic-secret-never-persisted",
    OPENAI_MODEL: "gpt-4.1-mini",
    SERPER_API_KEY: "",
    UNAPPROVED_PROVIDER: "must-not-affect-profile",
    KATHERINES_EYE_HANDLER_ADAPTER_MODULE: "must-not-affect-profile"
  };
  const resolved = await resolveExecutionProfile({
    freezeRequests: frozen.requests,
    environment,
    productRuntimeManifestHash: SYNTHETIC_PRODUCT_RUNTIME_HASH,
    executorSourceHead: SYNTHETIC_EXECUTOR_HEAD,
    resolvedAt: SYNTHETIC_TIME
  });
  const pricingProfile = createPricingProfile({
    pricingProfileId: `synthetic-pricing-${suffix}`,
    provider: "OPENAI",
    exactModel: resolved.profile.exactModelLiteral,
    effectiveDate: "2026-08-07",
    pricingSourceDescription: "Synthetic deterministic rates for network-denied execution-spine validation only.",
    inputTokenRatePerMillion: 0.05,
    cachedInputTokenRatePerMillion: 0.01,
    outputTokenRatePerMillion: 0.1,
    webSearchCallRate: 0.001,
    serperSearchCallRate: 0.001,
    directPageCostAssumption: 0,
    conservativeUncertaintyMargin: 0.1,
    createdAt: SYNTHETIC_TIME
  });
  const conservativeCost = conservativeMaximumCost(resolved.attemptCeiling, pricingProfile, resolved.profile.acquisitionProviderMode);
  const consentId = `synthetic-consent-${suffix}`;
  const invocationId = `synthetic-invocation-${suffix}`;
  const resultId = `synthetic-result-${suffix}`;
  const consent = createExecutionConsent({
    consentId,
    invocationId,
    resultId,
    benchmarkId: BENCHMARK_ID,
    candidateSetId: frozen.manifest.candidateSetId,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    executorSourceHead: SYNTHETIC_EXECUTOR_HEAD,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    freezeManifestHash: frozen.manifest.freezeManifestHash,
    freezeReceiptHash: frozen.receipt.receiptHash,
    requestAggregateHash: frozen.manifest.requestAggregateHash,
    orderedRequestHashInventory: frozen.manifest.requestContractHashes,
    executionProfileHash: resolved.profile.profileHash,
    pricingProfileHash: pricingProfile.pricingProfileHash,
    completePhysicalAttemptCeiling: resolved.attemptCeiling.categories.totalPhysicalAttempts,
    maximumAuthorizedCost: Number((conservativeCost + 1).toFixed(8)),
    conservativeMaximumCost: conservativeCost,
    fixedResultRoot: `benchmarks/blind-object-v2-results/${resultId}`,
    authorizedNetworkScope: resolved.profile.networkScope,
    authorizedRequestCount: 26,
    privateControlsAuthorized: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    deploymentAuthorized: false
  }, SYNTHETIC_TIME);
  return Object.freeze({
    mode: EXECUTION_MODE.SYNTHETIC_TEST_ONLY,
    ...resolved,
    pricingProfile,
    consent,
    environment
  });
}
