import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifyFrozenResultIntegrity } from "./result-integrity.mjs";
import { validateGovernorProof } from "./governor-proof-validator.mjs";

const CURRENT_PROOF_SCHEMA_VERSION = "1.1";
const CATEGORY_DISPOSITIONS = new Set(["PASS", "FAIL", "NOT_APPLICABLE"]);
export const GOVERNOR_INTEGRITY_FAMILIES = Object.freeze({
  cognitiveEpisodeIntegrity: "Cognitive Episode Integrity",
  experienceRecordIntegrity: "Experience Record Integrity and Linkage",
  lessonCandidateIntegrityAndInertness: "Lesson Candidate Integrity and Inertness",
  ceilingCompliance: "Ceiling Compliance",
  terminalAgreement: "Terminal Agreement"
});

const REQUIRED_FAMILY_FIELDS = Object.freeze({
  cognitiveEpisodeIntegrity: ["disposition", "presence", "schemaVersion", "storedHash", "recalculatedHash", "hashMatch", "canonicalByteSize", "maximumByteSize", "byteCeilingPassed", "failures"],
  experienceRecordIntegrity: ["disposition", "presence", "storedHash", "recalculatedHash", "hashMatch", "linkedExperienceRecordHash", "linkageTargetHash", "linkMatch", "recordCount", "canonicalByteSize", "maximumByteSize", "byteCeilingPassed", "failures"],
  lessonCandidateIntegrityAndInertness: ["disposition", "presence", "allowedAbsence", "schemaVersion", "storedHash", "recalculatedHash", "hashMatch", "canonicalByteSize", "maximumByteSize", "byteCeilingPassed", "status", "statusUnvalidated", "promotionAuthorized", "promotionDisabled", "inert", "inertnessDisposition", "failures"],
  ceilingCompliance: ["disposition", "standardProviderRequests", "retailProviderRequests", "refinement", "directPage", "physicalRetry", "physicalProviderAttempts", "experienceRecord", "cognitiveEpisode", "lessonCandidate", "failures"],
  terminalAgreement: ["disposition", "selectedTerminalGovernorAction", "terminalDecision", "terminalStatus", "expectedTerminalStatus", "decisionPresentInSelectedSequence", "terminalTransitionRequired", "terminalTransitionPresent", "agreement", "failures"]
});

export function assertStructuredGovernorValidationResult(analysis = {}) {
  for (const [familyName] of Object.entries(GOVERNOR_INTEGRITY_FAMILIES)) {
    const family = analysis[familyName];
    assert.ok(family && typeof family === "object" && !Array.isArray(family), `Governor validation result is missing ${familyName}`);
    if (analysis.proofSchemaVersion === CURRENT_PROOF_SCHEMA_VERSION) {
      for (const field of REQUIRED_FAMILY_FIELDS[familyName]) {
        assert.ok(Object.hasOwn(family, field), `Governor validation result ${familyName} is missing ${field}`);
      }
    }
    assert.ok(CATEGORY_DISPOSITIONS.has(family.disposition), `${familyName} has an invalid disposition`);
    assert.ok(Array.isArray(family.failures), `${familyName} failures must be structured records`);
    if (family.disposition === "PASS") assert.equal(family.failures.length, 0, `${familyName} cannot pass with failures`);
    if (family.disposition === "FAIL") assert.ok(family.failures.length > 0, `${familyName} cannot fail without a structured reason`);
    if (family.disposition === "NOT_APPLICABLE") {
      assert.equal(familyName, "lessonCandidateIntegrityAndInertness", "Only an allowed absent Lesson Candidate may be not applicable");
      assert.equal(family.presence, "ABSENT");
      assert.equal(family.allowedAbsence, true);
    }
  }
  if (analysis.proofSchemaVersion === CURRENT_PROOF_SCHEMA_VERSION) {
    assert.equal(
      Object.keys(GOVERNOR_INTEGRITY_FAMILIES).every((familyName) => Boolean(analysis[familyName])),
      true,
      "A current-schema Governor result must expose every structured integrity family"
    );
  }
  return analysis;
}

