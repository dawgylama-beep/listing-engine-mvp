import assert from "node:assert/strict";
import test from "node:test";

import {
  __queryIntegrityTestHooks,
  createGenerateListingHandler
} from "../api/generate-listing.js";

const {
  createInputTokenCountPayload,
  createModelExecutionBudget,
  assertTotalProviderBudget,
  createPhysicalAttemptBudget,
  consumePhysicalAttempt,
  recordPhysicalAttemptOutcome,
  requestSerperSearchWithBudget,
  createQueryBoundLiveSearchPayload,
  createResponsesPayload,
  enforceExactModelRequestBudget,
  maximumPublishedRequestCost,
  providerAuthorizationExposure,
  requestOpenAIInputTokenCountNetwork
} = __queryIntegrityTestHooks;

function adaptersReturningCounts(counts, observations = []) {
  let index = 0;
  return {
    requestOpenAIInputTokenCount: async ({ payload }) => {
      assert.ok(payload.model);
      const value = counts[Math.min(index, counts.length - 1)];
      index += 1;
      if (value instanceof Error) throw value;
      return { input_tokens: value };
    },
    onModelRequestBudget: (observation) => observations.push(observation)
  };
}

function structuredPayload({
  model = "gpt-4.1-mini",
  name = "market_value_report",
  maxOutputTokens = 5000,
  withSearch = false
} = {}) {
  return {
    model,
    service_tier: "default",
    truncation: "disabled",
    max_output_tokens: maxOutputTokens,
    ...(withSearch ? {
      max_tool_calls: 1,
      tools: [{ type: "web_search", search_context_size: "medium" }],
      tool_choice: "required"
    } : {}),
    input: [{
      role: "user",
      content: [{ type: "input_text", text: "Dynamic source evidence: retained source A." }]
    }],
    text: {
      format: {
        type: "json_schema",
        name,
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["answer"],
          properties: { answer: { type: "string" } }
        }
      }
    }
  };
}

test("input-token counting receives all supported input-bearing fields without output-only controls", () => {
  const payload = structuredPayload({ model: "gpt-5.6-luna", name: "item_identity", maxOutputTokens: 6000, withSearch: true });
  payload.instructions = "Preserve uncertainty.";
  payload.reasoning = { effort: "medium" };
  payload.input[0].content.push({
    type: "input_image",
    image_url: "data:image/jpeg;base64,AA==",
    detail: "original"
  });
  payload.include = ["web_search_call.action.sources"];
  payload.store = false;

  const counted = createInputTokenCountPayload(payload);
  assert.equal(counted.model, "gpt-5.6-luna");
  assert.equal(counted.instructions, "Preserve uncertainty.");
  assert.deepEqual(counted.input, payload.input);
  assert.deepEqual(counted.tools, payload.tools);
  assert.deepEqual(counted.tool_choice, payload.tool_choice);
  assert.deepEqual(counted.text, payload.text);
  assert.deepEqual(counted.reasoning, payload.reasoning);
  assert.equal("max_output_tokens" in counted, false);
  assert.equal("service_tier" in counted, false);
  assert.equal(counted.truncation, "disabled");
  assert.equal("include" in counted, false);
  assert.equal("store" in counted, false);
});

test("exact input count rejects an over-limit request before generation reservation", async () => {
  const budget = createModelExecutionBudget();
  const observations = [];
  const payload = structuredPayload({ model: "gpt-5.6-luna", name: "item_identity", maxOutputTokens: 6000 });
  await assert.rejects(
    enforceExactModelRequestBudget({
      apiKey: "synthetic",
      payload,
      budget,
      adapters: adaptersReturningCounts([354001], observations)
    }),
    (error) => error.clientSafeCode === "analysis_input_too_large"
  );
  assert.equal(budget.inputTokenCountRequestCount, 1);
  assert.equal(budget.modelGenerationRequestCount, 0);
  assert.equal(budget.reservations.length, 0);
  assert.equal(budget.tokenCountReservations.length, 1);
  assert.equal(budget.tokenCountReservations[0].status, "COUNTED");
  assert.ok(budget.reservedSpendingDollars > 0);
  assert.equal(observations[0].inputTokens, 354001);
  assert.equal(observations[0].envelopeTokens, 360001);
  assert.equal(observations[0].guardResult, "reject");
});

