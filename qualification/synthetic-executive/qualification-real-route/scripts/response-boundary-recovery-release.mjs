import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { PROVIDER_ERROR_MESSAGE_LIMIT_BYTES, PROVIDER_RESPONSE_BODY_LIMIT_BYTES, PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES } from "../../calibration/scripts/real-route-redaction.mjs";
import { readJson, seal, sha256Bytes, sha256Json, stableJson, writeExclusiveJson } from "../../scripts/protocol.mjs";
import { SAFE_RESPONSE_EVIDENCE_FIELDS } from "./qualification-route.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
export const repositoryRoot = path.resolve(scriptDirectory, "..", "..", "..", "..");
export const routeRoot = path.resolve(scriptDirectory, "..");
export const historicalReleasePath = path.join(routeRoot, "response-evidence-repair-release.json");
export const terminalReleasePath = path.join(routeRoot, "v2-case-scoped-terminal-release.json");
export const terminalRoot = path.join(routeRoot, "case-scoped-completion", "v2-c08-c14-5aae8e6-20260812t1832z");
export const correctionPath = path.join(routeRoot, "version-1.12.33-final-identity-manifest-correction-v1.json");
export const c13DeterminationPath = path.join(routeRoot, "c13-local-response-capture-boundary-determination.json");
export const successorContractPath = path.join(routeRoot, "response-evidence-contract-v1.12.34.json");
export const sourceSealPath = path.join(routeRoot, "v2-response-boundary-recovery-source-seal.json");
export const releasePath = path.join(routeRoot, "v2-response-boundary-recovery-release.json");

export const STARTING = Object.freeze({
  version: "1.12.33",
  branch: "refactor/beta-evidence-pipeline",
  commit: "d198c3e162a60a871b4952105e6ded5ef695ec02",
  tree: "f69eb9006644244f3227d4a29d4df2d908ffa978",
  sourceSealHash: "b7b0cb62bdb49cb045566e1695d16b765436f4e1699423a7f790ed51ce3e3e77",
  uncommittedDiffHash: "f6dbf27d3480aba6349f165c2dfdb2bf53025d5ca49a38eda127059665d29b67",
  executableAggregateHash: "7fb8b10da00eeeda7c48ef73ca2a83821ca274f43e35407081b438f5ab2d4fa8",
  terminalAuthorityHash: "a5f86ffffc20010eae53907f43c61b2339a61d0e3586fd69163d9b88662e2837",
  terminalAuthorityReceiptHash: "c191387936f2ab2203de9aff0c83fe590b063c8bdd15bdf279e5637b4fcf1db4",
  resultSealHash: "13f5f03cf98aa8a58810c85ae468e397d01cd152e2758b851096475e382c8e6f",
  releaseHash: "e3b53f87673932b49fd09db368114f6fb8bca4cc96591bbbd925312d4603295d",
  releaseRecordSha256: "d476c0b466e90f76fc61297b6e93a77c6c57d9883f86dc3d079ac4316a5fa053",
  historical43Aggregate: "8649aa1e3f36f34a18070e67d964139f50c6226134aaf9e4ab034e3c5e4cbeac",
  corrected43Aggregate: "f131f7ed0548f6532c4afdc1bfaa254e5618595005fb89bfcf7fea7081f22aea",
  release331Aggregate: "f850f3144d757469f332c6ed804fbef0127232c9a61f1c9ea730501256f1789e",
  terminal329Aggregate: "55691f61fa735e6dc71eb92c45e734f0718587170c35b83cbdddbf6be77aa56f",
  phase6aArtifactInventorySha256: "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f"
});

const VERSION_11232_COMMIT = "5aae8e6cd76fda8b6ac398d364adf2ff6272d191";
const DISPUTED_PATHS = Object.freeze(["PRODUCT_ROADMAP.md", "package-lock.json", "package.json", "public/index.html", "server.ps1"]);
const terminalInventoryPath = path.join(terminalRoot, "final-evidence-inventory.json");
const c13Root = path.join(terminalRoot, "cases", "KE-V2-C13");

async function git(...args) {
  return (await execFileAsync("git", args, { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 100 * 1024 * 1024 })).stdout.trim();
}

async function fileHash(filePath) {
  return sha256Bytes(await readFile(filePath));
}

async function gitTree(commit) {
  const result = new Map();
  for (const line of (await git("ls-tree", "-r", commit)).split(/\r?\n/).filter(Boolean)) {
    const tab = line.indexOf("\t");
    result.set(line.slice(tab + 1), line.slice(0, tab).split(" ")[2]);
  }
  return result;
}

async function gitBlob(tree, relativePath) {
  const objectId = tree.get(relativePath);
  assert.ok(objectId, `missing immutable Git blob ${relativePath}`);
  return (await execFileAsync("git", ["cat-file", "blob", objectId], { cwd: repositoryRoot, encoding: "buffer", maxBuffer: 100 * 1024 * 1024 })).stdout;
}

