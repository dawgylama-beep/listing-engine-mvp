import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
export const repositoryRoot = path.resolve(scriptDirectory, "..");
export const releaseVersionPattern = /^\d+\.\d+\.\d+$/;

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
  const [packageText, packageLockText, serverSource, indexHtml, vercelText, executionReleaseText] = await Promise.all([
    readFile(path.join(rootDirectory, "package.json"), "utf8"),
    readFile(path.join(rootDirectory, "package-lock.json"), "utf8"),
    readFile(path.join(rootDirectory, "server.ps1"), "utf8"),
    readFile(path.join(rootDirectory, "public", "index.html"), "utf8"),
    readFile(path.join(rootDirectory, "vercel.json"), "utf8"),
    readFile(path.join(rootDirectory, "benchmarks", "blind-object-v2", "execution-release.json"), "utf8")
  ]);

  const packageManifest = JSON.parse(packageText);
  const packageLock = JSON.parse(packageLockText);
  const vercelConfig = JSON.parse(vercelText);
  const executionRelease = JSON.parse(executionReleaseText);
  const version = String(packageManifest.version || "").trim();
  formatReleaseVersion(version);

  assert.equal(packageLock.version, version, "package-lock root Version must equal package Version.");
  assert.equal(packageLock.packages?.[""]?.version, version, "package-lock package Version must equal package Version.");

  const serverVersion = serverSource.match(/\$AppVersion\s*=\s*"([^"]+)"/)?.[1] || "";
  assert.equal(serverVersion, version, "server.ps1 Version must equal package Version.");

  const indexSurface = inspectIndexVersionSurface(indexHtml, version);
  assert.equal(executionRelease.schemaVersion, "4.0", "Execution release schema Version must be current.");
  assert.equal(executionRelease.releaseType, "SYNTHETIC_EXECUTIVE_REAL_ROUTE_CALIBRATION_RELEASE", "Execution release type must be canonical.");
  assert.ok(["PENDING_QUALIFICATION_SEAL", "QUALIFIED", "INVALID"].includes(executionRelease.releaseState), "Execution release state must be explicit.");
  assert.equal(executionRelease.executorVersion, version, "Execution release Version must equal package Version.");
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
    outputDirectory: vercelConfig.outputDirectory,
    buildCommand: vercelConfig.buildCommand
  };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  const result = await inspectReleaseVersionSurfaces();
  process.stdout.write(`${result.label} release surfaces aligned; ${result.indexSurface.assetVersions.length} Version-bound public assets verified.\n`);
}
