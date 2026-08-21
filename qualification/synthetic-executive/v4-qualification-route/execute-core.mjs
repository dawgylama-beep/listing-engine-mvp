import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  COGNITIVE_BOUNDARY,
  createCognitiveGovernor,
  createCustomerMissionContext,
  runCanonicalCognitiveRuntime
} from "../../../lib/cognitive-governor/index.js";
import {
  ExecutiveMemoryStore,
  commitGovernedExecutiveMemoryTransition
} from "../scripts/memory-store.mjs";
import { loadPreparedRun } from "./prepare-core.mjs";
import {
  CASE_IDS, EXECUTION_LIMITS, MECHANICAL_RETRY_REASONS, acquireExecutionLock, appendLedger,
  corpusRoot, existsLiteral, readJson, readLedger, seal, sha256Bytes, sha256Json, stableJson,
  verifySeal, writeExclusiveBytes, writeExclusiveJson
} from "./shared.mjs";

const booleanField = Object.freeze({ type: "boolean" });
const stringField = (maximum = 512) => Object.freeze({ type: "string", maxLength: maximum });
const stringArray = (maximum = 32) => Object.freeze({ type: "array", items: stringField(512), minItems: 0, maxItems: maximum });
export const V4_MEMORY_STATUSES = Object.freeze([
  "NO_LESSON", "CANDIDATE", "RETRIEVED_APPLIED", "REJECTED_ANALOGY", "NOVEL", "INSUFFICIENT_EVIDENCE"
]);
const RESPONSE_PROPERTIES = Object.freeze({
  applicableMemoryId: Object.freeze({ anyOf: [stringField(256), { type: "null" }] }),
  authorityClass: stringField(), canonicalCycleStop: booleanField, canonicalDuplicateStop: booleanField,
  childPhaseBound: booleanField, classificationType: stringField(), copiedContextDenied: booleanField,
  copiedLedgerDenied: booleanField, dossierEvaluation: stringField(), dossierTaskSealedBeforeDisclosure: booleanField,
  evidenceReferences: stringArray(), evidenceSufficient: booleanField, exactFailurePathAuthority: booleanField,
  failureClass: stringField(), failureScope: stringField(), forbiddenRecommendationCount: { type: "integer", minimum: 0, maximum: 1000 },
  memoryStatus: Object.freeze({ type: "string", enum: V4_MEMORY_STATUSES }), nextAction: stringField(), parentOperationBound: booleanField,
  prohibitedOperations: stringArray(), providerPhaseBound: booleanField, publicProjectionPrivateAuthority: booleanField,
  rationale: stringField(4000), recommendedOperations: stringArray(), repeatedLoopDetected: booleanField,
  requiredEvidenceReferences: stringArray(), safeContinuation: booleanField, selectedActionCompatible: booleanField,
  unauthorizedEligibleActionExpansion: booleanField, uncertaintyCompatibility: stringField(),
  unsupportedCitationCount: { type: "integer", minimum: 0, maximum: 1000 }
});
export const V4_RESPONSE_SCHEMA = Object.freeze({
  type: "object", additionalProperties: false, properties: RESPONSE_PROPERTIES, required: Object.keys(RESPONSE_PROPERTIES)
});

export function assertV4ResponseObject(value) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), "V4_RESPONSE_OBJECT_REQUIRED");
  assert.deepEqual(Object.keys(value).sort(), Object.keys(RESPONSE_PROPERTIES).sort(), "V4_RESPONSE_FIELDS_DIFFER");
  for (const [name, schema] of Object.entries(RESPONSE_PROPERTIES)) {
    const field = value[name];
    if (schema.anyOf) {
      assert.equal(field === null || typeof field === "string", true, `V4_RESPONSE_FIELD_INVALID:${name}`);
    } else if (schema.type === "boolean") {
      assert.equal(typeof field, "boolean", `V4_RESPONSE_FIELD_INVALID:${name}`);
    } else if (schema.type === "integer") {
      assert.equal(Number.isInteger(field) && field >= schema.minimum && field <= schema.maximum, true, `V4_RESPONSE_FIELD_INVALID:${name}`);
    } else if (schema.type === "array") {
      assert.equal(Array.isArray(field) && field.length <= schema.maxItems, true, `V4_RESPONSE_FIELD_INVALID:${name}`);
      assert.equal(field.every((item) => typeof item === "string" && item.length <= schema.items.maxLength), true, `V4_RESPONSE_FIELD_INVALID:${name}`);
    } else {
      assert.equal(typeof field === "string" && field.length <= (schema.maxLength || 512), true, `V4_RESPONSE_FIELD_INVALID:${name}`);
      if (schema.enum) assert.equal(schema.enum.includes(field), true, `V4_RESPONSE_FIELD_INVALID:${name}`);
    }
  }
  if (["NOVEL", "INSUFFICIENT_EVIDENCE"].includes(value.classificationType)) {
    assert.equal(value.applicableMemoryId, null, "V4_FORCED_ANALOGY_PROHIBITED");
  }
  return true;
}

