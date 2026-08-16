import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  booleanContractDefinitions,
  booleanMatrixRepresentations,
  inventorySetRepresentations,
  presenceRepresentations,
  runBooleanMatrixCase,
  runInventorySetCase,
  runOwnAbsenceCase,
  runTypedMatrixCase,
  typedMatrixDefinitions,
  validateRegistry,
  validateSchema,
} from "./version-1.12.35-boolean-predicate-successor-v2-contract.mjs";
import {
  ROOT,
  adjudicationTuplesToMembers,
  compactJson,
  compareInventories,
  compareInventoryMemberSets,
  inventoryRoot,
  readJson,
  requireOwnAbsent,
  sealRecord,
  sha256,
  verifySeal,
  writeCreateOnly,
} from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v2";
const resultPath = path.join(evidenceRoot, `${prefix}-offline-proof-result.json`);
if (fs.existsSync(resultPath) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${resultPath}`);
const registryPath = path.join(evidenceRoot, `${prefix}-registry.json`);
const schemaPath = path.join(evidenceRoot, `${prefix}-schema.json`);
const matrixPath = path.join(evidenceRoot, `${prefix}-predicate-matrix.json`);
const correctionPath = path.join(evidenceRoot, `${prefix}-correction.json`);
const baselinePath = path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json");
const registry = readJson(registryPath);
const schema = readJson(schemaPath);
const matrix = readJson(matrixPath);
const correction = readJson(correctionPath);
const baseline = readJson(baselinePath);
const failures = [];
const recordFailure = (gate, details) => failures.push({ gate, details });

let registryContractValid = false;
try { validateRegistry(registry); registryContractValid = true; } catch (error) { recordFailure("REGISTRY_CONTRACT", error.message); }
let schemaExact = false;
try { validateSchema(schema); schemaExact = true; } catch (error) { recordFailure("SCHEMA_EXACTNESS", error.message); }
const registrySeal = verifySeal(registry, "registryHash");
if (registrySeal.valid !== true) recordFailure("REGISTRY_SEAL", registrySeal);
const matrixSeal = verifySeal(matrix, "matrixHash");
if (matrixSeal.valid !== true) recordFailure("MATRIX_SEAL", matrixSeal);
const correctionSeal = verifySeal(correction, "correctionHash");
if (correctionSeal.valid !== true) recordFailure("CORRECTION_SEAL", correctionSeal);
const baselineSeal = verifySeal(baseline, "baselineHash");
if (baselineSeal.valid !== true) recordFailure("BASELINE_SEAL", baselineSeal);

const priorPrefix = "version-1.12.35-boolean-predicate-successor-v1";
const priorProof = readJson(path.join(evidenceRoot, `${priorPrefix}-offline-proof-result.json`));
const priorStop = readJson(path.join(evidenceRoot, `${priorPrefix}-terminal-stop.json`));
const priorCombined = readJson(path.join(evidenceRoot, `${priorPrefix}-combined-result.json`));
const priorFailureExact = verifySeal(priorProof, "proofHash").valid === true && priorProof.status === "FAIL" && priorProof.executionCount === 1 && priorProof.sweepMembersExecuted === 0 && Array.isArray(priorProof.failures) === true && priorProof.failures.length === 1 && priorProof.failures[0].gate === "RETAINED_RC" && verifySeal(priorStop, "terminalStopHash").valid === true && priorStop.releaseState === "UNRELEASED" && priorStop.activity.pushes === 0 && verifySeal(priorCombined, "combinedResultHash").valid === true && priorCombined.totals.newlyExecuted === 0;
if (priorFailureExact !== true) recordFailure("PRIOR_FAILURE_BINDING", { priorProofStatus: priorProof.status, failureCount: Array.isArray(priorProof.failures) === true ? priorProof.failures.length : null });

const scripts = ["identity.mjs", "contract.mjs", "gates.mjs", "runner.mjs", "execute.mjs", "build.mjs", "offline-proof.mjs", "finalize.mjs"].map((suffix) => path.join(evidenceRoot, `${prefix}-${suffix}`));
const parseResults = scripts.map((scriptPath) => {
  const result = childProcess.spawnSync(process.execPath, ["--check", scriptPath], { cwd: ROOT, encoding: "utf8", windowsHide: true, shell: false });
  let spawnErrorAbsent = false;
  try { requireOwnAbsent(result, "error", "parseResult"); spawnErrorAbsent = true; } catch { spawnErrorAbsent = false; }
  return { relativePath: path.relative(ROOT, scriptPath).replaceAll("\\", "/"), exitCode: result.status, stderrSha256: sha256(typeof result.stderr === "string" ? result.stderr : ""), spawnErrorAbsent, passed: result.status === 0 && spawnErrorAbsent === true };
});
if (parseResults.every((item) => item.passed === true) !== true) recordFailure("SCRIPT_PARSE", parseResults.filter((item) => item.passed !== true));

const pendingEntries = Array.isArray(registry.entries) === true ? registry.entries.filter((entry) => entry.state === "PENDING") : [];
const processResults = pendingEntries.map((entry) => {
  let executableExists = false;
  if (typeof entry.executable === "string" && path.isAbsolute(entry.executable) === true) executableExists = fs.existsSync(entry.executable) === true;
  else if (typeof entry.executable === "string") {
    const whereResult = childProcess.spawnSync("where.exe", [entry.executable], { cwd: ROOT, encoding: "utf8", windowsHide: true, shell: false });
    let whereErrorAbsent = false;
    try { requireOwnAbsent(whereResult, "error", `${entry.id}.whereResult`); whereErrorAbsent = true; } catch { whereErrorAbsent = false; }
    executableExists = whereResult.status === 0 && whereErrorAbsent === true;
  }
  const scriptArguments = entry.arguments.filter((argument) => /\.(?:mjs|ps1)$/i.test(argument));
  const check = {
    executableExists,
    workingDirectoryExists: fs.existsSync(entry.workingDirectory) === true,
    scriptArgumentsExist: scriptArguments.every((argument) => fs.existsSync(argument) === true),
    argumentRoundTripExact: compactJson(JSON.parse(compactJson(entry.arguments))) === compactJson(entry.arguments),
    noInlineNode: entry.arguments.includes("-e") !== true && entry.arguments.includes("--eval") !== true && entry.arguments.includes("--input-type=module") !== true,
    shell: entry.shell,
  };
  const expectations = { executableExists: true, workingDirectoryExists: true, scriptArgumentsExist: true, argumentRoundTripExact: true, noInlineNode: true, shell: false };
  const failedFields = Object.entries(expectations).filter(([field, expected]) => check[field] !== expected).map(([field, expected]) => ({ field, expected, actual: check[field] }));
  return { id: entry.id, check, failedFields, passed: failedFields.length === 0 };
});
if (processResults.length !== 40 || processResults.every((item) => item.passed === true) !== true) recordFailure("PROCESS_CONTRACT", processResults.filter((item) => item.passed !== true));

const booleanCases = booleanContractDefinitions.flatMap((definition) => booleanMatrixRepresentations.map((representation) => runBooleanMatrixCase(definition, representation)));
const inheritedTypedCases = typedMatrixDefinitions.flatMap((definition) => definition.representations.map((representation) => runTypedMatrixCase(definition, representation)));
const ownAbsenceCases = presenceRepresentations.map(runOwnAbsenceCase);
const inventorySetCases = inventorySetRepresentations.map(runInventorySetCase);
const predicateCases = [...booleanCases, ...inheritedTypedCases, ...ownAbsenceCases, ...inventorySetCases];
const failedPredicateCases = predicateCases.filter((item) => item.matchesExpectation !== true);
if (failedPredicateCases.length !== 0) recordFailure("PREDICATE_MATRIX", failedPredicateCases);
if (predicateCases.length !== matrix.totalCaseCount) recordFailure("PREDICATE_CASE_COUNT", { actual: predicateCases.length, expected: matrix.totalCaseCount });

const expectedMutable = baseline.mutableOutputRoots[0];
const mutableComparison = compareInventories(expectedMutable.inventory, inventoryRoot(expectedMutable.absoluteRoot, { pathBase: expectedMutable.pathBase }));
const quarantineComparison = compareInventories(baseline.retainedQuarantine.inventory, inventoryRoot(baseline.retainedQuarantine.absoluteRoot, { pathBase: baseline.retainedQuarantine.absoluteRoot }));
const phaseRoot = path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd");
const phaseComparison = compareInventories(baseline.phase6a.directory, inventoryRoot(phaseRoot, { pathBase: phaseRoot }));
for (const [gate, comparison] of [["MUTABLE_BASELINE", mutableComparison], ["QUARANTINE_BASELINE", quarantineComparison], ["PHASE6A_DIRECTORY", phaseComparison]]) if (comparison.equal !== true) recordFailure(gate, comparison);
const manifestPath = path.join(ROOT, baseline.phase6a.invocationManifest.relativePath);
const phaseManifestExact = fs.existsSync(manifestPath) === true && sha256(fs.readFileSync(manifestPath)) === "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466";
if (phaseManifestExact !== true) recordFailure("PHASE6A_MANIFEST", { exists: fs.existsSync(manifestPath) === true });

const rcRoot = path.join(ROOT, "test-results/playwright");
const rc = inventoryRoot(rcRoot, { pathBase: rcRoot });
const expectedRc = baseline.diagnosticInventories.retainedRc;
const rcSetComparison = compareInventoryMemberSets(expectedRc.files, rc.files);
const adjudication = readJson(path.join(evidenceRoot, "version-1.12.35-playwright-shared-fixture-adjudication.json"));
const adjudicationMembers = adjudicationTuplesToMembers(adjudication.retainedCapture.members);
const adjudicationSetComparison = compareInventoryMemberSets(expectedRc.files, adjudicationMembers);
const retainedRcExact = rcSetComparison.equal === true && adjudicationSetComparison.equal === true && rc.fileCount === 39 && rc.totalBytes === 3864482 && expectedRc.pathSetSha256 === "f63ef7d3b833fb97fa10021ea5e3e5b601dc368221355963735cf2e1812e2124" && expectedRc.aggregateSha256 === "743275cbda857f57707a325796490c730be2e5e0fb823276e0dc8bbde0734735" && rcSetComparison.reboundPathSetSha256 === expectedRc.pathSetSha256 && rcSetComparison.reboundAggregateSha256 === expectedRc.aggregateSha256 && adjudication.retainedCapture.pathSetSha256 === expectedRc.pathSetSha256 && adjudication.retainedCapture.aggregateSha256 === expectedRc.aggregateSha256;
if (retainedRcExact !== true) recordFailure("RETAINED_RC", { fileCount: rc.fileCount, totalBytes: rc.totalBytes, rcSetComparison, adjudicationSetComparison });

const curlyFixture = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-curly-apostrophe-fixture.json"));
const curlyBasis = structuredClone(curlyFixture);
delete curlyBasis.fixtureHash;
const curlyMembers = rc.files.filter((file) => Buffer.from(file.relativePath, "utf8").includes(Buffer.from([0xe2, 0x80, 0x99])));
const curlySetComparison = compareInventoryMemberSets(curlyFixture.members, curlyMembers);
const curlyExact = curlyMembers.length === 6 && curlySetComparison.equal === true && curlyFixture.fixtureHash === sha256(compactJson(curlyBasis));
if (curlyExact !== true) recordFailure("UTF8_CURLY_APOSTROPHE", { memberCount: curlyMembers.length, curlySetComparison });

const git = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim();
const repositoryIdentity = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), tracking: git(["rev-parse", "@{u}"]), trackedDiff: git(["diff", "--name-only", "HEAD"]), stagedDiff: git(["diff", "--cached", "--name-only"]) };
const repositoryIdentityExact = repositoryIdentity.branch === "refactor/beta-evidence-pipeline" && repositoryIdentity.head === "5da4c3de47a2860495087bacacdd60ac3c65603b" && repositoryIdentity.tree === "d5c162ae6777c6e080ac27de0d9a0ae29fda8ace" && repositoryIdentity.tracking === "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35" && repositoryIdentity.trackedDiff === "" && repositoryIdentity.stagedDiff === "";
if (repositoryIdentityExact !== true) recordFailure("REPOSITORY_IDENTITY", repositoryIdentity);
const untracked = childProcess.execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
const phaseUntracked = untracked.filter((item) => item.includes("phase6a-e3caa2fd"));
const unexpectedUntracked = untracked.filter((item) => item.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") !== true && item !== "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json" && item.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${prefix}-`) !== true);
if (phaseUntracked.length !== 85) recordFailure("PHASE6A_UNTRACKED_COUNT", phaseUntracked.length);
if (unexpectedUntracked.length !== 0) recordFailure("UNEXPECTED_UNTRACKED", unexpectedUntracked);

