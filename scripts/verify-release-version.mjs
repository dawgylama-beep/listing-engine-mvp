import assert from "node:assert/strict";
import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");
export const releaseVersionPattern = /^\d+\.\d+\.\d+$/;
export const observabilityReleaseRelativePath = "qualification/synthetic-executive/calibration/provider-observability-release.json";
export const structuredOutputReleaseRelativePath = "qualification/synthetic-executive/calibration/structured-output-compatibility-release.json";
export const qualificationRouteReleaseRelativePath = "qualification/synthetic-executive/qualification-real-route/qualification-real-route-release.json";
export const generalContinuationReleaseRelativePath = "qualification/synthetic-executive/qualification-real-route/general-continuation-contract-release.json";
export const boundedRequestEnvelopeReleaseRelativePath = "qualification/synthetic-executive/qualification-real-route/bounded-request-envelope-release.json";
export const v2HeldOutCorpusReleaseRelativePath = "qualification/synthetic-executive/v2-held-out-corpus/v2-held-out-corpus-release.json";
export const v2QualificationResultReleaseRelativePath = "qualification/synthetic-executive/v2-blind-qualification-result-release.json";
export const responseEvidenceRepairReleaseRelativePath = "qualification/synthetic-executive/qualification-real-route/response-evidence-repair-release.json";
export const v2CaseScopedCompletionReleaseRelativePath = "qualification/synthetic-executive/qualification-real-route/v2-case-scoped-completion-release.json";
export const v2ResponseBoundaryRecoveryReleaseRelativePath = "qualification/synthetic-executive/qualification-real-route/v2-response-boundary-recovery-release.json";
export const v2ResponseBoundaryRecoveryHistoricalIdentity = Object.freeze({
  schemaVersion: "1.0",
  releaseType: "KATHERINE_SYNTHETIC_EXECUTIVE_V2_RESPONSE_BOUNDARY_RECOVERY_RELEASE",
  releaseState: "SEALED_RESPONSE_BOUNDARY_RECOVERY_AND_FINAL_BLIND_EVALUATION",
  version: "1.12.34",
  startingVersion: "1.12.33",
  startingCommit: "d198c3e162a60a871b4952105e6ded5ef695ec02",
  startingTree: "f69eb9006644244f3227d4a29d4df2d908ffa978",
  releaseHash: "fa52f960c6b080bcc598a8757e42512ba99b728856dda4df688b541fc8fc5ef4",
  fileSha256: "3723c3d2611c721403a2ec74db7dde260f125d5d51b8a52a03e9913af300e0ee"
});

const HASH = /^[a-f0-9]{64}$/;
const OBSERVABILITY_RELEASE_FIELDS = Object.freeze([
  "schemaVersion", "releaseType", "releaseState", "version", "startingCommit", "startingTree",
  "priorCalibrationReleaseRecordHash", "forensicClassification", "forensicReportSha256",
  "safeDiagnosticContractVersion", "terminalResultSchemaVersion", "providerResponseBodyLimitBytes",
  "unchangedCanonicalRequestHash", "unchangedPromptHash", "unchangedExecutiveActionSchemaHash",
  "priorSealedCalibrationArtifactHashes", "artifactHashes", "activityAssertions", "recordHash"
]);

const canonicalize = (value) => Array.isArray(value)
  ? value.map(canonicalize)
  : (value && typeof value === "object" ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])) : value);
const sha256Bytes = (value) => crypto.createHash("sha256").update(value).digest("hex");
const sha256Json = (value) => sha256Bytes(Buffer.from(JSON.stringify(canonicalize(value)), "utf8"));

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object.`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ.`);
}

