import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, open, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const executionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const repositoryRoot = path.resolve(executionRoot, "..", "..");
export const benchmarkRoot = path.join(repositoryRoot, "benchmarks", "blind-object-v1");
export const HISTORICAL_PRODUCT_COMMIT = "a4a7214f612314977b8ffd30743b336820fd9372";
export const PRODUCT_COMMIT = HISTORICAL_PRODUCT_COMMIT;
export const BENCHMARK_COMMIT = "3449f9a1a29b98b7422710f9e967770d0655b38c";
export const CORPUS_SHA256 = "c22c99f25da2b8bc8a4e032734b1857c82c5bfaf1951ec160b018eb7df5b2853";
export const CONTRACT_SHA256 = "3ca09be6507ea22478446db09d066117e020d89a02b8dfc08561bc3f6cba2b6f";
export const HISTORICAL_RESULT_LOCATION = "benchmarks/blind-object-v1-results/current-a4a7214";
export const RUN_COUNT = 26;

export const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};

export const stableJson = (value) => JSON.stringify(canonical(value));
export const sha256Bytes = (value) => createHash("sha256").update(value).digest("hex");
export const sha256Json = (value) => sha256Bytes(Buffer.from(stableJson(value), "utf8"));
export const hashWithoutField = (record, field) => {
  const copy = structuredClone(record);
  delete copy[field];
  return sha256Json(copy);
};

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeDurableExclusive(filePath, bytes) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const handle = await open(filePath, "wx");
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function writeJsonExclusive(filePath, value) {
  await writeDurableExclusive(filePath, Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"));
}

export async function makeReadOnly(filePath) {
  await chmod(filePath, 0o444);
}

export function resolveExecutorCommit({ syntheticCommit } = {}) {
  if (syntheticCommit) {
    assert.match(syntheticCommit, /^[a-f0-9]{40}$/);
    return syntheticCommit;
  }
  const commit = execFileSync(
    "git",
    ["log", "-1", "--format=%H", "--", "benchmarks/blind-object-v1-execution-v1/EXECUTOR_FREEZE.json"],
    { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }
  ).trim();
  assert.match(commit, /^[a-f0-9]{40}$/, "executor package must be committed before a real run");
  return commit;
}

export async function loadRunPlan() {
  return readJson(path.join(executionRoot, "run-plan.json"));
}

function purposeRequestFields(purpose) {
  if (purpose === "MARKETPLACE_LISTING") {
    return { reportType: "listing", sellerIntake: { purchase_intent: "seller_listing" } };
  }
  const purchaseIntent = {
    PERSONAL_BUY: "personal_use",
    RESALE: "resale",
    WHATS_IT_WORTH: "owner_value"
  }[purpose];
  assert.ok(purchaseIntent, `unsupported purpose ${purpose}`);
  return { reportType: "marketValue", buyerIntake: { purchase_intent: purchaseIntent } };
}

function opaqueImageId(assetPath) {
  return path.basename(assetPath, path.extname(assetPath)).toUpperCase();
}

async function resizeCaseImages(caseRecord, manifestByPath, page) {
  const inputs = [];
  for (const assetPath of caseRecord.images) {
    const manifestRecord = manifestByPath.get(assetPath);
    assert.ok(manifestRecord, `manifest record missing for ${assetPath}`);
    const bytes = await readFile(path.join(benchmarkRoot, assetPath));
    assert.equal(sha256Bytes(bytes), manifestRecord.sha256, `asset hash mismatch for ${assetPath}`);
    inputs.push({
      imageId: opaqueImageId(assetPath),
      name: `${opaqueImageId(assetPath)}.jpg`,
      sourceSha256: manifestRecord.sha256,
      dataUrl: `data:image/jpeg;base64,${bytes.toString("base64")}`
    });
  }

  return page.evaluate(async ({ images }) => {
    const MAX_TOTAL = 240000;
    const MAX_DIMENSION = 1400;
    const MIN_DIMENSION = 240;
    const INITIAL_QUALITY = 0.82;
    const MIN_QUALITY = 0.42;
    const byteLength = (dataUrl) => {
      const encoded = String(dataUrl || "").split(",", 2)[1] || "";
      const padding = encoded.endsWith("==") ? 2 : encoded.endsWith("=") ? 1 : 0;
      return Math.max(0, Math.floor(encoded.length * 3 / 4) - padding);
    };
    const loadImage = (src) => new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("image_decode_failed"));
      image.src = src;
    });
    const output = [];
    let remainingBytes = MAX_TOTAL;
    for (let index = 0; index < images.length; index += 1) {
      const input = images[index];
      const budget = Math.max(1, Math.floor(remainingBytes / (images.length - index)));
      const image = await loadImage(input.dataUrl);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("canvas_unavailable");
      let targetDimension = Math.max(MIN_DIMENSION, Math.min(MAX_DIMENSION, Math.max(image.width, image.height)));
      let candidate = "";
      while (targetDimension >= MIN_DIMENSION) {
        const scale = Math.min(1, targetDimension / Math.max(image.width, image.height));
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        for (let quality = INITIAL_QUALITY; quality >= MIN_QUALITY - 0.001; quality -= 0.08) {
          candidate = canvas.toDataURL("image/jpeg", Math.max(MIN_QUALITY, quality));
          if (byteLength(candidate) <= budget) break;
        }
        if (byteLength(candidate) <= budget) break;
        if (targetDimension === MIN_DIMENSION) throw new Error("image_too_large");
        targetDimension = Math.max(MIN_DIMENSION, Math.floor(targetDimension * 0.8));
      }
      const processedBytes = byteLength(candidate);
      if (!candidate || processedBytes <= 0 || processedBytes > budget) throw new Error("image_processing_failed");
      remainingBytes -= processedBytes;
      output.push({ ...input, dataUrl: candidate, processedBytes });
    }
    return output;
  }, { images: inputs });
}

