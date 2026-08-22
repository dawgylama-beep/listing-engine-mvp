import path from "node:path";
import { fileURLToPath } from "node:url";

import { writeV5PackageSeal } from "./v5-package-core.mjs";

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = await writeV5PackageSeal();
  process.stdout.write(`${JSON.stringify({ result: "PASS", artifactCount: result.artifactCount, completePackageRootHash: result.completePackageRootHash })}\n`);
}

export { writeV5PackageSeal };
