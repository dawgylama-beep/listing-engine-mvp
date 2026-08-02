function ConvertTo-TestNativeArgument {
  param(
    [Parameter(Mandatory = $true)]
    [AllowEmptyString()]
    [string]$Value
  )

  if ($Value.Length -gt 0 -and $Value -notmatch '[\s"]') {
    return $Value
  }

  $builder = New-Object System.Text.StringBuilder
  [void]$builder.Append('"')
  $backslashCount = 0

  foreach ($character in $Value.ToCharArray()) {
    if ($character -eq '\') {
      $backslashCount += 1
      continue
    }

    if ($character -eq '"') {
      [void]$builder.Append(('\' * (($backslashCount * 2) + 1)))
      [void]$builder.Append('"')
      $backslashCount = 0
      continue
    }

    if ($backslashCount -gt 0) {
      [void]$builder.Append(('\' * $backslashCount))
      $backslashCount = 0
    }
    [void]$builder.Append($character)
  }

  if ($backslashCount -gt 0) {
    [void]$builder.Append(('\' * ($backslashCount * 2)))
  }
  [void]$builder.Append('"')
  return $builder.ToString()
}

function Invoke-TestGit {
  param(
    [Parameter(Mandatory = $true)]
    [string]$WorkingDirectory,

    [Parameter(Mandatory = $true)]
    [string[]]$Arguments
  )

  $gitExecutable = (Get-Command git.exe -CommandType Application -ErrorAction Stop | Select-Object -First 1).Source
  $nativeArguments = @($Arguments | ForEach-Object { ConvertTo-TestNativeArgument -Value $_ }) -join ' '
  $displayWorkingDirectory = ConvertTo-TestNativeArgument -Value $WorkingDirectory
  $displayCommand = "git -C $displayWorkingDirectory $nativeArguments".TrimEnd()

  $startInfo = New-Object System.Diagnostics.ProcessStartInfo
  $startInfo.FileName = $gitExecutable
  $startInfo.Arguments = $nativeArguments
  $startInfo.WorkingDirectory = $WorkingDirectory
  $startInfo.UseShellExecute = $false
  $startInfo.CreateNoWindow = $true
  $startInfo.RedirectStandardOutput = $true
  $startInfo.RedirectStandardError = $true

  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  if ($startInfo.PSObject.Properties.Name -contains 'StandardOutputEncoding') {
    $startInfo.StandardOutputEncoding = $utf8NoBom
  }
  if ($startInfo.PSObject.Properties.Name -contains 'StandardErrorEncoding') {
    $startInfo.StandardErrorEncoding = $utf8NoBom
  }

  $process = New-Object System.Diagnostics.Process
  $process.StartInfo = $startInfo
  try {
    if (-not $process.Start()) {
      throw "Native Git command did not start.`nCommand: $displayCommand"
    }

    $standardOutputTask = $process.StandardOutput.ReadToEndAsync()
    $standardErrorTask = $process.StandardError.ReadToEndAsync()
    $process.WaitForExit()
    $standardOutput = $standardOutputTask.Result
    $standardError = $standardErrorTask.Result
    $exitCode = $process.ExitCode
  } finally {
    $process.Dispose()
  }

  if ($exitCode -ne 0) {
    $errorDiagnostic = if ([string]::IsNullOrWhiteSpace($standardError)) {
      '<empty>'
    } else {
      $standardError.TrimEnd("`r", "`n")
    }
    throw "Native Git command failed.`nCommand: $displayCommand`nExit code: $exitCode`nStderr:`n$errorDiagnostic"
  }

  if (-not [string]::IsNullOrWhiteSpace($standardError)) {
    Write-Warning "Native Git advisory from $displayCommand`:`n$($standardError.TrimEnd("`r", "`n"))"
  }

  [pscustomobject]@{
    Command = $displayCommand
    ExitCode = $exitCode
    StandardOutput = $standardOutput
    StandardError = $standardError
  }
}
