import assert from "node:assert/strict";
import test from "node:test";
import {
  COGNITIVE_ACTION,
  COGNITIVE_BOUNDARY,
  CUSTOMER_INPUT_STATUS,
  SAFETY_STATE,
  buildCognitiveEpisode,
  buildCustomerInputRequest,
  buildGovernorExecutionProof,
  buildLessonCandidate,
  createCognitiveGovernor,
  createCognitiveState,
  decideCognitiveAction,
  deriveSafetyState,
  executeGovernorAuthorizedAction,
  recordCognitiveActionOutcome,
  selectNextCognitiveAction
} from "../lib/cognitive-governor/index.js";
import { sealExperienceRecord } from "../lib/terminal-evidence.js";
import { sha256Object } from "../lib/object-intelligence/stable.js";
import { validateGovernorProof } from "../benchmarks/blind-object-v1-execution-v1/scripts/governor-proof-validator.mjs";
import { createGenerateListingHandler } from "../api/generate-listing.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

function observedFact(factType, value, overrides = {}) {
  return {
    observationId: `observation-${sha256Object([factType, value]).slice(0, 12)}`,
    factType,
    value,
    normalizedValue: String(value).toLowerCase(),
    certaintyBand: "HIGH",
    origin: "DIRECTLY_VISIBLE",
    ...overrides
  };
}

function objectState({
  status = "UNRESOLVED",
  discriminator = "clear maker mark photograph",
  facts = [observedFact("broader_identity", "decorative household object")],
  evidence = []
} = {}) {
  return {
    schemaVersion: "1.0",
    objectStateId: "object-state-executive-synthetic",
    identityStateHash: "a".repeat(64),
    requestIdentity: {
      inputImageIds: ["generic-initial-photo"],
      inputDescriptionProvenance: { sha256: "b".repeat(64) }
    },
    observedFacts: facts,
    observationConflicts: [],
    identityHypotheses: [{
      candidateId: "candidate-executive",
      broaderFamilyIdentity: status === "UNRESOLVED" ? "" : "decorative household object",
      unresolvedDiscriminators: discriminator ? [discriminator] : [],
      exactnessLevel: status,
      confidenceBand: "LOW",
      supportingObservationIds: facts.map((fact) => fact.observationId),
      contradictingObservations: []
    }],
    resolvedIdentity: {
      selectedCandidateId: "candidate-executive",
      stableIdentityKey: "identity-executive",
      exactnessClassification: status,
      bestSupportedCustomerIdentity: status === "UNRESOLVED" ? "" : "decorative household object",
      broaderFallbackIdentity: status === "UNRESOLVED" ? "" : "decorative household object",
      limitations: discriminator ? [discriminator] : [],
      additionalEvidenceNeeded: discriminator ? [discriminator] : []
    },
    searchPlan: [{ query: "decorative household object", phase: "INITIAL" }],
    candidateEvidence: evidence,
    refinementCount: 0
  };
}

function providerRequest(overrides = {}) {
  return {
    query: "decorative household object",
    attempted: true,
    physicalAttemptCount: 1,
    objectMindPhase: "INITIAL",
    providerEndpoint: "serper_search",
    ...overrides
  };
}

function evidence(overrides = {}) {
  return {
    sourceRecordId: "source-executive",
    objectMindSourceId: "source-executive",
    objectMindHypothesisId: "candidate-executive",
    objectMindClassification: "COMPATIBLE_ALTERNATIVE",
    objectMindVerificationState: "COMPATIBLE",
    ...overrides
  };
}

function snapshot(overrides = {}) {
  const currentObjectState = overrides.objectMindState || objectState();
  return {
    evaluationId: "evaluation-executive-synthetic",
    objectMindState: currentObjectState,
    evidenceRecords: overrides.evidenceRecords || currentObjectState.candidateEvidence || [],
    providerRequests: overrides.providerRequests || [providerRequest()],
    initialPlan: currentObjectState.searchPlan,
    refinementPlan: overrides.refinementPlan || [],
    directPageCandidates: overrides.directPageCandidates || [],
    providerBudget: overrides.providerBudget || { maximum: 12, consumed: 12 },
    directPageBudget: overrides.directPageBudget || { maximum: 2, consumed: 2 },
    requestedCustomerInput: overrides.requestedCustomerInput || null,
    actionLedger: overrides.actionLedger || [],
    canonicalEvidenceFinalized: Boolean(overrides.canonicalEvidenceFinalized),
    purposeJudgmentCompleted: Boolean(overrides.purposeJudgmentCompleted),
    reportGenerated: Boolean(overrides.reportGenerated),
    customerOutcome: overrides.customerOutcome || {}
  };
}

