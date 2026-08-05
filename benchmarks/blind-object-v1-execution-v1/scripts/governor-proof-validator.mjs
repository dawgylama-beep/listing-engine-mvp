import { sha256Json, stableJson } from "./execution-common.mjs";

const MAX_EPISODE_BYTES = 32768;
const MAX_LESSON_BYTES = 8192;
const MAX_EXPERIENCE_BYTES = 65536;

function byteLength(value) {
  return Buffer.byteLength(stableJson(value), "utf8");
}

function hashWithEmptyField(value, field) {
  return sha256Json({ ...value, [field]: "" });
}

export function validateGovernorProof({ proof, cognitiveEpisode, lessonCandidate = null, experienceRecord = null } = {}) {
  const failures = [];
  const requireCheck = (passed, code, detail) => {
    if (!passed) failures.push({ code, detail });
  };
  requireCheck(Boolean(proof && typeof proof === "object"), "GOVERNOR_PROOF_MISSING", "A durable Governor proof is required.");
  if (!proof || typeof proof !== "object") return { passed: false, failures };

  const decisions = Array.isArray(proof.selectedDecisions) ? proof.selectedDecisions : [];
  const executions = Array.isArray(proof.controlledExecutionEvents) ? proof.controlledExecutionEvents : [];
  const providers = Array.isArray(proof.providerRequestOwnership) ? proof.providerRequestOwnership : [];
  const attempts = Array.isArray(proof.unauthorizedExecutionAttempts) ? proof.unauthorizedExecutionAttempts : [];
  const decisionBySignature = new Map(decisions.map((record) => [record.actionSignature, record]));
  const executionByIdentity = new Map(executions.map((record) => [record.executionEventIdentity, record]));

  requireCheck(proof.schemaVersion === "1.0", "PROOF_SCHEMA_INVALID", "Proof schema version must be 1.0.");
  requireCheck(proof.governorInvocationCount === 1, "GOVERNOR_INVOCATION_COUNT_INVALID", "Exactly one Governor construction must be recorded.");
  requireCheck(proof.authoritativeCognitiveStateCount === 1, "AUTHORITATIVE_STATE_COUNT_INVALID", "Exactly one authoritative Cognitive State must be recorded.");
  requireCheck(proof.decisionInvocationCount === decisions.length, "DECISION_COUNT_MISMATCH", "Decision invocation count must equal the selected-decision sequence length.");
  requireCheck(new Set(decisions.map((record) => record.sequence)).size === decisions.length, "DECISION_SEQUENCE_DUPLICATE", "Decision invocation sequences must be unique.");

  let invalidExecutionCount = 0;
  for (const execution of executions) {
    const decision = decisionBySignature.get(execution.actionSignature);
    const valid = Boolean(decision)
      && decision.actionType === execution.actionType
      && decision.evaluationIdentity === proof.evaluationIdentity
      && decision.sequence === execution.decisionInvocationSequence;
    if (!valid) invalidExecutionCount += 1;
    requireCheck(valid, "EXECUTION_AUTHORIZATION_INVALID", `Execution ${execution.executionEventIdentity || execution.sequence} lacks a matching selected action.`);
    requireCheck(["COMPLETED", "FAILED"].includes(execution.status), "EXECUTION_STATUS_INCOMPLETE", "A controlled execution must have a durable terminal execution status.");
    if (execution.operationKind === "CHILD_OPERATION") {
      const parent = executionByIdentity.get(execution.parentExecutionEventIdentity);
      requireCheck(Boolean(parent) && parent.actionSignature === execution.actionSignature, "CHILD_EXECUTION_PARENT_INVALID", "Child execution must inherit its parent action signature.");
      if (execution.operationPhase === "LIMITED_RESULT_RECOVERY") {
        requireCheck(["ACQUIRE_INITIAL_EVIDENCE", "REFINE_EVIDENCE_SEARCH"].includes(execution.actionType), "LIMITED_RECOVERY_PARENT_INVALID", "Limited recovery requires an acquisition or refinement parent.");
      }
    }
  }

  let invalidProviderCount = 0;
  for (const provider of providers) {
    const physicalAttempts = Array.isArray(provider.physicalAttempts) ? provider.physicalAttempts : [];
    const execution = executionByIdentity.get(provider.controlledExecutionEventIdentity);
    const controlled = provider.governorScopeClassification === "GOVERNOR_CONTROLLED";
    const ownershipValid = (!controlled && Number(provider.physicalAttemptCount || 0) === 0) || controlled && Boolean(execution)
      && execution.actionSignature === provider.parentGovernorActionSignature
      && execution.actionType === provider.parentGovernorActionType
      && Boolean(provider.logicalProviderRequestIdentity);
    if (!ownershipValid) invalidProviderCount += 1;
    requireCheck(ownershipValid, "PROVIDER_OWNERSHIP_INVALID", `Provider request ${provider.logicalProviderRequestIdentity || "unknown"} lacks valid action ownership.`);
    requireCheck(Number(provider.physicalAttemptCount || 0) === physicalAttempts.length, "PHYSICAL_ATTEMPT_COUNT_MISMATCH", "Physical attempt count must equal its nested attempt records.");
    requireCheck(Number(provider.physicalRetryAttemptCount || 0) === physicalAttempts.filter((attempt) => attempt.retry).length, "PHYSICAL_RETRY_COUNT_MISMATCH", "Physical retries must remain nested beneath one provider request.");
    requireCheck(Number(provider.physicalRetryAttemptCount || 0) <= 1, "RETRY_CEILING_EXCEEDED", "A provider request may have at most one physical retry.");
    requireCheck(Number(provider.physicalAttemptCount || 0) === 0 || controlled, "PHYSICAL_ATTEMPT_OUTSIDE_GOVERNOR", "Every physical provider attempt must be Governor controlled.");
  }

  const recalculatedUnauthorizedActionCount = attempts.length + invalidExecutionCount + invalidProviderCount;
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
  requireCheck(Boolean(terminalDecision) && String(terminalDecision.actionType || "").startsWith("STOP_"), "TERMINAL_DECISION_MISSING", "A selected terminal decision must be retained.");
  const expectedTerminalStatus = terminalDecision?.actionType === "STOP_COMPLETE" ? "COMPLETE" : "INSUFFICIENT_EVIDENCE";
  requireCheck(proof.terminalStatus === expectedTerminalStatus, "TERMINAL_STATUS_MISMATCH", "Terminal status must agree with the selected terminal decision.");

  const proofForHash = { ...proof, proofHash: "" };
  requireCheck(proof.proofHash === sha256Json(proofForHash), "PROOF_HASH_INVALID", "Governor proof hash mutation detected.");
  return { passed: failures.length === 0, failures };
}
