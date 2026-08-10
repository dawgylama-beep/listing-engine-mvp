import assert from "node:assert/strict";

export const NOT_RECEIVED = "NOT_RECEIVED";
export const REDACTED = "REDACTED";
export const PROVIDER_RESPONSE_BODY_LIMIT_BYTES = 65_536;

const SECRET_PATTERNS = Object.freeze([
  /\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /\b(?:s[kK]|oai)[-_][A-Za-z0-9_-]{16,}/,
  /\bOPENAI_API_KEY\s*=\s*\S+/i,
  /\bauthorization\s*[:=]\s*(?!null\b|false\b|redacted\b)\S+/i,
  /\b(?:org|proj)[-_][A-Za-z0-9_-]{6,}/i,
  /\b(?:acct|cus)_[A-Za-z0-9_-]{6,}/i
]);

const DIAGNOSTIC_FIELDS = Object.freeze([
  "schemaVersion", "httpStatus", "errorType", "errorCode", "errorParam", "messageClassification",
  "safeProviderRequestId", "responseContentType", "responseByteLength", "responseByteLengthClassification",
  "responseBodyTruncated", "timeoutClassification", "networkConnectionClassification"
]);

const MESSAGE_CLASSIFICATIONS = Object.freeze([
  NOT_RECEIVED, "REDACTED_SECRET_MATERIAL", "STRUCTURED_OUTPUT_REJECTION", "AUTHENTICATION_REJECTION",
  "ACCESS_REJECTION", "MODEL_OR_ROUTE_REJECTION", "RATE_OR_QUOTA_REJECTION", "INVALID_REQUEST",
  "PROVIDER_FAILURE", "NON_JSON_ERROR_RESPONSE", "MALFORMED_JSON_ERROR_RESPONSE",
  "OVERSIZED_ERROR_RESPONSE", "OTHER_PROVIDER_ERROR"
]);

function containsSecretMaterial(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return SECRET_PATTERNS.some((pattern) => pattern.test(text || ""));
}

export function assertNoSecretMaterial(value, label = "artifact") {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of SECRET_PATTERNS) assert.doesNotMatch(text, pattern, `${label} contains secret-shaped material`);
  return true;
}

export function safeProviderRequestId(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9._:-]{1,128}$/.test(value)) return null;
  return containsSecretMaterial(value) ? null : value;
}

function normalizedProviderField(value) {
  if (value === null || value === undefined || value === "") return NOT_RECEIVED;
  const text = String(value).trim();
  if (containsSecretMaterial(text)) return REDACTED;
  if (!/^[A-Za-z0-9][A-Za-z0-9._:/\[\]-]{0,127}$/.test(text)) return REDACTED;
  return text.toLowerCase();
}

function normalizedContentType(value) {
  if (typeof value !== "string") return NOT_RECEIVED;
  const mediaType = value.split(";", 1)[0].trim().toLowerCase();
  if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]{1,96}$/.test(mediaType)) return NOT_RECEIVED;
  return mediaType;
}

function messageClassification({ status, errorType, errorCode, errorParam, message, parseState, bodyTruncated }) {
  if (bodyTruncated) return "OVERSIZED_ERROR_RESPONSE";
  if (parseState === "NON_JSON") return "NON_JSON_ERROR_RESPONSE";
  if (parseState === "MALFORMED_JSON") return "MALFORMED_JSON_ERROR_RESPONSE";
  const raw = [errorType, errorCode, errorParam, message].filter((value) => value !== null && value !== undefined).join(" ");
  if (containsSecretMaterial(raw)) return "REDACTED_SECRET_MATERIAL";
  const text = raw.toLowerCase();
  if (/json.?schema|structured.?output|response.?format|schema/.test(text)) return "STRUCTURED_OUTPUT_REJECTION";
  if (status === 401 || /auth|api.?key|credential|unauthoriz/.test(text)) return "AUTHENTICATION_REJECTION";
  if (status === 403 || /forbidden|permission|access/.test(text)) return "ACCESS_REJECTION";
  if (status === 404 || /model.*(?:not.?found|unavailable)|route.*not.?found/.test(text)) return "MODEL_OR_ROUTE_REJECTION";
  if (status === 429 || /rate|quota|billing|credit/.test(text)) return "RATE_OR_QUOTA_REJECTION";
  if (status >= 500) return "PROVIDER_FAILURE";
  if (status >= 400 && status < 500) return "INVALID_REQUEST";
  return "OTHER_PROVIDER_ERROR";
}

export function unavailableProviderDiagnostics({ timeoutClassification = NOT_RECEIVED, networkConnectionClassification = NOT_RECEIVED } = {}) {
  return Object.freeze({
    schemaVersion: "1.0", httpStatus: NOT_RECEIVED, errorType: NOT_RECEIVED, errorCode: NOT_RECEIVED,
    errorParam: NOT_RECEIVED, messageClassification: NOT_RECEIVED, safeProviderRequestId: NOT_RECEIVED,
    responseContentType: NOT_RECEIVED, responseByteLength: NOT_RECEIVED,
    responseByteLengthClassification: NOT_RECEIVED, responseBodyTruncated: NOT_RECEIVED,
    timeoutClassification, networkConnectionClassification
  });
}

