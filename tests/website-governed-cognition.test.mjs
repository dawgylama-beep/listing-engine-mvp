import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

import {
  createGenerateListingHandler,
  resolveWebsiteCognitionConfiguration
} from "../api/generate-listing.js";
import {
  GovernedLearningAdapter,
  sealIndependentProductSuccessEvaluation,
  sealStoredProductSuccessArtifact
} from "../lib/cognitive-learning/adapter.js";
import { createProgrammedCompetenceManifest } from "../lib/cognitive-governor/mentor-success-origination.js";
import { sha256Object } from "../lib/object-intelligence/index.js";
import { retailRecoveryFixture } from "./fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const execFile = promisify(execFileCallback);
const learningScopeIdentity = "website-cognition-integration-scope";
const fixedPhoto = {
  name: "authenticated-local-fixture.jpg",
  dataUrl: `data:image/jpeg;base64,${Buffer.alloc(220000, 0x5a).toString("base64")}`
};

function responseCapture() {
  return {
    statusCode: 200,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; }
  };
}

async function invoke(handler, body) {
  const response = responseCapture();
  await handler({ method: "POST", body }, response);
  return response;
}

function websiteRequest(analysisId, overrides = {}) {
  return {
    analysisId,
    reportType: "marketValue",
    platform: "",
    notes: "041226087161",
    photos: [fixedPhoto],
    buyerIntake: retailRecoveryFixture.buyerIntake,
    ...overrides
  };
}

function offlineWebsiteHandler(adapter, {
  websiteMode = "LOCAL_BETA",
  failPurposeResponse = false,
  failFinalEvidence = false
} = {}) {
  const calls = [];
  let clock = Date.parse(retailRecoveryFixture.fixedNow);
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "offline-placeholder",
    getOpenAIModel: () => "ordinary-version-1.12.52-model",
    getVisualIdentityModel: () => "gpt-5.6-luna",
    getSerperApiKey: () => "offline-placeholder",
    getGovernedLearningAdapter: () => adapter,
    getWebsiteCognitionMode: () => websiteMode,
    nowMilliseconds: () => (clock += 5),
    nowIso: () => new Date(clock).toISOString(),
    onFinalEvidenceResult: () => {
      if (failFinalEvidence) {
        throw Object.assign(new Error("Offline final-evidence reporting failure."), {
          code: "EVALUATOR_REPORTING_INTEGRATION_FAILURE"
        });
      }
    },
    requestOpenAIJson: async ({ payload }) => {
      const schema = payload?.text?.format?.name;
      calls.push(schema);
      if (schema === "item_identity") {
        return {
          json: {
            ...retailRecoveryFixture.identity,
            visualRecognition: retailRecoveryFixture.visualRecognition
          },
          data: { id: "offline-identity", output: [] },
          statusCode: 200
        };
      }
      if (schema === "consumer_purchase_decision") {
        if (failPurposeResponse) {
          throw Object.assign(new Error("Offline provider transport failure."), {
            code: "OFFLINE_PROVIDER_TRANSPORT",
            openAIErrorCode: "transport_error",
            statusCode: 502
          });
        }
        return {
          json: retailRecoveryFixture.finalReport,
          data: { id: "offline-decision", output: [] },
          statusCode: 200
        };
      }
      throw Object.assign(new Error(`Unexpected offline schema ${schema}`), {
        code: "OFFLINE_SCHEMA_BOUNDARY"
      });
    },
    requestSerperSearch: async ({ queryRecord }) => ({
      json: (queryRecord?.retailStage || queryRecord?.searchPass) === "stage_7_limited_result_recovery"
        ? retailRecoveryFixture.recoveryProviderResponse
        : retailRecoveryFixture.preliminaryProviderResponse,
      statusCode: 200,
      elapsedMs: 4
    }),
    requestBoundedRetailProductPage: async () => retailRecoveryFixture.directPageResult
  });
  return { handler, calls };
}

async function freshProcessReconstruction(root, episodeId, programmedBehaviorIds = []) {
  const helper = path.resolve("tests/helpers/reconstruct-website-cognition.mjs");
  const { stdout, stderr } = await execFile(process.execPath, [
    helper,
    root,
    learningScopeIdentity,
    episodeId,
    JSON.stringify(programmedBehaviorIds)
  ], {
    cwd: path.resolve("."),
    windowsHide: true,
    timeout: 30000
  });
  assert.equal(stderr, "");
  return JSON.parse(stdout);
}

