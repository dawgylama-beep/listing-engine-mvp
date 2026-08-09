import assert from "node:assert/strict";
import path from "node:path";
import { sha256Json } from "./protocol.mjs";
import { readJsonStrictFile, writeResultFile } from "./execution-store.mjs";
import { validateContinuationScope } from "./continuation-scope.mjs";
import { validateTerminalFailureReceipt } from "./post-handler-reconciliation-protocol.mjs";

export const COMPOSITE_MANIFEST_TYPE = "PHASE_7C_UNSCORED_COMPOSITE_EVIDENCE_MANIFEST";
export const COMPOSITE_STATE = "COMPLETE_WITH_25_COGNITIVE_RESULTS_AND_1_INFRASTRUCTURE_FAILURE";
export const COMPOSITE_RELATIVE_PATH = "composite-unscored-evidence-manifest.json";

const HASH = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{7,95}$/;
const REQUEST_ID = /^V2-RUN-(?:00[1-9]|01[0-9]|02[0-6])$/;
const FIELDS = Object.freeze([
  "schemaVersion", "manifestType", "compositeId", "benchmarkId", "completeFrozenAggregateHash",
  "freezeRequestAggregateHash", "version1121TerminalFailureReceiptId", "version1121TerminalFailureReceiptHash",
  "version1121TerminalFailureTreeAggregate", "version1121ResultRootName", "version1122ExecutionReleaseRecordHash",
  "version1122LaunchScopeHash", "version1122ContinuationScopeHash", "version1122ConsentHash",
  "version1122InvocationId", "version1122ResultId", "version1122ResultRootName", "version1122ManifestHash",
  "version1122ResultTreeAggregate", "orderedRequestDispositions", "cognitiveResultCount",
  "infrastructureFailureCount", "handlerInvocationCount", "providerAttemptCount", "physicalProviderAttemptCount",
  "providerReportedUsageRecordCount", "actualBilledCostStatus", "knownActualCost", "conservativeAccountedCost",
  "maximumCumulativePhysicalAttempts", "maximumCumulativeCost", "evaluatorOnlyOriginalsLoaded",
  "privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "diagnosisPerformed",
  "lessonPromotionPerformed", "state", "manifestHash"
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
    version1122ExecutionReleaseRecordHash: input.version1122ExecutionReleaseRecordHash,
    version1122LaunchScopeHash: input.version1122LaunchScopeHash,
    version1122ContinuationScopeHash: input.version1122ContinuationScopeHash,
    version1122ManifestHash: input.version1122ManifestHash
  };
}

