import assert from "node:assert/strict";
import test from "node:test";
import {
  BOUNDED_REQUEST_CONTRACT_HASH, REQUEST_FIELD_CONTRACTS, assertNoDuplicateLogicalBounds,
  fieldContract, finiteBoundInventory, unicodeCodePointLength, validateContractSchemaValue
} from "../qualification/synthetic-executive/scripts/bounded-request-contract.mjs";
import {
  ACTION_REGISTRY, ACTION_TYPES, EXECUTIVE_CASE_STATE, registryActionFixtures
} from "../qualification/synthetic-executive/scripts/executive-action-registry.mjs";
import {
  ExecutiveActionContractError, normalizeAndValidateProviderActionCore
} from "../qualification/synthetic-executive/scripts/action-broker.mjs";
import {
  ENVELOPE_ADMISSION_CODES, admitInboundEvidence, calculateWorstFutureRoute, createEnvelopeStopReceipt, enumerateLegalLifecyclePaths,
  maximumProviderActionForBranch, requestAffectingContractCoverage, semanticTraceProjection, traceContractEvidence
} from "../qualification/synthetic-executive/scripts/request-envelope-contract.mjs";
import {
  QUALIFICATION_STRUCTURED_OUTPUT_KEYWORD_ALLOWLIST, QUALIFICATION_STRUCTURED_OUTPUT_REJECTED_KEYWORDS,
  assertQualificationStructuredOutputsSubset, createQualificationActionTransportSchema
} from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs";
import {
  buildBoundedRequestEnvelopeRelease, validateBoundedRequestEnvelopeRelease
} from "../qualification/synthetic-executive/qualification-real-route/scripts/bounded-request-envelope-release.mjs";
import { sha256Json, stableJson } from "../qualification/synthetic-executive/scripts/protocol.mjs";

const ids = Array.from({ length: 12 }, (_, index) => `artifact-${String(index + 1).padStart(2, "0")}`);
const episode = Object.freeze({
  episodeId: "ENVELOPE-TEST", cohort: "PURPOSE_NEUTRAL",
  visibleArtifactInventory: ids.map((artifactId) => ({ artifactId, sha256: "0".repeat(64), sourceKind: "SYNTHETIC" }))
});
const materialization = Object.freeze({
  artifacts: ids.map((artifactId) => ({ artifactId, body: "purpose-neutral" })),
  artifactCount: ids.length, canonicalArtifactOrder: ids,
  individualArtifactHashes: ids.map((artifactId) => ({ artifactId, sha256: "0".repeat(64) })),
  materializedAggregateHash: "0".repeat(64)
});

function branchFor(schema, actionType) {
  if (!schema.anyOf) return schema;
  const branch = schema.anyOf.find((item) => item?.properties?.actionType?.enum?.includes(actionType));
  assert.ok(branch); return branch;
}

function sample(schema, actionType) {
  const node = branchFor(schema, actionType);
  if (node.type === "object") return Object.fromEntries(Object.entries(node.properties).map(([key, child]) => [key, sample(child, actionType)]));
  if (node.type === "array") return Array.from({ length: node.maxItems ?? node.minItems ?? 0 }, () => sample(node.items, actionType));
  if (node.enum) return node.enum[0];
  if (node.type === "string") return "x".repeat(node.maxLength || 1);
  if (node.type === "number" || node.type === "integer") return node.maximum ?? node.minimum ?? 0;
  if (node.type === "boolean") return false;
  if (node.type === "null") return null;
  throw new Error(`unsupported fixture node ${stableJson(node)}`);
}

function boundedNodes(schema, actionType, path = []) {
  const node = branchFor(schema, actionType); const rows = [];
  if (Number.isInteger(node.maxLength)) rows.push({ kind: "string", path, maximum: node.maxLength });
  if (Number.isInteger(node.maxItems)) rows.push({ kind: "array", path, maximum: node.maxItems });
  if (["number", "integer"].includes(node.type) && Number.isFinite(node.maximum)) rows.push({ kind: "number", path, maximum: node.maximum });
  if (node.type === "object") for (const [key, child] of Object.entries(node.properties)) rows.push(...boundedNodes(child, actionType, [...path, key]));
  if (node.type === "array" && (node.maxItems ?? 0) > 0) rows.push(...boundedNodes(node.items, actionType, [...path, 0]));
  return rows;
}

function replaceAt(source, path, replacement) {
  const clone = structuredClone(source); let cursor = clone;
  for (let index = 0; index < path.length - 1; index += 1) cursor = cursor[path[index]];
  cursor[path.at(-1)] = replacement;
  return clone;
}

