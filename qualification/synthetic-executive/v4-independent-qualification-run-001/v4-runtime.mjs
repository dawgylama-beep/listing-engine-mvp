import assert from "node:assert/strict";
import { open, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  COGNITIVE_BOUNDARY,
  createCognitiveGovernor,
  decideCognitiveAction
} from "../../../lib/cognitive-governor/index.js";
import { MENTOR_GUIDED_REASONING_CYCLE } from "../../../lib/cognitive-governor/mentor-guided-reasoning.js";
import {
  QUALIFICATION_ROUTE,
  QualificationResponsesClient,
  loadQualificationProviderProfile,
  qualificationActualCostUsd,
  qualificationReservationUsd
} from "../qualification-real-route/scripts/qualification-route.mjs";
import {
  readJson,
  seal,
  sha256Bytes,
  sha256Json,
  stableJson,
  writeExclusiveJson
} from "../scripts/protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const runRoot = scriptDirectory;
export const repositoryRoot = path.resolve(runRoot, "..", "..", "..");
export const corpusRoot = path.resolve(runRoot, "..", "v4-independent-qualification-corpus");
export const publicPackagePath = path.join(corpusRoot, "public-package", "public-package.json");
export const evaluatorPackageRoot = path.join(corpusRoot, "evaluator-package");

export const RUN_ID = "KATHERINE_SYNTHETIC_EXECUTIVE_V4_INDEPENDENT_MENTOR_GUIDED_QUALIFICATION_001";
export const AUTHORITY_ID = "KATHERINE_SYNTHETIC_EXECUTIVE_V4_INDEPENDENT_MENTOR_GUIDED_QUALIFICATION_AUTHORITY_001";
export const CASE_IDS = Object.freeze(Array.from({ length: 14 }, (_, index) => `V4-C${String(index + 1).padStart(2, "0")}`));
export const RESPONSE_FIELDS = Object.freeze([
  "caseId",
  "actualMission",
  "finishLine",
  "classificationAction",
  "failureClass",
  "memoryMatchClass",
  "dossierEvaluation",
  "nextAction",
  "evidenceReferences",
  "factualFindings",
  "inferences",
  "conclusion",
  "earliestSharedCausalBoundary",
  "completeDefectClass",
  "safeIndependentContinuation",
  "retainedEvidenceSufficient",
  "repeatedLoopDetected",
  "smallestAdvancingAction",
  "authorityClass",
  "authorizationBasis",
  "prohibitedOperations",
  "uncertainties",
  "boundedRationaleSummary"
]);

export const LIMITS = Object.freeze({
  slots: 14,
  maximumAttemptsPerSlot: 3,
  maximumKatherineProviderAttempts: 42,
  maximumOutputTokensPerCase: 2000,
  maximumSerializedRequestBytes: 64000,
  perCaseWallClockMs: 10 * 60 * 1000,
  totalWallClockMs: 120 * 60 * 1000,
  maximumPerCaseCostUsd: 1.25,
  maximumTotalCostUsd: 12
});

export const CHECKPOINT = Object.freeze({
  version: "1.12.36",
  commit: "35475966305ba43bc85b84b0e5cc8929b98ca274",
  tree: "ead302fef7c2c4fd657405bfeb902b322db03db3",
  parent: "c28a2ac988977f32645aabaaebb213ed9e5b8c1f",
  productReleaseCommit: "c28a2ac988977f32645aabaaebb213ed9e5b8c1f"
});

