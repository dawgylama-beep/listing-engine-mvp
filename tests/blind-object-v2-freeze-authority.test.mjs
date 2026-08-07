import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  FREEZE_CONSTRUCTION_STATE,
  FREEZE_RECEIPT_SCHEMA_VERSION,
  FREEZE_SCHEMA_VERSION,
  PREPARATION_STATE,
  PURPOSES,
  REQUEST_SCHEMA_VERSION,
  freezeBenchmark,
  identityFingerprint,
  impliedAuthorityDisposition,
  parseJsonStrict,
  sealRecord,
  sha256Bytes,
  sha256Json,
  validateFreezeManifest,
  validateFreezeReceipt,
  validateFrozenRequestContract,
  verifyFrozenBenchmark
} from "../benchmarks/blind-object-v2/scripts/protocol.mjs";
import { expectedFreezeArtifactPath, persistFrozenBenchmark } from "../benchmarks/blind-object-v2/scripts/freeze-store.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_HEAD = "b".repeat(40);
const SOURCE_VERSION = "1.12.12";
const EXPECTED_SPECIFICATION_HASH = "6e4de31940417832c94d4bb92c4d50a7b87e06a1b0f84ae706af27e20e4df092";
const EXPECTED_COVERAGE_HASH = "41d74fbdcae25dcf1134bb13925caf78ba4879eae0db016efde13cf2d505e954";
const EXPECTED_SCORING_HASH = "9378aab5ba97b8a878e3b2fe732c222cbd79eaf18ab17086b181877d1a5eb527";

async function loadJson(relativePath) {
  return JSON.parse(await readFile(path.join(repositoryRoot, ...relativePath.split("/")), "utf8"));
}

async function contracts() {
  const [benchmarkSpec, coverageContract, scoringContract] = await Promise.all([
    loadJson("benchmarks/blind-object-v2/benchmark-spec.json"),
    loadJson("benchmarks/blind-object-v2/coverage-contract.json"),
    loadJson("benchmarks/blind-object-v2/scoring-contract.json")
  ]);
  return { benchmarkSpec, coverageContract, scoringContract };
}

function emptyLegacyIndex() {
  return {
    sourceBenchmarkId: "blind-object-v1",
    photoHashes: new Set(), descriptionExactHashes: new Set(), descriptionNormalizedHashes: new Set(), objectRecordHashes: new Set(),
    identityFingerprints: new Set(), requestInputHashes: new Set(), historicalRequestHashes: new Set(), historicalRequestBodyHashes: new Set()
  };
}