function contextFor(core, memoryIds) {
  return {
    episode, currentState: core.executiveState, memoryIds,
    actionId: core.actionId, observedStateHash: core.observedStateHash,
    allowedAuthorityClasses: ["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"]
  };
}

function assertBothAccept(core, schema, memoryIds) {
  assert.equal(validateContractSchemaValue(core, schema), true);
  assert.ok(normalizeAndValidateProviderActionCore(core, contextFor(core, memoryIds)).contentHash);
}

function assertBothReject(core, schema, memoryIds) {
  assert.throws(() => validateContractSchemaValue(core, schema));
  assert.throws(() => normalizeAndValidateProviderActionCore(core, contextFor(core, memoryIds)), ExecutiveActionContractError);
}

test("one canonical inventory finitely covers provider, trace, inbound context, and immutable request scaffolding", () => {
  assert.equal(assertNoDuplicateLogicalBounds(), true);
  const inventory = finiteBoundInventory(); const coverage = requestAffectingContractCoverage();
  assert.equal(inventory.fieldCount, Object.keys(REQUEST_FIELD_CONTRACTS).length);
  assert.equal(inventory.inventoryHash, sha256Json(inventory.entries));
  for (const entry of inventory.entries) {
    for (const key of ["canonicalPath", "legalSource", "lifecycleStage", "origin", "type", "representation", "closedObjectShape", "stringLogicalLengthBound", "arrayItemCountBound", "nestedItemBounds", "fixedFormatRule", "consumedByLaterProviderDecisions", "maximumContribution", "validatorConsumers", "serializerConsumer"])
      assert.equal(Object.hasOwn(entry, key), true, `${entry.canonicalPath} lacks ${key}`);
  }
  assert.ok(inventory.fieldCount > 100); assert.equal(coverage.previouslyKnownUnboundedPathCount, 60);
  assert.equal(coverage.previouslyKnownUnboundedPathsClosed, true);
  assert.equal(coverage.additionallyDiscoveredUnboundedPathCount, 2);
  assert.equal(coverage.totalUnboundedPathsClosed, 62);
  assert.equal(coverage.allRequestAffectingPathsFiniteOrImmutable, true);
  assert.equal(ACTION_TYPES.length, 13); assert.equal(registryActionFixtures().length, 27);
  assert.match(BOUNDED_REQUEST_CONTRACT_HASH, /^[a-f0-9]{64}$/);
});

test("exact state-conditioned provider schemas pass the documented standard non-fine-tuned subset and limits", () => {
  assert.ok(QUALIFICATION_STRUCTURED_OUTPUT_KEYWORD_ALLOWLIST.includes("maxLength"));
  assert.ok(QUALIFICATION_STRUCTURED_OUTPUT_KEYWORD_ALLOWLIST.includes("maxItems"));
  assert.ok(QUALIFICATION_STRUCTURED_OUTPUT_REJECTED_KEYWORDS.includes("allOf"));
  let maximumProperties = 0; let maximumDepth = 0; let maximumStrings = 0; let maximumEnums = 0;
  for (const state of Object.values(EXECUTIVE_CASE_STATE).filter((value) => !["CASE_SEALED", "STOPPED"].includes(value))) {
    const schema = createQualificationActionTransportSchema({
      episodeId: episode.episodeId, executiveState: state, observedStateHash: "0".repeat(64), actionId: `schema-${state.toLowerCase()}`,
      availableEvidenceIds: ids, availableMemoryIds: ["memory-1", "memory-2", "memory-3"]
    });
    const limits = assertQualificationStructuredOutputsSubset(schema);
    maximumProperties = Math.max(maximumProperties, limits.properties); maximumDepth = Math.max(maximumDepth, limits.maximumObjectDepth);
    maximumStrings = Math.max(maximumStrings, limits.schemaStringCharacters); maximumEnums = Math.max(maximumEnums, limits.enumValues);
  }
  assert.ok(maximumProperties <= 5000); assert.ok(maximumDepth <= 10); assert.ok(maximumStrings <= 120_000); assert.ok(maximumEnums <= 1000);
  assert.throws(() => assertQualificationStructuredOutputsSubset({ type: "object", properties: {}, required: [], additionalProperties: false, allOf: [] }), /unsupported/);
  assert.throws(() => assertQualificationStructuredOutputsSubset({ type: "object", properties: {}, required: [], additionalProperties: false, $defs: {} }), /unsupported/);

  const closedObject = (properties) => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
  const tooManyProperties = Object.fromEntries(Array.from({ length: 5_001 }, (_, index) => [`p${index}`, { type: "string", maxLength: 1 }]));
  assert.throws(() => assertQualificationStructuredOutputsSubset(closedObject(tooManyProperties)), /property limit/);
  let tooDeep = { type: "string", maxLength: 1 };
  for (let index = 0; index < 11; index += 1) tooDeep = closedObject({ nested: tooDeep });
  assert.throws(() => assertQualificationStructuredOutputsSubset(tooDeep), /nesting limit/);
  assert.throws(() => assertQualificationStructuredOutputsSubset(closedObject({ ["p".repeat(120_001)]: { type: "string", maxLength: 1 } })), /string character limit/);
  assert.throws(() => assertQualificationStructuredOutputsSubset(closedObject({ value: { type: "string", enum: Array.from({ length: 1_001 }, (_, index) => `v${index}`) } })), /enum limit/);
  assert.throws(() => assertQualificationStructuredOutputsSubset(closedObject({ value: { type: "string", enum: Array.from({ length: 251 }, (_, index) => `${index}`.padEnd(60, "x")) } })), /enum string character limit/);
});

