import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";
import {
  CONSENT_STATUS,
  EXECUTION_MODE,
  REQUEST_STATE,
  RESERVATION_STATE,
  createExecutionConsent,
  requestReplayDisposition
} from "../benchmarks/blind-object-v2/scripts/execution-protocol.mjs";
import {
  CONTINUATION_REQUEST_IDS,
  PRIOR_CONSERVATIVE_COST,
  PRIOR_PHYSICAL_ATTEMPTS,
  createContinuationScope,
  deriveContinuationRequests,
  validateContinuationScope
} from "../benchmarks/blind-object-v2/scripts/continuation-scope.mjs";
import {
  createTerminalFailureReceipt
} from "../benchmarks/blind-object-v2/scripts/post-handler-reconciliation-protocol.mjs";
import {
  defaultFreezeRoot,
  loadPublicFreeze,
  readJsonStrictFile
} from "../benchmarks/blind-object-v2/scripts/execution-store.mjs";
import { createLaunchScope } from "../benchmarks/blind-object-v2/scripts/launch-identity.mjs";
import { COMPOSITE_STATE, sealCompositeEvidence } from "../benchmarks/blind-object-v2/scripts/composite-evidence.mjs";
import {
  POST_HANDLER_SANITIZATION_STATE,
  validateHandlerReturnedReceipt,
  validatePostHandlerFailureManifest
} from "../benchmarks/blind-object-v2/scripts/post-handler-durability-protocol.mjs";
import {
  createSyntheticMockHandler,
  executeBenchmarkV2,
  verifyResultReadback
} from "../benchmarks/blind-object-v2/scripts/executor.mjs";
import { sha256Json } from "../benchmarks/blind-object-v2/scripts/protocol.mjs";
import { createSyntheticAuthority, deterministicClock } from "../benchmarks/blind-object-v2/scripts/synthetic-authority.mjs";
import { loadHistoricalV11221ZeroExternalSupersessionReceipt } from "../benchmarks/blind-object-v2/scripts/pre-external-reconciliation.mjs";
import { loadFixedV11221TerminalFailureReceipt } from "../benchmarks/blind-object-v2/scripts/post-handler-reconciliation.mjs";
import {
  UNUSED_VERSION_1_12_22_CONSENT_PATH,
  UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH,
  createUnusedV11222ConsentRevocationReceipt,
  validateContinuationReleaseChain
} from "../benchmarks/blind-object-v2/scripts/consent-revocation.mjs";
import { underlyingOfferKey } from "../lib/evidence/dedupe.js";

const frozen = await loadPublicFreeze(defaultFreezeRoot);

async function withTemp(prefix, callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  try { return await callback(root); } finally { await rm(root, { recursive: true, force: true, maxRetries: 3 }); }
}

function launchInput(scope) {
  const input = structuredClone(scope);
  delete input.schemaVersion;
  delete input.scopeType;
  delete input.launchScopeHash;
  return input;
}

function releaseIdentity(authority) {
  return Object.freeze({
    executorRuntimeHead: authority.profile.executorRuntimeHead,
    qualificationHead: authority.profile.qualificationHead,
    executorRuntimeTreeHash: authority.profile.executorRuntimeTreeHash,
    executionReleaseRecordHash: authority.profile.executionReleaseRecordHash,
    qualificationPolicyVersion: authority.profile.qualificationPolicyVersion,
    executorVersion: authority.profile.executorVersion,
    release: Object.freeze({
      predecessorExecutionReleaseRecordHash: "a80e7e763bb15ff399392be4c3a9cebbd4fb9a7b85622a9c14e4653742473294",
      historicalExecutionReleaseRecordHash: "ed569a1af04bb87e1de1ae4c32eb02719f84bd1b1e861cb55611b28e43ad7013",
      unusedConsentAuthorityHash: UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH,
      historicalZeroExternalSupersessionReceiptHash: "684d208b4be3a002a5eabcb7f997cf4eb0af18c37f0d7bd33617248cdb3da81d",
      historicalTerminalFailureReceiptHash: "f5534106a7857f919d174adc5b9d39697d8380842f9a0564e88177d0a76257fc",
      postHandlerFailureAuthorityHash: "915089ed141f32dd38530df9ee1bd89288aa7bb4a2e5b2abe8cf4f96a24202b7"
    })
  });
}

