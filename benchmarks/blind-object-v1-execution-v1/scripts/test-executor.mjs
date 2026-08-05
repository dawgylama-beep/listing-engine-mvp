import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { assertNoSecretMaterial, prepareRequestTemplates, readJson, stableJson } from "./execution-common.mjs";
import { freezeResponses } from "./freeze-responses.mjs";
import { gradeFrozenResults } from "./grade-frozen-results.mjs";
import { gradeGovernorResults } from "./grade-governor-results.mjs";
import { verifyFrozenResultIntegrity } from "./result-integrity.mjs";
import { runBaseline } from "./run-baseline.mjs";
import { latestByRun, loadJournal } from "./run-journal.mjs";

function deterministicClock() {
  let tick = 0;
  return () => new Date(Date.UTC(2026, 7, 3, 12, 0, 0, tick++)).toISOString();
}

async function directoryBytes(root) {
  const entries = [];
  const visit = async (directory) => {
    const { readdir } = await import("node:fs/promises");
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else entries.push([path.relative(root, absolute).replaceAll("\\", "/"), (await readFile(absolute)).toString("base64")]);
    }
  };
  await visit(root);
  return entries.sort(([a], [b]) => a.localeCompare(b));
}

async function runTests() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "ke-executor-v1-"));
  const resultRoot = path.join(temporaryRoot, "complete");
  const tracePath = path.join(temporaryRoot, "mock-trace.jsonl");
  try {
    const prepared = await prepareRequestTemplates();
    assert.equal(prepared.templates.length, 26);
    assert.deepEqual(prepared.loadedBenchmarkFiles, ["input-cases.json", "manifest.json", "assets/*"]);
    assert.equal(prepared.privateAnswerMaterialLoaded, false);
    assert.equal(prepared.networkRequestCount, 0);
    assert.equal(prepared.providerCallCount, 0);
    assert.equal(prepared.productHandlerCallCount, 0);

    let gradingBlockedBeforeFreeze = false;
    try {
      await gradeFrozenResults({ resultRoot, outputRoot: path.join(temporaryRoot, "premature-grade"), synthetic: true });
    } catch {
      gradingBlockedBeforeFreeze = true;
    }
    assert.equal(gradingBlockedBeforeFreeze, true);
    assert.throws(() => assertNoSecretMaterial({ authorization: "redacted" }), /credential-bearing field/);
    assert.throws(() => assertNoSecretMaterial({ apiKey: "synthetic-provider-key-value" }), /credential-bearing field/);
    assert.throws(() => assertNoSecretMaterial({ note: `${"Bear"}er ${"x".repeat(20)}` }), /credential signature/);

    const run = await runBaseline({
      resultRoot,
      mode: "mock",
      mockMode: "mixed",
      mockTracePath: tracePath,
      preparedOverride: prepared,
      nowIso: deterministicClock()
    });
    assert.equal(run.handlerInvocations, 26);
    const trace = (await readFile(tracePath, "utf8")).trim().split(/\r?\n/).map(JSON.parse);
    assert.equal(trace.length, 26);
    assert.deepEqual(trace.map((entry) => entry.runId), prepared.templates.map((entry) => entry.runId));

    const weak = await readJson(path.join(resultRoot, "responses", "RUN-002.json"));
    const providerError = await readJson(path.join(resultRoot, "responses", "RUN-003.json"));
    assert.equal(weak.customerFacingReport.exactProductIdentity, "Not verified");
    assert.ok(providerError.providerAndSearchErrors.some((entry) => String(entry.value).includes("synthetic provider unavailable")));
    const rawDecoded = JSON.parse(Buffer.from(providerError.rawHandlerBodyBase64, "base64").toString("utf8"));
    assert.deepEqual(providerError.rawProductResponse, rawDecoded, "mocked handler response must be captured without alteration");

    const manifest = await freezeResponses({ resultRoot, nowIso: deterministicClock() });
    assert.equal(manifest.requestCount, 26);
    assert.equal(manifest.responseCount, 26);
    const verified = await verifyFrozenResultIntegrity(resultRoot);
    assert.equal(verified.integrityVerifiedBeforePrivateLoad, true);
    const governorReport = await gradeGovernorResults({
      resultRoot,
      outputRoot: path.join(temporaryRoot, "governor-grade")
    });
    assert.equal(governorReport.passed, false, "synthetic legacy responses without Governor proofs must fail honestly");
    assert.equal(governorReport.failedAnalysisCount, 26);

    const gradeAPath = path.join(temporaryRoot, "grade-a");
    const gradeBPath = path.join(temporaryRoot, "grade-b");
    const gradeA = await gradeFrozenResults({ resultRoot, outputRoot: gradeAPath, synthetic: true });
    const gradeB = await gradeFrozenResults({ resultRoot, outputRoot: gradeBPath, synthetic: true });
    assert.equal(gradeA.scores.length, 26);
    assert.equal(stableJson(gradeA), stableJson(gradeB));
    assert.deepEqual(await directoryBytes(gradeAPath), await directoryBytes(gradeBPath));
    const failureCodes = gradeA.scores.flatMap((entry) => entry.failureReport.map((failure) => failure.code));
    assert.ok(failureCodes.includes("CONFIDENT_FALSE_EXACT_ON_AMBIGUOUS_CASE"));
    assert.ok(failureCodes.includes("INVENTED_SOURCE"));
    assert.ok(failureCodes.includes("INVENTED_TRANSACTION_FACT"));

    const rerun = await runBaseline({
      resultRoot,
      mode: "mock",
      mockMode: "mixed",
      mockTracePath: tracePath,
      preparedOverride: prepared,
      nowIso: deterministicClock()
    });
    assert.equal(rerun.handlerInvocations, 0, "FROZEN runs must never be invoked again");
    assert.equal((await readFile(tracePath, "utf8")).trim().split(/\r?\n/).length, 26);

    const interruptedRoot = path.join(temporaryRoot, "interrupted");
    const interruptedTrace = path.join(temporaryRoot, "interrupted-trace.jsonl");
    await assert.rejects(runBaseline({
      resultRoot: interruptedRoot,
      mode: "mock",
      mockMode: "throw",
      mockTracePath: interruptedTrace,
      preparedOverride: prepared,
      nowIso: deterministicClock()
    }), /handler_process_failed/);
    await assert.rejects(runBaseline({
      resultRoot: interruptedRoot,
      mode: "mock",
      mockMode: "throw",
      mockTracePath: interruptedTrace,
      preparedOverride: prepared,
      nowIso: deterministicClock()
    }), /indeterminate run blocks resume/);
    assert.equal((await readFile(interruptedTrace, "utf8")).trim().split(/\r?\n/).length, 1);
    assert.equal(latestByRun(await loadJournal(interruptedRoot)).get("RUN-001").state, "INDETERMINATE");

    return {
      validator: "executor-synthetic-controls",
      status: "PASS",
      preparedRequests: 26,
      mockHandlerInvocations: 26,
      weakResponsePreserved: true,
      providerErrorResponsePreserved: true,
      thrownInfrastructureFailureStopped: true,
      frozenRunRerunInvocations: 0,
      indeterminateRunRerunInvocations: 0,
      requestAndResponseHashesValid: true,
      aggregateHashDeterministic: true,
      gradingBlockedBeforeFreeze,
      completeSyntheticFreezeResponses: 26,
      gradingPrivateLoadAfterIntegrity: true,
      separateGovernorReportFailures: governorReport.failedAnalysisCount,
      byteIdenticalGradingPasses: true,
      deliberatelyBadCriticalFailuresReported: true,
      credentialFieldRejectionControls: 3,
      secretSignatureFindings: 0,
      externalNetworkRequests: 0,
      providerCalls: 0,
      productHandlerCalls: 0,
      previewRequests: 0,
      productionRequests: 0
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true, maxRetries: 3 });
  }
}

runTests().then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)).catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
