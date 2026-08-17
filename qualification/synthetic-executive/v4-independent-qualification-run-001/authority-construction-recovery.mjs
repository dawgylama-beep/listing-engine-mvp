import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AUTHORITY_ID,
  fileSha256,
  readJson,
  runRoot,
  seal,
  stableJson,
  writeExclusiveJson
} from "./v4-runtime.mjs";

const authorityPath = path.join(runRoot, "authority.json");
const identityPath = path.join(runRoot, "authority-file-identity.json");
const slotRegistryPath = path.join(runRoot, "slot-registry.json");
const adjudicationPath = path.join(runRoot, "predecessor-stop-adjudication.json");

async function main() {
  const [authority, identity, slotRegistry] = await Promise.all([
    readJson(authorityPath),
    readJson(identityPath),
    readJson(slotRegistryPath)
  ]);
  assert.equal(authority.authorityId, AUTHORITY_ID);
  assert.equal(await fileSha256(authorityPath), identity.authorityFileSha256);
  assert.equal(identity.authorityFileSha256, "14ed7d5f4a50971f77bfb06ca5bd13c2525f6d3e5e9e9205594cb320ab2b6f82");
  assert.equal(slotRegistry.slotRegistryHash, authority.slotRegistry.slotRegistryHash);
  assert.equal(slotRegistry.slotRegistryHash, "e59bcb2216102c1a7655e6846fb78d69f02fd869b04f09645749d2bcb2dc8b5f");
  const boundWriter = authority.allSourceIdentities.find((item) => item.relativePath === "authority-successor.mjs");
  assert.equal(boundWriter.sha256, await fileSha256(path.join(runRoot, "authority-successor.mjs")));
  const successor = await readJson(path.join(runRoot, "preflight-output-ceiling-successor", "preflight-result.json"));
  const adjudication = seal({
    schemaVersion: "1.0",
    adjudicationType: "V4_PREFLIGHT_OUTPUT_CEILING_PREDECESSOR_STOP_APPEND_ONLY_ADJUDICATION",
    predecessorClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V4_INDEPENDENT_QUALIFICATION_INVALID_NO_COGNITIVE_RESULT",
    predecessorFailure: "PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS",
    findingClass: "INFRASTRUCTURE_FINDING_NOT_COGNITIVE_RESULT",
    acceptedAndPreserved: true,
    predecessorEvidenceModified: false,
    schemaCorrectionAuthorizedOrUsed: false,
    V4ExecutionOrScoreExistedBeforeThisAuthority: false,
    successorPreflightResultHash: successor.preflightResultHash,
    preservedV3Classification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
    adjudicatedAt: new Date().toISOString()
  }, "adjudicationHash");
  await writeExclusiveJson(adjudicationPath, adjudication);
  const recoverySourcePath = fileURLToPath(import.meta.url);
  const closure = seal({
    schemaVersion: "1.0",
    closureType: "V4_AUTHORITY_CONSTRUCTION_APPEND_ONLY_RECOVERY_CLOSURE",
    status: "COMPLETED_WITHOUT_AUTHORITY_REWRITE",
    localWriterFailure: "ReferenceError: seal is not defined",
    failedWriterProviderRequests: 0,
    failedWriterRemoteWrites: 0,
    authorityRewrites: 0,
    authorityFileSha256: identity.authorityFileSha256,
    authorityWriterSourceSha256: boundWriter.sha256,
    recoverySourceSha256: await fileSha256(recoverySourcePath),
    slotRegistryHash: slotRegistry.slotRegistryHash,
    adjudicationHash: adjudication.adjudicationHash,
    adjudicationFileSha256: await fileSha256(adjudicationPath),
    closedAt: new Date().toISOString()
  }, "constructionClosureHash");
  await writeExclusiveJson(path.join(runRoot, "authority-construction-closure.json"), closure);
  process.stdout.write(`${stableJson({ status: closure.status, authorityFileSha256: closure.authorityFileSha256, slotRegistryHash: closure.slotRegistryHash, adjudicationHash: closure.adjudicationHash, constructionClosureHash: closure.constructionClosureHash })}\n`);
}

await main();
