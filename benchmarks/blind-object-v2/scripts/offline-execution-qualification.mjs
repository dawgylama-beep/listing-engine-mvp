import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  CONSENT_STATUS,
  EXECUTION_MODE,
  createExecutionConsent,
  validateExecutionConsent
} from "./execution-protocol.mjs";
import {
  POST_HANDLER_SANITIZATION_STATE,
  validateHandlerReturnedReceipt,
  validatePostHandlerFailureManifest
} from "./post-handler-durability-protocol.mjs";
import {
  createSyntheticMockHandler,
  executeBenchmarkV2,
  verifyResultReadback
} from "./executor.mjs";
import {
  defaultResultHistoryRoot,
  defaultFreezeRoot,
  loadPublicFreeze,
  readJsonStrictFile,
  writeResultFile,
  writeExclusiveSynced
} from "./execution-store.mjs";
import {
  UNUSED_VERSION_1_12_22_CONSENT_PATH,
  validateContinuationReleaseChain
} from "./consent-revocation.mjs";
import { readQuarantinedHandlerReturn } from "./handler-return-quarantine.mjs";
import { inspectTerminalSanitizer, validateSanitizerDecisionReceipt } from "./sanitizer-decision.mjs";
import { advanceGovernor, reconstructGovernorEpisode, validateLifecycleTransitionManifest } from "./cognitive-lifecycle-governor.mjs";
import { COGNITIVE_LIFECYCLE_INVARIANT_CATALOG, validateInvariantCatalog } from "./cognitive-lifecycle-invariants.mjs";
import { PUBLIC_IDENTIFIER_CONTRACT_MANIFEST, buildGeneratedProvenanceSchema, validatePublicIdentifierContractManifest } from "./public-identifier-contract-manifest.mjs";
import { publicIdentifierContractForActualPath } from "./typed-public-identifier.mjs";
import { COMPOSITE_STATE, sealCompositeEvidence } from "./composite-evidence.mjs";
import { verifyFixedV11221Reconciliation } from "./post-handler-reconciliation.mjs";

function installNetworkDenial() {
  const attempts = [];
  const originals = { fetch: globalThis.fetch, httpRequest: http.request, httpGet: http.get, httpsRequest: https.request, httpsGet: https.get };
  const deny = (mechanism) => (...args) => {
    attempts.push({ mechanism, argumentType: typeof args[0] });
    throw new Error(`OFFLINE_QUALIFICATION_NETWORK_DENIED:${mechanism}`);
  };
  globalThis.fetch = deny("fetch");
  http.request = deny("http.request");
  http.get = deny("http.get");
  https.request = deny("https.request");
  https.get = deny("https.get");
  return Object.freeze({
    attempts,
    restore() {
      globalThis.fetch = originals.fetch;
      http.request = originals.httpRequest;
      http.get = originals.httpGet;
      https.request = originals.httpsRequest;
      https.get = originals.httpsGet;
    }
  });
}

async function seedHistoricalReservations(storeRoot, preflight) {
  const sources = [
    path.join(defaultResultHistoryRoot, ".reservations", `${preflight.supersessionReceipt.supersededInvocationId}.json`),
    path.join(defaultResultHistoryRoot, ".reservations", `${preflight.terminalFailureReceipt.sourceInvocationId}.json`)
  ];
  for (const source of sources) {
    const value = await readJsonStrictFile(source);
    await writeExclusiveSynced(path.join(storeRoot, path.basename(source)), value);
  }
}

