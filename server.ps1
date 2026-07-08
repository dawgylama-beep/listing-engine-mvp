param(
  [int]$Port = 5175,
  [switch]$Check
)

$RootDir = $PSScriptRoot
$PublicDir = Join-Path $RootDir "public"
$MaxBodyBytes = 30 * 1024 * 1024

$ListingSchema = @{
  type = "object"
  additionalProperties = $false
  required = @(
    "platform",
    "categorySuggestion",
    "title",
    "description",
    "itemDetails",
    "priceStrategy",
    "expectedSellingTimeline",
    "shippingDelivery",
    "stagingPhotos",
    "sellerNotes"
  )
  properties = @{
    platform = @{ type = "string" }
    categorySuggestion = @{ type = "string" }
    title = @{ type = "string" }
    description = @{ type = "string" }
    itemDetails = @{
      type = "array"
      minItems = 3
      maxItems = 8
      items = @{ type = "string" }
    }
    priceStrategy = @{ type = "string" }
    expectedSellingTimeline = @{ type = "string" }
    shippingDelivery = @{ type = "string" }
    stagingPhotos = @{ type = "string" }
    sellerNotes = @{
      type = "array"
      minItems = 2
      maxItems = 6
      items = @{ type = "string" }
    }
  }
}

$ValuationSchema = @{
  type = "object"
  additionalProperties = $false
  required = @(
    "decision",
    "priceConfidence",
    "priceBasis",
    "estimatedFairMarketValue",
    "maximumRecommendedBuyPrice",
    "resaleOutlook",
    "valueDrivers",
    "riskFactors",
    "whatToVerifyBeforeBuying"
  )
  properties = @{
    decision = @{ type = "string" }
    priceConfidence = @{ type = "string" }
    priceBasis = @{ type = "string" }
    estimatedFairMarketValue = @{ type = "string" }
    maximumRecommendedBuyPrice = @{ type = "string" }
    resaleOutlook = @{ type = "string" }
    valueDrivers = @{
      type = "array"
      minItems = 3
      maxItems = 8
      items = @{ type = "string" }
    }
    riskFactors = @{
      type = "array"
      minItems = 3
      maxItems = 8
      items = @{ type = "string" }
    }
    whatToVerifyBeforeBuying = @{
      type = "array"
      minItems = 3
      maxItems = 8
      items = @{ type = "string" }
    }
  }
}

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

    Route-Request $Stream $Request
  } catch {
    Write-Host $_.Exception.Message
    Send-Json $Stream 500 @{ error = "Something went wrong while generating the listing." }
  } finally {
    $Stream.Close()
    $Client.Close()
  }
}

function Route-Request {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    $Request
  )

  if ($Request.Method -eq "POST" -and $Request.Path -eq "/api/generate-listing") {
    Handle-GenerateListing $Stream $Request
    return
  }

  if ($Request.Method -eq "GET") {
    Serve-Static $Stream $Request.Path
    return
  }

  Send-Json $Stream 405 @{ error = "Method not allowed." }
}

function Handle-GenerateListing {
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

  $Platform = Clean-Text $Body.platform
  $Notes = Clean-Text $Body.notes
  $ReportType = Clean-Text $Body.reportType
  if ($ReportType -ne "marketValue") {
    $ReportType = "listing"
  }
  $Photos = @()

  if ($null -ne $Body.photos) {
    if ($Body.photos -is [array]) {
      $Photos = $Body.photos
    } else {
      $Photos = @($Body.photos)
    }
  }

  if ($ReportType -eq "listing" -and -not $Platform) {
    Send-Json $Stream 400 @{ error = "Choose a marketplace platform." }
    return
  }

  if (-not $Notes) {
    Send-Json $Stream 400 @{ error = "Add item notes before generating a listing." }
    return
  }

  if ($Photos.Count -eq 0) {
    Send-Json $Stream 400 @{ error = "Upload at least one item photo." }
    return
  }

  $ApiKey = $env:OPENAI_API_KEY
  if (-not $ApiKey) {
    $ApiKey = $env:OPEN_API_KEY
  }

  if (-not $ApiKey) {
    Send-Json $Stream 500 @{ error = "Missing OpenAI API key. Add OPENAI_API_KEY or OPEN_API_KEY in Vercel Environment Variables or local .env." }
    return
  }

  $SafePhotos = @(
    $Photos |
      Select-Object -First 6 |
      Where-Object {
        $_.dataUrl -is [string] -and $_.dataUrl.StartsWith("data:image/")
      } |
      ForEach-Object {
        @{
          name = Clean-Text $_.name
          dataUrl = $_.dataUrl
        }
      }
  )

  if ($SafePhotos.Count -eq 0) {
    Send-Json $Stream 400 @{ error = "Uploaded photos must be image files." }
    return
  }

  $Model = "gpt-4.1-mini"
  if ($env:OPENAI_MODEL) {
    $Model = $env:OPENAI_MODEL
  }

  try {
    $Report = Generate-ReportWithOpenAI -ApiKey $ApiKey -Model $Model -Platform $Platform -Notes $Notes -Photos $SafePhotos -ReportType $ReportType
    if ($ReportType -eq "marketValue") {
      Send-Json $Stream 200 @{ valuation = $Report }
    } else {
      Send-Json $Stream 200 @{ listing = $Report }
    }
  } catch {
    Send-Json $Stream 502 @{ error = $_.Exception.Message }
  }
}

