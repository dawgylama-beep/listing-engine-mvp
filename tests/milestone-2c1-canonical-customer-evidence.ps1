$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $PSScriptRoot "helpers/native-git.ps1")
$apiPath = Join-Path $root "api/generate-listing.js"
$appPath = Join-Path $root "public/app.js"
$browserModelPath = Join-Path $root "public/customer-evidence.js"
$customerSerializerPath = Join-Path $root "lib/evidence/customer.js"
$validationPath = Join-Path $root "lib/evidence/validate.js"
$indexPath = Join-Path $root "public/index.html"
$packagePath = Join-Path $root "package.json"

$api = Get-Content -LiteralPath $apiPath -Raw
$app = Get-Content -LiteralPath $appPath -Raw
$browserModel = Get-Content -LiteralPath $browserModelPath -Raw
$customerSerializer = Get-Content -LiteralPath $customerSerializerPath -Raw
$validation = Get-Content -LiteralPath $validationPath -Raw
$index = Get-Content -LiteralPath $indexPath -Raw
$package = Get-Content -LiteralPath $packagePath -Raw | ConvertFrom-Json

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
$renderReportMatch = [regex]::Match($app, '(?s)function renderReport\(report, sections\)\s*\{.*?\n\}\s*\n\s*function renderReportIdentityHeader')
Require-True $renderReportMatch.Success "The product-analysis report renderer could not be isolated."
$renderReportSource = $renderReportMatch.Value
Require-True ((Count-Matches $renderReportSource 'renderCanonicalCustomerEvidenceSection\(report\)') -eq 2) "Canonical evidence must render exactly once in each top-level product-analysis report path."
Require-True ($renderReportSource -match 'if\s*\(isConsumerReport\(report\)\)\s*\{[\s\S]*?renderConsumerCompactSummary\(report, currentWorkflow\)[\s\S]*?renderActionPlan\(report, currentWorkflow\)[\s\S]*?renderCanonicalCustomerEvidenceSection\(report\)[\s\S]*?renderCustomerTechnicalSearchDetails\(report\)[\s\S]*?return;') "Consumer reports must render canonical evidence after guidance and before collapsed technical details."
Require-True ($renderReportSource -match 'renderExecutiveSummary\(report, currentWorkflow\)[\s\S]*?renderActionPlan\(report, currentWorkflow\)[\s\S]*?renderCanonicalCustomerEvidenceSection\(report\)[\s\S]*?buildSectionCards\(report, sections, isWhySection\)') "Non-consumer reports must render canonical evidence after guidance and before supporting report groups."
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
Require-True ($index -match '<script src="/customer-evidence\.js\?v=1\.12\.27"></script>\s*<script src="/app\.js\?v=1\.12\.27"></script>') "Browser presentation model is not loaded before app.js."
Require-True ($api -match 'maxProviderCalls:\s*28') "Retail provider ceiling changed from 28."
Require-True ($api -match '\? retailBudget\.maxProviderCalls\s*:\s*12') "Collectible provider ceiling changed from 12."
Require-True (@(Get-ChildItem -LiteralPath $PSScriptRoot -File -Filter "*.ps1").Count -eq 53) "Current PowerShell entry-point count is not exactly 53."
Require-True ($package.packageManager -ceq "npm@11.16.0") "The approved npm packageManager declaration changed."
Require-True ($package.devDependencies.'@playwright/test' -ceq "1.62.0") "The exact Milestone 2C-2 Playwright development dependency changed."
Require-True ($null -eq $package.dependencies -or @($package.dependencies.PSObject.Properties.Name).Count -eq 0) "A production package dependency was added."
Require-True (@($package.devDependencies.PSObject.Properties).Count -eq 1) "An unrelated direct development dependency was added."

