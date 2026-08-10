import assert from "node:assert/strict";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { validateExecutiveAction, sealExecutiveAction } from "./action-broker.mjs";
import { evaluateBlindQualification } from "./blind-qualification-evaluator.mjs";
import { EngineeringWorkerAdapter } from "./engineering-worker-adapter.mjs";
import { EpisodeEvidenceSandbox } from "./episode-sandbox.mjs";
import { applyAcceptedAction, createCaseController, reconstructCase, recordWorkerDossier } from "./lifecycle-integrity-controller.mjs";
import { ExecutiveMemoryStore, sealMemoryRecord, validateMemoryRecord } from "./memory-store.mjs";
import { sealQualificationRun } from "./qualification-run-sealer.mjs";
import { readJson, seal, sha256Bytes, sha256Json, stableJson, writeExclusiveJson } from "./protocol.mjs";
import { resolveApprovedCredential } from "../calibration/scripts/real-route-credential.mjs";
import { SafeProviderFailure } from "../calibration/scripts/real-route-redaction.mjs";
import { createNewQualificationAuthority, validateQualificationAuthority } from "../qualification-real-route/scripts/qualification-authority.mjs";
import { ImmutableQualificationActionLedger, RETRY_REASONS } from "../qualification-real-route/scripts/qualification-execution-ledger.mjs";
import { validateQualificationReleaseRecord } from "../qualification-real-route/scripts/qualification-release.mjs";
import {
  QUALIFICATION_ROUTE, QualificationResponsesClient, buildQualificationInferenceRequestEnvelope, buildQualificationPrompt,
  createQualificationActionTransportSchema, loadQualificationProviderProfile, qualificationActualCostUsd,
  qualificationReservationUsd, qualificationRouteBindings, releasePath, SEALED_BINDINGS
} from "../qualification-real-route/scripts/qualification-route.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const qualificationRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(qualificationRoot, "..", "..");
const execFileAsync = promisify(execFile);

const allowedAuthorityClasses = Object.freeze(["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"]);

function parseArguments(argv) {
  assert.equal(argv[1], "--authorization", "qualification command requires --authorization");
  assert.ok(argv[2], "qualification authority path is required"); assert.equal(argv.length, 3, "unexpected qualification command arguments");
  assert.ok(["CREATE_AUTHORITY", "RUN_QUALIFICATION"].includes(argv[0]), "qualification command must be CREATE_AUTHORITY or RUN_QUALIFICATION");
  return { command: argv[0], authorityPath: path.resolve(argv[2]) };
}

export function qualificationObservedStateHash(state, receipts) {
  return sha256Json({ state, receipts: receipts.map((item) => item.receiptHash) });
}

function normalizeActionCore(actionCore) {
  assert.ok(actionCore && typeof actionCore === "object" && !Array.isArray(actionCore), "provider action core must be an object");
  const core = structuredClone(actionCore); delete core.contentHash;
  if (core.actionType === "WRITE_GENERALIZED_LESSON_CANDIDATE") {
    assert.ok(core.details?.memoryRecord, "lesson action lacks a memory record");
    core.details.memoryRecord = sealMemoryRecord(core.details.memoryRecord);
  }
  return sealExecutiveAction(core);
}

function actionIdentity(authority, episodeId, kind, ordinal) {
  const digest = sha256Json({ authorityHash: authority.authorityHash, episodeId, kind, ordinal });
  return `qa-${episodeId.toLowerCase()}-${kind.toLowerCase()}-${String(ordinal).padStart(3, "0")}-${digest.slice(0, 20)}`;
}

