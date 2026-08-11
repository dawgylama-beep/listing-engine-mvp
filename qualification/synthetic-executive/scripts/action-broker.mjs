import assert from "node:assert/strict";
import {
  ACTION_REGISTRY_VERSION, ACTION_TYPES, AUTHORITY_CLASSES, CLAIM_STATES, EVIDENCE_EVALUATIONS,
  NEXT_LEGAL_ACTIONS, actionDefinition, canonicalTransition, legalActionsForState
} from "./executive-action-registry.mjs";
import { validateContractSchemaValue } from "./bounded-request-contract.mjs";
import { createStateConditionedProviderActionSchema } from "./provider-action-schema.mjs";
import { assertHash, assertSafeId, exactKeys, seal, sha256Json } from "./protocol.mjs";

export { ACTION_TYPES, CLAIM_STATES, EVIDENCE_EVALUATIONS, NEXT_LEGAL_ACTIONS };
export const ACTION_SCHEMA_VERSION = ACTION_REGISTRY_VERSION;

const ACCEPTED_FIELDS = Object.freeze([
  "schemaVersion", "actionType", "actionId", "episodeId", "executiveState", "observedStateHash", "evidenceReferences",
  "memoryReferences", "factualFindings", "uncertainties", "confidence", "boundedRationaleSummary", "requestedSuccessorState",
  "authorityClass", "prohibitedOperations", "details", "contentHash"
]);
const PROVIDER_CORE_FIELDS = Object.freeze([
  "schemaVersion", "actionId", "episodeId", "executiveState", "observedStateHash", "factualFindings", "uncertainties",
  "confidence", "boundedRationaleSummary", "prohibitedOperations", "decision"
]);
const LEGACY_CALIBRATION_FIELDS = ACCEPTED_FIELDS;

export class ExecutiveActionContractError extends Error {
  constructor(code, validationRule, fieldPath) {
    super(`${code}:${fieldPath}:${validationRule}`);
    this.name = "ExecutiveActionContractError";
    this.code = code;
    this.validationRule = validationRule;
    this.fieldPath = fieldPath;
  }
}
const reject = (code, validationRule, fieldPath) => { throw new ExecutiveActionContractError(code, validationRule, fieldPath); };
const isObject = (value) => value && typeof value === "object" && !Array.isArray(value);

function nonEmptyString(value, fieldPath) {
  if (typeof value !== "string" || value.trim().length === 0) reject("ACTION_STRING_EMPTY", "NONEMPTY_STRING", fieldPath);
}

function validateCommonCore(core) {
  try { exactKeys(core, PROVIDER_CORE_FIELDS, "provider action core"); }
  catch { reject("ACTION_CORE_FIELDS_DIFFER", "EXACT_PROVIDER_CORE_FIELDS", "$"); }
  if (core.schemaVersion !== ACTION_SCHEMA_VERSION) reject("ACTION_SCHEMA_VERSION_INVALID", `EXACT_${ACTION_SCHEMA_VERSION}`, "$.schemaVersion");
  try { assertSafeId(core.actionId, "action ID"); } catch { reject("ACTION_ID_INVALID", "SAFE_ID", "$.actionId"); }
  try { assertSafeId(core.episodeId, "episode ID"); } catch { reject("ACTION_EPISODE_ID_INVALID", "SAFE_ID", "$.episodeId"); }
  try { assertHash(core.observedStateHash, "observed state hash"); } catch { reject("ACTION_OBSERVED_STATE_HASH_INVALID", "SHA256", "$.observedStateHash"); }
  for (const field of ["factualFindings", "uncertainties", "prohibitedOperations"]) {
    if (!Array.isArray(core[field]) || core[field].some((item) => typeof item !== "string")) reject("ACTION_COMMON_FIELD_INVALID", "STRING_ARRAY", `$.${field}`);
  }
  if (core.prohibitedOperations.length === 0) reject("ACTION_PROHIBITIONS_EMPTY", "MIN_ITEMS_1", "$.prohibitedOperations");
  if (!Number.isFinite(core.confidence) || core.confidence < 0 || core.confidence > 1) reject("ACTION_CONFIDENCE_INVALID", "RANGE_0_TO_1", "$.confidence");
  nonEmptyString(core.boundedRationaleSummary, "$.boundedRationaleSummary");
  if (!isObject(core.decision)) reject("ACTION_DECISION_INVALID", "TYPE_OBJECT", "$.decision");
}

