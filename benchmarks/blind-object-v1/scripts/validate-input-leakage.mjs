import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const benchmarkRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = JSON.parse(await readFile(path.join(benchmarkRoot, "input-cases.json"), "utf8"));

const expectedDescriptions = new Map([
  ["OBJ-001", "3017620422003"],
  ["OBJ-004", "Raspberry Pi 4 Model B"],
  ["OBJ-006", "CASIO | F-91W | WATER RESIST | ALARM CHRONOGRAPH"],
  ["OBJ-008", "BROWNIE HAWKEYE CAMERA | FLASH MODEL"],
  ["OBJ-009", "MATTEL, INC. | HOT WHEELS"],
  ["OBJ-012", "Nintendo GAME BOY | DOT MATRIX WITH STEREO SOUND | DMG-01"]
]);
const allowedCaseKeys = ["caseId", "description", "images", "lane", "principalPurpose"].sort();
const forbiddenText = /(?:\$|£|€|price|worth|value|source|http|www\.|category|collectible|rare|exact source|distractor|ground truth|answer|known-answer|personal buy|resale|marketplace listing)/i;

assert.equal(input.schemaVersion, 1);
assert.equal(input.benchmarkId, "blind-object-v1");
assert.equal(input.cases.length, 14);

for (const testCase of input.cases) {
  assert.deepEqual(Object.keys(testCase).sort(), allowedCaseKeys, `${testCase.caseId}: product input contains an unexpected key`);
  assert.match(testCase.caseId, /^OBJ-(?:00[1-9]|01[0-4])$/);
  assert.ok(["PHOTO_ONLY", "PHOTO_PLUS_VISIBLE_MARKINGS", "BARCODE_OR_MODEL"].includes(testCase.lane));
  assert.ok(["PERSONAL_BUY", "RESALE", "WHATS_IT_WORTH", "MARKETPLACE_LISTING"].includes(testCase.principalPurpose));
  assert.equal(typeof testCase.description, "string");

  if (testCase.lane === "PHOTO_ONLY") {
    assert.equal(testCase.description, "", `${testCase.caseId}: PHOTO_ONLY description must be empty`);
  } else {
    assert.equal(testCase.description, expectedDescriptions.get(testCase.caseId), `${testCase.caseId}: description differs from the frozen visible transcription`);
    assert.doesNotMatch(testCase.description, forbiddenText, `${testCase.caseId}: description contains answer, price, source, category, or purpose language`);
  }

  assert.ok(testCase.images.length >= 2 && testCase.images.length <= 4);
  for (const image of testCase.images) {
    assert.match(image, /^assets\/obj-(?:00[1-9]|01[0-4])-[a-d]\.jpg$/, `${testCase.caseId}: non-opaque image path`);
    assert.ok(image.startsWith(`assets/${testCase.caseId.toLowerCase()}-`), `${testCase.caseId}: image ID mismatch`);
    assert.doesNotMatch(image, forbiddenText);
  }
}

assert.deepEqual([...expectedDescriptions.keys()].sort(), input.cases.filter((entry) => entry.lane !== "PHOTO_ONLY").map((entry) => entry.caseId).sort());
console.log(JSON.stringify({
  validator: "validate-input-leakage",
  status: "PASS",
  cases: input.cases.length,
  photoOnlyEmpty: input.cases.filter((entry) => entry.lane === "PHOTO_ONLY").length,
  frozenVisibleTranscriptions: expectedDescriptions.size,
  forbiddenLanguageFindings: 0,
  opaquePathFindings: 0
}, null, 2));
