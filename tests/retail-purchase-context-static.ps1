param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$decisions = Get-Content (Join-Path $Root "lib/evidence/decisions.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.1"; Text = $index; Pattern = "Version 1.12.1" },
  @{ Name = "Package version is 1.12.2"; Text = $package; Pattern = '"version": "1.12.2"' },
  @{ Name = "Server version is 1.12.2"; Text = $server; Pattern = '$AppVersion = "1.12.2"' },
  @{ Name = "Roadmap documents retail purchase context"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Personal Buy context selector exists"; Text = $index; Pattern = 'id="purchase_context"' },
  @{ Name = "Retail store option exists"; Text = $index; Pattern = 'value="retail_store"' },
  @{ Name = "Online retailer option exists"; Text = $index; Pattern = 'value="online_retailer"' },
  @{ Name = "eBay Etsy Mercari option exists"; Text = $index; Pattern = 'value="ebay_etsy_mercari"' },
  @{ Name = "Flea market yard sale option exists"; Text = $index; Pattern = 'value="flea_market_yard_sale"' },
  @{ Name = "Retail follow-up field group exists"; Text = $index; Pattern = 'id="retail-context-fields"' },
  @{ Name = "Store name field exists"; Text = $index; Pattern = 'id="store_name"' },
  @{ Name = "ZIP code field exists"; Text = $index; Pattern = 'id="location_zip"' },
  @{ Name = "Use My Location button exists"; Text = $index; Pattern = 'id="use-location-button"' },
  @{ Name = "Location denied copy is browser neutral"; Text = $app; Pattern = "Location access was not granted. Enable location for this browser and site, or enter a ZIP code." },
  @{ Name = "Location is requested only by click handler"; Text = $app; Pattern = 'useLocationButton.addEventListener("click", handleUseLocationClick)' },
  @{ Name = "No automatic geolocation on page load"; Text = $app; Pattern = 'function handleUseLocationClick()' },
  @{ Name = "Manual UPC label exists"; Text = $index; Pattern = "Barcode or UPC number" },
  @{ Name = "Barcode failure message exists"; Text = $api; Pattern = "The barcode could not be read clearly. Upload a closer photo of the barcode or enter the numbers manually." },
  @{ Name = "Personal Buy requires purchase context"; Text = $app; Pattern = "purchaseContextRequired: true" },
  @{ Name = "Retail validation requires store name"; Text = $app; Pattern = "Enter the store name before checking a retail-store purchase." },
  @{ Name = "Retail validation requires ZIP or location"; Text = $app; Pattern = "Enter a ZIP code or tap Use My Location before checking nearby retail prices." },
  @{ Name = "Retail route uses current replacement cost"; Text = $api; Pattern = "retail-store current replacement-cost sources" },
  @{ Name = "Retail route uses exact UPC lookup"; Text = $api; Pattern = "exact UPC/barcode retail lookup" },
  @{ Name = "Retail route uses named store search"; Text = $api; Pattern = "named store current price search" },
  @{ Name = "Retail route avoids ordinary resale priority"; Text = $api; Pattern = "For ordinary current retail consumables, do not prioritize historical sold comps" },
  @{ Name = "Retail queries build UPC alone"; Text = $api; Pattern = "queries.push(barcode);" },
  @{ Name = "Retail queries build store plus UPC"; Text = $api; Pattern = "queries.push(compactWords([storeName, barcode]));" },
  @{ Name = "Store domain lookup exists"; Text = $api; Pattern = "function getRetailerDomainForStore" },
  @{ Name = "Pure UPC validation bypasses item noun requirement"; Text = $api; Pattern = "if (!hasItemNoun && !hasLongIdentifier)" },
  @{ Name = "Pack quantity mismatch guard exists"; Text = $api; Pattern = "pack_quantity_mismatch" },
  @{ Name = "100-count mismatch test exists"; Text = $mock; Pattern = "A 25-count box should still be rejected for a submitted 100-count package" },
  @{ Name = "Unit-price context keeps package price separate"; Text = $api; Pattern = "Package price remains" },
  @{ Name = "Local Store Context report section exists"; Text = $app; Pattern = "Local Store Context" },
  @{ Name = "Retail Price Context report section exists"; Text = $app; Pattern = "Retail Price Context" },
  @{ Name = "Package Unit Price report section exists"; Text = $app; Pattern = "Package / Unit Price Context" },
  @{ Name = "Technical details include purchase context"; Text = $app; Pattern = '["Purchase Context", diagnostics.purchaseContext]' },
  @{ Name = "Technical details include barcode status"; Text = $app; Pattern = '["Barcode Extraction Status", diagnostics.barcodeExtractionStatus]' },
  @{ Name = "Technical details include pack mismatch"; Text = $app; Pattern = '["Rejected Pack-Size Mismatches", diagnostics.rejectedPackSizeMismatches]' },
  @{ Name = "Retail diagnostics include location mode"; Text = $api; Pattern = "locationModeUsed" },
  @{ Name = "Retail diagnostics include named-store query results"; Text = $api; Pattern = "namedStoreQueryResults" },
  @{ Name = "Retail diagnostics do not store coordinates"; Text = $app; Pattern = "Precise coordinates are not stored or displayed" },
  @{ Name = "Canonical retail contradiction exists"; Text = $decisions; Pattern = "lower_qualified_offer_materially_undercuts" },
  @{ Name = "Canonical retail comparison badge exists"; Text = $decisions; Pattern = "qualified_retail_comparison" },
  @{ Name = "Canonical insufficient-evidence badge exists"; Text = $decisions; Pattern = "Market Evidence Insufficient" },
  @{ Name = "Next best action asks retail missing identifiers"; Text = $api; Pattern = "Upload a closer barcode photo or enter the UPC manually." },
  @{ Name = "Mock test checks UPC first"; Text = $mock; Pattern = "Readable UPC should be the first-priority retail search identifier." },
  @{ Name = "Mock test checks store plus UPC"; Text = $mock; Pattern = "Store name plus UPC should be generated as a separate retail query." },
  @{ Name = "Mock test preserves resale route safeguards"; Text = $mock; Pattern = "Historical sold-only evidence should explain that no current confirmed delivered-cost option was found." },
  @{ Name = "Conditional fields have compact styling"; Text = $styles; Pattern = ".conditional-fields" }
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

if ($app -match "getCurrentPosition\(" -and $app -notmatch 'function handleUseLocationClick\(\)') {
  $failed += "Geolocation must remain inside the explicit location button handler"
}

if ($failed.Count -gt 0) {
  Write-Error ("Retail purchase-context static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Retail purchase-context static checks OK - $($checks.Count) checks passed."
