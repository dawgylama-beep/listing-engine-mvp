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
    "buyer_risk_score",
    "buyer_risk_level",
    "buyer_risk_summary",
    "primary_risk_factors",
    "risk_reduction_actions",
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
    "currentAskingPrice",
    "suggestedListingPrice",
    "expectedSalePrice",
    "minimumAcceptablePrice",
    "recommendedSellingPlatform",
    "expectedSellingTime",
    "platformSpecificSellingGuidance",
    "itemIdentification",
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
    buyer_risk_score = @{ type = "number" }
    buyer_risk_level = @{ type = "string" }
    buyer_risk_summary = @{ type = "string" }
    primary_risk_factors = @{
      type = "array"
      minItems = 1
      maxItems = 6
      items = @{ type = "string" }
    }
    risk_reduction_actions = @{
      type = "array"
      minItems = 1
      maxItems = 6
      items = @{ type = "string" }
    }
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
    currentAskingPrice = @{ type = "string" }
    suggestedListingPrice = @{ type = "string" }
    expectedSalePrice = @{ type = "string" }
    minimumAcceptablePrice = @{ type = "string" }
    recommendedSellingPlatform = @{ type = "string" }
    expectedSellingTime = @{ type = "string" }
    platformSpecificSellingGuidance = @{ type = "string" }
    itemIdentification = @{ type = "string" }
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
Do not confuse purchase_context with platform: purchase_context is where the user is buying the item now; platform is where the user may later sell it.
Consider purchase context, purchase intent, condition, condition concerns, identification confidence, live comp confidence, valuation confidence, and resale margin where relevant.
For Worth Buying, platform is optional. When purchase_intent is resale or both and platform is selected, treat that selected platform as the intended resale platform. When no resale platform is selected, recommend the best likely selling platform.
For resale intent, do not call something a good buy unless likely margin reasonably accounts for marketplace fees, shipping or transport, condition risk, time to sell, and comp confidence.
Low confidence must materially control the decision. When reliable exact comps and reliable strong similar comps are missing, treat the case as weak evidence, not as a normal resale opportunity.
In weak-evidence resale cases, prefer Pass or Need More Info at ordinary or ambitious asking prices. A speculative offer is allowed only at a substantial discount that protects the buyer from uncertain identity, uncertain demand, condition risk, fees, transport, shipping, breakage, time to sell, and the possibility of no buyer.
Do not use the high end of an AI-only resale range to justify Buy Here or a close-to-asking negotiation target. Use the conservative realized-sale case, and do not recommend buying when expected profit only exists near the optimistic top of a low-confidence range.
When no reliable comps exist, Suggested Listing Price is only an advertised starting point, not evidence of actual value. Expected Sale Price must be more conservative than Suggested Listing Price, and if evidence is too weak, say resale price cannot be estimated reliably from available evidence.
Decision priority for Worth Buying: identify the item reliably, verify relevant comps, confirm demand, compare the asking price to conservative supported value, require margin after risks and costs, and only then recommend Buy Here or Negotiate.
Return Buyer Risk Score fields for Worth Buying: buyer_risk_score from 0 to 100, buyer_risk_level, buyer_risk_summary, primary_risk_factors, and risk_reduction_actions.
Buyer Risk Score is not confidence. It answers how dangerous it is for the buyer to spend money on this item at this price. Lower is safer; higher is riskier.
Use levels exactly as Low Risk, Moderate Risk, High Risk, or Very High Risk. 0-24 is Low Risk, 25-49 is Moderate Risk, 50-74 is High Risk, and 75-100 is Very High Risk.
Risk must combine item identification uncertainty, live comparable quality, asking price exposure, purchase intent, condition risk, liquidity risk, cost risk, and evidence conflicts. Do not simply invert confidence.
Risk and purchaserDecision must agree. Very High Risk should generally be Pass. High Risk should generally be Pass, Need More Info, or only a deeply discounted speculative offer. Do not pair a high risk score with Buy Here unless the rare exception is clearly explained.
For personal-use intent, value may include replacement cost, availability, and buyer utility, but do not disguise preference as market value.
Missing asking price should reduce Buyer Decision Confidence and limit maximum buy-price guidance, but it should not prevent useful identity, market research, or cautious resale-price guidance.
Keep asking price, maximum recommended buy price, suggested listing price, expected sale price, and minimum acceptable price separate.
You must use the web_search tool for live comparable search before completing the report.
Do not claim live sold-comps, marketplace search, retail search, better-price lookup, current listings, source links, or external database checks beyond source-backed results found by the web_search tool.
First identify the item and buyer context, then choose relevant source categories, then search targeted comparable queries.
Use typed buyer identity fields as strong clues only when they are consistent with photos, visible label wording, and source-backed results.
Do not silently discard conflicts between item name, brand, manufacturer, model, SKU, UPC, approximate age or era, visible photo text, front-box text, back-label text, and manufacturer/location text. Conflicts should lower confidence or trigger Need More Info.
Prioritize exact visible front-box wording, back-label wording, manufacturer/location text, brand/series text, product name or box title, UPC/barcode, item code/SKU/style number, distinctive visual description, category, size, condition, visible price, and current asking price.
Preserve searchable text exactly when visible. Do not collapse label text into generic terms if a brand, series, city/state, SKU, UPC, or item code appears.
For collegiate products, inspect and preserve team name, school name, mascot, licensing sticker, manufacturer stamp, model number, copyright wording, year, product category, dimensions, material, lid status, and missing-component status.
Do not describe an officially licensed sticker as proof of a specific manufacturer. If the manufacturer stamp is unclear, ask for a closer photo rather than treating all identification as failed.
Build diverse product-focused search queries in this priority order where appropriate: exact UPC, exact model, exact SKU, brand plus model, manufacturer plus item name, exact visible label wording, then descriptive fallback queries.
Use query types such as exact identifier, brand/product-title, visual descriptive, category/source-routed, and price/context when helpful. Do not force identifiers into every query if they are irrelevant or unreliable.
Use purchase context to route the search: retail store or mall means manufacturer, retailer, current-product, and price-comparison style sources; consignment, thrift, flea market, estate sale, and antique mall mean resale, vintage, collector, specialty reference, and exact-label searches; Facebook Marketplace or private seller means local value, pickup, negotiation, transport, and inspection risk.
Reject or weaken comparable items that conflict with reliable UPC, model, SKU, maker, brand, piece count, material, era, size, pattern, condition, or product type.
For a Santa decor box, include useful terms such as Santa's Workshop, Hubbard Ohio, Santa Claus, Santa figurine, Christmas decoration, holiday decor, boxed seasonal decor, green box, height/size such as 10 inch if provided, item code such as GAB031, UPC/barcode, and asking price such as $65 when provided.
For boxed seasonal decor, vintage decor, collectible figurines, ceramic/resin figures, and unbranded or private-label seasonal items, prioritize eBay-style resale results, Etsy-style vintage/holiday decor results, Mercari-style resale results, collector/reference/brand clue results, and general web results using exact label text.
For vintage, collectible, collegiate, ceramic, cookie-jar, decor, and secondhand items, prioritize exact label and stamp searches, eBay-style resale, Etsy-style vintage, Mercari-style resale, collector/reference clues, WorthPoint-style reference clues where accessible, team/school/licensee searches, and exact phrase results.
Reject generic wholesalers, unrelated restaurant-supply sites, bulk import/manufacturing catalogs, unrelated current-retail products, and generic visual lookalikes as meaningful comps.
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
The currentAskingPrice section must state the current seller/store asking price when provided, or clearly say it was not provided.
The itemIdentification section must summarize the item, preserving school/team/mascot, licensing sticker, maker stamp, model/SKU/UPC, copyright/year, material, dimensions, product category, lid status, and missing-component status when known.
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
When purchase_intent is resale or both, recommendedSellingPlatform, suggestedListingPrice, expectedSalePrice, minimumAcceptablePrice, priceBasis, expectedSellingTime, and platformSpecificSellingGuidance must be filled.
Suggested listing price is the starting advertised price. Expected sale price is the likely negotiated or realized sale price. Minimum acceptable price is the practical floor before fees, shipping, transport, condition risk, and time.
If no reliable live comps exist, still provide resale-price guidance as AI-only, low confidence, and preferably as a cautious range. Do not present a single number as source-backed fact.
For Facebook Marketplace guidance, include local pickup suitability, likely negotiation room, recommended starting price, realistic cash-acceptance range, transport or breakage considerations, and whether shipping should be avoided.
When purchase_intent is personal_use, keep resale-price fields empty unless there is a clearly relevant resale angle, and do not force resale pricing.
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
  $ResaleContextLine = ""
  if ($ReportType -eq "marketValue") {
    if (-not $Platform) {
      $PlatformLine = "Marketplace platform: No platform selected"
      $ContextLine = "Market analysis context: No specific marketplace selected. Use buyer-first market logic across retail, online, local, collector, resale, and secondhand contexts."
    } else {
      $ContextLine = "Market analysis context: $Platform selected. Include platform-specific observations while still providing overall buyer-first market analysis."
    }
    $ResaleContextLine = Get-ResalePlatformContext -Platform $Platform -BuyerIntake $BuyerIntake
  }
  $MarketContextBlock = ""
  if ($ContextLine) {
    $MarketContextBlock = "$ContextLine`n"
  }
  if ($ResaleContextLine) {
    $MarketContextBlock = "${MarketContextBlock}Resale platform context: $ResaleContextLine`n"
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
    return Set-LiveSearchHonesty -Report $Report -Response $Response -BuyerIntake $BuyerIntake -Platform $Platform
  }

  return $Report
}

