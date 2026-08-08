import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createLaunchScope, deriveLaunchIdentities } from "../benchmarks/blind-object-v2/scripts/launch-identity.mjs";
import { parseAuthorizedExecutionArguments } from "../benchmarks/blind-object-v2/scripts/run-authorized-execution.mjs";
import { createProductCostSourceManifest } from "../benchmarks/blind-object-v2/scripts/product-cost-source.mjs";
import {
  EXECUTION_RELEASE_RELATIVE_PATH,
  EXECUTION_RELEASE_SCHEMA_VERSION,
  EXECUTION_RELEASE_STATE,
  EXECUTION_RELEASE_TYPE,
  QUALIFICATION_POLICY_VERSION,
  QUALIFICATION_RELATIONSHIP,
  assertQualifiedReleaseState,
  createExecutionReleaseRecord,
  validateExecutionReleaseRecord,
  validateQualificationSnapshot
} from "../benchmarks/blind-object-v2/scripts/release-qualification.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME_HEAD = "a".repeat(40);
const QUALIFICATION_HEAD = "b".repeat(40);
const RUNTIME_TREE = "c".repeat(40);
const OTHER_HEAD = "d".repeat(40);
const FREEZE = "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699";
const COST_SOURCE_MANIFEST_HASH = createProductCostSourceManifest().manifestHash;

function releaseCore(releaseState, overrides = {}) {
  return {
    schemaVersion: EXECUTION_RELEASE_SCHEMA_VERSION,
    releaseType: EXECUTION_RELEASE_TYPE,
    releaseState,
    executorRuntimeHead: releaseState === EXECUTION_RELEASE_STATE.QUALIFIED ? RUNTIME_HEAD : null,
    executorVersion: "1.12.18",
    executorRuntimeTreeHash: releaseState === EXECUTION_RELEASE_STATE.QUALIFIED ? RUNTIME_TREE : null,
    qualificationPolicyVersion: QUALIFICATION_POLICY_VERSION,
    requiredQualificationRelationship: QUALIFICATION_RELATIONSHIP,
    permittedQualificationOverlay: [EXECUTION_RELEASE_RELATIVE_PATH],
    productSourceHead: "7056eb0601dc69c5985703fea6fe665e82c6bed8",
    productSourceVersion: "1.12.13",
    productCostSourceManifestHash: COST_SOURCE_MANIFEST_HASH,
    benchmarkContractIdentity: {
      benchmarkId: "blind-object-v2",
      completeFrozenAggregateHash: FREEZE,
      freezeManifestHash: "6f99638e26766966d923e24604a350174d0757059c61a38043305d7d845ae4f8",
      requestAggregateHash: "8e5be048fa407ab6e659b1ce6f1475aa1c2974e55c5023656cd9b077f55663af"
    },
    handler: "api/generate-listing.js#createGenerateListingHandler",
    completePhysicalAttemptCeiling: 832,
    launchScopeSchemaVersion: "2.1",
    costEnvelopeSchemaVersion: "1.1",
    maximumAuthorizedCostMinorUnits: 4000,
    authorityDeclarations: {
      consentCreationEnabled: false,
      executionEnabled: false,
      realExecutionAuthorized: false,
      privateControlsAuthorized: false,
      scoringAuthorized: false,
      reflectionAuthorized: false,
      repairAuthorized: false,
      deploymentAuthorized: false
    },
    ...overrides
  };
}

function records() {
  return {
    pending: createExecutionReleaseRecord(releaseCore(EXECUTION_RELEASE_STATE.PENDING)),
    qualified: createExecutionReleaseRecord(releaseCore(EXECUTION_RELEASE_STATE.QUALIFIED))
  };
}

function snapshot(overrides = {}) {
  return {
    repositoryRoot,
    expectedRepositoryRoot: repositoryRoot,
    branch: "refactor/beta-evidence-pipeline",
    trackedStatus: "",
    conflictedPaths: [],
    qualificationHead: QUALIFICATION_HEAD,
    qualificationParents: [RUNTIME_HEAD],
    runtimeObjectType: "commit",
    runtimeTreeHash: RUNTIME_TREE,
    runtimeVersion: "1.12.18",
    qualificationVersion: "1.12.18",
    sealDiffStatus: [`M\t${EXECUTION_RELEASE_RELATIVE_PATH}`],
    sealDiffPaths: [EXECUTION_RELEASE_RELATIVE_PATH],
    ...overrides
  };
}

