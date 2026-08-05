# Katherine's Eye blind-object benchmark executor v1

This package is the frozen execution spine for the 26-run `blind-object-v1` baseline. It references the benchmark frozen at commit `3449f9a1a29b98b7422710f9e967770d0655b38c`; it does not redefine or modify its corpus, answers, rubric, controls, or assets.

## Production-parity handler

The only real handler path is `scripts/local-generate-listing-bridge.mjs`, which imports `createGenerateListingHandler` from `api/generate-listing.js`. This is the same boundary proven by `tests/local-production-handler-parity.test.mjs` and served locally by `server.ps1`. The executor only performs the frontend-equivalent bounded JPEG envelope conversion, maps the frozen purpose to existing request fields, invokes that bridge, and captures returned bytes plus execution metadata. It contains no identification, search, evidence, valuation, recommendation, or confidence implementation.

## Separation and lifecycle

`prepare-requests.mjs`, `run-baseline.mjs`, `freeze-responses.mjs`, and `verify-result-integrity.mjs` are statically audited to exclude private answer files. Execution is serial. A request hash is durably written before `STARTED`; a response is durably written and hashed immediately after receipt. A `STARTED` run without a secure response hash becomes `INDETERMINATE` and cannot be retried automatically. A `RESPONSE_HASHED` or `FROZEN` run is never invoked again.

`grade-frozen-results.mjs` remains the separate frozen product grader and is unchanged in scoring behavior. `grade-governor-results.mjs` is a separate offline Governor-integrity report; it validates each stored proof without issuing provider requests or changing the product score.

## Validation commands

Run these without provider credentials or network access:

```text
node benchmarks/blind-object-v1-execution-v1/scripts/validate-executor.mjs
node benchmarks/blind-object-v1-execution-v1/scripts/test-executor.mjs
```

The tests use only `mock-handler.mjs` and operating-system temporary directories. They do not invoke Katherine's Eye or create repository result artifacts.

## Future release-bound baseline

Historical result roots, including `current-a4a7214`, remain readable and immutable. A future expressly authorized post-Phase-6B run must use the established new exclusive `phase6a-*` compatibility result identifier and the exact full clean repository HEAD. The release guard records a STARTED invocation manifest before request preparation or any handler/network transmission and rejects a mismatched commit, dirty tree, existing directory, or prior partial/complete manifest for that commit.

Governor proof schema 1.1 durably binds lifecycle-derived construction/state counts, evaluation-owned decision and execution identities, selected-signature uniqueness, parent/child execution ownership, logical provider requests, nested physical attempts/retries, semantic validation, and the final proof hash. Prior-schema artifacts remain readable but are never treated as a current-schema semantic pass.

```text
node benchmarks/blind-object-v1-execution-v1/scripts/run-baseline.mjs --execute-exactly-26 --expected-product-commit <full-40-character-clean-head> --result-root benchmarks/blind-object-v1-results/phase6a-<approved-id>
node benchmarks/blind-object-v1-execution-v1/scripts/freeze-responses.mjs --result-root benchmarks/blind-object-v1-results/phase6a-<approved-id>
node benchmarks/blind-object-v1-execution-v1/scripts/verify-result-integrity.mjs --result-root benchmarks/blind-object-v1-results/phase6a-<approved-id>
node benchmarks/blind-object-v1-execution-v1/scripts/grade-frozen-results.mjs --result-root benchmarks/blind-object-v1-results/phase6a-<approved-id> --out benchmarks/blind-object-v1-results/phase6a-<approved-id>/product-grading
node benchmarks/blind-object-v1-execution-v1/scripts/grade-governor-results.mjs --result-root benchmarks/blind-object-v1-results/phase6a-<approved-id> --out benchmarks/blind-object-v1-results/phase6a-<approved-id>/governor-grading
```

After a complete valid baseline, the request records, response records, journal, frozen result manifest, per-run scorecards, aggregate score, and grading-boundary record are result artifacts eligible for the separately authorized result-only commit. Any launcher diagnostics or failed synthetic fixtures belong in an operating-system temporary directory and must be removed; no broad ignore entry is needed.

This construction station performed zero real product runs, provider calls, Preview requests, Production requests, or deployments.
