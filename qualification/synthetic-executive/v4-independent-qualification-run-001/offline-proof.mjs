import assert from "node:assert/strict";
import path from "node:path";

import { createCognitiveGovernor, decideCognitiveAction } from "../../../lib/cognitive-governor/index.js";
import {
  CASE_IDS,
  CHECKPOINT,
  FROZEN_IDENTITIES,
  LIMITS,
  PRESERVED_IDENTITIES,
  RESPONSE_FIELDS,
  appendLedgerEvent,
  buildV4Request,
  createCompleteCaptureFetch,
  createMentorBinding,
  createSlotRegistry,
  createV4ResponseSchema,
  fileSha256,
  inspectV4Schema,
  ledgerState,
  loadPublicPackage,
  mentorDecisionProjection,
  mentorInvocationInput,
  nextLedgerEvent,
  runRoot,
  seal,
  serializeMentorGuidance,
  sha256Bytes,
  sha256Json,
  stableJson,
  writeExclusiveJson
} from "./v4-runtime.mjs";
import {
  calculateV4Qualification,
  evaluateTerminalMissing,
  evaluateV4Response,
  fixtureOutcome,
  loadEvaluatorPackages,
  scorerIdentity
} from "./v4-scorer.mjs";
import { buildTerminalResultRecord } from "./v4-sealer.mjs";

const resultPath = path.join(runRoot, "offline-proof-result.json");
const startedAt = new Date().toISOString();
const activity = {
  credentialAccesses: 0,
  networkRequests: 0,
  providerRequests: 0,
  productHandlerCalls: 0,
  externalEvaluatorRequests: 0
};

function expectThrow(fn, expectedPattern) {
  let thrown = null;
  try { fn(); } catch (error) { thrown = error; }
  assert.ok(thrown, `EXPECTED_REJECTION_NOT_OBSERVED:${expectedPattern}`);
  assert.match(String(thrown.message), expectedPattern);
}

function referenceMentorInvocation({ bindingId, publicCaseHash }) {
  const input = mentorInvocationInput({ bindingId, publicCaseHash });
  const governor = createCognitiveGovernor(input.governor);
  const decision = decideCognitiveAction(governor, input.snapshot, input.options);
  return Object.freeze({
    invocationInput: input,
    decision: mentorDecisionProjection(decision),
    ...serializeMentorGuidance({ invocationInput: input, decision })
  });
}

function fixedIso(ordinal) {
  return new Date(Date.UTC(2026, 7, 16, 23, 0, ordinal)).toISOString();
}

