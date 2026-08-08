import assert from "node:assert/strict";
import { sha256Bytes, sha256Json, stableJson } from "./protocol.mjs";
import {
  PRODUCT_COST_SOURCE_EXTRACTION_POLICY_VERSION,
  PRODUCT_HANDLER_SOURCE_PATH,
  createProductCostSourceManifest,
  loadCanonicalProductCostSourceAudit
} from "./product-cost-source.mjs";

export const COST_ENVELOPE_SCHEMA_VERSION = "1.1";
export const COST_ENVELOPE_TYPE = "BLIND_OBJECT_V2_SOURCE_GROUNDED_COST_ENVELOPE";
export const COST_STATE = Object.freeze({
  WITHIN: "COMPLETE_RUN_WITHIN_AUTHORIZED_COST",
  EXCEEDS: "COMPLETE_RUN_EXCEEDS_AUTHORIZED_COST",
  INCOMPLETE: "COST_ENVELOPE_INCOMPLETE",
  INVALID: "COST_ENVELOPE_INVALID"
});
export const EXPECTED_PRODUCT_SOURCE_SHA256 = createProductCostSourceManifest().sourceEntries
  .find((entry) => entry.relativePath === PRODUCT_HANDLER_SOURCE_PATH).canonicalGitBlobSha256;
export const GPT_4_1_MINI_MODEL_MAX_OUTPUT_TOKENS = 32768;
export const OPENAI_WEB_SEARCH_CONTENT_INPUT_TOKENS = 8000;

const HASH = /^[a-f0-9]{64}$/;
const EXPECTED_BILLABLE_CATEGORIES = Object.freeze([
  "OBJECT_IDENTITY_MODEL",
  "FINAL_PURPOSE_MODEL",
  "OPENAI_WEB_SEARCH",
  "SERPER_SEARCH",
  "SERPER_SHOPPING",
  "DIRECT_PAGE_RETRIEVAL"
]);
const OUTPUT_CEILINGS = Object.freeze({
  OBJECT_IDENTITY_MODEL: 6000,
  FINAL_PURPOSE_MODEL: 5000,
  OPENAI_WEB_SEARCH: 4000
});
const PRODUCT_MAX_IMAGE_DIMENSION = 1400;
const PATCH_SIZE = 32;
const PATCH_BUDGET = 1536;
const GPT_4_1_MINI_PATCH_MULTIPLIER = 1.62;
const PRIOR_OUTPUT_RESERIALIZATION_FACTOR = 2;
const SERIALIZATION_SAFETY_BYTES = 8192;
const DIRECT_PAGE_MAX_BYTES_PER_ANALYSIS = 2 * 250000;
const COST_ENVELOPE_FIELDS = Object.freeze([
  "schemaVersion", "envelopeType", "productSourceSha256", "productCostSourceManifestHash", "completeSourceInventoryHash",
  "extractionPolicyVersion", "sourceBindingAggregateHash", "sourceBindings", "frozenRequestByteBounds",
  "frozenRequestByteBoundAggregateHash", "pricingProfileIdentityHash", "executionProfileIdentityHash", "completeAttemptCeilingHash",
  "completePhysicalAttemptCeiling", "modelProvider", "exactModelLiteral", "acquisitionProviderMode", "outputCeilings", "imageAccounting",
  "webSearchAccounting", "carryForwardAccounting", "includedAttemptBoundaries", "billableCategories", "uncertaintyMargin", "currency",
  "subtotalBeforeMargin", "conservativeMaximumCost", "conservativeMaximumCostMinorUnits", "authorizedMaximumMinorUnits", "costState", "costEnvelopeHash"
]);

function finiteNonnegative(value, label) {
  assert.equal(Number.isFinite(value), true, `${label} must be finite`);
  assert.ok(value >= 0, `${label} must be nonnegative`);
  return value;
}

function failCostEnvelope(state, message) {
  const error = new Error(message);
  error.costEnvelopeState = state;
  throw error;
}

function rate(profile, field, unit) {
  const record = profile?.[field];
  assert.equal(record?.unit, unit, `${field} unit mismatch`);
  return finiteNonnegative(record.rate, `${field} rate`);
}

