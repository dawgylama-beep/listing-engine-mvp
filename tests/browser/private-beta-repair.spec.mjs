import { installOfflineBrowserAccount } from "../helpers/offline-browser-account.mjs";
import { expect, test } from '@playwright/test';
import { sessionToken } from '../../api/customer-account.js';
import { buildBrowserHandlerResponse } from '../helpers/build-browser-handler-response.mjs';

async function accounts(page, { signedIn = false } = {}) {
  return installOfflineBrowserAccount(page, { signedIn, username: "http_failure_fixture" });
}
async function photo(page) {
  const data = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 100;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ac7430'; ctx.fillRect(10, 10, 80, 80);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#photos').setInputFiles({ name: 'test-object.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') });
  await page.locator('#purchase_context').selectOption('online_retailer');
  await page.locator('#retailer_or_marketplace_name').fill('Example retailer');
  await page.locator('#asking_price').fill('5.50');
}

test('first visit exposes account entry and focuses the selected form', async ({ page }) => {
  await accounts(page); await page.goto('/');
  await expect(page.locator('#account-menu-button')).toHaveText('Sign in');
  await expect(page.locator('#account-create-button')).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('account-entry.png') });
  await page.locator('#account-menu-button').click();
  await expect(page.locator('#login-username')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#account-menu-button')).toBeFocused();
  await page.locator('#account-create-button').click();
  await expect(page.locator('#register-username')).toBeFocused();
  await expect(page.locator('#password-recovery-note')).toContainText('Password reset is not available');
});

for (const status of [502, 429, 200]) {
  test(`analysis HTTP ${status} failure preserves photos and safe evidence`, async ({ page }) => {
    const fixture = await accounts(page, { signedIn: true });
    let submitted;
    let submissions = 0;
    await page.route('**/api/generate-listing', async route => {
      submissions += 1;
      submitted = route.request().postDataJSON();
      const token = sessionToken({ headers: await route.request().allHeaders() });
      const claimed = await fixture.service.claimAnalysisRecovery(token, { analysisId: submitted.analysisId, ...submitted.recovery });
      expect(claimed.claimed).toBe(true);
      await fixture.service.completeAnalysisRecovery(token, { analysisId: submitted.analysisId, recoveryId: submitted.recovery.recoveryId, state: "FAILED_TERMINAL", statusCode: status, response: { error: status === 429 ? "The request limit was reached. No automatic retry will occur." : status === 200 ? "The response contained no usable report. No automatic retry will occur." : "The analysis service could not complete this request. No automatic retry will occur." } });
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'opaque backend failure secret-do-not-display' }) });
    });
    await page.goto('/'); await photo(page);
    await page.locator('#workflow-submit-button').click();
    await expect(page.locator('#status')).toContainText(status === 429 ? 'request limit' : status === 200 ? 'no usable report' : 'analysis service could not complete');
    expect(submitted.buyerIntake.purchase_context).toBe('online_retailer');
    expect(submitted.photos.length).toBe(1);
    await expect(page.locator('#analysis-failure-details')).toBeVisible();
    await expect(page.locator('#analysis-failure-reference')).toContainText(submitted.analysisId);
    await expect(page.locator('#analysis-failure-reference')).toContainText(`HTTP: ${status}`);
    await expect(page.locator('body')).not.toContainText('secret-do-not-display');
    await expect(page.locator('#status')).not.toContainText('close-up');
    expect(await page.evaluate(() => getSelectedPhotoFiles().length)).toBe(1);
    await expect(page.locator('#workflow-submit-button')).toBeDisabled();
    expect((await fixture.service.readAnalysisRecovery(fixture.account.session.token, submitted.analysisId, submitted.recovery.recoveryId)).state).toBe('FAILED_TERMINAL');
    expect(submissions).toBe(1);
    await page.locator('#analysis-new-item-after-unknown').click();
    await expect(page.locator('#workflow-submit-button')).toBeEnabled();
    expect(await page.evaluate(() => getSelectedPhotoFiles().length)).toBe(0);
    expect(submissions).toBe(1);
    await fixture.service.deleteAccount(fixture.account.session.token, 'synthetic offline fixture password');
    const cleared = await fixture.store.read();
    expect(Object.keys(cleared.accounts)).toHaveLength(0);
    expect(Object.keys(cleared.analysisRecoveries)).toHaveLength(0);
    expect(Object.keys(cleared.analysisReplay)).toHaveLength(0);
  });
}

test('actual account lifecycle saves a report from the real handler with controlled providers', async ({ page }) => {
  test.setTimeout(90000);
  const fixture = await accounts(page);
  let analysisRequests = 0;
  await page.route('**/api/generate-listing', async route => {
    analysisRequests++;
    const response = await buildBrowserHandlerResponse({ requestBody: route.request().postDataJSON(), requestContext: await fixture.analysisContext(route.request()) });
    await route.fulfill({ status: response.statusCode || 200, contentType: 'application/json', body: JSON.stringify(response.payload) });
  });
  await page.goto('/'); await page.locator('#account-create-button').click();
  await page.locator('#register-username').fill('beta_tester');
  await page.locator('#register-preferred-name').fill('Tester');
  await page.locator('#register-password').fill('isolated test password');
  await page.locator('#account-consent').check();
  await page.locator('#account-register-form button[type=submit]').click();
  await expect(page.locator('#account-username')).toHaveText('@beta_tester');
  await page.locator('#account-close-button').click();
  await photo(page); await page.locator('#workflow-submit-button').click();
  await expect(page.locator('#save-listing-button')).toBeVisible({ timeout: 60000 });
  expect(analysisRequests).toBe(1);
  await page.locator('#save-listing-button').click();
  await expect(page.locator('#status')).toContainText('Saved privately');
  await page.locator('#account-menu-button').click();
  await page.locator('#account-signout-button').click();
  await page.locator('#login-username').fill('beta_tester');
  await page.locator('#login-password').fill('isolated test password');
  await page.locator('#account-login-form button[type=submit]').click();
  await expect(page.locator('#account-username')).toHaveText('@beta_tester');
  await page.locator('#account-history-button').click();
  await expect(page.locator('.history-item')).toHaveCount(1);
  await page.locator('.history-item').getByRole('button', { name: 'View', exact: true }).click();
  await expect(page.locator('#history-detail')).not.toBeEmpty();
});
