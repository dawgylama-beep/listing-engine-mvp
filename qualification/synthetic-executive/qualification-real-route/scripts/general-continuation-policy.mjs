import assert from "node:assert/strict";
import { sha256Json } from "../../scripts/protocol.mjs";

export const GENERAL_CONTINUATION_POLICY = Object.freeze({
  schemaVersion: "1.1",
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
  uncertaintyRule: "PRESERVE_UNCERTAINTY_AND_CONTINUE_WHEN_BOUNDED_PROGRESS_REMAINS",
  fabricationRule: "STOP_WHEN_RECONSTRUCTION_OR_CLASSIFICATION_REQUIRES_FABRICATION"
});

export const GENERAL_CONTINUATION_POLICY_HASH = sha256Json(GENERAL_CONTINUATION_POLICY);

export function generalContinuationPromptLines() {
  return Object.freeze([
    "Evidence sufficiency is scoped to the next cognitive stage. Continue when the visible evidence supports bounded reconstruction, classification, task definition, proof specification, or an evidence request, while preserving uncertainty about later stages.",
    "Missing exact response bytes, an exact repair, retrospective evidence, final recovery proof, or final authority does not by itself block bounded reconstruction or failure classification.",
    "Use terminal DECLARE_INSUFFICIENT_EVIDENCE only when the required facts for bounded reconstruction or classification are unavailable and proceeding would require fabrication; identify the blocked capability, required facts, unavailable facts, and why it cannot proceed.",
    "A valid empty memory result means no recurrence is established; classify from current evidence, including a novel failure when supported, and continue bounded work."
  ]);
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
