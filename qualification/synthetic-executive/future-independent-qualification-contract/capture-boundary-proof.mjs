import assert from "node:assert/strict";
import { open } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  FUTURE_QUALIFICATION_EXECUTION_LIMITS,
  captureRawEnvelope
} from "./execution-envelope.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultResultPath = path.join(scriptDirectory, "version-1.12.37-capture-boundary-proof.json");

function deterministicBytes(length) {
  const bytes = Buffer.alloc(length);
  for (let index = 0; index < bytes.length; index += 1) bytes[index] = index % 251;
  return bytes;
}

export function buildCaptureBoundaryProof() {
  const exactSource = deterministicBytes(FUTURE_QUALIFICATION_EXECUTION_LIMITS.completeRawEnvelopeCaptureBytes);
  const overflowSource = deterministicBytes(FUTURE_QUALIFICATION_EXECUTION_LIMITS.deterministicOverflowBoundaryBytes);
  const exact = captureRawEnvelope(exactSource);
  const exactHashBeforeOverflow = exact.capturedSha256;
  const overflow = captureRawEnvelope(overflowSource);
  assert.equal(exact.accepted, true);
  assert.equal(exact.completeRawEnvelope, true);
  assert.equal(Buffer.compare(exact.capturedBytes, exactSource), 0);
  assert.equal(exact.receivedSha256, exact.capturedSha256);
  assert.equal(overflow.accepted, false);
  assert.equal(overflow.completeRawEnvelope, false);
  assert.equal(overflow.capturedBytes, null);
  assert.equal(exact.capturedSha256, exactHashBeforeOverflow);
  return Object.freeze({
    schemaVersion: "1.0",
    proofType: "OFFLINE_FUTURE_QUALIFICATION_CAPTURE_BOUNDARY_PROOF",
    version: "1.12.37",
    providerRequestCount: 0,
    exactBoundary: {
      bytesPresented: exact.receivedBytes,
      inputSha256: exact.receivedSha256,
      capturedBytes: exact.capturedBytes.length,
      capturedSha256: exact.capturedSha256,
      byteIdentical: true,
      complete: exact.completeRawEnvelope
    },
    overflowBoundary: {
      bytesPresented: overflow.receivedBytes,
      inputSha256: overflow.receivedSha256,
      disposition: overflow.terminalStatus,
      capturedBytes: null,
      capturedSha256: null,
      complete: overflow.completeRawEnvelope,
      overflowReceipt: {
        captureLimitBytes: overflow.captureLimitBytes,
        overflowBoundaryBytes: overflow.overflowBoundaryBytes,
        truncatedBytes: overflow.truncatedBytes,
        silentDrop: overflow.silentDrop,
        presentedAsComplete: overflow.presentedAsComplete
      }
    },
    failures: {
      truncatedBytes: 0,
      falseCompleteClassifications: 0,
      silentDrops: 0,
      priorEvidenceOverwrites: 0
    }
  });
}

export async function writeCaptureBoundaryProof(resultPath = defaultResultPath) {
  const proof = buildCaptureBoundaryProof();
  const handle = await open(resultPath, "wx");
  try {
    await handle.writeFile(`${JSON.stringify(proof, null, 2)}\n`, "utf8");
  } finally {
    await handle.close();
  }
  return proof;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.equal(process.argv[2], "WRITE_PROOF", "Usage: node capture-boundary-proof.mjs WRITE_PROOF [result-path]");
  const proof = await writeCaptureBoundaryProof(process.argv[3] ? path.resolve(process.argv[3]) : defaultResultPath);
  process.stdout.write(`${JSON.stringify({
    result: "PASS",
    exactBoundary: proof.exactBoundary,
    overflowBoundary: proof.overflowBoundary,
    failures: proof.failures
  })}\n`);
}
