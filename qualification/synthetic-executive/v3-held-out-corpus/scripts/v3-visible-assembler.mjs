import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { EpisodeEvidenceSandbox } from "../../scripts/episode-sandbox.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const v3CorpusRoot = path.resolve(scriptDirectory, "..");
export const V3_CASE_ID = /^KE-V3-C(?:0[1-9]|1[0-4])$/;

export async function materializeV3ProviderVisibleCase(caseId, { corpusRoot = v3CorpusRoot } = {}) {
  assert.match(caseId, V3_CASE_ID, "V3 case identity is not in the sealed fourteen-case namespace");
  const casesRoot = path.resolve(corpusRoot, "cases");
  const caseRoot = path.resolve(casesRoot, caseId);
  assert.equal(caseRoot.startsWith(`${casesRoot}${path.sep}`), true, "V3 case path escapes the corpus");
  const visibleRoot = path.join(caseRoot, "visible");
  const episode = JSON.parse(await readFile(path.join(visibleRoot, "episode.json"), "utf8"));
  assert.equal(episode.episodeId, caseId, "provider-visible episode identity differs");
  assert.equal(episode.visibleArtifactInventory.every((item) => item.relativePath.startsWith("artifacts/")), true,
    "provider-visible inventory may reference only its visible artifacts directory");
  const sandbox = new EpisodeEvidenceSandbox({ episodeRoot: visibleRoot, episodeManifest: episode });
  const materialization = await sandbox.materializeAllVisibleArtifacts();
  return Object.freeze({ episode: Object.freeze(episode), materialization, sandbox });
}

export function v3ProviderVisibleAssemblerSurface() {
  return Object.freeze({
    acceptedCaseIdPattern: V3_CASE_ID.source,
    readableCaseRelativeRoots: ["visible/episode.json", "visible/artifacts/"],
    deniedCaseRelativeRoots: ["memory/", "worker/", "evaluator/", "constraints/", "scoring/", "dispatch/", "manifest.json"],
    deniedCorpusRelativeRoots: ["private-case-specification.json", "proofs/", "corpus-seal.json"],
    hiddenEvaluatorMaterialReachable: false,
    crossCaseMaterialReachable: false
  });
}