export async function prepareRequestTemplates() {
  const [plan, inputCases, manifest] = await Promise.all([
    loadRunPlan(),
    readJson(path.join(benchmarkRoot, "input-cases.json")),
    readJson(path.join(benchmarkRoot, "manifest.json"))
  ]);
  assert.equal(plan.runs.length, RUN_COUNT);
  assert.equal(manifest.corpusHash, CORPUS_SHA256);
  const caseById = new Map(inputCases.cases.map((entry) => [entry.caseId, entry]));
  const manifestByPath = new Map(manifest.assets.map((entry) => [entry.path, entry]));
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  let networkRequestCount = 0;
  try {
    const page = await browser.newPage();
    await page.route("**/*", async (route) => {
      const url = route.request().url();
      if (!url.startsWith("data:") && url !== "about:blank") networkRequestCount += 1;
      await route.abort();
    });
    await page.setContent("<!doctype html><meta charset=utf-8><title>offline image preparation</title>");
    const processedByCase = new Map();
    for (const run of plan.runs) {
      if (processedByCase.has(run.caseId)) continue;
      const caseRecord = caseById.get(run.caseId);
      assert.ok(caseRecord, `missing case ${run.caseId}`);
      processedByCase.set(run.caseId, await resizeCaseImages(caseRecord, manifestByPath, page));
    }
    assert.equal(networkRequestCount, 0, "request preparation must not use the network");
    const templates = plan.runs.map((run) => {
      const caseRecord = caseById.get(run.caseId);
      const photos = processedByCase.get(run.caseId);
      const handlerBody = {
        analysisId: `blind-object-v1-${run.runId.toLowerCase()}`,
        platform: "",
        notes: caseRecord.description,
        photos: photos.map((photo) => ({ name: photo.name, dataUrl: photo.dataUrl })),
        ...purposeRequestFields(run.purpose)
      };
      return {
        schemaVersion: 1,
        runId: run.runId,
        objectId: run.caseId,
        runType: run.runType,
        purpose: run.purpose,
        lane: caseRecord.lane,
        images: caseRecord.images.map((assetPath) => ({
          imageId: opaqueImageId(assetPath),
          sha256: manifestByPath.get(assetPath).sha256
        })),
        description: caseRecord.description,
        handlerRequest: {
          method: "POST",
          url: "/api/generate-listing",
          headers: { "content-type": "application/json" },
          body: handlerBody
        }
      };
    });
    return {
      templates,
      loadedBenchmarkFiles: ["input-cases.json", "manifest.json", "assets/*"],
      privateAnswerMaterialLoaded: false,
      networkRequestCount,
      providerCallCount: 0,
      productHandlerCallCount: 0
    };
  } finally {
    await browser.close();
  }
}

export function assertRequestRecord(record, { expectedProductCommit = "" } = {}) {
  const required = ["schemaVersion","runId","objectId","runType","purpose","lane","images","description","requestTimestamp","productCommit","benchmarkCommit","executorCommit","handlerRequest","requestSha256"];
  assert.deepEqual(Object.keys(record).sort(), required.sort());
  assert.equal(record.schemaVersion, 1);
  assert.match(record.runId, /^RUN-\d{3}$/);
  assert.match(record.objectId, /^OBJ-\d{3}$/);
  assert.ok(["PRINCIPAL", "ANCHOR_PURPOSE"].includes(record.runType));
  assert.ok(["PERSONAL_BUY", "RESALE", "WHATS_IT_WORTH", "MARKETPLACE_LISTING"].includes(record.purpose));
  assert.ok(["PHOTO_ONLY", "PHOTO_PLUS_VISIBLE_MARKINGS", "BARCODE_OR_MODEL"].includes(record.lane));
  assert.ok(Array.isArray(record.images) && record.images.length > 0);
  for (const image of record.images) {
    assert.deepEqual(Object.keys(image).sort(), ["imageId", "sha256"]);
    assert.match(image.imageId, /^OBJ-\d{3}-[A-Z]$/);
    assert.match(image.sha256, /^[a-f0-9]{64}$/);
  }
  assert.match(record.productCommit, /^[a-f0-9]{40}$/);
  if (expectedProductCommit) assert.equal(record.productCommit, expectedProductCommit);
  assert.equal(record.benchmarkCommit, BENCHMARK_COMMIT);
  assert.match(record.executorCommit, /^[a-f0-9]{40}$/);
  assert.equal(record.handlerRequest.method, "POST");
  assert.equal(record.handlerRequest.url, "/api/generate-listing");
  assert.match(record.requestSha256, /^[a-f0-9]{64}$/);
  assert.equal(hashWithoutField(record, "requestSha256"), record.requestSha256);
  return true;
}

