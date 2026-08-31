import { resolveCustomerAccountRuntime } from "../lib/customer-account/runtime.js";

const SESSION_COOKIE_NAME = "ke_beta_session";
const MAX_ACCOUNT_REQUEST_BODY_BYTES = 256 * 1024;
const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE"]);
const UNAUTHENTICATED_MUTATIONS = new Set(["register", "login"]);

function json(res, status, payload, headers = {}) {
  res.status(status);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Vary", "Cookie, Origin");
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.json(payload);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    if (Buffer.byteLength(JSON.stringify(req.body), "utf8") > MAX_ACCOUNT_REQUEST_BODY_BYTES) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      error.code = "request_body_too_large";
      throw error;
    }
    if (Array.isArray(req.body)) throw Object.assign(new Error("Request body must be a JSON object."), { status: 400, code: "invalid_request_body" });
    return req.body;
  }
  const text = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
  if (Buffer.byteLength(text, "utf8") > MAX_ACCOUNT_REQUEST_BODY_BYTES) {
    const error = new Error("Request body is too large.");
    error.status = 413;
    error.code = "request_body_too_large";
    throw error;
  }
  const parsed = text ? JSON.parse(text) : {};
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw Object.assign(new Error("Request body must be a JSON object."), { status: 400, code: "invalid_request_body" });
  }
  return parsed;
}

function requestUrl(req) {
  return new URL(String(req.url || "/api/customer-account"), "http://katherines-eye.local");
}

function parseCookies(header = "") {
  const cookies = {};
  for (const part of String(header).split(";")) {
    const separator = part.indexOf("=");
    if (separator <= 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    if (name && value.length <= 4096) cookies[name] = value;
  }
  return cookies;
}

function sessionToken(req) {
  return parseCookies(req.headers?.cookie || req.headers?.Cookie || "")[SESSION_COOKIE_NAME] || "";
}

function runtimeProfile(environment = process.env) {
  const vercelEnvironment = String(environment.VERCEL_ENV || "").trim().toLowerCase();
  if (["preview", "production"].includes(vercelEnvironment)) return vercelEnvironment;
  return "local";
}

function secureRequest(req, environment = process.env) {
  if (["preview", "production"].includes(runtimeProfile(environment))) return true;
  const forwardedProtocol = String(req.headers?.["x-forwarded-proto"] || "").toLowerCase();
  return forwardedProtocol === "https" || String(req.url || "").startsWith("https://");
}

function sessionCookie(token, req, environment, maxAgeSeconds = 12 * 60 * 60) {
  const secure = secureRequest(req, environment);
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : ""
  ].filter(Boolean).join("; ");
}

function expectedOrigin(req, environment) {
  const configured = String(environment.KATHERINES_EYE_PUBLIC_ORIGIN || "").trim();
  if (configured) {
    try {
      const origin = new URL(configured);
      if (!/^https:$/.test(origin.protocol) && runtimeProfile(environment) !== "local") return "";
      if (origin.username || origin.password || origin.origin !== configured.replace(/\/$/, "")) return "";
      return origin.origin;
    } catch {
      return "";
    }
  }
  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "").split(",")[0].trim().toLowerCase();
  if (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d{1,5})?$/.test(host)) return "";
  return `${secureRequest(req, environment) ? "https" : "http"}://${host}`;
}

function assertMutationOrigin(req, environment) {
  const fetchSite = String(req.headers?.["sec-fetch-site"] || "").trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") {
    throw Object.assign(new Error("Cross-origin account requests are not allowed."), { status: 403, code: "request_origin_rejected" });
  }
  const expected = expectedOrigin(req, environment);
  let supplied = "";
  try {
    supplied = new URL(String(req.headers?.origin || "")).origin;
  } catch {
  }
  if (!expected || supplied !== expected) {
    throw Object.assign(new Error("This account request did not come from the Katherine’s Eye origin."), { status: 403, code: "request_origin_rejected" });
  }
}

function sourceIdentity(req, environment) {
  const trustedForwarded = ["preview", "production"].includes(runtimeProfile(environment));
  const forwarded = trustedForwarded ? String(req.headers?.["x-forwarded-for"] || "").split(",")[0].trim() : "";
  const direct = String(req.socket?.remoteAddress || req.headers?.["x-katherine-client-origin"] || "").trim();
  return (forwarded || direct || "unknown").slice(0, 240);
}

