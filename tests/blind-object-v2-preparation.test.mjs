import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  PREPARATION_STATE,
  PROVIDER_CALL_CEILINGS,
  PURPOSES,
  REQUIRED_STOP_CONDITIONS,
  assertNotLegacyHash,
  buildLegacyV1RejectionIndex,
  createAwaitingPreparationReceipt,
  freezeBenchmark,
  hashWithoutField,
  identityFingerprint,
  impliedAuthorityDisposition,
  sha256Bytes,
  sha256Json,
  validateConsentReceipt,
  validateCoverageContract,
  validateExecutionAuthorization,
  validateIntakeManifest,
  validatePrivateControls,
  validateScoringContract,
  verifyFrozenBenchmark
} from "../benchmarks/blind-object-v2/scripts/protocol.mjs";
import { runPreparation } from "../benchmarks/blind-object-v2/scripts/prepare-benchmark.mjs";
import { verifyFrozenResultIntegrity } from "../benchmarks/blind-object-v1-execution-v1/scripts/result-integrity.mjs";
import { snapshotHistoricalTree } from "../scripts/run-experience-reflection.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const v2Root = path.join(repositoryRoot, "benchmarks", "blind-object-v2");
const v1Root = path.join(repositoryRoot, "benchmarks", "blind-object-v1");
const phase6ARoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1-results", "phase6a-e3caa2fd");
const SOURCE_COMMIT = "a".repeat(40);
const VERSION = "1.12.11";

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

