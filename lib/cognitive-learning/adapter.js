import { createHmac, randomBytes } from "node:crypto";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ExecutiveMemoryStore,
  sealMemoryRecord,
  validateMemoryRecord
} from "../../qualification/synthetic-executive/scripts/memory-store.mjs";
import { sha256Object, stableObjectJson } from "../object-intelligence/stable.js";

export const GOVERNED_LEARNING_SCHEMA_VERSION = "1.0";
export const GOVERNED_LEARNING_ADAPTER_IDENTITY = "KATHERINES_EYE_GOVERNED_LEARNING_ADAPTER_V1";
export const SCC_LEARNING_ENGINE_SOURCE = Object.freeze({
  packageVersion: "0.1.1",
  engineSha256: "eff03944684aba6f2193d21f38fdab975346096b898e2172e10a0e5ecd62f9e8",
  ledgerSha256: "b83ada125b4e7df2c58572079f3e22f41bc291ac207e90c297b9433d21d02423",
  validationSha256: "4e5d08321e008a72d38056f23a5a241776bd25927c15186f8faef736ca2e71fd",
  canonicalJsonSha256: "e4f61c3e2376536af72b6df55226d64418cf4215811ccb7c8bdff8a629a3f4ca",
  strictJsonSha256: "a84a0648397f5e7ff23dfa94460945d523f7d8a1bf07adc0dc306b75e458a082"
});

const GENESIS = "GENESIS";
const runtimeAuthorities = new WeakMap();

export class GovernedLearningError extends Error {
  constructor(code, detail = "") {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "GovernedLearningError";
    this.code = code;
  }
}

function refuse(code, detail) {
  throw new GovernedLearningError(code, detail);
}

function cleanString(value, maximum = 240) {
  const text = String(value || "").trim();
  if (!text || Array.from(text).length > maximum) refuse("LEARNING_TEXT_INVALID");
  return text;
}

function cleanStrings(values, { maximumItems = 32, maximumCharacters = 240, allowEmpty = false } = {}) {
  if (!Array.isArray(values)) refuse("LEARNING_ARRAY_REQUIRED");
  const output = [...new Set(values.map((value) => cleanString(value, maximumCharacters)))].sort();
  if ((!allowEmpty && output.length === 0) || output.length > maximumItems) refuse("LEARNING_ARRAY_CARDINALITY");
  return output;
}

function exactObject(value, required, optional = []) {
  if (!value || typeof value !== "object" || Array.isArray(value)) refuse("LEARNING_OBJECT_REQUIRED");
  const allowed = new Set([...required, ...optional]);
  if (Object.keys(value).some((key) => !allowed.has(key))) refuse("LEARNING_UNKNOWN_FIELD");
  if (required.some((key) => !Object.hasOwn(value, key))) refuse("LEARNING_MISSING_FIELD");
  return value;
}

function score(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    refuse("LEARNING_SCORE_INVALID", label);
  }
  return value;
}

function violationCount(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) refuse("LEARNING_VIOLATION_COUNT_INVALID", label);
  return value;
}

function canonicalIso(value) {
  if (typeof value !== "string" || new Date(value).toISOString() !== value) refuse("LEARNING_TIME_INVALID");
  return value;
}

function hmac(secret, domain, value) {
  return createHmac("sha256", secret)
    .update(domain, "utf8")
    .update("\0")
    .update(stableObjectJson(value), "utf8")
    .digest("hex");
}

function pathsFor(root) {
  const resolved = path.resolve(root);
  return {
    root: resolved,
    metadata: path.join(resolved, "workspace.json"),
    secret: path.join(resolved, "private", "hmac.key"),
    ledger: path.join(resolved, "ledger", "events.jsonl"),
    lock: path.join(resolved, ".writer.lock"),
    memory: path.join(resolved, "executive-memory")
  };
}

function assertRuntimeAuthority(governor, runtime) {
  if (!governor || !runtime || runtimeAuthorities.get(runtime) !== governor) {
    refuse("GOVERNOR_LEARNING_AUTHORITY_REQUIRED");
  }
  if (runtime.runtimeIdentity !== "KATHERINES_EYE_CANONICAL_COGNITIVE_RUNTIME_V1") {
    refuse("CANONICAL_RUNTIME_REQUIRED");
  }
  if (runtime.decision?.executionPermitted === false) refuse("GOVERNOR_DECISION_NOT_EXECUTABLE");
  return true;
}

export function registerGovernedLearningRuntimeAuthority(governor, runtime) {
  if (!governor || !runtime || runtime.decision?.canonicalDecision !== runtime.mentorDecision) {
    refuse("CANONICAL_RUNTIME_AUTHORITY_INVALID");
  }
  runtimeAuthorities.set(runtime, governor);
  return runtime;
}

