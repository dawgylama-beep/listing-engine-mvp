import assert from "node:assert/strict";
import crypto from "node:crypto";
import { mkdir, open, readFile } from "node:fs/promises";
import path from "node:path";

export const HASH = /^[a-f0-9]{64}$/;
export const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

export function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

export function stableJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function sha256Bytes(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sha256Json(value) {
  return sha256Bytes(Buffer.from(stableJson(value), "utf8"));
}

export function seal(core, hashField = "contentHash") {
  return Object.freeze({ ...core, [hashField]: sha256Json(core) });
}

export function exactKeys(value, expected, label) {
  assert.deepEqual(Object.keys(value || {}).sort(), [...expected].sort(), `${label} fields differ`);
}

export function canonicalIso(value, label = "timestamp") {
  assert.equal(new Date(value).toISOString(), value, `${label} must be canonical ISO UTC`);
  return value;
}

export function assertHash(value, label = "hash") {
  assert.match(value || "", HASH, `${label} must be SHA-256`);
}

export function assertSafeId(value, label = "identity") {
  assert.match(value || "", SAFE_ID, `${label} is invalid`);
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeExclusiveJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const handle = await open(filePath, "wx", 0o600);
  try {
    await handle.writeFile(`${stableJson(value)}\n`, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export function assertRelativeArtifactPath(value) {
  assert.equal(typeof value, "string");
  assert.notEqual(value.length, 0);
  assert.equal(path.isAbsolute(value), false, "artifact path must be relative");
  const normalized = value.replaceAll("\\", "/");
  assert.equal(normalized.startsWith("../") || normalized.includes("/../") || normalized === "..", false, "artifact traversal is forbidden");
  assert.equal(normalized.includes("\0"), false, "artifact path contains NUL");
  return normalized;
}
