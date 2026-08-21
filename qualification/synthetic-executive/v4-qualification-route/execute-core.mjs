import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import {
  COGNITIVE_ACTION,
  createCognitiveGovernor,
  createCustomerMissionContext,
  runCanonicalCognitiveRuntime
} from "../../../lib/cognitive-governor/index.js";
import {
  ExecutiveMemoryStore,
  commitGovernedExecutiveMemoryTransition
} from "../scripts/memory-store.mjs";
import {
  AUTHORITY_CLASSES,
  EVIDENCE_EVALUATIONS,
  NEXT_LEGAL_ACTIONS
} from "../scripts/executive-action-registry.mjs";
import { loadPreparedRun } from "./prepare-core.mjs";
import {
  CASE_IDS, EXECUTION_LIMITS, MECHANICAL_RETRY_REASONS, acquireExecutionLock, appendLedger,
  corpusRoot, existsLiteral, readJson, readLedger, seal, sha256Bytes, sha256Json, stableJson,
  verifySeal, writeExclusiveBytes, writeExclusiveJson
} from "./shared.mjs";

const booleanField = Object.freeze({ type: "boolean" });
const stringField = (maximum = 512) => Object.freeze({ type: "string", maxLength: maximum });
const stringArray = (maximum = 32) => Object.freeze({ type: "array", items: stringField(512), minItems: 0, maxItems: maximum });
const enumField = (values) => Object.freeze({ type: "string", enum: Object.freeze([...values]) });
const enumArray = (values, maximum = 32) => Object.freeze({
  type: "array", items: enumField(values), minItems: 0, maxItems: maximum
});
export const V4_MEMORY_STATUSES = Object.freeze([
  "NO_LESSON", "CANDIDATE", "RETRIEVED_APPLIED", "REJECTED_ANALOGY", "NOVEL", "INSUFFICIENT_EVIDENCE"
]);
export const V4_CLASSIFICATION_TYPES = Object.freeze([
  "CLASSIFY_FAILURE", "DECLARE_RECURRENCE", "DECLARE_NOVEL_FAILURE", "DECLARE_INSUFFICIENT_EVIDENCE"
]);
export const V4_FAILURE_SCOPES = Object.freeze(["BOUNDED", "ARCHITECTURAL", "INSUFFICIENT_EVIDENCE"]);
export const V4_UNCERTAINTY_COMPATIBILITY = Object.freeze(["COMPATIBLE", "INCOMPATIBLE", "UNRESOLVED"]);
export const V4_CANONICAL_OPERATIONS = Object.freeze([
  "AUTHORITY_REQUEST_TRANSITION", "FABRICATE_EVIDENCE", "OUTSIDE_EXISTING_AUTHORITY",
  "QUERY_EXECUTIVE_MEMORY", "READ_VISIBLE_ARTIFACT", "REQUEST_PRESEALED_WORKER_DOSSIER",
  "RETURNED_EVIDENCE_EVALUATION", "SUBMIT_TYPED_ACTION", "TERMINAL_STOP_TRANSITION",
  "USE_PRIVATE_EVALUATOR_MATERIAL"
]);
const RESPONSE_PROPERTIES = Object.freeze({
  applicableMemoryId: Object.freeze({ anyOf: [stringField(256), { type: "null" }] }),
  authorityClass: enumField(AUTHORITY_CLASSES), canonicalCycleStop: booleanField, canonicalDuplicateStop: booleanField,
  childPhaseBound: booleanField, classificationType: enumField(V4_CLASSIFICATION_TYPES), copiedContextDenied: booleanField,
  copiedLedgerDenied: booleanField, dossierEvaluation: enumField(EVIDENCE_EVALUATIONS), dossierTaskSealedBeforeDisclosure: booleanField,
  evidenceReferences: stringArray(), evidenceSufficient: booleanField, exactFailurePathAuthority: booleanField,
  failureClass: stringField(), failureScope: enumField(V4_FAILURE_SCOPES), forbiddenRecommendationCount: { type: "integer", minimum: 0, maximum: 1000 },
  memoryStatus: enumField(V4_MEMORY_STATUSES), nextAction: enumField(NEXT_LEGAL_ACTIONS), parentOperationBound: booleanField,
  prohibitedOperations: enumArray(V4_CANONICAL_OPERATIONS), providerPhaseBound: booleanField, publicProjectionPrivateAuthority: booleanField,
  rationale: stringField(4000), recommendedOperations: enumArray(V4_CANONICAL_OPERATIONS), repeatedLoopDetected: booleanField,
  requiredEvidenceReferences: stringArray(), safeContinuation: booleanField, selectedActionCompatible: booleanField,
  unauthorizedEligibleActionExpansion: booleanField, uncertaintyCompatibility: enumField(V4_UNCERTAINTY_COMPATIBILITY),
  unsupportedCitationCount: { type: "integer", minimum: 0, maximum: 1000 }
});
export const V4_RESPONSE_SCHEMA = Object.freeze({
  type: "object", additionalProperties: false, properties: RESPONSE_PROPERTIES, required: Object.keys(RESPONSE_PROPERTIES)
});

