import assert from "node:assert/strict";
import test from "node:test";
import {
  GOVERNOR_INTEGRITY_FAMILIES,
  assertStructuredGovernorValidationResult,
  buildGovernorReport
} from "../benchmarks/blind-object-v1-execution-v1/scripts/grade-governor-results.mjs";

function failure(code) {
  return { code, detail: `${code} synthetic report-shape failure`, actual: 2, maximum: 1 };
}

function familyFixtures() {
  return {
    cognitiveEpisodeIntegrity: {
      disposition: "PASS", presence: "PRESENT", schemaVersion: "1.0",
      storedHash: "a", recalculatedHash: "a", hashMatch: true,
      canonicalByteSize: 100, maximumByteSize: 32768, byteCeilingPassed: true, failures: []
    },
    experienceRecordIntegrity: {
      disposition: "PASS", presence: "PRESENT", storedHash: "b", recalculatedHash: "b", hashMatch: true,
      linkedExperienceRecordHash: "b", linkageTargetHash: "b", linkMatch: true, recordCount: 1,
      canonicalByteSize: 100, maximumByteSize: 65536, byteCeilingPassed: true, failures: []
    },
    lessonCandidateIntegrityAndInertness: {
      disposition: "PASS", presence: "PRESENT", allowedAbsence: false, schemaVersion: "1.0",
      storedHash: "c", recalculatedHash: "c", hashMatch: true,
      canonicalByteSize: 100, maximumByteSize: 8192, byteCeilingPassed: true,
      status: "UNVALIDATED", statusUnvalidated: true, promotionAuthorized: false,
      promotionDisabled: true, inert: true, inertnessDisposition: "PASS", failures: []
    },
    ceilingCompliance: {
      disposition: "PASS",
      standardProviderRequests: {}, retailProviderRequests: {}, refinement: {}, directPage: {},
      physicalRetry: {}, physicalProviderAttempts: {}, experienceRecord: {}, cognitiveEpisode: {}, lessonCandidate: {}, failures: []
    },
    terminalAgreement: {
      disposition: "PASS", selectedTerminalGovernorAction: "STOP_COMPLETE",
      terminalDecision: { actionType: "STOP_COMPLETE" }, terminalStatus: "COMPLETE",
      expectedTerminalStatus: "COMPLETE", decisionPresentInSelectedSequence: true,
      terminalTransitionRequired: true, terminalTransitionPresent: true, agreement: true, failures: []
    }
  };
}

function analysis(runId = "RUN-001", objectId = "OBJ-001") {
  return {
    runId,
    objectId,
    proofSchemaVersion: "1.1",
    passed: true,
    failures: [],
    recalculated: { governorInvocationCount: 1, authoritativeCognitiveStateCount: 1, unauthorizedActionCount: 0 },
    integrity: {
      lifecycle: true,
      evaluationIdentity: true,
      decisionSignatureUniqueness: true,
      executionEventIdentity: true,
      parentSignatureUse: true,
      childParent: true,
      providerOwnership: true,
      unauthorizedAction: true,
      proofHash: true
    },
    ...familyFixtures()
  };
}

function failFamily(entry, familyName, code) {
  entry[familyName] = {
    ...entry[familyName],
    disposition: "FAIL",
    failures: [failure(code)]
  };
  entry.passed = false;
  entry.failures.push(failure(code));
  return entry;
}

test("current-schema report validation rejects a missing structured category", () => {
  const entry = analysis();
  delete entry.cognitiveEpisodeIntegrity;
  assert.throws(() => assertStructuredGovernorValidationResult(entry), /missing cognitiveEpisodeIntegrity/);
  assert.throws(() => buildGovernorReport({ productCommit: "a".repeat(40), analyses: [entry] }), /missing cognitiveEpisodeIntegrity/);
});

