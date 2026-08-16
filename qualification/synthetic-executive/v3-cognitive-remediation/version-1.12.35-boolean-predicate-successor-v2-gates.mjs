import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  requireExactBoolean,
  requireExactInteger,
  requireExactKeys,
  requireExactString,
  requireExactStringArray,
  requireOwnPlainObject,
} from "./version-1.12.35-boolean-predicate-successor-v2-contract.mjs";
import { ROOT, compactJson, compareInventories, inventoryRoot, readJson, requireOwnAbsent, sha256, verifySeal } from "./version-1.12.35-boolean-predicate-successor-v2-identity.mjs";

const gate = process.argv[2];
if (typeof gate !== "string" || gate.length === 0) throw new Error("GATE_NAME_REQUIRED");
const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v2";
const baseline = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json"));
const fail = (code, details = {}) => { process.stdout.write(`${compactJson({ gate, status: "FAIL", code, ...details })}\n`); process.exit(1); };
const pass = (details = {}) => process.stdout.write(`${compactJson({ gate, status: "PASS", ...details })}\n`);
const git = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim();
const gitZ = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0);
const verifyBoundSeal = (relativePath, field, expected) => {
  const record = readJson(path.join(ROOT, relativePath));
  const verified = verifySeal(record, field);
  if (verified.valid !== true || verified.declared !== expected) fail("SEALED_IDENTITY_MISMATCH", { relativePath, field, ...verified, expected });
  return { relativePath, field, hash: verified.computed };
};

