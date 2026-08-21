import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  evaluatorControlAggregateHash,
  evaluatorControlIdentityRows
} from "../qualification/synthetic-executive/v4-qualification-route/evaluate-core.mjs";
import {
  CASE_IDS,
  PACKAGE_IDENTITIES,
  corpusRoot,
  sha256Bytes,
  sha256Json,
  stableJson
} from "../qualification/synthetic-executive/v4-qualification-route/shared.mjs";

const controlRelativePath = (caseId) => `cases/${caseId}/evaluator/control.json`;

async function loadControls({ windowsSeparators = false } = {}) {
  const controls = [];
  const files = [];
  for (const caseId of CASE_IDS) {
    const canonicalRelativePath = controlRelativePath(caseId);
    const suppliedRelativePath = windowsSeparators
      ? canonicalRelativePath.replaceAll("/", "\\")
      : canonicalRelativePath;
    const bytes = await readFile(path.join(corpusRoot, ...suppliedRelativePath.split(/[\\/]/)));
    controls.push(JSON.parse(bytes));
    files.push({ caseId, canonicalRelativePath, suppliedRelativePath, bytes });
  }
  return { controls, files };
}

test("route evaluator aggregate matches the sealed verifier identity-row framing", async () => {
  const { controls } = await loadControls();
  const rows = evaluatorControlIdentityRows(controls);
  assert.deepEqual(rows, controls.map((control) => ({ caseId: control.caseId, sha256: sha256Json(control) })));
  assert.equal(Buffer.byteLength(stableJson(rows)), 1387);
  assert.equal(evaluatorControlAggregateHash(controls), PACKAGE_IDENTITIES.evaluatorControlAggregateHash);
  assert.equal(sha256Json(controls), "47d483830b1f7e7b512c67928915106b79f8bf6cfec5a795ac5831a626bb8fa7");
});

test("route evaluator aggregate rejects changed control ordering", async () => {
  const { controls } = await loadControls();
  assert.throws(
    () => evaluatorControlAggregateHash([...controls].reverse()),
    /EVALUATOR_CONTROL_ORDER_CHANGED/
  );
});

test("Windows path separators do not enter evaluator aggregate framing", async () => {
  const canonical = await loadControls();
  const windows = await loadControls({ windowsSeparators: true });
  assert.equal(windows.files.every((file) => file.suppliedRelativePath.includes("\\")), true);
  assert.deepEqual(windows.controls, canonical.controls);
  assert.equal(evaluatorControlAggregateHash(windows.controls), PACKAGE_IDENTITIES.evaluatorControlAggregateHash);
});

test("LF materialization preserves the sealed aggregate while CRLF byte tampering is denied", async () => {
  const { controls, files } = await loadControls();
  const manifest = JSON.parse(await readFile(path.join(corpusRoot, "readiness-integrity-manifest.json")));
  const artifactByPath = new Map(manifest.artifacts.map((artifact) => [artifact.relativePath, artifact]));
  for (const file of files) {
    assert.equal(file.bytes.includes(Buffer.from("\r\n")), false);
    assert.equal(file.bytes.at(-1), 0x0a);
    assert.equal(sha256Bytes(file.bytes), artifactByPath.get(file.canonicalRelativePath).sha256);
    const crlfBytes = Buffer.from(file.bytes.toString("utf8").replaceAll("\n", "\r\n"));
    assert.notEqual(sha256Bytes(crlfBytes), artifactByPath.get(file.canonicalRelativePath).sha256);
    assert.deepEqual(JSON.parse(crlfBytes), JSON.parse(file.bytes));
  }
  assert.equal(evaluatorControlAggregateHash(controls), PACKAGE_IDENTITIES.evaluatorControlAggregateHash);
});

test("control tampering cannot retain the sealed evaluator aggregate", async () => {
  const { controls } = await loadControls();
  const tampered = structuredClone(controls);
  tampered[0].expectedResponse.classificationType = "TAMPERED";
  assert.notEqual(evaluatorControlAggregateHash(tampered), PACKAGE_IDENTITIES.evaluatorControlAggregateHash);
});