function caseOutput({ episode, controller, receipts, actions, memoryRecords, ledger, status, failureEvidence = null, providerReceipts, actualCostUsd }) {
  const terminal = reconstructCase(controller, receipts);
  return seal({
    schemaVersion: "1.0", outputType: "SEALED_SYNTHETIC_EXECUTIVE_CASE_OUTPUT", episodeId: episode.episodeId,
    terminalState: terminal.state, caseStatus: status, failureEvidence, actions,
    actionAggregateHash: sha256Json(actions.map((item) => item.contentHash)),
    controllerReceiptAggregateHash: sha256Json(receipts.map((item) => item.receiptHash)),
    memoryRecordIds: memoryRecords.map((record) => record.memoryId), ledgerHash: ledger.ledgerHash,
    providerReceiptAggregateHash: sha256Json(providerReceipts.map((item) => item.safeResponseHash)),
    providerRequestCount: ledger.providerAttempts, successfulProviderResponseCount: providerReceipts.filter((item) => item.responseStatus === "completed").length, conservativeReservedCostUsd: ledger.reservedCostUsd,
    exactAvailableCostUsd: Number(actualCostUsd.toFixed(8)), unsupportedCitationCount: 0, forbiddenRecommendationCount: 0,
    evaluatorControlAccessCount: 0, privateReasoningPersisted: false
  }, "caseOutputHash");
}

