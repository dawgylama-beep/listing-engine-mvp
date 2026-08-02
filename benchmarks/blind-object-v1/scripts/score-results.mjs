import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { prepareRun } from "./prepare-run.mjs";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
};
const stableJson = (value) => JSON.stringify(canonical(value));
const normalize = (value) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const normalizedSet = (values = []) => new Set(values.map(normalize));
const overlap = (aMin, aMax, bMin, bMax) => Number.isFinite(aMin) && Number.isFinite(aMax) && Number.isFinite(bMin) && Number.isFinite(bMax) && Math.max(aMin, bMin) <= Math.min(aMax, bMax);

function finalizeResponseBytes(responseBytes, trace) {
  assert.ok(Buffer.isBuffer(responseBytes) && responseBytes.length > 0, "response bytes are required");
  const responseHash = createHash("sha256").update(responseBytes).digest("hex");
  trace.push("RESPONSE_FINALIZED_AND_HASHED");
  return { responseHash, response: JSON.parse(responseBytes.toString("utf8")) };
}

async function loadPrivateAnswerKey(trace) {
  assert.equal(trace.at(-1), "RESPONSE_FINALIZED_AND_HASHED", "answer key cannot load before response finalization and hashing");
  const [truth, rubric, exact, distractors] = await Promise.all([
    "ground-truth.json", "scoring-rubric.json", "exact-source-controls.json", "distractor-controls.json"
  ].map(async (name) => JSON.parse(await readFile(path.join(benchmarkRoot, name), "utf8"))));
  trace.push("PRIVATE_ANSWER_KEY_LOADED");
  return { truth, rubric, exact, distractors };
}