function assertReleaseChainNegatives(preflight) {
  const argumentsFor = (overrides = {}) => ({
    releaseIdentity: preflight.releaseIdentity,
    zeroExternalSupersessionReceipt: preflight.supersessionReceipt,
    terminalFailureReceipt: preflight.terminalFailureReceipt,
    unusedConsentRevocationReceipt: preflight.unusedConsentRevocationReceipt,
    version1123FailureEvidence: preflight.version1123FailureEvidence,
    ...overrides
  });
  const cases = [];
  function fail(label, mutate) {
    const values = structuredClone(argumentsFor());
    mutate(values);
    assert.throws(() => validateContinuationReleaseChain(values), undefined, `${label} did not fail closed`);
    cases.push(label);
  }
  fail("WRONG_VERSION_1_12_21_RELEASE_HASH", (value) => { value.releaseIdentity.release.historicalExecutionReleaseRecordHash = "0".repeat(64); });
  fail("WRONG_VERSION_1_12_22_RELEASE_HASH", (value) => { value.releaseIdentity.release.version1122ExecutionReleaseRecordHash = "1".repeat(64); });
  fail("WRONG_VERSION_1_12_23_RELEASE_HASH", (value) => { value.releaseIdentity.release.predecessorExecutionReleaseRecordHash = "2".repeat(64); });
  fail("WRONG_VERSION_1_12_24_RELEASE_HASH", (value) => { value.releaseIdentity.executionReleaseRecordHash = "3".repeat(64); });
  fail("SWAPPED_RELEASE_HASHES", (value) => {
    [value.releaseIdentity.release.historicalExecutionReleaseRecordHash, value.releaseIdentity.release.version1122ExecutionReleaseRecordHash]
      = [value.releaseIdentity.release.version1122ExecutionReleaseRecordHash, value.releaseIdentity.release.historicalExecutionReleaseRecordHash];
  });
  fail("UNKNOWN_RELEASE_HASH", (value) => { value.releaseIdentity.release.predecessorExecutionReleaseRecordHash = "f".repeat(64); });
  fail("TAMPERED_RECONCILIATION_EVIDENCE", (value) => { value.terminalFailureReceipt.sourceJournalHash = "3".repeat(64); });
  fail("TAMPERED_SUPERSESSION_EVIDENCE", (value) => { value.zeroExternalSupersessionReceipt.sourceLedgerHash = "4".repeat(64); });
  fail("TAMPERED_UNUSED_CONSENT_REVOCATION", (value) => { value.unusedConsentRevocationReceipt.sourceConsentHash = "5".repeat(64); });
  fail("MISSING_PREDECESSOR_REFERENCE", (value) => { delete value.releaseIdentity.release.predecessorExecutionReleaseRecordHash; });
  fail("AMBIGUOUS_PREDECESSOR_REFERENCE", (value) => { value.releaseIdentity.release.predecessorExecutionReleaseRecordHashes = [value.releaseIdentity.release.predecessorExecutionReleaseRecordHash]; });
  return Object.freeze(cases);
}

function successfulQualificationHandler() {
  const mock = createSyntheticMockHandler();
  const handler = async (...args) => {
    const response = await mock.handler(...args);
    response.quarantineOnlyCanary = "QUARANTINE_ONLY_1_12_24_EXACT_HANDLER_BYTES";
    return response;
  };
  return Object.freeze({ mock, handler });
}

async function executeOfflineFixture({ preflight, root, label, handler, faultPlan = null }) {
  const resultHistoryRoot = path.join(root, `${label}-results`);
  const reservationStoreRoot = path.join(root, `${label}-reservations`);
  await seedHistoricalReservations(reservationStoreRoot, preflight);
  const consent = createExecutionConsent({ launchScope: preflight.launchScope, costEnvelope: preflight.costEnvelope }, "2026-08-09T22:00:00.000Z");
  return executeBenchmarkV2({
    mode: EXECUTION_MODE.SYNTHETIC_TEST_ONLY,
    freezeRoot: defaultFreezeRoot,
    resultHistoryRootOverride: resultHistoryRoot,
    reservationStoreRootOverride: reservationStoreRoot,
    executionProfile: preflight.profile,
    attemptCeiling: preflight.attemptCeiling,
    pricingProfile: preflight.pricingProfile,
    costEnvelope: preflight.costEnvelope,
    launchScope: preflight.launchScope,
    continuationScope: preflight.continuationScope,
    consent,
    allowedEnvironment: preflight.allowedEnvironment,
    zeroExternalSupersessionReceipt: preflight.supersessionReceipt,
    terminalFailureReceipt: preflight.terminalFailureReceipt,
    unusedConsentRevocationReceipt: preflight.unusedConsentRevocationReceipt,
    version1123FailureEvidence: preflight.version1123FailureEvidence,
    releaseIdentity: preflight.releaseIdentity,
    syntheticHandler: handler,
    faultPlan
  });
}

