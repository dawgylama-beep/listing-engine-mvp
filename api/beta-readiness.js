import { assessCustomerBetaReadiness } from "../lib/customer-account/readiness.js";
import { resolveCustomerAccountRuntime } from "../lib/customer-account/runtime.js";

function sendJson(res, status, payload) {
  res.status(status);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.json(payload);
}

export function createBetaReadinessHandler({ environment = process.env, durablePersistence = null, resolveRuntime = resolveCustomerAccountRuntime } = {}) {
  return async function betaReadinessHandler(req, res) {
    if (String(req.method || "").toUpperCase() !== "GET") {
      sendJson(res, 405, { state: "preview_blocked", error: "Method not allowed.", code: "method_not_allowed" });
      return;
    }
    let runtime = null;
    try {
      runtime = durablePersistence ? null : await resolveRuntime({ environment });
      if (runtime?.healthCheck) await runtime.healthCheck();
    } catch {
      runtime = { durablePersistence: null, blocker: "postgres_account_store_unavailable" };
    }
    const readiness = assessCustomerBetaReadiness({
      environment,
      durablePersistence: durablePersistence || runtime?.durablePersistence,
      persistenceBlocker: runtime?.blocker || ""
    });
    sendJson(res, readiness.state === "preview_blocked" ? 503 : 200, readiness);
  };
}

export default createBetaReadinessHandler();