function syntheticFixture() {
  const assetBytesByPath = new Map();
  const purposes = [
    ...Array(4).fill("PERSONAL_BUY"),
    ...Array(4).fill("RESALE"),
    ...Array(3).fill("WHATS_IT_WORTH"),
    ...Array(3).fill("MARKETPLACE_LISTING")
  ];
  const anchors = ["V2-OBJ-001", "V2-OBJ-005", "V2-OBJ-009", "V2-OBJ-012"];
  const coverageFlagByIndex = [
    "ordinaryCurrentRetail",
    "vintageOrCollectible",
    "householdEquipmentOrTool",
    "apparelOrPersonalAccessory",
    "packagingDependentIdentity",
    "modelOrIdentifierDependentIdentity",
    "visuallyAmbiguous",
    "additionalCustomerInformationNecessary",
    "safetyRelevantWithoutHazardousInstructions"
  ];
  const objects = Array.from({ length: 14 }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    const objectId = `V2-OBJ-${number}`;
    const lane = index < 8 ? "PHOTO_ONLY" : index < 12 ? "PHOTO_PLUS_VISIBLE_MARKINGS" : "BARCODE_OR_MODEL";
    const description = lane === "PHOTO_ONLY" ? "" : `Synthetic visible marking for independent fixture ${number}`;
    const photos = ["A", "B"].map((letter) => {
      const photoPath = `assets/v2-obj-${number}-${letter.toLowerCase()}.jpg`;
      const bytes = Buffer.from(`synthetic-test-only-v2-photo-${number}-${letter}`, "utf8");
      assetBytesByPath.set(photoPath, bytes);
      return {
        assetId: `${objectId}-${letter}`,
        path: photoPath,
        mediaType: "image/jpeg",
        bytes: bytes.length,
        sha256: sha256Bytes(bytes)
      };
    });
    const coverage = Object.fromEntries(coverageFlagByIndex.map((flag) => [flag, false]));
    if (index < coverageFlagByIndex.length) coverage[coverageFlagByIndex[index]] = true;
    const objectClass = ["CURRENT_RETAIL", "VINTAGE_COLLECTIBLE", "HOUSEHOLD_TOOL", "APPAREL_ACCESSORY"][index] || "OTHER_REAL_WORLD_OBJECT";
    return {
      objectId,
      lane,
      primaryPurpose: purposes[index],
      objectClass,
      description,
      descriptionSha256: sha256Bytes(Buffer.from(description, "utf8")),
      photos,
      coverage,
      humanAttestation: {
        attestationId: `ATTEST-V2-SYNTHETIC-${number}`,
        attestedAt: "2026-08-07T12:00:00.000Z",
        realWorldObjectIsNew: true,
        photographsAreNew: true,
        notPreviouslyBenchmarked: true,
        notUsedToDesignProductionRepair: true,
        perceptualUniquenessReviewedByHuman: true,
        preparationUseAuthorized: true,
        providerTransmissionAuthorized: false,
        benchmarkExecutionAuthorized: false
      }
    };
  });
  const analyses = objects.map((object, index) => ({
    analysisId: `V2-RUN-${String(index + 1).padStart(3, "0")}`,
    objectId: object.objectId,
    purpose: object.primaryPurpose,
    runType: "PRINCIPAL"
  }));
  for (const objectId of anchors) {
    const object = objects.find((entry) => entry.objectId === objectId);
    for (const purpose of PURPOSES.filter((entry) => entry !== object.primaryPurpose)) {
      analyses.push({
        analysisId: `V2-RUN-${String(analyses.length + 1).padStart(3, "0")}`,
        objectId,
        purpose,
        runType: "ANCHOR_PURPOSE"
      });
    }
  }
  const manifest = {
    schemaVersion: "2.0",
    benchmarkId: "blind-object-v2",
    state: "INTAKE_COMPLETE",
    createdAt: "2026-08-07T12:00:00.000Z",
    purposeInvarianceAnchorObjectIds: anchors,
    objects,
    analyses
  };
  const privateControls = {
    schemaVersion: "2.0",
    benchmarkId: "blind-object-v2",
    visibility: "PRIVATE_EVALUATOR_ONLY",
    objects: objects.map((object, index) => {
      const authoritativeIdentity = `Synthetic independent evaluator identity ${String(index + 1).padStart(3, "0")}`;
      return {
        objectId: object.objectId,
        authoritativeIdentity,
        identityFingerprintSha256: identityFingerprint(authoritativeIdentity),
        acceptedIdentityBoundaries: ["Synthetic accepted identity boundary"],
        rejectedDistractors: ["Synthetic adjacent but different object"],
        exactEvidenceExpectations: ["Synthetic exact evidence expectation"],
        customerInputRequirement: object.coverage.additionalCustomerInformationNecessary ? "Request one synthetic missing discriminator" : "No additional input required when evidence is sufficient",
        safetyExpectation: object.coverage.safetyRelevantWithoutHazardousInstructions ? "Give a cautious remove-from-service disposition without repair instructions" : "No special safety disposition expected",
        permittedCautiousOutcomes: ["Insufficient evidence is permitted when supported"],
        prohibitedUnsupportedClaims: ["Do not invent identity, price, source, or transaction support"]
      };
    }),
    analyses: analyses.map((analysis) => ({
      analysisId: analysis.analysisId,
      purposeObligations: [`Provide the synthetic ${analysis.purpose} action obligation`],
      permittedTerminalStates: ["STOP_COMPLETE", "STOP_INSUFFICIENT_EVIDENCE"],
      requiredLimitations: ["Disclose unsupported exactness or market evidence"]
    }))
  };
  return { manifest, privateControls, assetBytesByPath };
}

async function preparedFixture() {
  const [{ benchmarkSpec, coverageContract, scoringContract }, legacyIndex] = await Promise.all([
    contracts(),
    buildLegacyV1RejectionIndex()
  ]);
  const fixture = syntheticFixture();
  const inputs = { ...fixture, coverageContract, scoringContract, legacyIndex, sourceCommit: SOURCE_COMMIT, version: VERSION, intakeManifest: fixture.manifest };
  const frozen = freezeBenchmark(inputs);
  return { benchmarkSpec, coverageContract, scoringContract, legacyIndex, fixture, inputs, frozen };
}

function consentFor(freezeManifest) {
  const core = {
    schemaVersion: "2.0",
    recordType: "PRE_EXECUTION_CONSENT_RECEIPT",
    decision: "CONSENT_TO_SEPARATELY_AUTHORIZED_EXACTLY_ONCE_EXECUTION",
    benchmarkId: "blind-object-v2",
    frozenInputAggregateHash: freezeManifest.frozenInputAggregateHash,
    privateControlAggregateHash: freezeManifest.privateControlAggregateHash,
    scoringContractHash: freezeManifest.scoringContractHash,
    freezeAggregateHash: freezeManifest.freezeAggregateHash,
    repositoryCommit: freezeManifest.sourceCommit,
    version: freezeManifest.version,
    requestCount: freezeManifest.requestCount,
    operatorApprovalId: "CONSENT-V2-SYNTHETIC-0001",
    approvedAt: "2026-08-07T13:00:00.000Z"
  };
  return { ...core, receiptHash: sha256Json(core) };
}

