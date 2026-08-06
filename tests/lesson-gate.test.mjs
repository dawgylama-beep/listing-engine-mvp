import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  APPROVAL_DECISION,
  LESSON_GATE_STATE,
  REGRESSION_CASE_KIND,
  REGRESSION_DISPOSITION,
  approveNonOperativeLesson,
  buildLessonProof,
  buildRegressionCharter,
  buildRegressionEvidenceBundle,
  createApprovalReceipt,
  createRegisteredRegressionResult,
  evaluateReflectionReportForLessonGate,
  registeredRegressionManifest,
  reviewLessonCandidate,
  validateApprovalReceipt,
  validateApprovedLessonRecord,
  validateLessonProof,
  validateRegressionCharter
} from "../lib/lesson-gate.js";
import {
  CAUSAL_MECHANISM,
  CAUSALITY_DOMAIN,
  FAILURE_CLASSIFICATION,
  HISTORICAL_TRUST_CLASS,
  REFLECTION_OUTCOME,
  reflectOnHistoricalExperiences
} from "../lib/experience-reflection.js";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

function diagnosticFailure({
  record = "record-a",
  objectClass = "object-class-a",
  episode = "episode-a",
  purpose = "PERSONAL_BUY"
} = {}) {
  return {
    trustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    integrityVerified: true,
    sourceRecordHash: sha256Object({ record }),
    sourceArtifactHash: sha256Object({ artifact: record }),
    sourceAggregateHash: sha256Object({ aggregate: "phase6h-synthetic" }),
    objectClassIdentity: objectClass,
    episodeIdentity: episode,
    causalEventIdentity: `causal-${episode}`,
    sourceLineageIdentity: `lineage-${episode}`,
    customerPurpose: purpose,
    terminalOutcome: "FAILED",
    outcome: REFLECTION_OUTCOME.FAILURE,
    causalityDomain: CAUSALITY_DOMAIN.INTERNAL,
    failureClassification: FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
    causalMechanism: CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION,
    earliestSupportedLossBoundary: "CANONICAL_EVIDENCE_FINALIZATION",
    expectedState: "QUALIFIED_EVIDENCE_PRESERVED",
    actualState: "QUALIFIED_EVIDENCE_MISSING"
  };
}

function candidateSources() {
  return [
    diagnosticFailure({ record: "record-a", objectClass: "object-class-a", episode: "episode-a", purpose: "PERSONAL_BUY" }),
    diagnosticFailure({ record: "record-b", objectClass: "object-class-b", episode: "episode-b", purpose: "RESALE" })
  ];
}

function makeCandidate(sources = candidateSources()) {
  const report = reflectOnHistoricalExperiences(sources);
  assert.equal(report.lessonCandidates.length, 1);
  return report.lessonCandidates[0];
}

function rehashCandidate(candidate) {
  const output = { ...candidate, candidateHash: "" };
  output.candidateHash = sha256Object(output);
  return output;
}

function repositoryState(seed = "current") {
  return {
    head: sha256Object({ head: seed }),
    treeHash: sha256Object({ tree: seed }),
    changedSourceManifestHash: sha256Object({ manifest: seed }),
    version: "1.12.9-test"
  };
}

function fixtureManifestHash(seed = "fixtures") {
  return sha256Object({ fixtures: seed });
}

function passingResults(charter) {
  return charter.registeredRegressionIdentifiers.map((id) => createRegisteredRegressionResult(id, REGRESSION_DISPOSITION.PASS));
}