function fixture() {
  const assetBytesByPath = new Map();
  const sourceOriginalBytesByPath = new Map();
  const purposes = [...Array(4).fill("PERSONAL_BUY"), ...Array(4).fill("RESALE"), ...Array(3).fill("WHATS_IT_WORTH"), ...Array(3).fill("MARKETPLACE_LISTING")];
  const anchors = ["V2-OBJ-001", "V2-OBJ-005", "V2-OBJ-009", "V2-OBJ-012"];
  const flags = ["ordinaryCurrentRetail", "vintageOrCollectible", "householdEquipmentOrTool", "apparelOrPersonalAccessory", "packagingDependentIdentity", "modelOrIdentifierDependentIdentity", "visuallyAmbiguous", "additionalCustomerInformationNecessary", "safetyRelevantWithoutHazardousInstructions"];
  const objects = Array.from({ length: 14 }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    const objectId = `V2-OBJ-${number}`;
    const lane = index < 8 ? "PHOTO_ONLY" : index < 12 ? "PHOTO_PLUS_VISIBLE_MARKINGS" : "BARCODE_OR_MODEL";
    const description = lane === "PHOTO_ONLY" ? "" : `Synthetic public marking ${number}`;
    const photos = ["A", "B"].map((letter) => {
      const bytes = Buffer.from(`synthetic-sanitized-${number}-${letter}`);
      const assetPath = `assets/v2-obj-${number}-${letter.toLowerCase()}.jpg`;
      assetBytesByPath.set(assetPath, bytes);
      return { assetId: `${objectId}-${letter}`, path: assetPath, mediaType: "image/jpeg", bytes: bytes.length, sha256: sha256Bytes(bytes) };
    });
    const coverage = Object.fromEntries(flags.map((flag) => [flag, false]));
    if (flags[index]) coverage[flags[index]] = true;
    return {
      objectId, lane, primaryPurpose: purposes[index], objectClass: ["CURRENT_RETAIL", "VINTAGE_COLLECTIBLE", "HOUSEHOLD_TOOL", "APPAREL_ACCESSORY"][index] || "OTHER_REAL_WORLD_OBJECT",
      description, descriptionSha256: sha256Bytes(Buffer.from(description)), photos, coverage,
      humanAttestation: {
        attestationId: `ATTEST-V2-AUTHORITY-${number}`, attestedAt: "2026-08-07T12:00:00.000Z", realWorldObjectIsNew: true,
        photographsAreNew: true, notPreviouslyBenchmarked: true, notUsedToDesignProductionRepair: true,
        perceptualUniquenessReviewedByHuman: true, preparationUseAuthorized: true, providerTransmissionAuthorized: false,
        benchmarkExecutionAuthorized: false
      }
    };
  });
  const analyses = objects.map((object, index) => ({ analysisId: `V2-RUN-${String(index + 1).padStart(3, "0")}`, objectId: object.objectId, purpose: object.primaryPurpose, runType: "PRINCIPAL" }));
  for (const objectId of anchors) {
    const object = objects.find((entry) => entry.objectId === objectId);
    for (const purpose of PURPOSES.filter((entry) => entry !== object.primaryPurpose)) analyses.push({ analysisId: `V2-RUN-${String(analyses.length + 1).padStart(3, "0")}`, objectId, purpose, runType: "ANCHOR_PURPOSE" });
  }
  const intakeManifest = { schemaVersion: "2.0", benchmarkId: "blind-object-v2", state: "INTAKE_COMPLETE", createdAt: "2026-08-07T12:00:00.000Z", purposeInvarianceAnchorObjectIds: anchors, objects, analyses };
  const privateControls = {
    schemaVersion: "2.0", benchmarkId: "blind-object-v2", visibility: "PRIVATE_EVALUATOR_ONLY",
    objects: objects.map((object, index) => {
      const authoritativeIdentity = `Synthetic private identity ${String(index + 1).padStart(3, "0")}`;
      return { objectId: object.objectId, authoritativeIdentity, identityFingerprintSha256: identityFingerprint(authoritativeIdentity), acceptedIdentityBoundaries: ["Synthetic boundary"], rejectedDistractors: ["Synthetic distractor"], exactEvidenceExpectations: ["Synthetic expectation"], customerInputRequirement: "Synthetic input rule", safetyExpectation: "Synthetic safety rule", permittedCautiousOutcomes: ["Synthetic cautious outcome"], prohibitedUnsupportedClaims: ["Synthetic prohibited claim"] };
    }),
    analyses: analyses.map((analysis) => ({ analysisId: analysis.analysisId, purposeObligations: ["Synthetic obligation"], permittedTerminalStates: ["STOP_COMPLETE", "STOP_INSUFFICIENT_EVIDENCE"], requiredLimitations: ["Synthetic limitation"] }))
  };
  const candidateSetId = "SYNTHETIC-AUTHORITY-SET-0001";
  const packageBoundary = { candidateSetId, sourcePackageSha256: sha256Json({ package: 1 }), sourcePackageBytes: 8192, packageManifestFileHash: sha256Json({ packageManifest: 1 }), checksumFileHash: sha256Json({ checksums: 1 }) };
  const sourceOriginalInventory = objects.flatMap((object) => object.photos.map((photo) => {
    const evaluatorOnlyRelativePath = `source-originals/${photo.assetId.toLowerCase()}.jpg`;
    const bytes = Buffer.from(`synthetic-original-${photo.assetId}`);
    sourceOriginalBytesByPath.set(evaluatorOnlyRelativePath, bytes);
    return { canonicalObjectId: object.objectId, photoId: photo.assetId, evaluatorOnlyRelativePath, bytes: bytes.length, sha256: sha256Bytes(bytes) };
  }));
  const provenanceRecords = sourceOriginalInventory.map((record) => ({ objectId: record.canonicalObjectId, photoId: record.photoId, sourcePage: `https://example.invalid/${record.photoId}`, creator: "Synthetic creator", license: "Synthetic license", sourceOriginalSha256: record.sha256 }));
  const analysisPlan = { schemaVersion: "1.0", benchmarkId: "blind-object-v2", candidateSetId, analyses: structuredClone(analyses) };
  return { intakeManifest, privateControls, assetBytesByPath, sourceOriginalInventory, sourceOriginalBytesByPath, provenanceRecords, analysisPlan, packageBoundary };
}

