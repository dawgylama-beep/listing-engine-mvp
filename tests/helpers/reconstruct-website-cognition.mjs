import { createHash } from "node:crypto";

import { createProgrammedCompetenceManifest } from "../../lib/cognitive-governor/mentor-success-origination.js";
import { GovernedLearningAdapter } from "../../lib/cognitive-learning/adapter.js";
import { installHardNetworkDenial } from "./hard-network-denial.mjs";

const [root, learningScopeIdentity, episodeId] = process.argv.slice(2);
if (!root || !learningScopeIdentity || !episodeId) {
  throw new Error("root, learning scope, and episode identity are required");
}

const networkGuard = installHardNetworkDenial();
try {
  const adapter = new GovernedLearningAdapter({ root, learningScopeIdentity });
  const reconstruction = await adapter.reconstructWebsiteCognition({
    episodeId,
    frozenSuccessArtifacts: [],
    programmedCompetenceManifest: createProgrammedCompetenceManifest([])
  });
  const websiteOutcome = reconstruction.websiteOutcome;
  process.stdout.write(`${JSON.stringify({
    result: reconstruction.result,
    websiteOutcomeId: websiteOutcome.websiteOutcomeId,
    requestSha256: createHash("sha256").update(websiteOutcome.requestBytes).digest("hex"),
    responseSha256: createHash("sha256").update(websiteOutcome.responseBytes).digest("hex"),
    canonicalResponseHash: websiteOutcome.artifact.response.canonicalObjectHash,
    terminalKind: websiteOutcome.artifact.terminalKind,
    statusCode: websiteOutcome.artifact.statusCode,
    cognitiveDisposition: reconstruction.cognitiveDisposition,
    successInventoryCount: reconstruction.successInventory?.authenticatedSuccessObservations?.length || 0,
    mentorObservationCount: reconstruction.mentorSuccessOrigination?.explanations?.length || 0,
    candidateOriginated: reconstruction.candidateOriginated,
    qualificationAuthorized: reconstruction.qualificationAuthorized,
    promotionAuthorized: reconstruction.promotionAuthorized,
    runtimeConsumptionAuthorized: reconstruction.runtimeConsumptionAuthorized,
    productChangeAuthorized: reconstruction.productChangeAuthorized,
    providerLifecycleAuthority: reconstruction.providerLifecycleAuthority,
    networkAttemptCount: networkGuard.attempts.length
  })}\n`);
} finally {
  networkGuard.restore();
}