test("token-count failure fails closed without a character estimate or generation reservation", async () => {
  const budget = createModelExecutionBudget();
  await assert.rejects(
    enforceExactModelRequestBudget({
      apiKey: "synthetic",
      payload: structuredPayload(),
      budget,
      adapters: adaptersReturningCounts([new Error("controlled count transport failure")])
    }),
    (error) => error.code === "MODEL_INPUT_TOKEN_COUNT_FAILED"
  );
  assert.equal(budget.inputTokenCountRequestCount, 1);
  assert.equal(budget.modelGenerationRequestCount, 0);
  assert.equal(budget.reservations.length, 0);
  assert.equal(budget.tokenCountReservations.length, 1);
  assert.equal(budget.tokenCountReservations[0].status, "FAILED_AFTER_TOKEN_COUNT_DISPATCH");
  assert.ok(budget.reservedSpendingDollars > 0);
});

test("the count request reserves the enforceable model context ceiling before dispatch", async () => {
  const budget = createModelExecutionBudget();
  let reservedAtDispatch = null;
  const payload = structuredPayload();
  await enforceExactModelRequestBudget({
    apiKey: "synthetic",
    payload,
    budget,
    adapters: {
      requestOpenAIInputTokenCount: async () => {
        reservedAtDispatch = budget.reservedSpendingDollars;
        return { input_tokens: 100 };
      }
    }
  });
  assert.equal(budget.tokenCountReservations[0].reservedInputTokens, 1047576);
  assert.equal(Number(reservedAtDispatch.toFixed(8)), Number((1047576 * 0.4 / 1000000).toFixed(8)));
  assert.ok(reservedAtDispatch > budget.tokenCountReservations[0].reservedCostDollars);
  const exposure = providerAuthorizationExposure(payload, 1);
  assert.equal(exposure.maximumRequestCostDollars, budget.reservations[0].maximumGenerationCostDollars);
  assert.equal(exposure.maximumRequestCostScope, "ONE_MODEL_GENERATION_ATTEMPT_EXCLUDING_PRIOR_TOKEN_COUNT");
  assert.notEqual(exposure.maximumRequestCostDollars, reservedAtDispatch);
});

test("an oversized count payload or unaffordable count ceiling dispatches no count request", async () => {
  let countRequests = 0;
  const adapters = {
    requestOpenAIInputTokenCount: async () => {
      countRequests += 1;
      return { input_tokens: 100 };
    }
  };
  const oversized = structuredPayload();
  oversized.input[0].content[0].text = "x".repeat(360001);
  await assert.rejects(
    enforceExactModelRequestBudget({ apiKey: "synthetic", payload: oversized, budget: createModelExecutionBudget(), adapters }),
    (error) => error.clientSafeCode === "analysis_input_too_large"
  );
  const unaffordable = createModelExecutionBudget();
  unaffordable.maximumSpendingDollars = 0.4;
  await assert.rejects(
    enforceExactModelRequestBudget({ apiKey: "synthetic", payload: structuredPayload(), budget: unaffordable, adapters }),
    (error) => error.clientSafeCode === "ANALYSIS_SPENDING_LIMIT_REACHED"
  );
  assert.equal(countRequests, 0);
  assert.equal(unaffordable.inputTokenCountRequestCount, 0);
});

test("a provider count above its context ceiling cannot authorize generation", async () => {
  const budget = createModelExecutionBudget();
  await assert.rejects(
    enforceExactModelRequestBudget({
      apiKey: "synthetic",
      payload: structuredPayload(),
      budget,
      adapters: adaptersReturningCounts([1047577])
    }),
    (error) => error.code === "MODEL_INPUT_TOKEN_COUNT_BOUND_EXCEEDED"
  );
  assert.equal(budget.modelGenerationRequestCount, 0);
  assert.equal(budget.tokenCountReservations[0].status, "COUNT_EXCEEDED_PROVIDER_CONTEXT_BOUND");
  assert.equal(budget.tokenCountReservations[0].observedInputTokens, 1047577);
});

