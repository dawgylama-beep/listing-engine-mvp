import assert from "node:assert/strict";
import { EXECUTIVE_CASE_STATE, derivedTransitionRegistry } from "./executive-action-registry.mjs";
import { canonicalIso, seal, sha256Json } from "./protocol.mjs";

export const LIFECYCLE_INTEGRITY_CONTROLLER_VERSION = "1.0";

export { EXECUTIVE_CASE_STATE };

const registeredTransitions = derivedTransitionRegistry();
const TRANSITIONS = Object.freeze({
  ...registeredTransitions,
  [EXECUTIVE_CASE_STATE.AUTHORITY_SPECIFIED]: Object.freeze({
    ...registeredTransitions[EXECUTIVE_CASE_STATE.AUTHORITY_SPECIFIED],
    WORKER_DOSSIER_SEALED_RETURN: EXECUTIVE_CASE_STATE.WORKER_DOSSIER_RECEIVED
  })
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
