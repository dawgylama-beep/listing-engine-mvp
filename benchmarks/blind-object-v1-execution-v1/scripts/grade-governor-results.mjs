import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifyFrozenResultIntegrity } from "./result-integrity.mjs";
import { validateGovernorProof } from "./governor-proof-validator.mjs";

export async function gradeGovernorResults({ resultRoot, outputRoot }) {
  const verified = await verifyFrozenResultIntegrity(resultRoot);
  const analyses = verified.responses.map((response) => {
    const validation = validateGovernorProof({
      proof: response.governorProof,
      cognitiveEpisode: response.cognitiveEpisode,
      lessonCandidate: response.lessonCandidate,
      experienceRecord: response.experienceRecord
    });
    return { runId: response.runId, objectId: response.objectId, ...validation };
  });
  const report = {
    schemaVersion: 1,
    reportType: "BOUNDED_COGNITIVE_GOVERNOR_RESULT",
    productCommit: verified.manifest.productCommit,
    analysisCount: analyses.length,
    passedAnalysisCount: analyses.filter((entry) => entry.passed).length,
    failedAnalysisCount: analyses.filter((entry) => !entry.passed).length,
    passed: analyses.every((entry) => entry.passed),
    analyses
  };
  await mkdir(outputRoot, { recursive: true });
  await writeFile(path.join(outputRoot, "governor-validation-report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return report;
}

async function cli() {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : "";
  };
  assert.ok(value("--result-root") && value("--out"), "usage: node grade-governor-results.mjs --result-root <path> --out <path>");
  const report = await gradeGovernorResults({
    resultRoot: path.resolve(value("--result-root")),
    outputRoot: path.resolve(value("--out"))
  });
  process.stdout.write(`${JSON.stringify({ status: report.passed ? "PASS" : "FAIL", analysisCount: report.analysisCount, failedAnalysisCount: report.failedAnalysisCount }, null, 2)}\n`);
  if (!report.passed) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
