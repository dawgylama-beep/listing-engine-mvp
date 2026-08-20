import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { EngineeringWorkerAdapter } from "../qualification/synthetic-executive/scripts/engineering-worker-adapter.mjs";
import { ACTION_TYPES, registryActionFixtures } from "../qualification/synthetic-executive/scripts/executive-action-registry.mjs";
import { evaluateAtomicContract } from "../qualification/synthetic-executive/future-independent-qualification-contract/atomic-scorer.mjs";
import { sha256Bytes, sha256Json } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import { V4_CASE_IDS, V4_CASE_SPECS } from "../qualification/synthetic-executive/v4-held-out-corpus/scripts/v4-case-definitions.mjs";
import {
  FORBIDDEN_VISIBLE_TERMS,
  SEVEN_CHECK_IDS,
  absoluteFromCorpus,
  readJson,
  verifyV4Package,
  writeV4PackageSeal
} from "../qualification/synthetic-executive/v4-held-out-corpus/scripts/v4-package-core.mjs";
import { buildV4NonOverlapProof } from "../qualification/synthetic-executive/v4-held-out-corpus/scripts/v4-non-overlap-comparator.mjs";
import {
  attemptV4CasePathAccess,
  materializeV4ProviderVisibleCase,
  v4ProviderVisibleAssemblerSurface
} from "../qualification/synthetic-executive/v4-held-out-corpus/scripts/v4-visible-assembler.mjs";

test("V4 package verifies as sealed and unexecuted", async () => {
  const result = await verifyV4Package();
  assert.equal(result.result, "PASS");
  assert.equal(result.caseCount, 14);
  assert.equal(result.checkCount, 98);
  assert.equal(result.requestCount, 378);
  assert.equal(result.providerRequestCount, 0);
  assert.equal(result.qualificationPerformed, false);
  assert.equal(result.scoreCalculated, false);
});

test("V4 case namespace and order are exact", async () => {
  assert.deepEqual(V4_CASE_IDS, Array.from({ length: 14 }, (_, index) => `KE-V4-C${String(index + 1).padStart(2, "0")}`));
  const manifest = await readJson(absoluteFromCorpus("public", "corpus-manifest.json"));
  assert.deepEqual(manifest.order, V4_CASE_IDS);
  assert.equal(new Set(manifest.order).size, 14);
});

test("V4 public manifests expose only the authorized fields", async () => {
  const allowed = ["authorizedCapabilities", "budgetProfileIdentity", "caseId", "evaluatorControlAggregateHash", "knowledgeCutoffIdentity", "order", "visibleAggregate", "visibleInventory"].sort();
  for (const caseId of V4_CASE_IDS) {
    const manifest = await readJson(absoluteFromCorpus("public", "cases", caseId, "manifest.json"));
    assert.deepEqual(Object.keys(manifest).sort(), allowed);
    const text = JSON.stringify(manifest).toLowerCase();
    for (const term of FORBIDDEN_VISIBLE_TERMS) assert.equal(text.includes(term), false);
    assert.equal(text.includes("evaluator/control"), false);
    assert.equal(text.includes("scoring/evidence"), false);
  }
});

test("V4 provider-visible assembler materializes only four declared files per case", async () => {
  for (const caseId of V4_CASE_IDS) {
    const result = await materializeV4ProviderVisibleCase(caseId);
    assert.equal(result.materialization.artifactCount, 4);
    assert.equal(result.materialization.artifacts.every((item) => item.artifactId.startsWith(`${caseId}:visible:`)), true);
  }
  assert.equal(v4ProviderVisibleAssemblerSurface().hiddenEvaluatorMaterialReachable, false);
});

test("V4 path probes deny traversal, hidden roots, globs, listings, and dossier misuse", async () => {
  const probes = ["evaluator/control.json", "../evaluator/control.json", "**/*.json", ".", "search:key", "dossier/manifest.json", "manifest.json", "artifacts/junction/control.json"];
  for (const probe of probes) {
    const result = await attemptV4CasePathAccess("KE-V4-C01", probe);
    assert.equal(result.permitted, false);
  }
});

test("V4 dossier source requires sealed task and omits evaluator labels", async () => {
  const adapter = await new EngineeringWorkerAdapter({ dossierIndexPath: absoluteFromCorpus("hidden", "dossier-index.json") }).initialize();
  assert.throws(() => adapter.returnDossier("KE-V4-C02"), /cannot be revealed before task sealing/);
  const taskHash = sha256Json({ caseId: "KE-V4-C02", task: "test sealed task" });
  adapter.sealTask({ actionType: "PROPOSE_BOUNDED_ENGINEERING_TASK", episodeId: "KE-V4-C02", actionId: "V4-TEST-TASK", contentHash: taskHash });
  const dossier = adapter.returnDossier("KE-V4-C02");
  assert.equal(dossier.sealedTaskHash, taskHash);
  assert.equal(dossier.rawEvaluatorLabelsIncluded, false);
  assert.equal(Object.hasOwn(dossier, "evaluatorLabel"), false);
});

test("V4 run-scoped memory starts empty and flows only forward", async () => {
  for (const spec of V4_CASE_SPECS) {
    const memory = await readJson(absoluteFromCorpus("cases", spec.id, "memory", "input.json"));
    assert.equal(memory.startsEmpty, true);
    assert.deepEqual(memory.records, []);
    assert.deepEqual(memory.eligiblePriorCaseIds, V4_CASE_IDS.slice(0, spec.order - 1));
    assert.equal(memory.forwardFlowOnly, true);
    assert.equal(memory.seededLessonContent, false);
  }
});

