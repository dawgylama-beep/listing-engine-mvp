import assert from "node:assert/strict";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  CONSENT_STATUS,
  EXECUTION_MODE,
  createExecutionConsent,
  validateExecutionConsent
} from "./execution-protocol.mjs";
import { buildRealLaunchPreflight, loadFixedExecutionEnvironment, REAL_FREEZE_AGGREGATE } from "./launch-preflight.mjs";
import { inspectQualifiedRepositoryRelease } from "./release-qualification.mjs";
import { removeDetachedProductRuntime } from "./execution-profile.mjs";
import { reconcileFixedV11221Failure, verifyFixedV11221Reconciliation } from "./post-handler-reconciliation.mjs";
import { COMPOSITE_STATE, sealCompositeEvidence } from "./composite-evidence.mjs";
import {
  benchmarkRoot,
  defaultFreezeRoot,
  defaultResultHistoryRoot,
  deriveResultRoot,
  loadPublicFreeze,
  readJsonStrictFile,
  replaceSynced,
  writeExclusiveSynced
} from "./execution-store.mjs";
import { executeBenchmarkV2, verifyResultReadback } from "./executor.mjs";
import { stableJson } from "./protocol.mjs";
import { revokeUnusedV11222Consent } from "./consent-revocation.mjs";
import { runOfflineExecutionQualification } from "./offline-execution-qualification.mjs";

const HASH = /^[a-f0-9]{64}$/;
const MODES = Object.freeze(["REVOKE_V11222_CONSENT", "QUALIFY_OFFLINE", "PREFLIGHT", "CREATE_CONSENT", "EXECUTE", "READBACK", "RECONCILE_V11221"]);

export function parseAuthorizedExecutionArguments(argv) {
  assert.ok(Array.isArray(argv), "CLI arguments must be an array");
  const [mode, freezeAggregate, consentHash, ...extra] = argv;
  assert.ok(MODES.includes(mode), "command mode must be REVOKE_V11222_CONSENT, QUALIFY_OFFLINE, PREFLIGHT, CREATE_CONSENT, EXECUTE, READBACK, or RECONCILE_V11221");
  assert.match(freezeAggregate || "", HASH, "freeze aggregate must be exactly 64 lowercase hexadecimal characters");
  assert.equal(freezeAggregate, REAL_FREEZE_AGGREGATE, "CLI freeze aggregate differs from the repository-owned real freeze");
  assert.equal(extra.length, 0, "CLI accepts no additional arguments");
  if (["EXECUTE", "READBACK"].includes(mode)) assert.match(consentHash || "", HASH, `${mode} requires one exact consent hash`);
  else assert.equal(consentHash, undefined, `${mode} accepts no consent hash or other argument`);
  return Object.freeze({ mode, freezeAggregate, consentHash: consentHash || null });
}