function recordRequest(governor, baseSnapshot) {
  const decision = decideCognitiveAction(governor, baseSnapshot, { boundary: COGNITIVE_BOUNDARY.CUSTOMER_INPUT });
  assert.equal(decision.actionType, COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT);
  executeGovernorAuthorizedAction(governor, decision, COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT, {
    operationPhase: "CUSTOMER_INPUT_TRANSITION",
    operation: () => decision.customerInputRequest
  });
  recordCognitiveActionOutcome(governor, decision, baseSnapshot, {
    outcomeCode: "STRUCTURED_CUSTOMER_INPUT_REQUEST_RECORDED"
  });
  return decision;
}

function responseCapture() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

async function runControlledHandler(identity, { reportType = "marketValue", purchaseIntent = "personal_use" } = {}) {
  const trace = { schemas: [], stages: [], networkAttempts: [] };
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "deterministic-openai-placeholder",
    getOpenAIModel: () => "deterministic-test-model",
    getSerperApiKey: () => "deterministic-serper-placeholder",
    createAnalysisId: () => `analysis-executive-${purchaseIntent}`,
    onTerminalStage: (event) => trace.stages.push(`${event.stage}:${event.transition}`),
    requestOpenAIJson: async ({ payload }) => {
      const schemaName = payload?.text?.format?.name;
      trace.schemas.push(schemaName);
      if (schemaName === "item_identity") return { json: identity, data: { output: [] } };
      throw new Error(`Purpose executor must not run for a controlled executive outcome: ${schemaName}`);
    },
    requestSerperSearch: async () => ({ json: { organic: [], shopping: [] }, statusCode: 200, elapsedMs: 1 }),
    requestBoundedRetailProductPage: async () => {
      throw new Error("Direct page must not run without a qualified candidate.");
    }
  });
  const response = responseCapture();
  const guard = installHardNetworkDenial();
  try {
    await handler({
      method: "POST",
      body: {
        reportType,
        platform: reportType === "listing" ? "Synthetic Market" : "",
        notes: "Synthetic policy-only input.",
        photos: [{ name: "synthetic.png", dataUrl: "data:image/png;base64,iVBORw0KGgo=" }],
        ...(reportType === "listing"
          ? { sellerIntake: { purchase_intent: purchaseIntent, buyer_intent: purchaseIntent } }
          : { buyerIntake: { purchase_intent: purchaseIntent, buyer_intent: purchaseIntent } })
      }
    }, response);
  } finally {
    trace.networkAttempts = [...guard.attempts];
    guard.restore();
  }
  return { response, trace };
}

test("specific requested fields use actual fact availability rather than photos, descriptions, or unrelated fields", () => {
  const missing = createCognitiveState(snapshot());
  const request = buildCustomerInputRequest(missing);
  assert.equal(request.requestType, "MAKER_MARK");
  assert.deepEqual(request.requestedFields, ["maker_mark"]);
  assert.equal(missing.customerInputState.status, CUSTOMER_INPUT_STATUS.REQUIRED_NOT_REQUESTED);
  assert.equal(missing.customerInputAvailable, false);
  assert.equal(missing.customerInputState.availableFields.includes("maker_mark"), false);

  const unrelated = createCognitiveState(snapshot({
    objectMindState: objectState({ facts: [
      observedFact("broader_identity", "decorative household object"),
      observedFact("barcode", "012345678905"),
      observedFact("description", "The customer supplied an initial description")
    ] })
  }));
  assert.equal(unrelated.customerInputState.fieldStates[0].available, false);

  const available = createCognitiveState(snapshot({
    objectMindState: objectState({ facts: [observedFact("maker_mark", "Acme foundry stamp")] })
  }));
  assert.equal(available.customerInputState.status, CUSTOMER_INPUT_STATUS.AVAILABLE);
  assert.equal(buildCustomerInputRequest(available), null);
});

