import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import {
  createCognitiveGovernor,
  createGovernorExecutionLedger,
  runCanonicalCognitiveRuntime
} from "./cognitive-governor/index.js";
import { originateMentorDiagnosisCandidates } from "./cognitive-governor/mentor-guided-reasoning.js";
import { GovernedLearningAdapter } from "./cognitive-learning/adapter.js";
import { stableObjectJson } from "./object-intelligence/stable.js";
import { validateContractSchemaValue } from "../qualification/synthetic-executive/scripts/bounded-request-contract.mjs";

const execFileAsync = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..");
const ROLE_REGISTRY_PATH = path.join(HERE, "katherine-scc-role-registry.json");
const KNOWLEDGE_ROOT = "C:/Users/dawgy/.agents/skills/cognitive-mission-operator/references/katherine-eye";
const REGISTRATION_PATH = path.join(KNOWLEDGE_ROOT, "registration-successor-v2.json");
const MANIFEST_PATH = path.join(KNOWLEDGE_ROOT, "manifest-successor-v2.json");
const FOUNDATION_PACKAGE_ROOT = "sha256:6c588b9e86ba1669b95499e04ddc49d32cc69ba36b201d68ae287dc79c61ab68";
const REGISTRATION_SHA256 = "89b94737b07691f60c4ba16fcca08c9c3d50fa79b8d3a0b70ddec178e856a2be";
const MANIFEST_SHA256 = "e010a7c39f1e98747fea87daef58a6d668e55ff6703533a035fffbf049bd2c45";
const admitted = new WeakMap();

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

async function readKnowledgeBinding(binding, label, { parseJson = true } = {}) {
  if (!binding || typeof binding.path !== "string" || !binding.path ||
      !Number.isSafeInteger(binding.byteLength) || binding.byteLength < 1 ||
      !/^[a-f0-9]{64}$/u.test(binding.sha256 || "")) {
    throw new Error(`KATHERINE_SCC_KNOWLEDGE_BINDING_INVALID:${label}`);
  }
  const knowledgeRoot = path.resolve(KNOWLEDGE_ROOT);
  const resolved = path.resolve(knowledgeRoot, binding.path);
  if (!resolved.startsWith(`${knowledgeRoot}${path.sep}`)) {
    throw new Error(`KATHERINE_SCC_KNOWLEDGE_PATH_OUTSIDE_PACKAGE:${label}`);
  }
  const bytes = await readFile(resolved);
  if (bytes.length !== binding.byteLength) {
    throw new Error(`KATHERINE_SCC_KNOWLEDGE_LENGTH_MISMATCH:${binding.path}`);
  }
  if (sha256(bytes) !== binding.sha256) {
    throw new Error(`KATHERINE_SCC_KNOWLEDGE_HASH_MISMATCH:${binding.path}`);
  }
  return Object.freeze({
    path: binding.path,
    bytes,
    ...(parseJson ? { value: JSON.parse(bytes) } : {})
  });
}

async function gitIdentity() {
  const options = { cwd: PROJECT_ROOT, windowsHide: true, encoding: "utf8" };
  const trustedRepository = ["-c", `safe.directory=${PROJECT_ROOT}`];
  const [commit, tree] = await Promise.all([
    execFileAsync("git", [...trustedRepository, "rev-parse", "HEAD"], options),
    execFileAsync("git", [...trustedRepository, "rev-parse", "HEAD^{tree}"], options)
  ]);
  return Object.freeze({ commit: commit.stdout.trim(), tree: tree.stdout.trim() });
}

