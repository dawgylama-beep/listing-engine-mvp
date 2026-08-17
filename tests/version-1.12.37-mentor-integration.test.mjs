import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const apiSource = await readFile(new URL("../api/generate-listing.js", import.meta.url), "utf8");
const policySource = await readFile(new URL("../lib/cognitive-governor/policy.js", import.meta.url), "utf8");
const mentorSource = await readFile(new URL("../lib/cognitive-governor/mentor-guided-reasoning.js", import.meta.url), "utf8");

test("the product route continues through the single governor and updated mentor assertion", () => {
  assert.match(apiSource, /createCognitiveGovernor/);
  assert.match(apiSource, /decideCognitiveAction/);
  assert.match(policySource, /import \{ assertMentorGuidedDecisionAssembly \} from "\.\/mentor-guided-reasoning\.js"/);
  assert.match(policySource, /assertMentorGuidedDecisionAssembly\(\{ state, candidates: boundaryCandidates, selected, boundary \}\)/);
  assert.match(mentorSource, /evaluateMentorDecisionContract/);
  assert.match(mentorSource, /MENTOR_DECISION_SMALLEST_ACTION_MISMATCH/);
});

test("the mentor remains local, deterministic, non-persistent, and provider-free", () => {
  assert.doesNotMatch(mentorSource, /fetch\s*\(|requestOpenAI|providerRequest|child_process|node:fs|writeFile|appendFile|new\s+Agent/i);
  assert.doesNotMatch(policySource, /future-independent-qualification-contract|atomic-scorer|execution-envelope/);
});
