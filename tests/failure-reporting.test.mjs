import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const appSource = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const accountSource = readFileSync(new URL('../public/customer-account.js', import.meta.url), 'utf8');

function between(source, start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from + start.length);
  assert(from >= 0 && to > from, `production function boundary missing: ${start}`);
  return source.slice(from, to);
}

const appProgram = [
  between(appSource, 'const submissionStages = Object.freeze({', 'const analysisDispatchReceiptKey'),
  between(appSource, 'async function handleSubmit(event) {', 'function getSelectedWorkflow()'),
  between(appSource, 'function setSubmissionStage(state, stage) {', 'function toggleFeedbackPanel()'),
  'globalThis.runSubmit = handleSubmit;'
].join('\n');

function appFixture({ registration, generation } = {}) {
  const state = {
    status: '', posts: 0, rendered: 0, receipts: [],
    photo: { name: 'synthetic.jpg', dataUrl: 'data:image/jpeg;base64,AAAA' },
    details: { hidden: true }, reference: { textContent: '' },
    form: { notes: 'synthetic item' }
  };
  const config = {
    workflow: 'owner_value', reportType: 'marketValue', responseKey: 'valuation',
    purchaseIntent: 'owner_value', sections: [], errorMessage: 'Analysis failed',
    platformRequired: false, notesRequired: false
  };
  const context = {
    form: state.form,
    FormData: class { get(name) { return name === 'notes' ? state.form.notes : ''; } },
    workflowConfigs: { owner_value: config },
    getSelectedWorkflow: () => 'owner_value',
    showUnconfirmedSubmission: () => false,
    clearFormErrors() {}, syncWorkflowFormState() {},
    buildWorkflowNotes: (_config, _data, notes) => notes,
    validateVisibleCurrencyFields: () => '', validateBuyerPurchaseContext: () => '',
    getSelectedPhotoFiles: () => [state.photo],
    clearWorkflowOutput() {}, showFormError() {},
    setStatus(message) { state.status = message; },
    latestReport: null, latestSections: [], activeItemSession: null,
    clearItemSession() {}, resetCopyAllButton() {}, setOutputHeading() {},
    startWorkflowRequest: () => ({ id: 1, analysisId: 'analysis-fixed-reference', controller: { signal: {} } }),
    document: { querySelector(selector) {
      if (selector === '#analysis-failure-details') return state.details;
      if (selector === '#analysis-failure-reference') return state.reference;
      throw new Error(`Unexpected DOM selector: ${selector}`);
    } },
    setLoading() {}, startLoadingProgress() {}, stopLoadingProgress() {},
    preparePhotos: async () => [state.photo], isCurrentRequest: () => true,
    getBuyerIntake: () => ({}), sha256Browser: async () => 'a'.repeat(64),
    crypto: { subtle: {} },
    KatherinesEyeCustomerAccount: {
      registerAnalysis: registration || (async () => ({ state: 'REGISTERED', recoveryId: `recovery_${'r'.repeat(32)}` })),
      getCsrfToken: () => 'synthetic-csrf'
    },
    writeAnalysisDispatchReceipt(receipt) { state.receipts.push(receipt); return true; },
    KatherinesEyeObservation: { async readJson(...args) {
      state.posts += 1;
      if (generation) return generation(...args);
      args[3]?.({ status: 200 });
      return { response: { ok: true, status: 200 }, data: { valuation: { id: 'synthetic-report' } } };
    } },
    recoverInterruptedAnalysis() {}, renderSubjectClarificationCard() {},
    renderIdentityConfirmationCard() {},
    getSectionsForReport: () => [], createItemSession: () => ({}),
    getDisplayConfig: () => config,
    renderReport() { state.rendered += 1; }, renderAskPanel() {},
    clearStatus() { state.status = ''; }, copyAllButton: { disabled: true },
    renderEmpty() {}, activeRequestController: null
  };
  vm.runInNewContext(appProgram, context, { filename: 'public/app.js' });
  return { state, context, run: () => context.runSubmit({ preventDefault() {} }) };
}

test('registration 401 retains the reference and fixture inputs, and never sends generation', async () => {
  const f = appFixture({ registration: async () => {
    throw Object.assign(new Error('Sign in'), { code: 'authentication_required', status: 401 });
  } });
  await f.run();
  assert.equal(f.state.posts, 0);
  assert.equal(f.state.receipts.length, 0);
  assert.match(f.state.reference.textContent, /analysis-fixed-reference; stage: analysis_registration; HTTP: 401/);
  assert.match(f.state.status, /Sign in again/);
  assert.match(f.state.status, /No analysis request was sent/);
  assert.equal(f.state.photo.name, 'synthetic.jpg');
  assert.equal(f.state.form.notes, 'synthetic item');
});