$gitChanged = Invoke-TestGit -WorkingDirectory $root -Arguments @("diff", "--name-only")
$changed = @($gitChanged.StandardOutput -split "`r?`n" | Where-Object { $_.Length -gt 0 })
# Milestone 2C-1 governs canonical evidence selection and rendering authority.
# Stylesheet accessibility and visual regressions are enforced by the
# Milestone 2C-2 browser/DOM runner.
# Milestone 2C-1 governs canonical customer-evidence selection and
# serialization authority. Local server transport and local/production
# handler parity are governed by Milestone 2D-2.
if ($changed -contains "PRODUCT_ROADMAP.md") {
  $roadmapGitDiff = Invoke-TestGit -WorkingDirectory $root -Arguments @("diff", "--", "PRODUCT_ROADMAP.md")
  $roadmapDiff = $roadmapGitDiff.StandardOutput
  $addedRoadmapLines = @($roadmapDiff -split "`r?`n" | Where-Object { $_ -match '^\+(?!\+\+)' })
  $removedRoadmapLines = @($roadmapDiff -split "`r?`n" | Where-Object { $_ -match '^-(?!--)' })
  Require-True ($removedRoadmapLines.Count -eq 0) "The release roadmap update removed historical content."
  $currentVersionHeading = "+## Version $($package.version) (Completed)"
  $toolingReleaseHeading = "+## Katherine Synthetic Executive Zero-Metadata Route V1 (Completed)"
  $structuredOutputReleaseHeading = "+## Katherine Structured Output Compatibility Tooling Release V1 (Completed)"
  $qualificationRouteReleaseHeading = "+## Katherine Blind Qualification Real Route Integration V1 (Completed)"
  $currentVersionHeadingCount = @($addedRoadmapLines | Where-Object { $_ -ceq $currentVersionHeading }).Count
  $toolingReleaseHeadingCount = @($addedRoadmapLines | Where-Object { $_ -ceq $toolingReleaseHeading }).Count
  $structuredOutputReleaseHeadingCount = @($addedRoadmapLines | Where-Object { $_ -ceq $structuredOutputReleaseHeading }).Count
  $qualificationRouteReleaseHeadingCount = @($addedRoadmapLines | Where-Object { $_ -ceq $qualificationRouteReleaseHeading }).Count
  Require-True (($currentVersionHeadingCount + $toolingReleaseHeadingCount + $structuredOutputReleaseHeadingCount + $qualificationRouteReleaseHeadingCount) -eq 1) "The current authorized product-Version or qualification-tooling roadmap entry is missing or duplicated."
}

$gitProductionDiff = Invoke-TestGit -WorkingDirectory $root -Arguments @("diff", "--", "api/generate-listing.js", "lib/evidence", "public/app.js", "public/customer-evidence.js", "public/index.html")
$productionDiff = $gitProductionDiff.StandardOutput
$addedProductionLines = @($productionDiff -split "`r?`n" | Where-Object { $_ -match '^\+(?!\+\+)' })
$productLiteralPattern = '(?i)(?<![A-Za-z0-9_$])(?:Office Works|Kroger|Target|Coca-Cola|Georgia Bulldogs|Mercari)(?![A-Za-z0-9_$])'

function Get-ProductLiteralFirewallMatches([string[]]$Lines) {
  $matchedLines = @()
  $stringLiteralPatterns = @(
    '"(?:\\.|[^"\\])*"',
    "'(?:\\.|[^'\\])*'",
    '`(?:\\.|[^`\\])*`'
  )

  foreach ($line in $Lines) {
    $literalFragments = @()
    foreach ($literalPattern in $stringLiteralPatterns) {
      foreach ($literalMatch in [regex]::Matches($line, $literalPattern)) {
        $literalFragment = $literalMatch.Value.Substring(1, $literalMatch.Value.Length - 2)
        if ($literalMatch.Value.StartsWith('`')) {
          $literalFragment = [regex]::Replace($literalFragment, '\$\{[^{}]*\}', '')
        }
        $literalFragments += $literalFragment
      }
    }
    foreach ($textMatch in [regex]::Matches($line, '>([^<]+)<')) {
      $literalFragments += $textMatch.Groups[1].Value
    }
    if (($literalFragments -join "`n") -match $productLiteralPattern) {
      $matchedLines += $line
    }
  }

  return $matchedLines
}

$negativeFirewallControls = @(
  '+function getCurrencyErrorTarget(message) {',
  '+function getPurchaseContextErrorTarget(message) {',
  '+function clearFormErrorForTarget(event) {'
)
foreach ($control in $negativeFirewallControls) {
  Require-True (@(Get-ProductLiteralFirewallMatches @($control)).Count -eq 0) "Product-literal firewall rejected an unrelated programming identifier: $control"
}

$positiveFirewallControls = @(
  @{ Name = 'quoted Target retailer literal'; Line = '+const retailer = "Target";' },
  @{ Name = 'target.com URL'; Line = '+const retailerUrl = "https://www.target.com/p/example";' },
  @{ Name = 'quoted Kroger literal'; Line = '+const retailer = "Kroger";' },
  @{ Name = 'quoted Mercari literal'; Line = '+const marketplace = "Mercari";' },
  @{ Name = 'Georgia Bulldogs control-object phrase'; Line = '+const product = "Georgia Bulldogs collectible";' },
  @{ Name = 'Coca-Cola control-object phrase'; Line = '+const product = "Coca-Cola tray";' },
  @{ Name = 'Office Works control-object phrase'; Line = '+const retailer = "Office Works";' }
)
foreach ($control in $positiveFirewallControls) {
  Require-True (@(Get-ProductLiteralFirewallMatches @($control.Line)).Count -eq 1) "Product-literal firewall missed the $($control.Name)."
}
Write-Output "Product-literal firewall controls passed: $($negativeFirewallControls.Count)/$($negativeFirewallControls.Count) negative controls and $($positiveFirewallControls.Count)/$($positiveFirewallControls.Count) positive controls."

$productLiteralMatches = @(Get-ProductLiteralFirewallMatches $addedProductionLines)
Require-True ($productLiteralMatches.Count -eq 0) "Product-specific production condition or literal was added: $($productLiteralMatches -join '; ')"

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
