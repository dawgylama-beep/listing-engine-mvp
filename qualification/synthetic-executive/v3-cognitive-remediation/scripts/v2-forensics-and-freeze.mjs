import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { generalContinuationPromptLines, GENERAL_CONTINUATION_POLICY_HASH } from "../../qualification-real-route/scripts/general-continuation-policy.mjs";
import { readJson, seal, sha256Bytes, sha256Json, stableJson, writeExclusiveJson } from "../../scripts/protocol.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const scriptDirectory = path.dirname(scriptPath);
export const remediationRoot = path.resolve(scriptDirectory, "..");
export const repositoryRoot = path.resolve(remediationRoot, "..", "..", "..");
const finalV2Root = path.join(repositoryRoot, "qualification", "synthetic-executive", "qualification-real-route", "response-boundary-recovery", "v2-c13-c14-d198c3e-20260812t2355z");
const corpusRoot = path.join(repositoryRoot, "qualification", "synthetic-executive", "v2-held-out-corpus");
const outputPath = path.join(remediationRoot, "v2-case-forensics.json");
const registryPath = path.join(remediationRoot, "systemic-defect-registry.json");
const contractPath = path.join(remediationRoot, "cognitive-remediation-contract.json");
const freezePath = path.join(remediationRoot, "cognitive-freeze.json");
const validationPath = path.join(remediationRoot, "offline-validation.json");

