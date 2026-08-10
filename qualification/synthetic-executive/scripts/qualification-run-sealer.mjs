import assert from "node:assert/strict";
import { seal, sha256Json } from "./protocol.mjs";

export function sealQualificationRun({ readinessManifestHash, authorizationHash, orderedCaseOutputs, ledgerHash, evaluation, sealedAt }) {
  assert.equal(orderedCaseOutputs.length, 12);
  assert.equal(new Set(orderedCaseOutputs.map((item) => item.episodeId)).size, 12);
  assert.equal(new Date(sealedAt).toISOString(), sealedAt);
  const qualified = evaluation.qualified === true;
  return seal({
    schemaVersion: "1.0", sealType: "SYNTHETIC_EXECUTIVE_QUALIFICATION_RUN_SEAL",
    readinessManifestHash, authorizationHash, orderedEpisodeIds: orderedCaseOutputs.map((item) => item.episodeId),
    caseOutputAggregateHash: sha256Json(orderedCaseOutputs.map((item) => item.caseOutputHash)), ledgerHash,
    blindEvaluationHash: evaluation.evaluationHash, qualificationStatus: qualified ? "QUALIFIED_BY_BLIND_MODEL_DRIVEN_RUN" : "NOT_QUALIFIED",
    productionExecutionAuthorized: false, benchmarkExecutionAuthorized: false, productionReleaseAuthorized: false,
    separateHumanDecisionRequired: true, sealedAt
  }, "sealHash");
}
