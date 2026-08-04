# Katherine's Eye Phase 5C frozen benchmark comparison

## Result

- Complete frozen product result: **FAIL**
- Classification: **MIXED_FAIL**
- Aggregate result SHA-256: `47563e2ef0bf05fca9a25ab60103b09efd155af64fee29a567bd1810f794e9a4`
- Source commit: `926da482c14a9557f4f02966d46ac8a8b58d5c00`
- Citation-only structured candidates retained: **0**
- Silent acquired-source disposition losses: **0**
- Verified exact control matches: **0/8**
- Frozen distractors credited as rejected: **0/8**

Strongest generalized improvement: purposeInvarianceIdentityConsistencyPercent improved by 25 points from Phase 5A.

Strongest regression: identityCapabilityPercent declined by 14.29 points from Phase 5A.

First remaining shared failure boundary: **NOT_ACQUIRED**

## Frozen metrics

| Metric | Phase 5C | Phase 5A | Delta | Pre-Phase 5 |
|---|---:|---:|---:|---:|
| overallScore | 30.384615384615383 | 30.96153846153846 | -0.58 | 30.192307692307693 |
| identityCapabilityPercent | 35.714285714285715 | 50 | -14.29 | 42.857142857142854 |
| exactEvidenceRecoveryPercent | 0 | 0 | 0 | 0 |
| evidenceAssociationCorrectnessPercent | 100 | 100 | 0 | 100 |
| similarSourceRejectionPercent | 0 | 0 | 0 | 0 |
| purposeInvarianceIdentityConsistencyPercent | 75 | 50 | 25 | 75 |
| actionPlanCompletenessPercent | 0 | 0 | 0 | 0 |
| confidenceCalibrationPercent | 0 | 3.8461538461538463 | -3.85 | 3.8461538461538463 |

Additional critical metrics:

- Confident false exacts on ambiguous case: 0
- Wrong known-answer substitutions: 1
- Invented sources or transaction facts: 0

## Section averages

| Section | Average |
|---|---:|
| identity | 10 |
| uncertaintyAndAlternatives | 2.12 |
| exactEvidenceRecovery | 6.92 |
| evidenceAssociation | 10 |
| marketInterpretationAndValuation | 1.35 |
| purposeSpecificJudgment | 0 |
| practicalActionPlan | 0 |
| confidenceCalibration | 0 |

## Execution telemetry

- Benchmark invocations: 1
- Handler invocations: 26
- Requests / responses: 26 / 26
- Principal / anchor-purpose runs: 14 / 12
- Indeterminate / duplicate runs: 0 / 0
- HTTP status distribution: {"200":26}
- Initial queries generated / sent: 211 / 122
- Refinement queries generated / sent: 71 / 71
- Logical provider queries: 193
- Physical provider attempts / retries: 219 / 26
- Provider successes / failures: 192 / 1
- Maximum provider attempts in one run: 12
- Provider-budget violations: 0
- Refinement phases observed: 18
- Maximum refinement queries in one run / violations: 4 / 0
- Maximum retries for one logical query / violations: 1 / 0
- Direct-page attempts / successes / failures: 21 / 4 / 17
- Experience query ownership records: 213
- Experience acquired-source dispositions: 1007
- Maximum Experience Record bytes: 55094

## Structured source acquisition

- Action-source candidates: 864
- Citation-only candidates: 0
- Candidates found in both paths: 93
- Total unique unioned candidates: 1007
- Normalization duplicates removed: 456
- Tracking-variant duplicates removed: 0
- Materially distinct canonical pages preserved: 823
- Malformed / disallowed / non-enrichable: 0 / 0 / 967
- Reached enrichment: 971
- Reached Object Mind verification: 971
- Canonically qualified: 9
- Selected for customer evidence: 8
- Silent uncontrolled disappearance: 0

## Exact-control first loss

| Opaque control | Run | Boundary |
|---|---|---|
| OBJ-001 | RUN-001 | NOT_ACQUIRED |
| OBJ-002 | RUN-002 | NOT_ACQUIRED |
| OBJ-003 | RUN-003 | NOT_ACQUIRED |
| OBJ-004 | RUN-004 | NOT_ACQUIRED |
| OBJ-005 | RUN-005 | NOT_ACQUIRED |
| OBJ-006 | RUN-006 | NOT_ACQUIRED |
| OBJ-011 | RUN-011 | NOT_ACQUIRED |
| OBJ-012 | RUN-012 | NOT_ACQUIRED |

## Distractor-control first loss

| Opaque control | Run | Boundary |
|---|---|---|
| DST-001 | RUN-001 | DISTRACTOR_NOT_ACQUIRED |
| DST-002 | RUN-002 | DISTRACTOR_NOT_ACQUIRED |
| DST-003 | RUN-003 | DISTRACTOR_NOT_ACQUIRED |
| DST-004 | RUN-004 | DISTRACTOR_NOT_ACQUIRED |
| DST-005 | RUN-005 | DISTRACTOR_NOT_ACQUIRED |
| DST-006 | RUN-006 | DISTRACTOR_NOT_ACQUIRED |
| DST-007 | RUN-011 | DISTRACTOR_NOT_ACQUIRED |
| DST-008 | RUN-012 | DISTRACTOR_NOT_ACQUIRED |

## Purpose invariance

| Anchor | Identity-state hash identical | Query plan identical | Provider acquisition differs | First divergence |
|---|---|---|---|---|
| OBJ-001 | false | false | true | OBJECT_MIND_STATE |
| OBJ-003 | false | false | true | OBJECT_MIND_STATE |
| OBJ-008 | false | false | true | OBJECT_MIND_STATE |
| OBJ-014 | false | false | true | OBJECT_MIND_STATE |

## Safety

- Critical safety failures: 2
- Customer-visible Exact records lacking single-authority lineage: 0
- Canonical evidence validation failures: 0
- Provider-budget violations: 0
- Experience-size violations: 0
- Operational ceilings preserved: true
- Secret ceiling preserved: true
- Critical zero-tolerance safety preserved: false
- Secret findings: 0

This record reports the completed Phase 5C benchmark only. It does not authorize or propose another repair.
