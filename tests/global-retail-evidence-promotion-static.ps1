param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$checks = @(
  @{ Name = "Shared retail evidence assessment builder exists"; Text = $api; Pattern = "function buildRetailEvidenceAssessments" },
  @{ Name = "Single-record retail assessment exists"; Text = $api; Pattern = "function buildRetailEvidenceAssessment" },
  @{ Name = "Assessment hard rejection helper exists"; Text = $api; Pattern = "function buildRetailAssessmentHardRejectionReason" },
  @{ Name = "Retail evidence tier helper exists"; Text = $api; Pattern = "function classifyRetailEvidenceTier" },
  @{ Name = "Retail assessment downgrade helper exists"; Text = $api; Pattern = "function buildRetailAssessmentDowngrades" },
  @{ Name = "Customer eligibility is assessment-backed"; Text = $api; Pattern = "customerPriceCardEligibility" },
  @{ Name = "Source screening is assessment-backed"; Text = $api; Pattern = "sourceScreeningPassed" },
  @{ Name = "Retail assessment price cards are built globally"; Text = $api; Pattern = "function buildRetailAssessmentPriceFoundRecords" },
  @{ Name = "Retail cards are labeled current retail price"; Text = $api; Pattern = 'priceType: "Current Retail Price"' },
  @{ Name = "Retail evidence tiers affect sorting"; Text = $api; Pattern = "function retailEvidenceTierRank" },
  @{ Name = "Diagnostics expose customer-price eligibility count"; Text = $api; Pattern = "customerPriceEligibleRetailCandidateCount" },
  @{ Name = "Frontend displays customer-price eligibility count"; Text = $app; Pattern = "Customer Price Eligible Retail Candidates" },
  @{ Name = "Per-query diagnostics uses customer eligibility language"; Text = $app; Pattern = "Customer Price Eligible" },
  @{ Name = "Richer dedupe considers visible price"; Text = $api; Pattern = "function preferRicherSerperRecord" },
  @{ Name = "Mock covers cross-brand ordinary retail promotion"; Text = $mock; Pattern = "Cross-brand ordinary retail alternatives should be eligible" },
  @{ Name = "Mock covers missing package-count downgrade"; Text = $mock; Pattern = "Missing package count should downgrade to package-price-only" },
  @{ Name = "Mock covers shopping-stage promotion"; Text = $mock; Pattern = "Shopping-stage priced records should promote to customer prices" },
  @{ Name = "Mock covers local-stage promotion"; Text = $mock; Pattern = "Local-stage priced records should promote to customer prices" },
  @{ Name = "Mock covers richer duplicate survival"; Text = $mock; Pattern = "Richer price-bearing duplicate should survive deduplication" },
  @{ Name = "Mock covers uncertain SKU exclusion"; Text = $mock; Pattern = "Uncertain OCR SKU must not be copied into exact searchable identity" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$forbiddenProductionPatterns = @(
  "610325",
  "6110325",
  "041226087161",
  "30188",
  "submittedQuantity === 45",
  "candidateQuantity === 50",
  "candidateQuantity === 45",
  "submittedQuantity === 50"
)

foreach ($pattern in $forbiddenProductionPatterns) {
  if ($api.Contains($pattern) -or $app.Contains($pattern)) {
    $failed += "Product-specific production pattern found: $pattern"
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Global retail evidence promotion static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Global retail evidence promotion static checks OK - $($checks.Count) checks passed."
