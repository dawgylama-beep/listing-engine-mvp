import {
  boundedUniqueStrings,
  cleanObjectText,
  normalizeObjectText,
  sha256Object,
  stableInternalId
} from "./stable.js";

const UNKNOWN_IDENTITY = /^(?:unknown(?: subject)?|none|not visible|not provided|not known|not verified|unverified|n\/a|na)$/i;
const NON_IDENTITY_CLAIM = /^(?:unverified exact product|exact item|exact product|likely item|item identity|product identity|not established)/i;
const UNCERTAIN_IDENTITY_CLAIM = /\b(?:appears?\s+to|cannot\s+be\s+(?:read|transcribed)|could\s+be|illegible|may\s+(?:be|read)|might\s+(?:be|read)|not\s+(?:fully\s+)?certain|not\s+(?:reliably\s+)?(?:readable|legible|transcribable)|possibly|probably|seems?\s+to|unreadable|uncertain|unverified)\b/i;
const NON_READABLE_LABEL_OBSERVATION = /\b(?:no\s+(?:box|label|mark|text|wording)\s+(?:is\s+)?visible|not\s+applicable|no\s+text|text\s+unknown|wording\s+unknown)\b/i;
const UNSUPPORTED_AGE_WORDING = /\b(?:antique|vintage|retro|mid[- ]century|period|historic(?:al)?)\b(?:-style)?/gi;
const COUNT_CONFIGURATION_CLAIM = /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)[ -]?(?:slot|slice|piece|unit|component|control|burner|door|drawer)s?\b/i;
const GENERIC_CATEGORY_WORDS = new Set([
  "appliance",
  "article",
  "bag",
  "clothing",
  "decor",
  "device",
  "equipment",
  "furniture",
  "garment",
  "goods",
  "homeware",
  "item",
  "object",
  "product",
  "supply",
  "tool"
]);
const CATEGORY_STOP_WORDS = new Set([
  "a", "an", "and", "for", "generic", "household", "likely", "of", "possibly", "standard", "the", "unknown", "unverified"
]);

function knownIdentity(value, maximum = 160) {
  const text = cleanObjectText(value, maximum);
  return text && !UNKNOWN_IDENTITY.test(text) && !NON_IDENTITY_CLAIM.test(text) ? text : "";
}

function readableIdentityText(values = []) {
  return boundedUniqueStrings(values.flat(Infinity), 32, 200)
    .filter((value) => !UNCERTAIN_IDENTITY_CLAIM.test(value))
    .filter((value) => !NON_READABLE_LABEL_OBSERVATION.test(value));
}

function evidenceCorpus(values = []) {
  return normalizeObjectText(boundedUniqueStrings(values.flat(Infinity), 64, 240).join(" "));
}

function claimHasEvidence(value, corpus, { requireAllDistinctiveTokens = false } = {}) {
  const normalized = normalizeObjectText(knownIdentity(value));
  if (!normalized || !corpus) return false;
  if (corpus.includes(normalized)) return true;
  const tokens = normalized
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !CATEGORY_STOP_WORDS.has(token) && !GENERIC_CATEGORY_WORDS.has(token));
  if (!tokens.length) return false;
  return requireAllDistinctiveTokens
    ? tokens.every((token) => corpus.includes(token))
    : tokens.some((token) => corpus.includes(token));
}

function unknownValue(value) {
  return Array.isArray(value) ? [] : "Unknown";
}

function stripUnsupportedField(projected, rejectedClaims, field, corpus, options = {}) {
  const value = projected[field];
  if (!knownIdentity(value) || claimHasEvidence(value, corpus, options)) return;
  rejectedClaims.push({
    field,
    value: cleanObjectText(value, 180),
    reason: options.reason || "The claim was not bound to current visible evidence."
  });
  projected[field] = unknownValue(value);
}

