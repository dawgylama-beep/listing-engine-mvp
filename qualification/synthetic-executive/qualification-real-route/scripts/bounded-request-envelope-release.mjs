import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ACTION_REGISTRY, EXECUTIVE_CASE_STATE, canonicalExecutiveActionSchema, canonicalTransition,
  legalActionsForState, registryActionFixtures
} from "../../scripts/executive-action-registry.mjs";
import {
  BOUNDED_REQUEST_CONTRACT_HASH, REQUEST_FIELD_CONTRACTS, assertNoDuplicateLogicalBounds, finiteBoundInventory
} from "../../scripts/bounded-request-contract.mjs";
import { validateContractSchemaValue } from "../../scripts/bounded-request-contract.mjs";
import { normalizeAndValidateProviderActionCore } from "../../scripts/action-broker.mjs";
import {
  calculateWorstFutureRoute, maximumProviderActionForBranch, requestAffectingContractCoverage,
  semanticTraceProjection, traceContractEvidence
} from "../../scripts/request-envelope-contract.mjs";
import { sha256Bytes, sha256Json, stableJson } from "../../scripts/protocol.mjs";
import {
  QUALIFICATION_STRUCTURED_OUTPUT_KEYWORD_ALLOWLIST, QUALIFICATION_STRUCTURED_OUTPUT_REJECTED_KEYWORDS,
  assertQualificationStructuredOutputsSubset, createQualificationActionTransportSchema
} from "./qualification-route.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const routeRoot = path.resolve(scriptDirectory, "..");
const qualificationRoot = path.resolve(routeRoot, "..");
const repositoryRoot = path.resolve(qualificationRoot, "..", "..");
const artifactRoot = path.join(routeRoot, "bounded-request-envelope-contract");
export const boundedRequestEnvelopeReleasePath = path.join(routeRoot, "bounded-request-envelope-release.json");
export const boundedExecutiveActionSchemaPath = path.join(qualificationRoot, "schemas", "executive-action-v1.2.schema.json");

export const BOUNDED_RELEASE_BINDINGS = Object.freeze({
  version: "1.12.29",
  startingVersion: "1.12.28",
  startingHead: "387d49410bb690d31e0753eeaf29cab04ab800a0",
  startingTree: "2587bb49d6e20d70e9ad727f4fc5ffdde4715d5a",
  priorReleaseHash: "e5f7e07f487284a756eaea91f9e483ed6c4c772e99201eeecb722587f27979d3",
  priorReleaseRecordSha256: "9365559af6514794bee50f4f29b1e69b8013c92a0bf4a67e1a4f3ca92e4f4b40",
  priorActionRegistryHash: "ec5a987d701546edcfefc0e5ffdda5cb160dcb18cbc989085f8568efff63e212",
  priorProviderSchemaHash: "fac57868e54be7e39823a7515948a439025a145446f27cd49d3255bf37068886",
  failedQualificationClassification: "NOT_QUALIFIED",
  failedAuthorityHash: "9a1db862fad7cb4bdf6d742f88d48a656f64ad09a6897d1c5cdc552a6554307a",
  failedRunSealHash: "ce75ace105cd5e1a4d11fbf725c916669c107923d61787e28f9939f1c7ebb982",
  generalContinuationPolicyHash: "29db75802d9cceaab2cdf3db7e93a046e0984d0b812a3d73235df714ab9f3a29",
  scoringControlsHash: "7dceae2a4e94bb97f7ea24b70ccd60ad4464c518d5bc6fd664ac1f850fb0de9c",
  budgetProfileHash: "95f125883586a42724a44341efc30bb81e0cd39a10dc21f6cb1528d462ee4db8",
  scorerSourceHash: "5e7b87dc1f3275b221e2775cdd255050bcbca047668adf3391bf01eecce928ab",
  serverHandlerLogicHash: "270f9824f5c6fed6d1b51c1ab81ad4baa54e4875af9b80244fd0f3f11c0a2087",
  productHandlerHash: "971194eb5be57c54176244516953237f3fb4dd6fcb4d00dfdc9c36358202c958",
  customerAppHash: "f3d9abf7da460bac7bb1c00314d93a8262588328fa7757747b34a098db07ebea",
  customerEvidenceHash: "938b475c6fc3347daa1ca780b68f439bf1d4c6f76631a280132eb6f8498e3214"
});

