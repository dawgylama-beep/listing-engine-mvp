import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { buildQualificationAuthority, createNewQualificationAuthority, validateQualificationAuthority } from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-authority.mjs";
import { ImmutableQualificationActionLedger } from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-execution-ledger.mjs";
import { buildQualificationReleaseRecord, validateQualificationReleaseRecord } from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-release.mjs";
import {
  QUALIFICATION_LIMITS, QUALIFICATION_ROUTE, QualificationResponsesClient, SEALED_BINDINGS,
  assertQualificationStructuredOutputsSubset, buildQualificationInferenceRequestEnvelope,
  createQualificationActionTransportSchema, loadQualificationProviderProfile, qualificationRouteBindings
} from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs";
import { validateExecutiveAction, sealExecutiveAction } from "../qualification/synthetic-executive/scripts/action-broker.mjs";
import { runBlindQualificationRealRoute } from "../qualification/synthetic-executive/scripts/run-qualification.mjs";
import { readJson, sha256Bytes, sha256Json, stableJson } from "../qualification/synthetic-executive/scripts/protocol.mjs";
import { SafeProviderFailure } from "../qualification/synthetic-executive/calibration/scripts/real-route-redaction.mjs";

const repositoryRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.slice(1)), "..");
const qualificationRoot = path.join(repositoryRoot, "qualification", "synthetic-executive");
const fixedTime = "2026-08-10T12:00:00.000Z";

async function fixtures() {
  const [publicManifest, readinessManifest, budgetProfile, accessDenialProof, controls, routeBindings] = await Promise.all([
    readJson(path.join(qualificationRoot, "episodes", "public-manifest.json")), readJson(path.join(qualificationRoot, "readiness-manifest.json")),
    readJson(path.join(qualificationRoot, "qualification-budget-profile.json")), readJson(path.join(qualificationRoot, "proofs", "evaluator-control-access-denial-proof.json")),
    readJson(path.join(qualificationRoot, "evaluator-controls", "controls.json")), qualificationRouteBindings()
  ]);
  return { publicManifest, readinessManifest, budgetProfile, accessDenialProof, controls, routeBindings };
}

function authorityFor({ publicManifest, routeBindings, runRoot, authorityId = "offline-qualification-authority" }) {
  return buildQualificationAuthority({ authorityId, createdAt: fixedTime, toolingCommit: "a".repeat(40), toolingTree: "b".repeat(40), toolingReleaseHash: "c".repeat(64), publicManifest, routeBindings, runRoot });
}

