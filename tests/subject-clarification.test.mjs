import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {installHardNetworkDenial} from './helpers/hard-network-denial.mjs';
import {resolveEvaluationSubject,projectEvaluationSubject,scopeEvaluationSubjectInput} from '../lib/object-intelligence/subject-selection.js';
import {createObjectMindState,createInitialObjectSearchPlan,createPurposeNeutralObjectInput} from '../lib/object-intelligence/index.js';
import {createCustomerAccountService,createMemoryCustomerAccountStore,createFileCustomerAccountStore} from '../lib/customer-account/service.js';
import {createGenerateListingHandler,__queryIntegrityTestHooks as h} from '../api/generate-listing.js';
import {controlledBrowserModelResponse} from './helpers/build-browser-handler-response.mjs';
const guard=installHardNetworkDenial();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
export const recognition={...controlledBrowserModelResponse('item_identity','customer-model-corroboration'),subjectResolution:{status:'AMBIGUOUS',selectedIndex:-1,candidates:[
 {label:'desk lamp',kind:'OBJECT',description:'A metal desk lamp',visibleMarks:['Acme','L42'],brand:'Acme',model:'L42',capacity:'',features:['adjustable metal arm']},
 {label:'lamp shade',kind:'ACCESSORY',description:'A standalone shade beside the lamp',visibleMarks:[],brand:'',model:'',capacity:'',features:['pleated fabric shade']},
 {label:'decorative vase',kind:'OBJECT',description:'A vase next to the lamp',visibleMarks:['Beta'],brand:'Beta',model:'',capacity:'',features:['blue glazed vase']}
]}};
function capture(){return {statusCode:200,payload:null,headers:{},status(code){this.statusCode=code;return this;},setHeader(k,v){this.headers[k]=v;},json(value){this.payload=value;return this;}};}
const request=(body,account)=>({method:'POST',body,headers:{host:'localhost:5175',origin:'http://localhost:5175','content-type':'application/json',cookie:`ke_beta_session=${account.session.token}`,'x-csrf-token':account.session.csrfToken}});

test('clear description selects the named subject without a question and isolates its markings',()=>{
 const resolved=resolveEvaluationSubject(recognition,{item_name:'lamp shade'});assert.equal(resolved.status,'CLEAR');assert.equal(resolved.selected.kind,'ACCESSORY');
 const identity=projectEvaluationSubject(recognition,resolved);assert.equal(identity.category,'lamp shade');assert.equal(identity.brand,'Unknown');assert.deepEqual(identity.visibleText,[]);
 const state=createObjectMindState({analysisId:'subject-local',photos:[],neutralInput:{},extractedIdentity:identity});
 assert(createInitialObjectSearchPlan(state).every(q=>!/Acme|L42|Beta|vase/i.test(q.query)));
 assert.equal(h.normalizeSerperCandidateRecords([{sourceRecordId:'own',title:'Pleated fabric lamp shade',url:'https://www.ebay.com/itm/one'}],identity,{itemType:'lamp shade',canonicalResearchIdentity:state.canonicalResearchIdentity})[0].itemTypeCompatible,true);
 const context={itemType:'lamp shade',canonicalResearchIdentity:state.canonicalResearchIdentity,subjectSelection:identity.subjectSelection,retailEvidenceMode:'secondary_market'};
 const records=h.normalizeSerperCandidateRecords([
  {sourceRecordId:'shade',title:'Replacement lamp shade for table lamp',url:'https://www.ebay.com/itm/shade',snippet:'Current price $19.00',displayedPriceText:'$19.00'},
  {sourceRecordId:'lamp',title:'Table lamp with lamp shade',url:'https://www.ebay.com/itm/lamp',snippet:'Current price $89.00',displayedPriceText:'$89.00'}
 ],identity,context);
 assert.equal(records[0].itemTypeCompatible,true);assert.equal(records[0].parsedPrice,19);
 assert.equal(records[1].itemTypeCompatible,false);assert.equal(records[1].parsedPrice,null);
});
test('ambiguous photo names plausible subjects in one concise question; explicit selection overrides the main object',()=>{
 const resolved=resolveEvaluationSubject(recognition,{});assert.equal(resolved.status,'AMBIGUOUS');assert.equal(resolved.question,'Which item would you like evaluated: desk lamp, lamp shade, or decorative vase?');
 const selected=resolveEvaluationSubject(recognition,{subject_selection:resolved.candidates[2].id});const identity=projectEvaluationSubject(recognition,selected);
 assert.equal(identity.category,'decorative vase');assert.equal(identity.brand,'Beta');assert.equal(identity.model,'Unknown');
});
test('selected retail subject retains its own barcode and package clues without inheriting another object identifier',()=>{
 const boxed={...recognition,subjectResolution:{status:'CLEAR',selectedIndex:0,candidates:[{label:'boxed envelopes',kind:'OBJECT',description:'Retail envelope box',visibleMarks:['041226087161','Acme','100 count'],brand:'Acme',manufacturer:'Acme',model:'',capacity:'',features:['boxed envelopes'],upcBarcode:'041226087161',sku:'',packageQuantity:'100 count',dimensions:'',material:'paper'}]}};
 const scoped=projectEvaluationSubject(boxed,resolveEvaluationSubject(boxed,{}));
 assert.equal(scoped.upcBarcode,'041226087161');assert.equal(scoped.packageQuantity,'100 count');assert.equal(scoped.model,'Unknown');
 const finalized=h.finalizeIdentityForResearch(scoped,h.normalizeBuyerIntake({purchase_context:'retail_store',purchase_intent:'personal_use'}));
 assert.equal(finalized.upcBarcode,'041226087161');
});

