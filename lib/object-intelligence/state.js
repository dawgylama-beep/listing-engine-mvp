import { isValidRetailIdentifier, normalizeIdentifier } from "../evidence/identity.js";
import {
  boundedUniqueStrings,
  cleanObjectText,
  normalizeObjectText,
  sha256Object,
  stableInternalId
} from "./stable.js";

export const OBJECT_MIND_SCHEMA_VERSION = "1.0";
export const OBJECT_EXACTNESS = Object.freeze({
  EXACT_ITEM: "EXACT_ITEM",
  EXACT_DESIGN_VARIATION_UNRESOLVED: "EXACT_DESIGN_VARIATION_UNRESOLVED",
  BROADER_IDENTITY: "BROADER_IDENTITY",
  UNRESOLVED: "UNRESOLVED"
});

const UNKNOWN = /^(?:unknown|none|not visible|not provided|not known|unverified|n\/a|na)$/i;

function known(value) {
  const text = cleanObjectText(value);
  return text && !UNKNOWN.test(text) ? text : "";
}

function purposeFromIntake(intake = {}) {
  const value = normalizeObjectText(intake.purchase_intent || intake.buyer_intent);
  if (/seller|listing/.test(value)) return "MARKETPLACE_LISTING";
  if (/resale|resell/.test(value)) return "RESALE";
  if (/owner|value something|what.?s it worth/.test(value)) return "WHATS_IT_WORTH";
  return "PERSONAL_BUY";
}

export function createPurposeNeutralObjectInput({ notes = "", buyerIntake = {} } = {}) {
  const intake = buyerIntake && typeof buyerIntake === "object" ? buyerIntake : {};
  const identityClues = [
    ["item name", intake.item_name],
    ["brand", intake.known_brand],
    ["manufacturer", intake.known_manufacturer],
    ["model", intake.known_model],
    ["SKU or item code", intake.known_sku],
    ["UPC or barcode", intake.known_upc || intake.known_upc_digits],
    ["approximate age or era", intake.approximate_age_era],
    ["size or dimensions", intake.size_dimensions],
    ["package quantity", intake.package_quantity],
    ["condition", intake.item_condition],
    ["completeness", intake.item_completeness]
  ]
    .map(([label, value]) => ({ label, value: known(value) }))
    .filter((entry) => entry.value);
  const concerns = boundedUniqueStrings(intake.condition_concerns, 12, 80);
  const description = cleanObjectText(
    boundedUniqueStrings([notes, intake.buyer_notes], 2, 2000000).join(" "),
    2000000
  );
  return {
    purpose: purposeFromIntake(intake),
    description,
    descriptionProvenance: {
      provided: Boolean(description),
      sourceType: "REQUEST_DESCRIPTION",
      sha256: sha256Object(description)
    },
    identityClues,
    conditionConcerns: concerns,
    promptText: [
      description ? `Object description: ${description}` : "Object description: None provided.",
      ...identityClues.map((entry) => `Provided ${entry.label}: ${entry.value}`),
      ...(concerns.length ? [`Provided condition concerns: ${concerns.join(", ")}`] : [])
    ].join("\n")
  };
}

function inputImageRecords(photos = []) {
  return photos.slice(0, 6).map((photo, index) => {
    const dataUrl = String(photo?.dataUrl || "");
    const contentHash = sha256Object(dataUrl);
    return {
      imageId: `image-${index + 1}-${contentHash.slice(0, 10)}`,
      ordinal: index + 1,
      contentSha256: contentHash
    };
  });
}

function observationCertainty(identity = {}, factType = "") {
  const confidenceText = normalizeObjectText([
    identity.subjectConfidence,
    identity.exactProductConfidence,
    identity.makerConfidence,
    identity.eraConfidence
  ].join(" "));
  if (/high|certain|strong/.test(confidenceText)) return "HIGH";
  if (/low|uncertain|weak/.test(confidenceText)) return "LOW";
  return /barcode|model|sku|visible_text|maker_mark/.test(factType) ? "HIGH" : "MEDIUM";
}