async function build(overrides = {}) {
  const contractSet = await contracts();
  const data = fixture();
  const inputs = { ...data, ...contractSet, legacyIndex: emptyLegacyIndex(), sourceRepositoryHead: SOURCE_HEAD, sourceVersion: SOURCE_VERSION, ...overrides };
  const frozen = freezeBenchmark(inputs);
  return { ...contractSet, data, inputs, frozen };
}

test("A-D: release-bound requests are strict, multiview, private-free, and deterministic", async () => {
  const { frozen, data } = await build();
  assert.equal(frozen.requestContracts.length, 26);
  for (const request of frozen.requestContracts) {
    assert.equal(validateFrozenRequestContract(request).valid, true);
    assert.equal(request.schemaVersion, REQUEST_SCHEMA_VERSION);
    assert.equal(request.candidateSetId, data.packageBoundary.candidateSetId);
    assert.equal(request.sourceRepositoryHead, SOURCE_HEAD);
    assert.equal(request.sourceVersion, SOURCE_VERSION);
    assert.equal(request.sourcePackageSha256, data.packageBoundary.sourcePackageSha256);
    assert.equal(request.specificationHash, EXPECTED_SPECIFICATION_HASH);
    assert.equal(request.coverageHash, EXPECTED_COVERAGE_HASH);
    assert.equal(request.scoringHash, EXPECTED_SCORING_HASH);
    assert.equal(request.inputAssets.length, 2);
    assert.equal(new Set(request.inputAssets.map((asset) => asset.sha256)).size, 2);
    assert.equal(request.inputAssets.every((asset) => asset.photoId.startsWith(`${request.canonicalObjectId}-`)), true);
    assert.equal(request.privateControlMaterialIncluded, false);
  }
  const rendered = JSON.stringify(frozen.requestContracts);
  data.privateControls.objects.forEach((control) => assert.equal(rendered.includes(control.authoritativeIdentity), false));
  const reversed = fixture();
  reversed.provenanceRecords.reverse(); reversed.sourceOriginalInventory.reverse();
  reversed.assetBytesByPath = new Map([...reversed.assetBytesByPath].reverse());
  reversed.sourceOriginalBytesByPath = new Map([...reversed.sourceOriginalBytesByPath].reverse());
  const rebuilt = await build(reversed);
  assert.deepEqual(rebuilt.frozen.requestContracts, frozen.requestContracts);
  assert.equal(rebuilt.frozen.freezeManifest.completeFrozenAggregateHash, frozen.freezeManifest.completeFrozenAggregateHash);
});

test("A-B: missing, changed, unknown, private, and executable request fields fail closed", async () => {
  const { frozen } = await build();
  const original = frozen.requestContracts[0];
  for (const field of ["candidateSetId", "sourceRepositoryHead", "sourceVersion", "sourcePackageSha256", "specificationHash", "coverageHash", "scoringHash"]) {
    const missing = structuredClone(original); delete missing[field];
    assert.throws(() => validateFrozenRequestContract(missing), /missing or unexpected fields/);
    const changedBinding = structuredClone(original);
    changedBinding[field] = field === "sourceVersion" ? "1.12.99" : field === "sourceRepositoryHead" ? "c".repeat(40) : field === "candidateSetId" ? "SYNTHETIC-AUTHORITY-SET-9999" : "c".repeat(64);
    assert.throws(() => validateFrozenRequestContract(changedBinding), /mismatch/);
  }
  const unknown = { ...original, unexpected: true };
  assert.throws(() => validateFrozenRequestContract(unknown), /missing or unexpected fields/);
  const privateLeak = { ...original, privateControls: { identity: "synthetic" } };
  assert.throws(() => validateFrozenRequestContract(privateLeak), /missing or unexpected fields/);
  const executable = { ...original, command: "synthetic" };
  assert.throws(() => validateFrozenRequestContract(executable), /cannot control executable behavior/);
  const { requestContractHash, ...wrongHandlerCore } = original;
  const wrongHandler = sealRecord({ ...wrongHandlerCore, handlerContract: { ...original.handlerContract, intakeValue: "resale" } }, "requestContractHash");
  assert.throws(() => validateFrozenRequestContract(wrongHandler), /does not match its customer purpose/);
});

