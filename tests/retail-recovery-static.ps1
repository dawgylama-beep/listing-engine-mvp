param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.32"; Text = $index; Pattern = "Version 1.12.32" },
  @{ Name = "Package version is 1.12.32"; Text = $package; Pattern = '"version": "1.12.32"' },
  @{ Name = "Server version is 1.12.32"; Text = $server; Pattern = '$AppVersion = "1.12.32"' },
  @{ Name = "Roadmap documents retail recovery"; Text = $roadmap; Pattern = "Retail evidence recovery now distinguishes" },
  @{ Name = "Exact retail match label exists"; Text = $api; Pattern = "Exact Retail Match" },
  @{ Name = "Strong retail alternative label exists"; Text = $api; Pattern = "Strong Retail Alternative" },
  @{ Name = "Unit-price comparable label exists"; Text = $api; Pattern = "Unit-Price Comparable" },
  @{ Name = "Retail category context label exists"; Text = $api; Pattern = "Retail Category Context" },
  @{ Name = "Rejected retail mismatch label exists"; Text = $api; Pattern = "Rejected Retail Mismatch" },
  @{ Name = "Nearby package count recovery is ratio based"; Text = $api; Pattern = "ratio <= 1.25" },
  @{ Name = "Retail Serper budget allocation exists"; Text = $api; Pattern = "const retailSerperBudgetAllocation = Object.freeze" },
  @{ Name = "Retail staged Serper planner exists"; Text = $api; Pattern = "function buildRetailSerperSearchPlan" },
  @{ Name = "Retail compatible alternative stage exists"; Text = $api; Pattern = "stage_3_compatible_alternatives" },
  @{ Name = "Retailer-specific recovery is domain constrained"; Text = $api; Pattern = "retail_domain_constrained_retailer_query" },
  @{ Name = "Local retail stage exists"; Text = $api; Pattern = "stage_6_local_retail" },
  @{ Name = "Shopping retail recovery uses dedicated label"; Text = $api; Pattern = "Stage 5 - Shopping retail recovery" },
  @{ Name = "Shopping unavailable status exists"; Text = $api; Pattern = "serper_shopping_unavailable" },
  @{ Name = "Canonical package quantity decision exists"; Text = $api; Pattern = "function buildCanonicalPackageQuantityDecision" },
  @{ Name = "Suspicious low package quantity is guarded"; Text = $api; Pattern = "Suspiciously low package quantity" },
  @{ Name = "Local no-execution customer sentence exists"; Text = $api; Pattern = "Location was provided, but no location-aware retail search was executed." },
  @{ Name = "Provider endpoint is tracked"; Text = $api; Pattern = "providerEndpoint" },
  @{ Name = "Returned result count is tracked"; Text = $api; Pattern = "returnedResultCount" },
  @{ Name = "Qualified result count is tracked"; Text = $api; Pattern = "qualifiedResultCount" },
  @{ Name = "Retail alternative query validation exists"; Text = $api; Pattern = "function hasCurrentRetailAlternativeQueryAnchor" },
  @{ Name = "Retail alternative source promotion exists"; Text = $api; Pattern = "function hasCurrentRetailAlternativeSourceSupport" },
  @{ Name = "Shopping offers normalize to active current offers"; Text = $api; Pattern = "Shopping Offer" },
  @{ Name = "Organic price extractor avoids shipping-only prices"; Text = $api; Pattern = "shipping|delivery|freight|pickup|save|savings|coupon|review|rating" },
  @{ Name = "Wide package-size mismatch still rejects"; Text = $api; Pattern = "Package count differs too much for retail price comparison" },
  @{ Name = "Category context is excluded from retail price decisions"; Text = $api; Pattern = 'packageCompatibility.label !== "Retail Category Context"' },
  @{ Name = "Compatible alternatives are customer-facing"; Text = $api; Pattern = "Compatible Current Retail Alternatives" },
  @{ Name = "Exact product disclaimer exists"; Text = $api; Pattern = "Compatible alternatives are not the same item" },
  @{ Name = "Package price language exists"; Text = $api; Pattern = "package price" },
  @{ Name = "Per-unit language exists"; Text = $api; Pattern = "per unit" },
  @{ Name = "Entered unit price language exists"; Text = $api; Pattern = 'Your price is ${askingText} for ${submittedQuantity}' },
  @{ Name = "Retail budget displayed in frontend diagnostics"; Text = $app; Pattern = "Retail Provider Call Budget" },
  @{ Name = "Retail stages displayed in frontend diagnostics"; Text = $app; Pattern = "Retail Stages Attempted" },
  @{ Name = "Endpoint/search type displayed in frontend diagnostics"; Text = $app; Pattern = "Endpoint/Search Type" },
  @{ Name = "Shopping status displayed in frontend diagnostics"; Text = $app; Pattern = "Shopping Execution Status" },
  @{ Name = "Location-aware status displayed in frontend diagnostics"; Text = $app; Pattern = "Location-Aware Retail Search Status" },
  @{ Name = "Retail compatibility counts displayed in frontend diagnostics"; Text = $app; Pattern = "Unit-Price Comparable Count" },
  @{ Name = "Unit formatter exists"; Text = $api; Pattern = "function formatUnitMoney" },
  @{ Name = "Exact UPC remains first priority"; Text = $api; Pattern = "queries.push(barcode);" },
  @{ Name = "Forbidden secondary evidence remains blocked"; Text = $api; Pattern = "function isRetailForbiddenSecondaryEvidenceText" },
  @{ Name = "Frontend can display unified Where to Buy prices"; Text = $app; Pattern = "Where to Buy" },
  @{ Name = "Frontend preserves canonical retail match label display"; Text = $app; Pattern = "item.canonicalMatchLabel" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$forbidden = @(
  @{ Name = "Old compatible alternative label should not remain in API taxonomy"; Text = $api; Pattern = 'label: "Compatible Alternative"' },
  @{ Name = "Old package-size difference label should not remain in API taxonomy"; Text = $api; Pattern = 'label: "Package-Size Difference"' },
  @{ Name = "Old strong retail match label should not remain in API taxonomy"; Text = $api; Pattern = 'label: "Strong Retail Match"' }
)

foreach ($check in $forbidden) {
  if ($check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Retail recovery static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Retail recovery static checks OK - $($checks.Count) checks passed."
