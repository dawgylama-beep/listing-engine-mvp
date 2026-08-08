import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { TextDecoder } from "node:util";
import { repositoryRoot } from "./execution-store.mjs";
import { sha256Bytes, sha256Json } from "./protocol.mjs";

export const PRODUCT_COST_SOURCE_SCHEMA_VERSION = "1.0";
export const PRODUCT_COST_SOURCE_MANIFEST_TYPE = "PRODUCT_COST_SOURCE_MANIFEST";
export const PRODUCT_COST_SOURCE_BYTE_AUTHORITY = "GIT_OBJECT_DATABASE_BLOB_BYTES";
export const PRODUCT_COST_SOURCE_EXTRACTION_POLICY_VERSION = "1.0";
export const PRODUCT_COST_SOURCE_HEAD = "7056eb0601dc69c5985703fea6fe665e82c6bed8";
export const PRODUCT_COST_SOURCE_VERSION = "1.12.13";
export const PRODUCT_COST_RUNTIME_MANIFEST_HASH = "5a0e3babdfefde7073fddb220f3a9bf0a007c58ecb164418ee3019fb6137a1a8";
export const PRODUCT_HANDLER_SOURCE_PATH = "api/generate-listing.js";
export const PRODUCT_HANDLER_BRIDGE_PATH = "scripts/local-generate-listing-bridge.mjs";
export const LEGACY_V117_EXPECTED_WORKTREE_SHA256 = "bca3ecd47169b478083d8551a5761015f0763e22d4b2c7afd8c09e1087778397";
export const LEGACY_V117_OBSERVED_DETACHED_SHA256 = "c663dc884ed673bbd4e847397b13037e779033e0cd4495de6f70b5153f3dab03";

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^[a-f0-9]{40}$/;
const UTF8 = new TextDecoder("utf-8", { fatal: true });
const BILLABLE_CATEGORIES = Object.freeze([
  "OBJECT_IDENTITY_MODEL",
  "FINAL_PURPOSE_MODEL",
  "OPENAI_WEB_SEARCH",
  "SERPER_SEARCH",
  "SERPER_SHOPPING",
  "DIRECT_PAGE_RETRIEVAL"
]);
const SOURCE_OUTPUT_CEILINGS = Object.freeze({
  OBJECT_IDENTITY_MODEL: 6000,
  FINAL_PURPOSE_MODEL: 5000,
  OPENAI_WEB_SEARCH: 4000
});

