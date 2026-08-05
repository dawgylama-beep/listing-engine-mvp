import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  BENCHMARK_COMMIT, HISTORICAL_PRODUCT_COMMIT, assertRequestRecord, assertResponseRecord,
  executionRoot, extractResponseMetadata, hashWithoutField, loadRunPlan,
  prepareRequestTemplates, readJson, repositoryRoot, resolveExecutorCommit,
  writeJsonExclusive
} from "./execution-common.mjs";
import { beginReleaseBoundInvocation } from "./release-binding.mjs";
import {
  appendJournalEvent, initializeJournal, latestByRun, loadJournal, stopOnIndeterminate
} from "./run-journal.mjs";

const productionBridgePath = path.join(repositoryRoot, "scripts", "local-generate-listing-bridge.mjs");
const mockHandlerPath = path.join(executionRoot, "scripts", "mock-handler.mjs");

async function loadProductionEnvironment() {
  const environment = { ...process.env };
  const envPath = path.join(repositoryRoot, ".env");
  if (await stat(envPath, { throwIfNoEntry: false })) {
    for (const line of (await readFile(envPath, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (match && environment[match[1]] === undefined) environment[match[1]] = match[2];
    }
  }
  delete environment.KATHERINES_EYE_HANDLER_ADAPTER_MODULE;
  return environment;
}

function invokeHandler({ scriptPath, handlerRequest, requestSha256, environment }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath], {
      cwd: repositoryRoot,
      env: environment,
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", () => reject(new Error("handler_process_start_failed")));
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`handler_process_failed:${code}`));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(stdout).toString("utf8")));
      } catch {
        reject(new Error("handler_protocol_invalid"));
      }
    });
    const bodyBytes = Buffer.from(JSON.stringify(handlerRequest.body), "utf8");
    child.stdin.end(JSON.stringify({
      protocolVersion: 1,
      method: handlerRequest.method,
      url: handlerRequest.url,
      headers: handlerRequest.headers,
      rawBodyBase64: bodyBytes.toString("base64"),
      correlationId: `ke-local-${requestSha256.slice(0, 32)}`
    }));
  });
}

function buildResponseRecord({ request, handlerResult, startTimestamp, endTimestamp, elapsedMilliseconds }) {
  const rawBody = Buffer.from(handlerResult.rawBodyBase64, "base64");
  let rawProductResponse;
  try {
    rawProductResponse = JSON.parse(rawBody.toString("utf8"));
  } catch {
    rawProductResponse = { unparsedUtf8Body: rawBody.toString("utf8") };
  }
  const customerFacingReport = rawProductResponse?.valuation ?? rawProductResponse?.listing ?? rawProductResponse;
  const cognitiveDiagnostics = customerFacingReport?.searchDiagnostics?.cognitiveGovernor
    || rawProductResponse?.searchDiagnostics?.cognitiveGovernor
    || {};
  const objectDiagnostics = customerFacingReport?.searchDiagnostics?.objectIntelligence
    || rawProductResponse?.searchDiagnostics?.objectIntelligence
    || {};
  const metadata = extractResponseMetadata(rawProductResponse);
  const record = {
    schemaVersion: 1,
    runId: request.runId,
    objectId: request.objectId,
    requestSha256: request.requestSha256,
    handlerStatus: { statusCode: handlerResult.statusCode, headers: handlerResult.headers || {} },
    startTimestamp,
    endTimestamp,
    elapsedMilliseconds,
    rawHandlerBodyBase64: handlerResult.rawBodyBase64,
    rawProductResponse,
    customerFacingReport,
    governorProof: cognitiveDiagnostics.executionProof || null,
    cognitiveEpisode: cognitiveDiagnostics.cognitiveEpisode || null,
    lessonCandidate: cognitiveDiagnostics.lessonCandidate || null,
    experienceRecord: objectDiagnostics.experienceRecord || null,
    providerAndSearchErrors: metadata.providerAndSearchErrors,
    providerCallCounts: metadata.providerCallCounts,
    evidenceRecords: metadata.evidenceRecords,
    sourceUrls: metadata.sourceUrls,
    responseSha256: ""
  };
  record.responseSha256 = hashWithoutField(record, "responseSha256");
  assertResponseRecord(record);
  return record;
}

