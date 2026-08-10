import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IMMUTABLE_SUBJECT, QUALIFICATION_LIMITS, QUALIFICATION_ROUTE, SEALED_BINDINGS, qualificationRouteBindings, repositoryRoot } from "./qualification-route.mjs";
import { sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const qualificationRoot = path.resolve(scriptDirectory, "..", "..");

export const RELEASE_ARTIFACT_PATHS = Object.freeze([
  "PRODUCT_ROADMAP.md",
  "package.json",
  "qualification/synthetic-executive/README.md",
  "qualification/synthetic-executive/scripts/run-qualification.mjs",
  "qualification/synthetic-executive/calibration/scripts/structured-output-compatibility-release.mjs",
  "qualification/synthetic-executive/qualification-real-route/continuation-policy.json",
  "qualification/synthetic-executive/qualification-real-route/schemas/blind-qualification-authority.schema.json",
  "qualification/synthetic-executive/qualification-real-route/schemas/qualification-ledger-entry.schema.json",
  "qualification/synthetic-executive/qualification-real-route/scripts/qualification-authority.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/qualification-execution-ledger.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/qualification-release.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs",
  "qualification/synthetic-executive/scripts/verify-readiness.mjs",
  "scripts/verify-release-version.mjs",
  "tests/milestone-2c1-canonical-customer-evidence.ps1",
  "tests/synthetic-executive-blind-qualification-real-route.test.mjs",
  "tests/synthetic-executive-zero-metadata-real-route.test.mjs"
]);

export async function verifySealedQualificationInputs() {
  const [readiness, cases, scoring, budget, calibrationResult] = await Promise.all([
    readFile(path.join(qualificationRoot, "readiness-manifest.json")).then(JSON.parse),
    readFile(path.join(qualificationRoot, "episodes", "public-manifest.json")).then(JSON.parse),
    readFile(path.join(qualificationRoot, "evaluator-control-aggregate.json")).then(JSON.parse),
    readFile(path.join(qualificationRoot, "qualification-budget-profile.json")).then(JSON.parse),
    readFile(path.join(repositoryRoot, "qualification-results", "real-route-structured-output-calibration-214dd955c244d1b1", "calibration-result.json")).then(JSON.parse).catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error))
  ]);
  assert.equal(readiness.readinessManifestHash, SEALED_BINDINGS.readinessManifestHash, "READINESS_MANIFEST_HASH_DRIFT");
  assert.equal(cases.manifestHash, SEALED_BINDINGS.caseManifestHash, "CASE_MANIFEST_HASH_DRIFT");
  assert.equal(scoring.evaluatorControlAggregateHash, SEALED_BINDINGS.scoringControlsHash, "SCORING_CONTROLS_HASH_DRIFT");
  assert.equal(budget.profileHash, SEALED_BINDINGS.budgetProfileHash, "BUDGET_PROFILE_HASH_DRIFT");
  if (calibrationResult !== null) assert.equal(calibrationResult.resultHash, SEALED_BINDINGS.calibrationResultHash, "CALIBRATION_RESULT_HASH_DRIFT");
  assert.deepEqual(cases.episodes.map((item) => item.episodeId), ["KE-P7-H01", "KE-P7-H02", "KE-P7-H03", "KE-P7-H04", "KE-P7-H05", "KE-P7-H06", "KE-P7-A01", "KE-P7-A02", "KE-P7-A03", "KE-P7-N01", "KE-P7-N02", "KE-P7-N03"]);
  return Object.freeze({ readinessManifestHash: readiness.readinessManifestHash, caseManifestHash: cases.manifestHash, scoringControlsHash: scoring.evaluatorControlAggregateHash, budgetProfileHash: budget.profileHash, calibrationResultHash: SEALED_BINDINGS.calibrationResultHash });
}

