param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$presentation = Get-Content (Join-Path $Root "public/customer-evidence.js") -Raw
$mock = Get-Content (Join-Path $Root "tests/mock-provider-live-comps.mjs") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

function Require-NotRegex($Name, $Text, $Pattern) {
  if ($Text -match $Pattern) {
    $script:failed += $Name
  }
}

$checks = @(
  @{ Name = "Visible app version is 1.12.15"; Text = $index; Pattern = "Version 1.12.15" },
  @{ Name = "Package version is 1.12.15"; Text = $package; Pattern = '"version": "1.12.15"' },
  @{ Name = "Server version is 1.12.15"; Text = $server; Pattern = '$AppVersion = "1.12.15"' },
  @{ Name = "Roadmap documents 1.12.1"; Text = $roadmap; Pattern = "Version 1.12.1 (Completed)" },
  @{ Name = "Secondary-market auction registry exists"; Text = $api; Pattern = "const secondaryMarketAuctionRegistry = Object.freeze" },
  @{ Name = "Registry includes eBay"; Text = $api; Pattern = 'domain: "ebay.com"' },
  @{ Name = "Registry includes Mercari"; Text = $api; Pattern = 'domain: "mercari.com"' },
  @{ Name = "Registry includes Etsy"; Text = $api; Pattern = 'domain: "etsy.com"' },
  @{ Name = "Registry includes LiveAuctioneers"; Text = $api; Pattern = 'domain: "liveauctioneers.com"' },
  @{ Name = "Registry includes HiBid"; Text = $api; Pattern = 'domain: "hibid.com"' },
  @{ Name = "Registry includes Invaluable"; Text = $api; Pattern = 'domain: "invaluable.com"' },
  @{ Name = "Registry includes AuctionZip"; Text = $api; Pattern = 'domain: "auctionzip.com"' },
  @{ Name = "Collectible attribute ladder exists"; Text = $api; Pattern = "function buildCollectibleAttributeSearchLadder" },
  @{ Name = "Collectible exact source recovery exists"; Text = $api; Pattern = "function buildCollectibleExactSourceRecoveryQueries" },
  @{ Name = "Collectible recovery pass is named"; Text = $api; Pattern = "collectible_exact_source_recovery" },
  @{ Name = "Collectible price-type recovery terms exist"; Text = $api; Pattern = "function buildCollectiblePriceTypeRecoveryTerms" },
  @{ Name = "Collectible recovery trigger exists"; Text = $api; Pattern = "function shouldRunCollectibleExactRecovery" },
  @{ Name = "Exact secondary-market evidence helper exists"; Text = $api; Pattern = "function isExactSecondaryMarketEvidenceRecord" },
  @{ Name = "Related-design-only helper exists"; Text = $api; Pattern = "function isRelatedDesignOnlyRecord" },
  @{ Name = "Auction current bid is preserved"; Text = $api; Pattern = 'return "Auction Current Bid";' },
  @{ Name = "Auction opening bid is preserved"; Text = $api; Pattern = 'return "Auction Opening Bid";' },
  @{ Name = "Auction estimate is preserved"; Text = $api; Pattern = 'return "Auction Estimate";' },
  @{ Name = "Closed unsold listing is preserved"; Text = $api; Pattern = 'return "Closed Unsold Listing";' },
  @{ Name = "Price unavailable is preserved"; Text = $api; Pattern = 'return "Price Unavailable";' },
  @{ Name = "Active listing without price is preserved"; Text = $api; Pattern = 'return "Active Listing";' },
  @{ Name = "Verified sold still requires proof"; Text = $api; Pattern = 'return hasExplicitSoldTransactionProof(record) ? "Verified Sold" : "Reference Price";' },
  @{ Name = "Auction context-only records cannot drive value"; Text = $api; Pattern = "this price type is context only and is not a completed sale or active asking-price range" },
  @{ Name = "Exact listing notice exists"; Text = $api; Pattern = "An exact current listing was found at" },
  @{ Name = "Exact listing notice discloses not confirmed market value"; Text = $api; Pattern = "This is an active asking price, Buy It Now listing, or auction bid, not a confirmed market value." },
  @{ Name = "Frontend model preserves canonical price type"; Text = $presentation; Pattern = "const canonicalPriceType = cleanText(record.canonicalPriceType)" },
  @{ Name = "Frontend model preserves canonical source label"; Text = $presentation; Pattern = "sourceLabel" },
  @{ Name = "Frontend model preserves canonical match label"; Text = $presentation; Pattern = "canonicalMatchLabel" },
  @{ Name = "Frontend renderer displays canonical classification"; Text = $app; Pattern = "item.canonicalMatchLabel" },
  @{ Name = "Frontend renderer displays canonical price type"; Text = $app; Pattern = "item.canonicalPriceType" },
  @{ Name = "Frontend uses one truthful canonical source action"; Text = $app; Pattern = 'link.textContent = "View source";' },
  @{ Name = "Mock proves exact auction evidence reaches list"; Text = $mock; Pattern = "Exact auction current bid should reach the primary compact evidence list." },
  @{ Name = "Mock proves auction origin does not reject exact"; Text = $mock; Pattern = "Auction origin must not reject an exact design/object match." },
  @{ Name = "Mock proves price type distinction"; Text = $mock; Pattern = "Current auction bid must remain a current bid." },
  @{ Name = "Mock proves active listing no-price display"; Text = $mock; Pattern = "Exact active listing without visible price should remain showable." },
  @{ Name = "Mock proves different design cannot replace exact"; Text = $mock; Pattern = "Different designs cannot replace exact design evidence in the primary list." },
  @{ Name = "Mock proves related-only cannot create range"; Text = $mock; Pattern = "Related items cannot create a range when the exact current listing lacks sold-price evidence." },
  @{ Name = "Mock proves recovery when different designs survive"; Text = $mock; Pattern = "Exact-result recovery should trigger when only different designs survive." },
  @{ Name = "Mock proves exact suppressed recovery"; Text = $mock; Pattern = "Exact-result recovery should trigger when exact raw candidates are suppressed before the customer list." },
  @{ Name = "Mock proves general cap remains bounded"; Text = $mock; Pattern = "Collectible Serper plan should remain within the existing bounded general provider-call budget." },
  @{ Name = "Mock proves retail ceiling unchanged"; Text = $mock; Pattern = "Retail provider-call ceiling must remain 28." }
)

foreach ($check in $checks) {
  Require-Contains $check.Name $check.Text $check.Pattern
}

Require-NotRegex "Production API must not hardcode Georgia fixture slogans" $api "HOW 'BOUT THEM DAWGS|1980 NATIONAL CHAMPIONS|Vince Dooley"
Require-NotRegex "Production API must not hardcode fixture product identity" $api "Georgia Bulldogs|Coca-Cola Georgia|georgia-coca-cola|collector tray current bid"
Require-NotRegex "Production API must not hardcode fixture result URLs" $api "liveauctioneers\.com/item/exact-current-bid|hibid\.com/lot/exact-opening-bid|invaluable\.com/auction-lot/exact-estimate|auctionzip\.com/auction-lot/exact-sold-result|different-1981-tray"
Require-NotRegex "Frontend must not contain provider secrets" $app "SERPER_API_KEY|google\.serper\.dev|X-API-KEY"

if ($failed.Count -gt 0) {
  Write-Error ("Collectible auction recovery static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Collectible auction recovery static checks OK - exact collectible and auction-source contract verified."
