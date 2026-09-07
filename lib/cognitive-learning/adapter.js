import { createHash, createHmac, randomBytes } from "node:crypto";
import { mkdir, open, readFile, readdir, rm, truncate, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ExecutiveMemoryStore,
  sealMemoryRecord,
  validateMemoryRecord
} from "../../qualification/synthetic-executive/scripts/memory-store.mjs";
import { sha256Object, stableObjectJson } from "../object-intelligence/stable.js";
import {
  CAUSALITY_DOMAIN,
  CAUSAL_MECHANISM,
  FAILURE_CLASSIFICATION,
  HISTORICAL_TRUST_CLASS,
  buildInertLessonCandidateFromMentorDiagnosis,
  buildInertLessonCandidateFromMentorSuccess,
  createCausalSignature
} from "../experience-reflection.js";
import { reviewLessonCandidate } from "../lesson-gate.js";
import {
  originateMentorDiagnosisCandidates,
  validateAuthenticatedEpisodeObservation
} from "../cognitive-governor/mentor-guided-reasoning.js";
import {
  originateMentorSuccessExplanations,
  validateAuthenticatedProductSuccessObservation
} from "../cognitive-governor/mentor-success-origination.js";
import {
  assertIndependentEvaluationReplaySafety,
  verifyPinnedIndependentEvaluationBytes,
  verifyPinnedIndependentEvaluationRecord
} from "./independent-evaluator-authority/verify.js";

export const GOVERNED_LEARNING_SCHEMA_VERSION = "1.0";
export const GOVERNED_LEARNING_ADAPTER_IDENTITY = "KATHERINES_EYE_GOVERNED_LEARNING_ADAPTER_V1";
export const WEBSITE_OUTCOME_SCHEMA_VERSION = "1.0";
export const WEBSITE_EVALUATION_SCHEMA_VERSION = "1.0";
export const MAX_GOVERNED_FAILURE_EVIDENCE_REFERENCES = 32;
export const MAX_GOVERNED_VISIBLE_EVIDENCE_IDENTITIES = 512;
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
const retrievalDecisionAuthorities = new WeakMap();
const authenticatedSuccessInventoryAuthorities = new WeakSet();
export const MINIMUM_GOVERNED_REUSE_SCORE = 0.1;
export const GOVERNED_RESEARCH_STRATEGY_ACTION = "APPLY_GOVERNED_RESEARCH_STRATEGY";
export const GOVERNED_RESEARCH_APPLICABILITY = Object.freeze({
  APPLICABLE: "APPLICABLE_RESEARCH_EVIDENCE_RISK",
  NO_RESEARCH_PLAN: "NO_CANONICAL_RESEARCH_PLAN",
  SPARSE_EVIDENCE: "SPARSE_OR_MISMATCHED_COMPARABLE_EVIDENCE",
  OPERATIONAL: "OPERATIONAL_RESEARCH_FAILURE",
  INSUFFICIENT: "INSUFFICIENT_TRACEABLE_MARKET_EVIDENCE",
  CLEAR: "CLEAR_GROUNDED_RESEARCH_STRATEGY"
});
export const MINIMUM_AUTHENTICATED_SUCCESS_DIMENSION_SCORE = 0.7;
const MAX_WEBSITE_OUTCOME_REQUEST_BYTES = 30 * 1024 * 1024;
const MAX_WEBSITE_OUTCOME_RESPONSE_BYTES = 30 * 1024 * 1024;
const MAX_WEBSITE_EVALUATION_BYTES = 1024 * 1024;
export const AUTHORITATIVE_MEMORY_STATUSES = Object.freeze([
  "NO_LESSON",
  "CANDIDATE",
  "RETRIEVED_APPLIED",
  "REJECTED_ANALOGY",
  "NOVEL",
  "INSUFFICIENT_EVIDENCE"
]);

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

function exactEvidenceStrings(values, {
  maximumItems = MAX_GOVERNED_FAILURE_EVIDENCE_REFERENCES,
  maximumCharacters = 240,
  allowEmpty = false
} = {}) {
  if (!Array.isArray(values)) refuse("LEARNING_ARRAY_REQUIRED");
  if ((!allowEmpty && values.length === 0) || values.length > maximumItems) {
    refuse("LEARNING_ARRAY_CARDINALITY");
  }
  const output = values.map((value) => {
    if (typeof value !== "string") refuse("LEARNING_EVIDENCE_BYTES_INVALID");
    const cleaned = cleanString(value, maximumCharacters);
    if (cleaned !== value) refuse("LEARNING_EVIDENCE_BYTES_INVALID");
    return value;
  });
  if (new Set(output).size !== output.length) refuse("LEARNING_EVIDENCE_DUPLICATE");
  return output;
}

export function buildProductFailureEvidenceHandoff({
  visibleEvidenceIds,
  evidenceReferences
} = {}) {
  const visible = exactEvidenceStrings(visibleEvidenceIds, {
    maximumItems: MAX_GOVERNED_VISIBLE_EVIDENCE_IDENTITIES
  });
  const references = exactEvidenceStrings(evidenceReferences, {
    maximumItems: MAX_GOVERNED_FAILURE_EVIDENCE_REFERENCES
  });
  const visibleSet = new Set(visible);
  if (!references.every((identity) => visibleSet.has(identity))) {
    refuse("LEARNING_EVIDENCE_NOT_VISIBLE");
  }
  return Object.freeze({
    visibleEvidenceIds: Object.freeze([...visible]),
    evidenceReferences: Object.freeze([...references])
  });
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

function optionalCleanString(value, maximum = 240) {
  const text = String(value || "").trim();
  if (Array.from(text).length > maximum) refuse("LEARNING_TEXT_INVALID");
  return text;
}

function optionalSha256Identity(value, label) {
  const identity = optionalCleanString(value, 80);
  if (identity && !/^[a-f0-9]{64}$/i.test(identity)) refuse("LEARNING_HASH_INVALID", label);
  return identity.toLowerCase();
}

function sha256Identity(value, label) {
  const identity = cleanString(value, 80);
  if (!/^[a-f0-9]{64}$/i.test(identity)) refuse("LEARNING_HASH_INVALID", label);
  return identity.toLowerCase();
}

function canonicalFeedbackClaim(value = {}) {
  exactObject(value, ["claimPath", "claimClass", "assertedValue", "failureKind"]);
  return Object.freeze({
    claimPath: cleanString(value.claimPath, 180),
    claimClass: cleanString(value.claimClass, 120),
    assertedValue: cleanString(value.assertedValue, 240),
    failureKind: cleanString(value.failureKind, 120)
  });
}

function canonicalFeedbackCorrection(value = {}) {
  exactObject(value, ["correctedState", "evidenceProvenance"]);
  exactObject(value.evidenceProvenance, [
    "authorityClass", "sourceType", "sourceIdentity", "providerAuthored"
  ]);
  if (value.evidenceProvenance.providerAuthored !== false) refuse("PROVIDER_AUTHORED_FEEDBACK_PROHIBITED");
  return Object.freeze({
    correctedState: cleanString(value.correctedState, 120),
    evidenceProvenance: Object.freeze({
      authorityClass: cleanString(value.evidenceProvenance.authorityClass, 120),
      sourceType: cleanString(value.evidenceProvenance.sourceType, 120),
      sourceIdentity: sha256Identity(value.evidenceProvenance.sourceIdentity, "feedback provenance"),
      providerAuthored: false
    })
  });
}

function feedbackEnvelopeCore(value = {}) {
  exactObject(value, [
    "feedbackType", "learningScopeIdentity", "boundEpisodeId", "boundEpisodeSequence",
    "responseHash", "originalEvidenceIdentity", "cognitiveEpisodeHash",
    "submittedObjectFingerprint", "memoryTransitionHash", "failedClaim", "correction",
    "issuedAt", "feedbackId"
  ]);
  const boundEpisodeSequence = violationCount(value.boundEpisodeSequence, "boundEpisodeSequence");
  if (boundEpisodeSequence < 1) refuse("EPISODE_SEQUENCE_INVALID");
  return {
    feedbackType: cleanString(value.feedbackType, 100),
    learningScopeIdentity: cleanString(value.learningScopeIdentity, 160),
    boundEpisodeId: cleanString(value.boundEpisodeId, 160),
    boundEpisodeSequence,
    responseHash: sha256Identity(value.responseHash, "response"),
    originalEvidenceIdentity: sha256Identity(value.originalEvidenceIdentity, "original evidence"),
    cognitiveEpisodeHash: sha256Identity(value.cognitiveEpisodeHash, "cognitive episode"),
    submittedObjectFingerprint: cleanString(value.submittedObjectFingerprint, 160),
    memoryTransitionHash: sha256Identity(value.memoryTransitionHash, "memory transition"),
    failedClaim: canonicalFeedbackClaim(value.failedClaim),
    correction: canonicalFeedbackCorrection(value.correction),
    issuedAt: canonicalIso(value.issuedAt)
  };
}

function hmac(secret, domain, value) {
  return createHmac("sha256", secret)
    .update(domain, "utf8")
    .update("\0")
    .update(stableObjectJson(value), "utf8")
    .digest("hex");
}

function successHashRecord(value, field) {
  const record = { ...value, [field]: "" };
  record[field] = sha256Object(record);
  return Object.freeze(record);
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalWebsiteDisposition(value = {}) {
  exactObject(value, [
    "boundary", "result", "failureId", "diagnosisId", "candidateId",
    "mentorDecisionIdentity", "candidatePresent", "qualificationAuthorized",
    "promotionAuthorized", "runtimeConsumptionAuthorized", "productChangeAuthorized",
    "providerLifecycleAuthority"
  ]);
  const boundary = cleanString(value.boundary, 80).toUpperCase();
  if (!["MENTOR_SUCCESS", "MENTOR_FAILURE", "EXPECTED_STOP", "OPERATIONAL_FAILURE"].includes(boundary)) {
    refuse("WEBSITE_OUTCOME_COGNITIVE_BOUNDARY_INVALID");
  }
  const failureId = optionalSha256Identity(value.failureId, "website failure");
  const diagnosisId = optionalSha256Identity(value.diagnosisId, "website diagnosis");
  const candidateId = optionalSha256Identity(value.candidateId, "website candidate");
  const mentorDecisionIdentity = optionalSha256Identity(
    value.mentorDecisionIdentity,
    "website mentor decision"
  );
  if (Boolean(candidateId) !== (value.candidatePresent === true)) {
    refuse("WEBSITE_OUTCOME_CANDIDATE_PRESENCE_INVALID");
  }
  for (const field of [
    "qualificationAuthorized",
    "promotionAuthorized",
    "runtimeConsumptionAuthorized",
    "productChangeAuthorized",
    "providerLifecycleAuthority"
  ]) {
    if (value[field] !== false) refuse("WEBSITE_OUTCOME_AUTHORITY_PROHIBITED", field);
  }
  return Object.freeze({
    boundary,
    result: cleanString(value.result, 120).toUpperCase(),
    failureId,
    diagnosisId,
    candidateId,
    mentorDecisionIdentity,
    candidatePresent: value.candidatePresent === true,
    qualificationAuthorized: false,
    promotionAuthorized: false,
    runtimeConsumptionAuthorized: false,
    productChangeAuthorized: false,
    providerLifecycleAuthority: false
  });
}

function canonicalWebsiteBytes(value, { label, maximumBytes }) {
  if (!Buffer.isBuffer(value) || value.length < 1 || value.length > maximumBytes) {
    refuse("WEBSITE_OUTCOME_BYTES_INVALID", label);
  }
  let parsed;
  try {
    parsed = JSON.parse(value.toString("utf8"));
  } catch {
    refuse("WEBSITE_OUTCOME_JSON_INVALID", label);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    refuse("WEBSITE_OUTCOME_JSON_OBJECT_REQUIRED", label);
  }
  return Object.freeze({
    encoding: "base64",
    byteLength: value.length,
    sha256: sha256Bytes(value),
    bytesBase64: value.toString("base64"),
    parsed
  });
}

function decodeCanonicalWebsiteBytes(value = {}, { label, maximumBytes }) {
  exactObject(value, ["encoding", "byteLength", "sha256", "bytesBase64"]);
  if (value.encoding !== "base64" || !Number.isSafeInteger(value.byteLength)) {
    refuse("WEBSITE_OUTCOME_BYTE_BINDING_INVALID", label);
  }
  const bytes = Buffer.from(String(value.bytesBase64 || ""), "base64");
  const canonical = canonicalWebsiteBytes(bytes, { label, maximumBytes });
  if (
    canonical.byteLength !== value.byteLength
    || canonical.sha256 !== sha256Identity(value.sha256, `${label} bytes`)
    || canonical.bytesBase64 !== value.bytesBase64
  ) refuse("WEBSITE_OUTCOME_BYTE_BINDING_MISMATCH", label);
  return canonical;
}

function canonicalWebsiteProviderMetering(value = null) {
  if (value === null || value === undefined) return null;
  exactObject(value, [
    "schemaVersion", "recordType", "zeroRetryMode", "logicalRequestCount",
    "physicalAttemptCount", "physicalRetryAttemptCount", "attempts",
    "exactBilledDollars", "exactBilledDollarsStatus", "providerLifecycleAuthority",
    "meteringHash"
  ]);
  if (
    value.schemaVersion !== "1.0"
    || value.recordType !== "KATHERINES_EYE_TERMINAL_PROVIDER_METERING"
    || typeof value.zeroRetryMode !== "boolean"
    || value.exactBilledDollars !== null
    || value.exactBilledDollarsStatus !== "NOT_REPORTED_BY_PROVIDER"
    || value.providerLifecycleAuthority !== false
    || !Array.isArray(value.attempts)
    || value.attempts.length > 64
  ) refuse("WEBSITE_PROVIDER_METERING_INVALID");
  for (const count of [
    value.logicalRequestCount,
    value.physicalAttemptCount,
    value.physicalRetryAttemptCount
  ]) {
    if (!Number.isSafeInteger(count) || count < 0) refuse("WEBSITE_PROVIDER_METERING_INVALID");
  }
  const logicalRequestCount = value.attempts.filter((record) => record?.logicalQueryAttempted === true).length;
  const physicalAttemptCount = value.attempts.reduce(
    (total, record) => total + Number(record?.physicalAttemptCount || 0),
    0
  );
  const physicalRetryAttemptCount = value.attempts.reduce(
    (total, record) => total + Number(record?.physicalRetryAttemptCount || 0),
    0
  );
  if (
    logicalRequestCount !== value.logicalRequestCount
    || physicalAttemptCount !== value.physicalAttemptCount
    || physicalRetryAttemptCount !== value.physicalRetryAttemptCount
    || (value.zeroRetryMode && (
      physicalRetryAttemptCount !== 0
      || value.attempts.some((record) => (
        Number(record?.maximumPhysicalAttemptsPerLogicalRequest || 0) !== 1
        || Number(record?.physicalAttemptCount || 0) > 1
      ))
    ))
    || value.meteringHash !== sha256Object({ ...value, meteringHash: "" })
  ) refuse("WEBSITE_PROVIDER_METERING_BINDING_INVALID");
  return Object.freeze(JSON.parse(stableObjectJson(value)));
}

function sealWebsiteOutcomeArtifact(secret, value = {}) {
  exactObject(value, [
    "learningScopeIdentity", "episodeId", "episodeSequence", "terminalKind", "statusCode",
    "requestBytes", "responseBytes", "productOutcomeId", "cognitiveDisposition", "createdAt"
  ], ["providerMetering"]);
  const episodeId = cleanString(value.episodeId, 160);
  const episodeSequence = violationCount(value.episodeSequence, "website episodeSequence");
  if (episodeSequence < 1) refuse("EPISODE_SEQUENCE_INVALID");
  const terminalKind = cleanString(value.terminalKind, 40).toUpperCase();
  if (!["SUCCESS", "FAILURE", "EXPECTED_STOP"].includes(terminalKind)) {
    refuse("WEBSITE_OUTCOME_TERMINAL_KIND_INVALID");
  }
  if (!Number.isInteger(value.statusCode) || value.statusCode < 100 || value.statusCode > 599) {
    refuse("WEBSITE_OUTCOME_STATUS_INVALID");
  }
  const request = canonicalWebsiteBytes(value.requestBytes, {
    label: "request",
    maximumBytes: MAX_WEBSITE_OUTCOME_REQUEST_BYTES
  });
  const response = canonicalWebsiteBytes(value.responseBytes, {
    label: "response",
    maximumBytes: MAX_WEBSITE_OUTCOME_RESPONSE_BYTES
  });
  if (String(request.parsed.analysisId || "") !== episodeId) {
    refuse("WEBSITE_OUTCOME_REQUEST_EPISODE_MISMATCH");
  }
  const productOutcomeId = optionalSha256Identity(value.productOutcomeId, "website product outcome");
  if ((terminalKind === "SUCCESS") !== Boolean(productOutcomeId)) {
    refuse("WEBSITE_OUTCOME_PRODUCT_BINDING_INVALID");
  }
  const disposition = canonicalWebsiteDisposition(value.cognitiveDisposition);
  const providerMetering = canonicalWebsiteProviderMetering(value.providerMetering);
  if (terminalKind === "SUCCESS" && disposition.boundary !== "MENTOR_SUCCESS") {
    refuse("WEBSITE_OUTCOME_SUCCESS_BOUNDARY_INVALID");
  }
  if (terminalKind !== "SUCCESS" && disposition.boundary === "MENTOR_SUCCESS") {
    refuse("WEBSITE_OUTCOME_FAILURE_BOUNDARY_INVALID");
  }
  const core = {
    schemaVersion: WEBSITE_OUTCOME_SCHEMA_VERSION,
    artifactType: "KATHERINES_EYE_AUTHENTICATED_WEBSITE_OUTCOME",
    learningScopeIdentity: cleanString(value.learningScopeIdentity || "", 160),
    episodeId,
    episodeSequence,
    terminalKind,
    statusCode: value.statusCode,
    request: {
      encoding: request.encoding,
      byteLength: request.byteLength,
      sha256: request.sha256,
      bytesBase64: request.bytesBase64
    },
    response: {
      encoding: response.encoding,
      byteLength: response.byteLength,
      sha256: response.sha256,
      bytesBase64: response.bytesBase64,
      canonicalObjectHash: sha256Object(response.parsed)
    },
    productOutcomeId,
    cognitiveDisposition: disposition,
    ...(providerMetering ? { providerMetering } : {}),
    createdAt: canonicalIso(value.createdAt),
    providerLifecycleAuthority: false
  };
  return Object.freeze({
    ...core,
    artifactId: hmac(secret, "KATHERINES_EYE_WEBSITE_OUTCOME_ARTIFACT_V1", core)
  });
}

function authenticateWebsiteOutcomeArtifact(secret, value = {}) {
  exactObject(value, [
    "schemaVersion", "artifactType", "learningScopeIdentity", "episodeId",
    "episodeSequence", "terminalKind", "statusCode", "request", "response",
    "productOutcomeId", "cognitiveDisposition", "createdAt",
    "providerLifecycleAuthority", "artifactId"
  ], ["providerMetering"]);
  if (
    value.schemaVersion !== WEBSITE_OUTCOME_SCHEMA_VERSION
    || value.artifactType !== "KATHERINES_EYE_AUTHENTICATED_WEBSITE_OUTCOME"
    || value.providerLifecycleAuthority !== false
  ) refuse("WEBSITE_OUTCOME_ARTIFACT_HEADER_INVALID");
  exactObject(value.response, ["encoding", "byteLength", "sha256", "bytesBase64", "canonicalObjectHash"]);
  const request = decodeCanonicalWebsiteBytes(value.request, {
    label: "request",
    maximumBytes: MAX_WEBSITE_OUTCOME_REQUEST_BYTES
  });
  const responseCore = { ...value.response };
  delete responseCore.canonicalObjectHash;
  const response = decodeCanonicalWebsiteBytes(responseCore, {
    label: "response",
    maximumBytes: MAX_WEBSITE_OUTCOME_RESPONSE_BYTES
  });
  if (sha256Object(response.parsed) !== sha256Identity(value.response.canonicalObjectHash, "website canonical response")) {
    refuse("WEBSITE_OUTCOME_CANONICAL_RESPONSE_MISMATCH");
  }
  const expected = sealWebsiteOutcomeArtifact(secret, {
    learningScopeIdentity: value.learningScopeIdentity,
    episodeId: value.episodeId,
    episodeSequence: value.episodeSequence,
    terminalKind: value.terminalKind,
    statusCode: value.statusCode,
    requestBytes: request.bytesBase64 ? Buffer.from(request.bytesBase64, "base64") : Buffer.alloc(0),
    responseBytes: response.bytesBase64 ? Buffer.from(response.bytesBase64, "base64") : Buffer.alloc(0),
    productOutcomeId: value.productOutcomeId,
    cognitiveDisposition: value.cognitiveDisposition,
    ...(Object.hasOwn(value, "providerMetering") ? { providerMetering: value.providerMetering } : {}),
    createdAt: value.createdAt
  });
  if (stableObjectJson(value) !== stableObjectJson(expected)) {
    refuse("WEBSITE_OUTCOME_ARTIFACT_TAMPERED");
  }
  return Object.freeze({ artifact: expected, requestBytes: Buffer.from(request.bytesBase64, "base64"), responseBytes: Buffer.from(response.bytesBase64, "base64") });
}

function parseWebsiteEvaluationJsonBytes(value, { label, maximumBytes }) {
  if (!Buffer.isBuffer(value) || value.length < 1 || value.length > maximumBytes) {
    refuse("WEBSITE_EVALUATION_BYTES_INVALID", label);
  }
  let parsed;
  try {
    parsed = JSON.parse(value.toString("utf8"));
  } catch {
    refuse("WEBSITE_EVALUATION_JSON_INVALID", label);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    refuse("WEBSITE_EVALUATION_JSON_OBJECT_REQUIRED", label);
  }
  return Object.freeze({
    encoding: "base64",
    byteLength: value.length,
    sha256: sha256Bytes(value),
    bytesBase64: value.toString("base64"),
    parsed
  });
}

function decodeWebsiteEvaluationJsonBytes(value = {}, { label, maximumBytes }) {
  exactObject(value, ["encoding", "byteLength", "sha256", "bytesBase64"]);
  if (value.encoding !== "base64" || !Number.isSafeInteger(value.byteLength)) {
    refuse("WEBSITE_EVALUATION_BYTE_BINDING_INVALID", label);
  }
  const bytes = Buffer.from(String(value.bytesBase64 || ""), "base64");
  const canonical = parseWebsiteEvaluationJsonBytes(bytes, { label, maximumBytes });
  if (
    canonical.byteLength !== value.byteLength
    || canonical.sha256 !== sha256Identity(value.sha256, `${label} bytes`)
    || canonical.bytesBase64 !== value.bytesBase64
  ) refuse("WEBSITE_EVALUATION_BYTE_BINDING_MISMATCH", label);
  return canonical;
}

function canonicalWebsiteIndependentEvaluation(value = {}) {
  try {
    return verifyPinnedIndependentEvaluationRecord(value);
  } catch (error) {
    if (error?.code) refuse(error.code);
    throw error;
  }
}

function canonicalWebsiteEvaluationBytes(value) {
  const bytes = parseWebsiteEvaluationJsonBytes(value, {
    label: "independent evaluation",
    maximumBytes: MAX_WEBSITE_EVALUATION_BYTES
  });
  return Object.freeze({ ...bytes, evaluation: canonicalWebsiteIndependentEvaluation(bytes.parsed) });
}

function sealWebsiteEvaluationArtifact(secret, value = {}) {
  exactObject(value, [
    "learningScopeIdentity", "episodeId", "websiteOutcomeId", "productOutcomeId",
    "evaluationBytes"
  ]);
  const evaluationBytes = canonicalWebsiteEvaluationBytes(value.evaluationBytes);
  const evaluation = evaluationBytes.evaluation;
  const episodeId = cleanString(value.episodeId, 160);
  const websiteOutcomeId = sha256Identity(value.websiteOutcomeId, "website outcome");
  const productOutcomeId = sha256Identity(value.productOutcomeId, "website evaluation product outcome");
  const core = {
    schemaVersion: WEBSITE_EVALUATION_SCHEMA_VERSION,
    artifactType: "KATHERINES_EYE_AUTHENTICATED_WEBSITE_EVALUATION",
    learningScopeIdentity: cleanString(value.learningScopeIdentity, 160),
    episodeId,
    websiteOutcomeId,
    productOutcomeId,
    imageSha256: evaluation.imageBinding.sha256,
    imageByteCount: evaluation.imageBinding.byteCount,
    requestSha256: evaluation.requestSha256,
    rawResponseSha256: evaluation.responseBindings.rawResponseSha256,
    canonicalResponseHash: evaluation.responseBindings.canonicalResponseHash,
    evaluatorIdentity: evaluation.evaluatorIdentity,
    evaluationAuthorityIdentity: evaluation.evaluationAuthorityIdentity,
    authorityManifestId: evaluation.authorityManifestId,
    authorityManifestSha256: evaluation.authorityManifestSha256,
    evaluatorKeyId: evaluation.keyId,
    evaluatorNonce: evaluation.nonce,
    evaluatorSequence: evaluation.sequence,
    criteriaVersion: evaluation.criteriaVersion,
    evaluationDisposition: evaluation.result === "PASS" ? "SUCCESS" : "FAILURE",
    evaluation: {
      encoding: evaluationBytes.encoding,
      byteLength: evaluationBytes.byteLength,
      sha256: evaluationBytes.sha256,
      bytesBase64: evaluationBytes.bytesBase64,
      evaluationReportHash: evaluation.evaluationReportHash
    },
    successArtifact: null,
    evaluatedAt: evaluation.evaluatedAt,
    qualificationAuthorized: false,
    promotionAuthorized: false,
    runtimeConsumptionAuthorized: false,
    productChangeAuthorized: false,
    providerLifecycleAuthority: false
  };
  return Object.freeze({
    ...core,
    artifactId: hmac(secret, "KATHERINES_EYE_WEBSITE_EVALUATION_ARTIFACT_V1", core)
  });
}

function authenticateWebsiteEvaluationArtifact(secret, value = {}) {
  exactObject(value, [
    "schemaVersion", "artifactType", "learningScopeIdentity", "episodeId",
    "websiteOutcomeId", "productOutcomeId", "imageSha256", "imageByteCount",
    "requestSha256", "rawResponseSha256", "canonicalResponseHash", "evaluatorIdentity",
    "evaluationAuthorityIdentity", "authorityManifestId", "authorityManifestSha256",
    "evaluatorKeyId", "evaluatorNonce", "evaluatorSequence", "criteriaVersion",
    "evaluationDisposition", "evaluation", "successArtifact",
    "evaluatedAt", "qualificationAuthorized", "promotionAuthorized",
    "runtimeConsumptionAuthorized", "productChangeAuthorized", "providerLifecycleAuthority",
    "artifactId"
  ]);
  if (
    value.schemaVersion !== WEBSITE_EVALUATION_SCHEMA_VERSION
    || value.artifactType !== "KATHERINES_EYE_AUTHENTICATED_WEBSITE_EVALUATION"
    || value.qualificationAuthorized !== false
    || value.promotionAuthorized !== false
    || value.runtimeConsumptionAuthorized !== false
    || value.productChangeAuthorized !== false
    || value.providerLifecycleAuthority !== false
  ) refuse("WEBSITE_EVALUATION_ARTIFACT_HEADER_INVALID");
  exactObject(value.evaluation, [
    "encoding", "byteLength", "sha256", "bytesBase64", "evaluationReportHash"
  ]);
  const evaluationCore = { ...value.evaluation };
  delete evaluationCore.evaluationReportHash;
  const evaluationBytes = decodeWebsiteEvaluationJsonBytes(evaluationCore, {
    label: "independent evaluation",
    maximumBytes: MAX_WEBSITE_EVALUATION_BYTES
  });
  const evaluation = canonicalWebsiteIndependentEvaluation(evaluationBytes.parsed);
  if (evaluation.evaluationReportHash !== value.evaluation.evaluationReportHash) {
    refuse("WEBSITE_EVALUATION_REPORT_LEDGER_BINDING_INVALID");
  }
  if (value.successArtifact !== null) refuse("WEBSITE_EVALUATION_CALLER_SUCCESS_ARTIFACT_PROHIBITED");
  const expected = sealWebsiteEvaluationArtifact(secret, {
    learningScopeIdentity: value.learningScopeIdentity,
    episodeId: value.episodeId,
    websiteOutcomeId: value.websiteOutcomeId,
    productOutcomeId: value.productOutcomeId,
    evaluationBytes: Buffer.from(evaluationBytes.bytesBase64, "base64")
  });
  if (stableObjectJson(value) !== stableObjectJson(expected)) {
    refuse("WEBSITE_EVALUATION_ARTIFACT_TAMPERED");
  }
  return Object.freeze({
    artifact: expected,
    evaluationBytes: Buffer.from(evaluationBytes.bytesBase64, "base64"),
    evaluation: evaluation.value,
    successArtifactBytes: null,
    successArtifact: null
  });
}

function authenticatedWebsiteEvaluationFailureObservation({
  learningScopeIdentity,
  websiteOutcome,
  websiteEvaluation
}) {
  const outcome = websiteOutcome.artifact;
  const evaluation = websiteEvaluation.artifact;
  const signature = createCausalSignature({
    earliestSupportedLossBoundary: "RESPONSE_EMISSION",
    causalMechanism: CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE,
    failureClassification: FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE,
    causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
    triggerClass: "AUTHENTICATED_INDEPENDENT_WEBSITE_EVALUATION_FAILURE"
  });
  const observation = {
    schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
    sourceRecordHash: evaluation.evaluation.evaluationReportHash,
    sourceArtifactHash: evaluation.artifactId,
    sourceTrustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    sourceIntegrityValid: true,
    sourceIntegrityFailures: [],
    episodeIdentity: sha256Object({
      recordType: "GOVERNED_WEBSITE_EPISODE_IDENTITY",
      learningScopeIdentity,
      episodeId: outcome.episodeId,
      productOutcomeId: outcome.productOutcomeId
    }),
    objectClassIdentity: sha256Object({
      recordType: "GOVERNED_WEBSITE_REQUEST_OBJECT_CLASS_IDENTITY",
      requestSha256: outcome.request.sha256
    }),
    causalEventIdentity: websiteEvaluation.ledgerEventIdentity,
    sourceLineageIdentity: sha256Object({
      recordType: "GOVERNED_WEBSITE_EVALUATION_LINEAGE",
      websiteOutcomeId: outcome.artifactId,
      productOutcomeId: outcome.productOutcomeId
    }),
    expectedState: "INDEPENDENT_PRODUCT_EVALUATION_PASS",
    actualState: "INDEPENDENT_PRODUCT_EVALUATION_FAIL",
    earliestSupportedLossBoundary: "RESPONSE_EMISSION",
    outcome: "FAILURE",
    failureClassification: FAILURE_CLASSIFICATION.UNRESOLVED_CAUSE,
    causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
    causalMechanism: CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE,
    eligibleForLessonSupport: false,
    supportExclusionReasons: ["INTERNAL_CAUSE_NOT_ESTABLISHED"],
    causalSignatureHash: signature.signatureHash,
    counterexampleForSignatureHash: "",
    observationHash: ""
  };
  observation.observationHash = sha256Object(observation);
  return Object.freeze(validateAuthenticatedEpisodeObservation(observation));
}

function canonicalSuccessDimensions(value = {}) {
  exactObject(value, [
    "identityAccuracy",
    "purposeAccuracy",
    "conditionAccuracy",
    "evidenceTraceability",
    "uncertaintyCalibration",
    "decisionUsefulness",
    "schemaCoverage",
    "regressionSafety"
  ]);
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([name, value]) => [
    name,
    score(value, `success evaluation ${name}`)
  ])));
}