function Generate-ReportWithOpenAI {
  param(
    [string]$ApiKey,
    [string]$Model,
    [string]$Platform,
    [string]$Notes,
    [array]$Photos,
    [string]$ReportType
  )

  if ($ReportType -eq "marketValue") {
    $Schema = $ValuationSchema
    $SchemaName = "market_value_report"
    $SystemText = "You are Listing Engine, a careful buying and resale valuation assistant for resellers and collectors. Return only the requested structured JSON."
    $TaskText = @"
Create a Worth Buying / Market Intelligence report, not a marketplace listing draft.
Do not claim you searched live marketplaces, sold comps, current listings, or external databases.
The priceBasis section must say: No live marketplace sold-comps were searched. This estimate is based on the item description/photo, general resale-market patterns, category demand, condition assumptions, scarcity signals, and likely buyer behavior.
The decision section must start with exactly one of these labels: Buy, Negotiate, Pass, or Need More Info. Explain the reasoning briefly.
The priceConfidence section must start with exactly one of these labels: High, Medium, or Low. Explain why confidence is high or low.
If the item description is too vague, avoid strong conclusions. Use Need More Info as the decision or Low as the price confidence, and explain the uncertainty.
For vague items like vintage window sticker, ask specifically for a photo, exact wording/logo/brand, size, approximate age, condition, whether adhesive/backing is intact, and any maker marks or event/location tie-in.
Use a broad estimatedFairMarketValue range, not a false-precision single number.
In maximumRecommendedBuyPrice, include margin logic that accounts for resale spread, fees, shipping or pickup friction, cleaning/packing effort, and risk.
In resaleOutlook, include expected resale range, likely selling timeline, and best platform recommendations.
In valueDrivers, consider brand/maker, age, rarity, subject matter, graphics, condition, size, material, completeness, original packaging, markings, and demand.
In riskFactors, consider unknown authenticity, poor condition, reproduction risk, common item risk, shipping risk, weak demand, and missing identifying details.
Make clear that values are estimates from item photos, seller notes, platform behavior, resale logic, presentation quality, condition, collector appeal, rarity, and demand signals.
If no platform is selected, analyze the item using general resale market logic across likely marketplaces.
If a platform is selected, include platform-specific observations while still providing an overall market analysis.
For online platforms such as eBay, Etsy, Mercari, Poshmark, and similar marketplaces, consider shipping cost, platform fees, packing difficulty, freight or oversized item concerns, fragile item risk, and the effect of shipping cost on buyer demand.
For Facebook Marketplace, Craigslist, OfferUp, flea markets, antique malls, and local resale, emphasize local pickup value, faster cash sale potential, negotiation flexibility, and the no-shipping advantage.
Use cautious ranges and explain uncertainty. If a detail is uncertain from the photos or notes, say what the buyer or seller should verify before buying.
"@
  } else {
    $Schema = $ListingSchema
    $SchemaName = "marketplace_listing"
    $SystemText = "You are Listing Engine, a careful assistant that turns item photos and seller notes into marketplace listing drafts. Return only the requested structured JSON."
    $TaskText = @"
Create a practical marketplace listing. Be specific, honest, and concise.
Do not claim unseen condition details. If something is uncertain from the photos or notes, say what the seller should verify.
"@
  }

  $PlatformLine = "Marketplace platform: $Platform"
  $ContextLine = ""
  if ($ReportType -eq "marketValue") {
    if (-not $Platform) {
      $PlatformLine = "Marketplace platform: No platform selected"
      $ContextLine = "Market analysis context: No specific marketplace selected. Use general resale market logic across likely online, local, collector, and secondhand marketplaces."
    } else {
      $ContextLine = "Market analysis context: $Platform selected. Include platform-specific observations while still providing overall resale market analysis."
    }
  }
  $MarketContextBlock = ""
  if ($ContextLine) {
    $MarketContextBlock = "$ContextLine`n"
  }

  $UserText = @"
$PlatformLine
${MarketContextBlock}Seller item notes: $Notes

$TaskText
"@

  $UserContent = @(
    @{
      type = "input_text"
      text = $UserText
    }
  )

  foreach ($Photo in $Photos) {
    $UserContent += @{
      type = "input_image"
      image_url = $Photo.dataUrl
      detail = "auto"
    }
  }

  $Payload = @{
    model = $Model
    input = @(
      @{
        role = "system"
        content = @(
          @{
            type = "input_text"
            text = $SystemText
          }
        )
      },
      @{
        role = "user"
        content = $UserContent
      }
    )
    text = @{
      format = @{
        type = "json_schema"
        name = $SchemaName
        schema = $Schema
        strict = $true
      }
    }
  }

  $Json = $Payload | ConvertTo-Json -Depth 80 -Compress

  try {
    $Response = Invoke-RestMethod `
      -Uri "https://api.openai.com/v1/responses" `
      -Method Post `
      -Headers @{ Authorization = "Bearer $ApiKey" } `
      -ContentType "application/json" `
      -Body $Json `
      -TimeoutSec 90
  } catch {
    throw (Get-OpenAIErrorMessage $_)
  }

  $OutputText = Extract-OutputText $Response
  if (-not $OutputText) {
    throw "OpenAI returned an empty response."
  }

  try {
    return $OutputText | ConvertFrom-Json
  } catch {
    throw "OpenAI returned a response that was not valid listing JSON."
  }
}

