import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs/promises';import vm from 'node:vm';
import {publicAnalysisReceipt} from '../lib/customer-account/analysis-receipts.js';
const code=await fs.readFile(new URL('../public/bounded-observation.js',import.meta.url),'utf8');
function runtime(fetch){const context=vm.createContext({fetch,AbortController,setTimeout,clearTimeout});vm.runInContext(code,context);return context.KatherinesEyeObservation;}
test('SYNTHETIC stalled or abort-ignoring GET fetch/body has a bounded deadline',async()=>{
 for(const body of [false,true]){let signal;const h=runtime(async(u,o)=>{signal=o.signal;return body?{json:()=>new Promise(()=>{})}:new Promise(()=>{});});
  await assert.rejects(h.readJson('/status',{},5),{code:'OBSERVATION_TIMEOUT'});assert.equal(signal.aborted,true);
 }
});
test('POST timeout is observation uncertainty, does not abort execution or resubmit',async()=>{
 let calls=0,signal;const h=runtime(async(u,o)=>{calls++;signal=o.signal;return new Promise(()=>{});}),controller=new AbortController();
 await assert.rejects(h.readJson('/analysis',{method:'POST',signal:controller.signal},5),{code:'OBSERVATION_TIMEOUT'});assert.equal(calls,1);assert.equal(signal.aborted,false);
});
test('late POST response cannot change diagnostic stage after the observation deadline',async()=>{
 let release,callbacks=0;const h=runtime(()=>new Promise(resolve=>{release=resolve;}));
 await assert.rejects(h.readJson('/analysis',{method:'POST'},5,()=>{callbacks++;}),{code:'OBSERVATION_TIMEOUT'});
 release({status:200,json:async()=>({})});await new Promise(resolve=>setTimeout(resolve,0));assert.equal(callbacks,0);
});
test('pending export observation does not serialize independent same-ID status',async()=>{
 const seen=[],h=runtime(async url=>{seen.push(url);return url.includes('export')?new Promise(()=>{}):{json:async()=>({analysisId:'same-analysis-id',state:'DISPATCHING'})};});
 const pending=assert.rejects(h.readJson('/account?action=export',{},10),{code:'OBSERVATION_TIMEOUT'});
 const status=await h.readJson('/account?action=analysis_status&analysisId=same-analysis-id',{},10);assert.equal(status.data.analysisId,'same-analysis-id');await pending;assert.equal(seen.length,2);
});
test('response parse failure retains numeric HTTP status and terminal wording preserves unknown charges',async()=>{
 const order=[],h=runtime(async()=>({status:502,json:async()=>{order.push('parse');throw Error('invalid JSON');}}));await assert.rejects(h.readJson('/status',{},20,response=>{assert.equal(response.status,502);order.push('response');}),{observedHttpStatus:502});assert.deepEqual(order,['response','parse']);assert.match(h.deliveryMessage('FAILED_TERMINAL',true),/Provider execution and charges are unconfirmed/);assert.match(h.deliveryMessage('FAILED_TERMINAL',true),/expired and cannot be restored/);
});
test('schema2.2 public dimensions separate failed delivery and provider UNKNOWN before/after expiry',()=>{
 const receipt={analysisId:'preserved-analysis',recoveryId:'not-used',workflow:'resale',executionState:'FAILED_TERMINAL',createdAtMilliseconds:1000,contentExpiresAtMilliseconds:3601000,dispatchedAtMilliseconds:2000,updatedAtMilliseconds:32632};const original=JSON.stringify(receipt);
 for(const now of [40000,3601001]){const value=publicAnalysisReceipt(receipt,now);assert.equal(value.executionState,'FAILED_TERMINAL');assert.equal(value.deliveryState,'FAILED');assert.equal(value.providerExecution,'UNKNOWN');assert.equal(value.billingStatus,'UNKNOWN');assert.equal(value.resultContentStatus,now>3601000?'EXPIRED':'NOT_AVAILABLE');assert.equal(value.canRecoverContent,false);assert.equal(value.response,undefined);}
 assert.equal(JSON.stringify(receipt),original);
});