function actionForTurn(turn, actionId, control) {
  const evidence = turn.visibleArtifactInventory[0].artifactId;
  const memoryReferences = control.expectedClassification === "RECURRENCE" ? turn.retrievedMemoryRecords.map((item) => item.memoryId).slice(0, 1) : [];
  const stateAction = {
    CASE_OPEN: "RECONSTRUCT_EPISODE", EPISODE_RECONSTRUCTED: "RETRIEVE_RELEVANT_MEMORY",
    FAILURE_CLASSIFIED: "PROPOSE_BOUNDED_ENGINEERING_TASK", TASK_PROPOSED: "SPECIFY_REGRESSION_PROOF",
    PROOF_SPECIFIED: "SPECIFY_REQUIRED_AUTHORITY", WORKER_DOSSIER_RECEIVED: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE",
    EVIDENCE_EVALUATED: "WRITE_GENERALIZED_LESSON_CANDIDATE", LESSON_RECORDED: "SELECT_NEXT_LEGAL_ACTION",
    NEXT_ACTION_SELECTED: "STOP_SAFELY"
  };
  let actionType = stateAction[turn.executiveState];
  if (turn.executiveState === "MEMORY_RETRIEVED") actionType = control.expectedClassification === "HISTORICAL" ? "CLASSIFY_FAILURE" : control.expectedClassification === "RECURRENCE" ? "DECLARE_RECURRENCE" : "DECLARE_NOVEL_FAILURE";
  let details = {};
  if (actionType === "RETRIEVE_RELEVANT_MEMORY") details = { queryText: `${turn.episodeId} evidence failure`, queryFacets: { cohort: [turn.cohort], pattern: ["evidence", "failure"], failureClass: [] } };
  if (actionType === "CLASSIFY_FAILURE") details = { failureClass: control.expectedFailureClass };
  if (actionType === "DECLARE_RECURRENCE") details = { failureClass: control.expectedFailureClass, memoryMatchClass: control.expectedMemoryMatchClass };
  if (actionType === "DECLARE_NOVEL_FAILURE") details = { failureClass: control.expectedFailureClass };
  if (actionType === "PROPOSE_BOUNDED_ENGINEERING_TASK") details = {
    exactFailureClass: control.expectedFailureClass, affectedComponents: ["sealed fixture component"], proposedChangeSurface: ["bounded fixture surface"],
    explicitlyExcludedComponents: ["product", "production", "benchmark"], generalizedInvariant: "Preserve evidence and authority boundaries across the exact path.",
    minimumRequiredRegressionSet: ["unit", "exact path", "negative", "restart"], exactPathOrStateProofRequirement: "Prove the exact sealed fixture path.",
    rollbackRequirement: "Revert only the bounded fixture change.", stopCondition: "Stop on contradictory or missing evidence.",
    costAndToolEstimate: { toolSteps: 4, costUsd: 0 }, requestedAuthority: "BOUNDED_ENGINEERING"
  };
  if (actionType === "SPECIFY_REGRESSION_PROOF") details = { helperUnitProof: "required", exactProductionPathProof: "required", historicalStateProof: "required", negativeProof: "required", restartOrRecoveryProof: "required", forbiddenActivityProof: "required" };
  if (actionType === "EVALUATE_RETURNED_ENGINEERING_EVIDENCE") details = { classification: control.expectedDossierEvaluation, requiredClaims: [{ claimId: "sealed-dossier-proof", status: control.expectedDossierEvaluation === "VALID_PASS" ? "PROVEN" : "NOT_PROVEN", evidenceReferences: [evidence] }] };
  if (actionType === "WRITE_GENERALIZED_LESSON_CANDIDATE") details = { memoryRecord: {
    schemaVersion: "1.0", memoryType: "GENERALIZED_LESSON_CANDIDATE", memoryId: `memory-${turn.episodeId.toLowerCase()}`,
    sourceEpisodeIds: [turn.episodeId], evidenceReferences: [evidence], evidenceAggregateHash: sha256Json([evidence]),
    observedFailurePattern: `${control.expectedFailureClass} evidence pattern`, generalizedRule: `Apply the bounded ${control.expectedFailureClass} invariant only with matching evidence.`,
    triggeringConditions: ["matching visible evidence"], applicabilityBoundaries: ["same structural invariant"], explicitNonApplicabilityConditions: ["contradictory evidence"],
    recurrenceSignature: control.expectedFailureClass, recommendedActionPattern: control.expectedNextAction, prohibitedActions: ["replay", "production execution"],
    requiredProofBeforeAdvancement: ["exact path", "negative proof", "restart proof"], authorityNormallyRequired: control.expectedClassification === "NOVEL" ? "EXCEPTIONAL_HUMAN" : "BOUNDED_ENGINEERING",
    confidence: 0.72, unresolvedUncertainty: [], status: "CANDIDATE", predecessorMemoryIds: memoryReferences
  } };
  if (actionType === "SELECT_NEXT_LEGAL_ACTION") details = { selection: control.expectedNextAction };
  return {
    schemaVersion: "1.0", actionType, actionId, episodeId: turn.episodeId, executiveState: turn.executiveState,
    observedStateHash: turn.observedStateHash, evidenceReferences: [evidence], memoryReferences,
    factualFindings: ["Finding is limited to the visible sealed evidence."], uncertainties: [], confidence: 0.74,
    boundedRationaleSummary: "Bounded evidence-based action with no private rationale or hidden control access.",
    requestedSuccessorState: actionType,
    authorityClass: actionType === "SPECIFY_REQUIRED_AUTHORITY" ? (control.expectedClassification === "NOVEL" ? "EXCEPTIONAL_HUMAN" : "BOUNDED_ENGINEERING") : "NO_NEW_AUTHORITY",
    prohibitedOperations: ["provider tools", "source mutation", "production execution", "evaluator access"], details
  };
}

