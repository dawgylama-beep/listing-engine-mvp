import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  HISTORICAL_TRUST_CLASS,
  reflectOnHistoricalExperiences,
  validateHistoricalReflectionSource
} from "../lib/experience-reflection.js";
import { sha256Object, stableObjectJson } from "../lib/object-intelligence/stable.js";
import { verifyFrozenResultIntegrity } from "../benchmarks/blind-object-v1-execution-v1/scripts/result-integrity.mjs";

const DEFAULT_RESULTS_ROOT = "benchmarks/blind-object-v1-results";
const DEFAULT_OUTPUT = "test-results/phase6g-retrospective-reflection.json";

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseArguments(args = []) {
  const options = {
    resultsRoot: DEFAULT_RESULTS_ROOT,
    output: DEFAULT_OUTPUT,
    externallyVerifiedDiagnostics: new Map()
  };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--results-root") options.resultsRoot = args[++index];
    else if (argument === "--output") options.output = args[++index];
    else if (argument === "--verified-diagnostic") {
      const value = args[++index] || "";
      const separator = value.lastIndexOf("=");
      assert.ok(separator > 0, "--verified-diagnostic requires <path>=<sha256>");
      const filePath = value.slice(0, separator);
      const expectedHash = value.slice(separator + 1).toLowerCase();
      assert.match(expectedHash, /^[a-f0-9]{64}$/, "verified diagnostic hash must be SHA-256");
      options.externallyVerifiedDiagnostics.set(path.resolve(filePath), expectedHash);
    } else {
      throw new Error(`Unknown retrospective reflection argument: ${argument}`);
    }
  }
  assert.ok(options.resultsRoot, "results root is required");
  assert.ok(options.output, "output is required");
  return options;
}

async function filesUnder(root) {
  const selected = [];
  async function visit(current) {
    for (const entry of (await readdir(current, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name))) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) selected.push(absolute);
    }
  }
  await visit(root);
  return selected;
}

export async function snapshotHistoricalTree(root) {
  const absoluteRoot = path.resolve(root);
  const entries = [];
  for (const absolutePath of await filesUnder(absoluteRoot)) {
    const bytes = await readFile(absolutePath);
    entries.push({
      path: path.relative(absoluteRoot, absolutePath).replace(/\\/g, "/"),
      byteLength: bytes.length,
      sha256: sha256Bytes(bytes)
    });
  }
  return {
    fileCount: entries.length,
    entries,
    treeHash: sha256Object(entries)
  };
}

function outputPathIsAllowed(output, resultsRoot) {
  const absoluteOutput = path.resolve(output);
  const absoluteIgnoredRoot = path.resolve("test-results");
  const relativeToIgnoredRoot = path.relative(absoluteIgnoredRoot, absoluteOutput);
  const relativeToResults = path.relative(path.resolve(resultsRoot), absoluteOutput);
  return relativeToIgnoredRoot
    && !relativeToIgnoredRoot.startsWith("..")
    && !path.isAbsolute(relativeToIgnoredRoot)
    && (relativeToResults.startsWith("..") || path.isAbsolute(relativeToResults));
}

function statusCode(response = {}) {
  return Number(response.handlerStatus?.statusCode || 0);
}

function sealedSourceFor({ request, response, aggregateHash }) {
  return {
    trustClass: HISTORICAL_TRUST_CLASS.SEALED_AUTHORITATIVE_EXPERIENCE,
    sourceRecordHash: response.experienceRecord?.experienceRecordHash || "",
    sourceArtifactHash: response.responseSha256,
    sourceAggregateHash: aggregateHash,
    integrityVerified: true,
    experienceRecord: response.experienceRecord,
    cognitiveEpisode: response.cognitiveEpisode,
    governorProof: response.governorProof,
    episodeLessonCandidate: response.lessonCandidate,
    customerPurpose: request.purpose,
    objectClassIdentity: response.cognitiveEpisode?.submittedObjectFingerprint || request.objectId,
    episodeIdentity: response.cognitiveEpisode?.cognitiveEpisodeHash || response.responseSha256,
    causalEventIdentity: response.cognitiveEpisode?.cognitiveEpisodeHash || response.responseSha256,
    sourceLineageIdentity: response.requestSha256,
    terminalOutcome: response.cognitiveEpisode?.terminalStatus || "UNRESOLVED",
    handlerStatusCode: statusCode(response)
  };
}

