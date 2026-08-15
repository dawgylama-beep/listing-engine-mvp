import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { booleanContractDefinitions, booleanMatrixRepresentations, requireExactBoolean, runBooleanMatrixCase, runTypedMatrixCase, typedMatrixDefinitions, validateRegistry } from "./version-1.12.35-boolean-predicate-successor-v1-contract.mjs";
import { ROOT, compactJson, compareInventories, inventoryRoot, readJson, sealRecord, sha256, verifySeal, writeCreateOnly } from "./version-1.12.35-boolean-predicate-successor-v1-identity.mjs";

const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v1";
const resultPath = path.join(evidenceRoot, `${prefix}-offline-proof-result.json`);
if (fs.existsSync(resultPath) === true) throw new Error(`CREATE_ONLY_PATH_OCCUPIED:${resultPath}`);
const registryPath = path.join(evidenceRoot, `${prefix}-registry.json`);
const schemaPath = path.join(evidenceRoot, `${prefix}-schema.json`);
const matrixPath = path.join(evidenceRoot, `${prefix}-predicate-matrix.json`);
const correctionPath = path.join(evidenceRoot, `${prefix}-correction.json`);
const baselinePath = path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json");
const registry = readJson(registryPath);
const baseline = readJson(baselinePath);
const schema = readJson(schemaPath);
const matrix = readJson(matrixPath);
const correction = readJson(correctionPath);
const failures = [];
const recordFailure = (gate, details) => failures.push({ gate, details });

let registryContractValid = false;
try { validateRegistry(registry); registryContractValid = true; } catch (error) { recordFailure("REGISTRY_CONTRACT", error.message); }
const schemaExact = schema.type === "object" && schema.additionalProperties === false && schema.properties?.executionRules?.properties?.shell?.const === false && schema.properties?.entries?.items?.properties?.shell?.const === false && schema.properties?.entries?.items?.required?.includes("shell") === true;
if (schemaExact !== true) recordFailure("SCHEMA_EXACTNESS", schema);
const registrySeal = verifySeal(registry, "registryHash"); if (registrySeal.valid !== true) recordFailure("REGISTRY_SEAL", registrySeal);
const matrixSeal = verifySeal(matrix, "matrixHash"); if (matrixSeal.valid !== true) recordFailure("MATRIX_SEAL", matrixSeal);
const correctionSeal = verifySeal(correction, "correctionHash"); if (correctionSeal.valid !== true) recordFailure("CORRECTION_SEAL", correctionSeal);

const scripts = ["contract.mjs", "identity.mjs", "gates.mjs", "runner.mjs", "build.mjs", "offline-proof.mjs", "finalize.mjs"].map((suffix) => path.join(evidenceRoot, `${prefix}-${suffix}`));
const parseResults = scripts.map((scriptPath) => {
  const result = childProcess.spawnSync(process.execPath, ["--check", scriptPath], { cwd: ROOT, encoding: "utf8", windowsHide: true, shell: false });
  return { relativePath: path.relative(ROOT, scriptPath).replaceAll("\\", "/"), exitCode: result.status, stderrSha256: sha256(result.stderr ?? ""), passed: result.status === 0 && result.error === undefined };
});
if (parseResults.every((item) => item.passed === true) !== true) recordFailure("SCRIPT_PARSE", parseResults.filter((item) => item.passed !== true));

const processResults = registry.entries.filter((entry) => entry.state === "PENDING").map((entry) => {
  const executableExists = path.isAbsolute(entry.executable) === true ? fs.existsSync(entry.executable) : childProcess.spawnSync("where.exe", [entry.executable], { encoding: "utf8", windowsHide: true, shell: false }).status === 0;
  const scriptArguments = entry.arguments.filter((argument) => /\.(?:mjs|ps1)$/i.test(argument));
  const check = { executableExists, workingDirectoryExists: fs.existsSync(entry.workingDirectory), scriptArgumentsExist: scriptArguments.every((argument) => fs.existsSync(argument) === true), argumentRoundTripExact: compactJson(JSON.parse(compactJson(entry.arguments))) === compactJson(entry.arguments), noInlineNode: entry.arguments.includes("-e") !== true && entry.arguments.includes("--eval") !== true && entry.arguments.includes("--input-type=module") !== true, shell: entry.shell };
  const fieldExpectations = [{ field: "executableExists", expected: true }, { field: "workingDirectoryExists", expected: true }, { field: "scriptArgumentsExist", expected: true }, { field: "argumentRoundTripExact", expected: true }, { field: "noInlineNode", expected: true }, { field: "shell", expected: false }];
  const fieldResults = fieldExpectations.map(({ field, expected }) => { try { requireExactBoolean(check, field, expected, `${entry.id}.processProof`); return { field, expected, accepted: true }; } catch (error) { return { field, expected, accepted: false, error: error.message }; } });
  return { id: entry.id, check, fieldResults, passed: fieldResults.every((item) => item.accepted === true) };
});
if (processResults.every((item) => item.passed === true) !== true) recordFailure("PROCESS_CONTRACT", processResults.filter((item) => item.passed !== true));