function buildPassingFlow({ sources = candidateSources(), resultOrder = "forward", fixtureOrder = "forward" } = {}) {
  const candidate = makeCandidate(sources);
  const fixtureHash = fixtureManifestHash();
  const charter = buildRegressionCharter({ candidate, fixtureManifestHash: fixtureHash });
  const results = passingResults(charter);
  const fixtureHashes = [
    { fixtureId: "SYNTHETIC_FIXTURE_A", sha256: sha256Object({ fixture: "a" }) },
    { fixtureId: "SYNTHETIC_FIXTURE_B", sha256: sha256Object({ fixture: "b" }) }
  ];
  const repository = repositoryState();
  const bundle = buildRegressionEvidenceBundle({
    candidate,
    charter,
    repositoryState: repository,
    fixtureManifestHash: fixtureHash,
    fixtureHashes: fixtureOrder === "reverse" ? [...fixtureHashes].reverse() : fixtureHashes,
    regressionResults: resultOrder === "reverse" ? [...results].reverse() : results,
    networkDenied: true,
    sourceUnmodified: true
  });
  const proof = buildLessonProof({ candidate, charter, bundle, repositoryState: repository });
  const receipt = createApprovalReceipt({
    candidate,
    charter,
    proof,
    bundle,
    repositoryState: repository,
    approvedScope: candidate.scope,
    operatorAuthorization: {
      authorizationType: "EXPLICIT_OPERATOR_AUTHORIZATION",
      authorizationId: "SYNTHETIC_OPERATOR_AUTHORIZATION_001",
      explicit: true,
      authorized: true
    },
    decision: APPROVAL_DECISION.APPROVE_NON_OPERATIVE,
    decisionReason: "SYNTHETIC_REGRESSION_PROOF_ACCEPTED"
  });
  const approval = approveNonOperativeLesson({
    candidate,
    charter,
    proof,
    bundle,
    receipt,
    repositoryState: repository,
    consumedReceiptHashes: []
  });
  return { candidate, charter, bundle, proof, receipt, approval, repository, fixtureHash };
}

test("A: canonical candidate integrity accepts current input and rejects a stale hash", () => {
  const candidate = makeCandidate();
  assert.equal(reviewLessonCandidate(candidate).proofEligible, true);
  const stale = { ...candidate, independentObjectClassCount: 99 };
  const review = reviewLessonCandidate(stale);
  assert.equal(review.proofEligible, false);
  assert(review.reasons.includes("CANDIDATE_INTEGRITY_INVALID"));
});

test("B: Charter, proof, approval, and approved-record construction preserve candidate immutability", () => {
  const candidate = makeCandidate();
  const before = stableObjectJson(candidate);
  buildPassingFlow({ sources: candidateSources() });
  assert.equal(stableObjectJson(candidate), before);
});

test("C: canonical outputs and hashes are deterministic across loading orders", () => {
  const forward = buildPassingFlow();
  const reverse = buildPassingFlow({ sources: [...candidateSources()].reverse(), resultOrder: "reverse", fixtureOrder: "reverse" });
  for (const key of ["candidate", "charter", "bundle", "proof", "receipt"]) {
    assert.equal(stableObjectJson(forward[key]), stableObjectJson(reverse[key]), key);
  }
  assert.equal(stableObjectJson(forward.approval), stableObjectJson(reverse.approval));
});

test("D: a no-candidate reflection returns NO_ELIGIBLE_CANDIDATE and zero artifacts", () => {
  const reflection = reflectOnHistoricalExperiences([]);
  const result = evaluateReflectionReportForLessonGate(reflection);
  assert.equal(result.state, LESSON_GATE_STATE.NO_ELIGIBLE_CANDIDATE);
  assert.deepEqual(Object.values(result.artifactCounts), [0, 0, 0, 0, 0]);
});

test("E: one object repeated across purposes cannot cross the support threshold", () => {
  const reflection = reflectOnHistoricalExperiences([
    diagnosticFailure({ record: "one", objectClass: "same-object", episode: "one", purpose: "PERSONAL_BUY" }),
    diagnosticFailure({ record: "two", objectClass: "same-object", episode: "two", purpose: "RESALE" })
  ]);
  assert.equal(reflection.lessonCandidates.length, 0);
});

test("F: legacy material is ineligible and frozen diagnostic trust is never upgraded", () => {
  const legacy = {
    trustClass: HISTORICAL_TRUST_CLASS.UNVERIFIED_LEGACY,
    legacyIdentity: "legacy",
    outcome: REFLECTION_OUTCOME.FAILURE,
    causalityDomain: CAUSALITY_DOMAIN.INTERNAL,
    failureClassification: FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
    causalMechanism: CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION
  };
  assert.equal(reflectOnHistoricalExperiences([legacy, { ...legacy, legacyIdentity: "legacy-copy" }]).lessonCandidates.length, 0);
  const flow = buildPassingFlow();
  assert.equal(flow.approval.approvedLessonRecord.sourceTrustComposition.FROZEN_VERIFIED_DIAGNOSTIC, 2);
  assert.equal(flow.approval.approvedLessonRecord.sourceTrustComposition.SEALED_AUTHORITATIVE_EXPERIENCE, 0);
});

