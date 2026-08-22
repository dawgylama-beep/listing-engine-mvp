import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  V5_PROVIDER_ANALYSIS_SCHEMA,
  assertMechanicalRetryReason,
  assertRequestAuthority,
  buildCaseRequest,
  createV5PurposeNeutralExecutiveState
} from "../qualification/synthetic-executive/v5-qualification-route/execute-core.mjs";
import {
  CASE_IDS,
  EXECUTION_LIMITS,
  PACKAGE_IDENTITIES,
  ROUTE_VERSION,
  inspectPackageIdentities
} from "../qualification/synthetic-executive/v5-qualification-route/shared.mjs";
import { materializeV5ProviderVisibleCase } from "../qualification/synthetic-executive/v5-held-out-corpus/scripts/v5-visible-assembler.mjs";
import { absoluteFromCorpus, readJson } from "../qualification/synthetic-executive/v5-held-out-corpus/scripts/v5-package-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function runtimeVisibleCase(caseId) {
  const assembled = await materializeV5ProviderVisibleCase(caseId);
  const manifest = await readJson(absoluteFromCorpus("public", "cases", caseId, "manifest.json"));
  const byIdentity = new Map(assembled.materialization.artifacts.map((item) => [item.artifactId, item]));
  return {
    caseId,
    order: manifest.order,
    authorizedCapabilities: manifest.authorizedCapabilities,
    knowledgeCutoffIdentity: manifest.knowledgeCutoffIdentity,
    visibleAggregate: manifest.visibleAggregate,
    manifestSha256: "offline-projection-test",
    visibleArtifacts: manifest.visibleInventory.map((item) => ({
      artifactId: item.artifactId,
      relativePath: item.relativePath,
      sha256: item.sha256,
      bytes: item.bytes,
      content: JSON.parse(byIdentity.get(item.artifactId).contentUtf8)
    }))
  };
}

test("V5 sealed request envelope is public-only and bounded", async () => {
  assert.equal(ROUTE_VERSION, "1.12.43");
  assert.deepEqual(CASE_IDS, Array.from({ length: 14 }, (_, index) => `KE-V5-C${String(index + 1).padStart(2, "0")}`));
  assert.deepEqual(Object.fromEntries(Object.entries(await inspectPackageIdentities()).filter(([key]) => key in PACKAGE_IDENTITIES)), PACKAGE_IDENTITIES);
  assert.equal(EXECUTION_LIMITS.model, "gpt-5.6-sol");
  assert.equal(EXECUTION_LIMITS.reasoningEffort, "medium");
  assert.equal(EXECUTION_LIMITS.store, false);
  assert.equal(EXECUTION_LIMITS.caseSlots, 14);
  assert.equal(EXECUTION_LIMITS.maximumOutputTokensPerCase, 4_000);
  assert.equal(EXECUTION_LIMITS.totalCostCeilingUsd, 12);
  assert.equal(V5_PROVIDER_ANALYSIS_SCHEMA.properties.rationale.maxLength, 512);

  for (const caseId of CASE_IDS) {
    const request = await buildCaseRequest(caseId);
    const envelope = JSON.parse(request.serializedRequest);
    assert.equal(envelope.model, "gpt-5.6-sol");
    assert.equal(envelope.store, false);
    assert.equal(envelope.max_output_tokens, 4_000);
    assert.ok(request.requestBytes < 64_000);
    const serialized = request.serializedRequest;
    for (const forbidden of ["expectedResponse", "safetyCritical", "minimumPassingChecks", "FOUNDATIONAL_SOURCE", "HELD_OUT_ANALOGUE", "GENUINELY_NOVEL_OR_INSUFFICIENT"]) {
      assert.equal(serialized.includes(forbidden), false);
    }
  }
});

test("V5 public state projection derives evidence, authority, cycle, and duplicate boundaries", async () => {
  const states = {};
  for (const caseId of ["KE-V5-C04", "KE-V5-C05", "KE-V5-C06", "KE-V5-C13"]) {
    states[caseId] = createV5PurposeNeutralExecutiveState(await runtimeVisibleCase(caseId));
  }
  assert.equal(states["KE-V5-C04"].evidenceCondition, "INSUFFICIENT");
  assert.equal(states["KE-V5-C05"].cycleDetected, true);
  assert.equal(states["KE-V5-C06"].duplicateDetected, true);
  assert.equal(states["KE-V5-C13"].authorityClass, "NEW_REQUIRED");
});

test("V5 route fails closed on budget and retry expansion", () => {
  assert.throws(() => assertRequestAuthority({ requestBytes: 64_001, outputTokens: 4_000, reservationUsd: 1, priorReservedUsd: 0 }), /REQUEST_BYTE_CEILING_EXCEEDED/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_001, reservationUsd: 1, priorReservedUsd: 0 }), /OUTPUT_TOKEN_CEILING_EXCEEDED/);
  assert.throws(() => assertRequestAuthority({ requestBytes: 1, outputTokens: 4_000, reservationUsd: 1, priorReservedUsd: 11.1 }), /TOTAL_COST_CEILING_EXCEEDED/);
  assert.equal(assertMechanicalRetryReason("PROVIDER_TIMEOUT"), true);
  assert.throws(() => assertMechanicalRetryReason("RESPONSE_QUALITY"), /MECHANICAL_RETRY_REASON_FORBIDDEN/);
});

test("V5 execution cannot import evaluator controls or grant provider lifecycle authority", async () => {
  const execution = await readFile(path.join(root, "qualification", "synthetic-executive", "v5-qualification-route", "execute-core.mjs"), "utf8");
  const preparation = await readFile(path.join(root, "qualification", "synthetic-executive", "v5-qualification-route", "prepare-core.mjs"), "utf8");
  assert.doesNotMatch(execution, /evaluator\/control\.json|scoring\/evidence\.json|cohort-transfer-map/);
  assert.doesNotMatch(preparation, /evaluator\/control\.json|scoring\/evidence\.json|cohort-transfer-map/);
  assert.match(execution, /new GovernedLearningAdapter/);
  assert.match(execution, /learningMode:\s*"PRODUCT"/);
  assert.match(execution, /providerLifecycleAuthority:\s*false/);
  assert.doesNotMatch(execution, /providerAnalysis[^\n]*(qualifyCandidate|promoteCandidate|recordApplication)/);
});
