import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialObjectSearchPlan } from '../lib/object-intelligence/search-plan.js';
import { buildControlledCustomerModelCorroborationReport } from './helpers/build-browser-handler-response.mjs';

// Retained failed query wording, not a new model response or live search.
const category = 'Household weighing scale with food items';
const makerProse = 'Alexanderwerk is the brand and likely maker, but the precise manufacturing attribution is not independently verified';
function state(mark = 'Alexanderwerk printed on the dial') {
  const terms = [category, mark, makerProse];
  return {
    resolvedIdentity: { brandOrMaker: makerProse },
    observedFacts: [{ observationId: 'retained-visible-mark', factType: 'maker_mark', origin: 'DIRECTLY_VISIBLE', value: mark, normalizedValue: mark.toLowerCase() }],
    canonicalResearchIdentity: { objectCategory: category, categoryObservationIds: [], allowedHypothesisIds: [],
      identityTerms: terms.map((term, index) => ({ term, normalizedTerm: term.toLowerCase(),
        role: index === 0 ? 'CANONICAL_OBJECT_CATEGORY' : 'VISIBLE_MARK', provenance: 'IMAGE', observationIds: ['retained-visible-mark'] })) }
  };
}
test('retained scale prose becomes literal-mark research with unquoted category context', () => {
  const plan = createInitialObjectSearchPlan(state());
  assert(plan.some(item => item.query.includes('"Alexanderwerk"')));
  for (const item of plan) {
    assert(!item.query.includes(`"${category}"`));
    assert.doesNotMatch(item.query, /likely|manufacturing attribution|printed on the dial/);
    assert.equal((item.query.match(/"/g) || []).length % 2, 0);
    assert(item.query.length <= 220);
    assert(item.identityTermProvenance.some(record => record.role === 'CANONICAL_OBJECT_CATEGORY'));
  }
});
test('oversized identifiers are omitted without slicing quotes; category fallback survives', () => {
  const plan = createInitialObjectSearchPlan(state('X'.repeat(250)));
  assert(plan.length > 0);
  assert(plan.every(item => item.query.length <= 220 && !item.query.includes('XXXX')));
});
test('inferred maker cannot become a preferred literal maker', () => {
  const input = state('SyntheticBrand');
  input.observedFacts[0].origin = 'INFERRED';
  const plan = createInitialObjectSearchPlan(input);
  assert(!plan.some(item => item.queryType === 'EXACT_MAKER_OBJECT_TYPE' && item.query.includes('SyntheticBrand')));
});
test('actual controlled handler retains nonprice corroboration without inventing valuation', async () => {
  const report = await buildControlledCustomerModelCorroborationReport();
  assert(report.customerSourceFindings.some(source => source.destinationUrl === 'https://support.acme-workshop.example/reference/hw-42'
    && source.valuationUse === 'Not used to set a price.'));
  assert.equal(report.fairValue, 'Not established');
  assert.equal(report.exactProductIdentity, 'Not verified');
});