test("G: Charter represents every required regression obligation class", () => {
  const { charter } = buildPassingFlow();
  for (const field of [
    "requiredPositiveRepairCases",
    "requiredPreservationCases",
    "requiredCounterexamples",
    "requiredPurposeNeutralityCases",
    "requiredSafetyCases",
    "requiredUnrelatedRegressionCoverage"
  ]) assert(charter[field].length > 0, field);
});

test("H: an unmapped required obligation blocks proof eligibility", () => {
  const original = makeCandidate();
  const candidate = rehashCandidate({
    ...original,
    regressionObligations: [...original.regressionObligations, "UNRECOGNIZED_REQUIRED_OBLIGATION"]
  });
  const charter = buildRegressionCharter({ candidate, fixtureManifestHash: fixtureManifestHash() });
  assert.equal(charter.proofEligibilityState, LESSON_GATE_STATE.PROOF_BLOCKED);
  assert(charter.unmappedObligations.includes("UNRECOGNIZED_REQUIRED_OBLIGATION"));
  assert.equal(validateRegressionCharter(charter, candidate).proofEligible, false);
});

test("I: only registered regressions are accepted and candidate execution fields are rejected", () => {
  assert.throws(
    () => createRegisteredRegressionResult("CANDIDATE_CHOSEN_TEST", REGRESSION_DISPOSITION.PASS),
    /Unregistered regression/
  );
  const candidate = rehashCandidate({ ...makeCandidate(), command: "run-anything" });
  const review = reviewLessonCandidate(candidate);
  assert.equal(review.proofEligible, false);
  assert(review.reasons.includes("CANDIDATE_CONTROLLED_EXECUTION_FIELD"));
});