async function main() {
  const publicPackage = await loadPublicPackage();
  const packages = await loadEvaluatorPackages();
  assert.deepEqual(publicPackage.responseContract, RESPONSE_FIELDS);
  assert.deepEqual(publicPackage.cases.map((item) => item.caseId), CASE_IDS);

  const syntheticHash = sha256Json({ fixture: "MENTOR_EQUIVALENCE_SYNTHETIC_NO_FROZEN_CASE_CONTENT" });
  const referenceMentor = referenceMentorInvocation({ bindingId: "SYNTHETIC-MENTOR-EQUIVALENCE", publicCaseHash: syntheticHash });
  const bridgeMentor = createMentorBinding({ bindingId: "SYNTHETIC-MENTOR-EQUIVALENCE", publicCaseHash: syntheticHash });
  assert.equal(stableJson(referenceMentor.invocationInput), stableJson(bridgeMentor.invocationInput));
  assert.equal(stableJson(referenceMentor.decision), stableJson(bridgeMentor.decision));
  assert.equal(referenceMentor.serializedGuidance, bridgeMentor.serializedGuidance);
  assert.equal(referenceMentor.guidanceHash, bridgeMentor.guidanceHash);

  const schema = createV4ResponseSchema();
  const schemaProof = inspectV4Schema(schema);
  assert.equal(schemaProof.valid, true, schemaProof.errors.join("|"));
  assert.equal(schemaProof.standaloneUntypedNullSchemas, 0);
  assert.deepEqual(Object.keys(schema.properties), RESPONSE_FIELDS);
  assert.deepEqual(schema.required, RESPONSE_FIELDS);

  const publicRequestProofs = [];
  const forbiddenEvaluatorTokens = [
    "evaluator-package",
    "expectedActualMission",
    "deterministicRationale",
    "fixtureId",
    "acceptedCategory",
    "fatalGateStatus",
    "mutationFixturesIdentity"
  ];
  for (const selected of publicPackage.cases) {
    const built = buildV4Request({
      publicCase: selected,
      decisionStandard: publicPackage.decisionStandard,
      responseContract: publicPackage.responseContract
    });
    assert.equal(built.caseId, selected.caseId);
    assert.ok(built.requestByteCount <= LIMITS.maximumSerializedRequestBytes);
    const serialized = built.serializedRequest;
    for (const token of forbiddenEvaluatorTokens) assert.equal(serialized.includes(token), false, `EVALUATOR_TOKEN_EXPOSED:${selected.caseId}:${token}`);
    for (const checkId of packages.semanticRubric.checks.map((item) => item.checkId)) assert.equal(serialized.includes(checkId), false, `CHECK_ID_EXPOSED:${selected.caseId}:${checkId}`);
    for (const other of publicPackage.cases.filter((item) => item.caseId !== selected.caseId)) {
      assert.equal(serialized.includes(other.caseId), false, `OTHER_CASE_ID_EXPOSED:${selected.caseId}:${other.caseId}`);
      assert.equal(serialized.includes(other.publicInput.caseTitle), false, `OTHER_CASE_TITLE_EXPOSED:${selected.caseId}:${other.caseId}`);
    }
    assert.equal(stableJson(built.prompt.publicPayload.case), stableJson(selected));
    publicRequestProofs.push({
      caseId: selected.caseId,
      publicCaseHash: built.publicCaseHash,
      mentorGuidanceHash: built.mentorBinding.guidanceHash,
      requestHash: built.requestHash,
      requestByteCount: built.requestByteCount,
      exactlyOnePublicCase: true,
      evaluatorMaterialBytes: 0,
      otherCaseCount: 0
    });
  }
  assert.equal(new Set(publicRequestProofs.map((item) => item.requestHash)).size, 14);

  const expectedMutationProof = await (async () => {
    const { readJson, evaluatorPackageRoot } = await import("./v4-runtime.mjs");
    return readJson(path.join(evaluatorPackageRoot, "mutation-proof.json"));
  })();
  const expectedByFixture = new Map(expectedMutationProof.results.map((item) => [item.fixtureId, item]));
  const fixtureResults = [];
  const seenFixtures = new Set();
  const fixtureClassCounts = {};
  const mutationKindCounts = {};
  for (const fixture of packages.mutationFixtures.fixtures) {
    assert.equal(seenFixtures.has(fixture.fixtureId), false, `DUPLICATE_FIXTURE:${fixture.fixtureId}`);
    seenFixtures.add(fixture.fixtureId);
    fixtureClassCounts[fixture.fixtureClass] = (fixtureClassCounts[fixture.fixtureClass] || 0) + 1;
    if (fixture.mutationKind) mutationKindCounts[fixture.mutationKind] = (mutationKindCounts[fixture.mutationKind] || 0) + 1;
    const publicCase = publicPackage.cases.find((item) => item.caseId === fixture.caseId);
    const evaluation = evaluateV4Response({ caseId: fixture.caseId, publicCase, response: fixture.response, packages });
    const outcome = fixtureOutcome(evaluation);
    const expected = expectedByFixture.get(fixture.fixtureId);
    assert.ok(expected, `UNEXPECTED_FIXTURE:${fixture.fixtureId}`);
    assert.deepEqual(outcome.failedCheckIds, expected.failedCheckIds, `FIXTURE_CHECK_RESULT_DIFFER:${fixture.fixtureId}`);
    assert.deepEqual(outcome.fatalGateCodes, expected.fatalGateCodes, `FIXTURE_FATAL_RESULT_DIFFER:${fixture.fixtureId}`);
    assert.equal(outcome.allSevenChecksPass, expected.allSevenChecksPass, `FIXTURE_PASS_RESULT_DIFFER:${fixture.fixtureId}`);
    fixtureResults.push({ fixtureId: fixture.fixtureId, sequence: fixture.sequence, fixtureClass: fixture.fixtureClass, ...outcome });
  }
  assert.equal(fixtureResults.length, 280);
  assert.equal(seenFixtures.size, 280);
  assert.deepEqual(fixtureResults.map((item) => item.sequence), Array.from({ length: 280 }, (_, index) => index + 1));
  assert.deepEqual(fixtureClassCounts, { INDIVIDUAL_NEGATIVE: 252, COMBINED_NEGATIVE: 14, VALID_BASELINE: 14 });
  assert.equal(mutationKindCounts.missing, 84);
  assert.equal(mutationKindCounts.invalidType, 84);
  assert.equal(mutationKindCounts.materiallyInvalid, 84);
  assert.equal(fixtureResults.filter((item) => item.fixtureClass !== "VALID_BASELINE" && item.allSevenChecksPass).length, 0);
  assert.equal(fixtureResults.filter((item) => item.fixtureClass === "VALID_BASELINE" && !item.allSevenChecksPass).length, 0);

  const slotRegistry = createSlotRegistry(publicPackage);
  assert.equal(slotRegistry.slotCount, 14);
  assert.deepEqual(slotRegistry.slots.map((item) => item.caseId), CASE_IDS);
  assert.equal(new Set(slotRegistry.slots.map((item) => item.slotId)).size, 14);
  assert.equal(new Set(slotRegistry.slots.map((item) => item.publicCaseHash)).size, 14);
  let events = [];
  events.push(nextLedgerEvent(events, "AUTHORITY_ACTIVATED", { authorityId: "OFFLINE-SYNTHETIC-AUTHORITY" }, fixedIso(0)));
  events.push(nextLedgerEvent(events, "SLOT_CONSUMED", { caseId: CASE_IDS[0], slotId: slotRegistry.slots[0].slotId }, fixedIso(1)));
  expectThrow(() => nextLedgerEvent(events, "SLOT_CONSUMED", { caseId: CASE_IDS[0], slotId: slotRegistry.slots[0].slotId }, fixedIso(2)), /V4_SLOT_OUT_OF_ORDER_OR_REPLAY|V4_SLOT_DUPLICATE_CONSUMPTION/);
  expectThrow(() => nextLedgerEvent(events, "EVALUATOR_OPENED", { invocationOrdinal: 1 }, fixedIso(2)), /V4_EVALUATOR_LOCKED_BEFORE_AUTHORITY_CLOSURE/);
  events.push(nextLedgerEvent(events, "SLOT_TERMINAL", { caseId: CASE_IDS[0], terminalStatus: "SYNTHETIC_TERMINAL" }, fixedIso(2)));
  for (let index = 1; index < CASE_IDS.length; index += 1) {
    events.push(nextLedgerEvent(events, "SLOT_CONSUMED", { caseId: CASE_IDS[index], slotId: slotRegistry.slots[index].slotId }, fixedIso(index * 2 + 1)));
    events.push(nextLedgerEvent(events, "SLOT_TERMINAL", { caseId: CASE_IDS[index], terminalStatus: "SYNTHETIC_TERMINAL" }, fixedIso(index * 2 + 2)));
  }
  events.push(nextLedgerEvent(events, "AUTHORITY_CLOSED", { terminalCaseIds: CASE_IDS }, fixedIso(30)));
  events.push(nextLedgerEvent(events, "EVALUATOR_OPENED", { invocationOrdinal: 1 }, fixedIso(31)));
  expectThrow(() => nextLedgerEvent(events, "EVALUATOR_OPENED", { invocationOrdinal: 2 }, fixedIso(32)), /V4_EVALUATOR_REOPEN_PROHIBITED|V4_EVALUATOR_LOCKED/);
  events.push(nextLedgerEvent(events, "EVALUATOR_CLOSED", { invocationOrdinal: 1 }, fixedIso(32)));
  const finalLedgerState = ledgerState(events);
  assert.deepEqual(finalLedgerState.consumedCaseIds, CASE_IDS);
  assert.deepEqual(finalLedgerState.terminalCaseIds, CASE_IDS);
  assert.equal(finalLedgerState.evaluatorOpenCount, 1);
  assert.equal(finalLedgerState.evaluatorCloseCount, 1);

  const baselineEvaluations = packages.mutationFixtures.fixtures
    .filter((item) => item.fixtureClass === "VALID_BASELINE")
    .map((fixture) => evaluateV4Response({
      caseId: fixture.caseId,
      publicCase: publicPackage.cases.find((item) => item.caseId === fixture.caseId),
      response: fixture.response,
      packages
    }));
  const qualificationOne = calculateV4Qualification({ caseResults: baselineEvaluations, executionIntegrityValid: true, executionZeroTolerancePass: true });
  const qualificationTwo = calculateV4Qualification({ caseResults: baselineEvaluations, executionIntegrityValid: true, executionZeroTolerancePass: true });
  assert.equal(stableJson(qualificationOne), stableJson(qualificationTwo));
  assert.equal(qualificationOne.passedChecks, 98);
  assert.equal(qualificationOne.qualified, true);
  const missing = evaluateTerminalMissing({ caseId: CASE_IDS[0], publicCaseHash: slotRegistry.slots[0].publicCaseHash, terminalStatus: "TERMINAL_MISSING_OUTPUT", packages });
  assert.equal(missing.passedChecks, 0);
  assert.equal(missing.totalChecks, 7);
  assert.equal(missing.fatalGatePass, false);

  const oversizedBody = Buffer.from(JSON.stringify({ id: "synthetic-response", padding: "x".repeat(70000) }), "utf8");
  assert.ok(oversizedBody.length > 65536);
  let captured = null;
  const captureFetch = createCompleteCaptureFetch({
    fetchImpl: async () => new Response(oversizedBody, { status: 200, headers: { "content-type": "application/json", "x-request-id": "synthetic-request" } }),
    onCapture: async (value) => { captured = value; }
  });
  const syntheticResponse = await captureFetch("https://synthetic.invalid/v1/responses", { method: "POST" });
  assert.equal((await syntheticResponse.arrayBuffer()).byteLength, oversizedBody.length);
  assert.equal(captured.byteCount, oversizedBody.length);
  assert.equal(captured.sha256, sha256Bytes(oversizedBody));
  assert.equal(captured.byteCount > 65536, true);

  const syntheticTerminalSet = Object.freeze({ memberCount: 2, totalBytes: 200, pathSetSha256: "1".repeat(64), aggregateSha256: "2".repeat(64), members: [] });
  const terminalInput = {
    classification: qualificationOne.classification,
    authorityCommit: { commit: "3".repeat(40), tree: "4".repeat(40), parent: CHECKPOINT.commit, subject: "synthetic" },
    authorityIdentity: { authorityId: "OFFLINE-SYNTHETIC-AUTHORITY", authorityFileSha256: "5".repeat(64) },
    executionSummary: { executionCommit: "3".repeat(40), executionSummaryHash: "6".repeat(64) },
    evaluation: { evaluationHash: "7".repeat(64), qualification: qualificationOne },
    frozenIdentities: FROZEN_IDENTITIES,
    terminalEvidenceSet: syntheticTerminalSet,
    sealedAt: "2026-08-16T23:59:59.000Z"
  };
  const terminalOne = buildTerminalResultRecord(terminalInput);
  const terminalTwo = buildTerminalResultRecord(terminalInput);
  assert.equal(stableJson(terminalOne), stableJson(terminalTwo));

  const completedAt = new Date().toISOString();
  const proof = seal({
    schemaVersion: "1.0",
    proofType: "V4_BRIDGE_SCORER_AUTHORITY_LEDGER_CAPTURE_SEALER_COMPLETE_OFFLINE_PROOF",
    startedAt,
    completedAt,
    checkpoint: CHECKPOINT,
    frozenIdentities: FROZEN_IDENTITIES,
    preservedIdentities: PRESERVED_IDENTITIES,
    responseContract: RESPONSE_FIELDS,
    responseFieldCount: RESPONSE_FIELDS.length,
    mentorEquivalence: {
      inputEqual: true,
      outputEqual: true,
      policyDecisionEqual: true,
      serializedGuidanceEqual: true,
      guidanceHash: bridgeMentor.guidanceHash,
      directMentorImport: true,
      productInvocationSemantics: "CREATE_COGNITIVE_GOVERNOR_THEN_DECIDE_COGNITIVE_ACTION",
      productHandlerCalls: 0,
      providerRequests: 0
    },
    publicEvaluatorSeparation: {
      caseCount: 14,
      requestProofs: publicRequestProofs,
      maximumRequestBytes: Math.max(...publicRequestProofs.map((item) => item.requestByteCount)),
      evaluatorMaterialBytes: 0,
      otherCaseExposures: 0
    },
    schemaProof,
    scorerProof: {
      scorerIdentity: scorerIdentity(packages),
      exactExecutions: fixtureResults.length,
      individualNegatives: 252,
      individualMissing: mutationKindCounts.missing,
      individualInvalidType: mutationKindCounts.invalidType,
      individualMateriallyInvalid: mutationKindCounts.materiallyInvalid,
      combinedNegativeCases: 14,
      validBaselines: 14,
      missingFixtures: 0,
      duplicateFixtures: 0,
      unexpectedFixtures: 0,
      negativeEscapes: 0,
      validBaselineFailures: 0,
      uncoveredRequiredFields: packages.fieldCoverageMatrix.uncoveredRequiredFields,
      incompleteRubricCases: packages.fieldCoverageMatrix.incompleteRubricCases,
      resultAggregateHash: sha256Json(fixtureResults),
      results: fixtureResults
    },
    authorityLedgerProof: {
      slotCount: slotRegistry.slotCount,
      slotRegistryHash: slotRegistry.slotRegistryHash,
      exactCaseOrder: CASE_IDS,
      caseToSlotBijection: true,
      duplicateRejected: true,
      replayRejected: true,
      evaluatorLockedBeforeClosure: true,
      evaluatorOpenedAfterClosure: true,
      evaluatorOpenCount: finalLedgerState.evaluatorOpenCount,
      evaluatorCloseCount: finalLedgerState.evaluatorCloseCount
    },
    evaluationProof: {
      checksPerCase: 7,
      totalChecks: 98,
      deterministicQualification: true,
      terminalMissingOutputScored: true,
      safetyCriticalCalculated: true,
      fatalGatesCalculated: true,
      resultSealDeterministic: true
    },
    rawResponseCaptureProof: {
      syntheticResponseBytes: oversizedBody.length,
      capturedBytes: captured.byteCount,
      capturedSha256: captured.sha256,
      aboveHistorical65536Boundary: true,
      complete: captured.byteCount === oversizedBody.length
    },
    prohibitedActivityCounts: activity,
    completeOfflineProofInvocationCount: 1,
    passed: true
  }, "proofHash");
  await writeExclusiveJson(resultPath, proof);
  process.stdout.write(`${stableJson({ passed: true, proofHash: proof.proofHash, exactExecutions: 280, requestsProved: 14, maximumRequestBytes: proof.publicEvaluatorSeparation.maximumRequestBytes })}\n`);
}

await main();
