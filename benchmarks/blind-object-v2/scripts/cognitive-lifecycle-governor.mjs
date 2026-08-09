import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";
import { COGNITIVE_LIFECYCLE_INVARIANT_CATALOG, consultLifecycleInvariant, validateInvariantCatalog } from "./cognitive-lifecycle-invariants.mjs";

export const COGNITIVE_LIFECYCLE_GOVERNOR_VERSION = "1.0";
export const LIFECYCLE_PHASE = Object.freeze({
  RELEASE_VERIFIED: "RELEASE_VERIFIED",
  PREFLIGHT_PASSED: "PREFLIGHT_PASSED",
  CONSENT_AUTHORIZED: "CONSENT_AUTHORIZED",
  RESERVATION_CREATED: "RESERVATION_CREATED",
  HANDLER_STARTED: "HANDLER_STARTED",
  HANDLER_RETURNED_QUARANTINED: "HANDLER_RETURNED_QUARANTINED",
  SANITIZATION_DECIDED: "SANITIZATION_DECIDED",
  TERMINAL_PERSISTED: "TERMINAL_PERSISTED",
  READBACK_VERIFIED: "READBACK_VERIFIED",
  COMPOSITE_SEALED: "COMPOSITE_SEALED",
  COGNITIVE_EVALUATION_READY: "COGNITIVE_EVALUATION_READY",
  STOPPED_NOVEL_CONDITION: "STOPPED_NOVEL_CONDITION"
});

const HASH = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

function node(nodeId, phase, requestId, ordinal) {
  return { nodeId, phase, requestId, ordinal, successorNodeId: null, terminal: phase === LIFECYCLE_PHASE.COGNITIVE_EVALUATION_READY };
}

export function createLifecycleTransitionManifest({ releaseRecordHash, consentId, invocationId, reservationId, resultId, resultRootName, orderedRequestIds }) {
  assert.match(releaseRecordHash || "", HASH);
  for (const value of [consentId, invocationId, reservationId, resultId, resultRootName]) assert.match(value || "", SAFE_ID);
  assert.ok(Array.isArray(orderedRequestIds) && orderedRequestIds.length >= 1 && orderedRequestIds.length <= 26);
  assert.equal(new Set(orderedRequestIds).size, orderedRequestIds.length);
  const nodes = [
    node("global:RELEASE_VERIFIED", LIFECYCLE_PHASE.RELEASE_VERIFIED, null, 1),
    node("global:PREFLIGHT_PASSED", LIFECYCLE_PHASE.PREFLIGHT_PASSED, null, 2),
    node("global:CONSENT_AUTHORIZED", LIFECYCLE_PHASE.CONSENT_AUTHORIZED, null, 3),
    node("global:RESERVATION_CREATED", LIFECYCLE_PHASE.RESERVATION_CREATED, null, 4)
  ];
  for (const requestId of orderedRequestIds) {
    for (const phase of [
      LIFECYCLE_PHASE.HANDLER_STARTED,
      LIFECYCLE_PHASE.HANDLER_RETURNED_QUARANTINED,
      LIFECYCLE_PHASE.SANITIZATION_DECIDED,
      LIFECYCLE_PHASE.TERMINAL_PERSISTED,
      LIFECYCLE_PHASE.READBACK_VERIFIED
    ]) nodes.push(node(`${requestId}:${phase}`, phase, requestId, nodes.length + 1));
  }
  nodes.push(node("global:COMPOSITE_SEALED", LIFECYCLE_PHASE.COMPOSITE_SEALED, null, nodes.length + 1));
  nodes.push(node("global:COGNITIVE_EVALUATION_READY", LIFECYCLE_PHASE.COGNITIVE_EVALUATION_READY, null, nodes.length + 1));
  for (let index = 0; index < nodes.length - 1; index += 1) nodes[index].successorNodeId = nodes[index + 1].nodeId;
  const transitionRecords = nodes.slice(0, -1).map((entry) => ({
    fromNodeId: entry.nodeId,
    toNodeId: entry.successorNodeId,
    guard: "OBSERVED_EVIDENCE_SATISFIES_PHASE_INVARIANT",
    stoppedSuccessorNodeId: "terminal:STOPPED_NOVEL_CONDITION"
  }));
  const core = {
    schemaVersion: "1.0",
    manifestType: "COGNITIVE_LIFECYCLE_TRANSITION_MANIFEST",
    governorVersion: COGNITIVE_LIFECYCLE_GOVERNOR_VERSION,
    releaseRecordHash,
    consentId,
    invocationId,
    reservationId,
    resultId,
    resultRootName,
    orderedRequestIds: [...orderedRequestIds],
    nodes,
    transitionRecords,
    stoppedTerminalNode: {
      nodeId: "terminal:STOPPED_NOVEL_CONDITION",
      phase: LIFECYCLE_PHASE.STOPPED_NOVEL_CONDITION,
      terminal: true,
      successorNodeId: null
    },
    invariantCatalogHash: COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.catalogHash
  };
  const manifest = Object.freeze({ ...core, manifestHash: sha256Json(core) });
  validateLifecycleTransitionManifest(manifest);
  return manifest;
}