test("aggregate report retains every successful integrity family", () => {
  const report = buildGovernorReport({ productCommit: "a".repeat(40), analyses: [analysis()] });
  assert.equal(report.governorProofDisposition, "PASS");
  assert.deepEqual(Object.keys(report.integrityFamilies), Object.keys(GOVERNOR_INTEGRITY_FAMILIES));
  for (const family of Object.values(report.integrityFamilies)) {
    assert.equal(family.totalAnalysesEvaluated, 1);
    assert.equal(family.analysesPassed, 1);
    assert.equal(family.analysesFailed, 0);
    assert.equal(family.disposition, "PASS");
  }
});

test("aggregate report counts PASS, FAIL, and allowed Lesson NOT_APPLICABLE", () => {
  const valid = analysis("RUN-001", "OBJ-001");
  const failed = failFamily(analysis("RUN-002", "OBJ-002"), "cognitiveEpisodeIntegrity", "COGNITIVE_EPISODE_HASH_INVALID");
  const absentLesson = analysis("RUN-003", "OBJ-003");
  absentLesson.lessonCandidateIntegrityAndInertness = {
    ...absentLesson.lessonCandidateIntegrityAndInertness,
    disposition: "NOT_APPLICABLE",
    presence: "ABSENT",
    allowedAbsence: true,
    schemaVersion: null,
    storedHash: null,
    recalculatedHash: null,
    hashMatch: null,
    canonicalByteSize: null,
    maximumByteSize: null,
    byteCeilingPassed: null,
    status: null,
    statusUnvalidated: null,
    promotionAuthorized: null,
    promotionDisabled: null,
    inert: null,
    inertnessDisposition: "NOT_APPLICABLE"
  };
  const report = buildGovernorReport({ productCommit: "b".repeat(40), analyses: [valid, failed, absentLesson] });
  assert.equal(report.integrityFamilies.cognitiveEpisodeIntegrity.analysesPassed, 2);
  assert.equal(report.integrityFamilies.cognitiveEpisodeIntegrity.analysesFailed, 1);
  assert.deepEqual(report.integrityFamilies.cognitiveEpisodeIntegrity.failedAnalysisIds, ["RUN-002"]);
  assert.equal(report.integrityFamilies.lessonCandidateIntegrityAndInertness.analysesPassed, 2);
  assert.equal(report.integrityFamilies.lessonCandidateIntegrityAndInertness.analysesNotApplicable, 1);
  assert.equal(report.governorProofDisposition, "FAIL");
});

test("aggregate report identifies the exact failed analysis for every required category", () => {
  const entries = Object.keys(GOVERNOR_INTEGRITY_FAMILIES).map((familyName, index) => (
    failFamily(analysis(`RUN-00${index + 1}`, `OBJ-00${index + 1}`), familyName, `${familyName.toUpperCase()}_FAILED`)
  ));
  const report = buildGovernorReport({ productCommit: "c".repeat(40), analyses: entries });
  Object.keys(GOVERNOR_INTEGRITY_FAMILIES).forEach((familyName, index) => {
    const aggregate = report.integrityFamilies[familyName];
    assert.equal(aggregate.disposition, "FAIL");
    assert.deepEqual(aggregate.failedAnalysisIds, [`RUN-00${index + 1}`]);
    assert.equal(aggregate.failureReasons[0].reasons[0].code, `${familyName.toUpperCase()}_FAILED`);
  });
  assert.equal(report.governorProofDisposition, "FAIL");
});

test("aggregate Governor PASS is impossible when a required category fails", () => {
  const entry = failFamily(analysis(), "terminalAgreement", "TERMINAL_STATUS_MISMATCH");
  entry.passed = true;
  const report = buildGovernorReport({ productCommit: "d".repeat(40), analyses: [entry] });
  assert.equal(report.integrityFamilies.terminalAgreement.disposition, "FAIL");
  assert.equal(report.passed, false);
  assert.equal(report.governorProofDisposition, "FAIL");
});
