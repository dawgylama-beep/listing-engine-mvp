param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$apiPath = Join-Path $Root "api/generate-listing.js"
$serverPath = Join-Path $Root "server.ps1"
$appPath = Join-Path $Root "public/app.js"
$indexPath = Join-Path $Root "public/index.html"
$packagePath = Join-Path $Root "package.json"
$roadmapPath = Join-Path $Root "PRODUCT_ROADMAP.md"

$api = Get-Content -LiteralPath $apiPath -Raw
$server = Get-Content -LiteralPath $serverPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$index = Get-Content -LiteralPath $indexPath -Raw
$package = Get-Content -LiteralPath $packagePath -Raw
$roadmap = Get-Content -LiteralPath $roadmapPath -Raw

$checks = @(
  @{ Name = "API centralized classifier exists"; Text = $api; Pattern = "function classifyValuationEvidence" },
  @{ Name = "API applies evidence labels"; Text = $api; Pattern = "function applyValuationEvidenceLabels" },
  @{ Name = "API supported state exists"; Text = $api; Pattern = 'state: "supported"' },
  @{ Name = "API preliminary state exists"; Text = $api; Pattern = 'state: "preliminary"' },
  @{ Name = "API insufficient state exists"; Text = $api; Pattern = 'state: "insufficient"' },
  @{ Name = "API preliminary reference warning exists"; Text = $api; Pattern = "This is not a verified fair-market-value estimate" },
  @{ Name = "API active listing language is cautious"; Text = $api; Pattern = "similar active listings" },
  @{ Name = "API formats plain asking prices as currency"; Text = $api; Pattern = "function formatMoneyInputText" },
  @{ Name = "API Ask preserves valuation evidence state"; Text = $api; Pattern = "Preserve the current report's valuationEvidenceState" },
  @{ Name = "Frontend centralized classifier exists"; Text = $app; Pattern = "function classifyValuationEvidenceForDisplay" },
  @{ Name = "Frontend normalizes report for display"; Text = $app; Pattern = "function normalizeReportForEvidenceDisplay" },
  @{ Name = "Frontend shows Preliminary Reference Range"; Text = $app; Pattern = '["preliminaryReferenceRange", "Preliminary Reference Range"]' },
  @{ Name = "Frontend shows Fair Value Not Established"; Text = $app; Pattern = '["fairValueNotEstablished", "Fair Value Not Established"]' },
  @{ Name = "Frontend carries Ask context evidence state"; Text = $app; Pattern = '"valuationEvidenceState"' },
  @{ Name = "Frontend executive summary uses valuation label"; Text = $app; Pattern = "[valuation.label, fairValue]" },
  @{ Name = "Server centralized classifier exists"; Text = $server; Pattern = "function Get-ValuationEvidenceClassification" },
  @{ Name = "Server applies evidence labels"; Text = $server; Pattern = "function Set-ValuationEvidenceLabels" },
  @{ Name = "Server formats plain asking prices as currency"; Text = $server; Pattern = "function Format-MoneyInputText" },
  @{ Name = "Server Ask preserves valuation evidence state"; Text = $server; Pattern = "Preserve the current report's valuationEvidenceState" },
  @{ Name = "Server scenario avoids confident weak value"; Text = $server; Pattern = "not verified fair market value or confirmed sold-comps support" },
  @{ Name = "Visible app version is 1.11.12"; Text = $index; Pattern = "Version 1.11.12" },
  @{ Name = "Package version is 1.11.12"; Text = $package; Pattern = '"version": "1.11.12"' },
  @{ Name = "Roadmap documents 1.9.1"; Text = $roadmap; Pattern = "Version 1.9.1 (Completed)" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

$forbiddenChecks = @(
  @{ Name = "Old awkward live searched wording removed from API"; Text = $api; Pattern = "found in live searched listings" },
  @{ Name = "Old awkward live searched wording removed from server"; Text = $server; Pattern = "found in live searched listings" },
  @{ Name = "Old awkward live searched wording removed from frontend"; Text = $app; Pattern = "found in live searched listings" }
)

foreach ($check in $forbiddenChecks) {
  if ($check.Text -like "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

if ($failed.Count -gt 0) {
  throw "Valuation evidence static checks failed: $($failed -join '; ')"
}

Write-Host "Valuation evidence static checks OK - $($checks.Count + $forbiddenChecks.Count) checks passed."
