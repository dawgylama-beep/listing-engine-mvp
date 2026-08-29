import assert from "node:assert/strict";
import {
  createHash,
  generateKeyPairSync,
  sign
} from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { GovernedLearningAdapter } from "../lib/cognitive-learning/adapter.js";
import {
  PINNED_INDEPENDENT_EVALUATOR_AUTHORITY,
  assertIndependentEvaluationReplaySafety,
  canonicalEvaluatorJson,
  verifyPinnedIndependentEvaluationBytes,
  verifyPinnedIndependentEvaluationRecord,
  verifyPinnedIndependentEvaluatorAuthority
} from "../lib/cognitive-learning/independent-evaluator-authority/verify.js";

const testRoot = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.join(testRoot, "fixtures", "independent-evaluator-public-authority");
const publicRoot = path.join(
  testRoot,
  "..",
  "lib",
  "cognitive-learning",
  "independent-evaluator-authority",
  "public"
);
const verificationTime = new Date("2026-08-30T00:00:00.000Z");

function hash(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function fixture(number = 1) {
  return readFile(path.join(fixtureRoot, `evaluation-sequence-${number}.json`));
}

function mutation(bytes, mutate, { recomputePayloadHash = false } = {}) {
  const value = JSON.parse(bytes.toString("utf8"));
  mutate(value);
  if (recomputePayloadHash) {
    const payload = structuredClone(value);
    delete payload.integrity;
    value.integrity.payloadSha256 = hash(Buffer.from(canonicalEvaluatorJson(payload), "utf8"));
  }
  return value;
}

function rejectsCode(action, code) {
  assert.throws(action, (error) => error?.code === code);
}

test("the pinned public trust root authenticates the exact authority package", () => {
  const verified = verifyPinnedIndependentEvaluatorAuthority({ verificationTime });
  assert.equal(verified.manifest.manifestId, PINNED_INDEPENDENT_EVALUATOR_AUTHORITY.manifestId);
  assert.equal(
    verified.manifest.integrity.manifestSha256,
    PINNED_INDEPENDENT_EVALUATOR_AUTHORITY.manifestSha256
  );
  assert.equal(verified.manifest.rubric.passThreshold, 0.7);
  assert.deepEqual(
    verified.manifest.rubric.dimensions,
    PINNED_INDEPENDENT_EVALUATOR_AUTHORITY.dimensions
  );
});

test("an authentic packaged conformance signature verifies only in conformance mode", async () => {
  const bytes = await fixture(1);
  const verified = verifyPinnedIndependentEvaluationBytes(bytes, {
    allowConformanceFixtures: true,
    verificationTime
  });
  assert.equal(verified.evaluationClass, "CONFORMANCE_FIXTURE");
  assert.equal(verified.result, "PASS");
  assert.equal(verified.authorityManifestSha256, PINNED_INDEPENDENT_EVALUATOR_AUTHORITY.manifestSha256);
  assert.equal(verified.sequence, 1);
  rejectsCode(
    () => verifyPinnedIndependentEvaluationBytes(bytes, { verificationTime }),
    "INDEPENDENT_EVALUATION_CONFORMANCE_FIXTURE_PROHIBITED"
  );
});

test("conformance fixtures cannot enter Katherine as product evaluations", async () => {
  const bytes = await fixture(1);
  const adapter = new GovernedLearningAdapter({
    root: path.join(testRoot, ".must-not-be-created"),
    learningScopeIdentity: "conformance-fixture-isolation"
  });
  await assert.rejects(adapter.recordWebsiteEvaluation({
    episodeId: "synthetic-conformance",
    productOutcomeId: "a".repeat(64),
    imageBytes: Buffer.alloc(1),
    evaluationBytes: bytes
  }), (error) => error?.code === "INDEPENDENT_EVALUATION_CONFORMANCE_FIXTURE_PROHIBITED");
});

test("unsigned legacy and caller-asserted evaluator authority fail closed", async () => {
  const unsigned = Buffer.from(JSON.stringify({
    schemaVersion: "1.0",
    recordType: "KATHERINE_INDEPENDENT_VISIBLE_OUTCOME_EVALUATION",
    evaluator: "CALLER_ASSERTED"
  }));
  rejectsCode(
    () => verifyPinnedIndependentEvaluationBytes(unsigned, { verificationTime }),
    "INDEPENDENT_EVALUATION_SCHEMA_INVALID"
  );
  const adapter = new GovernedLearningAdapter({
    root: path.join(testRoot, ".must-not-be-created-legacy"),
    learningScopeIdentity: "caller-asserted-authority-rejection"
  });
  await assert.rejects(adapter.recordWebsiteEvaluation({
    episodeId: "caller-asserted",
    productOutcomeId: "a".repeat(64),
    imageBytes: Buffer.alloc(1),
    evaluationBytes: unsigned,
    evaluatorIdentity: "b".repeat(64),
    evaluationAuthorityIdentity: "c".repeat(64)
  }), (error) => error?.code === "LEARNING_UNKNOWN_FIELD");
});

test("altered scores and every signed evidence or authority binding are rejected", async () => {
  const bytes = await fixture(1);
  const changes = [
    ["scores", (value) => { value.scores.identityAccuracy = 0; }],
    ["image", (value) => { value.bindings.image.sha256 = "f".repeat(64); }],
    ["request", (value) => { value.bindings.requestSha256 = "e".repeat(64); }],
    ["raw response", (value) => { value.bindings.rawResponseSha256 = "d".repeat(64); }],
    ["canonical response", (value) => { value.bindings.canonicalResponseHash = "c".repeat(64); }],
    ["evaluator", (value) => { value.evaluator.id = "SUBSTITUTED"; }],
    ["manifest", (value) => { value.authorityManifest.sha256 = "b".repeat(64); }],
    ["rubric", (value) => { value.rubric.sha256 = "a".repeat(64); }],
    ["product", (value) => { value.productBinding.commit = "9".repeat(40); }]
  ];
  for (const [name, mutate] of changes) {
    rejectsCode(
      () => verifyPinnedIndependentEvaluationRecord(mutation(bytes, mutate), {
        allowConformanceFixtures: true,
        verificationTime
      }),
      "INDEPENDENT_EVALUATION_PAYLOAD_HASH_MISMATCH",
      name
    );
  }
});

test("an altered signature and a self-authenticated untrusted key are rejected", async () => {
  const bytes = await fixture(1);
  const alteredSignature = mutation(bytes, (value) => {
    const signature = Buffer.from(value.integrity.signatureBase64, "base64");
    signature[0] ^= 0xff;
    value.integrity.signatureBase64 = signature.toString("base64");
  });
  rejectsCode(
    () => verifyPinnedIndependentEvaluationRecord(alteredSignature, {
      allowConformanceFixtures: true,
      verificationTime
    }),
    "INDEPENDENT_EVALUATION_SIGNATURE_INVALID"
  );

  const selfAuthenticated = mutation(bytes, (value) => {
    value.integrity.keyId = "CALLER-SELF-AUTHENTICATED-KEY";
  }, { recomputePayloadHash: true });
  const { privateKey } = generateKeyPairSync("ed25519");
  const payload = structuredClone(selfAuthenticated);
  delete payload.integrity;
  selfAuthenticated.integrity.signatureBase64 = sign(
    null,
    Buffer.from(canonicalEvaluatorJson(payload), "utf8"),
    privateKey
  ).toString("base64");
  rejectsCode(
    () => verifyPinnedIndependentEvaluationRecord(selfAuthenticated, {
      allowConformanceFixtures: true,
      verificationTime
    }),
    "INDEPENDENT_EVALUATION_KEY_UNTRUSTED"
  );
});

test("authenticated nonce replay and duplicate or backward sequence fail closed", async () => {
  const first = verifyPinnedIndependentEvaluationBytes(await fixture(1), {
    allowConformanceFixtures: true,
    verificationTime
  });
  const second = verifyPinnedIndependentEvaluationBytes(await fixture(2), {
    allowConformanceFixtures: true,
    verificationTime
  });
  assert.equal(assertIndependentEvaluationReplaySafety({ evaluation: first }), true);
  rejectsCode(() => assertIndependentEvaluationReplaySafety({
    evaluation: first,
    seenNonces: new Set([first.nonce]),
    highestSequence: 0
  }), "INDEPENDENT_EVALUATION_REPLAY");
  rejectsCode(() => assertIndependentEvaluationReplaySafety({
    evaluation: first,
    seenNonces: new Set([second.nonce]),
    highestSequence: second.sequence
  }), "INDEPENDENT_EVALUATION_DUPLICATE_SEQUENCE");
});

test("expired authority fails closed even for an otherwise authentic record", async () => {
  const bytes = await fixture(1);
  rejectsCode(
    () => verifyPinnedIndependentEvaluationBytes(bytes, {
      allowConformanceFixtures: true,
      verificationTime: new Date("2027-08-29T18:16:48.106Z")
    }),
    "INDEPENDENT_AUTHORITY_EXPIRED"
  );
});

test("committed trust artifacts have exact public hashes and contain no private key", async () => {
  const expected = new Map([
    ["authority-manifest.json", "0bcd544082d8aa1487fc76f9396bf63fb31e48557c7eabac4617cd86cc7e2a88"],
    ["authority-manifest.sig", "eeb7e06b2b783e8bedb63b065731d10b009be344911a0799fc76430b6b4b30ae"],
    ["public-key.pem", "5f7b05db0eafc0db660d8e116e2431c306525baf2a796d32a12b257dbb3b6f18"],
    ["public-package-manifest.json", "5f5a679f65e2e025b6a7b5589471f504e0f4a796355e018f90b7cd2180f76385"]
  ]);
  assert.deepEqual((await readdir(publicRoot)).sort(), [...expected.keys()].sort());
  const privateMarker = ["-----BEGIN", "PRIVATE", "KEY-----"].join(" ");
  for (const [name, expectedHash] of expected) {
    const bytes = await readFile(path.join(publicRoot, name));
    assert.equal(hash(bytes), expectedHash, name);
    assert.equal(bytes.includes(Buffer.from(privateMarker)), false, name);
  }
});
