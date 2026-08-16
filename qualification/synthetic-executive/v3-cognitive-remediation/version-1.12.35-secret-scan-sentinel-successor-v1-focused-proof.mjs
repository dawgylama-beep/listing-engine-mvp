import assert from "node:assert/strict";
import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import {
  ROOT,
  compactJson,
  readJson,
  sealRecord,
  sha256,
  verifySeal,
  writeCreateOnly,
} from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";
import {
  FINDING_SOURCE_PATHS,
  SCANNER_PREFIX,
  assertNoRawValueFields,
  readSanitizedSources,
  scanSanitizedSources,
  validateSentinelRegistry,
} from "./version-1.12.35-secret-scan-sentinel-successor-v1-scanner.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const registryPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-registry.json`);
const correctionPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-correction.json`);
const resultPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-focused-proof-result.json`);
if (fs.existsSync(resultPath) === true) throw new Error(`FOCUSED_PROOF_ALREADY_EXECUTED:${resultPath}`);

const registry = readJson(registryPath);
const correction = readJson(correctionPath);
validateSentinelRegistry(registry);
if (verifySeal(correction, "correctionHash").valid !== true) throw new Error("CORRECTION_SEAL_INVALID");
if (correction.registry.registryHash !== registry.registryHash || correction.registry.sha256 !== sha256(fs.readFileSync(registryPath))) throw new Error("CORRECTION_REGISTRY_BINDING_MISMATCH");

for (const binding of correction.scriptBindings) {
  const absolutePath = path.join(ROOT, binding.relativePath);
  if (sha256(fs.readFileSync(absolutePath)) !== binding.sha256) throw new Error(`SCRIPT_BINDING_MISMATCH:${binding.relativePath}`);
}

const syntaxChecks = correction.scriptBindings.map((binding) => {
  const result = childProcess.spawnSync(process.execPath, ["--check", path.join(ROOT, binding.relativePath)], { cwd: ROOT, encoding: "utf8", windowsHide: true, shell: false });
  return {
    relativePath: binding.relativePath,
    sourceSha256: binding.sha256,
    exitCode: result.status,
    stdoutSha256: sha256(typeof result.stdout === "string" ? result.stdout : ""),
    stderrSha256: sha256(typeof result.stderr === "string" ? result.stderr : ""),
    spawnError: ownError(result) === null ? null : "SPAWN_ERROR_PRESENT",
  };
});
assert.equal(syntaxChecks.length, 5);
assert.equal(syntaxChecks.every((item) => item.exitCode === 0 && item.spawnError === null), true);

function ownError(result) {
  return Object.prototype.hasOwnProperty.call(result, "error") ? result.error : null;
}

function sourceRecord(relativePath, source) {
  return { relativePath, source, sourceSha256: sha256(Buffer.from(source, "utf8")) };
}

function resealRegistry(mutate) {
  const basis = structuredClone(registry);
  delete basis.registryHash;
  mutate(basis);
  const sealed = sealRecord(basis, "registryHash");
  validateSentinelRegistry(sealed);
  return sealed;
}

const actualSources = readSanitizedSources(ROOT, FINDING_SOURCE_PATHS);
const actualResult = scanSanitizedSources(actualSources, registry);
assert.equal(actualResult.status, "PASS");
assert.equal(actualResult.findings.length, 6);
assert.equal(actualResult.knownSentinelFindingCount, 6);
assert.equal(actualResult.unexpectedFindingCount, 0);
assert.equal(actualResult.missingRegistryEntryCount, 0);
assert.equal(actualResult.findings.every((finding) => finding.classification === "PROVED_NON_SECRET_SENTINEL" && finding.registryEntryId !== null), true);

const realisticShape = "sk-proj-" + "A1b2C3d4".repeat(6);
const outsideSource = sourceRecord("src/runtime-provider-client.mjs", `export const credential = "${realisticShape}";\n`);
const outsideResult = scanSanitizedSources([outsideSource], registry);
assert.equal(outsideResult.status, "FAIL");
assert.equal(outsideResult.unexpectedFindingCount, 1);
assert.equal(outsideResult.findings[0].classification, "POTENTIAL_SECRET");

const insideSource = sourceRecord("tests/runtime-provider-client.test.mjs", outsideSource.source);
const insideResult = scanSanitizedSources([insideSource], registry);
assert.equal(insideResult.status, "FAIL");
assert.equal(insideResult.unexpectedFindingCount, 1);
assert.equal(insideResult.findings[0].classification, "POTENTIAL_SECRET");

const staleSources = structuredClone(actualSources);
staleSources[0] = sourceRecord(staleSources[0].relativePath, `${staleSources[0].source}\n// deliberate source drift\n`);
const staleResult = scanSanitizedSources(staleSources, registry);
assert.equal(staleResult.status, "FAIL");
assert.equal(staleResult.unexpectedFindingCount >= 1, true);
assert.equal(staleResult.missingRegistryEntryCount >= 1, true);

const additionalSources = structuredClone(actualSources);
additionalSources[0] = sourceRecord(additionalSources[0].relativePath, `${additionalSources[0].source}\nconst additionalCredentialShape = "${realisticShape}";\n`);
const additionalRegistry = resealRegistry((basis) => {
  const entry = basis.entries.find((candidate) => candidate.entryId === "FINDING-001");
  entry.sourceSha256 = additionalSources[0].sourceSha256;
  entry.expectedOccurrenceCount = 2;
});
const additionalResult = scanSanitizedSources(additionalSources, additionalRegistry);
assert.equal(additionalResult.status, "FAIL");
assert.equal(additionalResult.knownSentinelFindingCount, 6);
assert.equal(additionalResult.unexpectedFindingCount, 1);

