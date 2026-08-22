import {
  boundedUniqueStrings,
  cleanObjectText,
  normalizeObjectText,
  sha256Object,
  stableInternalId
} from "./stable.js";

const UNKNOWN_IDENTITY = /^(?:unknown(?: subject)?|none|not visible|not provided|not known|not verified|unverified|n\/a|na)$/i;
const NON_IDENTITY_CLAIM = /^(?:unverified exact product|exact item|exact product|likely item|item identity|product identity|not established)/i;
const GENERIC_CATEGORY_WORDS = new Set([
  "appliance",
  "article",
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
  return {
    label: winner.label,
    source: winner.source,
    observationIds: [...new Set(ranked
      .filter((candidate) => categoriesCompatible(candidate.label, winner.label))
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

function materialConfigurationAttributes(state = {}, category = "") {
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
    const value = knownIdentity(fact.value, 120);
    const normalized = normalizeObjectText(value);
    if (!value || !normalized || normalized === categoryNormalized || seen.has(normalized)) continue;
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

function authorizedIdentityTerms(state = {}, category, configurationAttributes) {
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
    const term = knownIdentity(fact.value, 160);
    const normalizedTerm = normalizeObjectText(term);
    if (!term || !normalizedTerm || records.some((record) => record.normalizedTerm === normalizedTerm)) continue;
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
  const configurationAttributes = materialConfigurationAttributes(state, objectCategory);
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
  result.identityTerms = authorizedIdentityTerms(state, category, configurationAttributes);
  for (const hypothesis of state.identityHypotheses || []) {
    if (!allowedHypothesisIds.includes(hypothesis.candidateId)) continue;
    const observationIds = boundedUniqueStrings(hypothesis.supportingObservationIds, 12, 80)
      .filter((identity) => facts.has(identity));
    for (const term of boundedUniqueStrings([
      hypothesis.exactCandidateLabel,
      hypothesis.broaderFamilyIdentity,
      hypothesis.brandOrMaker,
      hypothesis.model
    ], 8, 160)) {
      const normalizedTerm = normalizeObjectText(term);
      if (!normalizedTerm || result.identityTerms.some((record) => record.normalizedTerm === normalizedTerm)) continue;
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
