import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';import fs from 'node:fs/promises';
import {installHardNetworkDenial} from './helpers/hard-network-denial.mjs';
import {object,observation} from './fixtures/subject-observation-contract.mjs';
import {controlledBrowserModelResponse} from './helpers/build-browser-handler-response.mjs';
import {createCustomerAccountService,createMemoryCustomerAccountStore} from '../lib/customer-account/service.js';
import {createObjectMindState,createInitialObjectSearchPlan} from '../lib/object-intelligence/index.js';
import {createGenerateListingHandler,__queryIntegrityTestHooks as h} from '../api/generate-listing.js';
import {createGenerateListingHandler as oldHandler,__queryIntegrityTestHooks as old} from '../../shopping-adapter-candidate/api/generate-listing.js';
const denial=installHardNetworkDenial(),deniedFetch=globalThis.fetch,hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const identity={subjectIdentity:'security envelopes',category:'security envelopes',itemType:'security envelopes',brand:'Acme'};
const state=createObjectMindState({analysisId:'synthetic-canonical-routing',extractedIdentity:identity,photos:[],neutralInput:{}});state.searchPlan=createInitialObjectSearchPlan(state);
const plan=(hooks,mode)=>hooks.buildCanonicalObjectSerperSearchPlan({context:{...identity,retailEvidenceMode:mode,purchaseContext:mode==='current-retail-only'?'retail_store':'resale'},objectMindState:state});
test('existing canonical current-retail operation gains explicit endpoint intent without adding queries',()=>{
 const before=plan(old,'current-retail-only'),after=plan(h,'current-retail-only');assert.deepEqual(after.map(q=>q.query),before.map(q=>q.query));assert.equal(after.length,before.length);assert(after.length<=8);
 const shop=after.filter(q=>q.searchType==='shopping');assert.equal(shop.length,1);assert.equal(shop[0].candidateOrigin,'canonical_current_retail_price');assert.equal(shop[0].providerEndpoint,'serper_shopping');assert(after.filter(q=>q!==shop[0]).every(q=>q.searchType==='organic_web'));
});
test('ordinary and sold/completed canonical operations stay organic',()=>{
 const ordinary=plan(h,'collectible-resale');assert(ordinary.length>0);assert(ordinary.every(q=>q.searchType==='organic_web'));assert(ordinary.some(q=>q.candidateOrigin==='canonical_secondary_market_sold'));assert.deepEqual(ordinary.map(q=>q.query),plan(old,'collectible-resale').map(q=>q.query));
});
test('query words and display labels cannot select Shopping',async()=>{
 const dispatches=[];globalThis.fetch=async(url,options)=>{dispatches.push({url,body:JSON.parse(options.body)});return new Response('{}');};
 try{for(const record of [{query:'shopping sold completed security envelopes',searchPass:'stage_5_shopping_general',searchType:'organic_web'},{query:'security envelopes',searchPass:'ordinary-looking-label',searchType:'shopping'}])await h.requestSerperSearchWithBudget({queryRecord:{...record,validationPassed:true},requestRecord:{},attemptBudget:h.createPhysicalAttemptBudget(1),apiKey:'SYNTHETIC_ONLY',maxRetries:0,governedMaximumRetries:0});}finally{globalThis.fetch=deniedFetch;}
 assert.deepEqual(dispatches.map(d=>d.url),['https://google.serper.dev/search','https://google.serper.dev/shopping']);assert.deepEqual(dispatches[1].body,{q:'security envelopes',gl:'us',hl:'en',num:10});
});
test('only exact canonical policy provenance admits the terminal retail modifier; all subject terms remain checked',()=>{
 const scoped={subjectIdentity:'security envelopes',observationContext:{observations:[{field:'BRAND',value:'Acme',attribution:'CONFIRMED',certainty:'CLEAR',conflictsWith:[],imageIds:['image-1']}]}};
 const q='security envelopes Acme current retail price',op={query:q,searchType:'shopping',candidateOrigin:'canonical_current_retail_price',authoritativeQueryProvenanceDecision:'AUTHORIZED_CURRENT_REQUEST_IDENTITY',queryModifierProvenance:[{term:'current retail price',role:'GOVERNED_RESEARCH_MODIFIER',provenance:'REPOSITORY_SEARCH_POLICY'}]};
 assert.doesNotThrow(()=>h.assertSelectedObservationQuery(q,scoped,op));
 for(const change of [{searchType:'organic_web'},{candidateOrigin:'model_label'},{authoritativeQueryProvenanceDecision:''},{queryModifierProvenance:[{term:'current retail price',role:'GOVERNED_RESEARCH_MODIFIER',provenance:'MODEL'}]}])assert.throws(()=>h.assertSelectedObservationQuery(q,scoped,{...op,...change}),{code:'UNSUPPORTED_SUBJECT_QUERY'});
 for(const bad of ['security envelopes OtherMaker current retail price','security envelopes Acme current retail price extra','security envelopes Acme current retail price current retail price'])assert.throws(()=>h.assertSelectedObservationQuery(bad,scoped,{...op,query:bad}),{code:'UNSUPPORTED_SUBJECT_QUERY'});
});
test('preprojection capture retains nested original fields without promoting unsupported nested offers',()=>{
 // Entire payload SYNTHETIC. Historical original Shopping response is unavailable.
 const data={shopping:[{title:'Acme security envelopes',price:'$4.99',productId:'SYNTHETIC-ID',offer:{merchant:{url:'https://example.invalid/product/1'},priceCurrency:'USD',status:'asking'}}]};
 const capture=h.captureSerperResponseEvidence(data);assert.equal(capture.complete,true);assert.deepEqual(JSON.parse(capture.json),data);assert.equal(capture.originalBodyRetained,false);
 const parsed=h.parseSerperResponse(data,{query:'security envelopes'},identity,identity);assert.equal(parsed.records.length,0);assert.equal(parsed.shoppingDiscoveryLeads[0].providerFields.nativeCurrency,'UNKNOWN');assert.equal(parsed.shoppingDiscoveryLeads[0].valuationQualified,false);
});
test('capture privacy excludes credentials, headers, images and precise coordinates before persistence',()=>{
 const dummy='SYNTHETIC_MEMORY_ONLY_SECRET',data={headers:{authorization:'Bearer '+dummy},request:{apiKey:dummy},imageUrl:'https://example.invalid/photo',location:{latitude:40.123456,longitude:-70.123456},echo:dummy,pair:'40.123456,-70.123456',url:'https://example.invalid/item?token=secret',shopping:[{price:'$4.99',productId:'123',nested:{merchantUrl:'https://example.invalid/item/1'}}]};
 Object.assign(data,{geo_location:[40.123456,-70.123456],geometry:{coordinates:[40.123456,-70.123456]},image_url:'https://example.invalid/PRIVATE_IMAGE',thumbnail_url:'https://example.invalid/PRIVATE_THUMB',photo_url:'https://example.invalid/PRIVATE_PHOTO',narrative:'<a href="https://example.invalid/item?api_key=PRIVATE_QUERY">offer</a>',embedded:'offer https://PRIVATE_USER:PRIVATE_PASS@example.invalid/item'});
 const c=h.captureSerperResponseEvidence(data,[dummy]),text=JSON.stringify(c);assert.equal(c.complete,false);for(const secret of [dummy,'Bearer','40.123456','70.123456','authorization','imageUrl','apiKey','token=secret','PRIVATE_IMAGE','PRIVATE_THUMB','PRIVATE_PHOTO','PRIVATE_QUERY','PRIVATE_USER','PRIVATE_PASS'])assert(!text.includes(secret));assert.match(c.json,/merchantUrl/);assert.match(c.json,/4.99/);assert(c.omissionReasons.length>0);
 const summary=h.sanitizeProviderResponseSummary({providerResponseEvidence:c});assert.equal(summary.providerResponseEvidence.complete,false);assert(!JSON.stringify(summary).includes(dummy));
});
test('capture has bounded JSON bytes, depth, nodes, arrays and strings, all omissions explicit',()=>{
 const cases=[{value:'x'.repeat(4001)},{offers:Array.from({length:100},(_,id)=>({id}))},Object.fromEntries(Array.from({length:600},(_,i)=>['key'+i,'y'.repeat(100)])),{a:'"'.repeat(3900),b:'"'.repeat(1900)}];let deep={};let tip=deep;for(let i=0;i<12;i++)tip=tip.child={};cases.push(deep);
 for(const value of cases){const c=h.captureSerperResponseEvidence(value);assert.equal(c.complete,false);assert(c.retainedJsonBytes<=12000);assert(Buffer.byteLength(JSON.stringify(c))<16000);assert(c.omissionReasons.length>0);assert.doesNotThrow(()=>JSON.parse(c.json));}
});
test('bounded capture survives a later local parse failure and cannot refund a reservation',async()=>{
 const r={},budget=h.createPhysicalAttemptBudget(1),data={shopping:[null],original:{merchantUrl:'https://example.invalid/item/1'}};
 await h.requestSerperSearchWithBudget({queryRecord:{query:'security envelopes',searchType:'shopping'},requestRecord:r,attemptBudget:budget,apiKey:'SYNTHETIC_ONLY',maxRetries:0,governedMaximumRetries:0,requestAdapter:async()=>({json:data,statusCode:200})});
 assert.throws(()=>h.parseSerperResponse(data,{}));const summary=h.sanitizeProviderResponseSummary(h.createSerperResponseSummary({query:'security envelopes'},r,{records:[]}));assert.match(summary.providerResponseEvidence.json,/merchantUrl/);assert.equal(budget.physicalAttemptCount,1);
});
test('HTTP authentication failure retains redacted response evidence and does not retry',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;return new Response(JSON.stringify({error:'Authentication denied',nested:{apiKey:'SYNTHETIC_ONLY'}}),{status:403});};
 const r={};try{await assert.rejects(h.requestSerperSearchWithBudget({queryRecord:{query:'security envelopes',searchType:'shopping'},requestRecord:r,attemptBudget:h.createPhysicalAttemptBudget(8),apiKey:'SYNTHETIC_ONLY',maxRetries:1,governedMaximumRetries:1}));}finally{globalThis.fetch=deniedFetch;}
 assert.equal(calls,1);assert(r.providerResponseEvidence);assert(!JSON.stringify(r.providerResponseEvidence).includes('SYNTHETIC_ONLY'));
});
test('invalid provider JSON is an explicitly incomplete capture, not a complete empty body',async()=>{
 globalThis.fetch=async()=>new Response('{invalid');const r={};try{await h.requestSerperSearchWithBudget({queryRecord:{query:'security envelopes',searchType:'shopping'},requestRecord:r,attemptBudget:h.createPhysicalAttemptBudget(1),apiKey:'SYNTHETIC_ONLY',maxRetries:0,governedMaximumRetries:0});}finally{globalThis.fetch=deniedFetch;}
 assert.equal(r.providerResponseEvidence.complete,false);assert(r.providerResponseEvidence.omissionReasons.includes('INVALID_PROVIDER_JSON'));
});