export function sealIndependentProductSuccessEvaluation(value = {}) {
  exactObject(value, [
    "evaluationIdentity",
    "evaluatorIdentity",
    "evaluationAuthorityIdentity",
    "independent",
    "selfEvaluation",
    "providerAuthored",
    "fatalRegressionCount",
    "dimensions"
  ]);
  const dimensions = canonicalSuccessDimensions(value.dimensions);
  const fatalRegressionCount = violationCount(value.fatalRegressionCount, "fatalRegressionCount");
  const passing = Object.values(dimensions)
    .every((value) => value >= MINIMUM_AUTHENTICATED_SUCCESS_DIMENSION_SCORE)
    && fatalRegressionCount === 0;
  const core = {
    evaluationIdentity: sha256Identity(value.evaluationIdentity, "success evaluation identity"),
    evaluatorIdentity: sha256Identity(value.evaluatorIdentity, "success evaluator identity"),
    evaluationAuthorityIdentity: sha256Identity(
      value.evaluationAuthorityIdentity,
      "success evaluation authority"
    ),
    result: passing ? "PASS" : "FAIL",
    independent: value.independent === true,
    selfEvaluation: value.selfEvaluation === true,
    providerAuthored: value.providerAuthored === true,
    fatalRegressionCount,
    dimensions
  };
  return successHashRecord(core, "evaluationRecordHash");
}

function canonicalIndependentProductSuccessEvaluation(value = {}) {
  exactObject(value, [
    "evaluationIdentity",
    "evaluatorIdentity",
    "evaluationAuthorityIdentity",
    "result",
    "independent",
    "selfEvaluation",
    "providerAuthored",
    "fatalRegressionCount",
    "dimensions",
    "evaluationRecordHash"
  ]);
  const expected = sealIndependentProductSuccessEvaluation({
    evaluationIdentity: value.evaluationIdentity,
    evaluatorIdentity: value.evaluatorIdentity,
    evaluationAuthorityIdentity: value.evaluationAuthorityIdentity,
    independent: value.independent,
    selfEvaluation: value.selfEvaluation,
    providerAuthored: value.providerAuthored,
    fatalRegressionCount: value.fatalRegressionCount,
    dimensions: value.dimensions
  });
  if (stableObjectJson(value) !== stableObjectJson(expected)) refuse("PRODUCT_SUCCESS_EVALUATION_TAMPERED");
  if (expected.result !== "PASS") refuse("PRODUCT_SUCCESS_EVALUATION_NOT_PASSING");
  if (!expected.independent || expected.selfEvaluation || expected.providerAuthored) {
    refuse("PRODUCT_SUCCESS_EVALUATION_AUTHORITY_INVALID");
  }
  return expected;
}

function canonicalSuccessBehaviorTrace(value = {}) {
  exactObject(value, [
    "behaviorId",
    "actionPattern",
    "causalityDomain",
    "scope",
    "applicabilityTriggers",
    "exclusions",
    "supportingEvidenceHashes",
    "causalAttribution"
  ], ["behaviorSignatureHash"]);
  exactObject(value.causalAttribution, [
    "baselineObservationHash",
    "treatmentObservationHash",
    "interventionOnlyDifference",
    "evaluatorAttributionConfirmed",
    "externalContributionDominant"
  ]);
  const causalityDomain = cleanString(value.causalityDomain, 40).toUpperCase();
  if (!["INTERNAL", "EXTERNAL"].includes(causalityDomain)) refuse("PRODUCT_SUCCESS_CAUSALITY_DOMAIN_INVALID");
  const behaviorSignatureCore = {
    behaviorId: cleanString(value.behaviorId, 160).toUpperCase(),
    actionPattern: cleanString(value.actionPattern, 160).toUpperCase(),
    causalityDomain,
    scope: cleanStrings(value.scope, { maximumItems: 16, maximumCharacters: 180 }),
    applicabilityTriggers: cleanStrings(value.applicabilityTriggers, {
      maximumItems: 16,
      maximumCharacters: 180
    }),
    exclusions: cleanStrings(value.exclusions, { maximumItems: 24, maximumCharacters: 180 })
  };
  const core = {
    ...behaviorSignatureCore,
    supportingEvidenceHashes: cleanStrings(value.supportingEvidenceHashes, {
      maximumItems: 32,
      maximumCharacters: 80
    }).map((identity) => sha256Identity(identity, "success behavior supporting evidence")),
    causalAttribution: {
      baselineObservationHash: sha256Identity(
        value.causalAttribution.baselineObservationHash,
        "success behavior baseline"
      ),
      treatmentObservationHash: sha256Identity(
        value.causalAttribution.treatmentObservationHash,
        "success behavior treatment"
      ),
      interventionOnlyDifference: value.causalAttribution.interventionOnlyDifference === true,
      evaluatorAttributionConfirmed: value.causalAttribution.evaluatorAttributionConfirmed === true,
      externalContributionDominant: value.causalAttribution.externalContributionDominant === true
    }
  };
  const behaviorSignatureHash = sha256Object(behaviorSignatureCore);
  if (value.behaviorSignatureHash && value.behaviorSignatureHash !== behaviorSignatureHash) {
    refuse("PRODUCT_SUCCESS_BEHAVIOR_SIGNATURE_TAMPERED");
  }
  return Object.freeze({
    ...core,
    behaviorSignatureHash
  });
}

function classifyProductFeedbackDomain(feedback = null) {
  const claim = feedback?.failedClaim || feedback?.failed_claim || {};
  const signature = `${claim.claimClass || ""} ${claim.failureKind || ""}`;
  if (/(?:research|query|search|comparable|price|pricing|value|valuation|provenance|evidence)/i.test(signature)) {
    return "COMPARABLE_RESEARCH_STRATEGY";
  }
  if (/(?:identity|identification|object[ _-]?class|visual[ _-]?subject|visible[ _-]?object)/i.test(signature)) {
    return "VISIBLE_OBJECT_CLASS_IDENTIFICATION";
  }
  return "";
}

const MENTOR_IDENTITY_GATE_BINDING_FIELDS = Object.freeze([
  "candidateId",
  "failureId",
  "diagnosisId",
  "memoryId",
  "memoryContentHash",
  "mentorDecisionIdentity"
]);

const MENTOR_IDENTITY_CAUSAL_ADJUDICATION_FIELDS = Object.freeze([
  ...MENTOR_IDENTITY_GATE_BINDING_FIELDS,
  "evaluationArtifactSource",
  "productResponseArtifactSource"
]);

function authenticatedIdentityObservation({
  learningScopeIdentity,
  outcome,
  feedback,
  failureId,
  diagnosisId,
  candidateId,
  candidateMemory
}) {
  if (!/^[A-Z0-9_]+$/.test(feedback.failed_claim.failureKind)) {
    refuse("LESSON_GATE_FAILURE_KIND_INVALID");
  }
  const signature = createCausalSignature({
    earliestSupportedLossBoundary: "IDENTITY_FORMATION",
    causalMechanism: CAUSAL_MECHANISM.UNSUPPORTED_OBJECT_IDENTITY,
    failureClassification: FAILURE_CLASSIFICATION.UNSUPPORTED_OBJECT_IDENTITY,
    causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
    triggerClass: "AUTHENTICATED_VISIBLE_OBJECT_CLASS_FAILURE"
  });
  const observation = {
    schemaVersion: "1.0",
    sourceRecordHash: outcome.outcome_id,
    sourceArtifactHash: outcome.response_hash,
    sourceTrustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    sourceIntegrityValid: true,
    sourceIntegrityFailures: [],
    episodeIdentity: sha256Object({
      recordType: "GOVERNED_PRODUCT_EPISODE_IDENTITY",
      learningScopeIdentity,
      episodeId: outcome.episode_id,
      outcomeId: outcome.outcome_id
    }),
    objectClassIdentity: sha256Object({
      recordType: "GOVERNED_PRODUCT_OBJECT_CLASS_IDENTITY",
      learningScopeIdentity,
      submittedObjectFingerprint: outcome.submitted_object_fingerprint
    }),
    causalEventIdentity: sha256Object({
      recordType: "GOVERNED_PRODUCT_IDENTITY_FAILURE_EVENT",
      failureId,
      diagnosisId,
      feedbackId: feedback.feedback_id
    }),
    sourceLineageIdentity: sha256Object({
      recordType: "GOVERNED_PRODUCT_MENTOR_CANDIDATE_LINEAGE",
      candidateId,
      memoryId: candidateMemory.memoryId,
      memoryContentHash: candidateMemory.contentHash
    }),
    expectedState: "VISIBLE_OBJECT_CLASS_IDENTIFIED",
    actualState: feedback.failed_claim.failureKind,
    earliestSupportedLossBoundary: "IDENTITY_FORMATION",
    outcome: "FAILURE",
    failureClassification: FAILURE_CLASSIFICATION.UNSUPPORTED_OBJECT_IDENTITY,
    causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
    causalMechanism: CAUSAL_MECHANISM.UNSUPPORTED_OBJECT_IDENTITY,
    eligibleForLessonSupport: false,
    supportExclusionReasons: ["INTERNAL_CAUSE_NOT_ESTABLISHED"],
    causalSignatureHash: signature.signatureHash,
    counterexampleForSignatureHash: "",
    observationHash: ""
  };
  observation.observationHash = sha256Object(observation);
  return validateAuthenticatedEpisodeObservation(observation);
}

function mentorIdentityGateDiagnosis({
  learningScopeIdentity,
  observation,
  candidateEvent,
  candidateLedgerEvent,
  failureEvent,
  diagnosisEvent,
  feedbackEvent,
  outcome,
  candidateMemory
}) {
  const governedLearningBinding = {
    learningScopeIdentity,
    candidateEventId: candidateEvent.candidate_id,
    candidateLedgerEventIdentity: candidateLedgerEvent.event_id,
    failureId: failureEvent.payload.failure_id,
    failureLedgerEventIdentity: failureEvent.event_id,
    diagnosisId: diagnosisEvent.payload.diagnosis_id,
    diagnosisLedgerEventIdentity: diagnosisEvent.event_id,
    memoryId: candidateMemory.memoryId,
    memoryContentHash: candidateMemory.contentHash,
    mentorDecisionIdentity: diagnosisEvent.payload.mentor_decision_identity,
    feedbackId: feedbackEvent.payload.feedback_id,
    feedbackLedgerEventIdentity: feedbackEvent.event_id,
    outcomeId: outcome.outcome_id,
    outcomeResponseHash: outcome.response_hash
  };
  const principle = "At IDENTITY_FORMATION, preserve authenticated returned evidence and unresolved causality until independent internal causal support establishes a registered mechanism.";
  const core = {
    schemaVersion: "1.0",
    recordType: "MENTOR_ORIGINATED_CAUSAL_DIAGNOSIS",
    status: "PROVISIONAL_DIAGNOSIS_ONLY",
    disposition: "INSUFFICIENT_CAUSAL_SUPPORT",
    supportingEpisodes: [observation],
    supportingEpisodeIdentities: [observation.episodeIdentity],
    failureStage: "IDENTITY_FORMATION",
    boundaryOrdinal: 3,
    violatedInvariant: {
      expectedState: observation.expectedState,
      actualState: observation.actualState
    },
    causeVsSymptomEvidence: {
      causalMechanism: observation.causalMechanism,
      failureClassification: observation.failureClassification,
      causalityDomain: observation.causalityDomain,
      causalObservationHashes: [observation.observationHash],
      downstreamSymptoms: [],
      counterevidence: []
    },
    confidence: {
      band: "LOW",
      score: 0.1,
      basis: [
        "AUTHENTICATED_FAILURE_OBSERVATIONS:1",
        "INDEPENDENT_INTERNAL_CAUSAL_SUPPORT:0"
      ],
      independentlySupportingEpisodeCount: 0,
      independentObjectClassCount: 0,
      counterevidenceCount: 0,
      uncertainty: ["INTERNAL_CAUSE_NOT_ESTABLISHED"]
    },
    uncertainty: ["INTERNAL_CAUSE_NOT_ESTABLISHED"],
    competingExplanations: [],
    generalizedCorrectivePrinciple: principle,
    generalRule: principle,
    applicability: {
      causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
      failureClassification: FAILURE_CLASSIFICATION.UNSUPPORTED_OBJECT_IDENTITY,
      causalMechanism: CAUSAL_MECHANISM.UNSUPPORTED_OBJECT_IDENTITY,
      earliestBoundary: "IDENTITY_FORMATION",
      requiredPrecondition: "AUTHENTICATED_VISIBLE_OBJECT_CLASS_FAILURE",
      prohibitedTransition: "RELABEL_UNRESOLVED_CAUSALITY_AS_INTERNAL"
    },
    scope: {
      causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
      failureClassification: FAILURE_CLASSIFICATION.UNSUPPORTED_OBJECT_IDENTITY,
      causalMechanism: CAUSAL_MECHANISM.UNSUPPORTED_OBJECT_IDENTITY,
      earliestBoundary: "IDENTITY_FORMATION"
    },
    exclusions: [
      "OBJECT_SPECIFIC_ANSWER",
      "EPISODE_IDENTITY_AS_DECISION_RULE",
      "EXTERNAL_CAUSE_RELABELED_AS_INTERNAL",
      "PROVIDER_OR_TRANSPORT_CAUSE_ASSUMPTION",
      "UNAUTHENTICATED_CORRECTION"
    ],
    requiredFixedTrials: [
      {
        trialClass: "CAUSAL_REPRODUCTION",
        requiredCount: 1,
        successCriterion: "A_REGISTERED_INTERNAL_CAUSE_REPRODUCES_AT_IDENTITY_FORMATION"
      },
      {
        trialClass: "CORRECTED_PATH",
        requiredCount: 2,
        successCriterion: "THE_VISIBLE_OBJECT_CLASS_IS_SUPPORTED_BY_AUTHENTICATED_EVIDENCE"
      },
      {
        trialClass: "NON_APPLICABLE_TRANSFER",
        requiredCount: 2,
        successCriterion: "UNRELATED_IDENTITY_CONTEXTS_REMAIN_UNCHANGED"
      },
      {
        trialClass: "ADVERSE_TRANSFER",
        requiredCount: 1,
        successCriterion: "UNSUPPORTED_OR_OVERBROAD_IDENTITY_TRANSFER_FAILS_CLOSED"
      }
    ],
    expectedMeasurableImprovement: {
      metric: "AUTHENTICATED_VISIBLE_OBJECT_CLASS_FAILURE_COUNT",
      observedFailureCount: 1,
      targetFailureCount: 0,
      preservationMetric: "UNSUPPORTED_IDENTITY_ASSERTION_COUNT",
      preservationTarget: 0
    },
    safetyAndTransferRisks: [
      "FALSE_INTERNAL_CAUSAL_ATTRIBUTION",
      "OBJECT_SPECIFIC_GENERALIZATION",
      "UNSUPPORTED_IDENTITY_ASSERTION"
    ],
    rejectionConditions: [
      "INTERNAL_CAUSE_NOT_ESTABLISHED",
      "CAUSE_DOES_NOT_REPRODUCE",
      "PROVIDER_OR_EXTERNAL_CAUSE_BETTER_EXPLAINS_THE_FAILURE"
    ],
    rollbackConditions: [
      "NON_APPLICABLE_BEHAVIOR_CHANGES",
      "UNSUPPORTED_IDENTITY_ASSERTIONS_INCREASE",
      "EXISTING_SAFETY_OR_STOPPING_INVARIANT_REGRESSES"
    ],
    governedLearningBinding,
    persistAsMemory: false,
    promotionAuthorized: false,
    runtimeConsumptionAuthorized: false,
    productChangeAuthorized: false,
    diagnosisId: diagnosisEvent.payload.diagnosis_id,
    candidateHash: ""
  };
  core.candidateHash = sha256Object(core);
  return core;
}

function parseFrozenJsonArtifact(source, label, maximumBytes) {
  if (typeof source !== "string" || Buffer.byteLength(source, "utf8") > maximumBytes) {
    refuse("MENTOR_CAUSAL_ARTIFACT_SOURCE_INVALID", label);
  }
  let value;
  try {
    value = JSON.parse(source);
  } catch {
    refuse("MENTOR_CAUSAL_ARTIFACT_JSON_INVALID", label);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    refuse("MENTOR_CAUSAL_ARTIFACT_OBJECT_REQUIRED", label);
  }
  return Object.freeze({
    value,
    sha256: createHash("sha256").update(source, "utf8").digest("hex")
  });
}

function visibleObjectClassCorrection(value) {
  const token = cleanString(value, 120)
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!token) refuse("MENTOR_IDENTITY_EVALUATION_GROUND_TRUTH_INVALID");
  return `VISIBLE_OBJECT_CLASS_${token}`;
}

function productClaimValue(productResponse, claimPath) {
  const parts = cleanString(claimPath, 180).split(".");
  if (parts.length === 0 || parts.length > 8 || parts.some((part) => !/^[A-Za-z][A-Za-z0-9_]*$/.test(part))) {
    refuse("MENTOR_IDENTITY_PRODUCT_CLAIM_PATH_INVALID");
  }
  let value = productResponse;
  for (const part of parts) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, part)) {
      refuse("MENTOR_IDENTITY_PRODUCT_CLAIM_MISSING");
    }
    value = value[part];
  }
  return value;
}

function authenticatedIdentityCausalObservation({
  learningScopeIdentity,
  candidateEvent,
  failureEvent,
  diagnosisEvent,
  candidateLedgerEvent,
  feedbackEvent,
  feedback,
  outcome,
  candidateMemory,
  evaluationArtifactSource,
  productResponseArtifactSource
}) {
  const evaluationArtifact = parseFrozenJsonArtifact(
    evaluationArtifactSource,
    "independent visible-outcome evaluation",
    64 * 1024
  );
  const productArtifact = parseFrozenJsonArtifact(
    productResponseArtifactSource,
    "authenticated product response",
    4 * 1024 * 1024
  );
  const evaluation = evaluationArtifact.value;
  exactObject(evaluation, [
    "object_type", "schema_version", "rubric_id", "independent", "provider_authored",
    "self_evaluation", "episode_id", "cohort", "ground_truth_object_class",
    "ground_truth_transmitted_to_product", "checks", "result", "failure_preservation",
    "product_output_sha256", "evaluated_at"
  ]);
  exactObject(evaluation.checks, [
    "http_200_product_response", "product_output_hash_authenticated",
    "cognitive_and_experience_integrity_present",
    "visible_object_class_or_unambiguous_synonym_supported",
    "contradictory_object_class_detected", "unresolved_fatal_regression"
  ]);
  const failurePreservation = cleanStrings(evaluation.failure_preservation, {
    maximumItems: 16,
    maximumCharacters: 120
  });
  canonicalIso(evaluation.evaluated_at);
  const evaluatorContractValid = evaluation.object_type === "KATHERINE_VISIBLE_OUTCOME_EVALUATION"
    && evaluation.schema_version === "1.0.0"
    && evaluation.rubric_id === "KATHERINE_VISIBLE_OUTCOME_EVALUATOR_V1"
    && evaluation.independent === true
    && evaluation.provider_authored === false
    && evaluation.self_evaluation === false
    && evaluation.episode_id === outcome.episode_id
    && evaluation.ground_truth_transmitted_to_product === false
    && evaluation.result === "FAILURE"
    && evaluation.checks.http_200_product_response === true
    && evaluation.checks.product_output_hash_authenticated === true
    && evaluation.checks.cognitive_and_experience_integrity_present === true
    && evaluation.checks.visible_object_class_or_unambiguous_synonym_supported === false
    && evaluation.checks.contradictory_object_class_detected === false
    && evaluation.checks.unresolved_fatal_regression === false
    && failurePreservation.includes("INSUFFICIENT_IDENTITY_SUPPORT");
  if (!evaluatorContractValid) refuse("MENTOR_IDENTITY_EVALUATION_CONTRACT_INVALID");
  const productOutputSha256 = sha256Identity(evaluation.product_output_sha256, "evaluated product response");
  if (
    evaluationArtifact.sha256 !== feedback.correction.evidenceProvenance.sourceIdentity
    || productArtifact.sha256 !== productOutputSha256
    || sha256Object(productArtifact.value) !== outcome.response_hash
    || feedback.correction.evidenceProvenance.authorityClass !== "OWNER_AUTHORIZED_INDEPENDENT_EVALUATOR"
    || feedback.correction.evidenceProvenance.sourceType
      !== "AUTHENTICATED_FROZEN_IMAGE_AND_PRODUCT_RESPONSE_REVIEW"
    || feedback.correction.evidenceProvenance.providerAuthored !== false
    || feedback.failed_claim.claimPath !== "valuation.identifiedItem"
    || feedback.failed_claim.claimClass !== "VISIBLE_OBJECT_CLASS_IDENTIFICATION"
    || feedback.failed_claim.failureKind !== "FAILED_VISIBLE_OBJECT_CLASS_IDENTIFICATION"
    || feedback.correction.correctedState !== visibleObjectClassCorrection(evaluation.ground_truth_object_class)
    || productClaimValue(productArtifact.value, feedback.failed_claim.claimPath)
      !== feedback.failed_claim.assertedValue
  ) refuse("MENTOR_IDENTITY_EVALUATION_BINDING_INVALID");

  const signature = createCausalSignature({
    earliestSupportedLossBoundary: "IDENTITY_FORMATION",
    causalMechanism: CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE,
    failureClassification: FAILURE_CLASSIFICATION.UNSUPPORTED_OBJECT_IDENTITY,
    causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
    triggerClass: "AUTHENTICATED_VISIBLE_OBJECT_CLASS_FAILURE"
  });
  const observation = {
    schemaVersion: "1.0",
    sourceRecordHash: evaluationArtifact.sha256,
    sourceArtifactHash: productArtifact.sha256,
    sourceTrustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    sourceIntegrityValid: true,
    sourceIntegrityFailures: [],
    episodeIdentity: sha256Object({
      recordType: "GOVERNED_PRODUCT_EPISODE_IDENTITY",
      learningScopeIdentity,
      episodeId: outcome.episode_id,
      outcomeId: outcome.outcome_id
    }),
    objectClassIdentity: sha256Object({
      recordType: "GOVERNED_PRODUCT_OBJECT_CLASS_IDENTITY",
      learningScopeIdentity,
      submittedObjectFingerprint: outcome.submitted_object_fingerprint
    }),
    causalEventIdentity: sha256Object({
      recordType: "AUTHENTICATED_IDENTITY_CAUSAL_ADJUDICATION_EVENT",
      failureLedgerEventIdentity: failureEvent.event_id,
      diagnosisLedgerEventIdentity: diagnosisEvent.event_id,
      candidateLedgerEventIdentity: candidateLedgerEvent.event_id,
      feedbackLedgerEventIdentity: feedbackEvent.event_id,
      evaluationArtifactSha256: evaluationArtifact.sha256
    }),
    sourceLineageIdentity: sha256Object({
      recordType: "GOVERNED_PRODUCT_MENTOR_CANDIDATE_LINEAGE",
      candidateId: candidateEvent.candidate_id,
      memoryId: candidateMemory.memoryId,
      memoryContentHash: candidateMemory.contentHash
    }),
    expectedState: "VISIBLE_OBJECT_CLASS_OR_UNAMBIGUOUS_SYNONYM_SUPPORTED",
    actualState: "VISIBLE_OBJECT_CLASS_SUPPORT_ABSENT",
    earliestSupportedLossBoundary: "IDENTITY_FORMATION",
    outcome: "FAILURE",
    failureClassification: FAILURE_CLASSIFICATION.UNSUPPORTED_OBJECT_IDENTITY,
    causalityDomain: CAUSALITY_DOMAIN.UNRESOLVED,
    causalMechanism: CAUSAL_MECHANISM.UNRESOLVED_TERMINAL_FAILURE,
    eligibleForLessonSupport: false,
    supportExclusionReasons: ["INTERNAL_CAUSE_NOT_ESTABLISHED"],
    causalSignatureHash: signature.signatureHash,
    counterexampleForSignatureHash: "",
    observationHash: ""
  };
  observation.observationHash = sha256Object(observation);
  return Object.freeze({
    observation: validateAuthenticatedEpisodeObservation(observation),
    evaluationArtifactSha256: evaluationArtifact.sha256,
    productResponseArtifactSha256: productArtifact.sha256
  });
}