test('actual handler pauses before comparable dispatch, resumes one claim without recognition replay, and preserves cumulative model budget',async()=>{
 const store=createMemoryCustomerAccountStore(),service=createCustomerAccountService({store});const account=await service.register({username:'subject_test',password:'synthetic password 123'});
 const body={analysisId:'analysis-subject-flow-001',reportType:'marketValue',notes:'Which item is worth keeping? Acme L42 host lamp',photos:[{name:'synthetic.jpg',dataUrl:`data:image/jpeg;base64,${Buffer.alloc(4096,0x5a).toString('base64')}`}],buyerIntake:{purchase_context:'private_seller',purchase_intent:'resale',known_brand:'Acme',known_model:'L42'}};
 const identity={analysisId:body.analysisId,requestHash:hash(JSON.stringify(body)),photoHashes:[hash(body.photos[0].dataUrl)]};const registration=await service.registerAnalysisRecovery(account.session.token,identity);body.recovery={...identity,recoveryId:registration.recoveryId};
 let recognitionCalls=0,searchCalls=0;const schemas=[];
 const handler=createGenerateListingHandler({requireAnalysisRecovery:true,resolveAnalysisAccountService:async()=>service,getOpenAIApiKey:()=> 'synthetic-placeholder',getOpenAIModel:()=> 'gpt-4.1-mini',getSerperApiKey:()=> 'synthetic-placeholder',usesAuthenticatedExactInputTokenCounting:true,requestOpenAIInputTokenCount:async()=>({input_tokens:200}),
 requestOpenAIJson:async({payload})=>{const schema=payload.text.format.name;schemas.push(schema);if(schema==='item_identity'){recognitionCalls++;return {json:recognition,data:{output:[]}};}assert(!/Acme|L42/.test(JSON.stringify(payload.input)), 'Host clues must not enter downstream judgment prompts');return {json:controlledBrowserModelResponse(schema,'customer-model-corroboration'),data:{output:[]}};},
 requestSerperSearch:async()=>{searchCalls++;return {json:{organic:[]},statusCode:200,elapsedMs:1};},requestBoundedRetailProductPage:async()=>{throw new Error('No direct candidate exists.');}});
 const paused=capture();await handler(request(body,account),paused);assert.equal(paused.statusCode,409,JSON.stringify(paused.payload));assert.equal(paused.payload.state,'AWAITING_SUBJECT');assert.equal(recognitionCalls,1);assert.equal(searchCalls,0);
 assert(!JSON.stringify((await store.read()).analysisRecoveries).includes('data:image/'));
 assert.equal((await store.read()).analysisRecoveries[account.account.id][body.analysisId].state,'FAILED_TERMINAL','Existing readers retain a terminal-safe persisted state');
 const duplicatePause=capture();await handler(request(body,account),duplicatePause);assert.equal(duplicatePause.statusCode,409);assert.equal(recognitionCalls,1);assert.equal(searchCalls,0);
 const cached=JSON.parse((await store.read()).analysisRecoveries[account.account.id][body.analysisId].subjectContinuationJson);
 assert.equal(cached.imageRecords.length,1);assert.match(cached.imageRecords[0].contentSha256,/^[a-f0-9]{64}$/);assert(cached.providerRecords.length>0);
 const refreshed=createCustomerAccountService({store});const recovered=await refreshed.readAnalysisRecovery(account.session.token,body.analysisId,registration.recoveryId);
 let selected=await refreshed.selectAnalysisSubject(account.session.token,{analysisId:body.analysisId,recoveryId:registration.recoveryId,subjectRevision:recovered.subjectRevision,subjectId:recovered.clarification.options[0].id});
 selected=await refreshed.selectAnalysisSubject(account.session.token,{analysisId:body.analysisId,recoveryId:registration.recoveryId,subjectRevision:selected.subjectRevision,subjectId:recovered.clarification.options[1].id});
 const continuation={action:'continue_subject',analysisId:body.analysisId,recoveryId:registration.recoveryId,subjectRevision:selected.subjectRevision};
 const outcomes=await Promise.all([capture(),capture()].map(async res=>{await handler(request(continuation,account),res);return res;}));
 const finished=outcomes.find(res=>res.statusCode!==202);assert.equal(finished.statusCode,200,JSON.stringify(finished.payload));
 assert.equal(recognitionCalls,1);assert(searchCalls>0);assert.equal(finished.payload.valuation.subjectSelection.label,'lamp shade');
 assert.equal(finished.payload.valuation.searchDiagnostics.modelExecutionBudget.modelGenerationRequestCount,schemas.length);
 const searchesAfter=searchCalls;const replay=capture();await handler(request(continuation,account),replay);assert.equal(replay.statusCode,200);assert.equal(searchCalls,searchesAfter);assert.equal(recognitionCalls,1);
 const terminal=await refreshed.readAnalysisRecovery(account.session.token,body.analysisId,registration.recoveryId);assert.equal(terminal.response.valuation.subjectSelection.label,'lamp shade');assert.deepEqual((await service.listHistory(account.session.token)).listings,[]);
 assert.equal((await store.read()).analysisRecoveries[account.account.id][body.analysisId].subjectContinuationJson,undefined);
});
test('fresh file-store reconstruction retains a correctable selection and denies stale, cross-account, expired or duplicate continuation',async()=>{
 const testRoot=path.dirname(fileURLToPath(import.meta.url));const dir=await fs.mkdtemp(path.join(testRoot,'ke-subject-local-'));
 try{
  let clock=Date.now();const storePath=path.join(dir,'account.json');const first=createCustomerAccountService({store:createFileCustomerAccountStore(storePath),now:()=>clock});
  const account=await first.register({username:'subject_durable',password:'synthetic password 123'});const other=await first.register({username:'other_subject',password:'synthetic password 456'});
  const id={analysisId:'analysis-subject-durable',requestHash:hash('request'),photoHashes:[hash('photo')]};const registered=await first.registerAnalysisRecovery(account.session.token,id);await first.claimAnalysisRecovery(account.session.token,{...id,recoveryId:registered.recoveryId});
  const resolved=resolveEvaluationSubject(recognition,{});await first.pauseSubjectClarification(account.session.token,{analysisId:id.analysisId,recoveryId:registered.recoveryId,clarification:{question:resolved.question,options:resolved.candidates.map(({id,label,kind})=>({id,label,kind}))},continuation:{recognizedIdentity:recognition,input:{},modelBudget:{}}});
  const selected=await first.selectAnalysisSubject(account.session.token,{analysisId:id.analysisId,recoveryId:registered.recoveryId,subjectRevision:1,subjectId:resolved.candidates[1].id});
  const second=createCustomerAccountService({store:createFileCustomerAccountStore(storePath),now:()=>clock});const recovered=await second.readAnalysisRecovery(account.session.token,id.analysisId,registered.recoveryId);assert.equal(recovered.selectedSubjectId,selected.selectedSubjectId);
  await assert.rejects(second.selectAnalysisSubject(account.session.token,{analysisId:id.analysisId,recoveryId:registered.recoveryId,subjectRevision:1,subjectId:resolved.candidates[0].id}),{code:'subject_selection_changed'});
  await assert.rejects(second.claimSubjectContinuation(other.session.token,{analysisId:id.analysisId,recoveryId:registered.recoveryId,subjectRevision:2}),{code:'analysis_recovery_not_found'});
  clock+=60*60*1000;await assert.rejects(second.claimSubjectContinuation(account.session.token,{analysisId:id.analysisId,recoveryId:registered.recoveryId,subjectRevision:2}),{code:'analysis_recovery_not_found'});
 }finally{assert.equal(path.dirname(path.resolve(dir)),testRoot);await fs.rm(dir,{recursive:true,force:true});}
});
test('no external provider transport was attempted',()=>assert.deepEqual(guard.attempts,[]));

