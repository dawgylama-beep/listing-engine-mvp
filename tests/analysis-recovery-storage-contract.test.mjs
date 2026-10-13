import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const names = ['readAnalysisDispatchReceipt', 'writeAnalysisDispatchReceipt', 'clearAnalysisDispatchReceipt'];
const functionSource = name => { const start = source.indexOf(`function ${name}(`); return source.slice(start, source.indexOf('\nfunction ', start + 1)); };
const allowed = ['analysisId', 'recoveryId', 'workflow', 'state', 'startedAt', 'updatedAt', 'httpStatus'];
function runtime(writer = functionSource(names[1])) {
  const storage = new Map(); const operations = [];
  const context = vm.createContext({ Date, recoveryStatusTimer: null, clearTimeout() {}, analysisDispatchReceiptKey: 'katherine-eye.analysis-dispatch.v1', sessionStorage: {
    getItem(key) { operations.push(['read', key]); return storage.get(key) ?? null; },
    setItem(key, value) { operations.push(['write', key]); storage.set(key, value); },
    removeItem(key) { operations.push(['remove', key]); storage.delete(key); }
  }});
  vm.runInContext(functionSource(names[0]) + '\n' + writer + '\n' + functionSource(names[2]), context);
  return { context, storage, operations };
}
test('actual recovery writer stores only the accepted content-free fields under its namespace', () => {
  const { context, storage, operations } = runtime();
  assert.equal(context.writeAnalysisDispatchReceipt({ analysisId: 'analysis-storage-fixture', recoveryId: 'recovery_' + 'a'.repeat(32), workflow: 'buyer', state: 'dispatch_unconfirmed', httpStatus: 0,
    photos: 'PRIVATE_PHOTO_SENTINEL', requestBody: 'PRIVATE_ITEM_SENTINEL', password: 'PRIVATE_CREDENTIAL_SENTINEL', coordinates: 'PRIVATE_LOCATION_SENTINEL', account: 'PRIVATE_ACCOUNT_SENTINEL' }), true);
  const value = JSON.parse(storage.get('katherine-eye.analysis-dispatch.v1'));
  assert.deepEqual(Object.keys(value).sort(), allowed.slice().sort());
  assert(!JSON.stringify(value).includes('PRIVATE_'));
  assert(operations.every(([, key]) => key === 'katherine-eye.analysis-dispatch.v1'));
  assert.equal(context.readAnalysisDispatchReceipt().analysisId, 'analysis-storage-fixture');
  assert.equal(context.clearAnalysisDispatchReceipt(), true); assert.equal(storage.size, 0);
});
test('missing, malformed and invalid recovery markers fail closed', () => {
  for (const value of ['not-json', JSON.stringify({ analysisId: 'short', state: 'dispatch_unconfirmed' }), JSON.stringify({ analysisId: 'analysis-valid-fixture', state: 'unknown-state' }), JSON.stringify({ analysisId: 'analysis-valid-fixture', state: 'dispatch_unconfirmed', recoveryId: 'invalid' })]) {
    const { context, storage } = runtime(); storage.set('katherine-eye.analysis-dispatch.v1', value);
    assert.equal(context.readAnalysisDispatchReceipt(), null);
  }
});
test('storage privacy negative controls detect a writer that persists private inputs', () => {
  for (const field of ['photos', 'requestBody', 'password', 'coordinates', 'account']) {
    const mutant = functionSource(names[1]).replace('    analysisId,', `    ${field}: "PRIVATE_SENTINEL",\n    analysisId,`);
    const { context, storage } = runtime(mutant);
    context.writeAnalysisDispatchReceipt({ analysisId: 'analysis-negative-fixture', workflow: 'buyer', state: 'dispatch_unconfirmed' });
    assert.notDeepEqual(Object.keys(JSON.parse(storage.get('katherine-eye.analysis-dispatch.v1'))).sort(), allowed.slice().sort());
  }
});
test('no local storage or session storage outside the three restricted recovery helpers', () => {
  assert.doesNotMatch(source, /localStorage/);
  const calls = [...source.matchAll(/sessionStorage\.(getItem|setItem|removeItem)\(([^)]*)\)/g)];
  assert.equal(calls.length, 3);
  assert.deepEqual(calls.map(call => call[1]), ['getItem', 'setItem', 'removeItem']);
  for (let i = 0; i < calls.length; i++) {
    assert(calls[i][2].startsWith('analysisDispatchReceiptKey'));
    assert(functionSource(names[i]).includes(calls[i][0]));
  }
});
