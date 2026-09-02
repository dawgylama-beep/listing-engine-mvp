import path from "node:path";
import { CUSTOMER_ACCOUNT_SCHEMA_VERSION } from "./service.js";

export const BETA_READINESS_STATES = Object.freeze({
  LOCAL_READY: "local_ready",
  PREVIEW_BLOCKED: "preview_blocked",
  PREVIEW_READY: "preview_ready"
});

function runtimeProfile(environment) {
  const vercelEnvironment = String(environment.VERCEL_ENV || "").trim().toLowerCase();
  return ["preview", "production"].includes(vercelEnvironment) ? vercelEnvironment : "local";
}
function validPublicOrigin(value, { requireHttps }) {
  try {
    const url = new URL(String(value || ""));
    return url.origin === String(value || "").replace(/\/$/, "")
      && (!requireHttps || url.protocol === "https:")
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

export function assessCustomerBetaReadiness({
  environment = process.env,
  durablePersistence = null,
  persistenceBlocker = ""
} = {}) {
  const profile = runtimeProfile(environment);
  const localPath = String(environment.KATHERINES_EYE_ACCOUNT_STORE_PATH || "").trim();
  const localFileConfigured = Boolean(localPath && path.isAbsolute(localPath) && path.extname(localPath).toLowerCase() === ".json");
  const publicOriginConfigured = validPublicOrigin(environment.KATHERINES_EYE_PUBLIC_ORIGIN, { requireHttps: profile !== "local" });
  const postgresAdapterConfigured = String(environment.KATHERINES_EYE_ACCOUNT_STORE_ADAPTER || "").trim() === "postgres-v1";
  const postgresDatabaseConfigured = Boolean(String(environment.KATHERINES_EYE_ACCOUNT_DATABASE_URL || "").trim());
  const durableReady = Boolean(
    postgresAdapterConfigured
    && postgresDatabaseConfigured
    && durablePersistence?.adapter === "postgres-v1"
    && durablePersistence?.kind === "durable_compare_and_swap"
    && durablePersistence?.schemaVersion === CUSTOMER_ACCOUNT_SCHEMA_VERSION
    && durablePersistence?.atomicOwnershipMutations === true
    && durablePersistence?.retentionCleanup === true
    && durablePersistence?.sharedAuthenticationThrottle === true
  );

  if (profile === "local") {
    return {
      state: localFileConfigured ? BETA_READINESS_STATES.LOCAL_READY : BETA_READINESS_STATES.PREVIEW_BLOCKED,
      runtimeProfile: profile,
      checks: {
        localFilePersistence: localFileConfigured,
        durablePreviewPersistence: false,
        httpsPublicOrigin: publicOriginConfigured,
        atomicOwnershipMutations: true,
        retentionCleanup: true,
        uploadedImageRetention: false
      },
      blockers: localFileConfigured ? [] : ["local_account_store_not_configured"],
      requiredEnvironmentKeys: ["KATHERINES_EYE_ACCOUNT_STORE_PATH"]
    };
  }

  const blockers = [];
  if (!publicOriginConfigured) blockers.push("https_public_origin_not_configured");
  if (!postgresAdapterConfigured) blockers.push("postgres_account_adapter_not_configured");
  if (!postgresDatabaseConfigured) blockers.push("postgres_database_url_not_configured");
  if (postgresAdapterConfigured && postgresDatabaseConfigured && !durableReady) {
    blockers.push(persistenceBlocker || "durable_account_persistence_not_connected");
  }
  return {
    state: blockers.length ? BETA_READINESS_STATES.PREVIEW_BLOCKED : BETA_READINESS_STATES.PREVIEW_READY,
    runtimeProfile: profile,
    checks: {
      localFilePersistence: false,
      durablePreviewPersistence: durableReady,
      httpsPublicOrigin: publicOriginConfigured,
      atomicOwnershipMutations: durableReady,
      retentionCleanup: durableReady,
      uploadedImageRetention: false
    },
    blockers,
    requiredEnvironmentKeys: [
      "KATHERINES_EYE_ACCOUNT_STORE_ADAPTER",
      "KATHERINES_EYE_ACCOUNT_DATABASE_URL",
      "KATHERINES_EYE_PUBLIC_ORIGIN"
    ]
  };
}
