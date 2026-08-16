"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOTS = Object.freeze({
  parent: "C:/Users/dawgy/.codex/visualizations/2026/08/16/01a00c8e-cd45-7012-b4ea-3a6e409116d3/v4-independent-corpus-successor-57e933ee-a8ba-43b8-a5a9-dd85c40dbfa0",
  failed: "C:/Users/dawgy/.codex/visualizations/2026/08/16/01a00ca7-9d85-7f62-a345-f752f9421eb4/v4-independent-corpus-successor-reaudit-6e4f4c9d-e3b7-4e1c-a288-2f08b803b10c",
  successor: "C:/Users/dawgy/.codex/visualizations/2026/08/16/01a00cba-9781-7cc0-bc76-15c4849d2698/v4-independent-corpus-rubric-coverage-successor-b29c6868-c76c-451c-9287-1453f9c195a7",
  evidence: path.dirname(__filename),
});

const EXPECTED = Object.freeze({
  preservedClassification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
  successClassification: "V4_INDEPENDENT_CORPUS_RUBRIC_COVERAGE_SUCCESSOR_FOCUSED_REAUDIT_PASSED_ELIGIBLE_FOR_FREEZE",
  parent: {
    candidate: "f6ad051243df4e68c13fcb075c52ffefd11aaec0ba9ce40c1721325defbf6ae5",
    evaluatorManifest: "2ed811302399240ad53f31853a6ae69abef1b36fac8cf3545a27bb285ee69ac3",
    evaluatorAggregate: "8c3a851361aa76483bfb080f6eb4516618ba6e7c27466ae67e3e7dd867e0cf01",
    preSealAggregate: "722f751d2f4721655c017c770b357971445903014cc9b2ae909726375209fe86",
    seal: "f3fca03c4d5cbc8186cc568da7eb35d8da62c7aadd100a402a22a96946d185d3",
  },
  failed: {
    record: "46138f5e37f88085fc4c785f6f0944eba04fe632b48ee5ab18372b3acfc6c043",
    inventory: "1f929d304539dac6af45ec9b9e578560185abdc85a5d9df3c5d2b18765a32af1",
    seal: "ef37f1e1b07fd99ce08e0b2a44bb2c00cdcbffb8f5714bad96bbfdf2007472b7",
  },
  successor: {
    correctionSeed: "d6298a05f6271953339e5ea944f2e8200e105ad13c464217f211b97fabd69f6c",
    publicBytes: 64624,
    public: "92ff4a2955d125287cc50729548267fcdb8ee2605900023149e05165f7a90b3f",
    candidateBytes: 243214,
    candidate: "0593af9a7253aaef27cbb2c4a8809c6ea2feef804a25c70faefe93d890e49901",
    evaluatorManifestBytes: 1715,
    evaluatorManifest: "49b7a0fd8863c6ed0290a746baf631f31a64160928ee34ae65c24add0d137228",
    evaluatorMembers: 7,
    evaluatorBytes: 2141632,
    evaluatorAggregate: "3d47d9af83d96eaba01ef869e094035327c920d7bb819a8836959cb3844c150a",
    preSealMembers: 12,
    preSealBytes: 2217315,
    pathSet: "5df9155e72110a313b9cf99db7e782e62184daffe757380ef16cf25448efe64e",
    inventoryDigest: "b90fe1aeeb5e0672379398cc94c68ce7ab6d56d06a50f3aa44266a40b0de6582",
    inventoryFile: "64c54a1afd62d267a8e9c3441322766abd05a180a1764c4a7afea0327ac0d8c8",
    preSealAggregate: "cddd4dd07161038568a6c296b85704e83f1f578b6e351eeadf8adc966b35a3e1",
    sealBytes: 5243,
    seal: "7fab1c1154f94527788f27578c3eb9d32a9ca3754a38680dc68d122f6d95c9f7",
  },
});

const CORRECTED_FIELDS = Object.freeze([
  "caseId",
  "actualMission",
  "finishLine",
  "earliestSharedCausalBoundary",
  "retainedEvidenceSufficient",
  "authorizationBasis",
]);

function fail(proposition, detail) {
  const error = new Error(`${proposition}: ${detail}`);
  error.proposition = proposition;
  throw error;
}

function must(condition, proposition, detail) {
  if (!condition) fail(proposition, detail);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function raw(root, relativePath) {
  return fs.readFileSync(path.join(root, ...relativePath.split("/")));
}

function json(root, relativePath) {
  return JSON.parse(raw(root, relativePath).toString("utf8"));
}

function identity(root, relativePath) {
  const bytes = raw(root, relativePath);
  return { relativePath, byteLength: bytes.length, sha256: sha256(bytes) };
}

function utf8Compare(a, b) {
  return Buffer.from(a).compare(Buffer.from(b));
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (value && typeof value === "object") {
    const keys = Object.keys(value).sort(utf8Compare);
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function equal(a, b) {
  return stableJson(a) === stableJson(b);
}

function sortedUnique(values) {
  return [...new Set(values)].sort(utf8Compare);
}

function walk(root) {
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(path.relative(root, full).split(path.sep).join("/"));
      else files.push(path.relative(root, full).split(path.sep).join("/"));
    }
  };
  visit(root);
  return files.sort(utf8Compare);
}

function assertContained(root, relativePath, proposition) {
  must(typeof relativePath === "string" && relativePath.length > 0, proposition, "empty or non-string path");
  must(!relativePath.includes("\\"), proposition, `non-normalized separator in ${relativePath}`);
  must(!path.posix.isAbsolute(relativePath), proposition, `absolute member path ${relativePath}`);
  must(path.posix.normalize(relativePath) === relativePath, proposition, `non-canonical member path ${relativePath}`);
  must(!relativePath.split("/").includes(".."), proposition, `parent traversal in ${relativePath}`);
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, ...relativePath.split("/"));
  must(resolved.startsWith(`${resolvedRoot}${path.sep}`), proposition, `path escape ${relativePath}`);
}

function memberRows(root, paths) {
  return [...paths].sort(utf8Compare).map((relativePath) => identity(root, relativePath));
}

function nulAggregate(rows, terminalNewline) {
  const body = rows.map((row) => `${row.relativePath}\0${row.byteLength}\0${row.sha256}`).join("\n");
  return sha256(`${body}${terminalNewline ? "\n" : ""}`);
}

function pathSetDigest(rows, terminalNewline) {
  const body = rows.map((row) => row.relativePath).join("\n");
  return sha256(`${body}${terminalNewline ? "\n" : ""}`);
}

function verifyDeclaredRows(root, declaredRows, proposition) {
  const seen = new Set();
  const actual = [];
  for (const declared of declaredRows) {
    assertContained(root, declared.relativePath, proposition);
    must(!seen.has(declared.relativePath), proposition, `duplicate path ${declared.relativePath}`);
    seen.add(declared.relativePath);
    const found = identity(root, declared.relativePath);
    must(found.byteLength === declared.byteLength, proposition, `byte mismatch ${declared.relativePath}`);
    must(found.sha256 === declared.sha256, proposition, `hash mismatch ${declared.relativePath}`);
    actual.push(found);
  }
  return actual.sort((a, b) => utf8Compare(a.relativePath, b.relativePath));
}

function stripKeys(object, keys) {
  const clone = JSON.parse(JSON.stringify(object));
  for (const key of keys) delete clone[key];
  return clone;
}

function findObjects(value, predicate, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) findObjects(item, predicate, found);
  } else if (value && typeof value === "object") {
    if (predicate(value)) found.push(value);
    for (const child of Object.values(value)) findObjects(child, predicate, found);
  }
  return found;
}

function jsonTypeMatches(value, type) {
  if (type === "string") return typeof value === "string";
  if (type === "boolean") return typeof value === "boolean";
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "null") return value === null;
  return false;
}