async function runCase({ episode, ledger, memoryStore, dossierAdapter, client, runRoot, authority, readinessManifest, profile, clock }) {
  const episodeRoot = path.join(qualificationRoot, "episodes", "visible", episode.episodeId);
  const sandbox = new EpisodeEvidenceSandbox({ episodeRoot, episodeManifest: episode });
  const initialArtifact = episode.visibleArtifactInventory[0];
  const initialEvidence = { artifactId: initialArtifact.artifactId, contentUtf8: (await sandbox.readArtifact(initialArtifact.artifactId)).toString("utf8") };
  const controller = createCaseController({ caseId: episode.episodeId, episodeHash: episode.episodeHash, openedAt: clock() });
  const receipts = []; const actions = []; const providerReceipts = [];
  let retrievalReceipt = null; let workerDossier = null; let taskSealed = false; let actualCost = 0; let actionOrdinal = 0; let ledgerOrdinal = 0;

  while (!reconstructCase(controller, receipts).terminal) {
    const state = reconstructCase(controller, receipts).state;
    if (state === "AUTHORITY_SPECIFIED" && taskSealed && workerDossier === null) {
      ledgerOrdinal += 1;
      const identity = actionIdentity(authority, episode.episodeId, "PRESEALED_DOSSIER", ledgerOrdinal);
      const operationHash = sha256Json({ episodeId: episode.episodeId, capability: "REQUEST_PRESEALED_WORKER_DOSSIER", sealedTaskHash: actions.find((item) => item.actionType === "PROPOSE_BOUNDED_ENGINEERING_TASK")?.contentHash });
      await ledger.consume({ caseId: episode.episodeId, actionKind: "PRESEALED_DOSSIER", actionIdentity: identity, operationHash });
      workerDossier = dossierAdapter.returnDossier(episode.episodeId);
      receipts.push(recordWorkerDossier({ controller, receipts, dossier: workerDossier, recordedAt: clock() }));
      continue;
    }

    actionOrdinal += 1;
    const observedStateHash = qualificationObservedStateHash(state, receipts);
    const expectedActionId = `action-${episode.episodeId.toLowerCase()}-${String(actionOrdinal).padStart(2, "0")}`;
    const memoryRecords = await memoryStore.list();
    const turnInput = {
      protocolVersion: "1.0", episodeId: episode.episodeId, cohort: episode.cohort, executiveState: state, observedStateHash,
      visibleArtifactInventory: sandbox.listVisibleArtifacts().map(({ artifactId, sha256, sourceKind }) => ({ artifactId, sha256, sourceKind })),
      initialEvidence,
      retrievalReceipt: retrievalReceipt ? { receiptHash: retrievalReceipt.receiptHash, selectedMemoryIds: retrievalReceipt.selectedMemoryIds, retrievalReasonSummary: retrievalReceipt.retrievalReasonSummary } : null,
      workerDossier,
      priorActionTrace: actions.map(({ actionType, contentHash, details }) => ({ actionType, contentHash, details })),
      retrievedMemoryRecords: retrievalReceipt ? memoryRecords.filter((record) => retrievalReceipt.selectedMemoryIds.includes(record.memoryId)) : [],
      allowedCapabilities: ["QUERY_EXECUTIVE_MEMORY", "REQUEST_PRESEALED_WORKER_DOSSIER"],
      forbiddenCapabilities: ["PROVIDER_TOOL", "MODEL_TOOL", "SOURCE_OPERATION", "EVALUATOR_CONTROL", "PRODUCT_HANDLER", "BENCHMARK", "PRODUCTION"],
      privateReasoningRequested: false, budgetProfileHash: readinessManifest.budgetProfileHash
    };
    const structuredSchema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: state, observedStateHash, actionId: expectedActionId });
    const prompt = buildQualificationPrompt(turnInput);
    const request = buildQualificationInferenceRequestEnvelope({ prompt: prompt.text, structuredSchema });
    const serializedRequest = JSON.stringify(request); const requestHash = sha256Bytes(Buffer.from(serializedRequest, "utf8"));
    const reservationUsd = qualificationReservationUsd(prompt.byteCount, profile.pricing);
    let attempt = 0; let response; let pendingRetryIdentity = null;
    while (true) {
      attempt += 1; ledgerOrdinal += 1;
      const providerIdentity = actionIdentity(authority, episode.episodeId, "PROVIDER_ATTEMPT", ledgerOrdinal);
      await ledger.consume({ caseId: episode.episodeId, actionKind: "PROVIDER_ATTEMPT", actionIdentity: providerIdentity, operationHash: requestHash, reservationUsd, retryOfActionIdentity: pendingRetryIdentity });
      pendingRetryIdentity = null;
      const abortController = new AbortController(); const timer = setTimeout(() => abortController.abort(), profile.timeoutMs);
      try {
        response = await client.decisionTurn({ serializedRequest, requestHash, signal: abortController.signal });
        providerReceipts.push(response);
        const cost = qualificationActualCostUsd(response.usage, profile.pricing); if (cost !== null) actualCost += cost;
        break;
      } catch (error) {
        const safeFailureReceipt = seal({
          schemaVersion: "1.0", receiptType: "SAFE_QUALIFICATION_PROVIDER_FAILURE", providerAttemptIdentity: providerIdentity,
          requestHash, code: error instanceof SafeProviderFailure ? error.code : "SAFE_PROVIDER_FAILURE",
          providerDiagnostics: error instanceof SafeProviderFailure ? error.providerDiagnostics : null
        }, "safeResponseHash");
        providerReceipts.push(safeFailureReceipt);
        if (!(error instanceof SafeProviderFailure) || !RETRY_REASONS.includes(error.code) || attempt > 2) {
          const summary = await ledger.summary(episode.episodeId);
          const output = caseOutput({ episode, controller, receipts, actions, memoryRecords: await memoryStore.list(), ledger: summary, status: "IMMUTABLE_PROVIDER_FAILURE", failureEvidence: { code: error instanceof SafeProviderFailure ? error.code : "SAFE_PROVIDER_FAILURE", providerDiagnostics: error instanceof SafeProviderFailure ? error.providerDiagnostics : null }, providerReceipts, actualCostUsd: actualCost });
          await writeExclusiveJson(path.join(runRoot, "cases", `${episode.episodeId}.json`), output); return output;
        }
        ledgerOrdinal += 1;
        const retryIdentity = actionIdentity(authority, episode.episodeId, "RETRY_SLOT", ledgerOrdinal);
        await ledger.consume({ caseId: episode.episodeId, actionKind: "RETRY_SLOT", actionIdentity: retryIdentity, operationHash: requestHash, retryOfActionIdentity: providerIdentity, retryReason: error.code });
        pendingRetryIdentity = retryIdentity;
      } finally { clearTimeout(timer); }
    }

    let action;
    try {
      action = normalizeActionCore(response.actionCore);
      validateExecutiveAction(action, { episode, memoryIds: memoryRecords.map((record) => record.memoryId), currentState: state, allowedAuthorityClasses });
      receipts.push(applyAcceptedAction({ controller, receipts, action, decidedAt: clock() })); actions.push(action);
    } catch (error) {
      const summary = await ledger.summary(episode.episodeId);
      const output = caseOutput({ episode, controller, receipts, actions, memoryRecords: await memoryStore.list(), ledger: summary, status: "IMMUTABLE_BROKER_REJECTION", failureEvidence: { code: "BROKER_REJECTED_TYPED_ACTION", digest: sha256Json({ name: error?.name, message: error?.message }) }, providerReceipts, actualCostUsd: actualCost });
      await writeExclusiveJson(path.join(runRoot, "cases", `${episode.episodeId}.json`), output); return output;
    }

    if (action.actionType === "RETRIEVE_RELEVANT_MEMORY") {
      ledgerOrdinal += 1;
      const identity = actionIdentity(authority, episode.episodeId, "MEMORY_QUERY", ledgerOrdinal);
      await ledger.consume({ caseId: episode.episodeId, actionKind: "MEMORY_QUERY", actionIdentity: identity, operationHash: sha256Json(action.details) });
      retrievalReceipt = await memoryStore.retrieve({ episodeId: episode.episodeId, queryFacets: action.details.queryFacets, queryText: action.details.queryText, createdAt: clock() });
    }
    if (action.actionType === "PROPOSE_BOUNDED_ENGINEERING_TASK") { dossierAdapter.sealTask(action); taskSealed = true; }
    if (action.actionType === "WRITE_GENERALIZED_LESSON_CANDIDATE") {
      validateMemoryRecord(action.details.memoryRecord); assert.equal(action.details.memoryRecord.status, "CANDIDATE");
      assert.equal(action.details.memoryRecord.sourceEpisodeIds.includes(episode.episodeId), true); await memoryStore.append(action.details.memoryRecord);
    }
  }
  const summary = await ledger.summary(episode.episodeId);
  const output = caseOutput({ episode, controller, receipts, actions, memoryRecords: await memoryStore.list(), ledger: summary, status: "CASE_SEALED", providerReceipts, actualCostUsd: actualCost });
  await writeExclusiveJson(path.join(runRoot, "cases", `${episode.episodeId}.json`), output); return output;
}

