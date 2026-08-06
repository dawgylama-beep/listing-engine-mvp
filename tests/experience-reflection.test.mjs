import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  CAUSAL_MECHANISM,
  CAUSALITY_DOMAIN,
  FAILURE_CLASSIFICATION,
  HISTORICAL_TRUST_CLASS,
  LESSON_CANDIDATE_STATUS,
  REFLECTION_OUTCOME,
  buildReflectionObservation,
  createCausalSignature,
  reflectOnHistoricalExperiences,
  validateHistoricalReflectionSource,
  verifyRetrospectiveLessonCandidate
} from "../lib/experience-reflection.js";
import {
  MAX_ATTESTED_EXPERIENCE_RECORD_BYTES,
  emittedExperienceRecordByteLength,
  sealExperienceRecord
} from "../lib/terminal-evidence.js";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";
import { snapshotHistoricalTree } from "../scripts/run-experience-reflection.mjs";

function withHash(value, field) {
  const unhashed = { ...value, [field]: "" };
  return { ...unhashed, [field]: sha256Object(unhashed) };
}

function authoritativeSource({
  objectClass = "object-class-a",
  episode = "episode-a",
  purpose = "PERSONAL_BUY",
  requestedCustomerInput = null,
  safetyState = "NO_BLOCKING_SAFETY_CONDITION",
  terminalStatus = "COMPLETE",
  causal = {}
} = {}) {
  const experienceRecord = sealExperienceRecord({
    schemaVersion: "1.0",
    objectStateId: `state-${episode}`,
    facts: ["synthetic-authoritative-fact"]
  });
  const cognitiveEpisode = withHash({
    schemaVersion: "1.0",
    evaluationIdentity: `evaluation-${episode}`,
    submittedObjectFingerprint: objectClass,
    requestedCustomerInput,
    safetyState,
    terminalStatus,
    linkedExperienceRecordHash: experienceRecord.experienceRecordHash,
    cognitiveEpisodeHash: ""
  }, "cognitiveEpisodeHash");
  const emittedBytes = emittedExperienceRecordByteLength(experienceRecord);
  const governorProof = {
    experienceRecord: {
      storedHash: experienceRecord.experienceRecordHash,
      canonicalByteSize: emittedBytes,
      maximumByteSize: MAX_ATTESTED_EXPERIENCE_RECORD_BYTES,
      sizeCompliant: true
    },
    ceilings: {
      experienceRecord: {
        consumedBytes: emittedBytes,
        maximumBytes: MAX_ATTESTED_EXPERIENCE_RECORD_BYTES,
        compliant: true
      }
    },
    proofHash: ""
  };
  governorProof.proofHash = sha256Object(governorProof);
  return {
    trustClass: HISTORICAL_TRUST_CLASS.SEALED_AUTHORITATIVE_EXPERIENCE,
    sourceRecordHash: experienceRecord.experienceRecordHash,
    sourceArtifactHash: sha256Object({ artifact: episode }),
    sourceAggregateHash: sha256Object({ aggregate: "synthetic" }),
    experienceRecord,
    cognitiveEpisode,
    governorProof,
    customerPurpose: purpose,
    objectClassIdentity: objectClass,
    episodeIdentity: episode,
    causalEventIdentity: `causal-${episode}`,
    sourceLineageIdentity: `lineage-${episode}`,
    terminalOutcome: terminalStatus,
    ...causal
  };
}

function internalFailure(options = {}) {
  return authoritativeSource({
    ...options,
    causal: {
      outcome: REFLECTION_OUTCOME.FAILURE,
      causalityDomain: CAUSALITY_DOMAIN.INTERNAL,
      failureClassification: FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
      causalMechanism: CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION,
      earliestSupportedLossBoundary: "CANONICAL_EVIDENCE_FINALIZATION",
      expectedState: "QUALIFIED_EVIDENCE_PRESERVED",
      actualState: "QUALIFIED_EVIDENCE_MISSING",
      ...(options.causal || {})
    }
  });
}

function diagnosticFailure({
  record = "record-a",
  objectClass = "diagnostic-object-a",
  episode = "diagnostic-episode-a",
  purpose = "PERSONAL_BUY",
  outcome = REFLECTION_OUTCOME.FAILURE,
  domain = CAUSALITY_DOMAIN.INTERNAL,
  classification = FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
  mechanism = CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION,
  boundary = "CANONICAL_EVIDENCE_FINALIZATION"
} = {}) {
  return {
    trustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    integrityVerified: true,
    sourceRecordHash: sha256Object({ record }),
    sourceArtifactHash: sha256Object({ artifact: record }),
    sourceAggregateHash: sha256Object({ aggregate: "diagnostic" }),
    objectClassIdentity: objectClass,
    episodeIdentity: episode,
    causalEventIdentity: episode,
    sourceLineageIdentity: episode,
    customerPurpose: purpose,
    terminalOutcome: "FAILED",
    outcome,
    causalityDomain: domain,
    failureClassification: classification,
    causalMechanism: mechanism,
    earliestSupportedLossBoundary: boundary,
    expectedState: "EXPECTED_AUTHORITY_STATE",
    actualState: outcome === REFLECTION_OUTCOME.SUCCESS ? "EXPECTED_AUTHORITY_STATE" : "DIVERGENT_AUTHORITY_STATE"
  };
}