test("C: duplicate, missing, and wrong-object request photo bindings fail", async () => {
  const { frozen } = await build();
  const duplicate = structuredClone(frozen.requestContracts[0]); duplicate.inputAssets[1].sha256 = duplicate.inputAssets[0].sha256;
  assert.throws(() => validateFrozenRequestContract(duplicate), /duplicate photo binding/);
  const missing = structuredClone(frozen.requestContracts[0]); missing.inputAssets.pop();
  assert.throws(() => validateFrozenRequestContract(missing), /false == true|length/);
  const wrong = structuredClone(frozen.requestContracts[0]); wrong.inputAssets[1].photoId = "V2-OBJ-002-A";
  assert.throws(() => validateFrozenRequestContract(wrong), /different object/);
});

test("E-K: release, package, input, control, provenance, plan, specification, and scoring drift invalidate the freeze", async () => {
  const prepared = await build();
  assert.equal(verifyFrozenBenchmark(prepared.frozen, prepared.inputs).valid, true);
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, sourceRepositoryHead: "c".repeat(40) }), /aggregate or bound material changed/);
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, sourceVersion: "1.12.13" }), /aggregate or bound material changed/);
  for (const field of ["sourcePackageSha256", "packageManifestFileHash", "checksumFileHash"]) {
    const packageBoundary = { ...prepared.inputs.packageBoundary, [field]: sha256Json({ drift: field }) };
    assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, packageBoundary }), /aggregate or bound material changed/);
  }
  const assets = new Map(prepared.inputs.assetBytesByPath); assets.set(prepared.inputs.intakeManifest.objects[0].photos[0].path, Buffer.from("mutated"));
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, assetBytesByPath: assets }), /byte count mismatch|SHA-256 mismatch/);
  const originals = new Map(prepared.inputs.sourceOriginalBytesByPath); originals.set(prepared.inputs.sourceOriginalInventory[0].evaluatorOnlyRelativePath, Buffer.from("mutated"));
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, sourceOriginalBytesByPath: originals }), /byte count mismatch|hash mismatch/);
  const controls = structuredClone(prepared.inputs.privateControls); controls.objects[0].safetyExpectation = "Changed synthetic safety rule";
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, privateControls: controls }), /aggregate or bound material changed/);
  const provenance = structuredClone(prepared.inputs.provenanceRecords); provenance[0].license = "Changed synthetic license";
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, provenanceRecords: provenance }), /aggregate or bound material changed/);
  const plan = structuredClone(prepared.inputs.analysisPlan); plan.analyses[0].purpose = "RESALE";
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, analysisPlan: plan }), /analysis plan mapping differs/);
  const anchorPlan = structuredClone(prepared.inputs.analysisPlan); anchorPlan.analyses[14].objectId = "V2-OBJ-002";
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, analysisPlan: anchorPlan }), /analysis plan mapping differs/);
  const shortPlan = structuredClone(prepared.inputs.analysisPlan); shortPlan.analyses.pop();
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, analysisPlan: shortPlan }), /analysis plan mapping differs/);
  const spec = structuredClone(prepared.inputs.benchmarkSpec); spec.title += " changed";
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, benchmarkSpec: spec }), /aggregate or bound material changed/);
  const coverage = structuredClone(prepared.inputs.coverageContract); coverage.objectCount += 1;
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, coverageContract: coverage }), /object count|mismatch|equal/);
  const scoring = structuredClone(prepared.inputs.scoringContract); scoring.capabilities[0].applicability += " changed";
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, scoringContract: scoring }), /aggregate or bound material changed/);
});