export async function buildQualificationReleaseRecord() {
  const [preservedBindings, routeBindings, artifactHashes] = await Promise.all([
    verifySealedQualificationInputs(), qualificationRouteBindings(),
    Promise.all(RELEASE_ARTIFACT_PATHS.map(async (relativePath) => ({ relativePath, sha256: sha256Bytes(await readFile(path.join(repositoryRoot, relativePath))) })))
  ]);
  const core = {
    schemaVersion: "1.0", releaseType: "KATHERINE_BLIND_QUALIFICATION_REAL_ROUTE_INTEGRATION_V1",
    releasePurpose: "QUALIFICATION_EXECUTION_ONLY", releaseState: "SEALED_TOOLING_PATCH",
    startingTooling: { commit: SEALED_BINDINGS.startingToolingCommit, tree: SEALED_BINDINGS.startingToolingTree },
    immutableCognitiveSubject: IMMUTABLE_SUBJECT, preservedBindings,
    route: { endpointClass: "RESPONSES_API", inferenceEndpoint: QUALIFICATION_ROUTE.endpoint, exactModel: QUALIFICATION_ROUTE.model, reasoningEffort: QUALIFICATION_ROUTE.reasoningEffort, store: false, metadataRequests: 0, providerTools: 0, modelTools: 0 },
    routeBindings: {
      providerProfileHash: routeBindings.providerProfileHash, safeProviderDiagnosticsContractHash: SEALED_BINDINGS.safeProviderDiagnosticsContractHash,
      canonicalExecutiveActionSchemaHash: SEALED_BINDINGS.executiveActionSourceSchemaHash,
      transmittedSchemaTemplateExactHash: routeBindings.transmittedSchemaTemplateExactHash,
      transmittedSchemaTemplateStableHash: routeBindings.transmittedSchemaTemplateStableHash,
      continuationPolicyHash: routeBindings.continuationPolicyHash, authoritySchemaHash: routeBindings.authoritySchemaHash, ledgerSchemaHash: routeBindings.ledgerSchemaHash
    },
    limits: QUALIFICATION_LIMITS,
    runtimeControls: {
      createOnlyTwelveCaseAuthority: true, immutableActionConsumptionLedger: true, providerAttemptConsumedBeforeDispatch: true,
      deterministicCostReservation: true, explicitRetrySlotRequired: true, silentReplacementForbidden: true,
      permittedCapabilities: ["QUERY_EXECUTIVE_MEMORY", "REQUEST_PRESEALED_WORKER_DOSSIER"],
      workerRestriction: "RETURN_PRESEALED_DOSSIER_ONLY", memoryBoundary: "ISOLATED_QUALIFICATION_STORE_ONLY",
      caseProgression: "SEALED_PUBLIC_MANIFEST_ORDER_ONLY", calibrationResultReusableAsQualificationEvidence: false
    },
    artifactHashes, artifactAggregateHash: sha256Json(artifactHashes),
    activityAssertions: {
      credentialAccessCount: 0, externalNetworkRequestCount: 0, metadataRequestCount: 0, inferenceRequestCount: 0,
      modelCallCount: 0, liveAuthorityCreated: false, liveCaseExecutions: 0, benchmarkExecutions: 0,
      productHandlerInvocations: 0, previewDeployments: 0, productionDeployments: 0, merges: 0
    }
  };
  return Object.freeze({ ...core, releaseHash: sha256Json(core) });
}

export function validateQualificationReleaseRecord(release) {
  assert.equal(release.schemaVersion, "1.0"); assert.equal(release.releaseType, "KATHERINE_BLIND_QUALIFICATION_REAL_ROUTE_INTEGRATION_V1");
  assert.equal(release.releasePurpose, "QUALIFICATION_EXECUTION_ONLY"); assert.deepEqual(release.immutableCognitiveSubject, IMMUTABLE_SUBJECT);
  assert.deepEqual(release.startingTooling, { commit: SEALED_BINDINGS.startingToolingCommit, tree: SEALED_BINDINGS.startingToolingTree });
  const core = structuredClone(release); delete core.releaseHash; assert.equal(sha256Json(core), release.releaseHash, "qualification tooling release hash differs");
  return release;
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${stableJson(await buildQualificationReleaseRecord())}\n`);
}
