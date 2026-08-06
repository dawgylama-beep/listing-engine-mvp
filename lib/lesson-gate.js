import {
  HISTORICAL_TRUST_CLASS,
  verifyRetrospectiveLessonCandidate
} from "./experience-reflection.js";
import {
  cleanObjectText,
  sha256Object,
  stableObjectJson
} from "./object-intelligence/stable.js";

export const REGRESSION_CHARTER_SCHEMA_VERSION = "1.0";
export const REGRESSION_EVIDENCE_BUNDLE_SCHEMA_VERSION = "1.0";
export const LESSON_PROOF_SCHEMA_VERSION = "1.0";
export const APPROVAL_RECEIPT_SCHEMA_VERSION = "1.0";
export const APPROVED_LESSON_RECORD_SCHEMA_VERSION = "1.0";
export const LESSON_GATE_EVALUATION_SCHEMA_VERSION = "1.0";

export const LESSON_GATE_STATE = Object.freeze({
  NO_ELIGIBLE_CANDIDATE: "NO_ELIGIBLE_CANDIDATE",
  PROOF_REQUIRED: "PROOF_REQUIRED",
  PROOF_BLOCKED: "PROOF_BLOCKED",
  PROOF_FAILED: "PROOF_FAILED",
  PROOF_PASSED_AWAITING_APPROVAL: "PROOF_PASSED_AWAITING_APPROVAL",
  APPROVED_NON_OPERATIVE: "APPROVED_NON_OPERATIVE",
  REJECTED: "REJECTED"
});

export const APPROVAL_DECISION = Object.freeze({
  APPROVE_NON_OPERATIVE: "APPROVE_NON_OPERATIVE",
  REJECT: "REJECT"
});

export const REGRESSION_DISPOSITION = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  SKIP: "SKIP"
});

export const REGRESSION_CASE_KIND = Object.freeze({
  POSITIVE_REPAIR: "POSITIVE_REPAIR",
  PRESERVATION: "PRESERVATION",
  COUNTEREXAMPLE: "COUNTEREXAMPLE",
  PURPOSE_NEUTRALITY: "PURPOSE_NEUTRALITY",
  SAFETY: "SAFETY",
  UNRELATED_REGRESSION: "UNRELATED_REGRESSION"
});

const HASH_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_IDENTIFIER_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,95}$/;
const ALLOWED_SUPPORT_TRUST_CLASSES = new Set([
  HISTORICAL_TRUST_CLASS.SEALED_AUTHORITATIVE_EXPERIENCE,
  HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC
]);
const EXECUTION_CONTROL_KEY = /^(?:command|commands|commandline|args|arguments|executable|executablepath|module|modulename|modulepath|dynamicimport|javascriptsource|powershellsource|sourcepatch|testrewrite|fixturepath|environmentvariable|environmentvariablename|networklocation|provideridentifier)$/i;

const MECHANISM_CONTRACTS = Object.freeze({
  QUALIFIED_EVIDENCE_LOST_BEFORE_FINALIZATION: Object.freeze({
    candidateObligations: Object.freeze([
      "QUALIFIED_EVIDENCE_SURVIVES_FINALIZATION",
      "REJECTION_REQUIRES_CANONICAL_REASON"
    ]),
    positiveRegressionId: "PHASE6H_REPAIR_QUALIFIED_EVIDENCE_FINALIZATION"
  }),
  DUPLICATE_ACTION_REPEATED_WITHOUT_KNOWLEDGE_CHANGE: Object.freeze({
    candidateObligations: Object.freeze([
      "MATERIAL_CHANGE_ALLOWS_RECONSIDERATION",
      "UNCHANGED_KNOWLEDGE_BLOCKS_DUPLICATE_ACTION"
    ]),
    positiveRegressionId: "PHASE6H_REPAIR_DUPLICATE_ACTION_CONTROL"
  }),
  EXPERIENCE_ATTESTATION_INTEGRITY_LOSS: Object.freeze({
    candidateObligations: Object.freeze([
      "FINAL_RESPONSE_REVALIDATES_EXPERIENCE_ATTESTATION",
      "POST_SEAL_MUTATION_IS_REJECTED"
    ]),
    positiveRegressionId: "PHASE6H_REPAIR_EXPERIENCE_ATTESTATION"
  })
});

const REGISTERED_REGRESSIONS = Object.freeze([
  Object.freeze({
    regressionId: "PHASE6H_REPAIR_QUALIFIED_EVIDENCE_FINALIZATION",
    caseKind: REGRESSION_CASE_KIND.POSITIVE_REPAIR,
    required: true
  }),
  Object.freeze({
    regressionId: "PHASE6H_REPAIR_DUPLICATE_ACTION_CONTROL",
    caseKind: REGRESSION_CASE_KIND.POSITIVE_REPAIR,
    required: true
  }),
  Object.freeze({
    regressionId: "PHASE6H_REPAIR_EXPERIENCE_ATTESTATION",
    caseKind: REGRESSION_CASE_KIND.POSITIVE_REPAIR,
    required: true
  }),
  Object.freeze({
    regressionId: "PHASE6H_PRESERVE_AUTHORITATIVE_SUCCESS",
    caseKind: REGRESSION_CASE_KIND.PRESERVATION,
    required: true
  }),
  Object.freeze({
    regressionId: "PHASE6H_COUNTEREXAMPLE_MATERIAL_PRECONDITION",
    caseKind: REGRESSION_CASE_KIND.COUNTEREXAMPLE,
    required: true
  }),
  Object.freeze({
    regressionId: "PHASE6H_PURPOSE_NEUTRALITY",
    caseKind: REGRESSION_CASE_KIND.PURPOSE_NEUTRALITY,
    required: true
  }),
  Object.freeze({
    regressionId: "PHASE6H_SAFETY_POLICY_PRESERVATION",
    caseKind: REGRESSION_CASE_KIND.SAFETY,
    required: true
  }),
  Object.freeze({
    regressionId: "PHASE6H_UNRELATED_RUNTIME_ISOLATION",
    caseKind: REGRESSION_CASE_KIND.UNRELATED_REGRESSION,
    required: true
  })
]);

