import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Bytes, sha256Json } from "../../scripts/protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const calibrationRoot = path.resolve(scriptDirectory, "..");
export const qualificationRoot = path.resolve(calibrationRoot, "..");
export const repositoryRoot = path.resolve(qualificationRoot, "..", "..");
export const providerProfilePath = path.join(calibrationRoot, "provider-profile.json");
export const calibrationCasePath = path.join(calibrationRoot, "calibration-case.json");
export const calibrationPromptPath = path.join(calibrationRoot, "calibration-prompt.txt");
export const billingAttestationPath = path.join(calibrationRoot, "billing-attestation.json");
export const executiveActionSchemaPath = path.join(qualificationRoot, "schemas", "executive-action.schema.json");
export const authoritySchemaPath = path.join(calibrationRoot, "schemas", "real-route-calibration-authority.schema.json");
export const authorityReceiptSchemaPath = path.join(calibrationRoot, "schemas", "authority-sealing-receipt.schema.json");
export const resultSchemaPath = path.join(calibrationRoot, "schemas", "calibration-result.schema.json");

const PROFILE_FIELDS = Object.freeze([
  "schemaVersion", "profileType", "providerIdentity", "endpointClass", "apiBaseUrl", "apiBaseDomainAllowlist",
  "metadataEndpoint", "inferenceEndpoint", "exactModelId", "reasoning", "responsePersistence", "enabledTools",
  "disabledTools", "backgroundModeEnabled", "streamingEnabled", "promptCaching", "structuredOutput", "timeoutMs",
  "ceilings", "pricing", "costCalculation", "usageExtraction", "missingUsageTreatment", "retryPolicy",
  "credentialBoundary", "redactionRules", "permittedHttpMetadataFields", "forbiddenLoggedFields", "profileHash"
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

export function validateRealProviderProfile(profile) {
  exactKeys(profile, PROFILE_FIELDS, "real provider profile");
  assert.equal(profile.schemaVersion, "1.0");
  assert.equal(profile.profileType, "SYNTHETIC_EXECUTIVE_REAL_PROVIDER_PROFILE");
  assert.equal(profile.providerIdentity, "OPENAI_API");
  assert.equal(profile.endpointClass, "RESPONSES_API");
  assert.equal(profile.apiBaseUrl, "https://api.openai.com");
  assert.deepEqual(profile.apiBaseDomainAllowlist, ["api.openai.com"]);
  assert.equal(profile.metadataEndpoint, "v1/models/gpt-5.6-sol");
  assert.equal(profile.inferenceEndpoint, "v1/responses");
  assert.equal(profile.exactModelId, "gpt-5.6-sol");
  assert.deepEqual(profile.reasoning, { effort: "medium", mode: "standard", context: "current_turn" });
  assert.deepEqual(profile.responsePersistence, { store: false });
  assert.deepEqual(profile.enabledTools, []);
  assert.equal(profile.disabledTools.length, 9);
  assert.equal(profile.backgroundModeEnabled, false);
  assert.equal(profile.streamingEnabled, false);
  assert.deepEqual(profile.promptCaching, { explicitCacheWritesEnabled: false });
  assert.deepEqual(profile.structuredOutput, {
    required: true, strict: true, sourceSchemaVersion: "1.0",
    sourceSchemaRelativePath: "qualification/synthetic-executive/schemas/executive-action.schema.json",
    transportAddsContentHash: true
  });
  assert.equal(profile.timeoutMs, 300000);
  assert.deepEqual(profile.ceilings, {
    maximumPromptBytes: 8000, maximumConservativeInputTokens: 8000, maximumOutputTokens: 2000,
    maximumInferenceRequests: 1, maximumInferenceRetries: 0, maximumMetadataAccessRequests: 1,
    maximumEngineeringWorkerDispatches: 0, maximumAgentToolCalls: 0,
    maximumWallClockDurationMs: 300000, maximumProviderCostUsd: 0.25
  });
  assert.deepEqual(profile.pricing, {
    currency: "USD", inputUsdPerMillionTokens: 5, cachedInputUsdPerMillionTokens: 5,
    outputIncludingReasoningUsdPerMillionTokens: 30
  });
  assert.equal(profile.missingUsageTreatment, "CHARGE_FULL_USD_0_25_RESERVATION_AND_FAIL");
  assert.equal(profile.retryPolicy, "NO_RETRY_AUTHORITY");
  assert.deepEqual(profile.credentialBoundary.approvedRoutes, ["PROCESS_ENVIRONMENT", "DOTENV_FILE"]);
  const core = structuredClone(profile); delete core.profileHash;
  assert.equal(sha256Json(core), profile.profileHash, "real provider profile hash differs");
  return profile;
}

export async function loadRealProviderProfile() {
  return validateRealProviderProfile(JSON.parse(await readFile(providerProfilePath, "utf8")));
}

export function validateCalibrationCase(calibrationCase) {
  const core = structuredClone(calibrationCase); delete core.caseHash;
  assert.equal(calibrationCase.schemaVersion, "1.0");
  assert.equal(calibrationCase.caseType, "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_CASE");
  assert.equal(calibrationCase.episodeId, "KE-CAL-001");
  assert.equal(calibrationCase.executiveState, "INIT");
  assert.equal(calibrationCase.authorizedActionType, "RECONSTRUCT_EPISODE");
  assert.deepEqual(calibrationCase.authorizedTools, []);
  for (const field of ["evaluatorControlAccessPermitted", "qualificationCorpusAccessPermitted", "memoryAccessPermitted", "workerDispatchPermitted"]) assert.equal(calibrationCase[field], false);
  assert.equal(calibrationCase.visibleArtifactInventory.length, 1);
  assert.equal(calibrationCase.visibleArtifactInventory[0].artifactId, "KE-CAL-001:EVIDENCE-001");
  assert.equal(sha256Json(core), calibrationCase.caseHash, "calibration case hash differs");
  return calibrationCase;
}

export async function loadCalibrationCase() {
  return validateCalibrationCase(JSON.parse(await readFile(calibrationCasePath, "utf8")));
}

export function observedStateHash(calibrationCase) {
  return sha256Json({ episodeId: calibrationCase.episodeId, executiveState: calibrationCase.executiveState, visibleArtifactInventory: calibrationCase.visibleArtifactInventory });
}

export async function loadCalibrationPrompt(calibrationCase) {
  const bytes = await readFile(calibrationPromptPath);
  assert.ok(bytes.length > 0 && bytes.length <= 8000, "calibration prompt byte ceiling exceeded");
  assert.equal(bytes.every((value) => value <= 0x7f), true, "calibration prompt must be ASCII-only UTF-8");
  const text = bytes.toString("utf8");
  assert.ok(text.includes(observedStateHash(calibrationCase)), "calibration prompt observed-state binding differs");
  assert.ok(text.includes("KE-CAL-001:EVIDENCE-001"));
  return Object.freeze({ text, byteCount: bytes.length, promptHash: sha256Bytes(bytes) });
}

export async function loadBillingAttestation() {
  const record = JSON.parse(await readFile(billingAttestationPath, "utf8"));
  assert.deepEqual(Object.keys(record).sort(), ["attestationType", "schemaVersion", "statement", "statementHash"].sort());
  assert.equal(record.schemaVersion, "1.0");
  assert.equal(record.attestationType, "HUMAN_BILLING_ATTESTATION");
  assert.equal(record.statement, "Katherine\u2019s Eye already has an OpenAI API project key configured locally, and the associated project has API billing enabled.");
  assert.equal(sha256Bytes(Buffer.from(record.statement, "utf8")), record.statementHash);
  return record;
}

export async function calibrationArtifactBindings() {
  const [profile, calibrationCase, actionSchemaBytes, authoritySchemaBytes, receiptSchemaBytes, resultSchemaBytes, attestation] = await Promise.all([
    loadRealProviderProfile(), loadCalibrationCase(), readFile(executiveActionSchemaPath), readFile(authoritySchemaPath),
    readFile(authorityReceiptSchemaPath), readFile(resultSchemaPath), loadBillingAttestation()
  ]);
  const prompt = await loadCalibrationPrompt(calibrationCase);
  return Object.freeze({
    profile, calibrationCase, prompt, attestation,
    executiveActionSchemaHash: sha256Bytes(actionSchemaBytes),
    authoritySchemaHash: sha256Bytes(authoritySchemaBytes),
    authorityReceiptSchemaHash: sha256Bytes(receiptSchemaBytes),
    resultSchemaHash: sha256Bytes(resultSchemaBytes)
  });
}

export function conservativeMaximumCostUsd(promptByteCount, profile) {
  assert.ok(Number.isInteger(promptByteCount) && promptByteCount > 0 && promptByteCount <= profile.ceilings.maximumPromptBytes);
  const raw = (promptByteCount * profile.pricing.inputUsdPerMillionTokens + profile.ceilings.maximumOutputTokens * profile.pricing.outputIncludingReasoningUsdPerMillionTokens) / 1_000_000;
  return Math.ceil(raw * 100_000_000) / 100_000_000;
}

export function extractSafeUsage(usage) {
  if (!usage || typeof usage !== "object") return Object.freeze({ complete: false, inputTokens: null, cachedInputTokens: null, outputTokens: null, reasoningTokens: null, totalTokens: null });
  const integerOrNull = (value) => Number.isInteger(value) && value >= 0 ? value : null;
  const safe = {
    inputTokens: integerOrNull(usage.input_tokens),
    cachedInputTokens: integerOrNull(usage.input_tokens_details?.cached_tokens),
    outputTokens: integerOrNull(usage.output_tokens),
    reasoningTokens: integerOrNull(usage.output_tokens_details?.reasoning_tokens),
    totalTokens: integerOrNull(usage.total_tokens)
  };
  return Object.freeze({ complete: safe.inputTokens !== null && safe.outputTokens !== null && safe.totalTokens !== null, ...safe });
}

export function actualCostUsd(usage, profile) {
  assert.equal(usage.complete, true, "provider usage is incomplete");
  const raw = (usage.inputTokens * profile.pricing.inputUsdPerMillionTokens + usage.outputTokens * profile.pricing.outputIncludingReasoningUsdPerMillionTokens) / 1_000_000;
  return Math.ceil(raw * 100_000_000) / 100_000_000;
}

export async function createCalibrationActionCoreSchema(calibrationCase) {
  const source = JSON.parse(await readFile(executiveActionSchemaPath, "utf8"));
  const properties = structuredClone(source.properties);
  delete properties.contentHash;
  for (const field of ["evidenceReferences", "memoryReferences", "factualFindings", "uncertainties", "prohibitedOperations"]) properties[field] = { ...properties[field], items: { type: "string" } };
  properties.actionId = { const: "KE-CAL-001-ACTION-001" };
  properties.actionType = { const: "RECONSTRUCT_EPISODE" };
  properties.episodeId = { const: "KE-CAL-001" };
  properties.executiveState = { const: "INIT" };
  properties.observedStateHash = { const: observedStateHash(calibrationCase) };
  properties.evidenceReferences = { const: ["KE-CAL-001:EVIDENCE-001"] };
  properties.memoryReferences = { const: [] };
  properties.requestedSuccessorState = { const: "EPISODE_RECONSTRUCTED" };
  properties.authorityClass = { const: "NO_NEW_AUTHORITY" };
  properties.prohibitedOperations = { const: ["PRODUCTION_EXECUTION", "BENCHMARK_EXECUTION", "SHELL", "GIT", "SOURCE_EDIT", "DEPLOYMENT", "PROVIDER_TOOL", "ENGINEERING_WORKER"] };
  properties.details = { type: "object", properties: {}, required: [], additionalProperties: false };
  return Object.freeze({
    type: "object", additionalProperties: false, properties,
    required: source.required.filter((field) => field !== "contentHash")
  });
}
