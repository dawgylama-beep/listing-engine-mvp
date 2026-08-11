param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$decisions = Get-Content (Join-Path $Root "lib/evidence/decisions.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$offerTest = Get-Content (Join-Path $Root "tests/canonical-buyer-offer.test.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.29"; Text = $index; Pattern = "Version 1.12.29" },
  @{ Name = "Package version is 1.12.29"; Text = $package; Pattern = '"version": "1.12.29"' },
  @{ Name = "Server version is 1.12.29"; Text = $server; Pattern = '$AppVersion = "1.12.29"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "API has non-transactional content gate"; Text = $api; Pattern = "function isNonTransactionalContentRecord" },
  @{ Name = "API has bulk lot unit-price gate"; Text = $api; Pattern = "function isBulkLotReferenceWithoutUnitPrice" },
  @{ Name = "API has explicit sold transaction proof gate"; Text = $api; Pattern = "function hasExplicitSoldTransactionProof" },
  @{ Name = "API blocks social/editorial sources"; Text = $api; Pattern = "function isSocialOrEditorialSourceRecord" },
  @{ Name = "API recognizes Facebook Marketplace separately"; Text = $api; Pattern = "function isFacebookMarketplaceRecord" },
  @{ Name = "API labels bulk/lot reference"; Text = $api; Pattern = 'return "Bulk/Lot Reference";' },
  @{ Name = "API labels non-transactional reference"; Text = $api; Pattern = 'return "Non-Transactional Reference";' },
  @{ Name = "API excludes non-transactional records from Prices Found"; Text = $api; Pattern = "isBulkLotReferenceWithoutUnitPrice(record) || isNonTransactionalContentRecord(record)" },
  @{ Name = "API requires explicit proof for verified sold"; Text = $api; Pattern = "if (!hasExplicitSoldTransactionProof(record))" },
  @{ Name = "API builds current purchase option summary"; Text = $api; Pattern = "function buildCurrentPurchaseOptionSummary" },
  @{ Name = "API limits best compatible price to current purchasable records"; Text = $api; Pattern = "function isCurrentPurchasablePriceFoundRecord" },
  @{ Name = "API delivered-cost summary uses only known delivered costs"; Text = $api; Pattern = "const knownDelivered = currentOptions.filter((item) => Number.isFinite(item.deliveredCostAmount));" },
  @{ Name = "API delivered-cost summary keeps historical evidence out of current deals"; Text = $api; Pattern = "Historical sold and reference prices are not treated as current best deals." },
  @{ Name = "Canonical one-observation rule prevents market validation"; Text = $decisions; Pattern = "one_observed_price_is_not_market_value" },
  @{ Name = "Canonical weak-price summary does not claim market validation"; Text = $decisions; Pattern = "pricing evidence is insufficient for a market-supported purchase recommendation" },
  @{ Name = "Frontend includes current purchase option section"; Text = $app; Pattern = '["currentPurchaseOptionSummary", "Current Purchase Option Summary"]' },
  @{ Name = "Frontend compact summary shows current option summary"; Text = $app; Pattern = 'appendConsumerCompactSection(details, "Current Purchase Option Summary", report.currentPurchaseOptionSummary)' },
  @{ Name = "Mock covers Facebook thrift-haul bulk failure"; Text = $mock; Pattern = 'I FOUND 14 vintage Coca-Cola trays at the thrift for $4.99' },
  @{ Name = "Mock covers no verified sold count for social bulk"; Text = $mock; Pattern = "must not drive any price range or verified sold counts" },
  @{ Name = "Mock covers Marketplace sold exception"; Text = $mock; Pattern = "Facebook Marketplace can qualify only when marketplace context and explicit sold/completed status are present." },
  @{ Name = "Mock covers historical sold is not a current delivered-cost option"; Text = $mock; Pattern = "Historical sold-only evidence should explain that no current confirmed delivered-cost option was found." },
  @{ Name = "Canonical test covers no-priced insufficiency"; Text = $offerTest; Pattern = "no priced evidence keeps identity support separate and produces explicit insufficiency" },
  @{ Name = "Canonical test covers rejected-evidence firewall"; Text = $offerTest; Pattern = "rejected and diagnostic-only evidence cannot influence canonical buyer guidance" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($app -match "SERPER_API_KEY|google\.serper\.dev|X-API-KEY") {
  $failed += "Frontend must not contain Serper key, endpoint, or auth header"
}

if ($api -match "georgia-coca-cola-bottle|georgia-coca-cola-tray|HOW 'BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS|I FOUND 14 vintage Coca-Cola trays") {
  $failed += "Production API must not contain fixture-specific hardcoding"
}

if ($failed.Count -gt 0) {
  Write-Error ("Transaction evidence firewall static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Transaction evidence firewall static checks OK - $($checks.Count) checks passed."
