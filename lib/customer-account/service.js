import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const CUSTOMER_ACCOUNT_SCHEMA_VERSION = "2.1";
export const CUSTOMER_HISTORY_SCHEMA_VERSION = "1.0";
export const DEFAULT_HISTORY_RETENTION_DAYS = 30;
export const ALLOWED_HISTORY_RETENTION_DAYS = Object.freeze([7, 30, 90]);
export const MAX_PREFERRED_NAME_CHARACTERS = 60;

const SUPPORTED_CUSTOMER_ACCOUNT_SCHEMA_VERSIONS = new Set(["1.0", "2.0", CUSTOMER_ACCOUNT_SCHEMA_VERSION]);
const REQUIRED_ACCOUNT_RECORD_FIELDS = Object.freeze([
  "id", "username", "usernameKey", "password", "createdAt", "updatedAt", "preferences"
]);
const ALLOWED_ACCOUNT_RECORD_FIELDS = new Set([...REQUIRED_ACCOUNT_RECORD_FIELDS, "preferredName"]);

const MAX_HISTORY_ITEMS = 50;
const MAX_SNAPSHOT_BYTES = 196 * 1024;
const MAX_ACCOUNT_EXPORT_BYTES = 10 * 1024 * 1024;
const ANALYSIS_RECOVERY_LIFETIME_MILLISECONDS = 60 * 60 * 1000;
const ANALYSIS_DISPATCH_TIMEOUT_MILLISECONDS = 10 * 60 * 1000;
const MAX_ANALYSIS_RECOVERIES_PER_ACCOUNT = 4;
const MAX_ANALYSIS_RECOVERIES_TOTAL = 12;
const MAX_ANALYSIS_REPLAY_MARKERS_PER_ACCOUNT = 5000;
const MAX_ANALYSIS_REPLAY_MARKERS_TOTAL = 20000;
const MAX_ANALYSIS_RECOVERY_RESPONSE_BYTES = 1024 * 1024;
const ANALYSIS_ID_PATTERN = /^[A-Za-z0-9-]{8,120}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SESSION_LIFETIME_MILLISECONDS = 12 * 60 * 60 * 1000;
const AUTHENTICATION_WINDOW_MILLISECONDS = 15 * 60 * 1000;
const AUTHENTICATION_IDENTITY_LIMIT = 8;
const AUTHENTICATION_SOURCE_LIMIT = 40;
const MAX_AUTHENTICATION_THROTTLE_RECORDS = 2048;
const SCRYPT_PARAMETERS = Object.freeze({ N: 16384, r: 8, p: 1, keyLength: 32, maxmem: 64 * 1024 * 1024 });
const SCRYPT_OPTIONS = Object.freeze({ N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const DUMMY_PASSWORD_RECORD = Object.freeze({
  algorithm: "scrypt-v2",
  parameters: SCRYPT_PARAMETERS,
  salt: "AAAAAAAAAAAAAAAAAAAAAA",
  digest: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
});
const RESERVED_USERNAMES = new Set([
  "account",
  "admin",
  "administrator",
  "api",
  "help",
  "history",
  "katherine",
  "katherineseye",
  "moderator",
  "privacy",
  "root",
  "security",
  "staff",
  "support",
  "system"
]);

function cleanText(value, maximumCharacters = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maximumCharacters);
}

function completeSnapshotText(value, maximumCharacters = 32000) {
  const result = String(value ?? "").replace(/\s+/g, " ").trim();
  if (result.length > maximumCharacters) {
    throw customerError(413, "history_snapshot_too_large", "This result is too large to save safely.");
  }
  return result;
}

function completeSnapshotList(value, maximumItems = 64) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  if (values.length > maximumItems) {
    throw customerError(413, "history_snapshot_too_large", "This result contains too many details to save safely.");
  }
  return [...new Set(values.map((item) => completeSnapshotText(item, 4000)).filter(Boolean))];
}

function cleanRequestObservations(value) {
  const observations = Array.isArray(value) ? value : [];
  if (observations.length > 20) throw customerError(413, "history_snapshot_too_large", "This result contains too many provider observations to save safely.");
  return observations.map((observation) => ({
    purpose: completeSnapshotText(observation?.purpose, 160),
    status: completeSnapshotText(observation?.status, 80),
    reportedTokens: Object.fromEntries(["inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens"]
      .filter((key) => Number.isSafeInteger(observation?.reportedTokens?.[key]) && observation.reportedTokens[key] >= 0)
      .map((key) => [key, observation.reportedTokens[key]]))
  }));
}

function cleanStringList(value, maximumItems = 12, maximumCharacters = 240) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return [...new Set(values.map((item) => cleanText(item, maximumCharacters)).filter(Boolean))].slice(0, maximumItems);
}

function base64Url(bytes) {
  return Buffer.from(bytes).toString("base64url");
}

function sha256(value) {
  return crypto.createHash("sha256").update(String(value)).digest("hex");
}

function clone(value) {
  return structuredClone(value);
}

function isPlainRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasBoundedAccountRecordFields(value) {
  return REQUIRED_ACCOUNT_RECORD_FIELDS.every((field) => Object.hasOwn(value, field))
    && Object.keys(value).every((field) => ALLOWED_ACCOUNT_RECORD_FIELDS.has(field));
}

function emptyState() {
  return {
    schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
    revision: 0,
    accounts: {},
    usernameIndex: {},
    sessions: {},
    histories: {},
    analysisRecoveries: {},
    analysisReplay: {},
    authenticationThrottle: {}
  };
}

