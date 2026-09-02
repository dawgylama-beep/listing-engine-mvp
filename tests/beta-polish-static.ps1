param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$activeVersionExpectations = Import-Module (Join-Path $Root "tests/support/active-version.psm1") -Force -PassThru | ForEach-Object { Get-ActiveVersionExpectations }

$indexPath = Join-Path $Root "public/index.html"
$appPath = Join-Path $Root "public/app.js"
$customerAccountPath = Join-Path $Root "public/customer-account.js"
$stylesPath = Join-Path $Root "public/styles.css"
$packagePath = Join-Path $Root "package.json"
$serverPath = Join-Path $Root "server.ps1"

$index = Get-Content -LiteralPath $indexPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$customerAccount = Get-Content -LiteralPath $customerAccountPath -Raw
$styles = Get-Content -LiteralPath $stylesPath -Raw
$package = Get-Content -LiteralPath $packagePath -Raw
$server = Get-Content -LiteralPath $serverPath -Raw

$loadingContractStart = $app.IndexOf("function getLoadingStages(workflow)")
$loadingContractEnd = $app.IndexOf("function setStatus(message, type)", $loadingContractStart)
if ($loadingContractStart -lt 0 -or $loadingContractEnd -le $loadingContractStart) {
  throw "Beta polish static checks failed: customer loading contract could not be isolated"
}

$loadingContract = $app.Substring($loadingContractStart, $loadingContractEnd - $loadingContractStart)
$approvedLoadingSequencePattern = '(?s)return\s*\[\s*"Reviewing the photographs"\s*,\s*"Reading visible details and markings"\s*,\s*"Comparing identity possibilities"\s*,\s*"Checking market evidence"\s*,\s*workflow\s*===\s*"listing"\s*\?\s*"Preparing your listing guidance"\s*:\s*"Preparing your guidance"\s*\]\s*;'