function transitionRecords(records) {
  const revoked = new Set();
  for (const record of records) {
    if (record.status === "REVOKED") {
      for (const predecessor of record.predecessorMemoryIds || []) revoked.add(predecessor);
    }
  }
  const promoted = new Map(records
    .filter((record) => record.status === "VALIDATED_BY_TRANSFER" && !revoked.has(record.memoryId))
    .map((record) => [record.memoryId, record]));
  const candidates = new Map(records
    .filter((record) => record.status === "CANDIDATE")
    .map((record) => [record.memoryId, record]));
  return { revoked, promoted, candidates };
}

export function governLearningContext({ governor, executiveMemoryContext = {} } = {}) {
  const records = Array.isArray(executiveMemoryContext.records) ? executiveMemoryContext.records : [];
  for (const record of records) validateMemoryRecord(record);
  const requested = cleanStrings(executiveMemoryContext.selectedMemoryIds || [], {
    maximumItems: 16,
    maximumCharacters: 160,
    allowEmpty: true
  });
  const byId = new Map(records.map((record) => [record.memoryId, record]));
  if (requested.some((memoryId) => !byId.has(memoryId))) refuse("UNMANAGED_EXECUTIVE_MEMORY_SELECTION");
  const { promoted, candidates } = transitionRecords(records);
  const trial = executiveMemoryContext.learningMode === "GOVERNED_TRIAL";
  const trialAuthorityValid = trial
    && executiveMemoryContext.trialAuthorization?.governorIdentity === governor?.governorIdentity
    && executiveMemoryContext.trialAuthorization?.authorityType === "GOVERNOR_QUALIFICATION_TRIAL"
    && Array.isArray(executiveMemoryContext.trialAuthorization?.candidateMemoryIds);
  const authorizedCandidateIds = new Set(trialAuthorityValid
    ? executiveMemoryContext.trialAuthorization.candidateMemoryIds
    : []);
  const selectedMemoryIds = requested.filter((memoryId) => (
    promoted.has(memoryId) || (trialAuthorityValid && candidates.has(memoryId) && authorizedCandidateIds.has(memoryId))
  ));
  const rejectedMemoryIds = requested.filter((memoryId) => !selectedMemoryIds.includes(memoryId));
  const selectedRecords = selectedMemoryIds.map((memoryId) => byId.get(memoryId));
  const recommendedActionIds = [...new Set(selectedRecords
    .map((record) => record.recommendedActionPattern)
    .filter((value) => typeof value === "string" && value.length > 0))].sort();
  return Object.freeze({
    adapterIdentity: GOVERNED_LEARNING_ADAPTER_IDENTITY,
    memoryContext: {
      ...executiveMemoryContext,
      selectedMemoryIds
    },
    selectedMemoryIds: Object.freeze(selectedMemoryIds),
    rejectedMemoryIds: Object.freeze(rejectedMemoryIds),
    appliedLessonIds: Object.freeze(selectedMemoryIds.filter((memoryId) => promoted.has(memoryId))),
    trialCandidateIds: Object.freeze(selectedMemoryIds.filter((memoryId) => candidates.has(memoryId))),
    recommendedActionIds: Object.freeze(recommendedActionIds),
    candidateInfluencePermitted: trialAuthorityValid,
    providerLifecycleAuthority: false
  });
}

function trialMetrics(trials) {
  if (!Array.isArray(trials) || trials.length < 3 || trials.length > 100) {
    refuse("QUALIFICATION_CASE_CARDINALITY");
  }
  const seen = new Set();
  const normalized = trials.map((trial, index) => {
    exactObject(trial, [
      "caseId", "beforeScore", "afterScore", "beforeViolations", "afterViolations", "evidenceRefs"
    ]);
    const caseId = cleanString(trial.caseId, 120);
    if (seen.has(caseId)) refuse("QUALIFICATION_CASE_DUPLICATE");
    seen.add(caseId);
    return {
      caseId,
      beforeScore: score(trial.beforeScore, `trials[${index}].beforeScore`),
      afterScore: score(trial.afterScore, `trials[${index}].afterScore`),
      beforeViolations: violationCount(trial.beforeViolations, `trials[${index}].beforeViolations`),
      afterViolations: violationCount(trial.afterViolations, `trials[${index}].afterViolations`),
      evidenceRefs: cleanStrings(trial.evidenceRefs)
    };
  });
  const improvements = normalized.map((trial) => trial.afterScore - trial.beforeScore);
  return {
    trials: normalized,
    meanImprovement: Number((improvements.reduce((sum, value) => sum + value, 0) / improvements.length).toFixed(12)),
    worstImprovement: Number(Math.min(...improvements).toFixed(12)),
    violationDelta: normalized.reduce((sum, trial) => sum + trial.afterViolations - trial.beforeViolations, 0)
  };
}

