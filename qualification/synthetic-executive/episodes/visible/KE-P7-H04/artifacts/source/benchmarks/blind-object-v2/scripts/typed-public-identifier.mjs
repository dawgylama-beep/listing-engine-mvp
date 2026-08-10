import assert from "node:assert/strict";
import { underlyingOfferKey } from "../../../lib/evidence/dedupe.js";
import { sha256Json } from "./protocol.mjs";

export const PUBLIC_EVIDENCE_IDENTIFIER_TYPE = "CANONICAL_PUBLIC_OFFER_IDENTITY_V1";
export const PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM = "lib/evidence/dedupe.js#underlyingOfferKey";

export const DECLARED_TYPED_TERMINAL_ROOTS = Object.freeze([
  "experienceRecord",
  "sanitizedTerminalResponseEnvelope",
  "responseDiagnostics",
  "governorProof",
  "terminalEvidence"
]);
const TERMINAL_TYPED_ROOTS = Object.freeze(new Set(DECLARED_TYPED_TERMINAL_ROOTS));

export const DECLARED_PUBLIC_SOURCE_COLLECTIONS = Object.freeze([
  "accepted",
  "acceptedRecords",
  "all",
  "candidateEvidence",
  "compatiblePriceContext",
  "customerEligible",
  "customerEvidence",
  "decisionEligible",
  "diagnosticSample",
  "displayed",
  "exactEvidenceRecovered",
  "finalizedCustomerClassifications",
  "marketEvidence",
  "observations",
  "priceFound",
  "pricesFound",
  "rangeEligible",
  "rejected",
  "rejectedRecords",
  "retailEvidenceAssessments",
  "sourcesAccepted",
  "sourcesFound",
  "sourcesRejected"
]);
const PUBLIC_SOURCE_COLLECTIONS = Object.freeze(new Set(DECLARED_PUBLIC_SOURCE_COLLECTIONS));

export const DECLARED_PUBLIC_EVIDENCE_REFERENCE_FIELDS = Object.freeze([
  "acceptedEvidenceIds",
  "buyerOfferSupportEvidenceIds",
  "canonicalBadgeSupportEvidenceIds",
  "canonicalBuyerOfferSupportEvidenceIds",
  "canonicalCustomerEvidenceIds",
  "canonicalDecisionSupportEvidenceIds",
  "canonicalIdentityConfidenceSupportEvidenceIds",
  "canonicalPricingConfidenceSupportEvidenceIds",
  "canonicalRangeSupportEvidenceIds",
  "canonicalRetailLimitSupportEvidenceIds",
  "decisionSupportEvidenceIds",
  "displayedIds",
  "displayedRecordIds",
  "evidenceIds",
  "finalizedCustomerRecordIds",
  "identityConfidenceSupportEvidenceIds",
  "observedEvidenceId",
  "pricingConfidenceSupportEvidenceIds",
  "rangeSupportEvidenceIds",
  "rangeSupportingEvidenceIds",
  "recoveryStoppingSupportIds",
  "recoveryTriggeringSupportIds",
  "retailLimitSupportEvidenceIds",
  "retailPriceLimitSupportingEvidenceIds",
  "selectedEvidenceId",
  "supportingEvidenceIds",
  "underlyingOfferId",
  "underlyingOfferIds"
]);
const PUBLIC_EVIDENCE_REFERENCE_FIELDS = Object.freeze(new Set(DECLARED_PUBLIC_EVIDENCE_REFERENCE_FIELDS));

const CREDENTIAL_QUERY_NAME = /^(?:api[-_]?key|access[-_]?token|auth(?:orization)?|credential|password|secret|session|sig(?:nature)?|x-amz-signature)$/i;

function publicUrlFromSource(source) {
  const candidates = [source?.canonicalUrl, source?.destinationUrl, source?.url, source?.sourceUrl]
    .filter((value) => typeof value === "string" && value.trim());
  assert.ok(candidates.length > 0, "typed public offer identity requires a public URL preimage");
  const parsed = new URL(candidates[0]);
  assert.ok(["http:", "https:"].includes(parsed.protocol), "typed public offer identity URL protocol is invalid");
  assert.equal(Boolean(parsed.username || parsed.password), false, "typed public offer identity URL contains credentials");
  for (const name of parsed.searchParams.keys()) {
    assert.doesNotMatch(name, CREDENTIAL_QUERY_NAME, "typed public offer identity URL contains a credential-bearing query");
  }
  return parsed.toString();
}

function normalizedPath(path) {
  return path.replace(/\[\d+\]/g, "[*]");
}

function walk(value, visitor, path = "$", parentCollection = "", topLevelRoot = "") {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, visitor, `${path}[${index}]`, parentCollection, topLevelRoot));
    return;
  }
  if (!value || typeof value !== "object") return;
  visitor(value, path, parentCollection, topLevelRoot);
  for (const [key, child] of Object.entries(value)) {
    const root = path === "$" ? key : topLevelRoot;
    walk(child, visitor, `${path}.${key}`, key, root);
  }
}

function provenanceEntry({ path, value, preimagePath, reference = false }) {
  return Object.freeze({
    path,
    normalizedSchemaPath: normalizedPath(path),
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

  walk(record, (node, path, parentCollection, topLevelRoot) => {
    if (!TERMINAL_TYPED_ROOTS.has(topLevelRoot)) return;
    if (!PUBLIC_SOURCE_COLLECTIONS.has(parentCollection)) return;
    if (typeof node.evidenceId !== "string" || !node.evidenceId) return;
    let publicUrl;
    let recomputed;
    try {
      publicUrl = publicUrlFromSource(node);
      recomputed = underlyingOfferKey(node);
    } catch {
      return;
    }
    if (recomputed !== node.evidenceId) return;
    const evidencePath = `${path}.evidenceId`;
    const urlField = ["canonicalUrl", "destinationUrl", "url", "sourceUrl"]
      .find((key) => typeof node[key] === "string" && node[key].trim());
    const entry = provenanceEntry({
      path: evidencePath,
      value: node.evidenceId,
      preimagePath: `${path}.${urlField}`
    });
    primaryByPath.set(evidencePath, entry);
    const existing = catalog.get(node.evidenceId) || [];
    existing.push(Object.freeze({ entry, publicUrl }));
    catalog.set(node.evidenceId, existing);
  });

  const entries = [...primaryByPath.values()];
  walk(record, (node, path, _parentCollection, topLevelRoot) => {
    if (!TERMINAL_TYPED_ROOTS.has(topLevelRoot)) return;
    for (const [key, raw] of Object.entries(node)) {
      if (!PUBLIC_EVIDENCE_REFERENCE_FIELDS.has(key)) continue;
      const values = Array.isArray(raw) ? raw : [raw];
      values.forEach((value, index) => {
        if (typeof value !== "string" || !catalog.has(value)) return;
        const valuePath = Array.isArray(raw) ? `${path}.${key}[${index}]` : `${path}.${key}`;
        if (primaryByPath.has(valuePath)) return;
        const source = catalog.get(value)[0].entry;
        entries.push(provenanceEntry({
          path: valuePath,
          value,
          preimagePath: source.publicPreimagePath,
          reference: true
        }));
      });
    }
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
