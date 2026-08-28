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

## Diagnosis origination

Version 1.12.52 adds a bounded `originateMentorDiagnosisCandidates` entry point to the same Mentor module. It accepts only hash-valid reflection observations from a sealed authoritative Experience or frozen verified diagnostic source. It does not accept raw anecdotes, unauthenticated legacy records, object-specific answers, or unverified episode summaries.

The origination report separates authenticated internal causal failures from external insufficiency, provider or transport failures, downstream symptoms, expected customer or safety stops, successful counterevidence, contradictions, and insufficient causal support. Internal failures produce hash-addressed provisional diagnoses containing their supporting episodes, earliest failure stage, violated invariant, cause-versus-symptom evidence, confidence and uncertainty, competing explanations, generalized corrective principle, scope and exclusions, fixed trial obligations, expected measurable improvement, safety and transfer risks, and rejection and rollback conditions.

Origination is deterministic, order invariant, duplicate-idempotent, local, and provider-free. Every report and diagnosis explicitly sets persistence, promotion, runtime consumption, and product-change authority to false. A diagnosis is evidence for a later governed review; it is not a learned lesson, Governor authorization, memory transition, or product repair.

## Inert candidate transition

`buildInertLessonCandidateFromMentorDiagnosis` performs the bounded, non-persistent transition from a hash-valid Mentor diagnosis to the existing Lesson Gate candidate contract. It preserves the diagnosis identity and hash, authenticated supporting observations, causal signature, scope, exclusions, confidence, uncertainty, fixed-trial requirements, measurable target, risks, rejection conditions, and rollback conditions. The resulting candidate remains unauthorized for persistence, promotion, runtime consumption, product change, provider lifecycle effects, global promotion, or cross-product transfer.

The existing Lesson Gate independently reviews causal support before issuing a regression Charter. At least two independent authenticated episodes across two independent object classes are required. `PROOF_BLOCKED` is a terminal preproof disposition for the current evidence: no fixed-trial Charter, proof, persistence, promotion, reconstruction, or application may be fabricated after that decision. New independently authenticated evidence may originate a new hash-addressed review; it does not mutate or upgrade the blocked candidate.

For a hash-valid candidate blocked only by those support deficits, `buildEvidenceAcquisitionRequirement` converts the Gate's exact observed counts into one deterministic, immutable, hash-addressed evidence-acquisition requirement. The requirement binds the candidate, Mentor diagnosis, causal signature, and frozen trial-requirements hashes; records the exact independent-episode and independent-object-class deficits; and carries the consumed evidence identities needed to reject duplicate episodes, duplicate source records, and reused object classes. `evaluateEvidenceAcquisitionInventory` accepts only already-stored, integrity-valid, lesson-eligible internal failure observations with the same causal signature and reports eligible references without mutating the candidate. Both records require hard network denial and grant no persistence, qualification, Charter, promotion, runtime-consumption, product-change, source-mutation, provider-lifecycle, or network-acquisition authority. Synthetic fixtures may validate this boundary but are never supporting product evidence.

## Authenticated-success origination

Version 1.12.52 also adds the missing read-only success entry into the same governed path. `inventoryAuthenticatedProductSuccesses` checks frozen independent-evaluation artifacts against Katherine's existing HMAC-authenticated product-outcome ledger. A success observation is emitted only when its input or image, every applicable provider response, product output, independent evaluator, model, adapter, policy and schema, active memory transition and lesson bundle, ledger event, provenance, and fatal-regression state remain exact and hash-bound. HTTP completion, provider output, a score, or a self-evaluation is insufficient. The inventory is bounded, carries an unforgeable same-process authority receipt, makes no provider or network call, and grants no persistence or lifecycle authority.

`originateMentorSuccessExplanations` is exported through the existing cognitive-governor Mentor subsystem. It deterministically separates `NOVEL_SUCCESS_BEHAVIOR_SUPPORTED`, `EXISTING_PROGRAMMED_COMPETENCE`, `INSUFFICIENT_CAUSAL_SUPPORT`, `EXPECTED_SUCCESS_NO_LESSON`, `EXTERNAL_CAUSE`, and `CONTRADICTORY_EVIDENCE`. Only the novel-supported disposition produces a provisional explanation. The Mentor selects the strongest bound behavior trace, compares it with a hash-valid programmed-competence manifest, records the exact causal evidence, scope, applicability, exclusions, counterevidence, alternatives, confidence, uncertainty, risks, fixed trials, rejection conditions, and rollback conditions, and grants no memory, qualification, promotion, runtime, product, publication, or provider authority.

