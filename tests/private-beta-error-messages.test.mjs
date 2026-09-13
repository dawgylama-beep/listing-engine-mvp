import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
const app = fs.readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const start = app.indexOf('function getFriendlyErrorMessage(');
const end = app.indexOf('\nfunction toggleFeedbackPanel', start);
const context = { submissionStageFromError: () => 'api_response', isPhotoReadStage: () => false, isImageProcessStage: () => false, isApiTransportStage: () => true };
vm.createContext(context);
vm.runInContext(app.slice(start, end), context);
const message = (error, httpStatus) => context.getFriendlyErrorMessage(error, { errorMessage: 'Unable to check whether this is worth buying.' }, { httpStatus });
test('unknown failures do not blame photographs or echo backend details', () => {
  const result = message(new Error('private provider detail'));
  assert.match(result, /could not establish the cause/);
  assert.doesNotMatch(result, /private provider detail|close-up|clear full-item/);
});
test('service failures and throttling have actionable distinct messages', () => {
  assert.match(message(new Error('opaque error'), 502), /analysis service could not complete/);
  assert.match(message(new Error('opaque error'), 429), /request limit/);
  assert.match(message(new Error('opaque error'), 403), /not authorized/);
});
test('missing report is distinguished from insufficient item evidence', () => {
  assert.match(message({ code: 'api_report_missing' }, 200), /no usable report/);
  assert.match(message(new Error('no results'), 200), /could not find an exact match/);
});
test('known image processing failure retains specific photo advice', () => {
  assert.match(message({ code: 'image_decode_failed' }), /different copy or screenshot/);
});
