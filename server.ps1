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
    "liveSearchDidNotComplete",
    "noReliableComparableItemsFound",
    "searchCoverage",
    "itemIdentificationConfidence",
    "liveCompConfidence",
    "valuationConfidence",
    "buyerDecisionConfidence",
    "buyerTypeFit",
    "marketType",
    "itemClarityScore",
    "currentPriceAssessment",
    "priceConfidence",
    "priceBasis",
    "estimatedMarketValue",
    "aiOnlyRoughValueRange",
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
    liveSearchDidNotComplete = @{ type = "string" }
    noReliableComparableItemsFound = @{ type = "string" }
    searchCoverage = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    itemIdentificationConfidence = @{ type = "string" }
    liveCompConfidence = @{ type = "string" }
    valuationConfidence = @{ type = "string" }
    buyerDecisionConfidence = @{ type = "string" }
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
    aiOnlyRoughValueRange = @{ type = "string" }
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
  $BuyerIntake = @{}
  if ($ReportType -eq "marketValue") {
    $BuyerIntake = Normalize-BuyerIntake $Body.buyerIntake
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

  if ($ReportType -eq "listing" -and -not $Notes) {
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
    $Report = Generate-ReportWithOpenAI -ApiKey $ApiKey -Model $Model -Platform $Platform -Notes $Notes -Photos $SafePhotos -ReportType $ReportType -BuyerIntake $BuyerIntake
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
    [string]$ReportType,
    $BuyerIntake = @{}
  )

  $UseWebSearch = $false
  if ($ReportType -eq "marketValue") {
    $BuyerIntakeText = Format-BuyerIntakeForPrompt $BuyerIntake
    $Schema = $ValuationSchema
    $SchemaName = "market_value_report"
    $UseWebSearch = $true
    $SystemText = "You are Listing Engine, a buyer-first market intelligence assistant. Help shoppers, collectors, and resellers decide whether to buy an item right now. Return only the requested structured JSON."
    $TaskText = @"
Create a buyer-first Worth Buying / Market Intelligence report, not a marketplace listing draft.
Primary question: Should the user buy this item at this price, right now?
Use Guided Buyer Intake as the current purchase opportunity. The asking price is the seller/store price right now, not automatic market value.
Consider purchase context, purchase intent, condition, condition concerns, identification confidence, live comp confidence, valuation confidence, and resale margin where relevant.
For resale intent, do not call something a good buy unless likely margin reasonably accounts for marketplace fees, shipping or transport, condition risk, time to sell, and comp confidence.
For personal-use intent, value may include replacement cost, availability, and buyer utility, but do not disguise preference as market value.
Missing asking price should reduce Buyer Decision Confidence and limit maximum buy-price guidance, but it should not prevent useful identity or market research.
You must use the web_search tool for live comparable search before completing the report.
Do not claim live sold-comps, marketplace search, retail search, better-price lookup, current listings, source links, or external database checks beyond source-backed results found by the web_search tool.
First identify the item and buyer context, then choose relevant source categories, then search targeted comparable queries.
Use typed buyer identity fields as strong clues only when they are consistent with photos, visible label wording, and source-backed results.
Do not silently discard conflicts between item name, brand, manufacturer, model, SKU, UPC, approximate age or era, visible photo text, front-box text, back-label text, and manufacturer/location text. Conflicts should lower confidence or trigger Need More Info.
Prioritize exact visible front-box wording, back-label wording, manufacturer/location text, brand/series text, product name or box title, UPC/barcode, item code/SKU/style number, distinctive visual description, category, size, condition, visible price, and current asking price.
Preserve searchable text exactly when visible. Do not collapse label text into generic terms if a brand, series, city/state, SKU, UPC, or item code appears.
Build diverse product-focused search queries in this priority order where appropriate: exact UPC, exact model, exact SKU, brand plus model, manufacturer plus item name, exact visible label wording, then descriptive fallback queries.
Use query types such as exact identifier, brand/product-title, visual descriptive, category/source-routed, and price/context when helpful. Do not force identifiers into every query if they are irrelevant or unreliable.
Use purchase context to route the search: retail store or mall means manufacturer, retailer, current-product, and price-comparison style sources; consignment, thrift, flea market, estate sale, and antique mall mean resale, vintage, collector, specialty reference, and exact-label searches; Facebook Marketplace or private seller means local value, pickup, negotiation, transport, and inspection risk.
Reject or weaken comparable items that conflict with reliable UPC, model, SKU, maker, brand, piece count, material, era, size, pattern, condition, or product type.
For a Santa decor box, include useful terms such as Santa's Workshop, Hubbard Ohio, Santa Claus, Santa figurine, Christmas decoration, holiday decor, boxed seasonal decor, green box, height/size such as 10 inch if provided, item code such as GAB031, UPC/barcode, and asking price such as $65 when provided.
For boxed seasonal decor, vintage decor, collectible figurines, ceramic/resin figures, and unbranded or private-label seasonal items, prioritize eBay-style resale results, Etsy-style vintage/holiday decor results, Mercari-style resale results, collector/reference/brand clue results, and general web results using exact label text.
Do not route boxed seasonal decor primarily to Home Depot/current retail unless the item clearly appears to be a current retail product.
For a Santa's Workshop Hubbard Ohio GAB031-style item, use diverse queries such as: Santa's Workshop Hubbard Ohio GAB031; Santa's Workshop GAB031 Santa; 661565005611 Santa's Workshop; Santa's Workshop Santa Claus decoration; boxed Santa Claus holiday figurine GAB031; Santa's Workshop Hubbard Ohio Christmas decoration.
Do not simply append platform names to every query.
Do not default to eBay. eBay is only one market signal and should be used only when relevant.
The purchaserDecision section must start with exactly one of these labels: Buy Here, Negotiate, Buy Elsewhere, Wait, Pass, or Need More Info. Explain the reasoning briefly.
If item information is vague, default to Need More Info, Wait, or Negotiate rather than a strong Buy Here.
The liveComparableSearchStatus section must use exactly the status enforced by the local server: Live Search Completed - Source-Backed Comps Found, Live Search Completed - No Reliable Comps Found, or Live Search Unavailable - AI Reasoning Only.
The weFoundThisItem section must use only source-backed items found by the web_search tool that are Exact Match or likely exact matches. Include source/platform/site, title, price, shipping if available, condition if available, link, match quality, and why it appears to match.
The weFoundSimilarComparableItems section must use only source-backed items found by the web_search tool that are similar but not exact. Include source/platform/site, title, price, shipping if available, condition if available, link, match quality, and why it is only similar.
The liveSearchDidNotComplete section must be empty if web_search_call appeared. If no web_search_call appeared, say live search did not complete, sources searched were none, and source-backed comps could not be retrieved.
The noReliableComparableItemsFound section must be empty when exact or similar source-backed comps are supplied, and it must also be empty when live search did not complete. If live search completed but no exact or strong similar source-backed comps were supplied, explain that no source-backed exact or strong similar matches passed match-quality checks.
The searchCoverage section must describe source categories targeted, sources searched or returned only when supplied by the backend, whether source-backed comps passed match-quality checks, and why weak returned results were rejected. Do not dump long raw URLs in Search Coverage; reserve URLs for actual source-backed comp items only.
Do not hand off marketplace discovery as a task to the user. Report what the system searched or found.
The itemIdentificationConfidence, liveCompConfidence, valuationConfidence, and buyerDecisionConfidence sections must each start with High, Medium, or Low and include what supports confidence, what weakens confidence, and what evidence would improve confidence.
Use Item Identification Confidence for how well photos, typed details, labels, UPC/model/SKU, and source results agree. Use Live Comp Confidence for source-backed match quality. Use Valuation Confidence for price range reliability. Use Buyer Decision Confidence for whether enough price/context/condition evidence exists to recommend action.
The buyerTypeFit section must use one or more of these labels: Personal Use, Resale Opportunity, Both, Unclear.
The marketType section must use one or more of these labels: Retail, Resale, Secondhand, Vintage, Collectible, Apparel/Fashion, Electronics, Home Goods, Local Marketplace, Unknown.
The itemClarityScore section must start with High, Medium, or Low and explain what is known and what is missing.
The currentPriceAssessment section must start with Fair, High, Low, or Unknown. If no current asking price is provided, say: Current price assessment requires the current asking price.
The priceConfidence section must start with exactly one of these labels: High, Medium, or Low. Explain why confidence is high or low.
If live search completed with reliable comps, the priceBasis section must say: Live comparable search was performed. Source-backed results are listed when reliable matches were found.
If live search did not complete, the priceBasis section must say: Live comparable search did not complete. The remaining value range is AI market reasoning only and should be treated as low confidence.
If live search completed with no reliable matches, the priceBasis section must say: Live comparable search completed with no reliable source-backed exact or strong similar comps. The remaining value range is AI market reasoning only and should be treated as low confidence.
Use a broad estimatedMarketValue range, not a false-precision single number.
The aiOnlyRoughValueRange section must be empty when reliable source-backed comps exist. If live search is unavailable or no reliable source-backed comps exist, label the value as AI-Only Rough Value Range and explain that it is not fact-backed by live comps.
In maximumRecommendedBuyPrice, use value/savings logic for personal use and margin/profit logic for resale. If no asking price is provided, explain that buy-price guidance is limited.
In betterPriceCheckNeeded, explain whether the source-backed results indicate a better price may exist. Do not direct the user to perform additional marketplace searching, and do not claim actual cheaper listings were found unless source-backed results support that.
Tailor negotiation guidance to purchase context. For flea market, estate sale, private seller, and Facebook Marketplace, include opening offer, target range, walk-away price, inspection, pickup, transport, and scam caution only when evidence supports it. For retail store or mall, consider sale price, coupons or markdown potential, return policy, and Buy Elsewhere only when source-backed lower prices exist. Do not generate a precise offer range when evidence is too weak.
If no reliable comps are found for a high-priced decor item such as a $65 Santa or holiday decoration, avoid a confident Buy Here recommendation unless personal-use value is the clear reason. Prefer Need More Info, Negotiate, or Pass and explain why $65 is difficult to justify without brand/rarity or source-backed comps.
Do not inflate values from generic category assumptions. Do not treat the user's asking price as market value. Do not treat weak lookalikes as strong comps.
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
  $BuyerIntakeBlock = ""
  if ($ReportType -eq "marketValue") {
    $NotesLabel = "Buyer item notes"
    $BuyerIntakeBlock = "Guided Buyer Intake:`n$BuyerIntakeText`n"
  }

  $UserText = @"
$PlatformLine
${MarketContextBlock}${NotesLabel}: $Notes
${BuyerIntakeBlock}

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
    $Payload.include = @("web_search_call.action.sources")
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
    return Set-LiveSearchHonesty -Report $Report -Response $Response -BuyerIntake $BuyerIntake
  }

  return $Report
}

