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
import { GovernedLearningAdapter } from "../lib/cognitive-learning/adapter.js";
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

async function freshProcessReconstruction(root, episodeId) {
  const helper = path.resolve("tests/helpers/reconstruct-website-cognition.mjs");
  const { stdout, stderr } = await execFile(process.execPath, [
    helper,
    root,
    learningScopeIdentity,
    episodeId
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