test("REQUEST_CUSTOMER_INPUT records one bounded request, becomes pending, and terminates with AWAITING_CUSTOMER_INPUT", () => {
  const base = snapshot();
  const governor = createCognitiveGovernor({ evaluationId: base.evaluationId });
  const requestDecision = recordRequest(governor, base);
  assert.deepEqual(requestDecision.customerInputRequest.requestedFields, ["maker_mark"]);
  assert.equal(governor.actionLedger.at(-1).materialKnowledgeChanged, false);
  assert.equal(governor.lastState.customerInputState.status, CUSTOMER_INPUT_STATUS.PENDING);
  assert.equal(governor.lastState.customerInputState.pendingFields[0], "maker_mark");
  assert.equal(buildCustomerInputRequest(governor.lastState), null, "the same field must not be requested twice");

  const terminal = decideCognitiveAction(governor, base, { boundary: COGNITIVE_BOUNDARY.TERMINAL });
  assert.equal(terminal.actionType, COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE);
  assert(terminal.reasonCodes.includes("AWAITING_CUSTOMER_INPUT"));
  assert.equal(terminal.inputState.executiveReadiness.purposeJudgmentAllowed, false);
  assert.equal(terminal.inputState.executiveReadiness.finalizationEligible, false);
  assert.equal(terminal.inputState.executiveReadiness.stopCompleteEligible, false);

  const optimisticOverride = createCognitiveState({
    ...base,
    customerInputAvailable: true,
    requestedCustomerInput: requestDecision.customerInputRequest,
    actionLedger: governor.actionLedger
  });
  assert.equal(optimisticOverride.customerInputState.status, CUSTOMER_INPUT_STATUS.PENDING);
  assert.equal(optimisticOverride.customerInputAvailable, false);
});

test("a supplied requested field resolves pending state while an unrelated field cannot", () => {
  const requestedCustomerInput = {
    requestType: "MODEL_OR_CATALOG_NUMBER",
    requestedFields: ["model_number"],
    missingDiscriminatorIdentity: "discriminator-model"
  };
  const actionLedger = [{ actionType: COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT }];
  const unrelated = createCognitiveState(snapshot({
    requestedCustomerInput,
    actionLedger,
    objectMindState: objectState({
      discriminator: "model number",
      facts: [
        observedFact("barcode", "012345678905"),
        observedFact("description", "The customer supplied an initial description")
      ]
    })
  }));
  assert.equal(unrelated.customerInputState.status, CUSTOMER_INPUT_STATUS.PENDING);

  const supplied = createCognitiveState(snapshot({
    requestedCustomerInput,
    actionLedger,
    objectMindState: objectState({
      discriminator: "model number",
      facts: [observedFact("model_number", "MODEL-42", { origin: "USER_PROVIDED" })]
    })
  }));
  assert.equal(supplied.customerInputState.status, CUSTOMER_INPUT_STATUS.RESOLVED);
  assert.equal(supplied.customerInputAvailable, true);
});