function aggregateFamily(analyses, familyName, title) {
  const entries = analyses.map((analysis) => ({ analysis, family: analysis[familyName] }));
  const passed = entries.filter(({ family }) => family.disposition === "PASS");
  const failed = entries.filter(({ family }) => family.disposition === "FAIL");
  const notApplicable = entries.filter(({ family }) => family.disposition === "NOT_APPLICABLE");
  return {
    title,
    totalAnalysesEvaluated: entries.length,
    analysesPassed: passed.length,
    analysesFailed: failed.length,
    analysesNotApplicable: notApplicable.length,
    failedAnalysisIds: failed.map(({ analysis }) => analysis.runId),
    failureReasons: failed.map(({ analysis, family }) => ({
      runId: analysis.runId,
      objectId: analysis.objectId,
      reasons: family.failures.map((failure) => ({ ...failure }))
    })),
    disposition: failed.length > 0 ? "FAIL" : passed.length > 0 ? "PASS" : "NOT_APPLICABLE"
  };
}

export function buildGovernorReport({ productCommit, analyses = [] } = {}) {
  analyses.forEach(assertStructuredGovernorValidationResult);
  const integrityFamilies = Object.fromEntries(Object.entries(GOVERNOR_INTEGRITY_FAMILIES).map(([familyName, title]) => (
    [familyName, aggregateFamily(analyses, familyName, title)]
  )));
  const requiredFamilyFailure = Object.values(integrityFamilies).some((family) => family.disposition === "FAIL");
  const passed = analyses.every((entry) => entry.passed) && !requiredFamilyFailure;
  return {
    schemaVersion: 1,
    reportType: "BOUNDED_COGNITIVE_GOVERNOR_RESULT",
    productCommit,
    analysisCount: analyses.length,
    passedAnalysisCount: analyses.filter((entry) => entry.passed && !Object.keys(GOVERNOR_INTEGRITY_FAMILIES).some((familyName) => entry[familyName].disposition === "FAIL")).length,
    failedAnalysisCount: analyses.filter((entry) => !entry.passed || Object.keys(GOVERNOR_INTEGRITY_FAMILIES).some((familyName) => entry[familyName].disposition === "FAIL")).length,
    passed,
    governorProofDisposition: passed ? "PASS" : "FAIL",
    recalculatedCounts: {
      governorInvocationCounts: analyses.map((entry) => entry.recalculated?.governorInvocationCount ?? 0),
      authoritativeCognitiveStateCounts: analyses.map((entry) => entry.recalculated?.authoritativeCognitiveStateCount ?? 0)
    },
    integrity: {
      lifecycle: analyses.every((entry) => entry.integrity?.lifecycle === true),
      evaluationIdentity: analyses.every((entry) => entry.integrity?.evaluationIdentity === true),
      decisionSignatureUniqueness: analyses.every((entry) => entry.integrity?.decisionSignatureUniqueness === true),
      executionEventIdentity: analyses.every((entry) => entry.integrity?.executionEventIdentity === true),
      parentSignatureUse: analyses.every((entry) => entry.integrity?.parentSignatureUse === true),
      childParent: analyses.every((entry) => entry.integrity?.childParent === true),
      providerOwnership: analyses.every((entry) => entry.integrity?.providerOwnership === true),
      unauthorizedAction: analyses.every((entry) => entry.integrity?.unauthorizedAction === true),
      proofHash: analyses.every((entry) => entry.integrity?.proofHash === true),
      cognitiveEpisodeIntegrity: integrityFamilies.cognitiveEpisodeIntegrity.disposition === "PASS",
      experienceRecordIntegrity: integrityFamilies.experienceRecordIntegrity.disposition === "PASS",
      lessonCandidateIntegrityAndInertness: integrityFamilies.lessonCandidateIntegrityAndInertness.disposition !== "FAIL",
      ceilingCompliance: integrityFamilies.ceilingCompliance.disposition === "PASS",
      terminalAgreement: integrityFamilies.terminalAgreement.disposition === "PASS"
    },
    integrityFamilies,
    analyses
  };
}

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
  const report = buildGovernorReport({ productCommit: verified.manifest.productCommit, analyses });
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