function canonicalProviderResponseBindings(values = []) {
  if (!Array.isArray(values) || values.length > 32) refuse("PRODUCT_SUCCESS_PROVIDER_RESPONSE_CARDINALITY");
  const responses = values.map((value) => {
    exactObject(value, ["requestIdentity", "responseIdentity", "responseHash", "providerAuthored"]);
    if (value.providerAuthored !== false) refuse("PRODUCT_SUCCESS_PROVIDER_AUTHORITY_PROHIBITED");
    return Object.freeze({
      requestIdentity: sha256Identity(value.requestIdentity, "success provider request"),
      responseIdentity: sha256Identity(value.responseIdentity, "success provider response identity"),
      responseHash: sha256Identity(value.responseHash, "success provider response hash"),
      providerAuthored: false
    });
  }).sort((left, right) => left.responseIdentity.localeCompare(right.responseIdentity));
  if (new Set(responses.map((item) => item.responseIdentity)).size !== responses.length) {
    refuse("PRODUCT_SUCCESS_PROVIDER_RESPONSE_DUPLICATE");
  }
  return responses;
}

export function sealStoredProductSuccessArtifact(value = {}) {
  exactObject(value, [
    "schemaVersion",
    "artifactType",
    "episodeId",
    "outcomeId",
    "inputBinding",
    "providerResponses",
    "productOutput",
    "independentEvaluation",
    "modelIdentity",
    "policyVersion",
    "productSchemaVersion",
    "behaviorTrace",
    "expectedSuccessNoLesson",
    "counterevidenceHashes",
    "alternativeExplanations",
    "provenance",
    "unresolvedFatalRegression",
    "evaluatedAt"
  ]);
  if (value.schemaVersion !== GOVERNED_LEARNING_SCHEMA_VERSION) refuse("PRODUCT_SUCCESS_ARTIFACT_SCHEMA_INVALID");
  if (value.artifactType !== "FROZEN_INDEPENDENT_PRODUCT_SUCCESS_EVALUATION") {
    refuse("PRODUCT_SUCCESS_ARTIFACT_TYPE_INVALID");
  }
  exactObject(value.inputBinding, ["inputIdentity", "inputHash"], ["imageIdentity", "imageHash"]);
  exactObject(value.productOutput, ["outputIdentity", "outputHash"]);
  exactObject(value.provenance, ["authorityClass", "sourceType", "sourceIdentity", "providerAuthored"]);
  const inputBinding = {
    inputIdentity: sha256Identity(value.inputBinding.inputIdentity, "success input identity"),
    inputHash: sha256Identity(value.inputBinding.inputHash, "success input hash"),
    imageIdentity: optionalSha256Identity(value.inputBinding.imageIdentity, "success image identity"),
    imageHash: optionalSha256Identity(value.inputBinding.imageHash, "success image hash")
  };
  if (Boolean(inputBinding.imageIdentity) !== Boolean(inputBinding.imageHash)) {
    refuse("PRODUCT_SUCCESS_IMAGE_BINDING_INCOMPLETE");
  }
  if (value.provenance.providerAuthored !== false) refuse("PRODUCT_SUCCESS_PROVIDER_PROVENANCE_PROHIBITED");
  if (value.unresolvedFatalRegression !== false) refuse("PRODUCT_SUCCESS_FATAL_REGRESSION_UNRESOLVED");
  if (typeof value.expectedSuccessNoLesson !== "boolean") refuse("PRODUCT_SUCCESS_EXPECTATION_BOOLEAN_REQUIRED");
  if (!Array.isArray(value.behaviorTrace) || value.behaviorTrace.length === 0 || value.behaviorTrace.length > 16) {
    refuse("PRODUCT_SUCCESS_BEHAVIOR_TRACE_CARDINALITY");
  }
  const behaviorTrace = value.behaviorTrace.map(canonicalSuccessBehaviorTrace)
    .sort((left, right) => left.behaviorSignatureHash.localeCompare(right.behaviorSignatureHash));
  if (new Set(behaviorTrace.map((item) => item.behaviorSignatureHash)).size !== behaviorTrace.length) {
    refuse("PRODUCT_SUCCESS_BEHAVIOR_TRACE_DUPLICATE");
  }
  const core = {
    schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
    artifactType: "FROZEN_INDEPENDENT_PRODUCT_SUCCESS_EVALUATION",
    episodeId: cleanString(value.episodeId, 160),
    outcomeId: sha256Identity(value.outcomeId, "success outcome identity"),
    inputBinding,
    providerResponses: canonicalProviderResponseBindings(value.providerResponses),
    productOutput: {
      outputIdentity: sha256Identity(value.productOutput.outputIdentity, "success output identity"),
      outputHash: sha256Identity(value.productOutput.outputHash, "success output hash")
    },
    independentEvaluation: canonicalIndependentProductSuccessEvaluation(value.independentEvaluation),
    modelIdentity: cleanString(value.modelIdentity, 160),
    policyVersion: cleanString(value.policyVersion, 80),
    productSchemaVersion: cleanString(value.productSchemaVersion, 80),
    behaviorTrace,
    expectedSuccessNoLesson: value.expectedSuccessNoLesson,
    counterevidenceHashes: cleanStrings(value.counterevidenceHashes, {
      maximumItems: 32,
      maximumCharacters: 80,
      allowEmpty: true
    }).map((identity) => sha256Identity(identity, "success counterevidence")),
    alternativeExplanations: cleanStrings(value.alternativeExplanations, {
      maximumItems: 16,
      maximumCharacters: 180,
      allowEmpty: true
    }),
    provenance: {
      authorityClass: cleanString(value.provenance.authorityClass, 120),
      sourceType: cleanString(value.provenance.sourceType, 120),
      sourceIdentity: sha256Identity(value.provenance.sourceIdentity, "success provenance"),
      providerAuthored: false
    },
    unresolvedFatalRegression: false,
    evaluatedAt: canonicalIso(value.evaluatedAt)
  };
  return successHashRecord(core, "artifactHash");
}

function canonicalStoredProductSuccessArtifact(value = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) refuse("PRODUCT_SUCCESS_ARTIFACT_REQUIRED");
  const core = { ...value };
  delete core.artifactHash;
  const expected = sealStoredProductSuccessArtifact(core);
  if (stableObjectJson(value) !== stableObjectJson(expected)) refuse("PRODUCT_SUCCESS_ARTIFACT_TAMPERED");
  return expected;
}

function authenticateStoredProductSuccess({ artifact, outcomeEvent, learningScopeIdentity }) {
  const frozen = canonicalStoredProductSuccessArtifact(artifact);
  if (!outcomeEvent || outcomeEvent.event_type !== "PRODUCT_OUTCOME_RECORDED") {
    refuse("PRODUCT_SUCCESS_OUTCOME_LEDGER_EVENT_MISSING");
  }
  const outcome = outcomeEvent.payload;
  if (
    outcome.episode_id !== frozen.episodeId
    || outcome.outcome_id !== frozen.outcomeId
    || outcome.original_evidence_identity !== frozen.inputBinding.inputHash
    || outcome.response_hash !== frozen.productOutput.outputHash
  ) refuse("PRODUCT_SUCCESS_OUTCOME_BINDING");
  const modelIdentityHash = sha256Object({ modelIdentity: frozen.modelIdentity });
  const adapterIdentityHash = sha256Object({ adapterIdentity: GOVERNED_LEARNING_ADAPTER_IDENTITY });
  if ([modelIdentityHash, adapterIdentityHash].includes(frozen.independentEvaluation.evaluatorIdentity)) {
    refuse("PRODUCT_SUCCESS_SELF_EVALUATION_PROHIBITED");
  }
  const boundEvidence = new Set([
    frozen.inputBinding.inputIdentity,
    frozen.inputBinding.inputHash,
    frozen.inputBinding.imageIdentity,
    frozen.inputBinding.imageHash,
    frozen.productOutput.outputIdentity,
    frozen.productOutput.outputHash,
    frozen.independentEvaluation.evaluationIdentity,
    frozen.independentEvaluation.evaluationRecordHash,
    frozen.outcomeId,
    outcome.cognitive_episode_hash,
    outcome.memory_transition_hash,
    outcomeEvent.event_id,
    ...frozen.providerResponses.flatMap((response) => [
      response.requestIdentity,
      response.responseIdentity,
      response.responseHash
    ]),
    ...frozen.behaviorTrace.flatMap((trace) => [
      trace.causalAttribution.baselineObservationHash,
      trace.causalAttribution.treatmentObservationHash
    ])
  ].filter(Boolean));
  if (frozen.behaviorTrace.some((trace) => (
    trace.supportingEvidenceHashes.some((identity) => !boundEvidence.has(identity))
  ))) refuse("PRODUCT_SUCCESS_BEHAVIOR_EVIDENCE_UNBOUND");
  const activeLessonBundleIdentity = sha256Object({
    memoryTransitionHash: outcome.memory_transition_hash
  });
  const observation = successHashRecord({
    schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
    recordType: "AUTHENTICATED_PRODUCT_SUCCESS_OBSERVATION",
    authenticationState: "LEDGER_AUTHENTICATED",
    outcome: "SUCCESS",
    sourceTrustClass: "SEALED_AUTHORITATIVE_EXPERIENCE",
    sourceIntegrityValid: true,
    eligibleForLessonSupport: true,
    successObservationId: sha256Object({
      artifactHash: frozen.artifactHash,
      outcomeId: frozen.outcomeId,
      ledgerEventIdentity: outcomeEvent.event_id
    }),
    sourceRecordHash: frozen.outcomeId,
    sourceArtifactHash: outcome.cognitive_episode_hash,
    episodeId: frozen.episodeId,
    episodeIdentity: sha256Object({
      learningScopeIdentity,
      episodeId: frozen.episodeId,
      outcomeId: frozen.outcomeId
    }),
    objectClassIdentity: sha256Object({
      submittedObjectFingerprint: outcome.submitted_object_fingerprint
    }),
    outcomeIdentity: frozen.outcomeId,
    outcomeLedgerEventIdentity: outcomeEvent.event_id,
    ledgerEventIdentity: outcomeEvent.event_id,
    activeMemoryTransitionIdentity: outcome.memory_transition_hash,
    inputBinding: frozen.inputBinding,
    providerResponses: frozen.providerResponses,
    productOutput: frozen.productOutput,
    independentEvaluation: frozen.independentEvaluation,
    modelIdentity: frozen.modelIdentity,
    modelIdentityHash,
    adapterIdentity: GOVERNED_LEARNING_ADAPTER_IDENTITY,
    adapterIdentityHash,
    policyVersion: frozen.policyVersion,
    policyIdentityHash: sha256Object({
      policyVersion: frozen.policyVersion,
      productSchemaVersion: frozen.productSchemaVersion
    }),
    productSchemaVersion: frozen.productSchemaVersion,
    activeLessonBundleIdentity,
    provenance: frozen.provenance,
    behaviorTrace: frozen.behaviorTrace,
    expectedSuccessNoLesson: frozen.expectedSuccessNoLesson,
    counterevidenceHashes: frozen.counterevidenceHashes,
    alternativeExplanations: frozen.alternativeExplanations,
    unresolvedFatalRegression: false,
    providerLifecycleAuthority: false,
    recordedAt: frozen.evaluatedAt,
    frozenSuccessArtifactHash: frozen.artifactHash
  }, "observationHash");
  validateAuthenticatedProductSuccessObservation(observation);
  return observation;
}

function withObjectHash(value, field) {
  const core = { ...value };
  delete core[field];
  return Object.freeze({ ...core, [field]: sha256Object(core) });
}

function assertObjectHash(value, field, code) {
  if (!value || typeof value !== "object" || Array.isArray(value)) refuse(code);
  const core = { ...value };
  delete core[field];
  if (value[field] !== sha256Object(core)) refuse(code);
  return value;
}

function researchEvidenceRiskFeatures(value = {}) {
  exactObject(value, [
    "canonicalIdentityUnresolvedCount", "unsupportedQueryTermCount", "exactComparableCount",
    "closeComparableCount", "categoryComparableCount", "weakPriceProvenanceCount",
    "valueJudgmentExceedsEvidenceCount"
  ]);
  return Object.freeze({
    canonicalIdentityUnresolvedCount: violationCount(value.canonicalIdentityUnresolvedCount, "canonicalIdentityUnresolvedCount"),
    unsupportedQueryTermCount: violationCount(value.unsupportedQueryTermCount, "unsupportedQueryTermCount"),
    exactComparableCount: violationCount(value.exactComparableCount, "exactComparableCount"),
    closeComparableCount: violationCount(value.closeComparableCount, "closeComparableCount"),
    categoryComparableCount: violationCount(value.categoryComparableCount, "categoryComparableCount"),
    weakPriceProvenanceCount: violationCount(value.weakPriceProvenanceCount, "weakPriceProvenanceCount"),
    valueJudgmentExceedsEvidenceCount: violationCount(value.valueJudgmentExceedsEvidenceCount, "valueJudgmentExceedsEvidenceCount")
  });
}

export function classifyGovernedResearchApplicability(value = {}) {
  const features = researchEvidenceRiskFeatures(value);
  const planCount = features.exactComparableCount + features.closeComparableCount + features.categoryComparableCount;
  const sparseLadder = features.canonicalIdentityUnresolvedCount > 0
    && (features.closeComparableCount === 0 || features.categoryComparableCount === 0);
  const evidenceRiskCount = features.unsupportedQueryTermCount
    + features.weakPriceProvenanceCount
    + features.valueJudgmentExceedsEvidenceCount
    + (sparseLadder ? 1 : 0);
  let classification = GOVERNED_RESEARCH_APPLICABILITY.CLEAR;
  if (planCount === 0) {
    classification = GOVERNED_RESEARCH_APPLICABILITY.NO_RESEARCH_PLAN;
  } else if (evidenceRiskCount > 0) {
    classification = GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE;
  } else if (features.exactComparableCount + features.closeComparableCount === 0) {
    classification = GOVERNED_RESEARCH_APPLICABILITY.SPARSE_EVIDENCE;
  }
  const applicable = classification === GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE;
  return withObjectHash({
    schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
    decisionType: "GOVERNED_RESEARCH_APPLICABILITY_DECISION",
    features,
    classification,
    applicable,
    requiredApplicabilitySignals: applicable
      ? ["COMPARABLE_RESEARCH_STRATEGY_RISK", "CANONICAL_PRODUCT_STATE"]
      : [],
    authoritativeNonReuseDecision: applicable ? "AUTHORIZED_PROCESS_STRATEGY_APPLICABILITY" : classification,
    providerLifecycleAuthority: false
  }, "applicabilityDecisionHash");
}

function governedResearchOutcomeFeatures(value = {}) {
  exactObject(value, [
    "providerCallsAttempted", "providerCallsSucceeded", "transportFailureCount",
    "traceableSourceCount", "normalizedCandidateCount", "exactComparableCount",
    "closeComparableCount", "categoryComparableCount", "priceBearingComparableCount", "strategyDiscardedCandidateCount",
    "serializationLossCount", "unsupportedQueryTermCount", "weakPriceProvenanceCount",
    "valueJudgmentExceedsEvidenceCount", "groundedPlan", "fullLadderExecuted"
  ]);
  if (typeof value.groundedPlan !== "boolean" || typeof value.fullLadderExecuted !== "boolean") {
    refuse("LEARNING_RESEARCH_OUTCOME_BOOLEAN_INVALID");
  }
  return Object.freeze({
    providerCallsAttempted: violationCount(value.providerCallsAttempted, "providerCallsAttempted"),
    providerCallsSucceeded: violationCount(value.providerCallsSucceeded, "providerCallsSucceeded"),
    transportFailureCount: violationCount(value.transportFailureCount, "transportFailureCount"),
    traceableSourceCount: violationCount(value.traceableSourceCount, "traceableSourceCount"),
    normalizedCandidateCount: violationCount(value.normalizedCandidateCount, "normalizedCandidateCount"),
    exactComparableCount: violationCount(value.exactComparableCount, "exactComparableCount"),
    closeComparableCount: violationCount(value.closeComparableCount, "closeComparableCount"),
    categoryComparableCount: violationCount(value.categoryComparableCount, "categoryComparableCount"),
    priceBearingComparableCount: violationCount(value.priceBearingComparableCount, "priceBearingComparableCount"),
    strategyDiscardedCandidateCount: violationCount(value.strategyDiscardedCandidateCount, "strategyDiscardedCandidateCount"),
    serializationLossCount: violationCount(value.serializationLossCount, "serializationLossCount"),
    unsupportedQueryTermCount: violationCount(value.unsupportedQueryTermCount, "unsupportedQueryTermCount"),
    weakPriceProvenanceCount: violationCount(value.weakPriceProvenanceCount, "weakPriceProvenanceCount"),
    valueJudgmentExceedsEvidenceCount: violationCount(value.valueJudgmentExceedsEvidenceCount, "valueJudgmentExceedsEvidenceCount"),
    groundedPlan: value.groundedPlan,
    fullLadderExecuted: value.fullLadderExecuted
  });
}

export function classifyGovernedResearchOutcome(value = {}) {
  const features = governedResearchOutcomeFeatures(value);
  const retainedComparableCount = features.exactComparableCount
    + features.closeComparableCount
    + features.categoryComparableCount;
  const outcomeProjectionRiskCount = features.weakPriceProvenanceCount
    + features.valueJudgmentExceedsEvidenceCount
    + features.serializationLossCount;
  const operationalFailure = features.providerCallsAttempted > 0
    && features.providerCallsSucceeded === 0
    && features.transportFailureCount > 0;
  const strategyFailure = features.strategyDiscardedCandidateCount > 0
    || features.serializationLossCount > 0
    || features.unsupportedQueryTermCount > 0
    || !features.groundedPlan
    || (features.providerCallsSucceeded > 0 && !features.fullLadderExecuted && retainedComparableCount === 0);

  let classification = GOVERNED_RESEARCH_APPLICABILITY.NO_RESEARCH_PLAN;
  if (operationalFailure) {
    classification = GOVERNED_RESEARCH_APPLICABILITY.OPERATIONAL;
  } else if (strategyFailure || outcomeProjectionRiskCount > 0) {
    classification = GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE;
  } else if (retainedComparableCount > 0 && features.priceBearingComparableCount > 0 && features.groundedPlan) {
    classification = GOVERNED_RESEARCH_APPLICABILITY.CLEAR;
  } else if (features.providerCallsSucceeded > 0 && features.fullLadderExecuted) {
    classification = GOVERNED_RESEARCH_APPLICABILITY.INSUFFICIENT;
  }

  const applicable = classification === GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE;
  return withObjectHash({
    schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
    decisionType: "GOVERNED_RESEARCH_OUTCOME_DECISION",
    features,
    retainedComparableCount,
    classification,
    applicable,
    requiredApplicabilitySignals: applicable
      ? ["COMPARABLE_RESEARCH_STRATEGY_RISK", "CANONICAL_PRODUCT_STATE"]
      : [],
    authoritativeNonReuseDecision: applicable ? "AUTHORIZED_PROCESS_STRATEGY_APPLICABILITY" : classification,
    providerLifecycleAuthority: false
  }, "applicabilityDecisionHash");
}

function canonicalTrialCausalAttribution(value = {}, { requireHash = true } = {}) {
  exactObject(value, [
    "trialRole", "candidateId", "candidateMemoryId", "applicabilityDecisionHash",
    "applicabilityClassification", "trialAuthorizationId", "trialSelectedCandidateIds",
    "trialAppliedCandidateIds", "memoryTransitionHash", "mentorActionId", "mentorDecisionIdentity",
    "governorDecisionIdentity", "governorExecutionEventIdentity", "governorAuthorized",
    "strategyApplied", "providerRequestIdentity", "newEvidenceIdentity",
    "frozenPreInterventionStateHash", "beforeStateHash", "afterStateHash", "researchPlanBeforeHash",
    "researchPlanAfterHash", "researchPlanChanged", "interventionOnlyDifference",
    "providerLifecycleAuthority"
  ], requireHash ? ["causalAttributionHash"] : []);
  const trialRole = cleanString(value.trialRole, 80);
  if (![
    "APPLICABLE_INTERVENTION",
    "NON_APPLICABLE_CONTROL",
    "AUTHORIZED_LESSON_TRANSFER"
  ].includes(trialRole)) {
    refuse("CAUSAL_ATTRIBUTION_ROLE_INVALID");
  }
  const core = {
    trialRole,
    candidateId: optionalCleanString(value.candidateId, 160),
    candidateMemoryId: optionalCleanString(value.candidateMemoryId, 160),
    applicabilityDecisionHash: sha256Identity(value.applicabilityDecisionHash, "applicability decision"),
    applicabilityClassification: cleanString(value.applicabilityClassification, 100),
    trialAuthorizationId: optionalSha256Identity(value.trialAuthorizationId, "trial authorization"),
    trialSelectedCandidateIds: cleanStrings(value.trialSelectedCandidateIds || [], {
      maximumItems: 4,
      maximumCharacters: 160,
      allowEmpty: true
    }),
    trialAppliedCandidateIds: cleanStrings(value.trialAppliedCandidateIds || [], {
      maximumItems: 4,
      maximumCharacters: 160,
      allowEmpty: true
    }),
    memoryTransitionHash: sha256Identity(value.memoryTransitionHash, "memory transition"),
    mentorActionId: optionalCleanString(value.mentorActionId, 100),
    mentorDecisionIdentity: optionalSha256Identity(value.mentorDecisionIdentity, "mentor decision"),
    governorDecisionIdentity: optionalSha256Identity(value.governorDecisionIdentity, "governor decision"),
    governorExecutionEventIdentity: optionalSha256Identity(value.governorExecutionEventIdentity, "governor execution"),
    governorAuthorized: value.governorAuthorized === true,
    strategyApplied: value.strategyApplied === true,
    providerRequestIdentity: optionalSha256Identity(value.providerRequestIdentity, "provider request"),
    newEvidenceIdentity: optionalSha256Identity(value.newEvidenceIdentity, "new evidence"),
    frozenPreInterventionStateHash: sha256Identity(value.frozenPreInterventionStateHash, "frozen pre-intervention state"),
    beforeStateHash: sha256Identity(value.beforeStateHash, "before state"),
    afterStateHash: sha256Identity(value.afterStateHash, "after state"),
    researchPlanBeforeHash: sha256Identity(value.researchPlanBeforeHash, "research plan before"),
    researchPlanAfterHash: sha256Identity(value.researchPlanAfterHash, "research plan after"),
    researchPlanChanged: value.researchPlanChanged === true,
    interventionOnlyDifference: value.interventionOnlyDifference === true,
    providerLifecycleAuthority: false
  };
  if (value.providerLifecycleAuthority !== false) refuse("PROVIDER_LIFECYCLE_AUTHORITY_PROHIBITED");
  const sealed = withObjectHash(core, "causalAttributionHash");
  if (requireHash && value.causalAttributionHash !== sealed.causalAttributionHash) {
    refuse("CAUSAL_ATTRIBUTION_TAMPERED");
  }
  return sealed;
}

export function sealGovernedTrialCausalAttribution(value = {}) {
  return canonicalTrialCausalAttribution(value, { requireHash: false });
}

function pathsFor(root) {
  const resolved = path.resolve(root);
  return {
    root: resolved,
    metadata: path.join(resolved, "workspace.json"),
    secret: path.join(resolved, "private", "hmac.key"),
    ledger: path.join(resolved, "ledger", "events.jsonl"),
    lock: path.join(resolved, ".writer.lock"),
    pendingTransaction: path.join(resolved, "pending-learning-transaction.json"),
    memory: path.join(resolved, "executive-memory"),
    websiteOutcomes: path.join(resolved, "website-outcomes"),
    websiteEvaluations: path.join(resolved, "website-evaluations")
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
    .filter((record) => record.status === "CANDIDATE" && !revoked.has(record.memoryId))
    .map((record) => [record.memoryId, record]));
  return { revoked, promoted, candidates };
}