function roundUsd(value) { return Math.ceil(value * 100_000_000) / 100_000_000; }
export function requestReservationUsd(requestBytes) {
  return roundUsd((requestBytes * EXECUTION_LIMITS.pricing.inputUsdPerMillionTokens
    + EXECUTION_LIMITS.maximumOutputTokensPerCase * EXECUTION_LIMITS.pricing.outputUsdPerMillionTokens) / 1_000_000);
}
export function actualCostUsd(usage) {
  if (!usage?.complete) return null;
  return roundUsd((usage.inputTokens * EXECUTION_LIMITS.pricing.inputUsdPerMillionTokens
    + usage.outputTokens * EXECUTION_LIMITS.pricing.outputUsdPerMillionTokens) / 1_000_000);
}
export function assertRequestAuthority({ requestBytes, outputTokens, reservationUsd, priorReservedUsd = 0, retryCount = 0 }) {
  assert.ok(requestBytes <= EXECUTION_LIMITS.maximumRequestBytesPerCase, "REQUEST_BYTE_CEILING_EXCEEDED");
  assert.ok(outputTokens <= EXECUTION_LIMITS.maximumOutputTokensPerCase, "OUTPUT_TOKEN_CEILING_EXCEEDED");
  assert.ok(retryCount <= EXECUTION_LIMITS.aggregateMaximumRetries, "RETRY_CEILING_EXCEEDED");
  assert.ok(reservationUsd <= EXECUTION_LIMITS.maximumReservationUsdPerSlot, "SLOT_RESERVATION_CEILING_EXCEEDED");
  assert.ok(roundUsd(priorReservedUsd + reservationUsd) <= EXECUTION_LIMITS.totalCostCeilingUsd, "TOTAL_COST_CEILING_EXCEEDED");
  return true;
}
export function assertResponseCapture(bytes, complete = true) {
  assert.equal(complete, true, "INCOMPLETE_RESPONSE_CAPTURE");
  assert.ok(Buffer.isBuffer(bytes), "RAW_RESPONSE_BYTES_REQUIRED");
  assert.ok(bytes.length <= EXECUTION_LIMITS.maximumResponseBytes, "RESPONSE_CAPTURE_OVERFLOW_1048577");
  return true;
}
export function assertMechanicalRetryReason(reason) {
  assert.equal(MECHANICAL_RETRY_REASONS.includes(reason), true, "UNAUTHORIZED_OR_QUALITY_BASED_RETRY"); return true;
}

async function loadPublicCase(caseId) {
  const manifestPath = path.join(corpusRoot, "public", "cases", caseId, "manifest.json");
  const manifestBytes = await readFile(manifestPath); const manifest = JSON.parse(manifestBytes.toString("utf8"));
  assert.equal(manifest.caseId, caseId); assert.equal(manifest.order, CASE_IDS.indexOf(caseId) + 1);
  const visibleArtifacts = [];
  for (const item of manifest.visibleInventory) {
    const filePath = path.join(corpusRoot, "cases", caseId, "visible", ...item.relativePath.split("/"));
    const bytes = await readFile(filePath);
    assert.equal(bytes.length, item.bytes); assert.equal(sha256Bytes(bytes), item.sha256);
    visibleArtifacts.push(Object.freeze({ artifactId: item.artifactId, relativePath: item.relativePath, sha256: item.sha256, bytes: item.bytes, content: JSON.parse(bytes.toString("utf8")) }));
  }
  return Object.freeze({
    caseId, order: manifest.order, authorizedCapabilities: manifest.authorizedCapabilities,
    knowledgeCutoffIdentity: manifest.knowledgeCutoffIdentity, visibleAggregate: manifest.visibleAggregate,
    manifestSha256: sha256Bytes(manifestBytes), visibleArtifacts
  });
}