const PROVIDER_ANALYSIS_PROPERTIES = Object.freeze({
  failureAnalysis: stringField(1000),
  memoryApplicability: enumField(["APPLICABLE", "NOT_APPLICABLE", "UNRESOLVED"]),
  rationale: stringField(4000),
  uncertaintyAnalysis: stringField(1000)
});
export const V4_PROVIDER_ANALYSIS_SCHEMA = Object.freeze({
  type: "object",
  additionalProperties: false,
  properties: PROVIDER_ANALYSIS_PROPERTIES,
  required: Object.keys(PROVIDER_ANALYSIS_PROPERTIES)
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
      assert.equal(field.every((item) => typeof item === "string" && item.length <= (schema.items.maxLength || 512)), true, `V4_RESPONSE_FIELD_INVALID:${name}`);
      if (schema.items.enum) assert.equal(field.every((item) => schema.items.enum.includes(item)), true, `V4_RESPONSE_FIELD_INVALID:${name}`);
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

export function assertV4ProviderAnalysisObject(value) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), "V4_PROVIDER_ANALYSIS_OBJECT_REQUIRED");
  assert.deepEqual(
    Object.keys(value).sort(),
    Object.keys(PROVIDER_ANALYSIS_PROPERTIES).sort(),
    "V4_PROVIDER_ANALYSIS_FIELDS_DIFFER"
  );
  for (const [name, schema] of Object.entries(PROVIDER_ANALYSIS_PROPERTIES)) {
    const field = value[name];
    assert.equal(typeof field === "string" && field.length <= (schema.maxLength || 512), true, `V4_PROVIDER_ANALYSIS_FIELD_INVALID:${name}`);
    if (schema.enum) assert.equal(schema.enum.includes(field), true, `V4_PROVIDER_ANALYSIS_FIELD_INVALID:${name}`);
  }
  assert.ok(value.failureAnalysis.trim(), "V4_PROVIDER_FAILURE_ANALYSIS_REQUIRED");
  assert.ok(value.rationale.trim(), "V4_PROVIDER_RATIONALE_REQUIRED");
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
    const workingBytes = await readFile(filePath);
    const lfBytes = Buffer.from(workingBytes.toString("utf8").replace(/\r\n/g, "\n"), "utf8");
    const bytes = workingBytes.length === item.bytes && sha256Bytes(workingBytes) === item.sha256
      ? workingBytes
      : lfBytes.length === item.bytes && sha256Bytes(lfBytes) === item.sha256
        ? lfBytes
        : workingBytes;
    assert.equal(bytes.length, item.bytes); assert.equal(sha256Bytes(bytes), item.sha256);
    visibleArtifacts.push(Object.freeze({ artifactId: item.artifactId, relativePath: item.relativePath, sha256: item.sha256, bytes: item.bytes, content: JSON.parse(bytes.toString("utf8")) }));
  }
  return Object.freeze({
    caseId, order: manifest.order, authorizedCapabilities: manifest.authorizedCapabilities,
    knowledgeCutoffIdentity: manifest.knowledgeCutoffIdentity, visibleAggregate: manifest.visibleAggregate,
    manifestSha256: sha256Bytes(manifestBytes), visibleArtifacts
  });
}

function canonicalPublicToken(value, fallback) {
  const token = String(value || "").normalize("NFKC").toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 100);
  return token || fallback;
}