function Set-LiveSearchHonesty {
  param(
    $Report,
    $Response,
    $BuyerIntake = @{}
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
    $Status = "Live Search Completed - Source-Backed Comps Found"
    $Basis = "Live comparable search was performed. Source-backed results are listed when reliable matches were found."
  } elseif ($SearchCalls.Count -gt 0) {
    $Status = "Live Search Completed - No Reliable Comps Found"
    $Basis = "Live comparable search completed with no reliable source-backed exact or strong similar comps. The remaining value range is AI market reasoning only and should be treated as low confidence."
    $SourceBackedItems = @()
    $ExactItems = @()
    $SimilarItems = @()
  } else {
    $Status = "Live Search Unavailable - AI Reasoning Only"
    $Basis = "Live comparable search did not complete. The remaining value range is AI market reasoning only and should be treated as low confidence."
    $SourceBackedItems = @()
    $ExactItems = @()
    $SimilarItems = @()
  }

  if (-not $HasReliableMatch -and (Clean-Text $Report.purchaserDecision) -match "^Buy Here\b") {
    $Report | Add-Member -NotePropertyName "purchaserDecision" -NotePropertyValue "Need More Info - Live source-backed comps are not available, so a Buy Here recommendation would be too confident. $(Clean-Text $Report.purchaserDecision)" -Force
  }
  $Report | Add-Member -NotePropertyName "liveComparableSearchStatus" -NotePropertyValue $Status -Force
  $Report | Add-Member -NotePropertyName "weFoundThisItem" -NotePropertyValue @($ExactItems) -Force
  $Report | Add-Member -NotePropertyName "weFoundSimilarComparableItems" -NotePropertyValue @($SimilarItems) -Force
  if ($SearchCalls.Count -eq 0) {
    $Report | Add-Member -NotePropertyName "liveSearchDidNotComplete" -NotePropertyValue "$Status. Sources searched: None. Live search did not complete, so source-backed comps could not be retrieved." -Force
  } else {
    $Report | Add-Member -NotePropertyName "liveSearchDidNotComplete" -NotePropertyValue "" -Force
  }
  if ($HasReliableMatch) {
    $NoReliableMessage = ""
  } elseif ($SearchCalls.Count -eq 0) {
    $NoReliableMessage = ""
  } else {
    $NoReliableMessage = "Live search completed, but no reliable source-backed exact or strong similar matches passed match-quality checks. This may mean the item is generic, private-label, seasonal, poorly indexed, or missing strong identifiers. Treat the recommendation as lower-confidence."
  }
  $Report | Add-Member -NotePropertyName "noReliableComparableItemsFound" -NotePropertyValue $NoReliableMessage -Force
  $Report | Add-Member -NotePropertyName "searchCoverage" -NotePropertyValue @(Get-SearchCoverage $Report $Status) -Force
  $Report | Add-Member -NotePropertyName "searchQueriesUsed" -NotePropertyValue @(Get-SearchQueriesUsed $Response) -Force
  $ReliableCompsFound = $Status -eq "Live Search Completed - Source-Backed Comps Found"
  $HasAskingPrice = Test-HasAskingPrice $BuyerIntake
  $Report | Add-Member -NotePropertyName "itemIdentificationConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.itemIdentificationConfidence "Medium" "Item identity is based on the submitted photos and notes; verify missing maker, model, tag, condition, or barcode details.") -Force
  if ($ReliableCompsFound) {
    $Report | Add-Member -NotePropertyName "liveCompConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.liveCompConfidence "Medium" "Source-backed comparable items were found, but match quality still depends on condition and exact item details.") -Force
    $Report | Add-Member -NotePropertyName "valuationConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.valuationConfidence "Medium" "Source-backed comps support the estimate, but condition and local demand can still shift value.") -Force
    if ($HasAskingPrice) {
      $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.buyerDecisionConfidence "Medium" "The recommendation uses source-backed comps plus item details, but final confidence depends on condition and authenticity checks.") -Force
    } else {
      $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Force-LowConfidence $Report.buyerDecisionConfidence "No current asking price was provided, so the buy decision cannot be fully assessed.") -Force
    }
    $Report | Add-Member -NotePropertyName "aiOnlyRoughValueRange" -NotePropertyValue "" -Force
  } else {
    $Report | Add-Member -NotePropertyName "liveCompConfidence" -NotePropertyValue (Force-LowConfidence $Report.liveCompConfidence "No source-backed exact or strong similar comps are available for this report.") -Force
    $Report | Add-Member -NotePropertyName "valuationConfidence" -NotePropertyValue (Force-LowConfidence $Report.valuationConfidence "The value range is AI-only market reasoning because reliable live comps were not available.") -Force
    if ($HasAskingPrice) {
      $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Force-LowConfidence $Report.buyerDecisionConfidence "The buyer decision should be conservative because live comp support is missing.") -Force
    } else {
      $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Force-LowConfidence $Report.buyerDecisionConfidence "No current asking price was provided, and live comp support is missing.") -Force
    }
    $AiOnlySource = Clean-Text $Report.aiOnlyRoughValueRange
    if (-not $AiOnlySource) {
      $AiOnlySource = Clean-Text $Report.estimatedMarketValue
    }
    $AiOnlyRange = Ensure-Prefix $AiOnlySource "AI-Only Rough Value Range - "
    $Report | Add-Member -NotePropertyName "aiOnlyRoughValueRange" -NotePropertyValue $AiOnlyRange -Force
  }

  if (-not $HasAskingPrice) {
    $Report | Add-Member -NotePropertyName "currentPriceAssessment" -NotePropertyValue (Ensure-Prefix $Report.currentPriceAssessment "Unknown - Current price assessment requires the current asking price.") -Force
  }

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

  if ($Status -eq "Live Search Unavailable - AI Reasoning Only") {
    return @(
      "Sources searched: None.",
      "Live search did not complete before source results could be retrieved."
    )
  }

  if ($Coverage.Count -gt 0) {
    if ($Status -eq "Live Search Completed - No Reliable Comps Found") {
      return @($Coverage + "No source-backed exact or strong similar matches passed match-quality checks.")
    }
    return $Coverage
  }

  if ($Status -eq "Live Search Completed - No Reliable Comps Found") {
    return @(
      "Live web search completed.",
      "No source-backed exact or strong similar matches passed match-quality checks."
    )
  }

  return @("Live web search completed and source-backed comparable results passed match-quality checks.")
}

