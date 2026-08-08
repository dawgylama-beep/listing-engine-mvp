import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";

export const LAUNCH_SCOPE_SCHEMA_VERSION = "1.0";
export const LAUNCH_SCOPE_TYPE = "BLIND_OBJECT_V2_LAUNCH_SCOPE";

export const IDENTITY_DOMAINS = Object.freeze({
  consentId: Object.freeze({ domain: "KATHERINE_V2_CONSENT_ID_V1", prefix: "consent-" }),
  invocationId: Object.freeze({ domain: "KATHERINE_V2_INVOCATION_ID_V1", prefix: "invocation-" }),
  reservationId: Object.freeze({ domain: "KATHERINE_V2_RESERVATION_ID_V1", prefix: "reservation-" }),
  resultId: Object.freeze({ domain: "KATHERINE_V2_RESULT_ID_V1", prefix: "result-" }),
  resultRootName: Object.freeze({ domain: "KATHERINE_V2_RESULT_ROOT_V1", prefix: "result-root-" })
});

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const VERSION = /^\d+\.\d+\.\d+$/;
const PUBLIC_IDENTITY = /^(?=.{1,80}$)[A-Za-z0-9](?:[A-Za-z0-9._:-]*[A-Za-z0-9])?$/;
const CANDIDATE_SET_ID = /^[A-Z0-9][A-Z0-9_-]{7,79}$/;
const DERIVED_ID = /^(?:consent|invocation|reservation|result|result-root)-[a-f0-9]{48}$/;
const AUTHORITY_FIELDS = Object.freeze([
  "privateControlsAuthorized",
  "scoringAuthorized",
  "reflectionAuthorized",
  "repairAuthorized",
  "deploymentAuthorized"
]);
const VOLATILE_OR_CALLER_IDENTITY_FIELDS = /^(?:createdAt|resolvedAt|timestamp|time|temporaryPath|tempPath|runtimeRoot|hostName|hostname|userName|username|processId|pid|operatorText|freeFormText|consentId|invocationId|reservationId|resultId|resultRootName|fixedResultRoot)$/i;
const LAUNCH_SCOPE_CORE_FIELDS = Object.freeze([
  "schemaVersion",
  "scopeType",
  "benchmarkId",
  "candidateSetId",
  "productSourceHead",
  "productSourceVersion",
  "productRuntimeManifestHash",
  "executorSourceHead",
  "executorVersion",
  "completeFrozenAggregateHash",
  "freezeManifestHash",
  "freezeReceiptHash",
  "requestAggregateHash",
  "orderedRequestHashInventory",
  "handlerContract",
  "modelProvider",
  "exactModelLiteral",
  "acquisitionProviderMode",
  "directPageMode",
  "endpointClassAllowlistHash",
  "environmentNameAllowlistHash",
  "completePhysicalAttemptCeiling",
  "completeAttemptCeilingHash",
  "executionProfileIdentityHash",
  "pricingProfileIdentityHash",
  "costEnvelopeHash",
  "maximumAuthorizedCostMinorUnits",
  "networkPolicyHash",
  ...AUTHORITY_FIELDS
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function assertNoVolatileOrCallerIdentityFields(value, location = "$") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoVolatileOrCallerIdentityFields(entry, `${location}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert.equal(VOLATILE_OR_CALLER_IDENTITY_FIELDS.test(key), false, `launch scope contains volatile or caller-selected field ${location}.${key}`);
    assertNoVolatileOrCallerIdentityFields(child, `${location}.${key}`);
  }
}

function validateCore(core) {
  exactKeys(core, LAUNCH_SCOPE_CORE_FIELDS, "launch scope core");
  assert.equal(core.schemaVersion, LAUNCH_SCOPE_SCHEMA_VERSION);
  assert.equal(core.scopeType, LAUNCH_SCOPE_TYPE);
  assert.equal(core.benchmarkId, "blind-object-v2");
  assert.match(core.candidateSetId || "", CANDIDATE_SET_ID);
  assert.match(core.productSourceHead || "", COMMIT);
  assert.match(core.productSourceVersion || "", VERSION);
  assert.match(core.productRuntimeManifestHash || "", HASH);
  assert.match(core.executorSourceHead || "", COMMIT);
  assert.match(core.executorVersion || "", VERSION);
  for (const field of [
    "completeFrozenAggregateHash", "freezeManifestHash", "freezeReceiptHash", "requestAggregateHash",
    "endpointClassAllowlistHash", "environmentNameAllowlistHash", "completeAttemptCeilingHash",
    "executionProfileIdentityHash", "pricingProfileIdentityHash", "costEnvelopeHash", "networkPolicyHash"
  ]) assert.match(core[field] || "", HASH, `launch scope ${field} is invalid`);
  assert.equal(core.orderedRequestHashInventory?.length, 26);
  assert.equal(new Set(core.orderedRequestHashInventory).size, 26);
  core.orderedRequestHashInventory.forEach((hash) => assert.match(hash || "", HASH));
  assert.deepEqual(Object.keys(core.handlerContract).sort(), ["bridge", "export", "method", "path"]);
  assert.equal(core.handlerContract.export, "api/generate-listing.js#createGenerateListingHandler");
  assert.equal(core.handlerContract.bridge, "scripts/local-generate-listing-bridge.mjs");
  assert.equal(core.handlerContract.method, "POST");
  assert.equal(core.handlerContract.path, "/api/generate-listing");
  assert.equal(core.modelProvider, "OPENAI");
  assert.match(core.exactModelLiteral || "", PUBLIC_IDENTITY);
  assert.ok(["OPENAI_WEB_SEARCH_ONLY", "SERPER_WITH_OPENAI_WEB_SEARCH_FALLBACK"].includes(core.acquisitionProviderMode));
  assert.equal(core.directPageMode, "PRODUCT_BOUNDED_ONLY");
  assert.equal(core.completePhysicalAttemptCeiling, 832);
  assert.equal(Number.isInteger(core.maximumAuthorizedCostMinorUnits), true);
  assert.ok(core.maximumAuthorizedCostMinorUnits > 0);
  AUTHORITY_FIELDS.forEach((field) => assert.equal(core[field], false));
  assertNoVolatileOrCallerIdentityFields(core);
  return core;
}

export function createLaunchScope(input) {
  exactKeys(input, LAUNCH_SCOPE_CORE_FIELDS.filter((field) => !["schemaVersion", "scopeType"].includes(field)), "launch scope input");
  const core = {
    schemaVersion: LAUNCH_SCOPE_SCHEMA_VERSION,
    scopeType: LAUNCH_SCOPE_TYPE,
    ...structuredClone(input)
  };
  validateCore(core);
  return Object.freeze({ ...core, launchScopeHash: sha256Json(core) });
}

export function validateLaunchScope(scope) {
  exactKeys(scope, [...LAUNCH_SCOPE_CORE_FIELDS, "launchScopeHash"], "launch scope");
  const core = structuredClone(scope);
  delete core.launchScopeHash;
  validateCore(core);
  assert.match(scope.launchScopeHash || "", HASH);
  assert.equal(sha256Json(core), scope.launchScopeHash, "launch scope hash mismatch");
  return Object.freeze({ valid: true, launchScopeHash: scope.launchScopeHash });
}

function deriveIdentity(domainRecord, launchScopeHash) {
  assert.match(launchScopeHash || "", HASH);
  const fullIdentityHash = sha256Json({
    schemaVersion: LAUNCH_SCOPE_SCHEMA_VERSION,
    domain: domainRecord.domain,
    launchScopeHash
  });
  return Object.freeze({
    id: `${domainRecord.prefix}${fullIdentityHash.slice(0, 48)}`,
    fullIdentityHash,
    domain: domainRecord.domain,
    launchScopeHash
  });
}

export function deriveLaunchIdentities(scope) {
  validateLaunchScope(scope);
  const entries = Object.entries(IDENTITY_DOMAINS).map(([name, domain]) => [name, deriveIdentity(domain, scope.launchScopeHash)]);
  const records = Object.fromEntries(entries);
  const ids = Object.fromEntries(entries.map(([name, record]) => [name, record.id]));
  Object.values(ids).forEach((id) => assert.match(id, DERIVED_ID));
  assert.equal(new Set(Object.values(ids)).size, Object.keys(ids).length, "domain-separated launch identities collided");
  return Object.freeze({
    ...ids,
    identityRecords: Object.freeze(records),
    launchScopeHash: scope.launchScopeHash
  });
}

export function assertNoTruncatedIdentityCollision(existingRecord, proposedRecord, idField) {
  assert.ok(["consentId", "invocationId", "reservationId", "resultId", "resultRootName"].includes(idField), "collision field is not repository-owned");
  assert.match(existingRecord?.[idField] || "", DERIVED_ID);
  assert.match(proposedRecord?.[idField] || "", DERIVED_ID);
  assert.match(existingRecord?.launchScopeHash || "", HASH);
  assert.match(proposedRecord?.launchScopeHash || "", HASH);
  if (existingRecord[idField] === proposedRecord[idField] && existingRecord.launchScopeHash !== proposedRecord.launchScopeHash) {
    assert.fail(`truncated ${idField} collision binds different full launch scopes`);
  }
  return true;
}