function validateRegisteredCore(core, { episode, memoryIds = [], currentState, allowedAuthorityClasses = AUTHORITY_CLASSES, actionId = core.actionId, observedStateHash = core.observedStateHash }) {
  validateCommonCore(core);
  const submittedActionType = core.decision?.actionType;
  if (!ACTION_TYPES.includes(submittedActionType)) reject("ACTION_TYPE_UNREGISTERED", "REGISTERED_ACTION_TYPE", "$.decision.actionType");
  if (!legalActionsForState(currentState, { memoryIds }).includes(submittedActionType)) reject("ACTION_STATE_PAIR_UNREGISTERED", "REGISTERED_CURRENT_STATE_ACTION_PAIR", "$.decision.actionType");
  const schema = createStateConditionedProviderActionSchema({
    episodeId: episode.episodeId,
    executiveState: currentState,
    observedStateHash,
    actionId,
    availableEvidenceIds: episode.visibleArtifactInventory.map((item) => item.artifactId),
    availableMemoryIds: memoryIds
  });
  validateContractSchemaValue(core, schema, "$", reject);
  if (core.episodeId !== episode.episodeId) reject("ACTION_EPISODE_MISMATCH", "CURRENT_EPISODE_ID", "$.episodeId");
  if (core.executiveState !== currentState) reject("ACTION_STATE_MISMATCH", "CURRENT_LIFECYCLE_STATE", "$.executiveState");
  try { exactKeys(core.decision, ["actionType", "details", "evidenceReferences", "memoryReferences", "authorityClass"], "provider action decision"); }
  catch { reject("ACTION_DECISION_FIELDS_DIFFER", "EXACT_DECISION_FIELDS", "$.decision"); }
  const { actionType, details, evidenceReferences, memoryReferences, authorityClass } = core.decision;
  if (!ACTION_TYPES.includes(actionType)) reject("ACTION_TYPE_UNREGISTERED", "REGISTERED_ACTION_TYPE", "$.decision.actionType");
  const legal = legalActionsForState(currentState, { memoryIds });
  if (!legal.includes(actionType)) reject("ACTION_STATE_PAIR_UNREGISTERED", "REGISTERED_CURRENT_STATE_ACTION_PAIR", "$.decision.actionType");
  const definition = actionDefinition(actionType);
  validateContractSchemaValue(details, definition.detailsSchema, "$.decision.details", reject);
  for (const detailPath of definition.nonEmptyDetailPaths) {
    const relative = detailPath.replace(/^\$\.details\./, "").split(".");
    let value = details;
    for (const segment of relative) value = value?.[segment];
    nonEmptyString(value, detailPath.replace("$.details", "$.decision.details"));
  }
  if (!Array.isArray(evidenceReferences) || evidenceReferences.length < definition.minimumEvidenceReferences)
    reject("ACTION_EVIDENCE_REFERENCES_INSUFFICIENT", `MIN_ITEMS_${definition.minimumEvidenceReferences}`, "$.decision.evidenceReferences");
  if (!Array.isArray(memoryReferences) || memoryReferences.length < definition.minimumMemoryReferences)
    reject("ACTION_MEMORY_REFERENCES_INSUFFICIENT", `MIN_ITEMS_${definition.minimumMemoryReferences}`, "$.decision.memoryReferences");
  const visibleEvidence = new Set(episode.visibleArtifactInventory.map((item) => item.artifactId));
  for (const [index, reference] of evidenceReferences.entries()) if (!visibleEvidence.has(reference))
    reject("ACTION_EVIDENCE_REFERENCE_UNAVAILABLE", "VISIBLE_ARTIFACT_MEMBERSHIP", `$.decision.evidenceReferences[${index}]`);
  const knownMemory = new Set(memoryIds);
  for (const [index, reference] of memoryReferences.entries()) if (!knownMemory.has(reference))
    reject("ACTION_MEMORY_REFERENCE_UNAVAILABLE", "RETRIEVED_MEMORY_MEMBERSHIP", `$.decision.memoryReferences[${index}]`);
  if (!allowedAuthorityClasses.includes(authorityClass) || !definition.authorityClasses.includes(authorityClass))
    reject("ACTION_AUTHORITY_CLASS_INVALID", "REGISTERED_ACTION_AUTHORITY_CLASS", "$.decision.authorityClass");
  return { definition, actionType, details, evidenceReferences, memoryReferences, authorityClass };
}

