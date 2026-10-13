import assert from 'node:assert/strict';
import { test, expect } from '@playwright/test';
import { buildControlledCustomerModelCorroborationReport } from '../helpers/build-browser-handler-response.mjs';

test('candidate selection audit remains collapsed, literal and preserved in report text', async ({ page }) => {
  const report = await buildControlledCustomerModelCorroborationReport();
  const audit = report.searchDiagnostics.candidateAudit;
  assert(audit.length > 0);
  let external = 0, mutations = 0;
  await page.route('**/*', async route => {
    const request = route.request();
    if (new URL(request.url()).hostname !== '127.0.0.1') { external++; return route.abort('blockedbyclient'); }
    if (request.method() !== 'GET') { mutations++; return route.abort('blockedbyclient'); }
    if (new URL(request.url()).pathname.startsWith('/api/')) return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ authenticated: false }) });
    return route.continue();
  });
  await page.goto('/');
  const result = await page.evaluate(report => {
    renderReport(report, getSectionsForReport(workflowConfigs[currentWorkflow], report));
    const node = document.querySelector('.search-diagnostics');
    const details = node?.closest('details');
    const text = formatSearchDiagnosticsText(report.searchDiagnostics);
    const hostile = renderSearchDiagnostics({ candidateAudit: [{ candidateId: 'literal-id', disposition: 'EXCLUDED', reason: '<img src=x onerror=alert(1)>', url: 'https://market.example/listing/one' }] });
    return { rendered: node?.textContent || '', detailsOpen: details?.open, insideDetails: Boolean(details), text, hostileText: hostile.textContent, injectedImages: hostile.querySelectorAll('img').length };
  }, report);
  expect(result.insideDetails).toBe(true);
  expect(result.detailsOpen).toBe(false);
  for (const candidate of audit) {
    expect(result.rendered).toContain(candidate.candidateId);
    expect(result.text).toContain(candidate.candidateId);
    expect(result.text).toContain(candidate.disposition);
    expect(result.text).toContain(candidate.reason);
  }
  expect(result.hostileText).toContain('<img'); expect(result.injectedImages).toBe(0);
  expect(external).toBe(0); expect(mutations).toBe(0);
});
