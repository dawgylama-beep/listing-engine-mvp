import {
  boundedUniqueStrings,
  cleanObjectText,
  normalizeObjectText,
  sha256Object,
  stableInternalId,
  stableObjectJson
} from "../object-intelligence/stable.js";
import {
  COGNITIVE_ACTION,
  COGNITIVE_GOVERNOR_SCHEMA_VERSION,
  CUSTOMER_INPUT_STATUS,
  MAX_COGNITIVE_ACTIONS,
  SAFETY_STATE
} from "./constants.js";

const QUERY_STOP_WORDS = new Set([
  "a", "an", "and", "at", "buy", "find", "for", "from", "in", "listing",
  "of", "on", "or", "result", "results", "search", "the", "to", "with"
]);

function canonicalArray(value = [], mapper = (item) => item) {
  const unique = new Map();
  for (const item of Array.isArray(value) ? value : value ? [value] : []) {
    const mapped = mapper(item);
    if (mapped === undefined || mapped === null || mapped === "") continue;
    unique.set(stableObjectJson(mapped), mapped);
  }
  return [...unique.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, item]) => item);
}

function semanticText(value, maximumCharacters = 180) {
  return normalizeObjectText(cleanObjectText(value, maximumCharacters));
}

function substantiveFactText(value, maximumCharacters = 180) {
  const text = semanticText(value, maximumCharacters);
  return /^(?:unknown(?: subject| item| object)?|unidentified(?: subject| item| object)?|none|not visible|not provided|not known|not verified|not identified|unverified|undetermined|unavailable|n a|na)$/.test(text)
    ? ""
    : text;
}

const CUSTOMER_FACT_FIELDS = Object.freeze({
  MAKER_MARK: ["maker_mark"],
  MODEL_OR_CATALOG_NUMBER: ["model_number"],
  BARCODE: ["barcode"],
  DIMENSIONS: ["dimensions"],
  PACKAGE_CONFIGURATION: ["package_configuration"],
  MATERIAL_OR_COMPONENT: ["material_component"],
  CONDITION_DETAIL: ["condition_detail"],
  CLEARER_PHOTOGRAPH: ["clearer_photograph"]
});

export function classifyCustomerFactRequest(value = "") {
  const text = semanticText(value, 240);
  if (/maker|mark|stamp|logo|signature/.test(text)) return "MAKER_MARK";
  if (/model|catalog|item number|style number|sku/.test(text)) return "MODEL_OR_CATALOG_NUMBER";
  if (/barcode|upc/.test(text)) return "BARCODE";
  if (/dimension|size|measure|height|width|length|diameter/.test(text)) return "DIMENSIONS";
  if (/quantity|count|package|configuration|piece/.test(text)) return "PACKAGE_CONFIGURATION";
  if (/material|component|construction/.test(text)) return "MATERIAL_OR_COMPONENT";
  if (/damage|condition|crack|chip|missing|wear|joint|connector|electrical|sharp|contamination|fire/.test(text)) return "CONDITION_DETAIL";
  return text ? "CLEARER_PHOTOGRAPH" : "";
}

export function requestedFieldsForType(requestType = "") {
  return [...(CUSTOMER_FACT_FIELDS[cleanObjectText(requestType, 80).toUpperCase()] || [])];
}

function availableCustomerFacts(observations = []) {
  const available = new Map();
  const add = (field, observation) => {
    const normalizedValue = substantiveFactText(observation?.normalizedValue || observation?.value, 180);
    if (!field || !normalizedValue) return;
    if (!available.has(field)) available.set(field, []);
    available.get(field).push(cleanObjectText(observation.observationIdentity || observation.observationId, 100));
  };
  for (const observation of observations) {
    const type = semanticText(observation.factType, 80).replaceAll(" ", "_");
    if (type === "maker_mark") add("maker_mark", observation);
    if (["model", "model_number", "catalog_number", "item_code", "sku_or_item_code"].includes(type)) add("model_number", observation);
    if (/barcode|upc/.test(type)) add("barcode", observation);
    if (/dimension|size/.test(type)) add("dimensions", observation);
    if (/package_count|package_quantity|piece_count|configuration/.test(type)) add("package_configuration", observation);
    if (/material|component|construction/.test(type)) add("material_component", observation);
    if (/condition|completeness|damage|wear|missing/.test(type)) add("condition_detail", observation);
    if (/structural_damage_closeup|electrical_damage_closeup|safety_detail/.test(type)) add(type, observation);
  }
  return Object.fromEntries([...available.entries()].map(([field, sourceObservationIds]) => [
    field,
    { field, available: true, sourceObservationIds: boundedUniqueStrings(sourceObservationIds, 8, 100) }
  ]));
}

function safetyHazardClass(text = "") {
  if (/structur|load bearing|load-bearing|support|frame|joint|leg|rung|mount|anchor/.test(text)) return "STRUCTURAL";
  if (/electric|wire|cord|plug|battery|voltage|shock|short circuit|short-circuit/.test(text)) return "ELECTRICAL";
  if (/sharp|broken glass|cutting edge|exposed blade|splinter/.test(text)) return "SHARP_EDGE";
  if (/\bmold\b|\bmildew\b|contamin|biohazard|chemical|asbestos|lead paint|bodily fluid/.test(text)) return "CONTAMINATION";
  if (/fire|burn|scorch|charred|melted|fuel leak|gas leak|overheat/.test(text)) return "FIRE";
  if (/child safety|choking|tip over|tip-over|strangulation|entrapment/.test(text)) return "CHILD_SAFETY";
  return "OTHER_CONDITION";
}

