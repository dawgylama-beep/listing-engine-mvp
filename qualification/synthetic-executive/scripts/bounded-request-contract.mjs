import assert from "node:assert/strict";
import { sha256Json, stableJson } from "./protocol.mjs";

export const BOUNDED_REQUEST_CONTRACT_VERSION = "1.0";
export const REQUEST_ENVELOPE_CEILING_BYTES = 64_000;
export const LIFECYCLE_REASONING_STEP_CEILING = 12;

const providerString = (purpose, maxCodePoints) => Object.freeze({
  origin: "PROVIDER_CONTROLLED", type: "string", maxCodePoints, purpose,
  providerConsumer: true, brokerConsumer: true, traceConsumer: true
});
const providerArray = (purpose, maxItems) => Object.freeze({
  origin: "PROVIDER_CONTROLLED", type: "array", maxItems, purpose,
  providerConsumer: true, brokerConsumer: true, traceConsumer: true
});
const providerNumber = (purpose, type, minimum, maximum) => Object.freeze({
  origin: "PROVIDER_CONTROLLED", type, minimum, maximum, purpose,
  providerConsumer: true, brokerConsumer: true, traceConsumer: true
});
const inbound = (origin, purpose, maximumSerializedBytes) => Object.freeze({
  origin, type: "serialized-json", maximumSerializedBytes, purpose,
  providerConsumer: false, brokerConsumer: false, inboundAdmissionConsumer: true, envelopeConsumer: true
});
const exactField = (origin, type, purpose, identitySource) => Object.freeze({
  origin, type, purpose, identitySource, exactImmutableIdentity: true, envelopeConsumer: true
});

