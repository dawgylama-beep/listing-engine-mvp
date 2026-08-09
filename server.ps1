param(
  [int]$Port = 5175,
  [switch]$Check
)

$RootDir = $PSScriptRoot
$PublicDir = Join-Path $RootDir "public"
$MaxBodyBytes = 30 * 1024 * 1024
$AppVersion = "1.12.22"
$LocalBridgeProtocolVersion = 1
$LocalBridgePath = Join-Path $RootDir "scripts\local-generate-listing-bridge.mjs"
$LocalBridgeMaximumEnvelopeCharacters = 64 * 1024 * 1024
$LocalBridgeDefaultTimeoutMilliseconds = 240000
$OversizedRequestDrainBufferBytes = 8192
$OversizedRequestDrainTimeoutMilliseconds = 1000


function Handle-Client {
  param([System.Net.Sockets.TcpClient]$Client)

  $Client.ReceiveTimeout = 10000
  $Client.SendTimeout = 10000
  $Stream = $Client.GetStream()
  $Stream.ReadTimeout = 10000
  $Stream.WriteTimeout = 10000
  try {
    $Request = Read-HttpRequest $Stream
    if ($null -eq $Request) {
      return
    }
    if ($Request.IsOversizedRequest) {
      try {
        Complete-OversizedRequest $Client $Stream $Request
      } catch {
        Write-Host "Oversized request response transport ended."
      }
      return
    }

    Route-Request $Stream $Request
  } catch {
    if ($_.Exception.Message -eq "Request body is too large.") {
      try {
        Send-Json $Stream 413 @{
          error = "Request body is too large."
          code = "request_body_too_large"
        }
      } catch {
      }
    } else {
      Write-Host "Local request transport failed."
      try {
        Send-Json $Stream 500 @{ error = "Something went wrong while generating the listing." }
      } catch {
      }
    }
  } finally {
    $Stream.Close()
    $Client.Close()
  }
}

function Complete-OversizedRequest {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [System.Net.Sockets.NetworkStream]$Stream,
    $Request
  )

  Send-Json $Stream 413 @{
    error = "Request body is too large."
    code = "request_body_too_large"
  }
  $Stream.Flush()

  try {
    $Client.Client.Shutdown([System.Net.Sockets.SocketShutdown]::Send)
  } catch {
  }

  Drain-OversizedRequestBody $Client $Stream $Request.DeclaredContentLength $Request.BufferedBodyByteCount
}

function Drain-OversizedRequestBody {
  param(
    [System.Net.Sockets.TcpClient]$Client,
    [System.Net.Sockets.NetworkStream]$Stream,
    [long]$DeclaredContentLength,
    [long]$BufferedBodyByteCount
  )

  $RemainingBytes = [Math]::Max([long]0, $DeclaredContentLength - $BufferedBodyByteCount)
  if ($RemainingBytes -le 0) {
    return
  }

  $Buffer = New-Object byte[] $OversizedRequestDrainBufferBytes
  $Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    while (
      $RemainingBytes -gt 0 -and
      $Stopwatch.ElapsedMilliseconds -lt $OversizedRequestDrainTimeoutMilliseconds
    ) {
      $AvailableBytes = $Client.Available
      if ($AvailableBytes -gt 0) {
        $ReadSize = [int][Math]::Min(
          [long]$Buffer.Length,
          [Math]::Min([long]$AvailableBytes, $RemainingBytes)
        )
        $Read = $Stream.Read($Buffer, 0, $ReadSize)
        if ($Read -le 0) {
          break
        }
        $RemainingBytes -= $Read
        continue
      }

      if (
        $Client.Client.Poll(0, [System.Net.Sockets.SelectMode]::SelectRead) -and
        $Client.Available -eq 0
      ) {
        break
      }
      Start-Sleep -Milliseconds 5
    }
  } catch {
  } finally {
    $Stopwatch.Stop()
  }
}