function reconstructHistoricalWorkingBytes(relativePath, currentText) {
  if (relativePath === "PRODUCT_ROADMAP.md") {
    return currentText.replace(/\r?\n## Version 1\.12\.33 \(Completed\)\r?\n(?:-.*(?:\r?\n|$)){6}/, "");
  }
  return currentText.replaceAll("1.12.33", "1.12.32");
}

function newlineProfile(text) {
  return Object.freeze({
    crlfCount: (text.match(/\r\n/g) || []).length,
    bareLfCount: (text.match(/(?<!\r)\n/g) || []).length
  });
}

export async function buildManifestCorrection() {
  const [historicalBytes, historical, terminalReleaseBytes, terminalRelease, terminalInventory] = await Promise.all([
    readFile(historicalReleasePath), readJson(historicalReleasePath), readFile(terminalReleasePath), readJson(terminalReleasePath), readJson(terminalInventoryPath)
  ]);
  assert.equal(sha256Bytes(historicalBytes), "177a85c79d03c6145116f31ef2c77cdd563c3550312c1f9cda8e91370770cf1d");
  assert.equal(sha256Json(historical.artifactHashes), STARTING.historical43Aggregate);
  assert.equal(sha256Bytes(terminalReleaseBytes), STARTING.releaseRecordSha256);
  assert.equal(terminalRelease.releaseHash, STARTING.releaseHash);
  assert.equal(terminalInventory.inventoryHash, STARTING.terminal329Aggregate);
  const historicalTree = await gitTree(VERSION_11232_COMMIT);
  const finalTree = await gitTree(STARTING.commit);
  const correctedArtifactHashes = [];
  for (const item of historical.artifactHashes) correctedArtifactHashes.push({ relativePath: item.relativePath, sha256: sha256Bytes(await gitBlob(historicalTree, item.relativePath)) });
  assert.equal(sha256Json(correctedArtifactHashes), STARTING.corrected43Aggregate);

  const terminalInventoryByPath = new Map(terminalInventory.artifactHashes.map((item) => [item.relativePath, item]));
  const releaseInventoryByPath = new Map(terminalRelease.artifactHashes.map((item) => [item.relativePath, item]));
  const historicalByPath = new Map(historical.artifactHashes.map((item) => [item.relativePath, item]));
  const adjudication = [];
  for (const relativePath of DISPUTED_PATHS) {
    const currentText = await readFile(path.join(repositoryRoot, relativePath), "utf8");
    const reconstructed = reconstructHistoricalWorkingBytes(relativePath, currentText);
    const committed11232 = await gitBlob(historicalTree, relativePath);
    const final11233 = await gitBlob(finalTree, relativePath);
    assert.equal(sha256Bytes(Buffer.from(reconstructed, "utf8")), historicalByPath.get(relativePath).sha256);
    assert.equal(reconstructed.replaceAll("\r\n", "\n"), committed11232.toString("utf8"));
    assert.equal(sha256Bytes(final11233), releaseInventoryByPath.get(relativePath).sha256);
    assert.equal(sha256Bytes(final11233), terminalInventoryByPath.get(relativePath).sha256);
    const semanticChange = relativePath === "PRODUCT_ROADMAP.md"
      ? "APPENDED_VERSION_1_12_33_RELEASE_DOCUMENTATION_ONLY"
      : relativePath === "server.ps1"
        ? "APP_VERSION_LITERAL_1_12_32_TO_1_12_33_ONLY"
        : relativePath === "public/index.html"
          ? "FIVE_DISPLAY_AND_CACHE_VERSION_LITERALS_1_12_32_TO_1_12_33_ONLY"
          : relativePath === "package-lock.json"
            ? "TWO_PACKAGE_VERSION_LITERALS_1_12_32_TO_1_12_33_ONLY"
            : "ONE_PACKAGE_VERSION_LITERAL_1_12_32_TO_1_12_33_ONLY";
    adjudication.push({
      relativePath,
      historicalRecordedSha256: historicalByPath.get(relativePath).sha256,
      committedVersion11232Sha256: sha256Bytes(committed11232),
      finalVersion11233Sha256: sha256Bytes(final11233),
      release331InventorySha256: releaseInventoryByPath.get(relativePath).sha256,
      terminal329InventorySha256: terminalInventoryByPath.get(relativePath).sha256,
      historicalWorkingByteLength: Buffer.byteLength(reconstructed, "utf8"),
      committedVersion11232ByteLength: committed11232.length,
      finalVersion11233ByteLength: final11233.length,
      historicalNewlines: newlineProfile(reconstructed),
      committedAndFinalGitNewlines: "LF_ONLY",
      recordedWorkingBytesNormalizeExactlyToVersion11232GitBlob: true,
      semanticChange,
      behaviorClassification: relativePath === "server.ps1" ? "EXECUTABLE_FILE_VERSION_ONLY_NONBEHAVIORAL" : relativePath === "PRODUCT_ROADMAP.md" ? "DOCUMENTARY_ONLY" : "RELEASE_METADATA_OR_DISPLAY_ONLY",
      providerVisibleRequestAffected: false,
      cognitionAffected: false,
      actionHandlingAffected: false,
      responseClassificationAffected: false,
      evidenceSealingAffected: false,
      scoringOrEvaluationAffected: false
    });
  }
  const core = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_33_FINAL_IDENTITY_MANIFEST_CORRECTION_V1",
    classification: "VERSION_1_12_33_FROZEN_IDENTITY_MANIFEST_PHASE_ORDER_DEFECT",
    startingIdentity: STARTING,
    historicalManifest: {
      relativePath: path.relative(repositoryRoot, historicalReleasePath).replaceAll("\\", "/"),
      fileSha256: sha256Bytes(historicalBytes),
      artifactCount: historical.artifactHashes.length,
      aggregateHash: STARTING.historical43Aggregate,
      representedPhase: "VERSION_1_12_32_POST_REPAIR_PRE_COMMIT_WORKTREE_BYTES_BEFORE_GIT_EOL_NORMALIZATION_AND_RELEASE_COMMIT",
      immutableAndUnmodified: true
    },
    adjudicatedPaths: adjudication,
    correctedManifest: {
      pathListPreservedExactly: true,
      hashBasis: "VERSION_1_12_32_COMMIT_GIT_BLOB_BYTES",
      commit: VERSION_11232_COMMIT,
      artifactHashes: correctedArtifactHashes,
      artifactCount: correctedArtifactHashes.length,
      aggregateHash: sha256Json(correctedArtifactHashes)
    },
    finalVersion11233Inventories: {
      releaseInventoryPathCount: 331,
      releaseInventoryAggregateHash: STARTING.release331Aggregate,
      releaseHash: terminalRelease.releaseHash,
      releaseRecordSha256: sha256Bytes(terminalReleaseBytes),
      terminalArtifactCount: terminalInventory.artifactCount,
      terminalArtifactAggregateHash: terminalInventory.inventoryHash,
      terminalArtifactTotalBytes: terminalInventory.totalBytes
    },
    executionBindings: {
      sourceSealHash: STARTING.sourceSealHash,
      uncommittedDiffHash: STARTING.uncommittedDiffHash,
      authorityBoundExecutableAggregateHash: STARTING.executableAggregateHash,
      terminalAuthorityHash: STARTING.terminalAuthorityHash,
      terminalAuthorityReceiptHash: STARTING.terminalAuthorityReceiptHash,
      terminalResultSealHash: STARTING.resultSealHash
    },
    preservation: {
      historicalManifestRewritten: false,
      executionEvidenceRewritten: false,
      qualificationEvidenceRewritten: false,
      providerVisibleOrCognitiveBehaviorConcealed: false,
      differencesAuthorizedAndNonbehavioral: true
    }
  };
  return seal(core, "correctionHash");
}

