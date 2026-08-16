import assert from "node:assert/strict";
import childProcess from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const repositoryRoot = path.resolve(path.dirname(scriptPath), "..", "..", "..");
const evidenceRoot = path.relative(repositoryRoot, path.dirname(scriptPath)).replaceAll("\\", "/");
const gateARelativePath = `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-gate-a.json`;
const validationRelativePath = `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-validation-result.json`;
const fileSetRelativePath = `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-release-file-set.json`;
// T is defined before F. T is never a member of F.
const terminalRelativePath = `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-terminal-release-record.json`;
const phaseDirectoryPrefix = "benchmarks/blind-object-v1-results/phase6a-e3caa2fd/";
const phaseManifestPath = "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json";
const memberPaths = Object.freeze([
  "PRODUCT_ROADMAP.md",
  "docs/mentor-guided-reasoning-contract.md",
  "lib/cognitive-governor/mentor-guided-reasoning.js",
  "lib/cognitive-governor/policy.js",
  "package-lock.json",
  "package.json",
  "public/index.html",
  "server.ps1",
  "tests/cognitive-governor-callsite.test.mjs",
  "tests/fixtures/version-1.12.36-mentor-guided-remediation.json",
  "tests/mentor-guided-reasoning.test.mjs",
  "tests/mentor-guided-validation-selection.test.mjs",
  "tests/release-version-surface.test.mjs",
  `${evidenceRoot}/version-1.12.36-browser-scope-incident-adjudication.json`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-browser-gate-stop.json`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-consolidated-correction-result.json`,
  gateARelativePath,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-powershell-static-result.json`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-release-gates.mjs`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-release.mjs`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-retained-validation-identity.json`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-validation-correction.json`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-validation-ledger.json`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-validation-selection.json`,
  `${evidenceRoot}/version-1.12.36-mentor-guided-reasoning-validation-selection.mjs`,
  validationRelativePath
].sort());

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stable(value));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function git(arguments_) {
  return childProcess.execFileSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    windowsHide: true
  });
}

function statusPaths() {
  return git(["status", "--porcelain=v1", "-z", "--untracked-files=all"])
    .split("\0")
    .filter(Boolean)
    .map((entry) => ({ status: entry.slice(0, 2), relativePath: entry.slice(3).replaceAll("\\", "/") }));
}

function isPhase6a(relativePath) {
  return relativePath.startsWith(phaseDirectoryPrefix) || relativePath === phaseManifestPath;
}

function reconcile(expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  return {
    missing: expected.filter((item) => !actualSet.has(item)).sort(),
    unexpected: actual.filter((item) => !expectedSet.has(item)).sort(),
    duplicate: expected.filter((item, index) => expected.indexOf(item) !== index).sort(),
    intersecting: expected.filter(isPhase6a).sort(),
    unclassified: []
  };
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repositoryRoot, ...relativePath.split("/")), "utf8"));
}

async function fileRecord(relativePath) {
  const bytes = await readFile(path.join(repositoryRoot, ...relativePath.split("/")));
  return Object.freeze({ relativePath, byteLength: bytes.length, sha256: sha256(bytes) });
}

async function writeExclusiveJson(relativePath, value) {
  const bytes = `${JSON.stringify(value, null, 2)}\n`;
  const absolutePath = path.join(repositoryRoot, ...relativePath.split("/"));
  await writeFile(absolutePath, bytes, { encoding: "utf8", flag: "wx" });
  const readback = await readFile(absolutePath);
  assert.equal(readback.toString("utf8"), bytes, `${relativePath} readback differs`);
  return Object.freeze({ relativePath, byteLength: readback.length, sha256: sha256(readback) });
}

export async function finalizeMentorGuidedReasoningRelease() {
  assert.equal(memberPaths.length, 26);
  assert.equal(new Set(memberPaths).size, memberPaths.length, "F contains duplicate members");
  assert.equal(memberPaths.includes(terminalRelativePath), false, "T must not be in F");
  assert.equal(memberPaths.includes(fileSetRelativePath), false, "derived file-set record must not be in F");
  assert.deepEqual(memberPaths.filter(isPhase6a), [], "F must not intersect P");
  assert.deepEqual(memberPaths.filter((item) => item.startsWith(".git/") || item.includes("/.git/")), [], "commit objects must not be in F");
  assert.deepEqual(memberPaths.filter((item) => path.isAbsolute(item)), [], "external quarantine files must not be in F");
  assert.equal(fs.existsSync(path.join(repositoryRoot, ...fileSetRelativePath.split("/"))), false, "release file-set record already exists");
  assert.equal(fs.existsSync(path.join(repositoryRoot, ...terminalRelativePath.split("/"))), false, "terminal release record already exists");
  assert.equal(git(["diff", "--cached", "--name-only"]).trim(), "", "index must be empty before release construction");

  const initialStatus = statusPaths();
  const initialCandidatePaths = initialStatus.filter((item) => !isPhase6a(item.relativePath)).map((item) => item.relativePath).sort();
  const initialPhasePaths = initialStatus.filter((item) => isPhase6a(item.relativePath)).map((item) => item.relativePath).sort();
  const initialReconciliation = reconcile(memberPaths, initialCandidatePaths);
  assert.deepEqual(initialReconciliation, { missing: [], unexpected: [], duplicate: [], intersecting: [], unclassified: [] });
  assert.equal(initialPhasePaths.length, 85);

  const [gateA, validation] = await Promise.all([
    readJson(gateARelativePath),
    readJson(validationRelativePath)
  ]);
  assert.equal(gateA.gateAClassification, "SAFE_NARROW_EXISTING_GOVERNOR_POLICY_INTEGRATION_IDENTIFIED");
  assert.deepEqual(gateA.frozenV3MutationSet, []);
  assert.equal(validation.overallStatus, "PASS");
  assert.equal(validation.failedGateCount, 0);
  assert.equal(validation.correctionCyclesUsed, 1);
  assert.equal(validation.browserGate.classification, "NOT_APPLICABLE_TO_DECLARED_VERSION_1_12_36_CHANGE_CLOSURE");
  assert.equal(validation.browserGate.executionCountDuringRecovery, 0);
  assert.equal(validation.powerShellStatic.totalMembers, 52);
  assert.equal(validation.powerShellStatic.passed, 52);
  assert.equal(validation.prohibitedActivity.providerCalls, 0);
  assert.equal(validation.prohibitedActivity.metadataRequests, 0);
  assert.equal(validation.prohibitedActivity.credentialSourceReads, 0);
  assert.equal(validation.prohibitedActivity.v3Executions, 0);
  assert.equal(validation.prohibitedActivity.v3Evaluations, 0);
  assert.equal(validation.prohibitedActivity.v3CorpusExecutions, 0);
  assert.equal(validation.prohibitedActivity.version11235TerminalSuiteExecutions, 0);
  assert.equal(validation.prohibitedActivity.productHandlerCalls, 0);
  assert.equal(validation.prohibitedActivity.deployments, 0);
  assert.equal(validation.prohibitedActivity.memoryPromotions, 0);
  assert.equal(validation.phase6a.fileCount, 85);
  assert.equal(validation.phase6a.inventoryHash, "50a034e464f6870ce7b78db2d3527eef0773f5685daf16619a82d482d9bfb70f");
  assert.equal(validation.phase6a.pathSetHash, "d2edc95cbc9cc727a5adeaccffde68763cc5831356c4d4ec371741b6da269581");
  assert.equal(validation.phase6a.invocationManifestHash, "e1bbeae77676d3d566b4239c86c7dc1c5a6969f2c86271eb5402ce1a38082466");
  assert.equal(validation.preservedV3Classification, "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION");

  const members = [];
  for (const relativePath of memberPaths) members.push(await fileRecord(relativePath));
  const pathSetHash = sha256(Buffer.from(stableJson(memberPaths), "utf8"));
  const aggregateHash = sha256(Buffer.from(stableJson(members), "utf8"));
  const totalBytes = members.reduce((sum, item) => sum + item.byteLength, 0);
  const incident = await fileRecord(`${evidenceRoot}/version-1.12.36-browser-scope-incident-adjudication.json`);
  const quarantine = validation.incidentRecovery.quarantine;
  const fileSet = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_36_MENTOR_GUIDED_REASONING_RELEASE_FILE_SET",
    version: "1.12.36",
    terminalPath: terminalRelativePath,
    terminalExcluded: true,
    derivedFileSetExcluded: true,
    phase6aExcluded: true,
    commitObjectsExcluded: true,
    externalQuarantineExcluded: true,
    memberCount: members.length,
    totalBytes,
    pathSetHash,
    fileSetHash: pathSetHash,
    aggregateHash,
    members,
    incidentAdjudication: incident,
    externalQuarantineBinding: quarantine,
    preservedVersion11235: {
      releaseCommit: "929a609dca6c7da62dbf0ba5f3ee034baec7c3dd",
      releaseAggregateMemberCount: 860,
      releaseAggregateHash: "6b84a272848a9be6589308d683d24cb2216234a2a2cfa44bb1532bdbf8794e7e",
      releaseFileSetHash: "a5f10bd35d670dbbdd563ae5e728f64e7e84f6512fafb2a0d06b779801a07278",
      terminalReleaseRecordSha256: "670deefbc40a98b8eeb93c552783e60db579db395731e1d6954a130a4f139277"
    },
    phase6a: validation.phase6a,
    preservedV3Classification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
    reconciliation: initialReconciliation
  };
  const fileSetRecord = await writeExclusiveJson(fileSetRelativePath, fileSet);
  const fileSetReadback = await readJson(fileSetRelativePath);
  assert.equal(fileSetReadback.memberCount, members.length);
  assert.equal(fileSetReadback.aggregateHash, aggregateHash);
  assert.equal(fileSetReadback.pathSetHash, pathSetHash);

  const terminal = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_36_MENTOR_GUIDED_REASONING_TERMINAL_RELEASE_RECORD",
    version: "1.12.36",
    state: "READY_FOR_SINGLE_DESCENDANT_COMMIT_AND_SINGLE_ORDINARY_PUSH_NOT_YET_RELEASED",
    terminalPath: terminalRelativePath,
    terminalExcludedFromReleaseFileSet: true,
    startingIdentity: gateA.checkpoint,
    releaseFileSet: fileSetRecord,
    releaseAggregateMembershipCount: members.length,
    releaseAggregateTotalBytes: totalBytes,
    releaseAggregateHash: aggregateHash,
    releaseFileSetHash: pathSetHash,
    validationResult: await fileRecord(validationRelativePath),
    incidentAdjudication: incident,
    externalQuarantineBinding: quarantine,
    phase6a: validation.phase6a,
    requiredSuccessClassifications: [
      "VERSION_1_12_36_MENTOR_GUIDED_REASONING_CONTRACT_RELEASED_NOT_QUALIFIED_NOT_DEPLOYED",
      "VERSION_1_12_36_BROWSER_GATE_SCOPE_ESCAPE_PRESERVED_AND_ADJUDICATED"
    ],
    preservedV3Classification: "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION",
    claims: {
      qualified: false,
      learned: false,
      cognitiveImprovementProved: false,
      deployed: false,
      activated: false,
      memoryImprovementProved: false
    },
    preCommitActivity: {
      providerCalls: 0,
      metadataRequests: 0,
      credentialSourceReads: 0,
      v3Executions: 0,
      v3Evaluations: 0,
      v3CorpusExecutions: 0,
      version11235TerminalSuiteExecutions: 0,
      benchmarkExecutions: 0,
      productHandlerCalls: 0,
      browserScopeEscapeWrapperInvocations: 1,
      browserRecoveryExecutions: 0,
      authoritiesCreated: 0,
      memoryPromotions: 0,
      tags: 0,
      merges: 0,
      deployments: 0,
      activations: 0,
      remoteWrites: 0
    }
  };
  assert.equal(Object.hasOwn(terminal, "sha256"), false);
  assert.equal(Object.hasOwn(terminal, "terminalSha256"), false);
  const terminalRecord = await writeExclusiveJson(terminalRelativePath, terminal);
  const finalCandidatePaths = statusPaths().filter((item) => !isPhase6a(item.relativePath)).map((item) => item.relativePath).sort();
  const finalExpected = [...memberPaths, fileSetRelativePath, terminalRelativePath].sort();
  const finalReconciliation = reconcile(finalExpected, finalCandidatePaths);
  assert.deepEqual(finalReconciliation, { missing: [], unexpected: [], duplicate: [], intersecting: [], unclassified: [] });
  return Object.freeze({
    memberCount: members.length,
    totalBytes,
    aggregateHash,
    fileSetHash: pathSetHash,
    fileSetRecord,
    terminalRecord,
    terminalSha256: terminalRecord.sha256,
    reconciliation: finalReconciliation
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  assert.equal(process.argv[2], "FINALIZE", "Usage: node version-1.12.36-mentor-guided-reasoning-release.mjs FINALIZE");
  const result = await finalizeMentorGuidedReasoningRelease();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