async function authenticateKnowledge() {
  const [registrationBytes, manifestBytes, registryBytes] = await Promise.all([
    readFile(REGISTRATION_PATH), readFile(MANIFEST_PATH), readFile(ROLE_REGISTRY_PATH)
  ]);
  if (sha256(registrationBytes) !== REGISTRATION_SHA256 || sha256(manifestBytes) !== MANIFEST_SHA256) {
    throw new Error("KATHERINE_SCC_KNOWLEDGE_SUCCESSOR_IDENTITY_MISMATCH");
  }
  const registration = JSON.parse(registrationBytes);
  const manifest = JSON.parse(manifestBytes);
  const registry = JSON.parse(registryBytes);
  if (registration.stableProductIdentifier !== "katherine-eye" ||
      registration.activationPolicy?.baselineOperatingKnowledgeLoadsBeforeMentor !== true ||
      registration.activationPolicy?.baselineLoadRequiresGovernorRetentionProof !== false ||
      manifest.product !== "katherine-eye" || manifest.mission !== "KATHERINE_PREVIEW_BETA" ||
      manifest.textbookBinding?.sha256 !== "1fb3000d3267d690637b640ffed98826ec569d4503b3f8c9cea31bf4f0467f89" ||
      registry.foundation?.version !== "0.2.4" || registry.foundation?.packageRoot !== FOUNDATION_PACKAGE_ROOT ||
      registry.isolation?.crossProductContentAllowed !== false || registry.isolation?.genericAgentAllowed !== false ||
      !registry.jobContracts || typeof registry.jobContracts !== "object") {
    throw new Error("KATHERINE_SCC_KNOWLEDGE_CONTRACT_INVALID");
  }
  const [registrationV1Record, productIndexRecord, manifestV1Record] = await Promise.all([
    readKnowledgeBinding(registration.predecessorRegistration, "registration-predecessor-v1"),
    readKnowledgeBinding({
      path: registration.productIndexBinding?.successorPath,
      byteLength: registration.productIndexBinding?.successorByteLength,
      sha256: registration.productIndexBinding?.successorSha256
    }, "product-index-entry-successor"),
    readKnowledgeBinding(manifest.predecessorManifest, "manifest-predecessor-v1")
  ]);
  const registrationV1 = registrationV1Record.value;
  const productIndexEntry = productIndexRecord.value;
  const manifestV1 = manifestV1Record.value;
  const [baseRegistrationRecord, baseManifestRecord] = await Promise.all([
    readKnowledgeBinding(registrationV1.predecessorRegistration, "base-registration"),
    readKnowledgeBinding(manifestV1.predecessorManifest, "base-manifest")
  ]);
  const baseRegistration = baseRegistrationRecord.value;
  const baseManifest = baseManifestRecord.value;
  if (registrationV1.stableProductIdentifier !== "katherine-eye" ||
      baseRegistration.product !== "katherine-eye" ||
      productIndexEntry.stableProductIdentifier !== "katherine-eye" ||
      productIndexEntry.isolationPolicy?.authenticateOnlyThisProductEntry !== true ||
      productIndexEntry.isolationPolicy?.siblingProductEntryChangesInvalidateThisEntry !== false ||
      productIndexEntry.versionedRegistration?.manifestSha256 !== manifest.predecessorManifest.sha256 ||
      manifestV1.product !== "katherine-eye" || manifestV1.mission !== "KATHERINE_PREVIEW_BETA" ||
      baseManifest.product !== "katherine-eye" || baseManifest.mission !== "KATHERINE_PREVIEW_BETA" ||
      !Array.isArray(baseManifest.startupRequiredDocuments) ||
      !baseManifest.startupRequiredDocuments.every((item) => item.mustReadCompletelyBeforeAcceptingWork === true) ||
      !Array.isArray(baseManifest.requiredOperatingKnowledge) || baseManifest.requiredOperatingKnowledge.length === 0 ||
      !Array.isArray(baseManifest.canonicalSources) || baseManifest.canonicalSources.length === 0) {
    throw new Error("KATHERINE_SCC_KNOWLEDGE_INHERITANCE_INVALID");
  }
  const inherited = [...new Map([
    ...baseManifest.startupRequiredDocuments,
    manifest.continuationCheckpointSuccessor
  ].map((binding) => [binding.path, binding])).values()];
  const loaded = await Promise.all(inherited.map(
    (binding) => readKnowledgeBinding(binding, binding.path, { parseJson: false })
  ));
  const foreignContent = loaded.filter((item) => /ncaa edge|nba edge|other-product/iu.test(item.bytes.toString("utf8")));
  if (foreignContent.length !== 0) throw new Error("KATHERINE_SCC_CROSS_PRODUCT_CONTENT_REJECTED");
  return Object.freeze({
    registrationSha256: REGISTRATION_SHA256,
    manifestSha256: MANIFEST_SHA256,
    textbookSha256: manifest.textbookBinding.sha256,
    roleRegistrySha256: sha256(registryBytes),
    completeKnowledgeAreaCount: baseManifest.requiredOperatingKnowledge.length,
    loadedKnowledgeDocumentCount: loaded.length,
    firstUnfinishedTransition: manifest.firstUnfinishedTransition,
    operationManifest: Object.freeze({ ...manifest.operationManifest }),
    roles: Object.freeze(registry.roles),
    closedJobSet: Object.freeze(registry.closedJobSet),
    jobContracts: Object.freeze(registry.jobContracts),
    crossProductContentLoaded: false
  });
}

