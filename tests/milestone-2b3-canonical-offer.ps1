$ErrorActionPreference = "Stop"

Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPEN_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SERPER_API_KEY -ErrorAction SilentlyContinue

$root = Split-Path -Parent $PSScriptRoot
$apiPath = Join-Path $root "api\generate-listing.js"
$offerPath = Join-Path $root "lib\evidence\offer.js"
$resultPath = Join-Path $root "lib\evidence\result.js"
$validatorPath = Join-Path $root "lib\evidence\validate.js"
$apiSource = Get-Content -Raw $apiPath
$offerSource = Get-Content -Raw $offerPath
$resultSource = Get-Content -Raw $resultPath
$validatorSource = Get-Content -Raw $validatorPath
$headApiSource = git -C $root show HEAD:api/generate-listing.js
$normalizedApiSource = $apiSource.Replace("`r`n", "`n")
$normalizedHeadApiSource = ($headApiSource -join "`n").Replace("`r`n", "`n")

function Require-Count([string]$label, [string]$source, [string]$pattern, [int]$expected) {
  $count = ([regex]::Matches($source, $pattern)).Count
  if ($count -ne $expected) {
    throw "$label expected $expected occurrence(s), found $count."
  }
}

Require-Count "Canonical buyer-offer authority" $offerSource "export function deriveCanonicalBuyerOfferResult\s*\(" 1
Require-Count "Production finalizer invocation" $apiSource "createFinalEvidenceResult\s*\(" 1
Require-Count "Canonical buyer-offer projection" $apiSource "function applyCanonicalBuyerOfferProjection\s*\(" 1
Require-Count "Canonical decision projection" $apiSource "function applyCanonicalDecisionProjection\s*\(" 1
Require-Count "Canonical buyer and seller response completion" $apiSource "return applyCanonicalDecisionProjection\(" 3

$legacyBuyerAuthorities = @(
  "function buildConsumerOffer\s*\(",
  "function buildConsumerNegotiationGuidance\s*\(",
  "function buildMaximumPriceEvidenceProfile\s*\(",
  "function buildMaximumRecommendedPricePolicy\s*\(",
  "function buildMaximumRecommendedBuyPrice\s*\(",
  "function enforceBuyerNegotiationAskingCeiling\s*\(",
  "function negotiationTextViolatesAskingCeiling\s*\(",
  "function roundOpeningOfferBelowAsking\s*\(",
  "function calculateSpeculativeBuyCeiling\s*\(",
  "function formatSpeculativeOfferRange\s*\("
)
foreach ($pattern in $legacyBuyerAuthorities) {
  if ($apiSource -match $pattern) {
    throw "Superseded buyer-offer authority remains: $pattern"
  }
}