test("response payloads use Standard tier and web-search requests permit one tool call", () => {
  const ordinary = createResponsesPayload({
    model: "gpt-4.1-mini",
    systemText: "System",
    userContent: [{ type: "input_text", text: "Customer input" }],
    schemaName: "market_value_report",
    schema: { type: "object" }
  });
  assert.equal(ordinary.service_tier, "default");

  const search = createQueryBoundLiveSearchPayload({
    model: "gpt-4.1-mini",
    platform: "",
    notes: "",
    identity: {},
    sourceRoute: [],
    queryRecord: { query: "3017620422003", searchPass: "identifier", priority: 1, allowedDomains: [] },
    buyerIntake: {},
    researchPurpose: "buyer_decision"
  });
  assert.equal(search.service_tier, "default");
  assert.equal(search.max_tool_calls, 1);
  assert.equal(search.tools.filter((tool) => tool.type === "web_search").length, 1);
});

test("cumulative model, web-search and spending ceilings reject before dispatch", async () => {
  const modelBudget = createModelExecutionBudget();
  modelBudget.maximumModelGenerationRequests = 1;
  modelBudget.maximumInputTokenCountRequests = 3;
  const modelAdapters = adaptersReturningCounts([100, 100]);
  await enforceExactModelRequestBudget({ apiKey: "synthetic", payload: structuredPayload(), budget: modelBudget, adapters: modelAdapters });
  await assert.rejects(
    enforceExactModelRequestBudget({ apiKey: "synthetic", payload: structuredPayload(), budget: modelBudget, adapters: modelAdapters }),
    (error) => error.clientSafeCode === "MODEL_GENERATION_REQUEST_LIMIT_REACHED"
  );
  assert.equal(modelBudget.modelGenerationRequestCount, 1);

  const searchBudget = createModelExecutionBudget();
  searchBudget.maximumModelGenerationRequests = 20;
  searchBudget.maximumInputTokenCountRequests = 20;
  searchBudget.maximumBillableProviderRequests = 20;
  searchBudget.maximumSpendingDollars = 10;
  searchBudget.maximumTotalProviderSpendingDollars = 10.06;
  const searchAdapters = adaptersReturningCounts(Array(9).fill(100));
  for (let index = 0; index < 8; index += 1) {
    await enforceExactModelRequestBudget({
      apiKey: "synthetic",
      payload: structuredPayload({ name: "live_comparable_search", maxOutputTokens: 4000, withSearch: true }),
      budget: searchBudget,
      adapters: searchAdapters
    });
  }
  await assert.rejects(
    enforceExactModelRequestBudget({
      apiKey: "synthetic",
      payload: structuredPayload({ name: "live_comparable_search", maxOutputTokens: 4000, withSearch: true }),
      budget: searchBudget,
      adapters: searchAdapters
    }),
    (error) => error.clientSafeCode === "WEB_SEARCH_TOOL_CALL_LIMIT_REACHED"
  );
  assert.equal(searchBudget.webSearchToolCallCount, 8);

  const spendingBudget = createModelExecutionBudget();
  spendingBudget.maximumSpendingDollars = 0.42;
  spendingBudget.maximumInputTokenCountRequests = 3;
  const spendingAdapters = adaptersReturningCounts([100, 100]);
  await enforceExactModelRequestBudget({ apiKey: "synthetic", payload: structuredPayload(), budget: spendingBudget, adapters: spendingAdapters });
  await assert.rejects(
    enforceExactModelRequestBudget({ apiKey: "synthetic", payload: structuredPayload(), budget: spendingBudget, adapters: spendingAdapters }),
    (error) => error.clientSafeCode === "ANALYSIS_SPENDING_LIMIT_REACHED"
  );
  assert.equal(spendingBudget.modelGenerationRequestCount, 1);
  assert.ok(spendingBudget.reservedSpendingDollars <= 0.42);
});