function authorizationFor(freezeManifest, consentReceipt, overrides = {}) {
  const core = {
    schemaVersion: "2.0",
    recordType: "EXACTLY_ONCE_EXECUTION_AUTHORIZATION",
    decision: "AUTHORIZE_EXACTLY_ONCE_EXECUTION",
    benchmarkId: "blind-object-v2",
    frozenInputAggregateHash: freezeManifest.frozenInputAggregateHash,
    privateControlAggregateHash: freezeManifest.privateControlAggregateHash,
    scoringContractHash: freezeManifest.scoringContractHash,
    freezeAggregateHash: freezeManifest.freezeAggregateHash,
    repositoryCommit: freezeManifest.sourceCommit,
    version: freezeManifest.version,
    requestCount: freezeManifest.requestCount,
    provider: "OPENAI",
    model: "synthetic-model",
    providerCallCeilings: { ...PROVIDER_CALL_CEILINGS },
    maximumAuthorizedCostUsd: 25,
    consentReceiptHash: consentReceipt.receiptHash,
    invocationId: "V2-INV-synthetic-0001",
    outputRoot: "benchmarks/blind-object-v2-results/v2-synthetic-0001",
    networkPolicy: {
      externalNetworkAuthorized: true,
      allowedProvider: "OPENAI",
      webSearchPolicy: "BENCHMARK_CONFIGURED_ONLY",
      directPagePolicy: "PRODUCT_BOUNDED_ONLY"
    },
    stopConditions: [...REQUIRED_STOP_CONDITIONS],
    authorizedAt: "2026-08-07T13:01:00.000Z",
    ...overrides
  };
  return { ...core, authorizationHash: sha256Json(core) };
}

test("A: exact V1 photos, descriptions, object identities, object records, and request hashes are rejected", async () => {
  const [{ coverageContract }, legacyIndex, v1Manifest, v1Input, v1Truth] = await Promise.all([
    contracts(),
    buildLegacyV1RejectionIndex(),
    loadJson("benchmarks/blind-object-v1/manifest.json"),
    loadJson("benchmarks/blind-object-v1/input-cases.json"),
    loadJson("benchmarks/blind-object-v1/ground-truth.json")
  ]);

  const photoReuse = syntheticFixture();
  photoReuse.manifest.objects[0].photos[0].sha256 = v1Manifest.assets[0].sha256;
  assert.throws(() => validateIntakeManifest({ manifest: photoReuse.manifest, coverageContract, assetBytesByPath: photoReuse.assetBytesByPath, legacyIndex }), /rejects a Phase 6A\/V1 photo hash/);

  const visibleDescription = v1Input.cases.find((entry) => entry.description);
  const descriptionReuse = syntheticFixture();
  descriptionReuse.manifest.objects[8].description = visibleDescription.description;
  descriptionReuse.manifest.objects[8].descriptionSha256 = sha256Bytes(Buffer.from(visibleDescription.description));
  assert.throws(() => validateIntakeManifest({ manifest: descriptionReuse.manifest, coverageContract, assetBytesByPath: descriptionReuse.assetBytesByPath, legacyIndex }), /descriptionExact hash/);

  const identityReuse = syntheticFixture();
  identityReuse.privateControls.objects[0].authoritativeIdentity = v1Truth.cases[0].bestSupportedIdentity;
  identityReuse.privateControls.objects[0].identityFingerprintSha256 = identityFingerprint(v1Truth.cases[0].bestSupportedIdentity);
  assert.throws(() => validatePrivateControls({ controls: identityReuse.privateControls, intakeManifest: identityReuse.manifest, legacyIndex }), /identity hash/);

  assert.throws(() => assertNotLegacyHash("objectRecord", [...legacyIndex.objectRecordHashes][0], legacyIndex), /objectRecord hash/);
  assert.throws(() => assertNotLegacyHash("requestInput", [...legacyIndex.requestInputHashes][0], legacyIndex), /requestInput hash/);
  assert.ok(legacyIndex.historicalRequestHashes.size > 0, "historical request hashes must be indexed");
  assert.throws(() => assertNotLegacyHash("historicalRequest", [...legacyIndex.historicalRequestHashes][0], legacyIndex), /historicalRequest hash/);
});