test("L-M: 26 unique requests and every required component bind the complete aggregate", async () => {
  const { frozen, inputs } = await build();
  assert.equal(frozen.requestContracts.length, 26);
  assert.equal(new Set(frozen.requestContracts.map((request) => request.requestContractHash)).size, 26);
  assert.equal(frozen.freezeManifest.schemaVersion, FREEZE_SCHEMA_VERSION);
  assert.equal(validateFreezeManifest(frozen.freezeManifest).valid, true);
  for (const key of ["sanitizedInputAggregateHash", "sourceOriginalAggregateHash", "publicIntakeManifestHash", "privateControlAggregateHash", "provenanceAggregateHash", "analysisPlanHash", "requestAggregateHash", "specificationHash", "coverageHash", "scoringHash", "completeFrozenAggregateHash"]) assert.match(frozen.freezeManifest[key], /^[a-f0-9]{64}$/);
  assert.equal(frozen.freezeManifest.frozenArtifactRoot, expectedFreezeArtifactPath(frozen.freezeManifest.completeFrozenAggregateHash));
  const missing = { ...frozen, requestContracts: frozen.requestContracts.slice(1) };
  const duplicate = { ...frozen, requestContracts: [...frozen.requestContracts.slice(0, -1), frozen.requestContracts[0]] };
  const extra = { ...frozen, requestContracts: [...frozen.requestContracts, frozen.requestContracts[0]] };
  assert.throws(() => verifyFrozenBenchmark(missing, inputs), /frozen request contract changed|aggregate or bound material changed/);
  assert.throws(() => verifyFrozenBenchmark(duplicate, inputs), /frozen request contract changed|aggregate or bound material changed/);
  assert.throws(() => verifyFrozenBenchmark(extra, inputs), /frozen request contract changed|aggregate or bound material changed/);
});

test("N-O: the canonical freeze receipt is strict and grants no implied authority", async () => {
  const { frozen } = await build();
  assert.equal(frozen.freezeReceipt.schemaVersion, FREEZE_RECEIPT_SCHEMA_VERSION);
  assert.equal(validateFreezeReceipt(frozen.freezeReceipt, frozen.freezeManifest).executionAuthorized, false);
  for (const key of ["executionConsentAuthorized", "invocationReservationAuthorized", "providerAccessAuthorized", "networkAccessAuthorized", "scoringAuthorized", "deploymentAuthorized"]) assert.equal(frozen.freezeReceipt[key], false);
  assert.equal(impliedAuthorityDisposition(frozen.freezeReceipt).executionAuthorized, false);
  assert.equal(impliedAuthorityDisposition({ filename: "freeze-receipt.json", freeFormText: "approved" }).executionAuthorized, false);
});

test("P-V: path derivation, arbitrary-execution denial, runtime isolation, and private separation hold", async () => {
  const prepared = await build();
  assert.equal(prepared.frozen.freezeManifest.frozenArtifactRoot.endsWith(prepared.frozen.freezeManifest.completeFrozenAggregateHash), true);
  const unsafe = { ...prepared.inputs.packageBoundary, candidateSetId: "../synthetic-traversal" };
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, packageBoundary: unsafe }), /candidate-set ID is invalid/);
  const executable = structuredClone(prepared.inputs.provenanceRecords); executable[0].modulePath = "synthetic-module";
  assert.throws(() => freezeBenchmark({ ...prepared.inputs, provenanceRecords: executable }), /cannot control executable behavior/);
  const liveFiles = ["api/generate-listing.js", "server.ps1", "public/app.js", "lib/object-intelligence/index.js", "lib/object-intelligence/search-plan.js"];
  const liveSources = await Promise.all(liveFiles.map((file) => readFile(path.join(repositoryRoot, ...file.split("/")), "utf8")));
  assert.doesNotMatch(liveSources.join("\n"), /blind-object-v2|freeze-store\.mjs|freeze-receipt\.schema/);
  const publicRequests = JSON.stringify(prepared.frozen.requestContracts);
  assert.equal(publicRequests.includes("PRIVATE_EVALUATOR_ONLY"), false);
  assert.equal(publicRequests.includes("example.invalid"), false);
});