test("provider and broker share exact string, array, and numeric boundaries for all 27 registered state/action pairs", () => {
  let exactChecks = 0; let firstOverChecks = 0;
  for (const pair of registryActionFixtures()) {
    const memoryIds = ["memory-1", "memory-2", "memory-3"];
    const actionId = `boundary-${pair.actionType.toLowerCase()}`;
    const schema = createQualificationActionTransportSchema({
      episodeId: episode.episodeId, executiveState: pair.currentState, observedStateHash: "0".repeat(64), actionId,
      availableEvidenceIds: ids, availableMemoryIds: memoryIds
    });
    const core = sample(schema, pair.actionType);
    assertBothAccept(core, schema, memoryIds);
    for (const boundary of boundedNodes(schema, pair.actionType)) {
      if (boundary.path.length === 0) continue;
      const exact = boundary.kind === "string" ? "x".repeat(boundary.maximum) : boundary.maximum;
      if (boundary.kind === "string") {
        assertBothAccept(replaceAt(core, boundary.path, exact), schema, memoryIds); exactChecks += 1;
        assertBothReject(replaceAt(core, boundary.path, `${exact}x`), schema, memoryIds); firstOverChecks += 1;
      } else if (boundary.kind === "array") {
        const current = boundary.path.reduce((value, segment) => value[segment], core);
        const unit = current[0] ?? "x";
        assertBothAccept(replaceAt(core, boundary.path, Array.from({ length: boundary.maximum }, () => structuredClone(unit))), schema, memoryIds); exactChecks += 1;
        assertBothReject(replaceAt(core, boundary.path, Array.from({ length: boundary.maximum + 1 }, () => structuredClone(unit))), schema, memoryIds); firstOverChecks += 1;
      } else {
        assertBothAccept(replaceAt(core, boundary.path, exact), schema, memoryIds); exactChecks += 1;
        assertBothReject(replaceAt(core, boundary.path, boundary.maximum + 1), schema, memoryIds); firstOverChecks += 1;
      }
    }
  }
  assert.ok(exactChecks >= 150); assert.equal(firstOverChecks, exactChecks);
});

test("Unicode code-point length and exact runtime JSON serialization agree at and beyond the query boundary", () => {
  const state = "EPISODE_RECONSTRUCTED"; const memoryIds = []; const actionId = "unicode-action"; const observedStateHash = "0".repeat(64);
  const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: state, observedStateHash, actionId, availableEvidenceIds: ids, availableMemoryIds: [] });
  const base = sample(schema, "RETRIEVE_RELEVANT_MEMORY"); const maximum = fieldContract("details.RETRIEVE_RELEVANT_MEMORY.queryText").maxCodePoints;
  const cases = ["a", "é", "ह", "😀", "\ud800", "\udc00", "\u0000", "\"", "\\", "x\n"];
  for (const unit of cases) {
    const unitLength = unicodeCodePointLength(unit); const repetitions = Math.floor(maximum / unitLength);
    const suffix = "x".repeat(maximum - repetitions * unitLength);
    const exact = unit.repeat(repetitions) + suffix;
    assert.equal(unicodeCodePointLength(exact), maximum);
    const exactCore = structuredClone(base); exactCore.decision.details.queryText = exact;
    assertBothAccept(exactCore, schema, memoryIds);
    assert.ok(Buffer.byteLength(JSON.stringify(exactCore), "utf8") > 0);
    const over = structuredClone(exactCore); over.decision.details.queryText += "x";
    assertBothReject(over, schema, memoryIds);
  }
});