export async function runBlindQualificationRealRoute({ authority, publicManifest, readinessManifest, budgetProfile, accessDenialProof, routeBindings, client, runRoot = authority.runRoot, clock = () => new Date().toISOString(), controlsPath = path.join(qualificationRoot, "evaluator-controls", "controls.json"), dossierIndexPath = path.join(qualificationRoot, "evaluator-controls", "engineering-dossiers.json") }) {
  validateQualificationAuthority(authority, { publicManifest, routeBindings });
  assert.equal(readinessManifest.readinessManifestHash, SEALED_BINDINGS.readinessManifestHash);
  assert.equal(publicManifest.manifestHash, SEALED_BINDINGS.caseManifestHash);
  assert.equal(budgetProfile.profileHash, SEALED_BINDINGS.budgetProfileHash);
  assert.equal(path.resolve(runRoot), path.resolve(authority.runRoot));
  await mkdir(path.dirname(runRoot), { recursive: true }); await mkdir(runRoot, { recursive: false }); await mkdir(path.join(runRoot, "cases"));
  const memoryStore = new ExecutiveMemoryStore(path.join(runRoot, "isolated-qualification-memory")); await memoryStore.initializeEmpty();
  const ledger = await new ImmutableQualificationActionLedger({ root: path.join(runRoot, "immutable-action-ledger"), authority, clock }).initialize();
  const dossierAdapter = await new EngineeringWorkerAdapter({ dossierIndexPath }).initialize();
  const profile = await loadQualificationProviderProfile(); const caseOutputs = [];
  for (const episode of publicManifest.episodes) caseOutputs.push(await runCase({ episode, ledger, memoryStore, dossierAdapter, client, runRoot, authority, readinessManifest, profile, clock }));
  const ledgerState = await ledger.summary();
  const evaluation = await evaluateBlindQualification({ controlsPath, caseOutputs, ledgerState: { withinAllCeilings: true, ungovernedModelCalls: 0, ungovernedToolCalls: 0, evaluatorControlAccessCount: 0 }, accessDenialProofHash: accessDenialProof.proofHash });
  const runSeal = sealQualificationRun({ readinessManifestHash: readinessManifest.readinessManifestHash, authorizationHash: authority.authorityHash, orderedCaseOutputs: caseOutputs, ledgerHash: ledgerState.ledgerHash, evaluation, sealedAt: clock() });
  await writeExclusiveJson(path.join(runRoot, "blind-evaluation.json"), evaluation); await writeExclusiveJson(path.join(runRoot, "qualification-run-seal.json"), runSeal);
  return Object.freeze({ runSeal, evaluation, caseOutputs, ledgerState, providerCounts: client.counts });
}

