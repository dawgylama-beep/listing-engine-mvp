# Current versus historical blind-object comparison

## Outcome

- Classification: **LONG_STANDING_DESIGN_GAP_WITH_LOCALIZED_MIXED_DIFFERENCES**
- Phase 5 choice: **B_LONG_STANDING_DESIGN_GAP**
- Current overall/identity/exact/distractor/purpose invariance: **30.19 / 42.86% / 0.00% / 0.00% / 75.00%**
- Historical overall/identity/exact/distractor/purpose invariance: **25.77 / 21.43% / 0.00% / 0.00% / 100.00%**

Version 1.9.3 is not a stronger system overall: current identity capability is 42.86% versus 21.43%, while both recover 0% exact sources and reject 0% distractors. Historical behavior is locally better on OBJ-003 and OBJ-011 and is more purpose-invariant, but it is more prone to unsupported specific identities and cannot handle three empty-description listing cases.

Strongest regression signal: Purpose-invariance identity consistency is 100% historical versus 75% current, localized to OBJ-001. Because this is one anchor, it is evidence for a focused purpose-isolation test, not a systemic regression declaration.

Strongest evidence against regression: Current maps 6 of 14 principal identities versus 3 of 14 historically, and historical exact-source/distractor performance remains 0%/0%; restoring the old version would not repair the shared identity-to-evidence failure.

## Weighted section averages

| Capability | Maximum | Current | Historical |
|---|---:|---:|---:|
| Identity | 20 | 10.000 | 4.615 |
| Uncertainty and alternatives | 10 | 1.538 | 1.731 |
| Exact evidence recovery | 15 | 6.923 | 6.923 |
| Evidence association | 10 | 10.000 | 10.000 |
| Market interpretation and valuation | 15 | 1.346 | 1.346 |
| Purpose-specific judgment | 10 | 0.000 | 0.000 |
| Practical action plan | 10 | 0.000 | 0.000 |
| Confidence calibration | 10 | 0.385 | 1.154 |

## Candidate table

| Commit | Version | Date | Subject | Handler | Photograph mechanism | Purpose support | Identity structure | Evidence/search | Objective evidence | Limitation |
|---|---|---|---|---|---|---|---|---|---|---|
| 0d8d1e09 | 1.5.4 (package metadata still 0.1.0) | 2026-07-09 | Version 1.5.4 - Improve photo text identity and source routing | api/generate-listing.js#default | photos[].dataUrl passed as OpenAI input_image/image_url | Listing and market-value paths; no native four-workflow contract | Photo text/product identity embedded in listing or valuation report | Source-routed live comparable search | Roadmap records improved photo-text extraction, preserved box/back-label wording, and SKU-style queries. | Older contract, incomplete version metadata, and no four-purpose workflow support. |
| 02d244d1 | 1.8.3 | 2026-07-12 | Version 1.8.3 - Reconcile subject identity and exact product verification | api/generate-listing.js#default | photos[].dataUrl passed as OpenAI input_image/image_url | Four workflow modes through listing/marketValue plus purchase_intent | subjectIdentity, exactProductIdentity, maker/date/licensing status, separate confidences | Broad-subject fallback plus product-owned OpenAI web_search | Roadmap documents separation of broad subject recognition from exact identity and preservation of supported identity under weak comps. | No dedicated visual-first recognition layer and no executable blind-photo acceptance fixture. |
| ebb1a55e | 1.8.4 | 2026-07-12 | Version 1.8.4 - Add visual intelligence engine | api/generate-listing.js#default | photos[].dataUrl passed to a visual-recognition stage, then an identity stage | Four workflow modes through listing/marketValue plus purchase_intent | visualRecognition plus structured subject/exact identity and confidence | Visual-subject-to-exact query ladder plus product-owned OpenAI web_search | Repository adds an explicit universal first-stage visual engine and documented visual clues/unknowns before exact search. | Static/documented evidence only; later 1.9.3 added executable exact-query assertions. |
| 14af1f99 | 1.9.3 | 2026-07-12 | Version 1.9.3 - Improve exact-match search and consumer buy decisions | api/generate-listing.js#default | photos[].dataUrl -> visual input_image -> identity input_image | Native personal_use, resale, market_value, and listing workflows | visual subject, subject identity, exact product identity, maker/model/barcode fields, separate confidences | Exact visible-phrase query builder and required product-owned OpenAI web_search | 26 checked-in static assertions cover exact-query priority, visible-search evidence, match-strength classification, and identity/price separation. | No historical blind-photo fixture; listing rejects empty notes, producing three honest HTTP 400 results in this corpus. |
| 782a1c8e | 1.11.14 | 2026-07-19 | Release 1.11.14 live evidence qualification repair | api/generate-listing.js#default | Multistage image analysis retained in production handler | Native four-purpose workflows | Visual/subject/exact identity plus canonical retail and collectible evidence | Bounded search allocation, qualification, dedupe, and direct-page enrichment | Executable provider-shaped evidence fixtures validate qualification, dedupe, pricing, diagnostics, and output paths. | Release objective is downstream retail/transaction evidence qualification, not photograph identification as the primary task. |