export function validateLifecycleTransitionManifest(manifest) {
  assert.equal(manifest.schemaVersion, "1.0");
  assert.equal(manifest.manifestType, "COGNITIVE_LIFECYCLE_TRANSITION_MANIFEST");
  assert.equal(manifest.governorVersion, COGNITIVE_LIFECYCLE_GOVERNOR_VERSION);
  assert.match(manifest.releaseRecordHash || "", HASH);
  assert.match(manifest.manifestHash || "", HASH);
  validateInvariantCatalog();
  assert.equal(manifest.invariantCatalogHash, COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.catalogHash);
  assert.equal(new Set(manifest.nodes.map((entry) => entry.nodeId)).size, manifest.nodes.length);
  assert.deepEqual(manifest.nodes.map((entry) => entry.ordinal), manifest.nodes.map((_, index) => index + 1));
  for (const [index, entry] of manifest.nodes.entries()) {
    assert.equal(entry.terminal, index === manifest.nodes.length - 1);
    assert.equal(entry.successorNodeId, index === manifest.nodes.length - 1 ? null : manifest.nodes[index + 1].nodeId);
    if (entry.requestId) assert.equal(manifest.orderedRequestIds.includes(entry.requestId), true);
  }
  assert.equal(manifest.transitionRecords.length, manifest.nodes.length - 1);
  for (const [index, transition] of manifest.transitionRecords.entries()) {
    assert.equal(transition.fromNodeId, manifest.nodes[index].nodeId);
    assert.equal(transition.toNodeId, manifest.nodes[index + 1].nodeId);
    assert.equal(transition.stoppedSuccessorNodeId, manifest.stoppedTerminalNode.nodeId);
    assert.ok(manifest.nodes[index + 1].ordinal > manifest.nodes[index].ordinal, "lifecycle graph is cyclic or backward");
  }
  assert.equal(manifest.stoppedTerminalNode.terminal, true);
  assert.equal(manifest.stoppedTerminalNode.successorNodeId, null);
  const copy = structuredClone(manifest); delete copy.manifestHash;
  assert.equal(sha256Json(copy), manifest.manifestHash);
  return Object.freeze({ valid: true, manifestHash: manifest.manifestHash, nodeCount: manifest.nodes.length, acyclic: true });
}

function validateIdentityBindings(manifest, identities) {
  for (const field of ["consentId", "invocationId", "reservationId", "resultId", "resultRootName"]) assert.equal(identities[field], manifest[field], `governor ${field} binding differs`);
  assert.equal(identities.releaseRecordHash, manifest.releaseRecordHash);
}

