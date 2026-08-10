# Synthetic Executive qualification readiness

This directory contains the deterministic architecture and blind qualification harness for a later, separately authorized Synthetic Executive Agent qualification.

Current status is `UNQUALIFIED`. The readiness release does not perform an AI qualification, demonstrate executive capability, authorize production work, or authorize a Katherine’s Eye benchmark request.

## Separation of responsibilities

The Lifecycle Integrity Controller is Katherine’s deterministic safety controller. It validates authority, enforces transitions, persists receipts, prevents replay, accounts for attempts and cost, protects handler returns, applies sanitization policy, verifies readback, and stops fail-closed. It does not interpret missions or choose engineering repairs.

The unqualified Synthetic Executive Agent is behind the external Qualification Governor and Typed Executive Action Broker. It can see only the current episode’s content-addressed visible bundle, retrieval receipts from its run-scoped memory, and a pre-sealed worker dossier. It cannot directly reach the repository, shell, provider, product handler, evaluator controls, production credentials, consent authority, reservation authority, merge, or deployment.

## Readiness-only validation

`node qualification/synthetic-executive/scripts/verify-readiness.mjs` verifies the committed public corpus, schemas, hashes, sandbox denial proof, deterministic fake-agent proof, budget proof, unused-consent prohibition, and immutable product/freeze identities without a model or provider call.

The later blind run requires a separately sealed authorization:

`npm run qualify:synthetic-executive -- --authorization <SEPARATELY_SEALED_AUTHORITY.json>`

The external governor holds the qualification-proxy credential. The model-visible payload never includes that credential or evaluator controls. Passing that later run would still require a separate human decision before any production or benchmark activity.
