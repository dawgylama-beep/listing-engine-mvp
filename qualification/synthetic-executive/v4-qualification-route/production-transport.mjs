import assert from "node:assert/strict";

import { resolveApprovedCredential } from "../calibration/scripts/real-route-credential.mjs";
import { loadRealProviderProfile } from "../calibration/scripts/real-route-profile.mjs";
import { EXECUTION_LIMITS } from "./shared.mjs";

async function boundedResponseBytes(response, ceiling) {
  const reader = response.body?.getReader?.();
  if (!reader) return Buffer.from(await response.arrayBuffer());
  const chunks = []; let total = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    total += value.byteLength; chunks.push(Buffer.from(value));
    if (total > ceiling) { await reader.cancel(); break; }
  }
  return Buffer.concat(chunks, Math.min(total, ceiling + 1));
}

export async function createProductionTransport({ fetchImpl = globalThis.fetch } = {}) {
  assert.equal(typeof fetchImpl, "function");
  const profile = await loadRealProviderProfile(); const credentialHandle = await resolveApprovedCredential();
  assert.equal(profile.exactModelId, EXECUTION_LIMITS.model); assert.equal(profile.reasoning.effort, EXECUTION_LIMITS.reasoningEffort);
  return Object.freeze({
    async dispatch({ serializedRequest, maximumResponseBytes }) {
      const startedAt = new Date().toISOString(); const abort = new AbortController(); const timer = setTimeout(() => abort.abort(), profile.timeoutMs);
      try {
        const url = new URL(profile.inferenceEndpoint, `${profile.apiBaseUrl}/`);
        const response = await credentialHandle.withCredential((credential) => fetchImpl(url, {
          method: "POST", redirect: "manual", signal: abort.signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${credential}` }, body: serializedRequest
        }));
        const rawResponseBytes = await boundedResponseBytes(response, maximumResponseBytes);
        if (response.status === 429) { const error = new Error("provider rate limited"); error.code = "PROVIDER_RATE_LIMITED"; throw error; }
        if (response.status >= 500) { const error = new Error("provider server error"); error.code = "PROVIDER_SERVER_ERROR"; throw error; }
        assert.equal(response.ok, true, `PROVIDER_HTTP_${response.status}`);
        return { rawResponseBytes, complete: rawResponseBytes.length <= maximumResponseBytes, provider: profile.providerIdentity, providerRequestId: response.headers.get("x-request-id"), startedAt, completedAt: new Date().toISOString() };
      } catch (error) {
        if (!error.code) error.code = error?.name === "AbortError" ? "PROVIDER_TIMEOUT" : "PROVIDER_CONNECTION_FAILURE";
        throw error;
      } finally { clearTimeout(timer); }
    }
  });
}
