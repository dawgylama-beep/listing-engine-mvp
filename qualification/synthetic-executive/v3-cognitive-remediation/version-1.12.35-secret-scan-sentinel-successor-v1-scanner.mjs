import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  ROOT,
  compactJson,
  sha256,
  verifySeal,
} from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";

export const SCANNER_PREFIX = "version-1.12.35-secret-scan-sentinel-successor-v1";
export const FINDING_SOURCE_PATHS = Object.freeze([
  "benchmarks/blind-object-v2/scripts/offline-execution-qualification.mjs",
  "tests/blind-object-v2-execution-spine.test.mjs",
  "tests/synthetic-executive-blind-qualification-real-route.test.mjs",
]);

const PHASE6A_DIRECTORY_PREFIX = "benchmarks/blind-object-v1-results/phase6a-e3caa2fd/";
const PHASE6A_INVOCATION_MANIFEST = "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json";
const LEGACY_EXPLICIT_FIXTURE_MARKER = /(?:test|fake|example|dummy|redact|placeholder|fixture|synthetic|mock)/i;
const RULE_IDS = Object.freeze(["OPENAI_KEY", "AWS_KEY", "PRIVATE_KEY", "BEARER_VALUE"]);

const patternDefinitions = Object.freeze([
  Object.freeze({ ruleId: "OPENAI_KEY", create: () => /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g }),
  Object.freeze({ ruleId: "AWS_KEY", create: () => /\bAKIA[0-9A-Z]{16}\b/g }),
  Object.freeze({ ruleId: "PRIVATE_KEY", create: () => /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{100,}?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }),
  Object.freeze({ ruleId: "BEARER_VALUE", create: () => /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{20,}/gi }),
]);

const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const normalizedPath = (value) => value.replaceAll("\\", "/");
const shaPattern = /^[0-9a-f]{64}$/;

function requirePlainObject(value, label) {
  if (typeof value !== "object" || value === null || Array.isArray(value) === true) throw new Error(`${label}:EXPECTED_PLAIN_OBJECT`);
  return value;
}

function requireExactKeys(value, keys, label) {
  requirePlainObject(value, label);
  if (compactJson(Object.keys(value).sort()) !== compactJson([...keys].sort())) throw new Error(`${label}:EXACT_KEYS_MISMATCH`);
}

function requireSha(value, label) {
  if (typeof value !== "string" || shaPattern.test(value) !== true) throw new Error(`${label}:EXPECTED_SHA256`);
}

function requireNormalizedLiteralPath(value, label) {
  if (typeof value !== "string" || value.length === 0 || normalizedPath(value) !== value || path.posix.normalize(value) !== value || path.posix.isAbsolute(value) === true || value.startsWith("../") === true) {
    throw new Error(`${label}:EXPECTED_NORMALIZED_REPOSITORY_PATH`);
  }
  if (["*", "?", "[", "]", "{", "}"].some((marker) => value.includes(marker))) throw new Error(`${label}:REGISTRY_WILDCARD_PATH_FORBIDDEN`);
}