export function createV4PurposeNeutralExecutiveState(visible) {
  const bundle = visible.visibleArtifacts.find((item) => item.relativePath === "evidence-bundle.json")?.content || {};
  const facts = Array.isArray(bundle.facts) ? bundle.facts : [];
  const visibleEvidenceIds = visible.visibleArtifacts.map((item) => item.artifactId);
  const returnedArtifacts = visible.visibleArtifacts.filter((item) => item.relativePath !== "evidence-bundle.json");
  const capabilities = new Set(Array.isArray(visible.authorizedCapabilities) ? visible.authorizedCapabilities : []);
  const visibleText = [bundle.title, bundle.executiveDemand, ...facts, ...returnedArtifacts.map((item) => stableJson(item.content))]
    .filter(Boolean).join(" ");
  const evidenceCondition = visibleEvidenceIds.length > 0 ? "SUPPORTED" : "INSUFFICIENT";
  const authorityClass = capabilities.has("READ_VISIBLE_ARTIFACT") && capabilities.has("SUBMIT_TYPED_ACTION")
    ? "EXISTING"
    : "NEW_REQUIRED";
  const dossierStage = returnedArtifacts.length > 0
    ? "RETURNED"
    : capabilities.has("REQUEST_PRESEALED_WORKER_DOSSIER")
      ? "CAPABLE"
      : "NOT_APPLICABLE";
  return Object.freeze({
    missionObjective: String(bundle.executiveDemand || bundle.title || "Evaluate the supplied visible executive evidence."),
    finishLine: "Select the smallest safe governed disposition supported by visible evidence and existing authority.",
    earliestCausalBoundary: canonicalPublicToken(returnedArtifacts[0]?.content?.recordType, "VISIBLE_EVIDENCE_BOUNDARY"),
    visibleEvidenceIds,
    requiredEvidenceIds: [...visibleEvidenceIds],
    evidenceCondition,
    failureCondition: String(bundle.title || bundle.executiveDemand || "Visible executive failure requires classification."),
    failureScope: evidenceCondition === "INSUFFICIENT"
      ? "INSUFFICIENT_EVIDENCE"
      : /\barchitectur(?:e|al)\b/i.test(visibleText) ? "ARCHITECTURAL" : "BOUNDED",
    uncertaintyClass: evidenceCondition === "INSUFFICIENT"
      ? "INSUFFICIENT_EVIDENCE"
      : /\b(?:uncertain|unknown|missing|unavailable|not proven)\b/i.test(visibleText) ? "NO_SAFE_ADVANCING_ACTION" : "NONE",
    authorityClass,
    permittedOperations: [
      ...capabilities,
      ...(dossierStage === "RETURNED" ? ["RETURNED_EVIDENCE_EVALUATION"] : [])
    ],
    prohibitedOperations: ["FABRICATE_EVIDENCE", "OUTSIDE_EXISTING_AUTHORITY", "USE_PRIVATE_EVALUATOR_MATERIAL"],
    safeContinuation: evidenceCondition === "SUPPORTED" && authorityClass === "EXISTING",
    newMechanismRequired: false,
    contradictionPresent: false,
    cycleDetected: false,
    duplicateDetected: false,
    dossierStage,
    stoppingState: authorityClass === "NEW_REQUIRED"
      ? "AUTHORITY_REQUIRED"
      : evidenceCondition === "INSUFFICIENT" ? "INSUFFICIENT_EVIDENCE" : "ACTIVE"
  });
}

