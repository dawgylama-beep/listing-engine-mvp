param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content -LiteralPath (Join-Path $Root "api/generate-listing.js") -Raw
$decisions = Get-Content -LiteralPath (Join-Path $Root "lib/evidence/decisions.js") -Raw
$server = Get-Content -LiteralPath (Join-Path $Root "server.ps1") -Raw
$app = Get-Content -LiteralPath (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content -LiteralPath (Join-Path $Root "public/styles.css") -Raw
$index = Get-Content -LiteralPath (Join-Path $Root "public/index.html") -Raw
$package = Get-Content -LiteralPath (Join-Path $Root "package.json") -Raw
$roadmap = Get-Content -LiteralPath (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.25"; Text = $index; Pattern = "Version 1.12.25" },
  @{ Name = "Package version is 1.12.25"; Text = $package; Pattern = '"version": "1.12.25"' },
  @{ Name = "Server version is 1.12.25"; Text = $server; Pattern = '$AppVersion = "1.12.25"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "API has query-bound live-search payload"; Text = $api; Pattern = "function createQueryBoundLiveSearchPayload" },
  @{ Name = "API builds prioritized query records"; Text = $api; Pattern = "function buildPrioritizedQueryRecords" },
  @{ Name = "API records provider request records"; Text = $api; Pattern = "providerRequestRecords" },
  @{ Name = "API records provider response summaries"; Text = $api; Pattern = "providerResponseSummaries" },
  @{ Name = "API separates generated queries"; Text = $api; Pattern = "queriesGenerated" },
  @{ Name = "API separates prioritized queries"; Text = $api; Pattern = "queriesPrioritized" },
  @{ Name = "API separates actually sent queries"; Text = $api; Pattern = "queriesActuallySent" },
  @{ Name = "API marks query-bound mode"; Text = $api; Pattern = "query_bound_provider_requests" },
  @{ Name = "API includes honest execution limitation"; Text = $api; Pattern = "executionLimitation" },
  @{ Name = "API sanitizer removes client-visible prompt fields"; Text = $api; Pattern = "function sanitizeClientVisiblePayload" },
  @{ Name = "API internal prompt guard includes leaked phrase"; Text = $api; Pattern = "perform source-routed live comparable search" },
  @{ Name = "API generated queries do not fall back to sent queries"; Text = $api; Pattern = "queriesActuallySent: providerRequestRecords.filter((record) => record.attempted).map((record) => record.query)" },
  @{ Name = "API records raw result producing query"; Text = $api; Pattern = "query: queryRecord.query" },
  @{ Name = "API separates provider domains from sources requested"; Text = $api; Pattern = "sourcesActuallyQueried" },
  @{ Name = "API prevents holiday wording on generic collectibles"; Text = $api; Pattern = "Targeted seasonal decor and collectible resale/reference source categories." },
  @{ Name = "API has diverse query builder"; Text = $api; Pattern = "function buildDiverseSearchIntentQueries" },
  @{ Name = "API preserves quoted visible phrases"; Text = $api; Pattern = "function quoteSearchPhrase" },
  @{ Name = "API deduplicates repetitive queries"; Text = $api; Pattern = "function isRepetitiveQuery" },
  @{ Name = "API suppresses unsupported Older Model"; Text = $api; Pattern = "function isOlderModelRiskSupported" },
  @{ Name = "API suppresses unsupported No Warranty"; Text = $api; Pattern = "function isNoWarrantyRiskSupported" },
  @{ Name = "API narrows No Return Protection"; Text = $api; Pattern = "function isNoReturnProtectionSupported" },
  @{ Name = "Canonical decision limits wait guidance to supported contradiction"; Text = $decisions; Pattern = "entered_price_above_canonical_retail_limit" },
  @{ Name = "Frontend sends analysis id"; Text = $app; Pattern = "analysisId: request.analysisId" },
  @{ Name = "Frontend stores analysis id in session"; Text = $app; Pattern = "analysisId: firstNonEmpty(report.analysisId, analysisId)" },
  @{ Name = "Frontend clears item session before run"; Text = $app; Pattern = "clearItemSession({ abortAsk: true })" },
  @{ Name = "Frontend renders query cards"; Text = $app; Pattern = "function renderQueryDiagnosticCard" },
  @{ Name = "Frontend shows query diagnostic label"; Text = $app; Pattern = "Search Query Diagnostics" },
  @{ Name = "Frontend cleans literal slash-n"; Text = $app; Pattern = "function cleanDiagnosticText" },
  @{ Name = "Styles stack diagnostic rows"; Text = $styles; Pattern = ".query-diagnostic-facts" },
  @{ Name = "Server protects client-visible data"; Text = $server; Pattern = "function Protect-ClientVisibleData" },
  @{ Name = "Server filters unsafe action queries"; Text = $server; Pattern = "Test-InternalPromptFragment $Query" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

$productionText = @($api, $server, $app, $styles, $index, $package, $roadmap) -join "`n"
$forbiddenProductionPatterns = @(
  "Georgia Bulldogs",
  "Vince Dooley",
  "How 'Bout Them Dawgs",
  "HOW 'BOUT THEM DAWGS",
  "1980 National Champions Coca-Cola tray",
  "Coca-Cola Georgia Bulldogs"
)

foreach ($pattern in $forbiddenProductionPatterns) {
  if ($productionText -like "*$pattern*") {
    $failed += "Production code should not hardcode Georgia/Coca-Cola fixture: $pattern"
  }
}

$frontendText = @($app, $styles, $index) -join "`n"
if ($frontendText -like "*Perform source-routed live comparable search*") {
  $failed += "Frontend should not contain leaked internal research prompt phrase"
}
if ($app -like "*Search Queries Sent*") {
  $failed += "Frontend should not use old Search Queries Sent label"
}
if ($api -like "*Searched relevant holiday decor / collectible sources*") {
  $failed += "Old holiday decor / collectible source wording should be removed"
}

if ($failed.Count -gt 0) {
  throw "Query execution/session isolation static checks failed: $($failed -join '; ')"
}

Write-Host "Query execution/session isolation static checks OK - $($checks.Count + $forbiddenProductionPatterns.Count + 3) checks passed."