function Set-LiveSearchHonesty {
  param(
    $Report,
    $Response,
    $BuyerIntake = @{},
    [string]$Platform = ""
  )

  $SearchCalls = @(Get-WebSearchCalls $Response)
  $Citations = @(Get-UrlCitations $Response)
  $SourceBackedItems = @(
    (Normalize-ReportArray $Report.weFoundThisItem) + (Normalize-ReportArray $Report.weFoundSimilarComparableItems) |
      Where-Object { (Test-CitedUrl $_ $Citations) -and -not (Test-RejectedWeakComparableItem $_) }
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

  if ($SearchCalls.Count -gt 0 -and $SourceBackedItems.Count -gt 0 -and $HasReliableMatch) {
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
  $ResaleGuidance = Get-ResalePricingGuidance -Report $Report -BuyerIntake $BuyerIntake -Platform $Platform -ReliableCompsFound $ReliableCompsFound
  $GuardedPurchaserDecision = Get-GuardedBuyerDecision -Value $Report.purchaserDecision -ReliableCompsFound $ReliableCompsFound -BuyerIntake $BuyerIntake -ResaleGuidance $ResaleGuidance
  $BuyerRisk = Get-BuyerRiskAssessment -Report $Report -BuyerIntake $BuyerIntake -ReliableCompsFound $ReliableCompsFound -SearchCompleted ($SearchCalls.Count -gt 0) -LiveComparableSearchStatus $Status -ResaleGuidance $ResaleGuidance -PurchaserDecision $GuardedPurchaserDecision
  $AlignedPurchaserDecision = Get-DecisionAlignedWithRisk -Decision $GuardedPurchaserDecision -BuyerRisk $BuyerRisk -BuyerIntake $BuyerIntake
  $Report | Add-Member -NotePropertyName "purchaserDecision" -NotePropertyValue $AlignedPurchaserDecision -Force
  $Report | Add-Member -NotePropertyName "buyer_risk_score" -NotePropertyValue $BuyerRisk.score -Force
  $Report | Add-Member -NotePropertyName "buyer_risk_level" -NotePropertyValue $BuyerRisk.level -Force
  $Report | Add-Member -NotePropertyName "buyer_risk_summary" -NotePropertyValue $BuyerRisk.summary -Force
  $Report | Add-Member -NotePropertyName "primary_risk_factors" -NotePropertyValue @($BuyerRisk.primaryRiskFactors) -Force
  $Report | Add-Member -NotePropertyName "risk_reduction_actions" -NotePropertyValue @($BuyerRisk.riskReductionActions) -Force
  $Report | Add-Member -NotePropertyName "itemIdentificationConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.itemIdentificationConfidence "Medium" "Item identity is based on the submitted photos and notes; verify missing maker, model, tag, condition, or barcode details.") -Force
  if ($ReliableCompsFound) {
    $Report | Add-Member -NotePropertyName "liveCompConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.liveCompConfidence "Medium" "Source-backed comparable items were found, but match quality still depends on condition and exact item details.") -Force
    $Report | Add-Member -NotePropertyName "valuationConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.valuationConfidence "Medium" "Source-backed comps support the estimate, but condition and local demand can still shift value.") -Force
    $Report | Add-Member -NotePropertyName "priceConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.priceConfidence "Medium" "Source-backed comps support pricing direction, but condition and local demand still matter.") -Force
    if ($HasAskingPrice) {
      $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.buyerDecisionConfidence "Medium" "The recommendation uses source-backed comps plus item details, but final confidence depends on condition and authenticity checks.") -Force
    } else {
      $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Force-LowConfidence $Report.buyerDecisionConfidence "No current asking price was provided, so the buy decision cannot be fully assessed.") -Force
    }
    $Report | Add-Member -NotePropertyName "aiOnlyRoughValueRange" -NotePropertyValue "" -Force
  } else {
    $Report | Add-Member -NotePropertyName "liveCompConfidence" -NotePropertyValue (Force-LowConfidence $Report.liveCompConfidence "No source-backed exact or strong similar comps are available for this report.") -Force
    $Report | Add-Member -NotePropertyName "valuationConfidence" -NotePropertyValue (Force-LowConfidence $Report.valuationConfidence "The value range is AI-only market reasoning because reliable live comps were not available.") -Force
    $Report | Add-Member -NotePropertyName "priceConfidence" -NotePropertyValue (Force-LowConfidence $Report.priceConfidence "No reliable source-backed comps support the price estimate.") -Force
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

  $Report | Add-Member -NotePropertyName "currentPriceAssessment" -NotePropertyValue (Get-CurrentPriceAssessment -Value $Report.currentPriceAssessment -BuyerIntake $BuyerIntake -ReliableCompsFound $ReliableCompsFound -ResaleGuidance $ResaleGuidance) -Force

  $Report | Add-Member -NotePropertyName "currentAskingPrice" -NotePropertyValue (Get-CurrentAskingPriceText $BuyerIntake) -Force
  $Report | Add-Member -NotePropertyName "suggestedListingPrice" -NotePropertyValue $ResaleGuidance.suggestedListingPrice -Force
  $Report | Add-Member -NotePropertyName "expectedSalePrice" -NotePropertyValue $ResaleGuidance.expectedSalePrice -Force
  $Report | Add-Member -NotePropertyName "minimumAcceptablePrice" -NotePropertyValue $ResaleGuidance.minimumAcceptablePrice -Force
  $Report | Add-Member -NotePropertyName "recommendedSellingPlatform" -NotePropertyValue $ResaleGuidance.recommendedSellingPlatform -Force
  $Report | Add-Member -NotePropertyName "expectedSellingTime" -NotePropertyValue $ResaleGuidance.expectedSellingTime -Force
  $Report | Add-Member -NotePropertyName "platformSpecificSellingGuidance" -NotePropertyValue $ResaleGuidance.platformSpecificSellingGuidance -Force
  $Report | Add-Member -NotePropertyName "itemIdentification" -NotePropertyValue (Get-ItemIdentificationText $Report) -Force
  $Report | Add-Member -NotePropertyName "maximumRecommendedBuyPrice" -NotePropertyValue (Get-MaximumRecommendedBuyPrice -Value $Report.maximumRecommendedBuyPrice -BuyerIntake $BuyerIntake -ReliableCompsFound $ReliableCompsFound -ResaleGuidance $ResaleGuidance) -Force
  $Report | Add-Member -NotePropertyName "resalePotential" -NotePropertyValue (Get-ResalePotential -Value $Report.resalePotential -BuyerIntake $BuyerIntake -ReliableCompsFound $ReliableCompsFound -ResaleGuidance $ResaleGuidance) -Force

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
      Where-Object { $_ -match "^(Searched|Source categories targeted|Sources searched|Sources returned|Rejected|Reliable cited|Actual relevant)" }
  )

  if ($Status -eq "Live Search Unavailable - AI Reasoning Only") {
    return @(
      "Sources searched: None.",
      "Live search did not complete before source results could be retrieved."
    )
  }

  if ($Coverage.Count -gt 0) {
    if ($Status -eq "Live Search Completed - No Reliable Comps Found") {
      return @($Coverage + "Rejected irrelevant source categories: generic wholesalers, restaurant-supply sites, bulk import/manufacturing catalogs, unrelated current-retail lookalikes, and generic visual lookalikes." + "No source-backed exact or strong similar matches passed match-quality checks.")
    }
    return $Coverage
  }

  if ($Status -eq "Live Search Completed - No Reliable Comps Found") {
    return @(
      "Live web search completed.",
      "Rejected irrelevant source categories: generic wholesalers, restaurant-supply sites, bulk import/manufacturing catalogs, unrelated current-retail lookalikes, and generic visual lookalikes.",
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

function Get-BuyerRiskAssessment {
  param(
    $Report,
    $BuyerIntake,
    [bool]$ReliableCompsFound,
    [bool]$SearchCompleted,
    [string]$LiveComparableSearchStatus,
    $ResaleGuidance,
    [string]$PurchaserDecision
  )

  $Score = 35
  $Factors = New-Object System.Collections.Generic.List[string]
  $Actions = New-Object System.Collections.Generic.List[string]
  $RiskText = @(
    $Report.liveCompConfidence,
    $Report.valuationConfidence,
    $Report.priceConfidence,
    $Report.buyerDecisionConfidence,
    $Report.priceBasis,
    $Report.expectedSellingTime,
    $Report.resalePotential,
    $ResaleGuidance.expectedSellingTime,
    $ResaleGuidance.platformSpecificSellingGuidance,
    $LiveComparableSearchStatus
  ) -join " "
  $RiskText = $RiskText.ToLowerInvariant()

  if ($ReliableCompsFound) {
    $Score -= 16
  } else {
    if ($SearchCompleted) {
      $Score += 22
      Add-UniqueText $Factors "No reliable sold comps"
    } else {
      $Score += 28
      Add-UniqueText $Factors "AI-only valuation"
    }
    Add-UniqueText $Actions "Confirm recent sold prices for the exact item or a strong similar match."
  }

  if (-not $ReliableCompsFound -and $RiskText -match "ai-only|no reliable|source-backed comps are not available|low confidence") {
    $Score += 8
  }

  $IdentityRisk = Get-IdentityRisk $Report
  $Score += $IdentityRisk.scoreAdjustment
  foreach ($Factor in $IdentityRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $IdentityRisk.actions) { Add-UniqueText $Actions $Action }

  $ConditionRisk = Get-ConditionRisk -BuyerIntake $BuyerIntake -Report $Report
  $Score += $ConditionRisk.scoreAdjustment
  foreach ($Factor in $ConditionRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $ConditionRisk.actions) { Add-UniqueText $Actions $Action }

  $PriceRisk = Get-PriceExposureRisk -Report $Report -BuyerIntake $BuyerIntake -ReliableCompsFound $ReliableCompsFound -ResaleGuidance $ResaleGuidance
  $Score += $PriceRisk.scoreAdjustment
  foreach ($Factor in $PriceRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $PriceRisk.actions) { Add-UniqueText $Actions $Action }

  $LiquidityRisk = Get-LiquidityRisk -Report $Report -ResaleGuidance $ResaleGuidance
  $Score += $LiquidityRisk.scoreAdjustment
  foreach ($Factor in $LiquidityRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $LiquidityRisk.actions) { Add-UniqueText $Actions $Action }

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    $Score += 8
  } elseif ((Get-BuyerIntakeValue $BuyerIntake "purchase_intent") -match "personal_use") {
    $Score -= 6
    if (-not $ReliableCompsFound) {
      Add-UniqueText $Factors "Overpayment risk still exists for personal use"
      Add-UniqueText $Actions "Buy only if personal value justifies the price despite weak market evidence."
    }
  }

  if ((Clean-Text $PurchaserDecision) -match "^Pass\b") {
    $Score += 4
  } elseif (-not $ReliableCompsFound -and (Clean-Text $PurchaserDecision) -match "^Buy Here\b") {
    $Score += 12
    Add-UniqueText $Factors "Recommendation would be aggressive without reliable comps"
  }

  $NormalizedScore = [int](Limit-Number ([Math]::Round($Score)) 0 100)
  $Level = Get-RiskLevelForScore $NormalizedScore
  $PrimaryRiskFactors = @($Factors | Select-Object -First 6)
  $RiskReductionActions = @($Actions | Select-Object -First 6)

  if ($PrimaryRiskFactors.Count -eq 0) {
    $PrimaryRiskFactors = @("No major buyer-protection risk stood out from the available evidence.")
  }
  if ($RiskReductionActions.Count -eq 0) {
    $RiskReductionActions = @("Verify identity, condition, price, and market evidence before buying.")
  }

  return [pscustomobject]@{
    score = $NormalizedScore
    level = $Level
    summary = Get-BuyerRiskSummary -Level $Level -Factors $PrimaryRiskFactors -BuyerIntake $BuyerIntake
    primaryRiskFactors = $PrimaryRiskFactors
    riskReductionActions = $RiskReductionActions
  }
}

function Get-IdentityRisk {
  param($Report)

  $KnownFields = @(
    $Report.itemIdentification,
    $Report.itemClarityScore,
    $Report.searchCoverage
  ) | Where-Object { Test-KnownText $_ }
  $Text = (@($Report.itemIdentification, $Report.itemClarityScore, $Report.searchCoverage, $Report.missingDetails) -join " ").ToLowerInvariant()
  $ScoreAdjustment = 0
  $Factors = @()
  $Actions = @()

  if ($Text -match "conflict|conflicting|mismatch|lookalike") {
    $ScoreAdjustment += 16
    $Factors += "Conflicting identity evidence"
    $Actions += "Resolve the label, model, UPC, or photo conflict before buying."
  }

  if ($KnownFields.Count -ge 3 -and $Text -notmatch "unknown|missing|unclear|need more") {
    $ScoreAdjustment -= 8
  } elseif ($Text -match "unknown|missing|unclear|need more|manufacturer|model|sku|upc") {
    $ScoreAdjustment += 12
    $Factors += "Unclear maker or model"
    $Actions += "Photograph the manufacturer stamp, model number, SKU, UPC, or label more closely."
  } else {
    $ScoreAdjustment += 5
    $Factors += "Incomplete item identification"
    $Actions += "Confirm exact brand, model, dimensions, and identifying numbers."
  }

  return [pscustomobject]@{
    scoreAdjustment = $ScoreAdjustment
    factors = @($Factors)
    actions = @($Actions)
  }
}

function Get-ConditionRisk {
  param(
    $BuyerIntake,
    $Report
  )

  $Condition = (Get-BuyerIntakeValue $BuyerIntake "item_condition").ToLowerInvariant()
  $Factors = @()
  $Actions = @()
  $ScoreAdjustment = 0

  if (-not $Condition -or $Condition -eq "not provided" -or $Condition -match "unknown") {
    $ScoreAdjustment += 8
    $Factors += "Unknown condition"
    $Actions += "Inspect condition closely before paying."
  }

  if ($Condition -match "damaged|missing|untested") {
    $ScoreAdjustment += 12
    $Factors += "Condition or completeness risk"
  }

  $ConcernLabels = @{
    visible_damage = "Visible damage"
    missing_parts = "Missing parts"
    stains_or_wear = "Stains or wear"
    cracks_or_chips = "Cracks or chips"
    not_working = "Not working"
    untested = "Untested"
    incomplete_set = "Incomplete set"
    authenticity_concern = "Authenticity concern"
    odor_or_smoke = "Odor or smoke"
    other = "Other condition concern"
  }

  $Concerns = @()
  if ($BuyerIntake.ContainsKey("condition_concerns") -and $BuyerIntake["condition_concerns"] -is [array]) {
    $Concerns = @($BuyerIntake["condition_concerns"])
  }
  foreach ($Concern in $Concerns) {
    $Key = Clean-Text $Concern
    if (-not $Key) { continue }
    $Label = $(if ($ConcernLabels.ContainsKey($Key)) { $ConcernLabels[$Key] } else { $Key })
    if ($Label -match "authenticity|not working|untested|missing|cracks") {
      $ScoreAdjustment += 7
    } else {
      $ScoreAdjustment += 4
    }
    $Factors += $Label
  }

  if ($Concerns.Count -gt 0 -or $Condition -match "damaged|missing|untested|unknown") {
    $Actions += "Photograph and verify damage, missing pieces, function, odor, and authenticity before buying."
  }

  return [pscustomobject]@{
    scoreAdjustment = $ScoreAdjustment
    factors = @($Factors)
    actions = @($Actions)
  }
}

function Get-PriceExposureRisk {
  param(
    $Report,
    $BuyerIntake,
    [bool]$ReliableCompsFound,
    $ResaleGuidance
  )

  $ScoreAdjustment = 0
  $Factors = @()
  $Actions = @()
  $AskingPrice = $null
  if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
    $AskingPrice = [double]$BuyerIntake["parsed_asking_price"]
  }

  if ($null -eq $AskingPrice) {
    return [pscustomobject]@{
      scoreAdjustment = 18
      factors = @("Missing asking price")
      actions = @("Enter the current asking price before making a buy decision.")
    }
  }

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    if (-not $ReliableCompsFound) {
      $Ceiling = $ResaleGuidance.speculativeBuyCeiling
      if ($null -ne $Ceiling) {
        if ($AskingPrice -le $Ceiling) {
          $ScoreAdjustment -= $(if ($AskingPrice -le 25) { 14 } else { 6 })
          $Factors += $(if ($AskingPrice -le 25) { "Very low purchase price limits downside" } else { "Asking price stays below low-confidence ceiling" })
          $Actions += "Keep any offer at or below the low-confidence speculative ceiling."
        } else {
          $SpreadPenalty = [Math]::Min(28, 12 + [Math]::Ceiling((($AskingPrice - $Ceiling) / [Math]::Max($Ceiling, 1)) * 12))
          $ScoreAdjustment += [Math]::Max(12, $SpreadPenalty)
          $Factors += "Asking price exceeds low-confidence speculative ceiling"
          $Actions += "Pass unless the seller accepts a substantially lower offer."
        }
      } else {
        $ScoreAdjustment += 18
        $Factors += "No supported speculative buy price"
        $Actions += "Need stronger sold-price evidence before risking resale capital."
      }
    } else {
      $SupportedRange = Get-MoneyRange (@($Report.expectedSalePrice, $Report.estimatedMarketValue, $Report.resalePotential) -join " ")
      if ($null -ne $SupportedRange -and $SupportedRange.Count -ge 2) {
        $ConservativeSale = [Math]::Min([double]$SupportedRange[0], [double]$SupportedRange[1])
        if ($AskingPrice -le $ConservativeSale * 0.45) {
          $ScoreAdjustment -= 18
        } elseif ($AskingPrice -le $ConservativeSale * 0.65) {
          $ScoreAdjustment -= 8
        } elseif ($AskingPrice -ge $ConservativeSale * 0.85) {
          $ScoreAdjustment += $(if ($AskingPrice -ge $ConservativeSale) { 25 } else { 18 })
          $Factors += "Asking price too close to conservative sale value"
          $Actions += "Negotiate for a larger safety margin after fees, time, and condition risk."
        }
      }
    }
  } elseif (-not $ReliableCompsFound) {
    $ScoreAdjustment += 8
    $Factors += "Market value is not source-supported"
  }

  return [pscustomobject]@{
    scoreAdjustment = $ScoreAdjustment
    factors = @($Factors)
    actions = @($Actions)
  }
}

