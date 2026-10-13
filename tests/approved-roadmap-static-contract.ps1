$ErrorActionPreference = 'Stop'
$repository = Split-Path -Parent $PSScriptRoot
$source = Get-Content (Join-Path $PSScriptRoot 'milestone-2c1-canonical-customer-evidence.ps1') -Raw
$start = $source.IndexOf('if ($changed -contains "PRODUCT_ROADMAP.md") {')
$end = $source.IndexOf('$gitProductionDiff =', $start)
$contract = [scriptblock]::Create($source.Substring($start, $end - $start))
$original = [IO.File]::ReadAllBytes((Join-Path $repository 'PRODUCT_ROADMAP.md'))
$root = Join-Path $env:TEMP ('katherine-offline-roadmap-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $root | Out-Null
$roadmap = Join-Path $root 'PRODUCT_ROADMAP.md'
$package = [pscustomobject]@{version='1.12.52'}
$changed = @('PRODUCT_ROADMAP.md')
$heading = '+## Version 1.12.52 (Bounded object and offer discovery candidate; unpublished)'
function Require-True([bool]$Condition, [string]$Message) { if (!$Condition) { throw $Message } }
function Invoke-TestGit { param($WorkingDirectory, $Arguments) [pscustomobject]@{StandardOutput=$script:fixtureDiff} }
$passed=0
try {
 [IO.File]::WriteAllBytes($roadmap, $original)
 $script:fixtureDiff=$heading
 & $contract
 $passed++
 foreach($kind in @('duplicate','removed-history','missing','unrelated-completed','altered-scope','wrong-version')) {
  [IO.File]::WriteAllBytes($roadmap, $original)
  $script:fixtureDiff=$heading
  switch($kind) {
   duplicate {$script:fixtureDiff="$heading`n$heading"}
   removed-history {$script:fixtureDiff="$heading`n-## Historical release"}
   missing {$script:fixtureDiff='+Unrelated text'}
   unrelated-completed {$script:fixtureDiff="$heading`n+## Version 1.12.52 (Completed)"}
   altered-scope {[IO.File]::AppendAllText($roadmap,"`n## Unrelated feature`n"); $script:fixtureDiff="$heading`n+## Unrelated feature"}
   wrong-version {$package.version='9.9.9'}
  }
  $refused=$false
  try { & $contract } catch { $refused=$true }
  if (!$refused) { throw "Roadmap negative control accepted: $kind" }
  $package.version='1.12.52'
  $passed++
 }
 Write-Output "Approved roadmap contract: $passed/7 passed; exact frozen scope accepted, all mutations refused."
} finally {
 if (Test-Path -LiteralPath $roadmap) { Remove-Item -LiteralPath $roadmap }
 Remove-Item -LiteralPath $root
}
