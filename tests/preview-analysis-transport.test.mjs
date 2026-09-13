import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { __queryIntegrityTestHooks as hooks, createGenerateListingHandler } from "../api/generate-listing.js";

const ENVIRONMENT_KEYS = [
  "KATHERINES_EYE_GOVERNED_COGNITION_MODE",
  "KATHERINES_EYE_LEARNING_ROOT",
  "NODE_ENV",
  "OPENAI_API_KEY",
  "OPEN_API_KEY",
  "SERPER_API_KEY",
  "VERCEL_ENV"
];

function restoreEnvironment(snapshot) {
  for (const key of ENVIRONMENT_KEYS) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
}

test("hosted Preview analysis selects the deployable provider transport without an owner-local root", async () => {
  const originalEnvironment = Object.fromEntries(ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const requests = [];
  try {
    process.env.VERCEL_ENV = "preview";
    delete process.env.NODE_ENV;
    delete process.env.KATHERINES_EYE_LEARNING_ROOT;
    delete process.env.KATHERINES_EYE_GOVERNED_COGNITION_MODE;
    globalThis.fetch = async (url, options) => {
      requests.push({ url, options });
      return new Response(JSON.stringify({
        id: "controlled-preview-response",
        model: "controlled-preview-model",
        output_text: JSON.stringify({ accepted: true }),
        usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
      }), {
        status: 200,
        headers: { "content-type": "application/json", "x-request-id": "controlled-preview-request" }
      });
    };

    assert.equal(hooks.productionOpenAITransport({ vercelEnvironment: "preview" }), "DIRECT_PROVIDER");
    const result = await hooks.requestProductionOpenAIJson({
      apiKey: "controlled-offline-placeholder",
      payload: { model: "controlled-preview-model", input: [], text: { format: { type: "json_schema" } } }
    });
    assert.deepEqual(result.json, { accepted: true });
    assert.equal(result.statusCode, 200);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, "https://api.openai.com/v1/responses");
    assert.equal(requests[0].options.method, "POST");
    assert.equal(requests[0].options.headers["Content-Type"], "application/json");
    assert.match(requests[0].options.headers["Idempotency-Key"], /^katherine-product-[a-f0-9]{64}$/u);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment(originalEnvironment);
  }
});

test("only explicit non-hosted local-beta cognition selects the installed SCC transport", () => {
  const absoluteRoot = path.resolve(os.tmpdir(), "katherine-local-scc");
  assert.equal(hooks.productionOpenAITransport({
    mode: "LOCAL_BETA",
    root: absoluteRoot
  }), "KATHERINE_SCC");
  assert.equal(hooks.productionOpenAITransport({
    mode: "LOCAL_BETA",
    root: absoluteRoot,
    vercelEnvironment: "preview"
  }), "DIRECT_PROVIDER");
  assert.equal(hooks.productionOpenAITransport({
    mode: "LOCAL_BETA",
    root: absoluteRoot,
    vercelEnvironment: "production"
  }), "DIRECT_PROVIDER");
});

test("the real Preview handler reaches the hosted provider boundary without owner-local SCC state", async () => {
  const originalEnvironment = Object.fromEntries(ENVIRONMENT_KEYS.map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  const requests = [];
  try {
    process.env.VERCEL_ENV = "preview";
    process.env.OPENAI_API_KEY = "controlled-offline-placeholder";
    delete process.env.OPEN_API_KEY;
    delete process.env.SERPER_API_KEY;
    delete process.env.NODE_ENV;
    delete process.env.KATHERINES_EYE_LEARNING_ROOT;
    delete process.env.KATHERINES_EYE_GOVERNED_COGNITION_MODE;
    globalThis.fetch = async (url) => {
      requests.push(url);
      throw Object.assign(new Error("controlled offline provider stop"), { code: "CONTROLLED_OFFLINE_STOP" });
    };
    const response = {
      statusCode: 200,
      payload: null,
      status(code) { this.statusCode = code; return this; },
      json(payload) { this.payload = payload; return this; }
    };

    await createGenerateListingHandler()({
      method: "POST",
      body: {
        analysisId: "preview-handler-provider-boundary",
        reportType: "marketValue",
        platform: "",
        notes: "controlled offline object",
        photos: [{ name: "controlled.png", dataUrl: "data:image/png;base64,iVBORw0KGgo=" }],
        buyerIntake: { purchase_intent: "personal_use" }
      }
    }, response);

    assert.equal(requests.length, 1);
    assert.equal(requests[0], "https://api.openai.com/v1/responses");
    assert.equal(response.statusCode, 502);
    assert.equal(response.payload?.diagnostics?.terminalFailure?.stageAtFailure, "OBJECT_OBSERVATION");
    assert.equal(JSON.stringify(response.payload).includes("controlled offline provider stop"), false);
  } finally {
    globalThis.fetch = originalFetch;
    restoreEnvironment(originalEnvironment);
  }
});
