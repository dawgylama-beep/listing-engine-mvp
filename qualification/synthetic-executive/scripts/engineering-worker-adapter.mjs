import assert from "node:assert/strict";
import { readJson, seal, sha256Json } from "./protocol.mjs";

export class EngineeringWorkerAdapter {
  #sealedTaskHashes = new Map();
  #dossierIndex;

  constructor({ dossierIndexPath }) {
    this.dossierIndexPath = dossierIndexPath;
  }

  async initialize() {
    this.#dossierIndex = await readJson(this.dossierIndexPath);
    return this;
  }

  sealTask(action) {
    assert.equal(action.actionType, "PROPOSE_BOUNDED_ENGINEERING_TASK");
    assert.equal(this.#sealedTaskHashes.has(action.episodeId), false, "engineering task is already sealed for this episode");
    this.#sealedTaskHashes.set(action.episodeId, action.contentHash);
    return seal({ schemaVersion: "1.0", receiptType: "SEALED_ENGINEERING_TASK", episodeId: action.episodeId, actionId: action.actionId, actionHash: action.contentHash }, "receiptHash");
  }

  returnDossier(episodeId) {
    const taskHash = this.#sealedTaskHashes.get(episodeId);
    assert.ok(taskHash, "engineering dossier cannot be revealed before task sealing");
    const source = this.#dossierIndex.dossiers.find((item) => item.episodeId === episodeId);
    assert.ok(source, `no pre-sealed worker dossier for ${episodeId}`);
    assert.equal(Object.hasOwn(source, "evaluatorLabel"), false, "worker dossier exposes evaluator label");
    const core = {
      schemaVersion: "1.0",
      dossierType: "PRESEALED_ENGINEERING_EVIDENCE_DOSSIER",
      dossierId: source.dossierId,
      episodeId,
      sealedTaskHash: taskHash,
      repositoryIdentity: source.repositoryIdentity,
      changeScope: source.changeScope,
      excludedScope: source.excludedScope,
      claims: source.claims,
      testEvidence: source.testEvidence,
      exactPathProof: source.exactPathProof,
      negativeProof: source.negativeProof,
      restartProof: source.restartProof,
      forbiddenActivityEvidence: source.forbiddenActivityEvidence,
      contradictions: source.contradictions,
      rawEvaluatorLabelsIncluded: false,
      evidenceAggregateHash: sha256Json(source.evidenceItems)
    };
    return seal(core);
  }
}
