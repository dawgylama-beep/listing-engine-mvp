import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import {installHardNetworkDenial} from './helpers/hard-network-denial.mjs';
const denial=installHardNetworkDenial();
// Same tests run against the immutable predecessor to demonstrate the defects.
const base=process.env.KE_ACQUISITION_BASELINE==='1'?'../../observation-contract-candidate/':'../';
const {__queryIntegrityTestHooks:h}=await import(base+'api/generate-listing.js');
const {observationQuerySupported}=await import(base+'lib/object-intelligence/subject-observations.js');
// Captured query/title/URL fields from the completed report, NOT raw Serper JSON.
// Minimal observation context is reconstructed from displayed recognition; no new
// model claim, unreadable capacity, price, snippet or hidden runtime state is invented.
const identity={subjectIdentity:'mechanical weighing scale',observationContext:{observations:[
 {field:'BRAND',value:'Alexanderwerk',attribution:'CONFIRMED',certainty:'CLEAR',conflictsWith:[],imageIds:['image-1']},
 {field:'TEXT',value:'mechanical scale',attribution:'CONFIRMED',certainty:'CLEAR',conflictsWith:[],imageIds:['image-1']}
]}};
const query='mechanical weighing scale "Alexanderwerk mechanical scale" (site:facebook.com OR site:craigslist.org OR site:offerup.com OR site:ebay.com)';
const url='https://www.catawiki.com/en/l/107255160?IndustrialFurniture+ENG=';
const context={itemType:'mechanical weighing scale',subjectIdentity:'mechanical weighing scale',brand:'Alexanderwerk',retailEvidenceMode:'collectible-resale',canonicalResearchIdentity:{objectCategory:'mechanical weighing scale',identityTerms:[]}};
const captured={sourceRecordId:'provider-source-cac0f8016fc77f63',title:'Scale - Max. 10 kg - Cast iron - Alexanderwerk',url,canonicalUrl:url,query:'mechanical weighing scale "Alexanderwerk mechanical scale"',searchPass:'open web exact'};
// Runtime eligibility fields were not exported. This explicit reconstruction uses
// the report's final Compatible disposition to isolate the independently blocked
// URL/domain gates; it does not prove all historical upstream flags were eligible.
const compatibleProjection=record=>({...record,itemTypeCompatible:true,identityMatchStrength:'Partial'});
const observations=[];
test('captured composed marketplace query accepts Boolean syntax but no foreign identity terms',()=>{
 const accepted=observationQuerySupported(query,identity);observations.push({case:'captured-marketplace-query',accepted});assert.equal(accepted,true);
 for(const suffix of [' apples',' porcelain bowl',' OtherMaker',' "OR"',' OR OtherMaker'])assert.equal(observationQuerySupported(query+suffix,identity),false,suffix);
 const accessory={subjectIdentity:'weighing bowl',observationContext:{observations:[]}};
 assert.equal(observationQuerySupported('weighing bowl (site:ebay.com OR site:etsy.com)',accessory),true);
 assert.equal(observationQuerySupported('weighing bowl Alexanderwerk (site:ebay.com OR site:etsy.com)',accessory),false);
});
test('unsupported subject is rejected before metering and adapter dispatch',async()=>{
 const ledger=h.createModelExecutionBudget(),budget=h.createPhysicalAttemptBudget(6),record={};let dispatches=0;
 try{await h.requestSerperSearchWithBudget({identity,queryRecord:{query:'mechanical weighing scale apples'},requestRecord:record,attemptBudget:budget,providerLedger:ledger,governedMaximumRetries:1,requestAdapter:async()=>{dispatches++;h.assertSelectedObservationQuery('mechanical weighing scale apples',identity);}});}catch(e){assert.equal(e.code,'UNSUPPORTED_SUBJECT_QUERY');}
 observations.push({case:'unsupported-preflight',adapterInvocations:dispatches,reservations:ledger.serperAttemptCount});assert.equal(dispatches,0);assert.equal(ledger.serperAttemptCount,0);assert.equal(budget.physicalAttemptCount,0);
});
test('deterministic adapter preflight failure is never retried',async()=>{
 const ledger=h.createModelExecutionBudget(),record={};let calls=0;
 await assert.rejects(h.requestSerperSearchWithBudget({queryRecord:{query:'mechanical scale'},requestRecord:record,attemptBudget:h.createPhysicalAttemptBudget(6),providerLedger:ledger,governedMaximumRetries:1,requestAdapter:async()=>{calls++;throw Object.assign(Error('local preflight'),{code:'UNSUPPORTED_SUBJECT_QUERY'});}}),{code:'UNSUPPORTED_SUBJECT_QUERY'});
 observations.push({case:'terminal-preflight-retry',calls,reservations:ledger.serperAttemptCount});assert.equal(calls,1);assert.equal(ledger.serperAttemptCount,1);
});
test('captured normalized Catawiki reference reaches bounded selection without inventing price',async()=>{
 const records=[compatibleProjection(captured)],budget=h.createPhysicalAttemptBudget(2,'direct_page_enrichment'),requests=[];let reads=0;
 assert.equal(records[0].itemTypeCompatible,true);
 const result=await h.executeExactRetailPageDirectEnrichment({context,identity:context,currentRecords:records,directPageAttemptBudget:budget,providerRequestRecords:requests,requestAdapter:async requested=>{reads++;assert.equal(requested,url);return {finalUrl:requested,statusCode:200,html:'<h1>Scale - Max. 10 kg - Cast iron - Alexanderwerk</h1>',sourceEvidenceText:captured.title};}});
 observations.push({case:'captured-catawiki-unpriced',reads,disposition:result[0].enrichmentDisposition});assert.equal(reads,1);assert.equal(budget.physicalAttemptCount,1);assert.notEqual(result[0].priceAuthenticated,true);assert(!Number.isFinite(result[0].parsedPrice));
});
test('auction URL eligibility retains compatibility, public-host and shared read ceiling',async()=>{
 const input=[captured,{...captured,sourceRecordId:'second',url:'https://www.catawiki.com/nl/l/107255161-other-scale',canonicalUrl:'https://www.catawiki.com/nl/l/107255161-other-scale'},{...captured,sourceRecordId:'third',url:'https://www.catawiki.com/en/l/107255162',canonicalUrl:'https://www.catawiki.com/en/l/107255162'}];
 const records=input.map(compatibleProjection),budget=h.createPhysicalAttemptBudget(2);let reads=0;
 await h.executeExactRetailPageDirectEnrichment({context,currentRecords:records,directPageAttemptBudget:budget,requestAdapter:async requested=>{reads++;return {finalUrl:requested,statusCode:200,html:'<h1>Alexanderwerk mechanical weighing scale</h1>',sourceEvidenceText:'Alexanderwerk mechanical weighing scale'};}});
 assert.equal(reads,2);assert.equal(budget.physicalAttemptCount,2);
 for(const change of [{title:'Replacement weighing pan only for Alexanderwerk mechanical scale'},{title:'Alexanderwerk porcelain bowl'},{url:'https://www.catawiki.com/en/search?q=scale',canonicalUrl:'https://www.catawiki.com/en/search?q=scale'},{url:'https://catawiki.com.evil.example/en/l/107255160',canonicalUrl:'https://catawiki.com.evil.example/en/l/107255160'},{url:'http://127.0.0.1/en/l/107255160',canonicalUrl:'http://127.0.0.1/en/l/107255160'}]){
  const normalized=h.normalizeSerperCandidateRecords([{...captured,...change}],context,context);let calls=0;
  await h.executeExactRetailPageDirectEnrichment({context,currentRecords:normalized,requestAdapter:async()=>{calls++;throw Error('MUST_NOT_FETCH');}});assert.equal(calls,0,JSON.stringify(change));
 }
});
test('valid composed query dispatches once and charges one conservative reservation',async()=>{
 const ledger=h.createModelExecutionBudget(),record={};let calls=0;
 await h.requestSerperSearchWithBudget({identity,queryRecord:{query},requestRecord:record,attemptBudget:h.createPhysicalAttemptBudget(6),providerLedger:ledger,governedMaximumRetries:1,requestAdapter:async args=>{h.assertSelectedObservationQuery(args.query,identity);calls++;return {json:{organic:[]},statusCode:200};}});
 assert.equal(calls,1);assert.equal(ledger.serperAttemptCount,1);assert.equal(record.physicalRetryAttemptCount,0);
});
test('external transports stay denied and comparison evidence is labeled',async()=>{
 assert.deepEqual(denial.attempts,[]);
 if(process.env.KE_ACQUISITION_EVIDENCE)await fs.writeFile(process.env.KE_ACQUISITION_EVIDENCE,JSON.stringify({source:base,inputClass:'CAPTURED_REPORT_FIELDS_PLUS_EXPLICIT_SYNTHETIC_CONTEXT_AND_HTML_NOT_RAW_PROVIDER_REPLAY',observations,externalTransportAttempts:denial.attempts},null,2));
});