export const FROZEN_IDENTITIES = Object.freeze({
  memberCount: 18,
  totalBytes: 2493195,
  pathSetSha256: "b5ea036793272c6f5ad13a4c690b4821158cad9e88d623482ba8211add2aba83",
  aggregateSha256: "c4861c8a53fc8c4df4c4037b1120d4b9b2e6d19084aaa6afb6ed5ae9d733e3aa",
  freezeInventorySha256: "a655c004b469b1af2c9f01a6bc363ee2c191f5bdb6b70f23c0330fa30a58e228",
  freezeRecordSha256: "c60678ca79205f88081a19c75d7cdd4a656f1b4d39163d63802478665221bd95",
  publicPackageSha256: "92ff4a2955d125287cc50729548267fcdb8ee2605900023149e05165f7a90b3f",
  evaluatorPackageAggregateSha256: "3d47d9af83d96eaba01ef869e094035327c920d7bb819a8836959cb3844c150a",
  scoringPolicySha256: "95be9aa6f459d42d6cef7248eb03a650b1c61980c3d8ad611306575bdd42176c",
  semanticRubricSha256: "cc877e67003bb437f6008f89886f995389f3f1d760cf63d8f23492544822f61a",
  corpusSealSha256: "7fab1c1154f94527788f27578c3eb9d32a9ca3754a38680dc68d122f6d95c9f7",
  focusedAuditSealSha256: "3aff29bb807f53375ce88b287c811c8c5dfb6c9127d7d89c5fcf64a1a4b9e01d"
});

export const PRESERVED_IDENTITIES = Object.freeze({
  productRouteSha256: "bca3ecd47169b478083d8551a5761015f0763e22d4b2c7afd8c09e1087778397",
  governorPolicySha256: "02650456f3adf7e465b40b91e335c4618a894975b3c928bc8ed585c43439472e",
  mentorSha256: "c63541acd52e1c6e05200c663699db8cf3218d5c9446ebf537e841fabeda890e",
  lifecycleControllerSha256: "a41d1af9a9bcbce65d11b59d903a084de66888e2ef7bd7f7ebfa3194fe3b585a",
  agentRegistrySha256: "847a2e6f00b9f419f47e95358716c5475a446e7e23dac7a12f584ea451fcf047",
  agentArchitectureSha256: "1d6ea2eae96a926003a1daf4445334abac3fe92bf2bfc1ab04ef939c95bb1135",
  authorityValidatorSha256: "0e504861558a29ca4540023eeec58e4bf13cb53ebb76ad00dcca3b527aed1951",
  slotLedgerSha256: "43ce6d1079bae5747346ddf0f380ac1c83f5a8c68c54d5f4b51544afa1e14cc6",
  costTokenGovernorSha256: "dc2ca37dbaf93be5ccfdde55d475c59c5646e1ab1d9a3153f5c153c543bd77e9",
  genericResultSealerSha256: "17b64e1f9a0ec51306404f8d8c53aafe59810819264b0c6569a7619c2914f2d9",
  safeProviderTransportSha256: "b43a63c5a3efbfd9546de0d74242a371d4795d07e5c4c49e33c969a841952ff2"
});

export const RETRYABLE_PROVIDER_FAILURES = Object.freeze([
  "PROVIDER_TIMEOUT",
  "PROVIDER_CONNECTION_FAILURE"
]);

const closedObject = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false
});
const boundedString = (maxLength = 2000) => ({ type: "string", minLength: 1, maxLength });
const boundedStringArray = (maxItems = 24, maxLength = 1000, minItems = 0) => ({
  type: "array",
  items: boundedString(maxLength),
  minItems,
  maxItems
});

