$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPEN_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SERPER_API_KEY -ErrorAction SilentlyContinue

& node (Join-Path $PSScriptRoot "final-evidence-boundary.mjs")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

& node (Join-Path $PSScriptRoot "canonical-recovery-alignment.test.mjs")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
