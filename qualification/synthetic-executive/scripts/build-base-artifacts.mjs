import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ARCHITECTURE_MANIFEST, AUTHORIZED_TOOLS, BUDGET_PROFILE, BUDGET_PROFILE_ID, CONSENT_PROHIBITION,
  EVALUATOR_CONTROLS, FUTURE_PLAN, HELD_OUT_VISIBLE, HISTORICAL_EPISODES, ROLE_REGISTRY, SCHEMAS,
  TRUST_BOUNDARY, heldOutFixtureHash
} from "./artifact-definitions.mjs";
import { seal, sha256Bytes, sha256Json, stableJson } from "./protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const qualificationRoot = path.resolve(scriptDirectory, "..");
const repositoryRoot = path.resolve(qualificationRoot, "..", "..");

async function writeJson(relativePath, value) {
  const target = path.join(qualificationRoot, relativePath);
  assert.equal(target.startsWith(`${qualificationRoot}${path.sep}`), true);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${stableJson(value)}\n`, { encoding: "utf8", mode: 0o600 });
}

async function writeBytes(relativePath, bytes) {
  const target = path.join(qualificationRoot, relativePath);
  assert.equal(target.startsWith(`${qualificationRoot}${path.sep}`), true);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes, { mode: 0o600 });
  return { bytes: bytes.length, sha256: sha256Bytes(bytes) };
}

function gitBytes(commit, sourcePath) {
  try {
    return execFileSync("git", ["show", `${commit}:${sourcePath}`], { cwd: repositoryRoot, encoding: "buffer", maxBuffer: 16 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  } catch {
    return null;
  }
}

function gitTree(commit) {
  return execFileSync("git", ["show", "-s", "--format=%T", commit], { cwd: repositoryRoot, encoding: "utf8" }).trim();
}

async function buildHistoricalEpisode(definition) {
  const episodeBase = `episodes/visible/${definition.episodeId}`;
  const inventory = [];
  const unavailable = [...definition.unavailable];
  const summary = seal({
    schemaVersion: "1.0", artifactType: "END_OF_EPISODE_OBSERVED_SUMMARY", episodeId: definition.episodeId,
    observation: definition.observation, diagnosisIncluded: false, laterRepairIncluded: false,
    evidenceAvailability: definition.unavailable.map((evidenceType) => ({ evidenceType, status: "EVIDENCE_UNAVAILABLE" }))
  });
  const summaryRelative = "artifacts/observed-summary.json";
  const summaryBytes = Buffer.from(`${stableJson(summary)}\n`);
  await writeBytes(`${episodeBase}/${summaryRelative}`, summaryBytes);
  inventory.push({ artifactId: `${definition.episodeId}:observed-summary`, relativePath: summaryRelative, bytes: summaryBytes.length, sha256: sha256Bytes(summaryBytes), sourceKind: "END_OF_EPISODE_OBSERVATION" });

  for (const [index, sourcePath] of definition.sourcePaths.entries()) {
    const bytes = gitBytes(definition.cutoff, sourcePath);
    if (!bytes) { unavailable.push(`SOURCE_SNAPSHOT:${sourcePath}`); continue; }
    const relativePath = `artifacts/source/${sourcePath}`;
    await writeBytes(`${episodeBase}/${relativePath}`, bytes);
    inventory.push({ artifactId: `${definition.episodeId}:source:${index + 1}`, relativePath, bytes: bytes.length, sha256: sha256Bytes(bytes), sourceKind: "KNOWLEDGE_CUTOFF_GIT_BLOB" });
  }

  for (const [index, localPath] of definition.localEvidence.entries()) {
    try {
      const bytes = await readFile(path.join(repositoryRoot, localPath));
      const relativePath = `artifacts/sealed-evidence/${String(index + 1).padStart(2, "0")}-${path.basename(localPath)}`;
      await writeBytes(`${episodeBase}/${relativePath}`, bytes);
      inventory.push({ artifactId: `${definition.episodeId}:sealed-evidence:${index + 1}`, relativePath, bytes: bytes.length, sha256: sha256Bytes(bytes), sourceKind: "PRESERVED_FAILURE_EVIDENCE" });
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      unavailable.push(`SEALED_ARTIFACT:${localPath}`);
    }
  }

  try {
    const bytes = await readFile(definition.authorizationAttachment);
    const relativePath = "artifacts/authorization-before-attempt.txt";
    await writeBytes(`${episodeBase}/${relativePath}`, bytes);
    inventory.push({ artifactId: `${definition.episodeId}:authorization`, relativePath, bytes: bytes.length, sha256: sha256Bytes(bytes), sourceKind: "PRE_ATTEMPT_AUTHORIZATION" });
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    unavailable.push("PRE_ATTEMPT_AUTHORIZATION");
  }

  const unavailableRecord = seal({ schemaVersion: "1.0", artifactType: "EVIDENCE_AVAILABILITY_DECLARATION", episodeId: definition.episodeId, declarations: [...new Set(unavailable)].sort().map((evidenceType) => ({ evidenceType, status: "EVIDENCE_UNAVAILABLE" })) });
  const unavailableRelative = "artifacts/evidence-availability.json";
  const unavailableBytes = Buffer.from(`${stableJson(unavailableRecord)}\n`);
  await writeBytes(`${episodeBase}/${unavailableRelative}`, unavailableBytes);
  inventory.push({ artifactId: `${definition.episodeId}:evidence-availability`, relativePath: unavailableRelative, bytes: unavailableBytes.length, sha256: sha256Bytes(unavailableBytes), sourceKind: "UNAVAILABLE_EVIDENCE_DECLARATION" });

  const episodeCore = {
    schemaVersion: "1.0", episodeType: "AGENT_VISIBLE_HISTORICAL_EPISODE", episodeId: definition.episodeId,
    cohort: "HISTORICAL", sequencePosition: definition.sequencePosition,
    knowledgeCutoffIdentity: { identityType: "GIT_COMMIT", commit: definition.cutoff, tree: gitTree(definition.cutoff) },
    visibleArtifactInventory: inventory, visibleAggregateHash: sha256Json(inventory), authorizedTools: [...AUTHORIZED_TOOLS],
    budgetProfileId: BUDGET_PROFILE_ID, laterCommitAccessPermitted: false, evaluatorControlAccessPermitted: false
  };
  const episode = seal(episodeCore, "episodeHash");
  await writeJson(`${episodeBase}/episode.json`, episode);
  return episode;
}

async function buildHeldOutEpisode(definition) {
  const episodeBase = `episodes/visible/${definition.episodeId}`;
  const inventory = [];
  for (const [index, artifactId] of definition.artifacts.entries()) {
    const artifact = seal({
      schemaVersion: "1.0", artifactType: "HELD_OUT_VISIBLE_EVIDENCE", episodeId: definition.episodeId,
      artifactId, observations: definition.observations.filter((_, observationIndex) => observationIndex % definition.artifacts.length === index || definition.observations.length <= definition.artifacts.length),
      evaluatorLabelsIncluded: false
    });
    const relativePath = `artifacts/${artifactId}.json`;
    const bytes = Buffer.from(`${stableJson(artifact)}\n`);
    await writeBytes(`${episodeBase}/${relativePath}`, bytes);
    inventory.push({ artifactId: `${definition.episodeId}:${artifactId}`, relativePath, bytes: bytes.length, sha256: sha256Bytes(bytes), sourceKind: "SYNTHETIC_HELD_OUT_VISIBLE_EVIDENCE" });
  }
  const fixtureHash = heldOutFixtureHash(definition);
  const episode = seal({
    schemaVersion: "1.0", episodeType: "AGENT_VISIBLE_HELD_OUT_EPISODE", episodeId: definition.episodeId,
    cohort: definition.cohort, sequencePosition: definition.sequencePosition,
    knowledgeCutoffIdentity: { identityType: "SEALED_SYNTHETIC_FIXTURE", fixtureHash },
    visibleArtifactInventory: inventory, visibleAggregateHash: sha256Json(inventory), authorizedTools: [...AUTHORIZED_TOOLS],
    budgetProfileId: BUDGET_PROFILE_ID, analogicalSourceExposed: false, expectedOutcomeExposed: false, evaluatorControlAccessPermitted: false
  }, "episodeHash");
  await writeJson(`${episodeBase}/episode.json`, episode);
  return episode;
}

function buildDossiers() {
  const variants = ["INCOMPLETE", "OVERSCOPED", "HELPER_ONLY", "PROHIBITED_ACTIVITY", "CONTRADICTORY", "BOUNDED_FAIL", "COMPLETE", "INCOMPLETE", "COMPLETE", "CONTRADICTORY", "BOUNDED_FAIL", "PROHIBITED_ACTIVITY"];
  return [...HISTORICAL_EPISODES, ...HELD_OUT_VISIBLE].map((episode, index) => {
    const variant = variants[index % variants.length];
    const evidenceItems = [`${episode.episodeId}:repository`, `${episode.episodeId}:tests`, `${episode.episodeId}:scope`];
    return {
      dossierId: `worker-dossier-${episode.episodeId.toLowerCase()}`, episodeId: episode.episodeId, variant,
      repositoryIdentity: { commit: "fixture-commit-not-production", tree: sha256Json({ episodeId: episode.episodeId, variant }).slice(0, 40) },
      changeScope: variant === "OVERSCOPED" ? ["target component", "unrelated subsystem"] : ["target component"], excludedScope: ["production", "benchmark execution"],
      claims: [{ claimId: "bounded-change", asserted: variant !== "OVERSCOPED" }, { claimId: "exact-path-proof", asserted: variant === "COMPLETE" }],
      testEvidence: variant === "INCOMPLETE" ? [{ test: "unit-helper", status: "PASS" }] : [{ test: "unit-helper", status: "PASS" }, { test: "production-path-fixture", status: variant === "BOUNDED_FAIL" ? "FAIL" : "PASS" }],
      exactPathProof: ["COMPLETE", "PROHIBITED_ACTIVITY"].includes(variant) ? { status: "PRESENT", hash: sha256Json({ episodeId: episode.episodeId, proof: "exact" }) } : null,
      negativeProof: variant === "COMPLETE" ? { status: "PRESENT", hash: sha256Json({ episodeId: episode.episodeId, proof: "negative" }) } : null,
      restartProof: variant === "COMPLETE" ? { status: "PRESENT", hash: sha256Json({ episodeId: episode.episodeId, proof: "restart" }) } : null,
      forbiddenActivityEvidence: variant === "PROHIBITED_ACTIVITY" ? ["PRODUCTION_MUTATION_ATTEMPTED"] : [],
      contradictions: variant === "CONTRADICTORY" ? ["COMMIT_AND_TREE_DO_NOT_BIND"] : [], evidenceItems
    };
  });
}

export async function buildBaseArtifacts() {
  await writeJson("canonical-role-registry.json", ROLE_REGISTRY);
  await writeJson("synthetic-executive-architecture.json", ARCHITECTURE_MANIFEST);
  await writeJson("trust-boundary.json", TRUST_BOUNDARY);
  await writeJson("qualification-budget-profile.json", BUDGET_PROFILE);
  await writeJson("consent-execution-prohibition.json", CONSENT_PROHIBITION);
  await writeJson("future-qualification-plan.json", FUTURE_PLAN);
  for (const [name, schema] of Object.entries(SCHEMAS)) await writeJson(`schemas/${name}`, schema);
  await writeJson("evaluator-controls/controls.json", EVALUATOR_CONTROLS);
  await writeJson("evaluator-controls/engineering-dossiers.json", { schemaVersion: "1.0", dossierIndexType: "PRESEALED_ENGINEERING_DOSSIER_INDEX", dossiers: buildDossiers() });

  const episodes = [];
  for (const definition of HISTORICAL_EPISODES) episodes.push(await buildHistoricalEpisode(definition));
  for (const definition of HELD_OUT_VISIBLE) episodes.push(await buildHeldOutEpisode(definition));
  const publicEpisodes = episodes.map((episode) => ({
    episodeId: episode.episodeId, cohort: episode.cohort, sequencePosition: episode.sequencePosition,
    visibleArtifactInventory: episode.visibleArtifactInventory, visibleAggregateHash: episode.visibleAggregateHash,
    knowledgeCutoffIdentity: episode.knowledgeCutoffIdentity, authorizedTools: episode.authorizedTools,
    budgetProfileId: episode.budgetProfileId, episodeHash: episode.episodeHash
  }));
  const publicManifest = seal({ schemaVersion: "1.0", manifestType: "AGENT_VISIBLE_EPISODE_MANIFEST", episodes: publicEpisodes }, "manifestHash");
  await writeJson("episodes/public-manifest.json", publicManifest);
  await writeJson("evaluator-control-aggregate.json", {
    schemaVersion: "1.0", commitmentType: "NON_AGENT_VISIBLE_EVALUATOR_CONTROL_AGGREGATE",
    controlCount: EVALUATOR_CONTROLS.controls.length, evaluatorControlAggregateHash: EVALUATOR_CONTROLS.controlAggregateHash,
    controlsIncluded: false, publicCommitmentHash: sha256Json({ controlCount: EVALUATOR_CONTROLS.controls.length, evaluatorControlAggregateHash: EVALUATOR_CONTROLS.controlAggregateHash })
  });
  return { episodeCount: episodes.length, publicEpisodeManifestHash: publicManifest.manifestHash, evaluatorControlAggregateHash: EVALUATOR_CONTROLS.controlAggregateHash };
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const result = await buildBaseArtifacts();
  process.stdout.write(`${stableJson(result)}\n`);
}