const REGRESSION_BY_ID = new Map(REGISTERED_REGRESSIONS.map((entry) => [entry.regressionId, entry]));
export const REGISTERED_REGRESSION_MANIFEST_HASH = sha256Object(REGISTERED_REGRESSIONS);

function canonicalClone(value) {
  return JSON.parse(stableObjectJson(value));
}

function uniqueSorted(values = []) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right));
}

function sameCanonical(left, right) {
  return stableObjectJson(left) === stableObjectJson(right);
}

function requireHash(value, label) {
  if (!HASH_PATTERN.test(String(value || ""))) throw new Error(`${label} must be a lowercase SHA-256 hash.`);
  return value;
}

function requireSafeIdentifier(value, label) {
  const selected = cleanObjectText(value, 96).toUpperCase();
  if (!SAFE_IDENTIFIER_PATTERN.test(selected)) throw new Error(`${label} must be a controlled identifier.`);
  return selected;
}

function withCanonicalHash(core, field) {
  const record = { ...core, [field]: "" };
  record[field] = sha256Object(record);
  return record;
}

function canonicalHashValid(record, field) {
  return Boolean(record && HASH_PATTERN.test(String(record[field] || "")))
    && record[field] === sha256Object({ ...record, [field]: "" });
}

function executionControlPaths(value, prefix = "candidate", found = []) {
  if (!value || typeof value !== "object") return found;
  for (const key of Object.keys(value)) {
    const next = `${prefix}.${key}`;
    if (EXECUTION_CONTROL_KEY.test(key)) found.push(next);
    executionControlPaths(value[key], next, found);
  }
  return found;
}

function signatureHashValid(signature = {}) {
  return HASH_PATTERN.test(String(signature.signatureHash || ""))
    && signature.signatureHash === sha256Object({ ...signature, signatureHash: "" });
}

function mechanismContract(candidate = {}) {
  return MECHANISM_CONTRACTS[candidate.causalSignature?.causalMechanism] || null;
}

function selectedRegisteredRegressions(candidate) {
  const contract = mechanismContract(candidate);
  if (!contract) return [];
  const sharedIds = [
    "PHASE6H_PRESERVE_AUTHORITATIVE_SUCCESS",
    "PHASE6H_COUNTEREXAMPLE_MATERIAL_PRECONDITION",
    "PHASE6H_PURPOSE_NEUTRALITY",
    "PHASE6H_SAFETY_POLICY_PRESERVATION",
    "PHASE6H_UNRELATED_RUNTIME_ISOLATION"
  ];
  return uniqueSorted([contract.positiveRegressionId, ...sharedIds]).map((id) => REGRESSION_BY_ID.get(id));
}

function observationIdentity(record = {}) {
  return record.objectClassIdentity || record.causalEventIdentity || record.episodeIdentity || "";
}

function candidateSupportReview(candidate = {}) {
  const reasons = [];
  const supporting = Array.isArray(candidate.supportingObservations) ? candidate.supportingObservations : [];
  const sourceRecords = Array.isArray(candidate.sourceRecords) ? candidate.sourceRecords : [];
  const uniqueRecordHashes = uniqueSorted(supporting.map((record) => record.sourceRecordHash));
  const uniqueObjectClasses = uniqueSorted(supporting.map(observationIdentity));
  const selectedTrustClasses = uniqueSorted(supporting.map((record) => record.sourceTrustClass));
  if (supporting.length < 2 || uniqueRecordHashes.length < 2) reasons.push("INSUFFICIENT_INDEPENDENT_EPISODES");
  if (uniqueObjectClasses.length < 2) reasons.push("INSUFFICIENT_INDEPENDENT_OBJECT_CLASSES");
  if (candidate.independentlySupportingEpisodeCount !== uniqueRecordHashes.length) reasons.push("EPISODE_SUPPORT_COUNT_MISMATCH");
  if (candidate.independentObjectClassCount !== uniqueObjectClasses.length) reasons.push("OBJECT_CLASS_SUPPORT_COUNT_MISMATCH");
  if (sourceRecords.length !== supporting.length) reasons.push("SOURCE_RECORD_SUPPORT_MISMATCH");
  if (!sameCanonical(sourceRecords, supporting)) reasons.push("SOURCE_RECORD_REFERENCE_MISMATCH");
  if (supporting.some((record) => !HASH_PATTERN.test(String(record.observationHash || ""))
    || !HASH_PATTERN.test(String(record.sourceRecordHash || "")))) reasons.push("SUPPORT_REFERENCE_HASH_INVALID");
  if (supporting.some((record) => !ALLOWED_SUPPORT_TRUST_CLASSES.has(record.sourceTrustClass))) {
    reasons.push("UNSUPPORTED_TRUST_CLASS");
  }
  const declaredTrustClasses = uniqueSorted(candidate.sourceTrustClasses || []);
  if (!sameCanonical(declaredTrustClasses, selectedTrustClasses)) reasons.push("TRUST_CLASS_DECLARATION_MISMATCH");
  for (const trustClass of Object.values(HISTORICAL_TRUST_CLASS)) {
    const calculated = supporting.filter((record) => record.sourceTrustClass === trustClass).length;
    if (Number(candidate.trustComposition?.[trustClass] || 0) !== calculated) reasons.push(`TRUST_COMPOSITION_MISMATCH_${trustClass}`);
  }
  return {
    reasons: uniqueSorted(reasons),
    independentEpisodeCount: uniqueRecordHashes.length,
    independentObjectClassCount: uniqueObjectClasses.length,
    trustClasses: selectedTrustClasses
  };
}

export function registeredRegressionManifest() {
  return canonicalClone(REGISTERED_REGRESSIONS);
}

