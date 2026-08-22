import { boundedUniqueStrings, cleanObjectText, normalizeObjectText, stableInternalId } from "./stable.js";

const UNKNOWN_SEARCH_IDENTITY = /^(?:unknown|none|not visible|not provided|not known|not verified|unverified|n\/a|na)$/i;

function searchableIdentityValue(value) {
  const text = cleanObjectText(value, 120).replace(/["\r\n]+/g, " ").trim();
  return text && !UNKNOWN_SEARCH_IDENTITY.test(text) ? text : "";
}

function quotePhrase(value) {
  const text = searchableIdentityValue(value);
  return text ? `"${text}"` : "";
}

function querySignature(value) {
  return normalizeObjectText(value).replace(/\b(?:the|and|for|with)\b/g, " ").replace(/\s+/g, " ").trim();
}

function factIds(state = {}, types = [], values = []) {
  const normalizedValues = boundedUniqueStrings(values, 16, 160).map(normalizeObjectText);
  return (state.observedFacts || [])
    .filter((fact) => !types.length || types.includes(fact.factType))
    .filter((fact) => !normalizedValues.length || normalizedValues.some((value) => (
      value.includes(fact.normalizedValue) || fact.normalizedValue.includes(value)
    )))
    .slice(0, 12)
    .map((fact) => fact.observationId);
}

function canonicalCategory(state = {}) {
  return searchableIdentityValue(state.canonicalResearchIdentity?.objectCategory);
}

function canonicalConfiguration(state = {}) {
  return (state.canonicalResearchIdentity?.configurationAttributes || [])
    .map((attribute) => searchableIdentityValue(attribute.value))
    .filter(Boolean)
    .slice(0, 2);
}

function canonicalIdentityTermProvenance(state = {}, values = []) {
  const normalizedValues = boundedUniqueStrings(values, 16, 180).map(normalizeObjectText);
  return (state.canonicalResearchIdentity?.identityTerms || [])
    .filter((record) => normalizedValues.some((value) => (
      value.includes(record.normalizedTerm)
      || record.normalizedTerm.includes(value)
    )))
    .map((record) => ({
      term: record.term,
      role: record.role,
      provenance: record.provenance,
      observationIds: record.observationIds
    }))
    .slice(0, 16);
}

function canonicalQuery(state = {}, values = []) {
  const category = canonicalCategory(state);
  const parts = boundedUniqueStrings([category, ...values], 10, 180).filter(Boolean);
  return parts.map(quotePhrase).join(" ");
}

function makeQuery({ state, query, queryType, hypothesisId = "", facts = [], identityTerms = [], discriminator = "", phase = "INITIAL", providerLane = "purpose_neutral_exact" }) {
  const cleaned = cleanObjectText(query, 220);
  if (!cleaned) return null;
  const exactVisibleFactsUsed = [...new Set(facts)].slice(0, 12);
  const identityTermsUsed = boundedUniqueStrings(identityTerms.length ? identityTerms : [canonicalCategory(state)], 16, 180).filter(Boolean);
  const identityTermProvenance = canonicalIdentityTermProvenance(state, identityTermsUsed);
  if (!identityTermProvenance.some((record) => record.role === "CANONICAL_OBJECT_CATEGORY")) return null;
  const allIdentityTermsBound = identityTermsUsed.every((term) => {
    const normalizedTerm = normalizeObjectText(term);
    return identityTermProvenance.some((record) => {
      const normalizedRecord = normalizeObjectText(record.term);
      return normalizedTerm.includes(normalizedRecord) || normalizedRecord.includes(normalizedTerm);
    });
  });
  if (!allIdentityTermsBound) return null;
  const projection = { cleaned, queryType, hypothesisId, exactVisibleFactsUsed, identityTermsUsed, identityTermProvenance, discriminator, phase, providerLane };
  return {
    queryId: stableInternalId("query", projection, 14),
    owningHypothesisId: hypothesisId,
    queryType,
    query: cleaned,
    exactVisibleFactsUsed,
    identityTermsUsed,
    identityTermProvenance,
    discriminatorTested: cleanObjectText(discriminator, 180),
    providerLane,
    executionOrder: 0,
    resultState: "PLANNED",
    phase
  };
}

function addBounded(records, signatures, record, maximumQueries) {
  if (!record || records.length >= maximumQueries) return;
  const signature = querySignature(record.query);
  if (!signature || signatures.has(signature)) return;
  signatures.add(signature);
  records.push({ ...record, executionOrder: records.length + 1 });
}

export function createInitialObjectSearchPlan(state = {}, { maximumQueries = 12 } = {}) {
  const records = [];
  const signatures = new Set();
  const resolved = state.resolvedIdentity || {};
  const category = canonicalCategory(state);
  if (!category) return records;
  const categoryFacts = state.canonicalResearchIdentity?.categoryObservationIds || [];
  const configuration = canonicalConfiguration(state);
  const allowedHypothesisIds = new Set(state.canonicalResearchIdentity?.allowedHypothesisIds || []);
  const selected = (state.identityHypotheses || []).find((item) => (
    item.candidateId === resolved.selectedCandidateId && allowedHypothesisIds.has(item.candidateId)
  )) || (state.identityHypotheses || []).find((item) => allowedHypothesisIds.has(item.candidateId)) || {};
  const barcodeFacts = factIds(state, ["barcode", "UPC_or_barcode"]);
  const modelFacts = factIds(state, ["model_number", "model"]);
  const brandFacts = factIds(state, ["brand", "maker_mark", "manufacturer"]);
  const productFacts = factIds(state, ["product_name"]);
  const packageFacts = factIds(state, ["package_count", "package_quantity", "dimensions"]);
  const designFacts = factIds(state, ["visible_text", "logo", "maker_mark", "design", "diagnostic_visual_detail"]);
  const barcode = cleanObjectText(resolved.validatedBarcode);
  const brand = searchableIdentityValue(resolved.brandOrMaker || selected.brandOrMaker);
  const model = searchableIdentityValue(resolved.model || selected.model);
  const exactLabel = searchableIdentityValue(selected.exactCandidateLabel || resolved.bestSupportedCustomerIdentity);
  const broad = searchableIdentityValue(selected.broaderFamilyIdentity || category);

  if (barcode) addBounded(records, signatures, makeQuery({
    state,
    query: canonicalQuery(state, [barcode]),
    queryType: "VALIDATED_BARCODE",
    hypothesisId: selected.candidateId,
    facts: [...categoryFacts, ...barcodeFacts],
    identityTerms: [category, barcode],
    discriminator: "Exact validated retail identifier"
  }), maximumQueries);
  if (brand && model) addBounded(records, signatures, makeQuery({
    state,
    query: canonicalQuery(state, [brand, model]),
    queryType: "EXACT_BRAND_MODEL",
    hypothesisId: selected.candidateId,
    facts: [...categoryFacts, ...brandFacts, ...modelFacts],
    identityTerms: [category, brand, model],
    discriminator: "Brand or maker and exact model"
  }), maximumQueries);
  if (model && exactLabel) addBounded(records, signatures, makeQuery({
    state,
    query: canonicalQuery(state, [model, exactLabel]),
    queryType: "EXACT_MODEL_PRODUCT",
    hypothesisId: selected.candidateId,
    facts: [...categoryFacts, ...modelFacts, ...productFacts],
    identityTerms: [category, model, exactLabel],
    discriminator: "Model attached to the observed product identity"
  }), maximumQueries);
  if (brand && broad && !model) addBounded(records, signatures, makeQuery({
    state,
    query: canonicalQuery(state, [brand, broad]),
    queryType: "EXACT_MAKER_OBJECT_TYPE",
    hypothesisId: selected.candidateId,
    facts: [...categoryFacts, ...brandFacts, ...productFacts],
    identityTerms: [category, brand, broad],
    discriminator: "Maker mark attached to object type"
  }), maximumQueries);
  addBounded(records, signatures, makeQuery({
    state,
    query: canonicalQuery(state, configuration),
    queryType: "CANONICAL_CATEGORY_CONFIGURATION",
    hypothesisId: selected.candidateId,
    facts: [...categoryFacts, ...(state.canonicalResearchIdentity?.configurationAttributes || []).flatMap((attribute) => attribute.observationIds)],
    identityTerms: [category, ...configuration],
    discriminator: "Canonical visible object category and supported configuration"
  }), maximumQueries);

  const visiblePhrases = (state.observedFacts || [])
    .filter((fact) => ["visible_text", "maker_mark", "logo"].includes(fact.factType))
    .filter((fact) => fact.normalizedValue.length >= 5 && !/^\d+$/.test(fact.normalizedValue))
    .sort((left, right) => right.normalizedValue.length - left.normalizedValue.length || left.observationId.localeCompare(right.observationId))
    .slice(0, 4);
  for (const fact of visiblePhrases) {
    addBounded(records, signatures, makeQuery({
      state,
      query: canonicalQuery(state, [fact.value, broad || exactLabel]),
      queryType: "EXACT_VISIBLE_PHRASE",
      hypothesisId: selected.candidateId,
      facts: [...categoryFacts, fact.observationId, ...productFacts],
      identityTerms: [category, fact.value, broad || exactLabel],
      discriminator: `Visible wording: ${fact.value}`
    }), maximumQueries);
  }

  const packageText = (state.observedFacts || [])
    .filter((fact) => ["package_count", "package_quantity", "dimensions"].includes(fact.factType))
    .map((fact) => fact.value)
    .slice(0, 2)
    .join(" ");
  if (exactLabel && packageText) addBounded(records, signatures, makeQuery({
    state,
    query: canonicalQuery(state, [exactLabel, packageText]),
    queryType: "EXACT_PRODUCT_VARIANT",
    hypothesisId: selected.candidateId,
    facts: [...categoryFacts, ...productFacts, ...packageFacts],
    identityTerms: [category, exactLabel, packageText],
    discriminator: "Package, variation, dimensions, or count"
  }), maximumQueries);

  for (const hypothesis of (state.identityHypotheses || []).filter((candidate) => allowedHypothesisIds.has(candidate.candidateId)).slice(0, 4)) {
    const label = searchableIdentityValue(hypothesis.exactCandidateLabel || hypothesis.broaderFamilyIdentity);
    if (!label) continue;
    const discriminator = hypothesis.unresolvedDiscriminators?.[0]
      || hypothesis.distinguishingQueryOrObservation?.[0]
      || "Distinguish this bounded identity hypothesis";
    addBounded(records, signatures, makeQuery({
      state,
      query: canonicalQuery(state, [label, brand && !normalizeObjectText(label).includes(normalizeObjectText(brand)) ? brand : ""]),
      queryType: "HYPOTHESIS_DISAMBIGUATION",
      hypothesisId: hypothesis.candidateId,
      facts: [...categoryFacts, ...hypothesis.supportingObservationIds],
      identityTerms: [category, label, brand],
      discriminator
    }), maximumQueries);
  }

  if (broad) addBounded(records, signatures, makeQuery({
    state,
    query: canonicalQuery(state, [brand, broad]),
    queryType: "BROADER_FAMILY_FALLBACK",
    hypothesisId: selected.candidateId,
    facts: [...categoryFacts, ...brandFacts, ...productFacts, ...designFacts].slice(0, 12),
    identityTerms: [category, brand, broad],
    discriminator: "Useful broader identity when exact variation remains unsupported"
  }), maximumQueries);
  return records;
}

export function createRefinementSearchPlan(state = {}, {
  attemptedQueries = [],
  maximumQueries = 4
} = {}) {
  if (Number(state.refinementCount || 0) >= 1) return [];
  const attempted = new Set(attemptedQueries.map(querySignature));
  const records = [];
  const signatures = new Set(attempted);
  const ordered = (state.identityHypotheses || []).slice().sort((left, right) => (
    Number(right.candidateId === state.resolvedIdentity?.selectedCandidateId)
    - Number(left.candidateId === state.resolvedIdentity?.selectedCandidateId)
    || left.candidateId.localeCompare(right.candidateId)
  ));
  for (const hypothesis of ordered) {
    if (!(state.canonicalResearchIdentity?.allowedHypothesisIds || []).includes(hypothesis.candidateId)) continue;
    const label = searchableIdentityValue(hypothesis.exactCandidateLabel || hypothesis.broaderFamilyIdentity);
    if (!label) continue;
    const discriminator = hypothesis.unresolvedDiscriminators?.[0]
      || hypothesis.distinguishingQueryOrObservation?.[0]
      || state.resolvedIdentity?.additionalEvidenceNeeded?.[0]
      || "";
    if (!discriminator) continue;
    const normalizedLabel = normalizeObjectText(label);
    const normalizedDiscriminator = normalizeObjectText(discriminator);
    const supportedIds = new Set(hypothesis.supportingObservationIds || []);
    const eligibleFacts = (state.observedFacts || [])
      .filter((fact) => [
        "barcode",
        "item_code",
        "model_number",
        "visible_text",
        "logo",
        "maker_mark",
        "package_count",
        "package_quantity",
        "dimensions",
        "shape",
        "construction",
        "design",
        "diagnostic_visual_detail"
      ].includes(fact.factType))
      .filter((fact) => fact.normalizedValue.length >= 3)
      .filter((fact) => !normalizedLabel.includes(fact.normalizedValue))
      .sort((left, right) => (
        Number(supportedIds.has(right.observationId)) - Number(supportedIds.has(left.observationId))
        || Number(
          normalizedDiscriminator.includes(right.normalizedValue)
          || right.normalizedValue.includes(normalizedDiscriminator)
        ) - Number(
          normalizedDiscriminator.includes(left.normalizedValue)
          || left.normalizedValue.includes(normalizedDiscriminator)
        )
        || right.normalizedValue.length - left.normalizedValue.length
        || left.observationId.localeCompare(right.observationId)
      ));
    for (const fact of eligibleFacts) {
      const countBefore = records.length;
      addBounded(records, signatures, makeQuery({
        state,
        query: canonicalQuery(state, [label, fact.value]),
        queryType: "EVIDENCE_INFORMED_DISAMBIGUATION",
        hypothesisId: hypothesis.candidateId,
        facts: [...(state.canonicalResearchIdentity?.categoryObservationIds || []), ...(hypothesis.supportingObservationIds || []), fact.observationId].filter(Boolean),
        identityTerms: [canonicalCategory(state), label, fact.value],
        discriminator,
        phase: "REFINEMENT",
        providerLane: "purpose_neutral_refinement"
      }), maximumQueries);
      if (records.length > countBefore || records.length >= maximumQueries) break;
    }
  }
  return records;
}
