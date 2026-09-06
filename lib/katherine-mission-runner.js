import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, "..");
const WORKER_PATH = path.join(PROJECT_ROOT, "scripts", "katherine-scc-worker.mjs");
let productionRunner = null;

function workerEnvironment({ nonce, runnerId }) {
  const allowed = [
    "PATH", "PATHEXT", "SYSTEMROOT", "WINDIR", "COMSPEC", "TEMP", "TMP",
    "OPENAI_API_KEY", "OPEN_API_KEY", "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY",
    "NODE_EXTRA_CA_CERTS", "SSL_CERT_FILE", "SSL_CERT_DIR"
  ];
  const inherited = Object.fromEntries(allowed
    .filter((name) => typeof process.env[name] === "string" && process.env[name].length > 0)
    .map((name) => [name, process.env[name]]));
  return {
    ...inherited,
    KATHERINE_SCC_WORKER_MODE: "1",
    KATHERINE_SCC_TRUSTED_PARENT_PID: String(process.pid),
    KATHERINE_SCC_LAUNCHER_NONCE: nonce,
    KATHERINE_SCC_RUNNER_ID: runnerId
  };
}

function protocolClient(child) {
  let buffer = "";
  let nextId = 1;
  const pending = new Map();
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    while (buffer.includes("\n")) {
      const index = buffer.indexOf("\n");
      const line = buffer.slice(0, index).trim();
      buffer = buffer.slice(index + 1);
      if (!line) continue;
      let message;
      try {
        message = JSON.parse(line);
      } catch (cause) {
        for (const receiver of pending.values()) receiver.reject(cause);
        pending.clear();
        child.stdin.end();
        continue;
      }
      const receiver = pending.get(message.id);
      if (!receiver) continue;
      pending.delete(message.id);
      if (message.error) receiver.reject(Object.assign(new Error(message.error.message), { code: message.error.code }));
      else receiver.resolve(message.result);
    }
  });
  child.once("exit", (code, signal) => {
    for (const receiver of pending.values()) {
      receiver.reject(new Error(`KATHERINE_SCC_WORKER_EXITED:${code}:${signal}`));
    }
    pending.clear();
  });
  return (method, params = {}, timeoutMilliseconds = 95000) => new Promise((resolve, reject) => {
    const id = nextId++;
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`KATHERINE_SCC_PROTOCOL_TIMEOUT:${method}`));
    }, timeoutMilliseconds);
    pending.set(id, {
      resolve: (value) => { clearTimeout(timeout); resolve(value); },
      reject: (error) => { clearTimeout(timeout); reject(error); }
    });
    child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
  });
}

