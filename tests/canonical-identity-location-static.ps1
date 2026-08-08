param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.18"; Text = $index; Pattern = "Version 1.12.18" },
  @{ Name = "Package version is 1.12.18"; Text = $package; Pattern = '"version": "1.12.18"' },
  @{ Name = "Server version is 1.12.18"; Text = $server; Pattern = '$AppVersion = "1.12.18"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "API finalizes canonical identity before routing"; Text = $api; Pattern = "finalizeIdentityForResearch(extractedIdentity, intake)" },
  @{ Name = "API blocks unresolved conflict before live search"; Text = $api; Pattern = "identityConfirmationRequired" },
  @{ Name = "Canonical identity has field status metadata"; Text = $api; Pattern = "createCanonicalField" },
  @{ Name = "Canonical identity preserves evidence sources"; Text = $api; Pattern = "evidenceSourcesUsed" },
  @{ Name = "Canonical identity carries rejected candidates"; Text = $api; Pattern = "conflictingCandidatesRejected" },
  @{ Name = "Unsupported query term list exists"; Text = $api; Pattern = "unsupportedTermsRejected" },
  @{ Name = "Query firewall strips unsupported terms"; Text = $api; Pattern = "finalizeSearchQueryCandidate" },
  @{ Name = "Serper validation rejects unsupported terms"; Text = $api; Pattern = "unsupported_identity_term" },
  @{ Name = "Envelope type outranks poster print"; Text = $api; Pattern = '["boxed envelopes", /envelope|envelopes|stationery|security envelope|strip\s*&?\s*seal' },
  @{ Name = "Retail recovery suppresses sold terms"; Text = $api; Pattern = '["current price", "shopping", "in stock", "pickup", "delivery"]' },
  @{ Name = "Kroger domain is known"; Text = $api; Pattern = '[/kroger/, "kroger.com"]' },
  @{ Name = "Retail exact UPC query remains first"; Text = $api; Pattern = "queries.push(barcode);" },
  @{ Name = "Retail store plus UPC query exists"; Text = $api; Pattern = "queries.push(compactWords([storeName, barcode]));" },
  @{ Name = "Retail domain plus UPC query exists"; Text = $api; Pattern = "buildSerperSingleMarketplaceQuery(barcode, context.retailerDomain)" },
  @{ Name = "Retail brand plus SKU query exists"; Text = $api; Pattern = "queries.push(compactWords([brand, identifier]));" },
  @{ Name = "Retail brand plus pack-count query exists"; Text = $api; Pattern = "queries.push(compactWords([brand, productType, packageQuantity]));" },
  @{ Name = "Retail local competitor query exists"; Text = $api; Pattern = 'queries.push(compactWords([productType, packageQuantity, "near", location]));' },
  @{ Name = "Customer item title uses canonical identity"; Text = $api; Pattern = "identity.canonicalProductIdentity?.customerFacingTitle" },
  @{ Name = "Diagnostics include Canonical Product Identity"; Text = $app; Pattern = '["Canonical Product Identity", diagnostics.canonicalProductIdentity]' },
  @{ Name = "Diagnostics include Retail Query Integrity"; Text = $app; Pattern = '["Retail Query Integrity", diagnostics.retailQueryIntegrity]' },
  @{ Name = "Location area hidden field exists"; Text = $index; Pattern = 'id="location_area"' },
  @{ Name = "Location area submitted"; Text = $app; Pattern = 'location_area: getValue("location_area")' },
  @{ Name = "Use My Location requests geolocation on click"; Text = $app; Pattern = "navigator.geolocation.getCurrentPosition(resolve, reject" },
  @{ Name = "Location not requested automatically"; Text = $app; Pattern = 'useLocationButton.addEventListener("click", handleUseLocationClick)' },
  @{ Name = "Reverse geocoding function exists"; Text = $app; Pattern = "function reverseGeocodePosition" },
  @{ Name = "Reverse geocoding uses same-origin API"; Text = $app; Pattern = 'fetch("/api/reverse-geocode"' },
  @{ Name = "Browser does not call public reverse geocoder directly"; Text = $app; Pattern = "api.bigdatacloud.net"; ShouldNotContain = $true },
  @{ Name = "Location retry is capped after repeated failures"; Text = $app; Pattern = "locationFailureCount < 2" },
  @{ Name = "Location success can populate ZIP"; Text = $app; Pattern = "locationZipInput.value = area.zip" },
  @{ Name = "Location success can populate general area"; Text = $app; Pattern = 'mode: "browser_location_general_area"' },
  @{ Name = "Permission denied copy remains browser-neutral"; Text = $app; Pattern = "Location access was not granted. Enable location for this browser and site, or enter a ZIP code." },
  @{ Name = "Timeout fallback copy exists"; Text = $app; Pattern = "Location lookup timed out. Try again or enter a ZIP code." },
  @{ Name = "Unsupported insecure fallback copy exists"; Text = $app; Pattern = "Location services require a secure browser connection. Enter a ZIP code." },
  @{ Name = "Coordinates are not sent in buyer intake"; Text = $app; Pattern = "location_area" },
  @{ Name = "Identity confirmation card exists"; Text = $app; Pattern = "renderIdentityConfirmationCard" },
  @{ Name = "Confirm action resubmits with token"; Text = $app; Pattern = "pendingIdentityConfirmationToken" },
  @{ Name = "Confirmation card styling exists"; Text = $styles; Pattern = ".identity-confirmation-card" },
  @{ Name = "Mock covers Office Works envelope fixture"; Text = $mock; Pattern = "Office Works Security Envelopes" },
  @{ Name = "Mock rejects poster print queries"; Text = $mock; Pattern = "Unsupported poster print terms must not enter retail search queries." },
  @{ Name = "Mock checks Kroger domain UPC"; Text = $mock; Pattern = "Known retailer-domain plus UPC should be generated." },
  @{ Name = "Mock preserves resale suppression"; Text = $mock; Pattern = "Retail-store route must suppress resale-oriented query terms for ordinary current products." }
)

$failed = @()
foreach ($check in $checks) {
  $contains = $check.Text.Contains($check.Pattern)
  if ($check.ShouldNotContain) {
    if ($contains) { $failed += $check.Name }
  } elseif (-not $contains) {
    $failed += $check.Name
  }
}

if ($app -match "SERPER_API_KEY|google\.serper\.dev|X-API-KEY") {
  $failed += "Frontend must not contain Serper key, endpoint, or auth header"
}

if ($app -match "latitude:\\s|longitude:\\s|coords\\.latitude\\s*,|coords\\.longitude\\s*,") {
  $failed += "Frontend must not store precise coordinates as submitted/report fields"
}

if ($api -match "poster print" -and $api -notmatch "unsupportedTermsRejected") {
  $failed += "Poster print may only appear as rejected/unsupported identity handling"
}

if ($failed.Count -gt 0) {
  Write-Error ("Canonical identity / location static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Canonical identity / location static checks OK - $($checks.Count) checks passed."