test("B: a valid synthetic V2 intake is accepted without execution", async () => {
  const [{ coverageContract }, legacyIndex] = await Promise.all([contracts(), buildLegacyV1RejectionIndex()]);
  const fixture = syntheticFixture();
  const result = validateIntakeManifest({ manifest: fixture.manifest, coverageContract, assetBytesByPath: fixture.assetBytesByPath, legacyIndex });
  assert.equal(result.valid, true);
  assert.equal(result.state, PREPARATION_STATE.VALIDATED);
  assert.equal(result.objectCount, 14);
  assert.equal(result.analysisCount, 26);
  assert.equal(result.photoCount, 28);
});

test("C: duplicate photographs, descriptions, object records, and request inputs fail closed", async () => {
  const [{ coverageContract }, legacyIndex] = await Promise.all([contracts(), buildLegacyV1RejectionIndex()]);
  const duplicatePhoto = syntheticFixture();
  duplicatePhoto.manifest.objects[1].photos[0].sha256 = duplicatePhoto.manifest.objects[0].photos[0].sha256;
  assert.throws(() => validateIntakeManifest({ manifest: duplicatePhoto.manifest, coverageContract, assetBytesByPath: duplicatePhoto.assetBytesByPath, legacyIndex }), /duplicate V2 photograph hash/);

  const duplicateDescription = syntheticFixture();
  duplicateDescription.manifest.objects[9].description = duplicateDescription.manifest.objects[8].description;
  duplicateDescription.manifest.objects[9].descriptionSha256 = duplicateDescription.manifest.objects[8].descriptionSha256;
  assert.throws(() => validateIntakeManifest({ manifest: duplicateDescription.manifest, coverageContract, assetBytesByPath: duplicateDescription.assetBytesByPath, legacyIndex }), /duplicates a V2 description/);

  const duplicateObject = syntheticFixture();
  duplicateObject.manifest.objects[1].photos = structuredClone(duplicateObject.manifest.objects[0].photos);
  assert.throws(() => validateIntakeManifest({ manifest: duplicateObject.manifest, coverageContract, assetBytesByPath: duplicateObject.assetBytesByPath, legacyIndex }), /photo asset ID mismatch|duplicate V2 photograph|duplicates a V2 object record/);

  const duplicateRequest = syntheticFixture();
  duplicateRequest.manifest.analyses[14].purpose = duplicateRequest.manifest.analyses[0].purpose;
  assert.throws(() => validateIntakeManifest({ manifest: duplicateRequest.manifest, coverageContract, assetBytesByPath: duplicateRequest.assetBytesByPath, legacyIndex }), /duplicates a V2 request input/);
});

test("D: lane, purpose, class, ambiguity, customer-input, safety, and anchor coverage are enforced", async () => {
  const [{ coverageContract }, legacyIndex] = await Promise.all([contracts(), buildLegacyV1RejectionIndex()]);
  const laneFailure = syntheticFixture();
  laneFailure.manifest.objects[7].lane = "PHOTO_PLUS_VISIBLE_MARKINGS";
  laneFailure.manifest.objects[7].description = "Synthetic lane mutation";
  laneFailure.manifest.objects[7].descriptionSha256 = sha256Bytes(Buffer.from(laneFailure.manifest.objects[7].description));
  assert.throws(() => validateIntakeManifest({ manifest: laneFailure.manifest, coverageContract, assetBytesByPath: laneFailure.assetBytesByPath, legacyIndex }), /laneObjectCounts|PHOTO_ONLY|deep-equal/);

  for (const flag of ["visuallyAmbiguous", "additionalCustomerInformationNecessary", "safetyRelevantWithoutHazardousInstructions"]) {
    const failure = syntheticFixture();
    failure.manifest.objects.forEach((entry) => { entry.coverage[flag] = false; });
    assert.throws(() => validateIntakeManifest({ manifest: failure.manifest, coverageContract, assetBytesByPath: failure.assetBytesByPath, legacyIndex }), new RegExp(flag));
  }

  const anchorFailure = syntheticFixture();
  anchorFailure.manifest.purposeInvarianceAnchorObjectIds = ["V2-OBJ-001", "V2-OBJ-002", "V2-OBJ-003", "V2-OBJ-004"];
  assert.throws(() => validateIntakeManifest({ manifest: anchorFailure.manifest, coverageContract, assetBytesByPath: anchorFailure.assetBytesByPath, legacyIndex }), /non-anchor requires one analysis|anchor requires four analyses/);
});

