import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CONTRACT_SHA256, CORPUS_SHA256, BENCHMARK_COMMIT,
  RUN_COUNT, assertRequestRecord, assertResponseRecord,
  loadRunPlan, readJson, sha256Bytes, sha256Json
} from "./execution-common.mjs";
import { journalPath, latestByRun, loadJournal } from "./run-journal.mjs";

export function calculateAggregateResultHash(requests, responses) {
  return sha256Json(requests.map((request, index) => ({
    runId: request.runId,
    requestSha256: request.requestSha256,
    responseSha256: responses[index].responseSha256
  })));
}

export async function verifyFrozenResultIntegrity(resultRoot) {
  const manifestPath = path.join(resultRoot, "frozen-result-manifest.json");
  const [manifest, plan] = await Promise.all([
    readJson(manifestPath),
    loadRunPlan()
  ]);
  assert.equal(manifest.schemaVersion, 1);
  assert.match(manifest.productCommit, /^[a-f0-9]{40}$/);
  assert.equal(manifest.benchmarkCommit, BENCHMARK_COMMIT);
  assert.equal(manifest.corpusSha256, CORPUS_SHA256);
  assert.equal(manifest.contractSha256, CONTRACT_SHA256);
  assert.match(manifest.executorContentSha256, /^[a-f0-9]{64}$/, "historical and current executor content hashes must remain readable");
  assert.equal(manifest.requestCount, RUN_COUNT);
  assert.equal(manifest.responseCount, RUN_COUNT);
  assert.deepEqual(manifest.runIds, plan.runs.map((entry) => entry.runId));
  const requests = [];
  const responses = [];
  for (const [index, run] of plan.runs.entries()) {
    const requestRef = manifest.requests[index];
    const responseRef = manifest.responses[index];
    assert.equal(requestRef.runId, run.runId);
    assert.equal(responseRef.runId, run.runId);
    const requestBytes = await readFile(path.join(resultRoot, requestRef.path));
    const responseBytes = await readFile(path.join(resultRoot, responseRef.path));
    assert.equal(sha256Bytes(requestBytes), requestRef.fileSha256);
    assert.equal(sha256Bytes(responseBytes), responseRef.fileSha256);
    const request = JSON.parse(requestBytes.toString("utf8"));
    const response = JSON.parse(responseBytes.toString("utf8"));
    assertRequestRecord(request, { expectedProductCommit: manifest.productCommit });
    assertResponseRecord(response);
    assert.equal(request.requestSha256, response.requestSha256);
    assert.equal(request.objectId, response.objectId);
    requests.push(request);
    responses.push(response);
  }
  assert.equal(calculateAggregateResultHash(requests, responses), manifest.aggregateResultSha256);
  const journalBytes = await readFile(journalPath(resultRoot));
  assert.equal(sha256Bytes(journalBytes), manifest.journalSha256);
  const latest = latestByRun(await loadJournal(resultRoot));
  assert.deepEqual(plan.runs.map((run) => latest.get(run.runId)?.state), Array(RUN_COUNT).fill("FROZEN"));
  assert.equal(manifest.gradingPermitted, true);
  return { manifest, requests, responses, integrityVerifiedBeforePrivateLoad: true };
}
