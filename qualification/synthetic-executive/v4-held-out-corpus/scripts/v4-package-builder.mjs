import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildV4PackageBase, verifyV4Package, writeV4PackageSeal } from "./v4-package-core.mjs";
import { writeV4NonOverlapProof } from "./v4-non-overlap-comparator.mjs";
import { writeV4AccessDenialProof } from "./v4-visible-assembler.mjs";

const scriptPath = fileURLToPath(import.meta.url);

export async function buildCompleteV4Package() {
  const build = await buildV4PackageBase();
  const nonOverlap = await writeV4NonOverlapProof();
  const accessDenial = await writeV4AccessDenialProof();
  const seal = await writeV4PackageSeal();
  const verification = await verifyV4Package();
  return Object.freeze({
    result: "PASS",
    build,
    nonOverlap: nonOverlap.terminalStatement,
    accessDenialAttempts: accessDenial.attemptCount,
    seal: {
      artifactCount: seal.artifactCount,
      completePackageRootHash: seal.completePackageRootHash,
      publicCorpusRootHash: seal.publicCorpusRootHash,
      evaluatorControlAggregateHash: seal.evaluatorControlAggregateHash
    },
    verification
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = await buildCompleteV4Package();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