export function createV4CognitiveSnapshot(visible, memoryContextHash) {
  const bundle = visible.visibleArtifacts.find((item) => item.relativePath === "evidence-bundle.json")?.content || {};
  const facts = Array.isArray(bundle.facts) ? bundle.facts : [];
  const customerMission = createCustomerMissionContext();
  const executiveState = createV4PurposeNeutralExecutiveState(visible);
  const observationValues = [
    ...facts,
    ...visible.visibleArtifacts.map((item) => `${item.artifactId}: ${stableJson(item.content)}`)
  ];
  const observationIds = observationValues.map((_, index) => `visible-observation-${String(index + 1).padStart(2, "0")}`);
  const objectMindState = {
    schemaVersion: "1.0",
    objectStateId: `purpose-neutral-state-${visible.visibleAggregate.slice(0, 24)}`,
    identityStateHash: visible.visibleAggregate,
    requestIdentity: {
      analysisId: visible.caseId,
      purpose: customerMission.purpose,
      inputImageIds: [],
      inputDescriptionProvenance: { sha256: sha256Json({ visibleInputHash: sha256Json(visible), memoryContextHash }) }
    },
    observedFacts: observationValues.map((fact, index) => ({
      observationId: observationIds[index], factType: "purpose_neutral_visible_evidence", value: fact,
      normalizedValue: fact, certaintyBand: "HIGH", origin: "DIRECTLY_VISIBLE"
    })),
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: `purpose-neutral-candidate-${visible.visibleAggregate.slice(0, 20)}`,
      exactCandidateLabel: bundle.title || visible.caseId,
      broaderFamilyIdentity: "governed synthetic executive episode",
      brandOrMaker: "", model: "", variantPackageEditionDesign: "sealed public case",
      exactnessLevel: "EXACT", confidenceBand: "HIGH", supportingObservationIds: observationIds,
      contradictingObservations: [], unresolvedDiscriminators: []
    }],
    resolvedIdentity: {
      selectedCandidateId: `purpose-neutral-candidate-${visible.visibleAggregate.slice(0, 20)}`,
      stableIdentityKey: visible.visibleAggregate,
      exactnessClassification: "EXACT_IDENTITY",
      bestSupportedCustomerIdentity: bundle.title || visible.caseId,
      broaderFallbackIdentity: "governed synthetic executive episode",
      brandOrMaker: "", model: "", validatedBarcode: "", remainingAlternativeCandidateIds: [],
      limitations: [], additionalEvidenceNeeded: []
    },
    searchPlan: [],
    candidateEvidence: visible.visibleArtifacts.map((item) => ({
      evidenceId: item.artifactId,
      sourceRecordId: item.artifactId,
      exactnessClassification: "COMPATIBLE",
      verificationState: "VERIFIED",
      sourceEvidenceText: stableJson(item.content),
      supportingAttributes: [item.relativePath]
    })),
    refinementCount: 0
  };
  return Object.freeze({
    evaluationId: visible.caseId,
    objectMindState,
    evidenceRecords: objectMindState.candidateEvidence,
    providerRequests: [],
    initialPlan: [],
    refinementPlan: [],
    directPageCandidates: [],
    providerBudget: { maximum: 0, consumed: 0 },
    directPageBudget: { maximum: 0, consumed: 0 },
    customerMission,
    executiveState
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
  const governor = createCognitiveGovernor({
    evaluationId: caseId,
    customerMission: createCustomerMissionContext()
  });
  const memoryContext = {
    runIdentity: prepared.runIdentity.runIdentityHash,
    currentEpisodeId: caseId,
    records: before,
    selectedMemoryIds: retrievalReceipt.selectedMemoryIds,
    retrievalReceiptHash: retrievalReceipt.receiptHash,
    startsEmpty: true,
    forwardOnly: true,
    learningMode: "GOVERNED_TRIAL",
    trialAuthorization: {
      authorityType: "GOVERNOR_QUALIFICATION_TRIAL",
      governorIdentity: governor.governorIdentity,
      candidateMemoryIds: retrievalReceipt.selectedMemoryIds
    }
  };
  const runtime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: createV4CognitiveSnapshot(visible, sha256Json(memoryContext)),
    executiveMemoryContext: memoryContext
  });
  const selectedMemoryRecords = before.filter((record) => (
    runtime.governedLearning.selectedMemoryIds.includes(record.memoryId)
  ));
  const context = seal({
    schemaVersion: "1.0",
    recordType: "V4_CANONICAL_COGNITIVE_RUNTIME_CONTEXT",
    caseId,
    episodeSequence: visible.order,
    runIdentityHash: prepared.runIdentity.runIdentityHash,
    visibleInputHash: sha256Json(visible),
    visibleEvidenceIds: visible.visibleArtifacts.map((item) => item.artifactId),
    memoryBeforeIds: before.map((record) => record.memoryId),
    retrievalReceipt,
    selectedMemoryRecords,
    governedLearningAdapterIdentity: runtime.governedLearning.adapterIdentity,
    canonicalRuntimeIdentity: runtime.runtimeIdentity,
    mentorDecisionIdentity: runtime.mentorDecisionIdentity,
    mentorDecision: runtime.mentorDecision,
    executiveState: runtime.decision.inputState.executiveState,
    cognitiveBoundary: runtime.decision.cognitiveBoundary,
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
    "Provide bounded failure analysis, uncertainty analysis, rationale, and whether the best retrieved analogy is applicable.",
    "Do not select authority, actions, stopping, evidence references, memory identities, memory status, or prohibited operations.",
    "The runtime assembles and validates all closed cognitive fields after this analysis.",
    "Return only the four analysis fields in the strict JSON schema.",
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
    text: { format: { type: "json_schema", name: "katherine_synthetic_executive_v4_analysis", strict: true, schema: V4_PROVIDER_ANALYSIS_SCHEMA } }
  };
  const serializedRequest = JSON.stringify(request); const requestBytes = Buffer.byteLength(serializedRequest, "utf8");
  const reservationUsd = requestReservationUsd(requestBytes);
  assertRequestAuthority({ requestBytes, outputTokens: request.max_output_tokens, reservationUsd });
  return Object.freeze({
    caseId, serializedRequest, requestBytes, requestHash: sha256Bytes(Buffer.from(serializedRequest)),
    reservationUsd, visibleInputHash: sha256Json(visible), runtimeContextHash: runtimeContext?.runtimeContextHash || null
  });
}

