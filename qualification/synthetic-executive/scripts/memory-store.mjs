import assert from "node:assert/strict";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { assertHash, canonicalIso, readJson, seal, sha256Json, writeExclusiveJson } from "./protocol.mjs";

export const MEMORY_SCHEMA_VERSION = "1.0";
export const MEMORY_TYPES = Object.freeze(["EPISODIC_OBSERVATION", "GENERALIZED_LESSON_CANDIDATE", "RECURRENCE_PATTERN", "ACTION_OUTCOME", "LESSON_SUPERSESSION"]);
export const LESSON_STATUSES = Object.freeze(["CANDIDATE", "VALIDATED_BY_TRANSFER", "SUPERSEDED", "REVOKED"]);

const tokenize = (value) => new Set(String(value || "").toLowerCase().match(/[a-z0-9]{3,}/g) || []);
const overlap = (left, right) => {
  if (left.size === 0 || right.size === 0) return 0;
  let shared = 0;
  for (const token of left) if (right.has(token)) shared += 1;
  return shared / new Set([...left, ...right]).size;
};

export function sealMemoryRecord(core) {
  const record = { ...core, schemaVersion: MEMORY_SCHEMA_VERSION };
  delete record.contentHash;
  assert.ok(MEMORY_TYPES.includes(record.memoryType));
  if (record.memoryType === "GENERALIZED_LESSON_CANDIDATE") assert.equal(record.status, "CANDIDATE", "single-episode lesson must begin as CANDIDATE");
  return seal(record);
}

export function validateMemoryRecord(record) {
  assert.equal(record.schemaVersion, MEMORY_SCHEMA_VERSION);
  assert.ok(MEMORY_TYPES.includes(record.memoryType));
  assert.ok(Array.isArray(record.sourceEpisodeIds) && record.sourceEpisodeIds.length > 0);
  if (record.sourceEpisodeSequence !== undefined) {
    assert.ok(Number.isInteger(record.sourceEpisodeSequence) && record.sourceEpisodeSequence > 0);
  }
  assert.ok(Array.isArray(record.evidenceReferences) && record.evidenceReferences.length > 0);
  assertHash(record.evidenceAggregateHash, "memory evidence aggregate");
  assert.ok(Array.isArray(record.applicabilityBoundaries));
  assert.ok(Array.isArray(record.explicitNonApplicabilityConditions));
  assert.ok(Array.isArray(record.prohibitedActions));
  assert.ok(Array.isArray(record.requiredProofBeforeAdvancement));
  assert.ok(Array.isArray(record.predecessorMemoryIds));
  assert.ok(LESSON_STATUSES.includes(record.status));
  assert.equal(Number.isFinite(record.confidence) && record.confidence >= 0 && record.confidence <= 1, true);
  const core = structuredClone(record); delete core.contentHash;
  assert.equal(sha256Json(core), record.contentHash);
  return true;
}

export class ExecutiveMemoryStore {
  constructor(root) { this.root = path.resolve(root); }

  async initializeEmpty() {
    await mkdir(this.root, { recursive: true });
    assert.equal((await readdir(this.root)).filter((name) => name.endsWith(".json")).length, 0, "qualification memory must start empty");
  }

  async list() {
    await mkdir(this.root, { recursive: true });
    const names = (await readdir(this.root)).filter((name) => name.endsWith(".json")).sort();
    const records = await Promise.all(names.map((name) => readJson(path.join(this.root, name))));
    for (const record of records) validateMemoryRecord(record);
    return records;
  }

  async append(record, { allowIdenticalReplay = false } = {}) {
    validateMemoryRecord(record);
    const recordPath = path.join(this.root, `${record.memoryId}.json`);
    try {
      await writeExclusiveJson(recordPath, record);
    } catch (error) {
      if (!allowIdenticalReplay || error?.code !== "EEXIST") throw error;
      const existing = await readJson(recordPath);
      validateMemoryRecord(existing);
      assert.equal(existing.contentHash, record.contentHash, "memory replay identity differs");
    }
    return record;
  }

