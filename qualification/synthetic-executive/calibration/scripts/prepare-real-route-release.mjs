import { writeFile } from "node:fs/promises";
import path from "node:path";
import { createRealRouteReleaseRecord, realRouteReleaseCoreFromArtifacts } from "../../../../benchmarks/blind-object-v2/scripts/real-route-release-qualification.mjs";
import { stableJson } from "../../scripts/protocol.mjs";
import { repositoryRoot } from "./real-route-profile.mjs";

const record = createRealRouteReleaseRecord(realRouteReleaseCoreFromArtifacts());
await writeFile(path.join(repositoryRoot, "benchmarks", "blind-object-v2", "execution-release.json"), `${stableJson(record)}\n`, { encoding: "utf8", mode: 0o600 });
process.stdout.write(`${stableJson({ releaseState: record.releaseState, recordHash: record.recordHash })}\n`);