function publicPreflightRecord(preflight) {
  return Object.freeze({
    disposition: preflight.preflightDisposition,
    benchmarkId: preflight.launchScope.benchmarkId,
    completeFrozenAggregateHash: preflight.launchScope.completeFrozenAggregateHash,
    productSourceHead: preflight.launchScope.productSourceHead,
    productSourceVersion: preflight.launchScope.productSourceVersion,
    productRuntimeManifestHash: preflight.launchScope.productRuntimeManifestHash,
    productCostSourceManifestHash: preflight.launchScope.productCostSourceManifestHash,
    completeSourceInventoryHash: preflight.costEnvelope.completeSourceInventoryHash,
    executorRuntimeHead: preflight.launchScope.executorRuntimeHead,
    qualificationHead: preflight.launchScope.qualificationHead,
    executorRuntimeTreeHash: preflight.launchScope.executorRuntimeTreeHash,
    executionReleaseRecordHash: preflight.launchScope.executionReleaseRecordHash,
    qualificationPolicyVersion: preflight.launchScope.qualificationPolicyVersion,
    executorVersion: preflight.launchScope.executorVersion,
    exactModelLiteral: preflight.launchScope.exactModelLiteral,
    acquisitionProviderMode: preflight.launchScope.acquisitionProviderMode,
    completePhysicalAttemptCeiling: preflight.launchScope.completePhysicalAttemptCeiling,
    costEnvelopeHash: preflight.costEnvelope.costEnvelopeHash,
    conservativeMaximumCost: preflight.costEnvelope.conservativeMaximumCost,
    conservativeMaximumCostMinorUnits: preflight.costEnvelope.conservativeMaximumCostMinorUnits,
    authorizedMaximumMinorUnits: preflight.costEnvelope.authorizedMaximumMinorUnits,
    costState: preflight.costEnvelope.costState,
    zeroExternalSupersessionReceiptId: preflight.supersessionReceipt.receiptId,
    zeroExternalSupersessionReceiptHash: preflight.supersessionReceipt.receiptHash,
    historicalExecutionReleaseRecordHash: preflight.releaseChain.version1121ExecutionReleaseRecordHash,
    predecessorExecutionReleaseRecordHash: preflight.releaseChain.version1122ExecutionReleaseRecordHash,
    currentExecutionReleaseRecordHash: preflight.releaseChain.version1123ExecutionReleaseRecordHash,
    releaseChainHash: preflight.releaseChain.releaseChainHash,
    unusedConsentRevocationReceiptId: preflight.unusedConsentRevocationReceipt.receiptId,
    unusedConsentRevocationReceiptHash: preflight.unusedConsentRevocationReceipt.receiptHash,
    terminalFailureReceiptId: preflight.terminalFailureReceipt.receiptId,
    terminalFailureReceiptHash: preflight.terminalFailureReceipt.receiptHash,
    continuationScopeHash: preflight.continuationScope.continuationScopeHash,
    continuationRequestAggregateHash: preflight.continuationScope.continuationRequestAggregateHash,
    continuationRequestCount: preflight.continuationScope.authorizedRequestCount,
    priorPhysicalAttemptCount: preflight.continuationScope.priorPhysicalAttemptCount,
    continuationPhysicalAttemptCeiling: preflight.continuationScope.continuationPhysicalAttemptCeiling,
    cumulativePhysicalAttemptCeiling: preflight.continuationScope.priorPhysicalAttemptCount + preflight.continuationScope.continuationPhysicalAttemptCeiling,
    priorConservativeCost: preflight.continuationScope.priorConservativeCost,
    continuationConservativeMaximumCost: preflight.continuationScope.continuationConservativeMaximumCost,
    cumulativeConservativeMaximumCost: preflight.continuationScope.cumulativeConservativeMaximumCost,
    remainingConservativeCostAuthority: preflight.continuationScope.remainingConservativeCostAuthority,
    launchScopeHash: preflight.launchScope.launchScopeHash,
    proposedConsentId: preflight.identities.consentId,
    proposedInvocationId: preflight.identities.invocationId,
    proposedReservationId: preflight.identities.reservationId,
    proposedResultId: preflight.identities.resultId,
    proposedResultRootName: preflight.identities.resultRootName,
    proposedFixedResultRoot: `benchmarks/blind-object-v2-results/${preflight.identities.resultRootName}`,
    authorityCreated: false,
    handlerInvocationCount: 0,
    providerAttemptCount: 0
  });
}

async function resolvePreflight(environment, releaseIdentity) {
  const fixedEnvironment = await loadFixedExecutionEnvironment(environment);
  return buildRealLaunchPreflight({ environment: fixedEnvironment, releaseIdentity, resolvedAt: new Date().toISOString() });
}