$checks = @(
  @{ Name = "Visible app version is $($activeVersionExpectations.ActiveVersion)"; Text = $index; Pattern = $activeVersionExpectations.IDX },
  @{ Name = "Package version is $($activeVersionExpectations.ActiveVersion)"; Text = $package; Pattern = $activeVersionExpectations.PKG },
  @{ Name = "Local server version is $($activeVersionExpectations.ActiveVersion)"; Text = $server; Pattern = $activeVersionExpectations.SRV },
  @{ Name = "Feedback button exists"; Text = $index; Pattern = 'id="feedback-button"' },
  @{ Name = "Feedback panel exists"; Text = $index; Pattern = 'id="feedback-panel"' },
  @{ Name = "Photo controls explain camera and library"; Text = $index; Pattern = "Choose from Library" },
  @{ Name = "Decorative object gallery is hidden from assistive technology"; Text = $index; Pattern = 'class="object-border-gallery" aria-hidden="true"' },
  @{ Name = "Decorative ladybug is hidden from assistive technology"; Text = $index; Pattern = 'class="photo-ladybug" aria-hidden="true"' },
  @{ Name = "Signup asks for the private preferred name"; Text = $index; Pattern = 'What would you like Katherine to call you?' },
  @{ Name = "Personalized greeting is signed-in only by default"; Text = $index; Pattern = 'id="personalized-greeting" class="personalized-greeting" aria-labelledby="personalized-greeting-title" aria-live="polite" hidden' },
  @{ Name = "Personalized greeting uses the authenticated account record"; Text = $customerAccount; Pattern = 'account.preferredName || account.username' },
  @{ Name = "Personalized greeting renders through plain text"; Text = $customerAccount; Pattern = 'personalizedGreetingTitle.textContent' },
  @{ Name = "Preferred name can be changed in account settings"; Text = $index; Pattern = 'id="preferred-name-form"' },
  @{ Name = "Warm shopping-for-self purpose label exists"; Text = $index; Pattern = 'Shopping for myself' },
  @{ Name = "Warm shopping-to-resell purpose label exists"; Text = $index; Pattern = 'Shopping to resell' },
  @{ Name = "Warm ownership-check purpose label exists"; Text = $index; Pattern = 'Checking what I own' },
  @{ Name = "Warm selling-preparation purpose label exists"; Text = $index; Pattern = 'Getting ready to sell' },
  @{ Name = "Photo removal function exists"; Text = $app; Pattern = "function removePhotoAt" },
  @{ Name = "Executive summary renders first inside report root"; Text = $app; Pattern = "reportRoot.appendChild(renderExecutiveSummary" },
  @{ Name = "Why report group exists"; Text = $app; Pattern = 'title: "Why This Recommendation"' },
  @{ Name = "Research Details group exists"; Text = $app; Pattern = "Research Details" },
  @{ Name = "Appraiser summary exists"; Text = $app; Pattern = "function renderAppraiserSummary" },
  @{ Name = "Confidence explainer exists"; Text = $app; Pattern = "function renderConfidenceExplainer" },
  @{ Name = "Why expansion exists"; Text = $app; Pattern = 'whySummary.textContent = "Why this recommendation?"' },
  @{ Name = "Loading progress exists"; Text = $app; Pattern = "function startLoadingProgress" },
  @{ Name = "Loading begins with approved photograph review language"; Text = $loadingContract; Pattern = "Reviewing the photographs" },
  @{ Name = "Loading explains that the active stage is not a percentage"; Text = $loadingContract; Pattern = "not a percentage complete" },
  @{ Name = "Friendly no-results error exists"; Text = $app; Pattern = "We could not find an exact match" },
  @{ Name = "Copy confirmation says copied"; Text = $app; Pattern = 'button.textContent = "Copied!"' },
  @{ Name = "Executive summary styles exist"; Text = $styles; Pattern = ".executive-summary-card" },
  @{ Name = "Report group styles exist"; Text = $styles; Pattern = ".report-group" },
  @{ Name = "Loading styles exist"; Text = $styles; Pattern = ".loading-steps" },
  @{ Name = "Photo remove styles exist"; Text = $styles; Pattern = ".photo-remove-button" },
  @{ Name = "Desktop border-gallery styles exist"; Text = $styles; Pattern = ".object-border-gallery" },
  @{ Name = "Ladybug arrival motion exists"; Text = $styles; Pattern = "@keyframes ladybug-settle" },
  @{ Name = "Ladybug reduced-motion override exists"; Text = $styles; Pattern = ".photo-ladybug" },
  @{ Name = "Long preferred names wrap safely"; Text = $styles; Pattern = "overflow-wrap: anywhere" },
  @{ Name = "Feedback styles exist"; Text = $styles; Pattern = ".feedback-panel" },
  @{ Name = "Mobile 520 media query remains"; Text = $styles; Pattern = "@media (max-width: 520px)" },
  @{ Name = "Mobile summary stacks"; Text = $styles; Pattern = ".executive-metrics" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

if ($loadingContract -notmatch $approvedLoadingSequencePattern) {
  $failed += "Loading stages use the exact approved deterministic sequence"
}

if ($loadingContract -like "*Identifying subject*") {
  $failed += "Loading contract excludes the retired identifying-subject phrase"
}

if ($loadingContract -match '%|aria-valuenow|progressbar') {
  $failed += "Loading contract excludes invented percentage progress"
}

$borderObjectCount = ([regex]::Matches($index, 'data-object="(?:clock|vase|camera|jewelry|handbag|lamp|collectible)"')).Count
if ($borderObjectCount -ne 7) {
  $failed += "Decorative border gallery contains exactly seven approved object pictures"
}

if ($failed.Count -gt 0) {
  throw "Beta polish static checks failed: $($failed -join '; ')"
}

Write-Host "Beta polish static checks OK - $($checks.Count) checks passed."