async function inspectObservabilityRelease(rootDirectory, releaseText, version, { verifyCurrentArtifacts = true } = {}) {
  const release = JSON.parse(releaseText);
  exactKeys(release, OBSERVABILITY_RELEASE_FIELDS, "Observability release");
  assert.equal(release.schemaVersion, "1.0");
  assert.equal(release.releaseType, "KATHERINES_EYE_SAFE_PROVIDER_ERROR_OBSERVABILITY_RELEASE");
  assert.equal(release.releaseState, "SEALED");
  assert.equal(release.version, "1.12.27", "Historical observability release Version differs.");
  assert.equal(release.startingCommit, "77815a9713441932a63621d78368dbdbd425c539");
  assert.equal(release.startingTree, "189c68f7736fabf647814cca4bce74dcb8c57bdd");
  assert.equal(release.priorCalibrationReleaseRecordHash, "aa634596d8905c8b996ec0c6c1c8375f9a937e3a27fcadf02eb7bbf3c45d841b");
  assert.equal(release.forensicClassification, "SAFE_PROVIDER_ERROR_DISCARDED");
  assert.equal(release.forensicReportSha256, "f069f89c25b3063aa25bb3ac32f31b2f7498ec8b49f01c32752c159436eadbbb");
  assert.equal(release.safeDiagnosticContractVersion, "1.0");
  assert.equal(release.terminalResultSchemaVersion, "1.1");
  assert.equal(release.providerResponseBodyLimitBytes, 65_536);
  assert.equal(release.unchangedCanonicalRequestHash, "73fa81d6d3fce8add2d8911682330b954b2653edfb43de4aa37ee02eea6d079e");
  assert.equal(release.unchangedPromptHash, "73dc7a21fa2db16c432b9630f3934ea87d78cd89b174b1739563b207a5a57e93");
  assert.equal(release.unchangedExecutiveActionSchemaHash, "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba");
  exactKeys(release.priorSealedCalibrationArtifactHashes, ["calibrationResult", "metadataAccessReceipt", "qualificationLedger"], "Prior sealed calibration hashes");
  for (const value of Object.values(release.priorSealedCalibrationArtifactHashes)) assert.match(value, HASH);
  assert.ok(Array.isArray(release.artifactHashes) && release.artifactHashes.length >= 6, "Observability release artifact inventory is incomplete.");
  const seenPaths = new Set();
  for (const item of release.artifactHashes) {
    exactKeys(item, ["relativePath", "sha256"], "Observability release artifact hash");
    assert.equal(path.isAbsolute(item.relativePath), false);
    assert.equal(item.relativePath.includes(".."), false);
    assert.match(item.sha256, HASH);
    assert.equal(seenPaths.has(item.relativePath), false, `Duplicate observability artifact ${item.relativePath}.`);
    seenPaths.add(item.relativePath);
    if (verifyCurrentArtifacts) {
      const bytes = await readFile(path.join(rootDirectory, item.relativePath));
      assert.equal(sha256Bytes(bytes), item.sha256, `${item.relativePath} differs from the sealed observability release.`);
    }
  }
  exactKeys(release.activityAssertions, [
    "credentialAccessCount", "providerRequestCount", "externalNetworkRequestCount", "calibrationAuthorityCreated",
    "calibrationPerformed", "qualificationPerformed", "benchmarkExecuted", "productHandlerInvoked",
    "cognitiveExecutionPerformed", "previewDeployed", "productionDeployed"
  ], "Observability release activity assertions");
  assert.equal(release.activityAssertions.credentialAccessCount, 0);
  assert.equal(release.activityAssertions.providerRequestCount, 0);
  assert.equal(release.activityAssertions.externalNetworkRequestCount, 0);
  for (const [field, value] of Object.entries(release.activityAssertions)) if (!field.endsWith("Count")) assert.equal(value, false, `${field} must remain false.`);
  const core = structuredClone(release); delete core.recordHash;
  assert.match(release.recordHash, HASH);
  assert.equal(sha256Json(core), release.recordHash, "Observability release hash differs.");
  return release;
}