const SOURCE_INVENTORY = Object.freeze([
  ["api/generate-listing.js", 1020079, "971194eb5be57c54176244516953237f3fb4dd6fcb4d00dfdc9c36358202c958"],
  ["lib/cognitive-governor/authorization.js", 21165, "561bb10fc3244d4d9959a5a4f96123b43067b531306c4c1a78e5411bd2dd1cef"],
  ["lib/cognitive-governor/constants.js", 3406, "56c915a4b7620973868acb06ec89805e72ba7cab12c1e28ef43956c3b5f4ee1b"],
  ["lib/cognitive-governor/episode.js", 6910, "94e4a236072b8eae6eb8e32877a2ce9148fa7874fd398cbe78ed7a3f1baaa4b3"],
  ["lib/cognitive-governor/index.js", 183, "c28ad0664f3c566cb08cd243fac0bc82a83e49934b809200730466e9ac900713"],
  ["lib/cognitive-governor/policy.js", 20106, "b990be4f7ce9111605721ae22d6bef7cd0aa06b49d298509d32f7add53bbcf6c"],
  ["lib/cognitive-governor/proof.js", 9863, "e5c13712e7c8ce9a6f3850ca5deecca188522a004017b7f917d129113a0a07f6"],
  ["lib/cognitive-governor/state.js", 34581, "11762217e1fde7fd03949589593615eaedb3d97660058f990ce8e992d1a0f84c"],
  ["lib/evidence/customer.js", 22643, "7e872c7fb098b44ec8ce6b005036128ce5df218637897d110ad696f0d154bdc5"],
  ["lib/evidence/decisions.js", 27226, "6ce452ff74f2c78c8c9a61c644cc28bc46ea19de9ab2dd83375284ffc7b2d9ef"],
  ["lib/evidence/dedupe.js", 29801, "c02d7ade395064599b1775161275fc393eaa848b82a5f5dffd71aa034033c062"],
  ["lib/evidence/diagnostics.js", 3150, "1721c3c169766822829eb13936614cbb749e64c5fed750ca566917dadd84f74b"],
  ["lib/evidence/finalize.js", 8285, "ecf1dbfad5cc431fec531062bad66cad96932f3aa834ae30fa5e639a93793bc5"],
  ["lib/evidence/identity.js", 2703, "ff44e6ad6a86153b0508b8d9362bb14096faab22a913c544b0b899f4ea55b6ee"],
  ["lib/evidence/index.js", 404, "702a267894a5335ed64b801312f8521a85581bffd78f78e90d733913b2ab1011"],
  ["lib/evidence/offer.js", 21555, "702bf5bc41281451df5db336a198215b4465151a541929264fd47cc91dafb2f9"],
  ["lib/evidence/provenance.js", 2961, "dc22f03abd3bfc2667e68a0b0c9d6d85accd13e67f58168366b9b5064e23e548"],
  ["lib/evidence/qualification.js", 6459, "26dd59d5000a727fc9d5c26b4e99ff1a9f866bfc278ff6cbb6ea96185c0dcc5b"],
  ["lib/evidence/range.js", 12054, "9fd99104d805df479aee7f62a34bc0d0eaf3cd6422fd6244edaa87b0638e60ed"],
  ["lib/evidence/recovery.js", 9297, "849561be49ca1112c7ddf11227405e756a4b026a17343551e585e5974a429321"],
  ["lib/evidence/result.js", 10139, "67ff90ff547687e0231762cf6d05fb0ed9d6e552def2ba8cf01458481e5bf114"],
  ["lib/evidence/validate.js", 52699, "0bea25c4f9d0d42ee4fe26c114c91cf59fe399d7084a3d2048c8cd92eb2d8a8b"],
  ["lib/object-intelligence/experience.js", 20690, "354baa51abe8ecf08a44663cffef54436b3b158cfd9c7f69b359aca7b989fb23"],
  ["lib/object-intelligence/index.js", 192, "e747971ea454f8e1b3d7af72673f041c273068e985e23dd42972b1aeffc0c56e"],
  ["lib/object-intelligence/resolution.js", 5960, "0bcb52623d9ea61701f008119681baeaf8901f3cb30fa8052cacf168b65381fa"],
  ["lib/object-intelligence/search-plan.js", 10432, "a401a93f44450b521738891ea66f132479191465341c5d4dbd149bca5e7555ef"],
  ["lib/object-intelligence/stable.js", 3464, "505ebde8939fbd939a8ca783d1350a1c7373ac0a671efc66e9983e8cf25b809a"],
  ["lib/object-intelligence/state.js", 17989, "1b35ded3fdf38b116bc8b71bd2686ef86fd53e934882ca175861e84efd0512f5"],
  ["lib/object-intelligence/verification.js", 20199, "5949b5c6c5803a3667b19f58b2c8ad6c59530df31d868a2230e059d5b6e62671"],
  ["lib/terminal-evidence.js", 26154, "c1be3257cd4072422504dc16b4c668fc3bd1e63d0c8d62952880b0a43dd2eb97"],
  ["scripts/local-generate-listing-bridge.mjs", 7314, "b972d3f2da4e71493f31aa31dea419b523b66c1762d30a283223cc6a3405c5c0"]
]);