function authenticateLauncher(attestation) {
  if (process.env.KATHERINE_SCC_WORKER_MODE !== "1" || !attestation ||
      Number(process.env.KATHERINE_SCC_TRUSTED_PARENT_PID) !== process.ppid ||
      attestation.parentProcessId !== process.ppid || attestation.workerProcessId !== process.pid ||
      attestation.launcherNonce !== process.env.KATHERINE_SCC_LAUNCHER_NONCE ||
      attestation.runnerId !== process.env.KATHERINE_SCC_RUNNER_ID ||
      !/^[a-f0-9]{64}$/u.test(attestation.launcherNonce)) {
    throw new Error("KATHERINE_SCC_TRUSTED_LAUNCHER_REQUIRED");
  }
  return Object.freeze({
    processId: process.pid,
    parentProcessId: process.ppid,
    launcherNonceSha256: sha256(attestation.launcherNonce),
    runnerId: attestation.runnerId
  });
}

async function cognitiveAuthority(adapter, jobId) {
  const governor = createCognitiveGovernor({
    evaluationId: jobId,
    customerMission: { product: "katherine-eye", objective: "bounded SCC job" },
    executionLedger: createGovernorExecutionLedger({ evaluationId: jobId })
  });
  const memory = await adapter.governedMemoryIdentity();
  const runtime = runCanonicalCognitiveRuntime({
    governor,
    snapshot: { evaluationId: jobId },
    executiveMemoryContext: {
      runIdentity: "katherine-eye-scc",
      currentEpisodeId: jobId,
      records: [], selectedMemoryIds: [], retrievalReceiptHash: memory.memoryRootSha256,
      startsEmpty: memory.applicableLessonIds.length === 0, forwardOnly: true
    }
  });
  return { governor, runtime, memory };
}