function deriveState(events) {
  const state = {
    failures: new Map(),
    candidates: new Map(),
    qualifications: new Map(),
    lessons: new Map(),
    applications: new Map(),
    rollbacks: new Map(),
    retentions: new Map(),
    lastEpisodeSequence: 0
  };
  let pendingRollback = null;
  for (const event of events) {
    const payload = event.payload;
    if (pendingRollback && event.event_type !== "LESSON_ROLLED_BACK") refuse("ROLLBACK_EVENT_MISSING");
    switch (event.event_type) {
      case "FAILURE_RECORDED":
        if (state.failures.has(payload.failure_id)) refuse("FAILURE_DUPLICATE");
        state.failures.set(payload.failure_id, payload);
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        break;
      case "MENTOR_DIAGNOSIS_RECORDED":
        if (!state.failures.has(payload.failure_id)) refuse("DIAGNOSIS_FAILURE_REFERENCE");
        break;
      case "LESSON_CANDIDATE_RECORDED":
        if (!state.failures.has(payload.failure_id) || state.candidates.has(payload.candidate_id)) {
          refuse("CANDIDATE_REFERENCE");
        }
        state.candidates.set(payload.candidate_id, payload);
        break;
      case "QUALIFICATION_DECIDED": {
        if (!state.candidates.has(payload.candidate_id) || state.qualifications.has(payload.qualification_id)) {
          refuse("QUALIFICATION_REFERENCE");
        }
        const metrics = trialMetrics(payload.trials);
        const reasons = [];
        if (metrics.meanImprovement < payload.minimum_mean_improvement) reasons.push("MEAN_IMPROVEMENT_BELOW_THRESHOLD");
        if (metrics.worstImprovement < 0) reasons.push("CASE_REGRESSION_OBSERVED");
        if (metrics.trials.some((trial) => trial.afterViolations > trial.beforeViolations)) reasons.push("VIOLATION_INCREASE_OBSERVED");
        if (
          metrics.meanImprovement !== payload.mean_improvement
          || metrics.worstImprovement !== payload.worst_improvement
          || metrics.violationDelta !== payload.violation_delta
          || stableObjectJson(reasons) !== stableObjectJson(payload.reasons)
          || payload.verdict !== (reasons.length ? "FAIL" : "PASS")
        ) refuse("QUALIFICATION_SEMANTICS");
        state.qualifications.set(payload.qualification_id, payload);
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        break;
      }
      case "LESSON_PROMOTED": {
        const qualification = state.qualifications.get(payload.qualification_id);
        if (!qualification || qualification.verdict !== "PASS" || state.lessons.has(payload.lesson_id)) {
          refuse("PROMOTION_REFERENCE");
        }
        state.lessons.set(payload.lesson_id, { ...payload, status: "VALIDATED_BY_TRANSFER" });
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        break;
      }
      case "LESSON_APPLICATION_MEASURED": {
        const lesson = state.lessons.get(payload.lesson_id);
        if (!lesson || lesson.status !== "VALIDATED_BY_TRANSFER") refuse("APPLICATION_LESSON_REFERENCE");
        const replayKey = `${payload.lesson_id}\0${payload.case_id}`;
        if (state.applications.has(replayKey)) refuse("APPLICATION_REPLAY");
        const improvement = Number((payload.after_score - payload.before_score).toFixed(12));
        const violationDelta = payload.after_violations - payload.before_violations;
        const verdict = improvement >= lesson.minimum_application_improvement && violationDelta <= 0
          ? "IMPROVED_OR_HELD"
          : "REGRESSION";
        if (payload.improvement !== improvement || payload.violation_delta !== violationDelta || payload.verdict !== verdict) {
          refuse("APPLICATION_SEMANTICS");
        }
        state.applications.set(replayKey, payload);
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        if (verdict === "REGRESSION") pendingRollback = payload;
        break;
      }
      case "LESSON_RETAINED":
        if (!state.applications.has(`${payload.lesson_id}\0${payload.case_id}`)) refuse("RETENTION_REFERENCE");
        state.retentions.set(payload.lesson_id, payload);
        break;
      case "LESSON_ROLLED_BACK":
        if (!pendingRollback || pendingRollback.lesson_id !== payload.lesson_id) refuse("ROLLBACK_REFERENCE");
        state.rollbacks.set(payload.lesson_id, payload);
        state.lessons.get(payload.lesson_id).status = "REVOKED";
        pendingRollback = null;
        break;
      default:
        refuse("LEARNING_EVENT_TYPE_UNKNOWN", event.event_type);
    }
  }
  if (pendingRollback) refuse("ROLLBACK_EVENT_MISSING");
  return state;
}

export class GovernedLearningAdapter {
  constructor({ root, learningScopeIdentity = "katherines-eye-product" } = {}) {
    this.paths = pathsFor(root);
    this.learningScopeIdentity = cleanString(learningScopeIdentity, 160);
    this.memoryStore = new ExecutiveMemoryStore(this.paths.memory);
  }

