import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { CASE_IDS, repositoryRoot, sha256Bytes, sha256Json, stableJson } from "./v4-runtime.mjs";

export function buildV4EvaluationRecord({ authorityIdentity, executionSummary, caseResults, qualification, evaluatorAccess, evaluatedAt }) {
  assert.equal(new Date(evaluatedAt).toISOString(), evaluatedAt);
  assert.deepEqual(caseResults.map((item) => item.caseId), CASE_IDS);
  assert.equal(caseResults.reduce((sum, item) => sum + item.totalChecks, 0), 98);
  const core = {
    schemaVersion: "1.0",
    evaluationType: "V4_DETERMINISTIC_INDEPENDENT_MENTOR_GUIDED_QUALIFICATION_EVALUATION",
    evaluatedAt,
    authorityIdentity,
    executionSummaryHash: executionSummary.executionSummaryHash,
    evaluatorAccess,
    exactCaseOrder: CASE_IDS,
    caseResults: caseResults.map((item) => ({
      caseId: item.caseId,
      caseEvaluationHash: item.caseEvaluationHash,
      checks: Object.fromEntries(Object.entries(item.checks).map(([dimension, check]) => [dimension, check.passed])),
      passedChecks: item.passedChecks,
      totalChecks: item.totalChecks,
      casePassed: item.casePassed,
      safetyCritical: item.safetyCritical,
      fatalGatePass: item.fatalGatePass,
      zeroTolerancePass: item.zeroTolerancePass
    })),
    caseResultAggregateHash: sha256Json(caseResults.map((item) => item.caseEvaluationHash)),
    qualification,
    checksAdded: 0,
    checksRemoved: 0,
    weightChanges: 0,
    evaluatorProviderRequests: 0,
    evaluatorHumanDiscretion: 0,
    inferredSynonymsUsed: false,
    rescorePermitted: false,
    replacementPermitted: false
  };
  return Object.freeze({ ...core, evaluationHash: sha256Json(core) });
}

async function walk(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const selected = path.join(root, entry.name);
    if (entry.isDirectory()) files.push(...await walk(selected));
    else files.push(selected);
  }
  return files;
}

export async function aggregateTerminalEvidence({ roots }) {
  const absolute = [];
  for (const root of roots) absolute.push(...await walk(root));
  const relativePaths = absolute.map((item) => path.relative(repositoryRoot, item).replaceAll("\\", "/")).sort();
  assert.equal(new Set(relativePaths).size, relativePaths.length, "V4_R_DUPLICATE_PATH");
  const members = [];
  for (const relativePath of relativePaths) {
    const bytes = await readFile(path.join(repositoryRoot, ...relativePath.split("/")));
    members.push({ relativePath, byteLength: bytes.length, sha256: sha256Bytes(bytes) });
  }
  const totalBytes = members.reduce((sum, item) => sum + item.byteLength, 0);
  const pathSetSha256 = sha256Bytes(Buffer.from(stableJson(relativePaths), "utf8"));
  const aggregateSha256 = sha256Bytes(Buffer.from(members.map((item) => `${item.relativePath}\0${item.byteLength}\0${item.sha256}\n`).join(""), "utf8"));
  return Object.freeze({
    normalization: Object.freeze({
      memberPaths: "repository-relative forward-slash paths",
      pathOrder: "UTF8_ORDINAL_ASCENDING",
      pathSetDigest: "SHA256_CANONICAL_JSON_SORTED_PATH_ARRAY",
      aggregateDigest: "SHA256_PATH_NUL_DECIMAL_BYTES_NUL_SHA256_TERMINAL_LF"
    }),
    memberCount: members.length,
    totalBytes,
    pathSetSha256,
    aggregateSha256,
    members
  });
}

export function buildTerminalResultRecord({
  classification,
  authorityCommit,
  authorityIdentity,
  executionSummary,
  evaluation,
  frozenIdentities,
  terminalEvidenceSet,
  sealedAt
}) {
  assert.equal(new Date(sealedAt).toISOString(), sealedAt);
  assert.equal(evaluation.qualification.classification, classification);
  return Object.freeze({
    schemaVersion: "1.0",
    recordType: "V4_INDEPENDENT_MENTOR_GUIDED_QUALIFICATION_TERMINAL_RESULT_RECORD",
    sealType: "SINGLE_TERMINAL_V4_RESULT_SEAL",
    classification,
    sealedAt,
    authorityCommit,
    authorityIdentity,
    executionCommit: executionSummary.executionCommit,
    executionSummaryHash: executionSummary.executionSummaryHash,
    evaluationHash: evaluation.evaluationHash,
    frozenIdentities,
    exactCaseOrder: CASE_IDS,
    qualification: evaluation.qualification,
    terminalEvidenceSet,
    terminalRecordExcludedFromEvidenceSet: true,
    frozenCorpusIntersectionCount: 0,
    phase6AIntersectionCount: 0,
    missingPaths: [],
    unexpectedPaths: [],
    duplicatePaths: [],
    unreadablePaths: [],
    intersectingPaths: [],
    unclassifiedPaths: [],
    productActivationAuthorized: false,
    deploymentAuthorized: false,
    mergeAuthorized: false,
    memoryPromotionAuthorized: false,
    rescorePermitted: false,
    replayPermitted: false,
    replacementPermitted: false,
    ownFullFileSha256Embedded: false
  });
}
