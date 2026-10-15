import assert from "node:assert/strict";
import { expect, test } from "@playwright/test";
import { createCustomerAccountHandler } from "../../api/customer-account.js";
import { createCustomerAccountService, createMemoryCustomerAccountStore } from "../../lib/customer-account/service.js";
import { buildControlledCustomerModelCorroborationReport } from "../helpers/build-browser-handler-response.mjs";

async function preparedBrowser(page, context, { now } = {}) {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore(), ...(now ? { now } : {}) });
  const account = await service.register({ username: "recovery_browser", password: "synthetic password 123" });
  const handler = createCustomerAccountHandler({ service, environment: {} });
  await context.addCookies([{ name: "ke_beta_session", value: account.session.token, url: "http://127.0.0.1:4177", httpOnly: true, sameSite: "Strict" }]);
  await page.route("**/*", async (route) => {
    if (new URL(route.request().url()).hostname !== "127.0.0.1") return route.abort("blockedbyclient");
    return route.continue();
  });
  await page.route("**/api/customer-account**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = await request.allHeaders();
    headers.host ||= url.host;
    const res = { statusCode: 200, headers: {}, payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[name] = value; },
      json(payload) { this.payload = payload; return this; }
    };
    await handler({ method: request.method(), url: `${url.pathname}${url.search}`, headers,
      body: request.postData(), socket: { remoteAddress: "127.0.0.1" } }, res);
    await route.fulfill({ status: res.statusCode, headers: res.headers, contentType: "application/json", body: JSON.stringify(res.payload) });
  });
  await page.goto("/");
  await expect(page.locator("#account-menu-button")).toHaveText("@recovery_browser");
  const encoded = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 120;
    const context = canvas.getContext("2d");
    context.fillStyle = "#b8aba0";
    context.fillRect(0, 0, 120, 120);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.locator("#photos").setInputFiles({ name: "synthetic-item.png", mimeType: "image/png", buffer: Buffer.from(encoded, "base64") });
  await page.locator("#purchase_context").selectOption("private_seller");
  return { service, account };
}