function Get-LiquidityRisk {
  param(
    $Report,
    $ResaleGuidance
  )

  $Haystack = @(
    $Report.expectedSellingTime,
    $Report.marketType,
    $Report.resalePotential,
    $ResaleGuidance.expectedSellingTime,
    $ResaleGuidance.platformSpecificSellingGuidance
  ) -join " "
  $Haystack = $Haystack.ToLowerInvariant()
  $ScoreAdjustment = 0
  $Factors = @()
  $Actions = @()

  if ($Haystack -match "uncertain demand|unverified|may fail to sell|slow|long|one to three months|seasonal|narrow|collector") {
    $ScoreAdjustment += 9
    $Factors += "Uncertain resale demand"
    $Actions += "Verify recent demand before buying for resale."
  }

  if ($Haystack -match "fragile|ceramic|glass|breakage|shipping|local pickup|bulky|transport") {
    $ScoreAdjustment += 7
    $Factors += "Shipping, transport, or breakage risk"
    $Actions += "Account for pickup, packing, shipping, breakage, and return risk."
  }

  return [pscustomobject]@{
    scoreAdjustment = $ScoreAdjustment
    factors = @($Factors)
    actions = @($Actions)
  }
}

function Get-DecisionAlignedWithRisk {
  param(
    [string]$Decision,
    $BuyerRisk,
    $BuyerIntake
  )

  $Text = Clean-Text $Decision
  if (-not $Text) {
    $Text = "Need More Info - Buyer decision requires more item details."
  }
  $Detail = Remove-DecisionLabel $Text
  if (-not $Detail) {
    $Detail = "Risk must be reduced before buying."
  }

  if ($BuyerRisk.score -ge 75 -and $Text -match "^(Buy Here|Negotiate)\b") {
    if (-not (Test-HasAskingPrice $BuyerIntake)) {
      return "Need More Info - Buyer Risk Score is $($BuyerRisk.score) ($($BuyerRisk.level)) because the purchase decision is incomplete. $Detail"
    }
    return "Pass - Buyer Risk Score is $($BuyerRisk.score) ($($BuyerRisk.level)), so buying at the current price would put too much downside risk on the buyer. $Detail"
  }

  if ($BuyerRisk.score -ge 50 -and $Text -match "^Buy Here\b") {
    return "Need More Info - Buyer Risk Score is $($BuyerRisk.score) ($($BuyerRisk.level)), so a direct Buy recommendation would be too aggressive without reducing risk. $Detail"
  }

  return $Text
}