function byteHash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function independentEvaluationAttachment(stored, productOutcome, {
  result = "PASS",
  behaviorId = "CANONICAL_EVIDENCE_LADDER",
  evaluator = "KATHERINE_OFFLINE_LOCAL_BETA_EVALUATOR_V1",
  criteriaVersion = "1.0",
  completeCausalSupport = false,
  evaluatedAt = "2026-08-28T20:00:00.000Z"
} = {}) {
  const pass = result === "PASS";
  const dimensions = {
    identityAccuracy: pass ? 1 : 0,
    purposeAccuracy: 1,
    conditionAccuracy: 1,
    evidenceTraceability: 1,
    uncertaintyCalibration: 1,
    decisionUsefulness: 1,
    schemaCoverage: 1,
    regressionSafety: 1
  };
  const evaluation = {
    schemaVersion: criteriaVersion,
    recordType: "KATHERINE_INDEPENDENT_VISIBLE_OUTCOME_EVALUATION",
    evaluator,
    evaluatorIndependence:
      "DETERMINISTIC_NON_PROVIDER_EVALUATION_OF_AUTHENTICATED_INPUT_AND_EXACT_HANDLER_RESPONSE",
    objectSpecificEvaluationOnly: true,
    reusableLessonClaimed: false,
    checks: {
      exactWebsiteOutcomeAuthenticated: true,
      independentCriteriaApplied: true,
      successCriteriaSatisfied: pass
    },
    fatalFailures: pass ? [] : ["IDENTITY_ACCURACY_BELOW_THRESHOLD"],
    dimensions,
    result,
    responseBindings: {
      rawResponseSha256: stored.artifact.response.sha256,
      canonicalResponseHash: stored.artifact.response.canonicalObjectHash
    },
    evaluatedAt,
    evaluationReportHash: ""
  };
  evaluation.evaluationReportHash = sha256Object(evaluation);
  const evaluationBytes = Buffer.from(`${JSON.stringify(evaluation, null, 2)}\n`, "utf8");
  const evaluatorIdentity = sha256Object({ evaluator });
  const evaluationAuthorityIdentity = sha256Object({
    authority: "LOCAL_BETA_INDEPENDENT_EVALUATION_FIXTURE",
    criteriaVersion
  });
  let successArtifactBytes = null;
  if (pass) {
    const sealedEvaluation = sealIndependentProductSuccessEvaluation({
      evaluationIdentity: evaluation.evaluationReportHash,
      evaluatorIdentity,
      evaluationAuthorityIdentity,
      independent: true,
      selfEvaluation: false,
      providerAuthored: false,
      fatalRegressionCount: 0,
      dimensions
    });
    const successArtifact = sealStoredProductSuccessArtifact({
      schemaVersion: "1.0",
      artifactType: "FROZEN_INDEPENDENT_PRODUCT_SUCCESS_EVALUATION",
      episodeId: stored.artifact.episodeId,
      outcomeId: productOutcome.outcome_id,
      inputBinding: {
        inputIdentity: stored.artifact.request.sha256,
        inputHash: productOutcome.original_evidence_identity
      },
      providerResponses: [],
      productOutput: {
        outputIdentity: stored.artifact.response.sha256,
        outputHash: stored.artifact.response.canonicalObjectHash
      },
      independentEvaluation: sealedEvaluation,
      modelIdentity: "offline-local-beta-version-1.12.52-model",
      policyVersion: "KATHERINE_PRODUCT_POLICY_COMMIT_023EB232",
      productSchemaVersion: "1.12.52",
      behaviorTrace: [{
        behaviorId,
        actionPattern: "PRESERVE_BOUNDED_EVIDENCE_WITHOUT_UNSUPPORTED_EXACTNESS",
        causalityDomain: "INTERNAL",
        scope: ["VISUAL_OBJECT_IDENTIFICATION", "CUSTOMER_PURPOSE_REPORTING"],
        applicabilityTriggers: ["AUTHENTICATED_IMAGE_PRESENT", "EXACT_IDENTITY_UNCERTAIN"],
        exclusions: ["VISIBLE_EVIDENCE_CONFLICT", "EXACT_IDENTITY_ALREADY_AUTHENTICATED"],
        supportingEvidenceHashes: [
          sealedEvaluation.evaluationRecordHash,
          stored.artifact.response.canonicalObjectHash
        ],
        causalAttribution: {
          baselineObservationHash: stored.artifact.request.sha256,
          treatmentObservationHash: stored.artifact.response.canonicalObjectHash,
          interventionOnlyDifference: completeCausalSupport,
          evaluatorAttributionConfirmed: completeCausalSupport,
          externalContributionDominant: false
        }
      }],
      expectedSuccessNoLesson: false,
      counterevidenceHashes: [],
      alternativeExplanations: completeCausalSupport ? [] : ["NO_INTERVENTION_ONLY_BASELINE_COMPARISON_EXISTS"],
      provenance: {
        authorityClass: "LOCAL_BETA_INDEPENDENT_PRODUCT_EVALUATION_FIXTURE",
        sourceType: "AUTHENTICATED_LOCAL_WEBSITE_PRODUCT_EPISODE",
        sourceIdentity: evaluation.evaluationReportHash,
        providerAuthored: false
      },
      unresolvedFatalRegression: false,
      evaluatedAt
    });
    successArtifactBytes = Buffer.from(`${JSON.stringify(successArtifact, null, 2)}\n`, "utf8");
  }
  return {
    episodeId: stored.artifact.episodeId,
    productOutcomeId: productOutcome.outcome_id,
    requestSha256: stored.artifact.request.sha256,
    rawResponseSha256: stored.artifact.response.sha256,
    canonicalResponseHash: stored.artifact.response.canonicalObjectHash,
    evaluatorIdentity,
    evaluationAuthorityIdentity,
    criteriaVersion,
    evaluationDisposition: pass ? "SUCCESS" : "FAILURE",
    evaluationBytes,
    ...(successArtifactBytes ? { successArtifactBytes } : {})
  };
}

