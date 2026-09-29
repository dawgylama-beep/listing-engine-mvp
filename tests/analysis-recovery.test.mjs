import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createCustomerAccountService, createFileCustomerAccountStore, createMemoryCustomerAccountStore } from "../lib/customer-account/service.js";
import { createCustomerAccountHandler } from "../api/customer-account.js";
import { createGenerateListingHandler } from "../api/generate-listing.js";
import { retailRecoveryFixture } from "./fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const photo = { name: "synthetic-object.jpg", dataUrl: `data:image/jpeg;base64,${Buffer.alloc(220000, 0x5a).toString("base64")}` };

function capture() {
  return { statusCode: 200, headers: {}, payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name.toLowerCase()] = value; },
    json(payload) { this.payload = payload; return this; }
  };
}

async function accountRequest(handler, { method = "GET", url = "/api/customer-account", token = "", csrf = "", body = null } = {}) {
  const res = capture();
  await handler({ method, url, body, headers: {
    host: "localhost:5175", origin: "http://localhost:5175", "content-type": "application/json",
    cookie: token ? `ke_beta_session=${token}` : "", "x-csrf-token": csrf
  } }, res);
  return res;
}

test("account-scoped recovery atomically claims once, retains exact terminal bytes separately from saved history, and expires", async () => {
  let clock = Date.parse("2026-09-29T12:00:00Z");
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store, now: () => clock });
  const first = await service.register({ username: "recovery_one", password: "synthetic password 123" });
  const other = await service.register({ username: "recovery_two", password: "synthetic password 456" });
  const identity = { analysisId: "analysis-abcdef123456", requestHash: hash("request"), photoHashes: [hash("photo")] };
  const registered = await service.registerAnalysisRecovery(first.session.token, identity);
  assert.equal(registered.state, "REGISTERED");
  const claimIdentity = { ...identity, recoveryId: registered.recoveryId };
  const claims = await Promise.all(Array.from({ length: 8 }, () => service.claimAnalysisRecovery(first.session.token, claimIdentity)));
  assert.equal(claims.filter((claim) => claim.claimed).length, 1);
  assert.equal(claims.filter((claim) => claim.state === "DISPATCHING").length, 8);
  await assert.rejects(service.claimAnalysisRecovery(other.session.token, claimIdentity), { code: "analysis_recovery_not_found" });
  await assert.rejects(service.claimAnalysisRecovery(first.session.token, { ...claimIdentity, recoveryId: `recovery_${"A".repeat(32)}` }), { code: "analysis_recovery_not_found" });
  await assert.rejects(service.claimAnalysisRecovery(first.session.token, { ...claimIdentity, photoHashes: [hash("altered")] }), { code: "analysis_recovery_input_changed" });
  await assert.rejects(service.registerAnalysisRecovery(first.session.token, { ...identity, requestHash: hash("changed") }), { code: "analysis_recovery_input_changed" });
  const response = { valuation: { analysisId: identity.analysisId, metering: { billingStatus: "UNKNOWN" }, text: "Exact controlled result." } };
  await service.completeAnalysisRecovery(first.session.token, { analysisId: identity.analysisId, recoveryId: registered.recoveryId, state: "SUCCEEDED", statusCode: 200, response });
  const recovered = await service.readAnalysisRecovery(first.session.token, identity.analysisId, registered.recoveryId);
  assert.equal(JSON.stringify(recovered.response), JSON.stringify(response));
  assert.deepEqual((await service.listHistory(first.session.token)).listings, []);
  await assert.rejects(service.completeAnalysisRecovery(first.session.token, { analysisId: identity.analysisId, recoveryId: registered.recoveryId, state: "FAILED_TERMINAL", statusCode: 500, response: {} }), { code: "analysis_recovery_state_changed" });
  clock += 60 * 60 * 1000;
  assert.equal((await service.readAnalysisRecovery(first.session.token, identity.analysisId, registered.recoveryId)).state, "UNKNOWN");
  await service.cleanupExpired();
  assert.equal((await store.read()).analysisRecoveries[first.account.id], undefined);
  await assert.rejects(service.registerAnalysisRecovery(first.session.token, identity), { code: "analysis_recovery_already_used" });
});

