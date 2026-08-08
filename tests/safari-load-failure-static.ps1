param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.18"; Text = $index; Pattern = "Version 1.12.18" },
  @{ Name = "Package version is 1.12.18"; Text = $package; Pattern = '"version": "1.12.18"' },
  @{ Name = "Server version is 1.12.18"; Text = $server; Pattern = '$AppVersion = "1.12.18"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Submission stage constants exist"; Text = $app; Pattern = "const submissionStages = Object.freeze" },
  @{ Name = "Photo read stage exists"; Text = $app; Pattern = 'PHOTO_READ: "photo_read"' },
  @{ Name = "Image process stage exists"; Text = $app; Pattern = 'IMAGE_PROCESS: "image_process"' },
  @{ Name = "API request stage exists"; Text = $app; Pattern = 'API_REQUEST: "api_request"' },
  @{ Name = "API response stage exists"; Text = $app; Pattern = 'API_RESPONSE: "api_response"' },
  @{ Name = "Report render stage exists"; Text = $app; Pattern = 'REPORT_RENDER: "report_render"' },
  @{ Name = "Submit creates submission state"; Text = $app; Pattern = "const submissionState = { stage: submissionStages.IDLE }" },
  @{ Name = "Photo prep receives submission state"; Text = $app; Pattern = "const photos = await preparePhotos(photoFilesForRequest, submissionState);" },
  @{ Name = "API request stage set before fetch"; Text = $app; Pattern = "setSubmissionStage(submissionState, submissionStages.API_REQUEST);" },
  @{ Name = "API response stage set before JSON parse"; Text = $app; Pattern = "setSubmissionStage(submissionState, submissionStages.API_RESPONSE);" },
  @{ Name = "Report render stage set"; Text = $app; Pattern = "setSubmissionStage(submissionState, submissionStages.REPORT_RENDER);" },
  @{ Name = "Load failed is normalized"; Text = $app; Pattern = "/load failed/i.test(message)" },
  @{ Name = "Photo read message is friendly"; Text = $app; Pattern = "We couldn't read that photo. Please select the photo again and retry." },
  @{ Name = "Image process message is friendly"; Text = $app; Pattern = "We couldn't process that photo. Please select a different copy or screenshot of the image." },
  @{ Name = "Fetch interruption message is friendly"; Text = $app; Pattern = "The connection was interrupted before we could confirm the analysis. Please check your connection before retrying." },
  @{ Name = "Submission errors carry stage"; Text = $app; Pattern = "error.submissionStage = stage || submissionStages.IDLE;" },
  @{ Name = "Synchronous readAsDataURL errors are caught"; Text = $app; Pattern = "reader.readAsDataURL(file);" },
  @{ Name = "Async FileReader errors remain handled"; Text = $app; Pattern = 'reader.onerror = () => reject(createSubmissionError("Could not read an uploaded photo.", submissionStages.PHOTO_READ, "photo_read_failed", reader.error));' },
  @{ Name = "Image decode errors are handled"; Text = $app; Pattern = 'image.onerror = () => reject(createSubmissionError("Could not process an uploaded photo.", submissionStages.IMAGE_PROCESS, "image_decode_failed"));' },
  @{ Name = "Canvas resize errors are handled"; Text = $app; Pattern = 'reject(createSubmissionError("Could not process an uploaded photo.", submissionStages.IMAGE_PROCESS, "image_resize_failed", error));' },
  @{ Name = "Failed submission renders empty state"; Text = $app; Pattern = "renderEmpty(config);" },
  @{ Name = "Empty state disables Copy All"; Text = $app; Pattern = "copyAllButton.disabled = true;" },
  @{ Name = "Empty state clears latest report"; Text = $app; Pattern = "latestReport = null;" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$handleSubmit = [regex]::Match($app, "async function handleSubmit\(event\) \{(?<body>[\s\S]*?)\r?\n\}\r?\n\r?\nfunction getSelectedWorkflow")
if (-not $handleSubmit.Success) {
  $failed += "handleSubmit should be inspectable"
} else {
  $body = $handleSubmit.Groups["body"].Value
  $prepareIndex = $body.IndexOf("const photos = await preparePhotos(photoFilesForRequest, submissionState);")
  $fetchIndex = $body.IndexOf('fetch("/api/generate-listing"')
  $requestStageIndex = $body.IndexOf("setSubmissionStage(submissionState, submissionStages.API_REQUEST);")
  $responseStageIndex = $body.IndexOf("setSubmissionStage(submissionState, submissionStages.API_RESPONSE);")
  $jsonIndex = $body.IndexOf("data = await response.json();")
  $catchIndex = $body.IndexOf("renderEmpty(config);")

  if ($prepareIndex -lt 0 -or $fetchIndex -lt 0 -or $prepareIndex -gt $fetchIndex) {
    $failed += "Photo preparation must complete before the API fetch can begin"
  }
  if ($requestStageIndex -lt 0 -or $requestStageIndex -gt $fetchIndex) {
    $failed += "API request stage must be set before fetch"
  }
  if ($responseStageIndex -lt 0 -or $jsonIndex -lt 0 -or $responseStageIndex -gt $jsonIndex) {
    $failed += "API response stage must be set before response parsing"
  }
  if (([regex]::Matches($body, 'fetch\("/api/generate-listing"')).Count -ne 1) {
    $failed += "Main submission must not automatically retry the API request"
  }
  if ($catchIndex -lt 0 -or $body.Substring($catchIndex) -match "copyAllButton\.disabled\s*=\s*false|renderReport\(") {
    $failed += "Failed submission must not present a completed report or enable Copy All"
  }
  if ($body.Substring($catchIndex) -match "selectedPhotoFiles\s*=\s*\[\]") {
    $failed += "Failed submission must preserve selected-photo state"
  }
}

$resizeImage = [regex]::Match($app, "function resizeImage\(file, submissionState = null, maxBytes = MAX_PROCESSED_PHOTO_BYTES\) \{(?<body>[\s\S]*?)\n\}")
if (-not $resizeImage.Success) {
  $failed += "resizeImage should be inspectable"
} else {
  $body = $resizeImage.Groups["body"].Value
  if ($body -notmatch "try\s*\{\s*reader\.readAsDataURL\(file\);[\s\S]*?\}\s*catch \(error\)") {
    $failed += "readAsDataURL must be wrapped in try/catch"
  }
  if ($body -match 'fetch\(|generate-listing|serper|google\.serper') {
    $failed += "Photo preparation failure path must not invoke backend or Serper"
  }
}

$friendly = [regex]::Match($app, "function getFriendlyErrorMessage\(error, config, submissionState = \{\}\) \{(?<body>[\s\S]*?)\r?\n\}\r?\n\r?\nfunction toggleFeedbackPanel")
if (-not $friendly.Success) {
  $failed += "getFriendlyErrorMessage should be inspectable"
} else {
  $body = $friendly.Groups["body"].Value
  $loadIndex = $body.IndexOf("/load failed/i.test(message)")
  $genericReturnIndex = $body.IndexOf('return `${config.errorMessage}')
  if ($loadIndex -lt 0 -or $genericReturnIndex -lt 0 -or $loadIndex -gt $genericReturnIndex) {
    $failed += "Raw Load failed must be normalized before the generic safe-message return"
  }
  if ($body -match 'return\s+message|return\s+["'']Load failed["'']') {
    $failed += "Raw provider or Load failed text must never be returned directly"
  }
}

if ($app -notmatch 'apiError\.code\s*=\s*String\(data\.code\s*\|\|\s*["'']["'']\)' -or $app -notmatch 'analysis_input_too_large') {
  $failed += "Customer-safe oversized-input response codes must reach the friendly error mapper"
}

if ($failed.Count -gt 0) {
  Write-Error ("Safari load-failure static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Safari load-failure static checks OK - $($checks.Count) checks passed."
