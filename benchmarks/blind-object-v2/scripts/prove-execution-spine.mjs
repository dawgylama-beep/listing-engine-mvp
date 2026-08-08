import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { installHardNetworkDenial } from "../../../tests/helpers/hard-network-denial.mjs";
import {
  REQUEST_STATE,
  createCostLedger,
  createExecutionJournal,
  requestReplayDisposition,
  transitionRequest
} from "./execution-protocol.mjs";
import {
  assertNoRealAuthorityArtifacts,
  defaultFreezeRoot,
  loadPublicFreeze
} from "./execution-store.mjs";
import {
  createSyntheticMockHandler,
  executeBenchmarkV2,
  verifyResultReadback
} from "./executor.mjs";
import {
  createSyntheticAuthority,
  deterministicClock
} from "./synthetic-authority.mjs";

await assertNoRealAuthorityArtifacts();
const reads = [];
const frozen = await loadPublicFreeze(defaultFreezeRoot, { onRead: (relativePath) => reads.push(relativePath) });
assert.equal(reads.some((relativePath) => relativePath.startsWith("evaluator-only/")), false);
const authority = await createSyntheticAuthority(frozen, "compatibility-proof");
const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v2-spine-proof-"));
const history = path.join(temporary, "results");
const reservations = path.join(temporary, "reservations");
const mock = createSyntheticMockHandler();
const network = installHardNetworkDenial();

try {
  const result = await executeBenchmarkV2({
    mode: authority.mode,
    freezeRoot: defaultFreezeRoot,
    resultHistoryRootOverride: history,
    reservationStoreRootOverride: reservations,
    executionProfile: authority.profile,
    attemptCeiling: authority.attemptCeiling,
    pricingProfile: authority.pricingProfile,
    consent: authority.consent,
    syntheticHandler: mock.handler,
    allowedEnvironment: authority.allowedEnvironment,
    clock: deterministicClock()
  });
  assert.equal(result.disposition, "DRY_RUN_EXECUTION_SPINE_READY_NOT_AUTHORIZED");
  assert.equal(result.manifest.submittedCount, 26);
  assert.equal(result.manifest.terminalCount, 26);
  assert.equal(result.manifest.normalSuccessCount, 24);
  assert.equal(result.manifest.productTerminalFailureCount, 2);
  assert.equal(result.manifest.executionIntegrityFailureCount, 0);
  assert.equal(mock.invocationCount, 26);
  assert.deepEqual(mock.invocations.map((entry) => entry.analysisId), frozen.analysisPlan.analyses.map((entry) => entry.analysisId));
  assert.equal(mock.invocations.every((entry) => entry.photoIds.length === 2), true);

  const readback = await verifyResultReadback({ resultRoot: result.resultRoot, freezeRoot: defaultFreezeRoot });
  assert.equal(readback.handlerInvocationCount, 0);
  assert.equal(readback.providerAttemptCount, 0);
  assert.equal(readback.fileWriteCount, 0);

  let journal = createExecutionJournal({ invocationId: authority.consent.invocationId, consentHash: authority.consent.consentHash, requests: frozen.requests, nowIso: "2026-08-07T13:00:00.000Z" });
  journal = transitionRequest(journal, frozen.requests[0].analysisId, REQUEST_STATE.SUBMISSION_INTENT_RECORDED, { at: "2026-08-07T13:00:00.001Z", reason: "PRE_START_TEST", physicalSubmissionIdentity: "submission-11111111111111111111111111111111" });
  journal = transitionRequest(journal, frozen.requests[0].analysisId, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION, { at: "2026-08-07T13:00:00.002Z", reason: "INTERRUPTED_BEFORE_START" });
  const preStart = requestReplayDisposition(journal.entries[0]);
  assert.equal(preStart.state, REQUEST_STATE.BLOCKED_BEFORE_SUBMISSION);
  assert.equal(preStart.resubmissionPermanentlyBlocked, false);

  journal = createExecutionJournal({ invocationId: authority.consent.invocationId, consentHash: authority.consent.consentHash, requests: frozen.requests, nowIso: "2026-08-07T13:00:01.000Z" });
  journal = transitionRequest(journal, frozen.requests[0].analysisId, REQUEST_STATE.SUBMISSION_INTENT_RECORDED, { at: "2026-08-07T13:00:01.001Z", reason: "POST_START_TEST", physicalSubmissionIdentity: "submission-22222222222222222222222222222222" });
  journal = transitionRequest(journal, frozen.requests[0].analysisId, REQUEST_STATE.SUBMISSION_STARTED, { at: "2026-08-07T13:00:01.002Z", reason: "POST_START_TEST" });
  journal = transitionRequest(journal, frozen.requests[0].analysisId, REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION, { at: "2026-08-07T13:00:01.003Z", reason: "AMBIGUOUS_COMPLETION" });
  const postStart = requestReplayDisposition(journal.entries[0]);
  assert.equal(postStart.resubmissionPermanentlyBlocked, true);

  const costStop = createCostLedger({
    invocationId: authority.consent.invocationId,
    consentHash: authority.consent.consentHash,
    pricingProfileHash: authority.pricingProfile.pricingProfileHash,
    maximumAuthorizedCost: 1,
    conservativePreRunMaximum: 2,
    requests: frozen.requests,
    nowIso: "2026-08-07T13:00:02.000Z"
  });
  assert.equal(costStop.stopBeforeNextRequestDecision, true);
  assert.equal(network.attempts.length, 0);
  await assertNoRealAuthorityArtifacts();
  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    disposition: result.disposition,
    publicRequestCount: frozen.requests.length,
    mockHandlerInvocationCount: mock.invocationCount,
    normalSuccessCount: result.manifest.normalSuccessCount,
    productTerminalFailureCount: result.manifest.productTerminalFailureCount,
    executionIntegrityFailureCount: result.manifest.executionIntegrityFailureCount,
    preSubmissionInterruptionState: preStart.state,
    unknownAfterSubmissionState: postStart.state,
    unknownAfterSubmissionRetryBlocked: postStart.resubmissionPermanentlyBlocked,
    costStopBeforeNextRequest: costStop.stopBeforeNextRequestDecision,
    privateControlReads: reads.filter((relativePath) => relativePath.startsWith("evaluator-only/")).length,
    externalNetworkAttempts: network.attempts.length,
    strictReadbackHandlerInvocations: readback.handlerInvocationCount,
    strictReadbackWrites: readback.fileWriteCount,
    syntheticOutputDisposition: "CLEANED_FROM_OS_TEMPORARY_ROOT"
  })}\n`);
} finally {
  network.restore();
  await rm(temporary, { recursive: true, force: true, maxRetries: 3 });
}
