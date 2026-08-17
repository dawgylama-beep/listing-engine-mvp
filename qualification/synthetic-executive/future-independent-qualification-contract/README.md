# Future independent qualification contract

Version 1.12.37 defines a reusable, corpus-agnostic offline contract for a later independently authorized qualification. It does not create a corpus, authority, provider route, evaluator service, execution, score, qualification result, deployment, activation, or memory change.

Each check is a declared conjunction of closed, typed atomic predicates. Categorical decisions, Booleans, nullable values, collection membership, evidence coverage, prohibited operations, and cross-field compatibility are evaluated directly. Unknown types or fields, missing values or executions, invalid JSON types, duplicate identities, and contradictory declarations fail closed.

Narrative text cannot establish semantic correctness. It may be checked only for required presence, bounded length, prohibited-content absence, and explicit evidence references.

The separate execution-envelope module enforces a 4,000-token declaration, a 64,000-byte serialized-request ceiling, complete raw-envelope capture through 1,048,576 bytes, deterministic rejection at 1,048,577 bytes, exactly-once slot consumption, terminal missing-output treatment, and an evaluator lock until execution closure.
