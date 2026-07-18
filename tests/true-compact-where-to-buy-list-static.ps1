param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

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

$listRenderer = Function-Block $app "function renderPricesFound" "function renderPriceFoundCard"
$rowRenderer = Function-Block $app "function renderPriceFoundCard" "function formatPriceFoundQuantity"
$consumerRenderer = Function-Block $app "function renderConsumerCompactSummary(report, workflow)" "function buildUnifiedCustomerEvidenceList"
$currentRetailBlock = Function-Block $consumerRenderer "if (isCurrentRetailOnlyReport(report)) {" 'appendConsumerCompactSection(details, "Evidence Summary"'
$stylesBlock = Function-Block $styles ".prices-found-block" ".ask-panel"
$primaryRetailBlock = Function-Block $currentRetailBlock 'appendConsumerCompactSection(details, "Current Retail Price Assessment"' "appendConsumerPriceAnalysisDisclosure"

if (-not $listRenderer) { $failed += "Could not isolate renderPricesFound" }
if (-not $rowRenderer) { $failed += "Could not isolate renderPriceFoundCard" }
if (-not $currentRetailBlock) { $failed += "Could not isolate current-retail compact summary block" }
if (-not $stylesBlock) { $failed += "Could not isolate price-list styles" }

Require-Contains "Multiple compact rows render in one list" $listRenderer "records.forEach((item, index) => {"
Require-Contains "One semantic list container is used" $listRenderer 'const list = document.createElement("ul");'
Require-Contains "Rows are list items" $rowRenderer 'const card = document.createElement("li");'
Require-Contains "Best price is a small badge" $rowRenderer 'badge.textContent = "Best price";'
Require-NotContains "Current retail does not render Best Current Retail card container" $currentRetailBlock "bestCurrentRetailAlternative"
Require-NotContains "Current retail does not render Other Current Retail card container" $currentRetailBlock "otherCurrentRetailPrices"
Require-NotContains "Price-list CSS does not keep old result card class" $stylesBlock ".price-found-card"
Require-NotContains "Price-list CSS does not keep old amount-grid layout" $stylesBlock ".price-found-amounts"
Require-NotContains "Price-list CSS does not keep old cream result background" $stylesBlock "#fffdf8"
Require-NotContains "Price-list CSS does not keep old gradient result background" $stylesBlock "linear-gradient"
Require-NotContains "Price-list CSS does not keep old card shadow" $stylesBlock "box-shadow"
Require-Contains "Readable row foreground is dark" $stylesBlock "color: #17211f;"
Require-Contains "Readable lead foreground is dark" $stylesBlock "color: #10231f;"
Require-Contains "Readable meta foreground is dark" $stylesBlock "color: #263a35;"
Require-Contains "Readable row background is white" $stylesBlock "background: #ffffff;"
Require-Contains "Amazon remains in the unified mock list" $mock "const amazonWhereToBuy"
Require-Contains "Target remains in the unified mock list" $mock "const targetWhereToBuy"
Require-Contains "Physical or nearby retailer remains in the unified mock list" $mock "const nearbyWhereToBuy"
Require-Contains "Mock proves online and nearby rows are one compact list" $mock "Nearby and online results should appear in one compact Where to Buy list."
Require-Contains "Address is only rendered when supported" $rowRenderer "...(addressText ? [address] : [])"
Require-Contains "Details are created collapsed by default" $rowRenderer 'const details = document.createElement("details");'
Require-NotContains "Details are not opened by default" $rowRenderer ".open = true"
Require-Contains "Verbose package analysis moves into Price analysis" $app "function appendConsumerPriceAnalysisDisclosure"
Require-Contains "Price analysis is collapsed by default" $app 'disclosure.className = "consumer-price-analysis technical-details-disclosure";'
Require-NotContains "Package analysis is absent from the primary current-retail report" $primaryRetailBlock "Package and Unit Price Comparison"
Require-NotContains "Local availability analysis is absent from the primary current-retail report" $primaryRetailBlock "Local Availability Context"
Require-Contains "Copy Summary uses compact consumer formatter" $app "function formatConsumerCompactSummaryText"
Require-Contains "Copied output uses compact Where to Buy rows" $app "function formatPricesFoundListText"

Require-Order "Report answers price before where-to-buy" $currentRetailBlock "Retail Purchase Decision" "Where to Buy"
Require-Order "Report answers where-to-buy before buyer action" $currentRetailBlock "Where to Buy" "Next Best Action"
Require-Order "Verbose analysis follows buyer action" $currentRetailBlock "Next Best Action" "appendConsumerPriceAnalysisDisclosure"

if ($failed.Count -gt 0) {
  Write-Error ("True compact Where to Buy list static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "True compact Where to Buy list static checks OK - mobile list contract verified."
