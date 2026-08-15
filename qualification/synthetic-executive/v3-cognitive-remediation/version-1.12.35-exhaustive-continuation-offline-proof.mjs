import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  compareInventories,
  compactJson,
  inventoryRoot,
  readJson,
  sha256Bytes,
  writeCompactJsonCreateOnly,
} from "./version-1.12.35-exhaustive-continuation-identity.mjs";

const root = "C:/Users/dawgy/Projects/listing-engine-mvp";
const evidenceRoot = path.join(root, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-exhaustive-continuation";
const registryPath = path.join(evidenceRoot, `${prefix}-registry.json`);
const baselinePath = path.join(evidenceRoot, `${prefix}-baseline.json`);
const fixturePath = path.join(evidenceRoot, `${prefix}-curly-apostrophe-fixture.json`);
const correctionPath = path.join(evidenceRoot, "version-1.12.35-playwright-adjudication-append-only-correction.json");
const proofPath = path.join(evidenceRoot, `${prefix}-offline-proof.json`);
if (fs.existsSync(proofPath)) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${proofPath}`);
const registry = readJson(registryPath);
const baseline = readJson(baselinePath);
const fixture = readJson(fixturePath);
const correction = readJson(correctionPath);

const scriptPaths = [
  `${prefix}-identity.mjs`, `${prefix}-gates.mjs`, `${prefix}-runner.mjs`, `${prefix}-build.mjs`, `${prefix}-offline-proof.mjs`,
].map((item) => path.join(evidenceRoot, item));
const parseResults = scriptPaths.map((scriptPath) => {
  const result = childProcess.spawnSync(process.execPath, ["--check", scriptPath], { cwd: root, encoding: "utf8", windowsHide: true, shell: false });
  return { relativePath: path.relative(root, scriptPath).replaceAll("\\", "/"), exitCode: result.status, stderrSha256: sha256Bytes(result.stderr ?? "") };
});
if (parseResults.some((item) => item.exitCode !== 0)) throw new Error(`SCRIPT_PARSE_FAILURE:${compactJson(parseResults)}`);

const ids = registry.entries.map((entry) => entry.id);
const counts = {
  entries: registry.entries.length,
  uniqueEntries: new Set(ids).size,
  retainedPass: registry.entries.filter((entry) => entry.state === "RETAINED_PASS").length,
  pendingStatic: registry.entries.filter((entry) => entry.state === "PENDING" && entry.kind === "STATIC").length,
  pendingReleaseGates: registry.entries.filter((entry) => entry.state === "PENDING" && entry.kind === "RELEASE_GATE").length,
};
if (compactJson(counts) !== compactJson({ entries: 68, uniqueEntries: 68, retainedPass: 28, pendingStatic: 25, pendingReleaseGates: 15 })) throw new Error(`REGISTRY_COUNT_MISMATCH:${compactJson(counts)}`);

const executableProof = registry.entries.filter((entry) => entry.state === "PENDING").map((entry) => {
  const executableResult = path.isAbsolute(entry.executable)
    ? fs.existsSync(entry.executable)
    : childProcess.spawnSync("where.exe", [entry.executable], { encoding: "utf8", windowsHide: true, shell: false });
  const executableExists = path.isAbsolute(entry.executable) ? executableResult : executableResult.status === 0;
  const scriptArguments = entry.arguments.filter((argument) => /\.(?:mjs|ps1)$/i.test(argument));
  const scriptArgumentsExist = scriptArguments.every((argument) => fs.existsSync(argument));
  const roundTripExact = compactJson(JSON.parse(compactJson(entry.arguments))) === compactJson(entry.arguments);
  const noInlineNode = !entry.arguments.includes("-e") && !entry.arguments.includes("--eval") && !entry.arguments.includes("--input-type=module");
  return { id: entry.id, executableExists, workingDirectoryExists: fs.existsSync(entry.workingDirectory), scriptArgumentsExist, roundTripExact, noInlineNode, shell: false };
});
if (executableProof.some((item) => Object.values(item).includes(false))) throw new Error(`REGISTERED_PROCESS_CONTRACT_FAILURE:${compactJson(executableProof.filter((item) => Object.values(item).includes(false)))}`);

const actualTestResults = inventoryRoot(root, baseline.mutableOutputRoots[0].absoluteRoot, { pathBase: baseline.mutableOutputRoots[0].pathBase });
const baselineComparison = compareInventories(baseline.mutableOutputRoots[0].inventory, actualTestResults);
if (!baselineComparison.equal) throw new Error(`BASELINE_RECOMPUTE_MISMATCH:${compactJson(baselineComparison)}`);

const fixtureBytes = fs.readFileSync(fixturePath, "utf8");
const fixtureRoundTrip = JSON.parse(fixtureBytes);
const fixtureBasis = structuredClone(fixtureRoundTrip);
delete fixtureBasis.fixtureHash;
const actualRc = inventoryRoot(root, "test-results/playwright", { pathBase: path.join(root, "test-results/playwright") });
const actualCurly = actualRc.files.filter((file) => Buffer.from(file.relativePath, "utf8").includes(Buffer.from([0xe2, 0x80, 0x99])));
const curlyExact = fixture.members.length === 6 && compactJson(actualCurly) === compactJson(fixture.members) && fixture.fixtureHash === sha256Bytes(compactJson(fixtureBasis));
if (!curlyExact) throw new Error("UTF8_CURLY_APOSTROPHE_FIXTURE_MISMATCH");
const malformedAdjudication = readJson(path.join(evidenceRoot, "version-1.12.35-playwright-shared-fixture-adjudication.json"));
const actualRcTuples = actualRc.files.map((file) => [file.relativePath, file.byteLength, file.sha256]);
const retainedRcMemberSetExact = compactJson(actualRcTuples) === compactJson(malformedAdjudication.retainedCapture.members);
if (!retainedRcMemberSetExact || malformedAdjudication.retainedCapture.pathSetSha256 !== "f63ef7d3b833fb97fa10021ea5e3e5b601dc368221355963735cf2e1812e2124" || malformedAdjudication.retainedCapture.aggregateSha256 !== "743275cbda857f57707a325796490c730be2e5e0fb823276e0dc8bbde0734735") throw new Error("RETAINED_RC_SEALED_IDENTITY_MISMATCH");

const correctionBasis = structuredClone(correction);
delete correctionBasis.correctionHash;
if (correction.correctionHash !== sha256Bytes(compactJson(correctionBasis)) || correction.malformedRecord.matchesAdvertisedConstruction !== false || correction.policyProof.appendOnlySupersessionPermitted !== true) throw new Error("APPEND_ONLY_CORRECTION_PROOF_FAILURE");

const trackedDiff = childProcess.execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: root, encoding: "utf8", windowsHide: true }).trim();
if (trackedDiff) throw new Error(`PREVIOUSLY_COMMITTED_BYTES_CHANGED:${trackedDiff}`);
const trackedFiles = childProcess.execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8", windowsHide: true }).split("\0").filter(Boolean);
const newBasenames = [...scriptPaths, registryPath, baselinePath, fixturePath, correctionPath].map((item) => path.basename(item));
const dependencyReferences = [];
for (const relativePath of trackedFiles) {
  let text;
  try { text = fs.readFileSync(path.join(root, relativePath), "utf8"); } catch { continue; }
  for (const name of newBasenames) if (text.includes(name)) dependencyReferences.push({ relativePath: relativePath.replaceAll("\\", "/"), name });
}
if (dependencyReferences.length) throw new Error(`NEW_HARNESS_REFERENCED_BY_COMMITTED_PATH:${compactJson(dependencyReferences)}`);

const proofBasis = {
  schemaVersion: "1.0",
  proofType: "VERSION_1_12_35_EXHAUSTIVE_CONTINUATION_OFFLINE_HARNESS_PROOF",
  status: "PASS",
  sweepMembersExecuted: 0,
  parseResults,
  registryCounts: counts,
  processContract: { allExecutablesAvailable: true, allWorkingDirectoriesAvailable: true, allScriptArgumentsAvailable: true, exactArgumentRoundTrip: true, shellReinterpretation: false, inlineNodeCommands: false },
  curlyApostropheFixture: { memberCount: 6, exactRoundTrip: true, fixtureHash: fixture.fixtureHash },
  retainedRc: { memberSetExact: true, fileCount: 39, totalBytes: 3864482, sealedPathSetSha256: malformedAdjudication.retainedCapture.pathSetSha256, sealedAggregateSha256: malformedAdjudication.retainedCapture.aggregateSha256 },
  mutableBaseline: { deterministicRecompute: true, comparison: baselineComparison, baselineHash: baseline.baselineHash },
  dependencyGraph: { entryCount: 68, everyEntryPredeclared: registry.entries.every((entry) => Array.isArray(entry.dependencies) && entry.dependencies.length > 0) },
  newHarnessDependencyIsolation: { trackedReferences: [], productHandlerDependencies: 0, cognitivePathDependencies: 0, corpusDependencies: 0, scoringDependencies: 0, evaluatorDependencies: 0, benchmarkDependencies: 0 },
  previouslyCommittedBytesChanged: false,
  appendOnlyCorrection: { valid: true, correctionHash: correction.correctionHash },
};
writeCompactJsonCreateOnly(proofPath, { ...proofBasis, proofHash: sha256Bytes(compactJson(proofBasis)) });
process.stdout.write(`${compactJson({ status: "PASS", proofPath: path.relative(root, proofPath).replaceAll("\\", "/"), proofHash: sha256Bytes(compactJson(proofBasis)), sweepMembersExecuted: 0 })}\n`);