const DOCUMENTATION = Object.freeze([
  {
    url: "https://developers.openai.com/api/docs/guides/structured-outputs",
    title: "Structured model outputs",
    retrievedDate: "2026-08-11",
    lineEvidence: ["8908-8919", "8920-8923", "8970-8984"],
    excerpt: "For fine-tuned models, maxLength and maxItems are additionally unsupported.",
    interpretation: "The standard non-fine-tuned subset admits the bounded string and array keywords used here."
  },
  {
    url: "https://developers.openai.com/api/docs/models/gpt-5.6-sol",
    title: "GPT-5.6 Sol Model",
    retrievedDate: "2026-08-11",
    lineEvidence: ["862-864", "925-941"],
    excerpt: "Structured outputs: Supported. Fine-tuning: Not supported.",
    interpretation: "gpt-5.6-sol is the exact non-fine-tuned Structured Outputs route."
  }
]);

function documentationEvidence() {
  const pages = DOCUMENTATION.map((item) => ({ ...item, excerptSha256: sha256Bytes(Buffer.from(item.excerpt, "utf8")) }));
  const core = {
    schemaVersion: "1.0", evidenceType: "OFFICIAL_DOCUMENTATION_DERIVED_STRUCTURED_OUTPUT_COMPATIBILITY",
    retrievalMethod: "READ_ONLY_OFFICIAL_OPENAI_WEB_FALLBACK",
    compatibilityClaim: "DOCUMENTATION_BACKED_COMPATIBILITY_ONLY_NOT_PROVIDER_CALIBRATION",
    pages,
    keywordAllowlist: [...QUALIFICATION_STRUCTURED_OUTPUT_KEYWORD_ALLOWLIST],
    rejectedKeywords: [...QUALIFICATION_STRUCTURED_OUTPUT_REJECTED_KEYWORDS]
  };
  return Object.freeze({ ...core, evidenceHash: sha256Json(core) });
}

function syntheticEnvelopeFixture() {
  const ids = Array.from({ length: 12 }, (_, index) => `artifact-${String(index + 1).padStart(2, "0")}`);
  const episode = {
    episodeId: "ENVELOPE-CONTRACT-FIXTURE", cohort: "PURPOSE_NEUTRAL_SYNTHETIC",
    visibleArtifactInventory: ids.map((artifactId) => ({ artifactId, sha256: "0".repeat(64), sourceKind: "PURPOSE_NEUTRAL_SYNTHETIC" }))
  };
  const materialization = {
    artifacts: ids.map((artifactId) => ({ artifactId, body: "purpose-neutral bounded envelope fixture" })),
    artifactCount: ids.length, canonicalArtifactOrder: ids,
    individualArtifactHashes: ids.map((artifactId) => ({ artifactId, sha256: "0".repeat(64) })),
    materializedAggregateHash: "0".repeat(64)
  };
  return { episode, materialization };
}

