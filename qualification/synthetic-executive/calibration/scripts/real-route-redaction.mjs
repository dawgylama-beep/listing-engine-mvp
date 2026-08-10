import assert from "node:assert/strict";

const SECRET_PATTERNS = Object.freeze([
  /\bbearer\s+[A-Za-z0-9._~+/=-]{8,}/i,
  /\b(?:s[kK]|oai)[-_][A-Za-z0-9_-]{16,}/,
  /\bOPENAI_API_KEY\s*=\s*\S+/i,
  /\bauthorization\s*[:=]\s*(?!null\b|false\b|redacted\b)\S+/i
]);

export function assertNoSecretMaterial(value, label = "artifact") {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const pattern of SECRET_PATTERNS) assert.doesNotMatch(text, pattern, `${label} contains secret-shaped material`);
  return true;
}

export function safeProviderRequestId(value) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{1,128}$/.test(value) ? value : null;
}

export class SafeProviderFailure extends Error {
  constructor(code, httpStatus = null) {
    super(code);
    this.name = "SafeProviderFailure";
    this.code = code;
    this.httpStatus = Number.isInteger(httpStatus) ? httpStatus : null;
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
  if (error instanceof SafeProviderFailure) return Object.freeze({ code: error.code, httpStatus: error.httpStatus });
  if (error?.name === "AbortError") return Object.freeze({ code: "PROVIDER_TIMEOUT", httpStatus: null });
  return Object.freeze({ code: "SAFE_UNKNOWN_PROVIDER_FAILURE", httpStatus: null });
}
