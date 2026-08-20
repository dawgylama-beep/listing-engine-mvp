import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeV4PackageSeal } from "./v4-package-core.mjs";

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = await writeV4PackageSeal();
  process.stdout.write(`${JSON.stringify({ result: "PASS", artifactCount: result.artifactCount, completePackageRootHash: result.completePackageRootHash })}\n`);
}

export { writeV4PackageSeal };
