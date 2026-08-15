import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { ROOT, compactJson, compareInventories, inventoryRoot, readJson, sha256, verifySeal } from "./version-1.12.35-boolean-predicate-successor-v1-identity.mjs";

const gate = process.argv[2];
if (typeof gate !== "string" || gate.length === 0) throw new Error("GATE_NAME_REQUIRED");
const evidenceRoot = path.join(ROOT, "qualification/synthetic-executive/v3-cognitive-remediation");
const prefix = "version-1.12.35-boolean-predicate-successor-v1";
const baseline = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-continuation-baseline.json"));
const fail = (code, details = {}) => { process.stdout.write(`${compactJson({ gate, status: "FAIL", code, ...details })}\n`); process.exit(1); };
const pass = (details = {}) => process.stdout.write(`${compactJson({ gate, status: "PASS", ...details })}\n`);
const git = (args) => childProcess.execFileSync("git", args, { cwd: ROOT, encoding: "utf8", windowsHide: true }).trim();
const verifyBoundSeal = (relativePath, field, expected) => {
  const record = readJson(path.join(ROOT, relativePath));
  const verified = verifySeal(record, field);
  if (verified.valid !== true || verified.declared !== expected) fail("SEALED_IDENTITY_MISMATCH", { relativePath, field, ...verified, expected });
  return { relativePath, field, hash: verified.computed };
};

