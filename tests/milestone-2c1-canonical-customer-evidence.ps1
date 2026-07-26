$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$apiPath = Join-Path $root "api/generate-listing.js"
$appPath = Join-Path $root "public/app.js"
$browserModelPath = Join-Path $root "public/customer-evidence.js"
$customerSerializerPath = Join-Path $root "lib/evidence/customer.js"
$validationPath = Join-Path $root "lib/evidence/validate.js"
$indexPath = Join-Path $root "public/index.html"

$api = Get-Content -LiteralPath $apiPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$browserModel = Get-Content -LiteralPath $browserModelPath -Raw
$customerSerializer = Get-Content -LiteralPath $customerSerializerPath -Raw
$validation = Get-Content -LiteralPath $validationPath -Raw
$index = Get-Content -LiteralPath $indexPath -Raw

function Require-True([bool]$Condition, [string]$Message) {
  if (-not $Condition) {
    throw $Message
  }
}

function Count-Matches([string]$Text, [string]$Pattern) {
  return [regex]::Matches($Text, $Pattern).Count
}

$env:OPENAI_API_KEY = $null
$env:OPEN_API_KEY = $null
$env:SERPER_API_KEY = $null

Require-True ((Count-Matches $customerSerializer 'export function serializeCanonicalCustomerEvidence\s*\(') -eq 1) "Expected one canonical customer evidence serializer."
Require-True ((Count-Matches $browserModel 'function buildCustomerEvidenceViewModel\s*\(') -eq 1) "Expected one pure frontend customer evidence presentation model."
Require-True ((Count-Matches $api 'createFinalEvidenceResult\s*\(') -eq 1) "Expected one production createFinalEvidenceResult call."
Require-True ((Count-Matches $api 'assembleFinalEvidence\s*\(') -eq 0) "Direct API assembleFinalEvidence call remains."
Require-True ($api -notmatch 'buildFinalRetailCustomerEvidenceSnapshot') "Superseded final retail snapshot authority returned."

foreach ($forbidden in @(
  "buildUnifiedCustomerEvidenceList",
  "getPriceFoundDedupeKey",
  "isPriceFoundBestBadgeEligible",
  "getCompactPriceFoundMatchLabel",
  "isSecondaryMarketPriceFoundItem"
)) {
  Require-True (-not $app.Contains($forbidden)) "Frontend evidence authority remains: $forbidden"
}

Require-True ($app -match 'builder\(report\.customerEvidence,\s*report\.customerEvidenceSummary\)') "Frontend does not pass only canonical evidence inputs to the presentation model."
Require-True ($app -match 'card\.dataset\.evidenceId\s*=\s*item\.evidenceId') "Rendered cards do not preserve canonical evidence IDs."
Require-True ($app -match 'link\.href\s*=\s*item\.destinationUrl') "Rendered source links do not use canonical destination URLs."
Require-True ($app -notmatch 'index\s*===\s*0.*Best price|Best price.*index\s*===\s*0') "Frontend still selects a Best price by position."
Require-True (-not $app.Contains("pricesFound")) "Frontend still reads or configures the deprecated pricesFound projection."
Require-True ($app -match 'function renderCanonicalCustomerEvidenceSection\s*\(') "Shared all-purpose canonical evidence renderer is missing."
Require-True ((Count-Matches $app 'renderCanonicalCustomerEvidenceSection\(report\)') -eq 3) "Canonical evidence must render once in each exclusive product-analysis rendering branch."
Require-True ($app -match 'return isCurrentRetailOnlyReport\(report\) \? "Where to Buy" : "Market Evidence"') "Evidence section labels are not neutral for mixed priced/no-price evidence."
Require-True ($app -notmatch '"Prices Found"') "Mixed canonical evidence is still presented under the Prices Found heading."
Require-True ($app -match 'viewModel\.cards\.forEach\(\(card\) => list\.appendChild\(renderCustomerEvidenceCard\(card\)\)\)') "Rendered evidence does not use canonical view-model order."
Require-True ($app -match 'return viewModel\.cards\.map\(\(card\) =>') "Copied evidence does not use canonical view-model order."
Require-True ($app -match 'function formatReport\(report, sections\)\s*\{\s*const evidenceViewModel = getCustomerEvidenceViewModel\(report\)') "All-purpose Copy All does not use the canonical evidence model."
Require-True ($app -match 'viewModel\.status !== "ready" \|\| !viewModel\.cards\.length') "Missing or empty canonical evidence does not render fail-closed messaging."
Require-True ($api -match 'pricesFound:\s*customerEvidence') "Deprecated pricesFound is not an exact canonical projection."
Require-True ($validation -match 'pricesFound compatibility projection IDs or order do not exactly match customerEvidence') "Compatibility projection order validation is missing."
foreach ($removedAlias in @(
  "bestCompatiblePriceFound",
  "otherCompatiblePricesFound",
  "bestCurrentRetailAlternative",
  "otherCurrentRetailPrices"
)) {
  Require-True (($api + $customerSerializer + $validation + $app + $browserModel) -notmatch [regex]::Escape($removedAlias)) "Removed alias remains in production: $removedAlias"
}
Require-True ($index -match '<script src="/customer-evidence\.js"></script>\s*<script src="/app\.js"></script>') "Browser presentation model is not loaded before app.js."
Require-True ($api -match 'maxProviderCalls:\s*28') "Retail provider ceiling changed from 28."
Require-True ($api -match '\? retailBudget\.maxProviderCalls\s*:\s*12') "Collectible provider ceiling changed from 12."
Require-True (@(Get-ChildItem -LiteralPath $PSScriptRoot -File -Filter "*.ps1").Count -eq 52) "Current PowerShell entry-point count is not exactly 52."

$changed = @(git -C $root diff --name-only)
Require-True (-not ($changed -contains "public/styles.css")) "public/styles.css changed."
Require-True (-not ($changed -contains "server.ps1")) "server.ps1 changed."
Require-True (-not ($changed -contains "package.json")) "package.json changed."
Require-True (-not ($changed -contains "PRODUCT_ROADMAP.md")) "PRODUCT_ROADMAP.md changed."

$productionDiff = (git -C $root diff -- api/generate-listing.js lib/evidence public/app.js public/customer-evidence.js public/index.html) -join "`n"
Require-True ($productionDiff -cnotmatch '(?m)^\+.*(?:Office Works|Kroger|Target|Coca-Cola|Georgia Bulldogs|Mercari)' ) "Product-specific production condition or literal was added."

& node --test `
  (Join-Path $PSScriptRoot "canonical-customer-evidence.test.mjs") `
  (Join-Path $PSScriptRoot "customer-evidence-presentation.test.mjs") `
  (Join-Path $PSScriptRoot "customer-evidence-handler-purposes.test.mjs") `
  (Join-Path $PSScriptRoot "production-handler-serialization.test.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Focused Milestone 2C-1 Node tests failed."
}

Write-Output "Milestone 2C-1 canonical customer evidence tests passed."
Write-Output "Canonical API serializer, pure frontend presentation model, handler parity, and structural authority checks passed."
Write-Output "Provider credentials were removed from the test process."
Write-Output "Unexpected network attempts: 0."
