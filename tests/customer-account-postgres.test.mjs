import assert from "node:assert/strict";
import test from "node:test";
import { createBetaReadinessHandler } from "../api/beta-readiness.js";
import { CUSTOMER_ACCOUNT_SCHEMA_VERSION, createCustomerAccountService } from "../lib/customer-account/service.js";
import {
  createPostgresCustomerAccountStore,
  POSTGRES_ACCOUNT_STORE_KEY,
  POSTGRES_ACCOUNT_STORE_SQL,
  POSTGRES_DURABLE_PERSISTENCE
} from "../lib/customer-account/postgres.js";
import { assessCustomerBetaReadiness } from "../lib/customer-account/readiness.js";
import { resolveCustomerAccountRuntime } from "../lib/customer-account/runtime.js";

const password = "correct horse battery staple";
const snapshot = {
  title: "Walnut tray",
  workflow: "personal_use",
  identification: { confidence: "Moderate", summary: "A divided wooden tray." },
  listing: { title: "Walnut tray", description: "A divided wooden tray.", itemDetails: [], visibleCondition: ["Light wear"] },
  pricing: { disposition: "Pricing not established", range: "", rationale: "No retained price evidence." },
  recommendation: "Inspect the underside.",
  uncertainty: [], alternatives: [], requestedPhotos: [], researchSteps: [], evidence: [],
  uploadedImage: "must not persist"
};

function fakePostgres(initialRow = null) {
  let row = initialRow ? structuredClone(initialRow) : null;
  let initialized = false;
  let forcedConflicts = 0;
  const calls = [];
  return {
    calls,
    forceConflicts(count) { forcedConflicts = count; },
    get row() { return structuredClone(row); },
    async query(sql, parameters) {
      calls.push({ sql, parameters: structuredClone(parameters) });
      if (sql === POSTGRES_ACCOUNT_STORE_SQL.initialize) {
        initialized = true;
        return { rows: [], rowCount: 0, command: "CREATE TABLE" };
      }
      assert.equal(initialized, true);
      if (sql === POSTGRES_ACCOUNT_STORE_SQL.read) {
        assert.deepEqual(parameters, [POSTGRES_ACCOUNT_STORE_KEY]);
        return { rows: row ? [structuredClone(row)] : [], rowCount: row ? 1 : 0, command: `SELECT ${row ? 1 : 0}` };
      }
      if (sql === POSTGRES_ACCOUNT_STORE_SQL.insert) {
        if (forcedConflicts > 0) {
          forcedConflicts -= 1;
          return { rows: [], rowCount: 0, command: "INSERT 0 0" };
        }
        if (row) return { rows: [], rowCount: 0, command: "INSERT 0 0" };
        row = { schema_version: parameters[1], revision: parameters[2], state_json: parameters[3] };
        return { rows: [{ revision: parameters[2] }], rowCount: 1, command: "INSERT 0 1" };
      }
      if (sql === POSTGRES_ACCOUNT_STORE_SQL.update) {
        if (forcedConflicts > 0) {
          forcedConflicts -= 1;
          return { rows: [], rowCount: 0, command: "UPDATE 0" };
        }
        if (!row || ![parameters[1], parameters[5], parameters[6]].includes(row.schema_version) || row.revision !== parameters[2]) {
          return { rows: [], rowCount: 0, command: "UPDATE 0" };
        }
        row = { schema_version: parameters[1], revision: parameters[3], state_json: parameters[4] };
        return { rows: [{ revision: parameters[3] }], rowCount: 1, command: "UPDATE 1" };
      }
      throw new Error("Unexpected SQL in controlled PostgreSQL fixture.");
    }
  };
}

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

test("postgres-v1 initializes an empty schema and performs revision-bound compare-and-swap", async () => {
  const database = fakePostgres();
  const store = createPostgresCustomerAccountStore({ query: database.query.bind(database) });
  const empty = await store.read();
  assert.equal(empty.schemaVersion, CUSTOMER_ACCOUNT_SCHEMA_VERSION);
  assert.equal(empty.revision, 0);
  assert.deepEqual(empty.accounts, {});
  const next = structuredClone(empty);
  next.revision = 1;
  assert.equal(await store.compareAndSwap({ expectedRevision: 0, nextState: next }), true);
  assert.equal((await store.read()).revision, 1);
  assert.equal(database.calls.filter(({ sql }) => sql === POSTGRES_ACCOUNT_STORE_SQL.initialize).length, 1);
});

