import path from "node:path";
import { fileURLToPath } from "node:url";

import { verifyV4Package } from "./v4-package-core.mjs";

const scriptPath = fileURLToPath(import.meta.url);

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = await verifyV4Package();
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

export { verifyV4Package };