export function reviewLessonCandidate(candidate = {}) {
  const verification = verifyRetrospectiveLessonCandidate(candidate);
  const support = candidateSupportReview(candidate);
  const unsafePaths = executionControlPaths(candidate);
  const reasons = [...support.reasons];
  if (!verification.valid) reasons.push("CANDIDATE_INTEGRITY_INVALID");
  if (!signatureHashValid(candidate.causalSignature)) reasons.push("CAUSAL_SIGNATURE_INTEGRITY_INVALID");
  if (candidate.causalSignature?.causalityDomain !== "INTERNAL") reasons.push("CAUSALITY_NOT_INTERNAL");
  if (!mechanismContract(candidate)) reasons.push("UNREGISTERED_CAUSAL_MECHANISM");
  if (unsafePaths.length) reasons.push("CANDIDATE_CONTROLLED_EXECUTION_FIELD");
  const disconfirming = Array.isArray(candidate.disconfirmingObservations) ? candidate.disconfirmingObservations : [];
  if (disconfirming.length) reasons.push("COUNTEREVIDENCE_UNRESOLVED");
  if (candidate.promotionEligibilityState !== "ELIGIBLE_FOR_HUMAN_REVIEW_ONLY") {
    reasons.push("CANDIDATE_NOT_ELIGIBLE_FOR_HUMAN_REVIEW");
  }
  const integrityReasons = reasons.filter((reason) => reason !== "COUNTEREVIDENCE_UNRESOLVED");
  const eligibleForCharter = integrityReasons.length === 0;
  return {
    state: reasons.length ? LESSON_GATE_STATE.PROOF_BLOCKED : LESSON_GATE_STATE.PROOF_REQUIRED,
    eligibleForCharter,
    proofEligible: reasons.length === 0,
    candidateHash: candidate.candidateHash || "",
    candidateIntegrity: verification,
    independentEpisodeCount: support.independentEpisodeCount,
    independentObjectClassCount: support.independentObjectClassCount,
    trustClasses: support.trustClasses,
    unsafeExecutionControlPaths: unsafePaths.sort((left, right) => left.localeCompare(right)),
    reasons: uniqueSorted(reasons)
  };
}

function obligationsForKind(entries, kind) {
  return entries.filter((entry) => entry.caseKind === kind).map((entry) => entry.regressionId);
}

export function buildRegressionCharter({ candidate, fixtureManifestHash }) {
  requireHash(fixtureManifestHash, "fixtureManifestHash");
  const review = reviewLessonCandidate(candidate);
  if (!review.eligibleForCharter) throw new Error(`Lesson Candidate rejected: ${review.reasons.join(",")}`);
  const contract = mechanismContract(candidate);
  const candidateObligations = uniqueSorted(candidate.regressionObligations || []);
  const expectedObligations = uniqueSorted(contract.candidateObligations);
  const unmappedObligations = uniqueSorted([
    ...candidateObligations.filter((item) => !expectedObligations.includes(item)),
    ...expectedObligations.filter((item) => !candidateObligations.includes(item))
  ]);
  const regressions = selectedRegisteredRegressions(candidate);
  const registeredRegressionIdentifiers = regressions.map((entry) => entry.regressionId);
  const core = {
    schemaVersion: REGRESSION_CHARTER_SCHEMA_VERSION,
    recordType: "REGRESSION_CHARTER",
    lessonCandidateHash: candidate.candidateHash,
    causalSignatureHash: candidate.causalSignature.signatureHash,
    sourceTrustComposition: canonicalClone(candidate.trustComposition),
    independentSupportingEpisodeCount: review.independentEpisodeCount,
    independentObjectClassCount: review.independentObjectClassCount,
    purposeCoverage: uniqueSorted(candidate.purposeCoverage || []),
    counterevidenceState: candidate.disconfirmingObservations?.length ? "UNRESOLVED" : "NONE",
    proposedInvariant: canonicalClone(candidate.proposedInvariant),
    invariantScope: canonicalClone(candidate.scope),
    explicitNonScope: uniqueSorted(candidate.nonScope || []),
    forbiddenOverreach: uniqueSorted(candidate.forbiddenOverreach || []),
    safetyImplications: uniqueSorted(candidate.safetyImplications || []),
    requiredPositiveRepairCases: obligationsForKind(regressions, REGRESSION_CASE_KIND.POSITIVE_REPAIR),
    requiredPreservationCases: obligationsForKind(regressions, REGRESSION_CASE_KIND.PRESERVATION),
    requiredCounterexamples: obligationsForKind(regressions, REGRESSION_CASE_KIND.COUNTEREXAMPLE),
    requiredPurposeNeutralityCases: obligationsForKind(regressions, REGRESSION_CASE_KIND.PURPOSE_NEUTRALITY),
    requiredSafetyCases: obligationsForKind(regressions, REGRESSION_CASE_KIND.SAFETY),
    requiredUnrelatedRegressionCoverage: obligationsForKind(regressions, REGRESSION_CASE_KIND.UNRELATED_REGRESSION),
    registeredRegressionIdentifiers,
    registeredRegressionManifestHash: REGISTERED_REGRESSION_MANIFEST_HASH,
    fixtureManifestHash,
    mappedCandidateObligations: expectedObligations,
    unmappedObligations,
    proofEligibilityState: review.proofEligible && !unmappedObligations.length
      ? LESSON_GATE_STATE.PROOF_REQUIRED
      : LESSON_GATE_STATE.PROOF_BLOCKED,
    runtimeConsumptionAuthorized: false,
    sourceMutationAuthorized: false
  };
  const charterSeed = sha256Object(core);
  return withCanonicalHash({
    ...core,
    charterId: `regression-charter-${charterSeed.slice(0, 24)}`
  }, "charterHash");
}