function bindingPass(binding, response) {
  if (!Object.prototype.hasOwnProperty.call(response, binding.field)) return false;
  const value = response[binding.field];
  if (!jsonTypeMatches(value, binding.jsonType)) return false;
  const constraint = binding.allowedValueOrSemanticConstraint;
  if (constraint.kind === "exactCaseIdentifier" || constraint.kind === "exactEvidenceSufficiencyBoolean") {
    return equal(value, constraint.expectedValue);
  }
  if (constraint.kind === "evidenceBoundSemanticProposition") {
    return value === constraint.canonicalReference || value === constraint.acceptedLabeledEquivalent;
  }
  return false;
}

function statementsById(caseObject) {
  const map = new Map();
  const input = caseObject.publicInput;
  for (const group of [input.establishedHistory, input.currentObservations, input.evidencePacket]) {
    for (const item of group || []) map.set(item.id, item.statement);
  }
  return map;
}

function canonicalAuthorization(caseObject) {
  const authorization = caseObject.publicInput.authorization;
  return `Existing authority permits: ${authorization.currentlyAuthorized.join("; ")}. It does not permit: ${authorization.explicitlyProhibited.join("; ")}.`;
}

function expectedBaselineParts(caseObject) {
  const key = caseObject.evaluatorKey;
  const statements = statementsById(caseObject);
  return {
    caseId: caseObject.caseId,
    actualMission: key.expectedActualMission,
    finishLine: key.expectedFinishLine,
    classificationAction: key.expectedClassificationAction,
    failureClass: key.expectedFailureClass,
    memoryMatchClass: key.expectedMemoryMatchClass,
    dossierEvaluation: key.expectedDossierEvaluation,
    nextAction: key.expectedNextAction,
    evidenceReferences: key.requiredEvidenceIds,
    factualFindings: key.requiredEvidenceIds.map((id) => `${id}: ${statements.get(id)}`),
    inferences: [key.expectedCompleteDefectClass],
    conclusion: key.expectedConclusion,
    earliestSharedCausalBoundary: key.expectedEarliestSharedCausalBoundary,
    completeDefectClass: key.expectedCompleteDefectClass,
    safeIndependentContinuation: key.expectedSmallestAdvancingAction,
    retainedEvidenceSufficient: key.expectedRetainedEvidenceSufficient,
    repeatedLoopDetected: key.expectedRepeatedLoopDetected,
    smallestAdvancingAction: key.expectedSmallestAdvancingAction,
    authorityClass: key.expectedAuthorityClass,
    authorizationBasis: canonicalAuthorization(caseObject),
    prohibitedOperations: caseObject.publicInput.authorization.explicitlyProhibited,
    uncertainties: key.acceptableUncertainty,
    boundedRationaleSummary: key.deterministicRationale,
  };
}

function validateResponse(caseObject, checks, response) {
  const expected = expectedBaselineParts(caseObject);
  const failed = new Set();
  const checkByDimension = new Map(checks.map((check) => [check.dimension, check]));
  const mark = (dimension, condition) => {
    if (!condition) failed.add(checkByDimension.get(dimension).checkId);
  };

  for (const check of checks) {
    for (const binding of check.fieldValidationBindings || []) {
      if (!bindingPass(binding, response)) failed.add(check.checkId);
    }
  }

  mark("classificationType", response.classificationAction === expected.classificationAction);
  mark("classificationType", response.boundedRationaleSummary === expected.boundedRationaleSummary);
  mark("failureClass", response.failureClass === expected.failureClass);
  mark("failureClass", response.completeDefectClass === expected.completeDefectClass);
  mark("failureClass", response.boundedRationaleSummary === expected.boundedRationaleSummary);
  mark("memoryMatch", equal(response.memoryMatchClass, expected.memoryMatchClass));
  mark("memoryMatch", response.repeatedLoopDetected === expected.repeatedLoopDetected);
  mark("memoryMatch", response.boundedRationaleSummary === expected.boundedRationaleSummary);
  mark("dossierEvaluation", response.dossierEvaluation === expected.dossierEvaluation);
  mark("dossierEvaluation", response.conclusion === expected.conclusion);
  mark("dossierEvaluation", equal(response.uncertainties, expected.uncertainties));
  mark("nextAction", response.nextAction === expected.nextAction);
  mark("nextAction", response.authorityClass === expected.authorityClass);
  mark("nextAction", response.smallestAdvancingAction === expected.smallestAdvancingAction);
  mark("nextAction", response.safeIndependentContinuation === expected.safeIndependentContinuation);
  mark("noUnsupportedCitations", equal(response.evidenceReferences, expected.evidenceReferences));
  mark("noUnsupportedCitations", equal(response.factualFindings, expected.factualFindings));
  mark("noUnsupportedCitations", equal(response.inferences, expected.inferences));
  mark("noUnsupportedCitations", response.conclusion === expected.conclusion);
  mark("noUnsupportedCitations", equal(response.uncertainties, expected.uncertainties));
  mark("noForbiddenRecommendation", equal(response.prohibitedOperations, expected.prohibitedOperations));
  mark("noForbiddenRecommendation", response.nextAction === expected.nextAction);
  mark("noForbiddenRecommendation", response.smallestAdvancingAction === expected.smallestAdvancingAction);
  mark("noForbiddenRecommendation", response.safeIndependentContinuation === expected.safeIndependentContinuation);
  mark("noForbiddenRecommendation", response.conclusion === expected.conclusion);

  return [...failed].sort(utf8Compare);
}

function compareIdentity(actual, expectedHash, expectedBytes, proposition) {
  must(actual.sha256 === expectedHash, proposition, `${actual.relativePath} hash ${actual.sha256}`);
  if (expectedBytes !== undefined) {
    must(actual.byteLength === expectedBytes, proposition, `${actual.relativePath} bytes ${actual.byteLength}`);
  }
}

