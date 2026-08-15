param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$activeVersionExpectations = Import-Module (Join-Path $Root "tests/support/active-version.psm1") -Force -PassThru | ForEach-Object { Get-ActiveVersionExpectations }

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is $($activeVersionExpectations.ActiveVersion)"; Text = $index; Pattern = $activeVersionExpectations.IDX },
  @{ Name = "Package version is $($activeVersionExpectations.ActiveVersion)"; Text = $package; Pattern = $activeVersionExpectations.PKG },
  @{ Name = "Server version is $($activeVersionExpectations.ActiveVersion)"; Text = $server; Pattern = $activeVersionExpectations.SRV },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Serper plan validates before execution"; Text = $api; Pattern = "validateSerperQueryCandidate(finalQuery, context" },
  @{ Name = "Invalid candidates are recorded as preflight"; Text = $api; Pattern = "invalid_query_preflight" },
  @{ Name = "Invalid records are not attempted"; Text = $api; Pattern = "attempted: validationPassed" },
  @{ Name = "Provider execution filters attempted requests"; Text = $api; Pattern = ".filter(({ requestRecord }) => requestRecord.attempted)" },
  @{ Name = "Serper request receives prevalidated flag"; Text = $api; Pattern = "prevalidated: queryRecord.validationPassed !== false" },
  @{ Name = "Transport validator keeps defensive guard"; Text = $api; Pattern = "function validateSerperTransportQuery" },
  @{ Name = "List-like visible phrase parser exists"; Text = $api; Pattern = "function parseListLikeSearchPhrases" },
  @{ Name = "Serialized list artifacts are rejected"; Text = $api; Pattern = "serialized_list_artifact" },
  @{ Name = "Brand-only queries are rejected"; Text = $api; Pattern = "brand_only_query" },
  @{ Name = "Concrete product noun is required"; Text = $api; Pattern = "missing_concrete_item_noun" },
  @{ Name = "Meaningful query anchor is required"; Text = $api; Pattern = "function hasMeaningfulQueryIdentityAnchor" },
  @{ Name = "Raw candidate survives validation"; Text = $api; Pattern = "rawCandidate });" },
  @{ Name = "Invalid query count is diagnostic only"; Text = $api; Pattern = "invalidQueryPreflightCount" },
  @{ Name = "Whole-token Serper shortening exists"; Text = $api; Pattern = "function shortenSerperQueryWithoutFragments" },
  @{ Name = "Quoted terms are preserved"; Text = $api; Pattern = "function splitQueryTermsPreservingQuotes" },
  @{ Name = "Raw string slice is not used in Serper cleaner"; Text = $api; Pattern = "shortenQueryCoreWholeTerms" },
  @{ Name = "Year plus fragment rule exists"; Text = $api; Pattern = "function isYearPlusShortFragment" },
  @{ Name = "Single fragment rule exists"; Text = $api; Pattern = "function isIncompleteQueryFragment" },
  @{ Name = "Fallback identity rule exists"; Text = $api; Pattern = "fallback_missing_identity_anchor" },
  @{ Name = "Person-name-only rule exists"; Text = $api; Pattern = "person_name_without_item_anchor" },
  @{ Name = "Marketplace query reduces domains before shortening identity"; Text = $api; Pattern = "while (candidate.length > 260 && sites.length > 1)" },
  @{ Name = "Serper request keeps US locale"; Text = $api; Pattern = 'gl: "us"' },
  @{ Name = "Serper request keeps English locale"; Text = $api; Pattern = 'hl: "en"' },
  @{ Name = "Diagnostics include raw candidate"; Text = $api; Pattern = "rawCandidate" },
  @{ Name = "Diagnostics include final query"; Text = $api; Pattern = "finalQuery" },
  @{ Name = "Frontend labels query diagnostics"; Text = $app; Pattern = "Search Query Diagnostics" },
  @{ Name = "Frontend shows validation reason"; Text = $app; Pattern = "Validation Reason" },
  @{ Name = "Photo multi-upload state remains intact"; Text = $app; Pattern = "let selectedPhotoFiles = [];" },
  @{ Name = "Photo upload still appends library files"; Text = $app; Pattern = "function handleLibraryPhotoChange()" },
  @{ Name = "Serper test hook exists"; Text = $api; Pattern = "__queryIntegrityTestHooks" },
  @{ Name = "Mock test rejects Vin"; Text = (Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw); Pattern = 'rawCandidate === "Vin"' },
  @{ Name = "Mock test rejects 1980 Un"; Text = (Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw); Pattern = 'rawCandidate === "1980 Un"' },
  @{ Name = "Mock test rejects brand-only query"; Text = (Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw); Pattern = 'rawCandidate === "Coca-Cola"' },
  @{ Name = "Mock test rejects malformed serialized list query"; Text = (Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw); Pattern = "Malformed serialized-list query should be rejected" },
  @{ Name = "Mock test protects zero-evidence usefulness wording"; Text = (Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw); Pattern = "Zero retained valuation evidence should never claim comparable evidence is useful enough." },
  @{ Name = "Mock test checks bad queries do not reach Serper"; Text = (Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw); Pattern = 'Invalid query fragments should never be sent to Serper.' }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$cleanerMatch = [regex]::Match($api, "function cleanSerperQuery\([\s\S]*?\n\}")
if (-not $cleanerMatch.Success) {
  $failed += "Serper cleaner should be inspectable"
} elseif ($cleanerMatch.Value -match "\.slice\(0,\s*maxLength\)") {
  $failed += "Serper cleaner must not raw-slice final query text"
}

$marketplaceMatch = [regex]::Match($api, "function buildSerperMarketplaceQuery\([\s\S]*?\n\}")
if (-not $marketplaceMatch.Success) {
  $failed += "Marketplace composer should be inspectable"
} elseif ($marketplaceMatch.Value -match "\.slice\(0,\s*260\)") {
  $failed += "Marketplace composer must not raw-slice final site query"
}

if ($app -match "SERPER_API_KEY|google\.serper\.dev|X-API-KEY") {
  $failed += "Frontend must not contain Serper key, endpoint, or auth header"
}

if ($failed.Count -gt 0) {
  Write-Error ("Serper query-integrity static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Serper query-integrity static checks OK - $($checks.Count) checks passed."
