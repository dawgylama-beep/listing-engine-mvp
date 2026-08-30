import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createBetaReadinessHandler } from "../api/beta-readiness.js";
import { createCustomerAccountHandler } from "../api/customer-account.js";
import {
  CUSTOMER_ACCOUNT_SCHEMA_VERSION,
  createCustomerAccountService,
  createDurableCustomerAccountStore,
  createFileCustomerAccountStore,
  createMemoryCustomerAccountStore
} from "../lib/customer-account/service.js";
import { assessCustomerBetaReadiness } from "../lib/customer-account/readiness.js";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const password = "correct horse battery staple";
const sampleSnapshot = {
  title: "Private table lamp",
  workflow: "personal_use",
  listing: { title: "Table lamp", description: "Visible brass-tone table lamp." },
  uploadedImage: "data:image/jpeg;base64,PRIVATE_IMAGE_BYTES",
  privateEvidencePath: "C:\\private\\artifact"
};

function responseCapture() {
  return {
    statusCode: 200,
    headers: {},
    payload: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[String(name).toLowerCase()] = String(value); },
    json(payload) { this.payload = payload; return this; }
  };
}

async function call(handler, {
  method = "GET",
  url = "/api/customer-account",
  body = null,
  cookie = "",
  csrfToken = "",
  origin = "http://localhost:5175",
  host = "localhost:5175",
  contentType = "application/json",
  extraHeaders = {}
} = {}) {
  const headers = { host, ...extraHeaders };
  if (["POST", "PATCH", "DELETE"].includes(method)) {
    if (origin) headers.origin = origin;
    if (contentType) headers["content-type"] = contentType;
  }
  if (cookie) headers.cookie = cookie;
  if (csrfToken) headers["x-csrf-token"] = csrfToken;
  const response = responseCapture();
  await handler({ method, url, body, headers }, response);
  return response;
}

function cookieFrom(response) {
  return response.headers["set-cookie"].split(";")[0];
}

test("scrypt records bind safe parameters and migrate legacy records only after valid authentication", async () => {
  const seedStore = createMemoryCustomerAccountStore();
  const seedService = createCustomerAccountService({ store: seedStore });
  const registered = await seedService.register({ username: "parameter_user", password });
  const state = await seedStore.read();
  const account = state.accounts[registered.account.id];
  assert.equal(account.password.algorithm, "scrypt-v2");
  assert.deepEqual(account.password.parameters, { N: 16384, r: 8, p: 1, keyLength: 32, maxmem: 67108864 });

  const salt = crypto.randomBytes(16);
  const digest = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  account.password = { algorithm: "scrypt-v1", salt: salt.toString("base64url"), digest: digest.toString("base64url") };
  state.schemaVersion = "1.0";
  delete state.revision;
  delete state.authenticationThrottle;
  state.sessions = {};
  const legacyStore = createMemoryCustomerAccountStore(state);
  const legacyService = createCustomerAccountService({ store: legacyStore });
  await legacyService.login({ username: "parameter_user", password });
  assert.equal((await legacyStore.read()).accounts[account.id].password.algorithm, "scrypt-v2");

  const tampered = await legacyStore.read();
  tampered.accounts[account.id].password.parameters.N = 1_048_576;
  const tamperedService = createCustomerAccountService({ store: createMemoryCustomerAccountStore(tampered) });
  await assert.rejects(
    tamperedService.login({ username: "parameter_user", password }),
    (error) => error.code === "invalid_credentials"
  );
});

test("username uniqueness uses own records rather than inherited object properties", async () => {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  assert.equal((await service.register({ username: "constructor", password })).account.username, "constructor");
  assert.equal((await service.register({ username: "tostring", password })).account.username, "tostring");
});

test("generic authentication failures are durably throttled per identity and expire deterministically", async () => {
  let nowMilliseconds = Date.parse("2026-08-30T12:00:00.000Z");
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store, now: () => nowMilliseconds });
  await service.register({ username: "throttle_user", password }, { sourceIdentity: "198.51.100.20" });
  await assert.rejects(
    service.register({ username: "THROTTLE_USER", password }, { sourceIdentity: "198.51.100.20" }),
    (error) => error.code === "registration_unavailable" && error.status === 400
  );
  for (let attempt = 0; attempt < 7; attempt += 1) {
    await assert.rejects(
      service.login({ username: "throttle_user", password: "wrong password" }, { sourceIdentity: "198.51.100.20" }),
      (error) => error.code === "invalid_credentials"
    );
  }
  await assert.rejects(
    service.login({ username: "throttle_user", password }, { sourceIdentity: "198.51.100.20" }),
    (error) => error.code === "authentication_throttled" && error.status === 429 && error.retryAfterSeconds > 0
  );
  assert.equal(Object.keys((await store.read()).authenticationThrottle).some((key) => key.includes("throttle_user")), false);
  nowMilliseconds += 16 * 60 * 1000;
  assert.equal((await service.login({ username: "throttle_user", password }, { sourceIdentity: "198.51.100.20" })).account.username, "throttle_user");
});