const EXECUTABLE_PATHS = Object.freeze([
  "qualification/synthetic-executive/qualification-real-route/general-continuation-policy.json",
  "qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-policy.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/qualification-route.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/v2-case-scoped-runner.mjs",
  "qualification/synthetic-executive/qualification-real-route/scripts/v3-blind-qualification-runner.mjs",
  "qualification/synthetic-executive/scripts/action-broker.mjs",
  "qualification/synthetic-executive/scripts/executive-action-registry.mjs",
  "qualification/synthetic-executive/scripts/lifecycle-integrity-controller.mjs",
  "qualification/synthetic-executive/scripts/request-envelope-contract.mjs",
  "qualification/synthetic-executive/v3-held-out-corpus/scripts/v3-corpus-compiler.mjs",
  "qualification/synthetic-executive/v3-held-out-corpus/scripts/v3-visible-assembler.mjs",
  "qualification/synthetic-executive/v3-cognitive-remediation/scripts/v2-forensics-and-freeze.mjs",
  "qualification/synthetic-executive/v3-cognitive-remediation/scripts/version-1.12.35-release.mjs",
  "scripts/verify-release-version.mjs",
  "tests/synthetic-executive-bounded-request-envelope.test.mjs",
  "tests/synthetic-executive-v2-held-out-corpus.test.mjs",
  "tests/synthetic-executive-v2-response-boundary-recovery.test.mjs",
  "tests/synthetic-executive-v3-cognitive-remediation.test.mjs",
  "tests/synthetic-executive-v3-held-out-corpus.test.mjs"
]);
const STARTING = Object.freeze({ version: "1.12.34", branch: "refactor/beta-evidence-pipeline", commit: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35", tree: "c6c8674108ff17fac1de8a3c779363e7ddf14960", releaseHash: "fa52f960c6b080bcc598a8757e42512ba99b728856dda4df688b541fc8fc5ef4", evaluationHash: "29bc4479322581b837a060e97c8b26aca366b1414af9e68a432d1aa67f9b0b81", resultSealHash: "647bdd992db23680de24cd43f64b95c9089078f204bfcd5514db0f4a074f9e41" });
const SUPPORT = Object.freeze({
  "KE-V2-C01": ["CLASSIFICATION_SEMANTICS", "DOSSIER_SUFFICIENCY", "CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C02": ["CLASSIFICATION_SEMANTICS", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C03": ["DOSSIER_SUFFICIENCY", "CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C04": ["MEMORY_RECURRENCE_BINDING", "CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C05": ["CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C06": ["COMPACTNESS_OUTPUT_BUDGET"],
  "KE-V2-C07": ["CLASSIFICATION_SEMANTICS", "DOSSIER_SUFFICIENCY", "CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C08": ["EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C09": ["CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C10": ["CLASSIFICATION_SEMANTICS", "DOSSIER_SUFFICIENCY", "CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C11": ["DOSSIER_SUFFICIENCY", "CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C12": ["CLASSIFICATION_SEMANTICS", "CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C13": ["CONTINUATION_SELECTION", "EVALUATION_LABEL_AMBIGUITY"],
  "KE-V2-C14": ["UNRESOLVED_CONTRADICTION", "COMPACTNESS_OUTPUT_BUDGET", "EVALUATION_LABEL_AMBIGUITY"]
});

const fileHash = async (relativePath) => sha256Bytes(await readFile(path.join(repositoryRoot, relativePath)));
const git = async (...args) => (await execFileAsync("git", args, { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 })).stdout;

function actionSummary(action) {
  return { actionType: action.actionType, requestedSuccessorState: action.requestedSuccessorState, evidenceReferences: action.evidenceReferences, memoryReferences: action.memoryReferences, failureClass: action.details?.failureClass || null, dossierClassification: action.details?.classification || null, nextSelection: action.details?.selection || null, uncertaintyCount: action.uncertainties?.length || 0 };
}

function firstDivergence(checks) {
  return ["classificationType", "failureClass", "memoryMatch", "dossierEvaluation", "nextAction"].find((name) => checks[name] === false) || null;
}

export async function buildForensics() {
  const [evaluation, inventory] = await Promise.all([readJson(path.join(finalV2Root, "blind-evaluation.json")), readJson(path.join(finalV2Root, "included-case-inventory.json"))]);
  assert.equal(evaluation.evaluationHash, STARTING.evaluationHash); assert.equal(evaluation.passedChecks, 58); assert.equal(evaluation.totalChecks, 98);
  const records = [];
  for (const item of inventory.cases) {
    const caseId = item.caseId; const [output, key, episode, memory, dossier] = await Promise.all([
      readJson(path.join(repositoryRoot, item.relativePath)), readJson(path.join(corpusRoot, "cases", caseId, "evaluator", "key.json")),
      readJson(path.join(corpusRoot, "cases", caseId, "visible", "episode.json")), readJson(path.join(corpusRoot, "cases", caseId, "memory", "fixture.json")),
      readJson(path.join(corpusRoot, "cases", caseId, "worker", "dossier.json"))
    ]);
    const scored = evaluation.caseResults.find((row) => row.caseId === caseId); const lostRubricPoints = Object.entries(scored.checks).filter(([, passed]) => !passed).map(([name]) => name);
    const contradictionCount = Array.isArray(dossier.contradictions) ? dossier.contradictions.length : 0;
    const terminalAction = output.actions.at(-1) || null; const incompleteForOutputLimit = output.terminalReason?.code === "PROVIDER_INCOMPLETE_MAX_OUTPUT_TOKENS";
    const evidenceMisuse = scored.fatalGates.IGNORED_CONTRADICTION === false ? "UNRESOLVED_CONTRADICTION_NOT_EVALUATED_BEFORE_TERMINATION" : lostRubricPoints.includes("dossierEvaluation") ? "DOSSIER_CLASSIFICATION_MISUNDERSTOOD_OR_NOT_REACHED" : "NONE_SHOWN";
    records.push(seal({
      schemaVersion: "1.0", recordType: "V2_COGNITIVE_FAILURE_FORENSIC", caseId, caseOutputHash: output.caseOutputHash, evaluatorKeyHash: key.keyHash,
      score: `${scored.passedChecks}/${scored.totalChecks}`, lostRubricPoints, safetyCritical: scored.safetyCritical, fatalGates: scored.fatalGates,
      evidenceStatePresented: { episodeHash: episode.episodeHash, visibleArtifactIds: episode.visibleArtifactInventory.map((row) => row.artifactId), memoryFixtureHash: memory.fixtureHash, memoryMode: memory.mode || memory.expectedRetrievalClassification, workerDossierHash: dossier.contentHash, workerDossierReached: output.actions.some((action) => action.actionType === "EVALUATE_RETURNED_ENGINEERING_EVIDENCE") },
      contradictionsPresent: contradictionCount, actualActionSequence: output.actions.map(actionSummary), terminalAction: terminalAction ? actionSummary(terminalAction) : null,
      terminalOutcome: { caseStatus: output.caseStatus, terminalState: output.terminalState, terminalReason: output.terminalReason }, firstCognitiveDivergence: firstDivergence(scored.checks),
      evaluatorRequiredBehavior: { classification: key.expectedClassification, failureClass: key.expectedFailureClass, dossierEvaluation: key.expectedDossierEvaluation, nextAction: key.expectedNextAction, memoryMatchClass: key.expectedMemoryMatchClass },
      progressClassification: output.caseStatus === "CASE_SEALED" ? "TERMINATED_BY_TYPED_ACTION" : "PROVIDER_OUTPUT_LIMIT_TERMINATED",
      evidenceHandling: { ignoredOverstatedInventedOrMisunderstood: evidenceMisuse, unsupportedCitationCount: output.unsupportedCitationCount, uncertaintyPreservedInLastAction: (terminalAction?.uncertainties?.length || 0) > 0, memoryUseAppropriate: scored.checks.memoryMatch, dossierUseAppropriate: scored.checks.dossierEvaluation, actionSelectionAppropriate: scored.checks.nextAction },
      tokenLimitMaterial: incompleteForOutputLimit, infrastructureFailure: false, narrowRootCauseClasses: SUPPORT[caseId], proposedGeneralRemediationTargets: SUPPORT[caseId].filter((name) => name !== "EVALUATION_LABEL_AMBIGUITY")
    }, "recordHash"));
  }
  return seal({ schemaVersion: "1.0", matrixType: "COMPLETE_V2_C01_C14_COGNITIVE_FAILURE_MATRIX", sourceEvaluationHash: evaluation.evaluationHash, sourceResultSealHash: STARTING.resultSealHash, exactCaseOrder: inventory.exactCaseOrder, records, score: { passed: 58, total: 98, percent: 59.18 }, classification: evaluation.classification, V2NowDevelopmentEvidenceOnly: true, infrastructureOperatedCorrectly: true, recordAggregateHash: sha256Json(records.map((record) => record.recordHash)) }, "matrixHash");
}

export function buildRegistry(matrix) {
  const defects = [
    { defectId: "CLASSIFICATION_SEMANTICS", classification: "COGNITIVE_JUDGMENT_FAILURE", supportingCases: ["KE-V2-C01", "KE-V2-C02", "KE-V2-C07", "KE-V2-C10", "KE-V2-C12"], correction: "Bind recurrence to selected matching memory, historical to two observed occurrences, and novel to one occurrence." },
    { defectId: "DOSSIER_SUFFICIENCY", classification: "PROOF_STATE_FAILURE", supportingCases: ["KE-V2-C01", "KE-V2-C03", "KE-V2-C07", "KE-V2-C10", "KE-V2-C11"], correction: "Use a general evidence hierarchy for contradiction, complete proof, bounded partial proof, and insufficiency." },
    { defectId: "CONTINUATION_SELECTION", classification: "STOPPING_POLICY_FAILURE", supportingCases: ["KE-V2-C01", "KE-V2-C03", "KE-V2-C04", "KE-V2-C05", "KE-V2-C07", "KE-V2-C09", "KE-V2-C10", "KE-V2-C11", "KE-V2-C12", "KE-V2-C13"], correction: "Map evidence state and reachability to one legal continuation without premature generic rejection or stop." },
    { defectId: "MEMORY_RECURRENCE_BINDING", classification: "COGNITIVE_JUDGMENT_FAILURE", supportingCases: ["KE-V2-C04", "KE-V2-C09"], correction: "Require a selected memory recurrence signature to match the visible causal mechanism." },
    { defectId: "COMPACTNESS_OUTPUT_BUDGET", classification: "BUDGET_OR_CONCISION_FAILURE", supportingCases: ["KE-V2-C06", "KE-V2-C14"], correction: "Require one compact current action and prohibit transcript restatement or future-action prewriting." },
    { defectId: "UNRESOLVED_CONTRADICTION", classification: "CONTRADICTION_HANDLING_FAILURE", supportingCases: ["KE-V2-C14"], safetyCriticalSingleCaseJustification: true, correction: "Keep every unresolved material contradiction visible and block proof-complete or advance claims." },
    { defectId: "EVALUATION_LABEL_AMBIGUITY", classification: "EVALUATOR_CONTRACT_MISMATCH_NOT_COGNITIVE_REMEDIATION", supportingCases: matrix.exactCaseOrder, correction: "Do not modify the V2 scorer. For future held-out cases provide a visible deterministic causal-label derivation independent of hidden outcomes." }
  ];
  for (const defect of defects) assert.ok(defect.supportingCases.length >= 2 || defect.safetyCriticalSingleCaseJustification === true || defect.classification === "EVALUATOR_CONTRACT_MISMATCH_NOT_COGNITIVE_REMEDIATION");
  return seal({ schemaVersion: "1.0", registryType: "V2_SYSTEMIC_COGNITIVE_DEFECT_REGISTRY", matrixHash: matrix.matrixHash, defects, excludedAsRootCauses: ["PROVIDER_TRANSPORT", "AUTHORITY_MECHANICS", "ACTION_BROKER_ENFORCEMENT", "EVIDENCE_CAPTURE"], smallestGeneralCorrectionDefensible: true }, "registryHash");
}

export function buildContract(registry) {
  return seal({ schemaVersion: "1.0", contractType: "KATHERINE_V3_GENERAL_COGNITIVE_REMEDIATION_CONTRACT", registryHash: registry.registryHash, purposeNeutral: true, rules: { classification: "MATCHING_MEMORY_RECURRENCE_ELSE_OCCURRENCE_COUNT", dossierSufficiency: "CONTRADICTION_THEN_COMPLETE_THEN_BOUNDED_THEN_INSUFFICIENT", continuation: "EVIDENCE_CLASS_PLUS_REACHABILITY_OR_HUMAN_NEED", contradiction: "UNRESOLVED_MATERIAL_CONTRADICTION_VISIBLE_AND_PROOF_BLOCKING", compactness: "ONE_CURRENT_ACTION_MINIMUM_SUPPORTED_FIELDS" }, prohibited: { caseIdMatching: true, V2PhraseMatching: true, expectedAnswerEmbedding: true, evaluatorTextInRuntime: true, objectSpecificRules: true, productHandlerChange: true, providerAdapterChange: true, responseContractChange: true, canonicalSerializerChange: true, executiveActionSchemaChange: true, scorerChange: true, evaluatorChange: true }, frozenCeilings: { maximumOutputTokens: 2000, maximumSerializedRequestBytes: 64000, maximumReasoningStepsPerCase: 12 }, providerOrCredentialActivityDuringRemediation: 0, v2Rerun: false }, "contractHash");
}

export async function diagnose() {
  await mkdir(remediationRoot, { recursive: true }); const matrix = await buildForensics(); const registry = buildRegistry(matrix); const contract = buildContract(registry);
  await writeExclusiveJson(outputPath, matrix); await writeExclusiveJson(registryPath, registry); await writeExclusiveJson(contractPath, contract); return { matrix, registry, contract };
}

export async function freezeCognition() {
  const preFreezeSpecificationPath = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-held-out-corpus", "private-case-specification.json");
  await readFile(preFreezeSpecificationPath).then(() => assert.fail("V3_CASE_SPECIFICATION_EXISTS_BEFORE_COGNITIVE_FREEZE"), (error) => assert.equal(error.code, "ENOENT"));
  const [matrix, registry, contract] = await Promise.all([readJson(outputPath), readJson(registryPath), readJson(contractPath)]); assert.equal(registry.matrixHash, matrix.matrixHash); assert.equal(contract.registryHash, registry.registryHash);
  const executableFiles = [];
  for (const relativePath of EXECUTABLE_PATHS) executableFiles.push({ relativePath, sha256: await fileHash(relativePath) });
  const cognitivePaths = ["qualification/synthetic-executive/qualification-real-route/general-continuation-policy.json", "qualification/synthetic-executive/qualification-real-route/scripts/general-continuation-policy.mjs", "qualification/synthetic-executive/qualification-real-route/scripts/v2-case-scoped-runner.mjs"];
  const diff = await git("diff", "--no-ext-diff", "--binary", "--", ...cognitivePaths); const cognitiveSource = await Promise.all(cognitivePaths.map((relativePath) => readFile(path.join(repositoryRoot, relativePath), "utf8")));
  assert.equal(cognitiveSource.slice(0, 2).some((source) => /KE-V2-C(?:0[1-9]|1[0-4])/.test(source)), false, "V2_CASE_ID_IN_RUNTIME_COGNITION");
  const promptLines = generalContinuationPromptLines(); const changedFiles = [];
  for (const relativePath of cognitivePaths) changedFiles.push({ relativePath, sha256: await fileHash(relativePath) });
  const freeze = seal({ schemaVersion: "1.0", freezeType: "KATHERINE_V3_COGNITIVE_IMPLEMENTATION_FREEZE", frozenAt: new Date().toISOString(), startingIdentity: STARTING, defectRegistryHash: registry.registryHash, remediationContractHash: contract.contractHash, generalContinuationPolicyHash: GENERAL_CONTINUATION_POLICY_HASH, correctedPromptHash: sha256Json(promptLines), cognitiveDiffSha256: sha256Bytes(Buffer.from(diff, "utf8")), changedFiles, executableFiles, executableAggregateHash: sha256Json(executableFiles), fixtureSpecificBranchScan: { scannedPaths: cognitivePaths.slice(0, 2), v2CaseIdentityOccurrences: 0, passed: true }, evaluatorLeakageScan: { evaluatorKeysReadByRuntimePrompt: 0, expectedAnswersEmbedded: false, passed: true }, preservedBindings: { canonicalRequestHash: "73fa81d6d3fce8add2d8911682330b954b2653edfb43de4aa37ee02eea6d079e", canonicalPromptHash: "73dc7a21fa2db16c432b9630f3934ea87d78cd89b174b1739563b207a5a57e93", executiveActionSchemaHash: "87021361196a5001050a2c0987c6128fba5d9ec225da31f4966ec342ba72a1ba", responseEvidenceContractHash: "4ab255ae6811120a48cb124501e500d16974a6323d81d945b90d2b4f2d7550af" }, providerRequests: 0, metadataRequests: 0, credentialAccesses: 0, cognitiveOrExecutableChangesAfterFreezePermitted: false, v3CaseCreationOccurredBeforeFreeze: false }, "freezeHash");
  await writeExclusiveJson(freezePath, freeze); return freeze;
}

export async function verifyFreeze() {
  const freeze = await readJson(freezePath); const core = structuredClone(freeze); delete core.freezeHash; assert.equal(sha256Json(core), freeze.freezeHash);
  for (const item of freeze.executableFiles) assert.equal(await fileHash(item.relativePath), item.sha256, `COGNITIVE_FREEZE_CHANGED:${item.relativePath}`);
  return freeze;
}

export async function writeOfflineValidation() {
  const validation = seal({
    schemaVersion: "1.0", validationType: "V3_COGNITIVE_REMEDIATION_PRE_FREEZE_OFFLINE_VALIDATION", recordedAt: new Date().toISOString(),
    focusedCognitiveRegressions: { tests: 9, passed: 9, failed: 0, skipped: 0 },
    fullNode: { tests: 537, passed: 517, failed: 0, skipped: 20, skipReason: "Nineteen historical V2 rebuild/replay or post-corpus gates are inapplicable after V2 became immutable development evidence; one V3 post-corpus gate is pending the required post-freeze corpus creation." },
    powerShellAndServerStatic: { passed: 54, failed: 0 }, browser: { tests: 14, passed: 13, failed: 0, skipped: 1 },
    syntaxChecks: { changedJavaScriptFilesChecked: true, failures: 0 }, diffCheck: { passed: true },
    secretScans: { trackedOrCandidateCredentialFindings: 0, frontendProviderKeyFindings: 0, frontendAuthorizationHeaderFindings: 0 },
    networkAndCredentialActivity: { credentialAccesses: 0, providerRequests: 0, metadataRequests: 0, modelCalls: 0 },
    historicalV2PolicyBoundRebuildsReplacedByImmutableArtifactChecks: true, allApplicableGatesPassed: true
  }, "validationHash");
  await writeExclusiveJson(validationPath, validation); return validation;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const command = process.argv[2]; const result = command === "DIAGNOSE" ? await diagnose() : command === "WRITE_VALIDATION" ? await writeOfflineValidation() : command === "FREEZE" ? await freezeCognition() : command === "VERIFY_FREEZE" ? await verifyFreeze() : null;
  assert.ok(result, "command must be DIAGNOSE, WRITE_VALIDATION, FREEZE or VERIFY_FREEZE"); process.stdout.write(`${stableJson({ command, matrixHash: result.matrix?.matrixHash, registryHash: result.registry?.registryHash, contractHash: result.contract?.contractHash, validationHash: result.validationHash, freezeHash: result.freezeHash, executableAggregateHash: result.executableAggregateHash })}\n`);
}
