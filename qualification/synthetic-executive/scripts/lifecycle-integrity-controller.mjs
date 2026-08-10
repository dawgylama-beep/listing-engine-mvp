import assert from "node:assert/strict";
import { canonicalIso, seal, sha256Json } from "./protocol.mjs";

export const LIFECYCLE_INTEGRITY_CONTROLLER_VERSION = "1.0";

export const EXECUTIVE_CASE_STATE = Object.freeze({
  CASE_OPEN: "CASE_OPEN",
  EPISODE_RECONSTRUCTED: "EPISODE_RECONSTRUCTED",
  MEMORY_RETRIEVED: "MEMORY_RETRIEVED",
  FAILURE_CLASSIFIED: "FAILURE_CLASSIFIED",
  TASK_PROPOSED: "TASK_PROPOSED",
  PROOF_SPECIFIED: "PROOF_SPECIFIED",
  AUTHORITY_SPECIFIED: "AUTHORITY_SPECIFIED",
  WORKER_DOSSIER_RECEIVED: "WORKER_DOSSIER_RECEIVED",
  EVIDENCE_EVALUATED: "EVIDENCE_EVALUATED",
  LESSON_RECORDED: "LESSON_RECORDED",
  NEXT_ACTION_SELECTED: "NEXT_ACTION_SELECTED",
  CASE_SEALED: "CASE_SEALED",
  STOPPED: "STOPPED"
});

const TRANSITIONS = Object.freeze({
  CASE_OPEN: Object.freeze({ RECONSTRUCT_EPISODE: "EPISODE_RECONSTRUCTED", DECLARE_INSUFFICIENT_EVIDENCE: "STOPPED", STOP_SAFELY: "STOPPED" }),
  EPISODE_RECONSTRUCTED: Object.freeze({ RETRIEVE_RELEVANT_MEMORY: "MEMORY_RETRIEVED", DECLARE_INSUFFICIENT_EVIDENCE: "STOPPED", STOP_SAFELY: "STOPPED" }),
  MEMORY_RETRIEVED: Object.freeze({ CLASSIFY_FAILURE: "FAILURE_CLASSIFIED", DECLARE_RECURRENCE: "FAILURE_CLASSIFIED", DECLARE_NOVEL_FAILURE: "FAILURE_CLASSIFIED", DECLARE_INSUFFICIENT_EVIDENCE: "STOPPED" }),
  FAILURE_CLASSIFIED: Object.freeze({ PROPOSE_BOUNDED_ENGINEERING_TASK: "TASK_PROPOSED", SPECIFY_REQUIRED_AUTHORITY: "AUTHORITY_SPECIFIED", STOP_SAFELY: "STOPPED" }),
  TASK_PROPOSED: Object.freeze({ SPECIFY_REGRESSION_PROOF: "PROOF_SPECIFIED", STOP_SAFELY: "STOPPED" }),
  PROOF_SPECIFIED: Object.freeze({ SPECIFY_REQUIRED_AUTHORITY: "AUTHORITY_SPECIFIED", STOP_SAFELY: "STOPPED" }),
  AUTHORITY_SPECIFIED: Object.freeze({ WORKER_DOSSIER_SEALED_RETURN: "WORKER_DOSSIER_RECEIVED", EVALUATE_RETURNED_ENGINEERING_EVIDENCE: "EVIDENCE_EVALUATED", STOP_SAFELY: "STOPPED" }),
  WORKER_DOSSIER_RECEIVED: Object.freeze({ EVALUATE_RETURNED_ENGINEERING_EVIDENCE: "EVIDENCE_EVALUATED", STOP_SAFELY: "STOPPED" }),
  EVIDENCE_EVALUATED: Object.freeze({ WRITE_GENERALIZED_LESSON_CANDIDATE: "LESSON_RECORDED", SELECT_NEXT_LEGAL_ACTION: "NEXT_ACTION_SELECTED", STOP_SAFELY: "STOPPED" }),
  LESSON_RECORDED: Object.freeze({ SELECT_NEXT_LEGAL_ACTION: "NEXT_ACTION_SELECTED", STOP_SAFELY: "STOPPED" }),
  NEXT_ACTION_SELECTED: Object.freeze({ STOP_SAFELY: "CASE_SEALED" }),
  CASE_SEALED: Object.freeze({}),
  STOPPED: Object.freeze({})
});