function readJpegDimensions(bytes) {
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xd8);
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    assert.ok(offset + 2 <= bytes.length, "JPEG segment length is truncated");
    const length = bytes.readUInt16BE(offset);
    assert.ok(length >= 2 && offset + length <= bytes.length, "JPEG segment exceeds source bytes");
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      assert.ok(length >= 7, "JPEG frame is incomplete");
      return Object.freeze({ width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3), mediaType: "image/jpeg" });
    }
    offset += length;
  }
  assert.fail("JPEG dimensions are absent");
}

function readPngDimensions(bytes) {
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  return Object.freeze({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), mediaType: "image/png" });
}

function readWebpDimensions(bytes) {
  assert.equal(bytes.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(bytes.subarray(8, 12).toString("ascii"), "WEBP");
  const kind = bytes.subarray(12, 16).toString("ascii");
  if (kind === "VP8X") return Object.freeze({ width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3), mediaType: "image/webp" });
  if (kind === "VP8 ") return Object.freeze({ width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff, mediaType: "image/webp" });
  if (kind === "VP8L") {
    const packed = bytes.readUInt32LE(21);
    return Object.freeze({ width: 1 + (packed & 0x3fff), height: 1 + ((packed >> 14) & 0x3fff), mediaType: "image/webp" });
  }
  assert.fail("unsupported WebP dimension encoding");
}

