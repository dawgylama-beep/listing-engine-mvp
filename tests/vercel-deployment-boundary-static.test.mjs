import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const repositoryRoot = path.resolve(import.meta.dirname, "..");
const boundaryRule = "/benchmarks/blind-object-v1-results/";

function normalizeSyntheticPath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
}

function rootedDirectoryRuleExcludes(rule, syntheticPath) {
  const root = normalizeSyntheticPath(rule);
  const candidate = normalizeSyntheticPath(syntheticPath);
  return candidate === root || candidate.startsWith(`${root}/`);
}

test("Vercel source packaging excludes the prohibited root and every synthetic descendant", async () => {
  const ignoreText = await readFile(path.join(repositoryRoot, ".vercelignore"), "utf8");
  const activeRules = ignoreText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  assert.equal(activeRules.filter((rule) => rule === boundaryRule).length, 1);
  assert.equal(rootedDirectoryRuleExcludes(boundaryRule, "benchmarks/blind-object-v1-results"), true);
  assert.equal(rootedDirectoryRuleExcludes(boundaryRule, "benchmarks/blind-object-v1-results/arbitrary.json"), true);
  assert.equal(rootedDirectoryRuleExcludes(boundaryRule, "benchmarks/blind-object-v1-results/nested/deep/evidence.bin"), true);
  assert.equal(rootedDirectoryRuleExcludes(boundaryRule, "benchmarks/blind-object-v1-results-adjacent"), false);
  assert.equal(rootedDirectoryRuleExcludes(boundaryRule, "benchmarks/blind-object-v2-results/example.json"), false);
});
