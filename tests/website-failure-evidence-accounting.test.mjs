import assert from "node:assert/strict";
import test from "node:test";

import { __queryIntegrityTestHooks } from "../api/generate-listing.js";
import {
  MAX_GOVERNED_FAILURE_EVIDENCE_REFERENCES,
  buildProductFailureEvidenceHandoff
} from "../lib/cognitive-learning/adapter.js";
import { sha256Object } from "../lib/object-intelligence/index.js";
import { buildTerminalProviderMetering } from "../lib/terminal-evidence.js";

const authenticatedFailureRegression = Object.freeze({
  artifactId: "849a3a231e9b90ed5715d48a70b86cf01a5b668dce79d58e599176825b5cc41a",
  artifactSha256: "a5b8ac84abfce626e62fb354165fd707730bd3d4c093e96047524c1cf98a9c30",
  requestSha256: "8566245046c477f0fe03ad635584bdcfa0e55be3095e51c38ca31b6fd29a5e17",
  responseSha256: "e1486408a7b0dfad83b561819cac3eee10f3a9c3ef8191dd169fc9f683a02ec1",
  canonicalResponseHash: "84fa7bd7cd65e0f8addc0ec1c3dafff7e74bc9e8595c550d70bf7df68a5679ea",
  internalCode: "LEARNING_ARRAY_CARDINALITY",
  visibleEvidenceIds: Object.freeze([
    "observation-54be3f5b125d89", "observation-6309d0dfadb0d8",
    "observation-b398c0c349a4fd", "observation-fe39015edfa35d",
    "observation-08fdc586659e9f", "observation-0e434774ae124d",
    "observation-21a97f7242d8be", "observation-277f6eef9a1351",
    "observation-2ad16d155ba028", "observation-2e45cbd172e4d9",
    "observation-303274dedb3a66", "observation-34ad67a11d51ef",
    "observation-3a47fdf4848d5f", "observation-41c4d503daa5b7",
    "observation-5a4d1daa009c25", "observation-851a6ff38c8a4e",
    "terminal-provider-request-5b1d7e06395b76c446a0f537",
    "1b5541543861ccd39d7918372bf2b3f29a5218012b7f9088c6943ac48432c256",
    "7f88486f7e0fb247e5f41b31d48e2a242c90b492fdaf2347b7063578dd0347ea",
    "7e0f4a03f420f5e9903c03e0841c6d5e6c04fdd5bec2e6ad6d602201e39c73a4",
    "7d183ff37d977ba2fbcc453125360b228dd9825b6ce7f781057b45d4d1047fb7",
    "270bb09f6c0bd1f6470d4d8a52adc3a60fa569fef9235733999c9226e7d4eb23",
    "f95dfe06f847046b1cbbb109d35a7a5f240fb4e29f3dd1ac11e709443820f8f0",
    "42330ac6bc4331bd7af2ff6b07f7cd72990fa79a744ea7e92c23e45e528410a0",
    "a407b008ec1265d2e5c2c18d56bab0b4b1b620ffc34609ff08fc2f1a7e4939bb",
    "326adef4f0ecf57260c6fff7bf8793347977cee7be529eece56010d5fe4b4f88",
    "e544996a627663a6cb8e2dbdef7e83db785849e7531490bd148c4e4c162d89bd",
    "0e17665089131dc77b2de160efce106319d37f25ba0492ea3476a75dc92415e3",
    "53e2c58061130642e02e3a8b1b4a9fb91b5ddaecfbebc7d78769c70f064f959e",
    "6e863d6d75093eb04c9bc55e89f1b5a49947f8ee0470ae4434b70bbf89375a28",
    "efbe6c1c50e874d7e96e4d60cc6d3a2faba7fc61e27923089b92cee1620bdba6",
    "e857527eea6fff2ddd1be3504869fb7d5afd3b4a7dc3ef2c3edc3077ff6d0d7a",
    "177c3757ab741173d40a646c671b8759b21527b87d4ac7aec9edb5c41bf8f5da",
    "f2974846abe935201e35b9dd994ac988ba487f849e2a25d324d77e1c321e2d79",
    "3567741400608510ece25bc6628f4b8ac91f80ceedef0ccf4b9dc4b0f6ea76f0"
  ])
});