const EXTRACTION_RULES = Object.freeze([
  ["OBJECT_IDENTITY_PROMPT_AND_SCHEMA", "const itemIdentitySchema =", "async function executeLiveComparableSearch", 89027, "30a921471390c2fcb0341c1102c76e919a771fccaaa52d47ec6b0f1124604faa", 89668, ["OBJECT_IDENTITY_MODEL"], { OBJECT_IDENTITY_MODEL: 6000 }],
  ["WEB_SEARCH_SCHEMA", "const liveCompsSearchSchema =", "async function handleGenerateListingRequest", 2368, "85976572b3611bd3f22b0fd27f5ad2f3c48d2b180255d04e97e658b4980a0f83", 2476, ["OPENAI_WEB_SEARCH", "SERPER_SEARCH", "SERPER_SHOPPING"], { OPENAI_WEB_SEARCH: 4000 }],
  ["WEB_SEARCH_PROMPT_AND_PAYLOAD", "function createQueryBoundLiveSearchPayload", "function buildPrioritizedQueryRecords", 3375, "1d575894287abee8b7ae20c4da1f00fd3054d2a076e8bfde5c210b099fe08e26", 3426, ["OPENAI_WEB_SEARCH", "SERPER_SEARCH", "SERPER_SHOPPING"], { OPENAI_WEB_SEARCH: 4000 }],
  ["WEB_SEARCH_RETRY_BOUNDARY", "async function requestOpenAIComparableSearchWithBudget", "const onlineRetailerRegistry", 1423, "9c2b83164e4bb83ef01d287fe4d56ae3d41ce82f02f66c73a75982bf84435239", 1423, ["OPENAI_WEB_SEARCH", "SERPER_SEARCH", "SERPER_SHOPPING"], { OPENAI_WEB_SEARCH: 4000 }],
  ["LISTING_FINAL_SCHEMA", "const listingSchema =", "const valuationSchema =", 2722, "082e4ddec617e6e8a0fe04fbaf793fa5f394e68202f5a75eaf4bd141223dcefe", 2834, ["FINAL_PURPOSE_MODEL"], { FINAL_PURPOSE_MODEL: 5000 }],
  ["VALUATION_AND_CONSUMER_FINAL_SCHEMAS", "const valuationSchema =", "const askMarketEdgeSchema =", 7074, "71dd4b516edb9a79b6fecea42dd64eb09f10565f1719199e0e85857078af65ed", 7347, ["FINAL_PURPOSE_MODEL"], { FINAL_PURPOSE_MODEL: 5000 }],
  ["LISTING_FINAL_PROMPT", "async function generateFinalListingReport", "async function generateMarketValueReportWithLiveSearch", 4450, "62ad01ff813e513386c8b1312ef99ff83c49e9427397a738bdf2a80920f5d30d", 4502, ["FINAL_PURPOSE_MODEL"], { FINAL_PURPOSE_MODEL: 5000 }],
  ["VALUATION_AND_CONSUMER_FINAL_PROMPTS", "async function generateFinalConsumerDecisionReport", "function createResponsesPayload", 31800, "6e5f53ed7451b7cc62012a688fe2714756970b7dc375d968329e0bda005c3b8d", 32014, ["FINAL_PURPOSE_MODEL"], { FINAL_PURPOSE_MODEL: 5000 }],
  ["COMMON_MODEL_PAYLOAD", "function createResponsesPayload", "async function requestOpenAIJsonNetwork", 558, "5922ac01f145fc44a80b2ce10b01c2d07d7b5afac32bbbe7bc900aed2723083e", 583, ["OBJECT_IDENTITY_MODEL", "FINAL_PURPOSE_MODEL", "OPENAI_WEB_SEARCH"], SOURCE_OUTPUT_CEILINGS]
]);

function exactKeys(value, expected, label) {
  assert.ok(value && typeof value === "object" && !Array.isArray(value), `${label} must be an object`);
  assert.deepEqual(Object.keys(value).sort(), [...expected].sort(), `${label} fields differ`);
}

function sourceRole(relativePath) {
  if (relativePath === PRODUCT_HANDLER_SOURCE_PATH) return "PRODUCT_BILLABLE_CALL_PROMPT_AND_CEILING_AUTHORITY";
  if (relativePath === PRODUCT_HANDLER_BRIDGE_PATH) return "PRODUCT_HANDLER_PROCESS_BRIDGE";
  return "TRANSITIVE_PRODUCT_RUNTIME_DEPENDENCY";
}

function classificationRule(relativePath) {
  if (relativePath === PRODUCT_HANDLER_SOURCE_PATH) return "EXACT_BILLABLE_SURFACE_AND_CANONICAL_MARKER_EXTRACTIONS";
  if (relativePath === PRODUCT_HANDLER_BRIDGE_PATH) return "FIXED_LOCAL_HANDLER_IMPORT_WITH_NO_BILLABLE_CALL_SITE";
  return "STATIC_IMPORT_CLOSURE_WITH_NO_BILLABLE_CALL_SITE";
}

function createSourceEntries() {
  return SOURCE_INVENTORY.map(([relativePath, canonicalByteCount, canonicalGitBlobSha256]) => ({
    relativePath,
    sourceRole: sourceRole(relativePath),
    canonicalGitBlobSha256,
    canonicalByteCount,
    encodingExpectation: "UTF-8_NO_BOM_LF",
    classificationRule: classificationRule(relativePath),
    relevantCallCategories: relativePath === PRODUCT_HANDLER_SOURCE_PATH ? [...BILLABLE_CATEGORIES] : [],
    sourceBoundOutputCeilings: relativePath === PRODUCT_HANDLER_SOURCE_PATH ? { ...SOURCE_OUTPUT_CEILINGS } : {}
  }));
}

