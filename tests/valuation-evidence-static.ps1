param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$apiPath = Join-Path $Root "api/generate-listing.js"
$appPath = Join-Path $Root "public/app.js"
$indexPath = Join-Path $Root "public/index.html"
$packagePath = Join-Path $Root "package.json"
$roadmapPath = Join-Path $Root "PRODUCT_ROADMAP.md"

$api = Get-Content -LiteralPath $apiPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$index = Get-Content -LiteralPath $indexPath -Raw
$package = Get-Content -LiteralPath $packagePath -Raw
$roadmap = Get-Content -LiteralPath $roadmapPath -Raw

$checks = @(
  @{ Name = "API centralized classifier exists"; Text = $api; Pattern = "function classifyValuationEvidence" },
  @{ Name = "API applies evidence labels"; Text = $api; Pattern = "function applyValuationEvidenceLabels" },
  @{ Name = "API supported state exists"; Text = $api; Pattern = 'state: "supported"' },
  @{ Name = "API preliminary state exists"; Text = $api; Pattern = 'state: "preliminary"' },
  @{ Name = "API insufficient state exists"; Text = $api; Pattern = 'state: "insufficient"' },
  @{ Name = "API single observation state exists"; Text = $api; Pattern = 'state: "single_observation"' },
  @{ Name = "API current retail state exists"; Text = $api; Pattern = '"current_retail"' },
  @{ Name = "API retail unverified state exists"; Text = $api; Pattern = '"retail_unverified"' },
  @{ Name = "API preliminary reference warning exists"; Text = $api; Pattern = "This is not a verified fair-market-value estimate" },
  @{ Name = "API active listing language is cautious"; Text = $api; Pattern = "similar active listings" },
  @{ Name = "API formats plain asking prices as currency"; Text = $api; Pattern = "function formatMoneyInputText" },
  @{ Name = "API Ask preserves valuation evidence state"; Text = $api; Pattern = "Preserve the current report's valuationEvidenceState" },
  @{ Name = "Frontend preserves the canonical handler report"; Text = $app; Pattern = "const report = rawReport;" },
  @{ Name = "Frontend validates recognized backend states"; Text = $app; Pattern = "const recognizedStates = new Set" },
  @{ Name = "Frontend reads canonical state"; Text = $app; Pattern = "report.valuationEvidenceState" },
  @{ Name = "Frontend reads canonical label"; Text = $app; Pattern = "report.valuationEvidenceLabel" },
  @{ Name = "Frontend reads canonical explanation"; Text = $app; Pattern = "report.valuationEvidenceExplanation" },
  @{ Name = "Frontend selects explicit current asking range"; Text = $app; Pattern = "current_asking:" },
  @{ Name = "Frontend selects explicit preliminary range"; Text = $app; Pattern = "preliminary:" },
  @{ Name = "Frontend malformed contract is neutral"; Text = $app; Pattern = "Canonical valuation information is unavailable." },
  @{ Name = "Frontend shows Preliminary Reference Range"; Text = $app; Pattern = '["preliminaryReferenceRange", "Preliminary Reference Range"]' },
  @{ Name = "Frontend shows Fair Value Not Established"; Text = $app; Pattern = '["fairValueNotEstablished", "Fair Value Not Established"]' },
  @{ Name = "Frontend carries Ask context evidence state"; Text = $app; Pattern = '"valuationEvidenceState"' },
  @{ Name = "Frontend carries Ask context verified range"; Text = $app; Pattern = '"verifiedMarketRange"' },
  @{ Name = "Frontend carries Ask context current asking range"; Text = $app; Pattern = '"currentAskingPriceRange"' },
  @{ Name = "Frontend carries Ask context seller prices"; Text = $app; Pattern = '"recommendedListingPrice"' },
  @{ Name = "Frontend summary uses canonical valuation metrics"; Text = $app; Pattern = "...valuation.metrics" },
  @{ Name = "Visible app version is 1.12.1"; Text = $index; Pattern = "Version 1.12.1" },
  @{ Name = "Package version is 1.12.4"; Text = $package; Pattern = '"version": "1.12.4"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Roadmap documents 1.9.1"; Text = $roadmap; Pattern = "Version 1.9.1 (Completed)" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

$forbiddenChecks = @(
  @{ Name = "Old awkward live searched wording removed from API"; Text = $api; Pattern = "found in live searched listings" },
  @{ Name = "Old awkward live searched wording removed from frontend"; Text = $app; Pattern = "found in live searched listings" },
  @{ Name = "Frontend classifier definition removed"; Text = $app; Pattern = "function classifyValuationEvidenceForDisplay" },
  @{ Name = "Frontend normalizer definition removed"; Text = $app; Pattern = "function normalizeReportForEvidenceDisplay" },
  @{ Name = "Frontend zero-evidence guard definition removed"; Text = $app; Pattern = "function applyFrontendZeroEvidenceGuard" },
  @{ Name = "Frontend free-text range extraction removed"; Text = $app; Pattern = "function extractMoneyRangeText" },
  @{ Name = "Frontend one-price range reconstruction removed"; Text = $app; Pattern = "amounts.length === 1" },
  @{ Name = "Frontend legacy comparable support count removed"; Text = $app; Pattern = "countReferenceSupportingResearchResults" }
)

foreach ($check in $forbiddenChecks) {
  if ($check.Text -like "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

$displayMappingDefinitions = [regex]::Matches(
  $app,
  'function\s+[A-Za-z0-9_]*Valuation[A-Za-z0-9_]*Display[A-Za-z0-9_]*\s*\('
)
if ($displayMappingDefinitions.Count -ne 1) {
  $failed += "Frontend must contain exactly one valuation display mapping"
}

$displayMappingMatch = [regex]::Match(
  $app,
  '(?s)function\s+[A-Za-z0-9_]*Valuation[A-Za-z0-9_]*Display[A-Za-z0-9_]*\([^)]*\)\s*\{.*?\r?\n\}\r?\n\r?\nfunction countVisibleResearchResults'
)
if (-not $displayMappingMatch.Success) {
  $failed += "Unable to isolate the frontend valuation display mapping"
} else {
  $forbiddenMappingInputs = @(
    "strongComparables",
    "partialComparables",
    "referenceResults",
    "pricesFound",
    "customerEvidence",
    "expectedSalePrice",
    "suggestedListingPrice",
    "recommendation"
  )
  foreach ($inputName in $forbiddenMappingInputs) {
    if ([regex]::IsMatch($displayMappingMatch.Value, "\b$([regex]::Escape($inputName))\b")) {
      $failed += "Valuation display mapping must not infer from $inputName"
    }
  }
}

$mutableFieldPattern = @(
  "valuationEvidenceState",
  "valuationEvidenceLabel",
  "valuationEvidenceExplanation",
  "verifiedMarketRange",
  "currentAskingPriceRange",
  "preliminaryReferenceRange",
  "valueRating",
  "priceBasis",
  "priceRationale",
  "recommendedListingPrice",
  "suggestedListingPrice",
  "expectedSalePrice",
  "minimumAcceptablePrice",
  "recommendedOffer",
  "walkAwayPrice",
  "maximumRecommendedPrice"
) -join "|"
$frontendFieldAssignments = [regex]::Matches(
  $app,
  "(?m)\b(?:report|normalized|guarded)\.(?:$mutableFieldPattern)\s*=(?!=)"
)
if ($frontendFieldAssignments.Count -ne 0) {
  $failed += "Frontend must not assign canonical valuation or seller/listing fields"
}

if ([regex]::Matches($app, '\bpricesFound\b').Count -ne 0) {
  $failed += "Frontend pricesFound reads must remain zero"
}

if ($failed.Count -gt 0) {
  throw "Valuation evidence static checks failed: $($failed -join '; ')"
}

Write-Host "Valuation evidence static checks OK - $($checks.Count + $forbiddenChecks.Count + 4) checks passed."
