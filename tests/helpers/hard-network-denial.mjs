import http from "node:http";
import https from "node:https";

function targetFromArgs(args = []) {
  const first = args[0];
  if (typeof first === "string" || first instanceof URL) {
    try {
      const parsed = new URL(first);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return String(first).split(/[?#]/, 1)[0];
    }
  }
  if (first && typeof first === "object") {
    const protocol = first.protocol || "";
    const host = first.hostname || first.host || "unknown-host";
    const pathname = String(first.pathname || first.path || "").split(/[?#]/, 1)[0];
    return `${protocol}//${host}${pathname}`;
  }
  return "unknown-target";
}

export function installHardNetworkDenial() {
  const attempts = [];
  const originals = {
    fetch: globalThis.fetch,
    httpRequest: http.request,
    httpGet: http.get,
    httpsRequest: https.request,
    httpsGet: https.get
  };
  const deny = (mechanism) => (...args) => {
    const target = targetFromArgs(args);
    attempts.push({ mechanism, target });
    throw new Error(`UNEXPECTED_EXTERNAL_NETWORK_REQUEST: ${mechanism} ${target}`);
  };

  globalThis.fetch = deny("fetch");
  http.request = deny("http.request");
  http.get = deny("http.get");
  https.request = deny("https.request");
  https.get = deny("https.get");

  return {
    attempts,
    restore() {
      globalThis.fetch = originals.fetch;
      http.request = originals.httpRequest;
      http.get = originals.httpGet;
      https.request = originals.httpsRequest;
      https.get = originals.httpsGet;
    }
  };
}