function Route-Request {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    $Request
  )

  if ($Request.Method -eq "POST" -and $Request.Path -eq "/api/generate-listing") {
    Invoke-LocalGenerateListingHandler $Stream $Request
    return
  }

  if ($Request.Method -eq "POST" -and $Request.Path -eq "/api/reverse-geocode") {
    Handle-ReverseGeocode $Stream $Request
    return
  }

  if ($Request.Method -eq "GET") {
    Serve-Static $Stream $Request.Path
    return
  }

  Send-Json $Stream 405 @{ error = "Method not allowed." }
}

function Get-LocalNodeExecutable {
  $ConfiguredExecutable = [System.Environment]::GetEnvironmentVariable("KATHERINES_EYE_NODE_EXECUTABLE", "Process")
  if ($ConfiguredExecutable) {
    $ConfiguredExecutable = $ConfiguredExecutable.Trim()
    if ([System.IO.Path]::IsPathRooted($ConfiguredExecutable)) {
      if (-not (Test-Path -LiteralPath $ConfiguredExecutable -PathType Leaf)) {
        throw "Configured Node executable is unavailable."
      }
      return [System.IO.Path]::GetFullPath($ConfiguredExecutable)
    }

    $ConfiguredCommand = Get-Command $ConfiguredExecutable -CommandType Application -ErrorAction SilentlyContinue
    if ($null -eq $ConfiguredCommand) {
      throw "Configured Node executable is unavailable."
    }
    return $ConfiguredCommand.Source
  }

  $NodeCommand = Get-Command "node" -CommandType Application -ErrorAction SilentlyContinue
  if ($null -eq $NodeCommand) {
    throw "Node executable is unavailable."
  }
  return $NodeCommand.Source
}

function Get-LocalBridgeTimeoutMilliseconds {
  $TimeoutMilliseconds = $LocalBridgeDefaultTimeoutMilliseconds
  $ConfiguredTimeout = [System.Environment]::GetEnvironmentVariable("KATHERINES_EYE_BRIDGE_TIMEOUT_MS", "Process")
  if ($ConfiguredTimeout) {
    $ParsedTimeout = 0
    if (
      [int]::TryParse($ConfiguredTimeout, [ref]$ParsedTimeout) -and
      $ParsedTimeout -ge 100 -and
      $ParsedTimeout -le 600000
    ) {
      $TimeoutMilliseconds = $ParsedTimeout
    }
  }
  return $TimeoutMilliseconds
}

function Get-BridgeRequestHeaders {
  param($Headers)

  $AllowedHeaders = @(
    "Accept",
    "Accept-Language",
    "Content-Type",
    "Origin",
    "User-Agent",
    "X-Requested-With"
  )
  $SafeHeaders = [ordered]@{}
  foreach ($HeaderName in $AllowedHeaders) {
    if ($Headers.ContainsKey($HeaderName)) {
      $HeaderValue = [string]$Headers[$HeaderName]
      if ($HeaderValue.Length -le 8192 -and $HeaderValue -notmatch "[\r\n]") {
        $SafeHeaders[$HeaderName.ToLowerInvariant()] = $HeaderValue
      }
    }
  }
  return $SafeHeaders
}

