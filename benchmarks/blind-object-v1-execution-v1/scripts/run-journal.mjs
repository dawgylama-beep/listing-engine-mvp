import assert from "node:assert/strict";
import { appendFile, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const transitions = Object.freeze({
  PLANNED: new Set(["PREPARED"]),
  PREPARED: new Set(["STARTED"]),
  STARTED: new Set(["RESPONSE_RECEIVED", "INDETERMINATE"]),
  RESPONSE_RECEIVED: new Set(["RESPONSE_HASHED", "INDETERMINATE"]),
  RESPONSE_HASHED: new Set(["FROZEN"]),
  FROZEN: new Set(),
  INDETERMINATE: new Set()
});

export const journalPath = (resultRoot) => path.join(resultRoot, "run-journal.jsonl");

export async function loadJournal(resultRoot) {
  const filePath = journalPath(resultRoot);
  if (!await stat(filePath, { throwIfNoEntry: false })) return [];
  const text = await readFile(filePath, "utf8");
  return text.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

export function latestByRun(events) {
  const latest = new Map();
  for (const event of events) latest.set(event.runId, event);
  return latest;
}

export async function appendJournalEvent(resultRoot, event) {
  const events = await loadJournal(resultRoot);
  const latest = latestByRun(events).get(event.runId);
  if (!latest) assert.equal(event.state, "PLANNED", "first journal state must be PLANNED");
  else assert.ok(transitions[latest.state].has(event.state), `invalid journal transition ${latest.state} -> ${event.state}`);
  const record = {
    schemaVersion: 1,
    sequence: events.length + 1,
    runId: event.runId,
    state: event.state,
    timestamp: event.timestamp,
    requestSha256: event.requestSha256 ?? latest?.requestSha256 ?? null,
    responseSha256: event.responseSha256 ?? latest?.responseSha256 ?? null,
    detail: event.detail ?? null
  };
  assert.match(record.runId, /^RUN-\d{3}$/);
  assert.ok(transitions[record.state]);
  await mkdir(resultRoot, { recursive: true });
  await appendFile(journalPath(resultRoot), `${JSON.stringify(record)}\n`, { encoding: "utf8", flush: true });
  return record;
}

export async function initializeJournal(resultRoot, runs, nowIso) {
  const existing = await loadJournal(resultRoot);
  if (existing.length) return existing;
  for (const run of runs) {
    await appendJournalEvent(resultRoot, { runId: run.runId, state: "PLANNED", timestamp: nowIso() });
  }
  return loadJournal(resultRoot);
}

export async function stopOnIndeterminate(resultRoot, nowIso) {
  const latest = latestByRun(await loadJournal(resultRoot));
  const unsafe = [...latest.values()].filter((entry) => ["STARTED", "RESPONSE_RECEIVED", "INDETERMINATE"].includes(entry.state));
  for (const event of unsafe) {
    if (event.state !== "INDETERMINATE") {
      await appendJournalEvent(resultRoot, {
        runId: event.runId,
        state: "INDETERMINATE",
        timestamp: nowIso(),
        detail: "Handler invocation began but a securely hashed response boundary was not proven. Automatic retry is prohibited."
      });
    }
  }
  assert.equal(unsafe.length, 0, `indeterminate run blocks resume: ${unsafe.map((entry) => entry.runId).join(", ")}`);
}
