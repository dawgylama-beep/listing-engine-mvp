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
  assert.equal(release.version, version, "Observability release Version must equal package Version.");
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
  const [packageText, packageLockText, serverSource, indexHtml, vercelText, executionReleaseText, observabilityReleaseText, structuredOutputReleaseText, qualificationRouteReleaseText] = await Promise.all([
    readFile(path.join(rootDirectory, "package.json"), "utf8"),
    readFile(path.join(rootDirectory, "package-lock.json"), "utf8"),
    readFile(path.join(rootDirectory, "server.ps1"), "utf8"),
    readFile(path.join(rootDirectory, "public", "index.html"), "utf8"),
    readFile(path.join(rootDirectory, "vercel.json"), "utf8"),
    readFile(path.join(rootDirectory, "benchmarks", "blind-object-v2", "execution-release.json"), "utf8"),
    readFile(path.join(rootDirectory, observabilityReleaseRelativePath), "utf8"),
    readFile(path.join(rootDirectory, structuredOutputReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error)),
    readFile(path.join(rootDirectory, qualificationRouteReleaseRelativePath), "utf8").catch((error) => error?.code === "ENOENT" ? null : Promise.reject(error))
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
    assert.equal(structuredOutputRelease.cognitiveSubject.version, version);
    assert.equal(structuredOutputRelease.cognitiveSubject.observabilityReleaseHash, observabilityRelease.recordHash);
    structuredOutputReleaseHash = structuredOutputRelease.recordHash;
  }
  let qualificationRouteReleaseHash = null;
  if (qualificationRouteReleaseText !== null) {
    assert.equal(rootDirectory, repositoryRoot, "Qualification-route release validation requires the canonical repository root.");
    const qualificationRelease = JSON.parse(qualificationRouteReleaseText);
    const qualification = await import("../qualification/synthetic-executive/qualification-real-route/scripts/qualification-release.mjs");
    qualification.validateQualificationReleaseRecord(qualificationRelease);
    const rebuilt = await qualification.buildQualificationReleaseRecord();
    assert.equal(sha256Json(rebuilt), sha256Json(qualificationRelease), "Qualification-route release artifacts differ from their seal.");
    assert.equal(qualificationRelease.immutableCognitiveSubject.productVersion, version);
    qualificationRouteReleaseHash = qualificationRelease.releaseHash;
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
    outputDirectory: vercelConfig.outputDirectory,
    buildCommand: vercelConfig.buildCommand
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await inspectReleaseVersionSurfaces();
  process.stdout.write(`${result.label} release surfaces aligned; ${result.indexSurface.assetVersions.length} Version-bound public assets verified; observability release ${result.observabilityReleaseHash}.\n`);
}