function normalizeState(value) {
  if (!isPlainRecord(value)) throw new Error("Customer account store has an invalid state envelope.");
  const sourceSchemaVersion = String(value.schemaVersion || "");
  if (!SUPPORTED_CUSTOMER_ACCOUNT_SCHEMA_VERSIONS.has(sourceSchemaVersion)) {
    throw new Error("Customer account store schema is unsupported.");
  }
  for (const field of ["accounts", "usernameIndex", "sessions", "histories"]) {
    if (!isPlainRecord(value[field])) throw new Error(`Customer account store field ${field} is invalid.`);
  }
  if (value.authenticationThrottle !== undefined && !isPlainRecord(value.authenticationThrottle)) {
    throw new Error("Customer account authentication throttle state is invalid.");
  }
  if (value.analysisRecoveries !== undefined && !isPlainRecord(value.analysisRecoveries)) {
    throw new Error("Customer account analysis recovery state is invalid.");
  }
  if (value.analysisReplay !== undefined && !isPlainRecord(value.analysisReplay)) {
    throw new Error("Customer account analysis replay state is invalid.");
  }
  const state = {
    schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
    revision: Number.isSafeInteger(value.revision) && value.revision >= 0 ? value.revision : 0,
    accounts: value.accounts,
    usernameIndex: value.usernameIndex,
    sessions: value.sessions,
    histories: value.histories,
    analysisRecoveries: value.analysisRecoveries || {},
    analysisReplay: value.analysisReplay || {},
    authenticationThrottle: value.authenticationThrottle || {}
  };
  for (const [accountId, account] of Object.entries(state.accounts)) {
    if (!/^account_[A-Za-z0-9_-]{24}$/.test(accountId) || !isPlainRecord(account)
      || !hasBoundedAccountRecordFields(account) || account.id !== accountId
      || normalizeUsername(account.username) !== account.usernameKey) {
      throw new Error("Customer account store contains an invalid account record.");
    }
    if (Object.hasOwn(account, "preferredName")) {
      const preferredNameResult = validatePreferredName(account.preferredName);
      if (!preferredNameResult.ok || preferredNameResult.preferredName !== account.preferredName) {
        throw new Error("Customer account store contains an invalid preferred name.");
      }
    }
    if (state.usernameIndex[account.usernameKey] !== accountId || !isPlainRecord(state.histories[accountId])) {
      throw new Error("Customer account store ownership index is inconsistent.");
    }
  }
  for (const [usernameKey, accountId] of Object.entries(state.usernameIndex)) {
    if (!state.accounts[accountId] || state.accounts[accountId].usernameKey !== usernameKey) {
      throw new Error("Customer account store username index is inconsistent.");
    }
  }
  for (const [tokenHash, session] of Object.entries(state.sessions)) {
    if (!/^[a-f0-9]{64}$/.test(tokenHash) || !isPlainRecord(session) || !state.accounts[session.accountId]) {
      throw new Error("Customer account store contains an invalid session record.");
    }
  }
  for (const [accountId, listings] of Object.entries(state.histories)) {
    if (!state.accounts[accountId]) throw new Error("Customer account store contains orphaned history.");
    for (const [listingId, listing] of Object.entries(listings)) {
      if (!/^listing_[A-Za-z0-9_-]{24}$/.test(listingId) || !isPlainRecord(listing) || listing.id !== listingId || listing.ownerAccountId !== accountId) {
        throw new Error("Customer account store contains an invalid history record.");
      }
    }
  }
  for (const [accountId, recoveries] of Object.entries(state.analysisRecoveries)) {
    if (!state.accounts[accountId] || !isPlainRecord(recoveries)) throw new Error("Customer account analysis recovery ownership is invalid.");
    for (const [analysisId, recovery] of Object.entries(recoveries)) {
      if (!/^[A-Za-z0-9-]{8,120}$/.test(analysisId) || !isPlainRecord(recovery)
        || recovery.analysisId !== analysisId || !/^recovery_[A-Za-z0-9_-]{32}$/.test(recovery.recoveryId)
        || !/^[a-f0-9]{64}$/.test(recovery.requestHash)
        || !Array.isArray(recovery.photoHashes) || !recovery.photoHashes.length || recovery.photoHashes.length > 6
        || recovery.photoHashes.some((hash) => !/^[a-f0-9]{64}$/.test(hash))
        || !["REGISTERED", "DISPATCHING", "SUCCEEDED", "FAILED_TERMINAL"].includes(recovery.state)
        || !Number.isSafeInteger(recovery.createdAtMilliseconds) || !Number.isSafeInteger(recovery.expiresAtMilliseconds)
        || recovery.expiresAtMilliseconds - recovery.createdAtMilliseconds !== ANALYSIS_RECOVERY_LIFETIME_MILLISECONDS
        || (recovery.state === "REGISTERED" ? recovery.dispatchedAtMilliseconds !== null : !Number.isSafeInteger(recovery.dispatchedAtMilliseconds))
        || (["SUCCEEDED", "FAILED_TERMINAL"].includes(recovery.state)
          ? !Number.isInteger(recovery.statusCode) || typeof recovery.responseJson !== "string"
          : recovery.statusCode !== null || recovery.responseJson !== null)
        || (recovery.responseJson !== null && (typeof recovery.responseJson !== "string" || Buffer.byteLength(recovery.responseJson, "utf8") > MAX_ANALYSIS_RECOVERY_RESPONSE_BYTES))) {
        throw new Error("Customer account analysis recovery record is invalid.");
      }
    }
  }
  let replayMarkerCount = 0;
  for (const [accountId, markers] of Object.entries(state.analysisReplay)) {
    if (!state.accounts[accountId] || !isPlainRecord(markers)
      || Object.keys(markers).length > MAX_ANALYSIS_REPLAY_MARKERS_PER_ACCOUNT
      || Object.entries(markers).some(([key, value]) => !SHA256_PATTERN.test(key) || value !== true)) {
      throw new Error("Customer account analysis replay state is invalid.");
    }
    replayMarkerCount += Object.keys(markers).length;
  }
  if (replayMarkerCount > MAX_ANALYSIS_REPLAY_MARKERS_TOTAL) throw new Error("Customer account analysis replay state exceeds its bound.");
  for (const [throttleKey, throttle] of Object.entries(state.authenticationThrottle)) {
    if (!/^(?:identity|source)_[a-f0-9]{64}$/.test(throttleKey) || !isPlainRecord(throttle)) {
      throw new Error("Customer account store contains an invalid throttle record.");
    }
  }
  return state;
}

export function normalizeUsername(value) {
  return cleanText(value, 64).normalize("NFKC").toLowerCase();
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!/^[a-z][a-z0-9_]{2,23}$/.test(username)) {
    return {
      ok: false,
      code: "invalid_username",
      message: "Use 3–24 characters, beginning with a letter, using only letters, numbers, and underscores."
    };
  }
  if (RESERVED_USERNAMES.has(username)) {
    return { ok: false, code: "reserved_username", message: "That username is reserved. Choose another." };
  }
  return { ok: true, username, usernameKey: username };
}

export function validatePassword(value) {
  const password = String(value ?? "");
  if (password.length < 10 || password.length > 128) {
    return { ok: false, code: "invalid_password", message: "Use a password between 10 and 128 characters." };
  }
  return { ok: true, password };
}

export function validatePreferredName(value) {
  if (typeof value !== "string") {
    return { ok: false, code: "invalid_preferred_name", message: `Use a preferred name between 1 and ${MAX_PREFERRED_NAME_CHARACTERS} characters.` };
  }
  const preferredName = value.trim();
  if (!preferredName || Array.from(preferredName).length > MAX_PREFERRED_NAME_CHARACTERS
    || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(preferredName)) {
    return { ok: false, code: "invalid_preferred_name", message: `Use a preferred name between 1 and ${MAX_PREFERRED_NAME_CHARACTERS} characters without control characters.` };
  }
  return { ok: true, preferredName };
}

