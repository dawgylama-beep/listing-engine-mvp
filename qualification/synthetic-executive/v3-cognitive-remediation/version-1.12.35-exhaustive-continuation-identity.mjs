import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const REPOSITORY_ROOT = "C:/Users/dawgy/Projects/listing-engine-mvp";

export function normalizePath(value) {
  return value.replaceAll("\\", "/").normalize("NFC");
}

export function compactJson(value) {
  return JSON.stringify(value);
}

export function sha256Bytes(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

export function readJson(filePath) {
  return JSON.parse(readUtf8(filePath));
}

export function writeCompactJsonCreateOnly(filePath, value) {
  fs.writeFileSync(filePath, `${compactJson(value)}\n`, { encoding: "utf8", flag: "wx" });
}

export function relativeTo(root, absolutePath) {
  return normalizePath(path.relative(root, absolutePath));
}

export function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolutePath);
      else if (entry.isFile()) files.push(absolutePath);
    }
  };
  visit(root);
  return files.sort((left, right) => normalizePath(left).localeCompare(normalizePath(right), "en"));
}

export function inventoryRoot(repositoryRoot, rootPath, { pathBase = repositoryRoot, select = () => true } = {}) {
  const absoluteRoot = path.isAbsolute(rootPath) ? rootPath : path.join(repositoryRoot, rootPath);
  if (!fs.existsSync(absoluteRoot)) {
    return {
      root: normalizePath(path.isAbsolute(rootPath) ? rootPath : relativeTo(repositoryRoot, absoluteRoot)),
      exists: false,
      fileCount: 0,
      totalBytes: 0,
      paths: [],
      files: [],
      pathSetSha256: sha256Bytes(compactJson([])),
      aggregateSha256: sha256Bytes(compactJson([])),
    };
  }
  const files = listFiles(absoluteRoot)
    .map((absolutePath) => ({ absolutePath, relativePath: relativeTo(pathBase, absolutePath) }))
    .filter(({ relativePath }) => select(relativePath))
    .map(({ absolutePath, relativePath }) => {
      const bytes = fs.readFileSync(absolutePath);
      return { relativePath, byteLength: bytes.byteLength, sha256: sha256Bytes(bytes) };
    })
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath, "en"));
  const paths = files.map(({ relativePath }) => relativePath);
  return {
    root: normalizePath(path.isAbsolute(rootPath) ? rootPath : relativeTo(repositoryRoot, absoluteRoot)),
    exists: true,
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.byteLength, 0),
    paths,
    files,
    pathSetSha256: sha256Bytes(compactJson(paths)),
    aggregateSha256: sha256Bytes(compactJson(files)),
  };
}

export function compareInventories(expected, actual) {
  const expectedByPath = new Map(expected.files.map((file) => [file.relativePath, file]));
  const actualByPath = new Map(actual.files.map((file) => [file.relativePath, file]));
  const missing = [...expectedByPath.keys()].filter((item) => !actualByPath.has(item)).sort();
  const unexpected = [...actualByPath.keys()].filter((item) => !expectedByPath.has(item)).sort();
  const changed = [...expectedByPath.keys()].filter((item) => {
    const counterpart = actualByPath.get(item);
    return counterpart && (
      counterpart.byteLength !== expectedByPath.get(item).byteLength ||
      counterpart.sha256 !== expectedByPath.get(item).sha256
    );
  }).sort();
  return {
    equal: expected.exists === actual.exists && missing.length === 0 && unexpected.length === 0 && changed.length === 0,
    existenceChanged: expected.exists !== actual.exists,
    missing,
    unexpected,
    changed,
  };
}

export function recomputeEmbeddedHash(filePath, fieldName) {
  const record = readJson(filePath);
  const declared = record[fieldName];
  delete record[fieldName];
  return { declared, recomputed: sha256Bytes(compactJson(record)), matches: declared === sha256Bytes(compactJson(record)) };
}
