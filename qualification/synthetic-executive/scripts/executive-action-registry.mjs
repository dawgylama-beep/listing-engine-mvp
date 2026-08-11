import assert from "node:assert/strict";
import { boundedArray, boundedNumber, boundedString, boundedStringArray } from "./bounded-request-contract.mjs";

export const ACTION_REGISTRY_VERSION = "1.2";

export const EXECUTIVE_CASE_STATE = Object.freeze({
  CASE_OPEN: "CASE_OPEN",
  EPISODE_RECONSTRUCTED: "EPISODE_RECONSTRUCTED",
  MEMORY_RETRIEVED: "MEMORY_RETRIEVED",
  FAILURE_CLASSIFIED: "FAILURE_CLASSIFIED",
  TASK_PROPOSED: "TASK_PROPOSED",
  PROOF_SPECIFIED: "PROOF_SPECIFIED",
  AUTHORITY_SPECIFIED: "AUTHORITY_SPECIFIED",
  WORKER_DOSSIER_RECEIVED: "WORKER_DOSSIER_RECEIVED",
  EVIDENCE_EVALUATED: "EVIDENCE_EVALUATED",
  LESSON_RECORDED: "LESSON_RECORDED",
  NEXT_ACTION_SELECTED: "NEXT_ACTION_SELECTED",
  CASE_SEALED: "CASE_SEALED",
  STOPPED: "STOPPED"
});

export const NEXT_LEGAL_ACTIONS = Object.freeze([
  "ADVANCE_WITHIN_EXISTING_AUTHORITY",
  "REQUEST_BOUNDED_ENGINEERING_AUTHORITY",
  "REQUEST_EXCEPTIONAL_HUMAN_AUTHORITY",
  "REJECT_RETURNED_EVIDENCE",
  "STOP_NOVEL_FAILURE",
  "STOP_INSUFFICIENT_EVIDENCE",
  "NO_LEGAL_ACTION"
]);
export const EVIDENCE_EVALUATIONS = Object.freeze(["VALID_PASS", "BOUNDED_FAIL", "ARCHITECTURAL_FAIL", "INSUFFICIENT_EVIDENCE"]);
export const CLAIM_STATES = Object.freeze(["PROVEN", "CONTRADICTED", "NOT_PROVEN", "NOT_APPLICABLE"]);
export const AUTHORITY_CLASSES = Object.freeze(["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"]);

const closedObject = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const emptyDetails = () => closedObject({});
const transition = (currentState, successorState, terminal = false) => Object.freeze({ currentState, successorState, terminal });

const memoryRecordSchema = closedObject({
  schemaVersion: { type: "string", enum: ["1.0"] },
  memoryType: { type: "string", enum: ["GENERALIZED_LESSON_CANDIDATE"] },
  memoryId: boundedString("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.memoryId"),
  sourceEpisodeIds: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.sourceEpisodeIds", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.sourceEpisodeIds[]", { minimum: 1 }),
  evidenceReferences: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.evidenceReferences", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.evidenceReferences[]", { minimum: 1 }),
  evidenceAggregateHash: boundedString("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.evidenceAggregateHash"),
  observedFailurePattern: boundedString("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.observedFailurePattern"),
  generalizedRule: boundedString("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.generalizedRule"),
  triggeringConditions: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.triggeringConditions", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.triggeringConditions[]", { minimum: 1 }),
  applicabilityBoundaries: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.applicabilityBoundaries", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.applicabilityBoundaries[]", { minimum: 1 }),
  explicitNonApplicabilityConditions: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.explicitNonApplicabilityConditions", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.explicitNonApplicabilityConditions[]"),
  recurrenceSignature: boundedString("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.recurrenceSignature"),
  recommendedActionPattern: boundedString("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.recommendedActionPattern"),
  prohibitedActions: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.prohibitedActions", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.prohibitedActions[]", { minimum: 1 }),
  requiredProofBeforeAdvancement: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.requiredProofBeforeAdvancement", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.requiredProofBeforeAdvancement[]", { minimum: 1 }),
  authorityNormallyRequired: boundedString("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.authorityNormallyRequired"),
  confidence: boundedNumber("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.confidence"),
  unresolvedUncertainty: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.unresolvedUncertainty", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.unresolvedUncertainty[]"),
  status: { type: "string", enum: ["CANDIDATE"] },
  predecessorMemoryIds: boundedStringArray("details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.predecessorMemoryIds", "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.predecessorMemoryIds[]")
});

