param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$indexUtf8 = Get-Content (Join-Path $Root "public/index.html") -Raw -Encoding UTF8
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$manifest = Get-Content (Join-Path $Root "public/manifest.webmanifest") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$reverseGeocode = Get-Content (Join-Path $Root "api/reverse-geocode.js") -Raw
$vercel = Get-Content (Join-Path $Root "vercel.json") -Raw
$readme = Get-Content (Join-Path $Root "README.md") -Raw
$deployment = Get-Content (Join-Path $Root "DEPLOYMENT_CHECKLIST.md") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$activeFiles = @(
  @{ Path = "public/index.html"; Text = $index },
  @{ Path = "public/app.js"; Text = $app },
  @{ Path = "public/styles.css"; Text = $styles },
  @{ Path = "public/manifest.webmanifest"; Text = $manifest },
  @{ Path = "api/generate-listing.js"; Text = $api },
  @{ Path = "server.ps1"; Text = $server },
  @{ Path = "README.md"; Text = $readme },
  @{ Path = "DEPLOYMENT_CHECKLIST.md"; Text = $deployment }
)

$checks = @(
  @{ Name = "Visible app version is 1.12.27"; Text = $index; Pattern = "Version 1.12.27" },
  @{ Name = "Package version is 1.12.27"; Text = $package; Pattern = '"version": "1.12.27"' },
  @{ Name = "Package name uses safe ASCII identifier"; Text = $package; Pattern = '"name": "katherines-eye"' },
  @{ Name = "Roadmap documents Version 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Page title uses Katherine's Eye"; Text = $index; Pattern = "<title>Katherine" },
  @{ Name = "Meta description uses the approved customer descriptor"; Text = $index; Pattern = 'name="description" content="Your guide to identifying, valuing, buying, and selling the things around you."' },
  @{ Name = "Open Graph metadata uses Katherine's Eye"; Text = $index; Pattern = 'property="og:title" content="Katherine' },
  @{ Name = "Twitter metadata uses Katherine's Eye"; Text = $index; Pattern = 'name="twitter:title" content="Katherine' },
  @{ Name = "Apple app title uses Katherine's Eye"; Text = $index; Pattern = 'name="apple-mobile-web-app-title" content="Katherine' },
  @{ Name = "Manifest name uses Katherine's Eye"; Text = $manifest; Pattern = '"name": "Katherine' },
  @{ Name = "Ask label uses Katherine's Eye"; Text = $index; Pattern = "Ask Katherine" },
  @{ Name = "Loading state uses Katherine's Eye"; Text = $app; Pattern = "Katherine" },
  @{ Name = "API prompt uses Katherine's Eye"; Text = $api; Pattern = "buyer-first market intelligence assistant" },
  @{ Name = "Legacy stable ask action remains"; Text = $app; Pattern = 'action: "ask_market_edge"' },
  @{ Name = "No localStorage state is introduced"; Text = $app; Pattern = "localStorage" ; ShouldNotContain = $true },
  @{ Name = "No sessionStorage state is introduced"; Text = $app; Pattern = "sessionStorage" ; ShouldNotContain = $true },
  @{ Name = "Use My Location calls browser geolocation"; Text = $app; Pattern = "navigator.geolocation.getCurrentPosition(resolve, reject" },
  @{ Name = "Permissions API does not short-circuit prompt"; Text = $app; Pattern = "navigator.permissions"; ShouldNotContain = $true },
  @{ Name = "Prompt state shows requesting permission"; Text = $app; Pattern = "Requesting location permission..." },
  @{ Name = "Permission denied has browser-neutral message"; Text = $app; Pattern = "Location access was not granted. Enable location for this browser and site, or enter a ZIP code." },
  @{ Name = "Position unavailable has specific message"; Text = $app; Pattern = "Your location could not be determined. Try again or enter a ZIP code." },
  @{ Name = "Timeout has specific message"; Text = $app; Pattern = "Location lookup timed out. Try again or enter a ZIP code." },
  @{ Name = "Unsupported browser has specific message"; Text = $app; Pattern = "Location services are not supported in this browser. Enter a ZIP code." },
  @{ Name = "Insecure context has specific message"; Text = $app; Pattern = "Location services require a secure browser connection. Enter a ZIP code." },
  @{ Name = "Reverse geocoding failure does not say denied"; Text = $app; Pattern = "could not determine the ZIP code" },
  @{ Name = "ZIP not confirmed fallback exists"; Text = $app; Pattern = "Your general area was found, but the ZIP code could not be confirmed. Enter the ZIP for more precise local pricing." },
  @{ Name = "Retry button exists"; Text = $index; Pattern = "Try Location Again" },
  @{ Name = "Manual ZIP fallback exists"; Text = $index; Pattern = "Enter ZIP Manually" },
  @{ Name = "Continue without local pricing exists"; Text = $index; Pattern = "Continue Without Local Pricing" },
  @{ Name = "Location helper text keeps location private"; Text = $index; Pattern = "Uses your approximate area for nearby price context. Precise location is not stored." },
  @{ Name = "Location state field exists"; Text = $index; Pattern = 'id="location_state"' },
  @{ Name = "Location state is sent to API"; Text = $app; Pattern = "location_state: getValue(`"location_state`")" },
  @{ Name = "Coordinates are rounded before reverse geocoding"; Text = $app; Pattern = "Math.round(latitude * 1000) / 1000" },
  @{ Name = "Browser reverse geocoding uses same-origin endpoint"; Text = $app; Pattern = 'fetch("/api/reverse-geocode"' },
  @{ Name = "Browser does not call public reverse geocoder directly"; Text = $app; Pattern = "api.bigdatacloud.net"; ShouldNotContain = $true },
  @{ Name = "Same-origin reverse geocode API exists"; Text = $reverseGeocode; Pattern = "reverse-geocode-client" },
  @{ Name = "Local server routes reverse geocode API"; Text = $server; Pattern = '/api/reverse-geocode' },
  @{ Name = "Location retry is capped"; Text = $app; Pattern = "locationFailureCount < 2" },
  @{ Name = "Precise coordinate display wording remains private"; Text = $app; Pattern = "Precise coordinates are not stored or displayed." },
  @{ Name = "Diagnostics show location state"; Text = $app; Pattern = '["Location State", diagnostics.locationStateUsed]' },
  @{ Name = "API diagnostics show location state"; Text = $api; Pattern = "locationStateUsed: locationState" },
  @{ Name = "Vercel allows first-party geolocation"; Text = $vercel; Pattern = '"Permissions-Policy"' },
  @{ Name = "Vercel geolocation policy is self only"; Text = $vercel; Pattern = '"geolocation=(self)"' }
)

$failed = @()
foreach ($check in $checks) {
  $contains = $check.Text.Contains($check.Pattern)
  if ($check.ShouldNotContain) {
    if ($contains) { $failed += $check.Name }
  } elseif (-not $contains) {
    $failed += $check.Name
  }
}

$appTitleIdMatches = [regex]::Matches($indexUtf8, '(?is)\bid\s*=\s*"app-title"')
$appTitleHeadingMatches = [regex]::Matches($indexUtf8, '(?is)<h1\b(?=[^>]*\bid\s*=\s*"app-title")[^>]*>(.*?)</h1>')
if ($appTitleIdMatches.Count -ne 1 -or $appTitleHeadingMatches.Count -ne 1) {
  $failed += 'Exactly one principal h1 heading must have id="app-title"'
} else {
  $appTitleWithoutTags = [regex]::Replace($appTitleHeadingMatches[0].Groups[1].Value, '(?is)<[^>]+>', ' ')
  $normalizedAppTitle = [regex]::Replace([System.Net.WebUtility]::HtmlDecode($appTitleWithoutTags), '\s+', ' ').Trim()
  $expectedAppTitle = "Katherine$([char]0x2019)s Eye"
  if ($normalizedAppTitle -cne $expectedAppTitle) {
    $failed += "The normalized app-title heading text must be exactly Katherine$([char]0x2019)s Eye"
  }
}

$workspaceLabelMatches = [regex]::Matches($indexUtf8, '(?is)<(?:main|section|div)\b(?=[^>]*\bclass\s*=\s*"[^"]*\bworkspace\b[^"]*")(?=[^>]*\baria-labelledby\s*=\s*"[^"]*\bapp-title\b[^"]*")[^>]*>')
if ($workspaceLabelMatches.Count -ne 1) {
  $failed += 'The main workspace must be associated with app-title through aria-labelledby'
}

$obsoletePatterns = @(
  "Listing Engine",
  "The Listing Engine",
  "Marketplace Edge",
  "Market Edge",
  "Ask Market Edge",
  "Check Market Edge"
)

foreach ($file in $activeFiles) {
  foreach ($pattern in $obsoletePatterns) {
    if ($file.Text -match [regex]::Escape($pattern)) {
      $failed += "Obsolete current brand '$pattern' found in $($file.Path)"
    }
  }
}

if ($app -match "permission.*prompt.*denied") {
  $failed += "Prompt permission state must not be treated as denied"
}

if ($app -match "getCurrentPosition" -and $app -match "window.addEventListener\(`"load`".*getCurrentPosition") {
  $failed += "Location must not be requested automatically on page load"
}

if ($app -match "coords\.(latitude|longitude).*Technical Search Details") {
  $failed += "Precise coordinates must not appear in diagnostics"
}

if ($failed.Count -gt 0) {
  Write-Error ("Brand/location static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Brand/location static checks OK - $($checks.Count) checks passed."
