import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const load = async (name) => JSON.parse(await readFile(path.join(benchmarkRoot, name), "utf8"));
const [freeze, manifest, input, truth, rubric, plan, provenance, exact, distractors] = await Promise.all([
  "FREEZE.json", "manifest.json", "input-cases.json", "ground-truth.json", "scoring-rubric.json", "execution-plan.json", "provenance.json", "exact-source-controls.json", "distractor-controls.json"
].map(load));

const expectedTypes = [
  "Ordinary retail packaged product",
  "Household object",
  "Tool",
  "Electronic device",
  "Furniture",
  "Clothing or accessory",
  "Used everyday item",
  "Vintage item",
  "Collectible",
  "Branded advertising object",
  "Known-answer control object A",
  "Known-answer control object B",
  "Dirty, damaged, incomplete, or obscured object",
  "Genuinely ambiguous object where uncertainty is the correct answer"
];
const expectedThresholds = {
  overallScoreMinimum: 80,
  identityCapabilityMinimumPercent: 80,
  exactEvidenceRecoveryMinimumPercent: 70,
  evidenceAssociationCorrectnessMinimumPercent: 95,
  similarSourceRejectionMinimumPercent: 90,
  purposeInvarianceIdentityConsistencyRequiredPercent: 100,
  actionPlanCompletenessMinimumPercent: 80,
  confidenceCalibrationMinimumPercent: 75,
  confidentFalseExactsOnAmbiguousCaseMaximum: 0,
  wrongKnownAnswerControlSubstitutionsMaximum: 0,
  inventedSourcesOrTransactionFactsMaximum: 0
};
const requiredTruthKeys = [
  "caseId", "objectType", "identityKey", "bestSupportedIdentity", "broaderIdentity", "exactIdentity", "acceptedAliases",
  "rejectedFalseExactIdentities", "visibleSupportingDetails", "unresolvedDetails", "plausibleAlternatives", "conditionFacts",
  "exactVsDesignFamilyBoundary", "knownExactSources", "knownSimilarOrDistractorSources", "supportedValuationRange",
  "expectedRecommendations", "minimumPracticalActionPlanElements", "expectedConfidence", "provenanceAndVerifierNotes",
  "knownAnswerControl", "damagedContract", "ambiguityContract"
];
const countBy = (items, field) => Object.fromEntries([...new Set(items.map((entry) => entry[field]))].sort().map((value) => [value, items.filter((entry) => entry[field] === value).length]));

for (const document of [freeze, manifest, input, truth, rubric, plan, provenance, exact, distractors]) {
  assert.equal(document.schemaVersion, 1);
  assert.equal(document.benchmarkId, "blind-object-v1");
}
assert.equal(freeze.frozen, true);
assert.equal(freeze.version, "1.12.1");
assert.equal(freeze.productOrProviderCallsOccurred, false);
assert.equal(freeze.phase3BExecuted, false);
assert.equal(freeze.syntheticDryRunStatus, "PASS");
assert.equal(freeze.syntheticDryRunResult.answerKeyLoadedOnlyAfterResponseHash, true);
assert.equal(freeze.syntheticDryRunResult.deterministicRepeatMatched, true);
assert.equal(freeze.syntheticDryRunResult.criticalFailureReportingProved, true);
assert.equal(freeze.syntheticDryRunResult.networkOrProviderCallOccurred, false);
assert.equal(input.cases.length, 14);
assert.deepEqual(input.cases.map((entry) => entry.caseId), Array.from({ length: 14 }, (_, index) => `OBJ-${String(index + 1).padStart(3, "0")}`));
assert.deepEqual(countBy(input.cases, "lane"), { BARCODE_OR_MODEL: 2, PHOTO_ONLY: 8, PHOTO_PLUS_VISIBLE_MARKINGS: 4 });
const purposeCounts = countBy(input.cases, "principalPurpose");
assert.deepEqual(purposeCounts, { MARKETPLACE_LISTING: 3, PERSONAL_BUY: 4, RESALE: 4, WHATS_IT_WORTH: 3 });
assert.ok(Object.values(purposeCounts).every((count) => count >= 3));

const imageCount = input.cases.reduce((sum, entry) => sum + entry.images.length, 0);
assert.ok(input.cases.every((entry) => entry.images.length >= 2 && entry.images.length <= 4));
assert.equal(imageCount, 29);
assert.ok(imageCount >= 28 && imageCount <= 56);
assert.equal(manifest.assets.length, imageCount);
assert.equal(manifest.corpusHash, freeze.corpusHash);

