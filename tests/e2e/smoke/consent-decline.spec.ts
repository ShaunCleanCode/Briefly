import { test, expect } from '../fixtures/api-mock';
import { OnboardingPage, DeclinedPage } from '../../utils/page-objects';

/**
 * SMOKE-02: Consent decline path
 * 
 * Test ID: OB-TC-103
 * Priority: P0
 * Expected Duration: ~15s
 */
test.describe('Consent Decline @smoke', () => {
  test('redirects to declined page when consent is declined', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Navigate to onboarding
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();

    // Verify we start at consent
    await expect(onboardingPage.questionTitle).toContainText('정보를 저장');

    // Decline consent
    await onboardingPage.declineConsent();

    // Should redirect to declined page
    await onboardingPage.assertOnDeclinedPage();
    
    // Verify API state - consent was NOT granted
    const state = apiMock.getState();
    expect(state.hasConsent).toBe(false);
  });

  test('declined page shows retry option', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    const declinedPage = new DeclinedPage(page);
    
    // Navigate and decline
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();
    await onboardingPage.declineConsent();

    // Verify declined page elements
    await expect(declinedPage.retryButton).toBeVisible({ timeout: 5000 });
  });

  test('retry from declined page continues onboarding', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    const declinedPage = new DeclinedPage(page);
    
    // Navigate and decline
    await onboardingPage.goto();
    await onboardingPage.waitForQuestion();
    await onboardingPage.declineConsent();
    
    // Wait for declined page
    await onboardingPage.assertOnDeclinedPage();

    // Click retry (this accepts consent via PATCH and navigates to /onboarding)
    await declinedPage.clickRetry();

    // Should be on onboarding page with next question (consent accepted)
    await expect(page).toHaveURL(/\/onboarding$/);
    await onboardingPage.waitForQuestion();
    
    // Consent should now be accepted, so we should see the next question (not consent)
    // The mock state should show consent is granted
    const state = apiMock.getState();
    expect(state.hasConsent).toBe(true);
  });
});
