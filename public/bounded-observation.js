(function(root){
  'use strict';
  // A deadline bounds waiting in this tab, never server/provider execution or billing.
  async function observe(operation,milliseconds=15000,onTimeout=()=>{}){
    let timer;
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{
      const error=Object.assign(new Error('The response took too long. Its outcome is unconfirmed; no automatic resubmission occurred.'),{code:'OBSERVATION_TIMEOUT'});
      reject(error);onTimeout();
    },milliseconds);});
    try{return await Promise.race([Promise.resolve().then(operation),deadline]);}
    finally{clearTimeout(timer);}
  }
  async function readJson(url,options={},milliseconds=15000,onResponse=()=>{}){
    const controller=new AbortController(),method=String(options.method||'GET').toUpperCase();
    // Only abort read-only observation. A POST's receipt protects its still-uncertain effects.
    const signal=options.signal||(method==='GET'?controller.signal:undefined);
    let settled=false;
    try{return await observe(async()=>{const response=await root.fetch(url,{...options,signal});if(!settled)onResponse(response);let data;try{data=await response.json();}catch(error){error.observedHttpStatus=response.status;throw error;}return {response,data};},milliseconds,()=>{settled=true;if(method==='GET')controller.abort();});}
    finally{settled=true;}
  }
  function deliveryMessage(state,expired=false){
    if(state==='FAILED_TERMINAL')return 'Report delivery failed. Provider execution and charges are unconfirmed. Do not submit this evaluation again.'+(expired?' Temporary result content has expired and cannot be restored.':'');
    return '';
  }
  root.KatherinesEyeObservation=Object.freeze({observe,readJson,deliveryMessage});
})(globalThis);
