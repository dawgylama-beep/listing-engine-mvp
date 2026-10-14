import assert from 'node:assert/strict';
import {expect,test} from '@playwright/test';
import {createCustomerAccountService,createMemoryCustomerAccountStore} from '../../lib/customer-account/service.js';
import {createCustomerAccountHandler} from '../../api/customer-account.js';
import {createGenerateListingHandler} from '../../api/generate-listing.js';
import {controlledBrowserModelResponse} from '../helpers/build-browser-handler-response.mjs';
import {installHardNetworkDenial} from '../helpers/hard-network-denial.mjs';

test('subject choice and correction survive refresh; lost continuation response never repeats recognition or dispatch',async({page,context})=>{
 const denial=installHardNetworkDenial();
 const service=createCustomerAccountService({store:createMemoryCustomerAccountStore()});
 const account=await service.register({username:'subject_browser',password:'synthetic password 123'});
 const accountHandler=createCustomerAccountHandler({service,environment:{}});
 const options=[{label:'desk lamp',kind:'OBJECT',description:'Metal desk lamp',visibleMarks:['Acme'],brand:'Acme',model:'',capacity:'',features:['metal arm']},{label:'lamp shade',kind:'ACCESSORY',description:'Standalone fabric shade',visibleMarks:[],brand:'',model:'',capacity:'',features:['pleated fabric']}];
 let recognitionCalls=0,searches=0,posts=0;
 const handler=createGenerateListingHandler({requireAnalysisRecovery:true,resolveAnalysisAccountService:async()=>service,getOpenAIApiKey:()=> 'synthetic-placeholder',getOpenAIModel:()=> 'gpt-4.1-mini',getSerperApiKey:()=> 'synthetic-placeholder',usesAuthenticatedExactInputTokenCounting:true,requestOpenAIInputTokenCount:async()=>({input_tokens:200}),
 requestOpenAIJson:async({payload})=>{const name=payload.text.format.name;if(name==='item_identity'){recognitionCalls++;return {json:{...controlledBrowserModelResponse(name,'customer-model-corroboration'),subjectResolution:{status:'AMBIGUOUS',selectedIndex:-1,candidates:options}},data:{output:[]}};}return {json:controlledBrowserModelResponse(name,'customer-model-corroboration'),data:{output:[]}};},requestSerperSearch:async()=>{searches++;return {json:{organic:[]},statusCode:200,elapsedMs:1};}});
 await context.addCookies([{name:'ke_beta_session',value:account.session.token,url:'http://127.0.0.1:4177',httpOnly:true,sameSite:'Strict'}]);
 const external=[];await page.route('**/*',async route=>{if(new URL(route.request().url()).hostname!=='127.0.0.1'){external.push(route.request().url());return route.abort('blockedbyclient');}return route.continue();});
 const invoke=async(route,active)=>{
  const req=route.request(),url=new URL(req.url()),headers=await req.allHeaders();headers.host||=url.host;
  const res={statusCode:200,headers:{},payload:null,status(code){this.statusCode=code;return this;},setHeader(k,v){this.headers[k]=v;},json(value){this.payload=value;return this;}};
  await active({method:req.method(),url:url.pathname+url.search,headers,body:req.postData(),socket:{remoteAddress:'127.0.0.1'}},res);return res;
 };
 await page.route('**/api/customer-account**',async route=>{const res=await invoke(route,accountHandler);await route.fulfill({status:res.statusCode,headers:res.headers,contentType:'application/json',body:JSON.stringify(res.payload)});});
 await page.route('**/api/generate-listing',async route=>{posts++;const body=route.request().postDataJSON();const res=await invoke(route,handler);if(body.action==='continue_subject')return route.abort('failed');await route.fulfill({status:res.statusCode,contentType:'application/json',body:JSON.stringify(res.payload)});});
 await page.goto('/');await expect(page.locator('#account-menu-button')).toHaveText('@subject_browser');
 const encoded=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=120;canvas.getContext('2d').fillRect(0,0,120,120);return canvas.toDataURL('image/png').split(',')[1];});
 await page.locator('#photos').setInputFiles({name:'scene.png',mimeType:'image/png',buffer:Buffer.from(encoded,'base64')});await page.locator('#purchase_context').selectOption('private_seller');
 await page.locator('#workflow-submit-button').click();
 const question=page.locator('[data-subject-clarification]');await expect(question).toContainText('Which item would you like evaluated: desk lamp or lamp shade?');assert.equal(searches,0);assert.equal(recognitionCalls,1);
 await question.getByRole('button',{name:'desk lamp',exact:true}).click();await expect(question.getByRole('button',{name:'desk lamp',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.reload();await expect(question.getByRole('button',{name:'desk lamp',exact:true})).toHaveAttribute('aria-pressed','true');assert.equal(posts,1);assert.equal(searches,0);
 await question.getByRole('button',{name:'lamp shade',exact:true}).click();await expect(question.getByRole('button',{name:'lamp shade',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.reload();await expect(question.getByRole('button',{name:'lamp shade',exact:true})).toHaveAttribute('aria-pressed','true');assert.equal(posts,1);
 await question.getByRole('button',{name:'Continue with selected item'}).dblclick();
 await expect(page.locator('[data-evaluated-subject]')).toContainText('lamp shade');assert.equal(posts,2);assert.equal(recognitionCalls,1);assert(searches>0);
 const searchesCompleted=searches;await page.reload();await expect(page.locator('[data-evaluated-subject]')).toContainText('lamp shade');assert.equal(posts,2);assert.equal(searches,searchesCompleted);
 await page.getByRole('button',{name:'Correct the subject'}).click();await expect(page.locator('#item_name')).toBeFocused();assert.equal(posts,2);
 assert.deepEqual(external,[]);assert.deepEqual(denial.attempts,[]);denial.restore();
});
