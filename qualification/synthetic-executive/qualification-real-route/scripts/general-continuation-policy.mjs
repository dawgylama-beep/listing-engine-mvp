import assert from "node:assert/strict";
import { sha256Json } from "../../scripts/protocol.mjs";

export const GENERAL_CONTINUATION_POLICY = Object.freeze({
  schemaVersion: "1.2",
  policyType: "KATHERINE_GENERAL_EXECUTIVE_CONTINUATION_POLICY",
  evidenceSufficiencyScope: "NEXT_COGNITIVE_CAPABILITY",
  terminalInsufficiencyCapabilities: Object.freeze(["BOUNDED_EPISODE_RECONSTRUCTION", "BOUNDED_FAILURE_CLASSIFICATION"]),
  laterStageAbsenceDoesNotBlockEarlierStage: Object.freeze([
    "EXACT_RESPONSE_BYTES", "EXACT_REPAIR", "RETROSPECTIVE_EVIDENCE", "FINAL_RECOVERY_PROOF", "FINAL_AUTHORIZATION"
  ]),
  terminalInsufficiencyRequiredFields: Object.freeze([
    "blockedCognitiveCapability", "requiredFacts", "unavailableFacts", "whyReconstructionOrClassificationCannotProceedWithoutFabrication"
  ]),
  emptyMemorySemantics: Object.freeze({
    resultClassification: "VALID_EMPTY",
    recurrencePermitted: false,
    novelFailureClassificationPermitted: true,
    boundedTaskConstructionPermitted: true,
    fabricatedSimilarityProhibited: true
  }),
  classificationRule: Object.freeze({
    recurrence: "MATCHING_SELECTED_MEMORY_REQUIRED",
    historical: "TWO_OR_MORE_INDEPENDENT_OBSERVED_OCCURRENCES_WITHOUT_MATCHING_MEMORY",
    novel: "FIRST_OBSERVED_OCCURRENCE_WITHOUT_MATCHING_MEMORY",
    exactFailureClass: "USE_VISIBLE_FAILURE_CLASS_DERIVATION_WHEN_SUPPLIED_OTHERWISE_CONCISE_UPPER_SNAKE_CASE_CAUSAL_MECHANISM"
  }),
  dossierEvaluationRule: Object.freeze({
    architecturalFail: "ANY_UNRESOLVED_MATERIAL_INTERNAL_CONTRADICTION",
    validPass: "ALL_REQUIRED_CLAIMS_AND_EXACT_PATH_AND_NEGATIVE_AND_RESTART_PROOFS_PRESENT_WITHOUT_CONTRADICTION",
    boundedFail: "BOUNDED_SCOPE_AND_EXACT_PATH_PROVEN_BUT_LATER_REQUIRED_PROOF_INCOMPLETE",
    insufficientEvidence: "NO_USABLE_EXACT_PATH_OR_NO_MACHINE_VERIFIABLE_BOUNDED_CLAIM"
  }),
  continuationRule: Object.freeze({
    validPass: "ADVANCE_WITHIN_EXISTING_AUTHORITY",
    architecturalFail: "REJECT_RETURNED_EVIDENCE",
    boundedFailReachable: "REQUEST_BOUNDED_ENGINEERING_AUTHORITY",
    humanJudgmentRequired: "REQUEST_EXCEPTIONAL_HUMAN_AUTHORITY",
    otherwise: "STOP_WITH_EXPLICIT_UNCERTAINTY"
  }),
  contradictionLaw: "UNRESOLVED_MATERIAL_CONTRADICTION_REMAINS_VISIBLE_AND_BLOCKS_VALID_PASS_OR_ADVANCEMENT",
  compactActionRule: "ONE_ACTION_ONLY_MINIMUM_FACTS_MINIMUM_UNCERTAINTIES_NO_RESTATED_TRANSCRIPT",
  uncertaintyRule: "PRESERVE_UNCERTAINTY_AND_CONTINUE_WHEN_BOUNDED_PROGRESS_REMAINS",
  fabricationRule: "STOP_WHEN_RECONSTRUCTION_OR_CLASSIFICATION_REQUIRES_FABRICATION"
});

export const GENERAL_CONTINUATION_POLICY_HASH = sha256Json(GENERAL_CONTINUATION_POLICY);

export function generalContinuationPromptLines() {
  return Object.freeze([
    "Judge sufficiency for the next stage; preserve later uncertainty and continue bounded work supported by visible evidence.",
    "Missing later-stage bytes, repair, retrospective evidence, recovery proof, or authority does not block reconstruction or classification.",
    "Use DECLARE_INSUFFICIENT_EVIDENCE only when reconstruction or classification would require fabrication. Valid empty memory forbids recurrence but allows current-evidence classification.",
    "Classify recurrence only from selected memory with a matching recurrenceSignature; otherwise use HISTORICAL for at least two visible independent occurrences and NOVEL for one. Apply visible failureClassDerivation exactly when supplied.",
    "Dossier: contradiction => ARCHITECTURAL_FAIL; all claims, exact-path, negative, restart, and tests => VALID_PASS; bounded scope plus exact path with later proof missing => BOUNDED_FAIL; else INSUFFICIENT_EVIDENCE. Advance valid proof, reject contradictions, request reachable bounded or human authority, otherwise stop with uncertainty.",
    "Unresolved material contradiction stays in uncertainties and blocks valid pass, advancement, and proof-complete claims. Emit one compact current action; do not restate the transcript or prewrite later actions."
  ]);
}