test("STOP_COMPLETE requires substantive readiness while cautious non-exact support may complete", () => {
  const supportedObject = objectState({
    status: "BROADER_IDENTITY",
    discriminator: "",
    facts: [
      observedFact("broader_identity", "decorative household object"),
      observedFact("material", "cast metal")
    ],
    evidence: [evidence()]
  });
  const base = snapshot({
    objectMindState: supportedObject,
    evidenceRecords: supportedObject.candidateEvidence,
    canonicalEvidenceFinalized: true
  });
  const purposeOnly = createCognitiveState({ ...base, purposeJudgmentCompleted: true });
  assert.equal(purposeOnly.executiveReadiness.stopCompleteEligible, false);
  assert.notEqual(selectNextCognitiveAction(purposeOnly, { boundary: COGNITIVE_BOUNDARY.TERMINAL }).actionType, COGNITIVE_ACTION.STOP_COMPLETE);

  const reportOnly = createCognitiveState({ ...base, reportGenerated: true });
  assert.equal(reportOnly.executiveReadiness.stopCompleteEligible, false);

  const complete = createCognitiveState({
    ...base,
    purposeJudgmentCompleted: true,
    reportGenerated: true,
    customerOutcome: { completedCustomerOutcomePresent: true, limitationsPresent: true }
  });
  const decision = selectNextCognitiveAction(complete, { boundary: COGNITIVE_BOUNDARY.TERMINAL });
  assert.equal(decision.actionType, COGNITIVE_ACTION.STOP_COMPLETE);
  assert(decision.reasonCodes.includes("SUBSTANTIVE_TERMINAL_READINESS"));
  assert.equal(complete.evidenceSufficiency.exactEvidenceAvailable, false);
  assert.equal(complete.evidenceSufficiency.cautiousLimitedPurposeAllowed, false);

  const cautiousObject = objectState({
    status: "BROADER_IDENTITY",
    discriminator: "",
    facts: [
      observedFact("broader_identity", "decorative household object"),
      observedFact("material", "cast metal")
    ]
  });
  const cautious = createCognitiveState(snapshot({
    objectMindState: cautiousObject,
    evidenceRecords: [],
    canonicalEvidenceFinalized: true,
    purposeJudgmentCompleted: true,
    reportGenerated: true,
    customerOutcome: { completedCustomerOutcomePresent: true, limitationsPresent: true }
  }));
  assert.equal(cautious.evidenceSufficiency.cautiousLimitedPurposeAllowed, true);
  assert.equal(selectNextCognitiveAction(cautious, { boundary: COGNITIVE_BOUNDARY.TERMINAL }).actionType, COGNITIVE_ACTION.STOP_COMPLETE);
});

test("insufficient identity with no useful action stops before purpose and finalization is not knowledge gain", () => {
  const insufficient = createCognitiveState(snapshot());
  assert.equal(insufficient.executiveReadiness.stopInsufficientEvidenceEligible, true);
  const stop = selectNextCognitiveAction(insufficient, { boundary: COGNITIVE_BOUNDARY.TERMINAL });
  assert.equal(stop.actionType, COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE);
  assert(stop.reasonCodes.includes("INSUFFICIENT_IDENTITY"));
  assert(stop.reasonCodes.includes("NO_USEFUL_KNOWLEDGE_ACTION_REMAINS"));

  const governor = createCognitiveGovernor({ evaluationId: "evaluation-finalization-material" });
  const supportedObject = objectState({ status: "BROADER_IDENTITY", discriminator: "", facts: [
    observedFact("broader_identity", "decorative household object"),
    observedFact("material", "cast metal")
  ] });
  const finalizationSnapshot = snapshot({ objectMindState: supportedObject });
  const decision = decideCognitiveAction(governor, finalizationSnapshot, { boundary: COGNITIVE_BOUNDARY.FINALIZATION });
  assert.equal(decision.actionType, COGNITIVE_ACTION.FINALIZE_EVIDENCE);
  recordCognitiveActionOutcome(governor, decision, { ...finalizationSnapshot, canonicalEvidenceFinalized: true }, {
    outcomeCode: "CANONICAL_EVIDENCE_FINALIZED"
  });
  assert.equal(governor.actionLedger.at(-1).materialKnowledgeChanged, false);
});

test("a distinct unattempted direct-page candidate remains legal after a no-change candidate", () => {
  const candidates = ["one", "two"].map((suffix) => evidence({
    sourceRecordId: `source-${suffix}`,
    objectMindSourceId: `source-${suffix}`,
    objectMindDirectPageEligible: true,
    sourceEvidenceText: ""
  }));
  const directObject = objectState({ status: "BROADER_IDENTITY", discriminator: "", evidence: candidates });
  const governor = createCognitiveGovernor({ evaluationId: "evaluation-distinct-direct" });
  const base = snapshot({
    objectMindState: directObject,
    evidenceRecords: candidates,
    directPageCandidates: candidates,
    directPageBudget: { maximum: 2, consumed: 0 }
  });
  const first = decideCognitiveAction(governor, base, { boundary: COGNITIVE_BOUNDARY.DIRECT_PAGE });
  recordCognitiveActionOutcome(governor, first, base, { outcomeCode: "DIRECT_PAGE_NO_NEW_FACT" });
  const second = decideCognitiveAction(governor, base, { boundary: COGNITIVE_BOUNDARY.DIRECT_PAGE });
  assert.equal(second.actionType, COGNITIVE_ACTION.VERIFY_DIRECT_PAGE);
  assert.notEqual(second.targetIdentity, first.targetIdentity);
});

