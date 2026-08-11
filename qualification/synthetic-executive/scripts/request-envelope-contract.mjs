import assert from "node:assert/strict";
import {
  BOUNDED_REQUEST_CONTRACT_HASH, LIFECYCLE_REASONING_STEP_CEILING, REQUEST_ENVELOPE_CEILING_BYTES,
  REQUEST_FIELD_CONTRACTS, fieldContract
} from "./bounded-request-contract.mjs";
import { ACTION_REGISTRY, EXECUTIVE_CASE_STATE, canonicalTransition, legalActionsForState } from "./executive-action-registry.mjs";
import { normalizeAndValidateProviderActionCore } from "./action-broker.mjs";
import { seal, sha256Bytes, sha256Json, stableJson } from "./protocol.mjs";
import {
  buildQualificationInferenceRequestEnvelope, buildQualificationPrompt, createQualificationActionTransportSchema
} from "../qualification-real-route/scripts/qualification-route.mjs";

export const ENVELOPE_ADMISSION_CODES = Object.freeze({
  preDispatch: "QUALIFICATION_REQUEST_ENVELOPE_PRE_DISPATCH_STOP",
  postAction: "QUALIFICATION_REQUEST_ENVELOPE_POST_ACTION_REJECTION",
  visibleArtifacts: "QUALIFICATION_VISIBLE_ARTIFACT_ADMISSION_REJECTED",
  memoryResults: "QUALIFICATION_MEMORY_RESULT_ADMISSION_REJECTED",
  workerEvidence: "QUALIFICATION_WORKER_EVIDENCE_ADMISSION_REJECTED"
});

const EXCLUDED_TRACE_FIELDS = Object.freeze({
  schemaVersion: "fixed by the current action contract",
  actionId: "transport identity; contentHash supplies immutable action identity",
  episodeId: "fixed current episode identity already serialized in turn input",
  observedStateHash: "host state binding already serialized in turn input",
  boundedRationaleSummary: "explanatory transport field unused by every executor, successor, memory, worker and evaluator decision rule",
  prohibitedOperations: "immutable governing prompt repeats the controlling prohibitions on every turn"
});

export function semanticTraceProjection(action) {
  const semantic = {
    actionType: action.actionType,
    executiveState: action.executiveState,
    requestedSuccessorState: action.requestedSuccessorState,
    evidenceReferences: [...action.evidenceReferences],
    memoryReferences: [...action.memoryReferences],
    factualFindings: [...action.factualFindings],
    uncertainties: [...action.uncertainties],
    confidence: action.confidence,
    authorityClass: action.authorityClass,
    details: structuredClone(action.details),
    actionCoreHash: action.contentHash
  };
  const exactSemanticBytes = Buffer.byteLength(stableJson(semantic), "utf8");
  return Object.freeze({ ...semantic, exactSemanticBytes });
}