function stripUnsupportedConfigurationPhrase(value, inspectableVisualCorpus) {
  const text = knownIdentity(value);
  if (!text || claimHasEvidence(text, inspectableVisualCorpus, { requireAllDistinctiveTokens: true })) return text;
  return text
    .replace(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)[ -](?:slot|slice|piece|unit|component|control|burner|door|drawer)s?\b/gi, "")
    .replace(/\s+/g, " ")
    .trim() || text;
}

function stripUnsupportedAgePhrase(value) {
  const text = knownIdentity(value);
  if (!text) return value;
  return text.replace(UNSUPPORTED_AGE_WORDING, "").replace(/\s+/g, " ").replace(/^\s*[-,;:/]+|[-,;:/]+\s*$/g, "").trim() || text;
}

function conflictsWithExplicitConfigurationUnknown(value, unresolvedCorpus = "") {
  if (!COUNT_CONFIGURATION_CLAIM.test(cleanObjectText(value, 180))) return false;
  return /\b(?:count|number|configuration|slot|slice|piece|component|control|burner|door|drawer)s?\b/.test(unresolvedCorpus);
}

export function projectCanonicalEvidenceIdentity(extractedIdentity = {}) {
  const projected = structuredClone(extractedIdentity && typeof extractedIdentity === "object" ? extractedIdentity : {});
  const visual = projected.visualRecognition || {};
  projected.visibleText = readableIdentityText(projected.visibleText);
  projected.textIdentityEvidence = readableIdentityText(projected.textIdentityEvidence);
  visual.visibleWords = readableIdentityText(visual.visibleWords);
  visual.visibleLetters = readableIdentityText(visual.visibleLetters);
  const labelCorpus = evidenceCorpus([
    projected.visibleText,
    projected.textIdentityEvidence,
    visual.visibleWords,
    visual.visibleLetters,
    visual.visibleLogos
  ]);
  const inspectableVisualCorpus = evidenceCorpus([
    labelCorpus,
    projected.visualIdentityEvidence,
    projected.diagnosticVisualDetails,
    projected.distinctiveVisualDescription,
    visual.visualEvidence,
    visual.distinctiveFeatures
  ]);
  const rejectedClaims = [];
  const directlySupportedFields = new Set();

  for (const field of [
    "brand", "recognizedBrand", "manufacturer", "makerIdentity", "model", "modelOrItemNumber", "sku", "styleNumber",
    "brandSeries", "productNameOrBoxTitle", "frontBoxWording", "backLabelWording",
    "manufacturerLocationText", "copyrightWording", "licensingStickerText", "recognizedOrganization",
    "recognizedInstitution", "recognizedCharacter", "teamName", "schoolName", "mascot"
  ]) {
    const value = knownIdentity(projected[field]);
    if (value && UNCERTAIN_IDENTITY_CLAIM.test(value)) {
      rejectedClaims.push({
        field,
        value: cleanObjectText(value, 180),
        reason: "The identity claim was explicitly uncertain and cannot become canonical."
      });
      projected[field] = unknownValue(projected[field]);
    } else stripUnsupportedField(projected, rejectedClaims, field, labelCorpus, {
      requireAllDistinctiveTokens: ["productNameOrBoxTitle", "brandSeries"].includes(field),
      reason: "The identity-bearing wording was not supported by readable current-image label evidence."
    });
    if (knownIdentity(projected[field]) && claimHasEvidence(projected[field], labelCorpus, {
      requireAllDistinctiveTokens: ["productNameOrBoxTitle", "brandSeries"].includes(field)
    })) directlySupportedFields.add(field);
  }
  for (const field of ["category", "subjectIdentity", "likelyItemDescription", "visualSubject", "visualSubjectCategory"]) {
    if (projected[field]) projected[field] = stripUnsupportedAgePhrase(
      stripUnsupportedConfigurationPhrase(projected[field], inspectableVisualCorpus)
    );
  }
  for (const field of ["visualSubject", "visualSubjectCategory"]) {
    if (visual[field]) visual[field] = stripUnsupportedAgePhrase(
      stripUnsupportedConfigurationPhrase(visual[field], inspectableVisualCorpus)
    );
  }
  for (const field of ["recognizedBrand", "recognizedOrganization", "recognizedInstitution", "recognizedCharacter"]) {
    const value = visual[field];
    if (knownIdentity(value) && (UNCERTAIN_IDENTITY_CLAIM.test(value) || !claimHasEvidence(value, labelCorpus))) {
      rejectedClaims.push({
        field: `visualRecognition.${field}`,
        value: cleanObjectText(value, 180),
        reason: "The recognized identity was not supported by readable current-image wording or a visible logo."
      });
      visual[field] = "Unknown";
    }
  }

  stripUnsupportedField(projected, rejectedClaims, "material", labelCorpus, {
    requireAllDistinctiveTokens: true,
    reason: "Material was not supported by readable label wording; texture or appearance alone is insufficient."
  });
  if (knownIdentity(projected.material) && claimHasEvidence(projected.material, labelCorpus, {
    requireAllDistinctiveTokens: true
  })) directlySupportedFields.add("material");
  for (const field of ["year", "eraEstimate"]) {
    stripUnsupportedField(projected, rejectedClaims, field, labelCorpus, {
      requireAllDistinctiveTokens: true,
      reason: "Age or era was not supported by readable dated evidence."
    });
  }
  for (const field of [
    "packageQuantity", "packageSize", "unitCount", "size", "dimensions", "shape", "construction",
    "completeness", "missingComponentStatus"
  ]) {
    stripUnsupportedField(projected, rejectedClaims, field, inspectableVisualCorpus, {
      requireAllDistinctiveTokens: /Quantity|Count|Size|dimensions/.test(field),
      reason: "The physical configuration was not supported by an explicit current-image observation."
    });
    if (knownIdentity(projected[field]) && claimHasEvidence(projected[field], inspectableVisualCorpus, {
      requireAllDistinctiveTokens: /Quantity|Count|Size|dimensions/.test(field)
    })) directlySupportedFields.add(field);
  }

  const exactIdentity = knownIdentity(projected.exactProductIdentity);
  if (exactIdentity && (
    UNCERTAIN_IDENTITY_CLAIM.test(exactIdentity)
    || !claimHasEvidence(exactIdentity, labelCorpus, { requireAllDistinctiveTokens: true })
  )) {
    rejectedClaims.push({
      field: "exactProductIdentity",
      value: exactIdentity,
      reason: "The exact identity was not supported by readable identity-bearing evidence."
    });
    projected.exactProductIdentity = "Unknown";
    projected.exactProductConfidence = "Low";
  } else if (exactIdentity) {
    directlySupportedFields.add("exactProductIdentity");
  }
  if (!/^(?:unknown|unverified|not established|not verified)$/i.test(cleanObjectText(projected.authenticityStatus))) {
    rejectedClaims.push({
      field: "authenticityStatus",
      value: cleanObjectText(projected.authenticityStatus, 180),
      reason: "Authenticity cannot be established from an uncorroborated visual claim."
    });
    projected.authenticityStatus = "Unverified";
  }
  if (
    knownIdentity(projected.licensingStatus)
    && !claimHasEvidence(projected.licensingStatus, labelCorpus)
    && !knownIdentity(projected.licensingStickerText)
  ) {
    rejectedClaims.push({
      field: "licensingStatus",
      value: cleanObjectText(projected.licensingStatus, 180),
      reason: "Licensing was not supported by readable current-image wording."
    });
    projected.licensingStatus = "Unknown";
  }

  projected.identityHypotheses = Array.isArray(projected.identityHypotheses)
    ? projected.identityHypotheses.map((hypothesis) => {
        const candidate = { ...hypothesis };
        for (const field of ["brandOrMaker", "model"]) {
          if (
            knownIdentity(candidate[field])
            && (
              UNCERTAIN_IDENTITY_CLAIM.test(candidate[field])
              || !claimHasEvidence(candidate[field], labelCorpus)
            )
          ) {
            candidate[field] = "Unknown";
          }
        }
        if (
          knownIdentity(candidate.exactCandidateLabel)
          && (
            UNCERTAIN_IDENTITY_CLAIM.test(candidate.exactCandidateLabel)
            || !claimHasEvidence(candidate.exactCandidateLabel, labelCorpus, { requireAllDistinctiveTokens: true })
          )
        ) {
          candidate.exactCandidateLabel = "Unknown";
          candidate.exactnessLevel = "BROADER_FAMILY";
          candidate.confidenceBand = "LOW";
        }
        if (knownIdentity(candidate.broaderFamilyIdentity) && UNCERTAIN_IDENTITY_CLAIM.test(candidate.broaderFamilyIdentity)) {
          candidate.broaderFamilyIdentity = "Unknown";
        }
        return candidate;
      })
    : [];
  projected.strongestSearchableIdentifiers = boundedUniqueStrings(
    projected.strongestSearchableIdentifiers,
    12,
    180
  ).filter((value) => claimHasEvidence(value, labelCorpus));

  const unknowns = boundedUniqueStrings([
    projected.identityUnknowns,
    rejectedClaims.map((claim) => `${claim.field}: ${claim.reason}`)
  ].flat(Infinity), 24, 240);
  projected.identityUnknowns = unknowns;
  projected.additionalEvidenceNeeded = boundedUniqueStrings([
    projected.additionalEvidenceNeeded,
    rejectedClaims.map((claim) => `Obtain readable or independently corroborated evidence for ${claim.field}.`)
  ].flat(Infinity), 20, 240);
  projected.canonicalEvidenceProjection = Object.freeze({
    schemaVersion: "1.0",
    rejectedClaims: Object.freeze(rejectedClaims.map((claim) => Object.freeze(claim))),
    directlySupportedFields: Object.freeze([...directlySupportedFields].sort()),
    labelEvidencePresent: Boolean(labelCorpus),
    inspectableVisualEvidencePresent: Boolean(inspectableVisualCorpus)
  });
  return projected;
}