function normalizeDetails(definition, details) {
  const normalized = structuredClone(details);
  if (definition.detailsNormalization === "SEAL_MEMORY_RECORD") {
    const memoryCore = { ...normalized.memoryRecord, schemaVersion: "1.0" };
    delete memoryCore.contentHash;
    normalized.memoryRecord = seal(memoryCore);
  }
  return normalized;
}

export function normalizeAndValidateProviderActionCore(core, context) {
  const accepted = validateRegisteredCore(core, context);
  const transition = canonicalTransition(context.currentState, accepted.actionType);
  const normalizedCore = {
    schemaVersion: ACTION_SCHEMA_VERSION,
    actionType: accepted.actionType,
    actionId: core.actionId,
    episodeId: core.episodeId,
    executiveState: core.executiveState,
    observedStateHash: core.observedStateHash,
    evidenceReferences: [...accepted.evidenceReferences],
    memoryReferences: [...accepted.memoryReferences],
    factualFindings: [...core.factualFindings],
    uncertainties: [...core.uncertainties],
    confidence: core.confidence,
    boundedRationaleSummary: core.boundedRationaleSummary,
    requestedSuccessorState: transition.successorState,
    authorityClass: accepted.authorityClass,
    prohibitedOperations: [...core.prohibitedOperations],
    details: normalizeDetails(accepted.definition, accepted.details)
  };
  const action = seal(normalizedCore);
  validateExecutiveAction(action, context);
  return action;
}

function acceptedDetailsForValidation(action) {
  const definition = actionDefinition(action.actionType);
  const details = structuredClone(action.details);
  if (definition.detailsNormalization === "SEAL_MEMORY_RECORD") {
    const memory = details.memoryRecord;
    if (!isObject(memory) || typeof memory.contentHash !== "string") reject("ACTION_MEMORY_RECORD_HASH_MISSING", "BROKER_SEALED_MEMORY_RECORD", "$.details.memoryRecord.contentHash");
    const memoryCore = structuredClone(memory); delete memoryCore.contentHash;
    if (sha256Json(memoryCore) !== memory.contentHash) reject("ACTION_MEMORY_RECORD_HASH_INVALID", "CONTENT_HASH", "$.details.memoryRecord.contentHash");
    delete details.memoryRecord.contentHash;
  }
  return details;
}

function validateRegisteredAction(action, context) {
  try { exactKeys(action, ACCEPTED_FIELDS, "executive action"); }
  catch { reject("ACCEPTED_ACTION_FIELDS_DIFFER", "EXACT_ACCEPTED_ACTION_FIELDS", "$"); }
  const providerCore = {
    schemaVersion: action.schemaVersion,
    actionId: action.actionId,
    episodeId: action.episodeId,
    executiveState: action.executiveState,
    observedStateHash: action.observedStateHash,
    factualFindings: action.factualFindings,
    uncertainties: action.uncertainties,
    confidence: action.confidence,
    boundedRationaleSummary: action.boundedRationaleSummary,
    prohibitedOperations: action.prohibitedOperations,
    decision: {
      actionType: action.actionType,
      details: acceptedDetailsForValidation(action),
      evidenceReferences: action.evidenceReferences,
      memoryReferences: action.memoryReferences,
      authorityClass: action.authorityClass
    }
  };
  validateRegisteredCore(providerCore, context);
  const transition = canonicalTransition(context.currentState, action.actionType);
  if (action.requestedSuccessorState !== transition.successorState) reject("ACTION_SUCCESSOR_DIVERGENCE", "REGISTRY_DERIVED_SUCCESSOR", "$.requestedSuccessorState");
  const actionCore = structuredClone(action); delete actionCore.contentHash;
  if (sha256Json(actionCore) !== action.contentHash) reject("ACTION_CONTENT_HASH_INVALID", "CONTENT_HASH", "$.contentHash");
  return Object.freeze({
    accepted: true,
    actionId: action.actionId,
    actionType: action.actionType,
    actionHash: action.contentHash,
    canonicalSuccessorState: transition.successorState,
    terminal: transition.terminal
  });
}

