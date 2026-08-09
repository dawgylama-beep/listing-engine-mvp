import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BENCHMARK_ID,
  EXECUTOR_VERSION,
  FIXED_ENVIRONMENT_ALLOWLIST,
  PRODUCT_SOURCE_HEAD,
  PRODUCT_SOURCE_VERSION,
  createPricingProfile
} from "./execution-protocol.mjs";
import { COST_STATE, createSourceGroundedCostEnvelope, validateCostEnvelope } from "./cost-envelope.mjs";
import { createLaunchScope, deriveLaunchIdentities, validateLaunchScope } from "./launch-identity.mjs";
import { ensureDetachedProductRuntime, removeDetachedProductRuntime, resolveExecutionProfile } from "./execution-profile.mjs";
import { defaultFreezeRoot, loadPublicFreeze, repositoryRoot } from "./execution-store.mjs";
import { sha256Json } from "./protocol.mjs";
import { loadHistoricalV11221ZeroExternalSupersessionReceipt } from "./pre-external-reconciliation.mjs";
import { loadFixedV11221TerminalFailureReceipt } from "./post-handler-reconciliation.mjs";
import { createContinuationScope } from "./continuation-scope.mjs";
import {
  loadUnusedV11222ConsentRevocationReceipt,
  validateContinuationReleaseChain
} from "./consent-revocation.mjs";
import { loadVersion1123FailureEvidence } from "./version1123-failure-evidence.mjs";

export const AUTHORIZED_MAXIMUM_MINOR_UNITS = 4000;
export const REAL_FREEZE_AGGREGATE = "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699";

export async function loadFixedExecutionEnvironment(processEnvironment = process.env) {
  const selected = Object.fromEntries(FIXED_ENVIRONMENT_ALLOWLIST.map((name) => [name, String(processEnvironment?.[name] || "")]));
  let text = "";
  try {
    text = await readFile(path.join(repositoryRoot, ".env"), "utf8");
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const allowed = new Set(FIXED_ENVIRONMENT_ALLOWLIST);
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || !allowed.has(match[1]) || selected[match[1]]) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    selected[match[1]] = value;
  }
  return Object.freeze(selected);
}

export function createVerifiedPricingProfile({ exactModel, createdAt }) {
  return createPricingProfile({
    provider: "OPENAI",
    exactModel,
    effectiveDate: "2026-08-08",
    pricingSourceDescription: "User-authorized verified pricing effective 2026-08-08; this release performs no pricing fetch.",
    inputTokenRatePerMillion: 0.4,
    cachedInputTokenRatePerMillion: 0.1,
    outputTokenRatePerMillion: 1.6,
    webSearchCallRate: 0.01,
    serperSearchCallRate: null,
    directPageCostAssumption: 0,
    conservativeUncertaintyMargin: 0.2,
    createdAt
  });
}

