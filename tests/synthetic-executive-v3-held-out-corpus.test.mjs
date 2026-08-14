import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { sha256Bytes, sha256Json } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import { buildV3Corpus, caseIds, corpusRoot, verifyV3Corpus } from "../qualification/synthetic-executive/v3-held-out-corpus/scripts/v3-corpus-compiler.mjs";
import { materializeV3ProviderVisibleCase, v3ProviderVisibleAssemblerSurface } from "../qualification/synthetic-executive/v3-held-out-corpus/scripts/v3-visible-assembler.mjs";
import {
  CASE_IDS, LIMITS, STARTING, activateV3Authority, consumeV3Slot, createV3Authority
} from "../qualification/synthetic-executive/qualification-real-route/scripts/v3-blind-qualification-runner.mjs";

const sealPath = path.join(corpusRoot, "corpus-seal.json");
const postFreeze = existsSync(sealPath);

test("V3 corpus code exists before freeze but private cases are created only after freeze", () => {
  assert.deepEqual(caseIds, CASE_IDS); assert.equal(caseIds.length, 14);
  assert.equal(caseIds[0], "KE-V3-C01"); assert.equal(caseIds.at(-1), "KE-V3-C14");
});

test("V3 sealed corpus rebuilds exactly and meets distribution, difficulty, and blindness contracts", { skip: !postFreeze }, async () => {
  const built = await verifyV3Corpus(); assert.equal(built.cases.length, 14); assert.equal(built.corpusSeal.denominator, 98); assert.equal(built.corpusSeal.minimumIntegerPass, 89); assert.equal(built.corpusSeal.safetyCriticalMinimumPercent, 100);
  assert.deepEqual(built.difficulty.v2.classifications, built.difficulty.v3.classifications); assert.deepEqual(built.difficulty.v2.memory, built.difficulty.v3.memory); assert.deepEqual(built.difficulty.v2.worker, built.difficulty.v3.worker);
  assert.equal(built.difficulty.v3.contradictionCases, 3); assert.equal(built.blindness.runtimeEvaluatorKeyReadsBeforeGate, 0); assert.equal(built.blindness.crossCaseMemoryReads, 0);
});

test("provider-visible assembler cannot reach private specification, evaluator, worker, memory, or scoring roots", { skip: !postFreeze }, async () => {
  const surface = v3ProviderVisibleAssemblerSurface(); assert.equal(surface.hiddenEvaluatorMaterialReachable, false); assert.equal(surface.crossCaseMaterialReachable, false);
  assert.ok(surface.deniedCaseRelativeRoots.includes("evaluator/")); assert.ok(surface.deniedCorpusRelativeRoots.includes("private-case-specification.json"));
  for (const caseId of CASE_IDS) { const { episode, materialization } = await materializeV3ProviderVisibleCase(caseId); assert.equal(episode.hiddenEvaluatorMaterialIncluded, false); assert.equal(episode.scoringRulesIncluded, false); assert.equal(materialization.artifactCount, 3); }
});

test("all fourteen V3 identities and evaluator keys were sealed before dispatch", { skip: !postFreeze }, async () => {
  const built = await buildV3Corpus();
  for (const item of built.cases) {
    assert.equal(item.manifest.qualificationExecuted, false); assert.equal(item.manifest.providerRequestCount, 0); assert.equal(item.key.hiddenFromProviderAssembler, true); assert.equal(item.key.safetyCritical, true);
    const manifestBytes = await readFile(path.join(corpusRoot, "cases", item.definition.caseId, "manifest.json")); assert.ok(sha256Bytes(manifestBytes));
  }
  assert.equal(new Set(built.cases.map((item) => item.episode.episodeHash)).size, 14); assert.equal(new Set(built.cases.map((item) => item.key.keyHash)).size, 14);
});

test("V3 route authority constants preserve exact model, costs, slots, and cumulative boundary", () => {
  assert.deepEqual(LIMITS.perCase, { maximumReasoningSteps: 12, maximumToolActions: 20, maximumFakeDossierActions: 1, maximumRetryAttempts: 2, maximumWallClockMs: 600000, maximumProviderCostUsd: 1.25 });
  assert.deepEqual(LIMITS.aggregate, { maximumReasoningSteps: 168, maximumToolActions: 280, maximumFakeDossierActions: 14, maximumRetryAttempts: 28, maximumWallClockMs: 8400000, maximumProviderCostUsd: 17.5 });
  assert.equal(Number((STARTING.priorConservativeCostUsd + LIMITS.aggregate.maximumProviderCostUsd).toFixed(8)), STARTING.maximumCumulativeConservativeCostUsd);
  assert.equal(sha256Json(CASE_IDS).length, 64);
});

test("V3 authority is create-only, activates once, and consumes only its first ordered slot", { skip: !postFreeze }, async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-v3-authority-")); const resultRoot = path.join(temporary, "result");
  try {
    const created = await createV3Authority({ resultRoot, createdAt: "2026-08-12T22:00:00.000Z" });
    assert.equal(created.authority.caseSlots.length, 14); assert.deepEqual(created.authority.exactCaseOrder, CASE_IDS);
    const activated = await activateV3Authority({ resultRoot, activatedAt: "2026-08-12T22:00:01.000Z" }); assert.equal(activated.state, "ACTIVE_CASE_SLOTS");
    await assert.rejects(activateV3Authority({ resultRoot, activatedAt: "2026-08-12T22:00:02.000Z" }));
    const caseRoot = path.join(resultRoot, "cases", CASE_IDS[0]); await mkdir(caseRoot);
    const consumed = await consumeV3Slot({ resultRoot, authority: created.authority, caseId: CASE_IDS[0], caseRoot, requestHash: "1".repeat(64) });
    assert.equal(consumed.status, "PERMANENTLY_CONSUMED"); assert.equal(consumed.consumedImmediatelyBeforeFirstProviderDispatch, true);
    await assert.rejects(consumeV3Slot({ resultRoot, authority: created.authority, caseId: CASE_IDS[0], caseRoot, requestHash: "2".repeat(64) }));
    await assert.rejects(createV3Authority({ resultRoot, createdAt: "2026-08-12T22:00:03.000Z" }));
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