export async function buildC13BoundaryDetermination() {
  const resultNames = [
    "v2-ke-v2-c13-provider_attempt-003-7d37f348a600903a-result.json",
    "v2-ke-v2-c13-provider_attempt-005-6b3f5935825276d1-result.json",
    "v2-ke-v2-c13-provider_attempt-008-d2242aca940dd7a6-result.json",
    "v2-ke-v2-c13-provider_attempt-010-f828d15757005296-result.json"
  ];
  const results = await Promise.all(resultNames.map((name) => readJson(path.join(c13Root, name))));
  const ledgerNames = (await git("ls-tree", "-r", "--name-only", STARTING.commit, path.relative(repositoryRoot, path.join(c13Root, "case-ledger")).replaceAll("\\", "/")))
    .split(/\r?\n/).filter(Boolean);
  const tree = await gitTree(STARTING.commit);
  const ledgerEntries = [];
  for (const relativePath of ledgerNames) ledgerEntries.push(JSON.parse((await gitBlob(tree, relativePath)).toString("utf8")));
  const fourth = results[3];
  assert.equal(fourth.providerFailureCode, "PROVIDER_RESPONSE_TOO_LARGE");
  assert.equal(fourth.providerDiagnostics.httpStatus, 200);
  assert.equal(fourth.providerDiagnostics.safeProviderRequestId, "req_7111ba83f685415ebaf16068f9b46aab");
  assert.equal(fourth.safeResponseEvidence.rawResponseByteLength, 87_077);
  assert.equal(fourth.providerDiagnostics.responseByteLength, 65_536);
  assert.equal(fourth.providerDiagnostics.responseByteLengthClassification, "LOWER_BOUND");
  const core = {
    schemaVersion: "1.0",
    determinationType: "C13_LOCAL_RESPONSE_CAPTURE_BOUNDARY_DETERMINATION",
    historicalClassificationPreserved: "PROVIDER_RESPONSE_TOO_LARGE",
    appendOnlyRootCauseDetermination: "C13_LOCAL_RESPONSE_CAPTURE_BOUNDARY_EXCEEDED",
    originalC13Evidence: {
      caseOutputHash: "674a8adb43931eeb220ccd494dacf1365a85f7e1ff05a861f7b5b3b240d589e3",
      caseLedgerSealHash: "ea567df8b4d4eee9ca4ba077900397dfff61bafd9b1fb212152b336119a2bd08",
      fourthAttemptReceiptHash: fourth.receiptHash,
      fourthAttemptFileSha256: sha256Bytes(await readFile(path.join(c13Root, resultNames[3]))),
      providerContentInspectedOrUsed: false
    },
    boundaryProof: {
      executedLocalBoundaryBytes: 65_536,
      fourthObservedResponseBytes: 87_077,
      fourthHttpStatus: 200,
      fourthSafeProviderRequestId: "req_7111ba83f685415ebaf16068f9b46aab",
      fourthLocallyRejected: true,
      providerImposedResponseSizeRejectionProven: false,
      requestCeilingBytes: 64_000,
      maximumOutputTokens: 2_000,
      requestCeilingDistinct: true,
      outputTokenCeilingDistinct: true,
      evaluatorMaterialRequired: false
    },
    accounting: {
      logicalCognitiveModelDispatches: ledgerEntries.filter((entry) => entry.eventType === "REASONING_STEP_CONSUMED").length,
      physicalProviderAttempts: ledgerEntries.filter((entry) => entry.eventType === "PROVIDER_ATTEMPT_DISPATCHED").length,
      retryAttempts: ledgerEntries.filter((entry) => entry.eventType === "RETRY_ATTEMPT_CONSUMED").length,
      httpResponses: results.filter((item) => Number.isInteger(item.providerDiagnostics?.httpStatus)).length,
      http200Responses: results.filter((item) => item.providerDiagnostics?.httpStatus === 200).length,
      acceptedCompletedResponsesObjects: results.filter((item) => item.responseStatus === "completed" && !item.providerFailureCode).length,
      acceptedNonCompletedResponsesObjects: results.filter((item) => !["completed", "ABSENT"].includes(item.responseStatus) && !item.providerFailureCode).length,
      locallyRejectedResponses: results.filter((item) => item.providerFailureCode === "PROVIDER_RESPONSE_TOO_LARGE").length,
      fourthResponseDisposition: "HTTP_200_LOCALLY_REJECTED_BEFORE_JSON_SEMANTIC_CLASSIFICATION"
    }
  };
  assert.deepEqual(core.accounting, {
    logicalCognitiveModelDispatches: 4, physicalProviderAttempts: 4, retryAttempts: 0,
    httpResponses: 4, http200Responses: 4, acceptedCompletedResponsesObjects: 3,
    acceptedNonCompletedResponsesObjects: 0, locallyRejectedResponses: 1,
    fourthResponseDisposition: "HTTP_200_LOCALLY_REJECTED_BEFORE_JSON_SEMANTIC_CLASSIFICATION"
  });
  return seal(core, "determinationHash");
}