function providerSchemaEvidence(fixture) {
  const schemas = [];
  const states = Object.values(EXECUTIVE_CASE_STATE).filter((state) => !["CASE_SEALED", "STOPPED"].includes(state));
  for (const state of states) {
    for (const memoryMode of ["EMPTY", "AVAILABLE"]) {
      const memoryIds = memoryMode === "AVAILABLE" ? ["memory-1", "memory-2", "memory-3"] : [];
      const actions = legalActionsForState(state, { memoryIds });
      if (actions.length === 0) continue;
      const schema = createQualificationActionTransportSchema({
        episodeId: fixture.episode.episodeId, executiveState: state, observedStateHash: "0".repeat(64),
        actionId: `schema-${state.toLowerCase()}`, availableEvidenceIds: fixture.materialization.canonicalArtifactOrder,
        availableMemoryIds: memoryIds
      });
      const limits = assertQualificationStructuredOutputsSubset(schema);
      schemas.push({ state, memoryMode, legalActions: actions, schema, schemaHash: sha256Json(schema), limits });
    }
  }
  const maximumLimits = {
    properties: Math.max(...schemas.map((item) => item.limits.properties)),
    propertyHeadroom: Math.min(...schemas.map((item) => item.limits.propertyHeadroom)),
    maximumObjectDepth: Math.max(...schemas.map((item) => item.limits.maximumObjectDepth)),
    nestingHeadroom: Math.min(...schemas.map((item) => item.limits.nestingHeadroom)),
    schemaStringCharacters: Math.max(...schemas.map((item) => item.limits.schemaStringCharacters)),
    schemaStringCharacterHeadroom: Math.min(...schemas.map((item) => item.limits.schemaStringCharacterHeadroom)),
    propertyNameCharacters: Math.max(...schemas.map((item) => item.limits.propertyNameCharacters)),
    definitionNameCharacters: Math.max(...schemas.map((item) => item.limits.definitionNameCharacters)),
    enumStringCharacters: Math.max(...schemas.map((item) => item.limits.enumStringCharacters)),
    constStringCharacters: Math.max(...schemas.map((item) => item.limits.constStringCharacters)),
    enumValues: Math.max(...schemas.map((item) => item.limits.enumValues)),
    enumValueHeadroom: Math.min(...schemas.map((item) => item.limits.enumValueHeadroom)),
    largeEnumPropertyCount: Math.max(...schemas.map((item) => item.limits.largeEnumPropertyCount)),
    largestEnumStringCharacters: Math.max(...schemas.map((item) => item.limits.largestEnumStringCharacters)),
    largestEnumStringCharacterHeadroom: Math.min(...schemas.map((item) => item.limits.largestEnumStringCharacterHeadroom))
  };
  return Object.freeze({ schemaVersion: "1.0", schemaCount: schemas.length, schemas, maximumLimits, aggregateHash: sha256Json(schemas.map(({ state, memoryMode, schemaHash }) => ({ state, memoryMode, schemaHash }))) });
}

function maximumActionContributions(fixture) {
  const rows = [];
  for (const pair of registryActionFixtures()) {
    const memoryIds = pair.minimumMemoryReferences ? ["memory-1", "memory-2", "memory-3"] : [];
    const action = maximumProviderActionForBranch({
      episode: fixture.episode, state: pair.currentState, actionType: pair.actionType,
      actionOrdinal: rows.length + 1, evidenceIds: fixture.materialization.canonicalArtifactOrder, memoryIds
    });
    const trace = semanticTraceProjection(action);
    rows.push({
      branchIdentity: `${pair.currentState}:${pair.actionType}`,
      currentState: pair.currentState,
      actionType: pair.actionType,
      successorState: pair.successorState,
      terminal: pair.terminal,
      maximumAcceptedActionBytes: Buffer.byteLength(stableJson(action), "utf8"),
      maximumTraceContributionBytes: Buffer.byteLength(stableJson(trace), "utf8"),
      actionHash: action.contentHash,
      traceHash: sha256Json(trace)
    });
  }
  return Object.freeze({
    registeredActionCount: ACTION_REGISTRY.length,
    stateActionBranchCount: rows.length,
    rows,
    controllingAction: rows.reduce((left, right) => right.maximumTraceContributionBytes > left.maximumTraceContributionBytes ? right : left),
    aggregateHash: sha256Json(rows)
  });
}

function countFiniteSchemaBounds(value) {
  if (!value || typeof value !== "object") return 0;
  const own = Number.isInteger(value.maxLength) + Number.isInteger(value.maxItems)
    + Number(["number", "integer"].includes(value.type) && Number.isFinite(value.maximum));
  return own + Object.values(value).reduce((sum, child) => sum + countFiniteSchemaBounds(child), 0);
}

