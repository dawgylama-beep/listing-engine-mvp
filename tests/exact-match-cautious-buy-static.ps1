$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$api = Get-Content -LiteralPath (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content -LiteralPath (Join-Path $Root "public/app.js") -Raw
$index = Get-Content -LiteralPath (Join-Path $Root "public/index.html") -Raw
$package = Get-Content -LiteralPath (Join-Path $Root "package.json") -Raw
$server = Get-Content -LiteralPath (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content -LiteralPath (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.11.13"; Text = $index; Pattern = "Version 1.11.13" },
  @{ Name = "Package version is 1.11.13"; Text = $package; Pattern = '"version": "1.11.13"' },
  @{ Name = "Server version is 1.11.13"; Text = $server; Pattern = '$AppVersion = "1.11.13"' },
  @{ Name = "Roadmap documents 1.11.13"; Text = $roadmap; Pattern = "Version 1.11.13 (Completed)" },
  @{ Name = "API has high priority exact query builder"; Text = $api; Pattern = "function buildHighPriorityExactQueries" },
  @{ Name = "API scores query specificity"; Text = $api; Pattern = "function scoreSearchQuerySpecificity" },
  @{ Name = "API preserves visible search evidence"; Text = $api; Pattern = "function collectVisibleSearchEvidence" },
  @{ Name = "API extracts distinctive search phrases"; Text = $api; Pattern = "function extractDistinctiveSearchPhrases" },
  @{ Name = "API routes branded memorabilia"; Text = $api; Pattern = "function isBrandedMemorabiliaIdentity" },
  @{ Name = "API routes promotional collectibles"; Text = $api; Pattern = "function isPromotionalCollectibleIdentity" },
  @{ Name = "API classifies identity match strength"; Text = $api; Pattern = "function classifyIdentityMatchStrength" },
  @{ Name = "API distinguishes identity from price evidence"; Text = $api; Pattern = "Classify identity match separately from price evidence type" },
  @{ Name = "API keeps active asking evidence honest"; Text = $api; Pattern = "active asking-price evidence" },
  @{ Name = "API diagnoses acquisition failure"; Text = $api; Pattern = "function diagnoseSearchAcquisition" },
  @{ Name = "API summarizes consumer visible price evidence"; Text = $api; Pattern = "function summarizeConsumerVisiblePriceEvidence" },
  @{ Name = "API has downside risk function"; Text = $api; Pattern = "function calculateConsumerDownsideRisk" },
  @{ Name = "API has cautious buy function"; Text = $api; Pattern = "function isCautiousConsumerBuySupported" },
  @{ Name = "API has cautious buy explanation"; Text = $api; Pattern = "function buildCautiousBuyExplanation" },
  @{ Name = "API centralizes consumer purchase decision"; Text = $api; Pattern = "function classifyConsumerPurchaseDecision" },
  @{ Name = "API uses low-dollar threshold"; Text = $api; Pattern = "lowDollarCautiousBuyMax" },
  @{ Name = "API supports low-cost cautious value label"; Text = $api; Pattern = "Low-Cost Cautious Buy" },
  @{ Name = "API supports limited-evidence value label"; Text = $api; Pattern = "Promising Price - Limited Evidence" },
  @{ Name = "Frontend shows consumer downside risk"; Text = $app; Pattern = "Consumer Downside Risk" },
  @{ Name = "Frontend shows cautious buy explanation"; Text = $app; Pattern = "Cautious Buy Explanation" },
  @{ Name = "Ask context carries downside risk"; Text = $app; Pattern = '"consumerDownsideRisk"' },
  @{ Name = "Server prompt prioritizes exact visible phrase combinations"; Text = $server; Pattern = "exact visible phrase combinations" },
  @{ Name = "Server includes cautious-buy threshold"; Text = $server; Pattern = "cautiousBuyMaxRatio" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

if ($failed.Count) {
  throw "Exact-match cautious-buy static checks failed: $($failed -join '; ')"
}

Write-Host "Exact-match cautious-buy static checks OK - $($checks.Count) checks passed."
