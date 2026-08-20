import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateProductRuntimeSnapshot } from "../../../benchmarks/blind-object-v2/scripts/execution-profile.mjs";
import { EpisodeEvidenceSandbox } from "./episode-sandbox.mjs";
import { validateBudgetProfile } from "./qualification-governor.mjs";
import { readJson, sha256Bytes, sha256Json } from "./protocol.mjs";
import { runTerminologyCheck } from "./terminology-check.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const qualificationRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(qualificationRoot, "..", "..");
const PRODUCT_COMMIT = "7056eb0601dc69c5985703fea6fe665e82c6bed8";
const STRUCTURED_OUTPUT_COMPATIBILITY_PARENT = "3b51c5156ab33eea3cc6a5c2a4226aa87ef5eb45";
const CONSENT_ID = "consent-6c84172d50050d8e2389e7721698df0b80b7d5e48e97fdd7";
const PRESERVED_CONSENT_RELATIVE_PATH = `qualification/synthetic-executive/episodes/visible/KE-P7-H06/artifacts/sealed-evidence/01-${CONSENT_ID}.json`;
export const CANONICAL_ROLE_REGISTRY_READINESS_BINDING = Object.freeze({
  commit: "ccc1c64da9d5072b87681953b2b2480f1396235a",
  tree: "ab45141f9966ac4168e13f1539a15437b914d9ab",
  repositoryRelativePath: "qualification/synthetic-executive/canonical-role-registry.json",
  manifestRelativePath: "canonical-role-registry.json"
});

function git(args, encoding = "utf8") {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding, stdio: ["ignore", "pipe", "pipe" ] });
}

function gitAt(root, args, { encoding = "utf8", input } = {}) {
  return execFileSync("git", args, {
    cwd: root,
    encoding,
    input,
    stdio: [input === undefined ? "ignore" : "pipe", "pipe", "pipe"]
  });
}

function assertSafeGitPath(relativePath) {
  assert.equal(typeof relativePath, "string");
  assert.match(relativePath, /^[A-Za-z0-9._/-]+$/);
  assert.equal(path.posix.normalize(relativePath), relativePath);
  assert.equal(relativePath.startsWith("../"), false);
  assert.equal(relativePath.startsWith("/"), false);
}

async function readCanonicalGitCheckoutIdentity(root, binding) {
  assert.ok(binding && typeof binding === "object" && !Array.isArray(binding));
  assert.match(binding.commit, /^[a-f0-9]{40}$/);
  assert.match(binding.tree, /^[a-f0-9]{40}$/);
  assertSafeGitPath(binding.repositoryRelativePath);
  assert.equal(gitAt(root, ["rev-parse", `${binding.commit}^{tree}`]).trim(), binding.tree, "readiness identity commit/tree drift");

  const checkoutPath = path.resolve(root, ...binding.repositoryRelativePath.split("/"));
  const relativeCheckoutPath = path.relative(root, checkoutPath);
  assert.equal(relativeCheckoutPath.startsWith(".."), false, "readiness identity path escapes repository");
  assert.equal(path.isAbsolute(relativeCheckoutPath), false, "readiness identity path escapes repository");
  const info = await lstat(checkoutPath);
  assert.equal(info.isFile(), true, "readiness identity checkout path is not a file");
  assert.equal(info.isSymbolicLink(), false, "readiness identity checkout path is a symbolic link");

  const canonicalObjectId = gitAt(root, ["rev-parse", `${binding.commit}:${binding.repositoryRelativePath}`]).trim();
  assert.match(canonicalObjectId, /^[a-f0-9]{40}$/);
  assert.equal(gitAt(root, ["cat-file", "-t", canonicalObjectId]).trim(), "blob");
  const canonicalBytes = gitAt(root, ["cat-file", "blob", canonicalObjectId], { encoding: "buffer" });
  const checkoutBytes = await readFile(checkoutPath);
  const cleanFilteredObjectId = gitAt(root, ["hash-object", `--path=${binding.repositoryRelativePath}`, "--stdin"], { input: checkoutBytes }).trim();
  return Object.freeze({
    canonicalObjectId,
    canonicalBytes,
    cleanFilteredObjectId,
    checkoutMatchesCanonical: cleanFilteredObjectId === canonicalObjectId,
    bytes: canonicalBytes.length,
    sha256: sha256Bytes(canonicalBytes)
  });
}

export async function verifyCanonicalGitCheckoutIdentity(root, binding) {
  const identity = await readCanonicalGitCheckoutIdentity(root, binding);
  assert.equal(identity.checkoutMatchesCanonical, true, "readiness identity checkout content differs from sealed canonical Git blob");
  return identity;
}

