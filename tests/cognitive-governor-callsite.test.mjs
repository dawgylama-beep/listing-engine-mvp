import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8");

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
});

test("every Governor-controlled provider path binds durable ownership before its adapter call", () => {
  assert.match(source, /bindGovernorProviderRequest\(cognitiveGovernor, governorAuthorization,[\s\S]{0,500}requestOpenAIComparableSearchWithBudget/);
  assert.match(source, /bindGovernorProviderRequest\(cognitiveGovernor, authorization, requestRecord,[\s\S]{0,2500}requestSerperSearchWithBudget/);
  assert.match(source, /providerPhase: "LIMITED_RESULT_RECOVERY"[\s\S]{0,2500}requestSerperSearchWithBudget/);
  assert.match(source, /providerPhase: "DIRECT_PAGE_VERIFICATION"[\s\S]{0,700}return requestAdapter/);
  assert.match(source, /parentGovernorActionSignature/);
  assert.match(source, /logicalProviderRequestIdentity/);
});