function categoryTokens(value) {
  return normalizeObjectText(value)
    .replace(/[^a-z0-9-]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2 && !CATEGORY_STOP_WORDS.has(token));
}

function significantCategoryTokens(value) {
  return categoryTokens(value).filter((token) => !GENERIC_CATEGORY_WORDS.has(token));
}

function categoryHead(value) {
  const tokens = categoryTokens(value);
  return tokens[tokens.length - 1] || "";
}

function categoryIsGeneric(value) {
  const significant = significantCategoryTokens(value);
  return significant.length === 0 || GENERIC_CATEGORY_WORDS.has(categoryHead(value));
}

function mostSpecificCategorySegment(value) {
  const segments = String(value || "").split(/[/>;|]/).map((part) => knownIdentity(part.trim())).filter(Boolean);
  return [...segments].reverse().find((segment) => !categoryIsGeneric(segment)) || segments.at(-1) || "";
}

function categoriesCompatible(left, right) {
  const leftTokens = significantCategoryTokens(left);
  const rightTokens = significantCategoryTokens(right);
  if (!leftTokens.length || !rightTokens.length) return categoryIsGeneric(left) || categoryIsGeneric(right);
  const leftSet = new Set(leftTokens);
  return rightTokens.some((token) => leftSet.has(token))
    || normalizeObjectText(left).includes(normalizeObjectText(right))
    || normalizeObjectText(right).includes(normalizeObjectText(left));
}