test("local-beta configuration is explicit, requires an absolute root, and cannot enable Production", () => {
  const absoluteRoot = path.resolve(os.tmpdir(), "ke-local-beta-config");
  assert.deepEqual(resolveWebsiteCognitionConfiguration({ root: absoluteRoot }), {
    mode: "DISABLED",
    root: "",
    production: false
  });
  assert.deepEqual(resolveWebsiteCognitionConfiguration({
    mode: "LOCAL_BETA",
    root: absoluteRoot,
    vercelEnvironment: "production"
  }), {
    mode: "DISABLED",
    root: "",
    production: true
  });
  assert.deepEqual(resolveWebsiteCognitionConfiguration({
    mode: "LOCAL_BETA",
    root: absoluteRoot,
    nodeEnvironment: "production"
  }), {
    mode: "DISABLED",
    root: "",
    production: true
  });
  assert.throws(
    () => resolveWebsiteCognitionConfiguration({ mode: "LOCAL_BETA", root: "" }),
    (error) => error.code === "WEBSITE_COGNITION_ROOT_INVALID"
  );
  assert.throws(
    () => resolveWebsiteCognitionConfiguration({ mode: "LOCAL_BETA", root: "relative-root" }),
    (error) => error.code === "WEBSITE_COGNITION_ROOT_INVALID"
  );
  assert.throws(
    () => resolveWebsiteCognitionConfiguration({ mode: "enabled", root: absoluteRoot }),
    (error) => error.code === "WEBSITE_COGNITION_MODE_INVALID"
  );
});

test("local-beta mode fails closed before provider work when the governed adapter is missing", async () => {
  let providerCalls = 0;
  const handler = createGenerateListingHandler({
    getWebsiteCognitionMode: () => "LOCAL_BETA",
    getGovernedLearningAdapter: () => null,
    getOpenAIApiKey: () => "offline-placeholder",
    requestOpenAIJson: async () => { providerCalls += 1; throw new Error("must not run"); }
  });
  const response = await invoke(handler, websiteRequest("missing-learning-root"));
  assert.equal(response.statusCode, 500);
  assert.equal(response.payload.code, "WEBSITE_COGNITION_ADAPTER_REQUIRED");
  assert.equal(providerCalls, 0);
});

