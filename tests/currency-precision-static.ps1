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
  @{ Name = "Visible app version is 1.11.10"; Text = $index; Pattern = "Version 1.11.10" },
  @{ Name = "Package version is 1.11.10"; Text = $package; Pattern = '"version": "1.11.10"' },
  @{ Name = "Server version is 1.11.10"; Text = $server; Pattern = '$AppVersion = "1.11.10"' },
  @{ Name = "Roadmap documents cents preservation"; Text = $roadmap; Pattern = "Currency parsing and report formatting now preserve cents" },
  @{ Name = "Price input allows decimal entry"; Text = $index; Pattern = 'inputmode="decimal"' },
  @{ Name = "Frontend parses cents before submit"; Text = $app; Pattern = "function parseCurrencyCentsFromText" },
  @{ Name = "Frontend sends asking price cents"; Text = $app; Pattern = "asking_price_cents: parseCurrencyCentsFromText" },
  @{ Name = "Frontend sends shipping cents"; Text = $app; Pattern = "known_shipping_amount_cents: parseCurrencyCentsFromText" },
  @{ Name = "Frontend money formatter keeps two decimals"; Text = $app; Pattern = "minimumFractionDigits: 2" },
  @{ Name = "API normalizes asking price cents"; Text = $api; Pattern = "intake.asking_price_cents = parseCurrencyCents" },
  @{ Name = "API converts cents back to decimal money"; Text = $api; Pattern = "function centsToMoney" },
  @{ Name = "API unsupported-evidence guard compares cents"; Text = $api; Pattern = "function moneyAmountToCents" },
  @{ Name = "API Ask scenario uses formatted proposed price"; Text = $api; Pattern = "formatMoney(proposedPrice)" },
  @{ Name = "API source money always shows cents"; Text = $api; Pattern = "function formatSourceMoney" },
  @{ Name = "API unit money can show sub-dollar precision"; Text = $api; Pattern = "amount < 0.01 ? 4 : amount < 1 ? 3 : 2" },
  @{ Name = "Server money formatter keeps cents"; Text = $server; Pattern = "ToString('N2')" },
  @{ Name = "Static formatting path remains present"; Text = $app; Pattern = "formatSearchDiagnosticsText" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$forbidden = @(
  @{ Name = "API formatMoney must not round whole dollars"; Text = $api; Pattern = 'return `$${Math.round(value).toLocaleString("en-US")}`;' },
  @{ Name = "API unsupported-evidence guard must not compare rounded dollars"; Text = $api; Pattern = "Math.round(amount) !== Math.round(askingAmount)" },
  @{ Name = "Ask scenario must not hand-build proposed dollar text"; Text = $api; Pattern = '$${proposedPrice}' },
  @{ Name = "Server formatter must not round to whole dollars"; Text = $server; Pattern = "[Math]::Round(`$Value).ToString('N0')" }
)

foreach ($check in $forbidden) {
  if ($check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Currency precision static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Currency precision static checks OK - $($checks.Count) checks passed."
