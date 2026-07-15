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

$checks = @(
  @{ Name = "API schema includes strong comparables"; Text = $api; Pattern = '"strongComparables"' },
  @{ Name = "API schema includes partial comparables"; Text = $api; Pattern = '"partialComparables"' },
  @{ Name = "API schema includes reference results"; Text = $api; Pattern = '"referenceResults"' },
  @{ Name = "API schema includes weak matches"; Text = $api; Pattern = '"weakMatches"' },
  @{ Name = "API schema includes rejected matches"; Text = $api; Pattern = '"rejectedMatches"' },
  @{ Name = "API builds research result buckets"; Text = $api; Pattern = "function buildResearchResultBuckets" },
  @{ Name = "API normalizes source result records"; Text = $api; Pattern = "function normalizeResearchResultRecord" },
  @{ Name = "API blocks preliminary range without supporting records"; Text = $api; Pattern = "countReferenceSupportingResearchResults" },
  @{ Name = "API exposes reference range basis"; Text = $api; Pattern = "referenceRangeBasis" },
  @{ Name = "API preserves rejected result reasons"; Text = $api; Pattern = "function extractRejectionReason" },
  @{ Name = "Frontend research panel exists"; Text = $app; Pattern = "function renderResearchEvidencePanel" },
  @{ Name = "Frontend research title shows visible record count"; Text = $app; Pattern = 'Research Details - ${researchResultCount} visible records' },
  @{ Name = "Frontend source cards render"; Text = $app; Pattern = "function renderResearchResultList" },
  @{ Name = "Frontend source links render"; Text = $app; Pattern = "source-result-link" },
  @{ Name = "Frontend copy formats source records"; Text = $app; Pattern = "function formatResearchRecordText" },
  @{ Name = "Frontend Ask context carries result buckets"; Text = $app; Pattern = '"resultsFound"' },
  @{ Name = "Styles include source cards"; Text = $styles; Pattern = ".source-result-card" },
  @{ Name = "Styles wrap source links"; Text = $styles; Pattern = "overflow-wrap: anywhere" },
  @{ Name = "Server has research visibility fields"; Text = $server; Pattern = "function Set-ResearchVisibilityFields" },
  @{ Name = "Server blocks preliminary range without supporting records"; Text = $server; Pattern = "Get-ReferenceSupportingResearchResultCount" },
  @{ Name = "Visible app version is 1.10.5"; Text = $index; Pattern = "Version 1.10.5" },
  @{ Name = "Package version is 1.10.5"; Text = $package; Pattern = '"version": "1.10.5"' },
  @{ Name = "Roadmap documents 1.9.2"; Text = $roadmap; Pattern = "Version 1.9.2 (Completed)" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

if ($failed.Count -gt 0) {
  throw "Research evidence visibility static checks failed: $($failed -join '; ')"
}

Write-Host "Research evidence visibility static checks OK - $($checks.Count) checks passed."
