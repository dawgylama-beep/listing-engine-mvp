import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";
import { createSourceGroundedCostEnvelope } from "../benchmarks/blind-object-v2/scripts/cost-envelope.mjs";
import { validateProductRuntimeSnapshot } from "../benchmarks/blind-object-v2/scripts/execution-profile.mjs";
import { assertNoRealAuthorityArtifacts, defaultFreezeRoot, loadPublicFreeze } from "../benchmarks/blind-object-v2/scripts/execution-store.mjs";
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
    assert.equal(await assertNoRealAuthorityArtifacts(), true);
    assert.equal(loadCanonicalProductCostSourceAudit().providerAudit.inventory.totalFetchSites, 3);
    assert.equal(guard.attempts.length, 0);
  } finally {
    guard.restore();
  }
});