test("the 50k, 55k and 60k retrieval counterexamples fail both structural gates before trace admission", () => {
  const state = "EPISODE_RECONSTRUCTED"; const actionId = "counterexample-action"; const observedStateHash = "0".repeat(64);
  const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: state, observedStateHash, actionId, availableEvidenceIds: ids, availableMemoryIds: [] });
  for (const length of [50_000, 55_000, 60_000]) {
    const core = sample(schema, "RETRIEVE_RELEVANT_MEMORY"); core.decision.details.queryText = "x".repeat(length);
    assertBothReject(core, schema, []);
  }
});

test("all reachable paths compare maximum individual requests and every continuation independently fits", () => {
  const route = calculateWorstFutureRoute({ episode, materialization, currentState: "CASE_OPEN" });
  assert.equal(enumerateLegalLifecyclePaths("CASE_OPEN").length, 30);
  assert.equal(route.pathCount, 30); assert.equal(route.admitted, true); assert.ok(route.routeMax <= 64_000); assert.ok(route.minimumHeadroomBytes > 0);
  assert.equal(route.mutuallyExclusiveBranchesSummed, false);
  assert.equal(route.pathReceipts.every((pathReceipt) => pathReceipt.requests.every((request) => request.maximumIndividualRequestBytes <= 64_000)), true);
  assert.equal(route.routeMax, Math.max(...route.pathReceipts.map((item) => item.pathMax)));
  assert.ok(route.pathReceipts.reduce((sum, item) => sum + item.pathMax, 0) > route.routeMax);
  assert.deepEqual(route.controllingPath, ["RECONSTRUCT_EPISODE", "RETRIEVE_RELEVANT_MEMORY", "DECLARE_RECURRENCE", "PROPOSE_BOUNDED_ENGINEERING_TASK", "SPECIFY_REGRESSION_PROOF", "SPECIFY_REQUIRED_AUTHORITY", "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", "WRITE_GENERALIZED_LESSON_CANDIDATE", "SELECT_NEXT_LEGAL_ACTION", "STOP_SAFELY"]);
});

test("trace retains bounded semantic substance, canonical byte counts and broker successors without truncation", () => {
  const evidence = traceContractEvidence(); assert.equal(evidence.maximumTraceItems, 12); assert.equal(evidence.contentHashSupplementOnly, true);
  let maximumTraceContribution = 0;
  for (const definition of ACTION_REGISTRY) {
    const state = definition.transitions[0].currentState; const memoryIds = definition.minimumMemoryReferences ? ["memory-1", "memory-2", "memory-3"] : [];
    const action = maximumProviderActionForBranch({ episode, state, actionType: definition.actionType, actionOrdinal: 1, evidenceIds: ids, memoryIds });
    const trace = semanticTraceProjection(action); maximumTraceContribution = Math.max(maximumTraceContribution, Buffer.byteLength(stableJson(trace), "utf8"));
    assert.equal(trace.actionType, action.actionType); assert.deepEqual(trace.details, action.details);
    assert.deepEqual(trace.factualFindings, action.factualFindings); assert.deepEqual(trace.uncertainties, action.uncertainties);
    assert.deepEqual(trace.evidenceReferences, action.evidenceReferences); assert.deepEqual(trace.memoryReferences, action.memoryReferences);
    assert.equal(trace.requestedSuccessorState, action.requestedSuccessorState); assert.equal(trace.actionCoreHash, action.contentHash);
    const core = structuredClone(trace); delete core.exactSemanticBytes;
    assert.equal(trace.exactSemanticBytes, Buffer.byteLength(stableJson(core), "utf8"));
  }
  assert.ok(maximumTraceContribution > 0);
});

