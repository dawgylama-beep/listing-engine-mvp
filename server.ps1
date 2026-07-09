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
    "purchaserDecision",
    "liveComparableSearchStatus",
    "weFoundThisItem",
    "weFoundSimilarComparableItems",
    "noReliableComparableItemsFound",
    "searchCoverage",
    "buyerTypeFit",
    "marketType",
    "itemClarityScore",
    "currentPriceAssessment",
    "priceConfidence",
    "priceBasis",
    "estimatedMarketValue",
    "maximumRecommendedBuyPrice",
    "betterPriceCheckNeeded",
    "resalePotential",
    "missingDetails",
    "whatToVerifyBeforeBuying",
    "searchQueriesUsed"
  )
  properties = @{
    purchaserDecision = @{ type = "string" }
    liveComparableSearchStatus = @{ type = "string" }
    weFoundThisItem = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    weFoundSimilarComparableItems = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    noReliableComparableItemsFound = @{ type = "string" }
    searchCoverage = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    buyerTypeFit = @{
      type = "array"
      minItems = 1
      maxItems = 4
      items = @{ type = "string" }
    }
    marketType = @{
      type = "array"
      minItems = 1
      maxItems = 5
      items = @{ type = "string" }
    }
    itemClarityScore = @{ type = "string" }
    currentPriceAssessment = @{ type = "string" }
    priceConfidence = @{ type = "string" }
    priceBasis = @{ type = "string" }
    estimatedMarketValue = @{ type = "string" }
    maximumRecommendedBuyPrice = @{ type = "string" }
    betterPriceCheckNeeded = @{ type = "string" }
    resalePotential = @{ type = "string" }
    missingDetails = @{
      type = "array"
      minItems = 3
      maxItems = 12
      items = @{ type = "string" }
    }
    whatToVerifyBeforeBuying = @{
      type = "array"
      minItems = 3
      maxItems = 8
      items = @{ type = "string" }
    }
    searchQueriesUsed = @{
      type = "array"
      minItems = 0
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

  $UseWebSearch = $false
  if ($ReportType -eq "marketValue") {
    $Schema = $ValuationSchema
    $SchemaName = "market_value_report"
    $UseWebSearch = $true
    $SystemText = "You are Listing Engine, a buyer-first market intelligence assistant. Help shoppers, collectors, and resellers decide whether to buy an item right now. Return only the requested structured JSON."
    $TaskText = @"
Create a buyer-first Worth Buying / Market Intelligence report, not a marketplace listing draft.
Primary question: Should the user buy this item at this price, right now?
You must use the web_search tool for live comparable search before completing the report.
Do not claim live sold-comps, marketplace search, retail search, better-price lookup, current listings, source links, or external database checks beyond source-backed results found by the web_search tool.
First identify the item and buyer context, then choose relevant source categories, then search targeted comparable queries.
Do not default to eBay. eBay is only one market signal and should be used only when relevant.
The purchaserDecision section must start with exactly one of these labels: Buy Here, Negotiate, Buy Elsewhere, Wait, Pass, or Need More Info. Explain the reasoning briefly.
If item information is vague, default to Need More Info, Wait, or Negotiate rather than a strong Buy Here.
The liveComparableSearchStatus section must use exactly one of these values: Live Search Completed, Live Search Attempted - No Reliable Comps Found, or Live Search Unavailable - AI Reasoning Only.
The weFoundThisItem section must use only source-backed items found by the web_search tool that are Exact Match or likely exact matches. Include source/platform/site, title, price, shipping if available, condition if available, link, match quality, and why it appears to match.
The weFoundSimilarComparableItems section must use only source-backed items found by the web_search tool that are similar but not exact. Include source/platform/site, title, price, shipping if available, condition if available, link, match quality, and why it is only similar.
The noReliableComparableItemsFound section must be empty when exact or similar source-backed comps are supplied. If no exact or strong similar source-backed comps are supplied, use exactly: Live comparable search was attempted, but no reliable source-backed exact or strong similar matches were found.
The searchCoverage section must describe what the system already attempted in past tense, such as searched relevant holiday decor / collectible sources, retail/product sources, fashion resale/retail sources, electronics/model-number sources, or local/bulky-item source categories where available.
Do not hand off marketplace discovery as a task to the user. Report what the system searched or found.
The buyerTypeFit section must use one or more of these labels: Personal Use, Resale Opportunity, Both, Unclear.
The marketType section must use one or more of these labels: Retail, Resale, Secondhand, Vintage, Collectible, Apparel/Fashion, Electronics, Home Goods, Local Marketplace, Unknown.
The itemClarityScore section must start with High, Medium, or Low and explain what is known and what is missing.
The currentPriceAssessment section must start with Fair, High, Low, or Unknown. If no current asking price is provided, say: Current price assessment requires the current asking price.
The priceConfidence section must start with exactly one of these labels: High, Medium, or Low. Explain why confidence is high or low.
If live search completed, the priceBasis section must say: Live comparable search was performed. Source-backed results are listed when reliable matches were found.
If live search failed, was unavailable, or returned no reliable matches, the priceBasis section must say: Live comparable search was attempted but unavailable or produced no reliable comps. The remaining estimate is AI market reasoning only.
Use a broad estimatedMarketValue range, not a false-precision single number.
In maximumRecommendedBuyPrice, use value/savings logic for personal use and margin/profit logic for resale. If no asking price is provided, explain that buy-price guidance is limited.
In betterPriceCheckNeeded, explain whether the source-backed results indicate a better price may exist. Do not direct the user to perform additional marketplace searching, and do not claim actual cheaper listings were found unless source-backed results support that.
For retail/current/SKU/UPC/model items, prioritize brand/manufacturer, retailer, Google Shopping-style, Amazon/major retail signals; eBay is secondary only for used/refurbished/resale.
For apparel/fashion with tag/SKU/style number, prioritize brand site, retailer sites, Google Shopping-style web results, and Poshmark/fashion resale; eBay only when used/resale comparison is useful.
For electronics/model-number items, prioritize manufacturer, major retailers, refurbished listings, Amazon/Best Buy/Walmart/Newegg-style sources; eBay only for used/refurbished comparison.
For vintage/collectible/discontinued/holiday decor/ceramics/small shippable secondhand goods, eBay, Etsy, Mercari, Facebook Marketplace/local signals, and collector/reference sites may be relevant.
For furniture or bulky local goods, prioritize Facebook Marketplace-style local value logic, Craigslist/OfferUp/local pickup resale, and local consignment logic; do not overvalue eBay because shipping distorts bulky-item prices.
In resalePotential, include expected resale range, likely selling timeline, and best selling platforms only if resale is relevant; otherwise say resale is not the main reason to buy.
In missingDetails, include specific missing identifiers such as brand, manufacturer, model, SKU, UPC/barcode, style number, size, color, material, condition, age/era, authenticity markers, completeness/accessories, and current asking price.
In whatToVerifyBeforeBuying, ask category-specific verification questions.
The searchQueriesUsed section must only include queries the system actually used. Start with: These are the queries the system used.
If photos show a tag, SKU, model, label, barcode, or other identifier, use that information in the reasoning.
Make the report practical for a person standing in a store, flea market, consignment shop, thrift store, antique mall, or looking at an online listing.
For vague items like vintage window sticker, ask specifically for a photo, exact wording/logo/brand, size, approximate age, condition, whether adhesive/backing is intact, and any maker marks or event/location tie-in.
For apparel with a price tag or SKU, ask for brand, style number, size, color, material, condition, SKU/UPC, and returnability if relevant.
For laptops and electronics, focus on model, specs, battery health, charger, lock status, age/warranty, serial/IMEI if relevant, and functional condition.
For ceramic or home goods sets, focus on maker, pattern, piece count, lids, chips/cracks, crazing, stains, completeness, and shipping risk.
For Facebook Marketplace or local furniture, consider local pickup, dimensions, transport, condition, odors, assembly, negotiation room, and resale timeline.
If no platform is selected, analyze the item using buyer-first market logic across likely retail, resale, online, local, collector, and secondhand contexts.
If a platform is selected, include platform-specific observations while still providing an overall buyer-first market analysis.
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
      $ContextLine = "Market analysis context: No specific marketplace selected. Use buyer-first market logic across retail, online, local, collector, resale, and secondhand contexts."
    } else {
      $ContextLine = "Market analysis context: $Platform selected. Include platform-specific observations while still providing overall buyer-first market analysis."
    }
  }
  $MarketContextBlock = ""
  if ($ContextLine) {
    $MarketContextBlock = "$ContextLine`n"
  }
  $NotesLabel = "Seller item notes"
  if ($ReportType -eq "marketValue") {
    $NotesLabel = "Buyer item notes"
  }

  $UserText = @"
$PlatformLine
${MarketContextBlock}${NotesLabel}: $Notes

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

  if ($UseWebSearch) {
    $Payload.tools = @(
      @{
        type = "web_search"
      }
    )
    $Payload.tool_choice = "required"
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
    $Report = $OutputText | ConvertFrom-Json
  } catch {
    throw "OpenAI returned a response that was not valid listing JSON."
  }

  if ($ReportType -eq "marketValue") {
    return Set-LiveSearchHonesty -Report $Report -Response $Response
  }

  return $Report
}