function Ensure-ConfidenceLayer {
  param(
    [string]$Value,
    [string]$FallbackLabel,
    [string]$FallbackReason
  )

  $Text = Clean-Text $Value
  if ($Text -match "^(High|Medium|Low)\b") {
    return $Text
  }

  return "$FallbackLabel - $FallbackReason Supports: submitted photos and notes. Weakens: missing or uncertain item details. Improve by verifying exact identifiers, condition, and source-backed comparable results."
}

function Force-LowConfidence {
  param(
    [string]$Value,
    [string]$Reason
  )

  $Text = Clean-Text $Value
  $Detail = ($Text -replace "^(High|Medium|Low)\s*[-:]\s*", "").Trim()
  if (-not $Detail) {
    $Detail = "Supports: photos and notes. Weakens: missing source-backed comparable evidence. Improve by finding exact, cited comparable matches."
  }

  return "Low - $Reason $Detail".Trim()
}

function Ensure-Prefix {
  param(
    [string]$Value,
    [string]$Prefix
  )

  $Text = Clean-Text $Value
  if ($Text.ToLowerInvariant().StartsWith($Prefix.ToLowerInvariant())) {
    return $Text
  }

  return "$Prefix$Text".Trim()
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

function Normalize-BuyerIntake {
  param($Value)

  $AllowedConcerns = @(
    "visible_damage",
    "missing_parts",
    "stains_or_wear",
    "cracks_or_chips",
    "not_working",
    "untested",
    "incomplete_set",
    "authenticity_concern",
    "odor_or_smoke",
    "other"
  )

  $Intake = @{
    purchase_context = ""
    asking_price = ""
    purchase_intent = ""
    item_condition = ""
    condition_concerns = @()
    item_name = ""
    known_brand = ""
    known_manufacturer = ""
    known_model = ""
    known_sku = ""
    known_upc = ""
    approximate_age_era = ""
    buyer_notes = ""
    parsed_asking_price = $null
  }

  if ($null -eq $Value) {
    return $Intake
  }

  $Fields = @(
    "purchase_context",
    "asking_price",
    "purchase_intent",
    "item_condition",
    "item_name",
    "known_brand",
    "known_manufacturer",
    "known_model",
    "known_sku",
    "known_upc",
    "approximate_age_era",
    "buyer_notes"
  )

  foreach ($Field in $Fields) {
    if ($Value.PSObject.Properties.Name -contains $Field) {
      $Intake[$Field] = Clean-Text $Value.PSObject.Properties[$Field].Value
    }
  }

  $Concerns = @()
  if ($Value.PSObject.Properties.Name -contains "condition_concerns") {
    if ($Value.condition_concerns -is [array]) {
      $Concerns = $Value.condition_concerns
    } elseif ($null -ne $Value.condition_concerns) {
      $Concerns = @($Value.condition_concerns)
    }
  }

  $Intake.condition_concerns = @(
    $Concerns |
      ForEach-Object { Clean-Text $_ } |
      Where-Object { $AllowedConcerns -contains $_ } |
      Select-Object -Unique
  )
  $Intake.parsed_asking_price = ConvertTo-ParsedAskingPrice $Intake.asking_price

  return $Intake
}

function ConvertTo-ParsedAskingPrice {
  param([string]$Value)

  $Text = Clean-Text $Value
  if (-not $Text) {
    return $null
  }

  $Match = [regex]::Match($Text, "(?:^|[^\d])(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?|\d{1,6}(?:\.\d{1,2})?)(?:[^\d]|$)")
  if (-not $Match.Success) {
    return $null
  }

  $NumberText = $Match.Groups[1].Value.Replace(",", "")
  $Parsed = 0.0
  if ([double]::TryParse($NumberText, [ref]$Parsed)) {
    return $Parsed
  }

  return $null
}

function Format-BuyerIntakeForPrompt {
  param($BuyerIntake)

  $ParsedPrice = "null"
  if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
    $ParsedPrice = [string]$BuyerIntake["parsed_asking_price"]
  }

  $Concerns = "none provided"
  if ($BuyerIntake.ContainsKey("condition_concerns") -and $BuyerIntake["condition_concerns"] -and $BuyerIntake["condition_concerns"].Count -gt 0) {
    $Concerns = ($BuyerIntake["condition_concerns"] -join ", ")
  }

  return @(
    "purchase_context: $(Get-BuyerIntakeValue $BuyerIntake 'purchase_context')",
    "asking_price_raw: $(Get-BuyerIntakeValue $BuyerIntake 'asking_price')",
    "asking_price_number: $ParsedPrice",
    "purchase_intent: $(Get-BuyerIntakeValue $BuyerIntake 'purchase_intent')",
    "item_condition: $(Get-BuyerIntakeValue $BuyerIntake 'item_condition')",
    "condition_concerns: $Concerns",
    "item_name: $(Get-BuyerIntakeValue $BuyerIntake 'item_name')",
    "known_brand: $(Get-BuyerIntakeValue $BuyerIntake 'known_brand')",
    "known_manufacturer: $(Get-BuyerIntakeValue $BuyerIntake 'known_manufacturer')",
    "known_model: $(Get-BuyerIntakeValue $BuyerIntake 'known_model')",
    "known_sku: $(Get-BuyerIntakeValue $BuyerIntake 'known_sku')",
    "known_upc: $(Get-BuyerIntakeValue $BuyerIntake 'known_upc')",
    "approximate_age_era: $(Get-BuyerIntakeValue $BuyerIntake 'approximate_age_era')",
    "buyer_notes: $(Get-BuyerIntakeValue $BuyerIntake 'buyer_notes')"
  ) -join "`n"
}

function Get-BuyerIntakeValue {
  param(
    $BuyerIntake,
    [string]$Key
  )

  if ($BuyerIntake.ContainsKey($Key) -and $BuyerIntake[$Key]) {
    return $BuyerIntake[$Key]
  }

  return "not provided"
}

function Test-HasAskingPrice {
  param($BuyerIntake)

  if ($BuyerIntake.ContainsKey("asking_price")) {
    return [bool](Clean-Text $BuyerIntake["asking_price"])
  }

  return $false
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
