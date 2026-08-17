import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const repositoryRoot = new URL("../", import.meta.url);
const newSourceAndFixturePaths = Object.freeze([
  "lib/cognitive-governor/mentor-guided-reasoning.js",
  "qualification/synthetic-executive/future-independent-qualification-contract/atomic-scorer.mjs",
  "qualification/synthetic-executive/future-independent-qualification-contract/execution-envelope.mjs",
  "qualification/synthetic-executive/future-independent-qualification-contract/capture-boundary-proof.mjs",
  "qualification/synthetic-executive/future-independent-qualification-contract/contract.json",
  "qualification/synthetic-executive/future-independent-qualification-contract/version-1.12.37-remediation-specification.json",
  "tests/fixtures/version-1.12.37-mentor-remediation.mjs",
  "tests/fixtures/version-1.12.37-atomic-scorer-fixtures.mjs",
  "tests/version-1.12.37-mentor-remediation.test.mjs",
  "tests/version-1.12.37-atomic-scorer.test.mjs",
  "tests/version-1.12.37-mutation-proof.test.mjs",
  "tests/version-1.12.37-execution-envelope.test.mjs",
  "tests/version-1.12.37-mentor-integration.test.mjs"
]);

function git(...args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }).trim();
}

test("new source and fixtures contain no prior qualification case identifiers or executable closed-corpus binding", async () => {
  for (const relativePath of newSourceAndFixturePaths) {
    const source = await readFile(new URL(relativePath, repositoryRoot), "utf8");
    assert.doesNotMatch(source, /\b(?:V2|V3|V4)-C\d+\b|\bKE-V[23]-C\d+\b/i, relativePath);
    assert.doesNotMatch(source, /v4-independent-qualification-(?:corpus|run-001)/i, relativePath);
  }
  for (const executablePath of [
    "qualification/synthetic-executive/future-independent-qualification-contract/atomic-scorer.mjs",
    "qualification/synthetic-executive/future-independent-qualification-contract/execution-envelope.mjs",
    "qualification/synthetic-executive/future-independent-qualification-contract/capture-boundary-proof.mjs"
  ]) {
    const source = await readFile(new URL(executablePath, repositoryRoot), "utf8");
    assert.doesNotMatch(source, /v2|v3|v4|held-out|qualification-run-001|evaluator-package/i, executablePath);
  }
});

test("frozen diagnostic evidence and the product handler have no working-tree changes", () => {
  assert.equal(git("diff", "--name-only", "HEAD", "--", "api/generate-listing.js"), "");
  assert.equal(git(
    "diff",
    "--name-only",
    "HEAD",
    "--",
    "qualification/synthetic-executive/v4-independent-qualification-corpus",
    "qualification/synthetic-executive/v4-independent-qualification-run-001"
  ), "");
});

test("the future contract declares no case count, answer key, identifier, or domain logic", async () => {
  const contract = JSON.parse(await readFile(
    new URL("qualification/synthetic-executive/future-independent-qualification-contract/contract.json", repositoryRoot),
    "utf8"
  ));
  assert.deepEqual(contract.corpusAgnosticConstraints, {
    caseCountSpecified: false,
    expectedAnswersSpecified: false,
    caseIdentifiersSpecified: false,
    domainSpecificLogicSpecified: false
  });
});
