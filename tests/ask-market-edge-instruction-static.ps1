param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$apiPath = Join-Path $Root "api/generate-listing.js"
$appPath = Join-Path $Root "public/app.js"
$indexPath = Join-Path $Root "public/index.html"

$api = Get-Content -LiteralPath $apiPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$index = Get-Content -LiteralPath $indexPath -Raw

$checks = @(
  @{ Name = "API treats Ask as non-generic"; Text = $api; Pattern = "is not a generic chatbot" },
  @{ Name = "API active report is authoritative"; Text = $api; Pattern = "current structured report is the authoritative starting point" },
  @{ Name = "API includes new_live_search schema route"; Text = $api; Pattern = '"new_live_search"' },
  @{ Name = "API classifies search older images as new search"; Text = $api; Pattern = "search older" },
  @{ Name = "API says Ask does not run fresh search"; Text = $api; Pattern = "No new live search is being performed inside this Ask response" },
  @{ Name = "API requires needsNewSearch for new search route"; Text = $api; Pattern = 'answerType === "new_live_search" ? true' },
  @{ Name = "API preserves personal-use logic"; Text = $api; Pattern = "Never use reseller margin logic for a personal-use buyer" },
  @{ Name = "API preserves reseller logic"; Text = $api; Pattern = "Use reseller profit, fees, shipping, net margin" },
  @{ Name = "API labels condition updates as user-provided"; Text = $api; Pattern = "condition_scenario questions record new details as user-provided" },
  @{ Name = "API preserves listing damage disclosures"; Text = $api; Pattern = "damage disclosures" },
  @{ Name = "API preserves broad visual subject identity"; Text = $api; Pattern = "preserve the supported subject" },
  @{ Name = "API separates visual subject from exact product"; Text = $api; Pattern = "separate visual subject recognition" },
  @{ Name = "API avoids licensing/authenticity claims"; Text = $api; Pattern = "do not infer authenticity from subject identity" },
  @{ Name = "API requests one best next evidence"; Text = $api; Pattern = "single most useful next detail or photo" },
  @{ Name = "API uses recent conversation history"; Text = $api; Pattern = "Use short recent conversation history" },
  @{ Name = "Frontend clears item session on New Item"; Text = $app; Pattern = "clearItemSession" },
  @{ Name = "Frontend blocks stale Ask responses"; Text = $app; Pattern = "isCurrentAskRequest" },
  @{ Name = "Frontend Ask helper references evidence and price"; Text = $index; Pattern = "Ask about this item, the evidence, the recommendation, a different price, or the listing" },
  @{ Name = "Frontend visible version is current"; Text = $index; Pattern = "Version 1.12.32" }
)

$failed = @()
foreach ($check in $checks) {
  if ($check.Text -notlike "*$($check.Pattern)*") {
    $failed += $check.Name
  }
}

if ($failed.Count -gt 0) {
  throw "Ask Katherine static instruction checks failed: $($failed -join '; ')"
}

Write-Host "Ask Katherine instruction static checks OK - $($checks.Count) checks passed."
