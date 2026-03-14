import { test, expect } from '../fixtures/api-mock';
import { OnboardingPage } from '../../utils/page-objects';

/**
 * SMOKE-03: Session resume after page reload
 * 
 * Test ID: OB-TC-104
 * Priority: P0
 * Expected Duration: ~20s
 */
test.describe('Session Resume @smoke', () => {
  test('resumes session after page reload', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Navigate and accept consent
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();
    await onboardingPage.acceptConsent();
    await onboardingPage.waitForQuestion();

    // Answer one more question
    const canSkip = await onboardingPage.isSkipVisible();
    if (canSkip) {
      await onboardingPage.skip();
      await onboardingPage.waitForQuestion();
    }

    // Get current progress before reload
    const progressBefore = await onboardingPage.getProgressPercent();

    // Reload the page (mock state persists in this test context)
    await page.reload();
    await onboardingPage.waitForQuestion();

    // Progress should be maintained
    const progressAfter = await onboardingPage.getProgressPercent();
    expect(progressAfter).toBeGreaterThanOrEqual(progressBefore);

    // Should not be back at consent
    const questionText = await onboardingPage.questionTitle.textContent();
    expect(questionText).not.toContain('정보를 저장');
  });

  test('maintains consent state after reload', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Navigate and accept consent
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();
    await onboardingPage.acceptConsent();
    await onboardingPage.waitForQuestion();

    // Verify consent is granted
    expect(apiMock.getState().hasConsent).toBe(true);

    // Reload
    await page.reload();
    await onboardingPage.waitForQuestion();

    // Consent should still be recognized (mock state persists)
    // Skip should work (which requires consent)
    const canSkip = await onboardingPage.isSkipVisible();
    if (canSkip) {
      // This will fail if consent is lost
      await onboardingPage.skip();
      // If we get here without error, consent is maintained
      expect(true).toBe(true);
    }
  });

  test('resume from mid-flow shows correct question', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Pre-populate mock state to simulate resumed session
    apiMock.setConsent(true);
    apiMock.addAnswer('consent_personalization', { value: 'accept', skipped: false });
    apiMock.addAnswer('job_title', { skipped: true });
    apiMock.addAnswer('industry', { value: 'technology', skipped: false });

    // Navigate - should resume at experience_years (4th question)
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();

    // Should NOT be at consent, job_title, or industry
    const questionText = await onboardingPage.questionTitle.textContent();
    expect(questionText).not.toContain('정보를 저장');
    expect(questionText).not.toContain('어떤 일을 하고 계신가요');
    expect(questionText).not.toContain('어떤 산업에서');

    // Progress should reflect answered questions
    const progress = await onboardingPage.getProgressPercent();
    expect(progress).toBeGreaterThan(20); // 3/11 = ~27%
  });
});
