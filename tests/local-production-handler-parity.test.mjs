import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import test, { after, before } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createGenerateListingHandler } from "../api/generate-listing.js";
import { retailRecoveryFixture } from "./fixtures/production-shaped-evidence.mjs";
import { installHardNetworkDenial } from "./helpers/hard-network-denial.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverPath = path.join(root, "server.ps1");
const bridgePath = path.join(root, "scripts", "local-generate-listing-bridge.mjs");
const fixtureUrl = pathToFileURL(path.join(root, "tests", "fixtures", "production-shaped-evidence.mjs")).href;
const credentialPattern = /(API[_-]?KEY|ACCESS[_-]?TOKEN|AUTHORIZATION|BEARER|CLIENT[_-]?SECRET|OPENAI|OPEN_API|SERPER|MARKETPLACE|RETAILER|AUCTION|EBAY|ETSY|MERCARI|WORTHPOINT)/i;
const maxRequestBodyBytes = 30 * 1024 * 1024;
const expectedOversizedResponseBody = Buffer.from(
  '{\r\n    "error":  "Request body is too large.",\r\n    "code":  "request_body_too_large"\r\n}',
  "utf8"
);
const observedPowerShellCommands = Object.freeze([
  "Route-Request",
  "Invoke-LocalGenerateListingHandler",
  "Invoke-LocalGenerateListingBridge"
]);
const removedLegacyPowerShellFunctions = Object.freeze([
  "Handle-GenerateListing", "Handle-AskMarketEdge", "Invoke-AskMarketEdge",
  "Normalize-AskWorkflow", "Classify-AskQuestion", "Get-AskProposedPrice",
  "Get-AskScenario", "Normalize-AskMarketEdgeAnswer", "Generate-ReportWithOpenAI",
  "Set-ListingResearchHonesty", "Set-LiveSearchHonesty", "Set-ConsumerDecisionHonesty",
  "Get-ConsumerAskingPriceNumber", "Get-ConsumerAskingPriceText",
  "Get-ConsumerFairValueNumber", "Get-ConsumerConditionProfile",
  "Get-ConsumerRiskFlags", "Get-ConsumerDecision", "Get-ConsumerOffer",
  "Merge-ConsumerArrays", "Get-SearchCoverage", "Ensure-ConfidenceLayer",
  "Force-LowConfidence", "Force-MediumConfidence", "Join-ValuationText",
  "Get-ValuationEvidenceClassification", "Get-ZeroEvidenceAskingPriceText",
  "Get-ZeroEvidenceLowDownsideText", "Test-ZeroEvidencePersonalBuyAllowed",
  "Sanitize-UnsupportedMarketText", "Sanitize-ZeroEvidenceReportText",
  "Set-ZeroEvidenceGuard", "Set-ValuationEvidenceLabels",
  "Set-ResearchVisibilityFields", "New-SearchDiagnostics",
  "Get-SearchAcquisitionFailureStage", "Get-QueryResultsSummary",
  "Get-QueryPriorityRecords", "Get-ProviderResponseSummaries",
  "Summarize-SourceLabels", "Get-DroppedResultReasons",
  "Get-SafeRawResultSummaries", "Convert-ToResearchResultRecords",
  "Convert-ToResearchResultRecord", "Get-VisibleResearchResultCount",
  "Get-ReferenceSupportingResearchResultCount", "Test-UsableSourceRecord",
  "Get-ValuationEvidenceRange", "Get-LooseMoneyAmounts",
  "Get-PreliminaryReferenceRangeText", "Get-WeakEvidenceMeaningText",
  "Get-BestNextEvidenceStep", "Get-CautiousCurrentPriceAssessment",
  "Normalize-MoneyLabelText", "Format-MoneyInputText", "Ensure-Prefix",
  "Get-SearchQueriesUsed", "Get-WebSearchCalls", "Get-UrlCitations",
  "Normalize-ReportArray", "Test-CitedUrl", "Get-TextUrls", "Normalize-Url",
  "Extract-OutputText", "Normalize-BuyerIntake", "ConvertTo-ParsedAskingPrice",
  "Format-BuyerIntakeForPrompt", "Get-BuyerIntakeValue", "Test-HasAskingPrice",
  "Get-BuyerRiskAssessment", "Get-IdentityRisk", "Get-ConditionRisk",
  "Get-PriceExposureRisk", "Get-DownsideExposureProfile", "Get-LiquidityRisk",
  "Get-DecisionAlignedWithRisk", "Test-BuyOrNegotiateDecision",
  "Test-DirectBuyDecision", "Get-RiskLevelForScore", "Get-BuyerRiskSummary",
  "Add-UniqueText", "Test-KnownText", "Limit-Number", "Get-ResalePlatformContext",
  "Get-ResalePricingGuidance", "Get-LowConfidenceResaleGuidance",
  "Get-SpeculativeBuyCeiling", "Format-SpeculativeOfferRange",
  "Get-GuardedBuyerDecision", "Remove-DecisionLabel", "Get-CurrentPriceAssessment",
  "Get-MaximumRecommendedBuyPrice", "Get-ResalePotential", "Add-ResalePriceLabel",
  "Get-FallbackSellPriceGuidance", "Get-RecommendedSellingPlatform",
  "Get-PlatformSpecificSellingGuidance", "Get-CurrentAskingPriceText",
  "Get-ItemIdentificationText", "Test-ResaleIntent", "Get-MoneyRange",
  "Get-MoneyAmounts", "Round-Money", "Format-MoneyRange", "Format-Money",
  "Test-RejectedWeakComparableItem", "New-AnalysisId", "Get-OpenAIErrorMessage"
]);
const trackedServers = new Set();
const adapterPaths = new Map();
let temporaryRoot;
let observerLauncherPath;
let mainServer;
let mainBridgeInvocationCount = 0;