function buildObservations(identity = {}, neutralInput = {}, imageRecords = []) {
  const observations = [];
  const signatures = new Set();
  const add = (factType, value, {
    origin = "INFERRED_FROM_IMAGES",
    sourceIds = imageRecords.map((image) => image.imageId),
    certaintyBand = observationCertainty(identity, factType)
  } = {}) => {
    for (const item of boundedUniqueStrings(value, 24, 180)) {
      const supportedValue = known(item);
      const normalizedValue = normalizeObjectText(supportedValue);
      const signature = `${factType}\u001f${normalizedValue}\u001f${origin}`;
      if (!normalizedValue || signatures.has(signature) || observations.length >= 80) continue;
      signatures.add(signature);
      observations.push({
        observationId: stableInternalId("observation", signature, 14),
        factType,
        value: supportedValue,
        normalizedValue,
        certaintyBand,
        origin,
        sourceIds: sourceIds.slice(0, 6),
        directlyVisible: origin === "DIRECTLY_VISIBLE",
        conflictsWith: []
      });
    }
  };

  const visual = identity.visualRecognition || {};
  add("visible_text", [identity.visibleText, visual.visibleWords, visual.visibleLetters].flat(), { origin: "DIRECTLY_VISIBLE" });
  add("logo", visual.visibleLogos, { origin: "DIRECTLY_VISIBLE" });
  add("maker_mark", [identity.makerIdentity, identity.manufacturerLocationText, identity.copyrightWording], { origin: "DIRECTLY_VISIBLE" });
  add("brand", [identity.brand, identity.manufacturer, visual.recognizedBrand]);
  add("model_number", [identity.model, identity.modelOrItemNumber]);
  add("barcode", identity.upcBarcode, { origin: "DIRECTLY_VISIBLE" });
  add("item_code", [identity.sku, identity.styleNumber], { origin: "DIRECTLY_VISIBLE" });
  add("package_count", [identity.packageQuantity, identity.unitCount, identity.packageSize]);
  add("dimensions", [identity.dimensions, identity.size]);
  add("shape", identity.shape);
  add("material", identity.material);
  add("construction", identity.construction);
  add("color", [identity.color, visual.visibleColors].flat());
  add("condition", identity.condition);
  add("completeness", [identity.completeness, identity.missingComponentStatus]);
  add("accessory", identity.accessories);
  add("diagnostic_visual_detail", [identity.diagnosticVisualDetails, visual.distinctiveFeatures, visual.visualEvidence].flat(), { origin: "DIRECTLY_VISIBLE" });
  add("design", [identity.distinctiveVisualDescription, visual.visualStyle, visual.recognizedTheme]);
  add("product_name", [identity.productNameOrBoxTitle, identity.exactProductIdentity]);
  add("broader_identity", [identity.subjectIdentity, visual.visualSubject, identity.likelyItemDescription, identity.category]);
  for (const clue of neutralInput.identityClues || []) {
    add(clue.label.replace(/\s+/g, "_"), clue.value, {
      origin: "USER_PROVIDED",
      sourceIds: ["request-description"],
      certaintyBand: "MEDIUM"
    });
  }
  add("condition_concern", neutralInput.conditionConcerns, {
    origin: "USER_PROVIDED",
    sourceIds: ["request-description"],
    certaintyBand: "MEDIUM"
  });
  return observations;
}

function observationIdsForText(observations = [], values = []) {
  const needles = boundedUniqueStrings(values, 32, 180).map(normalizeObjectText).filter(Boolean);
  if (!needles.length) return observations.slice(0, 4).map((item) => item.observationId);
  return observations
    .filter((observation) => needles.some((needle) => (
      observation.normalizedValue.includes(needle)
      || needle.includes(observation.normalizedValue)
    )))
    .slice(0, 12)
    .map((observation) => observation.observationId);
}

