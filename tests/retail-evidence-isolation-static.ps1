param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$decisions = Get-Content (Join-Path $Root "lib/evidence/decisions.js") -Raw
$offer = Get-Content (Join-Path $Root "lib/evidence/offer.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.1"; Text = $index; Pattern = "Version 1.12.1" },
  @{ Name = "Package version is 1.12.9"; Text = $package; Pattern = '"version": "1.12.9"' },
  @{ Name = "Server version is 1.12.9"; Text = $server; Pattern = '$AppVersion = "1.12.9"' },
  @{ Name = "Roadmap documents Version 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Retail evidence mode helper exists"; Text = $api; Pattern = "function getRetailEvidenceMode" },
  @{ Name = "Ordinary retail classification exists"; Text = $api; Pattern = "Ordinary Current Retail Product" },
  @{ Name = "Current retail only mode exists"; Text = $api; Pattern = "current-retail-only" },
  @{ Name = "Retail forbidden secondary evidence detector exists"; Text = $api; Pattern = "function isRetailForbiddenSecondaryEvidenceText" },
  @{ Name = "Retail query secondary terms are stripped"; Text = $api; Pattern = "function stripRetailSecondaryMarketQueryTerms" },
  @{ Name = "Serper validation rejects forbidden retail terms"; Text = $api; Pattern = "retail_forbidden_secondary_market_terms" },
  @{ Name = "Retail current price profile exists"; Text = $api; Pattern = "function buildRetailEvidenceProfile" },
  @{ Name = "Retail decision firewall exists"; Text = $api; Pattern = "function applyCurrentRetailDecisionFirewall" },
  @{ Name = "Retail firewall clears preliminary range"; Text = $api; Pattern = 'preliminaryReferenceRange: ""' },
  @{ Name = "Canonical retail offer is comparison only"; Text = $offer; Pattern = '"retail_comparison_only"' },
  @{ Name = "Retail guidance projects from canonical offer"; Text = $api; Pattern = "negotiationGuidance: maximumPriceNote" },
  @{ Name = "Retail price limit not established exists"; Text = $api; Pattern = "Retail Price Limit: Not established" },
  @{ Name = "Current retail price not verified exists"; Text = $api; Pattern = "Current Retail Price: Not verified" },
  @{ Name = "Canonical price-not-verified decision remains insufficient"; Text = $decisions; Pattern = "canonical_pricing_support_insufficient" },
  @{ Name = "Retail assessment label exists"; Text = $api; Pattern = "Current Retail Price Assessment" },
  @{ Name = "No personal enjoyment retail path"; Text = $api; Pattern = "personal-enjoyment exception" },
  @{ Name = "Retail package compatibility helper exists"; Text = $api; Pattern = "function classifyRetailPackageCompatibility" },
  @{ Name = "Nearby package-count compatibility is ratio based"; Text = $api; Pattern = "ratio <= 1.25" },
  @{ Name = "Unit-price comparable label exists"; Text = $api; Pattern = "Unit-Price Comparable" },
  @{ Name = "Security versus plain mismatch exists"; Text = $api; Pattern = "Security-envelope evidence was not compatible with a non-security envelope result." },
  @{ Name = "Strip and seal versus gummed alternative exists"; Text = $api; Pattern = "Strip-and-seal and gummed closures may be compatible alternatives" },
  @{ Name = "Named store no source-backed price copy exists"; Text = $api; Pattern = "No source-backed" },
  @{ Name = "Manual ZIP denial phrase exists"; Text = $api; Pattern = "Location permission was not granted. ZIP" },
  @{ Name = "Try Location Again phrase exists"; Text = $api; Pattern = "Try Location Again" },
  @{ Name = "Retail diagnostics include evidence mode"; Text = $api; Pattern = "retailEvidenceMode" },
  @{ Name = "Retail diagnostics include accepted candidates"; Text = $api; Pattern = "currentRetailCandidatesAccepted" },
  @{ Name = "Retail diagnostics include rejected candidates"; Text = $api; Pattern = "currentRetailCandidatesRejected" },
  @{ Name = "Retail diagnostics include query suppression"; Text = $api; Pattern = "queriesSuppressed" },
  @{ Name = "Customer-facing retail summary exists"; Text = $app; Pattern = "Retail purchase decision" },
  @{ Name = "Retail report hides max guard"; Text = $app; Pattern = '"maximumRecommendedPriceExplanation"' },
  @{ Name = "Retail compact report uses current price assessment"; Text = $app; Pattern = "Current Retail Price Assessment" },
  @{ Name = "Retail compact report uses named store result"; Text = $app; Pattern = "Named Store Result" },
  @{ Name = "Retail compact report uses Where to Buy list"; Text = $app; Pattern = "Where to Buy" },
  @{ Name = "Retail price card uses canonical match label"; Text = $app; Pattern = '["Match", item.canonicalMatchLabel]' },
  @{ Name = "Technical details display retail evidence mode"; Text = $app; Pattern = '["Retail Evidence Mode", diagnostics.retailEvidenceMode]' }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$customerRetailFields = @(
  "retailPurchaseDecision",
  "askingStorePrice",
  "currentRetailPriceAssessment",
  "namedStoreResult",
  "packageUnitPriceComparison",
  "localAvailabilityContext",
  "retailPriceLimit"
)

foreach ($field in $customerRetailFields) {
  if ($app -notmatch [regex]::Escape($field)) {
    $failed += "Frontend must include $field"
  }
}

if ($api -notmatch "isCurrentRetailOnlyMode\(context\.retailEvidenceMode\).*isRetailForbiddenSecondaryEvidenceText" -and $api -notmatch "isCurrentRetailOnlyMode\(context\.retailEvidenceMode\).*retail_forbidden_secondary_market_terms") {
  $failed += "Current-retail-only mode must block sold/auction/reference query terms before provider execution"
}

if ($api -notmatch 'function applyCurrentRetailDecisionFirewall[\s\S]*?estimatedFairMarketValue: ""') {
  $failed += "Current retail reports must not expose Estimated Fair Market Value"
}

if ($api -notmatch "maximumRecommendedPrice && maximumPriceNote") {
  $failed += "Current retail reports must not serialize a Recommended Offer without canonical numerical guidance"
}

if ($api -notmatch "maximumRecommendedPriceExplanation: maximumPriceNote") {
  $failed += "Current retail maximum-price note must project from canonical comparison guidance"
}

if ($failed.Count -gt 0) {
  Write-Error ("Retail evidence-isolation static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Retail evidence-isolation static checks OK - $($checks.Count) checks passed."
