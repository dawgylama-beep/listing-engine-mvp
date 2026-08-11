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

  async append(record) {
    validateMemoryRecord(record);
    await writeExclusiveJson(path.join(this.root, `${record.memoryId}.json`), record);
    return record;
  }

  async retrieve({ episodeId, queryFacets, queryText, retrievalEngine = "STRUCTURED_TOKEN_OVERLAP_V1", createdAt }) {
    canonicalIso(createdAt, "retrieval time");
    const records = await this.list();
    const queryTokens = tokenize(`${queryText} ${Object.values(queryFacets).flat().join(" ")}`);
    const candidates = records.map((record) => {
      const recordText = [record.observedFailurePattern, record.generalizedRule, record.recurrenceSignature, ...(record.applicabilityBoundaries || [])].join(" ");
      const semanticScore = overlap(queryTokens, tokenize(recordText));
      const structuredScore = Object.entries(queryFacets).reduce((score, [key, value]) => score + (stableContains(record[key], value) ? 1 : 0), 0) / Math.max(1, Object.keys(queryFacets).length);
      return { memoryId: record.memoryId, status: record.status, candidateScore: Number((semanticScore * 0.6 + structuredScore * 0.4).toFixed(6)) };
    }).sort((a, b) => b.candidateScore - a.candidateScore || a.memoryId.localeCompare(b.memoryId));
    const selected = candidates.filter((item) => item.candidateScore > 0).slice(0, 3);
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
      rejectedCandidates: candidates.filter((item) => !selected.includes(item)).map((item) => ({ memoryId: item.memoryId, reason: "LOWER_OR_ZERO_RELEVANCE" })),
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