function validateLegacyCalibrationAction(action, { episode, memoryIds = [], currentState, allowedAuthorityClasses }) {
  exactKeys(action, LEGACY_CALIBRATION_FIELDS, "legacy calibration action");
  assert.equal(action.schemaVersion, "1.0"); assert.equal(action.actionType, "RECONSTRUCT_EPISODE");
  assertSafeId(action.actionId); assert.equal(action.episodeId, episode.episodeId); assert.equal(currentState, "INIT"); assert.equal(action.executiveState, "INIT");
  assertHash(action.observedStateHash); assert.equal(action.requestedSuccessorState, "EPISODE_RECONSTRUCTED");
  assert.ok(Array.isArray(action.evidenceReferences)); assert.ok(Array.isArray(action.memoryReferences)); assert.ok(Array.isArray(action.factualFindings)); assert.ok(Array.isArray(action.uncertainties));
  assert.ok(Number.isFinite(action.confidence) && action.confidence >= 0 && action.confidence <= 1);
  assert.ok(typeof action.boundedRationaleSummary === "string" && action.boundedRationaleSummary.length >= 1 && action.boundedRationaleSummary.length <= 1200);
  assert.ok(allowedAuthorityClasses.includes(action.authorityClass)); assert.ok(Array.isArray(action.prohibitedOperations) && action.prohibitedOperations.length > 0);
  const visible = new Set(episode.visibleArtifactInventory.map((item) => item.artifactId)); for (const item of action.evidenceReferences) assert.ok(visible.has(item));
  const memories = new Set(memoryIds); for (const item of action.memoryReferences) assert.ok(memories.has(item));
  exactKeys(action.details, [], "legacy calibration action details");
  const core = structuredClone(action); delete core.contentHash; assert.equal(sha256Json(core), action.contentHash);
  return Object.freeze({ accepted: true, actionId: action.actionId, actionType: action.actionType, actionHash: action.contentHash });
}

export function sealExecutiveAction(core) {
  if (core.executiveState === "INIT") {
    const legacy = { ...core, schemaVersion: "1.0" }; delete legacy.contentHash; return seal(legacy);
  }
  if (Object.hasOwn(core, "requestedSuccessorState")) reject("PROVIDER_CONTROLLED_SUCCESSOR_FORBIDDEN", "SUCCESSOR_DERIVED_BY_BROKER", "$.requestedSuccessorState");
  const decision = {
    actionType: core.actionType,
    details: core.details,
    evidenceReferences: core.evidenceReferences,
    memoryReferences: core.memoryReferences,
    authorityClass: core.authorityClass
  };
  const providerCore = {
    schemaVersion: ACTION_SCHEMA_VERSION,
    actionId: core.actionId,
    episodeId: core.episodeId,
    executiveState: core.executiveState,
    observedStateHash: core.observedStateHash,
    factualFindings: core.factualFindings,
    uncertainties: core.uncertainties,
    confidence: core.confidence,
    boundedRationaleSummary: core.boundedRationaleSummary,
    prohibitedOperations: core.prohibitedOperations,
    decision
  };
  return normalizeAndValidateProviderActionCore(providerCore, core.validationContext);
}

export function validateExecutiveAction(action, context) {
  return action.executiveState === "INIT" ? validateLegacyCalibrationAction(action, context) : validateRegisteredAction(action, context);
}

export function createBrokerRejection(actionCore, errorOrReason, context = {}) {
  if (typeof errorOrReason === "string") {
    const core = { schemaVersion: "1.0", receiptType: "EXECUTIVE_ACTION_BROKER_REJECTION", actionDigest: sha256Json(actionCore), reasonCode: errorOrReason, accepted: false };
    return seal(core, "receiptHash");
  }
  const error = errorOrReason instanceof ExecutiveActionContractError
    ? errorOrReason
    : new ExecutiveActionContractError("BROKER_REJECTED_TYPED_ACTION", "UNCLASSIFIED_FAIL_CLOSED_VALIDATION", "$");
  const submitted = actionCore?.decision?.actionType;
  const safeActionType = ACTION_TYPES.includes(submitted) ? submitted : "NOT_RECEIVED";
  let legalActionSet = [];
  try { legalActionSet = legalActionsForState(context.currentState, { memoryIds: context.memoryIds || [] }); } catch { legalActionSet = []; }
  const core = {
    schemaVersion: "1.1",
    receiptType: "SAFE_EXECUTIVE_ACTION_BROKER_REJECTION",
    currentLifecycleState: context.currentState || "NOT_RECEIVED",
    submittedActionType: safeActionType,
    actionCoreHash: sha256Json(actionCore),
    rejectionCode: error.code,
    validationRule: error.validationRule,
    fieldPath: error.fieldPath,
    legalActionSet,
    terminalDisposition: "IMMUTABLE_BROKER_REJECTION",
    accepted: false
  };
  return seal(core, "receiptHash");
}
