import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash, createHmac } from "node:crypto";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  CAUSALITY_DOMAIN,
  CAUSAL_MECHANISM,
  FAILURE_CLASSIFICATION,
  HISTORICAL_TRUST_CLASS,
  REFLECTION_OUTCOME,
  buildReflectionObservation
} from "../lib/experience-reflection.js";
import { GovernedLearningAdapter } from "../lib/cognitive-learning/adapter.js";
import {
  createKatherineMissionRunner,
  runKatherinePreviewDryMission
} from "../lib/katherine-mission-runner.js";
import {
  authenticateKatherineOperatingPackage,
  startKatherineSccRuntime
} from "../lib/katherine-scc-runtime.js";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";
import { sealMemoryRecord } from "../qualification/synthetic-executive/scripts/memory-store.mjs";

const digest = (value) => sha256Object(value);
const execFileAsync = promisify(execFile);

function authenticatedFailure(label) {
  return buildReflectionObservation({
    trustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    integrityVerified: true,
    sourceAggregateHash: digest({ label, source: "aggregate" }),
    sourceRecordHash: digest({ label, source: "record" }),
    sourceArtifactHash: digest({ label, source: "artifact" }),
    episodeIdentity: digest({ label, identity: "episode" }),
    objectClassIdentity: digest({ label, identity: "object-class" }),
    causalEventIdentity: digest({ label, identity: "event" }),
    sourceLineageIdentity: digest({ label, identity: "lineage" }),
    customerPurpose: "WHATS_IT_WORTH",
    outcome: REFLECTION_OUTCOME.FAILURE,
    causalityDomain: CAUSALITY_DOMAIN.INTERNAL,
    failureClassification: FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
    causalMechanism: CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION,
    earliestSupportedLossBoundary: "CANONICAL_EVIDENCE_FINALIZATION",
    expectedState: "AUTHENTICATED_KATHERINE_COGNITION",
    actualState: "GENERIC_RUNTIME_BYPASS",
    terminalOutcome: REFLECTION_OUTCOME.FAILURE
  });
}

async function addHistoricalUnmatchedRecords(adapter, count) {
  for (let index = 1; index <= count; index += 1) {
    const evidenceReferences = [`historical-unmatched-evidence-${index}`];
    await adapter.memoryStore.append(sealMemoryRecord({
      memoryType: "GENERALIZED_LESSON_CANDIDATE",
      memoryId: `historical-unmatched-${String(index).padStart(2, "0")}`,
      sourceEpisodeIds: [`historical-unmatched-episode-${index}`],
      sourceEpisodeSequence: index,
      evidenceReferences,
      evidenceAggregateHash: digest(evidenceReferences),
      applicabilityBoundaries: ["KATHERINE_ONLY"],
      explicitNonApplicabilityConditions: ["NOT_LEDGER_BOUND"],
      prohibitedActions: ["PROMOTION_WITHOUT_GOVERNOR"],
      requiredProofBeforeAdvancement: ["AUTHENTICATED_LEDGER_BINDING"],
      predecessorMemoryIds: [],
      status: "CANDIDATE",
      confidence: 0.5
    }));
  }
}