test("E: private controls are hash-bound but cannot enter request contracts or customer payload fields", async () => {
  const { fixture, frozen } = await preparedFixture();
  const renderedRequests = JSON.stringify(frozen.requestContracts);
  for (const control of fixture.privateControls.objects) {
    assert.equal(renderedRequests.includes(control.authoritativeIdentity), false);
    control.rejectedDistractors.forEach((value) => assert.equal(renderedRequests.includes(value), false));
  }
  assert.equal(frozen.privateControlsIncludedInRequests, false);
  assert.equal(frozen.requestContracts.every((entry) => entry.privateControlMaterialIncluded === false), true);
  assert.equal(frozen.requestContracts.every((entry) => !Object.hasOwn(entry, "privateControls")), true);
});

test("F: input, control, manifest, scoring, and request changes invalidate a frozen benchmark", async () => {
  const prepared = await preparedFixture();
  assert.equal(verifyFrozenBenchmark(prepared.frozen, prepared.inputs).valid, true);

  const changedManifestInputs = structuredClone(prepared.inputs);
  changedManifestInputs.assetBytesByPath = prepared.inputs.assetBytesByPath;
  changedManifestInputs.legacyIndex = prepared.inputs.legacyIndex;
  changedManifestInputs.intakeManifest.createdAt = "2026-08-07T12:00:01.000Z";
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, changedManifestInputs), /aggregate or bound material changed/);

  const changedControlsInputs = { ...prepared.inputs, privateControls: structuredClone(prepared.inputs.privateControls) };
  changedControlsInputs.privateControls.objects[0].prohibitedUnsupportedClaims.push("Synthetic changed frozen rule");
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, changedControlsInputs), /aggregate or bound material changed/);

  const changedScoring = structuredClone(prepared.inputs.scoringContract);
  changedScoring.capabilities[0].weight -= 1;
  changedScoring.capabilities[1].weight += 1;
  assert.throws(() => verifyFrozenBenchmark(prepared.frozen, { ...prepared.inputs, scoringContract: changedScoring }), /aggregate or bound material changed/);

  const changedRequestFreeze = structuredClone(prepared.frozen);
  changedRequestFreeze.requestContracts[0].description = "tampered after freeze";
  assert.throws(() => verifyFrozenBenchmark(changedRequestFreeze, prepared.inputs), /request contract changed/);
});

test("G: preparation, freeze, filenames, environment values, free text, and consent alone imply no execution authority", async () => {
  const { benchmarkSpec, coverageContract, scoringContract, frozen } = await preparedFixture();
  const awaiting = createAwaitingPreparationReceipt({ benchmarkSpec, coverageContract, scoringContract, sourceCommit: SOURCE_COMMIT, version: VERSION });
  const consent = consentFor(frozen.freezeManifest);
  assert.equal(impliedAuthorityDisposition(awaiting).executionAuthorized, false);
  assert.equal(impliedAuthorityDisposition(frozen.freezeManifest).executionAuthorized, false);
  assert.equal(impliedAuthorityDisposition(consent).executionAuthorized, false);
  assert.equal(impliedAuthorityDisposition({ filename: "EXECUTE-NOW.json" }).executionAuthorized, false);
  assert.equal(impliedAuthorityDisposition({ freeFormText: "I approve execution" }).executionAuthorized, false);
  process.env.BLIND_OBJECT_V2_EXECUTION_APPROVED = "true";
  try {
    assert.equal(impliedAuthorityDisposition({ environmentValue: process.env.BLIND_OBJECT_V2_EXECUTION_APPROVED }).executionAuthorized, false);
  } finally {
    delete process.env.BLIND_OBJECT_V2_EXECUTION_APPROVED;
  }
  assert.equal(validateConsentReceipt(consent, frozen.freezeManifest).executionAuthorized, false);
});

