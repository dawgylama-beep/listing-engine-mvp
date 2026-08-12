param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$apiPath = Join-Path $Root "api/generate-listing.js"
$serverPath = Join-Path $Root "server.ps1"
$appPath = Join-Path $Root "public/app.js"
$stylesPath = Join-Path $Root "public/styles.css"
$indexPath = Join-Path $Root "public/index.html"
$packagePath = Join-Path $Root "package.json"
$roadmapPath = Join-Path $Root "PRODUCT_ROADMAP.md"

$api = Get-Content -LiteralPath $apiPath -Raw
$server = Get-Content -LiteralPath $serverPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$styles = Get-Content -LiteralPath $stylesPath -Raw
$index = Get-Content -LiteralPath $indexPath -Raw
$package = Get-Content -LiteralPath $packagePath -Raw
$roadmap = Get-Content -LiteralPath $roadmapPath -Raw

$georgiaTrayMockedExtractedEvidence = @{
  front = @("Coca-Cola", "GEORGIA", "1980 NATIONAL CHAMPIONS", "Vince Dooley", "collector tray")
  back = @("HOW 'BOUT THEM DAWGS?", "official Coca-Cola collector's tray", "championship history")
  askingPrice = '$10'
  expectedExactQueries = @(
    '"1980 NATIONAL CHAMPIONS" Georgia Coca-Cola tray',
    '"HOW ''BOUT THEM DAWGS" Coca-Cola tray',
    'Vince Dooley Georgia Bulldogs Coca-Cola tray',
    "official Coca-Cola Georgia Bulldogs collector's tray",
    "1981 Georgia Bulldogs 1980 National Champions Coca-Cola tray"
  )
}

