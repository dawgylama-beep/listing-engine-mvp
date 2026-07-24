$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPEN_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPENAI_MODEL -ErrorAction SilentlyContinue
Remove-Item Env:SERPER_API_KEY -ErrorAction SilentlyContinue

& node --test `
  (Join-Path $PSScriptRoot "final-evidence-validation.test.mjs") `
  (Join-Path $PSScriptRoot "hard-network-denial.test.mjs") `
  (Join-Path $PSScriptRoot "production-handler-serialization.test.mjs")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