test("the website success path persists exact bindings, reconstructs fresh, and is idempotent", async () => {
  const rootParent = await mkdtemp(path.join(os.tmpdir(), "ke-website-success-"));
  const seedRoot = path.join(rootParent, "seed");
  const disabledRoot = path.join(rootParent, "disabled");
  const enabledRoot = path.join(rootParent, "enabled");
  const tamperRoot = path.join(rootParent, "tampered");
  const missingRoot = path.join(rootParent, "missing");
  const orphanRoot = path.join(rootParent, "orphan");
  const networkGuard = installHardNetworkDenial();
  try {
    const seedAdapter = new GovernedLearningAdapter({ root: seedRoot, learningScopeIdentity });
    await seedAdapter.initialize();
    await cp(seedRoot, disabledRoot, { recursive: true });
    await cp(seedRoot, enabledRoot, { recursive: true });

    const disabledAdapter = new GovernedLearningAdapter({ root: disabledRoot, learningScopeIdentity });
    const disabledProduct = offlineWebsiteHandler(disabledAdapter, { websiteMode: "DISABLED" });
    const disabledResponse = await invoke(disabledProduct.handler, websiteRequest("website-success"));
    assert.equal(disabledResponse.statusCode, 200, JSON.stringify(disabledResponse.payload));
    assert.equal((await disabledAdapter.status()).websiteOutcomes, 0);

    const enabledAdapter = new GovernedLearningAdapter({ root: enabledRoot, learningScopeIdentity });
    const enabledProduct = offlineWebsiteHandler(enabledAdapter);
    const request = websiteRequest("website-success");
    const first = await invoke(enabledProduct.handler, request);
    assert.equal(first.statusCode, 200, JSON.stringify(first.payload));
    assert.deepEqual(first.payload, disabledResponse.payload);
    const firstResponseBytes = Buffer.from(JSON.stringify(first.payload), "utf8");
    const stored = await enabledAdapter.websiteOutcome("website-success", {
      responseBytes: firstResponseBytes
    });
    assert(stored);
    assert.equal(stored.artifact.terminalKind, "SUCCESS");
    assert.equal(stored.artifact.response.canonicalObjectHash, sha256Object(first.payload));
    assert.equal(stored.artifact.response.sha256, byteHash(firstResponseBytes));
    assert.equal(stored.artifact.cognitiveDisposition.boundary, "MENTOR_SUCCESS");
    assert.equal(stored.artifact.cognitiveDisposition.result, "INDEPENDENT_EVALUATION_REQUIRED");
    assert.equal(stored.artifact.cognitiveDisposition.candidatePresent, false);
    const finalizedRequest = JSON.parse(stored.requestBytes.toString("utf8"));
    assert.equal(finalizedRequest.requestType, "KATHERINES_EYE_FINALIZED_GENERATE_LISTING_REQUEST");
    assert.equal(finalizedRequest.route, "/api/generate-listing");
    assert.equal(finalizedRequest.analysisId, request.analysisId);
    assert.deepEqual(finalizedRequest.photos, request.photos);
    assert.deepEqual(JSON.parse(stored.responseBytes.toString("utf8")), first.payload);

    const providerCallCount = enabledProduct.calls.length;
    const duplicate = await invoke(enabledProduct.handler, request);
    assert.equal(duplicate.statusCode, first.statusCode);
    assert.deepEqual(duplicate.payload, first.payload);
    assert.equal(enabledProduct.calls.length, providerCallCount);
    const status = await enabledAdapter.status();
    assert.equal(status.productOutcomes, 1);
    assert.equal(status.websiteOutcomes, 1);
    assert.equal(status.failures, 0);
    assert.equal(status.candidates, 0);
    assert.equal(status.qualifications, 0);
    assert.equal(status.promotedLessons, 0);

    const substituted = await invoke(enabledProduct.handler, websiteRequest("website-success", {
      notes: "identity substitution"
    }));
    assert.equal(substituted.statusCode, 502);
    assert.equal(substituted.payload.code, "WEBSITE_OUTCOME_REQUEST_MISMATCH");
    assert.equal(enabledProduct.calls.length, providerCallCount);
    await assert.rejects(
      enabledAdapter.websiteOutcome("website-success", {
        responseBytes: Buffer.from('{"substituted":true}', "utf8")
      }),
      (error) => error.code === "WEBSITE_OUTCOME_RESPONSE_MISMATCH"
    );
    await assert.rejects(
      new GovernedLearningAdapter({
        root: enabledRoot,
        learningScopeIdentity: "substituted-learning-scope"
      }).verify(),
      (error) => error.code === "LEARNING_LEDGER_ORDER"
    );

    const fresh = await freshProcessReconstruction(enabledRoot, "website-success");
    assert.equal(fresh.result, "WEBSITE_SUCCESS_COGNITION_RECONSTRUCTED");
    assert.equal(fresh.requestSha256, stored.artifact.request.sha256);
    assert.equal(fresh.responseSha256, stored.artifact.response.sha256);
    assert.equal(fresh.canonicalResponseHash, stored.artifact.response.canonicalObjectHash);
    assert.equal(fresh.cognitiveDisposition.result, "INDEPENDENT_EVALUATION_REQUIRED");
    assert.equal(fresh.successInventoryCount, 0);
    assert.equal(fresh.mentorObservationCount, 0);
    assert.equal(fresh.candidateOriginated, false);
    assert.equal(fresh.qualificationAuthorized, false);
    assert.equal(fresh.promotionAuthorized, false);
    assert.equal(fresh.runtimeConsumptionAuthorized, false);
    assert.equal(fresh.productChangeAuthorized, false);
    assert.equal(fresh.providerLifecycleAuthority, false);
    assert.equal(fresh.networkAttemptCount, 0);

    await cp(enabledRoot, tamperRoot, { recursive: true });
    await cp(enabledRoot, missingRoot, { recursive: true });
    await cp(enabledRoot, orphanRoot, { recursive: true });
    const [artifactFile] = await readdir(path.join(tamperRoot, "website-outcomes"));
    const artifactPath = path.join(tamperRoot, "website-outcomes", artifactFile);
    const tampered = JSON.parse(await readFile(artifactPath, "utf8"));
    tampered.statusCode = 201;
    await writeFile(artifactPath, `${JSON.stringify(tampered)}\n`, "utf8");
    await assert.rejects(
      new GovernedLearningAdapter({ root: tamperRoot, learningScopeIdentity }).verify(),
      (error) => error.code === "WEBSITE_OUTCOME_ARTIFACT_HASH_MISMATCH"
    );
    await unlink(path.join(missingRoot, "website-outcomes", artifactFile));
    await assert.rejects(
      new GovernedLearningAdapter({ root: missingRoot, learningScopeIdentity }).verify(),
      (error) => error.code === "WEBSITE_OUTCOME_ARTIFACT_SET_MISMATCH"
    );
    await writeFile(path.join(orphanRoot, "website-outcomes", "orphan.json"), "{}\n", "utf8");
    await assert.rejects(
      new GovernedLearningAdapter({ root: orphanRoot, learningScopeIdentity }).verify(),
      (error) => error.code === "WEBSITE_OUTCOME_ARTIFACT_SET_MISMATCH"
    );
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
    await rm(rootParent, { recursive: true, force: true });
  }
});

