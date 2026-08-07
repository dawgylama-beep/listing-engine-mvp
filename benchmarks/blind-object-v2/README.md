# Katherine's Eye Blind Object Benchmark V2

This package prepares a new independent 14-object, 26-analysis blind holdout benchmark. It contains contracts and deterministic offline validation only. It contains no holdout photographs, descriptions, private controls, frozen executable requests, provider client, or execution authority.

## Current state

Run from the repository root with provider credentials removed and external network access denied:

```powershell
node benchmarks/blind-object-v2/scripts/prepare-benchmark.mjs
```

Until genuinely new, explicitly authorized real-world inputs exist at the fixed ignored intake paths, the only honest result is `AWAITING_NEW_HOLDOUT_INPUTS`. The command writes no file, creates no invocation registry, and constructs zero frozen request contracts in that state.

## Fixed private paths

- `intake/input-manifest.json` and `intake/assets/*`: future new holdout input, ignored by default.
- `private/private-controls.json`: future evaluator-only controls, ignored by default.
- `prepared/*`, `consent/*`, `invocations/*`, and `results/*`: generated or execution-adjacent material, ignored by default.

Future storage or freezing of private photographs requires separate explicit authorization. The local `.gitignore` prevents ordinary staging or accidental commitment.

## Independence and freeze

The preparation module builds a hash-only rejection index from V1. It rejects exact legacy photo hashes, exact or normalized descriptions, object-record fingerprints, identity fingerprints, request-input fingerprints, and available historical request hashes. It does not claim perceptual uniqueness; every future object requires a human attestation that the object and photographs are new and were not used to design a production repair.

A valid freeze binds the input manifest and verified asset bytes, coverage contract, private controls, 26 request contracts, scoring contract, source commit, and Version. Changing any bound value invalidates the freeze. Private controls are reduced to hashes before the public freeze manifest and never enter request contracts.

## Consent and execution

Preparation, validation, freeze, filenames, environment variables, commit messages, and free-form text never authorize execution. A future run requires both a valid pre-execution consent receipt and a separate exact-scope execution authorization. That authorization must bind every field listed in `benchmark-spec.json` and must be rejected if an invocation registry already contains either its invocation ID or the same frozen aggregate.

This package contains no executor. Phase 7B must not advance beyond `FROZEN_AWAITING_CONSENT`, and without new inputs it remains `AWAITING_NEW_HOLDOUT_INPUTS`.