test("inbound visible, memory and worker evidence are all-or-nothing and contextual admission remains separate", () => {
  for (const [source, contractPath] of [["MEMORY_RESULTS", "context.retrievedMemoryRecords"], ["WORKER_EVIDENCE", "context.returnedWorkerEvidence"]]) {
    const maximum = fieldContract(contractPath).maximumSerializedBytes;
    const exact = "x".repeat(maximum - 2); const accepted = admitInboundEvidence({ source, value: exact });
    assert.equal(accepted.actualSerializedBytes, maximum); assert.equal(accepted.admitted, true); assert.equal(accepted.partialAdmission, false);
    const rejected = admitInboundEvidence({ source, value: `${exact}x` });
    assert.equal(rejected.admitted, false); assert.equal(rejected.truncated, false); assert.equal(rejected.rawRejectedContentPersisted, false);
  }
  const larger = structuredClone(materialization); larger.artifacts[0].body = "x".repeat(10_000);
  assert.equal(admitInboundEvidence({ source: "VISIBLE_ARTIFACTS", value: larger.artifacts }).admitted, true);
  const route = calculateWorstFutureRoute({ episode, materialization: larger, currentState: "CASE_OPEN" });
  assert.equal(route.admitted, false); assert.ok(route.routeMax > 64_000);
  const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), actionId: "context-action", availableEvidenceIds: ids, availableMemoryIds: [] });
  const core = sample(schema, "RECONSTRUCT_EPISODE"); assertBothAccept(core, schema, []);
  const receipt = createEnvelopeStopReceipt({ phase: "POST_ACTION", currentState: "CASE_OPEN", actualCurrentRequestBytes: 20_000, route });
  assert.equal(receipt.stopCode, ENVELOPE_ADMISSION_CODES.postAction);
  assert.equal(receipt.rawActionOrEvidencePersisted, false);
  assert.equal(receipt.terminalDisposition, "FAIL_CLOSED_PROVIDER_ATTEMPT_CONSUMED_NO_STATE_MUTATION_OR_TRACE_ADMISSION");
  assert.equal(Object.hasOwn(receipt, "rawAction"), false); assert.equal(Object.hasOwn(receipt, "rawEvidence"), false);
});

test("deterministic property generation rejects 256 oversized, cross-branch, unexpected-property and state-invalid actions at both structural gates", () => {
  let seed = 0x5eed1234;
  const random = (maximum) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % maximum; };
  const pairs = registryActionFixtures();
  for (let iteration = 0; iteration < 256; iteration += 1) {
    const pair = pairs[random(pairs.length)]; const memoryIds = ["memory-1", "memory-2", "memory-3"];
    const actionId = `property-${iteration}`;
    const schema = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: pair.currentState, observedStateHash: "0".repeat(64), actionId, availableEvidenceIds: ids, availableMemoryIds: memoryIds });
    const core = sample(schema, pair.actionType); const mutation = iteration % 4;
    if (mutation === 0) {
      const candidates = boundedNodes(schema, pair.actionType).filter((item) => item.path.length > 0);
      const boundary = candidates[random(candidates.length)];
      const current = boundary.path.reduce((value, segment) => value[segment], core);
      const replacement = boundary.kind === "string" ? "x".repeat(boundary.maximum + 1)
        : boundary.kind === "array" ? [...current, structuredClone(current[0] ?? "x")]
          : boundary.maximum + 1;
      assertBothReject(replaceAt(core, boundary.path, replacement), schema, memoryIds);
    } else if (mutation === 1) {
      const altered = structuredClone(core); altered.unexpected = true; assertBothReject(altered, schema, memoryIds);
    } else if (mutation === 2) {
      const legal = new Set(schema.properties.decision.anyOf.map((branch) => branch.properties.actionType.enum[0]));
      const illegalAction = ACTION_TYPES.find((actionType) => !legal.has(actionType)); assert.ok(illegalAction);
      const altered = structuredClone(core); altered.decision.actionType = illegalAction; assertBothReject(altered, schema, memoryIds);
    } else {
      const altered = structuredClone(core); altered.decision.details = { crossBranch: true }; assertBothReject(altered, schema, memoryIds);
    }
  }
});

test("deterministic generated artifacts and sealed Version 1.12.29 release rebuild exactly with zero activity", async () => {
  const built = await buildBoundedRequestEnvelopeRelease(); validateBoundedRequestEnvelopeRelease(built.release);
  assert.equal(built.release.version, "1.12.29"); assert.equal(built.release.contractBindings.registeredActionCount, 13);
  assert.equal(built.release.contractBindings.registeredStateActionPairCount, 27);
  assert.equal(built.release.activityAssertions.providerRequestCount, 0); assert.equal(built.release.activityAssertions.qualificationCasesExecuted, 0);
  assert.equal(built.release.claims.qualification, false); assert.equal(built.release.claims.cognition, false);
  assert.equal(built.release.contractBindings.boundedRequestRegistryHash, BOUNDED_REQUEST_CONTRACT_HASH);
});
