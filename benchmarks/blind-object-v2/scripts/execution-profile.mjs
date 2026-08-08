import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import { sha256Bytes, sha256Json } from "./protocol.mjs";
import {
  EXECUTION_MODE,
  EXECUTOR_VERSION,
  FIXED_ENVIRONMENT_ALLOWLIST,
  PRODUCT_SOURCE_HEAD,
  PRODUCT_SOURCE_VERSION,
  calculateCompleteAttemptCeiling,
  createExecutionProfile,
  validateAttemptCeiling
} from "./execution-protocol.mjs";
import { repositoryRoot } from "./execution-store.mjs";

const COMMIT = /^[a-f0-9]{40}$/;

function git(args, cwd = repositoryRoot) {
  return execFileSync("git", args, { cwd, encoding: "utf8", windowsHide: true }).trim();
}

export function auditFrozenProductProviderSurface(sourceText) {
  assert.equal(typeof sourceText, "string");
  const exactCount = (pattern) => [...sourceText.matchAll(pattern)].length;
  const inventory = {
    totalFetchSites: exactCount(/\bfetch\s*\(/g),
    openAiResponsesFetchSites: exactCount(/fetch\("https:\/\/api\.openai\.com\/v1\/responses"/g),
    serperFetchSites: exactCount(/fetch\(`https:\/\/google\.serper\.dev\/\$\{endpointPath\}`/g),
    boundedDirectPageFetchSites: exactCount(/fetch\(finalCandidate,/g),
    objectIdentityModelSites: exactCount(/schemaName:\s*"item_identity"/g),
    listingFinalModelSites: exactCount(/schemaName:\s*"marketplace_listing"/g),
    valuationFinalModelSites: exactCount(/schemaName:\s*"market_value_report"/g),
    acquisitionBudgetConstructors: exactCount(/createPhysicalAttemptBudget\(/g),
    physicalAttemptConsumers: exactCount(/consumePhysicalAttempt\(/g),
    serperRetryBoundary: exactCount(/maxRetries\s*=\s*1/g),
    openAiWebRetryBoundary: exactCount(/for\s*\(let attempt = 0; attempt <= 1; attempt \+= 1\)/g),
    retailCeilingLiteral: exactCount(/maxProviderCalls:\s*28/g),
    directPageCeilingLiteral: exactCount(/directPageEnrichmentMaxAttempts\s*=\s*2/g),
    boundedRefinementGuards: exactCount(/refinementCount\s*\|\|\s*0\)\s*>=\s*1/g)
  };
  assert.deepEqual(inventory, {
    totalFetchSites: 3,
    openAiResponsesFetchSites: 1,
    serperFetchSites: 1,
    boundedDirectPageFetchSites: 1,
    objectIdentityModelSites: 1,
    listingFinalModelSites: 1,
    valuationFinalModelSites: 1,
    acquisitionBudgetConstructors: 10,
    physicalAttemptConsumers: 5,
    serperRetryBoundary: 1,
    openAiWebRetryBoundary: 1,
    retailCeilingLiteral: 1,
    directPageCeilingLiteral: 1,
    boundedRefinementGuards: 0
  }, "the frozen product provider surface contains an unclassified call site or ceiling drift");
  assert.doesNotMatch(sourceText, /\b(?:http|https)\.(?:request|get)\s*\(/, "unclassified Node network call site exists in product handler");
  return Object.freeze({
    valid: true,
    inventory: Object.freeze(inventory),
    classifiedExternalAttemptCategories: Object.freeze([
      "OBJECT_IDENTITY_MODEL",
      "FINAL_PURPOSE_MODEL",
      "SERPER_SEARCH_OR_SHOPPING_SHARED_POOL",
      "OPENAI_WEB_SEARCH_SHARED_POOL",
      "PRODUCT_BOUNDED_DIRECT_PAGE_SHARED_POOL"
    ]),
    sourceSha256: sha256Bytes(Buffer.from(sourceText, "utf8"))
  });
}

export function readAllowedEnvironment(environment = process.env) {
  const values = Object.fromEntries(FIXED_ENVIRONMENT_ALLOWLIST.map((name) => [name, String(environment?.[name] || "")]));
  const openAiPrimaryPresent = Boolean(values.OPENAI_API_KEY);
  const openAiAliasPresent = Boolean(values.OPEN_API_KEY);
  assert.ok(openAiPrimaryPresent || openAiAliasPresent, "OpenAI credential presence cannot be resolved");
  const model = values.OPENAI_MODEL || "gpt-4.1-mini";
  assert.match(model, /^(?=.{1,80}$)[A-Za-z0-9](?:[A-Za-z0-9._:-]*[A-Za-z0-9])?$/, "resolved OpenAI model literal is invalid");
  return Object.freeze({
    model,
    acquisitionProviderMode: values.SERPER_API_KEY ? "SERPER_WITH_OPENAI_WEB_SEARCH_FALLBACK" : "OPENAI_WEB_SEARCH_ONLY",
    credentialPresence: Object.freeze({
      OPENAI_API_KEY: openAiPrimaryPresent,
      OPEN_API_KEY: openAiAliasPresent,
      SERPER_API_KEY: Boolean(values.SERPER_API_KEY)
    }),
    secretValues: Object.freeze(values)
  });
}

export function resolveCommittedExecutorHead({ syntheticHead = null, mode = EXECUTION_MODE.AUTHORIZED_REAL_EXECUTION } = {}) {
  if (mode === EXECUTION_MODE.SYNTHETIC_TEST_ONLY) {
    assert.match(syntheticHead || "", COMMIT, "synthetic executor head is required");
    return syntheticHead;
  }
  assert.equal(syntheticHead, null, "real execution cannot substitute a synthetic executor head");
  const head = git(["log", "-1", "--format=%H", "--", "benchmarks/blind-object-v2/execution-release.json"]);
  assert.match(head, COMMIT, "executor release marker is not committed");
  const packageVersion = JSON.parse(execFileSync(process.execPath, ["-e", "process.stdout.write(require('fs').readFileSync('package.json','utf8'))"], { cwd: repositoryRoot, encoding: "utf8", windowsHide: true })).version;
  assert.equal(packageVersion, EXECUTOR_VERSION, "repository Version does not match executor release");
  return head;
}

function parseTreeLine(line) {
  const match = line.match(/^(\d{6})\s+(blob|commit)\s+([a-f0-9]{40})\t(.+)$/);
  assert.ok(match, `unrecognized git tree record: ${line}`);
  return { mode: match[1], type: match[2], gitObjectId: match[3], relativePath: match[4] };
}

export function verifyDetachedProductRuntime(runtimeRoot) {
  const root = path.resolve(runtimeRoot);
  assert.ok(statSync(root, { throwIfNoEntry: false })?.isDirectory(), "product runtime root is absent");
  const head = git(["-C", root, "rev-parse", "HEAD"]);
  assert.equal(head, PRODUCT_SOURCE_HEAD, "detached product runtime HEAD differs from the frozen product release");
  const branch = (() => {
    try {
      return git(["-C", root, "symbolic-ref", "--quiet", "--short", "HEAD"]);
    } catch {
      return "";
    }
  })();
  assert.equal(branch, "", "product runtime must be detached");
  assert.equal(git(["-C", root, "status", "--porcelain=v1", "--untracked-files=all"]), "", "product runtime worktree is not clean");
  const records = git(["-C", root, "ls-tree", "-r", "--full-tree", PRODUCT_SOURCE_HEAD])
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseTreeLine);
  assert.ok(records.length > 100, "product runtime tracked-tree inventory is unexpectedly incomplete");
  assert.equal(records.every((record) => record.type === "blob"), true, "product runtime contains an unsupported submodule or non-blob tree entry");
  const version = JSON.parse(execFileSync(process.execPath, ["-e", "process.stdout.write(require('fs').readFileSync('package.json','utf8'))"], { cwd: root, encoding: "utf8", windowsHide: true })).version;
  assert.equal(version, PRODUCT_SOURCE_VERSION, "detached product Version differs from the frozen product release");
  const core = {
    identityType: "CLEAN_DETACHED_GIT_WORKTREE_FULL_TRACKED_TREE",
    productSourceHead: head,
    productSourceVersion: version,
    trackedEntryCount: records.length,
    fullTrackedTree: records
  };
  return Object.freeze({ ...core, productRuntimeManifestHash: sha256Json(core), runtimeRoot: root });
}

export function ensureDetachedProductRuntime() {
  const runtimeRoot = path.join(os.tmpdir(), `katherines-eye-v2-product-${PRODUCT_SOURCE_HEAD}`);
  if (!existsSync(runtimeRoot)) {
    git(["worktree", "add", "--detach", runtimeRoot, PRODUCT_SOURCE_HEAD]);
  }
  return verifyDetachedProductRuntime(runtimeRoot);
}

export async function resolveExecutionProfile({
  freezeRequests,
  environment = process.env,
  productRuntimeManifestHash,
  executorSourceHead,
  resolvedAt,
  productSourceText = null
}) {
  const sourceText = productSourceText ?? await readFile(path.join(repositoryRoot, "api", "generate-listing.js"), "utf8");
  const providerAudit = auditFrozenProductProviderSurface(sourceText);
  const attemptCeiling = calculateCompleteAttemptCeiling(freezeRequests);
  validateAttemptCeiling(attemptCeiling, freezeRequests);
  const allowed = readAllowedEnvironment(environment);
  const profile = createExecutionProfile({
    productRuntimeManifestHash,
    executorSourceHead,
    model: allowed.model,
    acquisitionProviderMode: allowed.acquisitionProviderMode,
    credentialPresence: allowed.credentialPresence,
    attemptCeiling,
    resolvedAt
  });
  return Object.freeze({ profile, attemptCeiling, providerAudit, allowedEnvironment: allowed });
}

export function handlerRequestBody(request, preparedPhotos) {
  assert.equal(request.inputAssets.length, 2);
  assert.equal(preparedPhotos.length, 2);
  for (const [index, photo] of preparedPhotos.entries()) {
    assert.equal(photo.photoId, request.inputAssets[index].photoId, "prepared photo order differs from frozen request binding");
    assert.match(photo.dataUrl || "", /^data:image\/jpeg;base64,/);
  }
  const body = {
    analysisId: request.analysisId,
    platform: "",
    notes: request.publicCustomerDescription,
    photos: preparedPhotos.map((photo) => ({ name: `${photo.photoId}.jpg`, dataUrl: photo.dataUrl })),
    reportType: request.handlerContract.reportType
  };
  if (request.customerPurpose === "MARKETPLACE_LISTING") body.sellerIntake = { purchase_intent: "seller_listing" };
  else body.buyerIntake = { purchase_intent: request.handlerContract.intakeValue };
  return body;
}

export async function transformPhotosForProduct(request, assetCache) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const inputs = request.inputAssets.map((asset) => {
      const bytes = assetCache.get(asset.frozenRelativePath);
      assert.ok(bytes, `missing public asset ${asset.frozenRelativePath}`);
      assert.equal(sha256Bytes(bytes), asset.sha256);
      return { photoId: asset.photoId, dataUrl: `data:${asset.mediaType};base64,${bytes.toString("base64")}` };
    });
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
        output.push({ photoId: input.photoId, dataUrl: candidate, processedBytes });
      }
      return output;
    }, { images: inputs });
  } finally {
    await browser.close();
  }
}

