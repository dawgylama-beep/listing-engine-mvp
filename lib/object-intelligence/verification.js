import { buildIdentifierEquivalenceSet, extractIdentifiers, isValidRetailIdentifier } from "../evidence/identity.js";
import { boundedUniqueStrings, cleanObjectText, normalizeObjectText, stableInternalId } from "./stable.js";

export const OBJECT_EVIDENCE_CLASSIFICATION = Object.freeze({
  EXACT_ITEM: "EXACT_ITEM",
  EXACT_DESIGN_VARIATION_UNRESOLVED: "EXACT_DESIGN_VARIATION_UNRESOLVED",
  COMPATIBLE_ALTERNATIVE: "COMPATIBLE_ALTERNATIVE",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  SIMILAR_OBJECT: "SIMILAR_OBJECT",
  UNRELATED: "UNRELATED"
});

function recordText(record = {}) {
  return cleanObjectText([
    record.title,
    record.snippet,
    record.rawTextSource ? record.rawText : "",
    record.sourceEvidenceText,
    record.pageEvidenceText,
    record.pageExtractedText,
    record.productPageText,
    record.model,
    record.sku,
    record.productName,
    record.brand,
    record.manufacturer,
    record.packageQuantity,
    record.dimensions,
    record.designIdentity
  ].filter(Boolean).join(" | "), 5000);
}

function containsPhrase(text, value) {
  const needle = normalizeObjectText(value);
  if (!needle) return false;
  if (needle.length <= 3) return new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(text);
  return text.includes(needle);
}

function numbersFromCount(value) {
  return [...String(value || "").matchAll(/\b(\d{1,5})\s*(?:count|ct\.?|pack|pk|pieces?|pcs?\.?|units?)\b/gi)]
    .map((match) => Number(match[1]))
    .filter((item) => Number.isFinite(item) && item > 0);
}

function dimensionsFromText(value) {
  const match = String(value || "").match(/\b(\d+(?:\.\d+)?)\s*(?:x|\u00d7|by)\s*(\d+(?:\.\d+)?)/i);
  return match ? [Number(match[1]), Number(match[2])].sort((a, b) => a - b) : [];
}

function targetValues(state = {}, factTypes = []) {
  return (state.observedFacts || [])
    .filter((fact) => factTypes.includes(fact.factType))
    .map((fact) => fact.value);
}

function compareAttribute(comparisons, attribute, objectValues, candidateText, { required = false } = {}) {
  const values = boundedUniqueStrings(objectValues, 12, 180);
  if (!values.length) return null;
  const matched = values.find((value) => containsPhrase(candidateText, value));
  const comparison = {
    attribute,
    objectValue: values.join(" | "),
    candidateValue: matched || "",
    status: matched ? "SUPPORTED" : required ? "UNRESOLVED" : "NOT_OBSERVED"
  };
  comparisons.push(comparison);
  return comparison;
}

function identifierMatch(record = {}, state = {}, target = state.resolvedIdentity?.validatedBarcode) {
  if (!target) return false;
  const candidateIdentifiers = new Set([
    ...extractIdentifiers(recordText(record)),
    ...boundedUniqueStrings([
      record.sourceIdentifiers,
      record.exactPageMatchedBarcodeIdentities,
      record.exactRetailPageEvidence?.matchingBarcodeIdentities
    ].flat(), 12).flatMap(buildIdentifierEquivalenceSet)
  ]);
  return buildIdentifierEquivalenceSet(target).some((item) => candidateIdentifiers.has(item));
}

function candidateRetailIdentifiers(record = {}) {
  return [...new Set([
    ...extractIdentifiers(recordText(record)),
    ...boundedUniqueStrings([
      record.sourceIdentifiers,
      record.exactPageMatchedBarcodeIdentities,
      record.exactRetailPageEvidence?.matchingBarcodeIdentities
    ].flat(), 12).flatMap(buildIdentifierEquivalenceSet)
  ].filter((value) => /^\d+$/.test(value) && isValidRetailIdentifier(value)))];
}