function Get-RiskLevelForScore {
  param([int]$Score)

  if ($Score -le 24) { return "Low Risk" }
  if ($Score -le 49) { return "Moderate Risk" }
  if ($Score -le 74) { return "High Risk" }
  return "Very High Risk"
}

function Get-BuyerRiskSummary {
  param(
    [string]$Level,
    [array]$Factors,
    $BuyerIntake
  )

  $TopFactors = @($Factors | Select-Object -First 3 | ForEach-Object { (Clean-Text $_).ToLowerInvariant() })
  $FactorText = $TopFactors -join ", "
  if (-not $FactorText) {
    $FactorText = "the available evidence leaves buyer downside to verify"
  }
  $Asking = Get-BuyerIntakeValue $BuyerIntake "asking_price"
  if ($Asking -eq "not provided") {
    $PriceText = " because the asking price is missing"
  } else {
    $PriceText = " at the $Asking asking price"
  }

  return "$Level because $FactorText$PriceText. Lower is safer; higher is riskier."
}

function Add-UniqueText {
  param(
    [System.Collections.Generic.List[string]]$List,
    [string]$Value
  )

  $Text = Clean-Text $Value
  if (-not $Text) { return }
  foreach ($Item in $List) {
    if ($Item.ToLowerInvariant() -eq $Text.ToLowerInvariant()) {
      return
    }
  }
  $List.Add($Text) | Out-Null
}

