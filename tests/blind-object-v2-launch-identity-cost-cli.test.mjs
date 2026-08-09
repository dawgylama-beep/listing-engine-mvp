import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";
import {
  CONSENT_STATUS,
  EXECUTOR_VERSION,
  calculateCompleteAttemptCeiling,
  conservativeMaximumCost,
  createCostLedger,
  createExecutionConsent,
  createExecutionProfile,
  createInvocationReservation,
  createPricingProfile,
  recordRequestCost,
  transitionConsent,
  validateCostLedger,
  validateExecutionConsent,
  validatePricingProfile
} from "../benchmarks/blind-object-v2/scripts/execution-protocol.mjs";
import {
  COST_STATE,
  OPENAI_WEB_SEARCH_CONTENT_INPUT_TOKENS,
  calculateGpt41MiniHighDetailImageTokens,
  createSourceGroundedCostEnvelope,
  resolveOutputTokenCeiling,
  validateCostEnvelope
} from "../benchmarks/blind-object-v2/scripts/cost-envelope.mjs";
import {
  assertNoTruncatedIdentityCollision,
  createLaunchScope,
  deriveLaunchIdentities,
  validateLaunchScope
} from "../benchmarks/blind-object-v2/scripts/launch-identity.mjs";
import { parseAuthorizedExecutionArguments } from "../benchmarks/blind-object-v2/scripts/run-authorized-execution.mjs";
import {
  assertNoRealAuthorityArtifacts,
  defaultFreezeRoot,
  deriveResultRoot,
  loadPublicFreeze
} from "../benchmarks/blind-object-v2/scripts/execution-store.mjs";
import { createSyntheticAuthority } from "../benchmarks/blind-object-v2/scripts/synthetic-authority.mjs";

const HASH = "5eea6b23de0985ffbc9946ac86fbc91c1c2cefd59edbbd5a913080fb77015699";
const AT = "2026-08-08T12:00:00.000Z";

function launchInput(scope) {
  const input = structuredClone(scope);
  delete input.launchScopeHash;
  delete input.schemaVersion;
  delete input.scopeType;
  return input;
}

function changedScope(scope, changes) {
  return createLaunchScope({ ...launchInput(scope), ...changes });
}

function releaseIdentity(profile) {
  return {
    executorRuntimeHead: profile.executorRuntimeHead,
    qualificationHead: profile.qualificationHead,
    executorRuntimeTreeHash: profile.executorRuntimeTreeHash,
    executionReleaseRecordHash: profile.executionReleaseRecordHash,
    qualificationPolicyVersion: profile.qualificationPolicyVersion
  };
}

function exactPricing(exactModel = "gpt-4.1-mini", overrides = {}) {
  return createPricingProfile({
    provider: "OPENAI",
    exactModel,
    effectiveDate: "2026-08-08",
    pricingSourceDescription: "User-authorized verified pricing effective 2026-08-08 for deterministic offline tests.",
    inputTokenRatePerMillion: 0.4,
    cachedInputTokenRatePerMillion: 0.1,
    outputTokenRatePerMillion: 1.6,
    webSearchCallRate: 0.01,
    serperSearchCallRate: null,
    directPageCostAssumption: 0,
    conservativeUncertaintyMargin: 0.2,
    createdAt: AT,
    ...overrides
  });
}

const frozen = await loadPublicFreeze(defaultFreezeRoot);
const authority = await createSyntheticAuthority(frozen, "launch-cost-cli");

test("A-B: key-order-equivalent scopes keep one hash while every domain identity stays separated", () => {
  const reversed = Object.fromEntries(Object.entries(launchInput(authority.launchScope)).reverse());
  const equivalent = createLaunchScope(reversed);
  assert.equal(equivalent.launchScopeHash, authority.launchScope.launchScopeHash);
  assert.deepEqual(deriveLaunchIdentities(equivalent), deriveLaunchIdentities(authority.launchScope));
  const identities = deriveLaunchIdentities(authority.launchScope);
  assert.equal(new Set([identities.consentId, identities.invocationId, identities.reservationId, identities.resultId, identities.resultRootName]).size, 5);
});