function adapterModuleSource(mode) {
  return `
import fs from "node:fs";
import http from "node:http";
import https from "node:https";

const MODE = ${JSON.stringify(mode)};
const { retailRecoveryFixture } = await import(${JSON.stringify(fixtureUrl)});
const tracePath = process.env.KATHERINES_EYE_PARITY_TRACE_PATH || "";
const networkTracePath = process.env.KATHERINES_EYE_PARITY_NETWORK_TRACE_PATH || "";
const isChild = process.env.KATHERINES_EYE_PARITY_CHILD === "1";
const appendTrace = (target, event) => {
  if (isChild && target) fs.appendFileSync(target, JSON.stringify(event) + "\\n", "utf8");
};
appendTrace(tracePath, { event: "adapter_import", mode: MODE, pid: process.pid });

if (isChild && process.env.KATHERINES_EYE_ADAPTER_DENY_NETWORK === "1") {
  const deny = (mechanism) => () => {
    appendTrace(networkTracePath, { event: "unexpected_network", mechanism, pid: process.pid });
    throw new Error("UNEXPECTED_EXTERNAL_NETWORK_REQUEST");
  };
  globalThis.fetch = deny("fetch");
  http.request = deny("http.request");
  http.get = deny("http.get");
  https.request = deny("https.request");
  https.get = deny("https.get");
}

if (MODE === "nonzero_exit") {
  process.exit(23);
}

let delayed = false;
function finalModelResponse(schemaName) {
  if (schemaName === "visual_subject_recognition") return retailRecoveryFixture.visualRecognition;
  if (schemaName === "item_identity") return retailRecoveryFixture.identity;
  if (schemaName === "consumer_purchase_decision") return retailRecoveryFixture.finalReport;
  if (schemaName === "market_value_report") {
    return {
      ...retailRecoveryFixture.finalReport,
      estimatedMarketValue: "$8.00 - $10.00",
      suggestedListingPrice: "$10.00",
      expectedSalePrice: "$8.00 - $10.00",
      minimumAcceptablePrice: "$7.00",
      recommendedSellingPlatform: "Local marketplace",
      expectedSellingTime: "Unknown",
      platformSpecificSellingGuidance: "Use canonical evidence."
    };
  }
  if (schemaName === "marketplace_listing") {
    return {
      optimizedListingTitle: "Cedarline Privacy Mailers 48 Count",
      title: "Cedarline Privacy Mailers 48 Count",
      listingDescription: "Cedarline privacy mailers shown in the submitted photos.",
      description: "Cedarline privacy mailers shown in the submitted photos.",
      itemSpecifics: { Brand: "Cedarline", Quantity: "48 count" },
      itemDetails: { Brand: "Cedarline", Quantity: "48 count" },
      conditionNotes: "Condition shown in submitted photos.",
      recommendedListingPrice: "$10.00",
      pricingConfidence: "Model value must be replaced by canonical evidence."
    };
  }
  throw new Error("Unexpected deterministic schema: " + schemaName);
}

const adapters = {
  getOpenAIApiKey: () => "deterministic-openai-placeholder",
  getOpenAIModel: () => "deterministic-test-model",
  getSerperApiKey: () => "deterministic-serper-placeholder",
  nowMilliseconds: () => Date.parse(retailRecoveryFixture.fixedNow),
  nowIso: () => retailRecoveryFixture.fixedNow,
  createAnalysisId: () => "analysis-local-production-parity",
  requestOpenAIJson: async ({ payload }) => {
    if (MODE === "identity_confirmation") {
      const error = new Error("We found conflicting product details. Confirm the item before research continues.");
      error.identityConfirmationRequired = true;
      error.confirmation = {
        message: "We found conflicting product details.",
        mostLikelyItem: "Deterministic identity candidate",
        conflictingDetailRejected: ["Deterministic conflicting candidate"],
        actions: ["Confirm item", "Edit item description", "Enter UPC", "Upload clearer photo"],
        confirmationToken: "deterministic-confirmation-token",
        canonicalProductIdentity: {
          canonicalConfidence: "Low - material identity conflict requires user confirmation.",
          customerFacingTitle: "Deterministic identity candidate",
          confirmationToken: "deterministic-confirmation-token",
          userConfirmationRequired: true
        }
      };
      throw error;
    }
    if (MODE === "provider_failure") {
      throw new Error("Deterministic provider failure.");
    }
    if (MODE === "invalid_stdout") {
      fs.writeSync(1, "invalid-bridge-output");
      throw new Error("Private deterministic adapter failure.");
    }
    if (MODE === "timeout") {
      return new Promise(() => {});
    }
    if (MODE === "delayed_success" && !delayed) {
      delayed = true;
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
    return {
      json: finalModelResponse(payload?.text?.format?.name),
      data: { output: [] }
    };
  },
  requestSerperSearch: async ({ queryRecord }) => ({
    json: queryRecord?.retailStage === "stage_7_limited_result_recovery"
      ? retailRecoveryFixture.recoveryProviderResponse
      : retailRecoveryFixture.preliminaryProviderResponse,
    statusCode: 200,
    elapsedMs: 1
  }),
  requestBoundedRetailProductPage: async () => retailRecoveryFixture.directPageResult,
  onFinalEvidenceResult: () => {}
};

export default adapters;
`;
}

function writeAdapterModule(mode) {
  const modulePath = path.join(temporaryRoot, `adapter-${mode}.mjs`);
  fs.writeFileSync(modulePath, adapterModuleSource(mode), "utf8");
  adapterPaths.set(mode, modulePath);
  return modulePath;
}