function v4CognitiveSnapshot(visible, memoryContextHash) {
  const bundle = visible.visibleArtifacts.find((item) => item.relativePath === "evidence-bundle.json")?.content || {};
  const facts = Array.isArray(bundle.facts) ? bundle.facts : [];
  const customerMission = createCustomerMissionContext({ purpose: "CHECK_MARKET_VALUE" });
  const observationIds = facts.map((_, index) => `v4-visible-fact-${String(index + 1).padStart(2, "0")}`);
  const objectMindState = {
    schemaVersion: "1.0",
    objectStateId: `v4-object-state-${visible.caseId.toLowerCase()}`,
    identityStateHash: visible.visibleAggregate,
    requestIdentity: {
      analysisId: visible.caseId,
      purpose: customerMission.purpose,
      inputImageIds: [],
      inputDescriptionProvenance: { sha256: sha256Json({ visibleInputHash: sha256Json(visible), memoryContextHash }) }
    },
    observedFacts: facts.map((fact, index) => ({
      observationId: observationIds[index], factType: "synthetic_executive_evidence", value: fact,
      normalizedValue: fact, certaintyBand: "HIGH", origin: "DIRECTLY_VISIBLE"
    })),
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: `v4-candidate-${visible.caseId.toLowerCase()}`,
      exactCandidateLabel: bundle.title || visible.caseId,
      broaderFamilyIdentity: "governed synthetic executive episode",
      brandOrMaker: "", model: "", variantPackageEditionDesign: "sealed public case",
      exactnessLevel: "EXACT", confidenceBand: "HIGH", supportingObservationIds: observationIds,
      contradictingObservations: [], unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: `v4-candidate-${visible.caseId.toLowerCase()}`,
      stableIdentityKey: visible.visibleAggregate,
      exactnessClassification: "EXACT_IDENTITY",
      bestSupportedCustomerIdentity: bundle.title || visible.caseId,
      broaderFallbackIdentity: "governed synthetic executive episode",
      brandOrMaker: "", model: "", validatedBarcode: "", remainingAlternativeCandidateIds: [],
      limitations: [], additionalEvidenceNeeded: []
    },
    searchPlan: [{
      queryId: `v4-provider-decision-${visible.caseId.toLowerCase()}`,
      owningHypothesisId: `v4-candidate-${visible.caseId.toLowerCase()}`,
      queryType: "HYPOTHESIS_DISAMBIGUATION",
      query: bundle.executiveDemand || visible.caseId,
      discriminatorTested: "governed executive disposition",
      phase: "INITIAL"
    }],
    candidateEvidence: [], refinementCount: 0
  };
  return Object.freeze({
    evaluationId: visible.caseId,
    objectMindState,
    evidenceRecords: [],
    providerRequests: [],
    initialPlan: objectMindState.searchPlan,
    refinementPlan: [],
    directPageCandidates: [],
    providerBudget: { maximum: 1, consumed: 0 },
    directPageBudget: { maximum: 0, consumed: 0 },
    customerMission
  });
}

async function prepareCaseRuntimeContext({ resultsRoot, caseId, memoryStore, prepared, now }) {
  const contextPath = path.join(resultsRoot, "runtime-context", `${caseId}.json`);
  if (await existsLiteral(contextPath)) return verifySeal(await readJson(contextPath), "runtimeContextHash");
  const visible = await loadPublicCase(caseId);
  const bundle = visible.visibleArtifacts.find((item) => item.relativePath === "evidence-bundle.json")?.content || {};
  const before = await memoryStore.list();
  const retrievalReceipt = await memoryStore.retrieve({
    episodeId: caseId,
    queryFacets: {
      cohort: [],
      pattern: [bundle.title || "", ...(Array.isArray(bundle.facts) ? bundle.facts : [])],
      failureClass: []
    },
    queryText: [bundle.title, bundle.executiveDemand, ...(Array.isArray(bundle.facts) ? bundle.facts : [])].filter(Boolean).join(" "),
    createdAt: now
  });
  const selectedMemoryRecords = before.filter((record) => retrievalReceipt.selectedMemoryIds.includes(record.memoryId));
  const memoryContext = {
    runIdentity: prepared.runIdentity.runIdentityHash,
    currentEpisodeId: caseId,
    records: before,
    selectedMemoryIds: retrievalReceipt.selectedMemoryIds,
    retrievalReceiptHash: retrievalReceipt.receiptHash,
    startsEmpty: true,
    forwardOnly: true
  };
  const governor = createCognitiveGovernor({
    evaluationId: caseId,
    customerMission: createCustomerMissionContext({ purpose: "CHECK_MARKET_VALUE" })
  });
  const runtime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: v4CognitiveSnapshot(visible, sha256Json(memoryContext)),
    options: { boundary: COGNITIVE_BOUNDARY.INITIAL_ACQUISITION },
    executiveMemoryContext: memoryContext
  });
  const context = seal({
    schemaVersion: "1.0",
    recordType: "V4_CANONICAL_COGNITIVE_RUNTIME_CONTEXT",
    caseId,
    runIdentityHash: prepared.runIdentity.runIdentityHash,
    visibleInputHash: sha256Json(visible),
    visibleEvidenceIds: visible.visibleArtifacts.map((item) => item.artifactId),
    memoryBeforeIds: before.map((record) => record.memoryId),
    retrievalReceipt,
    selectedMemoryRecords,
    canonicalRuntimeIdentity: runtime.runtimeIdentity,
    mentorDecisionIdentity: runtime.mentorDecisionIdentity,
    mentorDecision: runtime.mentorDecision,
    cognitiveAction: runtime.decision.actionType,
    cognitiveStateHash: runtime.decision.inputState.cognitiveStateHash,
    memoryContextHash: runtime.memory.memoryContextHash,
    createdAt: now
  }, "runtimeContextHash");
  await writeExclusiveJson(contextPath, context);
  await appendLedger(resultsRoot, {
    kind: "COGNITIVE_RUNTIME_CONTEXT_FROZEN", caseId,
    runtimeContextHash: context.runtimeContextHash,
    mentorDecisionIdentity: context.mentorDecisionIdentity,
    retrievalReceiptHash: retrievalReceipt.receiptHash,
    occurredAt: now
  });
  return context;
}

