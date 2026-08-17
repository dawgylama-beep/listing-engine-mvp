import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import {
  CHECKPOINT,
  readJson,
  repositoryRoot,
  runRoot,
  seal,
  stableJson,
  writeExclusiveJson
} from "./v4-runtime.mjs";

const execFileAsync = promisify(execFile);
const expectedSubject = "test: bind V4 mentor qualification bridge and authority";
const remoteRef = "refs/heads/refactor/beta-evidence-pipeline";

async function git(...args) {
  return (await execFileAsync("git", args, { cwd: repositoryRoot, encoding: "utf8" })).stdout.trim();
}

async function main() {
  const [authorityCommit, authorityTree, authorityParent, subject, branch, trackingHead, remoteOutput, authorityIdentity] = await Promise.all([
    git("rev-parse", "HEAD"),
    git("rev-parse", "HEAD^{tree}"),
    git("rev-parse", "HEAD^"),
    git("show", "-s", "--format=%s", "HEAD"),
    git("branch", "--show-current"),
    git("rev-parse", "@{upstream}"),
    git("ls-remote", "--heads", "origin", remoteRef),
    readJson(path.join(runRoot, "authority-file-identity.json"))
  ]);
  const directRemoteHead = remoteOutput.split(/\s+/)[0];
  assert.equal(authorityParent, CHECKPOINT.commit);
  assert.equal(subject, expectedSubject);
  assert.equal(branch, "refactor/beta-evidence-pipeline");
  assert.equal(trackingHead, authorityCommit);
  assert.equal(directRemoteHead, authorityCommit);
  const record = seal({
    schemaVersion: "1.0",
    identityType: "V4_AUTHORITY_COMMIT_PUBLICATION_REMOTE_READBACK",
    authorityCommit,
    authorityTree,
    authorityParent,
    subject,
    branch,
    trackingHead,
    directRemoteHead,
    directRemoteRef: remoteRef,
    authorityFileSha256: authorityIdentity.authorityFileSha256,
    pushMode: "ORDINARY_NON_FORCE",
    pushCount: 1,
    pushRetries: 0,
    localTrackingDirectRemoteEqual: true,
    readBackAt: new Date().toISOString()
  }, "publicationReadbackHash");
  await writeExclusiveJson(path.join(runRoot, "authority-publication-readback.json"), record);
  process.stdout.write(`${stableJson(record)}\n`);
}

await main();
