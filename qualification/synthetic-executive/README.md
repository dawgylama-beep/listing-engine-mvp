# Synthetic Executive qualification readiness

This directory contains the deterministic architecture and blind qualification harness for a later, separately authorized Synthetic Executive Agent qualification.

Current status is `UNQUALIFIED`. The readiness release does not perform an AI qualification, demonstrate executive capability, authorize production work, or authorize a Katherine’s Eye benchmark request.

## Separation of responsibilities

The Lifecycle Integrity Controller is Katherine’s deterministic safety controller. It validates authority, enforces transitions, persists receipts, prevents replay, accounts for attempts and cost, protects handler returns, applies sanitization policy, verifies readback, and stops fail-closed. It does not interpret missions or choose engineering repairs.

The unqualified Synthetic Executive Agent is behind the external Qualification Governor and Typed Executive Action Broker. It can see only the current episode’s content-addressed visible bundle, retrieval receipts from its run-scoped memory, and a pre-sealed worker dossier. It cannot directly reach the repository, shell, provider, product handler, evaluator controls, production credentials, consent authority, reservation authority, merge, or deployment.

## Readiness-only validation

`node qualification/synthetic-executive/scripts/verify-readiness.mjs` verifies the committed public corpus, schemas, hashes, sandbox denial proof, deterministic fake-agent proof, budget proof, unused-consent prohibition, and immutable product/freeze identities without a model or provider call.

The qualification tooling now uses the calibrated OpenAI Responses route directly: exact `gpt-5.6-sol`, medium reasoning, `store:false`, strict compatible structured output, no provider/model tools, and safe bounded provider diagnostics. The route itself remains dormant until a separately reviewed authority is created.

Create-only authorization and the later blind run use separate commands:

`npm run authorize:blind-qualification-real-route -- --authorization <NEW_AUTHORITY.json>`

`npm run qualify:synthetic-executive -- --authorization <SEPARATELY_SEALED_AUTHORITY.json>`

The external execution ledger consumes every provider attempt before dispatch and every memory query, presealed dossier return, and retry under a unique immutable identity. It enforces the sealed per-case and aggregate reasoning, tool, dossier, retry, and cost ceilings. Only the isolated qualification-memory query and presealed-dossier capabilities are available; a dossier return is data retrieval, not an engineering worker.

The credential boundary is entered only by `RUN_QUALIFICATION`. Offline validation and authority creation do not resolve credentials. The model-visible payload never includes a credential, calibration output, expected answer, scoring rule, evaluator control, or hidden evidence. Passing a later blind run would still require a separate human decision before any production or benchmark activity.