async function inspectResponseEvidenceRepairRelease(rootDirectory, releaseText, version, { verifyCurrentArtifacts = true } = {}) {
  const record = JSON.parse(releaseText);
  exactKeys(record, [
    "schemaVersion", "releaseType", "releaseState", "version", "startingIdentity", "rootCause",
    "adjudication", "originalRun", "safeResponseEvidenceContract", "preservedBindings",
    "artifactHashes", "activityAssertions", "releaseHash"
  ], "Response-evidence repair release");
  assert.equal(record.schemaVersion, "1.0");
  assert.equal(record.releaseType, "KATHERINE_SYNTHETIC_EXECUTIVE_V2_RESPONSE_EVIDENCE_REPAIR_RELEASE");
  assert.equal(record.releaseState, "SEALED_QUALIFICATION_TOOLING_REPAIR");
  assert.equal(record.version, version);
  assert.equal(record.startingIdentity.version, "1.12.31");
  assert.equal(record.startingIdentity.commit, "90f7895869d24fd6bc77f894576e598073060463");
  assert.equal(record.startingIdentity.tree, "eec6eb5a1f9897ec9717c775f347e730d1cbe131");
  assert.equal(record.rootCause.classification, "C06_RETAINED_RESPONSE_SEMANTICS_NOT_PERSISTED");
  assert.equal(record.originalRun.originalC06Classification, "C06_INFRASTRUCTURE_INVALID_RESPONSE_SEMANTICS_NOT_PERSISTED");
  assert.equal(record.originalRun.originalC06Scoreable, false);
  assert.equal(record.originalRun.originalC06Excluded, true);
  assert.equal(record.safeResponseEvidenceContract.rawResponseBodyRetained, false);
  assert.equal(record.safeResponseEvidenceContract.rawOutputRetained, false);
  assert.equal(record.safeResponseEvidenceContract.reasoningRetained, false);
  assert.equal(record.safeResponseEvidenceContract.credentialsRetained, false);
  assert.equal(record.safeResponseEvidenceContract.completeHeadersRetained, false);
  const seen = new Set();
  for (const item of record.artifactHashes) {
    exactKeys(item, ["relativePath", "sha256"], "Response-evidence repair artifact hash");
    assert.equal(seen.has(item.relativePath), false); seen.add(item.relativePath); assert.match(item.sha256, HASH);
    if (verifyCurrentArtifacts) assert.equal(sha256Bytes(await readFile(path.join(rootDirectory, item.relativePath))), item.sha256, `${item.relativePath} differs from the response-evidence repair seal.`);
  }
  for (const value of Object.values(record.activityAssertions)) assert.equal(value, 0);
  const core = structuredClone(record); delete core.releaseHash;
  assert.equal(sha256Json(core), record.releaseHash, "Response-evidence repair release hash differs.");
  return record;
}

async function inspectV2CaseScopedCompletionRelease(rootDirectory, releaseText, version) {
  const record = JSON.parse(releaseText);
  exactKeys(record, [
    "schemaVersion", "releaseType", "releaseState", "version", "startingIdentity", "sourceSeal",
    "predecessor", "successor", "execution", "evaluation", "artifactHashes", "activityCounts",
    "preservation", "releaseHash"
  ], "V2 case-scoped completion release");
  assert.equal(record.schemaVersion, "1.0");
  assert.equal(record.releaseType, "KATHERINE_SYNTHETIC_EXECUTIVE_V2_CASE_SCOPED_COMPLETION_RELEASE");
  assert.equal(record.releaseState, "SEALED_CASE_SCOPED_COMPLETION");
  assert.equal(record.version, version);
  assert.equal(record.startingIdentity.version, "1.12.32");
  assert.equal(record.startingIdentity.commit, "5aae8e6cd76fda8b6ac398d364adf2ff6272d191");
  assert.equal(record.startingIdentity.tree, "50828d82d311eeba72e5e9c6cac3edcbbcf23bac");
  assert.equal(record.startingIdentity.releaseHash, "90ef3d9df69ac342cfabb95c8d9c99588080ad15f09011ca3d7eff3a249e9fa9");
  assert.match(record.sourceSeal.sourceSealHash, HASH); assert.match(record.sourceSeal.correctedExecutableAggregateHash, HASH);
  assert.equal(record.predecessor.authorityHash, "97a8392964e47ad64d810e955d6cf345111655069258ab362dfe69676bb5d4f2");
  assert.equal(record.predecessor.consumptionReceiptHash, "f79b3df26fb389cf2177e997acbb611b5fb33d65c9892d1f09fbed1993272659");
  assert.equal(record.predecessor.finalSealHash, "96677d2ecfdce8d26825671f42df7f518e21f8e4fc301ca72a6902aa60b9a2d2");
  assert.equal(record.successor.slotCount, 7); assert.equal(record.successor.activationCount, 1); assert.equal(record.successor.terminalizationCount, 1);
  assert.equal(record.execution.caseProcessCount, 7); assert.equal(record.execution.metadataRequests, 0); assert.equal(record.execution.productHandlerCalls, 0);
  assert.equal(record.evaluation.denominator, 98); assert.equal(record.evaluation.minimumIntegerPass, 89); assert.equal(record.evaluation.invocationCount, 1);
  assert.equal(record.preservation.originalC06Excluded, true); assert.equal(record.preservation.historicalEmptyC08StubExcluded, true); assert.equal(record.preservation.phase6aArtifactsPreserved, true);
  const seen = new Set();
  for (const item of record.artifactHashes) {
    exactKeys(item, ["relativePath", "sha256"], "V2 case-scoped completion artifact hash");
    assert.equal(seen.has(item.relativePath), false); seen.add(item.relativePath); assert.match(item.sha256, HASH);
    assert.equal(sha256Bytes(await readFile(path.join(rootDirectory, item.relativePath))), item.sha256, `${item.relativePath} differs from the V2 case-scoped completion seal.`);
  }
  const core = structuredClone(record); delete core.releaseHash;
  assert.equal(sha256Json(core), record.releaseHash, "V2 case-scoped completion release hash differs.");
  return record;
}