function readTrace(tracePath) {
  if (!fs.existsSync(tracePath)) return [];
  return fs.readFileSync(tracePath, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function writePowerShellObserverLauncher() {
  observerLauncherPath = path.join(temporaryRoot, "powershell-command-observer.ps1");
  const source = [
    "param([int]$Port)",
    '$ErrorActionPreference = "Stop"',
    "",
    "function Write-ObservedCommand {",
    "  param([string]$CommandName)",
    '  $Line = [string]::Concat([string]$PID, "`t", $CommandName, [Environment]::NewLine)',
    "  [System.IO.File]::AppendAllText($env:KATHERINES_EYE_POWERSHELL_OBSERVER_PATH, $Line)",
    "}",
    "",
    'Set-PSBreakpoint -Command "Route-Request" -Action { Write-ObservedCommand "Route-Request" } | Out-Null',
    'Set-PSBreakpoint -Command "Invoke-LocalGenerateListingHandler" -Action { Write-ObservedCommand "Invoke-LocalGenerateListingHandler" } | Out-Null',
    'Set-PSBreakpoint -Command "Invoke-LocalGenerateListingBridge" -Action { Write-ObservedCommand "Invoke-LocalGenerateListingBridge" } | Out-Null',
    "",
    ". $env:KATHERINES_EYE_COMMITTED_SERVER_PATH -Port $Port",
    ""
  ].join("\r\n");
  fs.writeFileSync(observerLauncherPath, source, "utf8");
}

function readPowerShellObserverEvents(server) {
  assert(server.observerPath, "PowerShell command observation is not enabled for this server.");
  if (!fs.existsSync(server.observerPath)) return [];
  return fs.readFileSync(server.observerPath, "utf8")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("\t");
      assert.equal(parts.length, 2, "PowerShell observer event was malformed.");
      const processId = Number(parts[0]);
      assert.equal(Number.isSafeInteger(processId) && processId > 0, true, "PowerShell observer PID was invalid.");
      assert.equal(processId, server.child.pid, "PowerShell observer event came from an unrelated process.");
      assert(observedPowerShellCommands.includes(parts[1]), "PowerShell observer recorded an unexpected command.");
      return { processId, command: parts[1] };
    });
}

function assertObservedCommandCounts(events, expected, label) {
  const counts = Object.fromEntries(observedPowerShellCommands.map((command) => [command, 0]));
  for (const event of events) counts[event.command] += 1;
  for (const command of observedPowerShellCommands) {
    assert.equal(
      counts[command],
      expected[command] ?? 0,
      `${label}: unexpected ${command} observer count.`
    );
  }
  return counts;
}

function sanitizedChildEnvironment({
  adapterMode,
  tracePath,
  networkTracePath,
  nodeExecutable = process.execPath,
  bridgeTimeoutMs
}) {
  const environment = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (!credentialPattern.test(name) && name !== "NODE_OPTIONS") {
      environment[name] = value;
    }
  }
  Object.assign(environment, {
    OPENAI_API_KEY: "disabled-local-parity-test",
    OPEN_API_KEY: "disabled-local-parity-test",
    SERPER_API_KEY: "disabled-local-parity-test",
    HTTP_PROXY: "http://127.0.0.1:9",
    HTTPS_PROXY: "http://127.0.0.1:9",
    NO_PROXY: "127.0.0.1,localhost",
    KATHERINES_EYE_HANDLER_ADAPTER_MODULE: adapterPaths.get(adapterMode),
    KATHERINES_EYE_NODE_EXECUTABLE: nodeExecutable,
    KATHERINES_EYE_PARITY_CHILD: "1",
    KATHERINES_EYE_ADAPTER_DENY_NETWORK: "1",
    KATHERINES_EYE_PARITY_TRACE_PATH: tracePath,
    KATHERINES_EYE_PARITY_NETWORK_TRACE_PATH: networkTracePath
  });
  const dotenvPath = path.join(root, ".env");
  if (fs.existsSync(dotenvPath)) {
    for (const line of fs.readFileSync(dotenvPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (match && credentialPattern.test(match[1])) {
        environment[match[1]] = "disabled-local-parity-test";
      }
    }
  }
  if (bridgeTimeoutMs !== undefined) {
    environment.KATHERINES_EYE_BRIDGE_TIMEOUT_MS = String(bridgeTimeoutMs);
  }
  return environment;
}

async function reserveLoopbackPort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.unref();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const { port } = listener.address();
      listener.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function loopbackRequest({
  port,
  method = "POST",
  requestPath = "/api/generate-listing",
  body = Buffer.alloc(0),
  headers = {},
  timeoutMs = 15000
}) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return new Promise((resolve, reject) => {
    const request = http.request({
      host: "127.0.0.1",
      port,
      method,
      path: requestPath,
      headers: {
        ...headers,
        "Content-Length": payload.length
      }
    }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.once("error", reject);
      response.once("end", () => resolve({
        statusCode: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks)
      }));
    });
    request.setTimeout(timeoutMs, () => request.destroy(new Error("Loopback request timed out.")));
    request.once("error", reject);
    request.end(payload);
  });
}

function rawOversizedLoopbackRequest({
  port,
  declaredContentLength,
  chunks = [],
  chunkDelayMs = 0,
  timeoutMs = 15000
}) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({
      host: "127.0.0.1",
      port,
      allowHalfOpen: true
    });
    const responseChunks = [];
    let response = null;
    let sendsComplete = false;
    let settled = false;

    const finishIfComplete = () => {
      if (settled || !response || !sendsComplete) return;
      settled = true;
      socket.destroy();
      resolve(response);
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(error);
    };
    const parseResponse = () => {
      const received = Buffer.concat(responseChunks);
      const headerEnd = received.indexOf("\r\n\r\n");
      if (headerEnd < 0) return;
      const headerText = received.subarray(0, headerEnd).toString("ascii");
      const lines = headerText.split("\r\n");
      const statusMatch = lines.shift()?.match(/^HTTP\/1\.1\s+(\d{3})\b/);
      if (!statusMatch) {
        fail(new Error("Oversized response status line was invalid."));
        return;
      }
      const headers = {};
      for (const line of lines) {
        const separator = line.indexOf(":");
        if (separator < 1) continue;
        headers[line.slice(0, separator).trim().toLowerCase()] = line.slice(separator + 1).trim();
      }
      const contentLength = Number(headers["content-length"]);
      if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
        fail(new Error("Oversized response Content-Length was invalid."));
        return;
      }
      const bodyStart = headerEnd + 4;
      if (received.length < bodyStart + contentLength) return;
      response = {
        statusCode: Number(statusMatch[1]),
        headers,
        body: received.subarray(bodyStart, bodyStart + contentLength)
      };
      finishIfComplete();
    };
    const writeChunk = (chunk) => new Promise((resolveWrite, rejectWrite) => {
      socket.write(chunk, (error) => error ? rejectWrite(error) : resolveWrite());
    });

    socket.setNoDelay(true);
    socket.setTimeout(timeoutMs, () => fail(new Error("Raw oversized loopback request timed out.")));
    socket.on("data", (chunk) => {
      responseChunks.push(chunk);
      parseResponse();
    });
    socket.once("error", fail);
    socket.once("end", () => {
      parseResponse();
      if (!response) fail(new Error("Oversized connection ended before a complete response."));
    });
    socket.once("connect", async () => {
      try {
        await writeChunk(Buffer.from([
          "POST /api/generate-listing HTTP/1.1",
          `Host: 127.0.0.1:${port}`,
          "Content-Type: application/json",
          `Content-Length: ${declaredContentLength}`,
          "Connection: close",
          "",
          ""
        ].join("\r\n"), "ascii"));
        for (const chunk of chunks) {
          if (chunkDelayMs > 0) {
            await new Promise((resolveDelay) => setTimeout(resolveDelay, chunkDelayMs));
          }
          await writeChunk(chunk);
        }
        sendsComplete = true;
        finishIfComplete();
      } catch (error) {
        fail(error);
      }
    });
  });
}

