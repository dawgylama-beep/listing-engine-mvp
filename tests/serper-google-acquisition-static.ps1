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
$objectResolution = Get-Content (Join-Path $Root "lib/object-intelligence/resolution.js") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.20"; Text = $index; Pattern = "Version 1.12.20" },
  @{ Name = "Package version is 1.12.20"; Text = $package; Pattern = '"version": "1.12.20"' },
  @{ Name = "Server version is 1.12.20"; Text = $server; Pattern = '$AppVersion = "1.12.20"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "API reads SERPER_API_KEY server-side"; Text = $api; Pattern = "process.env.SERPER_API_KEY" },
  @{ Name = "API uses Serper host"; Text = $api; Pattern = "https://google.serper.dev/" },
  @{ Name = "API selects Serper search endpoint"; Text = $api; Pattern = 'searchType === "shopping" ? "shopping" : "search"' },
  @{ Name = "API uses Serper auth header server-side"; Text = $api; Pattern = '"X-API-KEY": apiKey' },
  @{ Name = "API sets Serper US locale defaults"; Text = $api; Pattern = 'gl: "us"' },
  @{ Name = "API sets Serper English locale defaults"; Text = $api; Pattern = 'hl: "en"' },
  @{ Name = "API requests ten Serper results"; Text = $api; Pattern = "num: 10" },
  @{ Name = "Serper is selected before OpenAI fallback"; Text = $api; Pattern = "executeSerperComparableSearch" },
  @{ Name = "OpenAI web_search fallback remains available"; Text = $api; Pattern = "executeOpenAIWebComparableSearch" },
  @{ Name = "Standard provider ceiling remains twelve physical attempts"; Text = $api; Pattern = 'isCurrentRetailOnlyMode(context.retailEvidenceMode) ? retailSerperBudgetAllocation.maxProviderCalls : 12' },
  @{ Name = "Retail provider ceiling remains twenty-eight physical attempts"; Text = $api; Pattern = "maxProviderCalls: 28" },
  @{ Name = "Standard initial phase reserves four attempts for refinement"; Text = $api; Pattern = "const initialProviderLimit = objectMindState?.objectStateId ? 8 : 12;" },
  @{ Name = "Retail initial phase reserves four attempts for refinement"; Text = $api; Pattern = "? Math.max(1, retailSerperBudgetAllocation.maxProviderCalls - 4)" },
  @{ Name = "Initial provider plans slice before dispatch through their assigned limit"; Text = $api; Pattern = "validRecords.slice(0, initialProviderLimit)"; MinimumCount = 2 },
  @{ Name = "Refinement is limited to four queries and remaining provider capacity"; Text = $api; Pattern = "maximumQueries: Math.min(4, Math.max("; MinimumCount = 2 },
  @{ Name = "Serper initial and refinement requests share one provider attempt budget"; Text = $api; Pattern = "attemptBudget: sharedProviderAttemptBudget"; MinimumCount = 2 },
  @{ Name = "Refinement and retail recovery receive the existing shared provider budget"; Text = $api; Pattern = "providerAttemptBudget: sharedProviderAttemptBudget"; MinimumCount = 2 },
  @{ Name = "Direct-page enrichment has a separate two-attempt ceiling"; Text = $api; Pattern = "const directPageEnrichmentMaxAttempts = 2;" },
  @{ Name = "Direct-page candidates are sliced to remaining direct capacity"; Text = $api; Pattern = ".slice(0, remainingBudget)" },
  @{ Name = "Direct-page fetches consume only the direct-page budget"; Text = $api; Pattern = "consumePhysicalAttempt(directPageAttemptBudget" },
  @{ Name = "Object intelligence permits only one refinement phase"; Text = $objectResolution; Pattern = "if (Number(evidenceState.refinementCount || 0) >= 1)" },
  @{ Name = "Object intelligence records only a refinement phase that was actually triggered"; Text = $objectResolution; Pattern = "refinementCount: Number(evidenceState.refinementCount || 0) + (refinementTriggered ? 1 : 0)" },
  @{ Name = "Serper organic results parsed"; Text = $api; Pattern = "data.organic" },
  @{ Name = "Serper shopping results parsed"; Text = $api; Pattern = "data.shopping" },
  @{ Name = "Serper knowledge graph reference parsed"; Text = $api; Pattern = "knowledgeGraph" },
  @{ Name = "Related searches are counted but not evidence"; Text = $api; Pattern = "relatedSearchCount" },
  @{ Name = "Comparable URL canonicalization exists"; Text = $api; Pattern = "function canonicalizeComparableUrl" },
  @{ Name = "Serper dedupe preserves query provenance"; Text = $api; Pattern = "queriesFound" },
  @{ Name = "Identity match classification separates exact and rejected"; Text = $api; Pattern = "function classifySerperIdentityMatch" },
  @{ Name = "Price evidence classification separates shopping and active"; Text = $api; Pattern = "function classifySerperPriceEvidence" },
  @{ Name = "Diagnostics expose Serper call counts"; Text = $api; Pattern = "serperCallsAttempted" },
  @{ Name = "Diagnostics expose organic count"; Text = $api; Pattern = "organicResultCount" },
  @{ Name = "Diagnostics expose shopping count"; Text = $api; Pattern = "shoppingResultCount" },
  @{ Name = "Frontend renders Serper configured safely"; Text = $app; Pattern = "Serper Configured" },
  @{ Name = "Frontend renders source query"; Text = $app; Pattern = '["Query", item.query]' },
  @{ Name = "Frontend renders active sold reference status"; Text = $app; Pattern = "Active/Sold/Reference Status" },
  @{ Name = "Ask instructions use stored Serper diagnostics"; Text = $api; Pattern = "stored Serper diagnostics" }
)

$failed = @()
foreach ($check in $checks) {
  $minimumCount = if ($check.MinimumCount) { [int]$check.MinimumCount } else { 1 }
  $matchCount = ([regex]::Matches($check.Text, [regex]::Escape($check.Pattern))).Count
  if ($matchCount -lt $minimumCount) {
    $failed += $check.Name
  }
}

if ($app -match "SERPER_API_KEY|google\.serper\.dev|X-API-KEY") {
  $failed += "Frontend must not contain Serper key, endpoint, or auth header"
}

if ($api -match "HOW '?BOUT|Georgia Bulldogs|Coca-Cola collector tray") {
  $failed += "Production API must not hardcode Georgia/Coca-Cola fixture behavior"
}

if ($failed.Count -gt 0) {
  Write-Error ("Serper Google acquisition static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Serper Google acquisition static checks OK."
