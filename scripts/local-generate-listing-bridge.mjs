import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const PROTOCOL_VERSION = 1;
const MAX_REQUEST_BODY_BYTES = 30 * 1024 * 1024;
const MAX_INPUT_ENVELOPE_BYTES = 44 * 1024 * 1024;
const MAX_RESPONSE_BODY_BYTES = 30 * 1024 * 1024;
const ALLOWED_ADAPTER_KEYS = new Set([
  "getOpenAIApiKey",
  "getOpenAIModel",
  "getSerperApiKey",
  "requestOpenAIJson",
  "requestSerperSearch",
  "requestBoundedRetailProductPage",
  "nowMilliseconds",
  "nowIso",
  "createAnalysisId",
  "onFinalEvidenceResult"
]);
const SAFE_RESPONSE_HEADERS = new Set([
  "cache-control",
  "content-language",
  "content-type",
  "etag",
  "last-modified",
  "retry-after",
  "vary",
  "x-request-id"
]);

const writeProtocol = process.stdout.write.bind(process.stdout);
const writeDiagnostic = process.stderr.write.bind(process.stderr);

function fixedDiagnostic(message) {
  writeDiagnostic(`local-generate-listing-bridge: ${message}\n`);
}

process.stdout.write = () => {
  fixedDiagnostic("suppressed unexpected handler stdout");
  return true;
};
for (const method of ["debug", "info", "log", "warn", "error"]) {
  console[method] = () => fixedDiagnostic("suppressed handler diagnostic");
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function decodeBase64(value, maximumBytes) {
  if (typeof value !== "string" || value.length > Math.ceil(maximumBytes / 3) * 4 + 4) {
    throw new Error("invalid_base64");
  }
  if (value.length % 4 !== 0 || (value && !/^[A-Za-z0-9+/]*={0,2}$/.test(value))) {
    throw new Error("invalid_base64");
  }
  const decoded = Buffer.from(value, "base64");
  if (decoded.length > maximumBytes || decoded.toString("base64") !== value) {
    throw new Error("invalid_base64");
  }
  return decoded;
}

function normalizeRequestHeaders(value) {
  if (!isPlainObject(value) || Object.keys(value).length > 64) {
    throw new Error("invalid_request_headers");
  }
  const headers = {};
  for (const [name, headerValue] of Object.entries(value)) {
    if (
      typeof name !== "string"
      || !/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(name)
      || typeof headerValue !== "string"
      || headerValue.length > 8192
      || /[\r\n]/.test(headerValue)
    ) {
      throw new Error("invalid_request_headers");
    }
    headers[name.toLowerCase()] = headerValue;
  }
  return headers;
}

async function readInputEnvelope() {
  const chunks = [];
  let totalBytes = 0;
  for await (const chunk of process.stdin) {
    totalBytes += chunk.length;
    if (totalBytes > MAX_INPUT_ENVELOPE_BYTES) {
      throw new Error("input_envelope_too_large");
    }
    chunks.push(chunk);
  }
  if (totalBytes === 0) {
    throw new Error("missing_input_envelope");
  }

  const envelope = JSON.parse(Buffer.concat(chunks, totalBytes).toString("utf8"));
  if (
    !isPlainObject(envelope)
    || envelope.protocolVersion !== PROTOCOL_VERSION
    || typeof envelope.method !== "string"
    || !/^[A-Z]+$/.test(envelope.method)
    || typeof envelope.url !== "string"
    || envelope.url.length < 1
    || envelope.url.length > 8192
    || typeof envelope.correlationId !== "string"
    || !/^ke-local-[a-f0-9]{32}$/.test(envelope.correlationId)
  ) {
    throw new Error("invalid_input_envelope");
  }

  return {
    method: envelope.method,
    url: envelope.url,
    headers: normalizeRequestHeaders(envelope.headers),
    rawBody: decodeBase64(envelope.rawBodyBase64, MAX_REQUEST_BODY_BYTES)
  };
}

async function loadAdapters() {
  const modulePath = String(process.env.KATHERINES_EYE_HANDLER_ADAPTER_MODULE || "").trim();
  if (!modulePath) {
    return {};
  }
  if (!path.isAbsolute(modulePath) || /^[a-z][a-z0-9+.-]*:/i.test(modulePath.replace(/^[A-Za-z]:[\\/]/, ""))) {
    throw new Error("invalid_adapter_module_path");
  }
  const resolvedPath = path.resolve(modulePath);
  if (!fs.statSync(resolvedPath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error("adapter_module_not_found");
  }

  const imported = await import(pathToFileURL(resolvedPath).href);
  const adapters = imported.default;
  if (!isPlainObject(adapters)) {
    throw new Error("invalid_adapter_module");
  }
  for (const [key, value] of Object.entries(adapters)) {
    if (!ALLOWED_ADAPTER_KEYS.has(key) || typeof value !== "function") {
      throw new Error("invalid_adapter_contract");
    }
  }
  return adapters;
}

function createResponseCapture() {
  const headers = new Map();
  let statusCode = 200;
  let responseBody = null;
  let completed = false;

  const finish = (body) => {
    if (completed) {
      throw new Error("duplicate_handler_response");
    }
    const bytes = Buffer.isBuffer(body) ? body : Buffer.from(String(body ?? ""), "utf8");
    if (bytes.length > MAX_RESPONSE_BODY_BYTES) {
      throw new Error("handler_response_too_large");
    }
    responseBody = bytes;
    completed = true;
    return response;
  };

  const response = {
    status(code) {
      if (!Number.isInteger(code) || code < 100 || code > 599) {
        throw new Error("invalid_handler_status");
      }
      statusCode = code;
      return response;
    },
    setHeader(name, value) {
      const normalizedName = String(name || "").toLowerCase();
      const normalizedValue = Array.isArray(value) ? value.join(", ") : String(value ?? "");
      if (
        !SAFE_RESPONSE_HEADERS.has(normalizedName)
        || normalizedValue.length > 8192
        || /[\r\n]/.test(normalizedValue)
      ) {
        throw new Error("unsafe_handler_response_header");
      }
      headers.set(normalizedName, normalizedValue);
      return response;
    },
    getHeader(name) {
      return headers.get(String(name || "").toLowerCase());
    },
    json(payload) {
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json; charset=utf-8");
      }
      return finish(JSON.stringify(payload));
    },
    send(payload) {
      return finish(payload);
    },
    end(payload = "") {
      return finish(payload);
    }
  };

  return {
    response,
    result() {
      if (!completed || responseBody === null) {
        throw new Error("handler_did_not_complete_response");
      }
      return {
        protocolVersion: PROTOCOL_VERSION,
        statusCode,
        headers: Object.fromEntries(headers),
        rawBodyBase64: responseBody.toString("base64")
      };
    }
  };
}

async function main() {
  const requestEnvelope = await readInputEnvelope();
  const adapters = await loadAdapters();
  const handlerModuleUrl = new URL("../api/generate-listing.js", import.meta.url);
  const { createGenerateListingHandler } = await import(handlerModuleUrl.href);
  if (typeof createGenerateListingHandler !== "function") {
    throw new Error("production_handler_export_unavailable");
  }

  const handler = createGenerateListingHandler(adapters);
  const capture = createResponseCapture();
  await handler({
    method: requestEnvelope.method,
    url: requestEnvelope.url,
    headers: requestEnvelope.headers,
    body: requestEnvelope.rawBody.toString("utf8")
  }, capture.response);

  writeProtocol(JSON.stringify(capture.result()));
}

try {
  await main();
} catch {
  fixedDiagnostic("bridge failure");
  process.exitCode = 1;
}