function fakeProvider(controls, capturedRequests, failurePlan = []) {
  let calls = 0;
  return async (_url, options) => {
    const body = JSON.parse(options.body); capturedRequests.push(body); calls += 1;
    const planned = failurePlan.shift(); if (planned) throw Object.assign(new Error(planned), { name: planned === "PROVIDER_TIMEOUT" ? "AbortError" : "TypeError" });
    const prompt = body.input[0].content[0].text; const turn = JSON.parse(prompt.slice(prompt.lastIndexOf("\n") + 1));
    const control = controls.controls.find((item) => item.episodeId === turn.episodeId); assert.ok(control);
    const actionId = body.text.format.schema.properties.actionId.enum[0]; const action = actionForTurn(turn, actionId, control);
    return new Response(JSON.stringify({
      id: `resp_${String(calls).padStart(4, "0")}`, model: "gpt-5.6-sol", status: "completed",
      output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(action) }] }],
      usage: { input_tokens: 100, input_tokens_details: { cached_tokens: 0 }, output_tokens: 50, output_tokens_details: { reasoning_tokens: 20 }, total_tokens: 150 }
    }), { status: 200, headers: { "content-type": "application/json", "x-request-id": `req_mock_${String(calls).padStart(4, "0")}` } });
  };
}

test("qualification route is exact, strict, zero-metadata, and documented-subset compatible", async () => {
  const schema = createQualificationActionTransportSchema({ episodeId: "KE-P7-H01", executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), actionId: "action-ke-p7-h01-01" });
  const audit = assertQualificationStructuredOutputsSubset(schema); assert.ok(audit.properties > 0); assert.equal(Object.hasOwn(schema, "anyOf"), false);
  const envelope = buildQualificationInferenceRequestEnvelope({ prompt: "offline", structuredSchema: schema });
  assert.equal(envelope.model, "gpt-5.6-sol"); assert.deepEqual(envelope.reasoning, { effort: "medium" }); assert.equal(envelope.store, false);
  assert.deepEqual(envelope.tools, []); assert.equal(envelope.text.format.type, "json_schema"); assert.equal(envelope.text.format.strict, true);
  assert.equal(QUALIFICATION_ROUTE.maximumMetadataRequests, 0);
  const source = await readFile(path.join(qualificationRoot, "qualification-real-route", "scripts", "qualification-route.mjs"), "utf8");
  assert.doesNotMatch(source, /checkExactModelAccess|metadataEndpoint\s*\)/); assert.match(source, /maximumMetadataRequests:\s*0/);
});

test("qualification-only release record rebuilds exactly from preserved sealed inputs", async () => {
  const rebuilt = await buildQualificationReleaseRecord();
  const committed = await readJson(path.join(qualificationRoot, "qualification-real-route", "qualification-real-route-release.json"));
  validateQualificationReleaseRecord(committed); assert.equal(stableJson(rebuilt), stableJson(committed));
  assert.equal(committed.releasePurpose, "QUALIFICATION_EXECUTION_ONLY"); assert.equal(committed.immutableCognitiveSubject.productVersion, "1.12.27");
  assert.deepEqual(committed.preservedBindings, {
    readinessManifestHash: SEALED_BINDINGS.readinessManifestHash, caseManifestHash: SEALED_BINDINGS.caseManifestHash,
    scoringControlsHash: SEALED_BINDINGS.scoringControlsHash, budgetProfileHash: SEALED_BINDINGS.budgetProfileHash,
    calibrationResultHash: SEALED_BINDINGS.calibrationResultHash
  });
  assert.deepEqual(committed.activityAssertions, { benchmarkExecutions: 0, credentialAccessCount: 0, externalNetworkRequestCount: 0, inferenceRequestCount: 0, liveAuthorityCreated: false, liveCaseExecutions: 0, merges: 0, metadataRequestCount: 0, modelCallCount: 0, previewDeployments: 0, productHandlerInvocations: 0, productionDeployments: 0 });
});