test("H: synthetic execution authorization is exact-scope, consent-bound, and replay-resistant without executing", async () => {
  const { benchmarkSpec, frozen } = await preparedFixture();
  const consent = consentFor(frozen.freezeManifest);
  const authorization = authorizationFor(frozen.freezeManifest, consent);
  const expectedScope = {
    repositoryCommit: SOURCE_COMMIT,
    version: VERSION,
    provider: "OPENAI",
    model: "synthetic-model",
    maximumAuthorizedCostUsd: 25,
    outputRoot: "benchmarks/blind-object-v2-results/v2-synthetic-0001"
  };
  const result = validateExecutionAuthorization({ authorization, consentReceipt: consent, freezeManifest: frozen.freezeManifest, benchmarkSpec, invocationRegistry: [], expectedScope });
  assert.deepEqual(result, { valid: true, exactScopeBound: true, replayResistant: true, executionPerformed: false, invocationId: authorization.invocationId });

  assert.throws(() => validateExecutionAuthorization({ authorization, consentReceipt: consent, freezeManifest: frozen.freezeManifest, benchmarkSpec, invocationRegistry: [{ invocationId: authorization.invocationId, freezeAggregateHash: "0".repeat(64), status: "STARTED" }], expectedScope }), /already been reserved or consumed/);
  const anotherId = authorizationFor(frozen.freezeManifest, consent, { invocationId: "V2-INV-synthetic-0002" });
  assert.throws(() => validateExecutionAuthorization({ authorization: anotherId, consentReceipt: consent, freezeManifest: frozen.freezeManifest, benchmarkSpec, invocationRegistry: [{ invocationId: "V2-INV-prior-0001", freezeAggregateHash: frozen.freezeManifest.freezeAggregateHash, status: "CONSUMED" }], expectedScope }), /already has an invocation/);

  const wrongModel = authorizationFor(frozen.freezeManifest, consent, { model: "different-model" });
  assert.throws(() => validateExecutionAuthorization({ authorization: wrongModel, consentReceipt: consent, freezeManifest: frozen.freezeManifest, benchmarkSpec, invocationRegistry: [], expectedScope }), /Expected values to be strictly equal/);
});

test("I: intake and private controls cannot select commands, modules, executables, environment names, or endpoints", async () => {
  const [{ coverageContract }, legacyIndex] = await Promise.all([contracts(), buildLegacyV1RejectionIndex()]);
  for (const key of ["command", "modulePath", "executablePath", "environmentName", "providerEndpoint", "dynamicImport"]) {
    const fixture = syntheticFixture();
    fixture.manifest.objects[0][key] = "synthetic-forbidden-control";
    assert.throws(() => validateIntakeManifest({ manifest: fixture.manifest, coverageContract, assetBytesByPath: fixture.assetBytesByPath, legacyIndex }), /cannot control executable behavior/);
  }
  const privateFixture = syntheticFixture();
  privateFixture.privateControls.objects[0].scriptPath = "synthetic-forbidden-script";
  assert.throws(() => validatePrivateControls({ controls: privateFixture.privateControls, intakeManifest: privateFixture.manifest, legacyIndex }), /cannot control executable behavior/);
});

test("J: scoring definitions and zero-denominator behavior are fixed and hash-bound", async () => {
  const { scoringContract } = await contracts();
  const validated = validateScoringContract(scoringContract);
  assert.equal(validated.valid, true);
  assert.equal(scoringContract.capabilities.length, 16);
  assert.equal(scoringContract.capabilities.reduce((sum, entry) => sum + entry.weight, 0), 100);
  assert.equal(scoringContract.denominatorPolicy.zeroApplicableCasesDisposition, "NOT_APPLICABLE");
  assert.equal(scoringContract.denominatorPolicy.zeroApplicableCasesCountAsSuccess, false);
  const changed = structuredClone(scoringContract);
  changed.capabilities[0].weight -= 1;
  changed.capabilities[1].weight += 1;
  assert.notEqual(validateScoringContract(changed).hash, validated.hash);
});

test("K: V2 preparation and private-control modules remain isolated from the live customer path", async () => {
  const liveFiles = [
    "api/generate-listing.js",
    "server.ps1",
    "public/app.js",
    "lib/object-intelligence/index.js",
    "lib/object-intelligence/state.js",
    "lib/object-intelligence/search-plan.js"
  ];
  const sources = await Promise.all(liveFiles.map((file) => readFile(path.join(repositoryRoot, ...file.split("/")), "utf8")));
  assert.doesNotMatch(sources.join("\n"), /blind-object-v2|private-controls\.schema|prepare-benchmark\.mjs|scripts\/protocol\.mjs/);
});