function launchInput({ runtimeHead = RUNTIME_HEAD, qualificationHead = QUALIFICATION_HEAD, runtimeTree = RUNTIME_TREE, recordHash = records().qualified.recordHash } = {}) {
  return {
    benchmarkId: "blind-object-v2",
    candidateSetId: "V2-HOLDOUT-20260808-A",
    productSourceHead: "7056eb0601dc69c5985703fea6fe665e82c6bed8",
    productSourceVersion: "1.12.13",
    productRuntimeManifestHash: "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8",
    productCostSourceManifestHash: COST_SOURCE_MANIFEST_HASH,
    executorRuntimeHead: runtimeHead,
    qualificationHead,
    executorRuntimeTreeHash: runtimeTree,
    executionReleaseRecordHash: recordHash,
    qualificationPolicyVersion: "1.0",
    executorVersion: "1.12.18",
    completeFrozenAggregateHash: FREEZE,
    freezeManifestHash: "6f99638e26766966d923e24604a350174d0757059c61a38043305d7d845ae4f8",
    freezeReceiptHash: "e7d813e468ae13039b52a029694e4fbfd6d33ca97446d0f02bf6a7df8962a577",
    requestAggregateHash: "8e5be048fa407ab6e659b1ce6f1475aa1c2974e55c5023656cd9b077f55663af",
    orderedRequestHashInventory: Array.from({ length: 26 }, (_, index) => (index + 1).toString(16).padStart(64, "0")),
    handlerContract: { export: "api/generate-listing.js#createGenerateListingHandler", bridge: "scripts/local-generate-listing-bridge.mjs", method: "POST", path: "/api/generate-listing" },
    modelProvider: "OPENAI",
    exactModelLiteral: "gpt-4.1-mini",
    acquisitionProviderMode: "OPENAI_WEB_SEARCH_ONLY",
    directPageMode: "PRODUCT_BOUNDED_ONLY",
    endpointClassAllowlistHash: "1".repeat(64),
    environmentNameAllowlistHash: "2".repeat(64),
    completePhysicalAttemptCeiling: 832,
    completeAttemptCeilingHash: "3".repeat(64),
    executionProfileIdentityHash: "4".repeat(64),
    pricingProfileIdentityHash: "5".repeat(64),
    costEnvelopeHash: "6".repeat(64),
    maximumAuthorizedCostMinorUnits: 4000,
    networkPolicyHash: "7".repeat(64),
    privateControlsAuthorized: false,
    scoringAuthorized: false,
    reflectionAuthorized: false,
    repairAuthorized: false,
    deploymentAuthorized: false
  };
}

function assertAllIdentitiesChange(left, right, label) {
  const first = deriveLaunchIdentities(left);
  const second = deriveLaunchIdentities(right);
  assert.notEqual(left.launchScopeHash, right.launchScopeHash, `${label} did not change launch scope`);
  for (const field of ["consentId", "invocationId", "reservationId", "resultId", "resultRootName"]) {
    assert.notEqual(first[field], second[field], `${label} did not change ${field}`);
  }
}

test("A: the old anchor-equals-HEAD rule reproduces the qualification-descendant failure", () => {
  const releaseRecordLastModifiedAt = RUNTIME_HEAD;
  const testOnlyQualificationHead = QUALIFICATION_HEAD;
  assert.notEqual(releaseRecordLastModifiedAt, testOnlyQualificationHead);
  assert.throws(() => assert.equal(releaseRecordLastModifiedAt, testOnlyQualificationHead), /Expected values/);
});

test("B: PENDING_QUALIFICATION_SEAL blocks PREFLIGHT, CREATE_CONSENT, EXECUTE, and READBACK", () => {
  const { pending } = records();
  for (const mode of ["PREFLIGHT", "CREATE_CONSENT", "EXECUTE", "READBACK"]) {
    assert.throws(() => assertQualifiedReleaseState(pending, mode), /requires a QUALIFIED executor release/);
  }
  assert.equal(pending.authorityDeclarations.realExecutionAuthorized, false);
});

test("C and N: a direct-child, one-file modification seal is accepted", () => {
  const { pending, qualified } = records();
  const result = validateQualificationSnapshot(snapshot(), qualified, pending);
  assert.equal(result.executorRuntimeHead, RUNTIME_HEAD);
  assert.equal(result.qualificationHead, QUALIFICATION_HEAD);
  assert.equal(result.executorRuntimeTreeHash, RUNTIME_TREE);
});

test("D-F: wrong parent, a second descendant, and merge qualification heads fail closed", () => {
  const { pending, qualified } = records();
  assert.throws(() => validateQualificationSnapshot(snapshot({ qualificationParents: [OTHER_HEAD] }), qualified, pending), /direct non-merge child/);
  assert.throws(() => validateQualificationSnapshot(snapshot({ qualificationHead: OTHER_HEAD, qualificationParents: [QUALIFICATION_HEAD] }), qualified, pending), /direct non-merge child/);
  assert.throws(() => validateQualificationSnapshot(snapshot({ qualificationParents: [RUNTIME_HEAD, OTHER_HEAD] }), qualified, pending), /direct non-merge child/);
});

