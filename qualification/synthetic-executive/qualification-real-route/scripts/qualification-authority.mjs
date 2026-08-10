import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import path from "node:path";
import { IMMUTABLE_SUBJECT, QUALIFICATION_LIMITS, QUALIFICATION_ROUTE, SEALED_BINDINGS } from "./qualification-route.mjs";
import { assertHash, assertSafeId, canonicalIso, exactKeys, seal, sha256Json, writeExclusiveJson } from "../../scripts/protocol.mjs";

const AUTHORITY_FIELDS = Object.freeze([
  "schemaVersion", "authorityType", "releasePurpose", "status", "authorityId", "createdAt", "toolingReleaseIdentity",
  "immutableSubjectIdentity", "bindings", "limits", "caseSlots", "permissions", "runRoot", "authorityHash"
]);

async function exists(filePath) {
  try { await stat(filePath); return true; } catch (error) { if (error?.code === "ENOENT") return false; throw error; }
}

export function buildQualificationAuthority({ authorityId, createdAt, toolingCommit, toolingTree, toolingReleaseHash, publicManifest, routeBindings, runRoot }) {
  assertSafeId(authorityId, "qualification authority ID"); canonicalIso(createdAt, "qualification authority creation time");
  assert.match(toolingCommit, /^[a-f0-9]{40}$/, "tooling commit must be a Git object ID");
  assert.match(toolingTree, /^[a-f0-9]{40}$/, "tooling tree must be a Git object ID");
  assertHash(toolingReleaseHash, "tooling release hash");
  assert.equal(publicManifest.manifestHash, SEALED_BINDINGS.caseManifestHash);
  assert.equal(publicManifest.episodes.length, QUALIFICATION_LIMITS.caseCount);
  const slots = publicManifest.episodes.map((episode, index) => seal({
    schemaVersion: "1.0", slotType: "SINGLE_USE_BLIND_QUALIFICATION_CASE", slotId: `${authorityId}-case-${String(index + 1).padStart(2, "0")}`,
    sequencePosition: index + 1, episodeId: episode.episodeId, episodeHash: episode.episodeHash,
    limits: QUALIFICATION_LIMITS.perCase, initialStatus: "UNCONSUMED"
  }, "caseSlotHash"));
  const core = {
    schemaVersion: "1.0", authorityType: "KATHERINE_BLIND_QUALIFICATION_REAL_ROUTE_V1", releasePurpose: "QUALIFICATION_EXECUTION_ONLY",
    status: "AUTHORIZED", authorityId, createdAt,
    toolingReleaseIdentity: { commit: toolingCommit, tree: toolingTree, releaseHash: toolingReleaseHash },
    immutableSubjectIdentity: IMMUTABLE_SUBJECT,
    bindings: {
      ...SEALED_BINDINGS,
      providerProfileHash: routeBindings.providerProfileHash,
      continuationPolicyHash: routeBindings.continuationPolicyHash,
      authoritySchemaHash: routeBindings.authoritySchemaHash,
      ledgerSchemaHash: routeBindings.ledgerSchemaHash,
      transmittedSchemaTemplateExactHash: routeBindings.transmittedSchemaTemplateExactHash,
      transmittedSchemaTemplateStableHash: routeBindings.transmittedSchemaTemplateStableHash
    },
    limits: QUALIFICATION_LIMITS,
    caseSlots: slots,
    permissions: {
      provider: { endpointClass: "RESPONSES_API", exactModel: QUALIFICATION_ROUTE.model, reasoningEffort: QUALIFICATION_ROUTE.reasoningEffort, store: false, metadataRequests: 0 },
      permittedCapabilities: ["QUERY_EXECUTIVE_MEMORY", "REQUEST_PRESEALED_WORKER_DOSSIER"],
      liveQualificationCases: 12, benchmarks: false, productHandlers: false, sourceChanges: false, preview: false, production: false, merge: false, deployment: false, successors: false
    },
    runRoot: path.resolve(runRoot)
  };
  return seal(core, "authorityHash");
}