function evidence(count) {
  return Array.from({ length: count }, (_, index) => `evidence-${String(count - index).padStart(3, "0")}`);
}

test("the 32-item failure-reference contract preserves exact order and bytes", () => {
  assert.equal(MAX_GOVERNED_FAILURE_EVIDENCE_REFERENCES, 32);
  for (const count of [31, 32]) {
    const references = evidence(count);
    const before = Buffer.from(JSON.stringify(references), "utf8");
    const handoff = buildProductFailureEvidenceHandoff({
      visibleEvidenceIds: references,
      evidenceReferences: references
    });
    assert.deepEqual(handoff.evidenceReferences, references);
    assert.deepEqual(Buffer.from(JSON.stringify(handoff.evidenceReferences), "utf8"), before);
  }
});

test("33 references, malformed bytes, duplicates, and substituted identities fail closed", () => {
  const thirtyThree = evidence(33);
  assert.throws(
    () => buildProductFailureEvidenceHandoff({
      visibleEvidenceIds: thirtyThree,
      evidenceReferences: thirtyThree
    }),
    (error) => error.code === "LEARNING_ARRAY_CARDINALITY"
  );
  assert.throws(
    () => buildProductFailureEvidenceHandoff({
      visibleEvidenceIds: [" evidence-001"],
      evidenceReferences: [" evidence-001"]
    }),
    (error) => error.code === "LEARNING_EVIDENCE_BYTES_INVALID"
  );
  assert.throws(
    () => buildProductFailureEvidenceHandoff({
      visibleEvidenceIds: ["evidence-001", "evidence-001"],
      evidenceReferences: ["evidence-001"]
    }),
    (error) => error.code === "LEARNING_EVIDENCE_DUPLICATE"
  );
  assert.throws(
    () => buildProductFailureEvidenceHandoff({
      visibleEvidenceIds: ["evidence-001"],
      evidenceReferences: ["evidence-substituted"]
    }),
    (error) => error.code === "LEARNING_EVIDENCE_NOT_VISIBLE"
  );
});

test("the authenticated failed-artifact shape no longer applies the reference ceiling to visibility", () => {
  assert.equal(authenticatedFailureRegression.internalCode, "LEARNING_ARRAY_CARDINALITY");
  assert.equal(authenticatedFailureRegression.artifactId.length, 64);
  assert.equal(authenticatedFailureRegression.artifactSha256.length, 64);
  assert(authenticatedFailureRegression.visibleEvidenceIds.length > 32);
  const evidenceReferences = [
    authenticatedFailureRegression.requestSha256,
    authenticatedFailureRegression.responseSha256,
    authenticatedFailureRegression.canonicalResponseHash
  ];
  const handoff = buildProductFailureEvidenceHandoff({
    visibleEvidenceIds: [...authenticatedFailureRegression.visibleEvidenceIds, ...evidenceReferences],
    evidenceReferences
  });
  assert.deepEqual(handoff.visibleEvidenceIds.slice(0, -3), authenticatedFailureRegression.visibleEvidenceIds);
  assert.deepEqual(handoff.evidenceReferences, evidenceReferences);
});