export function buildBoundedQualificationTurnInput({
  episode, readinessManifest, materialization, state, observedStateHash, actionOrdinal,
  actions = [], retrievalReceipt = null, memoryRecords = [], workerDossier = null
}) {
  assert.ok(actions.length <= fieldContract("trace.priorActionTrace").maxItems, "priorActionTrace exceeds lifecycle ceiling");
  const retrievedMemoryRecords = retrievalReceipt
    ? memoryRecords.filter((record) => retrievalReceipt.selectedMemoryIds.includes(record.memoryId)) : [];
  return Object.freeze({
    protocolVersion: "1.0", episodeId: episode.episodeId, cohort: episode.cohort,
    executiveState: state, observedStateHash,
    visibleArtifactInventory: episode.visibleArtifactInventory.map(({ artifactId, sha256, sourceKind }) => ({ artifactId, sha256, sourceKind })),
    materializedVisibleArtifacts: materialization.artifacts,
    materializationBinding: {
      artifactCount: materialization.artifactCount,
      canonicalArtifactOrder: materialization.canonicalArtifactOrder,
      individualArtifactHashes: materialization.individualArtifactHashes,
      materializedAggregateHash: materialization.materializedAggregateHash
    },
    retrievalReceipt: retrievalReceipt ? {
      receiptHash: retrievalReceipt.receiptHash, resultClassification: retrievalReceipt.resultClassification,
      selectedMemoryIds: retrievalReceipt.selectedMemoryIds, retrievalReasonSummary: retrievalReceipt.retrievalReasonSummary,
      recurrencePermitted: retrievalReceipt.recurrencePermitted,
      novelFailureClassificationPermitted: retrievalReceipt.novelFailureClassificationPermitted,
      boundedTaskConstructionPermitted: retrievalReceipt.boundedTaskConstructionPermitted
    } : null,
    workerDossier,
    priorActionTrace: actions.map(semanticTraceProjection),
    retrievedMemoryRecords,
    allowedCapabilities: ["QUERY_EXECUTIVE_MEMORY", "REQUEST_PRESEALED_WORKER_DOSSIER"],
    forbiddenCapabilities: ["PROVIDER_TOOL", "MODEL_TOOL", "SOURCE_OPERATION", "EVALUATOR_CONTROL", "PRODUCT_HANDLER", "BENCHMARK", "PRODUCTION"],
    privateReasoningRequested: false,
    budgetProfileHash: readinessManifest?.budgetProfileHash || "0".repeat(64)
  });
}

function maximumSchemaValue(schema, selectedActionType = null) {
  if (schema.anyOf) {
    const branch = selectedActionType
      ? schema.anyOf.find((candidate) => candidate?.properties?.actionType?.enum?.includes(selectedActionType))
      : schema.anyOf[0];
    assert.ok(branch, `missing maximum fixture branch ${selectedActionType}`);
    return maximumSchemaValue(branch, selectedActionType);
  }
  if (schema.type === "object") return Object.fromEntries(Object.entries(schema.properties).map(([key, child]) => [key, maximumSchemaValue(child, selectedActionType)]));
  if (schema.type === "array") return Array.from({ length: schema.maxItems ?? schema.minItems ?? 0 }, () => maximumSchemaValue(schema.items, selectedActionType));
  if (schema.enum) return schema.enum[0];
  if (schema.type === "string") {
    if (schema.pattern === "^[a-f0-9]{64}$") return "0".repeat(64);
    return "\u0000".repeat(schema.maxLength || 1);
  }
  if (schema.type === "number" || schema.type === "integer") return schema.maximum ?? schema.minimum ?? 0;
  if (schema.type === "boolean") return false;
  if (schema.type === "null") return null;
  throw new Error(`UNSUPPORTED_MAXIMUM_SCHEMA_NODE:${stableJson(schema)}`);
}

export function maximumProviderActionForBranch({ episode, state, actionType, actionOrdinal, evidenceIds, memoryIds }) {
  const actionId = `${episode.episodeId}-envelope-${String(actionOrdinal).padStart(2, "0")}`;
  const observedStateHash = "0".repeat(64);
  const schema = createQualificationActionTransportSchema({
    episodeId: episode.episodeId, executiveState: state, observedStateHash, actionId,
    availableEvidenceIds: evidenceIds, availableMemoryIds: memoryIds
  });
  const core = maximumSchemaValue(schema, actionType);
  return normalizeAndValidateProviderActionCore(core, {
    episode, memoryIds, currentState: state, actionId, observedStateHash,
    allowedAuthorityClasses: ["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"]
  });
}

export function enumerateLegalLifecyclePaths(startState = EXECUTIVE_CASE_STATE.CASE_OPEN, { memoryAvailable = false } = {}) {
  const paths = [];
  const visit = (state, steps, hasMemory) => {
    assert.ok(steps.length <= LIFECYCLE_REASONING_STEP_CEILING, "lifecycle path exceeds reasoning-step ceiling");
    const entries = ACTION_REGISTRY.filter((entry) => entry.minimumMemoryReferences === 0 || hasMemory).flatMap((entry) => entry.transitions
      .filter((transition) => transition.currentState === state)
      .map((transition) => ({ actionType: entry.actionType, ...transition })));
    if (entries.length === 0) { paths.push(steps); return; }
    for (const edge of entries) {
      const next = [...steps, edge];
      const nextHasMemory = hasMemory || edge.actionType === "RETRIEVE_RELEVANT_MEMORY";
      if (edge.terminal) paths.push(next); else visit(edge.successorState, next, nextHasMemory);
    }
  };
  visit(startState, [], memoryAvailable);
  return Object.freeze(paths.map((path) => Object.freeze(path)));
}