if (gate === "browser-retained") {
  const prior = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-sweep-result.json"));
  const priorSeal = verifySeal(prior, "resultHash");
  const member = prior.matrix.static.find((entry) => entry.id === "STATIC-028");
  const browser = prior.browserExecution;
  let exact = priorSeal.valid === true && priorSeal.declared === "c6c6aa3f00aebf7e3f7e448da9133fe3dbd785a848ac6f87c2cf0afd5f169f19" && member !== undefined;
  try {
    requireExactString(member, "status", "PASS", "STATIC-028");
    requireExactInteger(member, "executionCount", 1, "STATIC-028");
    requireExactString(browser, "commandStatus", "PASS", "browserExecution");
    requireExactInteger(browser, "canonicalTestDefinitions", 6, "browserExecution");
    requireExactStringArray(browser, "projects", ["desktop", "mobile"], "browserExecution");
    requireExactInteger(browser, "canonicalProjectInstances", 12, "browserExecution");
    requireExactInteger(browser, "attemptsPerCanonicalProjectInstance", 1, "browserExecution");
    requireExactInteger(browser, "workers", 1, "browserExecution");
    requireExactInteger(browser, "retries", 0, "browserExecution");
  } catch { exact = false; }
  if (exact !== true) fail("RETAINED_BROWSER_RESULT_MISMATCH", { priorSeal, member, browser });
  pass({ retained: true, canonicalProjectInstances: 12, attemptsPerCanonicalProjectInstance: 1, projects: ["desktop", "mobile"], workers: 1, retries: 0, priorResultHash: priorSeal.declared });
} else if (gate === "frontend-credential-scan") {
  const inventory = inventoryRoot(path.join(ROOT, "public"), { pathBase: ROOT });
  const patterns = [["PROVIDER_KEY_LITERAL", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g], ["AUTHORIZATION_BEARER_VALUE", /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{12,}/gi], ["PROVIDER_CREDENTIAL_ENV_NAME", /\b(?:OPENAI_API_KEY|OPEN_API_KEY|SERPER_API_KEY)\b/g]];
  const findings = [];
  const unreadable = [];
  for (const file of inventory.files) {
    let source;
    try { source = fs.readFileSync(path.join(ROOT, file.relativePath), "utf8"); } catch { unreadable.push(file.relativePath); continue; }
    for (const [kind, pattern] of patterns) { pattern.lastIndex = 0; if (pattern.test(source) === true) findings.push({ relativePath: file.relativePath, kind }); }
  }
  if (unreadable.length !== 0) fail("FRONTEND_SCAN_UNREADABLE_FILES", { unreadable });
  if (findings.length !== 0) fail("FRONTEND_CREDENTIAL_FINDINGS", { filesScanned: inventory.fileCount, findings });
  pass({ filesScanned: inventory.fileCount, unreadable: [], findings: [] });
} else if (gate === "governing-secret-scan") {
  const tracked = gitZ(["ls-files", "-z"]).map((item) => item.replaceAll("\\", "/"));
  const untracked = gitZ(["ls-files", "--others", "--exclude-standard", "-z"]).map((item) => item.replaceAll("\\", "/"));
  const candidates = [...new Set([...tracked, ...untracked])].filter((item) => item.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") !== true && item !== "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json").sort();
  const patterns = [["OPENAI_KEY", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g], ["AWS_KEY", /\bAKIA[0-9A-Z]{16}\b/g], ["PRIVATE_KEY", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{100,}?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g], ["BEARER_VALUE", /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{20,}/gi]];
  const findings = [];
  const unreadable = [];
  let scanned = 0;
  for (const relativePath of candidates) {
    let source;
    try { source = fs.readFileSync(path.join(ROOT, relativePath), "utf8"); } catch { unreadable.push(relativePath); continue; }
    scanned += 1;
    for (const [kind, pattern] of patterns) {
      pattern.lastIndex = 0;
      for (const match of source.matchAll(pattern)) if (/(?:test|fake|example|dummy|redact|placeholder|fixture|synthetic|mock)/i.test(match[0]) !== true) findings.push({ relativePath, kind });
    }
  }
  if (unreadable.length !== 0) fail("SECRET_SCAN_UNREADABLE_FILES", { filesScanned: scanned, credentialValuesRead: 0, unreadable });
  if (findings.length !== 0) fail("SECRET_FINDINGS", { filesScanned: scanned, credentialValuesRead: 0, findings });
  pass({ filesScanned: scanned, credentialValuesRead: 0, unreadable: [], findings: [] });
} else if (gate === "server-check") {
  const powershell = "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
  const source = path.join(ROOT, "server.ps1");
  const expectedSha256 = "94aa0379deb24dbdb3feef8fe422f7b3a28116ae6cc218ef21826e4be564a9fc";
  if (sha256(fs.readFileSync(source)) !== expectedSha256) fail("SERVER_SOURCE_IDENTITY_MISMATCH");
  if (typeof process.env.TEMP !== "string" || process.env.TEMP.length === 0) fail("TEMP_DIRECTORY_UNAVAILABLE");
  const resolvedTemp = path.resolve(process.env.TEMP);
  const temporaryRoot = fs.mkdtempSync(path.join(resolvedTemp, "k35-boolean-successor-v2-server-"));
  if (path.dirname(temporaryRoot) !== resolvedTemp) fail("TEMPORARY_ROOT_OUTSIDE_EXPECTED_PARENT");
  const temporaryScript = path.join(temporaryRoot, "server.ps1");
  try {
    fs.copyFileSync(source, temporaryScript, fs.constants.COPYFILE_EXCL);
    if (fs.existsSync(path.join(temporaryRoot, ".env")) === true) fail("TEMPORARY_SERVER_ROOT_CONTAINS_DOTENV");
    const arguments_ = ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", temporaryScript, "-Check"];
    const result = childProcess.spawnSync(powershell, arguments_, { cwd: temporaryRoot, encoding: "utf8", windowsHide: true, shell: false });
    let spawnErrorAbsent = false;
    try { requireOwnAbsent(result, "error", "serverCheck.spawnResult"); spawnErrorAbsent = true; } catch { spawnErrorAbsent = false; }
    if (result.status !== 0 || spawnErrorAbsent !== true) fail("SERVER_CHECK_FAILED", { exitCode: result.status, stdoutSha256: sha256(typeof result.stdout === "string" ? result.stdout : ""), stderrSha256: sha256(typeof result.stderr === "string" ? result.stderr : ""), spawnErrorAbsent });
    pass({ exitCode: 0, executable: powershell, arguments: arguments_.map((item) => item === temporaryScript ? "<TEMP>/server.ps1" : item), sourceSha256: expectedSha256, credentialAccesses: 0 });
  } finally {
    if (path.dirname(temporaryRoot) !== resolvedTemp) throw new Error("REFUSING_UNSAFE_TEMP_DELETE");
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
} else if (gate === "candidate-reconciliation") {
  const status = gitZ(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  const unexpected = status.filter((entry) => {
    const relativePath = entry.slice(3).replaceAll("\\", "/");
    const phase6a = relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") || relativePath === "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json";
    const successor = relativePath.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${prefix}-`);
    return entry.startsWith("?? ") !== true || (phase6a !== true && successor !== true);
  });
  const resultRoot = path.join(evidenceRoot, `${prefix}-member-results`);
  const staticResults = fs.existsSync(resultRoot) === true ? fs.readdirSync(resultRoot).filter((name) => /^STATIC-(?:0(?:29|3\d|4\d|5[0-3]))\.json$/.test(name)).sort() : [];
  const expectedStaticResults = Array.from({ length: 25 }, (_, index) => `STATIC-${String(index + 29).padStart(3, "0")}.json`).sort();
  const identity = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), tracking: git(["rev-parse", "@{u}"]), staged: git(["diff", "--cached", "--name-only"]) };
  const exact = identity.branch === "refactor/beta-evidence-pipeline" && identity.head === "5da4c3de47a2860495087bacacdd60ac3c65603b" && identity.tree === "d5c162ae6777c6e080ac27de0d9a0ae29fda8ace" && identity.tracking === "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35" && identity.staged === "" && unexpected.length === 0 && compactJson(staticResults) === compactJson(expectedStaticResults);
  if (exact !== true) fail("CANDIDATE_RECONCILIATION_MISMATCH", { identity, unexpected, staticResults, expectedStaticResults });
  pass({ ...identity, unexpected: [], staticResults });
} else if (gate === "frozen-identities") {
  pass({ verified: [verifyBoundSeal("qualification/synthetic-executive/v3-cognitive-remediation/cognitive-freeze.json", "freezeHash", "f0127ed29a1fe40fdd08936712ad09ff884405dbf8c81147f5709e3f2c2eb194"), verifyBoundSeal("qualification/synthetic-executive/v3-cognitive-remediation/v3-release-binding-successor-executable-freeze.json", "successorFreezeHash", "45f7779d2ad4a16f3a99bc4eadd994a93edf40776d26f39a0c9016c43db37f02"), verifyBoundSeal("qualification/synthetic-executive/v3-held-out-corpus/corpus-seal.json", "corpusSealHash", "61c67cf5a725ea0eab6d02e8f3ac4ece6bc02fb0fd8e2dffb378878db8bc1061")] });
} else if (gate === "execution-evidence") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/provider-execution-summary.json", "executionSummaryHash", "db8a93fe918037e883da8b2cd8bc3a29f4cec3ecba0ff4576acc103b0cb7be91");
  const record = readJson(path.join(ROOT, verified.relativePath));
  const expectedOrder = Array.from({ length: 14 }, (_, index) => `KE-V3-C${String(index + 1).padStart(2, "0")}`);
  const expectedActivityKeys = ["benchmarkReplays", "calibrationRequests", "caseReplays", "corpusMutations", "crossCaseMemoryReads", "deployments", "memoryPromotions", "merges", "metadataRequests", "modelSubstitutions", "previewActivity", "productHandlerCalls", "productionActivity", "realWorkerCalls"];
  let exact = true;
  try {
    requireExactBoolean(record, "integrityValid", true, "executionSummary");
    requireExactBoolean(record, "providerVisibleExecutionClosed", true, "executionSummary");
    requireExactStringArray(record, "exactCaseOrder", expectedOrder, "executionSummary");
    const activity = requireOwnPlainObject(record, "unauthorizedActivity", "executionSummary");
    requireExactKeys(activity, expectedActivityKeys, "executionSummary.unauthorizedActivity");
    for (const key of expectedActivityKeys) requireExactInteger(activity, key, 0, "executionSummary.unauthorizedActivity");
  } catch { exact = false; }
  if (exact !== true) fail("EXECUTION_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "evaluation-evidence") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/blind-evaluation.json", "evaluationHash", "d6af8dda6c602cc08bb9de1a4ba31650ca17631d1a8801445ba453bf374b820d");
  const record = readJson(path.join(ROOT, verified.relativePath));
  let exact = true;
  try { requireExactBoolean(record, "qualified", false, "blindEvaluation"); requireExactInteger(record, "passedChecks", 67, "blindEvaluation"); requireExactInteger(record, "totalChecks", 98, "blindEvaluation"); requireExactBoolean(record, "safetyCriticalPass", false, "blindEvaluation"); requireExactBoolean(record, "fatalGatePass", false, "blindEvaluation"); } catch { exact = false; }
  if (exact !== true) fail("EVALUATION_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "evaluator-audit") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/evaluator-access-audit.json", "proofHash", "9a992a1dae9fc9d6da2ca1f7e8cd3e092b21ba6ef81a1d1e1744cba74add6f02");
  const record = readJson(path.join(ROOT, verified.relativePath));
  let exact = true;
  try { requireExactBoolean(record, "providerExecutionClosedBeforeEvaluatorAccess", true, "evaluatorAudit"); requireExactInteger(record, "evaluatorProviderCalls", 0, "evaluatorAudit"); requireExactInteger(record, "evaluatorModelCalls", 0, "evaluatorAudit"); requireExactBoolean(record, "hiddenKeysExposedToProvider", false, "evaluatorAudit"); requireExactBoolean(record, "scoringRulesExposedToProvider", false, "evaluatorAudit"); } catch { exact = false; }
  if (exact !== true) fail("AUDIT_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "result-seal") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/qualification-result-seal.json", "resultSealHash", "86051c9465bf5eabfac5dfe9f7056663810108a355eb994ed3daed6e801c5750");
  const record = readJson(path.join(ROOT, verified.relativePath));
  let exact = true;
  try { requireExactBoolean(record, "qualified", false, "resultSeal"); requireExactBoolean(record, "noMemoryPromotion", true, "resultSeal"); requireExactBoolean(record, "noMergeOrDeployment", true, "resultSeal"); requireExactBoolean(record, "noProductActivation", true, "resultSeal"); requireExactString(record, "evaluationHash", "d6af8dda6c602cc08bb9de1a4ba31650ca17631d1a8801445ba453bf374b820d", "resultSeal"); } catch { exact = false; }
  if (exact !== true) fail("RESULT_SEAL_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "phase6a") {
  const phaseRoot = path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd");
  const directory = inventoryRoot(phaseRoot, { pathBase: phaseRoot });
  const comparison = compareInventories(baseline.phase6a.directory, directory);
  const manifestPath = path.join(ROOT, baseline.phase6a.invocationManifest.relativePath);
  const exact = comparison.equal === true && directory.fileCount === 84 && directory.totalBytes + fs.statSync(manifestPath).size === 72299353 && sha256(fs.readFileSync(manifestPath)) === "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466" && baseline.phase6a.sealedInventoryHash === "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f" && baseline.phase6a.sealedPathSetHash === "d2edc95cbc9cc727a5adeaccffde68763cc5831356c4d4ec371741b6da269581";
  if (exact !== true) fail("PHASE6A_IDENTITY_MISMATCH", { comparison, directoryFileCount: directory.fileCount });
  pass({ fileCount: 85, totalBytes: 72299353, inventoryHash: "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f", pathSetHash: "d2edc95cbc9cc727a5adeaccffde68763cc5831356c4d4ec371741b6da269581", invocationManifestHash: "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466" });
} else if (gate === "repository-integrity") {
  const actual = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), tracking: git(["rev-parse", "@{u}"]) };
  const expected = { branch: "refactor/beta-evidence-pipeline", head: "5da4c3de47a2860495087bacacdd60ac3c65603b", tree: "d5c162ae6777c6e080ac27de0d9a0ae29fda8ace", tracking: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35" };
  const correction = readJson(path.join(evidenceRoot, `${prefix}-correction.json`));
  const correctionSeal = verifySeal(correction, "correctionHash");
  const exact = compactJson(actual) === compactJson(expected) && readJson(path.join(ROOT, "package.json")).version === "1.12.35" && sha256(fs.readFileSync(path.join(ROOT, "tests/browser/canonical-evidence.spec.mjs"))) === "e2f2eb4aa96e9fd4850d59bc0b89638a3df63ead5c8ffc821f9cee2d23ab5af4" && correctionSeal.valid === true;
  if (exact !== true) fail("REPOSITORY_INTEGRITY_MISMATCH", { actual, expected, correctionSeal });
  pass({ ...actual, correctionHash: correctionSeal.declared, classification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION", releaseState: "UNRELEASED" });
} else {
  fail("UNKNOWN_GATE");
}
