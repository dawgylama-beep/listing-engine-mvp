param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$range = Get-Content (Join-Path $Root "lib/evidence/range.js") -Raw
$decisions = Get-Content (Join-Path $Root "lib/evidence/decisions.js") -Raw
$offer = Get-Content (Join-Path $Root "lib/evidence/offer.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.34"; Text = $index; Pattern = "Version 1.12.34" },
  @{ Name = "Package version is 1.12.34"; Text = $package; Pattern = '"version": "1.12.34"' },
  @{ Name = "Server version is 1.12.34"; Text = $server; Pattern = '$AppVersion = "1.12.34"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Canonical range groups current retail separately"; Text = $range; Pattern = 'key: "current_retail"' },
  @{ Name = "Canonical range groups active asking separately"; Text = $range; Pattern = 'key: "active_asking"' },
  @{ Name = "Canonical range groups verified sold separately"; Text = $range; Pattern = 'key: "verified_sold"' },
  @{ Name = "Canonical range requires two independent offers"; Text = $range; Pattern = "CANONICAL_RANGE_MINIMUM_INDEPENDENT_OFFERS = 2" },
  @{ Name = "Canonical range uses underlying offer IDs"; Text = $range; Pattern = "underlyingOfferIds" },
  @{ Name = "API preserves outlier diagnostic records"; Text = $api; Pattern = "pricingOutliersExcluded" },
  @{ Name = "API labels verified market range"; Text = $api; Pattern = "Verified Market Range" },
  @{ Name = "API labels current asking range"; Text = $api; Pattern = "Current Asking-Price Range" },
  @{ Name = "API labels preliminary reference range"; Text = $api; Pattern = "Preliminary Reference Range" },
  @{ Name = "API no longer contains legacy statistical range engine"; Text = $api; Pattern = "function summarizeConsumerVisiblePriceEvidence(finalEvidenceResult = {})" },
  @{ Name = "Canonical supported-value badge requires multiple verified sales"; Text = $decisions; Pattern = "multiple_verified_sales_support_price" },
  @{ Name = "Canonical low-confidence badge remains neutral"; Text = $decisions; Pattern = "pricing_support_limited" },
  @{ Name = "Canonical no-price badge is insufficient"; Text = $decisions; Pattern = "market_evidence_insufficient" },
  @{ Name = "Canonical lower-offer badge exists"; Text = $decisions; Pattern = "lower_qualified_offer_found" },
  @{ Name = "Canonical above-range badge exists"; Text = $decisions; Pattern = "above_supported_price" },
  @{ Name = "Canonical offer rounds opening below target"; Text = $offer; Pattern = "function roundOpeningOffer" },
  @{ Name = "Frontend renders verified market range"; Text = $app; Pattern = '["verifiedMarketRange", "Verified Market Range"]' },
  @{ Name = "Frontend renders current asking range"; Text = $app; Pattern = '["currentAskingPriceRange", "Current Asking-Price Range"]' },
  @{ Name = "Frontend handles current asking valuation state"; Text = $app; Pattern = 'classified.state === "current_asking"' },
  @{ Name = "Frontend displays current asking value"; Text = $app; Pattern = 'valuation.state === "current_asking"' },
  @{ Name = "Frontend renders price range analysis"; Text = $app; Pattern = '["priceRangeAnalysis", "Price Range Analysis"]' },
  @{ Name = "Frontend renders customer pricing summary"; Text = $app; Pattern = '["customerPricingSummary", "Customer Pricing Summary"]' },
  @{ Name = "Frontend technical details include excluded outliers"; Text = $app; Pattern = '["Pricing Outliers Excluded", report.pricingOutliersExcluded]' },
  @{ Name = "Mock proves canonical low/high uses canonical support"; Text = $mock; Pattern = "Canonical low/high must derive from every accepted independent support ID" },
  @{ Name = "Mock proves translation does not exclude support"; Text = $mock; Pattern = "translation-only summary must not independently exclude canonical support as outliers" },
  @{ Name = "Mock test blocks Exceptional Value with weak evidence"; Text = $mock; Pattern = "Weak asking evidence must not produce an Exceptional Value badge." },
  @{ Name = "Mock test proves sold outranks active"; Text = $mock; Pattern = "Verified sold exact/strong evidence should outrank active asking evidence." },
  @{ Name = "Mock test proves active exact outranks partial"; Text = $mock; Pattern = "Active exact/strong asking evidence should outrank partial/reference prices when sold evidence is absent." },
  @{ Name = "Mock test proves opening offer differs from target"; Text = $mock; Pattern = "Opening offer should stay below the target" }
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