function isIdentityBearingModel(value = "") {
  const normalized = normalizeObjectText(value);
  return normalized.length >= 3
    && /[a-z]/i.test(normalized)
    && /\d/.test(normalized)
    && !/^(?:model|series|type)\s*\d{1,2}$/i.test(normalized);
}

function independentSupportedValues(values = [], text = "", excludedValues = []) {
  const excluded = boundedUniqueStrings(excludedValues, 24, 180).map(normalizeObjectText);
  return boundedUniqueStrings(values, 24, 180).filter((value) => {
    const normalized = normalizeObjectText(value);
    if (normalized.length < 4 || !containsPhrase(text, value)) return false;
    return !excluded.some((excludedValue) => (
      normalized === excludedValue
      || normalized.includes(excludedValue)
      || excludedValue.includes(normalized)
    ));
  });
}

function explicitModelConflict(candidateText, model, brandSupported) {
  if (!model || !brandSupported) return "";
  const normalizedModel = normalizeObjectText(model);
  const alphaPrefix = normalizedModel.match(/^[a-z]{2,}/)?.[0];
  if (!alphaPrefix) return "";
  const models = [...candidateText.matchAll(new RegExp(`\\b${alphaPrefix}[a-z0-9-]{2,}\\b`, "gi"))].map((match) => match[0]);
  return models.find((candidate) => {
    const normalizedCandidate = normalizeObjectText(candidate);
    return normalizedCandidate !== normalizedModel && !normalizedCandidate.startsWith(`${normalizedModel}-`);
  }) || "";
}

function hasEstablishedCompatibleAlternativeEvidence(record = {}) {
  const candidateClassification = normalizeObjectText(record.candidateObjectClassification);
  const familyOutcome = normalizeObjectText(record.productFamilyCompatibilityOutcome);
  const contradictions = Array.isArray(record.contradictoryEvidence)
    ? record.contradictoryEvidence.filter(Boolean)
    : [];
  return record.retailPriceDecisionEligibility === true
    && record.transactionalRetailerEvidence === true
    && record.itemTypeCompatible !== false
    && candidateClassification === "same object compatible alternative"
    && familyOutcome === "compatible"
    && contradictions.length === 0;
}