// SYNTHETIC local HTTP/service fixtures; no live analysis or providers.
test('export fetch timeout leaves same-account receipt status usable and ignores late export',async({page,context})=>{
 const {service,account}=await preparedBrowser(page,context);await service.registerAnalysisRecovery(account.session.token,{analysisId:'analysis-export-status',requestHash:'a'.repeat(64),photoHashes:['b'.repeat(64)]});
 let release,downloads=0;page.on('download',()=>downloads++);
 await page.route('**/api/customer-account?action=export',route=>new Promise(resolve=>{release=async()=>{try{await route.fulfill({json:{export:{synthetic:true}}});}catch{}resolve();};}));
 await page.clock.install();await page.locator('#account-menu-button').click();await page.locator('#account-export-button').click();
 await expect(page.locator('#account-export-button')).toBeDisabled();await expect(page.getByText('Preparing account export.',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Check analysis receipts',exact:true}).click();await expect(page.getByText('analysis-export-status',{exact:false}).first()).toBeVisible();
 await page.clock.runFor(15001);await expect(page.getByText('Export preparation timed out.',{exact:false})).toBeVisible();await expect(page.locator('#account-export-button')).toBeEnabled();
 await release();await expect(page.getByText('Download prepared account export',{exact:true})).toBeHidden();assert.equal(downloads,0);
});
test('export preparation has separate download and expires only its local link',async({page,context})=>{
 await preparedBrowser(page,context);let downloads=0;page.on('download',()=>downloads++);await page.clock.install();
 await page.locator('#account-menu-button').click();await page.locator('#account-export-button').click();
 await expect(page.getByText('Download prepared account export',{exact:true})).toBeVisible();assert.equal(downloads,0);
 await expect(page.getByRole('button',{name:'Check analysis receipts',exact:true})).toBeEnabled();await page.clock.runFor(60001);
 await expect(page.getByText('Download prepared account export',{exact:true})).toBeHidden();
});
test('hung POST observation recovers same completed request and Save without a second POST',async({page,context})=>{
 const {service,account}=await preparedBrowser(page,context),report=await buildControlledCustomerModelCorroborationReport();let posts=0,identity,release;
 await page.route('**/api/generate-listing',route=>new Promise(async resolve=>{posts++;const body=route.request().postDataJSON();identity={analysisId:body.analysisId,...body.recovery};await service.claimAnalysisRecovery(account.session.token,identity);await service.completeAnalysisRecovery(account.session.token,{...identity,state:'SUCCEEDED',statusCode:200,response:{valuation:report}});release=async()=>{try{await route.fulfill({json:{valuation:report}});}catch{}resolve();};}));
 await page.clock.install();await page.locator('#workflow-submit-button').click();await expect.poll(()=>Boolean(release)).toBe(true);
 await page.clock.runFor(60001);await expect(page.locator('.report-root')).toBeVisible();assert.equal(posts,1);
 await page.locator('#save-listing-button').click();await expect.poll(async()=>(await service.listHistory(account.session.token)).listings.length).toBe(1);
 await release();assert.equal(posts,1);assert.equal((await service.readAnalysisRecovery(account.session.token,identity.analysisId,identity.recoveryId)).state,'SUCCEEDED');
});
test('502 receipt describes failed delivery and unknown provider charges after expiry too',async({page,context})=>{
 let now=Date.parse('2026-10-15T20:36:57.601Z');const {service,account}=await preparedBrowser(page,context,{now:()=>now});let posts=0,identity;
 await page.route('**/api/generate-listing',async route=>{posts++;const body=route.request().postDataJSON();identity={analysisId:body.analysisId,...body.recovery};await service.claimAnalysisRecovery(account.session.token,identity);now+=31632;await service.completeAnalysisRecovery(account.session.token,{...identity,state:'FAILED_TERMINAL',statusCode:502,response:{error:'Please try again shortly.'}});await route.fulfill({status:502,json:{error:'Please try again shortly.'}});});
 await page.locator('#workflow-submit-button').click();await expect(page.locator('#status')).toContainText('Provider execution and charges are unconfirmed');assert.equal(posts,1);
 now+=3600001;await page.reload();await expect(page.locator('#status')).toContainText('expired and cannot be restored');assert.equal(posts,1);
 const receipt=await service.readAnalysisRecovery(account.session.token,identity.analysisId,identity.recoveryId);assert.equal(receipt.deliveryState,'FAILED');assert.equal(receipt.providerExecution,'UNKNOWN');assert.equal(receipt.resultContentStatus,'EXPIRED');
});
test('clarification continuation observation times out and recovers the same selected request once',async({page,context})=>{
 const {service,account}=await preparedBrowser(page,context),report=await buildControlledCustomerModelCorroborationReport();let posts=0,initialId,release;
 await page.route('**/api/generate-listing',route=>new Promise(async resolve=>{
  posts++;const body=route.request().postDataJSON();
  if(body.action!=='continue_subject'){
   initialId=body.analysisId;const identity={analysisId:initialId,...body.recovery};await service.claimAnalysisRecovery(account.session.token,identity);
   const paused=await service.pauseSubjectClarification(account.session.token,{...identity,clarification:{question:'Which item: desk lamp or lamp shade?',options:[{id:'lamp',label:'desk lamp',kind:'OBJECT'},{id:'shade',label:'lamp shade',kind:'ACCESSORY'}]},continuation:{recognizedIdentity:{},input:{},modelBudget:{}}});
   await route.fulfill({status:409,json:{...paused,action:'subject_clarification_required'}});resolve();return;
  }
  assert.equal(body.analysisId,initialId);assert.equal((await service.claimSubjectContinuation(account.session.token,body)).claimed,true);
  await service.completeAnalysisRecovery(account.session.token,{...body,state:'SUCCEEDED',statusCode:200,response:{valuation:report}});
  release=async()=>{try{await route.fulfill({json:{valuation:report}});}catch{}resolve();};
 }));
 await page.clock.install();await page.locator('#workflow-submit-button').click();const question=page.locator('[data-subject-clarification]');
 await question.getByRole('button',{name:'desk lamp',exact:true}).click();await expect(question.getByRole('button',{name:'desk lamp',exact:true})).toHaveAttribute('aria-pressed','true');
 await question.getByRole('button',{name:'Continue with selected item'}).click();await expect.poll(()=>Boolean(release)).toBe(true);
 await page.clock.runFor(60001);await expect(page.locator('.report-root')).toBeVisible();assert.equal(posts,2);await release();assert.equal(posts,2);
});
