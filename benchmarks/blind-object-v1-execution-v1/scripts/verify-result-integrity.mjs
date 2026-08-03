import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { verifyFrozenResultIntegrity } from "./result-integrity.mjs";

async function cli() {
  const args = process.argv.slice(2);
  const index = args.indexOf("--result-root");
  assert.ok(index >= 0 && args[index + 1], "usage: node verify-result-integrity.mjs --result-root <path>");
  const verified = await verifyFrozenResultIntegrity(path.resolve(args[index + 1]));
  process.stdout.write(`${JSON.stringify({
    status: "PASS",
    requestCount: verified.requests.length,
    responseCount: verified.responses.length,
    aggregateResultSha256: verified.manifest.aggregateResultSha256,
    integrityVerifiedBeforePrivateLoad: verified.integrityVerifiedBeforePrivateLoad
  }, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
