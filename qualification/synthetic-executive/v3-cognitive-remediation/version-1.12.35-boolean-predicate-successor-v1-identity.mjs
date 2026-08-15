import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const ROOT = "C:/Users/dawgy/Projects/listing-engine-mvp";
export const compactJson = (value) => JSON.stringify(value);
export const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
export const normalizePath = (value) => value.replaceAll("\\", "/").normalize("NFC");
export const readUtf8 = (filePath) => fs.readFileSync(filePath, { encoding: "utf8" });
export const readJson = (filePath) => JSON.parse(readUtf8(filePath));
export const writeCreateOnly = (filePath, value) => fs.writeFileSync(filePath, `${compactJson(value)}\n`, { encoding: "utf8", flag: "wx" });

export function listFiles(rootPath) {
  if (fs.existsSync(rootPath) !== true) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory() === true) visit(absolutePath);
      else if (entry.isFile() === true) files.push(absolutePath);
    }
  };
  visit(rootPath);
  return files.sort((left, right) => normalizePath(left) < normalizePath(right) ? -1 : normalizePath(left) > normalizePath(right) ? 1 : 0);
}

export function inventoryRoot(rootPath, { pathBase = rootPath, select = () => true } = {}) {
  const absoluteRoot = path.resolve(rootPath);
  const normalizedRoot = normalizePath(absoluteRoot);
  if (fs.existsSync(absoluteRoot) !== true) return { root: normalizedRoot, exists: false, fileCount: 0, totalBytes: 0, paths: [], files: [], pathSetSha256: sha256("[]"), aggregateSha256: sha256("[]") };
  const files = listFiles(absoluteRoot).map((absolutePath) => ({ absolutePath, relativePath: normalizePath(path.relative(pathBase, absolutePath)) }))
    .filter((item) => select(item.relativePath) === true)
    .map(({ absolutePath, relativePath }) => {
      const bytes = fs.readFileSync(absolutePath);
      return { relativePath, byteLength: bytes.byteLength, sha256: sha256(bytes) };
    })
    .sort((left, right) => left.relativePath < right.relativePath ? -1 : left.relativePath > right.relativePath ? 1 : 0);
  const paths = files.map((file) => file.relativePath);
  return { root: normalizedRoot, exists: true, fileCount: files.length, totalBytes: files.reduce((sum, file) => sum + file.byteLength, 0), paths, files, pathSetSha256: sha256(compactJson(paths)), aggregateSha256: sha256(compactJson(files)) };
}

export function compareInventories(expected, actual) {
  const expectedByPath = new Map(expected.files.map((file) => [file.relativePath, file]));
  const actualByPath = new Map(actual.files.map((file) => [file.relativePath, file]));
  const missing = [...expectedByPath.keys()].filter((item) => actualByPath.has(item) !== true).sort();
  const unexpected = [...actualByPath.keys()].filter((item) => expectedByPath.has(item) !== true).sort();
  const changed = [...expectedByPath.keys()].filter((item) => {
    if (actualByPath.has(item) !== true) return false;
    const left = expectedByPath.get(item);
    const right = actualByPath.get(item);
    return left.byteLength !== right.byteLength || left.sha256 !== right.sha256;
  }).sort();
  return { equal: expected.exists === actual.exists && missing.length === 0 && unexpected.length === 0 && changed.length === 0, existenceChanged: expected.exists !== actual.exists, missing, unexpected, changed };
}

export function sealRecord(basis, fieldName) {
  return { ...basis, [fieldName]: sha256(compactJson(basis)) };
}

export function verifySeal(record, fieldName) {
  if (Object.prototype.hasOwnProperty.call(record, fieldName) !== true || typeof record[fieldName] !== "string") return { valid: false, declared: null, computed: null };
  const basis = structuredClone(record);
  const declared = basis[fieldName];
  delete basis[fieldName];
  const computed = sha256(compactJson(basis));
  return { valid: declared === computed, declared, computed };
}
