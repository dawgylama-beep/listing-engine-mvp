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
  MAX_COGNITIVE_ACTIONS
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
  return {
    status: cleanObjectText(resolved.exactnessClassification || "UNRESOLVED", 100).toUpperCase(),
    stableIdentityKey: cleanObjectText(resolved.stableIdentityKey, 120),
    selectedCandidateId: cleanObjectText(resolved.selectedCandidateId, 100),
    bestSupportedIdentity: semanticText(resolved.bestSupportedCustomerIdentity, 240),
    broaderFallbackIdentity: semanticText(resolved.broaderFallbackIdentity, 240),
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
  canonicalEvidenceFinalized = false,
  purposeJudgmentCompleted = false,
  terminalStatus = "",
  customerInputAvailable = true
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
      finalEvidenceIdentity: stableInternalId("final-evidence", [knowledgeStateHash, counts], 18)
    },
    customerMission: createCustomerMissionContext(customerMission),
    customerInputAvailable: Boolean(customerInputAvailable),
    customerInputAlreadyRequested: actionLedger.some((record) => record.actionType === COGNITIVE_ACTION.REQUEST_CUSTOMER_INPUT),
    canonicalEvidenceFinalized: Boolean(canonicalEvidenceFinalized),
    purposeJudgmentCompleted: Boolean(purposeJudgmentCompleted),
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