export async function inspectV2ResponseBoundaryRecoveryRelease(rootDirectory, releaseText, { verifyCurrentArtifacts = false } = {}) {
  const record = JSON.parse(releaseText);
  const identity = v2ResponseBoundaryRecoveryHistoricalIdentity;
  exactKeys(record, [
    "schemaVersion", "releaseType", "releaseState", "version", "createdAt", "startingIdentity", "provenance",
    "responseBoundary", "sourceSeal", "recovery", "evaluation", "activityCounts", "preservation",
    "artifactHashes", "artifactCount", "artifactAggregateHash", "releaseHash"
  ], "V2 response-boundary recovery release");
  assert.equal(sha256Bytes(Buffer.from(releaseText, "utf8")), identity.fileSha256, "Historical V2 response-boundary recovery release bytes differ from their pinned identity.");
  assert.equal(record.schemaVersion, identity.schemaVersion);
  assert.equal(record.releaseType, identity.releaseType);
  assert.equal(record.releaseState, identity.releaseState);
  assert.equal(record.version, identity.version, "Historical V2 response-boundary recovery release Version differs.");
  assert.equal(record.startingIdentity.version, identity.startingVersion);
  assert.equal(record.startingIdentity.commit, identity.startingCommit);
  assert.equal(record.startingIdentity.tree, identity.startingTree);
  assert.equal(record.provenance.corrected43Aggregate, "f131f7ed0548f6532c4afdc1bfaa254e5618595005fb89bfcf7fea7081f22aea");
  assert.equal(record.responseBoundary.localHardCeilingBytes, 1_048_576);
  assert.equal(record.responseBoundary.overflowProbeBytes, 1_048_577);
  assert.equal(record.recovery.exactCaseOrder.join(","), "KE-V2-C13,KE-V2-C14");
  assert.equal(record.evaluation.invocationCount, 1); assert.equal(record.evaluation.score.split("/")[1], "98");
  assert.equal(record.preservation.originalC01ThroughC12Unchanged, true);
  assert.equal(record.preservation.originalC06AndC13PreservedAndExcluded, true);
  assert.equal(record.preservation.phase6aArtifactsPreserved, true);
  assert.equal(record.artifactCount, record.artifactHashes.length);
  assert.equal(sha256Json(record.artifactHashes), record.artifactAggregateHash);
  const seen = new Set();
  for (const item of record.artifactHashes) {
    exactKeys(item, ["relativePath", "sha256"], "V2 response-boundary recovery artifact hash");
    assert.equal(seen.has(item.relativePath), false); seen.add(item.relativePath); assert.match(item.sha256, HASH);
    if (verifyCurrentArtifacts) assert.equal(sha256Bytes(await readFile(path.join(rootDirectory, item.relativePath))), item.sha256, `${item.relativePath} differs from the V2 response-boundary recovery seal.`);
  }
  const core = structuredClone(record); delete core.releaseHash;
  assert.equal(sha256Json(core), record.releaseHash, "V2 response-boundary recovery release hash differs.");
  assert.equal(record.releaseHash, identity.releaseHash, "Historical V2 response-boundary recovery release identity differs.");
  return record;
}