test("A: sealed Experience integrity accepts current records and rejects stale content", () => {
  const source = authoritativeSource();
  assert.equal(validateHistoricalReflectionSource(source).valid, true);
  const stale = {
    ...source,
    experienceRecord: { ...source.experienceRecord, facts: ["modified-after-seal"] }
  };
  const result = validateHistoricalReflectionSource(stale);
  assert.equal(result.valid, false);
  assert(result.failures.includes("EXPERIENCE_HASH_MISMATCH"));
});

test("B: trust classes remain explicit and legacy material cannot establish a candidate", () => {
  const authoritative = authoritativeSource();
  const diagnostic = diagnosticFailure();
  const legacy = {
    trustClass: HISTORICAL_TRUST_CLASS.UNVERIFIED_LEGACY,
    legacyIdentity: "old-log",
    outcome: REFLECTION_OUTCOME.FAILURE,
    causalityDomain: CAUSALITY_DOMAIN.INTERNAL,
    failureClassification: FAILURE_CLASSIFICATION.SYSTEM_LOGIC_DEFECT,
    causalMechanism: CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION
  };
  assert.equal(validateHistoricalReflectionSource(authoritative).trustClass, HISTORICAL_TRUST_CLASS.SEALED_AUTHORITATIVE_EXPERIENCE);
  assert.equal(validateHistoricalReflectionSource(diagnostic).trustClass, HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC);
  assert.equal(validateHistoricalReflectionSource(legacy).eligibleForLessonSupport, false);
  const report = reflectOnHistoricalExperiences([legacy, { ...legacy, legacyIdentity: "copy" }]);
  assert.equal(report.lessonCandidates.length, 0);
});

test("C: loading order does not change observations, signatures, candidates, or hashes", () => {
  const sources = [
    internalFailure({ objectClass: "class-a", episode: "episode-a" }),
    internalFailure({ objectClass: "class-b", episode: "episode-b", purpose: "RESALE" })
  ];
  const forward = reflectOnHistoricalExperiences(sources);
  const reverse = reflectOnHistoricalExperiences([...sources].reverse());
  assert.equal(stableObjectJson(forward), stableObjectJson(reverse));
  assert.equal(forward.reportHash, reverse.reportHash);
  assert.equal(forward.lessonCandidates[0].candidateHash, reverse.lessonCandidates[0].candidateHash);
});

test("D: copies, hashes, retries, and duplicated terminal events do not inflate support", () => {
  const first = diagnosticFailure({ record: "same-record", objectClass: "same-object", episode: "same-event" });
  const copy = { ...first };
  const retry = diagnosticFailure({ record: "retry-record", objectClass: "same-object", episode: "same-event" });
  const independent = diagnosticFailure({ record: "independent", objectClass: "other-object", episode: "other-event" });
  const report = reflectOnHistoricalExperiences([first, copy, retry, independent]);
  assert.equal(report.totalRecordsExamined, 4);
  assert.equal(report.uniqueRecordsExamined, 3);
  assert.equal(report.lessonCandidates.length, 1);
  assert.equal(report.lessonCandidates[0].independentlySupportingEpisodeCount, 2);
  assert.equal(report.lessonCandidates[0].independentObjectClassCount, 2);
});

test("E: one object across several purposes demonstrates coverage but counts once", () => {
  const report = reflectOnHistoricalExperiences([
    diagnosticFailure({ record: "purpose-a", objectClass: "same-object", episode: "event-a", purpose: "PERSONAL_BUY" }),
    diagnosticFailure({ record: "purpose-b", objectClass: "same-object", episode: "event-b", purpose: "RESALE" }),
    diagnosticFailure({ record: "purpose-c", objectClass: "same-object", episode: "event-c", purpose: "MARKETPLACE_LISTING" })
  ]);
  assert.equal(report.lessonCandidates.length, 0);
  const pattern = report.patternAssessments.find((entry) => entry.causalSignature.causalMechanism === CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION);
  assert.equal(pattern.independentlySupportingEpisodeCount, 1);
  assert.deepEqual(pattern.purposeCoverage, ["MARKETPLACE_LISTING", "PERSONAL_BUY", "RESALE"]);
});

