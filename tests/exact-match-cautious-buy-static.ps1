$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$api = Get-Content -LiteralPath (Join-Path $Root "api/generate-listing.js") -Raw
$decisions = Get-Content -LiteralPath (Join-Path $Root "lib/evidence/decisions.js") -Raw
$app = Get-Content -LiteralPath (Join-Path $Root "public/app.js") -Raw
$index = Get-Content -LiteralPath (Join-Path $Root "public/index.html") -Raw
$package = Get-Content -LiteralPath (Join-Path $Root "package.json") -Raw
$server = Get-Content -LiteralPath (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content -LiteralPath (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.25"; Text = $index; Pattern = "Version 1.12.25" },
  @{ Name = "Package version is 1.12.25"; Text = $package; Pattern = '"version": "1.12.25"' },
  @{ Name = "Server version is 1.12.25"; Text = $server; Pattern = '$AppVersion = "1.12.25"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
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
  @{ Name = "Canonical recommendation authority exists"; Text = $decisions; Pattern = "export function deriveCanonicalDecisionResult" },
  @{ Name = "Canonical identity-confidence authority exists"; Text = $decisions; Pattern = "export function deriveCanonicalIdentityConfidence" },
  @{ Name = "Canonical pricing-confidence authority exists"; Text = $decisions; Pattern = "export function deriveCanonicalPricingConfidence" },
  @{ Name = "Canonical badge authority exists"; Text = $decisions; Pattern = "export function deriveCanonicalBadgeResult" },
  @{ Name = "One active asking remains limited"; Text = $decisions; Pattern = "one_observed_price_is_not_market_value" },
  @{ Name = "Insufficient evidence uses neutral badge"; Text = $decisions; Pattern = "market_evidence_insufficient" },
  @{ Name = "Frontend shows consumer downside risk"; Text = $app; Pattern = "Consumer Downside Risk" },
  @{ Name = "Frontend shows cautious buy explanation"; Text = $app; Pattern = "Cautious Buy Explanation" },
  @{ Name = "Ask context carries downside risk"; Text = $app; Pattern = '"consumerDownsideRisk"' }
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
