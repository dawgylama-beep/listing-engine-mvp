import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { open, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..", "..");
const evidenceRoot = "qualification/synthetic-executive/future-independent-qualification-contract";
const releaseFileSetPath = `${evidenceRoot}/version-1.12.37-release-file-set.json`;
const terminalPath = `${evidenceRoot}/version-1.12.37-terminal-release-record.json`;

export const VERSION_1_12_37_RELEASE_FILE_SET = Object.freeze([
  "PRODUCT_ROADMAP.md",
  "docs/mentor-guided-reasoning-contract.md",
  "lib/cognitive-governor/mentor-guided-reasoning.js",
  "lib/cognitive-governor/policy.js",
  "package-lock.json",
  "package.json",
  "public/index.html",
  `${evidenceRoot}/README.md`,
  `${evidenceRoot}/atomic-scorer.mjs`,
  `${evidenceRoot}/capture-boundary-proof.mjs`,
  `${evidenceRoot}/contract.json`,
  `${evidenceRoot}/execution-envelope.mjs`,
  `${evidenceRoot}/release-evidence.mjs`,
  `${evidenceRoot}/version-1.12.37-atomic-predicate-correction-record.json`,
  `${evidenceRoot}/version-1.12.37-atomic-successor-stop.json`,
  `${evidenceRoot}/version-1.12.37-capture-boundary-proof.json`,
  `${evidenceRoot}/version-1.12.37-export-correction-record.json`,
  `${evidenceRoot}/version-1.12.37-export-successor-stop.json`,
  `${evidenceRoot}/version-1.12.37-npm-cmd-successor-stop.json`,
  `${evidenceRoot}/version-1.12.37-release-file-set.json`,
  `${evidenceRoot}/version-1.12.37-remediation-result.json`,
  `${evidenceRoot}/version-1.12.37-remediation-specification.json`,
  `${evidenceRoot}/version-1.12.37-terminal-stop.json`,
  `${evidenceRoot}/version-1.12.37-validation-result.json`,
  `${evidenceRoot}/version-1.12.37-validation-selection.json`,
  "server.ps1",
  "tests/fixtures/version-1.12.37-atomic-scorer-fixtures.mjs",
  "tests/fixtures/version-1.12.37-mentor-remediation.mjs",
  "tests/release-version-surface.test.mjs",
  "tests/version-1.12.37-atomic-scorer.test.mjs",
  "tests/version-1.12.37-contamination-integration.test.mjs",
  "tests/version-1.12.37-execution-envelope.test.mjs",
  "tests/version-1.12.37-mentor-integration.test.mjs",
  "tests/version-1.12.37-mentor-remediation.test.mjs",
  "tests/version-1.12.37-mutation-proof.test.mjs"
].sort());

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function git(...args) {
  return execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }).trim();
}

async function fileRecord(relativePath) {
  const absolutePath = path.join(repositoryRoot, ...relativePath.split("/"));
  const bytes = await readFile(absolutePath);
  const metadata = await stat(absolutePath);
  assert.equal(metadata.isFile(), true, "VERSION_1_12_37_MEMBER_NOT_FILE");
  return Object.freeze({ relativePath, bytes: bytes.length, sha256: sha256(bytes) });
}

async function writeExclusive(relativePath, value) {
  const absolutePath = path.join(repositoryRoot, ...relativePath.split("/"));
  const handle = await open(absolutePath, "wx");
  try {
    await handle.writeFile(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  } finally {
    await handle.close();
  }
}

function changedPathsWithoutPhase6A() {
  const tracked = git("diff", "--name-only", "HEAD").split(/\r?\n/).filter(Boolean);
  const untracked = git("ls-files", "--others", "--exclude-standard").split(/\r?\n/).filter(Boolean);
  return [...new Set([...tracked, ...untracked])]
    .filter((relativePath) => !relativePath.startsWith("benchmarks/blind-object-v1-results/phase6a-e3caa2fd/"))
    .filter((relativePath) => relativePath !== "benchmarks/blind-object-v1-results/.phase6a-e3caa2fd3c51ac3667c094155126dae459c06a3b.invocation-manifest.json")
    .sort();
}

function assertFrozenPathsUnchanged() {
  assert.equal(git(
    "diff",
    "--name-only",
    "HEAD",
    "--",
    "qualification/synthetic-executive/v4-independent-qualification-corpus",
    "qualification/synthetic-executive/v4-independent-qualification-run-001"
  ), "", "VERSION_1_12_37_FROZEN_V4_CHANGED");
}

export async function finalizeReleaseFileSet() {
  assert.equal(VERSION_1_12_37_RELEASE_FILE_SET.includes(terminalPath), false,
    "VERSION_1_12_37_TERMINAL_INTERSECTS_F");
  assert.equal(new Set(VERSION_1_12_37_RELEASE_FILE_SET).size, VERSION_1_12_37_RELEASE_FILE_SET.length,
    "VERSION_1_12_37_DUPLICATE_F_MEMBER");
  assert.equal(VERSION_1_12_37_RELEASE_FILE_SET.some((member) => member.includes("phase6a")), false,
    "VERSION_1_12_37_PHASE6A_INTERSECTION");
  assert.equal(VERSION_1_12_37_RELEASE_FILE_SET.some((member) => member.includes("v4-independent-qualification")), false,
    "VERSION_1_12_37_FROZEN_V4_INTERSECTION");
  assertFrozenPathsUnchanged();
  for (const member of VERSION_1_12_37_RELEASE_FILE_SET.filter((item) => item !== releaseFileSetPath)) {
    await fileRecord(member);
  }
  const record = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_37_FINALIZED_RELEASE_FILE_SET",
    version: "1.12.37",
    terminalPath,
    terminalIncluded: false,
    parentCommit: "5dc678b955c1d416b3fd44c21cc94a154a52e975",
    intendedCommitSubject: "feat: strengthen mentor reasoning and future qualification contract",
    futureCommitOrTreeShaEmbedded: false,
    memberCount: VERSION_1_12_37_RELEASE_FILE_SET.length,
    memberPaths: VERSION_1_12_37_RELEASE_FILE_SET,
    phase6AIntersection: [],
    frozenV4Intersection: [],
    missingPaths: [],
    unexpectedPaths: [],
    duplicatePaths: [],
    unreadablePaths: [],
    unclassifiedPaths: []
  };
  await writeExclusive(releaseFileSetPath, record);
  assert.deepEqual(changedPathsWithoutPhase6A(), VERSION_1_12_37_RELEASE_FILE_SET,
    "VERSION_1_12_37_CHANGED_PATH_SET_MISMATCH");
  return record;
}

