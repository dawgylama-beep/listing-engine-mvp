import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { readJson, seal, sha256Bytes, sha256Json, stableJson, writeExclusiveJson } from "../../scripts/protocol.mjs";

const execFileAsync = promisify(execFile);
const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..", "..", "..", "..");
const releasePath = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-cognitive-remediation", "version-1.12.35-release.json");
const validationPath = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-cognitive-remediation", "offline-validation.json");
const freezePath = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-cognitive-remediation", "cognitive-freeze.json");
const corpusSealPath = path.join(repositoryRoot, "qualification", "synthetic-executive", "v3-held-out-corpus", "corpus-seal.json");
const PHASE6A_PREFIXES = ["benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json", "benchmarks/blind-object-v1-results/phase6a-e3caa2fd/"];

const git = async (...args) => (await execFileAsync("git", args, { cwd: repositoryRoot, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })).stdout.trim();
const fileHash = async (relativePath) => sha256Bytes(await readFile(path.join(repositoryRoot, relativePath)));
const normalize = (value) => value.replaceAll("\\", "/");

async function changedPaths() {
  const [tracked, untracked] = await Promise.all([git("diff", "--name-only", "HEAD"), git("ls-files", "--others", "--exclude-standard")]);
  return [...new Set([...tracked.split(/\r?\n/), ...untracked.split(/\r?\n/)].filter(Boolean).map(normalize))]
    .filter((item) => !PHASE6A_PREFIXES.some((prefix) => item === prefix || item.startsWith(prefix)))
    .filter((item) => item !== "qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.35-release.json").sort();
}

export async function buildRelease({ resultRoot, releasedAt = new Date().toISOString() }) {
  const relativeResultRoot = normalize(path.relative(repositoryRoot, resultRoot));
  const [branch, head, tree, packageFile, serverSource, roadmapSource, freeze, corpusSeal, validation, result, evaluation, summary, audit] = await Promise.all([
    git("branch", "--show-current"), git("rev-parse", "HEAD"), git("rev-parse", "HEAD^{tree}"),
    readJson(path.join(repositoryRoot, "package.json")), readFile(path.join(repositoryRoot, "server.ps1"), "utf8"), readFile(path.join(repositoryRoot, "PRODUCT_ROADMAP.md"), "utf8"),
    readJson(freezePath), readJson(corpusSealPath), readJson(validationPath), readJson(path.join(resultRoot, "qualification-result-seal.json")),
    readJson(path.join(resultRoot, "blind-evaluation.json")), readJson(path.join(resultRoot, "provider-execution-summary.json")), readJson(path.join(resultRoot, "evaluator-access-audit.json"))
  ]);
  assert.equal(branch, "refactor/beta-evidence-pipeline"); assert.equal(head, "8cf6207fb3f15c2e1ac4a9ff616d20361393fe35"); assert.equal(tree, "c6c8674108ff17fac1de8a3c779363e7ddf14960");
  assert.equal(packageFile.version, "1.12.35"); assert.match(serverSource, /^\$AppVersion = "1\.12\.35"/m); assert.match(roadmapSource, /Version 1\.12\.35/);
  const paths = await changedPaths(); assert.ok(paths.includes("package.json")); assert.ok(paths.includes(`${relativeResultRoot}/qualification-result-seal.json`));
  const changedFiles = [];
  for (const relativePath of paths) changedFiles.push({ relativePath, sha256: await fileHash(relativePath) });
  const core = {
    schemaVersion: "1.0", releaseType: "KATHERINE_V2_COGNITIVE_REMEDIATION_AND_V3_HELD_OUT_REQUALIFICATION_RELEASE", version: "1.12.35", releasedAt,
    startingIdentity: { version: "1.12.34", commit: head, tree, releaseHash: "fa52f960c6b080bcc598a8757e42512ba99b728856dda4df688b541fc8fc5ef4" },
    branch, cognitiveFreezeHash: freeze.freezeHash, cognitiveExecutableAggregateHash: freeze.executableAggregateHash, correctedPromptHash: freeze.correctedPromptHash,
    corpusSealHash: corpusSeal.corpusSealHash, caseManifestAggregateHash: corpusSeal.caseManifestAggregateHash, v3ResultSealHash: result.resultSealHash,
    v3EvaluationHash: evaluation.evaluationHash, v3ExecutionSummaryHash: summary.executionSummaryHash, evaluatorAccessAuditHash: audit.proofHash,
    terminalClassification: result.classification, qualified: result.qualified, resultRoot: relativeResultRoot,
    validationHash: validation.validationHash, changedFiles, changedFileAggregateHash: sha256Json(changedFiles),
    preservedBindings: freeze.preservedBindings,
    preservedV2: { evaluationHash: "29bc4479322581b837a060e97c8b26aca366b1414af9e68a432d1aa67f9b0b81", resultSealHash: "647bdd992db23680de24cd43f64b95c9089078f204bfcd5514db0f4a074f9e41", artifactsMutated: false, rerun: false },
    activityAssertions: { v3AuthorityCount: 1, v3CaseSlots: 14, v3EvaluatorInvocations: 1, metadataRequests: 0, providerTools: 0, realWorkers: 0, v2Reruns: 0, benchmarkExecutions: 0, productHandlerCalls: 0, previewActivity: 0, productionActivity: 0, merges: 0, deployments: 0, memoryPromotions: 0 },
    claims: { V3Qualification: result.qualified, productQuality: false, productionReadiness: false, deploymentAuthority: false, unrestrictedAutonomy: false }
  };
  return seal(core, "releaseHash");
}

export async function writeRelease({ resultRoot }) { const release = await buildRelease({ resultRoot }); await writeExclusiveJson(releasePath, release); return release; }

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const command = process.argv[2]; const resultIndex = process.argv.indexOf("--result-root"); assert.ok(resultIndex > 1 && process.argv[resultIndex + 1], "--result-root is required"); const resultRoot = path.resolve(process.argv[resultIndex + 1]);
  const release = command === "WRITE" ? await writeRelease({ resultRoot }) : command === "BUILD" ? await buildRelease({ resultRoot }) : null; assert.ok(release, "command must be WRITE or BUILD"); process.stdout.write(`${stableJson({ command, releaseHash: release.releaseHash, version: release.version, classification: release.terminalClassification, changedFileCount: release.changedFiles.length })}\n`);
}