test("create-only twelve-slot authority binds immutable subject and sealed artifacts", async () => {
  const input = await fixtures(); const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-qualification-authority-"));
  try {
    const authorityPath = path.join(temporary, "authority.json");
    const authority = await createNewQualificationAuthority({ authorityPath, authorityId: "offline-create-only", createdAt: fixedTime, toolingCommit: "a".repeat(40), toolingTree: "b".repeat(40), toolingReleaseHash: "c".repeat(64), publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot: path.join(temporary, "run") });
    validateQualificationAuthority(authority, { publicManifest: input.publicManifest, routeBindings: input.routeBindings });
    assert.equal(authority.caseSlots.length, 12); assert.equal(new Set(authority.caseSlots.map((item) => item.caseSlotHash)).size, 12);
    await assert.rejects(createNewQualificationAuthority({ authorityPath, authorityId: "offline-create-only", createdAt: fixedTime, toolingCommit: "a".repeat(40), toolingTree: "b".repeat(40), toolingReleaseHash: "c".repeat(64), publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot: path.join(temporary, "run") }), /QUALIFICATION_AUTHORITY_PATH_OCCUPIED/);
    const altered = structuredClone(authority); altered.immutableSubjectIdentity.version = "1.12.28";
    assert.throws(() => validateQualificationAuthority(altered, { publicManifest: input.publicManifest, routeBindings: input.routeBindings }), /immutableSubjectIdentity|deep-equal/);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("offline mocked Responses route completes the sealed twelve-case multi-action lifecycle", async () => {
  const input = await fixtures(); const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-qualification-full-")); const runRoot = path.join(temporary, "run");
  const preserved = await Promise.all([
    "readiness-manifest.json", "episodes/public-manifest.json", "evaluator-control-aggregate.json", "qualification-budget-profile.json"
  ].map(async (relativePath) => sha256Bytes(await readFile(path.join(qualificationRoot, relativePath)))));
  try {
    const authority = authorityFor({ publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot });
    const captured = []; const profile = await loadQualificationProviderProfile();
    const credentialHandle = { present: true, routeType: "OFFLINE_TEST", withCredential: async (callback) => callback("offline-test-value") };
    const client = new QualificationResponsesClient({ profile, credentialHandle, fetchImpl: fakeProvider(input.controls, captured) });
    const result = await runBlindQualificationRealRoute({ authority, ...input, client, runRoot, clock: () => fixedTime });
    assert.equal(result.caseOutputs.length, 12); assert.equal(result.caseOutputs.every((item) => item.caseStatus === "CASE_SEALED"), true);
    assert.equal(result.caseOutputs.every((item) => item.actions.length === 10), true); assert.equal(result.evaluation.qualified, true);
    assert.equal(result.ledgerState.reasoningSteps, 120); assert.equal(result.ledgerState.toolActions, 24); assert.equal(result.ledgerState.dossierActions, 12);
    assert.equal(result.ledgerState.retrySlots, 0); assert.ok(result.ledgerState.reservedCostUsd <= 12); assert.equal(result.providerCounts.metadataRequests, 0);
    assert.equal(result.providerCounts.inferenceRequests, 120); assert.equal(captured.length, 120);
    for (const request of captured) {
      assert.equal(request.model, "gpt-5.6-sol"); assert.deepEqual(request.reasoning, { effort: "medium" }); assert.equal(request.store, false); assert.deepEqual(request.tools, []);
      const serialized = JSON.stringify(request); assert.doesNotMatch(serialized, /expectedFailureClass|expectedDossierEvaluation|expectedNextAction|evaluatorControlAggregateHash/);
      assert.equal(serialized.includes(SEALED_BINDINGS.calibrationResultHash), false, "calibration result was reused as qualification input");
    }
    assert.equal((await readJson(path.join(runRoot, "isolated-qualification-memory", "memory-ke-p7-n03.json"))).status, "CANDIDATE");
    const after = await Promise.all(["readiness-manifest.json", "episodes/public-manifest.json", "evaluator-control-aggregate.json", "qualification-budget-profile.json"].map(async (relativePath) => sha256Bytes(await readFile(path.join(qualificationRoot, relativePath)))));
    assert.deepEqual(after, preserved, "presealed qualification artifacts changed");
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("immutable ledger enforces exact ceilings, unique identities, and explicit retries", async () => {
  const input = await fixtures(); const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-qualification-ledger-"));
  try {
    const authority = authorityFor({ publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot: path.join(temporary, "run"), authorityId: "ledger-offline" });
    const ledger = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "ledger"), authority, clock: () => fixedTime }).initialize();
    const episode = input.publicManifest.episodes[0].episodeId; const requestHash = sha256Json("request");
    await ledger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "provider-first", operationHash: requestHash, reservationUsd: 0.1 });
    await assert.rejects(ledger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "provider-silent-retry", operationHash: requestHash, reservationUsd: 0.1 }), /explicit retry slot/);
    await ledger.consume({ caseId: episode, actionKind: "RETRY_SLOT", actionIdentity: "retry-one", operationHash: requestHash, retryOfActionIdentity: "provider-first", retryReason: "PROVIDER_TIMEOUT" });
    await ledger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "provider-second", operationHash: requestHash, reservationUsd: 0.1, retryOfActionIdentity: "retry-one" });
    await assert.rejects(ledger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "provider-third-no-slot", operationHash: requestHash, reservationUsd: 0.1 }), /explicit retry slot/);
    await assert.rejects(ledger.consume({ caseId: episode, actionKind: "SOURCE_OPERATION", actionIdentity: "source-op", operationHash: sha256Json("source") }), /UNAUTHORIZED_QUALIFICATION_ACTION_KIND/);
    await assert.rejects(ledger.consume({ caseId: episode, actionKind: "MEMORY_QUERY", actionIdentity: "provider-first", operationHash: sha256Json("duplicate") }), /ALREADY_CONSUMED/);
    const costLedger = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "cost-ledger"), authority, clock: () => fixedTime }).initialize();
    await assert.rejects(costLedger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "cost-over", operationHash: sha256Json("cost-over"), reservationUsd: 1.25000001 }), /PER_CASE_COST/);
    const toolLedger = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "tool-ledger"), authority, clock: () => fixedTime }).initialize();
    for (let index = 0; index < QUALIFICATION_LIMITS.perCase.maximumToolActions; index += 1) await toolLedger.consume({ caseId: episode, actionKind: "MEMORY_QUERY", actionIdentity: `tool-${index}`, operationHash: sha256Json({ index }) });
    await assert.rejects(toolLedger.consume({ caseId: episode, actionKind: "MEMORY_QUERY", actionIdentity: "tool-over", operationHash: sha256Json("tool-over") }), /PER_CASE_TOOL_ACTIONS/);
    const dossierLedger = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "dossier-ledger"), authority, clock: () => fixedTime }).initialize();
    await dossierLedger.consume({ caseId: episode, actionKind: "PRESEALED_DOSSIER", actionIdentity: "dossier-one", operationHash: sha256Json("dossier-one") });
    await assert.rejects(dossierLedger.consume({ caseId: episode, actionKind: "PRESEALED_DOSSIER", actionIdentity: "dossier-two", operationHash: sha256Json("dossier-two") }), /PER_CASE_DOSSIER_ACTIONS/);

    const reasoningLedger = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "reasoning-ledger"), authority, clock: () => fixedTime }).initialize();
    for (let index = 0; index < QUALIFICATION_LIMITS.perCase.maximumReasoningSteps; index += 1) await reasoningLedger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: `reasoning-${index}`, operationHash: sha256Json({ kind: "reasoning", index }), reservationUsd: 0 });
    await assert.rejects(reasoningLedger.consume({ caseId: episode, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "reasoning-over", operationHash: sha256Json("reasoning-over"), reservationUsd: 0 }), /PER_CASE_REASONING_STEPS/);

    const aggregateReasoning = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "aggregate-reasoning"), authority, clock: () => fixedTime }).initialize();
    for (const caseSlot of authority.caseSlots) for (let index = 0; index < 10; index += 1) await aggregateReasoning.consume({ caseId: caseSlot.episodeId, actionKind: "PROVIDER_ATTEMPT", actionIdentity: `aggregate-reason-${caseSlot.sequencePosition}-${index}`, operationHash: sha256Json({ case: caseSlot.episodeId, index }), reservationUsd: 0 });
    await assert.rejects(aggregateReasoning.consume({ caseId: authority.caseSlots.at(-1).episodeId, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "aggregate-reason-over", operationHash: sha256Json("aggregate-reason-over"), reservationUsd: 0 }), /AGGREGATE_REASONING_STEPS/);

    const aggregateTools = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "aggregate-tools"), authority, clock: () => fixedTime }).initialize();
    for (const caseSlot of authority.caseSlots.slice(0, 9)) for (let index = 0; index < 20; index += 1) await aggregateTools.consume({ caseId: caseSlot.episodeId, actionKind: "MEMORY_QUERY", actionIdentity: `aggregate-tool-${caseSlot.sequencePosition}-${index}`, operationHash: sha256Json({ toolCase: caseSlot.episodeId, index }) });
    await assert.rejects(aggregateTools.consume({ caseId: authority.caseSlots[9].episodeId, actionKind: "MEMORY_QUERY", actionIdentity: "aggregate-tool-over", operationHash: sha256Json("aggregate-tool-over") }), /AGGREGATE_TOOL_ACTIONS/);

    const aggregateCost = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "aggregate-cost"), authority, clock: () => fixedTime }).initialize();
    for (const caseSlot of authority.caseSlots) await aggregateCost.consume({ caseId: caseSlot.episodeId, actionKind: "PROVIDER_ATTEMPT", actionIdentity: `aggregate-cost-${caseSlot.sequencePosition}`, operationHash: sha256Json({ costCase: caseSlot.episodeId }), reservationUsd: 1 });
    await assert.rejects(aggregateCost.consume({ caseId: authority.caseSlots.at(-1).episodeId, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "aggregate-cost-over", operationHash: sha256Json("aggregate-cost-over"), reservationUsd: 0.01 }), /AGGREGATE_COST/);

    const aggregateRetries = await new ImmutableQualificationActionLedger({ root: path.join(temporary, "aggregate-retries"), authority, clock: () => fixedTime }).initialize();
    for (const caseSlot of authority.caseSlots) {
      const request = sha256Json({ retryCase: caseSlot.episodeId }); const attemptId = `aggregate-attempt-${caseSlot.sequencePosition}`; const retryId = `aggregate-retry-${caseSlot.sequencePosition}`;
      await aggregateRetries.consume({ caseId: caseSlot.episodeId, actionKind: "PROVIDER_ATTEMPT", actionIdentity: attemptId, operationHash: request, reservationUsd: 0 });
      await aggregateRetries.consume({ caseId: caseSlot.episodeId, actionKind: "RETRY_SLOT", actionIdentity: retryId, operationHash: request, retryOfActionIdentity: attemptId, retryReason: "PROVIDER_CONNECTION_FAILURE" });
      if (caseSlot.sequencePosition === 12) {
        await aggregateRetries.consume({ caseId: caseSlot.episodeId, actionKind: "PROVIDER_ATTEMPT", actionIdentity: "aggregate-attempt-12-retry", operationHash: request, reservationUsd: 0, retryOfActionIdentity: retryId });
        await assert.rejects(aggregateRetries.consume({ caseId: caseSlot.episodeId, actionKind: "RETRY_SLOT", actionIdentity: "aggregate-retry-over", operationHash: request, retryOfActionIdentity: "aggregate-attempt-12-retry", retryReason: "PROVIDER_TIMEOUT" }), /AGGREGATE_RETRY_SLOTS/);
      }
    }
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("provider rejection becomes an immutable safe case result with no retry and legal continuation", async () => {
  const input = await fixtures(); const temporary = await mkdtemp(path.join(os.tmpdir(), "ke-qualification-rejection-")); const runRoot = path.join(temporary, "run");
  try {
    const authority = authorityFor({ publicManifest: input.publicManifest, routeBindings: input.routeBindings, runRoot, authorityId: "offline-provider-rejection" });
    const captured = []; const successfulProvider = fakeProvider(input.controls, captured); let rejectFirst = true;
    const fetchImpl = async (url, options) => {
      if (!rejectFirst) return successfulProvider(url, options);
      rejectFirst = false; captured.push(JSON.parse(options.body));
      return new Response(JSON.stringify({ error: { type: "invalid_request_error", code: "bad_request", param: "input", message: "Rejected bounded qualification request." } }), { status: 400, headers: { "content-type": "application/json", "x-request-id": "req_safe_qualification_400" } });
    };
    const profile = await loadQualificationProviderProfile();
    const client = new QualificationResponsesClient({ profile, credentialHandle: { withCredential: async (callback) => callback("offline-test-value") }, fetchImpl });
    const result = await runBlindQualificationRealRoute({ authority, ...input, client, runRoot, clock: () => fixedTime });
    const failed = result.caseOutputs[0]; assert.equal(failed.caseStatus, "IMMUTABLE_PROVIDER_FAILURE"); assert.equal(failed.providerRequestCount, 1);
    assert.equal(failed.failureEvidence.code, "PROVIDER_REQUEST_REJECTED"); assert.equal(failed.failureEvidence.providerDiagnostics.httpStatus, 400);
    assert.equal(failed.failureEvidence.providerDiagnostics.safeProviderRequestId, "req_safe_qualification_400");
    assert.equal((await readJson(path.join(runRoot, "cases", `${failed.episodeId}.json`))).caseOutputHash, failed.caseOutputHash);
    assert.equal(result.ledgerState.retrySlots, 0); assert.equal(result.providerCounts.inferenceRequests, 111);
    assert.equal(result.caseOutputs.slice(1).every((item) => item.caseStatus === "CASE_SEALED"), true);
  } finally { await rm(temporary, { recursive: true, force: true }); }
});