export function normalizeProviderResponseDiagnostics({
  status, requestId, contentType, responseByteLength, responseBodyTruncated = false,
  payload = null, parseState = "JSON"
}) {
  assert.ok(Number.isInteger(status) && status >= 100 && status <= 599, "provider HTTP status is invalid");
  assert.ok(Number.isInteger(responseByteLength) && responseByteLength >= 0 && responseByteLength <= PROVIDER_RESPONSE_BODY_LIMIT_BYTES, "bounded provider response byte length is invalid");
  const isError = status < 200 || status >= 300;
  const error = isError && payload?.error && typeof payload.error === "object" && !Array.isArray(payload.error) ? payload.error : null;
  const diagnostic = {
    schemaVersion: "1.0",
    httpStatus: status,
    errorType: error ? normalizedProviderField(error.type) : NOT_RECEIVED,
    errorCode: error ? normalizedProviderField(error.code) : NOT_RECEIVED,
    errorParam: error ? normalizedProviderField(error.param) : NOT_RECEIVED,
    messageClassification: isError ? messageClassification({
      status, errorType: error?.type, errorCode: error?.code, errorParam: error?.param,
      message: error?.message, parseState, bodyTruncated: responseBodyTruncated
    }) : NOT_RECEIVED,
    safeProviderRequestId: safeProviderRequestId(requestId) || NOT_RECEIVED,
    responseContentType: normalizedContentType(contentType),
    responseByteLength,
    responseByteLengthClassification: responseBodyTruncated ? "LOWER_BOUND" : "EXACT",
    responseBodyTruncated,
    timeoutClassification: status === 408 || status === 504 ? "TIMEOUT" : "NOT_TIMEOUT",
    networkConnectionClassification: "HTTP_RESPONSE_RECEIVED"
  };
  assertProviderDiagnostics(diagnostic);
  return Object.freeze(diagnostic);
}

export function assertProviderDiagnostics(value) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), "provider diagnostics must be an object");
  assert.deepEqual(Object.keys(value).sort(), [...DIAGNOSTIC_FIELDS].sort(), "provider diagnostic fields differ");
  assert.equal(value.schemaVersion, "1.0");
  assert.ok(value.httpStatus === NOT_RECEIVED || (Number.isInteger(value.httpStatus) && value.httpStatus >= 100 && value.httpStatus <= 599));
  for (const field of ["errorType", "errorCode", "errorParam"]) {
    assert.equal(typeof value[field], "string");
    assert.ok(value[field] === NOT_RECEIVED || value[field] === REDACTED || /^[a-z0-9][a-z0-9._:/\[\]-]{0,127}$/.test(value[field]));
  }
  assert.ok(MESSAGE_CLASSIFICATIONS.includes(value.messageClassification));
  assert.equal(typeof value.safeProviderRequestId, "string");
  assert.ok(value.safeProviderRequestId === NOT_RECEIVED || safeProviderRequestId(value.safeProviderRequestId) === value.safeProviderRequestId);
  assert.equal(typeof value.responseContentType, "string");
  assert.ok(value.responseContentType === NOT_RECEIVED || /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]{1,96}$/.test(value.responseContentType));
  assert.ok(value.responseByteLength === NOT_RECEIVED || (Number.isInteger(value.responseByteLength) && value.responseByteLength >= 0 && value.responseByteLength <= PROVIDER_RESPONSE_BODY_LIMIT_BYTES));
  assert.ok([NOT_RECEIVED, "EXACT", "LOWER_BOUND"].includes(value.responseByteLengthClassification));
  assert.ok(value.responseBodyTruncated === NOT_RECEIVED || typeof value.responseBodyTruncated === "boolean");
  assert.ok([NOT_RECEIVED, "TIMEOUT", "NOT_TIMEOUT"].includes(value.timeoutClassification));
  assert.ok([NOT_RECEIVED, "HTTP_RESPONSE_RECEIVED", "CONNECTION_FAILURE"].includes(value.networkConnectionClassification));
  if (value.responseByteLength === NOT_RECEIVED) {
    assert.equal(value.responseByteLengthClassification, NOT_RECEIVED);
    assert.equal(value.responseBodyTruncated, NOT_RECEIVED);
  }
  if (Number.isInteger(value.httpStatus)) assert.equal(value.networkConnectionClassification, "HTTP_RESPONSE_RECEIVED");
  assertNoSecretMaterial(value, "provider diagnostics");
  return value;
}

export class SafeProviderFailure extends Error {
  constructor(code, httpStatus = null, providerDiagnostics = unavailableProviderDiagnostics()) {
    super(code);
    this.name = "SafeProviderFailure";
    this.code = code;
    this.httpStatus = Number.isInteger(httpStatus) ? httpStatus : null;
    this.providerDiagnostics = assertProviderDiagnostics(providerDiagnostics);
  }
}

export function classifyHttpFailure(status) {
  if (status === 401) return "AUTHENTICATION_REJECTED";
  if (status === 403) return "MODEL_ACCESS_FORBIDDEN";
  if (status === 404) return "MODEL_UNAVAILABLE";
  if (status === 408 || status === 504) return "PROVIDER_TIMEOUT";
  if (status === 429) return "PROVIDER_QUOTA_OR_RATE_LIMIT_REJECTED";
  if (status >= 500) return "PROVIDER_SERVER_REJECTED";
  return "PROVIDER_REQUEST_REJECTED";
}

export function safeFailureEvidence(error) {
  if (error instanceof SafeProviderFailure) return Object.freeze({ code: error.code, httpStatus: error.httpStatus, providerDiagnostics: error.providerDiagnostics });
  if (error?.name === "AbortError") return Object.freeze({
    code: "PROVIDER_TIMEOUT", httpStatus: null,
    providerDiagnostics: unavailableProviderDiagnostics({ timeoutClassification: "TIMEOUT" })
  });
  return Object.freeze({
    code: "SAFE_UNKNOWN_PROVIDER_FAILURE", httpStatus: null,
    providerDiagnostics: unavailableProviderDiagnostics({ timeoutClassification: "NOT_TIMEOUT", networkConnectionClassification: "CONNECTION_FAILURE" })
  });
}