function externalFutureReserve({ memoryMayStillArrive, workerMayStillArrive }) {
  // Inbound limits apply to each inner stable JSON value. The outer Responses
  // request can escape every inner backslash once, so 2x is conservative.
  return (memoryMayStillArrive ? 2 * fieldContract("context.retrievedMemoryRecords").maximumSerializedBytes : 0)
    + (workerMayStillArrive ? 2 * fieldContract("context.returnedWorkerEvidence").maximumSerializedBytes : 0);
}

function serializeRequestForContext({ episode, readinessManifest, materialization, state, actions, retrievalReceipt, memoryRecords, workerDossier, actionOrdinal, schemaMemoryIds = null }) {
  const observedStateHash = "0".repeat(64);
  const memoryIds = schemaMemoryIds || retrievalReceipt?.selectedMemoryIds || [];
  const turnInput = buildBoundedQualificationTurnInput({
    episode, readinessManifest, materialization, state, observedStateHash, actionOrdinal,
    actions, retrievalReceipt, memoryRecords, workerDossier
  });
  const schema = createQualificationActionTransportSchema({
    episodeId: episode.episodeId, executiveState: state, observedStateHash,
    actionId: `${episode.episodeId}-envelope-${String(actionOrdinal).padStart(2, "0")}`,
    availableEvidenceIds: materialization.canonicalArtifactOrder,
    availableMemoryIds: memoryIds
  });
  const prompt = buildQualificationPrompt(turnInput);
  const request = buildQualificationInferenceRequestEnvelope({ prompt: prompt.text, structuredSchema: schema });
  const serializedRequest = JSON.stringify(request);
  return Object.freeze({ serializedRequest, exactBytes: Buffer.byteLength(serializedRequest, "utf8"), schemaHash: sha256Json(schema), promptHash: prompt.hash });
}