function assertOversizedResponse(response) {
  assert.equal(response.statusCode, 413);
  assert.equal(response.headers["content-type"], "application/json; charset=utf-8");
  assert.equal(response.headers["cache-control"], "no-store", "Oversized response Cache-Control must be exactly no-store.");
  assert.equal(response.headers.connection, "close");
  assert.equal(Number(response.headers["content-length"]), response.body.length);
  assert.deepEqual(response.body, expectedOversizedResponseBody);
  assert.deepEqual(JSON.parse(response.body.toString("utf8")), {
    error: "Request body is too large.",
    code: "request_body_too_large"
  });
}

async function waitForServer(port, child) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error("Local PowerShell server exited before becoming ready.");
    }
    try {
      const response = await loopbackRequest({ port, method: "GET", requestPath: "/" });
      if (response.statusCode === 200) return;
    } catch {
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error("Local PowerShell server did not become ready.");
}

async function startServer({
  adapterMode = "success",
  nodeExecutable,
  bridgeTimeoutMs,
  observePowerShellCommands = false
} = {}) {
  const port = await reserveLoopbackPort();
  const tracePath = path.join(temporaryRoot, `trace-${adapterMode}-${port}.jsonl`);
  const networkTracePath = path.join(temporaryRoot, `network-${adapterMode}-${port}.jsonl`);
  const observerPath = observePowerShellCommands
    ? path.join(temporaryRoot, `observer-${adapterMode}-${port}.tsv`)
    : null;
  const childEnvironment = sanitizedChildEnvironment({
    adapterMode,
    tracePath,
    networkTracePath,
    nodeExecutable,
    bridgeTimeoutMs
  });
  if (observePowerShellCommands) {
    childEnvironment.KATHERINES_EYE_POWERSHELL_OBSERVER_PATH = observerPath;
    childEnvironment.KATHERINES_EYE_COMMITTED_SERVER_PATH = serverPath;
  }
  const child = spawn("powershell.exe", [
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-File", observePowerShellCommands ? observerLauncherPath : serverPath,
    "-Port", String(port)
  ], {
    cwd: root,
    env: childEnvironment,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });
  let outputBytes = 0;
  child.stdout.on("data", (chunk) => {
    outputBytes += chunk.length;
  });
  child.stderr.on("data", (chunk) => {
    outputBytes += chunk.length;
  });
  const server = { child, port, tracePath, networkTracePath, observerPath, outputBytes };
  trackedServers.add(server);
  try {
    await waitForServer(port, child);
    return server;
  } catch (error) {
    await stopServer(server);
    throw error;
  }
}

async function stopServer(server) {
  if (!server || !trackedServers.has(server)) return;
  trackedServers.delete(server);
  if (server.child.exitCode === null) {
    server.child.kill();
    await Promise.race([
      new Promise((resolve) => server.child.once("exit", resolve)),
      new Promise((_, reject) => setTimeout(() => reject(new Error("PowerShell test server did not exit.")), 10000))
    ]);
  }
}

function createResponseCapture() {
  const headers = new Map();
  let statusCode = 200;
  let body = null;
  return {
    response: {
      status(code) {
        statusCode = code;
        return this;
      },
      setHeader(name, value) {
        headers.set(String(name).toLowerCase(), String(value));
        return this;
      },
      getHeader(name) {
        return headers.get(String(name).toLowerCase());
      },
      json(payload) {
        if (!headers.has("content-type")) {
          headers.set("content-type", "application/json; charset=utf-8");
        }
        body = Buffer.from(JSON.stringify(payload), "utf8");
        return this;
      },
      send(payload) {
        body = Buffer.from(String(payload ?? ""), "utf8");
        return this;
      },
      end(payload = "") {
        body = Buffer.from(String(payload), "utf8");
        return this;
      }
    },
    result() {
      assert(body, "Production handler did not complete a response.");
      return {
        statusCode,
        headers: Object.fromEntries(headers),
        body
      };
    }
  };
}

async function importAdapters(mode) {
  const imported = await import(`${pathToFileURL(adapterPaths.get(mode)).href}?direct=${Date.now()}-${Math.random()}`);
  return imported.default;
}

async function invokeDirect(rawBody, { adapterMode = "success", method = "POST" } = {}) {
  const adapters = await importAdapters(adapterMode);
  const handler = createGenerateListingHandler(adapters);
  const capture = createResponseCapture();
  const networkGuard = installHardNetworkDenial();
  try {
    await handler({
      method,
      url: "/api/generate-listing",
      headers: { "content-type": "application/json" },
      body: rawBody.toString("utf8")
    }, capture.response);
  } finally {
    networkGuard.restore();
  }
  assert.equal(networkGuard.attempts.length, 0, "Direct handler made an unexpected external network attempt.");
  return capture.result();
}