function categorySpecificity(value) {
  const tokens = significantCategoryTokens(value);
  const length = knownIdentity(value).length;
  return tokens.length * 4 + Math.min(length, 80) / 40 - (categoryIsGeneric(value) ? 8 : 0);
}

function compactCategoryFromHypothesis(value, fallback) {
  const candidate = knownIdentity(value);
  if (!candidate) return "";
  if (categoriesCompatible(candidate, fallback) && !categoryIsGeneric(fallback)) return fallback;
  const tokens = categoryTokens(candidate)
    .filter((token) => !/^\d+(?:[- ]?(?:count|piece|slot|pack))?$/.test(token))
    .filter((token) => !/^(?:two|three|four|five|six|seven|eight|nine|ten|single|dual|double|triple|quad)$/.test(token));
  const head = tokens[tokens.length - 1] || "";
  if (!head || GENERIC_CATEGORY_WORDS.has(head)) return candidate;
  return head;
}

function observationMap(state = {}) {
  return new Map((state.observedFacts || []).map((fact) => [fact.observationId, fact]));
}

function categoryObservationIds(state = {}, label = "") {
  const normalized = normalizeObjectText(label);
  return (state.observedFacts || [])
    .filter((fact) => ["broad_identity", "broader_identity", "item_name"].includes(fact.factType))
    .filter((fact) => fact.normalizedValue && (
      fact.normalizedValue.includes(normalized)
      || normalized.includes(fact.normalizedValue)
      || categoriesCompatible(fact.value, label)
    ))
    .map((fact) => fact.observationId)
    .slice(0, 12);
}

