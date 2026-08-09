import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";

export const INVARIANT_CATALOG_VERSION = "1.0";

const records = [
  ["HANDLER_RESPONSE_LOST_BEFORE_PERSISTENCE", "A handler return is not durable until exact canonical bytes are quarantined and read back.", ["HANDLER_STARTED", "HANDLER_RETURNED_QUARANTINED"], "RECONSTRUCT_ONLY_IF_QUARANTINE_RECEIPT_AND_BYTES_EXIST", "NEVER_REINVOKE_HANDLER", "quarantine-crash-before-receipt", "handler invocation exists without a valid quarantine receipt", "STOP_NOVEL_AND_REQUIRE_BOUNDED_DOSSIER"],
  ["HANDLER_HASH_WITHOUT_RECOVERABLE_BYTES", "A handler hash alone is not recoverable evidence.", ["HANDLER_RETURNED_QUARANTINED"], "NONE", "NEVER_TREAT_HASH_ONLY_RECEIPT_AS_RECOVERABLE", "hash-only-handler-receipt", "receipt lacks independently decryptable exact bytes", "STOP_TERMINAL"],
  ["TERMINAL_SANITIZER_FALSE_POSITIVE_RISK", "A downstream sanitizer decision may be repeated only against the same quarantined bytes under an unchanged contract.", ["HANDLER_RETURNED_QUARANTINED", "SANITIZATION_DECIDED"], "RESANITIZE_SAME_QUARANTINED_BYTES_WHEN_CONTRACT_MATCHES_AND_CREDENTIAL_CLASSIFIERS_ARE_CLEAR", "NEVER_BROADEN_AUTHORITY_OR_SUPPRESS_CREDENTIAL_RULES", "known-downstream-resanitization", "safe decision receipt identifies an unchanged contract and no credential classifier", "STOP_IF_CONTRACT_OR_POLICY_IS_NOVEL"],
  ["UNDECLARED_PATH_CROSS_PRODUCT_ACCEPTANCE", "Public identifier authority exists only for a complete path in the canonical contract manifest.", ["SANITIZATION_DECIDED"], "NONE", "NEVER_COMBINE_ROOT_AND_COLLECTION_ALLOWLISTS", "extra-nesting-public-identifier", "identifier-like value appears at NO_CONTRACT_MATCH", "STOP_TERMINAL"],
  ["CROSS_RELEASE_HASH_EQUALITY_CONFUSION", "Each artifact validates against its own typed release authority and explicit predecessor chain.", ["RELEASE_VERIFIED", "PREFLIGHT_PASSED"], "VALIDATE_TYPED_CHAIN", "NEVER_REQUIRE_DISTINCT_RELEASE_HASHES_TO_EQUAL", "distinct-release-chain", "release predicate compares historical and current hashes directly", "STOP_PRE_EXTERNAL"],
  ["IMPOSSIBLE_RETROSPECTIVE_PROVENANCE_DEMAND", "Unavailable historical bytes or provenance remain permanently unknown.", ["READBACK_VERIFIED", "COMPOSITE_SEALED"], "PRESERVE_INFRASTRUCTURE_FAILURE_DISPOSITION", "NEVER_RECONSTRUCT_OR_SUBSTITUTE_UNKNOWN_VALUE", "lost-historical-value", "recovery requires bytes that were never persisted", "ESCALATE_AS_PERMANENT_DISPOSITION"],
  ["ABANDONED_CONSENT_REUSE", "An abandoned, revoked, or consumed consent cannot authorize a successor invocation.", ["CONSENT_AUTHORIZED", "RESERVATION_CREATED"], "CREATE_NEW_TOP_LEVEL_AUTHORITY_ONLY", "NEVER_REUSE_OLD_CONSENT_OR_IDENTITIES", "reused-consent", "consent is not newly authorized and unconsumed", "STOP_PRE_EXTERNAL"],
  ["HELPER_PASS_REAL_CLI_FAIL", "Qualification authority requires the actual production CLI and executor path.", ["RELEASE_VERIFIED", "PREFLIGHT_PASSED"], "RUN_EXACT_OFFLINE_CLI_WITH_NETWORK_DENIAL", "NEVER_PROMOTE_HELPER_ONLY_PASS", "actual-cli-qualification", "release lacks complete CLI qualification receipt", "BLOCK_RELEASE_SEAL"],
  ["INVALID_LIFECYCLE_TRANSITION", "Lifecycle decisions are append-only, monotonic, predecessor-bound, and uniquely selected by the transition manifest.", ["RELEASE_VERIFIED", "COGNITIVE_EVALUATION_READY"], "RECONSTRUCT_FROM_DURABLE_RECEIPTS", "NEVER_ACCEPT_DUPLICATE_BACKWARD_CYCLIC_OR_AMBIGUOUS_SUCCESSOR", "transition-mutation-matrix", "receipt predecessor or successor differs from manifest", "STOP_TERMINAL"],
  ["BENCHMARK_REQUEST_REPLAY", "A request with a submission identity or permanent infrastructure disposition is never submitted again.", ["HANDLER_STARTED", "READBACK_VERIFIED"], "READBACK_EXISTING_DURABLE_STATE", "NEVER_REINVOKE_HANDLER_OR_PROVIDER", "request-substitution-and-replay", "request ID or hash already owns a physical submission identity", "STOP_TERMINAL"],
  ["MISSING_TERMINAL_DIAGNOSTIC_EVIDENCE", "Every stopped post-handler episode requires quarantine, sanitizer decision, governor stop receipt, and bounded dossier.", ["HANDLER_RETURNED_QUARANTINED", "SANITIZATION_DECIDED"], "COMPLETE_SAFE_DIAGNOSTIC_FROM_DURABLE_NONSECRET_EVIDENCE", "NEVER_EXPOSE_RAW_REJECTED_VALUE", "missing-diagnostic-receipt", "terminal stop lacks one required safe evidence artifact", "STOP_AND_ESCALATE"],
  ["NOVEL_DOWNSTREAM_CONDITION", "Unknown schema, policy, code, or credential conditions stop the episode without replay.", ["HANDLER_RETURNED_QUARANTINED", "SANITIZATION_DECIDED"], "NONE", "NEVER_PATCH_RETRY_BROADEN_OR_REPLAY_IN_PLACE", "novel-downstream-stop", "no known invariant grants deterministic downstream-only recovery", "STOP_WITH_BOUNDED_DOSSIER"]
].map(([failureId, generalizedRule, affectedLifecycleStates, legalAutomaticRecovery, prohibitedRecovery, regressionFixture, recurrenceDetector, escalationRule]) => ({
  failureId,
  generalizedRule,
  affectedLifecycleStates,
  affectedComponents: ["cognitive-lifecycle-governor", "executor", "persistence", "sanitizer"],
  legalAutomaticRecovery,
  prohibitedRecovery,
  regressionFixture,
  recurrenceDetector,
  escalationRule
}));

