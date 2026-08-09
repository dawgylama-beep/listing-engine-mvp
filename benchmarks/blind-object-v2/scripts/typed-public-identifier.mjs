import assert from "node:assert/strict";
import { underlyingOfferKey } from "../../../lib/evidence/dedupe.js";
import { sha256Json } from "./protocol.mjs";
import {
  PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM,
  PUBLIC_EVIDENCE_IDENTIFIER_TYPE,
  PUBLIC_IDENTIFIER_CONTRACT_MANIFEST,
  PUBLIC_IDENTIFIER_CONTRACT_MANIFEST_VERSION,
  actualPathPatternSource,
  validatePublicIdentifierContractManifest
} from "./public-identifier-contract-manifest.mjs";

export { PUBLIC_EVIDENCE_IDENTIFIER_TYPE, PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM };
export const PUBLIC_IDENTIFIER_REGISTRY_VERSION = PUBLIC_IDENTIFIER_CONTRACT_MANIFEST_VERSION;

const CREDENTIAL_QUERY_NAME = /^(?:api[-_]?key|access[-_]?token|auth(?:orization)?|credential|password|secret|session|sig(?:nature)?|x-amz-signature)$/i;

validatePublicIdentifierContractManifest();
export const AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY = Object.freeze(
  PUBLIC_IDENTIFIER_CONTRACT_MANIFEST.contracts.map((entry) => Object.freeze(structuredClone(entry)))
);

export const AUTHORIZED_NORMALIZED_PUBLIC_IDENTIFIER_PATHS = Object.freeze(
  AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY.map((entry) => entry.normalizedSchemaPath)
);

const COMPILED_REGISTRY = Object.freeze(AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY.map((entry) => Object.freeze({
  entry,
  actualPathPattern: new RegExp(actualPathPatternSource(entry.normalizedSchemaPath))
})));

export function publicIdentifierContractForActualPath(path) {
  return COMPILED_REGISTRY.find(({ actualPathPattern: pattern }) => pattern.test(path))?.entry || null;
}

function publicUrlFromSource(source) {
  const urlField = ["canonicalUrl", "destinationUrl", "url", "sourceUrl"]
    .find((field) => typeof source?.[field] === "string" && source[field].trim());
  assert.ok(urlField, "typed public offer identity requires a public URL preimage");
  const parsed = new URL(source[urlField]);
  assert.ok(["http:", "https:"].includes(parsed.protocol), "typed public offer identity URL protocol is invalid");
  assert.equal(Boolean(parsed.username || parsed.password), false, "typed public offer identity URL contains credentials");
  for (const name of parsed.searchParams.keys()) {
    assert.doesNotMatch(name, CREDENTIAL_QUERY_NAME, "typed public offer identity URL contains a credential-bearing query");
  }
  return Object.freeze({ url: parsed.toString(), urlField });
}

function walk(value, visitor, path = "$", parent = null, key = null) {
  visitor(value, path, parent, key);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, `${path}[${index}]`, value, index));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [childKey, child] of Object.entries(value)) walk(child, visitor, `${path}.${childKey}`, value, childKey);
}

function assertDeclaredValueType(value, path, contract) {
  if (value === null || value === undefined) return false;
  assert.equal(typeof value, contract.requiredValueType, `typed public identifier at ${path} must be a ${contract.requiredValueType}`);
  return true;
}

function provenanceEntry({ path, value, preimagePath, contract, reference = false }) {
  return Object.freeze({
    path,
    normalizedSchemaPath: contract.normalizedSchemaPath,
    registryContractId: contract.registryContractId,
    terminalSchemaNode: contract.applicableTerminalSchemaNode,
    requiredValueType: contract.requiredValueType,
    identifierType: PUBLIC_EVIDENCE_IDENTIFIER_TYPE,
    identityAlgorithm: PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM,
    publicPreimagePath: preimagePath,
    provenanceMode: reference ? "HASH_BOUND_REFERENCE_TO_RECOMPUTED_PUBLIC_SOURCE" : "RECOMPUTED_FROM_SIBLING_PUBLIC_SOURCE",
    identifierHash: sha256Json(value)
  });
}