function normalizeHypothesis(raw = {}, observations = [], index = 0) {
  const exactCandidateLabel = known(raw.exactCandidateLabel || raw.candidateLabel || raw.label);
  const broaderFamilyIdentity = known(raw.broaderFamilyIdentity || raw.broaderIdentity || raw.familyIdentity);
  const brandOrMaker = known(raw.brandOrMaker || raw.brand || raw.maker);
  const model = known(raw.model);
  const variant = known(raw.variantPackageEditionDesign || raw.variant || raw.edition || raw.design);
  const supporting = boundedUniqueStrings(raw.supportingObservations || raw.supports, 12, 180);
  const contradicting = boundedUniqueStrings(raw.contradictingObservations || raw.contradictions, 12, 180);
  const unresolved = boundedUniqueStrings(raw.unresolvedDiscriminators || raw.unresolved, 10, 180);
  const distinguishing = boundedUniqueStrings(raw.distinguishingQueryOrObservation || raw.distinguishingEvidence, 8, 180);
  const label = exactCandidateLabel || broaderFamilyIdentity || compactIdentity([brandOrMaker, model, variant]) || `Unresolved candidate ${index + 1}`;
  const projection = { label, broaderFamilyIdentity, brandOrMaker, model, variant };
  return {
    candidateId: stableInternalId("candidate", projection, 14),
    exactCandidateLabel,
    broaderFamilyIdentity,
    brandOrMaker,
    model,
    variantPackageEditionDesign: variant,
    supportingObservationIds: observationIdsForText(observations, supporting.length ? supporting : [label, brandOrMaker, model]),
    supportingObservations: supporting,
    contradictingObservationIds: observationIdsForText(observations, contradicting),
    contradictingObservations: contradicting,
    unresolvedDiscriminators: unresolved,
    distinguishingQueryOrObservation: distinguishing,
    exactnessLevel: known(raw.exactnessLevel) || (exactCandidateLabel ? "EXACT_CANDIDATE" : "BROADER_FAMILY"),
    confidenceBand: known(raw.confidenceBand) || "MEDIUM"
  };
}

