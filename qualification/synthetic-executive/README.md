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

Version 1.12.28 keeps the failed qualification classified `NOT_QUALIFIED` while repairing its general continuation contract. One Version 1.1 action registry now owns legal state/action pairs, exact details, evidence requirements, terminal dispositions, and successor derivation. The provider submits a nested decision without a successor; the broker alone appends the canonical successor. Every visible artifact body is materialized in manifest order, and exact serialized bytes plus a conservative one-token-per-byte reservation are sealed before any eligible dispatch. Oversized materializations stop before dispatch without truncation or omission.

Version 1.12.29 prospectively closes the multi-turn request envelope without changing the frozen cognitive policy, action meanings, successors, scorer, corpus, or product handlers. One canonical bounded-request registry generates finite provider constraints, structurally equivalent broker validation, complete bounded semantic traces, inbound evidence admission, and maximum-of-individual-request future-route accounting under the 64,000-byte ceiling. An action is schema-valid at the transmitted state-conditioned structural gate, broker-valid after the registry-derived action-core gate, and episode-admitted only after the separate contextual envelope gate; only episode-admitted actions may mutate state or enter the trace. This tooling-only release performs no provider request, authority action, qualification case, corpus construction, memory promotion, benchmark, handler, Preview, Production, merge, or deployment activity.

Version 1.12.30 seals a newly authored fourteen-case V2 blind held-out corpus without executing it. The committed V1 scorer still defines seven equally weighted checks: V1 remains `12 × 7 = 84`, while the separate deterministic V2 derivation is `14 × 7 = 98` with identical rounding, percentage thresholds, safety gates and fatal rules. Every V2 case physically separates visible evidence, case-scoped memory, fake-worker material, hidden evaluator keys, action and transition constraints, scoring evidence and dispatch proof. The visible-only assembler cannot read evaluator, scoring, memory or worker paths. All 13 actions and 27 state/action relationships are accounted for, and every reachable legal request remains below 64,000 bytes through the frozen Version 1.12.29 serializer.

Rebuild and verify the complete V2 seal offline with `npm run verify:v2-held-out-corpus`. The deterministic V1/V2 comparator proves only `V1_V2_DETERMINISTIC_NON_OVERLAP_PROVEN_UNDER_RECORDED_COMPARATOR`; it does not claim absolute semantic independence. The fourteen-case aggregate is only `PROPOSED_V2_EXECUTION_BUDGET_NOT_AUTHORIZED`, and the sealed terminal state is `V2_HELD_OUT_CORPUS_SEALED_NOT_EXECUTED` with Katherine still `NOT_QUALIFIED`.

Version 1.12.31 records the single authorized V2 blind real-route attempt. Cases `KE-V2-C01` through `KE-V2-C05` reached sealed terminal states, while `KE-V2-C06` received an HTTP 200 Responses result whose provider status was not `completed`. That non-retry-eligible transport condition stopped the run before `KE-V2-C07` through `KE-V2-C14`; hidden evaluator keys remained unopened and no score was calculated. The exact terminal classification is `QUALIFICATION_PROVIDER_TRANSPORT_INTEGRITY_INVALID`, which establishes neither qualification nor non-qualification.

An empty memory receipt is explicitly `VALID_EMPTY`: recurrence is unavailable, but evidence-based novel classification and bounded task construction remain legal. Broker rejections now persist only a safe action type, action-core hash, stable rule/path and legal action set; returned provider usage is stored separately from pre-dispatch reservation evidence and is explicitly complete, incomplete, or unavailable. These changes are tooling-only and do not constitute qualification, cognition, learning, autonomy, product readiness, or production authority.