export async function verifyCanonicalRoleRegistryReadinessIdentity(manifest, {
  root = repositoryRoot,
  binding = CANONICAL_ROLE_REGISTRY_READINESS_BINDING
} = {}) {
  assert.deepEqual(binding, CANONICAL_ROLE_REGISTRY_READINESS_BINDING, "canonical role-registry readiness binding drift");
  assert.ok(manifest && typeof manifest === "object" && !Array.isArray(manifest), "malformed readiness manifest");
  assert.equal(manifest.manifestType, "SYNTHETIC_EXECUTIVE_QUALIFICATION_READINESS");
  assert.equal(manifest.status, "KATHERINE_SYNTHETIC_EXECUTIVE_QUALIFICATION_READY");
  assert.equal(manifest.implementationVersion, "1.12.25");
  assert.ok(Array.isArray(manifest.artifactInventory), "malformed readiness artifact inventory");
  const entries = manifest.artifactInventory.filter((item) => item?.relativePath === binding.manifestRelativePath);
  assert.equal(entries.length, 1, "readiness manifest must bind exactly one canonical role registry");
  const [entry] = entries;
  assert.equal(Number.isSafeInteger(entry.bytes) && entry.bytes >= 0, true, "malformed canonical role-registry byte count");
  assert.match(entry.sha256, /^[a-f0-9]{64}$/, "malformed canonical role-registry SHA-256");
  const identity = await verifyCanonicalGitCheckoutIdentity(root, binding);
  assert.equal(identity.bytes, entry.bytes, "stale canonical role-registry byte count");
  assert.equal(identity.sha256, entry.sha256, "stale canonical role-registry SHA-256");
  return identity;
}

async function verifyCurrentOrCanonicalSealedArtifact(repositoryRelativePath, expected, label) {
  assertSafeGitPath(repositoryRelativePath);
  const filePath = path.resolve(repositoryRoot, ...repositoryRelativePath.split("/"));
  const info = await lstat(filePath);
  assert.equal(info.isFile(), true, `${label} must be a regular file`);
  assert.equal(info.isSymbolicLink(), false, `${label} cannot be a symbolic link`);
  const bytes = await readFile(filePath);
  if (bytes.length === expected.bytes && sha256Bytes(bytes) === expected.sha256) return;
  const identity = await readCanonicalGitCheckoutIdentity(repositoryRoot, {
    commit: CANONICAL_ROLE_REGISTRY_READINESS_BINDING.commit,
    tree: CANONICAL_ROLE_REGISTRY_READINESS_BINDING.tree,
    repositoryRelativePath
  });
  assert.equal(identity.checkoutMatchesCanonical, true, `${label} content differs from sealed canonical Git blob`);
  assert.equal(identity.bytes, expected.bytes, `${label} canonical byte count differs`);
  assert.equal(identity.sha256, expected.sha256, `${label} canonical hash differs`);
}

function assertNoHiddenKeys(value) {
  const forbidden = /^(expectedDiagnosis|correctRepair|expectedLesson|nextPrompt|expectedClassification|expectedMemoryMatch|expectedTaskScope|expectedRegressionRequirements|expectedAuthority|passFailRubric)$/i;
  if (Array.isArray(value)) { for (const item of value) assertNoHiddenKeys(item); return; }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) { assert.doesNotMatch(key, forbidden, `agent-visible field ${key} exposes evaluator control`); assertNoHiddenKeys(item); }
}