export function formatReleaseVersion(version) {
  const normalized = String(version || "").trim();
  assert.match(normalized, releaseVersionPattern, "Release Version must be a complete numeric semantic Version.");
  return `Version ${normalized}`;
}

export function inspectIndexVersionSurface(indexHtml, expectedVersion) {
  const expectedLabel = formatReleaseVersion(expectedVersion);
  const documentVersion = indexHtml.match(/<html\b[^>]*\bdata-release-version="([^"]+)"/i)?.[1] || "";
  const badgeText = indexHtml.match(/<p\b[^>]*\bclass="[^"]*\bversion-badge\b[^"]*"[^>]*>([^<]*)<\/p>/i)?.[1]?.trim() || "";
  const assetVersions = [...indexHtml.matchAll(/(?:styles\.css|customer-evidence\.js|app\.js)\?v=([0-9]+\.[0-9]+\.[0-9]+)/g)]
    .map((match) => match[1]);

  assert.equal(documentVersion, expectedVersion, "HTML release metadata must equal package Version.");
  assert.equal(badgeText, expectedLabel, "Customer-visible Version badge must equal package Version.");
  assert.equal(assetVersions.length, 3, "All three active public assets must carry a Version cache identity.");
  assert.deepEqual(assetVersions, [expectedVersion, expectedVersion, expectedVersion], "Public asset identities must equal package Version.");
  assert.doesNotMatch(indexHtml, /Version 1\.12\.1(?!\d)/, "The stale active Version 1.12.1 literal must not remain in public HTML.");

  return { documentVersion, badgeText, assetVersions };
}

