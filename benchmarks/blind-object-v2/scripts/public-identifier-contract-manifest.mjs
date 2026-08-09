import assert from "node:assert/strict";
import { sha256Json } from "./protocol.mjs";

export const PUBLIC_IDENTIFIER_CONTRACT_MANIFEST_VERSION = "1.0";
export const PUBLIC_EVIDENCE_IDENTIFIER_TYPE = "CANONICAL_PUBLIC_OFFER_IDENTITY_V1";
export const PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM = "lib/evidence/dedupe.js#underlyingOfferKey";

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
  return [...normalizedSchemaPath.matchAll(/([^.[\]]+)\[\*\]/g)].map((match) => match[1]);
}

function contract(normalizedSchemaPath, role) {
  const terminalRoot = terminalRootFor(normalizedSchemaPath);
  return {
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
    recomputationInputs: ["complete source record", "canonical public URL", "seller partition where present"],
    credentialPrecedence: "CREDENTIAL_CLASSIFIERS_ALWAYS_REJECT_BEFORE_PUBLIC_IDENTIFIER_ACCEPTANCE",
    applicableTerminalSchemaNode: terminalRoot === "sanitizedTerminalResponseEnvelope"
      ? normalizedSchemaPath.includes(".body.valuation.") ? "HANDLER_SUCCESS_ENVELOPE.body.valuation" : "HANDLER_SUCCESS_ENVELOPE.body.listing"
      : `BENCHMARK_TERMINAL_RESULT.${terminalRoot}`,
    role
  };
}

const contracts = [
  ...DIRECT_SOURCE_PATHS.map((path) => contract(path, "PUBLIC_SOURCE_OR_HASH_BOUND_REFERENCE")),
  ...DIRECT_REFERENCE_PATHS.map((path) => contract(path, "HASH_BOUND_REFERENCE")),
  ...["valuation", "listing"].flatMap((envelope) => [
    ...REPORT_SOURCE_SUFFIXES.map((suffix) => contract(
      `$.sanitizedTerminalResponseEnvelope.body.${envelope}.${suffix}`,
      suffix.startsWith("searchDiagnostics.") ? "PUBLIC_SOURCE_OR_HASH_BOUND_REFERENCE" : "PUBLIC_SOURCE"
    )),
    ...REPORT_REFERENCE_SUFFIXES.map((suffix) => contract(`$.sanitizedTerminalResponseEnvelope.body.${envelope}.${suffix}`, "HASH_BOUND_REFERENCE"))
  ])
].sort((left, right) => left.normalizedSchemaPath.localeCompare(right.normalizedSchemaPath));

assert.equal(new Set(contracts.map((entry) => entry.normalizedSchemaPath)).size, contracts.length);
assert.equal(new Set(contracts.map((entry) => entry.registryContractId)).size, contracts.length);

const qualificationInventory = contracts.map((entry, index) => ({
  ordinal: index + 1,
  registryContractId: entry.registryContractId,
  normalizedSchemaPath: entry.normalizedSchemaPath,
  positiveFixture: {
    fixtureId: `public-identifier-positive-${String(index + 1).padStart(3, "0")}`,
    actualPath: entry.normalizedSchemaPath.replaceAll("[*]", "[0]"),
    expectedContractId: entry.registryContractId
  },
  negativeFixtures: [
    {
      fixtureId: `public-identifier-extra-nesting-${String(index + 1).padStart(3, "0")}`,
      actualPath: entry.normalizedSchemaPath.replace("$.", "$.undeclared.").replaceAll("[*]", "[0]"),
      expectedContractId: "NO_CONTRACT_MATCH"
    },
    {
      fixtureId: `public-identifier-path-mutation-${String(index + 1).padStart(3, "0")}`,
      actualPath: `${entry.normalizedSchemaPath.replaceAll("[*]", "[0]")}.undeclared`,
      expectedContractId: "NO_CONTRACT_MATCH"
    }
  ],
  documentationInventoryEntry: `${entry.registryContractId} | ${entry.applicableTerminalSchemaNode} | ${entry.requiredPublicPreimage} | ${entry.credentialPrecedence}`
}));

const core = {
  schemaVersion: PUBLIC_IDENTIFIER_CONTRACT_MANIFEST_VERSION,
  manifestType: "PUBLIC_IDENTIFIER_CONTRACT_MANIFEST",
  identifierType: PUBLIC_EVIDENCE_IDENTIFIER_TYPE,
  generatingContract: PUBLIC_EVIDENCE_IDENTIFIER_ALGORITHM,
  credentialPrecedence: "CREDENTIAL_CLASSIFIERS_ALWAYS_REJECT_BEFORE_PUBLIC_IDENTIFIER_ACCEPTANCE",
  contracts,
  contractAggregateHash: sha256Json(contracts),
  qualificationInventory,
  qualificationInventoryHash: sha256Json(qualificationInventory)
};

export const PUBLIC_IDENTIFIER_CONTRACT_MANIFEST = Object.freeze({
  ...core,
  manifestHash: sha256Json(core)
});

export function validatePublicIdentifierContractManifest(manifest = PUBLIC_IDENTIFIER_CONTRACT_MANIFEST) {
  assert.equal(manifest.schemaVersion, PUBLIC_IDENTIFIER_CONTRACT_MANIFEST_VERSION);
  assert.equal(manifest.manifestType, "PUBLIC_IDENTIFIER_CONTRACT_MANIFEST");
  assert.equal(manifest.contracts.length, 213);
  assert.equal(new Set(manifest.contracts.map((entry) => entry.normalizedSchemaPath)).size, 213);
  assert.equal(new Set(manifest.contracts.map((entry) => entry.registryContractId)).size, 213);
  assert.equal(sha256Json(manifest.contracts), manifest.contractAggregateHash);
  assert.equal(manifest.qualificationInventory.length, manifest.contracts.length);
  assert.equal(sha256Json(manifest.qualificationInventory), manifest.qualificationInventoryHash);
  for (const [index, inventory] of manifest.qualificationInventory.entries()) {
    assert.equal(inventory.registryContractId, manifest.contracts[index].registryContractId);
    assert.equal(inventory.positiveFixture.expectedContractId, inventory.registryContractId);
    assert.equal(inventory.negativeFixtures.every((fixture) => fixture.expectedContractId === "NO_CONTRACT_MATCH"), true);
  }
  const copy = structuredClone(manifest); delete copy.manifestHash;
  assert.equal(sha256Json(copy), manifest.manifestHash);
  return Object.freeze({ valid: true, manifestHash: manifest.manifestHash, contractCount: 213 });
}

export function actualPathPatternSource(normalizedSchemaPath) {
  const escaped = normalizedSchemaPath
    .split("[*]")
    .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("\\[(?:0|[1-9]\\d*)\\]");
  return `^${escaped}$`;
}

export function buildGeneratedProvenanceSchema() {
  validatePublicIdentifierContractManifest();
  return Object.freeze({
    pathPatterns: contracts.map((entry) => actualPathPatternSource(entry.normalizedSchemaPath)),
    normalizedSchemaPaths: contracts.map((entry) => entry.normalizedSchemaPath),
    registryContractIds: contracts.map((entry) => entry.registryContractId),
    terminalSchemaNodes: [...new Set(contracts.map((entry) => entry.applicableTerminalSchemaNode))].sort()
  });
}
