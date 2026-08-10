import assert from "node:assert/strict";
import { mkdir, open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { canonicalIso, seal, sha256Json, stableJson } from "./protocol.mjs";

const ZERO_HASH = "0".repeat(64);
const STEP_TYPES = Object.freeze(["EXECUTIVE_REASONING", "TOOL", "ENGINEERING_WORKER"]);

async function fileExists(filePath) {
  try { await stat(filePath); return true; } catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

export function validateBudgetProfile(profile) {
  assert.equal(profile.schemaVersion, "1.0");
  assert.equal(profile.profileType, "SYNTHETIC_EXECUTIVE_QUALIFICATION_BUDGET");
  assert.equal(profile.perCase.maximumExecutiveReasoningSteps, 12);
  assert.equal(profile.perCase.maximumToolSteps, 20);
  assert.equal(profile.perCase.maximumTotalRetries, 2);
  assert.equal(profile.perCase.maximumIdenticalFailedOperationRetries, 1);
  assert.equal(profile.perCase.maximumEngineeringWorkerDispatches, 1);
  assert.equal(profile.perCase.maximumWallClockDurationMs, 600000);
  assert.equal(profile.perCase.maximumQualificationProviderCostUsd, 1.25);
  assert.equal(profile.perCase.noProgressConsecutiveStepCeiling, 2);
  assert.equal(profile.total.maximumExecutiveReasoningSteps, 120);
  assert.equal(profile.total.maximumToolSteps, 180);
  assert.equal(profile.total.maximumTotalRetries, 12);
  assert.equal(profile.total.maximumWallClockDurationMs, 7200000);
  assert.equal(profile.total.maximumQualificationProviderCostUsd, 12);
  const core = structuredClone(profile); delete core.profileHash;
  assert.equal(sha256Json(core), profile.profileHash, "budget profile hash differs");
  return true;
}

function validateLedgerChain(entries, profileHash) {
  let prior = ZERO_HASH;
  const reservations = new Map();
  for (const entry of entries) {
    assert.equal(entry.budgetProfileHash, profileHash);
    assert.equal(entry.priorLedgerHash, prior, "qualification ledger predecessor differs");
    const core = structuredClone(entry); delete core.entryHash;
    assert.equal(sha256Json(core), entry.entryHash, "qualification ledger entry hash differs");
    if (entry.entryType === "STEP_RESERVATION") {
      assert.equal(reservations.has(entry.reservationId), false, "duplicate step reservation");
      reservations.set(entry.reservationId, { reservation: entry, completion: null });
    } else if (entry.entryType === "STEP_COMPLETION") {
      const pair = reservations.get(entry.reservationId);
      assert.ok(pair && !pair.completion, "completion does not bind one open reservation");
      pair.completion = entry;
    } else {
      assert.equal(entry.entryType, "QUALIFICATION_TERMINATION");
    }
    prior = entry.entryHash;
  }
  return { priorLedgerHash: prior, reservations };
}

function costForPair(pair) {
  return pair.completion?.conservativeCostUsd ?? pair.reservation.maximumCostReservationUsd;
}

function summarize(entries, profileHash, caseId = null) {
  const chain = validateLedgerChain(entries, profileHash);
  const pairs = [...chain.reservations.values()].filter((pair) => caseId === null || pair.reservation.caseId === caseId);
  const reservations = pairs.map((pair) => pair.reservation);
  let noProgressTail = 0;
  for (const pair of [...pairs].reverse()) {
    if (!pair.completion || pair.completion.progress === true) break;
    noProgressTail += 1;
  }
  return {
    reasoningSteps: reservations.filter((item) => item.stepType === "EXECUTIVE_REASONING").length,
    toolSteps: reservations.filter((item) => item.stepType === "TOOL" || item.stepType === "ENGINEERING_WORKER").length,
    retries: reservations.filter((item) => item.retryOfOperationHash !== null).length,
    workerDispatches: reservations.filter((item) => item.stepType === "ENGINEERING_WORKER").length,
    conservativeCostUsd: Number(pairs.reduce((sum, pair) => sum + costForPair(pair), 0).toFixed(8)),
    activeReservations: pairs.filter((pair) => !pair.completion).length,
    firstStartedAt: reservations.at(0)?.startTime || null,
    noProgressTail
  };
}

export class ExternalQualificationGovernor {
  #clock;
  #activeChildren = new Set();

  constructor({ root, profile, clock = () => new Date().toISOString() }) {
    validateBudgetProfile(profile);
    this.root = path.resolve(root);
    this.profile = profile;
    this.ledgerPath = path.join(this.root, "qualification-ledger.ndjson");
    this.lockPath = path.join(this.root, ".qualification-ledger.lock");
    this.#clock = clock;
  }

  async initialize() {
    await mkdir(this.root, { recursive: true });
    return this;
  }

  async entries() {
    if (!await fileExists(this.ledgerPath)) return [];
    const text = await readFile(this.ledgerPath, "utf8");
    const entries = text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    validateLedgerChain(entries, this.profile.profileHash);
    return entries;
  }

  async #withLock(callback) {
    await mkdir(this.root, { recursive: true });
    let lock;
    try { lock = await open(this.lockPath, "wx", 0o600); } catch (error) {
      if (error?.code === "EEXIST") throw new Error("QUALIFICATION_LEDGER_CONCURRENT_OVERCOMMIT_BLOCKED");
      throw error;
    }
    try { return await callback(); } finally { await lock.close(); await import("node:fs/promises").then(({ unlink }) => unlink(this.lockPath).catch(() => {})); }
  }

  async #append(core) {
    const entries = await this.entries();
    const entry = seal({ ...core, budgetProfileHash: this.profile.profileHash, priorLedgerHash: entries.at(-1)?.entryHash || ZERO_HASH }, "entryHash");
    const handle = await open(this.ledgerPath, "a", 0o600);
    try { await handle.write(`${stableJson(entry)}\n`, null, "utf8"); await handle.sync(); } finally { await handle.close(); }
    return entry;
  }

  async #terminate(caseId, limitingDimension, observedValue, ceiling, at) {
    for (const child of this.#activeChildren) child.abort?.();
    this.#activeChildren.clear();
    return this.#append({
      schemaVersion: "1.0", entryType: "QUALIFICATION_TERMINATION", receiptType: "QUALIFICATION_LIMIT_TERMINATION",
      caseId, limitingDimension, observedValue, ceiling, allChildProcessesTerminated: true, terminatedAt: at
    });
  }

  async reserve({ caseId, stepType, operationHash, modelOrToolIdentity, maximumCostReservationUsd, maximumResourceAllowance, retryOfOperationHash = null }) {
    assert.ok(STEP_TYPES.includes(stepType));
    assert.ok(Number.isFinite(maximumCostReservationUsd) && maximumCostReservationUsd >= 0);
    const at = canonicalIso(this.#clock(), "reservation start time");
    return this.#withLock(async () => {
      const entries = await this.entries();
      assert.equal(entries.some((entry) => entry.entryType === "QUALIFICATION_TERMINATION" && entry.caseId === caseId), false, "qualification case is already terminated");
      const total = summarize(entries, this.profile.profileHash);
      const current = summarize(entries, this.profile.profileHash, caseId);
      const terminate = async (dimension, observed, ceiling) => {
        await this.#terminate(caseId, dimension, observed, ceiling, at);
        throw new Error(`QUALIFICATION_LIMIT_REACHED:${dimension}`);
      };
      if (total.activeReservations > 0) return terminate("CONCURRENT_OVERCOMMIT", total.activeReservations + 1, 1);
      const isReasoning = stepType === "EXECUTIVE_REASONING";
      const isTool = stepType === "TOOL" || stepType === "ENGINEERING_WORKER";
      if (isReasoning && current.reasoningSteps + 1 > this.profile.perCase.maximumExecutiveReasoningSteps) return terminate("PER_CASE_REASONING_STEPS", current.reasoningSteps + 1, this.profile.perCase.maximumExecutiveReasoningSteps);
      if (isTool && current.toolSteps + 1 > this.profile.perCase.maximumToolSteps) return terminate("PER_CASE_TOOL_STEPS", current.toolSteps + 1, this.profile.perCase.maximumToolSteps);
      if (isReasoning && total.reasoningSteps + 1 > this.profile.total.maximumExecutiveReasoningSteps) return terminate("TOTAL_REASONING_STEPS", total.reasoningSteps + 1, this.profile.total.maximumExecutiveReasoningSteps);
      if (isTool && total.toolSteps + 1 > this.profile.total.maximumToolSteps) return terminate("TOTAL_TOOL_STEPS", total.toolSteps + 1, this.profile.total.maximumToolSteps);
      if (retryOfOperationHash && current.retries + 1 > this.profile.perCase.maximumTotalRetries) return terminate("PER_CASE_RETRIES", current.retries + 1, this.profile.perCase.maximumTotalRetries);
      if (retryOfOperationHash && total.retries + 1 > this.profile.total.maximumTotalRetries) return terminate("TOTAL_RETRIES", total.retries + 1, this.profile.total.maximumTotalRetries);
      if (stepType === "ENGINEERING_WORKER" && current.workerDispatches + 1 > this.profile.perCase.maximumEngineeringWorkerDispatches) return terminate("PER_CASE_WORKER_DISPATCHES", current.workerDispatches + 1, this.profile.perCase.maximumEngineeringWorkerDispatches);
      const pairs = validateLedgerChain(entries, this.profile.profileHash).reservations;
      const identicalRetries = [...pairs.values()].filter((pair) => pair.reservation.caseId === caseId && pair.reservation.retryOfOperationHash === operationHash).length;
      if (retryOfOperationHash === operationHash && identicalRetries + 1 > this.profile.perCase.maximumIdenticalFailedOperationRetries) return terminate("IDENTICAL_FAILED_OPERATION_RETRIES", identicalRetries + 1, this.profile.perCase.maximumIdenticalFailedOperationRetries);
      if (current.conservativeCostUsd + maximumCostReservationUsd > this.profile.perCase.maximumQualificationProviderCostUsd + 1e-9) return terminate("PER_CASE_COST", current.conservativeCostUsd + maximumCostReservationUsd, this.profile.perCase.maximumQualificationProviderCostUsd);
      if (total.conservativeCostUsd + maximumCostReservationUsd > this.profile.total.maximumQualificationProviderCostUsd + 1e-9) return terminate("TOTAL_COST", total.conservativeCostUsd + maximumCostReservationUsd, this.profile.total.maximumQualificationProviderCostUsd);
      const caseStart = current.firstStartedAt ? Date.parse(current.firstStartedAt) : Date.parse(at);
      const totalStart = total.firstStartedAt ? Date.parse(total.firstStartedAt) : Date.parse(at);
      if (Date.parse(at) - caseStart > this.profile.perCase.maximumWallClockDurationMs) return terminate("PER_CASE_WALL_CLOCK", Date.parse(at) - caseStart, this.profile.perCase.maximumWallClockDurationMs);
      if (Date.parse(at) - totalStart > this.profile.total.maximumWallClockDurationMs) return terminate("TOTAL_WALL_CLOCK", Date.parse(at) - totalStart, this.profile.total.maximumWallClockDurationMs);
      const reservationCore = {
        schemaVersion: "1.0", entryType: "STEP_RESERVATION", reservationId: `step-reservation-${sha256Json({ caseId, stepType, operationHash, at, sequence: entries.length + 1 }).slice(0, 48)}`,
        caseId, stepType, operationHash, modelOrToolIdentity, maximumCostReservationUsd, maximumResourceAllowance,
        retryOfOperationHash, startTime: at
      };
      return this.#append(reservationCore);
    });
  }

  async complete({ reservationId, actualUsage = null, actualCostUsd = null, durationMs, resultStatus, progressSignals = [] }) {
    const at = canonicalIso(this.#clock(), "completion time");
    return this.#withLock(async () => {
      const entries = await this.entries();
      const chain = validateLedgerChain(entries, this.profile.profileHash);
      const pair = chain.reservations.get(reservationId);
      assert.ok(pair && !pair.completion, "reservation cannot be completed");
      const usageEvidenceAvailable = actualUsage !== null && actualCostUsd !== null;
      if (actualCostUsd !== null) {
        assert.equal(Number.isFinite(actualCostUsd) && actualCostUsd >= 0, true, "actual qualification cost is invalid");
        assert.equal(actualCostUsd <= pair.reservation.maximumCostReservationUsd, true, "actual qualification cost exceeds its reservation");
      }
      const conservativeCostUsd = usageEvidenceAvailable ? actualCostUsd : pair.reservation.maximumCostReservationUsd;
      const completion = await this.#append({
        schemaVersion: "1.0", entryType: "STEP_COMPLETION", reservationId, caseId: pair.reservation.caseId,
        actualUsage, actualCostUsd, usageEvidenceAvailable, conservativeCostUsd, durationMs, resultStatus,
        progressSignals, progress: progressSignals.length > 0, completedAt: at
      });
      const updated = await this.entries();
      const current = summarize(updated, this.profile.profileHash, pair.reservation.caseId);
      if (current.noProgressTail >= this.profile.perCase.noProgressConsecutiveStepCeiling) {
        await this.#terminate(pair.reservation.caseId, "NO_PROGRESS_CONSECUTIVE_STEPS", current.noProgressTail, this.profile.perCase.noProgressConsecutiveStepCeiling, at);
      }
      return completion;
    });
  }

  registerChild(controller) { this.#activeChildren.add(controller); }
  unregisterChild(controller) { this.#activeChildren.delete(controller); }

  async verifyRestartAccounting() {
    const entries = await this.entries();
    const total = summarize(entries, this.profile.profileHash);
    return Object.freeze({ valid: true, ledgerEntryCount: entries.length, ledgerHash: entries.at(-1)?.entryHash || ZERO_HASH, staleReservationsConservativelyConsumed: total.activeReservations, conservativeCostUsd: total.conservativeCostUsd });
  }
}