export async function inspectReleaseVersionSurfaces(rootDirectory = repositoryRoot) {
  const [packageText, packageLockText, serverSource, indexHtml, vercelText, executionReleaseText, observabilityReleaseText, structuredOutputReleaseText, qualificationRouteReleaseText, generalContinuationReleaseText, boundedRequestEnvelopeReleaseText, v2HeldOutCorpusReleaseText, v2QualificationResultReleaseText, responseEvidenceRepairReleaseText, v2CaseScopedCompletionReleaseText, v2ResponseBoundaryRecoveryReleaseText] = await Promise.all([
    readFile(path.join(rootDirectory, "package.json"), "utf8"),
    readFile(path.join(rootDirectory, "package-lock.json"), "utf8"),
    readFile(path.join(rootDirectory, "server.ps1"), "utf8"),
    readFile(path.join(rootDirectory, "public", "index.html"), "utf8"),
    readFile(path.join(rootDirectory, "vercel.json"), "utf8"),
    readFile(path.join(rootDirectory, "benchmarks", "blind-object-v2", "execution-release.json"), "utf8"),
    readFile(path.join(rootDirectory, observabilityReleaseRelativePath), "utf8"),
    readFile(path.join(rootDirectory, structuredOutputReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, qualificationRouteReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, generalContinuationReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, boundedRequestEnvelopeReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, v2HeldOutCorpusReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, v2QualificationResultReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, responseEvidenceRepairReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, v2CaseScopedCompletionReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, v2ResponseBoundaryRecoveryReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error))
  ]);

  const packageManifest = JSON.parse(packageText);
  const packageLock = JSON.parse(packageLockText);
  const vercelConfig = JSON.parse(vercelText);
  const executionRelease = JSON.parse(executionReleaseText);
  const version = String(packageManifest.version || "").trim();
  formatReleaseVersion(version);

  assert.equal(packageLock.version, version, "package-lock root Version must equal package Version.");
  assert.equal(packageLock.packages?.[""]?.version, version, "package-lock package Version must equal package Version.");
  const observabilityRelease = await inspectObservabilityRelease(rootDirectory, observabilityReleaseText, version, {
    verifyCurrentArtifacts: structuredOutputReleaseText === null
  });
  let structuredOutputReleaseHash = null;
  if (structuredOutputReleaseText !== null) {
    assert.equal(rootDirectory, repositoryRoot, "Structured-output release validation requires the canonical repository root.");
    const structuredOutputRelease = JSON.parse(structuredOutputReleaseText);
    const compatibility = await import("../qualification/synthetic-executive/calibration/scripts/structured-output-compatibility-release.mjs");
    compatibility.validateStructuredOutputCompatibilityRelease(structuredOutputRelease, { validateCurrentArtifacts: qualificationRouteReleaseText === null });
    assert.equal(structuredOutputRelease.cognitiveSubject.version, "1.12.27");
    assert.equal(structuredOutputRelease.cognitiveSubject.observabilityReleaseHash, observabilityRelease.recordHash);
    structuredOutputReleaseHash = structuredOutputRelease.recordHash;
  }
  let qualificationRouteReleaseHash = null;
  if (qualificationRouteReleaseText !== null) {
    assert.equal(rootDirectory, repositoryRoot, "Qualification-route release validation requires the canonical repository root.");
    const qualificationRelease = JSON.parse(qualificationRouteReleaseText);
    const qualification = await import("../qualification/synthetic-executive/qualification-real-route/scripts/qualification-release.mjs");
    qualification.validateQualificationReleaseRecord(qualificationRelease);
    if (generalContinuationReleaseText === null && boundedRequestEnvelopeReleaseText === null) {
      const rebuilt = await qualification.buildQualificationReleaseRecord();
      assert.equal(sha256Json(rebuilt), sha256Json(qualificationRelease), "Qualification-route release artifacts differ from their seal.");
    }
    assert.equal(qualificationRelease.immutableCognitiveSubject.productVersion, "1.12.27", "Historical qualification subject Version differs.");
    qualificationRouteReleaseHash = qualificationRelease.releaseHash;
  }
  let generalContinuationReleaseHash = null;
  if (generalContinuationReleaseText !== null) {
    assert.equal(rootDirectory, repositoryRoot, "General-continuation release validation requires the canonical repository root.");
    const record = JSON.parse(generalContinuationReleaseText);
    const continuation = await import("../qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-contract-release.mjs");
    continuation.validateGeneralContinuationContractRelease(record);
    if (boundedRequestEnvelopeReleaseText === null) {
      const rebuilt = await continuation.buildGeneralContinuationContractRelease();
      assert.equal(sha256Json(rebuilt), sha256Json(record), "General-continuation release artifacts differ from their seal.");
      assert.equal(record.version, version, "General-continuation release Version must equal package Version.");
    } else assert.equal(record.version, "1.12.28", "Historical general-continuation release Version differs.");
    generalContinuationReleaseHash = record.releaseHash;
  }
  let boundedRequestEnvelopeReleaseHash = null;
  if (boundedRequestEnvelopeReleaseText !== null) {
    assert.equal(rootDirectory, repositoryRoot, "Bounded request-envelope release validation requires the canonical repository root.");
    const record = JSON.parse(boundedRequestEnvelopeReleaseText);
    const bounded = await import("../qualification/synthetic-executive/qualification-real-route/scripts/bounded-request-envelope-release.mjs");
    bounded.validateBoundedRequestEnvelopeRelease(record);
    if (v2HeldOutCorpusReleaseText === null) {
      const rebuilt = await bounded.buildBoundedRequestEnvelopeRelease();
      assert.equal(sha256Json(rebuilt.release), sha256Json(record), "Bounded request-envelope release artifacts differ from their seal.");
      assert.equal(record.version, version, "Bounded request-envelope release Version must equal package Version.");
    } else assert.equal(record.version, "1.12.29", "Historical bounded request-envelope release Version differs.");
    boundedRequestEnvelopeReleaseHash = record.releaseHash;
  }
  let v2HeldOutCorpusReleaseHash = null;
  if (v2HeldOutCorpusReleaseText !== null) {
    assert.equal(rootDirectory, repositoryRoot, "V2 held-out corpus release validation requires the canonical repository root.");
    const record = JSON.parse(v2HeldOutCorpusReleaseText);
    const corpus = await import("../qualification/synthetic-executive/v2-held-out-corpus/scripts/v2-corpus-release.mjs");
    corpus.validateV2CorpusRelease(record);
    if (v2QualificationResultReleaseText === null) {
      const rebuilt = await corpus.buildV2CorpusRelease();
      assert.equal(sha256Json(rebuilt.release), sha256Json(record), "V2 held-out corpus release artifacts differ from their seal.");
      assert.equal(record.version, version, "V2 held-out corpus release Version must equal package Version.");
    } else assert.equal(record.version, "1.12.30", "Historical V2 held-out corpus release Version differs.");
    v2HeldOutCorpusReleaseHash = record.releaseHash;
  }
  let v2QualificationResultReleaseHash = null;
  if (v2QualificationResultReleaseText !== null) {
    const record = JSON.parse(v2QualificationResultReleaseText);
    assert.equal(record.schemaVersion, "1.0");
    assert.equal(record.releaseType, "KATHERINE_SYNTHETIC_EXECUTIVE_V2_BLIND_REAL_ROUTE_QUALIFICATION_RESULT_RELEASE");
    assert.equal(record.releaseState, "SEALED_INTEGRITY_INVALID_RESULT");
    if (responseEvidenceRepairReleaseText === null) assert.equal(record.version, version, "V2 qualification-result release Version must equal package Version.");
    else assert.equal(record.version, "1.12.31", "Historical V2 qualification-result release Version differs.");
    assert.equal(record.startingIdentity.version, "1.12.30");
    assert.equal(record.startingIdentity.releaseHash, v2HeldOutCorpusReleaseHash);
    assert.equal(record.execution.classification, "QUALIFICATION_PROVIDER_TRANSPORT_INTEGRITY_INVALID");
    assert.equal(record.evaluation.scoreCalculated, false);
    assert.equal(record.claims.validQualificationResult, false);
    assert.equal(record.claims.qualified, false);
    assert.equal(record.claims.notQualifiedClaimed, false);
    assert.equal(record.authority.status, "PERMANENTLY_CONSUMED");
    assert.equal(record.unauthorizedActivity.metadataRequests, 0);
    assert.equal(record.unauthorizedActivity.caseReplays, 0);
    assert.equal(record.unauthorizedActivity.productHandlerCalls, 0);
    const core = structuredClone(record); delete core.releaseHash;
    assert.equal(sha256Json(core), record.releaseHash, "V2 qualification-result release hash differs.");
    v2QualificationResultReleaseHash = record.releaseHash;
  }
  let responseEvidenceRepairReleaseHash = null;
  if (responseEvidenceRepairReleaseText !== null) {
    const record = await inspectResponseEvidenceRepairRelease(rootDirectory, responseEvidenceRepairReleaseText, "1.12.32", { verifyCurrentArtifacts: version === "1.12.32" });
    assert.equal(record.originalRun.resultReleaseHash, v2QualificationResultReleaseHash);
    assert.equal(record.preservedBindings.corpusReleaseHash, v2HeldOutCorpusReleaseHash);
    responseEvidenceRepairReleaseHash = record.releaseHash;
  }
  let v2CaseScopedCompletionReleaseHash = null;
  if (v2CaseScopedCompletionReleaseText !== null) {
    const record = await inspectV2CaseScopedCompletionRelease(rootDirectory, v2CaseScopedCompletionReleaseText, version);
    assert.equal(record.predecessor.responseEvidenceRepairReleaseHash, responseEvidenceRepairReleaseHash);
    v2CaseScopedCompletionReleaseHash = record.releaseHash;
  }
  let v2ResponseBoundaryRecoveryReleaseHash = null;
  let v2ResponseBoundaryRecoveryReleaseVersion = null;
  if (v2ResponseBoundaryRecoveryReleaseText !== null) {
    const record = await inspectV2ResponseBoundaryRecoveryRelease(rootDirectory, v2ResponseBoundaryRecoveryReleaseText);
    v2ResponseBoundaryRecoveryReleaseHash = record.releaseHash;
    v2ResponseBoundaryRecoveryReleaseVersion = record.version;
  }

  const serverVersion = serverSource.match(/\$AppVersion\s*=\s*"([^"]+)"/)?.[1] || "";
  assert.equal(serverVersion, version, "server.ps1 Version must equal package Version.");

  const indexSurface = inspectIndexVersionSurface(indexHtml, version);
  assert.equal(executionRelease.schemaVersion, "4.0", "Execution release schema Version must be current.");
  assert.equal(executionRelease.releaseType, "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_RELEASE", "Execution release type must be canonical.");
  assert.ok(["PENDING_QUALIFICATION_SEAL", "QUALIFIED", "INVALID"].includes(executionRelease.releaseState), "Execution release state must be explicit.");
  assert.equal(executionRelease.executorVersion, "1.12.26", "Historical calibration release Version must remain immutable.");
  assert.equal(executionRelease.recordHash, observabilityRelease.priorCalibrationReleaseRecordHash, "Observability release must bind the prior calibration release.");
  assert.equal(executionRelease.releasePurpose, "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_ONLY", "Execution release purpose must remain calibration-only.");
  assert.equal(executionRelease.realRouteCalibrationAuthorized, true, "Release must authorize only the bounded real-route calibration.");
  assert.equal(executionRelease.realRouteCalibrationPerformed, false, "Release seal cannot claim that calibration already ran.");
  assert.equal(executionRelease.blindQualificationPerformed, false, "Calibration release cannot claim a blind qualification run.");
  assert.equal(executionRelease.productionExecutionAuthorized, false, "Calibration release cannot authorize Production execution.");
  assert.equal(executionRelease.syntheticExecutiveQualified, false, "Calibration release cannot claim the Synthetic Executive Agent is qualified.");
  assert.equal(executionRelease.authorityDeclarations?.benchmarkExecutionEnabled, false, "Calibration release cannot authorize benchmark execution.");
  assert.equal(vercelConfig.framework, null, "Vercel must remain a framework-neutral static deployment.");
  assert.equal(vercelConfig.outputDirectory, "public", "Vercel must deploy only the public directory.");
  assert.equal(vercelConfig.buildCommand, "npm run build", "Vercel must run the release-Version guard before deployment.");
  assert.equal(packageManifest.scripts?.build, "node ./scripts/verify-release-version.mjs", "The deterministic build must run the release-Version guard.");

  return {
    version,
    label: formatReleaseVersion(version),
    serverVersion,
    indexSurface,
    executionReleaseVersion: executionRelease.executorVersion,
    executionReleaseState: executionRelease.releaseState,
    observabilityReleaseVersion: observabilityRelease.version,
    observabilityReleaseHash: observabilityRelease.recordHash,
    structuredOutputReleaseHash,
    qualificationRouteReleaseHash,
    generalContinuationReleaseHash,
    boundedRequestEnvelopeReleaseHash,
    v2HeldOutCorpusReleaseHash,
    v2QualificationResultReleaseHash,
    responseEvidenceRepairReleaseHash,
    v2CaseScopedCompletionReleaseHash,
    v2ResponseBoundaryRecoveryReleaseHash,
    v2ResponseBoundaryRecoveryReleaseVersion,
    outputDirectory: vercelConfig.outputDirectory,
    buildCommand: vercelConfig.buildCommand
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await inspectReleaseVersionSurfaces();
  const currentToolingReleaseHash = result.v2ResponseBoundaryRecoveryReleaseHash
    || result.v2CaseScopedCompletionReleaseHash
    || result.responseEvidenceRepairReleaseHash
    || result.v2QualificationResultReleaseHash
    || result.v2HeldOutCorpusReleaseHash
    || result.boundedRequestEnvelopeReleaseHash
    || result.generalContinuationReleaseHash
    || result.qualificationRouteReleaseHash
    || result.structuredOutputReleaseHash
    || result.observabilityReleaseHash;
  process.stdout.write(`${result.label} release surfaces aligned; ${result.indexSurface.assetVersions.length} Version-bound public assets verified; current tooling release ${currentToolingReleaseHash}.\n`);
}
