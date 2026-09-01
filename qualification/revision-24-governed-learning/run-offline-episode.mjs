import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { GovernedLearningAdapter } from "../../lib/cognitive-learning/adapter.js";
import { stableObjectJson } from "../../lib/object-intelligence/stable.js";
import { buildBrowserHandlerResponse } from "../../tests/helpers/build-browser-handler-response.mjs";
import { installHardNetworkDenial } from "../../tests/helpers/hard-network-denial.mjs";

const [mode, learningRoot, evidencePath, executionMode = "run"] = process.argv.slice(2);
if (!new Set(["collectible", "wearable", "retail"]).has(mode) || !learningRoot || !evidencePath) {
  throw new Error("Usage: run-offline-episode.mjs <collectible|wearable|retail> <learning-root> <evidence-path> [recover]");
}

const cases = Object.freeze({
  collectible: Object.freeze({
    analysisId: "r24-diagnosis-collectible",
    reportType: "marketValue",
    notes: "Painted commemorative metal serving tray with visible championship wording and light edge wear.",
    photos: [Object.freeze({
      name: "commemorative-tray.jpg",
      dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x43).toString("base64")}`
    })],
    buyerIntake: Object.freeze({
      purchase_intent: "owner_value",
      purchase_context: "owned_item",
      item_name: "commemorative metal serving tray",
      item_condition: "vintage",
      condition_concerns: ["stains_or_wear"],
      buyer_notes: "Exact date and maker are not independently confirmed."
    })
  }),
  wearable: Object.freeze({
    analysisId: "r24-diagnosis-wearable",
    reportType: "listing",
    platform: "Facebook Marketplace",
    notes: "Navy merino quarter-zip sweater with light cuff wear.",
    photos: [Object.freeze({
      name: "navy-quarter-zip.jpg",
      dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x57).toString("base64")}`
    })],
    sellerIntake: Object.freeze({
      purchase_intent: "seller_listing",
      purchase_context: "owned_item",
      item_name: "Northline merino quarter-zip sweater",
      known_brand: "Northline",
      known_model: "USW-472",
      item_condition: "used_good",
      condition_concerns: ["stains_or_wear"],
      fulfillment_preference: "local_pickup",
      selling_speed: "balanced",
      buyer_notes: "Size M; light cuff wear; no holes seen."
    })
  }),
  retail: Object.freeze({
    analysisId: "r24-held-out-retail-baseline",
    reportType: "marketValue",
    notes: "Sealed box of 48 privacy envelopes for ordinary household use.",
    photos: [Object.freeze({
      name: "privacy-mailers.jpg",
      dataUrl: `data:image/jpeg;base64,${Buffer.alloc(1024, 0x52).toString("base64")}`
    })],
    buyerIntake: Object.freeze({
      purchase_intent: "personal_use",
      purchase_context: "retail_store",
      item_name: "Cedarline Privacy Mailers",
      known_brand: "Cedarline",
      known_upc: "012345678905",
      asking_price: "$5.50",
      item_condition: "new",
      store_name: "Example Office Store",
      buyer_notes: "Sealed box; price label says $5.50."
    })
  })
});

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const networkGuard = installHardNetworkDenial();
try {
  const adapter = new GovernedLearningAdapter({
    root: path.resolve(learningRoot),
    learningScopeIdentity: "katherines-eye-revision-24-local-trial"
  });
  if (executionMode === "recover") {
    const productOutcome = await adapter.productOutcome(cases[mode].analysisId);
    const websiteOutcome = await adapter.websiteOutcome(cases[mode].analysisId);
    if (!productOutcome) throw new Error("No authenticated product outcome is available to recover.");
    const verification = await adapter.verify();
    const status = await adapter.status();
    const evidence = {
      schemaVersion: "1.0",
      recordType: "KATHERINE_REVISION_24_AUTHENTIC_OFFLINE_PRODUCT_EPISODE_PARTIAL",
      mode,
      analysisId: cases[mode].analysisId,
      productOutcome: {
        episodeId: productOutcome.episode_id,
        episodeSequence: productOutcome.episode_sequence,
        outcomeId: productOutcome.outcome_id,
        responseHash: productOutcome.response_hash,
        memoryTransitionHash: productOutcome.memory_transition_hash
      },
      websiteOutcome: websiteOutcome ? { websiteOutcomeId: websiteOutcome.websiteOutcomeId } : null,
      terminalBlocker: websiteOutcome ? "" : "WEBSITE_OUTCOME_NOT_FOUND",
      governedStore: { verification, status },
      externalEffects: { network: 0, providerCalls: 0, spendingUsd: 0 }
    };
    const source = `${stableObjectJson(evidence)}\n`;
    await mkdir(path.dirname(path.resolve(evidencePath)), { recursive: true });
    await writeFile(path.resolve(evidencePath), source, { flag: "wx", mode: 0o600 });
    process.stdout.write(`${stableObjectJson({
      result: "AUTHENTIC_OFFLINE_PRODUCT_EPISODE_PARTIAL_PRESERVED",
      mode,
      analysisId: cases[mode].analysisId,
      evidencePath: path.resolve(evidencePath),
      evidenceSha256: sha256(Buffer.from(source, "utf8")),
      terminalBlocker: evidence.terminalBlocker,
      eventCount: verification.eventCount,
      networkAttempts: 0
    })}\n`);
    process.exitCode = 0;
  } else {
  const result = await buildBrowserHandlerResponse({
    requestBody: structuredClone(cases[mode]),
    evidenceMode: mode,
    governedLearningAdapter: adapter
  });
  const productOutcome = await adapter.productOutcome(cases[mode].analysisId);
  const websiteOutcome = await adapter.websiteOutcome(cases[mode].analysisId);
  const reconstruction = await adapter.reconstructWebsiteCognition({ episodeId: cases[mode].analysisId });
  const verification = await adapter.verify();
  const status = await adapter.status();
  const evidence = {
    schemaVersion: "1.0",
    recordType: "KATHERINE_REVISION_24_AUTHENTIC_OFFLINE_PRODUCT_EPISODE",
    mode,
    analysisId: cases[mode].analysisId,
    requestSha256: sha256(Buffer.from(stableObjectJson(cases[mode]), "utf8")),
    responseSha256: sha256(Buffer.from(stableObjectJson(result.payload), "utf8")),
    customerArtifact: {
      identifiedItem: result.report.identifiedItem || "",
      identificationConfidence: result.report.identificationConfidence || "",
      optimizedListingTitle: result.report.optimizedListingTitle || "",
      valuationEvidenceState: result.report.valuationEvidenceState || "",
      fairValueNotEstablished: result.report.fairValueNotEstablished || "",
      pricingConfidence: result.report.pricingConfidence || "",
      whatIsKnown: result.report.whatIsKnown || [],
      whatIsStillUnknown: result.report.whatIsStillUnknown || []
    },
    productOutcome: productOutcome && {
      episodeId: productOutcome.episode_id,
      episodeSequence: productOutcome.episode_sequence,
      outcomeId: productOutcome.outcome_id,
      responseHash: productOutcome.response_hash,
      memoryTransitionHash: productOutcome.memory_transition_hash
    },
    websiteOutcome: websiteOutcome && {
      websiteOutcomeId: websiteOutcome.websiteOutcomeId,
      terminalKind: websiteOutcome.artifact.terminalKind,
      statusCode: websiteOutcome.artifact.statusCode,
      cognitiveDisposition: websiteOutcome.artifact.cognitiveDisposition
    },
    reconstruction: {
      result: reconstruction.result,
      cognitiveDisposition: reconstruction.cognitiveDisposition,
      candidateOriginated: reconstruction.candidateOriginated,
      lessonCandidateCount: reconstruction.lessonCandidates.length,
      lessonGateReviewCount: reconstruction.lessonGateReviews.length
    },
    governedStore: { verification, status },
    execution: {
      schemas: result.metadata.schemas,
      providerStages: result.metadata.providerStages,
      finalizerExecutions: result.metadata.finalizerExecutions,
      unexpectedNodeNetworkAttempts: [...networkGuard.attempts, ...result.metadata.unexpectedNodeNetworkAttempts]
    },
    externalEffects: { network: 0, providerCalls: 0, spendingUsd: 0 }
  };
  if (evidence.execution.unexpectedNodeNetworkAttempts.length !== 0) {
    throw new Error("Hard network denial observed an attempted network call.");
  }
  const source = `${stableObjectJson(evidence)}\n`;
  await mkdir(path.dirname(path.resolve(evidencePath)), { recursive: true });
  await writeFile(path.resolve(evidencePath), source, { flag: "wx", mode: 0o600 });
  process.stdout.write(`${stableObjectJson({
    result: "AUTHENTIC_OFFLINE_PRODUCT_EPISODE_RECORDED",
    mode,
    analysisId: cases[mode].analysisId,
    evidencePath: path.resolve(evidencePath),
    evidenceSha256: sha256(Buffer.from(source, "utf8")),
    reconstruction: evidence.reconstruction,
    eventCount: verification.eventCount,
    networkAttempts: 0
  })}\n`);
  }
} finally {
  networkGuard.restore();
}