export function deriveFailureClass({ subjectClass, observedMechanism }) {
  const value = `${subjectClass}_${observedMechanism}`.normalize("NFKC").toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  assert.ok(value.length > 0 && value.length <= 160, "FAILURE_CLASS_DERIVATION_INVALID");
  return value;
}

export function classifyFailureMode({ independentObservedOccurrences, observedMechanism, selectedMemoryRecords = [] }) {
  assert.ok(Number.isInteger(independentObservedOccurrences) && independentObservedOccurrences >= 1,
    "INDEPENDENT_OCCURRENCE_COUNT_REQUIRED");
  const matchingMemory = selectedMemoryRecords.some((record) =>
    String(record?.recurrenceSignature || "").trim() === String(observedMechanism || "").trim());
  if (matchingMemory) return "RECURRENCE";
  return independentObservedOccurrences >= 2 ? "HISTORICAL" : "NOVEL";
}

function proofPresent(value) {
  return value?.status === "PRESENT" && typeof value?.hash === "string" && value.hash.length > 0;
}

export function classifyDossierEvidence(dossier) {
  assert.ok(dossier && typeof dossier === "object", "DOSSIER_REQUIRED");
  const contradictions = Array.isArray(dossier.contradictions) ? dossier.contradictions.filter((item) => String(item).trim()) : [];
  if (contradictions.length > 0) return "ARCHITECTURAL_FAIL";
  const claims = Array.isArray(dossier.claims) ? dossier.claims : [];
  const allClaims = claims.length > 0 && claims.every((claim) => claim.asserted === true);
  const exactPath = proofPresent(dossier.exactPathProof);
  const allTestsPass = Array.isArray(dossier.testEvidence) && dossier.testEvidence.length > 0
    && dossier.testEvidence.every((item) => item.status === "PASS");
  if (allClaims && exactPath && proofPresent(dossier.negativeProof) && proofPresent(dossier.restartProof) && allTestsPass) return "VALID_PASS";
  const boundedScope = claims.some((claim) => /bounded-scope$/i.test(String(claim.claimId)) && claim.asserted === true);
  if (boundedScope && exactPath && allTestsPass) return "BOUNDED_FAIL";
  return "INSUFFICIENT_EVIDENCE";
}

export function selectContinuation({ dossierClassification, boundedProofReachable = false, humanJudgmentRequired = false, novelFailure = false }) {
  if (dossierClassification === "ARCHITECTURAL_FAIL") return "REJECT_RETURNED_EVIDENCE";
  if (dossierClassification === "VALID_PASS") return "ADVANCE_WITHIN_EXISTING_AUTHORITY";
  if (dossierClassification === "BOUNDED_FAIL" && boundedProofReachable) return "REQUEST_BOUNDED_ENGINEERING_AUTHORITY";
  if (humanJudgmentRequired) return "REQUEST_EXCEPTIONAL_HUMAN_AUTHORITY";
  return novelFailure ? "STOP_NOVEL_FAILURE" : "STOP_INSUFFICIENT_EVIDENCE";
}

export function validateContradictionInvariant({ action, workerDossier }) {
  const contradictions = Array.isArray(workerDossier?.contradictions)
    ? workerDossier.contradictions.filter((item) => String(item).trim()) : [];
  if (contradictions.length === 0) return Object.freeze({ valid: true, contradictionCount: 0 });
  assert.ok(Array.isArray(action.uncertainties) && action.uncertainties.length > 0,
    "COGNITIVE_CONTRADICTION_NOT_VISIBLE:$.uncertainties");
  if (action.actionType === "EVALUATE_RETURNED_ENGINEERING_EVIDENCE") {
    assert.equal(action.details?.classification, "ARCHITECTURAL_FAIL",
      "COGNITIVE_CONTRADICTION_FALSE_PASS:$.details.classification");
  }
  if (action.actionType === "SELECT_NEXT_LEGAL_ACTION") {
    assert.notEqual(action.details?.selection, "ADVANCE_WITHIN_EXISTING_AUTHORITY",
      "COGNITIVE_CONTRADICTION_UNSAFE_ADVANCE:$.details.selection");
  }
  return Object.freeze({ valid: true, contradictionCount: contradictions.length });
}
export function classifyStageScopedEvidence({
  blockedCognitiveCapability, requiredFacts = [], unavailableFacts = [],
  unavailableFactClasses = [], boundedProgressActions = []
}) {
  assert.ok(GENERAL_CONTINUATION_POLICY.terminalInsufficiencyCapabilities.includes(blockedCognitiveCapability));
  assert.ok(Array.isArray(requiredFacts) && requiredFacts.length > 0);
  assert.ok(Array.isArray(unavailableFacts));
  assert.ok(Array.isArray(unavailableFactClasses));
  assert.ok(Array.isArray(boundedProgressActions));
  const laterStageOnly = unavailableFactClasses.length > 0 && unavailableFactClasses.every((item) => GENERAL_CONTINUATION_POLICY.laterStageAbsenceDoesNotBlockEarlierStage.includes(item));
  const terminal = unavailableFacts.length > 0 && !laterStageOnly && boundedProgressActions.length === 0;
  return Object.freeze({
    classification: terminal ? "TERMINAL_STAGE_INSUFFICIENCY" : "BOUNDED_CONTINUATION_REQUIRED",
    terminal,
    preservesUncertainty: true,
    laterStageAbsenceOnly: laterStageOnly
  });
}
