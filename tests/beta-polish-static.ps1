param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$indexPath = Join-Path $Root "public/index.html"
$appPath = Join-Path $Root "public/app.js"
$stylesPath = Join-Path $Root "public/styles.css"
$packagePath = Join-Path $Root "package.json"
$serverPath = Join-Path $Root "server.ps1"

$index = Get-Content -LiteralPath $indexPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$styles = Get-Content -LiteralPath $stylesPath -Raw
$package = Get-Content -LiteralPath $packagePath -Raw
$server = Get-Content -LiteralPath $serverPath -Raw

$loadingContractStart = $app.IndexOf("function getLoadingStages(workflow)")
$loadingContractEnd = $app.IndexOf("function setStatus(message, type)", $loadingContractStart)
if ($loadingContractStart -lt 0 -or $loadingContractEnd -le $loadingContractStart) {
  throw "Beta polish static checks failed: customer loading contract could not be isolated"
}

$loadingContract = $app.Substring($loadingContractStart, $loadingContractEnd - $loadingContractStart)
$approvedLoadingSequencePattern = '(?s)return\s*\[\s*"Reviewing the photographs"\s*,\s*"Reading visible details and markings"\s*,\s*"Comparing identity possibilities"\s*,\s*"Checking market evidence"\s*,\s*workflow\s*===\s*"listing"\s*\?\s*"Preparing your listing guidance"\s*:\s*"Preparing your guidance"\s*\]\s*;'

$checks = @(
  @{ Name = "Visible app version is 1.12.20"; Text = $index; Pattern = "Version 1.12.20" },
  @{ Name = "Package version is 1.12.20"; Text = $package; Pattern = '"version": "1.12.20"' },
  @{ Name = "Local server version is 1.12.20"; Text = $server; Pattern = '$AppVersion = "1.12.20"' },
  @{ Name = "Feedback button exists"; Text = $index; Pattern = 'id="feedback-button"' },
  @{ Name = "Feedback panel exists"; Text = $index; Pattern = 'id="feedback-panel"' },
  @{ Name = "Photo controls explain camera and library"; Text = $index; Pattern = "Choose from Library" },
  @{ Name = "Photo removal function exists"; Text = $app; Pattern = "function removePhotoAt" },
  @{ Name = "Executive summary renders first inside report root"; Text = $app; Pattern = "reportRoot.appendChild(renderExecutiveSummary" },
  @{ Name = "Why report group exists"; Text = $app; Pattern = 'title: "Why This Recommendation"' },
  @{ Name = "Research Details group exists"; Text = $app; Pattern = "Research Details" },
  @{ Name = "Appraiser summary exists"; Text = $app; Pattern = "function renderAppraiserSummary" },
  @{ Name = "Confidence explainer exists"; Text = $app; Pattern = "function renderConfidenceExplainer" },
  @{ Name = "Why expansion exists"; Text = $app; Pattern = 'whySummary.textContent = "Why this recommendation?"' },
  @{ Name = "Loading progress exists"; Text = $app; Pattern = "function startLoadingProgress" },
  @{ Name = "Loading begins with approved photograph review language"; Text = $loadingContract; Pattern = "Reviewing the photographs" },
  @{ Name = "Loading explains that the active stage is not a percentage"; Text = $loadingContract; Pattern = "not a percentage complete" },
  @{ Name = "Friendly no-results error exists"; Text = $app; Pattern = "We could not find an exact match" },
  @{ Name = "Copy confirmation says copied"; Text = $app; Pattern = 'button.textContent = "Copied!"' },
  @{ Name = "Executive summary styles exist"; Text = $styles; Pattern = ".executive-summary-card" },
  @{ Name = "Report group styles exist"; Text = $styles; Pattern = ".report-group" },
  @{ Name = "Loading styles exist"; Text = $styles; Pattern = ".loading-steps" },
  @{ Name = "Photo remove styles exist"; Text = $styles; Pattern = ".photo-remove-button" },
  @{ Name = "Feedback styles exist"; Text = $styles; Pattern = ".feedback-panel" },
  @{ Name = "Mobile 520 media query remains"; Text = $styles; Pattern = "@media (max-width: 520px)" },
  @{ Name = "Mobile summary stacks"; Text = $styles; Pattern = ".executive-metrics" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

if ($loadingContract -notmatch $approvedLoadingSequencePattern) {
  $failed += "Loading stages use the exact approved deterministic sequence"
}

if ($loadingContract -like "*Identifying subject*") {
  $failed += "Loading contract excludes the retired identifying-subject phrase"
}

if ($loadingContract -match '%|aria-valuenow|progressbar') {
  $failed += "Loading contract excludes invented percentage progress"
}

if ($failed.Count -gt 0) {
  throw "Beta polish static checks failed: $($failed -join '; ')"
}

Write-Host "Beta polish static checks OK - $($checks.Count) checks passed."