export function createV4ResponseSchema() {
  const schema = closedObject({
    caseId: boundedString(80),
    actualMission: boundedString(2000),
    finishLine: boundedString(2000),
    classificationAction: { type: "string", enum: ["CLASSIFY_FAILURE", "DECLARE_RECURRENCE", "DECLARE_NOVEL_FAILURE"] },
    failureClass: boundedString(180),
    memoryMatchClass: { anyOf: [boundedString(180), { type: "null" }] },
    dossierEvaluation: { type: "string", enum: ["VALID_PASS", "BOUNDED_FAIL", "ARCHITECTURAL_FAIL", "INSUFFICIENT_EVIDENCE"] },
    nextAction: { type: "string", enum: ["ADVANCE_WITHIN_EXISTING_AUTHORITY", "REQUEST_BOUNDED_ENGINEERING_AUTHORITY", "REQUEST_EXCEPTIONAL_HUMAN_AUTHORITY", "STOP_INSUFFICIENT_EVIDENCE", "STOP_NOVEL_FAILURE"] },
    evidenceReferences: boundedStringArray(32, 120, 1),
    factualFindings: boundedStringArray(24, 1200, 1),
    inferences: boundedStringArray(16, 1200, 1),
    conclusion: boundedString(2400),
    earliestSharedCausalBoundary: boundedString(2000),
    completeDefectClass: boundedString(2000),
    safeIndependentContinuation: boundedString(2000),
    retainedEvidenceSufficient: { type: "boolean" },
    repeatedLoopDetected: { type: "boolean" },
    smallestAdvancingAction: boundedString(2000),
    authorityClass: { type: "string", enum: ["NO_NEW_AUTHORITY", "BOUNDED_ENGINEERING", "EXCEPTIONAL_HUMAN"] },
    authorizationBasis: boundedString(3000),
    prohibitedOperations: boundedStringArray(24, 1000, 1),
    uncertainties: boundedStringArray(24, 1000, 0),
    boundedRationaleSummary: boundedString(4000)
  });
  assert.deepEqual(Object.keys(schema.properties), RESPONSE_FIELDS);
  assert.deepEqual(schema.required, RESPONSE_FIELDS);
  return Object.freeze(schema);
}

function normalizeText(value) {
  return String(value).normalize("NFKC").trim();
}

function validateStringArray(value, field, { minimum = 0 } = {}) {
  assert.ok(Array.isArray(value), `V4_RESPONSE_${field.toUpperCase()}_ARRAY_REQUIRED`);
  assert.ok(value.length >= minimum, `V4_RESPONSE_${field.toUpperCase()}_MINIMUM`);
  for (const item of value) assert.ok(typeof item === "string" && normalizeText(item).length > 0, `V4_RESPONSE_${field.toUpperCase()}_STRING_ITEMS_REQUIRED`);
}

export function validateAndNormalizeV4Response(value, { caseId } = {}) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), "V4_RESPONSE_OBJECT_REQUIRED");
  assert.deepEqual(Object.keys(value).sort(), [...RESPONSE_FIELDS].sort(), "V4_RESPONSE_FIELDS_DIFFER");
  for (const field of [
    "caseId", "actualMission", "finishLine", "classificationAction", "failureClass", "dossierEvaluation", "nextAction",
    "conclusion", "earliestSharedCausalBoundary", "completeDefectClass", "safeIndependentContinuation", "smallestAdvancingAction",
    "authorityClass", "authorizationBasis", "boundedRationaleSummary"
  ]) assert.ok(typeof value[field] === "string" && normalizeText(value[field]).length > 0, `V4_RESPONSE_${field.toUpperCase()}_STRING_REQUIRED`);
  assert.ok(value.memoryMatchClass === null || (typeof value.memoryMatchClass === "string" && normalizeText(value.memoryMatchClass).length > 0), "V4_RESPONSE_MEMORY_MATCH_INVALID");
  assert.equal(typeof value.retainedEvidenceSufficient, "boolean", "V4_RESPONSE_RETAINED_EVIDENCE_BOOLEAN_REQUIRED");
  assert.equal(typeof value.repeatedLoopDetected, "boolean", "V4_RESPONSE_REPEATED_LOOP_BOOLEAN_REQUIRED");
  validateStringArray(value.evidenceReferences, "evidenceReferences", { minimum: 1 });
  validateStringArray(value.factualFindings, "factualFindings", { minimum: 1 });
  validateStringArray(value.inferences, "inferences", { minimum: 1 });
  validateStringArray(value.prohibitedOperations, "prohibitedOperations", { minimum: 1 });
  validateStringArray(value.uncertainties, "uncertainties");
  if (caseId) assert.equal(value.caseId, caseId, "V4_RESPONSE_CASE_ID_MISMATCH");
  const normalized = {};
  for (const field of RESPONSE_FIELDS) normalized[field] = structuredClone(value[field]);
  return Object.freeze(normalized);
}