function scoreAgainstKey(finalized, key, expectedRun, trace) {
  assert.equal(trace.at(-1), "PRIVATE_ANSWER_KEY_LOADED");
  const response = finalized.response;
  assert.equal(response.caseId, expectedRun.caseId, "response case does not match run");
  assert.equal(response.purpose, expectedRun.purpose, "response purpose does not match run");
  const truth = key.truth.cases.find((entry) => entry.caseId === response.caseId);
  assert.ok(truth, `missing private truth for ${response.caseId}`);
  const exactControl = key.exact.cases.find((entry) => entry.caseId === response.caseId);
  const distractor = exactControl ? key.distractors.controls.find((entry) => entry.distractorId === exactControl.requiredDistractorId) : null;
  const failures = [];
  const addFailure = (code, detail, critical = false) => failures.push({ code, detail, critical });

  const breakdown = {};
  breakdown.identity = response.identityKey === truth.identityKey ? 20 : 0;
  if (truth.knownAnswerControl && breakdown.identity === 0) {
    addFailure("WRONG_KNOWN_ANSWER_CONTROL_SUBSTITUTION", `Expected identity key ${truth.identityKey}.`, true);
  }

  const responseUncertainties = normalizedSet(response.uncertainties);
  const expectedUncertainties = truth.unresolvedDetails.map(normalize);
  const acknowledgesUncertainty = expectedUncertainties.some((item) => responseUncertainties.has(item));
  const responseAlternatives = normalizedSet(response.plausibleAlternatives);
  const alternativeHits = truth.plausibleAlternatives.map(normalize).filter((item) => responseAlternatives.has(item)).length;
  const requiredAlternativeCount = truth.ambiguityContract?.minimumPlausibleAlternatives ?? 1;
  breakdown.uncertaintyAndAlternatives = (acknowledgesUncertainty ? 5 : 0) + (alternativeHits >= requiredAlternativeCount ? 5 : 0);

  const claimedExactSources = new Set(response.exactSourceIds ?? []);
  const rejectedDistractors = new Set(response.rejectedDistractorIds ?? []);
  if (exactControl) {
    const eligibleIds = new Set(exactControl.sources.map((entry) => entry.sourceId));
    const recovered = [...claimedExactSources].some((sourceId) => eligibleIds.has(sourceId));
    const rejected = rejectedDistractors.has(exactControl.requiredDistractorId);
    breakdown.exactEvidenceRecovery = recovered && rejected ? 15 : recovered ? 10 : rejected ? 5 : 0;
  } else {
    breakdown.exactEvidenceRecovery = response.exactEvidenceNotApplicable === true ? 15 : 0;
  }

  const allSourceOwners = new Map();
  for (const entry of key.exact.cases) for (const source of entry.sources) allSourceOwners.set(source.sourceId, entry.caseId);
  for (const entry of key.distractors.controls) allSourceOwners.set(entry.distractorId, entry.caseId);
  const associations = response.evidenceAssociations ?? [];
  const badAssociations = associations.filter((entry) => allSourceOwners.get(entry.sourceId) !== entry.caseId || entry.caseId !== response.caseId);
  const unknownAssociations = associations.filter((entry) => !allSourceOwners.has(entry.sourceId));
  breakdown.evidenceAssociation = badAssociations.length === 0 ? 10 : Math.max(0, 10 - (badAssociations.length * 5));
  for (const association of unknownAssociations) addFailure("INVENTED_SOURCE", `Unknown source ID ${association.sourceId}.`, true);
  for (const source of response.inventedSources ?? []) addFailure("INVENTED_SOURCE", `Invented source assertion: ${source}.`, true);
  for (const fact of response.inventedTransactionFacts ?? []) addFailure("INVENTED_TRANSACTION_FACT", `Invented transaction assertion: ${fact}.`, true);

  const expectedValue = truth.supportedValuationRange;
  const actualValue = response.valuation ?? {};
  const statusPoints = actualValue.status === expectedValue.status ? 10 : 0;
  const rangePoints = expectedValue.min === null && expectedValue.max === null
    ? (actualValue.min === null && actualValue.max === null ? 5 : 0)
    : (overlap(actualValue.min, actualValue.max, expectedValue.min, expectedValue.max) ? 5 : 0);
  breakdown.marketInterpretationAndValuation = statusPoints + rangePoints;

  breakdown.purposeSpecificJudgment = response.recommendationCode === truth.expectedRecommendations[response.purpose] ? 10 : 0;
  const expectedActions = truth.minimumPracticalActionPlanElements.map(normalize);
  const actualActions = normalizedSet(response.actionPlanElements);
  const actionHits = expectedActions.filter((item) => actualActions.has(item)).length;
  breakdown.practicalActionPlan = Math.round((10 * actionHits) / expectedActions.length);
  breakdown.confidenceCalibration = Number.isFinite(response.confidence) && response.confidence >= truth.expectedConfidence.min && response.confidence <= truth.expectedConfidence.max ? 10 : 0;

  if (truth.ambiguityContract) {
    const confidentFalseExact = response.assertsUnsupportedExact === true || (
      response.exactIdentityClaim && response.confidence > truth.ambiguityContract.maximumAcceptableConfidence
    );
    if (confidentFalseExact) addFailure("CONFIDENT_FALSE_EXACT_ON_AMBIGUOUS_CASE", "An unresolved function was asserted as exact or above the frozen confidence ceiling.", true);
  }
  if (truth.damagedContract && response.safetyDisposition !== truth.damagedContract.requiredSafetyDisposition) {
    addFailure("UNSAFE_DAMAGED_OBJECT_RECOMMENDATION", "The required remove-from-service disposition was not preserved.", true);
  }
  if (distractor && claimedExactSources.has(distractor.distractorId)) {
    addFailure("DISTRACTOR_ACCEPTED_AS_EXACT", `${distractor.distractorId} was accepted despite its frozen mismatch reason.`, false);
  }

  const sectionOrder = key.rubric.sections.map((entry) => entry.key);
  assert.deepEqual(Object.keys(breakdown), sectionOrder, "scorer section order diverges from frozen rubric");
  const totalScore = Object.values(breakdown).reduce((sum, value) => sum + value, 0);
  const criticalFailures = failures.filter((entry) => entry.critical);
  if (totalScore < key.rubric.thresholds.overallScoreMinimum) addFailure("OVERALL_SCORE_BELOW_THRESHOLD", `${totalScore} is below ${key.rubric.thresholds.overallScoreMinimum}.`, false);
  trace.push("DETERMINISTIC_SCORING_COMPLETED");
  return {
    schemaVersion: 1,
    benchmarkId: key.truth.benchmarkId,
    runId: expectedRun.runId,
    runType: expectedRun.runType,
    identityInvariantGroup: expectedRun.identityInvariantGroup,
    caseId: response.caseId,
    purpose: response.purpose,
    responseHash: finalized.responseHash,
    eventTrace: [...trace],
    answerKeyLoadedOnlyAfterResponseHash: trace.indexOf("RESPONSE_FINALIZED_AND_HASHED") < trace.indexOf("PRIVATE_ANSWER_KEY_LOADED"),
    breakdown,
    totalScore,
    passed: totalScore >= key.rubric.thresholds.overallScoreMinimum && criticalFailures.length === 0,
    failureReport: failures,
    criticalFailureCount: criticalFailures.length,
    metrics: {
      identityCapable: breakdown.identity >= 16,
      exactEligible: Boolean(exactControl),
      exactRecoveredAndDistractorRejected: exactControl ? breakdown.exactEvidenceRecovery === 15 : null,
      evidenceAssociationsCorrect: associations.length - badAssociations.length,
      evidenceAssociationsTotal: associations.length,
      distractorRejected: exactControl ? rejectedDistractors.has(exactControl.requiredDistractorId) : null,
      actionElementsMatched: actionHits,
      actionElementsRequired: expectedActions.length,
      confidenceCalibrated: breakdown.confidenceCalibration === 10,
      reportedIdentityKey: response.identityKey,
      confidentFalseExactCount: failures.filter((entry) => entry.code === "CONFIDENT_FALSE_EXACT_ON_AMBIGUOUS_CASE").length,
      wrongKnownAnswerSubstitutionCount: failures.filter((entry) => entry.code === "WRONG_KNOWN_ANSWER_CONTROL_SUBSTITUTION").length,
      inventedSourceOrTransactionFactCount: failures.filter((entry) => entry.code === "INVENTED_SOURCE" || entry.code === "INVENTED_TRANSACTION_FACT").length
    }
  };
}

