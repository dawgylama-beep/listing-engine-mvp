import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  BENCHMARK_COMMIT, CONTRACT_SHA256, CORPUS_SHA256,
  assertNoSecretMaterial, assertRequestRecord, assertResponseRecord, executionRoot,
  loadLocalSecretValues, loadRunPlan, makeReadOnly, readJson, sha256Bytes,
  writeJsonExclusive
} from "./execution-common.mjs";
import { appendJournalEvent, journalPath, latestByRun, loadJournal } from "./run-journal.mjs";
import { calculateAggregateResultHash } from "./result-integrity.mjs";

function dataUrlBytes(dataUrl) {
  const encoded = String(dataUrl || "").split(",", 2)[1] || "";
  const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor(encoded.length * 3 / 4) - padding);
}

export async function freezeResponses({ resultRoot, nowIso = () => new Date().toISOString() }) {
  const [plan, input, benchmarkManifest, executorFreeze] = await Promise.all([
    loadRunPlan(),
    readJson(path.join(executionRoot, "..", "blind-object-v1", "input-cases.json")),
    readJson(path.join(executionRoot, "..", "blind-object-v1", "manifest.json")),
    readJson(path.join(executionRoot, "EXECUTOR_FREEZE.json"))
  ]);
  const knownSecretValues = await loadLocalSecretValues();
  const caseById = new Map(input.cases.map((entry) => [entry.caseId, entry]));
  const assetByPath = new Map(benchmarkManifest.assets.map((entry) => [entry.path, entry]));
  const requests = [];
  const responses = [];
  const requestRefs = [];
  const responseRefs = [];
  const latest = latestByRun(await loadJournal(resultRoot));
  for (const run of plan.runs) {
    assert.ok(["RESPONSE_HASHED", "FROZEN"].includes(latest.get(run.runId)?.state), `${run.runId} is not ready to freeze`);
    const requestPath = path.join(resultRoot, "requests", `${run.runId}.json`);
    const responsePath = path.join(resultRoot, "responses", `${run.runId}.json`);
    const requestBytes = await readFile(requestPath);
    const responseBytes = await readFile(responsePath);
    const request = JSON.parse(requestBytes.toString("utf8"));
    const response = JSON.parse(responseBytes.toString("utf8"));
    assertRequestRecord(request);
    assertResponseRecord(response);
    assertNoSecretMaterial(request, knownSecretValues);
    assertNoSecretMaterial(response, knownSecretValues);
    assert.equal(request.runId, run.runId);
    assert.equal(request.objectId, run.caseId);
    assert.equal(request.purpose, run.purpose);
    assert.equal(request.runType, run.runType);
    assert.equal(response.runId, request.runId);
    assert.equal(response.objectId, request.objectId);
    assert.equal(response.requestSha256, request.requestSha256);
    const caseRecord = caseById.get(run.caseId);
    assert.equal(request.lane, caseRecord.lane);
    assert.equal(request.description, caseRecord.description);
    assert.equal(request.handlerRequest.body.notes, caseRecord.description);
    assert.deepEqual(request.images, caseRecord.images.map((assetPath) => ({
      imageId: path.basename(assetPath, path.extname(assetPath)).toUpperCase(),
      sha256: assetByPath.get(assetPath).sha256
    })));
    assert.equal(request.handlerRequest.body.photos.length, request.images.length);
    assert.ok(request.handlerRequest.body.photos.every((photo) => /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(photo.dataUrl)));
    assert.ok(request.handlerRequest.body.photos.reduce((sum, photo) => sum + dataUrlBytes(photo.dataUrl), 0) <= 240000);
    requests.push(request);
    responses.push(response);
    requestRefs.push({ runId: run.runId, path: `requests/${run.runId}.json`, fileSha256: sha256Bytes(requestBytes) });
    responseRefs.push({ runId: run.runId, path: `responses/${run.runId}.json`, fileSha256: sha256Bytes(responseBytes) });
  }
  assert.equal(requests.length, 26);
  assert.equal(responses.length, 26);
  assert.equal(new Set(requests.map((entry) => entry.runId)).size, 26);
  for (const run of plan.runs) {
    if (latest.get(run.runId).state === "RESPONSE_HASHED") {
      await appendJournalEvent(resultRoot, {
        runId: run.runId,
        state: "FROZEN",
        timestamp: nowIso(),
        detail: "Request and response records verified and included in the aggregate raw-response freeze."
      });
    }
  }
  const journalBytes = await readFile(journalPath(resultRoot));
  const manifest = {
    schemaVersion: 1,
    executorId: "blind-object-v1-execution-v1",
    productCommit: requests[0].productCommit,
    benchmarkCommit: BENCHMARK_COMMIT,
    corpusSha256: CORPUS_SHA256,
    contractSha256: CONTRACT_SHA256,
    executorContentSha256: executorFreeze.executorContentSha256,
    requestCount: 26,
    responseCount: 26,
    runIds: plan.runs.map((entry) => entry.runId),
    requests: requestRefs,
    responses: responseRefs,
    journalSha256: sha256Bytes(journalBytes),
    aggregateResultSha256: calculateAggregateResultHash(requests, responses),
    rawResponseFreezeTimestamp: nowIso(),
    gradingPermitted: true
  };
  const manifestPath = path.join(resultRoot, "frozen-result-manifest.json");
  await writeJsonExclusive(manifestPath, manifest);
  for (const ref of [...requestRefs, ...responseRefs]) await makeReadOnly(path.join(resultRoot, ref.path));
  await makeReadOnly(journalPath(resultRoot));
  await makeReadOnly(manifestPath);
  return manifest;
}

async function cli() {
  const args = process.argv.slice(2);
  const index = args.indexOf("--result-root");
  assert.ok(index >= 0 && args[index + 1], "usage: node freeze-responses.mjs --result-root <path>");
  const manifest = await freezeResponses({ resultRoot: path.resolve(args[index + 1]) });
  process.stdout.write(`${JSON.stringify({ status: "PASS", requestCount: manifest.requestCount, responseCount: manifest.responseCount, aggregateResultSha256: manifest.aggregateResultSha256 }, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