function compactIdentity(values = []) {
  return values.map(known).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function deriveHypotheses(identity = {}, observations = []) {
  const supplied = Array.isArray(identity.identityHypotheses) ? identity.identityHypotheses : [];
  const candidates = supplied.map((item, index) => normalizeHypothesis(item, observations, index));
  const fallbacks = [];
  const exact = known(identity.exactProductIdentity || identity.productNameOrBoxTitle);
  const broad = known(identity.subjectIdentity || identity.visualRecognition?.visualSubject || identity.likelyItemDescription || identity.category);
  if (exact) {
    fallbacks.push(normalizeHypothesis({
      exactCandidateLabel: exact,
      broaderFamilyIdentity: broad,
      brandOrMaker: identity.brand || identity.makerIdentity || identity.manufacturer,
      model: identity.model || identity.modelOrItemNumber,
      variant: compactIdentity([identity.packageQuantity, identity.size, identity.color]),
      supportingObservations: [identity.visualIdentityEvidence, identity.textIdentityEvidence, identity.strongestSearchableIdentifiers].flat(),
      contradictingObservations: identity.identityConflictNotes,
      unresolvedDiscriminators: identity.identityUnknowns,
      exactnessLevel: "EXACT_CANDIDATE",
      confidenceBand: identity.exactProductConfidence
    }, observations, candidates.length));
  }
  for (const interpretation of boundedUniqueStrings(identity.visualRecognition?.possibleInterpretations, 5, 180)) {
    fallbacks.push(normalizeHypothesis({
      exactCandidateLabel: "",
      broaderFamilyIdentity: interpretation,
      supportingObservations: identity.visualRecognition?.visualEvidence,
      unresolvedDiscriminators: identity.visualRecognition?.stillUnknown,
      exactnessLevel: "BROADER_FAMILY",
      confidenceBand: "LOW"
    }, observations, candidates.length + fallbacks.length));
  }
  if (!candidates.length && broad) {
    fallbacks.push(normalizeHypothesis({
      broaderFamilyIdentity: broad,
      brandOrMaker: identity.brand || identity.makerIdentity || identity.manufacturer,
      supportingObservations: identity.visualIdentityEvidence,
      unresolvedDiscriminators: identity.identityUnknowns,
      exactnessLevel: "BROADER_FAMILY",
      confidenceBand: identity.subjectConfidence
    }, observations, fallbacks.length));
  }
  const unique = new Map();
  for (const candidate of [...candidates, ...fallbacks]) {
    if (!unique.has(candidate.candidateId)) unique.set(candidate.candidateId, candidate);
  }
  return [...unique.values()].slice(0, 6);
}

function resolveIdentity(identity = {}, hypotheses = [], observations = []) {
  const barcode = normalizeIdentifier(identity.upcBarcode);
  const validatedBarcode = isValidRetailIdentifier(barcode) ? barcode : "";
  const model = known(identity.model || identity.modelOrItemNumber);
  const brand = known(identity.brand || identity.makerIdentity || identity.manufacturer);
  const exactLabel = known(identity.exactProductIdentity || identity.productNameOrBoxTitle);
  const broadLabel = known(identity.subjectIdentity || identity.visualRecognition?.visualSubject || identity.likelyItemDescription || identity.category);
  const confidence = normalizeObjectText(identity.exactProductConfidence);
  const exactSupported = Boolean(validatedBarcode || (model && brand) || (exactLabel && /high|strong|certain/.test(confidence)));
  const selected = hypotheses.find((candidate) => exactLabel && normalizeObjectText(candidate.exactCandidateLabel) === normalizeObjectText(exactLabel))
    || hypotheses[0]
    || null;
  const exactnessClassification = exactSupported
    ? OBJECT_EXACTNESS.EXACT_ITEM
    : exactLabel || (broadLabel && observations.some((item) => item.factType === "design"))
      ? OBJECT_EXACTNESS.EXACT_DESIGN_VARIATION_UNRESOLVED
      : broadLabel
        ? OBJECT_EXACTNESS.BROADER_IDENTITY
        : OBJECT_EXACTNESS.UNRESOLVED;
  const limitations = boundedUniqueStrings([
    identity.identityConflictNotes,
    identity.identityUnknowns,
    identity.visualRecognition?.visualConflicts,
    identity.visualRecognition?.stillUnknown
  ].flat(), 16, 180);
  const additionalEvidenceNeeded = boundedUniqueStrings([
    identity.additionalEvidenceNeeded,
    ...limitations,
    ...hypotheses.flatMap((candidate) => candidate.distinguishingQueryOrObservation)
  ], 12, 180);
  const projection = {
    exactLabel,
    broadLabel,
    brand,
    model,
    validatedBarcode,
    exactnessClassification
  };
  return {
    selectedCandidateId: selected?.candidateId || "",
    stableIdentityKey: stableInternalId("identity", projection, 18),
    exactnessClassification,
    bestSupportedCustomerIdentity: exactSupported ? (exactLabel || compactIdentity([brand, model]) || broadLabel) : (broadLabel || exactLabel),
    broaderFallbackIdentity: broadLabel || known(selected?.broaderFamilyIdentity),
    brandOrMaker: brand,
    model,
    validatedBarcode,
    remainingAlternativeCandidateIds: hypotheses.filter((candidate) => candidate.candidateId !== selected?.candidateId).map((candidate) => candidate.candidateId),
    limitations,
    additionalEvidenceNeeded
  };
}

function identityHashProjection(state = {}) {
  return {
    schemaVersion: state.schemaVersion,
    inputImageIds: state.requestIdentity?.inputImageIds || [],
    inputDescriptionSha256: state.requestIdentity?.inputDescriptionProvenance?.sha256 || "",
    observedFacts: (state.observedFacts || []).map((item) => ({
      factType: item.factType,
      normalizedValue: item.normalizedValue,
      certaintyBand: item.certaintyBand,
      origin: item.origin
    })),
    identityHypotheses: (state.identityHypotheses || []).map((candidate) => ({
      candidateId: candidate.candidateId,
      exactCandidateLabel: candidate.exactCandidateLabel,
      broaderFamilyIdentity: candidate.broaderFamilyIdentity,
      brandOrMaker: candidate.brandOrMaker,
      model: candidate.model,
      variantPackageEditionDesign: candidate.variantPackageEditionDesign,
      exactnessLevel: candidate.exactnessLevel,
      confidenceBand: candidate.confidenceBand
    })),
    resolvedIdentity: state.resolvedIdentity
  };
}

export function createObjectMindState({
  analysisId = "",
  photos = [],
  neutralInput = createPurposeNeutralObjectInput(),
  extractedIdentity = {}
} = {}) {
  const images = inputImageRecords(photos);
  const observations = buildObservations(extractedIdentity, neutralInput, images);
  const hypotheses = deriveHypotheses(extractedIdentity, observations);
  const resolvedIdentity = resolveIdentity(extractedIdentity, hypotheses, observations);
  const objectStateId = stableInternalId("object-state", {
    schemaVersion: OBJECT_MIND_SCHEMA_VERSION,
    inputImageIds: images.map((image) => image.imageId),
    descriptionSha256: neutralInput.descriptionProvenance?.sha256 || ""
  }, 18);
  const state = {
    schemaVersion: OBJECT_MIND_SCHEMA_VERSION,
    objectStateId,
    requestIdentity: {
      analysisId: cleanObjectText(analysisId, 120),
      inputImageIds: images.map((image) => image.imageId),
      purpose: neutralInput.purpose,
      inputDescriptionProvenance: neutralInput.descriptionProvenance,
      stateSchemaVersion: OBJECT_MIND_SCHEMA_VERSION
    },
    observedFacts: observations,
    observationConflicts: boundedUniqueStrings([
      extractedIdentity.identityConflictNotes,
      extractedIdentity.visualRecognition?.visualConflicts
    ].flat(), 12, 180),
    identityHypotheses: hypotheses,
    resolvedIdentity,
    searchPlan: [],
    candidateEvidence: [],
    verifiedEvidenceSummary: {
      acceptedExactItemSourceIds: [],
      acceptedExactDesignSourceIds: [],
      unresolvedVariationSourceIds: [],
      compatibleSourceIds: [],
      insufficientSourceIds: [],
      similarSourceIds: [],
      rejectedSourceIds: [],
      unresolvedSourceIds: [],
      evidenceGaps: resolvedIdentity.additionalEvidenceNeeded
    },
    resolutionHistory: [{
      transitionId: stableInternalId("transition", [objectStateId, "IDENTITY_STATE_FROZEN"], 14),
      sequence: 1,
      event: "IDENTITY_STATE_FROZEN",
      factsAdded: observations.map((item) => item.observationId).slice(0, 32),
      candidateId: resolvedIdentity.selectedCandidateId,
      outcome: resolvedIdentity.exactnessClassification,
      reason: "Purpose-neutral observations and bounded identity hypotheses were reconciled before market advice."
    }],
    refinementCount: 0,
    identityStateHash: ""
  };
  state.identityStateHash = sha256Object(identityHashProjection(state));
  return state;
}

export function withObjectSearchPlan(state = {}, searchPlan = []) {
  return {
    ...state,
    searchPlan: searchPlan.slice(0, 16)
  };
}

export function purposeNeutralIdentityProjection(state = {}) {
  return identityHashProjection(state);
}