test("C-E: release, freeze, request, execution, pricing, cost, network, and authorization drift changes every derived ID", () => {
  const baseIds = deriveLaunchIdentities(authority.launchScope);
  const fields = [
    ["productSourceHead", "1".repeat(40)], ["productSourceVersion", "9.9.9"], ["executorRuntimeHead", "2".repeat(40)],
    ["productCostSourceManifestHash", "1".repeat(64)],
    ["qualificationHead", "3".repeat(40)], ["executorRuntimeTreeHash", "4".repeat(40)], ["executionReleaseRecordHash", "2".repeat(64)],
    ["qualificationPolicyVersion", "2.0"], ["executorVersion", "9.9.8"],
    ["completeFrozenAggregateHash", "3".repeat(64)], ["freezeManifestHash", "4".repeat(64)], ["freezeReceiptHash", "5".repeat(64)],
    ["requestAggregateHash", "6".repeat(64)], ["exactModelLiteral", "gpt-4.1-mini-variant"], ["pricingProfileIdentityHash", "7".repeat(64)],
    ["costEnvelopeHash", "8".repeat(64)], ["maximumAuthorizedCostMinorUnits", 3999], ["networkPolicyHash", "9".repeat(64)]
  ];
  const changedRequestInventory = [...authority.launchScope.orderedRequestHashInventory];
  changedRequestInventory[0] = "a".repeat(64);
  fields.push(["orderedRequestHashInventory", changedRequestInventory]);
  for (const [field, value] of fields) {
    const ids = deriveLaunchIdentities(changedScope(authority.launchScope, { [field]: value }));
    for (const name of ["consentId", "invocationId", "reservationId", "resultId", "resultRootName"]) assert.notEqual(ids[name], baseIds[name], `${field} did not change ${name}`);
  }
  assert.throws(() => changedScope(authority.launchScope, { scoringAuthorized: true }), /true !== false/);
});

test("F: resolvedAt, createdAt, audit descriptions, host values, and local paths cannot destabilize launch identity", () => {
  const firstProfile = createExecutionProfile({
    productRuntimeManifestHash: authority.profile.productRuntimeManifestHash,
    ...releaseIdentity(authority.profile),
    model: authority.profile.exactModelLiteral,
    acquisitionProviderMode: authority.profile.acquisitionProviderMode,
    credentialPresence: authority.profile.credentialPresenceDeclarations,
    attemptCeiling: authority.attemptCeiling,
    resolvedAt: AT
  });
  const secondProfile = createExecutionProfile({
    productRuntimeManifestHash: authority.profile.productRuntimeManifestHash,
    ...releaseIdentity(authority.profile),
    model: authority.profile.exactModelLiteral,
    acquisitionProviderMode: authority.profile.acquisitionProviderMode,
    credentialPresence: authority.profile.credentialPresenceDeclarations,
    attemptCeiling: authority.attemptCeiling,
    resolvedAt: "2026-08-09T12:00:00.000Z"
  });
  assert.equal(firstProfile.executionProfileIdentityHash, secondProfile.executionProfileIdentityHash);
  assert.notEqual(firstProfile.profileHash, secondProfile.profileHash);
  const firstPricing = exactPricing();
  const secondPricing = exactPricing("gpt-4.1-mini", { createdAt: "2026-08-09T12:00:00.000Z", pricingSourceDescription: "A different separately sealed audit description that does not select launch authority." });
  assert.equal(firstPricing.pricingProfileIdentityHash, secondPricing.pricingProfileIdentityHash);
  assert.notEqual(firstPricing.pricingProfileHash, secondPricing.pricingProfileHash);
  for (const volatile of ["resolvedAt", "createdAt", "temporaryPath", "hostName", "processId", "operatorText"]) {
    assert.throws(() => createLaunchScope({ ...launchInput(authority.launchScope), [volatile]: volatile }), /fields differ|volatile/);
  }
});