export function validateRegressionCharter(charter = {}, candidate = {}) {
  const selected = selectedRegisteredRegressions(candidate).map((entry) => entry.regressionId);
  const failures = [];
  if (!canonicalHashValid(charter, "charterHash")) failures.push("CHARTER_HASH_MISMATCH");
  if (charter.schemaVersion !== REGRESSION_CHARTER_SCHEMA_VERSION) failures.push("CHARTER_SCHEMA_MISMATCH");
  if (charter.recordType !== "REGRESSION_CHARTER") failures.push("CHARTER_TYPE_MISMATCH");
  if (charter.lessonCandidateHash !== candidate.candidateHash) failures.push("CANDIDATE_BINDING_MISMATCH");
  if (charter.causalSignatureHash !== candidate.causalSignature?.signatureHash) failures.push("SIGNATURE_BINDING_MISMATCH");
  if (charter.registeredRegressionManifestHash !== REGISTERED_REGRESSION_MANIFEST_HASH) failures.push("REGRESSION_MANIFEST_MISMATCH");
  if (!sameCanonical(charter.registeredRegressionIdentifiers, selected)) failures.push("REGISTERED_REGRESSION_SET_MISMATCH");
  if (!HASH_PATTERN.test(String(charter.fixtureManifestHash || ""))) failures.push("FIXTURE_MANIFEST_HASH_INVALID");
  const unmapped = Array.isArray(charter.unmappedObligations) ? charter.unmappedObligations : [];
  const proofEligible = failures.length === 0
    && unmapped.length === 0
    && charter.counterevidenceState === "NONE"
    && charter.proofEligibilityState === LESSON_GATE_STATE.PROOF_REQUIRED;
  return { valid: failures.length === 0, proofEligible, failures: uniqueSorted(failures) };
}

function normalizeRepositoryState(repositoryState = {}) {
  return {
    head: requireHash(repositoryState.head, "repository HEAD"),
    treeHash: requireHash(repositoryState.treeHash, "repository tree hash"),
    changedSourceManifestHash: requireHash(repositoryState.changedSourceManifestHash, "changed-source manifest hash"),
    version: cleanObjectText(repositoryState.version, 32)
  };
}

function normalizeFixtureHashes(fixtureHashes = []) {
  const selected = fixtureHashes.map((entry) => ({
    fixtureId: requireSafeIdentifier(entry.fixtureId, "fixtureId"),
    sha256: requireHash(entry.sha256, "fixture hash")
  }));
  const ids = selected.map((entry) => entry.fixtureId);
  if (new Set(ids).size !== ids.length) throw new Error("Duplicate fixture identifier.");
  return selected.sort((left, right) => left.fixtureId.localeCompare(right.fixtureId));
}

export function createRegisteredRegressionResult(regressionId, disposition) {
  const id = requireSafeIdentifier(regressionId, "regressionId");
  if (!REGRESSION_BY_ID.has(id)) throw new Error(`Unregistered regression identifier: ${id}`);
  if (!Object.values(REGRESSION_DISPOSITION).includes(disposition)) throw new Error("Invalid regression disposition.");
  return { regressionId: id, disposition };
}

function resultCoverage(results, requiredIds) {
  const byId = new Map(results.map((result) => [result.regressionId, result]));
  const missing = requiredIds.filter((id) => !byId.has(id));
  const requiredFailures = requiredIds.filter((id) => byId.has(id) && byId.get(id).disposition !== REGRESSION_DISPOSITION.PASS);
  return { missing, requiredFailures };
}

export function buildRegressionEvidenceBundle({
  candidate,
  charter,
  repositoryState,
  fixtureManifestHash,
  fixtureHashes = [],
  regressionResults = [],
  networkDenied,
  sourceUnmodified
}) {
  const charterValidation = validateRegressionCharter(charter, candidate);
  if (!charterValidation.valid) throw new Error(`Regression Charter invalid: ${charterValidation.failures.join(",")}`);
  requireHash(fixtureManifestHash, "fixtureManifestHash");
  if (fixtureManifestHash !== charter.fixtureManifestHash) throw new Error("Fixture manifest does not match the Regression Charter.");
  const repository = normalizeRepositoryState(repositoryState);
  const fixtures = normalizeFixtureHashes(fixtureHashes);
  const results = regressionResults.map((result) => createRegisteredRegressionResult(result.regressionId, result.disposition))
    .sort((left, right) => left.regressionId.localeCompare(right.regressionId));
  const resultIds = results.map((result) => result.regressionId);
  if (new Set(resultIds).size !== resultIds.length) throw new Error("Duplicate registered regression result.");
  const requiredIds = uniqueSorted(charter.registeredRegressionIdentifiers || []);
  if (results.some((result) => !requiredIds.includes(result.regressionId))) throw new Error("Regression result is outside the Charter allowlist.");
  const coverage = resultCoverage(results, requiredIds);
  const failedIds = uniqueSorted([...coverage.missing, ...coverage.requiredFailures]);
  const passed = results.filter((result) => result.disposition === REGRESSION_DISPOSITION.PASS).length;
  const failed = results.filter((result) => result.disposition === REGRESSION_DISPOSITION.FAIL).length;
  const skipped = results.filter((result) => result.disposition === REGRESSION_DISPOSITION.SKIP).length;
  const bundlePassed = charterValidation.proofEligible
    && failedIds.length === 0
    && networkDenied === true
    && sourceUnmodified === true;
  const core = {
    schemaVersion: REGRESSION_EVIDENCE_BUNDLE_SCHEMA_VERSION,
    recordType: "REGRESSION_EVIDENCE_BUNDLE",
    lessonCandidateHash: candidate.candidateHash,
    regressionCharterHash: charter.charterHash,
    repository,
    registeredRegressionManifestHash: REGISTERED_REGRESSION_MANIFEST_HASH,
    fixtureManifestHash,
    fixtureHashes: fixtures,
    requiredRegressionIds: requiredIds,
    executedRegressionIds: resultIds,
    regressionResults: results,
    coverage: {
      requiredCount: requiredIds.length,
      executedCount: results.length,
      passCount: passed,
      failCount: failed,
      permittedSkipCount: 0,
      requiredSkipCount: skipped,
      missingRequiredIds: coverage.missing,
      requiredCaseFailures: failedIds
    },
    unrelatedRegressionResults: results.filter((result) => REGRESSION_BY_ID.get(result.regressionId).caseKind === REGRESSION_CASE_KIND.UNRELATED_REGRESSION),
    safetyRegressionResults: results.filter((result) => REGRESSION_BY_ID.get(result.regressionId).caseKind === REGRESSION_CASE_KIND.SAFETY),
    purposeNeutralityResults: results.filter((result) => REGRESSION_BY_ID.get(result.regressionId).caseKind === REGRESSION_CASE_KIND.PURPOSE_NEUTRALITY),
    networkDenialResult: networkDenied === true ? "PASS" : "FAIL",
    sourceMutationResult: sourceUnmodified === true ? "PASS" : "FAIL",
    startState: "STARTED",
    completionState: "COMPLETED",
    bundleState: bundlePassed ? "PASS" : "FAIL"
  };
  return withCanonicalHash(core, "bundleHash");
}

