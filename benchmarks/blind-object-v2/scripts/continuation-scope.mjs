import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";
import { validateTerminalFailureReceipt } from "./post-handler-reconciliation-protocol.mjs";
import {
  VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH,
  VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH,
  validateUnusedV11222ConsentRevocationReceipt
} from "./consent-revocation.mjs";
import { VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH, validateVersion1123FailureEvidence } from "./version1123-failure-evidence.mjs";

export const CONTINUATION_SCOPE_TYPE = "PHASE_7C_VERSION_1_12_24_COGNITIVE_GOVERNOR_CONTINUATION_SCOPE";
export const CONTINUATION_SCOPE_SCHEMA_VERSION = "1.2";
export const EXCLUDED_REQUEST_IDS = Object.freeze(["V2-RUN-001", "V2-RUN-002"]);
export const CONTINUATION_REQUEST_IDS = Object.freeze(Array.from({ length: 24 }, (_, index) => `V2-RUN-${String(index + 3).padStart(3, "0")}`));
export const PRIOR_PHYSICAL_ATTEMPTS = 16;
export const PRIOR_CONSERVATIVE_COST = 3.0136471;
export const MAXIMUM_CUMULATIVE_PHYSICAL_ATTEMPTS = 832;
export const MAXIMUM_CUMULATIVE_COST = 40;
export const REMAINING_PHYSICAL_ATTEMPT_AUTHORITY = 816;
export const REMAINING_CONSERVATIVE_COST_AUTHORITY = 36.9863529;
export const CONTINUATION_PHYSICAL_ATTEMPT_CEILING = 768;
export const CONTINUATION_CONSERVATIVE_MAXIMUM_COST = 36.16376522;
export const CUMULATIVE_CONSERVATIVE_MAXIMUM_COST = 39.17741232;