export async function runBaseline({
  resultRoot,
  mode = "real",
  mockMode = "mixed",
  mockTracePath = "",
  syntheticCommit = "",
  preparedOverride = null,
  releaseBinding = null,
  nowIso = () => new Date().toISOString()
}) {
  assert.ok(resultRoot, "resultRoot is required");
  assert.ok(["real", "mock"].includes(mode));
  if (mode === "real") {
    assert.ok(releaseBinding?.productCommit, "real execution requires a completed release binding before request preparation");
    assert.equal(path.resolve(resultRoot), path.resolve(releaseBinding.resultRoot));
  }
  const productCommit = mode === "real" ? releaseBinding.productCommit : HISTORICAL_PRODUCT_COMMIT;
  const [plan, prepared] = await Promise.all([
    loadRunPlan(),
    preparedOverride ? Promise.resolve(preparedOverride) : prepareRequestTemplates()
  ]);
  assert.equal(prepared.templates.length, 26);
  await initializeJournal(resultRoot, plan.runs, nowIso);
  await stopOnIndeterminate(resultRoot, nowIso);
  const executorCommit = resolveExecutorCommit({ syntheticCommit: mode === "mock" ? (syntheticCommit || "e".repeat(40)) : "" });
  const environment = mode === "real" ? await loadProductionEnvironment() : {
    ...process.env,
    EXECUTOR_MOCK_MODE: mockMode,
    EXECUTOR_MOCK_TRACE_PATH: mockTracePath
  };
  const handlerScript = mode === "real" ? productionBridgePath : mockHandlerPath;
  let invoked = 0;
  for (const [index, run] of plan.runs.entries()) {
    let latest = latestByRun(await loadJournal(resultRoot)).get(run.runId);
    if (["RESPONSE_HASHED", "FROZEN"].includes(latest.state)) continue;
    const template = prepared.templates[index];
    assert.equal(template.runId, run.runId);
    let request;
    if (latest.state === "PLANNED") {
      request = {
        ...template,
        requestTimestamp: nowIso(),
        productCommit,
        benchmarkCommit: BENCHMARK_COMMIT,
        executorCommit,
        requestSha256: ""
      };
      request.requestSha256 = hashWithoutField(request, "requestSha256");
      assertRequestRecord(request, { expectedProductCommit: productCommit });
      await writeJsonExclusive(path.join(resultRoot, "requests", `${run.runId}.json`), request);
      await appendJournalEvent(resultRoot, { runId: run.runId, state: "PREPARED", timestamp: nowIso(), requestSha256: request.requestSha256 });
    } else {
      assert.equal(latest.state, "PREPARED", `unexpected resumable state for ${run.runId}: ${latest.state}`);
      request = await readJson(path.join(resultRoot, "requests", `${run.runId}.json`));
      assertRequestRecord(request, { expectedProductCommit: productCommit });
      assert.equal(request.runId, template.runId);
      assert.equal(request.objectId, template.objectId);
      assert.equal(request.purpose, template.purpose);
      assert.equal(request.requestSha256, latest.requestSha256);
    }
    await appendJournalEvent(resultRoot, { runId: run.runId, state: "STARTED", timestamp: nowIso(), requestSha256: request.requestSha256 });
    const startTimestamp = nowIso();
    const started = performance.now();
    const handlerResult = await invokeHandler({
      scriptPath: handlerScript,
      handlerRequest: request.handlerRequest,
      requestSha256: request.requestSha256,
      environment
    });
    invoked += 1;
    const endTimestamp = nowIso();
    const response = buildResponseRecord({
      request,
      handlerResult,
      startTimestamp,
      endTimestamp,
      elapsedMilliseconds: Math.max(0, performance.now() - started)
    });
    await writeJsonExclusive(path.join(resultRoot, "responses", `${run.runId}.json`), response);
    await appendJournalEvent(resultRoot, { runId: run.runId, state: "RESPONSE_RECEIVED", timestamp: nowIso(), responseSha256: response.responseSha256 });
    await appendJournalEvent(resultRoot, { runId: run.runId, state: "RESPONSE_HASHED", timestamp: nowIso(), responseSha256: response.responseSha256 });
    latest = latestByRun(await loadJournal(resultRoot)).get(run.runId);
    assert.equal(latest.state, "RESPONSE_HASHED");
  }
  return { planned: 26, handlerInvocations: invoked, mode, resultRoot };
}

async function cli() {
  const args = process.argv.slice(2);
  const value = (flag) => {
    const index = args.indexOf(flag);
    return index >= 0 ? args[index + 1] : "";
  };
  const resultRoot = value("--result-root");
  const mock = args.includes("--mock");
  if (!mock) {
    assert.ok(args.includes("--execute-exactly-26"), "real execution requires --execute-exactly-26");
    assert.match(value("--expected-product-commit"), /^[a-f0-9]{40}$/, "real execution requires --expected-product-commit <full-40-character-head>");
  }
  const releaseBinding = mock ? null : await beginReleaseBoundInvocation({
    expectedProductCommit: value("--expected-product-commit"),
    resultRoot: path.resolve(resultRoot)
  });
  const result = await runBaseline({
    resultRoot: path.resolve(resultRoot),
    mode: mock ? "mock" : "real",
    mockMode: value("--mock-mode") || "mixed",
    mockTracePath: value("--mock-trace") ? path.resolve(value("--mock-trace")) : "",
    releaseBinding
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
