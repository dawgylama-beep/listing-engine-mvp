import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { benchmarkRoot, readJson, stableJson, writeJsonExclusive } from "./execution-common.mjs";
import { verifyFrozenResultIntegrity } from "./result-integrity.mjs";

const normalizeText = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const flattenText = (value) => {
  const output = [];
  const visit = (entry) => {
    if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") output.push(String(entry));
    else if (Array.isArray(entry)) entry.forEach(visit);
    else if (entry && typeof entry === "object") Object.values(entry).forEach(visit);
  };
  visit(value);
  return normalizeText(output.join(" "));
};
const containsNormalized = (haystack, needle) => {
  const normalized = normalizeText(needle);
  return normalized.length >= 4 && haystack.includes(normalized);
};
const confidenceNumber = (report) => {
  const values = [report?.confidence, report?.exactProductConfidence, report?.identificationConfidence, report?.itemIdentificationConfidence];
  for (const value of values) {
    if (Number.isFinite(Number(value))) return Math.max(0, Math.min(1, Number(value) > 1 ? Number(value) / 100 : Number(value)));
    const text = String(value || "").toLowerCase();
    if (text.includes("high")) return 0.85;
    if (text.includes("medium") || text.includes("moderate")) return 0.6;
    if (text.includes("low")) return 0.3;
  }
  return 0;
};

function normalizeProductResponse({ request, response, truth, exactControls, distractors, synthetic }) {
  const report = response.customerFacingReport || {};
  const truthCase = truth.cases.find((entry) => entry.caseId === request.objectId);
  assert.ok(truthCase);
  const exactControl = exactControls.cases.find((entry) => entry.caseId === request.objectId);
  const reportText = flattenText(report);
  const returnedUrls = new Set(response.sourceUrls);
  const rejectedText = flattenText(report.rejectedMatches || report.rejectedEvidence || []);
  const aliases = [truthCase.bestSupportedIdentity, truthCase.broaderIdentity, truthCase.exactIdentity, ...(truthCase.acceptedAliases || [])].filter(Boolean);
  const identityMatched = aliases.some((alias) => containsNormalized(reportText, alias));
  const exactSourceIds = (exactControl?.sources || []).filter((source) => returnedUrls.has(source.url)).map((source) => source.sourceId);
  const rejectedDistractorIds = distractors.controls
    .filter((entry) => entry.caseId === request.objectId && returnedUrls.has(entry.url) && containsNormalized(rejectedText, entry.url))
    .map((entry) => entry.distractorId);
  const evidenceAssociations = [
    ...(exactControl?.sources || []).filter((source) => returnedUrls.has(source.url)).map((source) => ({ sourceId: source.sourceId, caseId: request.objectId })),
    ...distractors.controls.filter((entry) => entry.caseId === request.objectId && returnedUrls.has(entry.url)).map((entry) => ({ sourceId: entry.distractorId, caseId: request.objectId }))
  ];
  const flags = synthetic ? (report.executorSyntheticFlags || {}) : {};
  if (!synthetic) assert.equal("executorSyntheticFlags" in report, false, "synthetic scoring flags are prohibited in real product results");
  const exactClaim = String(report.exactProductIdentity || report.identifiedItem || "").trim();
  const expectedRecommendation = truthCase.expectedRecommendations[request.purpose];
  const normalized = {
    caseId: request.objectId,
    purpose: request.purpose,
    identityKey: identityMatched ? truthCase.identityKey : "unmapped-product-identity",
    exactIdentityClaim: exactClaim && !/not verified|unknown|unidentified/i.test(exactClaim) ? exactClaim : null,
    assertsUnsupportedExact: Boolean(flags.unsupportedExact) || Boolean(truthCase.ambiguityContract && exactClaim && !identityMatched && confidenceNumber(report) > truthCase.ambiguityContract.maximumAcceptableConfidence),
    uncertainties: truthCase.unresolvedDetails.filter((entry) => containsNormalized(reportText, entry)),
    plausibleAlternatives: truthCase.plausibleAlternatives.filter((entry) => containsNormalized(reportText, entry)),
    exactEvidenceNotApplicable: !exactControl,
    exactSourceIds,
    rejectedDistractorIds,
    evidenceAssociations,
    valuation: {
      status: containsNormalized(reportText, truthCase.supportedValuationRange.status) ? truthCase.supportedValuationRange.status : "UNMAPPED_PRODUCT_VALUATION",
      currency: null,
      min: null,
      max: null
    },
    recommendationCode: containsNormalized(reportText, expectedRecommendation) ? expectedRecommendation : "UNMAPPED_PRODUCT_RECOMMENDATION",
    actionPlanElements: truthCase.minimumPracticalActionPlanElements.filter((entry) => containsNormalized(reportText, entry)),
    confidence: confidenceNumber(report),
    inventedSources: flags.inventedSource ? ["SYNTHETIC-INVENTED-SOURCE"] : [],
    inventedTransactionFacts: flags.inventedTransactionFact ? ["synthetic invented transaction"] : []
  };
  return normalized;
}

export async function gradeFrozenResults({ resultRoot, outputRoot, synthetic = false }) {
  const verified = await verifyFrozenResultIntegrity(resultRoot);
  assert.equal(verified.integrityVerifiedBeforePrivateLoad, true);
  const privateLoadStarted = true;
  const [truth, exactControls, distractors, rubric, frozenScorer, plan] = await Promise.all([
    readJson(path.join(benchmarkRoot, "ground-truth.json")),
    readJson(path.join(benchmarkRoot, "exact-source-controls.json")),
    readJson(path.join(benchmarkRoot, "distractor-controls.json")),
    readJson(path.join(benchmarkRoot, "scoring-rubric.json")),
    import(pathToFileURL(path.join(benchmarkRoot, "scripts", "score-results.mjs")).href),
    readJson(path.join(benchmarkRoot, "execution-plan.json"))
  ]);
  assert.equal(privateLoadStarted, true);
  const scores = [];
  for (const [index, run] of plan.runs.entries()) {
    const normalized = normalizeProductResponse({
      request: verified.requests[index],
      response: verified.responses[index],
      truth,
      exactControls,
      distractors,
      synthetic
    });
    const score = await frozenScorer.scoreResponseBytes(Buffer.from(stableJson(normalized), "utf8"), run);
    scores.push(score);
    await writeJsonExclusive(path.join(outputRoot, "per-run", `${run.runId}.json`), score);
  }
  const aggregate = frozenScorer.aggregateScoreRecords(scores, plan, rubric);
  await writeJsonExclusive(path.join(outputRoot, "aggregate-score.json"), aggregate);
  await writeJsonExclusive(path.join(outputRoot, "grading-boundary.json"), {
    schemaVersion: 1,
    frozenResultIntegrityVerifiedBeforePrivateLoad: true,
    aggregateResultSha256: verified.manifest.aggregateResultSha256,
    scoredRunCount: scores.length,
    synthetic
  });
  return { scores, aggregate };
}

async function cli() {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : "";
  };
  assert.ok(value("--result-root") && value("--out"), "usage: node grade-frozen-results.mjs --result-root <path> --out <path> [--synthetic]");
  const graded = await gradeFrozenResults({
    resultRoot: path.resolve(value("--result-root")),
    outputRoot: path.resolve(value("--out")),
    synthetic: args.includes("--synthetic")
  });
  process.stdout.write(`${JSON.stringify({ status: "PASS", scoredRunCount: graded.scores.length, productPassed: graded.aggregate.passed }, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