function Test-KnownText {
  param($Value)

  $Text = Clean-Text $Value
  return $Text -and $Text -notmatch "^(unknown|not provided|none|null)$"
}

function Limit-Number {
  param(
    [double]$Value,
    [double]$Min,
    [double]$Max
  )

  return [Math]::Min($Max, [Math]::Max($Min, $Value))
}

function Get-ResalePlatformContext {
  param(
    [string]$Platform,
    $BuyerIntake
  )

  if (-not (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent"))) {
    return "Purchase intent is not resale or both; do not force resale pricing."
  }

  $SelectedPlatform = Clean-Text $Platform
  if ($SelectedPlatform) {
    return "$SelectedPlatform is the intended resale platform."
  }

  return "No resale platform was selected; recommend the best likely selling platform."
}

function Get-ResalePricingGuidance {
  param(
    $Report,
    $BuyerIntake,
    [string]$Platform,
    [bool]$ReliableCompsFound
  )

  if (-not (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent"))) {
    return [pscustomobject]@{
      recommendedSellingPlatform = ""
      suggestedListingPrice = ""
      expectedSalePrice = ""
      minimumAcceptablePrice = ""
      expectedSellingTime = ""
      platformSpecificSellingGuidance = ""
    }
  }

  $RecommendedPlatform = Clean-Text $Report.recommendedSellingPlatform
  if (-not $RecommendedPlatform) {
    $RecommendedPlatform = Get-RecommendedSellingPlatform -Platform $Platform -Report $Report
  }

  $RangeSource = @(
    $Report.suggestedListingPrice,
    $Report.expectedSalePrice,
    $Report.minimumAcceptablePrice,
    $Report.aiOnlyRoughValueRange,
    $Report.estimatedMarketValue,
    $Report.resalePotential
  ) -join " "
  $Fallback = Get-FallbackSellPriceGuidance (Get-MoneyRange $RangeSource)

  if (-not $ReliableCompsFound) {
    return Get-LowConfidenceResaleGuidance -Report $Report -BuyerIntake $BuyerIntake -RecommendedPlatform $RecommendedPlatform -MoneyRange (Get-MoneyRange $RangeSource)
  }

  return [pscustomobject]@{
    recommendedSellingPlatform = $RecommendedPlatform
    suggestedListingPrice = Add-ResalePriceLabel $Report.suggestedListingPrice $Fallback.suggestedListingPrice $ReliableCompsFound
    expectedSalePrice = Add-ResalePriceLabel $Report.expectedSalePrice $Fallback.expectedSalePrice $ReliableCompsFound
    minimumAcceptablePrice = Add-ResalePriceLabel $Report.minimumAcceptablePrice $Fallback.minimumAcceptablePrice $ReliableCompsFound
    expectedSellingTime = $(if (Clean-Text $Report.expectedSellingTime) { Clean-Text $Report.expectedSellingTime } else { $Fallback.expectedSellingTime })
    platformSpecificSellingGuidance = $(if (Clean-Text $Report.platformSpecificSellingGuidance) { Clean-Text $Report.platformSpecificSellingGuidance } else { Get-PlatformSpecificSellingGuidance $RecommendedPlatform $Fallback })
  }
}

function Get-LowConfidenceResaleGuidance {
  param(
    $Report,
    $BuyerIntake,
    [string]$RecommendedPlatform,
    $MoneyRange
  )

  $SpeculativeBuyCeiling = Get-SpeculativeBuyCeiling -MoneyRange $MoneyRange -BuyerIntake $BuyerIntake
  if ($null -ne $SpeculativeBuyCeiling) {
    $SpeculativeOfferText = "A low-confidence speculative offer should stay around $(Format-SpeculativeOfferRange $SpeculativeBuyCeiling) or lower after inspection."
  } else {
    $SpeculativeOfferText = "No responsible speculative offer can be calculated until stronger identity, condition, and demand evidence is available."
  }

  if ($null -ne $MoneyRange -and $MoneyRange.Count -ge 2) {
    $CautiousAdvertisedRange = "A cautious advertised range may be around $(Format-MoneyRange (Round-Money $MoneyRange[0]) (Round-Money $MoneyRange[1])) only after verification, but it is not proof of resale value."
    $ExpectedSaleRange = "If a buyer exists, a conservative realized sale would need to fall below the advertised range and should be treated as highly uncertain. $CautiousAdvertisedRange"
  } else {
    $CautiousAdvertisedRange = "Resale price cannot be estimated reliably from available evidence."
    $ExpectedSaleRange = "Resale price cannot be estimated reliably from available evidence."
  }

  return [pscustomobject]@{
    recommendedSellingPlatform = $RecommendedPlatform
    suggestedListingPrice = "AI-only low-confidence advertised guidance - $CautiousAdvertisedRange"
    expectedSalePrice = "Resale price cannot be estimated reliably from available evidence. $ExpectedSaleRange The item may fail to sell."
    minimumAcceptablePrice = "No reliable minimum acceptable resale price is supported without exact or strong similar comps; do not treat any floor as guaranteed liquidity."
    expectedSellingTime = "Highly uncertain; sale may be slow, require repeated markdowns, or fail entirely until demand is verified."
    platformSpecificSellingGuidance = "$RecommendedPlatform guidance - do not use an AI-only listing range to justify buying. $SpeculativeOfferText Account for fees, transport, shipping or breakage, condition uncertainty, negotiation, and time-to-sell before risking cash."
    speculativeBuyCeiling = $SpeculativeBuyCeiling
    speculativeOfferText = $SpeculativeOfferText
  }
}

function Get-SpeculativeBuyCeiling {
  param(
    $MoneyRange,
    $BuyerIntake
  )

  if ($null -eq $MoneyRange -or $MoneyRange.Count -lt 2) {
    return $null
  }

  $ConservativeSale = [Math]::Min([double]$MoneyRange[0], [double]$MoneyRange[1])
  if ($ConservativeSale -le 0) {
    return $null
  }

  $Context = (Get-BuyerIntakeValue $BuyerIntake "purchase_context").ToLowerInvariant()
  $Intent = (Get-BuyerIntakeValue $BuyerIntake "purchase_intent").ToLowerInvariant()
  $Condition = (Get-BuyerIntakeValue $BuyerIntake "item_condition").ToLowerInvariant()
  $Concerns = @()
  if ($BuyerIntake.ContainsKey("condition_concerns") -and $BuyerIntake["condition_concerns"] -is [array]) {
    $Concerns = @($BuyerIntake["condition_concerns"])
  }

  $LocalPurchase = $Context -match "facebook|private|flea|estate|thrift|consignment|antique|local"
  $DamagedOrUntested = $Condition -match "damaged|missing|untested|unknown"
  foreach ($Concern in $Concerns) {
    if ((Clean-Text $Concern) -match "damage|missing|cracks|not_working|untested|incomplete|authenticity|odor") {
      $DamagedOrUntested = $true
    }
  }

  $HasIdentifier = $false
  foreach ($Field in @("item_name", "known_brand", "known_manufacturer", "known_model", "known_sku", "known_upc")) {
    if ((Get-BuyerIntakeValue $BuyerIntake $Field) -ne "not provided") {
      $HasIdentifier = $true
    }
  }

  $SellingCostRate = $(if ($LocalPurchase) { 0.10 } else { 0.18 })
  $ConditionAllowance = $(if ($DamagedOrUntested) { 0.18 } else { 0.08 })
  $IdentityAllowance = $(if ($HasIdentifier) { 0.06 } else { 0.14 })
  $UncertaintyAllowance = 0.16 + [Math]::Min(0.12, $Concerns.Count * 0.03) + $IdentityAllowance
  $ProfitRate = $(if ($Intent -eq "both") { 0.14 } else { 0.16 })
  $RequiredProfit = [Math]::Max($(if ($ConservativeSale -le 35) { 8 } else { 10 }), $ConservativeSale * $ProfitRate)
  $RiskAdjustedNet = $ConservativeSale * [Math]::Max(0.20, 1 - $SellingCostRate - $ConditionAllowance - $UncertaintyAllowance)
  $Ceiling = Round-Money ($RiskAdjustedNet - $RequiredProfit)

  if ($Ceiling -gt 0) {
    return $Ceiling
  }

  return $null
}

function Format-SpeculativeOfferRange {
  param([double]$Ceiling)

  $High = Round-Money $Ceiling
  $Low = Round-Money ([Math]::Max(1, $High * 0.7))
  return Format-MoneyRange $Low $High
}

function Get-GuardedBuyerDecision {
  param(
    [string]$Value,
    [bool]$ReliableCompsFound,
    $BuyerIntake,
    $ResaleGuidance
  )

  $Text = Clean-Text $Value
  if (-not $Text) {
    $Text = "Need More Info - Buyer decision requires more item details."
  }
  if ($ReliableCompsFound) {
    return $Text
  }

  if (-not (Test-HasAskingPrice $BuyerIntake)) {
    return "Need More Info - Current asking price is missing, and reliable source-backed comps are not available. $(Remove-DecisionLabel $Text)"
  }

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    $AskingPrice = $null
    if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
      $AskingPrice = [double]$BuyerIntake["parsed_asking_price"]
    }
    $Ceiling = $ResaleGuidance.speculativeBuyCeiling
    if ($null -ne $AskingPrice -and $null -ne $Ceiling -and $AskingPrice -le $Ceiling -and $AskingPrice -le 25) {
      return "Negotiate - Low-confidence speculative purchase only because the current price is low enough to limit downside. Do not treat this as a proven resale opportunity; verify identity, condition, and demand before buying."
    }

    $SpeculativeOfferText = Clean-Text $ResaleGuidance.speculativeOfferText
    if (-not $SpeculativeOfferText) {
      $SpeculativeOfferText = "Need more information before considering a lower speculative offer."
    }
    return "Pass - At the current asking price, reliable comps do not support a resale purchase. $SpeculativeOfferText $(Remove-DecisionLabel $Text)"
  }

  if ($Text -match "^Buy Here\b") {
    return "Need More Info - Live source-backed comps are not available, so a Buy Here recommendation would be too confident unless personal-use value clearly justifies the price. $(Remove-DecisionLabel $Text)"
  }

  return $Text
}