export async function runAuthorizedExecutionCommand(argv, { environment = process.env, output = process.stdout } = {}) {
  const command = parseAuthorizedExecutionArguments(argv);
  const releaseIdentity = inspectQualifiedRepositoryRelease(command.mode);
  const release = releaseIdentity.release;
  assert.equal(release.authorityDeclarations.realExecutionAuthorized, false, "repository release metadata cannot itself imply external real-run authorization");
  if (command.mode === "CREATE_CONSENT") assert.equal(release.authorityDeclarations.consentCreationEnabled, true, "CREATE_CONSENT is disabled in this executor release and requires a later separate authorization station");
  if (command.mode === "EXECUTE") assert.equal(release.authorityDeclarations.executionEnabled, true, "EXECUTE is disabled in this executor release and requires a later separate authorization station");
  if (command.mode === "REVOKE_V11222_CONSENT") {
    const receipt = await revokeUnusedV11222Consent({ releaseIdentity });
    output.write(`${stableJson({ disposition: receipt.disposition, receiptId: receipt.receiptId, receiptHash: receipt.receiptHash, sourceConsentId: receipt.sourceConsentId })}\n`);
    return receipt;
  }
  if (command.mode === "RECONCILE_V11221") {
    assert.equal(release.authorityDeclarations.postHandlerReconciliationEnabled, true, "post-handler reconciliation is disabled");
    const reconciliation = await reconcileFixedV11221Failure({ releaseIdentity });
    output.write(`${stableJson(reconciliation)}\n`);
    return reconciliation;
  }
  const preflight = await resolvePreflight(environment, releaseIdentity);
  try {
    if (command.mode === "QUALIFY_OFFLINE") {
      const record = await runOfflineExecutionQualification({ preflight });
      output.write(`${stableJson(record)}\n`);
      return record;
    }
    if (command.mode === "PREFLIGHT") {
      const record = publicPreflightRecord(preflight);
      output.write(`${stableJson(record)}\n`);
      return record;
    }

    const consentPath = path.join(benchmarkRoot, "consent", `${preflight.identities.consentId}.json`);
    if (command.mode === "CREATE_CONSENT") {
      assert.equal(preflight.costEnvelope.costState, "COMPLETE_RUN_WITHIN_AUTHORIZED_COST", "cost state blocks consent creation");
      const consent = createExecutionConsent({ launchScope: preflight.launchScope, costEnvelope: preflight.costEnvelope }, new Date().toISOString());
      await writeExclusiveSynced(consentPath, consent);
      output.write(`${stableJson({ disposition: "CONSENT_CREATED_NOT_EXECUTED", consentId: consent.consentId, consentHash: consent.consentHash, launchScopeHash: consent.launchScopeHash })}\n`);
      return consent;
    }

    const consent = await readJsonStrictFile(consentPath);
    validateExecutionConsent(consent, { launchScope: preflight.launchScope, requiredStatus: command.mode === "EXECUTE" ? CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED : undefined });
    assert.equal(consent.consentHash, command.consentHash, "CLI consent hash does not match the repository-derived consent record");
    if (command.mode === "READBACK") {
      const resultRoot = deriveResultRoot(defaultResultHistoryRoot, preflight.identities.resultRootName);
      const readback = await verifyResultReadback({ resultRoot, freezeRoot: defaultFreezeRoot });
      assert.equal(readback.state, "EXECUTED_SEALED_AWAITING_SCORING", "composite evidence requires a complete unscored continuation result");
      assert.equal(readback.responseCount, 25, "composite evidence requires exactly 25 continuation responses");
      assert.equal(readback.compositeManifestHash, null, "composite evidence already exists; READBACK is exactly-once");
      const terminalFailure = await verifyFixedV11221Reconciliation({ releaseIdentity });
      const frozen = await loadPublicFreeze(defaultFreezeRoot);
      const [launchScope, continuationScope, resultConsent, resultManifest, ledger] = await Promise.all([
        readJsonStrictFile(path.join(resultRoot, "launch-scope.json")),
        readJsonStrictFile(path.join(resultRoot, "continuation-scope.json")),
        readJsonStrictFile(path.join(resultRoot, "execution-consent.json")),
        readJsonStrictFile(path.join(resultRoot, "unscored-result-manifest.json")),
        readJsonStrictFile(path.join(resultRoot, "cost-ledger.json"))
      ]);
      const handlerReturnedReceipts = await Promise.all(
        continuationScope.orderedRequestIds.map((analysisId) => readJsonStrictFile(path.join(resultRoot, "handler-returned", `${analysisId}.json`)))
      );
      const composite = await sealCompositeEvidence(resultRoot, {
        frozen,
        terminalFailureReceipt: terminalFailure.receipt,
        terminalFailureTreeAggregate: terminalFailure.terminalFailureTreeAggregate,
        continuationScope,
        launchScope,
        consent: resultConsent,
        resultManifest,
        ledger,
        handlerReturnedReceipts
      });
      assert.equal(composite.state, COMPOSITE_STATE);
      const sealedReadback = await verifyResultReadback({ resultRoot, freezeRoot: defaultFreezeRoot });
      assert.equal(sealedReadback.compositeManifestHash, composite.manifestHash);
      const record = { disposition: "READBACK_COMPLETE_COMPOSITE_UNSCORED_SEALED", ...sealedReadback };
      output.write(`${stableJson(record)}\n`);
      return record;
    }

    const result = await executeBenchmarkV2({
      mode: EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION,
      freezeRoot: defaultFreezeRoot,
      executionProfile: preflight.profile,
      attemptCeiling: preflight.attemptCeiling,
      pricingProfile: preflight.pricingProfile,
      costEnvelope: preflight.costEnvelope,
      launchScope: preflight.launchScope,
      continuationScope: preflight.continuationScope,
      consent,
      productRuntimeRoot: preflight.productRuntimeRoot,
      allowedEnvironment: preflight.allowedEnvironment,
      zeroExternalSupersessionReceipt: preflight.supersessionReceipt,
      terminalFailureReceipt: preflight.terminalFailureReceipt,
      unusedConsentRevocationReceipt: preflight.unusedConsentRevocationReceipt,
      releaseIdentity: preflight.releaseIdentity,
      onConsentTransition: async (nextConsent) => replaceSynced(consentPath, nextConsent)
    });
    await replaceSynced(consentPath, result.consent);
    const manifest = result.manifest || result.terminalFailureManifest;
    output.write(`${stableJson({ disposition: result.disposition, resultId: manifest.resultId, manifestHash: manifest.manifestHash })}\n`);
    return result;
  } finally {
    removeDetachedProductRuntime(preflight.productRuntimeRoot);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    await runAuthorizedExecutionCommand(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${String(error?.message || error)}\n`);
    process.exitCode = 1;
  }
}
