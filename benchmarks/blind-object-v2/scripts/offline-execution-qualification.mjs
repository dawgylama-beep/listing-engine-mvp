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
  readJsonStrictFile,
  writeExclusiveSynced
} from "./execution-store.mjs";
import {
  UNUSED_VERSION_1_12_22_CONSENT_PATH,
  validateContinuationReleaseChain
} from "./consent-revocation.mjs";
import { underlyingOfferKey } from "../../../lib/evidence/dedupe.js";

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
  fail("WRONG_VERSION_1_12_22_RELEASE_HASH", (value) => { value.releaseIdentity.release.predecessorExecutionReleaseRecordHash = "1".repeat(64); });
  fail("WRONG_VERSION_1_12_23_RELEASE_HASH", (value) => { value.releaseIdentity.executionReleaseRecordHash = "2".repeat(64); });
  fail("SWAPPED_RELEASE_HASHES", (value) => {
    [value.releaseIdentity.release.historicalExecutionReleaseRecordHash, value.releaseIdentity.release.predecessorExecutionReleaseRecordHash]
      = [value.releaseIdentity.release.predecessorExecutionReleaseRecordHash, value.releaseIdentity.release.historicalExecutionReleaseRecordHash];
  });
  fail("UNKNOWN_RELEASE_HASH", (value) => { value.releaseIdentity.release.predecessorExecutionReleaseRecordHash = "f".repeat(64); });
  fail("TAMPERED_RECONCILIATION_EVIDENCE", (value) => { value.terminalFailureReceipt.sourceJournalHash = "3".repeat(64); });
  fail("TAMPERED_SUPERSESSION_EVIDENCE", (value) => { value.zeroExternalSupersessionReceipt.sourceLedgerHash = "4".repeat(64); });
  fail("TAMPERED_UNUSED_CONSENT_REVOCATION", (value) => { value.unusedConsentRevocationReceipt.sourceConsentHash = "5".repeat(64); });
  fail("MISSING_PREDECESSOR_REFERENCE", (value) => { delete value.releaseIdentity.release.predecessorExecutionReleaseRecordHash; });
  fail("AMBIGUOUS_PREDECESSOR_REFERENCE", (value) => { value.releaseIdentity.release.predecessorExecutionReleaseRecordHashes = [value.releaseIdentity.release.predecessorExecutionReleaseRecordHash]; });
  return Object.freeze(cases);
}

function exactPublicSource() {
  const source = {
    canonicalUrl: "https://example.com/public/listing/offline-cli-qualification",
    marketplaceItemId: "offline-cli-qualification",
    seller: "Public Seller"
  };
  return Object.freeze({ ...source, evidenceId: underlyingOfferKey(source) });
}

function successfulQualificationHandler() {
  const mock = createSyntheticMockHandler();
  const source = exactPublicSource();
  const handler = async (...args) => {
    const response = await mock.handler(...args);
    if (args[0].request.analysisId === "V2-RUN-002") {
      const report = response.body.valuation || response.body.listing;
      report.customerEvidence = [structuredClone(source)];
      report.searchDiagnostics = {
        objectIntelligence: {
          experienceRecord: { sourcesAccepted: [{ evidenceId: source.evidenceId, url: source.canonicalUrl }] }
        }
      };
    }
    return response;
  };
  return Object.freeze({ mock, source, handler });
}

async function executeOfflineFixture({ preflight, root, label, handler }) {
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
    releaseIdentity: preflight.releaseIdentity,
    syntheticHandler: handler
  });
}

export async function runOfflineExecutionQualification({ preflight }) {
  assert.equal(preflight.releaseIdentity.executorVersion, "1.12.23");
  assert.equal(preflight.releaseChain.valid, true);
  const negativeReleaseChainCases = assertReleaseChainNegatives(preflight);
  const oldConsent = JSON.parse(await readFile(UNUSED_VERSION_1_12_22_CONSENT_PATH, "utf8"));
  assert.throws(() => validateExecutionConsent(oldConsent, { launchScope: preflight.launchScope, requiredStatus: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED }), undefined, "reused Version 1.12.22 consent did not fail closed");

  const root = await mkdtemp(path.join(os.tmpdir(), "katherines-eye-offline-qualification-"));
  const network = installNetworkDenial();
  try {
    const successFixture = successfulQualificationHandler();
    const successful = await executeOfflineFixture({ preflight, root, label: "success", handler: successFixture.handler });
    const successfulReadback = await verifyResultReadback({ resultRoot: successful.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(successfulReadback.responseCount, 25);
    assert.equal(successFixture.mock.invocationCount, 25);
    const allowedPath = successful.terminalRecords[0].typedPublicIdentifierProvenance.find((entry) => entry.identifierHash);
    assert.ok(allowedPath, "offline CLI qualification did not preserve a typed public identifier");
    assert.equal(successful.handlerReturnedReceipts.length, 25);
    successful.handlerReturnedReceipts.forEach((receipt) => validateHandlerReturnedReceipt(receipt));

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
    const failedReadback = await verifyResultReadback({ resultRoot: failed.resultRoot, freezeRoot: defaultFreezeRoot });
    assert.equal(failedReadback.responseCount, 0);
    assert.equal(network.attempts.length, 0);

    return Object.freeze({
      disposition: "VERSION_1_12_23_OFFLINE_PRODUCTION_CLI_EXECUTOR_QUALIFIED",
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
