import assert from 'node:assert/strict';
import test from 'node:test';
import {installHardNetworkDenial} from './helpers/hard-network-denial.mjs';
const denial=installHardNetworkDenial();
const {__queryIntegrityTestHooks:h}=await import('../api/generate-listing.js');
const {createObjectMindState,createInitialObjectSearchPlan,createRefinementSearchPlan}=await import('../lib/object-intelligence/index.js');
const {createFinalEvidenceResult}=await import('../lib/evidence/result.js');
const context={canonicalResearchIdentity:{objectCategory:'Mechanical weighing scale',identityTerms:[{term:'Acme',role:'VISIBLE_MARK',observationIds:['mark']}]},itemType:'Mechanical weighing scale',brand:'Acme',retailerDomain:'market.example',retailEvidenceMode:'secondary_market'};
const offer=(currency, text='Available', name='Acme mechanical weighing scale')=>`<h1>${name}</h1><p>${text}</p><script type="application/ld+json">${JSON.stringify({'@type':'Product',name,offers:{'@type':'Offer',price:'89.00',...(currency?{priceCurrency:currency}:{})}})}</script>`;
const normalize=html=>h.normalizeSerperCandidateRecords([{sourceRecordId:'child',title:'Acme mechanical weighing scale',url:'https://market.example/listing/one',collectionParentSourceId:'parent',pageHtml:html}],context,context)[0];