function createGovernorDecisionReceipt({ manifest, priorReceipts, toNodeId, observedEvidenceType, observedEvidence, identities, handlerResultHash = null, terminalResultHash = null, invariantDecision = null, decidedAt }) {
  validateLifecycleTransitionManifest(manifest);
  validateIdentityBindings(manifest, identities);
  assert.equal(new Date(decidedAt).toISOString(), decidedAt);
  const reconstructed = reconstructGovernorEpisode(manifest, priorReceipts);
  assert.equal(reconstructed.terminal, false, "terminal governor episode cannot advance");
  const fromNodeId = reconstructed.currentNodeId;
  const fromNode = manifest.nodes.find((entry) => entry.nodeId === fromNodeId);
  const isStopped = toNodeId === manifest.stoppedTerminalNode.nodeId;
  assert.equal(isStopped || toNodeId === fromNode.successorNodeId, true, `illegal governor successor ${fromNodeId} -> ${toNodeId}`);
  if (isStopped) assert.ok(invariantDecision, "stopped governor transition requires an invariant decision");
  if (invariantDecision) assert.match(invariantDecision.decisionHash || "", HASH);
  for (const value of [handlerResultHash, terminalResultHash]) assert.ok(value === null || HASH.test(value));
  const target = isStopped ? manifest.stoppedTerminalNode : manifest.nodes.find((entry) => entry.nodeId === toNodeId);
  const predecessorReceiptHash = priorReceipts.at(-1)?.receiptHash || null;
  const core = {
    schemaVersion: "1.0",
    receiptType: "COGNITIVE_LIFECYCLE_GOVERNOR_DECISION",
    governorVersion: COGNITIVE_LIFECYCLE_GOVERNOR_VERSION,
    transitionManifestHash: manifest.manifestHash,
    sequence: priorReceipts.length + 1,
    predecessorReceiptHash,
    fromNodeId,
    toNodeId,
    toPhase: target.phase,
    requestId: target.requestId || fromNode.requestId || null,
    decisionKind: isStopped ? "TERMINAL_STOP" : "MONOTONIC_FORWARD",
    observedEvidenceType,
    observedEvidenceDigest: sha256Json(observedEvidence),
    invariantFailureId: invariantDecision?.failureId || null,
    invariantDecisionHash: invariantDecision?.decisionHash || null,
    releaseRecordHash: identities.releaseRecordHash,
    consentId: identities.consentId,
    invocationId: identities.invocationId,
    reservationId: identities.reservationId,
    resultId: identities.resultId,
    resultRootName: identities.resultRootName,
    handlerResultHash,
    terminalResultHash,
    decidedAt
  };
  const receiptId = `governor-decision-${sha256Json(core).slice(0, 48)}`;
  const receipt = Object.freeze({ ...core, receiptId, receiptHash: sha256Json({ ...core, receiptId }) });
  validateGovernorDecisionReceipt(receipt, { manifest, priorReceipts });
  return receipt;
}

export function advanceGovernor({ manifest, priorReceipts, observedEvidenceType, observedEvidence, identities, handlerResultHash = null, terminalResultHash = null, invariantDecision = null, decidedAt }) {
  const episode = reconstructGovernorEpisode(manifest, priorReceipts);
  assert.equal(episode.terminal, false, "terminal governor episode cannot advance");
  const current = manifest.nodes.find((entry) => entry.nodeId === episode.currentNodeId);
  assert.ok(current?.successorNodeId, "current governor state has no forward successor");
  return createGovernorDecisionReceipt({
    manifest,
    priorReceipts,
    toNodeId: current.successorNodeId,
    observedEvidenceType,
    observedEvidence,
    identities,
    handlerResultHash,
    terminalResultHash,
    invariantDecision,
    decidedAt
  });
}

export function stopGovernor({ manifest, priorReceipts, observedEvidenceType, observedEvidence, identities, handlerResultHash = null, terminalResultHash = null, invariantDecision, decidedAt }) {
  return createGovernorDecisionReceipt({
    manifest,
    priorReceipts,
    toNodeId: manifest.stoppedTerminalNode.nodeId,
    observedEvidenceType,
    observedEvidence,
    identities,
    handlerResultHash,
    terminalResultHash,
    invariantDecision,
    decidedAt
  });
}

export function validateGovernorDecisionReceipt(receipt, { manifest, priorReceipts }) {
  validateLifecycleTransitionManifest(manifest);
  assert.equal(receipt.transitionManifestHash, manifest.manifestHash, "governor receipt transition manifest hash differs");
  assert.equal(receipt.sequence, priorReceipts.length + 1, "governor receipt sequence differs");
  assert.equal(receipt.predecessorReceiptHash, priorReceipts.at(-1)?.receiptHash || null, "governor receipt predecessor hash differs");
  assert.match(receipt.receiptId || "", /^governor-decision-[a-f0-9]{48}$/);
  assert.match(receipt.receiptHash || "", HASH);
  assert.equal(new Date(receipt.decidedAt).toISOString(), receipt.decidedAt);
  const core = structuredClone(receipt); delete core.receiptHash;
  assert.equal(sha256Json(core), receipt.receiptHash, "governor receipt hash differs");
  const withoutId = structuredClone(core); delete withoutId.receiptId;
  assert.equal(receipt.receiptId, `governor-decision-${sha256Json(withoutId).slice(0, 48)}`, "governor receipt identity hash differs");
  return true;
}

