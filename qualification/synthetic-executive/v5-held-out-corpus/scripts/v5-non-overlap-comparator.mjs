import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { sha256Bytes, sha256Json } from "../../scripts/protocol.mjs";
import { V5_CASE_SPECS } from "./v5-case-definitions.mjs";
import { absoluteFromCorpus, repositoryRoot, writeStableJson } from "./v5-package-core.mjs";

const scriptPath = fileURLToPath(import.meta.url);
const PRIOR_PUBLIC_PATHS = Object.freeze([
  "qualification/synthetic-executive/episodes/public-manifest.json",
  "qualification/synthetic-executive/episodes/visible/**",
  "qualification/synthetic-executive/v2-held-out-corpus/cases/*/visible/**",
  "qualification/synthetic-executive/v3-held-out-corpus/cases/*/visible/**",
  "qualification/synthetic-executive/v4-held-out-corpus/cases/*/visible/**",
  "tests/governed-learning-adapter.test.mjs",
  "tests/governed-learning-product-handler.test.mjs",
  "tests/synthetic-executive-v4-cognitive-flow.test.mjs"
]);

function normalizeText(value) {
  return value.toLowerCase().replace(/ke-v[12345]-c\d+/g, "case-id").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function words(value) {
  return new Set(normalizeText(value).split(" ").filter((word) => word.length >= 3));
}

function jaccard(left, right) {
  const a = words(left);
  const b = words(right);
  if (a.size === 0 && b.size === 0) return 1;
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / new Set([...a, ...b]).size;
}

function stringsWithKey(value, keyPattern, result = []) {
  if (Array.isArray(value)) for (const item of value) stringsWithKey(item, keyPattern, result);
  else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === "string" && keyPattern.test(key)) result.push(item);
      stringsWithKey(item, keyPattern, result);
    }
  }
  return result;
}

function allStrings(value, result = []) {
  if (typeof value === "string") result.push(value);
  else if (Array.isArray(value)) for (const item of value) allStrings(item, result);
  else if (value && typeof value === "object") for (const item of Object.values(value)) allStrings(item, result);
  return result;
}

function layoutSignature(value, prefix = "$") {
  const paths = [];
  function visit(item, current) {
    if (Array.isArray(item)) {
      paths.push(`${current}[]`);
      if (item.length > 0) visit(item[0], `${current}[]`);
    } else if (item && typeof item === "object") {
      for (const key of Object.keys(item).sort()) {
        paths.push(`${current}.${key}`);
        visit(item[key], `${current}.${key}`);
      }
    } else paths.push(`${current}:${item === null ? "null" : typeof item}`);
  }
  visit(value, prefix);
  return sha256Json(paths);
}

function sentenceSet(values) {
  return new Set(values.flatMap((value) => String(value).split(/(?<=[.!?])\s+/))
    .map(normalizeText).filter((value) => value.length >= 48));
}

function trackedPriorPublicPaths() {
  const stdout = execFileSync("git", ["ls-files", "-z", "--", ...PRIOR_PUBLIC_PATHS], { cwd: repositoryRoot });
  return stdout.toString("utf8").split("\0").filter(Boolean).sort();
}

async function loadPriorPublic() {
  const result = [];
  for (const relativePath of trackedPriorPublicPaths()) {
    const bytes = await readFile(path.join(repositoryRoot, ...relativePath.split("/")));
    const text = bytes.toString("utf8");
    let json = null;
    try { json = JSON.parse(text); } catch { json = null; }
    result.push({ relativePath, bytes, text, json });
  }
  return result;
}

async function loadV5Visible() {
  const result = [];
  for (const spec of V5_CASE_SPECS) {
    const relativePaths = [
      `cases/${spec.id}/visible/evidence-bundle.json`,
      ...spec.artifacts.map((item) => `cases/${spec.id}/visible/artifacts/${item.fileName}`)
    ];
    for (const relativePath of relativePaths) {
      const bytes = await readFile(absoluteFromCorpus(...relativePath.split("/")));
      const text = bytes.toString("utf8");
      result.push({ relativePath, bytes, text, json: JSON.parse(text) });
    }
  }
  return result;
}