async function boundedOpenAIInference(payload) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_API_KEY;
  if (!apiKey) throw Object.assign(new Error("Katherine's Eye inference credential is unavailable."), {
    code: "ANALYSIS_NOT_CONFIGURED", httpStatusCode: 500
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000);
  let response;
  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `katherine-scc-${sha256(stableObjectJson(payload))}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
  } catch (cause) {
    throw Object.assign(new Error(cause?.name === "AbortError"
      ? "OpenAI request timed out."
      : cause?.message || "OpenAI API request failed."), {
      code: cause?.name === "AbortError" ? "timeout" : "provider_error",
      category: cause?.name === "AbortError" ? "timeout" : "provider_error",
      timedOut: cause?.name === "AbortError",
      cause
    });
  } finally {
    clearTimeout(timeout);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error?.message || "OpenAI API request failed."), {
    code: data.error?.code || `PROVIDER_HTTP_${response.status}`, httpStatusCode: response.status,
    returnedModel: data.model, providerUsage: data.usage,
    providerResponseId: data.id, providerRequestId: response.headers.get("x-request-id")
  });
  const outputText = data.output_text || data.output?.flatMap((item) => item.content || [])
    .find((item) => item.type === "output_text")?.text;
  if (!outputText) throw new Error("KATHERINE_SCC_EMPTY_PROVIDER_RESPONSE");
  const json = JSON.parse(outputText);
  validateContractSchemaValue(json, payload.text.format.schema);
  return { json, data, statusCode: response.status };
}

export async function startKatherineSccRuntime({ learningRoot, attestation } = {}) {
  assert.equal(typeof learningRoot, "string");
  assert.equal(path.isAbsolute(learningRoot), true);
  const launcher = authenticateLauncher(attestation);
  const [knowledge, source] = await Promise.all([authenticateKnowledge(), gitIdentity()]);
  const adapter = new GovernedLearningAdapter({ root: learningRoot, learningScopeIdentity: "katherines-eye-product" });
  await adapter.initialize();
  const startupAuthority = await cognitiveAuthority(adapter, `scc-startup-${process.pid}`);
  const startupReceipt = await adapter.recordSccStartupReceipt({
    governor: startupAuthority.governor,
    runtime: startupAuthority.runtime,
    receipt: {
      runtimeId: "KATHERINES_EYE_SCC_RUNTIME_V1",
      foundationVersion: "0.2.4",
      foundationPackageRoot: FOUNDATION_PACKAGE_ROOT,
      runtimeSource: source,
      productSource: source,
      textbookSha256: knowledge.textbookSha256,
      manifestSha256: knowledge.manifestSha256,
      roleRegistrySha256: knowledge.roleRegistrySha256,
      memoryRootSha256: startupAuthority.memory.memoryRootSha256,
      applicableLessonIds: startupAuthority.memory.applicableLessonIds,
      processId: launcher.processId,
      parentProcessId: launcher.parentProcessId,
      runnerId: launcher.runnerId,
      launcherNonceSha256: launcher.launcherNonceSha256,
      startedAt: new Date().toISOString(),
      validatorResult: "PASS", authorityEffect: false, externalEffects: false
    }
  });
  const handle = Object.freeze({ runtimeId: "KATHERINES_EYE_SCC_RUNTIME_V1", processId: process.pid });
  admitted.set(handle, { adapter, knowledge, source, launcher, startupReceipt, jobSequence: 0 });
  return handle;
}

function validateJob(state, request) {
  const role = state.knowledge.roles[request?.role];
  const contract = state.knowledge.jobContracts[request?.jobType];
  const stateAllowed = contract?.workflowState === request?.workflowState
    || contract?.workflowStates?.includes(request?.workflowState);
  const transitionAllowed = contract?.workflowTransition === request?.workflowTransition
    || contract?.workflowTransitions?.includes(request?.workflowTransition);
  if (!role || !role.jobs.includes(request?.jobType) || !state.knowledge.closedJobSet.includes(request.jobType) ||
      contract?.role !== request.role || !stateAllowed || !transitionAllowed ||
      typeof request.workflowState !== "string" || typeof request.workflowTransition !== "string" ||
      !request.input || typeof request.input !== "object" || Array.isArray(request.input)) {
    throw new Error("KATHERINE_SCC_JOB_ADMISSION_REJECTED");
  }
}

function sequenceState(manifest, sequence) {
  return manifest.governed_checkpoint?.sequence_states?.find((item) => item.sequence === sequence);
}

function manifestContainsWildcardAuthority(manifest) {
  const wildcardTokens = new Set(["*", "ANY", "ALL", "WILDCARD"]);
  const pending = [manifest];
  while (pending.length) {
    const value = pending.pop();
    if (Array.isArray(value)) pending.push(...value);
    else if (value && typeof value === "object") pending.push(...Object.values(value));
    else if (typeof value === "string" && wildcardTokens.has(value.trim().toUpperCase())) return true;
  }
  return false;
}

async function authenticateManifestEvidence(manifest) {
  const bindings = manifest.evidence_bindings;
  if (!Array.isArray(bindings) || bindings.length === 0) return false;
  for (const binding of bindings) {
    if (typeof binding?.path !== "string" || !path.isAbsolute(binding.path) ||
        !Number.isSafeInteger(binding.byte_count) || !/^[a-f0-9]{64}$/u.test(binding.sha256)) return false;
    const bytes = await readFile(binding.path);
    if (bytes.length !== binding.byte_count || sha256(bytes) !== binding.sha256) return false;
  }
  return true;
}

async function authenticateManifestSource(manifest) {
  const target = manifest.source_succession?.successor_source_identity;
  if (!/^[a-f0-9]{40}$/u.test(target?.commit || "") || !/^[a-f0-9]{40}$/u.test(target?.tree || "")) return false;
  const options = { cwd: PROJECT_ROOT, windowsHide: true, encoding: "utf8" };
  const trustedRepository = ["-c", `safe.directory=${PROJECT_ROOT}`];
  try {
    const [tree, ancestor] = await Promise.all([
      execFileAsync("git", [...trustedRepository, "rev-parse", `${target.commit}^{tree}`], options),
      execFileAsync("git", [...trustedRepository, "merge-base", "--is-ancestor", target.commit, "HEAD"], options)
    ]);
    return tree.stdout.trim() === target.tree && ancestor.stdout === "";
  } catch {
    return false;
  }
}

async function wholeMissionPreflight(state, manifest) {
  const operations = Array.isArray(manifest.operations) ? manifest.operations : [];
  const actionIds = operations.map((item) => item.action_id);
  const actionPositions = new Map(actionIds.map((actionId, index) => [actionId, index]));
  const effects = new Set(operations.map((item) => item.effect));
  const replay = manifest.replay_binding || {};
  const nextSequence = replay.next_sequence;
  const source = manifest.source_succession?.successor_source_identity || {};
  const actionIdentity = manifest.action_scope?.product_identity || {};
  const publication = manifest.action_scope?.publication || {};
  const worktree = manifest.source_succession?.execution_worktree_evidence || {};
  const requiredTools = manifest.controller_requirements?.required_tool_names || [];
  const requiredZeroEffects = [
    "CREDENTIAL_READ", "CREDENTIAL_DECRYPT", "SENSITIVE_ENVIRONMENT_MUTATION",
    "RESOURCE_DISCONNECT", "RESOURCE_RECONNECT", "INTEGRATION_PREFIX_CHANGE",
    "PRODUCTION_DEPLOYMENT", "MAIN_BRANCH_MUTATION", "CANONICAL_DOMAIN_MUTATION",
    "LIVE_PROVIDER_CALL", "FOLLOWING_SEQUENCE_ISSUANCE", "SPENDING_USD",
    "REAL_CUSTOMER_RECORD_ACCESS", "FORCE_PUSH", "APPLICATION_RESTART",
    "CONTROLLER_IMPLEMENTATION_MUTATION", "MCP_FRONTEND_TRANSPORT_TERMINATION",
    "NEW_LOGICAL_SERVER", "NEW_SIGNER", "NEW_REPLAY_LEDGER", "NEW_PROJECT_MEMORY",
    "NEW_AUTHORITY_CHANNEL"
  ];
  const checks = [
    ["authenticated_katherine_bootstrap", state.knowledge.firstUnfinishedTransition === "REQUEST_NATIVE_OWNER_AUTHORITY_FOR_EXACT_SEQUENCE_14"],
    ["closed_manifest_identity", manifest.object_type === "MISSION_OPERATION_MANIFEST" && manifest.status === "INERT_PENDING_NATIVE_OWNER_APPROVAL"],
    ["mission_binding", manifest.mission_binding === "KATHERINE_PREVIEW_BETA" && manifest.project_authority?.memory_project_id === "katherine-eye"],
    ["operation_set_present", operations.length > 0 && actionIds.every((item) => typeof item === "string" && item.length > 0)],
    ["operation_ids_unique", new Set(actionIds).size === actionIds.length],
    ["dependency_order_closed", operations.every((item, index) => Array.isArray(item.depends_on) && item.depends_on.every((dependency) => actionPositions.has(dependency) && actionPositions.get(dependency) < index))],
    ["effect_maxima_explicit", operations.every((item) => Number.isSafeInteger(item.maximum_count) && item.maximum_count >= 1)],
    ["native_approval_single_use", effects.has("NATIVE_OWNER_APPROVAL") && operations.find((item) => item.effect === "NATIVE_OWNER_APPROVAL")?.maximum_count === 1 && operations.find((item) => item.effect === "NATIVE_OWNER_APPROVAL")?.scope?.single_use === true],
    ["source_successor_before_signer", actionPositions.get("project-source-successor") < actionPositions.get("signer-access")],
    ["non_force_publication_bounded", effects.has("GIT_PUBLICATION") && publication.force === false && publication.pushes_max === 1],
    ["private_preview_bounded", effects.has("PRIVATE_PREVIEW_DEPLOYMENT") && manifest.action_scope?.deployment?.private_required === true && manifest.action_scope?.deployment?.deployments_max === 1],
    ["schema_initialization_bounded", effects.has("SCHEMA_INITIALIZATION") && manifest.action_scope?.schema_initialization?.initializations_max === 1],
    ["synthetic_verification_bounded", effects.has("SYNTHETIC_VERIFICATION") && manifest.action_scope?.synthetic_verification?.verification_runs_max === 1 && manifest.action_scope?.synthetic_verification?.real_customer_data_allowed === false],
    ["cleanup_required", effects.has("SYNTHETIC_CLEANUP") && manifest.action_scope?.mandatory_cleanup?.required === true],
    ["final_zero_record_proof", operations.at(-1)?.effect === "FINAL_ZERO_RECORD_PROOF" && Object.entries(manifest.action_scope?.mandatory_cleanup || {}).filter(([key]) => key.endsWith("_remaining_max")).every(([, value]) => value === 0)],
    ["zero_effect_ceilings_complete", requiredZeroEffects.every((effect) => manifest.zero_effect_ceilings?.[effect] === 0)],
    ["unknown_or_wildcard_authority_absent", !manifestContainsWildcardAuthority(manifest) && operations.every((item) => typeof item.effect === "string" && item.effect.length > 0)],
    ["replay_forward_sequence", Number.isSafeInteger(nextSequence) && nextSequence === replay.resolved_through_sequence + 1],
    ["checkpoint_forward_states", sequenceState(manifest, replay.resolved_through_sequence)?.status === "COMPLETED_AND_CONSUMED" && sequenceState(manifest, nextSequence)?.status === "PENDING_NATIVE_OWNER_AUTHORITY" && sequenceState(manifest, nextSequence + 1)?.status === "PROHIBITED"],
    ["grant_bound_to_pending_sequence", operations.find((item) => item.effect === "OWNER_GRANT_ISSUANCE")?.scope?.sequence === nextSequence && operations.find((item) => item.effect === "OWNER_GRANT_SUBMISSION")?.scope?.sequence === nextSequence],
    ["source_identity_consistent", [actionIdentity, publication, worktree].every((item) => item.commit === source.commit && item.tree === source.tree)],
    ["repository_owned_source_authenticated", await authenticateManifestSource(manifest)],
    ["infrastructure_compatible", manifest.action_scope?.resource?.use_existing_managed_resource === true && manifest.action_scope?.resource?.connection_mutations_max === 0 && manifest.action_scope?.environment_configuration?.credential_bearing_values_allowed === false],
    ["approval_interface_and_transport_declared", requiredTools.length === 8 && new Set(requiredTools).size === 8 && requiredTools.includes("request_owner_authority_approval") && manifest.controller_requirements?.transport_profile === "PERSISTENT_FRONTEND_SUPERVISOR_V1"],
    ["data_only_controller_continuity", manifest.controller_requirements?.implementation_update_mode === "DATA_ONLY" && manifest.controller_requirements?.mid_mission_controller_changes_max === 0 && manifest.controller_requirements?.application_restarts_max === 0],
    ["evidence_and_product_isolation", await authenticateManifestEvidence(manifest) && state.knowledge.crossProductContentLoaded === false]
  ];
  if (checks.length !== 26 || checks.some(([, passed]) => passed !== true)) {
    const passed = checks.filter(([, value]) => value === true).length;
    const failed = checks.filter(([, value]) => value !== true).map(([name]) => name);
    throw new Error(`KATHERINE_SCC_WHOLE_MISSION_PREFLIGHT_FAILED:${passed}/26:${failed.join(",")}`);
  }
  return Object.freeze(checks.map(([name]) => Object.freeze({ name, result: "PASS" })));
}

async function executeTypedJob(state, request, authority) {
  if (request.jobType === "BOUNDED_PRODUCT_INFERENCE") {
    if (request.input.mode === "DRY_ADMISSION_PROOF") {
      return { result: "KATHERINE_SCC_INFERENCE_ADMISSION_PROVEN", providerCalls: 0,
        knowledgeAreaCount: state.knowledge.completeKnowledgeAreaCount, crossProductContentLoaded: false };
    }
    if (request.input.mode !== "LIVE" || !request.input.payload) throw new Error("KATHERINE_SCC_INFERENCE_INPUT_INVALID");
    return boundedOpenAIInference(request.input.payload);
  }
  if (request.jobType === "RUN_WHOLE_MISSION_PREFLIGHT") {
    const binding = state.knowledge.operationManifest;
    const bytes = await readFile(binding.path);
    if (bytes.length !== binding.byteLength || sha256(bytes) !== binding.sha256) {
      throw new Error("KATHERINE_SCC_OPERATION_MANIFEST_IDENTITY_MISMATCH");
    }
    const manifest = JSON.parse(bytes);
    const checks = await wholeMissionPreflight(state, manifest);
    return { result: "KATHERINE_WHOLE_MISSION_PREFLIGHT_PASS", checksPassed: 26, checksTotal: 26,
      checks, operationManifestSha256: binding.sha256, providerCalls: 0, externalEffects: 0 };
  }
  if (request.jobType === "DIAGNOSE_AUTHENTICATED_PRODUCT_FAILURE") {
    const report = originateMentorDiagnosisCandidates({ episodeObservations: request.input.episodeObservations });
    return { result: "KATHERINE_MENTOR_DIAGNOSIS_READY", report };
  }
  if (request.jobType === "RECONSTRUCT_DURABLE_CHECKPOINT") {
    const receipts = await state.adapter.reconstructSccReceipts();
    const memory = await state.adapter.governedMemoryIdentity();
    return { result: "KATHERINE_SCC_RECONSTRUCTED", receiptCounts: {
      startups: receipts.startupReceipts.length, jobs: receipts.jobReceipts.length
    }, memory, nextTransition: state.knowledge.firstUnfinishedTransition };
  }
  if (request.jobType === "EVALUATE_FIXED_TRIALS") {
    const trials = request.input.trials;
    if (!Array.isArray(trials) || trials.length < 2) throw new Error("KATHERINE_SCC_FIXED_TRIALS_REQUIRED");
    const passing = trials.every((item) => item.checksPassed === item.checksTotal && item.providerCalls === 0);
    return { result: "KATHERINE_FIXED_TRIALS_EVALUATED", passing, trialCount: trials.length };
  }
  if (request.jobType === "GOVERN_LESSON_LIFECYCLE") {
    const allowed = ["RETAIN", "REJECT", "QUARANTINE", "REQUEST_ADDITIONAL_TRIALS", "ROLLBACK"];
    const receipts = await state.adapter.reconstructSccReceipts();
    const evaluationReceipt = receipts.jobReceipts.find((item) => (
      item.receiptId === request.input.evaluationReceiptId
      && item.role === "EVALUATOR"
      && item.jobType === "EVALUATE_FIXED_TRIALS"
    ));
    const decision = request.input.fixedTrialsPassing === true && evaluationReceipt
      ? "QUARANTINE"
      : "REQUEST_ADDITIONAL_TRIALS";
    if (!allowed.includes(decision)) throw new Error("KATHERINE_SCC_GOVERNOR_DECISION_INVALID");
    return { result: "KATHERINE_GOVERNOR_DECISION_COMPLETE", decision,
      basis: decision === "QUARANTINE"
        ? "FIXED_TRIALS_PASS_BUT_GOVERNED_CANDIDATE_QUALIFICATION_AND_LATER_APPLICATION_ARE_NOT_YET_AUTHENTICATED"
        : "AUTHENTICATED_FIXED_TRIAL_EVIDENCE_INCOMPLETE",
      retentionAuthorized: false,
      governorIdentity: authority.governor.governorIdentity };
  }
  throw new Error("KATHERINE_SCC_UNKNOWN_JOB");
}

export async function runKatherineSccJob(handle, request) {
  const state = admitted.get(handle);
  if (!state) throw new Error("KATHERINE_SCC_LIVE_RUNTIME_REQUIRED");
  validateJob(state, request);
  const jobId = `scc-job-${sha256(stableObjectJson(request)).slice(0, 32)}`;
  const authority = await cognitiveAuthority(state.adapter, jobId);
  const output = await executeTypedJob(state, request, authority);
  state.jobSequence += 1;
  const receipt = await state.adapter.recordSccJobReceipt({
    governor: authority.governor,
    runtime: authority.runtime,
    receipt: {
      startupReceiptId: state.startupReceipt.receiptId,
      role: request.role,
      jobType: request.jobType,
      workflowState: request.workflowState,
      workflowTransition: request.workflowTransition,
      inputSha256: sha256(stableObjectJson(request.input)),
      outputSha256: sha256(stableObjectJson(output)),
      processId: process.pid,
      runnerId: state.launcher.runnerId,
      jobSequence: state.jobSequence,
      completedAt: new Date().toISOString(), validatorResult: "PASS",
      authorityEffect: false, externalEffects: false
    }
  });
  return Object.freeze({ ...output, sccJobReceipt: receipt });
}

export async function auditKatherineSccRuntime(handle) {
  const state = admitted.get(handle);
  if (!state) throw new Error("KATHERINE_SCC_LIVE_RUNTIME_REQUIRED");
  const receipts = await state.adapter.reconstructSccReceipts();
  return Object.freeze({
    result: "KATHERINE_SCC_RUNTIME_AUTHENTICATED",
    runtimeId: handle.runtimeId,
    foundationVersion: "0.2.4",
    foundationPackageRoot: FOUNDATION_PACKAGE_ROOT,
    source: state.source,
    textbookSha256: state.knowledge.textbookSha256,
    manifestSha256: state.knowledge.manifestSha256,
    roleRegistrySha256: state.knowledge.roleRegistrySha256,
    completeKnowledgeAreaCount: state.knowledge.completeKnowledgeAreaCount,
    loadedKnowledgeDocumentCount: state.knowledge.loadedKnowledgeDocumentCount,
    startupReceipt: state.startupReceipt,
    reconstructedStartupReceipt: receipts.startupReceipts.some(
      (item) => item.receiptId === state.startupReceipt.receiptId
    ),
    crossProductContentLoaded: false,
    controllerInvolved: false
  });
}
