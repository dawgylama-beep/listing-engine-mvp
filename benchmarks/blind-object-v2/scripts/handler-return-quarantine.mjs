import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmod, mkdir, open, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { defaultResultHistoryRoot } from "./execution-store.mjs";
import { sha256Bytes, sha256Json, stableJson } from "./protocol.mjs";

export const QUARANTINE_SCHEMA_VERSION = "1.0";
export const QUARANTINE_ENCRYPTION = "AES-256-GCM_WITH_WINDOWS_DPAPI_CURRENT_USER_KEY_PROTECTION";
export const defaultHandlerReturnQuarantineRoot = path.join(defaultResultHistoryRoot, ".handler-return-quarantine");

const HASH = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,159}$/;

function canonicalizeHandlerValue(node, ancestors = new WeakMap(), location = "$") {
  if (node === null || typeof node === "string" || typeof node === "boolean") return node;
  if (typeof node === "number") return Number.isFinite(node) ? node : { $nonfiniteNumber: String(node) };
  if (typeof node === "bigint") return { $bigint: node.toString() };
  if (typeof node === "undefined") return { $undefined: true };
  if (typeof node === "symbol") return { $symbol: String(node.description || "") };
  if (typeof node === "function") return { $function: String(node.name || "anonymous") };
  if (Buffer.isBuffer(node) || ArrayBuffer.isView(node)) return { $bytes: Buffer.from(node.buffer, node.byteOffset, node.byteLength).toString("base64") };
  if (node instanceof Date) return { $date: Number.isNaN(node.valueOf()) ? "INVALID" : node.toISOString() };
  if (ancestors.has(node)) return { $cycleReference: ancestors.get(node) };
  ancestors.set(node, location);
  if (Array.isArray(node)) return node.map((entry, index) => canonicalizeHandlerValue(entry, ancestors, `${location}[${index}]`));
  const output = {};
  for (const key of Object.keys(node).sort()) {
    try { output[key] = canonicalizeHandlerValue(node[key], ancestors, `${location}.${key}`); }
    catch (error) { output[key] = { $unreadable: String(error?.name || "Error") }; }
  }
  return output;
}

export function canonicalHandlerResultBytes(value) {
  return Buffer.from(`${stableJson(canonicalizeHandlerValue(value))}\n`, "utf8");
}

export function canonicalHandlerResultHash(value) {
  return sha256Bytes(canonicalHandlerResultBytes(value));
}