const booleanCases = booleanContractDefinitions.flatMap((definition) => booleanMatrixRepresentations.map((representation) => runBooleanMatrixCase(definition, representation)));
const typedCases = typedMatrixDefinitions.flatMap((definition) => definition.representations.map((representation) => runTypedMatrixCase(definition, representation)));
const predicateCases = [...booleanCases, ...typedCases];
if (predicateCases.every((item) => item.matchesExpectation === true) !== true) recordFailure("PREDICATE_MATRIX", predicateCases.filter((item) => item.matchesExpectation !== true));
if (predicateCases.length !== matrix.booleanCaseCount + matrix.typedCaseCount) recordFailure("PREDICATE_CASE_COUNT", { actual: predicateCases.length, expected: matrix.booleanCaseCount + matrix.typedCaseCount });

const expectedMutable = baseline.mutableOutputRoots[0];
const mutableComparison = compareInventories(expectedMutable.inventory, inventoryRoot(expectedMutable.absoluteRoot, { pathBase: expectedMutable.pathBase }));
const quarantineComparison = compareInventories(baseline.retainedQuarantine.inventory, inventoryRoot(baseline.retainedQuarantine.absoluteRoot, { pathBase: baseline.retainedQuarantine.absoluteRoot }));
const phaseRoot = path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd");
const phaseComparison = compareInventories(baseline.phase6a.directory, inventoryRoot(phaseRoot, { pathBase: phaseRoot }));
for (const [gate, comparison] of [["MUTABLE_BASELINE", mutableComparison], ["QUARANTINE_BASELINE", quarantineComparison], ["PHASE6A_DIRECTORY", phaseComparison]]) if (comparison.equal !== true) recordFailure(gate, comparison);
const manifestPath = path.join(ROOT, baseline.phase6a.invocationManifest.relativePath);
const phaseManifestExact = sha256(fs.readFileSync(manifestPath)) === "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466";
if (phaseManifestExact !== true) recordFailure("PHASE6A_MANIFEST", sha256(fs.readFileSync(manifestPath)));

const adjudication = readJson(path.join(evidenceRoot, "version-1.12.35-playwright-shared-fixture-adjudication.json"));
const rcRoot = path.join(ROOT, "test-results/playwright");
const rc = inventoryRoot(rcRoot, { pathBase: rcRoot });
const rcTuples = rc.files.map((file) => [file.relativePath, file.byteLength, file.sha256]);
const rcExact = compactJson(rcTuples) === compactJson(adjudication.retainedCapture.members) && rc.fileCount === 39 && rc.totalBytes === 3864482 && adjudication.retainedCapture.pathSetSha256 === "f63ef7d3b833fb97fa10021ea5e3e5b601dc368221355963735cf2e1812e2124" && adjudication.retainedCapture.aggregateSha256 === "743275cbda857f57707a325796490c730be2e5e0fb823276e0dc8bbde0734735";
if (rcExact !== true) recordFailure("RETAINED_RC", { fileCount: rc.fileCount, totalBytes: rc.totalBytes });
const curlyFixture = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-curly-apostrophe-fixture.json"));
const curlyBasis = structuredClone(curlyFixture); delete curlyBasis.fixtureHash;
const curlyMembers = rc.files.filter((file) => Buffer.from(file.relativePath, "utf8").includes(Buffer.from([0xe2, 0x80, 0x99])));
const curlyExact = curlyMembers.length === 6 && compactJson(curlyMembers) === compactJson(curlyFixture.members) && curlyFixture.fixtureHash === sha256(compactJson(curlyBasis));
if (curlyExact !== true) recordFailure("UTF8_CURLY_APOSTROPHE", { memberCount: curlyMembers.length });