async function assertHandlerParity(rawBody, {
  adapterMode = "success",
  server = mainServer,
  expectedStatus,
  requestTimeoutMs
} = {}) {
  const direct = await invokeDirect(rawBody, { adapterMode });
  const local = await loopbackRequest({
    port: server.port,
    body: rawBody,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    timeoutMs: requestTimeoutMs
  });
  if (server === mainServer) mainBridgeInvocationCount += 1;

  assert.equal(local.statusCode, direct.statusCode);
  if (expectedStatus !== undefined) assert.equal(local.statusCode, expectedStatus);
  assert.equal(local.headers["content-type"], direct.headers["content-type"]);
  assert.deepEqual(local.body, direct.body, "Local response bytes differ from the direct production handler.");
  assert.deepEqual(JSON.parse(local.body.toString("utf8")), JSON.parse(direct.body.toString("utf8")));
  return { direct, local, payload: JSON.parse(local.body.toString("utf8")) };
}

function requestBodyForPurpose({
  purchaseIntent,
  reportType,
  analysisId,
  notes = "Security envelopes, strip and seal, 48 count.",
  pretty = false
}) {
  const intake = {
    ...retailRecoveryFixture.buyerIntake,
    purchase_intent: purchaseIntent,
    buyer_intent: purchaseIntent,
    ...(purchaseIntent === "owner_value" ? { asking_price: "", observed_price: "" } : {})
  };
  const body = {
    analysisId,
    reportType,
    platform: reportType === "listing" ? "Local marketplace" : "",
    notes,
    photos: [{
      name: "sanitized-retail-package.png",
      dataUrl: "data:image/png;base64,iVBORw0KGgo="
    }],
    ...(reportType === "listing" ? { sellerIntake: intake } : { buyerIntake: intake })
  };
  return Buffer.from(JSON.stringify(body, null, pretty ? 2 : 0), "utf8");
}

function assertCanonicalSuccess(payload, envelope) {
  const report = payload[envelope];
  assert(report, `Missing ${envelope} response.`);
  assert.deepEqual(report.pricesFound, report.customerEvidence, "pricesFound is not the customerEvidence compatibility alias.");
  assert(report.customerEvidence.every((record) => record.evidenceId), "Canonical customer evidence is missing stable IDs.");
  assert.deepEqual(
    report.customerEvidence.map((record) => record.evidenceId),
    report.searchDiagnostics.canonicalCustomerEvidenceIds
  );
  for (const field of ["decisionResult", "buyerOfferResult"]) {
    assert(Object.hasOwn(report, field), `Required canonical ${field} projection is missing.`);
  }
  for (const field of ["rangeResult", "confidenceResult", "badgeResult"]) {
    if (Object.hasOwn(report, field)) {
      assert(report[field] && typeof report[field] === "object", `Canonical ${field} projection is invalid.`);
    }
  }
}

async function pidIsRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForTrace(tracePath, predicate, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const match = readTrace(tracePath).find(predicate);
    if (match) return match;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error("Timed out waiting for deterministic adapter trace.");
}

async function waitForPidExit(pid, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!(await pidIsRunning(pid))) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`Bridge process ${pid} remained alive.`);
}

before(async () => {
  temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "katherines-eye-local-parity-"));
  for (const mode of [
    "success",
    "identity_confirmation",
    "provider_failure",
    "invalid_stdout",
    "nonzero_exit",
    "timeout",
    "delayed_success"
  ]) {
    writeAdapterModule(mode);
  }
  writePowerShellObserverLauncher();
  mainServer = await startServer({ observePowerShellCommands: true });
});

after(async () => {
  for (const server of [...trackedServers]) {
    await stopServer(server);
  }
  const traceFiles = fs.existsSync(temporaryRoot)
    ? fs.readdirSync(temporaryRoot).filter((name) => name.startsWith("trace-"))
    : [];
  for (const traceFile of traceFiles) {
    for (const event of readTrace(path.join(temporaryRoot, traceFile))) {
      if (event.pid) assert.equal(await pidIsRunning(event.pid), false, `Orphan bridge process ${event.pid} remains.`);
    }
  }
  fs.rmSync(temporaryRoot, { recursive: true, force: true });
  assert.equal(fs.existsSync(temporaryRoot), false, "Temporary parity material remains.");
  console.log('observer-cleanup: {"temporaryObserverFilesRemaining":0}');
});

const purposeCases = [
  { name: "Buying for Myself", purchaseIntent: "personal_use", purpose: "personal", reportType: "marketValue", envelope: "valuation" },
  { name: "Buying to Resell", purchaseIntent: "resale", purpose: "resale", reportType: "marketValue", envelope: "valuation" },
  { name: "Value Something I Own", purchaseIntent: "owner_value", purpose: "owner_value", reportType: "marketValue", envelope: "valuation" },
  { name: "Sell Something I Own", purchaseIntent: "seller_listing", purpose: "seller_listing", reportType: "listing", envelope: "listing" }
];

for (const scenario of purposeCases) {
  test(`local server exactly matches the production handler for ${scenario.name}`, async () => {
    const result = await assertHandlerParity(requestBodyForPurpose({
      purchaseIntent: scenario.purchaseIntent,
      reportType: scenario.reportType,
      analysisId: `analysis-parity-${scenario.purpose}`
    }), { expectedStatus: 200 });
    assertCanonicalSuccess(result.payload, scenario.envelope);
    assert.equal(result.payload[scenario.envelope].decisionResult.purpose, scenario.purpose);
  });
}

test("malformed JSON reaches the production handler with exact status and body parity", async () => {
  await assertHandlerParity(Buffer.from('{\n  "photos": [', "utf8"), { expectedStatus: 502 });
});

test("empty body has exact production-handler parity", async () => {
  await assertHandlerParity(Buffer.alloc(0), { expectedStatus: 400 });
});

test("missing required photo has exact production-handler parity", async () => {
  await assertHandlerParity(Buffer.from(' { "analysisId" : "missing-photo", "photos" : [ ] } ', "utf8"), { expectedStatus: 400 });
});

test("invalid photo contract has exact production-handler parity", async () => {
  await assertHandlerParity(Buffer.from(JSON.stringify({
    analysisId: "invalid-photo",
    photos: [{ name: "not-an-image.txt", dataUrl: "data:text/plain;base64,SGVsbG8=" }]
  }), "utf8"), { expectedStatus: 400 });
});