assert.equal(truth.cases.length, 14);
assert.deepEqual(truth.cases.map((entry) => entry.objectType), expectedTypes);
for (const entry of truth.cases) {
  assert.ok(requiredTruthKeys.every((key) => Object.hasOwn(entry, key)), `${entry.caseId}: incomplete ground truth`);
  assert.ok(entry.bestSupportedIdentity && entry.broaderIdentity && entry.identityKey);
  assert.ok(entry.acceptedAliases.length > 0 && entry.rejectedFalseExactIdentities.length > 0);
  assert.ok(entry.visibleSupportingDetails.length > 0 && entry.unresolvedDetails.length > 0 && entry.plausibleAlternatives.length > 0 && entry.conditionFacts.length > 0);
  assert.ok(entry.exactVsDesignFamilyBoundary && entry.provenanceAndVerifierNotes);
  assert.ok(entry.minimumPracticalActionPlanElements.length >= 4);
  assert.ok(entry.expectedConfidence.min >= 0 && entry.expectedConfidence.max <= 1 && entry.expectedConfidence.min <= entry.expectedConfidence.max);
  const principalPurpose = input.cases.find((candidate) => candidate.caseId === entry.caseId).principalPurpose;
  assert.ok(entry.expectedRecommendations[principalPurpose], `${entry.caseId}: missing principal-purpose recommendation`);
}
assert.deepEqual(truth.cases.filter((entry) => entry.knownAnswerControl).map((entry) => entry.caseId), ["OBJ-011", "OBJ-012"]);
const damaged = truth.cases.find((entry) => entry.caseId === "OBJ-013").damagedContract;
assert.ok(damaged && damaged.requiredDamageFacts.length >= 2 && damaged.requiredSafetyDisposition && damaged.unsafeRecommendationIsCriticalFailure);
const ambiguous = truth.cases.find((entry) => entry.caseId === "OBJ-014").ambiguityContract;
assert.ok(ambiguous && ambiguous.usefulBroaderIdentification && ambiguous.minimumPlausibleAlternatives >= 2);
assert.ok(ambiguous.whyExactUnsupported && ambiguous.additionalEvidenceNeeded.length >= 2);
assert.ok(ambiguous.maximumAcceptableConfidence <= 0.65 && ambiguous.confidentUnsupportedExactIsCriticalFailure);

assert.equal(plan.principalRunCount, 14);
assert.equal(plan.additionalAnchorPurposeRunCount, 12);
assert.equal(plan.totalPlannedRunCount, 26);
assert.equal(plan.runs.length, 26);
assert.equal(plan.executionAuthorized, false);
assert.deepEqual(plan.purposeInvarianceAnchorIds, ["OBJ-001", "OBJ-003", "OBJ-008", "OBJ-014"]);
assert.equal(new Set(plan.purposeInvarianceAnchorIds).size, 4);
for (const anchorId of plan.purposeInvarianceAnchorIds) {
  assert.deepEqual(plan.runs.filter((entry) => entry.caseId === anchorId).map((entry) => entry.purpose).sort(), ["MARKETPLACE_LISTING", "PERSONAL_BUY", "RESALE", "WHATS_IT_WORTH"]);
}

assert.equal(exact.eligibleCaseCount, 8);
assert.equal(exact.cases.length, 8);
assert.deepEqual(exact.cases.map((entry) => entry.caseId), ["OBJ-001", "OBJ-002", "OBJ-003", "OBJ-004", "OBJ-005", "OBJ-006", "OBJ-011", "OBJ-012"]);
const exactSourceIds = new Set();
for (const entry of exact.cases) {
  assert.ok(entry.sources.length >= 1);
  assert.ok(entry.requiredDistractorId);
  for (const source of entry.sources) {
    assert.match(source.sourceId, /^EXACT-OBJ-\d{3}-[A-Z]$/);
    assert.ok(!exactSourceIds.has(source.sourceId));
    exactSourceIds.add(source.sourceId);
    assert.ok(source.url.startsWith("https://") && source.sourceStatus && source.packageModelVariation && source.captureDate && source.exactnessBasis);
    assert.ok(Object.hasOwn(source, "price") && Object.hasOwn(source, "shipping"));
  }
}
assert.equal(distractors.distractorCount, 8);
assert.equal(distractors.controls.length, 8);
assert.deepEqual(distractors.controls.map((entry) => entry.distractorId), exact.cases.map((entry) => entry.requiredDistractorId));
assert.ok(distractors.controls.every((entry) => entry.url.startsWith("https://") && entry.whyNotSame && entry.plausibility && entry.mustRejectAsExact));

for (const entry of truth.cases) {
  assert.ok(entry.knownExactSources.every((sourceId) => exactSourceIds.has(sourceId)), `${entry.caseId}: unknown exact source ID`);
}
assert.equal(rubric.totalPoints, 100);
assert.equal(rubric.sections.reduce((sum, section) => sum + section.points, 0), 100);
assert.deepEqual(rubric.sections.map((entry) => entry.points), [20, 10, 15, 10, 15, 10, 10, 10]);
assert.deepEqual(rubric.thresholds, expectedThresholds);
assert.equal(rubric.frozenBeforeProductResults, true);
assert.equal(provenance.assets.length, 29);

const contractHash = createHash("sha256").update(JSON.stringify({
  inputCases: input,
  executionPlan: plan,
  scoringRubric: rubric,
  exactSourceControls: exact,
  distractorControls: distractors
})).digest("hex");
assert.equal(freeze.contractHash, contractHash);

console.log(JSON.stringify({
  validator: "validate-freeze",
  status: "PASS",
  cases: 14,
  objectTypes: 14,
  images: imageCount,
  lanes: countBy(input.cases, "lane"),
  purposes: purposeCounts,
  anchors: plan.purposeInvarianceAnchorIds,
  exactSourceCaseIds: exact.cases.map((entry) => entry.caseId),
  plannedRuns: plan.runs.length,
  rubricPoints: rubric.totalPoints,
  thresholds: rubric.thresholds,
  corpusHash: manifest.corpusHash,
  contractHash
}, null, 2));
