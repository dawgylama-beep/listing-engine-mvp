param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.10.8"; Text = $index; Pattern = "Version 1.10.8" },
  @{ Name = "Package version is 1.10.8"; Text = $package; Pattern = '"version": "1.10.8"' },
  @{ Name = "Server version is 1.10.8"; Text = $server; Pattern = '$AppVersion = "1.10.8"' },
  @{ Name = "Roadmap documents 1.10.8"; Text = $roadmap; Pattern = "Version 1.10.8 (Completed)" },
  @{ Name = "Canonical item type compatibility function exists"; Text = $api; Pattern = "function evaluateComparableItemTypeCompatibility" },
  @{ Name = "Submitted item type text is built deterministically"; Text = $api; Pattern = "function buildSubmittedItemTypeText" },
  @{ Name = "Candidate item type text includes URL slug"; Text = $api; Pattern = "record.canonicalUrl" },
  @{ Name = "Candidate unknown type is not compatible"; Text = $api; Pattern = "candidate_type_unknown" },
  @{ Name = "Set scope mismatch is handled"; Text = $api; Pattern = "set_scope_mismatch" },
  @{ Name = "Shared wording cannot override product type"; Text = $api; Pattern = "Shared brand, date, event, or theme wording cannot make different product types comparable." },
  @{ Name = "Match classifier receives compatibility"; Text = $api; Pattern = "classifySerperIdentityMatch(record, identity, context, itemTypeCompatibility)" },
  @{ Name = "Classifier gates valuation-unsafe product forms"; Text = $api; Pattern = "if (!isComparableItemTypeValuationSafe(compatibility))" },
  @{ Name = "Evidence role receives compatibility"; Text = $api; Pattern = 'function buildSerperEvidenceRole(identityMatchStrength = "", priceEvidenceType = "", itemTypeCompatibility = {})' },
  @{ Name = "Non-valuation influence reason exists"; Text = $api; Pattern = "function buildNonValuationInfluenceReason" },
  @{ Name = "Legacy comparable strings require valuation-compatible records"; Text = $api; Pattern = "canInfluenceValuationFromVisibleRecord(record)" },
  @{ Name = "Consumer price evidence uses valuation-compatible records"; Text = $api; Pattern = "const exactOrStrongRecords = records.filter((record) => canInfluenceValuationFromVisibleRecord(record));" },
  @{ Name = "Visible source records carry submitted item type"; Text = $api; Pattern = "submittedItemType" },
  @{ Name = "Visible source records carry candidate item type"; Text = $api; Pattern = "candidateItemType" },
  @{ Name = "Visible source records carry item type compatibility"; Text = $api; Pattern = "itemTypeCompatibilityStatus" },
  @{ Name = "Test hook exposes item type compatibility"; Text = $api; Pattern = "evaluateComparableItemTypeCompatibility" },
  @{ Name = "Mock test covers compatible tray"; Text = $mock; Pattern = "decorative tray compatible" },
  @{ Name = "Mock test covers bottle mismatch"; Text = $mock; Pattern = "bottle incompatible" },
  @{ Name = "Mock test covers sign mismatch"; Text = $mock; Pattern = "sign incompatible" },
  @{ Name = "Mock test covers plate mismatch"; Text = $mock; Pattern = "plate incompatible" },
  @{ Name = "Mock test covers cup mismatch"; Text = $mock; Pattern = "cup incompatible" },
  @{ Name = "Mock test covers poster mismatch"; Text = $mock; Pattern = "poster incompatible" },
  @{ Name = "Mock test covers can mismatch"; Text = $mock; Pattern = "can incompatible" },
  @{ Name = "Mock test covers ornament mismatch"; Text = $mock; Pattern = "ornament incompatible" },
  @{ Name = "Mock test covers figurine mismatch"; Text = $mock; Pattern = "figurine incompatible" },
  @{ Name = "Mock test covers unknown candidate type"; Text = $mock; Pattern = "unknown candidate type incompatible" },
  @{ Name = "Mock test covers URL slug conflict"; Text = $mock; Pattern = "URL slug product noun should prevent" },
  @{ Name = "Mock test covers shared wording override"; Text = $mock; Pattern = "Shared brand/year/event wording must not override" },
  @{ Name = "Mock test covers active asking mismatch exclusion"; Text = $mock; Pattern = "Mismatched active asking listings should be reference-only" },
  @{ Name = "Mock test covers complete-set mismatch"; Text = $mock; Pattern = "Complete set and replacement-piece scope mismatch should not be exact." },
  @{ Name = "Mock scenario excludes mismatched result from strong comparables"; Text = $mock; Pattern = "Mismatched bottle result must not remain in exact/strong comparable evidence." },
  @{ Name = "Mock scenario uses explicit range labels"; Text = $mock; Pattern = "Mismatched product-form evidence should use explicit verified/preliminary range labels." }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($api -match "georgia-coca-cola-bottle|georgia-coca-cola-tray|HOW 'BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS") {
  $failed += "Production API must not contain fixture-specific Georgia/Coca-Cola terms"
}

if ($api -match "picclick\.com/1981|example\.com/georgia|ebay\.com/itm/georgia") {
  $failed += "Production API must not contain fixture-specific URLs"
}

if ($failed.Count -gt 0) {
  Write-Error ("Item-type firewall static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Item-type firewall static checks OK - $($checks.Count) checks passed."
