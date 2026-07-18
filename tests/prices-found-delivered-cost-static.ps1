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
  @{ Name = "Visible app version is 1.11.12"; Text = $index; Pattern = "Version 1.11.12" },
  @{ Name = "Package version is 1.11.12"; Text = $package; Pattern = '"version": "1.11.12"' },
  @{ Name = "Server version is 1.11.12"; Text = $server; Pattern = '$AppVersion = "1.11.12"' },
  @{ Name = "Roadmap documents 1.11.12"; Text = $roadmap; Pattern = "Version 1.11.12 (Completed)" },
  @{ Name = "Consumer sections include Best Compatible Price Found"; Text = $app; Pattern = '["bestCompatiblePriceFound", "Best Compatible Price Found"]' },
  @{ Name = "Consumer sections include Other Compatible Prices Found"; Text = $app; Pattern = '["otherCompatiblePricesFound", "Other Compatible Prices Found"]' },
  @{ Name = "Consumer sections include Price Spectrum Summary"; Text = $app; Pattern = '["priceSpectrumSummary", "Price Spectrum Summary"]' },
  @{ Name = "Consumer sections include Prices Found"; Text = $app; Pattern = '["pricesFound", "Prices Found"]' },
  @{ Name = "Prices Found is prominent in why group"; Text = $app; Pattern = '"pricesFound",' },
  @{ Name = "Frontend has Prices Found renderer"; Text = $app; Pattern = "function renderPricesFound" },
  @{ Name = "Frontend has compact price card renderer"; Text = $app; Pattern = "function renderPriceFoundCard" },
  @{ Name = "Frontend renders retailer/source and item price in one compact lead line"; Text = $app; Pattern = 'source.textContent = `${retailerUnknown ? "Retailer not identified" : displaySourceName}' },
  @{ Name = "Frontend renders compact quantity metadata immediately after lead line"; Text = $app; Pattern = 'const quantityParts = getPriceFoundMetaParts(item, purchaseChannel, unitPriceText);' },
  @{ Name = "Frontend renders purchase channel through metadata helper"; Text = $app; Pattern = "function getPriceFoundMetaParts" },
  @{ Name = "Frontend renders shipping in details"; Text = $app; Pattern = '["Shipping", item.shipping || "Not shown"]' },
  @{ Name = "Frontend renders delivered cost in details"; Text = $app; Pattern = '["Delivered cost", item.deliveredCost || "Not established"]' },
  @{ Name = "Frontend uses one list-level availability copy"; Text = $app; Pattern = "Prices were found online. Check the retailer for current availability." },
  @{ Name = "Frontend keeps matching explanation in Details"; Text = $app; Pattern = '["Matching explanation", item.priceContextSummary || matchLabel]' },
  @{ Name = "Frontend renders full limitations in details"; Text = $app; Pattern = '["Full limitations", item.conciseLimitation]' },
  @{ Name = "Frontend hides full source URL behind compact action"; Text = $app; Pattern = "function getPriceFoundActionLabel" },
  @{ Name = "Frontend formats price sections for copied report"; Text = $app; Pattern = "function formatPriceFoundRecordText" },
  @{ Name = "Prices Found styles exist"; Text = $styles; Pattern = ".prices-found-list" },
  @{ Name = "Compact price row styles exist"; Text = $styles; Pattern = ".price-found-row" },
  @{ Name = "Compact price metadata styles exist"; Text = $styles; Pattern = ".price-found-meta-line" },
  @{ Name = "Collapsed detail list styles exist"; Text = $styles; Pattern = ".price-found-details-list" },
  @{ Name = "Price context section styles exist"; Text = $styles; Pattern = ".price-context-section" },
  @{ Name = "API builds Prices Found"; Text = $api; Pattern = "function buildConsumerPricesFound" },
  @{ Name = "API builds best compatible price"; Text = $api; Pattern = "function buildBestCompatiblePriceFound" },
  @{ Name = "API builds other compatible prices"; Text = $api; Pattern = "function buildOtherCompatiblePricesFound" },
  @{ Name = "API builds price spectrum summary"; Text = $api; Pattern = "function buildPriceSpectrumSummary" },
  @{ Name = "API extracts shipping evidence"; Text = $api; Pattern = "function extractShippingEvidence" },
  @{ Name = "API normalizes price labels"; Text = $api; Pattern = "function normalizePriceTypeLabel" },
  @{ Name = "API calculates delivered cost only when supported"; Text = $api; Pattern = "shipping.deliveredCostSupported && Number.isFinite(shipping.amount)" },
  @{ Name = "API supports included shipping"; Text = $api; Pattern = 'label: "Included"' },
  @{ Name = "API supports pickup-only shipping"; Text = $api; Pattern = 'label: "Pickup only"' },
  @{ Name = "API supports calculated-at-checkout shipping"; Text = $api; Pattern = 'label: "Calculated at checkout"' },
  @{ Name = "API does not assume missing shipping is free"; Text = $api; Pattern = 'deliveredCostSupported: false' },
  @{ Name = "API displays unknown delivered cost as not established"; Text = $api; Pattern = 'deliveredCost: Number.isFinite(deliveredAmount) ? formatSourceMoney(deliveredAmount) : "Not established"' },
  @{ Name = "API compares delivered cost to user price"; Text = $api; Pattern = "delivered cost is higher after shipping" },
  @{ Name = "API warns lower unknown-shipping item may not be best total cost"; Text = $api; Pattern = "may not be the lowest total cost because shipping was not shown" },
  @{ Name = "API ranks known delivered cost before unknown shipping"; Text = $api; Pattern = "return aHasDelivered ? -1 : 1" },
  @{ Name = "API enforces conditional buy when max below asking"; Text = $api; Pattern = "Buy only if negotiated to" },
  @{ Name = "API audits verified sold evidence"; Text = $api; Pattern = "function isQualifiedVerifiedSoldPriceEvidence" },
  @{ Name = "API blocks mismatched product forms from Prices Found"; Text = $api; Pattern = "itemTypeCompatibilityStatus" },
  @{ Name = "API excludes weak/rejected from Prices Found"; Text = $api; Pattern = '/weak|rejected/i.test(record.classification || record.evidenceRole || "")' },
  @{ Name = "API dedupes preliminary range listings"; Text = $api; Pattern = "dedupeResearchRecordsByListing(records.filter" },
  @{ Name = "API labels verified sold separately only with proof"; Text = $api; Pattern = 'return hasExplicitSoldTransactionProof(record) ? "Verified Sold" : "Reference Price";' },
  @{ Name = "API labels active asking separately"; Text = $api; Pattern = 'return "Active Asking";' },
  @{ Name = "API labels auction current bid separately"; Text = $api; Pattern = 'return "Auction Current Bid";' },
  @{ Name = "API labels auction opening bid separately"; Text = $api; Pattern = 'return "Auction Opening Bid";' },
  @{ Name = "API labels guide price separately"; Text = $api; Pattern = 'return "Estimated/Guide Price";' },
  @{ Name = "API distinguishes verified market influence"; Text = $api; Pattern = "influencedVerifiedMarketRange" },
  @{ Name = "API distinguishes preliminary asking range inclusion"; Text = $api; Pattern = "includedInPreliminaryAskingPriceRange" },
  @{ Name = "Mock test covers delivered higher case"; Text = $mock; Pattern = "Delivered cost should equal item price plus explicit shipping." },
  @{ Name = "Mock test covers unknown shipping case"; Text = $mock; Pattern = 'A $6 listing with no shipping evidence should show item price' },
  @{ Name = "Mock test covers unknown shipping not free"; Text = $mock; Pattern = "Unknown shipping should never be treated as free" },
  @{ Name = "Mock test covers known delivered-cost ranking"; Text = $mock; Pattern = 'A $6 item with $15 shipping should rank behind a $15 item with free shipping.' },
  @{ Name = "Mock test covers unknown shipping not best"; Text = $mock; Pattern = "unknown shipping must not automatically be labeled the best delivered deal" },
  @{ Name = "Mock test covers higher compatible prices"; Text = $mock; Pattern = "Higher compatible prices should remain visible in Other Compatible Prices Found." },
  @{ Name = "Mock test covers free shipping case"; Text = $mock; Pattern = "Free shipping should produce delivered cost equal to item price." },
  @{ Name = "Mock test covers auction bid label"; Text = $mock; Pattern = "Auction current bid must not be relabeled as final sold value." },
  @{ Name = "Mock test covers duplicate URL dedupe"; Text = $mock; Pattern = "Duplicate canonical-equivalent listing URLs should count once." },
  @{ Name = "Mock test excludes mismatched and unknown types"; Text = $mock; Pattern = "Mismatched and unknown item types must not appear in Prices Found." },
  @{ Name = "Mock test covers partial compatible price"; Text = $mock; Pattern = "Partial but product-type-compatible priced listings may appear in Prices Found." },
  @{ Name = "Mock test excludes records without price"; Text = $mock; Pattern = "Records without usable price evidence must not appear in Prices Found." },
  @{ Name = "Mock test covers preliminary inclusion consistency"; Text = $mock; Pattern = "included in preliminary range without influencing verified market value." },
  @{ Name = "Mock test covers active listings cannot drive verified range"; Text = $mock; Pattern = "Active listings cannot drive Verified Market Range" },
  @{ Name = "Mock test covers conditional buy"; Text = $mock; Pattern = "Buy must become conditional." },
  @{ Name = "Mock test covers target below max"; Text = $mock; Pattern = "Target purchase amount should not exceed the maximum recommended amount." },
  @{ Name = "Mock test covers technical outlier preservation"; Text = $mock; Pattern = "Excluded outlier should be preserved for Technical Search Details." }
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