test("G-I: caller IDs and unsafe result paths fail, collisions fail closed, and derived roots stay direct children", () => {
  assert.throws(() => createExecutionConsent({ launchScope: authority.launchScope, costEnvelope: authority.costEnvelope, consentId: "consent-caller" }, AT), /fields differ/);
  assert.throws(() => createInvocationReservation({ launchScope: authority.launchScope, consent: authority.consent, executionProfileHash: authority.profile.profileHash, pricingProfileHash: authority.pricingProfile.pricingProfileHash, createdIdentity: "executor-synthetic", resultId: "result-caller" }, AT), /fields differ/);
  const ids = deriveLaunchIdentities(authority.launchScope);
  assert.throws(() => assertNoTruncatedIdentityCollision({ consentId: ids.consentId, launchScopeHash: "1".repeat(64) }, { consentId: ids.consentId, launchScopeHash: "2".repeat(64) }, "consentId"), /collision/);
  const root = deriveResultRoot("C:/fixed-result-history", ids.resultRootName);
  assert.equal(path.dirname(root), path.resolve("C:/fixed-result-history"));
  for (const unsafe of ["../escape", "C:ads", "con", "/absolute", "result/root"]) assert.throws(() => deriveResultRoot("C:/fixed-result-history", unsafe), /safe repository-owned identity|path operator/);
});

test("J-L: old generic 360000/6000 reservation is reproduced while the new category inventory has no double charge", () => {
  const oldPricing = exactPricing();
  assert.equal(conservativeMaximumCost(authority.attemptCeiling, oldPricing, "OPENAI_WEB_SEARCH_ONLY"), 152.5056);
  assert.deepEqual(authority.costEnvelope.billableCategories.map((record) => record.category).sort(), [
    "DIRECT_PAGE_RETRIEVAL", "FINAL_PURPOSE_MODEL", "OBJECT_IDENTITY_MODEL", "OPENAI_WEB_SEARCH", "SERPER_SEARCH", "SERPER_SHOPPING"
  ]);
  const web = authority.costEnvelope.billableCategories.find((record) => record.category === "OPENAI_WEB_SEARCH");
  assert.equal(web.countCeiling, 728);
  assert.ok(web.ordinaryInputTokenCeiling / web.countCeiling < 360000);
  assert.equal(authority.costEnvelope.billableCategories.filter((record) => record.category === "OPENAI_WEB_SEARCH").length, 1);
});

test("M-P: fixed search blocks, official patch calculation, all frozen images, and exact output ceilings are bound", () => {
  const web = authority.costEnvelope.webSearchAccounting;
  assert.equal(web.fixedSearchContentInputTokensPerPhysicalCall, OPENAI_WEB_SEARCH_CONTENT_INPUT_TOKENS);
  assert.equal(web.fixedSearchContentInputTokensPerPhysicalCall, 8000);
  const example = calculateGpt41MiniHighDetailImageTokens(1800, 2400);
  assert.deepEqual({ width: example.billedWidth, height: example.billedHeight, patches: example.patchCount, tokens: example.imageTokens }, { width: 1056, height: 1408, patches: 1452, tokens: 2353 });
  assert.equal(authority.costEnvelope.imageAccounting.uniqueImageCount, 28);
  assert.equal(authority.costEnvelope.imageAccounting.requestImageUsageCount, 52);
  assert.equal(authority.costEnvelope.imageAccounting.detailMode, "high");
  assert.deepEqual(resolveOutputTokenCeiling(4000), { tokens: 4000, basis: "EXPLICIT_SOURCE_MAX_OUTPUT_TOKENS" });
  assert.deepEqual(resolveOutputTokenCeiling(null), { tokens: 32768, basis: "EXACT_MODEL_MAX_OUTPUT_TOKENS" });
});

test("Q-R: retries are included once in the 728 pool and caller-selected source authority is rejected", () => {
  const retry = authority.costEnvelope.includedAttemptBoundaries.find((record) => record.category === "COMMITTED_PHYSICAL_RETRY");
  assert.deepEqual(retry, { category: "COMMITTED_PHYSICAL_RETRY", countCeiling: 364, billedVia: "OPENAI_WEB_SEARCH_SHARED_PHYSICAL_POOL", additionalBillableCount: 0, categorySubtotal: 0 });
  assert.equal(authority.costEnvelope.webSearchAccounting.retryAlreadyIncludedInPhysicalPool, true);
  assert.throws(() => createSourceGroundedCostEnvelope({
    requests: frozen.requests,
    assetCache: frozen.assetCache,
    attemptCeiling: authority.attemptCeiling,
    executionProfile: authority.profile,
    pricingProfile: authority.pricingProfile,
    productSourceText: "caller-selected",
    sourceReachableBillableCategories: ["OBJECT_IDENTITY_MODEL", "UNCLASSIFIED_PROVIDER_CALL"]
  }), /caller-selected source|unknown field/);
});

