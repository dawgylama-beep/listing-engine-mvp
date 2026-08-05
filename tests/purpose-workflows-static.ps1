param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$api = Get-Content (Join-Path $Root "api/generate-listing.js") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$package = Get-Content (Join-Path $Root "package.json") -Raw
$server = Get-Content (Join-Path $Root "server.ps1") -Raw
$roadmap = Get-Content (Join-Path $Root "PRODUCT_ROADMAP.md") -Raw

$checks = @(
  @{ Name = "Visible app version is 1.12.1"; Text = $index; Pattern = "Version 1.12.1" },
  @{ Name = "Package version is 1.12.2"; Text = $package; Pattern = '"version": "1.12.2"' },
  @{ Name = "Server version is 1.12.2"; Text = $server; Pattern = '$AppVersion = "1.12.2"' },
  @{ Name = "Roadmap documents four-purpose model"; Text = $roadmap; Pattern = "Buying for Myself, Buying to Resell, Value Something I Own, and Sell Something I Own" },
  @{ Name = "Purpose legend is customer-centered"; Text = $index; Pattern = 'What would you like help with?</legend>' },
  @{ Name = "Buying for Myself radio exists"; Text = $index; Pattern = "<strong>Buying for Myself</strong>" },
  @{ Name = "Buying to Resell radio exists"; Text = $index; Pattern = "<strong>Buying to Resell</strong>" },
  @{ Name = "What's It Worth radio exists"; Text = $index; Pattern = "It Worth?</strong>" },
  @{ Name = "Create a Listing radio exists"; Text = $index; Pattern = "<strong>Create a Listing</strong>" },
  @{ Name = "Legacy workflow aliases are preserved"; Text = $app; Pattern = "const legacyWorkflowMap" },
  @{ Name = "Owner workflow sends owner intent"; Text = $app; Pattern = 'purchaseIntent: "owner_value"' },
  @{ Name = "Seller workflow sends seller intent"; Text = $app; Pattern = 'purchaseIntent: "seller_listing"' },
  @{ Name = "Owner workflow hides purchase context"; Text = $app; Pattern = "showPurchaseContext: false" },
  @{ Name = "Owner workflow hides asking price"; Text = $app; Pattern = "showPrice: false" },
  @{ Name = "Owner location field exists"; Text = $index; Pattern = 'id="owner-location-fields"' },
  @{ Name = "Completeness field exists"; Text = $index; Pattern = 'id="item_completeness"' },
  @{ Name = "Seller preferences exist"; Text = $index; Pattern = 'id="seller-preferences-fields"' },
  @{ Name = "Fulfillment preference is captured"; Text = $index; Pattern = 'id="fulfillment_preference"' },
  @{ Name = "Selling speed is captured"; Text = $index; Pattern = 'id="selling_speed"' },
  @{ Name = "Personal-use submit label matches help"; Text = $app; Pattern = 'defaultLabel: "Analyze Purchase"' },
  @{ Name = "Resale submit label matches help"; Text = $app; Pattern = 'defaultLabel: "Analyze Resale"' },
  @{ Name = "Owner submit label matches help"; Text = $app; Pattern = 'defaultLabel: "Estimate Value"' },
  @{ Name = "Seller submit label matches help"; Text = $app; Pattern = 'defaultLabel: "Prepare to Sell"' },
  @{ Name = "Owner report heading is explicit"; Text = $app; Pattern = "Owner Value Assessment" },
  @{ Name = "Seller report heading is explicit"; Text = $app; Pattern = "Seller Pricing and Listing Plan" },
  @{ Name = "Seller workflow leaves platform optional"; Text = $app; Pattern = "platformRequired: false" },
  @{ Name = "Seller workflow leaves notes optional"; Text = $app; Pattern = "notesRequired: false" },
  @{ Name = "Seller intake is sent to API"; Text = $app; Pattern = "requestBody.sellerIntake" },
  @{ Name = "Ask empty prompt is purpose-specific"; Text = $app; Pattern = "function getAskEmptyPrompt" },
  @{ Name = "API accepts seller intake"; Text = $api; Pattern = "normalizeBuyerIntake(body.sellerIntake)" },
  @{ Name = "API owner value branch exists"; Text = $api; Pattern = "function applyOwnerValueReportModel" },
  @{ Name = "API owner intent helper exists"; Text = $api; Pattern = "function isOwnerValueIntent" },
  @{ Name = "API seller listing uses seller intent"; Text = $api; Pattern = 'purchase_intent: "seller_listing"' },
  @{ Name = "API Ask names owner workflow"; Text = $api; Pattern = "Active workflow is Value Something I Own" },
  @{ Name = "API Ask names seller workflow"; Text = $api; Pattern = "Active workflow is Sell Something I Own" }
)

$failed = @()
foreach ($check in $checks) {
  if (-not $check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

$forbidden = @(
  @{ Name = "Seller API must not reject missing platform"; Text = $api; Pattern = 'Choose a marketplace platform.' },
  @{ Name = "Seller API must not reject missing notes"; Text = $api; Pattern = 'Add item notes before generating a listing.' }
)

foreach ($check in $forbidden) {
  if ($check.Text.Contains($check.Pattern)) {
    $failed += $check.Name
  }
}

if ($failed.Count -gt 0) {
  Write-Error ("Purpose workflow static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Purpose workflow static checks OK - $($checks.Count) checks passed."
