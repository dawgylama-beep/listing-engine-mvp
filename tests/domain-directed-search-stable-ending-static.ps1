param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content -LiteralPath (Join-Path $Root "api/generate-listing.js") -Raw
$decisions = Get-Content -LiteralPath (Join-Path $Root "lib/evidence/decisions.js") -Raw
$app = Get-Content -LiteralPath (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content -LiteralPath (Join-Path $Root "public/styles.css") -Raw
$index = Get-Content -LiteralPath (Join-Path $Root "public/index.html") -Raw
$package = Get-Content -LiteralPath (Join-Path $Root "package.json") -Raw
$server = Get-Content -LiteralPath (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content -LiteralPath (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.23"; Text = $index; Pattern = "Version 1.12.23" },
  @{ Name = "Package version is 1.12.23"; Text = $package; Pattern = '"version": "1.12.23"' },
  @{ Name = "Server version is 1.12.23"; Text = $server; Pattern = '$AppVersion = "1.12.23"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "API uses current web_search tool"; Text = $api; Pattern = 'type: "web_search"' },
  @{ Name = "API forces live search tool execution"; Text = $api; Pattern = 'tool_choice: "required"' },
  @{ Name = "API requests complete provider sources"; Text = $api; Pattern = 'web_search_call.action.sources' },
  @{ Name = "API sets medium search context"; Text = $api; Pattern = 'tool.search_context_size = "medium"' },
  @{ Name = "API uses allowed domain filters"; Text = $api; Pattern = 'allowed_domains' },
  @{ Name = "API has domain-directed search plan"; Text = $api; Pattern = "function buildDomainDirectedSearchPlan" },
  @{ Name = "API creates open-web exact pass"; Text = $api; Pattern = 'searchPass: "open_web_exact"' },
  @{ Name = "API creates marketplace-domain pass"; Text = $api; Pattern = 'searchPass: "marketplace_domain"' },
  @{ Name = "API creates broader fallback pass"; Text = $api; Pattern = 'searchPass: "broader_fallback"' },
  @{ Name = "API selects marketplace allowed domains"; Text = $api; Pattern = "function selectMarketplaceAllowedDomains" },
  @{ Name = "API records allowed domains requested"; Text = $api; Pattern = "allowedDomainsRequested" },
  @{ Name = "API records search provider used"; Text = $api; Pattern = "searchProviderUsed" },
  @{ Name = "API records provider source count"; Text = $api; Pattern = "providerSourceCount" },
  @{ Name = "API records domains actually returned"; Text = $api; Pattern = "domainsActuallyReturned" },
  @{ Name = "API records source URLs returned"; Text = $api; Pattern = "sourceURLsReturned" },
  @{ Name = "API records parsed candidate count"; Text = $api; Pattern = "parsedCandidateCount" },
  @{ Name = "API records normalized candidate count"; Text = $api; Pattern = "normalizedCandidateCount" },
  @{ Name = "API records retained visible result count"; Text = $api; Pattern = "retainedVisibleResultCount" },
  @{ Name = "API records rejected candidate count"; Text = $api; Pattern = "rejectedCandidateCount" },
  @{ Name = "API parses provider source records"; Text = $api; Pattern = "function collectWebSearchSourceRecords" },
  @{ Name = "API retains source-producing query"; Text = $api; Pattern = "query: cleanText(queryRecord.query)" },
  @{ Name = "API removes unsupported limited edition wording"; Text = $api; Pattern = "removeUnsupportedQueryDescriptors" },
  @{ Name = "API preserves zero-evidence guard"; Text = $api; Pattern = "function applyZeroEvidenceGuard" },
  @{ Name = "Canonical decision restricts wait guidance to supported contradictions"; Text = $decisions; Pattern = "entered_price_above_canonical_retail_limit" },
  @{ Name = "Frontend renders one report root"; Text = $app; Pattern = 'reportRoot.className = "report-root"' },
  @{ Name = "Frontend replaces previous report before rendering"; Text = $app; Pattern = "results.replaceChildren(reportRoot);" },
  @{ Name = "Frontend renders end marker function"; Text = $app; Pattern = "function renderEndOfReportMarker" },
  @{ Name = "Frontend marker says End of Report"; Text = $app; Pattern = 'marker.textContent = "End of Report"' },
  @{ Name = "Frontend stops loading progress before final render"; Text = $app; Pattern = "stopLoadingProgress();" },
  @{ Name = "Frontend separates provider sources label"; Text = $app; Pattern = "Provider Sources Returned" },
  @{ Name = "Frontend separates structured candidate label"; Text = $app; Pattern = "Structured Candidates Created" },
  @{ Name = "Frontend separates retained comparable label"; Text = $app; Pattern = "Visible Comparable Records Retained" },
  @{ Name = "Frontend shows search pass"; Text = $app; Pattern = "Search Pass" },
  @{ Name = "Frontend shows allowed domains"; Text = $app; Pattern = "Allowed Domains" },
  @{ Name = "Styles include report root"; Text = $styles; Pattern = ".report-root" },
  @{ Name = "Styles include end marker"; Text = $styles; Pattern = ".end-of-report-marker" },
  @{ Name = "Styles stack diagnostics on mobile"; Text = $styles; Pattern = "grid-template-columns: 1fr;" },
  @{ Name = "Roadmap notes marketplace-domain honesty"; Text = $roadmap; Pattern = "Marketplace-domain requests preserve allowed domains separately from domains actually returned" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

if ($api -like "*web_search_preview*") {
  $failed += "Production API should not use web_search_preview"
}

if ($app -like "*Raw Results Returned*" -or $app -like "*Results Retained*") {
  $failed += "Frontend should not use old ambiguous raw/results retained labels"
}

$productionText = @($api, $server, $app, $styles, $index, $package, $roadmap) -join "`n"
$forbiddenProductionPatterns = @(
  "Georgia Bulldogs",
  "Vince Dooley",
  "HOW 'BOUT THEM DAWGS",
  "1980 National Champions Coca-Cola tray"
)

foreach ($pattern in $forbiddenProductionPatterns) {
  if ($productionText -like "*$pattern*") {
    $failed += "Production code should not hardcode Georgia/Coca-Cola fixture: $pattern"
  }
}

if ($failed.Count -gt 0) {
  throw "Domain-directed search / stable ending static checks failed: $($failed -join '; ')"
}

Write-Host "Domain-directed search / stable ending static checks OK - $($checks.Count + $forbiddenProductionPatterns.Count + 2) checks passed."