test("safe diagnostics survive qualification route rejection without provider content or secrets", async () => {
  const profile = await loadQualificationProviderProfile(); const schema = createQualificationActionTransportSchema({ episodeId: "KE-P7-H01", executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), actionId: "action-ke-p7-h01-01" });
  const request = JSON.stringify(buildQualificationInferenceRequestEnvelope({ prompt: "offline", structuredSchema: schema }));
  const client = new QualificationResponsesClient({ profile, credentialHandle: { withCredential: async (callback) => callback("offline-value") }, fetchImpl: async () => new Response(JSON.stringify({ error: { type: "invalid_request_error", code: "bad_schema", param: "text.format.schema", message: "invalid schema Authorization: Bearer sk-supersecretvalue123456789" } }), { status: 400, headers: { "content-type": "application/json", "x-request-id": "req_safe_400", authorization: "Bearer forbidden" } }) });
  await assert.rejects(client.decisionTurn({ serializedRequest: request, requestHash: sha256Bytes(Buffer.from(request)), signal: new AbortController().signal }), (error) => {
    assert.ok(error instanceof SafeProviderFailure); assert.equal(error.providerDiagnostics.httpStatus, 400); assert.equal(error.providerDiagnostics.errorType, "invalid_request_error");
    assert.equal(error.providerDiagnostics.errorParam, "text.format.schema"); assert.equal(error.providerDiagnostics.safeProviderRequestId, "req_safe_400");
    assert.doesNotMatch(JSON.stringify(error.providerDiagnostics), /supersecret|authorization.*bearer|forbidden/i); return true;
  });
  assert.equal(client.counts.metadataRequests, 0); assert.equal(client.counts.inferenceRequests, 1);
});

test("broker fails closed on unauthorized source-shaped operations and malformed action values", async () => {
  const input = await fixtures(); const episode = input.publicManifest.episodes[0];
  const core = actionForTurn({ episodeId: episode.episodeId, cohort: episode.cohort, executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), visibleArtifactInventory: episode.visibleArtifactInventory, retrievedMemoryRecords: [] }, "action-forbidden", input.controls.controls[0]);
  core.details = { command: "git commit" }; const action = sealExecutiveAction(core);
  assert.throws(() => validateExecutiveAction(action, { episode, memoryIds: [], currentState: "CASE_OPEN", allowedAuthorityClasses: ["NO_NEW_AUTHORITY"] }), /free-form or prohibited action field/);
  const unsupported = createQualificationActionTransportSchema({ episodeId: episode.episodeId, executiveState: "CASE_OPEN", observedStateHash: "0".repeat(64), actionId: "action-unsupported" });
  unsupported.properties.details = { type: "object", properties: {}, required: [], additionalProperties: true };
  assert.throws(() => assertQualificationStructuredOutputsSubset(unsupported), /additionalProperties/);
});