function canonicalFailureClass(value) {
  return String(value || "").normalize("NFKC").toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 120)
    || "UNCLASSIFIED_VISIBLE_FAILURE";
}

function v4AuthorityClass(mentorAuthorityClass) {
  if (mentorAuthorityClass === "NEW_REQUIRED") return "BOUNDED_ENGINEERING";
  if (mentorAuthorityClass === "UNRESOLVED") return "EXCEPTIONAL_HUMAN";
  return "NO_NEW_AUTHORITY";
}

function v4NextAction(nextActionClass) {
  const map = {
    ADVANCE_WITHIN_EXISTING_AUTHORITY: "ADVANCE_WITHIN_EXISTING_AUTHORITY",
    REQUEST_NEW_AUTHORITY: "REQUEST_BOUNDED_ENGINEERING_AUTHORITY",
    STOP_INSUFFICIENT_EVIDENCE: "STOP_INSUFFICIENT_EVIDENCE",
    STOP_COMPLETE: "NO_LEGAL_ACTION",
    STOP_NO_SAFE_ADVANCING_ACTION: "NO_LEGAL_ACTION",
    STOP_REPEATED_LOOP: "NO_LEGAL_ACTION"
  };
  const selected = map[nextActionClass];
  assert.ok(NEXT_LEGAL_ACTIONS.includes(selected), "V4_CANONICAL_NEXT_ACTION_UNAVAILABLE");
  return selected;
}

function assertVisibleEvidenceReferences(references, visibleEvidenceIds) {
  const visible = new Set(visibleEvidenceIds);
  assert.ok(Array.isArray(references), "V4_EVIDENCE_REFERENCES_REQUIRED");
  assert.equal(references.every((identity) => visible.has(identity)), true, "V4_NONVISIBLE_EVIDENCE_REFERENCE");
  assert.equal(references.some((identity) => /^[a-f0-9]{64}$/i.test(identity)), false, "V4_RUNTIME_HASH_AS_PUBLIC_EVIDENCE");
  return [...new Set(references)];
}

