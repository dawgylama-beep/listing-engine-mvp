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

$categories = @(
  "Buying for Myself",
  "Buying to Resell",
  "Create a Listing",
  "Taking Good Photos",
  "Using Location",
  "Understanding Your Results"
)

$workflowInstructionChecks = @(
  "Buying for Myself",
  "Analyze Purchase",
  "Buying to Resell",
  "Analyze Resale",
  "It Worth?",
  "Estimate Value",
  "Create a Listing",
  "Prepare to Sell"
)

Require-Contains "Visible app version is 1.12.23" $index "Version 1.12.23"
Require-NotContains "Permanent Start Here box is removed" $index 'class="intake-instructions"'
Require-NotContains "Start Here heading is removed" $index "Start Here"
Require-NotContains "Old three-step instruction text is removed" $index "Choose what you want to do."
Require-NotContains "Old instruction ordered list is removed" $index 'class="intake-steps"'
Require-NotContains "Old instruction styles are removed" $styles ".intake-instructions"
Require-NotContains "Old instruction step styles are removed" $styles ".intake-steps"

Require-Contains "Header Help and Instructions menu button exists" $index 'id="help-menu-button" class="help-menu-button"'
Require-Contains "Help button has accessible name" $index 'aria-label="Help & Instructions"'
Require-Contains "Help button controls dialog" $index 'aria-controls="help-panel"'
Require-Contains "Help button exposes dialog popup" $index 'aria-haspopup="dialog"'
Require-Contains "Help button starts collapsed" $index 'aria-expanded="false"'
Require-Contains "Help button has three-line icon" $index 'class="help-menu-lines"'
Require-Order "Help button lives in page header" $index '<header class="brand-header">' 'id="help-menu-button"'
Require-Order "Help button is before intake form" $index 'id="help-menu-button"' '<form id="listing-form"'
if ($styles -notmatch "\.help-menu-button\s*\{[\s\S]*?position:\s*absolute;[\s\S]*?top:\s*18px;[\s\S]*?right:\s*18px;") {
  $failed += "Help button is positioned in upper-right header"
}

Require-Contains "Help panel dialog exists" $index 'id="help-panel" class="help-panel" role="dialog"'
Require-Contains "Help panel is modal" $index 'aria-modal="true"'
Require-Contains "Help panel starts hidden" $index 'id="help-panel" class="help-panel" role="dialog" aria-modal="true" aria-labelledby="help-panel-title" hidden'
Require-Contains "Help panel heading is clear" $index '<h2 id="help-panel-title">Help & Instructions</h2>'
Require-Contains "Help panel close button exists" $index 'id="help-close-button"'
Require-Contains "Help panel back button exists" $index 'id="help-back-button"'
Require-Contains "Category list view exists" $index 'id="help-category-view"'
Require-Contains "Category list starts before detail view" $index 'id="help-category-list" class="help-category-list"'
Require-Contains "Detail view starts hidden" $index 'id="help-detail-view" class="help-detail-view" aria-labelledby="help-detail-title" hidden'
Require-Order "Category list is presented before detail view" $index 'id="help-category-view"' 'id="help-detail-view"'

Require-Contains "Help category registry exists" $app "const helpInstructionCategories = Object.freeze(["
Require-Contains "Help categories render from registry" $app "function renderHelpCategoryList()"
Require-Contains "Category buttons carry category ids" $app "button.dataset.helpCategory = category.id;"
Require-Contains "Each category opens detail independently" $app 'button.addEventListener("click", () => showHelpCategoryDetail(category.id, { focus: true }));'
Require-Contains "Only selected detail is rendered" $app "function renderHelpDetail(category)"
Require-Contains "Details use numbered instruction lists" $app 'const list = document.createElement("ol");'

foreach ($category in $categories) {
  Require-Contains "Help category exists: $category" $app "title: `"$category`""
}
Require-Contains "Help category exists: What's It Worth?" $app 'It Worth?",'

foreach ($instruction in $workflowInstructionChecks) {
  Require-Contains "Workflow instruction exists: $instruction" $app $instruction
}

Require-Contains "Purpose How to do this control exists" $index 'id="purpose-help-link" class="purpose-help-link"'
Require-Contains "Purpose help opens selected workflow" $app 'purposeHelpLink?.addEventListener("click", () => openHelpForWorkflow(getSelectedWorkflow()));'
Require-Contains "Personal workflow maps to help category" $app 'personal_use: "buying-for-myself"'
Require-Contains "Resale workflow maps to help category" $app 'resale: "buying-to-resell"'
Require-Contains "Owner workflow maps to help category" $app 'market_value: "value-something-i-own"'
Require-Contains "Seller workflow maps to help category" $app 'listing: "sell-something-i-own"'
Require-Contains "Purpose help dataset updates with workflow" $app "purposeHelpLink.dataset.helpCategory = helpCategory;"
Require-Contains "Purpose guidance remains visible" $index 'id="workflow-helper" class="purpose-guidance field-note" aria-live="polite" aria-atomic="true"'

Require-Contains "Help button opens panel" $app 'helpMenuButton.addEventListener("click", () => openHelpPanel());'
Require-Contains "Close button closes panel" $app 'helpCloseButton?.addEventListener("click", closeHelpPanel);'
Require-Contains "Backdrop closes panel" $app 'helpPanelBackdrop?.addEventListener("click", closeHelpPanel);'
Require-Contains "Back button returns to categories" $app 'helpBackButton?.addEventListener("click", () => showHelpCategoryList({ focus: true }));'
Require-Contains "Help panel handles keyboard" $app 'helpPanel.addEventListener("keydown", handleHelpPanelKeydown);'
Require-Contains "Escape key closes panel" $app 'event.key === "Escape" && isHelpPanelOpen()'
Require-Contains "Focus trap exists" $app "function trapHelpPanelFocus(event)"
Require-Contains "Focusable elements are scoped to panel" $app "function getHelpPanelFocusableElements()"
Require-Contains "Focus returns to menu button" $app "helpMenuButton.focus();"
Require-Contains "Body scroll locks on open" $app 'document.body.classList.add("help-panel-open");'
Require-Contains "Body scroll unlocks on close" $app 'document.body.classList.remove("help-panel-open");'
Require-Contains "CSS body scroll lock exists" $styles "body.help-panel-open"
Require-Contains "Help panel is fixed" $styles ".help-panel"
Require-Contains "Mobile help panel goes full screen" $styles "width: 100%;"

Require-NotContains "Buying detailed instructions are not openly rendered in HTML" $index "Take or upload clear photos of the product"
Require-NotContains "Resale detailed instructions are not openly rendered in HTML" $index "Asking prices are not the same as completed sales"
Require-NotContains "Definitions are not openly rendered in HTML" $index "Availability Unconfirmed"
Require-Count "Only one purpose help link exists" $index 'id="purpose-help-link"' 1
Require-Count "Only one help panel exists" $index 'id="help-panel"' 1

Require-Contains "Compact Where to Buy renderer remains" $app 'list.className = "prices-found-list compact-price-list";'
Require-Contains "Compact Where to Buy rows remain" $app 'card.className = `price-found-row match-${matchModifier}`;'
Require-Contains "Where to Buy still renders as unified canonical list" $app 'return isCurrentRetailOnlyReport(report) ? "Where to Buy" : "Market Evidence";'

if ($failed.Count -gt 0) {
  Write-Error ("Global help instruction static checks failed:`n- " + ($failed -join "`n- "))
}

Write-Host "Global help instruction static checks OK - drawer, workflow help, and compact list guards verified."
