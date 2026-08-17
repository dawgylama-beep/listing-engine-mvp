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
const predecessorCostUsd = 0.02161;

async function sourceIdentity(relativePath) {
  return Object.freeze({ relativePath, sha256: await fileSha256(path.join(runRoot, relativePath)) });
}

async function main() {
  const publicPackage = await loadPublicPackage();
  const proofPath = path.join(runRoot, "offline-proof-result.json");
  const predecessorFailurePath = path.join(runRoot, "preflight", "preflight-failure.json");
  const predecessorRequestPath = path.join(runRoot, "preflight", "request-envelope.json");
  const predecessorRawPath = path.join(runRoot, "preflight", "raw-provider-response.json");
  const successorResultPath = path.join(runRoot, "preflight-output-ceiling-successor", "preflight-result.json");
  const successorRequestPath = path.join(runRoot, "preflight-output-ceiling-successor", "request-envelope.json");
  const successorRawPath = path.join(runRoot, "preflight-output-ceiling-successor", "raw-provider-response.json");
  const successorParsedPath = path.join(runRoot, "preflight-output-ceiling-successor", "parsed-structured-response.json");
  const differentialPath = path.join(runRoot, "preflight-output-ceiling-successor", "normalized-request-differential.json");
  const inventoryPath = path.join(runRoot, "preflight-output-ceiling-successor", "starting-inventory-snapshots.json");
  const [proof, predecessorFailure, successor, differential, inventory] = await Promise.all([
    readJson(proofPath),
    readJson(predecessorFailurePath),
    readJson(successorResultPath),
    readJson(differentialPath),
    readJson(inventoryPath)
  ]);

  assert.equal(proof.passed, true);
  assert.equal(proof.completeOfflineProofInvocationCount, 1);
  assert.equal(proof.proofHash, "3ab428c0c04f9d8133d98a92033e78fcbc6970870e3e1a4dd5c4b20ba9cd5b74");
  assert.equal(await fileSha256(proofPath), "986e8d13f7d8c779a44eefb6ccaddcda2e4fed38b3aa5d6eec948a191233223d");
  assert.equal(proof.scorerProof.exactExecutions, 280);
  assert.equal(proof.scorerProof.negativeEscapes, 0);
  assert.equal(proof.scorerProof.validBaselineFailures, 0);
  assert.equal(proof.scorerProof.incompleteRubricCases, 0);
  assert.equal(proof.scorerProof.scorerIdentity, "bac02c95e000f84f235515926fc5b9c088d39722ecbb9fbecf11218811e2afb6");
  assert.equal(proof.mentorEquivalence.guidanceHash, "c04738579fdc4a0c9782509a4119743bd36c311c16de60b0d736a39b4dde7f1d");

  assert.equal(predecessorFailure.status, "FAILED");
  assert.equal(predecessorFailure.requestOrdinal, 1);
  assert.equal(predecessorFailure.errorCode, "PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS");
  assert.equal(await fileSha256(predecessorRequestPath), "1874b67d116ac2524eced5e91861a28d41e48c74e89fab40d751fbf85b179576");
  assert.equal(await fileSha256(predecessorRawPath), "84b3ef1974de66597b09f9194d85d04e885f630fa29042d209b9f68d3502f9e8");

  assert.equal(successor.status, "PASSED");
  assert.equal(successor.requestOrdinal, 2);
  assert.equal(successor.finalPreflightRequestAcrossCompleteChain, true);
  assert.equal(successor.httpStatus, 200);
  assert.equal(successor.responseStatus, "completed");
  assert.equal(successor.modelId, "gpt-5.6-sol");
  assert.equal(successor.responseFieldCount, 23);
  assert.equal(successor.missingFieldCount, 0);
  assert.equal(successor.unexpectedFieldCount, 0);
  assert.equal(successor.invalidTypeCount, 0);
  assert.equal(successor.rawEnvelopeTruncationCount, 0);
  assert.equal(successor.cumulativePreflightAccounting.requests, 2);
  assert.equal(successor.cumulativePreflightAccounting.retries, 0);
  assert.equal(successor.cumulativePreflightAccounting.schemaCorrections, 0);
  assert.equal(successor.cumulativePreflightAccounting.predecessorCostUsd, predecessorCostUsd);
  assert.equal(await fileSha256(successorRequestPath), successor.requestHash);
  assert.equal(await fileSha256(successorRawPath), successor.rawResponseSha256);
  assert.equal(await fileSha256(successorParsedPath), successor.parsedResponseSha256);
  assert.equal(differential.passed, true);
  assert.equal(differential.schemaCorrections, 0);
  assert.deepEqual(differential.normalizedSemanticDifferences, [{ path: "$.max_output_tokens", predecessor: 500, successor: 2000 }]);
  assert.equal(inventory.snapshotsMatchExactly, true);
  assert.equal(inventory.snapshots.length, 2);
  assert.equal(inventory.snapshots[0].identity, "aca4fe06642e0b73736ccf491f63db7062786feba59542f2ae664c01ddf552d7");
  assert.equal(inventory.snapshots[0].count, inventory.snapshots[1].count);
  assert.equal(inventory.snapshots[0].totalBytes, inventory.snapshots[1].totalBytes);
  assert.equal(inventory.snapshots[0].identity, inventory.snapshots[1].identity);
  assert.deepEqual(inventory.snapshots[0].files, inventory.snapshots[1].files);

  const slotRegistry = createSlotRegistry(publicPackage);
  await writeExclusiveJson(path.join(runRoot, "slot-registry.json"), slotRegistry);
  assert.equal(slotRegistry.slotRegistryHash, "e59bcb2216102c1a7655e6846fb78d69f02fd869b04f09645749d2bcb2dc8b5f");

  const sourceFiles = [
    "v4-runtime.mjs",
    "v4-scorer.mjs",
    "v4-sealer.mjs",
    "offline-proof.mjs",
    "preflight.mjs",
    "preflight-successor.mjs",
    "authority.mjs",
    "authority-successor.mjs",
    "execute.mjs",
    "execute-successor.mjs",
    "evaluate.mjs"
  ];
  const sourceIdentities = [];
  for (const relativePath of sourceFiles) sourceIdentities.push(await sourceIdentity(relativePath));
  const runtimeIdentity = sourceIdentities.find((item) => item.relativePath === "v4-runtime.mjs");
  const scorerIdentity = sourceIdentities.find((item) => item.relativePath === "v4-scorer.mjs");
  const sealerIdentity = sourceIdentities.find((item) => item.relativePath === "v4-sealer.mjs");
  const executionIdentity = sourceIdentities.find((item) => item.relativePath === "execute-successor.mjs");
  const evaluationIdentity = sourceIdentities.find((item) => item.relativePath === "evaluate.mjs");
  assert.equal(runtimeIdentity.sha256, "8d2e3cc5dc03f39370d99075743fa6b7f730b5ae301b6f17cd8f13956fe7e8ca");
  assert.equal(scorerIdentity.sha256, "23034a5ebe8c273c7653d205db315ced50583b08b39f747ffe7c26fc88dde6c9");
  assert.equal(sealerIdentity.sha256, "c3a9ba77d1f9d6592c0866d0fb9877aa9934b917952100097f44c0d574306b56");
  assert.equal(sha256Json(createV4ResponseSchema()), "64108d6de3e4c7ead94929eb1d02462d7a3e4e27caec9a71c64a3dca787c1a44");

  const authority = {
    schemaVersion: "1.0",
    authorityType: "V4_INDEPENDENT_MENTOR_GUIDED_QUALIFICATION_AUTHORITY",
    status: "ISSUED",
    runId: RUN_ID,
    authorityId: AUTHORITY_ID,
    createdAt: new Date().toISOString(),
    startingCheckpoint: CHECKPOINT,
    publicationRequirements: {
      branch: "refactor/beta-evidence-pipeline",
      originStartingHead: CHECKPOINT.commit,
      ordinaryNonForcePushesAuthorizedBeforeExecution: 1,
      exactRemoteRef: "refs/heads/refactor/beta-evidence-pipeline",
      requireLocalTrackingAndDirectRemoteEqualityBeforeExecution: true
    },
    frozenIdentities: FROZEN_IDENTITIES,
    preservedImplementationIdentities: PRESERVED_IDENTITIES,
    phase6APreservedOpaqueIdentity: {
      memberCount: 85,
      totalBytes: 72299353,
      inventorySha256: "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f",
      pathSetSha256: "d2edc95cbc9cc727a5adeaccffde68763cc5831356c4d4ec371741b6da269581",
      invocationManifestSha256: "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466",
      readsAuthorized: false,
      executionsAuthorized: false,
      stagingAuthorized: false,
      modificationsAuthorized: false
    },
    bridge: {
      runtimeSourceIdentity: runtimeIdentity,
      sourceIdentities: sourceIdentities.filter((item) => ["v4-runtime.mjs", "preflight.mjs", "preflight-successor.mjs", "execute.mjs", "execute-successor.mjs"].includes(item.relativePath)),
      responseContract: RESPONSE_FIELDS,
      responseSchemaHash: sha256Json(createV4ResponseSchema()),
      exactModel: "gpt-5.6-sol",
      endpoint: "v1/responses",
      mentorInvocationSemantics: "CREATE_COGNITIVE_GOVERNOR_THEN_DECIDE_COGNITIVE_ACTION",
      mentorEquivalenceGuidanceHash: proof.mentorEquivalence.guidanceHash,
      qualificationOnly: true,
      productRoute: false
    },
    deterministicScorer: {
      sourceIdentity: scorerIdentity,
      frozenScorerIdentity: proof.scorerProof.scorerIdentity,
      cases: 14,
      checksPerCase: 7,
      denominator: 98,
      providerRequests: 0
    },
    v4ResultSealer: sealerIdentity,
    execution: { entryPoint: executionIdentity.relativePath, entryPointSha256: executionIdentity.sha256, exactInvocationCount: 1 },
    evaluation: { entryPoint: evaluationIdentity.relativePath, entryPointSha256: evaluationIdentity.sha256, exactInvocationCount: 1 },
    allSourceIdentities: sourceIdentities,
    offlineProof: {
      proofHash: proof.proofHash,
      fileSha256: await fileSha256(proofPath),
      exactExecutions: proof.scorerProof.exactExecutions,
      exactInvocationCount: proof.completeOfflineProofInvocationCount,
      rerunAuthorized: false
    },
    startingInventory: {
      evidenceFileSha256: await fileSha256(inventoryPath),
      stableSnapshotCount: 2,
      memberCount: 14,
      totalBytes: 178203,
      inventoryIdentity: inventory.snapshots[0].identity
    },
    schemaPreflights: {
      cumulativeRequests: 2,
      retries: 0,
      schemaCorrections: 0,
      predecessor: {
        status: "FAILED",
        infrastructureFailure: "PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS",
        requestOrdinal: 1,
        requestSha256: await fileSha256(predecessorRequestPath),
        requestBytes: 6869,
        rawResponseSha256: await fileSha256(predecessorRawPath),
        rawResponseBytes: 11667,
        failureRecordSha256: await fileSha256(predecessorFailurePath),
        providerResponseId: "resp_02bb3603c0d66004016a8258c72f04819fbbd1df358fe67678",
        model: "gpt-5.6-sol",
        maximumOutputTokens: 500,
        costUsd: predecessorCostUsd,
        preservedAppendOnly: true
      },
      successor: {
        status: successor.status,
        requestOrdinal: successor.requestOrdinal,
        resultHash: successor.preflightResultHash,
        resultFileSha256: await fileSha256(successorResultPath),
        requestSha256: successor.requestHash,
        requestBytes: successor.requestByteCount,
        rawResponseSha256: successor.rawResponseSha256,
        rawResponseBytes: successor.rawResponseByteCount,
        parsedResponseSha256: successor.parsedResponseSha256,
        parsedResponseBytes: successor.parsedResponseByteCount,
        providerResponseId: successor.providerResponseId,
        model: successor.modelId,
        maximumOutputTokens: 2000,
        costUsd: successor.accounting.conservativeAccountedCostUsd,
        differentialFileSha256: await fileSha256(differentialPath),
        differentialHash: differential.differentialHash
      },
      cumulativeCostUsd: successor.cumulativePreflightAccounting.totalCostUsd
    },
    slotRegistry: { slotRegistryHash: slotRegistry.slotRegistryHash, slotCount: slotRegistry.slotCount, exactCaseOrder: CASE_IDS },
    limits: { ...LIMITS, alreadyConsumedPreflightCostUsd: successor.cumulativePreflightAccounting.totalCostUsd },
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
  await writeExclusiveJson(path.join(runRoot, "predecessor-stop-adjudication.json"), seal({
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
  }, "adjudicationHash"));
  process.stdout.write(`${stableJson({ authorityId: AUTHORITY_ID, authorityFileSha256, slotRegistryHash: slotRegistry.slotRegistryHash, slotCount: 14, cumulativePreflightCostUsd: successor.cumulativePreflightAccounting.totalCostUsd, executionEntryPointSha256: executionIdentity.sha256 })}\n`);
}

await main();