test("shared safety projection distinguishes structural danger, unresolved danger, caution, and cosmetic wear", () => {
  const structural = deriveSafetyState([
    observedFact("condition", "Cracked load-bearing frame"),
    observedFact("completeness", "Detached structural support piece")
  ]);
  assert.equal(structural.disposition, SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED);
  assert.equal(structural.hazardClass, "STRUCTURAL");
  assert.match(structural.mandatoryCustomerDisposition, /do not use/i);
  assert.equal(structural.ordinaryPurposeJudgmentBlocked, true);

  const unresolved = deriveSafetyState([
    observedFact("condition", "Possible crack in a load-bearing joint; cannot confirm from the current view")
  ]);
  assert.equal(unresolved.disposition, SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY);
  assert.equal(unresolved.resolutionCustomerFactUseful, true);
  assert.deepEqual(unresolved.requestedFields, ["structural_damage_closeup"]);

  const professional = deriveSafetyState([
    observedFact("condition", "Possible internal structural failure; qualified inspection is required")
  ]);
  assert.equal(professional.disposition, SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY);
  assert.equal(professional.resolutionCustomerFactUseful, false);

  assert.equal(deriveSafetyState([observedFact("condition", "Minor nonstructural chip")]).disposition, SAFETY_STATE.CAUTION_REQUIRED);
  assert.equal(deriveSafetyState([observedFact("condition", "Light cosmetic scuffs and ordinary wear")]).disposition, SAFETY_STATE.NO_BLOCKING_SAFETY_CONDITION);
});

test("critical safety blocks ordinary purpose and only a complete safety-only warning may STOP_COMPLETE", () => {
  const damaged = objectState({
    status: "BROADER_IDENTITY",
    discriminator: "",
    facts: [
      observedFact("broader_identity", "wooden step stool"),
      observedFact("condition", "Cracked load-bearing frame"),
      observedFact("completeness", "Detached structural support piece")
    ]
  });
  const blocked = createCognitiveState(snapshot({
    objectMindState: damaged,
    canonicalEvidenceFinalized: true,
    purposeJudgmentCompleted: true,
    reportGenerated: true
  }));
  assert.equal(blocked.safetyState.disposition, SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED);
  assert.equal(blocked.executiveReadiness.purposeJudgmentAllowed, false);
  assert.equal(blocked.executiveReadiness.stopCompleteEligible, false);

  const safeOutcome = createCognitiveState(snapshot({
    objectMindState: damaged,
    customerOutcome: {
      safetyOnlyOutcomePresent: true,
      mandatorySafetyDispositionPresent: true,
      limitationsPresent: true
    },
    reportGenerated: true
  }));
  const decision = selectNextCognitiveAction(safeOutcome, { boundary: COGNITIVE_BOUNDARY.TERMINAL });
  assert.equal(decision.actionType, COGNITIVE_ACTION.STOP_COMPLETE);
  assert(decision.reasonCodes.includes("SAFETY_ONLY_OUTCOME_COMPLETE"));

  const unresolvedObject = objectState({
    status: "BROADER_IDENTITY",
    discriminator: "",
    facts: [
      observedFact("broader_identity", "load-bearing household object"),
      observedFact("condition", "Possible internal structural failure; qualified inspection is required")
    ]
  });
  const unresolved = createCognitiveState({
    ...snapshot({ objectMindState: unresolvedObject }),
    customerMission: { purpose: "seller_listing" }
  });
  assert.equal(unresolved.safetyState.disposition, SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY);
  assert.equal(unresolved.customerInputState.status, CUSTOMER_INPUT_STATUS.NOT_REQUIRED);
  assert.equal(unresolved.executiveReadiness.purposeJudgmentAllowed, false);
  const unresolvedStop = selectNextCognitiveAction(unresolved, { boundary: COGNITIVE_BOUNDARY.TERMINAL });
  assert.equal(unresolvedStop.actionType, COGNITIVE_ACTION.STOP_INSUFFICIENT_EVIDENCE);
  assert(unresolvedStop.reasonCodes.includes("UNRESOLVED_CRITICAL_SAFETY"));
});