## Principal cases

| Case | Score current/historical | Current identity | Historical identity | Frozen ground truth | Verdict | Exact current/historical | Likely ownership |
|---|---:|---|---|---|---|---|---|
| OBJ-001 | 10/15 | Nutella (UPC 3017620422003) | Nutella hazelnut cocoa spread by Ferrero in a standard commercial jar | Nutella hazelnut spread with cocoa, 400 g jar, GTIN 3017620422003 | CURRENT_BETTER | FAIL/FAIL | barcode/model extraction and identity reconciliation |
| OBJ-002 | 10/15 | Vintage Moka Express stovetop espresso maker, three-cup capacity | Bialetti 2 Tazze stovetop espresso maker coffee water boiler component (Moka pot inner boiler with spout) | Bialetti Mini Express one-cup (1 tazza) stovetop coffee maker | DIFFERENTLY_WRONG | FAIL/FAIL | visual-form reconciliation |
| OBJ-003 | 15/10 | Unverified exact product - likely Hand plane tool for woodworking; exact item, maker, date, and licensing are not confirmed. | Stanley combination plane, mid-20th century, made in England | Stanley No. 78 duplex rabbet/fillister plane | HISTORICAL_BETTER | FAIL/FAIL | maker-mark extraction and identity prompting |
| OBJ-004 | 35/35 | Raspberry Pi 4 Model B | Raspberry Pi Foundation Raspberry Pi 4 Model B single-board computer, 2018, Made in UK | Raspberry Pi 4 Model B single-board computer | EQUAL | FAIL/FAIL | model-text extraction |
| OBJ-005 | 45/25 | Vintage office swivel chair model 560 by Rafflewelling Co., Inc., circa 1966 | Vintage office chair model 560 manufactured in 1966 by Rafflewelling Co., Inc., featuring olive green upholstery and brown armrests on a four-star metal base with casters | Flewelling office chair documented as a 1966 example | CURRENT_BETTER | FAIL/FAIL | identity/evidence reconciliation |
| OBJ-006 | 35/15 | CASIO F-91W digital wristwatch | CASIO F-91W digital wristwatch with water resistance and alarm chronograph functions, black rubber strap, stainless steel back, made in China | Casio F-91W digital wristwatch, black/resin F-91W-1 presentation | EQUAL | FAIL/FAIL | model-text extraction; normalization sensitivity |
| OBJ-007 | 35/35 | Unverified exact product - likely Vintage leather wallet or organizer with metal clasp; exact item, maker, date, and licensing are not confirmed. | Vintage leather personal day planner or organizer with metal keyhole clasp and Italian day tabs | Used brown leather folding wallet or pocketbook with a decorative heraldic-style crest | CURRENT_BETTER | NOT_APPLICABLE/NOT_APPLICABLE | visual-form reconciliation |
| OBJ-008 | 45/45 | Brownie Hawkeye Flash Model Camera | Kodak Brownie Hawkeye Flash Model box camera | Kodak Brownie Hawkeye Flash Model camera | EQUAL | NOT_APPLICABLE/NOT_APPLICABLE | visible-label extraction |
| OBJ-009 | 30/30 | Unverified exact product - likely toy car; exact item, maker, date, and licensing are not confirmed. | Hot Wheels die-cast toy car, purple racing model with number 5 decal, manufactured by Mattel, Inc. in 1989 in Malaysia | Mattel Hot Wheels racing model car carrying number 6 | DIFFERENTLY_WRONG | NOT_APPLICABLE/NOT_APPLICABLE | visible-number extraction and confidence calibration |
| OBJ-010 | 30/30 | Unverified exact product - likely Vintage Coca-Cola advertisement painted as a mural on a brick wall; exact item, maker, date, and licensing are not confirmed. | Mid-20th century style Coca-Cola vintage promotional wall mural featuring Coca-Cola Kid mascot and classic glass bottle with slogan 'Take Some Home Today' painted on brick wall | Painted Coca-Cola wall advertisement/mural in Carthage, North Carolina | DIFFERENTLY_WRONG | NOT_APPLICABLE/NOT_APPLICABLE | visible-text extraction and exact-design search |
| OBJ-011 | 15/15 | Unverified exact product - likely Handheld puzzle cube; exact item, maker, date, and licensing are not confirmed. | 3x3 twisty puzzle cube | Solved 3x3 six-color twisty cube in a Rubik's Cube-style design | HISTORICAL_BETTER | FAIL/FAIL | shape recognition and identity prompting |
| OBJ-012 | 30/30 | Nintendo GAME BOY (UPC 011989607364) | Nintendo Game Boy handheld gaming console model DMG-01 released in 1989 | Original gray Nintendo Game Boy handheld console, model DMG-01 | EQUAL | FAIL/FAIL | model/barcode extraction |
| OBJ-013 | 30/25 | Unverified exact product - likely Wooden ladder; exact item, maker, date, and licensing are not confirmed. | No identity returned: Add item notes before generating a listing. | Broken wooden ladder with a failed or separated structural member | CURRENT_BETTER | NOT_APPLICABLE/NOT_APPLICABLE | empty-description listing compatibility and safety disposition |
| OBJ-014 | 50/30 | Unverified exact product - likely Polyhedral object with spherical nodes and circular holes; exact item, maker, date, and licensing are not confirmed. | No identity returned: Add item notes before generating a listing. | Roman-period hollow pentagonal dodecahedron artifact displayed at the Musée gallo-romain de Fourvière in Lyon; original function unresolved | CURRENT_BETTER | NOT_APPLICABLE/NOT_APPLICABLE | empty-description listing compatibility and ambiguity handling |

