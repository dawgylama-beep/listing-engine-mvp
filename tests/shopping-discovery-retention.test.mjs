import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
import {installHardNetworkDenial} from './helpers/hard-network-denial.mjs';
const denial=installHardNetworkDenial();
const {__queryIntegrityTestHooks:h}=await import('../api/generate-listing.js');
const {__queryIntegrityTestHooks:before}=await import('../../page-acquisition-reviewed-candidate/api/generate-listing.js');
const retained=JSON.parse(await fs.readFile(new URL('./fixtures/retained-shopping-offer-fields.json',import.meta.url)));
// Actual retained allowlisted fields, NOT a reconstructed full original response.
const data={shopping:retained.offers.map(({providerOrdinal,...item})=>item),credits:retained.credits};
const query={query:'mechanical weighing scale "Alexanderwerk"',searchType:'shopping',validationPassed:true};
// Owner's current kitchen-scale scope is explicit; it is not a recovered live observation.
const kitchen={subjectIdentity:'mechanical kitchen scale',itemType:'mechanical kitchen scale',brand:'Alexanderwerk',canonicalResearchIdentity:{objectCategory:'mechanical kitchen scale',identityTerms:[]}};
const context={...kitchen,retailEvidenceMode:'collectible-resale'};
const parse=()=>h.parseSerperResponse(data,query,kitchen,context);

