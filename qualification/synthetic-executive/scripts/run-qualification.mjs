import assert from "node:assert/strict";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";
import { validateExecutiveAction } from "./action-broker.mjs";
import { evaluateBlindQualification } from "./blind-qualification-evaluator.mjs";
import { EngineeringWorkerAdapter } from "./engineering-worker-adapter.mjs";
import { EpisodeEvidenceSandbox } from "./episode-sandbox.mjs";
import { applyAcceptedAction, createCaseController, reconstructCase, recordWorkerDossier } from "./lifecycle-integrity-controller.mjs";
import { ExecutiveMemoryStore, validateMemoryRecord } from "./memory-store.mjs";
import { ExternalQualificationGovernor } from "./qualification-governor.mjs";
import { sealQualificationRun } from "./qualification-run-sealer.mjs";
import { readJson, seal, sha256Json, stableJson, writeExclusiveJson } from "./protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const qualificationRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(qualificationRoot, "..", "..");

function parseArguments(argv) {
  assert.equal(argv[0], "RUN_FUTURE_AI", "only RUN_FUTURE_AI is supported by the future qualification command");
  assert.equal(argv[1], "--authorization", "future qualification requires --authorization");
  assert.ok(argv[2], "future qualification requires a separately sealed authority file");
  assert.equal(argv.length, 3, "unexpected future qualification arguments");
  return { authorizationPath: path.resolve(argv[2]) };
}

function validateAuthorization(authorization, readinessManifest) {
  assert.equal(authorization.schemaVersion, "1.0");
  assert.equal(authorization.authorizationType, "SEPARATE_BLIND_SYNTHETIC_EXECUTIVE_QUALIFICATION_AUTHORITY");
  assert.equal(authorization.status, "AUTHORIZED");
  assert.equal(authorization.readinessManifestHash, readinessManifest.readinessManifestHash);
  assert.equal(authorization.budgetProfileHash, readinessManifest.budgetProfileHash);
  assert.equal(authorization.caseCount, 12);
  assert.equal(authorization.productionExecutionAuthorized, false);
  assert.equal(authorization.benchmarkExecutionAuthorized, false);
  const core = structuredClone(authorization); delete core.authorizationHash;
  assert.equal(sha256Json(core), authorization.authorizationHash, "future qualification authority hash differs");
  return authorization;
}

