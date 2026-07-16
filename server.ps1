param(
  [int]$Port = 5175,
  [switch]$Check
)

$RootDir = $PSScriptRoot
$PublicDir = Join-Path $RootDir "public"
$MaxBodyBytes = 30 * 1024 * 1024
$AppVersion = "1.11.0"

$ConsumerDecisionThresholds = @{
  exceptionalMaxRatio = 0.72
  goodMaxRatio = 0.90
  fairMaxRatio = 1.08
  slightlyOverpricedMaxRatio = 1.22
  overpricedMaxRatio = 1.45
  lowDollarCautiousBuyMax = 25
  modestDollarCautiousBuyMax = 75
  cautiousBuyMaxRatio = 0.78
}

$ListingSchema = @{
  type = "object"
  additionalProperties = $false
  required = @(
    "platform",
    "categorySuggestion",
    "identifiedItem",
    "identificationConfidence",
    "visualRecognitionSummary",
    "visualSubject",
    "visualSubjectCategory",
    "visualSubjectConfidence",
    "recognizedOrganization",
    "recognizedBrand",
    "recognizedCharacter",
    "recognizedInstitution",
    "recognizedTheme",
    "visualRecognitionEvidence",
    "visualRecognitionUnknowns",
    "visualRecognitionConflicts",
    "subjectIdentity",
    "subjectConfidence",
    "exactProductIdentity",
    "exactProductConfidence",
    "makerDateLicensingStatus",
    "whatIsKnown",
    "whatIsStillUnknown",
    "identityConflicts",
    "identitySummary",
    "evidenceFoundInPhotos",
    "searchQueriesUsed",
    "sourcesSearched",
    "researchResults",
    "comparableQuality",
    "recommendedListingPrice",
    "suggestedOfferRange",
    "pricingConfidence",
    "pricingRationale",
    "optimizedListingTitle",
    "listingDescription",
    "itemSpecifics",
    "conditionNotes",
    "suggestedSellingPlatform",
    "additionalInformationNeeded",
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
    identifiedItem = @{ type = "string" }
    identificationConfidence = @{ type = "string" }
    visualRecognitionSummary = @{ type = "string" }
    visualSubject = @{ type = "string" }
    visualSubjectCategory = @{ type = "string" }
    visualSubjectConfidence = @{ type = "string" }
    recognizedOrganization = @{ type = "string" }
    recognizedBrand = @{ type = "string" }
    recognizedCharacter = @{ type = "string" }
    recognizedInstitution = @{ type = "string" }
    recognizedTheme = @{ type = "string" }
    visualRecognitionEvidence = @{
      type = "array"
      minItems = 1
      maxItems = 10
      items = @{ type = "string" }
    }
    visualRecognitionUnknowns = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    visualRecognitionConflicts = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    subjectIdentity = @{ type = "string" }
    subjectConfidence = @{ type = "string" }
    exactProductIdentity = @{ type = "string" }
    exactProductConfidence = @{ type = "string" }
    makerDateLicensingStatus = @{
      type = "array"
      minItems = 1
      maxItems = 5
      items = @{ type = "string" }
    }
    whatIsKnown = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    whatIsStillUnknown = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    identityConflicts = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    identitySummary = @{ type = "string" }
    evidenceFoundInPhotos = @{
      type = "array"
      minItems = 1
      maxItems = 12
      items = @{ type = "string" }
    }
    searchQueriesUsed = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    sourcesSearched = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    researchResults = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    comparableQuality = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    recommendedListingPrice = @{ type = "string" }
    suggestedOfferRange = @{ type = "string" }
    pricingConfidence = @{ type = "string" }
    pricingRationale = @{ type = "string" }
    optimizedListingTitle = @{ type = "string" }
    listingDescription = @{ type = "string" }
    itemSpecifics = @{
      type = "array"
      minItems = 3
      maxItems = 10
      items = @{ type = "string" }
    }
    conditionNotes = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    suggestedSellingPlatform = @{ type = "string" }
    additionalInformationNeeded = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
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
    "visualRecognitionSummary",
    "visualSubject",
    "visualSubjectCategory",
    "visualSubjectConfidence",
    "recognizedOrganization",
    "recognizedBrand",
    "recognizedCharacter",
    "recognizedInstitution",
    "recognizedTheme",
    "visualRecognitionEvidence",
    "visualRecognitionUnknowns",
    "visualRecognitionConflicts",
    "subjectIdentity",
    "subjectConfidence",
    "exactProductIdentity",
    "exactProductConfidence",
    "makerDateLicensingStatus",
    "whatIsKnown",
    "whatIsStillUnknown",
    "identityConflicts",
    "identitySummary",
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
    visualRecognitionSummary = @{ type = "string" }
    visualSubject = @{ type = "string" }
    visualSubjectCategory = @{ type = "string" }
    visualSubjectConfidence = @{ type = "string" }
    recognizedOrganization = @{ type = "string" }
    recognizedBrand = @{ type = "string" }
    recognizedCharacter = @{ type = "string" }
    recognizedInstitution = @{ type = "string" }
    recognizedTheme = @{ type = "string" }
    visualRecognitionEvidence = @{
      type = "array"
      minItems = 1
      maxItems = 10
      items = @{ type = "string" }
    }
    visualRecognitionUnknowns = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    visualRecognitionConflicts = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    subjectIdentity = @{ type = "string" }
    subjectConfidence = @{ type = "string" }
    exactProductIdentity = @{ type = "string" }
    exactProductConfidence = @{ type = "string" }
    makerDateLicensingStatus = @{
      type = "array"
      minItems = 1
      maxItems = 5
      items = @{ type = "string" }
    }
    whatIsKnown = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    whatIsStillUnknown = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    identityConflicts = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    identitySummary = @{ type = "string" }
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

$ConsumerDecisionSchema = @{
  type = "object"
  additionalProperties = $false
  required = @(
    "buyerIntent",
    "identifiedItem",
    "identificationConfidence",
    "visualRecognitionSummary",
    "visualSubject",
    "visualSubjectCategory",
    "visualSubjectConfidence",
    "recognizedOrganization",
    "recognizedBrand",
    "recognizedCharacter",
    "recognizedInstitution",
    "recognizedTheme",
    "visualRecognitionEvidence",
    "visualRecognitionUnknowns",
    "visualRecognitionConflicts",
    "subjectIdentity",
    "subjectConfidence",
    "exactProductIdentity",
    "exactProductConfidence",
    "makerDateLicensingStatus",
    "whatIsKnown",
    "whatIsStillUnknown",
    "identityConflicts",
    "identitySummary",
    "evidenceFoundInPhotos",
    "askingPrice",
    "estimatedFairMarketValue",
    "fairPriceRange",
    "valueRating",
    "recommendation",
    "recommendedOffer",
    "openingOffer",
    "targetPurchasePrice",
    "maximumRecommendedPrice",
    "walkAwayPrice",
    "negotiationGuidance",
    "reasonsToBuy",
    "reasonsForCaution",
    "productOrConditionRisks",
    "riskFlags",
    "betterValueConsiderations",
    "researchResults",
    "comparableQuality",
    "pricingConfidence",
    "pricingRationale",
    "additionalInformationNeeded",
    "searchQueriesUsed",
    "sourcesSearched"
  )
  properties = @{
    buyerIntent = @{ type = "string" }
    identifiedItem = @{ type = "string" }
    identificationConfidence = @{ type = "string" }
    visualRecognitionSummary = @{ type = "string" }
    visualSubject = @{ type = "string" }
    visualSubjectCategory = @{ type = "string" }
    visualSubjectConfidence = @{ type = "string" }
    recognizedOrganization = @{ type = "string" }
    recognizedBrand = @{ type = "string" }
    recognizedCharacter = @{ type = "string" }
    recognizedInstitution = @{ type = "string" }
    recognizedTheme = @{ type = "string" }
    visualRecognitionEvidence = @{
      type = "array"
      minItems = 1
      maxItems = 10
      items = @{ type = "string" }
    }
    visualRecognitionUnknowns = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    visualRecognitionConflicts = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    subjectIdentity = @{ type = "string" }
    subjectConfidence = @{ type = "string" }
    exactProductIdentity = @{ type = "string" }
    exactProductConfidence = @{ type = "string" }
    makerDateLicensingStatus = @{
      type = "array"
      minItems = 1
      maxItems = 5
      items = @{ type = "string" }
    }
    whatIsKnown = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    whatIsStillUnknown = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    identityConflicts = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    identitySummary = @{ type = "string" }
    evidenceFoundInPhotos = @{
      type = "array"
      minItems = 1
      maxItems = 12
      items = @{ type = "string" }
    }
    askingPrice = @{ type = "string" }
    estimatedFairMarketValue = @{ type = "string" }
    fairPriceRange = @{
      type = "array"
      minItems = 1
      maxItems = 4
      items = @{ type = "string" }
    }
    valueRating = @{ type = "string" }
    recommendation = @{ type = "string" }
    recommendedOffer = @{
      type = "array"
      minItems = 1
      maxItems = 4
      items = @{ type = "string" }
    }
    openingOffer = @{ type = "string" }
    targetPurchasePrice = @{ type = "string" }
    maximumRecommendedPrice = @{ type = "string" }
    walkAwayPrice = @{ type = "string" }
    negotiationGuidance = @{ type = "string" }
    reasonsToBuy = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    reasonsForCaution = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    productOrConditionRisks = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    riskFlags = @{
      type = "array"
      minItems = 0
      maxItems = 10
      items = @{ type = "string" }
    }
    betterValueConsiderations = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    researchResults = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    comparableQuality = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
    pricingConfidence = @{ type = "string" }
    pricingRationale = @{ type = "string" }
    additionalInformationNeeded = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    searchQueriesUsed = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    sourcesSearched = @{
      type = "array"
      minItems = 1
      maxItems = 8
      items = @{ type = "string" }
    }
  }
}

$AskMarketEdgeSchema = @{
  type = "object"
  additionalProperties = $false
  required = @(
    "answer",
    "answerType",
    "evidenceBasis",
    "assumptions",
    "recalculatedFields",
    "confidence",
    "recommendedNextAction",
    "needsNewSearch",
    "needsAdditionalPhoto",
    "suggestedPhoto",
    "revisedListingFields",
    "updatedScenario"
  )
  properties = @{
    answer = @{ type = "string" }
    answerType = @{
      type = "string"
      enum = @("explanation", "price_scenario", "condition_scenario", "research_question", "evidence_request", "listing_revision", "platform_guidance", "new_live_search", "unsupported_or_unrelated")
    }
    evidenceBasis = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    assumptions = @{
      type = "array"
      minItems = 0
      maxItems = 6
      items = @{ type = "string" }
    }
    recalculatedFields = @{
      type = "array"
      minItems = 0
      maxItems = 8
      items = @{ type = "string" }
    }
    confidence = @{ type = "string" }
    recommendedNextAction = @{ type = "string" }
    needsNewSearch = @{ type = "boolean" }
    needsAdditionalPhoto = @{ type = "boolean" }
    suggestedPhoto = @{ type = "string" }
    revisedListingFields = @{
      type = "object"
      additionalProperties = $false
      required = @("title", "description", "priceStrategy", "conditionNotes", "sellerNotes")
      properties = @{
        title = @{ type = "string" }
        description = @{ type = "string" }
        priceStrategy = @{ type = "string" }
        conditionNotes = @{ type = "string" }
        sellerNotes = @{ type = "string" }
      }
    }
    updatedScenario = @{ type = "string" }
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

  $Action = Clean-Text $Body.action
  if ($Action -eq "ask_market_edge") {
    Handle-AskMarketEdge $Stream $Body
    return
  }

  $Platform = Clean-Text $Body.platform
  $Notes = Clean-Text $Body.notes
  $AnalysisId = Clean-Text $Body.analysisId
  if (-not $AnalysisId) {
    $AnalysisId = New-AnalysisId
  }
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
    $Report | Add-Member -NotePropertyName "analysisId" -NotePropertyValue $AnalysisId -Force
    if ($ReportType -eq "marketValue") {
      Send-Json $Stream 200 @{ valuation = $Report }
    } else {
      Send-Json $Stream 200 @{ listing = $Report }
    }
  } catch {
    Send-Json $Stream 502 @{ error = $_.Exception.Message }
  }
}

function Handle-AskMarketEdge {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    $Body
  )

  $BodyJson = $Body | ConvertTo-Json -Depth 60 -Compress
  if ($BodyJson.Length -gt 180000) {
    Send-Json $Stream 413 @{ error = "Ask Katherine’s Eye context is too large. Start a new item and try again." }
    return
  }

  $SessionId = (Clean-Text $Body.sessionId)
  $Workflow = Normalize-AskWorkflow $Body.workflow
  $BuyerIntent = Clean-Text $Body.buyerIntent
  $Question = Clean-Text $Body.question
  $Context = $Body.currentItemContext
  $RecentConversation = @()
  if ($null -ne $Body.recentConversationContext) {
    if ($Body.recentConversationContext -is [array]) {
      $RecentConversation = @($Body.recentConversationContext | Select-Object -Last 4)
    } else {
      $RecentConversation = @($Body.recentConversationContext)
    }
  }

  if (-not $SessionId) {
    Send-Json $Stream 400 @{ error = "Ask Katherine’s Eye needs a current item session." }
    return
  }

  if (-not $Workflow) {
    Send-Json $Stream 400 @{ error = "Ask Katherine’s Eye needs a valid workflow." }
    return
  }

  if (-not $Question) {
    Send-Json $Stream 400 @{ error = "Enter a question about the current item." }
    return
  }

  if ($null -eq $Context -or $null -eq $Context.currentReport) {
    Send-Json $Stream 400 @{ error = "Ask Katherine’s Eye needs a completed item report first." }
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

  $Model = "gpt-4.1-mini"
  if ($env:OPENAI_MODEL) {
    $Model = $env:OPENAI_MODEL
  }

  try {
    $AnswerType = Classify-AskQuestion $Question
    $ProposedPrice = Get-AskProposedPrice $Question
    $Scenario = Get-AskScenario -AnswerType $AnswerType -ProposedPrice $ProposedPrice -Workflow $Workflow -BuyerIntent $BuyerIntent -Context $Context
    $Answer = Invoke-AskMarketEdge -ApiKey $ApiKey -Model $Model -SessionId $SessionId -Workflow $Workflow -BuyerIntent $BuyerIntent -Question $Question -AnswerType $AnswerType -ProposedPrice $ProposedPrice -Scenario $Scenario -Context $Context -RecentConversation $RecentConversation
    $Normalized = Normalize-AskMarketEdgeAnswer -Answer $Answer -AnswerType $AnswerType -Scenario $Scenario
    Send-Json $Stream 200 @{
      action = "ask_market_edge"
      sessionId = $SessionId
      workflow = $Workflow
      answer = $Normalized
    }
  } catch {
    Send-Json $Stream 502 @{ error = $_.Exception.Message }
  }
}

function Invoke-AskMarketEdge {
  param(
    [string]$ApiKey,
    [string]$Model,
    [string]$SessionId,
    [string]$Workflow,
    [string]$BuyerIntent,
    [string]$Question,
    [string]$AnswerType,
    $ProposedPrice,
    [string]$Scenario,
    $Context,
    $RecentConversation
  )

  $WorkflowInstruction = @{
    personal_use = "Active workflow is Buying for Myself. Use personal-use value, offer, fair-price, condition-risk, fit, and walk-away logic. Do not use reseller margin logic."
    resale = "Active workflow is Buying to Resell. Use resale margin, fees, shipping or transport, liquidity, max-buy-price, risk, and likely net-profit logic."
    market_value = "Active workflow is Check Market Value. Explain value estimate, confidence, research quality, and what evidence would improve confidence."
    listing = "Active workflow is Generate Listing. Help revise listing copy, platform fit, title, description, price strategy, condition disclosure, and seller notes without inventing facts."
  }[$Workflow]
  $PriceText = "No scenario price was parsed by the app."
  if ($null -ne $ProposedPrice) {
    $PriceText = "Proposed scenario price parsed by the app: $(Format-Money $ProposedPrice)."
  }
  $ScenarioText = "No deterministic scenario notes were available."
  if ($Scenario) {
    $ScenarioText = "Deterministic scenario notes: $Scenario"
  }
  $ContextJson = $Context | ConvertTo-Json -Depth 50 -Compress
  $ConversationJson = $RecentConversation | ConvertTo-Json -Depth 20 -Compress
  $Instruction = @"
Ask Katherine’s Eye is not a generic chatbot. It is a context-aware item adviser discussing the current item and current report only.
The current structured report is the authoritative starting point. Use the active report before generating new conclusions.
Ground every answer in the active item session: uploaded-photo findings, user description, workflow, buyer intent, asking price, visual subject, visual confidence, exact product identity, exact product confidence, user-provided identity, photo evidence, search queries, sources searched, research results, comparable classifications, pricing estimates, recommendation, risk flags, listing content, prior follow-up exchanges, and user-provided scenario changes when available.
Do not behave as though the user is asking about an unrelated new item unless the frontend has started a New Item session. Do not carry stale context from another workflow.
Preserve verified facts, known uncertainty, condition disclosures, subject identity, exact-product uncertainty, source-backed facts versus inference, and prior scenario assumptions unless the user supplies new evidence that changes them.
Avoid restarting the entire item analysis unless the user explicitly asks for a new analysis or a new search.
No new live search is being performed inside this Ask response. Do not claim fresh marketplace search, sold-comps, source checks, new URLs, historical image search, or external database checks unless source-backed new results are explicitly supplied in the current context.
Never invent marketplace evidence, search results, sold prices, sold dates, platform activity, exact image matches, exact product matches, maker, artist, date, edition, licensing, authenticity, defects, demand, historical references, prices, sources, or URLs.
For questions about search activity, answer from stored searchDiagnostics fields such as searchProviderUsed, serperConfigured, serperCallsAttempted, serperCallsSucceeded, fallbackProviderUsed, providerRequestRecords, providerResponseSummaries, domainsActuallyReturned, organicResultCount, shoppingResultCount, providerSourceCount, retainedVisibleResultCount, rejectedCandidateCount, and droppedResultReasons.
If asked what Google or Serper returned, use only stored provider diagnostics and visible source records. Do not perform a new search, invent search activity, reveal provider keys, or claim a domain was searched unless a query record targeted it or a source-backed result returned it.
Distinguish a targeted marketplace domain, a provider call, a returned URL domain, a raw Google provider result, a parsed candidate, and a retained comparable record.
Clearly separate Visual Evidence, User-Provided Information, Search Evidence, Comparable Evidence, System Inference, Scenario Assumption, and Unknown or Unverified when those labels improve clarity.
Preserve the current report's valuationEvidenceState. If it is preliminary, call the range a Preliminary Reference Range, not Estimated Fair Value or Fair Market Value.
If asked what it is worth and evidence is insufficient, say: The current search suggests a preliminary reference range from similar active listings, but fair market value is not established because no strong or confirmed sold comparables were found.
Never convert active asking prices, loose similar items, category-level references, or AI-only reasoning into a confident value rating or confirmed fair-market-value estimate.
Question route behavior: explanation questions explain the current report, cite current evidence, do not rerun research, do not change the recommendation unless new information is supplied, and separate visual evidence, user input, search evidence, and inference.
Question route behavior: price_scenario questions parse the proposed price, preserve current item identity and research, rerun only price or decision logic, state that no new market search occurred, and say only the price scenario changed.
Never use reseller margin logic for a personal-use buyer. Use consumer fair-value, fit, condition risk, negotiation, alternatives, and walk-away logic for Buying for Myself.
Use reseller profit, fees, shipping, net margin, max-buy price, liquidity, and risk logic for Buying to Resell.
Question route behavior: condition_scenario questions record new details as user-provided, do not claim they were visually confirmed, preserve the original evidence record, distinguish observed condition from user-reported condition, and lower confidence when impact cannot be quantified.
Question route behavior: research_question questions explain existing research, sources, rejected results, confidence, identity, authenticity, licensing, or verification status without fabricating additional support.
Question route behavior: evidence_request questions identify the single most useful next detail or photo, such as a back label, maker mark, model number, dimensions, damage close-up, signature, copyright line, included accessories, or power-on photo.
Question route behavior: listing_revision questions revise the current listing, preserve verified facts, visible condition issues, uncertainty disclosures, pricing honesty, and damage disclosures, and do not add official, licensed, authentic, rare, or exact era claims without support.
Question route behavior: platform_guidance questions use current item characteristics like size, shipping difficulty, value, audience, collectibility, condition, confidence, and likely demand. Frame advice as practical guidance, not guaranteed platform performance.
Question route behavior: new_live_search requests are deliberate search requests. Because this Ask endpoint does not execute a new follow-up live search, state that no new search occurred, answer only from current evidence, set needsNewSearch true, and do not fabricate sources or results.
Question route behavior: unsupported_or_unrelated questions should explain that Ask Katherine’s Eye can only answer questions about the current item/report and should ask for a relevant item-specific question.
Use the current report's Visual Recognition fields first for questions like what is this, why do you think it is a brand/organization/mascot/logo/character, what clues support that, or what should be photographed next.
When identity is discussed, separate visual subject recognition, user-provided identity, exact product identity, maker, era, licensing, authenticity, exact comparable status, and pricing confidence.
If broad subject identity is supported but exact product is unverified, preserve the supported subject instead of saying the whole identity is unverified.
When exact evidence is unavailable, say what is known, what is likely, what came from the user, what the image supports, what searches support, what remains unverified, and what single next piece of evidence would help most.
If asked whether an item is definitely a team/brand/mascot, explain subject confidence, visual consistency, user-provided identity, and what remains unverified.
If asked whether it is authentic or licensed, do not infer authenticity from subject identity. Ask for the single most useful proof photo or marking.
Use short recent conversation history to understand references like what about at `$30, does that change your answer, what if the box is missing, make it shorter, use Facebook instead, search older ones, or why not. Avoid repetition and carry forward scenario changes only within this active item session.
$WorkflowInstruction
Controlled question route: $AnswerType.
$PriceText
$ScenarioText
Session ID: $SessionId.
"@

  $Payload = @{
    model = $Model
    input = @(
      @{
        role = "system"
        content = @(
          @{
            type = "input_text"
            text = "You are Ask Katherine’s Eye, a context-aware item and report follow-up assistant. The current structured report is authoritative context. Answer only from the active item session and return structured JSON."
          }
        )
      },
      @{
        role = "user"
        content = @(
          @{
            type = "input_text"
            text = @"
Question: $Question

Current item context:
$ContextJson

Recent conversation context:
$ConversationJson

$Instruction
"@
          }
        )
      }
    )
    text = @{
      format = @{
        type = "json_schema"
        name = "ask_market_edge_answer"
        schema = $AskMarketEdgeSchema
        strict = $true
      }
    }
  }

  try {
    $Response = Invoke-RestMethod `
      -Uri "https://api.openai.com/v1/responses" `
      -Method Post `
      -Headers @{ Authorization = "Bearer $ApiKey" } `
      -ContentType "application/json" `
      -Body ($Payload | ConvertTo-Json -Depth 80 -Compress) `
      -TimeoutSec 90
  } catch {
    throw (Get-OpenAIErrorMessage $_)
  }

  $OutputText = Extract-OutputText $Response
  if (-not $OutputText) {
    throw "OpenAI returned an empty Ask Katherine’s Eye response."
  }

  try {
    return ($OutputText | ConvertFrom-Json)
  } catch {
    throw "OpenAI returned a response that was not valid Ask Katherine’s Eye JSON."
  }
}

function Normalize-AskWorkflow {
  param($Value)

  $Text = Clean-Text $Value
  if (@("personal_use", "resale", "market_value", "listing") -contains $Text) {
    return $Text
  }
  return ""
}

function Classify-AskQuestion {
  param([string]$Question)

  $Text = (Clean-Text $Question).ToLowerInvariant()
  if ($Text -match '\b(search|look\s+for|find|rerun|re-run|run)\b.*\b(older|historical|retired|exact|more|comp|comps|comparable|comparables|sold|examples|model|sku|upc|barcode|image|images|again|version|versions|match|matches|reference|references)\b' -or $Text -match '\b(search again|search older|look for historical|find more exact|look for sold|sold examples|live search|new search)\b') { return "new_live_search" }
  if ($Text -match '\$\s*\d|\bat\s*\$|\b(what\s+(about|if)|would|should|could)\b.*\$\s*\d|\b(offer|pay|deal|margin|profit|net|maximum|max|most\s+i\s+should\s+pay|walk[- ]?away)\b' -or ($Text -match '\b(worth|value)\b' -and $Text -notmatch '\b(why|explain)\b')) { return "price_scenario" }
  if ($Text -match '\b(damage|damaged|condition|missing|included|box|crack|chip|stain|works|working|untested|part)\b') { return "condition_scenario" }
  if ($Text -match '\b(sold|asking|source|comp|comparable|result|rejected|searched|evidence|confidence|why|definitely|identity|authentic|authenticity|licensed|licensing|real|verified|verify)\b') { return "research_question" }
  if ($Text -match '\b(photo|picture|label|barcode|serial|model|mark|measure|measurement|verify|check)\b') { return "evidence_request" }
  if ($Text -match '\b(rewrite|title|description|shorter|listing|facebook|ebay|mercari|etsy|poshmark|disclosure)\b') { return "listing_revision" }
  if ($Text -match '\b(platform|sell|local|pickup|ship|shipping|where)\b') { return "platform_guidance" }
  if ($Text -match '\b(why|explain|rating|recommendation)\b') { return "explanation" }
  return "unsupported_or_unrelated"
}

function Get-AskProposedPrice {
  param([string]$Question)

  $Amounts = @(Get-MoneyAmounts $Question)
  if ($Amounts.Count -gt 0) {
    return [double]$Amounts[0]
  }
  return $null
}

function Get-AskScenario {
  param(
    [string]$AnswerType,
    $ProposedPrice,
    [string]$Workflow,
    [string]$BuyerIntent,
    $Context
  )

  if ($AnswerType -ne "price_scenario" -or $null -eq $ProposedPrice) {
    return ""
  }

  $Report = $Context.currentReport
  $EvidenceState = (Clean-Text $Report.valuationEvidenceState).ToLowerInvariant()
  $ValueText = @(
    $Report.preliminaryReferenceRange,
    $Report.fairValueNotEstablished,
    $Report.estimatedFairMarketValue,
    $Report.fairPriceRange,
    $Report.aiOnlyRoughValueRange,
    $Report.expectedSalePrice,
    $Report.suggestedListingPrice,
    $Report.maximumRecommendedBuyPrice
  ) -join " "
  $Amounts = @(Get-MoneyAmounts $ValueText | Sort-Object)
  if ($Amounts.Count -eq 0) {
    return "Scenario price $(Format-Money $ProposedPrice) was parsed, but the current report does not contain enough numeric value evidence for a deterministic recalculation."
  }

  $Midpoint = ([double]($Amounts[0] + $Amounts[$Amounts.Count - 1])) / 2
  if ($Midpoint -le 0) {
    return ""
  }

  if ($EvidenceState -and $EvidenceState -ne "supported") {
    $RangeText = Get-ValuationEvidenceRange $Report
    if (-not $RangeText) {
      $RangeText = Format-MoneyRange $Amounts[0] $Amounts[$Amounts.Count - 1]
    }
    if ($Workflow -eq "personal_use" -or $BuyerIntent -eq "personal_use") {
      return "At $(Format-Money $ProposedPrice), compare the scenario only to the current preliminary reference range of $RangeText. The price may be favorable relative to similar active listings, but there is not enough reliable evidence for a confident Buy recommendation."
    }
    return "At $(Format-Money $ProposedPrice), use reseller caution because the available range is preliminary reference evidence only ($RangeText), not verified fair market value or confirmed sold-comps support."
  }

  $Ratio = [double]$ProposedPrice / $Midpoint
  if ($Workflow -eq "personal_use" -or $BuyerIntent -eq "personal_use") {
    if ($Ratio -le $ConsumerDecisionThresholds["goodMaxRatio"]) {
      return "At $(Format-Money $ProposedPrice), the price is below the current fair-value midpoint of about $(Format-Money $Midpoint) and leans Good Value/Fair Price for personal use if condition assumptions still hold."
    }
    if ($Ratio -le $ConsumerDecisionThresholds["fairMaxRatio"]) {
      return "At $(Format-Money $ProposedPrice), the price is close to the current fair-value midpoint of about $(Format-Money $Midpoint) and leans Fair Price for personal use if condition assumptions still hold."
    }
    return "At $(Format-Money $ProposedPrice), the price is above the current fair-value midpoint of about $(Format-Money $Midpoint) and should lean Negotiate/Pass unless condition, completeness, or fit improves."
  }

  $MaxBuyAmounts = @(Get-MoneyAmounts (Clean-Text $Report.maximumRecommendedBuyPrice) | Sort-Object)
  if ($MaxBuyAmounts.Count -gt 0) {
    $Ceiling = [double]$MaxBuyAmounts[$MaxBuyAmounts.Count - 1]
    if ($ProposedPrice -le $Ceiling) {
      return "At $(Format-Money $ProposedPrice), the scenario is at or below the current max-buy guidance of about $(Format-Money $Ceiling) before added resale costs."
    }
    return "At $(Format-Money $ProposedPrice), the scenario is above the current max-buy guidance of about $(Format-Money $Ceiling) and likely weakens resale margin."
  }

  return "At $(Format-Money $ProposedPrice), use reseller margin caution because the current report does not contain a clear numeric maximum buy price."
}

function Normalize-AskMarketEdgeAnswer {
  param(
    $Answer,
    [string]$AnswerType,
    [string]$Scenario
  )

  $Revised = $Answer.revisedListingFields
  if ($null -eq $Revised) {
    $Revised = [pscustomobject]@{}
  }

  return @{
    answer = Clean-Text $Answer.answer
    answerType = $(if (Clean-Text $Answer.answerType) { Clean-Text $Answer.answerType } else { $AnswerType })
    evidenceBasis = @(Normalize-ReportArray $Answer.evidenceBasis | Select-Object -First 6)
    assumptions = @(Normalize-ReportArray $Answer.assumptions | Select-Object -First 6)
    recalculatedFields = @(Normalize-ReportArray $Answer.recalculatedFields | Select-Object -First 8)
    confidence = Ensure-ConfidenceLayer $Answer.confidence "Low" "Ask Katherine’s Eye uses the current report context and does not perform a new live search unless source-backed new results are explicitly supplied."
    recommendedNextAction = Clean-Text $Answer.recommendedNextAction
    needsNewSearch = $(if ($AnswerType -eq "new_live_search") { $true } else { [bool]$Answer.needsNewSearch })
    needsAdditionalPhoto = [bool]$Answer.needsAdditionalPhoto
    suggestedPhoto = Clean-Text $Answer.suggestedPhoto
    revisedListingFields = @{
      title = Clean-Text $Revised.title
      description = Clean-Text $Revised.description
      priceStrategy = Clean-Text $Revised.priceStrategy
      conditionNotes = Clean-Text $Revised.conditionNotes
      sellerNotes = Clean-Text $Revised.sellerNotes
    }
    updatedScenario = $(if (Clean-Text $Answer.updatedScenario) { Clean-Text $Answer.updatedScenario } else { $Scenario })
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
  $IsConsumerIntent = $false
  if ($ReportType -eq "marketValue") {
    $BuyerIntakeText = Format-BuyerIntakeForPrompt $BuyerIntake
    $IsConsumerIntent = ((Get-BuyerIntakeValue $BuyerIntake "purchase_intent") -eq "personal_use")
    if ($IsConsumerIntent) {
      $Schema = $ConsumerDecisionSchema
      $SchemaName = "consumer_purchase_decision"
      $UseWebSearch = $true
      $SystemText = "You are Katherine’s Eye, a careful consumer purchase decision assistant. Help everyday buyers decide whether an item is fairly priced for personal use. Return only the requested structured JSON."
      $TaskText = @"
Create a personal-use consumer buying decision report, not a reseller profit report and not a marketplace listing draft.
Primary question: Is this item fairly priced for someone buying it for themselves?
Use the web_search tool for live comparable research before completing the report.
First perform Visual Subject Recognition: answer what the photos broadly show before exact product identification, marketplace research, comparable analysis, pricing, or decision logic.
Visual subject confidence must remain independent from exact product, maker, era, licensing, authenticity, comparable, and pricing confidence.
Fill visualRecognitionSummary, visualSubject, visualSubjectCategory, visualSubjectConfidence, recognizedOrganization, recognizedBrand, recognizedCharacter, recognizedInstitution, recognizedTheme, visualRecognitionEvidence, visualRecognitionUnknowns, and visualRecognitionConflicts from supported visual evidence only.
Separate broad subject identity from exact product identity. A likely subject can be recognized even when exact product, maker, era, licensing, authenticity, or exact comparable are unverified.
Do not turn exact-product uncertainty into total subject uncertainty. Preserve the supported broad subject and lower pricing/exact-product confidence separately.
Do not use marketplace fee, shipping margin, profit, or resale spread logic to drive the recommendation.
Focus on fair value, product fit, condition, completeness, replacement alternatives, buyer risk, negotiation, and whether the asking price makes sense for personal use.
Use valueRating exactly as one of: Exceptional Value, Good Value, Fair Price, Slightly Overpriced, Overpriced, Poor Value, Insufficient Evidence.
Use recommendation exactly as one of: Buy, Buy If It Fits Your Needs, Negotiate, Wait for a Better Price, Pass, Need More Information.
The valueRating and recommendation must be distinct. Example: Fair Price / Buy If It Fits Your Needs or Slightly Overpriced / Negotiate.
Do not assign a positive value rating merely because the item looks inexpensive. Compare asking price to evidence-backed fair value, condition, completeness, and uncertainty.
estimatedFairMarketValue must distinguish current retail price, active asking prices, used-market evidence, sold evidence only when actually available, refurbished/open-box pricing, reference-only results, and the system's fair-value estimate.
fairPriceRange must include Low Fair Price, Typical Fair Price, and High Fair Price.
Use valuation evidence states consistently: supported, preliminary, or insufficient.
Use Estimated Fair Market Value only when exact or strong comparable evidence is sufficient. Use Preliminary Reference Range when evidence is weak, partial, active-listing-only, category-level, or AI-reasoning-only. Use Fair Value: Not established when no defensible range exists.
If valueRating is Insufficient Evidence, do not label any field as Estimated Fair Value, Fair Market Value, Typical Selling Price, or Confirmed Value. Use Preliminary Reference Range or Fair Value: Not established instead.
When active asking-price evidence is used, call it current active listings or results found during the current search. Never present active asking prices as confirmed sold evidence.
When photos contain distinctive visible wording, branding, dates, names, slogans, event names, or item-form clues, preserve those exact phrases and use them before generic category searches.
Merge text clues from all uploaded photos. Do not discard reverse-side label wording when front-side branding is also visible.
Exact or strong active listings can support a cautious personal-use decision when clearly labeled as active asking-price evidence, not confirmed sold evidence.
Low pricing confidence must soften the recommendation language, but it must not automatically force Need More Information when exact visible evidence and limited dollar downside support a cautious Buy.
recommendedOffer must include Opening Offer, Target Purchase Price, and Maximum Recommended Price when evidence supports those numbers.
walkAwayPrice must be clear when evidence is sufficient. When evidence is weak, say the walk-away price is not supported yet.
negotiationGuidance must be honest buyer-facing language. Do not encourage dishonest claims or pretend a lower comp exists unless source-backed results support it.
reasonsToBuy and reasonsForCaution must be specific to the available evidence, not generic praise or generic warnings.
productOrConditionRisks and riskFlags must show only supported risks such as Identity Not Confirmed, Price Above Market, Missing Parts, Condition Unclear, Authenticity Unclear, Compatibility Risk, No Return Protection, Weak Comparable Evidence, Older Model, or Repair Risk.
researchResults must use only source-backed comparable/reference items supplied by web_search citations, or a clear no-usable-evidence message when none passed filtering.
comparableQuality must classify evidence as Strong Comparable, Partial Comparable, Identity / Reference Result, Weak Match, or Rejected Match.
pricingConfidence must start with High, Medium, or Low and explain why.
Never fabricate sold data, URLs, prices, defects, authenticity, or source results. Never describe active asking prices as confirmed sales.
If identity, condition, asking price, or reliable comps are weak, use Insufficient Evidence / Need More Information or a conservative recommendation. Do not give a precise walk-away price when confidence is insufficient.
Ask for the single most useful next detail or photo when evidence is insufficient.
"@
    } else {
    $Schema = $ValuationSchema
    $SchemaName = "market_value_report"
    $UseWebSearch = $true
    $SystemText = "You are Katherine’s Eye, a buyer-first market intelligence assistant. Help shoppers, collectors, and resellers decide whether to buy an item right now. Return only the requested structured JSON."
    $TaskText = @"
Create a buyer-first Worth Buying / Market Intelligence report, not a marketplace listing draft.
Primary question: Should the user buy this item at this price, right now?
First perform Visual Subject Recognition: answer what the photos broadly show before exact product identification, marketplace research, comparable analysis, pricing, or decision logic.
Visual subject confidence must remain independent from exact product, maker, era, licensing, authenticity, comparable, and pricing confidence.
Fill visualRecognitionSummary, visualSubject, visualSubjectCategory, visualSubjectConfidence, recognizedOrganization, recognizedBrand, recognizedCharacter, recognizedInstitution, recognizedTheme, visualRecognitionEvidence, visualRecognitionUnknowns, and visualRecognitionConflicts from supported visual evidence only.
Use Guided Buyer Intake as the current purchase opportunity. The asking price is the seller/store price right now, not automatic market value.
Separate broad subject identity from exact product identity. Preserve supported broad subject recognition even when maker, date, licensing, authenticity, and exact comparable are unverified.
Do not let no exact comparable found erase a visually/user-supported subject identity; lower exact-product, comparable, and pricing confidence separately.
Do not confuse purchase_context with platform: purchase_context is where the user is buying the item now; platform is where the user may later sell it.
For Retail store purchase context, evaluate current retail replacement cost first. Use exact UPC/barcode, store name, current retailer price, manufacturer/current retail price, nearby competing retailer results, delivered/pickup context, and package/quantity compatibility before any resale/collectible logic.
For ordinary current retail consumables, do not prioritize historical sold comps and do not call a price a confirmed good deal unless source-backed current retail comparisons support it.
For ordinary current retail products, use Retail Evidence Mode: current-retail-only. Do not use auction, historical sold, guide, WorthPoint, PicClick, resale, thrift, flea-market, estate-sale, collector, or secondary-market evidence to establish customer-facing current retail value.
For ordinary fixed-price retail-store purchases, do not show Opening Offer, negotiation target, offer ladder, market-supported maximum, personal-enjoyment exception, or Maximum Price Guard. Default to Store price is fixed unless the intake explicitly says the retail price is negotiable.
For ordinary current retail products, show Current Retail Price: Not verified when no exact/strong qualified current retail source was found. Do not fabricate a retail range, named-store price, or competing retailer result.
Use retail labels only for retail evidence: Exact Retail Match, Strong Retail Match, Compatible Alternative, Package-Size Difference, or Rejected Retail Mismatch. Do not label ordinary retail results as Verified Sold, Reference Price, Auction Current Bid, Historical Sold Evidence, or Preliminary Reference Range.
Before retail query generation, reconcile one Canonical Product Identity from barcode/UPC, visible package text, brand, item number/SKU, package count, size, user description, purchase context, and store name. Strong barcode/OCR/package/SKU evidence must outrank weaker visual inference.
Reject unsupported identity terms before search. Example: if barcode/package text says Office Works Security Envelopes, 45 count, Strip & Seal, item 6110325, UPC 041226087161, do not use poster print in title, queries, matching, pricing, or customer-facing text unless the user confirms that conflict.
For retail-store products, generate separate query ideas in priority order: exact UPC alone, store plus exact UPC, known retailer-domain plus exact UPC, brand plus product name, brand plus SKU/item number, brand plus product type and package count, store plus brand/product, and local competitor query only when ZIP or general area is available.
If the barcode could not be read and no manual UPC was supplied, tell the customer directly: The barcode could not be read clearly. Upload a closer photo of the barcode or enter the numbers manually.
When no current retail comparisons are found for a retail-store purchase, use conditional labels such as Price Not Verified, Low-Risk Purchase - Limited Evidence, Reasonable Personal-Use Purchase - Current retail price not confirmed, or Wait for Retail Price Confirmation. Do not output an unconditional Buy paired with Insufficient Evidence or no compatible prices.
Location should use manual ZIP or browser-derived general area only; never display or store precise coordinates in customer-facing or technical output.
For retail products, compare package price and unit price separately when quantity is explicit and compatible. Do not compare a 100-count box directly with a 25-count box as an exact match; use unit-price context only when product type, size, and specs are compatible.
Local Store Context must include named store and ZIP/general area when supplied, current store price if found, pickup/availability only when source-backed, and 'Availability not confirmed' when inventory support is missing.
Next Best Action must ask for the specific missing retail identifier: closer barcode photo, manual UPC, store name, ZIP code, box size, pack count, quantity, model, or SKU.
Consider purchase context, purchase intent, condition, condition concerns, identification confidence, live comp confidence, valuation confidence, and resale margin where relevant.
For Worth Buying, platform is optional. When purchase_intent is resale or both and platform is selected, treat that selected platform as the intended resale platform. When no resale platform is selected, recommend the best likely selling platform.
For resale intent, do not call something a good buy unless likely margin reasonably accounts for marketplace fees, shipping or transport, condition risk, time to sell, and comp confidence.
Low confidence must materially control the decision. When reliable exact comps and reliable strong similar comps are missing, treat the case as weak evidence, not as a normal resale opportunity.
In weak-evidence resale cases, prefer Pass or Need More Info at ordinary or ambitious asking prices. A speculative offer is allowed only at a substantial discount that protects the buyer from uncertain identity, uncertain demand, condition risk, fees, transport, shipping, breakage, time to sell, and the possibility of no buyer.
Do not use the high end of an AI-only resale range to justify Buy Here or a close-to-asking negotiation target. Use the conservative realized-sale case, and do not recommend buying when expected profit only exists near the optimistic top of a low-confidence range.
When no reliable comps exist, Suggested Listing Price is only an advertised starting point, not evidence of actual value. Expected Sale Price must be more conservative than Suggested Listing Price, and if evidence is too weak, say resale price cannot be estimated reliably from available evidence.
Decision priority for Worth Buying: identify the item reliably, verify relevant comps, confirm demand, compare the asking price to conservative supported value, require margin after risks and costs, and only then recommend Buy Here or Negotiate.
Return Buyer Risk Score fields for Worth Buying: buyer_risk_score from 0 to 100, buyer_risk_level, buyer_risk_summary, primary_risk_factors, and risk_reduction_actions.
Buyer Risk Score is not confidence. It answers how risky it is to spend this amount of money on this item under these circumstances. Lower is safer; higher is riskier.
Use levels exactly as Low Risk, Moderate Risk, High Risk, or Very High Risk. 0-24 is Low Risk, 25-49 is Moderate Risk, 50-74 is High Risk, and 75-100 is Very High Risk.
Risk must combine Evidence Risk and Exposure Risk. Evidence Risk covers item identification uncertainty, live comparable quality, valuation support, demand uncertainty, and evidence conflicts. Exposure Risk covers dollars at risk, asking price versus conservative value, fees, shipping, transport, repair, storage, disposal, fraud, authenticity, and safety exposure.
Low confidence should raise Buyer Risk Score, but weak evidence alone must not automatically force 100 when the buyer's actual downside is minimal.
A very low asking price can reduce overall buyer risk only when transport, repair, shipping, storage, disposal, authenticity, fraud, safety, contamination, and missing-component exposure do not create meaningful added downside.
Risk and purchaserDecision must agree. Low or Moderate Risk may support a cautious or speculative buy. High Risk should generally be Pass, Need More Info, or only a substantially lower offer. Very High Risk should generally be Pass. Do not pair a high risk score with Buy Here unless the rare exception is clearly explained.
When evidence is weak but downside is genuinely limited, preserve the allowed decision labels but describe it as Speculative Buy, Buy only at this very low price, low-dollar gamble, or buy only if storage, transport, and condition create no added burden. Explain that valuation remains uncertain, resale is not guaranteed, low price limits dollar exposure, added costs could change the decision, and the buyer should not extrapolate a high resale value from the Buy decision.
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
For institution, organization, school, team, mascot, logo, or character items, inspect and preserve names, visual symbols, licensing sticker, manufacturer stamp, model number, copyright wording, year, product category, dimensions, material, and missing-component status.
Do not describe an officially licensed sticker as proof of a specific manufacturer. If the manufacturer stamp is unclear, ask for a closer photo rather than treating all identification as failed.
Build diverse product-focused search queries in this priority order where appropriate: exact visible phrase combinations, brand plus event/date plus item type, brand plus organization/team plus item type, distinctive slogan or reverse-text phrase, exact UPC/model/SKU, manufacturer plus item name, then descriptive fallback queries.
Use query types such as exact identifier, brand/product-title, visual descriptive, category/source-routed, and price/context when helpful. Do not force identifiers into every query if they are irrelevant or unreliable.
Use purchase context to route the search: retail store or mall means manufacturer, retailer, current-product, and price-comparison style sources; consignment, thrift, flea market, estate sale, and antique mall mean resale, vintage, collector, specialty reference, and exact-label searches; Facebook Marketplace or private seller means local value, pickup, negotiation, transport, and inspection risk.
Reject or weaken comparable items that conflict with reliable UPC, model, SKU, maker, brand, piece count, material, era, size, pattern, condition, or product type.
For a Santa decor box, include useful terms such as Santa's Workshop, Hubbard Ohio, Santa Claus, Santa figurine, Christmas decoration, holiday decor, boxed seasonal decor, green box, height/size such as 10 inch if provided, item code such as GAB031, UPC/barcode, and asking price such as $65 when provided.
For boxed seasonal decor, vintage decor, collectible figurines, ceramic/resin figures, and unbranded or private-label seasonal items, prioritize eBay-style resale results, Etsy-style vintage/holiday decor results, Mercari-style resale results, collector/reference/brand clue results, and general web results using exact label text.
For vintage, collectible, organization, logo, mascot, character, ceramic, cookie-jar, decor, and secondhand items, prioritize exact label and stamp searches, resale, vintage, collector/reference clues, organization/brand/character/licensee searches, and exact phrase results.
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
Use valuation evidence states consistently: supported, preliminary, or insufficient.
Use Estimated Fair Market Value only when exact or strong comparable evidence is sufficient. Use Preliminary Reference Range when evidence is weak, partial, active-listing-only, category-level, or AI-reasoning-only. Use Fair Value: Not established when no defensible range exists.
If evidence is insufficient, do not label any range as Estimated Fair Value, Fair Market Value, Typical Selling Price, or Confirmed Value. Say the price may be favorable only relative to similar active listings when that is the only evidence.
Active asking-price ranges are reference evidence only. Never present them as confirmed sold evidence or verified fair market value.
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
    }
  } else {
    $Schema = $ListingSchema
    $SchemaName = "marketplace_listing"
    $UseWebSearch = $true
    $SystemText = "You are Katherine’s Eye, a careful assistant that turns item photos and seller notes into marketplace listing drafts. Return only the requested structured JSON."
    $TaskText = @"
Create an evidence-backed marketplace listing draft. Be specific, honest, and concise.
You must use the web_search tool for item research before recommending a listing price.
First perform Visual Subject Recognition: answer what the photos broadly show before exact product identification, marketplace research, comparable analysis, pricing, or listing generation.
Visual subject confidence must remain independent from exact product, maker, era, licensing, authenticity, comparable, and pricing confidence.
Fill visualRecognitionSummary, visualSubject, visualSubjectCategory, visualSubjectConfidence, recognizedOrganization, recognizedBrand, recognizedCharacter, recognizedInstitution, recognizedTheme, visualRecognitionEvidence, visualRecognitionUnknowns, and visualRecognitionConflicts from supported visual evidence only.
Analyze all uploaded photos, extract visible product evidence, combine photo evidence with seller notes, identify the strongest probable item identity, build targeted searches, route sources by item type, evaluate comparable quality, and only then recommend a listing price.
Separate broad subject identity from exact product identity. Use a supported subject in listing copy, but do not invent exact maker, year, model, licensing, or authenticity.
If exact product identity is unknown, preserve the supported broad subject and state that exact item, maker, era, licensing, or authenticity remain unverified.
Preserve visible clues including brand, product name, series, model number, item number, manufacturer, manufacturer location, front-box wording, back-label wording, UPC/barcode, serial numbers, visible price stickers, materials, colors, patterns, dimensions, piece count, packaging, condition, wear, damage, missing parts, maker marks, signatures, date or era clues, and distinctive visual features.
Do not treat typed notes as more authoritative than photo evidence.
Use progressive fallback searches: exact identity query, strong attribute combination, broader category query, and reference or collector query where appropriate.
Do not route every item through the same generic source mix. Use sources relevant to current retail products, used resale, vintage, antiques, collectibles, handmade goods, holiday decor, electronics, tools, furniture, household goods, reference results, or manufacturer results.
Classify research evidence as Strong Comparable, Partial Comparable, Identity / Reference Result, Weak Match, or Rejected Match.
Weak or rejected matches must not materially drive recommendedListingPrice.
Never describe active asking prices as confirmed sold prices.
Never fabricate sales, marketplace activity, sold dates, demand, prices, sources, URLs, or search results.
When research is weak or unavailable, lower pricingConfidence, widen the price range, state uncertainty, and request useful additional evidence.
Do not present a highly confident or precise price based only on visual opinion.
The researchResults section must show source-backed results when they exist, or clearly say no usable source-backed research was found.
The searchQueriesUsed and sourcesSearched sections must show what the system searched or attempted.
OptimizedListingTitle and title should match. ListingDescription and description should match.
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
        search_context_size = "medium"
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
    if ($IsConsumerIntent) {
      return Set-ConsumerDecisionHonesty -Report $Report -Response $Response -BuyerIntake $BuyerIntake
    }
    return Set-LiveSearchHonesty -Report $Report -Response $Response -BuyerIntake $BuyerIntake -Platform $Platform
  }

  return Set-ListingResearchHonesty -Report $Report -Response $Response -Platform $Platform
}

function Set-ListingResearchHonesty {
  param(
    $Report,
    $Response,
    [string]$Platform
  )

  $SearchCalls = @(Get-WebSearchCalls $Response)
  $Citations = @(Get-UrlCitations $Response)
  $SourceBackedResults = @(
    Normalize-ReportArray $Report.researchResults |
      Where-Object { Test-CitedUrl $_ $Citations }
  )

  if ($SearchCalls.Count -gt 0 -and $SourceBackedResults.Count -gt 0) {
    $Status = "Live Search Completed - Source-Backed Comps Found"
    $Basis = "Pricing uses source-backed live research results that passed comparable filtering."
    $Report | Add-Member -NotePropertyName "researchResults" -NotePropertyValue @($SourceBackedResults) -Force
    if (-not (Normalize-ReportArray $Report.comparableQuality).Count) {
      $Report | Add-Member -NotePropertyName "comparableQuality" -NotePropertyValue @("Strong Comparable - source-backed research results were returned; verify exact match quality before pricing confidently.") -Force
    }
    $Report | Add-Member -NotePropertyName "pricingConfidence" -NotePropertyValue (Ensure-ConfidenceLayer $Report.pricingConfidence "Medium" "Source-backed research exists, but final pricing still depends on condition, completeness, platform, and buyer demand.") -Force
  } elseif ($SearchCalls.Count -gt 0) {
    $Status = "Live Search Completed - No Reliable Comps Found"
    $Basis = "Live research completed, but no source-backed exact or strong similar comps passed filtering. Pricing is a cautious estimate, not evidence-backed fact."
    $Report | Add-Member -NotePropertyName "researchResults" -NotePropertyValue @("Live research completed, but no source-backed exact or strong similar comparables passed filtering.") -Force
    $Report | Add-Member -NotePropertyName "comparableQuality" -NotePropertyValue @("Rejected Match - no returned result had enough cited, relevant evidence to drive listing price.") -Force
    $Report | Add-Member -NotePropertyName "pricingConfidence" -NotePropertyValue (Force-LowConfidence $Report.pricingConfidence "Listing price support is weak because reliable live research evidence is missing.") -Force
  } else {
    $Status = "Live Search Unavailable - AI Reasoning Only"
    $Basis = "Live research did not complete. Pricing is a cautious estimate, not evidence-backed fact."
    $Report | Add-Member -NotePropertyName "researchResults" -NotePropertyValue @("Live comparable research was attempted but unavailable before source-backed results could be retrieved.") -Force
    $Report | Add-Member -NotePropertyName "comparableQuality" -NotePropertyValue @("Rejected Match - live research did not return source-backed comparable evidence.") -Force
    $Report | Add-Member -NotePropertyName "pricingConfidence" -NotePropertyValue (Force-LowConfidence $Report.pricingConfidence "Listing price support is weak because live research did not complete.") -Force
  }

  $QueriesUsed = @(Get-SearchQueriesUsed $Response)
  if ($QueriesUsed.Count -gt 0) {
    $Report | Add-Member -NotePropertyName "searchQueriesUsed" -NotePropertyValue $QueriesUsed -Force
  }

  $Report | Add-Member -NotePropertyName "sourcesSearched" -NotePropertyValue @(Get-SearchCoverage $Report $Status) -Force
  $Report | Add-Member -NotePropertyName "pricingRationale" -NotePropertyValue (Ensure-Prefix $Report.pricingRationale $Basis) -Force
  $Report | Add-Member -NotePropertyName "priceStrategy" -NotePropertyValue (Ensure-Prefix $Report.priceStrategy $Basis) -Force

  if (-not (Clean-Text $Report.suggestedSellingPlatform)) {
    $Report | Add-Member -NotePropertyName "suggestedSellingPlatform" -NotePropertyValue $Platform -Force
  }

  $RejectedItems = @()
  if ($SourceBackedResults.Count -eq 0) {
    $RejectedItems = @(Normalize-ReportArray $Report.researchResults)
  }
  $Report = Set-ResearchVisibilityFields -Report $Report -Response $Response -Status $Status -StrongItems $SourceBackedResults -RejectedItems $RejectedItems -SearchCompleted ($SearchCalls.Count -gt 0)

  return Set-ValuationEvidenceLabels -Report $Report -ReliableCompsFound ($Status -eq "Live Search Completed - Source-Backed Comps Found") -SearchCompleted ($SearchCalls.Count -gt 0) -Workflow "listing"
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
      if ($BuyerRisk.limitedDownside -and -not $BuyerRisk.hardDownside -and $BuyerRisk.score -le 49) {
        $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Force-MediumConfidence $Report.buyerDecisionConfidence "Buyer decision confidence is moderate only because the current price limits dollar exposure. Item identification, live comp, and valuation confidence remain low; resale is not guaranteed and added costs could change the decision.") -Force
      } else {
        $Report | Add-Member -NotePropertyName "buyerDecisionConfidence" -NotePropertyValue (Force-LowConfidence $Report.buyerDecisionConfidence "The buyer decision should be conservative because live comp support is missing.") -Force
      }
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

  $RejectedItems = @()
  if (-not $ReliableCompsFound) {
    $RejectedItems = @((Normalize-ReportArray $Report.researchResults) + (Normalize-ReportArray $Report.noReliableComparableItemsFound))
  }
  $Report = Set-ResearchVisibilityFields -Report $Report -Response $Response -Status $Status -StrongItems $SourceBackedItems -RejectedItems $RejectedItems -SearchCompleted ($SearchCalls.Count -gt 0)

  return Set-ValuationEvidenceLabels -Report $Report -ReliableCompsFound $ReliableCompsFound -SearchCompleted ($SearchCalls.Count -gt 0) -Workflow "market_value"
}

function Set-ConsumerDecisionHonesty {
  param(
    $Report,
    $Response,
    $BuyerIntake = @{}
  )

  $SearchCalls = @(Get-WebSearchCalls $Response)
  $Citations = @(Get-UrlCitations $Response)
  $SourceBackedResults = @(
    Normalize-ReportArray $Report.researchResults |
      Where-Object { (Test-CitedUrl $_ $Citations) -and -not (Test-RejectedWeakComparableItem $_) }
  )
  $ReliableCompsFound = ($SearchCalls.Count -gt 0 -and $SourceBackedResults.Count -gt 0)
  $AskingPrice = Get-ConsumerAskingPriceNumber $BuyerIntake
  $FairValue = $(if ($ReliableCompsFound) { Get-ConsumerFairValueNumber $Report } else { $null })
  $ConditionProfile = Get-ConsumerConditionProfile $BuyerIntake
  $RiskFlags = @(Get-ConsumerRiskFlags -BuyerIntake $BuyerIntake -AskingPrice $AskingPrice -FairValue $FairValue -ReliableCompsFound $ReliableCompsFound -ConditionProfile $ConditionProfile)
  $Decision = Get-ConsumerDecision -AskingPrice $AskingPrice -FairValue $FairValue -ReliableCompsFound $ReliableCompsFound -ConditionProfile $ConditionProfile -RiskFlags $RiskFlags
  $Offer = Get-ConsumerOffer -AskingPrice $AskingPrice -FairValue $FairValue -Decision $Decision -ConditionProfile $ConditionProfile
  $Status = $(if ($ReliableCompsFound) { "Live Search Completed - Source-Backed Comps Found" } elseif ($SearchCalls.Count -gt 0) { "Live Search Completed - No Reliable Comps Found" } else { "Live Search Unavailable - AI Reasoning Only" })
  $Basis = $(if ($ReliableCompsFound) { "Pricing uses source-backed comparable or reference results that passed filtering." } elseif ($SearchCalls.Count -gt 0) { "Live research completed, but no source-backed exact or strong similar comps passed filtering. Consumer decision is low confidence." } else { "Live research did not complete. Consumer decision is AI-reasoning-only and low confidence." })

  if ($ReliableCompsFound) {
    $Report | Add-Member -NotePropertyName "researchResults" -NotePropertyValue @($SourceBackedResults | Select-Object -First 8) -Force
    if (-not (Normalize-ReportArray $Report.comparableQuality).Count) {
      $Report | Add-Member -NotePropertyName "comparableQuality" -NotePropertyValue @("Strong Comparable - source-backed research results were returned; verify exact item and condition before paying confidently.") -Force
    }
  } elseif ($SearchCalls.Count -gt 0) {
    $Report | Add-Member -NotePropertyName "researchResults" -NotePropertyValue @("Live research completed, but no source-backed exact or strong similar comparables passed filtering.") -Force
    $Report | Add-Member -NotePropertyName "comparableQuality" -NotePropertyValue @("Rejected Match - no returned result had enough cited, relevant evidence to drive a personal-use value decision.") -Force
  } else {
    $Report | Add-Member -NotePropertyName "researchResults" -NotePropertyValue @("Live comparable research was attempted but unavailable before source-backed results could be retrieved.") -Force
    $Report | Add-Member -NotePropertyName "comparableQuality" -NotePropertyValue @("Rejected Match - live research did not return source-backed comparable evidence.") -Force
  }

  $Report | Add-Member -NotePropertyName "buyerIntent" -NotePropertyValue "personal_use" -Force
  $Report | Add-Member -NotePropertyName "askingPrice" -NotePropertyValue (Get-ConsumerAskingPriceText $BuyerIntake) -Force
  $Report | Add-Member -NotePropertyName "valueRating" -NotePropertyValue $Decision.valueRating -Force
  $Report | Add-Member -NotePropertyName "recommendation" -NotePropertyValue $Decision.recommendation -Force
  $Report | Add-Member -NotePropertyName "consumerDownsideRisk" -NotePropertyValue $Decision.downsideRisk -Force
  $Report | Add-Member -NotePropertyName "cautiousBuyExplanation" -NotePropertyValue $Decision.cautiousBuyExplanation -Force
  $Report | Add-Member -NotePropertyName "recommendedOffer" -NotePropertyValue @($Offer.recommendedOffer) -Force
  $Report | Add-Member -NotePropertyName "openingOffer" -NotePropertyValue $Offer.openingOffer -Force
  $Report | Add-Member -NotePropertyName "targetPurchasePrice" -NotePropertyValue $Offer.targetPurchasePrice -Force
  $Report | Add-Member -NotePropertyName "maximumRecommendedPrice" -NotePropertyValue $Offer.maximumRecommendedPrice -Force
  $Report | Add-Member -NotePropertyName "walkAwayPrice" -NotePropertyValue $Offer.walkAwayPrice -Force
  $Report | Add-Member -NotePropertyName "riskFlags" -NotePropertyValue @($RiskFlags) -Force
  $Report | Add-Member -NotePropertyName "pricingConfidence" -NotePropertyValue $Decision.pricingConfidence -Force
  $Report | Add-Member -NotePropertyName "pricingRationale" -NotePropertyValue (Ensure-Prefix $Report.pricingRationale $Basis) -Force
  $Report | Add-Member -NotePropertyName "sourcesSearched" -NotePropertyValue @(Get-SearchCoverage $Report $Status) -Force
  $Report | Add-Member -NotePropertyName "searchQueriesUsed" -NotePropertyValue @(Get-SearchQueriesUsed $Response) -Force

  if (-not $ReliableCompsFound) {
    $Report | Add-Member -NotePropertyName "estimatedFairMarketValue" -NotePropertyValue (Ensure-Prefix $Report.estimatedFairMarketValue "Insufficient evidence - ") -Force
    $Report | Add-Member -NotePropertyName "fairPriceRange" -NotePropertyValue @("Insufficient evidence - Low, typical, and high fair prices are not supported until exact identity, condition, and comparable evidence improve.") -Force
    $Report | Add-Member -NotePropertyName "additionalInformationNeeded" -NotePropertyValue @(Merge-ConsumerArrays $Report.additionalInformationNeeded @("Current asking price, exact identity, condition, and one source-backed exact or strong similar comparable result.")) -Force
  }

  $Risks = @(Merge-ConsumerArrays $Report.productOrConditionRisks @($RiskFlags | ForEach-Object { "Risk flag: $_" }))
  $Report | Add-Member -NotePropertyName "productOrConditionRisks" -NotePropertyValue @($Risks | Select-Object -First 8) -Force

  $RejectedItems = @()
  if (-not $ReliableCompsFound) {
    $RejectedItems = @(Normalize-ReportArray $Report.researchResults)
  }
  $Report = Set-ResearchVisibilityFields -Report $Report -Response $Response -Status $Status -StrongItems $SourceBackedResults -RejectedItems $RejectedItems -SearchCompleted ($SearchCalls.Count -gt 0)

  return Set-ValuationEvidenceLabels -Report $Report -ReliableCompsFound $ReliableCompsFound -SearchCompleted ($SearchCalls.Count -gt 0) -Workflow "personal_use"
}

function Get-ConsumerAskingPriceNumber {
  param($BuyerIntake)

  $Text = Clean-Text (Get-BuyerIntakeValue $BuyerIntake "asking_price")
  foreach ($Match in [regex]::Matches($Text, "(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)")) {
    $Amount = 0.0
    if ([double]::TryParse($Match.Groups[1].Value.Replace(",", ""), [ref]$Amount)) {
      return $Amount
    }
  }

  return $null
}

function Get-ConsumerAskingPriceText {
  param($BuyerIntake)

  $Text = Clean-Text (Get-BuyerIntakeValue $BuyerIntake "asking_price")
  if ($Text -and $Text -ne "not provided") {
    return "Current asking price: $(Format-MoneyInputText $Text)"
  }

  return "Not provided - enter the current asking price for a personal-use value decision."
}

function Get-ConsumerFairValueNumber {
  param($Report)

  $Parts = @((Clean-Text $Report.estimatedFairMarketValue))
  $Parts += @(Normalize-ReportArray $Report.fairPriceRange)
  $Amounts = @(Get-MoneyAmounts ($Parts -join " ") | Sort-Object)
  if ($Amounts.Count -eq 0) {
    return $null
  }

  $Middle = [Math]::Floor($Amounts.Count / 2)
  if ($Amounts.Count % 2 -eq 1) {
    return [double]$Amounts[$Middle]
  }

  return ([double]$Amounts[$Middle - 1] + [double]$Amounts[$Middle]) / 2
}

function Get-ConsumerConditionProfile {
  param($BuyerIntake)

  $Condition = (Get-BuyerIntakeValue $BuyerIntake "item_condition").ToLowerInvariant()
  $Concerns = @()
  if ($BuyerIntake.ContainsKey("condition_concerns") -and $BuyerIntake["condition_concerns"] -is [array]) {
    $Concerns = @($BuyerIntake["condition_concerns"])
  }
  $ConcernText = ($Concerns -join " ").ToLowerInvariant()

  return [pscustomobject]@{
    isUnknown = (-not $Condition -or $Condition -eq "not provided" -or $Condition -match "unknown")
    hasHardRisk = ($Condition -match "poor|for_parts|damaged|missing|not_working|untested" -or $ConcernText -match "missing|not_working|untested|incomplete|authenticity|cracks")
    hasModerateRisk = ($Condition -match "used|vintage|fair|open_box" -or $ConcernText -match "visible_damage|stains_or_wear|odor_or_smoke|other")
    missingParts = ($Condition -match "missing" -or $ConcernText -match "missing|incomplete")
    repairRisk = ($Condition -match "poor|for_parts|damaged|not_working|untested" -or $ConcernText -match "not_working|untested|cracks|visible_damage")
  }
}

function Get-ConsumerRiskFlags {
  param(
    $BuyerIntake,
    $AskingPrice,
    $FairValue,
    [bool]$ReliableCompsFound,
    $ConditionProfile
  )

  $Flags = @()
  if (-not $ReliableCompsFound) { $Flags += "Weak Comparable Evidence" }
  if ($null -ne $AskingPrice -and $null -ne $FairValue -and $FairValue -gt 0 -and $AskingPrice -gt ($FairValue * $ConsumerDecisionThresholds["fairMaxRatio"])) { $Flags += "Price Above Market" }
  if ($ConditionProfile.isUnknown) { $Flags += "Condition Unclear" }
  if ($ConditionProfile.missingParts) { $Flags += "Missing Parts" }
  if ($ConditionProfile.repairRisk) { $Flags += "Repair Risk" }
  if ((Get-BuyerIntakeValue $BuyerIntake "purchase_context") -match "facebook_marketplace|private_seller|flea_market|estate_sale" -or (Get-BuyerIntakeValue $BuyerIntake "buyer_notes") -match "as[-\s]?is|final sale|no returns?|cash only") { $Flags += "No Return Protection" }
  if ((Get-BuyerIntakeValue $BuyerIntake "known_model") -eq "not provided" -and (Get-BuyerIntakeValue $BuyerIntake "known_sku") -eq "not provided" -and (Get-BuyerIntakeValue $BuyerIntake "known_upc") -eq "not provided") { $Flags += "Identity Not Confirmed" }

  return @($Flags | Where-Object { $_ } | Select-Object -Unique | Select-Object -First 10)
}

function Get-ConsumerDecision {
  param(
    $AskingPrice,
    $FairValue,
    [bool]$ReliableCompsFound,
    $ConditionProfile,
    [array]$RiskFlags
  )

  if ($null -eq $AskingPrice -or $null -eq $FairValue -or $FairValue -le 0 -or -not $ReliableCompsFound) {
    return [pscustomobject]@{
      valueRating = "Insufficient Evidence"
      recommendation = "Need More Information"
      pricingConfidence = (Force-LowConfidence "" "Consumer value rating is insufficient because asking price, fair value, or source-backed comparable evidence is missing.")
    }
  }

  $Ratio = $AskingPrice / $FairValue
  $ValueRating = "Poor Value"
  $Recommendation = "Pass"
  $LowDollarExposure = ($AskingPrice -le $ConsumerDecisionThresholds["lowDollarCautiousBuyMax"])
  $ModestDollarExposure = ($AskingPrice -le $ConsumerDecisionThresholds["modestDollarCautiousBuyMax"])
  $CautiousBuySupported = ($ReliableCompsFound -and -not $ConditionProfile.hasHardRisk -and ($LowDollarExposure -or $ModestDollarExposure) -and ($Ratio -le $ConsumerDecisionThresholds["cautiousBuyMaxRatio"]))

  if ($Ratio -le $ConsumerDecisionThresholds["exceptionalMaxRatio"]) {
    $ValueRating = "Exceptional Value"
    $Recommendation = "Buy"
  } elseif ($Ratio -le $ConsumerDecisionThresholds["goodMaxRatio"]) {
    $ValueRating = "Good Value"
    $Recommendation = "Buy"
  } elseif ($Ratio -le $ConsumerDecisionThresholds["fairMaxRatio"]) {
    $ValueRating = "Fair Price"
    $Recommendation = "Buy If It Fits Your Needs"
  } elseif ($Ratio -le $ConsumerDecisionThresholds["slightlyOverpricedMaxRatio"]) {
    $ValueRating = "Slightly Overpriced"
    $Recommendation = "Negotiate"
  } elseif ($Ratio -le $ConsumerDecisionThresholds["overpricedMaxRatio"]) {
    $ValueRating = "Overpriced"
    $Recommendation = "Wait for a Better Price"
  }

  if ($CautiousBuySupported -and ($Recommendation -match "Pass|Need More|Wait|Negotiate")) {
    $ValueRating = "Potentially Good Value"
    $Recommendation = "Buy"
  }

  if ($ConditionProfile.hasHardRisk) {
    if ($ValueRating -match "Exceptional|Good") { $ValueRating = "Fair Price" }
    if ($Recommendation -eq "Buy") { $Recommendation = "Negotiate" }
  } elseif ($ConditionProfile.hasModerateRisk -and $Recommendation -eq "Buy" -and -not $CautiousBuySupported) {
    $Recommendation = "Buy If It Fits Your Needs"
  }

  if ($ConditionProfile.isUnknown -and -not $LowDollarExposure -and ($Recommendation -match "Buy")) {
    $Recommendation = "Need More Information"
    if ($ValueRating -match "Exceptional|Good") { $ValueRating = "Insufficient Evidence" }
  }

  $DownsideRisk = "$(if ($LowDollarExposure) { 'Low' } elseif ($ModestDollarExposure) { 'Moderate' } else { 'Higher' }) absolute downside at $(Format-Money $AskingPrice); confidence can remain modest while a practical personal-use Buy is still supported."
  $CautiousExplanation = ""
  if ($CautiousBuySupported) {
    $CautiousExplanation = "Cautious Buy logic - The asking price is below the supported reference value and absolute dollar exposure is limited. Active asking prices must remain labeled separately from confirmed sold evidence."
  }

  return [pscustomobject]@{
    valueRating = $ValueRating
    recommendation = $Recommendation
    pricingConfidence = $(if ($CautiousBuySupported) { (Ensure-ConfidenceLayer "" "Medium" "Exact or strong source-backed evidence and limited dollar downside support a cautious personal-use Buy; active asking prices are not confirmed sold prices.") } else { (Ensure-ConfidenceLayer "" "Medium" "Source-backed evidence supports the price direction, but exact condition and personal fit still matter.") })
    downsideRisk = $DownsideRisk
    cautiousBuyExplanation = $CautiousExplanation
  }
}

function Get-ConsumerOffer {
  param(
    $AskingPrice,
    $FairValue,
    $Decision,
    $ConditionProfile
  )

  if ($Decision.valueRating -eq "Insufficient Evidence" -or $null -eq $AskingPrice -or $null -eq $FairValue -or $FairValue -le 0) {
    return [pscustomobject]@{
      openingOffer = "Not supported yet - verify identity, condition, asking price, and reliable comparables first."
      targetPurchasePrice = "Not supported yet - evidence is too weak for a responsible target price."
      maximumRecommendedPrice = "Not supported yet - do not set a maximum from weak evidence."
      walkAwayPrice = "Not enough evidence for a precise walk-away price."
      recommendedOffer = @("Opening Offer: Not supported yet.", "Target Purchase Price: Not supported yet.", "Maximum Recommended Price: Not supported yet.")
    }
  }

  $Multiplier = $(if ($ConditionProfile.hasHardRisk) { 0.84 } elseif ($ConditionProfile.hasModerateRisk) { 0.94 } else { 1.04 })
  $MaxPrice = Round-Money ($FairValue * $Multiplier)
  $TargetPrice = Round-Money ([Math]::Min($AskingPrice, $MaxPrice))
  $OpeningOffer = Round-Money ([Math]::Max(1, $TargetPrice * 0.90))

  if ($AskingPrice -le ($FairValue * $ConsumerDecisionThresholds["goodMaxRatio"])) {
    $TargetPrice = Round-Money $AskingPrice
    $OpeningOffer = Round-Money ([Math]::Max(1, $AskingPrice * 0.95))
    $MaxPrice = Round-Money ([Math]::Max($TargetPrice, [Math]::Min($FairValue * 1.03, $MaxPrice)))
  } elseif ($AskingPrice -gt ($FairValue * $ConsumerDecisionThresholds["fairMaxRatio"])) {
    $TargetPrice = Round-Money ([Math]::Min($MaxPrice, $FairValue * 0.96))
    $OpeningOffer = Round-Money ([Math]::Max(1, $TargetPrice * 0.88))
  }

  if ($OpeningOffer -gt $TargetPrice) { $OpeningOffer = $TargetPrice }
  if ($TargetPrice -gt $MaxPrice) { $TargetPrice = $MaxPrice }

  $OpeningText = "Opening Offer: $(Format-Money $OpeningOffer)"
  $TargetText = "Target Purchase Price: $(Format-Money $TargetPrice)"
  $MaxText = "Maximum Recommended Price: $(Format-Money $MaxPrice)"

  return [pscustomobject]@{
    openingOffer = $OpeningText
    targetPurchasePrice = $TargetText
    maximumRecommendedPrice = $MaxText
    walkAwayPrice = "Walk-Away Price: $(Format-Money $MaxPrice) for personal use unless condition, accessories, warranty, return protection, or exact model evidence improves."
    recommendedOffer = @($OpeningText, $TargetText, $MaxText)
  }
}

function Merge-ConsumerArrays {
  param($First, $Second)

  $Items = @()
  $Items += @(Normalize-ReportArray $First)
  $Items += @(Normalize-ReportArray $Second)
  return @($Items | Where-Object { $_ } | Select-Object -Unique | Select-Object -First 8)
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

function Force-MediumConfidence {
  param(
    [string]$Value,
    [string]$Reason
  )

  $Text = Clean-Text $Value
  $Detail = ($Text -replace "^(High|Medium|Low)\s*[-:]\s*", "").Trim()
  if (-not $Detail) {
    $Detail = "Supports: very low current asking price and limited dollar exposure. Weakens: missing source-backed comparable evidence. Improve by verifying exact identity, condition, demand, and added costs."
  }

  return "Medium - $Reason $Detail".Trim()
}

function Join-ValuationText {
  param([array]$Values)

  $Parts = @()
  foreach ($Value in $Values) {
    if ($null -eq $Value) {
      continue
    }
    if ($Value -is [array]) {
      foreach ($Item in $Value) {
        $Text = Clean-Text $Item
        if ($Text) { $Parts += $Text }
      }
    } else {
      $Text = Clean-Text $Value
      if ($Text) { $Parts += $Text }
    }
  }

  return ($Parts -join " ")
}

function Get-ValuationEvidenceClassification {
  param(
    $Report,
    [bool]$ReliableCompsFound = $false,
    [bool]$SearchCompleted = $false
  )

  $EvidenceText = (Join-ValuationText @(
    $Report.valueRating,
    $Report.priceConfidence,
    $Report.pricingConfidence,
    $Report.valuationConfidence,
    $Report.liveCompConfidence,
    $Report.buyerDecisionConfidence,
    $Report.priceBasis,
    $Report.currentPriceAssessment,
    $Report.researchResults,
    $Report.comparableQuality,
    $Report.noReliableComparableItemsFound,
    $Report.aiOnlyRoughValueRange,
    $Report.estimatedFairMarketValue,
    $Report.fairPriceRange,
    $Report.estimatedMarketValue
  )).ToLowerInvariant()
  $ValueRating = (Clean-Text $Report.valueRating).ToLowerInvariant()
  $HasInsufficientRating = ($ValueRating -eq "insufficient evidence" -or $EvidenceText -match "\binsufficient evidence\b")
  $HasWeakEvidence = $EvidenceText -match "no reliable|weak|partial|rejected|ai-only|ai only|rough value|active listing|active asking|not established|unavailable|low confidence|source-backed comps? (?:were )?not available"
  $Range = Get-ValuationEvidenceRange $Report

  if ($ReliableCompsFound -and -not $HasInsufficientRating -and -not $HasWeakEvidence) {
    return [pscustomobject]@{
      state = "supported"
      label = "Estimated Fair Market Value"
      range = $Range
      confidence = "Supported"
      explanation = "Exact or strong source-backed comparable evidence supports a fair-market-value estimate."
    }
  }

  if ($Range) {
    $Explanation = "Live comparable search did not produce source-backed valuation evidence. This range is only a cautious reference from item evidence and market reasoning."
    if ($SearchCompleted) {
      $Explanation = "No strong or confirmed sold comparable evidence supports a fair-market-value estimate. This range is only a reference from weak, partial, active, or category-level evidence found during the current search."
    }
    return [pscustomobject]@{
      state = "preliminary"
      label = "Preliminary Reference Range"
      range = $Range
      confidence = "Low"
      explanation = $Explanation
    }
  }

  return [pscustomobject]@{
    state = "insufficient"
    label = "Fair Value Not Established"
    range = ""
    confidence = "Low"
    explanation = "The available evidence is too weak for a defensible dollar range."
  }
}

function Get-ZeroEvidenceAskingPriceText {
  param($Report)

  foreach ($Value in @($Report.askingPrice, $Report.currentAskingPrice, $Report.visiblePrice)) {
    $Text = Clean-Text $Value
    if ($Text) {
      return $Text
    }
  }

  return ""
}

function Get-ZeroEvidenceLowDownsideText {
  param([string]$AskingPriceText)

  $Price = $(if ($AskingPriceText) { $AskingPriceText } else { "the stated asking price" })
  return "At $Price, this may be a reasonable personal-use purchase only because the financial exposure is limited and the item appears identifiable from the submitted evidence. The current search did not return visible source-backed comparable evidence, so market value was not established."
}

function Test-ZeroEvidencePersonalBuyAllowed {
  param(
    $Report,
    [string]$AskingPriceText,
    [string]$Workflow = ""
  )

  $IntentText = (Clean-Text "$Workflow $($Report.buyerIntent) $($Report.purchase_intent)").ToLowerInvariant()
  $Amounts = @(Get-MoneyAmounts $AskingPriceText)
  if ($Amounts.Count -eq 0) {
    return $false
  }

  $RiskText = (Join-ValuationText @($Report.productOrConditionRisks, $Report.riskFlags, $Report.primary_risk_factors, $Report.conditionNotes)).ToLowerInvariant()
  return ($IntentText -match "personal|myself|personal_use" -and [double]$Amounts[0] -le $ConsumerDecisionThresholds["lowDollarCautiousBuyMax"] -and $RiskText -notmatch "repair|missing|not working|not_working|for parts|unsafe|authenticity")
}

function Sanitize-UnsupportedMarketText {
  param(
    [string]$Text,
    [string]$AskingPriceText = ""
  )

  $Source = Clean-Text $Text
  if (-not $Source) {
    return $Source
  }

  $UnsupportedClaim = $Source -match "reference center|market range|median market|market low|market high|active asking range|sold range|price-to-market|below[- ]market|below inferred|inferred fair|estimated fair market|fair market value|market suggests|visible market evidence|typical market|derived market|source-backed value|comparable evidence appears useful enough"
  $MoneyRange = $Source -match "\$\s*\d[\d,]*(?:\.\d{1,2})?\s*(?:-|to|â€“|â€”)\s*\$?\s*\d[\d,]*(?:\.\d{1,2})?"
  $AskingAmounts = @(Get-MoneyAmounts $AskingPriceText)
  $AskingAmount = $(if ($AskingAmounts.Count) { [double]$AskingAmounts[0] } else { $null })
  $HasNonAskingMoney = $false
  foreach ($Amount in @(Get-MoneyAmounts $Source)) {
    if ($null -eq $AskingAmount -or [math]::Round([double]$Amount) -ne [math]::Round($AskingAmount)) {
      $HasNonAskingMoney = $true
      break
    }
  }

  if ($UnsupportedClaim -or $MoneyRange -or ($HasNonAskingMoney -and $Source -match "\bmarket|value|range|reference|asking|sold|price|below|above\b")) {
    return "The current search did not return visible source-backed comparable evidence. Fair value is not established."
  }

  return $Source
}

function Sanitize-ZeroEvidenceReportText {
  param(
    $Report,
    [string]$AskingPriceText
  )

  $AllowedPriceKeys = @("askingPrice", "currentAskingPrice", "visiblePrice")
  foreach ($Property in @($Report.PSObject.Properties)) {
    if ($Property.Name -eq "searchDiagnostics") {
      continue
    }

    if ($AllowedPriceKeys -contains $Property.Name) {
      continue
    }

    if ($Property.Value -is [string]) {
      $Report | Add-Member -NotePropertyName $Property.Name -NotePropertyValue (Sanitize-UnsupportedMarketText -Text $Property.Value -AskingPriceText $AskingPriceText) -Force
    } elseif ($Property.Value -is [array]) {
      $CleanItems = @(
        foreach ($Item in $Property.Value) {
          if ($Item -is [string]) {
            Sanitize-UnsupportedMarketText -Text $Item -AskingPriceText $AskingPriceText
          } else {
            $Item
          }
        }
      )
      $Report | Add-Member -NotePropertyName $Property.Name -NotePropertyValue @($CleanItems | Where-Object { $_ -ne "" }) -Force
    }
  }

  return $Report
}

function Set-ZeroEvidenceGuard {
  param(
    $Report,
    [string]$Workflow = ""
  )

  $AskingPriceText = Get-ZeroEvidenceAskingPriceText $Report
  $SafeLowDownsideText = Get-ZeroEvidenceLowDownsideText $AskingPriceText
  $Report = Sanitize-ZeroEvidenceReportText -Report $Report -AskingPriceText $AskingPriceText
  $PersonalBuyAllowed = Test-ZeroEvidencePersonalBuyAllowed -Report $Report -AskingPriceText $AskingPriceText -Workflow $Workflow

  $Report | Add-Member -NotePropertyName "valuationEvidenceState" -NotePropertyValue "insufficient" -Force
  $Report | Add-Member -NotePropertyName "valuationEvidenceLabel" -NotePropertyValue "Fair Value Not Established" -Force
  $Report | Add-Member -NotePropertyName "valuationEvidenceExplanation" -NotePropertyValue "Zero visible structured source-backed comparable results were retained. Market value is not established." -Force
  if ($Workflow -eq "listing") {
    $Report | Add-Member -NotePropertyName "pricingEvidenceState" -NotePropertyValue "insufficient" -Force
  }
  $Report | Add-Member -NotePropertyName "estimatedFairMarketValue" -NotePropertyValue "" -Force
  $Report | Add-Member -NotePropertyName "estimatedMarketValue" -NotePropertyValue "" -Force
  $Report | Add-Member -NotePropertyName "fairPriceRange" -NotePropertyValue @() -Force
  $Report | Add-Member -NotePropertyName "preliminaryReferenceRange" -NotePropertyValue "" -Force
  $Report | Add-Member -NotePropertyName "referenceRangeBasis" -NotePropertyValue "" -Force
  foreach ($Name in @("referenceCenter", "marketLow", "marketHigh", "activeAskingRange", "soldRange", "priceToMarketRatio", "belowMarketPercent", "aiOnlyRoughValueRange", "suggestedListingPrice", "expectedSalePrice", "minimumAcceptablePrice", "recommendedListingPrice", "suggestedOfferRange")) {
    $Report | Add-Member -NotePropertyName $Name -NotePropertyValue "" -Force
  }
  $Report | Add-Member -NotePropertyName "fairValueNotEstablished" -NotePropertyValue "Fair Value: Not established" -Force
  $Report | Add-Member -NotePropertyName "valueRating" -NotePropertyValue "Insufficient Evidence" -Force
  $Report | Add-Member -NotePropertyName "whatThisMeans" -NotePropertyValue "The current search did not return visible source-backed comparable evidence. Fair value is not established." -Force
  $Report | Add-Member -NotePropertyName "priceBasis" -NotePropertyValue "Fair value not established - the current search did not return visible source-backed comparable evidence." -Force
  $Report | Add-Member -NotePropertyName "currentPriceAssessment" -NotePropertyValue "Insufficient evidence - no source-backed market comparison is supported." -Force
  $Report | Add-Member -NotePropertyName "pricingRationale" -NotePropertyValue $SafeLowDownsideText -Force
  $Report | Add-Member -NotePropertyName "consumerDownsideRisk" -NotePropertyValue $(if ($AskingPriceText) { "Limited-dollar exposure can be considered from the user's asking price ($AskingPriceText) only. No market comparison was established." } else { "No asking price was available for a downside-only personal-use assessment." }) -Force
  $Report | Add-Member -NotePropertyName "recommendedOffer" -NotePropertyValue @() -Force
  $Report | Add-Member -NotePropertyName "openingOffer" -NotePropertyValue "Not source-supported - no market value was established." -Force
  $Report | Add-Member -NotePropertyName "targetPurchasePrice" -NotePropertyValue "Not source-supported - no market value was established." -Force
  $Report | Add-Member -NotePropertyName "maximumRecommendedPrice" -NotePropertyValue "Not source-supported - no market value was established." -Force
  $Report | Add-Member -NotePropertyName "maximumRecommendedBuyPrice" -NotePropertyValue "Not source-supported - no market value was established." -Force
  $Report | Add-Member -NotePropertyName "walkAwayPrice" -NotePropertyValue "No market-based walk-away price is supported without visible comparable evidence." -Force
  $Report | Add-Member -NotePropertyName "negotiationGuidance" -NotePropertyValue $(if ($AskingPriceText) { "Only the user's asking price ($AskingPriceText) is visible. Any personal-use decision should be based on limited financial exposure, condition, and whether the buyer likes the item; not on an established market value." } else { "No market-based negotiation guidance is supported without visible comparable evidence." }) -Force
  $Report | Add-Member -NotePropertyName "reasonsForCaution" -NotePropertyValue @(Merge-ConsumerArrays $Report.reasonsForCaution @("No visible source-backed comparable evidence was retained.", "Market value was not established.")) -Force
  $Report | Add-Member -NotePropertyName "additionalInformationNeeded" -NotePropertyValue @(Merge-ConsumerArrays $Report.additionalInformationNeeded @("Visible exact or strong source-backed comparable records are needed before showing source-backed price guidance.")) -Force

  if ($PersonalBuyAllowed) {
    $ExistingRecommendation = Clean-Text $Report.recommendation
    if (-not $ExistingRecommendation -or $ExistingRecommendation -match "Need More Information") {
      $ExistingRecommendation = "Buy"
    }
    $Report | Add-Member -NotePropertyName "recommendation" -NotePropertyValue $ExistingRecommendation -Force
    $Report | Add-Member -NotePropertyName "cautiousBuyExplanation" -NotePropertyValue $SafeLowDownsideText -Force
    $Report | Add-Member -NotePropertyName "reasonsToBuy" -NotePropertyValue @($SafeLowDownsideText) -Force
  } else {
    if (-not (Clean-Text $Report.recommendation)) {
      $Report | Add-Member -NotePropertyName "recommendation" -NotePropertyValue "Need More Information" -Force
    }
    $Report | Add-Member -NotePropertyName "cautiousBuyExplanation" -NotePropertyValue "" -Force
  }

  return $Report
}

function Set-ValuationEvidenceLabels {
  param(
    $Report,
    [bool]$ReliableCompsFound = $false,
    [bool]$SearchCompleted = $false,
    [string]$Workflow = ""
  )

  $VisibleResultCount = Get-VisibleResearchResultCount $Report
  $SupportingResultCount = Get-ReferenceSupportingResearchResultCount $Report
  if ($SupportingResultCount -eq 0) {
    return Set-ZeroEvidenceGuard -Report $Report -Workflow $Workflow
  }

  $Classified = Get-ValuationEvidenceClassification -Report $Report -ReliableCompsFound $ReliableCompsFound -SearchCompleted $SearchCompleted
  if ($Classified.state -eq "preliminary" -and $SupportingResultCount -eq 0) {
    $Classified = [pscustomobject]@{
      state = "insufficient"
      label = "Fair Value Not Established"
      range = ""
      confidence = "Low"
      explanation = "The report did not include visible structured strong, partial, or reference records to support a preliminary range."
    }
  }
  $Report | Add-Member -NotePropertyName "valuationEvidenceState" -NotePropertyValue $Classified.state -Force
  $Report | Add-Member -NotePropertyName "valuationEvidenceLabel" -NotePropertyValue $Classified.label -Force
  $Report | Add-Member -NotePropertyName "valuationEvidenceExplanation" -NotePropertyValue $Classified.explanation -Force

  if ($Workflow -eq "listing") {
    $Report | Add-Member -NotePropertyName "pricingEvidenceState" -NotePropertyValue $Classified.state -Force
    $Report | Add-Member -NotePropertyName "pricingRationale" -NotePropertyValue (Ensure-Prefix $Report.pricingRationale "Valuation evidence state: $($Classified.state). ") -Force
    return $Report
  }

  if ($Classified.state -eq "supported") {
    $Report | Add-Member -NotePropertyName "estimatedFairMarketValue" -NotePropertyValue (Normalize-MoneyLabelText $Report.estimatedFairMarketValue) -Force
    $Report | Add-Member -NotePropertyName "estimatedMarketValue" -NotePropertyValue (Normalize-MoneyLabelText $Report.estimatedMarketValue) -Force
    $FairPriceRange = @(Normalize-ReportArray $Report.fairPriceRange | ForEach-Object { Normalize-MoneyLabelText $_ })
    $Report | Add-Member -NotePropertyName "fairPriceRange" -NotePropertyValue @($FairPriceRange | Where-Object { $_ }) -Force
    $Report | Add-Member -NotePropertyName "preliminaryReferenceRange" -NotePropertyValue "" -Force
    $Report | Add-Member -NotePropertyName "fairValueNotEstablished" -NotePropertyValue "" -Force
    return $Report
  }

  if ($Classified.state -eq "preliminary") {
    $Reference = Get-PreliminaryReferenceRangeText -Classification $Classified -SearchCompleted $SearchCompleted -VisibleResultCount $SupportingResultCount
    $Report | Add-Member -NotePropertyName "preliminaryReferenceRange" -NotePropertyValue $Reference -Force
    if (-not (Clean-Text $Report.referenceRangeBasis)) {
      $Report | Add-Member -NotePropertyName "referenceRangeBasis" -NotePropertyValue "$SupportingResultCount visible strong, partial, or reference result$(if ($SupportingResultCount -eq 1) { '' } else { 's' }) support this preliminary reference range. $VisibleResultCount total search result$(if ($VisibleResultCount -eq 1) { '' } else { 's' }) are visible in Research Details." -Force
    }
    $Report | Add-Member -NotePropertyName "fairValueNotEstablished" -NotePropertyValue "" -Force
    $Report | Add-Member -NotePropertyName "estimatedFairMarketValue" -NotePropertyValue "" -Force
    $Report | Add-Member -NotePropertyName "estimatedMarketValue" -NotePropertyValue "" -Force
    $Report | Add-Member -NotePropertyName "fairPriceRange" -NotePropertyValue @() -Force
    if ((Clean-Text $Report.valueRating) -match "Insufficient Evidence") {
      $Report | Add-Member -NotePropertyName "valueRating" -NotePropertyValue "Insufficient Evidence" -Force
    }
    $Report | Add-Member -NotePropertyName "whatThisMeans" -NotePropertyValue (Get-WeakEvidenceMeaningText -Report $Report -Classification $Classified) -Force
    $Report | Add-Member -NotePropertyName "bestNextStep" -NotePropertyValue (Get-BestNextEvidenceStep $Report) -Force
    $Report | Add-Member -NotePropertyName "priceBasis" -NotePropertyValue (Ensure-Prefix $Report.priceBasis "Preliminary reference only - active asking prices, weak partial results, or AI reasoning are not confirmed fair market value. ") -Force
    $Report | Add-Member -NotePropertyName "currentPriceAssessment" -NotePropertyValue (Get-CautiousCurrentPriceAssessment -Value $Report.currentPriceAssessment -Report $Report -Classification $Classified) -Force
    return $Report
  }

  $Report | Add-Member -NotePropertyName "preliminaryReferenceRange" -NotePropertyValue "" -Force
  $Report | Add-Member -NotePropertyName "fairValueNotEstablished" -NotePropertyValue "Fair Value: Not established" -Force
  $Report | Add-Member -NotePropertyName "estimatedFairMarketValue" -NotePropertyValue "" -Force
  $Report | Add-Member -NotePropertyName "estimatedMarketValue" -NotePropertyValue "" -Force
  $Report | Add-Member -NotePropertyName "fairPriceRange" -NotePropertyValue @() -Force
  $Report | Add-Member -NotePropertyName "valueRating" -NotePropertyValue "Insufficient Evidence" -Force
  if (-not (Clean-Text $Report.recommendation)) {
    $Report | Add-Member -NotePropertyName "recommendation" -NotePropertyValue "Need More Information" -Force
  }
  $Report | Add-Member -NotePropertyName "whatThisMeans" -NotePropertyValue "Fair market value has not been established from the available evidence. Do not treat this as a confirmed value estimate." -Force
  $Report | Add-Member -NotePropertyName "bestNextStep" -NotePropertyValue (Get-BestNextEvidenceStep $Report) -Force
  $Report | Add-Member -NotePropertyName "priceBasis" -NotePropertyValue (Ensure-Prefix $Report.priceBasis "Fair value not established - available evidence is too weak for a defensible dollar range. ") -Force
  $Report | Add-Member -NotePropertyName "referenceRangeBasis" -NotePropertyValue "No numeric preliminary range is shown because there are no visible structured source records supporting one." -Force
  return $Report
}

function Set-ResearchVisibilityFields {
  param(
    $Report,
    $Response = $null,
    [string]$Status,
    [array]$StrongItems = @(),
    [array]$RejectedItems = @(),
    [bool]$SearchCompleted = $false
  )

  $StrongRecords = @(Convert-ToResearchResultRecords -Items $StrongItems -BucketName "strongComparables")
  $RejectedRecords = @(Convert-ToResearchResultRecords -Items $RejectedItems -BucketName "rejectedMatches")
  $ResultsFound = @($StrongRecords + $RejectedRecords)
  $Limitations = @()
  if (-not $SearchCompleted) {
    $Limitations += "Live search was unavailable, so no source records could be retrieved."
  } elseif ($ResultsFound.Count -eq 0) {
    $Limitations += "Live search completed, but no visible structured source-backed result records were returned."
  }
  if ($StrongRecords.Count -eq 0) {
    $Limitations += "No exact or strong comparable records are visible in this report."
  }
  if ($RejectedRecords.Count -gt 0) {
    $Limitations += "Weak and rejected matches are shown for transparency but do not establish fair market value."
  }
  if ($ResultsFound | Where-Object { $_.priceType -eq "Active asking price" }) {
    $Limitations += "Active asking prices are not confirmed sold evidence."
  }
  if ($Limitations.Count -eq 0) {
    $Limitations += "Source-backed results are shown with their evidence role and limitations."
  }

  $Report | Add-Member -NotePropertyName "resultsFound" -NotePropertyValue @($ResultsFound) -Force
  $Report | Add-Member -NotePropertyName "strongComparables" -NotePropertyValue @($StrongRecords) -Force
  $Report | Add-Member -NotePropertyName "partialComparables" -NotePropertyValue @() -Force
  $Report | Add-Member -NotePropertyName "referenceResults" -NotePropertyValue @() -Force
  $Report | Add-Member -NotePropertyName "weakMatches" -NotePropertyValue @() -Force
  $Report | Add-Member -NotePropertyName "rejectedMatches" -NotePropertyValue @($RejectedRecords) -Force
  $Report | Add-Member -NotePropertyName "searchLimitations" -NotePropertyValue @($Limitations) -Force
  $Report | Add-Member -NotePropertyName "visibleResearchResultCount" -NotePropertyValue $ResultsFound.Count -Force
  if (-not (Clean-Text $Report.referenceRangeBasis)) {
    $Basis = "No visible structured source records were returned, so a preliminary reference range is not supported."
    if ($StrongRecords.Count -gt 0) {
      $Basis = "$($StrongRecords.Count) visible source-backed result$(if ($StrongRecords.Count -eq 1) { '' } else { 's' }) can support valuation only if identity, condition, and price type match."
    }
    $Report | Add-Member -NotePropertyName "referenceRangeBasis" -NotePropertyValue $Basis -Force
  }

  $Report | Add-Member -NotePropertyName "searchDiagnostics" -NotePropertyValue (New-SearchDiagnostics -Report $Report -Response $Response -Status $Status -StrongItems $StrongItems -RejectedItems $RejectedItems -SearchCompleted $SearchCompleted) -Force

  return $Report
}

function New-SearchDiagnostics {
  param(
    $Report,
    $Response = $null,
    [string]$Status = "",
    [array]$StrongItems = @(),
    [array]$RejectedItems = @(),
    [bool]$SearchCompleted = $false
  )

  $SearchCalls = @(Get-WebSearchCalls $Response)
  $Citations = @(Get-UrlCitations $Response)
  $Queries = @(Get-SearchQueriesUsed $Response | Where-Object { $_ -and $_ -ne "These are the queries the system used." })
  $StrongRecords = @(Normalize-ReportArray $Report.strongComparables)
  $PartialRecords = @(Normalize-ReportArray $Report.partialComparables)
  $ReferenceRecords = @(Normalize-ReportArray $Report.referenceResults)
  $WeakRecords = @(Normalize-ReportArray $Report.weakMatches)
  $RejectedRecords = @(Normalize-ReportArray $Report.rejectedMatches)
  $VisibleRecords = @(Normalize-ReportArray $Report.resultsFound)
  $RawSummaries = @(Get-SafeRawResultSummaries -Items @($StrongItems + $RejectedItems) -Citations $Citations -Queries $Queries)
  $ParsedCount = @(($StrongItems + $RejectedItems) | Where-Object { Clean-Text $_ }).Count
  $NormalizedCount = $VisibleRecords.Count
  $RetainedCount = Get-ReferenceSupportingResearchResultCount $Report
  $RejectedCount = $RejectedRecords.Count
  $DroppedReasons = @(Get-DroppedResultReasons -Report $Report -SearchCompleted $SearchCompleted)
  $SerperConfigured = [bool](Clean-Text $env:SERPER_API_KEY)
  $PrimaryProviderState = $(if ($SerperConfigured) { "fallback_openai_used" } else { "serper_not_configured" })

  return [pscustomobject]@{
    queriesGenerated = @($Queries)
    queriesPrioritized = @(Get-QueryPriorityRecords -Queries $Queries -SourcesRequested (Get-SearchCoverage $Report $Status))
    queriesActuallySent = @($Queries)
    queryTransmissionMode = $(if ($Queries.Count -gt 0) { "provider_action_queries_exposed" } else { "single_model_web_search_request_no_safe_query_records" })
    executionLimitation = $(if ($Queries.Count -gt 0) { "The local Windows server uses one OpenAI web_search-enabled request and records safe provider-exposed action queries when available. It cannot guarantee one downstream marketplace request per generated query." } else { "The local Windows server uses one OpenAI web_search-enabled request, but the provider did not expose a safe individual query string. The app therefore does not claim any individual query was sent." })
    queryCount = $Queries.Count
    sourceCategoriesTargeted = @(Get-SearchCoverage $Report $Status)
    allowedDomainsRequested = @()
    searchProviderUsed = "OpenAI web_search"
    providerKey = "openai_web_search"
    serperConfigured = $SerperConfigured
    serperCallsAttempted = 0
    serperCallsSucceeded = 0
    fallbackProviderUsed = $SerperConfigured
    primarySearchProvider = $(if ($SerperConfigured) { "serper_google" } else { "OpenAI web_search" })
    primaryProviderFailureState = $PrimaryProviderState
    fallbackProvider = "OpenAI web_search"
    sourcesRequested = @(Get-SearchCoverage $Report $Status)
    sourcesActuallyQueried = $(if ($SearchCompleted) { @("OpenAI web_search") } else { @() })
    sourceRoute = @("OpenAI web_search")
    providerCallsAttempted = $(if ($SearchCompleted -or $SearchCalls.Count -gt 0) { [math]::Max(1, $SearchCalls.Count) } else { 1 })
    providerCallsSucceeded = $SearchCalls.Count
    providerSourceCount = $Citations.Count
    organicResultCount = 0
    shoppingResultCount = 0
    domainsActuallyReturned = @(Summarize-SourceLabels $Citations | Select-Object -First 8)
    sourceURLsReturned = @($Citations | Select-Object -First 50)
    providerErrors = @()
    providerRequestRecords = @(Get-QueryResultsSummary -Queries $Queries -SearchCompleted $SearchCompleted -RawSummaries $RawSummaries -RetainedCount $RetainedCount -FailureStage (Get-SearchAcquisitionFailureStage -ProviderCallsSucceeded $SearchCalls.Count -RawResultCount $RawSummaries.Count -ParsedResultCount $ParsedCount -NormalizedResultCount $NormalizedCount -RetainedVisibleResultCount $RetainedCount -RejectedResultCount $RejectedCount))
    providerResponseSummaries = @(Get-ProviderResponseSummaries -Queries $Queries -SearchCompleted $SearchCompleted -Citations $Citations -SearchCalls $SearchCalls)
    rawResultCount = $RawSummaries.Count
    parsedCandidateCount = $ParsedCount
    normalizedCandidateCount = $NormalizedCount
    deduplicatedCandidateCount = $NormalizedCount
    rejectedCandidateCount = $RejectedCount
    parsedResultCount = $ParsedCount
    normalizedResultCount = $NormalizedCount
    deduplicatedResultCount = $NormalizedCount
    exactMatchCountBeforeFiltering = @(($StrongRecords + $VisibleRecords) | Where-Object { $_ -match "exact|likely exact" }).Count
    strongMatchCountBeforeFiltering = @(($StrongRecords + $VisibleRecords) | Where-Object { $_ -match "strong" }).Count
    partialMatchCountBeforeFiltering = $PartialRecords.Count
    referenceResultCountBeforeFiltering = $ReferenceRecords.Count
    weakMatchCountBeforeFiltering = $WeakRecords.Count
    rejectedResultCount = $RejectedCount
    retainedVisibleResultCount = $RetainedCount
    droppedResultReasons = @($DroppedReasons)
    queryResultsSummary = @(Get-QueryResultsSummary -Queries $Queries -SearchCompleted $SearchCompleted -RawSummaries $RawSummaries -RetainedCount $RetainedCount -FailureStage (Get-SearchAcquisitionFailureStage -ProviderCallsSucceeded $SearchCalls.Count -RawResultCount $RawSummaries.Count -ParsedResultCount $ParsedCount -NormalizedResultCount $NormalizedCount -RetainedVisibleResultCount $RetainedCount -RejectedResultCount $RejectedCount))
    acquisitionFailureStage = Get-SearchAcquisitionFailureStage -ProviderCallsSucceeded $SearchCalls.Count -RawResultCount $RawSummaries.Count -ParsedResultCount $ParsedCount -NormalizedResultCount $NormalizedCount -RetainedVisibleResultCount $RetainedCount -RejectedResultCount $RejectedCount
    safeRawResults = @($RawSummaries | Select-Object -First 16)
    liveSearchStatus = $Status
  }
}

function Get-SearchAcquisitionFailureStage {
  param(
    [int]$ProviderCallsSucceeded = 0,
    [int]$RawResultCount = 0,
    [int]$ParsedResultCount = 0,
    [int]$NormalizedResultCount = 0,
    [int]$RetainedVisibleResultCount = 0,
    [int]$RejectedResultCount = 0
  )

  if ($RetainedVisibleResultCount -gt 0) { return "none" }
  if ($ProviderCallsSucceeded -le 0) { return "query_transmission_failure" }
  if ($RawResultCount -eq 0) { return "provider_zero_results" }
  if ($ParsedResultCount -eq 0) { return "raw_parse_failure" }
  if ($NormalizedResultCount -eq 0) { return "normalization_failure" }
  if ($RejectedResultCount -gt 0 -or $NormalizedResultCount -gt 0) { return "filtering_failure" }
  return "unknown"
}

function Get-QueryResultsSummary {
  param(
    [array]$Queries = @(),
    [bool]$SearchCompleted = $false,
    [array]$RawSummaries = @(),
    [int]$RetainedCount = 0,
    [string]$FailureStage = "unknown"
  )

  return @(
    foreach ($Query in ($Queries | Select-Object -First 20)) {
      $MatchingRaw = @($RawSummaries | Where-Object { (Clean-Text $_.query).ToLowerInvariant() -eq (Clean-Text $Query).ToLowerInvariant() })
      $MatchingSources = @($MatchingRaw | ForEach-Object { if ($_.url) { $_.url } elseif ($_.source) { $_.source } })
      [pscustomobject]@{
        query = $Query
        source = "OpenAI web_search"
        provider = "OpenAI web_search"
        searchPass = "local_single_request"
        allowedDomainsRequested = @()
        requestAttempted = $true
        requestSucceeded = $SearchCompleted
        providerSourceCount = $MatchingRaw.Count
        domainsReturned = @(Summarize-SourceLabels $MatchingSources | Select-Object -First 8)
        rawResultCount = $MatchingRaw.Count
        parsedResultCount = $MatchingRaw.Count
        normalizedResultCount = $MatchingRaw.Count
        retainedResultCount = $(if ($RetainedCount -gt 0) { $RetainedCount } else { 0 })
        controlledError = $(if ($SearchCompleted) { "" } else { "Live search did not expose a completed web_search_call." })
        primaryRejectionStageOrReason = $(if ($RetainedCount -gt 0) { "none" } else { $FailureStage })
      }
    }
  )
}

function Get-QueryPriorityRecords {
  param(
    [array]$Queries = @(),
    [array]$SourcesRequested = @()
  )

  $Priority = 1
  return @(
    foreach ($Query in ($Queries | Select-Object -First 20)) {
      [pscustomobject]@{
        query = $Query
        priority = $Priority
        searchPass = "local_single_request"
        sourceRoute = @($SourcesRequested | Select-Object -First 8)
        allowedDomainsRequested = @()
      }
      $Priority += 1
    }
  )
}

function Get-ProviderResponseSummaries {
  param(
    [array]$Queries = @(),
    [bool]$SearchCompleted = $false,
    [array]$Citations = @(),
    [array]$SearchCalls = @()
  )

  return @(
    foreach ($Query in ($Queries | Select-Object -First 20)) {
      [pscustomobject]@{
        query = $Query
        searchPass = "local_single_request"
        provider = "OpenAI web_search"
        allowedDomainsRequested = @()
        webSearchCallAppeared = $SearchCompleted
        urlCitationCount = $Citations.Count
        providerSourceCount = $Citations.Count
        sourceURLsReturned = @($Citations | Select-Object -First 12)
        domainsReturned = @(Summarize-SourceLabels $Citations | Select-Object -First 8)
        providerActionQueries = @($Queries | Select-Object -First 4)
        webSearchCallCount = $SearchCalls.Count
      }
    }
  )
}

function Summarize-SourceLabels {
  param([array]$Sources = @())

  $Labels = @()
  foreach ($Source in $Sources) {
    $Text = Clean-Text $Source
    if (-not $Text) {
      continue
    }

    try {
      if ($Text -match "^https?://") {
        $Uri = [Uri]$Text
        $Text = $Uri.Host -replace "^www\.", ""
      }
    } catch {
      $Text = Clean-Text $Source
    }

    if ($Text -and -not ($Labels -contains $Text)) {
      $Labels += $Text
    }
  }

  return @($Labels | Select-Object -First 8)
}

function Get-DroppedResultReasons {
  param(
    $Report,
    [bool]$SearchCompleted = $false
  )

  $Reasons = @()
  foreach ($Item in @(Normalize-ReportArray $Report.rejectedMatches)) {
    if ($Item -match "duplicate") { $Reasons += "duplicate" }
    elseif ($Item -match "missing title") { $Reasons += "missing title" }
    elseif ($Item -match "missing URL|no usable URL|without URL") { $Reasons += "missing URL" }
    elseif ($Item -match "item type|mismatch") { $Reasons += "item-type mismatch" }
    elseif ($Item -match "brand") { $Reasons += "brand mismatch" }
    elseif ($Item -match "team|organization") { $Reasons += "organization or team mismatch" }
    elseif ($Item -match "condition") { $Reasons += "weak visual/text alignment" }
    else { $Reasons += "unknown reason" }
  }
  if (-not $SearchCompleted) {
    $Reasons += "live search unavailable"
  }

  return @(
    $Reasons |
      Where-Object { $_ } |
      Group-Object |
      Sort-Object Count -Descending |
      Select-Object -First 12 |
      ForEach-Object { [pscustomobject]@{ reason = $_.Name; count = $_.Count } }
  )
}

function Get-SafeRawResultSummaries {
  param(
    [array]$Items = @(),
    [array]$Citations = @(),
    [array]$Queries = @()
  )

  $FallbackQuery = $(if ($Queries.Count) { $Queries[0] } else { "" })
  $Summaries = @()
  foreach ($Item in ($Items | Select-Object -First 16)) {
    $Record = Convert-ToResearchResultRecord -Text (Clean-Text $Item) -BucketName "rawResult"
    if (-not $Record.rawText) {
      continue
    }
    $Summaries += [pscustomobject]@{
      title = $Record.title
      url = $Record.url
      source = $Record.source
      displayedPriceText = $Record.displayedPrice
      snippet = (($Record.rawText -replace "https?://[^\s),;]+", "") -replace "\s+", " ").Trim()
      query = $FallbackQuery
    }
  }

  foreach ($Url in ($Citations | Select-Object -First 12)) {
    $Source = "URL citation"
    try {
      $Source = ([uri]$Url).Host -replace "^www\.", ""
    } catch {}
    $Summaries += [pscustomobject]@{
      title = $Url
      url = $Url
      source = $Source
      displayedPriceText = ""
      snippet = "URL citation returned by provider."
      query = $FallbackQuery
    }
  }

  return @($Summaries | Select-Object -First 24)
}

function Convert-ToResearchResultRecords {
  param(
    [array]$Items,
    [string]$BucketName
  )

  return @(
    $Items |
      ForEach-Object { Convert-ToResearchResultRecord -Text $_ -BucketName $BucketName } |
      Where-Object { $_.rawText -or $_.title -or $_.url }
  )
}

function Convert-ToResearchResultRecord {
  param(
    [string]$Text,
    [string]$BucketName
  )

  $Raw = Clean-Text $Text
  $Url = ""
  $UrlMatch = [regex]::Match($Raw, "https?://[^\s),;]+")
  if ($UrlMatch.Success) {
    $Url = $UrlMatch.Value.TrimEnd(".", ")", "]")
  }
  $Source = "Source not supplied"
  if ($Url) {
    try {
      $Source = ([uri]$Url).Host -replace "^www\.", ""
    } catch {
      $Source = "Source URL supplied"
    }
  }
  $Price = ""
  $PriceMatch = [regex]::Match($Raw, "\$\s*\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?")
  if ($PriceMatch.Success) {
    $Price = Normalize-MoneyLabelText $PriceMatch.Value
  }
  $Classification = "Rejected Match"
  if ($BucketName -eq "strongComparables" -or $Raw -match "\bexact match\b|\blikely exact\b|\bstrong similar\b") {
    $Classification = "Exact / Strong Comparable"
  } elseif ($BucketName -eq "partialComparables" -or $Raw -match "\bpartial\b") {
    $Classification = "Partial Comparable"
  } elseif ($BucketName -eq "referenceResults" -or $Raw -match "\breference|identity\b") {
    $Classification = "Reference Result"
  } elseif ($BucketName -eq "weakMatches" -or $Raw -match "\bweak\b") {
    $Classification = "Weak Match"
  }
  $PriceType = "Price type not confirmed"
  if ($Raw -match "sold|completed sale|sale price|sold price" -and $Raw -notmatch "not sold|no sold") {
    $PriceType = "Confirmed sold price"
  } elseif ($Raw -match "active|asking|listed|listing price|current listing|for sale") {
    $PriceType = "Active asking price"
  }
  $RejectionReason = ""
  if ($BucketName -eq "rejectedMatches" -or $Classification -eq "Rejected Match") {
    $RejectionReason = "Not reliable enough for valuation. The item, condition, price type, or source details did not qualify as a strong comparable."
  }

  return [pscustomobject]@{
    title = (($Raw -replace "https?://[^\s),;]+", "") -replace "\s+", " ").Trim()
    source = $Source
    url = $Url
    displayedPrice = $Price
    currency = $(if ($Price) { "$" } else { "" })
    priceType = $PriceType
    priceTypeLabel = $(if ($PriceType -match "Confirmed sold") { "Verified Sold" } elseif ($PriceType -match "Active asking") { "Active Asking" } else { "Unknown Price Type" })
    condition = ""
    classification = $Classification
    evidenceRole = $(if ($Classification -match "Strong") { "Can support a value estimate if identity, condition, and price type match." } else { "Rejected or weak context; should not drive price." })
    matchExplanation = $Raw
    itemIdentityDifferences = ""
    influencedVerifiedMarketRange = $(if ($Classification -match "Strong" -and $PriceType -match "Confirmed sold") { "Yes - verified sold evidence from a compatible exact or strong match." } else { "No - visible price is not verified sold evidence." })
    includedInPreliminaryAskingPriceRange = $(if ($Classification -match "Strong|Partial|Reference" -and $Price) { "Yes - compatible visible price evidence included in the preliminary asking-price range." } else { "No - no usable visible price was supplied." })
    influencedReferenceRange = $(if ($Classification -match "Strong|Partial|Reference" -and $Price) { "Influenced verified market range: No. Included in preliminary asking-price range: Yes." } else { "No - no usable visible price was supplied." })
    rejectionReason = $RejectionReason
    sourceBacked = $(if ($Url) { "URL provided by result text" } else { "No usable URL supplied by source." })
    rawText = $Raw
  }
}

function Get-VisibleResearchResultCount {
  param($Report)

  return @(
    @(Normalize-ReportArray $Report.resultsFound)
    @(Normalize-ReportArray $Report.strongComparables)
    @(Normalize-ReportArray $Report.partialComparables)
    @(Normalize-ReportArray $Report.referenceResults)
    @(Normalize-ReportArray $Report.weakMatches)
    @(Normalize-ReportArray $Report.rejectedMatches)
  ).Count
}

function Get-ReferenceSupportingResearchResultCount {
  param($Report)

  $Items = @()
  foreach ($Value in @($Report.strongComparables, $Report.partialComparables, $Report.referenceResults)) {
    if ($null -eq $Value) { continue }
    if ($Value -is [array]) {
      $Items += $Value
    } else {
      $Items += $Value
    }
  }

  return @($Items | Where-Object { Test-UsableSourceRecord $_ }).Count
}

function Test-UsableSourceRecord {
  param($Item)

  if ($null -eq $Item) {
    return $false
  }
  if ($Item -is [string]) {
    return ($Item -match "https?://" -or $Item -match "\b(source|platform|site|marketplace)\s*[:=-]")
  }
  $Url = Clean-Text $Item.url
  $Source = Clean-Text $Item.source
  return ($Url -or ($Source -and $Source -notmatch "not supplied"))
}

function Get-ValuationEvidenceRange {
  param($Report)

  $Text = Join-ValuationText @(
    $Report.preliminaryReferenceRange,
    $Report.estimatedFairMarketValue,
    $Report.fairPriceRange,
    $Report.aiOnlyRoughValueRange,
    $Report.estimatedMarketValue,
    $Report.expectedSalePrice,
    $Report.suggestedListingPrice
  )
  $Range = Get-MoneyRange $Text
  if ($Range -and $Range.Count -ge 2) {
    return Format-MoneyRange $Range[0] $Range[1]
  }

  $LooseAmounts = @(Get-LooseMoneyAmounts $Text | Sort-Object)
  if ($LooseAmounts.Count -ge 2) {
    return Format-MoneyRange $LooseAmounts[0] $LooseAmounts[$LooseAmounts.Count - 1]
  }
  if ($LooseAmounts.Count -eq 1) {
    return Format-MoneyRange ([double]$LooseAmounts[0] * 0.8) ([double]$LooseAmounts[0] * 1.2)
  }

  return ""
}

function Get-LooseMoneyAmounts {
  param([string]$Text)

  $Amounts = @()
  foreach ($Pattern in @(
    '\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)',
    '\b(?:about|around|approx(?:imately)?|range|from|between|value|price|worth|listing|asking|listed)\D{0,24}(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:-|to|and)\s*\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)',
    '\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:-|to)\s*\$?\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b'
  )) {
    foreach ($Match in [regex]::Matches($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
      for ($Index = 1; $Index -lt $Match.Groups.Count; $Index += 1) {
        $Raw = $Match.Groups[$Index].Value
        if (-not $Raw) { continue }
        $Amount = 0.0
        if ([double]::TryParse($Raw.Replace(",", ""), [ref]$Amount) -and $Amount -gt 0 -and $Amount -lt 100000) {
          $Amounts += $Amount
        }
      }
    }
  }

  return @($Amounts | Select-Object -Unique)
}

function Get-PreliminaryReferenceRangeText {
  param(
    $Classification,
    [bool]$SearchCompleted = $false,
    [int]$VisibleResultCount = 0
  )

  $Evidence = "based on item evidence and AI market reasoning because live source-backed comps were unavailable"
  if ($SearchCompleted) {
    $Evidence = "based on $VisibleResultCount visible similar active listing or partial/reference result$(if ($VisibleResultCount -eq 1) { '' } else { 's' }) found during the current search"
  }
  return "$($Classification.range) $Evidence; no confirmed sales or strong comparable matches were found. This is not a verified fair-market-value estimate."
}

function Get-WeakEvidenceMeaningText {
  param(
    $Report,
    $Classification
  )

  $AskingAmounts = @(Get-MoneyAmounts ((Clean-Text $Report.askingPrice) + " " + (Clean-Text $Report.currentAskingPrice)))
  $RangeAmounts = @(Get-MoneyAmounts $Classification.range | Sort-Object)
  if ($AskingAmounts.Count -gt 0 -and $RangeAmounts.Count -ge 2 -and [double]$AskingAmounts[0] -lt [double]$RangeAmounts[0]) {
    return "At $(Format-Money $AskingAmounts[0]), the price may be favorable relative to similar active listings, but there is not enough reliable evidence for a confident Buy recommendation."
  }

  return "The price may be directionally useful, but fair market value has not been established because no confirmed sales or strong comparable matches were found."
}

function Get-BestNextEvidenceStep {
  param($Report)

  foreach ($Value in @(
    @(Normalize-ReportArray $Report.whatToVerifyBeforeBuying | Select-Object -First 1),
    @(Normalize-ReportArray $Report.additionalInformationNeeded | Select-Object -First 1),
    @(Normalize-ReportArray $Report.missingDetails | Select-Object -First 1)
  )) {
    $Text = Clean-Text $Value
    if ($Text) { return $Text }
  }

  return "Add one clear close-up of the strongest label, model number, SKU, UPC/barcode, maker mark, measurement, or condition issue."
}

function Get-CautiousCurrentPriceAssessment {
  param(
    [string]$Value,
    $Report,
    $Classification
  )

  $Text = Clean-Text $Value
  $Meaning = Get-WeakEvidenceMeaningText -Report $Report -Classification $Classification
  if (-not $Text -or $Text -match "excellent value|good value|below market|fair market value") {
    return "Unknown - $Meaning"
  }
  return Ensure-Prefix $Text "Low-confidence assessment - "
}

function Normalize-MoneyLabelText {
  param([string]$Value)

  $Text = Clean-Text $Value
  if (-not $Text) {
    return ""
  }

  $Text = [regex]::Replace($Text, '\$?\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s+(?:to|through)\s+\$?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b', {
    param($Match)
    return "$(Format-Money ([double]$Match.Groups[1].Value.Replace(',', '')))-$(Format-Money ([double]$Match.Groups[2].Value.Replace(',', '')))"
  }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
  $Text = [regex]::Replace($Text, '\$?\b(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\s*-\s*\$?(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)\b', {
    param($Match)
    return "$(Format-Money ([double]$Match.Groups[1].Value.Replace(',', '')))-$(Format-Money ([double]$Match.Groups[2].Value.Replace(',', '')))"
  }, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)

  return $Text
}

function Format-MoneyInputText {
  param([string]$Value)

  $Text = Clean-Text $Value
  if (-not $Text) {
    return ""
  }
  if ($Text.StartsWith('$')) {
    return Normalize-MoneyLabelText $Text
  }
  if ($Text -match '^(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)$') {
    return Format-Money ([double]$Matches[1].Replace(",", ""))
  }
  return Normalize-MoneyLabelText $Text
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
      $Query = Clean-Text $Call.action.query
      if ($Query -and -not (Test-InternalPromptFragment $Query)) {
        $Queries += $Query
      }
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
    store_name = ""
    location_zip = ""
    location_mode = ""
    location_state = ""
    location_permission = ""
    location_area = ""
    retailer_or_marketplace_name = ""
    known_shipping_amount = ""
    identity_confirmation = ""
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
    "store_name",
    "location_zip",
    "location_mode",
    "location_state",
    "location_permission",
    "location_area",
    "retailer_or_marketplace_name",
    "known_shipping_amount",
    "identity_confirmation",
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
  $Intake.known_upc_digits = ((Clean-Text $Intake.known_upc) -replace "\D", "")
  if ($Intake.known_upc_digits.Length -lt 8 -or $Intake.known_upc_digits.Length -gt 14) {
    $Intake.known_upc_digits = ""
  }
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
    "store_name: $(Get-BuyerIntakeValue $BuyerIntake 'store_name')",
    "location_zip: $(Get-BuyerIntakeValue $BuyerIntake 'location_zip')",
    "location_mode: $(Get-BuyerIntakeValue $BuyerIntake 'location_mode')",
    "location_state: $(Get-BuyerIntakeValue $BuyerIntake 'location_state')",
    "location_permission: $(Get-BuyerIntakeValue $BuyerIntake 'location_permission')",
    "location_area: $(Get-BuyerIntakeValue $BuyerIntake 'location_area')",
    "retailer_or_marketplace_name: $(Get-BuyerIntakeValue $BuyerIntake 'retailer_or_marketplace_name')",
    "known_shipping_amount: $(Get-BuyerIntakeValue $BuyerIntake 'known_shipping_amount')",
    "item_condition: $(Get-BuyerIntakeValue $BuyerIntake 'item_condition')",
    "condition_concerns: $Concerns",
    "item_name: $(Get-BuyerIntakeValue $BuyerIntake 'item_name')",
    "known_brand: $(Get-BuyerIntakeValue $BuyerIntake 'known_brand')",
    "known_manufacturer: $(Get-BuyerIntakeValue $BuyerIntake 'known_manufacturer')",
    "known_model: $(Get-BuyerIntakeValue $BuyerIntake 'known_model')",
    "known_sku: $(Get-BuyerIntakeValue $BuyerIntake 'known_sku')",
    "known_upc: $(Get-BuyerIntakeValue $BuyerIntake 'known_upc')",
    "known_upc_digits: $(Get-BuyerIntakeValue $BuyerIntake 'known_upc_digits')",
    "identity_confirmation: $(Get-BuyerIntakeValue $BuyerIntake 'identity_confirmation')",
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

  $EvidenceScore = $(if ($ReliableCompsFound) { 22 } elseif ($SearchCompleted) { 58 } else { 64 })
  $ExposureScore = 32
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
    $EvidenceScore -= 8
  } else {
    if ($SearchCompleted) {
      Add-UniqueText $Factors "No reliable sold comps"
    } else {
      Add-UniqueText $Factors "AI-only valuation"
    }
    Add-UniqueText $Actions "Confirm recent sold prices for the exact item or a strong similar match."
  }

  if (-not $ReliableCompsFound -and $RiskText -match "ai-only|no reliable|source-backed comps are not available|low confidence") {
    $EvidenceScore += 8
  }

  $IdentityRisk = Get-IdentityRisk $Report
  $EvidenceScore += $IdentityRisk.scoreAdjustment
  foreach ($Factor in $IdentityRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $IdentityRisk.actions) { Add-UniqueText $Actions $Action }

  $ConditionRisk = Get-ConditionRisk -BuyerIntake $BuyerIntake -Report $Report
  $ExposureScore += $ConditionRisk.scoreAdjustment
  foreach ($Factor in $ConditionRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $ConditionRisk.actions) { Add-UniqueText $Actions $Action }

  $PriceRisk = Get-PriceExposureRisk -Report $Report -BuyerIntake $BuyerIntake -ReliableCompsFound $ReliableCompsFound -ResaleGuidance $ResaleGuidance
  $ExposureScore += $PriceRisk.scoreAdjustment
  foreach ($Factor in $PriceRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $PriceRisk.actions) { Add-UniqueText $Actions $Action }

  $LiquidityRisk = Get-LiquidityRisk -Report $Report -ResaleGuidance $ResaleGuidance
  $ExposureScore += $LiquidityRisk.scoreAdjustment
  foreach ($Factor in $LiquidityRisk.factors) { Add-UniqueText $Factors $Factor }
  foreach ($Action in $LiquidityRisk.actions) { Add-UniqueText $Actions $Action }

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    $ExposureScore += 6
  } elseif ((Get-BuyerIntakeValue $BuyerIntake "purchase_intent") -match "personal_use") {
    $ExposureScore -= 4
    if (-not $ReliableCompsFound) {
      Add-UniqueText $Factors "Overpayment risk still exists for personal use"
      Add-UniqueText $Actions "Buy only if personal value justifies the price despite weak market evidence."
    }
  }

  if (-not $ReliableCompsFound -and (Test-DirectBuyDecision $PurchaserDecision) -and -not $PriceRisk.limitedDownside) {
    $EvidenceScore += 10
    Add-UniqueText $Factors "Recommendation would be aggressive without reliable comps"
  }

  $BoundedEvidenceScore = [int](Limit-Number ([Math]::Round($EvidenceScore)) 0 100)
  $BoundedExposureScore = [int](Limit-Number ([Math]::Round($ExposureScore)) 0 100)
  $NormalizedScore = [int](Limit-Number ([Math]::Round(($BoundedEvidenceScore * 0.45) + ($BoundedExposureScore * 0.55))) 0 100)
  if ($null -ne $PriceRisk.minimumFinalScore) {
    $NormalizedScore = [Math]::Max($NormalizedScore, [int]$PriceRisk.minimumFinalScore)
  }
  if ($PriceRisk.limitedDownside -and -not $PriceRisk.hasHardDownside -and -not $PriceRisk.hasHighAddedCost) {
    $NormalizedScore = [Math]::Min($NormalizedScore, $(if ($ReliableCompsFound) { 39 } else { 49 }))
  }
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
    evidenceScore = $BoundedEvidenceScore
    exposureScore = $BoundedExposureScore
    limitedDownside = [bool]$PriceRisk.limitedDownside
    hardDownside = [bool]($PriceRisk.hasHardDownside -or $PriceRisk.hasHighAddedCost)
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
  $LimitedDownside = $false
  $HasHardDownside = $false
  $HasHighAddedCost = $false
  $MinimumFinalScore = $null
  $AskingPrice = $null
  if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
    $AskingPrice = [double]$BuyerIntake["parsed_asking_price"]
  }
  $ExposureProfile = Get-DownsideExposureProfile -Report $Report -BuyerIntake $BuyerIntake -ResaleGuidance $ResaleGuidance

  if ($null -eq $AskingPrice) {
    return [pscustomobject]@{
      scoreAdjustment = 28
      factors = @("Missing asking price")
      actions = @("Enter the current asking price before making a buy decision.")
      limitedDownside = $false
      hasHardDownside = $false
      hasHighAddedCost = $false
      minimumFinalScore = $null
    }
  }

  if ($ExposureProfile.hardFactors.Count -gt 0) {
    $HasHardDownside = $true
    $ScoreAdjustment += 34
    $MinimumFinalScore = 75
    foreach ($Factor in $ExposureProfile.hardFactors) {
      if ($Factors -notcontains $Factor) { $Factors += $Factor }
    }
    $Actions += "Do not let a low sticker price override safety, fraud, authenticity, repair, contamination, or disposal risk."
  }

  if ($ExposureProfile.hasHighAddedCost) {
    $HasHighAddedCost = $true
    $ScoreAdjustment += [Math]::Min(34, 16 + [Math]::Ceiling($ExposureProfile.highestAddedCost / [Math]::Max($AskingPrice, 1)))
    $MinimumFinalScore = [Math]::Max($(if ($null -ne $MinimumFinalScore) { $MinimumFinalScore } else { 0 }), 68)
    $FormattedAddedCost = Format-Money $ExposureProfile.highestAddedCost
    $Factors += "Added cost exposure around $FormattedAddedCost"
    $Actions += "Include transport, freight, repair, storage, shipping, and disposal costs before treating the price as low-risk."
  }

  $LowPriceCanReduceRisk = -not $HasHardDownside -and -not $HasHighAddedCost

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    if (-not $ReliableCompsFound) {
      $Ceiling = $ResaleGuidance.speculativeBuyCeiling
      if ($AskingPrice -le 0) {
        $LimitedDownside = $true
        if ($LowPriceCanReduceRisk) {
          $ScoreAdjustment -= 18
          $Factors += "Free item limits cash exposure"
          $Actions += "Only proceed if transport, storage, repair, safety, and disposal add no meaningful burden."
        } else {
          $Factors += "Free price does not erase added downside"
        }
      } elseif ($AskingPrice -le 10) {
        $LimitedDownside = $true
        if ($LowPriceCanReduceRisk) {
          $ScoreAdjustment -= $(if ($AskingPrice -le 1) { 28 } else { 22 })
          $Factors += $(if ($AskingPrice -le 1) { "Token purchase price limits cash exposure" } else { "Very low purchase price limits downside" })
          $Actions += "Treat this only as a low-dollar speculative buy; do not infer proven resale value from the low price."
        } else {
          $Factors += "Low price does not erase added downside"
        }
      } elseif ($null -ne $Ceiling -and $AskingPrice -le [double]$Ceiling) {
        $LimitedDownside = $AskingPrice -le 25
        if ($LowPriceCanReduceRisk) {
          $ScoreAdjustment -= $(if ($AskingPrice -le 25) { 14 } else { 6 })
          $Factors += $(if ($AskingPrice -le 25) { "Low purchase price limits downside" } else { "Asking price stays below low-confidence ceiling" })
          $Actions += "Keep any offer at or below the low-confidence speculative ceiling."
        } else {
          $Factors += "Speculative ceiling is offset by added downside"
        }
      } elseif ($null -ne $Ceiling) {
        $SpreadPenalty = [Math]::Min(28, 12 + [Math]::Ceiling((($AskingPrice - [double]$Ceiling) / [Math]::Max([double]$Ceiling, 1)) * 12))
        $ScoreAdjustment += [Math]::Max(12, $SpreadPenalty)
        $Factors += "Asking price exceeds low-confidence speculative ceiling"
        $Actions += "Pass unless the seller accepts a substantially lower offer."
      } else {
        if ($LowPriceCanReduceRisk -and $AskingPrice -le 25) {
          $ScoreAdjustment += $(if ($AskingPrice -le 10) { -10 } else { 2 })
          $LimitedDownside = $true
          $Factors += "Low price partly offsets unsupported resale value"
          $Actions += "Buy only as a small speculative gamble with no assumed resale profit."
        } else {
          $ScoreAdjustment += $(if ($AskingPrice -le 50) { 16 } else { 22 })
          $Factors += "No supported speculative buy price"
          $Actions += "Need stronger sold-price evidence before risking resale capital."
        }
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
    limitedDownside = $LimitedDownside
    hasHardDownside = $HasHardDownside
    hasHighAddedCost = $HasHighAddedCost
    minimumFinalScore = $MinimumFinalScore
  }
}

function Get-DownsideExposureProfile {
  param(
    $Report,
    $BuyerIntake,
    $ResaleGuidance
  )

  $Concerns = @()
  if ($BuyerIntake.ContainsKey("condition_concerns") -and $BuyerIntake["condition_concerns"] -is [array]) {
    $Concerns = @($BuyerIntake["condition_concerns"])
  }

  $Haystack = @(
    (Get-BuyerIntakeValue $BuyerIntake "item_condition"),
    (Get-BuyerIntakeValue $BuyerIntake "buyer_notes"),
    ($Concerns -join " "),
    $Report.currentPriceAssessment,
    $Report.resalePotential,
    $Report.missingDetails,
    $Report.conditionAssessment,
    $ResaleGuidance.platformSpecificSellingGuidance
  ) -join " "
  $Haystack = $Haystack.ToLowerInvariant()
  $HardFactors = @()

  if ($Haystack -match "counterfeit|authenticity_concern|authenticity concern|legal exposure|platform exposure") {
    $HardFactors += "Authenticity, legal, or platform exposure"
  }
  if ($Haystack -match "unsafe|electrical hazard|hazardous|hazmat|contaminat|infestation|mold|smoke|odor") {
    $HardFactors += "Safety, contamination, odor, or disposal exposure"
  }
  if ($Haystack -match "scam|fraud|stolen|seller pressure|wire transfer|gift card") {
    $HardFactors += "Fraud or scam indicators"
  }
  if ($Haystack -match "major repair|not_working|not working|missing critical|missing_parts|missing parts|incomplete_set|incomplete set") {
    $HardFactors += "Repair or missing-component exposure"
  }

  $AskingPrice = 0
  if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
    $AskingPrice = [double]$BuyerIntake["parsed_asking_price"]
  }
  $AddedCostText = @((Get-BuyerIntakeValue $BuyerIntake "buyer_notes"), (Get-BuyerIntakeValue $BuyerIntake "item_condition"), ($Concerns -join " ")) -join " "
  $AddedCosts = @(Get-MoneyAmounts $AddedCostText)
  $HighestAddedCost = 0
  $FilteredCosts = @($AddedCosts | Where-Object { $_ -gt [Math]::Max($AskingPrice + 1, 15) } | Sort-Object -Descending)
  if ($FilteredCosts.Count -gt 0) {
    $HighestAddedCost = [double]$FilteredCosts[0]
  }
  $HasCostBurdenText = $AddedCostText.ToLowerInvariant() -match "freight|transport|shipping|delivery|pickup|storage|repair|parts|disposal|dump|hazard|cleaning"
  $HasHighAddedCost = $HasCostBurdenText -and $HighestAddedCost -ge [Math]::Max(25, $AskingPrice * 1.5)

  return [pscustomobject]@{
    hardFactors = @($HardFactors | Select-Object -Unique)
    highestAddedCost = $HighestAddedCost
    hasHighAddedCost = $HasHighAddedCost
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

  if ($BuyerRisk.score -ge 75 -and (Test-BuyOrNegotiateDecision $Text)) {
    if (-not (Test-HasAskingPrice $BuyerIntake)) {
      return "Need More Info - Buyer Risk Score is $($BuyerRisk.score) ($($BuyerRisk.level)) because the purchase decision is incomplete. $Detail"
    }
    return "Pass - Buyer Risk Score is $($BuyerRisk.score) ($($BuyerRisk.level)), so buying at the current price would put too much downside risk on the buyer. $Detail"
  }

  if ($BuyerRisk.score -ge 50 -and (Test-DirectBuyDecision $Text)) {
    return "Need More Info - Buyer Risk Score is $($BuyerRisk.score) ($($BuyerRisk.level)), so a direct Buy recommendation would be too aggressive without reducing risk. $Detail"
  }

  if ($BuyerRisk.score -le 49 -and $BuyerRisk.limitedDownside -and $Text -match "^Pass\b") {
    return "Buy Here - Speculative Buy only at this very low price. Valuation remains uncertain, resale is not guaranteed, and this decision depends on limited dollar exposure; added transport, storage, repair, safety, disposal, or condition costs would change the decision. $Detail"
  }

  return $Text
}

function Test-BuyOrNegotiateDecision {
  param([string]$Value)

  return (Clean-Text $Value) -match "^(Buy Here|Buy\b|Strong Buy|Cautious Buy|Speculative Buy|Buy with Conditions|Negotiate)\b"
}

function Test-DirectBuyDecision {
  param([string]$Value)

  return (Clean-Text $Value) -match "^(Buy Here|Buy\b|Strong Buy|Cautious Buy|Speculative Buy|Buy with Conditions)\b"
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

  return "$Level because $FactorText$PriceText. This blends evidence uncertainty with purchase downside; confidence can remain low even when dollar exposure is limited. Lower is safer; higher is riskier."
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

  $Context = (Get-BuyerIntakeValue $BuyerIntake "purchase_context").ToLowerInvariant()
  if ($Context -eq "retail_store") {
    $AskingPrice = $null
    if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
      $AskingPrice = [double]$BuyerIntake["parsed_asking_price"]
    }
    if ($null -ne $AskingPrice -and $AskingPrice -le 25) {
      return "Need More Info - Price Not Verified - Low Financial Risk. Current retail price was not verified against compatible source-backed retail prices, so this is a conditional low-dollar personal-use decision rather than an unconditional Buy. $(Remove-DecisionLabel $Text)"
    }
    return "Need More Info - Price Not Verified. Current retail price was not verified against compatible source-backed retail prices. Add the UPC/barcode, store name, ZIP code, package size, and count before relying on the decision. $(Remove-DecisionLabel $Text)"
  }

  if (Test-ResaleIntent (Get-BuyerIntakeValue $BuyerIntake "purchase_intent")) {
    $AskingPrice = $null
    if ($BuyerIntake.ContainsKey("parsed_asking_price") -and $null -ne $BuyerIntake["parsed_asking_price"]) {
      $AskingPrice = [double]$BuyerIntake["parsed_asking_price"]
    }
    $Ceiling = $ResaleGuidance.speculativeBuyCeiling
    $ExposureProfile = Get-DownsideExposureProfile -Report ([pscustomobject]@{}) -BuyerIntake $BuyerIntake -ResaleGuidance $ResaleGuidance
    $LowDollarSpeculation = $null -ne $AskingPrice -and $AskingPrice -le 25 -and ($AskingPrice -le 10 -or ($null -ne $Ceiling -and $AskingPrice -le [double]$Ceiling)) -and $ExposureProfile.hardFactors.Count -eq 0 -and -not $ExposureProfile.hasHighAddedCost
    if ($LowDollarSpeculation) {
      return "Buy Here - Speculative Buy only at this very low price. Valuation remains uncertain, resale is not guaranteed, low price limits dollar exposure, and added transport, storage, repair, safety, disposal, or condition costs would change the decision. Do not extrapolate a high resale value from this Buy decision."
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

  return (Clean-Text $Value) -replace "^(Buy Here|Buy|Strong Buy|Cautious Buy|Speculative Buy|Buy with Conditions|Negotiate|Buy Elsewhere|Wait|Pass|Need More Info)\s*[-:]\s*", ""
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

  if ($Haystack -match "institution|organization|college|university|mascot|logo|character|sports logo|school colors|officially licensed|licensee") {
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
    return "Current seller asking price: $(Format-MoneyInputText $AskingPrice)"
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
    return @(($Low * 0.8), ($High * 1.2))
  }

  return @($Low, $High)
}

function Get-MoneyAmounts {
  param([string]$Text)

  $Amounts = @()
  foreach ($Pattern in @(
    "\$\s*(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)",
    "(?:transport|freight|shipping|delivery|pickup|storage|repair|parts|disposal|dump|cleaning)\D{0,24}(\d{1,6}(?:,\d{3})*(?:\.\d{1,2})?)"
  )) {
    foreach ($Match in [regex]::Matches($Text, $Pattern, [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)) {
      $Amount = 0.0
      if ([double]::TryParse($Match.Groups[1].Value.Replace(",", ""), [ref]$Amount) -and $Amount -gt 0 -and $Amount -lt 100000) {
        $Amounts += $Amount
      }
    }
  }

  return @($Amounts | Select-Object -Unique)
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

function New-AnalysisId {
  $Stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
  $Suffix = ([guid]::NewGuid().ToString("N")).Substring(0, 12)
  return "analysis-$Stamp-$Suffix"
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
