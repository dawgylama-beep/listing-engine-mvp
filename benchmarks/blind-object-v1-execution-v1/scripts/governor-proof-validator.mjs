import { sha256Json, stableJson } from "./execution-common.mjs";

const CURRENT_PROOF_SCHEMA_VERSION = "1.1";
const MAX_EPISODE_BYTES = 32768;
const MAX_LESSON_BYTES = 8192;
const MAX_EXPERIENCE_BYTES = 65536;
const GOVERNOR_CONSTRUCTED = "GOVERNOR_CONSTRUCTED";
const AUTHORITATIVE_STATE_INITIALIZED = "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED";

function byteLength(value) {
  return Buffer.byteLength(stableJson(value), "utf8");
}

function hashWithEmptyField(value, field) {
  return sha256Json({ ...value, [field]: "" });
}

function text(value) {
  return typeof value === "string" ? value : String(value ?? "");
}

function lifecycleIdentityProjection(event = {}) {
  return {
    proofSchemaVersion: text(event.proofSchemaVersion),
    evaluationIdentity: text(event.evaluationIdentity),
    sequence: Number(event.sequence || 0),
    eventType: text(event.eventType),
    governorIdentity: text(event.governorIdentity),
    cognitiveStateIdentity: text(event.cognitiveStateIdentity),
    objectMindStateId: text(event.objectMindStateId),
    initialKnowledgeStateHash: text(event.initialKnowledgeStateHash)
  };
}

function decisionIdentityProjection(record = {}) {
  return {
    proofSchemaVersion: text(record.proofSchemaVersion),
    evaluationIdentity: text(record.evaluationIdentity),
    sequence: Number(record.sequence || 0),
    actionType: text(record.actionType),
    actionSignature: text(record.actionSignature),
    targetIdentity: text(record.targetIdentity),
    executionPermitted: record.executionPermitted !== false,
    selectedButNonexecutedTerminal: Boolean(record.selectedButNonexecutedTerminal),
    inputCognitiveStateHash: text(record.inputCognitiveStateHash),
    inputKnowledgeStateHash: text(record.inputKnowledgeStateHash)
  };
}

function executionIdentityProjection(event = {}) {
  return {
    proofSchemaVersion: text(event.proofSchemaVersion),
    evaluationIdentity: text(event.evaluationIdentity),
    sequence: Number(event.sequence || 0),
    eventRole: text(event.eventRole),
    controlledOperationType: text(event.controlledOperationType),
    parentGovernorActionType: text(event.parentGovernorActionType),
    parentGovernorActionSignature: text(event.parentGovernorActionSignature),
    parentExecutionEventIdentity: text(event.parentExecutionEventIdentity),
    childPhase: text(event.childPhase),
    logicalProviderRequestIdentity: text(event.logicalProviderRequestIdentity)
  };
}

function providerIdentityProjection(record = {}) {
  return {
    proofSchemaVersion: text(record.proofSchemaVersion),
    evaluationIdentity: text(record.evaluationIdentity),
    providerRequestSequence: Number(record.providerRequestSequence || 0),
    parentGovernorActionType: text(record.parentGovernorActionType),
    parentGovernorActionSignature: text(record.parentGovernorActionSignature),
    providerOperationPhase: text(record.providerOperationPhase)
  };
}

function familyIntegrity(failures, prefixes) {
  return !failures.some((failure) => prefixes.some((prefix) => failure.code.startsWith(prefix)));
}

function emptyResult(failures) {
  return {
    passed: false,
    failures,
    recalculated: {
      governorInvocationCount: 0,
      authoritativeCognitiveStateCount: 0,
      unauthorizedActionCount: 0
    },
    integrity: {
      lifecycle: false,
      evaluationIdentity: false,
      decisionSignatureUniqueness: false,
      executionEventIdentity: false,
      parentSignatureUse: false,
      childParent: false,
      providerOwnership: false,
      unauthorizedAction: false,
      proofHash: false
    }
  };
}

