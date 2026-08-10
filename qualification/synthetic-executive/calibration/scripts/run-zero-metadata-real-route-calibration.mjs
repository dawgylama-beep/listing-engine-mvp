import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { rmdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { ExecutiveMemoryStore } from "../../scripts/memory-store.mjs";
import { canonicalIso, seal, sha256Json, stableJson, writeExclusiveJson } from "../../scripts/protocol.mjs";
import { passCalibrationActionThroughRealBroker } from "./real-route-broker.mjs";
import { resolveApprovedCredential } from "./real-route-credential.mjs";
import { ExternalCalibrationGovernor } from "./real-route-governor.mjs";
import { actualCostUsd, calibrationArtifactBindings, createCalibrationActionCoreSchema } from "./real-route-profile.mjs";
import { OpenAIRealRouteClient } from "./real-route-provider.mjs";
import { SafeProviderFailure, assertNoSecretMaterial, safeFailureEvidence, unavailableProviderDiagnostics } from "./real-route-redaction.mjs";
import {
  DEFAULT_ZERO_METADATA_AUTHORITY_PATH, claimZeroMetadataAuthority, closeZeroMetadataAuthority,
  consumeZeroMetadataAuthority, loadExternalZeroMetadataAuthority, loadPriorSealedMetadataEvidence,
  sealExternalZeroMetadataAuthority
} from "./zero-metadata-real-route-authority.mjs";
import { FEATURE_BRANCH, inspectSealedZeroMetadataRouteRelease, repositoryRoot } from "./zero-metadata-route-release.mjs";

const EMPTY_MEMORY_HASH = sha256Json([]);

function git(args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
}

export function inspectZeroMetadataCalibrationRuntime(authority) {
  const routeRelease = inspectSealedZeroMetadataRouteRelease();
  const branch = git(["branch", "--show-current"]);
  const head = git(["rev-parse", "HEAD"]);
  const tree = git(["rev-parse", "HEAD^{tree}"]);
  const remote = git(["rev-parse", `refs/remotes/origin/${FEATURE_BRANCH}`]);
  const trackedStatus = git(["status", "--porcelain=v1", "--untracked-files=no"]);
  assert.equal(branch, FEATURE_BRANCH);
  assert.equal(head, authority.runnerReleaseIdentity.runtimeCommit, "zero-metadata runner commit differs");
  assert.equal(tree, authority.runnerReleaseIdentity.runtimeTree, "zero-metadata runner tree differs");
  assert.equal(routeRelease.releaseRecordHash, authority.runnerReleaseIdentity.releaseRecordHash);
  assert.equal(remote, head, "local and remote feature refs differ");
  assert.equal(trackedStatus, "", "tracked source changed after zero-metadata runner release");
  return Object.freeze({ branch, head, tree, remote, localRemoteDivergence: 0, trackedSourceClean: true });
}

function failureStatus(error) {
  const code = safeFailureEvidence(error).code;
  if (["PROVIDER_STRUCTURED_OUTPUT_MISSING", "PROVIDER_STRUCTURED_OUTPUT_MALFORMED", "PROVIDER_REFUSAL", "PROVIDER_RESPONSE_INCOMPLETE", "PROVIDER_RESPONSE_NOT_COMPLETED"].includes(code)) return "REAL_ROUTE_CALIBRATION_ACTION_REJECTED";
  return "REAL_ROUTE_CALIBRATION_PROVIDER_REJECTED";
}

function defaultClaims() {
  return Object.freeze({
    syntheticExecutiveQualified: false, cognitiveBehaviorEvaluated: false, memoryTransferEvaluated: false,
    novelFailureJudgmentEvaluated: false, productionReadinessEstablished: false,
    benchmarkContinuationAuthorized: false, autonomyClaimAuthorized: false
  });
}

function defaultRouteIsolation() {
  return {
    metadataProviderRequestCount: 0, qualificationCorpusAccessCount: 0, historicalEpisodeAccessCount: 0,
    analogousEpisodeAccessCount: 0, novelEpisodeAccessCount: 0, evaluatorControlAccessCount: 0,
    benchmarkExecutionCount: 0, benchmarkConsentOrReservationCount: 0, productHandlerInvocationCount: 0,
    workerDispatchCount: 0, agentToolCallCount: 0, lessonWriteOrPromotionCount: 0, sourceMutationCount: 0,
    successorCreationCount: 0, mergeCount: 0, previewDeploymentCount: 0, productionDeploymentCount: 0
  };
}

function metadataEvidenceRecord(evidence) {
  return Object.freeze({
    evidenceSource: evidence.evidenceType,
    providerRequestPerformed: false,
    returnedModelId: evidence.returnedModelId,
    sourceCalibrationResultHash: evidence.sourceCalibrationResultHash,
    receiptRelativePath: evidence.receiptRelativePath,
    receiptFileHash: evidence.receiptFileHash,
    canonicalSafeResponseHash: evidence.canonicalSafeResponseHash
  });
}

export async function runZeroMetadataRealRouteCalibration({
  authorityPath = DEFAULT_ZERO_METADATA_AUTHORITY_PATH,
  fetchImpl = globalThis.fetch,
  environment = process.env,
  dotenvPath,
  now = () => new Date().toISOString(),
  nowMs = () => Date.now(),
  authorityLoader = loadExternalZeroMetadataAuthority,
  runtimeInspector = inspectZeroMetadataCalibrationRuntime,
  priorMetadataLoader = loadPriorSealedMetadataEvidence
} = {}) {
  const startedAt = canonicalIso(now(), "calibration start time");
  const startedMs = nowMs();
  const loaded = await authorityLoader({ authorityPath, now: Date.parse(startedAt) });
  const { authority } = loaded;
  assert.equal(authority.maximumMetadataAccessRequests, 0);
  const [artifacts, priorMetadataEvidence] = await Promise.all([calibrationArtifactBindings(), priorMetadataLoader()]);
  assert.deepEqual(authority.priorMetadataEvidence, priorMetadataEvidence);
  assert.equal(authority.providerProfileHash, artifacts.profile.profileHash);
  assert.equal(authority.calibrationCaseHash, artifacts.calibrationCase.caseHash);
  assert.equal(authority.calibrationPromptHash, artifacts.prompt.promptHash);
  assert.equal(authority.promptByteCount, artifacts.prompt.byteCount);
  assert.equal(authority.executiveActionSchemaHash, artifacts.executiveActionSchemaHash);
  assert.equal(authority.exactModelId, artifacts.profile.exactModelId);
  assert.equal(authority.inferenceEndpoint, artifacts.profile.inferenceEndpoint);
  assert.equal(authority.reasoningEffort, artifacts.profile.reasoning.effort);
  assert.equal(authority.store, artifacts.profile.responsePersistence.store);
  const runtimeStart = runtimeInspector(authority);
  const resultRoot = path.resolve(repositoryRoot, authority.resultRootRelativePath);
  assert.equal(resultRoot.startsWith(path.resolve(repositoryRoot, "qualification-results") + path.sep), true, "calibration result root escaped its boundary");
  const memoryRoot = path.join(resultRoot, "disposable-memory");
  const memory = new ExecutiveMemoryStore(memoryRoot);
  const claim = await claimZeroMetadataAuthority({ authorityPath, authority, claimedAt: now() });
  await memory.initializeEmpty();
  assert.deepEqual(await memory.list(), []);

  const metadataAccess = metadataEvidenceRecord(priorMetadataEvidence);
  let credentialBoundary = { routeType: "UNRESOLVED", present: false };
  let providerResult = null;
  let broker = { accepted: false, disposition: "NOT_REACHED", brokerActionHash: null, structuredAction: null, rejectionReceipt: null };
  let usage = { complete: false, inputTokens: null, cachedInputTokens: null, outputTokens: null, reasoningTokens: null, totalTokens: null };
  let calculatedActualCostUsd = null;
  let calculatedMaximumCostUsd = null;
  let accounting = { valid: true, ledgerEntryCount: 0, ledgerHash: "0".repeat(64), conservativeCostUsd: 0, staleReservationsConservativelyConsumed: 0, reservationCount: 0, completionCount: 0, reasoningStepCount: 0, retryCount: 0, toolCallCount: 0, workerDispatchCount: 0, ledgerEntryAggregateHash: sha256Json([]) };
  let reservation = null;
  let status = "REAL_ROUTE_CALIBRATION_PRECHECK_FAILED";
  let terminationReason = "PRECHECK_NOT_COMPLETED";
  let phase = "PRECHECK";
  let client = null;

  try {
    const credentialHandle = await resolveApprovedCredential({ environment, ...(dotenvPath ? { dotenvPath } : {}) });
    credentialBoundary = credentialHandle.toJSON();
    assert.equal(credentialBoundary.present, true, "approved credential is unavailable");
    client = new OpenAIRealRouteClient({ profile: artifacts.profile, credentialHandle, fetchImpl, deadlineAtMs: startedMs + authority.maximumWallClockDurationMs, nowMs });

    phase = "INFERENCE";
    const requestIdentity = sha256Json({
      authorityHash: authority.authorityHash, calibrationCaseHash: artifacts.calibrationCase.caseHash,
      promptHash: artifacts.prompt.promptHash, canonicalRequestHash: authority.canonicalRequestHash,
      modelIdentity: artifacts.profile.exactModelId
    });
    const governor = await new ExternalCalibrationGovernor({ root: path.join(resultRoot, "governor"), providerProfile: artifacts.profile, authority, clock: now }).initialize();
    const reserved = await governor.reserveInference({ requestIdentity, promptByteCount: artifacts.prompt.byteCount });
    reservation = reserved.reservation;
    calculatedMaximumCostUsd = reserved.calculatedMaximumCostUsd;
    await consumeZeroMetadataAuthority({ paths: claim.paths, authority, reservationHash: reservation.entryHash, requestIdentity, consumedAt: now() });

    const dispatchStarted = nowMs();
    try {
      const structuredSchema = await createCalibrationActionCoreSchema(artifacts.calibrationCase);
      providerResult = await client.inferStructuredAction({ permit: reserved.permit, prompt: artifacts.prompt.text, structuredSchema });
      usage = providerResult.usage;
      if (usage.complete && usage.outputTokens > authority.outputTokenCeiling) throw new SafeProviderFailure("PROVIDER_OUTPUT_TOKEN_CEILING_VIOLATED", providerResult.providerDiagnostics.httpStatus, providerResult.providerDiagnostics);
      if (usage.complete && usage.totalTokens > authority.totalTokenCeiling) throw new SafeProviderFailure("PROVIDER_TOTAL_TOKEN_CEILING_VIOLATED", providerResult.providerDiagnostics.httpStatus, providerResult.providerDiagnostics);
      if (usage.complete) calculatedActualCostUsd = actualCostUsd(usage, artifacts.profile);
      broker = passCalibrationActionThroughRealBroker(providerResult.actionCore, artifacts.calibrationCase);
      const provisionalStatus = !usage.complete ? "REAL_ROUTE_CALIBRATION_USAGE_UNAVAILABLE" : (!broker.accepted ? "REAL_ROUTE_CALIBRATION_ACTION_REJECTED" : "KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATED");
      await governor.completeInference({ usage, actualCostUsd: calculatedActualCostUsd, durationMs: Math.max(0, nowMs() - dispatchStarted), resultStatus: provisionalStatus, brokerDisposition: broker.disposition, safeResponseHash: providerResult.safeResponseHash });
      status = provisionalStatus;
      terminationReason = status === "KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATED" ? "ONE_AUTHORIZED_ZERO_METADATA_CALIBRATION_INFERENCE_COMPLETED_AND_SEALED" : (usage.complete ? "TYPED_ACTION_REJECTED_WITHOUT_RETRY" : "PROVIDER_USAGE_INCOMPLETE_FULL_RESERVATION_CHARGED");
    } catch (error) {
      const safeFailure = safeFailureEvidence(error);
      const mapped = failureStatus(error);
      status = mapped;
      terminationReason = `${safeFailure.code}_NO_RETRY`;
      if (mapped === "REAL_ROUTE_CALIBRATION_ACTION_REJECTED") broker = { accepted: false, disposition: "REJECTED", brokerActionHash: null, structuredAction: null, rejectionReceipt: { code: safeFailure.code, httpStatus: safeFailure.httpStatus } };
      await governor.completeInference({ usage: null, actualCostUsd: null, durationMs: Math.max(0, nowMs() - dispatchStarted), resultStatus: mapped, brokerDisposition: broker.disposition, safeResponseHash: null });
    }
    phase = "ACCOUNTING";
    accounting = await governor.verifyAccounting();
    assert.equal(accounting.reservationCount, 1);
    assert.equal(accounting.completionCount, 1);
    assert.equal(accounting.reasoningStepCount, 1);
    assert.equal(accounting.retryCount, 0);
    assert.equal(accounting.toolCallCount, 0);
    assert.equal(accounting.workerDispatchCount, 0);
    assert.equal(accounting.staleReservationsConservativelyConsumed, 0);
    assert.equal(accounting.conservativeCostUsd, usage.complete ? calculatedActualCostUsd : 0.25);
  } catch (error) {
    if (!reservation) {
      status = "REAL_ROUTE_CALIBRATION_PRECHECK_FAILED";
      terminationReason = `${safeFailureEvidence(error).code}_BEFORE_INFERENCE_RESERVATION`;
    } else if (phase === "ACCOUNTING" || status === "REAL_ROUTE_CALIBRATION_PRECHECK_FAILED") {
      status = "REAL_ROUTE_CALIBRATION_ACCOUNTING_FAILED";
      terminationReason = "CALIBRATION_ACCOUNTING_VERIFICATION_FAILED_NO_RETRY";
    }
  }

  assert.deepEqual(await memory.list(), []);
  await rmdir(memoryRoot);
  const runtimeEnd = runtimeInspector(authority);
  const completedAt = canonicalIso(now(), "calibration completion time");
  const counts = client?.counts || { metadataAccessInvocations: 0, inferenceInvocations: 0, metadataAccessRequests: 0, inferenceRequests: 0, retries: 0 };
  assert.equal(counts.metadataAccessInvocations, 0, "metadata invocation is prohibited on the zero-metadata route");
  assert.equal(counts.metadataAccessRequests, 0, "metadata dispatch is prohibited on the zero-metadata route");
  assert.ok(counts.inferenceInvocations <= 1 && counts.inferenceRequests <= 1, "one-inference ceiling exceeded");
  const providerDiagnostics = Object.freeze({
    metadata: unavailableProviderDiagnostics(),
    inference: client?.diagnostics.inference || unavailableProviderDiagnostics()
  });
  const wallClockDurationMs = Math.max(0, nowMs() - startedMs);
  if (wallClockDurationMs > authority.maximumWallClockDurationMs && status === "KATHERINE_SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATED") {
    status = "REAL_ROUTE_CALIBRATION_PROVIDER_REJECTED";
    terminationReason = "CALIBRATION_WALL_CLOCK_CEILING_EXCEEDED_NO_RETRY";
  }
  const resultCore = {
    schemaVersion: authority.terminalResultSchemaVersion,
    resultType: "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_RESULT", status,
    authorityHash: authority.authorityHash, singleUseIdentity: authority.singleUseIdentity,
    releaseIdentity: { cognitiveSubject: authority.cognitiveSubjectIdentity, calibrationRunner: authority.runnerReleaseIdentity },
    providerProfileHash: artifacts.profile.profileHash,
    modelIdentity: {
      requestedModelId: artifacts.profile.exactModelId,
      metadataEvidenceReturnedModelId: priorMetadataEvidence.returnedModelId,
      inferenceReturnedModelId: providerResult?.modelId || null,
      endpointClass: artifacts.profile.endpointClass, inferenceEndpoint: artifacts.profile.inferenceEndpoint,
      reasoningEffort: artifacts.profile.reasoning.effort, store: false
    },
    metadataAccess, providerDiagnostics, credentialBoundary,
    requestCounts: { ...counts, externallyObservableReasoningSteps: accounting.reasoningStepCount, automaticModelRetries: 0, successors: 0 },
    prompt: {
      promptHash: artifacts.prompt.promptHash, canonicalRequestHash: authority.canonicalRequestHash,
      byteCount: artifacts.prompt.byteCount, conservativeInputTokenReservation: artifacts.prompt.byteCount,
      inputTokenCeiling: authority.inputTokenCeiling, maximumOutputTokensApplied: authority.outputTokenCeiling,
      totalTokenCeiling: authority.totalTokenCeiling
    },
    usage: { providerUsageComplete: usage.complete, inputTokens: usage.inputTokens, cachedInputTokens: usage.cachedInputTokens, outputTokens: usage.outputTokens, reasoningTokens: usage.reasoningTokens, totalTokens: usage.totalTokens },
    cost: { currency: "USD", maximumReservationUsd: authority.maximumProviderCostUsd, calculatedMaximumRequestCostUsd: calculatedMaximumCostUsd, calculatedActualCostUsd, conservativeCostChargedUsd: accounting.conservativeCostUsd, missingUsageChargedAtFullReservation: reservation !== null && !usage.complete },
    wallClockDurationMs,
    actionBroker: { accepted: broker.accepted, disposition: broker.disposition, brokerActionHash: broker.brokerActionHash, structuredAction: broker.action || broker.structuredAction || null, rejectionReceipt: broker.rejection || broker.rejectionReceipt || null, malformedOrIncompleteOutputRetryPermitted: false },
    ledger: { ledgerRootHash: accounting.ledgerHash, ledgerEntryAggregateHash: accounting.ledgerEntryAggregateHash, entryCount: accounting.ledgerEntryCount, reservationCount: accounting.reservationCount, completionCount: accounting.completionCount, reasoningStepCount: accounting.reasoningStepCount, conservativeCostUsd: accounting.conservativeCostUsd, reservationFinalizationAgree: accounting.reservationCount === accounting.completionCount && accounting.staleReservationsConservativelyConsumed === 0 },
    memory: { startingRecordCount: 0, startingHash: EMPTY_MEMORY_HASH, finalRecordCount: 0, finalHash: EMPTY_MEMORY_HASH, unchanged: true, disposableRootDestroyed: true, lessonWritten: false, memoryPromoted: false },
    routeIsolation: { ...defaultRouteIsolation(), trackedSourceCleanAtStart: runtimeStart.trackedSourceClean, trackedSourceCleanAtEnd: runtimeEnd.trackedSourceClean },
    claims: defaultClaims(), startedAt, completedAt, terminationReason
  };
  const result = seal(resultCore, "resultHash");
  assertNoSecretMaterial(result, "sealed zero-metadata calibration result");
  const resultPath = path.join(resultRoot, "calibration-result.json");
  await writeExclusiveJson(resultPath, result);
  const terminal = await closeZeroMetadataAuthority({ paths: claim.paths, authority, status, resultHash: result.resultHash, closedAt: completedAt });
  return Object.freeze({ result, resultPath, resultRoot, authority, authorityFileHash: loaded.authorityFileHash, authorityReceiptHash: loaded.receipt.receiptHash, terminalReceipt: terminal });
}

async function main() {
  const mode = process.argv[2] || "";
  if (mode === "CREATE_AUTHORITY") {
    const sealed = await sealExternalZeroMetadataAuthority();
    process.stdout.write(`${stableJson({ authorityPath: sealed.authorityPath, authorityHash: sealed.authority.authorityHash, authorityFileHash: sealed.authorityFileHash, authorityReceiptHash: sealed.receipt.receiptHash, singleUseIdentity: sealed.authority.singleUseIdentity, resultRootRelativePath: sealed.authority.resultRootRelativePath })}\n`);
    return;
  }
  if (mode === "RUN_CALIBRATION") {
    const completed = await runZeroMetadataRealRouteCalibration();
    process.stdout.write(`${stableJson({ status: completed.result.status, resultPath: completed.resultPath, resultHash: completed.result.resultHash, authorityHash: completed.authority.authorityHash, singleUseIdentity: completed.authority.singleUseIdentity, requestCounts: completed.result.requestCounts })}\n`);
    return;
  }
  throw new Error("mode must be CREATE_AUTHORITY or RUN_CALIBRATION");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    const evidence = safeFailureEvidence(error);
    process.stderr.write(`${stableJson({ status: "REAL_ROUTE_CALIBRATION_PRECHECK_FAILED", failure: evidence })}\n`);
    process.exitCode = 1;
  });
}
