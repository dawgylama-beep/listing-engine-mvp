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
  @{ Name = "Visible app version is 1.10.6"; Text = $index; Pattern = "Version 1.10.6" },
  @{ Name = "Package version is 1.10.6"; Text = $package; Pattern = '"version": "1.10.6"' },
  @{ Name = "Server version is 1.10.6"; Text = $server; Pattern = '$AppVersion = "1.10.6"' },
  @{ Name = "Roadmap documents 1.10.6"; Text = $roadmap; Pattern = "Version 1.10.6 (Completed)" },
  @{ Name = "API builds weighted price evidence"; Text = $api; Pattern = "function buildWeightedPriceEvidenceRecord" },
  @{ Name = "API builds price evidence buckets"; Text = $api; Pattern = "function buildPriceEvidenceBuckets" },
  @{ Name = "API selects strongest available bucket"; Text = $api; Pattern = "function selectPrimaryPriceEvidenceBucket" },
  @{ Name = "API analyzes central price cluster"; Text = $api; Pattern = "function analyzePriceEvidenceCluster" },
  @{ Name = "API records quartiles for outlier detection"; Text = $api; Pattern = "function quartileAmount" },
  @{ Name = "API preserves outlier diagnostic records"; Text = $api; Pattern = "pricingOutliersExcluded" },
  @{ Name = "API labels verified market range"; Text = $api; Pattern = "Verified Market Range" },
  @{ Name = "API labels current asking range"; Text = $api; Pattern = "Current Asking-Price Range" },
  @{ Name = "API labels preliminary reference range"; Text = $api; Pattern = "Preliminary Reference Range" },
  @{ Name = "API explains outliers not used"; Text = $api; Pattern = "not used to set the primary range" },
  @{ Name = "API gates Exceptional Value behind strong evidence"; Text = $api; Pattern = 'ratio <= consumerDecisionThresholds.exceptionalMaxRatio && (hasVerifiedSoldEvidence || priceEvidence.activeExactStrongCount >= 2)' },
  @{ Name = "API has low-cost cautious badge"; Text = $api; Pattern = "Low-Cost Cautious Buy" },
  @{ Name = "API has limited-evidence badge"; Text = $api; Pattern = "Promising Price - Limited Evidence" },
  @{ Name = "API has reasonable personal-use badge"; Text = $api; Pattern = "Reasonable Personal-Use Buy" },
  @{ Name = "API has proceed with caution badge"; Text = $api; Pattern = "Proceed with Caution" },
  @{ Name = "API makes opening offer below asking"; Text = $api; Pattern = "function roundOpeningOfferBelowAsking" },
  @{ Name = "Frontend renders verified market range"; Text = $app; Pattern = '["verifiedMarketRange", "Verified Market Range"]' },
  @{ Name = "Frontend renders current asking range"; Text = $app; Pattern = '["currentAskingPriceRange", "Current Asking-Price Range"]' },
  @{ Name = "Frontend handles current asking valuation state"; Text = $app; Pattern = 'classified.state === "current_asking"' },
  @{ Name = "Frontend displays current asking value"; Text = $app; Pattern = 'valuation.state === "current_asking"' },
  @{ Name = "Frontend renders price range analysis"; Text = $app; Pattern = '["priceRangeAnalysis", "Price Range Analysis"]' },
  @{ Name = "Frontend renders customer pricing summary"; Text = $app; Pattern = '["customerPricingSummary", "Customer Pricing Summary"]' },
  @{ Name = "Frontend technical details include excluded outliers"; Text = $app; Pattern = '["Pricing Outliers Excluded", report.pricingOutliersExcluded]' },
  @{ Name = "Mock test covers central cluster excluding outlier"; Text = $mock; Pattern = "Primary preliminary range should use the central cluster instead of the isolated high outlier." },
  @{ Name = "Mock test covers technical preservation of outlier"; Text = $mock; Pattern = "Excluded outlier should be preserved for Technical Search Details." },
  @{ Name = "Mock test blocks Exceptional Value with weak evidence"; Text = $mock; Pattern = "Weak/partial/reference evidence must not produce an Exceptional Value badge." },
  @{ Name = "Mock test proves sold outranks active"; Text = $mock; Pattern = "Verified sold exact/strong evidence should outrank active asking evidence." },
  @{ Name = "Mock test proves active exact outranks partial"; Text = $mock; Pattern = "Active exact/strong asking evidence should outrank partial/reference prices when sold evidence is absent." },
  @{ Name = "Mock test proves opening offer differs from target"; Text = $mock; Pattern = "Opening offer should not equal the target purchase price" }
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
  Write-Error ("Pricing quality calibration static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Pricing quality calibration static checks OK - $($checks.Count) checks passed."