test("identity-confirmation-required response has exact 409 parity", async () => {
  const server = await startServer({ adapterMode: "identity_confirmation" });
  try {
    const result = await assertHandlerParity(requestBodyForPurpose({
      purchaseIntent: "personal_use",
      reportType: "marketValue",
      analysisId: "analysis-parity-identity-confirmation"
    }), { adapterMode: "identity_confirmation", server, expectedStatus: 409 });
    assert.equal(result.payload.action, "identity_confirmation_required");
    assert.equal(readTrace(server.tracePath).filter((event) => event.event === "adapter_import").length, 1);
  } finally {
    await stopServer(server);
  }
});

test("deterministic provider failure has exact handler 502 parity", async () => {
  const server = await startServer({ adapterMode: "provider_failure" });
  try {
    const result = await assertHandlerParity(requestBodyForPurpose({
      purchaseIntent: "personal_use",
      reportType: "marketValue",
      analysisId: "analysis-parity-provider-failure"
    }), { adapterMode: "provider_failure", server, expectedStatus: 502 });
    assert.equal(result.payload.error, "Deterministic provider failure.");
    assert.equal(readTrace(server.tracePath).filter((event) => event.event === "adapter_import").length, 1);
  } finally {
    await stopServer(server);
  }
});

test("Unicode, whitespace, field ordering, and array ordering survive the raw-body bridge", async () => {
  const rawBody = requestBodyForPurpose({
    purchaseIntent: "personal_use",
    reportType: "marketValue",
    analysisId: "analysis-parity-unicode",
    notes: "  Café “Katherine’s Eye” — 雪 ❄️\n\t48 count; preserve [α, β, γ].  ",
    pretty: true
  });
  const result = await assertHandlerParity(rawBody, { expectedStatus: 200 });
  assertCanonicalSuccess(result.payload, "valuation");
});

test("unrelated local routes, static MIME handling, traversal rejection, and method routing remain intact", async () => {
  const rootResponse = await loopbackRequest({ port: mainServer.port, method: "GET", requestPath: "/" });
  assert.equal(rootResponse.statusCode, 200);
  assert.match(rootResponse.headers["content-type"], /^text\/html/);
  const scriptResponse = await loopbackRequest({ port: mainServer.port, method: "GET", requestPath: "/app.js" });
  assert.equal(scriptResponse.statusCode, 200);
  assert.match(scriptResponse.headers["content-type"], /^application\/javascript/);
  const traversalResponse = await loopbackRequest({ port: mainServer.port, method: "GET", requestPath: "/..%2Fserver.ps1" });
  assert.equal(traversalResponse.statusCode, 403);
  const reverseInvalid = await loopbackRequest({
    port: mainServer.port,
    requestPath: "/api/reverse-geocode",
    body: Buffer.from("{}", "utf8"),
    headers: { "Content-Type": "application/json" }
  });
  assert.equal(reverseInvalid.statusCode, 400);
  const postUnknown = await loopbackRequest({ port: mainServer.port, requestPath: "/api/not-a-route" });
  assert.equal(postUnknown.statusCode, 405);
  const getGenerate = await loopbackRequest({ port: mainServer.port, method: "GET", requestPath: "/api/generate-listing" });
  assert.equal(getGenerate.statusCode, 404);
  const optionsGenerate = await loopbackRequest({ port: mainServer.port, method: "OPTIONS", requestPath: "/api/generate-listing" });
  assert.equal(optionsGenerate.statusCode, 405);
});