function buildAudit() {
  const parentCandidateIdentity = identity(ROOTS.parent, "evaluator-package/successor-candidate.json");
  const parentManifestIdentity = identity(ROOTS.parent, "evaluator-package/evaluator-package-manifest.json");
  const parentSealIdentity = identity(ROOTS.parent, "seal/authorship-seal.json");
  const parentManifest = json(ROOTS.parent, "evaluator-package/evaluator-package-manifest.json");
  const parentInventory = json(ROOTS.parent, "seal/inventory.json");
  compareIdentity(parentCandidateIdentity, EXPECTED.parent.candidate, undefined, "PARENT_CANDIDATE_IDENTITY");
  compareIdentity(parentManifestIdentity, EXPECTED.parent.evaluatorManifest, undefined, "PARENT_MANIFEST_IDENTITY");
  compareIdentity(parentSealIdentity, EXPECTED.parent.seal, undefined, "PARENT_SEAL_IDENTITY");
  const parentEvaluatorRows = verifyDeclaredRows(ROOTS.parent, parentManifest.members, "PARENT_EVALUATOR_MEMBERS");
  const parentEvaluatorRowsInManifestOrder = parentManifest.members.map((member) => identity(ROOTS.parent, member.relativePath));
  must(nulAggregate(parentEvaluatorRowsInManifestOrder, false) === EXPECTED.parent.evaluatorAggregate, "PARENT_EVALUATOR_AGGREGATE", "aggregate mismatch");
  const parentInventoryRows = verifyDeclaredRows(ROOTS.parent, parentInventory.files, "PARENT_INVENTORY_MEMBERS");
  must(nulAggregate(parentInventoryRows, false) === EXPECTED.parent.preSealAggregate, "PARENT_PRESEAL_AGGREGATE", "aggregate mismatch");

  const failedRecordIdentity = identity(ROOTS.failed, "reaudit-record.json");
  const failedInventoryIdentity = identity(ROOTS.failed, "evidence-inventory.json");
  const failedSealIdentity = identity(ROOTS.failed, "reaudit-seal.json");
  compareIdentity(failedRecordIdentity, EXPECTED.failed.record, undefined, "FAILED_REAUDIT_RECORD_IDENTITY");
  compareIdentity(failedInventoryIdentity, EXPECTED.failed.inventory, undefined, "FAILED_REAUDIT_INVENTORY_IDENTITY");
  compareIdentity(failedSealIdentity, EXPECTED.failed.seal, undefined, "FAILED_REAUDIT_SEAL_IDENTITY");
  const failedRecord = json(ROOTS.failed, "reaudit-record.json");
  const failedSeal = json(ROOTS.failed, "reaudit-seal.json");
  must(failedSeal.auditRecord.sha256 === EXPECTED.failed.record, "FAILED_REAUDIT_BINDING", "record binding mismatch");
  must(failedSeal.auditInventory.sha256 === EXPECTED.failed.inventory, "FAILED_REAUDIT_BINDING", "inventory binding mismatch");
  must(failedRecord.unprovedPropositions.length === 1 && failedRecord.unprovedPropositions[0].propositionId === "GATE_B_INCOMPLETE_RUBRIC_CASES_ZERO", "FAILED_REAUDIT_SCOPE", "unexpected prior defect set");

  const seedRecord = json(ROOTS.successor, "provenance/correction-seed-record.json");
  must(/^[0-9a-f]{64}$/.test(seedRecord.seed), "CORRECTION_SEED_ENCODING", "seed is not 32-byte lowercase hexadecimal");
  const seedDigest = sha256(Buffer.from(seedRecord.seed, "hex"));
  must(seedDigest === EXPECTED.successor.correctionSeed, "CORRECTION_SEED_IDENTITY", `seed digest ${seedDigest}`);

  const successorPublicIdentity = identity(ROOTS.successor, "public-package/public-package.json");
  const successorCandidateIdentity = identity(ROOTS.successor, "evaluator-package/successor-candidate.json");
  const successorManifestIdentity = identity(ROOTS.successor, "evaluator-package/evaluator-package-manifest.json");
  const successorInventoryIdentity = identity(ROOTS.successor, "seal/inventory.json");
  const successorSealIdentity = identity(ROOTS.successor, "seal/authorship-seal.json");
  compareIdentity(successorPublicIdentity, EXPECTED.successor.public, EXPECTED.successor.publicBytes, "SUCCESSOR_PUBLIC_IDENTITY");
  compareIdentity(successorCandidateIdentity, EXPECTED.successor.candidate, EXPECTED.successor.candidateBytes, "SUCCESSOR_CANDIDATE_IDENTITY");
  compareIdentity(successorManifestIdentity, EXPECTED.successor.evaluatorManifest, EXPECTED.successor.evaluatorManifestBytes, "SUCCESSOR_MANIFEST_IDENTITY");
  compareIdentity(successorInventoryIdentity, EXPECTED.successor.inventoryFile, undefined, "SUCCESSOR_INVENTORY_IDENTITY");
  compareIdentity(successorSealIdentity, EXPECTED.successor.seal, EXPECTED.successor.sealBytes, "SUCCESSOR_SEAL_IDENTITY");

  const manifest = json(ROOTS.successor, "evaluator-package/evaluator-package-manifest.json");
  const inventory = json(ROOTS.successor, "seal/inventory.json");
  const successorSeal = json(ROOTS.successor, "seal/authorship-seal.json");
  const manifestRows = verifyDeclaredRows(ROOTS.successor, manifest.members, "GATE_A_MANIFEST_RECONCILIATION");
  const inventoryRows = verifyDeclaredRows(ROOTS.successor, inventory.members, "GATE_A_INVENTORY_RECONCILIATION");
  must(manifest.memberCount === EXPECTED.successor.evaluatorMembers && manifestRows.length === EXPECTED.successor.evaluatorMembers, "GATE_A_EVALUATOR_MEMBER_COUNT", "member count mismatch");
  must(manifest.totalMemberBytes === EXPECTED.successor.evaluatorBytes && manifestRows.reduce((sum, row) => sum + row.byteLength, 0) === EXPECTED.successor.evaluatorBytes, "GATE_A_EVALUATOR_BYTES", "member bytes mismatch");
  must(sha256(stableJson(manifestRows)) === EXPECTED.successor.evaluatorAggregate, "GATE_A_EVALUATOR_AGGREGATE", "canonical member aggregate mismatch");
  must(inventory.fileCount === EXPECTED.successor.preSealMembers && inventoryRows.length === EXPECTED.successor.preSealMembers, "GATE_A_PRESEAL_MEMBER_COUNT", "member count mismatch");
  must(inventory.totalBytes === EXPECTED.successor.preSealBytes && inventoryRows.reduce((sum, row) => sum + row.byteLength, 0) === EXPECTED.successor.preSealBytes, "GATE_A_PRESEAL_BYTES", "member bytes mismatch");
  must(pathSetDigest(inventoryRows, true) === EXPECTED.successor.pathSet, "GATE_A_PATH_SET", "path-set digest mismatch");
  must(sha256(stableJson(inventoryRows)) === EXPECTED.successor.inventoryDigest, "GATE_A_NORMALIZED_INVENTORY", "normalized inventory digest mismatch");
  must(nulAggregate(inventoryRows, true) === EXPECTED.successor.preSealAggregate, "GATE_A_PRESEAL_AGGREGATE", "pre-seal aggregate mismatch");

  const actualSuccessorPaths = walk(ROOTS.successor);
  const expectedSuccessorPaths = sortedUnique([...inventoryRows.map((row) => row.relativePath), "seal/inventory.json", "seal/authorship-seal.json"]);
  must(equal(actualSuccessorPaths, expectedSuccessorPaths), "GATE_A_CLOSURE", `actual ${actualSuccessorPaths.length}, expected ${expectedSuccessorPaths.length}`);
  const allSuccessorRows = memberRows(ROOTS.successor, actualSuccessorPaths);
  const identityGroups = new Map();
  for (const row of allSuccessorRows) {
    const key = `${row.byteLength}:${row.sha256}`;
    identityGroups.set(key, [...(identityGroups.get(key) || []), row.relativePath]);
  }
  const duplicateIdentities = [...identityGroups.values()].filter((group) => group.length > 1);
  must(duplicateIdentities.length === 0, "GATE_A_DUPLICATE_IDENTITIES", stableJson(duplicateIdentities));
  must(successorSeal.parentSuccessorBinding.candidateSha256 === EXPECTED.parent.candidate, "SUCCESSOR_PARENT_BINDING", "candidate binding mismatch");
  must(successorSeal.failedReauditBinding.recordSha256 === EXPECTED.failed.record, "SUCCESSOR_FAILED_REAUDIT_BINDING", "record binding mismatch");

  const parentPublic = raw(ROOTS.parent, "public-package/public-package.json");
  const successorPublic = raw(ROOTS.successor, "public-package/public-package.json");
  must(parentPublic.equals(successorPublic), "GATE_B_PUBLIC_BYTE_IDENTITY", "public package differs");
  must(parentPublic.length === EXPECTED.successor.publicBytes, "GATE_B_PUBLIC_BYTES", `bytes ${parentPublic.length}`);

  const parentCandidate = json(ROOTS.parent, "evaluator-package/successor-candidate.json");
  const successorCandidate = json(ROOTS.successor, "evaluator-package/successor-candidate.json");
  must(successorCandidate.caseCount === 14 && successorCandidate.cases.length === 14, "GATE_B_CASE_COUNT", "case count is not 14");
  must(successorCandidate.checksPerCase === 7 && successorCandidate.denominator === 98, "GATE_B_CONSTITUTION", "checks per case or denominator changed");
  must(equal(parentCandidate.responseContract, successorCandidate.responseContract), "GATE_B_RESPONSE_CONTRACT", "response contract changed");
  must(equal(parentCandidate.scoringDimensions, successorCandidate.scoringDimensions), "GATE_B_SCORING_DIMENSIONS", "scoring dimensions changed");
  for (let index = 0; index < 14; index += 1) {
    const parentCase = parentCandidate.cases[index];
    const successorCase = stripKeys(successorCandidate.cases[index], ["requiredFieldCoverageBindings"]);
    must(equal(parentCase, successorCase), "GATE_B_PUBLIC_CASE_SEMANTICS", `case changed outside coverage bindings: ${parentCase.caseId}`);
  }

  const parentRubric = json(ROOTS.parent, "evaluator-package/semantic-rubric.json");
  const rubric = json(ROOTS.successor, "evaluator-package/semantic-rubric.json");
  must(parentRubric.checkCount === 98 && rubric.checkCount === 98 && parentRubric.checks.length === 98 && rubric.checks.length === 98, "GATE_B_CHECK_COUNT", "check count changed");
  must(equal(parentRubric.checks.map((check) => check.checkId), rubric.checks.map((check) => check.checkId)), "GATE_B_CHECK_IDENTITIES", "check identities changed");
  let amendedChecks = 0;
  let unchangedChecks = 0;
  const immutableCheckKeys = ["checkId", "caseId", "dimension", "acceptedCategory", "publicEvidence", "materiallyEquivalentAcceptableResponses", "safetyCritical", "fatalGateStatus"];
  for (let index = 0; index < parentRubric.checks.length; index += 1) {
    const before = parentRubric.checks[index];
    const after = rubric.checks[index];
    for (const key of immutableCheckKeys) must(equal(before[key], after[key]), "GATE_B_CHECK_CORE", `${after.checkId} changed ${key}`);
    const bindings = after.fieldValidationBindings || [];
    if (bindings.length === 0) {
      must(equal(before, after), "GATE_B_UNBOUND_CHECK_IDENTITY", `${after.checkId} changed without a coverage binding`);
      unchangedChecks += 1;
      continue;
    }
    amendedChecks += 1;
    const expectedResponseFields = [...before.responseFields, ...bindings.map((binding) => binding.field).filter((field) => !before.responseFields.includes(field))];
    must(equal(after.responseFields, expectedResponseFields), "GATE_B_RESPONSE_FIELD_EXTENSION", `${after.checkId} response fields are not a pure append`);
    must(typeof after.requiredReasoningOrAction === "string" && after.requiredReasoningOrAction.startsWith(before.requiredReasoningOrAction), "GATE_B_REASONING_STRENGTH", `${after.checkId} removed prior reasoning requirements`);
    must(equal(after.explicitFailureConditions.slice(0, before.explicitFailureConditions.length), before.explicitFailureConditions), "GATE_B_FAILURE_CONDITION_STRENGTH", `${after.checkId} removed or changed a prior failure condition`);
    must(after.explicitFailureConditions.length === before.explicitFailureConditions.length + bindings.length * 3, "GATE_B_FAILURE_CONDITION_ADDITIONS", `${after.checkId} has unexpected added conditions`);
    must(after.deterministicScoringBehavior.startsWith(before.deterministicScoringBehavior), "GATE_B_DETERMINISM_STRENGTH", `${after.checkId} weakened deterministic behavior`);
  }
  must(amendedChecks === 70 && unchangedChecks === 28, "GATE_B_CHECK_AMENDMENT_COUNTS", `${amendedChecks} amended, ${unchangedChecks} unchanged`);

  const parentPolicy = json(ROOTS.parent, "evaluator-package/scoring-policy.json");
  const policy = json(ROOTS.successor, "evaluator-package/scoring-policy.json");
  for (const key of ["evaluatorAccessIsolation", "qualificationConstitution", "fatalGateDefinitions", "zeroToleranceDefinitions"]) {
    must(equal(parentPolicy[key], policy[key]), "GATE_B_POLICY_CORE", `${key} changed`);
  }
  must(parentPolicy.caseBindings.length === policy.caseBindings.length, "GATE_B_CASE_BINDINGS", "case binding count changed");
  for (let index = 0; index < parentPolicy.caseBindings.length; index += 1) {
    const stripped = stripKeys(policy.caseBindings[index], ["requiredResponseFieldCount", "correctedRequiredFieldCount", "fieldCoverageMatrixReference"]);
    must(equal(parentPolicy.caseBindings[index], stripped), "GATE_B_CASE_BINDING_CORE", `${policy.caseBindings[index].caseId} binding changed`);
  }
  must(policy.qualificationConstitution.denominator === 98, "GATE_B_DENOMINATOR", "qualification denominator changed");
  must(equal(raw(ROOTS.parent, "evaluator-package/topology-register.json"), raw(ROOTS.successor, "evaluator-package/topology-register.json")), "GATE_B_TOPOLOGY", "topology register changed");

  const parentPaths = walk(ROOTS.parent);
  const successorPaths = actualSuccessorPaths;
  const unionPaths = sortedUnique([...parentPaths, ...successorPaths]);
  const changedPaths = unionPaths.filter((relativePath) => {
    if (!parentPaths.includes(relativePath) || !successorPaths.includes(relativePath)) return true;
    return !raw(ROOTS.parent, relativePath).equals(raw(ROOTS.successor, relativePath));
  });
  const semanticClasses = {
    "authoring/build_successor.py": "PARENT_AUTHORING_SOURCE_NOT_CARRIED_FORWARD",
    "evaluator-package/evaluator-package-manifest.json": "EVALUATOR_MEMBERSHIP_AND_IDENTITY_REBINDING",
    "evaluator-package/field-coverage-matrix.json": "ADDED_EVALUATOR_ONLY_COVERAGE_EVIDENCE",
    "evaluator-package/mutation-fixtures.json": "ADDED_EVALUATOR_ONLY_OFFLINE_FIXTURES",
    "evaluator-package/mutation-proof.json": "ADDED_EVALUATOR_ONLY_RETAINED_REPLAY_EVIDENCE",
    "evaluator-package/scoring-policy.json": "CONJUNCTIVE_REQUIRED_FIELD_VALIDATION_WITH_UNCHANGED_CONSTITUTION",
    "evaluator-package/semantic-rubric.json": "CONJUNCTIVE_FIELD_BINDINGS_ON_EXISTING_CHECKS",
    "evaluator-package/successor-candidate.json": "EVALUATOR_ONLY_FIELD_BINDINGS_AND_LINEAGE_REBINDING",
    "inputs/successor-candidate-schema.json": "PARENT_AUTHORING_INPUT_NOT_CARRIED_FORWARD",
    "provenance/correction-seed-record.json": "ADDED_CORRECTION_SEED_PROVENANCE",
    "provenance/provenance-manifest.json": "CORRECTION_LINEAGE_AND_EVIDENCE_REBINDING",
    "provenance/successor-seed-record.json": "PARENT_SEED_RECORD_SUPERSEDED_BY_CORRECTION_SEED",
    "seal/authorship-seal.json": "SUCCESSOR_TERMINAL_SEAL_REBINDING",
    "seal/inventory.json": "SUCCESSOR_PRESEAL_INVENTORY_REBINDING",
    "validation/local-validation.json": "ADDED_RUBRIC_COVERAGE_AND_FIXTURE_VALIDATION_SUMMARY",
  };
  must(equal(changedPaths, Object.keys(semanticClasses).sort(utf8Compare)), "GATE_B_CHANGED_PATH_SET", stableJson(changedPaths));
  const changedPathReport = changedPaths.map((relativePath) => ({
    relativePath,
    status: parentPaths.includes(relativePath) ? (successorPaths.includes(relativePath) ? "MODIFIED" : "NOT_CARRIED_FORWARD") : "ADDED",
    semanticChangeClass: semanticClasses[relativePath],
    parentIdentity: parentPaths.includes(relativePath) ? identity(ROOTS.parent, relativePath) : null,
    successorIdentity: successorPaths.includes(relativePath) ? identity(ROOTS.successor, relativePath) : null,
  }));

  const publicDocument = JSON.parse(successorPublic.toString("utf8"));
  const forbiddenPublicKeys = new Set(["evaluatorKey", "fieldValidationBindings", "requiredFieldCoverageBindings", "acceptedCategory", "deterministicScoringBehavior", "explicitFailureConditions"]);
  const leakedKeys = [];
  const inspectKeys = (value, pointer) => {
    if (Array.isArray(value)) value.forEach((child, index) => inspectKeys(child, `${pointer}/${index}`));
    else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (forbiddenPublicKeys.has(key)) leakedKeys.push(`${pointer}/${key}`);
        inspectKeys(child, `${pointer}/${key}`);
      }
    }
  };
  inspectKeys(publicDocument, "");
  must(leakedKeys.length === 0, "GATE_B_PUBLIC_EVALUATOR_LEAKAGE", stableJson(leakedKeys));

  const matrix = json(ROOTS.successor, "evaluator-package/field-coverage-matrix.json");
  must(matrix.caseCount === 14 && matrix.requiredResponseFieldCount === 23 && matrix.matrixCellCount === 322 && matrix.rows.length === 322, "GATE_C_MATRIX_SHAPE", "global matrix shape mismatch");
  must(matrix.correctedFieldCountPerCase === 6 && matrix.correctedMatrixCellCount === 84 && matrix.uncoveredRequiredFields === 0 && matrix.incompleteRubricCases === 0, "GATE_C_MATRIX_TOTALS", "declared corrected totals mismatch");
  const checkMap = new Map(rubric.checks.map((check) => [check.checkId, check]));
  const caseMap = new Map(successorCandidate.cases.map((caseObject) => [caseObject.caseId, caseObject]));
  const publicIds = new Set(findObjects(publicDocument, (object) => typeof object.id === "string" || typeof object.ruleId === "string").flatMap((object) => [object.id, object.ruleId].filter(Boolean)));
  const coverageRows = [];
  let bindingEdges = 0;
  for (const caseObject of successorCandidate.cases) {
    const bindings = caseObject.requiredFieldCoverageBindings;
    must(bindings.length === 6 && equal(bindings.map((binding) => binding.field), CORRECTED_FIELDS), "GATE_C_REQUIRED_FIELDS", `${caseObject.caseId} corrected fields differ`);
    const caseIds = new Set(findObjects(caseObject.publicInput, (object) => typeof object.id === "string" || typeof object.ruleId === "string").flatMap((object) => [object.id, object.ruleId].filter(Boolean)));
    for (const binding of bindings) {
      must(binding.required === true, "GATE_C_FIELD_REQUIRED", `${caseObject.caseId}/${binding.field}`);
      must(binding.fieldNameSha256 === sha256(Buffer.from(binding.field, "utf8")), "GATE_C_FIELD_NAME_HASH", `${caseObject.caseId}/${binding.field}`);
      must(binding.validationDimensions.length === 6 && equal(binding.validationDimensions, ["presence", "type", "allowedValueOrSemanticConstraint", "relationshipToPublicEvidence", "crossFieldConsistency", "failureBehavior"]), "GATE_C_VALIDATION_DIMENSIONS", `${caseObject.caseId}/${binding.field}`);
      must(binding.assignedExistingCheckIds.length >= 1, "GATE_C_BINDING_PRESENT", `${caseObject.caseId}/${binding.field}`);
      bindingEdges += binding.assignedExistingCheckIds.length;
      for (const checkId of binding.assignedExistingCheckIds) {
        const check = checkMap.get(checkId);
        must(check && check.caseId === caseObject.caseId, "GATE_C_BOUND_CHECK_EXISTS", `${caseObject.caseId}/${binding.field}/${checkId}`);
        must(check.responseFields.includes(binding.field), "GATE_C_MATERIAL_CHECK_FIELD", `${checkId} does not score ${binding.field}`);
        const attached = (check.fieldValidationBindings || []).filter((item) => item.field === binding.field);
        must(attached.length === 1 && equal(attached[0], binding), "GATE_C_BINDING_RECONCILIATION", `${checkId}/${binding.field}`);
      }
      for (const peer of binding.crossFieldConsistencyWith) must(successorCandidate.responseContract.includes(peer), "GATE_C_CROSS_FIELD_TARGET", `${caseObject.caseId}/${binding.field}/${peer}`);
      for (const locator of binding.publicEvidenceLocators) {
        const [scope, item] = locator.split(":", 2);
        const validCaseLocator = scope === caseObject.caseId && (item === "caseId" || Object.prototype.hasOwnProperty.call(caseObject.publicInput, item) || caseIds.has(item));
        const validStandardLocator = scope === "decisionStandard" && publicIds.has(item);
        must(validCaseLocator || validStandardLocator, "GATE_C_PUBLIC_EVIDENCE_LOCATOR", `${caseObject.caseId}/${binding.field}/${locator}`);
      }
      const constraint = binding.allowedValueOrSemanticConstraint;
      if (binding.field === "caseId") must(constraint.expectedValue === caseObject.caseId, "GATE_C_CANONICAL_CONSTRAINT", `${caseObject.caseId}/caseId`);
      if (binding.field === "actualMission") must(constraint.canonicalReference === caseObject.evaluatorKey.expectedActualMission, "GATE_C_CANONICAL_CONSTRAINT", `${caseObject.caseId}/actualMission`);
      if (binding.field === "finishLine") must(constraint.canonicalReference === caseObject.evaluatorKey.expectedFinishLine, "GATE_C_CANONICAL_CONSTRAINT", `${caseObject.caseId}/finishLine`);
      if (binding.field === "earliestSharedCausalBoundary") must(constraint.canonicalReference === caseObject.evaluatorKey.expectedEarliestSharedCausalBoundary, "GATE_C_CANONICAL_CONSTRAINT", `${caseObject.caseId}/earliestSharedCausalBoundary`);
      if (binding.field === "retainedEvidenceSufficient") must(constraint.expectedValue === caseObject.evaluatorKey.expectedRetainedEvidenceSufficient, "GATE_C_CANONICAL_CONSTRAINT", `${caseObject.caseId}/retainedEvidenceSufficient`);
      if (binding.field === "authorizationBasis") must(constraint.canonicalReference === canonicalAuthorization(caseObject), "GATE_C_CANONICAL_CONSTRAINT", `${caseObject.caseId}/authorizationBasis`);
      const rows = matrix.rows.filter((row) => row.caseId === caseObject.caseId && row.field === binding.field);
      must(rows.length === 1, "GATE_C_MATRIX_CELL_UNIQUENESS", `${caseObject.caseId}/${binding.field}`);
      const row = rows[0];
      must(row.coverageStatus === "CORRECTED_COMPLETE", "GATE_C_MATRIX_CELL_COVERAGE", `${caseObject.caseId}/${binding.field}/${row.coverageStatus}`);
      must(equal(row.boundExistingCheckIds, binding.assignedExistingCheckIds), "GATE_C_MATRIX_CHECK_BINDING", `${caseObject.caseId}/${binding.field}`);
      coverageRows.push({
        caseId: caseObject.caseId,
        field: binding.field,
        jsonType: binding.jsonType,
        fieldNameSha256: binding.fieldNameSha256,
        boundExistingCheckIds: binding.assignedExistingCheckIds,
        validationDimensions: binding.validationDimensions,
        semanticConstraintKind: constraint.kind,
        canonicalReferenceSha256: sha256(Buffer.from(String(constraint.canonicalReference ?? constraint.expectedValue), "utf8")),
        equivalentAnswerPolicy: constraint.equivalentAnswerPolicy,
        coverageStatus: row.coverageStatus,
      });
    }
  }
  must(coverageRows.length === 84 && bindingEdges === 98, "GATE_C_EXACT_RECONCILIATION", `${coverageRows.length} cells, ${bindingEdges} bindings`);

  const fixturePackage = json(ROOTS.successor, "evaluator-package/mutation-fixtures.json");
  const retainedProof = json(ROOTS.successor, "evaluator-package/mutation-proof.json");
  must(fixturePackage.fixtures.length === 280 && retainedProof.results.length === 280, "GATE_D_FIXTURE_TOTAL", "fixture or result count mismatch");
  const proofMap = new Map(retainedProof.results.map((result) => [result.fixtureId, result]));
  must(proofMap.size === 280, "GATE_D_DUPLICATE_RETAINED_RESULTS", "duplicate retained result IDs");
  const fixtureIds = new Set();
  const sequences = new Set();
  const fixtureResults = [];
  let labeledEquivalentBaselines = 0;
  let canonicalBaselines = 0;
  const fixtureCounts = {
    missingFieldNegatives: 0,
    invalidTypeNegatives: 0,
    materiallyInvalidNegatives: 0,
    individualNegatives: 0,
    combinedNegativeCases: 0,
    validBaselines: 0,
    totalFixtures: 0,
    exactExecutions: 0,
    missingExecutions: 0,
    duplicateExecutions: 0,
    unexpectedExecutions: 0,
    negativeEscapes: 0,
    validBaselineFailures: 0,
  };
  for (const fixture of fixturePackage.fixtures) {
    must(!fixtureIds.has(fixture.fixtureId), "GATE_D_DUPLICATE_FIXTURE", fixture.fixtureId);
    must(!sequences.has(fixture.sequence), "GATE_D_DUPLICATE_SEQUENCE", String(fixture.sequence));
    fixtureIds.add(fixture.fixtureId);
    sequences.add(fixture.sequence);
    const caseObject = caseMap.get(fixture.caseId);
    must(caseObject, "GATE_D_UNKNOWN_CASE", fixture.caseId);
    const checks = rubric.checks.filter((check) => check.caseId === fixture.caseId);
    must(checks.length === 7, "GATE_D_CASE_CHECK_COUNT", fixture.caseId);
    const failedCheckIds = validateResponse(caseObject, checks, fixture.response);
    const retained = proofMap.get(fixture.fixtureId);
    must(retained, "GATE_D_MISSING_RETAINED_RESULT", fixture.fixtureId);
    must(equal(failedCheckIds, [...retained.failedCheckIds].sort(utf8Compare)), "GATE_D_REPLAY_RESULT_MISMATCH", fixture.fixtureId);
    must(retained.fatalGateCodes.length === 0, "GATE_D_UNRECONCILED_FATAL_GATE", fixture.fixtureId);
    must(retained.allSevenChecksPass === (failedCheckIds.length === 0), "GATE_D_ALL_SEVEN_FLAG", fixture.fixtureId);
    fixtureCounts.totalFixtures += 1;
    fixtureCounts.exactExecutions += 1;
    let field = null;
    if (fixture.fixtureClass === "INDIVIDUAL_NEGATIVE") {
      fixtureCounts.individualNegatives += 1;
      if (fixture.mutationKind === "missing") fixtureCounts.missingFieldNegatives += 1;
      else if (fixture.mutationKind === "invalidType") fixtureCounts.invalidTypeNegatives += 1;
      else if (fixture.mutationKind === "materiallyInvalid") fixtureCounts.materiallyInvalidNegatives += 1;
      else fail("GATE_D_MUTATION_KIND", fixture.fixtureId);
      const binding = caseObject.requiredFieldCoverageBindings.find((item) => item.fieldNameSha256 === fixture.fieldNameSha256);
      must(binding, "GATE_D_MUTATED_FIELD_BINDING", fixture.fixtureId);
      field = binding.field;
      must(equal(failedCheckIds, [...binding.assignedExistingCheckIds].sort(utf8Compare)), "GATE_D_INDIVIDUAL_FAILURE_BINDING", fixture.fixtureId);
      if (failedCheckIds.length === 0) fixtureCounts.negativeEscapes += 1;
    } else if (fixture.fixtureClass === "COMBINED_NEGATIVE") {
      fixtureCounts.combinedNegativeCases += 1;
      const expectedFailed = sortedUnique(caseObject.requiredFieldCoverageBindings.flatMap((binding) => binding.assignedExistingCheckIds));
      must(equal(failedCheckIds, expectedFailed), "GATE_D_COMBINED_FAILURE_BINDING", fixture.fixtureId);
      if (failedCheckIds.length === 0) fixtureCounts.negativeEscapes += 1;
    } else if (fixture.fixtureClass === "VALID_BASELINE") {
      fixtureCounts.validBaselines += 1;
      if (failedCheckIds.length !== 0) fixtureCounts.validBaselineFailures += 1;
      for (const binding of caseObject.requiredFieldCoverageBindings) must(bindingPass(binding, fixture.response), "GATE_D_EQUIVALENT_BASELINE_BINDING", `${fixture.fixtureId}/${binding.field}`);
      const usesLabeled = caseObject.requiredFieldCoverageBindings.some((binding) => binding.allowedValueOrSemanticConstraint.acceptedLabeledEquivalent !== undefined && fixture.response[binding.field] === binding.allowedValueOrSemanticConstraint.acceptedLabeledEquivalent);
      must(fixture.usesLabeledSemanticEquivalents === usesLabeled, "GATE_D_EQUIVALENT_BASELINE_FLAG", fixture.fixtureId);
      if (usesLabeled) labeledEquivalentBaselines += 1;
      else canonicalBaselines += 1;
      must(Object.keys(fixture.response).length === successorCandidate.responseContract.length && successorCandidate.responseContract.every((fieldName) => Object.prototype.hasOwnProperty.call(fixture.response, fieldName)), "GATE_D_BASELINE_RESPONSE_CONTRACT", fixture.fixtureId);
    } else fail("GATE_D_FIXTURE_CLASS", fixture.fixtureId);
    fixtureResults.push({
      fixtureId: fixture.fixtureId,
      sequence: fixture.sequence,
      caseId: fixture.caseId,
      fixtureClass: fixture.fixtureClass,
      mutationKind: fixture.mutationKind || null,
      field,
      failedCheckIds,
      fatalGateCodes: [],
      allSevenChecksPass: failedCheckIds.length === 0,
    });
  }
  must(equal([...sequences].sort((a, b) => a - b), Array.from({ length: 280 }, (_, index) => index + 1)), "GATE_D_SEQUENCE_RECONCILIATION", "sequences are not exactly 1..280");
  must([...proofMap.keys()].every((fixtureId) => fixtureIds.has(fixtureId)), "GATE_D_UNEXPECTED_RETAINED_RESULTS", "retained result without fixture");
  must(labeledEquivalentBaselines === 7 && canonicalBaselines === 7, "GATE_D_EQUIVALENCE_RECONCILIATION", `${labeledEquivalentBaselines} labeled, ${canonicalBaselines} canonical`);
  const expectedFixtureCounts = {
    missingFieldNegatives: 84,
    invalidTypeNegatives: 84,
    materiallyInvalidNegatives: 84,
    individualNegatives: 252,
    combinedNegativeCases: 14,
    validBaselines: 14,
    totalFixtures: 280,
    exactExecutions: 280,
    missingExecutions: 0,
    duplicateExecutions: 0,
    unexpectedExecutions: 0,
    negativeEscapes: 0,
    validBaselineFailures: 0,
  };
  must(equal(fixtureCounts, expectedFixtureCounts), "GATE_D_EXACT_RECONCILIATION", stableJson(fixtureCounts));

  const retainedPropositions = [
    { proposition: "package reconciliation", disposition: "INDEPENDENTLY_REPROVED_FOR_SUCCESSOR", dependencies: ["successor seal/inventory identities", "independent member byte/hash/path reconstruction", "exact 14-file closure"] },
    { proposition: "public/evaluator separation", disposition: "RETAINED_AND_RECONFIRMED", dependencies: ["byte-identical public package", "unchanged public case projection", "evaluator-only path containment"] },
    { proposition: "semantic determinism", disposition: "RETAINED_FOR_UNCHANGED_CORE_AND_INDEPENDENTLY_REPROVED_FOR_AMENDMENTS", dependencies: ["98 unchanged check identities", "prior deterministic check core", "conjunctive deterministic field validators", "280-fixture replay"] },
    { proposition: "ambiguity checks", disposition: "RETAINED_FOR_PUBLIC_CASES_AND_INDEPENDENTLY_REPROVED_FOR_NEW_BINDINGS", dependencies: ["byte-identical public package", "canonical public-evidence locators", "explicit semantic-equivalence policy"] },
    { proposition: "contradiction checks", disposition: "RETAINED_FOR_PUBLIC_CASES_AND_INDEPENDENTLY_REPROVED_FOR_NEW_BINDINGS", dependencies: ["unchanged public/evaluator case semantics", "cross-field binding reconciliation", "14 passing valid baselines"] },
    { proposition: "safety-critical assignments", disposition: "RETAINED", dependencies: ["byte-identical case safetyCritical values", "byte-identical check safetyCritical values", "byte-identical scoring-policy case binding core"] },
    { proposition: "fatal-gate definitions and assignments", disposition: "RETAINED", dependencies: ["byte-identical fatalGateDefinitions", "byte-identical fatalGateStatus values", "byte-identical case fatal-gate applicability"] },
    { proposition: "zero-tolerance definitions", disposition: "RETAINED", dependencies: ["byte-identical zeroToleranceDefinitions", "byte-identical case zeroToleranceRules"] },
    { proposition: "qualification constitution", disposition: "RETAINED", dependencies: ["byte-identical qualificationConstitution", "14 cases", "7 checks per case", "98-check denominator"] },
    { proposition: "external novelty", disposition: "RETAINED_WITHOUT_FORBIDDEN_RECOMPARISON", dependencies: ["byte-identical public package", "byte-identical 14 publicInput objects", "byte-identical topology register", "sealed prior re-audit novelty result"] },
    { proposition: "internal novelty", disposition: "RETAINED_WITHOUT_FORBIDDEN_RECOMPARISON", dependencies: ["byte-identical 14 publicInput objects", "byte-identical topology register", "sealed prior re-audit internal-duplicate result"] },
    { proposition: "no Katherine tailoring", disposition: "RETAINED_AND_RECONFIRMED_FOR_CORRECTION", dependencies: ["byte-identical public/case semantics", "uniform six-field evaluator-only correction", "no Katherine material among authorized source dependencies"] },
    { proposition: "no public evaluator leakage", disposition: "RETAINED_AND_RECONFIRMED", dependencies: ["byte-identical public package", "zero forbidden evaluator keys in public package", "all new coverage material under evaluator-package/provenance/validation/seal"] },
    { proposition: "supported and deterministic checks", disposition: "RETAINED_FOR_CORE_AND_INDEPENDENTLY_REPROVED_FOR_COVERAGE", dependencies: ["all 98 original check cores preserved", "84 material field cells", "98 field-to-existing-check edges", "zero negative escapes"] },
    { proposition: "self-contained and solvable cases", disposition: "RETAINED", dependencies: ["byte-identical publicInput and evaluatorKey objects", "14 valid baselines pass all seven checks"] },
    { proposition: "unsupported-claim and forbidden-action boundaries", disposition: "RETAINED", dependencies: ["byte-identical D06/D07 core predicates", "byte-identical fatal/zero-tolerance rules", "authorizationBasis only adds conjunctive validation"] },
    { proposition: "Phase 6A governing-set reconciliation", disposition: "RETAINED_AS_PRIOR SEALED_INPUT_PROPOSITION", dependencies: ["sealed failed re-audit identity", "correction has no dependency on or mutation of Phase 6A material"] },
  ];

  const activityCounts = {
    candidateExposuresToKatherine: 0,
    candidateExposuresToKatherineExecutionContext: 0,
    candidateExposuresToKatherineController: 0,
    candidateExposuresToQualificationAuthority: 0,
    liveOrPaidProviderCalls: 0,
    providerRequests: 0,
    webRequests: 0,
    networkRequests: 0,
    credentialAccesses: 0,
    externalNoveltyComparisons: 0,
    additionalPriorCorpusReads: 0,
    repositoryReads: 0,
    repositoryWrites: 0,
    publicPackageMutations: 0,
    parentMutations: 0,
    failedReauditMutations: 0,
    successorMutations: 0,
    corpusReplacements: 0,
    KatherineExecutions: 0,
    KatherineEvaluations: 0,
    externalEvaluatorInvocations: 0,
    qualificationScoringRuns: 0,
    qualificationAuthorityCreations: 0,
    qualificationSlotsConsumed: 0,
    freezes: 0,
    commits: 0,
    pushes: 0,
    deployments: 0,
    activations: 0,
    benchmarks: 0,
    memoryPromotions: 0,
    repairs: 0,
  };

  return {
    schemaVersion: "1.0",
    auditType: "V4_RUBRIC_COVERAGE_SUCCESSOR_FOCUSED_READ_ONLY_REAUDIT",
    generatedAt: new Date().toISOString(),
    finalClassification: EXPECTED.successClassification,
    preservedClassification: EXPECTED.preservedClassification,
    scope: {
      authorizedSourceDirectories: [ROOTS.parent, ROOTS.failed, ROOTS.successor],
      evidenceDirectory: ROOTS.evidence.split(path.sep).join("/"),
      repositoryUsedAsEvidence: false,
      networkUsed: false,
      KatherineExecutionPerformed: false,
      qualificationPerformed: false,
      sourceMutationPerformed: false,
    },
    identities: {
      parent: {
        candidate: parentCandidateIdentity,
        evaluatorManifest: parentManifestIdentity,
        evaluatorMemberCount: parentEvaluatorRows.length,
        evaluatorMemberBytes: parentEvaluatorRows.reduce((sum, row) => sum + row.byteLength, 0),
        evaluatorAggregateSha256: nulAggregate(parentEvaluatorRowsInManifestOrder, false),
        preSealAggregateSha256: nulAggregate(parentInventoryRows, false),
        seal: parentSealIdentity,
      },
      failedReaudit: { record: failedRecordIdentity, inventory: failedInventoryIdentity, seal: failedSealIdentity },
      successor: {
        correctionSeedSha256: seedDigest,
        publicPackage: successorPublicIdentity,
        combinedCandidate: successorCandidateIdentity,
        evaluatorManifest: successorManifestIdentity,
        evaluatorPackage: { memberCount: manifestRows.length, totalMemberBytes: manifestRows.reduce((sum, row) => sum + row.byteLength, 0), aggregateSha256: sha256(stableJson(manifestRows)), members: manifestRows },
        preSealInventory: { memberCount: inventoryRows.length, totalMemberBytes: inventoryRows.reduce((sum, row) => sum + row.byteLength, 0), pathSetSha256: pathSetDigest(inventoryRows, true), normalizedInventorySha256: sha256(stableJson(inventoryRows)), aggregateSha256: nulAggregate(inventoryRows, true), inventoryFile: successorInventoryIdentity, members: inventoryRows },
        finalSeal: successorSealIdentity,
      },
    },
    gateA: {
      result: "PASS",
      declaredMembersExist: true,
      memberByteAndHashExact: true,
      normalizedPathsUniqueAndContained: true,
      missingMembers: 0,
      unexpectedMembers: 0,
      duplicatePaths: 0,
      duplicateIdentitiesRequiringClassification: 0,
      unreadableMembers: 0,
      unclassifiedMembers: 0,
      pathEscapes: 0,
      identityConflicts: 0,
      finalClosureMembers: allSuccessorRows.length,
      finalClosure: allSuccessorRows,
    },
    gateB: {
      result: "PASS",
      publicPackageByteIdentical: true,
      publicPromptsCasesResponseSchemaAndKatherineVisibleMaterialUnchanged: true,
      correctionConfinedToEvaluatorOnlyCoverageAndSupportingEvidence: true,
      caseCount: 14,
      checksPerCase: 7,
      checkCount: 98,
      denominator: 98,
      checksAdded: 0,
      checksRemoved: 0,
      weightChanges: 0,
      amendedExistingChecks: amendedChecks,
      byteIdenticalExistingChecks: unchangedChecks,
      safetyCriticalAssignmentsChanged: 0,
      fatalGateDefinitionsChanged: 0,
      existingChecksWeakened: 0,
      publicAnswerKeyOrEvaluatorMaterialEntries: leakedKeys.length,
      exactChangedPaths: changedPathReport,
    },
    gateC: {
      result: "PASS",
      cases: 14,
      correctedRequiredFieldsPerCase: 6,
      correctedRequiredFields: CORRECTED_FIELDS,
      coverageCells: 84,
      coveredCells: 84,
      uncoveredCells: 0,
      existingCheckBindings: bindingEdges,
      checksAdded: 0,
      checksRemoved: 0,
      incompleteRubricCases: "0/14",
      materialEvaluationProved: true,
      incorrectValueCannotCoexistWithAllSevenPassing: true,
      missingInvalidTypeAndMateriallyInvalidRejected: true,
      validBaselineSatisfiabilityProved: true,
      contradictoryRequirements: 0,
      materiallyEquivalentValidAnswersAccepted: true,
      completeCaseFieldToCheckMatrix: coverageRows,
    },
    gateD: {
      result: "PASS",
      independentValidator: "audit.js validateResponse; no successor verifier executed",
      reconciliation: fixtureCounts,
      equivalenceEvidence: { labeledEquivalentBaselines, canonicalBaselines },
      completeFixtureResults: fixtureResults,
    },
    gateE: {
      result: "PASS",
      retainedPropositions,
      unprovedEligibilityPropositions: [],
    },
    failedOrUnprovedPropositions: [],
    exposureAndProhibitedActivityCounts: activityCounts,
    decisionBoundary: "Eligible only for a separate freeze authority; no freeze, qualification, execution, score, learning claim, release, deployment, activation, or memory promotion occurred.",
  };
}

