import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  BENCHMARK_COMMIT, CONTRACT_SHA256, CORPUS_SHA256, PRODUCT_COMMIT,
  benchmarkRoot, executionRoot, listFilesRecursive, loadRunPlan,
  readJson, repositoryRoot, sha256Bytes
} from "./execution-common.mjs";

const expectedSchemaHashes = Object.freeze({
  "request-record.schema.json": "32029359d48fc381158c34ed0fedef22c977ce4ca6abd0cedb6d5b6085848ca9",
  "response-record.schema.json": "252d9f54d39f127dd3175342435f1b21d7a03d9e01964841a55a4c04a12bd364",
  "run-journal.schema.json": "14e81c39957f39c406631dc46fde9096000366ac85cc6f7c2173be55bdf12cf5",
  "frozen-result-manifest.schema.json": "db85409185c90f113854a53e346321cb54c0fe8f16e3b854c06f18255b3f9472"
});
const prohibitedPrivateNames = ["ground-truth.json", "exact-source-controls.json", "distractor-controls.json", "scoring-rubric.json"];

function git(args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
}

async function executorContentHash() {
  const files = (await listFilesRecursive(executionRoot))
    .filter((file) => path.basename(file) !== "EXECUTOR_FREEZE.json")
    .map((file) => ({ file, relative: path.relative(executionRoot, file).replaceAll("\\", "/") }))
    .sort((left, right) => left.relative.localeCompare(right.relative));
  const lines = [];
  for (const entry of files) lines.push(`${entry.relative}:${sha256Bytes(await readFile(entry.file))}\n`);
  return { hash: sha256Bytes(Buffer.from(lines.join(""), "utf8")), fileCount: files.length, files: files.map((entry) => entry.relative) };
}

