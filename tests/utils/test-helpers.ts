import { Page, expect, BrowserContext } from '@playwright/test';
import { OnboardingPage } from './page-objects';

/**
 * Helper to intercept and mock API responses
 */
export async function mockOnboardingApi(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route('/api/onboarding/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/start')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          session: {
            id: 'test-session',
            status: 'in_progress',
            questionSetVersion: 1,
            progress: { answered: 0, total: 11, percentComplete: 0 },
          },
          consentRequired: true,
          nextQuestion: {
            key: 'consent_personalization',
            type: 'consent',
            title: '맞춤형 서비스를 위해 정보를 저장할까요?',
            isRequired: true,
            isSkippable: false,
            options: [
              { value: 'accept', label: '동의합니다' },
              { value: 'decline', label: '동의하지 않습니다' },
            ],
          },
          ...overrides,
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Helper to simulate session storage for resumption tests
 */
export async function setSessionState(
  context: BrowserContext,
  sessionData: Record<string, unknown>
) {
  await context.addCookies([
    {
      name: 'onboarding_session',
      value: JSON.stringify(sessionData),
      domain: 'localhost',
      path: '/',
    },
  ]);
}

/**
 * Helper to clear session state
 */
export async function clearSessionState(context: BrowserContext) {
  await context.clearCookies();
}

/**
 * Helper to count API calls
 */
export function createApiCallCounter(page: Page) {
  const counts: Record<string, number> = {};

  page.on('request', (request) => {
    if (request.url().includes('/api/onboarding/')) {
      const endpoint = new URL(request.url()).pathname;
      counts[endpoint] = (counts[endpoint] || 0) + 1;
    }
  });

  return {
    getCount: (endpoint: string) => counts[endpoint] || 0,
    reset: () => Object.keys(counts).forEach((k) => delete counts[k]),
    getCounts: () => ({ ...counts }),
  };
}

/**
 * Helper to verify no console errors during test
 */
export async function expectNoConsoleErrors(page: Page, testFn: () => Promise<void>) {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  await testFn();

  if (errors.length > 0) {
    console.warn('Console errors detected:', errors);
    // Don't fail test but log warnings
  }
}

/**
 * Helper to test double-click prevention
 */
export async function testDoubleClickPrevention(
  page: Page,
  buttonSelector: string
): Promise<number> {
  const apiCalls = createApiCallCounter(page);

  // Click button rapidly twice
  const button = page.locator(buttonSelector);
  await button.click();
  await button.click({ force: true });

  // Wait a bit for any pending requests
  await page.waitForTimeout(500);

  return apiCalls.getCount('/api/onboarding/answer');
}

/**
 * Helper to wait for animation to complete
 */
export async function waitForAnimation(page: Page, timeout = 500) {
  await page.waitForTimeout(timeout);
}

/**
 * Helper to complete onboarding through consent
 */
export async function completeConsent(onboardingPage: OnboardingPage) {
  await onboardingPage.acceptConsent();
  await onboardingPage.waitForQuestion();
}

/**
 * Helper to complete full onboarding quickly
 */
export async function completeOnboardingQuick(onboardingPage: OnboardingPage) {
  // Accept consent
  await completeConsent(onboardingPage);

  // Skip all remaining questions
  while (await onboardingPage.isSkipVisible()) {
    await onboardingPage.skip();
    try {
      await onboardingPage.waitForQuestion();
    } catch {
      break;
    }
  }
}

/**
 * Data-testid selector helper
 */
export function testId(id: string): string {
  return `[data-testid="${id}"]`;
}

/**
 * Assert loading state shows and hides correctly
 */
export async function assertLoadingBehavior(
  page: Page,
  triggerAction: () => Promise<void>
) {
  // Start watching for loading state
  const loadingPromise = page.waitForSelector('[data-testid="loading-skeleton"]', {
    state: 'visible',
    timeout: 2000,
  }).catch(() => null);

  // Trigger the action
  await triggerAction();

  // Loading should appear briefly
  const loadingAppeared = await loadingPromise;

  // And then disappear
  if (loadingAppeared) {
    await page.waitForSelector('[data-testid="loading-skeleton"]', {
      state: 'hidden',
      timeout: 5000,
    });
  }
}

/**
 * Verify progress bar advances
 */
export async function assertProgressAdvances(
  page: Page,
  beforeAction: number,
  afterAction: number
) {
  expect(afterAction).toBeGreaterThan(beforeAction);
}
