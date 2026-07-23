$ErrorActionPreference = "Stop"

$testPath = Join-Path $PSScriptRoot "canonical-final-evidence-pipeline.mjs"
node $testPath
if ($LASTEXITCODE -ne 0) {
  throw "canonical finalized evidence pipeline deterministic acceptance failed"
}
