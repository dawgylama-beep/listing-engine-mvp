import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const CUSTOMER_ACCOUNT_SCHEMA_VERSION = "2.0";
export const CUSTOMER_HISTORY_SCHEMA_VERSION = "1.0";
export const DEFAULT_HISTORY_RETENTION_DAYS = 30;
export const ALLOWED_HISTORY_RETENTION_DAYS = Object.freeze([7, 30, 90]);

const MAX_HISTORY_ITEMS = 50;
const MAX_SNAPSHOT_BYTES = 196 * 1024;
const MAX_ACCOUNT_EXPORT_BYTES = 10 * 1024 * 1024;
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

function emptyState() {
  return {
    schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
    revision: 0,
    accounts: {},
    usernameIndex: {},
    sessions: {},
    histories: {},
    authenticationThrottle: {}
  };
}

function normalizeState(value) {
  if (!isPlainRecord(value)) throw new Error("Customer account store has an invalid state envelope.");
  if (!["1.0", CUSTOMER_ACCOUNT_SCHEMA_VERSION].includes(String(value.schemaVersion || ""))) {
    throw new Error("Customer account store schema is unsupported.");
  }
  for (const field of ["accounts", "usernameIndex", "sessions", "histories"]) {
    if (!isPlainRecord(value[field])) throw new Error(`Customer account store field ${field} is invalid.`);
  }
  if (value.authenticationThrottle !== undefined && !isPlainRecord(value.authenticationThrottle)) {
    throw new Error("Customer account authentication throttle state is invalid.");
  }
  const state = {
    schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
    revision: Number.isSafeInteger(value.revision) && value.revision >= 0 ? value.revision : 0,
    accounts: value.accounts,
    usernameIndex: value.usernameIndex,
    sessions: value.sessions,
    histories: value.histories,
    authenticationThrottle: value.authenticationThrottle || {}
  };
  for (const [accountId, account] of Object.entries(state.accounts)) {
    if (!/^account_[A-Za-z0-9_-]{24}$/.test(accountId) || !isPlainRecord(account) || account.id !== accountId || normalizeUsername(account.username) !== account.usernameKey) {
      throw new Error("Customer account store contains an invalid account record.");
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
  const text = cleanText(value, 2048);
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
  return records.slice(0, 12).map((record) => ({
    source: cleanText(record?.source, 160),
    title: cleanText(record?.title, 300),
    match: cleanText(record?.match, 160),
    price: cleanText(record?.price, 160),
    deliveredCost: cleanText(record?.deliveredCost, 160),
    availability: cleanText(record?.availability, 240),
    limitation: cleanText(record?.limitation, 300),
    url: safeUrl(record?.url)
  })).filter((record) => Object.values(record).some(Boolean));
}

export function sanitizeHistorySnapshot(value = {}) {
  const snapshot = {
    schemaVersion: CUSTOMER_HISTORY_SCHEMA_VERSION,
    workflow: cleanText(value.workflow, 40),
    title: cleanText(value.title, 160) || "Saved Katherine’s Eye result",
    identification: {
      confidence: cleanText(value.identification?.confidence, 120),
      summary: cleanText(value.identification?.summary, 1200)
    },
    listing: {
      title: cleanText(value.listing?.title, 240),
      description: cleanText(value.listing?.description, 6000),
      itemDetails: cleanStringList(value.listing?.itemDetails, 24, 500),
      visibleCondition: cleanStringList(value.listing?.visibleCondition, 16, 500)
    },
    pricing: {
      disposition: cleanText(value.pricing?.disposition, 400),
      range: cleanText(value.pricing?.range, 160),
      rationale: cleanText(value.pricing?.rationale, 1200)
    },
    recommendation: cleanText(value.recommendation, 1600),
    uncertainty: cleanStringList(value.uncertainty, 16, 500),
    alternatives: cleanStringList(value.alternatives, 12, 500),
    requestedPhotos: cleanStringList(value.requestedPhotos, 12, 500),
    researchSteps: cleanStringList(value.researchSteps, 16, 500),
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
  return {
    async read() {
      return clone(state);
    },
    async transact(mutator) {
      const working = clone(state);
      const result = await mutator(working);
      state = normalizeState(working);
      return clone(result);
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
    async register({ username, password }, { sourceIdentity = "unknown", currentToken = "" } = {}) {
      const usernameResult = validateUsername(username);
      if (!usernameResult.ok) throw customerError(400, usernameResult.code, usernameResult.message);
      const passwordResult = validatePassword(password);
      if (!passwordResult.ok) throw customerError(400, passwordResult.code, passwordResult.message);
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
        delete state.accounts[account.id];
        delete state.authenticationThrottle[authenticationThrottleKeys(account.usernameKey, "unknown").identity];
        revokeAccountSessions(state, account.id);
        return { deleted: true };
      });
    }
  };
}

export { customerError };