function validatedRetrievalDecision(governor, executiveMemoryContext, requested, recordsById, revoked) {
  const decision = executiveMemoryContext.retrievalDecision;
  if (!decision) {
    if (requested.length > 0) refuse("AUTHORITATIVE_MEMORY_RETRIEVAL_DECISION_REQUIRED");
    return Object.freeze({
      resultClassification: "VALID_EMPTY",
      selectedMemoryIds: Object.freeze([]),
      rejectedMemoryIds: Object.freeze([]),
      rollbackRefusals: Object.freeze([]),
      researchApplicabilityDecisionHash: "",
      trialAuthorizationId: "",
      retrievalDecisionHash: ""
    });
  }
  if (retrievalDecisionAuthorities.get(decision) !== governor) {
    refuse("AUTHORITATIVE_MEMORY_RETRIEVAL_DECISION_UNREGISTERED");
  }
  assertObjectHash(decision, "retrievalDecisionHash", "AUTHORITATIVE_MEMORY_RETRIEVAL_DECISION_TAMPERED");
  if (
    decision.decisionType !== "GOVERNED_MEMORY_RETRIEVAL_DECISION"
    || decision.runIdentity !== executiveMemoryContext.runIdentity
    || decision.currentEpisodeId !== executiveMemoryContext.currentEpisodeId
    || decision.episodeSequence !== executiveMemoryContext.episodeSequence
    || decision.retrievalReceiptHash !== executiveMemoryContext.retrievalReceiptHash
    || decision.minimumReuseScore !== MINIMUM_GOVERNED_REUSE_SCORE
    || decision.researchApplicabilityDecisionHash
      !== executiveMemoryContext.researchApplicabilityDecision?.applicabilityDecisionHash
    || decision.providerLifecycleAuthority !== false
  ) refuse("AUTHORITATIVE_MEMORY_RETRIEVAL_DECISION_BINDING");
  const selected = cleanStrings(decision.selectedMemoryIds || [], {
    maximumItems: 16,
    maximumCharacters: 160,
    allowEmpty: true
  });
  const rejected = cleanStrings(decision.rejectedMemoryIds || [], {
    maximumItems: 32,
    maximumCharacters: 160,
    allowEmpty: true
  });
  if (stableObjectJson(selected) !== stableObjectJson(requested)) {
    refuse("AUTHORITATIVE_MEMORY_SELECTION_MISMATCH");
  }
  if ([...selected, ...rejected].some((memoryId) => !recordsById.has(memoryId))) {
    refuse("AUTHORITATIVE_MEMORY_DECISION_UNKNOWN_RECORD");
  }
  if (selected.some((memoryId) => rejected.includes(memoryId) || revoked.has(memoryId))) {
    refuse("AUTHORITATIVE_MEMORY_DECISION_CONFLICT");
  }
  const rollbackRefusals = Array.isArray(decision.rollbackRefusals)
    ? decision.rollbackRefusals.map((refusal) => {
      exactObject(refusal, [
        "refusalId", "refusalEventId", "lessonId", "rollbackMemoryId", "rollbackMemoryHash",
        "episodeId", "episodeSequence", "retrievalReceiptHash", "reason"
      ]);
      if (
        !revoked.has(refusal.lessonId)
        || refusal.episodeId !== decision.currentEpisodeId
        || refusal.episodeSequence !== decision.episodeSequence
        || refusal.retrievalReceiptHash !== decision.retrievalReceiptHash
        || refusal.reason !== "ROLLED_BACK_LESSON"
        || !/^[a-f0-9]{64}$/i.test(refusal.refusalId)
        || !/^[a-f0-9]{64}$/i.test(refusal.refusalEventId)
        || !/^[a-f0-9]{64}$/i.test(refusal.rollbackMemoryHash)
      ) refuse("AUTHORITATIVE_ROLLBACK_REFUSAL_INVALID");
      return Object.freeze({ ...refusal });
    })
    : refuse("AUTHORITATIVE_ROLLBACK_REFUSALS_REQUIRED");
  if (new Set(rollbackRefusals.map((item) => item.lessonId)).size !== rollbackRefusals.length) {
    refuse("AUTHORITATIVE_ROLLBACK_REFUSAL_DUPLICATE");
  }
  if (rollbackRefusals.some((item) => selected.includes(item.lessonId))) {
    refuse("ROLLED_BACK_LESSON_SELECTED");
  }
  return Object.freeze({
    resultClassification: cleanString(decision.resultClassification, 80),
    selectedMemoryIds: Object.freeze(selected),
    rejectedMemoryIds: Object.freeze(rejected),
    rollbackRefusals: Object.freeze(rollbackRefusals),
    researchApplicabilityDecisionHash: decision.researchApplicabilityDecisionHash,
    trialAuthorizationId: decision.trialAuthorizationId || "",
    retrievalDecisionHash: decision.retrievalDecisionHash
  });
}

function authoritativeEvidenceIsInsufficient(executiveState = {}) {
  return executiveState.evidenceCondition !== "SUPPORTED"
    || executiveState.failureScope === "INSUFFICIENT_EVIDENCE"
    || executiveState.uncertaintyClass === "INSUFFICIENT_EVIDENCE"
    || executiveState.stoppingState === "INSUFFICIENT_EVIDENCE";
}

export function governLearningContext({
  governor,
  executiveMemoryContext = {},
  authoritativeExecutiveState = {}
} = {}) {
  const records = Array.isArray(executiveMemoryContext.records) ? executiveMemoryContext.records : [];
  for (const record of records) validateMemoryRecord(record);
  const requested = cleanStrings(executiveMemoryContext.selectedMemoryIds || [], {
    maximumItems: 16,
    maximumCharacters: 160,
    allowEmpty: true
  });
  const byId = new Map(records.map((record) => [record.memoryId, record]));
  if (requested.some((memoryId) => !byId.has(memoryId))) refuse("UNMANAGED_EXECUTIVE_MEMORY_SELECTION");
  const { revoked, promoted, candidates } = transitionRecords(records);
  const retrievalDecision = validatedRetrievalDecision(governor, executiveMemoryContext, requested, byId, revoked);
  const trial = executiveMemoryContext.learningMode === "GOVERNED_TRIAL";
  const trialAuthorityValid = trial
    && executiveMemoryContext.trialAuthorization?.governorIdentity === governor?.governorIdentity
    && executiveMemoryContext.trialAuthorization?.authorityType === "GOVERNOR_QUALIFICATION_TRIAL"
    && Array.isArray(executiveMemoryContext.trialAuthorization?.candidateMemoryIds)
    && /^[a-f0-9]{64}$/i.test(executiveMemoryContext.trialAuthorization?.trialAuthorizationId || "")
    && retrievalDecision.trialAuthorizationId === executiveMemoryContext.trialAuthorization.trialAuthorizationId
    && retrievalDecision.researchApplicabilityDecisionHash
      === executiveMemoryContext.trialAuthorization.applicabilityDecisionHash;
  const authorizedCandidateIds = new Set(trialAuthorityValid
    ? executiveMemoryContext.trialAuthorization.candidateMemoryIds
    : []);
  const insufficientEvidence = authoritativeEvidenceIsInsufficient(authoritativeExecutiveState);
  const novelBoundary = authoritativeExecutiveState.memoryReuseBoundary === "NOVEL";
  const researchApplicability = executiveMemoryContext.researchApplicabilityDecision;
  const processStrategyApplicable = researchApplicability?.classification === GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE
    && researchApplicability?.applicable === true;
  const selectedMemoryIds = retrievalDecision.selectedMemoryIds.filter((memoryId) => {
    const record = byId.get(memoryId);
    const processStrategy = record?.recommendedActionPattern === GOVERNED_RESEARCH_STRATEGY_ACTION;
    if ((insufficientEvidence || novelBoundary) && !(processStrategy && processStrategyApplicable)) return false;
    return promoted.has(memoryId)
      || (trialAuthorityValid && candidates.has(memoryId) && authorizedCandidateIds.has(memoryId));
  });
  const rejectedMemoryIds = [...new Set([
    ...retrievalDecision.rejectedMemoryIds,
    ...requested.filter((memoryId) => !selectedMemoryIds.includes(memoryId))
  ])].sort();
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
    insufficientEvidence,
    novelBoundary,
    researchApplicabilityDecision: researchApplicability,
    authoritativeNonReuseDecision: !processStrategyApplicable && researchApplicability?.authoritativeNonReuseDecision
      ? researchApplicability.authoritativeNonReuseDecision
      : insufficientEvidence
        ? "INSUFFICIENT_EVIDENCE_NON_REUSE"
        : novelBoundary
          ? "NOVEL_BOUNDARY_NON_REUSE"
        : retrievalDecision.rollbackRefusals.length > 0
          ? "ROLLED_BACK_LESSON_REFUSED"
          : selectedMemoryIds.length === 0
            ? "NOVEL_OR_NO_APPLICABLE_MEMORY"
            : "AUTHORIZED_TRANSFER",
    retrievalDecisionHash: retrievalDecision.retrievalDecisionHash,
    rollbackRefusals: retrievalDecision.rollbackRefusals,
    providerLifecycleAuthority: false
  });
}

export function finalizeAuthoritativeMemoryTransition({ governedLearning, decision } = {}) {
  if (!governedLearning || !decision?.canonicalDecision || !decision?.inputState?.executiveState) {
    refuse("AUTHORITATIVE_MEMORY_TRANSITION_INPUT_REQUIRED");
  }
  const selectedMemoryIds = cleanStrings(governedLearning.selectedMemoryIds || [], {
    maximumItems: 16,
    maximumCharacters: 160,
    allowEmpty: true
  });
  const appliedLessonIds = cleanStrings(governedLearning.appliedLessonIds || [], {
    maximumItems: 16,
    maximumCharacters: 160,
    allowEmpty: true
  });
  if (appliedLessonIds.some((memoryId) => !selectedMemoryIds.includes(memoryId))) {
    refuse("AUTHORITATIVE_MEMORY_APPLICATION_NOT_SELECTED");
  }
  const trialSelectedCandidateIds = cleanStrings(governedLearning.trialCandidateIds || [], {
    maximumItems: 4,
    maximumCharacters: 160,
    allowEmpty: true
  });
  if (trialSelectedCandidateIds.some((memoryId) => !selectedMemoryIds.includes(memoryId))) {
    refuse("AUTHORITATIVE_TRIAL_SELECTION_INVALID");
  }
  const trialAppliedCandidateIds = decision.actionType === GOVERNED_RESEARCH_STRATEGY_ACTION
    ? trialSelectedCandidateIds
    : [];
  const rollbackRefusals = governedLearning.rollbackRefusals || [];
  const lessonCandidacyAuthorized = !governedLearning.insufficientEvidence
    && !governedLearning.novelBoundary
    && appliedLessonIds.length === 0
    && rollbackRefusals.length === 0
    && governedLearning.rejectedMemoryIds.length === 0
    && decision.actionType === "EVALUATE_RETURNED_EVIDENCE"
    && decision.canonicalDecision.compatibilityAudit?.passed === true
    && decision.canonicalDecision.retainedEvidenceSufficient === true;
  const memoryStatus = rollbackRefusals.length > 0
        ? "REJECTED_ANALOGY"
        : appliedLessonIds.length > 0
          ? "RETRIEVED_APPLIED"
          : trialAppliedCandidateIds.length > 0
            ? "CANDIDATE"
            : governedLearning.insufficientEvidence
              ? "INSUFFICIENT_EVIDENCE"
              : governedLearning.novelBoundary
                ? "NOVEL"
          : governedLearning.rejectedMemoryIds.length > 0
            ? "REJECTED_ANALOGY"
            : lessonCandidacyAuthorized
              ? "CANDIDATE"
              : "NOVEL";
  const core = {
    schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
    transitionType: "AUTHORITATIVE_GOVERNED_MEMORY_TRANSITION",
    runIdentity: cleanString(governedLearning.memoryContext.runIdentity, 160),
    currentEpisodeId: cleanString(governedLearning.memoryContext.currentEpisodeId, 160),
    episodeSequence: governedLearning.memoryContext.episodeSequence || 0,
    retrievalReceiptHash: cleanString(governedLearning.memoryContext.retrievalReceiptHash || "NONE", 100),
    retrievalDecisionHash: governedLearning.retrievalDecisionHash,
    selectedMemoryIds,
    appliedLessonIds,
    trialSelectedCandidateIds,
    trialAppliedCandidateIds,
    rejectedMemoryIds: governedLearning.rejectedMemoryIds,
    rollbackRefusals,
    applicableMemoryId: appliedLessonIds[0] || null,
    memoryStatus,
    nonReuseDecision: governedLearning.authoritativeNonReuseDecision,
    lessonCandidacyAuthorized,
    providerLifecycleAuthority: false
  };
  return withObjectHash(core, "memoryTransitionHash");
}

export function assertAuthoritativeMemoryTransition(transition) {
  assertObjectHash(transition, "memoryTransitionHash", "AUTHORITATIVE_MEMORY_TRANSITION_TAMPERED");
  if (
    transition.transitionType !== "AUTHORITATIVE_GOVERNED_MEMORY_TRANSITION"
    || !AUTHORITATIVE_MEMORY_STATUSES.includes(transition.memoryStatus)
    || transition.providerLifecycleAuthority !== false
    || !Array.isArray(transition.selectedMemoryIds)
    || !Array.isArray(transition.appliedLessonIds)
    || !Array.isArray(transition.trialSelectedCandidateIds)
    || !Array.isArray(transition.trialAppliedCandidateIds)
    || !Array.isArray(transition.rejectedMemoryIds)
    || !Array.isArray(transition.rollbackRefusals)
    || transition.appliedLessonIds.some((memoryId) => !transition.selectedMemoryIds.includes(memoryId))
    || transition.trialSelectedCandidateIds.some((memoryId) => !transition.selectedMemoryIds.includes(memoryId))
    || transition.trialAppliedCandidateIds.some((memoryId) => !transition.trialSelectedCandidateIds.includes(memoryId))
    || transition.applicableMemoryId !== (transition.appliedLessonIds[0] || null)
  ) refuse("AUTHORITATIVE_MEMORY_TRANSITION_INVALID");
  return transition;
}

export function projectAuthoritativeMemoryStatus(runtime) {
  const transition = assertAuthoritativeMemoryTransition(runtime?.authoritativeMemoryTransition);
  return Object.freeze({
    memoryStatus: transition.memoryStatus,
    applicableMemoryId: transition.applicableMemoryId,
    selectedLessonIds: transition.selectedMemoryIds,
    appliedLessonIds: transition.appliedLessonIds,
    trialSelectedCandidateIds: transition.trialSelectedCandidateIds,
    trialAppliedCandidateIds: transition.trialAppliedCandidateIds,
    rejectedMemoryIds: transition.rejectedMemoryIds,
    rollbackRefusals: transition.rollbackRefusals,
    nonReuseDecision: transition.nonReuseDecision,
    memoryTransitionHash: transition.memoryTransitionHash,
    providerLifecycleAuthority: false
  });
}

function trialMetrics(trials, {
  candidateId,
  candidateMemoryId,
  outcomes = new Map(),
  trialAuthorizations = new Map()
} = {}) {
  if (!Array.isArray(trials) || trials.length < 3 || trials.length > 100) {
    refuse("QUALIFICATION_CASE_CARDINALITY");
  }
  const seen = new Set();
  const normalized = trials.map((trial, index) => {
    exactObject(trial, [
      "caseId", "beforeEpisodeId", "afterEpisodeId", "beforeResponseHash", "afterResponseHash",
      "beforeScore", "afterScore", "beforeViolations", "afterViolations", "evidenceRefs",
      "causalAttribution"
    ]);
    const caseId = cleanString(trial.caseId, 120);
    if (seen.has(caseId)) refuse("QUALIFICATION_CASE_DUPLICATE");
    seen.add(caseId);
    const beforeEpisodeId = cleanString(trial.beforeEpisodeId, 160);
    const afterEpisodeId = cleanString(trial.afterEpisodeId, 160);
    if (beforeEpisodeId === afterEpisodeId) refuse("QUALIFICATION_EPISODE_PAIR_INVALID");
    const beforeResponseHash = sha256Identity(trial.beforeResponseHash, `trials[${index}].beforeResponseHash`);
    const afterResponseHash = sha256Identity(trial.afterResponseHash, `trials[${index}].afterResponseHash`);
    const evidenceRefs = cleanStrings(trial.evidenceRefs);
    const causalAttribution = canonicalTrialCausalAttribution(trial.causalAttribution);
    const beforeOutcome = outcomes.get(beforeEpisodeId);
    const afterOutcome = outcomes.get(afterEpisodeId);
    const outcomeBindingComplete = Boolean(
      beforeOutcome
      && afterOutcome
      && beforeOutcome.response_hash === beforeResponseHash
      && afterOutcome.response_hash === afterResponseHash
      && beforeOutcome.frozen_pre_intervention_state_hash === causalAttribution.beforeStateHash
      && afterOutcome.frozen_pre_intervention_state_hash === causalAttribution.beforeStateHash
      && beforeOutcome.research_plan_state_hash === causalAttribution.researchPlanBeforeHash
      && afterOutcome.research_plan_state_hash === causalAttribution.researchPlanAfterHash
      && beforeOutcome.research_applicability_decision_hash === causalAttribution.applicabilityDecisionHash
      && afterOutcome.research_applicability_decision_hash === causalAttribution.applicabilityDecisionHash
    );
    const causalEvidenceIdentities = [
      causalAttribution.applicabilityDecisionHash,
      causalAttribution.trialAuthorizationId,
      causalAttribution.memoryTransitionHash,
      causalAttribution.mentorDecisionIdentity,
      causalAttribution.governorDecisionIdentity,
      causalAttribution.governorExecutionEventIdentity,
      causalAttribution.providerRequestIdentity,
      causalAttribution.newEvidenceIdentity,
      causalAttribution.frozenPreInterventionStateHash,
      causalAttribution.beforeStateHash,
      causalAttribution.afterStateHash,
      causalAttribution.researchPlanBeforeHash,
      causalAttribution.researchPlanAfterHash,
      causalAttribution.causalAttributionHash
    ].filter(Boolean);
    const evidenceBindingComplete = causalEvidenceIdentities.every((identity) => evidenceRefs.includes(identity));
    const applicable = causalAttribution.trialRole === "APPLICABLE_INTERVENTION";
    const trialAuthorization = applicable
      ? trialAuthorizations.get(causalAttribution.trialAuthorizationId)
      : null;
    const authorizationBindingComplete = !applicable || Boolean(
      trialAuthorization
      && trialAuthorization.candidate_id === candidateId
      && trialAuthorization.candidate_memory_id === candidateMemoryId
      && trialAuthorization.episode_id === afterEpisodeId
      && trialAuthorization.applicability_decision_hash === causalAttribution.applicabilityDecisionHash
      && trialAuthorization.frozen_pre_intervention_state_hash === causalAttribution.frozenPreInterventionStateHash
      && afterOutcome?.causal_attribution_hash === causalAttribution.causalAttributionHash
    );
    const causalChainComplete = applicable && Boolean(
      outcomeBindingComplete
      && evidenceBindingComplete
      && authorizationBindingComplete
      && causalAttribution.candidateId === candidateId
      && causalAttribution.candidateMemoryId === candidateMemoryId
      && causalAttribution.applicabilityClassification === GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE
      && causalAttribution.trialSelectedCandidateIds.includes(candidateMemoryId)
      && causalAttribution.trialAppliedCandidateIds.includes(candidateMemoryId)
      && causalAttribution.mentorActionId === GOVERNED_RESEARCH_STRATEGY_ACTION
      && causalAttribution.mentorDecisionIdentity
      && causalAttribution.governorDecisionIdentity
      && causalAttribution.governorExecutionEventIdentity
      && causalAttribution.governorAuthorized
      && causalAttribution.strategyApplied
      && causalAttribution.providerRequestIdentity
      && causalAttribution.newEvidenceIdentity
      && causalAttribution.beforeStateHash === causalAttribution.frozenPreInterventionStateHash
      && causalAttribution.afterStateHash !== causalAttribution.beforeStateHash
      && causalAttribution.researchPlanAfterHash !== causalAttribution.researchPlanBeforeHash
      && causalAttribution.researchPlanChanged
      && causalAttribution.interventionOnlyDifference
      && causalAttribution.providerLifecycleAuthority === false
    );
    const controlIntegrity = !applicable && Boolean(
      outcomeBindingComplete
      && evidenceBindingComplete
      && causalAttribution.applicabilityClassification !== GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE
      && causalAttribution.candidateId === ""
      && causalAttribution.candidateMemoryId === ""
      && causalAttribution.trialAuthorizationId === ""
      && causalAttribution.trialSelectedCandidateIds.length === 0
      && causalAttribution.trialAppliedCandidateIds.length === 0
      && causalAttribution.mentorActionId !== GOVERNED_RESEARCH_STRATEGY_ACTION
      && !causalAttribution.governorAuthorized
      && !causalAttribution.strategyApplied
      && causalAttribution.providerRequestIdentity === ""
      && causalAttribution.newEvidenceIdentity === ""
      && causalAttribution.beforeStateHash === causalAttribution.frozenPreInterventionStateHash
      && causalAttribution.afterStateHash === causalAttribution.beforeStateHash
      && causalAttribution.researchPlanAfterHash === causalAttribution.researchPlanBeforeHash
      && !causalAttribution.researchPlanChanged
      && causalAttribution.interventionOnlyDifference
      && causalAttribution.providerLifecycleAuthority === false
    );
    const beforeScore = score(trial.beforeScore, `trials[${index}].beforeScore`);
    const afterScore = score(trial.afterScore, `trials[${index}].afterScore`);
    const beforeViolations = violationCount(trial.beforeViolations, `trials[${index}].beforeViolations`);
    const afterViolations = violationCount(trial.afterViolations, `trials[${index}].afterViolations`);
    return {
      caseId,
      beforeEpisodeId,
      afterEpisodeId,
      beforeResponseHash,
      afterResponseHash,
      beforeScore,
      afterScore,
      beforeViolations,
      afterViolations,
      evidenceRefs,
      causalAttribution,
      causalChainComplete,
      controlIntegrity,
      outcomeBindingComplete,
      evidenceBindingComplete,
      authorizationBindingComplete,
      attributableAfterScore: causalChainComplete ? afterScore : beforeScore,
      attributableAfterViolations: causalChainComplete ? afterViolations : beforeViolations
    };
  });
  const improvements = normalized.map((trial) => trial.attributableAfterScore - trial.beforeScore);
  return {
    trials: normalized.map((trial) => ({
      caseId: trial.caseId,
      beforeEpisodeId: trial.beforeEpisodeId,
      afterEpisodeId: trial.afterEpisodeId,
      beforeResponseHash: trial.beforeResponseHash,
      afterResponseHash: trial.afterResponseHash,
      beforeScore: trial.beforeScore,
      afterScore: trial.afterScore,
      beforeViolations: trial.beforeViolations,
      afterViolations: trial.afterViolations,
      evidenceRefs: trial.evidenceRefs,
      causalAttribution: trial.causalAttribution
    })),
    causalTrialResults: normalized.map((trial) => ({
      caseId: trial.caseId,
      trialRole: trial.causalAttribution.trialRole,
      causalChainComplete: trial.causalChainComplete,
      controlIntegrity: trial.controlIntegrity,
      outcomeBindingComplete: trial.outcomeBindingComplete,
      evidenceBindingComplete: trial.evidenceBindingComplete,
      authorizationBindingComplete: trial.authorizationBindingComplete,
      rawImprovement: Number((trial.afterScore - trial.beforeScore).toFixed(12)),
      attributableImprovement: Number((trial.attributableAfterScore - trial.beforeScore).toFixed(12)),
      rawViolationDelta: trial.afterViolations - trial.beforeViolations,
      attributableViolationDelta: trial.attributableAfterViolations - trial.beforeViolations
    })),
    meanImprovement: Number((improvements.reduce((sum, value) => sum + value, 0) / improvements.length).toFixed(12)),
    worstImprovement: Number(Math.min(...improvements).toFixed(12)),
    violationDelta: normalized.reduce((sum, trial) => sum + trial.attributableAfterViolations - trial.beforeViolations, 0)
  };
}

function qualificationReasons(metrics, minimumMeanImprovement) {
  const reasons = [];
  const applicable = metrics.causalTrialResults.filter((trial) => trial.trialRole === "APPLICABLE_INTERVENTION");
  const controls = metrics.causalTrialResults.filter((trial) => trial.trialRole === "NON_APPLICABLE_CONTROL");
  if (applicable.length === 0) reasons.push("CAUSAL_INTERVENTION_REQUIRED");
  if (controls.length === 0) reasons.push("NON_APPLICABLE_CONTROL_REQUIRED");
  if (applicable.some((trial) => !trial.causalChainComplete)) reasons.push("CAUSAL_CHAIN_INCOMPLETE");
  if (controls.some((trial) => !trial.controlIntegrity)) reasons.push("NON_APPLICABLE_CONTROL_INVALID");
  if (metrics.meanImprovement < minimumMeanImprovement) reasons.push("MEAN_IMPROVEMENT_BELOW_THRESHOLD");
  if (metrics.worstImprovement < 0) reasons.push("CASE_REGRESSION_OBSERVED");
  if (metrics.causalTrialResults.some((trial) => trial.attributableViolationDelta > 0)) {
    reasons.push("VIOLATION_INCREASE_OBSERVED");
  }
  return reasons;
}

function authorizedLessonApplicationCausalChain({
  lessonId,
  beforeOutcome,
  afterOutcome,
  beforeResponseHash,
  afterResponseHash,
  attribution,
  evidenceReferences,
  memoryTransitionHash
} = {}) {
  const causalEvidenceIdentities = [
    attribution.applicabilityDecisionHash,
    attribution.memoryTransitionHash,
    attribution.mentorDecisionIdentity,
    attribution.governorDecisionIdentity,
    attribution.governorExecutionEventIdentity,
    attribution.providerRequestIdentity,
    attribution.newEvidenceIdentity,
    attribution.frozenPreInterventionStateHash,
    attribution.beforeStateHash,
    attribution.afterStateHash,
    attribution.researchPlanBeforeHash,
    attribution.researchPlanAfterHash,
    attribution.causalAttributionHash
  ].filter(Boolean);
  return Boolean(
    beforeOutcome
    && afterOutcome
    && beforeOutcome.response_hash === beforeResponseHash
    && afterOutcome.response_hash === afterResponseHash
    && beforeOutcome.frozen_pre_intervention_state_hash === attribution.beforeStateHash
    && afterOutcome.frozen_pre_intervention_state_hash === attribution.beforeStateHash
    && beforeOutcome.research_plan_state_hash === attribution.researchPlanBeforeHash
    && afterOutcome.research_plan_state_hash === attribution.researchPlanAfterHash
    && beforeOutcome.research_applicability_decision_hash === attribution.applicabilityDecisionHash
    && afterOutcome.research_applicability_decision_hash === attribution.applicabilityDecisionHash
    && afterOutcome.causal_attribution_hash === attribution.causalAttributionHash
    && attribution.trialRole === "AUTHORIZED_LESSON_TRANSFER"
    && attribution.candidateId === ""
    && attribution.candidateMemoryId === lessonId
    && attribution.applicabilityClassification === GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE
    && attribution.trialAuthorizationId === ""
    && attribution.trialSelectedCandidateIds.length === 0
    && attribution.trialAppliedCandidateIds.length === 0
    && attribution.memoryTransitionHash === memoryTransitionHash
    && attribution.mentorActionId === GOVERNED_RESEARCH_STRATEGY_ACTION
    && attribution.mentorDecisionIdentity
    && attribution.governorDecisionIdentity
    && attribution.governorExecutionEventIdentity
    && attribution.governorAuthorized
    && attribution.strategyApplied
    && attribution.providerRequestIdentity
    && attribution.newEvidenceIdentity
    && attribution.beforeStateHash === attribution.frozenPreInterventionStateHash
    && attribution.afterStateHash !== attribution.beforeStateHash
    && attribution.researchPlanAfterHash !== attribution.researchPlanBeforeHash
    && attribution.researchPlanChanged
    && attribution.interventionOnlyDifference
    && attribution.providerLifecycleAuthority === false
    && causalEvidenceIdentities.every((identity) => evidenceReferences.includes(identity))
  );
}

function canonicalSccSourceIdentity(value = {}, label = "SCC source") {
  exactObject(value, ["commit", "tree"]);
  const commit = cleanString(value.commit, 80).toLowerCase();
  const tree = cleanString(value.tree, 80).toLowerCase();
  if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(commit) ||
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(tree)) {
    refuse("SCC_SOURCE_IDENTITY_INVALID", label);
  }
  return Object.freeze({
    commit,
    tree
  });
}

