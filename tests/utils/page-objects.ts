import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object for Onboarding flow
 * Provides reusable methods for E2E tests
 * 
 * NOTE: Avoids `networkidle` which hangs in Next.js dev mode due to HMR.
 * Uses UI-based waits (element visibility) instead.
 */
export class OnboardingPage {
  readonly page: Page;

  // Shell elements
  readonly progressBar: Locator;
  readonly backButton: Locator;
  readonly skipButton: Locator;
  readonly continueButton: Locator;
  readonly loadingSkeleton: Locator;
  readonly errorBanner: Locator;

  // Question elements
  readonly questionTitle: Locator;
  readonly questionDescription: Locator;

  // Consent
  readonly consentAcceptButton: Locator;
  readonly consentDeclineButton: Locator;

  // Ticker search
  readonly tickerSearchInput: Locator;
  readonly tickerSuggestions: Locator;

  // Time picker
  readonly timePickerInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Shell
    this.progressBar = page.locator('[data-testid="progress-bar"]');
    this.backButton = page.locator('[data-testid="back-btn"]');
    this.skipButton = page.locator('[data-testid="skip-btn"]');
    this.continueButton = page.locator('[data-testid="continue-btn"]');
    this.loadingSkeleton = page.locator('[data-testid="loading-skeleton"]');
    this.errorBanner = page.locator('[data-testid="error-banner"]');

    // Question
    this.questionTitle = page.locator('[data-testid="question-title"]');
    this.questionDescription = page.locator('[data-testid="question-description"]');

    // Consent
    this.consentAcceptButton = page.locator('[data-testid="consent-accept-btn"]');
    this.consentDeclineButton = page.locator('[data-testid="consent-decline-btn"]');

    // Ticker search
    this.tickerSearchInput = page.locator('[data-testid="ticker-search-input"]');
    this.tickerSuggestions = page.locator('[data-testid="ticker-suggestions"]');

