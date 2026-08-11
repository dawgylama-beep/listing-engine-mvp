import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTION_REGISTRY_VERSION, canonicalExecutiveActionSchema, registryActionFixtures
} from "../../scripts/executive-action-registry.mjs";
import { createStateConditionedProviderActionSchema } from "../../scripts/provider-action-schema.mjs";
import { sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";
import { loadRealProviderProfile } from "../../calibration/scripts/real-route-profile.mjs";
import {
  PROVIDER_RESPONSE_BODY_LIMIT_BYTES, SafeProviderFailure, classifyHttpFailure,
  normalizeProviderResponseDiagnostics, safeProviderRequestId, unavailableProviderDiagnostics
} from "../../calibration/scripts/real-route-redaction.mjs";
import { generalContinuationPromptLines } from "./general-continuation-policy.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const qualificationRouteRoot = path.resolve(scriptDirectory, "..");
export const qualificationRoot = path.resolve(qualificationRouteRoot, "..");
export const repositoryRoot = path.resolve(qualificationRoot, "..", "..");
export const continuationPolicyPath = path.join(qualificationRouteRoot, "continuation-policy.json");
export const generalContinuationPolicyPath = path.join(qualificationRouteRoot, "general-continuation-policy.json");
export const authoritySchemaPath = path.join(qualificationRouteRoot, "schemas", "blind-qualification-authority.schema.json");
export const ledgerSchemaPath = path.join(qualificationRouteRoot, "schemas", "qualification-ledger-entry.schema.json");
export const releasePath = path.join(qualificationRouteRoot, "qualification-real-route-release.json");

export const IMMUTABLE_SUBJECT = Object.freeze({
  productVersion: "1.12.27",
  commit: "061dd081e215d02b759a77e56b5b76a40d095d14",
  tree: "cc32e9b13355818652def44fda5e188deac08c2e"
});

export const SEALED_BINDINGS = Object.freeze({
  startingToolingCommit: "6935092aad041bc84e506593c8167ea5192ef61f",
  startingToolingTree: "456b2749bf4a7abcc678840998ebe0edfea8c38e",
  readinessManifestHash: "c0b85ec074dd20eb864c31a52b47d91deae9784aaef39bb28e407cdf477574d0",
  caseManifestHash: "084afb9dd9b39c97424a51b668b6a770c8bf29867a0047cc59900e447ab679e4",
  scoringControlsHash: "7dceae2a4e94bb97f7ea24b70ccd60ad4464c518d5bc6fd664ac1f850fb0de9c",
  budgetProfileHash: "95f125883586a42724a44341efc30bb81e0cd39a10dc21f6cb1528d462ee4db8",
  calibrationResultHash: "5a686deab9a10c53f1a16b64dc8d4a68217b01981e890f7adee2cf3a3c08d6da",
  executiveActionSourceSchemaHash: "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba",
  safeProviderDiagnosticsContractHash: "09069908f8b5bb7a94db97777839db7c587594f91c62b71c9aec3f4b59deaed9"
});

export const QUALIFICATION_LIMITS = Object.freeze({
  caseCount: 12,
  perCase: Object.freeze({ maximumReasoningSteps: 12, maximumToolActions: 20, maximumPresealedDossierActions: 1, maximumRetrySlots: 2, maximumCostUsd: 1.25 }),
  aggregate: Object.freeze({ maximumReasoningSteps: 120, maximumToolActions: 180, maximumPresealedDossierActions: 12, maximumRetrySlots: 12, maximumCostUsd: 12 })
});

export const QUALIFICATION_ROUTE = Object.freeze({
  model: "gpt-5.6-sol", reasoningEffort: "medium", store: false, background: false, stream: false,
  tools: Object.freeze([]), maximumOutputTokens: 2000, maximumPromptBytes: 64000, maximumSerializedRequestBytes: 64000,
  conservativeInputTokenReservationMethod: "ONE_TOKEN_PER_SERIALIZED_REQUEST_UTF8_BYTE",
  endpoint: "v1/responses", maximumMetadataRequests: 0
});

export function createQualificationActionTransportSchema({
  episodeId, executiveState, observedStateHash, actionId,
  availableEvidenceIds = ["template-visible-artifact"], availableMemoryIds = []
}) {
  const schema = createStateConditionedProviderActionSchema({ episodeId, executiveState, observedStateHash, actionId, availableEvidenceIds, availableMemoryIds });
  assertQualificationStructuredOutputsSubset(schema);
  return Object.freeze(schema);
}

export const QUALIFICATION_STRUCTURED_OUTPUT_KEYWORD_ALLOWLIST = Object.freeze([
  "type", "properties", "required", "additionalProperties", "items", "anyOf", "enum",
  "minimum", "maximum", "minLength", "maxLength", "pattern", "minItems", "maxItems"
]);
export const QUALIFICATION_STRUCTURED_OUTPUT_REJECTED_KEYWORDS = Object.freeze([
  "allOf", "not", "if", "then", "else", "dependentRequired", "dependentSchemas", "const", "patternProperties",
  "unevaluatedProperties", "contains", "minContains", "maxContains", "uniqueItems", "propertyNames",
  "$defs", "$ref", "$schema", "$id", "title", "description", "readOnly", "format"
]);

export function assertQualificationStructuredOutputsSubset(schema) {
  assert.equal(schema?.type, "object", "structured-output root must be an object");
  assert.equal(Object.hasOwn(schema, "anyOf"), false, "structured-output root anyOf is prohibited");
  let properties = 0; let depth = 0; let enums = 0; let propertyNameCharacters = 0;
  let enumStringCharacters = 0; let largestEnumStringCharacters = 0; let largeEnumPropertyCount = 0;
  const allowed = new Set(QUALIFICATION_STRUCTURED_OUTPUT_KEYWORD_ALLOWLIST);
  const walk = (node, label, objectDepth) => {
    assert.ok(node && typeof node === "object" && !Array.isArray(node), `${label} must be a schema object`);
    for (const keyword of Object.keys(node)) assert.equal(allowed.has(keyword), true, `${label}.${keyword} is unsupported`);
    for (const keyword of QUALIFICATION_STRUCTURED_OUTPUT_REJECTED_KEYWORDS) assert.equal(Object.hasOwn(node, keyword), false, `${label}.${keyword} is unsupported`);
    if (Object.hasOwn(node, "anyOf")) {
      assert.ok(Array.isArray(node.anyOf) && node.anyOf.length > 0, `${label}.anyOf must be nonempty`);
      for (const [index, branch] of node.anyOf.entries()) walk(branch, `${label}.anyOf[${index}]`, objectDepth);
      return;
    }
    assert.ok(["object", "array", "string", "number", "integer", "boolean", "null"].includes(node.type), `${label}.type must be explicit`);
    if (node.enum) {
      assert.ok(node.enum.length > 0); enums += node.enum.length;
      const currentEnumStringCharacters = node.enum.reduce((sum, value) => sum + (typeof value === "string" ? Array.from(value).length : 0), 0);
      enumStringCharacters += currentEnumStringCharacters;
      largestEnumStringCharacters = Math.max(largestEnumStringCharacters, currentEnumStringCharacters);
      if (node.enum.length > 250) {
        largeEnumPropertyCount += 1;
        assert.ok(currentEnumStringCharacters <= 15_000, `${label}.enum string character limit exceeded`);
      }
    }
    if (node.type === "object") {
      assert.equal(node.additionalProperties, false, `${label}.additionalProperties must be false`);
      const names = Object.keys(node.properties || {}); properties += names.length; depth = Math.max(depth, objectDepth);
      propertyNameCharacters += names.reduce((sum, name) => sum + Array.from(name).length, 0);
      assert.deepEqual([...(node.required || [])].sort(), names.sort(), `${label}.required must be complete`);
      for (const [name, child] of Object.entries(node.properties || {})) walk(child, `${label}.properties.${name}`, objectDepth + 1);
    }
    if (node.type === "array") {
      assert.ok(node.items, `${label}.items is required`);
      assert.equal(Number.isInteger(node.maxItems), true, `${label}.maxItems finite bound is required`);
      if (Object.hasOwn(node, "minItems")) assert.ok(Number.isInteger(node.minItems) && node.minItems >= 0, `${label}.minItems invalid`);
      if (Object.hasOwn(node, "maxItems")) assert.ok(Number.isInteger(node.maxItems) && node.maxItems >= 0, `${label}.maxItems invalid`);
      if (Object.hasOwn(node, "minItems") && Object.hasOwn(node, "maxItems")) assert.ok(node.minItems <= node.maxItems, `${label} array bounds invalid`);
      walk(node.items, `${label}.items`, objectDepth);
    }
    if (node.type === "string") {
      assert.equal(Boolean(node.enum) || Number.isInteger(node.maxLength), true, `${label} string must have enum or maxLength`);
      if (Object.hasOwn(node, "minLength")) assert.ok(Number.isInteger(node.minLength) && node.minLength >= 0, `${label}.minLength invalid`);
      if (Object.hasOwn(node, "maxLength")) assert.ok(Number.isInteger(node.maxLength) && node.maxLength > 0, `${label}.maxLength invalid`);
      if (Object.hasOwn(node, "minLength") && Object.hasOwn(node, "maxLength")) assert.ok(node.minLength <= node.maxLength, `${label} string bounds invalid`);
      if (Object.hasOwn(node, "pattern")) assert.equal(typeof node.pattern, "string", `${label}.pattern invalid`);
    }
    if (["number", "integer"].includes(node.type)) {
      assert.equal(Number.isFinite(node.maximum), true, `${label}.maximum finite bound is required`);
      if (Object.hasOwn(node, "minimum")) assert.equal(Number.isFinite(node.minimum), true, `${label}.minimum invalid`);
      if (Object.hasOwn(node, "maximum")) assert.equal(Number.isFinite(node.maximum), true, `${label}.maximum invalid`);
      if (Object.hasOwn(node, "minimum") && Object.hasOwn(node, "maximum")) assert.ok(node.minimum <= node.maximum, `${label} numeric bounds invalid`);
    }
  };
  walk(schema, "$", 1);
  const definitionNameCharacters = 0; const constStringCharacters = 0;
  const schemaStringCharacters = propertyNameCharacters + definitionNameCharacters + enumStringCharacters + constStringCharacters;
  assert.ok(properties <= 5000, "structured-output property limit exceeded");
  assert.ok(depth <= 10, "structured-output nesting limit exceeded");
  assert.ok(enums <= 1000, "structured-output enum limit exceeded");
  assert.ok(schemaStringCharacters <= 120_000, "structured-output schema string character limit exceeded");
  return Object.freeze({
    properties, propertyHeadroom: 5000 - properties,
    maximumObjectDepth: depth, nestingHeadroom: 10 - depth,
    schemaStringCharacters, schemaStringCharacterHeadroom: 120_000 - schemaStringCharacters,
    propertyNameCharacters, definitionNameCharacters, enumStringCharacters, constStringCharacters,
    enumValues: enums, enumValueHeadroom: 1000 - enums,
    largeEnumPropertyCount,
    largestEnumStringCharacters, largestEnumStringCharacterHeadroom: 15_000 - largestEnumStringCharacters
  });
}

export function buildQualificationPrompt(turnInput) {
  const prompt = [
    "You are Katherine's governed synthetic executive in a blind qualification.",
    "Return exactly one action matching the supplied strict schema. Use only visible evidence, supplied memory, and any supplied presealed dossier.",
    ...generalContinuationPromptLines(),
    "Do not request or perform tools, provider calls, source operations, evaluator access, production activity, benchmark activity, or private-reasoning disclosure.",
    "Do not infer hidden expected answers. State uncertainty without converting later-stage uncertainty into premature termination.",
    stableJson(turnInput)
  ].join("\n");
  const bytes = Buffer.byteLength(prompt, "utf8");
  assert.ok(bytes > 0, "qualification prompt must not be empty");
  return Object.freeze({ text: prompt, byteCount: bytes, hash: sha256Bytes(Buffer.from(prompt, "utf8")) });
}

export function buildQualificationInferenceRequestEnvelope({ prompt, structuredSchema }) {
  assertQualificationStructuredOutputsSubset(structuredSchema);
  return Object.freeze({
    model: QUALIFICATION_ROUTE.model, reasoning: { effort: QUALIFICATION_ROUTE.reasoningEffort }, store: false,
    background: false, stream: false, tools: [], max_output_tokens: QUALIFICATION_ROUTE.maximumOutputTokens,
    input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
    text: { format: { type: "json_schema", name: "katherine_blind_qualification_action_v1", strict: true, schema: structuredSchema } }
  });
}

export function conservativeQualificationInputTokenReservation(serializedRequestByteCount) {
  assert.ok(Number.isInteger(serializedRequestByteCount) && serializedRequestByteCount > 0);
  return Object.freeze({
    method: QUALIFICATION_ROUTE.conservativeInputTokenReservationMethod,
    exactSerializedRequestByteCount: serializedRequestByteCount,
    conservativeInputTokenReservation: serializedRequestByteCount,
    exactPreDispatchTokenCountAvailable: false
  });
}

export function qualificationReservationUsd(conservativeInputTokenReservation, pricing) {
  assert.ok(Number.isInteger(conservativeInputTokenReservation) && conservativeInputTokenReservation > 0);
  const raw = (conservativeInputTokenReservation * pricing.inputUsdPerMillionTokens + QUALIFICATION_ROUTE.maximumOutputTokens * pricing.outputIncludingReasoningUsdPerMillionTokens) / 1_000_000;
  return Math.ceil(raw * 100_000_000) / 100_000_000;
}

export function classifyQualificationRequestBudget({ serializedRequest, materialization, pricing }) {
  assert.equal(typeof serializedRequest, "string");
  const exactSerializedRequestByteCount = Buffer.byteLength(serializedRequest, "utf8");
  const reservation = conservativeQualificationInputTokenReservation(exactSerializedRequestByteCount);
  const reservationUsd = qualificationReservationUsd(reservation.conservativeInputTokenReservation, pricing);
  const withinRequestByteCeiling = exactSerializedRequestByteCount <= QUALIFICATION_ROUTE.maximumSerializedRequestBytes;
  const withinCaseCostCeiling = reservationUsd <= QUALIFICATION_LIMITS.perCase.maximumCostUsd;
  const classification = withinRequestByteCeiling && withinCaseCostCeiling ? "WITHIN_SEALED_MATERIALIZATION_BUDGET" : "QUALIFICATION_MATERIALIZATION_BUDGET_EXCEEDED";
  return Object.freeze({
    schemaVersion: "1.0", accountingType: "QUALIFICATION_PRE_DISPATCH_REQUEST_ACCOUNTING",
    artifactCount: materialization.artifactCount,
    canonicalArtifactOrder: [...materialization.canonicalArtifactOrder],
    individualArtifactHashes: materialization.individualArtifactHashes.map((item) => ({ ...item })),
    materializedAggregateHash: materialization.materializedAggregateHash,
    promptByteCount: materialization.promptByteCount,
    exactSerializedRequestByteCount,
    conservativeInputTokenReservation: reservation.conservativeInputTokenReservation,
    conservativeReservationMethod: reservation.method,
    exactPreDispatchTokenCountAvailable: false,
    maximumSerializedRequestBytes: QUALIFICATION_ROUTE.maximumSerializedRequestBytes,
    maximumOutputTokens: QUALIFICATION_ROUTE.maximumOutputTokens,
    maximumCaseCostUsd: QUALIFICATION_LIMITS.perCase.maximumCostUsd,
    reservationUsd,
    withinRequestByteCeiling,
    withinCaseCostCeiling,
    classification
  });
}

export function qualificationActualCostUsd(usage, pricing) {
  if (!usage?.complete) return null;
  const raw = (usage.inputTokens * pricing.inputUsdPerMillionTokens + usage.outputTokens * pricing.outputIncludingReasoningUsdPerMillionTokens) / 1_000_000;
  return Math.ceil(raw * 100_000_000) / 100_000_000;
}

function extractSafeUsage(usage) {
  const integer = (value) => Number.isInteger(value) && value >= 0 ? value : null;
  const result = {
    inputTokens: integer(usage?.input_tokens), cachedInputTokens: integer(usage?.input_tokens_details?.cached_tokens),
    outputTokens: integer(usage?.output_tokens), reasoningTokens: integer(usage?.output_tokens_details?.reasoning_tokens), totalTokens: integer(usage?.total_tokens)
  };
  return Object.freeze({ complete: result.inputTokens !== null && result.outputTokens !== null && result.totalTokens !== null, ...result });
}

async function inspectResponse(response) {
  const source = typeof response.arrayBuffer === "function" ? Buffer.from(await response.arrayBuffer()) : Buffer.from(await response.text(), "utf8");
  const truncated = source.length > PROVIDER_RESPONSE_BODY_LIMIT_BYTES;
  const bytes = truncated ? source.subarray(0, PROVIDER_RESPONSE_BODY_LIMIT_BYTES) : source;
  let payload = null; let parseState = "JSON";
  if (!truncated) {
    try { payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch { const media = String(response.headers?.get?.("content-type") || "").split(";", 1)[0].trim().toLowerCase(); parseState = media === "application/json" || media.endsWith("+json") ? "MALFORMED_JSON" : "NON_JSON"; }
  }
  const diagnostics = normalizeProviderResponseDiagnostics({ status: response.status, requestId: response.headers?.get?.("x-request-id"), contentType: response.headers?.get?.("content-type"), responseByteLength: bytes.length, responseBodyTruncated: truncated, payload, parseState });
  return Object.freeze({ payload, parseState, truncated, diagnostics });
}

function outputText(payload, diagnostics) {
  for (const item of payload?.output || []) for (const content of item?.type === "message" ? item.content || [] : []) {
    if (content?.type === "refusal") throw new SafeProviderFailure("PROVIDER_REFUSAL", 200, diagnostics);
    if (content?.type === "output_text" && typeof content.text === "string") return content.text;
  }
  throw new SafeProviderFailure("PROVIDER_STRUCTURED_OUTPUT_MISSING", 200, diagnostics);
}

export class QualificationResponsesClient {
  #profile; #credentialHandle; #fetch; #dispatches = 0; #diagnostics = unavailableProviderDiagnostics();
  constructor({ profile, credentialHandle, fetchImpl = globalThis.fetch }) {
    assert.equal(typeof fetchImpl, "function");
    assert.equal(profile.exactModelId, QUALIFICATION_ROUTE.model); assert.equal(profile.reasoning.effort, QUALIFICATION_ROUTE.reasoningEffort);
    this.#profile = profile; this.#credentialHandle = credentialHandle; this.#fetch = fetchImpl;
  }
  get counts() { return Object.freeze({ metadataRequests: 0, inferenceRequests: this.#dispatches, retries: 0 }); }
  get diagnostics() { return this.#diagnostics; }
  async decisionTurn({ serializedRequest, requestHash, signal }) {
    assert.equal(sha256Bytes(Buffer.from(serializedRequest, "utf8")), requestHash, "qualification serialized request hash differs");
    const url = new URL(this.#profile.inferenceEndpoint, `${this.#profile.apiBaseUrl}/`);
    assert.equal(url.protocol, "https:"); assert.equal(this.#profile.apiBaseDomainAllowlist.includes(url.hostname), true);
    let response;
    try {
      response = await this.#credentialHandle.withCredential((credential) => {
        this.#dispatches += 1;
        return this.#fetch(url, { method: "POST", redirect: "manual", signal, headers: { "content-type": "application/json", authorization: `Bearer ${credential}` }, body: serializedRequest });
      });
    } catch (error) {
      if (error instanceof SafeProviderFailure) throw error;
      const timeout = error?.name === "AbortError";
      this.#diagnostics = unavailableProviderDiagnostics({ timeoutClassification: timeout ? "TIMEOUT" : "NOT_TIMEOUT", networkConnectionClassification: timeout ? "NOT_RECEIVED" : "CONNECTION_FAILURE" });
      throw new SafeProviderFailure(timeout ? "PROVIDER_TIMEOUT" : "PROVIDER_CONNECTION_FAILURE", null, this.#diagnostics);
    }
    const inspected = await inspectResponse(response); this.#diagnostics = inspected.diagnostics;
    if (response.status >= 300 && response.status < 400) throw new SafeProviderFailure("PROVIDER_REDIRECT_REJECTED", response.status, inspected.diagnostics);
    if (!response.ok) throw new SafeProviderFailure(classifyHttpFailure(response.status), response.status, inspected.diagnostics);
    if (inspected.truncated) throw new SafeProviderFailure("PROVIDER_RESPONSE_TOO_LARGE", response.status, inspected.diagnostics);
    if (inspected.parseState !== "JSON") throw new SafeProviderFailure("PROVIDER_JSON_INVALID", response.status, inspected.diagnostics);
    if (inspected.payload?.model !== QUALIFICATION_ROUTE.model) throw new SafeProviderFailure("MODEL_ID_MISMATCH", response.status, inspected.diagnostics);
    if (inspected.payload?.status !== "completed") throw new SafeProviderFailure("PROVIDER_RESPONSE_NOT_COMPLETED", response.status, inspected.diagnostics);
    let actionCore;
    try { actionCore = JSON.parse(outputText(inspected.payload, inspected.diagnostics)); }
    catch (error) { if (error instanceof SafeProviderFailure) throw error; throw new SafeProviderFailure("PROVIDER_STRUCTURED_OUTPUT_MALFORMED", response.status, inspected.diagnostics); }
    const usage = extractSafeUsage(inspected.payload.usage);
    const safe = { providerResponseId: safeProviderRequestId(inspected.payload.id), providerRequestId: inspected.diagnostics.safeProviderRequestId, modelId: inspected.payload.model, responseStatus: inspected.payload.status, usage, actionCoreHash: sha256Json(actionCore), providerDiagnostics: inspected.diagnostics };
    return Object.freeze({ ...safe, safeResponseHash: sha256Json(safe), actionCore });
  }
}

export async function loadQualificationProviderProfile() {
  const profile = await loadRealProviderProfile();
  assert.equal(QUALIFICATION_ROUTE.maximumMetadataRequests, 0);
  return profile;
}

export async function qualificationRouteBindings() {
  const [profile, continuationPolicyBytes, generalContinuationPolicyBytes, authoritySchemaBytes, ledgerSchemaBytes] = await Promise.all([
    loadQualificationProviderProfile(), readFile(continuationPolicyPath), readFile(generalContinuationPolicyPath), readFile(authoritySchemaPath), readFile(ledgerSchemaPath)
  ]);
  const templateSchema = createQualificationActionTransportSchema({ episodeId: "qualification-template-episode", executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), actionId: "qualification-action-template" });
  return Object.freeze({
    profile,
    providerProfileHash: profile.profileHash,
    actionRegistryHash: sha256Json({ schemaVersion: ACTION_REGISTRY_VERSION, fixtures: registryActionFixtures() }),
    canonicalExecutiveActionSchemaHash: sha256Json(canonicalExecutiveActionSchema()),
    continuationPolicyHash: sha256Bytes(continuationPolicyBytes),
    generalContinuationPolicyHash: sha256Bytes(generalContinuationPolicyBytes),
    authoritySchemaHash: sha256Bytes(authoritySchemaBytes),
    ledgerSchemaHash: sha256Bytes(ledgerSchemaBytes),
    transmittedSchemaTemplateExactHash: sha256Bytes(Buffer.from(JSON.stringify(templateSchema), "utf8")),
    transmittedSchemaTemplateStableHash: sha256Json(templateSchema)
  });
}
