$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
  node .\tests\modular-evidence-foundation.mjs
  if ($LASTEXITCODE -ne 0) {
    throw "modular-evidence-foundation.mjs failed with exit code $LASTEXITCODE"
  }
} finally {
  Pop-Location
}
