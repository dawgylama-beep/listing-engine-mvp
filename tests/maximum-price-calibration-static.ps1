param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$offer = Get-Content (Join-Path $Root "lib/evidence/offer.js") -Raw
$validator = Get-Content (Join-Path $Root "lib/evidence/validate.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$offerTest = Get-Content (Join-Path $Root "tests/canonical-buyer-offer.test.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.30"; Text = $index; Pattern = "Version 1.12.30" },
  @{ Name = "Package version is 1.12.30"; Text = $package; Pattern = '"version": "1.12.30"' },
  @{ Name = "Server version is 1.12.30"; Text = $server; Pattern = '$AppVersion = "1.12.30"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Canonical buyer-offer authority exists"; Text = $offer; Pattern = "export function deriveCanonicalBuyerOfferResult" },
  @{ Name = "Canonical offer uses decision-eligible records"; Text = $offer; Pattern = "finalized.decisionEligible" },
  @{ Name = "Canonical offer requires established range"; Text = $offer; Pattern = 'rangeResult.status !== "established"' },
  @{ Name = "One asking price remains context only"; Text = $offer; Pattern = '"asking_price_context_only"' },
  @{ Name = "Canonical offer can mark evidence insufficient"; Text = $offer; Pattern = '"insufficient_evidence"' },
  @{ Name = "Canonical offer isolates active asking basis"; Text = $offer; Pattern = '"active_asking_range"' },
  @{ Name = "Canonical offer isolates verified sold basis"; Text = $offer; Pattern = '"verified_sold_range"' },
  @{ Name = "API projects canonical maximum explanation"; Text = $api; Pattern = "maximumRecommendedPriceExplanation: maximumPriceNote" },
  @{ Name = "Validator requires ordered offer figures"; Text = $validator; Pattern = "buyerOfferResult openingOffer is greater than targetPrice" },
  @{ Name = "Frontend has maximum guard section"; Text = $app; Pattern = '["maximumRecommendedPriceExplanation", "Maximum Price Guard"]' },
  @{ Name = "Frontend compact report shows maximum guard"; Text = $app; Pattern = 'appendConsumerCompactSection(details, "Maximum Price Guard", report.maximumRecommendedPriceExplanation)' },
  @{ Name = "Mock test blocks single-ask numerical guidance"; Text = $mock; Pattern = 'A single active asking listing cannot create numerical buyer guidance.' },
  @{ Name = "Canonical test blocks no-evidence numerical guidance"; Text = $offerTest; Pattern = 'no priced evidence keeps identity support separate and produces explicit insufficiency' },
  @{ Name = "Canonical test covers insufficient status"; Text = $offerTest; Pattern = 'assert.equal(offer.status, "insufficient_evidence")' },
  @{ Name = "Mock test covers high max with verified evidence"; Text = $mock; Pattern = 'Strong verified sold evidence can support a maximum above the current target when justified.' },
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