function chooseBaseCategory(state = {}, extractedIdentity = {}) {
  const visual = extractedIdentity.visualRecognition || {};
  const ownerFacts = (state.observedFacts || [])
    .filter((fact) => fact.origin === "USER_PROVIDED" && fact.factType === "item_name")
    .map((fact) => ({ label: fact.value, weight: 12, source: "NORMALIZED_OWNER_FACT", ids: [fact.observationId] }));
  const candidates = [
    ...ownerFacts,
    { label: visual.visualSubject, weight: 10, source: "CANONICAL_VISIBLE_SUBJECT" },
    { label: extractedIdentity.visualSubject, weight: 9, source: "CANONICAL_VISIBLE_SUBJECT" },
    { label: extractedIdentity.subjectIdentity, weight: 7, source: "VISIBLE_SUBJECT_RECONCILIATION" },
    { label: extractedIdentity.likelyItemDescription, weight: 4, source: "VISIBLE_DESCRIPTION_RECONCILIATION" },
    { label: visual.visualSubjectCategory, weight: 3, source: "VISIBLE_CATEGORY_RECONCILIATION" },
    { label: extractedIdentity.visualSubjectCategory, weight: 3, source: "VISIBLE_CATEGORY_RECONCILIATION" },
    { label: extractedIdentity.category, weight: 2, source: "VISIBLE_CATEGORY_RECONCILIATION" }
  ]
    .map((candidate) => ({
      ...candidate,
      label: knownIdentity(candidate.label),
      ids: candidate.ids || categoryObservationIds(state, candidate.label)
    }))
    .filter((candidate) => candidate.label);
  if (!candidates.length) {
    return { label: "unresolved object", source: "INSUFFICIENT_VISIBLE_EVIDENCE", observationIds: [] };
  }
  const ranked = candidates.map((candidate) => {
    const agreement = candidates
      .filter((other) => categoriesCompatible(candidate.label, other.label))
      .reduce((sum, other) => sum + Math.min(other.weight, 6), 0);
    return { ...candidate, score: candidate.weight + agreement + categorySpecificity(candidate.label) };
  }).sort((left, right) => right.score - left.score || left.label.localeCompare(right.label));
  const winner = ranked[0];
  const compactCategoryCandidates = [
    { label: visual.visualSubjectCategory, source: "VISIBLE_CATEGORY_RECONCILIATION" },
    { label: extractedIdentity.visualSubjectCategory, source: "VISIBLE_CATEGORY_RECONCILIATION" },
    { label: extractedIdentity.category, source: "VISIBLE_CATEGORY_RECONCILIATION" }
  ]
    .map((candidate) => ({
      ...candidate,
      label: knownIdentity(candidate.label),
      compactLabel: mostSpecificCategorySegment(candidate.label)
    }))
    .filter((candidate) => candidate.compactLabel)
    .filter((candidate) => categoriesCompatible(candidate.compactLabel, winner.label))
    .filter((candidate) => !categoryIsGeneric(candidate.compactLabel))
    .filter((candidate) => categoryTokens(candidate.compactLabel).length <= 6)
    .sort((left, right) => (
      categoryTokens(left.compactLabel).length - categoryTokens(right.compactLabel).length
      || left.compactLabel.length - right.compactLabel.length
      || left.compactLabel.localeCompare(right.compactLabel)
    ));
  const compactWinner = compactCategoryCandidates[0];
  const selectedLabel = compactWinner?.compactLabel || winner.label;
  return {
    label: selectedLabel,
    source: compactWinner?.source || winner.source,
    observationIds: [...new Set(ranked
      .filter((candidate) => categoriesCompatible(candidate.label, selectedLabel))
      .flatMap((candidate) => candidate.ids))].slice(0, 12)
  };
}