test('actual projection demonstrates predecessor loss: nine dropped, Google reference kept',()=>{
 const old=before.parseSerperResponse(data,query);assert.equal(old.shoppingResultCount,10);assert.equal(old.records.length,1);assert.equal(old.records[0].currency,'$');assert.match(old.records[0].url,/google\.com/);
 const result=parse();assert.equal(result.records.length,0);assert.equal(result.shoppingDiscoveryLeads.length,10);
});
test('all ten actual identities, IDs, sources and verbatim display prices survive without fabricated URLs',()=>{
 const leads=parse().shoppingDiscoveryLeads;assert.equal(new Set(leads.map(l=>l.sourceRecordId)).size,10);
 for(let i=0;i<10;i++){const l=leads[i],raw=data.shopping[i];assert.equal(l.title,raw.title);assert.equal(l.productId,raw.productId);assert.equal(l.merchantLabel,raw.source);assert.equal(l.providerFields.priceText,raw.price);assert.deepEqual(l.providerFields.explicitCurrencyFields,{});assert.equal(l.providerFields.nativeCurrency,'UNKNOWN');assert.equal(l.url,'');assert.equal(l.valuationQualified,false);}
 assert.deepEqual(parse().shoppingDiscoveryLeads.map(l=>l.sourceRecordId),leads.map(l=>l.sourceRecordId));
});
test('Google reference remains a provider reference, never a merchant listing',()=>{
 const l=parse().shoppingDiscoveryLeads[8];assert.match(l.providerReferenceUrl,/google\.com/);assert.equal(l.discoveryReason,'SEARCH_PROVIDER_REFERENCE');assert.equal(l.verifiedMerchantListing,false);assert.equal(h.classifySpecificOfferPage(l),'category_search_page');
});
test('actual doctor-office, medical and personal scale titles conflict with selected kitchen use',()=>{
 const leads=parse().shoppingDiscoveryLeads;for(const i of [2,5,8]){assert.equal(leads[i].itemTypeCompatible,false);assert.equal(leads[i].itemTypeCompatibilityStatus,'item_type_use_conflict');}
 for(const i of [1,3,4,9])assert.equal(leads[i].itemTypeCompatible,true);
});
test('maker mentions remain title support, generic maker missing remains unconfirmed',()=>{
 const leads=parse().shoppingDiscoveryLeads;for(const i of [0,1,2,3,4,5,7,9])assert.equal(leads[i].makerSupport,'TITLE_MENTIONS_SELECTED_MAKER');assert.equal(leads[6].makerSupport,'MAKER_UNCONFIRMED');
 const synthetic=h.parseSerperResponse({shopping:[{title:'Other brand kitchen scale',brand:'OtherMaker',price:'USD 10'}]},query,kitchen,context);assert.equal(synthetic.shoppingDiscoveryLeads[0].makerSupport,'EXPLICIT_MAKER_CONFLICT');
});
test('generic original subject is not silently changed into kitchen context; personal scale subjects remain valid',()=>{
 const generic={itemType:'mechanical weighing scale',subjectIdentity:'mechanical weighing scale'};
 assert.notEqual(h.evaluateComparableItemTypeCompatibility({title:'Medical weighing scale'},generic,generic).status,'item_type_use_conflict');
 const body={itemType:'personal weighing scale',subjectIdentity:'personal weighing scale'};assert.equal(h.evaluateComparableItemTypeCompatibility({title:'Medical weighing scale'},body,body).itemTypeCompatible,true);
});
test('synthetic unrelated objects and standalone accessories retain existing type rules',()=>{
 const bowl={itemType:'bowl',subjectIdentity:'bowl',subjectSelection:{kind:'ACCESSORY'}};assert.equal(h.evaluateComparableItemTypeCompatibility({title:'Stainless steel bowl'},bowl,bowl).itemTypeCompatible,true);
 assert.equal(h.evaluateComparableItemTypeCompatibility({title:'Medical weighing scale'},bowl,bowl).itemTypeCompatible,false);
});
test('diagnostic summary and its customer sanitizer preserve leads separately from comparable counts',()=>{
 const parsed=parse(),request=h.createSerperRequestRecord(query),summary=h.createSerperResponseSummary(query,request,parsed),safe=h.sanitizeProviderResponseSummary(summary);
 assert.equal(safe.shoppingResultCount,10);assert.equal(safe.parsedCandidateCount,0);assert.equal(safe.providerSourceCount,0);assert.equal(safe.shoppingDiscoveryLeadCount,10);assert.equal(safe.shoppingDiscoveryLeads.length,10);assert.equal(h.normalizeSerperCandidateRecords(parsed.records,kitchen,context).length,0);
});
test('discovery leads cannot authenticate injected prices, ISO currency or sold status',()=>{
 for(const lead of parse().shoppingDiscoveryLeads){const altered={...lead,url:'https://www.ebay.com/itm/123456789012',parsedPrice:123,displayedPriceText:'USD 123',currency:'USD',priceProvenance:'SERPER_SHOPPING_STRUCTURED_PRICE',title:lead.title+' sold for USD 123',transactionVerified:true};assert.equal(h.authenticateComparablePriceEvidence(altered,{itemTypeCompatible:true},context).authenticated,false);assert.equal(h.classifySerperPriceEvidence(altered),'Reference Without Price');assert.equal(h.classifySpecificOfferPage(altered),'category_search_page');const safe=h.sanitizeShoppingDiscoveryLead(altered);assert.equal(safe.url,'');assert.equal(safe.parsedPrice,null);assert.equal(safe.currency,'');}
});
test('synthetic linked Shopping keeps explicit fields without authenticating display/native inference',()=>{
 const input={shopping:[{title:'Alexanderwerk mechanical kitchen scale',link:'https://www.ebay.com/itm/123456789012',price:'$123.00',currency:'USD',availability:'sold',productId:'SYNTHETIC'}]};
 const r=h.parseSerperResponse(input,query,kitchen,context).records[0];assert.equal(r.providerFields.priceText,'$123.00');assert.deepEqual(r.providerFields.explicitCurrencyFields,{currency:'USD'});assert.equal(r.currency,'');assert.equal(r.providerFields.nativeCurrency,'UNKNOWN');assert.equal(h.authenticateComparablePriceEvidence(r,{itemTypeCompatible:true},context).authenticated,false);
 const [n]=h.normalizeSerperCandidateRecords([r],kitchen,context);assert.equal(n.priceAuthenticated,false);assert.equal(n.parsedPrice,null);assert.doesNotMatch(n.includedInPreliminaryAskingPriceRange,/^Yes/);assert.doesNotMatch(n.influencedVerifiedMarketRange,/^Yes/);
});
test('synthetic direct listing evidence can qualify while foreign/conflicting evidence stays excluded',()=>{
 const r=h.parseSerperResponse({shopping:[{title:'Alexanderwerk mechanical kitchen scale',link:'https://www.ebay.com/itm/123456789012',price:'$123'}]},query,kitchen,context).records[0];
 const direct={...r,directProductPage:true,sourceEvidenceText:'Buy it now USD123',exactRetailPageEvidence:{priceCurrency:'USD',priceSource:'DIRECT_PRODUCT_PAGE_STRUCTURED_PRICE'}};assert.equal(h.authenticateComparablePriceEvidence(direct,{itemTypeCompatible:true},context).authenticated,true);
 assert.equal(h.authenticateComparablePriceEvidence({...direct,exactRetailPageEvidence:{...direct.exactRetailPageEvidence,priceCurrency:'EUR'}},{itemTypeCompatible:true},context).authenticated,false);
 assert.equal(h.authenticateComparablePriceEvidence({...direct,exactRetailPageEvidence:{...direct.exactRetailPageEvidence,priceRejectionReason:'Conflicting prices'}},{itemTypeCompatible:true},context).authenticated,false);
});
test('unretained nesting is not reconstructed; synthetic nested fields confer no merchant/native proof',()=>{
 const r=h.parseSerperResponse({shopping:[{title:'Synthetic kitchen scale',product:{link:'https://example.invalid/product/x'},offer:{price:10,currency:'USD',sold:true}}]},query,kitchen,context).shoppingDiscoveryLeads[0];assert.equal(r.url,'');assert.equal(r.providerFields.priceText,'');assert.deepEqual(r.providerFields.explicitCurrencyFields,{});assert.equal(r.valuationQualified,false);
});
test('actual projection survives the acquisition handler under stub adapter and one local reservation',async()=>{
 let calls=0;const budget=h.createPhysicalAttemptBudget(1,'provider_search');
 const result=await h.executeSerperComparableSearch({serperApiKey:'SYNTHETIC_NOT_A_REAL_CREDENTIAL',platform:'ebay',notes:'',identity:kitchen,sourceRoute:['eBay'],searchQueries:['mechanical kitchen scale Alexanderwerk'],buyerIntake:h.normalizeBuyerIntake({}),providerAttemptBudget:budget,requestAdapter:async()=>{calls++;return{json:data,statusCode:200,elapsedMs:1};}});
 assert.equal(calls,1);assert.equal(budget.physicalAttemptCount,1);
 const serialized=JSON.stringify(result);assert.match(serialized,/shoppingDiscoveryLeads/);assert.match(serialized,/5912974211226491951/);assert.match(serialized,/\$179\.00/);
 assert.equal(result.searchDiagnostics?.compatiblePricedCandidateCount||0,0);
});
test('no external transport was attempted',()=>assert.deepEqual(denial.attempts,[]));
