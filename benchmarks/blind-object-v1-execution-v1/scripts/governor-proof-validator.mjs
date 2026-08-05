import { sha256Json, stableJson } from "./execution-common.mjs";

const CURRENT_PROOF_SCHEMA_VERSION = "1.1";
const MAX_EPISODE_BYTES = 32768;
const MAX_LESSON_BYTES = 8192;
const MAX_EXPERIENCE_BYTES = 65536;
const COGNITIVE_EPISODE_SCHEMA_VERSION = "1.0";
const LESSON_CANDIDATE_SCHEMA_VERSION = "1.0";
const STANDARD_PROVIDER_REQUEST_MAXIMUM = 12;
const RETAIL_PROVIDER_REQUEST_MAXIMUM = 28;
const GOVERNOR_CONSTRUCTED = "GOVERNOR_CONSTRUCTED";
const AUTHORITATIVE_STATE_INITIALIZED = "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED";
const DISPOSITION = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  NOT_APPLICABLE: "NOT_APPLICABLE"
});

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

function categoryRecorder(failures) {
  const categoryFailures = [];
  return {
    failures: categoryFailures,
    require(passed, code, detail, evidence = {}) {
      if (!passed) {
        const failure = { code, detail, ...evidence };
        failures.push(failure);
        categoryFailures.push(failure);
      }
      return passed;
    }
  };
}

function unavailableCategory(code, detail) {
  return {
    disposition: DISPOSITION.FAIL,
    failures: [{ code, detail }]
  };
}

