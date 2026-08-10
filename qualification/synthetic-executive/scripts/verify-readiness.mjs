import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateProductRuntimeSnapshot } from "../../../benchmarks/blind-object-v2/scripts/execution-profile.mjs";
import { defaultFreezeRoot, loadPublicFreeze } from "../../../benchmarks/blind-object-v2/scripts/execution-store.mjs";
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

function git(args, encoding = "utf8") {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding, stdio: ["ignore", "pipe", "pipe" ] });
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
  for (const item of manifest.artifactInventory) {
    assert.equal(item.relativePath.startsWith("evaluator-controls/"), false, "readiness manifest exposes evaluator-control path");
    const filePath = path.join(qualificationRoot, item.relativePath);
    const info = await lstat(filePath); assert.equal(info.isFile(), true); assert.equal(info.isSymbolicLink(), false);
    const bytes = await readFile(filePath);
    if (bytes.length === item.bytes && sha256Bytes(bytes) === item.sha256) continue;
    assert.ok(["scripts/action-broker.mjs", "scripts/verify-readiness.mjs"].includes(item.relativePath), `historical readiness artifact changed: ${item.relativePath}`);
    compatibilityRelease ||= (await import("../calibration/scripts/structured-output-compatibility-release.mjs")).loadStructuredOutputCompatibilityRelease();
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
    for (const artifact of persisted.visibleArtifactInventory) await sandbox.readArtifact(artifact.artifactId);
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
  const consentPath = path.join(repositoryRoot, "benchmarks", "blind-object-v2", "consent", `${CONSENT_ID}.json`);
  const bytes = await readFile(consentPath); const consent = JSON.parse(bytes);
  assert.equal(sha256Bytes(bytes), prohibition.sourceConsentFileSha256); assert.equal(consent.status, "AUTHORIZED_NOT_CONSUMED");
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
  const freeze = await loadPublicFreeze(defaultFreezeRoot); assert.equal(freeze.manifest.completeFrozenAggregateHash, manifest.phase7cFrozenAggregate);
  assert.equal(manifest.aiQualificationPerformed, false); assert.equal(manifest.modelCalls, 0); assert.equal(manifest.providerCalls, 0); assert.equal(manifest.productHandlerInvocations, 0); assert.equal(manifest.networkAttempts, 0);
  return Object.freeze({ status: manifest.status, readinessManifestHash: manifest.readinessManifestHash, artifactCount: manifest.artifactInventory.length, episodeCount: 12, productTrackedEntryCount: product.trackedEntryCount, productRuntimeManifestHash: product.productRuntimeManifestHash, frozenAggregateHash: freeze.manifest.completeFrozenAggregateHash });
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) process.stdout.write(`${JSON.stringify(await verifyReadiness())}\n`);