async function verifyArtifactInventory(manifest) {
  let compatibilityRelease = null;
  assert.equal(new Set(manifest.artifactInventory.map((item) => item.relativePath)).size, manifest.artifactInventory.length);
  await verifyCanonicalRoleRegistryReadinessIdentity(manifest);
  for (const item of manifest.artifactInventory) {
    assert.equal(item.relativePath.startsWith("evaluator-controls/"), false, "readiness manifest exposes evaluator-control path");
    if (item.relativePath === CANONICAL_ROLE_REGISTRY_READINESS_BINDING.manifestRelativePath) continue;
    const filePath = path.join(qualificationRoot, item.relativePath);
    const info = await lstat(filePath); assert.equal(info.isFile(), true); assert.equal(info.isSymbolicLink(), false);
    const bytes = await readFile(filePath);
    if (bytes.length === item.bytes && sha256Bytes(bytes) === item.sha256) continue;
    const binding = {
      commit: CANONICAL_ROLE_REGISTRY_READINESS_BINDING.commit,
      tree: CANONICAL_ROLE_REGISTRY_READINESS_BINDING.tree,
      repositoryRelativePath: `qualification/synthetic-executive/${item.relativePath}`
    };
    const identity = await readCanonicalGitCheckoutIdentity(repositoryRoot, binding);
    if (identity.bytes === item.bytes && identity.sha256 === item.sha256 && identity.checkoutMatchesCanonical) continue;
    assert.ok([
      "README.md", "schemas/executive-action.schema.json", "schemas/memory-retrieval-receipt.schema.json",
      "scripts/action-broker.mjs", "scripts/episode-sandbox.mjs", "scripts/lifecycle-integrity-controller.mjs",
      "scripts/memory-store.mjs", "scripts/readiness-qualification.mjs", "scripts/run-qualification.mjs", "scripts/verify-readiness.mjs"
    ].includes(item.relativePath), `historical readiness artifact changed: ${item.relativePath}`);
    compatibilityRelease ||= (await import("../calibration/scripts/structured-output-compatibility-release.mjs")).loadStructuredOutputCompatibilityRelease({ validateCurrentArtifacts: false });
    assert.equal(compatibilityRelease.startingTooling.commit, STRUCTURED_OUTPUT_COMPATIBILITY_PARENT);
    const historicalBytes = git(["show", `${STRUCTURED_OUTPUT_COMPATIBILITY_PARENT}:qualification/synthetic-executive/${item.relativePath}`], "buffer");
    assert.equal(historicalBytes.length, item.bytes);
    assert.equal(sha256Bytes(historicalBytes), item.sha256);
  }
  assert.equal(sha256Json(manifest.artifactInventory), manifest.artifactAggregateHash);
}