test('registration transport failure before headers is not mislabeled as generation failure', async () => {
  const f = appFixture({ registration: async () => { throw new TypeError('Failed to fetch'); } });
  await f.run();
  assert.equal(f.state.posts, 0);
  assert.match(f.state.reference.textContent, /stage: analysis_registration; HTTP: no response/);
  assert.match(f.state.status, /could not confirm analysis registration/i);
  assert.match(f.state.status, /do not submit this item again/i);
});

test('registered generation transport failure retains the same ID and writes an uncertain-dispatch receipt', async () => {
  const f = appFixture({ generation: async () => { throw Object.assign(new Error('Load failed'), { code: 'OBSERVATION_TRANSPORT' }); } });
  await f.run();
  assert.equal(f.state.posts, 1);
  assert.deepEqual(f.state.receipts.map(receipt => receipt.state), ['dispatch_unconfirmed', 'response_unreadable']);
  assert(f.state.receipts.every(receipt => receipt.analysisId === 'analysis-fixed-reference'));
  assert.match(f.state.reference.textContent, /stage: api_request; HTTP: no response/);
  assert.match(f.state.status, /do not submit this item again/i);
});

test('generation headers preserve observed HTTP status and response stage on interruption', async () => {
  const f = appFixture({ generation: async (_url, _options, _timeout, onHeaders) => {
    onHeaders({ status: 502 });
    throw Object.assign(new Error('Unreadable body'), { observedHttpStatus: 502 });
  } });
  await f.run();
  assert.equal(f.state.posts, 1);
  assert.match(f.state.reference.textContent, /stage: api_response; HTTP: 502/);
  assert.match(f.state.status, /do not submit this item again/i);
});

test('valid registered response still renders once without a failure reference', async () => {
  const f = appFixture();
  await f.run();
  assert.equal(f.state.posts, 1);
  assert.equal(f.state.rendered, 1);
  assert.equal(f.state.details.hidden, true);
  assert.equal(f.state.receipts.at(-1).state, 'report_received');
});

const accountProgram = [
  between(accountSource, 'async function requestAccount(url =', 'function setAccountStatus('),
  'globalThis.runAccountRequest = requestAccount;'
].join('\n');

function accountFixture({ getResponse, postResponse } = {}) {
  const state = { renders: 0, photo: 'synthetic-photo', form: 'synthetic-form', calls: 0 };
  const context = {
    root: { KatherinesEyeObservation: { async readJson(_url, _options, _timeout, onHeaders) {
      state.calls += 1;
      if (getResponse) return getResponse(onHeaders);
      onHeaders({ status: 200 });
      return { response: { ok: true, status: 200 }, data: { account: { username: 'tester' } } };
    } } },
    fetch: async () => {
      state.calls += 1;
      return postResponse ? postResponse() : { ok: true, status: 200, json: async () => ({ csrfToken: 'new-csrf' }) };
    },
    account: { username: 'tester' }, csrfToken: 'old-csrf',
    cleanText: value => String(value),
    renderAccountState() { state.renders += 1; },
  };
  vm.runInNewContext(accountProgram, context, { filename: 'public/customer-account.js' });
  return { state, context, request: (...args) => context.runAccountRequest(...args) };
}

test('definitive registration 401 reconciles cached sign-in without touching photo or form', async () => {
  const f = accountFixture({ postResponse: async () => ({ ok: false, status: 401, json: async () => ({ code: 'authentication_required' }) }) });
  await assert.rejects(f.request('/api/customer-account', { method: 'POST', body: '{"action":"register_analysis"}' }), error => error.status === 401);
  assert.equal(f.context.account, null);
  assert.equal(f.context.csrfToken, '');
  assert.equal(f.state.renders, 1);
  assert.equal(f.state.photo, 'synthetic-photo');
  assert.equal(f.state.form, 'synthetic-form');
  assert.equal(f.state.calls, 1);
});

test('definitive history 401 also clears stale account state', async () => {
  const f = accountFixture({ getResponse: async onHeaders => {
    onHeaders({ status: 401 });
    return { response: { ok: false, status: 401 }, data: { code: 'authentication_required' } };
  } });
  await assert.rejects(f.request('/api/customer-account?action=history'), error => error.status === 401);
  assert.equal(f.context.account, null);
  assert.equal(f.context.csrfToken, '');
  assert.equal(f.state.renders, 1);
  assert.equal(f.state.photo, 'synthetic-photo');
  assert.equal(f.state.form, 'synthetic-form');
});

test('transport failure before headers retains cached session rather than claiming logout', async () => {
  const f = accountFixture({ getResponse: async () => { throw new TypeError('Failed to fetch'); } });
  await assert.rejects(f.request('/api/customer-account?action=history'), error => error.code === 'account_service_unavailable' && error.status === 0);
  assert.equal(f.context.account.username, 'tester');
  assert.equal(f.state.renders, 0);
});

test('unreadable 401 keeps account state unconfirmed rather than claiming session expiry', async () => {
  const f = accountFixture({ getResponse: async onHeaders => { onHeaders({ status: 401 }); throw new Error('Unreadable body'); } });
  await assert.rejects(f.request('/api/customer-account?action=history'), error => error.status === 401 && error.code === 'account_response_unreadable');
  assert.equal(f.context.account.username, 'tester');
  assert.equal(f.state.renders, 0);
});