function passwordRecord(password, randomBytes) {
  const salt = randomBytes(16);
  const digest = crypto.scryptSync(password, salt, SCRYPT_PARAMETERS.keyLength, SCRYPT_OPTIONS);
  return { algorithm: "scrypt-v2", parameters: SCRYPT_PARAMETERS, salt: base64Url(salt), digest: base64Url(digest) };
}

function validatedPasswordRecord(record = {}) {
  if (!isPlainRecord(record) || !["scrypt-v1", "scrypt-v2"].includes(record.algorithm)) return null;
  if (record.algorithm === "scrypt-v2") {
    const parameters = record.parameters;
    if (!isPlainRecord(parameters) || Object.keys(SCRYPT_PARAMETERS).some((key) => parameters[key] !== SCRYPT_PARAMETERS[key])) return null;
  }
  try {
    const salt = Buffer.from(String(record.salt || ""), "base64url");
    const digest = Buffer.from(String(record.digest || ""), "base64url");
    if (salt.length !== 16 || digest.length !== SCRYPT_PARAMETERS.keyLength) return null;
    if (base64Url(salt) !== record.salt || base64Url(digest) !== record.digest) return null;
    return { ...record, salt, digest };
  } catch {
    return null;
  }
}

function passwordMatches(password, record = DUMMY_PASSWORD_RECORD) {
  const validated = validatedPasswordRecord(record) || validatedPasswordRecord(DUMMY_PASSWORD_RECORD);
  const actual = crypto.scryptSync(String(password ?? ""), validated.salt, SCRYPT_PARAMETERS.keyLength, SCRYPT_OPTIONS);
  return Boolean(validatedPasswordRecord(record)) && crypto.timingSafeEqual(validated.digest, actual);
}

function customerError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function throwServiceFailure(failure) {
  const error = customerError(failure.status, failure.code, failure.message);
  if (failure.retryAfterSeconds) error.retryAfterSeconds = failure.retryAfterSeconds;
  throw error;
}

function publicAccount(account = {}) {
  return {
    id: account.id,
    username: account.username,
    preferredName: account.preferredName || account.username,
    createdAt: account.createdAt,
    preferences: {
      historyRetentionDays: Number(account.preferences?.historyRetentionDays || DEFAULT_HISTORY_RETENTION_DAYS),
      imageRetention: "none"
    }
  };
}

function publicListing(listing = {}, { summary = false } = {}) {
  const { ownerAccountId, expiresAtMilliseconds, snapshot, ...publicFields } = listing;
  return summary
    ? { ...publicFields, workflow: snapshot?.workflow || "", imageRetention: "none" }
    : { ...publicFields, snapshot: clone(snapshot || {}) };
}