const core = {
  schemaVersion: INVARIANT_CATALOG_VERSION,
  catalogType: "COGNITIVE_LIFECYCLE_INVARIANT_CATALOG",
  records,
  recordAggregateHash: sha256Json(records)
};

export const COGNITIVE_LIFECYCLE_INVARIANT_CATALOG = Object.freeze({ ...core, catalogHash: sha256Json(core) });

export function validateInvariantCatalog(catalog = COGNITIVE_LIFECYCLE_INVARIANT_CATALOG) {
  assert.equal(catalog.schemaVersion, INVARIANT_CATALOG_VERSION);
  assert.equal(catalog.catalogType, "COGNITIVE_LIFECYCLE_INVARIANT_CATALOG");
  assert.equal(new Set(catalog.records.map((record) => record.failureId)).size, catalog.records.length);
  assert.equal(catalog.records.length >= 12, true);
  assert.equal(sha256Json(catalog.records), catalog.recordAggregateHash);
  const copy = structuredClone(catalog); delete copy.catalogHash;
  assert.equal(sha256Json(copy), catalog.catalogHash);
  return Object.freeze({ valid: true, catalogHash: catalog.catalogHash, invariantCount: catalog.records.length });
}

export function consultLifecycleInvariant(failureId, evidence) {
  validateInvariantCatalog();
  const invariant = COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.records.find((record) => record.failureId === failureId);
  assert.ok(invariant, `unknown lifecycle invariant ${failureId}`);
  const downstreamEligible = failureId === "TERMINAL_SANITIZER_FALSE_POSITIVE_RISK"
    && evidence?.quarantineVerified === true
    && evidence?.sourceCodeMutationRequired === false
    && evidence?.policyMutationRequired === false
    && evidence?.contractMatch === true
    && evidence?.credentialClassifierFired === false
    && evidence?.publicPreimageRecomputed === true
    && evidence?.identityBindingsVerified === true;
  const decision = downstreamEligible ? "AUTOMATIC_DOWNSTREAM_RECOVERY_AUTHORIZED" : "AUTOMATIC_RECOVERY_NOT_AUTHORIZED";
  const core = {
    schemaVersion: "1.0",
    decisionType: "COGNITIVE_LIFECYCLE_INVARIANT_DECISION",
    invariantCatalogHash: COGNITIVE_LIFECYCLE_INVARIANT_CATALOG.catalogHash,
    failureId,
    evidenceDigest: sha256Json(evidence || null),
    decision,
    legalAutomaticRecovery: invariant.legalAutomaticRecovery,
    prohibitedRecovery: invariant.prohibitedRecovery,
    escalationRule: invariant.escalationRule
  };
  return Object.freeze({ ...core, decisionHash: sha256Json(core) });
}