export function validateRegressionEvidenceBundle(bundle = {}, { candidate, charter, repositoryState } = {}) {
  const failures = [];
  if (!canonicalHashValid(bundle, "bundleHash")) failures.push("BUNDLE_HASH_MISMATCH");
  if (bundle.schemaVersion !== REGRESSION_EVIDENCE_BUNDLE_SCHEMA_VERSION) failures.push("BUNDLE_SCHEMA_MISMATCH");
  if (bundle.lessonCandidateHash !== candidate?.candidateHash) failures.push("BUNDLE_CANDIDATE_MISMATCH");
  if (bundle.regressionCharterHash !== charter?.charterHash) failures.push("BUNDLE_CHARTER_MISMATCH");
  if (bundle.registeredRegressionManifestHash !== REGISTERED_REGRESSION_MANIFEST_HASH) failures.push("BUNDLE_REGRESSION_MANIFEST_MISMATCH");
  if (bundle.fixtureManifestHash !== charter?.fixtureManifestHash) failures.push("BUNDLE_FIXTURE_MANIFEST_MISMATCH");
  let repository;
  try {
    repository = normalizeRepositoryState(repositoryState || {});
  } catch {
    failures.push("REPOSITORY_STATE_INVALID");
  }
  if (repository && !sameCanonical(bundle.repository, repository)) failures.push("REPOSITORY_STATE_DRIFT");
  const requiredIds = uniqueSorted(charter?.registeredRegressionIdentifiers || []);
  const results = Array.isArray(bundle.regressionResults) ? bundle.regressionResults : [];
  if (results.some((result) => !REGRESSION_BY_ID.has(result.regressionId))) failures.push("UNREGISTERED_REGRESSION_RESULT");
  if (results.some((result) => !requiredIds.includes(result.regressionId))) failures.push("REGRESSION_RESULT_OUTSIDE_CHARTER");
  if (results.some((result) => !Object.values(REGRESSION_DISPOSITION).includes(result.disposition))) failures.push("REGRESSION_DISPOSITION_INVALID");
  const resultIds = results.map((result) => result.regressionId);
  if (new Set(resultIds).size !== resultIds.length) failures.push("DUPLICATE_REGRESSION_RESULT");
  const coverage = resultCoverage(results, requiredIds);
  if (coverage.missing.length) failures.push("REQUIRED_REGRESSION_MISSING");
  if (coverage.requiredFailures.length) failures.push("REQUIRED_REGRESSION_FAILED_OR_SKIPPED");
  if (!sameCanonical(bundle.requiredRegressionIds, requiredIds)) failures.push("REQUIRED_REGRESSION_BINDING_MISMATCH");
  if (!sameCanonical(bundle.executedRegressionIds, resultIds)) failures.push("EXECUTED_REGRESSION_BINDING_MISMATCH");
  const passed = results.filter((result) => result.disposition === REGRESSION_DISPOSITION.PASS).length;
  const failed = results.filter((result) => result.disposition === REGRESSION_DISPOSITION.FAIL).length;
  const skipped = results.filter((result) => result.disposition === REGRESSION_DISPOSITION.SKIP).length;
  const expectedCoverage = {
    requiredCount: requiredIds.length,
    executedCount: results.length,
    passCount: passed,
    failCount: failed,
    permittedSkipCount: 0,
    requiredSkipCount: skipped,
    missingRequiredIds: coverage.missing,
    requiredCaseFailures: uniqueSorted([...coverage.missing, ...coverage.requiredFailures])
  };
  if (!sameCanonical(bundle.coverage, expectedCoverage)) failures.push("REGRESSION_COVERAGE_MISMATCH");
  try {
    if (!sameCanonical(bundle.fixtureHashes, normalizeFixtureHashes(bundle.fixtureHashes || []))) {
      failures.push("FIXTURE_HASH_BINDING_MISMATCH");
    }
  } catch {
    failures.push("FIXTURE_HASH_BINDING_INVALID");
  }
  const expectedUnrelated = results.filter((result) => REGRESSION_BY_ID.get(result.regressionId)?.caseKind === REGRESSION_CASE_KIND.UNRELATED_REGRESSION);
  const expectedSafety = results.filter((result) => REGRESSION_BY_ID.get(result.regressionId)?.caseKind === REGRESSION_CASE_KIND.SAFETY);
  const expectedPurpose = results.filter((result) => REGRESSION_BY_ID.get(result.regressionId)?.caseKind === REGRESSION_CASE_KIND.PURPOSE_NEUTRALITY);
  if (!sameCanonical(bundle.unrelatedRegressionResults, expectedUnrelated)) failures.push("UNRELATED_REGRESSION_BINDING_MISMATCH");
  if (!sameCanonical(bundle.safetyRegressionResults, expectedSafety)) failures.push("SAFETY_REGRESSION_BINDING_MISMATCH");
  if (!sameCanonical(bundle.purposeNeutralityResults, expectedPurpose)) failures.push("PURPOSE_REGRESSION_BINDING_MISMATCH");
  if (bundle.networkDenialResult !== "PASS") failures.push("NETWORK_DENIAL_FAILED");
  if (bundle.sourceMutationResult !== "PASS") failures.push("SOURCE_MUTATION_DETECTED");
  if (bundle.startState !== "STARTED" || bundle.completionState !== "COMPLETED") failures.push("BUNDLE_INCOMPLETE");
  const charterValidation = validateRegressionCharter(charter || {}, candidate || {});
  if (!charterValidation.proofEligible) failures.push("CHARTER_NOT_PROOF_ELIGIBLE");
  const expectedState = failures.length ? "FAIL" : "PASS";
  if (bundle.bundleState !== expectedState) failures.push("BUNDLE_STATE_MISMATCH");
  return { valid: failures.length === 0, proofEligible: failures.length === 0, failures: uniqueSorted(failures) };
}