function createExtractionRecords() {
  return EXTRACTION_RULES.map(([label, startMarker, endMarker, canonicalByteCount, canonicalGitBlobSha256, costInputByteCeiling, relevantCallCategories, sourceBoundOutputCeilings]) => ({
    label,
    relativePath: PRODUCT_HANDLER_SOURCE_PATH,
    extractionRule: "UTF8_CODE_UNIT_SLICE_START_INCLUSIVE_END_EXCLUSIVE",
    startMarker,
    endMarker,
    canonicalGitBlobSha256,
    canonicalByteCount,
    costInputByteCeiling,
    relevantCallCategories: [...relevantCallCategories],
    sourceBoundOutputCeilings: { ...sourceBoundOutputCeilings }
  }));
}

export function createProductCostSourceManifest() {
  const sourceEntries = createSourceEntries();
  const extractionRules = createExtractionRecords();
  const core = {
    schemaVersion: PRODUCT_COST_SOURCE_SCHEMA_VERSION,
    manifestType: PRODUCT_COST_SOURCE_MANIFEST_TYPE,
    productSourceHead: PRODUCT_COST_SOURCE_HEAD,
    productSourceVersion: PRODUCT_COST_SOURCE_VERSION,
    productRuntimeManifestHash: PRODUCT_COST_RUNTIME_MANIFEST_HASH,
    canonicalSourceByteAuthority: PRODUCT_COST_SOURCE_BYTE_AUTHORITY,
    sourceEntries,
    completeSourceInventoryHash: sha256Json(sourceEntries),
    extractionPolicyVersion: PRODUCT_COST_SOURCE_EXTRACTION_POLICY_VERSION,
    extractionRules,
    billableCallSiteInventory: {
      reachableSourceFileCount: sourceEntries.length,
      handlerFetchSiteCount: 3,
      transitiveDependencyFetchSiteCount: 0,
      billableCategories: [...BILLABLE_CATEGORIES]
    }
  };
  return Object.freeze({ ...core, manifestHash: sha256Json(core) });
}

export function validateProductCostSourceManifest(manifest) {
  const expected = createProductCostSourceManifest();
  exactKeys(manifest, Object.keys(expected), "Product Cost-Source Manifest");
  assert.deepEqual(manifest, expected, "Product Cost-Source Manifest differs from the repository-owned authority");
  assert.equal(manifest.schemaVersion, PRODUCT_COST_SOURCE_SCHEMA_VERSION);
  assert.equal(manifest.manifestType, PRODUCT_COST_SOURCE_MANIFEST_TYPE);
  assert.match(manifest.productSourceHead || "", COMMIT);
  assert.match(manifest.productRuntimeManifestHash || "", HASH);
  assert.match(manifest.completeSourceInventoryHash || "", HASH);
  assert.match(manifest.manifestHash || "", HASH);
  assert.equal(sha256Json(manifest.sourceEntries), manifest.completeSourceInventoryHash);
  const core = structuredClone(manifest);
  delete core.manifestHash;
  assert.equal(sha256Json(core), manifest.manifestHash);
  return Object.freeze({ valid: true, manifestHash: manifest.manifestHash, completeSourceInventoryHash: manifest.completeSourceInventoryHash });
}

export function inspectCanonicalUtf8SourceBytes(bytes, label = "canonical product source") {
  assert.ok(Buffer.isBuffer(bytes), `${label} must be binary-safe bytes`);
  assert.equal(bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])), false, `${label} contains an unexpected UTF-8 BOM`);
  const text = UTF8.decode(bytes);
  const crlfCount = (text.match(/\r\n/g) || []).length;
  const bareCrCount = (text.match(/\r(?!\n)/g) || []).length;
  const lfCount = (text.match(/(?<!\r)\n/g) || []).length;
  assert.equal(crlfCount, 0, `${label} canonical Git blob is not LF-only`);
  assert.equal(bareCrCount, 0, `${label} canonical Git blob contains a bare carriage return`);
  assert.equal(text.endsWith("\n"), true, `${label} lacks its expected trailing newline`);
  return Object.freeze({ text, byteCount: bytes.length, sha256: sha256Bytes(bytes), encoding: "UTF-8", bom: false, crlfCount, bareCrCount, lfCount, trailingNewline: true });
}