export function reconstructGovernorEpisode(manifest, receipts = []) {
  validateLifecycleTransitionManifest(manifest);
  assert.ok(Array.isArray(receipts));
  let currentNodeId = manifest.nodes[0].nodeId;
  const accepted = [];
  for (const receipt of receipts) {
    validateGovernorDecisionReceipt(receipt, { manifest, priorReceipts: accepted });
    assert.equal(receipt.fromNodeId, currentNodeId, "governor receipt predecessor state differs");
    const from = manifest.nodes.find((entry) => entry.nodeId === currentNodeId);
    const legal = receipt.toNodeId === from.successorNodeId || receipt.toNodeId === manifest.stoppedTerminalNode.nodeId;
    assert.equal(legal, true, "governor receipt selects an unknown, backward, or ambiguous successor");
    currentNodeId = receipt.toNodeId;
    accepted.push(receipt);
    if (currentNodeId === manifest.stoppedTerminalNode.nodeId) break;
  }
  assert.equal(accepted.length, receipts.length, "governor contains decisions after terminal stop");
  const terminal = currentNodeId === manifest.stoppedTerminalNode.nodeId || currentNodeId === manifest.nodes.at(-1).nodeId;
  return Object.freeze({
    valid: true,
    currentNodeId,
    currentPhase: currentNodeId === manifest.stoppedTerminalNode.nodeId ? manifest.stoppedTerminalNode.phase : manifest.nodes.find((entry) => entry.nodeId === currentNodeId).phase,
    terminal,
    receiptCount: receipts.length,
    decisionAggregateHash: sha256Json(receipts.map((receipt) => receipt.receiptHash))
  });
}

export function createBoundedRepairDossier({ manifest, receipts, sanitizerDecisionReceipt, quarantineReceipt, failureId, identities, createdAt }) {
  const invariantDecision = consultLifecycleInvariant(failureId, {
    quarantineVerified: Boolean(quarantineReceipt?.receiptHash),
    sourceCodeMutationRequired: true,
    policyMutationRequired: true,
    contractMatch: sanitizerDecisionReceipt?.rejectedLocations?.every((item) => item.registryContractId !== "NO_CONTRACT_MATCH") || false,
    credentialClassifierFired: sanitizerDecisionReceipt?.rejectedLocations?.some((item) => item.credentialShapeClassification !== "NONE") || false,
    publicPreimageRecomputed: false,
    identityBindingsVerified: true
  });
  const episode = reconstructGovernorEpisode(manifest, receipts);
  const core = {
    schemaVersion: "1.0",
    dossierType: "BOUNDED_COGNITIVE_LIFECYCLE_REPAIR_DOSSIER",
    governorVersion: COGNITIVE_LIFECYCLE_GOVERNOR_VERSION,
    transitionManifestHash: manifest.manifestHash,
    invariantCatalogHash: COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.catalogHash,
    invariantFailureId: failureId,
    invariantDecisionHash: invariantDecision.decisionHash,
    episodeCurrentNodeId: episode.currentNodeId,
    decisionAggregateHash: episode.decisionAggregateHash,
    sanitizerDecisionReceiptHash: sanitizerDecisionReceipt?.receiptHash || null,
    quarantineReceiptHash: quarantineReceipt?.receiptHash || null,
    releaseRecordHash: identities.releaseRecordHash,
    consentId: identities.consentId,
    invocationId: identities.invocationId,
    reservationId: identities.reservationId,
    resultId: identities.resultId,
    resultRootName: identities.resultRootName,
    rawHandlerContentIncluded: false,
    rawRejectedValuesIncluded: false,
    replayPermitted: false,
    automaticPatchPermitted: false,
    requiredHumanAuthority: "SEPARATE_NOVEL_CONDITION_REPAIR_STATION",
    createdAt
  };
  return Object.freeze({ ...core, dossierHash: sha256Json(core) });
}