function Invoke-LocalGenerateListingBridge {
  param($Request)

  if (-not (Test-Path -LiteralPath $LocalBridgePath -PathType Leaf)) {
    throw "Local handler bridge is unavailable."
  }

  $BodyBytes = [byte[]]$Request.BodyBytes
  if ($BodyBytes.Length -gt $MaxBodyBytes) {
    throw "Request body is too large."
  }

  $Envelope = [ordered]@{
    protocolVersion = $LocalBridgeProtocolVersion
    method = [string]$Request.Method
    url = [string]$Request.Url
    headers = Get-BridgeRequestHeaders $Request.Headers
    rawBodyBase64 = [System.Convert]::ToBase64String($BodyBytes)
    correlationId = "ke-local-$([guid]::NewGuid().ToString('N'))"
  }
  $EnvelopeJson = $Envelope | ConvertTo-Json -Depth 8 -Compress
  $EnvelopeBytes = [System.Text.Encoding]::UTF8.GetBytes($EnvelopeJson)
  if ($EnvelopeBytes.Length -gt (44 * 1024 * 1024)) {
    throw "Local handler request envelope is too large."
  }

  $NodeExecutable = Get-LocalNodeExecutable
  if ($LocalBridgePath.Contains('"')) {
    throw "Local handler bridge path is invalid."
  }

  $StartInfo = [System.Diagnostics.ProcessStartInfo]::new()
  $StartInfo.FileName = $NodeExecutable
  $StartInfo.Arguments = "`"$LocalBridgePath`""
  $StartInfo.WorkingDirectory = $RootDir
  $StartInfo.UseShellExecute = $false
  $StartInfo.CreateNoWindow = $true
  $StartInfo.RedirectStandardInput = $true
  $StartInfo.RedirectStandardOutput = $true
  $StartInfo.RedirectStandardError = $true
  $Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  if ($StartInfo.PSObject.Properties.Name -contains "StandardOutputEncoding") {
    $StartInfo.StandardOutputEncoding = $Utf8NoBom
  }
  if ($StartInfo.PSObject.Properties.Name -contains "StandardErrorEncoding") {
    $StartInfo.StandardErrorEncoding = $Utf8NoBom
  }

  $Process = [System.Diagnostics.Process]::new()
  $Process.StartInfo = $StartInfo
  $Started = $false
  try {
    $Started = $Process.Start()
    if (-not $Started) {
      throw "Local handler bridge did not start."
    }

    $StandardOutputTask = $Process.StandardOutput.ReadToEndAsync()
    $StandardErrorTask = $Process.StandardError.ReadToEndAsync()
    $Process.StandardInput.BaseStream.Write($EnvelopeBytes, 0, $EnvelopeBytes.Length)
    $Process.StandardInput.BaseStream.Flush()
    $Process.StandardInput.Close()

    $Completed = $Process.WaitForExit((Get-LocalBridgeTimeoutMilliseconds))
    if (-not $Completed) {
      try {
        $Process.Kill()
      } catch {
      }
      $Process.WaitForExit()
      throw "Local handler bridge timed out."
    }

    $Process.WaitForExit()
    $StandardOutput = $StandardOutputTask.Result
    $null = $StandardErrorTask.Result
    if ($Process.ExitCode -ne 0) {
      throw "Local handler bridge exited unsuccessfully."
    }
    if (
      [string]::IsNullOrWhiteSpace($StandardOutput) -or
      $StandardOutput.Length -gt $LocalBridgeMaximumEnvelopeCharacters
    ) {
      throw "Local handler bridge returned an invalid response."
    }

    try {
      $BridgeResponse = $StandardOutput | ConvertFrom-Json
    } catch {
      throw "Local handler bridge returned malformed protocol output."
    }
    if (
      $null -eq $BridgeResponse -or
      [int]$BridgeResponse.protocolVersion -ne $LocalBridgeProtocolVersion -or
      $null -eq $BridgeResponse.statusCode -or
      $null -eq $BridgeResponse.headers -or
      $null -eq $BridgeResponse.rawBodyBase64
    ) {
      throw "Local handler bridge returned a protocol mismatch."
    }

    $StatusCode = 0
    if (
      -not [int]::TryParse([string]$BridgeResponse.statusCode, [ref]$StatusCode) -or
      $StatusCode -lt 100 -or
      $StatusCode -gt 599
    ) {
      throw "Local handler bridge returned an invalid status."
    }
    try {
      $ResponseBytes = [System.Convert]::FromBase64String([string]$BridgeResponse.rawBodyBase64)
    } catch {
      throw "Local handler bridge returned an invalid response body."
    }
    if ($ResponseBytes.Length -gt $MaxBodyBytes) {
      throw "Local handler bridge response is too large."
    }

    $ResponseHeaders = [ordered]@{}
    foreach ($Property in $BridgeResponse.headers.PSObject.Properties) {
      $HeaderName = [string]$Property.Name
      $HeaderValue = [string]$Property.Value
      if (
        $HeaderName -match "^(?i:cache-control|content-language|content-type|etag|last-modified|retry-after|vary|x-request-id)$" -and
        $HeaderValue.Length -le 8192 -and
        $HeaderValue -notmatch "[\r\n]"
      ) {
        $ResponseHeaders[$HeaderName] = $HeaderValue
      }
    }

    return @{
      StatusCode = $StatusCode
      Headers = $ResponseHeaders
      BodyBytes = $ResponseBytes
    }
  } finally {
    if ($Started -and -not $Process.HasExited) {
      try {
        $Process.Kill()
      } catch {
      }
      try {
        $Process.WaitForExit()
      } catch {
      }
    }
    if ($Started) {
      try {
        $Process.StandardInput.Dispose()
      } catch {
      }
      try {
        $Process.StandardOutput.Dispose()
      } catch {
      }
      try {
        $Process.StandardError.Dispose()
      } catch {
      }
    }
    $Process.Dispose()
  }
}

function Invoke-LocalGenerateListingHandler {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    $Request
  )

  try {
    $BridgeResponse = Invoke-LocalGenerateListingBridge $Request
  } catch {
    if ($_.Exception.Message -eq "Request body is too large.") {
      try {
        Send-Json $Stream 413 @{
          error = "Request body is too large."
          code = "request_body_too_large"
        }
      } catch {
      }
      return
    }
    Write-Host "Local production-handler bridge failed closed."
    try {
      Send-Json $Stream 502 @{
        error = "Local analysis transport failed."
        code = "local_handler_transport_error"
      }
    } catch {
    }
    return
  }

  try {
    Send-HandlerBytes $Stream $BridgeResponse.StatusCode $BridgeResponse.Headers $BridgeResponse.BodyBytes
  } catch {
    Write-Host "Local handler response write was cancelled."
  }
}


function Handle-ReverseGeocode {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    $Request
  )

  try {
    $Body = $Request.Body | ConvertFrom-Json
  } catch {
    Send-Json $Stream 400 @{ error = "Request body must be valid JSON." }
    return
  }

  $Latitude = [double]::NaN
  $Longitude = [double]::NaN
  if (-not [double]::TryParse([string]$Body.latitude, [ref]$Latitude) -or -not [double]::TryParse([string]$Body.longitude, [ref]$Longitude)) {
    Send-Json $Stream 400 @{ error = "Valid rounded coordinates are required." }
    return
  }

  $RoundedLatitude = [Math]::Round($Latitude, 3)
  $RoundedLongitude = [Math]::Round($Longitude, 3)
  try {
    $Url = "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=$([uri]::EscapeDataString([string]$RoundedLatitude))&longitude=$([uri]::EscapeDataString([string]$RoundedLongitude))&localityLanguage=en"
    $Response = Invoke-RestMethod -Method Get -Uri $Url -TimeoutSec 8
    $Zip = ""
    if ([string]$Response.postcode -match "\b\d{5}(?:-\d{4})?\b") {
      $Zip = $Matches[0]
    }
    $CityValue = if ($Response.city) { $Response.city } elseif ($Response.locality) { $Response.locality } else { $Response.principalSubdivision }
    $StateValue = if ($Response.principalSubdivisionCode) { $Response.principalSubdivisionCode } else { $Response.principalSubdivision }
    $City = Clean-Text $CityValue
    $State = (Clean-Text $StateValue) -replace "^US-", ""
    $Label = (($City, $State, $Zip) | Where-Object { $_ }) -join " "
    if (-not $Zip -and -not $Label) {
      Send-Json $Stream 422 @{ error = "Reverse geocoder response did not include a ZIP or general area." }
      return
    }
    Send-Json $Stream 200 @{ zip = $Zip; city = $City; state = $State; label = $Label }
  } catch {
    Send-Json $Stream 502 @{ error = "Reverse geocoding failed." }
  }
}


function Read-HttpRequest {
  param([System.Net.Sockets.NetworkStream]$Stream)

  $Buffer = New-Object byte[] 8192
  $Memory = New-Object System.IO.MemoryStream
  $HeaderEnd = -1

  while ($HeaderEnd -lt 0) {
    $Read = $Stream.Read($Buffer, 0, $Buffer.Length)
    if ($Read -le 0) {
      return $null
    }

    $Memory.Write($Buffer, 0, $Read)
    if ($Memory.Length -gt $MaxBodyBytes) {
      throw "Request body is too large."
    }

    $HeaderEnd = Find-HeaderEnd $Memory.ToArray()
  }

  $AllBytes = $Memory.ToArray()
  $HeaderText = [System.Text.Encoding]::ASCII.GetString($AllBytes, 0, $HeaderEnd)
  $HeaderLines = $HeaderText -split "\r?\n"
  if ($HeaderLines.Count -eq 0) {
    return $null
  }

  $RequestParts = $HeaderLines[0].Split(" ")
  if ($RequestParts.Count -lt 2) {
    return $null
  }

  $Headers = @{}
  for ($Index = 1; $Index -lt $HeaderLines.Count; $Index++) {
    $Line = $HeaderLines[$Index]
    $Separator = $Line.IndexOf(":")
    if ($Separator -lt 1) {
      continue
    }

    $Key = $Line.Substring(0, $Separator).Trim()
    $Value = $Line.Substring($Separator + 1).Trim()
    $Headers[$Key] = $Value
  }

  [long]$ContentLength = 0
  if ($Headers.ContainsKey("Content-Length")) {
    if (
      -not [long]::TryParse([string]$Headers["Content-Length"], [ref]$ContentLength) -or
      $ContentLength -lt 0
    ) {
      throw "Invalid Content-Length."
    }
  }

  if ($ContentLength -gt $MaxBodyBytes) {
    $BodyStart = $HeaderEnd + 4
    $BufferedBodyByteCount = [Math]::Max([long]0, [long]$AllBytes.Length - $BodyStart)
    return @{
      IsOversizedRequest = $true
      DeclaredContentLength = $ContentLength
      BufferedBodyByteCount = [Math]::Min($BufferedBodyByteCount, $ContentLength)
    }
  }

  $BodyStart = $HeaderEnd + 4
  $BodyMemory = New-Object System.IO.MemoryStream
  $AlreadyRead = $AllBytes.Length - $BodyStart
  if ($AlreadyRead -gt 0) {
    $ToWrite = [Math]::Min($AlreadyRead, $ContentLength)
    $BodyMemory.Write($AllBytes, $BodyStart, $ToWrite)
  }

  while ($BodyMemory.Length -lt $ContentLength) {
    $Remaining = $ContentLength - [int]$BodyMemory.Length
    $ReadSize = [int][Math]::Min([long]$Buffer.Length, [long]$Remaining)
    $Read = $Stream.Read($Buffer, 0, $ReadSize)
    if ($Read -le 0) {
      break
    }

    $BodyMemory.Write($Buffer, 0, $Read)
  }

  $RawPath = $RequestParts[1]
  $PathOnly = ($RawPath -split "\?")[0]
  $PathOnly = [System.Uri]::UnescapeDataString($PathOnly)

  return @{
    Method = $RequestParts[0].ToUpperInvariant()
    Path = $PathOnly
    Url = $RawPath
    Headers = $Headers
    BodyBytes = $BodyMemory.ToArray()
    Body = [System.Text.Encoding]::UTF8.GetString($BodyMemory.ToArray())
  }
}

function Find-HeaderEnd {
  param([byte[]]$Bytes)

  for ($Index = 0; $Index -le $Bytes.Length - 4; $Index++) {
    if (
      $Bytes[$Index] -eq 13 -and
      $Bytes[$Index + 1] -eq 10 -and
      $Bytes[$Index + 2] -eq 13 -and
      $Bytes[$Index + 3] -eq 10
    ) {
      return $Index
    }
  }

  return -1
}

function Serve-Static {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [string]$RequestPath
  )

  if ($RequestPath -eq "/") {
    $RelativePath = "index.html"
  } else {
    $RelativePath = $RequestPath.TrimStart("/")
  }

  $FilePath = [System.IO.Path]::GetFullPath((Join-Path $PublicDir $RelativePath))
  $PublicPath = [System.IO.Path]::GetFullPath($PublicDir)

  if (-not $FilePath.StartsWith($PublicPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    Send-Text $Stream 403 "Forbidden"
    return
  }

  if (-not (Test-Path -LiteralPath $FilePath -PathType Leaf)) {
    Send-Text $Stream 404 "Not found"
    return
  }

  $Bytes = [System.IO.File]::ReadAllBytes($FilePath)
  Send-Bytes $Stream 200 (Get-ContentType $FilePath) $Bytes
}

function Send-Json {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    $Data
  )

  $SafeData = Protect-ClientVisibleData $Data
  $Json = $SafeData | ConvertTo-Json -Depth 80
  $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Json)
  Send-Bytes $Stream $StatusCode "application/json; charset=utf-8" $Bytes
}

function Send-Text {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$Text
  )

  $Bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
  Send-Bytes $Stream $StatusCode "text/plain; charset=utf-8" $Bytes
}

function Send-HandlerBytes {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    $Headers,
    [byte[]]$Bytes
  )

  $HeaderLines = New-Object System.Collections.Generic.List[string]
  $HeaderLines.Add("HTTP/1.1 $StatusCode $(Get-ReasonPhrase $StatusCode)")
  $HasContentType = $false
  $HasCacheControl = $false
  foreach ($HeaderName in $Headers.Keys) {
    $NormalizedName = [string]$HeaderName
    $HeaderValue = [string]$Headers[$HeaderName]
    if ($NormalizedName -match "^(?i:cache-control|content-language|content-type|etag|last-modified|retry-after|vary|x-request-id)$") {
      if ($NormalizedName -ieq "Content-Type") {
        $HasContentType = $true
      }
      if ($NormalizedName -ieq "Cache-Control") {
        $HasCacheControl = $true
      }
      $HeaderLines.Add("$NormalizedName`: $HeaderValue")
    }
  }
  if (-not $HasContentType) {
    $HeaderLines.Add("Content-Type: application/octet-stream")
  }
  if (-not $HasCacheControl) {
    $HeaderLines.Add("Cache-Control: no-store")
  }
  $HeaderLines.Add("Content-Length: $($Bytes.Length)")
  $HeaderLines.Add("Connection: close")
  $HeaderLines.Add("")
  $HeaderLines.Add("")

  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes(($HeaderLines -join "`r`n"))
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  if ($Bytes.Length -gt 0) {
    $Stream.Write($Bytes, 0, $Bytes.Length)
  }
}