function diagnosticSourceFor({ request, response, aggregateHash }) {
  return {
    trustClass: HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC,
    sourceRecordHash: response.responseSha256,
    sourceArtifactHash: response.responseSha256,
    sourceAggregateHash: aggregateHash,
    integrityVerified: true,
    experienceRecord: response.experienceRecord,
    cognitiveEpisode: response.cognitiveEpisode,
    governorProof: response.governorProof,
    episodeLessonCandidate: response.lessonCandidate,
    customerPurpose: request.purpose,
    objectClassIdentity: response.cognitiveEpisode?.submittedObjectFingerprint || request.objectId,
    episodeIdentity: response.cognitiveEpisode?.cognitiveEpisodeHash || response.responseSha256,
    causalEventIdentity: response.cognitiveEpisode?.cognitiveEpisodeHash || response.responseSha256,
    sourceLineageIdentity: response.requestSha256,
    terminalOutcome: response.cognitiveEpisode?.terminalStatus || (statusCode(response) >= 500 ? "FAILED" : "UNRESOLVED"),
    handlerStatusCode: statusCode(response)
  };
}

function corePaths(verified) {
  return new Set([
    "frozen-result-manifest.json",
    "run-journal.jsonl",
    ...verified.manifest.requests.map((entry) => entry.path.replace(/\\/g, "/")),
    ...verified.manifest.responses.map((entry) => entry.path.replace(/\\/g, "/"))
  ]);
}

async function inventoryResultRoot(resultRoot, verified, externallyVerifiedDiagnostics) {
  const core = corePaths(verified);
  const artifacts = [];
  for (const absolutePath of await filesUnder(resultRoot)) {
    const relativePath = path.relative(resultRoot, absolutePath).replace(/\\/g, "/");
    const bytes = await readFile(absolutePath);
    const actualHash = sha256Bytes(bytes);
    const externalExpected = externallyVerifiedDiagnostics.get(path.resolve(absolutePath));
    const externallyVerified = Boolean(externalExpected && externalExpected === actualHash);
    artifacts.push({
      path: relativePath,
      byteLength: bytes.length,
      sha256: actualHash,
      trustClass: core.has(relativePath) || externallyVerified
        ? HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC
        : HISTORICAL_TRUST_CLASS.UNVERIFIED_LEGACY,
      integrityBasis: core.has(relativePath)
        ? "FROZEN_RESULT_MANIFEST_OR_JOURNAL_BINDING"
        : externallyVerified
          ? "EXTERNAL_EXPECTED_SHA256"
          : "NO_CURRENT_REFLECTION_INTEGRITY_BINDING"
    });
  }
  return artifacts;
}

async function inventoryLooseArtifacts(resultsRoot, resultDirectories, externallyVerifiedDiagnostics) {
  const directorySet = new Set(resultDirectories.map((directory) => path.resolve(directory)));
  const artifacts = [];
  for (const entry of await readdir(resultsRoot, { withFileTypes: true })) {
    const absolutePath = path.join(resultsRoot, entry.name);
    if (!entry.isFile() || directorySet.has(path.resolve(absolutePath))) continue;
    const bytes = await readFile(absolutePath);
    const actualHash = sha256Bytes(bytes);
    const expectedHash = externallyVerifiedDiagnostics.get(path.resolve(absolutePath));
    artifacts.push({
      path: entry.name,
      byteLength: bytes.length,
      sha256: actualHash,
      trustClass: expectedHash === actualHash
        ? HISTORICAL_TRUST_CLASS.FROZEN_VERIFIED_DIAGNOSTIC
        : HISTORICAL_TRUST_CLASS.UNVERIFIED_LEGACY,
      integrityBasis: expectedHash === actualHash
        ? "EXTERNAL_EXPECTED_SHA256"
        : "NO_CURRENT_REFLECTION_INTEGRITY_BINDING"
    });
  }
  return artifacts.sort((left, right) => left.path.localeCompare(right.path));
}