function selectSupportedHypothesisRefinement(state = {}, baseCategory = "") {
  const facts = observationMap(state);
  const candidates = (state.identityHypotheses || []).map((hypothesis) => {
    const supportedIds = boundedUniqueStrings(hypothesis.supportingObservationIds, 12, 80)
      .filter((identity) => facts.has(identity));
    const rawLabel = knownIdentity(hypothesis.exactCandidateLabel || hypothesis.broaderFamilyIdentity);
    const compactLabel = compactCategoryFromHypothesis(rawLabel, baseCategory);
    const confidence = normalizeObjectText(hypothesis.confidenceBand);
    const supportWeight = supportedIds.reduce((score, identity) => {
      const fact = facts.get(identity);
      return score + (fact?.directlyVisible || fact?.origin === "VISIBLE_EVIDENCE_STATE" ? 3 : fact?.origin === "USER_PROVIDED" ? 3 : 1);
    }, 0);
    const compatible = categoriesCompatible(rawLabel, baseCategory)
      || (categoryIsGeneric(baseCategory) && supportWeight >= 3);
    return {
      hypothesis,
      rawLabel,
      compactLabel,
      supportedIds,
      confidence,
      supportWeight,
      compatible,
      score: supportWeight + categorySpecificity(compactLabel) - (/low|weak|uncertain/.test(confidence) ? 4 : 0)
    };
  }).filter((candidate) => candidate.rawLabel && candidate.compactLabel && candidate.supportedIds.length && candidate.compatible);
  candidates.sort((left, right) => right.score - left.score || left.hypothesis.candidateId.localeCompare(right.hypothesis.candidateId));
  const winner = candidates[0];
  if (!winner) return null;
  if (!categoryIsGeneric(baseCategory) && categorySpecificity(winner.compactLabel) <= categorySpecificity(baseCategory)) return null;
  return winner;
}

function materialConfigurationAttributes(state = {}, category = "", unresolvedCorpus = "") {
  const allowed = new Set([
    "package_count",
    "package_quantity",
    "dimensions",
    "shape",
    "construction",
    "material",
    "design",
    "diagnostic_visual_detail"
  ]);
  const categoryNormalized = normalizeObjectText(category);
  const seen = new Set();
  const attributes = [];
  for (const fact of state.observedFacts || []) {
    if (!allowed.has(fact.factType) || fact.certaintyBand === "LOW") continue;
    if (fact.factType === "material" && !["DIRECTLY_VISIBLE", "USER_PROVIDED"].includes(fact.origin)) continue;
    const value = knownIdentity(fact.value, 120);
    const normalized = normalizeObjectText(value);
    if (!value || !normalized || normalized === categoryNormalized || seen.has(normalized)) continue;
    if (conflictsWithExplicitConfigurationUnknown(value, unresolvedCorpus)) continue;
    if (categoryTokens(value).length > 9) continue;
    seen.add(normalized);
    attributes.push({
      value,
      normalizedValue: normalized,
      factType: fact.factType,
      observationIds: [fact.observationId],
      provenance: fact.origin === "USER_PROVIDED" ? "NORMALIZED_OWNER_FACT" : "CANONICAL_VISIBLE_EVIDENCE"
    });
    if (attributes.length >= 6) break;
  }
  return attributes;
}