    // Time picker
    this.timePickerInput = page.locator('[data-testid="time-picker-input"]');
  }

  /**
   * Navigate to onboarding page
   */
  async goto() {
    await this.page.goto('/onboarding', { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  /**
   * Wait for page to finish loading (UI-based, no networkidle)
   */
  async waitForPageLoad() {
    // Wait for DOM to be ready
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for either question title OR loading skeleton to appear
    await Promise.race([
      this.questionTitle.waitFor({ state: 'visible', timeout: 10000 }),
      this.loadingSkeleton.waitFor({ state: 'visible', timeout: 10000 }),
    ]).catch(() => {
      // Neither appeared - page might be in error state or empty
    });
    
    // If skeleton appeared, wait for it to disappear
    if (await this.loadingSkeleton.isVisible()) {
      await this.loadingSkeleton.waitFor({ state: 'hidden', timeout: 10000 });
    }
  }

  /**
   * Wait for question to be displayed
   */
  async waitForQuestion() {
    await this.questionTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Get current question key from URL or data attribute
   */
  async getCurrentQuestionKey(): Promise<string | null> {
    const url = this.page.url();
    const match = url.match(/step=([^&]+)/);
    return match ? match[1] : null;
  }

  /**
   * Get progress percentage
   */
  async getProgressPercent(): Promise<number> {
    const value = await this.progressBar.getAttribute('aria-valuenow');
    return value ? parseInt(value, 10) : 0;
  }

  /**
   * Accept consent
   */
  async acceptConsent() {
    await this.consentAcceptButton.click();
    // Wait for next question to appear (UI-based wait)
    await this.waitForQuestionChange();
  }

  /**
   * Decline consent
   */
  async declineConsent() {
    await this.consentDeclineButton.click();
    // Wait for redirect to declined page
    await this.page.waitForURL(/\/onboarding\/declined/, { timeout: 10000 });
  }

  /**
   * Select a single choice option by value
   */
  async selectOption(value: string) {
    const option = this.page.locator(`[data-testid="choice-option-${value}"]`);
    await option.click();
    // Wait for question to change
    await this.waitForQuestionChange();
  }

  /**
   * Toggle a multi-choice option by value
   */
  async toggleMultiOption(value: string) {
    const option = this.page.locator(`[data-testid="choice-option-${value}"]`);
    await option.click();
  }

  /**
   * Click continue button (for multi-choice)
   */
  async clickContinue() {
    await this.continueButton.click();
    await this.waitForQuestionChange();
  }

  /**
   * Skip current question
   * Waits for button to be stable (animation complete) before clicking
   */
  async skip() {
    // Wait for skip button to be visible and stable
    await this.skipButton.waitFor({ state: 'visible', timeout: 5000 });
    // Small delay to allow Framer Motion animations to settle
    await this.page.waitForTimeout(300);
    await this.skipButton.click();
    await this.waitForQuestionChange();
  }

  /**
   * Go back to previous question
   */
  async goBack() {
    await this.backButton.click();
    await this.waitForQuestionChange();
  }

  /**
   * Enter text in current question
   */
  async enterText(text: string) {
    const input = this.page.locator('[data-testid="text-input"]');
    await input.fill(text);
    await this.continueButton.click();
    await this.waitForQuestionChange();
  }

  /**
   * Search and select a ticker
   * Uses pressSequentially to properly trigger React onChange
   */
  async selectTicker(symbol: string) {
    // Click to focus the input
    await this.tickerSearchInput.click();
    // Clear any existing text
    await this.tickerSearchInput.clear();
    // Type character by character to trigger React onChange properly
    await this.tickerSearchInput.pressSequentially(symbol, { delay: 50 });
    // Wait for debounce (150ms) + some buffer
    await this.page.waitForTimeout(300);
    // Wait for suggestions dropdown to appear
    await this.page.waitForSelector(`[data-testid="ticker-suggestion-${symbol}"]`, {
      timeout: 5000,
    });
    await this.page.locator(`[data-testid="ticker-suggestion-${symbol}"]`).click();
    // Wait for chip animation to complete
    await this.page.waitForTimeout(300);
  }

  /**
   * Remove a selected ticker
   */
  async removeTicker(symbol: string) {
    await this.page.locator(`[data-testid="remove-ticker-${symbol}"]`).click();
  }

  /**
   * Check if ticker chip exists
   * Waits briefly for animation to complete
   */
  async hasTickerChip(symbol: string): Promise<boolean> {
    const chip = this.page.locator(`[data-testid="ticker-chip-${symbol}"]`);
    // Wait for chip animation to complete
    await this.page.waitForTimeout(500);
    return chip.isVisible();
  }

  /**
   * Select time
   */
  async selectTime(time: string) {
    await this.timePickerInput.fill(time);
    await this.continueButton.click();
    await this.waitForQuestionChange();
  }

  /**
   * Select time preset
   */
  async selectTimePreset(preset: string) {
    const presetButton = this.page.locator(`[data-testid="time-preset-${preset}"]`);
    await presetButton.click();
    await this.waitForQuestionChange();
  }

  /**
   * Check if skip button is visible
   */
  async isSkipVisible(): Promise<boolean> {
    return this.skipButton.isVisible();
  }

  /**
   * Check if back button is visible
   */
  async isBackVisible(): Promise<boolean> {
    return this.backButton.isVisible();
  }

  /**
   * Check if error banner is visible
   */
  async isErrorVisible(): Promise<boolean> {
    return this.errorBanner.isVisible();
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    const text = await this.errorBanner.textContent();
    return text ?? '';
  }

  /**
   * Wait for API response (for specific assertions)
   */
  async waitForAnswer() {
    await this.page.waitForResponse(
      (resp) => resp.url().includes('/api/onboarding/answer'),
      { timeout: 10000 }
    );
  }

  /**
   * Wait for question to change (UI-based wait)
   * Waits for either:
   * - New question title to appear
   * - Redirect to done/declined page
   * - Error banner to appear
   */
  async waitForQuestionChange() {
    // Short delay to allow React state update
    await this.page.waitForTimeout(100);
    
    // Wait for one of these conditions
    await Promise.race([
      // Question title visible (next question loaded)
      this.questionTitle.waitFor({ state: 'visible', timeout: 5000 }),
      // Redirected to done page
      this.page.waitForURL(/\/onboarding\/done/, { timeout: 5000 }),
      // Redirected to declined page
      this.page.waitForURL(/\/onboarding\/declined/, { timeout: 5000 }),
      // Error appeared
      this.errorBanner.waitFor({ state: 'visible', timeout: 5000 }),
    ]).catch(() => {
      // Timeout is acceptable - might already be on target state
    });
  }

  /**
   * @deprecated Use waitForQuestionChange() instead. networkidle hangs in Next.js dev.
   */
  async waitForNetworkIdle() {
    // NO-OP: Replaced with UI-based waits
    // networkidle hangs indefinitely in Next.js dev mode due to HMR
    await this.waitForQuestionChange();
  }

  /**
   * Assert we're on the done page
   */
  async assertOnDonePage() {
    await expect(this.page).toHaveURL(/\/onboarding\/done/, { timeout: 10000 });
  }

  /**
   * Assert we're on the declined page
   */
  async assertOnDeclinedPage() {
    await expect(this.page).toHaveURL(/\/onboarding\/declined/, { timeout: 10000 });
  }

  /**
   * Complete onboarding by answering all questions with defaults
   */
  async completeQuickOnboarding() {
    // Consent
    await this.acceptConsent();
    
    // Wait for first question after consent
    await this.waitForQuestion();

    // Skip all skippable questions
    let iterations = 0;
    const maxIterations = 15; // Safety limit
    
    while (iterations < maxIterations) {
      iterations++;
      
      // Check if we're on done or declined page
      const currentUrl = this.page.url();
      if (currentUrl.includes('/onboarding/done') || currentUrl.includes('/onboarding/declined')) {
        break;
      }
      
      // Small delay to let any navigation complete
      await this.page.waitForTimeout(200);
      
      // Check again after delay
      const urlAfterDelay = this.page.url();
      if (urlAfterDelay.includes('/onboarding/done') || urlAfterDelay.includes('/onboarding/declined')) {
        break;
      }
      
      // Try to skip if available (with short timeout)
      const skipVisible = await this.skipButton.isVisible().catch(() => false);
      if (skipVisible) {
        try {
          await this.skipButton.click({ timeout: 3000 });
          await this.waitForQuestionChange();
        } catch {
          // Click failed - might have navigated away
          break;
        }
      } else {
        // Try to select first option if it's a choice question
        const firstOption = this.page.locator('[data-testid^="choice-option-"]').first();
        if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
          await firstOption.click();
          await this.waitForQuestionChange();
        } else {
          // No skip, no options - might be done or stuck
          break;
        }
      }
    }
  }
}

/**
 * Page Object for Completion page
 */
export class CompletionPage {
  readonly page: Page;
  readonly profileSummary: Locator;
  readonly startButton: Locator;
  readonly confetti: Locator;

  constructor(page: Page) {
    this.page = page;
    this.profileSummary = page.locator('[data-testid="profile-summary"]');
    this.startButton = page.locator('[data-testid="start-btn"]');
    this.confetti = page.locator('[data-testid="confetti"]');
  }

  async clickStart() {
    await this.startButton.click();
    // Wait for navigation (UI-based)
    await this.page.waitForURL(/\/dashboard/, { timeout: 10000 }).catch(() => {
      // Might navigate elsewhere
    });
  }
}

/**
 * Page Object for Declined page
 */
export class DeclinedPage {
  readonly page: Page;
  readonly retryButton: Locator;
  readonly learnMoreLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.retryButton = page.locator('[data-testid="retry-btn"]');
    this.learnMoreLink = page.locator('[data-testid="learn-more-link"]');
  }

  async clickRetry() {
    await this.retryButton.click();
    // Wait for navigation back to onboarding
    await this.page.waitForURL(/\/onboarding/, { timeout: 10000 });
  }
}