const entries = [
  {
    actionType: "RECONSTRUCT_EPISODE",
    transitions: [transition(EXECUTIVE_CASE_STATE.CASE_OPEN, EXECUTIVE_CASE_STATE.EPISODE_RECONSTRUCTED)],
    detailsSchema: emptyDetails(), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"]
  },
  {
    actionType: "DECLARE_INSUFFICIENT_EVIDENCE",
    transitions: [
      transition(EXECUTIVE_CASE_STATE.CASE_OPEN, EXECUTIVE_CASE_STATE.STOPPED, true),
      transition(EXECUTIVE_CASE_STATE.EPISODE_RECONSTRUCTED, EXECUTIVE_CASE_STATE.STOPPED, true),
      transition(EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED, EXECUTIVE_CASE_STATE.STOPPED, true)
    ],
    detailsSchema: closedObject({
      blockedCognitiveCapability: { type: "string", enum: ["BOUNDED_EPISODE_RECONSTRUCTION", "BOUNDED_FAILURE_CLASSIFICATION"] },
      requiredFacts: boundedStringArray("details.DECLARE_INSUFFICIENT_EVIDENCE.requiredFacts", "details.DECLARE_INSUFFICIENT_EVIDENCE.requiredFacts[]", { minimum: 1 }),
      unavailableFacts: boundedStringArray("details.DECLARE_INSUFFICIENT_EVIDENCE.unavailableFacts", "details.DECLARE_INSUFFICIENT_EVIDENCE.unavailableFacts[]", { minimum: 1 }),
      whyReconstructionOrClassificationCannotProceedWithoutFabrication: boundedString("details.DECLARE_INSUFFICIENT_EVIDENCE.whyReconstructionOrClassificationCannotProceedWithoutFabrication", { minLength: 1, pattern: "\\S" })
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"],
    nonEmptyDetailPaths: ["$.details.whyReconstructionOrClassificationCannotProceedWithoutFabrication"]
  },
  {
    actionType: "RETRIEVE_RELEVANT_MEMORY",
    transitions: [transition(EXECUTIVE_CASE_STATE.EPISODE_RECONSTRUCTED, EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED)],
    detailsSchema: closedObject({
      queryText: boundedString("details.RETRIEVE_RELEVANT_MEMORY.queryText", { minLength: 1, pattern: "\\S" }),
      queryFacets: closedObject({
        cohort: boundedStringArray("details.RETRIEVE_RELEVANT_MEMORY.queryFacets.cohort", "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.cohort[]"),
        pattern: boundedStringArray("details.RETRIEVE_RELEVANT_MEMORY.queryFacets.pattern", "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.pattern[]"),
        failureClass: boundedStringArray("details.RETRIEVE_RELEVANT_MEMORY.queryFacets.failureClass", "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.failureClass[]")
      })
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.queryText"]
  },
  {
    actionType: "CLASSIFY_FAILURE",
    transitions: [transition(EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED, EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED)],
    detailsSchema: closedObject({ failureClass: boundedString("details.CLASSIFY_FAILURE.failureClass", { minLength: 1, pattern: "\\S" }) }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.failureClass"]
  },
  {
    actionType: "DECLARE_RECURRENCE",
    transitions: [transition(EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED, EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED)],
    detailsSchema: closedObject({ failureClass: boundedString("details.DECLARE_RECURRENCE.failureClass", { minLength: 1, pattern: "\\S" }), memoryMatchClass: boundedString("details.DECLARE_RECURRENCE.memoryMatchClass", { minLength: 1, pattern: "\\S" }) }), minimumEvidenceReferences: 1, minimumMemoryReferences: 1,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.failureClass", "$.details.memoryMatchClass"]
  },
  {
    actionType: "DECLARE_NOVEL_FAILURE",
    transitions: [transition(EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED, EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED)],
    detailsSchema: closedObject({ failureClass: boundedString("details.DECLARE_NOVEL_FAILURE.failureClass", { minLength: 1, pattern: "\\S" }) }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.failureClass"]
  },
  {
    actionType: "PROPOSE_BOUNDED_ENGINEERING_TASK",
    transitions: [transition(EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED, EXECUTIVE_CASE_STATE.TASK_PROPOSED)],
    detailsSchema: closedObject({
      exactFailureClass: boundedString("details.PROPOSE_BOUNDED_ENGINEERING_TASK.exactFailureClass", { minLength: 1, pattern: "\\S" }),
      affectedComponents: boundedStringArray("details.PROPOSE_BOUNDED_ENGINEERING_TASK.affectedComponents", "details.PROPOSE_BOUNDED_ENGINEERING_TASK.affectedComponents[]", { minimum: 1 }),
      proposedChangeSurface: boundedStringArray("details.PROPOSE_BOUNDED_ENGINEERING_TASK.proposedChangeSurface", "details.PROPOSE_BOUNDED_ENGINEERING_TASK.proposedChangeSurface[]", { minimum: 1 }),
      explicitlyExcludedComponents: boundedStringArray("details.PROPOSE_BOUNDED_ENGINEERING_TASK.explicitlyExcludedComponents", "details.PROPOSE_BOUNDED_ENGINEERING_TASK.explicitlyExcludedComponents[]", { minimum: 1 }),
      generalizedInvariant: boundedString("details.PROPOSE_BOUNDED_ENGINEERING_TASK.generalizedInvariant", { minLength: 1, pattern: "\\S" }),
      minimumRequiredRegressionSet: boundedStringArray("details.PROPOSE_BOUNDED_ENGINEERING_TASK.minimumRequiredRegressionSet", "details.PROPOSE_BOUNDED_ENGINEERING_TASK.minimumRequiredRegressionSet[]", { minimum: 1 }),
      exactPathOrStateProofRequirement: boundedString("details.PROPOSE_BOUNDED_ENGINEERING_TASK.exactPathOrStateProofRequirement", { minLength: 1, pattern: "\\S" }),
      rollbackRequirement: boundedString("details.PROPOSE_BOUNDED_ENGINEERING_TASK.rollbackRequirement"),
      stopCondition: boundedString("details.PROPOSE_BOUNDED_ENGINEERING_TASK.stopCondition", { minLength: 1, pattern: "\\S" }),
      costAndToolEstimate: closedObject({
        toolSteps: boundedNumber("details.PROPOSE_BOUNDED_ENGINEERING_TASK.costAndToolEstimate.toolSteps"),
        costUsd: boundedNumber("details.PROPOSE_BOUNDED_ENGINEERING_TASK.costAndToolEstimate.costUsd")
      }),
      requestedAuthority: boundedString("details.PROPOSE_BOUNDED_ENGINEERING_TASK.requestedAuthority")
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"],
    nonEmptyDetailPaths: ["$.details.exactFailureClass", "$.details.generalizedInvariant", "$.details.exactPathOrStateProofRequirement", "$.details.stopCondition"]
  },
  {
    actionType: "SPECIFY_REGRESSION_PROOF",
    transitions: [transition(EXECUTIVE_CASE_STATE.TASK_PROPOSED, EXECUTIVE_CASE_STATE.PROOF_SPECIFIED)],
    detailsSchema: closedObject({
      helperUnitProof: boundedString("details.SPECIFY_REGRESSION_PROOF.helperUnitProof"),
      exactProductionPathProof: boundedString("details.SPECIFY_REGRESSION_PROOF.exactProductionPathProof"),
      historicalStateProof: boundedString("details.SPECIFY_REGRESSION_PROOF.historicalStateProof"),
      negativeProof: boundedString("details.SPECIFY_REGRESSION_PROOF.negativeProof"),
      restartOrRecoveryProof: boundedString("details.SPECIFY_REGRESSION_PROOF.restartOrRecoveryProof"),
      forbiddenActivityProof: boundedString("details.SPECIFY_REGRESSION_PROOF.forbiddenActivityProof")
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"]
  },
  {
    actionType: "SPECIFY_REQUIRED_AUTHORITY",
    transitions: [transition(EXECUTIVE_CASE_STATE.PROOF_SPECIFIED, EXECUTIVE_CASE_STATE.AUTHORITY_SPECIFIED)],
    detailsSchema: emptyDetails(), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"]
  },
  {
    actionType: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE",
    transitions: [
      transition(EXECUTIVE_CASE_STATE.AUTHORITY_SPECIFIED, EXECUTIVE_CASE_STATE.EVIDENCE_EVALUATED),
      transition(EXECUTIVE_CASE_STATE.WORKER_DOSSIER_RECEIVED, EXECUTIVE_CASE_STATE.EVIDENCE_EVALUATED)
    ],
    detailsSchema: closedObject({
      classification: { type: "string", enum: EVIDENCE_EVALUATIONS },
      requiredClaims: boundedArray("details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims", closedObject({
          claimId: boundedString("details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims[].claimId"),
          status: { type: "string", enum: CLAIM_STATES },
          evidenceReferences: boundedStringArray("details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims[].evidenceReferences", "details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims[].evidenceReferences[]", { minimum: 1 })
        }), { minimum: 1 })
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"]
  },
  {
    actionType: "WRITE_GENERALIZED_LESSON_CANDIDATE",
    transitions: [transition(EXECUTIVE_CASE_STATE.EVIDENCE_EVALUATED, EXECUTIVE_CASE_STATE.LESSON_RECORDED)],
    detailsSchema: closedObject({ memoryRecord: memoryRecordSchema }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], detailsNormalization: "SEAL_MEMORY_RECORD"
  },
  {
    actionType: "SELECT_NEXT_LEGAL_ACTION",
    transitions: [
      transition(EXECUTIVE_CASE_STATE.EVIDENCE_EVALUATED, EXECUTIVE_CASE_STATE.NEXT_ACTION_SELECTED),
      transition(EXECUTIVE_CASE_STATE.LESSON_RECORDED, EXECUTIVE_CASE_STATE.NEXT_ACTION_SELECTED)
    ],
    detailsSchema: closedObject({ selection: { type: "string", enum: NEXT_LEGAL_ACTIONS } }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"]
  },
  {
    actionType: "STOP_SAFELY",
    transitions: [
      ...Object.values(EXECUTIVE_CASE_STATE)
        .filter((state) => ![EXECUTIVE_CASE_STATE.CASE_SEALED, EXECUTIVE_CASE_STATE.STOPPED, EXECUTIVE_CASE_STATE.NEXT_ACTION_SELECTED].includes(state))
        .map((state) => transition(state, EXECUTIVE_CASE_STATE.STOPPED, true)),
      transition(EXECUTIVE_CASE_STATE.NEXT_ACTION_SELECTED, EXECUTIVE_CASE_STATE.CASE_SEALED, true)
    ],
    detailsSchema: closedObject({ stopReason: boundedString("details.STOP_SAFELY.stopReason", { minLength: 1, pattern: "\\S" }) }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.stopReason"]
  }
];

export const ACTION_REGISTRY = Object.freeze(entries.map((entry) => Object.freeze({
  ...entry,
  transitions: Object.freeze(entry.transitions),
  authorityClasses: Object.freeze(entry.authorityClasses),
  nonEmptyDetailPaths: Object.freeze(entry.nonEmptyDetailPaths || [])
})));
export const ACTION_TYPES = Object.freeze(ACTION_REGISTRY.map((entry) => entry.actionType));

export function actionDefinition(actionType) {
  const definition = ACTION_REGISTRY.find((entry) => entry.actionType === actionType);
  assert.ok(definition, `UNREGISTERED_EXECUTIVE_ACTION:${actionType}`);
  return definition;
}

export function legalActionsForState(currentState, { memoryIds = null } = {}) {
  assert.ok(Object.values(EXECUTIVE_CASE_STATE).includes(currentState), `UNREGISTERED_EXECUTIVE_STATE:${currentState}`);
  if ([EXECUTIVE_CASE_STATE.CASE_SEALED, EXECUTIVE_CASE_STATE.STOPPED].includes(currentState)) return Object.freeze([]);
  return Object.freeze(ACTION_REGISTRY
    .filter((entry) => entry.transitions.some((item) => item.currentState === currentState))
    .filter((entry) => memoryIds === null || entry.minimumMemoryReferences === 0 || memoryIds.length >= entry.minimumMemoryReferences)
    .map((entry) => entry.actionType));
}

export function canonicalTransition(currentState, actionType) {
  const definition = actionDefinition(actionType);
  const rule = definition.transitions.find((item) => item.currentState === currentState);
  assert.ok(rule, `UNREGISTERED_STATE_ACTION_PAIR:${currentState}:${actionType}`);
  return rule;
}

export function derivedTransitionRegistry() {
  const result = {};
  for (const state of Object.values(EXECUTIVE_CASE_STATE)) result[state] = {};
  for (const entry of ACTION_REGISTRY) for (const rule of entry.transitions) result[rule.currentState][entry.actionType] = rule.successorState;
  return Object.freeze(Object.fromEntries(Object.entries(result).map(([state, actions]) => [state, Object.freeze(actions)])));
}

export function registryActionFixtures() {
  return Object.freeze(ACTION_REGISTRY.flatMap((entry) => entry.transitions.map((rule) => Object.freeze({
    actionType: entry.actionType,
    currentState: rule.currentState,
    successorState: rule.successorState,
    terminal: rule.terminal,
    detailsSchema: structuredClone(entry.detailsSchema),
    minimumEvidenceReferences: entry.minimumEvidenceReferences,
    minimumMemoryReferences: entry.minimumMemoryReferences,
    authorityClasses: [...entry.authorityClasses]
  }))));
}

export function canonicalExecutiveActionSchema() {
  const properties = {
    actionId: { type: "string", minLength: 1, maxLength: 160 }, actionType: { type: "string", enum: [...ACTION_TYPES] },
    authorityClass: { type: "string", enum: [...AUTHORITY_CLASSES] }, boundedRationaleSummary: boundedString("provider.boundedRationaleSummary", { minLength: 1 }),
    confidence: boundedNumber("provider.confidence"), contentHash: { $ref: "#/$defs/hash" },
    details: { type: "object" }, episodeId: { type: "string", minLength: 1 },
    evidenceReferences: boundedStringArray("provider.decision.evidenceReferences", "provider.decision.evidenceReferences[]", { minimum: 1 }), executiveState: { type: "string", minLength: 1, maxLength: 64 },
    factualFindings: boundedStringArray("provider.factualFindings", "provider.factualFindings[]"), memoryReferences: boundedStringArray("provider.decision.memoryReferences", "provider.decision.memoryReferences[]"), observedStateHash: { $ref: "#/$defs/hash" },
    prohibitedOperations: boundedStringArray("provider.prohibitedOperations", "provider.prohibitedOperations[]", { minimum: 1 }),
    requestedSuccessorState: { type: "string", readOnly: true, description: "Read-only successor appended by the broker from the canonical registry." },
    schemaVersion: { const: ACTION_REGISTRY_VERSION }, uncertainties: boundedStringArray("provider.uncertainties", "provider.uncertainties[]")
  };
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://katherineseye.com/schemas/synthetic-executive/executive-action.schema.json",
    title: "Registry-derived normalized Executive Action",
    description: "Normalized accepted action. Legal state/action pairs, exact details, evidence requirements, authority classes, terminal dispositions and successor derivation are defined only by executive-action-registry.mjs. requestedSuccessorState is broker-derived and is never provider-transmitted.",
    type: "object",
    additionalProperties: false,
    required: ["schemaVersion", "actionType", "actionId", "episodeId", "executiveState", "observedStateHash", "evidenceReferences", "memoryReferences", "factualFindings", "uncertainties", "confidence", "boundedRationaleSummary", "requestedSuccessorState", "authorityClass", "prohibitedOperations", "details", "contentHash"],
    properties,
    $defs: { hash: { type: "string", pattern: "^[a-f0-9]{64}$" } }
  };
}
