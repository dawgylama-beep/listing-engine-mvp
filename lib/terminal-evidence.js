import {
  cleanObjectText,
  sanitizeStructuredRecord,
  sha256Object,
  stableInternalId,
  stableObjectJson
} from "./object-intelligence/stable.js";

export const TERMINAL_CONTEXT_SCHEMA_VERSION = "1.0";
export const FAILURE_ENVELOPE_SCHEMA_VERSION = "1.0";
export const MAX_FAILURE_ENVELOPE_BYTES = 32768;
export const MAX_ATTESTED_EXPERIENCE_RECORD_BYTES = 65536;

export const TERMINAL_STAGE = Object.freeze({
  REQUEST_ACCEPTED: "REQUEST_ACCEPTED",
  INPUT_VALIDATION: "INPUT_VALIDATION",
  OBJECT_OBSERVATION: "OBJECT_OBSERVATION",
  IDENTITY_FORMATION: "IDENTITY_FORMATION",
  GOVERNOR_CONSTRUCTION: "GOVERNOR_CONSTRUCTION",
  AUTHORITATIVE_STATE_INITIALIZATION: "AUTHORITATIVE_STATE_INITIALIZATION",
  INITIAL_ACQUISITION: "INITIAL_ACQUISITION",
  REFINEMENT: "REFINEMENT",
  DIRECT_PAGE_VERIFICATION: "DIRECT_PAGE_VERIFICATION",
  CUSTOMER_INPUT_TRANSITION: "CUSTOMER_INPUT_TRANSITION",
  CANONICAL_EVIDENCE_FINALIZATION: "CANONICAL_EVIDENCE_FINALIZATION",
  PURPOSE_JUDGMENT: "PURPOSE_JUDGMENT",
  EXPERIENCE_RECORD_SEALING: "EXPERIENCE_RECORD_SEALING",
  COGNITIVE_EPISODE_PROOF: "COGNITIVE_EPISODE_PROOF",
  RESPONSE_EMISSION: "RESPONSE_EMISSION"
});

export const TERMINAL_TRANSITION = Object.freeze({
  STARTED: "STARTED",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED"
});

const STAGES = new Set(Object.values(TERMINAL_STAGE));
const TRANSITIONS = new Set(Object.values(TERMINAL_TRANSITION));