export async function scoreResponseBytes(responseBytes, expectedRun) {
  const trace = [];
  const finalized = finalizeResponseBytes(responseBytes, trace);
  const key = await loadPrivateAnswerKey(trace);
  return scoreAgainstKey(finalized, key, expectedRun, trace);
}

const percent = (numerator, denominator) => denominator === 0 ? 100 : (100 * numerator) / denominator;

export function aggregateScoreRecords(records, plan, rubric) {
  assert.equal(records.length, plan.totalPlannedRunCount, `expected ${plan.totalPlannedRunCount} scored runs`);
  assert.deepEqual(records.map((entry) => entry.runId).sort(), plan.runs.map((entry) => entry.runId).sort(), "scored run IDs differ from the frozen plan");
  assert.equal(new Set(records.map((entry) => entry.runId)).size, records.length, "duplicate scored run ID");
  const principal = records.filter((entry) => entry.runType === "PRINCIPAL");
  const exactPrincipal = principal.filter((entry) => entry.metrics.exactEligible);
  const evidenceCorrect = records.reduce((sum, entry) => sum + entry.metrics.evidenceAssociationsCorrect, 0);
  const evidenceTotal = records.reduce((sum, entry) => sum + entry.metrics.evidenceAssociationsTotal, 0);
  const actionMatched = records.reduce((sum, entry) => sum + entry.metrics.actionElementsMatched, 0);
  const actionRequired = records.reduce((sum, entry) => sum + entry.metrics.actionElementsRequired, 0);
  const anchorConsistency = plan.purposeInvarianceAnchorIds.filter((caseId) => {
    const anchorRecords = records.filter((entry) => entry.caseId === caseId);
    return anchorRecords.length === 4 && new Set(anchorRecords.map((entry) => entry.metrics.reportedIdentityKey)).size === 1;
  }).length;
  const metrics = {
    overallScore: records.reduce((sum, entry) => sum + entry.totalScore, 0) / records.length,
    identityCapabilityPercent: percent(principal.filter((entry) => entry.metrics.identityCapable).length, principal.length),
    exactEvidenceRecoveryPercent: percent(exactPrincipal.filter((entry) => entry.metrics.exactRecoveredAndDistractorRejected).length, exactPrincipal.length),
    evidenceAssociationCorrectnessPercent: percent(evidenceCorrect, evidenceTotal),
    similarSourceRejectionPercent: percent(exactPrincipal.filter((entry) => entry.metrics.distractorRejected).length, exactPrincipal.length),
    purposeInvarianceIdentityConsistencyPercent: percent(anchorConsistency, plan.purposeInvarianceAnchorIds.length),
    actionPlanCompletenessPercent: percent(actionMatched, actionRequired),
    confidenceCalibrationPercent: percent(records.filter((entry) => entry.metrics.confidenceCalibrated).length, records.length),
    confidentFalseExactsOnAmbiguousCase: records.reduce((sum, entry) => sum + entry.metrics.confidentFalseExactCount, 0),
    wrongKnownAnswerControlSubstitutions: records.reduce((sum, entry) => sum + entry.metrics.wrongKnownAnswerSubstitutionCount, 0),
    inventedSourcesOrTransactionFacts: records.reduce((sum, entry) => sum + entry.metrics.inventedSourceOrTransactionFactCount, 0)
  };
  const thresholds = rubric.thresholds;
  const gates = {
    overallScore: metrics.overallScore >= thresholds.overallScoreMinimum,
    identityCapability: metrics.identityCapabilityPercent >= thresholds.identityCapabilityMinimumPercent,
    exactEvidenceRecovery: metrics.exactEvidenceRecoveryPercent >= thresholds.exactEvidenceRecoveryMinimumPercent,
    evidenceAssociationCorrectness: metrics.evidenceAssociationCorrectnessPercent >= thresholds.evidenceAssociationCorrectnessMinimumPercent,
    similarSourceRejection: metrics.similarSourceRejectionPercent >= thresholds.similarSourceRejectionMinimumPercent,
    purposeInvarianceIdentityConsistency: metrics.purposeInvarianceIdentityConsistencyPercent >= thresholds.purposeInvarianceIdentityConsistencyRequiredPercent,
    actionPlanCompleteness: metrics.actionPlanCompletenessPercent >= thresholds.actionPlanCompletenessMinimumPercent,
    confidenceCalibration: metrics.confidenceCalibrationPercent >= thresholds.confidenceCalibrationMinimumPercent,
    confidentFalseExactsOnAmbiguousCase: metrics.confidentFalseExactsOnAmbiguousCase <= thresholds.confidentFalseExactsOnAmbiguousCaseMaximum,
    wrongKnownAnswerControlSubstitutions: metrics.wrongKnownAnswerControlSubstitutions <= thresholds.wrongKnownAnswerControlSubstitutionsMaximum,
    inventedSourcesOrTransactionFacts: metrics.inventedSourcesOrTransactionFacts <= thresholds.inventedSourcesOrTransactionFactsMaximum
  };
  return {
    schemaVersion: 1,
    benchmarkId: plan.benchmarkId,
    scoredRunCount: records.length,
    metrics,
    gates,
    passed: Object.values(gates).every(Boolean),
    failureReport: Object.entries(gates).filter(([, passed]) => !passed).map(([gate]) => ({ gate, actual: metrics[gate] ?? null }))
  };
}

