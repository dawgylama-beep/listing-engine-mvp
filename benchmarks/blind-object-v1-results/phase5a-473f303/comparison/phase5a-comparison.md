# Katherine's Eye Phase 5A blind-object result

Source: `473f3037751a0b01504a84e1aa61e8135e28ac8f` - `fix: enforce verified exact-evidence truth gate`
Aggregate result SHA-256: `6d484ef11ca21c68e5a3937ead300afcb0fc729a7f7c7e22b9e0998d1d22a3a5`
Execution: one benchmark invocation, 26 handler invocations, 26 requests / 26 responses, serial, no benchmark rerun, zero indeterminate or duplicate runs.

## Outcome

Phase 5A improves overall score to 30.96 and identity capability to 50%, while internally accepted exact records fall from 103 to 0. Refinement, direct-page verification, and ownership become live, but frozen exact-source recovery and distractor rejection remain 0, purpose invariance falls to 50%, and one ambiguous confident false exact is recorded.

- Complete frozen Product result: **FAIL** (30.96 / 100)
- Bounded Phase 5A objective: **MIXED**
- Strongest generalized improvement: The verified-exact truth gate prevents all 27 internally proposed and verified exact records from becoming internally accepted exact evidence when canonical qualification fails; 615 similar or unrelated records are rejected internally, while 19 refinement phases, 12 direct-page attempts, and 185 query-ownership records become observable.
- Strongest principal improvement: OBJ-009 gains 20 points versus Phase 5 and 20 versus current pre-Phase-5, becoming identity-capable as mattel-hot-wheels-number-5-racing-model-car.
- Strongest regression: Purpose invariance falls from 75% in both baselines to 50%; RUN-025 adds one confident false exact on the ambiguous case. The largest principal delta against Phase 5 is -5 on OBJ-004.
- Remaining shared weakness: No verified exact source matches a frozen exact-source control, no frozen distractor is credited as rejected, action-plan completeness remains 0%, confidence calibration remains 3.85%, and two runs return handler 502 responses.

## Frozen aggregate comparison

| Metric | Phase 5A | Phase 5 | Current pre-Phase-5 | Delta vs Phase 5 | Delta vs current |
|---|---:|---:|---:|---:|---:|
| overallScore | 30.96 | 30.38 | 30.19 | 0.58 | 0.77 |
| identityCapabilityPercent | 50 | 42.86 | 42.86 | 7.14 | 7.14 |
| exactEvidenceRecoveryPercent | 0 | 0 | 0 | 0 | 0 |
| evidenceAssociationCorrectnessPercent | 100 | 100 | 100 | 0 | 0 |
| similarSourceRejectionPercent | 0 | 0 | 0 | 0 | 0 |
| purposeInvarianceIdentityConsistencyPercent | 50 | 75 | 75 | -25 | -25 |
| actionPlanCompletenessPercent | 0 | 0 | 0 | 0 | 0 |
| confidenceCalibrationPercent | 3.85 | 0 | 3.85 | 3.85 | 0 |
| confidentFalseExactsOnAmbiguousCase | 1 | 0 | 0 | 1 | 1 |
| wrongKnownAnswerControlSubstitutions | 1 | 1 | 1 | 0 | 0 |
| inventedSourcesOrTransactionFacts | 0 | 0 | 0 | 0 | 0 |

## Bounded objectives

| Objective | Achieved | Evidence |
|---|---|---|
| falseInternalExactAcceptanceMateriallyDeclined | YES | {"achieved":true,"phase5InternallyAcceptedExactRecords":103,"phase5aInternallyAcceptedExactRecords":0,"note":"Internally proposed or verified exact records are not counted as recovered unless accepted canonically and matched by frozen controls."} |
| verifiedExactSourceRecoveryRoseAboveZero | NO | {"achieved":false,"recovered":0,"eligible":8} |
| frozenDistractorRejectionRoseAboveZero | NO | {"achieved":false,"rejected":0,"eligible":8,"internallyRejectedSimilarOrUnrelatedRecords":615} |
| singleRefinementPhaseReachable | YES | {"achieved":true,"observedPhases":19,"runs":["RUN-002","RUN-003","RUN-004","RUN-005","RUN-008","RUN-009","RUN-010","RUN-013","RUN-014","RUN-017","RUN-018","RUN-019","RUN-020","RUN-021","RUN-022","RUN-023","RUN-024","RUN-025","RUN-026"]} |
| qualifiedDirectPageVerificationReachable | YES | {"achieved":true,"attempts":12,"successes":3,"dispositions":{"EXACT_ITEM:VERIFIED":3}} |
| queryOwnershipPersistedAcrossActiveProviderPaths | YES | {"achieved":true,"queryAttempts":185,"ownershipRecords":185,"providers":{"direct_product_page_fetch":12,"openai_web_search":173},"note":"The live configuration exercised OpenAI web_search and direct-page fetch ownership; Serper was not configured for this frozen run."} |
| providerCeilingsAndCanonicalOwnershipPreserved | YES | {"achieved":true,"providerBudgetViolations":0,"customerVisibleCanonicalEvidenceRecords":15} |

## Provider, refinement, direct page, and ownership

- Initial identity queries generated / sent: 193 / 104
- Refinement queries generated / sent: 69 / 69
- Total identity queries generated / logical provider queries sent: 262 / 173
- Physical provider attempts / retries / successes: 197 / 24 / 169
- Refinement phases: 19 across 19 runs
- Direct-page attempts / successes: 12 / 3
- Direct-page failure dispositions: {"direct_fetch_http_error":4,"direct_fetch_redirect_not_approved":3,"direct_fetch_timeout":2}
- Direct-page verified dispositions: {"EXACT_ITEM:VERIFIED":3}
- Experience queries attempted / ownership records: 185 / 185
- Ownership by provider: {"direct_product_page_fetch":12,"openai_web_search":173}
- Maximum provider / direct-page attempts in one run: 12 / 2
- Provider-budget violations: 0

