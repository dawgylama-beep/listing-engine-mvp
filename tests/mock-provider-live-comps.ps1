param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Mock provider live comps checks skipped - Node.js is not available in this local shell."
  exit 0
}

& $node.Source (Join-Path $PSScriptRoot "mock-provider-live-comps.mjs")
