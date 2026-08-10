import assert from "node:assert/strict";
import { underlyingOfferKey } from "../../../lib/evidence/dedupe.js";
import { sha256Json } from "./protocol.mjs";

export const PUBLIC_EVIDENCE_IDENTIFIER_TYPE = "CANONICAL_PUBLIC_OFFER_IDENTITY_V1";
export const PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM = "lib/evidence/dedupe.js#underlyingOfferKey";
export const PUBLIC_IDENTIFIER_REGISTRY_VERSION = "1.0";

const CREDENTIAL_QUERY_NAME = /^(?:api[-_]?key|access[-_]?token|auth(?:orization)?|credential|password|secret|session|sig(?:nature)?|x-amz-signature)$/i;

const DIRECT_SOURCE_PATHS = Object.freeze([
  "$.experienceRecord.exactEvidenceRecovered[*].evidenceId",
  "$.experienceRecord.sourcesAccepted[*].evidenceId",
  "$.responseDiagnostics.diagnosticSample[*].evidenceId",
  "$.responseDiagnostics.finalizedCustomerClassifications[*].evidenceId",
  "$.responseDiagnostics.objectIntelligence.experienceRecord.exactEvidenceRecovered[*].evidenceId",
  "$.responseDiagnostics.objectIntelligence.experienceRecord.sourcesAccepted[*].evidenceId"
]);

const DIRECT_REFERENCE_PATHS = Object.freeze([
  "$.responseDiagnostics.canonicalBadgeSupportEvidenceIds[*]",
  "$.responseDiagnostics.canonicalBadgeSupportUnderlyingOfferIds[*]",
  "$.responseDiagnostics.canonicalBuyerOfferSupportEvidenceIds[*]",
  "$.responseDiagnostics.canonicalBuyerOfferSupportUnderlyingOfferIds[*]",
  "$.responseDiagnostics.canonicalCustomerEvidenceIds[*]",
  "$.responseDiagnostics.canonicalDecisionSupportEvidenceIds[*]",
  "$.responseDiagnostics.canonicalDecisionSupportUnderlyingOfferIds[*]",
  "$.responseDiagnostics.canonicalIdentityConfidenceSupportEvidenceIds[*]",
  "$.responseDiagnostics.canonicalIdentityConfidenceSupportUnderlyingOfferIds[*]",
  "$.responseDiagnostics.canonicalPricingConfidenceSupportEvidenceIds[*]",
  "$.responseDiagnostics.canonicalPricingConfidenceSupportUnderlyingOfferIds[*]",
  "$.responseDiagnostics.canonicalRangeSupportEvidenceIds[*]",
  "$.responseDiagnostics.canonicalRangeSupportUnderlyingOfferIds[*]",
  "$.responseDiagnostics.canonicalRetailLimitSupportEvidenceIds[*]",
  "$.responseDiagnostics.canonicalRetailLimitSupportUnderlyingOfferIds[*]",
  "$.responseDiagnostics.displayedCustomerRecordIds[*]",
  "$.responseDiagnostics.displayedRecordIds[*]",
  "$.responseDiagnostics.finalizedCustomerRecordIds[*]",
  "$.responseDiagnostics.personalBuyEvidenceUtilityDecisions[*].evidenceId",
  "$.responseDiagnostics.personalBuyEvidenceUtilityDecisions[*].underlyingOfferId",
  "$.responseDiagnostics.recoveryAssessment.acceptedEvidenceIds[*]",
  "$.responseDiagnostics.recoveryAssessment.decisionSupportIds[*]",
  "$.responseDiagnostics.recoveryAssessment.recoveryStoppingSupportIds[*]",
  "$.responseDiagnostics.recoveryAssessment.recoveryTriggeringSupportIds[*]",
  "$.responseDiagnostics.recoveryAssessment.stoppingAcceptedEvidenceIds[*]",
  "$.responseDiagnostics.recoveryAssessment.stoppingUnderlyingOfferIds[*]",
  "$.responseDiagnostics.recoveryAssessment.underlyingOfferIds[*]"
]);

const REPORT_SOURCE_SUFFIXES = Object.freeze([
  "buyerOfferSupportRecords[*].evidenceId",
  "customerEvidence[*].evidenceId",
  "pricesFound[*].evidenceId",
  "searchDiagnostics.diagnosticSample[*].evidenceId",
  "searchDiagnostics.finalizedCustomerClassifications[*].evidenceId",
  "searchDiagnostics.objectIntelligence.experienceRecord.exactEvidenceRecovered[*].evidenceId",
  "searchDiagnostics.objectIntelligence.experienceRecord.sourcesAccepted[*].evidenceId"
]);