test("zero-retry OpenAI 4xx and 5xx attempts retain complete available terminal metering", async () => {
  for (const fixture of [
    {
      statusCode: 400,
      usage: { input_tokens: 211, output_tokens: 37, total_tokens: 248 },
      expectedAvailability: "REPORTED"
    },
    { statusCode: 500, usage: null, expectedAvailability: "NOT_REPORTED" }
  ]) {
    const requestRecord = {
      provider: "OpenAI web_search",
      providerKey: "openai_web_search",
      physicalAttemptCount: 0,
      physicalRetryAttemptCount: 0,
      physicalAttempts: []
    };
    const budget = __queryIntegrityTestHooks.createPhysicalAttemptBudget(4, "provider_search");
    let calls = 0;
    await assert.rejects(__queryIntegrityTestHooks.requestOpenAIComparableSearchWithBudget({
      requestRecord,
      attemptBudget: budget,
      apiKey: "offline-placeholder",
      governedMaximumRetries: 0,
      buildPayload: () => ({ model: "gpt-metering-test", max_output_tokens: 777 }),
      requestAdapter: async () => {
        calls += 1;
        throw Object.assign(new Error("Synthetic provider rejection."), {
          openAIStatusCode: fixture.statusCode,
          openAIErrorCode: "synthetic_rejection",
          returnedModel: "gpt-metering-test",
          providerUsage: fixture.usage
        });
      }
    }));
    assert.equal(calls, 1);
    assert.equal(requestRecord.physicalAttemptCount, 1);
    assert.equal(requestRecord.physicalRetryAttemptCount, 0);
    assert.equal(requestRecord.maximumPhysicalAttemptsPerLogicalRequest, 1);
    assert.equal(requestRecord.physicalAttempts.length, 1);
    assert.equal(requestRecord.physicalAttempts[0].retry, false);
    assert.equal(requestRecord.physicalAttempts[0].statusCode, fixture.statusCode);
    assert.equal(requestRecord.physicalAttempts[0].requestedModel, "gpt-metering-test");
    assert.equal(requestRecord.physicalAttempts[0].returnedModel, "gpt-metering-test");
    assert.equal(requestRecord.physicalAttempts[0].reportedTokens.availability, fixture.expectedAvailability);
    assert.equal(requestRecord.physicalAttempts[0].conservativeAuthorizationExposure.maximumOutputTokens, 777);
    assert.equal(requestRecord.physicalAttempts[0].exactBilledDollars, null);

    const metering = buildTerminalProviderMetering({ providerRecordCollections: [[requestRecord]] }, {
      zeroRetryMode: true
    });
    assert.equal(metering.logicalRequestCount, 1);
    assert.equal(metering.physicalAttemptCount, 1);
    assert.equal(metering.physicalRetryAttemptCount, 0);
    assert.equal(metering.attempts[0].reportedTokens.availability, fixture.expectedAvailability);
    assert.equal(metering.exactBilledDollars, null);
    assert.equal(metering.meteringHash, sha256Object({ ...metering, meteringHash: "" }));
  }
});

test("zero-retry limits the Serper and shared direct-transport layers to one physical attempt", async () => {
  const queryRecord = {
    query: "bounded provider evidence query",
    searchType: "organic_web",
    validationPassed: true
  };
  const requestRecord = {
    provider: "Serper Google Search",
    providerKey: "serper_google",
    physicalAttemptCount: 0,
    physicalRetryAttemptCount: 0,
    physicalAttempts: []
  };
  const budget = __queryIntegrityTestHooks.createPhysicalAttemptBudget(4, "provider_search");
  let calls = 0;
  await assert.rejects(__queryIntegrityTestHooks.requestSerperSearchWithBudget({
    requestRecord,
    queryRecord,
    attemptBudget: budget,
    apiKey: "offline-placeholder",
    maxRetries: 1,
    governedMaximumRetries: 0,
    requestAdapter: async () => {
      calls += 1;
      throw Object.assign(new Error("Synthetic Serper failure."), {
        category: "serper_provider_error",
        statusCode: 500,
        code: "synthetic_failure"
      });
    }
  }));
  assert.equal(calls, 1);
  assert.equal(requestRecord.physicalAttemptCount, 1);
  assert.equal(requestRecord.physicalRetryAttemptCount, 0);
  assert.equal(requestRecord.maximumPhysicalAttemptsPerLogicalRequest, 1);
  assert.equal(requestRecord.physicalAttempts[0].statusCode, 500);

  const directBudget = __queryIntegrityTestHooks.createPhysicalAttemptBudget(4, "direct_page_enrichment");
  const directRecord = {
    providerKey: "direct_product_page_fetch",
    maximumPhysicalAttemptsPerLogicalRequest: 1,
    physicalAttemptCount: 0,
    physicalRetryAttemptCount: 0,
    physicalAttempts: []
  };
  assert.equal(__queryIntegrityTestHooks.consumePhysicalAttempt(directBudget, directRecord, {
    provider: "direct_product_page_fetch"
  }), true);
  assert.equal(__queryIntegrityTestHooks.consumePhysicalAttempt(directBudget, directRecord, {
    retry: true,
    provider: "direct_product_page_fetch"
  }), false);
  assert.equal(directRecord.physicalAttemptCount, 1);
  assert.equal(directRecord.physicalRetryAttemptCount, 0);
});