export function mentorInvocationInput({ bindingId, publicCaseHash }) {
  assert.match(bindingId, /^[A-Za-z0-9._:-]+$/);
  assert.match(publicCaseHash, /^[a-f0-9]{64}$/);
  const evaluationId = `mentor-v4-${bindingId}-${publicCaseHash.slice(0, 20)}`;
  return Object.freeze({
    governor: Object.freeze({ evaluationId, customerMission: Object.freeze({ purpose: "PERSONAL_BUY" }) }),
    snapshot: Object.freeze({
      evaluationId,
      objectMindState: Object.freeze({
        objectStateId: `v4-binding-${bindingId}`,
        requestIdentity: Object.freeze({ inputDescriptionProvenance: Object.freeze({ sha256: publicCaseHash }) })
      }),
      providerBudget: Object.freeze({ maximum: 0, consumed: 0 }),
      directPageBudget: Object.freeze({ maximum: 0, consumed: 0 }),
      canonicalEvidenceFinalized: false,
      purposeJudgmentCompleted: false,
      reportGenerated: false
    }),
    options: Object.freeze({ boundary: COGNITIVE_BOUNDARY.TERMINAL })
  });
}

export function mentorDecisionProjection(decision) {
  return Object.freeze({
    actionType: decision.actionType,
    actionSignature: decision.actionSignature,
    targetIdentity: decision.targetIdentity,
    reasonCodes: [...decision.reasonCodes],
    expectedInformationTarget: decision.expectedInformationTarget,
    executionPermitted: decision.executionPermitted,
    knowledgeStateHash: decision.inputState.knowledgeStateHash,
    evidenceStateHash: decision.inputState.evidenceStateSummary.evidenceStateHash,
    cognitiveStateHash: decision.inputState.cognitiveStateHash
  });
}

export function serializeMentorGuidance({ invocationInput, decision }) {
  const guidance = Object.freeze({
    schemaVersion: "1.0",
    guidanceType: "V4_QUALIFICATION_MENTOR_GUIDANCE",
    invocationSemantics: "CREATE_COGNITIVE_GOVERNOR_THEN_DECIDE_COGNITIVE_ACTION",
    mentorCycle: [...MENTOR_GUIDED_REASONING_CYCLE],
    inputBinding: Object.freeze({
      evaluationId: invocationInput.governor.evaluationId,
      customerMission: structuredClone(invocationInput.governor.customerMission),
      publicCaseHash: invocationInput.snapshot.objectMindState.requestIdentity.inputDescriptionProvenance.sha256,
      boundary: invocationInput.options.boundary
    }),
    policyDecision: mentorDecisionProjection(decision),
    mentorAssertionExecutedInsidePolicy: true,
    mentorLogicCopiedOrReimplemented: false
  });
  return Object.freeze({ guidance, serializedGuidance: stableJson(guidance), guidanceHash: sha256Json(guidance) });
}

export function createMentorBinding({ bindingId, publicCaseHash }) {
  const invocationInput = mentorInvocationInput({ bindingId, publicCaseHash });
  const governor = createCognitiveGovernor(invocationInput.governor);
  const decision = decideCognitiveAction(governor, invocationInput.snapshot, invocationInput.options);
  const serialized = serializeMentorGuidance({ invocationInput, decision });
  return Object.freeze({ invocationInput, decision: mentorDecisionProjection(decision), ...serialized });
}

