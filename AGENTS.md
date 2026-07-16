# Katherine’s Eye — Repository Instructions

## Product Identity

- The canonical customer-facing product name is “Katherine’s Eye.”
- The live domain is katherineseye.com.
- Do not reintroduce Listing Engine, Marketplace Edge, Market Edge, or other former names as the current customer-facing brand.
- Preserve legitimate feature names such as Buying for Myself, Buying to Resell, Check Market Value, Generate Listing, Worth Buying?, and Ask Katherine’s Eye when applicable.
- Do not rename stable repository paths, GitHub repository names, Vercel infrastructure, API routes, environment variables, or compatibility identifiers merely for branding.

## Repository As Source Of Truth

- Inspect the current repository, latest commit, version, roadmap, and tests before editing.
- Do not rely on old conversation history when it conflicts with the repository.
- Check git status before and after every task.
- Stop and report unexpected uncommitted or conflicting work before editing.
- Make only changes required by the approved docket.
- Do not redesign or refactor unrelated features.

## Release Discipline

- Treat each approved docket as one coherent release or investigation.
- Do not increment the version unless the docket explicitly requests it.
- Update every active version reference consistently when a version change is requested.
- Keep PRODUCT_ROADMAP.md current.
- Preserve immutable Git history.
- Leave the working tree clean after an approved commit.
- Do not push or deploy unless the task explicitly requests it.
- Report commit, push, and deployment status honestly.

## Existing Safeguards

Preserve all currently implemented safeguards unless the approved docket explicitly changes them, including:

- canonical product identity reconciliation
- unsupported identity-term firewall
- barcode-first retail identification
- purchase-context routing
- named-store and ZIP/local context
- pack-size and unit-price compatibility
- retail evidence isolation
- fixed-price retail decision logic
- transaction-evidence firewall
- verified-sold evidence gate
- active, sold, auction, and reference evidence separation
- shipping and delivered-cost disclosure
- outlier control and pricing-range calibration
- maximum-price guards
- compact customer-facing reports
- collapsed Technical Search Details
- mobile usability
- secret protection

## Search And Provider Safety

- Never run live or paid Serper, OpenAI, marketplace, or provider searches unless the user explicitly authorizes them.
- Never fabricate search execution, prices, sales, shipping, inventory, availability, or source support.
- Do not weaken match-quality or transaction-evidence standards merely to produce a result.
- Keep provider credentials and implementation secrets out of frontend code and customer reports.

## Secrets And Privacy

- Never display, commit, log, or expose .env values, API keys, authorization headers, tokens, or credentials.
- Confirm .env remains ignored and untracked.
- Do not place precise location coordinates in reports, model prompts, search queries, diagnostics, analytics, or persistent storage.
- Preserve manual ZIP and privacy-safe location behavior.

## Validation

For code-changing tasks, run all applicable available validation:

- server.ps1 -Check
- node --check for changed JavaScript files when Node is available
- full PowerShell/static test suite
- relevant mock-provider tests
- new regression tests required by the docket
- git diff --check
- version consistency checks
- secret scans
- frontend provider-key and authorization-header scans

Do not claim a skipped or unavailable test passed.

Do not run live or paid searches merely as validation.

## Completion Reporting

Every completed implementation report must include:

- starting version and commit
- root cause
- behavior implemented
- files changed
- tests run
- passed tests
- skipped tests and reason
- new version when applicable
- commit hash
- working-tree status
- push status
- deployment status
- any remaining manual verification

## Working Style

- Prefer targeted, test-backed repairs over broad rewrites.
- Add regression coverage for every confirmed production bug.
- Preserve backward compatibility unless the approved docket requires a migration.
- Keep customer language plain and decision-focused.
- Keep raw diagnostics collapsed and separate from the normal customer report.
- Do not hardcode individual test products into production behavior.
- Stop on material validation failures rather than returning a partial PASS.