export function buildLessonProof({ candidate, charter, bundle, repositoryState }) {
  const candidateReview = reviewLessonCandidate(candidate);
  const charterValidation = validateRegressionCharter(charter, candidate);
  const bundleValidation = validateRegressionEvidenceBundle(bundle, { candidate, charter, repositoryState });
  const failures = [];
  if (!candidateReview.proofEligible) failures.push(...candidateReview.reasons);
  if (!charterValidation.proofEligible) failures.push(...charterValidation.failures, "CHARTER_NOT_PROOF_ELIGIBLE");
  if (!bundleValidation.proofEligible) failures.push(...bundleValidation.failures);
  const repository = normalizeRepositoryState(repositoryState);
  const proofState = failures.length
    ? LESSON_GATE_STATE.PROOF_FAILED
    : LESSON_GATE_STATE.PROOF_PASSED_AWAITING_APPROVAL;
  const core = {
    schemaVersion: LESSON_PROOF_SCHEMA_VERSION,
    recordType: "LESSON_PROOF",
    proofState,
    lessonCandidateHash: candidate.candidateHash,
    regressionCharterHash: charter.charterHash,
    regressionEvidenceBundleHash: bundle.bundleHash,
    repository,
    registeredRegressionManifestHash: REGISTERED_REGRESSION_MANIFEST_HASH,
    fixtureManifestHash: charter.fixtureManifestHash,
    trustRequirementsSatisfied: candidateReview.proofEligible,
    independentSupportingEpisodeCount: candidateReview.independentEpisodeCount,
    independentObjectClassCount: candidateReview.independentObjectClassCount,
    verificationFailures: uniqueSorted(failures),
    stale: false,
    approvalAuthorized: false,
    runtimeConsumptionAuthorized: false
  };
  const seed = sha256Object(core);
  return withCanonicalHash({ ...core, proofId: `lesson-proof-${seed.slice(0, 24)}` }, "proofHash");
}

export function validateLessonProof(proof = {}, { candidate, charter, bundle, repositoryState } = {}) {
  const failures = [];
  if (!canonicalHashValid(proof, "proofHash")) failures.push("PROOF_HASH_MISMATCH");
  if (proof.schemaVersion !== LESSON_PROOF_SCHEMA_VERSION) failures.push("PROOF_SCHEMA_MISMATCH");
  if (proof.lessonCandidateHash !== candidate?.candidateHash) failures.push("PROOF_CANDIDATE_MISMATCH");
  if (proof.regressionCharterHash !== charter?.charterHash) failures.push("PROOF_CHARTER_MISMATCH");
  if (proof.regressionEvidenceBundleHash !== bundle?.bundleHash) failures.push("PROOF_BUNDLE_MISMATCH");
  if (proof.registeredRegressionManifestHash !== REGISTERED_REGRESSION_MANIFEST_HASH) failures.push("PROOF_REGRESSION_MANIFEST_MISMATCH");
  if (proof.fixtureManifestHash !== charter?.fixtureManifestHash) failures.push("PROOF_FIXTURE_MANIFEST_MISMATCH");
  let repository;
  try {
    repository = normalizeRepositoryState(repositoryState || {});
  } catch {
    failures.push("PROOF_REPOSITORY_STATE_INVALID");
  }
  if (repository && !sameCanonical(proof.repository, repository)) failures.push("PROOF_STALE_REPOSITORY_DRIFT");
  const bundleValidation = validateRegressionEvidenceBundle(bundle || {}, { candidate, charter, repositoryState });
  if (!bundleValidation.proofEligible) failures.push(...bundleValidation.failures);
  if (proof.proofState !== LESSON_GATE_STATE.PROOF_PASSED_AWAITING_APPROVAL) failures.push("PROOF_NOT_PASSING");
  if (proof.approvalAuthorized !== false || proof.runtimeConsumptionAuthorized !== false) failures.push("PROOF_OPERATIVE_AUTHORITY_INVALID");
  return { valid: failures.length === 0, approvalEligible: failures.length === 0, failures: uniqueSorted(failures) };
}

function normalizeOperatorAuthorization(operatorAuthorization = {}, decision) {
  const normalized = {
    authorizationType: operatorAuthorization.authorizationType,
    authorizationId: requireSafeIdentifier(operatorAuthorization.authorizationId, "authorizationId"),
    explicit: operatorAuthorization.explicit === true,
    authorized: operatorAuthorization.authorized === true
  };
  if (normalized.authorizationType !== "EXPLICIT_OPERATOR_AUTHORIZATION" || !normalized.explicit) {
    throw new Error("Approval requires an explicit structured operator authorization.");
  }
  if (decision === APPROVAL_DECISION.APPROVE_NON_OPERATIVE && !normalized.authorized) {
    throw new Error("Non-operative approval was not explicitly authorized.");
  }
  if (decision === APPROVAL_DECISION.REJECT && normalized.authorized) {
    throw new Error("A rejection receipt cannot carry approval authority.");
  }
  return normalized;
}

