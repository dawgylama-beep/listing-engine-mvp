param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.10.9"; Text = $index; Pattern = "Version 1.10.9" },
  @{ Name = "Package version is 1.10.9"; Text = $package; Pattern = '"version": "1.10.9"' },
  @{ Name = "Server version is 1.10.9"; Text = $server; Pattern = '$AppVersion = "1.10.9"' },
  @{ Name = "Roadmap documents photo hotfix"; Text = $roadmap; Pattern = "Version 1.10.9 (Completed)" },
  @{ Name = "Photo library input keeps multiple attribute"; Text = $index; Pattern = 'id="photos" name="photos" type="file" accept="image/*" multiple' },
  @{ Name = "Camera input remains camera capture"; Text = $index; Pattern = 'id="camera-photo" type="file" accept="image/*" capture="environment"' },
  @{ Name = "Shared selected photo state exists"; Text = $app; Pattern = "let selectedPhotoFiles = [];" },
  @{ Name = "Six-photo limit remains explicit"; Text = $app; Pattern = "const MAX_PHOTO_COUNT = 6;" },
  @{ Name = "Library change handler is used"; Text = $app; Pattern = 'photosInput.addEventListener("change", handleLibraryPhotoChange)' },
  @{ Name = "Library handler reads every selected file"; Text = $app; Pattern = "Array.from(photosInput.files || [])" },
  @{ Name = "Library handler appends through shared helper"; Text = $app; Pattern = "appendSelectedPhotoFiles(files);" },
  @{ Name = "Library input is cleared after ingest"; Text = $app; Pattern = 'photosInput.value = "";' },
  @{ Name = "Camera handler appends through shared helper"; Text = $app; Pattern = "function handleCameraPhotoChange()" },
  @{ Name = "Duplicate guard uses file signatures"; Text = $app; Pattern = "getPhotoFileSignature" },
  @{ Name = "Duplicate guard considers size"; Text = $app; Pattern = "file.size || 0" },
  @{ Name = "Duplicate guard considers last modified"; Text = $app; Pattern = "file.lastModified || 0" },
  @{ Name = "Duplicate guard considers MIME type"; Text = $app; Pattern = 'file.type || "unknown-type"' },
  @{ Name = "Append preserves order"; Text = $app; Pattern = "selectedPhotoFiles = [...selectedPhotoFiles, ...additions].slice(0, MAX_PHOTO_COUNT);" },
  @{ Name = "Preview renders selected photo state"; Text = $app; Pattern = "const files = getSelectedPhotoFiles();" },
  @{ Name = "Remove deletes one selected-photo index"; Text = $app; Pattern = "selectedPhotoFiles.splice(index, 1);" },
  @{ Name = "Request uses retained photo order"; Text = $app; Pattern = "const photoFilesForRequest = getSelectedPhotoFiles();" },
  @{ Name = "Prepared photos use retained photo order"; Text = $app; Pattern = "const photos = await preparePhotos(photoFilesForRequest, submissionState);" },
  @{ Name = "New item clears photo state"; Text = $app; Pattern = "selectedPhotoFiles = [];" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($app.Contains('photosInput.addEventListener("change", renderPhotoPreview)')) {
  $failed += "Photo library must not use render-only change handler"
}

if ($app.Contains("DataTransfer")) {
  $failed += "Removal must not depend on rewriting native FileList with DataTransfer"
}

if ($app.Contains("cameraPhotoFiles")) {
  $failed += "Old camera-only file state should not remain"
}

$libraryHandlerMatch = [regex]::Match($app, "function handleLibraryPhotoChange\(\) \{(?<body>[\s\S]*?)\n\}")
if (-not $libraryHandlerMatch.Success) {
  $failed += "Library handler body should be inspectable"
} else {
  $libraryBody = $libraryHandlerMatch.Groups["body"].Value
  if ($libraryBody -match "fetch\(|startWorkflowRequest|handleSubmit|submit\(") {
    $failed += "Selecting photos must not trigger report generation"
  }
}

if ($app -match "SERPER_API_KEY|google\.serper\.dev|X-API-KEY") {
  $failed += "Frontend must not contain Serper key, endpoint, or auth header"
}

if ($failed.Count -gt 0) {
  Write-Error ("Photo multi-upload static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Photo multi-upload static checks OK - $($checks.Count) checks passed."