test("delayed independent success evaluation is exact-once, reconstructible, and tamper-evident", async () => {
  const rootParent = await mkdtemp(path.join(os.tmpdir(), "ke-website-evaluation-success-"));
  const root = path.join(rootParent, "learning");
  const tamperRoot = path.join(rootParent, "tampered");
  const missingRoot = path.join(rootParent, "missing");
  const orphanRoot = path.join(rootParent, "orphan");
  const networkGuard = installHardNetworkDenial();
  try {
    const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity });
    const product = offlineWebsiteHandler(adapter);
    const first = await invoke(product.handler, websiteRequest("website-evaluated-success"));
    assert.equal(first.statusCode, 200, JSON.stringify(first.payload));
    const originalResponseBytes = Buffer.from(JSON.stringify(first.payload), "utf8");
    const stored = await adapter.websiteOutcome("website-evaluated-success", {
      responseBytes: originalResponseBytes
    });
    const productOutcome = await adapter.productOutcome("website-evaluated-success");
    assert(productOutcome);

    const pending = await adapter.reconstructWebsiteCognition({ episodeId: "website-evaluated-success" });
    assert.equal(pending.cognitiveDisposition.result, "INDEPENDENT_EVALUATION_REQUIRED");
    assert.equal(pending.websiteEvaluation, null);
    assert.equal(pending.candidateOriginated, false);
    assert.deepEqual(pending.lessonGateReviews, []);

    const attachment = independentEvaluationAttachment(stored, productOutcome);
    const recorded = await adapter.recordWebsiteEvaluation(attachment);
    assert.equal(recorded.result, "WEBSITE_EVALUATION_RECORDED");
    assert.equal(recorded.idempotent, false);
    const authenticated = await adapter.websiteEvaluation("website-evaluated-success", {
      evaluationBytes: attachment.evaluationBytes
    });
    assert(authenticated);
    assert.equal(authenticated.artifact.productOutcomeId, productOutcome.outcome_id);
    assert.equal(authenticated.artifact.requestSha256, stored.artifact.request.sha256);
    assert.equal(authenticated.artifact.rawResponseSha256, stored.artifact.response.sha256);
    assert.equal(authenticated.artifact.canonicalResponseHash, stored.artifact.response.canonicalObjectHash);
    assert.equal(authenticated.artifact.evaluatorIdentity, attachment.evaluatorIdentity);
    assert.equal(authenticated.artifact.criteriaVersion, attachment.criteriaVersion);
    assert.equal(authenticated.artifact.evaluation.sha256, byteHash(attachment.evaluationBytes));
    assert.equal(authenticated.artifact.evaluation.evaluationReportHash, authenticated.evaluation.evaluationReportHash);

    const duplicate = await adapter.recordWebsiteEvaluation(attachment);
    assert.equal(duplicate.result, "WEBSITE_EVALUATION_ALREADY_RECORDED");
    assert.equal(duplicate.idempotent, true);
    assert.equal((await adapter.status()).websiteEvaluations, 1);

    const manifest = createProgrammedCompetenceManifest(["CANONICAL_EVIDENCE_LADDER"]);
    const reconstructed = await adapter.reconstructWebsiteCognition({
      episodeId: "website-evaluated-success",
      programmedCompetenceManifest: manifest
    });
    assert.equal(reconstructed.cognitiveDisposition.result, "EXISTING_PROGRAMMED_COMPETENCE");
    assert.equal(reconstructed.successInventory.authenticatedSuccessCount, 1);
    assert.equal(reconstructed.mentorSuccessOrigination.authenticatedObservationCount, 1);
    assert.equal(reconstructed.mentorSuccessOrigination.explanations.length, 0);
    assert.equal(reconstructed.candidateOriginated, false);
    assert.deepEqual(reconstructed.lessonCandidates, []);
    assert.deepEqual(reconstructed.lessonGateReviews, []);
    assert.deepEqual((await adapter.websiteOutcome("website-evaluated-success")).responseBytes, originalResponseBytes);

    const fresh = await freshProcessReconstruction(root, "website-evaluated-success", ["CANONICAL_EVIDENCE_LADDER"]);
    assert.equal(fresh.evaluationDisposition, "SUCCESS");
    assert.equal(fresh.evaluationBytesSha256, authenticated.artifact.evaluation.sha256);
    assert.equal(fresh.evaluationHash, authenticated.artifact.evaluation.evaluationReportHash);
    assert.equal(fresh.mentorSuccessDisposition, "EXISTING_PROGRAMMED_COMPETENCE");
    assert.equal(fresh.cognitiveDisposition.result, "EXISTING_PROGRAMMED_COMPETENCE");
    assert.equal(fresh.lessonCandidateCount, 0);
    assert.equal(fresh.lessonGateReviewCount, 0);
    assert.equal(fresh.networkAttemptCount, 0);

    for (const changed of [
      { requestSha256: "1".repeat(64) },
      { rawResponseSha256: "2".repeat(64) },
      { canonicalResponseHash: "3".repeat(64) },
      { productOutcomeId: "4".repeat(64) },
      { evaluatorIdentity: "5".repeat(64) },
      { criteriaVersion: "substituted-criteria" }
    ]) {
      await assert.rejects(adapter.recordWebsiteEvaluation({ ...attachment, ...changed }));
    }
    await assert.rejects(adapter.recordWebsiteEvaluation({ ...attachment, episodeId: "orphan-episode" }),
      (error) => error.code === "WEBSITE_EVALUATION_ORPHAN");
    const crossEpisodeResponse = await invoke(product.handler, websiteRequest("website-evaluation-cross-episode"));
    assert.equal(crossEpisodeResponse.statusCode, 200);
    await assert.rejects(
      adapter.recordWebsiteEvaluation({ ...attachment, episodeId: "website-evaluation-cross-episode" }),
      (error) => error.code === "WEBSITE_EVALUATION_SUCCESS_ARTIFACT_BINDING_INVALID"
    );
    const replacement = independentEvaluationAttachment(stored, productOutcome, {
      evaluator: "KATHERINE_OFFLINE_LOCAL_BETA_EVALUATOR_V2",
      evaluatedAt: "2026-08-28T20:01:00.000Z"
    });
    await assert.rejects(adapter.recordWebsiteEvaluation(replacement),
      (error) => error.code === "WEBSITE_EVALUATION_IDENTITY_SUBSTITUTION");
    const injectedEvaluation = JSON.parse(attachment.evaluationBytes.toString("utf8"));
    injectedEvaluation.causalityDomain = "INTERNAL";
    injectedEvaluation.evaluationReportHash = "";
    injectedEvaluation.evaluationReportHash = sha256Object(injectedEvaluation);
    await assert.rejects(adapter.recordWebsiteEvaluation({
      ...attachment,
      evaluationBytes: Buffer.from(`${JSON.stringify(injectedEvaluation)}\n`, "utf8")
    }), (error) => error.code === "LEARNING_UNKNOWN_FIELD");

    await cp(root, tamperRoot, { recursive: true });
    await cp(root, missingRoot, { recursive: true });
    await cp(root, orphanRoot, { recursive: true });
    const [artifactFile] = await readdir(path.join(tamperRoot, "website-evaluations"));
    const artifactPath = path.join(tamperRoot, "website-evaluations", artifactFile);
    const tampered = JSON.parse(await readFile(artifactPath, "utf8"));
    tampered.criteriaVersion = "substituted";
    await writeFile(artifactPath, `${JSON.stringify(tampered)}\n`, "utf8");
    await assert.rejects(
      new GovernedLearningAdapter({ root: tamperRoot, learningScopeIdentity }).verify(),
      (error) => error.code === "WEBSITE_EVALUATION_ARTIFACT_HASH_MISMATCH"
    );
    await unlink(path.join(missingRoot, "website-evaluations", artifactFile));
    await assert.rejects(
      new GovernedLearningAdapter({ root: missingRoot, learningScopeIdentity }).verify(),
      (error) => error.code === "WEBSITE_EVALUATION_ARTIFACT_SET_MISMATCH"
    );
    await writeFile(path.join(orphanRoot, "website-evaluations", "orphan.json"), "{}\n", "utf8");
    await assert.rejects(
      new GovernedLearningAdapter({ root: orphanRoot, learningScopeIdentity }).verify(),
      (error) => error.code === "WEBSITE_EVALUATION_ARTIFACT_SET_MISMATCH"
    );
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
    await rm(rootParent, { recursive: true, force: true });
  }
});