function Extract-OutputText {
  param($Data)

  if (($Data.PSObject.Properties.Name -contains "output_text") -and $Data.output_text) {
    return [string]$Data.output_text
  }

  $Chunks = New-Object System.Collections.Generic.List[string]
  if ($null -ne $Data.output) {
    foreach ($Item in $Data.output) {
      if ($null -eq $Item.content) {
        continue
      }

      foreach ($Content in $Item.content) {
        if (($Content.PSObject.Properties.Name -contains "text") -and $Content.text) {
          $Chunks.Add([string]$Content.text)
        }
      }
    }
  }

  return ($Chunks -join "`n").Trim()
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

  $ContentLength = 0
  if ($Headers.ContainsKey("Content-Length")) {
    $ContentLength = [int]$Headers["Content-Length"]
  }

  if ($ContentLength -gt $MaxBodyBytes) {
    throw "Request body is too large."
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
    $ReadSize = [Math]::Min($Buffer.Length, $Remaining)
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
    Headers = $Headers
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

  $Json = $Data | ConvertTo-Json -Depth 80
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

function Get-OpenAIErrorMessage {
  param($ErrorRecord)

  $Response = $ErrorRecord.Exception.Response
  if ($null -eq $Response) {
    return $ErrorRecord.Exception.Message
  }

  try {
    $Reader = [System.IO.StreamReader]::new($Response.GetResponseStream())
    $Body = $Reader.ReadToEnd()
    $Reader.Close()

    if ($Body) {
      $Parsed = $Body | ConvertFrom-Json
      if ($Parsed.error.message) {
        return [string]$Parsed.error.message
      }
    }
  } catch {
    return $ErrorRecord.Exception.Message
  }

  return $ErrorRecord.Exception.Message
}

Load-DotEnv (Join-Path $RootDir ".env")

if ($env:PORT) {
  $Port = [int]$env:PORT
}

if ($Check) {
  Write-Host "Listing Engine server syntax OK"
  exit 0
}

$TcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
$TcpListener.Start()

Write-Host "Listing Engine running at http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

try {
  while ($true) {
    $Client = $TcpListener.AcceptTcpClient()
    Handle-Client $Client
  }
} finally {
  $TcpListener.Stop()
}
