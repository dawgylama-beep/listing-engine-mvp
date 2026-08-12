param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$model = Get-Content (Join-Path $Root "public/customer-evidence.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
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

function Require-Regex($Name, $Text, $Pattern) {
  if ($Text -notmatch $Pattern) {
    $script:failed += $Name
  }
}

foreach ($workflow in @(
  'workflow: "personal_use"',
  'workflow: "resale"',
  'workflow: "market_value"',
  'workflow: "listing"'
)) {
  Require-Contains "Workflow remains available: $workflow" $app $workflow
}
foreach ($title in @(
  'title: "Buying for Myself"',
  'title: "Buying to Resell"',
  'It Worth?"',
  'title: "Create a Listing"'
)) {
  Require-Contains "Workflow title remains available: $title" $app $title
}

Require-Regex "Canonical browser model loads before app.js" $index '<script src="/customer-evidence\.js\?v=1\.12\.32"></script>\s*<script src="/app\.js\?v=1\.12\.32"></script>'
Require-Contains "One pure presentation-model authority exists" $model "function buildCustomerEvidenceViewModel"
Require-Contains "Presentation model consumes displayed IDs" $model "customerEvidenceSummary.displayedIds"
Require-Contains "Presentation model preserves canonical order" $model "cards: customerEvidence.map(buildCard)"
Require-Contains "Presentation model fails closed" $model 'status: "evidence_unavailable"'
Require-Contains "App passes only canonical evidence inputs" $app "return builder(report.customerEvidence, report.customerEvidenceSummary);"
Require-Contains "Shared renderer consumes view-model cards" $app "viewModel.cards.forEach((card) => list.appendChild(renderCustomerEvidenceCard(card)));"
Require-Contains "Compact renderer uses one list" $app 'list.className = "prices-found-list compact-price-list";'
Require-Contains "Compact row class remains shared" $app 'card.className = `price-found-row match-${matchModifier}`;'
Require-Contains "Rendered row preserves canonical evidence ID" $app "card.dataset.evidenceId = item.evidenceId;"
Require-Contains "Rendered row uses canonical source label" $app "source.textContent = item.sourceLabel;"
Require-Contains "Rendered row uses canonical customer price" $app "priceValue.textContent = item.customerPriceLabel;"
Require-Contains "Rendered row uses canonical match label" $app "item.canonicalMatchLabel"
Require-Contains "Rendered row uses canonical price type" $app "item.canonicalPriceType"
Require-Contains "Source link uses canonical destination URL" $app "link.href = item.destinationUrl;"
Require-Contains "Canonical card badge is rendered when present" $app "if (item.cardBadge)"
Require-Contains "Canonical badge code is preserved" $app "badge.dataset.badgeCode = item.cardBadge.code;"
Require-Contains "Copy text uses canonical model" $app "function formatCustomerEvidenceListText"
Require-Contains "Details stay subordinate in each row" $app 'details.className = "price-found-details";'
Require-Contains "All-purpose renderer uses canonical evidence section" $app "function renderCanonicalCustomerEvidenceSection"
Require-Contains "All-purpose copy uses canonical evidence model" $app "const evidenceViewModel = getCustomerEvidenceViewModel(report);"

foreach ($forbidden in @(
  "buildUnifiedCustomerEvidenceList",
  "getPriceFoundDedupeKey",
  "isPriceFoundBestBadgeEligible",
  "getCompactPriceFoundMatchLabel",
  "isSecondaryMarketPriceFoundItem"
)) {
  Require-NotContains "Superseded frontend authority is deleted: $forbidden" $app $forbidden
}
Require-NotContains "Frontend does not reconstruct from pricesFound" $app "report.pricesFound"
Require-NotContains "Frontend does not reconstruct from bestCompatiblePriceFound" $app "report.bestCompatiblePriceFound"
foreach ($removedAlias in @(
  "bestCompatiblePriceFound",
  "otherCompatiblePricesFound",
  "bestCurrentRetailAlternative",
  "otherCurrentRetailPrices"
)) {
  Require-NotContains "Removed alias is absent from frontend: $removedAlias" $app $removedAlias
}
Require-NotContains "Frontend does not assign Best price" $app 'badge.textContent = "Best price"'
Require-NotContains "Frontend does not badge the first record" $app "index === 0"

Require-Contains "Compact row has readable primary text style" $styles ".price-found-source"
Require-Contains "Readable primary color remains dark" $styles "color: #10231f;"
Require-Contains "Readable row background remains white" $styles "background: #ffffff;"
Require-Contains "Compact product titles remain constrained" $styles "-webkit-line-clamp: 2;"

if ($failed.Count -gt 0) {
  Write-Error ("All-four workflow canonical compact evidence static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "All-four workflow compact evidence static checks OK - canonical presentation contract verified."
