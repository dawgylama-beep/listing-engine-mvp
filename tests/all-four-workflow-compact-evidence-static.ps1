param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw

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

function Require-Count($Name, $Text, $Pattern, $Expected) {
  $count = ([regex]::Matches($Text, [regex]::Escape($Pattern))).Count
  if ($count -ne $Expected) {
    $script:failed += "$Name (expected $Expected, found $count)"
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

$listingSections = Function-Block $app "const listingSections = [" "const valuationSections = ["
$valuationSections = Function-Block $app "const valuationSections = [" "const ownerValueSections ="
$ownerSections = Function-Block $app "const ownerValueSections =" "const consumerSections = ["
$consumerSummary = Function-Block $app "function renderConsumerCompactSummary" "function appendConsumerCompactSection"
$unifiedList = Function-Block $app "function buildUnifiedCustomerEvidenceList" "function getPriceFoundDedupeKey"
$dedupeKey = Function-Block $app "function getPriceFoundDedupeKey" "function appendConsumerCompactSection"
$renderReport = Function-Block $app "function renderReport" "function buildSectionCards"
$buildSectionCards = Function-Block $app "function buildSectionCards" "function hasResearchVisibility"
$sectionCard = Function-Block $app "function renderSectionCard" "function renderReportGroup"
$pricesRenderer = Function-Block $app "function renderPricesFound" "function isPriceFoundBestBadgeEligible"
$bestBadgeGate = Function-Block $app "function isPriceFoundBestBadgeEligible" "function renderPriceFoundCard"
$rowRenderer = Function-Block $app "function renderPriceFoundCard" "function formatPriceFoundQuantity"
$textFormatter = Function-Block $app "function formatPricesFoundListText" "function formatPriceFoundRecordText"
$recordTextFormatter = Function-Block $app "function formatPriceFoundRecordText" "function formatResearchRecordText"
$compactCopyFormatter = Function-Block $app "function formatConsumerCompactSummaryText" "function hasVisualRecognition"
$reportCopyFormatter = Function-Block $app "function formatReport" "function formatResearchEvidence"
$copySectionFilter = Function-Block $app "function getReportCopySections" "function formatResearchEvidence"

if (-not $listingSections) { $failed += "Could not isolate listingSections" }
if (-not $valuationSections) { $failed += "Could not isolate valuationSections" }
if (-not $consumerSummary) { $failed += "Could not isolate renderConsumerCompactSummary" }
if (-not $renderReport) { $failed += "Could not isolate renderReport" }
if (-not $sectionCard) { $failed += "Could not isolate renderSectionCard" }
if (-not $pricesRenderer) { $failed += "Could not isolate renderPricesFound" }
if (-not $rowRenderer) { $failed += "Could not isolate renderPriceFoundCard" }
if (-not $compactCopyFormatter) { $failed += "Could not isolate formatConsumerCompactSummaryText" }
if (-not $reportCopyFormatter) { $failed += "Could not isolate formatReport" }
if (-not $copySectionFilter) { $failed += "Could not isolate getReportCopySections" }

Require-Contains "Buying for Myself workflow exists" $app 'workflow: "personal_use"'
Require-Contains "Buying to Resell workflow exists" $app 'workflow: "resale"'
Require-Contains "Value Something I Own workflow exists" $app 'workflow: "market_value"'
Require-Contains "Sell Something I Own workflow exists" $app 'workflow: "listing"'
Require-Contains "Buying for Myself title exists" $app 'title: "Buying for Myself"'
Require-Contains "Buying to Resell title exists" $app 'title: "Buying to Resell"'
Require-Contains "Value Something I Own title exists" $app 'title: "Value Something I Own"'
Require-Contains "Sell Something I Own title exists" $app 'title: "Sell Something I Own"'

Require-Contains "Personal-use reports use compact consumer summary" $renderReport "renderConsumerCompactSummary(report, currentWorkflow)"
Require-Contains "Resale and owner reports include compact price evidence section" $valuationSections '["pricesFound", "Prices Found"]'
Require-Contains "Seller listing reports include compact price evidence section" $listingSections '["pricesFound", "Prices Found"]'
Require-Contains "Owner workflow derives from valuation sections" $ownerSections "valuationSections.map"
Require-Contains "Section card routes Prices Found through shared renderer" $sectionCard 'key === "pricesFound"'
Require-Contains "Shared renderer is used for Prices Found section cards" $sectionCard "renderPricesFound(value)"
Require-Contains "Compact renderer uses one list container" $pricesRenderer 'const list = document.createElement("ul");'
Require-Contains "Compact renderer uses compact list class" $pricesRenderer 'list.className = "prices-found-list compact-price-list";'
Require-Contains "Compact row class is shared" $rowRenderer 'card.className = "price-found-row";'

Require-Contains "Personal-use compact summary unifies best, prices, and other evidence" $consumerSummary "buildUnifiedCustomerEvidenceList(report)"
Require-Contains "Unified list reads best compatible evidence" $unifiedList "add(report.bestCompatiblePriceFound);"
Require-Contains "Unified list reads Prices Found evidence" $unifiedList "normalizeArray(report.pricesFound).forEach(add);"
Require-Contains "Unified list reads other compatible evidence" $unifiedList "normalizeArray(report.otherCompatiblePricesFound).forEach(add);"
Require-Contains "Unified list dedupes by stable record key" $unifiedList "const byRecord = new Map();"
Require-Contains "Dedupe key prefers destination URL" $dedupeKey "item.destinationUrl"
Require-Contains "Dedupe key strips query strings" $dedupeKey '.replace(/[?#].*$/, "").toLowerCase()'
Require-Contains "buildSectionCards prevents duplicate section keys" $buildSectionCards "const seen = new Set();"
Require-Contains "buildSectionCards skips repeated keys" $buildSectionCards "seen.has(key)"
Require-Count "Listing Prices Found section occurs once" $listingSections '["pricesFound", "Prices Found"]' 1
Require-Count "Valuation Prices Found section occurs once" $valuationSections '["pricesFound", "Prices Found"]' 1

Require-NotContains "Personal compact summary does not render best compatible as a separate visible card" $consumerSummary "renderPricesFound(report.bestCompatiblePriceFound"
Require-NotContains "Personal compact summary does not render other compatible as a separate visible card" $consumerSummary "renderPricesFound(report.otherCompatiblePricesFound"
Require-NotContains "Personal compact summary does not create Best Compatible visible heading" $consumerSummary 'Best Compatible Price Found'
Require-NotContains "Personal compact summary does not create Other Compatible visible heading" $consumerSummary 'Other Compatible Prices Found'

Require-Contains "Source link is attached to the evidence row" $rowRenderer "link.href = actionUrl;"
Require-Contains "Destination action uses directions or source URL" $rowRenderer "const actionUrl = directionsUrl || item.url;"
Require-Contains "Action label uses retailer-aware helper" $rowRenderer "getPriceFoundActionLabel(item"
Require-Contains "Copied compact list uses same record formatter" $textFormatter "formatPriceFoundRecordText(item"
Require-Contains "Copied compact list uses same best-price eligibility gate" $textFormatter "isPriceFoundBestBadgeEligible(item)"
Require-Contains "Copied row includes compact action and Details" $recordTextFormatter 'Details'
Require-Contains "Personal non-retail summary copy uses unified evidence list" $compactCopyFormatter "buildUnifiedCustomerEvidenceList(report)"
Require-Contains "Personal non-retail summary copy formats compact prices" $compactCopyFormatter "formatPricesFoundListText(pricesFound)"
Require-Contains "Copy All filters duplicate best compatible price key" $copySectionFilter '"bestCompatiblePriceFound"'
Require-Contains "Copy All filters duplicate other compatible price key" $copySectionFilter '"otherCompatiblePricesFound"'
Require-Contains "Copy All filters duplicate best current retail price key" $copySectionFilter '"bestCurrentRetailAlternative"'
Require-Contains "Copy All filters duplicate other current retail price key" $copySectionFilter '"otherCurrentRetailPrices"'
Require-Contains "Copy All uses unified customer evidence for Prices Found" $reportCopyFormatter "buildUnifiedCustomerEvidenceList(report)"

Require-Contains "Price type labels use shared formatter" $app "function formatSecondaryMarketPriceType"
Require-Contains "Match label helper remains available" $app "function getPriceFoundMatchLabel"
Require-Contains "Exact item label remains available" $app "Exact item"
Require-Contains "Related item non-pricing label remains available" $app "Related item - not used for pricing"
Require-Contains "Details stay subordinate in each row" $rowRenderer 'details.className = "price-found-details";'
Require-Contains "Details are appended inside the action row" $rowRenderer "actionRow.appendChild(details);"
Require-Order "Visible row fields precede Details/action row" $rowRenderer "source.textContent" "actionRow.appendChild(details);"

Require-Contains "Search-provider names cannot receive Best price badge" $bestBadgeGate "Serper Google Search"
Require-Contains "Google result URLs cannot receive Best price badge" $bestBadgeGate "google\.com"
Require-Contains "Decision-ineligible rows cannot receive Best price badge" $bestBadgeGate "item.retailPriceDecisionEligibility === false"
Require-Contains "Reference or auction rows cannot receive Best price badge" $bestBadgeGate "Reference|Auction|Estimate|Closed Unsold|Price Unavailable|Verified Sold"
Require-Contains "Best badge requires meaningful match text" $bestBadgeGate "Exact|Strong|Current Retail|Compatible"
Require-Contains "Visible renderer applies Best price eligibility" $pricesRenderer "isPriceFoundBestBadgeEligible(item)"

Require-Contains "Compact row has readable primary text style" $styles ".price-found-source"
Require-Contains "Readable primary color is dark" $styles "color: #10231f;"
Require-Contains "Readable row background remains white" $styles "background: #ffffff;"
Require-Contains "Compact product titles remain constrained" $styles "-webkit-line-clamp: 2;"

if ($failed.Count -gt 0) {
  Write-Error ("All-four workflow compact evidence static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "All-four workflow compact evidence static checks OK - shared compact renderer contract verified."