test("oversized local requests reliably return 413 without launching the bridge", async () => {
  const traceBeforeOversized = readTrace(mainServer.tracePath);
  const observerBeforeOversized = readPowerShellObserverEvents(mainServer).length;
  const metrics = {
    attempted: 0,
    http413: 0,
    econnreset: 0,
    otherSocketFailures: 0,
    bridgeLaunches: 0,
    routeEntries: 0,
    localHandlerEntries: 0,
    bridgeFunctionEntries: 0,
    cacheControlAssertions: 0,
    observerSelfChecks: 0,
    staticControl: null,
    validAnalysisControl: null,
    orphanProcesses: 0
  };
  const validResponseContract = {
    statusCode: 413,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      connection: "close",
      "content-length": String(expectedOversizedResponseBody.length)
    },
    body: expectedOversizedResponseBody
  };
  assert.throws(
    () => assertObservedCommandCounts([], { "Route-Request": 1 }, "disabled observer counterfactual"),
    /disabled observer counterfactual/
  );
  metrics.observerSelfChecks += 1;
  const missingCacheControl = {
    ...validResponseContract,
    headers: { ...validResponseContract.headers }
  };
  delete missingCacheControl.headers["cache-control"];
  assert.throws(() => assertOversizedResponse(missingCacheControl), /Cache-Control/);
  assert.throws(
    () => assertOversizedResponse({
      ...validResponseContract,
      headers: { ...validResponseContract.headers, "cache-control": "no-store, max-age=0" }
    }),
    /Cache-Control/
  );
  assert.doesNotThrow(() => assertOversizedResponse(validResponseContract));
  metrics.cacheControlAssertions += 3;
  const observeOversized = async (requestPromise) => {
    metrics.attempted += 1;
    try {
      const response = await requestPromise;
      assertOversizedResponse(response);
      metrics.http413 += 1;
      return response;
    } catch (error) {
      if (error?.code === "ECONNRESET") metrics.econnreset += 1;
      else metrics.otherSocketFailures += 1;
      throw error;
    }
  };

  const earlyPayload = Buffer.alloc(256 * 1024, 0x20);
  for (let index = 0; index < 50; index += 1) {
    await observeOversized(rawOversizedLoopbackRequest({
      port: mainServer.port,
      declaredContentLength: maxRequestBodyBytes + 1,
      chunks: [earlyPayload]
    }));
  }

  const concurrentPayload = Buffer.alloc(128 * 1024, 0x20);
  await Promise.all(Array.from({ length: 20 }, () => observeOversized(rawOversizedLoopbackRequest({
    port: mainServer.port,
    declaredContentLength: maxRequestBodyBytes + 1,
    chunks: [concurrentPayload]
  }))));

  const fragmentedChunks = Array.from({ length: 4 }, () => Buffer.alloc(32 * 1024, 0x20));
  for (let index = 0; index < 10; index += 1) {
    await observeOversized(rawOversizedLoopbackRequest({
      port: mainServer.port,
      declaredContentLength: maxRequestBodyBytes + 1,
      chunks: fragmentedChunks,
      chunkDelayMs: 5
    }));
  }

  await observeOversized(rawOversizedLoopbackRequest({
    port: mainServer.port,
    declaredContentLength: maxRequestBodyBytes + 1
  }));

  await observeOversized(loopbackRequest({
    port: mainServer.port,
    body: Buffer.alloc(maxRequestBodyBytes + 1, 0x20),
    headers: { "Content-Type": "application/json" },
    timeoutMs: 30000
  }));

  await observeOversized(rawOversizedLoopbackRequest({
    port: mainServer.port,
    declaredContentLength: maxRequestBodyBytes + 1,
    chunks: [Buffer.from(" ", "utf8")]
  }));

  const traceAfterOversized = readTrace(mainServer.tracePath);
  metrics.bridgeLaunches = traceAfterOversized.length - traceBeforeOversized.length;
  const oversizedCommandCounts = assertObservedCommandCounts(
    readPowerShellObserverEvents(mainServer).slice(observerBeforeOversized),
    {},
    "oversized requests"
  );
  metrics.routeEntries = oversizedCommandCounts["Route-Request"];
  metrics.localHandlerEntries = oversizedCommandCounts["Invoke-LocalGenerateListingHandler"];
  metrics.bridgeFunctionEntries = oversizedCommandCounts["Invoke-LocalGenerateListingBridge"];
  assert.equal(metrics.attempted, 83);
  assert.equal(metrics.http413, 83);
  assert.equal(metrics.econnreset, 0);
  assert.equal(metrics.otherSocketFailures, 0);
  assert.equal(metrics.bridgeLaunches, 0, "Oversized requests launched the bridge.");

  const exactLimitBody = Buffer.alloc(maxRequestBodyBytes, 0x20);
  Buffer.from('{"analysisId":"exact-limit","photos":[]}', "utf8").copy(exactLimitBody);
  await assertHandlerParity(exactLimitBody, {
    expectedStatus: 400,
    requestTimeoutMs: 60000
  });

  const observerBeforeStaticControl = readPowerShellObserverEvents(mainServer).length;
  const traceBeforeStaticControl = readTrace(mainServer.tracePath).length;
  const rootResponse = await loopbackRequest({
    port: mainServer.port,
    method: "GET",
    requestPath: "/"
  });
  assert.equal(rootResponse.statusCode, 200);
  assert.match(rootResponse.headers["content-type"], /^text\/html/);
  const staticControlCounts = assertObservedCommandCounts(
    readPowerShellObserverEvents(mainServer).slice(observerBeforeStaticControl),
    { "Route-Request": 1 },
    "static route positive control"
  );
  const staticControlBridgeLaunches = readTrace(mainServer.tracePath).length - traceBeforeStaticControl;
  assert.equal(staticControlBridgeLaunches, 0, "Static route launched the bridge.");
  metrics.staticControl = {
    routeEntries: staticControlCounts["Route-Request"],
    localHandlerEntries: staticControlCounts["Invoke-LocalGenerateListingHandler"],
    bridgeFunctionEntries: staticControlCounts["Invoke-LocalGenerateListingBridge"],
    bridgeLaunches: staticControlBridgeLaunches
  };

  const observerBeforeValidControl = readPowerShellObserverEvents(mainServer).length;
  const traceBeforeValidControl = readTrace(mainServer.tracePath).length;
  await assertHandlerParity(requestBodyForPurpose({
    purchaseIntent: "personal_use",
    reportType: "marketValue",
    analysisId: "analysis-parity-post-oversized-stress"
  }), { expectedStatus: 200 });
  const validControlCounts = assertObservedCommandCounts(
    readPowerShellObserverEvents(mainServer).slice(observerBeforeValidControl),
    {
      "Route-Request": 1,
      "Invoke-LocalGenerateListingHandler": 1,
      "Invoke-LocalGenerateListingBridge": 1
    },
    "valid analysis positive control"
  );
  const validControlBridgeLaunches = readTrace(mainServer.tracePath).length - traceBeforeValidControl;
  assert.equal(validControlBridgeLaunches, 1, "Valid analysis did not launch exactly one observed bridge process.");
  metrics.validAnalysisControl = {
    routeEntries: validControlCounts["Route-Request"],
    localHandlerEntries: validControlCounts["Invoke-LocalGenerateListingHandler"],
    bridgeFunctionEntries: validControlCounts["Invoke-LocalGenerateListingBridge"],
    bridgeLaunches: validControlBridgeLaunches
  };

  const newBridgeEvents = readTrace(mainServer.tracePath).slice(traceAfterOversized.length);
  for (const event of newBridgeEvents) {
    if (!event.pid) continue;
    await waitForPidExit(event.pid);
    if (await pidIsRunning(event.pid)) metrics.orphanProcesses += 1;
  }
  assert.equal(metrics.orphanProcesses, 0);
  assert.equal(mainServer.child.exitCode, null, "Oversized stress terminated the PowerShell listener.");
  console.log(`oversized-stress: ${JSON.stringify(metrics)}`);
});

test("missing Node executable fails closed without invoking the legacy engine", async () => {
  const missingExecutable = path.join(temporaryRoot, "missing-node.exe");
  const server = await startServer({ nodeExecutable: missingExecutable });
  try {
    const response = await loopbackRequest({
      port: server.port,
      body: requestBodyForPurpose({
        purchaseIntent: "personal_use",
        reportType: "marketValue",
        analysisId: "analysis-parity-missing-node"
      }),
      headers: { "Content-Type": "application/json" }
    });
    const payload = JSON.parse(response.body.toString("utf8"));
    assert.equal(response.statusCode, 502);
    assert.equal(payload.code, "local_handler_transport_error");
    assert.equal(readTrace(server.tracePath).length, 0, "Missing Node path still imported an adapter.");
  } finally {
    await stopServer(server);
  }
});