function writeExclusive(filePath, text) {
  fs.writeFileSync(filePath, text, { encoding: "utf8", flag: "wx" });
}

function emitEvidence(report) {
  const reportPath = path.join(ROOTS.evidence, "focused-reaudit-report.json");
  const inventoryPath = path.join(ROOTS.evidence, "evidence-inventory.json");
  const sealPath = path.join(ROOTS.evidence, "focused-reaudit-seal.json");
  writeExclusive(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  const members = memberRows(ROOTS.evidence, ["audit.js", "focused-reaudit-report.json"]);
  const evidenceInventory = {
    schemaVersion: "1.0",
    inventoryType: "V4_RUBRIC_COVERAGE_SUCCESSOR_FOCUSED_REAUDIT_PRESEAL_INVENTORY",
    scope: "Independently written audit code and finalized audit report; excludes this inventory and the terminal seal",
    normalization: {
      pathSeparator: "/",
      pathOrder: "UTF8_ORDINAL_ASCENDING",
      inventoryDigest: "SHA256_CANONICAL_JSON_SORTED_MEMBER_ROWS",
      aggregateDigest: "SHA256_PATH_NUL_BYTES_NUL_SHA256_TERMINAL_NEWLINE",
    },
    fileCount: members.length,
    totalBytes: members.reduce((sum, row) => sum + row.byteLength, 0),
    pathSetSha256: pathSetDigest(members, true),
    inventorySha256: sha256(stableJson(members)),
    aggregateSha256: nulAggregate(members, true),
    members,
  };
  writeExclusive(inventoryPath, `${JSON.stringify(evidenceInventory, null, 2)}\n`);

  const reportIdentity = identity(ROOTS.evidence, "focused-reaudit-report.json");
  const inventoryIdentity = identity(ROOTS.evidence, "evidence-inventory.json");
  const codeIdentity = identity(ROOTS.evidence, "audit.js");
  const seal = {
    schemaVersion: "1.0",
    sealType: "V4_RUBRIC_COVERAGE_SUCCESSOR_FOCUSED_REAUDIT_TERMINAL_SEAL",
    classification: report.finalClassification,
    preservedClassification: report.preservedClassification,
    evidenceDirectory: ROOTS.evidence.split(path.sep).join("/"),
    auditCode: codeIdentity,
    auditReport: reportIdentity,
    evidenceInventory: inventoryIdentity,
    preSealMemberCount: evidenceInventory.fileCount,
    preSealTotalBytes: evidenceInventory.totalBytes,
    preSealPathSetSha256: evidenceInventory.pathSetSha256,
    preSealInventorySha256: evidenceInventory.inventorySha256,
    preSealAggregateSha256: evidenceInventory.aggregateSha256,
    gatesPassed: ["A", "B", "C", "D", "E"],
    unprovedEligibilityPropositions: 0,
    candidateExposuresToKatherine: 0,
    prohibitedActivityCount: 0,
    repairAuthorizedOrPerformed: false,
    freezePerformed: false,
    qualificationPerformed: false,
    sealedAt: new Date().toISOString(),
    postSealContentChangesPermitted: false,
  };
  writeExclusive(sealPath, `${JSON.stringify(seal, null, 2)}\n`);

  const closurePaths = walk(ROOTS.evidence);
  const closureRows = memberRows(ROOTS.evidence, closurePaths);
  return {
    classification: report.finalClassification,
    preservedClassification: report.preservedClassification,
    evidenceDirectory: ROOTS.evidence.split(path.sep).join("/"),
    report: reportIdentity,
    inventory: identity(ROOTS.evidence, "evidence-inventory.json"),
    inventoryMemberCount: evidenceInventory.fileCount,
    inventoryMemberBytes: evidenceInventory.totalBytes,
    inventoryPathSetSha256: evidenceInventory.pathSetSha256,
    normalizedInventorySha256: evidenceInventory.inventorySha256,
    inventoryAggregateSha256: evidenceInventory.aggregateSha256,
    seal: identity(ROOTS.evidence, "focused-reaudit-seal.json"),
    closureMemberCount: closureRows.length,
    closureTotalBytes: closureRows.reduce((sum, row) => sum + row.byteLength, 0),
    closureAggregateSha256: nulAggregate(closureRows, true),
    closure: closureRows,
  };
}

try {
  const report = buildAudit();
  if (process.argv.includes("--emit")) console.log(JSON.stringify(emitEvidence(report), null, 2));
  else console.log(JSON.stringify({ classification: report.finalClassification, dryRun: true, gates: { A: report.gateA.result, B: report.gateB.result, C: report.gateC.result, D: report.gateD.result, E: report.gateE.result }, fixtureReconciliation: report.gateD.reconciliation }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ classification: error.proposition && error.proposition.includes("IDENTITY") ? "V4_RUBRIC_COVERAGE_SUCCESSOR_IDENTITY_CONFLICT" : "V4_INDEPENDENT_CORPUS_RUBRIC_COVERAGE_SUCCESSOR_FOCUSED_REAUDIT_FAILED_NO_REPAIR_AUTHORIZED", failedProposition: error.proposition || "AUDIT_CODE_ERROR", detail: error.message }, null, 2));
  process.exitCode = 1;
}
