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

function Require-Order($Name, $Text, $First, $Second) {
  $firstIndex = $Text.IndexOf($First)
  $secondIndex = $Text.IndexOf($Second)
  if ($firstIndex -lt 0 -or $secondIndex -lt 0 -or $firstIndex -ge $secondIndex) {
    $script:failed += $Name
  }
}

$renderStart = $app.IndexOf("function renderPriceFoundCard")
$renderEnd = $app.IndexOf("function appendDefinitionRow", $renderStart)
if ($renderStart -lt 0 -or $renderEnd -lt 0) {
  $failed += "Could not isolate renderPriceFoundCard"
  $renderer = ""
} else {
  $renderer = $app.Substring($renderStart, $renderEnd - $renderStart)
}

Require-Contains "Found-at retailer and price share one lead line" $renderer 'source.textContent = `Found at ${retailerUnknown ? "Retailer not identified" : retailerName} — ${priceText}`;'
Require-Contains "Quantity is rendered as its own immediate customer line" $renderer 'quantity.textContent = `Quantity: ${formatPriceFoundQuantity(item)}`;'
Require-Contains "Unknown quantity is explicit" $app 'return "Not shown";'
Require-Contains "Numeric quantity becomes count wording" $app 'return `${cleaned} count`;'
Require-Contains "Unit price appears only when supported" $renderer '...(item.unitPrice ? [unitPrice] : [])'
Require-Contains "Nearby address is supported without making it the lead" $renderer 'address.textContent = addressText ? `Nearby address: ${addressText}` : "";'
Require-Contains "Availability is check-with-location wording" $renderer 'checkNote.textContent = "Check with this location for price and availability.";'
Require-Contains "Known retailer action is preserved" $renderer 'View at ${retailerName}'
Require-Contains "Directions action is supported" $renderer 'Get Directions'
Require-Contains "Unknown retailer action says View Listing" $renderer 'View Listing'
Require-Contains "Action is appended last" $renderer "card.append(...defaultNodes, link);"
Require-Contains "Details remain collapsed per card" $renderer 'details.className = "price-found-details";'
Require-Contains "Compatibility analysis is inside Details" $renderer '["Compatibility analysis", item.priceContextSummary]'
Require-Contains "Evidence tier is inside Details" $renderer '["Evidence tier", item.retailEvidenceTierLabel || item.retailEvidenceTier || item.priceTypeLabel]'
Require-Contains "Shipping explanation is inside Details" $renderer '["Shipping note", item.shippingDisclosure]'
Require-Contains "Confidence reasoning is inside Details" $renderer '["Confidence reasoning", normalizeDisplayValue(item.confidenceDowngradeReasons)]'
Require-Contains "Full limitations are inside Details" $renderer '["Full limitations", item.conciseLimitation]'
Require-Contains "Difference lists are inside Details" $renderer '["Differences", item.knownDifferences]'
Require-Contains "Rendered card does not append old amount grid" $renderer "card.append(...defaultNodes"
Require-Contains "Retailer line has readable contrast" $styles "#10231f"
Require-Contains "Quantity line has readable contrast" $styles ".price-found-quantity"
Require-Contains "Check note has readable contrast" $styles ".price-found-check-note"
Require-Contains "Retailer attribution helper remains intact" $api "function deriveRetailerAttribution"
Require-Contains "Retailer unknown behavior remains intact" $api "Retailer not identified"
Require-Contains "Decision eligibility remains intact" $api "retailPriceDecisionEligibility"
Require-Contains "Mock keeps exact entered price precision" $mock '$5.50'

Require-Order "Quantity follows the found-at line in the renderer" $renderer "source.textContent" "quantity.textContent"
Require-Order "Address is rendered after quantity" $renderer "quantity.textContent" "address.textContent"
Require-Order "Check note is rendered after address support" $renderer "address.textContent" "checkNote.textContent"
Require-Order "Details appear before the action append" $renderer 'details.append(summary, detailList);' "card.append(...defaultNodes, link);"

if ($failed.Count -gt 0) {
  Write-Error ("Compact where-to-buy card static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Compact where-to-buy card static checks OK - presentation contract verified."