  async retrieve({ episodeId, queryFacets, queryText, retrievalEngine = "STRUCTURED_TOKEN_OVERLAP_V1", createdAt }) {
    canonicalIso(createdAt, "retrieval time");
    const records = await this.list();
    const queryTokens = tokenize(`${queryText} ${Object.values(queryFacets).flat().join(" ")}`);
    const revokedMemoryIds = new Set(records
      .filter((record) => record.status === "REVOKED")
      .flatMap((record) => record.predecessorMemoryIds || []));
    const candidates = records.map((record) => {
      const recordText = [record.observedFailurePattern, record.generalizedRule, record.recurrenceSignature, ...(record.applicabilityBoundaries || [])].join(" ");
      const semanticScore = overlap(queryTokens, tokenize(recordText));
      const structuredScore = Object.entries(queryFacets).reduce((score, [key, value]) => score + (stableContains(record[key], value) ? 1 : 0), 0) / Math.max(1, Object.keys(queryFacets).length);
      return { memoryId: record.memoryId, status: record.status, candidateScore: Number((semanticScore * 0.6 + structuredScore * 0.4).toFixed(6)) };
    }).sort((a, b) => b.candidateScore - a.candidateScore || a.memoryId.localeCompare(b.memoryId));
    const selected = candidates.filter((item) => (
      item.candidateScore > 0
      && item.status !== "REVOKED"
      && !revokedMemoryIds.has(item.memoryId)
    )).slice(0, 3);
    const empty = selected.length === 0;
    const core = {
      schemaVersion: "1.0",
      receiptType: "EXECUTIVE_MEMORY_RETRIEVAL",
      currentEpisodeId: episodeId,
      queryHash: sha256Json({ queryFacets, queryText }),
      structuredQueryFacets: queryFacets,
      candidateMemoryIds: candidates.map((item) => item.memoryId),
      candidateScores: candidates,
      selectedMemoryIds: selected.map((item) => item.memoryId),
      rejectedCandidates: candidates.filter((item) => !selected.includes(item)).map((item) => ({
        memoryId: item.memoryId,
        reason: item.status === "REVOKED" || revokedMemoryIds.has(item.memoryId)
          ? "ROLLED_BACK_OR_REVOKED"
          : "LOWER_OR_ZERO_RELEVANCE"
      })),
      resultClassification: empty ? "VALID_EMPTY" : "MATCHES_FOUND",
      recurrencePermitted: !empty,
      novelFailureClassificationPermitted: true,
      boundedTaskConstructionPermitted: true,
      fabricatedSimilarityProhibited: true,
      retrievalReasonSummary: selected.length ? "Selected by structured facets and token-overlap similarity; status preserved." : "Valid empty result: no candidate met the positive relevance threshold; recurrence is unavailable while evidence-based novel classification remains legal.",
      retrievalEngine,
      retrievalEngineVersion: "1.0",
      createdAt
    };
    return seal(core, "receiptHash");
  }
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === "string" && value.length > 0))];
}

