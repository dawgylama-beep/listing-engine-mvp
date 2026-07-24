import assert from "node:assert/strict";
import http from "node:http";
import https from "node:https";
import test from "node:test";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

test("hard network denial blocks every repository network mechanism and restores them", () => {
  const originalFetch = globalThis.fetch;
  const originalHttpRequest = http.request;
  const originalHttpGet = http.get;
  const originalHttpsRequest = https.request;
  const originalHttpsGet = https.get;
  const guard = installHardNetworkDenial();
  try {
    const secretBearingAttempt = "https://user:password@blocked.example/fetch?api_key=never-log-this";
    assert.throws(() => globalThis.fetch(secretBearingAttempt), (error) => {
      assert.match(error.message, /UNEXPECTED_EXTERNAL_NETWORK_REQUEST: fetch https:\/\/blocked\.example\/fetch/);
      assert(!error.message.includes("password"));
      assert(!error.message.includes("never-log-this"));
      return true;
    });
    assert.throws(() => http.request("http://blocked.example/request"), /UNEXPECTED_EXTERNAL_NETWORK_REQUEST: http\.request/);
    assert.throws(() => http.get("http://blocked.example/get"), /UNEXPECTED_EXTERNAL_NETWORK_REQUEST: http\.get/);
    assert.throws(() => https.request("https://blocked.example/request"), /UNEXPECTED_EXTERNAL_NETWORK_REQUEST: https\.request/);
    assert.throws(() => https.get("https://blocked.example/get"), /UNEXPECTED_EXTERNAL_NETWORK_REQUEST: https\.get/);
    assert.equal(guard.attempts.length, 5);
    assert(guard.attempts.every((attempt) => attempt.target.includes("blocked.example")));
  } finally {
    guard.restore();
  }
  assert.equal(globalThis.fetch, originalFetch);
  assert.equal(http.request, originalHttpRequest);
  assert.equal(http.get, originalHttpGet);
  assert.equal(https.request, originalHttpsRequest);
  assert.equal(https.get, originalHttpsGet);
});
