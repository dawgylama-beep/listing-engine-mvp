param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.11.1"; Text = $index; Pattern = "Version 1.11.1" },
  @{ Name = "Package version is 1.11.1"; Text = $package; Pattern = '"version": "1.11.1"' },
  @{ Name = "Server version is 1.11.1"; Text = $server; Pattern = '$AppVersion = "1.11.1"' },
  @{ Name = "Roadmap documents Version 1.11.1"; Text = $roadmap; Pattern = "Version 1.11.1 (Completed)" },
  @{ Name = "Buyer purpose heading is plain"; Text = $index; Pattern = "<legend>Buying purpose</legend>" },
  @{ Name = "Personal-use submit label is consistent"; Text = $index; Pattern = "Analyze Buying for Myself" },
  @{ Name = "Resale submit label is consistent"; Text = $app; Pattern = 'defaultLabel: "Analyze Buying to Resell"' },
  @{ Name = "Product details heading is customer-facing"; Text = $index; Pattern = '<span class="details-title">Product Details</span>' },
  @{ Name = "Condition notes heading is customer-facing"; Text = $index; Pattern = '<span class="details-title">Condition Notes</span>' },
  @{ Name = "Optional notes label is plain"; Text = $index; Pattern = '<label for="notes">Optional details</label>' },
  @{ Name = "Output actions start hidden"; Text = $index; Pattern = 'id="output-actions" class="output-actions" hidden' },
  @{ Name = "Report actions helper exists"; Text = $app; Pattern = "function setReportActionsVisible" },
  @{ Name = "Report actions show on completed report"; Text = $app; Pattern = "setReportActionsVisible(true);" },
  @{ Name = "Report actions hide for non-report states"; Text = $app; Pattern = "setReportActionsVisible(false);" },
  @{ Name = "Empty state has concise title"; Text = $app; Pattern = 'title.textContent = "Ready when your photos are."' },
  @{ Name = "Empty state has step list"; Text = $app; Pattern = 'steps.className = "first-run-steps"' },
  @{ Name = "Why heading is customer-facing"; Text = $app; Pattern = 'title: "Why This Recommendation"' },
  @{ Name = "Final report summary is plain"; Text = $app; Pattern = 'title.textContent = "Final Summary"' },
  @{ Name = "Technical details remain collapsed"; Text = $app; Pattern = "function renderTechnicalSearchDetails" },
  @{ Name = "Guide is visually after analyze"; Text = $styles; Pattern = ".guide-panel" },
  @{ Name = "Photos are first in visual flow"; Text = $styles; Pattern = ".photo-stage" },
  @{ Name = "Optional note field is shorter"; Text = $styles; Pattern = "min-height: 128px;" },
  @{ Name = "Mobile note field is shorter"; Text = $styles; Pattern = "min-height: 112px;" },
  @{ Name = "Empty state is shorter on desktop"; Text = $styles; Pattern = "min-height: 280px;" },
  @{ Name = "Empty state is shorter on mobile"; Text = $styles; Pattern = "min-height: 220px;" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$orderChecks = @(
  @{ Name = "Guide is ordered after action row"; Pattern = "\.guide-panel\s*\{[\s\S]*?order:\s*7;" },
  @{ Name = "Photos are ordered first"; Pattern = "\.photo-stage\s*\{[\s\S]*?order:\s*1;" },
  @{ Name = "Buying purpose is ordered second"; Pattern = "\.workflow-field\s*\{[\s\S]*?order:\s*2;" },
  @{ Name = "Buying details are ordered third"; Pattern = "\.buyer-intake\s*\{[\s\S]*?order:\s*3;" },
  @{ Name = "Optional platform is ordered after buying details"; Pattern = "\.optional-field\s*\{[\s\S]*?order:\s*4;" },
  @{ Name = "Optional notes are ordered before analyze"; Pattern = "\.optional-notes-field\s*\{[\s\S]*?order:\s*5;" },
  @{ Name = "Analyze action is ordered before guide"; Pattern = "\.action-row\s*\{[\s\S]*?order:\s*6;" }
)

foreach ($check in $orderChecks) {
  if ($styles -notmatch $check.Pattern) {
    $failed += $check.Name
  }
}

$obsoleteVisibleLabels = @(
  "Known Item Details",
  "Condition Concerns",
  "Guided Buyer Intake",
  "Analyze Personal Buy",
  "Analyze Resale Buy",
  "Appraiser Summary",
  "Final read"
)

foreach ($label in $obsoleteVisibleLabels) {
  if ($index.Contains($label) -or $app.Contains($label)) {
    $failed += "Obsolete customer-facing label remains: $label"
  }
}

$technicalMatch = [regex]::Match($app, "function renderTechnicalSearchDetails\(value\) \{(?<body>[\s\S]*?)\n\}")
if (-not $technicalMatch.Success) {
  $failed += "Technical details function should be inspectable"
} elseif ($technicalMatch.Groups["body"].Value -match "\.open\s*=\s*true") {
  $failed += "Technical Search Details must stay collapsed by default"
}

if ($app -match "SERPER_API_KEY|google\.serper\.dev|X-API-KEY") {
  $failed += "Frontend must not expose provider keys or authorization headers"
}

if ($failed.Count -gt 0) {
  Write-Error ("Buyer experience/mobile static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Buyer experience/mobile static checks OK - $($checks.Count + $orderChecks.Count) checks passed."