function Remove-DecisionLabel {
  param([string]$Value)

  return (Clean-Text $Value) -replace "^(Buy Here|Negotiate|Buy Elsewhere|Wait|Pass|Need More Info)\s*[-:]\s*", ""
}

function Get-CurrentPriceAssessment {
  param(
    [string]$Value,
    $BuyerIntake,
    [bool]$ReliableCompsFound,
    $ResaleGuidance
  )

  $Text = Clean-Text $Value
  if ($ReliableCompsFound) {
    return $Text
  }

  if (-not (Test-HasAskingPrice $BuyerIntake)) {
    return Ensure-Prefix $Text "Unknown - Current price assessment requires the current asking price."
  }

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    $AskingPrice = $null
    if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
      $AskingPrice = [double]$BuyerIntake["parsed_asking_price"]
    }
    $Ceiling = $ResaleGuidance.speculativeBuyCeiling
    if ($null -ne $AskingPrice -and $null -ne $Ceiling -and $AskingPrice -le $Ceiling -and $AskingPrice -le 25) {
      return "Low-confidence speculative - $(Format-Money $AskingPrice) may limit downside, but demand and realized resale value are unverified."
    }

    $SpeculativeOfferText = Clean-Text $ResaleGuidance.speculativeOfferText
    if (-not $SpeculativeOfferText) {
      $SpeculativeOfferText = "Need more evidence before considering any offer."
    }
    return "High risk - Current asking price is not supported by reliable exact or strong similar comps. $SpeculativeOfferText"
  }

  return Ensure-Prefix $Text "Unknown - Market support is low because reliable comps are missing."
}

