import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC_FILES = ["input-cases.json", "execution-plan.json", "manifest.json"];

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  return value;
}

function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

export async function prepareRun(runId, { synthetic = false } = {}) {
  assert.ok(synthetic, "Execution is frozen for Phase 3B. Only local synthetic request preparation is authorized at this station.");
  const [input, plan, manifest] = await Promise.all(PUBLIC_FILES.map(async (name) => JSON.parse(await readFile(path.join(benchmarkRoot, name), "utf8"))));
  assert.equal(plan.executionAuthorized, false, "freeze must remain non-executable");
  const run = plan.runs.find((entry) => entry.runId === runId);
  assert.ok(run, `unknown run: ${runId}`);
  const testCase = input.cases.find((entry) => entry.caseId === run.caseId);
  assert.ok(testCase, `missing input case: ${run.caseId}`);
  const assetsByPath = new Map(manifest.assets.map((entry) => [entry.path, entry]));
  const requestPayload = {
    benchmarkId: input.benchmarkId,
    runId: run.runId,
    caseId: run.caseId,
    purpose: run.purpose,
    lane: testCase.lane,
    description: testCase.description,
    images: testCase.images.map((imagePath) => ({ path: imagePath, sha256: assetsByPath.get(imagePath)?.sha256 }))
  };
  assert.ok(requestPayload.images.every((entry) => /^[a-f0-9]{64}$/.test(entry.sha256)), "request references an unmanifested asset");
  const payloadHash = createHash("sha256").update(stableJson(requestPayload)).digest("hex");
  return {
    schemaVersion: 1,
    preparationMode: "LOCAL_SYNTHETIC_ONLY",
    requestPayload,
    payloadHash,
    loadedFiles: [...PUBLIC_FILES],
    privateGroundTruthLoaded: false,
    networkCallOccurred: false,
    providerCallOccurred: false
  };
}

async function cli() {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : undefined;
  };
  const runId = value("--run");
  const out = value("--out");
  assert.ok(runId, "usage: node prepare-run.mjs --synthetic --run RUN-### [--out file]");
  assert.ok(args.includes("--synthetic"), "--synthetic is required; Phase 3B execution is not authorized");
  const prepared = await prepareRun(runId, { synthetic: true });
  const rendered = `${JSON.stringify(prepared, null, 2)}\n`;
  if (out) await writeFile(path.resolve(out), rendered, { encoding: "utf8", flag: "wx" });
  else process.stdout.write(rendered);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