const REPORT_REFERENCE_SUFFIXES = Object.freeze([
  "badgeResult.supportingEvidenceIds[*]",
  "badgeResult.supportingUnderlyingOfferIds[*]",
  "badgeSupportEvidenceIds[*]",
  "badgeSupportUnderlyingOfferIds[*]",
  "buyerOfferResult.quantityContext.retailLimitQuantityContext.supportQuantities[*].evidenceId",
  "buyerOfferResult.quantityContext.supportQuantities[*].evidenceId",
  "buyerOfferResult.rangeSupportIds[*]",
  "buyerOfferResult.retailLimitSupportIds[*]",
  "buyerOfferResult.supportingEvidenceIds[*]",
  "buyerOfferResult.supportingUnderlyingOfferIds[*]",
  "buyerOfferSupportEvidenceIds[*]",
  "buyerOfferSupportRecords[*].underlyingOfferId",
  "buyerOfferSupportUnderlyingOfferIds[*]",
  "confidenceResult.identity.supportingEvidenceIds[*]",
  "confidenceResult.identity.supportingUnderlyingOfferIds[*]",
  "confidenceResult.pricing.supportingEvidenceIds[*]",
  "confidenceResult.pricing.supportingUnderlyingOfferIds[*]",
  "customerEvidenceSummary.acceptedIds[*]",
  "customerEvidenceSummary.customerEligibleIds[*]",
  "customerEvidenceSummary.decisionEligibleIds[*]",
  "customerEvidenceSummary.displayEligibleIds[*]",
  "customerEvidenceSummary.displayedIds[*]",
  "customerEvidenceSummary.exactMatchIds[*]",
  "customerEvidenceSummary.priceBearingIds[*]",
  "customerEvidenceSummary.rangeEligibleIds[*]",
  "customerEvidence[*].underlyingOfferId",
  "decisionResult.canonicalComparisonResult.supportingEvidenceIds[*]",
  "decisionResult.canonicalComparisonResult.supportingUnderlyingOfferIds[*]",
  "decisionResult.rangeSupportIds[*]",
  "decisionResult.retailLimitSupportIds[*]",
  "decisionResult.supportingEvidenceIds[*]",
  "decisionResult.supportingUnderlyingOfferIds[*]",
  "decisionSupportEvidenceIds[*]",
  "decisionSupportUnderlyingOfferIds[*]",
  "identityConfidenceSupportEvidenceIds[*]",
  "identityConfidenceSupportUnderlyingOfferIds[*]",
  "pricesFound[*].underlyingOfferId",
  "pricingConfidenceSupportEvidenceIds[*]",
  "pricingConfidenceSupportUnderlyingOfferIds[*]",
  "rangeResult.evidenceIds[*]",
  "rangeResult.underlyingOfferIds[*]",
  "rangeResults.currentRetail.evidenceIds[*]",
  "rangeResults.currentRetail.underlyingOfferIds[*]",
  "rangeSupportEvidenceIds[*]",
  "rangeSupportUnderlyingOfferIds[*]",
  "rangeSupportingEvidenceIds[*]",
  "rangeSupportingUnderlyingOfferIds[*]",
  "retailLimitResult.evidenceIds[*]",
  "retailLimitResult.quantityContext.supportQuantities[*].evidenceId",
  "retailLimitResult.selectedEvidenceId",
  "retailLimitResult.selectedUnderlyingOfferId",
  "retailLimitResult.underlyingOfferIds[*]",
  "retailLimitSupportEvidenceIds[*]",
  "retailLimitSupportUnderlyingOfferIds[*]",
  "retailPriceLimitSupportingEvidenceIds[*]",
  "retailPriceLimitSupportingUnderlyingOfferIds[*]",
  "searchDiagnostics.canonicalBadgeSupportEvidenceIds[*]",
  "searchDiagnostics.canonicalBadgeSupportUnderlyingOfferIds[*]",
  "searchDiagnostics.canonicalBuyerOfferSupportEvidenceIds[*]",
  "searchDiagnostics.canonicalBuyerOfferSupportUnderlyingOfferIds[*]",
  "searchDiagnostics.canonicalCustomerEvidenceIds[*]",
  "searchDiagnostics.canonicalDecisionSupportEvidenceIds[*]",
  "searchDiagnostics.canonicalDecisionSupportUnderlyingOfferIds[*]",
  "searchDiagnostics.canonicalIdentityConfidenceSupportEvidenceIds[*]",
  "searchDiagnostics.canonicalIdentityConfidenceSupportUnderlyingOfferIds[*]",
  "searchDiagnostics.canonicalPricingConfidenceSupportEvidenceIds[*]",
  "searchDiagnostics.canonicalPricingConfidenceSupportUnderlyingOfferIds[*]",
  "searchDiagnostics.canonicalRangeSupportEvidenceIds[*]",
  "searchDiagnostics.canonicalRangeSupportUnderlyingOfferIds[*]",
  "searchDiagnostics.canonicalRetailLimitSupportEvidenceIds[*]",
  "searchDiagnostics.canonicalRetailLimitSupportUnderlyingOfferIds[*]",
  "searchDiagnostics.displayedCustomerRecordIds[*]",
  "searchDiagnostics.displayedRecordIds[*]",
  "searchDiagnostics.finalizedCustomerRecordIds[*]",
  "searchDiagnostics.personalBuyEvidenceUtilityDecisions[*].evidenceId",
  "searchDiagnostics.personalBuyEvidenceUtilityDecisions[*].underlyingOfferId",
  "searchDiagnostics.recoveryAssessment.acceptedEvidenceIds[*]",
  "searchDiagnostics.recoveryAssessment.decisionSupportIds[*]",
  "searchDiagnostics.recoveryAssessment.recoveryStoppingSupportIds[*]",
  "searchDiagnostics.recoveryAssessment.recoveryTriggeringSupportIds[*]",
  "searchDiagnostics.recoveryAssessment.stoppingAcceptedEvidenceIds[*]",
  "searchDiagnostics.recoveryAssessment.stoppingUnderlyingOfferIds[*]",
  "searchDiagnostics.recoveryAssessment.underlyingOfferIds[*]"
]);