test("postgres-v1 migrates schema-2 accounts in place with a username preferred-name fallback", async () => {
  const seedDatabase = fakePostgres();
  const seedService = createCustomerAccountService({
    store: createPostgresCustomerAccountStore({ query: seedDatabase.query.bind(seedDatabase) })
  });
  const registered = await seedService.register({
    username: "legacy_pg_user",
    password,
    preferredName: "Temporary label"
  });
  const legacySnapshot = JSON.parse(seedDatabase.row.state_json);
  legacySnapshot.schemaVersion = "2.0";
  delete legacySnapshot.accounts[registered.account.id].preferredName;
  const legacyDatabase = fakePostgres({
    schema_version: "2.0",
    revision: seedDatabase.row.revision,
    state_json: JSON.stringify(legacySnapshot)
  });
  const migratedService = createCustomerAccountService({
    store: createPostgresCustomerAccountStore({ query: legacyDatabase.query.bind(legacyDatabase) })
  });

  assert.equal((await migratedService.session(registered.session.token)).account.preferredName, "legacy_pg_user");
  assert.equal(legacyDatabase.row.schema_version, CUSTOMER_ACCOUNT_SCHEMA_VERSION);
  const migratedSnapshot = JSON.parse(legacyDatabase.row.state_json);
  assert.equal(migratedSnapshot.schemaVersion, CUSTOMER_ACCOUNT_SCHEMA_VERSION);
  assert.equal(migratedSnapshot.accounts[registered.account.id].preferredName, "legacy_pg_user");
});

test("postgres-v1 retries bounded conflicts and preserves concurrent unique accounts", async () => {
  const database = fakePostgres();
  const query = database.query.bind(database);
  const left = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }) });
  const right = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }) });
  const [alice, bob] = await Promise.all([
    left.register({ username: "durable_alice", password }),
    right.register({ username: "durable_bob", password: "another durable password" })
  ]);
  assert.equal((await right.session(alice.session.token)).account.username, "durable_alice");
  assert.equal((await left.session(bob.session.token)).account.username, "durable_bob");
  const persisted = JSON.parse(database.row.state_json);
  assert.equal(Object.keys(persisted.accounts).length, 2);

  database.forceConflicts(5);
  await assert.rejects(
    left.register({ username: "conflict_user", password }),
    (error) => error.code === "customer_account_store_busy"
  );
});

test("postgres-v1 preserves normalized username uniqueness during a concurrent race", async () => {
  const database = fakePostgres();
  const query = database.query.bind(database);
  const left = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }) });
  const right = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }) });
  const outcomes = await Promise.allSettled([
    left.register({ username: "Race_User", password }),
    right.register({ username: "race_user", password: "another durable password" })
  ]);
  assert.equal(outcomes.filter(({ status }) => status === "fulfilled").length, 1);
  const rejection = outcomes.find(({ status }) => status === "rejected");
  assert.equal(rejection.reason.code, "registration_unavailable");
  const persisted = JSON.parse(database.row.state_json);
  assert.deepEqual(Object.keys(persisted.usernameIndex), ["race_user"]);
});

test("postgres-v1 enforces username and history ownership across independent service instances", async () => {
  const database = fakePostgres();
  const query = database.query.bind(database);
  const first = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }) });
  const second = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }) });
  const alice = await first.register({ username: "private_alice", password });
  const bob = await second.register({ username: "private_bob", password: "another durable password" });
  await assert.rejects(
    second.register({ username: "PRIVATE_ALICE", password: "a third durable password" }),
    (error) => error.code === "registration_unavailable"
  );
  const saved = await first.saveListing(alice.session.token, snapshot);
  assert.equal(JSON.stringify(database.row).includes("must not persist"), false);
  for (const operation of [
    () => second.getListing(bob.session.token, saved.listing.id),
    () => second.renameListing(bob.session.token, saved.listing.id, "Cross-account rename"),
    () => second.deleteListing(bob.session.token, saved.listing.id)
  ]) await assert.rejects(operation, (error) => error.code === "listing_not_found");
  assert.equal((await first.listHistory(alice.session.token)).listings.length, 1);
  assert.equal((await first.renameListing(alice.session.token, saved.listing.id, "Entryway tray")).listing.name, "Entryway tray");
  const exported = await first.exportAccount(alice.session.token);
  assert.equal(exported.export.boundaries.uploadedImagesStored, false);
  await first.deleteListing(alice.session.token, saved.listing.id);
  assert.deepEqual((await first.listHistory(alice.session.token)).listings, []);
});

