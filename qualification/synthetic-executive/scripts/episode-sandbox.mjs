import assert from "node:assert/strict";
import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { assertRelativeArtifactPath, sha256Bytes } from "./protocol.mjs";

export class EpisodeEvidenceSandbox {
  constructor({ episodeRoot, episodeManifest }) {
    this.episodeRoot = path.resolve(episodeRoot);
    this.episodeManifest = episodeManifest;
    this.inventory = new Map(episodeManifest.visibleArtifactInventory.map((item) => [item.artifactId, item]));
  }

  listVisibleArtifacts() {
    return this.episodeManifest.visibleArtifactInventory.map(({ artifactId, relativePath, bytes, sha256 }) => ({ artifactId, relativePath, bytes, sha256 }));
  }

  async readArtifact(artifactId) {
    const record = this.inventory.get(artifactId);
    assert.ok(record, `artifact ${artifactId} is not in the visible inventory`);
    const relativePath = assertRelativeArtifactPath(record.relativePath);
    const rootReal = await realpath(this.episodeRoot);
    const candidate = path.resolve(this.episodeRoot, relativePath);
    assert.equal(candidate.startsWith(`${this.episodeRoot}${path.sep}`), true, "artifact escapes episode sandbox");
    const stat = await lstat(candidate);
    assert.equal(stat.isFile(), true, "visible artifact must be a regular file");
    assert.equal(stat.isSymbolicLink(), false, "visible artifact cannot be a symbolic link");
    const candidateReal = await realpath(candidate);
    assert.equal(candidateReal.startsWith(`${rootReal}${path.sep}`), true, "artifact real path escapes episode sandbox");
    const bytes = await readFile(candidateReal);
    assert.equal(bytes.length, record.bytes, "visible artifact byte count differs");
    assert.equal(sha256Bytes(bytes), record.sha256, "visible artifact hash differs");
    return bytes;
  }

  async attemptPathAccess(requestedPath) {
    const normalized = String(requestedPath || "").replaceAll("\\", "/");
    const record = [...this.inventory.values()].find((item) => item.relativePath === normalized);
    if (!record) return Object.freeze({ permitted: false, reasonCode: "NOT_IN_AGENT_VISIBLE_ARTIFACT_INVENTORY", requestedPathDigest: sha256Bytes(Buffer.from(normalized)) });
    await this.readArtifact(record.artifactId);
    return Object.freeze({ permitted: true, artifactId: record.artifactId });
  }
}
