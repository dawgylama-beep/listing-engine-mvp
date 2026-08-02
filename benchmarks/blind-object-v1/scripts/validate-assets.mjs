import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(benchmarkRoot, "manifest.json"), "utf8"));
const provenance = JSON.parse(await readFile(path.join(benchmarkRoot, "provenance.json"), "utf8"));
const input = JSON.parse(await readFile(path.join(benchmarkRoot, "input-cases.json"), "utf8"));

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function inspectJpeg(buffer) {
  assert.ok(buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8, "asset is not a JPEG");
  let offset = 2;
  let width = null;
  let height = null;
  const forbiddenMarkers = [];
  const markerNames = new Map([[0xe1, "APP1/EXIF-XMP"], [0xed, "APP13/IPTC-Photoshop"], [0xfe, "COM/comment"]]);
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) offset += 1;
    while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
    if (offset >= buffer.length) break;
    const marker = buffer[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x00 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    assert.ok(offset + 2 <= buffer.length, "truncated JPEG marker length");
    const length = buffer.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= buffer.length, "invalid JPEG marker length");
    if (markerNames.has(marker)) forbiddenMarkers.push(markerNames.get(marker));
    if (sofMarkers.has(marker)) {
      assert.ok(length >= 7, "invalid JPEG SOF segment");
      height = buffer.readUInt16BE(offset + 3);
      width = buffer.readUInt16BE(offset + 5);
    }
    offset += length;
  }
  assert.ok(width && height, "JPEG dimensions not found");
  return { width, height, forbiddenMarkers };
}

assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.benchmarkId, "blind-object-v1");
const expectedPaths = input.cases.flatMap((entry) => entry.images).sort();
const manifestPaths = manifest.assets.map((entry) => entry.path).sort();
assert.deepEqual(manifestPaths, expectedPaths, "manifest assets differ from product input");
assert.equal(manifest.assets.length, 29);

const diskNames = (await readdir(path.join(benchmarkRoot, "assets"), { withFileTypes: true }))
  .filter((entry) => entry.isFile())
  .map((entry) => `assets/${entry.name}`)
  .sort();
assert.deepEqual(diskNames, expectedPaths, "assets directory contains missing or extra files");

const hashes = new Set();
const corpusLines = [];
for (const asset of manifest.assets) {
  assert.match(asset.path, /^assets\/obj-(?:00[1-9]|01[0-4])-[a-d]\.jpg$/);
  assert.match(asset.sha256, /^[a-f0-9]{64}$/);
  assert.match(asset.perceptualHash, /^[a-f0-9]{16}$/);
  const bytes = await readFile(path.join(benchmarkRoot, ...asset.path.split("/")));
  const digest = sha256(bytes);
  assert.equal(digest, asset.sha256, `${asset.path}: SHA-256 mismatch`);
  assert.equal(bytes.length, asset.bytes, `${asset.path}: byte count mismatch`);
  const inspected = inspectJpeg(bytes);
  assert.equal(inspected.width, asset.width, `${asset.path}: width mismatch`);
  assert.equal(inspected.height, asset.height, `${asset.path}: height mismatch`);
  assert.deepEqual(inspected.forbiddenMarkers, [], `${asset.path}: forbidden metadata marker`);
  assert.ok(!hashes.has(digest), `${asset.path}: duplicate exact image hash`);
  hashes.add(digest);
  corpusLines.push(`${asset.path}:${digest}\n`);
}

const corpusHash = sha256(Buffer.from(corpusLines.sort().join(""), "utf8"));
assert.equal(corpusHash, manifest.corpusHash, "corpus hash mismatch");
assert.equal(manifest.duplicateReview.exactHashDuplicates, 0);
assert.equal(manifest.duplicateReview.crossCaseLikelyDuplicates, 0);
assert.equal(manifest.duplicateReview.status, "REVIEWED_NO_DISALLOWED_DUPLICATES");
assert.ok(Array.isArray(manifest.duplicateReview.sameCaseMultiViewPairsReviewed));
assert.equal(manifest.duplicateReview.sameCaseMultiViewPairsReviewed.length, 16);

const provenanceByAsset = new Map(provenance.assets.map((entry) => [entry.asset, entry]));
assert.equal(provenanceByAsset.size, 29);
for (const assetPath of expectedPaths) {
  const record = provenanceByAsset.get(assetPath);
  assert.ok(record, `${assetPath}: missing provenance`);
  assert.ok(record.sourcePage.startsWith("https://"));
  assert.ok(record.downloadUrl.startsWith("https://"));
  assert.ok(record.creator);
  assert.ok(["CC0 1.0", "CC BY-SA 3.0", "CC BY-SA 4.0", "Public domain", "No known copyright restrictions"].includes(record.license));
  assert.ok(record.licenseUrl.startsWith("https://"));
  assert.ok(record.permittedUseBasis);
  assert.ok(record.sameObjectBasis);
}

console.log(JSON.stringify({
  validator: "validate-assets",
  status: "PASS",
  assets: manifest.assets.length,
  corpusHash,
  sha256Matches: manifest.assets.length,
  exactHashDuplicates: 0,
  crossCaseLikelyDuplicates: 0,
  forbiddenMetadataMarkers: 0,
  provenanceRecords: provenanceByAsset.size
}, null, 2));
