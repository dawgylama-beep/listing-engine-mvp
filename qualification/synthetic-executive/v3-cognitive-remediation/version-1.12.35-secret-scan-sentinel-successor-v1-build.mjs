import fs from "node:fs";
import path from "node:path";

import {
  ROOT,
  compactJson,
  sealRecord,
  sha256,
  verifySeal,
  writeCreateOnly,
} from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";
import {
  FINDING_SOURCE_PATHS,
  SCANNER_PREFIX,
  assertNoRawValueFields,
  detectSanitizedFindings,
  readSanitizedSources,
  validateSentinelRegistry,
} from "./version-1.12.35-secret-scan-sentinel-successor-v1-scanner.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const registryPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-registry.json`);
const correctionPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-correction.json`);
const focusedProofPath = path.join(evidenceRoot, `${SCANNER_PREFIX}-focused-proof-result.json`);
const historicalReceiptPath = path.join(evidenceRoot, "version-1.12.35-boolean-predicate-successor-v2-member-results/RELEASE-003.json");
const historicalCombinedPath = path.join(evidenceRoot, "version-1.12.35-boolean-predicate-successor-v2-combined-result.json");
const historicalStopPath = path.join(evidenceRoot, "version-1.12.35-boolean-predicate-successor-v2-terminal-stop.json");
const historicalLedgerPath = path.join(evidenceRoot, "version-1.12.35-boolean-predicate-successor-v2-execution-ledger.json");

for (const outputPath of [registryPath, correctionPath]) if (fs.existsSync(outputPath) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${outputPath}`);

const expectedFindings = Object.freeze([
  Object.freeze({ entryId: "FINDING-001", relativePath: FINDING_SOURCE_PATHS[0], sourceSha256: "e4948645aeae8120b75da2775bfe44726aa8ef22b4480ca5d53d088ca2c6390b", ruleId: "OPENAI_KEY", findingSha256: "a791829b695664e478d184f181b4de9800f9b2926ff2a10cdd060e9b442d9c13", occurrenceOrdinal: 1, expectedOccurrenceCount: 1, matchedLength: 32, line: 204, prefixClass: "SK_PROJECT", payloadLength: 24, uniquePayloadCharacters: 22, repositoryRole: "OFFLINE_SANITIZER_REJECTION_FIXTURE", formatReason: "UNDERSIZED_DETERMINISTIC_PROJECT_KEY_SHAPE" }),
  Object.freeze({ entryId: "FINDING-002", relativePath: FINDING_SOURCE_PATHS[1], sourceSha256: "3306d9b6201abfe32c02498fc69693f75f23a19ffdde11358c7ed2b44efde268", ruleId: "OPENAI_KEY", findingSha256: "a791829b695664e478d184f181b4de9800f9b2926ff2a10cdd060e9b442d9c13", occurrenceOrdinal: 1, expectedOccurrenceCount: 2, matchedLength: 32, line: 453, prefixClass: "SK_PROJECT", payloadLength: 24, uniquePayloadCharacters: 22, repositoryRole: "FAIL_CLOSED_CREDENTIAL_SHAPE_TEST_VECTOR", formatReason: "UNDERSIZED_DETERMINISTIC_PROJECT_KEY_SHAPE" }),
  Object.freeze({ entryId: "FINDING-003", relativePath: FINDING_SOURCE_PATHS[1], sourceSha256: "3306d9b6201abfe32c02498fc69693f75f23a19ffdde11358c7ed2b44efde268", ruleId: "OPENAI_KEY", findingSha256: "10c59ce1c1c29426529af4e033c0dcbe5590d4c0a9c96519c2ed0777cdae3611", occurrenceOrdinal: 2, expectedOccurrenceCount: 2, matchedLength: 28, line: 500, prefixClass: "SK_PROJECT", payloadLength: 20, uniquePayloadCharacters: 20, repositoryRole: "MODEL_IDENTITY_SECRET_REJECTION_TEST_VECTOR", formatReason: "UNDERSIZED_SEQUENTIAL_PROJECT_KEY_SHAPE" }),
  Object.freeze({ entryId: "FINDING-004", relativePath: FINDING_SOURCE_PATHS[2], sourceSha256: "b0b33b7dc7a8f2bebcfd468ea800566bb22ae40f2b477a6bb5d9f63bee317adc", ruleId: "OPENAI_KEY", findingSha256: "20eacdf476da37b8391941b5f1fa88f3d6de078b4254c64ea8dca05b5e76310f", occurrenceOrdinal: 1, expectedOccurrenceCount: 2, matchedLength: 27, line: 349, prefixClass: "SK_LEGACY", payloadLength: 24, uniquePayloadCharacters: 13, repositoryRole: "BROKER_REJECTION_NON_PERSISTENCE_FIXTURE", formatReason: "UNDERSIZED_SEMANTIC_NON_PERSISTENCE_KEY_SHAPE" }),
  Object.freeze({ entryId: "FINDING-005", relativePath: FINDING_SOURCE_PATHS[2], sourceSha256: "b0b33b7dc7a8f2bebcfd468ea800566bb22ae40f2b477a6bb5d9f63bee317adc", ruleId: "OPENAI_KEY", findingSha256: "973275f4f3120ceb0779faee156959af4e9d36b1f19145874339bb38315bef82", occurrenceOrdinal: 2, expectedOccurrenceCount: 2, matchedLength: 28, line: 407, prefixClass: "SK_LEGACY", payloadLength: 25, uniquePayloadCharacters: 19, repositoryRole: "MOCK_PROVIDER_ERROR_REDACTION_FIXTURE", formatReason: "UNDERSIZED_SYNTHETIC_ERROR_KEY_SHAPE" }),
  Object.freeze({ entryId: "FINDING-006", relativePath: FINDING_SOURCE_PATHS[2], sourceSha256: "b0b33b7dc7a8f2bebcfd468ea800566bb22ae40f2b477a6bb5d9f63bee317adc", ruleId: "BEARER_VALUE", findingSha256: "eba3c6ca7e2e0ccadcf6a0d79ed49bd751e9ad325690ad0f8ba80c1b11e6f4b0", occurrenceOrdinal: 1, expectedOccurrenceCount: 1, matchedLength: 50, line: 407, prefixClass: "BEARER_TOKEN", payloadLength: 28, uniquePayloadCharacters: 21, repositoryRole: "MOCK_PROVIDER_ERROR_REDACTION_FIXTURE", formatReason: "BEARER_WRAPS_UNDERSIZED_SYNTHETIC_KEY_SHAPE" }),
]);