export function readImageDimensions(bytes, mediaType = "") {
  assert.ok(Buffer.isBuffer(bytes), "image source must be bytes");
  let dimensions;
  if (mediaType === "image/jpeg" || (bytes[0] === 0xff && bytes[1] === 0xd8)) dimensions = readJpegDimensions(bytes);
  else if (mediaType === "image/png" || bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a") dimensions = readPngDimensions(bytes);
  else if (mediaType === "image/webp" || bytes.subarray(8, 12).toString("ascii") === "WEBP") dimensions = readWebpDimensions(bytes);
  else assert.fail("unsupported frozen image encoding");
  assert.ok(Number.isInteger(dimensions.width) && dimensions.width > 0, "image width is invalid");
  assert.ok(Number.isInteger(dimensions.height) && dimensions.height > 0, "image height is invalid");
  return dimensions;
}

export function productCappedImageDimensions(width, height) {
  assert.ok(Number.isInteger(width) && width > 0);
  assert.ok(Number.isInteger(height) && height > 0);
  const scale = Math.min(1, PRODUCT_MAX_IMAGE_DIMENSION / Math.max(width, height));
  return Object.freeze({
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
    productMaximumDimension: PRODUCT_MAX_IMAGE_DIMENSION
  });
}

export function calculateGpt41MiniHighDetailImageTokens(width, height) {
  assert.ok(Number.isInteger(width) && width > 0);
  assert.ok(Number.isInteger(height) && height > 0);
  let resizedWidth = width;
  let resizedHeight = height;
  const maxDimensionScale = Math.min(1, 2048 / Math.max(resizedWidth, resizedHeight));
  resizedWidth = Math.max(1, Math.floor(resizedWidth * maxDimensionScale));
  resizedHeight = Math.max(1, Math.floor(resizedHeight * maxDimensionScale));
  let patchCount = Math.ceil(resizedWidth / PATCH_SIZE) * Math.ceil(resizedHeight / PATCH_SIZE);
  if (patchCount > PATCH_BUDGET) {
    const shrink = Math.sqrt((PATCH_BUDGET * PATCH_SIZE * PATCH_SIZE) / (resizedWidth * resizedHeight));
    const preliminaryWidth = Math.max(1, Math.floor(resizedWidth * shrink));
    const preliminaryHeight = Math.max(1, Math.floor(resizedHeight * shrink));
    const widthAdjustment = Math.floor(preliminaryWidth / PATCH_SIZE) * PATCH_SIZE / preliminaryWidth;
    const heightAdjustment = Math.floor(preliminaryHeight / PATCH_SIZE) * PATCH_SIZE / preliminaryHeight;
    const adjustment = Math.min(widthAdjustment || 1, heightAdjustment || 1);
    resizedWidth = Math.max(1, Math.floor(preliminaryWidth * adjustment));
    resizedHeight = Math.max(1, Math.floor(preliminaryHeight * adjustment));
    patchCount = Math.ceil(resizedWidth / PATCH_SIZE) * Math.ceil(resizedHeight / PATCH_SIZE);
  }
  assert.ok(patchCount <= PATCH_BUDGET, "image patch count exceeds the documented budget");
  return Object.freeze({
    sourceWidth: width,
    sourceHeight: height,
    billedWidth: resizedWidth,
    billedHeight: resizedHeight,
    patchSize: PATCH_SIZE,
    patchBudget: PATCH_BUDGET,
    patchCount,
    modelMultiplier: GPT_4_1_MINI_PATCH_MULTIPLIER,
    imageTokens: Math.ceil(patchCount * GPT_4_1_MINI_PATCH_MULTIPLIER),
    detail: "high"
  });
}

export function resolveOutputTokenCeiling(explicitCeiling, model = "gpt-4.1-mini") {
  assert.equal(model, "gpt-4.1-mini", "unclassified model output maximum");
  if (explicitCeiling !== null && explicitCeiling !== undefined) {
    assert.ok(Number.isInteger(explicitCeiling) && explicitCeiling > 0);
    return Object.freeze({ tokens: explicitCeiling, basis: "EXPLICIT_SOURCE_MAX_OUTPUT_TOKENS" });
  }
  return Object.freeze({ tokens: GPT_4_1_MINI_MODEL_MAX_OUTPUT_TOKENS, basis: "EXACT_MODEL_MAX_OUTPUT_TOKENS" });
}

function tokenCharge(inputTokens, outputTokens, pricingProfile) {
  return inputTokens / 1_000_000 * rate(pricingProfile, "inputTokenPricing", "USD_PER_MILLION_TOKENS")
    + outputTokens / 1_000_000 * rate(pricingProfile, "outputTokenPricing", "USD_PER_MILLION_TOKENS");
}

function category(record, margin) {
  const subtotalBeforeMargin = Number(record.subtotalBeforeMargin.toFixed(8));
  return Object.freeze({
    ...record,
    uncertaintyMargin: margin,
    subtotalBeforeMargin,
    categorySubtotal: Number((subtotalBeforeMargin * (1 + margin)).toFixed(8))
  });
}

function assertPricingIdentity(pricingProfile, executionProfile) {
  assert.equal(pricingProfile.provider, executionProfile.modelProvider, "pricing provider mismatch");
  assert.equal(pricingProfile.exactModel, executionProfile.exactModelLiteral, "pricing model mismatch");
  assert.equal(pricingProfile.effectiveDate, "2026-08-08", "pricing effective date drift");
  assert.equal(pricingProfile.inputTokenPricing.unit, "USD_PER_MILLION_TOKENS");
  assert.equal(pricingProfile.cachedInputTokenPricing.unit, "USD_PER_MILLION_TOKENS");
  assert.equal(pricingProfile.outputTokenPricing.unit, "USD_PER_MILLION_TOKENS");
  assert.equal(pricingProfile.webSearchToolPricing.unit, "USD_PER_CALL");
  assert.equal(pricingProfile.inputTokenPricing.rate, 0.4);
  assert.equal(pricingProfile.cachedInputTokenPricing.rate, 0.1);
  assert.equal(pricingProfile.outputTokenPricing.rate, 1.6);
  assert.equal(pricingProfile.webSearchToolPricing.rate, 0.01);
  assert.ok(pricingProfile.conservativeUncertaintyMargin >= 0.2, "pricing uncertainty margin is below 20%");
  assert.match(pricingProfile.pricingProfileIdentityHash || "", HASH);
}

function imageAccounting(requests, assetCache) {
  const unique = new Map();
  const usages = [];
  for (const request of requests) {
    assert.equal(request.inputAssets?.length, 2, `${request.analysisId} must bind two images`);
    for (const asset of request.inputAssets) {
      const bytes = assetCache.get(asset.frozenRelativePath);
      assert.ok(Buffer.isBuffer(bytes), `frozen asset ${asset.frozenRelativePath} is absent`);
      assert.equal(sha256Bytes(bytes), asset.sha256, `${asset.frozenRelativePath} hash mismatch`);
      if (!unique.has(asset.sha256)) {
        const source = readImageDimensions(bytes, asset.mediaType);
        const capped = productCappedImageDimensions(source.width, source.height);
        const billed = calculateGpt41MiniHighDetailImageTokens(capped.width, capped.height);
        unique.set(asset.sha256, Object.freeze({
          photoId: asset.photoId,
          sourceSha256: asset.sha256,
          sourceBytes: bytes.length,
          sourceWidth: source.width,
          sourceHeight: source.height,
          productWidthCeiling: capped.width,
          productHeightCeiling: capped.height,
          detail: "high",
          patchCount: billed.patchCount,
          modelMultiplier: billed.modelMultiplier,
          imageTokenCeiling: billed.imageTokens
        }));
      }
      const record = unique.get(asset.sha256);
      usages.push(Object.freeze({ analysisId: request.analysisId, photoId: asset.photoId, sourceSha256: asset.sha256, imageTokenCeiling: record.imageTokenCeiling }));
    }
  }
  assert.equal(unique.size, 28, "frozen image accounting requires all 28 sanitized images");
  assert.equal(usages.length, 52, "frozen image accounting requires all 52 request-image usages");
  return Object.freeze({
    detailMode: "high",
    uniqueImageCount: unique.size,
    requestImageUsageCount: usages.length,
    uniqueImages: Object.freeze([...unique.values()].sort((left, right) => left.photoId.localeCompare(right.photoId))),
    usages: Object.freeze(usages),
    totalImageInputTokens: usages.reduce((sum, item) => sum + item.imageTokenCeiling, 0)
  });
}

export function createSourceGroundedCostEnvelope(input) {
  try {
    assert.ok(input && typeof input === "object" && !Array.isArray(input), "cost envelope input must be an object");
    const allowedInputFields = ["requests", "assetCache", "attemptCeiling", "executionProfile", "pricingProfile", "authorizedMaximumMinorUnits"];
    assert.equal(Object.keys(input).every((field) => allowedInputFields.includes(field)), true, "cost envelope input contains a caller-selected source or unknown field");
    for (const field of ["requests", "assetCache", "attemptCeiling", "executionProfile", "pricingProfile"]) assert.equal(Object.hasOwn(input, field), true, `cost envelope input lacks ${field}`);
    const { requests, assetCache, attemptCeiling, executionProfile, pricingProfile, authorizedMaximumMinorUnits = 4000 } = input;
    assert.equal(requests?.length, 26, "cost envelope requires 26 frozen requests");
    assert.equal(attemptCeiling?.categories?.totalPhysicalAttempts, 832, "physical-attempt ceiling changed");
    assertPricingIdentity(pricingProfile, executionProfile);
    assert.equal(executionProfile.exactModelLiteral, "gpt-4.1-mini", "image and output token rules are unproven for the resolved model");
    assert.equal(Number.isInteger(authorizedMaximumMinorUnits), true);
    assert.ok(authorizedMaximumMinorUnits > 0);
    const sourceAudit = loadCanonicalProductCostSourceAudit();
    assert.deepEqual([...sourceAudit.providerAudit.billableCategories].sort(), [...EXPECTED_BILLABLE_CATEGORIES].sort(), "unknown or unclassified billable category");
    const sourcesByLabel = new Map(sourceAudit.sourceBindings.map((record) => [record.label, record]));
    const sumSource = (...labels) => labels.reduce((sum, label) => sum + sourcesByLabel.get(label).costInputByteCeiling, 0);
    const requestByteBounds = requests.map((request) => ({
      analysisId: request.analysisId,
      requestContractHash: request.requestContractHash,
      stableJsonBytes: Buffer.byteLength(stableJson(request), "utf8")
    }));
    const maxFrozenRequestBytes = Math.max(...requestByteBounds.map((record) => record.stableJsonBytes));
    const images = imageAccounting(requests, assetCache);
    const margin = pricingProfile.conservativeUncertaintyMargin;

    const identityStaticBytes = sumSource("OBJECT_IDENTITY_PROMPT_AND_SCHEMA", "COMMON_MODEL_PAYLOAD");
    const identityInputTokens = requestByteBounds.reduce((sum, request) => sum + identityStaticBytes + request.stableJsonBytes + SERIALIZATION_SAFETY_BYTES, 0);
    const identityOutputTokens = OUTPUT_CEILINGS.OBJECT_IDENTITY_MODEL * 26;

    const searchStaticBytes = sumSource("WEB_SEARCH_SCHEMA", "WEB_SEARCH_PROMPT_AND_PAYLOAD", "WEB_SEARCH_RETRY_BOUNDARY");
    const priorIdentityTokensPerSearch = OUTPUT_CEILINGS.OBJECT_IDENTITY_MODEL * PRIOR_OUTPUT_RESERIALIZATION_FACTOR;
    const ordinarySearchInputTokensPerAttempt = searchStaticBytes + maxFrozenRequestBytes + priorIdentityTokensPerSearch + SERIALIZATION_SAFETY_BYTES;
    const searchCount = attemptCeiling.categories.sharedAcquisitionPhysicalPool;
    const searchOrdinaryInputTokens = ordinarySearchInputTokensPerAttempt * searchCount;
    const searchContentInputTokens = OPENAI_WEB_SEARCH_CONTENT_INPUT_TOKENS * searchCount;
    const searchOutputTokens = OUTPUT_CEILINGS.OPENAI_WEB_SEARCH * searchCount;

    const finalStaticBytes = sumSource(
      "LISTING_FINAL_SCHEMA", "VALUATION_AND_CONSUMER_FINAL_SCHEMAS", "LISTING_FINAL_PROMPT",
      "VALUATION_AND_CONSUMER_FINAL_PROMPTS", "COMMON_MODEL_PAYLOAD"
    );
    const priorSearchTokensPerFinal = 28 * OUTPUT_CEILINGS.OPENAI_WEB_SEARCH * PRIOR_OUTPUT_RESERIALIZATION_FACTOR;
    const priorIdentityTokensPerFinal = OUTPUT_CEILINGS.OBJECT_IDENTITY_MODEL * PRIOR_OUTPUT_RESERIALIZATION_FACTOR;
    const finalInputTokensPerRequest = finalStaticBytes + maxFrozenRequestBytes + priorIdentityTokensPerFinal
      + priorSearchTokensPerFinal + DIRECT_PAGE_MAX_BYTES_PER_ANALYSIS + SERIALIZATION_SAFETY_BYTES;
    const finalInputTokens = finalInputTokensPerRequest * 26;
    const finalOutputTokens = OUTPUT_CEILINGS.FINAL_PURPOSE_MODEL * 26;

    const toolRate = rate(pricingProfile, "webSearchToolPricing", "USD_PER_CALL");
    const directRate = rate(pricingProfile, "directPageCostAssumption", "USD_PER_FETCH");
    const activeSerper = executionProfile.acquisitionProviderMode === "SERPER_WITH_OPENAI_WEB_SEARCH_FALLBACK";
    if (activeSerper) {
      if (!Number.isFinite(pricingProfile.serperSearchPricing?.rate)) failCostEnvelope(COST_STATE.INCOMPLETE, "Serper is reachable but explicit pricing is absent");
      failCostEnvelope(COST_STATE.INCOMPLETE, "Serper search/shopping physical allocation is pooled and cannot be priced exactly for this resolved profile");
    }

    const categories = Object.freeze([
      category({
        category: "OBJECT_IDENTITY_MODEL", countCeiling: 26, provider: "OPENAI", modelOrTool: executionProfile.exactModelLiteral,
        inputBillingRule: "UTF8_BYTE_UPPER_BOUND_FOR_BOUND_SOURCE_AND_FROZEN_REQUEST_PLUS_OFFICIAL_HIGH_DETAIL_PATCH_TOKENS",
        ordinaryInputTokenCeiling: identityInputTokens, fixedSearchContentInputTokens: 0, imageInputTokenCeiling: images.totalImageInputTokens,
        outputBillingRule: "EXPLICIT_SOURCE_MAX_OUTPUT_TOKENS", outputTokenCeiling: identityOutputTokens,
        toolCallFeePerAttempt: 0, retryMultiplier: 1,
        subtotalBeforeMargin: tokenCharge(identityInputTokens + images.totalImageInputTokens, identityOutputTokens, pricingProfile)
      }, margin),
      category({
        category: "FINAL_PURPOSE_MODEL", countCeiling: 26, provider: "OPENAI", modelOrTool: executionProfile.exactModelLiteral,
        inputBillingRule: "UTF8_BYTE_SOURCE_BOUND_PLUS_FROZEN_REQUEST_PLUS_PRIOR_OUTPUT_AND_DIRECT_PAGE_CARRY_FORWARD_BOUNDS",
        ordinaryInputTokenCeiling: finalInputTokens, fixedSearchContentInputTokens: 0, imageInputTokenCeiling: 0,
        outputBillingRule: "EXPLICIT_SOURCE_MAX_OUTPUT_TOKENS", outputTokenCeiling: finalOutputTokens,
        toolCallFeePerAttempt: 0, retryMultiplier: 1,
        subtotalBeforeMargin: tokenCharge(finalInputTokens, finalOutputTokens, pricingProfile)
      }, margin),
      category({
        category: "OPENAI_WEB_SEARCH", countCeiling: searchCount, provider: "OPENAI", modelOrTool: `${executionProfile.exactModelLiteral}+web_search`,
        inputBillingRule: "ORDINARY_PROMPT_BOUND_PLUS_EXACT_FIXED_8000_SEARCH_CONTENT_TOKENS_PER_PHYSICAL_CALL",
        ordinaryInputTokenCeiling: searchOrdinaryInputTokens, fixedSearchContentInputTokens: searchContentInputTokens, imageInputTokenCeiling: 0,
        outputBillingRule: "EXPLICIT_SOURCE_MAX_OUTPUT_TOKENS", outputTokenCeiling: searchOutputTokens,
        toolCallFeePerAttempt: toolRate, retryMultiplier: 1,
        subtotalBeforeMargin: tokenCharge(searchOrdinaryInputTokens + searchContentInputTokens, searchOutputTokens, pricingProfile) + toolRate * searchCount
      }, margin),
      category({
        category: "SERPER_SEARCH", countCeiling: 0, provider: "SERPER", modelOrTool: "SERPER_SEARCH",
        inputBillingRule: "INACTIVE_RESOLVED_PROVIDER_MODE", ordinaryInputTokenCeiling: 0, fixedSearchContentInputTokens: 0, imageInputTokenCeiling: 0,
        outputBillingRule: "NOT_APPLICABLE", outputTokenCeiling: 0, toolCallFeePerAttempt: 0, retryMultiplier: 1, subtotalBeforeMargin: 0
      }, margin),
      category({
        category: "SERPER_SHOPPING", countCeiling: 0, provider: "SERPER", modelOrTool: "SERPER_SHOPPING",
        inputBillingRule: "INACTIVE_RESOLVED_PROVIDER_MODE", ordinaryInputTokenCeiling: 0, fixedSearchContentInputTokens: 0, imageInputTokenCeiling: 0,
        outputBillingRule: "NOT_APPLICABLE", outputTokenCeiling: 0, toolCallFeePerAttempt: 0, retryMultiplier: 1, subtotalBeforeMargin: 0
      }, margin),
      category({
        category: "DIRECT_PAGE_RETRIEVAL", countCeiling: attemptCeiling.categories.directPagePhysicalPool, provider: "PUBLIC_HTTP_OR_HTTPS_ORIGIN", modelOrTool: "PRODUCT_BOUNDED_DIRECT_PAGE",
        inputBillingRule: "ZERO_PROVIDER_CHARGE;_UP_TO_250000_BYTES_PER_FETCH_COUNTED_ONCE_IN_FINAL_MODEL_CARRY_FORWARD_BOUND",
        ordinaryInputTokenCeiling: 0, fixedSearchContentInputTokens: 0, imageInputTokenCeiling: 0,
        outputBillingRule: "BOUNDED_RESPONSE_BYTES_NOT_PROVIDER_TOKENS", outputTokenCeiling: 0,
        toolCallFeePerAttempt: directRate, retryMultiplier: 1,
        subtotalBeforeMargin: directRate * attemptCeiling.categories.directPagePhysicalPool
      }, margin)
    ]);
    assert.deepEqual(categories.map((record) => record.category).sort(), [...EXPECTED_BILLABLE_CATEGORIES].sort());
    const subtotalBeforeMargin = Number(categories.reduce((sum, record) => sum + record.subtotalBeforeMargin, 0).toFixed(8));
    const conservativeMaximumCost = Number(categories.reduce((sum, record) => sum + record.categorySubtotal, 0).toFixed(8));
    const conservativeMaximumCostMinorUnits = Math.ceil(conservativeMaximumCost * 100);
    const costState = conservativeMaximumCostMinorUnits <= authorizedMaximumMinorUnits ? COST_STATE.WITHIN : COST_STATE.EXCEEDS;
    const includedAttemptBoundaries = Object.freeze([
      Object.freeze({ category: "INITIAL_ACQUISITION", countCeiling: 728, billedVia: "OPENAI_WEB_SEARCH", additionalBillableCount: 0, categorySubtotal: 0 }),
      Object.freeze({ category: "REFINEMENT", countCeiling: 26, billedVia: "OPENAI_WEB_SEARCH_SHARED_PHYSICAL_POOL", additionalBillableCount: 0, categorySubtotal: 0 }),
      Object.freeze({ category: "PROVIDER_FALLBACK", countCeiling: 728, billedVia: "OPENAI_WEB_SEARCH_SHARED_PHYSICAL_POOL", additionalBillableCount: 0, categorySubtotal: 0 }),
      Object.freeze({ category: "COMMITTED_PHYSICAL_RETRY", countCeiling: 364, billedVia: "OPENAI_WEB_SEARCH_SHARED_PHYSICAL_POOL", additionalBillableCount: 0, categorySubtotal: 0 })
    ]);
    const core = {
      schemaVersion: COST_ENVELOPE_SCHEMA_VERSION,
      envelopeType: COST_ENVELOPE_TYPE,
      productSourceSha256: EXPECTED_PRODUCT_SOURCE_SHA256,
      productCostSourceManifestHash: sourceAudit.manifestHash,
      completeSourceInventoryHash: sourceAudit.completeSourceInventoryHash,
      extractionPolicyVersion: PRODUCT_COST_SOURCE_EXTRACTION_POLICY_VERSION,
      sourceBindingAggregateHash: sourceAudit.sourceBindingAggregateHash,
      sourceBindings: sourceAudit.sourceBindings,
      frozenRequestByteBounds: requestByteBounds,
      frozenRequestByteBoundAggregateHash: sha256Json(requestByteBounds),
      pricingProfileIdentityHash: pricingProfile.pricingProfileIdentityHash,
      executionProfileIdentityHash: executionProfile.executionProfileIdentityHash,
      completeAttemptCeilingHash: attemptCeiling.ceilingHash,
      completePhysicalAttemptCeiling: 832,
      modelProvider: executionProfile.modelProvider,
      exactModelLiteral: executionProfile.exactModelLiteral,
      acquisitionProviderMode: executionProfile.acquisitionProviderMode,
      outputCeilings: {
        objectIdentity: resolveOutputTokenCeiling(OUTPUT_CEILINGS.OBJECT_IDENTITY_MODEL),
        finalPurpose: resolveOutputTokenCeiling(OUTPUT_CEILINGS.FINAL_PURPOSE_MODEL),
        openAiWebSearch: resolveOutputTokenCeiling(OUTPUT_CEILINGS.OPENAI_WEB_SEARCH),
        absentExplicitCeilingFallback: resolveOutputTokenCeiling(null)
      },
      imageAccounting: images,
      webSearchAccounting: {
        physicalCallCountCeiling: searchCount,
        ordinaryInputTokensPerPhysicalCall: ordinarySearchInputTokensPerAttempt,
        fixedSearchContentInputTokensPerPhysicalCall: OPENAI_WEB_SEARCH_CONTENT_INPUT_TOKENS,
        outputTokensPerPhysicalCall: OUTPUT_CEILINGS.OPENAI_WEB_SEARCH,
        oneToolCallFeePerPhysicalCall: toolRate,
        retryAlreadyIncludedInPhysicalPool: true
      },
      carryForwardAccounting: {
        priorOutputReserializationFactor: PRIOR_OUTPUT_RESERIALIZATION_FACTOR,
        identityTokensPerSearch: priorIdentityTokensPerSearch,
        searchTokensPerFinal: priorSearchTokensPerFinal,
        directPageBytesPerFinal: DIRECT_PAGE_MAX_BYTES_PER_ANALYSIS,
        directPageContentCountedInFinalModelOnly: true
      },
      includedAttemptBoundaries,
      billableCategories: categories,
      uncertaintyMargin: margin,
      currency: "USD",
      subtotalBeforeMargin,
      conservativeMaximumCost,
      conservativeMaximumCostMinorUnits,
      authorizedMaximumMinorUnits,
      costState
    };
    return Object.freeze({ ...core, costEnvelopeHash: sha256Json(core) });
  } catch (error) {
    if (error?.costEnvelopeState) throw error;
    error.costEnvelopeState = COST_STATE.INVALID;
    throw error;
  }
}

export function validateCostEnvelope(envelope, { attemptCeiling, executionProfile, pricingProfile, authorizedMaximumMinorUnits = 4000 } = {}) {
  assert.deepEqual(Object.keys(envelope || {}).sort(), [...COST_ENVELOPE_FIELDS].sort(), "cost envelope fields differ");
  assert.equal(envelope?.schemaVersion, COST_ENVELOPE_SCHEMA_VERSION);
  assert.equal(envelope?.envelopeType, COST_ENVELOPE_TYPE);
  assert.match(envelope?.costEnvelopeHash || "", HASH);
  const core = structuredClone(envelope);
  delete core.costEnvelopeHash;
  assert.equal(sha256Json(core), envelope.costEnvelopeHash, "cost envelope hash mismatch");
  const sourceAudit = loadCanonicalProductCostSourceAudit();
  assert.equal(envelope.productSourceSha256, EXPECTED_PRODUCT_SOURCE_SHA256, "cost envelope product source differs");
  assert.equal(envelope.productCostSourceManifestHash, sourceAudit.manifestHash, "cost envelope Product Cost-Source Manifest differs");
  assert.equal(envelope.completeSourceInventoryHash, sourceAudit.completeSourceInventoryHash, "cost envelope source inventory differs");
  assert.equal(envelope.extractionPolicyVersion, PRODUCT_COST_SOURCE_EXTRACTION_POLICY_VERSION, "cost envelope extraction policy differs");
  assert.equal(envelope.sourceBindingAggregateHash, sourceAudit.sourceBindingAggregateHash, "cost envelope source binding aggregate differs");
  assert.deepEqual(envelope.sourceBindings, sourceAudit.sourceBindings, "cost envelope source bindings differ");
  assert.equal(envelope.completePhysicalAttemptCeiling, 832);
  if (attemptCeiling) assert.equal(envelope.completeAttemptCeilingHash, attemptCeiling.ceilingHash);
  if (executionProfile) {
    assert.equal(envelope.executionProfileIdentityHash, executionProfile.executionProfileIdentityHash);
    assert.equal(envelope.exactModelLiteral, executionProfile.exactModelLiteral);
    assert.equal(envelope.acquisitionProviderMode, executionProfile.acquisitionProviderMode);
  }
  if (pricingProfile) assert.equal(envelope.pricingProfileIdentityHash, pricingProfile.pricingProfileIdentityHash);
  assert.equal(envelope.authorizedMaximumMinorUnits, authorizedMaximumMinorUnits);
  assert.ok(Object.values(COST_STATE).includes(envelope.costState));
  assert.deepEqual(envelope.billableCategories.map((record) => record.category).sort(), [...EXPECTED_BILLABLE_CATEGORIES].sort());
  const expectedState = envelope.conservativeMaximumCostMinorUnits <= authorizedMaximumMinorUnits ? COST_STATE.WITHIN : COST_STATE.EXCEEDS;
  assert.equal(envelope.costState, expectedState, "cost state differs from the sealed amount");
  return Object.freeze({ valid: true, costEnvelopeHash: envelope.costEnvelopeHash, costState: envelope.costState, conservativeMaximumCost: envelope.conservativeMaximumCost });
}
