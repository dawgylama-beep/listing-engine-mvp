import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import childProcess from "node:child_process";
import { compactJson, inventoryRoot, readJson, sha256Bytes } from "./version-1.12.35-exhaustive-continuation-identity.mjs";

const root = "C:/Users/dawgy/Projects/listing-engine-mvp";
const gate = process.argv[2];
const fail = (message, details = {}) => {
  process.stdout.write(`${compactJson({ gate, status: "FAIL", message, ...details })}\n`);
  process.exit(1);
};
const pass = (details = {}) => process.stdout.write(`${compactJson({ gate, status: "PASS", ...details })}\n`);
const git = (args) => childProcess.execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true }).trim();
const verifySeal = (relativePath, field, expected) => {
  const absolutePath = path.join(root, relativePath);
  const record = readJson(absolutePath);
  const declared = record[field];
  delete record[field];
  const computed = sha256Bytes(compactJson(record));
  if (declared !== expected || computed !== expected) fail("SEALED_IDENTITY_MISMATCH", { relativePath, field, declared, computed, expected });
  return { relativePath, field, hash: computed };
};

if (gate === "browser-retained") {
  const result = readJson(path.join(root, "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-sweep-result.json"));
  const member = result.matrix.static.find((entry) => entry.id === "STATIC-028");
  const browser = result.browserExecution;
  const ok = member?.status === "PASS" && member.executionCount === 1 && browser?.workers === 1 && browser?.retries === 0 && browser?.canonicalTestCount === 12;
  if (!ok) fail("RETAINED_BROWSER_RESULT_MISMATCH", { member, browser });
  pass({ retained: true, canonicalTests: 12, attemptsPerCanonicalTest: 1, workers: 1, retries: 0 });
} else if (gate === "frontend-credential-scan") {
  const publicRoot = path.join(root, "public");
  const inventory = inventoryRoot(root, publicRoot);
  const patterns = [
    ["PROVIDER_KEY_LITERAL", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g],
    ["AUTHORIZATION_BEARER_VALUE", /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{12,}/gi],
    ["PROVIDER_CREDENTIAL_ENV_NAME", /\b(?:OPENAI_API_KEY|OPEN_API_KEY|SERPER_API_KEY)\b/g],
  ];
  const findings = [];
  for (const file of inventory.files) {
    const text = fs.readFileSync(path.join(root, file.relativePath), "utf8");
    for (const [kind, pattern] of patterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text)) findings.push({ relativePath: file.relativePath, kind });
    }
  }
  if (findings.length) fail("FRONTEND_CREDENTIAL_FINDINGS", { filesScanned: inventory.fileCount, findings });
  pass({ filesScanned: inventory.fileCount, findings: [] });
} else if (gate === "governing-secret-scan") {
  const tracked = git(["ls-files", "-z"]).split("\0").filter(Boolean).map((item) => item.replaceAll("\\", "/"));
  const candidates = [...tracked, ...git(["ls-files", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean)]
    .filter((item) => !item.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") && !item.includes(".phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json"));
  const patterns = [
    ["OPENAI_KEY", /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g],
    ["AWS_KEY", /\bAKIA[0-9A-Z]{16}\b/g],
    ["PRIVATE_KEY", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]{100,}?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
    ["BEARER_VALUE", /\bauthorization\s*[:=]\s*["`]?bearer\s+[A-Za-z0-9._-]{20,}/gi],
  ];
  const findings = [];
  let scanned = 0;
  for (const relativePath of [...new Set(candidates)].sort()) {
    let text;
    try { text = fs.readFileSync(path.join(root, relativePath), "utf8"); } catch { continue; }
    scanned += 1;
    for (const [kind, pattern] of patterns) {
      pattern.lastIndex = 0;
      for (const match of text.matchAll(pattern)) {
        if (!/(?:test|fake|example|dummy|redact|placeholder|fixture|synthetic|mock)/i.test(match[0])) findings.push({ relativePath, kind });
      }
    }
  }
  if (findings.length) fail("SECRET_FINDINGS", { filesScanned: scanned, credentialValuesRead: 0, findings });
  pass({ filesScanned: scanned, credentialValuesRead: 0, findings: [] });
} else if (gate === "candidate-reconciliation") {
  const status = childProcess.execFileSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: root, encoding: "utf8", windowsHide: true }).split("\0").filter(Boolean);
  const allowedPrefix = "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-exhaustive-continuation-";
  const allowedCorrection = "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-playwright-adjudication-append-only-correction.json";
  const bad = status.filter((entry) => {
    const relativePath = entry.slice(3).replaceAll("\\", "/");
    const phase6a = relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/") || relativePath === "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json";
    return !entry.startsWith("?? ") || !(phase6a || relativePath.startsWith(allowedPrefix) || relativePath === allowedCorrection);
  });
  const identity = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), tracking: git(["rev-parse", "@{u}"]), staged: git(["diff", "--cached", "--name-only"]).split(/\r?\n/).filter(Boolean) };
  if (identity.branch !== "refactor/beta-evidence-pipeline" || identity.head !== "48248039ab57e7e701656618f9c699b821ceb404" || identity.tree !== "132895ba7ef8c2fd0fce9c96ae1ebbb0def36b36" || identity.tracking !== "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35" || identity.staged.length || bad.length) fail("CANDIDATE_RECONCILIATION_MISMATCH", { identity, unexpectedStatus: bad });
  pass({ ...identity, unexpectedStatus: [] });
} else if (gate === "server-check") {
  const powershell = "C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";
  const source = path.join(root, "server.ps1");
  const expectedSha256 = "94aa0379deb24dbdb3feef8fe422f7b3a28116ae6cc218ef21826e4be564a9fc";
  if (sha256Bytes(fs.readFileSync(source)) !== expectedSha256) fail("SERVER_SOURCE_IDENTITY_MISMATCH");
  const temporaryRoot = fs.mkdtempSync(path.join(process.env.TEMP, "k35-continuation-server-"));
  const temporaryScript = path.join(temporaryRoot, "server.ps1");
  try {
    fs.copyFileSync(source, temporaryScript, fs.constants.COPYFILE_EXCL);
    if (fs.existsSync(path.join(temporaryRoot, ".env"))) fail("TEMPORARY_SERVER_ROOT_CONTAINS_DOTENV");
    const arguments_ = ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", temporaryScript, "-Check"];
    const result = childProcess.spawnSync(powershell, arguments_, { cwd: temporaryRoot, encoding: "utf8", windowsHide: true, shell: false });
    if (result.status !== 0) fail("SERVER_CHECK_FAILED", { exitCode: result.status, stdoutSha256: sha256Bytes(result.stdout ?? ""), stderrSha256: sha256Bytes(result.stderr ?? "") });
    pass({ exitCode: 0, executable: powershell, arguments: arguments_.map((item) => item === temporaryScript ? "<TEMP>/server.ps1" : item), sourceSha256: expectedSha256, credentialAccesses: 0 });
  } finally {
    fs.rmSync(temporaryRoot, { recursive: true, force: true });
  }
} else if (gate === "frozen-identities") {
  const verified = [
    verifySeal("qualification/synthetic-executive/v3-cognitive-remediation/cognitive-freeze.json", "freezeHash", "f0127ed29a1fe40fdd08936712ad09ff884405dbf8c81147f5709e3f2c2eb194"),
    verifySeal("qualification/synthetic-executive/v3-cognitive-remediation/v3-release-binding-successor-executable-freeze.json", "successorFreezeHash", "45f7779d2ad4a16f3a99bc4eadd994a93edf40776d26f39a0c9016c43db37f02"),
    verifySeal("qualification/synthetic-executive/v3-held-out-corpus/corpus-seal.json", "corpusSealHash", "61c67cf5a725ea0eab6d02e8f3ac4ece6bc02fb0fd8e2dffb378878db8bc1061"),
  ];
  pass({ verified });
} else if (gate === "execution-evidence") {
  const verified = verifySeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/provider-execution-summary.json", "executionSummaryHash", "db8a93fe918037e883da8b2cd8bc3a29f4cec3ecba0ff4576acc103b0cb7be91");
  const record = readJson(path.join(root, verified.relativePath));
  if (record.integrityValid !== true || record.providerVisibleExecutionClosed !== true || record.exactCaseOrder?.length !== 14 || Object.values(record.unauthorizedActivity ?? {}).some((value) => value !== 0)) fail("EXECUTION_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "evaluation-evidence") {
  const verified = verifySeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/blind-evaluation.json", "evaluationHash", "d6af8dda6c602cc08bb9de1a4ba31650ca17631d1a8801445ba453bf374b820d");
  const record = readJson(path.join(root, verified.relativePath));
  if (record.qualified !== false || record.passedChecks !== 67 || record.totalChecks !== 98 || record.safetyCriticalPass !== false || record.fatalGatePass !== false) fail("EVALUATION_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "evaluator-audit") {
  const verified = verifySeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/evaluator-access-audit.json", "proofHash", "9a992a1dae9fc9d6da2ca1f7e8cd3e092b21ba6ef81a1d1e1744cba74add6f02");
  const record = readJson(path.join(root, verified.relativePath));
  if (record.providerExecutionClosedBeforeEvaluatorAccess !== true || record.evaluatorProviderCalls !== 0 || record.evaluatorModelCalls !== 0 || record.hiddenKeysExposedToProvider !== false || record.scoringRulesExposedToProvider !== false) fail("AUDIT_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "result-seal") {
  const verified = verifySeal("qualification/synthetic-executive/v3-qualification-result-v1.12.35/qualification-result-seal.json", "resultSealHash", "86051c9465bf5eabfac5dfe9f7056663810108a355eb994ed3daed6e801c5750");
  const record = readJson(path.join(root, verified.relativePath));
  if (record.qualified !== false || record.noMemoryPromotion !== true || record.noMergeOrDeployment !== true || record.noProductActivation !== true || record.evaluationHash !== "d6af8dda6c602cc08bb9de1a4ba31650ca17631d1a8801445ba453bf374b820d") fail("RESULT_SEAL_SEMANTICS_MISMATCH");
  pass(verified);
} else if (gate === "phase6a") {
  const inventory = inventoryRoot(root, "benchmarks/blind-object-v1-results", { select: (relativePath) => relativePath.includes("phase6a-e3caa2fd") });
  const manifest = path.join(root, "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json");
  const ok = inventory.fileCount === 85 && inventory.totalBytes === 72299353 && inventory.pathSetSha256 === "d2edc95cbc9cc727a5adeaccffde68763cc5831356c4d4ec371741b6da269581" && inventory.aggregateSha256 === "4b0bfcd4cde10c1f882f966fd1b78a36bf19e95eb7a68a0923e375dbee60f100" && sha256Bytes(fs.readFileSync(manifest)) === "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466";
  if (!ok) fail("PHASE6A_IDENTITY_MISMATCH", inventory);
  pass({ ...inventory, inventorySha256: "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f", invocationManifestSha256: "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466" });
} else if (gate === "repository-integrity") {
  const expected = {
    branch: "refactor/beta-evidence-pipeline",
    head: "48248039ab57e7e701656618f9c699b821ceb404",
    tree: "132895ba7ef8c2fd0fce9c96ae1ebbb0def36b36",
    tracking: "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35",
  };
  const actual = { branch: git(["branch", "--show-current"]), head: git(["rev-parse", "HEAD"]), tree: git(["rev-parse", "HEAD^{tree}"]), tracking: git(["rev-parse", "@{u}"]) };
  const browserSha256 = sha256Bytes(fs.readFileSync(path.join(root, "tests/browser/canonical-evidence.spec.mjs")));
  const version = readJson(path.join(root, "package.json")).version;
  const correctionPath = path.join(root, "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-playwright-adjudication-append-only-correction.json");
  const correction = readJson(correctionPath);
  const correctionBasis = structuredClone(correction);
  const correctionHash = correctionBasis.correctionHash;
  delete correctionBasis.correctionHash;
  const computedCorrectionHash = sha256Bytes(compactJson(correctionBasis));
  if (compactJson(actual) !== compactJson(expected) || browserSha256 !== "e2f2eb4aa96e9fd4850d59bc0b89638a3df63ead5c8ffc821f9cee2d23ab5af4" || version !== "1.12.35" || correctionHash !== computedCorrectionHash || correction.policyProof?.appendOnlySupersessionPermitted !== true) fail("REPOSITORY_INTEGRITY_MISMATCH", { expected, actual, browserSha256, version, correctionHash, computedCorrectionHash });
  pass({ ...actual, browserSha256, version, correctionHash, classification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION", releaseState: "UNRELEASED" });
} else if (gate === "adjudication-correction") {
  const correction = readJson(path.join(root, "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-playwright-adjudication-append-only-correction.json"));
  const basis = structuredClone(correction);
  const declared = basis.correctionHash;
  delete basis.correctionHash;
  const computed = sha256Bytes(compactJson(basis));
  if (declared !== computed || correction.policyProof?.appendOnlySupersessionPermitted !== true) fail("ADJUDICATION_CORRECTION_INVALID", { declared, computed, policyProof: correction.policyProof });
  pass({ correctionHash: computed, supersededPath: correction.malformedRecord.path, supersededBytesPreserved: true });
} else {
  fail("UNKNOWN_GATE");
}
