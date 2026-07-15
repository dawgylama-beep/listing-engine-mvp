param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.10.10"; Text = $index; Pattern = "Version 1.10.10" },
  @{ Name = "Package version is 1.10.10"; Text = $package; Pattern = '"version": "1.10.10"' },
  @{ Name = "Server version is 1.10.10"; Text = $server; Pattern = '$AppVersion = "1.10.10"' },
  @{ Name = "Roadmap documents 1.10.10"; Text = $roadmap; Pattern = "Version 1.10.10 (Completed)" },
  @{ Name = "API reads SERPER_API_KEY server-side"; Text = $api; Pattern = "process.env.SERPER_API_KEY" },
  @{ Name = "API uses Serper endpoint"; Text = $api; Pattern = "https://google.serper.dev/search" },
  @{ Name = "API uses Serper auth header server-side"; Text = $api; Pattern = '"X-API-KEY": apiKey' },
  @{ Name = "API sets Serper US locale defaults"; Text = $api; Pattern = 'gl: "us"' },
  @{ Name = "API sets Serper English locale defaults"; Text = $api; Pattern = 'hl: "en"' },
  @{ Name = "API requests ten Serper results"; Text = $api; Pattern = "num: 10" },
  @{ Name = "Serper is selected before OpenAI fallback"; Text = $api; Pattern = "executeSerperComparableSearch" },
  @{ Name = "OpenAI web_search fallback remains available"; Text = $api; Pattern = "executeOpenAIWebComparableSearch" },
  @{ Name = "Serper query plan is bounded"; Text = $api; Pattern = "validRecords.slice(0, 12)" },
  @{ Name = "Serper organic results parsed"; Text = $api; Pattern = "data.organic" },
  @{ Name = "Serper shopping results parsed"; Text = $api; Pattern = "data.shopping" },
  @{ Name = "Serper knowledge graph reference parsed"; Text = $api; Pattern = "knowledgeGraph" },
  @{ Name = "Related searches are counted but not evidence"; Text = $api; Pattern = "relatedSearchCount" },
  @{ Name = "Comparable URL canonicalization exists"; Text = $api; Pattern = "function canonicalizeComparableUrl" },
  @{ Name = "Serper dedupe preserves query provenance"; Text = $api; Pattern = "queriesFound" },
  @{ Name = "Identity match classification separates exact and rejected"; Text = $api; Pattern = "function classifySerperIdentityMatch" },
  @{ Name = "Price evidence classification separates shopping and active"; Text = $api; Pattern = "function classifySerperPriceEvidence" },
  @{ Name = "Diagnostics expose Serper call counts"; Text = $api; Pattern = "serperCallsAttempted" },
  @{ Name = "Diagnostics expose organic count"; Text = $api; Pattern = "organicResultCount" },
  @{ Name = "Diagnostics expose shopping count"; Text = $api; Pattern = "shoppingResultCount" },
  @{ Name = "Frontend renders Serper configured safely"; Text = $app; Pattern = "Serper Configured" },
  @{ Name = "Frontend renders source query"; Text = $app; Pattern = '["Query", item.query]' },
  @{ Name = "Frontend renders active sold reference status"; Text = $app; Pattern = "Active/Sold/Reference Status" },
  @{ Name = "Ask instructions use stored Serper diagnostics"; Text = $api; Pattern = "stored Serper diagnostics" },
  @{ Name = "Local server mirrors Serper configured state"; Text = $server; Pattern = '$SerperConfigured = [bool](Clean-Text $env:SERPER_API_KEY)' }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($app -match "SERPER_API_KEY|google\.serper\.dev|X-API-KEY") {
  $failed += "Frontend must not contain Serper key, endpoint, or auth header"
}

if ($api -match "HOW '?BOUT|Georgia Bulldogs|Coca-Cola collector tray") {
  $failed += "Production API must not hardcode Georgia/Coca-Cola fixture behavior"
}

if ($failed.Count -gt 0) {
  Write-Error ("Serper Google acquisition static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Serper Google acquisition static checks OK."
