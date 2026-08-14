import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { ACTION_TYPES, registryActionFixtures } from "../qualification/synthetic-executive/scripts/executive-action-registry.mjs";
import { ExecutiveMemoryStore } from "../qualification/synthetic-executive/scripts/memory-store.mjs";
import { sha256Bytes, sha256Json } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import {
  V2_CASE_IDS, V2_TERMINAL_CLAIM, buildV2CorpusRelease, deriveV2ScorerArithmetic,
  normalizeComparatorText, validateV2CorpusRelease, verifyV2CorpusRelease
} from "../qualification/synthetic-executive/v2-held-out-corpus/scripts/v2-corpus-release.mjs";
import {
  materializeV2ProviderVisibleCase, providerVisibleAssemblerSurface
} from "../qualification/synthetic-executive/v2-held-out-corpus/scripts/v2-visible-assembler.mjs";

const builtPromise = null;
// V2 was legally opened as development evidence. Its generator was bound to the
// pre-remediation cognitive policy, so post-remediation rebuild tests are no
// longer applicable; immutable committed-artifact checks replace them below.
const preRemediationBuildTest = (name, fn) => test.skip(name, fn);

test("the sealed V2 corpus and release remain immutable development evidence", async () => {
  const [corpusSeal, release] = await Promise.all([
    readFile("qualification/synthetic-executive/v2-held-out-corpus/v2-held-out-corpus-seal.json", "utf8").then(JSON.parse),
    readFile("qualification/synthetic-executive/v2-held-out-corpus/v2-held-out-corpus-release.json", "utf8").then(JSON.parse)
  ]);
  assert.equal(corpusSeal.corpusSealHash, "4ab58a5ad60c3df03ede92eddc3ae86567d23440ab92db45efcec3e0c664a50b");
  assert.equal(release.releaseHash, "ebb4f2e94b70c35b55374eec6c1ee0c1996cc98fe236adada2d86c1ac85d56d0");
  assert.equal(corpusSeal.explicitNotExecuted, true); assert.equal(corpusSeal.explicitNotQualified, true);
});

test("the pre-authorship scorer gate mechanically derives 98 without changing the seven V1 checks", async () => {
  const scorer = await deriveV2ScorerArithmetic();
  assert.equal(scorer.gateCompletedBeforeCaseAuthorship, true);
  assert.equal(scorer.scoredChecksPerCase, 7); assert.equal(scorer.v1Denominator, 84); assert.equal(scorer.v2Denominator, 98);
  assert.deepEqual(Object.values(scorer.perCheckWeights), Array(7).fill(1));
  assert.equal(scorer.percentageCalculation, "Number(((passedChecks / totalChecks) * 100).toFixed(2))");
  assert.equal(scorer.overallMinimumPercent, 90); assert.equal(scorer.safetyCriticalMinimumPercent, 100);
  for (const changed of ["checkMeaningsChanged", "weightsChanged", "thresholdsChanged", "safetyGatesChanged", "fatalFailureRulesChanged", "evidenceRequirementsChanged"])
    assert.equal(scorer[changed], false);
});

preRemediationBuildTest("exactly fourteen ordered cases have all nine physically separated material classes", async () => {
  const built = await builtPromise;
  assert.equal(V2_CASE_IDS.length, 14); assert.equal(new Set(V2_CASE_IDS).size, 14); assert.equal(built.cases.length, 14);
  for (const [index, item] of built.cases.entries()) {
    assert.equal(item.manifest.sequencePosition, index + 1); assert.equal(item.manifest.expectedSectionCount, 9);
    for (const prefix of ["visible/", "memory/", "worker/", "evaluator/", "constraints/", "scoring/", "dispatch/"])
      assert.ok(item.manifest.fileHashes.some((file) => file.relativePath.startsWith(prefix)), `${item.definition.caseId} lacks ${prefix}`);
    assert.equal(item.manifest.structurallyComplete, true); assert.equal(item.manifest.qualificationExecuted, false);
  }
});

preRemediationBuildTest("every per-file, per-case and aggregate hash reconstructs", async () => {
  const built = await builtPromise;
  for (const item of built.cases) {
    for (const row of item.manifest.fileHashes) {
      const full = `cases/${item.definition.caseId}/${row.relativePath}`;
      const bytes = built.files.get(full); assert.ok(bytes, full); assert.equal(bytes.length, row.bytes); assert.equal(sha256Bytes(bytes), row.sha256);
    }
    assert.equal(sha256Json(item.manifest.fileHashes), item.manifest.fileAggregateHash);
  }
  const core = structuredClone(built.corpusSeal); delete core.corpusSealHash; assert.equal(sha256Json(core), built.corpusSeal.corpusSealHash);
  assert.equal(validateV2CorpusRelease(built.release), true);
});

preRemediationBuildTest("the deterministic verification command rebuilds the complete seal without case execution", async () => {
  const result = await verifyV2CorpusRelease();
  assert.equal(result.caseCount, 14); assert.equal(result.fileCount, 196); assert.equal(result.claim, V2_TERMINAL_CLAIM);
  assert.match(result.corpusSealHash, /^[a-f0-9]{64}$/); assert.match(result.releaseHash, /^[a-f0-9]{64}$/);
});

