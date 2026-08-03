# Katherine's Eye blind-object benchmark executor v1

This package is the frozen execution spine for the 26-run `blind-object-v1` baseline. It references the benchmark frozen at commit `3449f9a1a29b98b7422710f9e967770d0655b38c`; it does not redefine or modify its corpus, answers, rubric, controls, or assets.

## Production-parity handler

The only real handler path is `scripts/local-generate-listing-bridge.mjs`, which imports `createGenerateListingHandler` from `api/generate-listing.js`. This is the same boundary proven by `tests/local-production-handler-parity.test.mjs` and served locally by `server.ps1`. The executor only performs the frontend-equivalent bounded JPEG envelope conversion, maps the frozen purpose to existing request fields, invokes that bridge, and captures returned bytes plus execution metadata. It contains no identification, search, evidence, valuation, recommendation, or confidence implementation.

## Separation and lifecycle

`prepare-requests.mjs`, `run-baseline.mjs`, `freeze-responses.mjs`, and `verify-result-integrity.mjs` are statically audited to exclude private answer files. Execution is serial. A request hash is durably written before `STARTED`; a response is durably written and hashed immediately after receipt. A `STARTED` run without a secure response hash becomes `INDETERMINATE` and cannot be retried automatically. A `RESPONSE_HASHED` or `FROZEN` run is never invoked again.

`grade-frozen-results.mjs` is a separate Node process. It first verifies all 26 immutable request and response files, their hashes, the journal, and the aggregate result hash. Only after that boundary does it dynamically load the frozen scorer and private benchmark controls.

## Validation commands

Run these without provider credentials or network access:

```text
node benchmarks/blind-object-v1-execution-v1/scripts/validate-executor.mjs
node benchmarks/blind-object-v1-execution-v1/scripts/test-executor.mjs
```

The tests use only `mock-handler.mjs` and operating-system temporary directories. They do not invoke Katherine's Eye or create repository result artifacts.

## Future authorized baseline

The future result root is `benchmarks/blind-object-v1-results/current-a4a7214/`. A separate Phase 3B authorization must invoke:

```text
node benchmarks/blind-object-v1-execution-v1/scripts/run-baseline.mjs --execute-exactly-26 --result-root benchmarks/blind-object-v1-results/current-a4a7214
node benchmarks/blind-object-v1-execution-v1/scripts/freeze-responses.mjs --result-root benchmarks/blind-object-v1-results/current-a4a7214
node benchmarks/blind-object-v1-execution-v1/scripts/verify-result-integrity.mjs --result-root benchmarks/blind-object-v1-results/current-a4a7214
node benchmarks/blind-object-v1-execution-v1/scripts/grade-frozen-results.mjs --result-root benchmarks/blind-object-v1-results/current-a4a7214 --out benchmarks/blind-object-v1-results/current-a4a7214/grading
```

After a complete valid baseline, the request records, response records, journal, frozen result manifest, per-run scorecards, aggregate score, and grading-boundary record are result artifacts eligible for the separately authorized result-only commit. Any launcher diagnostics or failed synthetic fixtures belong in an operating-system temporary directory and must be removed; no broad ignore entry is needed.

This construction station performed zero real product runs, provider calls, Preview requests, Production requests, or deployments.