test("Q-S: atomic failure cleans pending state and identical persistence is idempotent", async () => {
  const prepared = await build();
  const temporary = await mkdtemp(path.join(os.tmpdir(), "v2-freeze-authority-"));
  const storage = path.join(temporary, "freezes");
  try {
    await assert.rejects(() => persistFrozenBenchmark({ frozen: prepared.frozen, intakeManifest: prepared.inputs.intakeManifest, privateControls: prepared.inputs.privateControls, assetBytesByPath: prepared.inputs.assetBytesByPath, sourceOriginalBytesByPath: prepared.inputs.sourceOriginalBytesByPath, storageRootOverrideForTest: storage, failureAfterFileCountForTest: 3 }), (error) => {
      assert.match(error.message, /synthetic atomic-write failure/);
      assert.equal(error.freezeConstructionState, FREEZE_CONSTRUCTION_STATE.WRITE_FAILED);
      return true;
    });
    assert.deepEqual(await readdir(storage), []);
    const first = await persistFrozenBenchmark({ frozen: prepared.frozen, intakeManifest: prepared.inputs.intakeManifest, privateControls: prepared.inputs.privateControls, assetBytesByPath: prepared.inputs.assetBytesByPath, sourceOriginalBytesByPath: prepared.inputs.sourceOriginalBytesByPath, storageRootOverrideForTest: storage });
    assert.equal(first.constructionState, FREEZE_CONSTRUCTION_STATE.FROZEN_AWAITING_CONSENT);
    assert.equal(first.existingIdenticalFreezeReadback, false);
    const second = await persistFrozenBenchmark({ frozen: prepared.frozen, intakeManifest: prepared.inputs.intakeManifest, privateControls: prepared.inputs.privateControls, assetBytesByPath: prepared.inputs.assetBytesByPath, sourceOriginalBytesByPath: prepared.inputs.sourceOriginalBytesByPath, storageRootOverrideForTest: storage });
    assert.equal(second.constructionState, FREEZE_CONSTRUCTION_STATE.EXISTING_IDENTICAL_FREEZE_READBACK);
    assert.equal(second.generatedFileCount, 0);
    assert.equal(second.receiptHash, first.receiptHash);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("R-T: mismatched existing and corrupted freezes fail closed without overwrite", async () => {
  const prepared = await build();
  const temporary = await mkdtemp(path.join(os.tmpdir(), "v2-freeze-corruption-"));
  const storage = path.join(temporary, "freezes");
  try {
    await persistFrozenBenchmark({ frozen: prepared.frozen, intakeManifest: prepared.inputs.intakeManifest, privateControls: prepared.inputs.privateControls, assetBytesByPath: prepared.inputs.assetBytesByPath, sourceOriginalBytesByPath: prepared.inputs.sourceOriginalBytesByPath, storageRootOverrideForTest: storage });
    const root = path.join(storage, prepared.frozen.freezeManifest.completeFrozenAggregateHash);
    const manifestPath = path.join(root, "freeze-manifest.json");
    await writeFile(manifestPath, Buffer.from("corrupt"));
    await assert.rejects(() => persistFrozenBenchmark({ frozen: prepared.frozen, intakeManifest: prepared.inputs.intakeManifest, privateControls: prepared.inputs.privateControls, assetBytesByPath: prepared.inputs.assetBytesByPath, sourceOriginalBytesByPath: prepared.inputs.sourceOriginalBytesByPath, storageRootOverrideForTest: storage }), /byte count mismatch|hash mismatch|bytes differ/);
    assert.equal((await readFile(manifestPath, "utf8")), "corrupt");
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("W-Z: dry construction is non-authoritative, network-free, and preserves all three contracts", async () => {
  const originalFetch = globalThis.fetch;
  let networkAttempts = 0;
  globalThis.fetch = async () => { networkAttempts += 1; throw new Error("network denied"); };
  try {
    const { frozen, benchmarkSpec, coverageContract, scoringContract } = await build();
    assert.equal(frozen.constructionState, FREEZE_CONSTRUCTION_STATE.DRY_RUN_VALIDATED);
    assert.equal(frozen.state, PREPARATION_STATE.FROZEN_AWAITING_CONSENT);
    assert.equal(frozen.freezeReceipt.executionConsentAuthorized, false);
    assert.equal(sha256Json(benchmarkSpec), EXPECTED_SPECIFICATION_HASH);
    assert.equal(sha256Json(coverageContract), EXPECTED_COVERAGE_HASH);
    assert.equal(sha256Json(scoringContract), EXPECTED_SCORING_HASH);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(networkAttempts, 0);
});

test("canonical hashing rejects unsupported and non-finite values", () => {
  assert.throws(() => sha256Json({ value: Number.NaN }), /non-finite/);
  assert.throws(() => sha256Json({ value: undefined }), /unsupported value/);
  const sealed = sealRecord({ value: 1 }, "hash");
  assert.match(sealed.hash, /^[a-f0-9]{64}$/);
  assert.deepEqual(parseJsonStrict('{"outer":{"key":1}}'), { outer: { key: 1 } });
  assert.throws(() => parseJsonStrict('{"outer":{"key":1,"\\u006bey":2}}'), /duplicate object key/);
});