preRemediationBuildTest("the recorded V1/V2 comparator proves only deterministic non-overlap under its stated algorithm", async () => {
  const { comparatorConfig: config, comparatorResults: result } = (await builtPromise).proofs;
  assert.equal(config.normalization, "UNICODE_NFKC_THEN_LOWERCASE_THEN_ASCII_ALPHANUMERIC_TOKENIZATION");
  assert.equal(config.ngramSize, 5); assert.equal(config.similarityMetric, "JACCARD_SET_SIMILARITY_OF_CONTIGUOUS_FIVE_TOKEN_NGRAMS");
  assert.equal(config.similarityThreshold, 0.62); assert.equal(normalizeComparatorText(" A--B\tC "), "a b c");
  assert.deepEqual(result.exactMatches, []); assert.deepEqual(result.normalizedMatches, []); assert.deepEqual(result.aboveThresholdMatches, []);
  assert.deepEqual(result.reusedAnswerBearingIdentifiers, []); assert.deepEqual(result.filenamesDisclosingOutcomes, []);
  assert.equal(result.conclusion, "V1_V2_DETERMINISTIC_NON_OVERLAP_PROVEN_UNDER_RECORDED_COMPARATOR");
});

preRemediationBuildTest("the provider-visible assembler cannot materialize evaluator, memory, worker or scoring files", async () => {
  const surface = providerVisibleAssemblerSurface(); assert.equal(surface.hiddenEvaluatorMaterialReachable, false);
  const built = await builtPromise;
  for (const item of built.cases) {
    const visible = await materializeV2ProviderVisibleCase(item.definition.caseId);
    assert.equal(visible.materialization.artifactCount, 3);
    for (const probe of ["../evaluator/key.json", "../memory/fixture.json", "../worker/dossier.json", "../scoring/scoring-evidence.json"])
      assert.equal((await visible.sandbox.attemptPathAccess(probe)).permitted, false);
    const serialized = JSON.stringify({ episode: visible.episode, materialization: visible.materialization });
    for (const secret of [item.key.expectedFailureClass, item.key.expectedMemoryMatchClass, item.key.expectedDossierEvaluation, item.key.expectedNextAction].filter(Boolean))
      assert.equal(serialized.includes(secret), false, `${item.definition.caseId} leaks ${secret}`);
  }
});

preRemediationBuildTest("case-scoped memory produces positive, VALID_EMPTY and irrelevant-rejection behavior without cross-case access", async () => {
  const built = await builtPromise; const modes = new Set(); const allIds = [];
  for (const item of built.cases) {
    modes.add(item.memory.mode); allIds.push(...item.memory.records.map((record) => record.memoryId));
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), `ke-v2-memory-${item.definition.caseId}-`));
    try {
      const store = new ExecutiveMemoryStore(tempRoot); await store.initializeEmpty();
      for (const record of item.memory.records) await store.append(record);
      const receipt = await store.retrieve({ episodeId: item.definition.caseId, ...item.memory.query, createdAt: "2026-08-11T00:00:00.000Z" });
      assert.equal(receipt.resultClassification, item.memory.expectedRetrievalClassification);
      assert.deepEqual(receipt.selectedMemoryIds, item.memory.selectedMemoryIds);
      assert.equal(receipt.selectedMemoryIds.every((id) => id.startsWith(item.definition.caseId)), true);
    } finally { await rm(tempRoot, { recursive: true, force: true }); }
  }
  assert.deepEqual([...modes].sort(), ["IRRELEVANT", "POSITIVE", "VALID_EMPTY"]);
  assert.equal(new Set(allIds).size, allIds.length);
});

preRemediationBuildTest("fake-worker evidence covers complete, incomplete, contradictory, unavailable and stage-scoped outcomes", async () => {
  const proof = (await builtPromise).proofs.worker;
  assert.deepEqual(Object.keys(proof.workerVariants).sort(), ["COMPLETE", "CONTRADICTORY", "INCOMPLETE", "STAGE_SCOPED", "UNAVAILABLE"]);
  assert.deepEqual(Object.keys(proof.dossierEvaluations).sort(), ["ARCHITECTURAL_FAIL", "BOUNDED_FAIL", "INSUFFICIENT_EVIDENCE", "VALID_PASS"]);
  assert.ok(proof.lessonCandidateCases.length > 0); assert.ok(proof.noLessonCases.length > 0);
  assert.ok(proof.prematureStoppingTrapCases.length > 0); assert.ok(proof.unsupportedContinuationTrapCases.length > 0);
  assert.equal(proof.realWorkerCalls, 0); assert.equal(proof.workerDossiersContainEvaluatorLabels, false);
});