function Send-Bytes {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$ContentType,
    [byte[]]$Bytes
  )

  $Header = @(
    "HTTP/1.1 $StatusCode $(Get-ReasonPhrase $StatusCode)",
    "Content-Type: $ContentType",
    "Content-Length: $($Bytes.Length)",
    "Cache-Control: no-store",
    "Connection: close",
    "",
    ""
  ) -join "`r`n"

  $HeaderBytes = [System.Text.Encoding]::ASCII.GetBytes($Header)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  if ($Bytes.Length -gt 0) {
    $Stream.Write($Bytes, 0, $Bytes.Length)
  }
}

function Get-ReasonPhrase {
  param([int]$StatusCode)

  switch ($StatusCode) {
    200 { return "OK" }
    400 { return "Bad Request" }
    403 { return "Forbidden" }
    404 { return "Not Found" }
    405 { return "Method Not Allowed" }
    409 { return "Conflict" }
    413 { return "Payload Too Large" }
    500 { return "Internal Server Error" }
    502 { return "Bad Gateway" }
    default { return "OK" }
  }
}

function Get-ContentType {
  param([string]$FilePath)

  switch ([System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()) {
    ".html" { return "text/html; charset=utf-8" }
    ".css" { return "text/css; charset=utf-8" }
    ".js" { return "application/javascript; charset=utf-8" }
    ".json" { return "application/json; charset=utf-8" }
    ".png" { return "image/png" }
    ".jpg" { return "image/jpeg" }
    ".jpeg" { return "image/jpeg" }
    ".svg" { return "image/svg+xml" }
    default { return "application/octet-stream" }
  }
}


function Clean-Text {
  param($Value)

  if ($null -eq $Value) {
    return ""
  }

  return ([string]$Value -replace "\s+", " ").Trim()
}


function Test-SensitiveClientFieldName {
  param([string]$Key)

  return $Key -match "researchPromptInternal|systemPrompt|developerPrompt|promptTemplate|authorization|headers|apiKey|secret|environment"
}

function Test-InternalPromptFragment {
  param($Value)

  $Text = (Clean-Text $Value).ToLowerInvariant()
  if (-not $Text) {
    return $false
  }

  return $Text -match "perform source-routed live comparable search|use web_search for this one exact query|you are a live comparable search controller|you are a query-bound live comparable search executor|return only structured json|tool_choice|authorization\s*:|bearer\s+sk-|process\.env|openai_api_key|open_api_key|developer instructions|system instructions|research prompt bodies|literal prompt templates"
}

function Protect-ClientVisibleData {
  param(
    $Value,
    [string]$Key = ""
  )

  if ($Key -and (Test-SensitiveClientFieldName $Key)) {
    return $null
  }

  if ($null -eq $Value) {
    return $null
  }

  if ($Value -is [string]) {
    $Text = Clean-Text ($Value -replace "\\n", " ")
    if (Test-InternalPromptFragment $Text) {
      return ""
    }
    return $Text
  }

  if ($Value -is [ValueType]) {
    return $Value
  }

  if ($Value -is [System.Collections.IDictionary]) {
    $Result = [ordered]@{}
    foreach ($ChildKey in $Value.Keys) {
      $CleanKey = [string]$ChildKey
      if (Test-SensitiveClientFieldName $CleanKey) {
        continue
      }
      $CleanValue = Protect-ClientVisibleData -Value $Value[$ChildKey] -Key $CleanKey
      if ($null -ne $CleanValue -and $CleanValue -ne "") {
        $Result[$CleanKey] = $CleanValue
      }
    }
    return $Result
  }

  if ($Value -is [System.Array]) {
    $Items = @()
    foreach ($Item in $Value) {
      $CleanItem = Protect-ClientVisibleData -Value $Item -Key $Key
      if ($null -ne $CleanItem -and $CleanItem -ne "") {
        $Items += $CleanItem
      }
    }
    return @($Items)
  }

  if ($Value.PSObject -and $Value.PSObject.Properties.Count -gt 0) {
    $Result = [ordered]@{}
    foreach ($Property in $Value.PSObject.Properties) {
      if (Test-SensitiveClientFieldName $Property.Name) {
        continue
      }
      $CleanValue = Protect-ClientVisibleData -Value $Property.Value -Key $Property.Name
      if ($null -ne $CleanValue -and $CleanValue -ne "") {
        $Result[$Property.Name] = $CleanValue
      }
    }
    return $Result
  }

  return $Value
}

function Load-DotEnv {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    return
  }

  foreach ($Line in Get-Content -LiteralPath $Path) {
    $Trimmed = $Line.Trim()
    if (-not $Trimmed -or $Trimmed.StartsWith("#")) {
      continue
    }

    $Separator = $Trimmed.IndexOf("=")
    if ($Separator -lt 1) {
      continue
    }

    $Key = $Trimmed.Substring(0, $Separator).Trim()
    $Value = $Trimmed.Substring($Separator + 1).Trim().Trim('"').Trim("'")

    if ($Key -and -not [System.Environment]::GetEnvironmentVariable($Key, "Process")) {
      [System.Environment]::SetEnvironmentVariable($Key, $Value, "Process")
    }
  }
}


Load-DotEnv (Join-Path $RootDir ".env")

if ($env:PORT) {
  $Port = [int]$env:PORT
}

if ($Check) {
  Write-Host "Katherine’s Eye server syntax OK - Version $AppVersion"
  exit 0
}

$TcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
$TcpListener.Start()

Write-Host "Katherine’s Eye Version $AppVersion running at http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

try {
  while ($true) {
    $Client = $TcpListener.AcceptTcpClient()
    Handle-Client $Client
  }
} finally {
  $TcpListener.Stop()
}