test("login and password change rotate sessions while password change revokes every prior session", async () => {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  const registered = await service.register({ username: "rotation_user", password });
  const second = await service.login({ username: "rotation_user", password }, { currentToken: registered.session.token });
  await assert.rejects(service.session(registered.session.token), (error) => error.code === "authentication_required");
  const third = await service.login({ username: "rotation_user", password });
  const changed = await service.changePassword(second.session.token, {
    currentPassword: password,
    newPassword: "a new unique password phrase"
  });
  await assert.rejects(service.session(second.session.token), (error) => error.code === "authentication_required");
  await assert.rejects(service.session(third.session.token), (error) => error.code === "authentication_required");
  assert.equal((await service.session(changed.session.token)).account.username, "rotation_user");
});

test("session expiration is absolute and is not extended by activity", async () => {
  let nowMilliseconds = Date.parse("2026-08-30T12:00:00.000Z");
  const service = createCustomerAccountService({
    store: createMemoryCustomerAccountStore(),
    now: () => nowMilliseconds
  });
  const registered = await service.register({ username: "expiry_user", password });
  nowMilliseconds += 11 * 60 * 60 * 1000;
  assert.equal((await service.session(registered.session.token)).account.username, "expiry_user");
  nowMilliseconds += 60 * 60 * 1000 + 1;
  await assert.rejects(service.session(registered.session.token), (error) => error.code === "authentication_required");
});

test("account mutations require exact origin, JSON, and a session-bound CSRF token", async () => {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  const handler = createCustomerAccountHandler({ service });
  const rejectedOrigin = await call(handler, {
    method: "POST",
    origin: "https://attacker.invalid",
    body: JSON.stringify({ action: "register", username: "origin_user", password })
  });
  assert.equal(rejectedOrigin.statusCode, 403);
  assert.equal(rejectedOrigin.payload.code, "request_origin_rejected");
  const rejectedFetchMetadata = await call(handler, {
    method: "POST",
    extraHeaders: { "sec-fetch-site": "cross-site" },
    body: JSON.stringify({ action: "register", username: "origin_user", password })
  });
  assert.equal(rejectedFetchMetadata.statusCode, 403);

  const rejectedType = await call(handler, {
    method: "POST",
    contentType: "text/plain",
    body: JSON.stringify({ action: "register", username: "origin_user", password })
  });
  assert.equal(rejectedType.statusCode, 415);

  const registered = await call(handler, {
    method: "POST",
    body: JSON.stringify({ action: "register", username: "origin_user", password })
  });
  const cookie = cookieFrom(registered);
  const withoutCsrf = await call(handler, {
    method: "POST",
    cookie,
    body: JSON.stringify({ action: "save_listing", snapshot: sampleSnapshot })
  });
  assert.equal(withoutCsrf.statusCode, 403);
  assert.equal(withoutCsrf.payload.code, "csrf_verification_failed");

  const saved = await call(handler, {
    method: "POST",
    cookie,
    csrfToken: registered.payload.session.csrfToken,
    body: JSON.stringify({ action: "save_listing", snapshot: sampleSnapshot })
  });
  assert.equal(saved.statusCode, 200);
  assert.doesNotMatch(JSON.stringify(saved.payload), /PRIVATE_IMAGE_BYTES|private\\artifact/);

  const usernameChange = await call(handler, {
    method: "PATCH",
    cookie,
    csrfToken: registered.payload.session.csrfToken,
    body: JSON.stringify({ action: "change_username", username: "substituted_user" })
  });
  assert.equal(usernameChange.statusCode, 405);
  assert.equal((await service.session(cookie.split("=")[1])).account.username, "origin_user");

  const oversized = await call(handler, {
    method: "POST",
    body: "{}",
    extraHeaders: { "content-length": String(256 * 1024 + 1) }
  });
  assert.equal(oversized.statusCode, 413);
  const invalidLength = await call(handler, {
    method: "POST",
    body: "{}",
    extraHeaders: { "content-length": "not-a-number" }
  });
  assert.equal(invalidLength.statusCode, 400);
  assert.equal(invalidLength.payload.code, "invalid_content_length");
});

