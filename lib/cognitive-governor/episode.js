import {
  boundedUniqueStrings,
  cleanObjectText,
  sanitizeStructuredRecord,
  sha256Object,
  stableObjectJson
} from "../object-intelligence/stable.js";
import {
  COGNITIVE_EPISODE_SCHEMA_VERSION,
  LESSON_CANDIDATE_SCHEMA_VERSION,
  MAX_COGNITIVE_ACTIONS,
  MAX_COGNITIVE_EPISODE_BYTES,
  MAX_LESSON_CANDIDATE_BYTES
} from "./constants.js";

function withHash(value, field) {
  const unhashed = { ...value, [field]: "" };
  return { ...unhashed, [field]: sha256Object(unhashed) };
}

function boundedEpisodeProjection(governor = {}, experienceRecordHash = "") {
  const lastState = governor.lastState || {};
  return sanitizeStructuredRecord({
    schemaVersion: COGNITIVE_EPISODE_SCHEMA_VERSION,
    evaluationIdentity: lastState.evaluationIdentity,
    objectMindStateId: lastState.objectMindStateId,
    objectMindSemanticHash: lastState.objectMindSemanticHash,
    submittedObjectFingerprint: lastState.submittedObjectFingerprint,
    knowledgeStateHashesEncountered: boundedUniqueStrings(governor.knowledgeStateHashes, MAX_COGNITIVE_ACTIONS + 1, 80),
    actionDecisions: governor.actionLedger.slice(0, MAX_COGNITIVE_ACTIONS).map((record) => ({
      sequence: record.sequence,
      actionType: record.actionType,
      actionSignature: record.actionSignature,
      inputCognitiveStateHash: record.inputCognitiveStateHash,
      inputKnowledgeStateHash: record.inputKnowledgeStateHash,
      targetIdentity: record.targetIdentity,
      reasonCodes: record.reasonCodes,
      expectedInformationTarget: record.expectedInformationTarget,
      outcomeCode: record.outcomeCode,
      outputCognitiveStateHash: record.outputCognitiveStateHash,
      outputKnowledgeStateHash: record.outputKnowledgeStateHash,
      materialKnowledgeChanged: record.materialKnowledgeChanged
    })),
    blockedDuplicateActions: governor.blockedActions.slice(0, MAX_COGNITIVE_ACTIONS),
    cycleDetections: governor.cycleDetections.slice(0, MAX_COGNITIVE_ACTIONS),
    stopDecision: governor.stopDecision,
    finalUnresolvedDiscriminatorIdentities: (lastState.unresolvedIdentityDiscriminators || [])
      .slice(0, 12)
      .map((value) => sha256Object(value).slice(0, 20)),
    requestedCustomerInput: governor.requestedCustomerInput,
    customerInputState: lastState.customerInputState,
    evidenceSufficiency: lastState.evidenceSufficiency,
    safetyState: lastState.safetyState,
    executiveReadiness: lastState.executiveReadiness,
    terminalReasonCodes: governor.stopDecision?.reasonCodes || [],
    terminalStatus: governor.stopDecision?.actionType === "STOP_COMPLETE"
      ? "COMPLETE"
      : governor.stopDecision?.actionType === "STOP_INSUFFICIENT_EVIDENCE"
        ? "INSUFFICIENT_EVIDENCE"
        : "NONTERMINAL",
    linkedExperienceRecordHash: cleanObjectText(experienceRecordHash, 80),
    cognitiveEpisodeHash: ""
  }, { maximumArrayItems: MAX_COGNITIVE_ACTIONS + 1, maximumTextCharacters: 240 });
}

export function buildCognitiveEpisode(governor = {}, { experienceRecordHash = "" } = {}) {
  let episode = withHash(boundedEpisodeProjection(governor, experienceRecordHash), "cognitiveEpisodeHash");
  if (Buffer.byteLength(stableObjectJson(episode), "utf8") > MAX_COGNITIVE_EPISODE_BYTES) {
    episode = withHash({
      ...episode,
      actionDecisions: episode.actionDecisions.map((record) => ({
        sequence: record.sequence,
        actionType: record.actionType,
        actionSignature: record.actionSignature,
        reasonCodes: record.reasonCodes,
        outcomeCode: record.outcomeCode,
        inputKnowledgeStateHash: record.inputKnowledgeStateHash,
        outputKnowledgeStateHash: record.outputKnowledgeStateHash,
        materialKnowledgeChanged: record.materialKnowledgeChanged
      })),
      blockedDuplicateActions: episode.blockedDuplicateActions.map((record) => ({
        actionType: record.actionType,
        actionSignature: record.actionSignature,
        knowledgeStateHash: record.knowledgeStateHash,
        reasonCodes: record.reasonCodes
      }))
    }, "cognitiveEpisodeHash");
  }
  if (Buffer.byteLength(stableObjectJson(episode), "utf8") > MAX_COGNITIVE_EPISODE_BYTES) {
    throw new Error("Cognitive Episode exceeds its hard size ceiling.");
  }
  return episode;
}

export function buildObservedFailureCognitiveEpisode(governor = {}) {
  return buildCognitiveEpisode(governor, { experienceRecordHash: "" });
}