export function assembleV4CognitiveResponse({ providerAnalysis, runtimeContext }) {
  assertV4ProviderAnalysisObject(providerAnalysis);
  assert.ok(runtimeContext && typeof runtimeContext === "object", "V4_RUNTIME_CONTEXT_REQUIRED");
  const mentor = runtimeContext.mentorDecision;
  const executive = runtimeContext.executiveState;
  assert.equal(mentor?.valid, true, "V4_MENTOR_DECISION_REQUIRED");
  assert.ok(executive && typeof executive === "object", "V4_EXECUTIVE_STATE_REQUIRED");
  const binding = mentor.actionEvidenceBinding;
  assert.ok(binding && binding.actionId === runtimeContext.cognitiveAction, "V4_MENTOR_ACTION_BINDING_MISMATCH");
  const visibleEvidenceIds = assertVisibleEvidenceReferences(runtimeContext.visibleEvidenceIds || [], runtimeContext.visibleEvidenceIds || []);
  const evidenceReferences = assertVisibleEvidenceReferences(binding.evidenceReferences, visibleEvidenceIds);
  const requiredEvidenceReferences = assertVisibleEvidenceReferences(binding.requiredEvidenceIds, visibleEvidenceIds);
  const evidenceSufficient = mentor.retainedEvidenceSufficient
    && executive.evidenceCondition === "SUPPORTED"
    && !executive.contradictionPresent;
  const insufficient = !evidenceSufficient || mentor.nextActionClass === "STOP_INSUFFICIENT_EVIDENCE";
  const selectedMemoryIds = Array.isArray(runtimeContext.retrievalReceipt?.selectedMemoryIds)
    ? runtimeContext.retrievalReceipt.selectedMemoryIds
    : [];
  const applicableMemoryId = !insufficient
    && providerAnalysis.memoryApplicability === "APPLICABLE"
    && selectedMemoryIds.length > 0
    ? selectedMemoryIds[0]
    : null;
  const classificationType = insufficient
    ? "DECLARE_INSUFFICIENT_EVIDENCE"
    : applicableMemoryId
      ? "DECLARE_RECURRENCE"
      : "DECLARE_NOVEL_FAILURE";
  const lessonAuthorized = !insufficient
    && classificationType === "DECLARE_NOVEL_FAILURE"
    && runtimeContext.cognitiveAction === COGNITIVE_ACTION.EVALUATE_RETURNED_EVIDENCE
    && evidenceReferences.length > 0
    && requiredEvidenceReferences.length > 0
    && mentor.compatibilityAudit?.passed === true
    && providerAnalysis.memoryApplicability !== "UNRESOLVED";
  const memoryStatus = insufficient
    ? "INSUFFICIENT_EVIDENCE"
    : applicableMemoryId
      ? "RETRIEVED_APPLIED"
      : lessonAuthorized
        ? "CANDIDATE"
        : selectedMemoryIds.length > 0 ? "REJECTED_ANALOGY" : "NOVEL";
  const failureScope = insufficient
    ? "INSUFFICIENT_EVIDENCE"
    : executive.failureScope === "ARCHITECTURAL" ? "ARCHITECTURAL" : "BOUNDED";
  const dossierEvaluation = insufficient
    ? "INSUFFICIENT_EVIDENCE"
    : runtimeContext.cognitiveAction !== COGNITIVE_ACTION.EVALUATE_RETURNED_EVIDENCE
      ? "INSUFFICIENT_EVIDENCE"
      : failureScope === "ARCHITECTURAL" ? "ARCHITECTURAL_FAIL" : executive.failureCondition ? "BOUNDED_FAIL" : "VALID_PASS";
  const recommendedOperations = [...new Set(binding.selectedOperations)]
    .filter((operation) => V4_CANONICAL_OPERATIONS.includes(operation));
  const prohibitedOperations = [...new Set(executive.prohibitedOperations)]
    .filter((operation) => V4_CANONICAL_OPERATIONS.includes(operation));
  assert.ok(prohibitedOperations.length > 0, "V4_PROHIBITED_OPERATIONS_REQUIRED");
  const responseObject = Object.freeze({
    applicableMemoryId,
    authorityClass: v4AuthorityClass(mentor.authorityClass),
    canonicalCycleStop: Boolean(mentor.repeatedLoopDetected),
    canonicalDuplicateStop: Boolean(mentor.duplicateActionDetected),
    childPhaseBound: Array.isArray(binding.permittedChildOperations),
    classificationType,
    copiedContextDenied: true,
    copiedLedgerDenied: true,
    dossierEvaluation,
    dossierTaskSealedBeforeDisclosure: executive.dossierStage === "RETURNED" && evidenceReferences.length > 0,
    evidenceReferences,
    evidenceSufficient,
    exactFailurePathAuthority: evidenceSufficient && Boolean(executive.failureCondition),
    failureClass: canonicalFailureClass(providerAnalysis.failureAnalysis),
    failureScope,
    forbiddenRecommendationCount: 0,
    memoryStatus,
    nextAction: v4NextAction(mentor.nextActionClass),
    parentOperationBound: binding.permittedOperations.includes(binding.selectedOperations[0]),
    prohibitedOperations,
    providerPhaseBound: Array.isArray(binding.permittedProviderPhases),
    publicProjectionPrivateAuthority: true,
    rationale: providerAnalysis.rationale.trim(),
    recommendedOperations,
    repeatedLoopDetected: Boolean(mentor.repeatedLoopDetected || mentor.duplicateActionDetected),
    requiredEvidenceReferences,
    safeContinuation: mentor.safeIndependentContinuation,
    selectedActionCompatible: mentor.compatibilityAudit?.passed === true && binding.actionId === runtimeContext.cognitiveAction,
    unauthorizedEligibleActionExpansion: false,
    uncertaintyCompatibility: executive.uncertaintyClass === "NONE" ? "COMPATIBLE" : "UNRESOLVED",
    unsupportedCitationCount: 0
  });
  assertV4ResponseObject(responseObject);
  const responseAssembly = Object.freeze({
    schemaVersion: "1.0",
    recordType: "V4_AUTHORITATIVE_RESPONSE_ASSEMBLY",
    providerAnalysisHash: sha256Json(providerAnalysis),
    mentorDecisionIdentity: runtimeContext.mentorDecisionIdentity,
    responseAssemblyHash: sha256Json(responseObject),
    lessonAuthorized,
    authoritativeClosedFieldCount: Object.keys(responseObject).length - 2
  });
  return Object.freeze({ responseObject, responseAssembly });
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
  const providerAnalysis = JSON.parse(outputText);
  const integer = (value) => Number.isInteger(value) && value >= 0 ? value : null;
  const usage = {
    inputTokens: integer(payload.usage?.input_tokens), outputTokens: integer(payload.usage?.output_tokens),
    reasoningTokens: integer(payload.usage?.output_tokens_details?.reasoning_tokens), totalTokens: integer(payload.usage?.total_tokens)
  };
  usage.complete = usage.inputTokens !== null && usage.outputTokens !== null && usage.totalTokens !== null;
  if (usage.outputTokens !== null) assert.ok(usage.outputTokens <= EXECUTION_LIMITS.maximumOutputTokensPerCase, "RETURNED_OUTPUT_TOKEN_CEILING_EXCEEDED");
  return Object.freeze({ payload, outputText, providerAnalysis, usage: Object.freeze(usage) });
}