export function validateGovernorProof({ proof, cognitiveEpisode, lessonCandidate = null, experienceRecord = null } = {}) {
  const failures = [];
  const requireCheck = (passed, code, detail) => {
    if (!passed) failures.push({ code, detail });
    return passed;
  };
  requireCheck(Boolean(proof && typeof proof === "object"), "GOVERNOR_PROOF_MISSING", "A durable Governor proof is required.");
  if (!proof || typeof proof !== "object") return emptyResult(failures);

  if (proof.schemaVersion === "1.0") {
    requireCheck(false, "PROOF_SCHEMA_PRIOR_ARTIFACT", "Proof schema 1.0 is a prior-schema artifact and cannot pass current semantic validation.");
  } else {
    requireCheck(proof.schemaVersion === CURRENT_PROOF_SCHEMA_VERSION, "PROOF_SCHEMA_INVALID", `Proof schema version must be ${CURRENT_PROOF_SCHEMA_VERSION}.`);
  }
  requireCheck(Boolean(proof.evaluationIdentity), "EVALUATION_IDENTITY_MISSING", "The proof must retain one evaluation identity.");

  const lifecycleEvents = Array.isArray(proof.lifecycleEvents) ? proof.lifecycleEvents : [];
  const decisions = Array.isArray(proof.selectedDecisions) ? proof.selectedDecisions : [];
  const executions = Array.isArray(proof.controlledExecutionEvents) ? proof.controlledExecutionEvents : [];
  const providers = Array.isArray(proof.providerRequestOwnership) ? proof.providerRequestOwnership : [];
  const attempts = Array.isArray(proof.unauthorizedExecutionAttempts) ? proof.unauthorizedExecutionAttempts : [];

  requireCheck(Array.isArray(proof.lifecycleEvents), "LIFECYCLE_EVENTS_MISSING", "Durable lifecycle events are required.");
  const lifecycleSequences = lifecycleEvents.map((event) => event.sequence);
  requireCheck(new Set(lifecycleSequences).size === lifecycleEvents.length, "LIFECYCLE_SEQUENCE_DUPLICATE", "Lifecycle sequences must be unique.");
  requireCheck(lifecycleEvents.every((event, index) => Number.isInteger(event.sequence) && event.sequence === index + 1), "LIFECYCLE_SEQUENCE_INVALID", "Lifecycle events must be stored in contiguous canonical order.");
  const lifecycleIdentities = lifecycleEvents.map((event) => event.lifecycleEventIdentity);
  requireCheck(lifecycleIdentities.every(Boolean) && new Set(lifecycleIdentities).size === lifecycleEvents.length, "LIFECYCLE_IDENTITY_DUPLICATE", "Lifecycle event identities must be present and unique.");
  for (const event of lifecycleEvents) {
    requireCheck(event.proofSchemaVersion === proof.schemaVersion, "LIFECYCLE_SCHEMA_MISMATCH", "Lifecycle events must bind the current proof schema.");
    requireCheck(event.evaluationIdentity === proof.evaluationIdentity, "LIFECYCLE_EVALUATION_MISMATCH", "Lifecycle events must belong to the reported evaluation.");
    requireCheck([GOVERNOR_CONSTRUCTED, AUTHORITATIVE_STATE_INITIALIZED].includes(event.eventType), "LIFECYCLE_EVENT_TYPE_INVALID", "Unknown lifecycle event type.");
    requireCheck(event.lifecycleEventIdentity === sha256Json(lifecycleIdentityProjection(event)), "LIFECYCLE_IDENTITY_INVALID", `Lifecycle event ${event.sequence || "unknown"} identity does not recalculate.`);
    requireCheck(Boolean(event.governorIdentity), "LIFECYCLE_GOVERNOR_IDENTITY_MISSING", "Every lifecycle event must retain its Governor identity.");
    if (event.eventType === AUTHORITATIVE_STATE_INITIALIZED) {
      requireCheck(Boolean(event.cognitiveStateIdentity) && Boolean(event.objectMindStateId) && Boolean(event.initialKnowledgeStateHash), "AUTHORITATIVE_STATE_EVENT_INCOMPLETE", "The authoritative-state event is missing canonical identity fields.");
    }
  }
  const recalculatedGovernorInvocationCount = lifecycleEvents.filter((event) => event.eventType === GOVERNOR_CONSTRUCTED).length;
  const recalculatedAuthoritativeStateCount = lifecycleEvents.filter((event) => event.eventType === AUTHORITATIVE_STATE_INITIALIZED).length;
  requireCheck(proof.governorInvocationCount === recalculatedGovernorInvocationCount, "GOVERNOR_COUNT_MISMATCH", "Governor count must be recalculated from lifecycle events.");
  requireCheck(proof.authoritativeCognitiveStateCount === recalculatedAuthoritativeStateCount, "AUTHORITATIVE_STATE_COUNT_MISMATCH", "Authoritative-state count must be recalculated from lifecycle events.");
  requireCheck(recalculatedGovernorInvocationCount === 1, "GOVERNOR_INVOCATION_COUNT_INVALID", "Exactly one Governor construction lifecycle event is required.");
  requireCheck(recalculatedAuthoritativeStateCount === 1, "AUTHORITATIVE_STATE_COUNT_INVALID", "Exactly one authoritative-state lifecycle event is required.");

  requireCheck(proof.decisionInvocationCount === decisions.length, "DECISION_COUNT_MISMATCH", "Decision invocation count must equal the selected-decision sequence length.");
  const decisionSequences = decisions.map((record) => record.sequence);
  requireCheck(new Set(decisionSequences).size === decisions.length, "DECISION_SEQUENCE_DUPLICATE", "Decision invocation sequences must be unique.");
  requireCheck(decisions.every((record, index) => Number.isInteger(record.sequence) && record.sequence === index + 1), "DECISION_SEQUENCE_INVALID", "Selected decisions must be stored in contiguous canonical order.");
  const decisionSignatures = decisions.map((record) => record.actionSignature);
  requireCheck(decisionSignatures.every(Boolean), "DECISION_SIGNATURE_MISSING", "Every selected decision must retain its action signature.");
  requireCheck(new Set(decisionSignatures).size === decisions.length, "DECISION_SIGNATURE_DUPLICATE", "Selected decision signatures must be unique before map construction.");
  const decisionIdentities = decisions.map((record) => record.decisionIdentity);
  requireCheck(decisionIdentities.every(Boolean) && new Set(decisionIdentities).size === decisions.length, "DECISION_IDENTITY_DUPLICATE", "Selected decision identities must be present and unique.");
  for (const decision of decisions) {
    requireCheck(decision.proofSchemaVersion === proof.schemaVersion, "DECISION_SCHEMA_MISMATCH", "Selected decisions must bind the current proof schema.");
    requireCheck(decision.evaluationIdentity === proof.evaluationIdentity, "DECISION_EVALUATION_MISMATCH", "Selected decisions must belong to the reported evaluation.");
    requireCheck(decision.decisionIdentity === sha256Json(decisionIdentityProjection(decision)), "DECISION_IDENTITY_INVALID", `Decision ${decision.sequence || "unknown"} identity does not recalculate.`);
  }
  const decisionBySignature = new Map(decisions.map((record) => [record.actionSignature, record]));

  const executionSequences = executions.map((record) => record.sequence);
  requireCheck(new Set(executionSequences).size === executions.length, "EXECUTION_SEQUENCE_DUPLICATE", "Execution-event sequences must be unique.");
  requireCheck(executions.every((record, index) => Number.isInteger(record.sequence) && record.sequence === index + 1), "EXECUTION_SEQUENCE_INVALID", "Execution events must be stored in contiguous canonical order.");
  const executionIdentities = executions.map((record) => record.executionEventIdentity);
  requireCheck(executionIdentities.every(Boolean) && new Set(executionIdentities).size === executions.length, "EXECUTION_IDENTITY_DUPLICATE", "Execution-event identities must be present and unique.");
  const executionByIdentity = new Map(executions.map((record) => [record.executionEventIdentity, record]));
  const invalidExecutionIndexes = new Set();
  const parentSignatureUse = new Map();
  for (const [index, execution] of executions.entries()) {
    const decision = decisionBySignature.get(execution.parentGovernorActionSignature);
    const isParent = execution.eventRole === "PARENT" && execution.operationKind === "PARENT_ACTION";
    const isChild = execution.eventRole === "CHILD" && execution.operationKind === "CHILD_OPERATION";
    const identityValid = execution.executionEventIdentity === sha256Json(executionIdentityProjection(execution));
    requireCheck(identityValid, "EXECUTION_IDENTITY_INVALID", `Execution ${execution.executionEventIdentity || execution.sequence} identity does not recalculate.`);
    requireCheck(execution.proofSchemaVersion === proof.schemaVersion, "EXECUTION_SCHEMA_MISMATCH", "Execution events must bind the current proof schema.");
    requireCheck(execution.evaluationIdentity === proof.evaluationIdentity, "EXECUTION_EVALUATION_MISMATCH", "Execution events must belong to the reported evaluation.");
    requireCheck(isParent || isChild, "EXECUTION_ROLE_INVALID", "Execution role and operation kind disagree.");
    requireCheck(execution.actionType === execution.parentGovernorActionType && execution.actionSignature === execution.parentGovernorActionSignature, "EXECUTION_PARENT_FIELDS_MISMATCH", "Execution action fields must agree with their parent Governor fields.");
    const decisionValid = Boolean(decision)
      && decision.actionType === execution.parentGovernorActionType
      && decision.evaluationIdentity === proof.evaluationIdentity
      && decision.evaluationIdentity === execution.evaluationIdentity
      && decision.sequence === execution.decisionInvocationSequence;
    requireCheck(decisionValid, "EXECUTION_AUTHORIZATION_INVALID", `Execution ${execution.executionEventIdentity || execution.sequence} lacks a matching selected action.`);
    requireCheck(!decision || (decision.executionPermitted !== false && decision.selectedButNonexecutedTerminal !== true), "NONEXECUTABLE_DECISION_CONSUMED", "A selected-but-nonexecuted decision cannot authorize an execution.");
    requireCheck(["COMPLETED", "FAILED"].includes(execution.status), "EXECUTION_STATUS_INCOMPLETE", "A controlled execution must have a durable terminal execution status.");
    if (!identityValid || execution.evaluationIdentity !== proof.evaluationIdentity || !decisionValid || (!isParent && !isChild)) invalidExecutionIndexes.add(index);
    if (isParent) {
      requireCheck(!execution.parentExecutionEventIdentity && !execution.childPhase && !execution.logicalProviderRequestIdentity, "PARENT_EXECUTION_SHAPE_INVALID", "A parent execution cannot claim a parent, child phase, or request-specific identity.");
      requireCheck(execution.controlledOperationType === execution.operationPhase, "PARENT_OPERATION_TYPE_MISMATCH", "Parent operation type must match its operation phase.");
      parentSignatureUse.set(execution.parentGovernorActionSignature, (parentSignatureUse.get(execution.parentGovernorActionSignature) || 0) + 1);
    }
  }
  let duplicateParentUseCount = 0;
  for (const [signature, count] of parentSignatureUse.entries()) {
    if (count > 1) {
      duplicateParentUseCount += count - 1;
      requireCheck(false, "PARENT_SIGNATURE_REUSED", `Selected action signature ${signature || "unknown"} was consumed by more than one parent execution.`);
    }
  }
  for (const [index, execution] of executions.entries()) {
    if (execution.eventRole !== "CHILD" || execution.operationKind !== "CHILD_OPERATION") continue;
    const parent = executionByIdentity.get(execution.parentExecutionEventIdentity);
    const parentValid = Boolean(parent)
      && parent.eventRole === "PARENT"
      && parent.operationKind === "PARENT_ACTION"
      && parent.sequence < execution.sequence
      && parent.evaluationIdentity === execution.evaluationIdentity
      && parent.parentGovernorActionSignature === execution.parentGovernorActionSignature
      && parent.parentGovernorActionType === execution.parentGovernorActionType
      && parent.decisionInvocationSequence === execution.decisionInvocationSequence;
    requireCheck(parentValid, "CHILD_EXECUTION_PARENT_INVALID", "Child execution must inherit evaluation, signature, action, decision, and ordering from one parent execution.");
    requireCheck(execution.controlledOperationType === "CHILD_OPERATION" && execution.childPhase === execution.operationPhase && Boolean(execution.childPhase), "CHILD_EXECUTION_SHAPE_INVALID", "Child execution phase and operation type are invalid.");
    if (execution.childPhase === "LIMITED_RESULT_RECOVERY") {
      requireCheck(["ACQUIRE_INITIAL_EVIDENCE", "REFINE_EVIDENCE_SEARCH"].includes(execution.parentGovernorActionType), "LIMITED_RECOVERY_PARENT_INVALID", "Limited recovery requires an acquisition or refinement parent.");
    }
    if (execution.childPhase === "PROVIDER_FALLBACK") {
      requireCheck(execution.parentGovernorActionType === "ACQUIRE_INITIAL_EVIDENCE", "PROVIDER_FALLBACK_PARENT_INVALID", "Provider fallback requires an acquisition parent.");
    }
    if (!parentValid) invalidExecutionIndexes.add(index);
  }

  for (const execution of executions.filter((record) => Boolean(record.logicalProviderRequestIdentity))) {
    const matchingProviders = providers.filter((provider) => (
      provider.governorScopeClassification === "GOVERNOR_CONTROLLED"
      && provider.controlledExecutionEventIdentity === execution.executionEventIdentity
      && provider.logicalProviderRequestIdentity === execution.logicalProviderRequestIdentity
    ));
    requireCheck(
      execution.eventRole === "CHILD" && matchingProviders.length === 1,
      "EXECUTION_PROVIDER_BINDING_INVALID",
      "A request-specific execution identity must belong to one child and one governed logical provider request."
    );
  }

  const governedProviders = providers.filter((record) => record.governorScopeClassification === "GOVERNOR_CONTROLLED");
  const providerSequences = governedProviders.map((record) => record.providerRequestSequence);
  requireCheck(new Set(providerSequences).size === governedProviders.length, "PROVIDER_SEQUENCE_DUPLICATE", "Governed provider-request sequences must be unique.");
  requireCheck(governedProviders.every((record, index) => Number.isInteger(record.providerRequestSequence) && record.providerRequestSequence === index + 1), "PROVIDER_SEQUENCE_INVALID", "Governed provider requests must be stored in contiguous ownership order.");
  const logicalProviderIdentities = governedProviders.map((record) => record.logicalProviderRequestIdentity);
  requireCheck(logicalProviderIdentities.every(Boolean) && new Set(logicalProviderIdentities).size === governedProviders.length, "PROVIDER_IDENTITY_DUPLICATE", "Logical provider-request identities must be present and unique.");
  const invalidProviderIndexes = new Set();
  for (const [index, provider] of providers.entries()) {
    const physicalAttempts = Array.isArray(provider.physicalAttempts) ? provider.physicalAttempts : [];
    const execution = executionByIdentity.get(provider.controlledExecutionEventIdentity);
    const controlled = provider.governorScopeClassification === "GOVERNOR_CONTROLLED";
    if (controlled) {
      requireCheck(Boolean(provider.evaluationIdentity), "PROVIDER_EVALUATION_MISSING", "A governed provider request must retain its evaluation identity.");
      requireCheck(provider.evaluationIdentity === proof.evaluationIdentity, "PROVIDER_EVALUATION_MISMATCH", "A governed provider request must belong to the reported evaluation.");
      requireCheck(Boolean(provider.controlledExecutionEventIdentity), "PROVIDER_PARENT_EXECUTION_MISSING", "A governed provider request must retain its controlled execution identity.");
      requireCheck(Boolean(execution), "PROVIDER_PARENT_EXECUTION_UNKNOWN", "A governed provider request must reference a stored controlled execution.");
      requireCheck(Boolean(provider.logicalProviderRequestIdentity), "PROVIDER_IDENTITY_MISSING", "A governed provider request must retain its logical identity.");
    }
    const ownershipValid = (!controlled && Number(provider.physicalAttemptCount || 0) === 0) || controlled
      && provider.proofSchemaVersion === proof.schemaVersion
      && provider.evaluationIdentity === proof.evaluationIdentity
      && Boolean(execution)
      && execution.evaluationIdentity === provider.evaluationIdentity
      && execution.parentGovernorActionSignature === provider.parentGovernorActionSignature
      && execution.parentGovernorActionType === provider.parentGovernorActionType
      && execution.operationPhase === provider.providerOperationPhase
      && (!execution.logicalProviderRequestIdentity || execution.logicalProviderRequestIdentity === provider.logicalProviderRequestIdentity)
      && provider.logicalProviderRequestIdentity === sha256Json(providerIdentityProjection(provider));
    requireCheck(ownershipValid, "PROVIDER_OWNERSHIP_INVALID", `Provider request ${provider.logicalProviderRequestIdentity || "unknown"} lacks valid evaluation-scoped action ownership.`);
    requireCheck(Number(provider.physicalAttemptCount || 0) === physicalAttempts.length, "PHYSICAL_ATTEMPT_COUNT_MISMATCH", "Physical attempt count must equal its nested attempt records.");
    requireCheck(Number(provider.physicalRetryAttemptCount || 0) === physicalAttempts.filter((attempt) => attempt.retry).length, "PHYSICAL_RETRY_COUNT_MISMATCH", "Physical retries must remain nested beneath one provider request.");
    requireCheck(Number(provider.physicalRetryAttemptCount || 0) <= 1, "RETRY_CEILING_EXCEEDED", "A provider request may have at most one physical retry.");
    requireCheck(Number(provider.physicalAttemptCount || 0) === 0 || controlled, "PHYSICAL_ATTEMPT_OUTSIDE_GOVERNOR", "Every physical provider attempt must be Governor controlled.");
    if (provider.providerOperationPhase === "LIMITED_RESULT_RECOVERY") {
      requireCheck(execution?.eventRole === "CHILD" && execution.childPhase === "LIMITED_RESULT_RECOVERY" && ["ACQUIRE_INITIAL_EVIDENCE", "REFINE_EVIDENCE_SEARCH"].includes(execution.parentGovernorActionType), "LIMITED_RECOVERY_PROVIDER_PARENT_INVALID", "Limited-recovery provider work must belong to an eligible recovery child.");
    }
    if (provider.providerOperationPhase === "PROVIDER_FALLBACK") {
      requireCheck(execution?.eventRole === "CHILD" && execution.childPhase === "PROVIDER_FALLBACK" && execution.parentGovernorActionType === "ACQUIRE_INITIAL_EVIDENCE", "PROVIDER_FALLBACK_OWNERSHIP_INVALID", "Fallback provider work must belong to the acquisition fallback child.");
    }
    if (!ownershipValid) invalidProviderIndexes.add(index);
  }

  const recalculatedUnauthorizedActionCount = attempts.length + invalidExecutionIndexes.size + invalidProviderIndexes.size + duplicateParentUseCount;
  requireCheck(proof.unauthorizedExecutionAttemptCount === attempts.length, "UNAUTHORIZED_ATTEMPT_COUNT_MISMATCH", "Unauthorized attempt count must be calculated from its records.");
  requireCheck(proof.unauthorizedActionCount === recalculatedUnauthorizedActionCount, "UNAUTHORIZED_ACTION_COUNT_MISMATCH", "Unauthorized action count cannot conceal recorded or structurally invalid actions.");
  requireCheck(recalculatedUnauthorizedActionCount === 0, "UNAUTHORIZED_ACTION_PRESENT", "A valid evaluation may not contain an unauthorized action.");

  const episodeHash = cognitiveEpisode ? hashWithEmptyField(cognitiveEpisode, "cognitiveEpisodeHash") : "";
  const episodeBytes = cognitiveEpisode ? byteLength(cognitiveEpisode) : 0;
  requireCheck(Boolean(cognitiveEpisode), "COGNITIVE_EPISODE_MISSING", "Cognitive Episode is required.");
  requireCheck(Boolean(cognitiveEpisode) && cognitiveEpisode.cognitiveEpisodeHash === episodeHash, "COGNITIVE_EPISODE_HASH_INVALID", "Cognitive Episode hash mutation detected.");
  requireCheck(proof.cognitiveEpisode?.storedHash === episodeHash && proof.cognitiveEpisode?.recalculatedHash === episodeHash, "COGNITIVE_EPISODE_PROOF_MISMATCH", "Proof Episode hashes must independently match the stored Episode.");
  requireCheck(episodeBytes <= MAX_EPISODE_BYTES && proof.cognitiveEpisode?.canonicalByteSize === episodeBytes, "COGNITIVE_EPISODE_SIZE_INVALID", "Cognitive Episode size ceiling or recorded size is invalid.");

  const linkedExperienceHash = cognitiveEpisode?.linkedExperienceRecordHash || "";
  const experienceHash = experienceRecord ? hashWithEmptyField(experienceRecord, "experienceRecordHash") : "";
  const experienceBytes = experienceRecord ? byteLength(experienceRecord) : 0;
  requireCheck(Boolean(experienceRecord) && experienceRecord.experienceRecordHash === experienceHash, "EXPERIENCE_HASH_INVALID", "Experience Record hash mutation detected.");
  requireCheck(Boolean(linkedExperienceHash) && linkedExperienceHash === experienceHash && proof.experienceRecord?.storedHash === experienceHash && proof.experienceRecord?.linkedHash === experienceHash && proof.experienceRecord?.linkIntegrityPassed === true, "EXPERIENCE_LINK_INVALID", "Experience Record hash link must match the Episode and proof.");
  requireCheck(experienceBytes <= MAX_EXPERIENCE_BYTES && proof.experienceRecord?.canonicalByteSize === experienceBytes, "EXPERIENCE_SIZE_INVALID", "Experience Record ceiling or recorded size is invalid.");

  if (lessonCandidate) {
    const lessonHash = hashWithEmptyField(lessonCandidate, "lessonCandidateHash");
    const lessonBytes = byteLength(lessonCandidate);
    requireCheck(lessonCandidate.lessonCandidateHash === lessonHash, "LESSON_HASH_INVALID", "Lesson Candidate hash mutation detected.");
    requireCheck(proof.lessonCandidate?.storedHash === lessonHash && proof.lessonCandidate?.recalculatedHash === lessonHash, "LESSON_PROOF_MISMATCH", "Proof Lesson hashes must match the stored Lesson.");
    requireCheck(lessonBytes <= MAX_LESSON_BYTES && proof.lessonCandidate?.canonicalByteSize === lessonBytes, "LESSON_SIZE_INVALID", "Lesson Candidate size ceiling or recorded size is invalid.");
    requireCheck(lessonCandidate.status === "UNVALIDATED" && proof.lessonCandidate?.status === "UNVALIDATED", "LESSON_STATUS_INVALID", "Every Lesson Candidate must remain UNVALIDATED.");
    requireCheck(lessonCandidate.promotionAuthorized === false && proof.lessonCandidate?.promotionAuthorized === false, "LESSON_PROMOTION_INVALID", "Lesson promotion must remain unauthorized.");
  } else {
    requireCheck(proof.lessonCandidate?.present === false, "LESSON_PRESENCE_MISMATCH", "Proof must record an absent Lesson Candidate truthfully.");
  }

  for (const [name, ceiling] of Object.entries(proof.ceilings || {})) {
    requireCheck(ceiling?.compliant === true, `${name.toUpperCase()}_CEILING_EXCEEDED`, `${name} ceiling must be compliant.`);
  }
  requireCheck(Number(proof.ceilings?.refinement?.consumed || 0) <= 1, "REFINEMENT_CEILING_EXCEEDED", "At most one refinement action may execute.");
  requireCheck(Number(proof.ceilings?.directPage?.consumed || 0) <= Number(proof.ceilings?.directPage?.maximum || 0), "DIRECT_PAGE_CEILING_EXCEEDED", "Direct-page attempts exceeded their ceiling.");

  const terminalDecision = proof.terminalDecision;
  const storedTerminalDecision = terminalDecision ? decisionBySignature.get(terminalDecision.actionSignature) : null;
  requireCheck(Boolean(terminalDecision) && String(terminalDecision.actionType || "").startsWith("STOP_") && storedTerminalDecision?.decisionIdentity === terminalDecision.decisionIdentity, "TERMINAL_DECISION_MISSING", "The terminal decision must be one of the stored selected decisions.");
  const expectedTerminalStatus = terminalDecision?.actionType === "STOP_COMPLETE" ? "COMPLETE" : "INSUFFICIENT_EVIDENCE";
  requireCheck(proof.terminalStatus === expectedTerminalStatus, "TERMINAL_STATUS_MISMATCH", "Terminal status must agree with the selected terminal decision.");

  const proofHashValid = proof.proofHash === sha256Json({ ...proof, proofHash: "" });
  requireCheck(proofHashValid, "PROOF_HASH_INVALID", "Governor proof hash mutation detected.");
  const schemaValid = proof.schemaVersion === CURRENT_PROOF_SCHEMA_VERSION;
  return {
    passed: failures.length === 0,
    failures,
    recalculated: {
      governorInvocationCount: recalculatedGovernorInvocationCount,
      authoritativeCognitiveStateCount: recalculatedAuthoritativeStateCount,
      unauthorizedActionCount: recalculatedUnauthorizedActionCount
    },
    integrity: {
      lifecycle: schemaValid && familyIntegrity(failures, ["LIFECYCLE_", "GOVERNOR_", "AUTHORITATIVE_STATE_"]),
      evaluationIdentity: schemaValid && familyIntegrity(failures, ["EVALUATION_", "LIFECYCLE_EVALUATION_", "DECISION_EVALUATION_", "EXECUTION_EVALUATION_", "PROVIDER_EVALUATION_"]),
      decisionSignatureUniqueness: schemaValid && familyIntegrity(failures, ["DECISION_SIGNATURE_", "DECISION_SEQUENCE_", "DECISION_IDENTITY_"]),
      executionEventIdentity: schemaValid && familyIntegrity(failures, ["EXECUTION_IDENTITY_", "EXECUTION_SEQUENCE_", "EXECUTION_ROLE_", "EXECUTION_SCHEMA_"]),
      parentSignatureUse: schemaValid && familyIntegrity(failures, ["PARENT_SIGNATURE_", "EXECUTION_AUTHORIZATION_", "NONEXECUTABLE_DECISION_"]),
      childParent: schemaValid && familyIntegrity(failures, ["CHILD_", "LIMITED_RECOVERY_", "PROVIDER_FALLBACK_PARENT_"]),
      providerOwnership: schemaValid && familyIntegrity(failures, ["PROVIDER_", "EXECUTION_PROVIDER_", "PHYSICAL_", "RETRY_", "LIMITED_RECOVERY_PROVIDER_"]),
      unauthorizedAction: schemaValid && familyIntegrity(failures, ["UNAUTHORIZED_"]),
      proofHash: schemaValid && proofHashValid
    }
  };
}
