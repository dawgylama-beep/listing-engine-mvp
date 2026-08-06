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

function makeQuery({ state, query, queryType, hypothesisId = "", facts = [], discriminator = "", phase = "INITIAL", providerLane = "purpose_neutral_exact" }) {
  const cleaned = cleanObjectText(query, 220);
  if (!cleaned) return null;
  const exactVisibleFactsUsed = [...new Set(facts)].slice(0, 12);
  const projection = { cleaned, queryType, hypothesisId, exactVisibleFactsUsed, discriminator, phase, providerLane };
  return {
    queryId: stableInternalId("query", projection, 14),
    owningHypothesisId: hypothesisId,
    queryType,
    query: cleaned,
    exactVisibleFactsUsed,
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
  const selected = (state.identityHypotheses || []).find((item) => item.candidateId === resolved.selectedCandidateId)
    || state.identityHypotheses?.[0]
    || {};
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
  const broad = searchableIdentityValue(selected.broaderFamilyIdentity || resolved.broaderFallbackIdentity);

  if (barcode) addBounded(records, signatures, makeQuery({
    state,
    query: barcode,
    queryType: "VALIDATED_BARCODE",
    hypothesisId: selected.candidateId,
    facts: barcodeFacts,
    discriminator: "Exact validated retail identifier"
  }), maximumQueries);
  if (brand && model) addBounded(records, signatures, makeQuery({
    state,
    query: `${quotePhrase(brand)} ${quotePhrase(model)}`,
    queryType: "EXACT_BRAND_MODEL",
    hypothesisId: selected.candidateId,
    facts: [...brandFacts, ...modelFacts],
    discriminator: "Brand or maker and exact model"
  }), maximumQueries);
  if (model && exactLabel) addBounded(records, signatures, makeQuery({
    state,
    query: `${quotePhrase(model)} ${quotePhrase(exactLabel)}`,
    queryType: "EXACT_MODEL_PRODUCT",
    hypothesisId: selected.candidateId,
    facts: [...modelFacts, ...productFacts],
    discriminator: "Model attached to the observed product identity"
  }), maximumQueries);
  if (brand && broad && !model) addBounded(records, signatures, makeQuery({
    state,
    query: `${quotePhrase(brand)} ${quotePhrase(broad)}`,
    queryType: "EXACT_MAKER_OBJECT_TYPE",
    hypothesisId: selected.candidateId,
    facts: [...brandFacts, ...productFacts],
    discriminator: "Maker mark attached to object type"
  }), maximumQueries);

  const visiblePhrases = (state.observedFacts || [])
    .filter((fact) => ["visible_text", "maker_mark", "logo"].includes(fact.factType))
    .filter((fact) => fact.normalizedValue.length >= 5 && !/^\d+$/.test(fact.normalizedValue))
    .sort((left, right) => right.normalizedValue.length - left.normalizedValue.length || left.observationId.localeCompare(right.observationId))
    .slice(0, 4);
  for (const fact of visiblePhrases) {
    addBounded(records, signatures, makeQuery({
      state,
      query: `${quotePhrase(fact.value)} ${quotePhrase(broad || exactLabel)}`,
      queryType: "EXACT_VISIBLE_PHRASE",
      hypothesisId: selected.candidateId,
      facts: [fact.observationId, ...productFacts],
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
    query: `${quotePhrase(exactLabel)} ${quotePhrase(packageText)}`,
    queryType: "EXACT_PRODUCT_VARIANT",
    hypothesisId: selected.candidateId,
    facts: [...productFacts, ...packageFacts],
    discriminator: "Package, variation, dimensions, or count"
  }), maximumQueries);

  for (const hypothesis of (state.identityHypotheses || []).slice(0, 4)) {
    const label = searchableIdentityValue(hypothesis.exactCandidateLabel || hypothesis.broaderFamilyIdentity);
    if (!label) continue;
    const discriminator = hypothesis.unresolvedDiscriminators?.[0]
      || hypothesis.distinguishingQueryOrObservation?.[0]
      || "Distinguish this bounded identity hypothesis";
    addBounded(records, signatures, makeQuery({
      state,
      query: `${quotePhrase(label)} ${brand && !normalizeObjectText(label).includes(normalizeObjectText(brand)) ? quotePhrase(brand) : ""}`,
      queryType: "HYPOTHESIS_DISAMBIGUATION",
      hypothesisId: hypothesis.candidateId,
      facts: hypothesis.supportingObservationIds,
      discriminator
    }), maximumQueries);
  }

  if (broad) addBounded(records, signatures, makeQuery({
    state,
    query: [brand, broad].filter(Boolean).map(quotePhrase).join(" "),
    queryType: "BROADER_FAMILY_FALLBACK",
    hypothesisId: selected.candidateId,
    facts: [...brandFacts, ...productFacts, ...designFacts].slice(0, 12),
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
        query: `${quotePhrase(label)} ${quotePhrase(fact.value)}`,
        queryType: "EVIDENCE_INFORMED_DISAMBIGUATION",
        hypothesisId: hypothesis.candidateId,
        facts: [...(hypothesis.supportingObservationIds || []), fact.observationId].filter(Boolean),
        discriminator,
        phase: "REFINEMENT",
        providerLane: "purpose_neutral_refinement"
      }), maximumQueries);
      if (records.length > countBefore || records.length >= maximumQueries) break;
    }
  }
  return records;
}
