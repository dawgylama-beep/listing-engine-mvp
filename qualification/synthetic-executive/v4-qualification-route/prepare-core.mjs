import assert from "node:assert/strict";
import { mkdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";

import {
  PACKAGE_IDENTITIES, appendLedger, assertExternalExistingFile, assertExternalNewResultsRoot,
  corpusRoot, inspectPackageIdentities, inspectRepository, readJson, repositoryRoot,
  runSealedVerifier, seal, sha256Bytes, validateAuthorization, writeExclusiveJson
} from "./shared.mjs";

export async function prepareQualificationRun({
  authorizationPath, resultsRoot, now = new Date().toISOString(),
  dependencies = {}
}) {
  const inspectRepositoryFn = dependencies.inspectRepository || inspectRepository;
  const inspectPackageIdentitiesFn = dependencies.inspectPackageIdentities || inspectPackageIdentities;
  const runSealedVerifierFn = dependencies.runSealedVerifier || runSealedVerifier;
  const repositoryIdentity = await inspectRepositoryFn(repositoryRoot);
  const protectedRoots = [repositoryRoot, repositoryIdentity.gitDirectory, repositoryIdentity.commonDirectory, ...repositoryIdentity.worktreeRoots];
  await assertExternalExistingFile(authorizationPath, { protectedRoots });
  await assertExternalNewResultsRoot(resultsRoot, { protectedRoots });
  const packageInspection = await inspectPackageIdentitiesFn(corpusRoot);
  assert.deepEqual(Object.fromEntries(Object.keys(PACKAGE_IDENTITIES).map((key) => [key, packageInspection[key]])), PACKAGE_IDENTITIES);
  const verifier = await runSealedVerifierFn(corpusRoot);
  assert.equal(verifier.result, "PASS"); assert.equal(verifier.caseCount, 14); assert.equal(verifier.checkCount, 98);

  const authorizationBytes = await readFile(authorizationPath);
  const authorization = JSON.parse(authorizationBytes.toString("utf8"));
  validateAuthorization(authorization, { resultsRoot, repositoryIdentity, now });

  await mkdir(resultsRoot, { recursive: false });
  assert.equal(await realpath(resultsRoot), resultsRoot);
  for (const child of [
    "states", "ledger", "dispatch-intents", "captures", "cases", "freeze", "evaluation",
    "runtime-context", "runtime-evidence", "runtime-memory"
  ])
    await mkdir(path.join(resultsRoot, child), { recursive: false });

  const runIdentity = seal({
    schemaVersion: "1.0", recordType: "V4_QUALIFICATION_RUN_IDENTITY", runId: authorization.runId,
    authorizationId: authorization.authorizationId, resultsRoot, repositoryCommit: repositoryIdentity.head,
    repositoryTree: repositoryIdentity.tree, packageIdentities: PACKAGE_IDENTITIES, createdAt: now
  }, "runIdentityHash");
  const authorizationReceipt = seal({
    schemaVersion: "1.0", recordType: "IMMUTABLE_EXTERNAL_AUTHORIZATION_RECEIPT",
    authorization, authorizationSourceSha256: sha256Bytes(authorizationBytes), receivedAt: now,
    runIdentityHash: runIdentity.runIdentityHash
  }, "authorizationReceiptHash");
  const prepared = seal({
    schemaVersion: "1.0", state: "PREPARED_NOT_STARTED", runId: authorization.runId,
    runIdentityHash: runIdentity.runIdentityHash, authorizationReceiptHash: authorizationReceipt.authorizationReceiptHash,
    repositoryCommit: repositoryIdentity.head, packageIdentities: PACKAGE_IDENTITIES,
    providerRequestCount: 0, evaluatorExecutionCount: 0, preparedAt: now
  }, "stateHash");

  await writeExclusiveJson(path.join(resultsRoot, "run-identity.json"), runIdentity);
  await writeExclusiveJson(path.join(resultsRoot, "authorization-receipt.json"), authorizationReceipt);
  await writeExclusiveJson(path.join(resultsRoot, "states", "000-prepared-not-started.json"), prepared);
  await appendLedger(resultsRoot, {
    kind: "RUN_PREPARED", runId: authorization.runId, stateHash: prepared.stateHash,
    authorizationReceiptHash: authorizationReceipt.authorizationReceiptHash, occurredAt: now,
    providerDispatchOccurred: false, evaluatorAccessOccurred: false
  });
  return Object.freeze({ runIdentity, authorizationReceipt, prepared, verifier });
}

export async function loadPreparedRun(resultsRoot) {
  const [{ verifySeal }, runIdentity, receipt, prepared] = await Promise.all([
    import("./shared.mjs"), readJson(path.join(resultsRoot, "run-identity.json")),
    readJson(path.join(resultsRoot, "authorization-receipt.json")),
    readJson(path.join(resultsRoot, "states", "000-prepared-not-started.json"))
  ]);
  verifySeal(runIdentity, "runIdentityHash"); verifySeal(receipt, "authorizationReceiptHash"); verifySeal(prepared, "stateHash");
  assert.equal(runIdentity.resultsRoot, resultsRoot, "PREPARED_RESULTS_ROOT_MISMATCH");
  assert.equal(receipt.runIdentityHash, runIdentity.runIdentityHash); assert.equal(prepared.runIdentityHash, runIdentity.runIdentityHash);
  assert.equal(prepared.state, "PREPARED_NOT_STARTED");
  return Object.freeze({ runIdentity, authorizationReceipt: receipt, prepared, authorization: receipt.authorization });
}
