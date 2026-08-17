import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import {
  CASE_IDS,
  FROZEN_IDENTITIES,
  LIMITS,
  appendLedgerEvent,
  fileSha256,
  ledgerState,
  readJson,
  readLedger,
  runRoot,
  stableJson,
  writeExclusiveJson
} from "./v4-runtime.mjs";
import {
  calculateV4Qualification,
  evaluateTerminalMissing,
  evaluateV4Response,
  loadEvaluatorPackages
} from "./v4-scorer.mjs";
import {
  aggregateTerminalEvidence,
  buildTerminalResultRecord,
  buildV4EvaluationRecord
} from "./v4-sealer.mjs";

const executionRoot = path.join(runRoot, "execution");
const ledgerRoot = path.join(executionRoot, "authority-ledger");
const evaluationRoot = path.join(runRoot, "evaluation");

async function main() {
  const [authorityIdentity, authorityCommit, executionSummary, publicPackage] = await Promise.all([
    readJson(path.join(runRoot, "authority-file-identity.json")),
    readJson(path.join(executionRoot, "authority-commit-readback.json")),
    readJson(path.join(executionRoot, "execution-summary.json")),
    readJson(path.join(runRoot, "..", "v4-independent-qualification-corpus", "public-package", "public-package.json"))
  ]);
  let events = await readLedger(ledgerRoot);
  assert.equal(ledgerState(events).phase, "CLOSED", "V4_EVALUATOR_REQUIRES_CLOSED_AUTHORITY");
  await mkdir(evaluationRoot, { recursive: false });
  await mkdir(path.join(evaluationRoot, "cases"), { recursive: false });
  const openedAt = new Date().toISOString();
  const opened = await appendLedgerEvent(ledgerRoot, "EVALUATOR_OPENED", {
    invocationOrdinal: 1,
    authorityFileSha256: authorityIdentity.authorityFileSha256,
    executionSummaryHash: executionSummary.executionSummaryHash,
    terminalCaseCount: 14
  }, openedAt);

  const packages = await loadEvaluatorPackages();
  const caseResults = [];
  for (const caseId of CASE_IDS) {
    const publicCase = publicPackage.cases.find((item) => item.caseId === caseId);
    const terminal = await readJson(path.join(executionRoot, "cases", caseId, "terminal-output.json"));
    let result;
    if (terminal.terminalStatus === "VALID_RESPONSE" && terminal.response) {
      result = evaluateV4Response({ caseId, publicCase, response: terminal.response, packages });
      assert.equal(result.responseHash, terminal.responseHash);
    } else {
      result = evaluateTerminalMissing({ caseId, publicCaseHash: terminal.publicCaseHash, terminalStatus: terminal.terminalStatus, packages });
    }
    caseResults.push(result);
    await writeExclusiveJson(path.join(evaluationRoot, "cases", `${caseId}.json`), result);
  }
  assert.equal(caseResults.length, 14);
  assert.equal(caseResults.reduce((sum, item) => sum + item.totalChecks, 0), 98);
  const closedAt = new Date().toISOString();
  const closed = await appendLedgerEvent(ledgerRoot, "EVALUATOR_CLOSED", {
    invocationOrdinal: 1,
    caseEvaluationCount: 14,
    checkOutcomeCount: 98,
    caseEvaluationHashes: caseResults.map((item) => ({ caseId: item.caseId, caseEvaluationHash: item.caseEvaluationHash })),
    noRescoreNoReplacementNoReopen: true
  }, closedAt);
  events = await readLedger(ledgerRoot);
  const finalLedgerState = ledgerState(events);
  assert.equal(finalLedgerState.phase, "EVALUATED");
  assert.equal(finalLedgerState.evaluatorOpenCount, 1);
  assert.equal(finalLedgerState.evaluatorCloseCount, 1);
  const sideEffectsZero = Object.values(executionSummary.sideEffectCounts).every((value) => value === 0);
  const executionZeroTolerancePass = sideEffectsZero
    && executionSummary.counts.slotConsumptions === 14
    && executionSummary.counts.terminalOutputs === 14
    && executionSummary.counts.KatherineProviderAttempts <= LIMITS.maximumKatherineProviderAttempts
    && executionSummary.costs.totalCombinedCostUsd <= LIMITS.maximumTotalCostUsd
    && finalLedgerState.evaluatorOpenCount === 1
    && finalLedgerState.evaluatorCloseCount === 1;
  const qualification = calculateV4Qualification({
    caseResults,
    executionIntegrityValid: executionSummary.executionIntegrityValid,
    executionZeroTolerancePass
  });
  const evaluatorAccess = {
    openedAt,
    closedAt,
    openingLedgerEntryHash: opened.entryHash,
    closureLedgerEntryHash: closed.entryHash,
    invocationCount: 1,
    evaluatorFilesReadBeforeAuthorityClosure: 0,
    providerRequests: 0,
    humanDiscretion: 0,
    rescorePermitted: false,
    reopenPermitted: false
  };
  await writeExclusiveJson(path.join(evaluationRoot, "evaluator-access.json"), evaluatorAccess);
  const evaluation = buildV4EvaluationRecord({
    authorityIdentity,
    executionSummary,
    caseResults,
    qualification,
    evaluatorAccess,
    evaluatedAt: closedAt
  });
  await writeExclusiveJson(path.join(evaluationRoot, "evaluation-result.json"), evaluation);

  const terminalEvidenceSet = await aggregateTerminalEvidence({ roots: [executionRoot, evaluationRoot] });
  const runRootRelative = "qualification/synthetic-executive/v4-independent-qualification-run-001/";
  assert.ok(terminalEvidenceSet.members.every((item) => item.relativePath.startsWith(runRootRelative)));
  assert.ok(terminalEvidenceSet.members.every((item) => !item.relativePath.includes("v4-independent-qualification-corpus/")));
  assert.ok(terminalEvidenceSet.members.every((item) => !item.relativePath.includes("phase6a")));
  const terminal = buildTerminalResultRecord({
    classification: qualification.classification,
    authorityCommit,
    authorityIdentity,
    executionSummary,
    evaluation,
    frozenIdentities: FROZEN_IDENTITIES,
    terminalEvidenceSet,
    sealedAt: new Date().toISOString()
  });
  const terminalPath = path.join(runRoot, "terminal-result-record.json");
  await writeExclusiveJson(terminalPath, terminal);
  const terminalFileSha256 = await fileSha256(terminalPath);
  process.stdout.write(`${stableJson({
    classification: qualification.classification,
    score: `${qualification.passedChecks}/${qualification.totalChecks}`,
    percentage: qualification.percentage,
    safetyCriticalPass: qualification.safetyCriticalPass,
    fatalGatePass: qualification.fatalGatePass,
    zeroTolerancePass: qualification.zeroTolerancePass,
    terminalEvidenceMemberCount: terminalEvidenceSet.memberCount,
    terminalEvidenceTotalBytes: terminalEvidenceSet.totalBytes,
    terminalEvidencePathSetSha256: terminalEvidenceSet.pathSetSha256,
    terminalEvidenceAggregateSha256: terminalEvidenceSet.aggregateSha256,
    terminalFileSha256
  })}\n`);
}

await main();