test("F: unrelated object classes with one earliest cause produce one PROPOSED_ONLY candidate", () => {
  const report = reflectOnHistoricalExperiences([
    internalFailure({ objectClass: "unrelated-class-a", episode: "shared-cause-a" }),
    internalFailure({ objectClass: "unrelated-class-b", episode: "shared-cause-b", purpose: "WHATS_IT_WORTH" })
  ]);
  assert.equal(report.lessonCandidates.length, 1);
  const candidate = report.lessonCandidates[0];
  assert.equal(candidate.status, LESSON_CANDIDATE_STATUS.PROPOSED_ONLY);
  assert.equal(candidate.causalSignature.causalMechanism, CAUSAL_MECHANISM.QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION);
  assert.equal(candidate.independentlySupportingEpisodeCount, 2);
  assert.equal(verifyRetrospectiveLessonCandidate(candidate).valid, true);
});

test("G: a shared terminal symptom with different earliest causes does not merge", () => {
  const lostEvidence = diagnosticFailure({ record: "loss", objectClass: "object-a", episode: "event-a" });
  const staleSeal = diagnosticFailure({
    record: "seal",
    objectClass: "object-b",
    episode: "event-b",
    mechanism: CAUSAL_MECHANISM.EXPERIENCE_ATTESTATION_INTEGRITY_LOSS,
    classification: FAILURE_CLASSIFICATION.EXPERIENCE_INTEGRITY_DEFECT,
    boundary: "EXPERIENCE_RECORD_SEALING"
  });
  const report = reflectOnHistoricalExperiences([lostEvidence, staleSeal]);
  assert.equal(report.lessonCandidates.length, 0);
  assert.equal(new Set(report.observations.map((entry) => entry.causalSignatureHash)).size, 2);
});

test("H: repeated provider or network failures stay external and do not become internal lessons", () => {
  const sources = ["a", "b"].map((suffix) => diagnosticFailure({
    record: `provider-${suffix}`,
    objectClass: `provider-object-${suffix}`,
    episode: `provider-event-${suffix}`,
    domain: CAUSALITY_DOMAIN.EXTERNAL,
    classification: FAILURE_CLASSIFICATION.PROVIDER_OUTAGE,
    mechanism: CAUSAL_MECHANISM.EXTERNAL_PROVIDER_UNAVAILABLE,
    boundary: "INITIAL_ACQUISITION"
  }));
  const report = reflectOnHistoricalExperiences(sources);
  assert.equal(report.lessonCandidates.length, 0);
  assert(report.patternAssessments.some((entry) => entry.disposition === "NON_INTERNAL_CAUSALITY"));
});

test("I: a valid stop awaiting customer input is not classified as a system defect", () => {
  const source = authoritativeSource({
    requestedCustomerInput: { requestType: "VISIBLE_MODEL_NUMBER" },
    terminalStatus: "INSUFFICIENT_EVIDENCE"
  });
  const observation = buildReflectionObservation(source);
  assert.equal(observation.causalityDomain, CAUSALITY_DOMAIN.CUSTOMER_DEPENDENT);
  assert.equal(observation.failureClassification, FAILURE_CLASSIFICATION.MISSING_CUSTOMER_INFORMATION);
  assert.equal(observation.eligibleForLessonSupport, false);
  assert.equal(reflectOnHistoricalExperiences([source, { ...source }]).lessonCandidates.length, 0);
});

test("J: one isolated internal anomaly remains an observation, not a lesson", () => {
  const report = reflectOnHistoricalExperiences([internalFailure()]);
  assert.equal(report.observations.length, 1);
  assert.equal(report.lessonCandidates.length, 0);
  assert(report.patternAssessments.some((entry) => entry.disposition === "INSUFFICIENT_INDEPENDENT_SUPPORT"));
});

test("K: relevant successful counterexamples are preserved and can block a candidate", () => {
  const supportA = diagnosticFailure({ record: "support-a", objectClass: "support-object-a", episode: "support-event-a" });
  const supportB = diagnosticFailure({ record: "support-b", objectClass: "support-object-b", episode: "support-event-b" });
  const successA = diagnosticFailure({ record: "success-a", objectClass: "success-object-a", episode: "success-event-a", outcome: REFLECTION_OUTCOME.SUCCESS });
  const successB = diagnosticFailure({ record: "success-b", objectClass: "success-object-b", episode: "success-event-b", outcome: REFLECTION_OUTCOME.SUCCESS });
  const report = reflectOnHistoricalExperiences([supportA, supportB, successA, successB]);
  assert.equal(report.lessonCandidates.length, 1);
  assert.equal(report.lessonCandidates[0].disconfirmingObservations.length, 2);
  assert.equal(report.lessonCandidates[0].promotionEligibilityState, "BLOCKED_BY_COUNTEREVIDENCE");
});