export async function commitGovernedExecutiveMemoryTransition({
  store,
  runIdentity,
  episodeId,
  episodeSequence,
  authoritativeResponse,
  responseAssembly,
  retrievalReceipt,
  visibleEvidenceIds,
  mentorDecisionIdentity,
  expectedBeforeMemoryIds = [],
  createdAt
}) {
  assert.ok(store instanceof ExecutiveMemoryStore, "existing Executive Memory Store required");
  canonicalIso(createdAt, "memory transition time");
  assertHash(mentorDecisionIdentity, "mentor decision identity");
  assertHash(retrievalReceipt?.receiptHash, "memory retrieval receipt");
  assert.equal(retrievalReceipt.currentEpisodeId, episodeId, "memory retrieval episode differs");
  assert.ok(Number.isInteger(episodeSequence) && episodeSequence > 0, "forward memory episode sequence required");
  assert.equal(responseAssembly?.mentorDecisionIdentity, mentorDecisionIdentity, "memory assembly mentor identity differs");
  assert.equal(responseAssembly?.responseAssemblyHash, sha256Json(authoritativeResponse), "memory response assembly differs");
  assert.equal(typeof responseAssembly?.lessonAuthorized, "boolean", "governed lesson decision required");
  const existing = await store.list();
  const before = [];
  const replay = [];
  for (const record of existing) {
    assert.equal(record.runIdentity, runIdentity, "Executive Memory cannot cross run identities");
    for (const sourceEpisodeId of record.sourceEpisodeIds) {
      assert.equal(typeof sourceEpisodeId, "string", "Executive Memory source episode identity required");
      assert.ok(record.sourceEpisodeSequence <= episodeSequence, "Executive Memory must flow only forward");
      (record.sourceEpisodeSequence === episodeSequence ? replay : before).push(record);
    }
  }
  assert.deepEqual(before.map((record) => record.memoryId), expectedBeforeMemoryIds, "Executive Memory pre-case identity changed");
  assert.ok(replay.length <= 1, "multiple same-episode memory records are prohibited");

  const selectedMemoryIds = uniqueStrings(retrievalReceipt.selectedMemoryIds);
  const applicableMemoryId = authoritativeResponse.applicableMemoryId;
  if (applicableMemoryId !== null) {
    assert.equal(selectedMemoryIds.includes(applicableMemoryId), true, "response applied unselected Executive Memory");
  }
  if (["NOVEL", "DECLARE_NOVEL_FAILURE", "INSUFFICIENT_EVIDENCE", "DECLARE_INSUFFICIENT_EVIDENCE"].includes(authoritativeResponse.classificationType)) {
    assert.equal(applicableMemoryId, null, "novel or insufficient evidence cannot force an analogy");
  }

  const visible = new Set(uniqueStrings(visibleEvidenceIds));
  const evidenceReferences = uniqueStrings(authoritativeResponse.evidenceReferences);
  const requiredEvidenceReferences = uniqueStrings(authoritativeResponse.requiredEvidenceReferences);
  const evidenceAuthorized = evidenceReferences.length > 0
    && requiredEvidenceReferences.length > 0
    && [...evidenceReferences, ...requiredEvidenceReferences].every((item) => visible.has(item));
  const lessonRequested = responseAssembly.lessonAuthorized;
  assert.equal(authoritativeResponse.memoryStatus === "CANDIDATE", lessonRequested, "memory status differs from governed lesson decision");
  const rejectionReasons = [
    !authoritativeResponse.evidenceSufficient ? "INSUFFICIENT_EVIDENCE" : "",
    !evidenceAuthorized ? "EVIDENCE_NOT_AUTHORIZED" : "",
    authoritativeResponse.unauthorizedEligibleActionExpansion ? "UNAUTHORIZED_ACTION_EXPANSION" : "",
    !authoritativeResponse.selectedActionCompatible ? "MENTOR_ACTION_INCOMPATIBLE" : "",
    authoritativeResponse.forbiddenRecommendationCount !== 0 ? "FORBIDDEN_RECOMMENDATION" : "",
    authoritativeResponse.unsupportedCitationCount !== 0 ? "UNSUPPORTED_CITATION" : ""
  ].filter(Boolean);

  let acceptedRecord = null;
  if (lessonRequested && rejectionReasons.length === 0) {
    const core = {
      memoryType: "GENERALIZED_LESSON_CANDIDATE",
      memoryId: `ke-executive-memory-${String(episodeSequence).padStart(6, "0")}-${sha256Json({
        episodeId,
        evidenceReferences,
        failureClass: authoritativeResponse.failureClass,
        generalizedRule: authoritativeResponse.rationale,
        mentorDecisionIdentity
      }).slice(0, 20)}`,
      sourceEpisodeIds: [episodeId],
      sourceEpisodeSequence: episodeSequence,
      evidenceReferences,
      evidenceAggregateHash: sha256Json(evidenceReferences),
      observedFailurePattern: authoritativeResponse.failureClass,
      generalizedRule: authoritativeResponse.rationale,
      triggeringConditions: uniqueStrings([authoritativeResponse.classificationType, authoritativeResponse.failureScope]),
      applicabilityBoundaries: uniqueStrings([authoritativeResponse.authorityClass, ...authoritativeResponse.recommendedOperations]),
      explicitNonApplicabilityConditions: uniqueStrings(authoritativeResponse.prohibitedOperations),
      recurrenceSignature: `${authoritativeResponse.failureClass}:${authoritativeResponse.classificationType}`,
      recommendedActionPattern: authoritativeResponse.nextAction,
      prohibitedActions: uniqueStrings(authoritativeResponse.prohibitedOperations),
      requiredProofBeforeAdvancement: requiredEvidenceReferences,
      authorityNormallyRequired: authoritativeResponse.authorityClass,
      confidence: authoritativeResponse.evidenceSufficient ? 0.8 : 0.3,
      unresolvedUncertainty: uniqueStrings([authoritativeResponse.uncertaintyCompatibility]),
      status: "CANDIDATE",
      predecessorMemoryIds: applicableMemoryId ? [applicableMemoryId] : [],
      runIdentity,
      mentorDecisionIdentity,
      createdAt
    };
    acceptedRecord = sealMemoryRecord(core);
    if (replay.length) assert.equal(replay[0].contentHash, acceptedRecord.contentHash, "memory replay candidate changed");
    await store.append(acceptedRecord, { allowIdenticalReplay: true });
  } else {
    assert.equal(replay.length, 0, "unexpected same-episode memory record exists");
  }

  const after = await store.list();
  const beforeIds = before.map((record) => record.memoryId);
  const afterIds = after.map((record) => record.memoryId);
  assert.deepEqual(afterIds.slice(0, beforeIds.length), beforeIds, "Executive Memory history changed");
  return Object.freeze({
    runIdentity,
    episodeId,
    mentorDecisionIdentity,
    retrievalReceiptHash: retrievalReceipt.receiptHash,
    beforeMemoryIds: Object.freeze(beforeIds),
    selectedMemoryIds: Object.freeze(selectedMemoryIds),
    applicableMemoryId,
    analogyDisposition: applicableMemoryId
      ? "GOVERNED_MEMORY_APPLIED"
      : selectedMemoryIds.length > 0
        ? "CANDIDATE_ANALOGY_REJECTED_OR_NOT_APPLIED"
        : "NO_PRIOR_MEMORY_SELECTED",
    lessonFormation: lessonRequested ? "REQUESTED" : "NOT_REQUESTED",
    lessonDisposition: acceptedRecord ? "ACCEPTED_CANDIDATE" : lessonRequested ? "REJECTED" : "NOT_APPLICABLE",
    lessonRejectionReasons: Object.freeze(rejectionReasons),
    acceptedMemoryId: acceptedRecord?.memoryId || null,
    acceptedMemoryHash: acceptedRecord?.contentHash || null,
    afterMemoryIds: Object.freeze(afterIds),
    createdAt
  });
}

function stableContains(recordValue, queryValue) {
  const haystack = JSON.stringify(recordValue || "").toLowerCase();
  const values = Array.isArray(queryValue) ? queryValue : [queryValue];
  return values.some((value) => haystack.includes(String(value).toLowerCase()));
}

export function validateTransferPromotion({ record, sourceEpisodeCohort, transferEvaluation }) {
  validateMemoryRecord(record);
  assert.equal(record.status, "CANDIDATE");
  assert.equal(sourceEpisodeCohort, "ANALOGOUS_HELD_OUT", "lesson promotion requires an independently held-out analogous episode");
  assert.equal(transferEvaluation.classification, "VALID_PASS");
  assert.equal(transferEvaluation.memoryApplied, true);
  return Object.freeze({ permittedStatus: "VALIDATED_BY_TRANSFER", proofHash: sha256Json(transferEvaluation) });
}
