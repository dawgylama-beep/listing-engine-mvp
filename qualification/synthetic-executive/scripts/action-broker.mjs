import assert from "node:assert/strict";
import { assertHash, assertSafeId, exactKeys, seal, sha256Json } from "./protocol.mjs";

export const ACTION_SCHEMA_VERSION = "1.0";
export const ACTION_TYPES = Object.freeze([
  "RECONSTRUCT_EPISODE", "DECLARE_INSUFFICIENT_EVIDENCE", "RETRIEVE_RELEVANT_MEMORY", "CLASSIFY_FAILURE",
  "DECLARE_RECURRENCE", "DECLARE_NOVEL_FAILURE", "PROPOSE_BOUNDED_ENGINEERING_TASK", "SPECIFY_REGRESSION_PROOF",
  "SPECIFY_REQUIRED_AUTHORITY", "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", "WRITE_GENERALIZED_LESSON_CANDIDATE",
  "SELECT_NEXT_LEGAL_ACTION", "STOP_SAFELY"
]);
export const NEXT_LEGAL_ACTIONS = Object.freeze([
  "ADVANCE_WITHIN_EXISTING_AUTHORITY", "REQUEST_BOUNDED_ENGINEERING_AUTHORITY", "REQUEST_EXCEPTIONAL_HUMAN_AUTHORITY",
  "REJECT_RETURNED_EVIDENCE", "STOP_NOVEL_FAILURE", "STOP_INSUFFICIENT_EVIDENCE", "NO_LEGAL_ACTION"
]);
export const EVIDENCE_EVALUATIONS = Object.freeze(["VALID_PASS", "BOUNDED_FAIL", "ARCHITECTURAL_FAIL", "INSUFFICIENT_EVIDENCE"]);
export const CLAIM_STATES = Object.freeze(["PROVEN", "CONTRADICTED", "NOT_PROVEN", "NOT_APPLICABLE"]);

const BASE_FIELDS = Object.freeze([
  "schemaVersion", "actionType", "actionId", "episodeId", "executiveState", "observedStateHash", "evidenceReferences",
  "memoryReferences", "factualFindings", "uncertainties", "confidence", "boundedRationaleSummary", "requestedSuccessorState",
  "authorityClass", "prohibitedOperations", "details", "contentHash"
]);

const DETAIL_FIELDS = Object.freeze({
  CLASSIFY_FAILURE: ["failureClass"],
  DECLARE_RECURRENCE: ["failureClass", "memoryMatchClass"],
  DECLARE_NOVEL_FAILURE: ["failureClass"],
  PROPOSE_BOUNDED_ENGINEERING_TASK: ["exactFailureClass", "affectedComponents", "proposedChangeSurface", "explicitlyExcludedComponents", "generalizedInvariant", "minimumRequiredRegressionSet", "exactPathOrStateProofRequirement", "rollbackRequirement", "stopCondition", "costAndToolEstimate", "requestedAuthority"],
  SPECIFY_REGRESSION_PROOF: ["helperUnitProof", "exactProductionPathProof", "historicalStateProof", "negativeProof", "restartOrRecoveryProof", "forbiddenActivityProof"],
  EVALUATE_RETURNED_ENGINEERING_EVIDENCE: ["classification", "requiredClaims"],
  SELECT_NEXT_LEGAL_ACTION: ["selection"]
});

function validateDetails(action) {
  const expected = DETAIL_FIELDS[action.actionType];
  if (!expected) {
    assert.equal(action.details && typeof action.details === "object" && !Array.isArray(action.details), true);
    return;
  }
  exactKeys(action.details, expected, `${action.actionType} details`);
  if (action.actionType === "EVALUATE_RETURNED_ENGINEERING_EVIDENCE") {
    assert.ok(EVIDENCE_EVALUATIONS.includes(action.details.classification));
    assert.ok(Array.isArray(action.details.requiredClaims) && action.details.requiredClaims.length > 0);
    for (const claim of action.details.requiredClaims) {
      exactKeys(claim, ["claimId", "status", "evidenceReferences"], "required claim");
      assert.ok(CLAIM_STATES.includes(claim.status));
    }
  }
  if (action.actionType === "SELECT_NEXT_LEGAL_ACTION") assert.ok(NEXT_LEGAL_ACTIONS.includes(action.details.selection));
}

export function sealExecutiveAction(core) {
  const withoutHash = { ...core, schemaVersion: ACTION_SCHEMA_VERSION };
  delete withoutHash.contentHash;
  return seal(withoutHash);
}

export function validateExecutiveAction(action, { episode, memoryIds = [], currentState, allowedAuthorityClasses }) {
  exactKeys(action, BASE_FIELDS, "executive action");
  assert.equal(action.schemaVersion, ACTION_SCHEMA_VERSION);
  assert.ok(ACTION_TYPES.includes(action.actionType), "unsupported executive action type");
  assertSafeId(action.actionId, "action ID");
  assert.equal(action.episodeId, episode.episodeId);
  assert.equal(action.executiveState, currentState);
  assertHash(action.observedStateHash, "observed-state hash");
  assert.ok(Array.isArray(action.evidenceReferences));
  assert.ok(Array.isArray(action.memoryReferences));
  assert.ok(Array.isArray(action.factualFindings));
  assert.ok(Array.isArray(action.uncertainties));
  assert.equal(Number.isFinite(action.confidence) && action.confidence >= 0 && action.confidence <= 1, true);
  assert.ok(typeof action.boundedRationaleSummary === "string" && action.boundedRationaleSummary.length >= 1 && action.boundedRationaleSummary.length <= 1200);
  assert.ok(allowedAuthorityClasses.includes(action.authorityClass), "illegal authority class");
  assert.ok(Array.isArray(action.prohibitedOperations) && action.prohibitedOperations.length > 0);
  const visibleEvidence = new Set(episode.visibleArtifactInventory.map((item) => item.artifactId));
  for (const reference of action.evidenceReferences) assert.equal(visibleEvidence.has(reference), true, `unsupported evidence reference ${reference}`);
  const knownMemory = new Set(memoryIds);
  for (const reference of action.memoryReferences) assert.equal(knownMemory.has(reference), true, `missing memory provenance ${reference}`);
  for (const forbidden of ["shellCommand", "command", "productionExecution", "providerRequest", "consentAuthority", "reservationAuthority"]) {
    assert.equal(Object.hasOwn(action.details, forbidden), false, `free-form or prohibited action field ${forbidden}`);
  }
  validateDetails(action);
  const core = structuredClone(action); delete core.contentHash;
  assert.equal(sha256Json(core), action.contentHash, "executive action content hash differs");
  return Object.freeze({ accepted: true, actionId: action.actionId, actionType: action.actionType, actionHash: action.contentHash });
}

export function createBrokerRejection(action, reasonCode) {
  const core = {
    schemaVersion: "1.0",
    receiptType: "EXECUTIVE_ACTION_BROKER_REJECTION",
    actionDigest: sha256Json(action),
    reasonCode,
    accepted: false
  };
  return seal(core, "receiptHash");
}