test("published Standard-tier reservation charges token counting and keeps the cumulative guard below USD 2.50", async () => {
  const visual = maximumPublishedRequestCost(
    structuredPayload({ model: "gpt-5.6-luna", name: "item_identity", maxOutputTokens: 6000 }),
    354000
  );
  const search = maximumPublishedRequestCost(
    structuredPayload({ name: "live_comparable_search", maxOutputTokens: 4000, withSearch: true }),
    356000
  );
  const final = maximumPublishedRequestCost(structuredPayload(), 355000);
  const maximum = visual.maximumCostDollars + (8 * search.maximumCostDollars) + final.maximumCostDollars;
  assert.equal(Number(maximum.toFixed(4)), 3.092);
  assert.ok(maximum > 2.5);
  assert.equal(visual.inputTokenCountBillingBasis, "RESPONSES_API_INPUT_TOKENS_AT_HIGHEST_PUBLISHED_INPUT_RATE");
  assert.equal(Number(visual.inputTokenCountCostDollars.toFixed(4)), 0.177);
  assert.equal(search.webSearchContentTokens, 8000);
  assert.equal(search.webSearchToolCostDollars, 0.01);

  const budget = createModelExecutionBudget();
  const adapters = adaptersReturningCounts([354000, ...Array(8).fill(356000), 355000]);
  await enforceExactModelRequestBudget({
    apiKey: "synthetic",
    payload: structuredPayload({ model: "gpt-5.6-luna", name: "item_identity", maxOutputTokens: 6000 }),
    budget,
    adapters
  });
  for (let index = 0; index < 6; index += 1) {
    await enforceExactModelRequestBudget({
      apiKey: "synthetic",
      payload: structuredPayload({ name: "live_comparable_search", maxOutputTokens: 4000, withSearch: true }),
      budget,
      adapters
    });
  }
  await assert.rejects(
    enforceExactModelRequestBudget({
      apiKey: "synthetic",
      payload: structuredPayload({ name: "live_comparable_search", maxOutputTokens: 4000, withSearch: true }),
      budget,
      adapters
    }),
    (error) => error.clientSafeCode === "ANALYSIS_SPENDING_LIMIT_REACHED"
  );
  assert.equal(budget.inputTokenCountRequestCount, 7);
  assert.equal(budget.modelGenerationRequestCount, 7);
  assert.ok(budget.reservedSpendingDollars <= 2.5);
  assert.ok(budget.reservedSpendingDollars + budget.serperReservedSpendingDollars <= 2.5);
});

test("total-provider reservation rejects an unaffordable episode before provider dispatch", async () => {
  const budget = createModelExecutionBudget();
  assert.equal(budget.serperReservedSpendingDollars, 0.06);
  assert.equal(budget.maximumSpendingDollars, 2.44);
  assert.equal(budget.maximumTotalProviderSpendingDollars, 2.5);
  budget.maximumSpendingDollars = 2.45;
  assert.throws(() => assertTotalProviderBudget(budget), (error) => error.clientSafeCode === "ANALYSIS_SPENDING_LIMIT_REACHED");
  let dispatched = 0;
  await assert.rejects(enforceExactModelRequestBudget({
    apiKey: "synthetic", payload: structuredPayload(), budget,
    adapters: { requestOpenAIInputTokenCount: async () => { dispatched += 1; return { input_tokens: 100 }; } }
  }), (error) => error.clientSafeCode === "ANALYSIS_SPENDING_LIMIT_REACHED");
  assert.equal(dispatched, 0);
  assert.equal(budget.inputTokenCountRequestCount, 0);
});

test("six Serper attempts, including failures, consume the single reserved pool and reject a seventh", () => {
  const ledger = createModelExecutionBudget();
  const physical = createPhysicalAttemptBudget(8, "provider_search");
  for (let index = 0; index < 6; index += 1) {
    const record = { maximumPhysicalAttemptsPerLogicalRequest: 1 };
    assert.equal(consumePhysicalAttempt(physical, record, { provider: "serper_google", providerLedger: ledger }), true);
    recordPhysicalAttemptOutcome(record, index === 2 ? "failed" : "succeeded", {});
  }
  const seventh = { maximumPhysicalAttemptsPerLogicalRequest: 1 };
  assert.equal(consumePhysicalAttempt(physical, seventh, { provider: "serper_google", providerLedger: ledger }), false);
  assert.equal(ledger.serperAttemptCount, 6);
  assert.equal(ledger.serperAttempts.length, 6);
  assert.equal(ledger.serperAttempts[2].status, "FAILED");
  assert.equal(ledger.serperAttempts.filter((attempt) => attempt.status === "SUCCEEDED").length, 5);
  assert.equal(ledger.serperAttempts.reduce((sum, attempt) => sum + attempt.conservativeExposureDollars, 0).toFixed(2), "0.06");
  assert.equal(ledger.serperReservedSpendingDollars, 0.06);
  assert.equal(physical.physicalAttemptCount, 6);
});