function canonicalSccStartupReceipt(value = {}, { requireReceiptId = true } = {}) {
  const currentContract = Object.hasOwn(value, "packageTrustRootSha256");
  const commonFields = [
    ...(requireReceiptId ? ["receiptId"] : []),
    "runtimeId", "foundationVersion", "foundationPackageRoot", "runtimeSource",
    "productSource", "textbookSha256", "manifestSha256", "roleRegistrySha256",
    "memoryRootSha256", "applicableLessonIds", "processId", "parentProcessId",
    "runnerId", "launcherNonceSha256", "startedAt", "validatorResult", "authorityEffect",
    "externalEffects"
  ];
  const currentFields = [
    "runtimeIdentityLineage", "productId", "packageVersion", "packageTrustRootSha256",
    "packageRegistrationPath", "packageRegistrationSha256", "manifestPath",
    "governorIdentity", "governorIdentitySha256", "learningScopeIdentity", "learningRootSha256"
  ];
  exactObject(value, currentContract ? [...commonFields, ...currentFields] : commonFields);
  if (value.foundationVersion !== "0.2.4" ||
      value.foundationPackageRoot !== "sha256:6c588b9e86ba1669b95499e04ddc49d32cc69ba36b201d68ae287dc79c61ab68" ||
      value.validatorResult !== "PASS" || value.authorityEffect !== false || value.externalEffects !== false ||
      !Number.isSafeInteger(value.processId) || value.processId < 1 ||
      !Number.isSafeInteger(value.parentProcessId) || value.parentProcessId < 1) {
    refuse("SCC_STARTUP_RECEIPT_INVALID");
  }
  return Object.freeze({
    ...(requireReceiptId ? { receiptId: sha256Identity(value.receiptId, "SCC startup receipt") } : {}),
    runtimeId: cleanString(value.runtimeId, 160),
    ...(currentContract ? {
      runtimeIdentityLineage: exactEvidenceStrings(value.runtimeIdentityLineage, { maximumItems: 8 }),
      productId: cleanString(value.productId, 160),
      packageVersion: cleanString(value.packageVersion, 80),
      packageTrustRootSha256: sha256Identity(value.packageTrustRootSha256, "SCC package trust root"),
      packageRegistrationPath: cleanString(value.packageRegistrationPath, 260),
      packageRegistrationSha256: sha256Identity(value.packageRegistrationSha256, "SCC package registration"),
      manifestPath: cleanString(value.manifestPath, 260),
      governorIdentity: cleanString(value.governorIdentity, 160),
      governorIdentitySha256: sha256Identity(value.governorIdentitySha256, "SCC Governor"),
      learningScopeIdentity: cleanString(value.learningScopeIdentity, 160),
      learningRootSha256: sha256Identity(value.learningRootSha256, "SCC learning root")
    } : {}),
    foundationVersion: value.foundationVersion,
    foundationPackageRoot: value.foundationPackageRoot,
    runtimeSource: canonicalSccSourceIdentity(value.runtimeSource, "SCC runtime source"),
    productSource: canonicalSccSourceIdentity(value.productSource, "SCC product source"),
    textbookSha256: sha256Identity(value.textbookSha256, "SCC textbook"),
    manifestSha256: sha256Identity(value.manifestSha256, "SCC manifest"),
    roleRegistrySha256: sha256Identity(value.roleRegistrySha256, "SCC role registry"),
    memoryRootSha256: sha256Identity(value.memoryRootSha256, "SCC memory root"),
    applicableLessonIds: cleanStrings(value.applicableLessonIds, { allowEmpty: true, maximumItems: 256 }),
    processId: value.processId,
    parentProcessId: value.parentProcessId,
    runnerId: cleanString(value.runnerId, 160),
    launcherNonceSha256: sha256Identity(value.launcherNonceSha256, "SCC launcher nonce"),
    startedAt: canonicalIso(value.startedAt),
    validatorResult: "PASS",
    authorityEffect: false,
    externalEffects: false
  });
}

function canonicalSccJobReceipt(value = {}, { requireReceiptId = true } = {}) {
  exactObject(value, [
    ...(requireReceiptId ? ["receiptId"] : []),
    "startupReceiptId", "role", "jobType", "workflowState", "workflowTransition",
    "inputSha256", "outputSha256", "processId", "runnerId", "jobSequence",
    "completedAt", "validatorResult", "authorityEffect",
    "externalEffects"
  ]);
  if (value.validatorResult !== "PASS" || value.authorityEffect !== false || value.externalEffects !== false) {
    refuse("SCC_JOB_RECEIPT_INVALID");
  }
  if (!Number.isSafeInteger(value.processId) || value.processId < 1 ||
      !Number.isSafeInteger(value.jobSequence) || value.jobSequence < 1) refuse("SCC_JOB_RECEIPT_PROCESS_INVALID");
  return Object.freeze({
    ...(requireReceiptId ? { receiptId: sha256Identity(value.receiptId, "SCC job receipt") } : {}),
    startupReceiptId: sha256Identity(value.startupReceiptId, "SCC startup receipt"),
    role: cleanString(value.role, 100),
    jobType: cleanString(value.jobType, 160),
    workflowState: cleanString(value.workflowState, 160),
    workflowTransition: cleanString(value.workflowTransition, 240),
    inputSha256: sha256Identity(value.inputSha256, "SCC job input"),
    outputSha256: sha256Identity(value.outputSha256, "SCC job output"),
    processId: value.processId,
    runnerId: cleanString(value.runnerId, 160),
    jobSequence: value.jobSequence,
    completedAt: canonicalIso(value.completedAt),
    validatorResult: "PASS",
    authorityEffect: false,
    externalEffects: false
  });
}