export function buildSuccessorResponseContract() {
  const field = (name, type, normalization, bound, absent, overflow) => ({ name, type, normalization, bound, absent, overflow });
  const providerDiagnostics = [
    field("schemaVersion", "string", "literal 1.1", "exact literal", "never absent", "reject"),
    field("httpStatus", "integer|string", "HTTP integer", "100..599", "NOT_RECEIVED", "reject"),
    field("errorType", "string", "lowercase safe identifier", "1..128 characters", "NOT_RECEIVED", "REDACTED"),
    field("errorCode", "string", "lowercase safe identifier", "1..128 characters", "NOT_RECEIVED", "REDACTED"),
    field("errorParam", "string", "lowercase safe identifier", "1..128 characters", "NOT_RECEIVED", "REDACTED"),
    field("messageClassification", "enum", "closed classification", "13 values", "NOT_RECEIVED", "reject"),
    field("sanitizedErrorMessage", "string", "secret and account identifiers redacted; whitespace collapsed", `0..${PROVIDER_ERROR_MESSAGE_LIMIT_BYTES} UTF-8 bytes`, "NOT_RECEIVED", "UTF-8 truncate with ellipsis"),
    field("safeProviderRequestId", "string", "safe identifier", "1..128 characters", "NOT_RECEIVED", "NOT_RECEIVED"),
    field("responseContentType", "string", "lowercase media type without parameters", "type token plus subtype 1..97 characters", "NOT_RECEIVED", "NOT_RECEIVED"),
    field("responseByteLength", "integer|string", "actual observed streamed bytes", `0..${PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES}`, "NOT_RECEIVED", "one-byte overflow probe only"),
    field("responseByteLengthClassification", "enum", "EXACT or LOWER_BOUND", "2 values", "NOT_RECEIVED", "LOWER_BOUND"),
    field("responseBodyTruncated", "boolean|string", "local capture state", "boolean", "NOT_RECEIVED", "true"),
    field("timeoutClassification", "enum", "TIMEOUT or NOT_TIMEOUT", "2 values", "NOT_RECEIVED", "reject"),
    field("networkConnectionClassification", "enum", "HTTP_RESPONSE_RECEIVED or CONNECTION_FAILURE", "2 values", "NOT_RECEIVED", "reject")
  ];
  const safeResponseEvidence = [
    field("schemaVersion", "string", "literal 1.1", "exact literal", "never absent", "reject"),
    field("requestHash", "SHA-256 string", "lowercase hex", "64 characters", "never absent", "reject"),
    field("providerAttemptIdentity", "string", "safe identifier", "1..128 characters", "ABSENT", "reject"),
    field("httpStatus", "integer", "HTTP integer", "100..599", "never absent after HTTP", "reject"),
    field("responseContentType", "string", "normalized media type", "provider-diagnostics content-type bound", "ABSENT", "ABSENT"),
    field("rawResponseByteLength", "integer", "actual captured bytes", `0..${PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES}`, "never absent after HTTP", "one-byte overflow probe only"),
    field("rawResponseSha256", "SHA-256 string", "hash of captured bytes", "64 characters", "never absent after HTTP", "hash is labeled PARTIAL"),
    field("observedResponseByteLength", "integer", "actual streamed bytes observed", `0..${PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES}`, "never absent after HTTP", "stops at overflow probe"),
    field("responseBodySha256Classification", "enum", "COMPLETE or PARTIAL", "2 values", "never absent after HTTP", "PARTIAL"),
    field("localResponseHardLimitClassification", "enum", "WITHIN_LIMIT or EXCEEDED", "2 values", "never absent after HTTP", "EXCEEDED"),
    field("safeProviderRequestId", "string", "safe identifier", "1..128 characters", "ABSENT", "ABSENT"),
    field("providerResponseId", "string", "safe identifier", "1..128 characters", "ABSENT", "ABSENT"),
    field("returnedModel", "string", "safe identifier", "1..128 characters", "ABSENT", "ABSENT"),
    field("responseStatus", "string", "safe identifier", "1..128 characters", "ABSENT", "ABSENT"),
    field("incompleteReason", "string", "safe identifier", "1..128 characters", "ABSENT", "ABSENT"),
    field("safeError", "object", "four safe error scalars", `message ${PROVIDER_ERROR_MESSAGE_LIMIT_BYTES} UTF-8 bytes; other fields 128 characters`, "members use ABSENT", "redact or truncate"),
    field("usage", "object", "nonnegative integer token counters", "no standalone maximum beyond parsed nonnegative integer", "null per unavailable counter", "reject invalid counter"),
    field("createdAtEpochSeconds", "integer|string", "nonnegative integer", "no standalone maximum", "ABSENT", "ABSENT"),
    field("completedAtEpochSeconds", "integer|string", "nonnegative integer", "no standalone maximum", "ABSENT", "ABSENT"),
    field("outputItemCount", "integer", "array length", `indirectly bounded by ${PROVIDER_RESPONSE_BODY_LIMIT_BYTES}-byte complete body`, "0", "0 when body is partial"),
    field("outputItemTypes", "string array", "ordered safe identifiers", `length equals outputItemCount; each item 128 characters; body-bounded`, "empty array", "empty array when body is partial"),
    field("outputItemStatuses", "string array", "ordered safe identifiers", `length equals outputItemCount; each item 128 characters; body-bounded`, "empty array", "empty array when body is partial"),
    field("partialOutput", "object", "presence, UTF-8 byte length and SHA-256 only", `byte length indirectly bounded by ${PROVIDER_RESPONSE_BODY_LIMIT_BYTES}-byte complete body`, "false/0/ABSENT", "false/0/ABSENT when body is partial")
  ];
  assert.deepEqual(safeResponseEvidence.map((item) => item.name).sort(), [...SAFE_RESPONSE_EVIDENCE_FIELDS].sort());
  const core = {
    schemaVersion: "1.0",
    contractType: "KATHERINE_V2_SUCCESSOR_SAFE_RESPONSE_EVIDENCE_CONTRACT",
    productVersion: "1.12.34",
    predecessorContractHash: "6c0c9144cb916740864b35cda93e2256dd7612356a4fb68ad5b4283a6e403f66",
    localResourceSafety: {
      hardResponseBodyCeilingBytes: PROVIDER_RESPONSE_BODY_LIMIT_BYTES,
      maximumObservedBytes: PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES,
      byteCounting: "ACTUAL_STREAMED_BYTES",
      contentLengthRole: "ADVISORY_ALLOCATION_ONLY_NEVER_CLASSIFICATION",
      completeBodyVolatileOnly: true,
      rawBodyOrPrefixDurable: false,
      hardLimitClassification: "PROVIDER_RESPONSE_LOCAL_HARD_LIMIT_EXCEEDED"
    },
    providerDiagnostics,
    safeResponseEvidence,
    newEvidenceFields: ["observedResponseByteLength", "responseBodySha256Classification", "localResponseHardLimitClassification"],
    forbiddenDurableContent: [
      "model output text", "reasoning content", "encrypted or opaque reasoning payloads", "content-bearing tool arguments",
      "provider error-body content", "complete raw response body", "response-body prefix", "credentials",
      "authorization headers", "unapproved headers"
    ],
    semanticClassifications: {
      completed: "UNCHANGED_COMPLETED_STRUCTURED_ACTION_PATH",
      incompleteMaxOutputTokens: "TERMINAL_SCOREABLE_NO_RETRY",
      incompleteOther: "PRESERVED_SEMANTIC_CONTRACT",
      modelSchemaViolation: "SCOREABLE_COGNITIVE_FAILURE",
      adapterParserSerializerOrEnforcementMalfunction: "INFRASTRUCTURE_INVALID"
    },
    preservation: {
      canonicalRequestSerializerChanged: false,
      executiveActionSerializerChanged: false,
      cognitiveResultSemanticsChanged: false,
      historicalContractsChanged: false
    }
  };
  return seal(core, "contractHash");
}