const trackedFiles = childProcess.execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0);
const successorNames = [...scripts, schemaPath, matrixPath, registryPath, correctionPath].map((item) => path.basename(item));
const dependencyReferences = [];
for (const relativePath of trackedFiles) {
  let source;
  try { source = fs.readFileSync(path.join(ROOT, relativePath), "utf8"); } catch { continue; }
  for (const name of successorNames) if (source.includes(name) === true) dependencyReferences.push({ relativePath: relativePath.replaceAll("\\", "/"), name });
}
if (dependencyReferences.length !== 0) recordFailure("SUCCESSOR_DEPENDENCY_ISOLATION", dependencyReferences);

const counts = { entries: registry.entries.length, uniqueEntries: new Set(registry.entries.map((entry) => entry.id)).size, retainedPass: registry.entries.filter((entry) => entry.state === "RETAINED_PASS").length, pendingStatic: registry.entries.filter((entry) => entry.state === "PENDING" && entry.kind === "STATIC").length, pendingReleaseGates: registry.entries.filter((entry) => entry.state === "PENDING" && entry.kind === "RELEASE_GATE").length };
if (compactJson(counts) !== compactJson({ entries: 68, uniqueEntries: 68, retainedPass: 28, pendingStatic: 25, pendingReleaseGates: 15 })) recordFailure("REGISTRY_COUNTS", counts);
const successorIdentitiesExact = correction.successorPaths.every((item) => fs.existsSync(path.join(ROOT, item.relativePath)) === true && fs.statSync(path.join(ROOT, item.relativePath)).size === item.byteLength && sha256(fs.readFileSync(path.join(ROOT, item.relativePath))) === item.sha256);
if (successorIdentitiesExact !== true) recordFailure("SUCCESSOR_IDENTITIES", correction.successorPaths);

