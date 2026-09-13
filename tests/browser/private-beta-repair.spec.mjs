import { expect, test } from '@playwright/test';
import { createCustomerAccountHandler } from '../../api/customer-account.js';
import { createCustomerAccountService, createMemoryCustomerAccountStore } from '../../lib/customer-account/service.js';
import { buildBrowserHandlerResponse } from '../helpers/build-browser-handler-response.mjs';

async function accounts(page) {
  const handler = createCustomerAccountHandler({ service: createCustomerAccountService({ store: createMemoryCustomerAccountStore() }) });
  await page.route('**/api/customer-account**', async route => {
    const request = route.request();
    const response = { statusCode: 200, headers: {}, payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[name.toLowerCase()] = String(value); },
      json(payload) { this.payload = payload; return this; }
    };
    await handler({ method: request.method(), url: request.url(), headers: { ...await request.allHeaders(), host: new URL(request.url()).host }, body: request.postData() }, response);
    await route.fulfill({ status: response.statusCode, headers: response.headers, body: JSON.stringify(response.payload) });
  });
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
    await accounts(page);
    let submitted;
    await page.route('**/api/generate-listing', async route => {
      submitted = route.request().postDataJSON();
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
    await expect(page.locator('#workflow-submit-button')).toBeEnabled();
  });
}

test('actual account lifecycle saves a report from the real handler with controlled providers', async ({ page }) => {
  test.setTimeout(90000);
  await accounts(page);
  let analysisRequests = 0;
  await page.route('**/api/generate-listing', async route => {
    analysisRequests++;
    const response = await buildBrowserHandlerResponse({ requestBody: route.request().postDataJSON() });
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
