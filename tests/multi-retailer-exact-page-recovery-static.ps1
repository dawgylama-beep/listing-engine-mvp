param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$customer = Get-Content (Join-Path $Root "lib/evidence/customer.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

function Require-NotContains($Name, $Text, $Pattern) {
  if ($Text -match $Pattern) {
    $script:failed += $Name
  }
}

function Function-Block($Text, $Start, $End) {
  $pattern = [regex]::Escape($Start) + "[\s\S]*?(?=" + [regex]::Escape($End) + ")"
  $match = [regex]::Match($Text, $pattern)
  if ($match.Success) {
    return $match.Value
  }
  return ""
}

Require-Contains "Barcode equivalence helper exists" $api "function buildBarcodeIdentitySet"
Require-Contains "Barcode equivalence intersection helper exists" $api "function barcodeIdentitySetsIntersect"
Require-Contains "Equivalent barcode search helper exists" $api "function hasEquivalentBarcodeIdentity"
Require-Contains "Barcode identities flow through context" $api "normalizedBarcodeIdentities: barcodeIdentitySet"
Require-Contains "Staged retail queries use barcode identity set" $api "retail_exact_barcode_equivalent"
Require-Contains "Retail site GTIN-equivalent query exists" $api "retail_site_barcode_equivalent"
Require-Contains "Exact retailer page URL detector exists" $api "function isLikelyRetailProductPageUrl"
Require-Contains "Exact retailer page recovery helper exists" $api "function enrichExactRetailPageRecord"
Require-Contains "Exact page recovery preserves destination URL" $api "destinationUrl: evidence.destinationUrl"
Require-Contains "Exact page recovery uses provider metadata limitation" $api "search_result_metadata_only"
Require-Contains "Exact page tier promotion exists" $api "record.exactRetailPage === true"
Require-Contains "Equivalent retailer page dedupe exists" $api "function buildEquivalentRetailPageDedupeKey"
Require-Contains "Canonical customer serializer preserves displayed-ID order" $customer "(views.displayedIds || []).map((evidenceId)"
Require-Contains "Canonical retailer composition uses displayed customer evidence" $customer "summary.displayedCountByRetailer = countBy(customerEvidence"
Require-Contains "Limited-result recovery trigger exists" $api "function shouldRunLimitedResultRetailRecovery"
Require-Contains "Limited-result recovery stage exists" $api "stage_7_limited_result_recovery"
Require-Contains "Limited-result recovery budget exists" $api "limitedResultRecovery: 3"
Require-Contains "Diagnostics expose normalized barcode identities" $api "normalizedBarcodeIdentities"
Require-Contains "Diagnostics expose exact retail pages" $api "exactRetailPagesFound"
Require-Contains "Diagnostics expose returned retailer domains" $api "returnedRetailerDomains"
Require-Contains "Diagnostics expose preliminary source-screened counts by retailer" $api "preliminarySourceScreenedCountByRetailer"
Require-Contains "Frontend displays normalized barcode identities" $app "Normalized Barcode Identities"
Require-Contains "Frontend displays exact retail pages" $app "Exact Retail Pages Found"
Require-Contains "Frontend displays limited recovery status" $app "Limited-Result Recovery Ran"
Require-Contains "Price card details include exact recovery status" $app "Exact-page recovery"
Require-Contains "Mock covers UPC/GTIN equivalence" $mock "UPC-A and zero-padded EAN-13 identities should share one barcode equivalence set."
Require-Contains "Mock covers exact retailer page promotion" $mock "Exact retailer product price should outrank a cheaper compatible alternative"
Require-Contains "Mock covers one-result recovery" $mock "One-result recovery should trigger"
Require-Contains "Mock covers duplicate exact pages" $mock "Equivalent exact retailer-page offers should not duplicate"
Require-Contains "Mock covers no availability inference" $mock "Availability must not be inferred solely from a visible price."
Require-Contains "Mock covers multiple retailers" $mock "Multiple retailers should appear when supported"
Require-Contains "Existing compact Where to Buy static remains present" (Get-Content (Join-Path $Root "tests/true-compact-where-to-buy-list-static.ps1") -Raw) "True compact Where to Buy list"
Require-Contains "Existing help instructions static remains present" (Get-Content (Join-Path $Root "tests/global-help-instructions-static.ps1") -Raw) "Help & Instructions"

$newRecoveryBlocks = @(
  Function-Block $api "function buildBarcodeIdentitySet" "function collectBarcodeIdentitySet",
  Function-Block $api "function isLikelyExactRetailProductPage" "function extractExactRetailPageEvidence",
  Function-Block $api "function enrichExactRetailPageRecord" "function createSerperResponseSummary",
  Function-Block $api "function buildLimitedResultRetailRecoveryQueries" "function finalizeLimitedResultRetailRecoveryQueries"
) -join "`n"

Require-NotContains "New recovery helpers must not hardcode regression UPC, ZIP, or price" $newRecoveryBlocks "041226087161|0004122608716|30188|\\$2\\.99|\\$5\\.50"
Require-NotContains "New recovery helpers must not hardcode Office Works product logic" $newRecoveryBlocks "Office Works|security envelopes white"

if ($failed.Count -gt 0) {
  Write-Error ("Multi-retailer exact-page recovery static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Multi-retailer exact-page recovery static checks OK - barcode equivalence, exact-page recovery, and bounded diversity verified."