async function continuationAuthority(authority) {
  const currentReleaseIdentity = releaseIdentity(authority);
  const [zeroExternalSupersessionReceipt, terminalFailureReceipt, consentBytes] = await Promise.all([
    loadHistoricalV11221ZeroExternalSupersessionReceipt(),
    loadFixedV11221TerminalFailureReceipt(currentReleaseIdentity),
    readFile(UNUSED_VERSION_1_12_22_CONSENT_PATH)
  ]);
  const unusedConsentRevocationReceipt = createUnusedV11222ConsentRevocationReceipt({
    consentBytes,
    releaseIdentity: currentReleaseIdentity,
    revokedAt: "2026-08-09T21:00:00.000Z"
  });
  const releaseChain = validateContinuationReleaseChain({ releaseIdentity: currentReleaseIdentity, zeroExternalSupersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt });
  const continuationScope = createContinuationScope({ frozen, terminalFailureReceipt, unusedConsentRevocationReceipt, releaseChain });
  const launchScope = createLaunchScope({
    ...launchInput(authority.launchScope),
    zeroExternalSupersessionReceiptId: zeroExternalSupersessionReceipt.receiptId,
    zeroExternalSupersessionReceiptHash: zeroExternalSupersessionReceipt.receiptHash,
    historicalExecutionReleaseRecordHash: releaseChain.version1121ExecutionReleaseRecordHash,
    predecessorExecutionReleaseRecordHash: releaseChain.version1122ExecutionReleaseRecordHash,
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
    authorizedRequestCount: 25
  });
  const consent = createExecutionConsent({ launchScope, costEnvelope: authority.costEnvelope }, "2026-08-09T21:00:01.000Z");
  return { continuationScope, launchScope, consent, zeroExternalSupersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, releaseIdentity: currentReleaseIdentity };
}

async function seedLegacyReservations(root, terminalReceipt, zeroReceipt) {
  await mkdir(root, { recursive: true });
  const legacy = {
    schemaVersion: "1.1",
    executorVersion: "1.12.21",
    invocationId: terminalReceipt.sourceInvocationId,
    reservationId: terminalReceipt.sourceReservationId,
    reservationHash: terminalReceipt.sourceReservationHash,
    resultId: terminalReceipt.sourceResultId,
    resultRootName: terminalReceipt.sourceResultRootName,
    consentHash: terminalReceipt.sourceConsentHash,
    launchScopeHash: "e".repeat(64),
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    state: "STARTED"
  };
  const preExternalLegacy = {
    schemaVersion: "1.0",
    executorVersion: "1.12.20",
    invocationId: zeroReceipt.supersededInvocationId,
    reservationId: zeroReceipt.supersededReservationId,
    reservationHash: zeroReceipt.sourceReservationHash,
    resultId: zeroReceipt.supersededResultId,
    resultRootName: zeroReceipt.sourceResultRootName,
    consentHash: zeroReceipt.sourceConsentHash,
    launchScopeHash: "d".repeat(64),
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    state: "STARTED"
  };
  await writeFile(path.join(root, `${terminalReceipt.sourceInvocationId}.json`), `${JSON.stringify(legacy)}\n`, { flag: "wx" });
  await writeFile(path.join(root, `${zeroReceipt.supersededInvocationId}.json`), `${JSON.stringify(preExternalLegacy)}\n`, { flag: "wx" });
}