function authorizedIdentityTerms(state = {}, category, configurationAttributes, unresolvedCorpus = "") {
  const allowedTypes = new Set([
    "barcode", "brand", "item_code", "item_name", "maker_mark", "manufacturer", "model", "model_number",
    "package_count", "package_quantity", "product_name", "visible_text"
  ]);
  const records = [{
    term: category.objectCategory,
    normalizedTerm: normalizeObjectText(category.objectCategory),
    role: "CANONICAL_OBJECT_CATEGORY",
    provenance: category.categoryProvenance,
    observationIds: category.categoryObservationIds
  }];
  for (const attribute of configurationAttributes) {
    records.push({
      term: attribute.value,
      normalizedTerm: attribute.normalizedValue,
      role: "VISIBLE_CONFIGURATION",
      provenance: attribute.provenance,
      observationIds: attribute.observationIds
    });
  }
  for (const fact of state.observedFacts || []) {
    if (!allowedTypes.has(fact.factType)) continue;
    if (
      ["brand", "maker_mark", "manufacturer", "model", "model_number", "product_name"].includes(fact.factType)
      && !["DIRECTLY_VISIBLE", "USER_PROVIDED"].includes(fact.origin)
    ) continue;
    const term = knownIdentity(fact.value, 160);
    const normalizedTerm = normalizeObjectText(term);
    if (
      !term
      || UNCERTAIN_IDENTITY_CLAIM.test(term)
      || NON_READABLE_LABEL_OBSERVATION.test(term)
      || conflictsWithExplicitConfigurationUnknown(term, unresolvedCorpus)
      || !normalizedTerm
      || records.some((record) => record.normalizedTerm === normalizedTerm)
    ) continue;
    records.push({
      term,
      normalizedTerm,
      role: fact.origin === "USER_PROVIDED" ? "NORMALIZED_OWNER_FACT" : "VISIBLE_IDENTITY_FACT",
      provenance: fact.origin,
      observationIds: [fact.observationId]
    });
    if (records.length >= 24) break;
  }
  return records;
}

