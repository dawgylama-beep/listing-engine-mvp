$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$packagePath = Join-Path $root "package.json"
$lockfilePath = Join-Path $root "package-lock.json"
$playwrightCommand = Join-Path $root "node_modules\.bin\playwright.cmd"
$artifactRoot = Join-Path $root "test-results"
$expectedPlaywrightVersion = "1.62.0"
$expectedPowerShellEntryPoints = 53
$serverProcessPattern = "tests[\\/]+helpers[\\/]+browser-test-server\.mjs"

Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPEN_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SERPER_API_KEY -ErrorAction SilentlyContinue

function Require-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Get-BrowserTestServerProcesses {
  return @(
    Get-CimInstance Win32_Process -ErrorAction SilentlyContinue |
      Where-Object { $_.CommandLine -match $serverProcessPattern }
  )
}

$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json
$lockfileMetadata = (& node --input-type=module -e "import fs from 'node:fs'; const lockfile = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); console.log(JSON.stringify({ lockfileVersion: lockfile.lockfileVersion, rootPlaywright: lockfile.packages?.['']?.devDependencies?.['@playwright/test'] ?? null }));" $lockfilePath) | ConvertFrom-Json
if ($LASTEXITCODE -ne 0) {
  throw "Unable to read the npm lockfile metadata."
}
$installedPackagePath = Join-Path $root "node_modules\@playwright\test\package.json"
$installedPackage = Get-Content -LiteralPath $installedPackagePath -Raw | ConvertFrom-Json

Require-True ($package.packageManager -ceq "npm@11.16.0") "The approved npm packageManager declaration is missing."
Require-True ($package.devDependencies.'@playwright/test' -ceq $expectedPlaywrightVersion) "@playwright/test is not pinned to the expected exact version."
Require-True ($lockfileMetadata.lockfileVersion -eq 3) "The npm lockfile version is not 3."
Require-True ($lockfileMetadata.rootPlaywright -ceq $expectedPlaywrightVersion) "The lockfile root does not pin the expected @playwright/test version."
Require-True ($installedPackage.version -ceq $expectedPlaywrightVersion) "The installed @playwright/test version differs from the exact package pin."
Require-True (Test-Path -LiteralPath $playwrightCommand -PathType Leaf) "The local Playwright command is unavailable."
Require-True (@(Get-ChildItem -LiteralPath $PSScriptRoot -File -Filter "*.ps1").Count -eq $expectedPowerShellEntryPoints) "The PowerShell entry-point count is not exactly 53."

$chromiumExecutable = (& node --input-type=module -e "import { chromium } from 'playwright'; console.log(chromium.executablePath());").Trim()
if ($LASTEXITCODE -ne 0) {
  throw "Unable to resolve the installed Chromium executable."
}
Require-True ($chromiumExecutable -ne "") "Playwright returned an empty Chromium executable path."
Require-True (Test-Path -LiteralPath $chromiumExecutable -PathType Leaf) "The Playwright Chromium executable is not installed."
Require-True (-not $chromiumExecutable.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) "The browser binary must not be installed inside the repository."

$preexistingServerPids = @(Get-BrowserTestServerProcesses | Select-Object -ExpandProperty ProcessId)
$playwrightExitCode = 0
$cleanupFailures = @()

try {
  Push-Location $root
  try {
    & $playwrightCommand test --config=playwright.config.mjs
    $playwrightExitCode = $LASTEXITCODE
  } finally {
    Pop-Location
  }
} finally {
  $newServerProcesses = @(
    Get-BrowserTestServerProcesses |
      Where-Object { $preexistingServerPids -notcontains $_.ProcessId }
  )
  foreach ($process in $newServerProcesses) {
    try {
      Stop-Process -Id $process.ProcessId -Force -ErrorAction Stop
    } catch {
      $cleanupFailures += "PID $($process.ProcessId): $($_.Exception.Message)"
    }
  }
}

$remainingNewServerProcesses = @(
  Get-BrowserTestServerProcesses |
    Where-Object { $preexistingServerPids -notcontains $_.ProcessId }
)
$listener = @(Get-NetTCPConnection -LocalAddress "127.0.0.1" -LocalPort 4177 -State Listen -ErrorAction SilentlyContinue)
$screenshots = @(
  Get-ChildItem -LiteralPath $artifactRoot -Recurse -File -Filter "*.png" -ErrorAction SilentlyContinue |
    Sort-Object FullName
)
$traces = @(
  Get-ChildItem -LiteralPath $artifactRoot -Recurse -File -Filter "trace.zip" -ErrorAction SilentlyContinue |
    Sort-Object FullName
)

Write-Output "Milestone 2C-2 browser artifacts:"
foreach ($screenshot in $screenshots) {
  Write-Output "Screenshot: $($screenshot.FullName)"
}
if ($traces.Count -eq 0) {
  Write-Output "Failure traces: none retained."
} else {
  foreach ($trace in $traces) {
    Write-Output "Failure trace: $($trace.FullName)"
  }
}

Require-True ($cleanupFailures.Count -eq 0) "The test-local static server could not be cleaned up: $($cleanupFailures -join '; ')"
Require-True ($remainingNewServerProcesses.Count -eq 0) "A test-local static server process remains running."
Require-True ($listener.Count -eq 0) "The test-local static server port remains open."
Require-True ($playwrightExitCode -eq 0) "The focused Milestone 2C-2 Playwright suite failed with exit code $playwrightExitCode."

Write-Output "Milestone 2C-2 deterministic browser, DOM, and readability tests passed."
Write-Output "Provider credentials present during tests: 0."
Write-Output "The runner installed no package or browser."
Write-Output "Test-local static server processes remaining: 0."