export function createCompositeEvidenceManifest({
  frozen,
  terminalFailureReceipt,
  terminalFailureTreeAggregate,
  continuationScope,
  launchScope,
  consent,
  resultManifest,
  ledger,
  handlerReturnedReceipts
}) {
  validateTerminalFailureReceipt(terminalFailureReceipt);
  validateContinuationScope(continuationScope, frozen);
  assert.equal(continuationScope.terminalFailureReceiptHash, terminalFailureReceipt.receiptHash);
  assert.equal(launchScope.continuationScopeHash, continuationScope.continuationScopeHash);
  assert.equal(consent.launchScopeHash, launchScope.launchScopeHash);
  assert.equal(resultManifest.launchScopeHash, launchScope.launchScopeHash);
  assert.equal(resultManifest.requestedCount, 25);
  assert.equal(resultManifest.terminalCount, 25);
  assert.equal(resultManifest.executionIntegrityFailureCount, 0);
  assert.deepEqual(resultManifest.orderedResponseHashInventory.map((item) => item.analysisId), continuationScope.orderedRequestIds);
  assert.deepEqual(handlerReturnedReceipts.map((item) => item.requestId), continuationScope.orderedRequestIds);
  const orderedRequestDispositions = [
    {
      analysisId: "V2-RUN-001",
      disposition: "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY",
      cognitiveResultAvailable: false,
      replayPermitted: false,
      sourceVersion: "1.12.21",
      terminalEvidenceHash: terminalFailureReceipt.receiptHash,
      terminalResultRecordHash: null
    },
    ...resultManifest.orderedResponseHashInventory.map((item) => ({
      analysisId: item.analysisId,
      disposition: "COGNITIVE_RESULT_AVAILABLE_UNSCORED",
      cognitiveResultAvailable: true,
      replayPermitted: false,
      sourceVersion: "1.12.22",
      terminalEvidenceHash: item.canonicalResponseHash,
      terminalResultRecordHash: item.recordHash
    }))
  ];
  const input = {
    benchmarkId: frozen.manifest.benchmarkId,
    completeFrozenAggregateHash: frozen.manifest.completeFrozenAggregateHash,
    freezeRequestAggregateHash: frozen.manifest.requestAggregateHash,
    version1121TerminalFailureReceiptId: terminalFailureReceipt.receiptId,
    version1121TerminalFailureReceiptHash: terminalFailureReceipt.receiptHash,
    version1121TerminalFailureTreeAggregate: terminalFailureTreeAggregate,
    version1121ResultRootName: terminalFailureReceipt.sourceResultRootName,
    version1122ExecutionReleaseRecordHash: launchScope.executionReleaseRecordHash,
    version1122LaunchScopeHash: launchScope.launchScopeHash,
    version1122ContinuationScopeHash: continuationScope.continuationScopeHash,
    version1122ConsentHash: consent.consentHash,
    version1122InvocationId: consent.invocationId,
    version1122ResultId: consent.resultId,
    version1122ResultRootName: consent.resultRootName,
    version1122ManifestHash: resultManifest.manifestHash,
    version1122ResultTreeAggregate: resultManifest.resultTreeAggregate,
    orderedRequestDispositions,
    cognitiveResultCount: 25,
    infrastructureFailureCount: 1,
    handlerInvocationCount: 1 + handlerReturnedReceipts.length,
    providerAttemptCount: terminalFailureReceipt.providerAttemptCount + handlerReturnedReceipts.reduce((total, item) => total + item.providerAttemptCount, 0),
    physicalProviderAttemptCount: terminalFailureReceipt.physicalProviderAttemptCount + handlerReturnedReceipts.reduce((total, item) => total + item.physicalProviderAttemptCount, 0),
    providerReportedUsageRecordCount: terminalFailureReceipt.providerReportedUsageRecordCount + ledger.actualProviderReportedUsage.length,
    actualBilledCostStatus: "UNKNOWN",
    knownActualCost: null,
    conservativeAccountedCost: Number((continuationScope.priorConservativeCost + ledger.actualCalculatedCost).toFixed(8)),
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
  const core = { schemaVersion: "1.0", manifestType: COMPOSITE_MANIFEST_TYPE, compositeId, ...input };
  const manifest = Object.freeze({ ...core, manifestHash: sha256Json(core) });
  validateCompositeEvidenceManifest(manifest);
  return manifest;
}

export function validateCompositeEvidenceManifest(manifest, bindings = {}) {
  exactKeys(manifest, FIELDS, "composite evidence manifest");
  assert.equal(manifest.schemaVersion, "1.0");
  assert.equal(manifest.manifestType, COMPOSITE_MANIFEST_TYPE);
  assert.match(manifest.compositeId || "", /^composite-[a-f0-9]{48}$/);
  assert.equal(manifest.benchmarkId, "blind-object-v2");
  for (const field of [
    "completeFrozenAggregateHash", "freezeRequestAggregateHash", "version1121TerminalFailureReceiptHash",
    "version1121TerminalFailureTreeAggregate", "version1122ExecutionReleaseRecordHash", "version1122LaunchScopeHash",
    "version1122ContinuationScopeHash", "version1122ConsentHash", "version1122ManifestHash",
    "version1122ResultTreeAggregate", "manifestHash"
  ]) assert.match(manifest[field] || "", HASH, `${field} is invalid`);
  assert.match(manifest.version1121TerminalFailureReceiptId || "", /^terminal-failure-[a-f0-9]{48}$/);
  for (const field of ["version1121ResultRootName", "version1122InvocationId", "version1122ResultId", "version1122ResultRootName"]) assert.match(manifest[field] || "", SAFE_ID, `${field} is invalid`);
  assert.equal(manifest.orderedRequestDispositions.length, 26);
  assert.deepEqual(manifest.orderedRequestDispositions.map((item) => item.analysisId), Array.from({ length: 26 }, (_, index) => `V2-RUN-${String(index + 1).padStart(3, "0")}`));
  for (const [index, item] of manifest.orderedRequestDispositions.entries()) {
    exactKeys(item, ["analysisId", "disposition", "cognitiveResultAvailable", "replayPermitted", "sourceVersion", "terminalEvidenceHash", "terminalResultRecordHash"], `composite request disposition ${index + 1}`);
    assert.match(item.analysisId || "", REQUEST_ID);
    assert.equal(item.replayPermitted, false);
    assert.match(item.terminalEvidenceHash || "", HASH);
    if (index === 0) {
      assert.equal(item.disposition, "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY");
      assert.equal(item.cognitiveResultAvailable, false);
      assert.equal(item.sourceVersion, "1.12.21");
      assert.equal(item.terminalResultRecordHash, null);
    } else {
      assert.equal(item.disposition, "COGNITIVE_RESULT_AVAILABLE_UNSCORED");
      assert.equal(item.cognitiveResultAvailable, true);
      assert.equal(item.sourceVersion, "1.12.22");
      assert.match(item.terminalResultRecordHash || "", HASH);
    }
  }
  assert.equal(manifest.cognitiveResultCount, 25);
  assert.equal(manifest.infrastructureFailureCount, 1);
  assert.equal(manifest.handlerInvocationCount, 26);
  for (const field of ["providerAttemptCount", "physicalProviderAttemptCount", "providerReportedUsageRecordCount"]) assert.ok(Number.isInteger(manifest[field]) && manifest[field] >= 0, `${field} is invalid`);
  assert.ok(manifest.physicalProviderAttemptCount <= manifest.maximumCumulativePhysicalAttempts);
  assert.equal(manifest.actualBilledCostStatus, "UNKNOWN");
  assert.equal(manifest.knownActualCost, null);
  assert.ok(Number.isFinite(manifest.conservativeAccountedCost) && manifest.conservativeAccountedCost >= 0 && manifest.conservativeAccountedCost <= manifest.maximumCumulativeCost);
  assert.equal(manifest.maximumCumulativePhysicalAttempts, 832);
  assert.equal(manifest.maximumCumulativeCost, 40);
  for (const field of ["evaluatorOnlyOriginalsLoaded", "privateControlsLoaded", "scoringPerformed", "reflectionPerformed", "diagnosisPerformed", "lessonPromotionPerformed"]) assert.equal(manifest[field], false);
  assert.equal(manifest.state, COMPOSITE_STATE);
  assert.equal(manifest.compositeId, `composite-${sha256Json(identityCore(manifest)).slice(0, 48)}`);
  const core = structuredClone(manifest); delete core.manifestHash;
  assert.equal(sha256Json(core), manifest.manifestHash, "composite evidence manifest hash mismatch");
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