function maximumTraceMetrics(fixture, controllingPath) {
  let state = "CASE_OPEN";
  let memoryIds = [];
  const trace = [];
  const providerRequestTraceBytes = [];
  for (const [index, actionType] of controllingPath.entries()) {
    providerRequestTraceBytes.push(Buffer.byteLength(stableJson(trace), "utf8"));
    const action = maximumProviderActionForBranch({
      episode: fixture.episode, state, actionType, actionOrdinal: index + 1,
      evidenceIds: fixture.materialization.canonicalArtifactOrder, memoryIds
    });
    trace.push(semanticTraceProjection(action));
    if (actionType === "RETRIEVE_RELEVANT_MEMORY") memoryIds = ["memory-1", "memory-2", "memory-3"];
    state = canonicalTransition(state, actionType).successorState;
  }
  return Object.freeze({
    maximumProviderRequestTraceBytes: Math.max(...providerRequestTraceBytes),
    maximumCompleteTraceBytes: Buffer.byteLength(stableJson(trace), "utf8"),
    controllingTraceActionCount: trace.length
  });
}

function counterexampleEvidence(fixture) {
  const state = "EPISODE_RECONSTRUCTED"; const actionId = "counterexample-action"; const observedStateHash = "0".repeat(64);
  const schema = createQualificationActionTransportSchema({
    episodeId: fixture.episode.episodeId, executiveState: state, observedStateHash, actionId,
    availableEvidenceIds: fixture.materialization.canonicalArtifactOrder, availableMemoryIds: []
  });
  return Object.freeze([50_000, 55_000, 60_000].map((length) => {
    const definition = ACTION_REGISTRY.find((item) => item.actionType === "RETRIEVE_RELEVANT_MEMORY");
    const core = {
      schemaVersion: "1.2", actionId, episodeId: fixture.episode.episodeId, executiveState: state, observedStateHash,
      factualFindings: [], uncertainties: [], confidence: 0.5, boundedRationaleSummary: "bounded",
      prohibitedOperations: ["provider tools"],
      decision: {
        actionType: "RETRIEVE_RELEVANT_MEMORY",
        details: { queryText: "x".repeat(length), queryFacets: { cohort: [], pattern: [], failureClass: [] } },
        evidenceReferences: [fixture.materialization.canonicalArtifactOrder[0]], memoryReferences: [], authorityClass: definition.authorityClasses[0]
      }
    };
    let providerSchemaValid = true; let brokerValid = true; let providerError = null; let brokerError = null;
    try { validateContractSchemaValue(core, schema); } catch (error) { providerSchemaValid = false; providerError = String(error.message); }
    try { normalizeAndValidateProviderActionCore(core, { episode: fixture.episode, currentState: state, memoryIds: [], actionId, observedStateHash, allowedAuthorityClasses: definition.authorityClasses }); }
    catch (error) { brokerValid = false; brokerError = `${error.code}:${error.fieldPath}:${error.validationRule}`; }
    return { queryBytes: length, providerSchemaValid, brokerValid, providerError, brokerError, admittedToTrace: false, providerDispatchRequired: false };
  }));
}

async function canonicalFileHash(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, relativePath));
  return sha256Bytes(Buffer.from(bytes.toString("utf8").replaceAll("\r\n", "\n"), "utf8"));
}

async function serverHandlerLogicHash() {
  const source = (await readFile(path.join(repositoryRoot, "server.ps1"), "utf8"))
    .replaceAll("\r\n", "\n")
    .replace(/^\$AppVersion = "[^"]+"/m, '$AppVersion = "<VERSION>"');
  return sha256Bytes(Buffer.from(source, "utf8"));
}

