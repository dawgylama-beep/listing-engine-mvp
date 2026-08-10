import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadinessReleaseRecord, readinessReleaseCoreFromArtifacts } from "../../../benchmarks/blind-object-v2/scripts/readiness-release-qualification.mjs";
import { stableJson } from "./protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..", "..");
const git = (args) => execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8" }).trim();
const runtimeHead = git(["rev-parse", "HEAD"]); const runtimeTree = git(["rev-parse", `${runtimeHead}^{tree}`]);
const record = createReadinessReleaseRecord(readinessReleaseCoreFromArtifacts({ executorRuntimeHead: runtimeHead, executorRuntimeTreeHash: runtimeTree, releaseState: "QUALIFIED" }));
await writeFile(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "execution-release.json"), `${stableJson(record)}\n`, { encoding: "utf8", mode: 0o600 });
process.stdout.write(`${stableJson({ runtimeHead, runtimeTree, releaseState: record.releaseState, recordHash: record.recordHash })}\n`);