export function validateSentinelRegistry(registry) {
  requireExactKeys(registry, [
    "schemaVersion",
    "registryType",
    "registryState",
    "version",
    "historicalFailure",
    "exceptionPolicy",
    "entries",
    "registryHash",
  ], "registry");
  if (registry.schemaVersion !== "1.0") throw new Error("registry.schemaVersion:EXPECTED_1_0");
  if (registry.registryType !== "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_REGISTRY") throw new Error("registry.registryType:UNEXPECTED");
  if (registry.registryState !== "SEALED_APPEND_ONLY") throw new Error("registry.registryState:UNEXPECTED");
  if (registry.version !== "1.12.35") throw new Error("registry.version:UNEXPECTED");
  requirePlainObject(registry.historicalFailure, "registry.historicalFailure");
  requirePlainObject(registry.exceptionPolicy, "registry.exceptionPolicy");
  if (registry.exceptionPolicy.matchMode !== "EXACT_PATH_SOURCE_HASH_RULE_ORDINAL_COUNT_AND_FINDING_FINGERPRINT") throw new Error("registry.exceptionPolicy.matchMode:UNEXPECTED");
  if (registry.exceptionPolicy.wildcardsAllowed !== false || registry.exceptionPolicy.directoryExemptionsAllowed !== false || registry.exceptionPolicy.ruleWideExemptionsAllowed !== false) throw new Error("registry.exceptionPolicy:FAIL_CLOSED_FLAGS_REQUIRED");
  if (Array.isArray(registry.entries) !== true || registry.entries.length !== 6) throw new Error("registry.entries:EXPECTED_EXACTLY_SIX");
  const entryKeys = ["entryId", "relativePath", "sourceSha256", "ruleId", "findingSha256", "occurrenceOrdinal", "expectedOccurrenceCount", "matchedLength", "classification"];
  const entryIds = [];
  const identities = [];
  for (const [index, entry] of registry.entries.entries()) {
    const label = `registry.entries[${index}]`;
    requireExactKeys(entry, entryKeys, label);
    if (entry.entryId !== `FINDING-${String(index + 1).padStart(3, "0")}`) throw new Error(`${label}.entryId:UNEXPECTED_ORDER`);
    requireNormalizedLiteralPath(entry.relativePath, `${label}.relativePath`);
    requireSha(entry.sourceSha256, `${label}.sourceSha256`);
    requireSha(entry.findingSha256, `${label}.findingSha256`);
    if (RULE_IDS.includes(entry.ruleId) !== true) throw new Error(`${label}.ruleId:UNEXPECTED`);
    if (Number.isInteger(entry.occurrenceOrdinal) !== true || entry.occurrenceOrdinal < 1) throw new Error(`${label}.occurrenceOrdinal:EXPECTED_POSITIVE_INTEGER`);
    if (Number.isInteger(entry.expectedOccurrenceCount) !== true || entry.expectedOccurrenceCount < entry.occurrenceOrdinal) throw new Error(`${label}.expectedOccurrenceCount:INVALID`);
    if (Number.isInteger(entry.matchedLength) !== true || entry.matchedLength < 20) throw new Error(`${label}.matchedLength:INVALID`);
    if (entry.classification !== "PROVED_NON_SECRET") throw new Error(`${label}.classification:UNEXPECTED`);
    entryIds.push(entry.entryId);
    identities.push(compactJson([entry.relativePath, entry.sourceSha256, entry.ruleId, entry.occurrenceOrdinal, entry.expectedOccurrenceCount, entry.findingSha256]));
  }
  if (new Set(entryIds).size !== entryIds.length || new Set(identities).size !== identities.length) throw new Error("registry.entries:DUPLICATE_IDENTITY");
  const seal = verifySeal(registry, "registryHash");
  if (seal.valid !== true) throw new Error("registry.registryHash:INVALID_SEAL");
  return registry;
}

function findingMetrics(ruleId, raw) {
  const token = ruleId === "BEARER_VALUE" ? (/bearer\s+([^\s]+)/i.exec(raw)?.[1] || "") : raw;
  let prefixClass = "NOT_APPLICABLE";
  let payload = token;
  if (ruleId === "OPENAI_KEY") {
    prefixClass = token.startsWith("sk-proj-") ? "SK_PROJECT" : token.startsWith("sk-svcacct-") ? "SK_SERVICE_ACCOUNT" : "SK_LEGACY";
    payload = token.replace(/^sk-(?:proj-|svcacct-)?/, "");
  } else if (ruleId === "BEARER_VALUE") {
    prefixClass = "BEARER_TOKEN";
  }
  return {
    matchedLength: raw.length,
    prefixClass,
    payloadLength: payload.length,
    uniquePayloadCharacters: new Set(payload).size,
  };
}

export function detectSanitizedFindings(sources) {
  if (Array.isArray(sources) !== true) throw new Error("sources:EXPECTED_ARRAY");
  const findings = [];
  let legacyExplicitFixtureSuppressionCount = 0;
  for (const [sourceIndex, item] of sources.entries()) {
    requireExactKeys(item, ["relativePath", "source", "sourceSha256"], `sources[${sourceIndex}]`);
    requireNormalizedLiteralPath(item.relativePath, `sources[${sourceIndex}].relativePath`);
    if (typeof item.source !== "string") throw new Error(`sources[${sourceIndex}].source:EXPECTED_STRING`);
    requireSha(item.sourceSha256, `sources[${sourceIndex}].sourceSha256`);
    for (const definition of patternDefinitions) {
      const pattern = definition.create();
      const provisional = [];
      for (const match of item.source.matchAll(pattern)) {
        if (LEGACY_EXPLICIT_FIXTURE_MARKER.test(match[0]) === true) {
          legacyExplicitFixtureSuppressionCount += 1;
          continue;
        }
        provisional.push({ match, metrics: findingMetrics(definition.ruleId, match[0]) });
      }
      const expectedOccurrenceCount = provisional.length;
      for (const [ordinalIndex, provisionalFinding] of provisional.entries()) {
        const line = item.source.slice(0, provisionalFinding.match.index).split(/\r?\n/).length;
        findings.push({
          relativePath: item.relativePath,
          sourceSha256: item.sourceSha256,
          ruleId: definition.ruleId,
          findingSha256: sha256(provisionalFinding.match[0].normalize("NFC")),
          occurrenceOrdinal: ordinalIndex + 1,
          expectedOccurrenceCount,
          line,
          ...provisionalFinding.metrics,
        });
      }
    }
  }
  return { findings, legacyExplicitFixtureSuppressionCount, rawValuesEmitted: 0 };
}

