import assert from "node:assert/strict";
import { lstat, readFile } from "node:fs/promises";
import path from "node:path";
import { validateZeroExternalSupersessionReceipt } from "./pre-external-recovery-protocol.mjs";
import { validateTerminalFailureReceipt } from "./post-handler-reconciliation-protocol.mjs";
import { sha256Bytes, sha256Json } from "./protocol.mjs";
import {
  benchmarkRoot,
  defaultResultHistoryRoot,
  readJsonStrictFile,
  writeExclusiveSynced
} from "./execution-store.mjs";
import {
  VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH,
  VERSION_1_12_23_QUALIFICATION_HEAD,
  VERSION_1_12_23_RUNTIME_HEAD,
  validateVersion1123FailureEvidence
} from "./version1123-failure-evidence.mjs";

export const VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH = "ed569a1af04bb87e1de1ae4c32eb02719f84bd1b1e861cb55611b28e43ad7013";
export const VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH = "a80e7e763bb15ff399392be4c3a9cebbd4fb9a7b85622a9c14e4653742473294";
export const VERSION_1_12_22_RUNTIME_HEAD = "5ac7b85ee8f3888ccda1d4725c0eebfa5d8b1f62";
export const VERSION_1_12_22_QUALIFICATION_HEAD = "acf1b356bb851f41aac4f2ee40ee3e55ec9de2d1";
export const VERSION_1_12_21_ZERO_EXTERNAL_SUPERSESSION_RECEIPT_HASH = "684d208b4be3a002a5eabcb7f997cf4eb0af18c37f0d7bd33617248cdb3da81d";
export const VERSION_1_12_21_TERMINAL_FAILURE_RECEIPT_HASH = "f5534106a7857f919d174adc5b9d39697d8380842f9a0564e88177d0a76257fc";

export const UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY = Object.freeze({
  authorityType: "FIXED_UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY",
  sourceConsentFileSha256: "9ff6b1759d0a6baf80952bed1fcb785906c763ec7f14d2adb49fe9a0403173ea",
  sourceConsentBytes: 5410,
  sourceConsentId: "consent-4ccd259de4ab835833dffe3274f5b0bf0b8b507359a5665f",
  sourceConsentHash: "c083f16dad6167f0bc71ff988b575892bb8a4ba0e86a651ac62d45f33c3b13fd",
  sourceConsentReceiptHash: "77de3ff185b6f1616e99c5e3be145785fdacff6a16a7c9107fd206a360462fc5",
  sourceConsentStatus: "AUTHORIZED_NOT_CONSUMED",
  sourceLaunchScopeHash: "37b2de49739b3035d601fb8ae4c654911bc78d260c0515eb2e72d1b49601cbd1",
  sourceInvocationId: "invocation-d846737e000388d55c3049a94e34dfce6ecf5fce81538b96",
  sourceReservationId: "reservation-5c909aa203ed20c30b0efb684e85fd219604f458e80c2f10",
  sourceResultId: "result-de48bd3707ad264b3df9dae338d64e5031884a5f57664d04",
  sourceResultRootName: "result-root-6efaa2da5e4a226c5d6a0c102cdae8ad81c76aaf72fbce95",
  sourceExecutionReleaseRecordHash: VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH,
  sourceExecutorRuntimeHead: VERSION_1_12_22_RUNTIME_HEAD,
  sourceQualificationHead: VERSION_1_12_22_QUALIFICATION_HEAD,
  sourceExecutorVersion: "1.12.22"
});

export const UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH = sha256Json(UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY);
export const UNUSED_VERSION_1_12_22_CONSENT_PATH = path.join(benchmarkRoot, "consent", `${UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY.sourceConsentId}.json`);
export const UNUSED_VERSION_1_12_22_CONSENT_REVOCATION_PATH = path.join(defaultResultHistoryRoot, ".consent-revocations", `${UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY.sourceConsentId}.json`);

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;

