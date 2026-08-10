import assert from "node:assert/strict";
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runTerminologyCheck } from "./terminology-check.mjs";
import { readJson, seal, sha256Bytes, sha256Json, stableJson } from "./protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const qualificationRoot = path.resolve(scriptDirectory, "..");

async function publicFiles(root, relative = "") {
  const entries = await readdir(path.join(root, relative), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const next = path.posix.join(relative.replaceAll("\\", "/"), entry.name);
    if (next === "readiness-manifest.json" || next.startsWith("evaluator-controls/")) continue;
    if (entry.isDirectory()) files.push(...await publicFiles(root, next));
    else if (entry.isFile()) files.push(next);
    else throw new Error(`unsupported readiness artifact type ${next}`);
  }
  return files;
}

function artifactRole(relativePath) {
  if (relativePath.startsWith("episodes/visible/")) return "AGENT_VISIBLE_EPISODE_ARTIFACT";
  if (relativePath === "episodes/public-manifest.json") return "PUBLIC_EPISODE_MANIFEST";
  if (relativePath.startsWith("schemas/")) return "QUALIFICATION_SCHEMA";
  if (relativePath.startsWith("proofs/")) return "READINESS_PROOF";
  if (relativePath.startsWith("scripts/")) return "DETERMINISTIC_RUNTIME_OR_HARNESS";
  return "READINESS_ARCHITECTURE_ARTIFACT";
}

export async function buildReadinessManifest() {
  const terminology = await runTerminologyCheck();
  await writeFile(path.join(qualificationRoot, "proofs", "terminology-proof.json"), `${stableJson(terminology)}\n`, { encoding: "utf8", mode: 0o600 });
  const paths = (await publicFiles(qualificationRoot)).sort();
  const artifactInventory = [];
  for (const relativePath of paths) {
    const bytes = await readFile(path.join(qualificationRoot, relativePath));
    artifactInventory.push({ relativePath, artifactRole: artifactRole(relativePath), bytes: bytes.length, sha256: sha256Bytes(bytes) });
  }
  const [publicEpisodes, evaluatorCommitment, accessDenial, budget, costProof, harnessProof, futurePlan, roleRegistry, architecture, trustBoundary, consentProhibition] = await Promise.all([
    readJson(path.join(qualificationRoot, "episodes", "public-manifest.json")), readJson(path.join(qualificationRoot, "evaluator-control-aggregate.json")),
    readJson(path.join(qualificationRoot, "proofs", "evaluator-control-access-denial-proof.json")), readJson(path.join(qualificationRoot, "qualification-budget-profile.json")),
    readJson(path.join(qualificationRoot, "proofs", "cost-governor-proof.json")), readJson(path.join(qualificationRoot, "proofs", "deterministic-harness-proof.json")),
    readJson(path.join(qualificationRoot, "future-qualification-plan.json")), readJson(path.join(qualificationRoot, "canonical-role-registry.json")),
    readJson(path.join(qualificationRoot, "synthetic-executive-architecture.json")), readJson(path.join(qualificationRoot, "trust-boundary.json")),
    readJson(path.join(qualificationRoot, "consent-execution-prohibition.json"))
  ]);
  assert.equal((await stat(path.join(qualificationRoot, "evaluator-controls"))).isDirectory(), true);
  const core = {
    schemaVersion: "1.0", manifestType: "SYNTHETIC_EXECUTIVE_QUALIFICATION_READINESS",
    status: "KATHERINE_SYNTHETIC_EXECUTIVE_QUALIFICATION_READY", implementationVersion: "1.12.25",
    artifactInventory, artifactAggregateHash: sha256Json(artifactInventory),
    canonicalRoleRegistryHash: roleRegistry.registryHash, architectureManifestHash: architecture.manifestHash,
    trustBoundaryDiagramHash: trustBoundary.diagramHash, consentExecutionProhibitionHash: consentProhibition.prohibitionHash,
    publicEpisodeManifestHash: publicEpisodes.manifestHash, evaluatorControlAggregateHash: evaluatorCommitment.evaluatorControlAggregateHash,
    accessDenialProofHash: accessDenial.proofHash, budgetProfileHash: budget.profileHash,
    costGovernorProofHash: costProof.proofHash, deterministicHarnessProofHash: harnessProof.proofHash,
    terminologyProofHash: terminology.proofHash, futureQualificationPlanHash: futurePlan.planHash,
    historicalEpisodeCount: 6, analogousHeldOutEpisodeCount: 3, novelHeldOutEpisodeCount: 3,
    futureQualificationCommand: futurePlan.exactCommand,
    aiQualificationPerformed: false, syntheticExecutiveQualified: false, productionExecutionAuthorized: false,
    benchmarkExecutionAuthorized: false, cognitionClaimAuthorized: false, autonomyClaimAuthorized: false,
    modelCalls: 0, providerCalls: 0, productHandlerInvocations: 0, networkAttempts: 0,
    immutableProduct: { commit: "7056eb0601dc69c5985703fea6fe665e82c6bed8", version: "1.12.13", runtimeManifestHash: "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8", trackedEntryCount: 666 },
    phase7cFrozenAggregate: "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699"
  };
  const manifest = seal(core, "readinessManifestHash");
  await writeFile(path.join(qualificationRoot, "readiness-manifest.json"), `${stableJson(manifest)}\n`, { encoding: "utf8", mode: 0o600 });
  return manifest;
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const result = await buildReadinessManifest();
  process.stdout.write(`${stableJson({ status: result.status, artifactCount: result.artifactInventory.length, readinessManifestHash: result.readinessManifestHash })}\n`);
}
