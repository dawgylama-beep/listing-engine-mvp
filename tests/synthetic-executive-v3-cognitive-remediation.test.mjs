import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { normalizeAndValidateProviderActionCore } from "../qualification/synthetic-executive/scripts/action-broker.mjs";
import {
  classifyDossierEvidence, classifyFailureMode, deriveFailureClass, generalContinuationPromptLines,
  GENERAL_CONTINUATION_POLICY, selectContinuation, validateContradictionInvariant
} from "../qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-policy.mjs";
import { QUALIFICATION_ROUTE } from "../qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs";
import { LIMITS } from "../qualification/synthetic-executive/qualification-real-route/scripts/v3-blind-qualification-runner.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const proof = (label) => ({ status: "PRESENT", hash: label.repeat(64).slice(0, 64) });
const dossier = (overrides = {}) => ({
  claims: [{ claimId: "fixture-bounded-scope", asserted: true }, { claimId: "fixture-exact-path", asserted: true }],
  testEvidence: [{ test: "offline", status: "PASS" }], exactPathProof: proof("a"), negativeProof: proof("b"),
  restartProof: proof("c"), contradictions: [], ...overrides
});

test("classification semantics generalize across two distinct fixtures per mode", () => {
  assert.equal(classifyFailureMode({ independentObservedOccurrences: 1, observedMechanism: "INDEX_SHIFT" }), "NOVEL");
  assert.equal(classifyFailureMode({ independentObservedOccurrences: 1, observedMechanism: "DATUM_GAP" }), "NOVEL");
  assert.equal(classifyFailureMode({ independentObservedOccurrences: 2, observedMechanism: "INDEX_SHIFT" }), "HISTORICAL");
  assert.equal(classifyFailureMode({ independentObservedOccurrences: 4, observedMechanism: "DATUM_GAP" }), "HISTORICAL");
  assert.equal(classifyFailureMode({ independentObservedOccurrences: 1, observedMechanism: "INDEX_SHIFT", selectedMemoryRecords: [{ recurrenceSignature: "INDEX_SHIFT" }] }), "RECURRENCE");
  assert.equal(classifyFailureMode({ independentObservedOccurrences: 3, observedMechanism: "DATUM_GAP", selectedMemoryRecords: [{ recurrenceSignature: "DATUM_GAP" }] }), "RECURRENCE");
  assert.equal(classifyFailureMode({ independentObservedOccurrences: 3, observedMechanism: "DATUM_GAP", selectedMemoryRecords: [{ recurrenceSignature: "UNRELATED" }] }), "HISTORICAL");
});

test("deterministic failure-class derivation is purpose-neutral", () => {
  assert.equal(deriveFailureClass({ subjectClass: "portable audio", observedMechanism: "index offset" }), "PORTABLE_AUDIO_INDEX_OFFSET");
  assert.equal(deriveFailureClass({ subjectClass: "garden sensor", observedMechanism: "datum mismatch" }), "GARDEN_SENSOR_DATUM_MISMATCH");
});

test("evidence sufficiency distinguishes proven, bounded, insufficient, and contradictory dossiers", () => {
  assert.equal(classifyDossierEvidence(dossier()), "VALID_PASS");
  assert.equal(classifyDossierEvidence(dossier({ negativeProof: null })), "BOUNDED_FAIL");
  assert.equal(classifyDossierEvidence(dossier({ restartProof: null })), "BOUNDED_FAIL");
  assert.equal(classifyDossierEvidence(dossier({ exactPathProof: null, negativeProof: null, restartProof: null })), "INSUFFICIENT_EVIDENCE");
  assert.equal(classifyDossierEvidence(dossier({ claims: [], exactPathProof: null })), "INSUFFICIENT_EVIDENCE");
  assert.equal(classifyDossierEvidence(dossier({ contradictions: ["readback conflicts with the completion marker"] })), "ARCHITECTURAL_FAIL");
  assert.equal(classifyDossierEvidence(dossier({ contradictions: ["custody record conflicts with the claimed origin"], negativeProof: null })), "ARCHITECTURAL_FAIL");
});

test("continuation policy supports investigation, human escalation, safe stopping, rejection, and advancement", () => {
  assert.equal(selectContinuation({ dossierClassification: "VALID_PASS" }), "ADVANCE_WITHIN_EXISTING_AUTHORITY");
  assert.equal(selectContinuation({ dossierClassification: "ARCHITECTURAL_FAIL" }), "REJECT_RETURNED_EVIDENCE");
  assert.equal(selectContinuation({ dossierClassification: "BOUNDED_FAIL", boundedProofReachable: true }), "REQUEST_BOUNDED_ENGINEERING_AUTHORITY");
  assert.equal(selectContinuation({ dossierClassification: "INSUFFICIENT_EVIDENCE", humanJudgmentRequired: true }), "REQUEST_EXCEPTIONAL_HUMAN_AUTHORITY");
  assert.equal(selectContinuation({ dossierClassification: "INSUFFICIENT_EVIDENCE", novelFailure: true }), "STOP_NOVEL_FAILURE");
  assert.equal(selectContinuation({ dossierClassification: "INSUFFICIENT_EVIDENCE" }), "STOP_INSUFFICIENT_EVIDENCE");
});

