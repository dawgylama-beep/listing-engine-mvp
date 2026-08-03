# Katherine's Eye Phase 5 blind-object result

Source: `e76bb7ced47f75a900fc9819e9a42e882da7d7d0` — `feat: establish shared object intelligence spine`
Aggregate result SHA-256: `a21ea53427806eacf0e8588b66ca7b096cfe3628f839b63efd7589031b91223e`
Execution: 26 requests / 26 responses, serial, no retry, zero indeterminate runs.

## Outcome

Phase 5 raises the overall frozen score by 0.19 points over current and improves uncertainty coverage, but identity capability remains 42.86%, exact-source recovery and distractor rejection remain 0%, and purpose invariance remains 75%. The principal identity improvement on OBJ-001 is offset by a principal identity regression on OBJ-005; the inconsistent purpose anchor moves from OBJ-001 to OBJ-014.

- Complete frozen Product result: **FAIL** (30.38 / 100)
- Phase 5 Identity/Search result: **FAIL**
- Strongest improvement: OBJ-001 becomes identity-capable and purpose-invariant across all four purposes, mapping to the frozen Nutella 400 g GTIN identity key.
- Strongest regression: OBJ-005 falls from identity-capable at 45 points to unmapped at 15 points; OBJ-014 also loses four-purpose identity consistency.
- Remaining shared weakness: Verified exact-source recovery, distractor rejection, direct-page reachability, action-plan completeness, confidence calibration, and persisted query ownership remain absent in the frozen result.

## Frozen aggregate comparison

| Metric | Phase 5 | Current | Historical | Delta vs current |
|---|---:|---:|---:|---:|
| overallScore | 30.38 | 30.19 | 25.77 | 0.19 |
| identityCapabilityPercent | 42.86 | 42.86 | 21.43 | 0 |
| exactEvidenceRecoveryPercent | 0 | 0 | 0 | 0 |
| evidenceAssociationCorrectnessPercent | 100 | 100 | 100 | 0 |
| similarSourceRejectionPercent | 0 | 0 | 0 | 0 |
| purposeInvarianceIdentityConsistencyPercent | 75 | 75 | 100 | 0 |
| actionPlanCompletenessPercent | 0 | 0 | 0 | 0 |
| confidenceCalibrationPercent | 0 | 3.85 | 11.54 | -3.85 |
| confidentFalseExactsOnAmbiguousCase | 0 | 0 | 0 | 0 |
| wrongKnownAnswerControlSubstitutions | 1 | 1 | 1 | 0 |
| inventedSourcesOrTransactionFacts | 0 | 0 | 0 | 0 |

## Phase 5 Identity/Search gates

| Gate | Actual | Requirement | Result |
|---|---:|---:|---|
| identityCapability | 42.86 | >= 80% | FAIL |
| eligibleExactSourceRecovery | 0 | >= 70% | FAIL |
| distractorRejection | 0 | >= 90% | FAIL |
| evidenceAssociation | 100 | >= 95% | PASS |
| purposeInvariance | 75 | >= 100% | FAIL |
| ambiguousConfidentFalseExacts | 0 | = 0 | PASS |
| wrongKnownAnswerSubstitutions | 1 | = 0 | FAIL |
| inventedSourcesOrTransactionFacts | 0 | = 0 | PASS |

## Provider and Object Mind execution

- Logical provider queries: 112
- Physical provider attempts: 138
- Physical retries: 26
- Provider calls succeeded: 109
- Queries generated / sent: 209 / 112
- Experience queries attempted / ownership records: 112 / 0
- Refinement phases: 0
- Direct-page attempts / successes: 0 / 0
- Maximum provider attempts in one run: 9; budget violations: 0

## Principal cases