test("pending-input and safety policy are durable and mutation-invalidating through Episode and proof integrity", () => {
  const base = snapshot();
  const governor = createCognitiveGovernor({ evaluationId: base.evaluationId });
  recordRequest(governor, base);
  const terminal = decideCognitiveAction(governor, base, { boundary: COGNITIVE_BOUNDARY.TERMINAL });
  executeGovernorAuthorizedAction(governor, terminal, terminal.actionType, {
    operationPhase: "TERMINAL_STOP_TRANSITION",
    operation: () => ({ terminalStatus: "INSUFFICIENT_EVIDENCE" })
  });
  recordCognitiveActionOutcome(governor, terminal, base, {
    outcomeCode: "EVALUATION_SUSPENDED_AWAITING_CUSTOMER_INPUT",
    terminalStatus: "INSUFFICIENT_EVIDENCE"
  });
  const experienceRecord = sealExperienceRecord({ schemaVersion: "1.0", objectStateId: "object-state-executive-synthetic" });
  const cognitiveEpisode = buildCognitiveEpisode(governor, { experienceRecordHash: experienceRecord.experienceRecordHash });
  const lessonCandidate = buildLessonCandidate(cognitiveEpisode);
  const proof = buildGovernorExecutionProof({
    governor,
    cognitiveEpisode,
    lessonCandidate,
    experienceRecord,
    providerCapacity: governor.lastState.providerCapacity,
    directPageCapacity: governor.lastState.directPageCapacity
  });
  const valid = validateGovernorProof({ proof, cognitiveEpisode, lessonCandidate, experienceRecord });
  assert.equal(valid.passed, true, JSON.stringify(valid.failures));
  assert.deepEqual(cognitiveEpisode.customerInputState.pendingFields, ["maker_mark"]);
  assert(cognitiveEpisode.terminalReasonCodes.includes("AWAITING_CUSTOMER_INPUT"));

  const mutatedInput = structuredClone(cognitiveEpisode);
  mutatedInput.customerInputState.pendingFields = [];
  assert.equal(validateGovernorProof({ proof, cognitiveEpisode: mutatedInput, lessonCandidate, experienceRecord }).passed, false);

  const mutatedSafety = structuredClone(cognitiveEpisode);
  mutatedSafety.safetyState.disposition = SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED;
  assert.equal(validateGovernorProof({ proof, cognitiveEpisode: mutatedSafety, lessonCandidate, experienceRecord }).passed, false);
});