export function scanSanitizedSources(sources, registry) {
  validateSentinelRegistry(registry);
  const detection = detectSanitizedFindings(sources);
  const expectedByIdentity = new Map(registry.entries.map((entry) => [compactJson([
    entry.relativePath,
    entry.sourceSha256,
    entry.ruleId,
    entry.occurrenceOrdinal,
    entry.expectedOccurrenceCount,
    entry.findingSha256,
  ]), entry]));
  const matchedEntryIds = new Set();
  const findings = detection.findings.map((finding) => {
    const identity = compactJson([
      finding.relativePath,
      finding.sourceSha256,
      finding.ruleId,
      finding.occurrenceOrdinal,
      finding.expectedOccurrenceCount,
      finding.findingSha256,
    ]);
    const expected = expectedByIdentity.get(identity);
    if (expected !== undefined) matchedEntryIds.add(expected.entryId);
    return {
      relativePath: finding.relativePath,
      ruleId: finding.ruleId,
      findingSha256: finding.findingSha256,
      occurrenceOrdinal: finding.occurrenceOrdinal,
      expectedOccurrenceCount: finding.expectedOccurrenceCount,
      classification: expected === undefined ? "POTENTIAL_SECRET" : "PROVED_NON_SECRET_SENTINEL",
      registryEntryId: expected?.entryId || null,
    };
  });
  const unexpectedFindings = findings.filter((finding) => finding.classification === "POTENTIAL_SECRET");
  const missingRegistryEntries = registry.entries.filter((entry) => matchedEntryIds.has(entry.entryId) !== true).map((entry) => entry.entryId);
  const knownSentinelFindings = findings.filter((finding) => finding.classification === "PROVED_NON_SECRET_SENTINEL");
  return {
    status: unexpectedFindings.length === 0 && missingRegistryEntries.length === 0 && knownSentinelFindings.length === 6 ? "PASS" : "FAIL",
    filesScanned: sources.length,
    credentialValuesRead: 0,
    rawValuesEmitted: 0,
    legacyExplicitFixtureSuppressionCount: detection.legacyExplicitFixtureSuppressionCount,
    findings,
    knownSentinelFindingCount: knownSentinelFindings.length,
    unexpectedFindingCount: unexpectedFindings.length,
    missingRegistryEntryCount: missingRegistryEntries.length,
    missingRegistryEntries,
  };
}

export function readSanitizedSources(repositoryRoot, relativePaths) {
  return relativePaths.map((relativePath) => {
    const bytes = fs.readFileSync(path.join(repositoryRoot, relativePath));
    return { relativePath, source: bytes.toString("utf8"), sourceSha256: sha256(bytes) };
  });
}

export function repositoryCandidatePaths(repositoryRoot = ROOT) {
  const gitZ = (args) => childProcess.execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0).map(normalizedPath);
  const tracked = gitZ(["ls-files", "-z"]);
  const untracked = gitZ(["ls-files", "--others", "--exclude-standard", "-z"]);
  return [...new Set([...tracked, ...untracked])].filter((relativePath) => relativePath.startsWith(PHASE6A_DIRECTORY_PREFIX) !== true && relativePath !== PHASE6A_INVOCATION_MANIFEST).sort();
}

export function scanRepository(repositoryRoot, registry) {
  const candidatePaths = repositoryCandidatePaths(repositoryRoot);
  const sources = [];
  const unreadable = [];
  for (const relativePath of candidatePaths) {
    try {
      const bytes = fs.readFileSync(path.join(repositoryRoot, relativePath));
      sources.push({ relativePath, source: bytes.toString("utf8"), sourceSha256: sha256(bytes) });
    } catch {
      unreadable.push(relativePath);
    }
  }
  if (unreadable.length !== 0) return { status: "FAIL", code: "SECRET_SCAN_UNREADABLE_FILES", filesScanned: sources.length, credentialValuesRead: 0, rawValuesEmitted: 0, unreadable };
  const result = scanSanitizedSources(sources, registry);
  return { ...result, unreadable: [], code: result.status === "PASS" ? null : "SECRET_FINDINGS_OR_STALE_SENTINEL_REGISTRY" };
}

export function assertNoRawValueFields(value, label = "value") {
  const forbidden = /^(?:raw|rawValue|matchedValue|secretValue|credentialValue)$/i;
  const visit = (node, location) => {
    if (Array.isArray(node) === true) return node.forEach((item, index) => visit(item, `${location}[${index}]`));
    if (typeof node !== "object" || node === null) return;
    for (const [key, child] of Object.entries(node)) {
      if (forbidden.test(key) === true) throw new Error(`${location}.${key}:RAW_VALUE_FIELD_FORBIDDEN`);
      visit(child, `${location}.${key}`);
    }
  };
  visit(value, label);
  return true;
}

export const scannerInternals = Object.freeze({
  ruleIds: RULE_IDS,
  legacyExplicitFixtureMarkerPreserved: true,
  legacyExplicitFixtureMarkerBasis: "MATCH_TEXT_ONLY",
  phase6aExcluded: true,
  rawValuesEmitted: 0,
  own,
});