test('Shopping shares the ordinary physical ceiling without refund, fallback or extra dispatch',async()=>{
 let calls=0;const budget=h.createPhysicalAttemptBudget(1),adapter=async()=>{calls++;return{json:{shopping:[]},statusCode:200};};
 await h.requestSerperSearchWithBudget({queryRecord:{query:'security envelopes',searchType:'shopping'},requestRecord:{},attemptBudget:budget,apiKey:'SYNTHETIC_ONLY',maxRetries:0,governedMaximumRetries:0,requestAdapter:adapter});
 await assert.rejects(h.requestSerperSearchWithBudget({queryRecord:{query:'security envelopes sold completed',searchType:'organic_web'},requestRecord:{},attemptBudget:budget,apiKey:'SYNTHETIC_ONLY',maxRetries:0,governedMaximumRetries:0,requestAdapter:adapter}));
 assert.equal(calls,1);assert.equal(budget.physicalAttemptCount,1);
});

test('existing retry policy retains only latest parsed response with explicit scope and ordinal',async()=>{
 let calls=0;const r={},budget=h.createPhysicalAttemptBudget(2);
 await h.requestSerperSearchWithBudget({queryRecord:{query:'security envelopes',searchType:'shopping'},requestRecord:r,attemptBudget:budget,apiKey:'SYNTHETIC_ONLY',maxRetries:1,governedMaximumRetries:1,requestAdapter:async()=>{calls++;if(calls===1)throw Object.assign(new Error('synthetic server error'),{category:'provider_http_error',statusCode:503,providerResponseEvidence:h.captureSerperResponseEvidence({attempt:'first'})});return{json:{attempt:'second'},statusCode:200};}});
 const c=h.sanitizeProviderResponseSummary(h.createSerperResponseSummary({query:'security envelopes'},r,{records:[]})).providerResponseEvidence;
 assert.equal(calls,2);assert.equal(budget.physicalAttemptCount,2);assert.equal(c.captureScope,'LATEST_PARSED_RESPONSE_ONLY');assert.equal(c.physicalAttemptOrdinal,2);assert.equal(c.priorAttemptResponsesNotRetained,true);assert.match(c.json,/second/);assert(!c.json.includes('first'));
});