test("the real handler emits a structured non-502 suspended request and never enters finalization or purpose judgment", async () => {
  const identity = {
    subjectIdentity: "Unknown",
    subjectConfidence: "Low",
    exactProductIdentity: "",
    exactProductConfidence: "Low",
    additionalEvidenceNeeded: ["clear maker mark photograph"],
    identityUnknowns: ["clear maker mark photograph"],
    identityHypotheses: [{
      broaderFamilyIdentity: "",
      unresolvedDiscriminators: ["clear maker mark photograph"],
      exactnessLevel: "UNRESOLVED",
      confidenceBand: "LOW"
    }],
    visualRecognition: {
      visualSubject: "Unknown",
      visualSubjectConfidence: "Low",
      visibleWords: [],
      distinctiveFeatures: [],
      stillUnknown: ["clear maker mark photograph"]
    }
  };
  const { response, trace } = await runControlledHandler(identity);
  assert.equal(response.statusCode, 200);
  assert.equal(trace.networkAttempts.length, 0);
  assert.deepEqual(trace.schemas, ["item_identity"]);
  const report = response.payload.valuation;
  assert.equal(report.analysisStatus, "AWAITING_CUSTOMER_INPUT");
  assert.equal(report.requestedPurposeComplete, false);
  assert.deepEqual(report.executiveOutcome.requestedFields, ["maker_mark"]);
  assert.match(report.executiveOutcome.customerInputRequest.requestedDetail, /maker|stamp|logo|signature/i);
  assert.equal(report.executiveOutcome.completedPurposeReportEmitted, false);
  assert.equal(Object.hasOwn(report, "suggestedListingPrice"), false);
  assert.equal(Object.hasOwn(report, "recommendation"), false);
  assert.equal(trace.stages.some((stage) => stage.startsWith("CANONICAL_EVIDENCE_FINALIZATION:")), false);
  assert.equal(trace.stages.some((stage) => stage.startsWith("PURPOSE_JUDGMENT:")), false);
  const cognitive = report.searchDiagnostics.cognitiveGovernor;
  assert.equal(cognitive.terminalStatus, "INSUFFICIENT_EVIDENCE");
  assert.equal(cognitive.executionSuspended, true);
  assert.deepEqual(cognitive.customerInputState.pendingFields, ["maker_mark"]);
  assert(cognitive.terminalReasonCodes.includes("AWAITING_CUSTOMER_INPUT"));
  assert.equal(cognitive.cognitiveEpisode.actionDecisions.some((entry) => entry.actionType === "FINALIZE_EVIDENCE"), false);
  assert.equal(cognitive.cognitiveEpisode.actionDecisions.some((entry) => entry.actionType === "PROCEED_TO_PURPOSE_JUDGMENT"), false);
  assert.equal(cognitive.cognitiveEpisode.actionDecisions.some((entry) => entry.actionType === "STOP_COMPLETE"), false);
});

test("the real handler converts confirmed structural danger into a safety-only outcome without ordinary listing support", async () => {
  const identity = {
    subjectIdentity: "Wooden step stool",
    subjectConfidence: "High",
    exactProductIdentity: "Wooden step stool",
    exactProductConfidence: "Medium",
    condition: "Cracked load-bearing frame",
    completeness: "Detached structural support piece",
    material: "wood",
    shape: "step stool",
    additionalEvidenceNeeded: [],
    identityUnknowns: [],
    visualRecognition: {
      visualSubject: "Wooden step stool",
      visualSubjectConfidence: "High",
      visibleWords: [],
      distinctiveFeatures: ["cracked load-bearing frame", "detached structural support piece"],
      stillUnknown: []
    }
  };
  const { response, trace } = await runControlledHandler(identity, {
    reportType: "listing",
    purchaseIntent: "seller_listing"
  });
  assert.equal(response.statusCode, 200);
  assert.equal(trace.networkAttempts.length, 0);
  assert.deepEqual(trace.schemas, ["item_identity"]);
  const report = response.payload.listing;
  assert.equal(report.analysisStatus, "SAFETY_ONLY_COMPLETE");
  assert.equal(report.requestedPurposeComplete, false);
  assert.equal(report.safetyOutcomeComplete, true);
  assert.match(report.description, /do not use|remove.*service/i);
  assert.equal(Object.hasOwn(report, "optimizedListingTitle"), false);
  assert.equal(Object.hasOwn(report, "recommendedListingPrice"), false);
  assert.equal(Object.hasOwn(report, "suggestedOfferRange"), false);
  assert.equal(trace.stages.some((stage) => stage.startsWith("CANONICAL_EVIDENCE_FINALIZATION:")), false);
  assert.equal(trace.stages.some((stage) => stage.startsWith("PURPOSE_JUDGMENT:")), false);
  const cognitive = report.searchDiagnostics.cognitiveGovernor;
  assert.equal(cognitive.safetyState.disposition, "REMOVE_FROM_SERVICE_REQUIRED");
  assert.equal(cognitive.purposeJudgmentRan, false);
  assert.equal(cognitive.terminalStatus, "COMPLETE");
  assert(cognitive.terminalReasonCodes.includes("SAFETY_ONLY_OUTCOME_COMPLETE"));
  assert.equal(cognitive.cognitiveEpisode.actionDecisions.some((entry) => entry.actionType === "PROCEED_TO_PURPOSE_JUDGMENT"), false);
});
