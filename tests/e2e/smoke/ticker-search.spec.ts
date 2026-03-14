import { test, expect } from '../fixtures/api-mock';
import { OnboardingPage } from '../../utils/page-objects';

/**
 * SMOKE-05: Ticker search basic functionality
 * 
 * Test ID: OB-TC-106
 * Priority: P0
 * Expected Duration: ~25s
 */
test.describe('Ticker Search @smoke', () => {
  test.beforeEach(async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    
    // Pre-populate state to reach ticker search question faster
    apiMock.setConsent(true);
    apiMock.addAnswer('consent_personalization', { value: 'accept', skipped: false });
    apiMock.addAnswer('job_title', { skipped: true });
    apiMock.addAnswer('industry', { skipped: true });
    apiMock.addAnswer('experience_years', { skipped: true });
    apiMock.addAnswer('investment_goal', { skipped: true });
    apiMock.addAnswer('risk_tolerance', { skipped: true });
    apiMock.addAnswer('time_availability', { skipped: true });
    apiMock.addAnswer('watchlist_sectors', { skipped: true });
    apiMock.addAnswer('delivery_time', { skipped: true });
    
    // Navigate - should be at watchlist_tickers
    await onboardingPage.goto();
  });

  test('can search and select a ticker', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.waitForQuestion();

    // Verify we're at ticker search question
    await expect(onboardingPage.questionTitle).toContainText('관심 종목');

    // Wait for input to be ready
    await expect(onboardingPage.tickerSearchInput).toBeVisible();
    await expect(onboardingPage.tickerSearchInput).toBeEnabled();
    
    // Focus the input first
    await onboardingPage.tickerSearchInput.focus();
    await page.waitForTimeout(100);
    
    // Type using keyboard
    await page.keyboard.type('AAPL', { delay: 100 });
    
    // Wait for debounce (150ms) + rendering
    await page.waitForTimeout(500);
    

    // Wait for suggestions to appear
    const suggestion = page.locator('[data-testid="ticker-suggestion-AAPL"]');
    await expect(suggestion).toBeVisible({ timeout: 5000 });

    // Click suggestion
    await suggestion.click();
    
    // Wait for chip animation
    await page.waitForTimeout(300);

    // Verify chip appears
    const hasChip = await onboardingPage.hasTickerChip('AAPL');
    expect(hasChip).toBe(true);
  });

  test('can select multiple tickers', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.waitForQuestion();

    // Select AAPL using helper method
    await onboardingPage.selectTicker('AAPL');
    
    // Select MSFT using helper method
    await onboardingPage.selectTicker('MSFT');

    // Both chips should be visible
    expect(await onboardingPage.hasTickerChip('AAPL')).toBe(true);
    expect(await onboardingPage.hasTickerChip('MSFT')).toBe(true);
  });

  test('can remove selected ticker', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.waitForQuestion();

    // Select AAPL using helper method
    await onboardingPage.selectTicker('AAPL');

    // Verify chip exists
    expect(await onboardingPage.hasTickerChip('AAPL')).toBe(true);

    // Remove it
    await onboardingPage.removeTicker('AAPL');
    
    // Wait for animation
    await page.waitForTimeout(300);

    // Chip should be gone
    const chip = page.locator('[data-testid="ticker-chip-AAPL"]');
    await expect(chip).not.toBeVisible();
  });

  test('ticker search can be skipped', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.waitForQuestion();

    // Skip should be available
    const canSkip = await onboardingPage.isSkipVisible();
    expect(canSkip).toBe(true);

    // Skip to next question
    await onboardingPage.skip();

    // Should have advanced
    const state = apiMock.getState();
    expect(state.answeredCount).toBeGreaterThanOrEqual(10);
  });

  test('BRK.B ticker works correctly', async ({ page, apiMock }) => {
    const onboardingPage = new OnboardingPage(page);
    await onboardingPage.waitForQuestion();

    // Select BRK.B (special case with period in symbol) using helper method
    await onboardingPage.selectTicker('BRK.B');

    // Chip should appear
    expect(await onboardingPage.hasTickerChip('BRK.B')).toBe(true);
  });
});