if ($offerSource -match "displayedIds|displayEligibleIds|customerEligibleIds|pricesFound|strongComparables|rawComparables") {
  throw "Canonical buyer-offer logic must not use display-card or raw-provider collections."
}
if ($offerSource -notmatch "finalized\.decisionEligible" -or
    $offerSource -notmatch "rangeResult\.evidenceIds" -or
    $offerSource -notmatch "retailLimitResult\.evidenceIds") {
  throw "Canonical buyer-offer support must derive from final decision-eligible range or retail-limit evidence."
}
if ($resultSource -notmatch "buyerOfferResult[\s\S]*openingOffer[\s\S]*targetPrice[\s\S]*maximumPrice" -or
    $resultSource -notmatch "canonicalBuyerOfferSupportEvidenceIds") {
  throw "FinalEvidenceResult does not expose the canonical buyer-offer contract and diagnostics."
}
if ($validatorSource -notmatch "buyerOfferResult support evidence ID .* is not canonical range or retail-limit support" -or
    $validatorSource -notmatch "buyerOfferResult openingOffer is greater than targetPrice" -or
    $validatorSource -notmatch "retail-comparison-only buyerOfferResult must not contain negotiation figures" -or
    $validatorSource -notmatch "diagnostic canonicalBuyerOfferSupportEvidenceIds do not match") {
  throw "FinalEvidenceResult validator is missing canonical buyer-offer invariants."
}
if ($apiSource -notmatch "buyerOfferResult,\s*recommendedOffer" -or
    $apiSource -notmatch "maximumRecommendedPriceExplanation: maximumPriceNote" -or
    $apiSource -notmatch "buyerOfferSupportRecords: supportRecords") {
  throw "Public buyer-offer aliases must remain translation-only projections of buyerOfferResult."
}
if ($apiSource -match "buyerOfferResult[\s\S]{0,400}(discount|percent|percentage)\s*=") {
  throw "The API translation layer must not calculate a buyer discount."
}
if ($apiSource -notmatch "function buildListingOfferRange\s*\(" -or
    $apiSource -notmatch "function buildResalePricingGuidance\s*\(" -or
    $apiSource -notmatch "function buildFallbackSellPriceGuidance\s*\(") {
  throw "Seller listing-price strategy must remain present and outside Milestone 2B-3."
}
foreach ($sellerFunction in @(
  "buildListingOfferRange",
  "buildResalePricingGuidance",
  "buildFallbackSellPriceGuidance"
)) {
  $pattern = "(?ms)^function\s+$sellerFunction\s*\([\s\S]*?(?=^function\s+|\z)"
  $currentMatch = [regex]::Match($normalizedApiSource, $pattern)
  $headMatch = [regex]::Match($normalizedHeadApiSource, $pattern)
  if (-not $currentMatch.Success -or -not $headMatch.Success -or $currentMatch.Value -cne $headMatch.Value) {
    throw "Seller-only function changed during Milestone 2B-3: $sellerFunction"
  }
}
if ($apiSource -notmatch "function enforceListingResearchHonesty[\s\S]*?workflow:\s*`"seller_listing`"" -or
    $apiSource -notmatch "optimizedListingTitle:\s*title" -or
    $apiSource -notmatch "listingDescription:\s*description") {
  throw "Seller listing output must retain its fields while receiving canonical evidence projection."
}
if ($apiSource -notmatch "maxProviderCalls:\s*28" -or
    $apiSource -notmatch "providerCallBudget =[\s\S]*?: 12;") {
  throw "Provider ceilings must remain retail 28 and collectible 12."
}

$addedProductionLines = git -C $root diff --unified=0 -- api/generate-listing.js lib/evidence |
  Where-Object { $_ -match "^\+(?!\+\+)" }
if (($addedProductionLines -join "`n") -cmatch "Office Works|Kroger|Target 45|Coca-Cola|Georgia Bulldogs|Mercari|041226087161|6110325|30188") {
  throw "Product-, source-, identifier-, or ZIP-specific production logic was added."
}
if (($addedProductionLines -join "`n") -match "NODE_ENV|fixtureMode|mockItem|testOnly") {
  throw "Test-only production condition was added."
}
if ((git -C $root diff --name-only -- server.ps1).Count -ne 0) {
  throw "server.ps1 changed during Milestone 2B-3."
}

node --experimental-test-coverage --test `
  (Join-Path $root "tests\canonical-buyer-offer.test.mjs") `
  (Join-Path $root "tests\canonical-decision-confidence-badge.test.mjs") `
  (Join-Path $root "tests\canonical-range-retail-limit.test.mjs") `
  (Join-Path $root "tests\final-evidence-validation.test.mjs") `
  (Join-Path $root "tests\production-handler-serialization.test.mjs") `
  (Join-Path $root "tests\hard-network-denial.test.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Focused Milestone 2B-3 Node tests failed."
}

Write-Output "Milestone 2B-3 canonical buyer-offer and negotiation tests passed."
Write-Output "One buyer-offer authority and translation-only response projection verified."
Write-Output "Seller listing strategy and server.ps1 remain unchanged; the later canonical customer-evidence cutover remains compatible."
Write-Output "Provider credentials were removed from the test process."
Write-Output "Unexpected network attempts: 0."