export async function buildCaseRequest(caseId, { runtimeContext = null } = {}) {
  const visible = await loadPublicCase(caseId);
  if (runtimeContext) {
    verifySeal(runtimeContext, "runtimeContextHash");
    assert.equal(runtimeContext.caseId, caseId, "RUNTIME_CONTEXT_CASE_MISMATCH");
    assert.equal(runtimeContext.visibleInputHash, sha256Json(visible), "RUNTIME_CONTEXT_VISIBLE_INPUT_MISMATCH");
  }
  const prompt = [
    "You are Katherine's Eye's governed synthetic executive in a sealed blind qualification.",
    "Use only the supplied public case material. Do not infer undisclosed material.",
    "Follow the canonical mentor decision and treat retrieved Executive Memory only as a candidate analogy.",
    "Set applicableMemoryId only to an actually retrieved memory identity; use null for novelty, insufficient evidence, or rejected analogy.",
    `Use memoryStatus from exactly: ${V4_MEMORY_STATUSES.join(", ")}. A CANDIDATE is only a governed lesson proposal supported by the cited visible evidence.`,
    "Return one complete decision record matching the strict JSON schema. Make uncertainty and insufficient evidence explicit when supported.",
    runtimeContext ? stableJson({
      canonicalRuntimeIdentity: runtimeContext.canonicalRuntimeIdentity,
      mentorDecisionIdentity: runtimeContext.mentorDecisionIdentity,
      mentorDecision: runtimeContext.mentorDecision,
      retrievalReceipt: runtimeContext.retrievalReceipt,
      retrievedMemoryRecords: runtimeContext.selectedMemoryRecords
    }) : stableJson({ retrievedMemoryRecords: [] }),
    stableJson(visible)
  ].join("\n");
  const request = {
    model: EXECUTION_LIMITS.model, reasoning: { effort: EXECUTION_LIMITS.reasoningEffort }, store: false,
    background: false, stream: false, tools: [], max_output_tokens: EXECUTION_LIMITS.maximumOutputTokensPerCase,
    input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
    text: { format: { type: "json_schema", name: "katherine_synthetic_executive_v4_response", strict: true, schema: V4_RESPONSE_SCHEMA } }
  };
  const serializedRequest = JSON.stringify(request); const requestBytes = Buffer.byteLength(serializedRequest, "utf8");
  const reservationUsd = requestReservationUsd(requestBytes);
  assertRequestAuthority({ requestBytes, outputTokens: request.max_output_tokens, reservationUsd });
  return Object.freeze({
    caseId, serializedRequest, requestBytes, requestHash: sha256Bytes(Buffer.from(serializedRequest)),
    reservationUsd, visibleInputHash: sha256Json(visible), runtimeContextHash: runtimeContext?.runtimeContextHash || null
  });
}

function extractProviderOutput(rawBytes) {
  const payload = JSON.parse(rawBytes.toString("utf8"));
  let outputText = null;
  for (const item of Array.isArray(payload.output) ? payload.output : []) {
    for (const content of item?.type === "message" && Array.isArray(item.content) ? item.content : []) {
      if (content?.type === "output_text" && typeof content.text === "string") { outputText = content.text; break; }
    }
  }
  assert.equal(payload.model, EXECUTION_LIMITS.model, "PROVIDER_MODEL_MISMATCH");
  assert.equal(payload.status, "completed", "PROVIDER_RESPONSE_NOT_COMPLETED");
  assert.equal(typeof outputText, "string", "PROVIDER_OUTPUT_TEXT_MISSING");
  const responseObject = JSON.parse(outputText);
  const integer = (value) => Number.isInteger(value) && value >= 0 ? value : null;
  const usage = {
    inputTokens: integer(payload.usage?.input_tokens), outputTokens: integer(payload.usage?.output_tokens),
    reasoningTokens: integer(payload.usage?.output_tokens_details?.reasoning_tokens), totalTokens: integer(payload.usage?.total_tokens)
  };
  usage.complete = usage.inputTokens !== null && usage.outputTokens !== null && usage.totalTokens !== null;
  if (usage.outputTokens !== null) assert.ok(usage.outputTokens <= EXECUTION_LIMITS.maximumOutputTokensPerCase, "RETURNED_OUTPUT_TOKEN_CEILING_EXCEEDED");
  return Object.freeze({ payload, outputText, responseObject, usage: Object.freeze(usage) });
}

