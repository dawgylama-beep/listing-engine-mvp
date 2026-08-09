import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { copyFile, mkdir, mkdtemp, readFile, readdir, rm, symlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";
import {
  CONSENT_STATUS,
  EXECUTION_MODE,
  REQUEST_STATE,
  RESERVATION_STATE,
  createExecutionConsent,
  createInvocationReservation,
  requestReplayDisposition
} from "../benchmarks/blind-object-v2/scripts/execution-protocol.mjs";
import {
  createZeroExternalSupersessionReceipt,
  validateZeroExternalSupersessionReceipt
} from "../benchmarks/blind-object-v2/scripts/pre-external-recovery-protocol.mjs";
import {
  FIXED_FAILURE_APPEND_PATHS,
  loadFixedFailureAuthority
} from "../benchmarks/blind-object-v2/scripts/pre-external-reconciliation.mjs";
import {
  benchmarkRoot,
  computeResultTreeAggregate,
  createExclusiveReservation,
  defaultFreezeRoot,
  defaultResultHistoryRoot,
  loadPublicFreeze
} from "../benchmarks/blind-object-v2/scripts/execution-store.mjs";
import { createLaunchScope } from "../benchmarks/blind-object-v2/scripts/launch-identity.mjs";
import { transformPhotosForProduct } from "../benchmarks/blind-object-v2/scripts/execution-profile.mjs";
import {
  createSyntheticMockHandler,
  executeBenchmarkV2,
  verifyResultReadback
} from "../benchmarks/blind-object-v2/scripts/executor.mjs";
import { createSyntheticAuthority, deterministicClock } from "../benchmarks/blind-object-v2/scripts/synthetic-authority.mjs";

const execFileAsync = promisify(execFile);
const FREEZE = "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699";
const ORIGINAL_PATHS = Object.freeze(["cost-envelope.json", "cost-ledger.json", "execution-consent.json", "execution-journal.json", "execution-profile.json", "invocation-reservation.json", "launch-scope.json", "pricing-profile.json"]);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

async function run(command, args, options = {}) {
  try {
    const result = await execFileAsync(command, args, { encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024, ...options });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: Number(error.code) || 1, stdout: String(error.stdout || ""), stderr: String(error.stderr || error.message || "") };
  }
}

test("all 26 frozen bundles and all 28 public photographs transform with a live browser at the handler boundary", { timeout: 180_000 }, async () => {
  const network = installHardNetworkDenial();
  const unique = new Set();
  try {
    for (const request of frozen.requests) {
      request.inputAssets.forEach((asset) => unique.add(asset.frozenRelativePath));
      const photos = await transformPhotosForProduct(request, frozen.assetCache, async (prepared, lifecycle) => {
        assert.deepEqual(lifecycle, { pageOpen: true, contextOwnsPage: true, browserConnected: true });
        return prepared;
      });
      assert.equal(photos.length, 2);
      assert.deepEqual(photos.map((photo) => photo.photoId), request.inputAssets.map((asset) => asset.photoId));
      assert.equal(photos.every((photo) => /^data:image\/jpeg;base64,/.test(photo.dataUrl)), true);
    }
    assert.equal(unique.size, 28);
    assert.equal(network.attempts.length, 0);
  } finally {
    network.restore();
  }
});

test("forced browser closure during local transformation seals PRE_EXTERNAL_ABORT with zero external activity", { timeout: 120_000 }, async () => withTemp("ke-v121-pre-external-", async (root) => {
  const authority = await createSyntheticAuthority(frozen, "forced-pre-external-abort");
  const mock = createSyntheticMockHandler();
  const canonicalStates = [];
  const forcedClosureTransformer = async (request, assetCache) => {
    for (const asset of request.inputAssets) assert.ok(assetCache.get(asset.frozenRelativePath));
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await browser.close();
    await page.evaluate(() => true);
  };
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
    photoTransformer: forcedClosureTransformer,
    allowedEnvironment: authority.allowedEnvironment,
    onConsentTransition: async (consent) => canonicalStates.push(consent.status),
    clock: deterministicClock()
  });
  assert.equal(result.disposition, "ABORTED_PRE_HANDLER_ZERO_EXTERNAL_ACTIVITY");
  assert.equal(result.journal.entries[0].state, REQUEST_STATE.PRE_EXTERNAL_ABORT);
  assert.equal(result.journal.entries[0].physicalSubmissionIdentity, null);
  assert.equal(requestReplayDisposition(result.journal.entries[0]).resubmissionPermanentlyBlocked, false);
  assert.equal(result.consent.status, CONSENT_STATUS.CONSUMED);
  assert.equal(result.reservation.state, RESERVATION_STATE.CLOSED_PRE_EXTERNAL_ABORT);
  assert.deepEqual(canonicalStates, [CONSENT_STATUS.CONSUMED, CONSENT_STATUS.CONSUMED]);
  assert.equal(mock.invocationCount, 0);
  assert.equal(result.ledger.actualCalculatedCost, 0);
  assert.deepEqual(result.ledger.perAttemptCostRecords, []);
  const readback = await verifyResultReadback({ resultRoot: result.resultRoot, freezeRoot: defaultFreezeRoot });
  assert.equal(readback.state, "ABORTED_PRE_HANDLER_ZERO_EXTERNAL_ACTIVITY");
  assert.equal(readback.handlerInvocationCount, 0);
  assert.equal(readback.providerAttemptCount, 0);
}));