  async initialize() {
    await mkdir(path.dirname(this.paths.secret), { recursive: true });
    await mkdir(path.dirname(this.paths.ledger), { recursive: true });
    let secret;
    try {
      secret = await readFile(this.paths.secret);
      if (secret.length !== 32) refuse("LEARNING_SECRET_INVALID");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      secret = randomBytes(32);
      await writeFile(this.paths.secret, secret, { flag: "wx", mode: 0o600 });
    }
    try {
      const metadata = JSON.parse(await readFile(this.paths.metadata, "utf8"));
      if (
        metadata.schemaVersion !== GOVERNED_LEARNING_SCHEMA_VERSION
        || metadata.adapterIdentity !== GOVERNED_LEARNING_ADAPTER_IDENTITY
        || metadata.learningScopeIdentity !== this.learningScopeIdentity
      ) refuse("LEARNING_WORKSPACE_BINDING_MISMATCH");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await writeFile(this.paths.metadata, `${stableObjectJson({
        schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
        adapterIdentity: GOVERNED_LEARNING_ADAPTER_IDENTITY,
        learningScopeIdentity: this.learningScopeIdentity,
        source: SCC_LEARNING_ENGINE_SOURCE
      })}\n`, { flag: "wx", mode: 0o600 });
    }
    await open(this.paths.ledger, "a", 0o600).then((handle) => handle.close());
    return this.verify();
  }

  async #load() {
    const secret = await readFile(this.paths.secret);
    let source = "";
    try {
      source = await readFile(this.paths.ledger, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (source && !source.endsWith("\n")) refuse("LEARNING_LEDGER_TRUNCATED");
    const events = source
      ? source.slice(0, -1).split("\n").map((line) => JSON.parse(line))
      : [];
    let prior = GENESIS;
    for (let index = 0; index < events.length; index += 1) {
      const event = events[index];
      exactObject(event, [
        "object_type", "sequence", "prior_event_id", "event_type", "actor_id",
        "learning_scope_identity", "payload", "event_id"
      ]);
      if (
        event.object_type !== "KATHERINES_EYE_GOVERNED_LEARNING_EVENT"
        || event.sequence !== index + 1
        || event.prior_event_id !== prior
        || event.learning_scope_identity !== this.learningScopeIdentity
      ) refuse("LEARNING_LEDGER_ORDER");
      const body = { ...event };
      delete body.event_id;
      const expected = hmac(secret, "KATHERINES_EYE_GOVERNED_LEARNING_EVENT_V1", body);
      if (event.event_id !== expected) refuse("LEARNING_LEDGER_TAMPERED");
      prior = event.event_id;
    }
    const state = deriveState(events);
    return { secret, events, state, ledgerHead: prior };
  }

  async #write(operation) {
    await this.initialize();
    let lock;
    try {
      lock = await open(this.paths.lock, "wx", 0o600);
    } catch (error) {
      if (error?.code === "EEXIST") refuse("LEARNING_WORKSPACE_BUSY");
      throw error;
    }
    try {
      const loaded = await this.#load();
      const appendBatch = async (entries) => {
        let prior = loaded.events.at(-1)?.event_id || GENESIS;
        const pending = entries.map((entry, offset) => {
          const body = {
            object_type: "KATHERINES_EYE_GOVERNED_LEARNING_EVENT",
            sequence: loaded.events.length + offset + 1,
            prior_event_id: prior,
            event_type: entry.event_type,
            actor_id: sha256Object({
              adapterIdentity: GOVERNED_LEARNING_ADAPTER_IDENTITY,
              learningScopeIdentity: this.learningScopeIdentity
            }),
            learning_scope_identity: this.learningScopeIdentity,
            payload: entry.payload
          };
          const event = {
            ...body,
            event_id: hmac(loaded.secret, "KATHERINES_EYE_GOVERNED_LEARNING_EVENT_V1", body)
          };
          prior = event.event_id;
          return event;
        });
        const handle = await open(this.paths.ledger, "a", 0o600);
        try {
          await handle.write(`${pending.map((event) => stableObjectJson(event)).join("\n")}\n`);
          await handle.sync();
        } finally {
          await handle.close();
        }
        loaded.events.push(...pending);
        loaded.state = deriveState(loaded.events);
        return pending;
      };
      return await operation(loaded, appendBatch);
    } finally {
      await lock.close();
      await rm(this.paths.lock, { force: true });
    }
  }