test("extra or malformed bridge stdout fails closed without leaking diagnostics", async () => {
  const server = await startServer({ adapterMode: "invalid_stdout" });
  try {
    const response = await loopbackRequest({
      port: server.port,
      body: requestBodyForPurpose({
        purchaseIntent: "personal_use",
        reportType: "marketValue",
        analysisId: "analysis-parity-invalid-protocol"
      }),
      headers: { "Content-Type": "application/json" }
    });
    const bodyText = response.body.toString("utf8");
    assert.equal(response.statusCode, 502);
    assert.equal(JSON.parse(bodyText).code, "local_handler_transport_error");
    assert.doesNotMatch(bodyText, /invalid-bridge-output|Private deterministic|adapter|stack|scripts/i);
  } finally {
    await stopServer(server);
  }
});

test("bridge nonzero exit fails closed", async () => {
  const server = await startServer({ adapterMode: "nonzero_exit" });
  try {
    const response = await loopbackRequest({
      port: server.port,
      body: requestBodyForPurpose({
        purchaseIntent: "personal_use",
        reportType: "marketValue",
        analysisId: "analysis-parity-nonzero"
      }),
      headers: { "Content-Type": "application/json" }
    });
    assert.equal(response.statusCode, 502);
    assert.equal(JSON.parse(response.body.toString("utf8")).code, "local_handler_transport_error");
  } finally {
    await stopServer(server);
  }
});

test("bridge timeout kills only its child and leaves no orphan", async () => {
  const server = await startServer({ adapterMode: "timeout", bridgeTimeoutMs: 250 });
  try {
    const response = await loopbackRequest({
      port: server.port,
      body: requestBodyForPurpose({
        purchaseIntent: "personal_use",
        reportType: "marketValue",
        analysisId: "analysis-parity-timeout"
      }),
      headers: { "Content-Type": "application/json" }
    });
    assert.equal(response.statusCode, 502);
    assert.equal(JSON.parse(response.body.toString("utf8")).code, "local_handler_transport_error");
    const trace = await waitForTrace(server.tracePath, (event) => event.event === "adapter_import");
    await waitForPidExit(trace.pid);
    assert.equal(server.child.exitCode, null, "Timeout terminated the PowerShell listener.");
  } finally {
    await stopServer(server);
  }
});

test("client cancellation leaves no bridge process and the local listener remains usable", async () => {
  const server = await startServer({ adapterMode: "delayed_success", bridgeTimeoutMs: 10000 });
  try {
    const rawBody = requestBodyForPurpose({
      purchaseIntent: "personal_use",
      reportType: "marketValue",
      analysisId: "analysis-parity-cancelled-client"
    });
    const socket = net.createConnection({ host: "127.0.0.1", port: server.port });
    await new Promise((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("error", reject);
    });
    socket.write([
      "POST /api/generate-listing HTTP/1.1",
      `Host: 127.0.0.1:${server.port}`,
      "Content-Type: application/json",
      `Content-Length: ${rawBody.length}`,
      "Connection: close",
      "",
      ""
    ].join("\r\n"));
    socket.write(rawBody);
    const trace = await waitForTrace(server.tracePath, (event) => event.event === "adapter_import");
    socket.destroy();
    await waitForPidExit(trace.pid);
    const ready = await loopbackRequest({ port: server.port, method: "GET", requestPath: "/" });
    assert.equal(ready.statusCode, 200);
  } finally {
    await stopServer(server);
  }
});

test("static source proves bridge-only dispatch and physical legacy removal", () => {
  const serverSource = fs.readFileSync(serverPath, "utf8");
  const routeStart = serverSource.indexOf("function Route-Request");
  const routeEnd = serverSource.indexOf("function Get-LocalNodeExecutable", routeStart);
  const routeSource = serverSource.slice(routeStart, routeEnd);
  assert.match(routeSource, /Invoke-LocalGenerateListingHandler \$Stream \$Request/);
  const bridgeRouteStart = serverSource.indexOf("function Invoke-LocalGenerateListingHandler");
  const bridgeRouteEnd = serverSource.indexOf("function Handle-ReverseGeocode", bridgeRouteStart);
  const bridgeRouteSource = serverSource.slice(bridgeRouteStart, bridgeRouteEnd);
  assert.match(bridgeRouteSource, /Invoke-LocalGenerateListingBridge/);
  assert.match(bridgeRouteSource, /local_handler_transport_error/);
  assert.equal((serverSource.match(/\bInvoke-LocalGenerateListingHandler\b/g) || []).length, 2);
  assert.equal((serverSource.match(/\bInvoke-LocalGenerateListingBridge\b/g) || []).length, 2);
  for (const functionName of removedLegacyPowerShellFunctions) {
    const escapedName = functionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.doesNotMatch(
      serverSource,
      new RegExp(`\\b${escapedName}\\b`, "i"),
      `Removed legacy PowerShell symbol remains: ${functionName}`
    );
  }
  assert.doesNotMatch(
    serverSource,
    /\b(?:Invoke-Expression|Invoke-Command|Set-Alias|New-Alias|Register-ObjectEvent|Start-Job)\b/i
  );

  const bridgeSource = fs.readFileSync(bridgePath, "utf8");
  assert.match(bridgeSource, /new URL\("\.\.\/api\/generate-listing\.js", import\.meta\.url\)/);
  assert.match(bridgeSource, /createGenerateListingHandler\(adapters\)/);
  assert.equal((bridgeSource.match(/createGenerateListingHandler\(adapters\)/g) || []).length, 1);
  assert.match(bridgeSource, /rawBodyBase64/);
  assert.doesNotMatch(bridgeSource, /https?:\/\/(?:www\.)?katherineseye\.com/i);
  assert.doesNotMatch(bridgeSource, /createFinalEvidenceResult|assembleFinalEvidence|deriveCanonicalRange|deriveCanonicalDecision/);
});

test("each successful main-server request used one bridge and no unexpected network", () => {
  const imports = readTrace(mainServer.tracePath).filter((event) => event.event === "adapter_import");
  assert.equal(imports.length, mainBridgeInvocationCount);
  assert.equal(readTrace(mainServer.networkTracePath).length, 0, "Node child made an unexpected network attempt.");
  assert.equal(mainServer.child.exitCode, null);
});
