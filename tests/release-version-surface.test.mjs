import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  formatReleaseVersion,
  inspectIndexVersionSurface,
  inspectReleaseVersionSurfaces,
  repositoryRoot
} from "../scripts/verify-release-version.mjs";

test("authoritative release Version aligns every active presentation surface", async () => {
  const result = await inspectReleaseVersionSurfaces();
  assert.equal(result.version, "1.12.26");
  assert.equal(result.serverVersion, result.version);
  assert.equal(result.indexSurface.documentVersion, result.version);
  assert.equal(result.indexSurface.badgeText, result.label);
  assert.equal(result.executionReleaseVersion, result.version);
  assert.ok(["PENDING_QUALIFICATION_SEAL", "QUALIFIED"].includes(result.executionReleaseState));
});

test("full multi-digit patch Version is preserved in source, DOM text, and asset identities", async () => {
  const indexHtml = await readFile(path.join(repositoryRoot, "public", "index.html"), "utf8");
  const syntheticVersion = "7.8.123";
  const syntheticHtml = indexHtml.replaceAll("1.12.26", syntheticVersion);
  const result = inspectIndexVersionSurface(syntheticHtml, syntheticVersion);

  assert.equal(formatReleaseVersion(syntheticVersion), "Version 7.8.123");
  assert.equal(result.badgeText, "Version 7.8.123");
  assert.equal(result.documentVersion, syntheticVersion);
  assert.deepEqual(result.assetVersions, [syntheticVersion, syntheticVersion, syntheticVersion]);
});

test("no stale active Version literal remains in runtime or public surfaces", async () => {
  const activePaths = [
    "package.json",
    "package-lock.json",
    "server.ps1",
    "public/index.html",
    "public/app.js",
    "public/customer-evidence.js",
    "benchmarks/blind-object-v2/execution-release.json"
  ];
  const activeSources = await Promise.all(activePaths.map((filePath) => readFile(path.join(repositoryRoot, filePath), "utf8")));
  assert.equal(activeSources.some((source) => /Version 1\.12\.1(?!\d)/.test(source)), false);
});

test("entry and static fallback routes share the guarded public index", async () => {
  const [serverSource, vercelText] = await Promise.all([
    readFile(path.join(repositoryRoot, "server.ps1"), "utf8"),
    readFile(path.join(repositoryRoot, "vercel.json"), "utf8")
  ]);
  const vercelConfig = JSON.parse(vercelText);

  assert.match(serverSource, /if \(\$RequestPath -eq "\/"\) \{\s*\$RelativePath = "index\.html"/);
  assert.equal(vercelConfig.outputDirectory, "public");
  assert.equal(vercelConfig.buildCommand, "npm run build");
});

test("Version badge CSS does not impose truncating overflow", async () => {
  const stylesheet = await readFile(path.join(repositoryRoot, "public", "styles.css"), "utf8");
  const rules = [...stylesheet.matchAll(/\.version-badge\s*\{([^}]*)\}/g)].map((match) => match[1]).join("\n");
  assert.doesNotMatch(rules, /overflow\s*:\s*hidden/i);
  assert.doesNotMatch(rules, /text-overflow\s*:\s*ellipsis/i);
  assert.doesNotMatch(rules, /white-space\s*:\s*nowrap/i);
});