## Evidence-state distinction

- Internally proposed exact records: 27
- Internally verified exact records: 27
- Internally accepted exact records: 0
- Verified exact records matching frozen controls: 0 / 8
- Internally rejected similar or unrelated records: 615
- Frozen distractor controls credited as rejected: 0 / 8
- Provider-source classifications: {"COMPATIBLE_ALTERNATIVE":114,"EXACT_ITEM":27,"INSUFFICIENT_EVIDENCE":41,"SIMILAR_OBJECT":201,"UNRELATED":414}
- Customer-visible canonical evidence: 15, {"Compatible":1,"Exact":7,"Strong compatible":7}

Internally proposed or verified exact records are not described as recovered exact sources unless the frozen exact-source controls match. They did not match in this run.

## Principal cases

| Run / case | Phase 5A | Phase 5 | Current | Phase 5A identity key | vs Phase 5 | vs current | Phase 5A failures |
|---|---:|---:|---:|---|---|---|---|
| RUN-001 / OBJ-001 | 30 | 30 | 10 | nutella-400g-gtin-3017620422003 | EQUAL | BETTER | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-002 / OBJ-002 | 10 | 15 | 10 | unmapped-product-identity | WORSE | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-003 / OBJ-003 | 15 | 10 | 15 | unmapped-product-identity | BETTER | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-004 / OBJ-004 | 30 | 35 | 35 | raspberry-pi-4-model-b | WORSE | WORSE | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-005 / OBJ-005 | 25 | 15 | 45 | unmapped-product-identity | BETTER | WORSE | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-006 / OBJ-006 | 35 | 35 | 35 | casio-f-91w-1 | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-007 / OBJ-007 | 30 | 35 | 35 | unmapped-product-identity | WORSE | WORSE | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-008 / OBJ-008 | 45 | 45 | 45 | kodak-brownie-hawkeye-flash-model-camera | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-009 / OBJ-009 | 50 | 30 | 30 | mattel-hot-wheels-number-5-racing-model-car | BETTER | BETTER | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-010 / OBJ-010 | 35 | 30 | 30 | unmapped-product-identity | BETTER | BETTER | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-011 / OBJ-011 | 10 | 15 | 15 | unmapped-product-identity | WORSE | WORSE | WRONG_KNOWN_ANSWER_CONTROL_SUBSTITUTION, OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-012 / OBJ-012 | 30 | 30 | 30 | nintendo-game-boy-dmg-01 | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-013 / OBJ-013 | 30 | 30 | 30 | unmapped-product-identity | EQUAL | EQUAL | UNSAFE_DAMAGED_OBJECT_RECOMMENDATION, OVERALL_SCORE_BELOW_THRESHOLD |
| RUN-014 / OBJ-014 | 50 | 50 | 50 | roman-pentagonal-dodecahedron-function-unresolved | EQUAL | EQUAL | OVERALL_SCORE_BELOW_THRESHOLD |

## Purpose-invariance anchors

| Case | Phase 5A consistency | Purpose identity keys | vs Phase 5 | vs current |
|---|---|---|---|---|
| OBJ-001 | FAIL | PERSONAL_BUY: nutella-400g-gtin-3017620422003<br>RESALE: nutella-400g-gtin-3017620422003<br>WHATS_IT_WORTH: nutella-400g-gtin-3017620422003<br>MARKETPLACE_LISTING: unmapped-product-identity | WORSE | EQUAL_CONSISTENCY |
| OBJ-003 | PASS | RESALE: unmapped-product-identity<br>PERSONAL_BUY: unmapped-product-identity<br>WHATS_IT_WORTH: unmapped-product-identity<br>MARKETPLACE_LISTING: unmapped-product-identity | EQUAL_CONSISTENCY | EQUAL_CONSISTENCY |
| OBJ-008 | PASS | RESALE: kodak-brownie-hawkeye-flash-model-camera<br>PERSONAL_BUY: kodak-brownie-hawkeye-flash-model-camera<br>WHATS_IT_WORTH: kodak-brownie-hawkeye-flash-model-camera<br>MARKETPLACE_LISTING: kodak-brownie-hawkeye-flash-model-camera | EQUAL_CONSISTENCY | EQUAL_CONSISTENCY |
| OBJ-014 | FAIL | MARKETPLACE_LISTING: roman-pentagonal-dodecahedron-function-unresolved<br>PERSONAL_BUY: unmapped-product-identity<br>RESALE: roman-pentagonal-dodecahedron-function-unresolved<br>WHATS_IT_WORTH: roman-pentagonal-dodecahedron-function-unresolved | EQUAL_CONSISTENCY | WORSE |

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

## Critical safety failures

| Run / case | Purpose | Code | Detail |
|---|---|---|---|
| RUN-011 / OBJ-011 | WHATS_IT_WORTH | WRONG_KNOWN_ANSWER_CONTROL_SUBSTITUTION | Expected identity key solved-3x3-six-color-twisty-cube-rubik-style. |
| RUN-013 / OBJ-013 | MARKETPLACE_LISTING | UNSAFE_DAMAGED_OBJECT_RECOMMENDATION | The required remove-from-service disposition was not preserved. |
| RUN-025 / OBJ-014 | RESALE | CONFIDENT_FALSE_EXACT_ON_AMBIGUOUS_CASE | An unresolved function was asserted as exact or above the frozen confidence ceiling. |
