import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { assessCustomerBetaReadiness } from "../lib/customer-account/readiness.js";
import {
  resolveCustomerAccountDatabaseUrl,
  resolveCustomerAccountRuntime
} from "../lib/customer-account/runtime.js";
import {
  POSTGRES_ACCOUNT_STORE_KEY,
  POSTGRES_ACCOUNT_STORE_SQL,
  POSTGRES_DURABLE_PERSISTENCE
} from "../lib/customer-account/postgres.js";

const preferredKey = "KATHERINES_EYE_ACCOUNT_DATABASE_URL";
const managedKey = "KATHERINES_EYE_ACCOUNT_DATABASE_DATABASE_URL";
const preferredBinding = "opaque-preferred-binding";
const managedBinding = "opaque-managed-binding";
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readyContract = POSTGRES_DURABLE_PERSISTENCE;

function previewEnvironment(database = {}) {
  return {
    VERCEL_ENV: "preview",
    KATHERINES_EYE_PUBLIC_ORIGIN: "https://candidate.katherineseye.test",
    KATHERINES_EYE_ACCOUNT_STORE_ADAPTER: "postgres-v1",
    ...database
  };
}

function productionEnvironment(database = {}) {
  return {
    VERCEL_ENV: "production",
    KATHERINES_EYE_PUBLIC_ORIGIN: "https://katherineseye.com",
    KATHERINES_EYE_ACCOUNT_STORE_ADAPTER: "postgres-v1",
    ...database
  };
}

function emptyPostgresQuery() {
  let initialized = false;
  return async (sql, parameters) => {
    if (sql === POSTGRES_ACCOUNT_STORE_SQL.initialize) {
      initialized = true;
      return { rows: [], rowCount: 0, command: "CREATE TABLE" };
    }
    assert.equal(initialized, true);
    assert.equal(sql, POSTGRES_ACCOUNT_STORE_SQL.read);
    assert.deepEqual(parameters, [POSTGRES_ACCOUNT_STORE_KEY]);
    return { rows: [], rowCount: 0, command: "SELECT 0" };
  };
}

async function publicFiles(directory) {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await publicFiles(target));
    else files.push(target);
  }
  return files;
}

test("preferred database variable wins when both supported names exist", () => {
  const environment = previewEnvironment({
    [preferredKey]: preferredBinding,
    [managedKey]: managedBinding
  });
  assert.equal(resolveCustomerAccountDatabaseUrl(environment) === preferredBinding, true);
  assert.equal(resolveCustomerAccountDatabaseUrl(environment) === managedBinding, false);
});

test("managed Vercel database variable supports runtime and readiness when preferred is absent", async () => {
  const environment = previewEnvironment({ [managedKey]: managedBinding });
  assert.equal(resolveCustomerAccountDatabaseUrl(environment) === managedBinding, true);
  const runtime = await resolveCustomerAccountRuntime({
    environment,
    postgresQuery: emptyPostgresQuery()
  });
  assert.deepEqual(runtime.durablePersistence, readyContract);
  assert.equal(assessCustomerBetaReadiness({
    environment,
    durablePersistence: runtime.durablePersistence
  }).state, "preview_ready");
});

test("missing supported database variables fails closed without arbitrary discovery", async () => {
  const environment = previewEnvironment({ DATABASE_URL: "unrelated-binding" });
  assert.equal(resolveCustomerAccountDatabaseUrl(environment), "");
  const runtime = await resolveCustomerAccountRuntime({ environment });
  assert.equal(runtime.service, null);
  assert.equal(runtime.blocker, "postgres_database_url_not_configured");
  assert.deepEqual(
    assessCustomerBetaReadiness({ environment, durablePersistence: readyContract }).blockers,
    ["postgres_database_url_not_configured"]
  );
});

test("database binding values remain absent from logs, responses, errors, snapshots, and client files", async () => {
  const messages = [];
  const original = { log: console.log, warn: console.warn, error: console.error };
  console.log = (...values) => messages.push(values);
  console.warn = (...values) => messages.push(values);
  console.error = (...values) => messages.push(values);
  try {
    const environment = previewEnvironment({
      [preferredKey]: preferredBinding,
      [managedKey]: managedBinding
    });
    resolveCustomerAccountDatabaseUrl(environment);
    const readiness = assessCustomerBetaReadiness({ environment, durablePersistence: readyContract });
    const serializedServerState = JSON.stringify({
      readiness,
      missing: await resolveCustomerAccountRuntime({ environment: previewEnvironment() })
    });
    assert.equal(serializedServerState.includes(preferredBinding), false);
    assert.equal(serializedServerState.includes(managedBinding), false);
  } finally {
    console.log = original.log;
    console.warn = original.warn;
    console.error = original.error;
  }
  assert.equal(JSON.stringify(messages).includes(preferredBinding), false);
  assert.equal(JSON.stringify(messages).includes(managedBinding), false);

  const clientText = (await Promise.all(
    (await publicFiles(path.join(repositoryRoot, "public"))).map((file) => fs.readFile(file, "utf8"))
  )).join("\n");
  assert.equal(clientText.includes(preferredKey), false);
  assert.equal(clientText.includes(managedKey), false);
  assert.equal(clientText.includes(preferredBinding), false);
  assert.equal(clientText.includes(managedBinding), false);
});

test("Production remains fail-closed except for the two explicit supported names", () => {
  const missing = assessCustomerBetaReadiness({
    environment: productionEnvironment(),
    durablePersistence: readyContract
  });
  const arbitrary = assessCustomerBetaReadiness({
    environment: productionEnvironment({ DATABASE_URL: "unrelated-binding" }),
    durablePersistence: readyContract
  });
  const preferred = assessCustomerBetaReadiness({
    environment: productionEnvironment({ [preferredKey]: preferredBinding }),
    durablePersistence: readyContract
  });
  const managedOnly = assessCustomerBetaReadiness({
    environment: productionEnvironment({ [managedKey]: managedBinding }),
    durablePersistence: readyContract
  });
  const both = assessCustomerBetaReadiness({
    environment: productionEnvironment({
      [preferredKey]: preferredBinding,
      [managedKey]: managedBinding
    }),
    durablePersistence: readyContract
  });

  assert.deepEqual(missing.blockers, ["postgres_database_url_not_configured"]);
  assert.deepEqual(arbitrary, missing);
  assert.equal(preferred.state, "preview_ready");
  assert.deepEqual(both, preferred);
  assert.equal(managedOnly.state, "preview_ready");
});