function emptyResult(failures) {
  return {
    proofSchemaVersion: "",
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
    },
    cognitiveEpisodeIntegrity: unavailableCategory("COGNITIVE_EPISODE_VALIDATION_UNAVAILABLE", "Cognitive Episode integrity cannot be established without a Governor proof."),
    experienceRecordIntegrity: unavailableCategory("EXPERIENCE_VALIDATION_UNAVAILABLE", "Experience Record integrity cannot be established without a Governor proof."),
    lessonCandidateIntegrityAndInertness: unavailableCategory("LESSON_VALIDATION_UNAVAILABLE", "Lesson Candidate integrity cannot be established without a Governor proof."),
    ceilingCompliance: unavailableCategory("CEILING_VALIDATION_UNAVAILABLE", "Ceiling compliance cannot be established without a Governor proof."),
    terminalAgreement: unavailableCategory("TERMINAL_VALIDATION_UNAVAILABLE", "Terminal agreement cannot be established without a Governor proof.")
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

  const episodeChecks = categoryRecorder(failures);
  const episodePresent = Boolean(cognitiveEpisode && typeof cognitiveEpisode === "object");
  const episodeSchemaVersion = episodePresent ? text(cognitiveEpisode.schemaVersion) : "";
  const episodeHash = episodePresent ? hashWithEmptyField(cognitiveEpisode, "cognitiveEpisodeHash") : "";
  const episodeStoredHash = episodePresent ? text(cognitiveEpisode.cognitiveEpisodeHash) : "";
  const episodeBytes = episodePresent ? byteLength(cognitiveEpisode) : 0;
  const episodeSchemaMatches = episodePresent
    && episodeSchemaVersion === COGNITIVE_EPISODE_SCHEMA_VERSION
    && proof.cognitiveEpisode?.schemaVersion === episodeSchemaVersion;
  const episodeHashMatches = episodePresent && Boolean(episodeStoredHash) && episodeStoredHash === episodeHash;
  const episodeProofHashesMatch = episodePresent
    && proof.cognitiveEpisode?.storedHash === episodeHash
    && proof.cognitiveEpisode?.recalculatedHash === episodeHash;
  const episodeByteCeilingPassed = episodePresent
    && episodeBytes <= MAX_EPISODE_BYTES
    && proof.cognitiveEpisode?.canonicalByteSize === episodeBytes
    && proof.cognitiveEpisode?.maximumByteSize === MAX_EPISODE_BYTES;
  episodeChecks.require(episodePresent, "COGNITIVE_EPISODE_MISSING", "Cognitive Episode is required.");
  episodeChecks.require(episodeSchemaMatches, "COGNITIVE_EPISODE_SCHEMA_INVALID", `Cognitive Episode schema must be ${COGNITIVE_EPISODE_SCHEMA_VERSION}.`, {
    actual: episodeSchemaVersion,
    expected: COGNITIVE_EPISODE_SCHEMA_VERSION
  });
  episodeChecks.require(episodeHashMatches, "COGNITIVE_EPISODE_HASH_INVALID", "Cognitive Episode hash mutation detected.", {
    storedHash: episodeStoredHash,
    recalculatedHash: episodeHash
  });
  episodeChecks.require(episodeProofHashesMatch, "COGNITIVE_EPISODE_PROOF_MISMATCH", "Proof Episode hashes must independently match the stored Episode.");
  episodeChecks.require(episodeByteCeilingPassed, "COGNITIVE_EPISODE_SIZE_INVALID", "Cognitive Episode size ceiling or recorded size is invalid.", {
    actual: episodeBytes,
    maximum: MAX_EPISODE_BYTES
  });
  const cognitiveEpisodeIntegrity = {
    disposition: episodeChecks.failures.length === 0 ? DISPOSITION.PASS : DISPOSITION.FAIL,
    presence: episodePresent ? "PRESENT" : "MISSING",
    schemaVersion: episodeSchemaVersion || null,
    expectedSchemaVersion: COGNITIVE_EPISODE_SCHEMA_VERSION,
    schemaMatch: episodeSchemaMatches,
    storedHash: episodeStoredHash || null,
    recalculatedHash: episodeHash || null,
    hashMatch: episodeHashMatches && episodeProofHashesMatch,
    canonicalByteSize: episodeBytes,
    maximumByteSize: MAX_EPISODE_BYTES,
    byteCeilingPassed: episodeByteCeilingPassed,
    failures: episodeChecks.failures
  };

  const experienceChecks = categoryRecorder(failures);
  const experiencePresent = Boolean(experienceRecord && typeof experienceRecord === "object");
  const linkedExperienceHash = episodePresent ? text(cognitiveEpisode.linkedExperienceRecordHash) : "";
  const experienceStoredHash = experiencePresent ? text(experienceRecord.experienceRecordHash) : "";
  const experienceHash = experiencePresent ? hashWithEmptyField(experienceRecord, "experienceRecordHash") : "";
  const experienceBytes = experiencePresent ? byteLength(experienceRecord) : 0;
  const experienceHashMatches = experiencePresent && Boolean(experienceStoredHash) && experienceStoredHash === experienceHash;
  const experienceLinkMatches = experiencePresent
    && Boolean(linkedExperienceHash)
    && linkedExperienceHash === experienceHash
    && proof.experienceRecord?.storedHash === experienceHash
    && proof.experienceRecord?.linkedHash === experienceHash
    && proof.experienceRecord?.linkIntegrityPassed === true;
  const experienceByteCeilingPassed = experiencePresent
    && experienceBytes <= MAX_EXPERIENCE_BYTES
    && proof.experienceRecord?.canonicalByteSize === experienceBytes
    && proof.experienceRecord?.maximumByteSize === MAX_EXPERIENCE_BYTES;
  experienceChecks.require(experiencePresent, "EXPERIENCE_RECORD_MISSING", "Experience Record is required.");
  experienceChecks.require(experienceHashMatches, "EXPERIENCE_HASH_INVALID", "Experience Record hash mutation detected.", {
    storedHash: experienceStoredHash,
    recalculatedHash: experienceHash
  });
  experienceChecks.require(experienceLinkMatches, "EXPERIENCE_LINK_INVALID", "Experience Record hash link must match the Episode and proof.", {
    linkedHash: linkedExperienceHash,
    establishedHash: experienceHash
  });
  experienceChecks.require(experienceByteCeilingPassed, "EXPERIENCE_SIZE_INVALID", "Experience Record ceiling or recorded size is invalid.", {
    actual: experienceBytes,
    maximum: MAX_EXPERIENCE_BYTES
  });
  const experienceRecordIntegrity = {
    disposition: experienceChecks.failures.length === 0 ? DISPOSITION.PASS : DISPOSITION.FAIL,
    presence: experiencePresent ? "PRESENT" : "MISSING",
    schemaVersion: experiencePresent ? text(experienceRecord.schemaVersion) || null : null,
    storedHash: experienceStoredHash || null,
    recalculatedHash: experienceHash || null,
    hashMatch: experienceHashMatches,
    linkedExperienceRecordHash: linkedExperienceHash || null,
    linkageTargetHash: experienceHash || null,
    linkMatch: experienceLinkMatches,
    recordCount: experiencePresent ? 1 : 0,
    canonicalByteSize: experienceBytes,
    maximumByteSize: MAX_EXPERIENCE_BYTES,
    byteCeilingPassed: experienceByteCeilingPassed,
    failures: experienceChecks.failures
  };

  const lessonChecks = categoryRecorder(failures);
  const lessonPresent = Boolean(lessonCandidate && typeof lessonCandidate === "object");
  const lessonSchemaVersion = lessonPresent ? text(lessonCandidate.schemaVersion) : "";
  const lessonStoredHash = lessonPresent ? text(lessonCandidate.lessonCandidateHash) : "";
  const lessonHash = lessonPresent ? hashWithEmptyField(lessonCandidate, "lessonCandidateHash") : "";
  const lessonBytes = lessonPresent ? byteLength(lessonCandidate) : 0;
  const lessonPresenceMatches = lessonPresent ? proof.lessonCandidate?.present === true : proof.lessonCandidate?.present === false;
  let lessonSchemaMatches = null;
  let lessonHashMatches = null;
  let lessonProofHashesMatch = null;
  let lessonByteCeilingPassed = null;
  let lessonStatusUnvalidated = null;
  let lessonPromotionDisabled = null;
  let lessonInert = null;
  lessonChecks.require(lessonPresenceMatches, "LESSON_PRESENCE_MISMATCH", "Proof must record Lesson Candidate presence truthfully.");
  if (lessonPresent) {
    lessonSchemaMatches = lessonSchemaVersion === LESSON_CANDIDATE_SCHEMA_VERSION
      && proof.lessonCandidate?.schemaVersion === lessonSchemaVersion;
    lessonHashMatches = Boolean(lessonStoredHash) && lessonStoredHash === lessonHash;
    lessonProofHashesMatch = proof.lessonCandidate?.storedHash === lessonHash
      && proof.lessonCandidate?.recalculatedHash === lessonHash;
    lessonByteCeilingPassed = lessonBytes <= MAX_LESSON_BYTES
      && proof.lessonCandidate?.canonicalByteSize === lessonBytes
      && proof.lessonCandidate?.maximumByteSize === MAX_LESSON_BYTES;
    lessonStatusUnvalidated = lessonCandidate.status === "UNVALIDATED"
      && proof.lessonCandidate?.status === "UNVALIDATED";
    lessonPromotionDisabled = lessonCandidate.promotionAuthorized === false
      && proof.lessonCandidate?.promotionAuthorized === false;
    lessonInert = lessonStatusUnvalidated && lessonPromotionDisabled && proof.lessonCandidate?.inert === true;
    lessonChecks.require(lessonSchemaMatches, "LESSON_SCHEMA_INVALID", `Lesson Candidate schema must be ${LESSON_CANDIDATE_SCHEMA_VERSION}.`, {
      actual: lessonSchemaVersion,
      expected: LESSON_CANDIDATE_SCHEMA_VERSION
    });
    lessonChecks.require(lessonHashMatches, "LESSON_HASH_INVALID", "Lesson Candidate hash mutation detected.", {
      storedHash: lessonStoredHash,
      recalculatedHash: lessonHash
    });
    lessonChecks.require(lessonProofHashesMatch, "LESSON_PROOF_MISMATCH", "Proof Lesson hashes must match the stored Lesson.");
    lessonChecks.require(lessonByteCeilingPassed, "LESSON_SIZE_INVALID", "Lesson Candidate size ceiling or recorded size is invalid.", {
      actual: lessonBytes,
      maximum: MAX_LESSON_BYTES
    });
    lessonChecks.require(lessonStatusUnvalidated, "LESSON_STATUS_INVALID", "Every Lesson Candidate must remain UNVALIDATED.");
    lessonChecks.require(lessonPromotionDisabled, "LESSON_PROMOTION_INVALID", "Lesson promotion must remain unauthorized.");
    lessonChecks.require(lessonInert, "LESSON_INERTNESS_INVALID", "Lesson Candidate must remain inert.");
  }
  const lessonCategoryDisposition = lessonChecks.failures.length > 0
    ? DISPOSITION.FAIL
    : lessonPresent ? DISPOSITION.PASS : DISPOSITION.NOT_APPLICABLE;
  const lessonCandidateIntegrityAndInertness = {
    disposition: lessonCategoryDisposition,
    presence: lessonPresent ? "PRESENT" : "ABSENT",
    allowedAbsence: !lessonPresent && lessonPresenceMatches,
    schemaVersion: lessonPresent ? lessonSchemaVersion || null : null,
    expectedSchemaVersion: lessonPresent ? LESSON_CANDIDATE_SCHEMA_VERSION : null,
    schemaMatch: lessonSchemaMatches,
    storedHash: lessonPresent ? lessonStoredHash || null : null,
    recalculatedHash: lessonPresent ? lessonHash || null : null,
    hashMatch: lessonPresent ? lessonHashMatches && lessonProofHashesMatch : null,
    canonicalByteSize: lessonPresent ? lessonBytes : null,
    maximumByteSize: lessonPresent ? MAX_LESSON_BYTES : null,
    byteCeilingPassed: lessonByteCeilingPassed,
    status: lessonPresent ? text(lessonCandidate.status) || null : null,
    statusUnvalidated: lessonStatusUnvalidated,
    promotionAuthorized: lessonPresent ? lessonCandidate.promotionAuthorized === true : null,
    promotionDisabled: lessonPromotionDisabled,
    inert: lessonInert,
    inertnessDisposition: lessonPresent
      ? lessonInert ? DISPOSITION.PASS : DISPOSITION.FAIL
      : lessonPresenceMatches ? DISPOSITION.NOT_APPLICABLE : DISPOSITION.FAIL,
    failures: lessonChecks.failures
  };

  const ceilingChecks = categoryRecorder(failures);
  const providerCeiling = proof.ceilings?.provider || {};
  const providerConsumed = Number(providerCeiling.consumed || 0);
  const providerMaximum = Number(providerCeiling.maximum || 0);
  const providerCeilingConfigured = [STANDARD_PROVIDER_REQUEST_MAXIMUM, RETAIL_PROVIDER_REQUEST_MAXIMUM].includes(providerMaximum);
  const providerCompliant = providerCeilingConfigured
    && providerCeiling.compliant === true
    && providerConsumed <= providerMaximum;
  ceilingChecks.require(providerCeilingConfigured, "PROVIDER_CEILING_CONFIGURATION_INVALID", "Provider ceiling must use an established standard or retail maximum.", {
    actual: providerMaximum,
    allowed: [STANDARD_PROVIDER_REQUEST_MAXIMUM, RETAIL_PROVIDER_REQUEST_MAXIMUM]
  });
  ceilingChecks.require(providerCompliant, "PROVIDER_CEILING_EXCEEDED", "Provider request consumption exceeded its configured ceiling.", {
    ceiling: "providerRequests",
    actual: providerConsumed,
    maximum: providerMaximum
  });
  const ceilingResult = ({ name, consumed, maximum, compliant, applicable = true, maximumField = "maximum" }) => {
    if (!applicable) {
      return { name, disposition: DISPOSITION.NOT_APPLICABLE, applicable: false, consumed: null, [maximumField]: maximum, compliant: null };
    }
    return {
      name,
      disposition: compliant ? DISPOSITION.PASS : DISPOSITION.FAIL,
      applicable: true,
      consumed,
      [maximumField]: maximum,
      compliant
    };
  };
  const standardApplicable = providerMaximum === STANDARD_PROVIDER_REQUEST_MAXIMUM;
  const retailApplicable = providerMaximum === RETAIL_PROVIDER_REQUEST_MAXIMUM;
  const refinementConsumed = Number(proof.ceilings?.refinement?.consumed || 0);
  const refinementMaximum = Number(proof.ceilings?.refinement?.maximum || 1);
  const refinementCompliant = proof.ceilings?.refinement?.compliant === true
    && refinementConsumed <= refinementMaximum
    && refinementConsumed <= 1;
  ceilingChecks.require(refinementCompliant, "REFINEMENT_CEILING_EXCEEDED", "At most one refinement action may execute.", {
    ceiling: "refinement",
    actual: refinementConsumed,
    maximum: 1
  });
  const directPageConsumed = Number(proof.ceilings?.directPage?.consumed || 0);
  const directPageMaximum = Number(proof.ceilings?.directPage?.maximum || 0);
  const directPageCompliant = proof.ceilings?.directPage?.compliant === true
    && directPageConsumed <= directPageMaximum;
  ceilingChecks.require(directPageCompliant, "DIRECTPAGE_CEILING_EXCEEDED", "Direct-page attempts exceeded their ceiling.", {
    ceiling: "directPage",
    actual: directPageConsumed,
    maximum: directPageMaximum
  });
  const retryConsumed = Number(proof.ceilings?.retry?.consumed || 0);
  const retryMaximumPerRequest = Number(proof.ceilings?.retry?.maximumPerProviderRequest || 1);
  const retryCompliant = proof.ceilings?.retry?.compliant === true
    && providers.every((record) => Number(record.physicalRetryAttemptCount || 0) <= retryMaximumPerRequest);
  ceilingChecks.require(retryCompliant, "RETRY_CEILING_EXCEEDED", "A provider request may have at most one physical retry.", {
    ceiling: "physicalRetry",
    actual: retryConsumed,
    maximumPerLogicalProviderRequest: retryMaximumPerRequest
  });
  const physicalAttemptConsumed = providers.reduce((total, record) => total + Number(record.physicalAttemptCount || 0), 0);
  const physicalAttemptCompliant = providers.every((record) => {
    const nested = Array.isArray(record.physicalAttempts) ? record.physicalAttempts : [];
    return Number(record.physicalAttemptCount || 0) === nested.length
      && Number(record.physicalRetryAttemptCount || 0) === nested.filter((attempt) => attempt.retry).length
      && Number(record.physicalRetryAttemptCount || 0) <= retryMaximumPerRequest
      && (Number(record.physicalAttemptCount || 0) === 0 || record.governorScopeClassification === "GOVERNOR_CONTROLLED");
  });
  ceilingChecks.require(physicalAttemptCompliant, "PHYSICAL_PROVIDER_ATTEMPT_COMPLIANCE_INVALID", "Physical provider attempts must remain counted, nested, retry-bounded, and Governor controlled.", {
    ceiling: "physicalProviderAttempts",
    actual: physicalAttemptConsumed,
    maximumRetriesPerLogicalProviderRequest: retryMaximumPerRequest
  });
  const experienceCeiling = proof.ceilings?.experienceRecord || {};
  const experienceCeilingConsumed = Number(experienceCeiling.consumedBytes || 0);
  const experienceCeilingMaximum = Number(experienceCeiling.maximumBytes || MAX_EXPERIENCE_BYTES);
  const experienceCeilingCompliant = experienceCeiling.compliant === true
    && experienceCeilingConsumed <= experienceCeilingMaximum
    && experienceCeilingConsumed === experienceBytes;
  ceilingChecks.require(experienceCeilingCompliant, "EXPERIENCERECORD_CEILING_EXCEEDED", "Experience Record byte ceiling must be compliant.", {
    ceiling: "experienceRecord",
    actual: experienceCeilingConsumed,
    maximum: experienceCeilingMaximum
  });
  const episodeCeiling = proof.ceilings?.cognitiveEpisode || {};
  const episodeCeilingConsumed = Number(episodeCeiling.consumedBytes || 0);
  const episodeCeilingMaximum = Number(episodeCeiling.maximumBytes || MAX_EPISODE_BYTES);
  const episodeCeilingCompliant = episodeCeiling.compliant === true
    && episodeCeilingConsumed <= episodeCeilingMaximum
    && episodeCeilingConsumed === episodeBytes;
  ceilingChecks.require(episodeCeilingCompliant, "COGNITIVEEPISODE_CEILING_EXCEEDED", "Cognitive Episode byte ceiling must be compliant.", {
    ceiling: "cognitiveEpisode",
    actual: episodeCeilingConsumed,
    maximum: episodeCeilingMaximum
  });
  const lessonCeiling = proof.ceilings?.lessonCandidate || {};
  const lessonCeilingConsumed = Number(lessonCeiling.consumedBytes || 0);
  const lessonCeilingMaximum = Number(lessonCeiling.maximumBytes || MAX_LESSON_BYTES);
  const lessonCeilingCompliant = !lessonPresent || (
    lessonCeiling.compliant === true
    && lessonCeilingConsumed <= lessonCeilingMaximum
    && lessonCeilingConsumed === lessonBytes
  );
  if (lessonPresent) {
    ceilingChecks.require(lessonCeilingCompliant, "LESSONCANDIDATE_CEILING_EXCEEDED", "Lesson Candidate byte ceiling must be compliant.", {
      ceiling: "lessonCandidate",
      actual: lessonCeilingConsumed,
      maximum: lessonCeilingMaximum
    });
  }
  const ceilingCompliance = {
    disposition: ceilingChecks.failures.length === 0 ? DISPOSITION.PASS : DISPOSITION.FAIL,
    standardProviderRequests: ceilingResult({
      name: "standardProviderRequests",
      consumed: standardApplicable ? providerConsumed : null,
      maximum: STANDARD_PROVIDER_REQUEST_MAXIMUM,
      compliant: standardApplicable && providerCompliant,
      applicable: standardApplicable
    }),
    retailProviderRequests: ceilingResult({
      name: "retailProviderRequests",
      consumed: retailApplicable ? providerConsumed : null,
      maximum: RETAIL_PROVIDER_REQUEST_MAXIMUM,
      compliant: retailApplicable && providerCompliant,
      applicable: retailApplicable
    }),
    refinement: ceilingResult({ name: "refinement", consumed: refinementConsumed, maximum: 1, compliant: refinementCompliant }),
    directPage: ceilingResult({ name: "directPage", consumed: directPageConsumed, maximum: directPageMaximum, compliant: directPageCompliant }),
    physicalRetry: {
      ...ceilingResult({ name: "physicalRetry", consumed: retryConsumed, maximum: retryMaximumPerRequest, compliant: retryCompliant, maximumField: "maximumPerLogicalProviderRequest" }),
      scope: "PER_LOGICAL_PROVIDER_REQUEST"
    },
    physicalProviderAttempts: {
      name: "physicalProviderAttempts",
      disposition: physicalAttemptCompliant ? DISPOSITION.PASS : DISPOSITION.FAIL,
      consumed: physicalAttemptConsumed,
      maximumRetriesPerLogicalProviderRequest: retryMaximumPerRequest,
      compliant: physicalAttemptCompliant
    },
    experienceRecord: ceilingResult({ name: "experienceRecord", consumed: experienceCeilingConsumed, maximum: experienceCeilingMaximum, compliant: experienceCeilingCompliant }),
    cognitiveEpisode: ceilingResult({ name: "cognitiveEpisode", consumed: episodeCeilingConsumed, maximum: episodeCeilingMaximum, compliant: episodeCeilingCompliant }),
    lessonCandidate: ceilingResult({ name: "lessonCandidate", consumed: lessonPresent ? lessonCeilingConsumed : null, maximum: MAX_LESSON_BYTES, compliant: lessonCeilingCompliant, applicable: lessonPresent }),
    failures: ceilingChecks.failures
  };

  const terminalChecks = categoryRecorder(failures);
  const terminalDecision = proof.terminalDecision;
  const storedTerminalDecision = terminalDecision ? decisionBySignature.get(terminalDecision.actionSignature) : null;
  const terminalDecisionValid = Boolean(terminalDecision)
    && String(terminalDecision.actionType || "").startsWith("STOP_")
    && storedTerminalDecision?.decisionIdentity === terminalDecision.decisionIdentity;
  terminalChecks.require(terminalDecisionValid, "TERMINAL_DECISION_MISSING", "The terminal decision must be one of the stored selected decisions.");
  const terminalTransitionRequired = terminalDecisionValid
    && storedTerminalDecision.executionPermitted !== false
    && storedTerminalDecision.selectedButNonexecutedTerminal !== true;
  const matchingTerminalTransitions = terminalDecisionValid ? executions.filter((execution) => (
    execution.eventRole === "PARENT"
    && execution.parentGovernorActionSignature === terminalDecision.actionSignature
    && execution.parentGovernorActionType === terminalDecision.actionType
    && execution.operationPhase === "TERMINAL_STOP_TRANSITION"
  )) : [];
  const terminalTransitionPresent = !terminalTransitionRequired || matchingTerminalTransitions.length === 1;
  terminalChecks.require(terminalTransitionPresent, "TERMINAL_TRANSITION_MISSING", "A controlled terminal transition is required for an executable terminal decision.", {
    actual: matchingTerminalTransitions.length,
    expected: terminalTransitionRequired ? 1 : 0
  });
  const expectedTerminalStatus = terminalDecision?.actionType === "STOP_COMPLETE"
    ? "COMPLETE"
    : terminalDecision?.actionType === "STOP_INSUFFICIENT_EVIDENCE" ? "INSUFFICIENT_EVIDENCE" : "";
  const terminalStatusAgrees = terminalDecisionValid
    && Boolean(expectedTerminalStatus)
    && proof.terminalStatus === expectedTerminalStatus;
  terminalChecks.require(terminalStatusAgrees, "TERMINAL_STATUS_MISMATCH", "Terminal status must agree with the selected terminal decision.", {
    actual: text(proof.terminalStatus),
    expected: expectedTerminalStatus
  });
  const terminalAgreement = {
    disposition: terminalChecks.failures.length === 0 ? DISPOSITION.PASS : DISPOSITION.FAIL,
    selectedTerminalGovernorAction: terminalDecision ? text(terminalDecision.actionType) : null,
    terminalDecision: terminalDecision ? {
      actionType: text(terminalDecision.actionType),
      actionSignature: text(terminalDecision.actionSignature),
      decisionIdentity: text(terminalDecision.decisionIdentity)
    } : null,
    terminalStatus: text(proof.terminalStatus) || null,
    expectedTerminalStatus: expectedTerminalStatus || null,
    decisionPresentInSelectedSequence: terminalDecisionValid,
    terminalTransitionRequired,
    terminalTransitionPresent,
    agreement: terminalStatusAgrees,
    failures: terminalChecks.failures
  };

  const proofHashValid = proof.proofHash === sha256Json({ ...proof, proofHash: "" });
  requireCheck(proofHashValid, "PROOF_HASH_INVALID", "Governor proof hash mutation detected.");
  const schemaValid = proof.schemaVersion === CURRENT_PROOF_SCHEMA_VERSION;
  return {
    proofSchemaVersion: text(proof.schemaVersion),
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
    },
    cognitiveEpisodeIntegrity,
    experienceRecordIntegrity,
    lessonCandidateIntegrityAndInertness,
    ceilingCompliance,
    terminalAgreement
  };
}
