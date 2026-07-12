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

$checks = @(
  @{ Name = "Visible app version is 1.9.0"; Text = $index; Pattern = "Version 1.9.0" },
  @{ Name = "Package version is 1.9.0"; Text = $package; Pattern = '"version": "1.9.0"' },
  @{ Name = "Local server version is 1.9.0"; Text = $server; Pattern = '$AppVersion = "1.9.0"' },
  @{ Name = "Feedback button exists"; Text = $index; Pattern = 'id="feedback-button"' },
  @{ Name = "Feedback panel exists"; Text = $index; Pattern = 'id="feedback-panel"' },
  @{ Name = "Photo controls explain camera and upload"; Text = $index; Pattern = "Choose from your photo library or files." },
  @{ Name = "Photo removal function exists"; Text = $app; Pattern = "function removePhotoAt" },
  @{ Name = "Executive summary renders first"; Text = $app; Pattern = "results.appendChild(renderExecutiveSummary" },
  @{ Name = "Why report group exists"; Text = $app; Pattern = 'title: "Why"' },
  @{ Name = "Research Details group exists"; Text = $app; Pattern = 'title: "Research Details"' },
  @{ Name = "Appraiser summary exists"; Text = $app; Pattern = "function renderAppraiserSummary" },
  @{ Name = "Confidence explainer exists"; Text = $app; Pattern = "function renderConfidenceExplainer" },
  @{ Name = "Why expansion exists"; Text = $app; Pattern = 'whySummary.textContent = "Why?"' },
  @{ Name = "Loading progress exists"; Text = $app; Pattern = "function startLoadingProgress" },
  @{ Name = "Loading stages include identifying subject"; Text = $app; Pattern = "Identifying subject" },
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

if ($failed.Count -gt 0) {
  throw "Beta polish static checks failed: $($failed -join '; ')"
}

Write-Host "Beta polish static checks OK - $($checks.Count) checks passed."
