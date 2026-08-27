import { createHmac, randomBytes } from "node:crypto";
import { mkdir, open, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  ExecutiveMemoryStore,
  sealMemoryRecord,
  validateMemoryRecord
} from "../../qualification/synthetic-executive/scripts/memory-store.mjs";
import { sha256Object, stableObjectJson } from "../object-intelligence/stable.js";
import {
  originateMentorSuccessExplanations,
  validateAuthenticatedProductSuccessObservation
} from "../cognitive-governor/mentor-success-origination.js";

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
  const signature = `${feedback?.failedClaim?.claimClass || ""} ${feedback?.failedClaim?.failureKind || ""}`;
  if (/(?:research|query|search|comparable|price|pricing|value|valuation|provenance|evidence)/i.test(signature)) {
    return "COMPARABLE_RESEARCH_STRATEGY";
  }
  if (/(?:identity|identification|object[ _-]?class|visual[ _-]?subject|visible[ _-]?object)/i.test(signature)) {
    return "VISIBLE_OBJECT_CLASS_IDENTIFICATION";
  }
  return "";
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
    "closeComparableCount", "categoryComparableCount", "strategyDiscardedCandidateCount",
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
  } else if (retainedComparableCount > 0 && features.groundedPlan) {
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

function deriveState(events) {
  const state = {
    outcomes: new Map(),
    feedback: new Map(),
    failures: new Map(),
    candidates: new Map(),
    candidateRejections: new Map(),
    trialAuthorizations: new Map(),
    qualifications: new Map(),
    lessons: new Map(),
    applications: new Map(),
    rollbacks: new Map(),
    rollbackRefusals: new Map(),
    retentions: new Map(),
    lastEpisodeSequence: 0
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
        if (!state.failures.has(payload.failure_id)) refuse("DIAGNOSIS_FAILURE_REFERENCE");
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
    const visible = new Set(cleanStrings(visibleEvidenceIds));
    const evidenceReferences = cleanStrings([
      cognitiveEpisode?.cognitiveEpisodeHash,
      cognitiveEpisode?.linkedExperienceRecordHash,
      lessonCandidate?.lessonCandidateHash,
      feedbackEnvelope?.feedbackId,
      feedbackEnvelope?.responseHash,
      feedbackEnvelope?.originalEvidenceIdentity,
      feedbackEnvelope?.memoryTransitionHash
    ].filter(Boolean));
    if (!evidenceReferences.every((identity) => visible.has(identity))) refuse("LEARNING_EVIDENCE_NOT_VISIBLE");
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
        evidence_references: cleanStrings(mentorEvidenceReferences)
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
      ]);
      await this.memoryStore.append(memoryRecord, { allowIdenticalReplay: false });
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
      await appendBatch(entries);
      if (rejection) await this.memoryStore.append(rejection);
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
        ...[...loaded.state.candidateRejections.values()].map((item) => item.rejection_memory_hash),
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
      productOutcomes: loaded.state.outcomes.size,
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
      lastEpisodeSequence: loaded.state.lastEpisodeSequence,
      ledgerHead: loaded.ledgerHead,
      providerLifecycleAuthority: false
    };
  }
}