test("failure after EXTERNAL_ATTEMPT_COMMITTED remains ambiguous and permanently non-replayable", async () => withTemp("ke-v121-post-external-", async (root) => {
  const authority = await createSyntheticAuthority(frozen, "post-external-failure");
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
    faultPlan: { afterExternalAttemptCommitted: "V2-RUN-001" },
    allowedEnvironment: authority.allowedEnvironment,
    clock: deterministicClock()
  });
  assert.equal(result.journal.entries[0].state, REQUEST_STATE.UNKNOWN_AFTER_SUBMISSION);
  assert.match(result.journal.entries[0].physicalSubmissionIdentity, /^submission-/);
  assert.equal(requestReplayDisposition(result.journal.entries[0]).resubmissionPermanentlyBlocked, true);
  assert.equal(mock.invocationCount, 0);
  assert.equal(result.reservation.state, RESERVATION_STATE.INDETERMINATE);
}));

test("zero-external supersession permits one successor reservation and rejects activity, uncertainty, and reuse", async () => withTemp("ke-v121-supersession-", async (root) => {
  const fixed = await loadFixedFailureAuthority();
  const authority = await createSyntheticAuthority(frozen, "supersession-store");
  const receiptInput = {
    failureAuthorityHash: fixed.recordHash,
    sourceExecutionReleaseRecordHash: fixed.sourceExecutionReleaseRecordHash,
    sourceExecutorVersion: fixed.sourceExecutorVersion,
    sourceResultRootName: fixed.sourceResultRootName,
    sourcePartialArtifactAggregate: fixed.sourcePartialArtifactAggregate,
    sourceJournalHash: fixed.sourceJournalHash,
    sourceLedgerHash: fixed.sourceLedgerHash,
    sourceConsentHash: fixed.sourceConsentHash,
    sourceReservationHash: fixed.sourceReservationHash,
    supersededConsentId: fixed.sourceConsentId,
    supersededInvocationId: fixed.sourceInvocationId,
    supersededReservationId: fixed.sourceReservationId,
    supersededResultId: fixed.sourceResultId,
    supersededRequestId: fixed.sourceRequestId,
    sourceSubmissionIdentity: fixed.sourceSubmissionIdentity,
    successorExecutionReleaseRecordHash: authority.profile.executionReleaseRecordHash,
    successorExecutorRuntimeHead: authority.profile.executorRuntimeHead,
    successorQualificationHead: authority.profile.qualificationHead,
    successorExecutorVersion: "1.12.21",
    handlerAttemptCount: 0,
    providerAttemptCount: 0,
    physicalProviderAttemptCount: 0,
    actualProviderCost: 0,
    terminalState: "ABORTED_PRE_HANDLER_ZERO_EXTERNAL_ACTIVITY",
    effectiveConsentStatus: "CONSUMED",
    effectiveInvocationStatus: "CLOSED_PRE_HANDLER_ZERO_SPEND",
    effectiveReservationStatus: "CLOSED_ZERO_SPEND",
    sourceSubmissionIdentityStatus: "TERMINAL_NON_REUSABLE_SUPERSEDED_ONCE",
    originalArtifactRecords: fixed.originalArtifactRecords,
    createdAt: "2026-08-09T20:00:00.000Z"
  };
  const receipt = createZeroExternalSupersessionReceipt(receiptInput);
  assert.equal(validateZeroExternalSupersessionReceipt(receipt).valid, true);
  for (const changes of [{ handlerAttemptCount: 1 }, { providerAttemptCount: 1 }, { physicalProviderAttemptCount: 1 }, { actualProviderCost: 0.01 }]) {
    assert.throws(() => createZeroExternalSupersessionReceipt({ ...receiptInput, ...changes }), /zero external activity|prove zero/);
  }
  const launchScope = createLaunchScope({ ...launchInput(authority.launchScope), zeroExternalSupersessionReceiptId: receipt.receiptId, zeroExternalSupersessionReceiptHash: receipt.receiptHash });
  const consent = createExecutionConsent({ launchScope, costEnvelope: authority.costEnvelope }, "2026-08-09T20:00:01.000Z");
  const reservation = createInvocationReservation({ launchScope, consent, executionProfileHash: authority.profile.profileHash, pricingProfileHash: authority.pricingProfile.pricingProfileHash, createdIdentity: "executor-supersession-test" }, "2026-08-09T20:00:02.000Z");
  const legacy = path.join(defaultResultHistoryRoot, ".reservations", `${fixed.sourceInvocationId}.json`);
  await copyFile(legacy, path.join(root, `${fixed.sourceInvocationId}.json`));
  const created = await createExclusiveReservation(root, reservation, { zeroExternalSupersessionReceipt: receipt });
  assert.equal(created.status, "CREATED");
  await assert.rejects(createExclusiveReservation(root, reservation, { zeroExternalSupersessionReceipt: receipt }), /already consumed/);
}));

