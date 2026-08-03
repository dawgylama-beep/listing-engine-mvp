import { appendFile } from "node:fs/promises";

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);
const envelope = JSON.parse(Buffer.concat(chunks).toString("utf8"));
const body = JSON.parse(Buffer.from(envelope.rawBodyBase64, "base64").toString("utf8"));
const runId = String(body.analysisId || "").match(/run-(\d{3})$/)?.[1];
if (!runId || envelope.method !== "POST" || envelope.url !== "/api/generate-listing") process.exit(31);
const allowedBodyKeys = body.reportType === "listing"
  ? ["analysisId", "notes", "photos", "platform", "reportType", "sellerIntake"]
  : ["analysisId", "buyerIntake", "notes", "photos", "platform", "reportType"];
if (JSON.stringify(Object.keys(body).sort()) !== JSON.stringify(allowedBodyKeys.sort())) process.exit(32);
if (!Array.isArray(body.photos) || body.photos.length < 1 || body.photos.some((photo) => !/^data:image\/jpeg;base64,/.test(photo.dataUrl))) process.exit(33);

const tracePath = process.env.EXECUTOR_MOCK_TRACE_PATH || "";
if (tracePath) await appendFile(tracePath, `${JSON.stringify({ runId: `RUN-${runId}`, analysisId: body.analysisId })}\n`, "utf8");
const mode = process.env.EXECUTOR_MOCK_MODE || "mixed";
if (mode === "throw" && runId === "001") process.exit(41);

const report = {
  analysisId: body.analysisId,
  exactProductIdentity: mode === "weak" || runId === "002" ? "Not verified" : "Synthetic mock object",
  exactProductConfidence: mode === "weak" || runId === "002" ? "Low" : "Medium",
  whatIsStillUnknown: ["Exact identity remains unverified in this mock response."],
  plausibleAlternatives: ["Synthetic alternative"],
  searchDiagnostics: {
    providerCallsAttempted: mode === "provider-error" || runId === "003" ? 1 : 0,
    providerCallsSucceeded: 0,
    providerErrors: mode === "provider-error" || runId === "003" ? ["synthetic provider unavailable"] : []
  },
  resultsFound: [],
  recommendation: mode === "weak" || runId === "002" ? "No evidence recommendation" : "Synthetic recommendation",
  actionPlan: ["Capture another identifying mark"],
  executorSyntheticFlags: runId === "014" ? { unsupportedExact: true, inventedSource: true, inventedTransactionFact: true } : {}
};
const productPayload = body.reportType === "listing" ? { listing: report } : { valuation: report };
const rawBody = Buffer.from(JSON.stringify(productPayload), "utf8");
process.stdout.write(JSON.stringify({
  protocolVersion: 1,
  statusCode: 200,
  headers: { "content-type": "application/json; charset=utf-8" },
  rawBodyBase64: rawBody.toString("base64")
}));