export function deriveTypedPublicIdentifierProvenance(record) {
  assert.ok(record && typeof record === "object" && !Array.isArray(record), "typed identifier source must be an object");
  const catalog = new Map();
  const primaryByPath = new Map();

  walk(record, (value, path, parent) => {
    const contract = publicIdentifierContractForActualPath(path);
    if (!contract || !contract.role.startsWith("PUBLIC_SOURCE") || !assertDeclaredValueType(value, path, contract) || !value) return;
    assert.ok(parent && typeof parent === "object" && !Array.isArray(parent), `typed public source at ${path} must be an object property`);
    let publicUrl;
    let recomputed;
    try {
      publicUrl = publicUrlFromSource(parent);
      recomputed = underlyingOfferKey(parent);
    } catch {
      return;
    }
    if (recomputed !== value) return;
    const parentPath = path.slice(0, path.lastIndexOf("."));
    const entry = provenanceEntry({
      path,
      value,
      preimagePath: `${parentPath}.${publicUrl.urlField}`,
      contract
    });
    primaryByPath.set(path, entry);
    const existing = catalog.get(value) || [];
    existing.push(entry);
    catalog.set(value, existing);
  });

  const entries = [...primaryByPath.values()];
  walk(record, (value, path) => {
    const contract = publicIdentifierContractForActualPath(path);
    if (!contract || !contract.role.includes("HASH_BOUND_REFERENCE") || !assertDeclaredValueType(value, path, contract) || !value || primaryByPath.has(path)) return;
    const sources = catalog.get(value);
    if (!sources?.length) return;
    entries.push(provenanceEntry({
      path,
      value,
      preimagePath: sources[0].publicPreimagePath,
      contract,
      reference: true
    }));
  });

  entries.sort((left, right) => left.path.localeCompare(right.path));
  return Object.freeze(entries);
}

export function typedPublicIdentifierPaths(record) {
  const provenance = deriveTypedPublicIdentifierProvenance(record);
  const paths = new Set(provenance.map((entry) => entry.path));
  for (const [index, entry] of provenance.entries()) {
    for (const field of Object.keys(entry)) paths.add(`$.typedPublicIdentifierProvenance[${index}].${field}`);
  }
  return Object.freeze(paths);
}

export function inspectPublicIdentifierAtLocation({ record, path, value, parent }) {
  const contract = publicIdentifierContractForActualPath(path);
  if (!contract) return Object.freeze({
    normalizedSchemaPath: path.replace(/\[(?:0|[1-9]\d*)\]/g, "[*]"),
    terminalSchemaNode: "NO_CONTRACT_MATCH",
    registryContractId: "NO_CONTRACT_MATCH",
    requiredValueType: null,
    publicPreimageAvailable: false,
    publicPreimageRecomputationResult: "NOT_APPLICABLE_NO_CONTRACT",
    sellerPartitionVerificationResult: "NOT_APPLICABLE_NO_CONTRACT",
    typedPublicIdentifierAccepted: false
  });
  if (typeof value !== contract.requiredValueType) return Object.freeze({
    normalizedSchemaPath: contract.normalizedSchemaPath,
    terminalSchemaNode: contract.applicableTerminalSchemaNode,
    registryContractId: contract.registryContractId,
    requiredValueType: contract.requiredValueType,
    publicPreimageAvailable: false,
    publicPreimageRecomputationResult: "VALUE_TYPE_MISMATCH",
    sellerPartitionVerificationResult: "VALUE_TYPE_MISMATCH",
    typedPublicIdentifierAccepted: false
  });
  if (contract.role.startsWith("PUBLIC_SOURCE")) {
    try {
      const publicUrl = publicUrlFromSource(parent);
      const recomputed = underlyingOfferKey(parent);
      const accepted = Boolean(value) && recomputed === value;
      return Object.freeze({
        normalizedSchemaPath: contract.normalizedSchemaPath,
        terminalSchemaNode: contract.applicableTerminalSchemaNode,
        registryContractId: contract.registryContractId,
        requiredValueType: contract.requiredValueType,
        publicPreimageAvailable: true,
        publicPreimageRecomputationResult: accepted ? "MATCH" : "MISMATCH",
        sellerPartitionVerificationResult: accepted ? "MATCH" : "MISMATCH",
        publicPreimagePath: `${path.slice(0, path.lastIndexOf("."))}.${publicUrl.urlField}`,
        typedPublicIdentifierAccepted: accepted
      });
    } catch {
      return Object.freeze({
        normalizedSchemaPath: contract.normalizedSchemaPath,
        terminalSchemaNode: contract.applicableTerminalSchemaNode,
        registryContractId: contract.registryContractId,
        requiredValueType: contract.requiredValueType,
        publicPreimageAvailable: false,
        publicPreimageRecomputationResult: "UNAVAILABLE_OR_INVALID",
        sellerPartitionVerificationResult: "UNAVAILABLE_OR_INVALID",
        typedPublicIdentifierAccepted: false
      });
    }
  }
  let provenance = [];
  try { provenance = deriveTypedPublicIdentifierProvenance(record); } catch { provenance = []; }
  const accepted = provenance.some((entry) => entry.path === path && entry.identifierHash === sha256Json(value));
  return Object.freeze({
    normalizedSchemaPath: contract.normalizedSchemaPath,
    terminalSchemaNode: contract.applicableTerminalSchemaNode,
    registryContractId: contract.registryContractId,
    requiredValueType: contract.requiredValueType,
    publicPreimageAvailable: accepted,
    publicPreimageRecomputationResult: accepted ? "HASH_BOUND_REFERENCE_MATCH" : "HASH_BOUND_REFERENCE_UNRESOLVED",
    sellerPartitionVerificationResult: accepted ? "MATCH_VIA_BOUND_SOURCE" : "UNRESOLVED",
    typedPublicIdentifierAccepted: accepted
  });
}