`buildInertLessonCandidateFromMentorSuccess` cryptographically binds the authenticated success origin and Mentor explanation to the existing Lesson Gate candidate contract. The originating episode and object class are deliberately excluded from the candidate's independent support. The unchanged Gate minimum therefore requires two additional authenticated episodes across two additional object classes before a fixed Charter can be issued. Deficit-only candidates receive the existing immutable evidence-acquisition treatment with success-specific origin-reuse, duplicate-source, duplicate-episode, reused-object-class, and behavior-signature checks. A Charter additionally binds the frozen success-trial requirements and records origin exclusion. Candidate creation remains pure and inert; it does not write lesson memory or imply that qualification, reconstruction, later application, measured improvement, or product learning occurred.

## Authenticated product-feedback domains

The product-outcome feedback boundary accepts hash-bound comparable-research failures and visible-object-class identification failures. Both use the same `EVALUATE_RETURNED_EVIDENCE` Mentor action, HMAC-bound outcome feedback, evidence visibility checks, forward-only ledger, and inert candidate store. Research feedback retains its existing governed-research action and applicability contract. Visible-object-class feedback preserves the authenticated correction only as returned evidence, recommends no product identity mutation, and requires a separate object-class risk signal and independent proof before any bounded trial. Unsupported feedback domains still fail closed, and neither route grants provider, promotion, persistence-to-qualified-memory, or product-change authority.

`GovernedLearningAdapter.reconstructLessonGateCandidate` connects an existing visible-object-class Mentor candidate to the canonical `buildInertLessonCandidateFromMentorDiagnosis` path. It first replays the HMAC-authenticated outcome, feedback, failure, diagnosis, candidate-event, and executive-memory bindings and requires the caller's expected candidate, failure, diagnosis, memory, content-hash, and Mentor-decision identities to match exactly. The derived Gate candidate hashes those identities and the authenticated ledger-event identities into its origin, remains non-operative, and fails closed on substitution, tampering, an unsupported feedback domain, or a non-`EVALUATE_RETURNED_EVIDENCE` action.

`GovernedLearningAdapter.adjudicateMentorIdentityCausality` supplies the previously missing evidence connection without accepting a caller-authored causal result. It replays the same HMAC and executive-memory bindings, hashes the frozen evaluator and product-response bytes, requires the product response's canonical object hash to equal the authenticated outcome hash, requires the product-response byte hash to equal the evaluator binding, and requires the evaluator byte hash to equal the authenticated feedback provenance. The independent-evaluator schema, rubric, episode, correction, failed product claim, independence flags, and visible-failure checks must also remain exact. Unknown fields—including causal-domain or mechanism assertions—fail closed. The resulting hash-valid observation is then submitted to `originateMentorDiagnosisCandidates`; the adapter does not construct a replacement diagnosis or relabel the result.

The originating feedback and evaluator prove that a visible-object-class failure occurred; they do not by themselves prove why it occurred. `UNSUPPORTED_OBJECT_IDENTITY` is retained only as the failure classification, while `UNRESOLVED_TERMINAL_FAILURE` represents the absence of a supported causal mechanism. That observation preserves `UNRESOLVED` causality, is excluded from independent internal-causal support, and contributes zero supporting episodes or object classes. Candidate support counts are recalculated only from lesson-eligible episode references rather than copied from declared confidence. `EVALUATE_RETURNED_EVIDENCE` remains a governed cognitive action and is not registered as a causal mechanism. Until independent authenticated evidence establishes an existing registered internal mechanism, the real Mentor returns `INSUFFICIENT_CAUSAL_SUPPORT`; the Lesson Gate must retain `CAUSALITY_NOT_INTERNAL` and `UNREGISTERED_CAUSAL_MECHANISM`, refuse an evidence-acquisition requirement, and issue no fixed-trial Charter.

## Governance and claims

The contract does not alter a frozen qualification corpus, prompt, bridge, scorer, route, broker, schema, serializer, envelope, authority, execution record, evaluator, or result seal. Closed diagnostic material is not a remediation input and is not eligible for blind reuse.

The fixture evaluator is deterministic, offline, non-persistent, and test-only. Passing its regressions proves only that the declared rules behave as implemented. It does not prove qualification, learning, cognitive improvement, deployment, activation, or memory improvement.
