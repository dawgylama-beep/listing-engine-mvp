import path from "node:path";
import {
  createCustomerAccountService,
  createFileCustomerAccountStore
} from "../lib/customer-account/service.js";

const SESSION_COOKIE_NAME = "ke_beta_session";
let configuredService = null;
let configuredStorePath = "";

function json(res, status, payload, headers = {}) {
  res.status(status);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Vary", "Cookie");
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  res.json(payload);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    if (Buffer.byteLength(JSON.stringify(req.body), "utf8") > 256 * 1024) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      error.code = "request_body_too_large";
      throw error;
    }
    return req.body;
  }
  const text = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : String(req.body);
  if (Buffer.byteLength(text, "utf8") > 256 * 1024) {
    const error = new Error("Request body is too large.");
    error.status = 413;
    error.code = "request_body_too_large";
    throw error;
  }
  return text ? JSON.parse(text) : {};
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

function sessionCookie(token, req, maxAgeSeconds = 12 * 60 * 60) {
  const forwardedProtocol = String(req.headers?.["x-forwarded-proto"] || "").toLowerCase();
  const secure = forwardedProtocol === "https" || String(req.url || "").startsWith("https://");
  return [
    `${SESSION_COOKIE_NAME}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Max-Age=${maxAgeSeconds}`,
    secure ? "Secure" : ""
  ].filter(Boolean).join("; ");
}

function clearSessionCookie(req) {
  return sessionCookie("", req, 0);
}

function defaultService() {
  const storePath = String(process.env.KATHERINES_EYE_ACCOUNT_STORE_PATH || "").trim();
  if (!storePath || !path.isAbsolute(storePath)) return null;
  const resolved = path.resolve(storePath);
  if (!configuredService || configuredStorePath !== resolved) {
    configuredStorePath = resolved;
    configuredService = createCustomerAccountService({ store: createFileCustomerAccountStore(resolved) });
  }
  return configuredService;
}

async function dispatch(service, req, body) {
  const url = requestUrl(req);
  const action = String(body.action || url.searchParams.get("action") || "session").trim();
  const token = sessionToken(req);

  if (req.method === "GET" && action === "session") return service.session(token);
  if (req.method === "GET" && action === "history") return service.listHistory(token);
  if (req.method === "GET" && action === "listing") return service.getListing(token, url.searchParams.get("listingId"));
  if (req.method === "GET" && action === "export") return service.exportAccount(token);
  if (req.method === "POST" && action === "register") return service.register(body);
  if (req.method === "POST" && action === "login") return service.login(body);
  if (req.method === "POST" && action === "logout") return service.logout(token);
  if (req.method === "POST" && action === "save_listing") return service.saveListing(token, body.snapshot);
  if (req.method === "PATCH" && action === "rename_listing") return service.renameListing(token, body.listingId, body.name);
  if (req.method === "PATCH" && action === "preferences") return service.updatePreferences(token, body);
  if (req.method === "DELETE" && action === "delete_listing") return service.deleteListing(token, body.listingId);
  if (req.method === "DELETE" && action === "delete_account") return service.deleteAccount(token, body.password);

  const error = new Error("Method not allowed.");
  error.status = 405;
  error.code = "method_not_allowed";
  throw error;
}

export function createCustomerAccountHandler({ service = null } = {}) {
  return async function customerAccountHandler(req, res) {
    const activeService = service || defaultService();
    if (!activeService) {
      json(res, 503, {
        error: "Private beta accounts are not configured in this environment.",
        code: "account_service_unavailable"
      });
      return;
    }

    try {
      const body = ["POST", "PATCH", "DELETE"].includes(req.method) ? parseBody(req) : {};
      const payload = await dispatch(activeService, req, body);
      const action = String(body.action || requestUrl(req).searchParams.get("action") || "session");
      const headers = {};
      if (["register", "login"].includes(action) && payload.session?.token) {
        headers["Set-Cookie"] = sessionCookie(payload.session.token, req);
        delete payload.session.token;
      }
      if (["logout", "delete_account"].includes(action)) headers["Set-Cookie"] = clearSessionCookie(req);
      json(res, 200, payload, headers);
    } catch (error) {
      const status = Number.isInteger(error?.status) ? error.status : error instanceof SyntaxError ? 400 : 500;
      json(res, status, {
        error: status === 500 ? "The private account service could not complete this request." : error.message,
        code: status === 500 ? "account_service_error" : String(error.code || "invalid_request")
      });
    }
  };
}

export default createCustomerAccountHandler();
