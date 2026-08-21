import path from "node:path";
import { fileURLToPath } from "node:url";

import { prepareQualificationRun } from "./prepare-core.mjs";
import { parseCliArguments, stableJson } from "./shared.mjs";

export async function main(argv = process.argv.slice(2)) {
  const args = parseCliArguments(argv, ["authorization", "results"]);
  return prepareQualificationRun({ authorizationPath: path.resolve(args.authorization), resultsRoot: path.resolve(args.results) });
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${stableJson(await main())}\n`);
}