function Get-MaximumRecommendedBuyPrice {
  param(
    [string]$Value,
    $BuyerIntake,
    [bool]$ReliableCompsFound,
    $ResaleGuidance
  )

  $Text = Clean-Text $Value
  if ($ReliableCompsFound) {
    return $Text
  }

  if (-not (Test-HasAskingPrice $BuyerIntake)) {
    return "Need More Info - Current asking price is required before a maximum recommended buy price can be trusted."
  }

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    if ($null -ne $ResaleGuidance.speculativeBuyCeiling) {
      return "Low-confidence speculative ceiling: $(Format-Money $ResaleGuidance.speculativeBuyCeiling) or less. This ceiling uses conservative realized-sale logic and subtracts selling costs, transport or shipping risk, condition risk, identity risk, uncertainty, and required profit. It is not a confident buy price."
    }

    return "No reliable maximum buy price can be recommended because source-backed comps, demand, and realized resale value are not strong enough."
  }

  return Ensure-Prefix $Text "Low confidence - Buy only if personal utility justifies the price; market value is not source-supported."
}

function Get-ResalePotential {
  param(
    [string]$Value,
    $BuyerIntake,
    [bool]$ReliableCompsFound,
    $ResaleGuidance
  )

  $Text = Clean-Text $Value
  if (-not (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent"))) {
    if ($Text) {
      return $Text
    }
    return "Resale is not the main reason to buy."
  }

  if ($ReliableCompsFound) {
    return $Text
  }

  $SpeculativeOfferText = Clean-Text $ResaleGuidance.speculativeOfferText
  if (-not $SpeculativeOfferText) {
    $SpeculativeOfferText = "Need stronger comps before risking resale capital."
  }
  return "Low-confidence speculative resale only - demand is unverified, the item may not sell, and an advertised listing price is not the same as realized value. $SpeculativeOfferText"
}

function Add-ResalePriceLabel {
  param(
    [string]$Value,
    [string]$Fallback,
    [bool]$ReliableCompsFound
  )

  $Text = Clean-Text $(if ($Value) { $Value } else { $Fallback })
  if (-not $Text -or $ReliableCompsFound -or $Text -match "ai-only|low confidence|source-backed") {
    return $Text
  }

  return "AI-only low-confidence guidance - $Text"
}

function Get-FallbackSellPriceGuidance {
  param($MoneyRange)

  if ($null -eq $MoneyRange -or $MoneyRange.Count -lt 2) {
    return [pscustomobject]@{
      suggestedListingPrice = "No reliable price range was available; use a broad, cautious advertised range after verifying exact identity, condition, and local demand."
      expectedSalePrice = "No reliable price range was available; likely realized price is highly uncertain without stronger identity or comparable-sale evidence."
      minimumAcceptablePrice = "No reliable price range was available; set the practical floor only after accounting for fees, shipping or transport, breakage risk, condition risk, and time."
      expectedSellingTime = "Highly uncertain until exact identity, condition, and demand are clearer."
    }
  }

  $Low = [double]$MoneyRange[0]
  $High = [double]$MoneyRange[1]
  $SuggestedLow = Round-Money ([Math]::Max($Low, $High * 0.85))
  $SuggestedHigh = Round-Money ($High * 1.15)
  $ExpectedLow = Round-Money ([Math]::Max($Low, $High * 0.5))
  $ExpectedHigh = Round-Money ([Math]::Max($ExpectedLow, $High * 0.75))
  $MinimumLow = Round-Money $Low
  $MinimumHigh = Round-Money ([Math]::Max($MinimumLow, $Low * 1.35))

  return [pscustomobject]@{
    suggestedListingPrice = "Approximately $(Format-MoneyRange $SuggestedLow $SuggestedHigh) starting advertised price, adjusted for condition, demand, and negotiation room."
    expectedSalePrice = "Approximately $(Format-MoneyRange $ExpectedLow $ExpectedHigh) likely realized sale price after negotiation or platform friction."
    minimumAcceptablePrice = "Approximately $(Format-MoneyRange $MinimumLow $MinimumHigh) practical floor before fees, shipping, transport, condition risk, and time are considered."
    expectedSellingTime = "Several weeks to one to three months; faster only if the item has clear local demand, strong identity, and clean condition."
  }
}

function Get-RecommendedSellingPlatform {
  param(
    [string]$Platform,
    $Report
  )

  $SelectedPlatform = Clean-Text $Platform
  if ($SelectedPlatform) {
    return $SelectedPlatform
  }

  $Haystack = @(
    $Report.itemIdentification,
    $Report.marketType,
    $Report.resalePotential,
    $Report.searchCoverage
  ) -join " "

  if ($Haystack -match "collegiate|college|university|ncaa|mascot|bulldog|officially licensed|licensee") {
    return "Specialty collector group"
  }
  if ($Haystack -match "furniture|bulky|fragile|ceramic|cookie jar|container|canister|local pickup") {
    return "Facebook Marketplace"
  }
  if ($Haystack -match "vintage|handmade|decor|collectible|etsy") {
    return "Etsy"
  }
  if ($Haystack -match "apparel|fashion|dress|shirt|shoe|poshmark") {
    return "Poshmark"
  }

  return "eBay"
}

function Get-PlatformSpecificSellingGuidance {
  param(
    [string]$Platform,
    $Fallback
  )

  $PlatformText = Clean-Text $Platform
  if (-not $PlatformText) {
    $PlatformText = "the recommended platform"
  }

  if ($PlatformText -match "Facebook Marketplace") {
    return "Facebook Marketplace guidance - local pickup is suitable when the item is fragile, bulky, or low-to-mid value. Start near $($Fallback.suggestedListingPrice.ToLowerInvariant()) Expect negotiation toward $($Fallback.expectedSalePrice.ToLowerInvariant()) Do not accept below $($Fallback.minimumAcceptablePrice.ToLowerInvariant()) unless time, storage, or condition risk matters more than margin. Confirm dimensions, lid or missing-component status, chips/cracks, and transport needs. Avoid shipping fragile ceramic unless packaging risk is acceptable."
  }

  return "$PlatformText guidance - price with room for offers, disclose flaws and missing pieces plainly, account for fees and shipping friction, and avoid treating AI-only ranges as source-backed facts."
}

function Get-CurrentAskingPriceText {
  param($BuyerIntake)

  $AskingPrice = ""
  if ($BuyerIntake.ContainsKey("asking_price")) {
    $AskingPrice = Clean-Text $BuyerIntake["asking_price"]
  }

  if ($AskingPrice) {
    return "Current seller asking price: $AskingPrice"
  }

  return "Not provided - current asking price is needed for a confident buy decision, but resale-price guidance can still be estimated cautiously."
}

function Get-ItemIdentificationText {
  param($Report)

  $Existing = Clean-Text $Report.itemIdentification
  if ($Existing) {
    return $Existing
  }

  return "Need more info - item identification remains incomplete. A closer photo of labels, stamps, dimensions, lid status, and missing pieces would improve confidence."
}

function Test-ResaleIntent {
  param([string]$Value)

  return (Clean-Text $Value) -match "^(resale|both)$"
}

function Get-MoneyRange {
  param([string]$Text)

  $Amounts = @()
  foreach ($Match in [regex]::Matches($Text, "\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)")) {
    $Amount = 0.0
    if ([double]::TryParse($Match.Groups[1].Value.Replace(",", ""), [ref]$Amount) -and $Amount -gt 0 -and $Amount -lt 100000) {
      $Amounts += $Amount
    }
  }

  if ($Amounts.Count -eq 0) {
    return $null
  }

  $Low = ($Amounts | Measure-Object -Minimum).Minimum
  $High = ($Amounts | Measure-Object -Maximum).Maximum
  if ($Low -eq $High) {
    return @($Low * 0.8, $High * 1.2)
  }

  return @($Low, $High)
}

function Round-Money {
  param([double]$Value)

  $Step = 1
  if ($Value -ge 25) {
    $Step = 5
  }

  return [Math]::Max($Step, [Math]::Round($Value / $Step) * $Step)
}

function Format-MoneyRange {
  param(
    [double]$Low,
    [double]$High
  )

  $RoundedLow = [Math]::Min($Low, $High)
  $RoundedHigh = [Math]::Max($Low, $High)
  if ($RoundedLow -eq $RoundedHigh) {
    $RoundedLow = [Math]::Max(1, $RoundedLow - 1)
    $RoundedHigh += 1
  }

  return "$(Format-Money $RoundedLow)-$(Format-Money $RoundedHigh)"
}

function Format-Money {
  param([double]$Value)

  return ('$' + [Math]::Round($Value).ToString('N0'))
}

function Test-RejectedWeakComparableItem {
  param([string]$Text)

  return $Text -match "restaurant[\s-]?supply|webstaurant|wholesale|bulk import|import catalog|manufacturing catalog|manufacturer catalog|alibaba|ali\s?express|made-in-china|global sources|dhgate|unrelated current retail|generic visual lookalike"
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
  Write-Host "Marketplace Edge server syntax OK"
  exit 0
}

$TcpListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $Port)
$TcpListener.Start()

Write-Host "Marketplace Edge running at http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

try {
  while ($true) {
    $Client = $TcpListener.AcceptTcpClient()
    Handle-Client $Client
  }
} finally {
  $TcpListener.Stop()
}
