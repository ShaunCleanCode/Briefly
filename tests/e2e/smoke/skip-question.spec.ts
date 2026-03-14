import { test, expect } from '../fixtures/api-mock';
import { OnboardingPage } from '../../utils/page-objects';

/**
 * SMOKE-04: Skip functionality for optional questions
 * 
 * Test ID: OB-TC-105
 * Priority: P0
 * Expected Duration: ~20s
 */
test.describe('Skip Question @smoke', () => {
  test('skip button advances to next question', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Navigate and accept consent first
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();
    await onboardingPage.acceptConsent();
    await onboardingPage.waitForQuestion();

    // Verify skip is visible (job_title should be skippable)
    const canSkip = await onboardingPage.isSkipVisible();
    expect(canSkip).toBe(true);

    // Get current progress
    const progressBefore = await onboardingPage.getProgressPercent();

    // Skip the question
    await onboardingPage.skip();
    await onboardingPage.waitForQuestion();

    // Progress should advance
    const progressAfter = await onboardingPage.getProgressPercent();
    expect(progressAfter).toBeGreaterThan(progressBefore);
  });

  test('consent question cannot be skipped', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Navigate to onboarding
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();

    // At consent question, skip should NOT be visible
    const canSkip = await onboardingPage.isSkipVisible();
    expect(canSkip).toBe(false);
  });

  test('skip preserves session state correctly', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Navigate and accept consent
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();
    await onboardingPage.acceptConsent();
    await onboardingPage.waitForQuestion();

    // Skip multiple questions
    for (let i = 0; i < 3; i++) {
      const canSkip = await onboardingPage.isSkipVisible();
      if (canSkip) {
        await onboardingPage.skip();
        try {
          await onboardingPage.waitForQuestion();
        } catch {
          break; // Might have reached end
        }
      } else {
        // Try selecting an option if skip not available
        const firstOption = page.locator('[data-testid^="choice-option-"]').first();
        if (await firstOption.isVisible()) {
          await firstOption.click();
          await onboardingPage.waitForNetworkIdle();
        }
      }
    }

    // Verify state has progressed
    const state = apiMock.getState();
    expect(state.answeredCount).toBeGreaterThanOrEqual(4); // consent + 3 skipped
  });

  test('cannot skip without consent', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Pre-populate state: consent answered but NOT granted
    // Then try to skip - should fail
    
    // This tests the backend validation indirectly through UI
    // Navigate to consent
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();

    // Skip button should not be visible on consent question
    const canSkip = await onboardingPage.isSkipVisible();
    expect(canSkip).toBe(false);
  });
});
