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
  @{ Name = "Visible app version is 1.12.1"; Text = $index; Pattern = "Version 1.12.1" },
  @{ Name = "Package version is 1.12.7"; Text = $package; Pattern = '"version": "1.12.7"' },
  @{ Name = "Server version is 1.12.7"; Text = $server; Pattern = '$AppVersion = "1.12.7"' },
  @{ Name = "Roadmap documents Version 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Purpose heading is customer-centered"; Text = $index; Pattern = "What would you like help with?" },
  @{ Name = "Personal-use submit label matches help"; Text = $index; Pattern = "Analyze Purchase" },
  @{ Name = "Resale submit label matches help"; Text = $app; Pattern = 'defaultLabel: "Analyze Resale"' },
  @{ Name = "Product details heading is customer-facing"; Text = $index; Pattern = '<span class="details-title">Product Details</span>' },
  @{ Name = "Condition notes heading is customer-facing"; Text = $index; Pattern = '<span class="details-title">Condition Notes</span>' },
  @{ Name = "Optional notes label is plain"; Text = $index; Pattern = '<label for="notes">Helpful details <span class="optional-label">Optional</span></label>' },
  @{ Name = "Output actions start hidden"; Text = $index; Pattern = 'id="output-actions" class="output-actions" hidden' },
  @{ Name = "Report actions helper exists"; Text = $app; Pattern = "function setReportActionsVisible" },
  @{ Name = "Report actions show on completed report"; Text = $app; Pattern = "setReportActionsVisible(true);" },
  @{ Name = "Report actions hide for non-report states"; Text = $app; Pattern = "setReportActionsVisible(false);" },
  @{ Name = "Empty state has concise copy"; Text = $app; Pattern = 'copy.textContent = "Your guidance will appear here after Katherine' },
  @{ Name = "Empty state has compact helper"; Text = $app; Pattern = 'helper.textContent = "Add clear photos and any details you know."' },
  @{ Name = "Why heading is customer-facing"; Text = $app; Pattern = 'title: "Why This Recommendation"' },
  @{ Name = "Final report summary is plain"; Text = $app; Pattern = 'title.textContent = "Final Summary"' },
  @{ Name = "Technical details remain collapsed"; Text = $app; Pattern = "function renderTechnicalSearchDetails" },
  @{ Name = "Header help menu exists"; Text = $index; Pattern = 'id="help-menu-button" class="help-menu-button"' },
  @{ Name = "Purpose How to do this link exists"; Text = $index; Pattern = 'id="purpose-help-link" class="purpose-help-link"' },
  @{ Name = "Purpose guidance is visible and live-updated"; Text = $index; Pattern = 'id="workflow-helper" class="purpose-guidance field-note" aria-live="polite" aria-atomic="true"' },
  @{ Name = "Photos are first in visual flow"; Text = $styles; Pattern = ".photo-stage" },
  @{ Name = "Optional note field is shorter"; Text = $styles; Pattern = "min-height: 128px;" },
  @{ Name = "Mobile note field is shorter"; Text = $styles; Pattern = "min-height: 112px;" },
  @{ Name = "Empty state is shorter on desktop"; Text = $styles; Pattern = "min-height: 150px;" },
  @{ Name = "Empty state is shorter on mobile"; Text = $styles; Pattern = "min-height: 130px;" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$orderChecks = @(
  @{ Name = "Purpose is ordered first"; Pattern = "\.workflow-field\s*\{[\s\S]*?order:\s*1;" },
  @{ Name = "Photos are ordered second"; Pattern = "\.photo-stage\s*\{[\s\S]*?order:\s*2;" },
  @{ Name = "Buying details are ordered third"; Pattern = "\.buyer-intake\s*\{[\s\S]*?order:\s*3;" },
  @{ Name = "Optional platform is ordered after buying details"; Pattern = "\.optional-field\s*\{[\s\S]*?order:\s*4;" },
  @{ Name = "Optional notes are ordered before analyze"; Pattern = "\.optional-notes-field\s*\{[\s\S]*?order:\s*5;" },
  @{ Name = "Analyze action remains last in intake"; Pattern = "\.action-row\s*\{[\s\S]*?order:\s*6;" }
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

$obsoleteGuideContent = @(
  "Start Here",
  "intake-instructions",
  "Need a walkthrough?",
  "Quick Start",
  "Buyer Workflow",
  "Seller Workflow",
  "guide-panel"
)

foreach ($label in $obsoleteGuideContent) {
  if ($index.Contains($label)) {
    $failed += "Obsolete buried instruction content remains: $label"
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
