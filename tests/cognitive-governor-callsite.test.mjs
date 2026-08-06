import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8");
const policySource = await readFile(new URL("../lib/cognitive-governor/policy.js", import.meta.url), "utf8");
const authorizationSource = await readFile(new URL("../lib/cognitive-governor/authorization.js", import.meta.url), "utf8");
const terminalSource = await readFile(new URL("../lib/terminal-evidence.js", import.meta.url), "utf8");

function occurrences(text, pattern) {
  return [...text.matchAll(pattern)].length;
}

test("Governor construction and authoritative-state initialization have one canonical production boundary", () => {
  assert.equal(occurrences(source, /\bcreateGovernorExecutionLedger\(/g), 1);
  assert.equal(occurrences(source, /\bcreateCognitiveGovernor\(/g), 1);
  assert.equal(occurrences(policySource, /\brecordGovernorConstruction\(/g), 1);
  assert.equal(occurrences(policySource, /\bregisterAuthoritativeCognitiveState\(/g), 1);
  assert.equal(occurrences(authorizationSource, /export function recordGovernorConstruction\(/g), 1);
  assert.equal(occurrences(authorizationSource, /export function registerAuthoritativeCognitiveState\(/g), 1);
  assert.match(policySource, /const construction = recordGovernorConstruction\(ledger, \{ evaluationId \}\)/);
  assert.match(policySource, /registerAuthoritativeCognitiveState\(governor, state\)/);
});

test("every production controlled phase is routed through the canonical Governor boundary", () => {
  const parentPhases = [
    "INITIAL_PROVIDER_ACQUISITION",
    "REFINEMENT_PROVIDER_SEARCH",
    "DIRECT_PAGE_VERIFICATION",
    "CUSTOMER_INPUT_TRANSITION",
    "CANONICAL_EVIDENCE_FINALIZATION",
    "PURPOSE_JUDGMENT",
    "TERMINAL_STOP_TRANSITION"
  ];
  for (const phase of parentPhases) {
    assert.match(source, new RegExp(`executeGovernorAuthorizedAction[\\s\\S]{0,600}operationPhase: \\"${phase}\\"`), phase);
  }
  for (const phase of ["PROVIDER_FALLBACK", "LIMITED_RESULT_RECOVERY"]) {
    assert.match(source, new RegExp(`executeGovernorAuthorizedChildOperation[\\s\\S]{0,600}operationPhase: \\"${phase}\\"`), phase);
  }
  assert.match(source, /eligibleParentActionTypes:\s*\[\s*COGNITIVE_ACTION\.ACQUIRE_INITIAL_EVIDENCE,\s*COGNITIVE_ACTION\.REFINE_EVIDENCE_SEARCH\s*\]/);
  assert.equal(occurrences(source, /\bexecuteGovernorAuthorizedAction\(/g), 9);
  assert.equal(occurrences(source, /\bexecuteGovernorAuthorizedChildOperation\(/g), 2);
});

test("every Governor-controlled provider path binds durable ownership before its adapter call", () => {
  assert.match(source, /bindGovernorProviderRequest\(cognitiveGovernor, governorAuthorization,[\s\S]{0,500}requestOpenAIComparableSearchWithBudget/);
  assert.match(source, /bindGovernorProviderRequest\(cognitiveGovernor, authorization, requestRecord,[\s\S]{0,2500}requestSerperSearchWithBudget/);
  assert.match(source, /providerPhase: "LIMITED_RESULT_RECOVERY"[\s\S]{0,2500}requestSerperSearchWithBudget/);
  assert.match(source, /providerPhase: "DIRECT_PAGE_VERIFICATION"[\s\S]{0,700}return requestAdapter/);
  assert.match(source, /parentGovernorActionSignature/);
  assert.match(source, /logicalProviderRequestIdentity/);
  assert.equal(occurrences(source, /\bbindGovernorProviderRequest\(/g), 5);
  assert.equal(occurrences(source, /\bassertGovernorProviderRequestOwnership\(/g), 5);
});

test("one terminal observer covers every risky production stage and the only handler catch", () => {
  for (const stage of [
    "REQUEST_ACCEPTED",
    "INPUT_VALIDATION",
    "OBJECT_OBSERVATION",
    "IDENTITY_FORMATION",
    "GOVERNOR_CONSTRUCTION",
    "AUTHORITATIVE_STATE_INITIALIZATION",
    "INITIAL_ACQUISITION",
    "REFINEMENT",
    "DIRECT_PAGE_VERIFICATION",
    "CUSTOMER_INPUT_TRANSITION",
    "CANONICAL_EVIDENCE_FINALIZATION",
    "PURPOSE_JUDGMENT",
    "EXPERIENCE_RECORD_SEALING",
    "COGNITIVE_EPISODE_PROOF",
    "RESPONSE_EMISSION"
  ]) {
    assert.match(source, new RegExp(`TERMINAL_STAGE\\.${stage}`), stage);
    assert.match(terminalSource, new RegExp(`${stage}: \\"${stage}\\"`), stage);
  }
  assert.equal(occurrences(source, /\bcreateEvaluationTerminalContext\(/g), 1);
  assert.equal(occurrences(source, /\bbuildFailureEnvelope\(/g), 1);
  assert.equal(occurrences(source, /\bsealExperienceRecord\(/g), 1);
  assert.equal(occurrences(source, /\bassertFinalExperienceAttestation\(/g), 1);
  assert.equal(occurrences(source, /\bbuildExperienceRecord\(/g), 1);
  assert.equal(occurrences(source, /\bbuildCognitiveEpisode\(/g), 1);
  assert.equal(occurrences(source, /\bbuildGovernorExecutionProof\(/g), 1);
  assert.equal(occurrences(source, /async function handleGenerateListingRequest[\s\S]*?\n}\n/g), 1);
  assert.match(source, /catch \(error\) \{[\s\S]{0,700}buildFailureEnvelope\(currentEvaluationTerminalContext\(\), error/);
  assert.match(source, /const experienceRecord = assembledExperienceRecord \? sealExperienceRecord\(assembledExperienceRecord\) : null;[\s\S]{0,1800}experienceRecord/);
});