test("the installed Katherine dispatcher enforces SCC cognition for one hundred dry missions", { timeout: 120000 }, async () => {
  const learningRoot = await mkdtemp(path.join(os.tmpdir(), "katherine-scc-installed-"));
  const adapter = new GovernedLearningAdapter({
    root: learningRoot,
    learningScopeIdentity: "katherines-eye-product"
  });
  await adapter.initialize();
  await addHistoricalUnmatchedRecords(adapter, 10);

  await assert.rejects(
    startKatherineSccRuntime({ learningRoot, attestation: {} }),
    /KATHERINE_SCC_TRUSTED_LAUNCHER_REQUIRED/
  );

  let runner;
  let freshRunner;
  try {
    const installed = await execFileAsync(process.execPath, [
      path.resolve("scripts/katherine-mission-dispatcher.mjs"),
      `--learning-root=${learningRoot}`,
      "--mode=qualification",
      "--repeat=100"
    ], { cwd: path.resolve("."), windowsHide: true, encoding: "utf8", timeout: 120000 });
    const installedProof = JSON.parse(installed.stdout);
    assert.equal(installedProof.result, "KATHERINE_INSTALLED_SCC_QUALIFICATION_PASS");
    assert.equal(installedProof.repeatedDryMissions, 100);
    assert.equal(installedProof.distinctCognitiveJobReceipts, 300);
    assert.equal(installedProof.checksPassed, 26);
    assert.equal(installedProof.checksTotal, 26);
    assert.equal(installedProof.providerCalls, 0);
    assert.equal(installedProof.externalEffects, 0);
    assert.equal(installedProof.controllerInvolved, false);
    assert.equal(installedProof.crossProductContentLoaded, false);
    assert.equal(installedProof.completeKnowledgeAreaCount, 19);
    assert.equal(installedProof.loadedKnowledgeDocumentCount, 5);
    assert.equal(installedProof.reconstructedStartupReceipt, true);
    assert.equal(installedProof.ineligibleUnmatchedRecordCount, 10);
    assert.equal(installedProof.applicableLessonCount, 0);
    assert.notEqual(installedProof.firstWorkerProcessId, installedProof.freshWorkerProcessId);

    runner = await createKatherineMissionRunner({ learningRoot });
    assert.equal(runner.runJob, undefined, "raw role-template dispatch must not be exposed");
    assert.equal(runner.startup.result, "KATHERINE_SCC_RUNTIME_AUTHENTICATED");
    assert.equal(runner.startup.reconstructedStartupReceipt, true);
    assert.equal(runner.startup.startupReceipt.runnerId, runner.runnerId);
    assert.equal(runner.startup.startupReceipt.processId, runner.workerProcessId);
    assert.equal(runner.startup.startupReceipt.textbookSha256,
      "1fb3000d3267d690637b640ffed98826ec569d4503b3f8c9cea31bf4f0467f89");
    assert.equal(runner.startup.startupReceipt.runtimeId, "KATHERINES_EYE_SCC_RUNTIME_V1");
    assert.deepEqual(runner.startup.startupReceipt.runtimeIdentityLineage,
      ["KATHERINE_SCC_RUNTIME_V1", "KATHERINES_EYE_SCC_RUNTIME_V1"]);
    assert.equal(runner.startup.startupReceipt.productId, "katherine-eye");
    assert.equal(runner.startup.startupReceipt.packageVersion, "1.4.0");
    assert.equal(runner.startup.startupReceipt.packageTrustRootSha256,
      "282789dea8a1751e6a990ca6b23e276f4f623f13c977dc79e79b49278d5dcba2");
    assert.match(runner.startup.startupReceipt.packageRegistrationSha256, /^[a-f0-9]{64}$/u);
    assert.match(runner.startup.startupReceipt.governorIdentity, /^governor-[a-f0-9]+$/u);
    assert.match(runner.startup.startupReceipt.governorIdentitySha256, /^[a-f0-9]{64}$/u);
    assert.equal(runner.startup.startupReceipt.learningScopeIdentity, "katherines-eye-product");
    assert.match(runner.startup.startupReceipt.learningRootSha256, /^[a-f0-9]{64}$/u);
    assert.equal(runner.startup.startupReceipt.authorityEffect, false);
    assert.equal(runner.startup.startupReceipt.externalEffects, false);
    assert.equal(runner.startup.crossProductContentLoaded, false);
    assert.equal(runner.startup.controllerInvolved, false);

    const mentor = await runner.diagnoseFailure([
      authenticatedFailure("scc-boundary-one"),
      authenticatedFailure("scc-boundary-two")
    ]);
    assert.equal(mentor.result, "KATHERINE_MENTOR_DIAGNOSIS_READY");
    assert.equal(mentor.report.diagnoses.length, 1);
    assert.equal(mentor.sccJobReceipt.role, "MENTOR");

    const evaluation = await runner.evaluateFixedTrials([
      { checksPassed: 26, checksTotal: 26, providerCalls: 0 },
      { checksPassed: 26, checksTotal: 26, providerCalls: 0 }
    ]);
    assert.equal(evaluation.passing, true);
    assert.equal(evaluation.sccJobReceipt.role, "EVALUATOR");
    const governor = await runner.governLessonLifecycle(evaluation);
    assert.equal(governor.sccJobReceipt.role, "GOVERNOR");
    assert.equal(governor.retentionAuthorized, false);
    assert.equal(governor.decision, "QUARANTINE");

    const audit = await runner.audit();
    assert.equal(audit.controllerInvolved, false);
    assert.equal(audit.crossProductContentLoaded, false);
    await runner.close();
    runner = null;

    freshRunner = await createKatherineMissionRunner({ learningRoot });
    const reconstruction = await freshRunner.reconstructCheckpoint();
    assert.equal(reconstruction.result, "KATHERINE_SCC_RECONSTRUCTED");
    assert.equal(reconstruction.nextTransition, "REQUEST_NATIVE_OWNER_AUTHORITY_FOR_EXACT_SEQUENCE_14");
    assert.equal(reconstruction.memory.ineligibleUnmatchedRecordIds.length, 10);
    assert.equal(reconstruction.memory.applicableLessonIds.length, 0);
    assert.ok(reconstruction.receiptCounts.startups >= 4);
    assert.ok(reconstruction.receiptCounts.jobs >= 304);
    const verified = await adapter.verify();
    assert.equal(verified.result, "VALID");
    assert.ok(verified.sccStartupReceiptCount >= 4);
    assert.ok(verified.sccJobReceiptCount >= 305);
  } finally {
    if (runner) await runner.close();
    if (freshRunner) await freshRunner.close();
    await rm(learningRoot, { recursive: true, force: true });
  }
});

