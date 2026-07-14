param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.10.1"; Text = $index; Pattern = "Version 1.10.1" },
  @{ Name = "Package version is 1.10.1"; Text = $package; Pattern = '"version": "1.10.1"' },
  @{ Name = "Server version is 1.10.1"; Text = $server; Pattern = '$AppVersion = "1.10.1"' },
  @{ Name = "Roadmap documents 1.10.1"; Text = $roadmap; Pattern = "Version 1.10.1 (Completed)" },
  @{ Name = "Final report stops progress timer"; Text = $app; Pattern = "function renderReport(report, sections) {" },
  @{ Name = "Report rendering replaces children"; Text = $app; Pattern = "results.replaceChildren(reportRoot);" },
  @{ Name = "Loading progress replaces children"; Text = $app; Pattern = "results.replaceChildren(card);" },
  @{ Name = "Empty state replaces children"; Text = $app; Pattern = "results.replaceChildren(intro);" },
  @{ Name = "Technical details disclosure exists"; Text = $app; Pattern = "function renderTechnicalSearchDetails" },
  @{ Name = "Technical details summary exists"; Text = $app; Pattern = "Show Technical Search Details" },
  @{ Name = "Query diagnostics use compact details rows"; Text = $app; Pattern = 'document.createElement("details")' },
  @{ Name = "Query diagnostic summary exists"; Text = $app; Pattern = "query-diagnostic-summary" },
  @{ Name = "Attempted records are rendered first"; Text = $app; Pattern = "wrapper.appendChild(renderQueryDiagnosticList(attemptedRecords));" },
  @{ Name = "Rejected records are summarized"; Text = $app; Pattern = "function renderRejectedQuerySummary" },
  @{ Name = "Rejected records require expansion"; Text = $app; Pattern = "Show rejected queries" },
  @{ Name = "Show all details control exists"; Text = $app; Pattern = "Show all details" },
  @{ Name = "End marker is appended inside report root"; Text = $app; Pattern = "reportRoot.appendChild(renderEndOfReportMarker());" },
  @{ Name = "Technical details styles exist"; Text = $styles; Pattern = ".technical-details-disclosure" },
  @{ Name = "Query summary styles exist"; Text = $styles; Pattern = ".query-diagnostic-summary" },
  @{ Name = "Rejected query summary styles exist"; Text = $styles; Pattern = ".rejected-query-summary" },
  @{ Name = "Mobile query diagnostics use one column"; Text = $styles; Pattern = ".query-diagnostic-summary" },
  @{ Name = "Mobile output panel does not force spacer height"; Text = $styles; Pattern = ".output-panel" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($app -notmatch "function renderReport\(report, sections\) \{[\s\S]*?stopLoadingProgress\(\);") {
  $failed += "renderReport must stop loading progress immediately"
}
if ($app -match "results\.appendChild\(reportRoot\)") {
  $failed += "renderReport must not append report root"
}
if ($app -notmatch "function renderReport\(report, sections\) \{[\s\S]*?results\.replaceChildren\(reportRoot\);") {
  $failed += "renderReport must replace the current report root"
}

$endMarkerCount = ([regex]::Matches($app, "reportRoot\.appendChild\(renderEndOfReportMarker\(\)\);")).Count
if ($endMarkerCount -ne 1) {
  $failed += "There should be exactly one End of Report marker insertion path"
}

$autoScrollPatterns = @(
  "scrollIntoView",
  "window\.scrollTo",
  "document\.documentElement\.scroll",
  "requestAnimationFrame",
  "MutationObserver",
  "visualViewport"
)
foreach ($pattern in $autoScrollPatterns) {
  if ($app -match $pattern) {
    $failed += "Automatic scroll/observer pattern should not appear: $pattern"
  }
}

$technicalMatch = [regex]::Match($app, "function renderTechnicalSearchDetails\(value\) \{(?<body>[\s\S]*?)\n\}")
if (-not $technicalMatch.Success) {
  $failed += "Technical details function should be inspectable"
} elseif ($technicalMatch.Groups["body"].Value -match "\.open\s*=\s*true") {
  $failed += "Technical Search Details must be collapsed by default"
}

if ($styles -notmatch "\.query-diagnostic-facts\s*\{[\s\S]*?minmax\(min\(100%, 220px\), 1fr\)") {
  $failed += "Query facts should avoid very narrow mobile columns"
}

if ($styles -notmatch "@media \(max-width: 860px\)[\s\S]*?\.output-panel\s*\{\s*min-height:\s*0;") {
  $failed += "Mobile output panel should not force extra height below the report"
}

if ($failed.Count -gt 0) {
  Write-Error ("Mobile report length static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Mobile report length static checks OK - $($checks.Count) checks passed."