async function loadPlan() {
  return JSON.parse(await readFile(path.join(benchmarkRoot, "execution-plan.json"), "utf8"));
}

async function loadRun(runId) {
  const plan = await loadPlan();
  const run = plan.runs.find((entry) => entry.runId === runId);
  assert.ok(run, `unknown run: ${runId}`);
  return run;
}

async function selfTest() {
  const prepared = await prepareRun("RUN-014", { synthetic: true });
  assert.deepEqual(prepared.loadedFiles, ["input-cases.json", "execution-plan.json", "manifest.json"]);
  assert.equal(prepared.privateGroundTruthLoaded, false);
  assert.equal(prepared.networkCallOccurred, false);
  assert.equal(prepared.providerCallOccurred, false);

  const goodResponse = {
    caseId: "OBJ-014",
    purpose: "MARKETPLACE_LISTING",
    identityKey: "roman-pentagonal-dodecahedron-function-unresolved",
    exactIdentityClaim: null,
    assertsUnsupportedExact: false,
    uncertainties: ["original function"],
    plausibleAlternatives: ["measuring, calibration, or range-estimation device", "ritual or symbolic object"],
    exactEvidenceNotApplicable: true,
    exactSourceIds: [],
    rejectedDistractorIds: [],
    evidenceAssociations: [],
    valuation: { status: "NOT_APPLICABLE_MUSEUM_ARTIFACT", currency: null, min: null, max: null },
    recommendationCode: "DO_NOT_CREATE_MARKETPLACE_LISTING_FOR_THE_DOCUMENTED_MUSEUM_ARTIFACT",
    actionPlanElements: [
      "identify the holding institution and accession record",
      "document provenance and title",
      "treat proposed functions as hypotheses",
      "consult an archaeologist or museum curator",
      "check cultural-property law before any transaction"
    ],
    confidence: 0.62,
    inventedSources: [],
    inventedTransactionFacts: []
  };
  const goodBytes = Buffer.from(stableJson(goodResponse), "utf8");
  const good = await scoreResponseBytes(goodBytes, await loadRun("RUN-014"));
  const deterministicRepeat = await scoreResponseBytes(goodBytes, await loadRun("RUN-014"));
  assert.deepEqual(deterministicRepeat, good, "same finalized response must produce the same score and report");
  assert.equal(good.totalScore, 100);
  assert.equal(good.passed, true);
  assert.equal(good.answerKeyLoadedOnlyAfterResponseHash, true);

  const badResponse = {
    ...goodResponse,
    identityKey: "roman-knitting-spool",
    exactIdentityClaim: "definitive Roman glove-knitting tool",
    assertsUnsupportedExact: true,
    uncertainties: [],
    plausibleAlternatives: [],
    valuation: { status: "PRIVATE_MARKET_VALUE", currency: "USD", min: 10000, max: 20000 },
    recommendationCode: "LIST_AS_RARE_ROMAN_KNITTING_TOOL",
    actionPlanElements: [],
    confidence: 0.99,
    inventedSources: ["EXACT-ROMAN-KNITTING-AUCTION"],
    inventedTransactionFacts: ["sold for USD 18,000"]
  };
  const bad = await scoreResponseBytes(Buffer.from(stableJson(badResponse), "utf8"), await loadRun("RUN-014"));
  assert.equal(bad.passed, false);
  assert.ok(bad.failureReport.some((entry) => entry.code === "CONFIDENT_FALSE_EXACT_ON_AMBIGUOUS_CASE" && entry.critical));
  assert.ok(bad.failureReport.some((entry) => entry.code === "INVENTED_SOURCE" && entry.critical));
  assert.ok(bad.failureReport.some((entry) => entry.code === "INVENTED_TRANSACTION_FACT" && entry.critical));

  const [plan, rubric] = await Promise.all([loadPlan(), JSON.parse(await readFile(path.join(benchmarkRoot, "scoring-rubric.json"), "utf8"))]);
  const exactCaseIds = new Set(["OBJ-001", "OBJ-002", "OBJ-003", "OBJ-004", "OBJ-005", "OBJ-006", "OBJ-011", "OBJ-012"]);
  const syntheticScoreRecords = plan.runs.map((run) => ({
    runId: run.runId,
    runType: run.runType,
    identityInvariantGroup: run.identityInvariantGroup,
    caseId: run.caseId,
    totalScore: 100,
    metrics: {
      identityCapable: true,
      exactEligible: exactCaseIds.has(run.caseId),
      exactRecoveredAndDistractorRejected: exactCaseIds.has(run.caseId) ? true : null,
      evidenceAssociationsCorrect: exactCaseIds.has(run.caseId) ? 1 : 0,
      evidenceAssociationsTotal: exactCaseIds.has(run.caseId) ? 1 : 0,
      distractorRejected: exactCaseIds.has(run.caseId) ? true : null,
      actionElementsMatched: 4,
      actionElementsRequired: 4,
      confidenceCalibrated: true,
      reportedIdentityKey: `synthetic-${run.caseId}`,
      confidentFalseExactCount: 0,
      wrongKnownAnswerSubstitutionCount: 0,
      inventedSourceOrTransactionFactCount: 0
    }
  }));
  const aggregatePass = aggregateScoreRecords(syntheticScoreRecords, plan, rubric);
  assert.equal(aggregatePass.passed, true);
  const aggregateFailureRecords = structuredClone(syntheticScoreRecords);
  aggregateFailureRecords.find((entry) => entry.runId === "RUN-024").metrics.reportedIdentityKey = "synthetic-inconsistent-identity";
  const aggregateFailure = aggregateScoreRecords(aggregateFailureRecords, plan, rubric);
  assert.equal(aggregateFailure.passed, false);
  assert.equal(aggregateFailure.gates.purposeInvarianceIdentityConsistency, false);

  return {
    validator: "score-results-synthetic-dry-run",
    status: "PASS",
    requestPreparation: {
      runId: prepared.requestPayload.runId,
      payloadHash: prepared.payloadHash,
      loadedFiles: prepared.loadedFiles,
      privateGroundTruthLoaded: prepared.privateGroundTruthLoaded,
      networkCallOccurred: prepared.networkCallOccurred,
      providerCallOccurred: prepared.providerCallOccurred
    },
    responseHashing: { deterministicHash: good.responseHash, repeatMatched: deterministicRepeat.responseHash === good.responseHash },
    answerKeySeparation: { passed: good.answerKeyLoadedOnlyAfterResponseHash, eventTrace: good.eventTrace },
    deterministicScoring: { goodScore: good.totalScore, repeatMatched: stableJson(deterministicRepeat) === stableJson(good) },
    failureReporting: { badScore: bad.totalScore, passed: bad.passed, reportedCodes: bad.failureReport.map((entry) => entry.code) },
    aggregation: { passingRunCount: aggregatePass.scoredRunCount, passingAllGates: aggregatePass.passed, identityInvarianceFailureReported: aggregateFailure.failureReport.some((entry) => entry.gate === "purposeInvarianceIdentityConsistency") },
    productOrProviderCallsOccurred: false
  };
}