test("evaluated failure reaches the real failure Mentor and genuine novelty alone reaches the Lesson Gate", async () => {
  const rootParent = await mkdtemp(path.join(os.tmpdir(), "ke-website-evaluation-boundaries-"));
  const failureRoot = path.join(rootParent, "failure");
  const novelRoot = path.join(rootParent, "novel");
  const networkGuard = installHardNetworkDenial();
  try {
    const failureAdapter = new GovernedLearningAdapter({ root: failureRoot, learningScopeIdentity });
    const failureProduct = offlineWebsiteHandler(failureAdapter);
    const failureResponse = await invoke(failureProduct.handler, websiteRequest("website-evaluated-failure"));
    assert.equal(failureResponse.statusCode, 200);
    const failureStored = await failureAdapter.websiteOutcome("website-evaluated-failure");
    const failureOutcome = await failureAdapter.productOutcome("website-evaluated-failure");
    await failureAdapter.recordWebsiteEvaluation(independentEvaluationAttachment(
      failureStored,
      failureOutcome,
      { result: "FAIL", evaluatedAt: "2026-08-28T20:02:00.000Z" }
    ));
    const failure = await failureAdapter.reconstructWebsiteCognition({ episodeId: "website-evaluated-failure" });
    assert.equal(failure.result, "WEBSITE_EVALUATED_FAILURE_COGNITION_RECONSTRUCTED");
    assert.equal(failure.cognitiveDisposition.boundary, "MENTOR_FAILURE");
    assert.equal(failure.cognitiveDisposition.result, "INSUFFICIENT_CAUSAL_SUPPORT");
    assert.equal(failure.mentorFailureObservation.outcome, "FAILURE");
    assert.equal(failure.mentorFailureObservation.causalityDomain, "UNRESOLVED");
    assert.equal(failure.mentorFailureObservation.eligibleForLessonSupport, false);
    assert.equal(failure.mentorFailureOrigination.authenticatedObservationCount, 1);
    assert.equal(failure.mentorFailureOrigination.diagnoses.length, 0);
    assert.equal(failure.candidateOriginated, false);
    assert.deepEqual(failure.lessonGateReviews, []);
    const freshFailure = await freshProcessReconstruction(failureRoot, "website-evaluated-failure");
    assert.equal(freshFailure.mentorFailureDisposition, "INSUFFICIENT_CAUSAL_SUPPORT");
    assert.match(freshFailure.mentorFailureObservationHash, /^[a-f0-9]{64}$/);
    assert.equal(freshFailure.lessonCandidateCount, 0);
    assert.equal(freshFailure.lessonGateReviewCount, 0);

    const novelAdapter = new GovernedLearningAdapter({ root: novelRoot, learningScopeIdentity });
    const novelProduct = offlineWebsiteHandler(novelAdapter);
    const novelResponse = await invoke(novelProduct.handler, websiteRequest("website-evaluated-novel"));
    assert.equal(novelResponse.statusCode, 200);
    const novelStored = await novelAdapter.websiteOutcome("website-evaluated-novel");
    const novelOutcome = await novelAdapter.productOutcome("website-evaluated-novel");
    await novelAdapter.recordWebsiteEvaluation(independentEvaluationAttachment(novelStored, novelOutcome, {
      behaviorId: "NOVEL_BOUNDED_VISIBLE_EVIDENCE_BEHAVIOR",
      completeCausalSupport: true,
      evaluatedAt: "2026-08-28T20:03:00.000Z"
    }));
    const novel = await novelAdapter.reconstructWebsiteCognition({
      episodeId: "website-evaluated-novel",
      programmedCompetenceManifest: createProgrammedCompetenceManifest([])
    });
    assert.equal(novel.cognitiveDisposition.result, "NOVEL_SUCCESS_BEHAVIOR_SUPPORTED");
    assert.equal(novel.mentorSuccessOrigination.explanations.length, 1);
    assert.equal(novel.candidateOriginated, true);
    assert.equal(novel.lessonCandidates.length, 1);
    assert.equal(novel.lessonGateReviews.length, 1);
    const [candidate] = novel.lessonCandidates;
    assert.equal(candidate.status, "PROPOSED_ONLY");
    assert.equal(candidate.persistAsMemory, false);
    assert.equal(candidate.qualificationAuthorized, false);
    assert.equal(candidate.promotionAuthorized, false);
    assert.equal(candidate.runtimeConsumptionAuthorized, false);
    assert.equal(candidate.productChangeAuthorized, false);
    assert.equal(candidate.providerLifecycleAuthority, false);
    const freshNovel = await freshProcessReconstruction(novelRoot, "website-evaluated-novel");
    assert.equal(freshNovel.cognitiveDisposition.result, "NOVEL_SUCCESS_BEHAVIOR_SUPPORTED");
    assert.equal(freshNovel.lessonCandidateCount, 1);
    assert.equal(freshNovel.lessonGateReviewCount, 1);
    assert.equal(freshNovel.networkAttemptCount, 0);
    assert.equal((await novelAdapter.status()).candidates, 0);
    assert.equal((await novelAdapter.status()).promotedLessons, 0);
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
    await rm(rootParent, { recursive: true, force: true });
  }
});