function lessonFailureCategory(episode = {}) {
  if (episode.cycleDetections?.length) return "REPEATED_UNCHANGED_KNOWLEDGE_STATE";
  if (episode.blockedDuplicateActions?.length) return "DUPLICATE_ACTION_ATTEMPT";
  if (episode.requestedCustomerInput) return "MISSING_CUSTOMER_DISCRIMINATOR";
  if (episode.terminalStatus === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_VERIFIED_EVIDENCE";
  return "";
}

export function buildLessonCandidate(episode = {}) {
  const failureCategory = lessonFailureCategory(episode);
  if (!failureCategory) return null;
  const value = sanitizeStructuredRecord({
    schemaVersion: LESSON_CANDIDATE_SCHEMA_VERSION,
    cognitiveEpisodeHash: cleanObjectText(episode.cognitiveEpisodeHash, 80),
    subsystem: episode.cycleDetections?.length || episode.blockedDuplicateActions?.length
      ? "COGNITIVE_GOVERNOR"
      : "IDENTITY_EVIDENCE_ACQUISITION",
    generalizedFailureCategory: failureCategory,
    generalizedPreconditions: boundedUniqueStrings([
      episode.stopDecision?.reasonCodes,
      episode.actionDecisions?.flatMap((record) => record.reasonCodes)
    ].flat(), 12, 80),
    missingDiscriminatorClass: cleanObjectText(episode.requestedCustomerInput?.requestType, 80),
    actionSequenceSummary: (episode.actionDecisions || []).slice(0, MAX_COGNITIVE_ACTIONS).map((record) => ({
      actionType: record.actionType,
      reasonCodes: record.reasonCodes,
      outcomeCode: record.outcomeCode,
      materialKnowledgeChanged: record.materialKnowledgeChanged
    })),
    stopReason: cleanObjectText(episode.stopDecision?.reasonCodes?.[0] || episode.terminalStatus, 80),
    noFurtherLegalActionEvidence: {
      blockedDuplicateActionCount: episode.blockedDuplicateActions?.length || 0,
      cycleDetectionCount: episode.cycleDetections?.length || 0,
      unresolvedDiscriminatorCount: episode.finalUnresolvedDiscriminatorIdentities?.length || 0
    },
    proposedEngineeringReviewArea: failureCategory,
    status: "UNVALIDATED",
    supportingEpisodeCount: 1,
    generalizationRequired: true,
    promotionAuthorized: false,
    lessonCandidateHash: ""
  }, { maximumArrayItems: MAX_COGNITIVE_ACTIONS, maximumTextCharacters: 160 });
  const lesson = withHash(value, "lessonCandidateHash");
  if (Buffer.byteLength(stableObjectJson(lesson), "utf8") > MAX_LESSON_CANDIDATE_BYTES) {
    throw new Error("Lesson Candidate exceeds its hard size ceiling.");
  }
  return lesson;
}

export function buildObservedFailureLessonCandidate(episode = {}, {
  failureCategory = "GOVERNED_OPERATION_FAILURE",
  subsystem = "PRODUCT_HANDLER"
} = {}) {
  const category = cleanObjectText(failureCategory, 120) || "GOVERNED_OPERATION_FAILURE";
  const value = sanitizeStructuredRecord({
    schemaVersion: LESSON_CANDIDATE_SCHEMA_VERSION,
    cognitiveEpisodeHash: cleanObjectText(episode.cognitiveEpisodeHash, 80),
    subsystem: cleanObjectText(subsystem, 80) || "PRODUCT_HANDLER",
    generalizedFailureCategory: category,
    generalizedPreconditions: boundedUniqueStrings([
      episode.stopDecision?.reasonCodes,
      episode.actionDecisions?.flatMap((record) => record.reasonCodes)
    ].flat(), 12, 80),
    missingDiscriminatorClass: "",
    actionSequenceSummary: (episode.actionDecisions || []).slice(0, MAX_COGNITIVE_ACTIONS).map((record) => ({
      actionType: record.actionType,
      reasonCodes: record.reasonCodes,
      outcomeCode: record.outcomeCode,
      materialKnowledgeChanged: record.materialKnowledgeChanged
    })),
    stopReason: category,
    noFurtherLegalActionEvidence: {
      blockedDuplicateActionCount: episode.blockedDuplicateActions?.length || 0,
      cycleDetectionCount: episode.cycleDetections?.length || 0,
      unresolvedDiscriminatorCount: episode.finalUnresolvedDiscriminatorIdentities?.length || 0
    },
    proposedEngineeringReviewArea: category,
    status: "UNVALIDATED",
    supportingEpisodeCount: 1,
    generalizationRequired: true,
    promotionAuthorized: false,
    lessonCandidateHash: ""
  }, { maximumArrayItems: MAX_COGNITIVE_ACTIONS, maximumTextCharacters: 160 });
  const lesson = withHash(value, "lessonCandidateHash");
  if (Buffer.byteLength(stableObjectJson(lesson), "utf8") > MAX_LESSON_CANDIDATE_BYTES) {
    throw new Error("Observed failure Lesson Candidate exceeds its hard size ceiling.");
  }
  return lesson;
}

export function cognitiveEpisodeByteLength(value = {}) {
  return Buffer.byteLength(stableObjectJson(value), "utf8");
}

export function lessonCandidateByteLength(value = {}) {
  return Buffer.byteLength(stableObjectJson(value), "utf8");
}
