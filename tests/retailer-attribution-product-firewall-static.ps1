param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$css = Get-Content (Join-Path $Root "public/styles.css") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$checks = @(
  @{ Name = "Retailer attribution helper exists"; Text = $api; Pattern = "function deriveRetailerAttribution" },
  @{ Name = "Search-provider redirect unwrap helper exists"; Text = $api; Pattern = "function unwrapRetailDestinationUrl" },
  @{ Name = "Unknown retailer is explicit"; Text = $api; Pattern = "Retailer not identified" },
  @{ Name = "Transactional retailer evidence is recorded"; Text = $api; Pattern = "transactionalRetailerEvidence" },
  @{ Name = "Decision eligibility field is recorded"; Text = $api; Pattern = "retailPriceDecisionEligibility" },
  @{ Name = "Product family compatibility helper exists"; Text = $api; Pattern = "function assessRetailProductFamilyCompatibility" },
  @{ Name = "Contradictory product evidence is recorded"; Text = $api; Pattern = "contradictoryEvidence" },
  @{ Name = "Product family outcome is sanitized"; Text = $api; Pattern = "productFamilyCompatibilityOutcome" },
  @{ Name = "Best-price pool uses decision-eligible records"; Text = $api; Pattern = "isRetailPriceDecisionEligibleRecord" },
  @{ Name = "Current retail summaries use decision-eligible evidence"; Text = $api; Pattern = "decisionEligiblePrices" },
  @{ Name = "Customer rows display retailer/source and price without opening source"; Text = $app; Pattern = 'source.textContent = `${retailerUnknown ? "Retailer not identified" : displaySourceName}' },
  @{ Name = "Unknown retailer button remains listing-oriented"; Text = $app; Pattern = "View Listing" },
  @{ Name = "Known retailer button names retailer through action helper"; Text = $app; Pattern = "function getPriceFoundActionLabel" },
  @{ Name = "Customer cards include expandable details"; Text = $app; Pattern = "price-found-details" },
  @{ Name = "Text export includes display source"; Text = $app; Pattern = 'const primary = `${retailerUnknown ? "Retailer not identified" : displaySourceName}' },
  @{ Name = "Retailer/source contrast uses readable dark text"; Text = $css; Pattern = "#263a35" },
  @{ Name = "Details summary contrast uses readable dark text"; Text = $css; Pattern = "#084f47" },
  @{ Name = "Action button style exists"; Text = $css; Pattern = ".price-found-action" },
  @{ Name = "Mock covers redirect unwrapping"; Text = $mock; Pattern = "Search-provider redirects should unwrap to the destination retailer URL" },
  @{ Name = "Mock covers structured merchant attribution"; Text = $mock; Pattern = "Retailer name should come from structured Shopping merchant evidence" },
  @{ Name = "Mock covers provider versus seller separation"; Text = $mock; Pattern = "Search provider should remain technical metadata, not the seller" },
  @{ Name = "Mock covers explicit unknown retailer"; Text = $mock; Pattern = "Unknown retailer should be displayed explicitly" },
  @{ Name = "Mock covers unknown-retailer decision exclusion"; Text = $mock; Pattern = "Unknown-retailer evidence must not be eligible for best alternative or retail limit" },
  @{ Name = "Mock covers product mismatch exclusion"; Text = $mock; Pattern = "Product-type mismatch cannot become a customer price card" },
  @{ Name = "Mock covers negative title evidence"; Text = $mock; Pattern = "Contradictory product-family evidence should be recorded" },
  @{ Name = "Mock covers best-alternative recalculation"; Text = $mock; Pattern = "Best Current Retail Alternative must ignore unknown-retailer prices" },
  @{ Name = "Mock covers retail-limit recalculation"; Text = $mock; Pattern = "Retail Price Limit must not be established by unknown-retailer evidence" },
  @{ Name = "Mock covers same-type different-brand eligibility"; Text = $mock; Pattern = "Cross-brand ordinary retail alternatives should be eligible" },
  @{ Name = "Mock covers package-quantity downgrade"; Text = $mock; Pattern = "Missing package count should downgrade to package-price-only" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

foreach ($pattern in @("PROWORX", "Raceway", "Cord Hiding", "041226087161", "610325", "6110325", "30188")) {
  if ($api.Contains($pattern) -or $app.Contains($pattern) -or $css.Contains($pattern)) {
    $failed += "Product-specific production pattern found: $pattern"
  }
}

foreach ($pattern in @("PROWORX", "Raceway", "Cord Hiding")) {
  if (-not $mock.Contains($pattern)) {
    $failed += "Expected regression fixture missing from mock tests: $pattern"
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Retailer attribution/product firewall static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Retailer attribution/product firewall static checks OK - $($checks.Count) checks passed."
