param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$checks = @(
  @{ Name = "API has item identification evidence bucket"; Text = $api; Pattern = "itemIdentificationEvidence" },
  @{ Name = "API labels no-price exact identity reference"; Text = $api; Pattern = "Exact identity reference - no usable price" },
  @{ Name = "API requires strong comparable visible price"; Text = $api; Pattern = "function isStrongComparableEvidenceRecord" },
  @{ Name = "API detects no-price identity reference"; Text = $api; Pattern = "function isNoPriceIdentityReference" },
  @{ Name = "API excludes no-price records from valuation influence"; Text = $api; Pattern = "canSupportPreliminaryAskingRangeFromVisibleRecord(record)" },
  @{ Name = "API reports no compatible prices"; Text = $api; Pattern = "No compatible source-backed prices were found." },
  @{ Name = "API has recovery query builder"; Text = $api; Pattern = "function buildSerperRecoverySearchQueries" },
  @{ Name = "API has separate marketplace site query builder"; Text = $api; Pattern = "function buildSerperSingleMarketplaceQuery" },
  @{ Name = "API records marketplace recovery pass"; Text = $api; Pattern = "marketplace_domain_recovery" },
  @{ Name = "API records price-oriented recovery pass"; Text = $api; Pattern = "price_oriented_recovery" },
  @{ Name = "API records shopping/general recovery pass"; Text = $api; Pattern = "shopping_general_recovery" },
  @{ Name = "API exposes compatible priced recovery threshold"; Text = $api; Pattern = "compatiblePricedRecoveryThreshold" },
  @{ Name = "API exposes recovery search passes attempted"; Text = $api; Pattern = "recoverySearchPassesAttempted" },
  @{ Name = "Frontend has compact consumer summary"; Text = $app; Pattern = "function renderConsumerCompactSummary" },
  @{ Name = "Frontend has collapsed customer technical details"; Text = $app; Pattern = "function renderCustomerTechnicalSearchDetails" },
  @{ Name = "Frontend technical details include item identification evidence"; Text = $app; Pattern = '["Item Identification Evidence", report.itemIdentificationEvidence]' },
  @{ Name = "Frontend source links use short labels"; Text = $app; Pattern = 'link.textContent = "Open source";' },
  @{ Name = "Frontend styles technical report sections"; Text = $styles; Pattern = ".technical-report-section" },
  @{ Name = "Frontend styles compact consumer sections"; Text = $styles; Pattern = ".consumer-compact-section" },
  @{ Name = "Mock test covers no-price WorthPoint exact match"; Text = $mock; Pattern = "No-price WorthPoint exact matches must not be Strong Comparables." },
  @{ Name = "Mock test covers recovery query passes"; Text = $mock; Pattern = "Recovery query passes should be available" },
  @{ Name = "Mock test covers separate marketplace site searches"; Text = $mock; Pattern = "separate marketplace-domain site searches" },
  @{ Name = "Mock test covers zero priced identity range exclusion"; Text = $mock; Pattern = "No-price identity evidence must not support Preliminary Asking-Price Range." }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($app -match 'link\.textContent\s*=\s*item\.url') {
  $failed += "Frontend must not render full raw URLs as link body text"
}

$consumerPathMatch = [regex]::Match($app, "if \(isConsumerReport\(report\)\) \{(?<body>[\s\S]*?)\n  \}")
if (-not $consumerPathMatch.Success) {
  $failed += "Consumer report path should be inspectable"
} elseif ($consumerPathMatch.Groups["body"].Value -match "renderResearchEvidencePanel|renderAppraiserSummary|renderReportGroup") {
  $failed += "Consumer report path must not append expanded research/appraiser cards"
}

if ($failed.Count -gt 0) {
  Write-Error ("Technical evidence containment static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Technical evidence containment static checks OK - $($checks.Count) checks passed."