export function buildV4Prompt({ publicCase, decisionStandard, responseContract, mentorBinding, syntheticPreflight = false }) {
  const publicPayload = Object.freeze({
    schemaVersion: "1.0",
    payloadType: syntheticPreflight ? "V4_SCHEMA_PREFLIGHT_PUBLIC_PAYLOAD" : "V4_SINGLE_PUBLIC_QUALIFICATION_CASE",
    decisionStandard,
    responseContract,
    case: publicCase
  });
  const prompt = [
    "You are Katherine's Eye operating in an isolated qualification-only reasoning station.",
    "Use the supplied mentor-guided cycle as a disciplined sequence: mission, evidence, causal diagnosis, generalized lesson, complete solution path, bounded action, verification.",
    "Use only the single public case and public decision standard below. Do not use outside knowledge, tools, searches, provider calls, hidden material, other cases, or private-chain-of-thought disclosure.",
    "Return exactly one JSON object with all 23 response fields. Use the published categorical tokens and keep narrative fields concise, evidence-bounded, and mutually consistent.",
    `MENTOR_GUIDANCE ${mentorBinding.serializedGuidance}`,
    `PUBLIC_PAYLOAD ${stableJson(publicPayload)}`
  ].join("\n");
  return Object.freeze({ prompt, publicPayload, promptByteCount: Buffer.byteLength(prompt, "utf8"), promptHash: sha256Bytes(Buffer.from(prompt, "utf8")) });
}

export function buildV4Request({ publicCase, decisionStandard, responseContract, maximumOutputTokens = LIMITS.maximumOutputTokensPerCase, syntheticPreflight = false }) {
  assert.ok(maximumOutputTokens > 0 && maximumOutputTokens <= LIMITS.maximumOutputTokensPerCase);
  const publicCaseHash = sha256Json(publicCase);
  const caseId = publicCase.caseId || publicCase.syntheticCaseId;
  const mentorBinding = createMentorBinding({ bindingId: caseId, publicCaseHash });
  const prompt = buildV4Prompt({ publicCase, decisionStandard, responseContract, mentorBinding, syntheticPreflight });
  const schema = createV4ResponseSchema();
  const request = Object.freeze({
    model: "gpt-5.6-sol",
    reasoning: Object.freeze({ effort: "medium" }),
    store: false,
    background: false,
    stream: false,
    tools: Object.freeze([]),
    max_output_tokens: maximumOutputTokens,
    input: Object.freeze([{ role: "user", content: Object.freeze([{ type: "input_text", text: prompt.prompt }]) }]),
    text: Object.freeze({ format: Object.freeze({ type: "json_schema", name: "katherine_v4_qualification_response_v1", strict: true, schema }) })
  });
  const serializedRequest = JSON.stringify(request);
  const requestByteCount = Buffer.byteLength(serializedRequest, "utf8");
  assert.ok(requestByteCount <= LIMITS.maximumSerializedRequestBytes, "V4_REQUEST_BYTE_CEILING_EXCEEDED");
  return Object.freeze({
    caseId,
    publicCaseHash,
    mentorBinding,
    prompt,
    schema,
    request,
    serializedRequest,
    requestByteCount,
    requestHash: sha256Bytes(Buffer.from(serializedRequest, "utf8"))
  });
}