test("actual RECONCILE_FAILURE CLI appends only three artifacts in isolation and fails closed on a second invocation", { timeout: 180_000 }, async () => withTemp("ke-v121-reconcile-cli-", async (root) => {
  const failedRoot = path.join(defaultResultHistoryRoot, "result-root-b912b16dae9e822f1076257815bd2e1a7d8cece05afe18e9");
  const realBefore = await computeResultTreeAggregate(failedRoot, ORIGINAL_PATHS);
  assert.equal(realBefore.aggregate, "788b7bf4117ff2b33eae85de3b1a3288878a26c41752af12f0f10c82e3117ddf");
  for (const relativePath of FIXED_FAILURE_APPEND_PATHS) await assert.rejects(readFile(path.join(failedRoot, relativePath)), /ENOENT/);
  const clone = path.join(root, "repository");
  const cloned = await run("git", ["clone", "--quiet", "--no-local", "--depth", "2", "--branch", "refactor/beta-evidence-pipeline", repositoryRoot, clone]);
  assert.equal(cloned.code, 0, cloned.stderr);
  const isolatedRoot = path.join(clone, "benchmarks", "blind-object-v2-results", "result-root-b912b16dae9e822f1076257815bd2e1a7d8cece05afe18e9");
  await mkdir(path.join(isolatedRoot, "responses"), { recursive: true });
  for (const relativePath of ORIGINAL_PATHS) await copyFile(path.join(failedRoot, relativePath), path.join(isolatedRoot, relativePath));
  await mkdir(path.join(clone, "benchmarks", "blind-object-v2", "consent"), { recursive: true });
  await copyFile(path.join(benchmarkRoot, "consent", "consent-d1b50d51ddd008ecc7cae6925633043fd64c57489d0c1b45.json"), path.join(clone, "benchmarks", "blind-object-v2", "consent", "consent-d1b50d51ddd008ecc7cae6925633043fd64c57489d0c1b45.json"));
  await mkdir(path.join(clone, "benchmarks", "blind-object-v2-results", ".reservations"), { recursive: true });
  await copyFile(path.join(defaultResultHistoryRoot, ".reservations", "invocation-0d5a024913e582fdd3a65cd44923d217ce2e6936f00e4f65.json"), path.join(clone, "benchmarks", "blind-object-v2-results", ".reservations", "invocation-0d5a024913e582fdd3a65cd44923d217ce2e6936f00e4f65.json"));
  const nodeModules = path.join(repositoryRoot, "node_modules");
  const isolatedModules = path.join(clone, "node_modules");
  await symlink(nodeModules, isolatedModules, "junction");
  const guardLog = path.join(root, "guard.jsonl");
  const env = { ...process.env, KATHERINES_EYE_CLI_GUARD_LOG: guardLog, NODE_OPTIONS: `--require=${path.join(clone, "tests", "helpers", "blind-object-v2-cli-isolation-guard.cjs")}` };
  try {
    const cli = path.join(clone, "benchmarks", "blind-object-v2", "scripts", "run-authorized-execution.mjs");
    const first = await run(process.execPath, [cli, "RECONCILE_FAILURE", FREEZE], { cwd: clone, env });
    assert.equal(first.code, 0, `${first.stdout}\n${first.stderr}`);
    const output = JSON.parse(first.stdout.trim().split(/\r?\n/).find((line) => line.startsWith("{")));
    assert.equal(output.disposition, "VERSION_1_12_20_FAILURE_RECONCILED_SEALED");
    assert.equal(output.handlerAttemptCount, 0);
    assert.equal(output.providerAttemptCount, 0);
    const isolatedOriginal = await computeResultTreeAggregate(isolatedRoot, ORIGINAL_PATHS);
    assert.deepEqual(isolatedOriginal, realBefore);
    assert.deepEqual((await readdir(isolatedRoot)).sort(), [...ORIGINAL_PATHS, ...FIXED_FAILURE_APPEND_PATHS, "responses"].sort());
    const second = await run(process.execPath, [cli, "RECONCILE_FAILURE", FREEZE], { cwd: clone, env });
    assert.notEqual(second.code, 0);
    assert.match(second.stderr, /already exists/);
    const guardEvents = await readFile(guardLog, "utf8").catch((error) => error.code === "ENOENT" ? "" : Promise.reject(error));
    assert.equal(guardEvents, "");
  } finally {
    await rm(isolatedModules, { force: true });
  }
  const realAfter = await computeResultTreeAggregate(failedRoot, ORIGINAL_PATHS);
  assert.deepEqual(realAfter, realBefore);
}));
