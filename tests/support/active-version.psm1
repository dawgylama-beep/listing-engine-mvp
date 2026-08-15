Set-StrictMode -Version Latest

function Get-ActiveVersionExpectations {
  [CmdletBinding()]
  param()

  $testsDirectory = Split-Path -Parent $PSScriptRoot
  $repositoryRoot = Split-Path -Parent $testsDirectory
  $packagePath = Join-Path $repositoryRoot "package.json"

  if (-not (Test-Path -LiteralPath $packagePath -PathType Leaf)) {
    throw "Canonical package data is missing."
  }

  try {
    $packageText = Get-Content -LiteralPath $packagePath -Raw -ErrorAction Stop
    $package = $packageText | ConvertFrom-Json -ErrorAction Stop
  } catch {
    throw "Canonical package data is unreadable or malformed."
  }

  $versionProperty = $package.PSObject.Properties["version"]
  if ($null -eq $versionProperty -or $versionProperty.Value -isnot [string]) {
    throw "Canonical package version must be a string."
  }

  $activeVersion = [string]$versionProperty.Value
  if ($activeVersion -notmatch '^\d+\.\d+\.\d+$') {
    throw "Canonical package version must be a complete numeric semantic version."
  }

  $idx = "Version $activeVersion"
  $pkg = '"version": "' + $activeVersion + '"'
  $srv = '$AppVersion = "' + $activeVersion + '"'

  return [pscustomobject][ordered]@{
    ActiveVersion = $activeVersion
    IDX = $idx
    PKG = $pkg
    SRV = $srv
    IDXPattern = [regex]::Escape($idx)
    PKGPattern = [regex]::Escape($pkg)
    SRVPattern = [regex]::Escape($srv)
  }
}

Export-ModuleMember -Function Get-ActiveVersionExpectations