export function deriveCanonicalResearchIdentity(state = {}, extractedIdentity = {}) {
  const base = chooseBaseCategory(state, extractedIdentity);
  const refinement = selectSupportedHypothesisRefinement(state, base.label);
  const objectCategory = refinement?.compactLabel || base.label;
  const categoryObservationIds = refinement
    ? [...new Set([...base.observationIds, ...refinement.supportedIds])].slice(0, 12)
    : base.observationIds;
  const unresolvedCorpus = evidenceCorpus([
    extractedIdentity.identityUnknowns,
    extractedIdentity.additionalEvidenceNeeded,
    state.resolvedIdentity?.limitations,
    state.resolvedIdentity?.additionalEvidenceNeeded
  ]);
  const configurationAttributes = materialConfigurationAttributes(state, objectCategory, unresolvedCorpus);
  const facts = observationMap(state);
  const allowedHypothesisIds = (state.identityHypotheses || [])
    .filter((hypothesis) => {
      const label = hypothesis.exactCandidateLabel || hypothesis.broaderFamilyIdentity;
      return categoriesCompatible(label, objectCategory)
        && boundedUniqueStrings(hypothesis.supportingObservationIds, 12, 80).some((identity) => facts.has(identity));
    })
    .map((hypothesis) => hypothesis.candidateId);
  const category = {
    objectCategory,
    categoryProvenance: refinement ? "GOVERNED_VISIBLE_EVIDENCE_REFINEMENT" : base.source,
    categoryObservationIds
  };
  const result = {
    schemaVersion: "1.0",
    requestObjectStateId: state.objectStateId,
    objectCategory,
    categoryConfidence: categoryObservationIds.length >= 2 ? "HIGH" : categoryObservationIds.length ? "MEDIUM" : "INSUFFICIENT",
    categoryProvenance: category.categoryProvenance,
    categoryObservationIds,
    configurationAttributes,
    selectedHypothesisId: refinement?.hypothesis.candidateId || allowedHypothesisIds[0] || "",
    allowedHypothesisIds,
    ambiguityStatus: objectCategory === "unresolved object" ? "INSUFFICIENT_VISIBLE_EVIDENCE" : refinement ? "SUPPORTED_REFINEMENT" : "CANONICAL_CATEGORY_ESTABLISHED",
    rejectedHypothesisIds: (state.identityHypotheses || [])
      .filter((hypothesis) => !allowedHypothesisIds.includes(hypothesis.candidateId))
      .map((hypothesis) => hypothesis.candidateId),
    identityTerms: []
  };
  result.identityTerms = authorizedIdentityTerms(state, category, configurationAttributes, unresolvedCorpus);
  for (const hypothesis of state.identityHypotheses || []) {
    if (!allowedHypothesisIds.includes(hypothesis.candidateId)) continue;
    const observationIds = boundedUniqueStrings(hypothesis.supportingObservationIds, 12, 80)
      .filter((identity) => facts.has(identity));
    const supportCorpus = evidenceCorpus(observationIds.map((identity) => facts.get(identity)?.value || ""));
    for (const term of boundedUniqueStrings([
      hypothesis.exactCandidateLabel,
      hypothesis.broaderFamilyIdentity,
      hypothesis.brandOrMaker,
      hypothesis.model
    ], 8, 160)) {
      const normalizedTerm = normalizeObjectText(term);
      if (
        !normalizedTerm
        || UNCERTAIN_IDENTITY_CLAIM.test(term)
        || NON_READABLE_LABEL_OBSERVATION.test(term)
        || conflictsWithExplicitConfigurationUnknown(term, unresolvedCorpus)
        || !claimHasEvidence(term, supportCorpus, { requireAllDistinctiveTokens: true })
        || result.identityTerms.some((record) => record.normalizedTerm === normalizedTerm)
      ) continue;
      result.identityTerms.push({
        term,
        normalizedTerm,
        role: "GOVERNED_HYPOTHESIS_REFINEMENT",
        provenance: "CURRENT_REQUEST_SUPPORTED_HYPOTHESIS",
        observationIds
      });
    }
  }
  result.identityTerms = result.identityTerms.slice(0, 32);
  result.canonicalResearchIdentityId = stableInternalId("canonical-research-identity", {
    requestObjectStateId: result.requestObjectStateId,
    objectCategory: result.objectCategory,
    configurationAttributes: result.configurationAttributes,
    allowedHypothesisIds: result.allowedHypothesisIds
  }, 18);
  result.canonicalResearchIdentityHash = sha256Object(result);
  return result;
}

export function projectCanonicalResearchIdentity(extractedIdentity = {}, canonicalResearchIdentity = {}) {
  const category = knownIdentity(canonicalResearchIdentity.objectCategory) || "unresolved object";
  return {
    ...extractedIdentity,
    canonicalResearchIdentity,
    visualSubject: category,
    subjectIdentity: category,
    category,
    visualSubjectConfidence: canonicalResearchIdentity.categoryConfidence || extractedIdentity.visualSubjectConfidence,
    subjectConfidence: canonicalResearchIdentity.categoryConfidence || extractedIdentity.subjectConfidence
  };
}

export function canonicalCategoriesCompatible(left, right) {
  return categoriesCompatible(left, right);
}
