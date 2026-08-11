param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$dedupe = Get-Content (Join-Path $Root "lib/evidence/dedupe.js") -Raw
$offer = Get-Content (Join-Path $Root "lib/evidence/offer.js") -Raw
$offerTest = Get-Content (Join-Path $Root "tests/canonical-buyer-offer.test.mjs") -Raw
$customer = Get-Content (Join-Path $Root "lib/evidence/customer.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$presentation = Get-Content (Join-Path $Root "public/customer-evidence.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.31"; Text = $index; Pattern = "Version 1.12.31" },
  @{ Name = "Package version is 1.12.31"; Text = $package; Pattern = '"version": "1.12.31"' },
  @{ Name = "Server version is 1.12.31"; Text = $server; Pattern = '$AppVersion = "1.12.31"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Consumer sections include Price Spectrum Summary"; Text = $app; Pattern = '["priceSpectrumSummary", "Price Spectrum Summary"]' },
  @{ Name = "Canonical evidence section uses neutral market-evidence language"; Text = $app; Pattern = 'return isCurrentRetailOnlyReport(report) ? "Where to Buy" : "Market Evidence";' },
  @{ Name = "Frontend has no pricesFound response read"; Text = $app; Pattern = "function renderCanonicalCustomerEvidenceSection" },
  @{ Name = "Frontend has canonical customer-evidence renderer"; Text = $app; Pattern = "function renderCustomerEvidence" },
  @{ Name = "Frontend has canonical evidence-card renderer"; Text = $app; Pattern = "function renderCustomerEvidenceCard" },
  @{ Name = "Frontend renders canonical source"; Text = $app; Pattern = 'source.textContent = item.sourceLabel' },
  @{ Name = "Frontend renders canonical customer price"; Text = $app; Pattern = 'priceValue.textContent = item.customerPriceLabel' },
  @{ Name = "Frontend renders canonical quantity metadata"; Text = $app; Pattern = "item.quantityLabel" },
  @{ Name = "Frontend preserves purchase channel through the pure model"; Text = $presentation; Pattern = "purchaseChannel: cleanText(record.purchaseChannel)" },
  @{ Name = "Frontend renders canonical shipping in details"; Text = $app; Pattern = '["Shipping", item.shippingLabel]' },
  @{ Name = "Frontend renders canonical delivered cost in details"; Text = $app; Pattern = '["Delivered cost", item.deliveredCostLabel]' },
  @{ Name = "Frontend uses one neutral list-level availability copy"; Text = $app; Pattern = "Source details, prices, and availability can change. Check the source before acting." },
  @{ Name = "Frontend keeps canonical match classification in Details"; Text = $app; Pattern = '["Match", item.canonicalMatchLabel]' },
  @{ Name = "Frontend renders canonical limitations in details"; Text = $app; Pattern = '["Limitations", item.conciseLimitation]' },
  @{ Name = "Frontend hides canonical source URL behind compact action"; Text = $app; Pattern = "link.href = item.destinationUrl" },
  @{ Name = "Frontend formats canonical evidence for copied report"; Text = $app; Pattern = "function formatCustomerEvidenceListText" },
  @{ Name = "Prices Found styles exist"; Text = $styles; Pattern = ".prices-found-list" },
  @{ Name = "Compact price row styles exist"; Text = $styles; Pattern = ".price-found-row" },
  @{ Name = "Compact price metadata styles exist"; Text = $styles; Pattern = ".price-found-meta-line" },
  @{ Name = "Collapsed detail list styles exist"; Text = $styles; Pattern = ".price-found-details-list" },
  @{ Name = "Price context section styles exist"; Text = $styles; Pattern = ".price-context-section" },
  @{ Name = "API builds Prices Found"; Text = $api; Pattern = "function buildConsumerPricesFound" },
  @{ Name = "Canonical serializer selects exact displayed-ID order"; Text = $customer; Pattern = "(views.displayedIds || []).map((evidenceId)" },
  @{ Name = "Legacy pricesFound alias is a pure canonical projection"; Text = $api; Pattern = "pricesFound: customerEvidence" },
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
  @{ Name = "Canonical offer clamps maximum to supported range"; Text = $offer; Pattern = "Math.min(rangeResult.high" },
  @{ Name = "API audits verified sold evidence"; Text = $api; Pattern = "function isQualifiedVerifiedSoldPriceEvidence" },
  @{ Name = "API blocks mismatched product forms from Prices Found"; Text = $api; Pattern = "itemTypeCompatibilityStatus" },
  @{ Name = "API excludes weak/rejected from Prices Found"; Text = $api; Pattern = '/weak|rejected/i.test(record.classification || record.evidenceRole || "")' },
  @{ Name = "Canonical finalizer dedupes underlying offers before range derivation"; Text = $dedupe; Pattern = "export function dedupeUnderlyingOffers" },
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
  @{ Name = "Mock test covers known delivered-cost summary"; Text = $mock; Pattern = 'A $6 item with $15 shipping should not displace a $15 item with free shipping' },
  @{ Name = "Mock test covers unknown shipping not confirmed"; Text = $mock; Pattern = "unknown shipping must not automatically become the confirmed delivered-cost option" },
  @{ Name = "Mock test covers higher compatible prices"; Text = $mock; Pattern = "Higher compatible prices should remain visible in canonical customerEvidence." },
  @{ Name = "Mock test covers free shipping case"; Text = $mock; Pattern = "Free shipping should produce delivered cost equal to item price." },
  @{ Name = "Mock test covers auction bid label"; Text = $mock; Pattern = "Auction current bid must not be relabeled as final sold value." },
  @{ Name = "Mock test covers duplicate URL dedupe"; Text = $mock; Pattern = "Duplicate canonical-equivalent listing URLs should count once." },
  @{ Name = "Mock test excludes mismatched and unknown types"; Text = $mock; Pattern = "Mismatched and unknown item types must not appear in Prices Found." },
  @{ Name = "Mock test covers partial compatible price"; Text = $mock; Pattern = "Partial but product-type-compatible priced listings may appear in Prices Found." },
  @{ Name = "Mock test preserves exact no-price references"; Text = $mock; Pattern = "Exact identity/reference pages without usable price evidence must remain visible as Price unavailable." },
  @{ Name = "Mock test covers canonical active-asking inclusion consistency"; Text = $mock; Pattern = "included in the canonical active-asking group without influencing verified market value." },
  @{ Name = "Mock test covers active listings cannot drive verified range"; Text = $mock; Pattern = "Active listings cannot drive Verified Market Range" },
  @{ Name = "Canonical test covers maximum within supported range"; Text = $offerTest; Pattern = "assert(offer.maximumPrice <= result.rangeResult.high)" },
  @{ Name = "Canonical test covers target below max"; Text = $offerTest; Pattern = "assert(offer.targetPrice <= offer.maximumPrice)" },
  @{ Name = "Mock test prevents display-card range exclusion"; Text = $mock; Pattern = "Display cards must not silently remove evidence used by the canonical range." }
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
if ($app.Contains("pricesFound")) {
  $failed += "Frontend must not read or configure the deprecated pricesFound response projection"
}

if ($api -match "georgia-coca-cola-bottle|georgia-coca-cola-tray|HOW 'BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS|picclick\.com/1981|example\.com/georgia|ebay\.com/itm/georgia") {
  $failed += "Production API must not contain fixture-specific hardcoding"
}

if ($failed.Count -gt 0) {
  Write-Error ("Prices Found delivered-cost static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Prices Found delivered-cost static checks OK - $($checks.Count) checks passed."
