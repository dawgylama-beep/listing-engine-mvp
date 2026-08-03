import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { prepareRequestTemplates, writeJsonExclusive } from "./execution-common.mjs";

export async function prepareRequests() {
  return prepareRequestTemplates();
}

async function cli() {
  const args = process.argv.slice(2);
  const outIndex = args.indexOf("--out");
  assert.ok(outIndex >= 0 && args[outIndex + 1], "usage: node prepare-requests.mjs --out <temporary-file>");
  const prepared = await prepareRequests();
  await writeJsonExclusive(path.resolve(args[outIndex + 1]), prepared.templates);
  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    preparedRequestCount: prepared.templates.length,
    loadedBenchmarkFiles: prepared.loadedBenchmarkFiles,
    privateAnswerMaterialLoaded: prepared.privateAnswerMaterialLoaded,
    networkRequestCount: prepared.networkRequestCount,
    providerCallCount: prepared.providerCallCount,
    productHandlerCallCount: prepared.productHandlerCallCount
  }, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