  async nextEpisodeSequence() {
    await this.initialize();
    return (await this.#load()).state.lastEpisodeSequence + 1;
  }

  async prepareEpisode({
    governor,
    episodeId,
    episodeSequence,
    queryFacets = {},
    queryText = "",
    learningMode = "PRODUCT",
    createdAt
  } = {}) {
    await this.initialize();
    cleanString(episodeId, 160);
    if (!Number.isSafeInteger(episodeSequence) || episodeSequence < 1) refuse("EPISODE_SEQUENCE_INVALID");
    canonicalIso(createdAt);
    const loaded = await this.#load();
    if (episodeSequence <= loaded.state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
    const records = await this.memoryStore.list();
    for (const record of records) {
      if (record.runIdentity !== this.learningScopeIdentity) refuse("EXECUTIVE_MEMORY_SCOPE_MISMATCH");
      if (record.sourceEpisodeSequence >= episodeSequence) refuse("EXECUTIVE_MEMORY_FORWARD_ORDER");
    }
    const receipt = await this.memoryStore.retrieve({
      episodeId,
      queryFacets,
      queryText,
      createdAt
    });
    const recordsById = new Map(records.map((record) => [record.memoryId, record]));
    const governedCandidateIds = new Set([...loaded.state.candidates.values()]
      .filter((event) => recordsById.get(event.memory_id)?.contentHash === event.memory_hash)
      .map((event) => event.memory_id));
    const governedPromotedIds = new Set([...loaded.state.lessons.values()]
      .filter((event) => (
        event.status === "VALIDATED_BY_TRANSFER"
        && recordsById.get(event.lesson_id)?.contentHash === event.lesson_hash
      ))
      .map((event) => event.lesson_id));
    const allowed = learningMode === "GOVERNED_TRIAL" ? governedCandidateIds : governedPromotedIds;
    const selectedMemoryIds = receipt.candidateScores
      .filter((item) => item.candidateScore > 0 && allowed.has(item.memoryId))
      .slice(0, 3)
      .map((item) => item.memoryId);
    return {
      runIdentity: this.learningScopeIdentity,
      currentEpisodeId: episodeId,
      episodeSequence,
      records,
      selectedMemoryIds,
      retrievalReceiptHash: receipt.receiptHash,
      startsEmpty: true,
      forwardOnly: true,
      learningMode,
      ...(learningMode === "GOVERNED_TRIAL" ? {
        trialAuthorization: {
          authorityType: "GOVERNOR_QUALIFICATION_TRIAL",
          governorIdentity: governor?.governorIdentity,
          candidateMemoryIds: selectedMemoryIds
        }
      } : {})
    };
  }

  async captureProductFailure({
    governor,
    runtime,
    episodeId,
    episodeSequence,
    cognitiveEpisode,
    lessonCandidate,
    visibleEvidenceIds,
    createdAt
  } = {}) {
    if (!lessonCandidate) return { result: "NO_LESSON_CANDIDATE" };
    assertRuntimeAuthority(governor, runtime);
    canonicalIso(createdAt);
    const visible = new Set(cleanStrings(visibleEvidenceIds));
    const evidenceReferences = cleanStrings([
      cognitiveEpisode?.cognitiveEpisodeHash,
      cognitiveEpisode?.linkedExperienceRecordHash,
      lessonCandidate?.lessonCandidateHash
    ].filter(Boolean));
    if (!evidenceReferences.every((identity) => visible.has(identity))) refuse("LEARNING_EVIDENCE_NOT_VISIBLE");
    const failureCategory = cleanString(lessonCandidate.generalizedFailureCategory, 160);
    return this.#write(async ({ secret, state }, appendBatch) => {
      if (episodeSequence <= state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
      const failureBody = {
        episode_id: cleanString(episodeId, 160),
        episode_sequence: episodeSequence,
        failure_category: failureCategory,
        cognitive_episode_hash: cognitiveEpisode.cognitiveEpisodeHash,
        evidence_references: evidenceReferences
      };
      const failureId = hmac(secret, "KATHERINES_EYE_LEARNING_FAILURE_V1", failureBody);
      if (state.failures.has(failureId)) refuse("FAILURE_ALREADY_RECORDED");
      const mentorDecision = runtime.mentorDecision;
      const mentorEvidenceReferences = Array.isArray(mentorDecision.evidenceReferences)
        && mentorDecision.evidenceReferences.length
        ? mentorDecision.evidenceReferences
        : evidenceReferences;
      const diagnosisBody = {
        failure_id: failureId,
        mentor_decision_identity: runtime.mentorDecisionIdentity,
        authority_class: mentorDecision.authorityClass,
        failure_scope: mentorDecision.failureScope,
        next_action_class: mentorDecision.nextActionClass,
        selected_action_id: mentorDecision.selectedActionId,
        evidence_references: cleanStrings(mentorEvidenceReferences)
      };
      if (!diagnosisBody.evidence_references.every((identity) => visible.has(identity))) {
        refuse("MENTOR_EVIDENCE_NOT_VISIBLE");
      }
      const diagnosisId = hmac(secret, "KATHERINES_EYE_MENTOR_DIAGNOSIS_V1", diagnosisBody);
      const recommendedActionPattern = lessonCandidate.actionSequenceSummary
        ?.find((record) => !String(record.actionType || "").startsWith("STOP_"))
        ?.actionType || "";
      const candidateCore = {
        memoryType: "GENERALIZED_LESSON_CANDIDATE",
        memoryId: `ke-learning-candidate-${hmac(secret, "KATHERINES_EYE_LESSON_CANDIDATE_V1", {
          failureId,
          diagnosisId,
          lessonCandidateHash: lessonCandidate.lessonCandidateHash
        }).slice(0, 32)}`,
        sourceEpisodeIds: [episodeId],
        sourceEpisodeSequence: episodeSequence,
        evidenceReferences,
        evidenceAggregateHash: sha256Object(evidenceReferences),
        observedFailurePattern: failureCategory,
        generalizedRule: cleanString(lessonCandidate.proposedEngineeringReviewArea || failureCategory, 240),
        triggeringConditions: cleanStrings(lessonCandidate.generalizedPreconditions || [failureCategory]),
        applicabilityBoundaries: cleanStrings([lessonCandidate.subsystem || "COGNITIVE_GOVERNOR"]),
        explicitNonApplicabilityConditions: ["NOVEL", "INSUFFICIENT_EVIDENCE"],
        recurrenceSignature: `${lessonCandidate.subsystem || "COGNITIVE_GOVERNOR"}:${failureCategory}`,
        recommendedActionPattern,
        prohibitedActions: ["PROVIDER_LIFECYCLE_TRANSITION", "UNQUALIFIED_PRODUCT_INFLUENCE"],
        requiredProofBeforeAdvancement: evidenceReferences,
        authorityNormallyRequired: mentorDecision.authorityClass,
        confidence: 0.5,
        unresolvedUncertainty: cleanStrings([mentorDecision.uncertaintyClass || "BOUNDED"], { allowEmpty: true }),
        status: "CANDIDATE",
        predecessorMemoryIds: [],
        runIdentity: this.learningScopeIdentity,
        mentorDecisionIdentity: runtime.mentorDecisionIdentity,
        createdAt
      };
      const memoryRecord = sealMemoryRecord(candidateCore);
      const candidateId = hmac(secret, "KATHERINES_EYE_LESSON_CANDIDATE_EVENT_V1", {
        memoryId: memoryRecord.memoryId,
        contentHash: memoryRecord.contentHash
      });
      await appendBatch([
        { event_type: "FAILURE_RECORDED", payload: { failure_id: failureId, ...failureBody } },
        { event_type: "MENTOR_DIAGNOSIS_RECORDED", payload: { diagnosis_id: diagnosisId, ...diagnosisBody } },
        {
          event_type: "LESSON_CANDIDATE_RECORDED",
          payload: {
            candidate_id: candidateId,
            failure_id: failureId,
            diagnosis_id: diagnosisId,
            memory_id: memoryRecord.memoryId,
            memory_hash: memoryRecord.contentHash
          }
        }
      ]);
      await this.memoryStore.append(memoryRecord, { allowIdenticalReplay: false });
      return {
        result: "LESSON_CANDIDATE_RECORDED",
        failureId,
        diagnosisId,
        candidateId,
        memoryId: memoryRecord.memoryId,
        promotionAuthorized: false
      };
    });
  }

  async qualifyCandidate({
    governor,
    runtime,
    candidateId,
    trials,
    minimumMeanImprovement,
    minimumApplicationImprovement,
    visibleEvidenceIds,
    episodeSequence
  } = {}) {
    assertRuntimeAuthority(governor, runtime);
    score(minimumMeanImprovement, "minimumMeanImprovement");
    score(minimumApplicationImprovement, "minimumApplicationImprovement");
    const visible = new Set(cleanStrings(visibleEvidenceIds));
    const metrics = trialMetrics(trials);
    if (!metrics.trials.flatMap((trial) => trial.evidenceRefs).every((identity) => visible.has(identity))) {
      refuse("QUALIFICATION_EVIDENCE_NOT_VISIBLE");
    }
    return this.#write(async ({ secret, state }, appendBatch) => {
      const candidate = state.candidates.get(candidateId);
      if (!candidate) refuse("CANDIDATE_NOT_FOUND");
      if (episodeSequence <= state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
      if ([...state.qualifications.values()].some((item) => item.candidate_id === candidateId)) {
        refuse("CANDIDATE_ALREADY_QUALIFIED");
      }
      const reasons = [];
      if (metrics.meanImprovement < minimumMeanImprovement) reasons.push("MEAN_IMPROVEMENT_BELOW_THRESHOLD");
      if (metrics.worstImprovement < 0) reasons.push("CASE_REGRESSION_OBSERVED");
      if (metrics.trials.some((trial) => trial.afterViolations > trial.beforeViolations)) {
        reasons.push("VIOLATION_INCREASE_OBSERVED");
      }
      const body = {
        candidate_id: candidateId,
        episode_sequence: episodeSequence,
        trials: metrics.trials,
        trial_commitment: sha256Object(metrics.trials),
        mean_improvement: metrics.meanImprovement,
        worst_improvement: metrics.worstImprovement,
        violation_delta: metrics.violationDelta,
        minimum_mean_improvement: minimumMeanImprovement,
        minimum_application_improvement: minimumApplicationImprovement,
        verdict: reasons.length ? "FAIL" : "PASS",
        reasons,
        governor_identity: governor.governorIdentity,
        mentor_decision_identity: runtime.mentorDecisionIdentity
      };
      const qualificationId = hmac(secret, "KATHERINES_EYE_LESSON_QUALIFICATION_V1", body);
      await appendBatch([{
        event_type: "QUALIFICATION_DECIDED",
        payload: { qualification_id: qualificationId, ...body }
      }]);
      return { qualificationId, ...body };
    });
  }

