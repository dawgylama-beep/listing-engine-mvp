$ErrorActionPreference = "Stop"

Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPEN_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SERPER_API_KEY -ErrorAction SilentlyContinue

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "helpers\native-git.ps1")
$apiPath = Join-Path $root "api\generate-listing.js"
$decisionPath = Join-Path $root "lib\evidence\decisions.js"
$resultPath = Join-Path $root "lib\evidence\result.js"
$validatorPath = Join-Path $root "lib\evidence\validate.js"
$offerPath = Join-Path $root "lib\evidence\offer.js"
$apiSource = Get-Content -Raw $apiPath
$decisionSource = Get-Content -Raw $decisionPath
$resultSource = Get-Content -Raw $resultPath
$validatorSource = Get-Content -Raw $validatorPath
$offerSource = Get-Content -Raw $offerPath

function Require-Count([string]$label, [string]$source, [string]$pattern, [int]$expected) {
  $count = ([regex]::Matches($source, $pattern)).Count
  if ($count -ne $expected) {
    throw "$label expected $expected occurrence(s), found $count."
  }
}

Require-Count "Canonical recommendation authority" $decisionSource "export function deriveCanonicalDecisionResult\s*\(" 1
Require-Count "Canonical identity-confidence authority" $decisionSource "export function deriveCanonicalIdentityConfidence\s*\(" 1
Require-Count "Canonical pricing-confidence authority" $decisionSource "export function deriveCanonicalPricingConfidence\s*\(" 1
Require-Count "Canonical badge authority" $decisionSource "export function deriveCanonicalBadgeResult\s*\(" 1
Require-Count "Production finalizer invocation" $apiSource "createFinalEvidenceResult\s*\(" 1
Require-Count "Canonical projection function" $apiSource "function applyCanonicalDecisionProjection\s*\(" 1

if ($apiSource -match "buildFinalRetailCustomerEvidenceSnapshot|assembleFinalEvidence|classifyConsumerPurchaseDecision|buildRetailDecisionCalibration|buildRetailPurchaseDecisionFromPrices|buildConsumerRecommendationText|alignDecisionWithRisk|buildBuyerDecisionConfidence|guardBuyerDecision") {
  throw "A superseded backend recommendation, confidence, badge, or early-finalization authority remains in the production API."
}
if ($decisionSource -match "displayedIds|displayEligibleIds|customerEligibleIds") {
  throw "Canonical decision logic must not use display or customer-card ordering as business evidence."
}
if ($resultSource -notmatch "decisionResult[\s\S]*confidenceResult[\s\S]*badgeResult") {
  throw "FinalEvidenceResult does not expose the canonical decision, confidence, and badge contract."
}
if ($validatorSource -notmatch "diagnostic canonicalDecisionSupportEvidenceIds do not match" -or
    $validatorSource -notmatch "diagnostic canonicalPricingConfidenceSupportEvidenceIds do not match" -or
    $validatorSource -notmatch "diagnostic canonicalBadgeSupportEvidenceIds do not match") {
  throw "FinalEvidenceResult validator is missing canonical diagnostic-support parity checks."
}
if (($apiSource | Select-String -Pattern "return applyCanonicalDecisionProjection\(" -AllMatches).Matches.Count -ne 3) {
  throw "Both buyer report paths and the seller report path must finish with canonical response projection."
}
if ($apiSource -match "function buildConsumerOffer\s*\(|function buildConsumerNegotiationGuidance\s*\(|function buildMaximumRecommendedPricePolicy\s*\(" -or
    $offerSource -notmatch "export function deriveCanonicalBuyerOfferResult\s*\(") {
  throw "Post-2B-2 negotiation policy must have exactly one canonical buyer-offer authority."
}
if ($apiSource -notmatch "maxProviderCalls:\s*28" -or
    $apiSource -notmatch "providerCallBudget =[\s\S]*?: 12;") {
  throw "Provider ceilings must remain retail 28 and collectible 12."
}

$gitDiff = Invoke-TestGit -WorkingDirectory $root -Arguments @("diff", "--unified=0", "--", "api/generate-listing.js", "lib/evidence")
$addedProductionLines = $gitDiff.StandardOutput -split "`r?`n" |
  Where-Object { $_ -match "^\+(?!\+\+)" }
if (($addedProductionLines -join "`n") -cmatch "Office Works|Kroger|Target 45|Coca-Cola|Georgia Bulldogs|Mercari|041226087161|6110325|30188") {
  throw "Product-, source-, identifier-, or ZIP-specific production logic was added."
}
# Milestone 2B-2 governs canonical recommendation, confidence, and badge
# authority. Local server transport and local/production handler parity are
# governed by Milestone 2D-2.

node --experimental-test-coverage --test `
  (Join-Path $root "tests\canonical-decision-confidence-badge.test.mjs") `
  (Join-Path $root "tests\final-evidence-validation.test.mjs") `
  (Join-Path $root "tests\production-handler-serialization.test.mjs") `
  (Join-Path $root "tests\hard-network-denial.test.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Focused Milestone 2B-2 Node tests failed."
}

Write-Output "Milestone 2B-2 canonical recommendation, confidence, and badge tests passed."
Write-Output "Structural authority and model-override firewall checks passed."
Write-Output "server.ps1 remains unchanged."
Write-Output "Later canonical buyer-offer and customer-evidence cutovers remain compatible with Milestone 2B-2."
Write-Output "Provider credentials were removed from the test process."