export function createApprovalReceipt({
  candidate,
  charter,
  proof,
  bundle,
  repositoryState,
  approvedScope,
  operatorAuthorization,
  decision,
  decisionReason
}) {
  if (!Object.values(APPROVAL_DECISION).includes(decision)) throw new Error("Invalid approval decision.");
  const proofValidation = validateLessonProof(proof, { candidate, charter, bundle, repositoryState });
  if (!proofValidation.approvalEligible) {
    throw new Error(`A passing bound Lesson Proof is required: ${proofValidation.failures.join(",")}`);
  }
  if (!sameCanonical(approvedScope, candidate.scope)) throw new Error("Approval scope does not match the Lesson Candidate.");
  const authorization = normalizeOperatorAuthorization(operatorAuthorization, decision);
  const repository = normalizeRepositoryState(repositoryState);
  const core = {
    schemaVersion: APPROVAL_RECEIPT_SCHEMA_VERSION,
    recordType: "APPROVAL_RECEIPT",
    lessonCandidateHash: candidate.candidateHash,
    regressionCharterHash: charter.charterHash,
    lessonProofHash: proof.proofHash,
    repository,
    approvedScope: canonicalClone(approvedScope),
    approvedScopeHash: sha256Object(approvedScope),
    operatorAuthorization: authorization,
    explicitNonOperativeBoundary: true,
    approvalDecision: decision,
    decisionReason: requireSafeIdentifier(decisionReason, "decisionReason"),
    approvalState: decision === APPROVAL_DECISION.APPROVE_NON_OPERATIVE
      ? LESSON_GATE_STATE.APPROVED_NON_OPERATIVE
      : LESSON_GATE_STATE.REJECTED,
    receiptConsumptionState: "UNCONSUMED",
    runtimeConsumptionAuthorized: false
  };
  const seed = sha256Object(core);
  return withCanonicalHash({ ...core, receiptId: `approval-receipt-${seed.slice(0, 24)}` }, "receiptHash");
}

export function validateApprovalReceipt(receipt = {}, {
  candidate,
  charter,
  proof,
  bundle,
  repositoryState
} = {}) {
  const failures = [];
  if (!canonicalHashValid(receipt, "receiptHash")) failures.push("RECEIPT_HASH_MISMATCH");
  if (receipt.schemaVersion !== APPROVAL_RECEIPT_SCHEMA_VERSION) failures.push("RECEIPT_SCHEMA_MISMATCH");
  if (receipt.lessonCandidateHash !== candidate?.candidateHash) failures.push("RECEIPT_CANDIDATE_MISMATCH");
  if (receipt.regressionCharterHash !== charter?.charterHash) failures.push("RECEIPT_CHARTER_MISMATCH");
  if (receipt.lessonProofHash !== proof?.proofHash) failures.push("RECEIPT_PROOF_MISMATCH");
  if (!sameCanonical(receipt.approvedScope, candidate?.scope)) failures.push("RECEIPT_SCOPE_MISMATCH");
  if (receipt.approvedScopeHash !== sha256Object(candidate?.scope)) failures.push("RECEIPT_SCOPE_HASH_MISMATCH");
  let repository;
  try {
    repository = normalizeRepositoryState(repositoryState || {});
  } catch {
    failures.push("RECEIPT_REPOSITORY_STATE_INVALID");
  }
  if (repository && !sameCanonical(receipt.repository, repository)) failures.push("RECEIPT_REPOSITORY_MISMATCH");
  if (receipt.explicitNonOperativeBoundary !== true || receipt.runtimeConsumptionAuthorized !== false) {
    failures.push("RECEIPT_NON_OPERATIVE_BOUNDARY_INVALID");
  }
  if (receipt.receiptConsumptionState !== "UNCONSUMED") failures.push("RECEIPT_ALREADY_CONSUMED");
  if (receipt.operatorAuthorization?.authorizationType !== "EXPLICIT_OPERATOR_AUTHORIZATION"
    || receipt.operatorAuthorization?.explicit !== true) failures.push("RECEIPT_EXPLICIT_AUTHORIZATION_MISSING");
  const proofValidation = validateLessonProof(proof || {}, { candidate, charter, bundle, repositoryState });
  if (!proofValidation.approvalEligible) failures.push(...proofValidation.failures);
  if (receipt.approvalDecision === APPROVAL_DECISION.APPROVE_NON_OPERATIVE) {
    if (receipt.operatorAuthorization?.authorized !== true) failures.push("RECEIPT_APPROVAL_NOT_AUTHORIZED");
    if (receipt.approvalState !== LESSON_GATE_STATE.APPROVED_NON_OPERATIVE) failures.push("RECEIPT_APPROVAL_STATE_INVALID");
  } else if (receipt.approvalDecision === APPROVAL_DECISION.REJECT) {
    if (receipt.operatorAuthorization?.authorized !== false) failures.push("RECEIPT_REJECTION_AUTHORITY_INVALID");
    if (receipt.approvalState !== LESSON_GATE_STATE.REJECTED) failures.push("RECEIPT_REJECTION_STATE_INVALID");
  } else failures.push("RECEIPT_DECISION_INVALID");
  return { valid: failures.length === 0, consumable: failures.length === 0, failures: uniqueSorted(failures) };
}

