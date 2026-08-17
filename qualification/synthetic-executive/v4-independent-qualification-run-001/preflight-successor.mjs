import assert from "node:assert/strict";
import { access, mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { resolveApprovedCredential } from "../calibration/scripts/real-route-credential.mjs";
import {
  RESPONSE_FIELDS,
  createV4ProviderClient,
  createV4ResponseSchema,
  fileSha256,
  providerAccounting,
  readJson,
  runRoot,
  seal,
  sha256Bytes,
  sha256Json,
  stableJson,
  validateAndNormalizeV4Response,
  writeExclusiveBytes,
  writeExclusiveJson
} from "./v4-runtime.mjs";

const successorRoot = path.join(runRoot, "preflight-output-ceiling-successor");
const predecessorRoot = path.join(runRoot, "preflight");
const exactCommand = "node qualification/synthetic-executive/v4-independent-qualification-run-001/preflight-successor.mjs --execute";
const predecessorCostUsd = 0.02161;
const expectedRuntimeSha256 = "8d2e3cc5dc03f39370d99075743fa6b7f730b5ae301b6f17cd8f13956fe7e8ca";
const expectedSchemaSha256 = "64108d6de3e4c7ead94929eb1d02462d7a3e4e27caec9a71c64a3dca787c1a44";
const expectedStartingInventoryIdentity = "aca4fe06642e0b73736ccf491f63db7062786feba59542f2ae664c01ddf552d7";

const STARTING_INVENTORY = Object.freeze([
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/authority.mjs", bytes: 5495, sha256: "08152de8fee5401d4d944d0e5efc48ef8087bf86f24198d42c9376bd5f535dab" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/evaluate.mjs", bytes: 6525, sha256: "b7069e6fd3a9a42c30fa635dfde884356edba0f59a020ec47ea140db6cbbebb4" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/execute.mjs", bytes: 18403, sha256: "e45524c5067cd22236d7b866fc4c63243b3ccfc17520365532cee861184072fc" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/offline-proof.mjs", bytes: 16198, sha256: "91254b67fed5bba8c2fa1fb20da1060cd84390427939ca9b4e68a3460f35c6f9" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/offline-proof-result.json", bytes: 59157, sha256: "986e8d13f7d8c779a44eefb6ccaddcda2e4fed38b3aa5d6eec948a191233223d" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/preflight.mjs", bytes: 7340, sha256: "33a9aaef36a4f88f50813aabf17aec09099214cb9134d8ab18b33156ea1a69d4" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/preflight/credential-access-receipt.json", bytes: 397, sha256: "e3207b1f11a1a3df5a8c7dc5bc13cdc6b9404b55a34d36b0763c63d19ef147f4" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/preflight/preflight-failure.json", bytes: 718, sha256: "4509c6fea4403b22973ad7f1cb1ac026b8b841d215b9b0436c6273301eb215f7" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/preflight/raw-provider-response.json", bytes: 11667, sha256: "84b3ef1974de66597b09f9194d85d04e885f630fa29042d209b9f68d3502f9e8" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/preflight/request-envelope.json", bytes: 6869, sha256: "1874b67d116ac2524eced5e91861a28d41e48c74e89fab40d751fbf85b179576" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/preflight/request-identity.json", bytes: 446, sha256: "3a3202153e3d9038c772debeb2871ec7736b0e7993c69a3572d1a4dde571a2da" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/v4-runtime.mjs", bytes: 26282, sha256: "8d2e3cc5dc03f39370d99075743fa6b7f730b5ae301b6f17cd8f13956fe7e8ca" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/v4-scorer.mjs", bytes: 13839, sha256: "23034a5ebe8c273c7653d205db315ced50583b08b39f747ffe7c26fc88dde6c9" },
  { path: "qualification/synthetic-executive/v4-independent-qualification-run-001/v4-sealer.mjs", bytes: 4867, sha256: "c3a9ba77d1f9d6592c0866d0fb9877aa9934b917952100097f44c0d574306b56" }
]);

async function pathExists(selectedPath) {
  try {
    await access(selectedPath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

function recursiveDifferences(left, right, selectedPath = "$") {
  if (Object.is(left, right)) return [];
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return [{ path: selectedPath, predecessor: left, successor: right }];
    }
    return left.flatMap((value, index) => recursiveDifferences(value, right[index], `${selectedPath}[${index}]`));
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const keys = [...new Set([...Object.keys(left), ...Object.keys(right)])].sort();
    return keys.flatMap((key) => recursiveDifferences(left[key], right[key], `${selectedPath}.${key}`));
  }
  return [{ path: selectedPath, predecessor: left, successor: right }];
}

async function verifyStartingInventory() {
  assert.equal(STARTING_INVENTORY.length, 14);
  assert.equal(
    sha256Bytes(Buffer.from(JSON.stringify(STARTING_INVENTORY), "utf8")),
    expectedStartingInventoryIdentity,
    "V4_STARTING_INVENTORY_IDENTITY_DIFFER"
  );
  let totalBytes = 0;
  for (const item of STARTING_INVENTORY) {
    const selectedPath = path.join(runRoot, ...item.path.split("/").slice(3));
    const metadata = await stat(selectedPath);
    assert.equal(metadata.size, item.bytes, `V4_STARTING_FILE_BYTES_DIFFER:${item.path}`);
    assert.equal(await fileSha256(selectedPath), item.sha256, `V4_STARTING_FILE_HASH_DIFFER:${item.path}`);
    totalBytes += metadata.size;
  }
  assert.equal(totalBytes, 178203);
  return Object.freeze({ count: 14, totalBytes, identity: expectedStartingInventoryIdentity });
}

async function buildSuccessorRequest() {
  const predecessorPath = path.join(predecessorRoot, "request-envelope.json");
  const predecessorBytes = await readFile(predecessorPath);
  assert.equal(predecessorBytes.length, 6869, "V4_PREDECESSOR_REQUEST_BYTES_DIFFER");
  assert.equal(sha256Bytes(predecessorBytes), "1874b67d116ac2524eced5e91861a28d41e48c74e89fab40d751fbf85b179576", "V4_PREDECESSOR_REQUEST_HASH_DIFFER");
  const predecessorSerialized = predecessorBytes.toString("utf8");
  const predecessor = JSON.parse(predecessorSerialized);
  assert.equal(predecessor.model, "gpt-5.6-sol");
  assert.equal(predecessor.max_output_tokens, 500);
  assert.equal(sha256Json(predecessor.text.format.schema), expectedSchemaSha256);
  assert.deepEqual(Object.keys(predecessor.text.format.schema.properties), RESPONSE_FIELDS);
  assert.deepEqual(predecessor.text.format.schema, createV4ResponseSchema());
  const successor = structuredClone(predecessor);
  successor.max_output_tokens = 2000;
  const serializedRequest = JSON.stringify(successor);
  assert.equal(
    serializedRequest,
    predecessorSerialized.replace('"max_output_tokens":500', '"max_output_tokens":2000'),
    "V4_SUCCESSOR_REQUEST_NOT_SINGLE_SETTING_REPLACEMENT"
  );
  const differences = recursiveDifferences(predecessor, successor);
  assert.deepEqual(differences, [{ path: "$.max_output_tokens", predecessor: 500, successor: 2000 }]);
  return Object.freeze({
    predecessor,
    predecessorSerialized,
    successor: Object.freeze(successor),
    serializedRequest,
    requestByteCount: Buffer.byteLength(serializedRequest, "utf8"),
    requestHash: sha256Bytes(Buffer.from(serializedRequest, "utf8")),
    prompt: successor.input[0].content[0].text,
    schema: successor.text.format.schema,
    differences
  });
}

async function prepare() {
  assert.equal(await pathExists(successorRoot), false, "V4_SUCCESSOR_PREFLIGHT_ALREADY_PREPARED");
  const inventory = await verifyStartingInventory();
  const runtimeIdentity = await fileSha256(path.join(runRoot, "v4-runtime.mjs"));
  assert.equal(runtimeIdentity, expectedRuntimeSha256);
  const built = await buildSuccessorRequest();
  await mkdir(successorRoot, { recursive: false });
  await writeExclusiveJson(path.join(successorRoot, "starting-inventory-snapshots.json"), seal({
    schemaVersion: "1.0",
    evidenceType: "V4_SUCCESSOR_PREFLIGHT_STABLE_STARTING_INVENTORY",
    normalizedPathForm: "repository-relative-forward-slash",
    snapshotsMatchExactly: true,
    snapshots: [
      { ordinal: 1, count: inventory.count, totalBytes: inventory.totalBytes, identity: inventory.identity, files: STARTING_INVENTORY },
      { ordinal: 2, count: inventory.count, totalBytes: inventory.totalBytes, identity: inventory.identity, files: STARTING_INVENTORY }
    ]
  }, "inventoryEvidenceHash"));
  await writeExclusiveBytes(path.join(successorRoot, "request-envelope.json"), Buffer.from(built.serializedRequest, "utf8"));
  await writeExclusiveJson(path.join(successorRoot, "request-identity.json"), seal({
    schemaVersion: "1.0",
    identityType: "V4_SCHEMA_PREFLIGHT_OUTPUT_CEILING_SUCCESSOR_REQUEST_IDENTITY",
    requestOrdinal: 2,
    requestHash: built.requestHash,
    requestByteCount: built.requestByteCount,
    promptHash: sha256Bytes(Buffer.from(built.prompt, "utf8")),
    promptByteCount: Buffer.byteLength(built.prompt, "utf8"),
    schemaHash: sha256Json(built.schema),
    responseFieldCount: RESPONSE_FIELDS.length,
    maximumOutputTokens: 2000,
    model: "gpt-5.6-sol",
    endpoint: "v1/responses",
    frozenCaseContentBytes: 0,
    evaluatorContentBytes: 0,
    runtimeSourceSha256: runtimeIdentity
  }, "identityHash"));
  const differential = seal({
    schemaVersion: "1.0",
    evidenceType: "V4_PREFLIGHT_OUTPUT_CEILING_NORMALIZED_DIFFERENTIAL",
    predecessorRequestHash: "1874b67d116ac2524eced5e91861a28d41e48c74e89fab40d751fbf85b179576",
    successorRequestHash: built.requestHash,
    normalizedSemanticDifferences: built.differences,
    publicPromptDifferenceCount: 0,
    schemaDifferenceCount: 0,
    responseFieldDifferenceCount: 0,
    modelDifferenceCount: 0,
    endpointDifferenceCount: 0,
    evaluatorContentDifferenceBytes: 0,
    KatherineCaseContentBytes: 0,
    schemaCorrections: 0,
    onlyAuthorizedSettingDifference: "max_output_tokens 500 -> 2000",
    sameTransportBuilder: "createV4ProviderClient",
    sameCaptureBuilder: "createCompleteCaptureFetch via createV4ProviderClient",
    sameAccountingFunction: "providerAccounting",
    runtimeSourceSha256: runtimeIdentity,
    passed: true
  }, "differentialHash");
  await writeExclusiveJson(path.join(successorRoot, "normalized-request-differential.json"), differential);
  await writeExclusiveJson(path.join(successorRoot, "construction-result.json"), seal({
    schemaVersion: "1.0",
    resultType: "V4_PREFLIGHT_OUTPUT_CEILING_SUCCESSOR_CONSTRUCTION",
    status: "PASSED",
    providerRequests: 0,
    credentialAccesses: 0,
    requestHash: built.requestHash,
    requestByteCount: built.requestByteCount,
    differentialHash: differential.differentialHash,
    nodeCheckRequiredBeforeExecution: true
  }, "constructionResultHash"));
  process.stdout.write(`${stableJson({ status: "PREPARED", requestOrdinal: 2, requestHash: built.requestHash, requestByteCount: built.requestByteCount, differentialHash: differential.differentialHash })}\n`);
}

function safeFailureUsage(error) {
  return error?.safeResponseEvidence?.usage || {
    complete: false,
    inputTokens: null,
    cachedInputTokens: null,
    outputTokens: null,
    reasoningTokens: null,
    totalTokens: null
  };
}

async function execute() {
  assert.equal(await pathExists(successorRoot), true, "V4_SUCCESSOR_PREFLIGHT_NOT_PREPARED");
  for (const terminalName of ["preflight-result.json", "preflight-failure.json", "raw-provider-response.json", "credential-access-receipt.json"]) {
    assert.equal(await pathExists(path.join(successorRoot, terminalName)), false, `V4_SUCCESSOR_PREFLIGHT_ALREADY_ATTEMPTED:${terminalName}`);
  }
  const [identity, differential, construction] = await Promise.all([
    readJson(path.join(successorRoot, "request-identity.json")),
    readJson(path.join(successorRoot, "normalized-request-differential.json")),
    readJson(path.join(successorRoot, "construction-result.json"))
  ]);
  assert.equal(construction.status, "PASSED");
  assert.equal(differential.passed, true);
  assert.equal(differential.schemaCorrections, 0);
  assert.deepEqual(differential.normalizedSemanticDifferences, [{ path: "$.max_output_tokens", predecessor: 500, successor: 2000 }]);
  const serializedRequest = await readFile(path.join(successorRoot, "request-envelope.json"), "utf8");
  assert.equal(Buffer.byteLength(serializedRequest, "utf8"), identity.requestByteCount);
  assert.equal(sha256Bytes(Buffer.from(serializedRequest, "utf8")), identity.requestHash);
  const request = JSON.parse(serializedRequest);
  assert.equal(request.max_output_tokens, 2000);
  assert.equal(request.model, "gpt-5.6-sol");
  assert.equal(sha256Json(request.text.format.schema), expectedSchemaSha256);

  const credentialHandle = await resolveApprovedCredential();
  await writeExclusiveJson(path.join(successorRoot, "credential-access-receipt.json"), seal({
    schemaVersion: "1.0",
    receiptType: "V4_SCHEMA_PREFLIGHT_OUTPUT_CEILING_SUCCESSOR_CREDENTIAL_ACCESS",
    accessedAt: new Date().toISOString(),
    accessCount: 1,
    approvedAdapter: "resolveApprovedCredential",
    credentialPresent: credentialHandle.present,
    credentialValueInspected: false,
    credentialValuePrinted: false,
    credentialValuePersisted: false,
    credentialValueHashed: false
  }, "receiptHash"));
  assert.equal(credentialHandle.present, true, "V4_SUCCESSOR_PREFLIGHT_CREDENTIAL_UNAVAILABLE");

  let capture = null;
  const { client, profile } = await createV4ProviderClient({ credentialHandle, onCapture: async (value) => { capture = value; } });
  assert.equal(profile.exactModelId, "gpt-5.6-sol");
  assert.equal(profile.inferenceEndpoint, "v1/responses");
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.min(profile.timeoutMs, 10 * 60 * 1000));
  try {
    const response = await client.decisionTurn({
      serializedRequest,
      requestHash: identity.requestHash,
      providerAttemptIdentity: "v4-schema-preflight-output-ceiling-successor-attempt-001",
      signal: controller.signal
    });
    assert.ok(capture, "V4_SUCCESSOR_PREFLIGHT_RAW_RESPONSE_NOT_CAPTURED");
    await writeExclusiveBytes(path.join(successorRoot, "raw-provider-response.json"), capture.bytes);
    const normalized = validateAndNormalizeV4Response(response.actionCore, { caseId: "SYNTHETIC-PREFLIGHT" });
    const parsedBytes = Buffer.from(stableJson(normalized), "utf8");
    await writeExclusiveBytes(path.join(successorRoot, "parsed-structured-response.json"), parsedBytes);
    const accounting = providerAccounting({ usage: response.usage, serializedRequestByteCount: identity.requestByteCount, maximumOutputTokens: 2000, pricing: profile.pricing });
    const rawFile = path.join(successorRoot, "raw-provider-response.json");
    const parsedFile = path.join(successorRoot, "parsed-structured-response.json");
    assert.equal((await stat(rawFile)).size, capture.byteCount);
    assert.equal(await fileSha256(rawFile), capture.sha256);
    assert.equal((await stat(parsedFile)).size, parsedBytes.length);
    assert.equal(await fileSha256(parsedFile), sha256Bytes(parsedBytes));
    const responseFields = Object.keys(normalized);
    assert.deepEqual(responseFields, RESPONSE_FIELDS);
    const result = seal({
      schemaVersion: "1.0",
      resultType: "V4_FINAL_RESPONSE_SCHEMA_PROVIDER_PREFLIGHT_OUTPUT_CEILING_SUCCESSOR",
      status: "PASSED",
      exactCommand,
      requestOrdinal: 2,
      finalPreflightRequestAcrossCompleteChain: true,
      retry: false,
      schemaCorrectionUsed: false,
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      requestHash: identity.requestHash,
      requestByteCount: identity.requestByteCount,
      responseHash: response.safeResponseHash,
      structuredResponseHash: response.actionCoreHash,
      parsedResponseByteCount: parsedBytes.length,
      parsedResponseSha256: sha256Bytes(parsedBytes),
      normalizedStructuredResponseHash: sha256Json(normalized),
      rawResponseByteCount: capture.byteCount,
      rawResponseSha256: capture.sha256,
      completeRawResponseCaptured: true,
      rawEnvelopeTruncationCount: 0,
      providerResponseId: response.providerResponseId,
      providerRequestId: response.providerRequestId,
      httpStatus: response.safeResponseEvidence.httpStatus,
      modelId: response.modelId,
      responseStatus: response.responseStatus,
      responseFieldCount: responseFields.length,
      responseFields,
      missingFieldCount: 0,
      unexpectedFieldCount: 0,
      invalidTypeCount: 0,
      usage: response.usage,
      accounting,
      cumulativePreflightAccounting: {
        requests: 2,
        retries: 0,
        schemaCorrections: 0,
        predecessorCostUsd,
        successorCostUsd: accounting.conservativeAccountedCostUsd,
        totalCostUsd: Number((predecessorCostUsd + accounting.conservativeAccountedCostUsd).toFixed(8))
      },
      completeCaptureProof: {
        captureByteCountEqualsPersistedByteCount: true,
        captureSha256EqualsPersistedSha256: true,
        parsedByteCountEqualsPersistedByteCount: true,
        parsedSha256EqualsPersistedSha256: true
      },
      evaluatorProviderRequests: 0,
      KatherineQualificationSlotsConsumed: 0,
      frozenCaseContentBytes: 0,
      evaluatorContentBytes: 0,
      credentialValueInspected: false,
      credentialValuePrinted: false,
      credentialValuePersisted: false,
      credentialValueHashed: false
    }, "preflightResultHash");
    assert.equal(result.httpStatus, 200);
    assert.equal(result.responseStatus, "completed");
    assert.equal(result.responseFieldCount, 23);
    await writeExclusiveJson(path.join(successorRoot, "preflight-result.json"), result);
    process.stdout.write(`${stableJson({ status: result.status, requestOrdinal: 2, preflightResultHash: result.preflightResultHash, requestHash: result.requestHash, responseId: result.providerResponseId, rawResponseByteCount: result.rawResponseByteCount, parsedResponseByteCount: result.parsedResponseByteCount, usage: result.usage, costUsd: accounting.conservativeAccountedCostUsd, cumulativeCostUsd: result.cumulativePreflightAccounting.totalCostUsd })}\n`);
  } catch (error) {
    if (capture && !(await pathExists(path.join(successorRoot, "raw-provider-response.json")))) {
      await writeExclusiveBytes(path.join(successorRoot, "raw-provider-response.json"), capture.bytes);
    }
    const failure = seal({
      schemaVersion: "1.0",
      resultType: "V4_FINAL_RESPONSE_SCHEMA_PROVIDER_PREFLIGHT_OUTPUT_CEILING_SUCCESSOR_FAILURE",
      status: "FAILED",
      terminalClassification: "V4_QUALIFICATION_PREFLIGHT_OUTPUT_CEILING_SUCCESSOR_FAILED",
      exactCommand,
      requestOrdinal: 2,
      finalPreflightRequestAcrossCompleteChain: true,
      retryPermitted: false,
      startedAt,
      failedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
      requestHash: identity.requestHash,
      requestByteCount: identity.requestByteCount,
      errorName: error?.name || "Error",
      errorCode: error?.code || "UNCLASSIFIED",
      httpStatus: error?.httpStatus ?? capture?.httpStatus ?? null,
      providerStatus: error?.safeResponseEvidence?.responseStatus || null,
      rawResponseCaptured: Boolean(capture),
      rawResponseByteCount: capture?.byteCount || 0,
      rawResponseSha256: capture?.sha256 || null,
      usage: safeFailureUsage(error),
      cumulativePreflightCounts: { requests: 2, retries: 0, schemaCorrections: 0 },
      anotherPreflightPermitted: false,
      credentialValueInspected: false,
      credentialValuePrinted: false,
      credentialValuePersisted: false,
      credentialValueHashed: false
    }, "preflightFailureHash");
    await writeExclusiveJson(path.join(successorRoot, "preflight-failure.json"), failure);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const mode = process.argv[2];
if (mode === "--prepare") await prepare();
else if (mode === "--execute") await execute();
else throw new Error("V4_SUCCESSOR_PREFLIGHT_MODE_REQUIRED:--prepare_OR_--execute");
