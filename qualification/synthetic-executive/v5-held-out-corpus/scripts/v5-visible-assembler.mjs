import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EngineeringWorkerAdapter } from "../../scripts/engineering-worker-adapter.mjs";
import { EpisodeEvidenceSandbox } from "../../scripts/episode-sandbox.mjs";
import { sha256Bytes, sha256Json } from "../../scripts/protocol.mjs";
import { V5_CASE_IDS, V5_CASE_ID_PATTERN } from "./v5-case-definitions.mjs";
import { absoluteFromCorpus, readJson, writeStableJson } from "./v5-package-core.mjs";

const scriptPath = fileURLToPath(import.meta.url);

function assertCaseId(caseId) {
  assert.match(caseId, V5_CASE_ID_PATTERN, "V5 case identity is outside the sealed fourteen-case namespace");
  assert.equal(V5_CASE_IDS.includes(caseId), true, "V5 case identity is not in the exact order manifest");
}

async function publicCaseManifest(caseId) {
  assertCaseId(caseId);
  const manifest = await readJson(absoluteFromCorpus("public", "cases", caseId, "manifest.json"));
  assert.equal(manifest.caseId, caseId);
  assert.deepEqual(Object.keys(manifest).sort(), ["authorizedCapabilities", "budgetProfileIdentity", "caseId", "evaluatorControlAggregateHash", "knowledgeCutoffIdentity", "order", "visibleAggregate", "visibleInventory"].sort());
  return manifest;
}

export async function materializeV5ProviderVisibleCase(caseId) {
  const manifest = await publicCaseManifest(caseId);
  const visibleRoot = absoluteFromCorpus("cases", caseId, "visible");
  const episodeManifest = Object.freeze({
    visibleArtifactInventory: manifest.visibleInventory.map((item) => ({ ...item, sourceKind: "NEW_V5_SYNTHETIC_VISIBLE_EVIDENCE" }))
  });
  const sandbox = new EpisodeEvidenceSandbox({ episodeRoot: visibleRoot, episodeManifest });
  const materialization = await sandbox.materializeAllVisibleArtifacts();
  assert.equal(materialization.canonicalArtifactOrder.every((artifactId) => artifactId.startsWith(`${caseId}:visible:`)), true);
  return Object.freeze({
    caseId,
    order: manifest.order,
    visibleAggregate: manifest.visibleAggregate,
    evaluatorControlAggregateHash: manifest.evaluatorControlAggregateHash,
    materialization,
    sandbox
  });
}

export async function attemptV5CasePathAccess(caseId, requestedPath) {
  const materialized = await materializeV5ProviderVisibleCase(caseId);
  return materialized.sandbox.attemptPathAccess(requestedPath);
}

export function v5ProviderVisibleAssemblerSurface() {
  return Object.freeze({
    acceptedCaseIdPattern: V5_CASE_ID_PATTERN.source,
    readableCaseRelativeRoots: ["visible/evidence-bundle.json", "visible/artifacts/"],
    deniedCaseRelativeRoots: ["memory/", "dossier/", "evaluator/", "scoring/", "constraints/", "dispatch/", "atomic/", "requests/"],
    deniedCorpusRelativeRoots: ["hidden/", "proofs/", "proposed/", "scripts/", "readiness-integrity-manifest.json", "v5-package-release-evidence.json"],
    hiddenEvaluatorMaterialReachable: false,
    scoringMaterialReachable: false,
    dossierReachableWithoutSealedTask: false,
    crossCaseMaterialReachable: false,
    rawFilesystemPathInterfaceExposed: false
  });
}

export async function buildV5AccessDenialProof() {
  const attempts = [];
  for (const caseId of V5_CASE_IDS) {
    const materialized = await materializeV5ProviderVisibleCase(caseId);
    assert.equal(materialized.materialization.artifactCount, 4);
    const root = absoluteFromCorpus("cases", caseId);
    const probes = [
      ["direct-path", "evaluator/control.json"],
      ["relative-traversal", "../evaluator/control.json"],
      ["absolute-path", path.join(root, "evaluator", "control.json")],
      ["globbing", "**/control.json"],
      ["directory-listing", "."],
      ["file-search", "search:evaluator"],
      ["guessed-filename", "evaluator/key.json"],
      ["symlink-substitution", "artifacts/visible-link/control.json"],
      ["junction-substitution", "artifacts/visible-junction/control.json"],
      ["manifest-inspection", "manifest.json"],
      ["dossier-interface-misuse", "dossier/manifest.json"]
    ];
    for (const [technique, requestedPath] of probes) {
      const result = await materialized.sandbox.attemptPathAccess(requestedPath);
      assert.equal(result.permitted, false, `V5_HIDDEN_ACCESS_UNEXPECTEDLY_PERMITTED:${caseId}:${technique}`);
      attempts.push({ caseId, technique, permitted: false, reasonCode: result.reasonCode, requestedPathDigest: result.requestedPathDigest });
    }
  }

  const adapter = await new EngineeringWorkerAdapter({ dossierIndexPath: absoluteFromCorpus("hidden", "dossier-index.json") }).initialize();
  let presealDenied = false;
  try { adapter.returnDossier(V5_CASE_IDS[0]); } catch (error) { presealDenied = /cannot be revealed before task sealing/.test(String(error.message)); }
  assert.equal(presealDenied, true);
  const taskHash = sha256Json({ caseId: V5_CASE_IDS[0], task: "offline interface proof" });
  const taskReceipt = adapter.sealTask({ actionType: "PROPOSE_BOUNDED_ENGINEERING_TASK", episodeId: V5_CASE_IDS[0], actionId: "V5-ACCESS-PROOF-TASK", contentHash: taskHash });
  const dossier = adapter.returnDossier(V5_CASE_IDS[0]);
  assert.equal(dossier.sealedTaskHash, taskHash);
  assert.equal(dossier.rawEvaluatorLabelsIncluded, false);
  assert.equal(Object.hasOwn(dossier, "evaluatorLabel"), false);
  return Object.freeze({
    schemaVersion: "1.0",
    proofType: "V5_PUBLIC_HIDDEN_ACCESS_DENIAL_PROOF",
    caseCount: 14,
    techniqueCountPerCase: 11,
    attemptCount: attempts.length,
    allAttemptsDenied: attempts.every((item) => item.permitted === false),
    attempts,
    symlinkAndJunctionDisposition: "DENIED_BY_LOGICAL_INVENTORY_BEFORE_FILESYSTEM_RESOLUTION",
    directoryListingPerformed: false,
    fileSearchPerformed: false,
    hiddenPathOpened: false,
    dossierPresealAccessDenied: presealDenied,
    dossierPostsealInterfaceProof: {
      receiptSha256: sha256Json(taskReceipt),
      dossierSha256: sha256Json(dossier),
      rawEvaluatorLabelsIncluded: false
    },
    providerRequestCount: 0,
    evaluatorOpened: false,
    scoreCalculated: false,
    assemblerSurfaceSha256: sha256Bytes(Buffer.from(JSON.stringify(v5ProviderVisibleAssemblerSurface())))
  });
}

export async function writeV5AccessDenialProof() {
  const proof = await buildV5AccessDenialProof();
  await writeStableJson(absoluteFromCorpus("proofs", "public-hidden-access-denial.json"), proof);
  return proof;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const proof = await writeV5AccessDenialProof();
  process.stdout.write(`${JSON.stringify({ result: "PASS", attemptCount: proof.attemptCount, allAttemptsDenied: proof.allAttemptsDenied })}\n`);
}