export function validateQualificationAuthority(authority, { publicManifest, routeBindings, toolingCommit = null, toolingTree = null, toolingReleaseHash = null } = {}) {
  assert.deepEqual(Object.keys(authority || {}).sort(), [...AUTHORITY_FIELDS].sort(), "qualification authority fields differ");
  assert.equal(authority.schemaVersion, "1.0");
  assert.equal(authority.authorityType, "KATHERINE_BLIND_QUALIFICATION_REAL_ROUTE_V1");
  assert.equal(authority.releasePurpose, "QUALIFICATION_EXECUTION_ONLY"); assert.equal(authority.status, "AUTHORIZED");
  assertSafeId(authority.authorityId); canonicalIso(authority.createdAt); assert.deepEqual(authority.immutableSubjectIdentity, IMMUTABLE_SUBJECT);
  exactKeys(authority.toolingReleaseIdentity, ["commit", "tree", "releaseHash"], "tooling release identity");
  assert.match(authority.toolingReleaseIdentity.commit, /^[a-f0-9]{40}$/); assert.match(authority.toolingReleaseIdentity.tree, /^[a-f0-9]{40}$/); assertHash(authority.toolingReleaseIdentity.releaseHash);
  exactKeys(authority.bindings, [
    "startingToolingCommit", "startingToolingTree", "readinessManifestHash", "caseManifestHash", "scoringControlsHash",
    "budgetProfileHash", "calibrationResultHash", "executiveActionSourceSchemaHash", "safeProviderDiagnosticsContractHash",
    "providerProfileHash", "continuationPolicyHash", "authoritySchemaHash", "ledgerSchemaHash",
    "transmittedSchemaTemplateExactHash", "transmittedSchemaTemplateStableHash"
  ], "qualification authority bindings");
  assert.deepEqual(authority.limits, QUALIFICATION_LIMITS); assert.equal(authority.caseSlots.length, 12);
  assert.equal(authority.bindings.readinessManifestHash, SEALED_BINDINGS.readinessManifestHash);
  assert.equal(authority.bindings.caseManifestHash, SEALED_BINDINGS.caseManifestHash);
  assert.equal(authority.bindings.scoringControlsHash, SEALED_BINDINGS.scoringControlsHash);
  assert.equal(authority.bindings.budgetProfileHash, SEALED_BINDINGS.budgetProfileHash);
  assert.equal(authority.bindings.calibrationResultHash, SEALED_BINDINGS.calibrationResultHash);
  assert.equal(authority.bindings.safeProviderDiagnosticsContractHash, SEALED_BINDINGS.safeProviderDiagnosticsContractHash);
  for (const field of ["providerProfileHash", "continuationPolicyHash", "authoritySchemaHash", "ledgerSchemaHash", "transmittedSchemaTemplateExactHash", "transmittedSchemaTemplateStableHash"])
    assert.equal(authority.bindings[field], routeBindings[field], `authority ${field} differs`);
  if (toolingCommit) assert.equal(authority.toolingReleaseIdentity.commit, toolingCommit);
  if (toolingTree) assert.equal(authority.toolingReleaseIdentity.tree, toolingTree);
  if (toolingReleaseHash) assert.equal(authority.toolingReleaseIdentity.releaseHash, toolingReleaseHash);
  assert.deepEqual(authority.permissions.provider, { endpointClass: "RESPONSES_API", exactModel: "gpt-5.6-sol", reasoningEffort: "medium", store: false, metadataRequests: 0 });
  exactKeys(authority.permissions, ["provider", "permittedCapabilities", "liveQualificationCases", "benchmarks", "productHandlers", "sourceChanges", "preview", "production", "merge", "deployment", "successors"], "qualification authority permissions");
  assert.deepEqual(authority.permissions.permittedCapabilities, ["QUERY_EXECUTIVE_MEMORY", "REQUEST_PRESEALED_WORKER_DOSSIER"]);
  for (const denied of ["benchmarks", "productHandlers", "sourceChanges", "preview", "production", "merge", "deployment", "successors"]) assert.equal(authority.permissions[denied], false);
  for (const [index, slot] of authority.caseSlots.entries()) {
    assert.equal(slot.sequencePosition, index + 1); assert.equal(slot.episodeId, publicManifest.episodes[index].episodeId); assert.equal(slot.episodeHash, publicManifest.episodes[index].episodeHash);
    assert.deepEqual(slot.limits, QUALIFICATION_LIMITS.perCase); assert.equal(slot.initialStatus, "UNCONSUMED");
    const core = structuredClone(slot); delete core.caseSlotHash; assert.equal(sha256Json(core), slot.caseSlotHash, "case slot hash differs");
  }
  const core = structuredClone(authority); delete core.authorityHash; assert.equal(sha256Json(core), authority.authorityHash, "qualification authority hash differs");
  return authority;
}

export async function createNewQualificationAuthority({ authorityPath, ...input }) {
  const resolved = path.resolve(authorityPath);
  assert.equal(await exists(resolved), false, "QUALIFICATION_AUTHORITY_PATH_OCCUPIED");
  const authority = buildQualificationAuthority(input);
  validateQualificationAuthority(authority, { publicManifest: input.publicManifest, routeBindings: input.routeBindings, toolingCommit: input.toolingCommit, toolingTree: input.toolingTree, toolingReleaseHash: input.toolingReleaseHash });
  await writeExclusiveJson(resolved, authority);
  return authority;
}