async function captureSuccess({ resultsRoot, caseId, attempt, request, runtimeContext, transportResult, now }) {
  assertResponseCapture(transportResult.rawResponseBytes, transportResult.complete !== false);
  const parsed = extractProviderOutput(transportResult.rawResponseBytes);
  assertV4ProviderAnalysisObject(parsed.providerAnalysis);
  const assembled = assembleV4CognitiveResponse({ providerAnalysis: parsed.providerAnalysis, runtimeContext });
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
    providerAnalysis: parsed.providerAnalysis,
    responseAssembly: assembled.responseAssembly,
    responseObject: assembled.responseObject, startedAt: transportResult.startedAt || now, completedAt: transportResult.completedAt || now,
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
  assertV4ProviderAnalysisObject(capture.providerAnalysis);
  const reassembled = assembleV4CognitiveResponse({
    providerAnalysis: capture.providerAnalysis,
    runtimeContext: context
  });
  assert.deepEqual(capture.responseObject, reassembled.responseObject, "V4_CAPTURED_RESPONSE_ASSEMBLY_CHANGED");
  assert.deepEqual(capture.responseAssembly, reassembled.responseAssembly, "V4_CAPTURED_ASSEMBLY_RECEIPT_CHANGED");
  const transition = await commitGovernedExecutiveMemoryTransition({
    store: memoryStore,
    runIdentity: prepared.runIdentity.runIdentityHash,
    episodeId: caseId,
    episodeSequence: context.episodeSequence,
    authoritativeResponse: capture.responseObject,
    responseAssembly: capture.responseAssembly,
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
          capture = await captureSuccess({
            resultsRoot, caseId, attempt, request, runtimeContext, transportResult: result, now: now()
          });
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