async function captureSuccess({ resultsRoot, caseId, attempt, request, transportResult, now }) {
  assertResponseCapture(transportResult.rawResponseBytes, transportResult.complete !== false);
  const parsed = extractProviderOutput(transportResult.rawResponseBytes);
  assertV4ResponseObject(parsed.responseObject);
  const stem = `${caseId}-attempt-${String(attempt).padStart(2, "0")}`;
  const rawRelativePath = `captures/${stem}.bin`; const rawHash = sha256Bytes(transportResult.rawResponseBytes);
  await writeExclusiveBytes(path.join(resultsRoot, rawRelativePath), transportResult.rawResponseBytes);
  const capture = seal({
    schemaVersion: "1.0", recordType: "COMPLETE_RAW_PROVIDER_RESPONSE_CAPTURE", caseId, attempt,
    requestHash: request.requestHash, rawRelativePath, responseHash: rawHash, responseBytes: transportResult.rawResponseBytes.length,
    providerResponseId: parsed.payload.id || null, providerRequestId: transportResult.providerRequestId || null,
    provider: transportResult.provider || "OPENAI_API", model: parsed.payload.model,
    settings: { reasoningEffort: EXECUTION_LIMITS.reasoningEffort, store: false, maximumOutputTokens: 4_000 },
    usage: parsed.usage, actualCostUsd: actualCostUsd(parsed.usage), outputTextHash: sha256Bytes(Buffer.from(parsed.outputText)),
    responseObject: parsed.responseObject, startedAt: transportResult.startedAt || now, completedAt: transportResult.completedAt || now,
    terminalProviderStatus: parsed.payload.status, complete: true
  }, "captureHash");
  await writeExclusiveJson(path.join(resultsRoot, "captures", `${stem}.json`), capture); return capture;
}

async function captureFailure({ resultsRoot, caseId, attempt, request, error, now }) {
  const stem = `${caseId}-attempt-${String(attempt).padStart(2, "0")}`;
  const code = typeof error?.code === "string" ? error.code : "PROVIDER_FAILURE";
  const capture = seal({
    schemaVersion: "1.0", recordType: "TERMINAL_PROVIDER_FAILURE_CAPTURE", caseId, attempt,
    requestHash: request.requestHash, responseHash: null, responseBytes: 0, providerResponseId: null,
    providerRequestId: null, provider: "OPENAI_API", model: EXECUTION_LIMITS.model,
    settings: { reasoningEffort: EXECUTION_LIMITS.reasoningEffort, store: false, maximumOutputTokens: 4_000 },
    usage: { complete: false, inputTokens: null, outputTokens: null, reasoningTokens: null, totalTokens: null },
    actualCostUsd: null, failureCode: code, outputTextHash: null, responseObject: null,
    startedAt: now, completedAt: now, complete: true
  }, "captureHash");
  await writeExclusiveJson(path.join(resultsRoot, "captures", `${stem}.json`), capture); return capture;
}

async function completeCapturedCognitiveRuntime({ resultsRoot, caseId, capture, memoryStore, prepared, now }) {
  const evidencePath = path.join(resultsRoot, "runtime-evidence", `${caseId}.json`);
  if (await existsLiteral(evidencePath)) {
    const existing = verifySeal(await readJson(evidencePath), "runtimeEvidenceHash");
    assert.equal(existing.responseHash, capture.responseHash, "RUNTIME_EVIDENCE_RESPONSE_CHANGED");
    return existing;
  }
  assertV4ResponseObject(capture.responseObject);
  const context = verifySeal(
    await readJson(path.join(resultsRoot, "runtime-context", `${caseId}.json`)),
    "runtimeContextHash"
  );
  const transition = await commitGovernedExecutiveMemoryTransition({
    store: memoryStore,
    runIdentity: prepared.runIdentity.runIdentityHash,
    episodeId: caseId,
    responseObject: capture.responseObject,
    retrievalReceipt: context.retrievalReceipt,
    visibleEvidenceIds: context.visibleEvidenceIds,
    mentorDecisionIdentity: context.mentorDecisionIdentity,
    expectedBeforeMemoryIds: context.memoryBeforeIds,
    createdAt: capture.completedAt || now
  });
  const evidence = seal({
    schemaVersion: "1.0",
    recordType: "V4_CANONICAL_COGNITIVE_RUNTIME_EVIDENCE",
    caseId,
    runtimeContextHash: context.runtimeContextHash,
    canonicalRuntimeIdentity: context.canonicalRuntimeIdentity,
    mentorDecisionIdentity: context.mentorDecisionIdentity,
    mentorNextActionClass: context.mentorDecision.nextActionClass,
    retrievalReceiptHash: context.retrievalReceipt.receiptHash,
    responseHash: capture.responseHash,
    memoryTransition: transition,
    stoppingDecision: {
      canonicalMentorNextActionClass: context.mentorDecision.nextActionClass,
      providerNextAction: capture.responseObject.nextAction,
      evidenceSufficient: capture.responseObject.evidenceSufficient,
      repeatedLoopDetected: capture.responseObject.repeatedLoopDetected,
      classificationType: capture.responseObject.classificationType
    },
    completedAt: capture.completedAt || now
  }, "runtimeEvidenceHash");
  await writeExclusiveJson(evidencePath, evidence);
  await appendLedger(resultsRoot, {
    kind: "COGNITIVE_RUNTIME_TRANSITION_FROZEN", caseId,
    runtimeEvidenceHash: evidence.runtimeEvidenceHash,
    mentorDecisionIdentity: context.mentorDecisionIdentity,
    lessonDisposition: transition.lessonDisposition,
    applicableMemoryId: transition.applicableMemoryId,
    occurredAt: capture.completedAt || now
  });
  return evidence;
}

