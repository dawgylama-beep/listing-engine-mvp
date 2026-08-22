import path from "node:path";
import { fileURLToPath } from "node:url";

import { executeQualificationRun } from "./execute-core.mjs";
import { createProductionTransport } from "./production-transport.mjs";
import { parseCliArguments, stableJson } from "./shared.mjs";

export async function main(argv = process.argv.slice(2)) {
  const args = parseCliArguments(argv, ["results"], ["--resume"]);
  const transport = await createProductionTransport();
  return executeQualificationRun({
    resultsRoot: path.resolve(args.results),
    transport,
    resume: args.resume === true,
    recoveryAuthorityPath: args["recovery-authority"] ? path.resolve(args["recovery-authority"]) : null
  });
}
if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) process.stdout.write(`${stableJson(await main())}\n`);