export function inspectV4Schema(schema = createV4ResponseSchema()) {
  const allowed = new Set(["type", "properties", "required", "additionalProperties", "items", "anyOf", "enum", "minLength", "maxLength", "minItems", "maxItems"]);
  const prohibited = new Set(["const", "$ref", "$defs", "uniqueItems", "allOf", "not", "if", "then", "else", "contains", "format", "patternProperties", "unevaluatedProperties"]);
  let propertyCount = 0;
  let maximumDepth = 0;
  let enumValueCount = 0;
  let standaloneUntypedNullSchemas = 0;
  const errors = [];
  function walk(node, label, depth) {
    if (!node || typeof node !== "object" || Array.isArray(node)) { errors.push(`${label}:SCHEMA_OBJECT_REQUIRED`); return; }
    maximumDepth = Math.max(maximumDepth, depth);
    for (const key of Object.keys(node)) {
      if (!allowed.has(key)) errors.push(`${label}:UNSUPPORTED_KEYWORD:${key}`);
      if (prohibited.has(key)) errors.push(`${label}:PROHIBITED_KEYWORD:${key}`);
    }
    if (node.anyOf) {
      if (!Array.isArray(node.anyOf) || node.anyOf.length === 0) errors.push(`${label}:ANYOF_INVALID`);
      else node.anyOf.forEach((branch, index) => walk(branch, `${label}.anyOf[${index}]`, depth));
      return;
    }
    if (!node.type) { errors.push(`${label}:TYPE_REQUIRED`); return; }
    if (node.type === "null" && Object.keys(node).length !== 1) errors.push(`${label}:NULL_KEYWORD_CONFLICT`);
    if (node.type === "null" && label === "$") standaloneUntypedNullSchemas += 1;
    if (node.enum) {
      enumValueCount += node.enum.length;
      for (const value of node.enum) if (typeof value !== node.type) errors.push(`${label}:ENUM_TYPE_CONFLICT`);
    }
    if (node.type === "object") {
      if (node.additionalProperties !== false) errors.push(`${label}:OBJECT_NOT_CLOSED`);
      const names = Object.keys(node.properties || {});
      propertyCount += names.length;
      if (stableJson([...(node.required || [])].sort()) !== stableJson([...names].sort())) errors.push(`${label}:REQUIRED_SET_DIFFER`);
      for (const name of names) walk(node.properties[name], `${label}.${name}`, depth + 1);
    }
    if (node.type === "array") {
      if (!node.items) errors.push(`${label}:ARRAY_ITEMS_REQUIRED`);
      else walk(node.items, `${label}[]`, depth);
      if (!Number.isInteger(node.maxItems)) errors.push(`${label}:ARRAY_MAXIMUM_REQUIRED`);
    }
    if (node.type === "string" && !node.enum && !Number.isInteger(node.maxLength)) errors.push(`${label}:STRING_MAXIMUM_REQUIRED`);
  }
  walk(schema, "$", 1);
  const schemaByteCount = Buffer.byteLength(JSON.stringify(schema), "utf8");
  if (propertyCount > 5000) errors.push("PROPERTY_LIMIT_EXCEEDED");
  if (maximumDepth > 10) errors.push("DEPTH_LIMIT_EXCEEDED");
  if (enumValueCount > 1000) errors.push("ENUM_LIMIT_EXCEEDED");
  if (schemaByteCount > 120000) errors.push("SCHEMA_SIZE_LIMIT_EXCEEDED");
  return Object.freeze({ valid: errors.length === 0, errors, propertyCount, maximumDepth, enumValueCount, schemaByteCount, standaloneUntypedNullSchemas });
}

export function createCompleteCaptureFetch({ fetchImpl = globalThis.fetch, onCapture = async () => {} } = {}) {
  assert.equal(typeof fetchImpl, "function");
  assert.equal(typeof onCapture, "function");
  return async (url, options) => {
    const response = await fetchImpl(url, options);
    const source = Buffer.from(await response.clone().arrayBuffer());
    const headers = Object.freeze({
      contentType: response.headers.get("content-type") || "NOT_RECEIVED",
      requestId: response.headers.get("x-request-id") || "NOT_RECEIVED"
    });
    await onCapture(Object.freeze({
      bytes: source,
      byteCount: source.length,
      sha256: sha256Bytes(source),
      httpStatus: response.status,
      headers
    }));
    return response;
  };
}

export async function createV4ProviderClient({ credentialHandle, onCapture, fetchImpl = globalThis.fetch }) {
  const profile = await loadQualificationProviderProfile();
  assert.equal(profile.exactModelId, "gpt-5.6-sol");
  assert.equal(profile.inferenceEndpoint, "v1/responses");
  const captureFetch = createCompleteCaptureFetch({ fetchImpl, onCapture });
  return Object.freeze({
    profile,
    client: new QualificationResponsesClient({ profile, credentialHandle, fetchImpl: captureFetch })
  });
}