export async function buildBoundedRequestEnvelopeArtifacts() {
  assertNoDuplicateLogicalBounds();
  const fixture = syntheticEnvelopeFixture();
  const documentation = documentationEvidence();
  const inventory = finiteBoundInventory();
  const providerSchemas = providerSchemaEvidence(fixture);
  const baseRoute = calculateWorstFutureRoute({ episode: fixture.episode, materialization: fixture.materialization, currentState: "CASE_OPEN" });
  const route = Object.freeze({ ...baseRoute, ...maximumTraceMetrics(fixture, baseRoute.controllingPath) });
  assert.equal(route.admitted, true, "bounded semantic route does not fit the 64,000-byte envelope");
  const actions = maximumActionContributions(fixture);
  const trace = traceContractEvidence();
  const coverage = requestAffectingContractCoverage();
  assert.equal(coverage.previouslyKnownUnboundedPathsClosed, true);
  const counterexamples = counterexampleEvidence(fixture);
  assert.equal(counterexamples.every((item) => !item.providerSchemaValid && !item.brokerValid && !item.admittedToTrace), true);
  const boundaries = {
    schemaVersion: "1.0",
    providerStringFieldCount: Object.values(REQUEST_FIELD_CONTRACTS).filter((item) => item.origin === "PROVIDER_CONTROLLED" && item.type === "string").length,
    providerArrayFieldCount: Object.values(REQUEST_FIELD_CONTRACTS).filter((item) => item.origin === "PROVIDER_CONTROLLED" && item.type === "array").length,
    unicodeCases: ["ASCII", "TWO_BYTE", "THREE_BYTE", "FOUR_BYTE_ASTRAL", "LONE_HIGH_SURROGATE", "LONE_LOW_SURROGATE", "CONTROL", "QUOTE", "BACKSLASH", "LINE_BREAK"],
    requiredBoundaryModes: ["EXACT_MAXIMUM", "FIRST_OVER_MAXIMUM"],
    exactMaximumSchemaChecks: providerSchemas.schemas.reduce((sum, item) => sum + countFiniteSchemaBounds(item.schema), 0),
    firstOverMaximumSchemaChecks: providerSchemas.schemas.reduce((sum, item) => sum + countFiniteSchemaBounds(item.schema), 0),
    counterexamples,
    boundaryContractHash: sha256Json({ fields: REQUEST_FIELD_CONTRACTS, counterexamples })
  };
  const frozen = {
    generalContinuationPolicyHash: await canonicalFileHash("qualification/synthetic-executive/qualification-real-route/general-continuation-policy.json"),
    scoringControlsHash: (JSON.parse(await readFile(path.join(qualificationRoot, "evaluator-control-aggregate.json"), "utf8"))).evaluatorControlAggregateHash,
    budgetProfileHash: (JSON.parse(await readFile(path.join(qualificationRoot, "qualification-budget-profile.json"), "utf8"))).profileHash,
    scorerSourceHash: await canonicalFileHash("qualification/synthetic-executive/scripts/blind-qualification-evaluator.mjs"),
    serverHandlerHash: await canonicalFileHash("server.ps1"),
    serverHandlerLogicHash: await serverHandlerLogicHash(),
    productHandlerHash: await canonicalFileHash("api/generate-listing.js"),
    customerAppHash: await canonicalFileHash("public/app.js"),
    customerEvidenceHash: await canonicalFileHash("public/customer-evidence.js")
  };
  assert.equal(frozen.generalContinuationPolicyHash, BOUNDED_RELEASE_BINDINGS.generalContinuationPolicyHash);
  assert.equal(frozen.scoringControlsHash, BOUNDED_RELEASE_BINDINGS.scoringControlsHash);
  assert.equal(frozen.budgetProfileHash, BOUNDED_RELEASE_BINDINGS.budgetProfileHash);
  assert.equal(frozen.scorerSourceHash, BOUNDED_RELEASE_BINDINGS.scorerSourceHash);
  assert.equal(frozen.serverHandlerLogicHash, BOUNDED_RELEASE_BINDINGS.serverHandlerLogicHash);
  assert.equal(frozen.productHandlerHash, BOUNDED_RELEASE_BINDINGS.productHandlerHash);
  assert.equal(frozen.customerAppHash, BOUNDED_RELEASE_BINDINGS.customerAppHash);
  assert.equal(frozen.customerEvidenceHash, BOUNDED_RELEASE_BINDINGS.customerEvidenceHash);
  return Object.freeze({ documentation, inventory, providerSchemas, route, actions, trace, coverage, boundaries, frozen, acceptedActionSchema: canonicalExecutiveActionSchema() });
}