const statusDiff = childProcess.execFileSync("git", ["diff", "--name-only", "HEAD"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim();
const stagedDiff = childProcess.execFileSync("git", ["diff", "--cached", "--name-only"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim();
if (statusDiff !== "" || stagedDiff !== "") recordFailure("COMMITTED_BYTES_CHANGED", { statusDiff, stagedDiff });
const untracked = childProcess.execFileSync("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
const unexpectedUntracked = untracked.filter((item) => item.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") !== true && item !== "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json" && item.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${prefix}-`) !== true);
if (unexpectedUntracked.length !== 0) recordFailure("UNEXPECTED_UNTRACKED", unexpectedUntracked);
const phaseUntracked = untracked.filter((item) => item.includes("phase6a-e3caa2fd"));
if (phaseUntracked.length !== 85) recordFailure("PHASE6A_UNTRACKED_COUNT", phaseUntracked.length);

const trackedFiles = childProcess.execFileSync("git", ["ls-files", "-z"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0);
const successorNames = [...scripts, schemaPath, matrixPath, registryPath, correctionPath].map((item) => path.basename(item));
const dependencyReferences = [];
for (const relativePath of trackedFiles) { let text; try { text = fs.readFileSync(path.join(ROOT, relativePath), "utf8"); } catch { continue; } for (const name of successorNames) if (text.includes(name) === true) dependencyReferences.push({ relativePath: relativePath.replaceAll("\\", "/"), name }); }
if (dependencyReferences.length !== 0) recordFailure("SUCCESSOR_DEPENDENCY_ISOLATION", dependencyReferences);

const counts = { entries: registry.entries.length, uniqueEntries: new Set(registry.entries.map((entry) => entry.id)).size, retainedPass: registry.entries.filter((entry) => entry.state === "RETAINED_PASS").length, pendingStatic: registry.entries.filter((entry) => entry.state === "PENDING" && entry.kind === "STATIC").length, pendingReleaseGates: registry.entries.filter((entry) => entry.state === "PENDING" && entry.kind === "RELEASE_GATE").length };
if (compactJson(counts) !== compactJson({ entries: 68, uniqueEntries: 68, retainedPass: 28, pendingStatic: 25, pendingReleaseGates: 15 })) recordFailure("REGISTRY_COUNTS", counts);
const successorIdentitiesExact = correction.successorPaths.every((item) => fs.existsSync(path.join(ROOT, item.relativePath)) === true && fs.statSync(path.join(ROOT, item.relativePath)).size === item.byteLength && sha256(fs.readFileSync(path.join(ROOT, item.relativePath))) === item.sha256);
if (successorIdentitiesExact !== true) recordFailure("SUCCESSOR_IDENTITIES", correction.successorPaths);

const passed = failures.length === 0;
const proofBasis = {
  schemaVersion: "2.0", proofType: "VERSION_1_12_35_BOOLEAN_PREDICATE_SUCCESSOR_OFFLINE_PROOF", status: passed === true ? "PASS" : "FAIL", executionCount: 1, sweepMembersExecuted: 0,
  registryContractValid, schemaExact, registrySeal, matrixSeal, correctionSeal, parseResults, processResults, predicateMatrix: { totalCases: predicateCases.length, passedCases: predicateCases.filter((item) => item.matchesExpectation === true).length, failedCases: predicateCases.filter((item) => item.matchesExpectation !== true).length, cases: predicateCases },
  registryCounts: counts, baselines: { mutableComparison, quarantineComparison, phaseComparison, phaseManifestExact, retainedRcExact: rcExact, curlyApostropheExact: curlyExact },
  repository: { previouslyCommittedBytesChanged: false, stagedChanges: false, unexpectedUntracked, phase6aUntrackedCount: phaseUntracked.length }, dependencyIsolation: { trackedReferences: dependencyReferences, productOrCognitiveDependencies: 0 }, successorIdentitiesExact, failures,
  activity: { credentials: 0, providers: 0, metadata: 0, evaluators: 0, authorities: 0, cases: 0, benchmarks: 0, productHandlers: 0, deployments: 0, remoteWrites: 0 },
};
const proof = sealRecord(proofBasis, "proofHash");
writeCreateOnly(resultPath, proof);
process.stdout.write(`${compactJson({ status: proof.status, tableCaseCount: predicateCases.length, tablePassed: proof.predicateMatrix.passedCases, tableFailed: proof.predicateMatrix.failedCases, processEntryCount: processResults.length, failureCount: failures.length, proofHash: proof.proofHash, resultPath: path.relative(ROOT, resultPath).replaceAll("\\", "/") })}\n`);
process.exit(passed === true ? 0 : 1);