export async function runOfflineExecutionQualification({ preflight }) {
  assert.equal(preflight.releaseIdentity.executorVersion, "1.12.24");
  assert.equal(preflight.releaseChain.valid, true);
  const negativeReleaseChainCases = assertReleaseChainNegatives(preflight);
  const oldConsent = JSON.parse(await readFile(UNUSED_VERSION_1_12_22_CONSENT_PATH, "utf8"));
  assert.throws(() => validateExecutionConsent(oldConsent, { launchScope: preflight.launchScope, requiredStatus: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED }), undefined, "reused Version 1.12.22 consent did not fail closed");

  const root = await mkdtemp(path.join(os.tmpdir(), "katherines-eye-offline-qualification-"));
  const network = installNetworkDenial();
  try {
    const successFixture = successfulQualificationHandler();
    const successful = await executeOfflineFixture({ preflight, root, label: "success", handler: successFixture.handler, faultPlan: { knownDownstreamRecovery: "V2-RUN-003" } });
    const successfulReadback = await verifyResultReadback({ resultRoot: successful.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(successfulReadback.responseCount, 24, JSON.stringify({ disposition: successful.disposition, sanitizerDecisionReceipts: successful.sanitizerDecisionReceipts }));
    assert.equal(successFixture.mock.invocationCount, 24);
    const allowedContract = PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.qualificationInventory[0];
    const allowedPath = { path: allowedContract.positiveFixture.actualPath, normalizedSchemaPath: allowedContract.normalizedSchemaPath };
    assert.equal(publicIdentifierContractForActualPath(allowedPath.path)?.registryContractId, allowedContract.registryContractId);
    assert.equal(successful.handlerReturnedReceipts.length, 24);
    successful.handlerReturnedReceipts.forEach((receipt) => validateHandlerReturnedReceipt(receipt));
    assert.equal(successful.governorEpisode.currentPhase, "READBACK_VERIFIED");
    assert.equal(successful.governorRecoveryDecisions.length, 1);
    assert.equal(successful.governorRecoveryDecisions[0].handlerOrProviderReplayPerformed, false);
    const lifecycleManifest = await readJsonStrictFile(path.join(successful.resultRoot, "cognitive-lifecycle-transition-manifest.json"));
    validateLifecycleTransitionManifest(lifecycleManifest);
    for (let count = 0; count <= successful.governorDecisionReceipts.length; count += 1) {
      reconstructGovernorEpisode(lifecycleManifest, successful.governorDecisionReceipts.slice(0, count));
    }
    assert.throws(() => reconstructGovernorEpisode(lifecycleManifest, [...successful.governorDecisionReceipts, successful.governorDecisionReceipts.at(-1)]), /sequence|predecessor|terminal|strictly equal/i);
    const backward = structuredClone(successful.governorDecisionReceipts);
    backward.at(-1).toNodeId = lifecycleManifest.nodes[0].nodeId;
    assert.throws(() => reconstructGovernorEpisode(lifecycleManifest, backward), /hash|successor|backward/i);
    const quarantineRoot = path.join(path.dirname(successful.resultRoot), ".handler-return-quarantine");
    const firstHandlerReceipt = successful.handlerReturnedReceipts[0];
    const firstQuarantineReceipt = await readJsonStrictFile(path.join(successful.resultRoot, "handler-quarantine-receipts", `${firstHandlerReceipt.requestId}.json`));
    const quarantineBindings = Object.fromEntries(["executionReleaseRecordHash", "consentId", "consentHash", "invocationId", "reservationId", "reservationHash", "resultId", "resultRootName", "requestId", "requestHash", "physicalSubmissionIdentity"].map((field) => [field, firstQuarantineReceipt[field]]));
    const quarantined = await readQuarantinedHandlerReturn({ receipt: firstQuarantineReceipt, bindings: quarantineBindings, quarantineRoot });
    assert.equal(quarantined.canonicalHandlerResultHash, firstHandlerReceipt.canonicalHandlerResultHash);
    const substitutedRequest = { ...quarantineBindings, requestId: "V2-RUN-026" };
    await assert.rejects(() => readQuarantinedHandlerReturn({ receipt: firstQuarantineReceipt, bindings: substitutedRequest, quarantineRoot }), /substitution|differs/i);
    const substitutedRelease = { ...quarantineBindings, executionReleaseRecordHash: "f".repeat(64) };
    await assert.rejects(() => readQuarantinedHandlerReturn({ receipt: firstQuarantineReceipt, bindings: substitutedRelease, quarantineRoot }), /substitution|differs/i);
    const publicTreeText = await Promise.all((await (await import("./execution-store.mjs")).listResultFiles(successful.resultRoot)).map(async (relativePath) => readFile(path.join(successful.resultRoot, ...relativePath.split("/")), "utf8")));
    assert.equal(publicTreeText.some((text) => text.includes("QUARANTINE_ONLY_1_12_24_EXACT_HANDLER_BYTES")), false);
    validatePublicIdentifierContractManifest();
    validateInvariantCatalog();
    assert.equal(COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.records.length >= 12, true);
    const generatedSchema = buildGeneratedProvenanceSchema();
    assert.equal(generatedSchema.registryContractIds.length, PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.contracts.length);
    for (const item of PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.qualificationInventory) {
      assert.equal(publicIdentifierContractForActualPath(item.positiveFixture.actualPath)?.registryContractId, item.registryContractId);
      for (const negative of item.negativeFixtures) assert.equal(publicIdentifierContractForActualPath(negative.actualPath), null);
    }
    for (const credential of [
      "sk-proj-A1b2C3d4E5f6G7h8I9j0K1l2", "Bearer AbCdEf0123456789+/=", "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.AbCdEfGhIjKlMnOpQrStUv",
      "sessionid=AbCdEf0123456789+/=", "-----BEGIN PRIVATE KEY-----\nAbCdEf0123456789\n-----END PRIVATE KEY-----", "Public%AbCdEf0123456789+/=-Unexplained"
    ]) assert.equal(inspectTerminalSanitizer({ untrusted: credential }).decision, "REJECTED");
    for (const requestId of preflight.continuationScope.orderedRequestIds) {
      const receipt = await readJsonStrictFile(path.join(successful.resultRoot, "sanitizer-decisions", `${requestId}.json`));
      validateSanitizerDecisionReceipt(receipt);
      assert.equal(receipt.decision, "ACCEPTED");
      assert.equal(receipt.rawRejectedValuesIncluded, false);
    }
    const [frozen, historicalFailure] = await Promise.all([
      loadPublicFreeze(defaultFreezeRoot),
      verifyFixedV11221Reconciliation({ releaseIdentity: preflight.releaseIdentity })
    ]);
    const composite = await sealCompositeEvidence(successful.resultRoot, {
      frozen,
      terminalFailureReceipt: historicalFailure.receipt,
      terminalFailureTreeAggregate: historicalFailure.terminalFailureTreeAggregate,
      version1123FailureEvidence: preflight.version1123FailureEvidence,
      continuationScope: preflight.continuationScope,
      launchScope: preflight.launchScope,
      consent: successful.consent,
      resultManifest: successful.manifest,
      ledger: successful.ledger,
      handlerReturnedReceipts: successful.handlerReturnedReceipts,
      lifecycleTransitionManifestHash: lifecycleManifest.manifestHash,
      lifecycleInvariantCatalogHash: COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.catalogHash,
      governorDecisionAggregateHash: successfulReadback.governorDecisionAggregateHash
    });
    assert.equal(composite.state, COMPOSITE_STATE);
    const governorIdentities = {
      releaseRecordHash: successful.manifest.executionReleaseRecordHash,
      consentId: successful.consent.consentId,
      invocationId: successful.consent.invocationId,
      reservationId: successful.consent.reservationId,
      resultId: successful.consent.resultId,
      resultRootName: successful.consent.resultRootName
    };
    const completedDecisions = [...successful.governorDecisionReceipts];
    const compositeDecision = advanceGovernor({ manifest: lifecycleManifest, priorReceipts: completedDecisions, observedEvidenceType: "COUNT_BEARING_UNSCORED_COMPOSITE_SEALED", observedEvidence: { manifestHash: composite.manifestHash }, identities: governorIdentities, decidedAt: "2026-08-09T00:10:00.000Z" });
    await writeResultFile(successful.resultRoot, `governor-decisions/${String(compositeDecision.sequence).padStart(6, "0")}.json`, compositeDecision);
    completedDecisions.push(compositeDecision);
    const readyDecision = advanceGovernor({ manifest: lifecycleManifest, priorReceipts: completedDecisions, observedEvidenceType: "COMPOSITE_INDEPENDENT_READBACK_VERIFIED", observedEvidence: { manifestHash: composite.manifestHash, state: composite.state }, identities: governorIdentities, decidedAt: "2026-08-09T00:10:00.001Z" });
    await writeResultFile(successful.resultRoot, `governor-decisions/${String(readyDecision.sequence).padStart(6, "0")}.json`, readyDecision);
    completedDecisions.push(readyDecision);
    assert.equal(reconstructGovernorEpisode(lifecycleManifest, completedDecisions).currentPhase, "COGNITIVE_EVALUATION_READY");
    const sealedReadback = await verifyResultReadback({ resultRoot: successful.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(sealedReadback.compositeManifestHash, composite.manifestHash);
    assert.equal(sealedReadback.governorCurrentPhase, "COGNITIVE_EVALUATION_READY");

    let failureHandlerInvocationCount = 0;
    const failed = await executeOfflineFixture({
      preflight,
      root,
      label: "sanitizer-failure",
      handler: async () => {
        failureHandlerInvocationCount += 1;
        return {
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: { valuation: { customerEvidence: [{ canonicalUrl: "https://example.com/public/listing/rejected", evidenceId: "Public%AbCdEf0123456789+/=-Unexplained" }] } }
        };
      }
    });
    assert.equal(failed.disposition, POST_HANDLER_SANITIZATION_STATE);
    assert.equal(failureHandlerInvocationCount, 1);
    assert.equal(failed.handlerReturnedReceipts.length, 1);
    validateHandlerReturnedReceipt(failed.handlerReturnedReceipts[0]);
    validatePostHandlerFailureManifest(failed.terminalFailureManifest);
    assert.equal(failed.terminalFailureManifest.publicResponseArtifactCommitted, false);
    assert.equal(failed.reservation.state, "CLOSED_CONSERVATIVE_COST_ACCOUNTED");
    assert.equal(failed.consent.status, "CONSUMED");
    assert.equal(failed.sanitizerDecisionReceipts[0].decision, "REJECTED");
    assert.equal(failed.sanitizerDecisionReceipts[0].rejectedLocationCount >= 1, true);
    assert.equal(failed.sanitizerDecisionReceipts[0].rejectedLocations.every((item) => !Object.hasOwn(item, "value")), true);
    assert.equal(failed.boundedRepairDossier.replayPermitted, false);
    const failedReadback = await verifyResultReadback({ resultRoot: failed.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(failedReadback.responseCount, 0);
    assert.equal(network.attempts.length, 0);

    return Object.freeze({
      disposition: "VERSION_1_12_24_COGNITIVE_LIFECYCLE_GOVERNOR_OFFLINE_QUALIFIED",
      releaseChainHash: preflight.releaseChain.releaseChainHash,
      negativeReleaseChainCases,
      reusedVersion1122ConsentRejected: true,
      successfulRequestCount: successful.terminalRecords.length,
      successfulHandlerReturnedCount: successful.handlerReturnedReceipts.length,
      allowedPublicIdentifierPath: allowedPath.path,
      allowedPublicIdentifierNormalizedSchemaPath: allowedPath.normalizedSchemaPath,
      intentionalSanitizerFailureDisposition: failed.disposition,
      intentionalFailureHandlerReturnedCount: failed.handlerReturnedReceipts.length,
      intentionalFailureResponseCount: failedReadback.responseCount,
      lifecycleTransitionCount: successful.governorDecisionReceipts.length,
      restartReconstructionCount: successful.governorDecisionReceipts.length + 1,
      deterministicDownstreamRecoveryCount: successful.governorRecoveryDecisions.length,
      compositeManifestHash: composite.manifestHash,
      sealedGovernorDecisionCount: completedDecisions.length,
      publicIdentifierContractCount: PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.contracts.length,
      invariantCount: COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.records.length,
      quarantineExactByteReadbackHash: quarantined.canonicalHandlerResultHash,
      transactionRollbackState: failed.reservation.state,
      handlerInvocationCount: successFixture.mock.invocationCount + failureHandlerInvocationCount,
      providerAttemptCount: 0,
      physicalProviderAttemptCount: 0,
      networkAttemptCount: network.attempts.length,
      isolatedTemporaryRootsRemovedOnReturn: true
    });
  } finally {
    network.restore();
    await rm(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