test("the SCC authenticates the active package from the owner-protected pointer and stable trust root", async () => {
  const sourceRoot = "C:/Users/dawgy/.agents/skills/cognitive-mission-operator/references/katherine-eye";
  const trustPolicyPath = "C:/Users/dawgy/.agents/skills/cognitive-mission-operator/SKILL.md";
  const packageRoot = await mkdtemp(path.join(os.tmpdir(), "katherine-package-auth-"));
  try {
    await cp(sourceRoot, packageRoot, { recursive: true });
    const authenticated = await authenticateKatherineOperatingPackage({ packageRoot, trustPolicyPath });
    assert.equal(authenticated.packageVersion, "1.4.0");
    assert.equal(authenticated.runtimeId, "KATHERINES_EYE_SCC_RUNTIME_V1");
    assert.deepEqual(authenticated.runtimeIdentityLineage,
      ["KATHERINE_SCC_RUNTIME_V1", "KATHERINES_EYE_SCC_RUNTIME_V1"]);
    assert.equal(authenticated.admissionContract.learningScopeIdentity, "katherines-eye-product");

    const activeRegistration = path.join(packageRoot, authenticated.registrationPath);
    await writeFile(activeRegistration, Buffer.concat([await readFile(activeRegistration), Buffer.from(" ")]));
    await assert.rejects(
      authenticateKatherineOperatingPackage({ packageRoot, trustPolicyPath }),
      /KATHERINE_SCC_ACTIVE_REGISTRATION_POINTER_MISMATCH/u
    );
  } finally {
    await rm(packageRoot, { recursive: true, force: true });
  }
});