test('individual foreign and unresolved currencies cannot become USD valuation prices',()=>{
 for(const currency of ['EUR','CAD','GBP','AUD','JPY','']){
  const r=normalize(offer(currency));
  assert.equal(r.parsedPrice,null,currency); assert.equal(r.priceAuthenticated,false,currency);
  assert.doesNotMatch(r.includedInPreliminaryAskingPriceRange,/^Yes/);
  assert.doesNotMatch(r.influencedVerifiedMarketRange,/^Yes/);
  assert.equal(r.sourcePriceCurrency,currency||'UNKNOWN');
  assert.match(r.priceAuthenticationReason,/currency/);
  const observations=h.buildCanonicalEvidenceObservations([r],{identity:context,context});
  assert.equal(observations[0].parsedPrice,null);
  const final=createFinalEvidenceResult({analysisId:'offline-currency-final',targetIdentity:{category:'Mechanical weighing scale',brand:'Acme'},observations,purpose:'resale'});
  assert.deepEqual(final.views.priceBearingIds,[]);
 }
});
test('explicit USD individual offer retains its amount and asking status',()=>{
 const r=normalize(offer('USD'));
 assert.equal(r.parsedPrice,89); assert.equal(r.currency,'USD'); assert.equal(r.sourcePriceCurrency,'USD');
 assert.equal(r.sourcePriceAmount,89); assert.equal(r.priceEvidenceType,'Active Asking');
 assert.doesNotMatch(r.influencedVerifiedMarketRange,/^Yes/);
});
test('foreign or conflicting page currency overrides an ambiguous visible dollar symbol',()=>{
 for(const html of [
  '<h1>Acme mechanical weighing scale</h1><meta property="product:price:amount" content="89"><meta property="product:price:currency" content="CAD"><p>Price $89.00</p>',
  offer('USD')+'<meta property="product:price:currency" content="EUR">'
 ]){
  const r=normalize(html); assert.equal(r.parsedPrice,null); assert.equal(r.priceAuthenticated,false);
 }
});
test('collection currency and price are not inherited; child currency governs both reads',async()=>{
 const parent={sourceRecordId:'parent',title:'Acme mechanical weighing scale collection',url:'https://market.example/collection/scales',pageType:'category',currency:'USD',displayedPriceText:'$999',objectMindQueryType:'EXACT_MAKER_OBJECT_TYPE',comparableLadderLevel:'EXACT'};
 const budget=h.createPhysicalAttemptBudget(2,'downstream_currency'); const calls=[];
 const records=await h.executeExactRetailPageDirectEnrichment({context,identity:context,currentRecords:[parent],directPageAttemptBudget:budget,requestAdapter:async(url,ctx,record,state)=>{
  calls.push(url); return {finalUrl:url,statusCode:200,html:state.collectionDiscovery?'<a href="/listing/one">Acme mechanical weighing scale</a>':offer('EUR'),sourceEvidenceText:state.collectionDiscovery?'':'Acme mechanical weighing scale Available'};
 }});
 const children=h.normalizeSerperCandidateRecords(records.filter(r=>r.collectionParentSourceId),context,context);
 assert.equal(calls.length,2); assert.equal(budget.physicalAttemptCount,2); assert.equal(children.length,1);
 assert.equal(children[0].collectionParentSourceId,'parent'); assert.equal(children[0].sourcePriceCurrency,'EUR',JSON.stringify({disposition:children[0].enrichmentDisposition,error:children[0].directFetchError,reason:children[0].selectionReason,htmlLength:children[0].pageHtml?.length,evidence:children[0].exactRetailPageEvidence,requests:calls}));
 assert.equal(children[0].parsedPrice,null); assert.equal(children[0].priceAuthenticated,false);
});
test('incompatible child body and ended listing do not become verified sold valuation',()=>{
 const incompatible=normalize(offer('USD','Price $89.00','Acme porcelain bowl'));
 assert.equal(incompatible.parsedPrice,null); assert.equal(incompatible.priceAuthenticated,false);
 const ended=normalize(offer('USD','Listing ended; sold'));
 assert.equal(ended.priceEvidenceType,'Ended Listing Without Confirmed Sale');
 assert.doesNotMatch(ended.influencedVerifiedMarketRange,/^Yes/);
});
test('standalone bowl and replacement accessory remain their own offered objects',()=>{
 for(const [category,expected] of [['Porcelain fruit bowl holding fruit','bowl'],['Replacement bowl for mechanical weighing scale','bowl'],['Lamp shade for table lamp','lamp shade']]){
  const own={...context,itemType:category,canonicalResearchIdentity:{objectCategory:category,identityTerms:[]}};
  const r=h.normalizeSerperCandidateRecords([{sourceRecordId:'own',title:category,url:'https://market.example/listing/one'}],own,own)[0];
  assert.equal(r.submittedItemType,expected); assert.equal(r.candidateItemType,expected); assert.equal(r.itemTypeCompatible,true);
  const state=createObjectMindState({analysisId:'offline-own',photos:[],neutralInput:{},extractedIdentity:{visualRecognition:{visualSubject:category,visualSubjectCategory:category}}});
  assert(createInitialObjectSearchPlan(state).some(q=>q.query.toLowerCase().includes(expected)));
 }
});
test('recognition features and hypothesis labels cannot reintroduce scene contents into initial or refinement queries',()=>{
 const state=createObjectMindState({analysisId:'offline-recognition',photos:[],neutralInput:{},extractedIdentity:{
  brand:'Acme',makerIdentity:'Acme printed centrally on the dial',model:'K42',dimensions:'10 kg capacity',
  canonicalEvidenceProjection:{directlySupportedFields:['brand','makerIdentity','model','dimensions']},
  visualRecognition:{visualSubject:'Mechanical weighing scale with a bowl holding fruit',visualSubjectCategory:'weighing scale',visualEvidence:['Shallow bowl holding six apples','Blue enamel finish'],visibleWords:['Acme','K42','10 kg']},
  identityUnknowns:['Exact variant']
 }});
 assert.match(state.canonicalResearchIdentity.objectCategory,/scale/i);
 const plan=createInitialObjectSearchPlan(state,{maximumQueries:12});
 assert(plan.length); assert(plan.every(q=>!/apples|holding fruit|printed|centrally|attribution/i.test(q.query)));
 assert(plan.some(q=>q.query.includes('Acme'))); assert(plan.some(q=>q.query.includes('K42')));
 assert(plan.some(q=>q.query.includes('10 kg')));
 assert(state.canonicalResearchIdentity.configurationAttributes.some(a=>a.value==='Blue enamel finish'));
 const derivedContext={...context,canonicalResearchIdentity:state.canonicalResearchIdentity};
 assert(h.collectionIdentityMatches('Acme mechanical weighing scale',derivedContext));
 assert(!h.collectionIdentityMatches('OtherCo mechanical weighing scale',derivedContext),'Actual canonical visible-fact roles must retain the maker gate');
 const refined=createRefinementSearchPlan(state,{maximumQueries:4});
 assert(refined.every(q=>!/apples|holding fruit|printed|centrally|attribution/i.test(q.query)));
});
test('focused checks attempted zero external transport',()=>assert.deepEqual(denial.attempts,[]));
