import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

import { resolveApprovedCredential } from "../calibration/scripts/real-route-credential.mjs";
import {
  AUTHORITY_ID,
  CASE_IDS,
  LIMITS,
  RETRYABLE_PROVIDER_FAILURES,
  appendLedgerEvent,
  buildV4Request,
  createV4ProviderClient,
  fileSha256,
  loadPublicPackage,
  providerAccounting,
  readJson,
  readLedger,
  repositoryRoot,
  runRoot,
  seal,
  sha256Json,
  stableJson,
  validateAndNormalizeV4Response,
  writeExclusiveBytes,
  writeExclusiveJson
} from "./v4-runtime.mjs";

const execFileAsync = promisify(execFile);
const executionRoot = path.join(runRoot, "execution");
const ledgerRoot = path.join(executionRoot, "authority-ledger");
const casesRoot = path.join(executionRoot, "cases");

async function git(...args) {
  return (await execFileAsync("git", args, { cwd: repositoryRoot, encoding: "utf8" })).stdout.trim();
}

function safeUsageFromFailure(error) {
  return error?.safeResponseEvidence?.usage || Object.freeze({
    complete: false,
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    totalTokens: null
  });
}

async function main() {
  const authorityPath = path.join(runRoot, "authority.json");
  const [authority, authorityIdentity, slotRegistry, publicPackage, preflight] = await Promise.all([
    readJson(authorityPath),
    readJson(path.join(runRoot, "authority-file-identity.json")),
    readJson(path.join(runRoot, "slot-registry.json")),
    loadPublicPackage(),
    readJson(path.join(runRoot, "preflight", "preflight-result.json"))
  ]);
  assert.equal(authority.authorityId, AUTHORITY_ID);
  assert.equal(await fileSha256(authorityPath), authorityIdentity.authorityFileSha256);
  assert.equal(slotRegistry.slotRegistryHash, authority.slotRegistry.slotRegistryHash);
  assert.equal(preflight.status, "PASSED");
  const executionCommit = await git("rev-parse", "HEAD");
  const executionTree = await git("rev-parse", "HEAD^{tree}");
  const executionParent = await git("rev-parse", "HEAD^");
  const executionSubject = await git("show", "-s", "--format=%s", "HEAD");
  assert.equal(executionSubject, authority.intendedCommitSubject, "V4_EXECUTION_NOT_ON_AUTHORITY_COMMIT");
  await mkdir(executionRoot, { recursive: false });
  await mkdir(ledgerRoot, { recursive: false });
  await mkdir(casesRoot, { recursive: false });
  await writeExclusiveJson(path.join(executionRoot, "authority-commit-readback.json"), {
    schemaVersion: "1.0",
    identityType: "V4_EXECUTION_AUTHORITY_COMMIT_READBACK",
    commit: executionCommit,
    tree: executionTree,
    parent: executionParent,
    subject: executionSubject,
    authorityFileSha256: authorityIdentity.authorityFileSha256
  });
  const activatedAt = new Date().toISOString();
  const activation = await appendLedgerEvent(ledgerRoot, "AUTHORITY_ACTIVATED", {
    authorityId: AUTHORITY_ID,
    authorityFileSha256: authorityIdentity.authorityFileSha256,
    slotRegistryHash: slotRegistry.slotRegistryHash,
    executionCommit
  }, activatedAt);

  const credentialHandle = await resolveApprovedCredential();
  assert.equal(credentialHandle.present, true, "V4_EXECUTION_CREDENTIAL_UNAVAILABLE");
  await writeExclusiveJson(path.join(executionRoot, "credential-access-receipt.json"), seal({
    schemaVersion: "1.0",
    receiptType: "V4_EXECUTION_CREDENTIAL_ACCESS",
    accessedAt: new Date().toISOString(),
    accessCount: 1,
    approvedAdapter: "resolveApprovedCredential",
    routeType: credentialHandle.routeType,
    credentialPresent: credentialHandle.present,
    credentialValueInspected: false,
    credentialValuePrinted: false,
    credentialValuePersisted: false,
    credentialValueHashed: false
  }, "receiptHash"));

  const runStartedAt = new Date().toISOString();
  const runStartedMs = Date.now();
  const terminalRecords = [];
  const attemptReceipts = [];
  let totalConservativeCostUsd = preflight.accounting.conservativeAccountedCostUsd;
  for (const [caseIndex, publicCase] of publicPackage.cases.entries()) {
    const caseId = CASE_IDS[caseIndex];
    assert.equal(publicCase.caseId, caseId);
    const slot = slotRegistry.slots[caseIndex];
    assert.equal(slot.caseId, caseId);
    assert.equal(slot.publicCaseHash, sha256Json(publicCase));
    const caseRoot = path.join(casesRoot, caseId);
    await mkdir(caseRoot, { recursive: false });
    const built = buildV4Request({
      publicCase,
      decisionStandard: publicPackage.decisionStandard,
      responseContract: publicPackage.responseContract
    });
    assert.equal(built.publicCaseHash, slot.publicCaseHash);
    await writeExclusiveBytes(path.join(caseRoot, "request-envelope.json"), Buffer.from(built.serializedRequest, "utf8"));
    await writeExclusiveJson(path.join(caseRoot, "request-identity.json"), seal({
      schemaVersion: "1.0",
      identityType: "V4_SINGLE_PUBLIC_CASE_REQUEST_IDENTITY",
      caseId,
      slotId: slot.slotId,
      slotHash: slot.slotHash,
      publicCaseHash: built.publicCaseHash,
      mentorGuidanceHash: built.mentorBinding.guidanceHash,
      requestHash: built.requestHash,
      requestByteCount: built.requestByteCount,
      exactlyOnePublicCase: true,
      otherCaseCount: 0,
      evaluatorMaterialBytes: 0,
      model: "gpt-5.6-sol",
      maximumOutputTokens: LIMITS.maximumOutputTokensPerCase
    }, "identityHash"));
    const consumption = await appendLedgerEvent(ledgerRoot, "SLOT_CONSUMED", {
      caseId,
      slotId: slot.slotId,
      slotHash: slot.slotHash,
      publicCaseHash: slot.publicCaseHash,
      requestHash: built.requestHash,
      status: "PERMANENTLY_CONSUMED"
    });
    const caseStartedAt = new Date().toISOString();
    const caseStartedMs = Date.now();
    let terminalStatus = "TERMINAL_MISSING_OUTPUT";
    let normalizedResponse = null;
    let responseHash = null;
    let terminalFailure = null;
    const caseAttempts = [];
    let caseConservativeCostUsd = 0;
    for (let attemptIndex = 1; attemptIndex <= LIMITS.maximumAttemptsPerSlot; attemptIndex += 1) {
      const remainingCaseMs = LIMITS.perCaseWallClockMs - (Date.now() - caseStartedMs);
      const remainingRunMs = LIMITS.totalWallClockMs - (Date.now() - runStartedMs);
      if (remainingCaseMs <= 0 || remainingRunMs <= 0) {
        terminalFailure = { code: "V4_WALL_CLOCK_CEILING_REACHED", retryable: false };
        break;
      }
      let rawCapture = null;
      const { client, profile } = await createV4ProviderClient({ credentialHandle, onCapture: async (value) => { rawCapture = value; } });
      const reservation = providerAccounting({ usage: { complete: false }, serializedRequestByteCount: built.requestByteCount, maximumOutputTokens: LIMITS.maximumOutputTokensPerCase, pricing: profile.pricing });
      if (caseConservativeCostUsd + reservation.reservationUsd > LIMITS.maximumPerCaseCostUsd + 1e-9
        || totalConservativeCostUsd + reservation.reservationUsd > LIMITS.maximumTotalCostUsd + 1e-9) {
        terminalFailure = { code: "V4_COST_CEILING_REACHED", retryable: false };
        break;
      }
      const providerAttemptIdentity = `v4-${caseId.toLowerCase()}-attempt-${String(attemptIndex).padStart(2, "0")}`;
      const dispatchedAt = new Date().toISOString();
      const dispatchedMs = Date.now();
      const controller = new AbortController();
      const timeoutMs = Math.max(1, Math.min(profile.timeoutMs || 120000, remainingCaseMs, remainingRunMs));
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await client.decisionTurn({
          serializedRequest: built.serializedRequest,
          requestHash: built.requestHash,
          providerAttemptIdentity,
          signal: controller.signal
        });
        assert.ok(rawCapture, "V4_COMPLETE_RAW_PROVIDER_RESPONSE_NOT_CAPTURED");
        await writeExclusiveBytes(path.join(caseRoot, `attempt-${String(attemptIndex).padStart(2, "0")}-raw-provider-response.json`), rawCapture.bytes);
        const accounting = providerAccounting({ usage: response.usage, serializedRequestByteCount: built.requestByteCount, maximumOutputTokens: LIMITS.maximumOutputTokensPerCase, pricing: profile.pricing });
        caseConservativeCostUsd += accounting.conservativeAccountedCostUsd;
        totalConservativeCostUsd += accounting.conservativeAccountedCostUsd;
        const receipt = seal({
          schemaVersion: "1.0",
          receiptType: "V4_SAFE_PROVIDER_ATTEMPT",
          caseId,
          slotId: slot.slotId,
          providerAttemptIdentity,
          attemptIndex,
          retry: attemptIndex > 1,
          requestHash: built.requestHash,
          requestByteCount: built.requestByteCount,
          responseHash: response.safeResponseHash,
          structuredResponseHash: response.actionCoreHash,
          rawResponseByteCount: rawCapture.byteCount,
          rawResponseSha256: rawCapture.sha256,
          completeRawResponseCaptured: true,
          providerResponseId: response.providerResponseId,
          providerRequestId: response.providerRequestId,
          httpStatus: response.safeResponseEvidence.httpStatus,
          exitStatus: "COMPLETED",
          modelId: response.modelId,
          responseStatus: response.responseStatus,
          dispatchedAt,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - dispatchedMs,
          usage: response.usage,
          accounting,
          retryClassification: "NOT_RETRYABLE_COMPLETED_RESPONSE"
        }, "attemptReceiptHash");
        await writeExclusiveJson(path.join(caseRoot, `attempt-${String(attemptIndex).padStart(2, "0")}-receipt.json`), receipt);
        caseAttempts.push(receipt); attemptReceipts.push(receipt);
        try {
          normalizedResponse = validateAndNormalizeV4Response(response.actionCore, { caseId });
          responseHash = sha256Json(normalizedResponse);
          terminalStatus = "VALID_RESPONSE";
        } catch (schemaError) {
          terminalStatus = "TERMINAL_SCHEMA_INVALID_COMPLETED_RESPONSE";
          terminalFailure = { code: schemaError.message, retryable: false, completedProviderResponse: true };
        }
        break;
      } catch (error) {
        if (rawCapture) await writeExclusiveBytes(path.join(caseRoot, `attempt-${String(attemptIndex).padStart(2, "0")}-raw-provider-response.json`), rawCapture.bytes);
        const usage = safeUsageFromFailure(error);
        const accounting = providerAccounting({ usage, serializedRequestByteCount: built.requestByteCount, maximumOutputTokens: LIMITS.maximumOutputTokensPerCase, pricing: profile.pricing });
        caseConservativeCostUsd += accounting.conservativeAccountedCostUsd;
        totalConservativeCostUsd += accounting.conservativeAccountedCostUsd;
        const retryable = RETRYABLE_PROVIDER_FAILURES.includes(error?.code) && attemptIndex < LIMITS.maximumAttemptsPerSlot;
        const receipt = seal({
          schemaVersion: "1.0",
          receiptType: "V4_SAFE_PROVIDER_ATTEMPT",
          caseId,
          slotId: slot.slotId,
          providerAttemptIdentity,
          attemptIndex,
          retry: attemptIndex > 1,
          requestHash: built.requestHash,
          requestByteCount: built.requestByteCount,
          responseHash: null,
          structuredResponseHash: null,
          rawResponseByteCount: rawCapture?.byteCount || 0,
          rawResponseSha256: rawCapture?.sha256 || null,
          completeRawResponseCaptured: Boolean(rawCapture),
          providerResponseId: error?.safeResponseEvidence?.providerResponseId || "ABSENT",
          providerRequestId: error?.providerDiagnostics?.safeProviderRequestId || "NOT_RECEIVED",
          httpStatus: error?.httpStatus ?? null,
          exitStatus: "FAILED",
          modelId: error?.safeResponseEvidence?.returnedModel || "ABSENT",
          responseStatus: error?.safeResponseEvidence?.responseStatus || "FAILED",
          providerFailureCode: error?.code || "UNCLASSIFIED_PROVIDER_FAILURE",
          dispatchedAt,
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - dispatchedMs,
          usage,
          accounting,
          retryClassification: retryable ? "RETRYABLE_FROZEN_TRANSPORT_FAILURE" : "NOT_RETRYABLE"
        }, "attemptReceiptHash");
        await writeExclusiveJson(path.join(caseRoot, `attempt-${String(attemptIndex).padStart(2, "0")}-receipt.json`), receipt);
        caseAttempts.push(receipt); attemptReceipts.push(receipt);
        terminalFailure = { code: receipt.providerFailureCode, retryable };
        if (!retryable) break;
        if (attemptIndex === LIMITS.maximumAttemptsPerSlot) break;
      } finally {
        clearTimeout(timeout);
      }
    }
    if (!normalizedResponse && terminalFailure?.retryable) terminalStatus = "TERMINAL_MISSING_OUTPUT_RETRY_EXHAUSTED";
    const terminal = seal({
      schemaVersion: "1.0",
      recordType: "V4_TERMINALLY_SEALED_KATHERINE_OUTPUT",
      caseId,
      slotId: slot.slotId,
      slotHash: slot.slotHash,
      publicCaseHash: slot.publicCaseHash,
      requestHash: built.requestHash,
      requestByteCount: built.requestByteCount,
      mentorGuidanceHash: built.mentorBinding.guidanceHash,
      slotConsumptionLedgerEntryHash: consumption.entryHash,
      caseStartedAt,
      terminalAt: new Date().toISOString(),
      durationMs: Date.now() - caseStartedMs,
      providerAttemptCount: caseAttempts.length,
      providerAttemptReceiptHashes: caseAttempts.map((item) => item.attemptReceiptHash),
      terminalStatus,
      response: normalizedResponse,
      responseHash,
      failure: terminalFailure,
      completeRawResponseCaptureForEveryReceivedEnvelope: caseAttempts.every((item) => item.httpStatus === null || item.completeRawResponseCaptured),
      caseConservativeCostUsd: Number(caseConservativeCostUsd.toFixed(8)),
      replayPermitted: false,
      replacementPermitted: false
    }, "terminalOutputHash");
    await writeExclusiveJson(path.join(caseRoot, "terminal-output.json"), terminal);
    await appendLedgerEvent(ledgerRoot, "SLOT_TERMINAL", {
      caseId,
      slotId: slot.slotId,
      terminalStatus,
      terminalOutputHash: terminal.terminalOutputHash,
      providerAttemptCount: caseAttempts.length
    });
    terminalRecords.push(terminal);
  }
  assert.deepEqual(terminalRecords.map((item) => item.caseId), CASE_IDS);
  assert.equal(attemptReceipts.length <= LIMITS.maximumKatherineProviderAttempts, true);
  const closure = await appendLedgerEvent(ledgerRoot, "AUTHORITY_CLOSED", {
    authorityId: AUTHORITY_ID,
    terminalCaseIds: CASE_IDS,
    terminalOutputHashes: terminalRecords.map((item) => ({ caseId: item.caseId, terminalOutputHash: item.terminalOutputHash })),
    providerAttemptCount: attemptReceipts.length,
    totalConservativeCostUsd: Number(totalConservativeCostUsd.toFixed(8)),
    noResumeNoReplayNoReplacement: true
  });
  const usage = {
    inputTokens: attemptReceipts.reduce((sum, item) => sum + (item.usage.inputTokens || 0), 0),
    cachedInputTokens: attemptReceipts.reduce((sum, item) => sum + (item.usage.cachedInputTokens || 0), 0),
    outputTokens: attemptReceipts.reduce((sum, item) => sum + (item.usage.outputTokens || 0), 0),
    reasoningTokens: attemptReceipts.reduce((sum, item) => sum + (item.usage.reasoningTokens || 0), 0),
    totalTokens: attemptReceipts.reduce((sum, item) => sum + (item.usage.totalTokens || 0), 0)
  };
  const executionIntegrityValid = terminalRecords.every((item) => item.terminalStatus === "VALID_RESPONSE")
    && terminalRecords.every((item) => item.completeRawResponseCaptureForEveryReceivedEnvelope);
  const summary = seal({
    schemaVersion: "1.0",
    summaryType: "V4_INDEPENDENT_MENTOR_GUIDED_PROVIDER_EXECUTION_SUMMARY",
    authorityId: AUTHORITY_ID,
    authorityFileSha256: authorityIdentity.authorityFileSha256,
    slotRegistryHash: slotRegistry.slotRegistryHash,
    executionCommit,
    executionTree,
    executionParent,
    executionSubject,
    runStartedAt,
    runCompletedAt: new Date().toISOString(),
    durationMs: Date.now() - runStartedMs,
    exactCaseOrder: CASE_IDS,
    caseStatuses: terminalRecords.map((item) => ({ caseId: item.caseId, terminalStatus: item.terminalStatus, providerAttemptCount: item.providerAttemptCount, terminalOutputHash: item.terminalOutputHash })),
    counts: {
      slotConsumptions: 14,
      terminalOutputs: 14,
      KatherineProviderAttempts: attemptReceipts.length,
      retries: attemptReceipts.filter((item) => item.retry).length,
      schemaPreflightRequests: 1,
      evaluatorInvocations: 0
    },
    usage,
    costs: {
      schemaPreflightCostUsd: preflight.accounting.conservativeAccountedCostUsd,
      KatherineExecutionCostUsd: Number((totalConservativeCostUsd - preflight.accounting.conservativeAccountedCostUsd).toFixed(8)),
      totalCombinedCostUsd: Number(totalConservativeCostUsd.toFixed(8)),
      maximumTotalCostUsd: LIMITS.maximumTotalCostUsd
    },
    authorityActivationLedgerEntryHash: activation.entryHash,
    authorityClosureLedgerEntryHash: closure.entryHash,
    ledgerEntryCountAtClosure: (await readLedger(ledgerRoot)).length,
    executionIntegrityValid,
    evaluatorAccessClosedDuringExecution: true,
    sideEffectCounts: {
      evaluatorFilesReadDuringExecution: 0,
      evaluatorProviderRequests: 0,
      hiddenKeysExposedToProvider: 0,
      otherCasesExposedPerRequest: 0,
      metadataRequests: 0,
      productHandlerCalls: 0,
      benchmarkExecutions: 0,
      Phase6AReads: 0,
      Phase6AExecutions: 0,
      Phase6AStaging: 0,
      Phase6AModifications: 0,
      productionActivity: 0,
      previewActivity: 0,
      deployments: 0,
      merges: 0,
      tags: 0,
      memoryPromotions: 0,
      slotReplays: 0,
      slotReplacements: 0,
      completeRunRetries: 0
    }
  }, "executionSummaryHash");
  await writeExclusiveJson(path.join(executionRoot, "execution-summary.json"), summary);
  process.stdout.write(`${stableJson({ executionSummaryHash: summary.executionSummaryHash, executionIntegrityValid, cases: summary.caseStatuses, providerAttempts: summary.counts.KatherineProviderAttempts, totalCostUsd: summary.costs.totalCombinedCostUsd })}\n`);
}

await main();
