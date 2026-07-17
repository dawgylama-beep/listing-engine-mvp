param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.11.7"; Text = $index; Pattern = "Version 1.11.7" },
  @{ Name = "Package version is 1.11.7"; Text = $package; Pattern = '"version": "1.11.7"' },
  @{ Name = "Server version is 1.11.7"; Text = $server; Pattern = '$AppVersion = "1.11.7"' },
  @{ Name = "Roadmap documents compact photo controls"; Text = $roadmap; Pattern = "Photo controls are compacted into camera and library actions" },
  @{ Name = "Photo actions wrapper exists"; Text = $index; Pattern = "photo-inputs photo-actions" },
  @{ Name = "Camera action is explicit"; Text = $index; Pattern = "<span>Take Photo</span>" },
  @{ Name = "Library action is explicit"; Text = $index; Pattern = "<span>Choose from Library</span>" },
  @{ Name = "Camera capture remains enabled"; Text = $index; Pattern = 'capture="environment"' },
  @{ Name = "Library input remains multi-file"; Text = $index; Pattern = 'id="photos" class="visually-hidden-file" name="photos" type="file" accept="image/*" multiple' },
  @{ Name = "Native file inputs are visually hidden"; Text = $styles; Pattern = ".visually-hidden-file" },
  @{ Name = "Compact photo control style exists"; Text = $styles; Pattern = ".compact-photo-control" },
  @{ Name = "Mobile photo actions become one column"; Text = $styles; Pattern = ".photo-actions" },
  @{ Name = "Six-photo limit remains"; Text = $app; Pattern = "const MAX_PHOTO_COUNT = 6;" },
  @{ Name = "Remove photo helper remains"; Text = $app; Pattern = "function removePhotoAt" },
  @{ Name = "Compact empty-state class exists"; Text = $app; Pattern = "compact-empty-card" },
  @{ Name = "Compact empty-state copy exists"; Text = $app; Pattern = 'copy.textContent = "Your recommendation will appear here after analysis."' },
  @{ Name = "Compact empty-state helper exists"; Text = $app; Pattern = 'helper.textContent = "Add clear photos and any details you know."' },
  @{ Name = "Desktop empty state is compact"; Text = $styles; Pattern = "min-height: 150px;" },
  @{ Name = "Mobile empty state is compact"; Text = $styles; Pattern = "min-height: 130px;" },
  @{ Name = "Report actions start hidden"; Text = $index; Pattern = 'id="output-actions" class="output-actions" hidden' },
  @{ Name = "Report actions hide before report"; Text = $app; Pattern = "setReportActionsVisible(false);" },
  @{ Name = "Report actions show after report"; Text = $app; Pattern = "setReportActionsVisible(true);" },
  @{ Name = "Technical details renderer remains collapsed"; Text = $app; Pattern = "function renderTechnicalSearchDetails" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($app.Contains('steps.className = "first-run-steps"')) {
  $failed += "Large first-run step list must not return"
}

if ($app.Contains('title.textContent = "Ready when your photos are."')) {
  $failed += "Old empty-state title must not return"
}

if ($index.Contains("Upload Photos")) {
  $failed += "Old upload-photo button label must not return"
}

$technicalMatch = [regex]::Match($app, "function renderTechnicalSearchDetails\(value\) \{(?<body>[\s\S]*?)\n\}")
if (-not $technicalMatch.Success) {
  $failed += "Technical details function should be inspectable"
} elseif ($technicalMatch.Groups["body"].Value -match "\.open\s*=\s*true") {
  $failed += "Technical Search Details must stay collapsed by default"
}

if ($failed.Count -gt 0) {
  Write-Error ("Mobile UI static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Mobile UI static checks OK - $($checks.Count) checks passed."
