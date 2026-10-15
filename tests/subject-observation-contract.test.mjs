import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import {installHardNetworkDenial} from './helpers/hard-network-denial.mjs';
import {syntheticScaleContract,syntheticBialettiContract,observation} from './fixtures/subject-observation-contract.mjs';
import {normalizeSubjectObservationContract,observationQuerySupported} from '../lib/object-intelligence/subject-observations.js';
import {resolveEvaluationSubject,projectEvaluationSubject} from '../lib/object-intelligence/subject-selection.js';
import {createObjectMindState,createInitialObjectSearchPlan} from '../lib/object-intelligence/index.js';
import {createGenerateListingHandler,__queryIntegrityTestHooks as h} from '../api/generate-listing.js';
import {createCustomerAccountService,createMemoryCustomerAccountStore} from '../lib/customer-account/service.js';
import {controlledBrowserModelResponse} from './helpers/build-browser-handler-response.mjs';
const guard=installHardNetworkDenial();
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const roundtrip=value=>JSON.parse(JSON.stringify(value));
function schemaCheck(value,schema){
 if(schema.enum)assert(schema.enum.includes(value));
 if(schema.type==='object'){assert(value&&typeof value==='object'&&!Array.isArray(value));for(const key of schema.required||[])assert(key in value,'missing '+key);if(schema.additionalProperties===false)for(const key of Object.keys(value))assert(key in schema.properties,'extra '+key);for(const [key,sub]of Object.entries(schema.properties||{}))if(key in value)schemaCheck(value[key],sub);}
 if(schema.type==='array'){assert(Array.isArray(value));if(schema.maxItems)assert(value.length<=schema.maxItems);for(const item of value)schemaCheck(item,schema.items);}
 if(schema.type==='string')assert.equal(typeof value,'string');if(schema.type==='integer')assert(Number.isInteger(value));
}
function projected(raw,label){const identity=h.normalizeIdentity(roundtrip(raw));return projectEvaluationSubject(identity,resolveEvaluationSubject(identity,{item_name:label}));}
test('actual recognition schema parses literal evidence, attribution, relationships and conflicts',()=>{
 for(const raw of [syntheticScaleContract(),syntheticBialettiContract()]){
  schemaCheck(raw.subjectResolution,h.itemIdentitySchema.properties.subjectResolution);
  const parsed=h.normalizeIdentity(roundtrip(raw));const scene=parsed.subjectResolution;
  assert.equal(scene.observationVersion,'1');assert(scene.unassignedObservations.length);
  assert(scene.candidates.every(c=>c.observations.every(o=>o.objectId===c.objectId)));
 }
 const scale=projected(syntheticScaleContract(),'mechanical weighing scale');
 assert.equal(scale.brand,'Alexanderwerk');assert.equal(scale.dimensions,'10 kg');assert.equal(scale.condition,'surface wear');
 assert(scale.identityUnknowns.some(s=>s.includes('Working condition')));assert.equal(scale.observationContext.relationships.length,2);
 const coffee=projected(syntheticBialettiContract(),'stovetop coffee maker');assert.equal(coffee.brand,'Bialetti');assert.equal(coffee.model,'Unknown');
 assert(coffee.identityUnknowns.some(s=>s.includes('Gasket')));assert.equal(coffee.completeness,'Unknown');assert(coffee.identityConflictNotes.includes('2 Tazza'));
});
test('search terms exclude scene prose, host marks, uncertain attribution and completeness hypotheses',()=>{
 for(const [raw,label,forbidden]of [[syntheticScaleContract(),'mechanical weighing scale',/apples|bowl|HostMark|precise manufacturing|Uncertain numeral/i],[syntheticBialettiContract(),'stovetop coffee maker',/2 Tazza|Durchin|missing|upper chamber/i]]){
  const identity=projected(raw,label),state=createObjectMindState({photos:[{dataUrl:'synthetic-only'}],extractedIdentity:identity});
  const queries=createInitialObjectSearchPlan(state).map(q=>q.query);assert(queries.length>0);assert(queries.every(q=>!forbidden.test(q)),queries.join('\n'));assert(queries.every(q=>observationQuerySupported(q,identity)));
  assert(state.observedFacts.filter(f=>f.sourceIds.length).every(f=>f.sourceIds.length===1));
  assert(state.observedFacts.filter(f=>f.certaintyBand==='HIGH').every(f=>f.certaintySource==='MODEL_REPORTED_CLEAR'));
 }
 const bowl=projected(syntheticScaleContract(),'weighing bowl');assert.equal(bowl.brand,'Unknown');assert.deepEqual(bowl.visibleText,[]);
 assert(bowl.observationContext.unassignedObservations.some(o=>o.value==='HostMark'));
 const queries=createInitialObjectSearchPlan(createObjectMindState({extractedIdentity:bowl}));assert(queries.length>0);assert(queries.every(q=>!/Alexanderwerk|HostMark|scale/i.test(q.query)));
 assert.throws(()=>h.assertSelectedObservationQuery('weighing bowl Alexanderwerk',bowl),{code:'UNSUPPORTED_SUBJECT_QUERY'});
});
test('malformed graph cannot downgrade to legacy; ambiguous and unlocalized markings cannot enter queries',()=>{
 const broken=syntheticScaleContract();broken.subjectResolution.candidates[1].objectId='scale';assert.throws(()=>h.normalizeIdentity(broken),{code:'INVALID_SUBJECT_OBSERVATIONS'});
 const wrongImage=syntheticScaleContract();wrongImage.subjectResolution.candidates[0].observations[0].imageIds=['image-7'];assert.throws(()=>h.normalizeIdentity(wrongImage),{code:'INVALID_SUBJECT_OBSERVATIONS'});
 const unknown=syntheticScaleContract();unknown.subjectResolution.observationVersion='2';assert.throws(()=>normalizeSubjectObservationContract(unknown.subjectResolution),{code:'INVALID_SUBJECT_OBSERVATIONS'});
 const raw=syntheticScaleContract();raw.subjectResolution.candidates[0].observations.push(observation('no-image','scale','MODEL','UnlocalizedModel',{imageIds:[]}));
 const identity=projected(raw,'mechanical weighing scale');assert.equal(identity.model,'Unknown');assert(identity.identityUnknowns.some(s=>s.includes('UnlocalizedModel')));
});
test('display labels cannot confer maker authority and category cannot inherit another object marking',()=>{
 const raw=syntheticScaleContract();raw.subjectResolution.candidates[1].label='Alexanderwerk weighing bowl';
 const identity=projected(raw,'Alexanderwerk weighing bowl');assert.equal(identity.category,'weighing bowl');assert.equal(identity.subjectSelection.label,'weighing bowl');
 assert.equal(observationQuerySupported('weighing bowl Alexanderwerk',identity),false);
 const poisoned=syntheticScaleContract();poisoned.subjectResolution.candidates[1].observations[0].value='Alexanderwerk weighing bowl';
 assert.throws(()=>projected(poisoned,'weighing bowl'),{code:'INVALID_SUBJECT_OBSERVATIONS'});
});
const capture=()=>({statusCode:200,payload:null,setHeader(){},status(code){this.statusCode=code;return this;},json(value){this.payload=value;return this;}});
async function handlerTrial(raw,{clarify=false}={}){
 const store=createMemoryCustomerAccountStore(),service=createCustomerAccountService({store}),account=await service.register({username:'contract_test',password:'synthetic password 123'});
 const body={analysisId:'analysis-contract-'+(clarify?'clarify':'clear'),reportType:'marketValue',notes:'',photos:[{name:'synthetic.jpg',dataUrl:`data:image/jpeg;base64,${Buffer.alloc(4096,0x5a).toString('base64')}`}],buyerIntake:{purchase_context:'private_seller',purchase_intent:'resale',item_name:clarify?'':raw.subjectResolution.candidates[0].label}};
 const registration=await service.registerAnalysisRecovery(account.session.token,{analysisId:body.analysisId,requestHash:hash(JSON.stringify(body)),photoHashes:[hash(body.photos[0].dataUrl)]});
 body.recovery={analysisId:body.analysisId,requestHash:hash(JSON.stringify(body)),photoHashes:[hash(body.photos[0].dataUrl)],recoveryId:registration.recoveryId};
 // Bind exactly the original pre-recovery request bytes, as the customer flow does.
 body.recovery.requestHash=(await store.read()).analysisRecoveries[account.account.id][body.analysisId].requestHash;
 const queries=[],judgments=[];let recognitionCalls=0;
 const handler=createGenerateListingHandler({requireAnalysisRecovery:true,resolveAnalysisAccountService:async()=>service,getOpenAIApiKey:()=> 'synthetic-placeholder',getOpenAIModel:()=> 'gpt-4.1-mini',getSerperApiKey:()=> 'synthetic-placeholder',usesAuthenticatedExactInputTokenCounting:true,requestOpenAIInputTokenCount:async()=>({input_tokens:200}),
  requestOpenAIJson:async({payload})=>{const schema=payload.text.format.name;if(schema==='item_identity'){recognitionCalls++;schemaCheck(raw.subjectResolution,payload.text.format.schema.properties.subjectResolution);return {json:roundtrip(raw),data:{output:[]}};}judgments.push(JSON.stringify(payload.input));return {json:controlledBrowserModelResponse(schema,'customer-model-corroboration'),data:{output:[]}};},
  requestSerperSearch:async({query})=>{queries.push(query);return {json:{organic:[]},statusCode:200,elapsedMs:1};},requestBoundedRetailProductPage:async()=>{throw Error('NO_DIRECT_PAGE_EXPECTED');}});
 const req=body=>({method:'POST',body,headers:{host:'localhost:5175',origin:'http://localhost:5175','content-type':'application/json',cookie:`ke_beta_session=${account.session.token}`,'x-csrf-token':account.session.csrfToken}});
 let result=capture();await handler(req(body),result);
 if(clarify){
  assert.equal(result.statusCode,409,JSON.stringify(result.payload));assert.equal(queries.length,0);assert.equal(recognitionCalls,1);
  const refreshed=createCustomerAccountService({store});const recovered=await refreshed.readAnalysisRecovery(account.session.token,body.analysisId,registration.recoveryId);
  const option=recovered.clarification.options.find(o=>o.label==='weighing bowl');assert(option);
  const selection=await refreshed.selectAnalysisSubject(account.session.token,{analysisId:body.analysisId,recoveryId:registration.recoveryId,subjectRevision:recovered.subjectRevision,subjectId:option.id});
  const continuation={action:'continue_subject',analysisId:body.analysisId,recoveryId:registration.recoveryId,subjectRevision:selection.subjectRevision};
  const both=await Promise.all([capture(),capture()].map(async response=>{await handler(req(continuation),response);return response;}));result=both.find(r=>r.statusCode!==202);
  assert.equal(result.statusCode,200,JSON.stringify(result.payload));const count=queries.length;const replay=capture();await handler(req(continuation),replay);assert.equal(queries.length,count);assert.equal(recognitionCalls,1);
 }else assert.equal(result.statusCode,200,JSON.stringify(result.payload));
 assert.equal(recognitionCalls,1);assert(queries.length>0);
 if(!clarify)assert(judgments.some(s=>s.includes('observationContext')));
 else assert(result.payload.valuation.whatIsStillUnknown.some(s=>s.includes('Unassigned observation')),'Insufficient-evidence result must retain unassigned caveats even when Governor avoids another model call');
 if(process.env.KE_OBSERVATION_TEST_EVIDENCE_DIRECTORY){
  const file=new URL((clarify?'clarified-accessory':raw.subjectResolution.candidates[0].observations.length>10?'many-caveats':'clear-coffee')+'.json',process.env.KE_OBSERVATION_TEST_EVIDENCE_DIRECTORY+'/');
  await fs.writeFile(file,JSON.stringify({inputClass:'SYNTHETIC_RECOGNITION_RESPONSE_NOT_LIVE',recognitionCalls,queries,judgmentCalls:judgments.length,judgmentContainsObservationContext:judgments.some(s=>s.includes('observationContext')),subject:result.payload.valuation.subjectSelection,unknowns:result.payload.valuation.whatIsStillUnknown,conflicts:result.payload.valuation.identityConflicts,customerResult:result.payload.valuation,externalTransports:guard.attempts},null,2));
 }
 return {result,queries,judgments};
}
test('recognition through handler judgment preserves selected coffee-maker caveats without false exact terms',async()=>{
 const {result,queries,judgments}=await handlerTrial(syntheticBialettiContract());
 assert(queries.every(q=>!/2 Tazza|Durchin|missing|upper chamber/i.test(q)),queries.join('\n'));
 assert(judgments.some(s=>s.includes('Gasket and safety valve')));assert(judgments.some(s=>s.includes('unassignedObservations')));
 assert(result.payload.valuation.whatIsStillUnknown.some(s=>/Gasket|Capacity uncertain|Unassigned observation/.test(s)));
 assert.equal(result.payload.valuation.subjectSelection.label,'stovetop coffee maker');
});
test('compact final output discloses omitted uncertainties without promoting any into facts',async()=>{
 const raw=syntheticBialettiContract();for(let i=0;i<12;i++)raw.subjectResolution.candidates[0].observations.push(observation('extra-'+i,'coffee-maker','UNKNOWN','Additional unresolved detail '+i,{certainty:'UNCERTAIN'}));
 const {result}=await handlerTrial(raw);assert(result.payload.valuation.whatIsStillUnknown.some(s=>/additional uncertainties remain/.test(s)));
});
test('clarification recovery reuses parsed observations, isolates accessory and continues exactly once',async()=>{
 const {result,queries}=await handlerTrial(syntheticScaleContract(),{clarify:true});
 assert.equal(result.payload.valuation.subjectSelection.label,'weighing bowl');assert(queries.every(q=>!/Alexanderwerk|HostMark|apples|scale/i.test(q)),queries.join('\n'));
});
test('all external transports denied',()=>assert.deepEqual(guard.attempts,[]));
