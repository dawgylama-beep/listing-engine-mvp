#!/usr/bin/env node
import path from "node:path";
import { auditKatherineSccRuntime, runKatherineSccJob, startKatherineSccRuntime } from "../lib/katherine-scc-runtime.js";

const argumentsMap = Object.fromEntries(process.argv.slice(2).map((item) => {
  const separator = item.indexOf("=");
  if (!item.startsWith("--") || separator < 3) throw new Error(`KATHERINE_SCC_ARGUMENT_INVALID:${item}`);
  return [item.slice(2, separator), item.slice(separator + 1)];
}));
if (Object.keys(argumentsMap).some((key) => key !== "learning-root")) throw new Error("KATHERINE_SCC_ARGUMENT_UNKNOWN");
const learningRoot = path.resolve(argumentsMap["learning-root"] || "");
let runtime = null;

function respond(id, result) {
  process.stdout.write(`${JSON.stringify({ id, result })}\n`);
}

function reject(id, caught) {
  process.stdout.write(`${JSON.stringify({ id, error: { code: caught.code || caught.message, message: caught.message } })}\n`);
}

async function dispatch(message) {
  if (!message || !Number.isSafeInteger(message.id) || typeof message.method !== "string") {
    throw new Error("KATHERINE_SCC_PROTOCOL_INVALID");
  }
  if (message.method === "initialize") {
    if (runtime !== null) throw new Error("KATHERINE_SCC_DUPLICATE_INITIALIZATION");
    runtime = await startKatherineSccRuntime({ learningRoot, attestation: message.params });
    return auditKatherineSccRuntime(runtime);
  }
  if (runtime === null) throw new Error("KATHERINE_SCC_NOT_INITIALIZED");
  if (message.method === "run-job") return runKatherineSccJob(runtime, message.params);
  if (message.method === "audit") return auditKatherineSccRuntime(runtime);
  throw new Error("KATHERINE_SCC_METHOD_UNKNOWN");
}

let buffer = "";
let chain = Promise.resolve();
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  while (buffer.includes("\n")) {
    const index = buffer.indexOf("\n");
    const line = buffer.slice(0, index).trim();
    buffer = buffer.slice(index + 1);
    if (!line) continue;
    chain = chain.then(async () => {
      let message;
      try {
        message = JSON.parse(line);
        respond(message.id, await dispatch(message));
      } catch (caught) {
        reject(message?.id ?? 0, caught);
      }
    });
  }
});
process.stdin.once("end", () => process.exitCode = 0);