export function deriveSafetyState(observations = []) {
  const relevant = observations
    .filter((record) => /condition|completeness|damage|construction|material|diagnostic|concern|safety|structural|electrical/i.test(record.factType || ""))
    .map((record) => ({
      observationIdentity: cleanObjectText(record.observationIdentity || record.observationId, 100),
      factType: cleanObjectText(record.factType, 80),
      normalizedValue: semanticText(record.normalizedValue || record.value, 240),
      certaintyBand: cleanObjectText(record.certaintyBand, 40).toUpperCase(),
      origin: cleanObjectText(record.origin, 60).toUpperCase()
    }))
    .filter((record) => record.normalizedValue)
    .slice(0, 16);
  const combined = relevant.map((record) => `${record.factType} ${record.normalizedValue}`).join(" ");
  const hazardClass = safetyHazardClass(combined);
  const uncertainty = /possible|possibly|potential|suspect|uncertain|unknown|cannot confirm|cannot determine|may be|might be|appears/.test(combined);
  const severeDamage = /fractur|crack|split|broken|detached|separated|collapsed|failur|failed|exposed wire|frayed cord|sparking|broken glass|sharp edge|\bmold\b|\bmildew\b|contamin|burn|scorch|charred|fuel leak|gas leak/.test(combined);
  const structuralContext = /structur|load bearing|load-bearing|support|frame|joint|leg|rung|mount|anchor/.test(combined);
  const multipleStructuralFailure = /crack|fractur|split|broken/.test(combined) && /detached|separated|missing|collapsed|failed/.test(combined);
  const criticalHazard = (hazardClass !== "OTHER_CONDITION" && severeDamage)
    || (structuralContext && severeDamage)
    || multipleStructuralFailure;
  const professionalOnly = /professional|qualified inspection|internal damage|internal integrity|cannot be resolved by (?:a )?(?:photo|photograph)|cannot be safely verified visually/.test(combined);
  const ordinaryWearOnly = Boolean(combined)
    && /wear|scuff|scratch|patina|fading|minor chip|cosmetic/.test(combined)
    && !criticalHazard;
  const caution = !criticalHazard && !ordinaryWearOnly && /crack|chip|loose|damage|missing|wear|untested|not working|repair/.test(combined);
  const disposition = criticalHazard
    ? uncertainty
      ? SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY
      : SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED
    : caution
      ? SAFETY_STATE.CAUTION_REQUIRED
      : SAFETY_STATE.NO_BLOCKING_SAFETY_CONDITION;
  const resolutionCustomerFactUseful = disposition === SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY && !professionalOnly;
  const requestedField = resolutionCustomerFactUseful
    ? `${hazardClass.toLowerCase()}_damage_closeup`
    : "";
  const mandatoryCustomerDisposition = disposition === SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED
    ? "Do not use this item. Remove it from service and obtain qualified repair or inspection; if transfer is lawful and safe, describe it only as damaged or for parts/repair with the hazard disclosed."
    : disposition === SAFETY_STATE.CAUTION_REQUIRED
      ? "Inspect and disclose the condition issue before use, purchase, or sale."
      : disposition === SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY
        ? "Do not recommend ordinary use, purchase, or sale until the potential critical hazard is resolved."
        : "";
  return {
    disposition,
    hazardClass,
    observedSafetyFacts: relevant,
    criticalSafetyCondition: disposition === SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED
      || disposition === SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY,
    hazardConfirmed: disposition === SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED,
    hazardResolved: disposition !== SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY,
    resolutionCustomerFactUseful,
    requestedFields: requestedField ? [requestedField] : [],
    mandatoryCustomerDisposition,
    mandatoryDispositionRequired: disposition === SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED,
    ordinaryPurposeJudgmentBlocked: disposition === SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED
      || disposition === SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY,
    safetyOnlyOutcomeAllowed: disposition === SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED
  };
}