export async function buildV5NonOverlapProof() {
  const prior = await loadPriorPublic();
  const current = await loadV5Visible();
  const priorHashes = new Set(prior.map((item) => sha256Bytes(item.bytes)));
  const priorNormalizedHashes = new Set(prior.map((item) => sha256Bytes(Buffer.from(normalizeText(item.text)))));
  const exactHashCollisions = current.filter((item) => priorHashes.has(sha256Bytes(item.bytes))).map((item) => item.relativePath);
  const normalizedHashCollisions = current.filter((item) => priorNormalizedHashes.has(sha256Bytes(Buffer.from(normalizeText(item.text))))).map((item) => item.relativePath);

  const priorTitles = prior.flatMap((item) => item.json ? stringsWithKey(item.json, /title|scenario/i) : []);
  const currentTitles = V5_CASE_SPECS.map((spec) => spec.title);
  let maximumTitleSimilarity = 0;
  let maximumTitlePair = null;
  for (const left of currentTitles) for (const right of priorTitles) {
    const score = jaccard(left, right);
    if (score > maximumTitleSimilarity) {
      maximumTitleSimilarity = score;
      maximumTitlePair = { v5TitleSha256: sha256Bytes(Buffer.from(left)), priorTitleSha256: sha256Bytes(Buffer.from(right)) };
    }
  }

  const priorStrings = prior.flatMap((item) => item.json ? allStrings(item.json) : [item.text]);
  const currentStrings = current.flatMap((item) => allStrings(item.json));
  const priorSentences = sentenceSet(priorStrings);
  const sentenceOverlaps = [...sentenceSet(currentStrings)].filter((sentence) => priorSentences.has(sentence));
  const priorParagraphs = new Set(priorStrings.map(normalizeText).filter((value) => value.length >= 80));
  const paragraphOverlaps = [...new Set(currentStrings.map(normalizeText).filter((value) => value.length >= 80))].filter((value) => priorParagraphs.has(value));

  const priorIdentities = new Set(prior.flatMap((item) => item.json ? stringsWithKey(item.json, /(^|_)(id|identity)$/i) : []).filter((value) => value.length >= 6));
  const currentIdentities = new Set(current.flatMap((item) => stringsWithKey(item.json, /(^|_)(id|identity)$/i)).filter((value) => value.length >= 6));
  const artifactIdentityReuse = [...currentIdentities].filter((value) => priorIdentities.has(value));
  const priorErrors = new Set(prior.flatMap((item) => item.json ? stringsWithKey(item.json, /error|reason|failure/i) : []).map(normalizeText).filter((value) => value.length >= 8));
  const currentErrors = new Set(current.flatMap((item) => stringsWithKey(item.json, /error|reason|failure/i)).map(normalizeText).filter((value) => value.length >= 8));
  const exactErrorStringReuse = [...currentErrors].filter((value) => priorErrors.has(value));

  const actionPhrases = ["CLASSIFY_FAILURE", "DECLARE_RECURRENCE", "DECLARE_NOVEL_FAILURE", "DECLARE_INSUFFICIENT_EVIDENCE", "SELECT_NEXT_LEGAL_ACTION"];
  const expectedActionPhraseOccurrences = current.reduce((count, item) => count + actionPhrases.filter((phrase) => item.text.includes(phrase)).length, 0);
  const priorLayouts = new Set(prior.filter((item) => item.json).map((item) => layoutSignature(item.json)));
  const identicalEvidenceLayouts = current.filter((item) => priorLayouts.has(layoutSignature(item.json))).map((item) => item.relativePath);
  const priorSourceIdentities = new Set(prior.flatMap((item) => item.json ? stringsWithKey(item.json, /sourceKind|sourceIdentity/i) : []));
  const currentSourceIdentities = new Set(current.flatMap((item) => stringsWithKey(item.json, /sourceKind|sourceIdentity/i)));
  const copiedSourceIdentities = [...currentSourceIdentities].filter((value) => priorSourceIdentities.has(value));
  const orderLeakage = V5_CASE_SPECS.map((spec) => spec.id).some((caseId) => /KE-V[1234]-/.test(caseId));

  const failures = {
    exactFileHashes: exactHashCollisions,
    normalizedTextHashes: normalizedHashCollisions,
    titleSimilarityAtOrAbove072: maximumTitleSimilarity >= 0.72 ? [maximumTitlePair] : [],
    sentenceOverlap: sentenceOverlaps.map((value) => sha256Bytes(Buffer.from(value))),
    paragraphOverlap: paragraphOverlaps.map((value) => sha256Bytes(Buffer.from(value))),
    artifactIdentityReuse: artifactIdentityReuse.map((value) => sha256Bytes(Buffer.from(value))),
    exactErrorStringReuse: exactErrorStringReuse.map((value) => sha256Bytes(Buffer.from(value))),
    expectedActionPhrasingOccurrences: expectedActionPhraseOccurrences,
    identicalEvidenceLayouts,
    caseOrderLeakage: orderLeakage,
    copiedSourceIdentities
  };
  const pass = exactHashCollisions.length === 0
    && normalizedHashCollisions.length === 0
    && maximumTitleSimilarity < 0.72
    && sentenceOverlaps.length === 0
    && paragraphOverlaps.length === 0
    && artifactIdentityReuse.length === 0
    && exactErrorStringReuse.length === 0
    && expectedActionPhraseOccurrences === 0
    && identicalEvidenceLayouts.length === 0
    && orderLeakage === false
    && copiedSourceIdentities.length === 0;
  assert.equal(pass, true, `V5_NON_OVERLAP_COMPARATOR_FAILED:${JSON.stringify(failures)}`);
  return Object.freeze({
    schemaVersion: "1.0",
    proofType: "V5_DETERMINISTIC_PUBLIC_MATERIAL_NON_OVERLAP_PROOF",
    result: "PASS",
    terminalStatement: "V5_DETERMINISTIC_NON_OVERLAP_PROVEN_UNDER_RECORDED_COMPARATOR",
    priorPublicAndFixtureTrackedPathFilters: PRIOR_PUBLIC_PATHS,
    priorPublicFileCount: prior.length,
    v5VisibleFileCount: current.length,
    checks: {
      exactFileHashCollisionCount: 0,
      normalizedTextHashCollisionCount: 0,
      maximumCaseTitleJaccard: Number(maximumTitleSimilarity.toFixed(6)),
      sentenceOverlapCount: 0,
      paragraphOverlapCount: 0,
      artifactIdentityReuseCount: 0,
      exactErrorStringReuseCount: 0,
      expectedActionPhrasingOccurrenceCount: 0,
      identicalEvidenceLayoutCount: 0,
      caseOrderLeakage: false,
      copiedSourceIdentityCount: 0
    },
    comparatorSha256: sha256Bytes(await readFile(scriptPath)),
    boundedLimitations: [
      "The proof compares tracked public visible V1 through V4 material and the governed-learning integration fixtures selected by the recorded path filters.",
      "Text normalization, exact overlap, layout signatures, and title similarity do not establish absolute semantic independence.",
      "No prior hidden evaluator control, scoring evidence, or answer material is read."
    ]
  });
}

export async function writeV5NonOverlapProof() {
  const proof = await buildV5NonOverlapProof();
  await writeStableJson(absoluteFromCorpus("proofs", "v1-v2-v3-v4-learning-fixtures-non-overlap.json"), proof);
  return proof;
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const proof = await writeV5NonOverlapProof();
  process.stdout.write(`${JSON.stringify({ result: proof.result, terminalStatement: proof.terminalStatement, checks: proof.checks })}\n`);
}