function safeUrl(value) {
  const text = completeSnapshotText(value, 2048);
  if (!text) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function cleanEvidence(value) {
  const records = Array.isArray(value) ? value : [];
  if (records.length > 40) throw customerError(413, "history_snapshot_too_large", "This result contains too many sources to save safely.");
  return records.map((record) => ({
    source: completeSnapshotText(record?.source, 4000),
    title: completeSnapshotText(record?.title, 4000),
    match: completeSnapshotText(record?.match, 4000),
    price: completeSnapshotText(record?.price, 4000),
    deliveredCost: completeSnapshotText(record?.deliveredCost, 4000),
    availability: completeSnapshotText(record?.availability, 4000),
    limitation: completeSnapshotText(record?.limitation, 4000),
    sourceRecordId: completeSnapshotText(record?.sourceRecordId, 2048),
    acquisitionProvider: completeSnapshotText(record?.acquisitionProvider, 256),
    url: record?.sourceRecordId && record?.acquisitionProvider ? safeUrl(record?.url) : ""
  })).filter((record) => Object.values(record).some(Boolean));
}

function hasBoundedTotalProviderReservation(metering = {}) {
  return metering.reservationScope === "TOTAL_PROVIDER_CONSERVATIVE_EXPOSURE"
    && Number.isFinite(metering.modelReservedUpperBoundDollars)
    && Number.isFinite(metering.serperReservedUpperBoundDollars)
    && Number.isFinite(metering.maximumAuthorizedDollars)
    && Number.isSafeInteger(metering.searchProviderAttempts)
    && Number.isSafeInteger(metering.serperAttemptCeiling)
    && metering.searchProviderAttempts >= 0
    && metering.searchProviderAttempts <= metering.serperAttemptCeiling
    && metering.modelReservedUpperBoundDollars >= 0
    && metering.serperReservedUpperBoundDollars >= 0
    && metering.modelReservedUpperBoundDollars + metering.serperReservedUpperBoundDollars
      <= metering.maximumAuthorizedDollars + 1e-8;
}

function validateAnalysisIdentity({ analysisId, requestHash, photoHashes, recoveryId = "" }, { requireRecoveryId = false } = {}) {
  if (!ANALYSIS_ID_PATTERN.test(String(analysisId || "")) || !SHA256_PATTERN.test(String(requestHash || ""))
    || !Array.isArray(photoHashes) || photoHashes.length < 1 || photoHashes.length > 6
    || photoHashes.some((hash) => !SHA256_PATTERN.test(String(hash || "")))
    || (requireRecoveryId && !/^recovery_[A-Za-z0-9_-]{32}$/.test(String(recoveryId || "")))) {
    throw customerError(400, "analysis_recovery_identity_invalid", "This analysis reference is invalid.");
  }
}

function publicAnalysisRecovery(record, currentTime) {
  if (!record) return { state: "UNKNOWN" };
  const state = record.state === "DISPATCHING"
    && currentTime - record.dispatchedAtMilliseconds >= ANALYSIS_DISPATCH_TIMEOUT_MILLISECONDS
    ? "UNKNOWN" : record.state;
  return {
    analysisId: record.analysisId,
    recoveryId: record.recoveryId,
    state,
    expiresAt: new Date(record.expiresAtMilliseconds).toISOString(),
    ...(state === "SUCCEEDED" || state === "FAILED_TERMINAL"
      ? { statusCode: record.statusCode, response: JSON.parse(record.responseJson) } : {})
  };
}

export function sanitizeHistorySnapshot(value = {}) {
  const boundedTotalProviderReservation = hasBoundedTotalProviderReservation(value.metering);
  const snapshot = {
    schemaVersion: CUSTOMER_HISTORY_SCHEMA_VERSION,
    workflow: cleanText(value.workflow, 40),
    title: completeSnapshotText(value.title, 4000) || "Saved Katherine’s Eye result",
    identification: {
      confidence: completeSnapshotText(value.identification?.confidence, 4000),
      summary: completeSnapshotText(value.identification?.summary),
      customerExplanation: completeSnapshotText(value.identification?.customerExplanation, 4000)
    },
    confidence: Object.fromEntries(["photoMatch", "exactItem", "workingCondition", "priceSupport"]
      .map((key) => [key, completeSnapshotText(value.confidence?.[key], 4000)])),
    confidenceModel: Object.fromEntries(["visibleCategory", "exactItem", "workingCondition", "valuation"]
      .map((key) => [key, {
        level: cleanText(value.confidenceModel?.[key]?.level, 24),
        explanation: completeSnapshotText(value.confidenceModel?.[key]?.explanation, 4000),
        ...(key === "exactItem" ? { acceptedExactIdentifier: value.confidenceModel?.exactItem?.acceptedExactIdentifier === true } : {})
      }])),
    metering: {
      generationRequests: Number.isSafeInteger(value.metering?.generationRequests) ? value.metering.generationRequests : null,
      tokenCountRequests: Number.isSafeInteger(value.metering?.tokenCountRequests) ? value.metering.tokenCountRequests : null,
      searchProviderAttempts: Number.isSafeInteger(value.metering?.searchProviderAttempts) ? value.metering.searchProviderAttempts : null,
      searchToolCalls: Number.isSafeInteger(value.metering?.searchToolCalls) ? value.metering.searchToolCalls : null,
      directPageAttempts: Number.isSafeInteger(value.metering?.directPageAttempts) ? value.metering.directPageAttempts : null,
      reportedTokens: Object.fromEntries(["inputTokens", "cachedInputTokens", "outputTokens", "reasoningTokens", "totalTokens"]
        .filter((key) => Number.isSafeInteger(value.metering?.reportedTokens?.[key]) && value.metering.reportedTokens[key] >= 0)
        .map((key) => [key, value.metering.reportedTokens[key]])),
      requestObservations: cleanRequestObservations(value.metering?.requestObservations),
      modelReservedUpperBoundDollars: Number.isFinite(value.metering?.modelReservedUpperBoundDollars) ? value.metering.modelReservedUpperBoundDollars : null,
      serperReservedUpperBoundDollars: Number.isFinite(value.metering?.serperReservedUpperBoundDollars) ? value.metering.serperReservedUpperBoundDollars : null,
      serperAttemptCeiling: Number.isSafeInteger(value.metering?.serperAttemptCeiling) ? value.metering.serperAttemptCeiling : null,
      serperAttemptRecords: Array.isArray(value.metering?.serperAttemptRecords)
        ? value.metering.serperAttemptRecords.slice(0, 6).map((attempt) => ({
          ordinal: Number.isSafeInteger(attempt?.ordinal) ? attempt.ordinal : null,
          status: cleanText(attempt?.status, 32),
          conservativeExposureDollars: Number.isFinite(attempt?.conservativeExposureDollars) ? attempt.conservativeExposureDollars : null,
          exactBilledDollars: null
        })) : [],
      reservedUpperBoundDollars: boundedTotalProviderReservation
        ? Number((value.metering.modelReservedUpperBoundDollars + value.metering.serperReservedUpperBoundDollars).toFixed(8))
        : Number.isFinite(value.metering?.reservedUpperBoundDollars) ? value.metering.reservedUpperBoundDollars : null,
      reservationScope: boundedTotalProviderReservation
        ? "TOTAL_PROVIDER_CONSERVATIVE_EXPOSURE" : "MODEL_EXECUTION_ONLY_NOT_TOTAL_PROVIDER_BILLING",
      maximumAuthorizedDollars: Number.isFinite(value.metering?.maximumAuthorizedDollars) ? value.metering.maximumAuthorizedDollars : null,
      exactBilledDollars: null,
      billingStatus: "UNKNOWN"
    },
    listing: {
      title: completeSnapshotText(value.listing?.title, 4000),
      description: completeSnapshotText(value.listing?.description),
      itemDetails: completeSnapshotList(value.listing?.itemDetails),
      visibleCondition: completeSnapshotList(value.listing?.visibleCondition)
    },
    pricing: {
      disposition: completeSnapshotText(value.pricing?.disposition, 4000),
      range: completeSnapshotText(value.pricing?.range, 4000),
      rationale: completeSnapshotText(value.pricing?.rationale)
    },
    recommendation: completeSnapshotText(value.recommendation),
    uncertainty: completeSnapshotList(value.uncertainty),
    alternatives: completeSnapshotList(value.alternatives),
    requestedPhotos: completeSnapshotList(value.requestedPhotos),
    researchSteps: completeSnapshotList(value.researchSteps),
    evidence: cleanEvidence(value.evidence),
    imageRetention: "none"
  };
  if (Buffer.byteLength(JSON.stringify(snapshot), "utf8") > MAX_SNAPSHOT_BYTES) {
    throw customerError(413, "history_snapshot_too_large", "This result is too large to save safely.");
  }
  return snapshot;
}

function cleanupState(state, nowMilliseconds) {
  for (const [tokenHash, session] of Object.entries(state.sessions)) {
    if (!session || Number(session.expiresAtMilliseconds || 0) <= nowMilliseconds || !state.accounts[session.accountId]) {
      delete state.sessions[tokenHash];
    }
  }
  for (const [accountId, entries] of Object.entries(state.histories)) {
    if (!state.accounts[accountId]) {
      delete state.histories[accountId];
      continue;
    }
    for (const [listingId, listing] of Object.entries(entries || {})) {
      if (Number(listing.expiresAtMilliseconds || 0) <= nowMilliseconds) delete entries[listingId];
    }
  }
  for (const [accountId, recoveries] of Object.entries(state.analysisRecoveries)) {
    if (!state.accounts[accountId]) {
      delete state.analysisRecoveries[accountId];
      continue;
    }
    for (const [analysisId, recovery] of Object.entries(recoveries)) {
      if (Number(recovery.expiresAtMilliseconds || 0) <= nowMilliseconds) delete recoveries[analysisId];
    }
    if (!Object.keys(recoveries).length) delete state.analysisRecoveries[accountId];
  }
  for (const [key, record] of Object.entries(state.authenticationThrottle)) {
    if (!isPlainRecord(record) || Number(record.windowStartedAtMilliseconds || 0) + AUTHENTICATION_WINDOW_MILLISECONDS <= nowMilliseconds) {
      delete state.authenticationThrottle[key];
    }
  }
  const throttleEntries = Object.entries(state.authenticationThrottle);
  if (throttleEntries.length > MAX_AUTHENTICATION_THROTTLE_RECORDS) {
    throttleEntries
      .sort((left, right) => Number(left[1]?.windowStartedAtMilliseconds || 0) - Number(right[1]?.windowStartedAtMilliseconds || 0))
      .slice(0, throttleEntries.length - MAX_AUTHENTICATION_THROTTLE_RECORDS)
      .forEach(([key]) => delete state.authenticationThrottle[key]);
  }
}

function authenticationThrottleKeys(usernameKey, sourceIdentity) {
  return {
    identity: `identity_${sha256(`customer-account:${usernameKey}`)}`,
    source: `source_${sha256(`customer-account:${cleanText(sourceIdentity, 240) || "unknown"}`)}`
  };
}

function throttleRecord(state, key, nowMilliseconds) {
  const existing = state.authenticationThrottle[key];
  if (!isPlainRecord(existing) || Number(existing.windowStartedAtMilliseconds || 0) + AUTHENTICATION_WINDOW_MILLISECONDS <= nowMilliseconds) {
    state.authenticationThrottle[key] = { attempts: 0, windowStartedAtMilliseconds: nowMilliseconds };
  }
  return state.authenticationThrottle[key];
}

function authenticationThrottleStatus(state, keys, nowMilliseconds) {
  const identity = throttleRecord(state, keys.identity, nowMilliseconds);
  const source = throttleRecord(state, keys.source, nowMilliseconds);
  const limited = Number(identity.attempts || 0) >= AUTHENTICATION_IDENTITY_LIMIT
    || Number(source.attempts || 0) >= AUTHENTICATION_SOURCE_LIMIT;
  if (!limited) return null;
  const resetAt = Math.max(
    Number(identity.windowStartedAtMilliseconds || 0),
    Number(source.windowStartedAtMilliseconds || 0)
  ) + AUTHENTICATION_WINDOW_MILLISECONDS;
  return {
    status: 429,
    code: "authentication_throttled",
    message: "Too many account attempts. Wait a little before trying again.",
    retryAfterSeconds: Math.max(1, Math.ceil((resetAt - nowMilliseconds) / 1000))
  };
}

function recordAuthenticationFailure(state, keys, nowMilliseconds) {
  throttleRecord(state, keys.identity, nowMilliseconds).attempts += 1;
  throttleRecord(state, keys.source, nowMilliseconds).attempts += 1;
}

function recordRegistrationAttempt(state, keys, nowMilliseconds) {
  throttleRecord(state, keys.source, nowMilliseconds).attempts += 1;
}

function clearAuthenticationIdentityThrottle(state, keys) {
  delete state.authenticationThrottle[keys.identity];
}

export function createMemoryCustomerAccountStore(initialState = emptyState()) {
  let state = normalizeState(clone(initialState));
  let pending = Promise.resolve();
  return {
    async read() {
      return clone(state);
    },
    transact(mutator) {
      const transaction = pending.then(async () => {
        const working = clone(state);
        const result = await mutator(working);
        state = normalizeState(working);
        return clone(result);
      });
      pending = transaction.catch(() => {});
      return transaction;
    }
  };
}

async function wait(milliseconds) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function createFileCustomerAccountStore(filePath) {
  const configuredPath = String(filePath || "").trim();
  if (!configuredPath) throw new Error("Customer account store path must be configured.");
  const resolvedPath = path.resolve(configuredPath);
  if (!path.isAbsolute(resolvedPath)) throw new Error("Customer account store path must be absolute.");
  if (resolvedPath.length > 1024 || path.dirname(resolvedPath) === resolvedPath || path.extname(resolvedPath).toLowerCase() !== ".json") {
    throw new Error("Customer account store path is not a bounded JSON file.");
  }
  const lockPath = `${resolvedPath}.lock`;
  const backupPath = `${resolvedPath}.bak`;

  async function assertSafeFileBoundary() {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true, mode: 0o700 });
    for (const candidate of [path.dirname(resolvedPath), resolvedPath, backupPath, lockPath]) {
      try {
        const stat = await fs.lstat(candidate);
        if (stat.isSymbolicLink()) throw new Error("Customer account store path cannot use symbolic links.");
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
    }
  }

  async function parseStateFile(candidatePath) {
    return normalizeState(JSON.parse(await fs.readFile(candidatePath, "utf8")));
  }

  async function readState() {
    await assertSafeFileBoundary();
    try {
      return await parseStateFile(resolvedPath);
    } catch (primaryError) {
      try {
        return await parseStateFile(backupPath);
      } catch (backupError) {
        if (primaryError?.code === "ENOENT" && backupError?.code === "ENOENT") return emptyState();
        const error = new Error("Customer account store is corrupt or unavailable.");
        error.code = "customer_account_store_corrupt";
        throw error;
      }
    }
  }

  async function writeAtomic(destinationPath, contents) {
    const temporaryPath = `${destinationPath}.${process.pid}.${crypto.randomBytes(12).toString("hex")}.tmp`;
    let handle;
    try {
      handle = await fs.open(temporaryPath, "wx", 0o600);
      await handle.writeFile(contents, "utf8");
      await handle.sync();
      await handle.close();
      handle = null;
      await fs.chmod(temporaryPath, 0o600).catch(() => {});
      await fs.rename(temporaryPath, destinationPath);
    } finally {
      await handle?.close().catch(() => {});
      await fs.unlink(temporaryPath).catch(() => {});
    }
  }

  async function withLock(action) {
    await assertSafeFileBoundary();
    let handle = null;
    const lockIdentity = `${process.pid}:${crypto.randomBytes(18).toString("hex")}`;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      try {
        handle = await fs.open(lockPath, "wx", 0o600);
        await handle.writeFile(`${JSON.stringify({ lockIdentity, createdAtMilliseconds: Date.now() })}\n`, "utf8");
        await handle.sync();
        break;
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        try {
          const lockStat = await fs.stat(lockPath);
          if (Date.now() - lockStat.mtimeMs > 60_000) await fs.unlink(lockPath);
        } catch (lockError) {
          if (lockError?.code !== "ENOENT") throw lockError;
        }
        await wait(25);
      }
    }
    if (!handle) throw new Error("Customer account store is busy.");
    try {
      return await action();
    } finally {
      await handle.close();
      try {
        const lockRecord = JSON.parse(await fs.readFile(lockPath, "utf8"));
        if (lockRecord.lockIdentity === lockIdentity) await fs.unlink(lockPath);
      } catch {
      }
    }
  }

  return {
    async read() {
      return readState();
    },
    async transact(mutator) {
      return withLock(async () => {
        const state = await readState();
        const result = await mutator(state);
        const nextState = normalizeState({ ...state, revision: Number(state.revision || 0) + 1 });
        const serializedState = `${JSON.stringify(nextState, null, 2)}\n`;
        await writeAtomic(resolvedPath, serializedState);
        try {
          await writeAtomic(backupPath, serializedState);
        } catch (error) {
          await fs.unlink(backupPath).catch(() => {});
          throw error;
        }
        await fs.chmod(resolvedPath, 0o600).catch(() => {});
        await fs.chmod(backupPath, 0o600).catch(() => {});
        return clone(result);
      });
    }
  };
}