export function approveNonOperativeLesson({
  candidate,
  charter,
  proof,
  bundle,
  receipt,
  repositoryState,
  consumedReceiptHashes = []
}) {
  const receiptValidation = validateApprovalReceipt(receipt, { candidate, charter, proof, bundle, repositoryState });
  const consumed = uniqueSorted(consumedReceiptHashes);
  const reasons = [...receiptValidation.failures];
  if (consumed.includes(receipt.receiptHash)) reasons.push("RECEIPT_REPLAY_REJECTED");
  if (receipt.approvalDecision !== APPROVAL_DECISION.APPROVE_NON_OPERATIVE) reasons.push("APPROVAL_DECISION_REJECTED");
  if (reasons.length) {
    return {
      state: LESSON_GATE_STATE.REJECTED,
      reasons: uniqueSorted(reasons),
      approvedLessonRecord: null,
      consumedReceiptHashes: consumed
    };
  }
  const repository = normalizeRepositoryState(repositoryState);
  const core = {
    schemaVersion: APPROVED_LESSON_RECORD_SCHEMA_VERSION,
    recordType: "APPROVED_LESSON_RECORD",
    status: LESSON_GATE_STATE.APPROVED_NON_OPERATIVE,
    lessonCandidateHash: candidate.candidateHash,
    causalSignatureHash: candidate.causalSignature.signatureHash,
    regressionCharterHash: charter.charterHash,
    lessonProofHash: proof.proofHash,
    approvalReceiptHash: receipt.receiptHash,
    proposedInvariant: canonicalClone(candidate.proposedInvariant),
    scope: canonicalClone(candidate.scope),
    nonScope: uniqueSorted(candidate.nonScope || []),
    forbiddenOverreach: uniqueSorted(candidate.forbiddenOverreach || []),
    safetyImplications: uniqueSorted(candidate.safetyImplications || []),
    regressionObligations: uniqueSorted(charter.registeredRegressionIdentifiers || []),
    sourceTrustComposition: canonicalClone(candidate.trustComposition),
    approvalProvenance: {
      authorizationId: receipt.operatorAuthorization.authorizationId,
      receiptHash: receipt.receiptHash,
      proofHash: proof.proofHash,
      repository
    },
    receiptConsumptionState: "CONSUMED",
    runtimeConsumption: false,
    behavioralInstallation: false,
    codeInstallation: false,
    deploymentState: "NOT_AUTHORIZED"
  };
  const seed = sha256Object(core);
  const approvedLessonRecord = withCanonicalHash({
    ...core,
    approvedLessonId: `approved-lesson-${seed.slice(0, 24)}`
  }, "approvedLessonHash");
  return {
    state: LESSON_GATE_STATE.APPROVED_NON_OPERATIVE,
    reasons: [],
    approvedLessonRecord,
    consumedReceiptHashes: uniqueSorted([...consumed, receipt.receiptHash])
  };
}

export function validateApprovedLessonRecord(record = {}, { candidate, charter, proof, receipt } = {}) {
  const failures = [];
  if (!canonicalHashValid(record, "approvedLessonHash")) failures.push("APPROVED_LESSON_HASH_MISMATCH");
  if (record.schemaVersion !== APPROVED_LESSON_RECORD_SCHEMA_VERSION) failures.push("APPROVED_LESSON_SCHEMA_MISMATCH");
  if (record.status !== LESSON_GATE_STATE.APPROVED_NON_OPERATIVE) failures.push("APPROVED_LESSON_STATUS_INVALID");
  if (record.runtimeConsumption !== false) failures.push("RUNTIME_CONSUMPTION_NOT_FALSE");
  if (record.behavioralInstallation !== false) failures.push("BEHAVIORAL_INSTALLATION_NOT_FALSE");
  if (record.codeInstallation !== false) failures.push("CODE_INSTALLATION_NOT_FALSE");
  if (record.deploymentState !== "NOT_AUTHORIZED") failures.push("DEPLOYMENT_STATE_INVALID");
  if (record.receiptConsumptionState !== "CONSUMED") failures.push("RECEIPT_CONSUMPTION_STATE_INVALID");
  if (candidate && record.lessonCandidateHash !== candidate.candidateHash) failures.push("APPROVED_LESSON_CANDIDATE_MISMATCH");
  if (candidate && record.causalSignatureHash !== candidate.causalSignature?.signatureHash) failures.push("APPROVED_LESSON_SIGNATURE_MISMATCH");
  if (charter && record.regressionCharterHash !== charter.charterHash) failures.push("APPROVED_LESSON_CHARTER_MISMATCH");
  if (proof && record.lessonProofHash !== proof.proofHash) failures.push("APPROVED_LESSON_PROOF_MISMATCH");
  if (receipt && record.approvalReceiptHash !== receipt.receiptHash) failures.push("APPROVED_LESSON_RECEIPT_MISMATCH");
  return { valid: failures.length === 0, nonOperative: failures.length === 0, failures: uniqueSorted(failures) };
}

export function evaluateReflectionReportForLessonGate(reflectionReport = {}) {
  if (!canonicalHashValid(reflectionReport, "reportHash")) throw new Error("Phase 6G reflection report hash mismatch.");
  const candidates = Array.isArray(reflectionReport.lessonCandidates) ? reflectionReport.lessonCandidates : [];
  const reviews = candidates.map((candidate) => reviewLessonCandidate(candidate));
  let state = LESSON_GATE_STATE.NO_ELIGIBLE_CANDIDATE;
  if (reviews.some((review) => review.proofEligible)) state = LESSON_GATE_STATE.PROOF_REQUIRED;
  else if (reviews.length) state = LESSON_GATE_STATE.PROOF_BLOCKED;
  const core = {
    schemaVersion: LESSON_GATE_EVALUATION_SCHEMA_VERSION,
    recordType: "LESSON_GATE_EVALUATION",
    sourceReflectionReportHash: reflectionReport.reportHash,
    state,
    candidateCount: candidates.length,
    eligibleCandidateCount: reviews.filter((review) => review.proofEligible).length,
    candidateReviews: reviews.map((review) => ({
      candidateHash: review.candidateHash,
      state: review.state,
      proofEligible: review.proofEligible,
      reasons: review.reasons
    })).sort((left, right) => left.candidateHash.localeCompare(right.candidateHash)),
    artifactCounts: {
      regressionCharters: 0,
      regressionEvidenceBundles: 0,
      lessonProofs: 0,
      approvalReceipts: 0,
      approvedLessonRecords: 0
    },
    approvalInferred: false,
    runtimeConsumptionAuthorized: false
  };
  return withCanonicalHash(core, "gateEvaluationHash");
}
