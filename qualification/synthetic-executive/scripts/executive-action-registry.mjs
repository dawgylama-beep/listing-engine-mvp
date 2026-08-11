import assert from "node:assert/strict";

export const ACTION_REGISTRY_VERSION = "1.1";

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

const string = () => ({ type: "string" });
const stringArray = ({ minimum = 0 } = {}) => ({ type: "array", items: string(), ...(minimum > 0 ? { minItems: minimum } : {}) });
const closedObject = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
const emptyDetails = () => closedObject({});
const transition = (currentState, successorState, terminal = false) => Object.freeze({ currentState, successorState, terminal });

const memoryRecordSchema = closedObject({
  schemaVersion: { type: "string", enum: ["1.0"] },
  memoryType: { type: "string", enum: ["GENERALIZED_LESSON_CANDIDATE"] },
  memoryId: string(),
  sourceEpisodeIds: stringArray({ minimum: 1 }),
  evidenceReferences: stringArray({ minimum: 1 }),
  evidenceAggregateHash: string(),
  observedFailurePattern: string(),
  generalizedRule: string(),
  triggeringConditions: stringArray({ minimum: 1 }),
  applicabilityBoundaries: stringArray({ minimum: 1 }),
  explicitNonApplicabilityConditions: stringArray(),
  recurrenceSignature: string(),
  recommendedActionPattern: string(),
  prohibitedActions: stringArray({ minimum: 1 }),
  requiredProofBeforeAdvancement: stringArray({ minimum: 1 }),
  authorityNormallyRequired: string(),
  confidence: { type: "number", minimum: 0, maximum: 1 },
  unresolvedUncertainty: stringArray(),
  status: { type: "string", enum: ["CANDIDATE"] },
  predecessorMemoryIds: stringArray()
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
      requiredFacts: stringArray({ minimum: 1 }),
      unavailableFacts: stringArray({ minimum: 1 }),
      whyReconstructionOrClassificationCannotProceedWithoutFabrication: string()
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"],
    nonEmptyDetailPaths: ["$.details.whyReconstructionOrClassificationCannotProceedWithoutFabrication"]
  },
  {
    actionType: "RETRIEVE_RELEVANT_MEMORY",
    transitions: [transition(EXECUTIVE_CASE_STATE.EPISODE_RECONSTRUCTED, EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED)],
    detailsSchema: closedObject({
      queryText: string(),
      queryFacets: closedObject({ cohort: stringArray(), pattern: stringArray(), failureClass: stringArray() })
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.queryText"]
  },
  {
    actionType: "CLASSIFY_FAILURE",
    transitions: [transition(EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED, EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED)],
    detailsSchema: closedObject({ failureClass: string() }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.failureClass"]
  },
  {
    actionType: "DECLARE_RECURRENCE",
    transitions: [transition(EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED, EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED)],
    detailsSchema: closedObject({ failureClass: string(), memoryMatchClass: string() }), minimumEvidenceReferences: 1, minimumMemoryReferences: 1,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.failureClass", "$.details.memoryMatchClass"]
  },
  {
    actionType: "DECLARE_NOVEL_FAILURE",
    transitions: [transition(EXECUTIVE_CASE_STATE.MEMORY_RETRIEVED, EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED)],
    detailsSchema: closedObject({ failureClass: string() }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"], nonEmptyDetailPaths: ["$.details.failureClass"]
  },
  {
    actionType: "PROPOSE_BOUNDED_ENGINEERING_TASK",
    transitions: [transition(EXECUTIVE_CASE_STATE.FAILURE_CLASSIFIED, EXECUTIVE_CASE_STATE.TASK_PROPOSED)],
    detailsSchema: closedObject({
      exactFailureClass: string(), affectedComponents: stringArray({ minimum: 1 }), proposedChangeSurface: stringArray({ minimum: 1 }),
      explicitlyExcludedComponents: stringArray({ minimum: 1 }), generalizedInvariant: string(), minimumRequiredRegressionSet: stringArray({ minimum: 1 }),
      exactPathOrStateProofRequirement: string(), rollbackRequirement: string(), stopCondition: string(),
      costAndToolEstimate: closedObject({ toolSteps: { type: "integer", minimum: 0 }, costUsd: { type: "number", minimum: 0 } }),
      requestedAuthority: string()
    }),
    minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
    authorityClasses: ["NO_NEW_AUTHORITY"],
    nonEmptyDetailPaths: ["$.details.exactFailureClass", "$.details.generalizedInvariant", "$.details.exactPathOrStateProofRequirement", "$.details.stopCondition"]
  },
  {
    actionType: "SPECIFY_REGRESSION_PROOF",
    transitions: [transition(EXECUTIVE_CASE_STATE.TASK_PROPOSED, EXECUTIVE_CASE_STATE.PROOF_SPECIFIED)],
    detailsSchema: closedObject({
      helperUnitProof: string(), exactProductionPathProof: string(), historicalStateProof: string(),
      negativeProof: string(), restartOrRecoveryProof: string(), forbiddenActivityProof: string()
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
      requiredClaims: { type: "array", minItems: 1, items: closedObject({ claimId: string(), status: { type: "string", enum: CLAIM_STATES }, evidenceReferences: stringArray({ minimum: 1 }) }) }
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
    detailsSchema: closedObject({ stopReason: string() }), minimumEvidenceReferences: 1, minimumMemoryReferences: 0,
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
    actionId: { type: "string", minLength: 1 }, actionType: { type: "string", enum: [...ACTION_TYPES] },
    authorityClass: { type: "string", enum: [...AUTHORITY_CLASSES] }, boundedRationaleSummary: { type: "string", minLength: 1 },
    confidence: { type: "number", minimum: 0, maximum: 1 }, contentHash: { $ref: "#/$defs/hash" },
    details: { type: "object" }, episodeId: { type: "string", minLength: 1 },
    evidenceReferences: stringArray({ minimum: 1 }), executiveState: { type: "string", minLength: 1 },
    factualFindings: stringArray(), memoryReferences: stringArray(), observedStateHash: { $ref: "#/$defs/hash" },
    prohibitedOperations: stringArray({ minimum: 1 }),
    requestedSuccessorState: { type: "string", readOnly: true, description: "Read-only successor appended by the broker from the canonical registry." },
    schemaVersion: { const: ACTION_REGISTRY_VERSION }, uncertainties: stringArray()
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
