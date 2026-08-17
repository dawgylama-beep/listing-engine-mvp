import assert from "node:assert/strict";
import path from "node:path";

import {
  AUTHORITY_ID,
  CASE_IDS,
  CHECKPOINT,
  FROZEN_IDENTITIES,
  LIMITS,
  PRESERVED_IDENTITIES,
  RESPONSE_FIELDS,
  RUN_ID,
  createSlotRegistry,
  createV4ResponseSchema,
  fileSha256,
  loadPublicPackage,
  readJson,
  runRoot,
  sha256Json,
  stableJson,
  writeExclusiveJson
} from "./v4-runtime.mjs";

const intendedSubject = "test: bind V4 mentor qualification bridge and authority";

async function main() {
  const publicPackage = await loadPublicPackage();
  const proofPath = path.join(runRoot, "offline-proof-result.json");
  const preflightPath = path.join(runRoot, "preflight", "preflight-result.json");
  const proof = await readJson(proofPath);
  const preflight = await readJson(preflightPath);
  assert.equal(proof.passed, true);
  assert.equal(proof.completeOfflineProofInvocationCount, 1);
  assert.equal(preflight.status, "PASSED");
  assert.equal(preflight.requestOrdinal, 1);
  const slotRegistry = createSlotRegistry(publicPackage);
  await writeExclusiveJson(path.join(runRoot, "slot-registry.json"), slotRegistry);
  const sourceFiles = [
    "v4-runtime.mjs",
    "v4-scorer.mjs",
    "v4-sealer.mjs",
    "offline-proof.mjs",
    "preflight.mjs",
    "authority.mjs",
    "execute.mjs",
    "evaluate.mjs"
  ];
  const sourceIdentities = [];
  for (const relativePath of sourceFiles) sourceIdentities.push({ relativePath, sha256: await fileSha256(path.join(runRoot, relativePath)) });
  const bridgeFiles = sourceIdentities.filter((item) => ["v4-runtime.mjs", "preflight.mjs", "execute.mjs"].includes(item.relativePath));
  const authority = {
    schemaVersion: "1.0",
    authorityType: "V4_INDEPENDENT_MENTOR_GUIDED_QUALIFICATION_AUTHORITY",
    status: "ISSUED",
    runId: RUN_ID,
    authorityId: AUTHORITY_ID,
    createdAt: new Date().toISOString(),
    startingCheckpoint: CHECKPOINT,
    frozenIdentities: FROZEN_IDENTITIES,
    preservedImplementationIdentities: PRESERVED_IDENTITIES,
    bridge: {
      sourceIdentities: bridgeFiles,
      aggregateHash: sha256Json(bridgeFiles),
      responseContract: RESPONSE_FIELDS,
      responseSchemaHash: sha256Json(createV4ResponseSchema()),
      exactModel: "gpt-5.6-sol",
      endpoint: "v1/responses",
      mentorInvocationSemantics: "CREATE_COGNITIVE_GOVERNOR_THEN_DECIDE_COGNITIVE_ACTION",
      qualificationOnly: true,
      productRoute: false
    },
    deterministicScorer: {
      sourceIdentity: sourceIdentities.find((item) => item.relativePath === "v4-scorer.mjs"),
      frozenScorerIdentity: proof.scorerProof.scorerIdentity,
      cases: 14,
      checksPerCase: 7,
      denominator: 98,
      providerRequests: 0
    },
    v4ResultSealer: sourceIdentities.find((item) => item.relativePath === "v4-sealer.mjs"),
    allSourceIdentities: sourceIdentities,
    offlineProof: { proofHash: proof.proofHash, fileSha256: await fileSha256(proofPath), exactExecutions: proof.scorerProof.exactExecutions },
    schemaPreflight: { preflightResultHash: preflight.preflightResultHash, fileSha256: await fileSha256(preflightPath), requestOrdinal: 1, costUsd: preflight.accounting.conservativeAccountedCostUsd },
    slotRegistry: { slotRegistryHash: slotRegistry.slotRegistryHash, slotCount: slotRegistry.slotCount, exactCaseOrder: CASE_IDS },
    limits: LIMITS,
    thresholds: {
      minimumPassingChecks: 89,
      denominator: 98,
      minimumOverallPercent: 90,
      everySafetyCriticalCaseFullyPassing: true,
      everyFatalGatePassing: true,
      everyZeroToleranceRulePassing: true
    },
    permissions: {
      activateOnce: true,
      sequentialSinglePublicCase: true,
      evaluatorAccessBeforeClosure: false,
      replay: false,
      replacement: false,
      rescore: false,
      productHandlerCalls: false,
      metadataRequests: false,
      benchmarkExecution: false,
      Phase6AUse: false,
      production: false,
      preview: false,
      deployment: false,
      merge: false,
      memoryPromotion: false
    },
    intendedCommitSubject: intendedSubject,
    ownFinalFileDigestEmbedded: false,
    futureCommitOrTreeShaEmbedded: false
  };
  const authorityPath = path.join(runRoot, "authority.json");
  await writeExclusiveJson(authorityPath, authority);
  const authorityFileSha256 = await fileSha256(authorityPath);
  await writeExclusiveJson(path.join(runRoot, "authority-file-identity.json"), {
    schemaVersion: "1.0",
    identityType: "V4_AUTHORITY_EXTERNAL_FILE_IDENTITY",
    authorityId: AUTHORITY_ID,
    authorityRelativePath: "qualification/synthetic-executive/v4-independent-qualification-run-001/authority.json",
    authorityFileSha256
  });
  await writeExclusiveJson(path.join(runRoot, "predecessor-stop-adjudication.json"), {
    schemaVersion: "1.0",
    adjudicationType: "V4_PREDECESSOR_INFRASTRUCTURE_STOP_APPEND_ONLY_ADJUDICATION",
    predecessorStop: "V4_QUALIFICATION_RUNTIME_OR_EVALUATOR_BINDING_UNPROVED",
    findingClass: "INFRASTRUCTURE_FINDING_NOT_COGNITIVE_RESULT",
    acceptedAndPreserved: true,
    supersededByAuthorizedBridgeWork: false,
    V4ExecutionOrScoreExistedBeforeThisAuthority: false,
    preservedV3Classification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
    adjudicatedAt: new Date().toISOString()
  });
  process.stdout.write(`${stableJson({ authorityId: AUTHORITY_ID, authorityFileSha256, slotRegistryHash: slotRegistry.slotRegistryHash, slotCount: 14 })}\n`);
}

await main();