test("postgres-v1 persists sessions, shared throttling, retention, revocation, and account cleanup", async () => {
  let nowMilliseconds = Date.parse("2026-08-31T12:00:00.000Z");
  const database = fakePostgres();
  const query = database.query.bind(database);
  const first = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }), now: () => nowMilliseconds });
  const registered = await first.register({ username: "lifecycle_user", password }, { sourceIdentity: "198.51.100.30" });
  await first.saveListing(registered.session.token, snapshot);
  const second = createCustomerAccountService({ store: createPostgresCustomerAccountStore({ query }), now: () => nowMilliseconds });
  assert.equal((await second.session(registered.session.token)).account.username, "lifecycle_user");
  const parallel = await second.login({ username: "lifecycle_user", password });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await assert.rejects(
      first.login({ username: "unknown_user", password: "incorrect password" }, { sourceIdentity: "198.51.100.31" }),
      (error) => ["invalid_credentials", "authentication_throttled"].includes(error.code)
    );
  }
  await assert.rejects(
    second.login({ username: "unknown_user", password: "incorrect password" }, { sourceIdentity: "198.51.100.31" }),
    (error) => error.code === "authentication_throttled"
  );
  const changed = await first.changePassword(registered.session.token, { currentPassword: password, newPassword: "new durable password phrase" });
  await assert.rejects(second.session(parallel.session.token), (error) => error.code === "authentication_required");
  await first.updatePreferences(changed.session.token, { historyRetentionDays: 7 });
  nowMilliseconds += 8 * 86_400_000;
  const afterRetention = await second.login({ username: "lifecycle_user", password: "new durable password phrase" });
  assert.deepEqual((await first.listHistory(afterRetention.session.token)).listings, []);
  nowMilliseconds += 13 * 60 * 60 * 1000;
  await assert.rejects(first.session(afterRetention.session.token), (error) => error.code === "authentication_required");
  const deletionSession = await first.login({ username: "lifecycle_user", password: "new durable password phrase" });
  await second.deleteAccount(deletionSession.session.token, "new durable password phrase");
  const persisted = JSON.parse(database.row.state_json);
  assert.deepEqual(persisted.accounts, {});
  assert.deepEqual(persisted.histories, {});
  assert.deepEqual(persisted.sessions, {});
});

test("postgres-v1 rejects incompatible and corrupt durable snapshots", async () => {
  const incompatible = fakePostgres({ schema_version: "4.0", revision: "0", state_json: JSON.stringify({ schemaVersion: "4.0", revision: 0 }) });
  await assert.rejects(
    createPostgresCustomerAccountStore({ query: incompatible.query.bind(incompatible) }).read(),
    (error) => error.code === "customer_account_postgres_schema_mismatch"
  );
  const corrupt = fakePostgres({ schema_version: CUSTOMER_ACCOUNT_SCHEMA_VERSION, revision: "1", state_json: "{}" });
  await assert.rejects(
    createPostgresCustomerAccountStore({ query: corrupt.query.bind(corrupt) }).read(),
    (error) => error.code === "customer_account_postgres_corrupt"
  );
  assert.throws(
    () => createPostgresCustomerAccountStore({ databaseUrl: "" }),
    (error) => error.code === "customer_account_postgres_configuration_invalid"
  );
});

test("Preview runtime fails closed on incomplete storage configuration and reports readiness without secrets", async () => {
  const base = { VERCEL_ENV: "preview", KATHERINES_EYE_PUBLIC_ORIGIN: "https://candidate.katherineseye.test" };
  const missing = await resolveCustomerAccountRuntime({ environment: base });
  assert.equal(missing.service, null);
  assert.equal(missing.blocker, "postgres_account_adapter_not_configured");

  const database = fakePostgres();
  const environment = {
    ...base,
    KATHERINES_EYE_ACCOUNT_STORE_ADAPTER: "postgres-v1",
    KATHERINES_EYE_ACCOUNT_DATABASE_URL: "configured-preview-database-binding"
  };
  const runtime = await resolveCustomerAccountRuntime({ environment, postgresQuery: database.query.bind(database) });
  assert.deepEqual(runtime.durablePersistence, POSTGRES_DURABLE_PERSISTENCE);
  assert.equal(assessCustomerBetaReadiness({ environment, durablePersistence: runtime.durablePersistence }).state, "preview_ready");

  const response = responseCapture();
  const handler = createBetaReadinessHandler({ environment, resolveRuntime: async () => runtime });
  await handler({ method: "GET", headers: {}, url: "/api/beta-readiness" }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.payload.state, "preview_ready");
  const serialized = JSON.stringify(response.payload);
  assert.equal(serialized.includes("configured-preview-database-binding"), false);

  const unavailable = responseCapture();
  const unavailableHandler = createBetaReadinessHandler({
    environment,
    resolveRuntime: async () => ({ durablePersistence: null, blocker: "postgres_account_store_unavailable" })
  });
  await unavailableHandler({ method: "GET", headers: {}, url: "/api/beta-readiness" }, unavailable);
  assert.equal(unavailable.statusCode, 503);
  assert.deepEqual(unavailable.payload.blockers, ["postgres_account_store_unavailable"]);
});
