param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$model = Get-Content (Join-Path $Root "public/customer-evidence.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

function Require-NotContains($Name, $Text, $Pattern) {
  if ($Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

Require-Contains "Where to Buy uses one canonical list container" $app 'const list = document.createElement("ul");'
Require-Contains "Compact list class is used" $app 'list.className = "prices-found-list compact-price-list";'
Require-Contains "Canonical cards render through one list" $app "viewModel.cards.forEach"
Require-Contains "Retail result is a compact list row" $app 'const card = document.createElement("li");'
Require-Contains "Compact row class is used" $app 'card.className = `price-found-row match-${matchModifier}`;'
Require-Contains "Canonical evidence ID is attached to row" $app "card.dataset.evidenceId = item.evidenceId;"
Require-Contains "Canonical source is prominent" $app "source.textContent = item.sourceLabel;"
Require-Contains "Canonical customer price is prominent" $app "priceValue.textContent = item.customerPriceLabel;"
Require-Contains "Canonical quantity and attributes are formatted once" $model "function formatQuantity"
Require-Contains "Canonical important attributes are formatted once" $model "function formatAttributes"
Require-Contains "Canonical price type is preserved" $model "const canonicalPriceType = cleanText(record.canonicalPriceType)"
Require-Contains "Canonical match label is preserved" $model "const canonicalMatchLabel = cleanText(record.canonicalMatchLabel)"
Require-Contains "Unit price is presentation-only" $model "unitPrice: cleanText(record.unitPrice)"
Require-Contains "Shipping label is preserved" $model "shippingLabel"
Require-Contains "Delivered cost label is preserved" $model "deliveredCostLabel"
Require-Contains "Availability status is preserved" $model "availabilityStatus"
Require-Contains "One neutral list-level availability disclaimer exists" $app 'disclaimer.textContent = "Source details, prices, and availability can change. Check the source before acting.";'
Require-Contains "Default action is one canonical source view" $app 'link.textContent = "View source";'
Require-Contains "Source action uses canonical destination URL" $app "link.href = item.destinationUrl;"
Require-Contains "Details remain collapsed per row" $app 'details.className = "price-found-details";'
Require-Contains "Match is inside Details" $app '["Match", item.canonicalMatchLabel]'
Require-Contains "Price type is inside Details" $app '["Price type", item.canonicalPriceType]'
Require-Contains "Shipping is inside Details" $app '["Shipping", item.shippingLabel]'
Require-Contains "Delivered cost is inside Details" $app '["Delivered cost", item.deliveredCostLabel]'
Require-Contains "Availability is inside Details" $app '["Availability", item.availabilityStatus]'
Require-NotContains "Frontend does not merge aliases" $app "buildUnifiedCustomerEvidenceList"
Require-NotContains "Frontend does not dedupe cards" $app "getPriceFoundDedupeKey"
Require-NotContains "Frontend does not infer retailer display" $app "getPriceFoundDisplaySourceName"
Require-NotContains "Frontend does not infer purchase channel" $app "getPriceFoundPurchaseChannel"
Require-NotContains "Frontend does not create directions URLs" $app "getPriceFoundDirectionsUrl"
Require-NotContains "Frontend does not create per-row availability note" $app "price-found-check-note"
Require-NotContains "Rendered row does not use old amount grid" $app "price-found-amounts"
Require-NotContains "Rendered row does not use old visible meta grid" $app "price-found-visible-meta"
Require-Contains "Retailer line has readable contrast" $styles "#10231f"
Require-Contains "Quantity line has readable contrast" $styles ".price-found-meta-line"
Require-Contains "Row background remains readable white" $styles "background: #ffffff;"
Require-Contains "Retailer attribution remains a backend authority" $api "function deriveRetailerAttribution"
Require-Contains "Retailer unknown behavior remains intact" $api "Retailer not identified"
Require-Contains "Decision eligibility remains intact" $api "retailPriceDecisionEligibility"
Require-Contains "Mock keeps exact entered price precision" $mock '$5.50'

if ($failed.Count -gt 0) {
  Write-Error ("Compact where-to-buy list static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Compact where-to-buy list static checks OK - canonical presentation contract verified."
