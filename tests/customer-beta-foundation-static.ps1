param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"
$index = Get-Content -LiteralPath (Join-Path $Root "public/index.html") -Raw
$app = Get-Content -LiteralPath (Join-Path $Root "public/app.js") -Raw
$account = Get-Content -LiteralPath (Join-Path $Root "public/customer-account.js") -Raw
$styles = Get-Content -LiteralPath (Join-Path $Root "public/styles.css") -Raw
$server = Get-Content -LiteralPath (Join-Path $Root "server.ps1") -Raw
$handler = Get-Content -LiteralPath (Join-Path $Root "api/customer-account.js") -Raw
$service = Get-Content -LiteralPath (Join-Path $Root "lib/customer-account/service.js") -Raw

$checks = @(
  @{ Name = "Accessible drop zone"; Text = $index; Pattern = 'id="photo-dropzone" class="photo-dropzone" role="button" tabindex="0"' },
  @{ Name = "Supported object guidance"; Text = $index; Pattern = "ordinary household goods, tools, décor, apparel, collectibles, and retail items" },
  @{ Name = "Photo size guidance"; Text = $index; Pattern = "up to 20 MB each" },
  @{ Name = "Photo validation feedback"; Text = $index; Pattern = 'id="photo-feedback"' },
  @{ Name = "Upload privacy summary"; Text = $index; Pattern = 'class="privacy-promise"' },
  @{ Name = "Analysis cancel control"; Text = $app; Pattern = 'cancelButton.textContent = "Cancel analysis"' },
  @{ Name = "Honest delayed state"; Text = $app; Pattern = "This is taking longer than usual" },
  @{ Name = "Explicit save action"; Text = $index; Pattern = 'id="save-listing-button"' },
  @{ Name = "Private history UI"; Text = $index; Pattern = 'id="history-panel"' },
  @{ Name = "Account dialog"; Text = $index; Pattern = 'id="account-panel"' },
  @{ Name = "Normalized username rules"; Text = $service; Pattern = 'normalize("NFKC").toLowerCase()' },
  @{ Name = "Reserved username protection"; Text = $service; Pattern = "RESERVED_USERNAMES" },
  @{ Name = "Server-side listing ownership"; Text = $service; Pattern = "state.histories[account.id]" },
  @{ Name = "No saved image retention"; Text = $service; Pattern = 'imageRetention: "none"' },
  @{ Name = "Export boundary"; Text = $service; Pattern = "sessionTokensIncluded: false" },
  @{ Name = "Account deletion"; Text = $service; Pattern = "async deleteAccount" },
  @{ Name = "HttpOnly strict cookie"; Text = $handler; Pattern = '"HttpOnly"' },
  @{ Name = "Same-origin mutation enforcement"; Text = $handler; Pattern = "assertMutationOrigin" },
  @{ Name = "Session-bound CSRF verification"; Text = $handler; Pattern = "verifyCsrf" },
  @{ Name = "Strict account JSON content type"; Text = $handler; Pattern = "unsupported_media_type" },
  @{ Name = "Browser sends CSRF token"; Text = $account; Pattern = '"X-CSRF-Token": csrfToken' },
  @{ Name = "Password records bind scrypt parameters"; Text = $service; Pattern = 'algorithm: "scrypt-v2"' },
  @{ Name = "Authentication throttle persists in state"; Text = $service; Pattern = "authenticationThrottle" },
  @{ Name = "Password change revokes sessions"; Text = $service; Pattern = "revokeAccountSessions" },
  @{ Name = "Unavailable production dependency is honest"; Text = $handler; Pattern = 'code: "account_service_unavailable"' },
  @{ Name = "Cookie reaches local handler"; Text = $server; Pattern = '"Cookie"' },
  @{ Name = "Reduced motion remains"; Text = $styles; Pattern = "@media (prefers-reduced-motion: reduce)" },
  @{ Name = "Visible keyboard focus remains"; Text = $styles; Pattern = ".photo-dropzone:focus-visible" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$browserSurface = $index + $app + $account
if ($browserSurface -match "OPENAI_API_KEY|SERPER_API_KEY|BEGIN PRIVATE KEY|ke_beta_session=") {
  $failed += "Browser surface must not expose provider, private-key, or session-token material"
}
if ($index.Contains("controller") -or $index.Contains("Governor") -or $index.Contains("Mentor")) {
  $failed += "Customer HTML must not expose governance terminology"
}

if ($failed.Count -gt 0) {
  throw "Customer beta foundation static checks failed: $($failed -join '; ')"
}

Write-Host "Customer beta foundation static checks OK - $($checks.Count) checks passed."
