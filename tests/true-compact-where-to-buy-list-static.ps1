param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$presentation = Get-Content (Join-Path $Root "public/customer-evidence.js") -Raw
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

$listRenderer = Function-Block $app "function renderCustomerEvidence" "function renderCustomerEvidenceCard"
$rowRenderer = Function-Block $app "function renderCustomerEvidenceCard" "function appendDefinitionRow"
$consumerRenderer = Function-Block $app "function renderConsumerCompactSummary(report, workflow)" "function appendConsumerCompactSection"
$currentRetailBlock = Function-Block $consumerRenderer "if (isCurrentRetailOnlyReport(report)) {" 'appendConsumerCompactSection(details, "Evidence Summary"'
$stylesBlock = Function-Block $styles ".prices-found-block" ".ask-panel"
$primaryRetailBlock = Function-Block $currentRetailBlock 'appendConsumerCompactSection(details, "Current Retail Price Assessment"' "appendConsumerPriceAnalysisDisclosure"

if (-not $listRenderer) { $failed += "Could not isolate renderCustomerEvidence" }
if (-not $rowRenderer) { $failed += "Could not isolate renderCustomerEvidenceCard" }
if (-not $currentRetailBlock) { $failed += "Could not isolate current-retail compact summary block" }
if (-not $stylesBlock) { $failed += "Could not isolate price-list styles" }

Require-Contains "Multiple canonical rows render in one list" $listRenderer "viewModel.cards.forEach((card) => list.appendChild(renderCustomerEvidenceCard(card)));"
Require-Contains "One semantic list container is used" $listRenderer 'const list = document.createElement("ul");'
Require-Contains "Rows are list items" $rowRenderer 'const card = document.createElement("li");'
Require-Contains "Canonical badge is rendered without frontend selection" $rowRenderer "badge.textContent = item.cardBadge.label;"
Require-NotContains "Frontend does not assign Best price by position" $rowRenderer 'badge.textContent = "Best price";'
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
Require-Contains "Address is only rendered when a canonical address field is supported" $rowRenderer '["Address", supportedAddress]'
Require-Contains "Details are created collapsed by default" $rowRenderer 'const details = document.createElement("details");'
Require-NotContains "Details are not opened by default" $rowRenderer ".open = true"
Require-Contains "Verbose package analysis moves into Price analysis" $app "function appendConsumerPriceAnalysisDisclosure"
Require-Contains "Price analysis is collapsed by default" $app 'disclosure.className = "consumer-price-analysis technical-details-disclosure";'
Require-NotContains "Package analysis is absent from the primary current-retail report" $primaryRetailBlock "Package and Unit Price Comparison"
Require-NotContains "Local availability analysis is absent from the primary current-retail report" $primaryRetailBlock "Local Availability Context"
Require-Contains "Copy Summary uses compact consumer formatter" $app "function formatConsumerCompactSummaryText"
Require-Contains "Copied output uses canonical Where to Buy rows" $app "function formatCustomerEvidenceListText"
Require-Contains "Presentation preserves canonical card order without a frontend cap" $presentation "cards: customerEvidence.map(buildCard)"

Require-Order "Report answers price before canonical where-to-buy evidence" $currentRetailBlock "Retail Purchase Decision" "renderCanonicalCustomerEvidenceSection(report)"
Require-Order "Canonical where-to-buy evidence precedes buyer action" $currentRetailBlock "renderCanonicalCustomerEvidenceSection(report)" "Next Best Action"
Require-Order "Verbose analysis follows buyer action" $currentRetailBlock "Next Best Action" "appendConsumerPriceAnalysisDisclosure"

if ($failed.Count -gt 0) {
  Write-Error ("True compact Where to Buy list static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "True compact Where to Buy list static checks OK - mobile list contract verified."