export function createDurableCustomerAccountStore({ readSnapshot, compareAndSwap, maximumAttempts = 5 } = {}) {
  if (typeof readSnapshot !== "function" || typeof compareAndSwap !== "function") {
    throw new Error("Durable customer account storage requires readSnapshot and compareAndSwap operations.");
  }
  if (!Number.isInteger(maximumAttempts) || maximumAttempts < 1 || maximumAttempts > 10) {
    throw new Error("Durable customer account storage retry limit is invalid.");
  }
  async function readState() {
    const snapshot = await readSnapshot();
    return snapshot == null ? emptyState() : normalizeState(clone(snapshot));
  }
  return {
    persistenceKind: "durable_compare_and_swap",
    async read() {
      return clone(await readState());
    },
    async transact(mutator) {
      for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
        const state = await readState();
        const expectedRevision = Number(state.revision || 0);
        const working = clone(state);
        const result = await mutator(working);
        const nextState = normalizeState({ ...working, revision: expectedRevision + 1 });
        const committed = await compareAndSwap({ expectedRevision, nextState: clone(nextState) });
        if (committed === true) return clone(result);
        if (committed !== false) throw new Error("Durable customer account adapter returned an invalid commit result.");
      }
      const error = new Error("Customer account store is busy.");
      error.code = "customer_account_store_busy";
      throw error;
    }
  };
}