test("unresolved contradictions remain visible and block false pass or advance", () => {
  const workerDossier = { contradictions: ["independent observations disagree"] };
  assert.throws(() => validateContradictionInvariant({ action: { actionType: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", details: { classification: "VALID_PASS" }, uncertainties: ["conflict remains"] }, workerDossier }), /COGNITIVE_CONTRADICTION_FALSE_PASS/);
  assert.throws(() => validateContradictionInvariant({ action: { actionType: "SELECT_NEXT_LEGAL_ACTION", details: { selection: "ADVANCE_WITHIN_EXISTING_AUTHORITY" }, uncertainties: ["conflict remains"] }, workerDossier }), /COGNITIVE_CONTRADICTION_UNSAFE_ADVANCE/);
  assert.throws(() => validateContradictionInvariant({ action: { actionType: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", details: { classification: "ARCHITECTURAL_FAIL" }, uncertainties: [] }, workerDossier }), /COGNITIVE_CONTRADICTION_NOT_VISIBLE/);
  assert.equal(validateContradictionInvariant({ action: { actionType: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", details: { classification: "ARCHITECTURAL_FAIL" }, uncertainties: ["conflict remains"] }, workerDossier }).contradictionCount, 1);
  assert.equal(validateContradictionInvariant({ action: { actionType: "SELECT_NEXT_LEGAL_ACTION", details: { selection: "REJECT_RETURNED_EVIDENCE" }, uncertainties: ["conflict remains"] }, workerDossier }).contradictionCount, 1);
});

test("resolved contradiction no longer blocks a supported pass", () => {
  assert.equal(validateContradictionInvariant({ action: { actionType: "EVALUATE_RETURNED_ENGINEERING_EVIDENCE", details: { classification: "VALID_PASS" }, uncertainties: [] }, workerDossier: { contradictions: [] } }).valid, true);
});

test("schema-invalid model action fails deterministically before execution", () => {
  assert.throws(() => normalizeAndValidateProviderActionCore({ decision: {} }, { episode: { episodeId: "neutral-case", visibleArtifactInventory: [] }, currentState: "CASE_OPEN", memoryIds: [], allowedAuthorityClasses: ["NO_NEW_AUTHORITY"] }));
});

test("runtime cognitive text is compact, purpose-neutral, and free of V2 case identities", async () => {
  const lines = generalContinuationPromptLines(); assert.equal(lines.length, 6); assert.ok(lines.some((line) => line.includes("current action")));
  const paths = [
    "qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-policy.mjs",
    "qualification/synthetic-executive/qualification-real-route/general-continuation-policy.json"
  ];
  for (const relativePath of paths) {
    const source = await readFile(path.join(repositoryRoot, relativePath), "utf8");
    assert.doesNotMatch(source, /KE-V2-C(?:0[1-9]|1[0-4])/); assert.doesNotMatch(source, /TIDAL_GAUGE|HERBARIUM|PLANETARIUM|CORAL|GLACIER|WETLAND|MARSH/i);
  }
  assert.equal(GENERAL_CONTINUATION_POLICY.compactActionRule, "ONE_ACTION_ONLY_MINIMUM_FACTS_MINIMUM_UNCERTAINTIES_NO_RESTATED_TRANSCRIPT");
});

test("frozen route and ceilings remain unchanged", () => {
  assert.deepEqual({ endpoint: QUALIFICATION_ROUTE.endpoint, model: QUALIFICATION_ROUTE.model, reasoning: QUALIFICATION_ROUTE.reasoningEffort, store: QUALIFICATION_ROUTE.store, output: QUALIFICATION_ROUTE.maximumOutputTokens, request: QUALIFICATION_ROUTE.maximumSerializedRequestBytes }, { endpoint: "v1/responses", model: "gpt-5.6-sol", reasoning: "medium", store: false, output: 2000, request: 64000 });
  assert.deepEqual(LIMITS.perCase, { maximumReasoningSteps: 12, maximumToolActions: 20, maximumFakeDossierActions: 1, maximumRetryAttempts: 2, maximumWallClockMs: 600000, maximumProviderCostUsd: 1.25 });
  assert.deepEqual(LIMITS.aggregate, { maximumReasoningSteps: 168, maximumToolActions: 280, maximumFakeDossierActions: 14, maximumRetryAttempts: 28, maximumWallClockMs: 8400000, maximumProviderCostUsd: 17.5 });
});