test("S-T: pricing drift fails closed and repeated exact-frozen envelopes keep the same amount and state", () => {
  assert.equal(validatePricingProfile(authority.pricingProfile, authority.profile).valid, true);
  assert.throws(() => validatePricingProfile(exactPricing("different-model"), authority.profile), /model mismatch/);
  const changedRate = exactPricing("gpt-4.1-mini", { inputTokenRatePerMillion: 0.39 });
  assert.throws(() => createSourceGroundedCostEnvelope({ requests: frozen.requests, assetCache: frozen.assetCache, attemptCeiling: authority.attemptCeiling, executionProfile: authority.profile, pricingProfile: changedRate }), /0\.39|0\.4|rate/);
  const serperProfile = createExecutionProfile({
    productRuntimeManifestHash: authority.profile.productRuntimeManifestHash,
    ...releaseIdentity(authority.profile),
    model: "gpt-4.1-mini",
    acquisitionProviderMode: "SERPER_WITH_OPENAI_WEB_SEARCH_FALLBACK",
    credentialPresence: { OPENAI_API_KEY: true, OPEN_API_KEY: false, SERPER_API_KEY: true },
    attemptCeiling: authority.attemptCeiling,
    resolvedAt: AT
  });
  const serperPricing = exactPricing("gpt-4.1-mini", { serperSearchCallRate: 0.001 });
  let serperError;
  try {
    createSourceGroundedCostEnvelope({ requests: frozen.requests, assetCache: frozen.assetCache, attemptCeiling: authority.attemptCeiling, executionProfile: serperProfile, pricingProfile: serperPricing });
  } catch (error) {
    serperError = error;
  }
  assert.match(serperError?.message || "", /pooled/);
  assert.equal(serperError?.costEnvelopeState, COST_STATE.INCOMPLETE);
  const repeated = createSourceGroundedCostEnvelope({ requests: frozen.requests, assetCache: frozen.assetCache, attemptCeiling: authority.attemptCeiling, executionProfile: authority.profile, pricingProfile: authority.pricingProfile });
  assert.equal(repeated.conservativeMaximumCost, 39.17741232);
  assert.equal(repeated.conservativeMaximumCostMinorUnits, 3918);
  assert.equal(repeated.costState, COST_STATE.WITHIN);
  assert.equal(repeated.costEnvelopeHash, authority.costEnvelope.costEnvelopeHash);
  assert.equal(validateCostEnvelope(repeated, { attemptCeiling: authority.attemptCeiling, executionProfile: authority.profile, pricingProfile: authority.pricingProfile }).valid, true);
});

test("U: sealed envelope amount remains compatible with actual-usage ledger stop-before-next-request semantics", () => {
  const ledger = createCostLedger({ invocationId: authority.consent.invocationId, consentHash: authority.consent.consentHash, pricingProfileHash: authority.pricingProfile.pricingProfileHash, maximumAuthorizedCost: 40, conservativePreRunMaximum: authority.costEnvelope.conservativeMaximumCost, requests: frozen.requests, nowIso: AT });
  const updated = recordRequestCost(ledger, { analysisId: frozen.requests[0].analysisId, attempts: [{ category: "OPENAI_WEB_SEARCH" }], estimatedCost: 2, actualCost: 1.5, providerUsage: [{ inputTokens: 1000, outputTokens: 100 }], reservedWorstCaseRemainingCost: 39, at: "2026-08-08T12:00:00.001Z" });
  assert.equal(validateCostLedger(updated).valid, true);
  assert.equal(updated.stopBeforeNextRequestDecision, true);
});