export function createCustomerAccountService({
  store = createMemoryCustomerAccountStore(),
  now = () => Date.now(),
  randomBytes = crypto.randomBytes
} = {}) {
  async function authenticate(state, token) {
    const normalizedToken = String(token || "");
    const tokenHash = /^[A-Za-z0-9_-]{43}$/.test(normalizedToken) ? sha256(normalizedToken) : "";
    const session = tokenHash ? state.sessions[tokenHash] : null;
    if (!session || Number(session.expiresAtMilliseconds || 0) <= now()) {
      throw customerError(401, "authentication_required", "Sign in to continue.");
    }
    const account = state.accounts[session.accountId];
    if (!account) throw customerError(401, "authentication_required", "Sign in to continue.");
    return { account, session, tokenHash };
  }

  function createSession(state, accountId) {
    const token = base64Url(randomBytes(32));
    if (!/^[A-Za-z0-9_-]{43}$/.test(token) || state.sessions[sha256(token)]) {
      throw new Error("Secure session identifier generation failed.");
    }
    const issuedAtMilliseconds = now();
    const expiresAtMilliseconds = issuedAtMilliseconds + SESSION_LIFETIME_MILLISECONDS;
    state.sessions[sha256(token)] = { accountId, issuedAtMilliseconds, expiresAtMilliseconds };
    return {
      token,
      csrfToken: sha256(`csrf:${token}`),
      expiresAt: new Date(expiresAtMilliseconds).toISOString()
    };
  }

  function revokeAccountSessions(state, accountId) {
    for (const [tokenHash, session] of Object.entries(state.sessions)) {
      if (session.accountId === accountId) delete state.sessions[tokenHash];
    }
  }

  return {
    async register({ username, password, preferredName }, { sourceIdentity = "unknown", currentToken = "" } = {}) {
      const usernameResult = validateUsername(username);
      if (!usernameResult.ok) throw customerError(400, usernameResult.code, usernameResult.message);
      const passwordResult = validatePassword(password);
      if (!passwordResult.ok) throw customerError(400, passwordResult.code, passwordResult.message);
      const preferredNameResult = preferredName === undefined ? { ok: true } : validatePreferredName(preferredName);
      if (!preferredNameResult.ok) throw customerError(400, preferredNameResult.code, preferredNameResult.message);
      const result = await store.transact(async (state) => {
        const currentTime = now();
        cleanupState(state, currentTime);
        const throttleKeys = authenticationThrottleKeys(usernameResult.usernameKey, sourceIdentity);
        const throttleFailure = authenticationThrottleStatus(state, throttleKeys, currentTime);
        if (throttleFailure) return { failure: throttleFailure };
        const newPasswordRecord = passwordRecord(passwordResult.password, randomBytes);
        if (Object.hasOwn(state.usernameIndex, usernameResult.usernameKey)) {
          recordAuthenticationFailure(state, throttleKeys, currentTime);
          return {
            failure: {
              status: 400,
              code: "registration_unavailable",
              message: "An account could not be created with those details. Choose a different username or review the requirements."
            }
          };
        }
        const accountId = `account_${base64Url(randomBytes(18))}`;
        const createdAt = new Date(currentTime).toISOString();
        const account = {
          id: accountId,
          username: usernameResult.username,
          usernameKey: usernameResult.usernameKey,
          password: newPasswordRecord,
          createdAt,
          updatedAt: createdAt,
          preferences: { historyRetentionDays: DEFAULT_HISTORY_RETENTION_DAYS, imageRetention: "none" }
        };
        if (preferredNameResult.preferredName) account.preferredName = preferredNameResult.preferredName;
        state.accounts[accountId] = account;
        state.usernameIndex[account.usernameKey] = accountId;
        state.histories[accountId] = {};
        if (currentToken) delete state.sessions[sha256(currentToken)];
        recordRegistrationAttempt(state, throttleKeys, currentTime);
        clearAuthenticationIdentityThrottle(state, throttleKeys);
        return { payload: { account: publicAccount(account), session: createSession(state, accountId) } };
      });
      if (result.failure) throwServiceFailure(result.failure);
      return result.payload;
    },

    async login({ username, password }, { sourceIdentity = "unknown", currentToken = "" } = {}) {
      const usernameKey = normalizeUsername(username);
      const result = await store.transact(async (state) => {
        const currentTime = now();
        cleanupState(state, currentTime);
        const throttleKeys = authenticationThrottleKeys(usernameKey, sourceIdentity);
        const throttleFailure = authenticationThrottleStatus(state, throttleKeys, currentTime);
        if (throttleFailure) return { failure: throttleFailure };
        const accountId = Object.hasOwn(state.usernameIndex, usernameKey) ? state.usernameIndex[usernameKey] : "";
        const account = accountId ? state.accounts[accountId] : null;
        const matches = passwordMatches(String(password ?? ""), account?.password || DUMMY_PASSWORD_RECORD);
        if (!account || !matches) {
          recordAuthenticationFailure(state, throttleKeys, currentTime);
          return {
            failure: { status: 401, code: "invalid_credentials", message: "The username or password did not match." }
          };
        }
        if (account.password.algorithm === "scrypt-v1") account.password = passwordRecord(String(password), randomBytes);
        if (currentToken) delete state.sessions[sha256(currentToken)];
        clearAuthenticationIdentityThrottle(state, throttleKeys);
        return { payload: { account: publicAccount(account), session: createSession(state, account.id) } };
      });
      if (result.failure) throwServiceFailure(result.failure);
      return result.payload;
    },

    async session(token) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        return { account: publicAccount(account), csrfToken: sha256(`csrf:${token}`) };
      });
    },

    async verifyCsrf(token, csrfToken) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        await authenticate(state, token);
        const expected = Buffer.from(sha256(`csrf:${token}`), "utf8");
        const supplied = Buffer.from(String(csrfToken || ""), "utf8");
        if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
          throw customerError(403, "csrf_verification_failed", "This account request could not be verified. Refresh and try again.");
        }
        return { verified: true };
      });
    },

    async logout(token) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        if (token) delete state.sessions[sha256(token)];
        return { signedOut: true };
      });
    },

    async registerAnalysisRecovery(token, identity) {
      validateAnalysisIdentity(identity);
      return store.transact(async (state) => {
        const currentTime = now();
        cleanupState(state, currentTime);
        const { account } = await authenticate(state, token);
        const recoveries = state.analysisRecoveries[account.id] || (state.analysisRecoveries[account.id] = {});
        const existing = recoveries[identity.analysisId];
        if (existing) {
          if (existing.requestHash !== identity.requestHash
            || JSON.stringify(existing.photoHashes) !== JSON.stringify(identity.photoHashes)) {
            throw customerError(409, "analysis_recovery_input_changed", "This analysis reference belongs to different item details.");
          }
          return publicAnalysisRecovery(existing, currentTime);
        }
        const replayMarkers = state.analysisReplay[account.id] || (state.analysisReplay[account.id] = {});
        const replayKey = sha256(`${account.id}:${identity.analysisId}`);
        if (replayMarkers[replayKey]) {
          throw customerError(409, "analysis_recovery_already_used", "This analysis reference has already been used and cannot be submitted again.");
        }
        if (Object.keys(replayMarkers).length >= MAX_ANALYSIS_REPLAY_MARKERS_PER_ACCOUNT
          || Object.values(state.analysisReplay).reduce((count, markers) => count + Object.keys(markers).length, 0) >= MAX_ANALYSIS_REPLAY_MARKERS_TOTAL) {
          throw customerError(409, "analysis_recovery_limit", "The analysis request limit has been reached. No provider request was sent.");
        }
        if (Object.keys(recoveries).length >= MAX_ANALYSIS_RECOVERIES_PER_ACCOUNT
          || Object.values(state.analysisRecoveries).reduce((count, entries) => count + Object.keys(entries).length, 0) >= MAX_ANALYSIS_RECOVERIES_TOTAL) {
          throw customerError(409, "analysis_recovery_limit", "Temporary analysis recovery is full. Wait for an earlier reference to expire.");
        }
        const recoveryId = `recovery_${base64Url(randomBytes(24))}`;
        const record = {
          analysisId: identity.analysisId,
          recoveryId,
          requestHash: identity.requestHash,
          photoHashes: [...identity.photoHashes],
          state: "REGISTERED",
          createdAtMilliseconds: currentTime,
          expiresAtMilliseconds: currentTime + ANALYSIS_RECOVERY_LIFETIME_MILLISECONDS,
          dispatchedAtMilliseconds: null,
          statusCode: null,
          responseJson: null
        };
        recoveries[identity.analysisId] = record;
        replayMarkers[replayKey] = true;
        return publicAnalysisRecovery(record, currentTime);
      });
    },

    async claimAnalysisRecovery(token, identity) {
      validateAnalysisIdentity(identity, { requireRecoveryId: true });
      return store.transact(async (state) => {
        const currentTime = now();
        cleanupState(state, currentTime);
        const { account } = await authenticate(state, token);
        const record = state.analysisRecoveries[account.id]?.[identity.analysisId];
        if (!record || record.recoveryId !== identity.recoveryId) {
          throw customerError(404, "analysis_recovery_not_found", "This analysis reference was not found for this account.");
        }
        if (record.requestHash !== identity.requestHash
          || JSON.stringify(record.photoHashes) !== JSON.stringify(identity.photoHashes)) {
          throw customerError(409, "analysis_recovery_input_changed", "This analysis reference belongs to different item details.");
        }
        if (record.state !== "REGISTERED") return { claimed: false, ...publicAnalysisRecovery(record, currentTime) };
        record.state = "DISPATCHING";
        record.dispatchedAtMilliseconds = currentTime;
        return { claimed: true, ...publicAnalysisRecovery(record, currentTime) };
      });
    },

    async completeAnalysisRecovery(token, { analysisId, recoveryId, state: terminalState, statusCode, response }) {
      if (!ANALYSIS_ID_PATTERN.test(String(analysisId || "")) || !/^recovery_[A-Za-z0-9_-]{32}$/.test(String(recoveryId || ""))
        || !["SUCCEEDED", "FAILED_TERMINAL"].includes(terminalState) || !Number.isInteger(statusCode)
        || statusCode < 200 || statusCode > 599) {
        throw customerError(400, "analysis_recovery_completion_invalid", "The analysis completion is invalid.");
      }
      const responseJson = JSON.stringify(response);
      if (typeof responseJson !== "string" || Buffer.byteLength(responseJson, "utf8") > MAX_ANALYSIS_RECOVERY_RESPONSE_BYTES
        || /data:image\/(?:jpeg|png|webp|gif);base64,/i.test(responseJson)) {
        throw customerError(413, "analysis_recovery_response_too_large", "The analysis response cannot be retained for recovery.");
      }
      return store.transact(async (state) => {
        const currentTime = now();
        cleanupState(state, currentTime);
        const { account } = await authenticate(state, token);
        const record = state.analysisRecoveries[account.id]?.[analysisId];
        if (!record || record.recoveryId !== recoveryId) {
          throw customerError(404, "analysis_recovery_not_found", "This analysis reference was not found for this account.");
        }
        if (record.state !== "DISPATCHING") {
          throw customerError(409, "analysis_recovery_state_changed", "This analysis is no longer dispatching.");
        }
        record.state = terminalState;
        record.statusCode = statusCode;
        record.responseJson = responseJson;
        return publicAnalysisRecovery(record, currentTime);
      });
    },

    async readAnalysisRecovery(token, analysisId, recoveryId) {
      if (!ANALYSIS_ID_PATTERN.test(String(analysisId || "")) || !/^recovery_[A-Za-z0-9_-]{32}$/.test(String(recoveryId || ""))) {
        throw customerError(400, "analysis_recovery_identity_invalid", "This analysis reference is invalid.");
      }
      return store.transact(async (state) => {
        const { account } = await authenticate(state, token);
        const record = state.analysisRecoveries[account.id]?.[analysisId];
        if (!record || record.recoveryId !== recoveryId) {
          throw customerError(404, "analysis_recovery_not_found", "This analysis reference was not found for this account.");
        }
        const currentTime = now();
        if (record.expiresAtMilliseconds <= currentTime) {
          cleanupState(state, currentTime);
          return { state: "UNKNOWN", analysisId, recoveryId };
        }
        return publicAnalysisRecovery(record, currentTime);
      });
    },

    async saveListing(token, snapshot) {
      const sanitized = sanitizeHistorySnapshot(snapshot);
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        const history = state.histories[account.id] || (state.histories[account.id] = {});
        if (Object.keys(history).length >= MAX_HISTORY_ITEMS) {
          throw customerError(409, "history_limit_reached", "Delete an older saved result before saving another.");
        }
        const listingId = `listing_${base64Url(randomBytes(18))}`;
        const createdAtMilliseconds = now();
        const retentionDays = Number(account.preferences?.historyRetentionDays || DEFAULT_HISTORY_RETENTION_DAYS);
        const entry = {
          id: listingId,
          ownerAccountId: account.id,
          name: sanitized.title,
          createdAt: new Date(createdAtMilliseconds).toISOString(),
          updatedAt: new Date(createdAtMilliseconds).toISOString(),
          expiresAt: new Date(createdAtMilliseconds + retentionDays * 86400000).toISOString(),
          expiresAtMilliseconds: createdAtMilliseconds + retentionDays * 86400000,
          snapshot: sanitized
        };
        history[listingId] = entry;
        return { listing: publicListing(entry) };
      });
    },

    async listHistory(token) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        const listings = Object.values(state.histories[account.id] || {})
          .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
          .map((listing) => publicListing(listing, { summary: true }));
        return { listings };
      });
    },

    async getListing(token, listingId) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        const listing = state.histories[account.id]?.[cleanText(listingId, 120)];
        if (!listing) throw customerError(404, "listing_not_found", "That saved result was not found.");
        return { listing: publicListing(listing) };
      });
    },

    async renameListing(token, listingId, name) {
      const cleanName = cleanText(name, 80);
      if (!cleanName) throw customerError(400, "invalid_listing_name", "Enter a name for this saved result.");
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        const listing = state.histories[account.id]?.[cleanText(listingId, 120)];
        if (!listing) throw customerError(404, "listing_not_found", "That saved result was not found.");
        listing.name = cleanName;
        listing.updatedAt = new Date(now()).toISOString();
        return { listing: publicListing(listing) };
      });
    },

    async deleteListing(token, listingId) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        const id = cleanText(listingId, 120);
        if (!state.histories[account.id]?.[id]) throw customerError(404, "listing_not_found", "That saved result was not found.");
        delete state.histories[account.id][id];
        return { deleted: true, listingId: id };
      });
    },

    async updatePreferences(token, { historyRetentionDays }) {
      const days = Number(historyRetentionDays);
      if (!ALLOWED_HISTORY_RETENTION_DAYS.includes(days)) {
        throw customerError(400, "invalid_retention", "Choose 7, 30, or 90 days for saved result retention.");
      }
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        account.preferences = { historyRetentionDays: days, imageRetention: "none" };
        account.updatedAt = new Date(now()).toISOString();
        for (const listing of Object.values(state.histories[account.id] || {})) {
          const createdAtMilliseconds = Date.parse(listing.createdAt);
          listing.expiresAtMilliseconds = createdAtMilliseconds + days * 86400000;
          listing.expiresAt = new Date(listing.expiresAtMilliseconds).toISOString();
        }
        cleanupState(state, now());
        return { account: publicAccount(account) };
      });
    },

    async updateProfile(token, { preferredName }) {
      const preferredNameResult = validatePreferredName(preferredName);
      if (!preferredNameResult.ok) throw customerError(400, preferredNameResult.code, preferredNameResult.message);
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        account.preferredName = preferredNameResult.preferredName;
        account.updatedAt = new Date(now()).toISOString();
        return { account: publicAccount(account) };
      });
    },

    async changePassword(token, { currentPassword, newPassword }) {
      const passwordResult = validatePassword(newPassword);
      if (!passwordResult.ok) throw customerError(400, passwordResult.code, passwordResult.message);
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        const nextPassword = passwordRecord(passwordResult.password, randomBytes);
        if (!passwordMatches(String(currentPassword ?? ""), account.password)) {
          throw customerError(401, "invalid_credentials", "The current password did not match.");
        }
        account.password = nextPassword;
        account.updatedAt = new Date(now()).toISOString();
        revokeAccountSessions(state, account.id);
        return { account: publicAccount(account), session: createSession(state, account.id) };
      });
    },

    async exportAccount(token) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        const exported = {
          schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
          exportedAt: new Date(now()).toISOString(),
          account: publicAccount(account),
          savedListings: Object.values(state.histories[account.id] || {}).map((listing) => publicListing(listing)),
          boundaries: {
            uploadedImagesStored: false,
            credentialsIncluded: false,
            sessionTokensIncluded: false
          }
        };
        if (Buffer.byteLength(JSON.stringify(exported), "utf8") > MAX_ACCOUNT_EXPORT_BYTES) {
          throw customerError(413, "account_export_too_large", "This account export is too large to prepare safely.");
        }
        return { export: exported };
      });
    },

    async cleanupExpired() {
      return store.transact(async (state) => {
        const before = JSON.stringify(state).length;
        cleanupState(state, now());
        return { cleaned: true, stateChanged: JSON.stringify(state).length !== before };
      });
    },

    async deleteAccount(token, password) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        if (!passwordMatches(String(password ?? ""), account.password)) {
          throw customerError(401, "invalid_credentials", "Enter your current password to delete this account.");
        }
        delete state.usernameIndex[account.usernameKey];
        delete state.histories[account.id];
        delete state.analysisRecoveries[account.id];
        delete state.analysisReplay[account.id];
        delete state.accounts[account.id];
        delete state.authenticationThrottle[authenticationThrottleKeys(account.usernameKey, "unknown").identity];
        revokeAccountSessions(state, account.id);
        return { deleted: true };
      });
    }
  };
}

export { customerError };
