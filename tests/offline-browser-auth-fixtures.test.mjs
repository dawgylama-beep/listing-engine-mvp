import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';
import { createCustomerAccountService, createMemoryCustomerAccountStore } from '../lib/customer-account/service.js';
import { buildBrowserHandlerResponse } from './helpers/build-browser-handler-response.mjs';
import { installHardNetworkDenial } from './helpers/hard-network-denial.mjs';
const guard = installHardNetworkDenial();
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
async function fixture() {
  const service = createCustomerAccountService({ store: createMemoryCustomerAccountStore() });
  const account = await service.register({ username: 'guard_fixture', password: 'synthetic offline fixture password' });
  const body = { analysisId: 'analysis-guard-fixture', reportType: 'marketValue', platform: '', notes: 'Unverified hand-cranked mechanism', photos: [{ name: 'fixture.jpg', dataUrl: 'data:image/jpeg;base64,' + Buffer.alloc(2048, 0x5a).toString('base64') }], buyerIntake: { purchase_intent: 'owner_value', purchase_context: 'owned_item', item_condition: 'unknown' } };
  const identity = { analysisId: body.analysisId, requestHash: hash(JSON.stringify(body)), photoHashes: body.photos.map(photo => hash(photo.dataUrl)) };
  const registered = await service.registerAnalysisRecovery(account.session.token, identity);
  body.recovery = { recoveryId: registered.recoveryId, requestHash: identity.requestHash, photoHashes: identity.photoHashes };
  return { body, service, account, context: { service, headers: { host: '127.0.0.1:4177', origin: 'http://127.0.0.1:4177', 'sec-fetch-site': 'same-origin', cookie: 'ke_beta_session=' + account.session.token, 'x-csrf-token': account.session.csrfToken }, socket: { remoteAddress: '127.0.0.1' } } };
}
test('authenticated recovery reaches actual guarded handler and settles the registered request', async () => {
  const f = await fixture();
  const result = await buildBrowserHandlerResponse({ requestBody: f.body, requestContext: f.context, evidenceMode: 'customer-model-corroboration' });
  assert.equal(result.metadata.authenticatedRecovery.state, 'SUCCEEDED');
  assert.equal(result.metadata.finalizerExecutions, 1);
  assert(result.metadata.schemas.length > 0);
  assert.equal((await f.service.readAnalysisRecovery(f.account.session.token, f.body.analysisId, f.body.recovery.recoveryId)).state, 'SUCCEEDED');
});
test('missing/cross-origin, missing session and invalid CSRF remain actual handler refusals', async () => {
  for (const [change, code] of [[headers => { delete headers.origin; }, 'REQUEST_ORIGIN_REJECTED'], [headers => { headers.origin = 'https://unrelated.example'; }, 'REQUEST_ORIGIN_REJECTED'], [headers => { delete headers.cookie; }, 'AUTHENTICATION_REQUIRED'], [headers => { headers['x-csrf-token'] = 'invalid'; }, 'CSRF_VERIFICATION_FAILED']]) {
    const f = await fixture(); change(f.context.headers);
    await assert.rejects(buildBrowserHandlerResponse({ requestBody: f.body, requestContext: f.context }), new RegExp(code));
    assert.equal((await f.service.readAnalysisRecovery(f.account.session.token, f.body.analysisId, f.body.recovery.recoveryId)).state, 'REGISTERED');
  }
});
test('changed registered inputs are refused; body-only recovery helper cannot bypass authentication', async () => {
  const f = await fixture();
  f.body.notes += ' changed';
  await assert.rejects(buildBrowserHandlerResponse({ requestBody: f.body, requestContext: f.context }), /ANALYSIS_RECOVERY_INPUT_CHANGED/);
  await assert.rejects(buildBrowserHandlerResponse({ requestBody: f.body }), /authenticated request context/);
});
test('all authentication/storage fixture work remains offline', () => assert.deepEqual(guard.attempts, []));

test('same-URL fixture settles; alternate-URL records without acquisition IDs remain refused', async () => {
  for (const alternateDuplicateUrl of [false, true]) {
    const f = await fixture();
    delete f.body.recovery;
    f.body.notes = 'Painted commemorative metal serving tray with championship wording.';
    f.body.buyerIntake.item_name = 'commemorative metal serving tray';
    const identity = { analysisId: f.body.analysisId + '-duplicate', requestHash: '', photoHashes: f.body.photos.map(photo => hash(photo.dataUrl)) };
    f.body.analysisId = identity.analysisId;
    identity.requestHash = hash(JSON.stringify(f.body));
    const registered = await f.service.registerAnalysisRecovery(f.account.session.token, identity);
    f.body.recovery = { recoveryId: registered.recoveryId, requestHash: identity.requestHash, photoHashes: identity.photoHashes };
    const execution = buildBrowserHandlerResponse({ requestBody: f.body, requestContext: f.context, evidenceMode: 'collectible', alternateDuplicateUrl });
    if (alternateDuplicateUrl) {
      await assert.rejects(execution, /SOURCE_PROVENANCE_BINDING_FAILED/);
      const terminal = await f.service.readAnalysisRecovery(f.account.session.token, f.body.analysisId, registered.recoveryId);
      assert.equal(terminal.state, 'FAILED_TERMINAL');
      assert.equal(terminal.response.code, 'SOURCE_PROVENANCE_BINDING_FAILED');
      console.log('RETAINED_MALFORMED_ALIAS_PROVENANCE_REFUSAL', JSON.stringify({ state: terminal.state, code: terminal.response.code, externalAttempts: guard.attempts.length }));
    } else {
      const result = await execution;
      assert.equal(result.metadata.authenticatedRecovery.state, 'SUCCEEDED');
      assert(result.report.customerEvidence.some(record => record.sourceProvenance?.sourceRecordId));
    }
  }
});