export function verifyObjectEvidenceCandidate(state = {}, record = {}) {
  const text = normalizeObjectText(recordText(record));
  const resolved = state.resolvedIdentity || {};
  const owningHypothesisId = cleanObjectText(record.owningHypothesisId || record.objectMindHypothesisId, 80);
  const owningHypothesis = (state.identityHypotheses || []).find((candidate) => candidate.candidateId === owningHypothesisId);
  const selected = owningHypothesis
    || (state.identityHypotheses || []).find((candidate) => candidate.candidateId === resolved.selectedCandidateId)
    || {};
  const evaluatingAlternate = Boolean(owningHypothesis && owningHypothesis.candidateId !== resolved.selectedCandidateId);
  const targetBarcode = evaluatingAlternate ? "" : resolved.validatedBarcode;
  const targetBrand = selected.brandOrMaker || resolved.brandOrMaker;
  const targetModel = selected.model || (evaluatingAlternate ? "" : resolved.model);
  const targetProductIdentity = selected.exactCandidateLabel
    || (!evaluatingAlternate && resolved.exactnessClassification === "EXACT_ITEM" ? resolved.bestSupportedCustomerIdentity : "");
  const comparisons = [];
  const conflicts = [];
  const support = [];
  const exactIdentifier = identifierMatch(record, state, targetBarcode);
  const brandValues = boundedUniqueStrings([targetBrand, ...(evaluatingAlternate ? [] : targetValues(state, ["brand", "maker_mark"]))], 10, 120);
  const modelValues = boundedUniqueStrings([targetModel, ...(evaluatingAlternate ? [] : targetValues(state, ["model_number", "model"]))], 8, 120);
  const productValues = boundedUniqueStrings([
    targetProductIdentity,
    ...(evaluatingAlternate ? [] : targetValues(state, ["product_name"]))
  ], 10, 180);
  const broadValues = boundedUniqueStrings([
    selected.broaderFamilyIdentity,
    resolved.broaderFallbackIdentity
  ], 6, 180);
  const designValues = boundedUniqueStrings(targetValues(state, ["visible_text", "logo", "maker_mark", "design", "diagnostic_visual_detail"]), 16, 160);
  const shapeValues = targetValues(state, ["shape", "component_arrangement"]);
  const materialValues = targetValues(state, ["material", "construction"]);
  const colorValues = targetValues(state, ["color"]);
  const brandSupported = brandValues.some((value) => containsPhrase(text, value));
  const modelSupported = modelValues.some((value) => containsPhrase(text, value));
  const productSupported = productValues.some((value) => containsPhrase(text, value));
  const broadSupported = broadValues.some((value) => containsPhrase(text, value));
  const designSupported = designValues.filter((value) => containsPhrase(text, value));
  const shapeSupported = shapeValues.some((value) => containsPhrase(text, value));
  const materialSupported = materialValues.some((value) => containsPhrase(text, value));
  const colorSupported = colorValues.some((value) => containsPhrase(text, value));
  const establishedCompatibleAlternative = hasEstablishedCompatibleAlternativeEvidence(record);

  comparisons.push({
    attribute: "barcode",
    objectValue: targetBarcode || "",
    candidateValue: exactIdentifier ? targetBarcode : "",
    status: targetBarcode ? exactIdentifier ? "SUPPORTED" : "UNRESOLVED" : "NOT_APPLICABLE"
  });
  compareAttribute(comparisons, "brand_or_maker", brandValues, text, { required: Boolean(brandValues.length) });
  compareAttribute(comparisons, "model", modelValues, text, { required: Boolean(modelValues.length) });
  compareAttribute(comparisons, "product_identity", productValues, text);
  compareAttribute(comparisons, "broader_family", broadValues, text);
  compareAttribute(comparisons, "material_or_construction", materialValues, text);
  compareAttribute(comparisons, "shape_or_arrangement", shapeValues, text);
  compareAttribute(comparisons, "color", colorValues, text);

  if (exactIdentifier) support.push("Validated identifier matches the observed object.");
  if (brandSupported) support.push("Brand or maker matches.");
  if (modelSupported) support.push("Model matches.");
  if (productSupported) support.push("Exact product wording matches.");
  if (broadSupported) support.push("Broader object family matches.");
  if (designSupported.length) support.push(`Design or marking support: ${designSupported.slice(0, 4).join(", ")}.`);
  if (materialSupported) support.push("Material or construction matches.");
  if (shapeSupported) support.push("Shape or component arrangement matches.");
  if (colorSupported) support.push("Color matches.");

  const targetCounts = [
    ...targetValues(state, ["package_count", "package_quantity"]).flatMap(numbersFromCount),
    ...numbersFromCount(selected.variantPackageEditionDesign),
    ...numbersFromCount(targetProductIdentity)
  ];
  const candidateSurfaceText = cleanObjectText([
    record.title,
    record.snippet,
    record.rawText,
    record.packageQuantity
  ].filter(Boolean).join(" | "), 3000);
  const candidateCounts = [
    ...numbersFromCount(candidateSurfaceText),
    ...(Number.isInteger(Number(record.quantity)) && Number(record.quantity) > 1 ? [Number(record.quantity)] : [])
  ];
  const packageCountSupported = targetCounts.length > 0
    && candidateCounts.length > 0
    && candidateCounts.some((count) => targetCounts.includes(count));
  if (packageCountSupported) support.push("Package count or configuration matches.");
  if (targetCounts.length && candidateCounts.length && candidateCounts.some((count) => !targetCounts.includes(count))) {
    conflicts.push(`Package count differs: expected ${[...new Set(targetCounts)].join("/")}, candidate shows ${[...new Set(candidateCounts)].join("/")}.`);
  }
  const targetDimensions = targetValues(state, ["dimensions"]).flatMap(dimensionsFromText);
  const candidateDimensions = dimensionsFromText(text);
  let dimensionsSupported = false;
  if (targetDimensions.length >= 2 && candidateDimensions.length >= 2) {
    const expected = targetDimensions.slice(0, 2).sort((a, b) => a - b);
    const actual = candidateDimensions.slice(0, 2).sort((a, b) => a - b);
    if (expected.some((dimension, index) => Math.abs(dimension - actual[index]) / Math.max(dimension, 1) > 0.15)) {
      conflicts.push(`Dimensions differ: expected ${expected.join(" x ")}, candidate shows ${actual.join(" x ")}.`);
    } else {
      dimensionsSupported = true;
      support.push("Dimensions match within the bounded tolerance.");
    }
  }
  const modelConflict = explicitModelConflict(text, targetModel, brandSupported);
  if (modelConflict) conflicts.push(`Candidate shows a different family model: ${modelConflict}.`);

  const candidateIdentifiers = candidateRetailIdentifiers(record);
  if (targetBarcode && candidateIdentifiers.length && !exactIdentifier) {
    conflicts.push("Candidate shows a different authoritative retail identifier.");
  }
  if (record.itemTypeCompatible === false && /(?:conflict|incompatible|mismatch|different|wrong object type)/i.test(
    `${record.itemTypeCompatibilityStatus || ""} ${record.itemTypeCompatibilityExplanation || ""}`
  )) {
    conflicts.push("Candidate item type materially conflicts with the observed object.");
  }
  for (const contradiction of boundedUniqueStrings(record.contradictoryEvidence, 8, 240)) {
    conflicts.push(`Established candidate contradiction: ${contradiction}.`);
  }

  const strongSupportCount = [brandSupported, modelSupported, productSupported, broadSupported, materialSupported, colorSupported].filter(Boolean).length
    + Math.min(2, designSupported.length);
  const independentDesignSupport = independentSupportedValues(
    designSupported,
    text,
    [
      ...brandValues,
      ...modelValues,
      ...productValues,
      ...broadValues,
      ...materialValues,
      ...colorValues,
      ...shapeValues,
      ...targetValues(state, ["package_count", "package_quantity", "dimensions"])
    ]
  );
  const discriminatorGroups = [
    brandSupported ? "maker" : "",
    modelSupported ? "model" : "",
    productSupported ? "product_identity" : "",
    independentDesignSupport.length ? "visible_mark_or_design" : "",
    packageCountSupported ? "package_configuration" : "",
    dimensionsSupported ? "dimensions" : "",
    shapeSupported ? "shape_or_arrangement" : "",
    materialSupported && independentDesignSupport.length ? "construction" : ""
  ].filter(Boolean);
  const authoritativeIdentifierMatched = exactIdentifier
    || (brandSupported && modelSupported && isIdentityBearingModel(targetModel));
  const multiDiscriminatorExact = discriminatorGroups.length >= 3
    && (discriminatorGroups.some((group) => ["maker", "model", "product_identity"].includes(group)) || independentDesignSupport.length >= 2)
    && discriminatorGroups.some((group) => ["model", "product_identity", "visible_mark_or_design", "package_configuration", "dimensions", "shape_or_arrangement"].includes(group))
    && discriminatorGroups.filter((group) => !["maker", "construction"].includes(group)).length >= 2;
  const exactTypeCoherenceEstablished = !/normalized_type_compatible_not_exact/i.test(
    cleanObjectText(record.itemTypeCoherenceStatus, 100)
  );
  const verifiedExact = exactTypeCoherenceEstablished
    && !conflicts.length
    && (authoritativeIdentifierMatched || multiDiscriminatorExact);
  const activeHypothesisSupport = Boolean(
    productSupported
    || modelSupported
    || independentDesignSupport.length
    || (brandSupported && (packageCountSupported || dimensionsSupported || shapeSupported))
  );
  let classification;
  let verificationState;
  let rejectionReason = "";
  if (conflicts.length) {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.SIMILAR_OBJECT;
    verificationState = "REJECTED";
    rejectionReason = conflicts.join(" ");
  } else if (verifiedExact) {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM;
    verificationState = "VERIFIED";
  } else if ((productSupported || broadSupported) && designSupported.length >= 2) {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.EXACT_DESIGN_VARIATION_UNRESOLVED;
    verificationState = "UNRESOLVED_VARIATION";
    rejectionReason = "The same design family is supported, but edition, package, or variation remains unresolved.";
  } else if (establishedCompatibleAlternative) {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.COMPATIBLE_ALTERNATIVE;
    verificationState = "COMPATIBLE";
    rejectionReason = "Established enrichment supports a qualified compatible alternative, but exact item identity is not established.";
  } else if (activeHypothesisSupport) {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.INSUFFICIENT_EVIDENCE;
    verificationState = "UNRESOLVED";
    rejectionReason = "The candidate plausibly supports an active identity hypothesis, but source-backed identity facts are insufficient for exact-versus-similar adjudication.";
  } else if ((brandSupported || broadSupported) && strongSupportCount >= 2) {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.COMPATIBLE_ALTERNATIVE;
    verificationState = "COMPATIBLE";
    rejectionReason = "The candidate is compatible but exact item identity is not established.";
  } else if (strongSupportCount > 0 || record.itemTypeCompatible === true) {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.SIMILAR_OBJECT;
    verificationState = "REJECTED";
    rejectionReason = "Only broad category or partial visual similarity is supported.";
  } else {
    classification = OBJECT_EVIDENCE_CLASSIFICATION.UNRELATED;
    verificationState = "REJECTED";
    rejectionReason = "No object-state identity discriminator was supported by the candidate.";
  }

  const directPageEligible = !conflicts.length && (
    classification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM
    || classification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_DESIGN_VARIATION_UNRESOLVED
    || (classification === OBJECT_EVIDENCE_CLASSIFICATION.INSUFFICIENT_EVIDENCE && activeHypothesisSupport)
    || (classification === OBJECT_EVIDENCE_CLASSIFICATION.COMPATIBLE_ALTERNATIVE && strongSupportCount >= 3)
  );
  const url = cleanObjectText(record.destinationUrl || record.canonicalUrl || record.url, 1000);
  return {
    sourceId: stableInternalId("source", [url, record.title], 16),
    url,
    owningHypothesisId: cleanObjectText(record.owningHypothesisId || record.objectMindHypothesisId || selected.candidateId, 80),
    sourceRole: cleanObjectText(record.evidenceRole || record.sourceType || "candidate_source", 100),
    candidateItemIdentity: cleanObjectText(record.title || record.productName || url, 240),
    supportingAttributes: comparisons.filter((item) => item.status === "SUPPORTED"),
    conflictingAttributes: conflicts.map((reason) => ({ reason })),
    exactnessClassification: classification,
    verificationState,
    rejectionReason,
    directPageEligible,
    directPageVerified: Boolean(record.sourceEvidenceText || record.exactPageRecoveryStatus === "verified" || /direct/i.test(record.sourceQuality || record.evidencePath || "")),
    supportReasons: support.slice(0, 12)
  };
}