const passed = failures.length === 0;
const proofBasis = {
  schemaVersion: "3.0",
  proofType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_V2_OFFLINE_PROOF",
  status: passed === true ? "PASS" : "FAIL",
  executionCount: 1,
  sweepMembersExecuted: 0,
  priorFailureExact,
  registryContractValid,
  schemaExact,
  registrySeal,
  matrixSeal,
  correctionSeal,
  baselineSeal,
  parseResults,
  processResults,
  predicateMatrix: { totalCases: predicateCases.length, passedCases: predicateCases.filter((item) => item.matchesExpectation === true).length, failedCases: failedPredicateCases.length, cases: predicateCases },
  registryCounts: counts,
  baselines: { mutableComparison, quarantineComparison, phaseComparison, phaseManifestExact, retainedRcExact, rcSetComparison, adjudicationSetComparison, curlyApostropheExact: curlyExact, curlySetComparison },
  repository: { identity: repositoryIdentity, identityExact: repositoryIdentityExact, unexpectedUntracked, phase6aUntrackedCount: phaseUntracked.length },
  dependencyIsolation: { trackedReferences: dependencyReferences, productOrCognitiveDependencies: 0 },
  successorIdentitiesExact,
  failures,
  activity: { credentials: 0, providers: 0, metadata: 0, evaluators: 0, authorities: 0, cases: 0, benchmarks: 0, productHandlers: 0, deployments: 0, remoteWrites: 0 },
};
const proof = sealRecord(proofBasis, "proofHash");
writeCreateOnly(resultPath, proof);
process.stdout.write(`${compactJson({ status: proof.status, tableCaseCount: predicateCases.length, tablePassed: proof.predicateMatrix.passedCases, tableFailed: proof.predicateMatrix.failedCases, processEntryCount: processResults.length, failureCount: failures.length, proofHash: proof.proofHash, resultPath: path.relative(ROOT, resultPath).replaceAll("\\", "/") })}\n`);
process.exit(passed === true ? 0 : 1);