$checks = @(
  @{ Name = "Visible app version is 1.12.32"; Text = $index; Pattern = "Version 1.12.32" },
  @{ Name = "Package version is 1.12.32"; Text = $package; Pattern = '"version": "1.12.32"' },
  @{ Name = "Server version is 1.12.32"; Text = $server; Pattern = '$AppVersion = "1.12.32"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "API builds search diagnostics"; Text = $api; Pattern = "function buildSearchDiagnostics" },
  @{ Name = "API records generated queries"; Text = $api; Pattern = "queriesGenerated" },
  @{ Name = "API records queries actually sent"; Text = $api; Pattern = "queriesActuallySent" },
  @{ Name = "API records provider call counts"; Text = $api; Pattern = "providerCallsAttempted" },
  @{ Name = "API records raw result count"; Text = $api; Pattern = "rawResultCount" },
  @{ Name = "API records parsed result count"; Text = $api; Pattern = "parsedResultCount" },
  @{ Name = "API records normalized result count"; Text = $api; Pattern = "normalizedResultCount" },
  @{ Name = "API records retained visible result count"; Text = $api; Pattern = "retainedVisibleResultCount" },
  @{ Name = "API records dropped result reasons"; Text = $api; Pattern = "droppedResultReasons" },
  @{ Name = "API records acquisition failure stage"; Text = $api; Pattern = "acquisitionFailureStage" },
  @{ Name = "API builds query-by-query diagnostics"; Text = $api; Pattern = "function buildQueryResultsSummary" },
  @{ Name = "API extracts exposed web search action queries"; Text = $api; Pattern = "function collectWebSearchActionQueries" },
  @{ Name = "API preserves compact raw result summaries"; Text = $api; Pattern = "function collectSafeRawResultSummaries" },
  @{ Name = "API classifies provider zero results"; Text = $api; Pattern = "provider_zero_results" },
  @{ Name = "API classifies normalization failure"; Text = $api; Pattern = "normalization_failure" },
  @{ Name = "API classifies filtering failure"; Text = $api; Pattern = "filtering_failure" },
  @{ Name = "API central zero evidence guard exists"; Text = $api; Pattern = "function applyZeroEvidenceGuard" },
  @{ Name = "API zero guard triggers without supporting retained evidence"; Text = $api; Pattern = "if (supportingResultCount === 0)" },
  @{ Name = "API sanitizes unsupported model market text"; Text = $api; Pattern = "function sanitizeUnsupportedMarketText" },
  @{ Name = "API prevents hidden fair value fallback without retained evidence"; Text = $api; Pattern = "retainedVisibleResultCount ? extractConsumerFairValueNumber(report) : null" },
  @{ Name = "API clears suggested listing price when zero evidence"; Text = $api; Pattern = "suggestedListingPrice: null" },
  @{ Name = "API keeps low-dollar explanation evidence-limited"; Text = $api; Pattern = "financial exposure is limited and the item appears identifiable" },
  @{ Name = "Frontend renders technical diagnostics"; Text = $app; Pattern = "function renderSearchDiagnostics" },
  @{ Name = "Frontend copies technical diagnostics"; Text = $app; Pattern = "function formatSearchDiagnosticsText" },
  @{ Name = "Frontend exposes Technical Search Details"; Text = $app; Pattern = "Technical Search Details" },
  @{ Name = "Frontend Ask context carries diagnostics"; Text = $app; Pattern = '"searchDiagnostics"' },
  @{ Name = "Frontend preserves the canonical handler report"; Text = $app; Pattern = "const report = rawReport;" },
  @{ Name = "Frontend has one translation-only valuation display mapping"; Text = $app; Pattern = "const recognizedStates = new Set" },
  @{ Name = "Frontend malformed valuation metadata uses neutral unavailable wording"; Text = $app; Pattern = "Canonical valuation information is unavailable." },
  @{ Name = "Retail provider ceiling remains 28"; Text = $api; Pattern = "maxProviderCalls: 28" },
  @{ Name = "Non-retail provider ceiling remains 12"; Text = $api; Pattern = "retailSerperBudgetAllocation.maxProviderCalls : 12" },
  @{ Name = "Direct-page ceiling remains 2"; Text = $api; Pattern = "const directPageEnrichmentMaxAttempts = 2" },
  @{ Name = "Styles include diagnostic summary"; Text = $styles; Pattern = ".diagnostic-summary" },
  @{ Name = "Styles include query diagnostic rows"; Text = $styles; Pattern = ".query-diagnostic-row" },
  @{ Name = "Georgia fixture includes exact query with championship wording"; Text = ($georgiaTrayMockedExtractedEvidence.expectedExactQueries -join "`n"); Pattern = '"1980 NATIONAL CHAMPIONS" Georgia Coca-Cola tray' },
  @{ Name = "Georgia fixture preserves apostrophe query"; Text = ($georgiaTrayMockedExtractedEvidence.expectedExactQueries -join "`n"); Pattern = '"HOW ''BOUT THEM DAWGS" Coca-Cola tray' },
  @{ Name = "Georgia fixture keeps asking price visible"; Text = $georgiaTrayMockedExtractedEvidence.askingPrice; Pattern = '$10' }
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
  "1980 National Champions Coca-Cola tray"
)

foreach ($pattern in $forbiddenProductionPatterns) {
  if ($productionText -like "*$pattern*") {
    $failed += "Production code should not hardcode acceptance fixture: $pattern"
  }
}

$forbiddenFrontendAuthorityPatterns = @(
  "function applyFrontendZeroEvidenceGuard",
  "function sanitizeUnsupportedFrontendMarketText",
  "function normalizeReportForEvidenceDisplay",
  "function classifyValuationEvidenceForDisplay",
  "countReferenceSupportingResearchResults"
)

foreach ($pattern in $forbiddenFrontendAuthorityPatterns) {
  if ($app -like "*$pattern*") {
    $failed += "Frontend valuation authority should be absent: $pattern"
  }
}

if ($failed.Count -gt 0) {
  throw "Search diagnostics / zero-evidence static checks failed: $($failed -join '; ')"
}

Write-Host "Search diagnostics / zero-evidence static checks OK - $($checks.Count + $forbiddenProductionPatterns.Count + $forbiddenFrontendAuthorityPatterns.Count) checks passed."
