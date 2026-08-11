import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EpisodeEvidenceSandbox } from "../../scripts/episode-sandbox.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const v2CorpusRoot = path.resolve(scriptDirectory, "..");
export const V2_CASE_ID = /^KE-V2-C(?:0[1-9]|1[0-4])$/;

export async function materializeV2ProviderVisibleCase(caseId, { corpusRoot = v2CorpusRoot } = {}) {
  assert.match(caseId, V2_CASE_ID, "V2 case identity is not in the sealed fourteen-case namespace");
  const casesRoot = path.resolve(corpusRoot, "cases");
  const caseRoot = path.resolve(casesRoot, caseId);
  assert.equal(caseRoot.startsWith(`${casesRoot}${path.sep}`), true, "V2 case path escapes the corpus");
  const visibleRoot = path.join(caseRoot, "visible");
  const episode = JSON.parse(await readFile(path.join(visibleRoot, "episode.json"), "utf8"));
  assert.equal(episode.episodeId, caseId, "provider-visible episode identity differs");
  assert.equal(episode.visibleArtifactInventory.every((item) => item.relativePath.startsWith("artifacts/")), true,
    "provider-visible inventory may reference only its visible artifacts directory");
  const sandbox = new EpisodeEvidenceSandbox({ episodeRoot: visibleRoot, episodeManifest: episode });
  const materialization = await sandbox.materializeAllVisibleArtifacts();
  return Object.freeze({ episode: Object.freeze(episode), materialization, sandbox });
}

export function providerVisibleAssemblerSurface() {
  return Object.freeze({
    acceptedCaseIdPattern: V2_CASE_ID.source,
    readableCaseRelativeRoots: ["visible/episode.json", "visible/artifacts/"],
    deniedCaseRelativeRoots: ["memory/", "worker/", "evaluator/", "constraints/", "scoring/", "dispatch/", "manifest.json"],
    hiddenEvaluatorMaterialReachable: false,
    crossCaseMaterialReachable: false
  });
}
