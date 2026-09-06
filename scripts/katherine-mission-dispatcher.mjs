#!/usr/bin/env node
import path from "node:path";

import {
  createKatherineMissionRunner,
  runKatherinePreviewDryMission
} from "../lib/katherine-mission-runner.js";

function argumentsMap(values) {
  return Object.fromEntries(values.map((item) => {
    const separator = item.indexOf("=");
    if (!item.startsWith("--") || separator < 3) throw new Error(`KATHERINE_RUNNER_ARGUMENT_INVALID:${item}`);
    return [item.slice(2, separator), item.slice(separator + 1)];
  }));
}

const options = argumentsMap(process.argv.slice(2));
if (Object.keys(options).some((key) => !["learning-root", "mode", "repeat"].includes(key))) {
  throw new Error("KATHERINE_RUNNER_ARGUMENT_UNKNOWN");
}
if (options.mode !== "qualification") throw new Error("KATHERINE_RUNNER_MODE_UNSUPPORTED");
const learningRoot = path.resolve(options["learning-root"] || "");
if (!options["learning-root"] || !path.isAbsolute(options["learning-root"])) {
  throw new Error("KATHERINE_RUNNER_ABSOLUTE_LEARNING_ROOT_REQUIRED");
}
const repeat = Number(options.repeat);
if (!Number.isSafeInteger(repeat) || repeat < 1 || repeat > 100) {
  throw new Error("KATHERINE_RUNNER_REPEAT_INVALID");
}

let runner;
let freshRunner;
try {
  runner = await createKatherineMissionRunner({ learningRoot });
  const receiptIds = new Set();
  let finalMission = null;
  for (let index = 0; index < repeat; index += 1) {
    finalMission = await runKatherinePreviewDryMission(runner);
    for (const receiptId of finalMission.receiptIds) receiptIds.add(receiptId);
  }
  const firstAudit = await runner.audit();
  await runner.close();
  runner = null;

  freshRunner = await createKatherineMissionRunner({ learningRoot });
  const reconstruction = await freshRunner.reconstructCheckpoint();
  const freshAudit = await freshRunner.audit();
  process.stdout.write(`${JSON.stringify({
    result: "KATHERINE_INSTALLED_SCC_QUALIFICATION_PASS",
    repeatedDryMissions: repeat,
    distinctCognitiveJobReceipts: receiptIds.size,
    checksPassed: finalMission.checksPassed,
    checksTotal: finalMission.checksTotal,
    providerCalls: finalMission.providerCalls,
    externalEffects: finalMission.externalEffects,
    controllerInvolved: firstAudit.controllerInvolved || freshAudit.controllerInvolved,
    crossProductContentLoaded: firstAudit.crossProductContentLoaded || freshAudit.crossProductContentLoaded,
    completeKnowledgeAreaCount: firstAudit.completeKnowledgeAreaCount,
    loadedKnowledgeDocumentCount: firstAudit.loadedKnowledgeDocumentCount,
    reconstructedStartupReceipt: freshAudit.reconstructedStartupReceipt,
    reconstructedReceiptCounts: reconstruction.receiptCounts,
    ineligibleUnmatchedRecordCount: reconstruction.memory.ineligibleUnmatchedRecordIds.length,
    applicableLessonCount: reconstruction.memory.applicableLessonIds.length,
    nextTransition: reconstruction.nextTransition,
    firstWorkerProcessId: firstAudit.startupReceipt.processId,
    freshWorkerProcessId: freshAudit.startupReceipt.processId
  })}\n`);
} finally {
  if (runner) await runner.close();
  if (freshRunner) await freshRunner.close();
}