test("V-Z: fixed CLI grammar is inert by mode and rejects IDs, paths, providers, models, endpoints, ceilings, and text activation", async () => {
  const guard = installHardNetworkDenial();
  try {
    assert.deepEqual(parseAuthorizedExecutionArguments(["PREFLIGHT", HASH]), { mode: "PREFLIGHT", freezeAggregate: HASH, consentHash: null });
    assert.deepEqual(parseAuthorizedExecutionArguments(["CREATE_CONSENT", HASH]), { mode: "CREATE_CONSENT", freezeAggregate: HASH, consentHash: null });
    assert.deepEqual(parseAuthorizedExecutionArguments(["EXECUTE", HASH, "a".repeat(64)]), { mode: "EXECUTE", freezeAggregate: HASH, consentHash: "a".repeat(64) });
    assert.deepEqual(parseAuthorizedExecutionArguments(["READBACK", HASH, "b".repeat(64)]), { mode: "READBACK", freezeAggregate: HASH, consentHash: "b".repeat(64) });
    for (const args of [
      ["EXECUTE", HASH], ["PREFLIGHT", HASH, "a".repeat(64)], ["EXECUTE", HASH, "caller-id"], ["EXECUTE", HASH, "a".repeat(64), "gpt-4.1-mini"],
      ["https://evil.invalid", HASH], ["EXECUTE", "../freeze", "a".repeat(64)], ["EXECUTE", HASH, "a".repeat(64), "C:/output"]
    ]) assert.throws(() => parseAuthorizedExecutionArguments(args));
    assert.equal(guard.attempts.length, 0);
  } finally {
    guard.restore();
  }
});

test("X-Y: missing, stale, consumed, or mismatched consent cannot cross EXECUTE or READBACK validation", () => {
  assert.throws(() => validateExecutionConsent({}, { launchScope: authority.launchScope }), /schemaVersion/);
  assert.throws(() => validateExecutionConsent(authority.consent, { launchScope: changedScope(authority.launchScope, { networkPolicyHash: "f".repeat(64) }) }), /launch scope mismatch/);
  const consumed = transitionConsent(authority.consent, CONSENT_STATUS.CONSUMED, "2026-08-08T12:00:00.001Z", "synthetic boundary proof");
  assert.throws(() => validateExecutionConsent(consumed, { launchScope: authority.launchScope, requiredStatus: CONSENT_STATUS.AUTHORIZED_NOT_CONSUMED }), /Expected values/);
  assert.throws(() => validateExecutionConsent({ ...authority.consent, consentHash: "0".repeat(64) }, { launchScope: authority.launchScope }), /hash mismatch/);
});

test("AA-AB: CLI graph excludes private/scoring/repair code and stays pinned to the detached Version 1.12.13 product", async () => {
  const files = ["run-authorized-execution.mjs", "launch-preflight.mjs", "executor.mjs", "execution-profile.mjs", "execution-store.mjs", "execution-protocol.mjs", "launch-identity.mjs", "cost-envelope.mjs"];
  const sources = await Promise.all(files.map((name) => readFile(new URL(`../benchmarks/blind-object-v2/scripts/${name}`, import.meta.url), "utf8")));
  const importLines = sources.flatMap((source) => source.split(/\r?\n/).filter((line) => /^import\b|^}\s+from\b/.test(line))).join("\n");
  assert.doesNotMatch(importLines, /private-controls|evaluator-only|scor(?:e|ing)|reflection|lesson|repair/i);
  assert.match(sources[1], /ensureDetachedProductRuntime/);
  assert.match(sources[0], /productRuntimeRoot:\s*preflight\.productRuntimeRoot/);
  assert.match(sources[1], /PRODUCT_SOURCE_HEAD/);
  assert.equal(authority.profile.productSourceVersion, "1.12.13");
  assert.equal(EXECUTOR_VERSION, "1.12.20");
});

test("AC: focused tests leave every real consent, reservation, journal, result, and submission absent", async () => {
  assert.equal(await assertNoRealAuthorityArtifacts(), true);
  for (const relative of ["consent", "invocations", "results"]) assert.equal(await stat(new URL(`../benchmarks/blind-object-v2/${relative}`, import.meta.url), { throwIfNoEntry: false }), undefined);
  assert.equal(frozen.requests.length, 26);
  assert.equal(frozen.requests.every((request) => request.executionAuthorized === false), true);
  assert.equal(validateLaunchScope(authority.launchScope).valid, true);
});
