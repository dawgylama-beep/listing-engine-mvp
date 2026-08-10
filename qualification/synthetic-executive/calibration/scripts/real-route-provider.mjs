import assert from "node:assert/strict";
import { sha256Json } from "../../scripts/protocol.mjs";
import { assertCalibrationInferencePermit } from "./real-route-governor.mjs";
import { extractSafeUsage } from "./real-route-profile.mjs";
import {
  PROVIDER_RESPONSE_BODY_LIMIT_BYTES, SafeProviderFailure, classifyHttpFailure,
  normalizeProviderResponseDiagnostics, safeProviderRequestId, unavailableProviderDiagnostics
} from "./real-route-redaction.mjs";

function endpoint(profile, relativePath) {
  const url = new URL(relativePath, `${profile.apiBaseUrl}/`);
  assert.equal(url.protocol, "https:");
  assert.equal(profile.apiBaseDomainAllowlist.includes(url.hostname), true, "provider endpoint escaped allowlist");
  return url;
}

async function inspectProviderResponse(response) {
  const chunks = [];
  let responseByteLength = 0;
  let responseBodyTruncated = false;
  const append = (value) => {
    const bytes = Buffer.from(value);
    const remaining = PROVIDER_RESPONSE_BODY_LIMIT_BYTES - responseByteLength;
    if (bytes.length > remaining) {
      if (remaining > 0) chunks.push(bytes.subarray(0, remaining));
      responseByteLength += Math.max(0, remaining);
      responseBodyTruncated = true;
      return false;
    }
    chunks.push(bytes);
    responseByteLength += bytes.length;
    return true;
  };

  if (response.body?.getReader) {
    const reader = response.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!append(value)) break;
      }
    } finally {
      if (responseBodyTruncated) await reader.cancel().catch(() => {});
    }
  } else if (typeof response.arrayBuffer === "function") {
    append(new Uint8Array(await response.arrayBuffer()));
  } else if (typeof response.text === "function") {
    append(Buffer.from(await response.text(), "utf8"));
  } else {
    throw new SafeProviderFailure("PROVIDER_RESPONSE_BODY_UNAVAILABLE", response.status);
  }

  const bytes = Buffer.concat(chunks, responseByteLength);
  let payload = null;
  let parseState = "JSON";
  if (!responseBodyTruncated) {
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      payload = JSON.parse(text);
    } catch {
      const mediaType = String(response.headers?.get?.("content-type") || "").split(";", 1)[0].trim().toLowerCase();
      parseState = mediaType === "application/json" || mediaType.endsWith("+json") ? "MALFORMED_JSON" : "NON_JSON";
    }
  }
  const diagnostics = normalizeProviderResponseDiagnostics({
    status: response.status,
    requestId: response.headers?.get?.("x-request-id"),
    contentType: response.headers?.get?.("content-type"),
    responseByteLength,
    responseBodyTruncated,
    payload,
    parseState
  });
  return Object.freeze({ payload, parseState, responseBodyTruncated, diagnostics });
}

