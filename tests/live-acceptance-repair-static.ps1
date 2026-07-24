param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$productionText = @(
  $api
  $app
  (Get-Content (Join-Path $Root "public/index.html") -Raw)
  (Get-Content (Join-Path $Root "server.ps1") -Raw)
  (Get-Content (Join-Path $Root "package.json") -Raw)
) -join "`n"

$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

function Require-NotRegex($Name, $Text, $Pattern) {
  if ([regex]::IsMatch($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
    $script:failed += $Name
  }
}

Require-NotRegex "Early final retail evidence snapshot is deleted" $api "buildFinalRetailCustomerEvidenceSnapshot"
Require-Contains "Limited recovery uses preliminary assessment" $api "recoveryAssessment"
Require-Contains "Actual acquisition providers are diagnosed" $api "actualAcquisitionProviders"
Require-Contains "Source category execution truth is diagnosed" $api "source_categories_are_query_strategies_not_separate_search_engines"
Require-Contains "Final customer evidence count is diagnosed" $api "finalCustomerEvidenceCount"
Require-Contains "Aggregator platform registry exists" $api "retailAggregatorPlatformRegistry"
Require-Contains "Aggregator merchant attribution evidence exists" $api "Aggregator merchant field"
Require-Contains "Equivalent customer offer key exists" $api "function buildEquivalentCustomerRetailOfferKey"
Require-Contains "Direct retailer preference exists" $api "function shouldPreferCustomerEvidenceRecord"
Require-Contains "Mailing dimensions compatibility exists" $api "function retailSizeTokensCompatible"
Require-Contains "Completed auction evidence is classified" $api "Completed Auction"
Require-Contains "Buyer maximum asking ceiling exists" $api "function enforceBuyerNegotiationAskingCeiling"
Require-Contains "Negotiation ceiling sanitizer exists" $api "function negotiationTextViolatesAskingCeiling"
Require-Contains "Compact match label exists" $app "function getCompactPriceFoundMatchLabel"
Require-Contains "Stock-safe list disclaimer exists" $app "Prices and availability can change. Check the retailer before purchasing."
Require-Contains "Generic compact action exists" $app 'return "View source";'

Require-Contains "Mock covers preliminary recovery assessment" $mock "Limited-result recovery must inspect preliminary qualified acquisition evidence"
Require-Contains "Mock covers 4.12 mailing dimensions" $mock "Visible 4.12-inch envelope dimensions should compare as mailing size"
Require-Contains "Mock covers aggregator merchant attribution" $mock "Target via Instacart"
Require-Contains "Mock covers direct retailer dedupe" $mock "Equivalent direct retailer evidence should replace aggregator duplicates"
Require-Contains "Mock covers completed auction market evidence" $mock "Completed auction transaction evidence should support the verified-market bucket"
Require-Contains "Mock covers buyer asking ceiling" $mock "A single active asking listing cannot raise the buyer maximum above the entered asking price"
Require-Contains "Mock preserves exact entered price" $mock '$5.50'

Require-NotRegex "Production does not contain exact Office Works acceptance phrase" $productionText "Office Works Security Envelopes"
Require-NotRegex "Production does not contain exact Office Works UPC" $productionText "041226087161|0041226087161|00041226087161"
Require-NotRegex "Production does not contain exact Office Works SKU" $productionText "6110325"
Require-NotRegex "Production does not contain exact Office Works ZIP" $productionText "30188"
Require-NotRegex "Production does not contain exact Coca-Cola acceptance phrase" $productionText "Georgia Bulldogs Coca-Cola"
Require-NotRegex "Production does not contain exact Georgia slogan fixture" $productionText "HOW '?BOUT THEM DAWGS"
Require-NotRegex "Production does not contain exact acceptance URL fixture" $productionText "office-works-strip-and-seal-security-envelopes-white|georgia-coca-cola-tray"

if ($failed.Count -gt 0) {
  Write-Error ("Live acceptance repair static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Live acceptance repair static checks OK - release contract verified."