function readCanonicalBlob(relativePath) {
  return execFileSync("git", ["cat-file", "blob", `${PRODUCT_COST_SOURCE_HEAD}:${relativePath}`], {
    cwd: repositoryRoot,
    windowsHide: true,
    maxBuffer: 8 * 1024 * 1024
  });
}

function relativeImports(relativePath, text, knownPaths) {
  const specifiers = new Set();
  for (const pattern of [
    /(?:^|\n)\s*(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
    /new URL\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/g
  ]) for (const match of text.matchAll(pattern)) specifiers.add(match[1]);
  const resolved = [];
  for (const specifier of specifiers) {
    if (!specifier.startsWith(".")) continue;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier));
    const candidates = path.posix.extname(base) ? [base] : [`${base}.js`, `${base}.mjs`, `${base}/index.js`, `${base}/index.mjs`];
    const selected = candidates.find((candidate) => knownPaths.has(candidate));
    assert.ok(selected, `unlisted reachable product source import ${relativePath} -> ${specifier}`);
    resolved.push(selected);
  }
  return resolved;
}

export function auditProductProviderSurface(sourceTexts) {
  assert.ok(sourceTexts instanceof Map, "product source audit requires a path-bound source map");
  const handler = sourceTexts.get(PRODUCT_HANDLER_SOURCE_PATH);
  assert.equal(typeof handler, "string", "canonical product handler source is absent");
  const exactCount = (source, pattern) => [...source.matchAll(pattern)].length;
  const allSource = [...sourceTexts.entries()].map(([relativePath, text]) => `\n/* ${relativePath} */\n${text}`).join("");
  const inventory = {
    totalFetchSites: exactCount(allSource, /\bfetch\s*\(/g),
    handlerFetchSites: exactCount(handler, /\bfetch\s*\(/g),
    transitiveDependencyFetchSites: exactCount(allSource, /\bfetch\s*\(/g) - exactCount(handler, /\bfetch\s*\(/g),
    openAiResponsesFetchSites: exactCount(handler, /fetch\("https:\/\/api\.openai\.com\/v1\/responses"/g),
    serperFetchSites: exactCount(handler, /fetch\(`https:\/\/google\.serper\.dev\/\$\{endpointPath\}`/g),
    boundedDirectPageFetchSites: exactCount(handler, /fetch\(finalCandidate,/g),
    objectIdentityModelSites: exactCount(handler, /schemaName:\s*"item_identity"/g),
    listingFinalModelSites: exactCount(handler, /schemaName:\s*"marketplace_listing"/g),
    valuationFinalModelSites: exactCount(handler, /schemaName:\s*"market_value_report"/g),
    acquisitionBudgetConstructors: exactCount(handler, /createPhysicalAttemptBudget\(/g),
    physicalAttemptConsumers: exactCount(handler, /consumePhysicalAttempt\(/g),
    serperRetryBoundary: exactCount(handler, /maxRetries\s*=\s*1/g),
    openAiWebRetryBoundary: exactCount(handler, /for\s*\(let attempt = 0; attempt <= 1; attempt \+= 1\)/g),
    retailCeilingLiteral: exactCount(handler, /maxProviderCalls:\s*28/g),
    directPageCeilingLiteral: exactCount(handler, /directPageEnrichmentMaxAttempts\s*=\s*2/g),
    directPageByteCeilingSites: exactCount(handler, /250000/g),
    boundedRefinementGuards: exactCount(handler, /refinementCount\s*\|\|\s*0\)\s*>=\s*1/g),
    exactModelSelectionSites: exactCount(handler, /process\.env\.OPENAI_MODEL\s*\|\|\s*"gpt-4\.1-mini"/g)
  };
  assert.deepEqual(inventory, {
    totalFetchSites: 3,
    handlerFetchSites: 3,
    transitiveDependencyFetchSites: 0,
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
    directPageByteCeilingSites: 2,
    boundedRefinementGuards: 0,
    exactModelSelectionSites: 1
  }, "canonical product source closure contains an unclassified call site or cost ceiling drift");
  assert.doesNotMatch(allSource, /\b(?:http|https)\.(?:request|get)\s*\(/, "unclassified Node network call site exists in the product source closure");
  for (const [name, ceiling] of Object.entries({ item_identity: 6000, consumer_purchase_decision: 5000, market_value_report: 5000, marketplace_listing: 5000, live_comparable_search: 4000 })) {
    assert.match(handler, new RegExp(`${name}:\\s*${ceiling}`), `source-bound output ceiling ${name} differs`);
  }
  return Object.freeze({ valid: true, inventory: Object.freeze(inventory), billableCategories: BILLABLE_CATEGORIES });
}

let cachedCanonicalAudit = null;

export function loadCanonicalProductCostSourceAudit() {
  if (cachedCanonicalAudit) return cachedCanonicalAudit;
  const manifest = createProductCostSourceManifest();
  validateProductCostSourceManifest(manifest);
  const sourceTexts = new Map();
  const sourceDiagnostics = [];
  for (const entry of manifest.sourceEntries) {
    const inspected = inspectCanonicalUtf8SourceBytes(readCanonicalBlob(entry.relativePath), entry.relativePath);
    assert.equal(inspected.byteCount, entry.canonicalByteCount, `${entry.relativePath} canonical byte count differs`);
    assert.equal(inspected.sha256, entry.canonicalGitBlobSha256, `${entry.relativePath} canonical Git-blob SHA-256 differs`);
    sourceTexts.set(entry.relativePath, inspected.text);
    sourceDiagnostics.push(Object.freeze({ relativePath: entry.relativePath, sha256: inspected.sha256, byteCount: inspected.byteCount, encoding: inspected.encoding, bom: inspected.bom, lfCount: inspected.lfCount, trailingNewline: inspected.trailingNewline }));
  }
  const knownPaths = new Set(sourceTexts.keys());
  const reachable = new Set();
  const queue = [PRODUCT_HANDLER_BRIDGE_PATH];
  while (queue.length) {
    const relativePath = queue.shift();
    if (reachable.has(relativePath)) continue;
    assert.equal(knownPaths.has(relativePath), true, `reachable product source ${relativePath} is unlisted`);
    reachable.add(relativePath);
    for (const imported of relativeImports(relativePath, sourceTexts.get(relativePath), knownPaths)) if (!reachable.has(imported)) queue.push(imported);
  }
  assert.deepEqual([...reachable].sort(), [...knownPaths].sort(), "Product Cost-Source Manifest contains an unreachable or omits a reachable product source");
  const providerAudit = auditProductProviderSurface(sourceTexts);
  const handlerText = sourceTexts.get(PRODUCT_HANDLER_SOURCE_PATH);
  const sourceBindings = manifest.extractionRules.map((rule) => {
    const start = handlerText.indexOf(rule.startMarker);
    assert.ok(start >= 0, `${rule.label} start marker is absent`);
    const end = handlerText.indexOf(rule.endMarker, start + rule.startMarker.length);
    assert.ok(end > start, `${rule.label} end marker is absent`);
    const bytes = Buffer.from(handlerText.slice(start, end), "utf8");
    assert.equal(bytes.length, rule.canonicalByteCount, `${rule.label} canonical slice byte count differs`);
    assert.equal(sha256Bytes(bytes), rule.canonicalGitBlobSha256, `${rule.label} canonical slice SHA-256 differs`);
    assert.ok(rule.costInputByteCeiling >= bytes.length, `${rule.label} cost-input byte ceiling is below canonical source bytes`);
    return Object.freeze({
      label: rule.label,
      relativePath: rule.relativePath,
      extractionRule: rule.extractionRule,
      startMarker: rule.startMarker,
      endMarker: rule.endMarker,
      canonicalBytes: bytes.length,
      canonicalSha256: rule.canonicalGitBlobSha256,
      costInputByteCeiling: rule.costInputByteCeiling,
      relevantCallCategories: rule.relevantCallCategories,
      sourceBoundOutputCeilings: rule.sourceBoundOutputCeilings
    });
  });
  cachedCanonicalAudit = Object.freeze({
    manifest,
    manifestHash: manifest.manifestHash,
    completeSourceInventoryHash: manifest.completeSourceInventoryHash,
    sourceDiagnostics: Object.freeze(sourceDiagnostics),
    sourceBindings: Object.freeze(sourceBindings),
    sourceBindingAggregateHash: sha256Json(sourceBindings),
    providerAudit
  });
  return cachedCanonicalAudit;
}
