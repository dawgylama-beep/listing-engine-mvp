import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { evaluateReflectionReportForLessonGate, LESSON_GATE_STATE } from "../lib/lesson-gate.js";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";
import { snapshotHistoricalTree } from "./run-experience-reflection.mjs";

const PHASE_6G_REPORT = "test-results/phase6g-retrospective-reflection.json";
const PHASE_6H_OUTPUT = "test-results/phase6h-lesson-gate.json";
const HISTORICAL_RESULTS_ROOT = "benchmarks/blind-object-v1-results";
const EXPECTED_PHASE_6G_CANONICAL_HASH = "1ae84dd6564ec7ec9a3758ff5e65753593c9078fcce486f2ed2749621bf36ba3";
const EXPECTED_PHASE_6G_FILE_SHA256 = "fe887a339f565f968dcab84793a37f430360cb331c18d693495d73ab1fb31721";
const EXPECTED_HISTORICAL_TREE_HASH = "0ef1371778138de6a595f2812d6544b43903f2875d989eb165d68674b766c96f";
const EXPECTED_HISTORICAL_FILE_COUNT = 513;

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertOutputBoundary(output) {
  const absoluteOutput = path.resolve(output);
  const ignoredRoot = path.resolve("test-results");
  const relative = path.relative(ignoredRoot, absoluteOutput);
  assert.ok(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "Phase 6H output must remain under test-results.");
  assert.equal(absoluteOutput, path.resolve(PHASE_6H_OUTPUT), "Phase 6H output path is fixed.");
}

function verifyPhase6GReport(report, fileSha256) {
  assert.equal(fileSha256, EXPECTED_PHASE_6G_FILE_SHA256, "Phase 6G full-file SHA-256 mismatch");
  assert.equal(report.reportHash, EXPECTED_PHASE_6G_CANONICAL_HASH, "Phase 6G canonical report hash mismatch");
  assert.equal(
    sha256Object({ ...report, reportHash: "" }),
    EXPECTED_PHASE_6G_CANONICAL_HASH,
    "Phase 6G canonical report hash does not recalculate"
  );
  assert.equal(report.reflection?.totalRecordsExamined, 156, "Phase 6G record count mismatch");
  assert.equal(report.reflection?.trustClassCounts?.SEALED_AUTHORITATIVE_EXPERIENCE, 22, "Phase 6G sealed Experience count mismatch");
  assert.equal(report.reflection?.trustClassCounts?.FROZEN_VERIFIED_DIAGNOSTIC, 134, "Phase 6G frozen diagnostic count mismatch");
  assert.equal(report.reflection?.lessonCandidates?.length, 0, "A historical Lesson Candidate unexpectedly exists");
  assert.equal(report.reflection?.runtimeConsumptionAuthorized, false, "Phase 6G runtime boundary mismatch");
}

function verifyHistoricalTree(snapshot) {
  assert.equal(snapshot.fileCount, EXPECTED_HISTORICAL_FILE_COUNT, "Historical file count mismatch");
  assert.equal(snapshot.treeHash, EXPECTED_HISTORICAL_TREE_HASH, "Historical tree hash mismatch");
}

export async function runHistoricalLessonGate() {
  assertOutputBoundary(PHASE_6H_OUTPUT);
  const beforeTree = await snapshotHistoricalTree(HISTORICAL_RESULTS_ROOT);
  verifyHistoricalTree(beforeTree);
  const beforeReportBytes = await readFile(PHASE_6G_REPORT);
  const beforeReportFileSha256 = sha256Bytes(beforeReportBytes);
  const phase6GReport = JSON.parse(beforeReportBytes.toString("utf8"));
  verifyPhase6GReport(phase6GReport, beforeReportFileSha256);

  const gateEvaluation = evaluateReflectionReportForLessonGate(phase6GReport.reflection);
  assert.equal(gateEvaluation.state, LESSON_GATE_STATE.NO_ELIGIBLE_CANDIDATE, "Historical gate must remain no-candidate");
  assert.deepEqual(gateEvaluation.artifactCounts, {
    regressionCharters: 0,
    regressionEvidenceBundles: 0,
    lessonProofs: 0,
    approvalReceipts: 0,
    approvedLessonRecords: 0
  });

  const afterTree = await snapshotHistoricalTree(HISTORICAL_RESULTS_ROOT);
  const afterReportBytes = await readFile(PHASE_6G_REPORT);
  const afterReportFileSha256 = sha256Bytes(afterReportBytes);
  verifyHistoricalTree(afterTree);
  verifyPhase6GReport(JSON.parse(afterReportBytes.toString("utf8")), afterReportFileSha256);
  assert.equal(afterTree.treeHash, beforeTree.treeHash, "Historical evidence changed during Phase 6H evaluation");
  assert.equal(afterTree.fileCount, beforeTree.fileCount, "Historical inventory changed during Phase 6H evaluation");
  assert.equal(afterReportFileSha256, beforeReportFileSha256, "Phase 6G report changed during Phase 6H evaluation");

  const reportCore = {
    schemaVersion: "1.0",
    reportType: "PHASE_6H_LOCAL_NON_OPERATIVE_GATE_PROOF",
    gateEvaluation,
    sourceBindings: {
      phase6GCanonicalReportHash: EXPECTED_PHASE_6G_CANONICAL_HASH,
      phase6GFileSha256: EXPECTED_PHASE_6G_FILE_SHA256,
      historicalTreeHash: beforeTree.treeHash,
      historicalFileCount: beforeTree.fileCount
    },
    sourceImmutability: {
      historicalTreeBefore: beforeTree.treeHash,
      historicalTreeAfter: afterTree.treeHash,
      historicalFileCountBefore: beforeTree.fileCount,
      historicalFileCountAfter: afterTree.fileCount,
      phase6GFileSha256Before: beforeReportFileSha256,
      phase6GFileSha256After: afterReportFileSha256,
      byteForByteIdentical: true
    },
    artifactCounts: {
      regressionCharters: 0,
      regressionEvidenceBundles: 0,
      lessonProofs: 0,
      approvalReceipts: 0,
      approvedLessonRecords: 0
    },
    executionSafety: {
      phase6GReflectionRunCount: 0,
      frozenRequestExecutionCount: 0,
      benchmarkExecutionCount: 0,
      providerRequestCount: 0,
      networkRequestCount: 0,
      openAIRequestCount: 0,
      webSearchRequestCount: 0,
      serperRequestCount: 0,
      directPageFetchCount: 0,
      sourceMutationCount: 0,
      approvalReceiptCreated: false,
      runtimeConsumptionAuthorized: false
    }
  };
  const report = {
    ...reportCore,
    reportHash: sha256Object({ ...reportCore, reportHash: "" })
  };
  await mkdir(path.dirname(path.resolve(PHASE_6H_OUTPUT)), { recursive: true });
  await writeFile(PHASE_6H_OUTPUT, `${stableObjectJson(report)}\n`, "utf8");
  return { output: path.resolve(PHASE_6H_OUTPUT), report };
}

async function cli() {
  if (process.argv.length !== 2) throw new Error("The Phase 6H historical gate accepts no external arguments.");
  const result = await runHistoricalLessonGate();
  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    output: result.output,
    gateState: result.report.gateEvaluation.state,
    artifactCounts: result.report.artifactCounts,
    sourceImmutability: result.report.sourceImmutability,
    executionSafety: result.report.executionSafety,
    reportHash: result.report.reportHash
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
