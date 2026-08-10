import assert from "node:assert/strict";
import { sha256Json } from "../../scripts/protocol.mjs";
import { assertCalibrationInferencePermit } from "./real-route-governor.mjs";
import { extractSafeUsage } from "./real-route-profile.mjs";
import { SafeProviderFailure, classifyHttpFailure, safeProviderRequestId } from "./real-route-redaction.mjs";

function endpoint(profile, relativePath) {
  const url = new URL(relativePath, `${profile.apiBaseUrl}/`);
  assert.equal(url.protocol, "https:");
  assert.equal(profile.apiBaseDomainAllowlist.includes(url.hostname), true, "provider endpoint escaped allowlist");
  return url;
}

async function parseJson(response) {
  try { return await response.json(); } catch { throw new SafeProviderFailure("PROVIDER_JSON_INVALID", response.status); }
}

function outputText(payload) {
  for (const item of payload.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item.content || []) {
      if (content?.type === "refusal") throw new SafeProviderFailure("PROVIDER_REFUSAL", 200);
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new SafeProviderFailure("PROVIDER_STRUCTURED_OUTPUT_MISSING", 200);
}

export class OpenAIRealRouteClient {
  #profile;
  #credentialHandle;
  #fetch;
  #metadataRequests = 0;
  #inferenceRequests = 0;
  #metadataDispatches = 0;
  #inferenceDispatches = 0;
  #deadlineAtMs;
  #nowMs;

  constructor({ profile, credentialHandle, fetchImpl = globalThis.fetch, deadlineAtMs = Number.POSITIVE_INFINITY, nowMs = () => Date.now() }) {
    assert.equal(typeof fetchImpl, "function");
    this.#profile = profile; this.#credentialHandle = credentialHandle; this.#fetch = fetchImpl;
    this.#deadlineAtMs = deadlineAtMs; this.#nowMs = nowMs;
  }

  get counts() { return Object.freeze({ metadataAccessInvocations: this.#metadataRequests, inferenceInvocations: this.#inferenceRequests, metadataAccessRequests: this.#metadataDispatches, inferenceRequests: this.#inferenceDispatches, retries: 0 }); }

  async #authorizedFetch(kind, url, options) {
    const controller = new AbortController();
    const remainingMs = Math.min(this.#profile.timeoutMs, this.#deadlineAtMs - this.#nowMs());
    if (remainingMs <= 0) throw new SafeProviderFailure("PROVIDER_TIMEOUT");
    const timer = setTimeout(() => controller.abort(), remainingMs);
    try {
      return await this.#credentialHandle.withCredential((credential) => {
        if (kind === "METADATA") this.#metadataDispatches += 1;
        else this.#inferenceDispatches += 1;
        return this.#fetch(url, {
          ...options, redirect: "manual", signal: controller.signal,
          headers: { "content-type": "application/json", authorization: `Bearer ${credential}` }
        });
      });
    } catch (error) {
      if (error?.name === "AbortError") throw new SafeProviderFailure("PROVIDER_TIMEOUT");
      if (error instanceof SafeProviderFailure) throw error;
      throw new SafeProviderFailure("PROVIDER_NETWORK_OUTCOME_UNKNOWN");
    } finally { clearTimeout(timer); }
  }

  async checkExactModelAccess({ requestedAt = new Date().toISOString() } = {}) {
    assert.equal(this.#metadataRequests, 0, "metadata access request ceiling exceeded");
    this.#metadataRequests += 1;
    const response = await this.#authorizedFetch("METADATA", endpoint(this.#profile, this.#profile.metadataEndpoint), { method: "GET" });
    const providerRequestId = safeProviderRequestId(response.headers?.get?.("x-request-id"));
    if (response.status >= 300 && response.status < 400) throw new SafeProviderFailure("PROVIDER_REDIRECT_REJECTED", response.status);
    if (!response.ok) throw new SafeProviderFailure(classifyHttpFailure(response.status), response.status);
    const payload = await parseJson(response);
    const safe = {
      httpSuccessClass: "HTTP_2XX", returnedModelId: typeof payload.id === "string" ? payload.id : null,
      returnedObjectType: typeof payload.object === "string" ? payload.object : null,
      returnedOwnerCategory: typeof payload.owned_by === "string" && /^openai/i.test(payload.owned_by) ? "OPENAI" : (payload.owned_by ? "OTHER" : null),
      requestTimestamp: requestedAt, safeProviderRequestId: providerRequestId
    };
    if (safe.returnedModelId !== this.#profile.exactModelId) throw new SafeProviderFailure("MODEL_ID_MISMATCH", response.status);
    return Object.freeze({ ...safe, canonicalSafeResponseHash: sha256Json(safe) });
  }

  async inferStructuredAction({ permit, prompt, structuredSchema }) {
    assertCalibrationInferencePermit(permit, { authorityHash: permit.authorityHash, modelIdentity: this.#profile.exactModelId });
    assert.equal(this.#inferenceRequests, 0, "inference request ceiling exceeded");
    this.#inferenceRequests += 1;
    const body = {
      model: this.#profile.exactModelId,
      reasoning: { effort: this.#profile.reasoning.effort },
      store: false, background: false, stream: false, tools: [], max_output_tokens: this.#profile.ceilings.maximumOutputTokens,
      input: [{ role: "user", content: [{ type: "input_text", text: prompt }] }],
      text: { format: { type: "json_schema", name: "katherine_executive_action_core_v1", strict: true, schema: structuredSchema } }
    };
    const response = await this.#authorizedFetch("INFERENCE", endpoint(this.#profile, this.#profile.inferenceEndpoint), { method: "POST", body: JSON.stringify(body) });
    const providerRequestId = safeProviderRequestId(response.headers?.get?.("x-request-id"));
    if (response.status >= 300 && response.status < 400) throw new SafeProviderFailure("PROVIDER_REDIRECT_REJECTED", response.status);
    if (!response.ok) throw new SafeProviderFailure(classifyHttpFailure(response.status), response.status);
    const payload = await parseJson(response);
    if (payload.model !== this.#profile.exactModelId) throw new SafeProviderFailure("MODEL_ID_MISMATCH", response.status);
    if (payload.status !== "completed") throw new SafeProviderFailure(payload.status === "incomplete" ? "PROVIDER_RESPONSE_INCOMPLETE" : "PROVIDER_RESPONSE_NOT_COMPLETED", response.status);
    let actionCore;
    try { actionCore = JSON.parse(outputText(payload)); } catch (error) { if (error instanceof SafeProviderFailure) throw error; throw new SafeProviderFailure("PROVIDER_STRUCTURED_OUTPUT_MALFORMED", response.status); }
    const usage = extractSafeUsage(payload.usage);
    const safeCore = {
      providerResponseId: safeProviderRequestId(payload.id), providerRequestId, modelId: payload.model,
      responseStatus: payload.status, usage, actionCoreHash: sha256Json(actionCore)
    };
    return Object.freeze({ ...safeCore, safeResponseHash: sha256Json(safeCore), actionCore });
  }
}
