import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readJson, seal, sha256Json } from "./protocol.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const qualificationRoot = path.resolve(scriptDirectory, "..");

const CURRENT_SURFACES = Object.freeze([
  "README.md", "synthetic-executive-architecture.json", "trust-boundary.json", "qualification-budget-profile.json",
  "future-qualification-plan.json", "consent-execution-prohibition.json",
  "scripts/lifecycle-integrity-controller.mjs", "scripts/qualification-governor.mjs", "scripts/action-broker.mjs",
  "scripts/memory-store.mjs", "scripts/episode-sandbox.mjs", "scripts/engineering-worker-adapter.mjs",
  "schemas/synthetic-executive-architecture.schema.json", "schemas/trust-boundary.schema.json"
]);

const FORBIDDEN_CLAIMS = Object.freeze(["synthetic cognition", "cognitive learning", "autonomous engineering", "self-improvement"]);

export async function runTerminologyCheck() {
  const findings = [];
  for (const relativePath of CURRENT_SURFACES) {
    const text = await readFile(path.join(qualificationRoot, relativePath), "utf8");
    for (const phrase of FORBIDDEN_CLAIMS) if (text.toLowerCase().includes(phrase)) findings.push({ relativePath, phrase });
    if (relativePath !== "qualification-budget-profile.json" && /\bexecutive reasoning\b/i.test(text)) findings.push({ relativePath, phrase: "executive reasoning claim" });
  }
  assert.deepEqual(findings, [], "current deterministic surfaces contain prohibited terminology claims");
  const roleRegistry = await readJson(path.join(qualificationRoot, "canonical-role-registry.json"));
  const controller = roleRegistry.roles.find((role) => role.componentId === "KE-LIC-001");
  assert.equal(controller.canonicalComponentName, "Lifecycle Integrity Controller");
  assert.deepEqual(controller.historicalAliases, ["Cognitive Lifecycle Governor"]);
  return seal({
    schemaVersion: "1.0", proofType: "CURRENT_COMPONENT_TERMINOLOGY_CHECK", scannedSurfaceCount: CURRENT_SURFACES.length,
    prohibitedClaimCount: 0, canonicalControllerName: controller.canonicalComponentName,
    historicalAliasCount: controller.historicalAliases.length, historicalCompatibilityExplicitlyScoped: true,
    scannedSurfaceAggregateHash: sha256Json(CURRENT_SURFACES)
  }, "proofHash");
}

if (path.resolve(process.argv[1] || "") === fileURLToPath(import.meta.url)) process.stdout.write(`${JSON.stringify(await runTerminologyCheck())}\n`);