test("actual provider failure becomes terminal and the same request cannot dispatch again", async () => {
  const guard = installHardNetworkDenial();
  try {
    const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
    const account = await service.register({ username: "failure_recovery", password: "synthetic password 123" });
    const body = { analysisId: "analysis-providerfailure", reportType: "marketValue", platform: "", notes: "synthetic details", photos: [photo], buyerIntake: retailRecoveryFixture.buyerIntake };
    const identity = { analysisId: body.analysisId, requestHash: hash(JSON.stringify(body)), photoHashes: [hash(photo.dataUrl)] };
    const registered = await service.registerAnalysisRecovery(account.session.token, identity);
    body.recovery = { recoveryId: registered.recoveryId, requestHash: identity.requestHash, photoHashes: identity.photoHashes };
    let providerCalls = 0;
    const handler = createGenerateListingHandler({
      requireAnalysisRecovery: true,
      resolveAnalysisAccountService: async () => service,
      getOpenAIApiKey: () => "synthetic-placeholder",
      getOpenAIModel: () => "synthetic-model",
      requestOpenAIJson: async () => { providerCalls += 1; throw Object.assign(new Error("controlled failure"), { code: "CONTROLLED_PROVIDER_FAILURE" }); }
    });
    const request = () => ({ method: "POST", body: structuredClone(body), headers: {
      host: "localhost:5175", origin: "http://localhost:5175", "content-type": "application/json",
      cookie: `ke_beta_session=${account.session.token}`, "x-csrf-token": account.session.csrfToken
    } });
    const first = capture();
    await handler(request(), first);
    assert.equal(first.statusCode, 502);
    const status = await service.readAnalysisRecovery(account.session.token, body.analysisId, registered.recoveryId);
    assert.equal(status.state, "FAILED_TERMINAL");
    assert.equal(JSON.stringify(status.response), JSON.stringify(first.payload));
    const second = capture();
    await handler(request(), second);
    assert.equal(JSON.stringify(second.payload), JSON.stringify(first.payload));
    assert.equal(providerCalls, 1);
    assert.equal(guard.attempts.length, 0);
  } finally { guard.restore(); }
});

test("authenticated register/status endpoints reject cross-account recovery and preserve terminal failure", async () => {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  const handler = createCustomerAccountHandler({ service });
  const first = await service.register({ username: "endpoint_one", password: "synthetic password 123" });
  const other = await service.register({ username: "endpoint_two", password: "synthetic password 456" });
  const identity = { analysisId: "analysis-endpoint123", requestHash: hash("request"), photoHashes: [hash("photo")] };
  const registered = await accountRequest(handler, { method: "POST", token: first.session.token, csrf: first.session.csrfToken, body: { action: "register_analysis", ...identity } });
  assert.equal(registered.statusCode, 200);
  const recoveryId = registered.payload.recoveryId;
  const url = `/api/customer-account?action=analysis_status&analysisId=${identity.analysisId}&recoveryId=${recoveryId}`;
  assert.equal((await accountRequest(handler, { token: other.session.token, url })).statusCode, 404);
  assert.equal((await accountRequest(handler, { token: first.session.token, url })).payload.state, "REGISTERED");
  await service.claimAnalysisRecovery(first.session.token, { ...identity, recoveryId });
  assert.equal((await accountRequest(handler, { token: first.session.token, url })).payload.state, "DISPATCHING");
  await service.completeAnalysisRecovery(first.session.token, { analysisId: identity.analysisId, recoveryId, state: "FAILED_TERMINAL", statusCode: 502, response: { error: "Provider timed out." } });
  assert.equal((await accountRequest(handler, { token: first.session.token, url })).payload.state, "FAILED_TERMINAL");
});