const HASH = /^[a-f0-9]{64}$/;
const FIELDS = Object.freeze([
  "schemaVersion", "scopeType", "completeFrozenAggregateHash", "freezeRequestAggregateHash",
  "historicalExecutionReleaseRecordHash", "predecessorExecutionReleaseRecordHash", "currentExecutionReleaseRecordHash",
  "immediatePredecessorExecutionReleaseRecordHash", "version1123FailureEvidenceHash",
  "releaseChainHash", "unusedConsentRevocationReceiptId", "unusedConsentRevocationReceiptHash",
  "terminalFailureReceiptId", "terminalFailureReceiptHash", "excludedRequests",
  "orderedRequestIds", "orderedRequestHashInventory", "continuationRequestAggregateHash",
  "priorPhysicalAttemptCount", "priorConservativeCost", "maximumCumulativePhysicalAttempts",
  "maximumCumulativeCost", "remainingPhysicalAttemptAuthority", "remainingConservativeCostAuthority",
  "continuationPhysicalAttemptCeiling", "continuationConservativeMaximumCost",
  "cumulativeConservativeMaximumCost", "authorizedRequestCount", "continuationScopeHash"
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

export function deriveContinuationRequests(frozen, scope) {
  validateContinuationScope(scope, frozen);
  const byId = new Map(frozen.requests.map((request) => [request.analysisId, request]));
  assert.equal(byId.size, 26, "continuation derivation requires the immutable 26-request freeze");
  const requests = scope.orderedRequestIds.map((analysisId) => {
    const request = byId.get(analysisId);
    assert.ok(request, `continuation request ${analysisId} is absent from the freeze`);
    return request;
  });
  assert.deepEqual(requests.map((request) => request.requestContractHash), scope.orderedRequestHashInventory);
  return Object.freeze(requests);
}

export function createContinuationScope({ frozen, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence, releaseChain }) {
  assert.equal(frozen?.requests?.length, 26, "continuation scope requires the immutable complete freeze");
  validateTerminalFailureReceipt(terminalFailureReceipt);
  validateUnusedV11222ConsentRevocationReceipt(unusedConsentRevocationReceipt);
  validateVersion1123FailureEvidence(version1123FailureEvidence);
  assert.equal(releaseChain?.version1121ExecutionReleaseRecordHash, VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(releaseChain?.version1122ExecutionReleaseRecordHash, VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(releaseChain?.version1123ExecutionReleaseRecordHash, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH);
  assert.match(releaseChain?.version1124ExecutionReleaseRecordHash || "", HASH);
  assert.match(releaseChain?.releaseChainHash || "", HASH);
  const byId = new Map(frozen.requests.map((request) => [request.analysisId, request]));
  assert.deepEqual(frozen.requests.map((request) => request.analysisId), [...EXCLUDED_REQUEST_IDS, ...CONTINUATION_REQUEST_IDS]);
  const orderedRequestHashInventory = CONTINUATION_REQUEST_IDS.map((analysisId) => byId.get(analysisId).requestContractHash);
  const core = {
    schemaVersion: CONTINUATION_SCOPE_SCHEMA_VERSION,
    scopeType: CONTINUATION_SCOPE_TYPE,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    freezeRequestAggregateHash: frozen.manifest.requestAggregateHash,
    historicalExecutionReleaseRecordHash: releaseChain.version1121ExecutionReleaseRecordHash,
    predecessorExecutionReleaseRecordHash: releaseChain.version1122ExecutionReleaseRecordHash,
    immediatePredecessorExecutionReleaseRecordHash: releaseChain.version1123ExecutionReleaseRecordHash,
    currentExecutionReleaseRecordHash: releaseChain.version1124ExecutionReleaseRecordHash,
    version1123FailureEvidenceHash: version1123FailureEvidence.evidenceHash,
    releaseChainHash: releaseChain.releaseChainHash,
    unusedConsentRevocationReceiptId: unusedConsentRevocationReceipt.receiptId,
    unusedConsentRevocationReceiptHash: unusedConsentRevocationReceipt.receiptHash,
    terminalFailureReceiptId: terminalFailureReceipt.receiptId,
    terminalFailureReceiptHash: terminalFailureReceipt.receiptHash,
    excludedRequests: EXCLUDED_REQUEST_IDS.map((analysisId) => ({ analysisId, disposition: "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY", replayPermitted: false })),
    orderedRequestIds: [...CONTINUATION_REQUEST_IDS],
    orderedRequestHashInventory,
    continuationRequestAggregateHash: sha256Json(CONTINUATION_REQUEST_IDS.map((analysisId, index) => ({ analysisId, requestContractHash: orderedRequestHashInventory[index] }))),
    priorPhysicalAttemptCount: PRIOR_PHYSICAL_ATTEMPTS,
    priorConservativeCost: PRIOR_CONSERVATIVE_COST,
    maximumCumulativePhysicalAttempts: MAXIMUM_CUMULATIVE_PHYSICAL_ATTEMPTS,
    maximumCumulativeCost: MAXIMUM_CUMULATIVE_COST,
    remainingPhysicalAttemptAuthority: REMAINING_PHYSICAL_ATTEMPT_AUTHORITY,
    remainingConservativeCostAuthority: REMAINING_CONSERVATIVE_COST_AUTHORITY,
    continuationPhysicalAttemptCeiling: CONTINUATION_PHYSICAL_ATTEMPT_CEILING,
    continuationConservativeMaximumCost: CONTINUATION_CONSERVATIVE_MAXIMUM_COST,
    cumulativeConservativeMaximumCost: CUMULATIVE_CONSERVATIVE_MAXIMUM_COST,
    authorizedRequestCount: 24
  };
  const scope = Object.freeze({ ...core, continuationScopeHash: sha256Json(core) });
  validateContinuationScope(scope, frozen);
  return scope;
}

export function validateContinuationScope(scope, frozen = null) {
  exactKeys(scope, FIELDS, "continuation scope");
  assert.equal(scope.schemaVersion, CONTINUATION_SCOPE_SCHEMA_VERSION);
  assert.equal(scope.scopeType, CONTINUATION_SCOPE_TYPE);
  for (const field of ["completeFrozenAggregateHash", "freezeRequestAggregateHash", "historicalExecutionReleaseRecordHash", "predecessorExecutionReleaseRecordHash", "immediatePredecessorExecutionReleaseRecordHash", "currentExecutionReleaseRecordHash", "version1123FailureEvidenceHash", "releaseChainHash", "unusedConsentRevocationReceiptHash", "terminalFailureReceiptHash", "continuationRequestAggregateHash", "continuationScopeHash"]) assert.match(scope[field] || "", HASH);
  assert.equal(scope.historicalExecutionReleaseRecordHash, VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(scope.predecessorExecutionReleaseRecordHash, VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(scope.immediatePredecessorExecutionReleaseRecordHash, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH);
  assert.notEqual(scope.currentExecutionReleaseRecordHash, scope.immediatePredecessorExecutionReleaseRecordHash);
  assert.match(scope.unusedConsentRevocationReceiptId || "", /^consent-revocation-[a-f0-9]{48}$/);
  assert.match(scope.terminalFailureReceiptId || "", /^terminal-failure-[a-f0-9]{48}$/);
  assert.deepEqual(scope.excludedRequests, EXCLUDED_REQUEST_IDS.map((analysisId) => ({ analysisId, disposition: "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY", replayPermitted: false })));
  assert.deepEqual(scope.orderedRequestIds, CONTINUATION_REQUEST_IDS);
  assert.equal(scope.orderedRequestHashInventory.length, 24);
  assert.equal(new Set(scope.orderedRequestHashInventory).size, 24);
  scope.orderedRequestHashInventory.forEach((hash) => assert.match(hash || "", HASH));
  assert.equal(scope.priorPhysicalAttemptCount, PRIOR_PHYSICAL_ATTEMPTS);
  assert.equal(scope.priorConservativeCost, PRIOR_CONSERVATIVE_COST);
  assert.equal(scope.maximumCumulativePhysicalAttempts, MAXIMUM_CUMULATIVE_PHYSICAL_ATTEMPTS);
  assert.equal(scope.maximumCumulativeCost, MAXIMUM_CUMULATIVE_COST);
  assert.equal(scope.remainingPhysicalAttemptAuthority, REMAINING_PHYSICAL_ATTEMPT_AUTHORITY);
  assert.equal(scope.remainingConservativeCostAuthority, REMAINING_CONSERVATIVE_COST_AUTHORITY);
  assert.equal(scope.continuationPhysicalAttemptCeiling, CONTINUATION_PHYSICAL_ATTEMPT_CEILING);
  assert.equal(scope.continuationConservativeMaximumCost, CONTINUATION_CONSERVATIVE_MAXIMUM_COST);
  assert.equal(scope.cumulativeConservativeMaximumCost, CUMULATIVE_CONSERVATIVE_MAXIMUM_COST);
  assert.equal(scope.priorPhysicalAttemptCount + scope.continuationPhysicalAttemptCeiling <= scope.maximumCumulativePhysicalAttempts, true);
  assert.equal(Number((scope.priorConservativeCost + scope.continuationConservativeMaximumCost).toFixed(8)), scope.cumulativeConservativeMaximumCost);
  assert.equal(scope.continuationConservativeMaximumCost <= scope.remainingConservativeCostAuthority, true);
  assert.equal(scope.authorizedRequestCount, 24);
  const core = structuredClone(scope); delete core.continuationScopeHash;
  assert.equal(sha256Json(core), scope.continuationScopeHash);
  if (frozen) {
    assert.equal(scope.completeFrozenAggregateHash, frozen.manifest.completeFrozenAggregateHash);
    assert.equal(scope.freezeRequestAggregateHash, frozen.manifest.requestAggregateHash);
    const byId = new Map(frozen.requests.map((request) => [request.analysisId, request]));
    assert.deepEqual(scope.orderedRequestHashInventory, scope.orderedRequestIds.map((analysisId) => byId.get(analysisId)?.requestContractHash));
    assert.equal(EXCLUDED_REQUEST_IDS.every((analysisId) => byId.has(analysisId)), true);
  }
  return Object.freeze({ valid: true, continuationScopeHash: scope.continuationScopeHash });
}
