import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createRealRouteReleaseRecord, realRouteReleaseCoreFromArtifacts } from "../../../../benchmarks/blind-object-v2/scripts/real-route-release-qualification.mjs";
import { stableJson } from "../../scripts/protocol.mjs";
import { repositoryRoot } from "./real-route-profile.mjs";

const git = (args) => execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", windowsHide: true }).trim();
const runtimeCommit = git(["rev-parse", "HEAD"]); const runtimeTree = git(["rev-parse", `${runtimeCommit}^{tree}`]);
const record = createRealRouteReleaseRecord(realRouteReleaseCoreFromArtifacts({ executorRuntimeHead: runtimeCommit, executorRuntimeTreeHash: runtimeTree, releaseState: "QUALIFIED" }));
await writeFile(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "execution-release.json"), `${stableJson(record)}\n`, { encoding: "utf8", mode: 0o600 });
process.stdout.write(`${stableJson({ runtimeCommit, runtimeTree, releaseState: record.releaseState, recordHash: record.recordHash })}\n`);