async function loadReleaseAndInputs(authorityPath = null) {
  const [release, routeBindings, publicManifest, readinessManifest, budgetProfile, accessDenialProof] = await Promise.all([
    readJson(releasePath), qualificationRouteBindings(), readJson(path.join(qualificationRoot, "episodes", "public-manifest.json")),
    readJson(path.join(qualificationRoot, "readiness-manifest.json")), readJson(path.join(qualificationRoot, "qualification-budget-profile.json")),
    readJson(path.join(qualificationRoot, "proofs", "evaluator-control-access-denial-proof.json"))
  ]);
  const authority = authorityPath ? await readJson(authorityPath) : null;
  validateQualificationReleaseRecord(release);
  return { release, routeBindings, publicManifest, readinessManifest, budgetProfile, accessDenialProof, authority };
}

async function inspectToolingIdentity() {
  const git = async (...args) => (await execFileAsync("git", args, { cwd: repositoryRoot, encoding: "utf8" })).stdout.trim();
  assert.equal(await git("status", "--porcelain", "--untracked-files=no"), "", "tracked tooling tree must be clean before authority creation");
  const [toolingCommit, toolingTree, trackingCommit, branch] = await Promise.all([git("rev-parse", "HEAD"), git("rev-parse", "HEAD^{tree}"), git("rev-parse", "@{u}"), git("branch", "--show-current")]);
  assert.equal(branch, "refactor/beta-evidence-pipeline", "qualification authority requires the sealed feature branch");
  assert.equal(toolingCommit, trackingCommit, "local and tracking feature heads differ");
  return { toolingCommit, toolingTree };
}

export async function createQualificationAuthorityCommand({ authorityPath, toolingCommit = null, toolingTree = null, createdAt = new Date().toISOString() }) {
  const input = await loadReleaseAndInputs();
  assert.equal(input.release.releasePurpose, "QUALIFICATION_EXECUTION_ONLY");
  if (toolingCommit === null || toolingTree === null) ({ toolingCommit, toolingTree } = await inspectToolingIdentity());
  return createNewQualificationAuthority({ authorityPath, authorityId: `blind-qualification-${sha256Json({ toolingCommit, createdAt }).slice(0, 48)}`, createdAt, toolingCommit, toolingTree, toolingReleaseHash: input.release.releaseHash, publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot: path.join(repositoryRoot, "qualification-results", `blind-qualification-${sha256Json({ toolingCommit, createdAt }).slice(0, 20)}`) });
}

export async function runQualificationCommand({ authorityPath }) {
  const input = await loadReleaseAndInputs(authorityPath);
  const identity = await inspectToolingIdentity();
  validateQualificationAuthority(input.authority, { publicManifest: input.publicManifest, routeBindings: input.routeBindings, toolingCommit: identity.toolingCommit, toolingTree: identity.toolingTree, toolingReleaseHash: input.release.releaseHash });
  assert.equal(path.resolve(input.authority.runRoot).startsWith(path.join(repositoryRoot, "qualification-results") + path.sep), true, "qualification run root must remain under qualification-results");
  const credentialHandle = await resolveApprovedCredential(); assert.equal(credentialHandle.present, true, "approved credential is unavailable");
  const profile = await loadQualificationProviderProfile();
  const client = new QualificationResponsesClient({ profile, credentialHandle });
  return runBlindQualificationRealRoute({ ...input, client });
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const command = parseArguments(process.argv.slice(2));
  const result = command.command === "CREATE_AUTHORITY" ? await createQualificationAuthorityCommand(command) : await runQualificationCommand(command);
  process.stdout.write(`${stableJson(command.command === "CREATE_AUTHORITY" ? result : result.runSeal)}\n`);
}