test("the actual Serper request wrapper charges failed dispatch and does not send a seventh", async () => {
  const ledger = createModelExecutionBudget();
  const physical = createPhysicalAttemptBudget(8, "provider_search");
  let dispatched = 0;
  for (let index = 0; index < 7; index += 1) {
    const requestRecord = {};
    const attempt = requestSerperSearchWithBudget({
      requestRecord,
      queryRecord: { query: "synthetic camera source", validationPassed: true },
      attemptBudget: physical,
      apiKey: "synthetic",
      maxRetries: 0,
      governedMaximumRetries: 0,
      providerLedger: ledger,
      requestAdapter: async () => {
        dispatched += 1;
        if (index === 1) throw Object.assign(new Error("controlled provider failure"), { statusCode: 503 });
        return { statusCode: 200, json: { organic: [] } };
      }
    });
    if (index === 1 || index === 6) await assert.rejects(attempt);
    else await attempt;
    assert.equal(requestRecord.physicalAttemptCount || 0, index === 6 ? 0 : 1);
  }
  assert.equal(dispatched, 6);
  assert.equal(ledger.serperAttemptCount, 6);
  assert.equal(ledger.serperAttempts[1].status, "FAILED");
  assert.equal(ledger.serperAttempts[5].status, "SUCCEEDED");
});

test("actual token-count network adapter uses the input_tokens endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ object: "response.input_tokens", input_tokens: 321 }), {
      status: 200,
      headers: { "content-type": "application/json", "x-request-id": "count-request-safe-id" }
    });
  };
  try {
    const result = await requestOpenAIInputTokenCountNetwork({
      apiKey: "synthetic-secret-not-retained",
      payload: createInputTokenCountPayload(structuredPayload()),
      timeoutMs: 1000
    });
    assert.equal(result.input_tokens, 321);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.openai.com/v1/responses/input_tokens");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(calls[0].body.model, "gpt-4.1-mini");
    assert.equal("max_output_tokens" in calls[0].body, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the actual handler invokes exact counting and rejects before model generation", async () => {
  let generationRequests = 0;
  let countRequests = 0;
  const handler = createGenerateListingHandler({
    getOpenAIApiKey: () => "synthetic",
    getOpenAIModel: () => "gpt-4.1-mini",
    getVisualIdentityModel: () => "gpt-5.6-luna",
    getSerperApiKey: () => "",
    usesAuthenticatedExactInputTokenCounting: true,
    requestOpenAIInputTokenCount: async ({ payload }) => {
      countRequests += 1;
      assert.equal(payload.model, "gpt-5.6-luna");
      assert.equal(payload.input[1].content.some((entry) => entry.type === "input_image"), true);
      assert.equal(payload.text.format.name, "item_identity");
      return { input_tokens: 354001 };
    },
    requestOpenAIJson: async () => {
      generationRequests += 1;
      throw new Error("generation must not be dispatched");
    }
  });
  const response = { statusCode: 0, payload: null };
  const res = {
    status(code) { response.statusCode = code; return this; },
    json(payload) { response.payload = payload; return payload; }
  };
  await handler({
    method: "POST",
    body: {
      analysisId: "analysis-exact-count-over-limit",
      reportType: "marketValue",
      notes: "Customer-reported GTIN 3017620422003",
      buyerIntake: { purchase_intent: "personal_use", known_upc: "3017620422003" },
      photos: [{ name: "retained-item-photo.jpg", dataUrl: "data:image/jpeg;base64,AA==" }]
    }
  }, res);
  assert.equal(countRequests, 1);
  assert.equal(generationRequests, 0);
  assert.equal(response.statusCode, 413);
  assert.equal(response.payload.code, "analysis_input_too_large");
});
