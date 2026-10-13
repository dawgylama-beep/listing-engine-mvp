import { createCustomerAccountHandler } from '../../api/customer-account.js';
import { createCustomerAccountService, createMemoryCustomerAccountStore } from '../../lib/customer-account/service.js';

// Synthetic, per-test account state. Production Origin, cookie, CSRF and recovery
// validation execute normally; only provider adapters are replaced by fixtures.
export async function browserAnalysisContext(request, service) {
  const headers = await request.allHeaders();
  const url = new URL(request.url());
  headers.host ||= url.host;
  return { headers, service, url: `${url.pathname}${url.search}`, socket: { remoteAddress: '127.0.0.1' } };
}

export async function installOfflineBrowserAccount(page, { signedIn = true, username = 'offline_fixture' } = {}) {
  const store = createMemoryCustomerAccountStore();
  const service = createCustomerAccountService({ store });
  const handler = createCustomerAccountHandler({ service, environment: {} });
  let account = null;
  if (signedIn) {
    account = await service.register({ username, password: 'synthetic offline fixture password' });
    await page.context().addCookies([{ name: 'ke_beta_session', value: account.session.token,
      url: 'http://127.0.0.1:4177', httpOnly: true, sameSite: 'Strict' }]);
  }
  await page.route('**/api/customer-account**', async route => {
    const request = route.request();
    const context = await browserAnalysisContext(request, service);
    const response = { statusCode: 200, headers: {}, payload: null,
      status(code) { this.statusCode = code; return this; },
      setHeader(name, value) { this.headers[name.toLowerCase()] = String(value); },
      json(payload) { this.payload = payload; return this; } };
    await handler({ method: request.method(), url: context.url, headers: context.headers,
      body: request.postData(), socket: context.socket }, response);
    await route.fulfill({ status: response.statusCode, headers: response.headers,
      contentType: 'application/json', body: JSON.stringify(response.payload) });
  });
  return { store, service, account, analysisContext: request => browserAnalysisContext(request, service) };
}