if (gate === "browser-retained") {
  const prior = readJson(path.join(evidenceRoot, "version-1.12.35-exhaustive-sweep-result.json"));
  const member = prior.matrix.static.find((entry) => entry.id === "STATIC-028");
  const browser = prior.browserExecution;
  const exact = member !== undefined && member.status === "PASS" && member.executionCount === 1 && browser.commandStatus === "PASS" && browser.canonicalProjectInstances === 12 && browser.attemptsPerCanonicalProjectInstance === 1 && Array.isArray(browser.projects) === true && browser.projects.length === 2 && browser.workers === 1 && browser.retries === 0;
  if (exact !== true) fail("RETAINED_BROWSER_RESULT_MISMATCH", { member, browser });
  pass({ retained: true, canonicalProjectInstances: 12, attemptsPerCanonicalProjectInstance: 1, projects: browser.projects, workers: 1, retries: 0 });
} else if (gate === "frontend-credential-scan") {
  const inventory = inventoryRoot(path.join(ROOT, "public"), { pathBase: ROOT });
  const patterns = [["PROVIDER_KEY_LITERAL", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g], ["AUTHORIZATION_BEARER_VALUE", /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{12,}/gi], ["PROVIDER_CREDENTIAL_ENV_NAME", /\b(?:OPENAI_API_KEY|OPEN_API_KEY|SERPER_API_KEY)\b/g]];
  const findings = [];
  for (const file of inventory.files) {
    const text = fs.readFileSync(path.join(ROOT, file.relativePath), "utf8");
    for (const [kind, pattern] of patterns) { pattern.lastIndex = 0; if (pattern.test(text) === true) findings.push({ relativePath: file.relativePath, kind }); }
  }
  if (findings.length !== 0) fail("FRONTEND_CREDENTIAL_FINDINGS", { filesScanned: inventory.fileCount, findings });
  pass({ filesScanned: inventory.fileCount, findings: [] });
} else if (gate === "governing-secret-scan") {
  const tracked = git(["ls-files", "-z"]).split("\0").filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
  const untracked = git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter((item) => item.length > 0).map((item) => item.replaceAll("\\", "/"));
  const candidates = [...new Set([...tracked, ...untracked])].filter((item) => item.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") !== true && item !== "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json").sort();
  const patterns = [["OPENAI_KEY", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g], ["AWS_KEY", /\bAKIA[0-9A-Z]{16}\b/g], ["PRIVATE_KEY", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{100,}?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g], ["BEARER_VALUE", /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{20,}/gi]];
  const findings = [];
  let scanned = 0;
  for (const relativePath of candidates) {
    let text;
    try { text = fs.readFileSync(path.join(ROOT, relativePath), "utf8"); } catch { continue; }
    scanned += 1;
    for (const [kind, pattern] of patterns) { pattern.lastIndex = 0; for (const match of text.matchAll(pattern)) if (/(?:test|fake|example|dummy|redact|placeholder|fixture|synthetic|mock)/i.test(match[0]) !== true) findings.push({ relativePath, kind }); }
  }
  if (findings.length !== 0) fail("SECRET_FINDINGS", { filesScanned: scanned, credentialValuesRead: 0, findings });
  pass({ filesScanned: scanned, credentialValuesRead: 0, findings: [] });
} else if (gate === "server-check") {
  const powershell = "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
  const source = path.join(ROOT, "server.ps1");
  const expectedSha256 = "94aa0379deb24dbdb3feef8fe422f7b3a28116ae6cc218ef21826e4be564a9fc";
  if (sha256(fs.readFileSync(source)) !== expectedSha256) fail("SERVER_SOURCE_IDENTITY_MISMATCH");
  if (typeof process.env.TEMP !== "string" || process.env.TEMP.length === 0) fail("TEMP_DIRECTORY_UNAVAILABLE");
  const temporaryRoot = fs.mkdtempSync(path.join(process.env.TEMP, "k35-boolean-successor-server-"));
  const temporaryScript = path.join(temporaryRoot, "server.ps1");
  try {
    fs.copyFileSync(source, temporaryScript, fs.constants.COPYFILE_EXCL);
    if (fs.existsSync(path.join(temporaryRoot, ".env")) === true) fail("TEMPORARY_SERVER_ROOT_CONTAINS_DOTENV");
    const arguments_ = ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", temporaryScript, "-Check"];
    const result = childProcess.spawnSync(powershell, arguments_, { cwd: temporaryRoot, encoding: "utf8", windowsHide: true, shell: false });
    if (result.status !== 0 || result.error !== undefined) fail("SERVER_CHECK_FAILED", { exitCode: result.status, stdoutSha256: sha256(result.stdout ?? ""), stderrSha256: sha256(result.stderr ?? "") });
    pass({ exitCode: 0, executable: powershell, arguments: arguments_.map((item) => item === temporaryScript ? "<TEMP>/server.ps1" : item), sourceSha256: expectedSha256, credentialAccesses: 0 });
  } finally { fs.rmSync(temporaryRoot, { recursive: true, force: true }); }
} else if (gate === "candidate-reconciliation") {
  const status = childProcess.execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: ROOT, encoding: "utf8", windowsHide: true }).split("\0").filter((item) => item.length > 0);
  const unexpected = status.filter((entry) => {
    const relativePath = entry.slice(3).replaceAll("\\", "/");
    const phase6a = relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") || relativePath === "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json";
    const successor = relativePath.startsWith(`qualification/synthetic-executive/v3-cognitive-remediation/${prefix}-`);
    return entry.startsWith("?? ") !== true || (phase6a !== true && successor !== true);
  });
  const resultRoot = path.join(evidenceRoot, `${prefix}-member-results`);
  const staticResults = fs.existsSync(resultRoot) === true ? fs.readdirSync(resultRoot).filter((name) => /^STATIC-(?:0(?:29|3\d|4\d|5[0-3]))\.json$/.test(name)) : [];
  const identity = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), tracking: git(["rev-parse", "@{u}"]), staged: git(["diff", "--cached", "--name-only"]) };
  const exact = identity.branch === "refactor/beta-evidence-pipeline" && identity.head === "e2b511d6b95f1049369a1128dbb38c4b26d762b6" && identity.tree === "339efb038dc1515e68fd10a208abda581530cae1" && identity.tracking === "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35" && identity.staged === "" && unexpected.length === 0 && staticResults.length === 25;
  if (exact !== true) fail("CANDIDATE_RECONCILIATION_MISMATCH", { identity, unexpected, staticResultCount: staticResults.length });
  pass({ ...identity, unexpected: [], staticResultCount: 25 });
} else if (gate === "frozen-identities") {
  pass({ verified: [verifyBoundSeal("qualification/synthetic-executive/v3-cognitive-remediation/cognitive-freeze.json", "freezeHash", "f0127ed29a1fe40fdd08936712ad09ff884405dbf8c81147f5709e3f2c2eb194"), verifyBoundSeal("qualification/synthetic-executive/v3-cognitive-remediation/v3-release-binding-successor-executable-freeze.json", "successorFreezeHash", "45f7779d2ad4a16f3a99bc4eadd994a93edf40776d26f39a0c9016c43db37f02"), verifyBoundSeal("qualification/synthetic-executive/v3-held-out-corpus/corpus-seal.json", "corpusSealHash", "61c67cf5a725ea0eab6d02e8f3ac4ece6bc02fb0fd8e2dffb378878db8bc1061")] });
} else if (gate === "execution-evidence") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/provider-execution-summary.json", "executionSummaryHash", "db8a93fe918037e883da8b2cd8bc3a29f4cec3ecba0ff4576acc103b0cb7be91");
  const record = readJson(path.join(ROOT, verified.relativePath));
  const exact = record.integrityValid === true && record.providerVisibleExecutionClosed === true && Array.isArray(record.exactCaseOrder) === true && record.exactCaseOrder.length === 14 && Object.values(record.unauthorizedActivity ?? {}).every((value) => value === 0);
  if (exact !== true) fail("EXECUTION_SEMANTICS_MISMATCH"); pass(verified);
} else if (gate === "evaluation-evidence") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/blind-evaluation.json", "evaluationHash", "d6af8dda6c602cc08bb9de1a4ba31650ca17631d1a8801445ba453bf374b820d");
  const record = readJson(path.join(ROOT, verified.relativePath));
  const exact = record.qualified === false && record.passedChecks === 67 && record.totalChecks === 98 && record.safetyCriticalPass === false && record.fatalGatePass === false;
  if (exact !== true) fail("EVALUATION_SEMANTICS_MISMATCH"); pass(verified);
} else if (gate === "evaluator-audit") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/evaluator-access-audit.json", "proofHash", "9a992a1dae9fc9d6da2ca1f7e8cd3e092b21ba6ef81a1d1e1744cba74add6f02");
  const record = readJson(path.join(ROOT, verified.relativePath));
  const exact = record.providerExecutionClosedBeforeEvaluatorAccess === true && record.evaluatorProviderCalls === 0 && record.evaluatorModelCalls === 0 && record.hiddenKeysExposedToProvider === false && record.scoringRulesExposedToProvider === false;
  if (exact !== true) fail("AUDIT_SEMANTICS_MISMATCH"); pass(verified);
} else if (gate === "result-seal") {
  const verified = verifyBoundSeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/qualification-result-seal.json", "resultSealHash", "86051c9465bf5eabfac5dfe9f7056663810108a355eb994ed3daed6e801c5750");
  const record = readJson(path.join(ROOT, verified.relativePath));
  const exact = record.qualified === false && record.noMemoryPromotion === true && record.noMergeOrDeployment === true && record.noProductActivation === true && record.evaluationHash === "d6af8dda6c602cc08bb9de1a4ba31650ca17631d1a8801445ba453bf374b820d";
  if (exact !== true) fail("RESULT_SEAL_SEMANTICS_MISMATCH"); pass(verified);
} else if (gate === "phase6a") {
  const directory = inventoryRoot(path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd"), { pathBase: path.join(ROOT, "benchmarks/blind-object-v1-results/phase6a-e3caa2fd") });
  const comparison = compareInventories(baseline.phase6a.directory, directory);
  const manifestPath = path.join(ROOT, baseline.phase6a.invocationManifest.relativePath);
  const exact = comparison.equal === true && directory.fileCount + 1 === 85 && directory.totalBytes + fs.statSync(manifestPath).size === 72299353 && sha256(fs.readFileSync(manifestPath)) === "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466";
  if (exact !== true) fail("PHASE6A_IDENTITY_MISMATCH", { comparison, fileCount: directory.fileCount + 1 });
  pass({ fileCount: 85, totalBytes: 72299353, inventoryHash: "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f", pathSetHash: "d2edc95cbc9cc727a5adeaccffde68763cc5831356c4d4ec371741b6da269581", invocationManifestHash: "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466" });
} else if (gate === "repository-integrity") {
  const actual = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), tracking: git(["rev-parse", "@{u}"]) };
  const expected = { branch: "refactor/beta-evidence-pipeline", head: "e2b511d6b95f1049369a1128dbb38c4b26d762b6", tree: "339efb038dc1515e68fd10a208abda581530cae1", tracking: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35" };
  const correction = readJson(path.join(evidenceRoot, `${prefix}-correction.json`));
  const correctionSeal = verifySeal(correction, "correctionHash");
  const exact = compactJson(actual) === compactJson(expected) && readJson(path.join(ROOT, "package.json")).version === "1.12.35" && sha256(fs.readFileSync(path.join(ROOT, "tests/browser/canonical-evidence.spec.mjs"))) === "e2f2eb4aa96e9fd4850d59bc0b89638a3df63ead5c8ffc821f9cee2d23ab5af4" && correctionSeal.valid === true;
  if (exact !== true) fail("REPOSITORY_INTEGRITY_MISMATCH", { actual, expected, correctionSeal });
  pass({ ...actual, correctionHash: correctionSeal.declared, classification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION", releaseState: "UNRELEASED" });
} else {
  fail("UNKNOWN_GATE");
}