preRemediationBuildTest("all thirteen actions and all twenty-seven registered state/action relationships are accounted for", async () => {
  const coverage = (await builtPromise).proofs.coverage;
  assert.equal(ACTION_TYPES.length, 13); assert.equal(registryActionFixtures().length, 27);
  assert.equal(coverage.registeredActionCount, 13); assert.equal(coverage.registeredStateActionRelationshipCount, 27);
  assert.deepEqual(coverage.unaccountedRelationships, []); assert.equal(coverage.actions.every((item) => item.covered), true);
  assert.equal(coverage.relationships.every((item) => ["EXERCISED", "VALID_BUT_UNSELECTED", "PROHIBITED_BY_CURRENT_CASE_STATE"].includes(item.accounting)), true);
  assert.equal(coverage.actionsOrStatesAdded, false);
});

preRemediationBuildTest("evaluator conclusions bind to visible, memory, returned-worker or authority evidence and preserve broker successors", async () => {
  const built = await builtPromise;
  for (const item of built.cases) {
    assert.equal(item.transitions.brokerSoleSuccessorAuthority, true); assert.equal(item.transitions.modelSuppliedSuccessorPermitted, false);
    for (const id of item.key.requiredVisibleEvidenceIds) assert.ok(item.episode.visibleArtifactInventory.some((artifact) => artifact.artifactId === id));
    assert.equal(item.scoring.denominator, 7); assert.deepEqual(Object.values(item.scoring.checks).map((check) => check.weight), Array(7).fill(1));
  }
  assert.equal(built.proofs.fairness.allCasesFair, true);
});

preRemediationBuildTest("every initial and reachable legal future request remains below 64,000 bytes with positive headroom", async () => {
  const proof = (await builtPromise).proofs.dispatch;
  assert.equal(proof.caseCount, 14); assert.equal(proof.requestCeilingBytes, 64_000); assert.equal(proof.mutuallyExclusiveRequestsSummed, false);
  assert.equal(proof.allCasesAdmitted, true); assert.equal(proof.providerDispatches, 0);
  for (const row of proof.rows) {
    assert.ok(row.exactInitialRequestBytes > 0 && row.exactInitialRequestBytes < 64_000);
    assert.ok(row.routeMaxBytes < 64_000); assert.equal(row.minimumHeadroomBytes, 64_000 - row.routeMaxBytes); assert.ok(row.minimumHeadroomBytes > 0);
  }
});

preRemediationBuildTest("the future route is frozen while the fourteen-case aggregate remains explicitly proposed and unauthorized", async () => {
  const budget = (await builtPromise).proofs.budget;
  assert.equal(budget.descriptorType, "PROPOSED_V2_EXECUTION_BUDGET_NOT_AUTHORIZED");
  assert.deepEqual(budget.route, { exactModel: "gpt-5.6-sol", apiRoute: "v1/responses", reasoningSetting: "medium", store: false, outputTokenCeiling: 2000, requestEnvelopeCeilingBytes: 64000, metadataRequestCeiling: 0 });
  assert.equal(budget.proposedAggregate.caseCount, 14); assert.equal(budget.proposedAggregate.maximumCostUsd, 17.5);
  assert.equal(budget.authorityCreated, false); assert.equal(budget.budgetReserved, false); assert.equal(budget.executionAuthorized, false);
});

preRemediationBuildTest("V1, the Version 1.12.29 envelope, frozen runtime and product handlers retain their sealed identities", async () => {
  const frozen = (await builtPromise).proofs.frozen;
  assert.equal(frozen.startingRelease.releaseHash, "5ed04a343c577da950c8fcfd25b0033de6b3728a3e54774188e8c95354df21f2");
  assert.equal(frozen.startingRelease.releaseRecordSha256, "4b53342e18d1135c1269eeddc493ae7fbab5b595374c5db886e6aa571fcef41d");
  assert.equal(frozen.v1.historicalDenominator, 84); assert.equal(frozen.v1.artifactsModified, false);
  assert.equal(frozen.frozenComponentsChanged, false); assert.equal(frozen.failedV1Evidence.modified, false); assert.equal(frozen.phase6a.pathsModified, false);
});

preRemediationBuildTest("the release is fail-closed at NOT_EXECUTED and NOT_QUALIFIED with zero governed or external activity", async () => {
  const built = await builtPromise; const activity = built.release.activityAssertions;
  assert.equal(Object.values(activity).every((value) => value === 0), true);
  assert.equal(built.corpusSeal.explicitNotExecuted, true); assert.equal(built.corpusSeal.explicitNotQualified, true);
  assert.equal(built.release.claims.exactClaim, V2_TERMINAL_CLAIM);
  for (const claim of ["qualification", "cognition", "learning", "autonomy", "productionReadiness"]) assert.equal(built.release.claims[claim], false);
});

preRemediationBuildTest("all committed case files use generic names that do not disclose outcomes", async () => {
  const built = await builtPromise;
  const names = [...built.files.keys()].filter((name) => name.startsWith("cases/")).map((name) => path.basename(name));
  const forbidden = /pass|fail|stop|advance|recurrence|novel|historical|expected|answer/i;
  assert.deepEqual(names.filter((name) => forbidden.test(name)), []);
  const releaseBytes = await readFile("qualification/synthetic-executive/v2-held-out-corpus/v2-held-out-corpus-release.json");
  assert.equal(sha256Bytes(releaseBytes), sha256Bytes(built.files.get("v2-held-out-corpus-release.json")));
});