function outputText(payload, diagnostics) {
  for (const item of payload.output || []) {
    if (item?.type !== "message") continue;
    for (const content of item.content || []) {
      if (content?.type === "refusal") throw new SafeProviderFailure("PROVIDER_REFUSAL", 200, diagnostics);
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  throw new SafeProviderFailure("PROVIDER_STRUCTURED_OUTPUT_MISSING", 200, diagnostics);
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
  #metadataDiagnostics = unavailableProviderDiagnostics();
  #inferenceDiagnostics = unavailableProviderDiagnostics();

  constructor({ profile, credentialHandle, fetchImpl = globalThis.fetch, deadlineAtMs = Number.POSITIVE_INFINITY, nowMs = () => Date.now() }) {
    assert.equal(typeof fetchImpl, "function");
    this.#profile = profile; this.#credentialHandle = credentialHandle; this.#fetch = fetchImpl;
    this.#deadlineAtMs = deadlineAtMs; this.#nowMs = nowMs;
  }

  get counts() { return Object.freeze({ metadataAccessInvocations: this.#metadataRequests, inferenceInvocations: this.#inferenceRequests, metadataAccessRequests: this.#metadataDispatches, inferenceRequests: this.#inferenceDispatches, retries: 0 }); }
  get diagnostics() { return Object.freeze({ metadata: this.#metadataDiagnostics, inference: this.#inferenceDiagnostics }); }

  #retainDiagnostics(kind, diagnostics) {
    if (kind === "METADATA") this.#metadataDiagnostics = diagnostics;
    else this.#inferenceDiagnostics = diagnostics;
  }

  async #authorizedFetch(kind, url, options) {
    const controller = new AbortController();
    const remainingMs = Math.min(this.#profile.timeoutMs, this.#deadlineAtMs - this.#nowMs());
    if (remainingMs <= 0) {
      const diagnostics = unavailableProviderDiagnostics({ timeoutClassification: "TIMEOUT" });
      this.#retainDiagnostics(kind, diagnostics);
      throw new SafeProviderFailure("PROVIDER_TIMEOUT", null, diagnostics);
    }
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
      if (error?.name === "AbortError") {
        const diagnostics = unavailableProviderDiagnostics({ timeoutClassification: "TIMEOUT" });
        this.#retainDiagnostics(kind, diagnostics);
        throw new SafeProviderFailure("PROVIDER_TIMEOUT", null, diagnostics);
      }
      if (error instanceof SafeProviderFailure) { this.#retainDiagnostics(kind, error.providerDiagnostics); throw error; }
      const diagnostics = unavailableProviderDiagnostics({ timeoutClassification: "NOT_TIMEOUT", networkConnectionClassification: "CONNECTION_FAILURE" });
      this.#retainDiagnostics(kind, diagnostics);
      throw new SafeProviderFailure("PROVIDER_NETWORK_OUTCOME_UNKNOWN", null, diagnostics);
    } finally { clearTimeout(timer); }
  }

  async checkExactModelAccess({ requestedAt = new Date().toISOString() } = {}) {
    assert.equal(this.#metadataRequests, 0, "metadata access request ceiling exceeded");
    this.#metadataRequests += 1;
    const response = await this.#authorizedFetch("METADATA", endpoint(this.#profile, this.#profile.metadataEndpoint), { method: "GET" });
    const inspected = await inspectProviderResponse(response);
    const { diagnostics, payload } = inspected;
    this.#retainDiagnostics("METADATA", diagnostics);
    const providerRequestId = diagnostics.safeProviderRequestId === "NOT_RECEIVED" ? null : diagnostics.safeProviderRequestId;
    if (response.status >= 300 && response.status < 400) throw new SafeProviderFailure("PROVIDER_REDIRECT_REJECTED", response.status, diagnostics);
    if (!response.ok) throw new SafeProviderFailure(classifyHttpFailure(response.status), response.status, diagnostics);
    if (inspected.responseBodyTruncated) throw new SafeProviderFailure("PROVIDER_RESPONSE_TOO_LARGE", response.status, diagnostics);
    if (inspected.parseState !== "JSON") throw new SafeProviderFailure("PROVIDER_JSON_INVALID", response.status, diagnostics);
    const safe = {
      httpSuccessClass: "HTTP_2XX", returnedModelId: typeof payload.id === "string" ? payload.id : null,
      returnedObjectType: typeof payload.object === "string" ? payload.object : null,
      returnedOwnerCategory: typeof payload.owned_by === "string" && /^openai/i.test(payload.owned_by) ? "OPENAI" : (payload.owned_by ? "OTHER" : null),
      requestTimestamp: requestedAt, safeProviderRequestId: providerRequestId, providerDiagnostics: diagnostics
    };
    if (safe.returnedModelId !== this.#profile.exactModelId) throw new SafeProviderFailure("MODEL_ID_MISMATCH", response.status, diagnostics);
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
    const inspected = await inspectProviderResponse(response);
    const { diagnostics, payload } = inspected;
    this.#retainDiagnostics("INFERENCE", diagnostics);
    const providerRequestId = diagnostics.safeProviderRequestId === "NOT_RECEIVED" ? null : diagnostics.safeProviderRequestId;
    if (response.status >= 300 && response.status < 400) throw new SafeProviderFailure("PROVIDER_REDIRECT_REJECTED", response.status, diagnostics);
    if (!response.ok) throw new SafeProviderFailure(classifyHttpFailure(response.status), response.status, diagnostics);
    if (inspected.responseBodyTruncated) throw new SafeProviderFailure("PROVIDER_RESPONSE_TOO_LARGE", response.status, diagnostics);
    if (inspected.parseState !== "JSON") throw new SafeProviderFailure("PROVIDER_JSON_INVALID", response.status, diagnostics);
    if (payload.model !== this.#profile.exactModelId) throw new SafeProviderFailure("MODEL_ID_MISMATCH", response.status, diagnostics);
    if (payload.status !== "completed") throw new SafeProviderFailure(payload.status === "incomplete" ? "PROVIDER_RESPONSE_INCOMPLETE" : "PROVIDER_RESPONSE_NOT_COMPLETED", response.status, diagnostics);
    let actionCore;
    try { actionCore = JSON.parse(outputText(payload, diagnostics)); } catch (error) { if (error instanceof SafeProviderFailure) throw error; throw new SafeProviderFailure("PROVIDER_STRUCTURED_OUTPUT_MALFORMED", response.status, diagnostics); }
    const usage = extractSafeUsage(payload.usage);
    const safeCore = {
      providerResponseId: safeProviderRequestId(payload.id), providerRequestId, modelId: payload.model,
      responseStatus: payload.status, usage, actionCoreHash: sha256Json(actionCore), providerDiagnostics: diagnostics
    };
    return Object.freeze({ ...safeCore, safeResponseHash: sha256Json(safeCore), actionCore });
  }
}