test('non-JSON registration 401 cannot masquerade as definitive account logout', async () => {
  const f = accountFixture({ postResponse: async () => ({ ok: false, status: 401, json: async () => { throw new Error('HTML protection response'); } }) });
  await assert.rejects(f.request('/api/customer-account', { method: 'POST', body: '{"action":"register_analysis"}' }), error => error.status === 401 && error.code === 'account_request_failed');
  assert.equal(f.context.account.username, 'tester');
  assert.equal(f.state.renders, 0);
  const app = appFixture({ registration: async () => { throw Object.assign(new Error('Rejected'), { status: 401, code: 'account_request_failed' }); } });
  await app.run();
  assert.match(app.state.reference.textContent, /stage: analysis_registration; HTTP: 401/);
  assert.doesNotMatch(app.state.status, /Sign in again/);
  assert.equal(app.state.posts, 0);
});

test('late old-session 401 cannot clear a newly logged-in account', async () => {
  let finish;
  const f = accountFixture({ postResponse: () => new Promise(resolve => { finish = resolve; }) });
  const pending = f.request('/api/customer-account', { method: 'POST', body: '{"action":"register_analysis"}' });
  f.context.account = { username: 'new-session' };
  f.context.csrfToken = 'new-session-csrf';
  finish({ ok: false, status: 401, json: async () => ({ code: 'authentication_required', error: 'Sign in to continue.' }) });
  await assert.rejects(pending, error => error.status === 401 && error.code === 'stale_account_response' && !/sign in/i.test(error.message));
  assert.equal(f.context.account.username, 'new-session');
  assert.equal(f.context.csrfToken, 'new-session-csrf');
  assert.equal(f.state.renders, 0);
  const app = appFixture({ registration: async () => { throw Object.assign(new Error('Old session rejected'), { status: 401, code: 'stale_account_response' }); } });
  await app.run();
  assert.doesNotMatch(app.state.status, /Sign in again/);
  assert.match(app.state.status, /could not confirm analysis registration/i);
});

test('late successful account read cannot replace the newer session CSRF token', async () => {
  let finish;
  const f = accountFixture({ getResponse: () => new Promise(resolve => { finish = resolve; }) });
  const pending = f.request('/api/customer-account?action=session');
  f.context.account = { username: 'new-session' };
  f.context.csrfToken = 'new-session-csrf';
  finish({ response: { ok: true, status: 200 }, data: { csrfToken: 'old-session-csrf' } });
  await pending;
  assert.equal(f.context.csrfToken, 'new-session-csrf');
});

test('late initial hydration cannot erase a newer login on failure or success', async () => {
  const program = between(accountSource, 'async function hydrateSession() {', 'function focusableAccountElements()') + '\nglobalThis.runHydration = hydrateSession;';
  for (const settle of ['reject', 'resolve']) {
    let finish;
    const context = {
      account: null, accountServiceAvailable: null, csrfToken: 'initial-csrf',
      requestAccount: () => new Promise((resolve, reject) => { finish = { resolve, reject }; }),
      renderAccountState() { throw new Error('Stale hydration must not render'); }
    };
    vm.runInNewContext(program, context);
    const pending = context.runHydration();
    context.account = { username: 'new-session' };
    context.accountServiceAvailable = true;
    context.csrfToken = 'new-session-csrf';
    if (settle === 'reject') finish.reject(new Error('Old hydration failed'));
    else finish.resolve({ account: { username: 'old-session' } });
    await pending;
    assert.equal(context.account.username, 'new-session');
    assert.equal(context.accountServiceAvailable, true);
    assert.equal(context.csrfToken, 'new-session-csrf');
  }
});

test('successful account request retains account and CSRF refresh', async () => {
  const f = accountFixture();
  const result = await f.request('/api/customer-account', { method: 'POST', body: '{"action":"register_analysis"}' });
  assert.equal(result.csrfToken, 'new-csrf');
  assert.equal(f.context.account.username, 'tester');
  assert.equal(f.context.csrfToken, 'new-csrf');
  assert.equal(f.state.renders, 0);
});

test('failed receipt lookup does not claim that an earlier evaluation never ran', async () => {
  const context = {
    receiptRefresh: { disabled: false }, receiptList: { textContent: '' },
    requestAccount: async () => { throw new Error('synthetic lookup failure'); }
  };
  vm.runInNewContext(between(accountSource, "async function loadAnalysisReceipts(cursor='',append=false){", 'let account = null;') + '\nglobalThis.runReceipts = loadAnalysisReceipts;', context);
  await context.runReceipts();
  assert.match(context.receiptList.textContent, /does not establish whether an earlier analysis ran or incurred charges/);
  assert.equal(context.receiptRefresh.disabled, false);
});
