import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { resolveApprovedCredential } from "../calibration/scripts/real-route-credential.mjs";
import {
  RESPONSE_FIELDS,
  buildV4Request,
  createV4ProviderClient,
  providerAccounting,
  runRoot,
  seal,
  sha256Json,
  stableJson,
  validateAndNormalizeV4Response,
  writeExclusiveBytes,
  writeExclusiveJson
} from "./v4-runtime.mjs";

const preflightRoot = path.join(runRoot, "preflight");
const syntheticCase = Object.freeze({
  caseId: "SYNTHETIC-PREFLIGHT",
  sequencePosition: 0,
  publicInput: Object.freeze({
    caseTitle: "Synthetic Schema Handshake",
    missionBrief: "Confirm that a closed structured response can be returned without any real-world action.",
    establishedHistory: Object.freeze([{ id: "S01", statement: "The handshake is complete only when every required field is returned." }]),
    currentObservations: Object.freeze([{ id: "S02", statement: "No external action, lookup, or hidden material is needed." }]),
    evidencePacket: Object.freeze([{ id: "S03", statement: "Use only S01 through S03 and keep every narrative answer to one short sentence." }]),
    authorization: Object.freeze({ currentlyAuthorized: Object.freeze(["Return the synthetic structured response"]), explicitlyProhibited: Object.freeze(["Perform any external action"]) }),
    requestedDecision: "Return all required fields with caseId SYNTHETIC-PREFLIGHT, evidenceReferences [S01, S02, S03], and concise synthetic text.",
    classificationStandard: Object.freeze([{ ruleId: "SYN-01", code: "SYNTHETIC_SCHEMA_HANDSHAKE", boundary: "Use for this schema-only handshake." }])
  })
});
const syntheticDecisionStandard = Object.freeze({
  responseInterface: Object.freeze({ instruction: "Return every named field using the supplied schema." }),
  evidenceDiscipline: Object.freeze({ boundary: "Use only S01, S02, and S03." }),
  authorizationDiscipline: Object.freeze({ boundary: "Do not perform or recommend external action." })
});

async function main() {
  await mkdir(preflightRoot, { recursive: false });
  const built = buildV4Request({
    publicCase: syntheticCase,
    decisionStandard: syntheticDecisionStandard,
    responseContract: RESPONSE_FIELDS,
    maximumOutputTokens: 500,
    syntheticPreflight: true
  });
  await writeExclusiveBytes(path.join(preflightRoot, "request-envelope.json"), Buffer.from(built.serializedRequest, "utf8"));
  await writeExclusiveJson(path.join(preflightRoot, "request-identity.json"), seal({
    schemaVersion: "1.0",
    identityType: "V4_SCHEMA_PREFLIGHT_REQUEST_IDENTITY",
    requestHash: built.requestHash,
    requestByteCount: built.requestByteCount,
    schemaHash: sha256Json(built.schema),
    maximumOutputTokens: 500,
    model: "gpt-5.6-sol",
    frozenCaseContentBytes: 0,
    evaluatorContentBytes: 0
  }, "identityHash"));
  const credentialHandle = await resolveApprovedCredential();
  await writeExclusiveJson(path.join(preflightRoot, "credential-access-receipt.json"), seal({
    schemaVersion: "1.0",
    receiptType: "V4_SCHEMA_PREFLIGHT_CREDENTIAL_ACCESS",
    accessedAt: new Date().toISOString(),
    approvedAdapter: "resolveApprovedCredential",
    credentialPresent: credentialHandle.present,
    credentialValueInspected: false,
    credentialValuePrinted: false,
    credentialValuePersisted: false,
    credentialValueHashed: false
  }, "receiptHash"));
  assert.equal(credentialHandle.present, true, "V4_PREFLIGHT_CREDENTIAL_UNAVAILABLE");
  let capture = null;
  const { client, profile } = await createV4ProviderClient({ credentialHandle, onCapture: async (value) => { capture = value; } });
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(profile.timeoutMs, 10 * 60 * 1000));
  try {
    const response = await client.decisionTurn({
      serializedRequest: built.serializedRequest,
      requestHash: built.requestHash,
      providerAttemptIdentity: "v4-schema-preflight-attempt-001",
      signal: controller.signal
    });
    assert.ok(capture, "V4_PREFLIGHT_RAW_RESPONSE_NOT_CAPTURED");
    await writeExclusiveBytes(path.join(preflightRoot, "raw-provider-response.json"), capture.bytes);
    const normalized = validateAndNormalizeV4Response(response.actionCore, { caseId: syntheticCase.caseId });
    const accounting = providerAccounting({ usage: response.usage, serializedRequestByteCount: built.requestByteCount, maximumOutputTokens: 500, pricing: profile.pricing });
    const result = seal({
      schemaVersion: "1.0",
      resultType: "V4_FINAL_RESPONSE_SCHEMA_PROVIDER_PREFLIGHT",
      status: "PASSED",
      requestOrdinal: 1,
      finalRequest: true,
      schemaCorrectionUsed: false,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      requestHash: built.requestHash,
      requestByteCount: built.requestByteCount,
      responseHash: response.safeResponseHash,
      structuredResponseHash: response.actionCoreHash,
      normalizedStructuredResponseHash: sha256Json(normalized),
      rawResponseByteCount: capture.byteCount,
      rawResponseSha256: capture.sha256,
      completeRawResponseCaptured: true,
      providerResponseId: response.providerResponseId,
      providerRequestId: response.providerRequestId,
      httpStatus: response.safeResponseEvidence.httpStatus,
      modelId: response.modelId,
      responseStatus: response.responseStatus,
      responseFieldCount: Object.keys(normalized).length,
      responseFields: Object.keys(normalized),
      usage: response.usage,
      accounting,
      evaluatorProviderRequests: 0,
      KatherineQualificationSlotsConsumed: 0,
      frozenCaseContentBytes: 0,
      evaluatorContentBytes: 0
    }, "preflightResultHash");
    await writeExclusiveJson(path.join(preflightRoot, "preflight-result.json"), result);
    process.stdout.write(`${stableJson({ status: result.status, requestOrdinal: 1, preflightResultHash: result.preflightResultHash, rawResponseByteCount: result.rawResponseByteCount, costUsd: accounting.conservativeAccountedCostUsd })}\n`);
  } catch (error) {
    if (capture) await writeExclusiveBytes(path.join(preflightRoot, "raw-provider-response.json"), capture.bytes);
    const failure = seal({
      schemaVersion: "1.0",
      resultType: "V4_FINAL_RESPONSE_SCHEMA_PROVIDER_PREFLIGHT_FAILURE",
      status: "FAILED",
      requestOrdinal: 1,
      startedAt,
      failedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      requestHash: built.requestHash,
      errorName: error?.name || "Error",
      errorCode: error?.code || "UNCLASSIFIED",
      httpStatus: error?.httpStatus ?? null,
      structuredOutputCompatibilityFailure: error?.httpStatus === 400 && /schema|structured/i.test(String(error?.message || "")),
      rawResponseCaptured: Boolean(capture),
      rawResponseByteCount: capture?.byteCount || 0,
      rawResponseSha256: capture?.sha256 || null,
      credentialValuePersisted: false
    }, "preflightFailureHash");
    await writeExclusiveJson(path.join(preflightRoot, "preflight-failure.json"), failure);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

await main();