export function providerAccounting({ usage, serializedRequestByteCount, maximumOutputTokens, pricing }) {
  const exactCostUsd = qualificationActualCostUsd(usage, pricing);
  const reservationUsd = qualificationReservationUsd(serializedRequestByteCount, {
    inputUsdPerMillionTokens: pricing.inputUsdPerMillionTokens,
    outputIncludingReasoningUsdPerMillionTokens: pricing.outputIncludingReasoningUsdPerMillionTokens
  });
  return Object.freeze({
    usage,
    exactCostUsd,
    reservationUsd,
    conservativeAccountedCostUsd: exactCostUsd === null ? reservationUsd : exactCostUsd,
    maximumOutputTokens
  });
}

export async function writeExclusiveBytes(filePath, bytes) {
  const handle = await open(filePath, "wx");
  try { await handle.writeFile(bytes); }
  finally { await handle.close(); }
}

export async function fileSha256(filePath) {
  return sha256Bytes(await readFile(filePath));
}

export async function loadPublicPackage() {
  const packageValue = await readJson(publicPackagePath);
  assert.equal(packageValue.caseCount, 14);
  assert.deepEqual(packageValue.responseContract, RESPONSE_FIELDS);
  assert.deepEqual(packageValue.cases.map((item) => item.caseId), CASE_IDS);
  return packageValue;
}

const ZERO_HASH = "0".repeat(64);

export function nextLedgerEvent(events, eventType, payload, occurredAt) {
  assert.equal(new Date(occurredAt).toISOString(), occurredAt);
  validateLedger(events);
  const state = ledgerState(events);
  const caseId = payload.caseId || null;
  if (eventType === "AUTHORITY_ACTIVATED") assert.equal(state.phase, "ISSUED", "V4_AUTHORITY_ALREADY_ACTIVATED");
  else if (eventType === "SLOT_CONSUMED") {
    assert.equal(state.phase, "ACTIVE", "V4_AUTHORITY_NOT_ACTIVE");
    assert.equal(caseId, CASE_IDS[state.consumedCaseIds.length], "V4_SLOT_OUT_OF_ORDER_OR_REPLAY");
    assert.equal(state.consumedCaseIds.includes(caseId), false, "V4_SLOT_DUPLICATE_CONSUMPTION");
    if (state.consumedCaseIds.length > 0) assert.equal(state.terminalCaseIds.includes(CASE_IDS[state.consumedCaseIds.length - 1]), true, "V4_PRIOR_SLOT_NOT_TERMINAL");
  } else if (eventType === "SLOT_TERMINAL") {
    assert.equal(state.phase, "ACTIVE", "V4_AUTHORITY_NOT_ACTIVE");
    assert.equal(state.consumedCaseIds.includes(caseId), true, "V4_TERMINAL_SLOT_NOT_CONSUMED");
    assert.equal(state.terminalCaseIds.includes(caseId), false, "V4_TERMINAL_SLOT_REPLACEMENT");
    assert.equal(caseId, state.consumedCaseIds.at(-1), "V4_TERMINAL_SLOT_ORDER_VIOLATION");
  } else if (eventType === "AUTHORITY_CLOSED") {
    assert.equal(state.phase, "ACTIVE", "V4_AUTHORITY_NOT_ACTIVE");
    assert.deepEqual(state.consumedCaseIds, CASE_IDS, "V4_AUTHORITY_CLOSE_REQUIRES_ALL_CONSUMED");
    assert.deepEqual(state.terminalCaseIds, CASE_IDS, "V4_AUTHORITY_CLOSE_REQUIRES_ALL_TERMINAL");
  } else if (eventType === "EVALUATOR_OPENED") {
    assert.equal(state.phase, "CLOSED", "V4_EVALUATOR_LOCKED_BEFORE_AUTHORITY_CLOSURE");
    assert.equal(state.evaluatorOpenCount, 0, "V4_EVALUATOR_REOPEN_PROHIBITED");
  } else if (eventType === "EVALUATOR_CLOSED") {
    assert.equal(state.phase, "EVALUATING", "V4_EVALUATOR_NOT_OPEN");
  } else throw new Error(`V4_LEDGER_EVENT_TYPE_UNSUPPORTED:${eventType}`);
  const core = {
    schemaVersion: "1.0",
    ledgerType: "V4_QUALIFICATION_APPEND_ONLY_AUTHORITY_LEDGER",
    sequence: events.length + 1,
    eventType,
    priorEntryHash: events.at(-1)?.entryHash || ZERO_HASH,
    occurredAt,
    payload
  };
  return seal(core, "entryHash");
}

