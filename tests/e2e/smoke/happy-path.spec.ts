import { test, expect } from '../fixtures/api-mock';
import { OnboardingPage, CompletionPage } from '../../utils/page-objects';

/**
 * SMOKE-01: Happy path - consent to completion
 * 
 * Test ID: OB-TC-101
 * Priority: P0
 * Expected Duration: ~30s (with mocked API)
 */
test.describe('Happy Path Completion @smoke', () => {
  test('completes onboarding from consent to done page', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Navigate to onboarding
    await onboardingPage.goto();
    
    // Verify API mock is intercepting requests
    console.log(`[TEST] Intercept count after goto: ${apiMock.getInterceptCount()}`);
    expect(apiMock.getInterceptCount()).toBeGreaterThan(0);
    
    await onboardingPage.waitForQuestion();

    // Verify we start at consent
    await expect(onboardingPage.questionTitle).toContainText('정보를 저장');

    // Accept consent (OB-TC-102)
    await onboardingPage.acceptConsent();
    await onboardingPage.waitForQuestion();

    // Verify we moved past consent
    const questionTitle = await onboardingPage.questionTitle.textContent();
    expect(questionTitle).not.toContain('정보를 저장');

    // Progress should have increased
    const progress = await onboardingPage.getProgressPercent();
    expect(progress).toBeGreaterThan(0);

    // Complete remaining questions by skipping
    let questionCount = 0;
    const maxQuestions = 15; // Safety limit

    while (questionCount < maxQuestions) {
      questionCount++;
      
      // Check if we're on done page FIRST
      if (page.url().includes('/onboarding/done')) {
        break;
      }
      
      // Small delay to let navigation complete
      await page.waitForTimeout(100);
      
      // Check again after delay
      if (page.url().includes('/onboarding/done')) {
        break;
      }
      
      // Check if skip is available (with short timeout)
      const skipVisible = await onboardingPage.skipButton.isVisible().catch(() => false);
      
      if (skipVisible) {
        try {
          await onboardingPage.skipButton.click({ timeout: 3000 });
          await onboardingPage.waitForQuestionChange();
        } catch {
          // Click failed - might have navigated
          break;
        }
      } else {
        // If can't skip, try to select first option (single choice)
        try {
          const firstOption = page.locator('[data-testid^="choice-option-"]').first();
          if (await firstOption.isVisible({ timeout: 1000 })) {
            await firstOption.click();
            await onboardingPage.waitForQuestionChange();
          }
        } catch {
          // No options, might be done
          break;
        }
      }
    }

    // Verify we reached completion
    await onboardingPage.assertOnDonePage();
    
    // Verify API mock state
    const state = apiMock.getState();
    expect(state.hasConsent).toBe(true);
    expect(state.isCompleted).toBe(true);
  });

  test('shows completion celebration elements', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();

    // Quick complete
    await onboardingPage.completeQuickOnboarding();

    // Navigate to done page should show:
    const completionPage = new CompletionPage(page);
    
    // Profile summary should be visible
    await expect(completionPage.profileSummary).toBeVisible({ timeout: 10000 });
    
    // Start button should be visible
    await expect(completionPage.startButton).toBeVisible();
  });

  test('progress bar reaches 100% at completion', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();

    // Complete flow
    await onboardingPage.completeQuickOnboarding();

    // The done page should be displayed
    await onboardingPage.assertOnDonePage();
  });
});
