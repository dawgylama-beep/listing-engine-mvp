import { createHash } from "node:crypto";

const SENSITIVE_KEY = /(?:authorization|api[_-]?key|access[_-]?token|client[_-]?secret|password|credential|chain[_-]?of[_-]?thought|reasoning)/i;

export function cleanObjectText(value, maximumCharacters = 240) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumCharacters);
}

export function normalizeObjectText(value) {
  return cleanObjectText(value, 500)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9#+'./ -]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function boundedUniqueStrings(value, maximumItems = 16, maximumCharacters = 160) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const selected = [];
  const seen = new Set();
  for (const item of values) {
    const text = cleanObjectText(item, maximumCharacters);
    const signature = normalizeObjectText(text);
    if (!text || !signature || seen.has(signature)) continue;
    seen.add(signature);
    selected.push(text);
    if (selected.length >= maximumItems) break;
  }
  return selected;
}

function stableValue(value, ancestors = new Set()) {
  if (value === undefined || typeof value === "function" || typeof value === "symbol") return undefined;
  if (value === null || typeof value !== "object") {
    if (typeof value === "number" && !Number.isFinite(value)) return null;
    return value;
  }
  if (ancestors.has(value)) return "[circular]";
  ancestors.add(value);
  let output;
  if (Array.isArray(value)) {
    output = value.map((item) => stableValue(item, ancestors)).filter((item) => item !== undefined);
  } else {
    output = {};
    for (const key of Object.keys(value).sort()) {
      const item = stableValue(value[key], ancestors);
      if (item !== undefined) output[key] = item;
    }
  }
  ancestors.delete(value);
  return output;
}
export function stableObjectJson(value) {
  return JSON.stringify(stableValue(value));
}

export function sha256Object(value) {
  return createHash("sha256").update(stableObjectJson(value)).digest("hex");
}

export function stableInternalId(prefix, value, length = 16) {
  return `${prefix}-${sha256Object(value).slice(0, length)}`;
}

export function sanitizeStructuredRecord(value, {
  maximumDepth = 8,
  maximumArrayItems = 64,
  maximumTextCharacters = 1000
} = {}, depth = 0, ancestors = new Set()) {
  if (depth > maximumDepth) return "[bounded]";
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "string") {
    return cleanObjectText(value
      .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]{12,}\b/gi, "[redacted]")
      .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, "[redacted]"), maximumTextCharacters);
  }
  if (typeof value !== "object") return value;
  if (ancestors.has(value)) return "[circular]";
  ancestors.add(value);
  let output;
  if (Array.isArray(value)) {
    output = value.slice(0, maximumArrayItems)
      .map((item) => sanitizeStructuredRecord(item, { maximumDepth, maximumArrayItems, maximumTextCharacters }, depth + 1, ancestors));
  } else {
    output = {};
    for (const key of Object.keys(value).sort()) {
      if (SENSITIVE_KEY.test(key)) continue;
      output[key] = sanitizeStructuredRecord(value[key], { maximumDepth, maximumArrayItems, maximumTextCharacters }, depth + 1, ancestors);
    }
  }
  ancestors.delete(value);
  return output;
}
