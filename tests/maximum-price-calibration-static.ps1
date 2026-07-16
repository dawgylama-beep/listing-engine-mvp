param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.11.3"; Text = $index; Pattern = "Version 1.11.3" },
  @{ Name = "Package version is 1.11.3"; Text = $package; Pattern = '"version": "1.11.3"' },
  @{ Name = "Server version is 1.11.3"; Text = $server; Pattern = '$AppVersion = "1.11.3"' },
  @{ Name = "Roadmap documents 1.11.3"; Text = $roadmap; Pattern = "Version 1.11.3 (Completed)" },
  @{ Name = "API builds maximum evidence profile"; Text = $api; Pattern = "function buildMaximumPriceEvidenceProfile" },
  @{ Name = "API builds maximum policy"; Text = $api; Pattern = "function buildMaximumRecommendedPricePolicy" },
  @{ Name = "API passes price evidence to offer builder"; Text = $api; Pattern = "priceEvidence" },
  @{ Name = "API caps weak evidence near target"; Text = $api; Pattern = "The maximum is capped near the target because available pricing evidence is weak." },
  @{ Name = "API can mark maximum not established"; Text = $api; Pattern = "Maximum Recommended Price: Not established" },
  @{ Name = "API blocks weak reference maximum"; Text = $api; Pattern = "Weak, partial, guide, auction, estimated, or reference prices may provide context only." },
  @{ Name = "API guards 2x target"; Text = $api; Pattern = "a price above 2x the target requires qualified exact/strong evidence" },
  @{ Name = "API guards 3x asking"; Text = $api; Pattern = "a price above 3x the current asking price requires verified sold or active exact/strong support" },
  @{ Name = "API includes maximum explanation in non-retail report"; Text = $api; Pattern = 'maximumRecommendedPriceExplanation: retailEvidenceProfile.currentRetailOnly ? "" : offer.maximumRecommendedPriceExplanation' },
  @{ Name = "Frontend has maximum guard section"; Text = $app; Pattern = '["maximumRecommendedPriceExplanation", "Maximum Price Guard"]' },
  @{ Name = "Frontend compact report shows maximum guard"; Text = $app; Pattern = 'appendConsumerCompactSection(details, "Maximum Price Guard", report.maximumRecommendedPriceExplanation)' },
  @{ Name = "Mock test blocks $135 max"; Text = $mock; Pattern = 'cannot produce a $135 maximum' },
  @{ Name = "Mock test blocks $5-$600 weak reference max"; Text = $mock; Pattern = 'Weak/reference prices ranging from $5-$600 cannot establish or inflate the maximum price.' },
  @{ Name = "Mock test covers max not established"; Text = $mock; Pattern = 'Maximum Recommended Price: Not established' },
  @{ Name = "Mock test covers high max with verified evidence"; Text = $mock; Pattern = 'Strong verified sold evidence can still support a maximum materially above asking when justified.' },
  @{ Name = "Mock test preserves delivered-cost behavior"; Text = $mock; Pattern = 'Delivered cost should equal item price plus explicit shipping.' }
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

if ($api -match "georgia-coca-cola-bottle|georgia-coca-cola-tray|HOW 'BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS") {
  $failed += "Production API must not contain fixture-specific hardcoding"
}

if ($failed.Count -gt 0) {
  Write-Error ("Maximum price calibration static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Maximum price calibration static checks OK - $($checks.Count) checks passed."
