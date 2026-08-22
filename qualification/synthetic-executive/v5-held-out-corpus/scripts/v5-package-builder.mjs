import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildV5PackageBase, verifyV5Package, writeV5PackageSeal } from "./v5-package-core.mjs";
import { writeV5NonOverlapProof } from "./v5-non-overlap-comparator.mjs";
import { writeV5AccessDenialProof } from "./v5-visible-assembler.mjs";

const scriptPath = fileURLToPath(import.meta.url);

export async function buildCompleteV5Package() {
  const build = await buildV5PackageBase();
  const nonOverlap = await writeV5NonOverlapProof();
  const accessDenial = await writeV5AccessDenialProof();
  const seal = await writeV5PackageSeal();
  const verification = await verifyV5Package();
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
  const result = await buildCompleteV5Package();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