async function dispatch(service, req, body) {
  const url = requestUrl(req);
  const bodyAction = String(body.action || "").trim();
  const queryAction = String(url.searchParams.get("action") || "").trim();
  if (bodyAction && queryAction && bodyAction !== queryAction) {
    throw Object.assign(new Error("Conflicting account actions are not allowed."), { status: 400, code: "conflicting_account_action" });
  }
  const action = bodyAction || queryAction || "session";
  const token = sessionToken(req);
  const context = { sourceIdentity: req.accountSourceIdentity, currentToken: token };

  if (req.method === "GET" && action === "session") return service.session(token);
  if (req.method === "GET" && action === "history") return service.listHistory(token);
  if (req.method === "GET" && action === "listing") return service.getListing(token, url.searchParams.get("listingId"));
  if (req.method === "GET" && action === "export") return service.exportAccount(token);
  if (req.method === "POST" && action === "register") return service.register(body, context);
  if (req.method === "POST" && action === "login") return service.login(body, context);
  if (req.method === "POST" && action === "logout") return service.logout(token);
  if (req.method === "POST" && action === "save_listing") return service.saveListing(token, body.snapshot);
  if (req.method === "PATCH" && action === "change_password") return service.changePassword(token, body);
  if (req.method === "PATCH" && action === "rename_listing") return service.renameListing(token, body.listingId, body.name);
  if (req.method === "PATCH" && action === "preferences") return service.updatePreferences(token, body);
  if (req.method === "DELETE" && action === "delete_listing") return service.deleteListing(token, body.listingId);
  if (req.method === "DELETE" && action === "delete_account") return service.deleteAccount(token, body.password);

  const error = new Error("Method not allowed.");
  error.status = 405;
  error.code = "method_not_allowed";
  throw error;
}

export function createCustomerAccountHandler({ service = null, environment = process.env, resolveRuntime = resolveCustomerAccountRuntime } = {}) {
  return async function customerAccountHandler(req, res) {
    try {
      const runtime = service ? null : await resolveRuntime({ environment });
      const activeService = service || runtime?.service;
      if (!activeService) {
        json(res, 503, {
          error: "Private beta accounts are not configured in this environment.",
          code: "account_service_unavailable"
        });
        return;
      }
      const method = String(req.method || "").toUpperCase();
      if (!new Set(["GET", "POST", "PATCH", "DELETE"]).has(method)) {
        throw Object.assign(new Error("Method not allowed."), { status: 405, code: "method_not_allowed" });
      }
      req.method = method;
      const contentLengthHeader = String(req.headers?.["content-length"] || "").trim();
      if (contentLengthHeader && !/^\d{1,9}$/.test(contentLengthHeader)) {
        throw Object.assign(new Error("Content-Length is invalid."), { status: 400, code: "invalid_content_length" });
      }
      const contentLength = Number(contentLengthHeader || 0);
      if (contentLength > MAX_ACCOUNT_REQUEST_BODY_BYTES) {
        throw Object.assign(new Error("Request body is too large."), { status: 413, code: "request_body_too_large" });
      }
      if (MUTATING_METHODS.has(method)) {
        if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(String(req.headers?.["content-type"] || "").trim())) {
          throw Object.assign(new Error("Account changes require an application/json request."), { status: 415, code: "unsupported_media_type" });
        }
        assertMutationOrigin(req, environment);
      }
      const body = MUTATING_METHODS.has(method) ? parseBody(req) : {};
      const action = String(body.action || requestUrl(req).searchParams.get("action") || "session").trim();
      const token = sessionToken(req);
      if (MUTATING_METHODS.has(method) && !UNAUTHENTICATED_MUTATIONS.has(action) && (action !== "logout" || token)) {
        await activeService.verifyCsrf(token, req.headers?.["x-csrf-token"] || "");
      }
      req.accountSourceIdentity = sourceIdentity(req, environment);
      const payload = await dispatch(activeService, req, body);
      const headers = {};
      if (["register", "login", "change_password"].includes(action) && payload.session?.token) {
        headers["Set-Cookie"] = sessionCookie(payload.session.token, req, environment);
        delete payload.session.token;
      }
      if (["logout", "delete_account"].includes(action)) headers["Set-Cookie"] = sessionCookie("", req, environment, 0);
      json(res, 200, payload, headers);
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : error instanceof SyntaxError ? 400 : 500;
      const headers = error?.retryAfterSeconds ? { "Retry-After": String(error.retryAfterSeconds) } : {};
      json(res, status, {
        error: status === 500 ? "The private account service could not complete this request." : error.message,
        code: status === 500 ? "account_service_error" : String(error.code || "invalid_request")
      }, headers);
    }
  };
}

export default createCustomerAccountHandler();
