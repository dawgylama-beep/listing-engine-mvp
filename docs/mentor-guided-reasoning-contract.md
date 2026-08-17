# Mentor-guided reasoning contract

Version 1.12.37 strengthens the deterministic reasoning discipline at Katherine's Eye's existing Cognitive Lifecycle Governor policy boundary. "Mentor-guided" names the contract; it is not a person, persona, second agent, model, provider, service, route, evaluator, or authority.

The contract requires this bounded order before a Governor decision is assembled:

`actual mission -> finish line -> earliest shared causal boundary -> retained-evidence sufficiency -> authority scope -> failure scope -> smallest safe advancing action -> prohibited operations -> uncertainty and stop conditions`

The production integration remains one internal assertion inside `selectNextCognitiveAction`. It consumes the already-authoritative cognitive state and already-derived legal candidates. It does not make a model or provider call, select a different authority, add a customer response field, change a serializer or schema, persist a lesson, promote memory, or create an alternate execution path.

## Application rules

- Reconstruct the current mission and finish line before choosing an action.
- Prefer the earliest causal boundary that explains all material observations.
- Keep evidence, inference, conclusion, authorization, and action distinct.
- Decide retained-evidence sufficiency independently from the desired conclusion.
- Decide authority scope independently from whether an action appears useful.
- Classify failure scope explicitly as `BOUNDED`, `ARCHITECTURAL`, or `INSUFFICIENT_EVIDENCE`.
- Do not convert insufficient evidence into an architectural finding.
- Do not request new authority when a safe advancing action is already authorized.
- Do not continue without sufficient evidence and authority.
- Do not stop when a bounded safe action is authorized and sufficient.
- Select the smallest safe action that materially advances the mission.
- Detect repeated diagnostic or authorization loops and require material state change.
- Fail closed on contradictions and state uncertainties and stop conditions explicitly.

The typed decision contract exposes `retainedEvidenceSufficient`, `authorityClass`, `failureScope`, `safeIndependentContinuation`, and `nextActionClass` as independent atoms. Narrative explanation may support those atoms but cannot replace them.

## Governance and claims

The contract does not alter a frozen qualification corpus, prompt, bridge, scorer, route, broker, schema, serializer, envelope, authority, execution record, evaluator, or result seal. Closed diagnostic material is not a remediation input and is not eligible for blind reuse.

The fixture evaluator is deterministic, offline, non-persistent, and test-only. Passing its regressions proves only that the declared rules behave as implemented. It does not prove qualification, learning, cognitive improvement, deployment, activation, or memory improvement.