export function normalizeQueryIdentity(value) {
  const tokens = semanticText(value, 500)
    .split(/\s+/)
    .map((token) => token.replace(/^['"]+|['"]+$/g, ""))
    .filter((token) => token && !QUERY_STOP_WORDS.has(token));
  return [...new Set(tokens)].sort().join(" ");
}

function normalizePurpose(value) {
  const purpose = semanticText(value, 80);
  if (/seller|listing/.test(purpose)) return "MARKETPLACE_LISTING";
  if (/resale|resell/.test(purpose)) return "RESALE";
  if (/owner|worth|value/.test(purpose)) return "WHATS_IT_WORTH";
  return "PERSONAL_BUY";
}

export function createCustomerMissionContext(value = {}) {
  const source = value && typeof value === "object" ? value : {};
  const risk = semanticText(source.riskTolerance || source.risk_tolerance, 40);
  const budget = Number(source.budgetCents ?? source.asking_price_cents);
  return {
    purpose: normalizePurpose(source.purpose || source.purchase_intent || source.buyer_intent),
    hasBudget: source.hasBudget === true || (Number.isFinite(budget) && budget >= 0),
    hasIntendedRecipient: source.hasIntendedRecipient === true || Boolean(cleanObjectText(source.intendedRecipient || source.intended_recipient, 80)),
    hasOccasion: source.hasOccasion === true || Boolean(cleanObjectText(source.occasion, 80)),
    hasTimingConstraint: source.hasTimingConstraint === true || Boolean(cleanObjectText(source.timing || source.selling_speed, 80)),
    hasPreferredChannel: source.hasPreferredChannel === true || Boolean(cleanObjectText(source.preferredChannel || source.retailer_or_marketplace_name || source.platform, 80)),
    riskTolerance: /high/.test(risk) ? "HIGH" : /low|cautious/.test(risk) ? "LOW" : "UNSPECIFIED",
    personalPriorityCount: Math.max(
      0,
      Number(source.personalPriorityCount) || boundedUniqueStrings(source.personalPriorities || source.personal_priorities, 8, 80).length
    )
  };
}

function observationProjection(record = {}) {
  return {
    observationIdentity: cleanObjectText(record.observationId || record.observationIdentity, 100),
    factType: semanticText(record.factType, 80),
    value: semanticText(record.normalizedValue || record.value, 240),
    certaintyBand: semanticText(record.certaintyBand, 40).toUpperCase(),
    origin: semanticText(record.origin, 60).toUpperCase()
  };
}

function hypothesisProjection(record = {}) {
  return {
    exactCandidate: semanticText(record.exactCandidateLabel, 240),
    broaderFamily: semanticText(record.broaderFamilyIdentity, 240),
    brandOrMaker: semanticText(record.brandOrMaker, 160),
    model: semanticText(record.model, 120),
    variant: semanticText(record.variantPackageEditionDesign, 180),
    exactnessLevel: semanticText(record.exactnessLevel, 80).toUpperCase(),
    confidenceBand: semanticText(record.confidenceBand, 40).toUpperCase(),
    supportingFacts: canonicalArray(record.supportingObservationIds, (item) => semanticText(item, 100)),
    conflicts: canonicalArray(record.contradictingObservations, (item) => semanticText(item, 180)),
    unresolvedDiscriminators: canonicalArray(record.unresolvedDiscriminators, (item) => semanticText(item, 180))
  };
}

function evidenceProjection(record = {}) {
  const classification = cleanObjectText(
    record.objectMindClassification || record.exactnessClassification || record.canonicalMatchQuality,
    100
  ).toUpperCase();
  const verification = cleanObjectText(
    record.objectMindVerificationState || record.verificationState,
    100
  ).toUpperCase();
  const sourceIdentity = cleanObjectText(
    record.objectMindSourceId || record.sourceRecordId || record.sourceId || record.evidenceId,
    180
  ) || stableInternalId("evidence", [
    record.canonicalUrl || record.destinationUrl || record.url,
    record.title,
    record.source
  ], 16);
  const evidenceTextHash = cleanObjectText(record.sourceEvidenceText || record.pageEvidenceText, 2000)
    ? sha256Object(cleanObjectText(record.sourceEvidenceText || record.pageEvidenceText, 2000))
    : "";
  return {
    sourceIdentity,
    owningHypothesisId: cleanObjectText(record.objectMindHypothesisId || record.owningHypothesisId, 100),
    classification,
    verification,
    directPageEligible: Boolean(record.objectMindDirectPageEligible || record.directPageEligible),
    directPageVerified: Boolean(record.objectMindDirectPageVerified || record.directPageVerified),
    evidenceTextHash,
    supportingFacts: canonicalArray(
      record.objectMindSupportingAttributes || record.supportingAttributes,
      (item) => semanticText(typeof item === "string" ? item : stableObjectJson(item), 180)
    ),
    conflictingFacts: canonicalArray(
      record.objectMindConflictingAttributes || record.conflictingAttributes,
      (item) => semanticText(typeof item === "string" ? item : stableObjectJson(item), 180)
    )
  };
}

function resolveEvidenceCounts(evidence = []) {
  const counts = {
    verifiedExactEvidence: 0,
    unresolvedPlausibleEvidence: 0,
    compatibleEvidence: 0,
    rejectedOrUnrelatedEvidence: 0
  };
  for (const record of evidence) {
    if (/EXACT_ITEM|^EXACT$/.test(record.classification) && /VERIFIED|ACCEPTED/.test(record.verification)) {
      counts.verifiedExactEvidence += 1;
    } else if (/COMPATIBLE/.test(`${record.classification} ${record.verification}`)) {
      counts.compatibleEvidence += 1;
    } else if (/REJECTED|UNRELATED|SIMILAR_OBJECT/.test(`${record.classification} ${record.verification}`)) {
      counts.rejectedOrUnrelatedEvidence += 1;
    } else {
      counts.unresolvedPlausibleEvidence += 1;
    }
  }
  return counts;
}

function resolutionProjection(objectMindState = {}) {
  const resolved = objectMindState.resolvedIdentity || {};
  const bestSupportedIdentity = substantiveFactText(resolved.bestSupportedCustomerIdentity, 240);
  const broaderFallbackIdentity = substantiveFactText(resolved.broaderFallbackIdentity, 240);
  const projectedStatus = cleanObjectText(resolved.exactnessClassification || "UNRESOLVED", 100).toUpperCase();
  return {
    status: bestSupportedIdentity || broaderFallbackIdentity ? projectedStatus : "UNRESOLVED",
    stableIdentityKey: cleanObjectText(resolved.stableIdentityKey, 120),
    selectedCandidateId: cleanObjectText(resolved.selectedCandidateId, 100),
    bestSupportedIdentity,
    broaderFallbackIdentity,
    brandOrMaker: semanticText(resolved.brandOrMaker, 160),
    model: semanticText(resolved.model, 120),
    validatedBarcode: semanticText(resolved.validatedBarcode, 80),
    limitations: canonicalArray(resolved.limitations, (item) => semanticText(item, 180)),
    additionalEvidenceNeeded: canonicalArray(resolved.additionalEvidenceNeeded, (item) => semanticText(item, 180))
  };
}

function actionTargetProjection(record = {}) {
  return {
    actionType: cleanObjectText(record.actionType, 80),
    inputKnowledgeStateHash: cleanObjectText(record.inputKnowledgeStateHash, 80),
    targetIdentity: cleanObjectText(record.targetIdentity, 100)
  };
}

function planProjection(records = []) {
  return canonicalArray(records, (record) => ({
    queryIdentity: normalizeQueryIdentity(record.query || record.normalizedQuery),
    hypothesisId: cleanObjectText(record.objectMindHypothesisId || record.owningHypothesisId, 100),
    discriminatorIdentity: semanticText(record.objectMindDiscriminatorTested || record.discriminatorTested, 180),
    phase: cleanObjectText(record.objectMindPhase || record.phase || "INITIAL", 40).toUpperCase()
  })).filter((record) => record.queryIdentity);
}

function directCandidateProjection(records = [], activeHypothesisIds = [], actionLedger = [], knowledgeStateHash = "") {
  const active = new Set(activeHypothesisIds.filter(Boolean));
  const attempted = new Set(actionLedger
    .filter((record) => record.actionType === COGNITIVE_ACTION.VERIFY_DIRECT_PAGE)
    .filter((record) => record.inputKnowledgeStateHash === knowledgeStateHash)
    .map((record) => record.targetIdentity));
  return canonicalArray(records, (record) => {
    const evidence = evidenceProjection(record);
    const hypothesisId = evidence.owningHypothesisId;
    const targetIdentity = stableInternalId("direct-target", [evidence.sourceIdentity, hypothesisId], 18);
    const contradicted = evidence.conflictingFacts.length > 0 || /REJECTED|UNRELATED/.test(`${evidence.classification} ${evidence.verification}`);
    const qualified = Boolean(record.objectMindDirectPageEligible || record.directPageEligible)
      && !evidence.directPageVerified
      && !contradicted
      && (!active.size || active.has(hypothesisId));
    if (!qualified || attempted.has(targetIdentity)) return null;
    return {
      targetIdentity,
      sourceIdentity: evidence.sourceIdentity,
      hypothesisId,
      informationPoor: !evidence.evidenceTextHash || /UNRESOLVED|INSUFFICIENT/.test(evidence.verification)
    };
  }).filter(Boolean);
}

function budgetState(value = {}, fallbackMaximum = 0) {
  const maximum = Math.max(0, Number(value.maximum ?? value.maximumAttempts ?? fallbackMaximum) || 0);
  const consumed = Math.max(0, Number(value.consumed ?? value.physicalAttemptCount) || 0);
  return { maximum, consumed, remaining: Math.max(0, maximum - consumed) };
}

const EXECUTIVE_EVIDENCE_CONDITIONS = new Set(["INITIAL", "INSUFFICIENT", "SUPPORTED", "CONTRADICTED"]);
const EXECUTIVE_AUTHORITY_CLASSES = new Set(["EXISTING", "NEW_REQUIRED", "NO_ACTION_REQUIRED", "UNRESOLVED"]);
const EXECUTIVE_FAILURE_SCOPES = new Set(["BOUNDED", "ARCHITECTURAL", "INSUFFICIENT_EVIDENCE"]);
const EXECUTIVE_UNCERTAINTY_CLASSES = new Set([
  "NONE", "NEW_AUTHORITY_REQUIRED", "INSUFFICIENT_EVIDENCE", "NO_SAFE_ADVANCING_ACTION",
  "REPEATED_LOOP_OR_DUPLICATE"
]);
const EXECUTIVE_DOSSIER_STAGES = new Set(["NOT_APPLICABLE", "CAPABLE", "RETURNED", "EVALUATED"]);
const EXECUTIVE_STOPPING_STATES = new Set([
  "ACTIVE", "COMPLETE", "INSUFFICIENT_EVIDENCE", "AUTHORITY_REQUIRED", "NO_SAFE_ACTION", "REPEATED_LOOP"
]);
const EXECUTIVE_MEMORY_REUSE_BOUNDARIES = new Set(["AUTO", "ANALOGUE", "NOVEL"]);

function closedExecutiveValue(value, allowed, fallback) {
  const normalized = cleanObjectText(value, 100).toUpperCase();
  if (!normalized) return fallback;
  if (!allowed.has(normalized)) throw new Error(`Purpose-neutral executive state contains a noncanonical value: ${normalized}.`);
  return normalized;
}

function publicEvidenceIdentity(value) {
  const identity = cleanObjectText(value, 180);
  if (!identity) return "";
  if (/^[a-f0-9]{64}$/i.test(identity)) {
    throw new Error("Runtime hashes cannot be represented as public evidence identities.");
  }
  if (/^(?:governed-evaluation|cognitive-action|mentor-decision|memory-context|runtime-identity)-/i.test(identity)) {
    throw new Error("Private runtime authority identities cannot be represented as public evidence identities.");
  }
  return identity;
}

function normalizePurposeNeutralExecutiveState(value, {
  evidence,
  initialAcquisitionExecuted,
  evidenceSufficiency,
  terminalStatus
}) {
  const supplied = value && typeof value === "object" && !Array.isArray(value) ? value : null;
  const visibleEvidenceIds = canonicalArray(
    supplied?.visibleEvidenceIds || evidence.map((record) => record.sourceIdentity),
    publicEvidenceIdentity
  );
  const visible = new Set(visibleEvidenceIds);
  const requiredEvidenceIds = canonicalArray(supplied?.requiredEvidenceIds || [], publicEvidenceIdentity);
  if (requiredEvidenceIds.some((identity) => !visible.has(identity))) {
    throw new Error("Required executive evidence must be drawn from the visible evidence inventory.");
  }
  const fallbackEvidenceCondition = !initialAcquisitionExecuted && visibleEvidenceIds.length === 0
    ? "INITIAL"
    : evidenceSufficiency.evidenceSufficientForPurpose
      ? "SUPPORTED"
      : "INSUFFICIENT";
  const stoppingFallback = terminalStatus
    ? /COMPLETE/i.test(terminalStatus) ? "COMPLETE" : "INSUFFICIENT_EVIDENCE"
    : "ACTIVE";
  const failureScopeFallback = fallbackEvidenceCondition === "INSUFFICIENT"
    ? "INSUFFICIENT_EVIDENCE"
    : "BOUNDED";
  const prohibitedOperations = canonicalArray(
    supplied?.prohibitedOperations || ["OUTSIDE_EXISTING_AUTHORITY"],
    (item) => cleanObjectText(item, 120).toUpperCase()
  );
  const permittedOperations = canonicalArray(
    supplied?.permittedOperations || [],
    (item) => cleanObjectText(item, 120).toUpperCase()
  );
  if (permittedOperations.some((operation) => prohibitedOperations.includes(operation))) {
    throw new Error("An executive operation cannot be both permitted and prohibited.");
  }
  return {
    schemaVersion: "1.0",
    mode: supplied ? "PURPOSE_NEUTRAL" : "PRODUCT_OBJECT_EVIDENCE",
    missionObjective: cleanObjectText(supplied?.missionObjective, 500),
    finishLine: cleanObjectText(supplied?.finishLine, 500),
    earliestCausalBoundary: cleanObjectText(supplied?.earliestCausalBoundary, 240) || "OBSERVED_EVIDENCE_BOUNDARY",
    visibleEvidenceIds,
    requiredEvidenceIds,
    evidenceCondition: closedExecutiveValue(
      supplied?.evidenceCondition,
      EXECUTIVE_EVIDENCE_CONDITIONS,
      fallbackEvidenceCondition
    ),
    failureCondition: cleanObjectText(supplied?.failureCondition, 500),
    failureScope: closedExecutiveValue(supplied?.failureScope, EXECUTIVE_FAILURE_SCOPES, failureScopeFallback),
    uncertaintyClass: closedExecutiveValue(
      supplied?.uncertaintyClass,
      EXECUTIVE_UNCERTAINTY_CLASSES,
      fallbackEvidenceCondition === "INSUFFICIENT" ? "INSUFFICIENT_EVIDENCE" : "NONE"
    ),
    authorityClass: closedExecutiveValue(supplied?.authorityClass, EXECUTIVE_AUTHORITY_CLASSES, "EXISTING"),
    permittedOperations,
    prohibitedOperations,
    safeContinuation: supplied?.safeContinuation !== false,
    newMechanismRequired: Boolean(supplied?.newMechanismRequired),
    contradictionPresent: Boolean(supplied?.contradictionPresent),
    cycleDetected: Boolean(supplied?.cycleDetected),
    duplicateDetected: Boolean(supplied?.duplicateDetected),
    memoryReuseBoundary: closedExecutiveValue(
      supplied?.memoryReuseBoundary,
      EXECUTIVE_MEMORY_REUSE_BOUNDARIES,
      "AUTO"
    ),
    dossierStage: closedExecutiveValue(supplied?.dossierStage, EXECUTIVE_DOSSIER_STAGES, "NOT_APPLICABLE"),
    stoppingState: closedExecutiveValue(supplied?.stoppingState, EXECUTIVE_STOPPING_STATES, stoppingFallback)
  };
}

export function createCognitiveState({
  evaluationId = "",
  objectMindState = {},
  evidenceRecords = objectMindState.candidateEvidence || [],
  providerRequests = [],
  initialPlan = objectMindState.searchPlan || [],
  refinementPlan = [],
  directPageCandidates = evidenceRecords,
  providerBudget = {},
  directPageBudget = {},
  actionLedger = [],
  blockedActionSignatures = [],
  customerMission = createCustomerMissionContext(),
  requestedCustomerInput = null,
  canonicalEvidenceFinalized = false,
  purposeJudgmentCompleted = false,
  customerOutcome = {},
  terminalStatus = "",
  reportGenerated = false,
  executiveState = null
} = {}) {
  const observations = canonicalArray(objectMindState.observedFacts, observationProjection);
  const hypotheses = canonicalArray(objectMindState.identityHypotheses, hypothesisProjection);
  const evidence = canonicalArray(evidenceRecords, evidenceProjection);
  const resolvedIdentity = resolutionProjection(objectMindState);
  const unresolvedDiscriminators = canonicalArray([
    ...hypotheses.flatMap((record) => record.unresolvedDiscriminators),
    ...resolvedIdentity.additionalEvidenceNeeded,
    ...resolvedIdentity.limitations
  ], (item) => semanticText(item, 180));
  const submittedObjectFingerprint = stableInternalId("submitted-object", {
    imageIds: canonicalArray(objectMindState.requestIdentity?.inputImageIds, (item) => cleanObjectText(item, 100)),
    descriptionSha256: cleanObjectText(objectMindState.requestIdentity?.inputDescriptionProvenance?.sha256, 80)
  }, 20);
  const knowledgeProjection = {
    submittedObjectFingerprint,
    objectStateId: cleanObjectText(objectMindState.objectStateId, 120),
    observations,
    hypotheses,
    resolvedIdentity,
    observationConflicts: canonicalArray(objectMindState.observationConflicts, (item) => semanticText(item, 180)),
    evidence,
    unresolvedDiscriminators
  };
  const knowledgeStateHash = sha256Object(knowledgeProjection);
  const provider = budgetState(providerBudget);
  const directPage = budgetState(directPageBudget, 2);
  const attemptedRequests = (Array.isArray(providerRequests) ? providerRequests : []).filter((record) => (
    Boolean(record.attempted) || Number(record.physicalAttemptCount || 0) > 0
  ));
  const initialAcquisitionExecuted = attemptedRequests.some((record) => !/REFINEMENT|DIRECT_PAGE/i.test(
    `${record.objectMindPhase || ""} ${record.providerEndpoint || ""}`
  ));
  const refinementExecuted = attemptedRequests.some((record) => /REFINEMENT/i.test(record.objectMindPhase || record.searchPass || ""))
    || actionLedger.some((record) => record.actionType === COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH);
  const directPageConsumed = Math.max(
    directPage.consumed,
    attemptedRequests.filter((record) => /direct_product_page_fetch/i.test(record.providerEndpoint || "")).length
  );
  const effectiveDirectPage = {
    ...directPage,
    consumed: directPageConsumed,
    remaining: Math.max(0, directPage.maximum - directPageConsumed)
  };
  const activeHypothesisIds = (objectMindState.identityHypotheses || []).map((record) => record.candidateId).filter(Boolean);
  const initialPlanProjection = planProjection(initialPlan).filter((record) => record.phase !== "REFINEMENT");
  const attemptedQueryIdentities = new Set(attemptedRequests.map((record) => normalizeQueryIdentity(record.query)).filter(Boolean));
  const refinementPlanProjection = planProjection(refinementPlan)
    .filter((record) => !attemptedQueryIdentities.has(record.queryIdentity));
  const counts = resolveEvidenceCounts(evidence);
  const state = {
    schemaVersion: COGNITIVE_GOVERNOR_SCHEMA_VERSION,
    evaluationIdentity: stableInternalId("evaluation", [evaluationId, submittedObjectFingerprint], 18),
    objectMindStateId: cleanObjectText(objectMindState.objectStateId, 120),
    objectMindSemanticHash: cleanObjectText(objectMindState.identityStateHash, 80),
    submittedObjectFingerprint,
    knowledgeStateHash,
    currentIdentityResolutionStatus: resolvedIdentity.status,
    activeIdentityHypotheses: hypotheses,
    materialSupportingFacts: observations.filter((record) => !/LOW/.test(record.certaintyBand)),
    materialConflictingFacts: canonicalArray([
      ...knowledgeProjection.observationConflicts,
      ...evidence.flatMap((record) => record.conflictingFacts)
    ], (item) => item),
    unresolvedIdentityDiscriminators: unresolvedDiscriminators,
    evidenceStateSummary: { ...counts, evidenceStateHash: sha256Object(evidence) },
    initialAcquisitionExecuted,
    refinementExecuted,
    directPageCapacity: effectiveDirectPage,
    providerCapacity: provider,
    actionsAlreadyAttempted: actionLedger.slice(-MAX_COGNITIVE_ACTIONS).map(actionTargetProjection),
    blockedActionSignatures: boundedUniqueStrings(blockedActionSignatures, MAX_COGNITIVE_ACTIONS, 100),
    actionTargets: {
      initialPlanIdentity: initialPlanProjection.length ? stableInternalId("initial-plan", initialPlanProjection, 18) : "",
      refinementPlan: refinementPlanProjection.map((record) => ({
        ...record,
        targetIdentity: stableInternalId("refinement-target", record, 18)
      })),
      directPageCandidates: [],
      returnedEvidenceIdentity: "",
      finalEvidenceIdentity: stableInternalId("final-evidence", [knowledgeStateHash, counts], 18)
    },
    customerMission: createCustomerMissionContext(customerMission),
    customerInputAvailable: false,
    customerInputAlreadyRequested: actionLedger.some((record) => record.actionType === COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT),
    customerInputState: null,
    safetyState: null,
    evidenceSufficiency: null,
    executiveReadiness: null,
    canonicalEvidenceFinalized: Boolean(canonicalEvidenceFinalized),
    purposeJudgmentCompleted: Boolean(purposeJudgmentCompleted),
    reportGenerated: Boolean(reportGenerated),
    currentLegalActionSet: [],
    selectedNextAction: null,
    controlledReasonCodes: [],
    expectedInformationTarget: "",
    terminalStatus: cleanObjectText(terminalStatus, 80),
    stoppingReason: "",
    cognitiveStateHash: ""
  };
  state.actionTargets.directPageCandidates = directCandidateProjection(
    directPageCandidates,
    activeHypothesisIds,
    actionLedger,
    knowledgeStateHash
  );
  state.safetyState = deriveSafetyState(observations);
  const availableFacts = availableCustomerFacts(observations);
  const unresolvedDiscriminator = unresolvedDiscriminators.find((item) => {
    const requestType = classifyCustomerFactRequest(item);
    return requestType && requestType !== "CLEARER_PHOTOGRAPH";
  }) || unresolvedDiscriminators[0] || "";
  const preliminaryIdentitySufficient = resolvedIdentity.status !== "UNRESOLVED"
    && Boolean(resolvedIdentity.bestSupportedIdentity || resolvedIdentity.broaderFallbackIdentity);
  const preliminaryPurposeSupport = counts.verifiedExactEvidence + counts.compatibleEvidence > 0
    || (preliminaryIdentitySufficient && observations.length >= 2 && initialAcquisitionExecuted);
  const discriminatorRequestType = preliminaryPurposeSupport
    ? ""
    : classifyCustomerFactRequest(unresolvedDiscriminator);
  const safetyRequestedFields = state.safetyState.resolutionCustomerFactUseful
    ? state.safetyState.requestedFields
    : [];
  const requiredRequestType = safetyRequestedFields.length ? "CONDITION_DETAIL" : discriminatorRequestType;
  const requiredFields = safetyRequestedFields.length
    ? safetyRequestedFields
    : requestedFieldsForType(requiredRequestType);
  const recordedRequest = requestedCustomerInput && typeof requestedCustomerInput === "object"
    ? requestedCustomerInput
    : null;
  const recordedFields = boundedUniqueStrings(recordedRequest?.requestedFields, 6, 80);
  const requestedFields = recordedFields.length ? recordedFields : requiredFields;
  const fieldStates = requestedFields.map((field) => ({
    field,
    available: Boolean(availableFacts[field]?.available),
    sourceObservationIds: availableFacts[field]?.sourceObservationIds || []
  }));
  const everyRequestedFieldAvailable = fieldStates.length > 0 && fieldStates.every((field) => field.available);
  const inputStatus = !requiredFields.length && !recordedFields.length
    ? CUSTOMER_INPUT_STATUS.NOT_REQUIRED
    : everyRequestedFieldAvailable
      ? recordedRequest ? CUSTOMER_INPUT_STATUS.RESOLVED : CUSTOMER_INPUT_STATUS.AVAILABLE
      : state.customerInputAlreadyRequested || recordedRequest
        ? CUSTOMER_INPUT_STATUS.PENDING
        : CUSTOMER_INPUT_STATUS.REQUIRED_NOT_REQUESTED;
  state.customerInputState = {
    status: inputStatus,
    specificCustomerFactRequired: requiredFields.length > 0,
    requestType: cleanObjectText(recordedRequest?.requestType || requiredRequestType, 80),
    requestedFields,
    fieldStates,
    availableFields: Object.keys(availableFacts).sort(),
    pendingFields: fieldStates.filter((field) => !field.available).map((field) => field.field),
    requestRecorded: Boolean(recordedRequest || state.customerInputAlreadyRequested),
    requestIdentity: cleanObjectText(recordedRequest?.missingDiscriminatorIdentity, 100),
    requestedDetail: cleanObjectText(recordedRequest?.requestedDetail, 240)
  };
  state.customerInputAvailable = inputStatus === CUSTOMER_INPUT_STATUS.NOT_REQUIRED
    || inputStatus === CUSTOMER_INPUT_STATUS.AVAILABLE
    || inputStatus === CUSTOMER_INPUT_STATUS.RESOLVED;
  const identitySufficient = resolvedIdentity.status !== "UNRESOLVED"
    && Boolean(resolvedIdentity.bestSupportedIdentity || resolvedIdentity.broaderFallbackIdentity);
  const supportedEvidenceCount = counts.verifiedExactEvidence + counts.compatibleEvidence;
  const cautiousLimited = identitySufficient
    && observations.length >= 2
    && initialAcquisitionExecuted;
  const sufficiencyDisposition = !identitySufficient
    ? "INSUFFICIENT_IDENTITY"
    : supportedEvidenceCount > 0
      ? "SUPPORTED"
      : cautiousLimited
        ? "CAUTIOUS_LIMITED"
        : "INSUFFICIENT_EVIDENCE";
  state.evidenceSufficiency = {
    disposition: sufficiencyDisposition,
    identitySufficient,
    evidenceSufficientForPurpose: ["SUPPORTED", "CAUTIOUS_LIMITED"].includes(sufficiencyDisposition),
    exactEvidenceRequired: false,
    exactEvidenceAvailable: counts.verifiedExactEvidence > 0,
    cautiousLimitedPurposeAllowed: sufficiencyDisposition === "CAUTIOUS_LIMITED",
    reasonCodes: sufficiencyDisposition === "INSUFFICIENT_IDENTITY"
      ? ["INSUFFICIENT_IDENTITY"]
      : sufficiencyDisposition === "INSUFFICIENT_EVIDENCE"
        ? ["INSUFFICIENT_EVIDENCE"]
        : sufficiencyDisposition === "CAUTIOUS_LIMITED"
          ? ["CAUTIOUS_LIMITED_PURPOSE_SUPPORTED"]
          : ["EVIDENCE_SUPPORTED"]
  };
  const usefulKnowledgeActions = [
    !initialAcquisitionExecuted && provider.remaining > 0 && Boolean(state.actionTargets.initialPlanIdentity)
      ? COGNITIVE_ACTION.ACQUIRE_INITIAL_EVIDENCE : "",
    initialAcquisitionExecuted && !refinementExecuted && provider.remaining > 0 && state.actionTargets.refinementPlan.length
      ? COGNITIVE_ACTION.REFINE_EVIDENCE_SEARCH : "",
    effectiveDirectPage.remaining > 0 && state.actionTargets.directPageCandidates.length
      ? COGNITIVE_ACTION.VERIFY_DIRECT_PAGE : ""
  ].filter(Boolean);
  const customerInputPending = inputStatus === CUSTOMER_INPUT_STATUS.PENDING;
  const customerInputRequired = inputStatus === CUSTOMER_INPUT_STATUS.REQUIRED_NOT_REQUESTED;
  const unresolvedCriticalSafety = state.safetyState.disposition === SAFETY_STATE.UNRESOLVED_CRITICAL_SAFETY;
  const removeFromServiceRequired = state.safetyState.disposition === SAFETY_STATE.REMOVE_FROM_SERVICE_REQUIRED;
  const mandatorySafetyDispositionPresent = Boolean(customerOutcome?.mandatorySafetyDispositionPresent);
  const safetyOnlyOutcomePresent = Boolean(customerOutcome?.safetyOnlyOutcomePresent);
  const completedCustomerOutcomePresent = Boolean(customerOutcome?.completedCustomerOutcomePresent || reportGenerated);
  const limitationsPresent = Boolean(customerOutcome?.limitationsPresent || resolvedIdentity.limitations.length);
  const executiveBlockers = [
    customerInputPending ? "AWAITING_CUSTOMER_INPUT" : "",
    customerInputRequired ? "CUSTOMER_INPUT_REQUIRED_NOT_REQUESTED" : "",
    unresolvedCriticalSafety ? "UNRESOLVED_CRITICAL_SAFETY" : "",
    removeFromServiceRequired && !safetyOnlyOutcomePresent ? "CRITICAL_SAFETY_REQUIRES_SAFETY_ONLY_OUTCOME" : "",
    removeFromServiceRequired && !mandatorySafetyDispositionPresent ? "MANDATORY_SAFETY_DISPOSITION_MISSING" : "",
    !state.evidenceSufficiency.evidenceSufficientForPurpose && !removeFromServiceRequired ? sufficiencyDisposition : ""
  ].filter(Boolean);
  const purposeJudgmentAllowed = Boolean(canonicalEvidenceFinalized)
    && !customerInputPending
    && !customerInputRequired
    && !state.safetyState.ordinaryPurposeJudgmentBlocked
    && state.evidenceSufficiency.evidenceSufficientForPurpose;
  const safetyOnlyCompleteEligible = removeFromServiceRequired
    && state.safetyState.hazardResolved
    && safetyOnlyOutcomePresent
    && mandatorySafetyDispositionPresent;
  const normalCompleteEligible = Boolean(purposeJudgmentCompleted)
    && completedCustomerOutcomePresent
    && purposeJudgmentAllowed
    && limitationsPresent;
  const noUsefulKnowledgeActionRemains = usefulKnowledgeActions.length === 0;
  const stopInsufficientEligible = customerInputPending
    || unresolvedCriticalSafety
    || (noUsefulKnowledgeActionRemains && !state.evidenceSufficiency.evidenceSufficientForPurpose)
    || (removeFromServiceRequired && !safetyOnlyCompleteEligible);
  const stopInsufficientReasonCodes = [
    customerInputPending ? "AWAITING_CUSTOMER_INPUT" : "",
    unresolvedCriticalSafety ? "UNRESOLVED_CRITICAL_SAFETY" : "",
    sufficiencyDisposition === "INSUFFICIENT_IDENTITY" ? "INSUFFICIENT_IDENTITY" : "",
    sufficiencyDisposition === "INSUFFICIENT_EVIDENCE" ? "INSUFFICIENT_EVIDENCE" : "",
    noUsefulKnowledgeActionRemains ? "NO_USEFUL_KNOWLEDGE_ACTION_REMAINS" : ""
  ].filter(Boolean);
  state.executiveReadiness = {
    usefulKnowledgeActions,
    knowledgeProducingActionRemainsUseful: usefulKnowledgeActions.length > 0,
    noUsefulKnowledgeActionRemains,
    customerInputStatus: inputStatus,
    customerInputPending,
    evidenceSufficiencyDisposition: sufficiencyDisposition,
    safetyDisposition: state.safetyState.disposition,
    executiveBlockers,
    mandatorySafetyDispositionPresent,
    safetyOnlyOutcomePresent,
    purposeJudgmentAllowed,
    purposeJudgmentCompleted: Boolean(purposeJudgmentCompleted),
    reportGenerated: Boolean(reportGenerated),
    finalizationEligible: initialAcquisitionExecuted
      && !customerInputPending
      && !customerInputRequired
      && !state.safetyState.ordinaryPurposeJudgmentBlocked,
    stopCompleteEligible: normalCompleteEligible || safetyOnlyCompleteEligible,
    stopCompleteMode: safetyOnlyCompleteEligible ? "SAFETY_ONLY" : normalCompleteEligible ? "PURPOSE_COMPLETE" : "INELIGIBLE",
    stopCompleteReasonCodes: safetyOnlyCompleteEligible
      ? ["SAFETY_ONLY_OUTCOME_COMPLETE", "MANDATORY_SAFETY_DISPOSITION_PRESENT", "SUBSTANTIVE_TERMINAL_READINESS"]
      : normalCompleteEligible
        ? ["SUBSTANTIVE_TERMINAL_READINESS"]
        : [],
    stopInsufficientEvidenceEligible: stopInsufficientEligible,
    stopInsufficientReasonCodes
  };
  state.executiveState = normalizePurposeNeutralExecutiveState(executiveState, {
    evidence,
    initialAcquisitionExecuted,
    evidenceSufficiency: state.evidenceSufficiency,
    terminalStatus
  });
  state.actionTargets.returnedEvidenceIdentity = state.executiveState.visibleEvidenceIds.length
    ? stableInternalId("returned-evidence", state.executiveState.visibleEvidenceIds, 18)
    : "";
  state.cognitiveStateHash = sha256Object({ ...state, cognitiveStateHash: "" });
  return state;
}

export function withCognitiveDecision(state = {}, {
  legalActionSet = [],
  selectedNextAction = null,
  reasonCodes = [],
  expectedInformationTarget = "",
  terminalStatus = "",
  stoppingReason = ""
} = {}) {
  const next = {
    ...state,
    currentLegalActionSet: [...new Set(legalActionSet)].sort(),
    selectedNextAction,
    controlledReasonCodes: [...new Set(reasonCodes)].sort(),
    expectedInformationTarget: cleanObjectText(expectedInformationTarget, 120),
    terminalStatus: cleanObjectText(terminalStatus || state.terminalStatus, 80),
    stoppingReason: cleanObjectText(stoppingReason, 80),
    cognitiveStateHash: ""
  };
  next.cognitiveStateHash = sha256Object(next);
  return next;
}

export function cognitiveStateByteLength(state = {}) {
  return Buffer.byteLength(stableObjectJson(state), "utf8");
}