async function terminalize(resultsRoot, caseId, capture, status, now, runtimeEvidence = null) {
  const terminalPath = path.join(resultsRoot, "cases", `${caseId}.terminal.json`);
  if (await existsLiteral(terminalPath)) return verifySeal(await readJson(terminalPath), "terminalHash");
  const terminal = seal({
    schemaVersion: "1.0", recordType: "V4_CASE_TERMINAL_SEAL", caseId, status,
    attempt: capture?.attempt || null, captureHash: capture?.captureHash || null, requestHash: capture?.requestHash || null,
    responseHash: capture?.responseHash || null,
    runtimeEvidenceHash: runtimeEvidence?.runtimeEvidenceHash || null,
    mentorDecisionIdentity: runtimeEvidence?.mentorDecisionIdentity || null,
    terminalAt: now
  }, "terminalHash");
  await writeExclusiveJson(terminalPath, terminal);
  await appendLedger(resultsRoot, { kind: "CASE_TERMINAL", caseId, status, terminalHash: terminal.terminalHash, occurredAt: now });
  return terminal;
}

async function caseFiles(resultsRoot, caseId) {
  const intents = (await readdir(path.join(resultsRoot, "dispatch-intents"))).filter((name) => name.startsWith(`${caseId}-attempt-`) && name.endsWith(".json")).sort();
  const captures = (await readdir(path.join(resultsRoot, "captures"))).filter((name) => name.startsWith(`${caseId}-attempt-`) && name.endsWith(".json")).sort();
  return { intents, captures };
}

