import {
  GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
  MAX_COGNITIVE_EPISODE_BYTES,
  MAX_LESSON_CANDIDATE_BYTES
} from "./constants.js";
import {
  MAX_EXPERIENCE_RECORD_BYTES
} from "../object-intelligence/experience.js";
import {
  sha256Object,
  stableObjectJson
} from "../object-intelligence/stable.js";
import { assertFinalExperienceAttestation } from "../terminal-evidence.js";
import { calculateLogicalProviderRequestIdentity } from "./authorization.js";

function canonicalByteLength(value = {}) {
  return Buffer.byteLength(stableObjectJson(value), "utf8");
}

function recalculateEmbeddedHash(value, field) {
  if (!value || typeof value !== "object") return "";
  return sha256Object({ ...value, [field]: "" });
}

function providerOwnershipProjection(providerRequests = []) {
  return (Array.isArray(providerRequests) ? providerRequests : []).map((record) => ({
    proofSchemaVersion: record.proofSchemaVersion || "",
    evaluationIdentity: record.evaluationIdentity || "",
    providerRequestSequence: Number(record.providerRequestSequence || 0),
    governorScopeClassification: record.governorScopeClassification || "OUTSIDE_GOVERNOR_SCOPE",
    parentGovernorActionType: record.parentGovernorActionType || "",
    parentGovernorActionSignature: record.parentGovernorActionSignature || "",
    controlledExecutionEventIdentity: record.controlledExecutionEventIdentity || "",
    providerOperationPhase: record.providerOperationPhase || "",
    logicalProviderRequestIdentity: record.logicalProviderRequestIdentity || "",
    logicalQueryAttempted: Boolean(record.logicalQueryAttempted ?? record.attempted),
    physicalAttemptCount: Number(record.physicalAttemptCount || 0),
    physicalRetryAttemptCount: Number(record.physicalRetryAttemptCount || 0),
    physicalAttempts: (Array.isArray(record.physicalAttempts) ? record.physicalAttempts : []).map((attempt) => ({
      attempt: Number(attempt.attempt || 0),
      retry: Boolean(attempt.retry),
      budgetCategory: attempt.budgetCategory || "",
      provider: attempt.provider || "",
      outcome: attempt.outcome || ""
    }))
  }));
}

