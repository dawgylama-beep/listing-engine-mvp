import assert from "node:assert/strict";
import { mkdir, open, readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { QUALIFICATION_LIMITS } from "./qualification-route.mjs";
import { assertHash, assertSafeId, canonicalIso, seal, sha256Json, stableJson } from "../../scripts/protocol.mjs";

const ZERO_HASH = "0".repeat(64);
export const ACTION_KINDS = Object.freeze(["PROVIDER_ATTEMPT", "MEMORY_QUERY", "PRESEALED_DOSSIER", "RETRY_SLOT"]);
export const RETRY_REASONS = Object.freeze(["PROVIDER_TIMEOUT", "PROVIDER_CONNECTION_FAILURE"]);

function summarize(entries, caseId = null) {
  const selected = caseId === null ? entries : entries.filter((item) => item.caseId === caseId);
  return Object.freeze({
    reasoningSteps: selected.filter((item) => item.actionKind === "PROVIDER_ATTEMPT").length,
    toolActions: selected.filter((item) => item.actionKind === "MEMORY_QUERY" || item.actionKind === "PRESEALED_DOSSIER").length,
    dossierActions: selected.filter((item) => item.actionKind === "PRESEALED_DOSSIER").length,
    retrySlots: selected.filter((item) => item.actionKind === "RETRY_SLOT").length,
    reservedCostUsd: Number(selected.reduce((sum, item) => sum + item.reservationUsd, 0).toFixed(8)),
    providerAttempts: selected.filter((item) => item.actionKind === "PROVIDER_ATTEMPT").length,
    actionCount: selected.length
  });
}

function validateChain(entries, authority) {
  let prior = ZERO_HASH;
  const identities = new Set();
  for (const [index, entry] of entries.entries()) {
    assert.equal(entry.sequence, index + 1, "qualification action ledger sequence differs");
    assert.equal(entry.authorityHash, authority.authorityHash); assert.equal(entry.priorEntryHash, prior, "qualification action ledger predecessor differs");
    assert.ok(ACTION_KINDS.includes(entry.actionKind)); assertSafeId(entry.actionIdentity, "qualification action identity");
    assert.equal(identities.has(entry.actionIdentity), false, "qualification action identity was reused"); identities.add(entry.actionIdentity);
    const slot = authority.caseSlots.find((item) => item.episodeId === entry.caseId); assert.ok(slot, "ledger entry has no authority case slot");
    assert.equal(entry.caseSlotHash, slot.caseSlotHash); assertHash(entry.operationHash); canonicalIso(entry.consumedAt);
    assert.ok(Number.isFinite(entry.reservationUsd) && entry.reservationUsd >= 0);
    if (entry.actionKind !== "PROVIDER_ATTEMPT") assert.equal(entry.reservationUsd, 0);
    if (entry.actionKind === "RETRY_SLOT") {
      assert.ok(entry.retryOfActionIdentity); assert.ok(RETRY_REASONS.includes(entry.retryReason));
    } else { assert.equal(entry.retryReason, null); }
    const core = structuredClone(entry); delete core.entryHash; assert.equal(sha256Json(core), entry.entryHash, "qualification action ledger entry hash differs");
    prior = entry.entryHash;
  }
  return Object.freeze({ ledgerHash: prior, identities });
}

export class ImmutableQualificationActionLedger {
  constructor({ root, authority, clock = () => new Date().toISOString() }) {
    this.root = path.resolve(root); this.authority = authority; this.clock = clock;
    this.entriesRoot = path.join(this.root, "entries"); this.lockPath = path.join(this.root, ".ledger.lock");
  }

  async initialize() { await mkdir(this.entriesRoot, { recursive: true }); await this.entries(); return this; }

  async entries() {
    await mkdir(this.entriesRoot, { recursive: true });
    const names = (await readdir(this.entriesRoot)).filter((name) => /^\d{6}-[A-Za-z0-9._:-]+\.json$/.test(name)).sort();
    const entries = await Promise.all(names.map(async (name) => JSON.parse(await readFile(path.join(this.entriesRoot, name), "utf8"))));
    validateChain(entries, this.authority); return entries;
  }

  async #locked(callback) {
    let handle;
    try { handle = await open(this.lockPath, "wx", 0o600); }
    catch (error) { if (error?.code === "EEXIST") throw new Error("QUALIFICATION_LEDGER_CONCURRENT_OVERCOMMIT_BLOCKED"); throw error; }
    try { return await callback(); } finally { await handle.close(); await unlink(this.lockPath).catch(() => {}); }
  }

  async consume({ caseId, actionKind, actionIdentity, operationHash, reservationUsd = 0, retryOfActionIdentity = null, retryReason = null }) {
    assert.ok(ACTION_KINDS.includes(actionKind), "UNAUTHORIZED_QUALIFICATION_ACTION_KIND");
    assertSafeId(actionIdentity, "qualification action identity"); assertHash(operationHash, "qualification operation hash");
    assert.ok(Number.isFinite(reservationUsd) && reservationUsd >= 0); canonicalIso(this.clock());
    return this.#locked(async () => {
      const entries = await this.entries(); const chain = validateChain(entries, this.authority);
      assert.equal(chain.identities.has(actionIdentity), false, "QUALIFICATION_ACTION_IDENTITY_ALREADY_CONSUMED");
      const slot = this.authority.caseSlots.find((item) => item.episodeId === caseId); assert.ok(slot, "UNAUTHORIZED_QUALIFICATION_CASE");
      const expectedPosition = this.authority.caseSlots.findIndex((item) => item.episodeId === caseId);
      for (let index = 0; index < expectedPosition; index += 1) {
        assert.ok(entries.some((entry) => entry.caseId === this.authority.caseSlots[index].episodeId), "QUALIFICATION_CASE_ORDER_VIOLATION");
      }
      if (actionKind === "RETRY_SLOT") {
        assert.ok(retryOfActionIdentity && chain.identities.has(retryOfActionIdentity), "retry must bind a consumed action identity");
        assert.ok(RETRY_REASONS.includes(retryReason), "UNAUTHORIZED_RETRY_REASON");
        const failedAttempt = entries.find((entry) => entry.actionIdentity === retryOfActionIdentity);
        assert.equal(failedAttempt?.actionKind, "PROVIDER_ATTEMPT", "retry slot must bind a provider attempt");
        assert.equal(failedAttempt.operationHash, operationHash, "retry slot request differs from failed attempt");
      } else if (actionKind === "PROVIDER_ATTEMPT") {
        assert.equal(retryReason, null);
        const priorAttempts = entries.filter((entry) => entry.caseId === caseId && entry.actionKind === "PROVIDER_ATTEMPT" && entry.operationHash === operationHash);
        if (priorAttempts.length === 0) assert.equal(retryOfActionIdentity, null, "first provider attempt cannot consume a retry slot");
        else {
          const retrySlot = entries.find((entry) => entry.actionIdentity === retryOfActionIdentity);
          assert.equal(retrySlot?.actionKind, "RETRY_SLOT", "repeated provider dispatch requires an explicit retry slot");
          assert.equal(retrySlot.operationHash, operationHash, "retry provider request differs from its slot");
          assert.equal(entries.some((entry) => entry.actionKind === "PROVIDER_ATTEMPT" && entry.retryOfActionIdentity === retryOfActionIdentity), false, "retry slot was already consumed");
        }
      } else { assert.equal(retryOfActionIdentity, null); assert.equal(retryReason, null); }
      const perCase = summarize(entries, caseId); const total = summarize(entries);
      const nextCase = {
        reasoningSteps: perCase.reasoningSteps + (actionKind === "PROVIDER_ATTEMPT" ? 1 : 0),
        toolActions: perCase.toolActions + (["MEMORY_QUERY", "PRESEALED_DOSSIER"].includes(actionKind) ? 1 : 0),
        dossierActions: perCase.dossierActions + (actionKind === "PRESEALED_DOSSIER" ? 1 : 0),
        retrySlots: perCase.retrySlots + (actionKind === "RETRY_SLOT" ? 1 : 0),
        cost: Number((perCase.reservedCostUsd + reservationUsd).toFixed(8))
      };
      const nextTotal = {
        reasoningSteps: total.reasoningSteps + (actionKind === "PROVIDER_ATTEMPT" ? 1 : 0),
        toolActions: total.toolActions + (["MEMORY_QUERY", "PRESEALED_DOSSIER"].includes(actionKind) ? 1 : 0),
        dossierActions: total.dossierActions + (actionKind === "PRESEALED_DOSSIER" ? 1 : 0),
        retrySlots: total.retrySlots + (actionKind === "RETRY_SLOT" ? 1 : 0),
        cost: Number((total.reservedCostUsd + reservationUsd).toFixed(8))
      };
      const limits = [
        [nextCase.reasoningSteps, QUALIFICATION_LIMITS.perCase.maximumReasoningSteps, "PER_CASE_REASONING_STEPS"],
        [nextCase.toolActions, QUALIFICATION_LIMITS.perCase.maximumToolActions, "PER_CASE_TOOL_ACTIONS"],
        [nextCase.dossierActions, QUALIFICATION_LIMITS.perCase.maximumPresealedDossierActions, "PER_CASE_DOSSIER_ACTIONS"],
        [nextCase.retrySlots, QUALIFICATION_LIMITS.perCase.maximumRetrySlots, "PER_CASE_RETRY_SLOTS"],
        [nextCase.cost, QUALIFICATION_LIMITS.perCase.maximumCostUsd, "PER_CASE_COST"],
        [nextTotal.reasoningSteps, QUALIFICATION_LIMITS.aggregate.maximumReasoningSteps, "AGGREGATE_REASONING_STEPS"],
        [nextTotal.toolActions, QUALIFICATION_LIMITS.aggregate.maximumToolActions, "AGGREGATE_TOOL_ACTIONS"],
        [nextTotal.dossierActions, QUALIFICATION_LIMITS.aggregate.maximumPresealedDossierActions, "AGGREGATE_DOSSIER_ACTIONS"],
        [nextTotal.retrySlots, QUALIFICATION_LIMITS.aggregate.maximumRetrySlots, "AGGREGATE_RETRY_SLOTS"],
        [nextTotal.cost, QUALIFICATION_LIMITS.aggregate.maximumCostUsd, "AGGREGATE_COST"]
      ];
      const exceeded = limits.find(([observed, ceiling]) => observed > ceiling + 1e-9);
      if (exceeded) throw new Error(`QUALIFICATION_LIMIT_REACHED:${exceeded[2]}`);
      const consumedAt = this.clock(); canonicalIso(consumedAt);
      const core = {
        schemaVersion: "1.0", ledgerType: "IMMUTABLE_QUALIFICATION_ACTION_CONSUMPTION", sequence: entries.length + 1,
        authorityHash: this.authority.authorityHash, caseSlotHash: slot.caseSlotHash, caseId, actionKind, actionIdentity,
        operationHash, reservationUsd: Number(reservationUsd.toFixed(8)), retryOfActionIdentity, retryReason,
        consumedAt, priorEntryHash: entries.at(-1)?.entryHash || ZERO_HASH
      };
      const entry = seal(core, "entryHash");
      const name = `${String(entry.sequence).padStart(6, "0")}-${actionIdentity}.json`;
      const handle = await open(path.join(this.entriesRoot, name), "wx", 0o600);
      try { await handle.writeFile(`${stableJson(entry)}\n`, "utf8"); await handle.sync(); } finally { await handle.close(); }
      return entry;
    });
  }

  async summary(caseId = null) {
    const entries = await this.entries(); const chain = validateChain(entries, this.authority);
    return Object.freeze({ ...summarize(entries, caseId), ledgerHash: chain.ledgerHash, immutableEntryCount: entries.length });
  }
}