| Run / case | Score | Phase 5 identity key | vs current | vs historical | Phase 5 failures |
|---|---:|---|---|---|---|
| RUN-001 / OBJ-001 | 30 | nutella-400g-gtin-3017620422003 | BETTER | BETTER | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-002 / OBJ-002 | 15 | unmapped-product-identity | BETTER | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-003 / OBJ-003 | 10 | unmapped-product-identity | WORSE | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-004 / OBJ-004 | 35 | raspberry-pi-4-model-b | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-005 / OBJ-005 | 15 | unmapped-product-identity | WORSE | WORSE | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-006 / OBJ-006 | 35 | casio-f-91w-1 | DIFFERENTLY_WRONG | BETTER | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-007 / OBJ-007 | 35 | unmapped-product-identity | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-008 / OBJ-008 | 45 | kodak-brownie-hawkeye-flash-model-camera | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-009 / OBJ-009 | 30 | unmapped-product-identity | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-010 / OBJ-010 | 30 | unmapped-product-identity | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-011 / OBJ-011 | 15 | unmapped-product-identity | EQUAL | EQUAL | WRONG_KNOWN_ANSWER_CONTROL_SUBSTITUTION, OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-012 / OBJ-012 | 30 | nintendo-game-boy-dmg-01 | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-013 / OBJ-013 | 30 | unmapped-product-identity | EQUAL | BETTER | UNSAFE_DAMAGED_OBJECT_RECOMMENDATION, OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-014 / OBJ-014 | 50 | roman-pentagonal-dodecahedron-function-unresolved | EQUAL | BETTER | OVERALL_SCORE_BELOW_THRESHOLD |

## Purpose-invariance anchors

| Case | Phase 5 consistency | Purpose identity keys | vs current |
|---|---|---|---|
| OBJ-001 | PASS | PERSONAL_BUY: nutella-400g-gtin-3017620422003<br>RESALE: nutella-400g-gtin-3017620422003<br>WHATS_IT_WORTH: nutella-400g-gtin-3017620422003<br>MARKETPLACE_LISTING: nutella-400g-gtin-3017620422003 | BETTER |
| OBJ-003 | PASS | RESALE: unmapped-product-identity<br>PERSONAL_BUY: unmapped-product-identity<br>WHATS_IT_WORTH: unmapped-product-identity<br>MARKETPLACE_LISTING: unmapped-product-identity | EQUAL |
| OBJ-008 | PASS | RESALE: kodak-brownie-hawkeye-flash-model-camera<br>PERSONAL_BUY: kodak-brownie-hawkeye-flash-model-camera<br>WHATS_IT_WORTH: kodak-brownie-hawkeye-flash-model-camera<br>MARKETPLACE_LISTING: kodak-brownie-hawkeye-flash-model-camera | EQUAL |
| OBJ-014 | FAIL | MARKETPLACE_LISTING: roman-pentagonal-dodecahedron-function-unresolved<br>PERSONAL_BUY: unmapped-product-identity<br>RESALE: roman-pentagonal-dodecahedron-function-unresolved<br>WHATS_IT_WORTH: unmapped-product-identity | WORSE |

## Eligible exact-source and distractor controls

| Run / case | Exact source recovered | Distractor rejected |
|---|---|---|
| RUN-001 / OBJ-001 | FAIL | FAIL |
| RUN-002 / OBJ-002 | FAIL | FAIL |
| RUN-003 / OBJ-003 | FAIL | FAIL |
| RUN-004 / OBJ-004 | FAIL | FAIL |
| RUN-005 / OBJ-005 | FAIL | FAIL |
| RUN-006 / OBJ-006 | FAIL | FAIL |
| RUN-011 / OBJ-011 | FAIL | FAIL |
| RUN-012 / OBJ-012 | FAIL | FAIL |

## Critical failures

| Run / case | Purpose | Code | Detail |
|---|---|---|---|
| RUN-011 / OBJ-011 | WHATS_IT_WORTH | WRONG_KNOWN_ANSWER_CONTROL_SUBSTITUTION | Expected identity key solved-3x3-six-color-twisty-cube-rubik-style. |
| RUN-013 / OBJ-013 | MARKETPLACE_LISTING | UNSAFE_DAMAGED_OBJECT_RECOMMENDATION | The required remove-from-service disposition was not preserved. |