function Set-LiveSearchHonesty {
  param(
    $Report,
    $Response
  )

  $SearchCalls = @(Get-WebSearchCalls $Response)
  $Citations = @(Get-UrlCitations $Response)
  $SourceBackedItems = @(
    (Normalize-ReportArray $Report.weFoundThisItem) + (Normalize-ReportArray $Report.weFoundSimilarComparableItems) |
      Where-Object { Test-CitedUrl $_ $Citations }
  )
  $ExactItems = @()
  $SimilarItems = @()
  $HasReliableMatch = $false

  foreach ($Item in $SourceBackedItems) {
    if ($Item -match "\bexact match\b|\blikely exact\b") {
      $ExactItems += $Item
      $HasReliableMatch = $true
    } else {
      $SimilarItems += $Item
      if ($Item -match "\bstrong similar match\b") {
        $HasReliableMatch = $true
      }
    }
  }

  if ($SearchCalls.Count -gt 0 -and $SourceBackedItems.Count -gt 0) {
    $Status = "Live Search Completed"
    $Basis = "Live comparable search was performed. Source-backed results are listed when reliable matches were found."
  } elseif ($SearchCalls.Count -gt 0) {
    $Status = "Live Search Attempted - No Reliable Comps Found"
    $Basis = "Live comparable search was attempted but unavailable or produced no reliable comps. The remaining estimate is AI market reasoning only."
    $SourceBackedItems = @()
    $ExactItems = @()
    $SimilarItems = @()
  } else {
    $Status = "Live Search Unavailable - AI Reasoning Only"
    $Basis = "Live comparable search was attempted but unavailable or produced no reliable comps. The remaining estimate is AI market reasoning only."
    $SourceBackedItems = @()
    $ExactItems = @()
    $SimilarItems = @()
  }

  $Report | Add-Member -NotePropertyName "liveComparableSearchStatus" -NotePropertyValue $Status -Force
  $Report | Add-Member -NotePropertyName "weFoundThisItem" -NotePropertyValue @($ExactItems) -Force
  $Report | Add-Member -NotePropertyName "weFoundSimilarComparableItems" -NotePropertyValue @($SimilarItems) -Force
  if ($HasReliableMatch) {
    $NoReliableMessage = ""
  } else {
    $NoReliableMessage = "Live comparable search was attempted, but no reliable source-backed exact or strong similar matches were found."
  }
  $Report | Add-Member -NotePropertyName "noReliableComparableItemsFound" -NotePropertyValue $NoReliableMessage -Force
  $Report | Add-Member -NotePropertyName "searchCoverage" -NotePropertyValue @(Get-SearchCoverage $Report $Status) -Force
  $Report | Add-Member -NotePropertyName "searchQueriesUsed" -NotePropertyValue @(Get-SearchQueriesUsed $Response) -Force

  $PriceBasis = Clean-Text $Report.priceBasis
  if (-not $PriceBasis.ToLowerInvariant().StartsWith($Basis.ToLowerInvariant())) {
    $PriceBasis = "$Basis $PriceBasis".Trim()
  }
  $Report | Add-Member -NotePropertyName "priceBasis" -NotePropertyValue $PriceBasis -Force

  return $Report
}

