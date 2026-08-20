import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  CANONICAL_ROLE_REGISTRY_READINESS_BINDING,
  verifyCanonicalGitCheckoutIdentity,
  verifyCanonicalRoleRegistryReadinessIdentity,
  verifyReadiness
} from "../qualification/synthetic-executive/scripts/verify-readiness.mjs";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registryRelativePath = "qualification/synthetic-executive/canonical-role-registry.json";
const qualificationRelativePath = "canonical-role-registry.json";
const lockedBaseCommit = "806a052f830277e482090677f136a82507cc6c3e";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const runGit = (root, args, options = {}) => execFileSync("git", args, { cwd: root, encoding: "utf8", ...options }).trim();
const readManifest = async () => JSON.parse(await readFile(path.join(repositoryRoot, "qualification", "synthetic-executive", "readiness-manifest.json"), "utf8"));

async function createIdentityFixture(t) {
  const root = await mkdtemp(path.join(os.tmpdir(), "ke-readiness-identity-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  runGit(root, ["init", "--quiet"]);
  runGit(root, ["config", "core.autocrlf", "true"]);
  const repositoryRelativePath = "qualification/synthetic-executive/canonical-role-registry.json";
  const filePath = path.join(root, ...repositoryRelativePath.split("/"));
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, "alpha\nbeta\ngamma\n", "utf8");
  runGit(root, ["add", "--", repositoryRelativePath]);
  runGit(root, ["-c", "user.name=Katherine Readiness Test", "-c", "user.email=readiness-test@invalid", "commit", "--quiet", "-m", "fixture"]);
  const commit = runGit(root, ["rev-parse", "HEAD"]);
  const tree = runGit(root, ["rev-parse", "HEAD^{tree}"]);
  const canonicalObjectId = runGit(root, ["rev-parse", `${commit}:${repositoryRelativePath}`]);
  const canonicalBytes = execFileSync("git", ["cat-file", "blob", canonicalObjectId], { cwd: root });
  return {
    root,
    filePath,
    canonicalBytes,
    binding: { commit, tree, repositoryRelativePath, manifestRelativePath: "canonical-role-registry.json" }
  };
}

test("readiness accepts the sealed canonical registry when checkout bytes differ only by representation", async () => {
  const manifest = JSON.parse(await readFile(path.join(repositoryRoot, "qualification", "synthetic-executive", "readiness-manifest.json"), "utf8"));
  const entry = manifest.artifactInventory.find((item) => item.relativePath === qualificationRelativePath);
  assert.ok(entry, "readiness manifest must bind the canonical role registry");

  const canonicalBytes = execFileSync("git", ["show", `${lockedBaseCommit}:${registryRelativePath}`], { cwd: repositoryRoot });
  const checkoutBytes = await readFile(path.join(repositoryRoot, registryRelativePath));
  const cleanFilteredObjectId = execFileSync("git", ["hash-object", `--path=${registryRelativePath}`, "--stdin"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    input: checkoutBytes
  }).trim();

  assert.equal(canonicalBytes.length, entry.bytes);
  assert.equal(sha256(canonicalBytes), entry.sha256);
  assert.equal(cleanFilteredObjectId, execFileSync("git", ["rev-parse", `${lockedBaseCommit}:${registryRelativePath}`], { cwd: repositoryRoot, encoding: "utf8" }).trim());
  assert.notEqual(sha256(checkoutBytes), entry.sha256, "fixture requires a representation-only checkout mismatch");

  await verifyReadiness();
});

test("canonical Git blob identity is stable across LF, CRLF, and mixed checkout representations", async (t) => {
  const fixture = await createIdentityFixture(t);
  const representations = [
    ["LF", "alpha\nbeta\ngamma\n"],
    ["CRLF", "alpha\r\nbeta\r\ngamma\r\n"],
    ["mixed EOL", "alpha\r\nbeta\ngamma\r\n"]
  ];
  for (const [label, contents] of representations) {
    await t.test(label, async () => {
      await writeFile(fixture.filePath, contents, "utf8");
      const identity = await verifyCanonicalGitCheckoutIdentity(fixture.root, fixture.binding);
      assert.equal(identity.canonicalObjectId, runGit(fixture.root, ["rev-parse", `${fixture.binding.commit}:${fixture.binding.repositoryRelativePath}`]));
      assert.equal(identity.cleanFilteredObjectId, identity.canonicalObjectId);
      assert.equal(identity.bytes, fixture.canonicalBytes.length);
      assert.equal(identity.sha256, sha256(fixture.canonicalBytes));
    });
  }
});

test("canonical role-registry readiness binding denies path drift", async () => {
  const manifest = await readManifest();
  await assert.rejects(
    verifyCanonicalRoleRegistryReadinessIdentity(manifest, {
      binding: { ...CANONICAL_ROLE_REGISTRY_READINESS_BINDING, repositoryRelativePath: "qualification/synthetic-executive/canonical-role-registry-copy.json" }
    }),
    /readiness binding drift/
  );
});

test("canonical role-registry readiness binding denies commit drift", async () => {
  const manifest = await readManifest();
  await assert.rejects(
    verifyCanonicalRoleRegistryReadinessIdentity(manifest, {
      binding: { ...CANONICAL_ROLE_REGISTRY_READINESS_BINDING, commit: lockedBaseCommit }
    }),
    /readiness binding drift/
  );
});

test("canonical Git checkout identity denies unauthorized registry-content drift", async (t) => {
  const fixture = await createIdentityFixture(t);
  await writeFile(fixture.filePath, "alpha\nbeta\nunauthorized\n", "utf8");
  await assert.rejects(
    verifyCanonicalGitCheckoutIdentity(fixture.root, fixture.binding),
    /checkout content differs from sealed canonical Git blob/
  );
});

test("canonical Git checkout identity denies a missing bound path", async (t) => {
  const fixture = await createIdentityFixture(t);
  await unlink(fixture.filePath);
  await assert.rejects(verifyCanonicalGitCheckoutIdentity(fixture.root, fixture.binding), (error) => error?.code === "ENOENT");
});

test("canonical role-registry readiness identity denies a malformed manifest", async () => {
  const manifest = { ...await readManifest(), artifactInventory: {} };
  await assert.rejects(verifyCanonicalRoleRegistryReadinessIdentity(manifest), /malformed readiness artifact inventory/);
});

test("canonical role-registry readiness identity denies a stale expected hash", async () => {
  const manifest = structuredClone(await readManifest());
  const entry = manifest.artifactInventory.find((item) => item.relativePath === qualificationRelativePath);
  entry.sha256 = "0".repeat(64);
  await assert.rejects(verifyCanonicalRoleRegistryReadinessIdentity(manifest), /stale canonical role-registry SHA-256/);
});