const ARTIFACT_FILENAMES = Object.freeze({
  documentation: "documentation-compatibility-evidence.json",
  inventory: "request-affecting-field-inventory.json",
  providerSchemas: "state-conditioned-provider-schemas.json",
  route: "legal-path-envelope-proof.json",
  actions: "maximum-action-contributions.json",
  trace: "trace-contract-evidence.json",
  coverage: "finite-bound-coverage.json",
  boundaries: "boundary-and-counterexample-proof.json",
  frozen: "frozen-surface-identities.json"
});

export async function buildBoundedRequestEnvelopeRelease() {
  const artifacts = await buildBoundedRequestEnvelopeArtifacts();
  const implementationHashes = Object.fromEntries(await Promise.all([
    "qualification/synthetic-executive/scripts/bounded-request-contract.mjs",
    "qualification/synthetic-executive/scripts/executive-action-registry.mjs",
    "qualification/synthetic-executive/scripts/provider-action-schema.mjs",
    "qualification/synthetic-executive/scripts/action-broker.mjs",
    "qualification/synthetic-executive/scripts/request-envelope-contract.mjs",
    "qualification/synthetic-executive/scripts/run-qualification.mjs",
    "qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs",
    "qualification/synthetic-executive/qualification-real-route/scripts/bounded-request-envelope-release.mjs"
  ].map(async (relativePath) => [relativePath, await canonicalFileHash(relativePath)])));
  const artifactHashes = Object.entries(ARTIFACT_FILENAMES).map(([key, filename]) => ({ filename, sha256: sha256Bytes(Buffer.from(`${stableJson(artifacts[key])}\n`, "utf8")) }));
  const acceptedSchemaHash = sha256Json(artifacts.acceptedActionSchema);
  const core = {
    schemaVersion: "1.0", releaseType: "KATHERINE_SYNTHETIC_EXECUTIVE_BOUNDED_REQUEST_ENVELOPE_CONTRACT_V1",
    releaseState: "SEALED_TOOLING_RELEASE", version: BOUNDED_RELEASE_BINDINGS.version,
    startingIdentity: { version: BOUNDED_RELEASE_BINDINGS.startingVersion, commit: BOUNDED_RELEASE_BINDINGS.startingHead, tree: BOUNDED_RELEASE_BINDINGS.startingTree },
    preservedHistoricalRelease: {
      releaseHash: BOUNDED_RELEASE_BINDINGS.priorReleaseHash,
      releaseRecordSha256: BOUNDED_RELEASE_BINDINGS.priorReleaseRecordSha256,
      actionRegistryHash: BOUNDED_RELEASE_BINDINGS.priorActionRegistryHash,
      providerSchemaHash: BOUNDED_RELEASE_BINDINGS.priorProviderSchemaHash,
      failedQualificationClassification: BOUNDED_RELEASE_BINDINGS.failedQualificationClassification,
      failedAuthorityHash: BOUNDED_RELEASE_BINDINGS.failedAuthorityHash,
      failedRunSealHash: BOUNDED_RELEASE_BINDINGS.failedRunSealHash
    },
    contractBindings: {
      boundedRequestRegistryHash: BOUNDED_REQUEST_CONTRACT_HASH,
      acceptedActionSchemaHash: acceptedSchemaHash,
      providerSchemaAggregateHash: artifacts.providerSchemas.aggregateHash,
      requestFieldInventoryHash: artifacts.inventory.inventoryHash,
      legalPathEnvelopeProofHash: sha256Json(artifacts.route),
      maximumActionContributionsHash: artifacts.actions.aggregateHash,
      traceContractHash: artifacts.trace.traceContractHash,
      boundaryContractHash: artifacts.boundaries.boundaryContractHash,
      documentationEvidenceHash: artifacts.documentation.evidenceHash,
      registeredActionCount: ACTION_REGISTRY.length,
      registeredStateActionPairCount: registryActionFixtures().length
    },
    envelopeConclusion: {
      requestCeilingBytes: artifacts.route.ceilingBytes,
      legalPathCount: artifacts.route.pathCount,
      routeMaxBytes: artifacts.route.routeMax,
      minimumHeadroomBytes: artifacts.route.minimumHeadroomBytes,
      maximumProviderRequestTraceBytes: artifacts.route.maximumProviderRequestTraceBytes,
      maximumCompleteTraceBytes: artifacts.route.maximumCompleteTraceBytes,
      controllingPath: artifacts.route.controllingPath,
      mutuallyExclusiveBranchesSummed: false,
      semanticCapacityProven: true
    },
    structuredOutputLimits: artifacts.providerSchemas.maximumLimits,
    artifactHashes,
    artifactAggregateHash: sha256Json(artifactHashes),
    implementationHashes,
    implementationAggregateHash: sha256Json(implementationHashes),
    frozenSurfaceIdentities: artifacts.frozen,
    activityAssertions: {
      credentialAccessCount: 0, metadataRequestCount: 0, providerRequestCount: 0, externalModelCallCount: 0,
      parentRouteRequestCount: 0, authoritiesCreated: 0, authoritiesConsumed: 0,
      qualificationCasesExecuted: 0, failedQualificationReplays: 0,
      corpusCasesConstructed: 0, v2CorpusArtifactsConstructed: 0, v1QualificationArtifactsModified: 0,
      durableMemoryPromotions: 0, benchmarkExecutions: 0, productHandlerInvocations: 0,
      previewDeployments: 0, productionDeployments: 0, merges: 0
    },
    claims: {
      qualification: false, cognition: false, learning: false, autonomy: false, corpusReadiness: false, productionReadiness: false,
      exactClaim: "KATHERINE_SYNTHETIC_EXECUTIVE_BOUNDED_REQUEST_ENVELOPE_CONTRACT_READY"
    }
  };
  return Object.freeze({ artifacts, release: Object.freeze({ ...core, releaseHash: sha256Json(core) }) });
}

