import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const CUSTOMER_ACCOUNT_SCHEMA_VERSION = "1.0";
export const CUSTOMER_HISTORY_SCHEMA_VERSION = "1.0";
export const DEFAULT_HISTORY_RETENTION_DAYS = 30;
export const ALLOWED_HISTORY_RETENTION_DAYS = Object.freeze([7, 30, 90]);

const MAX_HISTORY_ITEMS = 50;
const MAX_SNAPSHOT_BYTES = 196 * 1024;
const SESSION_LIFETIME_MILLISECONDS = 12 * 60 * 60 * 1000;
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

function emptyState() {
  return {
    schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
    accounts: {},
    usernameIndex: {},
    sessions: {},
    histories: {}
  };
}

function normalizeState(value) {
  const state = value && typeof value === "object" ? value : {};
  return {
    schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
    accounts: state.accounts && typeof state.accounts === "object" ? state.accounts : {},
    usernameIndex: state.usernameIndex && typeof state.usernameIndex === "object" ? state.usernameIndex : {},
    sessions: state.sessions && typeof state.sessions === "object" ? state.sessions : {},
    histories: state.histories && typeof state.histories === "object" ? state.histories : {}
  };
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
  const digest = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return { algorithm: "scrypt-v1", salt: base64Url(salt), digest: base64Url(digest) };
}

function passwordMatches(password, record = {}) {
  if (record.algorithm !== "scrypt-v1" || !record.salt || !record.digest) return false;
  try {
    const salt = Buffer.from(record.salt, "base64url");
    const expected = Buffer.from(record.digest, "base64url");
    const actual = crypto.scryptSync(password, salt, expected.length, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function customerError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
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
  const lockPath = `${resolvedPath}.lock`;

  async function readState() {
    try {
      return normalizeState(JSON.parse(await fs.readFile(resolvedPath, "utf8")));
    } catch (error) {
      if (error?.code === "ENOENT") return emptyState();
      throw error;
    }
  }

  async function withLock(action) {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    let handle = null;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      try {
        handle = await fs.open(lockPath, "wx", 0o600);
        break;
      } catch (error) {
        if (error?.code !== "EEXIST") throw error;
        await wait(10);
      }
    }
    if (!handle) throw new Error("Customer account store is busy.");
    try {
      return await action();
    } finally {
      await handle.close();
      await fs.unlink(lockPath).catch(() => {});
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
        const temporaryPath = `${resolvedPath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
        await fs.writeFile(temporaryPath, `${JSON.stringify(normalizeState(state), null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
        await fs.rename(temporaryPath, resolvedPath);
        return clone(result);
      });
    }
  };
}

export function createCustomerAccountService({
  store = createMemoryCustomerAccountStore(),
  now = () => Date.now(),
  randomBytes = crypto.randomBytes
} = {}) {
  async function authenticate(state, token) {
    const tokenHash = token ? sha256(token) : "";
    const session = tokenHash ? state.sessions[tokenHash] : null;
    if (!session || Number(session.expiresAtMilliseconds || 0) <= now()) {
      throw customerError(401, "authentication_required", "Sign in to continue.");
    }
    const account = state.accounts[session.accountId];
    if (!account) throw customerError(401, "authentication_required", "Sign in to continue.");
    return { account, tokenHash };
  }

  function createSession(state, accountId) {
    const token = base64Url(randomBytes(32));
    const expiresAtMilliseconds = now() + SESSION_LIFETIME_MILLISECONDS;
    state.sessions[sha256(token)] = { accountId, expiresAtMilliseconds };
    return { token, expiresAt: new Date(expiresAtMilliseconds).toISOString() };
  }

  return {
    async register({ username, password }) {
      const usernameResult = validateUsername(username);
      if (!usernameResult.ok) throw customerError(400, usernameResult.code, usernameResult.message);
      const passwordResult = validatePassword(password);
      if (!passwordResult.ok) throw customerError(400, passwordResult.code, passwordResult.message);
      return store.transact(async (state) => {
        cleanupState(state, now());
        if (state.usernameIndex[usernameResult.usernameKey]) {
          throw customerError(409, "username_unavailable", "That username is already in use.");
        }
        const accountId = `account_${base64Url(randomBytes(18))}`;
        const createdAt = new Date(now()).toISOString();
        const account = {
          id: accountId,
          username: usernameResult.username,
          usernameKey: usernameResult.usernameKey,
          password: passwordRecord(passwordResult.password, randomBytes),
          createdAt,
          updatedAt: createdAt,
          preferences: { historyRetentionDays: DEFAULT_HISTORY_RETENTION_DAYS, imageRetention: "none" }
        };
        state.accounts[accountId] = account;
        state.usernameIndex[account.usernameKey] = accountId;
        state.histories[accountId] = {};
        return { account: publicAccount(account), session: createSession(state, accountId) };
      });
    },

    async login({ username, password }) {
      const usernameKey = normalizeUsername(username);
      return store.transact(async (state) => {
        cleanupState(state, now());
        const account = state.accounts[state.usernameIndex[usernameKey]];
        if (!account || !passwordMatches(String(password ?? ""), account.password)) {
          throw customerError(401, "invalid_credentials", "The username or password did not match.");
        }
        return { account: publicAccount(account), session: createSession(state, account.id) };
      });
    },

    async session(token) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        return { account: publicAccount(account) };
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

    async exportAccount(token) {
      return store.transact(async (state) => {
        cleanupState(state, now());
        const { account } = await authenticate(state, token);
        return {
          export: {
            schemaVersion: CUSTOMER_ACCOUNT_SCHEMA_VERSION,
            exportedAt: new Date(now()).toISOString(),
            account: publicAccount(account),
            savedListings: Object.values(state.histories[account.id] || {}).map((listing) => publicListing(listing)),
            boundaries: {
              uploadedImagesStored: false,
              credentialsIncluded: false,
              sessionTokensIncluded: false
            }
          }
        };
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
        for (const [tokenHash, session] of Object.entries(state.sessions)) {
          if (session.accountId === account.id) delete state.sessions[tokenHash];
        }
        return { deleted: true };
      });
    }
  };
}

export { customerError };