export async function writePreflightArtifacts() {
  const [correction, determination] = await Promise.all([buildManifestCorrection(), buildC13BoundaryDetermination()]);
  const contract = buildSuccessorResponseContract();
  await writeExclusiveJson(correctionPath, correction);
  await writeExclusiveJson(c13DeterminationPath, determination);
  await writeExclusiveJson(successorContractPath, contract);
  return Object.freeze({ correction, determination, contract });
}

export async function buildRecoverySourceSeal() {
  const status = (await execFileAsync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 100 * 1024 * 1024 })).stdout;
  const excludedPrefixes = [
    "benchmarks/blind-object-v1-results/.phase6a-",
    "benchmarks/blind-object-v1-results/phase6a-e3caa2fd/"
  ];
  const excludedExact = new Set([
    path.relative(repositoryRoot, sourceSealPath).replaceAll("\\", "/"),
    path.relative(repositoryRoot, releasePath).replaceAll("\\", "/")
  ]);
  const changedPaths = status.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).replaceAll("\\", "/"))
    .filter((relativePath) => !excludedExact.has(relativePath) && !excludedPrefixes.some((prefix) => relativePath.startsWith(prefix)))
    .sort();
  assert.ok(changedPaths.length > 0, "RECOVERY_SOURCE_DIFF_EMPTY");
  const changedFileHashes = [];
  for (const relativePath of changedPaths) changedFileHashes.push({ relativePath, sha256: await fileHash(path.join(repositoryRoot, relativePath)) });
  const executableFiles = changedFileHashes.filter((item) => /\.(?:mjs|js|ps1)$/i.test(item.relativePath));
  const trackedDiff = (await execFileAsync("git", ["diff", "--binary", "--no-ext-diff"], { cwd: repositoryRoot, encoding: "buffer", maxBuffer: 100 * 1024 * 1024 })).stdout;
  const core = {
    schemaVersion: "1.0",
    sealType: "VERSION_1_12_34_RESPONSE_BOUNDARY_RECOVERY_UNCOMMITTED_SOURCE_SEAL",
    startingIdentity: { version: STARTING.version, branch: STARTING.branch, commit: STARTING.commit, tree: STARTING.tree },
    priorSourceSealHash: STARTING.sourceSealHash,
    priorUncommittedDiffHash: STARTING.uncommittedDiffHash,
    priorExecutableAggregateHash: STARTING.executableAggregateHash,
    trackedDiffSha256: sha256Bytes(trackedDiff),
    changedFileCount: changedFileHashes.length,
    changedFileHashes,
    executableFileCount: executableFiles.length,
    executableFiles,
    correctedExecutableAggregateHash: sha256Json({ priorExecutableAggregateHash: STARTING.executableAggregateHash, executableFiles }),
    uncommittedDiffHash: sha256Json({ startingCommit: STARTING.commit, trackedDiffSha256: sha256Bytes(trackedDiff), changedFileHashes }),
    preservedBindings: {
      canonicalRequestHash: "73fa81d6d3fce8add2d8911682330b954b2653edfb43de4aa37ee02eea6d079e",
      canonicalPromptHash: "73dc7a21fa2db16c432b9630f3934ea87d78cd89b174b1739563b207a5a57e93",
      executiveActionSourceSchemaHash: "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba",
      safeProviderDiagnosticsContractHash: "09069908f8b5bb7a94db97777839db7c587594f91c62b71c9aec3f4b59deaed9",
      routeModelReasoningStoreRequestAndPromptUnchanged: true,
      cognitivePolicyBrokerScorerEvaluatorAndHandlersUnchanged: true
    },
    phase6aPreservation: { inventorySha256: STARTING.phase6aArtifactInventorySha256, trackedOrAbsorbed: false },
    authorityCreationPermittedOnlyAfterOfflineValidation: true,
    executableChangesAfterAuthorityCreationPermitted: false
  };
  return seal(core, "sourceSealHash");
}

