param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw

$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

function Require-Order($Name, $Text, $First, $Second) {
  $firstIndex = $Text.IndexOf($First)
  $secondIndex = $Text.IndexOf($Second)
  if ($firstIndex -lt 0 -or $secondIndex -lt 0 -or $firstIndex -ge $secondIndex) {
    $script:failed += $Name
  }
}

function Function-Block($Text, $Start, $End) {
  $pattern = [regex]::Escape($Start) + "[\s\S]*?(?=" + [regex]::Escape($End) + ")"
  $match = [regex]::Match($Text, $pattern)
  if ($match.Success) {
    return $match.Value
  }
  return ""
}

$classifyBlock = Function-Block $api "function classifySerperPriceEvidence" "function buildSerperRejectionReason"
$normalizeBlock = Function-Block $api "function normalizePriceTypeLabel" "function getVisibleItemPriceAmount"
$sortBlock = Function-Block $api "function priceFoundSortRank" "function retailEvidenceTierRank"
$bucketBlock = Function-Block $api "function classifyPriceEvidenceBucket" "function isQualifiedVerifiedSoldPriceEvidence"
$listingStatusBlock = Function-Block $api "function inferPriceFoundListingStatus" "function buildPriceFoundLimitation"
$limitationBlock = Function-Block $api "function buildPriceFoundLimitation" "function buildPriceFoundComparison"
$actionBlock = Function-Block $app "function formatSecondaryMarketPriceType" "function getPriceFoundPurchaseChannel"

Require-Contains "Explicit Buy It Now detector exists" $api "function hasExplicitBuyItNowEvidence"
Require-Contains "Explicit Buy It Now detector is exported to deterministic hooks" $api "hasExplicitBuyItNowEvidence,"
Require-Contains "Negated Buy It Now language is ignored" $api "buy\s*it\s*now\s+(?:unavailable|not\s+shown|not\s+available|not\s+offered)"
Require-Contains "Classifier returns distinct Buy It Now" $classifyBlock 'return "Buy It Now";'
Require-Contains "Normalizer returns distinct Buy It Now" $normalizeBlock 'return "Buy It Now";'
Require-Contains "Buy It Now is current-purchasable when eligible" $api "Active Asking|Buy It Now|Shopping Offer|Current Retail Price"
Require-Contains "Buy It Now sorts with current asking evidence" $sortBlock "Active Asking|Buy It Now|Current Retail Price|Shopping Offer"
Require-Contains "Buy It Now can support asking comparison" $bucketBlock "Active Asking|Buy It Now"
Require-Contains "Buy It Now status remains listing status, not sold" $listingStatusBlock "Buy It Now listing price - current availability not independently confirmed"
Require-Contains "Buy It Now limitation rejects confirmed market value" $limitationBlock "Buy It Now listing price; this is not verified sold evidence or confirmed market value."
Require-Contains "Customer evidence formats Buy It Now label" $actionBlock 'if (/Buy It Now/i.test(type)) return "Buy It Now";'
Require-Contains "Buy It Now action remains listing action" $actionBlock 'if (/Buy It Now/i.test(type))'
Require-Order "Frontend Buy It Now outranks generic active listing label" $actionBlock 'if (/Buy It Now/i.test(type)) return "Buy It Now";' 'if (/Price Unavailable|Active Listing/i.test(type)) return "Active listing";'
Require-Contains "Mock proves Buy It Now end to end" $mock "Explicit Buy It Now must remain Buy It Now through parsing and normalization."
Require-Contains "Mock proves Buy It Now reaches compact list" $mock "Exact Buy It Now listing should reach the primary compact evidence list."
Require-Contains "Mock proves Buy It Now is not verified market" $mock "Buy It Now may support asking-price comparison while staying outside verified-market evidence."
Require-Contains "Mock proves generic active listing stays generic" $mock "Generic active listings without explicit Buy It Now evidence should remain Active Asking."
Require-Contains "Mock proves Buy It Now does not overwrite bid" $mock "Buy It Now wording must not overwrite current bid evidence."
Require-Contains "Mock proves Buy It Now does not overwrite estimate" $mock "Buy It Now wording must not overwrite auction estimate evidence."
Require-Contains "Mock proves Buy It Now does not overwrite sold" $mock "Buy It Now wording must not overwrite verified sold evidence."
Require-Contains "Mock proves Buy It Now does not overwrite unsold" $mock "Buy It Now wording must not overwrite closed-unsold evidence."

Require-Order "Closed unsold outranks Buy It Now in classifier" $classifyBlock 'return "Closed Unsold Listing";' 'return "Buy It Now";'
Require-Order "Current bid outranks Buy It Now in classifier" $classifyBlock 'return "Auction Current Bid";' 'return "Buy It Now";'
Require-Order "Auction estimate outranks Buy It Now in classifier" $classifyBlock 'return "Auction Estimate";' 'return "Buy It Now";'
Require-Order "Buy It Now outranks generic active asking in classifier" $classifyBlock 'return "Buy It Now";' 'return "Active Asking";'
Require-Order "Closed unsold outranks Buy It Now in normalizer" $normalizeBlock 'return "Closed Unsold Listing";' 'return "Buy It Now";'
Require-Order "Verified sold outranks Buy It Now in normalizer" $normalizeBlock 'return hasExplicitSoldTransactionProof(record) ? "Verified Sold" : "Reference Price";' 'return "Buy It Now";'
Require-Order "Buy It Now outranks Active Listing in normalizer" $normalizeBlock 'return "Buy It Now";' 'return "Active Listing";'

if ($failed.Count -gt 0) {
  Write-Error ("Buy It Now price-type static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Buy It Now price-type static checks OK - distinct price type and precedence verified."
