import assert from "node:assert/strict";
import path from "node:path";
import { sha256Json } from "./protocol.mjs";
import { readJsonStrictFile, writeResultFile } from "./execution-store.mjs";
import { validateContinuationScope } from "./continuation-scope.mjs";
import { validateTerminalFailureReceipt } from "./post-handler-reconciliation-protocol.mjs";
import { validateVersion1123FailureEvidence } from "./version1123-failure-evidence.mjs";

export const COMPOSITE_MANIFEST_TYPE = "PHASE_7C_COUNT_BEARING_UNSCORED_COMPOSITE_EVIDENCE_MANIFEST";
export const COMPOSITE_STATE = "COMPLETE_WITH_24_COGNITIVE_RESULTS_AND_2_INFRASTRUCTURE_FAILURES";
export const COMPOSITE_RELATIVE_PATH = "composite-unscored-evidence-manifest.json";

const HASH = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,95}$/;
const REQUEST_ID = /^V2-RUN-(?:00[1-9]|01[0-9]|02[0-6])$/;
const FIELDS = Object.freeze([
  "schemaVersion", "manifestType", "compositeId", "benchmarkId", "completeFrozenAggregateHash", "freezeRequestAggregateHash",
  "totalFrozenRequestCount", "version1121TerminalFailureReceiptId", "version1121TerminalFailureReceiptHash", "version1121TerminalFailureTreeAggregate",
  "version1123FailureEvidenceHash", "version1124ExecutionReleaseRecordHash", "version1124LaunchScopeHash", "version1124ContinuationScopeHash",
  "version1124ConsentHash", "version1124InvocationId", "version1124ResultId", "version1124ResultRootName", "version1124ManifestHash",
  "version1124ResultTreeAggregate", "lifecycleTransitionManifestHash", "lifecycleInvariantCatalogHash", "governorDecisionAggregateHash",
  "orderedRequestDispositions", "cognitiveResultCount", "infrastructureFailureCount", "notSubmittedCount", "handlerInvocationCount",
  "providerAttemptCount", "physicalProviderAttemptCount", "providerReportedUsageRecordCount", "actualBilledCostStatus", "knownActualCost",
  "conservativeAccountedCost", "remainingPhysicalAttemptBalance", "remainingConservativeCostBalance", "maximumCumulativePhysicalAttempts",
  "maximumCumulativeCost", "evaluatorOnlyOriginalsLoaded", "privateControlsLoaded", "scoringPerformed", "reflectionPerformed",
  "diagnosisPerformed", "lessonPromotionPerformed", "state", "manifestHash"
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function identityCore(input) {
  return {
    manifestType: COMPOSITE_MANIFEST_TYPE,
    completeFrozenAggregateHash: input.completeFrozenAggregateHash,
    version1121TerminalFailureReceiptHash: input.version1121TerminalFailureReceiptHash,
    version1123FailureEvidenceHash: input.version1123FailureEvidenceHash,
    version1124ExecutionReleaseRecordHash: input.version1124ExecutionReleaseRecordHash,
    version1124LaunchScopeHash: input.version1124LaunchScopeHash,
    version1124ManifestHash: input.version1124ManifestHash,
    lifecycleTransitionManifestHash: input.lifecycleTransitionManifestHash
  };
}

export function createCompositeEvidenceManifest({ frozen, terminalFailureReceipt, terminalFailureTreeAggregate, version1123FailureEvidence, continuationScope, launchScope, consent, resultManifest, ledger, handlerReturnedReceipts, lifecycleTransitionManifestHash, lifecycleInvariantCatalogHash, governorDecisionAggregateHash }) {
  validateTerminalFailureReceipt(terminalFailureReceipt);
  validateVersion1123FailureEvidence(version1123FailureEvidence);
  validateContinuationScope(continuationScope, frozen);
  assert.equal(continuationScope.version1123FailureEvidenceHash, version1123FailureEvidence.evidenceHash);
  assert.equal(resultManifest.requestedCount, 24);
  assert.equal(resultManifest.terminalCount, 24);
  assert.equal(resultManifest.notSubmittedCount, 0);
  assert.equal(resultManifest.executionIntegrityFailureCount, 0);
  assert.deepEqual(resultManifest.orderedResponseHashInventory.map((item) => item.analysisId), continuationScope.orderedRequestIds);
  assert.deepEqual(handlerReturnedReceipts.map((item) => item.requestId), continuationScope.orderedRequestIds);
  const orderedRequestDispositions = [
    { analysisId: "V2-RUN-001", disposition: "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY", cognitiveResultAvailable: false, replayPermitted: false, sourceVersion: "1.12.21", terminalEvidenceHash: terminalFailureReceipt.receiptHash, terminalResultRecordHash: null },
    { analysisId: "V2-RUN-002", disposition: "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY", cognitiveResultAvailable: false, replayPermitted: false, sourceVersion: "1.12.23", terminalEvidenceHash: version1123FailureEvidence.evidenceHash, terminalResultRecordHash: null },
    ...resultManifest.orderedResponseHashInventory.map((item) => ({ analysisId: item.analysisId, disposition: "COGNITIVE_RESULT_AVAILABLE_UNSCORED", cognitiveResultAvailable: true, replayPermitted: false, sourceVersion: "1.12.24", terminalEvidenceHash: item.canonicalResponseHash, terminalResultRecordHash: item.recordHash }))
  ];
  const currentPhysicalAttempts = handlerReturnedReceipts.reduce((total, item) => total + item.physicalProviderAttemptCount, 0);
  const conservativeAccountedCost = Number((continuationScope.priorConservativeCost + ledger.actualCalculatedCost).toFixed(8));
  const input = {
    benchmarkId: frozen.manifest.benchmarkId,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    freezeRequestAggregateHash: frozen.manifest.requestAggregateHash,
    totalFrozenRequestCount: 26,
    version1121TerminalFailureReceiptId: terminalFailureReceipt.receiptId,
    version1121TerminalFailureReceiptHash: terminalFailureReceipt.receiptHash,
    version1121TerminalFailureTreeAggregate: terminalFailureTreeAggregate,
    version1123FailureEvidenceHash: version1123FailureEvidence.evidenceHash,
    version1124ExecutionReleaseRecordHash: launchScope.executionReleaseRecordHash,
    version1124LaunchScopeHash: launchScope.launchScopeHash,
    version1124ContinuationScopeHash: continuationScope.continuationScopeHash,
    version1124ConsentHash: consent.consentHash,
    version1124InvocationId: consent.invocationId,
    version1124ResultId: consent.resultId,
    version1124ResultRootName: consent.resultRootName,
    version1124ManifestHash: resultManifest.manifestHash,
    version1124ResultTreeAggregate: resultManifest.resultTreeAggregate,
    lifecycleTransitionManifestHash,
    lifecycleInvariantCatalogHash,
    governorDecisionAggregateHash,
    orderedRequestDispositions,
    cognitiveResultCount: 24,
    infrastructureFailureCount: 2,
    notSubmittedCount: 0,
    handlerInvocationCount: 2 + handlerReturnedReceipts.length,
    providerAttemptCount: continuationScope.priorPhysicalAttemptCount + handlerReturnedReceipts.reduce((total, item) => total + item.providerAttemptCount, 0),
    physicalProviderAttemptCount: continuationScope.priorPhysicalAttemptCount + currentPhysicalAttempts,
    providerReportedUsageRecordCount: ledger.actualProviderReportedUsage.length,
    actualBilledCostStatus: "UNKNOWN",
    knownActualCost: null,
    conservativeAccountedCost,
    remainingPhysicalAttemptBalance: continuationScope.maximumCumulativePhysicalAttempts - continuationScope.priorPhysicalAttemptCount - currentPhysicalAttempts,
    remainingConservativeCostBalance: Number((continuationScope.maximumCumulativeCost - conservativeAccountedCost).toFixed(8)),
    maximumCumulativePhysicalAttempts: continuationScope.maximumCumulativePhysicalAttempts,
    maximumCumulativeCost: continuationScope.maximumCumulativeCost,
    evaluatorOnlyOriginalsLoaded: false,
    privateControlsLoaded: false,
    scoringPerformed: false,
    reflectionPerformed: false,
    diagnosisPerformed: false,
    lessonPromotionPerformed: false,
    state: COMPOSITE_STATE
  };
  const compositeId = `composite-${sha256Json(identityCore(input)).slice(0, 48)}`;
  const core = { schemaVersion: "2.0", manifestType: COMPOSITE_MANIFEST_TYPE, compositeId, ...input };
  const manifest = Object.freeze({ ...core, manifestHash: sha256Json(core) });
  validateCompositeEvidenceManifest(manifest);
  return manifest;
}

export function validateCompositeEvidenceManifest(manifest, bindings = {}) {
  exactKeys(manifest, FIELDS, "composite evidence manifest");
  assert.equal(manifest.schemaVersion, "2.0");
  assert.equal(manifest.manifestType, COMPOSITE_MANIFEST_TYPE);
  assert.match(manifest.compositeId || "", /^composite-[a-f0-9]{48}$/);
  for (const field of FIELDS.filter((field) => field.endsWith("Hash") || field.endsWith("Aggregate"))) assert.match(manifest[field] || "", HASH, `${field} is invalid`);
  assert.match(manifest.version1121TerminalFailureReceiptId || "", /^terminal-failure-[a-f0-9]{48}$/);
  for (const field of ["version1124InvocationId", "version1124ResultId", "version1124ResultRootName"]) assert.match(manifest[field] || "", SAFE_ID);
  assert.equal(manifest.totalFrozenRequestCount, 26);
  assert.equal(manifest.orderedRequestDispositions.length, 26);
  assert.deepEqual(manifest.orderedRequestDispositions.map((item) => item.analysisId), Array.from({ length: 26 }, (_, index) => `V2-RUN-${String(index + 1).padStart(3, "0")}`));
  for (const [index, item] of manifest.orderedRequestDispositions.entries()) {
    exactKeys(item, ["analysisId", "disposition", "cognitiveResultAvailable", "replayPermitted", "sourceVersion", "terminalEvidenceHash", "terminalResultRecordHash"], `request disposition ${index + 1}`);
    assert.match(item.analysisId || "", REQUEST_ID);
    assert.equal(item.replayPermitted, false);
    assert.match(item.terminalEvidenceHash || "", HASH);
    if (index < 2) {
      assert.equal(item.disposition, "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY");
      assert.equal(item.cognitiveResultAvailable, false);
      assert.equal(item.sourceVersion, index === 0 ? "1.12.21" : "1.12.23");
      assert.equal(item.terminalResultRecordHash, null);
    } else {
      assert.equal(item.disposition, "COGNITIVE_RESULT_AVAILABLE_UNSCORED");
      assert.equal(item.cognitiveResultAvailable, true);
      assert.equal(item.sourceVersion, "1.12.24");
      assert.match(item.terminalResultRecordHash || "", HASH);
    }
  }
  assert.equal(manifest.cognitiveResultCount, 24);
  assert.equal(manifest.infrastructureFailureCount, 2);
  assert.equal(manifest.notSubmittedCount, 0);
  assert.equal(manifest.handlerInvocationCount, 26);
  for (const field of ["providerAttemptCount", "physicalProviderAttemptCount", "providerReportedUsageRecordCount", "remainingPhysicalAttemptBalance"]) assert.ok(Number.isInteger(manifest[field]) && manifest[field] >= 0);
  assert.ok(manifest.physicalProviderAttemptCount <= 832);
  assert.equal(manifest.actualBilledCostStatus, "UNKNOWN");
  assert.equal(manifest.knownActualCost, null);
  assert.ok(Number.isFinite(manifest.conservativeAccountedCost) && manifest.conservativeAccountedCost <= 40);
  assert.ok(Number.isFinite(manifest.remainingConservativeCostBalance) && manifest.remainingConservativeCostBalance >= 0);
  assert.equal(manifest.maximumCumulativePhysicalAttempts, 832);
  assert.equal(manifest.maximumCumulativeCost, 40);
  for (const field of ["evaluatorOnlyOriginalsLoaded", "privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "diagnosisPerformed", "lessonPromotionPerformed"]) assert.equal(manifest[field], false);
  assert.equal(manifest.state, COMPOSITE_STATE);
  assert.equal(manifest.compositeId, `composite-${sha256Json(identityCore(manifest)).slice(0, 48)}`);
  const core = structuredClone(manifest); delete core.manifestHash;
  assert.equal(sha256Json(core), manifest.manifestHash);
  for (const [field, value] of Object.entries(bindings)) assert.deepEqual(manifest[field], value, `composite evidence ${field} mismatch`);
  return Object.freeze({ valid: true, manifestHash: manifest.manifestHash, state: manifest.state });
}

export async function sealCompositeEvidence(resultRoot, inputs) {
  const manifest = createCompositeEvidenceManifest(inputs);
  await writeResultFile(resultRoot, COMPOSITE_RELATIVE_PATH, manifest);
  const readback = await readJsonStrictFile(path.join(resultRoot, COMPOSITE_RELATIVE_PATH));
  validateCompositeEvidenceManifest(readback, { manifestHash: manifest.manifestHash });
  return Object.freeze(readback);
}