export async function finalizeTerminalReleaseRecord() {
  assertFrozenPathsUnchanged();
  const fileSet = JSON.parse(await readFile(path.join(repositoryRoot, ...releaseFileSetPath.split("/")), "utf8"));
  assert.deepEqual(fileSet.memberPaths, VERSION_1_12_37_RELEASE_FILE_SET,
    "VERSION_1_12_37_FILE_SET_MEMBERSHIP_CHANGED");
  assert.deepEqual(changedPathsWithoutPhase6A(), VERSION_1_12_37_RELEASE_FILE_SET,
    "VERSION_1_12_37_CHANGED_PATH_SET_MISMATCH");
  const members = [];
  for (const member of VERSION_1_12_37_RELEASE_FILE_SET) members.push(await fileRecord(member));
  members.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  const pathSetSha256 = sha256(Buffer.from(JSON.stringify(members.map((member) => member.relativePath)), "utf8"));
  const aggregate = createHash("sha256");
  for (const member of members) {
    aggregate.update(`${member.relativePath}\0${member.bytes}\0${member.sha256}\n`, "utf8");
  }
  const terminal = {
    schemaVersion: "1.0",
    recordType: "VERSION_1_12_37_TERMINAL_RELEASE_RECORD",
    version: "1.12.37",
    classification: "VERSION_1_12_37_MENTOR_AND_FUTURE_QUALIFICATION_CONTRACT_RELEASED_NOT_QUALIFIED_NOT_DEPLOYED",
    preservedClassifications: [
      "V4_INVALID_RESULT_ADJUDICATED_MIXED_INFRASTRUCTURE_AND_COGNITIVE_DEFECTS",
      "V4_CORPUS_EXPOSED_DIAGNOSTIC_ONLY_NOT_ELIGIBLE_FOR_BLIND_REQUALIFICATION",
      "KATHERINE_SYNTHETIC_EXECUTIVE_V4_INDEPENDENT_QUALIFICATION_INVALID_NO_COGNITIVE_RESULT",
      "KATHERINE_SYNTHETIC_EXECUTIVE_V3_BLIND_NOT_QUALIFIED_AFTER_V2_COGNITIVE_REMEDIATION"
    ],
    terminalPath,
    terminalIncludedInF: false,
    ownFullFileSha256Embedded: false,
    parentCommit: "5dc678b955c1d416b3fd44c21cc94a154a52e975",
    intendedCommitSubject: "feat: strengthen mentor reasoning and future qualification contract",
    futureCommitOrTreeShaEmbedded: false,
    finalizedReleaseFileSet: {
      memberCount: members.length,
      totalBytes: members.reduce((sum, member) => sum + member.bytes, 0),
      pathSetSha256,
      aggregateSha256: aggregate.digest("hex"),
      normalization: "SHA256_PATH_NUL_DECIMAL_BYTES_NUL_SHA256_TERMINAL_LF",
      members
    },
    reconciliation: {
      missing: [],
      unexpected: [],
      duplicate: [],
      unreadable: [],
      intersecting: [],
      unclassified: []
    },
    qualificationClaimed: false,
    learningClaimed: false,
    deploymentClaimed: false,
    activationClaimed: false,
    memoryImprovementClaimed: false
  };
  await writeExclusive(terminalPath, terminal);
  return terminal;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assert.ok(["FINALIZE_F", "FINALIZE_T"].includes(process.argv[2]),
    "Usage: node release-evidence.mjs FINALIZE_F|FINALIZE_T");
  const result = process.argv[2] === "FINALIZE_F"
    ? await finalizeReleaseFileSet()
    : await finalizeTerminalReleaseRecord();
  process.stdout.write(`${JSON.stringify({ result: "PASS", recordType: result.recordType })}\n`);
}
