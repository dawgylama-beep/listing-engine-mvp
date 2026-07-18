param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

function Require-NotRegex($Name, $Text, $Pattern) {
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

$canonicalBuilder = Function-Block $api "function buildCanonicalProductIdentity" "function createCanonicalField"
$brandExtractor = Function-Block $api "function extractSupportedBrandFromEvidence" "function extractItemNumberFromEvidence"
$ordinaryRetailSignals = Function-Block $api "function isOrdinaryCurrentRetailProduct" "function isRetailForbiddenSecondaryEvidenceText"

if (-not $canonicalBuilder) { $failed += "Could not isolate buildCanonicalProductIdentity" }
if (-not $brandExtractor) { $failed += "Could not isolate extractSupportedBrandFromEvidence" }
if (-not $ordinaryRetailSignals) { $failed += "Could not isolate isOrdinaryCurrentRetailProduct" }

$productionText = @($api, $app, $server, $package) -join "`n"
Require-NotRegex "Production code must not contain Office Works literal" $productionText "Office Works"
Require-NotRegex "Production code must not contain office works literal" $productionText "office works"
Require-NotRegex "Production code must not contain officeworks literal" $productionText "officeworks"

Require-Contains "Canonical brand can come from user-provided brand" $canonicalBuilder "intake.known_brand"
Require-Contains "Canonical manufacturer can come from user-provided manufacturer" $canonicalBuilder "intake.known_manufacturer"
Require-Contains "Canonical brand can come from supported identity brand" $canonicalBuilder "supportedByEvidence(identity.brand, strongEvidenceText)"
Require-Contains "Canonical brand can come from recognized brand when supported" $canonicalBuilder "supportedByEvidence(identity.recognizedBrand, strongEvidenceText)"
Require-Contains "SKU participates in strong identity evidence" $canonicalBuilder "intake.known_sku"
Require-Contains "UPC participates in strong identity evidence" $canonicalBuilder "intake.known_upc"
Require-Contains "Visible package wording participates in identity evidence" $canonicalBuilder "visiblePackageWording"
Require-Contains "Search identity combines brand and SKU generically" $canonicalBuilder 'canonicalFieldValue({ fields }, "brand")'
Require-Contains "Search identity includes SKU generically" $canonicalBuilder 'canonicalFieldValue({ fields }, "SKU")'

Require-NotRegex "Known-brand helper must not contain old product literal" $brandExtractor "Office Works|office works|officeworks"
Require-NotRegex "Ordinary retail signal helper must not contain old product literal" $ordinaryRetailSignals "Office Works|office works|officeworks"

Require-Contains "Mock includes neutral synthetic brand fixture" $mock "Northstar Paper Co"
Require-Contains "Mock proves neutral synthetic brand retained" $mock "Neutral synthetic brand should be retained from structured/user-supported evidence without production brand literals."
Require-Contains "Mock proves neutral route remains barcode-first" $mock "Neutral synthetic brand retail route should remain barcode-first."
Require-Contains "Mock proves neutral brand plus item-number queries" $mock "Neutral synthetic brand should generate brand plus item-number retail queries."
Require-Contains "Mock proves neutral retail product queries" $mock "Neutral synthetic brand should generate current retail product queries from general identity evidence."

if ($failed.Count -gt 0) {
  Write-Error ("Neutral-brand generalization static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Neutral-brand generalization static checks OK - production literals absent and generic brand derivation verified."
