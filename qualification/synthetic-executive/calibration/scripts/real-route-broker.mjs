import assert from "node:assert/strict";
import { createBrokerRejection, sealExecutiveAction, validateExecutiveAction } from "../../scripts/action-broker.mjs";
import { sha256Json } from "../../scripts/protocol.mjs";
import { observedStateHash } from "./real-route-profile.mjs";

const CORE_FIELDS = Object.freeze([
  "schemaVersion", "actionType", "actionId", "episodeId", "executiveState", "observedStateHash", "evidenceReferences",
  "memoryReferences", "factualFindings", "uncertainties", "confidence", "boundedRationaleSummary", "requestedSuccessorState",
  "authorityClass", "prohibitedOperations", "details"
]);
const PROHIBITED = Object.freeze(["PRODUCTION_EXECUTION", "BENCHMARK_EXECUTION", "SHELL", "GIT", "SOURCE_EDIT", "DEPLOYMENT", "PROVIDER_TOOL", "ENGINEERING_WORKER"]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

export function passCalibrationActionThroughRealBroker(actionCore, calibrationCase) {
  try {
    exactKeys(actionCore, CORE_FIELDS, "model-authored executive action core");
    assert.equal(actionCore.schemaVersion, "1.0");
    assert.equal(actionCore.actionType, "RECONSTRUCT_EPISODE");
    assert.equal(actionCore.actionId, "KE-CAL-001-ACTION-001");
    assert.equal(actionCore.episodeId, calibrationCase.episodeId);
    assert.equal(actionCore.executiveState, calibrationCase.executiveState);
    assert.equal(actionCore.observedStateHash, observedStateHash(calibrationCase));
    assert.deepEqual(actionCore.evidenceReferences, ["KE-CAL-001:EVIDENCE-001"]);
    assert.deepEqual(actionCore.memoryReferences, []);
    assert.equal(actionCore.requestedSuccessorState, "EPISODE_RECONSTRUCTED");
    assert.equal(actionCore.authorityClass, "NO_NEW_AUTHORITY");
    assert.deepEqual(actionCore.prohibitedOperations, PROHIBITED);
    assert.deepEqual(actionCore.details, {});
    const serialized = JSON.stringify(actionCore);
    for (const forbidden of ["providerRequest", "productionExecution", "benchmarkExecution", "shellCommand", "workerDispatch", "deployment", "evaluatorControl"]) assert.equal(serialized.includes(forbidden), false, `calibration action contains prohibited operation ${forbidden}`);
    const action = sealExecutiveAction(actionCore);
    const disposition = validateExecutiveAction(action, { episode: calibrationCase, memoryIds: [], currentState: calibrationCase.executiveState, allowedAuthorityClasses: ["NO_NEW_AUTHORITY"] });
    assert.equal(disposition.accepted, true);
    return Object.freeze({ accepted: true, action, disposition: "ACCEPTED", brokerActionHash: action.contentHash });
  } catch (error) {
    return Object.freeze({ accepted: false, action: null, disposition: "REJECTED", rejection: createBrokerRejection({ actionDigest: sha256Json(actionCore) }, "REAL_ROUTE_CALIBRATION_ACTION_REJECTED") });
  }
}
