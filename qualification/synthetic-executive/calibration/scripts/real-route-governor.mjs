import assert from "node:assert/strict";
import path from "node:path";
import { ExternalQualificationGovernor } from "../../scripts/qualification-governor.mjs";
import { readJson, sha256Json } from "../../scripts/protocol.mjs";
import { qualificationRoot, conservativeMaximumCostUsd } from "./real-route-profile.mjs";

const PERMITS = new WeakSet();

export function assertCalibrationInferencePermit(permit, { authorityHash, modelIdentity, completeSerializedRequestHash }) {
  assert.equal(PERMITS.has(permit), true, "direct provider inference outside the calibration governor is prohibited");
  assert.equal(permit.authorityHash, authorityHash);
  assert.equal(permit.modelIdentity, modelIdentity);
  assert.equal(permit.completeSerializedRequestHash, completeSerializedRequestHash);
  return true;
}

export class ExternalCalibrationGovernor {
  #inner;
  #profile;
  #authority;
  #clock;
  #reservation = null;
  #completed = false;

  constructor({ root, providerProfile, authority, clock }) {
    this.root = path.resolve(root);
    this.#profile = providerProfile;
    this.#authority = authority;
    this.#clock = clock;
    this.#inner = null;
  }

  async initialize() {
    const qualificationProfile = await readJson(path.join(qualificationRoot, "qualification-budget-profile.json"));
    this.#inner = await new ExternalQualificationGovernor({ root: this.root, profile: qualificationProfile, clock: this.#clock }).initialize();
    assert.equal((await this.#inner.entries()).length, 0, "calibration ledger must start empty");
    return this;
  }

  async reserveInference({ requestIdentity, promptByteCount }) {
    assert.equal(this.#reservation, null, "calibration inference reservation already exists");
    assert.match(requestIdentity || "", /^[a-f0-9]{64}$/);
    assert.ok(promptByteCount <= this.#profile.ceilings.maximumPromptBytes, "calibration prompt byte ceiling exceeded");
    const calculatedMaximumCostUsd = conservativeMaximumCostUsd(promptByteCount, this.#profile);
    assert.ok(calculatedMaximumCostUsd <= this.#profile.ceilings.maximumProviderCostUsd, "calibration conservative maximum exceeds authority");
    const reservation = await this.#inner.reserve({
      caseId: "KE-CAL-001", stepType: "EXECUTIVE_REASONING", operationHash: requestIdentity,
      modelOrToolIdentity: this.#profile.exactModelId, maximumCostReservationUsd: this.#profile.ceilings.maximumProviderCostUsd,
      maximumResourceAllowance: {
        authorityHash: this.#authority.authorityHash, singleUseIdentity: this.#authority.singleUseIdentity, requestIdentity,
        completeSerializedRequestHash: this.#authority.completeSerializedRequestHash || null,
        maximumInputTokens: promptByteCount, inputTokenCeiling: this.#profile.ceilings.maximumConservativeInputTokens,
        maximumOutputTokens: this.#profile.ceilings.maximumOutputTokens, timeoutMs: this.#profile.timeoutMs,
        maximumInferenceRequests: 1, maximumRetries: 0, maximumToolCalls: 0, maximumWorkerDispatches: 0,
        calculatedMaximumCostUsd
      },
      retryOfOperationHash: null
    });
    const permit = Object.freeze({
      reservationId: reservation.reservationId,
      reservationHash: reservation.entryHash,
      authorityHash: this.#authority.authorityHash,
      modelIdentity: this.#profile.exactModelId,
      requestIdentity,
      completeSerializedRequestHash: this.#authority.completeSerializedRequestHash || null
    });
    PERMITS.add(permit); this.#reservation = reservation;
    return Object.freeze({ reservation, permit, calculatedMaximumCostUsd });
  }

  async completeInference({ usage, actualCostUsd, durationMs, resultStatus, brokerDisposition, safeResponseHash }) {
    assert.ok(this.#reservation && !this.#completed, "calibration reservation cannot be completed");
    assert.ok(durationMs >= 0);
    const completeUsage = usage?.complete === true;
    const actualUsage = completeUsage ? {
      inputTokens: usage.inputTokens, cachedInputTokens: usage.cachedInputTokens, outputTokens: usage.outputTokens,
      reasoningTokens: usage.reasoningTokens, totalTokens: usage.totalTokens, safeResponseHash,
      actionBrokerDisposition: brokerDisposition, inferenceRequestCount: 1, retryCount: 0, toolCallCount: 0, workerDispatchCount: 0
    } : null;
    const completion = await this.#inner.complete({
      reservationId: this.#reservation.reservationId, actualUsage,
      actualCostUsd: completeUsage ? actualCostUsd : null, durationMs, resultStatus,
      progressSignals: safeResponseHash && brokerDisposition === "ACCEPTED" ? ["REAL_PROVIDER_RESPONSE", "VALID_TYPED_ACTION"] : (safeResponseHash ? ["REAL_PROVIDER_RESPONSE"] : [])
    });
    this.#completed = true;
    return completion;
  }

  async verifyAccounting() {
    const entries = await this.#inner.entries();
    const accounting = await this.#inner.verifyRestartAccounting();
    const reservations = entries.filter((entry) => entry.entryType === "STEP_RESERVATION");
    const completions = entries.filter((entry) => entry.entryType === "STEP_COMPLETION");
    assert.ok(reservations.length <= 1 && completions.length <= 1);
    assert.equal(entries.some((entry) => entry.stepType === "TOOL" || entry.stepType === "ENGINEERING_WORKER"), false);
    if (reservations.length === 1) assert.equal(reservations[0].retryOfOperationHash, null);
    return Object.freeze({ ...accounting, reservationCount: reservations.length, completionCount: completions.length, reasoningStepCount: reservations.length, retryCount: 0, toolCallCount: 0, workerDispatchCount: 0, ledgerEntryAggregateHash: sha256Json(entries.map((entry) => entry.entryHash)) });
  }
}