function canonicalByteLength(value) {
  return Buffer.byteLength(stableObjectJson(value), "utf8");
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

export function experienceRecordHashPreimage(experienceRecord = {}) {
  return JSON.parse(stableObjectJson({ ...experienceRecord, experienceRecordHash: "" }));
}

export function calculateExperienceRecordHash(experienceRecord = {}) {
  return sha256Object(experienceRecordHashPreimage(experienceRecord));
}

export function experienceRecordHashPreimageByteLength(experienceRecord = {}) {
  return canonicalByteLength(experienceRecordHashPreimage(experienceRecord));
}

export function emittedExperienceRecordByteLength(experienceRecord = {}) {
  return canonicalByteLength(experienceRecord);
}

function boundedExperienceProjection(experienceRecord = {}, level = 0) {
  if (!level) return experienceRecordHashPreimage(experienceRecord);
  const arrayLimit = level === 1 ? 16 : level === 2 ? 8 : 4;
  const evidenceLimit = level === 1 ? 8 : level === 2 ? 4 : 2;
  const projection = experienceRecordHashPreimage(experienceRecord);
  for (const field of ["queriesAttempted", "queryOwnership", "sourceAcquisitionDispositions"]) {
    if (Array.isArray(projection[field])) projection[field] = projection[field].slice(0, arrayLimit);
  }
  for (const field of [
    "observationSummary",
    "identityHypothesesConsidered",
    "sourcesFound",
    "sourcesAccepted",
    "sourcesRejected",
    "exactEvidenceRecovered",
    "rejectionReasons",
    "evidenceGaps",
    "additionalEvidenceNeeded"
  ]) {
    if (Array.isArray(projection[field])) projection[field] = projection[field].slice(0, evidenceLimit);
  }
  return projection;
}

export function sealExperienceRecord(experienceRecord = {}) {
  for (let level = 0; level <= 3; level += 1) {
    const exactProjection = boundedExperienceProjection(experienceRecord, level);
    exactProjection.experienceRecordHash = calculateExperienceRecordHash(exactProjection);
    const sealed = JSON.parse(stableObjectJson(exactProjection));
    if (emittedExperienceRecordByteLength(sealed) <= MAX_ATTESTED_EXPERIENCE_RECORD_BYTES) {
      return deepFreeze(sealed);
    }
  }
  throw Object.assign(new Error("Experience Record exceeded its canonical emitted-record byte ceiling."), {
    code: "EXPERIENCE_RECORD_SIZE_LIMIT",
    terminalSafeMessage: "The final Experience Record exceeded its bounded byte ceiling."
  });
}

export function validateFinalExperienceAttestation({
  experienceRecord,
  cognitiveEpisode,
  governorProof
} = {}) {
  const storedHash = cleanObjectText(experienceRecord?.experienceRecordHash, 80);
  const recalculatedHash = experienceRecord ? calculateExperienceRecordHash(experienceRecord) : "";
  const hashPreimageByteSize = experienceRecord ? experienceRecordHashPreimageByteLength(experienceRecord) : 0;
  const emittedByteSize = experienceRecord ? emittedExperienceRecordByteLength(experienceRecord) : 0;
  const episodeLinkedHash = cleanObjectText(cognitiveEpisode?.linkedExperienceRecordHash, 80);
  const proofStoredHash = cleanObjectText(governorProof?.experienceRecord?.storedHash, 80);
  const proofByteSize = Number(governorProof?.experienceRecord?.canonicalByteSize || 0);
  const proofMaximum = Number(governorProof?.experienceRecord?.maximumByteSize || 0);
  const proofCeilingBytes = Number(governorProof?.ceilings?.experienceRecord?.consumedBytes || 0);
  const proofCeilingMaximum = Number(governorProof?.ceilings?.experienceRecord?.maximumBytes || 0);
  const proofRecalculatedHash = governorProof ? sha256Object({ ...governorProof, proofHash: "" }) : "";
  const mismatches = [];
  if (!experienceRecord) mismatches.push("EXPERIENCE_RECORD_MISSING");
  if (!storedHash || storedHash !== recalculatedHash) mismatches.push("EXPERIENCE_HASH_MISMATCH");
  if (emittedByteSize > MAX_ATTESTED_EXPERIENCE_RECORD_BYTES) mismatches.push("EXPERIENCE_SIZE_LIMIT_EXCEEDED");
  if (!episodeLinkedHash || episodeLinkedHash !== storedHash) mismatches.push("EPISODE_EXPERIENCE_LINK_MISMATCH");
  if (!governorProof) mismatches.push("GOVERNOR_PROOF_MISSING");
  if (!proofStoredHash || proofStoredHash !== storedHash) mismatches.push("PROOF_EXPERIENCE_HASH_MISMATCH");
  if (proofByteSize !== emittedByteSize) mismatches.push("PROOF_EXPERIENCE_SIZE_MISMATCH");
  if (proofMaximum !== MAX_ATTESTED_EXPERIENCE_RECORD_BYTES) mismatches.push("PROOF_EXPERIENCE_MAXIMUM_MISMATCH");
  if (proofCeilingBytes !== emittedByteSize) mismatches.push("PROOF_EXPERIENCE_CEILING_SIZE_MISMATCH");
  if (proofCeilingMaximum !== MAX_ATTESTED_EXPERIENCE_RECORD_BYTES) mismatches.push("PROOF_EXPERIENCE_CEILING_MAXIMUM_MISMATCH");
  if (governorProof?.experienceRecord?.sizeCompliant !== (emittedByteSize <= MAX_ATTESTED_EXPERIENCE_RECORD_BYTES)) {
    mismatches.push("PROOF_EXPERIENCE_SIZE_DISPOSITION_MISMATCH");
  }
  if (governorProof?.ceilings?.experienceRecord?.compliant !== (emittedByteSize <= MAX_ATTESTED_EXPERIENCE_RECORD_BYTES)) {
    mismatches.push("PROOF_EXPERIENCE_CEILING_DISPOSITION_MISMATCH");
  }
  if (!governorProof?.proofHash || governorProof.proofHash !== proofRecalculatedHash) mismatches.push("GOVERNOR_PROOF_HASH_MISMATCH");
  return {
    valid: mismatches.length === 0,
    mismatches,
    storedHash,
    recalculatedHash,
    hashPreimageByteSize,
    emittedByteSize,
    maximumEmittedByteSize: MAX_ATTESTED_EXPERIENCE_RECORD_BYTES,
    episodeLinkedHash,
    proofStoredHash,
    proofByteSize,
    proofCeilingBytes,
    proofHash: cleanObjectText(governorProof?.proofHash, 80),
    proofRecalculatedHash
  };
}

export function assertFinalExperienceAttestation(args = {}) {
  const diagnostics = validateFinalExperienceAttestation(args);
  if (!diagnostics.valid) {
    throw Object.assign(new Error("Final Experience attestation mismatch."), {
      code: "EXPERIENCE_ATTESTATION_MISMATCH",
      attestationDiagnostics: diagnostics
    });
  }
  return diagnostics;
}

function terminalEvaluationIdentity(evaluationId = "") {
  return stableInternalId("governed-evaluation", cleanObjectText(evaluationId, 120), 20);
}

function boundedMetadata(metadata = {}) {
  return sanitizeStructuredRecord(metadata, {
    maximumDepth: 2,
    maximumArrayItems: 6,
    maximumTextCharacters: 120
  });
}

function eventProjection(event = {}) {
  return {
    schemaVersion: TERMINAL_CONTEXT_SCHEMA_VERSION,
    evaluationIdentity: cleanObjectText(event.evaluationIdentity, 100),
    sequence: Number(event.sequence || 0),
    stage: cleanObjectText(event.stage, 80),
    transition: cleanObjectText(event.transition, 20),
    metadata: boundedMetadata(event.metadata)
  };
}

export function calculateTerminalStageEventIdentity(event = {}) {
  return sha256Object(eventProjection(event));
}

export function createEvaluationTerminalContext({ evaluationId = "" } = {}) {
  const context = {
    schemaVersion: TERMINAL_CONTEXT_SCHEMA_VERSION,
    evaluationIdentity: terminalEvaluationIdentity(evaluationId),
    stageEvents: [],
    currentStage: "",
    lastEnteredStage: "",
    lastCompletedStage: "",
    failedStage: "",
    flags: {
      objectObservationBegan: false,
      objectObservationCompleted: false,
      identityFormationBegan: false,
      identityFormationCompleted: false,
      governorConstructionReached: false,
      authoritativeStateReached: false,
      controlledAcquisitionBegan: false,
      finalizationBegan: false,
      finalizationCompleted: false,
      purposeJudgmentBegan: false,
      purposeJudgmentCompleted: false,
      experienceSealingBegan: false,
      experienceSealingCompleted: false,
      responseEmissionBegan: false
    },
    terminalOutcome: "IN_PROGRESS"
  };
  Object.defineProperties(context, {
    evaluationId: { value: cleanObjectText(evaluationId, 120), enumerable: false },
    activeStages: { value: [], enumerable: false },
    governor: { value: null, writable: true, enumerable: false },
    providerRecordCollections: { value: [], enumerable: false }
  });
  return context;
}

function updateFlags(context, stage, transition) {
  const began = transition === TERMINAL_TRANSITION.STARTED;
  const completed = transition === TERMINAL_TRANSITION.COMPLETED;
  if (stage === TERMINAL_STAGE.OBJECT_OBSERVATION) {
    if (began) context.flags.objectObservationBegan = true;
    if (completed) context.flags.objectObservationCompleted = true;
  } else if (stage === TERMINAL_STAGE.IDENTITY_FORMATION) {
    if (began) context.flags.identityFormationBegan = true;
    if (completed) context.flags.identityFormationCompleted = true;
  } else if (stage === TERMINAL_STAGE.GOVERNOR_CONSTRUCTION && completed) {
    context.flags.governorConstructionReached = true;
  } else if (stage === TERMINAL_STAGE.AUTHORITATIVE_STATE_INITIALIZATION && completed) {
    context.flags.authoritativeStateReached = true;
  } else if (stage === TERMINAL_STAGE.INITIAL_ACQUISITION && began) {
    context.flags.controlledAcquisitionBegan = true;
  } else if (stage === TERMINAL_STAGE.CANONICAL_EVIDENCE_FINALIZATION) {
    if (began) context.flags.finalizationBegan = true;
    if (completed) context.flags.finalizationCompleted = true;
  } else if (stage === TERMINAL_STAGE.PURPOSE_JUDGMENT) {
    if (began) context.flags.purposeJudgmentBegan = true;
    if (completed) context.flags.purposeJudgmentCompleted = true;
  } else if (stage === TERMINAL_STAGE.EXPERIENCE_RECORD_SEALING) {
    if (began) context.flags.experienceSealingBegan = true;
    if (completed) context.flags.experienceSealingCompleted = true;
  } else if (stage === TERMINAL_STAGE.RESPONSE_EMISSION && began) {
    context.flags.responseEmissionBegan = true;
  }
}

export function recordTerminalStage(context, stage, transition, metadata = {}) {
  if (!context || context.schemaVersion !== TERMINAL_CONTEXT_SCHEMA_VERSION) {
    throw Object.assign(new Error("Evaluation terminal context is missing."), { code: "TERMINAL_CONTEXT_MISSING" });
  }
  if (!STAGES.has(stage) || !TRANSITIONS.has(transition)) {
    throw Object.assign(new Error("Evaluation terminal stage transition is invalid."), { code: "TERMINAL_STAGE_INVALID" });
  }
  const event = {
    ...eventProjection({
      evaluationIdentity: context.evaluationIdentity,
      sequence: context.stageEvents.length + 1,
      stage,
      transition,
      metadata
    }),
    eventIdentity: ""
  };
  event.eventIdentity = calculateTerminalStageEventIdentity(event);
  context.stageEvents.push(event);
  context.lastEnteredStage = stage;
  if (transition === TERMINAL_TRANSITION.STARTED) {
    context.activeStages.push(stage);
  } else {
    const index = context.activeStages.lastIndexOf(stage);
    if (index >= 0) context.activeStages.splice(index, 1);
    if (transition === TERMINAL_TRANSITION.COMPLETED) context.lastCompletedStage = stage;
    if (transition === TERMINAL_TRANSITION.FAILED) context.failedStage = stage;
  }
  context.currentStage = context.activeStages.at(-1) || "";
  updateFlags(context, stage, transition);
  return event;
}

export function failCurrentTerminalStage(context, metadata = {}) {
  const activeStage = context?.currentStage || "";
  const stage = activeStage || context?.lastEnteredStage || TERMINAL_STAGE.REQUEST_ACCEPTED;
  if (!context?.failedStage && activeStage) {
    recordTerminalStage(context, activeStage, TERMINAL_TRANSITION.FAILED, metadata);
  } else if (!context?.failedStage) {
    context.failedStage = stage;
  }
  context.terminalOutcome = "FAILED";
  return stage;
}

export function completeTerminalContext(context) {
  context.terminalOutcome = "SUCCEEDED";
  return context;
}

export function attachTerminalGovernor(context, governor) {
  if (context) context.governor = governor || null;
  return governor;
}

export function attachTerminalProviderRecords(context, providerRecords = []) {
  if (context && Array.isArray(providerRecords) && !context.providerRecordCollections.includes(providerRecords)) {
    context.providerRecordCollections.push(providerRecords);
  }
  return providerRecords;
}

function ledgerProjection(governor) {
  const ledger = governor?.executionLedger;
  if (!ledger) return null;
  const projectLifecycle = (event) => ({
    sequence: Number(event.sequence || 0),
    eventType: cleanObjectText(event.eventType, 100),
    lifecycleEventIdentity: cleanObjectText(event.lifecycleEventIdentity, 80)
  });
  const projectDecision = (decision) => ({
    sequence: Number(decision.sequence || 0),
    actionType: cleanObjectText(decision.actionType, 80),
    actionSignature: cleanObjectText(decision.actionSignature, 100),
    executionPermitted: decision.executionPermitted !== false,
    outcomeCode: cleanObjectText(decision.outcomeCode, 80),
    decisionIdentity: cleanObjectText(decision.decisionIdentity, 80)
  });
  const projectExecution = (execution) => ({
    sequence: Number(execution.sequence || 0),
    operationKind: cleanObjectText(execution.operationKind, 40),
    operationPhase: cleanObjectText(execution.operationPhase, 100),
    actionType: cleanObjectText(execution.actionType, 80),
    actionSignature: cleanObjectText(execution.actionSignature, 100),
    executionEventIdentity: cleanObjectText(execution.executionEventIdentity, 80),
    status: cleanObjectText(execution.status, 40),
    errorCode: cleanObjectText(execution.errorCode, 100)
  });
  const lastState = governor.lastState || {};
  return {
    classification: "PARTIAL_OR_FAILED",
    schemaVersion: cleanObjectText(ledger.schemaVersion, 20),
    evaluationIdentity: cleanObjectText(ledger.evaluationIdentity, 100),
    lifecycleEvents: (ledger.lifecycleEvents || []).slice(-12).map(projectLifecycle),
    selectedDecisions: (ledger.decisionInvocations || []).slice(-12).map(projectDecision),
    controlledExecutions: (ledger.controlledExecutionEvents || []).slice(-12).map(projectExecution),
    unauthorizedExecutionAttemptCount: Number(ledger.unauthorizedExecutionAttempts?.length || 0),
    cognitiveStateSnapshotCount: Number(ledger.cognitiveStateSnapshotCount || 0),
    providerCapacity: {
      maximum: Number(lastState.providerCapacity?.maximum || 0),
      consumed: Number(lastState.providerCapacity?.consumed || 0)
    },
    directPageCapacity: {
      maximum: Number(lastState.directPageCapacity?.maximum || 0),
      consumed: Number(lastState.directPageCapacity?.consumed || 0)
    }
  };
}

function providerRecords(context) {
  const selected = [];
  const seen = new Set();
  for (const collection of context?.providerRecordCollections || []) {
    for (const record of collection || []) {
      if (!record || seen.has(record)) continue;
      seen.add(record);
      selected.push(record);
    }
  }
  return selected;
}

function providerProjection(record = {}) {
  return {
    evaluationIdentity: cleanObjectText(record.evaluationIdentity, 100),
    provider: cleanObjectText(record.providerKey || record.provider || record.providerEndpoint, 80),
    providerPhase: cleanObjectText(record.providerOperationPhase || record.objectMindPhase || record.searchPass, 100),
    governorScopeClassification: cleanObjectText(record.governorScopeClassification, 40),
    parentGovernorActionSignature: cleanObjectText(record.parentGovernorActionSignature, 100),
    controlledExecutionEventIdentity: cleanObjectText(record.controlledExecutionEventIdentity, 80),
    logicalProviderRequestIdentity: cleanObjectText(record.logicalProviderRequestIdentity, 80),
    logicalQueryAttempted: Boolean(record.logicalQueryAttempted ?? record.attempted),
    physicalAttemptCount: Number(record.physicalAttemptCount || 0),
    physicalRetryAttemptCount: Number(record.physicalRetryAttemptCount || 0),
    physicalAttempts: (record.physicalAttempts || []).slice(-2).map((attempt) => ({
      attempt: Number(attempt.attempt || 0),
      retry: Boolean(attempt.retry),
      provider: cleanObjectText(attempt.provider, 80),
      outcome: cleanObjectText(attempt.outcome, 40)
    })),
    succeeded: Boolean(record.succeeded),
    statusCode: Number(record.statusCode || 0) || null,
    errorCategory: cleanObjectText(record.errorCode || record.failureStage, 100),
    retryEligible: Number(record.physicalRetryAttemptCount || 0) < 1,
    retryConsumed: Number(record.physicalRetryAttemptCount || 0)
  };
}

function sanitizeErrorIdentity(error = {}) {
  const rawCode = error.code || error.clientSafeCode || error.openAIErrorCode || "EVALUATION_OPERATION_FAILED";
  const normalizedCode = cleanObjectText(rawCode, 100).replace(/[^A-Za-z0-9_.-]+/g, "_").toUpperCase();
  const internalCode = normalizedCode || "EVALUATION_OPERATION_FAILED";
  let category = "INTERNAL_EVALUATION_ERROR";
  if (internalCode.startsWith("EXPERIENCE_")) category = "EXPERIENCE_INTEGRITY";
  else if (error.clientSafeCode) category = "CLIENT_INPUT_REJECTED";
  else if (error.identityConfirmationRequired) category = "IDENTITY_CONFIRMATION_REQUIRED";
  else if (error.openAIErrorCode || error.openAIErrorType || error.statusCode) category = "PROVIDER_FAILURE";
  else if (/GOVERNOR|AUTHORIZATION/.test(internalCode) || /^Governor authorization/.test(String(error.message || ""))) category = "GOVERNOR_AUTHORIZATION_FAILURE";
  const messageByCategory = {
    EXPERIENCE_INTEGRITY: "Final Experience attestation did not match the response-bound record.",
    CLIENT_INPUT_REJECTED: "The analysis input was rejected by a bounded validation rule.",
    IDENTITY_CONFIRMATION_REQUIRED: "Identity confirmation is required before evaluation can continue.",
    PROVIDER_FAILURE: "A provider operation failed before evaluation could complete.",
    GOVERNOR_AUTHORIZATION_FAILURE: "A controlled operation did not satisfy Governor authorization.",
    INTERNAL_EVALUATION_ERROR: "An internal evaluation operation failed before completion."
  };
  return {
    internalCode,
    errorCategory: category,
    exceptionName: cleanObjectText(error.name || "Error", 80).replace(/[^A-Za-z0-9_.-]+/g, "_") || "Error",
    sanitizedMessage: messageByCategory[category]
  };
}

function attestationProjection(error = {}) {
  const details = error.attestationDiagnostics;
  if (!details || typeof details !== "object") return null;
  return sanitizeStructuredRecord(details, {
    maximumDepth: 3,
    maximumArrayItems: 12,
    maximumTextCharacters: 100
  });
}

function finishEnvelopeIntegrity(envelope) {
  envelope.envelopeHash = "0".repeat(64);
  let prior = -1;
  for (let pass = 0; pass < 8 && envelope.canonicalByteSize !== prior; pass += 1) {
    prior = envelope.canonicalByteSize;
    envelope.canonicalByteSize = canonicalByteLength(envelope);
  }
  envelope.envelopeHash = sha256Object({ ...envelope, envelopeHash: "" });
  envelope.canonicalByteSize = canonicalByteLength(envelope);
  return envelope;
}

export function buildFailureEnvelope(context, error, { httpStatus = 502 } = {}) {
  failCurrentTerminalStage(context, { errorCode: error?.code || error?.clientSafeCode || error?.name || "ERROR" });
  const errorIdentity = sanitizeErrorIdentity(error);
  const rawProviderRecords = providerRecords(context);
  const projectedProviders = rawProviderRecords.slice(-16).map(providerProjection);
  const partialGovernorLedger = ledgerProjection(context?.governor);
  const lastExecution = partialGovernorLedger?.controlledExecutions?.at(-1) || null;
  const lastDecision = partialGovernorLedger?.selectedDecisions?.at(-1) || null;
  const logicalProviderRequestCount = projectedProviders.filter((record) => record.logicalQueryAttempted).length;
  const physicalProviderAttemptCount = projectedProviders.reduce((total, record) => total + record.physicalAttemptCount, 0);
  const stableFingerprintFields = {
    internalCode: errorIdentity.internalCode,
    errorCategory: errorIdentity.errorCategory,
    exceptionName: errorIdentity.exceptionName,
    stageAtFailure: context?.failedStage || context?.lastEnteredStage || "",
    lastCompletedStage: context?.lastCompletedStage || "",
    governorReached: Boolean(context?.flags.governorConstructionReached),
    authoritativeStateReached: Boolean(context?.flags.authoritativeStateReached),
    logicalProviderRequestCount,
    physicalProviderAttemptCount,
    providerErrorCategories: projectedProviders.map((record) => record.errorCategory).filter(Boolean)
  };
  const envelope = {
    schemaVersion: FAILURE_ENVELOPE_SCHEMA_VERSION,
    terminalContextSchemaVersion: TERMINAL_CONTEXT_SCHEMA_VERSION,
    evaluationIdentity: cleanObjectText(context?.evaluationIdentity, 100),
    httpStatus: Number(httpStatus || 502),
    ...errorIdentity,
    stageAtFailure: context?.failedStage || context?.lastEnteredStage || "",
    lastCompletedStage: context?.lastCompletedStage || "",
    governorReached: Boolean(context?.flags.governorConstructionReached),
    authoritativeStateReached: Boolean(context?.flags.authoritativeStateReached),
    controlledOperationActive: Boolean(lastExecution?.status === "STARTED"),
    logicalProviderRequestBegan: logicalProviderRequestCount > 0,
    physicalProviderAttemptBegan: physicalProviderAttemptCount > 0,
    logicalProviderRequestCount,
    physicalProviderAttemptCount,
    providerStatusCategories: [...new Set(projectedProviders.flatMap((record) => [
      record.succeeded ? "SUCCEEDED" : record.physicalAttemptCount ? "FAILED_OR_INCOMPLETE" : "NOT_ATTEMPTED",
      record.errorCategory
    ]).filter(Boolean))].slice(0, 16),
    activeControlledActionSignature: cleanObjectText(lastExecution?.actionSignature || lastDecision?.actionSignature, 100),
    activeControlledExecutionEventIdentity: cleanObjectText(lastExecution?.executionEventIdentity, 80),
    partialGovernorLedgerPresent: Boolean(partialGovernorLedger),
    partialProviderRecordsPresent: projectedProviders.length > 0,
    terminalOutcome: "FAILED",
    progress: {
      currentStage: context?.currentStage || "",
      lastEnteredStage: context?.lastEnteredStage || "",
      lastCompletedStage: context?.lastCompletedStage || "",
      flags: { ...(context?.flags || {}) },
      stageEvents: (context?.stageEvents || []).slice(-48).map((event) => ({ ...event }))
    },
    partialGovernorLedger,
    partialProviderRecords: projectedProviders,
    attestation: attestationProjection(error),
    errorFingerprint: sha256Object(stableFingerprintFields),
    maximumEnvelopeBytes: MAX_FAILURE_ENVELOPE_BYTES,
    canonicalByteSize: 0,
    envelopeHash: ""
  };
  finishEnvelopeIntegrity(envelope);
  if (envelope.canonicalByteSize > MAX_FAILURE_ENVELOPE_BYTES) {
    envelope.progress.stageEvents = envelope.progress.stageEvents.slice(-16);
    envelope.partialGovernorLedger = partialGovernorLedger ? {
      ...partialGovernorLedger,
      lifecycleEvents: partialGovernorLedger.lifecycleEvents.slice(-4),
      selectedDecisions: partialGovernorLedger.selectedDecisions.slice(-4),
      controlledExecutions: partialGovernorLedger.controlledExecutions.slice(-4)
    } : null;
    envelope.partialProviderRecords = projectedProviders.slice(-6);
    finishEnvelopeIntegrity(envelope);
  }
  if (envelope.canonicalByteSize > MAX_FAILURE_ENVELOPE_BYTES) {
    throw Object.assign(new Error("Sanitized failure envelope exceeded its bounded maximum."), { code: "FAILURE_ENVELOPE_SIZE_LIMIT" });
  }
  return JSON.parse(stableObjectJson(envelope));
}

export function verifyFailureEnvelope(envelope = {}) {
  const recalculatedHash = sha256Object({ ...envelope, envelopeHash: "" });
  const recalculatedByteSize = canonicalByteLength(envelope);
  const eventsValid = Array.isArray(envelope.progress?.stageEvents) && envelope.progress.stageEvents.every((event) => (
    event.eventIdentity === calculateTerminalStageEventIdentity(event)
  ));
  return {
    valid: envelope.schemaVersion === FAILURE_ENVELOPE_SCHEMA_VERSION
      && envelope.envelopeHash === recalculatedHash
      && Number(envelope.canonicalByteSize || 0) === recalculatedByteSize
      && recalculatedByteSize <= MAX_FAILURE_ENVELOPE_BYTES
      && eventsValid,
    hashMatch: envelope.envelopeHash === recalculatedHash,
    byteSizeMatch: Number(envelope.canonicalByteSize || 0) === recalculatedByteSize,
    bounded: recalculatedByteSize <= MAX_FAILURE_ENVELOPE_BYTES,
    stageEventsValid: eventsValid,
    recalculatedHash,
    recalculatedByteSize
  };
}