export async function createKatherineMissionRunner({ learningRoot } = {}) {
  if (typeof learningRoot !== "string" || !path.isAbsolute(learningRoot)) {
    throw new Error("KATHERINE_SCC_LEARNING_ROOT_REQUIRED");
  }
  const nonce = randomBytes(32).toString("hex");
  const runnerId = `katherine-runner-${process.pid}-${randomBytes(12).toString("hex")}`;
  const child = spawn(process.execPath, [WORKER_PATH, `--learning-root=${learningRoot}`], {
    cwd: PROJECT_ROOT,
    env: workerEnvironment({ nonce, runnerId }),
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true
  });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-32768); });
  const call = protocolClient(child);
  let startup;
  try {
    startup = await call("initialize", {
      parentProcessId: process.pid,
      workerProcessId: child.pid,
      launcherNonce: nonce,
      runnerId
    });
  } catch (caught) {
    const exited = child.exitCode === null
      ? new Promise((resolve) => child.once("exit", resolve))
      : Promise.resolve();
    child.stdin.end();
    await exited;
    throw Object.assign(caught, { workerStderr: stderr });
  }
  if (startup.result !== "KATHERINE_SCC_RUNTIME_AUTHENTICATED" || startup.reconstructedStartupReceipt !== true) {
    child.stdin.end();
    throw new Error("KATHERINE_SCC_STARTUP_QUALIFICATION_FAILED");
  }
  if (startup.startupReceipt?.runnerId !== runnerId ||
      startup.startupReceipt?.processId !== child.pid ||
      startup.startupReceipt?.parentProcessId !== process.pid) {
    child.stdin.end();
    throw new Error("KATHERINE_SCC_STARTUP_RECEIPT_PROCESS_BINDING_FAILED");
  }
  let transition = "AUTHENTICATE_KATHERINE_CHECKPOINT";
  let closed = false;
  const dispatch = async (request) => {
    if (closed) throw new Error("KATHERINE_MISSION_RUNNER_CLOSED");
    const result = await call("run-job", request);
    transition = request.workflowTransition;
    return result;
  };
  const reconstructCheckpoint = (input = {}) => dispatch({
    role: "FRESH_RECONSTRUCTION",
    jobType: "RECONSTRUCT_DURABLE_CHECKPOINT",
    workflowState: "KATHERINE_CHECKPOINT_AUTHENTICATED",
    workflowTransition: "AUTHENTICATE_KATHERINE_CHECKPOINT->LOAD_AND_VERIFY_KATHERINE_TEXTBOOK",
    input: { mission: "KATHERINE_PREVIEW_BETA", inheritedConversation: false, manualLessonSelection: false, ...input }
  });
  const runWholeMissionPreflight = (input = {}) => dispatch({
    role: "PRODUCT_OPERATOR",
    jobType: "RUN_WHOLE_MISSION_PREFLIGHT",
    workflowState: "KATHERINE_TEXTBOOK_VERIFIED",
    workflowTransition: "LOAD_AND_VERIFY_KATHERINE_TEXTBOOK->WHOLE_MISSION_PREFLIGHT_COMPLETE",
    input: { mission: "KATHERINE_PREVIEW_BETA", ...input }
  });
  const proveInferenceAdmission = (operationManifestSha256) => dispatch({
    role: "PRODUCT_OPERATOR",
    jobType: "BOUNDED_PRODUCT_INFERENCE",
    workflowState: "WHOLE_MISSION_PREFLIGHT_COMPLETE",
    workflowTransition: "WHOLE_MISSION_PREFLIGHT_COMPLETE->PENDING_NATIVE_OWNER_AUTHORITY",
    input: { mode: "DRY_ADMISSION_PROOF", operationManifestSha256 }
  });
  const infer = (payload) => dispatch({
    role: "PRODUCT_OPERATOR",
    jobType: "BOUNDED_PRODUCT_INFERENCE",
    workflowState: "KATHERINE_PRODUCT_REQUEST_VALIDATED",
    workflowTransition: "KATHERINE_PRODUCT_REQUEST_VALIDATED->KATHERINE_BOUNDED_INFERENCE_VALIDATED",
    input: { mode: "LIVE", payload }
  });
  const diagnoseFailure = (episodeObservations) => dispatch({
    role: "MENTOR",
    jobType: "DIAGNOSE_AUTHENTICATED_PRODUCT_FAILURE",
    workflowState: "AUTHENTICATED_FAILURE_RECORDED",
    workflowTransition: "AUTHENTICATED_FAILURE_RECORDED->MENTOR_DIAGNOSIS_COMPLETE",
    input: { episodeObservations }
  });
  const evaluateFixedTrials = (trials) => dispatch({
    role: "EVALUATOR",
    jobType: "EVALUATE_FIXED_TRIALS",
    workflowState: "FIXED_TRIALS_RECORDED",
    workflowTransition: "FIXED_TRIALS_RECORDED->INDEPENDENT_EVALUATION_COMPLETE",
    input: { trials }
  });
  const governLessonLifecycle = (evaluation) => dispatch({
    role: "GOVERNOR",
    jobType: "GOVERN_LESSON_LIFECYCLE",
    workflowState: "INDEPENDENT_EVALUATION_COMPLETE",
    workflowTransition: "INDEPENDENT_EVALUATION_COMPLETE->GOVERNOR_DECISION_COMPLETE",
    input: {
      fixedTrialsPassing: evaluation?.passing === true,
      evaluationReceiptId: evaluation?.sccJobReceipt?.receiptId || ""
    }
  });
  return Object.freeze({
    runnerId,
    workerProcessId: child.pid,
    startup,
    reconstructCheckpoint,
    runWholeMissionPreflight,
    proveInferenceAdmission,
    infer,
    diagnoseFailure,
    evaluateFixedTrials,
    governLessonLifecycle,
    audit: () => call("audit"),
    currentTransition: () => transition,
    close: async () => {
      if (closed) return;
      closed = true;
      const exited = child.exitCode === null
        ? new Promise((resolve) => child.once("exit", resolve))
        : Promise.resolve();
      child.stdin.end();
      await exited;
    }
  });
}

export async function runKatherinePreviewDryMission(runner) {
  const reconstruction = await runner.reconstructCheckpoint();
  const preflight = await runner.runWholeMissionPreflight({ nextTransition: reconstruction.nextTransition });
  const inference = await runner.proveInferenceAdmission(preflight.operationManifestSha256);
  return Object.freeze({
    result: "KATHERINE_PREVIEW_DRY_MISSION_COMPLETE",
    nextTransition: reconstruction.nextTransition,
    checksPassed: preflight.checksPassed,
    checksTotal: preflight.checksTotal,
    operationManifestSha256: preflight.operationManifestSha256,
    providerCalls: inference.providerCalls,
    externalEffects: 0,
    receiptIds: [
      reconstruction.sccJobReceipt.receiptId,
      preflight.sccJobReceipt.receiptId,
      inference.sccJobReceipt.receiptId
    ]
  });
}

async function configuredProductionRunner() {
  if (productionRunner === null) {
    productionRunner = createKatherineMissionRunner({
      learningRoot: String(process.env.KATHERINES_EYE_LEARNING_ROOT || "")
    });
  }
  return productionRunner;
}

export async function requestKatherineSccInference({ payload } = {}) {
  const runner = await configuredProductionRunner();
  return runner.infer(payload);
}