export function validateBoundedRequestEnvelopeRelease(record) {
  assert.equal(record.version, BOUNDED_RELEASE_BINDINGS.version);
  assert.equal(record.contractBindings.registeredActionCount, 13);
  assert.equal(record.contractBindings.registeredStateActionPairCount, 27);
  assert.equal(record.envelopeConclusion.requestCeilingBytes, 64_000);
  assert.ok(record.envelopeConclusion.routeMaxBytes <= 64_000);
  assert.equal(record.envelopeConclusion.mutuallyExclusiveBranchesSummed, false);
  assert.equal(record.activityAssertions.providerRequestCount, 0);
  assert.equal(record.activityAssertions.qualificationCasesExecuted, 0);
  assert.equal(record.claims.exactClaim, "KATHERINE_SYNTHETIC_EXECUTIVE_BOUNDED_REQUEST_ENVELOPE_CONTRACT_READY");
  const core = structuredClone(record); delete core.releaseHash;
  assert.equal(sha256Json(core), record.releaseHash);
  return true;
}

async function writeArtifacts() {
  const { artifacts, release } = await buildBoundedRequestEnvelopeRelease();
  await mkdir(artifactRoot, { recursive: true });
  for (const [key, filename] of Object.entries(ARTIFACT_FILENAMES)) await writeFile(path.join(artifactRoot, filename), `${stableJson(artifacts[key])}\n`, "utf8");
  await writeFile(boundedExecutiveActionSchemaPath, `${stableJson(artifacts.acceptedActionSchema)}\n`, "utf8");
  await writeFile(boundedRequestEnvelopeReleasePath, `${stableJson(release)}\n`, "utf8");
  return release;
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  const release = process.argv.includes("--write") ? await writeArtifacts() : (await buildBoundedRequestEnvelopeRelease()).release;
  process.stdout.write(`${stableJson(release)}\n`);
}
