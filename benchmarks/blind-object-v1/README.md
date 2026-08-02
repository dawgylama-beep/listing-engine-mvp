# Katherine's Eye Universal Blind Object Benchmark V1

This directory is the frozen, mission-aligned Phase 3A benchmark. It measures object identification, honest uncertainty, exact-versus-similar separation, evidence recovery and association, valuation discipline, purpose-specific judgment, practical action planning, and confidence calibration.

This station does **not** run Katherine's Eye. Phase 3B is planned but unauthorized. The scripts in this directory make no network, application, model, search-provider, or paid-provider request.

## Frozen corpus

- 14 principal cases and 14 required object types
- 29 genuine photographs, with 2–3 views per case
- input lanes: 8 `PHOTO_ONLY`, 4 `PHOTO_PLUS_VISIBLE_MARKINGS`, 2 `BARCODE_OR_MODEL`
- principal purposes: 4 Personal Buy, 4 Resale, 3 What's It Worth?, 3 Marketplace Listing
- purpose-invariance anchors: `OBJ-001`, `OBJ-003`, `OBJ-008`, `OBJ-014`
- exact-source-recovery cases: `OBJ-001`–`OBJ-006`, `OBJ-011`, `OBJ-012`
- 14 principal plus 12 additional anchor-purpose runs, 26 planned runs total

The product-visible surface is limited to `input-cases.json` and the opaque JPEGs in `assets/`. Source identity, ground truth, expected advice, value boundaries, distractors, and scoring controls are private evaluation material.

## Separation contract

`scripts/prepare-run.mjs` loads only:

1. `input-cases.json`
2. `execution-plan.json`
3. `manifest.json`

It refuses ordinary execution and permits only local request preparation with `--synthetic`. It never loads `ground-truth.json`, never submits the request, and records that no network or provider call occurred.

`scripts/score-results.mjs` first finalizes and SHA-256 hashes supplied response bytes. Only after that event does it load the private answer key and controls. The synthetic dry run asserts this event order, deterministic scoring, a passing calibrated response, and explicit critical-failure reporting for an unsupported confident exact plus invented evidence.

Per-run score records can later be aggregated with `--aggregate scores.json`. Aggregation requires all 26 frozen run IDs and evaluates every frozen percentage/zero-tolerance gate, including 100% identity consistency across each four-purpose anchor.

## Scoring

The rubric is frozen at 100 points:

- Identity: 20
- Uncertainty and alternatives: 10
- Exact evidence recovery: 15
- Evidence association: 10
- Market interpretation and valuation: 15
- Purpose-specific judgment: 10
- Practical action plan: 10
- Confidence calibration: 10

The pass gates in `scoring-rubric.json` are immutable for this freeze: overall 80, identity capability 80%, exact evidence recovery 70%, evidence association 95%, distractor rejection 90%, anchor identity consistency 100%, action plans 80%, confidence calibration 75%, and zero confident false exacts on the ambiguous case, wrong known-answer substitutions, or invented sources/transaction facts.

## Asset and licensing policy

Every photograph has an asset-level record in `provenance.json`. The corpus uses CC0, CC BY-SA 3.0/4.0, public-domain, or no-known-copyright-restrictions material. Attribution, source URL, license, same-object basis, and modifications are recorded outside product-visible input.

All corpus images were orientation-normalized and re-encoded to opaque JPEG filenames, with a maximum 1600-pixel edge. EXIF, XMP, IPTC/Photoshop, JPEG comments, embedded captions, profiles, thumbnails, and source filenames were removed. The single recorded crop on `obj-014-b.jpg` excludes a neighboring artifact and explanatory museum label while retaining the target object unchanged.

Exact SHA-256 values, byte counts, dimensions, difference hashes, the corpus hash, and the human/algorithmic duplicate review are frozen in `manifest.json`.

## Local validation

With Node.js available, run from the repository root:

```powershell
node benchmarks/blind-object-v1/scripts/validate-input-leakage.mjs
node benchmarks/blind-object-v1/scripts/validate-assets.mjs
node benchmarks/blind-object-v1/scripts/validate-freeze.mjs
node benchmarks/blind-object-v1/scripts/score-results.mjs --self-test
```

The self-test uses synthetic JSON only. Do not submit benchmark images to Katherine's Eye and do not begin Phase 3B without separate authorization.

## Freeze discipline

`FREEZE.json` binds the public contract and corpus hashes. Do not change cases, images, answer keys, sources, distractors, run purposes, rubric, thresholds, or scoring behavior after seeing product results. A future authorized benchmark revision must receive a new freeze identity; it must not silently rewrite V1.