async function executionImportAudit() {
  const starts = ["prepare-requests.mjs", "run-baseline.mjs", "freeze-responses.mjs", "verify-result-integrity.mjs"]
    .map((name) => path.join(executionRoot, "scripts", name));
  const visited = new Set();
  const visit = async (file) => {
    const resolved = path.resolve(file);
    if (visited.has(resolved)) return;
    visited.add(resolved);
    const source = await readFile(resolved, "utf8");
    for (const name of prohibitedPrivateNames) assert.equal(source.includes(name), false, `${path.basename(resolved)} references ${name}`);
    const importPattern = /(?:from\s+|import\s*\()\s*["'](\.\.?\/[^"']+)["']/g;
    for (const match of source.matchAll(importPattern)) {
      const imported = path.resolve(path.dirname(resolved), match[1]);
      if (imported.startsWith(executionRoot) && await stat(imported, { throwIfNoEntry: false })) await visit(imported);
    }
  };
  for (const start of starts) await visit(start);
  assert.equal([...visited].some((file) => file.endsWith("grade-frozen-results.mjs")), false);
  return [...visited].map((file) => path.relative(executionRoot, file).replaceAll("\\", "/")).sort();
}

function runFrozenValidator(relativePath, args = []) {
  const result = spawnSync(process.execPath, [path.join(benchmarkRoot, relativePath), ...args], {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

async function localCredentialPresence() {
  const envPath = path.join(repositoryRoot, ".env");
  const entries = new Map();
  if (await stat(envPath, { throwIfNoEntry: false })) {
    for (const line of (await readFile(envPath, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match) entries.set(match[1], match[2].trim().length > 0);
    }
  }
  return Object.fromEntries(["OPENAI_API_KEY", "OPEN_API_KEY", "OPENAI_MODEL", "SERPER_API_KEY"].map((name) => [name, entries.get(name) === true]));
}

async function secretScan() {
  const packageFiles = await listFilesRecursive(executionRoot);
  const envPath = path.join(repositoryRoot, ".env");
  const knownSecretValues = [];
  if (await stat(envPath, { throwIfNoEntry: false })) {
    for (const line of (await readFile(envPath, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*[A-Za-z_][A-Za-z0-9_]*\s*=\s*(.*)\s*$/);
      if (match && match[1].trim().length >= 12) knownSecretValues.push(match[1].trim());
    }
  }
  let findings = 0;
  for (const file of packageFiles) {
    const text = await readFile(file, "utf8");
    if (/\bsk-[A-Za-z0-9_-]{20,}\b|\bBearer\s+[A-Za-z0-9._~+\/-]{16,}/i.test(text)) findings += 1;
    if (knownSecretValues.some((secret) => text.includes(secret))) findings += 1;
  }
  assert.equal(findings, 0, "secret signature found in execution package");
  return findings;
}

async function validate() {
  git(["merge-base", "--is-ancestor", BENCHMARK_COMMIT, "HEAD"]);
  assert.equal(git(["branch", "--show-current"]), "refactor/beta-evidence-pipeline");
  assert.equal((await readJson(path.join(repositoryRoot, "package.json"))).version, "1.12.1");
  const status = git(["status", "--porcelain=v1"]).split(/\r?\n/).filter(Boolean);
  assert.ok(status.every((entry) => entry.replace(/^\s*[MADRCU?!]{1,2}\s+/, "").replaceAll("\\", "/").startsWith("benchmarks/blind-object-v1-execution-v1/")), "working changes exceed the authorized execution package");
  const committedProductDiff = git(["diff", "--name-only", `${PRODUCT_COMMIT}..${BENCHMARK_COMMIT}`]).split(/\r?\n/).filter(Boolean);
  assert.equal(committedProductDiff.length, 44);
  assert.ok(committedProductDiff.every((file) => file.startsWith("benchmarks/blind-object-v1/")));
  assert.equal(git(["diff", "--name-only", "--", "benchmarks/blind-object-v1"]), "");
  assert.equal(git(["diff", "--name-only", "--", "api", "public", "lib/evidence", "server.ps1", "package.json", "package-lock.json", "vercel.json", ".vercelignore"]), "");

  const leakage = runFrozenValidator("scripts/validate-input-leakage.mjs");
  const assets = runFrozenValidator("scripts/validate-assets.mjs");
  const freezeValidation = runFrozenValidator("scripts/validate-freeze.mjs");
  const scorer = runFrozenValidator("scripts/score-results.mjs", ["--self-test"]);
  assert.equal(leakage.status, "PASS");
  assert.equal(assets.corpusHash, CORPUS_SHA256);
  assert.equal(freezeValidation.contractHash, CONTRACT_SHA256);
  assert.equal(scorer.status, "PASS");

  const [plan, frozenPlan, input, manifest, executorFreeze, environmentInventory] = await Promise.all([
    loadRunPlan(),
    readJson(path.join(benchmarkRoot, "execution-plan.json")),
    readJson(path.join(benchmarkRoot, "input-cases.json")),
    readJson(path.join(benchmarkRoot, "manifest.json")),
    readJson(path.join(executionRoot, "EXECUTOR_FREEZE.json")),
    readJson(path.join(executionRoot, "required-environment.json"))
  ]);
  assert.equal(plan.runs.length, 26);
  assert.deepEqual(plan.runs, frozenPlan.runs);
  assert.deepEqual(plan.purposeInvarianceAnchorIds, frozenPlan.purposeInvarianceAnchorIds);
  assert.equal(plan.runs.filter((entry) => entry.runType === "PRINCIPAL").length, 14);
  assert.equal(plan.runs.filter((entry) => entry.runType === "ANCHOR_PURPOSE").length, 12);
  assert.equal(new Set(plan.runs.map((entry) => `${entry.caseId}:${entry.purpose}`)).size, 26);
  for (const anchor of plan.purposeInvarianceAnchorIds) assert.equal(plan.runs.filter((entry) => entry.caseId === anchor).length, 4);
  const cases = new Map(input.cases.map((entry) => [entry.caseId, entry]));
  const assetsByPath = new Map(manifest.assets.map((entry) => [entry.path, entry]));
  for (const run of plan.runs) {
    const caseRecord = cases.get(run.caseId);
    assert.ok(caseRecord);
    for (const assetPath of caseRecord.images) assert.match(assetsByPath.get(assetPath).sha256, /^[a-f0-9]{64}$/);
  }

  for (const [name, expected] of Object.entries(expectedSchemaHashes)) {
    assert.equal(sha256Bytes(await readFile(path.join(executionRoot, "schemas", name))), expected);
  }
  assert.deepEqual(executorFreeze.schemaSha256, {
    requestRecord: expectedSchemaHashes["request-record.schema.json"],
    responseRecord: expectedSchemaHashes["response-record.schema.json"],
    runJournal: expectedSchemaHashes["run-journal.schema.json"],
    frozenResultManifest: expectedSchemaHashes["frozen-result-manifest.schema.json"]
  });
  assert.deepEqual(executorFreeze.runIdsInOrder, plan.runs.map((entry) => entry.runId));
  assert.equal(executorFreeze.concurrency, 1);
  assert.equal(executorFreeze.expectedResultLocation, "benchmarks/blind-object-v1-results/current-a4a7214/");

  const bridgeSource = await readFile(path.join(repositoryRoot, "scripts", "local-generate-listing-bridge.mjs"), "utf8");
  const handlerSource = await readFile(path.join(repositoryRoot, "api", "generate-listing.js"), "utf8");
  assert.match(bridgeSource, /new URL\("\.\.\/api\/generate-listing\.js", import\.meta\.url\)/);
  assert.match(bridgeSource, /createGenerateListingHandler/);
  assert.match(handlerSource, /export function createGenerateListingHandler/);
  assert.match(handlerSource, /isCurrentRetailOnlyMode\(context\.retailEvidenceMode\) \? retailSerperBudgetAllocation\.maxProviderCalls : 12/);
  assert.match(handlerSource, /maxProviderCalls:\s*28/);
  assert.match(handlerSource, /directPageEnrichmentMaxAttempts = 2/);
  assert.match(handlerSource, /if \(serperApiKey\)[\s\S]*executeOpenAIWebComparableSearch/);

  const auditedExecutionGraph = await executionImportAudit();
  const credentials = await localCredentialPresence();
  assert.deepEqual(Object.fromEntries(environmentInventory.variables.map((entry) => [entry.name, entry.presentLocally])), credentials);
  assert.equal(environmentInventory.variables.find((entry) => entry.name === "SERPER_API_KEY").absencePreventsProductionParity, false);
  const content = await executorContentHash();
  assert.equal(executorFreeze.executorContentSha256, content.hash, "executor content hash does not match EXECUTOR_FREEZE.json");
  const secretFindings = await secretScan();
  return {
    validator: "validate-executor",
    status: "PASS",
    packageFileCount: content.fileCount + 1,
    executorContentSha256: content.hash,
    frozenBenchmarkFilesChanged: 0,
    productionFilesChanged: 0,
    runPlan: { total: 26, principal: 14, anchorPurpose: 12, exactOrderMatched: true },
    answerKeySeparation: { passed: true, auditedExecutionGraph },
    handler: "scripts/local-generate-listing-bridge.mjs -> api/generate-listing.js#createGenerateListingHandler",
    providerCeilings: { standard: 12, retail: 28, directPage: 2 },
    credentialPresence: credentials,
    serperAbsencePreventsProductionParity: false,
    secretSignatureFindings: secretFindings,
    frozenValidators: { leakage: leakage.status, assets: assets.status, freeze: freezeValidation.status, scorerSelfTest: scorer.status }
  };
}

validate().then((result) => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)).catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
