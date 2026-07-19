param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $nodePath = $node.Source
} else {
  $nodePath = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
}

if (-not (Test-Path -LiteralPath $nodePath)) {
  throw "Node.js is required for final failed-gate audit checks and was not found."
}

& $nodePath (Join-Path $PSScriptRoot "final-failed-gate-audit.mjs")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