test("production OpenAI inference has one SCC-only transport and no controller coupling", async () => {
  const [handler, runtime, runner, dispatcher, registry] = await Promise.all([
    readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/katherine-scc-runtime.js", import.meta.url), "utf8"),
    readFile(new URL("../lib/katherine-mission-runner.js", import.meta.url), "utf8"),
    readFile(new URL("../scripts/katherine-mission-dispatcher.mjs", import.meta.url), "utf8"),
    readFile(new URL("../lib/katherine-scc-role-registry.json", import.meta.url), "utf8")
  ]);
  assert.doesNotMatch(handler, /api\.openai\.com\/v1\/responses/u);
  assert.match(handler, /requestKatherineSccInference/u);
  assert.equal((runtime.match(/api\.openai\.com\/v1\/responses/gu) || []).length, 1);
  assert.doesNotMatch(`${runtime}\n${runner}\n${dispatcher}`, /mission-ledger|synthetic-mission-controller|controller-authority-continuity/u);
  assert.doesNotMatch(runner, /\.\.\.process\.env/u);
  assert.doesNotMatch(`${runtime}\n${runner}\n${dispatcher}\n${registry}`, /NCAA Edge|NBA Edge/u);
  assert.match(registry, /"directModuleAdmissionAllowed": false/u);
  assert.match(registry, /"missionControllerUsedOnlyForExternalEffects": true/u);
});

test("an interrupted authenticated learning batch recovers before fresh reconstruction", async () => {
  const learningRoot = await mkdtemp(path.join(os.tmpdir(), "katherine-scc-recovery-"));
  let runner;
  try {
    runner = await createKatherineMissionRunner({ learningRoot });
    await runner.close();
    runner = null;

    const ledgerPath = path.join(learningRoot, "ledger", "events.jsonl");
    const ledgerText = await readFile(ledgerPath, "utf8");
    const lines = ledgerText.trimEnd().split("\n");
    const pendingEvent = JSON.parse(lines.pop());
    const priorLedgerBytes = Buffer.from(lines.length ? `${lines.join("\n")}\n` : "", "utf8");
    const secret = await readFile(path.join(learningRoot, "private", "hmac.key"));
    const body = {
      schemaVersion: "1.0",
      transactionType: "KATHERINES_EYE_ATOMIC_LEARNING_TRANSACTION",
      learningScopeIdentity: "katherines-eye-product",
      writerLockId: "simulated-interrupted-writer",
      priorLedgerByteLength: priorLedgerBytes.length,
      priorLedgerSha256: createHash("sha256").update(priorLedgerBytes).digest("hex"),
      pendingEvents: [pendingEvent],
      memoryRecords: []
    };
    const transactionId = createHmac("sha256", secret)
      .update("KATHERINES_EYE_ATOMIC_LEARNING_TRANSACTION_V1", "utf8")
      .update("\0")
      .update(stableObjectJson(body), "utf8")
      .digest("hex");
    await writeFile(ledgerPath, priorLedgerBytes);
    await writeFile(
      path.join(learningRoot, "pending-learning-transaction.json"),
      `${stableObjectJson({ ...body, transactionId })}\n`
    );
    await writeFile(
      path.join(learningRoot, ".writer.lock"),
      `${stableObjectJson({ processId: 2147483647, lockId: "stale", createdAt: new Date().toISOString() })}\n`
    );

    const recovered = new GovernedLearningAdapter({
      root: learningRoot,
      learningScopeIdentity: "katherines-eye-product"
    });
    const verified = await recovered.initialize();
    assert.equal(verified.result, "VALID");
    assert.equal(verified.sccStartupReceiptCount, 1);
    await assert.rejects(readFile(path.join(learningRoot, "pending-learning-transaction.json")), { code: "ENOENT" });
    await assert.rejects(readFile(path.join(learningRoot, ".writer.lock")), { code: "ENOENT" });
  } finally {
    if (runner) await runner.close();
    await rm(learningRoot, { recursive: true, force: true });
  }
});