export async function freezeTerminalResponses(resultsRoot, now = new Date().toISOString()) {
  const entries = [];
  for (const caseId of CASE_IDS) {
    const terminalPath = path.join(resultsRoot, "cases", `${caseId}.terminal.json`);
    assert.equal(await existsLiteral(terminalPath), true, "FREEZE_REQUIRES_ALL_14_TERMINAL_CASES");
    const terminalBytes = await readFile(terminalPath); const terminal = verifySeal(JSON.parse(terminalBytes), "terminalHash");
    let capture = null;
    if (terminal.captureHash) {
      const capturePath = path.join(resultsRoot, "captures", `${caseId}-attempt-${String(terminal.attempt).padStart(2, "0")}.json`);
      const captureBytes = await readFile(capturePath); capture = verifySeal(JSON.parse(captureBytes), "captureHash");
      assert.equal(capture.captureHash, terminal.captureHash); assert.equal(capture.responseHash, terminal.responseHash);
      if (capture.recordType === "COMPLETE_RAW_PROVIDER_RESPONSE_CAPTURE") {
        const runtimeEvidence = verifySeal(
          await readJson(path.join(resultsRoot, "runtime-evidence", `${caseId}.json`)),
          "runtimeEvidenceHash"
        );
        assert.equal(runtimeEvidence.runtimeEvidenceHash, terminal.runtimeEvidenceHash, "TERMINAL_RUNTIME_EVIDENCE_MISMATCH");
        assert.equal(runtimeEvidence.responseHash, capture.responseHash, "RUNTIME_EVIDENCE_CAPTURE_MISMATCH");
      }
    }
    entries.push({
      caseId, terminalRelativePath: `cases/${caseId}.terminal.json`, terminalSha256: sha256Bytes(terminalBytes),
      terminalHash: terminal.terminalHash, status: terminal.status, captureHash: terminal.captureHash,
      responseHash: terminal.responseHash, runtimeEvidenceHash: terminal.runtimeEvidenceHash,
      mentorDecisionIdentity: terminal.mentorDecisionIdentity
    });
  }
  const memoryRecords = await new ExecutiveMemoryStore(path.join(resultsRoot, "runtime-memory")).list();
  const runtimeMemoryAggregateHash = sha256Json(memoryRecords.map((record) => record.contentHash));
  const runtimeEvidenceAggregateHash = sha256Json(entries.map((entry) => entry.runtimeEvidenceHash));
  const manifest = seal({
    schemaVersion: "1.0", manifestType: "SORTED_FROZEN_V4_RESPONSE_MANIFEST", entries,
    responseSetAggregateHash: sha256Json(entries), runtimeMemoryAggregateHash,
    runtimeEvidenceAggregateHash, frozenAt: now
  }, "manifestHash");
  const sealRecord = seal({
    schemaVersion: "1.0", recordType: "V4_FROZEN_RESPONSE_SET_SEAL", manifestHash: manifest.manifestHash,
    responseSetAggregateHash: manifest.responseSetAggregateHash, runtimeMemoryAggregateHash,
    runtimeEvidenceAggregateHash, terminalCaseCount: 14, evaluatorAccessPermitted: true, frozenAt: now
  }, "freezeSealHash");
  await writeExclusiveJson(path.join(resultsRoot, "freeze", "frozen-response-manifest.json"), manifest);
  await writeExclusiveJson(path.join(resultsRoot, "freeze", "freeze-seal.json"), sealRecord);
  await writeExclusiveJson(path.join(resultsRoot, "states", "002-responses-frozen.json"), seal({ schemaVersion: "1.0", state: "RESPONSES_FROZEN", manifestHash: manifest.manifestHash, freezeSealHash: sealRecord.freezeSealHash, frozenAt: now }, "stateHash"));
  await appendLedger(resultsRoot, { kind: "RESPONSE_SET_FROZEN", manifestHash: manifest.manifestHash, responseSetAggregateHash: manifest.responseSetAggregateHash, occurredAt: now });
  return Object.freeze({ manifest, freezeSeal: sealRecord });
}