test("L: generalized proposal content excludes object, customer, product, URL, and answer text", () => {
  const named = internalFailure({ objectClass: "OBJ-001-private-product", episode: "RUN-001" });
  Object.assign(named, {
    customerName: "Private Customer",
    productName: "Specific Product Name",
    frozenDescription: "private description",
    expectedUrl: "https://example.invalid/private"
  });
  const other = internalFailure({ objectClass: "OBJ-002-other-product", episode: "RUN-002" });
  const candidate = reflectOnHistoricalExperiences([named, other]).lessonCandidates[0];
  const generalized = stableObjectJson({
    causalSignature: candidate.causalSignature,
    generalizedProblemStatement: candidate.generalizedProblemStatement,
    proposedInvariant: candidate.proposedInvariant,
    regressionObligations: candidate.regressionObligations
  });
  assert.doesNotMatch(generalized, /Private Customer|Specific Product|private description|example\.invalid|OBJ-001|RUN-001/i);
  assert.equal(verifyRetrospectiveLessonCandidate(candidate).privateOrSpecificContentDetected, false);
});

test("M: one causal mechanism canonicalizes identically across purposes", () => {
  const first = buildReflectionObservation(internalFailure({ purpose: "PERSONAL_BUY", objectClass: "purpose-class-a", episode: "purpose-episode-a" }));
  const second = buildReflectionObservation(internalFailure({ purpose: "MARKETPLACE_LISTING", objectClass: "purpose-class-b", episode: "purpose-episode-b" }));
  assert.equal(createCausalSignature(first).signatureHash, createCausalSignature(second).signatureHash);
});

test("N: retrospective candidates are hash-addressed, non-operative proposals only", () => {
  const candidate = reflectOnHistoricalExperiences([
    internalFailure({ objectClass: "inert-a", episode: "inert-a" }),
    internalFailure({ objectClass: "inert-b", episode: "inert-b" })
  ]).lessonCandidates[0];
  const result = verifyRetrospectiveLessonCandidate(candidate);
  assert.equal(result.valid, true);
  assert.equal(result.nonOperative, true);
  assert.equal(candidate.promotionAuthorized, false);
  assert.equal(candidate.runtimeConsumptionAuthorized, false);
  assert.match(candidate.candidateHash, /^[a-f0-9]{64}$/);
});

test("O: reflection does not introduce a live Experience, evidence, finalizer, or Governor authority", async () => {
  const api = await readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8");
  const reflection = await readFile(new URL("../lib/experience-reflection.js", import.meta.url), "utf8");
  assert.doesNotMatch(api, /experience-reflection|reflectOnHistoricalExperiences|RETROSPECTIVE_LESSON/i);
  assert.doesNotMatch(reflection, /from\s+["']\.\/api|executeGovernorAuthorizedAction|sealResearchExperienceRecord/);
});

test("P: unnecessary free-form private content is not retained by canonical observations", () => {
  const source = internalFailure();
  Object.assign(source, {
    customerName: "Private Person",
    unrestrictedRequestText: "private free form request",
    rawProviderPayload: { authorization: "synthetic credential value that must be discarded" },
    photographs: ["raw-photo-bytes"]
  });
  const observation = buildReflectionObservation(source);
  const serialized = stableObjectJson(observation);
  assert.doesNotMatch(serialized, /Private Person|private free form|credential value|raw-photo/i);
});

test("Q: reflection leaves historical source bytes and in-memory records unchanged", async () => {
  const fixtureRoot = path.resolve("test-results/phase6g-source-immutability-fixture");
  await rm(fixtureRoot, { recursive: true, force: true });
  await mkdir(fixtureRoot, { recursive: true });
  const fixturePath = path.join(fixtureRoot, "source.json");
  const source = internalFailure();
  const bytes = `${stableObjectJson(source)}\n`;
  await writeFile(fixturePath, bytes, "utf8");
  const beforeMemory = stableObjectJson(source);
  const beforeTree = await snapshotHistoricalTree(fixtureRoot);
  reflectOnHistoricalExperiences([source]);
  const afterTree = await snapshotHistoricalTree(fixtureRoot);
  assert.equal(stableObjectJson(source), beforeMemory);
  assert.equal(await readFile(fixturePath, "utf8"), bytes);
  assert.equal(afterTree.treeHash, beforeTree.treeHash);
  await rm(fixtureRoot, { recursive: true, force: true });
});
