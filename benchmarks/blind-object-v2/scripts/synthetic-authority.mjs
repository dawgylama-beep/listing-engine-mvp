import { readFile } from "node:fs/promises";
import {
  BENCHMARK_ID,
  EXECUTION_MODE,
  EXECUTOR_VERSION,
  PRODUCT_SOURCE_HEAD,
  PRODUCT_SOURCE_VERSION,
  createExecutionConsent,
  createPricingProfile
} from "./execution-protocol.mjs";
import { createSourceGroundedCostEnvelope } from "./cost-envelope.mjs";
import { createLaunchScope } from "./launch-identity.mjs";
import { resolveExecutionProfile } from "./execution-profile.mjs";
import { sha256Json } from "./protocol.mjs";

export const SYNTHETIC_EXECUTOR_HEAD = "b".repeat(40);
export const SYNTHETIC_QUALIFICATION_HEAD = "c".repeat(40);
export const SYNTHETIC_EXECUTOR_TREE_HASH = "d".repeat(40);
export const SYNTHETIC_RELEASE_RECORD_HASH = "e".repeat(64);
export const SYNTHETIC_PRODUCT_RUNTIME_HASH = "a".repeat(64);
export const SYNTHETIC_TIME = "2026-08-07T12:00:00.000Z";

export const SYNTHETIC_RELEASE_IDENTITY = Object.freeze({
  executorRuntimeHead: SYNTHETIC_EXECUTOR_HEAD,
  qualificationHead: SYNTHETIC_QUALIFICATION_HEAD,
  executorRuntimeTreeHash: SYNTHETIC_EXECUTOR_TREE_HASH,
  executionReleaseRecordHash: SYNTHETIC_RELEASE_RECORD_HASH,
  qualificationPolicyVersion: "1.0",
  executorVersion: EXECUTOR_VERSION
});

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
    releaseIdentity: SYNTHETIC_RELEASE_IDENTITY,
    resolvedAt: SYNTHETIC_TIME
  });
  const pricingProfile = createPricingProfile({
    provider: "OPENAI",
    exactModel: resolved.profile.exactModelLiteral,
    effectiveDate: "2026-08-08",
    pricingSourceDescription: "User-authorized verified pricing effective 2026-08-08; offline validation does not fetch pricing.",
    inputTokenRatePerMillion: 0.4,
    cachedInputTokenRatePerMillion: 0.1,
    outputTokenRatePerMillion: 1.6,
    webSearchCallRate: 0.01,
    serperSearchCallRate: null,
    directPageCostAssumption: 0,
    conservativeUncertaintyMargin: 0.2,
    createdAt: SYNTHETIC_TIME
  });
  const productSourceText = await readFile(new URL("../../../api/generate-listing.js", import.meta.url), "utf8");
  const costEnvelope = createSourceGroundedCostEnvelope({
    requests: frozen.requests,
    assetCache: frozen.assetCache,
    attemptCeiling: resolved.attemptCeiling,
    executionProfile: resolved.profile,
    pricingProfile,
    productSourceText,
    authorizedMaximumMinorUnits: 4000
  });
  const launchScope = createLaunchScope({
    benchmarkId: BENCHMARK_ID,
    candidateSetId: frozen.manifest.candidateSetId,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    productRuntimeManifestHash: SYNTHETIC_PRODUCT_RUNTIME_HASH,
    executorRuntimeHead: SYNTHETIC_RELEASE_IDENTITY.executorRuntimeHead,
    qualificationHead: SYNTHETIC_RELEASE_IDENTITY.qualificationHead,
    executorRuntimeTreeHash: SYNTHETIC_RELEASE_IDENTITY.executorRuntimeTreeHash,
    executionReleaseRecordHash: SYNTHETIC_RELEASE_IDENTITY.executionReleaseRecordHash,
    qualificationPolicyVersion: SYNTHETIC_RELEASE_IDENTITY.qualificationPolicyVersion,
    executorVersion: EXECUTOR_VERSION,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    freezeManifestHash: frozen.manifest.freezeManifestHash,
    freezeReceiptHash: frozen.receipt.receiptHash,
    requestAggregateHash: frozen.manifest.requestAggregateHash,
    orderedRequestHashInventory: frozen.manifest.requestContractHashes,
    handlerContract: resolved.profile.handlerContract,
    modelProvider: resolved.profile.modelProvider,
    exactModelLiteral: resolved.profile.exactModelLiteral,
    acquisitionProviderMode: resolved.profile.acquisitionProviderMode,
    directPageMode: resolved.profile.directPageMode,
    endpointClassAllowlistHash: sha256Json(resolved.profile.fixedProviderEndpointClasses),
    environmentNameAllowlistHash: sha256Json(resolved.profile.fixedEnvironmentVariableNameAllowlist),
    completePhysicalAttemptCeiling: resolved.attemptCeiling.categories.totalPhysicalAttempts,
    completeAttemptCeilingHash: resolved.attemptCeiling.ceilingHash,
    executionProfileIdentityHash: resolved.profile.executionProfileIdentityHash,
    pricingProfileIdentityHash: pricingProfile.pricingProfileIdentityHash,
    costEnvelopeHash: costEnvelope.costEnvelopeHash,
    maximumAuthorizedCostMinorUnits: 4000,
    networkPolicyHash: sha256Json(resolved.profile.networkScope),
    privateControlsAuthorized: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    deploymentAuthorized: false
  });
  const consent = createExecutionConsent({ launchScope, costEnvelope }, SYNTHETIC_TIME);
  return Object.freeze({
    mode: EXECUTION_MODE.SYNTHETIC_TEST_ONLY,
    ...resolved,
    pricingProfile,
    costEnvelope,
    launchScope,
    consent,
    environment
  });
}
