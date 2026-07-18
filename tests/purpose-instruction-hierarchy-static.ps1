param(
  [string]$Root = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = "Stop"

$index = Get-Content (Join-Path $Root "public/index.html") -Raw
$app = Get-Content (Join-Path $Root "public/app.js") -Raw
$styles = Get-Content (Join-Path $Root "public/styles.css") -Raw

$failed = @()

function Require-Contains($Name, $Text, $Pattern) {
  if (-not $Text.Contains($Pattern)) {
    $script:failed += $Name
  }
}

function Require-NotContains($Name, $Text, $Pattern) {
  if ($Text.Contains($Pattern)) {
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

function Require-Count($Name, $Text, $Pattern, $Expected) {
  $count = ([regex]::Matches($Text, [regex]::Escape($Pattern))).Count
  if ($count -ne $Expected) {
    $script:failed += "$Name (expected $Expected, found $count)"
  }
}

$personalGuidance = "Add the store price and location. We’ll compare current alternatives and show where else a price was found."
$resaleGuidance = "Add your purchase price. We’ll estimate resale potential, likely costs, and risk."
$ownerGuidance = "Add photos and any known details. We’ll estimate its value using appropriate market evidence."
$sellerGuidance = "Add condition and selling details. We’ll recommend pricing and help prepare the listing."

Require-Contains "Compact instruction box exists" $index 'class="intake-instructions"'
Require-Contains "Instruction box has semantic heading" $index '<h2 id="intake-instructions-title">Start Here</h2>'
Require-Contains "Instruction box uses ordered list" $index '<ol class="intake-steps">'
Require-Contains "Step 1 is exact" $index "Choose what you want to do."
Require-Contains "Step 2 is exact" $index "Add clear photos and anything you know."
Require-Contains "Step 3 is exact" $index "Enter a price when buying, then let Katherine’s Eye evaluate it."
Require-Order "Three steps occur before purpose choices" $index 'class="intake-steps"' '<fieldset id="workflow-field"'
Require-Order "Step 1 precedes step 2" $index "Choose what you want to do." "Add clear photos and anything you know."
Require-Order "Step 2 precedes step 3" $index "Add clear photos and anything you know." "Enter a price when buying, then let Katherine’s Eye evaluate it."
Require-Order "Purpose choices occur before photos" $index '<fieldset id="workflow-field"' 'class="field photo-stage"'
Require-Order "Buying details precede optional platform in DOM" $index '<section id="buyer-intake-section"' '<div id="platform-field"'
Require-Order "Optional platform precedes optional details in DOM" $index '<div id="platform-field"' 'class="field optional-notes-field"'

Require-Contains "Workflow guidance is associated with purpose fieldset" $index 'aria-describedby="workflow-helper"'
Require-Contains "Workflow guidance uses polite live region" $index 'aria-live="polite"'
Require-Contains "Workflow guidance updates atomically" $index 'aria-atomic="true"'
Require-Contains "Default visible guidance is personal-use only" $index $personalGuidance
Require-NotContains "Resale guidance is not simultaneously visible in HTML" $index $resaleGuidance
Require-NotContains "Owner guidance is not simultaneously visible in HTML" $index $ownerGuidance
Require-NotContains "Seller guidance is not simultaneously visible in HTML" $index $sellerGuidance

Require-Contains "Personal-use guidance config is exact" $app "workflowHelper: `"$personalGuidance`""
Require-Contains "Resale guidance config is exact" $app "workflowHelper: `"$resaleGuidance`""
Require-Contains "Owner guidance config is exact" $app "workflowHelper: `"$ownerGuidance`""
Require-Contains "Seller guidance config is exact" $app "workflowHelper: `"$sellerGuidance`""
Require-Contains "Purpose changes trigger state sync" $app 'workflowInputs.forEach((input) => input.addEventListener("change", () => {'
Require-Contains "Guidance changes update immediately" $app "workflowHelper.textContent = config.workflowHelper;"
Require-Contains "Guidance avoids repeated live-region writes" $app "if (workflowHelper.textContent !== config.workflowHelper) {"

Require-NotContains "Old walkthrough panel is absent" $index "Need a walkthrough?"
Require-NotContains "Old Quick Start is absent" $index "Quick Start"
Require-NotContains "Old Buyer Workflow instructions are absent" $index "Buyer Workflow"
Require-NotContains "Old Seller Workflow instructions are absent" $index "Seller Workflow"
Require-NotContains "Old guide panel markup is absent" $index "guide-panel"
Require-Count "Only one instruction box exists" $index 'class="intake-instructions"' 1
Require-Count "Only one instruction ordered list exists" $index 'class="intake-steps"' 1
Require-Count "Only one visible purpose guidance node exists" $index 'id="workflow-helper"' 1

Require-Contains "Instruction area has compact padding" $styles ".intake-instructions"
Require-Contains "Instruction area uses readable dark text" $styles "color: #17211f;"
Require-Contains "Instruction step text has strong contrast" $styles "color: #263a35;"
Require-Contains "Purpose guidance has readable contrast" $styles "color: #18352f;"
Require-Contains "Mobile instructions stay compact" $styles "@media (max-width: 860px)"
Require-Contains "Mobile instruction padding is small" $styles "padding: 11px 12px;"
if ($styles -notmatch "\.intake-instructions\s*\{[\s\S]*?order:\s*1;") {
  $failed += "Instruction box is first in visual order"
}
if ($styles -notmatch "\.workflow-field\s*\{[\s\S]*?order:\s*2;") {
  $failed += "Purpose field is second in visual order"
}
if ($styles -notmatch "\.photo-stage\s*\{[\s\S]*?order:\s*3;") {
  $failed += "Photos follow purpose in visual order"
}
Require-NotContains "Old guide styles are removed" $styles ".guide-panel"
Require-NotContains "Old guide content styles are removed" $styles ".guide-content"

if ($failed.Count -gt 0) {
  Write-Error ("Purpose instruction hierarchy static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Purpose instruction hierarchy static checks OK - compact top guidance contract verified."