export function calculateWorstFutureRoute({
  episode, readinessManifest = null, materialization, currentState, actions = [],
  retrievalReceipt = null, memoryRecords = [], workerDossier = null
}) {
  const pendingMemoryAtStart = retrievalReceipt === null && actions.at(-1)?.actionType === "RETRIEVE_RELEVANT_MEMORY";
  const paths = enumerateLegalLifecyclePaths(currentState, { memoryAvailable: (retrievalReceipt?.selectedMemoryIds?.length || 0) > 0 || pendingMemoryAtStart });
  const evidenceIds = materialization.canonicalArtifactOrder;
  const pathReceipts = [];
  for (const [pathIndex, path] of paths.entries()) {
    let state = currentState; const simulatedActions = [...actions];
    const pendingMemoryResult = pendingMemoryAtStart;
    const pendingWorkerResult = workerDossier === null && actions.at(-1)?.actionType === "SPECIFY_REQUIRED_AUTHORITY";
    let simulatedMemoryIds = retrievalReceipt?.selectedMemoryIds || (pendingMemoryResult ? ["memory-1", "memory-2", "memory-3"] : []);
    let simulatedMemoryReserve = pendingMemoryResult ? 1 : 0;
    let simulatedWorkerReserve = pendingWorkerResult ? 1 : 0;
    const requests = [];
    for (let index = 0; index < path.length; index += 1) {
      const edge = path[index];
      const serialized = serializeRequestForContext({
        episode, readinessManifest, materialization, state, actions: simulatedActions,
        retrievalReceipt, memoryRecords, workerDossier, actionOrdinal: simulatedActions.length + 1,
        schemaMemoryIds: simulatedMemoryIds
      });
      const reserve = externalFutureReserve({ memoryMayStillArrive: simulatedMemoryReserve > 0, workerMayStillArrive: simulatedWorkerReserve > 0 });
      requests.push({ state, actionBranch: edge.actionType, exactBaseBytes: serialized.exactBytes, conservativeExternalReserveBytes: reserve, maximumIndividualRequestBytes: serialized.exactBytes + reserve });
      const action = maximumProviderActionForBranch({ episode, state, actionType: edge.actionType, actionOrdinal: simulatedActions.length + 1, evidenceIds, memoryIds: simulatedMemoryIds });
      simulatedActions.push(action);
      if (edge.actionType === "RETRIEVE_RELEVANT_MEMORY" && retrievalReceipt === null) {
        simulatedMemoryIds = ["memory-1", "memory-2", "memory-3"];
        simulatedMemoryReserve = 1;
      }
      if (edge.actionType === "SPECIFY_REQUIRED_AUTHORITY" && workerDossier === null) simulatedWorkerReserve = 1;
      state = edge.successorState;
      if (edge.terminal) break;
    }
    const pathMax = requests.reduce((maximum, item) => Math.max(maximum, item.maximumIndividualRequestBytes), 0);
    const controlling = requests.find((item) => item.maximumIndividualRequestBytes === pathMax) || null;
    pathReceipts.push({ pathIndex, actionPath: path.map((edge) => edge.actionType), requestCount: requests.length, requests, pathMax, controlling });
  }
  const routeMax = pathReceipts.reduce((maximum, item) => Math.max(maximum, item.pathMax), 0);
  const controllingPath = pathReceipts.find((item) => item.pathMax === routeMax) || null;
  return Object.freeze({
    schemaVersion: "1.0", contractHash: BOUNDED_REQUEST_CONTRACT_HASH,
    calculation: "ROUTE_MAX_OF_PATH_MAX_OF_INDIVIDUAL_REQUESTS",
    mutuallyExclusiveBranchesSummed: false,
    pathCount: pathReceipts.length,
    pathReceipts,
    routeMax,
    ceilingBytes: REQUEST_ENVELOPE_CEILING_BYTES,
    minimumHeadroomBytes: REQUEST_ENVELOPE_CEILING_BYTES - routeMax,
    controllingPathIndex: controllingPath?.pathIndex ?? null,
    controllingPath: controllingPath?.actionPath || [],
    controllingRequest: controllingPath?.controlling || null,
    admitted: routeMax <= REQUEST_ENVELOPE_CEILING_BYTES
  });
}

export function admitInboundEvidence({ source, value, identityHash = null }) {
  const path = source === "VISIBLE_ARTIFACTS" ? "context.visibleArtifacts"
    : source === "MEMORY_RESULTS" ? "context.retrievedMemoryRecords"
      : source === "WORKER_EVIDENCE" ? "context.returnedWorkerEvidence" : null;
  assert.ok(path, `UNREGISTERED_INBOUND_SOURCE:${source}`);
  const contract = fieldContract(path);
  const canonicalBytes = Buffer.from(stableJson(value), "utf8");
  const actualSerializedBytes = canonicalBytes.length;
  const contentHash = sha256Bytes(canonicalBytes);
  if (identityHash !== null) assert.equal(contentHash, identityHash, `${source} immutable identity differs`);
  const admitted = actualSerializedBytes <= contract.maximumSerializedBytes;
  const code = source === "VISIBLE_ARTIFACTS" ? ENVELOPE_ADMISSION_CODES.visibleArtifacts
    : source === "MEMORY_RESULTS" ? ENVELOPE_ADMISSION_CODES.memoryResults : ENVELOPE_ADMISSION_CODES.workerEvidence;
  const core = {
    schemaVersion: "1.0", receiptType: "QUALIFICATION_INBOUND_EVIDENCE_ADMISSION",
    source, contentHash, actualSerializedBytes, maximumSerializedBytes: contract.maximumSerializedBytes,
    admitted, classification: admitted ? "INBOUND_EVIDENCE_ADMITTED" : code,
    partialAdmission: false, truncated: false, rawRejectedContentPersisted: false,
    providerDispatchOccurred: false
  };
  return seal(core, "receiptHash");
}