async function exists(target) {
  try {
    return await lstat(target);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function assertCanonicalIso(value, label) {
  assert.equal(new Date(value).toISOString(), value, `${label} must be canonical ISO UTC`);
}

export function validateUnusedV11222ConsentBytes(bytes) {
  assert.ok(Buffer.isBuffer(bytes), "unused Version 1.12.22 consent must be read as bytes");
  assert.equal(bytes.length, UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY.sourceConsentBytes, "unused Version 1.12.22 consent byte count differs");
  assert.equal(sha256Bytes(bytes), UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY.sourceConsentFileSha256, "unused Version 1.12.22 consent bytes differ");
  const consent = JSON.parse(bytes.toString("utf8"));
  const authority = UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY;
  assert.equal(consent.schemaVersion, "4.0");
  assert.equal(consent.receiptType, "BENCHMARK_EXECUTION_CONSENT");
  assert.equal(consent.consentId, authority.sourceConsentId);
  assert.equal(consent.consentHash, authority.sourceConsentHash);
  assert.equal(consent.receiptHash, authority.sourceConsentReceiptHash);
  assert.equal(consent.status, authority.sourceConsentStatus);
  assert.equal(consent.launchScopeHash, authority.sourceLaunchScopeHash);
  assert.equal(consent.invocationId, authority.sourceInvocationId);
  assert.equal(consent.reservationId, authority.sourceReservationId);
  assert.equal(consent.resultId, authority.sourceResultId);
  assert.equal(consent.resultRootName, authority.sourceResultRootName);
  assert.equal(consent.executionReleaseRecordHash, authority.sourceExecutionReleaseRecordHash);
  assert.equal(consent.executorRuntimeHead, authority.sourceExecutorRuntimeHead);
  assert.equal(consent.qualificationHead, authority.sourceQualificationHead);
  assert.equal(consent.executorVersion, authority.sourceExecutorVersion);
  assert.equal(consent.statusTransitions.length, 1);
  assert.equal(consent.statusJournalHash, sha256Json(consent.statusTransitions));
  const immutable = structuredClone(consent);
  for (const field of ["status", "statusTransitions", "statusJournalHash", "consentHash", "receiptHash"]) delete immutable[field];
  assert.equal(sha256Json(immutable), consent.consentHash, "unused Version 1.12.22 consent immutable hash differs");
  const receiptCore = structuredClone(consent);
  delete receiptCore.receiptHash;
  assert.equal(sha256Json(receiptCore), consent.receiptHash, "unused Version 1.12.22 consent receipt hash differs");
  return Object.freeze(consent);
}

function validateCurrentReleaseIdentity(releaseIdentity) {
  assert.equal(releaseIdentity?.executorVersion, "1.12.24");
  assert.match(releaseIdentity?.executionReleaseRecordHash || "", HASH);
  assert.match(releaseIdentity?.executorRuntimeHead || "", COMMIT);
  assert.match(releaseIdentity?.qualificationHead || "", COMMIT);
  assert.equal(releaseIdentity.executionReleaseRecordHash, releaseIdentity.release?.recordHash, "current release identity hash differs from its sealed record");
  const releaseCore = structuredClone(releaseIdentity.release); delete releaseCore.recordHash;
  assert.equal(sha256Json(releaseCore), releaseIdentity.release.recordHash, "current sealed release record hash differs");
  assert.equal(releaseIdentity.executorRuntimeHead, releaseIdentity.release.executorRuntimeHead);
  assert.equal(releaseIdentity.executorRuntimeTreeHash, releaseIdentity.release.executorRuntimeTreeHash);
  assert.equal(releaseIdentity.executorVersion, releaseIdentity.release.executorVersion);
  assert.equal(releaseIdentity?.release?.predecessorExecutionReleaseRecordHash, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(releaseIdentity?.release?.historicalExecutionReleaseRecordHash, VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(releaseIdentity?.release?.version1122ExecutionReleaseRecordHash, VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(releaseIdentity?.release?.unusedConsentAuthorityHash, UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH);
  assert.equal(releaseIdentity?.release?.historicalZeroExternalSupersessionReceiptHash, VERSION_1_12_21_ZERO_EXTERNAL_SUPERSESSION_RECEIPT_HASH);
  assert.equal(releaseIdentity?.release?.historicalTerminalFailureReceiptHash, VERSION_1_12_21_TERMINAL_FAILURE_RECEIPT_HASH);
  assert.deepEqual(
    Object.keys(releaseIdentity.release).filter((field) => /predecessor.*execution.*release.*hash/i.test(field)),
    ["predecessorExecutionReleaseRecordHash"],
    "current release must contain one unambiguous predecessor reference"
  );
  return releaseIdentity;
}

export function createUnusedV11222ConsentRevocationReceipt({ consentBytes, releaseIdentity, revokedAt }) {
  const consent = validateUnusedV11222ConsentBytes(consentBytes);
  validateCurrentReleaseIdentity(releaseIdentity);
  assertCanonicalIso(revokedAt, "unused consent revocation time");
  const identityHash = sha256Json({
    receiptType: "VERSION_1_12_22_UNUSED_CONSENT_REVOCATION",
    sourceConsentHash: consent.consentHash,
    successorExecutionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash
  });
  const core = {
    schemaVersion: "1.0",
    receiptType: "VERSION_1_12_22_UNUSED_CONSENT_REVOCATION",
    receiptId: `consent-revocation-${identityHash.slice(0, 48)}`,
    authorityHash: UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH,
    sourceConsentFileSha256: UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY.sourceConsentFileSha256,
    sourceConsentBytes: UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY.sourceConsentBytes,
    sourceConsentId: consent.consentId,
    sourceConsentHash: consent.consentHash,
    sourceConsentReceiptHash: consent.receiptHash,
    sourceConsentStatus: consent.status,
    sourceLaunchScopeHash: consent.launchScopeHash,
    sourceInvocationId: consent.invocationId,
    sourceReservationId: consent.reservationId,
    sourceResultId: consent.resultId,
    sourceResultRootName: consent.resultRootName,
    sourceExecutionReleaseRecordHash: consent.executionReleaseRecordHash,
    sourceExecutorRuntimeHead: consent.executorRuntimeHead,
    sourceQualificationHead: consent.qualificationHead,
    sourceExecutorVersion: consent.executorVersion,
    successorExecutionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash,
    successorExecutorRuntimeHead: releaseIdentity.executorRuntimeHead,
    successorQualificationHead: releaseIdentity.qualificationHead,
    successorExecutorVersion: releaseIdentity.executorVersion,
    disposition: "SUPERSEDED_UNUSED_WITHOUT_CONSUMPTION",
    invocationArtifactCreated: false,
    reservationArtifactCreated: false,
    resultArtifactCreated: false,
    resultRootCreated: false,
    consentConsumed: false,
    consentReusePermitted: false,
    evidenceMode: "APPEND_ONLY_RECEIPT_SOURCE_CONSENT_BYTES_UNCHANGED",
    revokedAt
  };
  return Object.freeze({ ...core, receiptHash: sha256Json(core) });
}

export function validateUnusedV11222ConsentRevocationReceipt(receipt, { releaseIdentity = null } = {}) {
  const expectedFields = [
    "schemaVersion", "receiptType", "receiptId", "authorityHash", "sourceConsentFileSha256", "sourceConsentBytes",
    "sourceConsentId", "sourceConsentHash", "sourceConsentReceiptHash", "sourceConsentStatus", "sourceLaunchScopeHash",
    "sourceInvocationId", "sourceReservationId", "sourceResultId", "sourceResultRootName", "sourceExecutionReleaseRecordHash",
    "sourceExecutorRuntimeHead", "sourceQualificationHead", "sourceExecutorVersion", "successorExecutionReleaseRecordHash",
    "successorExecutorRuntimeHead", "successorQualificationHead", "successorExecutorVersion", "disposition",
    "invocationArtifactCreated", "reservationArtifactCreated", "resultArtifactCreated", "resultRootCreated", "consentConsumed",
    "consentReusePermitted", "evidenceMode", "revokedAt", "receiptHash"
  ];
  assert.deepEqual(Object.keys(receipt || {}).sort(), expectedFields.sort(), "unused consent revocation receipt fields differ");
  assert.equal(receipt.schemaVersion, "1.0");
  assert.equal(receipt.receiptType, "VERSION_1_12_22_UNUSED_CONSENT_REVOCATION");
  assert.match(receipt.receiptId || "", /^consent-revocation-[a-f0-9]{48}$/);
  const authority = UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY;
  for (const [field, value] of Object.entries({
    authorityHash: UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY_HASH,
    sourceConsentFileSha256: authority.sourceConsentFileSha256,
    sourceConsentBytes: authority.sourceConsentBytes,
    sourceConsentId: authority.sourceConsentId,
    sourceConsentHash: authority.sourceConsentHash,
    sourceConsentReceiptHash: authority.sourceConsentReceiptHash,
    sourceConsentStatus: authority.sourceConsentStatus,
    sourceLaunchScopeHash: authority.sourceLaunchScopeHash,
    sourceInvocationId: authority.sourceInvocationId,
    sourceReservationId: authority.sourceReservationId,
    sourceResultId: authority.sourceResultId,
    sourceResultRootName: authority.sourceResultRootName,
    sourceExecutionReleaseRecordHash: authority.sourceExecutionReleaseRecordHash,
    sourceExecutorRuntimeHead: authority.sourceExecutorRuntimeHead,
    sourceQualificationHead: authority.sourceQualificationHead,
    sourceExecutorVersion: authority.sourceExecutorVersion
  })) assert.equal(receipt[field], value, `unused consent revocation ${field} differs`);
  assert.equal(receipt.successorExecutorVersion, "1.12.23");
  assert.equal(receipt.successorExecutionReleaseRecordHash, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH);
  assert.equal(receipt.successorExecutorRuntimeHead, VERSION_1_12_23_RUNTIME_HEAD);
  assert.equal(receipt.successorQualificationHead, VERSION_1_12_23_QUALIFICATION_HEAD);
  assert.equal(receipt.disposition, "SUPERSEDED_UNUSED_WITHOUT_CONSUMPTION");
  for (const field of ["invocationArtifactCreated", "reservationArtifactCreated", "resultArtifactCreated", "resultRootCreated", "consentConsumed", "consentReusePermitted"]) assert.equal(receipt[field], false);
  assert.equal(receipt.evidenceMode, "APPEND_ONLY_RECEIPT_SOURCE_CONSENT_BYTES_UNCHANGED");
  assertCanonicalIso(receipt.revokedAt, "unused consent revocation time");
  const identityHash = sha256Json({ receiptType: receipt.receiptType, sourceConsentHash: receipt.sourceConsentHash, successorExecutionReleaseRecordHash: receipt.successorExecutionReleaseRecordHash });
  assert.equal(receipt.receiptId, `consent-revocation-${identityHash.slice(0, 48)}`);
  const core = structuredClone(receipt);
  delete core.receiptHash;
  assert.equal(sha256Json(core), receipt.receiptHash, "unused consent revocation receipt hash differs");
  if (releaseIdentity) {
    assert.equal(releaseIdentity.executorVersion, "1.12.23", "the immutable revocation receipt can bind only its Version 1.12.23 successor");
    assert.equal(receipt.successorExecutionReleaseRecordHash, releaseIdentity.executionReleaseRecordHash);
  }
  return Object.freeze({ valid: true, receiptId: receipt.receiptId, receiptHash: receipt.receiptHash });
}

export function validateContinuationReleaseChain({ releaseIdentity, zeroExternalSupersessionReceipt, terminalFailureReceipt, unusedConsentRevocationReceipt, version1123FailureEvidence }) {
  validateCurrentReleaseIdentity(releaseIdentity);
  validateVersion1123FailureEvidence(version1123FailureEvidence);
  validateZeroExternalSupersessionReceipt(zeroExternalSupersessionReceipt, {
    successorExecutionReleaseRecordHash: VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH,
    successorExecutorRuntimeHead: "017f65678ef9d0606c47451dfb0b655f856e2bbd",
    successorQualificationHead: "5ac4e65b82b83f74331d1571009eb24a08809d2e",
    successorExecutorVersion: "1.12.21",
    receiptHash: VERSION_1_12_21_ZERO_EXTERNAL_SUPERSESSION_RECEIPT_HASH
  });
  validateTerminalFailureReceipt(terminalFailureReceipt, {
    successorExecutionReleaseRecordHash: VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH,
    successorExecutorRuntimeHead: VERSION_1_12_22_RUNTIME_HEAD,
    successorQualificationHead: VERSION_1_12_22_QUALIFICATION_HEAD,
    successorExecutorVersion: "1.12.22",
    receiptHash: VERSION_1_12_21_TERMINAL_FAILURE_RECEIPT_HASH
  });
  validateUnusedV11222ConsentRevocationReceipt(unusedConsentRevocationReceipt);
  assert.notEqual(VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH, VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH);
  assert.notEqual(VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH, VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH);
  assert.notEqual(VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH, releaseIdentity.executionReleaseRecordHash);
  return Object.freeze({
    valid: true,
    version1121ExecutionReleaseRecordHash: VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH,
    version1122ExecutionReleaseRecordHash: VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH,
    version1123ExecutionReleaseRecordHash: VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH,
    version1123FailureEvidenceHash: version1123FailureEvidence.evidenceHash,
    version1124ExecutionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash,
    releaseChainHash: sha256Json({
      version1121ExecutionReleaseRecordHash: VERSION_1_12_21_EXECUTION_RELEASE_RECORD_HASH,
      zeroExternalSupersessionReceiptHash: zeroExternalSupersessionReceipt.receiptHash,
      version1122ExecutionReleaseRecordHash: VERSION_1_12_22_EXECUTION_RELEASE_RECORD_HASH,
      terminalFailureReceiptHash: terminalFailureReceipt.receiptHash,
      unusedConsentRevocationReceiptHash: unusedConsentRevocationReceipt.receiptHash,
      version1123ExecutionReleaseRecordHash: VERSION_1_12_23_EXECUTION_RELEASE_RECORD_HASH,
      version1123FailureEvidenceHash: version1123FailureEvidence.evidenceHash,
      version1124ExecutionReleaseRecordHash: releaseIdentity.executionReleaseRecordHash
    })
  });
}

async function assertUnusedConsentHasNoDownstreamArtifacts() {
  const authority = UNUSED_VERSION_1_12_22_CONSENT_AUTHORITY;
  const forbidden = [
    path.join(defaultResultHistoryRoot, ".reservations", `${authority.sourceInvocationId}.json`),
    path.join(defaultResultHistoryRoot, authority.sourceResultRootName),
    path.join(defaultResultHistoryRoot, `.${authority.sourceInvocationId}.invocation-manifest.json`)
  ];
  for (const target of forbidden) assert.equal(await exists(target), null, `unused Version 1.12.22 consent has a forbidden downstream artifact: ${target}`);
}

export async function revokeUnusedV11222Consent({ releaseIdentity, revokedAt = new Date().toISOString() }) {
  assert.equal(releaseIdentity?.release?.authorityDeclarations?.unusedConsentRevocationEnabled, true, "unused Version 1.12.22 consent revocation is disabled");
  assert.equal(await exists(UNUSED_VERSION_1_12_22_CONSENT_REVOCATION_PATH), null, "unused Version 1.12.22 consent revocation receipt already exists");
  await assertUnusedConsentHasNoDownstreamArtifacts();
  const consentBytes = await readFile(UNUSED_VERSION_1_12_22_CONSENT_PATH);
  const receipt = createUnusedV11222ConsentRevocationReceipt({ consentBytes, releaseIdentity, revokedAt });
  await writeExclusiveSynced(UNUSED_VERSION_1_12_22_CONSENT_REVOCATION_PATH, receipt);
  const readback = await readJsonStrictFile(UNUSED_VERSION_1_12_22_CONSENT_REVOCATION_PATH);
  validateUnusedV11222ConsentRevocationReceipt(readback, { releaseIdentity });
  assert.deepEqual(readback, receipt);
  validateUnusedV11222ConsentBytes(await readFile(UNUSED_VERSION_1_12_22_CONSENT_PATH));
  await assertUnusedConsentHasNoDownstreamArtifacts();
  return Object.freeze(readback);
}

export async function loadUnusedV11222ConsentRevocationReceipt(releaseIdentity) {
  validateUnusedV11222ConsentBytes(await readFile(UNUSED_VERSION_1_12_22_CONSENT_PATH));
  await assertUnusedConsentHasNoDownstreamArtifacts();
  const receipt = await readJsonStrictFile(UNUSED_VERSION_1_12_22_CONSENT_REVOCATION_PATH);
  validateUnusedV11222ConsentRevocationReceipt(receipt);
  return Object.freeze(receipt);
}