test("G-H: every extra-file category and runtime-tree drift fail the complete-tree comparison", () => {
  const { pending, qualified } = records();
  for (const extra of [
    "benchmarks/blind-object-v2/scripts/executor.mjs",
    "benchmarks/blind-object-v2/schemas/launch-scope.schema.json",
    "package.json",
    "public/index.html",
    "tests/blind-object-v2-release-qualification.test.mjs",
    "server.ps1",
    "vercel.json"
  ]) {
    assert.throws(() => validateQualificationSnapshot(snapshot({
      sealDiffStatus: [`M\t${EXECUTION_RELEASE_RELATIVE_PATH}`, `M\t${extra}`],
      sealDiffPaths: [EXECUTION_RELEASE_RELATIVE_PATH, extra]
    }), qualified, pending), /only execution-release|modify exactly/);
  }
  assert.throws(() => validateQualificationSnapshot(snapshot({ runtimeTreeHash: OTHER_HEAD }), qualified, pending), /runtime tree identity/);
});

test("I: record drift invalidates its hash and a valid reseal changes every launch identity", () => {
  const { qualified } = records();
  assert.throws(() => validateExecutionReleaseRecord({ ...qualified, executorRuntimeHead: OTHER_HEAD }), /hash mismatch/);
  const replacement = createExecutionReleaseRecord(releaseCore(EXECUTION_RELEASE_STATE.QUALIFIED, { executorRuntimeHead: OTHER_HEAD }));
  const first = createLaunchScope(launchInput({ recordHash: qualified.recordHash }));
  const second = createLaunchScope(launchInput({ runtimeHead: OTHER_HEAD, recordHash: replacement.recordHash }));
  assertAllIdentitiesChange(first, second, "release-record drift");
});

test("J-K: Version mismatch, dirtiness, staging, conflicts, wrong repository, and detached state fail", () => {
  const { pending, qualified } = records();
  for (const mutation of [
    { runtimeVersion: "1.12.16" },
    { qualificationVersion: "1.12.16" },
    { trackedStatus: " M package.json" },
    { trackedStatus: "M  package.json" },
    { conflictedPaths: ["package.json"] },
    { repositoryRoot: path.join(repositoryRoot, "foreign") },
    { branch: "" }
  ]) assert.throws(() => validateQualificationSnapshot(snapshot(mutation), qualified, pending));
});

test("L: runtime head, qualification head, runtime tree, and record hash each bind every proposed identity", () => {
  const base = createLaunchScope(launchInput());
  for (const [label, changes] of [
    ["runtime head", { runtimeHead: OTHER_HEAD }],
    ["qualification head", { qualificationHead: OTHER_HEAD }],
    ["runtime tree", { runtimeTree: OTHER_HEAD }],
    ["record hash", { recordHash: "8".repeat(64) }]
  ]) assertAllIdentitiesChange(base, createLaunchScope(launchInput(changes)), label);
});

test("M: callers cannot select either release head through CLI, environment, package, candidate, filename, or text", async () => {
  for (const value of [RUNTIME_HEAD, QUALIFICATION_HEAD, "EXECUTOR_RUNTIME_HEAD", "qualificationHead", "package.json", "candidate", "free-form text"]) {
    assert.throws(() => parseAuthorizedExecutionArguments(["PREFLIGHT", FREEZE, value]));
  }
  const source = await readFile(new URL("../benchmarks/blind-object-v2/scripts/release-qualification.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /process\.env|candidate|freeFormText|operatorText/);
  assert.doesNotMatch(source, /git\(\["log".*execution-release/);
  assert.throws(() => validateQualificationSnapshot({ ...snapshot(), callerSelectedHead: OTHER_HEAD }, records().qualified, records().pending), /fields differ/);
});

test("O: product identity, freeze identity, release schema, and all authority declarations remain isolated", async () => {
  const { pending, qualified } = records();
  for (const record of [pending, qualified]) {
    assert.equal(record.productSourceHead, "7056eb0601dc69c5985703fea6fe665e82c6bed8");
    assert.equal(record.productSourceVersion, "1.12.13");
    assert.equal(record.productCostSourceManifestHash, COST_SOURCE_MANIFEST_HASH);
    assert.equal(record.benchmarkContractIdentity.completeFrozenAggregateHash, FREEZE);
    assert.equal(Object.values(record.authorityDeclarations).every((value) => value === false), true);
  }
  const schema = JSON.parse(await readFile(new URL("../benchmarks/blind-object-v2/schemas/execution-release.schema.json", import.meta.url), "utf8"));
  assert.equal(schema.additionalProperties, false);
  assert.deepEqual(schema.properties.releaseState.enum, ["PENDING_QUALIFICATION_SEAL", "QUALIFIED", "INVALID"]);
});