const response=()=>({statusCode:200,payload:null,setHeader(){},status(code){this.statusCode=code;return this;},json(value){this.payload=value;return this;}});
const request=(body,account)=>({method:'POST',body,headers:{host:'localhost:5175',origin:'http://localhost:5175','content-type':'application/json',cookie:`ke_beta_session=${account.session.token}`,'x-csrf-token':account.session.csrfToken}});
function recognition(){return {...controlledBrowserModelResponse('item_identity','customer-model-corroboration'),subjectResolution:{observationVersion:'1',status:'AMBIGUOUS',selectedIndex:-1,candidates:[object('envelopes','security envelopes','OBJECT',[observation('maker','envelopes','BRAND','Acme'),observation('seal','envelopes','FEATURE','self seal')]),object('bowl','bowl','ACCESSORY',[])],unassignedObservations:[],relationships:[]}};}
async function handlerTrial(factory,clarify=false){
 const store=createMemoryCustomerAccountStore(),service=createCustomerAccountService({store}),account=await service.register({username:'canonical_route_test',password:'synthetic password 123'});
 const body={analysisId:'analysis-canonical-shopping-'+(clarify?'clarify':'clear'),reportType:'marketValue',notes:'',photos:[{name:'synthetic.jpg',dataUrl:`data:image/jpeg;base64,${Buffer.alloc(4096,0x5a).toString('base64')}`}],buyerIntake:{purchase_context:'retail_store',purchase_intent:'personal_use',store_name:'Walmart',item_name:clarify?'':'security envelopes'}};
 const id={analysisId:body.analysisId,requestHash:hash(JSON.stringify(body)),photoHashes:[hash(body.photos[0].dataUrl)]},registered=await service.registerAnalysisRecovery(account.session.token,id);body.recovery={...id,recoveryId:registered.recoveryId};
 const dispatches=[];let recognitionCalls=0;const modelCalls=[];const handler=factory({requireAnalysisRecovery:true,resolveAnalysisAccountService:async()=>service,getOpenAIApiKey:()=> 'SYNTHETIC_ONLY',getOpenAIModel:()=> 'gpt-4.1-mini',getSerperApiKey:()=> 'SYNTHETIC_ONLY',usesAuthenticatedExactInputTokenCounting:true,requestOpenAIInputTokenCount:async()=>({input_tokens:200}),requestOpenAIJson:async({payload})=>{const schema=payload.text.format.name;modelCalls.push(schema);if(schema==='item_identity'){recognitionCalls++;return {json:recognition(),data:{output:[]}};}return{json:controlledBrowserModelResponse(schema,'customer-model-corroboration'),data:{output:[]}};},requestBoundedRetailProductPage:async()=>{assert.fail('No merchant page read is allowed by this fixture');}});
 globalThis.fetch=async(url,options)=>{assert.equal(options.method,'POST');assert(['https://google.serper.dev/search','https://google.serper.dev/shopping'].includes(url));dispatches.push({url,body:JSON.parse(options.body)});return new Response(JSON.stringify(url.endsWith('/shopping')?{shopping:[{title:'Acme self seal security envelopes',source:'Synthetic merchant',price:'$4.99',productId:'SYNTHETIC-ID',offer:{merchant:{url:'https://example.invalid/item/1'},currency:'USD'}}],credits:2}:{organic:[]}));};
 let final;try{
  const initial=response();await handler(request(body,account),initial);
  if(clarify){assert.equal(initial.statusCode,409,JSON.stringify(initial.payload));assert.equal(dispatches.length,0);const recovered=await service.readAnalysisRecovery(account.session.token,body.analysisId,registered.recoveryId);const selected=await service.selectAnalysisSubject(account.session.token,{analysisId:body.analysisId,recoveryId:registered.recoveryId,subjectRevision:recovered.subjectRevision,subjectId:recovered.clarification.options[0].id});
   const continuation={action:'continue_subject',analysisId:body.analysisId,recoveryId:registered.recoveryId,subjectRevision:selected.subjectRevision};const both=await Promise.all([response(),response()].map(async r=>{await handler(request(continuation,account),r);return r;}));final=both.find(r=>r.statusCode!==202);assert(final);const count=dispatches.length;const replay=response();await handler(request(continuation,account),replay);assert.equal(replay.statusCode,200);assert.equal(dispatches.length,count);const fresh=createCustomerAccountService({store});await fresh.readAnalysisRecovery(account.session.token,body.analysisId,registered.recoveryId);assert.equal(dispatches.length,count);
  }else { final=initial;const count=dispatches.length;const replay=response();await handler(request(body,account),replay);assert.equal(replay.statusCode,200);assert.equal(dispatches.length,count); }
 }finally{globalThis.fetch=deniedFetch;}
 assert.equal(final.statusCode,200,JSON.stringify(final.payload));assert.equal(recognitionCalls,1);return{payload:final.payload,dispatches,modelCalls};
}
test('actual strict canonical handler unblocks one existing operation without adding plans or changing ceilings',async()=>{
 const before=await handlerTrial(oldHandler),after=await handlerTrial(createGenerateListingHandler);
 if(process.env.KE_ROUTE_DEBUG==='1')console.log(JSON.stringify({before:before.dispatches,after:after.dispatches,diagnostics:after.payload.valuation.searchDiagnostics},null,2));
 assert.equal(after.dispatches.length,before.dispatches.length+1);assert(after.dispatches.length<=8);assert.equal(before.dispatches.filter(d=>d.url.endsWith('/shopping')).length,0);assert.equal(after.dispatches.filter(d=>d.url.endsWith('/shopping')).length,1);assert.deepEqual(after.dispatches.filter(d=>!d.url.endsWith('/shopping')).map(d=>d.body.q),before.dispatches.map(d=>d.body.q));
 const diagnostic=after.payload.valuation.searchDiagnostics;assert.equal(diagnostic.physicalProviderAttemptCount,after.dispatches.length);const text=JSON.stringify(diagnostic);assert.match(text,/SYNTHETIC-ID/);assert.match(text,/merchant/);assert.match(text,/providerResponseEvidence/);assert.doesNotMatch(text,/SYNTHETIC_ONLY/);
 assert.equal(diagnostic.modelExecutionBudget.serperAttemptCount,after.dispatches.length);assert.equal(diagnostic.directPageAttemptBudget,2);assert.deepEqual(h.retailSerperBudgetAllocation,old.retailSerperBudgetAllocation);
 assert.equal(diagnostic.providerRequestRecords.length,before.payload.valuation.searchDiagnostics.providerRequestRecords.length);
 const summaries=diagnostic.providerResponseSummaries.filter(s=>s.searchType==='shopping');assert.equal(summaries.length,1);assert.equal(summaries[0].shoppingDiscoveryLeads.length,1);assert.equal(summaries[0].shoppingDiscoveryLeads[0].valuationQualified,false);assert.equal(summaries[0].shoppingDiscoveryLeads[0].providerFields.nativeCurrency,'UNKNOWN');
 assert.equal(diagnostic.compatiblePricedCandidateCount||0,0);assert.equal(diagnostic.physicalDirectPageAttemptCount||0,0);
 assert(diagnostic.comparableFunnel.candidateAudit.some(row=>row.disposition==='DISCOVERY_ONLY'&&row.productId==='SYNTHETIC-ID'&&!Number.isFinite(row.price)));assert(diagnostic.comparableFunnel.providerResponseAudit.length>0);
 if(process.env.KE_CANONICAL_SHOPPING_EVIDENCE_FILE)await fs.writeFile(process.env.KE_CANONICAL_SHOPPING_EVIDENCE_FILE,JSON.stringify({inputClass:'SYNTHETIC_OFFLINE_CANONICAL_HANDLER_NOT_LIVE',before:{dispatches:before.dispatches,plannedProviderRequests:before.payload.valuation.searchDiagnostics.providerRequestRecords.length},after:{dispatches:after.dispatches,plannedProviderRequests:diagnostic.providerRequestRecords.length,physicalProviderAttemptCount:diagnostic.physicalProviderAttemptCount,serperReservations:diagnostic.modelExecutionBudget.serperAttemptCount,directPageAttemptBudget:diagnostic.directPageAttemptBudget,physicalDirectPageAttemptCount:diagnostic.physicalDirectPageAttemptCount,discoveryLeads:summaries[0].shoppingDiscoveryLeads,responseEvidence:summaries[0].providerResponseEvidence,candidateAudit:diagnostic.comparableFunnel.candidateAudit,providerResponseAudit:diagnostic.comparableFunnel.providerResponseAudit,compatiblePricedCandidateCount:diagnostic.compatiblePricedCandidateCount},noDuplicateInitialSubmission:true,actualProviderCalls:0,externalTransports:denial.attempts},null,2)+'\n',{flag:'wx'});
});
test('canonical clarification continuation/recovery dispatches each existing operation once with cumulative budgets',async()=>{
 const result=await handlerTrial(createGenerateListingHandler,true);assert.equal(result.dispatches.filter(d=>d.url.endsWith('/shopping')).length,1);assert(result.dispatches.length<=8);assert.equal(new Set(result.dispatches.map(d=>d.url+'|'+d.body.q)).size,result.dispatches.length);
 const diagnostics=result.payload.valuation.searchDiagnostics;assert.equal(diagnostics.physicalProviderAttemptCount,result.dispatches.length);assert.equal(diagnostics.modelExecutionBudget.modelGenerationRequestCount,result.modelCalls.length);
});
test('retained actual ten-record projection reaches audit as discovery, with zero valuation prices',async()=>{
 const raw=JSON.parse(await fs.readFile(new URL('./fixtures/retained-shopping-offer-fields.json',import.meta.url)));
 const parsed=h.parseSerperResponse({shopping:raw.offers},{query:'mechanical weighing scale Alexanderwerk',searchType:'shopping'},{subjectIdentity:'mechanical kitchen scale',brand:'Alexanderwerk'},{itemType:'mechanical kitchen scale',subjectIdentity:'mechanical kitchen scale',brand:'Alexanderwerk'});
 const summary=h.sanitizeProviderResponseSummary(h.createSerperResponseSummary({query:'mechanical weighing scale Alexanderwerk',searchType:'shopping'},{},parsed));
 const audit=h.buildComparableFunnelDiagnostics({providerSourceRecords:[],sourceAcquisitionRecords:[],providerResponseSummaries:[summary]});
 assert.equal(audit.candidateAudit.length,10);assert(audit.candidateAudit.every(row=>row.disposition==='DISCOVERY_ONLY'&&row.price===null&&row.url===''&&row.valuationQualified===false));assert.equal(audit.stageCounts.shoppingDiscoveryLeadRetention,10);
});
test('all external transports remained denied',()=>assert.deepEqual(denial.attempts,[]));
