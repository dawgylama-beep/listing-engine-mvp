$ErrorActionPreference = "Stop"

Remove-Item Env:OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:OPEN_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:SERPER_API_KEY -ErrorAction SilentlyContinue

$root = Split-Path -Parent $PSScriptRoot
$apiPath = Join-Path $root "api\generate-listing.js"
$rangePath = Join-Path $root "lib\evidence\range.js"
$publicPath = Join-Path $root "public\app.js"
$serverPath = Join-Path $root "server.ps1"
$apiSource = Get-Content -Raw $apiPath
$rangeSource = Get-Content -Raw $rangePath

if (($apiSource | Select-String -Pattern "createFinalEvidenceResult\s*\(" -AllMatches).Matches.Count -ne 1) {
  throw "Expected exactly one production createFinalEvidenceResult call."
}
if ($apiSource -match "buildFinalRetailCustomerEvidenceSnapshot|assembleFinalEvidence|buildRetailPriceLimitFromPrices|analyzePriceEvidenceCluster|buildWeightedPriceEvidenceRecord") {
  throw "A superseded backend range or retail-limit authority remains in the production API."
}
if ($apiSource -notmatch "function summarizeConsumerVisiblePriceEvidence\(finalEvidenceResult = \{\}\)") {
  throw "summarizeConsumerVisiblePriceEvidence must accept only FinalEvidenceResult."
}
if ($apiSource -match "summarizeConsumerVisiblePriceEvidence\(liveSearch\)|buildPriceSpectrumSummary\(customerFacingPricesFound\)") {
  throw "A production caller still sends legacy or displayed records to a range projection."
}
if ($apiSource -notmatch "const decisionIds = new Set\(rangeResult\.evidenceIds \|\| \[\]\)") {
  throw "buildRetailEvidenceProfile must project decision records from canonical current-retail support IDs."
}
if ($apiSource -match "function buildRetailEvidenceProfile[\s\S]*?function buildNamedStoreRetailResult[\s\S]*?buildRetailPriceLimitFromPrices") {
  throw "buildRetailEvidenceProfile still invokes an independent retail-limit authority."
}
if (($rangeSource | Select-String -Pattern "CANONICAL_RANGE_MINIMUM_INDEPENDENT_OFFERS\s*=\s*2" -AllMatches).Matches.Count -ne 1) {
  throw "Canonical range sufficiency authority is missing or duplicated."
}
if (($rangeSource | Select-String -Pattern "export function deriveRetailLimitResult\s*\(" -AllMatches).Matches.Count -ne 1) {
  throw "Canonical retail-limit authority is missing or duplicated."
}
$addedApiLines = git -C $root diff --unified=0 -- api/generate-listing.js |
  Where-Object { $_ -match "^\+(?!\+\+)" }
if (($addedApiLines -join "`n") -cmatch "Office Works|Kroger|Coca-Cola|Georgia Bulldogs|Mercari") {
  throw "Product- or source-specific production logic was added."
}
if ((git -C $root diff --name-only -- public/app.js).Count -ne 0) {
  throw "public/app.js changed during Milestone 2B-1."
}
if ((git -C $root diff --name-only -- server.ps1).Count -ne 0) {
  throw "server.ps1 changed during Milestone 2B-1."
}

node --test `
  (Join-Path $root "tests\canonical-range-retail-limit.test.mjs") `
  (Join-Path $root "tests\final-evidence-validation.test.mjs") `
  (Join-Path $root "tests\production-handler-serialization.test.mjs") `
  (Join-Path $root "tests\hard-network-denial.test.mjs")
if ($LASTEXITCODE -ne 0) {
  throw "Focused Milestone 2B-1 Node tests failed."
}

Write-Output "Milestone 2B-1 canonical range and retail-limit tests passed."
Write-Output "Production API structural authority checks passed."
Write-Output "public/app.js and server.ps1 remain unchanged."
Write-Output "Provider credentials were removed from the test process."