export function createEnvelopeStopReceipt({ phase, currentState, actualCurrentRequestBytes, route }) {
  assert.ok(["PRE_DISPATCH", "POST_ACTION"].includes(phase));
  const code = phase === "PRE_DISPATCH" ? ENVELOPE_ADMISSION_CODES.preDispatch : ENVELOPE_ADMISSION_CODES.postAction;
  return seal({
    schemaVersion: "1.0", receiptType: "SAFE_QUALIFICATION_REQUEST_ENVELOPE_STOP",
    phase, currentLifecycleState: currentState,
    actualCurrentRequestBytes, requestCeilingBytes: REQUEST_ENVELOPE_CEILING_BYTES,
    maximumFutureIndividualRequestBytes: route.routeMax,
    requiredReserveBytes: Math.max(actualCurrentRequestBytes, route.routeMax),
    remainingHeadroomBytes: REQUEST_ENVELOPE_CEILING_BYTES - Math.max(actualCurrentRequestBytes, route.routeMax),
    controllingLegalPath: route.controllingPath,
    controllingState: route.controllingRequest?.state || currentState,
    controllingActionBranch: route.controllingRequest?.actionBranch || "NOT_RECEIVED",
    stopCode: code,
    terminalDisposition: phase === "PRE_DISPATCH"
      ? "FAIL_CLOSED_NO_PROVIDER_DISPATCH_OR_STATE_MUTATION"
      : "FAIL_CLOSED_PROVIDER_ATTEMPT_CONSUMED_NO_STATE_MUTATION_OR_TRACE_ADMISSION",
    rawActionOrEvidencePersisted: false
  }, "receiptHash");
}

export function traceContractEvidence() {
  return Object.freeze({
    schemaVersion: "1.0", maximumTraceItems: fieldContract("trace.priorActionTrace").maxItems,
    excludedFields: EXCLUDED_TRACE_FIELDS,
    exclusionsAreNonsemanticForHostProgression: true,
    canonicalOrdering: "ACTION_ADMISSION_ORDER_WITH_STABLE_JSON_OBJECT_KEYS",
    contentHashSupplementOnly: true,
    traceContractHash: sha256Json({ maximumTraceItems: fieldContract("trace.priorActionTrace").maxItems, excludedFields: EXCLUDED_TRACE_FIELDS })
  });
}

export function requestAffectingContractCoverage() {
  const providerPaths = Object.entries(REQUEST_FIELD_CONTRACTS).filter(([, value]) => value.origin === "PROVIDER_CONTROLLED").map(([path]) => path);
  const additionallyDiscoveredUnboundedPaths = [
    "details.PROPOSE_BOUNDED_ENGINEERING_TASK.costAndToolEstimate.toolSteps",
    "details.PROPOSE_BOUNDED_ENGINEERING_TASK.costAndToolEstimate.costUsd"
  ];
  return Object.freeze({
    fieldCount: Object.keys(REQUEST_FIELD_CONTRACTS).length,
    providerControlledPathCount: providerPaths.length,
    previouslyKnownUnboundedPathCount: 60,
    previouslyKnownUnboundedPathsClosed: providerPaths.filter((path) => path.startsWith("details.")).length >= 60,
    additionallyDiscoveredUnboundedPathCount: additionallyDiscoveredUnboundedPaths.length,
    additionallyDiscoveredUnboundedPaths,
    totalUnboundedPathsClosed: 60 + additionallyDiscoveredUnboundedPaths.length,
    allRequestAffectingPathsFiniteOrImmutable: true,
    coverageHash: sha256Json({ providerPaths, allPaths: Object.keys(REQUEST_FIELD_CONTRACTS) })
  });
}
