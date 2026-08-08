# Katherine's Eye Blind Object Benchmark V2

This benchmark-local package prepares a new independent 14-object, 26-analysis blind holdout and contains its deterministic exactly-once execution infrastructure. Preparation, freeze construction, execution authority, request submission, result sealing, and later scoring remain separate boundaries. It contains no scoring runner, product-repair path, deployment path, or implied execution authority.

## Current state

Run from the repository root with provider credentials removed and external network access denied:

```powershell
node benchmarks/blind-object-v2/scripts/prepare-benchmark.mjs
```

Until a complete, explicitly authorized package exists at every fixed ignored input path, the only honest result is `AWAITING_NEW_HOLDOUT_INPUTS`. That state writes no file, creates no receipt or invocation registry, and constructs zero frozen request contracts.

The default command performs validation and constructs the freeze records only in memory. A dry run is `DRY_RUN_VALIDATED`; it is not a durable freeze. Durable persistence is a separate preparation action selected with `--persist-freeze`, and even successful persistence stops at `FROZEN_AWAITING_CONSENT` with every authority flag false.

## Fixed private paths

- `intake/input-manifest.json`, `intake/release-boundary.json`, `intake/analysis-plan.json`, and `intake/assets/*`: future authorized holdout input and its fixed package boundary, all ignored.
- `private/private-controls.json`, `private/provenance.json`, `private/source-originals-manifest.json`, and `private/source-originals/*`: evaluator-only material, all ignored.
- `prepared/*`, `consent/*`, `invocations/*`, and `results/*`: generated or execution-adjacent material, all ignored.

Package content cannot choose the repository release binding or an output root. Repository-owned code derives the source HEAD and Version at freeze time. The operational CLI and default module path always use the live Git repository-state inspector and fail on dirty, staged, conflicted, wrong-root, or unavailable repository state. A branded direct-caller fixture exists only for the empty no-input unit regression and cannot persist or process intake content. The local `.gitignore` prevents ordinary staging of private and generated material.

## Request and freeze authority

Frozen request schema 3.0 is strict and binds the candidate set, canonical object and analysis, every permitted sanitized photo, public description and visible markings, source package, repository HEAD and Version, and the exact specification, coverage, and scoring hashes. Evaluator controls, answers, provenance, source URLs, credentials, endpoints, commands, modules, environment names, and candidate-selected output paths cannot enter a public request.

Frozen package schema 3.0 binds deterministic aggregates for sanitized inputs, source originals, public intake, evaluator-only controls, evaluator-only provenance, the 26-analysis plan, all 26 frozen request hashes, all three governing contracts, the complete source-package boundary, release identity, counts, and the canonical object namespace. The complete aggregate changes or becomes invalid if any bound byte, path, record, count, mapping, package field, release field, request, or governing contract changes.

All sealed records use the shared stable JSON/SHA-256 rule. Semantically unordered inventories are sorted by repository-owned canonical keys; fixed-order arrays keep their prescribed order; a record hash is computed with its own hash field empty and is revalidated after sealing. Unsupported values, non-finite numbers, ambiguous paths, duplicate artifacts, and candidate-controlled executable fields fail closed.

## Durable artifact layout

An authorized future persistence action writes to the ignored repository-owned path:

```text
prepared/freezes/<completeFrozenAggregateHash>/
  freeze-manifest.json
  freeze-receipt.json
  validation-report.json
  source-package-boundary.json
  analysis-plan.json
  requests/<analysis-id>.json
  assets/<canonical-object-id>/<photo-id>.<image-ext>
  evaluator-only/private-controls.json
  evaluator-only/provenance.json
  evaluator-only/source-originals/<canonical-object-id>/<photo-id>.<image-ext>
```

The writer creates a temporary sibling tree, writes and synchronizes every file, validates the pre-receipt tree, writes the receipt last, revalidates all bytes, atomically renames the tree, and validates the final tree again. A failed write removes only its pending tree. It never overwrites an established tree. A byte-identical existing hash-addressed tree returns `EXISTING_IDENTICAL_FREEZE_READBACK`; a partial, corrupt, unexpected, or mismatched tree fails closed.

## Receipt, consent, and execution

Freeze Receipt schema 1.0 is evidence only that durable freeze persistence completed. It binds the candidate set, source release and package, manifest and complete aggregate, artifact root, and protocol version. Its state is `FROZEN_AWAITING_CONSENT`, and its execution-consent, invocation-reservation, provider-access, network-access, scoring, and deployment authority booleans are all false.

Preparation, validation, dry construction, persistence, filenames, environment variables, commit messages, successful tests, free-form text, and receipt existence never authorize execution. A benchmark run requires a separate valid pre-execution consent receipt bound to canonical Launch Scope schema 1.0. The stable scope excludes timestamps and machine-local values, and repository-owned domain labels derive the consent, invocation, reservation, result, and result-root identities from its full hash. The source-grounded cost envelope binds the frozen Version 1.12.13 prompt, schema, request, image, output, web-search, retry, fallback, and direct-page ceilings without changing the complete physical-attempt ceiling of 832.

The standalone command is `node benchmarks/blind-object-v2/scripts/run-authorized-execution.mjs <MODE> <FREEZE_HASH> [CONSENT_HASH]`. Its only modes are `PREFLIGHT`, `CREATE_CONSENT`, `EXECUTE`, and `READBACK`; it accepts no path, identifier, provider, model, endpoint, ceiling, or environment-name override. Version 1.12.15 keeps `CREATE_CONSENT` and `EXECUTE` disabled pending a later separate authorization. The executor permanently separates the frozen product-under-test identity (commit `7056eb0601dc69c5985703fea6fe665e82c6bed8`, Version `1.12.13`) from the Version `1.12.15` executor release. The current repository contains no real consent, reservation, journal, response, result manifest, or score.
