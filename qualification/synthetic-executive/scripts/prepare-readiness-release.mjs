import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadinessReleaseRecord, readinessReleaseCoreFromArtifacts } from "../../../benchmarks/blind-object-v2/scripts/readiness-release-qualification.mjs";
import { stableJson } from "./protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..", "..");
const target = path.join(repositoryRoot, "benchmarks", "blind-object-v2", "execution-release.json");
const record = createReadinessReleaseRecord(readinessReleaseCoreFromArtifacts());
await writeFile(target, `${stableJson(record)}\n`, { encoding: "utf8", mode: 0o600 });
process.stdout.write(`${stableJson({ releaseState: record.releaseState, recordHash: record.recordHash })}\n`);