function dpapi(command, bytes) {
  assert.equal(process.platform, "win32", "handler quarantine requires Windows DPAPI in this execution environment");
  const operation = command === "protect" ? "Protect" : "Unprotect";
  const script = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; $s=[Console]::In.ReadToEnd(); $b=[Convert]::FromBase64String($s); $o=[System.Security.Cryptography.ProtectedData]::${operation}($b,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($o))`;
  const child = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script], {
    input: bytes.toString("base64"),
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 1024 * 1024
  });
  assert.equal(child.status, 0, `Windows DPAPI ${command} failed`);
  assert.equal(String(child.stderr || "").trim(), "", `Windows DPAPI ${command} produced diagnostics`);
  return Buffer.from(String(child.stdout || "").trim(), "base64");
}

async function ensureRestrictedDirectory(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  try { await chmod(directory, 0o700); } catch (error) { if (process.platform !== "win32") throw error; }
  return realpath(directory);
}

async function writeExclusiveBytes(filePath, bytes) {
  await ensureRestrictedDirectory(path.dirname(filePath));
  const handle = await open(filePath, "wx", 0o600);
  try { await handle.writeFile(bytes); await handle.sync(); }
  finally { await handle.close(); }
  try { await chmod(filePath, 0o600); } catch (error) { if (process.platform !== "win32") throw error; }
}

function bindingCore(bindings) {
  const fields = ["executionReleaseRecordHash", "consentId", "consentHash", "invocationId", "reservationId", "reservationHash", "resultId", "resultRootName", "requestId", "requestHash", "physicalSubmissionIdentity"];
  const core = {};
  for (const field of fields) {
    const value = bindings[field];
    if (field.endsWith("Hash")) assert.match(value || "", HASH, `quarantine ${field} is invalid`);
    else assert.match(value || "", SAFE_ID, `quarantine ${field} is invalid`);
    core[field] = value;
  }
  return core;
}

export async function quarantineHandlerReturn({ handlerResult, bindings, quarantineRoot = defaultHandlerReturnQuarantineRoot, createdAt }) {
  assert.equal(new Date(createdAt).toISOString(), createdAt);
  const identity = bindingCore(bindings);
  const plaintext = canonicalHandlerResultBytes(handlerResult);
  const plaintextHash = sha256Bytes(plaintext);
  const artifactIdentity = sha256Json({ ...identity, canonicalHandlerResultHash: plaintextHash, canonicalHandlerResultBytes: plaintext.length });
  const artifactId = `handler-quarantine-${artifactIdentity.slice(0, 48)}`;
  const aadCore = { schemaVersion: QUARANTINE_SCHEMA_VERSION, artifactId, ...identity, canonicalHandlerResultHash: plaintextHash, canonicalHandlerResultBytes: plaintext.length };
  const aad = Buffer.from(stableJson(aadCore), "utf8");
  const key = randomBytes(32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const protectedKey = dpapi("protect", key);
  key.fill(0);
  const envelopeCore = {
    ...aadCore,
    envelopeType: "ENCRYPTED_HANDLER_RETURN_QUARANTINE",
    encryption: QUARANTINE_ENCRYPTION,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    protectedKey: protectedKey.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    ciphertextHash: sha256Bytes(ciphertext),
    ciphertextBytes: ciphertext.length,
    createdAt
  };
  const envelope = Object.freeze({ ...envelopeCore, envelopeHash: sha256Json(envelopeCore) });
  const root = path.resolve(quarantineRoot);
  const directory = path.join(root, identity.executionReleaseRecordHash, identity.invocationId, identity.requestId);
  await ensureRestrictedDirectory(directory);
  const filePath = path.join(directory, `${artifactId}.json.enc`);
  await writeExclusiveBytes(filePath, Buffer.from(`${stableJson(envelope)}\n`, "utf8"));
  const receiptCore = {
    schemaVersion: QUARANTINE_SCHEMA_VERSION,
    receiptType: "HANDLER_RETURN_QUARANTINE_RECEIPT",
    artifactId,
    ...identity,
    canonicalHandlerResultHash: plaintextHash,
    canonicalHandlerResultBytes: plaintext.length,
    encryption: QUARANTINE_ENCRYPTION,
    ciphertextHash: envelope.ciphertextHash,
    ciphertextBytes: envelope.ciphertextBytes,
    envelopeHash: envelope.envelopeHash,
    accessControl: "OWNER_PROCESS_CONTEXT_AND_DPAPI_CURRENT_USER",
    publicArtifact: false,
    gitTracked: false,
    rawContentLogged: false,
    createdAt
  };
  const receiptId = `quarantine-receipt-${sha256Json(receiptCore).slice(0, 48)}`;
  const receipt = Object.freeze({ ...receiptCore, receiptId, receiptHash: sha256Json({ ...receiptCore, receiptId }) });
  const readback = await readQuarantinedHandlerReturn({ receipt, bindings, quarantineRoot });
  assert.deepEqual(readback.handlerResult, canonicalizeHandlerValue(handlerResult));
  return Object.freeze({ receipt, filePath, handlerResult: readback.handlerResult });
}

export async function readQuarantinedHandlerReturn({ receipt, bindings, quarantineRoot = defaultHandlerReturnQuarantineRoot }) {
  const identity = bindingCore(bindings);
  for (const [field, value] of Object.entries(identity)) assert.equal(receipt[field], value, `quarantine receipt ${field} substitution detected`);
  assert.equal(receipt.receiptType, "HANDLER_RETURN_QUARANTINE_RECEIPT");
  assert.match(receipt.receiptId || "", /^quarantine-receipt-[a-f0-9]{48}$/);
  assert.match(receipt.receiptHash || "", HASH);
  const receiptCore = structuredClone(receipt); delete receiptCore.receiptHash;
  assert.equal(sha256Json(receiptCore), receipt.receiptHash);
  const root = path.resolve(quarantineRoot);
  const filePath = path.join(root, receipt.executionReleaseRecordHash, receipt.invocationId, receipt.requestId, `${receipt.artifactId}.json.enc`);
  const bytes = await readFile(filePath);
  const envelope = JSON.parse(bytes.toString("utf8"));
  const envelopeCore = structuredClone(envelope); delete envelopeCore.envelopeHash;
  assert.equal(sha256Json(envelopeCore), envelope.envelopeHash);
  assert.equal(envelope.envelopeHash, receipt.envelopeHash);
  for (const [field, value] of Object.entries(identity)) assert.equal(envelope[field], value, `quarantine envelope ${field} substitution detected`);
  assert.equal(envelope.artifactId, receipt.artifactId);
  const ciphertext = Buffer.from(envelope.ciphertext, "base64");
  assert.equal(ciphertext.length, receipt.ciphertextBytes);
  assert.equal(sha256Bytes(ciphertext), receipt.ciphertextHash);
  const key = dpapi("unprotect", Buffer.from(envelope.protectedKey, "base64"));
  try {
    const aadCore = { schemaVersion: envelope.schemaVersion, artifactId: envelope.artifactId, ...identity, canonicalHandlerResultHash: envelope.canonicalHandlerResultHash, canonicalHandlerResultBytes: envelope.canonicalHandlerResultBytes };
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"));
    decipher.setAAD(Buffer.from(stableJson(aadCore), "utf8"));
    decipher.setAuthTag(Buffer.from(envelope.authTag, "base64"));
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    assert.equal(plaintext.length, receipt.canonicalHandlerResultBytes);
    assert.equal(sha256Bytes(plaintext), receipt.canonicalHandlerResultHash);
    return Object.freeze({ valid: true, handlerResult: JSON.parse(plaintext.toString("utf8")), canonicalHandlerResultHash: receipt.canonicalHandlerResultHash, canonicalHandlerResultBytes: plaintext.length });
  } finally { key.fill(0); }
}