// Every logical bound is declared once here. Schema, broker, trace, inbound admission,
// boundary fixtures and envelope accounting consume these canonical paths.
export const REQUEST_FIELD_CONTRACTS = Object.freeze({
  "provider.schemaVersion": exactField("HOST_CONTROLLED", "string", "current action-contract version", "ACTION_REGISTRY_VERSION"),
  "provider.actionId": exactField("HOST_CONTROLLED", "string", "current action identity", "RUNNER_DERIVED_ACTION_ID"),
  "provider.episodeId": exactField("HOST_CONTROLLED", "string", "current episode identity", "SEALED_EPISODE_MANIFEST"),
  "provider.executiveState": exactField("HOST_CONTROLLED", "string", "current lifecycle state", "LIFECYCLE_CONTROLLER"),
  "provider.observedStateHash": exactField("HOST_CONTROLLED", "string", "current lifecycle observation hash", "LIFECYCLE_CONTROLLER_RECEIPTS"),
  "provider.confidence": providerNumber("bounded confidence", "number", 0, 1),
  "provider.decision.actionType": exactField("PROVIDER_CONTROLLED", "state-conditioned-enum", "one currently legal registered action", "ACTION_REGISTRY_STATE_ACTION_PAIRS"),
  "provider.decision.authorityClass": exactField("PROVIDER_CONTROLLED", "action-conditioned-enum", "one registered authority class", "ACTION_REGISTRY_AUTHORITY_CLASSES"),
  "provider.decision.details": exactField("PROVIDER_CONTROLLED", "closed-object", "state-conditioned registered action details", "ACTION_REGISTRY_DETAILS_SCHEMA"),
  "provider.factualFindings": providerArray("bounded factual findings retained for later decisions", 2),
  "provider.factualFindings[]": providerString("one concise factual finding", 40),
  "provider.uncertainties": providerArray("one bounded unresolved uncertainty retained for each later decision", 1),
  "provider.uncertainties[]": providerString("one concise uncertainty", 40),
  "provider.boundedRationaleSummary": Object.freeze({ ...providerString("bounded explanatory rationale; validated and hashed but not repeated in trace because no executor or successor rule consumes it", 192), traceConsumer: false }),
  "provider.prohibitedOperations": Object.freeze({ ...providerArray("explicit safety acknowledgements; validated and hashed but not repeated because the immutable prompt supplies the controlling prohibition set every turn", 12), traceConsumer: false }),
  "provider.prohibitedOperations[]": Object.freeze({ ...providerString("one prohibited-operation acknowledgement", 64), traceConsumer: false }),
  "provider.decision.evidenceReferences": Object.freeze({ ...providerArray("references to exact current visible-artifact identities", 4), itemIdentitySource: "CURRENT_VISIBLE_ARTIFACT_ENUM" }),
  "provider.decision.evidenceReferences[]": providerString("one visible-artifact identity", 160),
  "provider.decision.memoryReferences": Object.freeze({ ...providerArray("references to the current admitted memory-result identities", 3), itemIdentitySource: "CURRENT_ADMITTED_MEMORY_ENUM" }),
  "provider.decision.memoryReferences[]": providerString("one admitted memory identity", 160),

  "details.DECLARE_INSUFFICIENT_EVIDENCE.requiredFacts": providerArray("facts required before reconstruction or classification", 4),
  "details.DECLARE_INSUFFICIENT_EVIDENCE.requiredFacts[]": providerString("one required fact", 96),
  "details.DECLARE_INSUFFICIENT_EVIDENCE.unavailableFacts": providerArray("facts proven unavailable", 4),
  "details.DECLARE_INSUFFICIENT_EVIDENCE.unavailableFacts[]": providerString("one unavailable fact", 96),
  "details.DECLARE_INSUFFICIENT_EVIDENCE.whyReconstructionOrClassificationCannotProceedWithoutFabrication": providerString("stage-scoped insufficiency justification", 256),
  "details.RETRIEVE_RELEVANT_MEMORY.queryText": providerString("purpose-neutral memory retrieval query", 128),
  "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.cohort": providerArray("cohort retrieval facets", 2),
  "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.cohort[]": providerString("one cohort facet", 48),
  "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.pattern": providerArray("pattern retrieval facets", 2),
  "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.pattern[]": providerString("one pattern facet", 48),
  "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.failureClass": providerArray("failure-class retrieval facets", 2),
  "details.RETRIEVE_RELEVANT_MEMORY.queryFacets.failureClass[]": providerString("one failure-class facet", 48),
  "details.CLASSIFY_FAILURE.failureClass": providerString("evidence-grounded failure class", 96),
  "details.DECLARE_RECURRENCE.failureClass": providerString("recurrent failure class", 96),
  "details.DECLARE_RECURRENCE.memoryMatchClass": providerString("memory match classification", 96),
  "details.DECLARE_NOVEL_FAILURE.failureClass": providerString("novel failure class", 96),

  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.exactFailureClass": providerString("exact generalized failure class", 96),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.affectedComponents": providerArray("bounded affected component set", 2),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.affectedComponents[]": providerString("one affected component", 48),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.proposedChangeSurface": providerArray("bounded proposed change surface", 2),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.proposedChangeSurface[]": providerString("one proposed change surface", 48),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.explicitlyExcludedComponents": providerArray("explicitly excluded component set", 4),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.explicitlyExcludedComponents[]": providerString("one excluded component", 48),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.generalizedInvariant": providerString("purpose-neutral invariant the repair must preserve", 96),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.minimumRequiredRegressionSet": providerArray("minimum regression classes", 4),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.minimumRequiredRegressionSet[]": providerString("one regression class", 48),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.exactPathOrStateProofRequirement": providerString("exact route or state proof requirement", 96),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.rollbackRequirement": providerString("rollback requirement", 96),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.stopCondition": providerString("fail-closed stop condition", 96),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.costAndToolEstimate.toolSteps": providerNumber("bounded tool-step estimate within the sealed per-case ceiling", "integer", 0, 20),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.costAndToolEstimate.costUsd": providerNumber("bounded cost estimate within the sealed per-case ceiling", "number", 0, 1.25),
  "details.PROPOSE_BOUNDED_ENGINEERING_TASK.requestedAuthority": providerString("bounded authority request", 96),
  "details.SPECIFY_REGRESSION_PROOF.helperUnitProof": providerString("helper-level deterministic proof", 96),
  "details.SPECIFY_REGRESSION_PROOF.exactProductionPathProof": providerString("exact production-route proof", 96),
  "details.SPECIFY_REGRESSION_PROOF.historicalStateProof": providerString("historical state proof", 96),
  "details.SPECIFY_REGRESSION_PROOF.negativeProof": providerString("negative regression proof", 96),
  "details.SPECIFY_REGRESSION_PROOF.restartOrRecoveryProof": providerString("restart or recovery proof", 96),
  "details.SPECIFY_REGRESSION_PROOF.forbiddenActivityProof": providerString("forbidden-activity proof", 96),

  "details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims": providerArray("claim-by-claim returned-evidence evaluation", 3),
  "details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims[].claimId": providerString("one evaluated claim identity", 64),
  "details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims[].evidenceReferences": providerArray("evidence supporting one evaluated claim", 3),
  "details.EVALUATE_RETURNED_ENGINEERING_EVIDENCE.requiredClaims[].evidenceReferences[]": providerString("one returned-evidence reference", 64),

  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.memoryId": providerString("candidate memory identity", 64),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.sourceEpisodeIds": providerArray("source episode identities", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.sourceEpisodeIds[]": providerString("one source episode identity", 64),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.evidenceReferences": providerArray("lesson evidence identities", 4),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.evidenceReferences[]": providerString("one lesson evidence identity", 64),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.evidenceAggregateHash": providerString("bounded lesson evidence aggregate as defined by the frozen action meaning", 64),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.observedFailurePattern": providerString("observed transferable failure pattern", 96),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.generalizedRule": providerString("generalized lesson rule", 96),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.triggeringConditions": providerArray("lesson triggering conditions", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.triggeringConditions[]": providerString("one triggering condition", 48),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.applicabilityBoundaries": providerArray("lesson applicability boundaries", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.applicabilityBoundaries[]": providerString("one applicability boundary", 48),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.explicitNonApplicabilityConditions": providerArray("explicit non-applicability conditions", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.explicitNonApplicabilityConditions[]": providerString("one non-applicability condition", 48),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.recurrenceSignature": providerString("transfer recurrence signature", 96),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.recommendedActionPattern": providerString("recommended generalized action pattern", 96),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.prohibitedActions": providerArray("actions prohibited by the lesson", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.prohibitedActions[]": providerString("one prohibited lesson action", 48),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.requiredProofBeforeAdvancement": providerArray("proof required before advancing", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.requiredProofBeforeAdvancement[]": providerString("one required proof", 48),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.authorityNormallyRequired": providerString("authority normally required", 96),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.confidence": providerNumber("bounded lesson-candidate confidence", "number", 0, 1),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.unresolvedUncertainty": providerArray("unresolved transferable uncertainties", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.unresolvedUncertainty[]": providerString("one unresolved lesson uncertainty", 48),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.predecessorMemoryIds": providerArray("predecessor memory identities", 2),
  "details.WRITE_GENERALIZED_LESSON_CANDIDATE.memoryRecord.predecessorMemoryIds[]": providerString("one predecessor memory identity", 64),
  "details.STOP_SAFELY.stopReason": providerString("evidence-grounded terminal reason", 192),

  "trace.priorActionTrace": Object.freeze({ origin: "HOST_CONTROLLED", type: "array", maxItems: LIFECYCLE_REASONING_STEP_CEILING, purpose: "complete bounded semantic trace", traceConsumer: true, envelopeConsumer: true }),
  "trace[].actionType": exactField("HOST_CONTROLLED", "string", "admitted registered action type", "BROKER_ACCEPTED_ACTION"),
  "trace[].executiveState": exactField("HOST_CONTROLLED", "string", "state in which action was admitted", "BROKER_ACCEPTED_ACTION"),
  "trace[].requestedSuccessorState": exactField("HOST_CONTROLLED", "string", "broker-derived successor", "ACTION_REGISTRY_TRANSITION"),
  "trace[].evidenceReferences": exactField("HOST_CONTROLLED", "bounded-array-copy", "admitted visible evidence references", "BROKER_ACCEPTED_ACTION"),
  "trace[].memoryReferences": exactField("HOST_CONTROLLED", "bounded-array-copy", "admitted memory references", "BROKER_ACCEPTED_ACTION"),
  "trace[].factualFindings": exactField("HOST_CONTROLLED", "bounded-array-copy", "admitted factual findings", "BROKER_ACCEPTED_ACTION"),
  "trace[].uncertainties": exactField("HOST_CONTROLLED", "bounded-array-copy", "admitted uncertainty", "BROKER_ACCEPTED_ACTION"),
  "trace[].confidence": exactField("HOST_CONTROLLED", "bounded-number-copy", "admitted confidence", "BROKER_ACCEPTED_ACTION"),
  "trace[].authorityClass": exactField("HOST_CONTROLLED", "enum-copy", "admitted authority class", "BROKER_ACCEPTED_ACTION"),
  "trace[].details": exactField("HOST_CONTROLLED", "closed-object-copy", "complete admitted decision details", "BROKER_ACCEPTED_ACTION"),
  "trace[].actionCoreHash": exactField("HOST_CONTROLLED", "sha256", "supplemental immutable action identity", "BROKER_ACCEPTED_ACTION_CONTENT_HASH"),
  "trace[].exactSemanticBytes": exactField("HOST_CONTROLLED", "integer", "runtime serializer byte count", "STABLE_JSON_UTF8_SERIALIZER"),
  "context.visibleArtifacts": inbound("FIXTURE_DERIVED", "exact immutable visible-artifact materialization admitted as a whole", 24_000),
  "context.retrievedMemoryRecords": inbound("MEMORY_DERIVED", "complete compact selected memory result admitted as a whole", 1_500),
  "context.returnedWorkerEvidence": inbound("WORKER_DERIVED", "complete presealed worker dossier admitted as a whole", 1_500),
  "context.episodeMetadata": exactField("FIXTURE_DERIVED", "closed-object", "sealed public episode metadata", "SEALED_EPISODE_MANIFEST"),
  "context.visibleArtifactInventory": exactField("FIXTURE_DERIVED", "array", "sealed artifact identities and hashes", "SEALED_EPISODE_MANIFEST"),
  "context.materializationBinding": exactField("HOST_CONTROLLED", "closed-object", "canonical visible materialization identity", "EPISODE_SANDBOX"),
  "context.memoryRetrievalReceipt": exactField("MEMORY_DERIVED", "nullable-closed-object", "bounded memory selection receipt fields", "MEMORY_STORE_RETRIEVAL"),
  "context.allowedCapabilities": exactField("IMMUTABLE_SCAFFOLDING", "enum-array", "frozen permitted capability names", "RUNNER_CONSTANT"),
  "context.forbiddenCapabilities": exactField("IMMUTABLE_SCAFFOLDING", "enum-array", "frozen prohibited capability names", "RUNNER_CONSTANT"),
  "context.privateReasoningRequested": exactField("IMMUTABLE_SCAFFOLDING", "boolean", "private-reasoning request prohibition", "RUNNER_CONSTANT_FALSE"),
  "context.budgetProfileHash": exactField("HOST_CONTROLLED", "sha256", "sealed qualification budget identity", "READINESS_MANIFEST"),
  "context.currentLifecycleState": exactField("HOST_CONTROLLED", "string", "current state supplied in prompt", "LIFECYCLE_CONTROLLER"),
  "context.currentObservedStateHash": exactField("HOST_CONTROLLED", "sha256", "current state receipt aggregate", "LIFECYCLE_CONTROLLER_RECEIPTS"),
  "request.model": exactField("IMMUTABLE_SCAFFOLDING", "string", "frozen exact model", "QUALIFICATION_ROUTE"),
  "request.reasoning.effort": exactField("IMMUTABLE_SCAFFOLDING", "string", "frozen reasoning level", "QUALIFICATION_ROUTE"),
  "request.store": exactField("IMMUTABLE_SCAFFOLDING", "boolean", "storage disabled", "QUALIFICATION_ROUTE"),
  "request.background": exactField("IMMUTABLE_SCAFFOLDING", "boolean", "background execution disabled", "QUALIFICATION_ROUTE"),
  "request.stream": exactField("IMMUTABLE_SCAFFOLDING", "boolean", "streaming disabled", "QUALIFICATION_ROUTE"),
  "request.tools": exactField("IMMUTABLE_SCAFFOLDING", "empty-array", "provider tools disabled", "QUALIFICATION_ROUTE"),
  "request.max_output_tokens": exactField("IMMUTABLE_SCAFFOLDING", "integer", "frozen output-token ceiling", "QUALIFICATION_ROUTE"),
  "request.input[].role": exactField("IMMUTABLE_SCAFFOLDING", "string", "single user-role input", "REQUEST_BUILDER"),
  "request.input[].content[].type": exactField("IMMUTABLE_SCAFFOLDING", "string", "single input_text content", "REQUEST_BUILDER"),
  "request.input[].content[].text": exactField("IMMUTABLE_SCAFFOLDING", "serialized-prompt", "immutable prompt prefix plus admitted bounded context", "PROMPT_BUILDER_AND_CONTEXT_CONTRACT"),
  "request.text.format.type": exactField("IMMUTABLE_SCAFFOLDING", "string", "json_schema transport", "REQUEST_BUILDER"),
  "request.text.format.name": exactField("IMMUTABLE_SCAFFOLDING", "string", "stable format identity", "REQUEST_BUILDER"),
  "request.text.format.strict": exactField("IMMUTABLE_SCAFFOLDING", "boolean", "strict structured output", "REQUEST_BUILDER"),
  "request.text.format.schema": exactField("HOST_CONTROLLED", "closed-schema", "generated state-conditioned provider schema", "CANONICAL_BOUNDED_ACTION_REGISTRY"),
  "context.fixedPromptAndEnvelope": Object.freeze({ origin: "IMMUTABLE_SCAFFOLDING", type: "exact-bytes", purpose: "prompt, state, schema and request envelope measured by the exact runtime serializer", envelopeConsumer: true })
});

export function fieldContract(path) {
  const contract = REQUEST_FIELD_CONTRACTS[path];
  assert.ok(contract, `UNREGISTERED_REQUEST_FIELD_BOUND:${path}`);
  return contract;
}

export function boundedString(path, extra = {}) {
  const contract = fieldContract(path);
  assert.equal(contract.type, "string", `${path} is not a string contract`);
  return { type: "string", maxLength: contract.maxCodePoints, ...extra };
}

export function boundedStringArray(path, itemPath, { minimum = 0, itemExtra = {} } = {}) {
  const arrayContract = fieldContract(path); const itemContract = fieldContract(itemPath);
  assert.equal(arrayContract.type, "array"); assert.equal(itemContract.type, "string");
  return { type: "array", items: boundedString(itemPath, itemExtra), maxItems: arrayContract.maxItems, ...(minimum > 0 ? { minItems: minimum } : {}) };
}

export function boundedArray(path, items, { minimum = 0 } = {}) {
  const contract = fieldContract(path);
  assert.equal(contract.type, "array");
  return { type: "array", items, maxItems: contract.maxItems, ...(minimum > 0 ? { minItems: minimum } : {}) };
}

export function boundedNumber(path) {
  const contract = fieldContract(path);
  assert.ok(["number", "integer"].includes(contract.type), `${path} is not a numeric contract`);
  return { type: contract.type, minimum: contract.minimum, maximum: contract.maximum };
}

export function unicodeCodePointLength(value) {
  assert.equal(typeof value, "string");
  return Array.from(value).length;
}

export function validateContractSchemaValue(value, schema, fieldPath = "$", reject = (code, rule, path) => {
  throw new Error(`${code}:${path}:${rule}`);
}) {
  const isObject = (candidate) => candidate && typeof candidate === "object" && !Array.isArray(candidate);
  if (!isObject(schema)) reject("ACTION_REGISTRY_SCHEMA_INVALID", "REGISTRY_SCHEMA_NODE_MUST_BE_OBJECT", fieldPath);
  if (Array.isArray(schema.anyOf)) {
    const discriminated = schema.anyOf.find((branch) => branch?.properties?.actionType?.enum?.includes?.(value?.actionType));
    if (discriminated) return validateContractSchemaValue(value, discriminated, fieldPath, reject);
    const failures = [];
    for (const branch of schema.anyOf) {
      try { validateContractSchemaValue(value, branch, fieldPath, reject); return true; }
      catch (error) { failures.push(error); }
    }
    reject("ACTION_SCHEMA_BRANCH_INVALID", "EXACTLY_ONE_STATE_CONDITIONED_BRANCH", fieldPath);
  }
  if (schema.type === "object") {
    if (!isObject(value)) reject("ACTION_DETAILS_TYPE_INVALID", "TYPE_OBJECT", fieldPath);
    const expected = Object.keys(schema.properties || {}).sort();
    const observed = Object.keys(value || {}).sort();
    if (JSON.stringify(expected) !== JSON.stringify(observed)) reject("ACTION_DETAILS_FIELDS_DIFFER", "EXACT_OBJECT_FIELDS", fieldPath);
    for (const key of expected) validateContractSchemaValue(value[key], schema.properties[key], `${fieldPath}.${key}`, reject);
    return true;
  }
  if (schema.type === "array") {
    if (!Array.isArray(value)) reject("ACTION_DETAILS_TYPE_INVALID", "TYPE_ARRAY", fieldPath);
    if (Number.isInteger(schema.minItems) && value.length < schema.minItems) reject("ACTION_DETAILS_ARRAY_TOO_SHORT", `MIN_ITEMS_${schema.minItems}`, fieldPath);
    if (Number.isInteger(schema.maxItems) && value.length > schema.maxItems) reject("ACTION_DETAILS_ARRAY_TOO_LONG", `MAX_ITEMS_${schema.maxItems}`, fieldPath);
    for (const [index, item] of value.entries()) validateContractSchemaValue(item, schema.items, `${fieldPath}[${index}]`, reject);
    return true;
  }
  const validType = schema.type === "integer" ? Number.isInteger(value)
    : schema.type === "number" ? Number.isFinite(value)
      : schema.type === "string" ? typeof value === "string"
        : schema.type === "boolean" ? typeof value === "boolean"
          : schema.type === "null" ? value === null : false;
  if (!validType) reject("ACTION_DETAILS_TYPE_INVALID", `TYPE_${String(schema.type).toUpperCase()}`, fieldPath);
  if (schema.enum && !schema.enum.includes(value)) reject("ACTION_DETAILS_ENUM_INVALID", "ENUM_MEMBERSHIP", fieldPath);
  if (typeof value === "string" && Number.isInteger(schema.maxLength) && unicodeCodePointLength(value) > schema.maxLength)
    reject("ACTION_STRING_TOO_LONG", `MAX_CODE_POINTS_${schema.maxLength}`, fieldPath);
  if (typeof value === "string" && schema.pattern && !(new RegExp(schema.pattern, "u")).test(value)) reject("ACTION_STRING_PATTERN_INVALID", "PATTERN", fieldPath);
  if (typeof value === "number" && Number.isFinite(schema.minimum) && value < schema.minimum) reject("ACTION_DETAILS_RANGE_INVALID", `MINIMUM_${schema.minimum}`, fieldPath);
  if (typeof value === "number" && Number.isFinite(schema.maximum) && value > schema.maximum) reject("ACTION_DETAILS_RANGE_INVALID", `MAXIMUM_${schema.maximum}`, fieldPath);
  return true;
}

export function conservativeJsonStringBytes(maxCodePoints) {
  assert.ok(Number.isInteger(maxCodePoints) && maxCodePoints >= 0);
  return 2 + (6 * maxCodePoints);
}

export function conservativeNestedPromptStringBytes(maxCodePoints) {
  // A control code point can become six JSON characters in stableJson and its
  // backslash is escaped again by the outer Responses request serializer.
  return 2 + (7 * maxCodePoints);
}

function lifecycleStageFor(canonicalPath) {
  if (canonicalPath.startsWith("details.")) return `ACTION_${canonicalPath.split(".")[1]}_ADMISSION`;
  if (canonicalPath.startsWith("provider.")) return "CURRENT_PROVIDER_ACTION_CORE";
  if (canonicalPath.startsWith("trace.")) return "POST_EPISODE_ADMISSION_FUTURE_TURNS";
  if (canonicalPath === "context.visibleArtifacts") return "PRE_FIRST_PROVIDER_DISPATCH";
  if (canonicalPath === "context.retrievedMemoryRecords") return "POST_MEMORY_QUERY_PRE_FUTURE_DISPATCH";
  if (canonicalPath === "context.returnedWorkerEvidence") return "POST_WORKER_RETURN_PRE_FUTURE_DISPATCH";
  if (canonicalPath.startsWith("context.")) return "QUALIFICATION_TURN_CONTEXT_CONSTRUCTION";
  return "EVERY_PROVIDER_REQUEST_CONSTRUCTION";
}

function contractConsumers(contract) {
  const validators = [];
  if (contract.providerConsumer) validators.push("STATE_CONDITIONED_PROVIDER_SCHEMA");
  if (contract.brokerConsumer) validators.push("BROKER_ACTION_CORE_VALIDATOR");
  if (contract.traceConsumer) validators.push("SEMANTIC_TRACE_VALIDATOR");
  if (contract.inboundAdmissionConsumer) validators.push("INBOUND_EVIDENCE_ADMISSION");
  if (contract.envelopeConsumer) validators.push("REQUEST_ENVELOPE_CALCULATOR");
  return validators;
}

export function finiteBoundInventory() {
  const entries = Object.entries(REQUEST_FIELD_CONTRACTS).map(([canonicalPath, contract]) => {
    const conservativeMaximumJsonBytes = contract.type === "string" && Number.isInteger(contract.maxCodePoints) ? conservativeJsonStringBytes(contract.maxCodePoints)
      : contract.type === "array" ? null
        : ["number", "integer"].includes(contract.type) && !contract.exactImmutableIdentity ? Math.max(Buffer.byteLength(JSON.stringify(contract.minimum), "utf8"), Buffer.byteLength(JSON.stringify(contract.maximum), "utf8"))
        : contract.maximumSerializedBytes ?? null;
    const representation = contract.type.includes("nullable") || canonicalPath === "context.returnedWorkerEvidence"
      ? "REQUIRED_NULLABLE" : "REQUIRED";
    const childPrefix = `${canonicalPath}[].`;
    const nestedItemBounds = Object.entries(REQUEST_FIELD_CONTRACTS)
      .filter(([path]) => path.startsWith(childPrefix))
      .map(([path, child]) => ({ canonicalPath: path, type: child.type, maxCodePoints: child.maxCodePoints ?? null, maxItems: child.maxItems ?? null }));
    const maximumContribution = conservativeMaximumJsonBytes !== null
      ? { kind: "CONSERVATIVE_JSON_BYTES", bytes: conservativeMaximumJsonBytes }
      : contract.exactImmutableIdentity
        ? { kind: "EXACT_RUNTIME_BYTES", identitySource: contract.identitySource }
        : contract.type === "array"
          ? { kind: "DERIVED_FROM_MAX_ITEMS_AND_NESTED_ITEM_CONTRACTS", maxItems: contract.maxItems }
          : { kind: "DERIVED_CLOSED_STRUCTURE_RUNTIME_BYTES" };
    return {
      canonicalPath, ...contract,
      legalSource: contract.identitySource || contract.origin,
      lifecycleStage: lifecycleStageFor(canonicalPath),
      representation,
      closedObjectShape: ["closed-object", "closed-object-copy", "nullable-closed-object", "closed-schema"].includes(contract.type),
      stringLogicalLengthBound: contract.maxCodePoints ?? null,
      arrayItemCountBound: contract.maxItems ?? null,
      nestedItemBounds,
      fixedFormatRule: contract.identitySource || (["number", "integer"].includes(contract.type) ? `FINITE_RANGE_${contract.minimum}_TO_${contract.maximum}` : null),
      consumedByLaterProviderDecisions: Boolean(contract.traceConsumer || contract.inboundAdmissionConsumer || contract.envelopeConsumer),
      conservativeMaximumJsonBytes,
      maximumContribution,
      maximumOccurrencesInTrace: contract.origin === "PROVIDER_CONTROLLED" && contract.traceConsumer ? LIFECYCLE_REASONING_STEP_CEILING : 0,
      conservativeMaximumCumulativeTraceBytes: conservativeMaximumJsonBytes !== null && contract.origin === "PROVIDER_CONTROLLED" && contract.traceConsumer
        ? conservativeMaximumJsonBytes * LIFECYCLE_REASONING_STEP_CEILING : 0,
      validatorConsumers: contractConsumers(contract),
      serializerConsumer: contract.traceConsumer ? "SEMANTIC_TRACE_PROJECTION_AND_RUNTIME_STABLE_JSON" : "RUNTIME_REQUEST_SERIALIZER_OR_NOT_APPLICABLE",
      existingDeterministicFixturesRepresentable: true
    };
  });
  return Object.freeze({
    schemaVersion: BOUNDED_REQUEST_CONTRACT_VERSION,
    requestCeilingBytes: REQUEST_ENVELOPE_CEILING_BYTES,
    fieldCount: entries.length,
    entries,
    inventoryHash: sha256Json(entries)
  });
}

export function assertNoDuplicateLogicalBounds() {
  const keys = Object.keys(REQUEST_FIELD_CONTRACTS);
  assert.equal(new Set(keys).size, keys.length);
  for (const [path, contract] of Object.entries(REQUEST_FIELD_CONTRACTS)) {
    if (contract.type === "string" && !contract.exactImmutableIdentity) assert.ok(Number.isInteger(contract.maxCodePoints) && contract.maxCodePoints > 0, `${path} lacks finite maxCodePoints`);
    if (contract.type === "array" && !contract.exactImmutableIdentity) assert.ok(Number.isInteger(contract.maxItems) && contract.maxItems >= 0, `${path} lacks finite maxItems`);
    if (["number", "integer"].includes(contract.type) && !contract.exactImmutableIdentity) assert.ok(Number.isFinite(contract.minimum) && Number.isFinite(contract.maximum) && contract.minimum <= contract.maximum, `${path} lacks a finite numeric range`);
    if (contract.type === "serialized-json") assert.ok(Number.isInteger(contract.maximumSerializedBytes) && contract.maximumSerializedBytes > 0, `${path} lacks finite serialized bound`);
  }
  return true;
}

export const BOUNDED_REQUEST_CONTRACT_HASH = sha256Json({
  schemaVersion: BOUNDED_REQUEST_CONTRACT_VERSION,
  requestCeilingBytes: REQUEST_ENVELOPE_CEILING_BYTES,
  lifecycleReasoningStepCeiling: LIFECYCLE_REASONING_STEP_CEILING,
  fields: JSON.parse(stableJson(REQUEST_FIELD_CONTRACTS))
});