test('corrected subject excludes host owner clues while clear associated subject retains them',()=>{
 const original={item_name:'desk lamp',known_brand:'Acme',known_model:'L42',known_upc:'041226087161',buyer_notes:'Acme L42 desk lamp',purchase_intent:'personal_use'};
 const candidates=resolveEvaluationSubject(recognition,{}).candidates;
 const chosen=resolveEvaluationSubject(recognition,{...original,subject_selection:candidates[1].id});
 const scoped=scopeEvaluationSubjectInput(original,'Acme L42 desk lamp',chosen);
 assert.equal(original.known_brand,'Acme');assert.equal(scoped.intake.purchase_intent,'personal_use');
 const identity=projectEvaluationSubject(recognition,chosen);
 const finalized=h.finalizeIdentityForResearch(identity,h.normalizeBuyerIntake(scoped.intake));
 const state=createObjectMindState({analysisId:'owner-scope',photos:[],neutralInput:createPurposeNeutralObjectInput({notes:scoped.notes,buyerIntake:scoped.intake}),extractedIdentity:finalized});
 assert(createInitialObjectSearchPlan(state).every(q=>!/Acme|L42|041226087161/i.test(q.query)));
 assert.equal(finalized.brand,'Unknown');assert.equal(finalized.model,'Unknown');
 const clear=resolveEvaluationSubject(recognition,original);const retained=scopeEvaluationSubjectInput(original,'desk lamp',clear);
 assert.equal(retained.intake.known_brand,'Acme');assert.equal(retained.intake.known_model,'L42');
});