export function assertResponseRecord(record) {
  const required = ["schemaVersion","runId","objectId","requestSha256","handlerStatus","startTimestamp","endTimestamp","elapsedMilliseconds","rawHandlerBodyBase64","rawProductResponse","customerFacingReport","providerAndSearchErrors","providerCallCounts","evidenceRecords","sourceUrls","responseSha256"];
  const optional = ["governorProof", "cognitiveEpisode", "lessonCandidate", "experienceRecord"];
  assert.deepEqual(Object.keys(record).filter((key) => !optional.includes(key)).sort(), required.sort());
  assert.equal(record.schemaVersion, 1);
  assert.match(record.runId, /^RUN-\d{3}$/);
  assert.match(record.objectId, /^OBJ-\d{3}$/);
  assert.match(record.requestSha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isInteger(record.handlerStatus.statusCode));
  assert.ok(Number.isFinite(record.elapsedMilliseconds) && record.elapsedMilliseconds >= 0);
  assert.ok(Array.isArray(record.providerAndSearchErrors));
  assert.ok(Array.isArray(record.evidenceRecords));
  assert.ok(Array.isArray(record.sourceUrls));
  assert.match(record.responseSha256, /^[a-f0-9]{64}$/);
  assert.equal(hashWithoutField(record, "responseSha256"), record.responseSha256);
  return true;
}

export function walkValues(value, visitor, pathParts = []) {
  visitor(value, pathParts);
  if (Array.isArray(value)) value.forEach((entry, index) => walkValues(entry, visitor, [...pathParts, String(index)]));
  else if (value && typeof value === "object") {
    for (const [key, entry] of Object.entries(value)) walkValues(entry, visitor, [...pathParts, key]);
  }
}

export function extractResponseMetadata(productResponse) {
  const urls = new Set();
  const errors = [];
  const evidence = [];
  const counts = {};
  walkValues(productResponse, (value, parts) => {
    const key = parts.at(-1) || "";
    if (typeof value === "string") {
      for (const match of value.matchAll(/https?:\/\/[^\s\]})>,"']+/g)) urls.add(match[0]);
      if (/error|failure/i.test(parts.join(".")) && value.trim()) errors.push({ path: parts.join("."), value });
    }
    if (typeof value === "number" && /(?:provider|serper|search|directPage).*(?:call|attempt)/i.test(key)) counts[parts.join(".")] = value;
    if (value && typeof value === "object" && !Array.isArray(value) && /(evidence|result|comparable|source)/i.test(parts.join("."))) evidence.push(value);
  });
  return { sourceUrls: [...urls].sort(), providerAndSearchErrors: errors, providerCallCounts: counts, evidenceRecords: evidence };
}

export async function loadLocalSecretValues() {
  const values = new Set();
  for (const name of ["OPENAI_API_KEY", "OPEN_API_KEY", "SERPER_API_KEY"]) {
    const value = String(process.env[name] || "").trim();
    if (value.length >= 12) values.add(value);
  }
  const envPath = path.join(repositoryRoot, ".env");
  try {
    for (const line of (await readFile(envPath, "utf8")).split(/\r?\n/)) {
      const match = line.match(/^\s*(OPENAI_API_KEY|OPEN_API_KEY|SERPER_API_KEY)\s*=\s*(.*)\s*$/);
      if (match && match[2].trim().length >= 12) values.add(match[2].trim());
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  return [...values];
}

export function assertNoSecretMaterial(value, knownSecretValues = []) {
  const rendered = stableJson(value);
  assert.doesNotMatch(rendered, /"(?:authorization|api[_-]?key|access[_-]?token|client[_-]?secret)"\s*:/i, "credential-bearing field found in result material");
  assert.doesNotMatch(rendered, /\bBearer\s+[A-Za-z0-9._~+\/-]{12,}|\bsk-[A-Za-z0-9_-]{20,}\b/i, "credential signature found in result material");
  for (const secret of knownSecretValues) assert.equal(rendered.includes(secret), false, "known local credential value found in result material");
  return true;
}

export async function listFilesRecursive(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) output.push(...await listFilesRecursive(absolute));
    else output.push(absolute);
  }
  return output.sort();
}
