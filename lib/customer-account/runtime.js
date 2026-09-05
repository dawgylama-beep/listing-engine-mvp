import path from "node:path";
import crypto from "node:crypto";
import {
  createCustomerAccountService,
  createFileCustomerAccountStore
} from "./service.js";
import {
  createPostgresCustomerAccountStore,
  POSTGRES_ACCOUNT_STORE_ADAPTER,
  POSTGRES_DURABLE_PERSISTENCE
} from "./postgres.js";

let processRuntimePromise = null;
let processRuntimeIdentity = "";

export function resolveCustomerAccountDatabaseUrl(environment = process.env) {
  const preferred = String(environment.KATHERINES_EYE_ACCOUNT_DATABASE_URL || "").trim();
  if (preferred) return preferred;
  return String(environment.KATHERINES_EYE_ACCOUNT_DATABASE_DATABASE_URL || "").trim();
}

function runtimeProfile(environment) {
  const vercelEnvironment = String(environment.VERCEL_ENV || "").trim().toLowerCase();
  return ["preview", "production"].includes(vercelEnvironment) ? vercelEnvironment : "local";
}

function configurationIdentity(environment) {
  return crypto.createHash("sha256").update(JSON.stringify({
    runtimeProfile: runtimeProfile(environment),
    adapter: String(environment.KATHERINES_EYE_ACCOUNT_STORE_ADAPTER || "").trim(),
    databaseUrl: resolveCustomerAccountDatabaseUrl(environment),
    localPath: String(environment.KATHERINES_EYE_ACCOUNT_STORE_PATH || "").trim()
  })).digest("hex");
}

async function buildRuntime(environment, { postgresQuery } = {}) {
  const profile = runtimeProfile(environment);
  const adapter = String(environment.KATHERINES_EYE_ACCOUNT_STORE_ADAPTER || "").trim();
  if (profile === "local" && !adapter) {
    const configuredPath = String(environment.KATHERINES_EYE_ACCOUNT_STORE_PATH || "").trim();
    if (!configuredPath || !path.isAbsolute(configuredPath)) {
      return { profile, service: null, durablePersistence: null, blocker: "local_account_store_not_configured" };
    }
    try {
      const store = createFileCustomerAccountStore(path.resolve(configuredPath));
      await store.read();
      return {
        profile,
        service: createCustomerAccountService({ store }),
        durablePersistence: null,
        healthCheck: () => store.read().then(() => true),
        blocker: ""
      };
    } catch {
      return { profile, service: null, durablePersistence: null, blocker: "local_account_store_unavailable" };
    }
  }
  if (adapter !== POSTGRES_ACCOUNT_STORE_ADAPTER) {
    return { profile, service: null, durablePersistence: null, blocker: "postgres_account_adapter_not_configured" };
  }
  const databaseUrl = resolveCustomerAccountDatabaseUrl(environment);
  if (!databaseUrl && !postgresQuery) {
    return { profile, service: null, durablePersistence: null, blocker: "postgres_database_url_not_configured" };
  }
  try {
    const store = createPostgresCustomerAccountStore({ databaseUrl, query: postgresQuery });
    await store.read();
    return {
      profile,
      service: createCustomerAccountService({ store }),
      durablePersistence: POSTGRES_DURABLE_PERSISTENCE,
      healthCheck: () => store.read().then(() => true),
      blocker: ""
    };
  } catch {
    return { profile, service: null, durablePersistence: null, blocker: "postgres_account_store_unavailable" };
  }
}

export async function resolveCustomerAccountRuntime({ environment = process.env, postgresQuery } = {}) {
  if (environment !== process.env || postgresQuery) return buildRuntime(environment, { postgresQuery });
  const identity = configurationIdentity(environment);
  if (!processRuntimePromise || processRuntimeIdentity !== identity) {
    processRuntimeIdentity = identity;
    processRuntimePromise = buildRuntime(environment).then((runtime) => {
      if (!runtime.service) {
        processRuntimePromise = null;
        processRuntimeIdentity = "";
      }
      return runtime;
    });
  }
  return processRuntimePromise;
}

export function resetCustomerAccountRuntimeForTests() {
  processRuntimePromise = null;
  processRuntimeIdentity = "";
}