export async function writeRecoverySourceSeal() {
  const sourceSeal = await buildRecoverySourceSeal();
  await writeExclusiveJson(sourceSealPath, sourceSeal);
  return sourceSeal;
}

async function walkFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await walkFiles(absolutePath));
    else if (entry.isFile()) result.push(absolutePath);
  }
  return result;
}

export async function buildRecoveryRelease({ resultRoot, createdAt = new Date().toISOString() }) {
  const [correction, determination, contract, sourceSeal, terminalReleaseBytes, resultSeal, evaluation, executionSummary, authority, terminalization, inventory, evaluatorAudit, usage] = await Promise.all([
    readJson(correctionPath), readJson(c13DeterminationPath), readJson(successorContractPath), readJson(sourceSealPath),
    readFile(terminalReleasePath), readJson(path.join(resultRoot, "qualification-result-seal.json")), readJson(path.join(resultRoot, "blind-evaluation.json")),
    readJson(path.join(resultRoot, "provider-execution-summary.json")), readJson(path.join(resultRoot, "authority.json")),
    readJson(path.join(resultRoot, "authority-terminalization-receipt.json")), readJson(path.join(resultRoot, "included-case-inventory.json")),
    readJson(path.join(resultRoot, "evaluator-access-audit.json")), readJson(path.join(resultRoot, "usage-and-cost-aggregate.json"))
  ]);
  assert.equal(sha256Bytes(terminalReleaseBytes), STARTING.releaseRecordSha256);
  for (const [record, hashField] of [[correction, "correctionHash"], [determination, "determinationHash"], [contract, "contractHash"], [sourceSeal, "sourceSealHash"], [resultSeal, "resultSealHash"], [evaluation, "evaluationHash"], [executionSummary, "executionSummaryHash"], [authority, "authorityHash"], [terminalization, "receiptHash"], [inventory, "inventoryHash"], [evaluatorAudit, "proofHash"], [usage, "aggregateHash"]]) {
    const core = structuredClone(record); delete core[hashField]; assert.equal(sha256Json(core), record[hashField], `${hashField} differs`);
  }
  assert.equal(terminalization.classification, "C13_C14_RESPONSE_BOUNDARY_RECOVERY_COMPLETE");
  assert.equal(evaluatorAudit.evaluatorInvocationCount, 1); assert.equal(resultSeal.validQualificationResult, true);
  const status = (await execFileAsync("git", ["status", "--porcelain=v1", "--untracked-files=all"], { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 100 * 1024 * 1024 })).stdout;
  const artifactPaths = status.split(/\r?\n/).filter(Boolean).map((line) => line.slice(3).replaceAll("\\", "/"))
    .filter((relativePath) => relativePath !== path.relative(repositoryRoot, releasePath).replaceAll("\\", "/"))
    .filter((relativePath) => !relativePath.startsWith("benchmarks/blind-object-v1-results/.phase6a-") && !relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/"));
  for (const absolutePath of await walkFiles(resultRoot)) {
    const relativePath = path.relative(repositoryRoot, absolutePath).replaceAll("\\", "/");
    if (!artifactPaths.includes(relativePath)) artifactPaths.push(relativePath);
  }
  artifactPaths.sort();
  const artifactHashes = [];
  for (const relativePath of artifactPaths) artifactHashes.push({ relativePath, sha256: await fileHash(path.join(repositoryRoot, relativePath)) });
  const core = {
    schemaVersion: "1.0",
    releaseType: "KATHERINE_SYNTHETIC_EXECUTIVE_V2_RESPONSE_BOUNDARY_RECOVERY_RELEASE",
    releaseState: "SEALED_RESPONSE_BOUNDARY_RECOVERY_AND_FINAL_BLIND_EVALUATION",
    version: "1.12.34",
    createdAt,
    startingIdentity: STARTING,
    provenance: { correctionHash: correction.correctionHash, historical43Aggregate: STARTING.historical43Aggregate, corrected43Aggregate: correction.correctedManifest.aggregateHash, release331Aggregate: STARTING.release331Aggregate, terminal329Aggregate: STARTING.terminal329Aggregate, terminalReleaseHash: STARTING.releaseHash, terminalReleaseRecordSha256: sha256Bytes(terminalReleaseBytes) },
    responseBoundary: { determinationHash: determination.determinationHash, successorContractHash: contract.contractHash, localHardCeilingBytes: PROVIDER_RESPONSE_BODY_LIMIT_BYTES, overflowProbeBytes: PROVIDER_RESPONSE_BODY_OVERFLOW_PROBE_BYTES, oldBoundaryAbsentFromExecutionPath: true },
    sourceSeal: { sourceSealHash: sourceSeal.sourceSealHash, sourceSealSha256: await fileHash(sourceSealPath), uncommittedDiffHash: sourceSeal.uncommittedDiffHash, correctedExecutableAggregateHash: sourceSeal.correctedExecutableAggregateHash, changedFileCount: sourceSeal.changedFileCount, executableFileCount: sourceSeal.executableFileCount },
    recovery: { authorityHash: authority.authorityHash, terminalizationReceiptHash: terminalization.receiptHash, exactCaseOrder: ["KE-V2-C13", "KE-V2-C14"], caseOutputHashes: executionSummary.caseOutputHashes, counts: executionSummary.counts, conservativeCostUsd: executionSummary.conservativeAccountedCostUsd, cumulativeConservativeCostUsd: executionSummary.cumulativeConservativeAccountedCostUsd, maximumCumulativeConservativeCostUsd: executionSummary.maximumCumulativeConservativeCostUsd },
    evaluation: { invocationCount: evaluatorAudit.evaluatorInvocationCount, includedCaseInventoryHash: inventory.inventoryHash, evaluationHash: evaluation.evaluationHash, score: `${evaluation.passedChecks}/${evaluation.totalChecks}`, overallPercent: evaluation.overallPercent, safetyCriticalPass: evaluation.safetyCriticalPass, qualified: evaluation.qualified, classification: evaluation.classification, resultSealHash: resultSeal.resultSealHash, evaluatorAccessAuditHash: evaluatorAudit.proofHash, usageAndCostAggregateHash: usage.aggregateHash },
    activityCounts: { credentialAccesses: 2, metadataRequests: 0, providerRequests: executionSummary.counts.physicalProviderAttempts, retries: executionSummary.counts.retryAttempts, caseReplacements: 1, untouchedCaseFirstExecutions: 1, evaluatorInvocations: 1, evaluatorProviderCalls: 0, benchmarkExecutions: 0, productHandlerCalls: 0, providerTools: 0, realWorkers: 0, memoryPromotions: 0, previews: 0, productionActivities: 0, merges: 0, deployments: 0 },
    preservation: { originalC01ThroughC12Unchanged: true, originalC06AndC13PreservedAndExcluded: true, historicalEmptyC08StubPreservedAndExcluded: true, originalC13ModelContentInspectedOrUsed: false, c14WasUntouchedBeforeRecovery: true, canonicalRequestPromptExecutiveActionCognitionBrokerScorerEvaluatorAndHandlersUnchanged: true, phase6aArtifactsPreserved: true },
    artifactHashes,
    artifactCount: artifactHashes.length,
    artifactAggregateHash: sha256Json(artifactHashes)
  };
  return seal(core, "releaseHash");
}

export async function writeRecoveryRelease({ resultRoot }) {
  const release = await buildRecoveryRelease({ resultRoot }); await writeExclusiveJson(releasePath, release); return release;
}

async function main(argv) {
  if (argv[0] === "WRITE_PREFLIGHT_ARTIFACTS") {
    const result = await writePreflightArtifacts();
    process.stdout.write(`${stableJson({ correctionHash: result.correction.correctionHash, determinationHash: result.determination.determinationHash, contractHash: result.contract.contractHash })}\n`);
    return;
  }
  if (argv[0] === "WRITE_SOURCE_SEAL") {
    const result = await writeRecoverySourceSeal();
    process.stdout.write(`${stableJson({ sourceSealHash: result.sourceSealHash, uncommittedDiffHash: result.uncommittedDiffHash, correctedExecutableAggregateHash: result.correctedExecutableAggregateHash, changedFileCount: result.changedFileCount, executableFileCount: result.executableFileCount })}\n`);
    return;
  }
  if (argv[0] === "WRITE_RELEASE") {
    assert.ok(argv[1], "result root is required"); const result = await writeRecoveryRelease({ resultRoot: path.resolve(argv[1]) });
    process.stdout.write(`${stableJson({ releaseHash: result.releaseHash, artifactCount: result.artifactCount, artifactAggregateHash: result.artifactAggregateHash, classification: result.evaluation.classification, resultSealHash: result.evaluation.resultSealHash })}\n`);
    return;
  }
  throw new Error("command must be WRITE_PREFLIGHT_ARTIFACTS, WRITE_SOURCE_SEAL or WRITE_RELEASE");
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(scriptPath)) await main(process.argv.slice(2));
