import assert from "node:assert/strict";
import path from "node:path";
import { defaultResultHistoryRoot, readJsonStrictFile } from "./execution-store.mjs";
import { sha256Json } from "./protocol.mjs";
import { validateHandlerReturnedReceipt, validatePostHandlerFailureManifest, validatePostHandlerFailureValidation } from "./post-handler-durability-protocol.mjs";

export const VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH = "f1074a67e5898493a2c5b4022ae2157635f653fdafe093be64cd4593a7867558";
export const VERSION_1_12_23_RUNTIME_HEAD = "f9dd41d3584d7c9e93f277f33aec9ee4aa60eed8";
export const VERSION_1_12_23_QUALIFICATION_HEAD = "3be826cf63b45091f28028f16dd1b61c3ee32234";
export const VERSION_1_12_23_RESULT_ROOT_NAME = "result-root-1b8675557a5c786630a1f72ea5e157236cbdc4d9bacec149";
export const VERSION_1_12_23_FAILURE_MANIFEST_HASH = "293df49344343a188bb45a8f67e65c8ec853b436df24913d91b27fd62b8824ee";
export const VERSION_1_12_23_FAILURE_VALIDATION_HASH = "f845146b25022e560460908577b5ce468e998e63653adf4a8f340e6230b0781b";
export const VERSION_1_12_23_HANDLER_RECEIPT_HASH = "87fde8abf1eaba9c05bbfa9fd7fb7088f753272c0e08da55b24cc2db5ba108a2";
export const VERSION_1_12_23_FAILURE_EVIDENCE_HASH = "22fea392e913b3c028fb4e97bba94249937593db9127b9505e4004c37f6633ff";
export const VERSION_1_12_23_REQUEST_ID = "V2-RUN-002";

const HASH = /^[a-f0-9]{64}$/;

export function validateVersion1123FailureEvidence(evidence) {
  assert.equal(evidence.schemaVersion, "1.0");
  assert.equal(evidence.evidenceType, "IMMUTABLE_VERSION_1_12_23_POST_HANDLER_FAILURE_EVIDENCE");
  assert.equal(evidence.executionReleaseRecordHash, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(evidence.executorRuntimeHead, VERSION_1_12_23_RUNTIME_HEAD);
  assert.equal(evidence.qualificationHead, VERSION_1_12_23_QUALIFICATION_HEAD);
  assert.equal(evidence.executorVersion, "1.12.23");
  assert.equal(evidence.resultRootName, VERSION_1_12_23_RESULT_ROOT_NAME);
  assert.equal(evidence.requestId, VERSION_1_12_23_REQUEST_ID);
  assert.equal(evidence.failureManifestHash, VERSION_1_12_23_FAILURE_MANIFEST_HASH);
  assert.equal(evidence.failureValidationHash, VERSION_1_12_23_FAILURE_VALIDATION_HASH);
  assert.equal(evidence.handlerReturnedReceiptHash, VERSION_1_12_23_HANDLER_RECEIPT_HASH);
  assert.equal(evidence.handlerInvocationCount, 1);
  assert.equal(evidence.physicalProviderAttemptCount, 7);
  assert.equal(evidence.cumulativeHistoricalHandlerInvocationCount, 2);
  assert.equal(evidence.cumulativeHistoricalPhysicalAttemptCount, 16);
  assert.equal(evidence.cumulativeHistoricalConservativeCost, 3.0136471);
  assert.equal(evidence.cognitiveResultRecoverable, false);
  assert.equal(evidence.replayPermitted, false);
  assert.equal(evidence.disposition, "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY");
  assert.match(evidence.evidenceHash || "", HASH);
  assert.equal(evidence.evidenceHash, VERSION_1_12_23_FAILURE_EVIDENCE_HASH);
  const core = structuredClone(evidence); delete core.evidenceHash;
  assert.equal(sha256Json(core), evidence.evidenceHash);
  return Object.freeze({ valid: true, evidenceHash: evidence.evidenceHash });
}

export async function loadVersion1123FailureEvidence(resultHistoryRoot = defaultResultHistoryRoot) {
  const root = path.join(resultHistoryRoot, VERSION_1_12_23_RESULT_ROOT_NAME);
  const [profile, manifest, validation, handlerReceipt] = await Promise.all([
    readJsonStrictFile(path.join(root, "execution-profile.json")),
    readJsonStrictFile(path.join(root, "terminal-failure-manifest.json")),
    readJsonStrictFile(path.join(root, "terminal-failure-validation-report.json")),
    readJsonStrictFile(path.join(root, "handler-returned", `${VERSION_1_12_23_REQUEST_ID}.json`))
  ]);
  validatePostHandlerFailureManifest(manifest);
  validatePostHandlerFailureValidation(validation, manifest);
  validateHandlerReturnedReceipt(handlerReceipt);
  assert.equal(profile.executionReleaseRecordHash, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(profile.executorRuntimeHead, VERSION_1_12_23_RUNTIME_HEAD);
  assert.equal(profile.qualificationHead, VERSION_1_12_23_QUALIFICATION_HEAD);
  assert.equal(profile.executorVersion, "1.12.23");
  assert.equal(manifest.manifestHash, VERSION_1_12_23_FAILURE_MANIFEST_HASH);
  assert.equal(validation.validationHash, VERSION_1_12_23_FAILURE_VALIDATION_HASH);
  assert.equal(handlerReceipt.receiptHash, VERSION_1_12_23_HANDLER_RECEIPT_HASH);
  const core = {
    schemaVersion: "1.0",
    evidenceType: "IMMUTABLE_VERSION_1_12_23_POST_HANDLER_FAILURE_EVIDENCE",
    executionReleaseRecordHash: profile.executionReleaseRecordHash,
    executorRuntimeHead: profile.executorRuntimeHead,
    qualificationHead: profile.qualificationHead,
    executorVersion: profile.executorVersion,
    resultRootName: manifest.resultRootName,
    resultId: manifest.resultId,
    invocationId: manifest.invocationId,
    consentHash: manifest.consentHash,
    requestId: manifest.requestId,
    requestHash: handlerReceipt.requestHash,
    failureManifestHash: manifest.manifestHash,
    failureValidationHash: validation.validationHash,
    handlerReturnedReceiptHash: handlerReceipt.receiptHash,
    canonicalHandlerResultHash: handlerReceipt.canonicalHandlerResultHash,
    handlerInvocationCount: manifest.handlerInvocationCount,
    physicalProviderAttemptCount: manifest.physicalProviderAttemptCount,
    conservativeConsumedCost: manifest.conservativeConsumedCost,
    cumulativeHistoricalHandlerInvocationCount: 2,
    cumulativeHistoricalPhysicalAttemptCount: 16,
    cumulativeHistoricalConservativeCost: 3.0136471,
    cognitiveResultRecoverable: false,
    replayPermitted: false,
    disposition: "INFRASTRUCTURE_LOST_COGNITIVE_RESULT_NO_REPLAY"
  };
  const evidence = Object.freeze({ ...core, evidenceHash: sha256Json(core) });
  validateVersion1123FailureEvidence(evidence);
  return evidence;
}