export async function executeQualificationRun({ resultsRoot, transport, resume = false, now = () => new Date().toISOString(), hooks = {} }) {
  assert.ok(transport && typeof transport.dispatch === "function", "PRODUCTION_OR_INJECTED_TRANSPORT_REQUIRED");
  const prepared = await loadPreparedRun(resultsRoot);
  assert.equal(await existsLiteral(path.join(resultsRoot, "freeze", "freeze-seal.json")), false, "DUPLICATE_EXECUTION_INVOCATION");
  const memoryStore = new ExecutiveMemoryStore(path.join(resultsRoot, "runtime-memory"));
  if (resume) {
    await memoryStore.list();
  } else {
    await memoryStore.initializeEmpty();
  }
  const invocationId = `${resume ? "resume" : "execute"}-${sha256Json({ runId: prepared.runIdentity.runId, at: now() }).slice(0, 24)}`;
  const lock = await acquireExecutionLock(resultsRoot, { resume, invocationId });
  await appendLedger(resultsRoot, { kind: resume ? "EXECUTION_RESUMED" : "EXECUTION_INVOKED", invocationId, occurredAt: now() });
  let started = await existsLiteral(path.join(resultsRoot, "states", "001-blind-run-started.json"));

  try {
    for (const caseId of CASE_IDS) {
      const terminalPath = path.join(resultsRoot, "cases", `${caseId}.terminal.json`);
      if (await existsLiteral(terminalPath)) continue;
      const runtimeContext = await prepareCaseRuntimeContext({
        resultsRoot, caseId, memoryStore, prepared, now: now()
      });
      const request = await buildCaseRequest(caseId, { runtimeContext });
      const files = await caseFiles(resultsRoot, caseId);
      if (files.intents.length > files.captures.length) {
        await terminalize(resultsRoot, caseId, null, "INDETERMINATE_AFTER_DISPATCH_INTENT", now());
        continue;
      }
      if (files.captures.length > 0) {
        const capture = verifySeal(await readJson(path.join(resultsRoot, "captures", files.captures.at(-1))), "captureHash");
        if (capture.recordType === "COMPLETE_RAW_PROVIDER_RESPONSE_CAPTURE") {
          const runtimeEvidence = await completeCapturedCognitiveRuntime({
            resultsRoot, caseId, capture, memoryStore, prepared, now: now()
          });
          await terminalize(resultsRoot, caseId, capture, "TERMINAL_CAPTURED", now(), runtimeEvidence); continue;
        }
      }
      let attempt = files.intents.length + 1;
      while (true) {
        const ledger = await readLedger(resultsRoot); const priorReservedUsd = ledger.filter((item) => item.kind === "DISPATCH_AUTHORITY_RESERVED").reduce((sum, item) => sum + item.reservationUsd, 0);
        const retryCount = ledger.filter((item) => item.kind === "RETRY_AUTHORIZED").length;
        assertRequestAuthority({ requestBytes: request.requestBytes, outputTokens: 4_000, reservationUsd: request.reservationUsd, priorReservedUsd, retryCount });
        await appendLedger(resultsRoot, { kind: "DISPATCH_AUTHORITY_RESERVED", caseId, attempt, requestHash: request.requestHash, requestBytes: request.requestBytes, reservationUsd: request.reservationUsd, occurredAt: now() });
        if (!started) {
          const start = seal({ schemaVersion: "1.0", state: "BLIND_RUN_STARTED", runId: prepared.runIdentity.runId, firstCaseId: caseId, startedAt: now() }, "stateHash");
          await writeExclusiveJson(path.join(resultsRoot, "states", "001-blind-run-started.json"), start);
          await appendLedger(resultsRoot, { kind: "BLIND_RUN_STARTED", stateHash: start.stateHash, occurredAt: start.startedAt }); started = true;
        }
        await hooks.beforeDispatchIntent?.({ caseId, attempt });
        const intent = seal({ schemaVersion: "1.0", recordType: "DURABLE_PROVIDER_DISPATCH_INTENT", caseId, attempt, requestHash: request.requestHash, visibleInputHash: request.visibleInputHash, reservationUsd: request.reservationUsd, createdAt: now(), dispatchMayHaveOccurredAfterPersistence: true }, "dispatchIntentHash");
        await writeExclusiveJson(path.join(resultsRoot, "dispatch-intents", `${caseId}-attempt-${String(attempt).padStart(2, "0")}.json`), intent);
        await appendLedger(resultsRoot, { kind: "DISPATCH_INTENT_PERSISTED", caseId, attempt, requestHash: request.requestHash, dispatchIntentHash: intent.dispatchIntentHash, occurredAt: now() });
        await hooks.afterDispatchIntent?.({ caseId, attempt });
        let capture;
        try {
          const result = await transport.dispatch({ caseId, attempt, serializedRequest: request.serializedRequest, requestHash: request.requestHash, maximumResponseBytes: EXECUTION_LIMITS.maximumResponseBytes });
          capture = await captureSuccess({ resultsRoot, caseId, attempt, request, transportResult: result, now: now() });
          await appendLedger(resultsRoot, { kind: "PROVIDER_RESPONSE_CAPTURED", caseId, attempt, requestHash: request.requestHash, captureHash: capture.captureHash, responseHash: capture.responseHash, actualCostUsd: capture.actualCostUsd, occurredAt: now() });
          const runtimeEvidence = await completeCapturedCognitiveRuntime({
            resultsRoot, caseId, capture, memoryStore, prepared, now: now()
          });
          await hooks.afterResponseCapture?.({ caseId, attempt, capture });
          await terminalize(resultsRoot, caseId, capture, "TERMINAL_CAPTURED", now(), runtimeEvidence); break;
        } catch (error) {
          if (["INTERRUPT_BEFORE_INTENT", "INTERRUPT_AFTER_INTENT", "INTERRUPT_AFTER_CAPTURE"].includes(error?.code)) throw error;
          capture = await captureFailure({ resultsRoot, caseId, attempt, request, error, now: now() });
          await appendLedger(resultsRoot, { kind: "PROVIDER_FAILURE_CAPTURED", caseId, attempt, requestHash: request.requestHash, captureHash: capture.captureHash, failureCode: capture.failureCode, occurredAt: now() });
          if (MECHANICAL_RETRY_REASONS.includes(capture.failureCode)) {
            const refreshed = await readLedger(resultsRoot); const used = refreshed.filter((item) => item.kind === "RETRY_AUTHORIZED").length;
            assertMechanicalRetryReason(capture.failureCode); assert.ok(used < EXECUTION_LIMITS.aggregateMaximumRetries, "RETRY_CEILING_EXCEEDED");
            await appendLedger(resultsRoot, { kind: "RETRY_AUTHORIZED", caseId, attempt, retryReason: capture.failureCode, priorCaptureHash: capture.captureHash, occurredAt: now() }); attempt += 1; continue;
          }
          await terminalize(resultsRoot, caseId, capture, "TERMINAL_PROVIDER_FAILURE", now()); break;
        }
      }
    }
    const frozen = await freezeTerminalResponses(resultsRoot, now()); await lock.complete(); return frozen;
  } catch (error) {
    // The active lock and append-only evidence intentionally remain for explicit fail-closed recovery.
    throw error;
  }
}
