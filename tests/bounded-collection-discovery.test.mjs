import assert from 'node:assert/strict';
import test from 'node:test';
import { __queryIntegrityTestHooks as h } from '../api/generate-listing.js';
import { wholeObjectCategory, literalVisibleIdentity } from '../lib/object-intelligence/whole-object.js';
import { deriveCanonicalResearchIdentity } from '../lib/object-intelligence/canonical-identity.js';
import { createInitialObjectSearchPlan } from '../lib/object-intelligence/search-plan.js';
import { createCognitiveGovernor } from '../lib/cognitive-governor/index.js';
import { installHardNetworkDenial } from './helpers/hard-network-denial.mjs';
import { buildControlledCustomerModelCorroborationReport } from './helpers/build-browser-handler-response.mjs';
const denial = installHardNetworkDenial();
const category = 'Mechanical weighing scale with a bowl holding fruit';
const canonical = { objectCategory: category, identityTerms: [
  { term: category, normalizedTerm: category.toLowerCase(), role: 'CANONICAL_OBJECT_CATEGORY', provenance: 'IMAGE', observationIds: ['object'] },
  { term: 'Acme printed centrally on the dial', normalizedTerm: 'acme printed centrally on the dial', role: 'VISIBLE_MARK', provenance: 'IMAGE', observationIds: ['mark'] }
] };
const context = { canonicalResearchIdentity: canonical, visualCategory: category, itemType: category, brand: 'Acme', retailerDomain: 'market.example', retailEvidenceMode: 'secondary_market' };
const seed = { sourceRecordId: 'original-1', title: 'Acme mechanical weighing scale collection', url: 'https://market.example/collection/scales', canonicalUrl: 'https://market.example/collection/scales', pageType: 'category', objectMindQueryType: 'EXACT_MAKER_OBJECT_TYPE', comparableLadderLevel: 'EXACT' };
const links = '<a href="/listing/one">Acme mechanical weighing scale</a><a href="/listing/bowl">Acme fruit bowl</a><a href="http://127.0.0.1/listing/private">Acme mechanical weighing scale</a><a href="https://other.example/listing/x">Acme mechanical weighing scale</a>';
test('whole object and literal visible marks survive query boundaries without scene prose', () => {
  assert.equal(wholeObjectCategory(category), 'Mechanical weighing scale');
  assert.equal(literalVisibleIdentity('Acme printed centrally on the dial'), 'Acme');
  const state = { canonicalResearchIdentity: canonical, observedFacts: [{ observationId: 'mark', factType: 'maker_mark', origin: 'DIRECTLY_VISIBLE', value: 'Acme printed centrally on the dial', normalizedValue: 'acme printed centrally on the dial' }] };
  const plan = createInitialObjectSearchPlan(state);
  assert(plan.some(query => query.query.includes('"Acme"')));
  assert(plan.every(query => !/bowl|fruit|printed|centrally/i.test(query.query)));
  const delivered = h.buildCanonicalObjectSerperSearchPlan({ context, objectMindState: { ...state, canonicalResearchIdentity: { ...canonical, objectCategory: 'Mechanical weighing scale' }, searchPlan: plan }, marketplaceDomains: ['market.example'] });
  assert(delivered.length);
  assert(delivered.every(query => (query.query.match(/\(/g) || []).length === (query.query.match(/\)/g) || []).length));
});
test('identity derivation cannot choose a compact contents category over observed head object', () => {
  const extracted = { visualRecognition: { visualSubject: category, visualSubjectCategory: 'bowl' }, visualSubject: category, visualSubjectCategory: 'bowl', category: 'bowl' };
  const derived = deriveCanonicalResearchIdentity({ observedFacts: [], identityHypotheses: [] }, extracted);
  assert.equal(derived.objectCategory, 'Mechanical weighing scale');
  assert.equal(literalVisibleIdentity('The dial includes the word Acme and a serial mark'), 'Acme');
});
test('canonical object controls compatibility and exclusion rather than its contents', () => {
  const records = h.normalizeSerperCandidateRecords([
    { sourceRecordId: 'scale', title: 'Acme mechanical weighing scale with bowl and apples', url: 'https://market.example/listing/scale' },
    { sourceRecordId: 'bowl', title: 'Acme porcelain fruit bowl', url: 'https://market.example/listing/bowl' }
  ], context, context);
  assert.equal(records[0].submittedItemType, 'weighing scale');
  assert.equal(records[0].itemTypeCompatible, true);
  assert.equal(records[1].itemTypeCompatible, false);
  assert.match(records[1].rejectionReason, /scale/i);
});
test('full listing descriptions preserve replacement and parts exclusion signals', () => {
  for (const title of ['Acme mechanical weighing scale with replacement bowl only', 'Acme weighing scale with parts only']) {
    const result = h.normalizeSerperCandidateRecords([{ sourceRecordId: 'accessory', title, url: 'https://market.example/listing/accessory' }], context, context)[0];
    assert.equal(result.itemTypeCompatible, false, title);
    assert(!h.collectionIdentityMatches(title, context));
  }
});
test('coarse categories retain specific whole-object compatibility and asking/sold boundaries', () => {
  const coarse = { canonicalResearchIdentity: { objectCategory: 'decorative collectible' }, itemType: 'decorative collectible' };
  const result = h.normalizeSerperCandidateRecords([{ sourceRecordId: 'sign', title: 'Acme metal advertising sign', url: 'https://market.example/listing/sign' }], { likelyItemDescription: 'Acme metal advertising sign', exactProductIdentity: 'Acme metal advertising sign' }, coarse)[0];
  assert.equal(result.submittedItemType, 'sign or wall plaque');
  assert.equal(result.itemTypeCompatible, true);
});
test('collection discovery is same-host, approved, whole-object and maker compatible; no inherited price', () => {
  assert(h.isApprovedCollectionDiscoveryUrl(seed.url, context, seed));
  assert(!h.isApprovedCollectionDiscoveryUrl(seed.url, context, { ...seed, title: 'OtherCo kitchen weighing scale collection' }));
  assert(!h.collectionIdentityMatches('Acmeology mechanical weighing scale', context));
  const children = h.discoverCollectionListingCandidates(links, seed.url, context, { ...seed, displayedPriceText: '$999', priceAuthenticated: true });
  assert.equal(children.length, 1);
  assert.equal(children[0].collectionParentSourceId, 'original-1');
  assert.equal(children[0].displayedPriceText, undefined);
  assert.equal(children[0].priceAuthenticated, undefined);
  assert.equal(children[0].sourceRecordId, h.discoverCollectionListingCandidates(links, seed.url, context, seed)[0].sourceRecordId);
});
test('collection and one individual offer share two physical reads; asking price never becomes sold', async () => {
  const budget = h.createPhysicalAttemptBudget(2, 'direct_page_enrichment');
  const calls = [], requests = [];
  const records = await h.executeExactRetailPageDirectEnrichment({ context, identity: context, currentRecords: [seed], directPageAttemptBudget: budget, providerRequestRecords: requests,
    requestAdapter: async (url, ctx, record, state) => {
      calls.push(url);
      assert.equal(state.initialAttemptReserved, true);
      return { finalUrl: url, statusCode: 200, elapsedMs: 1, html: state.collectionDiscovery ? links : '<h1>Acme mechanical weighing scale</h1><p>Price $73.00</p><button>Add to cart</button>', sourceEvidenceText: state.collectionDiscovery ? '' : 'Acme mechanical weighing scale Price $73.00 Add to cart' };
    }
  });
  assert.equal(calls.length, 2); assert.equal(budget.physicalAttemptCount, 2);
  const child = records.find(record => record.discoveryOrigin === 'BOUNDED_COLLECTION_LINK');
  assert(child); assert.equal(child.collectionParentSourceId, seed.sourceRecordId);
  assert.equal(child.parsedPrice, 73); assert.doesNotMatch(child.priceEvidenceType, /sold/i);
  assert.equal(requests.length, 2);
});
test('one remaining read, irrelevant collection and exhausted ceiling do not dispatch discovery', async () => {
  for (const [maximum, current, record] of [[1, 0, seed], [2, 2, seed], [2, 0, { ...seed, title: 'Acme decorative porcelain bowl collection' }]]) {
    const budget = h.createPhysicalAttemptBudget(maximum, 'direct_page_enrichment'); budget.physicalAttemptCount = current;
    let calls = 0;
    await h.executeExactRetailPageDirectEnrichment({ context, currentRecords: [record], directPageAttemptBudget: budget, requestAdapter: async () => { calls++; throw Error('unexpected'); } });
    assert.equal(calls, 0);
  }
});
test('no compatible child preserves explicit disposition, no invented offer', async () => {
  const result = await h.executeExactRetailPageDirectEnrichment({ context, currentRecords: [seed], requestAdapter: async url => ({ finalUrl: url, statusCode: 200, html: '<a href="/listing/book">Acme illustrated book</a>', sourceEvidenceText: '' }) });
  assert.equal(result.length, 1); assert.equal(result[0].enrichmentDisposition, 'COLLECTION_NO_COMPATIBLE_LISTING');
});
test('candidate IDs reconcile originals, normalization aliases and discovery with final disposition', () => {
  const original = { sourceRecordId: 'raw-one', url: 'https://market.example/listing/one', title: 'Acme weighing scale' };
  const excluded = { sourceRecordId: 'raw-two', url: 'https://market.example/listing/bowl', title: 'Fruit bowl' };
  const normalized = { ...original, observationIds: ['raw-one'], rejectionReason: '', identityMatchStrength: 'Strong Similar', selectionReason: 'Compatible visible object.', parsedPrice: 73, priceType: 'Active Asking' };
  const reconciled = h.reconcileSourceAcquisitionRecords([original, excluded], [normalized]);
  const audit = h.buildComparableFunnelDiagnostics({ sourceAcquisitionRecords: reconciled, providerSourceRecords: [normalized], finalEvidenceResult: { acceptedRecords: [normalized], customerEvidence: [normalized], views: { displayedIds: ['raw-one'], priceBearingIds: ['raw-one'] } } }).candidateAudit;
  assert.equal(audit.length, 2); assert.equal(audit[0].candidateId, 'raw-one'); assert.equal(audit[0].disposition, 'RETAINED'); assert.equal(audit[1].disposition, 'EXCLUDED'); assert.match(audit[1].reason, /No normalized/);
});
test('actual controlled report boundary retains candidate audit while withholding unsupported value', async () => {
  const report = await buildControlledCustomerModelCorroborationReport();
  assert.equal(report.fairValue, 'Not established');
  assert(Array.isArray(report.searchDiagnostics.candidateAudit));
  assert(report.searchDiagnostics.candidateAudit.every(candidate => candidate.candidateId && candidate.reason));
});
test('actual governor authorizes collection and child separately without bypass', async () => {
  const governor = createCognitiveGovernor({ evaluationId: 'offline-collection-governor' });
  const requests = [];
  const result = await h.executeExactRetailPageDirectEnrichment({ context, identity: context, currentRecords: [seed], cognitiveGovernor: governor, objectMindState: { objectStateId: 'offline-collection-object', observedFacts: [], identityHypotheses: [], canonicalResearchIdentity: canonical, resolvedIdentity: { bestSupportedCustomerIdentity: 'Acme mechanical weighing scale', limitations: ['price'], additionalEvidenceNeeded: ['individual offer'] }, searchPlan: [], candidateEvidence: [] }, providerRequestRecords: requests,
    requestAdapter: async (url, ctx, record, state) => ({ finalUrl: url, statusCode: 200, html: state.collectionDiscovery ? links : '<h1>Acme mechanical weighing scale</h1><p>$73.00</p>', sourceEvidenceText: state.collectionDiscovery ? '' : 'Acme mechanical weighing scale $73.00' })
  });
  assert.equal(requests.length, 2);
  assert(result.some(record => record.discoveryOrigin === 'BOUNDED_COLLECTION_LINK'));
  assert(requests.every(request => request.governorScopeClassification === "GOVERNOR_CONTROLLED" && request.parentGovernorActionSignature && request.controlledExecutionEventIdentity));
});
test('collection redirect consumes remaining read and prevents child dispatch', async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async url => {
    urls.push(url);
    if (url === seed.url) return new Response(null, { status: 302, headers: { location: '/collection/redirected' } });
    if (url === 'https://market.example/collection/redirected') return new Response(links, { status: 200, headers: { 'content-type': 'text/html' } });
    throw Error('Unscripted offline transport');
  };
  try {
    const budget = h.createPhysicalAttemptBudget(2, 'direct_page_enrichment');
    const records = await h.executeExactRetailPageDirectEnrichment({ context, currentRecords: [seed], directPageAttemptBudget: budget, requestAdapter: h.requestBoundedRetailProductPageNetwork });
    assert.equal(urls.length, 2); assert.equal(budget.physicalAttemptCount, 2);
    assert(records.some(record => record.enrichmentDisposition === 'COLLECTION_DISCOVERY_BUDGET_EXHAUSTED'));
    assert(!records.some(record => record.enrichmentDisposition === 'DIRECT_PAGE_HYDRATED'));
  } finally { globalThis.fetch = originalFetch; }
});
test('actual Governor refusal preserves a contradicted collection without dispatch', async () => {
  const governor = createCognitiveGovernor({ evaluationId: 'offline-rejected-collection' });
  let calls = 0;
  const records = await h.executeExactRetailPageDirectEnrichment({ context, currentRecords: [{ ...seed, objectMindClassification: 'REJECTED' }], cognitiveGovernor: governor,
    objectMindState: { objectStateId: 'rejected-object', observedFacts: [], identityHypotheses: [], resolvedIdentity: {}, searchPlan: [] },
    requestAdapter: async () => { calls++; throw Error('unexpected'); }
  });
  assert.equal(calls, 0); assert.equal(records[0].enrichmentDisposition, 'GOVERNOR_DIRECT_PAGE_NOT_AUTHORIZED');
});
test('production collection transport rejects credentials, private targets, non-HTML and oversized responses', async () => {
  for (const url of ['https://user:pass@market.example/collection/scales', 'http://127.0.0.1/collection/scales']) {
    await assert.rejects(h.requestBoundedRetailProductPageNetwork(url, context, seed, { collectionDiscovery: true }), /not approved/);
  }
  const originalFetch = globalThis.fetch;
  try {
    for (const headers of [{ 'content-type': 'application/json' }, { 'content-type': 'text/html', 'content-length': '250001' }]) {
      globalThis.fetch = async () => new Response('', { status: 200, headers });
      await assert.rejects(h.requestBoundedRetailProductPageNetwork(seed.url, context, seed, { collectionDiscovery: true, initialAttemptReserved: true }), /HTML|size limit/);
    }
    globalThis.fetch = async () => new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/collection/scales' } });
    await assert.rejects(h.requestBoundedRetailProductPageNetwork(seed.url, context, seed, { collectionDiscovery: true, initialAttemptReserved: true }), /redirect target/);
  } finally { globalThis.fetch = originalFetch; }
});
test('focused boundaries made zero external transport attempts', () => assert.deepEqual(denial.attempts, []));
