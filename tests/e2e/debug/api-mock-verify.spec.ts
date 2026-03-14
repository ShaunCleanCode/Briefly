/**
 * Debug test to verify Playwright route interception works correctly.
 * 
 * Run with: npx playwright test tests/e2e/debug/api-mock-verify.spec.ts --project=debug
 */
import { test, expect } from '../fixtures/api-mock';

test.describe('API Mock Verification @debug', () => {
  test('verifies API mock intercepts /api/onboarding/start', async ({ page, apiMock }) => {
    // Capture browser console
    const consoleLogs: string[] = [];
    page.on('console', (msg) => {
      consoleLogs.push(`[CONSOLE ${msg.type()}] ${msg.text()}`);
    });

    // Capture page errors
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => {
      pageErrors.push(`[PAGE ERROR] ${err.message}`);
    });

    console.log('[DEBUG] Test starting...');
    console.log('[DEBUG] Initial intercept count:', apiMock.getInterceptCount());
    
    // Navigate to onboarding page
    console.log('[DEBUG] Navigating to /onboarding...');
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    
    // Wait a moment for API calls to complete
    await page.waitForTimeout(3000);
    
    // Log console output
    console.log('[DEBUG] Browser console logs:');
    consoleLogs.forEach(log => console.log('  ', log));
    
    // Log page errors
    if (pageErrors.length > 0) {
      console.log('[DEBUG] Page errors:');
      pageErrors.forEach(err => console.log('  ', err));
    }
    
    // Check intercept count
    const interceptCount = apiMock.getInterceptCount();
    const interceptLog = apiMock.getInterceptLog();
    
    console.log('[DEBUG] Final intercept count:', interceptCount);
    console.log('[DEBUG] Intercept log:', JSON.stringify(interceptLog, null, 2));
    
    // Check page state
    const questionTitle = page.locator('[data-testid="question-title"]');
    const isQuestionVisible = await questionTitle.isVisible().catch(() => false);
    console.log('[DEBUG] Question title visible:', isQuestionVisible);
    
    const loadingSkeleton = page.locator('[data-testid="loading-skeleton"]');
    const isLoadingVisible = await loadingSkeleton.isVisible().catch(() => false);
    console.log('[DEBUG] Loading skeleton visible:', isLoadingVisible);
    
    const errorBanner = page.locator('[data-testid="error-banner"]');
    const isErrorVisible = await errorBanner.isVisible().catch(() => false);
    console.log('[DEBUG] Error banner visible:', isErrorVisible);
    
    if (isErrorVisible) {
      const errorText = await errorBanner.textContent();
      console.log('[DEBUG] Error text:', errorText);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-api-mock.png', fullPage: true });
    console.log('[DEBUG] Screenshot saved');
    
    // Verify interception happened
    expect(interceptCount, 'API mock should have intercepted at least one request').toBeGreaterThan(0);
  });

  test('verifies all network requests', async ({ page }) => {
    // Capture ALL requests
    const allRequests: string[] = [];
    page.on('request', (request) => {
      allRequests.push(`${request.method()} ${request.url()}`);
    });
    
    // Capture ALL responses
    const allResponses: string[] = [];
    page.on('response', (response) => {
      allResponses.push(`${response.status()} ${response.url()}`);
    });
    
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    console.log('[DEBUG] All requests made:');
    allRequests.forEach(req => console.log('  ', req));
    
    console.log('[DEBUG] All responses received:');
    allResponses.forEach(res => console.log('  ', res));
    
    // Verify some requests were made
    expect(allRequests.length).toBeGreaterThan(0);
    
    // Check if any API requests were made
    const apiRequests = allRequests.filter(req => req.includes('/api/'));
    console.log('[DEBUG] API requests:', apiRequests);
  });

  test('route interception with manual fetch', async ({ page, apiMock }) => {
    // Set up a simple route to verify interception works
    let intercepted = false;
    await page.route('**/api/test', async (route) => {
      console.log('[DEBUG] Test route intercepted!');
      intercepted = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ test: true }),
      });
    });
    
    // Navigate to onboarding
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    
    // Make a manual fetch from the page context
    const result = await page.evaluate(async () => {
      const response = await fetch('/api/test');
      return response.json();
    });
    
    console.log('[DEBUG] Manual fetch result:', result);
    console.log('[DEBUG] Test route was intercepted:', intercepted);
    
    expect(intercepted).toBe(true);
    expect(result.test).toBe(true);
  });
});