const differentRuleRegistry = resealRegistry((basis) => {
  basis.entries[0].ruleId = "BEARER_VALUE";
});
const differentRuleResult = scanSanitizedSources(actualSources, differentRuleRegistry);
assert.equal(differentRuleResult.status, "FAIL");
assert.equal(differentRuleResult.unexpectedFindingCount >= 1, true);
assert.equal(differentRuleResult.missingRegistryEntryCount >= 1, true);

let wildcardFailure = null;
try {
  const wildcardBasis = structuredClone(registry);
  delete wildcardBasis.registryHash;
  wildcardBasis.entries[0].relativePath = "tests/*";
  scanSanitizedSources(actualSources, sealRecord(wildcardBasis, "registryHash"));
} catch (error) {
  wildcardFailure = error;
}
assert.ok(wildcardFailure instanceof Error);
assert.match(wildcardFailure.message, /WILDCARD_PATH_FORBIDDEN/);

const unusableShape = "sk-proj-" + "AbCdEf01".repeat(3);
const unusableSource = sourceRecord("fixtures/undersized-provider-shape.mjs", `export default "${unusableShape}";\n`);
const unusableResult = scanSanitizedSources([unusableSource], registry);
assert.equal(unusableResult.status, "FAIL");
assert.equal(unusableResult.unexpectedFindingCount, 1);
assert.equal(unusableResult.findings[0].ruleId, "OPENAI_KEY");

const cases = [
  { caseId: "ALL_SIX_DETECTED_REPORTED_WITHOUT_RAW_VALUES", status: "PASS", knownSentinelFindingCount: actualResult.knownSentinelFindingCount, sanitizedFindingFingerprints: actualResult.findings.map((finding) => finding.findingSha256) },
  { caseId: "REAL_SHAPED_CREDENTIAL_OUTSIDE_TEST_PATH_FAILS", status: "PASS", disposition: outsideResult.status, unexpectedFindingCount: outsideResult.unexpectedFindingCount },
  { caseId: "SAME_REAL_SHAPED_CREDENTIAL_INSIDE_TEST_PATH_FAILS", status: "PASS", disposition: insideResult.status, unexpectedFindingCount: insideResult.unexpectedFindingCount },
  { caseId: "STALE_FINGERPRINT_OR_SOURCE_HASH_FAILS", status: "PASS", disposition: staleResult.status, unexpectedFindingCount: staleResult.unexpectedFindingCount, missingRegistryEntryCount: staleResult.missingRegistryEntryCount },
  { caseId: "SAME_FILE_ADDITIONAL_FINDING_FAILS", status: "PASS", disposition: additionalResult.status, knownSentinelFindingCount: additionalResult.knownSentinelFindingCount, unexpectedFindingCount: additionalResult.unexpectedFindingCount },
  { caseId: "DIFFERENT_RULE_BINDING_FAILS", status: "PASS", disposition: differentRuleResult.status, unexpectedFindingCount: differentRuleResult.unexpectedFindingCount, missingRegistryEntryCount: differentRuleResult.missingRegistryEntryCount },
  { caseId: "WILDCARD_REGISTRY_ENTRY_FAILS", status: "PASS", failureCode: "REGISTRY_WILDCARD_PATH_FORBIDDEN" },
  { caseId: "REAL_SHAPED_UNUSABLE_SYNTHETIC_FIXTURE_IS_DETECTED", status: "PASS", disposition: unusableResult.status, unexpectedFindingCount: unusableResult.unexpectedFindingCount },
  { caseId: "PROOF_OUTPUT_CONTAINS_ZERO_RAW_VALUES", status: "PASS", rawValuesPersisted: 0 },
  { caseId: "EVERY_CHANGED_SCRIPT_PARSES", status: "PASS", scriptsChecked: syntaxChecks.length },
];
assert.deepEqual(cases.map((item) => item.caseId), correction.focusedProofContract.cases);

const proofBasis = {
  schemaVersion: "1.0",
  resultType: "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_FOCUSED_PROOF_RESULT",
  executionCount: 1,
  status: "PASS",
  registry: { relativePath: path.relative(ROOT, registryPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(registryPath)), registryHash: registry.registryHash },
  correction: { relativePath: path.relative(ROOT, correctionPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(correctionPath)), correctionHash: correction.correctionHash },
  syntaxChecks,
  cases,
  totals: { cases: cases.length, passed: cases.filter((item) => item.status === "PASS").length, failed: 0 },
  rawValuesPersisted: 0,
  credentialSourcesRead: 0,
  credentialValuesRead: 0,
  providerCalls: 0,
  metadataCalls: 0,
  findingBearingFilesModified: false,
};
assertNoRawValueFields(proofBasis, "proof");

const rawFindingPatterns = [
  /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g,
  /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{20,}/gi,
];
const transientRawValues = [realisticShape, unusableShape];
for (const source of actualSources) for (const pattern of rawFindingPatterns) for (const match of source.source.matchAll(pattern)) transientRawValues.push(match[0]);
const serializedProofBasis = compactJson(proofBasis);
assert.equal(transientRawValues.every((value) => serializedProofBasis.includes(value) === false), true);

const proof = sealRecord(proofBasis, "proofHash");
writeCreateOnly(resultPath, proof);
if (verifySeal(proof, "proofHash").valid !== true) throw new Error("FOCUSED_PROOF_SEAL_INVALID_AFTER_WRITE");
process.stdout.write(`${compactJson({ status: "PASS", executionCount: 1, cases: cases.length, scriptsChecked: syntaxChecks.length, rawValuesPersisted: 0, proofHash: proof.proofHash })}\n`);