export async function buildLaunchArtifacts({ frozen, runtime, environment, releaseIdentity, supersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence, resolvedAt, productSourceText }) {
  assert.equal(frozen.manifest.completeFrozenAggregateHash, REAL_FREEZE_AGGREGATE);
  assert.equal(runtime.productSourceHead, PRODUCT_SOURCE_HEAD);
  assert.equal(runtime.productSourceVersion, PRODUCT_SOURCE_VERSION);
  assert.equal(runtime.productRuntimeManifestHash, "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8");
  assert.equal(supersessionReceipt.successorExecutorVersion, "1.12.21");
  const releaseChain = validateContinuationReleaseChain({ releaseIdentity, zeroExternalSupersessionReceipt: supersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence });
  const resolved = await resolveExecutionProfile({
    freezeRequests: frozen.requests,
    environment,
    productRuntimeManifestHash: runtime.productRuntimeManifestHash,
    releaseIdentity,
    resolvedAt,
    productSourceText
  });
  const pricingProfile = createVerifiedPricingProfile({ exactModel: resolved.profile.exactModelLiteral, createdAt: resolvedAt });
  const costEnvelope = createSourceGroundedCostEnvelope({
    requests: frozen.requests,
    assetCache: frozen.assetCache,
    attemptCeiling: resolved.attemptCeiling,
    executionProfile: resolved.profile,
    pricingProfile,
    authorizedMaximumMinorUnits: AUTHORIZED_MAXIMUM_MINOR_UNITS
  });
  assert.equal(costEnvelope.productCostSourceManifestHash, releaseIdentity.productCostSourceManifestHash, "cost source manifest differs from the qualified executor release");
  validateCostEnvelope(costEnvelope, { attemptCeiling: resolved.attemptCeiling, executionProfile: resolved.profile, pricingProfile, authorizedMaximumMinorUnits: AUTHORIZED_MAXIMUM_MINOR_UNITS });
  assert.equal(costEnvelope.conservativeMaximumCost, 39.17741232, "canonical complete cost changed before continuation derivation");
  const continuationScope = createContinuationScope({ frozen, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence, releaseChain });
  const launchScope = createLaunchScope({
    benchmarkId: BENCHMARK_ID,
    candidateSetId: frozen.manifest.candidateSetId,
    productSourceHead: PRODUCT_SOURCE_HEAD,
    productSourceVersion: PRODUCT_SOURCE_VERSION,
    productRuntimeManifestHash: runtime.productRuntimeManifestHash,
    productCostSourceManifestHash: costEnvelope.productCostSourceManifestHash,
    executorRuntimeHead: releaseIdentity.executorRuntimeHead,
    qualificationHead: releaseIdentity.qualificationHead,
    executorRuntimeTreeHash: releaseIdentity.executorRuntimeTreeHash,
    executionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash,
    qualificationPolicyVersion: releaseIdentity.qualificationPolicyVersion,
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
    zeroExternalSupersessionReceiptId: supersessionReceipt.receiptId,
    zeroExternalSupersessionReceiptHash: supersessionReceipt.receiptHash,
    historicalExecutionReleaseRecordHash: releaseChain.version1121ExecutionReleaseRecordHash,
    predecessorExecutionReleaseRecordHash: releaseChain.version1122ExecutionReleaseRecordHash,
    immediatePredecessorExecutionReleaseRecordHash: releaseChain.version1123ExecutionReleaseRecordHash,
    version1123FailureEvidenceHash: releaseChain.version1123FailureEvidenceHash,
    releaseChainHash: releaseChain.releaseChainHash,
    unusedConsentRevocationReceiptId: unusedConsentRevocationReceipt.receiptId,
    unusedConsentRevocationReceiptHash: unusedConsentRevocationReceipt.receiptHash,
    continuationScopeHash: continuationScope.continuationScopeHash,
    continuationRequestAggregateHash: continuationScope.continuationRequestAggregateHash,
    continuationOrderedRequestHashInventory: continuationScope.orderedRequestHashInventory,
    terminalFailureReceiptId: continuationScope.terminalFailureReceiptId,
    terminalFailureReceiptHash: continuationScope.terminalFailureReceiptHash,
    priorPhysicalAttemptCount: continuationScope.priorPhysicalAttemptCount,
    priorConservativeCost: continuationScope.priorConservativeCost,
    remainingPhysicalAttemptAuthority: continuationScope.remainingPhysicalAttemptAuthority,
    remainingConservativeCostAuthority: continuationScope.remainingConservativeCostAuthority,
    continuationPhysicalAttemptCeiling: continuationScope.continuationPhysicalAttemptCeiling,
    continuationConservativeMaximumCost: continuationScope.continuationConservativeMaximumCost,
    cumulativeConservativeMaximumCost: continuationScope.cumulativeConservativeMaximumCost,
    authorizedRequestCount: continuationScope.authorizedRequestCount,
    maximumAuthorizedCostMinorUnits: AUTHORIZED_MAXIMUM_MINOR_UNITS,
    networkPolicyHash: sha256Json(resolved.profile.networkScope),
    privateControlsAuthorized: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    deploymentAuthorized: false
  });
  validateLaunchScope(launchScope);
  const identities = deriveLaunchIdentities(launchScope);
  return Object.freeze({
    ...resolved,
    pricingProfile,
    costEnvelope,
    continuationScope,
    releaseChain,
    launchScope,
    identities,
    preflightDisposition: costEnvelope.costState === COST_STATE.WITHIN
      ? "REAL_RUN_PREFLIGHT_ELIGIBLE_NOT_AUTHORIZED"
      : "REAL_RUN_PREFLIGHT_BLOCKED_COST_NOT_AUTHORIZED"
  });
}

export async function buildRealLaunchPreflight({ environment = process.env, releaseIdentity, resolvedAt = new Date().toISOString() } = {}) {
  assert.match(releaseIdentity?.executorRuntimeHead || "", /^[a-f0-9]{40}$/, "committed executor runtime head is required");
  assert.match(releaseIdentity?.qualificationHead || "", /^[a-f0-9]{40}$/, "committed qualification head is required");
  assert.equal(path.basename(defaultFreezeRoot), REAL_FREEZE_AGGREGATE);
  const [supersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence] = await Promise.all([
    loadHistoricalV11221ZeroExternalSupersessionReceipt(),
    loadFixedV11221TerminalFailureReceipt(releaseIdentity),
    loadUnusedV11222ConsentRevocationReceipt(releaseIdentity),
    loadVersion1123FailureEvidence()
  ]);
  const runtime = ensureDetachedProductRuntime();
  const runtimeRoot = runtime.runtimeRoot;
  try {
    const [frozen, productSourceText] = await Promise.all([
      loadPublicFreeze(defaultFreezeRoot),
      readFile(path.join(runtimeRoot, "api", "generate-listing.js"), "utf8")
    ]);
    const artifacts = await buildLaunchArtifacts({ frozen, runtime, environment, releaseIdentity, supersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence, resolvedAt, productSourceText });
    return Object.freeze({ ...artifacts, productRuntimeRoot: runtimeRoot, supersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence, releaseIdentity });
  } catch (error) {
    removeDetachedProductRuntime(runtimeRoot);
    throw error;
  }
}