const sources = readSanitizedSources(ROOT, FINDING_SOURCE_PATHS);
const detection = detectSanitizedFindings(sources);
if (detection.findings.length !== 6) throw new Error(`EXPECTED_SIX_HISTORICAL_FINDINGS:${detection.findings.length}`);
const observed = detection.findings.map((finding, index) => ({ entryId: `FINDING-${String(index + 1).padStart(3, "0")}`, ...finding }));
const structuralFields = ["entryId", "relativePath", "sourceSha256", "ruleId", "findingSha256", "occurrenceOrdinal", "expectedOccurrenceCount", "matchedLength", "line", "prefixClass", "payloadLength", "uniquePayloadCharacters"];
const structuralProjection = (value) => Object.fromEntries(structuralFields.map((field) => [field, value[field]]));
if (compactJson(observed.map(structuralProjection)) !== compactJson(expectedFindings.map(structuralProjection))) throw new Error("HISTORICAL_FINDING_STRUCTURAL_IDENTITY_MISMATCH");

const historicalBindings = {
  release003: { relativePath: path.relative(ROOT, historicalReceiptPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(historicalReceiptPath)), stdoutSha256: "be319513d933a02233341e470697f455f757c0808dafe2d64b04021a14e108bd", stderrSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
  combinedResult: { relativePath: path.relative(ROOT, historicalCombinedPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(historicalCombinedPath)) },
  terminalStop: { relativePath: path.relative(ROOT, historicalStopPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(historicalStopPath)) },
  executionLedger: { relativePath: path.relative(ROOT, historicalLedgerPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(historicalLedgerPath)) },
};
if (historicalBindings.release003.sha256 !== "82e85ece127d435cb71fa1167f8c71c961797f83f71c6e44b0fb7d155370d8b5") throw new Error("HISTORICAL_RELEASE_003_RECEIPT_CHANGED");

const registryBasis = {
  schemaVersion: "1.0",
  registryType: "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_REGISTRY",
  registryState: "SEALED_APPEND_ONLY",
  version: "1.12.35",
  historicalFailure: {
    classification: "VERSION_1_12_35_EXHAUSTIVE_VALIDATION_STOPPED_BY_RELEASE_003_SECRET_SCAN",
    filesScanned: 2333,
    findings: 6,
    credentialValuesRead: 0,
    receipt: historicalBindings.release003,
  },
  exceptionPolicy: {
    matchMode: "EXACT_PATH_SOURCE_HASH_RULE_ORDINAL_COUNT_AND_FINDING_FINGERPRINT",
    wildcardsAllowed: false,
    directoryExemptionsAllowed: false,
    ruleWideExemptionsAllowed: false,
    staleEntryDisposition: "FAIL",
    additionalFindingDisposition: "FAIL",
    differentRuleDisposition: "FAIL",
    knownSentinelReporting: "REQUIRED_SANITIZED",
    rawValuePersistence: false,
  },
  entries: expectedFindings.map((finding) => ({
    entryId: finding.entryId,
    relativePath: finding.relativePath,
    sourceSha256: finding.sourceSha256,
    ruleId: finding.ruleId,
    findingSha256: finding.findingSha256,
    occurrenceOrdinal: finding.occurrenceOrdinal,
    expectedOccurrenceCount: finding.expectedOccurrenceCount,
    matchedLength: finding.matchedLength,
    classification: "PROVED_NON_SECRET",
  })),
};
const registry = sealRecord(registryBasis, "registryHash");
validateSentinelRegistry(registry);
assertNoRawValueFields(registry, "registry");
writeCreateOnly(registryPath, registry);

const scriptNames = ["scanner.mjs", "build.mjs", "focused-proof.mjs", "execute.mjs", "finalize.mjs"].map((suffix) => `${SCANNER_PREFIX}-${suffix}`);
const scriptBindings = scriptNames.map((name) => {
  const absolutePath = path.join(evidenceRoot, name);
  if (fs.existsSync(absolutePath) !== true) throw new Error(`SUCCESSOR_SCRIPT_MISSING:${name}`);
  return { relativePath: path.relative(ROOT, absolutePath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(absolutePath)) };
});

const adjudications = expectedFindings.map((finding) => ({
  entryId: finding.entryId,
  relativePath: finding.relativePath,
  sourceSha256: finding.sourceSha256,
  ruleId: finding.ruleId,
  findingSha256: finding.findingSha256,
  occurrenceOrdinal: finding.occurrenceOrdinal,
  expectedOccurrenceCount: finding.expectedOccurrenceCount,
  line: finding.line,
  structuralEvidence: {
    matchedLength: finding.matchedLength,
    prefixClass: finding.prefixClass,
    payloadLength: finding.payloadLength,
    uniquePayloadCharacters: finding.uniquePayloadCharacters,
  },
  repositoryRole: finding.repositoryRole,
  classification: "PROVED_NON_SECRET",
  formatValidForCredentialClass: false,
  formatReason: finding.formatReason,
  credentialSourceAccessed: false,
  authenticationAttempted: false,
  productionDispatchReachableFromFixture: false,
}));

const focusedCases = [
  "ALL_SIX_DETECTED_REPORTED_WITHOUT_RAW_VALUES",
  "REAL_SHAPED_CREDENTIAL_OUTSIDE_TEST_PATH_FAILS",
  "SAME_REAL_SHAPED_CREDENTIAL_INSIDE_TEST_PATH_FAILS",
  "STALE_FINGERPRINT_OR_SOURCE_HASH_FAILS",
  "SAME_FILE_ADDITIONAL_FINDING_FAILS",
  "DIFFERENT_RULE_BINDING_FAILS",
  "WILDCARD_REGISTRY_ENTRY_FAILS",
  "REAL_SHAPED_UNUSABLE_SYNTHETIC_FIXTURE_IS_DETECTED",
  "PROOF_OUTPUT_CONTAINS_ZERO_RAW_VALUES",
  "EVERY_CHANGED_SCRIPT_PARSES",
];
const correctionBasis = {
  schemaVersion: "1.0",
  recordType: "VERSION_1_12_35_SECRET_SCAN_SENTINEL_SUCCESSOR_V1_CORRECTION",
  correctionState: "SEALED_PRE_FOCUSED_PROOF",
  version: "1.12.35",
  checkpoint: {
    branch: "refactor/beta-evidence-pipeline",
    head: "b3bde8269a17b54dcff956a1c5f5be1cb28092d3",
    tree: "3e36290477de110d8eaed4d0975259e8f03b17a9",
    parent: "5da4c3de47a2860495087bacacdd60ac3c65603b",
    directRemoteBeforeImplementation: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35",
    indexSha256: "f2538718afa06b952573c9c4013cb5f153eb570a1ead1c53e198062df8b7578e",
  },
  historicalBindings,
  adjudications,
  adjudicationSummary: { total: 6, provedNonSecret: 6, actualSecret: 0, ambiguous: 0 },
  scannerChange: {
    classificationScope: "ONLY_THE_SIX_EXACT_HISTORICAL_FINDINGS",
    requiredIdentityFields: ["relativePath", "sourceSha256", "ruleId", "occurrenceOrdinal", "expectedOccurrenceCount", "findingSha256"],
    knownSentinelsRemainReported: true,
    staleOrAdditionalOrDifferentRuleFails: true,
    wildcardOrDirectoryOrRuleWideExemptions: false,
    historicalMatchTextKeywordBehaviorPreserved: true,
    findingBearingFilesModified: false,
    productionBehaviorChanged: false,
  },
  registry: { relativePath: path.relative(ROOT, registryPath).replaceAll("\\", "/"), sha256: sha256(fs.readFileSync(registryPath)), registryHash: registry.registryHash },
  focusedProofContract: {
    relativePath: path.relative(ROOT, focusedProofPath).replaceAll("\\", "/"),
    executionCountRequired: 1,
    cases: focusedCases,
    expectedCaseCount: focusedCases.length,
    rerunAllowed: false,
  },
  scriptBindings,
  invalidatedGateClosure: {
    focused: ["FOCUSED-001"],
    release: ["RELEASE-003-SUCCESSOR", "RELEASE-007-SUCCESSOR", "RELEASE-008-SUCCESSOR", "RELEASE-014-SUCCESSOR", "RELEASE-015-SUCCESSOR"],
    stopOnFirstFailure: true,
  },
  retainedWithoutRerun: {
    historicalReleaseGateIds: ["RELEASE-001", "RELEASE-002", "RELEASE-004", "RELEASE-005", "RELEASE-006", "RELEASE-009", "RELEASE-010", "RELEASE-011", "RELEASE-012", "RELEASE-013"],
    staticGateCount: 53,
    terminalNodeSuite: "RETAINED_PASS",
    browserValidation: "RETAINED_PASS",
    qualificationExecutionAndEvaluation: "RETAINED_PASS_OR_PRESERVED_CLASSIFICATION",
  },
  protectedArtifactIdentity: {
    phase6aFiles: 85,
    phase6aBytes: 72299353,
    retainedRcFiles: 39,
    retainedRcBytes: 3864482,
    reviewScreenshotFiles: 52,
    reviewScreenshotBytes: 17875948,
    retainedQuarantineFiles: 39,
    retainedQuarantineBytes: 3864482,
  },
  activity: { credentialSourcesRead: 0, credentialValuesRead: 0, providerCalls: 0, metadataCalls: 0, evaluatorCalls: 0, authorityCreation: 0, qualificationReplays: 0, benchmarkRuns: 0, productHandlerCalls: 0, deployments: 0, merges: 0, remoteWrites: 0 },
};
const correction = sealRecord(correctionBasis, "correctionHash");
assertNoRawValueFields(correction, "correction");
writeCreateOnly(correctionPath, correction);
if (verifySeal(correction, "correctionHash").valid !== true) throw new Error("CORRECTION_SEAL_INVALID_AFTER_WRITE");

process.stdout.write(`${compactJson({ status: "PASS", adjudications: 6, registryHash: registry.registryHash, correctionHash: correction.correctionHash, rawValuesEmitted: 0, credentialValuesRead: 0 })}\n`);