test("durable recovery survives a fresh service instance and does not become saved history", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "katherine-recovery-"));
  try {
    const storePath = path.join(directory, "accounts.json");
    const first = createCustomerAccountService({ store: createFileCustomerAccountStore(storePath) });
    const account = await first.register({ username: "durable_recovery", password: "synthetic password 123" });
    const identity = { analysisId: "analysis-durable123", requestHash: hash("request"), photoHashes: [hash("photo")] };
    const registered = await first.registerAnalysisRecovery(account.session.token, identity);
    await first.claimAnalysisRecovery(account.session.token, { ...identity, recoveryId: registered.recoveryId });
    await first.completeAnalysisRecovery(account.session.token, {
      analysisId: identity.analysisId, recoveryId: registered.recoveryId,
      state: "SUCCEEDED", statusCode: 200, response: { valuation: { text: "Exact report and usage", metering: { billingStatus: "UNKNOWN" } } }
    });
    const second = createCustomerAccountService({ store: createFileCustomerAccountStore(storePath) });
    const recovered = await second.readAnalysisRecovery(account.session.token, identity.analysisId, registered.recoveryId);
    assert.equal(recovered.response.valuation.text, "Exact report and usage");
    assert.deepEqual((await second.listHistory(account.session.token)).listings, []);
    assert.equal((await second.claimAnalysisRecovery(account.session.token, { ...identity, recoveryId: registered.recoveryId })).claimed, false);
  } finally {
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("actual handler admits one authenticated POST and recovers its exact result after a lost browser response", async () => {
  const guard = installHardNetworkDenial();
  try {
    const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
    const account = await service.register({ username: "handler_one", password: "synthetic password 123" });
    const body = { analysisId: "analysis-livecontrolled1", reportType: "marketValue", platform: "", notes: "041226087161", photos: [photo], buyerIntake: retailRecoveryFixture.buyerIntake };
    const identity = { analysisId: body.analysisId, requestHash: hash(JSON.stringify(body)), photoHashes: [hash(photo.dataUrl)] };
    const registered = await service.registerAnalysisRecovery(account.session.token, identity);
    body.recovery = { recoveryId: registered.recoveryId, requestHash: identity.requestHash, photoHashes: identity.photoHashes };
    let modelCalls = 0;
    let releaseFirst;
    const firstModelGate = new Promise((resolve) => { releaseFirst = resolve; });
    const handler = createGenerateListingHandler({
      requireAnalysisRecovery: true,
      resolveAnalysisAccountService: async () => service,
      getOpenAIApiKey: () => "synthetic-placeholder",
      getOpenAIModel: () => "synthetic-model",
      getSerperApiKey: () => "synthetic-placeholder",
      requestOpenAIJson: async ({ payload }) => {
        modelCalls += 1;
        if (modelCalls === 1) await firstModelGate;
        const schema = payload?.text?.format?.name;
        if (schema === "item_identity") return { json: { ...retailRecoveryFixture.identity, visualRecognition: retailRecoveryFixture.visualRecognition }, data: { output: [] } };
        if (schema === "consumer_purchase_decision") return { json: retailRecoveryFixture.finalReport, data: { output: [] } };
        throw new Error(`Unexpected synthetic schema: ${schema}`);
      },
      requestSerperSearch: async ({ queryRecord }) => ({
        json: queryRecord?.retailStage === "stage_7_limited_result_recovery" ? retailRecoveryFixture.recoveryProviderResponse : retailRecoveryFixture.preliminaryProviderResponse,
        statusCode: 200, elapsedMs: 4
      }),
      requestBoundedRetailProductPage: async () => retailRecoveryFixture.directPageResult
    });
    const makeReq = () => ({ method: "POST", body: structuredClone(body), headers: {
      host: "localhost:5175", origin: "http://localhost:5175", "content-type": "application/json",
      cookie: `ke_beta_session=${account.session.token}`, "x-csrf-token": account.session.csrfToken
    } });
    const firstResponse = capture();
    const firstRun = handler(makeReq(), firstResponse);
    while (modelCalls === 0) await new Promise((resolve) => setTimeout(resolve, 1));
    const duplicate = capture();
    await handler(makeReq(), duplicate);
    assert.equal(duplicate.statusCode, 202);
    assert.equal(duplicate.payload.state, "DISPATCHING");
    assert.equal(modelCalls, 1);
    releaseFirst();
    await firstRun;
    assert.equal(firstResponse.statusCode, 200, JSON.stringify(firstResponse.payload));
    const recovered = await service.readAnalysisRecovery(account.session.token, body.analysisId, registered.recoveryId);
    assert.equal(recovered.state, "SUCCEEDED");
    assert.equal(JSON.stringify(recovered.response), JSON.stringify(firstResponse.payload));
    const replay = capture();
    await handler(makeReq(), replay);
    assert.equal(replay.statusCode, 200);
    assert.equal(JSON.stringify(replay.payload), JSON.stringify(firstResponse.payload));
    assert.equal(modelCalls, 2, "only the original two model stages may execute");
    const altered = capture();
    const alteredRequest = makeReq();
    alteredRequest.body.notes = "different item detail";
    await handler(alteredRequest, altered);
    assert.equal(altered.statusCode, 409);
    const alteredPhoto = capture();
    const alteredPhotoRequest = makeReq();
    alteredPhotoRequest.body.photos[0].dataUrl = `data:image/jpeg;base64,${Buffer.alloc(220000, 0x5b).toString("base64")}`;
    await handler(alteredPhotoRequest, alteredPhoto);
    assert.equal(alteredPhoto.statusCode, 409);
    assert.equal(modelCalls, 2);
    assert.deepEqual((await service.listHistory(account.session.token)).listings, []);
    assert.equal(guard.attempts.length, 0);
  } finally { guard.restore(); }
});