async function verifyEpisodes(manifest) {
  const publicManifest = await readJson(path.join(qualificationRoot, "episodes", "public-manifest.json"));
  assert.equal(publicManifest.manifestHash, manifest.publicEpisodeManifestHash);
  assert.equal(publicManifest.episodes.length, 12);
  assert.deepEqual(publicManifest.episodes.map((episode) => episode.episodeId), ["KE-P7-H01", "KE-P7-H02", "KE-P7-H03", "KE-P7-H04", "KE-P7-H05", "KE-P7-H06", "KE-P7-A01", "KE-P7-A02", "KE-P7-A03", "KE-P7-N01", "KE-P7-N02", "KE-P7-N03"]);
  assertNoHiddenKeys(publicManifest);
  for (const episode of publicManifest.episodes) {
    const episodePath = path.join(qualificationRoot, "episodes", "visible", episode.episodeId, "episode.json");
    const persisted = await readJson(episodePath); assert.equal(persisted.episodeHash, episode.episodeHash); assertNoHiddenKeys(persisted);
    const sandbox = new EpisodeEvidenceSandbox({ episodeRoot: path.dirname(episodePath), episodeManifest: persisted });
    for (const artifact of persisted.visibleArtifactInventory) {
      const repositoryRelativePath = path.posix.join("qualification/synthetic-executive/episodes/visible", episode.episodeId, artifact.relativePath);
      await verifyCurrentOrCanonicalSealedArtifact(repositoryRelativePath, artifact, `${episode.episodeId} visible artifact ${artifact.artifactId}`);
    }
    assert.equal((await sandbox.attemptPathAccess("../../../evaluator-controls/controls.json")).permitted, false);
    if (episode.cohort === "HISTORICAL") {
      assert.equal(persisted.knowledgeCutoffIdentity.tree, git(["show", "-s", "--format=%T", persisted.knowledgeCutoffIdentity.commit]).trim());
      for (const artifact of persisted.visibleArtifactInventory.filter((item) => item.sourceKind === "KNOWLEDGE_CUTOFF_GIT_BLOB")) {
        const sourcePath = artifact.relativePath.replace(/^artifacts\/source\//, "");
        const sourceBytes = git(["show", `${persisted.knowledgeCutoffIdentity.commit}:${sourcePath}`], "buffer");
        assert.equal(sha256Bytes(sourceBytes), artifact.sha256, `${episode.episodeId} source snapshot differs from cutoff`);
      }
    }
  }
}

function productRecords() {
  return git(["ls-tree", "-r", "--full-tree", PRODUCT_COMMIT]).split(/\r?\n/).filter(Boolean).map((line) => {
    const match = line.match(/^(\d{6})\s+(blob|commit)\s+([a-f0-9]{40})\t(.+)$/); assert.ok(match);
    return { mode: match[1], type: match[2], gitObjectId: match[3], relativePath: match[4] };
  });
}

async function verifyConsentProhibition(manifest) {
  const prohibition = await readJson(path.join(qualificationRoot, "consent-execution-prohibition.json"));
  assert.equal(prohibition.prohibitionHash, manifest.consentExecutionProhibitionHash);
  const identity = await verifyCanonicalGitCheckoutIdentity(repositoryRoot, {
    commit: CANONICAL_ROLE_REGISTRY_READINESS_BINDING.commit,
    tree: CANONICAL_ROLE_REGISTRY_READINESS_BINDING.tree,
    repositoryRelativePath: PRESERVED_CONSENT_RELATIVE_PATH
  });
  const consent = JSON.parse(identity.canonicalBytes);
  assert.equal(identity.sha256, prohibition.sourceConsentFileSha256); assert.equal(consent.status, "AUTHORIZED_NOT_CONSUMED");
  assert.equal(consent.consentHash, prohibition.sourceConsentHash);
  const targets = [
    path.join(repositoryRoot, "benchmarks", "blind-object-v2-results", ".reservations", `${prohibition.proposedInvocationId}.json`),
    path.join(repositoryRoot, "benchmarks", "blind-object-v2-results", prohibition.proposedResultRootName),
    path.join(repositoryRoot, "benchmarks", "blind-object-v2-results", `.${prohibition.proposedInvocationId}.invocation-manifest.json`)
  ];
  for (const target of targets) await assert.rejects(lstat(target), (error) => error?.code === "ENOENT");
}

export async function verifyReadiness() {
  const manifest = await readJson(path.join(qualificationRoot, "readiness-manifest.json"));
  const core = structuredClone(manifest); delete core.readinessManifestHash; assert.equal(sha256Json(core), manifest.readinessManifestHash);
  assert.equal(manifest.status, "KATHERINE_SYNTHETIC_EXECUTIVE_QUALIFICATION_READY");
  await verifyArtifactInventory(manifest); await verifyEpisodes(manifest); await verifyConsentProhibition(manifest);
  const [budget, evaluatorCommitment, accessDenial, costProof, harnessProof, terminology] = await Promise.all([
    readJson(path.join(qualificationRoot, "qualification-budget-profile.json")), readJson(path.join(qualificationRoot, "evaluator-control-aggregate.json")),
    readJson(path.join(qualificationRoot, "proofs", "evaluator-control-access-denial-proof.json")), readJson(path.join(qualificationRoot, "proofs", "cost-governor-proof.json")),
    readJson(path.join(qualificationRoot, "proofs", "deterministic-harness-proof.json")), runTerminologyCheck()
  ]);
  validateBudgetProfile(budget); assert.equal(budget.profileHash, manifest.budgetProfileHash);
  assert.equal(evaluatorCommitment.evaluatorControlAggregateHash, manifest.evaluatorControlAggregateHash);
  assert.equal(accessDenial.proofHash, manifest.accessDenialProofHash); assert.equal(accessDenial.successfulAccessCount, 0);
  assert.equal(costProof.proofHash, manifest.costGovernorProofHash); assert.equal(costProof.results.every((item) => item.passed), true); assert.equal(costProof.realModelCalls, 0); assert.equal(costProof.networkAttempts, 0);
  assert.equal(harnessProof.proofHash, manifest.deterministicHarnessProofHash); assert.equal(harnessProof.caseCount, 12); assert.equal(harnessProof.realModelCalls, 0); assert.equal(harnessProof.providerCalls, 0);
  assert.equal(terminology.proofHash, manifest.terminologyProofHash);

  const records = productRecords();
  const productPackage = JSON.parse(git(["show", `${PRODUCT_COMMIT}:package.json`]));
  const product = validateProductRuntimeSnapshot({ head: PRODUCT_COMMIT, branch: "", status: "", records, version: productPackage.version });
  assert.equal(product.trackedEntryCount, 666); assert.equal(product.productRuntimeManifestHash, manifest.immutableProduct.runtimeManifestHash);
  const executionRelease = JSON.parse(await readFile(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "execution-release.json"), "utf8"));
  assert.equal(manifest.phase7cFrozenAggregate, "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699");
  assert.equal(executionRelease.phase7cFrozenAggregate, manifest.phase7cFrozenAggregate);
  assert.equal(manifest.aiQualificationPerformed, false); assert.equal(manifest.modelCalls, 0); assert.equal(manifest.providerCalls, 0); assert.equal(manifest.productHandlerInvocations, 0); assert.equal(manifest.networkAttempts, 0);
  return Object.freeze({ status: manifest.status, readinessManifestHash: manifest.readinessManifestHash, artifactCount: manifest.artifactInventory.length, episodeCount: 12, productTrackedEntryCount: product.trackedEntryCount, productRuntimeManifestHash: product.productRuntimeManifestHash, frozenAggregateHash: manifest.phase7cFrozenAggregate });
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) process.stdout.write(`${JSON.stringify(await verifyReadiness())}\n`);