function terminalRootFor(normalizedSchemaPath) {
  return normalizedSchemaPath.slice(2).split(/[.[]/, 1)[0];
}

function terminalPropertyFor(normalizedSchemaPath) {
  return normalizedSchemaPath.split(".").at(-1).replace("[*]", "");
}

function arraySegmentsFor(normalizedSchemaPath) {
  return Object.freeze([...normalizedSchemaPath.matchAll(/([^.[\]]+)\[\*\]/g)].map((match) => match[1]));
}

function registryEntry(normalizedSchemaPath, role) {
  const terminalRoot = terminalRootFor(normalizedSchemaPath);
  return Object.freeze({
    registryContractId: `typed-public-identifier:${normalizedSchemaPath}`,
    normalizedSchemaPath,
    terminalRoot,
    completePropertyPath: normalizedSchemaPath,
    arrayIndexSegments: arraySegmentsFor(normalizedSchemaPath),
    canonicalIndexNormalization: "DECLARED_NUMERIC_ARRAY_SEGMENTS_TO_WILDCARD_ONLY",
    terminalPropertyName: terminalPropertyFor(normalizedSchemaPath),
    requiredValueType: "string",
    identifierType: PUBLIC_EVIDENCE_IDENTIFIER_TYPE,
    generatingContract: PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM,
    requiredPublicPreimage: "SIBLING_PUBLIC_HTTP_OR_HTTPS_URL_WITHOUT_CREDENTIALS",
    recomputationInputs: Object.freeze(["complete source record", "canonical public URL", "seller partition where present"]),
    applicableTerminalSchemaNode: terminalRoot === "sanitizedTerminalResponseEnvelope"
      ? normalizedSchemaPath.includes(".body.valuation.") ? "HANDLER_SUCCESS_ENVELOPE.body.valuation" : "HANDLER_SUCCESS_ENVELOPE.body.listing"
      : `BENCHMARK_TERMINAL_RESULT.${terminalRoot}`,
    role
  });
}

const reportEntries = [];
for (const envelope of ["valuation", "listing"]) {
  for (const suffix of REPORT_SOURCE_SUFFIXES) reportEntries.push(registryEntry(
    `$.sanitizedTerminalResponseEnvelope.body.${envelope}.${suffix}`,
    suffix.startsWith("searchDiagnostics.") ? "PUBLIC_SOURCE_OR_HASH_BOUND_REFERENCE" : "PUBLIC_SOURCE"
  ));
  for (const suffix of REPORT_REFERENCE_SUFFIXES) reportEntries.push(registryEntry(`$.sanitizedTerminalResponseEnvelope.body.${envelope}.${suffix}`, "HASH_BOUND_REFERENCE"));
}

export const AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY = Object.freeze([
  ...DIRECT_SOURCE_PATHS.map((path) => registryEntry(path, "PUBLIC_SOURCE_OR_HASH_BOUND_REFERENCE")),
  ...DIRECT_REFERENCE_PATHS.map((path) => registryEntry(path, "HASH_BOUND_REFERENCE")),
  ...reportEntries
].sort((left, right) => left.normalizedSchemaPath.localeCompare(right.normalizedSchemaPath)));

assert.equal(
  new Set(AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY.map((entry) => entry.normalizedSchemaPath)).size,
  AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY.length,
  "typed public identifier registry contains duplicate complete paths"
);

export const AUTHORIZED_NORMALIZED_PUBLIC_IDENTIFIER_PATHS = Object.freeze(
  AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY.map((entry) => entry.normalizedSchemaPath)
);

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function actualPathPattern(normalizedSchemaPath) {
  const source = normalizedSchemaPath
    .split("[*]")
    .map(escapePattern)
    .join("\\[(?:0|[1-9]\\d*)\\]");
  return new RegExp(`^${source}$`);
}

const COMPILED_REGISTRY = Object.freeze(AUTHORIZED_PUBLIC_IDENTIFIER_PATH_REGISTRY.map((entry) => Object.freeze({
  entry,
  actualPathPattern: actualPathPattern(entry.normalizedSchemaPath)
})));

function contractForActualPath(path) {
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
    const contract = contractForActualPath(path);
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
    const contract = contractForActualPath(path);
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