## Anchors

| Anchor | Current consistency | Historical consistency | Comparison |
|---|---|---|---|
| OBJ-001 | FAIL | PASS | HISTORICAL_BETTER |
| OBJ-003 | PASS | PASS | EQUAL |
| OBJ-008 | PASS | PASS | EQUAL |
| OBJ-014 | PASS | PASS | EQUAL |

## Provider and evidence execution

- Current: 176 bounded attempts, 150 succeeded, 26 failed/retried, 0 direct-page attempts.
- Historical: 92 statically derived provider attempts across 23 HTTP 200 analyses: 23 web-search attempts and 0 direct-page attempts; three empty-description listing requests stopped at HTTP 400 before provider invocation.
- Current captured 2094 URL records and 5101 recursive evidence-metadata records. Historical captured 27 URL records and 65 recursive evidence-metadata records. These are capture records, not deduplicated customer cards.
- Frozen exact-evidence recovery is 0% for both products.

## Ranked regression ownership

| Rank | Subsystem | Classification | Supporting cases | Counterexamples | Confidence | Phase 5 systemic repair |
|---:|---|---|---|---|---|---|
| 1 | identity prompting and reconciliation | CURRENT_STRONGER | OBJ-005, OBJ-006, OBJ-014 | OBJ-003, OBJ-011 | HIGH | YES |
| 2 | exact-design search and distractor rejection | NO_MATERIAL_DIFFERENCE | OBJ-001, OBJ-002, OBJ-003, OBJ-004, OBJ-005, OBJ-006, OBJ-011, OBJ-012 | None | HIGH | YES |
| 3 | purpose isolation | HISTORICAL_STRONGER | OBJ-001 | OBJ-003, OBJ-008, OBJ-014 | MEDIUM | NO |
| 4 | barcode and model extraction | CURRENT_STRONGER | OBJ-001, OBJ-012 | OBJ-004, OBJ-006, OBJ-008 | MEDIUM | NO |
| 5 | visible-text and maker-mark extraction | INCONCLUSIVE | OBJ-003, OBJ-010, OBJ-011 | OBJ-005, OBJ-006, OBJ-008 | LOW | NO |
| 6 | visual-form and visual-similarity recovery | INCONCLUSIVE | OBJ-003, OBJ-011 | OBJ-007, OBJ-009, OBJ-014 | LOW | NO |
| 7 | query construction | NO_MATERIAL_DIFFERENCE | All eight exact-source cases | OBJ-003, OBJ-011 | HIGH | YES |
| 8 | direct-page verification | NO_MATERIAL_DIFFERENCE | All 26 runs | None | HIGH | NO |
| 9 | evidence association | INCONCLUSIVE | Current recognized association denominator 1, Historical recognized association denominator 0 | None | HIGH | NO |
| 10 | confidence calibration | HISTORICAL_STRONGER | Historical 3/26 calibrated versus current 1/26 | Historical unmapped concrete exact claims | MEDIUM | YES |
| 11 | empty-description listing compatibility | CURRENT_STRONGER | OBJ-013, OBJ-014, OBJ-001 anchor RUN-020 | None | HIGH | NO |
| 12 | market interpretation, purpose judgment, and action planning | CURRENT_STRONGER | Aggregate and section averages | Both action-plan completeness 0% | MEDIUM | YES |

## Phase 5 disposition

Repair **one long-standing design gap**: the shared image/identity-to-verified-exact-evidence chain. Preserve current improvements in identity reconciliation, optional-description handling, and ambiguity safety. Add focused purpose-isolation coverage for OBJ-001-like behavior, but do not restore Version 1.9.3 wholesale and do not treat one anchor as proof of systemic regression.