test("J: candidate content cannot introduce dynamic loading, shell interpolation, or code execution", async () => {
  const candidate = rehashCandidate({ ...makeCandidate(), modulePath: "./untrusted.mjs" });
  assert.equal(reviewLessonCandidate(candidate).eligibleForCharter, false);
  const moduleSource = await readFile(new URL("../lib/lesson-gate.js", import.meta.url), "utf8");
  assert.doesNotMatch(moduleSource, /node:child_process|\beval\s*\(|new\s+Function|\bimport\s*\(/);
});

test("K: unresolved counterevidence blocks an otherwise valid candidate", () => {
  const original = makeCandidate();
  const candidate = rehashCandidate({
    ...original,
    disconfirmingObservations: [original.supportingObservations[0]]
  });
  const review = reviewLessonCandidate(candidate);
  assert.equal(review.state, LESSON_GATE_STATE.PROOF_BLOCKED);
  assert(review.reasons.includes("COUNTEREVIDENCE_UNRESOLVED"));
  const charter = buildRegressionCharter({ candidate, fixtureManifestHash: fixtureManifestHash() });
  assert.equal(charter.counterevidenceState, "UNRESOLVED");
  assert.equal(charter.proofEligibilityState, LESSON_GATE_STATE.PROOF_BLOCKED);
});

test("L: a safety-relevant candidate cannot pass without the registered safety regression", () => {
  const candidate = makeCandidate();
  const fixtureHash = fixtureManifestHash();
  const charter = buildRegressionCharter({ candidate, fixtureManifestHash: fixtureHash });
  const safetyId = registeredRegressionManifest().find((item) => item.caseKind === REGRESSION_CASE_KIND.SAFETY).regressionId;
  const results = passingResults(charter).filter((item) => item.regressionId !== safetyId);
  const bundle = buildRegressionEvidenceBundle({
    candidate, charter, repositoryState: repositoryState(), fixtureManifestHash: fixtureHash,
    regressionResults: results, networkDenied: true, sourceUnmodified: true
  });
  assert.equal(bundle.bundleState, "FAIL");
  assert(bundle.coverage.requiredCaseFailures.includes(safetyId));
});

test("M: a purpose-neutral invariant cannot pass without purpose-neutral coverage", () => {
  const candidate = makeCandidate();
  const fixtureHash = fixtureManifestHash();
  const charter = buildRegressionCharter({ candidate, fixtureManifestHash: fixtureHash });
  const purposeId = registeredRegressionManifest().find((item) => item.caseKind === REGRESSION_CASE_KIND.PURPOSE_NEUTRALITY).regressionId;
  const bundle = buildRegressionEvidenceBundle({
    candidate, charter, repositoryState: repositoryState(), fixtureManifestHash: fixtureHash,
    regressionResults: passingResults(charter).filter((item) => item.regressionId !== purposeId),
    networkDenied: true, sourceUnmodified: true
  });
  assert.equal(bundle.bundleState, "FAIL");
  assert(bundle.coverage.requiredCaseFailures.includes(purposeId));
});

test("N: Lesson Proof binds candidate, Charter, bundle, repository, fixtures, and registry", () => {
  const { candidate, charter, bundle, proof, repository } = buildPassingFlow();
  assert.equal(proof.lessonCandidateHash, candidate.candidateHash);
  assert.equal(proof.regressionCharterHash, charter.charterHash);
  assert.equal(proof.regressionEvidenceBundleHash, bundle.bundleHash);
  assert.deepEqual(proof.repository, repository);
  assert.equal(proof.fixtureManifestHash, charter.fixtureManifestHash);
  assert.equal(proof.registeredRegressionManifestHash, bundle.registeredRegressionManifestHash);
  const staleCoverage = { ...bundle, coverage: { ...bundle.coverage, passCount: 999 }, bundleHash: "" };
  staleCoverage.bundleHash = sha256Object(staleCoverage);
  const failedProof = buildLessonProof({ candidate, charter, bundle: staleCoverage, repositoryState: repository });
  assert.equal(failedProof.proofState, LESSON_GATE_STATE.PROOF_FAILED);
});

test("O: repository, candidate, Charter, fixture, and manifest drift invalidate proof", () => {
  const flow = buildPassingFlow();
  const staleRepository = { ...flow.repository, treeHash: sha256Object({ tree: "changed" }) };
  const validation = validateLessonProof(flow.proof, { ...flow, repositoryState: staleRepository });
  assert.equal(validation.valid, false);
  assert(validation.failures.some((failure) => /DRIFT/.test(failure)));
  const staleCandidate = { ...flow.candidate, candidateHash: sha256Object({ stale: true }) };
  assert.equal(validateLessonProof(flow.proof, { ...flow, candidate: staleCandidate, repositoryState: flow.repository }).valid, false);
});

test("P: one failed required regression prevents a passing Lesson Proof", () => {
  const candidate = makeCandidate();
  const fixtureHash = fixtureManifestHash();
  const charter = buildRegressionCharter({ candidate, fixtureManifestHash: fixtureHash });
  const results = passingResults(charter);
  results[0] = createRegisteredRegressionResult(results[0].regressionId, REGRESSION_DISPOSITION.FAIL);
  const repository = repositoryState();
  const bundle = buildRegressionEvidenceBundle({
    candidate, charter, repositoryState: repository, fixtureManifestHash: fixtureHash,
    regressionResults: results, networkDenied: true, sourceUnmodified: true
  });
  const proof = buildLessonProof({ candidate, charter, bundle, repositoryState: repository });
  assert.equal(proof.proofState, LESSON_GATE_STATE.PROOF_FAILED);
});

test("Q: a passing proof remains awaiting approval until an explicit receipt is supplied", () => {
  const { proof } = buildPassingFlow();
  assert.equal(proof.proofState, LESSON_GATE_STATE.PROOF_PASSED_AWAITING_APPROVAL);
  assert.equal(proof.approvalAuthorized, false);
});

test("R: candidate, proof, repository, or scope mismatch rejects approval receipt creation", () => {
  const flow = buildPassingFlow();
  assert.throws(() => createApprovalReceipt({
    candidate: flow.candidate,
    charter: flow.charter,
    proof: flow.proof,
    bundle: flow.bundle,
    repositoryState: flow.repository,
    approvedScope: { ...flow.candidate.scope, authorityBoundary: "OTHER" },
    operatorAuthorization: flow.receipt.operatorAuthorization,
    decision: APPROVAL_DECISION.APPROVE_NON_OPERATIVE,
    decisionReason: "SYNTHETIC_SCOPE_MISMATCH"
  }), /scope does not match/);
  const staleRepository = { ...flow.repository, head: sha256Object({ head: "other" }) };
  assert.equal(validateApprovalReceipt(flow.receipt, { ...flow, repositoryState: staleRepository }).valid, false);
  const otherCandidate = rehashCandidate({ ...flow.candidate, candidateId: "lesson-candidate-other" });
  assert.equal(validateApprovalReceipt(flow.receipt, { ...flow, candidate: otherCandidate, repositoryState: flow.repository }).valid, false);
  const otherProof = { ...flow.proof, proofHash: sha256Object({ other: "proof" }) };
  assert.equal(validateApprovalReceipt(flow.receipt, { ...flow, proof: otherProof, repositoryState: flow.repository }).valid, false);
});

test("S: a consumed receipt cannot approve a second record", () => {
  const flow = buildPassingFlow();
  const replay = approveNonOperativeLesson({
    ...flow,
    repositoryState: flow.repository,
    consumedReceiptHashes: flow.approval.consumedReceiptHashes
  });
  assert.equal(replay.state, LESSON_GATE_STATE.REJECTED);
  assert(replay.reasons.includes("RECEIPT_REPLAY_REJECTED"));
  assert.equal(replay.approvedLessonRecord, null);
});

test("T: explicit synthetic approval produces only APPROVED_NON_OPERATIVE", () => {
  const flow = buildPassingFlow();
  const { approval } = flow;
  assert.equal(approval.state, LESSON_GATE_STATE.APPROVED_NON_OPERATIVE);
  assert.equal(approval.approvedLessonRecord.status, LESSON_GATE_STATE.APPROVED_NON_OPERATIVE);
  assert.equal(validateApprovedLessonRecord(approval.approvedLessonRecord, flow).nonOperative, true);
});

test("U: live handler and runtime authority modules do not import lesson-gate records", async () => {
  const runtimeFiles = [
    "../api/generate-listing.js",
    "../lib/cognitive-governor/policy.js",
    "../lib/cognitive-governor/state.js",
    "../lib/object-intelligence/verification.js",
    "../lib/evidence/result.js",
    "../lib/terminal-evidence.js"
  ];
  for (const file of runtimeFiles) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.doesNotMatch(source, /lesson-gate|APPROVED_NON_OPERATIVE|REGRESSION_CHARTER/, file);
  }
});

test("V: lesson content cannot generate source, tests, commands, or operative installation", () => {
  const flow = buildPassingFlow();
  const serialized = stableObjectJson(flow.approval.approvedLessonRecord);
  assert.equal(flow.approval.approvedLessonRecord.codeInstallation, false);
  assert.equal(flow.approval.approvedLessonRecord.behavioralInstallation, false);
  assert.doesNotMatch(serialized, /sourcePatch|testRewrite|executablePath|modulePath|commandLine/);
});

test("W: proof artifacts contain no raw photographs, customer identity, URLs, payloads, or secrets", () => {
  const flow = buildPassingFlow();
  for (const artifact of [flow.charter, flow.bundle, flow.proof, flow.receipt, flow.approval.approvedLessonRecord]) {
    const serialized = stableObjectJson(artifact);
    assert.doesNotMatch(serialized, /https?:|customerName|photograph|providerPayload|authorizationHeader|api[_-]?key|credential/i);
  }
});

test("X: all Phase 6H pure constructions preserve their source inputs byte-for-byte", () => {
  const sources = candidateSources();
  const before = stableObjectJson(sources);
  buildPassingFlow({ sources });
  assert.equal(stableObjectJson(sources), before);
});

test("Y: the focused gate succeeds under hard network denial with zero attempts", () => {
  const guard = installHardNetworkDenial();
  try {
    const flow = buildPassingFlow();
    assert.equal(flow.approval.state, LESSON_GATE_STATE.APPROVED_NON_OPERATIVE);
    assert.equal(guard.attempts.length, 0);
  } finally {
    guard.restore();
  }
});

test("Z: the existing historical report yields zero real promotion artifacts", async () => {
  const report = JSON.parse(await readFile(new URL("../test-results/phase6g-retrospective-reflection.json", import.meta.url), "utf8"));
  const result = evaluateReflectionReportForLessonGate(report.reflection);
  assert.equal(result.state, LESSON_GATE_STATE.NO_ELIGIBLE_CANDIDATE);
  assert.equal(result.candidateCount, 0);
  assert.equal(result.eligibleCandidateCount, 0);
  assert.deepEqual(result.artifactCounts, {
    regressionCharters: 0,
    regressionEvidenceBundles: 0,
    lessonProofs: 0,
    approvalReceipts: 0,
    approvedLessonRecords: 0
  });
});