function deriveState(events, secret = null) {
  const state = {
    outcomes: new Map(),
    websiteOutcomes: new Map(),
    websiteEvaluations: new Map(),
    independentEvaluatorNonces: new Set(),
    independentEvaluatorSequences: new Map(),
    feedback: new Map(),
    failures: new Map(),
    diagnoses: new Map(),
    candidates: new Map(),
    candidateRejections: new Map(),
    trialAuthorizations: new Map(),
    qualifications: new Map(),
    lessons: new Map(),
    applications: new Map(),
    rollbacks: new Map(),
    rollbackRefusals: new Map(),
    retentions: new Map(),
    lastEpisodeSequence: 0,
    sccStartups: new Map(),
    sccJobs: new Map()
  };
  let pendingRollback = null;
  let pendingCandidateRejection = null;
  for (const event of events) {
    const payload = event.payload;
    if (pendingRollback && event.event_type !== "LESSON_ROLLED_BACK") refuse("ROLLBACK_EVENT_MISSING");
    if (pendingCandidateRejection && event.event_type !== "LESSON_CANDIDATE_REJECTED") {
      refuse("CANDIDATE_REJECTION_EVENT_MISSING");
    }
    switch (event.event_type) {
      case "PRODUCT_OUTCOME_RECORDED":
        if (state.outcomes.has(payload.episode_id)) refuse("PRODUCT_OUTCOME_REPLAY");
        if (payload.episode_sequence < state.lastEpisodeSequence) refuse("PRODUCT_OUTCOME_ORDER");
        if (
          payload.episode_sequence === state.lastEpisodeSequence
          && ![...state.failures.values()].some((failure) => (
            failure.episode_id === payload.episode_id
            && failure.episode_sequence === payload.episode_sequence
          ))
        ) refuse("PRODUCT_OUTCOME_ORDER");
        if (payload.causal_attribution) {
          const attribution = canonicalTrialCausalAttribution(payload.causal_attribution);
          const authorization = state.trialAuthorizations.get(attribution.trialAuthorizationId);
          const trialBinding = attribution.trialRole === "APPLICABLE_INTERVENTION"
            && authorization
            && authorization.episode_id === payload.episode_id
            && authorization.candidate_id === attribution.candidateId
            && authorization.candidate_memory_id === attribution.candidateMemoryId
            && authorization.applicability_decision_hash === attribution.applicabilityDecisionHash;
          const lesson = state.lessons.get(attribution.candidateMemoryId);
          const lessonBinding = attribution.trialRole === "AUTHORIZED_LESSON_TRANSFER"
            && attribution.candidateId === ""
            && attribution.trialAuthorizationId === ""
            && lesson?.status === "VALIDATED_BY_TRANSFER"
            && !state.rollbacks.has(attribution.candidateMemoryId);
          if (
            payload.causal_attribution_hash !== attribution.causalAttributionHash
            || (!trialBinding && !lessonBinding)
          ) refuse("PRODUCT_OUTCOME_CAUSAL_BINDING");
        } else if (payload.causal_attribution_hash) {
          refuse("PRODUCT_OUTCOME_CAUSAL_BINDING");
        }
        state.outcomes.set(payload.episode_id, payload);
        state.lastEpisodeSequence = payload.episode_sequence;
        break;
      case "WEBSITE_OUTCOME_RECORDED": {
        if (
          state.websiteOutcomes.has(payload.episode_id)
          || !/^[a-f0-9]{64}$/i.test(String(payload.website_outcome_id || ""))
          || !/^[a-f0-9]{64}$/i.test(String(payload.artifact_sha256 || ""))
          || payload.artifact_file !== `${payload.website_outcome_id}.json`
          || (Object.hasOwn(payload, "provider_metering_hash")
            && !/^[a-f0-9]{64}$/i.test(String(payload.provider_metering_hash || "")))
          || payload.provider_lifecycle_authority !== false
        ) refuse("WEBSITE_OUTCOME_LEDGER_BINDING_INVALID");
        const productOutcome = state.outcomes.get(payload.episode_id);
        if (payload.terminal_kind === "SUCCESS") {
          if (
            !productOutcome
            || productOutcome.outcome_id !== payload.product_outcome_id
            || productOutcome.episode_sequence !== payload.episode_sequence
            || productOutcome.response_hash !== payload.canonical_response_hash
          ) refuse("WEBSITE_OUTCOME_PRODUCT_LEDGER_BINDING_INVALID");
        } else if (payload.product_outcome_id) {
          refuse("WEBSITE_OUTCOME_FAILURE_PRODUCT_BINDING_INVALID");
        }
        state.websiteOutcomes.set(payload.episode_id, payload);
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        break;
      }
      case "WEBSITE_EVALUATION_RECORDED": {
        if (
          state.websiteEvaluations.has(payload.episode_id)
          || !/^[a-f0-9]{64}$/i.test(String(payload.website_evaluation_id || ""))
          || !/^[a-f0-9]{64}$/i.test(String(payload.artifact_sha256 || ""))
          || payload.artifact_file !== `${payload.website_evaluation_id}.json`
          || !/^[a-f0-9]{64}$/i.test(String(payload.image_sha256 || ""))
          || !Number.isSafeInteger(payload.image_byte_count)
          || payload.image_byte_count < 1
          || !/^[a-f0-9]{64}$/i.test(String(payload.authority_manifest_sha256 || ""))
          || typeof payload.evaluator_nonce !== "string"
          || !Number.isSafeInteger(payload.evaluator_sequence)
          || payload.evaluator_sequence < 1
          || payload.provider_lifecycle_authority !== false
        ) refuse("WEBSITE_EVALUATION_LEDGER_BINDING_INVALID");
        assertIndependentEvaluationReplaySafety({
          evaluation: {
            nonce: payload.evaluator_nonce,
            sequence: payload.evaluator_sequence
          },
          seenNonces: state.independentEvaluatorNonces,
          highestSequence: state.independentEvaluatorSequences.get(
            payload.authority_manifest_sha256
          ) || 0
        });
        const websiteOutcome = state.websiteOutcomes.get(payload.episode_id);
        const productOutcome = state.outcomes.get(payload.episode_id);
        if (
          !websiteOutcome
          || websiteOutcome.terminal_kind !== "SUCCESS"
          || websiteOutcome.website_outcome_id !== payload.website_outcome_id
          || websiteOutcome.product_outcome_id !== payload.product_outcome_id
          || websiteOutcome.request_sha256 !== payload.request_sha256
          || websiteOutcome.response_sha256 !== payload.raw_response_sha256
          || websiteOutcome.canonical_response_hash !== payload.canonical_response_hash
          || !productOutcome
          || productOutcome.outcome_id !== payload.product_outcome_id
          || productOutcome.response_hash !== payload.canonical_response_hash
        ) refuse("WEBSITE_EVALUATION_OUTCOME_LEDGER_BINDING_INVALID");
        state.websiteEvaluations.set(payload.episode_id, payload);
        state.independentEvaluatorNonces.add(payload.evaluator_nonce);
        state.independentEvaluatorSequences.set(
          payload.authority_manifest_sha256,
          payload.evaluator_sequence
        );
        break;
      }
      case "PRODUCT_FEEDBACK_ACCEPTED": {
        const outcome = state.outcomes.get(payload.bound_episode_id);
        if (
          !outcome
          || state.feedback.has(payload.feedback_id)
          || outcome.response_hash !== payload.response_hash
          || outcome.original_evidence_identity !== payload.original_evidence_identity
          || outcome.cognitive_episode_hash !== payload.cognitive_episode_hash
          || outcome.submitted_object_fingerprint !== payload.submitted_object_fingerprint
          || outcome.memory_transition_hash !== payload.memory_transition_hash
          || payload.provider_authored !== false
        ) refuse("PRODUCT_FEEDBACK_BINDING");
        state.feedback.set(payload.feedback_id, payload);
        break;
      }
      case "FAILURE_RECORDED":
        if (state.failures.has(payload.failure_id)) refuse("FAILURE_DUPLICATE");
        state.failures.set(payload.failure_id, payload);
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        break;
      case "MENTOR_DIAGNOSIS_RECORDED":
        if (
          !state.failures.has(payload.failure_id)
          || state.diagnoses.has(payload.diagnosis_id)
        ) refuse("DIAGNOSIS_FAILURE_REFERENCE");
        state.diagnoses.set(payload.diagnosis_id, payload);
        break;
      case "LESSON_CANDIDATE_RECORDED":
        if (!state.failures.has(payload.failure_id) || state.candidates.has(payload.candidate_id)) {
          refuse("CANDIDATE_REFERENCE");
        }
        state.candidates.set(payload.candidate_id, payload);
        break;
      case "QUALIFICATION_TRIAL_AUTHORIZED": {
        const candidate = state.candidates.get(payload.candidate_id);
        if (
          !candidate
          || candidate.memory_id !== payload.candidate_memory_id
          || state.candidateRejections.has(payload.candidate_id)
          || [...state.qualifications.values()].some((item) => item.candidate_id === payload.candidate_id)
          || state.trialAuthorizations.has(payload.trial_authorization_id)
          || payload.applicability_classification !== GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE
          || payload.episode_sequence <= candidate.episode_sequence
        ) refuse("QUALIFICATION_TRIAL_AUTHORITY_INVALID");
        state.trialAuthorizations.set(payload.trial_authorization_id, payload);
        break;
      }
      case "QUALIFICATION_DECIDED": {
        const candidate = state.candidates.get(payload.candidate_id);
        if (
          !candidate
          || state.candidateRejections.has(payload.candidate_id)
          || state.qualifications.has(payload.qualification_id)
        ) {
          refuse("QUALIFICATION_REFERENCE");
        }
        const metrics = trialMetrics(payload.trials, {
          candidateId: payload.candidate_id,
          candidateMemoryId: candidate.memory_id,
          outcomes: state.outcomes,
          trialAuthorizations: state.trialAuthorizations
        });
        const reasons = qualificationReasons(metrics, payload.minimum_mean_improvement);
        if (
          metrics.meanImprovement !== payload.mean_improvement
          || metrics.worstImprovement !== payload.worst_improvement
          || metrics.violationDelta !== payload.violation_delta
          || stableObjectJson(metrics.causalTrialResults) !== stableObjectJson(payload.causal_trial_results)
          || stableObjectJson(reasons) !== stableObjectJson(payload.reasons)
          || payload.verdict !== (reasons.length ? "FAIL" : "PASS")
        ) refuse("QUALIFICATION_SEMANTICS");
        state.qualifications.set(payload.qualification_id, payload);
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        if (payload.verdict === "FAIL") pendingCandidateRejection = payload;
        break;
      }
      case "LESSON_CANDIDATE_REJECTED": {
        const candidate = state.candidates.get(payload.candidate_id);
        if (
          !pendingCandidateRejection
          || pendingCandidateRejection.qualification_id !== payload.qualification_id
          || pendingCandidateRejection.candidate_id !== payload.candidate_id
          || !candidate
          || candidate.memory_id !== payload.candidate_memory_id
          || state.candidateRejections.has(payload.candidate_id)
          || payload.status !== "REVOKED"
        ) refuse("CANDIDATE_REJECTION_REFERENCE");
        state.candidateRejections.set(payload.candidate_id, payload);
        pendingCandidateRejection = null;
        break;
      }
      case "LESSON_PROMOTED": {
        const qualification = state.qualifications.get(payload.qualification_id);
        if (
          !qualification
          || qualification.verdict !== "PASS"
          || state.candidateRejections.has(qualification.candidate_id)
          || state.lessons.has(payload.lesson_id)
        ) {
          refuse("PROMOTION_REFERENCE");
        }
        state.lessons.set(payload.lesson_id, { ...payload, status: "VALIDATED_BY_TRANSFER" });
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        break;
      }
      case "LESSON_APPLICATION_MEASURED": {
        const lesson = state.lessons.get(payload.lesson_id);
        if (!lesson || lesson.status !== "VALIDATED_BY_TRANSFER") refuse("APPLICATION_LESSON_REFERENCE");
        const attribution = canonicalTrialCausalAttribution(payload.causal_attribution);
        if (!authorizedLessonApplicationCausalChain({
          lessonId: payload.lesson_id,
          beforeOutcome: state.outcomes.get(payload.before_episode_id),
          afterOutcome: state.outcomes.get(payload.after_episode_id),
          beforeResponseHash: payload.before_response_hash,
          afterResponseHash: payload.after_response_hash,
          attribution,
          evidenceReferences: payload.evidence_references,
          memoryTransitionHash: payload.memory_transition_hash
        })) refuse("APPLICATION_CAUSAL_ATTRIBUTION_INVALID");
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
        state.rollbacks.set(payload.lesson_id, { ...payload, rollback_event_id: event.event_id });
        state.lessons.get(payload.lesson_id).status = "REVOKED";
        pendingRollback = null;
        break;
      case "LESSON_REUSE_REFUSED": {
        const rollback = state.rollbacks.get(payload.lesson_id);
        const application = [...state.applications.values()]
          .find((item) => item.application_id === rollback?.application_id);
        const replayKey = `${payload.lesson_id}\0${payload.episode_id}`;
        if (
          !rollback
          || !application
          || state.lessons.get(payload.lesson_id)?.status !== "REVOKED"
          || rollback.rollback_event_id !== payload.rollback_event_id
          || rollback.rollback_memory_id !== payload.rollback_memory_id
          || rollback.rollback_memory_hash !== payload.rollback_memory_hash
          || payload.reason !== "ROLLED_BACK_LESSON"
          || payload.episode_sequence <= application.episode_sequence
          || !/^[a-f0-9]{64}$/i.test(payload.retrieval_receipt_hash)
        ) refuse("ROLLBACK_REFUSAL_REFERENCE");
        if (state.rollbackRefusals.has(replayKey)) refuse("ROLLBACK_REFUSAL_REPLAY");
        state.rollbackRefusals.set(replayKey, { ...payload, refusal_event_id: event.event_id });
        state.lastEpisodeSequence = Math.max(state.lastEpisodeSequence, payload.episode_sequence);
        break;
      }
      case "SCC_RUNTIME_STARTED": {
        if (!secret) refuse("SCC_RECEIPT_SECRET_REQUIRED");
        const receipt = canonicalSccStartupReceipt(payload);
        const body = { ...receipt };
        delete body.receiptId;
        if (hmac(secret, "KATHERINES_EYE_SCC_STARTUP_RECEIPT_V1", body) !== receipt.receiptId ||
            state.sccStartups.has(receipt.receiptId)) refuse("SCC_STARTUP_RECEIPT_TAMPERED");
        state.sccStartups.set(receipt.receiptId, receipt);
        break;
      }
      case "SCC_JOB_COMPLETED": {
        if (!secret) refuse("SCC_RECEIPT_SECRET_REQUIRED");
        const receipt = canonicalSccJobReceipt(payload);
        const body = { ...receipt };
        delete body.receiptId;
        if (hmac(secret, "KATHERINES_EYE_SCC_JOB_RECEIPT_V1", body) !== receipt.receiptId ||
            !state.sccStartups.has(receipt.startupReceiptId) || state.sccJobs.has(receipt.receiptId)) {
          refuse("SCC_JOB_RECEIPT_TAMPERED");
        }
        state.sccJobs.set(receipt.receiptId, receipt);
        break;
      }
      default:
        refuse("LEARNING_EVENT_TYPE_UNKNOWN", event.event_type);
    }
  }
  if (pendingRollback) refuse("ROLLBACK_EVENT_MISSING");
  if (pendingCandidateRejection) refuse("CANDIDATE_REJECTION_EVENT_MISSING");
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
    await mkdir(this.paths.websiteOutcomes, { recursive: true });
    await mkdir(this.paths.websiteEvaluations, { recursive: true });
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
    await this.#recoverPendingTransaction(secret);
    return this.verify();
  }

  async #acquireWriterLock() {
    const record = Object.freeze({
      processId: process.pid,
      lockId: randomBytes(16).toString("hex"),
      createdAt: new Date().toISOString()
    });
    let handle;
    try {
      handle = await open(this.paths.lock, "wx", 0o600);
      await handle.write(`${stableObjectJson(record)}\n`);
      await handle.sync();
      return { handle, record };
    } catch (error) {
      if (handle) await handle.close();
      if (error?.code === "EEXIST") refuse("LEARNING_WORKSPACE_BUSY");
      throw error;
    }
  }

  async #releaseWriterLock(lock) {
    if (!lock) return;
    await lock.handle.close();
    await rm(this.paths.lock, { force: true });
  }

  async #appendLedgerBytes(bytes) {
    const handle = await open(this.paths.ledger, "a", 0o600);
    try {
      await handle.write(bytes);
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  async #recoverPendingTransaction(secret) {
    let source;
    try {
      source = await readFile(this.paths.pendingTransaction, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") return false;
      throw error;
    }
    let transaction;
    try {
      transaction = JSON.parse(source);
    } catch {
      refuse("LEARNING_PENDING_TRANSACTION_INVALID");
    }
    const body = { ...transaction };
    delete body.transactionId;
    if (!/^[a-f0-9]{64}$/u.test(transaction.transactionId || "") ||
        hmac(secret, "KATHERINES_EYE_ATOMIC_LEARNING_TRANSACTION_V1", body) !== transaction.transactionId ||
        !Number.isSafeInteger(body.priorLedgerByteLength) || body.priorLedgerByteLength < 0 ||
        !/^[a-f0-9]{64}$/u.test(body.priorLedgerSha256 || "") ||
        !Array.isArray(body.pendingEvents) || !Array.isArray(body.memoryRecords)) {
      refuse("LEARNING_PENDING_TRANSACTION_TAMPERED");
    }
    for (const record of body.memoryRecords) validateMemoryRecord(record);

    let lock;
    try {
      lock = await this.#acquireWriterLock();
    } catch (error) {
      if (error?.code !== "LEARNING_WORKSPACE_BUSY") throw error;
      let owner = null;
      try { owner = JSON.parse(await readFile(this.paths.lock, "utf8")); } catch {}
      let ownerAlive = false;
      if (Number.isSafeInteger(owner?.processId) && owner.processId > 0) {
        try { process.kill(owner.processId, 0); ownerAlive = true; } catch {}
      }
      if (ownerAlive) throw error;
      await rm(this.paths.lock, { force: true });
      lock = await this.#acquireWriterLock();
    }
    try {
      const ledgerBytes = await readFile(this.paths.ledger);
      if (ledgerBytes.length < body.priorLedgerByteLength ||
          sha256Bytes(ledgerBytes.subarray(0, body.priorLedgerByteLength)) !== body.priorLedgerSha256) {
        refuse("LEARNING_PENDING_TRANSACTION_LEDGER_PREFIX_MISMATCH");
      }
      const pendingBytes = Buffer.from(`${body.pendingEvents.map((event) => stableObjectJson(event)).join("\n")}\n`, "utf8");
      const suffix = ledgerBytes.subarray(body.priorLedgerByteLength);
      if (!pendingBytes.equals(suffix)) {
        if (suffix.length > pendingBytes.length || !pendingBytes.subarray(0, suffix.length).equals(suffix)) {
          refuse("LEARNING_PENDING_TRANSACTION_LEDGER_SUFFIX_MISMATCH");
        }
        if (suffix.length > 0) await truncate(this.paths.ledger, body.priorLedgerByteLength);
        for (const record of body.memoryRecords) {
          await this.memoryStore.append(record, { allowIdenticalReplay: true });
        }
        await this.#appendLedgerBytes(pendingBytes);
      } else {
        for (const record of body.memoryRecords) {
          await this.memoryStore.append(record, { allowIdenticalReplay: true });
        }
      }
      await rm(this.paths.pendingTransaction, { force: true });
      return true;
    } finally {
      await this.#releaseWriterLock(lock);
    }
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
    const state = deriveState(events, secret);
    return { secret, events, state, ledgerHead: prior };
  }

  async #authenticateWebsiteOutcome(loaded, event) {
    if (!event) return null;
    const artifactPath = path.join(this.paths.websiteOutcomes, event.artifact_file);
    let source;
    try {
      source = await readFile(artifactPath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") refuse("WEBSITE_OUTCOME_ARTIFACT_MISSING");
      throw error;
    }
    if (!source.endsWith("\n") || sha256Bytes(Buffer.from(source, "utf8")) !== event.artifact_sha256) {
      refuse("WEBSITE_OUTCOME_ARTIFACT_HASH_MISMATCH");
    }
    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch {
      refuse("WEBSITE_OUTCOME_ARTIFACT_JSON_INVALID");
    }
    const authenticated = authenticateWebsiteOutcomeArtifact(loaded.secret, parsed);
    const artifact = authenticated.artifact;
    if (
      artifact.artifactId !== event.website_outcome_id
      || artifact.learningScopeIdentity !== this.learningScopeIdentity
      || artifact.episodeId !== event.episode_id
      || artifact.episodeSequence !== event.episode_sequence
      || artifact.terminalKind !== event.terminal_kind
      || artifact.statusCode !== event.status_code
      || artifact.request.sha256 !== event.request_sha256
      || artifact.response.sha256 !== event.response_sha256
      || artifact.response.canonicalObjectHash !== event.canonical_response_hash
      || artifact.productOutcomeId !== event.product_outcome_id
      || sha256Object(artifact.cognitiveDisposition) !== event.cognitive_disposition_hash
      || (artifact.providerMetering?.meteringHash || "") !== (event.provider_metering_hash || "")
      || artifact.createdAt !== event.created_at
    ) refuse("WEBSITE_OUTCOME_ARTIFACT_LEDGER_MISMATCH");
    const disposition = artifact.cognitiveDisposition;
    const failure = disposition.failureId
      ? loaded.state.failures.get(disposition.failureId)
      : null;
    const diagnosis = disposition.diagnosisId
      ? loaded.state.diagnoses.get(disposition.diagnosisId)
      : null;
    const candidate = disposition.candidateId
      ? loaded.state.candidates.get(disposition.candidateId)
      : null;
    if (
      (!disposition.failureId && (
        disposition.diagnosisId
        || disposition.candidateId
        || disposition.mentorDecisionIdentity
      ))
      || (disposition.failureId && (!failure || failure.episode_id !== artifact.episodeId))
      || (disposition.diagnosisId && (
        !diagnosis
        || diagnosis.failure_id !== disposition.failureId
        || diagnosis.mentor_decision_identity !== disposition.mentorDecisionIdentity
      ))
      || (disposition.candidateId && (
        !candidate
        || candidate.failure_id !== disposition.failureId
        || candidate.diagnosis_id !== disposition.diagnosisId
      ))
    ) refuse("WEBSITE_OUTCOME_COGNITIVE_REFERENCE_MISSING");
    return Object.freeze({
      artifact,
      requestBytes: authenticated.requestBytes,
      responseBytes: authenticated.responseBytes,
      ledgerEventIdentity: loaded.events.find((item) => (
        item.event_type === "WEBSITE_OUTCOME_RECORDED"
        && item.payload.website_outcome_id === event.website_outcome_id
      ))?.event_id || ""
    });
  }

  async #verifyWebsiteOutcomeArtifacts(loaded) {
    let entries;
    try {
      entries = await readdir(this.paths.websiteOutcomes, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") entries = [];
      else throw error;
    }
    const expectedFiles = new Set([...loaded.state.websiteOutcomes.values()].map((event) => event.artifact_file));
    if (
      entries.some((entry) => !entry.isFile() || !expectedFiles.has(entry.name))
      || entries.length !== expectedFiles.size
    ) refuse("WEBSITE_OUTCOME_ARTIFACT_SET_MISMATCH");
    for (const event of loaded.state.websiteOutcomes.values()) {
      await this.#authenticateWebsiteOutcome(loaded, event);
    }
    return true;
  }

  async #authenticateWebsiteEvaluation(loaded, event) {
    if (!event) return null;
    const artifactPath = path.join(this.paths.websiteEvaluations, event.artifact_file);
    let source;
    try {
      source = await readFile(artifactPath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") refuse("WEBSITE_EVALUATION_ARTIFACT_MISSING");
      throw error;
    }
    if (!source.endsWith("\n") || sha256Bytes(Buffer.from(source, "utf8")) !== event.artifact_sha256) {
      refuse("WEBSITE_EVALUATION_ARTIFACT_HASH_MISMATCH");
    }
    let parsed;
    try {
      parsed = JSON.parse(source);
    } catch {
      refuse("WEBSITE_EVALUATION_ARTIFACT_JSON_INVALID");
    }
    const authenticated = authenticateWebsiteEvaluationArtifact(loaded.secret, parsed);
    const artifact = authenticated.artifact;
    if (
      artifact.artifactId !== event.website_evaluation_id
      || artifact.learningScopeIdentity !== this.learningScopeIdentity
      || artifact.episodeId !== event.episode_id
      || artifact.websiteOutcomeId !== event.website_outcome_id
      || artifact.productOutcomeId !== event.product_outcome_id
      || artifact.imageSha256 !== event.image_sha256
      || artifact.imageByteCount !== event.image_byte_count
      || artifact.requestSha256 !== event.request_sha256
      || artifact.rawResponseSha256 !== event.raw_response_sha256
      || artifact.canonicalResponseHash !== event.canonical_response_hash
      || artifact.evaluatorIdentity !== event.evaluator_identity
      || artifact.evaluationAuthorityIdentity !== event.evaluation_authority_identity
      || artifact.authorityManifestId !== event.authority_manifest_id
      || artifact.authorityManifestSha256 !== event.authority_manifest_sha256
      || artifact.evaluatorKeyId !== event.evaluator_key_id
      || artifact.evaluatorNonce !== event.evaluator_nonce
      || artifact.evaluatorSequence !== event.evaluator_sequence
      || artifact.criteriaVersion !== event.criteria_version
      || artifact.evaluation.sha256 !== event.evaluation_bytes_sha256
      || artifact.evaluation.evaluationReportHash !== event.evaluation_hash
      || artifact.evaluationDisposition !== event.evaluation_disposition
      || (artifact.successArtifact?.sha256 || "") !== event.success_artifact_sha256
      || (artifact.successArtifact?.artifactHash || "") !== event.success_artifact_hash
      || artifact.evaluatedAt !== event.evaluated_at
    ) refuse("WEBSITE_EVALUATION_ARTIFACT_LEDGER_MISMATCH");
    const websiteOutcome = loaded.state.websiteOutcomes.get(artifact.episodeId);
    const productOutcome = loaded.state.outcomes.get(artifact.episodeId);
    if (
      !websiteOutcome
      || websiteOutcome.website_outcome_id !== artifact.websiteOutcomeId
      || websiteOutcome.product_outcome_id !== artifact.productOutcomeId
      || websiteOutcome.request_sha256 !== artifact.requestSha256
      || websiteOutcome.response_sha256 !== artifact.rawResponseSha256
      || websiteOutcome.canonical_response_hash !== artifact.canonicalResponseHash
      || !productOutcome
      || productOutcome.outcome_id !== artifact.productOutcomeId
      || productOutcome.response_hash !== artifact.canonicalResponseHash
    ) refuse("WEBSITE_EVALUATION_OUTCOME_ARTIFACT_BINDING_INVALID");
    return Object.freeze({
      ...authenticated,
      ledgerEventIdentity: loaded.events.find((item) => (
        item.event_type === "WEBSITE_EVALUATION_RECORDED"
        && item.payload.website_evaluation_id === event.website_evaluation_id
      ))?.event_id || ""
    });
  }

  async #verifyWebsiteEvaluationArtifacts(loaded) {
    let entries;
    try {
      entries = await readdir(this.paths.websiteEvaluations, { withFileTypes: true });
    } catch (error) {
      if (error?.code === "ENOENT") entries = [];
      else throw error;
    }
    const expectedFiles = new Set([...loaded.state.websiteEvaluations.values()].map((event) => event.artifact_file));
    if (
      entries.some((entry) => !entry.isFile() || !expectedFiles.has(entry.name))
      || entries.length !== expectedFiles.size
    ) refuse("WEBSITE_EVALUATION_ARTIFACT_SET_MISMATCH");
    for (const event of loaded.state.websiteEvaluations.values()) {
      await this.#authenticateWebsiteEvaluation(loaded, event);
    }
    return true;
  }

  async #write(operation) {
    await this.initialize();
    const lock = await this.#acquireWriterLock();
    try {
      const loaded = await this.#load();
      await this.#verifyWebsiteOutcomeArtifacts(loaded);
      await this.#verifyWebsiteEvaluationArtifacts(loaded);
      const appendBatch = async (entries, { memoryRecords = [] } = {}) => {
        if (!Array.isArray(entries) || entries.length === 0 || !Array.isArray(memoryRecords)) {
          refuse("LEARNING_ATOMIC_BATCH_INVALID");
        }
        for (const record of memoryRecords) validateMemoryRecord(record);
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
        const priorLedgerBytes = await readFile(this.paths.ledger);
        const transactionBody = {
          schemaVersion: "1.0",
          transactionType: "KATHERINES_EYE_ATOMIC_LEARNING_TRANSACTION",
          learningScopeIdentity: this.learningScopeIdentity,
          writerLockId: lock.record.lockId,
          priorLedgerByteLength: priorLedgerBytes.length,
          priorLedgerSha256: sha256Bytes(priorLedgerBytes),
          pendingEvents: pending,
          memoryRecords
        };
        const transaction = {
          ...transactionBody,
          transactionId: hmac(
            loaded.secret,
            "KATHERINES_EYE_ATOMIC_LEARNING_TRANSACTION_V1",
            transactionBody
          )
        };
        await writeFile(
          this.paths.pendingTransaction,
          `${stableObjectJson(transaction)}\n`,
          { flag: "wx", mode: 0o600 }
        );
        for (const record of memoryRecords) {
          await this.memoryStore.append(record, { allowIdenticalReplay: true });
        }
        await this.#appendLedgerBytes(Buffer.from(
          `${pending.map((event) => stableObjectJson(event)).join("\n")}\n`,
          "utf8"
        ));
        await rm(this.paths.pendingTransaction, { force: true });
        loaded.events.push(...pending);
        loaded.state = deriveState(loaded.events, loaded.secret);
        return pending;
      };
      return await operation(loaded, appendBatch);
    } finally {
      await this.#releaseWriterLock(lock);
    }
  }

  async nextEpisodeSequence() {
    await this.initialize();
    const loaded = await this.#load();
    await this.#verifyWebsiteOutcomeArtifacts(loaded);
    await this.#verifyWebsiteEvaluationArtifacts(loaded);
    return loaded.state.lastEpisodeSequence + 1;
  }

  async prepareEpisode({
    governor,
    episodeId,
    episodeSequence,
    queryFacets = {},
    queryText = "",
    learningMode = "PRODUCT",
    trialRequest = null,
    createdAt
  } = {}) {
    cleanString(episodeId, 160);
    if (!Number.isSafeInteger(episodeSequence) || episodeSequence < 1) refuse("EPISODE_SEQUENCE_INVALID");
    canonicalIso(createdAt);
    return this.#write(async ({ secret, state }, appendBatch) => {
      if (episodeSequence <= state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
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
      const governedCandidateIds = new Set([...state.candidates.values()]
        .filter((event) => (
          recordsById.get(event.memory_id)?.contentHash === event.memory_hash
          && !state.candidateRejections.has(event.candidate_id)
        ))
        .map((event) => event.memory_id));
      const governedPromotedIds = new Set([...state.lessons.values()]
        .filter((event) => (
          event.status === "VALIDATED_BY_TRANSFER"
          && recordsById.get(event.lesson_id)?.contentHash === event.lesson_hash
          && !state.rollbacks.has(event.lesson_id)
        ))
        .map((event) => event.lesson_id));
      const researchApplicabilityDecision = classifyGovernedResearchApplicability(
        queryFacets.researchEvidenceRisk || {
          canonicalIdentityUnresolvedCount: 0,
          unsupportedQueryTermCount: 0,
          exactComparableCount: 0,
          closeComparableCount: 0,
          categoryComparableCount: 0,
          weakPriceProvenanceCount: 0,
          valueJudgmentExceedsEvidenceCount: 0
        }
      );
      let trialAuthorization = null;
      let trialAuthorizationEntry = null;
      let nominatedCandidateMemoryIds = [];
      if (learningMode === "GOVERNED_TRIAL") {
        exactObject(trialRequest, [
          "candidateId", "beforeArmEpisodeId", "afterArmEpisodeId",
          "frozenPreInterventionStateHash", "purpose"
        ]);
        const candidateId = cleanString(trialRequest.candidateId, 160);
        const candidate = state.candidates.get(candidateId);
        const beforeArmEpisodeId = cleanString(trialRequest.beforeArmEpisodeId, 160);
        const afterArmEpisodeId = cleanString(trialRequest.afterArmEpisodeId, 160);
        const frozenPreInterventionStateHash = sha256Identity(
          trialRequest.frozenPreInterventionStateHash,
          "frozen pre-intervention state"
        );
        if (
          trialRequest.purpose !== "ISOLATED_CAUSAL_QUALIFICATION"
          || afterArmEpisodeId !== episodeId
          || beforeArmEpisodeId === afterArmEpisodeId
          || !candidate
          || state.candidateRejections.has(candidateId)
          || [...state.qualifications.values()].some((item) => item.candidate_id === candidateId)
          || !governedCandidateIds.has(candidate.memory_id)
          || researchApplicabilityDecision.classification !== GOVERNED_RESEARCH_APPLICABILITY.APPLICABLE
          || frozenPreInterventionStateHash !== sha256Identity(
            queryFacets.frozenPreInterventionStateHash,
            "query frozen pre-intervention state"
          )
        ) refuse("QUALIFICATION_TRIAL_NOMINATION_INVALID");
        nominatedCandidateMemoryIds = [candidate.memory_id];
        const trialBody = {
          candidate_id: candidateId,
          candidate_memory_id: candidate.memory_id,
          before_arm_episode_id: beforeArmEpisodeId,
          episode_id: episodeId,
          episode_sequence: episodeSequence,
          applicability_decision_hash: researchApplicabilityDecision.applicabilityDecisionHash,
          applicability_classification: researchApplicabilityDecision.classification,
          frozen_pre_intervention_state_hash: frozenPreInterventionStateHash,
          governor_identity: governor?.governorIdentity,
          provider_lifecycle_authority: false
        };
        const trialAuthorizationId = hmac(secret, "KATHERINES_EYE_QUALIFICATION_TRIAL_AUTHORITY_V1", trialBody);
        trialAuthorizationEntry = {
          event_type: "QUALIFICATION_TRIAL_AUTHORIZED",
          payload: { trial_authorization_id: trialAuthorizationId, ...trialBody }
        };
        trialAuthorization = Object.freeze({
          authorityType: "GOVERNOR_QUALIFICATION_TRIAL",
          trialAuthorizationId,
          governorIdentity: governor?.governorIdentity,
          candidateId,
          candidateMemoryIds: nominatedCandidateMemoryIds,
          beforeArmEpisodeId,
          afterArmEpisodeId,
          applicabilityDecisionHash: researchApplicabilityDecision.applicabilityDecisionHash,
          frozenPreInterventionStateHash,
          providerLifecycleAuthority: false
        });
      } else if (trialRequest) {
        refuse("QUALIFICATION_TRIAL_MODE_REQUIRED");
      }
      const allowed = learningMode === "GOVERNED_TRIAL"
        ? new Set(nominatedCandidateMemoryIds)
        : governedPromotedIds;
      const relevantCandidates = receipt.candidateScores
        .filter((item) => {
          const record = recordsById.get(item.memoryId);
          const researchProcessStrategy = record?.recommendedActionPattern === GOVERNED_RESEARCH_STRATEGY_ACTION;
          if (researchProcessStrategy) return researchApplicabilityDecision.applicable === true;
          if (item.candidateScore < MINIMUM_GOVERNED_REUSE_SCORE) return false;
          const required = Array.isArray(record?.requiredApplicabilitySignals)
            ? record.requiredApplicabilitySignals
            : [];
          const supplied = researchApplicabilityDecision.requiredApplicabilitySignals;
          return required.length === 0 || required.some((signal) => supplied.includes(signal));
        });
      const selectedMemoryIds = relevantCandidates
        .filter((item) => allowed.has(item.memoryId))
        .slice(0, 3)
        .map((item) => item.memoryId)
        .sort();
      const rejectedMemoryIds = relevantCandidates
        .filter((item) => !selectedMemoryIds.includes(item.memoryId))
        .map((item) => item.memoryId)
        .sort();
      const refusedRollbacks = relevantCandidates
        .filter((item) => state.rollbacks.has(item.memoryId))
        .map((item) => {
          const rollback = state.rollbacks.get(item.memoryId);
          const body = {
            lesson_id: item.memoryId,
            rollback_event_id: rollback.rollback_event_id,
            rollback_memory_id: rollback.rollback_memory_id,
            rollback_memory_hash: rollback.rollback_memory_hash,
            episode_id: episodeId,
            episode_sequence: episodeSequence,
            retrieval_receipt_hash: receipt.receiptHash,
            reason: "ROLLED_BACK_LESSON"
          };
          return {
            event_type: "LESSON_REUSE_REFUSED",
            payload: {
              refusal_id: hmac(secret, "KATHERINES_EYE_LESSON_REUSE_REFUSAL_V1", body),
              ...body
            }
          };
        });
      const appendedEntries = [
        ...refusedRollbacks,
        ...(trialAuthorizationEntry ? [trialAuthorizationEntry] : [])
      ];
      const appendedEvents = appendedEntries.length > 0 ? await appendBatch(appendedEntries) : [];
      const refusalEvents = appendedEvents.filter((event) => event.event_type === "LESSON_REUSE_REFUSED");
      const rollbackRefusals = refusalEvents.map((event) => Object.freeze({
        refusalId: event.payload.refusal_id,
        refusalEventId: event.event_id,
        lessonId: event.payload.lesson_id,
        rollbackMemoryId: event.payload.rollback_memory_id,
        rollbackMemoryHash: event.payload.rollback_memory_hash,
        episodeId: event.payload.episode_id,
        episodeSequence: event.payload.episode_sequence,
        retrievalReceiptHash: event.payload.retrieval_receipt_hash,
        reason: event.payload.reason
      }));
      const retrievalDecision = withObjectHash({
        schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
        decisionType: "GOVERNED_MEMORY_RETRIEVAL_DECISION",
        runIdentity: this.learningScopeIdentity,
        currentEpisodeId: episodeId,
        episodeSequence,
        retrievalReceiptHash: receipt.receiptHash,
        minimumReuseScore: MINIMUM_GOVERNED_REUSE_SCORE,
        candidateMemoryIds: relevantCandidates.map((item) => item.memoryId).sort(),
        selectedMemoryIds,
        rejectedMemoryIds,
        rollbackRefusals,
        researchApplicabilityDecisionHash: researchApplicabilityDecision.applicabilityDecisionHash,
        trialAuthorizationId: trialAuthorization?.trialAuthorizationId || "",
        resultClassification: rollbackRefusals.length > 0
          ? "ROLLED_BACK_REFUSED"
          : selectedMemoryIds.length > 0 ? "AUTHORIZED_MATCHES" : "VALID_EMPTY",
        providerLifecycleAuthority: false
      }, "retrievalDecisionHash");
      retrievalDecisionAuthorities.set(retrievalDecision, governor);
      return Object.freeze({
        runIdentity: this.learningScopeIdentity,
        currentEpisodeId: episodeId,
        episodeSequence,
        records,
        selectedMemoryIds,
        retrievalReceiptHash: receipt.receiptHash,
        retrievalDecision,
        researchApplicabilityDecision,
        startsEmpty: true,
        forwardOnly: true,
        learningMode,
        ...(trialAuthorization ? { trialAuthorization } : {})
      });
    });
  }

  async captureProductFailure({
    governor,
    runtime,
    episodeId,
    episodeSequence,
    cognitiveEpisode,
    lessonCandidate,
    visibleEvidenceIds,
    evidenceReferences: suppliedEvidenceReferences,
    createdAt,
    feedbackEnvelope = null,
    captureAuthority = "",
    failureTaxonomy = null
  } = {}) {
    if (!lessonCandidate) return { result: "NO_LESSON_CANDIDATE" };
    assertRuntimeAuthority(governor, runtime);
    canonicalIso(createdAt);
    const authority = cleanString(captureAuthority, 100);
    if (feedbackEnvelope && authority !== "AUTHENTICATED_PRODUCT_OUTCOME_FEEDBACK") {
      refuse("PRODUCT_FEEDBACK_CAPTURE_AUTHORITY_INVALID");
    }
    if (!feedbackEnvelope && authority === "EVIDENCE_BOUND_PRODUCT_FAILURE") {
      if (
        !failureTaxonomy
        || failureTaxonomy.cognitiveEntryAuthorized !== true
        || ![
          "AUTHENTICATED_PRODUCT_SEMANTIC_FAILURE",
          "EVIDENCE_QUALITY_FAILURE",
          "PURPOSE_RESULT_INCONSISTENCY"
        ].includes(failureTaxonomy.failureClass)
      ) refuse("PRODUCT_FAILURE_COGNITIVE_ENTRY_PROHIBITED");
    } else if (
      !feedbackEnvelope
      && authority !== "CANONICAL_TERMINAL_COGNITIVE_EPISODE"
    ) {
      refuse("LEARNING_CAPTURE_AUTHORITY_REQUIRED");
    }
    const expectedEvidenceReferences = [
      cognitiveEpisode?.cognitiveEpisodeHash,
      cognitiveEpisode?.linkedExperienceRecordHash,
      lessonCandidate?.lessonCandidateHash,
      feedbackEnvelope?.feedbackId,
      feedbackEnvelope?.responseHash,
      feedbackEnvelope?.originalEvidenceIdentity,
      feedbackEnvelope?.memoryTransitionHash
    ].filter(Boolean);
    const handoff = buildProductFailureEvidenceHandoff({
      visibleEvidenceIds,
      evidenceReferences: suppliedEvidenceReferences
    });
    if (stableObjectJson(handoff.evidenceReferences) !== stableObjectJson(expectedEvidenceReferences)) {
      refuse("LEARNING_EVIDENCE_SUBSTITUTION");
    }
    const visible = new Set(handoff.visibleEvidenceIds);
    const evidenceReferences = [...handoff.evidenceReferences];
    const failureCategory = cleanString(lessonCandidate.generalizedFailureCategory, 160);
    return this.#write(async ({ secret, state }, appendBatch) => {
      if (episodeSequence <= state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
      let feedback = null;
      let feedbackEvent = null;
      if (feedbackEnvelope) {
        const core = feedbackEnvelopeCore(feedbackEnvelope);
        if (
          core.feedbackType !== "AUTHORIZED_PRODUCT_OUTCOME_FEEDBACK"
          || core.learningScopeIdentity !== this.learningScopeIdentity
          || feedbackEnvelope.feedbackId !== hmac(secret, "KATHERINES_EYE_PRODUCT_OUTCOME_FEEDBACK_V1", core)
        ) refuse("PRODUCT_FEEDBACK_AUTHORITY_INVALID");
        const outcome = state.outcomes.get(core.boundEpisodeId);
        if (
          !outcome
          || state.feedback.has(feedbackEnvelope.feedbackId)
          || outcome.episode_sequence !== core.boundEpisodeSequence
          || outcome.response_hash !== core.responseHash
          || outcome.original_evidence_identity !== core.originalEvidenceIdentity
          || outcome.cognitive_episode_hash !== core.cognitiveEpisodeHash
          || outcome.submitted_object_fingerprint !== core.submittedObjectFingerprint
          || outcome.memory_transition_hash !== core.memoryTransitionHash
        ) refuse("PRODUCT_FEEDBACK_BINDING");
        feedback = core;
        feedbackEvent = {
          event_type: "PRODUCT_FEEDBACK_ACCEPTED",
          payload: {
            feedback_id: feedbackEnvelope.feedbackId,
            bound_episode_id: core.boundEpisodeId,
            response_hash: core.responseHash,
            original_evidence_identity: core.originalEvidenceIdentity,
            cognitive_episode_hash: core.cognitiveEpisodeHash,
            submitted_object_fingerprint: core.submittedObjectFingerprint,
            memory_transition_hash: core.memoryTransitionHash,
            failed_claim: core.failedClaim,
            correction: core.correction,
            provider_authored: false
          }
        };
      }
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
        evidence_references: exactEvidenceStrings(mentorEvidenceReferences, {
          maximumItems: MAX_GOVERNED_FAILURE_EVIDENCE_REFERENCES
        })
      };
      if (!diagnosisBody.evidence_references.every((identity) => visible.has(identity))) {
        refuse("MENTOR_EVIDENCE_NOT_VISIBLE");
      }
      const diagnosisId = hmac(secret, "KATHERINES_EYE_MENTOR_DIAGNOSIS_V1", diagnosisBody);
      const feedbackDomain = classifyProductFeedbackDomain(feedback);
      if (feedback && !feedbackDomain) refuse("PRODUCT_FEEDBACK_DOMAIN_UNSUPPORTED");
      const researchStrategyFeedback = feedbackDomain === "COMPARABLE_RESEARCH_STRATEGY";
      const feedbackApplicabilitySignal = feedback
        ? `${feedback.failedClaim.claimClass.replace(/[^A-Za-z0-9]+/g, "_").toUpperCase()}_RISK`
        : "";
      const recommendedActionPattern = feedback
        ? researchStrategyFeedback
          ? GOVERNED_RESEARCH_STRATEGY_ACTION
          : mentorDecision.selectedActionId
        : lessonCandidate.actionSequenceSummary
        ?.find((record) => !String(record.actionType || "").startsWith("STOP_"))
        ?.actionType || "";
      const feedbackRule = feedback
        ? researchStrategyFeedback
          ? `${mentorDecision.selectedActionId} diagnosed ${feedback.failedClaim.failureKind}; the bounded strategy candidate may balance exact, close, and category comparables only when the canonical product state exposes a matching research-evidence risk.`
          : `${mentorDecision.selectedActionId} diagnosed ${feedback.failedClaim.failureKind}; the inert candidate may preserve the authenticated correction only as returned evidence until independent object-class proof authorizes a bounded trial.`
        : "";
      const candidateCore = {
        memoryType: "GENERALIZED_LESSON_CANDIDATE",
        memoryId: `ke-learning-candidate-${hmac(secret, "KATHERINES_EYE_LESSON_CANDIDATE_V1", {
          failureId,
          diagnosisId,
          lessonCandidateHash: lessonCandidate.lessonCandidateHash
        }).slice(0, 32)}`,
        sourceEpisodeIds: feedback ? [feedback.boundEpisodeId, episodeId] : [episodeId],
        sourceEpisodeSequence: episodeSequence,
        evidenceReferences,
        evidenceAggregateHash: sha256Object(evidenceReferences),
        observedFailurePattern: feedback ? feedback.failedClaim.failureKind : failureCategory,
        generalizedRule: cleanString(feedbackRule || lessonCandidate.proposedEngineeringReviewArea || failureCategory, 240),
        triggeringConditions: feedback
          ? [researchStrategyFeedback ? "COMPARABLE_RESEARCH_STRATEGY_RISK" : feedbackApplicabilitySignal]
          : cleanStrings(lessonCandidate.generalizedPreconditions || [failureCategory]),
        applicabilityBoundaries: feedback
          ? [researchStrategyFeedback ? "CANONICAL_PRODUCT_STATE" : "AUTHENTICATED_RETURNED_EVIDENCE", feedback.failedClaim.claimClass]
          : cleanStrings([lessonCandidate.subsystem || "COGNITIVE_GOVERNOR"]),
        explicitNonApplicabilityConditions: feedback
          ? researchStrategyFeedback
            ? [
                "NO_CANONICAL_RESEARCH_PLAN",
                "CLEAR_GROUNDED_RESEARCH_STRATEGY",
                "UNRELATED_NOVEL_OBJECT"
              ]
            : [
                "CLEAR_VISIBLE_OBJECT_CLASS_SUPPORT",
                "CONTRADICTORY_AUTHENTICATED_CORRECTION",
                "UNRELATED_NOVEL_OBJECT"
              ]
          : ["NO_APPLICABLE_PROCESS_CONDITION"],
        ...(feedback ? {
          requiredApplicabilitySignals: [researchStrategyFeedback ? "COMPARABLE_RESEARCH_STRATEGY_RISK" : feedbackApplicabilitySignal],
          expectedBenefit: researchStrategyFeedback
            ? `Reduce ${feedback.failedClaim.failureKind} by grounding and broadening comparable research without changing visual identity.`
            : `Reduce ${feedback.failedClaim.failureKind} by preserving authenticated visible-object-class correction evidence without changing exact product identity.`,
          measurableRisks: researchStrategyFeedback
            ? [
                "SEARCH_BUDGET_DISPLACEMENT",
                "WEAKER_COMPARABLE_PROMOTION",
                "UNSUPPORTED_QUERY_TERM"
              ]
            : [
                "UNSUPPORTED_CORRECTION_GENERALIZATION",
                "CROSS_OBJECT_MISAPPLICATION",
                "EVIDENCE_PROVENANCE_LOSS"
              ],
          feedbackBinding: {
            feedbackId: feedbackEnvelope.feedbackId,
            boundEpisodeId: feedback.boundEpisodeId,
            responseHash: feedback.responseHash,
            originalEvidenceIdentity: feedback.originalEvidenceIdentity
          }
        } : {}),
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
        ...(feedbackEvent ? [feedbackEvent] : []),
        { event_type: "FAILURE_RECORDED", payload: { failure_id: failureId, ...failureBody } },
        { event_type: "MENTOR_DIAGNOSIS_RECORDED", payload: { diagnosis_id: diagnosisId, ...diagnosisBody } },
        {
          event_type: "LESSON_CANDIDATE_RECORDED",
          payload: {
            candidate_id: candidateId,
            failure_id: failureId,
            diagnosis_id: diagnosisId,
            episode_sequence: episodeSequence,
            memory_id: memoryRecord.memoryId,
            memory_hash: memoryRecord.contentHash
          }
        }
      ], { memoryRecords: [memoryRecord] });
      return {
        result: "LESSON_CANDIDATE_RECORDED",
        failureId,
        diagnosisId,
        candidateId,
        memoryId: memoryRecord.memoryId,
        feedbackId: feedbackEnvelope?.feedbackId || "",
        promotionAuthorized: false
      };
    });
  }

  async recordProductOutcome({
    governor,
    runtime,
    episodeId,
    episodeSequence,
    responseHash,
    originalEvidenceIdentity,
    cognitiveEpisodeHash,
    submittedObjectFingerprint,
    memoryTransitionHash,
    causalAttribution = null,
    frozenPreInterventionStateHash = "",
    researchPlanStateHash = "",
    researchApplicabilityDecisionHash = "",
    createdAt
  } = {}) {
    assertRuntimeAuthority(governor, runtime);
    canonicalIso(createdAt);
    const normalizedEpisodeSequence = violationCount(episodeSequence, "episodeSequence");
    if (normalizedEpisodeSequence < 1) refuse("EPISODE_SEQUENCE_INVALID");
    const governedCausalAttribution = causalAttribution
      ? canonicalTrialCausalAttribution(causalAttribution)
      : null;
    const body = {
      episode_id: cleanString(episodeId, 160),
      episode_sequence: normalizedEpisodeSequence,
      response_hash: sha256Identity(responseHash, "product response"),
      original_evidence_identity: sha256Identity(originalEvidenceIdentity, "original evidence"),
      cognitive_episode_hash: sha256Identity(cognitiveEpisodeHash, "cognitive episode"),
      submitted_object_fingerprint: cleanString(submittedObjectFingerprint, 160),
      memory_transition_hash: sha256Identity(memoryTransitionHash, "memory transition"),
      causal_attribution_hash: governedCausalAttribution?.causalAttributionHash || "",
      causal_attribution: governedCausalAttribution,
      frozen_pre_intervention_state_hash: optionalSha256Identity(
        frozenPreInterventionStateHash,
        "product frozen pre-intervention state"
      ),
      research_plan_state_hash: optionalSha256Identity(researchPlanStateHash, "product research plan state"),
      research_applicability_decision_hash: optionalSha256Identity(
        researchApplicabilityDecisionHash,
        "product research applicability decision"
      ),
      provider_lifecycle_authority: false,
      created_at: canonicalIso(createdAt)
    };
    if (
      runtime.authoritativeMemoryTransition.memoryTransitionHash !== body.memory_transition_hash
      || runtime.memory.currentEpisodeId !== body.episode_id
    ) refuse("PRODUCT_OUTCOME_RUNTIME_BINDING");
    return this.#write(async ({ secret, state }, appendBatch) => {
      if (state.outcomes.has(body.episode_id)) refuse("PRODUCT_OUTCOME_REPLAY");
      if (body.episode_sequence < state.lastEpisodeSequence) refuse("PRODUCT_OUTCOME_ORDER");
      if (
        body.episode_sequence === state.lastEpisodeSequence
        && ![...state.failures.values()].some((failure) => (
          failure.episode_id === body.episode_id
          && failure.episode_sequence === body.episode_sequence
        ))
      ) refuse("PRODUCT_OUTCOME_ORDER");
      const outcomeId = hmac(secret, "KATHERINES_EYE_PRODUCT_OUTCOME_V1", body);
      await appendBatch([{ event_type: "PRODUCT_OUTCOME_RECORDED", payload: { outcome_id: outcomeId, ...body } }]);
      return { result: "PRODUCT_OUTCOME_RECORDED", outcomeId, ...body };
    });
  }

  async authorizeProductOutcomeFeedback({
    episodeId,
    responseHash,
    originalEvidenceIdentity,
    failedClaim,
    correction,
    issuedAt
  } = {}) {
    await this.initialize();
    const loaded = await this.#load();
    const outcome = loaded.state.outcomes.get(cleanString(episodeId, 160));
    if (
      !outcome
      || outcome.response_hash !== sha256Identity(responseHash, "response")
      || outcome.original_evidence_identity !== sha256Identity(originalEvidenceIdentity, "original evidence")
    ) refuse("PRODUCT_FEEDBACK_OUTCOME_NOT_FOUND");
    const core = {
      feedbackType: "AUTHORIZED_PRODUCT_OUTCOME_FEEDBACK",
      learningScopeIdentity: this.learningScopeIdentity,
      boundEpisodeId: outcome.episode_id,
      boundEpisodeSequence: outcome.episode_sequence,
      responseHash: outcome.response_hash,
      originalEvidenceIdentity: outcome.original_evidence_identity,
      cognitiveEpisodeHash: outcome.cognitive_episode_hash,
      submittedObjectFingerprint: outcome.submitted_object_fingerprint,
      memoryTransitionHash: outcome.memory_transition_hash,
      failedClaim: canonicalFeedbackClaim(failedClaim),
      correction: canonicalFeedbackCorrection(correction),
      issuedAt: canonicalIso(issuedAt)
    };
    return Object.freeze({
      ...core,
      feedbackId: hmac(loaded.secret, "KATHERINES_EYE_PRODUCT_OUTCOME_FEEDBACK_V1", core)
    });
  }

  async productOutcome(episodeId) {
    await this.initialize();
    const outcome = (await this.#load()).state.outcomes.get(cleanString(episodeId, 160));
    return outcome ? Object.freeze({ ...outcome }) : null;
  }

  async recordWebsiteOutcome({
    governor,
    runtime,
    episodeId,
    episodeSequence,
    terminalKind,
    statusCode,
    requestBytes,
    responseBytes,
    providerMetering = null,
    productOutcomeId = "",
    cognitiveDisposition,
    createdAt
  } = {}) {
    assertRuntimeAuthority(governor, runtime);
    const normalizedEpisodeId = cleanString(episodeId, 160);
    const normalizedEpisodeSequence = violationCount(episodeSequence, "website episodeSequence");
    if (
      normalizedEpisodeSequence < 1
      || runtime.memory.currentEpisodeId !== normalizedEpisodeId
    ) refuse("WEBSITE_OUTCOME_RUNTIME_BINDING");
    return this.#write(async (loaded, appendBatch) => {
      const artifact = sealWebsiteOutcomeArtifact(loaded.secret, {
        learningScopeIdentity: this.learningScopeIdentity,
        episodeId: normalizedEpisodeId,
        episodeSequence: normalizedEpisodeSequence,
        terminalKind,
        statusCode,
        requestBytes,
        responseBytes,
        providerMetering,
        productOutcomeId,
        cognitiveDisposition,
        createdAt
      });
      const existingEvent = loaded.state.websiteOutcomes.get(normalizedEpisodeId);
      if (existingEvent) {
        const existing = await this.#authenticateWebsiteOutcome(loaded, existingEvent);
        const comparable = (value) => ({
          terminalKind: value.terminalKind,
          statusCode: value.statusCode,
          requestSha256: value.request.sha256,
          responseSha256: value.response.sha256,
          canonicalObjectHash: value.response.canonicalObjectHash,
          productOutcomeId: value.productOutcomeId,
          cognitiveDisposition: value.cognitiveDisposition,
          providerMeteringHash: value.providerMetering?.meteringHash || ""
        });
        if (stableObjectJson(comparable(existing.artifact)) !== stableObjectJson(comparable(artifact))) {
          refuse("WEBSITE_OUTCOME_IDENTITY_SUBSTITUTION");
        }
        return Object.freeze({
          result: "WEBSITE_OUTCOME_ALREADY_RECORDED",
          idempotent: true,
          websiteOutcomeId: existing.artifact.artifactId,
          artifactHash: existingEvent.artifact_sha256,
          ledgerEventIdentity: existing.ledgerEventIdentity,
          cognitiveDisposition: existing.artifact.cognitiveDisposition,
          providerLifecycleAuthority: false
        });
      }
      const productOutcome = loaded.state.outcomes.get(normalizedEpisodeId);
      if (artifact.terminalKind === "SUCCESS") {
        if (
          !productOutcome
          || productOutcome.outcome_id !== artifact.productOutcomeId
          || productOutcome.episode_sequence !== artifact.episodeSequence
          || productOutcome.response_hash !== artifact.response.canonicalObjectHash
        ) refuse("WEBSITE_OUTCOME_PRODUCT_LEDGER_BINDING_INVALID");
      } else if (productOutcome) {
        refuse("WEBSITE_OUTCOME_FAILURE_PRODUCT_CONFLICT");
      }
      const disposition = artifact.cognitiveDisposition;
      const failure = disposition.failureId
        ? loaded.state.failures.get(disposition.failureId)
        : null;
      const diagnosis = disposition.diagnosisId
        ? loaded.state.diagnoses.get(disposition.diagnosisId)
        : null;
      const candidate = disposition.candidateId
        ? loaded.state.candidates.get(disposition.candidateId)
        : null;
      if (
        (!disposition.failureId && (
          disposition.diagnosisId
          || disposition.candidateId
          || disposition.mentorDecisionIdentity
        ))
        || (disposition.failureId && (!failure || failure.episode_id !== artifact.episodeId))
        || (disposition.diagnosisId && (
          !diagnosis
          || diagnosis.failure_id !== disposition.failureId
          || diagnosis.mentor_decision_identity !== disposition.mentorDecisionIdentity
        ))
        || (disposition.candidateId && (
          !candidate
          || candidate.failure_id !== disposition.failureId
          || candidate.diagnosis_id !== disposition.diagnosisId
        ))
      ) refuse("WEBSITE_OUTCOME_COGNITIVE_REFERENCE_MISSING");
      const source = `${stableObjectJson(artifact)}\n`;
      const artifactFile = `${artifact.artifactId}.json`;
      const artifactPath = path.join(this.paths.websiteOutcomes, artifactFile);
      let artifactWritten = false;
      let ledgerWritten = false;
      try {
        const handle = await open(artifactPath, "wx", 0o600);
        try {
          await handle.write(source, null, "utf8");
          await handle.sync();
        } finally {
          await handle.close();
        }
        artifactWritten = true;
        const artifactSha256 = sha256Bytes(Buffer.from(source, "utf8"));
        const event = {
          event_type: "WEBSITE_OUTCOME_RECORDED",
          payload: {
            website_outcome_id: artifact.artifactId,
            artifact_file: artifactFile,
            artifact_sha256: artifactSha256,
            episode_id: artifact.episodeId,
            episode_sequence: artifact.episodeSequence,
            terminal_kind: artifact.terminalKind,
            status_code: artifact.statusCode,
            request_sha256: artifact.request.sha256,
            response_sha256: artifact.response.sha256,
            canonical_response_hash: artifact.response.canonicalObjectHash,
            product_outcome_id: artifact.productOutcomeId,
            cognitive_disposition_hash: sha256Object(artifact.cognitiveDisposition),
            ...(artifact.providerMetering ? {
              provider_metering_hash: artifact.providerMetering.meteringHash
            } : {}),
            provider_lifecycle_authority: false,
            created_at: artifact.createdAt
          }
        };
        const [appended] = await appendBatch([event]);
        ledgerWritten = true;
        return Object.freeze({
          result: "WEBSITE_OUTCOME_RECORDED",
          idempotent: false,
          websiteOutcomeId: artifact.artifactId,
          artifactHash: artifactSha256,
          ledgerEventIdentity: appended.event_id,
          cognitiveDisposition: artifact.cognitiveDisposition,
          providerLifecycleAuthority: false
        });
      } catch (error) {
        if (artifactWritten && !ledgerWritten) await rm(artifactPath, { force: true });
        throw error;
      }
    });
  }

  async websiteOutcome(episodeId, { requestBytes = null, responseBytes = null } = {}) {
    await this.initialize();
    const loaded = await this.#load();
    await this.#verifyWebsiteOutcomeArtifacts(loaded);
    await this.#verifyWebsiteEvaluationArtifacts(loaded);
    const event = loaded.state.websiteOutcomes.get(cleanString(episodeId, 160));
    if (!event) return null;
    const authenticated = await this.#authenticateWebsiteOutcome(loaded, event);
    if (requestBytes !== null) {
      if (!Buffer.isBuffer(requestBytes) || sha256Bytes(requestBytes) !== authenticated.artifact.request.sha256) {
        refuse("WEBSITE_OUTCOME_REQUEST_MISMATCH");
      }
    }
    if (responseBytes !== null) {
      if (!Buffer.isBuffer(responseBytes) || sha256Bytes(responseBytes) !== authenticated.artifact.response.sha256) {
        refuse("WEBSITE_OUTCOME_RESPONSE_MISMATCH");
      }
    }
    return Object.freeze({
      websiteOutcomeId: authenticated.artifact.artifactId,
      artifact: authenticated.artifact,
      requestBytes: authenticated.requestBytes,
      responseBytes: authenticated.responseBytes,
      ledgerEventIdentity: authenticated.ledgerEventIdentity,
      providerLifecycleAuthority: false
    });
  }

  async recordWebsiteEvaluation(request = {}) {
    exactObject(request, [
      "episodeId", "productOutcomeId", "imageBytes", "evaluationBytes"
    ]);
    let independentEvaluation;
    try {
      independentEvaluation = verifyPinnedIndependentEvaluationBytes(request.evaluationBytes);
    } catch (error) {
      if (error?.code) refuse(error.code);
      throw error;
    }
    if (
      !Buffer.isBuffer(request.imageBytes)
      || request.imageBytes.length !== independentEvaluation.imageBinding.byteCount
      || sha256Bytes(request.imageBytes) !== independentEvaluation.imageBinding.sha256
    ) refuse("INDEPENDENT_EVALUATION_IMAGE_BYTES_MISMATCH");
    const normalizedEpisodeId = cleanString(request.episodeId, 160);
    return this.#write(async (loaded, appendBatch) => {
      const websiteOutcomeEvent = loaded.state.websiteOutcomes.get(normalizedEpisodeId);
      const productOutcome = loaded.state.outcomes.get(normalizedEpisodeId);
      if (!websiteOutcomeEvent || !productOutcome) refuse("WEBSITE_EVALUATION_ORPHAN");
      const authenticatedOutcome = await this.#authenticateWebsiteOutcome(loaded, websiteOutcomeEvent);
      if (authenticatedOutcome.artifact.terminalKind !== "SUCCESS") {
        refuse("WEBSITE_EVALUATION_NON_PRODUCT_OUTCOME_PROHIBITED");
      }
      const artifact = sealWebsiteEvaluationArtifact(loaded.secret, {
        learningScopeIdentity: this.learningScopeIdentity,
        episodeId: normalizedEpisodeId,
        websiteOutcomeId: authenticatedOutcome.artifact.artifactId,
        productOutcomeId: request.productOutcomeId,
        evaluationBytes: request.evaluationBytes
      });
      if (
        artifact.productOutcomeId !== authenticatedOutcome.artifact.productOutcomeId
        || artifact.productOutcomeId !== productOutcome.outcome_id
        || artifact.requestSha256 !== authenticatedOutcome.artifact.request.sha256
        || artifact.rawResponseSha256 !== authenticatedOutcome.artifact.response.sha256
        || artifact.canonicalResponseHash !== authenticatedOutcome.artifact.response.canonicalObjectHash
        || artifact.canonicalResponseHash !== productOutcome.response_hash
      ) refuse("WEBSITE_EVALUATION_OUTCOME_BINDING_INVALID");
      assertIndependentEvaluationReplaySafety({
        evaluation: {
          nonce: artifact.evaluatorNonce,
          sequence: artifact.evaluatorSequence
        },
        seenNonces: loaded.state.independentEvaluatorNonces,
        highestSequence: loaded.state.independentEvaluatorSequences.get(
          artifact.authorityManifestSha256
        ) || 0
      });
      const existingEvent = loaded.state.websiteEvaluations.get(normalizedEpisodeId);
      if (existingEvent) refuse("INDEPENDENT_EVALUATION_REPLAY");
      const source = `${stableObjectJson(artifact)}\n`;
      const artifactFile = `${artifact.artifactId}.json`;
      const artifactPath = path.join(this.paths.websiteEvaluations, artifactFile);
      let artifactWritten = false;
      let ledgerWritten = false;
      try {
        const handle = await open(artifactPath, "wx", 0o600);
        try {
          await handle.write(source, null, "utf8");
          await handle.sync();
        } finally {
          await handle.close();
        }
        artifactWritten = true;
        const artifactSha256 = sha256Bytes(Buffer.from(source, "utf8"));
        const event = {
          event_type: "WEBSITE_EVALUATION_RECORDED",
          payload: {
            website_evaluation_id: artifact.artifactId,
            artifact_file: artifactFile,
            artifact_sha256: artifactSha256,
            website_outcome_id: artifact.websiteOutcomeId,
            product_outcome_id: artifact.productOutcomeId,
            episode_id: artifact.episodeId,
            image_sha256: artifact.imageSha256,
            image_byte_count: artifact.imageByteCount,
            request_sha256: artifact.requestSha256,
            raw_response_sha256: artifact.rawResponseSha256,
            canonical_response_hash: artifact.canonicalResponseHash,
            evaluator_identity: artifact.evaluatorIdentity,
            evaluation_authority_identity: artifact.evaluationAuthorityIdentity,
            authority_manifest_id: artifact.authorityManifestId,
            authority_manifest_sha256: artifact.authorityManifestSha256,
            evaluator_key_id: artifact.evaluatorKeyId,
            evaluator_nonce: artifact.evaluatorNonce,
            evaluator_sequence: artifact.evaluatorSequence,
            criteria_version: artifact.criteriaVersion,
            evaluation_bytes_sha256: artifact.evaluation.sha256,
            evaluation_hash: artifact.evaluation.evaluationReportHash,
            evaluation_disposition: artifact.evaluationDisposition,
            success_artifact_sha256: artifact.successArtifact?.sha256 || "",
            success_artifact_hash: artifact.successArtifact?.artifactHash || "",
            evaluated_at: artifact.evaluatedAt,
            provider_lifecycle_authority: false
          }
        };
        const [appended] = await appendBatch([event]);
        ledgerWritten = true;
        return Object.freeze({
          result: "WEBSITE_EVALUATION_RECORDED",
          idempotent: false,
          websiteEvaluationId: artifact.artifactId,
          artifactHash: artifactSha256,
          ledgerEventIdentity: appended.event_id,
          evaluationDisposition: artifact.evaluationDisposition,
          providerLifecycleAuthority: false
        });
      } catch (error) {
        if (artifactWritten && !ledgerWritten) await rm(artifactPath, { force: true });
        throw error;
      }
    });
  }

  async websiteEvaluation(episodeId, { evaluationBytes = null } = {}) {
    await this.initialize();
    const loaded = await this.#load();
    await this.#verifyWebsiteOutcomeArtifacts(loaded);
    await this.#verifyWebsiteEvaluationArtifacts(loaded);
    const event = loaded.state.websiteEvaluations.get(cleanString(episodeId, 160));
    if (!event) return null;
    const authenticated = await this.#authenticateWebsiteEvaluation(loaded, event);
    if (evaluationBytes !== null) {
      if (!Buffer.isBuffer(evaluationBytes) || sha256Bytes(evaluationBytes) !== authenticated.artifact.evaluation.sha256) {
        refuse("WEBSITE_EVALUATION_BYTES_MISMATCH");
      }
    }
    return Object.freeze({
      websiteEvaluationId: authenticated.artifact.artifactId,
      artifact: authenticated.artifact,
      evaluationBytes: authenticated.evaluationBytes,
      evaluation: authenticated.evaluation,
      successArtifactBytes: authenticated.successArtifactBytes,
      successArtifact: authenticated.successArtifact,
      ledgerEventIdentity: authenticated.ledgerEventIdentity,
      providerLifecycleAuthority: false
    });
  }

  async reconstructWebsiteCognition({
    episodeId,
    requestBytes = null,
    responseBytes = null,
    programmedCompetenceManifest = null
  } = {}) {
    const websiteOutcome = await this.websiteOutcome(episodeId, { requestBytes, responseBytes });
    if (!websiteOutcome) refuse("WEBSITE_OUTCOME_NOT_FOUND");
    const storedDisposition = websiteOutcome.artifact.cognitiveDisposition;
    if (websiteOutcome.artifact.terminalKind !== "SUCCESS") {
      return Object.freeze({
        result: "WEBSITE_FAILURE_COGNITION_RECONSTRUCTED",
        websiteOutcome,
        websiteEvaluation: null,
        cognitiveDisposition: storedDisposition,
        successInventory: null,
        mentorSuccessOrigination: null,
        mentorFailureObservation: null,
        mentorFailureOrigination: null,
        lessonCandidates: [],
        lessonGateReviews: [],
        candidateOriginated: false,
        qualificationAuthorized: false,
        promotionAuthorized: false,
        runtimeConsumptionAuthorized: false,
        productChangeAuthorized: false,
        providerLifecycleAuthority: false
      });
    }
    const websiteEvaluation = await this.websiteEvaluation(episodeId);
    if (!websiteEvaluation) {
      return Object.freeze({
        result: "WEBSITE_SUCCESS_COGNITION_RECONSTRUCTED",
        websiteOutcome,
        websiteEvaluation: null,
        cognitiveDisposition: storedDisposition,
        successInventory: null,
        mentorSuccessOrigination: null,
        mentorFailureObservation: null,
        mentorFailureOrigination: null,
        lessonCandidates: [],
        lessonGateReviews: [],
        candidateOriginated: false,
        qualificationAuthorized: false,
        promotionAuthorized: false,
        runtimeConsumptionAuthorized: false,
        productChangeAuthorized: false,
        providerLifecycleAuthority: false
      });
    }
    if (websiteEvaluation.artifact.evaluationDisposition === "FAILURE") {
      const mentorFailureObservation = authenticatedWebsiteEvaluationFailureObservation({
        learningScopeIdentity: this.learningScopeIdentity,
        websiteOutcome,
        websiteEvaluation
      });
      const mentorFailureOrigination = originateMentorDiagnosisCandidates({
        episodeObservations: [mentorFailureObservation]
      });
      const disposition = mentorFailureOrigination.diagnoses.length > 0
        ? "INTERNAL_CAUSAL_DIAGNOSIS"
        : mentorFailureOrigination.nonDiagnosticDispositions
          .find((item) => item.observationHash === mentorFailureObservation.observationHash)?.disposition
          || "INSUFFICIENT_CAUSAL_SUPPORT";
      return Object.freeze({
        result: "WEBSITE_EVALUATED_FAILURE_COGNITION_RECONSTRUCTED",
        websiteOutcome,
        websiteEvaluation,
        cognitiveDisposition: Object.freeze({
          ...storedDisposition,
          boundary: "MENTOR_FAILURE",
          result: disposition,
          candidatePresent: false
        }),
        successInventory: null,
        mentorSuccessOrigination: null,
        mentorFailureObservation,
        mentorFailureOrigination,
        lessonCandidates: [],
        lessonGateReviews: [],
        candidateOriginated: false,
        qualificationAuthorized: false,
        promotionAuthorized: false,
        runtimeConsumptionAuthorized: false,
        productChangeAuthorized: false,
        providerLifecycleAuthority: false
      });
    }
    if (websiteEvaluation.successArtifact === null) {
      return Object.freeze({
        result: "WEBSITE_SUCCESS_COGNITION_RECONSTRUCTED",
        websiteOutcome,
        websiteEvaluation,
        cognitiveDisposition: Object.freeze({
          ...storedDisposition,
          boundary: "INDEPENDENT_PRODUCT_QUALITY_EVALUATION",
          result: "AUTHENTICATED_SUCCESS_NO_CAUSAL_LEARNING_EVIDENCE",
          candidatePresent: false
        }),
        successInventory: null,
        mentorSuccessOrigination: null,
        mentorFailureObservation: null,
        mentorFailureOrigination: null,
        lessonCandidates: [],
        lessonGateReviews: [],
        candidateOriginated: false,
        qualificationAuthorized: false,
        promotionAuthorized: false,
        runtimeConsumptionAuthorized: false,
        productChangeAuthorized: false,
        providerLifecycleAuthority: false
      });
    }
    if (!programmedCompetenceManifest) refuse("WEBSITE_SUCCESS_PROGRAMMED_MANIFEST_REQUIRED");
    const successInventory = await this.inventoryAuthenticatedProductSuccesses({
      frozenSuccessArtifacts: [websiteEvaluation.successArtifact]
    });
    const mentorSuccessOrigination = await this.originateMentorSuccessFromInventory({
      inventory: successInventory,
      programmedCompetenceManifest
    });
    const outcomeId = websiteOutcome.artifact.productOutcomeId;
    const observation = successInventory.authenticatedSuccessObservations
      .find((item) => item.outcomeIdentity === outcomeId);
    const matchingExplanations = mentorSuccessOrigination.explanations.filter((item) => (
      item.supportingSuccessObservations.some((support) => support.sourceRecordHash === outcomeId)
    ));
    const lessonCandidates = matchingExplanations.map((explanation) => (
      buildInertLessonCandidateFromMentorSuccess(explanation)
    ));
    const lessonGateReviews = lessonCandidates.map((candidate) => reviewLessonCandidate(candidate));
    const disposition = observation
      ? mentorSuccessOrigination.nonCandidateDispositions
        .find((item) => item.successObservationId === observation.successObservationId)?.disposition
        || (matchingExplanations.length > 0 ? "NOVEL_SUCCESS_BEHAVIOR_SUPPORTED" : storedDisposition.result)
      : storedDisposition.result;
    return Object.freeze({
      result: "WEBSITE_SUCCESS_COGNITION_RECONSTRUCTED",
      websiteOutcome,
      websiteEvaluation,
      cognitiveDisposition: Object.freeze({
        ...storedDisposition,
        result: disposition,
        candidateId: lessonCandidates[0]?.candidateId || "",
        candidatePresent: lessonCandidates.length > 0
      }),
      successInventory,
      mentorSuccessOrigination,
      mentorFailureObservation: null,
      mentorFailureOrigination: null,
      lessonCandidates,
      lessonGateReviews,
      candidateOriginated: lessonCandidates.length > 0,
      qualificationAuthorized: false,
      promotionAuthorized: false,
      runtimeConsumptionAuthorized: false,
      productChangeAuthorized: false,
      providerLifecycleAuthority: false
    });
  }

  async #authenticatedIdentityCandidateContext(request = {}) {
    exactObject(request, MENTOR_IDENTITY_GATE_BINDING_FIELDS);
    const expected = {
      candidateId: sha256Identity(request.candidateId, "lesson gate candidate event"),
      failureId: sha256Identity(request.failureId, "lesson gate failure"),
      diagnosisId: sha256Identity(request.diagnosisId, "lesson gate diagnosis"),
      memoryId: cleanString(request.memoryId, 160),
      memoryContentHash: sha256Identity(request.memoryContentHash, "lesson gate candidate memory"),
      mentorDecisionIdentity: sha256Identity(request.mentorDecisionIdentity, "lesson gate mentor decision")
    };
    await this.initialize();
    const loaded = await this.#load();
    const candidateEvent = loaded.state.candidates.get(expected.candidateId);
    if (!candidateEvent) refuse("LESSON_GATE_CANDIDATE_NOT_FOUND");
    const failureEvent = loaded.events.find((event) => (
      event.event_type === "FAILURE_RECORDED"
      && event.payload.failure_id === candidateEvent.failure_id
    ));
    const diagnosisEvent = loaded.events.find((event) => (
      event.event_type === "MENTOR_DIAGNOSIS_RECORDED"
      && event.payload.diagnosis_id === candidateEvent.diagnosis_id
    ));
    const candidateLedgerEvent = loaded.events.find((event) => (
      event.event_type === "LESSON_CANDIDATE_RECORDED"
      && event.payload.candidate_id === candidateEvent.candidate_id
    ));
    if (!failureEvent || !diagnosisEvent || !candidateLedgerEvent) {
      refuse("LESSON_GATE_CANDIDATE_LEDGER_BINDING_MISSING");
    }
    const candidateMemory = (await this.memoryStore.list())
      .find((record) => record.memoryId === candidateEvent.memory_id);
    if (!candidateMemory) refuse("LESSON_GATE_CANDIDATE_MEMORY_MISSING");
    validateMemoryRecord(candidateMemory);
    const actual = {
      candidateId: candidateEvent.candidate_id,
      failureId: candidateEvent.failure_id,
      diagnosisId: candidateEvent.diagnosis_id,
      memoryId: candidateEvent.memory_id,
      memoryContentHash: candidateEvent.memory_hash,
      mentorDecisionIdentity: diagnosisEvent.payload.mentor_decision_identity
    };
    for (const field of MENTOR_IDENTITY_GATE_BINDING_FIELDS) {
      if (actual[field] !== expected[field]) refuse("LESSON_GATE_CANDIDATE_BINDING_MISMATCH", field);
    }
    if (
      failureEvent.payload.failure_id !== candidateEvent.failure_id
      || diagnosisEvent.payload.failure_id !== candidateEvent.failure_id
      || candidateMemory.contentHash !== candidateEvent.memory_hash
      || candidateMemory.mentorDecisionIdentity !== diagnosisEvent.payload.mentor_decision_identity
      || candidateMemory.memoryType !== "GENERALIZED_LESSON_CANDIDATE"
      || candidateMemory.status !== "CANDIDATE"
    ) refuse("LESSON_GATE_CANDIDATE_BINDING_INVALID");
    const feedbackId = candidateMemory.feedbackBinding?.feedbackId || "";
    const feedbackEvent = loaded.events.find((event) => (
      event.event_type === "PRODUCT_FEEDBACK_ACCEPTED"
      && event.payload.feedback_id === feedbackId
    ));
    const feedback = loaded.state.feedback.get(feedbackId);
    const outcome = feedback
      ? loaded.state.outcomes.get(feedback.bound_episode_id)
      : null;
    if (
      !feedback
      || !feedbackEvent
      || !outcome
      || feedback.provider_authored !== false
      || feedback.response_hash !== outcome.response_hash
      || feedback.original_evidence_identity !== outcome.original_evidence_identity
      || candidateMemory.feedbackBinding.boundEpisodeId !== feedback.bound_episode_id
      || candidateMemory.feedbackBinding.responseHash !== feedback.response_hash
      || candidateMemory.feedbackBinding.originalEvidenceIdentity !== feedback.original_evidence_identity
      || candidateMemory.observedFailurePattern !== feedback.failed_claim.failureKind
    ) refuse("LESSON_GATE_FEEDBACK_BINDING_INVALID");
    if (
      classifyProductFeedbackDomain(feedback) !== "VISIBLE_OBJECT_CLASS_IDENTIFICATION"
      || diagnosisEvent.payload.selected_action_id !== "EVALUATE_RETURNED_EVIDENCE"
      || candidateMemory.recommendedActionPattern !== "EVALUATE_RETURNED_EVIDENCE"
    ) refuse("LESSON_GATE_FEEDBACK_DOMAIN_UNSUPPORTED");
    return Object.freeze({
      candidateEvent,
      failureEvent,
      diagnosisEvent,
      candidateLedgerEvent,
      candidateMemory,
      feedbackEvent,
      feedback,
      outcome
    });
  }

  async reconstructLessonGateCandidate(request = {}) {
    const context = await this.#authenticatedIdentityCandidateContext(request);
    const observation = authenticatedIdentityObservation({
      learningScopeIdentity: this.learningScopeIdentity,
      outcome: context.outcome,
      feedback: context.feedback,
      failureId: context.candidateEvent.failure_id,
      diagnosisId: context.candidateEvent.diagnosis_id,
      candidateId: context.candidateEvent.candidate_id,
      candidateMemory: context.candidateMemory
    });
    const diagnosis = mentorIdentityGateDiagnosis({
      learningScopeIdentity: this.learningScopeIdentity,
      observation,
      ...context
    });
    return buildInertLessonCandidateFromMentorDiagnosis(diagnosis);
  }

  async adjudicateMentorIdentityCausality(request = {}) {
    exactObject(request, MENTOR_IDENTITY_CAUSAL_ADJUDICATION_FIELDS);
    const binding = Object.fromEntries(MENTOR_IDENTITY_GATE_BINDING_FIELDS.map((field) => [field, request[field]]));
    const context = await this.#authenticatedIdentityCandidateContext(binding);
    const authenticated = authenticatedIdentityCausalObservation({
      learningScopeIdentity: this.learningScopeIdentity,
      ...context,
      evaluationArtifactSource: request.evaluationArtifactSource,
      productResponseArtifactSource: request.productResponseArtifactSource
    });
    const mentorReport = originateMentorDiagnosisCandidates({
      episodeObservations: [authenticated.observation]
    });
    const diagnosticDisposition = mentorReport.diagnoses.length > 0
      ? "INTERNAL_AND_LEARNABLE"
      : mentorReport.nonDiagnosticDispositions[0]?.disposition || "INSUFFICIENT_CAUSAL_SUPPORT";
    const terminalDisposition = diagnosticDisposition === "INTERNAL_AND_LEARNABLE"
      ? "INTERNAL_AND_LEARNABLE"
      : ["EXTERNAL_CAUSAL_INSUFFICIENCY", "PROVIDER_OR_TRANSPORT_FAILURE"].includes(diagnosticDisposition)
        ? "EXTERNAL_CAUSAL_ATTRIBUTION"
        : diagnosticDisposition === "CONTRADICTORY_EPISODE_EVIDENCE"
          ? "CONTRADICTORY_CAUSAL_ATTRIBUTION"
          : "CAUSAL_ATTRIBUTION_INSUFFICIENT";
    const record = {
      schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
      recordType: "AUTHENTICATED_MENTOR_IDENTITY_CAUSAL_ADJUDICATION",
      candidateBinding: Object.freeze({
        candidateId: context.candidateEvent.candidate_id,
        failureId: context.failureEvent.payload.failure_id,
        diagnosisId: context.diagnosisEvent.payload.diagnosis_id,
        memoryId: context.candidateMemory.memoryId,
        memoryContentHash: context.candidateMemory.contentHash,
        mentorDecisionIdentity: context.diagnosisEvent.payload.mentor_decision_identity
      }),
      artifactBinding: Object.freeze({
        evaluationArtifactSha256: authenticated.evaluationArtifactSha256,
        productResponseArtifactSha256: authenticated.productResponseArtifactSha256,
        outcomeResponseHash: context.outcome.response_hash,
        evaluationProvenanceIdentity: context.feedback.correction.evidenceProvenance.sourceIdentity
      }),
      observation: authenticated.observation,
      mentorReport,
      mentorDisposition: diagnosticDisposition,
      terminalDisposition,
      candidateOriginated: mentorReport.diagnoses.length > 0,
      persistenceAuthorized: false,
      qualificationAuthorized: false,
      promotionAuthorized: false,
      runtimeConsumptionAuthorized: false,
      productChangeAuthorized: false,
      providerLifecycleAuthority: false,
      adjudicationHash: ""
    };
    record.adjudicationHash = sha256Object(record);
    return Object.freeze(record);
  }

  async inventoryAuthenticatedProductSuccesses({ frozenSuccessArtifacts = [] } = {}) {
    if (!Array.isArray(frozenSuccessArtifacts) || frozenSuccessArtifacts.length > 256) {
      refuse("PRODUCT_SUCCESS_INVENTORY_CARDINALITY");
    }
    let loaded;
    try {
      loaded = await this.#load();
    } catch (error) {
      if (error?.code === "ENOENT") {
        const inventory = successHashRecord({
          schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
          recordType: "AUTHENTICATED_PRODUCT_SUCCESS_INVENTORY",
          inspectedArtifactCount: 0,
          authenticatedSuccessCount: 0,
          rejectedArtifactCount: 0,
          authenticatedSuccessObservations: [],
          rejectedArtifacts: [],
          sourceState: "NO_EXISTING_GOVERNED_LEARNING_LEDGER",
          boundedReadOnlyInventory: true,
          persistenceAuthorized: false,
          qualificationAuthorized: false,
          promotionAuthorized: false,
          providerLifecycleAuthority: false,
          networkAuthority: false
        }, "inventoryHash");
        authenticatedSuccessInventoryAuthorities.add(inventory);
        return inventory;
      }
      throw error;
    }
    const outcomeEvents = new Map(loaded.events
      .filter((event) => event.event_type === "PRODUCT_OUTCOME_RECORDED")
      .map((event) => [event.payload.outcome_id, event]));
    const accepted = [];
    const rejected = [];
    const seenArtifactHashes = new Set();
    const ordered = [...frozenSuccessArtifacts].sort((left, right) => (
      String(left?.artifactHash || sha256Object(left || {}))
        .localeCompare(String(right?.artifactHash || sha256Object(right || {})))
    ));
    for (const artifact of ordered) {
      const reference = {
        artifactHash: /^[a-f0-9]{64}$/.test(String(artifact?.artifactHash || ""))
          ? artifact.artifactHash
          : sha256Object(artifact || {}),
        episodeId: String(artifact?.episodeId || ""),
        outcomeId: String(artifact?.outcomeId || "")
      };
      if (seenArtifactHashes.has(reference.artifactHash)) {
        rejected.push({ ...reference, reasons: ["ARTIFACT_REPLAY"] });
        continue;
      }
      seenArtifactHashes.add(reference.artifactHash);
      try {
        const observation = authenticateStoredProductSuccess({
          artifact,
          outcomeEvent: outcomeEvents.get(artifact?.outcomeId),
          learningScopeIdentity: this.learningScopeIdentity
        });
        accepted.push(observation);
      } catch (error) {
        rejected.push({
          ...reference,
          reasons: [cleanString(
            error?.code === "ERR_ASSERTION"
              ? error?.message
              : error?.code || "PRODUCT_SUCCESS_ARTIFACT_REJECTED",
            160
          )]
        });
      }
    }
    const inventory = successHashRecord({
      schemaVersion: GOVERNED_LEARNING_SCHEMA_VERSION,
      recordType: "AUTHENTICATED_PRODUCT_SUCCESS_INVENTORY",
      inspectedArtifactCount: ordered.length,
      authenticatedSuccessCount: accepted.length,
      rejectedArtifactCount: rejected.length,
      authenticatedSuccessObservations: accepted,
      rejectedArtifacts: rejected,
      sourceState: "EXISTING_HMAC_AUTHENTICATED_GOVERNED_LEARNING_LEDGER",
      ledgerHead: loaded.ledgerHead,
      boundedReadOnlyInventory: true,
      persistenceAuthorized: false,
      qualificationAuthorized: false,
      promotionAuthorized: false,
      providerLifecycleAuthority: false,
      networkAuthority: false
    }, "inventoryHash");
    authenticatedSuccessInventoryAuthorities.add(inventory);
    return inventory;
  }

  async originateMentorSuccessFromInventory({ inventory, programmedCompetenceManifest } = {}) {
    if (!inventory || !authenticatedSuccessInventoryAuthorities.has(inventory)
      || inventory.inventoryHash !== sha256Object({ ...inventory, inventoryHash: "" })) {
      refuse("PRODUCT_SUCCESS_INVENTORY_TAMPERED");
    }
    if (inventory.recordType !== "AUTHENTICATED_PRODUCT_SUCCESS_INVENTORY"
      || inventory.boundedReadOnlyInventory !== true) {
      refuse("PRODUCT_SUCCESS_INVENTORY_INVALID");
    }
    return originateMentorSuccessExplanations({
      successObservations: inventory.authenticatedSuccessObservations,
      programmedCompetenceManifest
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
    episodeSequence,
    createdAt
  } = {}) {
    assertRuntimeAuthority(governor, runtime);
    canonicalIso(createdAt);
    score(minimumMeanImprovement, "minimumMeanImprovement");
    score(minimumApplicationImprovement, "minimumApplicationImprovement");
    const visible = new Set(cleanStrings(visibleEvidenceIds, { maximumItems: 512, maximumCharacters: 240 }));
    return this.#write(async ({ secret, state }, appendBatch) => {
      const candidateEvent = state.candidates.get(candidateId);
      if (!candidateEvent || state.candidateRejections.has(candidateId)) refuse("CANDIDATE_NOT_FOUND");
      if (episodeSequence <= state.lastEpisodeSequence) refuse("FORWARD_ONLY_EPISODE_REQUIRED");
      if ([...state.qualifications.values()].some((item) => item.candidate_id === candidateId)) {
        refuse("CANDIDATE_ALREADY_QUALIFIED");
      }
      const metrics = trialMetrics(trials, {
        candidateId,
        candidateMemoryId: candidateEvent.memory_id,
        outcomes: state.outcomes,
        trialAuthorizations: state.trialAuthorizations
      });
      if (!metrics.trials.flatMap((trial) => trial.evidenceRefs).every((identity) => visible.has(identity))) {
        refuse("QUALIFICATION_EVIDENCE_NOT_VISIBLE");
      }
      const reasons = qualificationReasons(metrics, minimumMeanImprovement);
      const body = {
        candidate_id: candidateId,
        episode_sequence: episodeSequence,
        trials: metrics.trials,
        trial_commitment: sha256Object(metrics.trials),
        causal_trial_results: metrics.causalTrialResults,
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
      const entries = [{
        event_type: "QUALIFICATION_DECIDED",
        payload: { qualification_id: qualificationId, ...body }
      }];
      let rejection = null;
      if (body.verdict === "FAIL") {
        const candidate = (await this.memoryStore.list())
          .find((record) => record.memoryId === candidateEvent.memory_id);
        if (!candidate || candidate.status !== "CANDIDATE") refuse("CANDIDATE_MEMORY_NOT_FOUND");
        const rejectionEvidence = cleanStrings([
          ...candidate.evidenceReferences,
          ...metrics.trials.flatMap((trial) => trial.evidenceRefs)
        ], { maximumItems: 512, maximumCharacters: 240 });
        const rejectionCore = {
          ...candidate,
          memoryType: "LESSON_SUPERSESSION",
          memoryId: `ke-candidate-rejection-${hmac(secret, "KATHERINES_EYE_CANDIDATE_REJECTION_V1", {
            candidateId,
            qualificationId
          }).slice(0, 32)}`,
          sourceEpisodeIds: [...candidate.sourceEpisodeIds, runtime.memory.currentEpisodeId],
          sourceEpisodeSequence: episodeSequence,
          evidenceReferences: rejectionEvidence,
          evidenceAggregateHash: sha256Object(rejectionEvidence),
          status: "REVOKED",
          predecessorMemoryIds: [candidate.memoryId],
          mentorDecisionIdentity: runtime.mentorDecisionIdentity,
          createdAt
        };
        delete rejectionCore.contentHash;
        rejection = sealMemoryRecord(rejectionCore);
        entries.push({
          event_type: "LESSON_CANDIDATE_REJECTED",
          payload: {
            candidate_id: candidateId,
            candidate_memory_id: candidate.memoryId,
            qualification_id: qualificationId,
            rejection_memory_id: rejection.memoryId,
            rejection_memory_hash: rejection.contentHash,
            status: "REVOKED",
            reasons
          }
        });
      }
      await appendBatch(entries, { memoryRecords: rejection ? [rejection] : [] });
      return {
        qualificationId,
        ...body,
        rejectedCandidateMemoryId: rejection?.memoryId || null,
        rejectedCandidateStatus: rejection?.status || null
      };
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
      const promotionEvidenceReferences = cleanStrings([
        ...candidate.evidenceReferences,
        ...qualification.trials.flatMap((trial) => trial.evidenceRefs)
      ], { maximumItems: 512, maximumCharacters: 240 });
      const lessonCore = {
        ...candidate,
        memoryType: "RECURRENCE_PATTERN",
        memoryId: `ke-governed-lesson-${hmac(secret, "KATHERINES_EYE_PROMOTED_LESSON_V1", {
          qualificationId,
          candidateMemoryId: candidate.memoryId
        }).slice(0, 32)}`,
        sourceEpisodeIds: [...candidate.sourceEpisodeIds, cleanString(episodeId, 160)],
        sourceEpisodeSequence: episodeSequence,
        evidenceReferences: promotionEvidenceReferences,
        evidenceAggregateHash: sha256Object(promotionEvidenceReferences),
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
      await appendBatch([{ event_type: "LESSON_PROMOTED", payload: body }], { memoryRecords: [lesson] });
      return { result: "LESSON_PROMOTED", lessonId: lesson.memoryId, ...body };
    });
  }

  async recordApplication({
    governor,
    runtime,
    lessonId,
    caseId,
    episodeId,
    beforeEpisodeId,
    afterEpisodeId,
    beforeResponseHash,
    afterResponseHash,
    causalAttribution,
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
    const attribution = canonicalTrialCausalAttribution(causalAttribution);
    if (!evidence.every((identity) => visible.has(identity))) refuse("APPLICATION_EVIDENCE_NOT_VISIBLE");
    return this.#write(async ({ secret, state }, appendBatch) => {
      const lesson = state.lessons.get(lessonId);
      if (!lesson || lesson.status !== "VALIDATED_BY_TRANSFER" || state.rollbacks.has(lessonId)) {
        refuse("LESSON_NOT_APPLICABLE");
      }
      const authoritativeTransition = assertAuthoritativeMemoryTransition(runtime.authoritativeMemoryTransition);
      if (!authoritativeTransition.appliedLessonIds.includes(lessonId)) {
        refuse("AUTHORITATIVE_MEMORY_APPLICATION_REQUIRED");
      }
      const normalizedBeforeEpisodeId = cleanString(beforeEpisodeId, 160);
      const normalizedAfterEpisodeId = cleanString(afterEpisodeId, 160);
      const normalizedBeforeResponseHash = sha256Identity(beforeResponseHash, "application before response");
      const normalizedAfterResponseHash = sha256Identity(afterResponseHash, "application after response");
      if (
        cleanString(episodeId, 160) !== normalizedAfterEpisodeId
        || !authorizedLessonApplicationCausalChain({
          lessonId,
          beforeOutcome: state.outcomes.get(normalizedBeforeEpisodeId),
          afterOutcome: state.outcomes.get(normalizedAfterEpisodeId),
          beforeResponseHash: normalizedBeforeResponseHash,
          afterResponseHash: normalizedAfterResponseHash,
          attribution,
          evidenceReferences: evidence,
          memoryTransitionHash: authoritativeTransition.memoryTransitionHash
        })
      ) refuse("APPLICATION_CAUSAL_ATTRIBUTION_REQUIRED");
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
        before_episode_id: normalizedBeforeEpisodeId,
        after_episode_id: normalizedAfterEpisodeId,
        before_response_hash: normalizedBeforeResponseHash,
        after_response_hash: normalizedAfterResponseHash,
        episode_sequence: episodeSequence,
        before_score: beforeScore,
        after_score: afterScore,
        before_violations: beforeViolations,
        after_violations: afterViolations,
        improvement,
        violation_delta: violationDelta,
        verdict,
        evidence_references: evidence,
        memory_transition_hash: authoritativeTransition.memoryTransitionHash,
        causal_attribution: attribution,
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
        const rollbackEvidenceReferences = cleanStrings(
          [...currentMemory.evidenceReferences, ...evidence],
          { maximumItems: 512, maximumCharacters: 240 }
        );
        const rollbackCore = {
          ...currentMemory,
          memoryType: "LESSON_SUPERSESSION",
          memoryId: `ke-lesson-rollback-${hmac(secret, "KATHERINES_EYE_LESSON_ROLLBACK_V1", {
            lessonId,
            applicationId
          }).slice(0, 32)}`,
          sourceEpisodeIds: [...currentMemory.sourceEpisodeIds, body.episode_id],
          sourceEpisodeSequence: episodeSequence,
          evidenceReferences: rollbackEvidenceReferences,
          evidenceAggregateHash: sha256Object(rollbackEvidenceReferences),
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
      await appendBatch(entries, { memoryRecords: rollback ? [rollback] : [] });
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

  async recordSccStartupReceipt({ governor, runtime, receipt } = {}) {
    assertRuntimeAuthority(governor, runtime);
    return this.#write(async ({ secret, state }, appendBatch) => {
      const body = canonicalSccStartupReceipt(receipt, { requireReceiptId: false });
      const receiptId = hmac(secret, "KATHERINES_EYE_SCC_STARTUP_RECEIPT_V1", body);
      const existing = state.sccStartups.get(receiptId);
      if (existing) return existing;
      const payload = Object.freeze({ receiptId, ...body });
      await appendBatch([{ event_type: "SCC_RUNTIME_STARTED", payload }]);
      return payload;
    });
  }

  async recordSccJobReceipt({ governor, runtime, receipt } = {}) {
    assertRuntimeAuthority(governor, runtime);
    return this.#write(async ({ secret, state }, appendBatch) => {
      const body = canonicalSccJobReceipt(receipt, { requireReceiptId: false });
      if (!state.sccStartups.has(body.startupReceiptId)) refuse("SCC_STARTUP_RECEIPT_REQUIRED");
      const receiptId = hmac(secret, "KATHERINES_EYE_SCC_JOB_RECEIPT_V1", body);
      const existing = state.sccJobs.get(receiptId);
      if (existing) return existing;
      const payload = Object.freeze({ receiptId, ...body });
      await appendBatch([{ event_type: "SCC_JOB_COMPLETED", payload }]);
      return payload;
    });
  }

  async reconstructSccReceipts() {
    await this.initialize();
    const loaded = await this.#load();
    return Object.freeze({
      result: "KATHERINES_EYE_SCC_RECEIPTS_RECONSTRUCTED",
      startupReceipts: Object.freeze([...loaded.state.sccStartups.values()]),
      jobReceipts: Object.freeze([...loaded.state.sccJobs.values()]),
      ledgerHead: loaded.ledgerHead,
      providerLifecycleAuthority: false
    });
  }

  async inspectSccReceiptsReadOnly() {
    const loaded = await this.#load();
    return Object.freeze({
      result: "KATHERINES_EYE_SCC_RECEIPTS_AUTHENTICATED_READ_ONLY",
      startupReceipts: Object.freeze([...loaded.state.sccStartups.values()]),
      jobReceipts: Object.freeze([...loaded.state.sccJobs.values()]),
      ledgerHead: loaded.ledgerHead,
      providerLifecycleAuthority: false,
      ledgerWriteCapability: false
    });
  }

  async governedMemoryIdentity() {
    await this.initialize();
    const loaded = await this.#load();
    const records = await this.memoryStore.list();
    for (const record of records) validateMemoryRecord(record);
    const boundHashes = new Set([
      ...[...loaded.state.candidates.values()].map((item) => item.memory_hash),
      ...[...loaded.state.candidateRejections.values()].map((item) => item.rejection_memory_hash),
      ...[...loaded.state.lessons.values()].map((item) => item.lesson_hash),
      ...[...loaded.state.rollbacks.values()].map((item) => item.rollback_memory_hash)
    ]);
    const applicableLessonIds = [...loaded.state.lessons.values()]
      .filter((item) => item.status === "VALIDATED_BY_TRANSFER" && !loaded.state.rollbacks.has(item.lesson_id))
      .map((item) => item.lesson_id).sort();
    const ineligibleUnmatchedRecordIds = records
      .filter((record) => !boundHashes.has(record.contentHash))
      .map((record) => record.memoryId).sort();
    return Object.freeze({
      result: "KATHERINES_EYE_GOVERNED_MEMORY_IDENTITY",
      memoryRootSha256: sha256Object({
        learningScopeIdentity: this.learningScopeIdentity,
        ledgerHead: loaded.ledgerHead,
        applicableLessonIds,
        ineligibleUnmatchedRecordIds
      }),
      applicableLessonIds: Object.freeze(applicableLessonIds),
      ineligibleUnmatchedRecordIds: Object.freeze(ineligibleUnmatchedRecordIds),
      emptyEligibleSetPermitsBaselineOperation: true,
      providerLifecycleAuthority: false
    });
  }

  async verify() {
    try {
      const loaded = await this.#load();
      const records = await this.memoryStore.list();
      for (const record of records) validateMemoryRecord(record);
      const boundHashes = new Set([
        ...[...loaded.state.candidates.values()].map((item) => item.memory_hash),
        ...[...loaded.state.candidateRejections.values()].map((item) => item.rejection_memory_hash),
        ...[...loaded.state.lessons.values()].map((item) => item.lesson_hash),
        ...[...loaded.state.rollbacks.values()].map((item) => item.rollback_memory_hash)
      ]);
      if ([...boundHashes].some((hash) => !records.some((record) => record.contentHash === hash))) {
        refuse("EXECUTIVE_MEMORY_LEDGER_BINDING_MISSING");
      }
      await this.#verifyWebsiteOutcomeArtifacts(loaded);
      await this.#verifyWebsiteEvaluationArtifacts(loaded);
      return {
        result: "VALID",
        eventCount: loaded.events.length,
        ledgerHead: loaded.ledgerHead,
        memoryRecordCount: records.length,
        websiteOutcomeCount: loaded.state.websiteOutcomes.size,
        websiteEvaluationCount: loaded.state.websiteEvaluations.size,
        sccStartupReceiptCount: loaded.state.sccStartups.size,
        sccJobReceiptCount: loaded.state.sccJobs.size,
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
          websiteOutcomeCount: 0,
          websiteEvaluationCount: 0,
          sccStartupReceiptCount: 0,
          sccJobReceiptCount: 0,
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
    await this.#verifyWebsiteOutcomeArtifacts(loaded);
    await this.#verifyWebsiteEvaluationArtifacts(loaded);
    return {
      result: "GOVERNED_LEARNING_STATUS",
      productOutcomes: loaded.state.outcomes.size,
      websiteOutcomes: loaded.state.websiteOutcomes.size,
      websiteEvaluations: loaded.state.websiteEvaluations.size,
      acceptedFeedback: loaded.state.feedback.size,
      failures: loaded.state.failures.size,
      candidates: loaded.state.candidates.size,
      rejectedCandidates: loaded.state.candidateRejections.size,
      authorizedQualificationTrials: loaded.state.trialAuthorizations.size,
      qualifications: loaded.state.qualifications.size,
      promotedLessons: [...loaded.state.lessons.values()].filter((item) => item.status === "VALIDATED_BY_TRANSFER").length,
      rolledBackLessons: loaded.state.rollbacks.size,
      rollbackRefusals: loaded.state.rollbackRefusals.size,
      retainedLessons: loaded.state.retentions.size,
      applications: loaded.state.applications.size,
      sccStartupReceipts: loaded.state.sccStartups.size,
      sccJobReceipts: loaded.state.sccJobs.size,
      lastEpisodeSequence: loaded.state.lastEpisodeSequence,
      ledgerHead: loaded.ledgerHead,
      providerLifecycleAuthority: false
    };
  }
}