test("Preview cookies are always Secure and clearing preserves the cookie attributes", async () => {
  const environment = { VERCEL_ENV: "preview", KATHERINES_EYE_PUBLIC_ORIGIN: "https://candidate.katherineseye.test" };
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  const handler = createCustomerAccountHandler({ service, environment });
  const registered = await call(handler, {
    method: "POST",
    origin: environment.KATHERINES_EYE_PUBLIC_ORIGIN,
    host: "candidate.katherineseye.test",
    body: JSON.stringify({ action: "register", username: "secure_user", password })
  });
  assert.match(registered.headers["set-cookie"], /; HttpOnly; SameSite=Strict; Max-Age=43200; Secure$/);
  const signedOut = await call(handler, {
    method: "POST",
    origin: environment.KATHERINES_EYE_PUBLIC_ORIGIN,
    host: "candidate.katherineseye.test",
    cookie: cookieFrom(registered),
    csrfToken: registered.payload.session.csrfToken,
    body: JSON.stringify({ action: "logout" })
  });
  assert.match(signedOut.headers["set-cookie"], /Path=\/; HttpOnly; SameSite=Strict; Max-Age=0; Secure$/);
});

test("file persistence serializes concurrent ownership mutations and recovers the last known good state", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ke-hardened-store-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "accounts.json");
  const first = createCustomerAccountService({ store: createFileCustomerAccountStore(filePath) });
  const registered = await first.register({ username: "file_user", password });
  await first.saveListing(registered.session.token, sampleSnapshot);

  const concurrentServices = Array.from({ length: 8 }, () => createCustomerAccountService({ store: createFileCustomerAccountStore(filePath) }));
  await Promise.all(concurrentServices.map((service, index) => service.saveListing(registered.session.token, {
    ...sampleSnapshot,
    title: `Concurrent result ${index + 1}`
  })));
  const fresh = createCustomerAccountService({ store: createFileCustomerAccountStore(filePath) });
  assert.equal((await fresh.listHistory(registered.session.token)).listings.length, 9);

  await fs.writeFile(filePath, "{corrupt", "utf8");
  const recovered = createCustomerAccountService({ store: createFileCustomerAccountStore(filePath) });
  assert.equal((await recovered.login({ username: "file_user", password })).account.username, "file_user");
  assert.equal(JSON.parse(await fs.readFile(filePath, "utf8")).schemaVersion, CUSTOMER_ACCOUNT_SCHEMA_VERSION);

  const staleLock = `${filePath}.lock`;
  await fs.writeFile(staleLock, JSON.stringify({ lockIdentity: "stale" }), "utf8");
  const staleTime = new Date(Date.now() - 120_000);
  await fs.utimes(staleLock, staleTime, staleTime);
  await recovered.cleanupExpired();
  await assert.rejects(fs.access(staleLock));

  await fs.writeFile(filePath, "{corrupt-primary", "utf8");
  await fs.writeFile(`${filePath}.bak`, "{corrupt-backup", "utf8");
  await assert.rejects(
    createFileCustomerAccountStore(filePath).read(),
    (error) => error.code === "customer_account_store_corrupt"
  );
  assert.throws(
    () => createFileCustomerAccountStore(path.join(directory, "accounts.txt")),
    /bounded JSON file/
  );
});

test("durable adapter contract resolves compare-and-swap conflicts without losing accounts", async () => {
  let snapshot = null;
  const adapter = {
    async readSnapshot() { return snapshot == null ? null : structuredClone(snapshot); },
    async compareAndSwap({ expectedRevision, nextState }) {
      await new Promise((resolve) => setImmediate(resolve));
      const actualRevision = Number(snapshot?.revision || 0);
      if (actualRevision !== expectedRevision) return false;
      snapshot = structuredClone(nextState);
      return true;
    }
  };
  const left = createCustomerAccountService({ store: createDurableCustomerAccountStore(adapter) });
  const right = createCustomerAccountService({ store: createDurableCustomerAccountStore(adapter) });
  const [alice, bob] = await Promise.all([
    left.register({ username: "durable_alice", password }),
    right.register({ username: "durable_bob", password: "another durable password" })
  ]);
  assert.equal((await left.session(alice.session.token)).account.username, "durable_alice");
  assert.equal((await right.session(bob.session.token)).account.username, "durable_bob");
  assert.equal(Object.keys(snapshot.accounts).length, 2);
  assert.ok(snapshot.revision >= 4);
});

