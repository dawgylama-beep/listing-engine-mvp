import crypto from 'node:crypto';
const STATES=new Set(['REGISTERED','AWAITING_SUBJECT','SUBJECT_SELECTED','DISPATCHING','SUCCEEDED','FAILED_TERMINAL']);
const WORKFLOWS=new Set(['','personal_use','resale','market_value','listing']);
const KEYS=['analysisId','recoveryId','workflow','createdAtMilliseconds','contentExpiresAtMilliseconds','executionState','dispatchedAtMilliseconds','updatedAtMilliseconds'];
export function rememberAnalysisReceipt(state,accountId,record,now){
 const entries=state.analysisReceipts[accountId]||(state.analysisReceipts[accountId]={});
 const prior=entries[record.analysisId];const executionState=record.subjectPhase||record.state;
 entries[record.analysisId]={analysisId:record.analysisId,recoveryId:record.recoveryId,workflow:WORKFLOWS.has(record.workflow)?record.workflow:'',createdAtMilliseconds:record.createdAtMilliseconds,contentExpiresAtMilliseconds:record.expiresAtMilliseconds,executionState,dispatchedAtMilliseconds:record.dispatchedAtMilliseconds,updatedAtMilliseconds:prior?.executionState===executionState?prior.updatedAtMilliseconds:now};
 return entries[record.analysisId];
}
export function validateAnalysisReceipts(state){
 if(!state.analysisReceipts||typeof state.analysisReceipts!=='object'||Array.isArray(state.analysisReceipts))throw Error('Invalid analysis receipt map.');let total=0;
 for(const [accountId,entries] of Object.entries(state.analysisReceipts)){
  if(!state.accounts[accountId]||!entries||typeof entries!=='object'||Array.isArray(entries)||Object.keys(entries).length>5000)throw Error('Invalid analysis receipt ownership or bound.');
  for(const [id,r] of Object.entries(entries)){
   const replay=crypto.createHash('sha256').update(accountId+':'+id).digest('hex');
   if(!r||typeof r!=='object'||Object.keys(r).length!==KEYS.length||Object.keys(r).some(k=>!KEYS.includes(k))||r.analysisId!==id||!/^[A-Za-z0-9-]{8,120}$/.test(id)||!/^recovery_[A-Za-z0-9_-]{32}$/.test(r.recoveryId)||!STATES.has(r.executionState)||!WORKFLOWS.has(r.workflow)||!Number.isSafeInteger(r.createdAtMilliseconds)||!Number.isSafeInteger(r.contentExpiresAtMilliseconds)||r.contentExpiresAtMilliseconds-r.createdAtMilliseconds!==3600000||!Number.isSafeInteger(r.updatedAtMilliseconds)||r.updatedAtMilliseconds<r.createdAtMilliseconds||(r.dispatchedAtMilliseconds!==null&&!Number.isSafeInteger(r.dispatchedAtMilliseconds))||state.analysisReplay[accountId]?.[replay]!==true)throw Error('Invalid bounded analysis receipt.');total++;
  }
 }if(total>20000)throw Error('Analysis receipt bound exceeded.');
}
export function publicAnalysisReceipt(receipt,now,record=null){
 const contentExpired=now>=receipt.contentExpiresAtMilliseconds;
 const state=receipt.executionState==='DISPATCHING'&&now-receipt.dispatchedAtMilliseconds>=600000?'UNKNOWN':receipt.executionState;
 // Legacy executionState records application delivery, not provider dispatch/billing.
 // These additive public dimensions require no stored-schema or retention change.
 return {analysisId:receipt.analysisId,recoveryId:receipt.recoveryId,workflow:receipt.workflow,state,executionState:receipt.executionState,deliveryState:state==='FAILED_TERMINAL'?'FAILED':state==='SUCCEEDED'?'SUCCEEDED':'NOT_ESTABLISHED',providerExecution:'UNKNOWN',billingStatus:'UNKNOWN',createdAt:new Date(receipt.createdAtMilliseconds).toISOString(),updatedAt:new Date(receipt.updatedAtMilliseconds).toISOString(),expiresAt:new Date(receipt.contentExpiresAtMilliseconds).toISOString(),contentExpired,resultContentStatus:contentExpired?'EXPIRED':record?.responseJson&&!record.subjectPhase?'AVAILABLE':'NOT_AVAILABLE',canRecoverContent:!contentExpired&&Boolean(record)};
}
