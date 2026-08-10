import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstat, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";
import { createSourceGroundedCostEnvelope } from "../benchmarks/blind-object-v2/scripts/cost-envelope.mjs";
import { validateProductRuntimeSnapshot } from "../benchmarks/blind-object-v2/scripts/execution-profile.mjs";
import { benchmarkRoot, computeResultTreeAggregate, defaultFreezeRoot, defaultResultHistoryRoot, loadPublicFreeze } from "../benchmarks/blind-object-v2/scripts/execution-store.mjs";
import { createLaunchScope, deriveLaunchIdentities } from "../benchmarks/blind-object-v2/scripts/launch-identity.mjs";
import {
  LEGACY_V117_EXPECTED_WORKTREE_SHA256,
  LEGACY_V117_OBSERVED_DETACHED_SHA256,
  PRODUCT_COST_RUNTIME_MANIFEST_HASH,
  PRODUCT_COST_SOURCE_HEAD,
  PRODUCT_HANDLER_SOURCE_PATH,
  auditProductProviderSurface,
  createProductCostSourceManifest,
  inspectCanonicalUtf8SourceBytes,
  loadCanonicalProductCostSourceAudit,
  validateProductCostSourceManifest
} from "../benchmarks/blind-object-v2/scripts/product-cost-source.mjs";
import { sha256Bytes, sha256Json } from "../benchmarks/blind-object-v2/scripts/protocol.mjs";
import { parseAuthorizedExecutionArguments } from "../benchmarks/blind-object-v2/scripts/run-authorized-execution.mjs";
import { createSyntheticAuthority } from "../benchmarks/blind-object-v2/scripts/synthetic-authority.mjs";

const FREEZE = "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699";
const FAILED_ROOT_NAME = "result-root-b912b16dae9e822f1076257815bd2e1a7d8cece05afe18e9";
const FAILED_CONSENT_NAME = "consent-d1b50d51ddd008ecc7cae6925633043fd64c57489d0c1b45.json";
const FAILED_RESERVATION_NAME = "invocation-0d5a024913e582fdd3a65cd44923d217ce2e6936f00e4f65.json";
const POST_HANDLER_ROOT_NAME = "result-root-f65ebb9d361c4977ac76755f8c7059375ae6d8d3fb4b0464";
const POST_HANDLER_CONSENT_NAME = "consent-ebe3e1f4d0d1b781fcc3f408bc2989fd74739fe7bd79faae.json";
const POST_HANDLER_RESERVATION_NAME = "invocation-3540a4bf98950418b6f5fbea2f6b82388e2b03a8d6c02909.json";
const UNUSED_V11222_CONSENT_NAME = "consent-4ccd259de4ab835833dffe3274f5b0bf0b8b507359a5665f.json";
const UNUSED_V11224_CONSENT_NAME = "consent-6c84172d50050d8e2389e7721698df0b80b7d5e48e97fdd7.json";
const ORIGINAL_FAILURE_PATHS = Object.freeze(["cost-envelope.json", "cost-ledger.json", "execution-consent.json", "execution-journal.json", "execution-profile.json", "invocation-reservation.json", "launch-scope.json", "pricing-profile.json"]);
const CANONICAL_HANDLER_SHA256 = "971194eb5be57c54176244516953237f3fb4dd6fcb4d00dfdc9c36358202c958";