  async promoteQualifiedLesson({
    governor,
    runtime,
    qualificationId,
    episodeId,
    episodeSequence,
    createdAt
  } = {}) {
    assertRuntimeAuthority(governor, runtime);
    canonicalIso(createdAt);
    return this.#write(async ({ secret, state }, appendBatch) => {
      const qualification = state.qualifications.get(qualificationId);
      if (!qualification || qualification.verdict !== "PASS") refuse("QUALIFICATION_NOT_PASSING");
      if (episodeSequence <= state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
      if ([...state.lessons.values()].some((item) => item.qualification_id === qualificationId)) {
        refuse("QUALIFICATION_ALREADY_PROMOTED");
      }
      const candidateEvent = state.candidates.get(qualification.candidate_id);
      const candidate = (await this.memoryStore.list()).find((record) => record.memoryId === candidateEvent.memory_id);
      if (!candidate || candidate.status !== "CANDIDATE") refuse("CANDIDATE_MEMORY_NOT_FOUND");
      const lessonCore = {
        ...candidate,
        memoryType: "RECURRENCE_PATTERN",
        memoryId: `ke-governed-lesson-${hmac(secret, "KATHERINES_EYE_PROMOTED_LESSON_V1", {
          qualificationId,
          candidateMemoryId: candidate.memoryId
        }).slice(0, 32)}`,
        sourceEpisodeIds: [...candidate.sourceEpisodeIds, cleanString(episodeId, 160)],
        sourceEpisodeSequence: episodeSequence,
        evidenceReferences: cleanStrings([
          ...candidate.evidenceReferences,
          ...qualification.trials.flatMap((trial) => trial.evidenceRefs)
        ]),
        evidenceAggregateHash: sha256Object(cleanStrings([
          ...candidate.evidenceReferences,
          ...qualification.trials.flatMap((trial) => trial.evidenceRefs)
        ])),
        confidence: Math.min(1, Number((0.5 + qualification.mean_improvement).toFixed(6))),
        status: "VALIDATED_BY_TRANSFER",
        predecessorMemoryIds: [candidate.memoryId],
        mentorDecisionIdentity: runtime.mentorDecisionIdentity,
        createdAt
      };
      delete lessonCore.contentHash;
      const lesson = sealMemoryRecord(lessonCore);
      const body = {
        lesson_id: lesson.memoryId,
        lesson_hash: lesson.contentHash,
        candidate_id: qualification.candidate_id,
        qualification_id: qualificationId,
        episode_sequence: episodeSequence,
        minimum_application_improvement: qualification.minimum_application_improvement,
        governor_identity: governor.governorIdentity,
        mentor_decision_identity: runtime.mentorDecisionIdentity
      };
      await appendBatch([{ event_type: "LESSON_PROMOTED", payload: body }]);
      await this.memoryStore.append(lesson);
      return { result: "LESSON_PROMOTED", lessonId: lesson.memoryId, ...body };
    });
  }

  async recordApplication({
    governor,
    runtime,
    lessonId,
    caseId,
    episodeId,
    episodeSequence,
    beforeScore,
    afterScore,
    beforeViolations,
    afterViolations,
    evidenceRefs,
    visibleEvidenceIds,
    createdAt
  } = {}) {
    assertRuntimeAuthority(governor, runtime);
    canonicalIso(createdAt);
    const visible = new Set(cleanStrings(visibleEvidenceIds));
    const evidence = cleanStrings(evidenceRefs);
    if (!evidence.every((identity) => visible.has(identity))) refuse("APPLICATION_EVIDENCE_NOT_VISIBLE");
    return this.#write(async ({ secret, state }, appendBatch) => {
      const lesson = state.lessons.get(lessonId);
      if (!lesson || lesson.status !== "VALIDATED_BY_TRANSFER" || state.rollbacks.has(lessonId)) {
        refuse("LESSON_NOT_APPLICABLE");
      }
      if (episodeSequence <= state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
      const improvement = Number((score(afterScore, "afterScore") - score(beforeScore, "beforeScore")).toFixed(12));
      const violationDelta = violationCount(afterViolations, "afterViolations")
        - violationCount(beforeViolations, "beforeViolations");
      const verdict = improvement >= lesson.minimum_application_improvement && violationDelta <= 0
        ? "IMPROVED_OR_HELD"
        : "REGRESSION";
      const body = {
        lesson_id: lessonId,
        case_id: cleanString(caseId, 120),
        episode_id: cleanString(episodeId, 160),
        episode_sequence: episodeSequence,
        before_score: beforeScore,
        after_score: afterScore,
        before_violations: beforeViolations,
        after_violations: afterViolations,
        improvement,
        violation_delta: violationDelta,
        verdict,
        evidence_references: evidence,
        governor_identity: governor.governorIdentity,
        mentor_decision_identity: runtime.mentorDecisionIdentity
      };
      const applicationId = hmac(secret, "KATHERINES_EYE_LESSON_APPLICATION_V1", body);
      const entries = [{
        event_type: "LESSON_APPLICATION_MEASURED",
        payload: { application_id: applicationId, ...body }
      }];
      let rollback = null;
      if (verdict === "IMPROVED_OR_HELD") {
        entries.push({
          event_type: "LESSON_RETAINED",
          payload: {
            lesson_id: lessonId,
            case_id: body.case_id,
            application_id: applicationId,
            measured_improvement: improvement,
            governor_identity: governor.governorIdentity
          }
        });
      } else {
        const currentMemory = (await this.memoryStore.list()).find((record) => record.memoryId === lessonId);
        const rollbackCore = {
          ...currentMemory,
          memoryType: "LESSON_SUPERSESSION",
          memoryId: `ke-lesson-rollback-${hmac(secret, "KATHERINES_EYE_LESSON_ROLLBACK_V1", {
            lessonId,
            applicationId
          }).slice(0, 32)}`,
          sourceEpisodeIds: [...currentMemory.sourceEpisodeIds, body.episode_id],
          sourceEpisodeSequence: episodeSequence,
          evidenceReferences: cleanStrings([...currentMemory.evidenceReferences, ...evidence]),
          evidenceAggregateHash: sha256Object(cleanStrings([...currentMemory.evidenceReferences, ...evidence])),
          status: "REVOKED",
          predecessorMemoryIds: [lessonId],
          mentorDecisionIdentity: runtime.mentorDecisionIdentity,
          createdAt
        };
        delete rollbackCore.contentHash;
        rollback = sealMemoryRecord(rollbackCore);
        entries.push({
          event_type: "LESSON_ROLLED_BACK",
          payload: {
            lesson_id: lessonId,
            rollback_memory_id: rollback.memoryId,
            rollback_memory_hash: rollback.contentHash,
            application_id: applicationId,
            reason: violationDelta > 0
              ? "VIOLATION_INCREASE"
              : "MEASURED_IMPROVEMENT_BELOW_REQUIRED_THRESHOLD",
            governor_identity: governor.governorIdentity
          }
        });
      }
      await appendBatch(entries);
      if (rollback) await this.memoryStore.append(rollback);
      return {
        result: verdict === "IMPROVED_OR_HELD" ? "LESSON_RETAINED" : "LESSON_ROLLED_BACK",
        applicationId,
        lessonId,
        improvement,
        violationDelta,
        verdict,
        rollbackMemoryId: rollback?.memoryId || null
      };
    });
  }

  async verify() {
    try {
      const loaded = await this.#load();
      const records = await this.memoryStore.list();
      for (const record of records) validateMemoryRecord(record);
      const boundHashes = new Set([
        ...[...loaded.state.candidates.values()].map((item) => item.memory_hash),
        ...[...loaded.state.lessons.values()].map((item) => item.lesson_hash),
        ...[...loaded.state.rollbacks.values()].map((item) => item.rollback_memory_hash)
      ]);
      if ([...boundHashes].some((hash) => !records.some((record) => record.contentHash === hash))) {
        refuse("EXECUTIVE_MEMORY_LEDGER_BINDING_MISSING");
      }
      return {
        result: "VALID",
        eventCount: loaded.events.length,
        ledgerHead: loaded.ledgerHead,
        memoryRecordCount: records.length,
        source: SCC_LEARNING_ENGINE_SOURCE,
        providerLifecycleAuthority: false
      };
    } catch (error) {
      if (error?.code === "ENOENT") {
        return {
          result: "VALID",
          eventCount: 0,
          ledgerHead: GENESIS,
          memoryRecordCount: 0,
          source: SCC_LEARNING_ENGINE_SOURCE,
          providerLifecycleAuthority: false
        };
      }
      throw error;
    }
  }

  async status() {
    await this.initialize();
    const loaded = await this.#load();
    return {
      result: "GOVERNED_LEARNING_STATUS",
      failures: loaded.state.failures.size,
      candidates: loaded.state.candidates.size,
      qualifications: loaded.state.qualifications.size,
      promotedLessons: [...loaded.state.lessons.values()].filter((item) => item.status === "VALIDATED_BY_TRANSFER").length,
      rolledBackLessons: loaded.state.rollbacks.size,
      retainedLessons: loaded.state.retentions.size,
      applications: loaded.state.applications.size,
      lastEpisodeSequence: loaded.state.lastEpisodeSequence,
      ledgerHead: loaded.ledgerHead,
      providerLifecycleAuthority: false
    };
  }
}
