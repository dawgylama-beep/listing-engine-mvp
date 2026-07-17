$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$api = Get-Content -LiteralPath (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content -LiteralPath (Join-Path $Root "public/app.js") -Raw
$server = Get-Content -LiteralPath (Join-Path $Root "server.ps1") -Raw
$package = Get-Content -LiteralPath (Join-Path $Root "package.json") -Raw
$roadmap = Get-Content -LiteralPath (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw
$mock = Get-Content -LiteralPath (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$checks = @(
  @{ Name = "Package version is 1.11.6"; Text = $package; Pattern = '"version": "1.11.6"' },
  @{ Name = "Roadmap documents 1.11.6"; Text = $roadmap; Pattern = "Version 1.11.6 (Completed)" },
  @{ Name = "UPC validation helper exists"; Text = $api; Pattern = "function validateRetailBarcodeCandidate" },
  @{ Name = "Barcode check digit helper exists"; Text = $api; Pattern = "function computeRetailBarcodeCheckDigit" },
  @{ Name = "Barcode integrity helper exists"; Text = $api; Pattern = "function buildBarcodeIntegrity" },
  @{ Name = "Invalid barcode query guard exists"; Text = $api; Pattern = "function invalidRetailBarcodeQueryFailureReason" },
  @{ Name = "Invalid barcode stripping exists"; Text = $api; Pattern = "function stripInvalidRetailBarcodeTerms" },
  @{ Name = "Retail fallback identity exists"; Text = $api; Pattern = "function buildRetailAttributeFallbackIdentity" },
  @{ Name = "Category conflict firewall exists"; Text = $api; Pattern = "function detectRetailProductCategoryConflict" },
  @{ Name = "Zero-result recovery diagnostic exists"; Text = $api; Pattern = "zeroResultIdentityRecoveryTriggered" },
  @{ Name = "Unit cents formatter exists"; Text = $api; Pattern = "function formatUnitCents" },
  @{ Name = "Frontend shows barcode integrity"; Text = $app; Pattern = "Barcode Integrity" },
  @{ Name = "Frontend shows canonical retail identity"; Text = $app; Pattern = "Canonical Retail Identity" },
  @{ Name = "Mock covers valid UPC"; Text = $mock; Pattern = "Valid UPC-A should pass check-digit validation." },
  @{ Name = "Mock covers invalid UPC suppression"; Text = $mock; Pattern = "Invalid barcode must not consume exact retail provider budget." },
  @{ Name = "Mock covers alternate OCR candidate"; Text = $mock; Pattern = "Alternate valid OCR candidate should replace a failed first barcode candidate" },
  @{ Name = "Mock covers no-barcode fallback"; Text = $mock; Pattern = "No valid barcode should still trigger package-attribute retail recovery." },
  @{ Name = "Mock covers cross-brand recovery"; Text = $mock; Pattern = "Different brands should qualify as strong retail alternatives" },
  @{ Name = "Mock covers category firewall"; Text = $mock; Pattern = "Unrelated product categories should be rejected early" },
  @{ Name = "Mock covers cents display"; Text = $mock; Pattern = "about 12.2 cents each" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notmatch [regex]::Escape($check.Pattern)) {
    $failed += $check.Name
  }
}

if (($api + $server) -match "041226087161|014226087161|Office Works Security Envelopes") {
  $failed += "Tested UPC/product wording must not be hardcoded in production API or server prompt"
}

if ($failed.Count) {
  Write-Error ("barcode-cross-brand-retail-static failed: " + ($failed -join "; "))
  exit 1
}

Write-Host "barcode-cross-brand-retail-static OK"