async function cli() {
  const args = process.argv.slice(2);
  if (args.includes("--self-test")) {
    process.stdout.write(`${JSON.stringify(await selfTest(), null, 2)}\n`);
    return;
  }
  const value = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const responsePath = value("--response");
  const runId = value("--run");
  const out = value("--out");
  const aggregatePath = value("--aggregate");
  if (aggregatePath) {
    const [records, plan, rubric] = await Promise.all([
      JSON.parse(await readFile(path.resolve(aggregatePath), "utf8")),
      loadPlan(),
      JSON.parse(await readFile(path.join(benchmarkRoot, "scoring-rubric.json"), "utf8"))
    ]);
    assert.ok(Array.isArray(records), "aggregate input must be an array of per-run score records");
    const rendered = `${JSON.stringify(aggregateScoreRecords(records, plan, rubric), null, 2)}\n`;
    if (out) await writeFile(path.resolve(out), rendered, { encoding: "utf8", flag: "wx" });
    else process.stdout.write(rendered);
    return;
  }
  assert.ok(responsePath && runId, "usage: node score-results.mjs --response response.json --run RUN-### [--out score.json]");
  const result = await scoreResponseBytes(await readFile(path.resolve(responsePath)), await loadRun(runId));
  const rendered = `${JSON.stringify(result, null, 2)}\n`;
  if (out) await writeFile(path.resolve(out), rendered, { encoding: "utf8", flag: "wx" });
  else process.stdout.write(rendered);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