export async function runHistoricalReflection({
  resultsRoot = DEFAULT_RESULTS_ROOT,
  output = DEFAULT_OUTPUT,
  externallyVerifiedDiagnostics = new Map()
} = {}) {
  const absoluteResultsRoot = path.resolve(resultsRoot);
  const absoluteOutput = path.resolve(output);
  assert.ok(outputPathIsAllowed(absoluteOutput, absoluteResultsRoot), "retrospective output must remain under ignored test-results and outside historical results");
  const before = await snapshotHistoricalTree(absoluteResultsRoot);
  const directoryEntries = (await readdir(absoluteResultsRoot, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));
  const sources = [];
  const roots = [];
  const resultDirectories = [];
  for (const entry of directoryEntries) {
    const resultRoot = path.join(absoluteResultsRoot, entry.name);
    try {
      await readFile(path.join(resultRoot, "frozen-result-manifest.json"));
    } catch {
      continue;
    }
    resultDirectories.push(resultRoot);
    const verified = await verifyFrozenResultIntegrity(resultRoot);
    let sealedAuthoritativeExperienceCount = 0;
    let frozenDiagnosticObservationCount = 0;
    for (let index = 0; index < verified.responses.length; index += 1) {
      const request = verified.requests[index];
      const response = verified.responses[index];
      const sealed = sealedSourceFor({ request, response, aggregateHash: verified.manifest.aggregateResultSha256 });
      if (response.experienceRecord && validateHistoricalReflectionSource(sealed).valid) {
        sources.push(sealed);
        sealedAuthoritativeExperienceCount += 1;
      } else {
        sources.push(diagnosticSourceFor({ request, response, aggregateHash: verified.manifest.aggregateResultSha256 }));
        frozenDiagnosticObservationCount += 1;
      }
    }
    const artifacts = await inventoryResultRoot(resultRoot, verified, externallyVerifiedDiagnostics);
    roots.push({
      resultRootId: sha256Object({ resultRoot: entry.name, aggregateHash: verified.manifest.aggregateResultSha256 }).slice(0, 24),
      aggregateResultSha256: verified.manifest.aggregateResultSha256,
      requestCount: verified.requests.length,
      responseCount: verified.responses.length,
      sealedAuthoritativeExperienceCount,
      frozenDiagnosticObservationCount,
      artifactTrustCounts: Object.fromEntries(Object.values(HISTORICAL_TRUST_CLASS).map((trustClass) => [
        trustClass,
        artifacts.filter((artifact) => artifact.trustClass === trustClass).length
      ])),
      artifacts
    });
  }
  const reflection = reflectOnHistoricalExperiences(sources);
  const after = await snapshotHistoricalTree(absoluteResultsRoot);
  assert.equal(after.treeHash, before.treeHash, "historical source tree changed during reflection");
  assert.equal(after.fileCount, before.fileCount, "historical source inventory changed during reflection");
  const report = {
    schemaVersion: "1.0",
    reportType: "PHASE_6G_LOCAL_READ_ONLY_HISTORICAL_PROOF",
    historicalSourceInventory: {
      resultRoots: roots,
      looseArtifacts: await inventoryLooseArtifacts(absoluteResultsRoot, resultDirectories, externallyVerifiedDiagnostics)
    },
    reflection,
    sourceImmutability: {
      beforeTreeHash: before.treeHash,
      afterTreeHash: after.treeHash,
      beforeFileCount: before.fileCount,
      afterFileCount: after.fileCount,
      byteForByteIdentical: before.treeHash === after.treeHash && before.fileCount === after.fileCount
    },
    executionSafety: {
      frozenRequestExecutionCount: 0,
      providerRequestCount: 0,
      networkRequestCount: 0,
      openAIRequestCount: 0,
      webSearchRequestCount: 0,
      serperRequestCount: 0,
      directPageFetchCount: 0,
      sourceMutationCount: 0,
      runtimeConsumptionAuthorized: false,
      lessonPromotionAuthorized: false
    },
    reportHash: ""
  };
  report.reportHash = sha256Object(report);
  await mkdir(path.dirname(absoluteOutput), { recursive: true });
  await writeFile(absoluteOutput, `${stableObjectJson(report)}\n`, "utf8");
  return { report, output: absoluteOutput };
}

async function cli() {
  const options = parseArguments(process.argv.slice(2));
  const result = await runHistoricalReflection(options);
  const summary = {
    status: "PASS",
    output: result.output,
    resultRootCount: result.report.historicalSourceInventory.resultRoots.length,
    totalRecordsExamined: result.report.reflection.totalRecordsExamined,
    uniqueRecordsExamined: result.report.reflection.uniqueRecordsExamined,
    trustClassCounts: result.report.reflection.trustClassCounts,
    candidateCount: result.report.reflection.lessonCandidates.length,
    candidateStatuses: result.report.reflection.lessonCandidates.map((candidate) => candidate.status),
    sourceImmutability: result.report.sourceImmutability,
    executionSafety: result.report.executionSafety,
    reportHash: result.report.reportHash
  };
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  cli().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
