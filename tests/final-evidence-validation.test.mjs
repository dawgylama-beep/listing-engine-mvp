import assert from "node:assert/strict";
import test from "node:test";
import {
  createFinalEvidenceResult,
  validateFinalEvidenceResult
} from "../lib/evidence/index.js";
import {
  collectibleLimitedEvidenceFixture,
  priceConflictFixture
} from "./fixtures/production-shaped-evidence.mjs";

test("validates collectible limited-evidence result and diagnostic traceability", () => {
  const result = createFinalEvidenceResult({
    analysisId: "collectible-validation",
    analysisMode: "collectible",
    targetIdentity: collectibleLimitedEvidenceFixture.targetIdentity,
    observations: collectibleLimitedEvidenceFixture.observations,
    displayLimit: 3,
    askingPrice: 10
  });
  assert.equal(validateFinalEvidenceResult(result), result);
  assert(result.views.exactMatchIds.length >= 1);
  assert(result.views.rejectedDiagnosticOnlyIds.length >= 1);
  assert.deepEqual(result.diagnostics.finalizedCustomerRecordIds, result.views.customerEligibleIds);
});

test("validates resolved and unresolved same-offer price conflicts", () => {
  const resolved = createFinalEvidenceResult({
    analysisMode: "retail",
    targetIdentity: priceConflictFixture.targetIdentity,
    observations: priceConflictFixture.resolved
  });
  validateFinalEvidenceResult(resolved);
  assert.equal(resolved.views.acceptedIds.length, 1);
  assert.equal(resolved.acceptedRecords[0].price, 4.99);
  assert.equal(resolved.acceptedRecords[0].observationIds.length, 2);

  const unresolved = createFinalEvidenceResult({
    analysisMode: "retail",
    targetIdentity: priceConflictFixture.targetIdentity,
    observations: priceConflictFixture.unresolved
  });
  validateFinalEvidenceResult(unresolved);
  assert.equal(unresolved.views.acceptedIds.length, 1);
  assert.equal(unresolved.acceptedRecords[0].displayedPrice, "Price unavailable");
  assert.equal(unresolved.acceptedRecords[0].priceConflict.status, "unresolved");
});

test("reports the exact offending invariant and ID", () => {
  const result = createFinalEvidenceResult({
    analysisMode: "retail",
    targetIdentity: priceConflictFixture.targetIdentity,
    observations: priceConflictFixture.resolved
  });
  result.views.displayedIds.push("unknown-evidence-id");
  result.counts.displayedCount += 1;
  assert.throws(
    () => validateFinalEvidenceResult(result),
    /view displayedIds contains unknown ID unknown-evidence-id/
  );
});

test("rejects secret-bearing fields, environment values, and non-serializable values", () => {
  const result = createFinalEvidenceResult({
    analysisMode: "retail",
    targetIdentity: priceConflictFixture.targetIdentity,
    observations: priceConflictFixture.resolved
  });
  result.providerApiKey = "sanitized-placeholder-value";
  assert.throws(
    () => validateFinalEvidenceResult(result),
    /providerApiKey is a secret-bearing field/
  );
  delete result.providerApiKey;
  result.runtimeEnvironment = { SAMPLE: "sanitized" };
  assert.throws(
    () => validateFinalEvidenceResult(result),
    /runtimeEnvironment is a secret-bearing field/
  );
  delete result.runtimeEnvironment;
  result.unsupportedValue = 1n;
  assert.throws(
    () => validateFinalEvidenceResult(result),
    /result is not serializable/
  );
});