test("a full mock execution durably records all 26 handler returns before sealing 26 responses", async () => withTemp("ke-v122-full-mock-", async (root) => {
  const network = installHardNetworkDenial();
  try {
    const authority = await createSyntheticAuthority(frozen, "v122-full-terminal-seal");
    const mock = createSyntheticMockHandler();
    const result = await executeBenchmarkV2({
      mode: EXECUTION_MODE.SYNTHETIC_TEST_ONLY,
      freezeRoot: defaultFreezeRoot,
      resultHistoryRootOverride: path.join(root, "results"),
      reservationStoreRootOverride: path.join(root, "reservations"),
      executionProfile: authority.profile,
      attemptCeiling: authority.attemptCeiling,
      pricingProfile: authority.pricingProfile,
      costEnvelope: authority.costEnvelope,
      launchScope: authority.launchScope,
      consent: authority.consent,
      syntheticHandler: mock.handler,
      allowedEnvironment: authority.allowedEnvironment,
      clock: deterministicClock()
    });
    assert.equal(result.terminalRecords.length, 26);
    assert.equal(result.handlerReturnedReceipts.length, 26);
    assert.equal(mock.invocationCount, 26);
    assert.equal(result.manifest.terminalCount, 26);
    assert.equal(result.manifest.orderedHandlerReturnedReceiptInventory.length, 26);
    await assert.rejects(readFile(path.join(result.resultRoot, "terminal-failure-manifest.json")), /ENOENT/);
    const readback = await verifyResultReadback({ resultRoot: result.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(readback.valid, true);
    assert.equal(readback.responseCount, 26);
    assert.equal(network.attempts.length, 0);
  } finally {
    network.restore();
  }
}));

test("the actual CLI EXECUTE graph reaches the same transaction path whose HANDLER_RETURNED write precedes terminal creation", async () => {
  const cliSource = await readFile(new URL("../benchmarks/blind-object-v2/scripts/run-authorized-execution.mjs", import.meta.url), "utf8");
  const executorSource = await readFile(new URL("../benchmarks/blind-object-v2/scripts/executor.mjs", import.meta.url), "utf8");
  assert.match(cliSource, /const result = await executeBenchmarkV2\(\{[\s\S]*?continuationScope: preflight\.continuationScope[\s\S]*?terminalFailureReceipt: preflight\.terminalFailureReceipt/);
  const receiptWrite = executorSource.indexOf("await writeResultFile(resultRoot, `handler-returned/${request.analysisId}.json`, handlerReturnedReceipt)");
  const terminalCreation = executorSource.indexOf("terminal = createTerminalResult(terminalRecordInput({");
  const responseWrite = executorSource.indexOf("await writeResultFile(resultRoot, `responses/${request.analysisId}.json`, terminal)");
  assert.ok(receiptWrite >= 0 && terminalCreation > receiptWrite && responseWrite > terminalCreation, "HANDLER_RETURNED must be durable before terminal sanitization or response persistence");
});

test("forced sanitizer failure preserves HANDLER_RETURNED, exact cost and attempts, terminal failure, and permanent no-replay", async () => withTemp("ke-v122-post-handler-failure-", async (root) => {
  const network = installHardNetworkDenial();
  try {
    const authority = await createSyntheticAuthority(frozen, "v122-post-handler-sanitizer-failure");
    let invocationCount = 0;
    const unsafeHandler = async () => {
      invocationCount += 1;
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: {
          valuation: {
            disposition: "COMPLETE",
            searchDiagnostics: {
              providerRequestRecords: [{ providerKey: "openai_web_search", attempted: true, physicalAttemptCount: 2 }],
              objectIntelligence: {
                experienceRecord: {
                  sourcesAccepted: [{ url: "https://example.com/public/item", evidenceId: "A7sK9pQ2vN4xR8mT6zW1cD5fG3hJ0lB+Y" }]
                }
              }
            }
          }
        }
      };
    };
    const argumentsForExecution = {
      mode: EXECUTION_MODE.SYNTHETIC_TEST_ONLY,
      freezeRoot: defaultFreezeRoot,
      resultHistoryRootOverride: path.join(root, "results"),
      reservationStoreRootOverride: path.join(root, "reservations"),
      executionProfile: authority.profile,
      attemptCeiling: authority.attemptCeiling,
      pricingProfile: authority.pricingProfile,
      costEnvelope: authority.costEnvelope,
      launchScope: authority.launchScope,
      consent: authority.consent,
      syntheticHandler: unsafeHandler,
      allowedEnvironment: authority.allowedEnvironment,
      clock: deterministicClock()
    };
    const result = await executeBenchmarkV2(argumentsForExecution);
    assert.equal(result.disposition, POST_HANDLER_SANITIZATION_STATE);
    assert.equal(invocationCount, 1);
    assert.equal(result.journal.entries[0].state, REQUEST_STATE.POST_HANDLER_SANITIZATION_FAILED);
    assert.equal(requestReplayDisposition(result.journal.entries[0]).resubmissionPermanentlyBlocked, true);
    assert.equal(result.reservation.state, RESERVATION_STATE.CLOSED_CONSERVATIVE_COST_ACCOUNTED);
    assert.equal(result.consent.status, CONSENT_STATUS.CONSUMED);
    assert.equal(result.terminalFailureManifest.providerAttemptCount, 2);
    assert.equal(result.terminalFailureManifest.physicalProviderAttemptCount, 2);
    assert.equal(result.terminalFailureManifest.conservativeConsumedCost, 1.50682355);
    validatePostHandlerFailureManifest(result.terminalFailureManifest);
    const receipt = await readJsonStrictFile(path.join(result.resultRoot, "handler-returned", "V2-RUN-001.json"));
    validateHandlerReturnedReceipt(receipt);
    assert.equal(receipt.providerAttemptCount, 2);
    assert.equal(receipt.physicalProviderAttemptCount, 2);
    assert.equal(receipt.cumulativeConservativeCost, 1.50682355);
    await assert.rejects(readFile(path.join(result.resultRoot, "responses", "V2-RUN-001.json")), /ENOENT/);
    await assert.rejects(readFile(path.join(result.resultRoot, "unscored-result-manifest.json")), /ENOENT/);
    const readback = await verifyResultReadback({ resultRoot: result.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(readback.state, POST_HANDLER_SANITIZATION_STATE);
    assert.equal(readback.responseCount, 0);
    await assert.rejects(executeBenchmarkV2(argumentsForExecution), /newly exclusive reservation|conflicting reservation|already owns/);
    assert.equal(invocationCount, 1);
    assert.equal(network.attempts.length, 0);
  } finally {
    network.restore();
  }
}));

test("continuation is exactly V2-RUN-002..026 and carries prior accounting through sealed 25-request readback", async () => withTemp("ke-v122-continuation-", async (root) => {
  const network = installHardNetworkDenial();
  try {
    const authority = await createSyntheticAuthority(frozen, "v122-continuation-exact-25");
    const continuation = await continuationAuthority(authority);
    const receipt = continuation.terminalFailureReceipt;
    assert.deepEqual(continuation.continuationScope.orderedRequestIds, CONTINUATION_REQUEST_IDS);
    assert.deepEqual(deriveContinuationRequests(frozen, continuation.continuationScope).map((request) => request.analysisId), CONTINUATION_REQUEST_IDS);
    assert.equal(continuation.continuationScope.orderedRequestIds.includes("V2-RUN-001"), false);
    assert.equal(continuation.continuationScope.priorPhysicalAttemptCount, PRIOR_PHYSICAL_ATTEMPTS);
    assert.equal(continuation.continuationScope.priorConservativeCost, PRIOR_CONSERVATIVE_COST);
    assert.equal(continuation.continuationScope.priorPhysicalAttemptCount + continuation.continuationScope.continuationPhysicalAttemptCeiling, 809);
    assert.equal(continuation.continuationScope.cumulativeConservativeMaximumCost, 39.17741232);
    assert.ok(continuation.continuationScope.continuationConservativeMaximumCost <= continuation.continuationScope.remainingConservativeCostAuthority);
    for (const mutate of [
      (scope) => { scope.orderedRequestIds[0] = "V2-RUN-001"; },
      (scope) => { scope.orderedRequestIds.reverse(); },
      (scope) => { scope.orderedRequestIds.pop(); },
      (scope) => { scope.orderedRequestHashInventory[0] = "f".repeat(64); }
    ]) {
      const changed = structuredClone(continuation.continuationScope);
      mutate(changed);
      delete changed.continuationScopeHash;
      changed.continuationScopeHash = sha256Json(changed);
      assert.throws(() => validateContinuationScope(changed, frozen));
    }

    const reservationRoot = path.join(root, "reservations");
    await seedLegacyReservations(reservationRoot, receipt, continuation.zeroExternalSupersessionReceipt);
    const mock = createSyntheticMockHandler();
    const publicSource = { canonicalUrl: "https://example.com/public/listing/offline-qualified", marketplaceItemId: "offline-qualified", seller: "Public Seller" };
    publicSource.evidenceId = underlyingOfferKey(publicSource);
    const qualifiedHandler = async (...args) => {
      const response = await mock.handler(...args);
      if (args[0].request.analysisId === "V2-RUN-002") {
        const report = response.body.valuation || response.body.listing;
        report.customerEvidence = [structuredClone(publicSource)];
        report.searchDiagnostics = { objectIntelligence: { experienceRecord: { sourcesAccepted: [{ evidenceId: publicSource.evidenceId, url: publicSource.canonicalUrl }] } } };
      }
      return response;
    };
    const result = await executeBenchmarkV2({
      mode: EXECUTION_MODE.SYNTHETIC_TEST_ONLY,
      freezeRoot: defaultFreezeRoot,
      resultHistoryRootOverride: path.join(root, "results"),
      reservationStoreRootOverride: reservationRoot,
      executionProfile: authority.profile,
      attemptCeiling: authority.attemptCeiling,
      pricingProfile: authority.pricingProfile,
      costEnvelope: authority.costEnvelope,
      launchScope: continuation.launchScope,
      continuationScope: continuation.continuationScope,
      consent: continuation.consent,
      terminalFailureReceipt: receipt,
      zeroExternalSupersessionReceipt: continuation.zeroExternalSupersessionReceipt,
      unusedConsentRevocationReceipt: continuation.unusedConsentRevocationReceipt,
      releaseIdentity: continuation.releaseIdentity,
      syntheticHandler: qualifiedHandler,
      allowedEnvironment: authority.allowedEnvironment,
      clock: deterministicClock()
    });
    assert.deepEqual(mock.invocations.map((item) => item.analysisId), CONTINUATION_REQUEST_IDS);
    assert.equal(mock.invocations.some((item) => item.analysisId === "V2-RUN-001"), false);
    assert.equal(result.terminalRecords.length, 25);
    assert.equal(result.handlerReturnedReceipts.length, 25);
    assert.equal(result.terminalRecords[0].typedPublicIdentifierProvenance.some((entry) => entry.path === "$.sanitizedTerminalResponseEnvelope.body.valuation.customerEvidence[0].evidenceId" || entry.path === "$.sanitizedTerminalResponseEnvelope.body.listing.customerEvidence[0].evidenceId"), true);
    assert.equal(result.handlerReturnedReceipts.at(-1).cumulativeConservativeCost, 39.17741232);
    assert.equal(result.ledger.actualCalculatedCost, 37.67058877);
    assert.equal(result.ledger.maximumAuthorizedCost, 38.49317645);
    const initialReadback = await verifyResultReadback({ resultRoot: result.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(initialReadback.valid, true);
    assert.equal(initialReadback.responseCount, 25);
    assert.equal(initialReadback.compositeManifestHash, null);
    const composite = await sealCompositeEvidence(result.resultRoot, {
      frozen,
      terminalFailureReceipt: receipt,
      terminalFailureTreeAggregate: "f".repeat(64),
      continuationScope: continuation.continuationScope,
      launchScope: continuation.launchScope,
      consent: result.consent,
      resultManifest: result.manifest,
      ledger: result.ledger,
      handlerReturnedReceipts: result.handlerReturnedReceipts
    });
    assert.equal(composite.state, COMPOSITE_STATE);
    assert.equal(composite.cognitiveResultCount, 25);
    assert.equal(composite.infrastructureFailureCount, 1);
    assert.equal(composite.orderedRequestDispositions[0].analysisId, "V2-RUN-001");
    assert.equal(composite.orderedRequestDispositions[0].cognitiveResultAvailable, false);
    const sealedReadback = await verifyResultReadback({ resultRoot: result.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(sealedReadback.compositeManifestHash, composite.manifestHash);
    assert.equal(sealedReadback.compositeState, COMPOSITE_STATE);
    assert.equal(network.attempts.length, 0);
  } finally {
    network.restore();
  }
}));
