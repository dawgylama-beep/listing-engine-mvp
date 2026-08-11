import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalExecutiveActionSchema, registryActionFixtures } from "../../scripts/executive-action-registry.mjs";
import { readJson, sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";
import { GENERAL_CONTINUATION_POLICY } from "./general-continuation-policy.mjs";
import { SEALED_BINDINGS, qualificationRouteBindings, repositoryRoot } from "./qualification-route.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const releasePath = path.resolve(scriptDirectory, "..", "general-continuation-contract-release.json");

export const GENERAL_CONTINUATION_RELEASE_BINDINGS = Object.freeze({
  productVersion: "1.12.28",
  startingHead: "3aaf85a6eb681c96d26923a6d8bf420b6dce75da",
  startingTree: "6b6f55e5ed86739ae621342d78bd4ff3f1b60dbe",
  integrationReleaseHash: "63f77aa2df69805d52c820f675ef1c06432c20213683f004ee2a58e2c5c3daa1",
  calibrationResultHash: "5a686deab9a10c53f1a16b64dc8d4a68217b01981e890f7adee2cf3a3c08d6da",
  failedQualificationClassification: "NOT_QUALIFIED",
  failedAuthorityHash: "9a1db862fad7cb4bdf6d742f88d48a656f64ad09a6897d1c5cdc552a6554307a",
  failedRunSealHash: "ce75ace105cd5e1a4d11fbf725c916669c107923d61787e28f9939f1c7ebb982"
});

export const RELEASE_ARTIFACT_PATHS = Object.freeze([
  "PRODUCT_ROADMAP.md",
  "package-lock.json",
  "package.json",
  "public/index.html",
  "qualification/synthetic-executive/README.md",
  "qualification/synthetic-executive/qualification-real-route/general-continuation-policy.json",
  "qualification/synthetic-executive/qualification-real-route/schemas/blind-qualification-authority.schema.json",
  "qualification/synthetic-executive/qualification-real-route/schemas/broker-rejection-receipt.schema.json",
  "qualification/synthetic-executive/qualification-real-route/schemas/qualification-pre-dispatch-accounting.schema.json",
  "qualification/synthetic-executive/qualification-real-route/schemas/qualification-provider-usage.schema.json",
  "qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-contract-release.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-policy.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/qualification-authority.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs",
  "qualification/synthetic-executive/schemas/executive-action-v1.1.schema.json",
  "qualification/synthetic-executive/schemas/memory-retrieval-receipt.schema.json",
  "qualification/synthetic-executive/scripts/action-broker.mjs",
  "qualification/synthetic-executive/scripts/episode-sandbox.mjs",
  "qualification/synthetic-executive/scripts/executive-action-registry.mjs",
  "qualification/synthetic-executive/scripts/lifecycle-integrity-controller.mjs",
  "qualification/synthetic-executive/scripts/memory-store.mjs",
  "qualification/synthetic-executive/scripts/readiness-qualification.mjs",
  "qualification/synthetic-executive/scripts/run-qualification.mjs",
  "qualification/synthetic-executive/scripts/verify-readiness.mjs",
  "scripts/verify-release-version.mjs",
  "server.ps1",
  "tests/all-four-workflow-compact-evidence-static.ps1",
  "tests/ask-market-edge-instruction-static.ps1",
  "tests/barcode-cross-brand-retail-static.ps1",
  "tests/beta-polish-static.ps1",
  "tests/brand-location-static.ps1",
  "tests/browser/canonical-evidence.spec.mjs",
  "tests/buyer-experience-mobile-static.ps1",
  "tests/canonical-identity-location-static.ps1",
  "tests/collectible-auction-recovery-static.ps1",
  "tests/currency-precision-static.ps1",
  "tests/domain-directed-search-stable-ending-static.ps1",
  "tests/exact-match-cautious-buy-static.ps1",
  "tests/global-help-instructions-static.ps1",
  "tests/item-type-firewall-static.ps1",
  "tests/maximum-price-calibration-static.ps1",
  "tests/milestone-2c1-canonical-customer-evidence.ps1",
  "tests/mobile-report-length-static.ps1",
  "tests/mobile-ui-static.ps1",
  "tests/photo-multi-upload-static.ps1",
  "tests/prices-found-delivered-cost-static.ps1",
  "tests/pricing-quality-calibration-static.ps1",
  "tests/purpose-workflows-static.ps1",
  "tests/query-execution-session-isolation-static.ps1",
  "tests/release-version-surface.test.mjs",
  "tests/research-evidence-visibility-static.ps1",
  "tests/retail-evidence-isolation-static.ps1",
  "tests/retail-purchase-context-static.ps1",
  "tests/retail-recovery-static.ps1",
  "tests/safari-load-failure-static.ps1",
  "tests/search-diagnostics-zero-evidence-static.ps1",
  "tests/serper-google-acquisition-static.ps1",
  "tests/serper-query-integrity-static.ps1",
  "tests/synthetic-executive-blind-qualification-real-route.test.mjs",
  "tests/synthetic-executive-zero-metadata-real-route.test.mjs",
  "tests/transaction-evidence-firewall-static.ps1",
  "tests/valuation-evidence-static.ps1"
]);

const canonicalTextSha256 = (bytes) => sha256Bytes(Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"), "utf8"));

async function verifyPreservedInputs() {
  const [packageManifest, integrationRelease, publicManifest, readiness, scoring, budget, canonicalSchema, generalPolicy] = await Promise.all([
    readJson(path.join(repositoryRoot, "package.json")),
    readJson(path.join(repositoryRoot, "qualification", "synthetic-executive", "qualification-real-route", "qualification-real-route-release.json")),
    readJson(path.join(repositoryRoot, "qualification", "synthetic-executive", "episodes", "public-manifest.json")),
    readJson(path.join(repositoryRoot, "qualification", "synthetic-executive", "readiness-manifest.json")),
    readJson(path.join(repositoryRoot, "qualification", "synthetic-executive", "evaluator-control-aggregate.json")),
    readJson(path.join(repositoryRoot, "qualification", "synthetic-executive", "qualification-budget-profile.json")),
    readJson(path.join(repositoryRoot, "qualification", "synthetic-executive", "schemas", "executive-action-v1.1.schema.json")),
    readJson(path.join(repositoryRoot, "qualification", "synthetic-executive", "qualification-real-route", "general-continuation-policy.json"))
  ]);
  assert.equal(packageManifest.version, GENERAL_CONTINUATION_RELEASE_BINDINGS.productVersion);
  assert.equal(integrationRelease.releaseHash, GENERAL_CONTINUATION_RELEASE_BINDINGS.integrationReleaseHash);
  assert.equal(publicManifest.manifestHash, SEALED_BINDINGS.caseManifestHash);
  assert.equal(readiness.readinessManifestHash, SEALED_BINDINGS.readinessManifestHash);
  assert.equal(scoring.evaluatorControlAggregateHash, SEALED_BINDINGS.scoringControlsHash);
  assert.equal(budget.profileHash, SEALED_BINDINGS.budgetProfileHash);
  assert.equal(stableJson(canonicalSchema), stableJson(canonicalExecutiveActionSchema()));
  assert.equal(stableJson(generalPolicy), stableJson(GENERAL_CONTINUATION_POLICY));
  return Object.freeze({
    readinessManifestHash: readiness.readinessManifestHash,
    caseManifestHash: publicManifest.manifestHash,
    scoringControlsHash: scoring.evaluatorControlAggregateHash,
    budgetProfileHash: budget.profileHash
  });
}

export async function buildGeneralContinuationContractRelease() {
  const [preservedInputs, routeBindings, artifactHashes] = await Promise.all([
    verifyPreservedInputs(),
    qualificationRouteBindings(),
    Promise.all(RELEASE_ARTIFACT_PATHS.map(async (relativePath) => ({ relativePath, sha256: canonicalTextSha256(await readFile(path.join(repositoryRoot, relativePath))) })))
  ]);
  const core = {
    schemaVersion: "1.0",
    releaseType: "KATHERINE_GENERAL_EXECUTIVE_CONTINUATION_POLICY_AND_QUALIFICATION_CONTRACT_ALIGNMENT_V1",
    releaseState: "SEALED_TOOLING_RELEASE",
    version: GENERAL_CONTINUATION_RELEASE_BINDINGS.productVersion,
    startingIdentity: { commit: GENERAL_CONTINUATION_RELEASE_BINDINGS.startingHead, tree: GENERAL_CONTINUATION_RELEASE_BINDINGS.startingTree },
    preservedReleaseIdentity: {
      integrationReleaseHash: GENERAL_CONTINUATION_RELEASE_BINDINGS.integrationReleaseHash,
      calibrationResultHash: GENERAL_CONTINUATION_RELEASE_BINDINGS.calibrationResultHash,
      failedQualificationClassification: GENERAL_CONTINUATION_RELEASE_BINDINGS.failedQualificationClassification,
      failedAuthorityHash: GENERAL_CONTINUATION_RELEASE_BINDINGS.failedAuthorityHash,
      failedRunSealHash: GENERAL_CONTINUATION_RELEASE_BINDINGS.failedRunSealHash,
      ...preservedInputs
    },
    contractBindings: {
      actionRegistryHash: routeBindings.actionRegistryHash,
      registeredStateActionPairCount: registryActionFixtures().length,
      canonicalExecutiveActionSchemaHash: routeBindings.canonicalExecutiveActionSchemaHash,
      generalContinuationPolicyHash: routeBindings.generalContinuationPolicyHash,
      transmittedSchemaTemplateExactHash: routeBindings.transmittedSchemaTemplateExactHash,
      transmittedSchemaTemplateStableHash: routeBindings.transmittedSchemaTemplateStableHash,
      safeProviderDiagnosticsContractHash: SEALED_BINDINGS.safeProviderDiagnosticsContractHash
    },
    behavior: {
      terminalEvidenceSufficiencyScope: "RECONSTRUCTION_OR_CLASSIFICATION_ONLY",
      providerTransmitsSuccessor: false,
      brokerDerivesSuccessor: true,
      allVisibleArtifactsMaterializedInManifestOrder: true,
      oversizedMaterializationStopsBeforeDispatch: true,
      emptyMemoryClassification: "VALID_EMPTY",
      rejectedActionRuleAndPathPersisted: true,
      preDispatchReservationSeparatedFromReturnedUsage: true
    },
    artifactHashes,
    artifactAggregateHash: sha256Json(artifactHashes),
    activityAssertions: {
      credentialAccessCount: 0, metadataRequestCount: 0, providerRequestCount: 0, modelCallCount: 0,
      qualificationAuthoritiesCreated: 0, qualificationCasesExecuted: 0, failedQualificationReplays: 0,
      durableMemoryPromotions: 0, benchmarkExecutions: 0, productHandlerInvocations: 0,
      previewDeployments: 0, productionDeployments: 0, merges: 0
    },
    claims: {
      qualification: false, cognition: false, learning: false, autonomy: false, productionReadiness: false,
      exactClaim: "KATHERINE_SYNTHETIC_EXECUTIVE_GENERAL_CONTINUATION_CONTRACT_READY"
    }
  };
  return Object.freeze({ ...core, releaseHash: sha256Json(core) });
}

export function validateGeneralContinuationContractRelease(record) {
  assert.equal(record.schemaVersion, "1.0");
  assert.equal(record.releaseType, "KATHERINE_GENERAL_EXECUTIVE_CONTINUATION_POLICY_AND_QUALIFICATION_CONTRACT_ALIGNMENT_V1");
  assert.equal(record.version, "1.12.28");
  assert.equal(record.preservedReleaseIdentity.failedQualificationClassification, "NOT_QUALIFIED");
  assert.equal(record.contractBindings.registeredStateActionPairCount, registryActionFixtures().length);
  assert.equal(record.behavior.providerTransmitsSuccessor, false); assert.equal(record.behavior.brokerDerivesSuccessor, true);
  assert.equal(record.activityAssertions.providerRequestCount, 0); assert.equal(record.activityAssertions.qualificationAuthoritiesCreated, 0);
  assert.equal(record.claims.exactClaim, "KATHERINE_SYNTHETIC_EXECUTIVE_GENERAL_CONTINUATION_CONTRACT_READY");
  for (const artifact of record.artifactHashes) {
    assert.equal(artifact.relativePath.startsWith("benchmarks/blind-object-v1-results/"), false, "Phase 6A path entered the release manifest");
    assert.match(artifact.sha256, /^[a-f0-9]{64}$/);
  }
  const core = structuredClone(record); delete core.releaseHash;
  assert.equal(sha256Json(core), record.releaseHash, "general continuation release hash differs");
  return record;
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const release = await buildGeneralContinuationContractRelease();
  if (process.argv.includes("--write")) await writeFile(releasePath, `${stableJson(release)}\n`, "utf8");
  else process.stdout.write(`${stableJson(release)}\n`);
}