function Get-SearchCoverage {
  param(
    $Report,
    [string]$Status
  )

  $Coverage = @(
    Normalize-ReportArray $Report.searchCoverage |
      Where-Object { $_ -match "^Searched " }
  )

  if ($Coverage.Count -gt 0) {
    return $Coverage
  }

  if ($Status -eq "Live Search Unavailable - AI Reasoning Only") {
    return @("Live comparable search was unavailable before source categories could be searched.")
  }

  return @("Searched source categories selected from the item details and buyer context.")
}

function Get-SearchQueriesUsed {
  param($Data)

  $Queries = @()
  foreach ($Call in Get-WebSearchCalls $Data) {
    if ($Call.action -and $Call.action.query) {
      $Queries += (Clean-Text $Call.action.query)
    }
  }

  $Queries = @($Queries | Where-Object { $_ } | Select-Object -Unique)
  if ($Queries.Count -eq 0) {
    return @()
  }

  return @("These are the queries the system used.") + $Queries
}

function Get-WebSearchCalls {
  param($Data)

  $Calls = @()
  if ($null -ne $Data.output) {
    foreach ($Item in $Data.output) {
      if ($Item.type -eq "web_search_call") {
        $Calls += $Item
      }
    }
  }
  return $Calls
}

function Get-UrlCitations {
  param($Data)

  $Urls = @()
  if ($null -ne $Data.output) {
    foreach ($Item in $Data.output) {
      if ($null -eq $Item.content) {
        continue
      }

      foreach ($Content in $Item.content) {
        if ($null -eq $Content.annotations) {
          continue
        }

        foreach ($Annotation in $Content.annotations) {
          if ($Annotation.type -eq "url_citation" -and $Annotation.url) {
            $Urls += (Normalize-Url $Annotation.url)
          }
        }
      }
    }
  }
  return $Urls
}

function Normalize-ReportArray {
  param($Value)

  if ($null -eq $Value) {
    return @()
  }

  $Items = @()
  if ($Value -is [array]) {
    $Items = $Value
  } else {
    $Items = @($Value)
  }

  return @(
    $Items |
      ForEach-Object { Clean-Text $_ } |
      Where-Object { $_ }
  )
}

function Test-CitedUrl {
  param(
    [string]$Text,
    [array]$Citations
  )

  if ($Citations.Count -eq 0) {
    return $false
  }

  $Urls = Get-TextUrls $Text
  foreach ($Url in $Urls) {
    $Normalized = Normalize-Url $Url
    foreach ($Citation in $Citations) {
      if ($Normalized -eq $Citation -or $Normalized.StartsWith($Citation) -or $Citation.StartsWith($Normalized)) {
        return $true
      }
    }
  }

  return $false
}

function Get-TextUrls {
  param([string]$Text)

  $Matches = [regex]::Matches($Text, "https?://[^\s)]+")
  $Urls = @()
  foreach ($Match in $Matches) {
    $Urls += $Match.Value
  }
  return $Urls
}

function Normalize-Url {
  param([string]$Url)

  return ([string]$Url).Trim().TrimEnd(".", ",", ";")
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