test("V4 hidden cohort counts and one-source mappings are exact", async () => {
  const mapping = await readJson(absoluteFromCorpus("hidden", "cohort-transfer-map.json"));
  assert.deepEqual(mapping.counts, { foundationalSource: 6, heldOutAnalogue: 4, genuinelyNovelOrInsufficient: 4 });
  const mapped = mapping.cases.filter((item) => item.cohort === "HELD_OUT_ANALOGUE");
  assert.equal(mapped.length, 4);
  assert.equal(mapped.every((item) => item.strongestApplicableSourceCaseId !== null && item.expectedMemoryId !== null), true);
  const stopCases = mapping.cases.filter((item) => item.cohort === "GENUINELY_NOVEL_OR_INSUFFICIENT");
  assert.equal(stopCases.length, 4);
  assert.equal(stopCases.every((item) => item.strongestApplicableSourceCaseId === null), true);
});

test("V4 atomic contracts retain seven checks and pass one-atom mutation proofs", async () => {
  for (const caseId of V4_CASE_IDS) {
    const contract = await readJson(absoluteFromCorpus("cases", caseId, "atomic", "contract.json"));
    const control = await readJson(absoluteFromCorpus("cases", caseId, "evaluator", "control.json"));
    const result = evaluateAtomicContract(contract, control.expectedResponse);
    assert.deepEqual(result.checks.map((item) => item.checkId), SEVEN_CHECK_IDS);
    assert.equal(result.checks.every((item) => item.passed), true);
    const mutation = await readJson(absoluteFromCorpus("cases", caseId, "atomic", "mutation-proof.json"));
    assert.equal(mutation.mutationCount, contract.predicates.length);
    assert.equal(mutation.mutations.every((item) => item.intendedCheckFailed), true);
  }
});

test("V4 legal paths cover the unchanged action registry without expansion", async () => {
  const proof = await readJson(absoluteFromCorpus("proofs", "action-state-coverage.json"));
  assert.deepEqual([...proof.actionTypes].sort(), [...ACTION_TYPES].sort());
  assert.equal(proof.registryFixtureCount, registryActionFixtures().length);
  assert.equal(proof.everyCaseHasLegalTerminalPath, true);
  assert.equal(proof.unauthorizedActionExpansionPermitted, false);
});

test("V4 request materializations are exact and remain below 64,000 bytes", async () => {
  const inventory = await readJson(absoluteFromCorpus("proofs", "request-materialization-inventory.json"));
  assert.equal(inventory.requestCount, 378);
  let maximum = 0;
  for (const item of inventory.requests) {
    const bytes = await readFile(absoluteFromCorpus(...item.relativePath.split("/")));
    assert.equal(bytes.length, item.bytes);
    assert.equal(sha256Bytes(bytes), item.sha256);
    assert.ok(bytes.length < 64000);
    maximum = Math.max(maximum, bytes.length);
  }
  const bound = await readJson(absoluteFromCorpus("proofs", "request-byte-bound.json"));
  assert.equal(bound.maximumObservedBytes, maximum);
  assert.equal(bound.everyRequestStrictlyBelowLimit, true);
});

test("V4 capture proof accepts 1,048,576 bytes and rejects 1,048,577", async () => {
  const proof = await readJson(absoluteFromCorpus("proofs", "response-capture-boundary.json"));
  assert.equal(proof.exactBoundary.bytesPresented, 1048576);
  assert.equal(proof.exactBoundary.accepted, true);
  assert.equal(proof.exactBoundary.complete, true);
  assert.equal(proof.overflowBoundary.bytesPresented, 1048577);
  assert.equal(proof.overflowBoundary.accepted, false);
  assert.equal(proof.overflowBoundary.complete, false);
});

test("V4 comparator establishes only its bounded deterministic claim", async () => {
  const proof = await buildV4NonOverlapProof();
  assert.equal(proof.result, "PASS");
  assert.equal(proof.terminalStatement, "V4_DETERMINISTIC_NON_OVERLAP_PROVEN_UNDER_RECORDED_COMPARATOR");
  assert.ok(proof.boundedLimitations.some((item) => item.includes("do not establish absolute semantic independence")));
});

test("V4 budget and authority templates remain proposals with no live authority", async () => {
  const budget = await readJson(absoluteFromCorpus("proposed", "execution-budget.json"));
  const authority = await readJson(absoluteFromCorpus("proposed", "authority-binding-template.json"));
  assert.equal(budget.authorizationStatus, "NOT_AUTHORIZED");
  assert.equal(budget.slots.length, 14);
  assert.equal(budget.slots.every((slot) => slot.atMostOnceDispatch && !slot.consumed), true);
  assert.equal(authority.authorizationStatus, "NOT_AUTHORIZED");
  for (const key of ["liveAuthorityCreated", "providerAuthorityCreated", "qualificationPerformed", "evaluatorOpened", "scoreCalculated", "syntheticExecutiveQualified", "cognitionClaimAuthorized", "autonomyClaimAuthorized", "productionAuthority", "benchmarkAuthority", "mergeAuthority", "deploymentAuthority"]) {
    assert.equal(authority[key], false);
  }
});

test("V4 seal is deterministic across a second local write", async () => {
  const before = await readFile(absoluteFromCorpus("readiness-integrity-manifest.json"));
  const beforeHash = sha256Bytes(before);
  await writeV4PackageSeal();
  const after = await readFile(absoluteFromCorpus("readiness-integrity-manifest.json"));
  assert.equal(sha256Bytes(after), beforeHash);
});

test("V4 validation runs with the network-denial preload enabled", () => {
  assert.deepEqual(globalThis.__KATHERINES_EYE_V4_NETWORK_DENIAL__, { enabled: true });
  assert.throws(() => fetch("https://example.invalid"), /V4_VALIDATION_NETWORK_DENIED/);
});
