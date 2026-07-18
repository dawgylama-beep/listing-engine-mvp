param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
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

Require-Contains "Online retailer registry exists" $api "const onlineRetailerRegistry = Object.freeze"
Require-Contains "Amazon is registry data, not a one-off rule" $api 'key: "amazon"'
Require-Contains "Walmart is registry data" $api 'key: "walmart"'
Require-Contains "Target is registry data" $api 'key: "target"'
Require-Contains "Staples is registry data" $api 'key: "staples"'
Require-Contains "Office Depot is registry data" $api 'key: "office_depot"'
Require-Contains "Manufacturer direct target is registry data" $api 'key: "manufacturer_direct"'
Require-Contains "Online registry selector exists" $api "function buildOnlineRetailSearchTargets"
Require-Contains "Online category tag detector exists" $api "function detectOnlineRetailCategoryTags"
Require-Contains "Online stage budget exists" $api "onlineRetail: 4"
Require-Contains "Online retail stage exists" $api "stage_5_online_retail"
Require-Contains "Online stage budget bucket is recorded" $api 'retailBudgetBucket: "onlineRetail"'
Require-Contains "Online stage uses domain-constrained registry queries" $api "online_retailer_registry_domain_query"
Require-Contains "Online stage is displayed in diagnostics" $app "Online Retail Search Status"
Require-Contains "Online queries attempted are displayed" $app "Online Retail Queries Attempted"
Require-Contains "Online provider calls used are displayed" $app "Online Retail Provider Calls Used"
Require-Contains "Purchase channel helper exists" $app "function getPriceFoundPurchaseChannel"
Require-Contains "Where to Buy is the unified retail list" $app 'pricesTitle.textContent = "Where to Buy";'
Require-Contains "Purchase channel appears in card details" $app '["Purchase channel", purchaseChannel]'
Require-Contains "Platform and seller are in card details" $app '["Platform / retailer", item.retailOfferPlatform || item.retailerDisplayName]'
Require-Contains "Seller type is in card details" $app '["Seller type", item.retailOfferSellerType]'
Require-Contains "Offer conditions are in card details" $app '["Offer conditions", item.retailOfferConditionDisclosure]'
Require-Contains "Address is address-gated" $app "...(addressText ? [address] : [])"
Require-Contains "One list-level availability note exists" $app 'disclaimer.textContent = "Prices were found online. Check the retailer for current availability.";'
Require-Contains "Text export uses compact price-list formatter" $app "function formatPricesFoundListText"
Require-Contains "Text export includes purchase channel" $app "purchaseChannel"
Require-Contains "Offer details helper exists" $api "function deriveRetailOfferDetails"
Require-Contains "Seller extraction helper exists" $api "function extractRetailSellerName"
Require-Contains "Conditional pricing helper exists" $api "function extractRetailOfferConditions"
Require-Contains "Subscribe-and-save safeguard exists" $api "Subscribe-and-save or subscription pricing was visible"
Require-Contains "Coupon safeguard exists" $api "Coupon or promo-dependent pricing was visible"
Require-Contains "Membership safeguard exists" $api "Membership-only pricing was visible"
Require-Contains "Variant safeguard exists" $api "Variant-specific pricing was visible"
Require-Contains "Unknown shipping limitation remains intact" $api "Shipping was not shown, so delivered cost cannot be confirmed."
Require-Contains "Delivered-cost ranking still requires supported shipping" $api "Lowest Known Delivered Cost Found"
Require-Contains "Search-provider domain helper remains intact" $api "function isSearchProviderDomain"
Require-Contains "Search-provider retailer exclusion remains intact" $api "Retailer not identified"
Require-Contains "Mock covers Amazon entry" $mock "Supported Amazon offers can enter Where to Buy."
Require-Contains "Mock covers no guaranteed Amazon" $mock "Amazon must not be fabricated or guaranteed"
Require-Contains "Mock covers other online retailers" $mock "Other online retailers should enter Where to Buy"
Require-Contains "Mock covers unified online and nearby list" $mock "Nearby and online results should appear in one compact Where to Buy list."
Require-Contains "Mock covers seller/platform separation" $mock "Marketplace platform and actual seller must remain distinct."
Require-Contains "Mock covers conditional pricing" $mock "Conditional online pricing should be disclosed"
Require-Contains "Mock covers unknown shipping" $mock "Unknown online shipping must not be treated as free shipping"
Require-Contains "Mock covers online not local" $mock "Online item prices must not be implied to apply at a nearby physical store."
Require-Contains "Mock covers best delivered cost" $mock "Online item price cannot establish best delivered cost without supported shipping."
Require-Contains "Mock covers search-provider exclusion" $mock "Search-provider pages must not become online retailers"
Require-Contains "Mock covers bounded online queries" $mock "Online retail registry queries must remain within the bounded online budget."

$decisionBlocks = @(
  Function-Block $api "function buildRetailEvidenceProfile" "function buildRetailPurchaseDecisionFromPrices",
  Function-Block $api "function buildRetailPurchaseDecisionFromPrices" "function buildRetailPriceLimitFromPrices",
  Function-Block $api "function buildRetailPriceLimitFromPrices" "function buildRetailPackageUnitPriceComparison",
  Function-Block $api "function isRetailPriceDecisionEligibleRecord" "function isQualifiedCurrentRetailSourceRecord"
)

foreach ($block in $decisionBlocks) {
  if ($block -match '(?i)"(?:Amazon|Walmart|Target|Staples|Office Depot|Kroger)"|amazon\.com|walmart\.com|target\.com|staples\.com|officedepot\.com|kroger\.com|041226087161|30188|6110325') {
    $failed += "Retail decision logic must not contain retailer-, product-, UPC-, SKU-, or ZIP-specific exceptions"
    break
  }
}

if (($api.Contains("Subscribe & Save pricing as an unconditional one-time price")) -or ($api.Contains("unknown shipping as free shipping"))) {
  $failed += "Safeguard wording must not be inverted into an unsafe allowance"
}

if ($failed.Count -gt 0) {
  Write-Error ("Online retail coverage static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Online retail coverage static checks OK - online registry, safeguards, and presentation contract verified."