export function invokePinnedProductHandler({ runtimeRoot, requestBody, allowedEnvironment, correlationId, timeoutMs = 30 * 60 * 1000 }) {
  const bridgePath = path.join(runtimeRoot, "scripts", "local-generate-listing-bridge.mjs");
  assert.ok(statSync(bridgePath, { throwIfNoEntry: false })?.isFile(), "pinned product bridge is absent");
  assert.match(correlationId || "", /^ke-local-[a-f0-9]{32}$/);
  const rawBody = Buffer.from(JSON.stringify(requestBody), "utf8");
  const envelope = Buffer.from(JSON.stringify({
    protocolVersion: 1,
    method: "POST",
    url: "/api/generate-listing",
    headers: { "content-type": "application/json" },
    rawBodyBase64: rawBody.toString("base64"),
    correlationId
  }), "utf8");
  const env = Object.fromEntries(FIXED_ENVIRONMENT_ALLOWLIST.map((name) => [name, allowedEnvironment.secretValues[name] || ""]));
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [bridgePath], {
      cwd: runtimeRoot,
      env,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdoutBytes += chunk.length;
      if (stdoutBytes <= 32 * 1024 * 1024) stdout.push(chunk);
      else child.kill("SIGKILL");
    });
    child.stderr.on("data", (chunk) => {
      stderrBytes += chunk.length;
      if (stderrBytes <= 64 * 1024) stderr.push(chunk);
    });
    child.once("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.once("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(Object.assign(new Error(timedOut ? "pinned product handler timed out" : "pinned product handler bridge failed"), { code: timedOut ? "handler_timeout" : "handler_bridge_failure" }));
        return;
      }
      try {
        const result = JSON.parse(Buffer.concat(stdout).toString("utf8"));
        assert.equal(result.protocolVersion, 1);
        const responseBytes = Buffer.from(result.rawBodyBase64, "base64");
        resolve({ statusCode: result.statusCode, headers: result.headers, body: JSON.parse(responseBytes.toString("utf8")), rawResponseBytes: responseBytes });
      } catch (error) {
        reject(Object.assign(new Error("pinned product handler returned an invalid terminal envelope"), { code: "handler_invalid_terminal_envelope", cause: error }));
      }
    });
    child.stdin.end(envelope);
  });
}