function gitBuffer(args) {
  return execFileSync("git", args, { cwd: path.resolve("."), windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
}

function canonicalHandlerBytes() {
  return gitBuffer(["cat-file", "blob", `${PRODUCT_COST_SOURCE_HEAD}:${PRODUCT_HANDLER_SOURCE_PATH}`]);
}

function resealManifest(mutator) {
  const record = structuredClone(createProductCostSourceManifest());
  mutator(record);
  record.completeSourceInventoryHash = sha256Json(record.sourceEntries);
  delete record.manifestHash;
  record.manifestHash = sha256Json(record);
  return record;
}

function launchInput(scope) {
  const input = structuredClone(scope);
  delete input.schemaVersion;
  delete input.scopeType;
  delete input.launchScopeHash;
  return input;
}

test("A: the Version 1.12.17 failure fixture reproduces the exact checkout-hash mismatch", () => {
  assert.equal(LEGACY_V117_EXPECTED_WORKTREE_SHA256, "bca3ecd47169b478083d8551a5761015f0763e22d4b2c7afd8c09e1087778397");
  assert.equal(LEGACY_V117_OBSERVED_DETACHED_SHA256, "c663dc884ed673bbd4e847397b13037e779033e0cd4495de6f70b5153f3dab03");
  assert.throws(() => assert.equal(LEGACY_V117_OBSERVED_DETACHED_SHA256, LEGACY_V117_EXPECTED_WORKTREE_SHA256), /Expected values/);
  const canonical = inspectCanonicalUtf8SourceBytes(canonicalHandlerBytes(), PRODUCT_HANDLER_SOURCE_PATH);
  const crlfCheckout = Buffer.from(canonical.text.replaceAll("\n", "\r\n"), "utf8");
  assert.equal(canonical.sha256, CANONICAL_HANDLER_SHA256);
  assert.equal(sha256Bytes(crlfCheckout), LEGACY_V117_OBSERVED_DETACHED_SHA256);
  assert.notEqual(canonical.sha256, LEGACY_V117_EXPECTED_WORKTREE_SHA256);
});

test("B-C: canonical Git-blob authority is checkout-location and line-ending invariant", async () => {
  const first = loadCanonicalProductCostSourceAudit();
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-cost-source-location-"));
  try {
    const checkout = path.join(root, "generate-listing.js");
    const canonical = canonicalHandlerBytes();
    await writeFile(checkout, Buffer.from(canonical.toString("utf8").replaceAll("\n", "\r\n"), "utf8"));
    const moduleUrl = pathToFileURL(path.resolve("benchmarks/blind-object-v2/scripts/product-cost-source.mjs")).href;
    const code = `import { loadCanonicalProductCostSourceAudit } from ${JSON.stringify(moduleUrl)}; process.stdout.write(loadCanonicalProductCostSourceAudit().manifestHash);`;
    const fromForeignCwd = execFileSync(process.execPath, ["--input-type=module", "-e", code], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
    assert.equal(fromForeignCwd, first.manifestHash);
    assert.equal((await readFile(checkout)).equals(canonical), false);
    assert.equal(loadCanonicalProductCostSourceAudit().manifestHash, first.manifestHash);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("D: BOM, encoding, and canonical line-ending drift fail closed", () => {
  const canonical = canonicalHandlerBytes();
  assert.throws(() => inspectCanonicalUtf8SourceBytes(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), canonical])), /BOM/);
  assert.throws(() => inspectCanonicalUtf8SourceBytes(Buffer.from([0xff, 0xfe, 0x00, 0x61])), /encoded data|UTF-8/i);
  assert.throws(() => inspectCanonicalUtf8SourceBytes(Buffer.from(canonical.toString("utf8").replaceAll("\n", "\r\n"), "utf8")), /LF-only/);
});

test("E-G: product commit, path, and canonical source-content drift invalidate the manifest", () => {
  for (const mutation of [
    (record) => { record.productSourceHead = "1".repeat(40); },
    (record) => { record.sourceEntries[0].relativePath = "api/substitute.js"; },
    (record) => { record.sourceEntries[0].canonicalGitBlobSha256 = "2".repeat(64); },
    (record) => { record.sourceEntries[0].canonicalByteCount += 1; }
  ]) assert.throws(() => validateProductCostSourceManifest(resealManifest(mutation)), /differs from the repository-owned authority/);
});

test("H: source inventory is complete and an unclassified reachable billable call site blocks eligibility", () => {
  const manifest = createProductCostSourceManifest();
  assert.equal(manifest.sourceEntries.length, 31);
  assert.equal(manifest.sourceEntries[0].relativePath, PRODUCT_HANDLER_SOURCE_PATH);
  assert.throws(() => validateProductCostSourceManifest(resealManifest((record) => { record.sourceEntries.pop(); })), /differs from the repository-owned authority/);
  const changedHandler = `${canonicalHandlerBytes().toString("utf8")}\nfetch("https://unclassified.invalid");\n`;
  assert.throws(() => auditProductProviderSurface(new Map([[PRODUCT_HANDLER_SOURCE_PATH, changedHandler]])), /unclassified call site|drift/);
});

test("I: CLI, environment-shaped fields, package data, candidates, filenames, and text cannot select source authority", async () => {
  const frozen = await loadPublicFreeze(defaultFreezeRoot);
  const authority = await createSyntheticAuthority(frozen, "source-override");
  const base = { requests: frozen.requests, assetCache: frozen.assetCache, attemptCeiling: authority.attemptCeiling, executionProfile: authority.profile, pricingProfile: authority.pricingProfile };
  for (const field of ["productSourcePath", "productSourceSha256", "productSourceHead", "sourceRole", "extractionRule", "productCostSourceManifestHash", "packageData", "candidateData", "freeFormText"]) {
    assert.throws(() => createSourceGroundedCostEnvelope({ ...base, [field]: "caller-selected" }), /caller-selected source|unknown field/);
  }
  for (const value of [PRODUCT_HANDLER_SOURCE_PATH, CANONICAL_HANDLER_SHA256, PRODUCT_COST_SOURCE_HEAD, "PRODUCT_COST_SOURCE_MANIFEST", "candidate", "free-form text"]) {
    assert.throws(() => parseAuthorizedExecutionArguments(["PREFLIGHT", FREEZE, value]));
  }
  const source = await readFile(new URL("../benchmarks/blind-object-v2/scripts/product-cost-source.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /process\.env|candidateData|packageData/);
});

test("J-K: canonical source audit preserves runtime pinning and the exact cost envelope", async () => {
  const records = gitBuffer(["ls-tree", "-r", "--full-tree", PRODUCT_COST_SOURCE_HEAD]).toString("utf8").trim().split(/\r?\n/).map((line) => {
    const match = line.match(/^(\d{6})\s+(blob|commit)\s+([a-f0-9]{40})\t(.+)$/);
    return { mode: match[1], type: match[2], gitObjectId: match[3], relativePath: match[4] };
  });
  const snapshot = validateProductRuntimeSnapshot({ head: PRODUCT_COST_SOURCE_HEAD, branch: "", status: "", records, version: "1.12.13" });
  assert.equal(snapshot.productRuntimeManifestHash, PRODUCT_COST_RUNTIME_MANIFEST_HASH);
  assert.throws(() => validateProductRuntimeSnapshot({ head: "1".repeat(40), branch: "", status: "", records, version: "1.12.13" }), /HEAD differs/);
  assert.throws(() => validateProductRuntimeSnapshot({ head: PRODUCT_COST_SOURCE_HEAD, branch: "branch", status: "", records, version: "1.12.13" }), /detached/);
  assert.throws(() => validateProductRuntimeSnapshot({ head: PRODUCT_COST_SOURCE_HEAD, branch: "", status: " M api\/generate-listing.js", records, version: "1.12.13" }), /not clean/);
  const frozen = await loadPublicFreeze(defaultFreezeRoot);
  const authority = await createSyntheticAuthority(frozen, "canonical-cost-stability");
  assert.equal(authority.costEnvelope.completePhysicalAttemptCeiling, 832);
  assert.equal(authority.costEnvelope.conservativeMaximumCost, 39.17741232);
  assert.equal(authority.costEnvelope.authorizedMaximumMinorUnits, 4000);
  assert.equal(authority.costEnvelope.costState, "COMPLETE_RUN_WITHIN_AUTHORIZED_COST");
});

test("L: changing the Product Cost-Source Manifest hash changes Launch Scope and all proposed identities", async () => {
  const frozen = await loadPublicFreeze(defaultFreezeRoot);
  const authority = await createSyntheticAuthority(frozen, "source-identity-binding");
  const changed = createLaunchScope({ ...launchInput(authority.launchScope), productCostSourceManifestHash: "f".repeat(64) });
  const first = deriveLaunchIdentities(authority.launchScope);
  const second = deriveLaunchIdentities(changed);
  assert.notEqual(authority.launchScope.launchScopeHash, changed.launchScopeHash);
  for (const field of ["consentId", "invocationId", "reservationId", "resultId", "resultRootName"]) assert.notEqual(first[field], second[field]);
});

test("M-O: product/freeze isolation, real-run absence, and hard network denial remain intact", async () => {
  const guard = installHardNetworkDenial();
  try {
    const changed = gitBuffer(["diff", "--name-only", "89724d6638c78c7c325957371d1f14ef7bebb5ae", "--", "api", "lib", "benchmarks/blind-object-v2/prepared"]).toString("utf8").trim();
    assert.equal(changed, "");
    const frozen = await loadPublicFreeze(defaultFreezeRoot);
    assert.equal(frozen.requests.length, 26);
    assert.equal(frozen.requests.every((request) => request.executionAuthorized === false), true);
    const consentNames = (await readdir(path.join(benchmarkRoot, "consent"))).sort();
    const successorConsentNames = consentNames.filter((name) => ![FAILED_CONSENT_NAME, POST_HANDLER_CONSENT_NAME, UNUSED_V11222_CONSENT_NAME, UNUSED_V11224_CONSENT_NAME].includes(name));
    assert.deepEqual(consentNames.filter((name) => [FAILED_CONSENT_NAME, POST_HANDLER_CONSENT_NAME].includes(name)), [FAILED_CONSENT_NAME, POST_HANDLER_CONSENT_NAME].sort());
    const unusedConsent = JSON.parse(await readFile(path.join(benchmarkRoot, "consent", UNUSED_V11222_CONSENT_NAME), "utf8"));
    assert.equal(unusedConsent.executorVersion, "1.12.22");
    assert.equal(unusedConsent.status, "AUTHORIZED_NOT_CONSUMED");
    const unusedV11224Consent = JSON.parse(await readFile(path.join(benchmarkRoot, "consent", UNUSED_V11224_CONSENT_NAME), "utf8"));
    assert.equal(unusedV11224Consent.executorVersion, "1.12.24");
    assert.equal(unusedV11224Consent.status, "AUTHORIZED_NOT_CONSUMED");
    assert.ok(successorConsentNames.length <= 1, "at most one Version 1.12.23 continuation consent may exist");
    if (successorConsentNames.length === 1) {
      assert.match(successorConsentNames[0], /^consent-[a-f0-9]{48}\.json$/);
      const successorConsent = JSON.parse(await readFile(path.join(benchmarkRoot, "consent", successorConsentNames[0]), "utf8"));
      assert.equal(successorConsent.executorVersion, "1.12.23");
      assert.equal(successorConsent.authorizedRequestCount, 25);
    }

    const resultRootNames = (await readdir(defaultResultHistoryRoot)).sort();
    const successorResultRootNames = resultRootNames.filter((name) => ![".reservations", ".consent-revocations", FAILED_ROOT_NAME, POST_HANDLER_ROOT_NAME].includes(name));
    assert.deepEqual(resultRootNames.filter((name) => [".reservations", FAILED_ROOT_NAME, POST_HANDLER_ROOT_NAME].includes(name)), [".reservations", FAILED_ROOT_NAME, POST_HANDLER_ROOT_NAME].sort());
    assert.ok(successorResultRootNames.length <= 1, "at most one Version 1.12.23 continuation result root may exist");
    if (successorResultRootNames.length === 1) assert.match(successorResultRootNames[0], /^result-root-[a-f0-9]{48}$/);

    const reservationNames = (await readdir(path.join(defaultResultHistoryRoot, ".reservations"))).sort();
    const successorReservationNames = reservationNames.filter((name) => ![FAILED_RESERVATION_NAME, POST_HANDLER_RESERVATION_NAME].includes(name));
    assert.deepEqual(reservationNames.filter((name) => [FAILED_RESERVATION_NAME, POST_HANDLER_RESERVATION_NAME].includes(name)), [FAILED_RESERVATION_NAME, POST_HANDLER_RESERVATION_NAME].sort());
    assert.ok(successorReservationNames.length <= 1, "at most one Version 1.12.23 continuation reservation may exist");
    if (successorReservationNames.length === 1) assert.match(successorReservationNames[0], /^invocation-[a-f0-9]{48}\.json$/);
    const failedRoot = path.join(defaultResultHistoryRoot, FAILED_ROOT_NAME);
    assert.equal((await computeResultTreeAggregate(failedRoot, ORIGINAL_FAILURE_PATHS)).aggregate, "788b7bf4117ff2b33eae85de3b1a3288878a26c41752af12f0f10c82e3117ddf");
    for (const name of ["zero-external-supersession-receipt.json", "terminal-failure-manifest.json", "terminal-failure-validation-report.json"]) assert.equal((await lstat(path.join(failedRoot, name))).isFile(), true);
    const postHandlerRoot = path.join(defaultResultHistoryRoot, POST_HANDLER_ROOT_NAME);
    assert.equal((await computeResultTreeAggregate(postHandlerRoot, ORIGINAL_FAILURE_PATHS)).aggregate, "9a837c740e2d47d6d0febd721dc16237e2934bc697f0a840223449862ce2ec7b");
    const reconciliationNames = ["post-handler-reconciliation-receipt.json", "reservation-closure-receipt.json", "terminal-failure-manifest.json", "terminal-failure-validation-report.json"];
    const reconciliationPresence = await Promise.all(reconciliationNames.map(async (name) => {
      try { return (await lstat(path.join(postHandlerRoot, name))).isFile(); } catch (error) { if (error?.code === "ENOENT") return false; throw error; }
    }));
    assert.ok(reconciliationPresence.every(Boolean) || reconciliationPresence.every((present) => !present), "Version 1.12.21 reconciliation must be absent or complete, never partial");
    for (const name of ["invocations", "results"]) await assert.rejects(lstat(path.join(benchmarkRoot, name)), /ENOENT/, `premature successor authority exists: ${name}`);
    assert.equal(loadCanonicalProductCostSourceAudit().providerAudit.inventory.totalFetchSites, 3);
    assert.equal(guard.attempts.length, 0);
  } finally {
    guard.restore();
  }
});