export function applyObjectEvidenceVerification(state = {}, records = []) {
  return records.map((record) => {
    const verification = verifyObjectEvidenceCandidate(state, record);
    const rejected = verification.verificationState === "REJECTED";
    const exact = verification.exactnessClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_ITEM;
    const exactDesign = verification.exactnessClassification === OBJECT_EVIDENCE_CLASSIFICATION.EXACT_DESIGN_VARIATION_UNRESOLVED;
    return {
      ...record,
      objectMindSourceId: verification.sourceId,
      objectMindHypothesisId: verification.owningHypothesisId,
      objectMindClassification: verification.exactnessClassification,
      objectMindVerificationState: verification.verificationState,
      objectMindSupportingAttributes: verification.supportingAttributes,
      objectMindConflictingAttributes: verification.conflictingAttributes,
      objectMindRejectionReason: verification.rejectionReason,
      objectMindDirectPageEligible: verification.directPageEligible,
      objectMindDirectPageVerified: verification.directPageVerified,
      exactIdentity: exact,
      retained: rejected ? false : record.retained,
      identityMatchStrength: rejected
        ? "Rejected"
        : exact
          ? "Exact"
          : exactDesign
            ? "Strong Similar"
            : record.identityMatchStrength,
      rejectionReason: rejected ? verification.rejectionReason : record.rejectionReason,
      itemIdentityDifferences: rejected || exactDesign ? verification.rejectionReason : record.itemIdentityDifferences
    };
  });
}