test("the website failure path persists its real non-candidate disposition and reconstructs fresh", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-website-failure-"));
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity });
  const networkGuard = installHardNetworkDenial();
  try {
    const product = offlineWebsiteHandler(adapter, { failFinalEvidence: true });
    const request = websiteRequest("website-failure");
    const first = await invoke(product.handler, request);
    assert.equal(first.statusCode, 502);
    const stored = await adapter.websiteOutcome("website-failure", {
      responseBytes: Buffer.from(JSON.stringify(first.payload), "utf8")
    });
    assert(stored);
    assert.equal(stored.artifact.terminalKind, "FAILURE");
    assert.equal(stored.artifact.statusCode, 502);
    assert.equal(stored.artifact.cognitiveDisposition.boundary, "OPERATIONAL_FAILURE");
    assert.equal(stored.artifact.cognitiveDisposition.result, "OPERATIONAL_FAILURE_EXCLUDED_FROM_COGNITION");
    assert.equal(stored.artifact.cognitiveDisposition.candidatePresent, false);
    const providerCallCount = product.calls.length;
    const duplicate = await invoke(product.handler, request);
    assert.equal(duplicate.statusCode, first.statusCode);
    assert.deepEqual(duplicate.payload, first.payload);
    assert.equal(product.calls.length, providerCallCount);
    const status = await adapter.status();
    assert.equal(status.productOutcomes, 0);
    assert.equal(status.websiteOutcomes, 1);
    assert.equal(status.failures, 0);
    assert.equal(status.candidates, 0);

    const fresh = await freshProcessReconstruction(root, "website-failure");
    assert.equal(fresh.result, "WEBSITE_FAILURE_COGNITION_RECONSTRUCTED");
    assert.equal(fresh.terminalKind, "FAILURE");
    assert.equal(fresh.cognitiveDisposition.boundary, "OPERATIONAL_FAILURE");
    assert.equal(fresh.cognitiveDisposition.result, "OPERATIONAL_FAILURE_EXCLUDED_FROM_COGNITION");
    assert.equal(fresh.candidateOriginated, false);
    assert.equal(fresh.promotionAuthorized, false);
    assert.equal(fresh.productChangeAuthorized, false);
    assert.equal(fresh.networkAttemptCount, 0);
    assert.equal(networkGuard.attempts.length, 0);
  } finally {
    networkGuard.restore();
    await rm(root, { recursive: true, force: true });
  }
});