test("readiness distinguishes local, blocked Preview, and fully bound Preview without exposing values", async () => {
  const local = assessCustomerBetaReadiness({ environment: { KATHERINES_EYE_ACCOUNT_STORE_PATH: "C:\\private\\accounts.json" } });
  assert.equal(local.state, "local_ready");
  const blocked = assessCustomerBetaReadiness({ environment: { VERCEL_ENV: "preview" } });
  assert.equal(blocked.state, "preview_blocked");
  assert.deepEqual(blocked.blockers, ["https_public_origin_not_configured", "durable_account_persistence_not_connected"]);
  const previewEnvironment = { VERCEL_ENV: "preview", KATHERINES_EYE_PUBLIC_ORIGIN: "https://candidate.katherineseye.test" };
  const readyContract = {
    kind: "durable_compare_and_swap",
    schemaVersion: "2.0",
    atomicOwnershipMutations: true,
    retentionCleanup: true,
    sharedAuthenticationThrottle: true
  };
  assert.equal(assessCustomerBetaReadiness({ environment: previewEnvironment, durablePersistence: readyContract }).state, "preview_ready");

  const handler = createBetaReadinessHandler({ environment: { VERCEL_ENV: "preview" } });
  const response = responseCapture();
  await handler({ method: "GET", headers: {}, url: "/api/beta-readiness" }, response);
  assert.equal(response.statusCode, 503);
  assert.equal(response.payload.state, "preview_blocked");
  assert.doesNotMatch(JSON.stringify(response.payload), /C:\\|secret|token|credential/i);
});

test("fresh-process local beta smoke transaction completes with hard network denial and full deletion", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "ke-beta-smoke-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const storePath = path.join(directory, "accounts.json");
  const network = installHardNetworkDenial();
  try {
    const first = createCustomerAccountService({ store: createFileCustomerAccountStore(storePath) });
    const registered = await first.register({ username: "smoke_user", password });
    assert.equal((await first.session(registered.session.token)).account.username, "smoke_user");
    const saved = await first.saveListing(registered.session.token, sampleSnapshot);

    const fresh = createCustomerAccountService({ store: createFileCustomerAccountStore(storePath) });
    assert.equal((await fresh.listHistory(registered.session.token)).listings.length, 1);
    assert.equal((await fresh.getListing(registered.session.token, saved.listing.id)).listing.snapshot.imageRetention, "none");
    await fresh.renameListing(registered.session.token, saved.listing.id, "Renamed smoke result");
    const exported = await fresh.exportAccount(registered.session.token);
    assert.equal(exported.export.savedListings[0].name, "Renamed smoke result");
    assert.doesNotMatch(JSON.stringify(exported), /PRIVATE_IMAGE_BYTES|private\\artifact/);
    await fresh.deleteListing(registered.session.token, saved.listing.id);
    assert.deepEqual((await fresh.listHistory(registered.session.token)).listings, []);

    const parallelSession = await fresh.login({ username: "smoke_user", password });
    const changed = await fresh.changePassword(registered.session.token, {
      currentPassword: password,
      newPassword: "new smoke password phrase"
    });
    await assert.rejects(fresh.session(parallelSession.session.token), (error) => error.code === "authentication_required");
    await fresh.logout(changed.session.token);
    await assert.rejects(fresh.session(changed.session.token), (error) => error.code === "authentication_required");
    const finalSession = await fresh.login({ username: "smoke_user", password: "new smoke password phrase" });
    await fresh.deleteAccount(finalSession.session.token, "new smoke password phrase");
    const state = await createFileCustomerAccountStore(storePath).read();
    assert.deepEqual(state.accounts, {});
    assert.deepEqual(state.usernameIndex, {});
    assert.deepEqual(state.sessions, {});
    assert.deepEqual(state.histories, {});
    const recoveryState = JSON.parse(await fs.readFile(`${storePath}.bak`, "utf8"));
    assert.deepEqual(recoveryState.accounts, {});
    assert.deepEqual(recoveryState.histories, {});
    assert.doesNotMatch(JSON.stringify(recoveryState), /smoke_user|PRIVATE_IMAGE_BYTES|private\\artifact/);
    assert.equal(network.attempts.length, 0);
  } finally {
    network.restore();
  }
});