test("L: preparation remains hard-network-denied with zero provider attempts", async () => {
  const originalFetch = globalThis.fetch;
  let networkAttempts = 0;
  globalThis.fetch = async () => {
    networkAttempts += 1;
    throw new Error("external network denied in Phase 7B test");
  };
  try {
    const prepared = await preparedFixture();
    assert.equal(prepared.frozen.freezeManifest.networkRequestCount, 0);
    assert.equal(prepared.frozen.freezeManifest.providerCallCount, 0);
    assert.equal(prepared.frozen.freezeManifest.frozenRequestExecutionCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
  assert.equal(networkAttempts, 0);
});

test("M: Phase 6A, Phase 6G, Phase 6H, and the historical tree remain byte-identical", async () => {
  const verified = await verifyFrozenResultIntegrity(phase6ARoot);
  assert.equal(verified.requests.length, 26);
  assert.equal(verified.responses.length, 26);
  assert.equal(verified.manifest.aggregateResultSha256, "6ebf00c3d9244fdfa83bc8a620d70c6ee3973ba1b6724ddc2de1788b25d1c4d4");
  const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
  const [phase6G, phase6H, tree] = await Promise.all([
    readFile(path.join(repositoryRoot, "test-results", "phase6g-retrospective-reflection.json")),
    readFile(path.join(repositoryRoot, "test-results", "phase6h-lesson-gate.json")),
    snapshotHistoricalTree(path.join(repositoryRoot, "benchmarks", "blind-object-v1-results"))
  ]);
  assert.equal(sha(phase6G), "fe887a339f565f968dcab84793a37f430360cb331c18d693495d73ab1fb31721");
  assert.equal(sha(phase6H), "34cc88e4d4bd1a11e282115a02e290fda4acceca6102082dbfcd647a7296ceb5");
  assert.equal(tree.fileCount, 513);
  assert.equal(tree.treeHash, "0ef1371778138de6a595f2812d6544b43903f2875d989eb165d68674b766c96f");
});

test("N: absent real inputs return AWAITING_NEW_HOLDOUT_INPUTS and create no frozen requests", async () => {
  const result = await runPreparation({ sourceCommit: SOURCE_COMMIT, version: VERSION });
  assert.equal(result.status, "PASS");
  assert.equal(result.state, PREPARATION_STATE.AWAITING_NEW_HOLDOUT_INPUTS);
  assert.equal(result.inputManifestPresent, false);
  assert.equal(result.privateControlsPresent, false);
  assert.equal(result.newAuthorizedObjectCount, 0);
  assert.equal(result.frozenRequestCount, 0);
  assert.equal(result.generatedFileCount, 0);
  assert.equal(result.consentReceiptCreated, false);
  assert.equal(result.invocationReservationCreated, false);
  assert.equal(result.benchmarkExecutionCount, 0);
  assert.equal(result.providerCallCount, 0);
  assert.equal(result.networkRequestCount, 0);
  assert.equal(result.receipt.executionAuthorized, false);
});

test("all V2 JSON contracts are valid JSON and the coverage contract is exact", async () => {
  const { benchmarkSpec, coverageContract, scoringContract } = await contracts();
  assert.equal(benchmarkSpec.preparationOnly, true);
  assert.equal(validateCoverageContract(coverageContract).valid, true);
  assert.equal(validateScoringContract(scoringContract).valid, true);
  for (const schema of ["input-intake-manifest", "private-controls", "frozen-request-contract", "frozen-package", "consent-receipt", "execution-authorization", "invocation-registry"]) {
    const document = await loadJson(`benchmarks/blind-object-v2/schemas/${schema}.schema.json`);
    assert.equal(document.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(document.additionalProperties, false);
  }
  assert.equal(hashWithoutField({ value: 1, hash: sha256Json({ value: 1 }) }, "hash"), sha256Json({ value: 1 }));
  assert.equal(v2Root.endsWith(path.join("benchmarks", "blind-object-v2")), true);
  assert.equal(v1Root.endsWith(path.join("benchmarks", "blind-object-v1")), true);
});
