param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
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

function Require-Order($Name, $Text, $First, $Second) {
  $firstIndex = $Text.IndexOf($First)
  $secondIndex = $Text.IndexOf($Second)
  if ($firstIndex -lt 0 -or $secondIndex -lt 0 -or $firstIndex -ge $secondIndex) {
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

$pricesRenderer = Function-Block $app "function renderPricesFound" "function renderPriceFoundCard"
$rowRenderer = Function-Block $app "function renderPriceFoundCard" "function formatPriceFoundQuantity"

if (-not $pricesRenderer) { $failed += "Could not isolate renderPricesFound" }
if (-not $rowRenderer) { $failed += "Could not isolate renderPriceFoundCard" }

Require-Contains "Where to Buy uses one list container" $pricesRenderer 'const list = document.createElement("ul");'
Require-Contains "Compact list class is used" $pricesRenderer 'list.className = "prices-found-list compact-price-list";'
Require-Contains "Multiple rows render through one list" $pricesRenderer "records.forEach((item, index) => {"
Require-Contains "Retail result is a compact list row" $rowRenderer 'const card = document.createElement("li");'
Require-Contains "Compact row class is used" $rowRenderer 'card.className = "price-found-row";'
Require-Contains "Retailer and price share the lead line" $rowRenderer 'source.textContent = `${retailerUnknown ? "Retailer not identified" : retailerName}'
Require-Contains "Quantity follows as compact metadata" $rowRenderer 'const quantityParts = [formatPriceFoundQuantity(item)];'
Require-Contains "Purchase channel is included with quantity" $rowRenderer 'quantityParts.push(purchaseChannel);'
Require-Contains "Purchase channel helper exists" $app "function getPriceFoundPurchaseChannel"
Require-Contains "Unknown quantity is explicit" $app 'return "Not shown";'
Require-Contains "Numeric quantity becomes count wording" $app 'return `${cleaned} count`;'
Require-Contains "Unit price appears only when supported" $rowRenderer 'if (unitPriceText) {'
Require-Contains "Unit price helper avoids duplicate each" $app "function formatPriceFoundUnitPrice"
Require-Contains "Nearby address is supported without becoming the lead" $rowRenderer 'address.textContent = addressText;'
Require-Contains "Address is only appended when supported" $rowRenderer "...(addressText ? [address] : [])"
Require-Contains "One list-level availability disclaimer exists" $pricesRenderer 'disclaimer.textContent = "Prices were found online. Check the retailer for current availability.";'
Require-NotContains "Per-row availability note is removed" $rowRenderer "price-found-check-note"
Require-Contains "Known retailer action is preserved" $rowRenderer 'View at ${retailerName}'
Require-Contains "Directions action is compact" $rowRenderer 'Directions'
Require-Contains "Unknown retailer action says View Listing" $rowRenderer 'View Listing'
Require-Contains "Details remain collapsed per row" $rowRenderer 'details.className = "price-found-details";'
Require-Contains "Matching explanation is inside Details" $rowRenderer '["Matching explanation", item.priceContextSummary || matchLabel]'
Require-Contains "Evidence tier is inside Details" $rowRenderer '["Evidence tier", item.retailEvidenceTierLabel || item.retailEvidenceTier || item.priceTypeLabel]'
Require-Contains "Shipping explanation is inside Details" $rowRenderer '["Shipping note", item.shippingDisclosure]'
Require-Contains "Confidence reasoning is inside Details" $rowRenderer '["Confidence", normalizeDisplayValue(item.confidenceDowngradeReasons)]'
Require-Contains "Full limitations are inside Details" $rowRenderer '["Full limitations", item.conciseLimitation]'
Require-Contains "Difference lists are inside Details" $rowRenderer '["Differences", item.knownDifferences]'
Require-NotContains "Rendered row does not use old amount grid" $rowRenderer "price-found-amounts"
Require-NotContains "Rendered row does not use old visible meta grid" $rowRenderer "price-found-visible-meta"
Require-Contains "Retailer line has readable contrast" $styles "#10231f"
Require-Contains "Quantity line has readable contrast" $styles ".price-found-meta-line"
Require-Contains "Row background is readable white" $styles "background: #ffffff;"
Require-Contains "Retailer attribution helper remains intact" $api "function deriveRetailerAttribution"
Require-Contains "Retailer unknown behavior remains intact" $api "Retailer not identified"
Require-Contains "Decision eligibility remains intact" $api "retailPriceDecisionEligibility"
Require-Contains "Mock keeps exact entered price precision" $mock '$5.50'

Require-Order "Quantity follows the lead line in the renderer" $rowRenderer "source.textContent" "const quantityParts"
Require-Order "Address is rendered after quantity" $rowRenderer "const quantityParts" "address.textContent"
Require-Order "Details appear before row append" $rowRenderer 'details.append(summary, detailList);' "card.append("

if ($failed.Count -gt 0) {
  Write-Error ("Compact where-to-buy list static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Compact where-to-buy list static checks OK - presentation contract verified."
