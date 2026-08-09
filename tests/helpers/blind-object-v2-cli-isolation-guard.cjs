"use strict";

const childProcess = require("node:child_process");
const fs = require("node:fs");
const fsPromises = require("node:fs/promises");
const http = require("node:http");
const https = require("node:https");
const path = require("node:path");
const { fileURLToPath } = require("node:url");
const { syncBuiltinESMExports } = require("node:module");

const guardLog = process.env.KATHERINES_EYE_CLI_GUARD_LOG;

function record(type, detail) {
  if (guardLog) fs.appendFileSync(guardLog, `${JSON.stringify({ type, detail: String(detail || "") })}\n`, "utf8");
}

function denied(type, detail) {
  record(type, detail);
  throw new Error(`ISOLATED_CLI_GUARD_DENIED: ${type}`);
}

function pathText(value) {
  if (value instanceof URL) return value.protocol === "file:" ? fileURLToPath(value) : String(value);
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return String(value || "");
}

function assertPublicPath(value) {
  const text = pathText(value).replace(/\\/g, "/");
  if (/(?:^|\/)(?:evaluator-only|private-controls)(?:\/|$)/i.test(text)) denied("PRIVATE_PATH_READ", text);
}

const originalFetch = globalThis.fetch;
globalThis.fetch = (...args) => denied("NETWORK_FETCH", args[0]);

for (const [owner, name, type] of [
  [http, "request", "HTTP_REQUEST"],
  [http, "get", "HTTP_GET"],
  [https, "request", "HTTPS_REQUEST"],
  [https, "get", "HTTPS_GET"]
]) {
  owner[name] = (...args) => denied(type, args[0]);
}

for (const [owner, name] of [
  [fs, "readFileSync"],
  [fs, "readFile"],
  [fs, "createReadStream"],
  [fs, "openSync"],
  [fs, "open"],
  [fsPromises, "readFile"],
  [fsPromises, "open"]
]) {
  const original = owner[name];
  owner[name] = function guardedRead(first, ...rest) {
    assertPublicPath(first);
    return original.call(this, first, ...rest);
  };
}

const originalSpawn = childProcess.spawn;
childProcess.spawn = function guardedSpawn(command, args = [], ...rest) {
  const executable = path.resolve(String(command || "")).toLowerCase();
  const nodeExecutable = path.resolve(process.execPath).toLowerCase();
  if (executable === nodeExecutable && args.some((value) => /local-generate-listing-bridge\.mjs$/i.test(String(value).replace(/\\/g, "/")))) {
    return denied("HANDLER_BRIDGE_SPAWN", args.join(" "));
  }
  return originalSpawn.call(this, command, args, ...rest);
};

syncBuiltinESMExports();

process.once("exit", () => {
  globalThis.fetch = originalFetch;
});