export function validateLedger(events) {
  let prior = ZERO_HASH;
  for (const [index, event] of events.entries()) {
    assert.equal(event.sequence, index + 1, "V4_LEDGER_SEQUENCE_DIFFER");
    assert.equal(event.priorEntryHash, prior, "V4_LEDGER_CHAIN_DIFFER");
    const core = structuredClone(event); delete core.entryHash;
    assert.equal(sha256Json(core), event.entryHash, "V4_LEDGER_HASH_DIFFER");
    prior = event.entryHash;
  }
  return true;
}

export function ledgerState(events) {
  const state = { phase: "ISSUED", consumedCaseIds: [], terminalCaseIds: [], evaluatorOpenCount: 0, evaluatorCloseCount: 0 };
  for (const event of events) {
    if (event.eventType === "AUTHORITY_ACTIVATED") state.phase = "ACTIVE";
    if (event.eventType === "SLOT_CONSUMED") state.consumedCaseIds.push(event.payload.caseId);
    if (event.eventType === "SLOT_TERMINAL") state.terminalCaseIds.push(event.payload.caseId);
    if (event.eventType === "AUTHORITY_CLOSED") state.phase = "CLOSED";
    if (event.eventType === "EVALUATOR_OPENED") { state.phase = "EVALUATING"; state.evaluatorOpenCount += 1; }
    if (event.eventType === "EVALUATOR_CLOSED") { state.phase = "EVALUATED"; state.evaluatorCloseCount += 1; }
  }
  return Object.freeze({ ...state, consumedCaseIds: Object.freeze(state.consumedCaseIds), terminalCaseIds: Object.freeze(state.terminalCaseIds) });
}

export async function readLedger(ledgerRoot) {
  let names = [];
  try { names = (await readdir(ledgerRoot)).filter((name) => /^\d{6}-.+\.json$/.test(name)).sort(); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  const events = [];
  for (const name of names) events.push(await readJson(path.join(ledgerRoot, name)));
  validateLedger(events);
  return events;
}

export async function appendLedgerEvent(ledgerRoot, eventType, payload, occurredAt = new Date().toISOString()) {
  const events = await readLedger(ledgerRoot);
  const event = nextLedgerEvent(events, eventType, payload, occurredAt);
  const name = `${String(event.sequence).padStart(6, "0")}-${eventType.toLowerCase().replaceAll("_", "-")}.json`;
  await writeExclusiveJson(path.join(ledgerRoot, name), event);
  return event;
}

export function createSlotRegistry(publicPackage) {
  assert.deepEqual(publicPackage.cases.map((item) => item.caseId), CASE_IDS);
  const slots = publicPackage.cases.map((item, index) => seal({
    schemaVersion: "1.0",
    slotType: "SINGLE_USE_V4_PUBLIC_QUALIFICATION_CASE",
    slotId: `${AUTHORITY_ID}-SLOT-${String(index + 1).padStart(2, "0")}`,
    sequencePosition: index + 1,
    caseId: item.caseId,
    publicCaseHash: sha256Json(item),
    maximumAttempts: LIMITS.maximumAttemptsPerSlot,
    initialStatus: "UNCONSUMED",
    replay: false,
    replacement: false
  }, "slotHash"));
  return seal({
    schemaVersion: "1.0",
    registryType: "V4_IMMUTABLE_SINGLE_USE_SLOT_REGISTRY",
    authorityId: AUTHORITY_ID,
    exactCaseOrder: CASE_IDS,
    slotCount: slots.length,
    slots
  }, "slotRegistryHash");
}

export { readJson, seal, sha256Bytes, sha256Json, stableJson, writeExclusiveJson };