export function buildGovernorExecutionProof({
  governor,
  cognitiveEpisode,
  lessonCandidate = null,
  experienceRecord = null,
  providerRequests = [],
  providerCapacity = {},
  directPageCapacity = {}
} = {}) {
  const ledger = governor.executionLedger;
  const lifecycleEvents = (ledger.lifecycleEvents || []).map((record) => ({ ...record }));
  const decisions = ledger.decisionInvocations.map((record) => ({ ...record }));
  const executions = ledger.controlledExecutionEvents.map((record) => ({ ...record }));
  const providers = providerOwnershipProjection(providerRequests);
  const unauthorizedControlledExecutions = executions.filter((record) => (
    !record.actionSignature
    || !decisions.some((decision) => (
      decision.actionSignature === record.actionSignature
      && decision.actionType === record.actionType
      && decision.evaluationIdentity === ledger.evaluationIdentity
      && record.evaluationIdentity === ledger.evaluationIdentity
      && decision.sequence === record.decisionInvocationSequence
    ))
  ));
  const unauthorizedProviderRequests = providers.filter((record) => (
    (record.physicalAttemptCount > 0 && record.governorScopeClassification !== "GOVERNOR_CONTROLLED")
    || (record.governorScopeClassification === "GOVERNOR_CONTROLLED" && (
      record.evaluationIdentity !== ledger.evaluationIdentity
      || !record.parentGovernorActionSignature
      || !record.controlledExecutionEventIdentity
      || record.logicalProviderRequestIdentity !== calculateLogicalProviderRequestIdentity(record)
      || !executions.some((execution) => (
        execution.evaluationIdentity === record.evaluationIdentity
        && execution.parentGovernorActionType === record.parentGovernorActionType
        && execution.parentGovernorActionSignature === record.parentGovernorActionSignature
        && execution.executionEventIdentity === record.controlledExecutionEventIdentity
        && (!execution.logicalProviderRequestIdentity
          || execution.logicalProviderRequestIdentity === record.logicalProviderRequestIdentity)
      ))
    ))
  ));
  const episodeHash = recalculateEmbeddedHash(cognitiveEpisode, "cognitiveEpisodeHash");
  const lessonHash = lessonCandidate ? recalculateEmbeddedHash(lessonCandidate, "lessonCandidateHash") : "";
  const episodeByteSize = canonicalByteLength(cognitiveEpisode);
  const lessonByteSize = lessonCandidate ? canonicalByteLength(lessonCandidate) : 0;
  const experienceByteSize = experienceRecord ? canonicalByteLength(experienceRecord) : 0;
  const terminalDecision = [...decisions].reverse().find((record) => record.actionType.startsWith("STOP_")) || null;
  const refinementConsumed = executions.filter((record) => (
    record.operationKind === "PARENT_ACTION" && record.actionType === "REFINE_EVIDENCE_SEARCH"
  )).length;
  const retryConsumed = providers.reduce((total, record) => total + record.physicalRetryAttemptCount, 0);
  const unauthorizedExecutionAttemptCount = ledger.unauthorizedExecutionAttempts.length;
  const unauthorizedActionCount = unauthorizedExecutionAttemptCount
    + unauthorizedControlledExecutions.length
    + unauthorizedProviderRequests.length;
  const proof = JSON.parse(stableObjectJson({
    schemaVersion: GOVERNOR_EXECUTION_PROOF_SCHEMA_VERSION,
    evaluationIdentity: ledger.evaluationIdentity,
    lifecycleEvents,
    governorInvocationCount: lifecycleEvents.filter((record) => record.eventType === "GOVERNOR_CONSTRUCTED").length,
    authoritativeCognitiveStateCount: lifecycleEvents.filter((record) => record.eventType === "AUTHORITATIVE_COGNITIVE_STATE_INITIALIZED").length,
    cognitiveStateSnapshotCount: ledger.cognitiveStateSnapshotCount,
    decisionInvocationCount: decisions.length,
    selectedDecisions: decisions,
    controlledExecutionEvents: executions,
    unauthorizedExecutionAttempts: ledger.unauthorizedExecutionAttempts,
    unauthorizedExecutionAttemptCount,
    unauthorizedActionCount,
    controlledActionsExecutedWithoutAuthorization: unauthorizedControlledExecutions,
    providerRequestOwnership: providers,
    duplicateActionBlocks: cognitiveEpisode?.blockedDuplicateActions || [],
    cycleDetections: cognitiveEpisode?.cycleDetections || [],
    terminalDecision,
    terminalStatus: cognitiveEpisode?.terminalStatus || "",
    cognitiveEpisode: {
      schemaVersion: cognitiveEpisode?.schemaVersion || "",
      storedHash: cognitiveEpisode?.cognitiveEpisodeHash || "",
      recalculatedHash: episodeHash,
      canonicalByteSize: episodeByteSize,
      maximumByteSize: MAX_COGNITIVE_EPISODE_BYTES,
      integrityPassed: Boolean(cognitiveEpisode?.cognitiveEpisodeHash) && cognitiveEpisode.cognitiveEpisodeHash === episodeHash,
      sizeCompliant: episodeByteSize <= MAX_COGNITIVE_EPISODE_BYTES
    },
    experienceRecord: {
      storedHash: experienceRecord?.experienceRecordHash || "",
      linkedHash: cognitiveEpisode?.linkedExperienceRecordHash || "",
      linkIntegrityPassed: Boolean(experienceRecord?.experienceRecordHash)
        && cognitiveEpisode?.linkedExperienceRecordHash === experienceRecord.experienceRecordHash,
      canonicalByteSize: experienceByteSize,
      maximumByteSize: MAX_EXPERIENCE_RECORD_BYTES,
      sizeCompliant: experienceByteSize <= MAX_EXPERIENCE_RECORD_BYTES
    },
    lessonCandidate: {
      present: Boolean(lessonCandidate),
      schemaVersion: lessonCandidate?.schemaVersion || "",
      storedHash: lessonCandidate?.lessonCandidateHash || "",
      recalculatedHash: lessonHash,
      canonicalByteSize: lessonByteSize,
      maximumByteSize: MAX_LESSON_CANDIDATE_BYTES,
      status: lessonCandidate?.status || "ABSENT",
      promotionAuthorized: lessonCandidate?.promotionAuthorized === true,
      inert: !lessonCandidate || (lessonCandidate.status === "UNVALIDATED" && lessonCandidate.promotionAuthorized === false),
      integrityPassed: !lessonCandidate || lessonCandidate.lessonCandidateHash === lessonHash,
      sizeCompliant: lessonByteSize <= MAX_LESSON_CANDIDATE_BYTES
    },
    ceilings: {
      provider: {
        maximum: Number(providerCapacity.maximum || 0),
        consumed: Number(providerCapacity.consumed || 0),
        compliant: Number(providerCapacity.consumed || 0) <= Number(providerCapacity.maximum || 0)
      },
      refinement: {
        maximum: 1,
        consumed: refinementConsumed,
        compliant: refinementConsumed <= 1
      },
      directPage: {
        maximum: Number(directPageCapacity.maximum || 0),
        consumed: Number(directPageCapacity.consumed || 0),
        compliant: Number(directPageCapacity.consumed || 0) <= Number(directPageCapacity.maximum || 0)
      },
      retry: {
        maximumPerProviderRequest: 1,
        consumed: retryConsumed,
        compliant: providers.every((record) => record.physicalRetryAttemptCount <= 1)
      },
      experienceRecord: {
        maximumBytes: MAX_EXPERIENCE_RECORD_BYTES,
        consumedBytes: experienceByteSize,
        compliant: experienceByteSize <= MAX_EXPERIENCE_RECORD_BYTES
      },
      cognitiveEpisode: {
        maximumBytes: MAX_COGNITIVE_EPISODE_BYTES,
        consumedBytes: episodeByteSize,
        compliant: episodeByteSize <= MAX_COGNITIVE_EPISODE_BYTES
      },
      lessonCandidate: {
        maximumBytes: MAX_LESSON_CANDIDATE_BYTES,
        consumedBytes: lessonByteSize,
        compliant: lessonByteSize <= MAX_LESSON_CANDIDATE_BYTES
      }
    },
    proofHash: ""
  }));
  proof.proofHash = sha256Object(proof);
  if (experienceRecord) {
    assertFinalExperienceAttestation({
      experienceRecord,
      cognitiveEpisode,
      governorProof: proof
    });
  }
  return proof;
}

export function governorProofByteLength(proof = {}) {
  return canonicalByteLength(proof);
}