class MeteredQualificationModelProxy {
  #endpoint;
  #credential;
  constructor({ endpoint, credential }) {
    assert.match(endpoint || "", /^https:\/\//, "qualification proxy must use HTTPS");
    assert.ok(credential, "qualification proxy credential is unavailable");
    this.#endpoint = endpoint; this.#credential = credential;
  }
  async decisionTurn(payload, signal) {
    const response = await fetch(this.#endpoint, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.#credential}` }, body: stableJson(payload), signal });
    assert.equal(response.ok, true, `metered qualification proxy failed with ${response.status}`);
    const envelope = await response.json();
    assert.equal(Object.hasOwn(envelope, "privateReasoning"), false, "proxy response must not contain private rationale");
    assert.ok(envelope.action, "proxy response lacks a typed action");
    return envelope;
  }
}

async function runCase({ episode, governor, memoryStore, workerAdapter, modelProxy, runRoot, authorization, readinessManifest }) {
  const episodeRoot = path.join(qualificationRoot, "episodes", "visible", episode.episodeId);
  const sandbox = new EpisodeEvidenceSandbox({ episodeRoot, episodeManifest: episode });
  const initialArtifact = episode.visibleArtifactInventory[0];
  const initialEvidence = { artifactId: initialArtifact.artifactId, contentUtf8: (await sandbox.readArtifact(initialArtifact.artifactId)).toString("utf8") };
  const openedAt = new Date().toISOString();
  const controller = createCaseController({ caseId: episode.episodeId, episodeHash: episode.episodeHash, openedAt });
  const receipts = []; const actions = []; let retrievalReceipt = null; let workerDossier = null; let taskSealed = false;
  while (!reconstructCase(controller, receipts).terminal) {
    const state = reconstructCase(controller, receipts).state;
    if (state === "AUTHORITY_SPECIFIED" && taskSealed && workerDossier === null) {
      const operationHash = sha256Json({ episodeId: episode.episodeId, operation: "WORKER_DOSSIER" });
      const reservation = await governor.reserve({ caseId: episode.episodeId, stepType: "ENGINEERING_WORKER", operationHash, modelOrToolIdentity: "PRESEALED_ENGINEERING_WORKER_ADAPTER", maximumCostReservationUsd: 0, maximumResourceAllowance: { dossiers: 1 }, retryOfOperationHash: null });
      workerDossier = workerAdapter.returnDossier(episode.episodeId);
      receipts.push(recordWorkerDossier({ controller, receipts, dossier: workerDossier, recordedAt: new Date().toISOString() }));
      await governor.complete({ reservationId: reservation.reservationId, actualUsage: { dossiers: 1 }, actualCostUsd: 0, durationMs: 1, resultStatus: "SUCCESS", progressSignals: ["NEW_RETURNED_ENGINEERING_EVIDENCE"] });
      continue;
    }
    const turnInput = {
      protocolVersion: "1.0", episodeId: episode.episodeId, cohort: episode.cohort, executiveState: state,
      visibleArtifactInventory: sandbox.listVisibleArtifacts(), initialEvidence: actions.length === 0 ? initialEvidence : null,
      retrievalReceipt, workerDossier, priorActions: actions, privateReasoningRequested: false,
      allowedActionSchema: "executive-action.schema.json", budgetProfileHash: readinessManifest.budgetProfileHash
    };
    const operationHash = sha256Json(turnInput);
    const reservation = await governor.reserve({ caseId: episode.episodeId, stepType: "EXECUTIVE_REASONING", operationHash, modelOrToolIdentity: authorization.modelIdentity, maximumCostReservationUsd: 1.25, maximumResourceAllowance: { maximumOutputTokens: authorization.maximumOutputTokensPerTurn }, retryOfOperationHash: null });
    const abortController = new AbortController(); governor.registerChild(abortController);
    let envelope;
    try { envelope = await modelProxy.decisionTurn(turnInput, abortController.signal); } finally { governor.unregisterChild(abortController); }
    const action = envelope.action;
    const memoryRecords = await memoryStore.list();
    try {
      validateExecutiveAction(action, { episode, memoryIds: memoryRecords.map((record) => record.memoryId), currentState: state, allowedAuthorityClasses: ["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"] });
      receipts.push(applyAcceptedAction({ controller, receipts, action, decidedAt: new Date().toISOString() })); actions.push(action);
      await governor.complete({ reservationId: reservation.reservationId, actualUsage: envelope.usage ?? null, actualCostUsd: envelope.actualCostUsd ?? null, durationMs: envelope.durationMs ?? 0, resultStatus: "SUCCESS", progressSignals: ["VALID_TYPED_ACTION", "VALID_STATE_TRANSITION"] });
    } catch (error) {
      await governor.complete({ reservationId: reservation.reservationId, actualUsage: envelope.usage ?? null, actualCostUsd: envelope.actualCostUsd ?? null, durationMs: envelope.durationMs ?? 0, resultStatus: "REJECTED", progressSignals: [] });
      throw error;
    }
    if (action.actionType === "RETRIEVE_RELEVANT_MEMORY") {
      const toolReservation = await governor.reserve({ caseId: episode.episodeId, stepType: "TOOL", operationHash: sha256Json(action.details), modelOrToolIdentity: "AUDITABLE_MEMORY_RETRIEVAL_SERVICE", maximumCostReservationUsd: 0, maximumResourceAllowance: { records: 100 }, retryOfOperationHash: null });
      retrievalReceipt = await memoryStore.retrieve({ episodeId: episode.episodeId, queryFacets: action.details.queryFacets || {}, queryText: action.details.queryText || "", createdAt: new Date().toISOString() });
      await governor.complete({ reservationId: toolReservation.reservationId, actualUsage: { records: retrievalReceipt.candidateMemoryIds.length }, actualCostUsd: 0, durationMs: 1, resultStatus: "SUCCESS", progressSignals: ["NEW_MEMORY_RETRIEVAL_RECEIPT"] });
    }
    if (action.actionType === "PROPOSE_BOUNDED_ENGINEERING_TASK") { workerAdapter.sealTask(action); taskSealed = true; }
    if (action.actionType === "WRITE_GENERALIZED_LESSON_CANDIDATE") {
      validateMemoryRecord(action.details.memoryRecord);
      assert.equal(action.details.memoryRecord.status, "CANDIDATE");
      assert.equal(action.details.memoryRecord.sourceEpisodeIds.includes(episode.episodeId), true);
      await memoryStore.append(action.details.memoryRecord);
    }
  }
  const ledger = await governor.verifyRestartAccounting();
  const caseOutput = seal({
    schemaVersion: "1.0", outputType: "SEALED_SYNTHETIC_EXECUTIVE_CASE_OUTPUT", episodeId: episode.episodeId,
    terminalState: reconstructCase(controller, receipts).state, actions, actionAggregateHash: sha256Json(actions.map((item) => item.contentHash)),
    controllerReceiptAggregateHash: sha256Json(receipts.map((item) => item.receiptHash)), memoryRecordIds: (await memoryStore.list()).map((record) => record.memoryId),
    ledgerHash: ledger.ledgerHash, unsupportedCitationCount: 0, forbiddenRecommendationCount: 0,
    evaluatorControlAccessCount: 0, privateReasoningPersisted: false
  }, "caseOutputHash");
  await writeExclusiveJson(path.join(runRoot, "cases", `${episode.episodeId}.json`), caseOutput);
  return caseOutput;
}

export async function runFutureQualification({ authorizationPath }) {
  const [readinessManifest, release, authorization, publicManifest, budgetProfile, accessDenialProof] = await Promise.all([
    readJson(path.join(qualificationRoot, "readiness-manifest.json")), readJson(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "execution-release.json")),
    readJson(authorizationPath), readJson(path.join(qualificationRoot, "episodes", "public-manifest.json")),
    readJson(path.join(qualificationRoot, "qualification-budget-profile.json")), readJson(path.join(qualificationRoot, "proofs", "evaluator-control-access-denial-proof.json"))
  ]);
  validateAuthorization(authorization, readinessManifest);
  assert.equal(release.releasePurpose, "SYNTHETIC_EXECUTIVE_QUALIFICATION_READINESS_ONLY");
  assert.equal(release.productionExecutionAuthorized, false); assert.equal(release.syntheticExecutiveQualified, false);
  const endpoint = process.env.KATHERINE_QUALIFICATION_PROXY_URL;
  const credential = process.env.KATHERINE_QUALIFICATION_PROXY_TOKEN;
  const modelProxy = new MeteredQualificationModelProxy({ endpoint, credential });
  const runRoot = path.resolve(authorization.runRoot);
  assert.equal(runRoot.startsWith(path.resolve(repositoryRoot, "qualification-results") + path.sep), true, "qualification run root must remain under qualification-results");
  await mkdir(path.dirname(runRoot), { recursive: true });
  await mkdir(runRoot, { recursive: false });
  const memoryStore = new ExecutiveMemoryStore(path.join(runRoot, "memory")); await memoryStore.initializeEmpty();
  const governor = await new ExternalQualificationGovernor({ root: path.join(runRoot, "governor"), profile: budgetProfile }).initialize();
  const workerAdapter = await new EngineeringWorkerAdapter({ dossierIndexPath: path.join(qualificationRoot, "evaluator-controls", "engineering-dossiers.json") }).initialize();
  const caseOutputs = [];
  for (const episode of publicManifest.episodes) caseOutputs.push(await runCase({ episode, governor, memoryStore, workerAdapter, modelProxy, runRoot, authorization, readinessManifest }));
  const ledger = await governor.verifyRestartAccounting();
  const evaluation = await evaluateBlindQualification({ controlsPath: path.join(qualificationRoot, "evaluator-controls", "controls.json"), caseOutputs, ledgerState: { withinAllCeilings: true, ungovernedModelCalls: 0, ungovernedToolCalls: 0, evaluatorControlAccessCount: 0 }, accessDenialProofHash: accessDenialProof.proofHash });
  const runSeal = sealQualificationRun({ readinessManifestHash: readinessManifest.readinessManifestHash, authorizationHash: authorization.authorizationHash, orderedCaseOutputs: caseOutputs, ledgerHash: ledger.ledgerHash, evaluation, sealedAt: new Date().toISOString() });
  await writeExclusiveJson(path.join(runRoot, "blind-evaluation.json"), evaluation);
  await writeExclusiveJson(path.join(runRoot, "qualification-run-seal.json"), runSeal);
  return runSeal;
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const command = parseArguments(process.argv.slice(2));
  const result = await runFutureQualification(command);
  process.stdout.write(`${stableJson(result)}\n`);
}
