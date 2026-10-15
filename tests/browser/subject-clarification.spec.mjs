import assert from 'node:assert/strict';
import {expect,test} from '@playwright/test';
import {createCustomerAccountService,createMemoryCustomerAccountStore} from '../../lib/customer-account/service.js';
import {createCustomerAccountHandler} from '../../api/customer-account.js';
import {createGenerateListingHandler} from '../../api/generate-listing.js';
import {controlledBrowserModelResponse} from '../helpers/build-browser-handler-response.mjs';
import {installHardNetworkDenial} from '../helpers/hard-network-denial.mjs';
import {object,observation} from '../fixtures/subject-observation-contract.mjs';

test('subject choice and correction survive refresh; lost continuation response never repeats recognition or dispatch',async({page,context})=>{
 const denial=installHardNetworkDenial();
 let clock=Date.now();const service=createCustomerAccountService({store:createMemoryCustomerAccountStore(),now:()=>clock});
 const account=await service.register({username:'subject_browser',password:'synthetic password 123'});
 const accountHandler=createCustomerAccountHandler({service,environment:{}});
 const options=[object('lamp','desk lamp','OBJECT',[observation('lamp-mark','lamp','BRAND','Acme'),observation('lamp-arm','lamp','FEATURE','metal arm')]),object('shade','lamp shade','ACCESSORY',[observation('shade-feature','shade','FEATURE','pleated fabric')])];
 let recognitionCalls=0,searches=0,posts=0;let releaseContinuation;const continuationGate=new Promise(resolve=>{releaseContinuation=resolve;});
 const handler=createGenerateListingHandler({requireAnalysisRecovery:true,resolveAnalysisAccountService:async()=>service,getOpenAIApiKey:()=> 'synthetic-placeholder',getOpenAIModel:()=> 'gpt-4.1-mini',getSerperApiKey:()=> 'synthetic-placeholder',usesAuthenticatedExactInputTokenCounting:true,requestOpenAIInputTokenCount:async()=>({input_tokens:200}),
 requestOpenAIJson:async({payload})=>{const name=payload.text.format.name;if(name==='item_identity'){recognitionCalls++;return {json:{...controlledBrowserModelResponse(name,'customer-model-corroboration'),subjectResolution:{observationVersion:'1',unassignedObservations:[],relationships:[{fromObjectId:'lamp',toObjectId:'shade',relation:'NEAR',certainty:'CLEAR'}],status:'AMBIGUOUS',selectedIndex:-1,candidates:options}},data:{output:[]}};}return {json:controlledBrowserModelResponse(name,'customer-model-corroboration'),data:{output:[]}};},requestSerperSearch:async({query})=>{assert(!/Acme/i.test(query));searches++;return {json:{organic:[]},statusCode:200,elapsedMs:1};}});
 await context.addCookies([{name:'ke_beta_session',value:account.session.token,url:'http://127.0.0.1:4177',httpOnly:true,sameSite:'Strict'}]);
 const external=[];await page.route('**/*',async route=>{if(new URL(route.request().url()).hostname!=='127.0.0.1'){external.push(route.request().url());return route.abort('blockedbyclient');}return route.continue();});
 const invoke=async(route,active)=>{
  const req=route.request(),url=new URL(req.url()),headers=await req.allHeaders();headers.host||=url.host;
  const res={statusCode:200,headers:{},payload:null,status(code){this.statusCode=code;return this;},setHeader(k,v){this.headers[k]=v;},json(value){this.payload=value;return this;}};
  await active({method:req.method(),url:url.pathname+url.search,headers,body:req.postData(),socket:{remoteAddress:'127.0.0.1'}},res);return res;
 };
 await page.route('**/api/customer-account**',async route=>{const res=await invoke(route,accountHandler);await route.fulfill({status:res.statusCode,headers:res.headers,contentType:'application/json',body:JSON.stringify(res.payload)});});
 await page.route('**/api/generate-listing',async route=>{posts++;const body=route.request().postDataJSON();if(body.action==='continue_subject')await continuationGate;const res=await invoke(route,handler);if(body.action==='continue_subject')return route.abort('failed');await route.fulfill({status:res.statusCode,contentType:'application/json',body:JSON.stringify(res.payload)});});
 await page.goto('/');await expect(page.locator('#account-menu-button')).toHaveText('@subject_browser');
 const encoded=await page.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=120;canvas.getContext('2d').fillRect(0,0,120,120);return canvas.toDataURL('image/png').split(',')[1];});
 await page.locator('#photos').setInputFiles({name:'scene.png',mimeType:'image/png',buffer:Buffer.from(encoded,'base64')});await page.locator('#purchase_context').selectOption('private_seller');
 await page.locator('#workflow-submit-button').click();
 const question=page.locator('[data-subject-clarification]');await expect(question).toContainText('Which item would you like evaluated: desk lamp or lamp shade?');assert.equal(searches,0);assert.equal(recognitionCalls,1);
 const lamp=question.getByRole('button',{name:'desk lamp',exact:true});if(test.info().project.use.hasTouch)await lamp.tap();else await lamp.click();await expect(lamp).toHaveAttribute('aria-pressed','true');
 await expect(lamp).toHaveClass(/subject-choice--selected/);await expect(question.getByRole('button',{name:'lamp shade',exact:true})).toHaveCSS('opacity','0.55');await expect(lamp).toHaveCSS('opacity','1');await expect(page.locator('#workflow-submit-button')).toBeDisabled();await expect(question.getByRole('button',{name:'Continue with selected item'})).toBeEnabled();
 await page.reload();await expect(question.getByRole('button',{name:'desk lamp',exact:true})).toHaveAttribute('aria-pressed','true');assert.equal(posts,1);assert.equal(searches,0);
 const shade=question.getByRole('button',{name:'lamp shade',exact:true});await shade.focus();await shade.press('Enter');await expect(shade).toHaveAttribute('aria-pressed','true');await expect(shade).toBeFocused();await expect(lamp).toHaveCSS('opacity','0.55');await expect(shade).toHaveCSS('opacity','1');await expect(lamp).toBeEnabled();
 await lamp.focus();await lamp.press('Space');await expect(lamp).toHaveAttribute('aria-pressed','true');await expect(shade).toHaveCSS('opacity','0.55');await shade.focus();await shade.press('Enter');await expect(shade).toHaveAttribute('aria-pressed','true');await expect(shade).toHaveCSS('opacity','1');await expect(lamp).toBeEnabled();assert.equal(posts,1);assert.equal(searches,0);
 await page.screenshot({path:'../durable-receipt-selected-'+test.info().project.name+'.png',fullPage:true});
 await page.evaluate(()=>sessionStorage.clear());await page.locator('#account-menu-button').click();await page.locator('#account-signout-button').click();
 await page.locator('#login-username').fill('subject_browser');await page.locator('#login-password').fill('synthetic password 123');await page.locator('#account-login-form button[type="submit"]').click();await expect(page.locator('#account-menu-button')).toHaveText('@subject_browser');
 await page.getByRole('button',{name:'Check analysis receipts',exact:true}).click();await page.locator('[data-analysis-receipts]').getByRole('button',{name:/Open evaluation/}).click();
 await expect(question.getByRole('button',{name:'lamp shade',exact:true})).toHaveAttribute('aria-pressed','true');assert.equal(posts,1);assert.equal(searches,0);
 await question.getByRole('button',{name:'Continue with selected item'}).dblclick();await expect(question.getByRole('button',{name:'Continue with selected item'})).toBeDisabled();await expect(page.locator('#status')).toContainText('Continuing with your selected item');await page.locator('#listing-form').evaluate(form=>form.requestSubmit());assert.equal(posts,2);assert.equal(recognitionCalls,1);releaseContinuation();
 await expect(page.locator('[data-evaluated-subject]')).toContainText('lamp shade');assert.equal(posts,2);assert.equal(recognitionCalls,1);assert(searches>0);
 const searchesCompleted=searches;await page.reload();await expect(page.locator('[data-evaluated-subject]')).toContainText('lamp shade');assert.equal(posts,2);assert.equal(searches,searchesCompleted);
 await page.getByRole('button',{name:'Correct the subject'}).click();await expect(page.locator('#item_name')).toBeFocused();assert.equal(posts,2);
 clock+=3600001;await page.evaluate(()=>sessionStorage.clear());await page.reload();await page.locator('#account-menu-button').click();await page.getByRole('button',{name:'Check analysis receipts',exact:true}).click();await expect(page.locator('[data-analysis-receipts]')).toContainText('SUCCEEDED — content expired');await page.locator('[data-analysis-receipts]').getByRole('button',{name:/Open evaluation/}).click();await expect(page.locator('[data-analysis-receipt]')).toContainText('Evaluation completed — result content expired');assert.equal(posts,2);assert.equal(searches,searchesCompleted);assert.equal(recognitionCalls,1);await page.screenshot({path:'../observation-contract-expired-'+test.info().project.name+'.png',fullPage:true});
 assert.deepEqual(external,[]);assert.deepEqual(denial.attempts,[]);denial.restore();
});
