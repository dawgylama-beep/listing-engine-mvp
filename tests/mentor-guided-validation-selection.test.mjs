import assert from "node:assert/strict";
import test from "node:test";

import {
  discoverPowerShellInventory,
  loadSelectionRegistry,
  validateSelectionRegistry
} from "../qualification/synthetic-executive/v3-cognitive-remediation/version-1.12.36-mentor-guided-reasoning-validation-selection.mjs";

const browserPath = "tests/milestone-2c2-browser-dom.ps1";

test("the explicit Version 1.12.36 PowerShell selection reconciles exactly", () => {
  const result = validateSelectionRegistry(loadSelectionRegistry(), discoverPowerShellInventory());
  assert.equal(result.selected.length, 52);
  assert.equal(result.retained.length, 27);
  assert.equal(result.pending.length, 25);
  assert.equal(result.selected.includes(browserPath), false);
  assert.deepEqual(result.reconciliation, {
    missing: [],
    unexpected: [],
    duplicate: [],
    intersecting: [],
    unclassified: []
  });
});

test("an unmapped browser wrapper cannot enter the explicit validation set", () => {
  const registry = structuredClone(loadSelectionRegistry());
  registry.pendingMembers.push(browserPath);
  assert.throws(
    () => validateSelectionRegistry(registry, discoverPowerShellInventory()),
    /UNMAPPED_BROWSER_SELECTED/
  );
});

test("a newly discovered unclassified PowerShell path fails closed", () => {
  const available = [...discoverPowerShellInventory(), "tests/unmapped-new-test.ps1"].sort();
  assert.throws(
    () => validateSelectionRegistry(loadSelectionRegistry(), available),
    /SELECTION_RECONCILIATION_FAILED/
  );
});

test("wildcards and duplicate classifications fail closed", () => {
  const wildcard = structuredClone(loadSelectionRegistry());
  wildcard.pendingMembers[0] = "tests/*.ps1";
  assert.throws(
    () => validateSelectionRegistry(wildcard, discoverPowerShellInventory()),
    /WILDCARD_FORBIDDEN/
  );

  const duplicate = structuredClone(loadSelectionRegistry());
  duplicate.pendingMembers.push(duplicate.pendingMembers[0]);
  assert.throws(
    () => validateSelectionRegistry(duplicate, discoverPowerShellInventory()),
    /SELECTION_RECONCILIATION_FAILED/
  );
});
