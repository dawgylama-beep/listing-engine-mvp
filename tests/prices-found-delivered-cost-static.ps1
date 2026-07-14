param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.10.4"; Text = $index; Pattern = "Version 1.10.4" },
  @{ Name = "Package version is 1.10.4"; Text = $package; Pattern = '"version": "1.10.4"' },
  @{ Name = "Server version is 1.10.4"; Text = $server; Pattern = '$AppVersion = "1.10.4"' },
  @{ Name = "Roadmap documents 1.10.4"; Text = $roadmap; Pattern = "Version 1.10.4 (Completed)" },
  @{ Name = "Consumer sections include Prices Found"; Text = $app; Pattern = '["pricesFound", "Prices Found"]' },
  @{ Name = "Prices Found is prominent in why group"; Text = $app; Pattern = '"pricesFound",' },
  @{ Name = "Frontend has Prices Found renderer"; Text = $app; Pattern = "function renderPricesFound" },
  @{ Name = "Frontend renders item price"; Text = $app; Pattern = '["Item price", item.itemPrice]' },
  @{ Name = "Frontend renders shipping"; Text = $app; Pattern = '["Shipping", item.shipping || "Not shown"]' },
  @{ Name = "Frontend renders delivered cost"; Text = $app; Pattern = '["Delivered cost", item.deliveredCost || "Cannot be confirmed"]' },
  @{ Name = "Frontend renders preliminary range inclusion"; Text = $app; Pattern = "Included in preliminary asking-price range" },
  @{ Name = "Frontend renders verified market influence"; Text = $app; Pattern = "Influenced verified market range" },
  @{ Name = "Prices Found styles exist"; Text = $styles; Pattern = ".prices-found-list" },
  @{ Name = "Price card styles exist"; Text = $styles; Pattern = ".price-found-card" },
  @{ Name = "Mobile price amount stack exists"; Text = $styles; Pattern = ".price-found-amounts" },
  @{ Name = "API builds Prices Found"; Text = $api; Pattern = "function buildConsumerPricesFound" },
  @{ Name = "API extracts shipping evidence"; Text = $api; Pattern = "function extractShippingEvidence" },
  @{ Name = "API normalizes price labels"; Text = $api; Pattern = "function normalizePriceTypeLabel" },
  @{ Name = "API calculates delivered cost"; Text = $api; Pattern = "deliveredAmount = Number.isFinite(itemAmount) && Number.isFinite(shipping.amount)" },
  @{ Name = "API does not assume missing shipping is free"; Text = $api; Pattern = 'return { status: "unknown", label: "Not shown", amount: null };' },
  @{ Name = "API compares delivered cost to user price"; Text = $api; Pattern = "delivered cost is higher after shipping" },
  @{ Name = "API blocks mismatched product forms from Prices Found"; Text = $api; Pattern = "itemTypeCompatibilityStatus" },
  @{ Name = "API excludes weak/rejected from Prices Found"; Text = $api; Pattern = '/weak|rejected/i.test(record.classification || record.evidenceRole || "")' },
  @{ Name = "API dedupes preliminary range listings"; Text = $api; Pattern = "dedupeResearchRecordsByListing(records.filter" },
  @{ Name = "API labels verified sold separately"; Text = $api; Pattern = 'return "Verified Sold";' },
  @{ Name = "API labels active asking separately"; Text = $api; Pattern = 'return "Active Asking";' },
  @{ Name = "API labels auction current bid separately"; Text = $api; Pattern = 'return "Auction Current Bid";' },
  @{ Name = "API labels auction opening bid separately"; Text = $api; Pattern = 'return "Auction Opening Bid";' },
  @{ Name = "API labels guide price separately"; Text = $api; Pattern = 'return "Estimated/Guide Price";' },
  @{ Name = "API distinguishes verified market influence"; Text = $api; Pattern = "influencedVerifiedMarketRange" },
  @{ Name = "API distinguishes preliminary asking range inclusion"; Text = $api; Pattern = "includedInPreliminaryAskingPriceRange" },
  @{ Name = "Mock test covers delivered higher case"; Text = $mock; Pattern = "delivered cost is higher" },
  @{ Name = "Mock test covers unknown shipping case"; Text = $mock; Pattern = "Shipping absent should never default to free." },
  @{ Name = "Mock test covers free shipping case"; Text = $mock; Pattern = "Free shipping should produce delivered cost equal to item price." },
  @{ Name = "Mock test covers auction bid label"; Text = $mock; Pattern = "Auction current bid must not be relabeled as final sold value." },
  @{ Name = "Mock test covers duplicate URL dedupe"; Text = $mock; Pattern = "Duplicate canonical-equivalent listing URLs should count once." },
  @{ Name = "Mock test excludes mismatched and unknown types"; Text = $mock; Pattern = "Mismatched and unknown item types must not appear in Prices Found." },
  @{ Name = "Mock test covers partial compatible price"; Text = $mock; Pattern = "Partial but product-type-compatible priced listings may appear in Prices Found." },
  @{ Name = "Mock test excludes records without price"; Text = $mock; Pattern = "Records without usable price evidence must not appear in Prices Found." },
  @{ Name = "Mock test covers preliminary inclusion consistency"; Text = $mock; Pattern = "included in preliminary range without influencing verified market value." }
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

if ($api -match "georgia-coca-cola-bottle|georgia-coca-cola-tray|HOW 'BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS|picclick\.com/1981|example\.com/georgia|ebay\.com/itm/georgia") {
  $failed += "Production API must not contain fixture-specific hardcoding"
}

if ($failed.Count -gt 0) {
  Write-Error ("Prices Found delivered-cost static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Prices Found delivered-cost static checks OK - $($checks.Count) checks passed."