export function createCaseController({ caseId, episodeHash, openedAt }) {
  canonicalIso(openedAt, "case opened time");
  return Object.freeze({
    schemaVersion: "1.0",
    controllerType: "LIFECYCLE_INTEGRITY_CONTROLLER",
    controllerVersion: LIFECYCLE_INTEGRITY_CONTROLLER_VERSION,
    caseId,
    episodeHash,
    initialState: EXECUTIVE_CASE_STATE.CASE_OPEN,
    openedAt,
    transitionMapHash: sha256Json(TRANSITIONS)
  });
}

export function reconstructCase(controller, receipts = []) {
  assert.equal(controller.controllerType, "LIFECYCLE_INTEGRITY_CONTROLLER");
  assert.equal(controller.transitionMapHash, sha256Json(TRANSITIONS));
  let state = controller.initialState;
  let priorReceiptHash = null;
  for (const [index, receipt] of receipts.entries()) {
    assert.equal(receipt.sequence, index + 1, "controller receipt sequence differs");
    assert.equal(receipt.predecessorReceiptHash, priorReceiptHash, "controller predecessor receipt differs");
    assert.equal(receipt.fromState, state, "controller predecessor state differs");
    assert.equal(TRANSITIONS[state]?.[receipt.actionType], receipt.toState, "controller transition is illegal");
    const core = structuredClone(receipt); delete core.receiptHash;
    assert.equal(sha256Json(core), receipt.receiptHash, "controller receipt hash differs");
    state = receipt.toState;
    priorReceiptHash = receipt.receiptHash;
  }
  return Object.freeze({
    state,
    terminal: state === EXECUTIVE_CASE_STATE.CASE_SEALED || state === EXECUTIVE_CASE_STATE.STOPPED,
    receiptCount: receipts.length,
    receiptAggregateHash: sha256Json(receipts.map((receipt) => receipt.receiptHash))
  });
}

export function applyAcceptedAction({ controller, receipts, action, decidedAt }) {
  canonicalIso(decidedAt, "controller decision time");
  const episode = reconstructCase(controller, receipts);
  assert.equal(episode.terminal, false, "terminal case cannot advance");
  const toState = TRANSITIONS[episode.state]?.[action.actionType];
  assert.ok(toState, `no legal transition for ${episode.state} -> ${action.actionType}`);
  const core = {
    schemaVersion: "1.0",
    receiptType: "LIFECYCLE_INTEGRITY_DECISION",
    controllerVersion: controller.controllerVersion,
    caseId: controller.caseId,
    sequence: receipts.length + 1,
    predecessorReceiptHash: receipts.at(-1)?.receiptHash || null,
    fromState: episode.state,
    toState,
    actionId: action.actionId,
    actionType: action.actionType,
    actionHash: action.contentHash,
    evidenceAggregateHash: sha256Json(action.evidenceReferences),
    decidedAt
  };
  return seal(core, "receiptHash");
}

export function recordWorkerDossier({ controller, receipts, dossier, recordedAt }) {
  canonicalIso(recordedAt, "worker dossier time");
  const episode = reconstructCase(controller, receipts);
  assert.equal(episode.state, EXECUTIVE_CASE_STATE.AUTHORITY_SPECIFIED);
  const core = {
    schemaVersion: "1.0",
    receiptType: "LIFECYCLE_INTEGRITY_DECISION",
    controllerVersion: controller.controllerVersion,
    caseId: controller.caseId,
    sequence: receipts.length + 1,
    predecessorReceiptHash: receipts.at(-1)?.receiptHash || null,
    fromState: episode.state,
    toState: EXECUTIVE_CASE_STATE.WORKER_DOSSIER_RECEIVED,
    actionId: dossier.dossierId,
    actionType: "WORKER_DOSSIER_SEALED_RETURN",
    actionHash: dossier.contentHash,
    evidenceAggregateHash: dossier.evidenceAggregateHash,
    decidedAt: recordedAt
  };
  return seal(core, "receiptHash");
}
